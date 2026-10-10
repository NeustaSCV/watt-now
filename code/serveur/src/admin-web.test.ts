// La page d'administration sur le réseau local (P-014, chantier 16 de la 0.8) : ouverte à toute adresse et à tout nom
// d'hôte depuis la 0.8.1 (plus de liste blanche), le port du jeu qui ne sert aucune route d'admin, la suppression en cascade (déconnexion d'abord), la
// réinitialisation (ancien mot de passe refusé, jetons effacés, provisoire affiché), « god » protégé, aucune mesure écrite.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, rmSync } from "node:fs";
import { request } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { WebSocket } from "ws";
import { FERMETURE_JETON_REFUSE, type MessageServeur } from "../../commun/src/messages.ts";
import { demarrerAdminWeb, motDePasseProvisoire } from "./admin-web.ts";
import { CompteProtege } from "./base.ts";
import { rendreSilencieux } from "./journal.ts";
import { demarrerServeur } from "./serveur.ts";

rendreSilencieux(true);
const dossierTests = join(dirname(fileURLToPath(import.meta.url)), "..", "donnees", "tests-admin-web");

test("Le mot de passe provisoire : trois groupes de quatre, sans caractères ambigus, jamais le même", () => {
  const vus = new Set<string>();
  for (let i = 0; i < 200; i++) {
    const m = motDePasseProvisoire();
    assert.match(m, /^[a-hj-km-np-z2-9]{4}-[a-hj-km-np-z2-9]{4}-[a-hj-km-np-z2-9]{4}$/);
    vus.add(m);
  }
  assert.equal(vus.size, 200);
});

/** Une requête HTTP dont on choisit tout (le Host, l'Origin), ce que fetch ne permet pas. */
function requete(port: number, methode: string, chemin: string, corps?: string, entetes: Record<string, string> = {}): Promise<{ statut: number; html: string }> {
  return new Promise((resolve, reject) => {
    const r = request(
      {
        host: "127.0.0.1",
        port,
        method: methode,
        path: chemin,
        headers: { Host: `127.0.0.1:${port}`, ...(corps !== undefined ? { "Content-Type": "application/x-www-form-urlencoded" } : {}), ...entetes },
      },
      (res) => {
        let html = "";
        res.setEncoding("utf8");
        res.on("data", (d: string) => (html += d));
        res.on("end", () => resolve({ statut: res.statusCode ?? 0, html }));
      },
    );
    r.on("error", reject);
    if (corps !== undefined) r.write(corps);
    r.end();
  });
}

/** Une connexion de jeu : on attend la bienvenue, et l'on garde le code de fermeture. */
async function connecter(port: number, jeton: string) {
  const socket = new WebSocket(`ws://127.0.0.1:${port}/ws?jeton=${jeton}`);
  const recus: MessageServeur[] = [];
  socket.on("message", (d) => recus.push(JSON.parse(d.toString()) as MessageServeur));
  const fermeture = new Promise<number>((resolve) => socket.on("close", (code) => resolve(code)));
  const debut = Date.now();
  while (!recus.some((m) => m.t === "bienvenue")) {
    if (Date.now() - debut > 3000) throw new Error("Pas de bienvenue");
    await new Promise((r) => setTimeout(r, 20));
  }
  return { socket, fermeture };
}

