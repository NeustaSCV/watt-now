// Étape 0.5a (Book 23 §8) : la Coopérative est un lieu vivant par joueur, au bout du chemin agricole qui part du
// Carrefour ; la route est une ligne (terrain → station → Carrefour → Coopérative).

import { test } from "node:test";
import assert from "node:assert/strict";
import { ARRIVEE_COOP } from "../../commun/src/cooperative.ts";
import { DUREE_VOYAGE_S, SORTIES_COMPTOIR, SORTIES_COOP, arriveeDans, etapeVers, sortiesDe } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Cooperatives } from "./cooperative.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

test("la route est une ligne : du terrain à la Coopérative, on traverse la station puis le Carrefour", () => {
  assert.equal(etapeVers("terrain", "cooperative"), "station");
  assert.equal(etapeVers("station", "cooperative"), "comptoir");
  assert.equal(etapeVers("comptoir", "cooperative"), "cooperative");
  assert.equal(etapeVers("cooperative", "terrain"), "comptoir");
  assert.equal(etapeVers("comptoir", "terrain"), "station");
  // Au Carrefour, on arrive par l'est depuis la station, par le nord depuis la Coopérative.
  const depuisCoop = arriveeDans("comptoir", "cooperative");
  const depuisStation = arriveeDans("comptoir", "station");
  assert.ok(depuisCoop.z < 10 && depuisStation.x > 50);
  assert.deepEqual(arriveeDans("cooperative", "terrain"), { ...ARRIVEE_COOP });
  assert.equal(sortiesDe("cooperative")[0]!.vers, "comptoir");
});

function monter() {
  const base = new Base(":memory:");
  const halte = new Halte(base);
  const comptoir = new Comptoir(base);
  const cooperatives = new Cooperatives(base);
  let instant = 1_000_000;
  const joueurs: { joueur: Joueur; recus: MessageServeur[] }[] = [];
  const nouveau = (pseudo: string) => {
    const compte = base.creerCompte(pseudo, "potager42", "mecanistes");
    base.sauverInventaire(compte.id, { sac_a_dos: 1, hache: 1 });
    // Il attend au Carrefour, au pied du chemin agricole.
    base.sauverPosition(compte.id, arriveeDans("comptoir", "station"), "comptoir", instant);
    const recus: MessageServeur[] = [];
    const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 0.5, comptoir, cooperatives);
    joueurs.push({ joueur, recus });
    return { compte, joueur, recus };
  };
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      for (const j of joueurs) j.joueur.tick(pas);
      cooperatives.tick(instant, pas);
    }
  };
  const allerALaCoop = (j: Joueur) => {
    const sortie = SORTIES_COMPTOIR.find((s) => s.vers === "cooperative")!;
    j.position = { x: sortie.boite.x, z: sortie.boite.z, o: 0 };
    j.recevoir({ t: "voyager", vers: "cooperative" });
  };
  /** Déconnecté : le serveur ne l'anime plus. */
  const deconnecter = (j: Joueur) => {
    j.partir();
    joueurs.splice(joueurs.findIndex((x) => x.joueur === j), 1);
  };
  return { base, cooperatives, nouveau, attendre, allerALaCoop, deconnecter };
}

const derniere = (recus: MessageServeur[]) => recus.findLast((m) => m.t === "bienvenue") as Extract<MessageServeur, { t: "bienvenue" }> | undefined;

test("on prend le chemin agricole au nord du Carrefour, et l'on arrive au portail de sa Coopérative", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  t.allerALaCoop(a.joueur);
  assert.ok(a.recus.some((m) => m.t === "voyage" && m.vers === "cooperative"));
  t.attendre(DUREE_VOYAGE_S + 1);
  const b = derniere(a.recus)!;
  assert.equal(b.lieu, "cooperative");
  assert.deepEqual({ x: b.position.x, z: b.position.z }, { x: ARRIVEE_COOP.x, z: ARRIVEE_COOP.z });
  // Personne ne s'y montre : la Coopérative est privée.
  assert.equal(a.joueur.enLieuPublic, false);
  // Et l'on en repart par le portail, vers le Carrefour.
  a.joueur.position = { x: SORTIES_COOP[0]!.boite.x, z: SORTIES_COOP[0]!.boite.z, o: 0 };
  a.joueur.recevoir({ t: "voyager", vers: "comptoir" });
  t.attendre(DUREE_VOYAGE_S + 1);
  assert.equal(derniere(a.recus)!.lieu, "comptoir");
});

test("chacun sa Coopérative : deux joueurs ne voient pas les Éteints l'un de l'autre", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  const b = t.nouveau("Basile");
  t.allerALaCoop(a.joueur);
  t.allerALaCoop(b.joueur);
  t.attendre(DUREE_VOYAGE_S + 1);
  const coopA = t.cooperatives.de(a.compte.id);
  const coopB = t.cooperatives.de(b.compte.id);
  assert.notEqual(coopA, coopB);
  assert.equal(t.cooperatives.nombre, 2);
  // Un Éteint détruit chez Rose reste debout chez Basile.
  coopA.eteints[0]!.etat = "detruit";
  assert.equal(coopB.eteints[0]!.etat, "errant");
  // Ce qui se passe chez Rose ne parvient pas à Basile.
  const avant = b.recus.length;
  coopA.diffuser({ t: "info", texte: "chez Rose" });
  assert.equal(b.recus.slice(avant).filter((m) => m.t === "info" && m.texte === "chez Rose").length, 0);
});

test("se reconnecter dans la Coopérative ramène au portail ; vide depuis 5 min, elle quitte la mémoire", () => {
  const t = monter();
  const a = t.nouveau("Rose");
  t.allerALaCoop(a.joueur);
  t.attendre(DUREE_VOYAGE_S + 1);
  a.joueur.position = { x: 60, z: 25, o: 0 };
  a.joueur.sauvegarder();
  t.deconnecter(a.joueur);
  const revenu = new Joueur(a.compte, t.base, () => {}, () => 2_000_000, undefined, () => 0.5, undefined, t.cooperatives);
  assert.equal(revenu.lieu, "cooperative");
  assert.deepEqual({ x: revenu.position.x, z: revenu.position.z }, { x: ARRIVEE_COOP.x, z: ARRIVEE_COOP.z });
  revenu.partir();
  t.attendre(6 * 60, 5);
  assert.equal(t.cooperatives.nombre, 0);
});
