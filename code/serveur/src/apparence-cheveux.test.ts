// La couleur de cheveux personnalisée (R8, 0.8.2), de bout en bout : envoyée à l'inscription, validée par le serveur,
// gardée en base, relue au retour du joueur ; une couleur invalide est refusée ; un personnage de la 0.8.1 se relit.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocket } from "ws";
import type { MessageServeur, ReponseAuth } from "../../commun/src/messages.ts";
import { APPARENCES_DE_REFERENCE, type Apparence } from "../../commun/src/apparence.ts";
import { Base } from "./base.ts";
import { rendreSilencieux } from "./journal.ts";
import { demarrerServeur } from "./serveur.ts";

rendreSilencieux(true);
const dossierTests = join(dirname(fileURLToPath(import.meta.url)), "..", "donnees", "tests-apparence");

async function poster(port: number, chemin: string, corps: unknown): Promise<ReponseAuth> {
  const res = await fetch(`http://127.0.0.1:${port}${chemin}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
  return (await res.json()) as ReponseAuth;
}

/** L'apparence que le serveur annonce au joueur à sa connexion (celle que les autres voient aussi). */
async function apparenceALaConnexion(port: number, jeton: string): Promise<Apparence> {
  const socket = new WebSocket(`ws://127.0.0.1:${port}/ws?jeton=${jeton}`);
  try {
    return await new Promise<Apparence>((resolve, reject) => {
      socket.on("message", (d) => {
        const m = JSON.parse(d.toString()) as MessageServeur;
        if (m.t === "bienvenue") resolve(m.moi.apparence);
      });
      socket.on("error", reject);
    });
  } finally {
    // Le départ du joueur s'enregistre : on attend qu'il soit fini avant d'arrêter le serveur.
    const ferme = new Promise((r) => socket.on("close", r));
    socket.close();
    await ferme;
    await new Promise((r) => setTimeout(r, 50));
  }
}

test("la couleur personnalisée est envoyée, validée, gardée et relue ; une couleur invalide est refusée", async () => {
  mkdirSync(dossierTests, { recursive: true });
  const cheminBase = join(dossierTests, `cheveux-${process.pid}.sqlite`);
  let serveur = await demarrerServeur({ port: 0, hote: "127.0.0.1", cheminBase });
  try {
    const choisie = { ...APPARENCES_DE_REFERENCE.voltaiques, cheveux: 2, teinteCheveux: "#C23B8A" };
    const r = await poster(serveur.port, "/api/inscription", { pseudo: "Iris", motDePasse: "violette42", famille: "voltaiques", apparence: choisie });
    assert.ok(r.ok);
    assert.equal(r.apparence?.teinteCheveux, "#c23b8a", "acceptée, en minuscules");
    const jeton = r.jeton;

    const mauvaise = await poster(serveur.port, "/api/inscription", {
      pseudo: "Opale",
      motDePasse: "opaline42",
      famille: "charbonniers",
      apparence: { ...APPARENCES_DE_REFERENCE.charbonniers, cheveux: 4, teinteCheveux: "red; background:url(x)" },
    });
    assert.ok(mauvaise.ok);
    assert.equal(mauvaise.apparence && "teinteCheveux" in mauvaise.apparence, false, "refusée");
    assert.equal(mauvaise.apparence?.cheveux, 4, "la palette reprend");

    // Le serveur redémarre : la couleur est relue de la base.
    await serveur.fermer();
    serveur = await demarrerServeur({ port: 0, hote: "127.0.0.1", cheminBase });
    const relue = await apparenceALaConnexion(serveur.port, jeton);
    assert.equal(relue.teinteCheveux, "#c23b8a");
    assert.equal(relue.cheveux, 2);
  } finally {
    await serveur.fermer();
    rmSync(dossierTests, { recursive: true, force: true });
  }
});

test("un personnage de la 0.8.1 (apparence sans couleur personnalisée) se relit à l'identique", () => {
  const base = new Base(":memory:");
  const de081 = { silhouette: "feminine" as const, taille: 0.35, corpulence: 0.6, peau: 2, coiffure: "longs" as const, cheveux: 5, barbe: false };
  const c = base.creerCompte("Rose", "potager42", "mecanistes", true, de081);
  assert.deepEqual(base.chargerApparence(c.id, "mecanistes"), de081);
  base.fermer();
});
