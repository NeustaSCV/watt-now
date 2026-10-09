// Tests de la qualité ★ par exemplaire (Book 25 §4.2, §9.6, chantier 2).

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ETOILES,
  ajouterExemplaires,
  canoniser,
  cleExemplaire,
  compter,
  estCleEtoileeValide,
  estMaitrisee,
  etoilesDe,
  exemplaires,
  facteurs,
  lireCle,
  maillonFaible,
  meilleurExemplaire,
  retirerExemplaires,
  soliditeExemplaire,
  typeDe,
  uneEtoileDeMoins,
  type InventaireCles,
} from "./etoiles.ts";

test("étoiles : la clé nue est l'exemplaire de base, les autres portent leur suffixe", () => {
  assert.equal(cleExemplaire("lame_forgee", 3), "lame_forgee");
  assert.equal(cleExemplaire("lame_forgee", 4), "lame_forgee#4");
  assert.equal(cleExemplaire("machette", 1), "machette", "la machette de fortune est une lame ★");
  assert.equal(cleExemplaire("machette", 2), "machette#2");
  assert.equal(cleExemplaire("pierre", 4), "pierre", "un caillou n'a pas d'étoile");
  assert.equal(cleExemplaire("lame_forgee", 9), "lame_forgee#5", "plafond ★★★★★");
  assert.deepEqual(lireCle("lame_forgee#2"), { type: "lame_forgee", etoiles: 2 });
  assert.deepEqual(lireCle("lame_forgee"), { type: "lame_forgee", etoiles: 3 });
  assert.deepEqual(lireCle("pierre"), { type: "pierre", etoiles: null });
  assert.equal(typeDe("lame_forgee#2"), "lame_forgee");
  assert.equal(etoilesDe("machette"), 1);
});

test("étoiles : seules les clés canoniques d'objets de métier sont valides", () => {
  assert.ok(estCleEtoileeValide("lame_forgee#4"));
  assert.ok(!estCleEtoileeValide("lame_forgee#3"), "★★★ s'écrit sans suffixe");
  assert.ok(!estCleEtoileeValide("lame_forgee#6"));
  assert.ok(!estCleEtoileeValide("lame_forgee#2.5"));
  assert.ok(!estCleEtoileeValide("pierre#2"));
  assert.ok(!estCleEtoileeValide("constructor#2"));
  assert.ok(!estCleEtoileeValide("lame_forgee"));
});

test("étoiles : un exemplaire ★★ casse deux fois plus tôt qu'un ★★★★", () => {
  const deux = soliditeExemplaire("lame_forgee", 2, 60);
  const quatre = soliditeExemplaire("lame_forgee", 4, 60);
  assert.equal(deux, 45);
  assert.equal(quatre, 90);
  assert.equal(quatre / deux, 2);
  // La machette de fortune (★, 1,2 de dégâts, 40 de solidité) portée à ★★ et ★★★ : les valeurs du tableau §8.4.
  assert.equal(soliditeExemplaire("machette", 2, 40), 60);
  assert.equal(soliditeExemplaire("machette", 3, 40), 80);
  assert.ok(Math.abs(1.2 * facteurs("machette", 2).degats - 1.35) < 1e-9);
  assert.ok(Math.abs(1.2 * facteurs("machette", 3).degats - 1.5) < 1e-9);
  assert.equal(facteurs("lame_forgee", 3).degats, 1, "la référence ne change rien");
});

test("étoiles : deux exemplaires d'étoiles différentes ne s'empilent pas, deux pareils si", () => {
  const inv: InventaireCles = {};
  ajouterExemplaires(inv, "lame_forgee", 2);
  ajouterExemplaires(inv, "lame_forgee", 4);
  ajouterExemplaires(inv, "lame_forgee", 2);
  ajouterExemplaires(inv, "lame_forgee", undefined);
  assert.deepEqual(inv, { "lame_forgee#2": 2, "lame_forgee#4": 1, lame_forgee: 1 });
  assert.equal(compter(inv, "lame_forgee"), 4);
  assert.equal(meilleurExemplaire(inv, "lame_forgee"), "lame_forgee#4");
  assert.deepEqual(exemplaires(inv, "lame_forgee").map((e) => e.etoiles), [4, 3, 2]);
});

test("étoiles : on retire les moins bons d'abord, et rien s'il n'y en a pas assez", () => {
  const inv: InventaireCles = { "lame_forgee#2": 1, lame_forgee: 2, "lame_forgee#5": 1, pierre: 3 };
  assert.equal(retirerExemplaires(inv, "lame_forgee", 9), null);
  assert.equal(compter(inv, "lame_forgee"), 4, "rien n'a bougé");
  assert.deepEqual(retirerExemplaires(inv, "lame_forgee", 2), { "lame_forgee#2": 1, lame_forgee: 1 });
  assert.deepEqual(inv, { lame_forgee: 1, "lame_forgee#5": 1, pierre: 3 });
  assert.deepEqual(retirerExemplaires(inv, "lame_forgee", 1, "meilleurs"), { "lame_forgee#5": 1 });
});

test("étoiles : le maillon faible, la maîtrise et le plafond hors famille", () => {
  // Ressort (★★★★), trempe à l'eau (★★★), foyer et marteau (★★) : ★★.
  assert.equal(maillonFaible([4, 3, 2]), 2);
  assert.equal(maillonFaible([4, 4, 3], { maitrise: true }), 4);
  assert.equal(maillonFaible([5, 5, 5], { maitrise: true }), 5, "plafond ★★★★★");
  assert.equal(maillonFaible([5, 4, 4], { horsFamille: true }), 2, "hors famille : ★★ au plus");
  assert.equal(maillonFaible([1, 4], { horsFamille: true }), 1);
  assert.ok(!estMaitrisee(9));
  assert.ok(estMaitrisee(10));
  assert.equal(uneEtoileDeMoins(1), 1, "jamais sous ★");
  assert.equal(ETOILES[3].raidi, 2.5);
});

test("étoiles : une sauvegarde 0.5.3 se relit sans perte, les clés se remettent en forme", () => {
  const ancienne = { couteau: 1, lame_forgee: 2, machette: 1, pierre: 4, conserve: 2 };
  assert.deepEqual(canoniser(ancienne), ancienne);
  assert.deepEqual(canoniser({ "lame_forgee#3": 1, lame_forgee: 1, "pierre#4": 2, "machette#1": 1, vide: 0 }), { lame_forgee: 2, pierre: 2, machette: 1 });
});
