// Test de bout en bout du critère de l'étape É0 :
// « se connecter, bouger, revenir plus tard et retrouver son personnage ».

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocket } from "ws";
import { FERMETURE_JETON_REFUSE, FERMETURE_REMPLACE, type MessageServeur, type ReponseAuth } from "../../commun/src/messages.ts";
import { POINT_ARRIVEE } from "../../commun/src/regles.ts";
import { APPARENCES_DE_REFERENCE } from "../../commun/src/apparence.ts";
import { rendreSilencieux } from "./journal.ts";
import { demarrerServeur } from "./serveur.ts";

rendreSilencieux(true);
const dossierTests = join(dirname(fileURLToPath(import.meta.url)), "..", "donnees", "tests-e2e");

async function poster(port: number, chemin: string, corps: unknown): Promise<{ statut: number; reponse: ReponseAuth }> {
  const res = await fetch(`http://127.0.0.1:${port}${chemin}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corps),
  });
  return { statut: res.status, reponse: (await res.json()) as ReponseAuth };
}

/** Ouvre une connexion de jeu et collecte les messages reçus. */
function connecter(port: number, jeton: string) {
  const socket = new WebSocket(`ws://127.0.0.1:${port}/ws?jeton=${jeton}`);
  const recus: MessageServeur[] = [];
  socket.on("message", (d) => recus.push(JSON.parse(d.toString()) as MessageServeur));
  const fermeture = new Promise<number>((resolve) => socket.on("close", (code) => resolve(code)));
  const attendre = async (t: MessageServeur["t"], delai = 2000): Promise<MessageServeur> => {
    const debut = Date.now();
    while (Date.now() - debut < delai) {
      const trouve = recus.findLast((m) => m.t === t);
      if (trouve) return trouve;
      await new Promise((r) => setTimeout(r, 20));
    }
    throw new Error(`Pas de message « ${t} » reçu`);
  };
  return { socket, recus, fermeture, attendre };
}

test("É0 : inscription, déplacement, départ, retour au même endroit", async () => {
  mkdirSync(dossierTests, { recursive: true });
  const cheminBase = join(dossierTests, `e2e-${process.pid}.sqlite`);
  let serveur = await demarrerServeur({ port: 0, hote: "127.0.0.1", cheminBase });
  try {
    // Inscription
    const inscription = await poster(serveur.port, "/api/inscription", { pseudo: "Nadia", motDePasse: "enclume42", famille: "charbonniers" });
    assert.equal(inscription.statut, 201);
    assert.ok(inscription.reponse.ok);
    const jeton = inscription.reponse.jeton;

    // Pseudo déjà pris, mot de passe trop court, famille inconnue
    assert.equal((await poster(serveur.port, "/api/inscription", { pseudo: "nadia", motDePasse: "autre123", famille: "mecanistes" })).statut, 409);
    assert.equal((await poster(serveur.port, "/api/inscription", { pseudo: "Rose", motDePasse: "123", famille: "mecanistes" })).statut, 400);
    assert.equal((await poster(serveur.port, "/api/inscription", { pseudo: "Rose", motDePasse: "potager42", famille: "pirates" })).statut, 400);

    // Connexion au jeu : on arrive au point d'arrivée
    const c1 = connecter(serveur.port, jeton);
    const bienvenue = await c1.attendre("bienvenue");
    assert.ok(bienvenue.t === "bienvenue");
    assert.equal(bienvenue.moi.famille, "charbonniers");
    assert.equal(bienvenue.position.x, POINT_ARRIVEE.x);

    // On marche vers +x pendant ≈ 0,5 s
    c1.socket.send(JSON.stringify({ t: "intention", dx: 1, dz: 0, allure: "marche", seq: 1 }));
    await new Promise((r) => setTimeout(r, 500));
    c1.socket.send(JSON.stringify({ t: "intention", dx: 0, dz: 0, allure: "marche", seq: 2 }));
    await new Promise((r) => setTimeout(r, 150));
    const etat = await c1.attendre("etat");
    assert.ok(etat.t === "etat");
    assert.ok(etat.position.x > POINT_ARRIVEE.x + 0.5, `le personnage a avancé (x = ${etat.position.x})`);
    const positionQuittee = etat.position;

    // Une intention invalide est ignorée
    c1.socket.send(JSON.stringify({ t: "intention", dx: 1e9, dz: Number.NaN, allure: "vol", seq: 3 }));

    // Départ : on ferme l'onglet
    c1.socket.close();
    await c1.fermeture;
    await new Promise((r) => setTimeout(r, 50));

    // Le serveur redémarre (« le lendemain »)
    await serveur.fermer();
    serveur = await demarrerServeur({ port: 0, hote: "127.0.0.1", cheminBase });

    // Retour avec le même jeton : même endroit
    const c2 = connecter(serveur.port, jeton);
    const retour = await c2.attendre("bienvenue");
    assert.ok(retour.t === "bienvenue");
    // Au millimètre : les positions envoyées sont arrondies.
    assert.ok(Math.abs(retour.position.x - positionQuittee.x) < 1e-3);
    assert.ok(Math.abs(retour.position.z - positionQuittee.z) < 1e-3);

    // Connexion par mot de passe : on obtient un nouveau jeton valide
    const connexion = await poster(serveur.port, "/api/connexion", { pseudo: "NADIA", motDePasse: "enclume42" });
    assert.equal(connexion.statut, 200);
    assert.equal((await poster(serveur.port, "/api/connexion", { pseudo: "Nadia", motDePasse: "faux" })).statut, 401);

    // Le même compte ouvert ailleurs remplace l'ancienne connexion
    assert.ok(connexion.reponse.ok);
    const c3 = connecter(serveur.port, connexion.reponse.jeton);
    await c3.attendre("bienvenue");
    assert.equal(await c2.fermeture, FERMETURE_REMPLACE);
    c3.socket.close();

    // Un faux jeton est refusé
    const intrus = connecter(serveur.port, "faux");
    assert.equal(await intrus.fermeture, FERMETURE_JETON_REFUSE);
  } finally {
    await serveur.fermer();
    rmSync(dossierTests, { recursive: true, force: true });
  }
});

test("trop de mots de passe faux : le serveur fait attendre (0.1.1)", async () => {
  mkdirSync(dossierTests, { recursive: true });
  const cheminBase = join(dossierTests, `limite-${process.pid}.sqlite`);
  const serveur = await demarrerServeur({ port: 0, hote: "127.0.0.1", cheminBase });
  try {
    assert.equal((await poster(serveur.port, "/api/inscription", { pseudo: "Lucie", motDePasse: "verger42", famille: "voltaiques" })).statut, 201);
    for (let i = 0; i < 10; i++) assert.equal((await poster(serveur.port, "/api/connexion", { pseudo: "Lucie", motDePasse: `faux${i}xx` })).statut, 401);
    // Le onzième essai est refusé sans même regarder le mot de passe, même le bon.
    assert.equal((await poster(serveur.port, "/api/connexion", { pseudo: "Lucie", motDePasse: "verger42" })).statut, 429);
  } finally {
    await serveur.fermer();
    rmSync(dossierTests, { recursive: true, force: true });
  }
});

test("écrans d'accueil : l'inscription dit « nouveau » et renvoie l'apparence ; la connexion, jamais (0.7.1)", async () => {
  const serveur = await demarrerServeur({ port: 0, hote: "127.0.0.1", cheminBase: ":memory:" });
  try {
    const choisie = { silhouette: "masculine", taille: 0.8, corpulence: 0.3, peau: 5, coiffure: "ras", cheveux: 3, barbe: true };
    const creation = await poster(serveur.port, "/api/inscription", { pseudo: "Malik", motDePasse: "pylone42", famille: "voltaiques", apparence: choisie });
    assert.equal(creation.statut, 201);
    assert.ok(creation.reponse.ok);
    assert.equal(creation.reponse.nouveau, true);
    assert.deepEqual(creation.reponse.apparence, choisie, "l'apparence enregistrée : l'écran n° 1 montre CE personnage");

    // Un ancien client (sans apparence) : celle de référence de la famille, renvoyée quand même.
    const ancien = await poster(serveur.port, "/api/inscription", { pseudo: "Rose", motDePasse: "potager42", famille: "mecanistes" });
    assert.ok(ancien.reponse.ok);
    assert.equal(ancien.reponse.nouveau, true);
    assert.deepEqual(ancien.reponse.apparence, APPARENCES_DE_REFERENCE.mecanistes);

    // Une simple connexion, même juste après la création : pas d'accueil.
    const connexion = await poster(serveur.port, "/api/connexion", { pseudo: "Malik", motDePasse: "pylone42" });
    assert.equal(connexion.statut, 200);
    assert.ok(connexion.reponse.ok);
    assert.equal(connexion.reponse.nouveau, false);
    assert.equal(connexion.reponse.apparence, undefined);
  } finally {
    await serveur.fermer();
  }
});