test("La page d'administration : ouverte à toute adresse, port du jeu muet, réinitialisation, suppression en cascade, god protégé", async () => {
  mkdirSync(dossierTests, { recursive: true });
  const cheminBase = join(dossierTests, `admin-${process.pid}.sqlite`);
  const jeu = await demarrerServeur({ port: 0, hote: "127.0.0.1", cheminBase });
  // L'adresse que la page croit voir : on joue tour à tour un poste du réseau local, de la DMZ, d'ailleurs.
  let adresse = "127.0.0.1";
  const admin = await demarrerAdminWeb({ port: 0, hote: "127.0.0.1", base: jeu.base, monde: jeu.monde, adresseDe: () => adresse });
  const base = jeu.base;
  try {
    const nadia = base.creerCompte("Nadia", "enclume42", "charbonniers");
    const rose = base.creerCompte("Rose", "potager42", "mecanistes");
    const god = base.creerCompte("god", "toutpuissant", "voltaiques", false, null, true);
    base.designerAdmin(god.id);

    // ---- Plus de liste blanche (0.8.1) : la DMZ, le pont Docker, un nom d'hôte, tout passe ----
    for (const a of ["192.168.254.20", "::ffff:192.168.254.99", "10.0.0.5", "172.17.0.1", "::ffff:192.168.1.20"]) {
      adresse = a;
      const r = await requete(admin.port, "GET", "/");
      assert.equal(r.statut, 200, a);
      assert.match(r.html, /Nadia/);
    }
    adresse = "127.0.0.1";
    const accueil = await requete(admin.port, "GET", "/");
    assert.equal(accueil.statut, 200);
    assert.match(accueil.html, /Personne n'est connecté/);
    assert.match(accueil.html, /Rose/);
    assert.equal((await requete(admin.port, "GET", "/", undefined, { Host: "preprod.example.org:4321" })).statut, 200, "un nom d'hôte passe aussi");

    // ---- Le port du jeu ne sert aucune route d'admin ----
    for (const [methode, chemin] of [
      ["GET", "/"],
      ["GET", `/joueur/${nadia.id}`],
      ["POST", `/joueur/${nadia.id}/supprimer`],
      ["POST", `/joueur/${nadia.id}/mot-de-passe`],
    ] as const) {
      const r = await requete(jeu.port, methode, chemin, methode === "POST" ? "pseudo=Nadia" : undefined);
      assert.equal(r.statut, 404, `${methode} ${chemin} sur le port du jeu`);
    }
    assert.ok(base.verifierIdentifiants("Nadia", "enclume42"), "le port du jeu n'a rien changé");

    // ---- Consulter n'écrit aucune mesure ----
    const db = new DatabaseSync(cheminBase);
    const nombreMesures = () => (db.prepare("SELECT COUNT(*) AS n FROM mesures").get() as { n: number }).n;
    base.mesurer({ instant: 1, compteId: rose.id, famille: "mecanistes", genre: "progression", quoi: "recette", valeur: 1 });
    const avant = nombreMesures();
    for (const chemin of ["/", `/joueur/${nadia.id}`, `/joueur/${rose.id}`, `/joueur/${god.id}`, `/joueur/${nadia.id}?confirmer=mot-de-passe`]) {
      assert.equal((await requete(admin.port, "GET", chemin)).statut, 200, chemin);
    }
    assert.equal(nombreMesures(), avant, "aucune mesure écrite par la consultation");
    const ficheRose = await requete(admin.port, "GET", `/joueur/${rose.id}`);
    assert.match(ficheRose.html, /Mécanistes/);
    assert.match(ficheRose.html, /progression/, "ses mesures existantes sont montrées");
    assert.match(ficheRose.html, /Supprimer définitivement/);
    const confirmer = await requete(admin.port, "GET", `/joueur/${nadia.id}?confirmer=mot-de-passe`);
    assert.match(confirmer.html, /Oui, réinitialiser/, "la confirmation est dans la page, avec un bouton");
    assert.doesNotMatch(confirmer.html, /<script|confirm\(/);

    // ---- Les connectés ----
    const jetonNadia = base.creerJeton(nadia.id);
    base.creerJeton(nadia.id);
    const cNadia = await connecter(jeu.port, jetonNadia);
    const avecNadia = await requete(admin.port, "GET", "/");
    assert.match(avecNadia.html, /1 joueur connecté/);
    assert.match(avecNadia.html, /Charbonniers/);
    assert.match(avecNadia.html, /Son terrain/);

    // ---- Réinitialiser : provisoire affiché, ancien refusé, jetons effacés, déconnecté ----
    // « Origin: null » (une page sans origine) : refusé ; notre propre origine : acceptée.
    assert.equal((await requete(admin.port, "POST", `/joueur/${nadia.id}/mot-de-passe`, "", { Origin: "null" })).statut, 403);
    assert.ok(base.verifierIdentifiants("Nadia", "enclume42"));
    const reinit = await requete(admin.port, "POST", `/joueur/${nadia.id}/mot-de-passe`, "", { Origin: `http://127.0.0.1:${admin.port}` });
    assert.equal(reinit.statut, 200);
    const provisoire = /class="provisoire">([^<]+)</.exec(reinit.html)?.[1];
    assert.ok(provisoire, "le mot de passe provisoire est affiché");
    assert.equal(base.verifierIdentifiants("Nadia", "enclume42"), null, "l'ancien mot de passe est refusé");
    assert.equal(base.verifierIdentifiants("Nadia", provisoire)?.id, nadia.id, "le provisoire marche");
    assert.equal(base.compteParJeton(jetonNadia), null, "les jetons sont effacés");
    assert.equal(base.ficheCompte(nadia.id)?.sessions, 0);
    assert.equal(await cNadia.fermeture, FERMETURE_JETON_REFUSE, "Nadia est renvoyée à l'écran de connexion");
    assert.equal(jeu.monde.connectes().length, 0);
    // Il n'est affiché qu'une fois : la fiche ne le montre pas.
    assert.doesNotMatch((await requete(admin.port, "GET", `/joueur/${nadia.id}`)).html, new RegExp(provisoire));

    // ---- « god » protégé ----
    const versGod = await requete(admin.port, "POST", `/joueur/${god.id}/supprimer`, "pseudo=god");
    assert.equal(versGod.statut, 403);
    assert.equal((await requete(admin.port, "POST", `/joueur/${god.id}/mot-de-passe`, "")).statut, 403);
    assert.ok(base.verifierIdentifiants("god", "toutpuissant"), "god garde son mot de passe et son compte");
    assert.match((await requete(admin.port, "GET", `/joueur/${god.id}`)).html, /protégé/);
    assert.throws(() => base.supprimerCompte(god.id), CompteProtege);
    assert.throws(() => base.changerMotDePasse(god.id, "autre-chose"), CompteProtege);

    // ---- Un formulaire venu d'une autre page : refusé ----
    const piege = await requete(admin.port, "POST", `/joueur/${rose.id}/supprimer`, "pseudo=Rose", { Origin: "https://piege.example" });
    assert.equal(piege.statut, 403);
    assert.ok(base.compteParPseudo("Rose"));

    // ---- Supprimer : le pseudo retapé, la déconnexion d'abord, la cascade ----
    base.poserSac({ lieu: "station", terrainDe: 0, proprietaire: rose.id, x: 1, z: 1, contenu: { inventaire: { pierre: 2 }, charges: {} }, creeLe: 1 });
    base.poserSac({ lieu: "terrain", terrainDe: rose.id, proprietaire: nadia.id, x: 2, z: 2, contenu: { inventaire: { branche: 1 }, charges: {} }, creeLe: 1 });
    base.sauverInstance(`cooperative:${rose.id}`, { detruits: [1] }, 1);
    base.ecrireMonde(`forge:${rose.id}`, { essai: 1 });
    base.sauverDechets(`terrain:${rose.id}`, "3:4", 1, [0], 0);
    base.ajouterInstallation(rose.id, "coffre", 10, 10, 0);
    const cRose = await connecter(jeu.port, base.creerJeton(rose.id));

    const mauvais = await requete(admin.port, "POST", `/joueur/${rose.id}/supprimer`, "pseudo=rose");
    assert.equal(mauvais.statut, 400, "la casse compte : « rose » n'est pas « Rose »");
    assert.match(mauvais.html, /ne correspond pas/);
    assert.ok(base.compteParPseudo("Rose"));
    assert.equal(jeu.monde.connectes().length, 1, "une confirmation ratée ne déconnecte pas");

    // Son rythme de progression (arrivée à L1A en 95 min de jeu) reste, sans son nom ; ses autres mesures partent.
    base.mesurer({ instant: Date.now(), compteId: rose.id, famille: "voltaiques", genre: "progression", quoi: "atteint:L1A", valeur: 95, details: { pseudo: "Rose" } });
    const supprime = await requete(admin.port, "POST", `/joueur/${rose.id}/supprimer`, "pseudo=Rose");
    assert.equal(supprime.statut, 200);
    assert.match(supprime.html, /Compte supprimé/);
    assert.equal(await cRose.fermeture, FERMETURE_JETON_REFUSE, "Rose est déconnectée d'abord");
    assert.equal(base.compteParPseudo("Rose"), null);
    const reste = (sql: string, ...p: (string | number)[]) => (db.prepare(sql).get(...p) as { n: number }).n;
    for (const table of ["comptes"]) assert.equal(reste(`SELECT COUNT(*) AS n FROM ${table} WHERE id = ?`, rose.id), 0);
    for (const table of ["jetons", "personnages", "inventaires", "ressources", "feux", "installations", "mesures"]) {
      assert.equal(reste(`SELECT COUNT(*) AS n FROM ${table} WHERE compte_id = ?`, rose.id), 0, `${table} vidée`);
    }
    assert.equal(reste("SELECT COUNT(*) AS n FROM sacs WHERE proprietaire = ? OR terrain_de = ?", rose.id, rose.id), 0, "ses sacs, et ceux posés sur son terrain");
    assert.equal(reste("SELECT COUNT(*) AS n FROM instances WHERE cle = ?", `cooperative:${rose.id}`), 0, "sa Coopérative");
    assert.equal(reste("SELECT COUNT(*) AS n FROM ressources_lieux WHERE lieu = ?", `cooperative:${rose.id}`), 0);
    assert.equal(reste("SELECT COUNT(*) AS n FROM dechets WHERE lieu = ?", `terrain:${rose.id}`), 0, "ses déchets");
    assert.equal(reste("SELECT COUNT(*) AS n FROM monde WHERE cle = ?", `forge:${rose.id}`), 0, "sa forge");
    const rythme = db.prepare("SELECT compte_id, famille, valeur, details FROM mesures WHERE quoi = 'atteint:L1A'").all() as { compte_id: number; famille: string; valeur: number; details: string | null }[];
    assert.deepEqual(rythme.map((r) => ({ ...r })), [{ compte_id: 0, famille: "voltaiques", valeur: 95, details: null }], "le rythme reste, anonyme");
    // Les autres ne perdent rien.
    assert.ok(base.compteParPseudo("Nadia"));
    assert.ok(Object.keys(base.chargerInventaire(nadia.id)).length > 0, "le sac de Nadia est intact");
    assert.ok(reste("SELECT COUNT(*) AS n FROM ressources WHERE compte_id = ?", nadia.id) > 0, "le terrain de Nadia est intact");
    assert.equal((await requete(admin.port, "GET", `/joueur/${rose.id}`)).statut, 404);
    assert.doesNotMatch((await requete(admin.port, "GET", "/")).html, /Rose/);
    assert.equal(base.supprimerCompte(rose.id), false, "supprimer deux fois : rien à faire");

    // Réinitialiser un compte hors ligne n'écrit aucune mesure.
    const avantReinit = nombreMesures();
    assert.equal((await requete(admin.port, "POST", `/joueur/${nadia.id}/mot-de-passe`, "")).statut, 200);
    assert.equal(nombreMesures(), avantReinit, "aucune mesure écrite par la réinitialisation");
    db.close();
  } finally {
    await admin.fermer();
    await jeu.fermer();
    rmSync(dossierTests, { recursive: true, force: true });
  }
});
