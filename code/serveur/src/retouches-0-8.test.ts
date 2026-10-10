// Les retouches décidées pendant le codage de la 0.8 (plan 0.8 §9.2), au chantier 13 : la masse qui se répare aussi au
// manche à l'établi à étau ; le Comptoir qui masque les clés de L1 tant qu'on n'a pas visité leur lieu.

import { test } from "node:test";
import assert from "node:assert/strict";
import { ATELIER_REPARATION, MATIERE_ARME, lieuAtelier } from "../../commun/src/combat.ts";
import { LIEU_DES_CLES, etalPour } from "../../commun/src/economie.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import type { Inventaire } from "../../commun/src/objets.ts";
import type { TypeInstallation } from "../../commun/src/recettes.ts";
import { LIEU_REPARER_MANCHE } from "../../commun/src/recettes/communes.ts";
import { COMPTOIR } from "../../commun/src/lieux.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

function chezSoi(inventaire: Inventaire, meuble: { type: TypeInstallation; niveau?: number }, usure: Partial<Record<string, number>>) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "voltaiques");
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
  base.sauverUsure(compte.id, usure);
  const i = base.ajouterInstallation(compte.id, meuble.type, 21, 20, 0);
  if (meuble.niveau) base.sauverNiveauInstallation(compte.id, i.id, meuble.niveau);
  let instant = base.debutMonde() + 60_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), () => 1);
  joueur.position = { x: 20, z: 20, o: 0 };
  const attendre = (secondes: number) => {
    for (let s = 0; s < secondes; s += 0.5) {
      instant += 500;
      joueur.tick(0.5);
    }
  };
  return { joueur, attendre, sac: () => base.chargerInventaire(compte.id), usure: () => base.chargerUsure(compte.id) };
}

test("la masse se répare à la forge, et aussi au manche à l'établi à étau, comme le marteau (§9.2)", () => {
  assert.equal(MATIERE_ARME.masse, "masse");
  assert.deepEqual(ATELIER_REPARATION.masse.map((a) => a.installation), ["forge", "etabli"]);
  assert.deepEqual(lieuAtelier(ATELIER_REPARATION.masse[1]!), LIEU_REPARER_MANCHE);
  assert.deepEqual(ATELIER_REPARATION.masse[1], ATELIER_REPARATION.manche[0], "le même geste que le marteau");
  // Un Voltaïque, sans forge : l'établi à étau et une branche suffisent.
  const t = chezSoi({ masse: 1, branche: 1 }, { type: "etabli", niveau: 2 }, { masse: 6 });
  t.joueur.recevoir({ t: "reprendre_arme", objet: "masse", geste: "reparer" });
  t.attendre(20);
  assert.equal(t.usure().masse, undefined, "à neuf");
  assert.equal(t.sac().branche, undefined, "la branche fait le manche neuf");
  assert.equal(t.sac().masse, 1);
});

test("le Comptoir masque les clés de L1 tant qu'on n'a pas visité leur lieu (absentes de l'étal, pas grisées)", () => {
  const stock: Inventaire = { buche: 10, pierre: 10, grillage_rouleau: 1, cocotte_fonte: 1, seau_10l: 1, toile_jute: 1, feuillards: 1, etau: 1 };
  const cles = Object.keys(LIEU_DES_CLES).sort();
  assert.deepEqual(cles, ["cocotte_fonte", "etau", "feuillards", "grillage_rouleau", "seau_10l", "toile_jute"]);
  // Personne n'y est allé : seules les bûches et les pierres.
  assert.deepEqual(Object.keys(etalPour(stock, {})).sort(), ["buche", "pierre"]);
  // La Coopérative visitée : ses trois clés reviennent à l'étal ; celles du Moulin restent cachées.
  assert.deepEqual(Object.keys(etalPour(stock, { "visite:cooperative": 1 })).sort(), ["buche", "cocotte_fonte", "grillage_rouleau", "pierre", "seau_10l"]);
  assert.deepEqual(Object.keys(etalPour(stock, { "visite:cooperative": 1, "visite:moulin": 2 })).sort(), Object.keys(stock).sort());
  // Les exemplaires étoilés d'un objet ordinaire ne sont pas touchés.
  assert.deepEqual(etalPour({ "machette_forgee#2": 1 }, {}), { "machette_forgee#2": 1 });
});

test("au guichet, chacun voit l'étal de ses visites : la clé du Moulin absente pour qui n'y est jamais allé", () => {
  const base = new Base(":memory:");
  let instant = 1_000_000;
  const comptoir = new Comptoir(base, instant);
  // Le stock de base a une clé de chaque (chantier 10).
  const arriver = (pseudo: string, faits: Record<string, number>) => {
    const compte = base.creerCompte(pseudo, "potager42", "mecanistes");
    base.sauverQuetes(compte.id, { faits, finies: [], primes: 0 });
    base.sauverPosition(compte.id, { x: COMPTOIR.guichet.x, z: COMPTOIR.guichet.z + 0.8, o: 0 }, "comptoir", instant);
    const recus: MessageServeur[] = [];
    const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), () => 1, comptoir);
    return { joueur, recus, etal: () => (recus.findLast((m) => m.t === "comptoir") as Extract<MessageServeur, { t: "comptoir" }> | undefined)?.comptoir.stock };
  };
  const neuf = arriver("Rose", {});
  const habitue = arriver("Malo", { "visite:moulin": 1 });
  assert.equal(neuf.joueur.bienvenue(0).comptoir?.stock.etau, undefined, "absente de l'étal, pas grisée");
  assert.equal(habitue.joueur.bienvenue(0).comptoir?.stock.etau, 1);
  // Une vente au guichet republie l'étal à tous : chacun le sien.
  comptoir.publier(instant);
  assert.equal(neuf.etal()!.etau, undefined);
  assert.equal(habitue.etal()!.etau, 1);
  assert.equal(neuf.etal()!.buche, habitue.etal()!.buche);
});
