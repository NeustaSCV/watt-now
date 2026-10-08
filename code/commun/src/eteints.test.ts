// Tests du comportement des Éteints (Book 06 §3, §4) : attention, réveil, poursuite, vue de nuit.

import { test } from "node:test";
import assert from "node:assert/strict";
import { VITESSES, encaisser, nouvelEteint, penser, type Eteint, type Humain } from "./eteints.ts";
import { ARMES, DUREE_A_TERRE, POINGS } from "./combat.ts";
import { ZONE_STATION } from "./lieux.ts";
import { ALLURES } from "./regles.ts";
import { CHARBONNIERE_ODEUR, stimuliJoueur, type Stimulus } from "./signature.ts";

const fixe = () => 0.5;

function simuler(e: Eteint, secondes: number, stimuli: (t: number) => Stimulus[], humains: (t: number) => Humain[] = () => [], nuit = false) {
  for (let t = 0; t < secondes; t += 0.05) penser(e, 0.05, stimuli(t), humains(t), [e], nuit, ZONE_STATION, fixe);
}

const pas = (x: number, z: number, allure: "discrete" | "marche" | "course", action: "aucun" | "leger" | "outil" = "aucun") =>
  stimuliJoueur({ x, z, allure, bouge: true, action, lumiere: null, nuit: false });

test("un dormant ne se réveille pas quand on passe à côté en allure discrète", () => {
  const e = nouvelEteint(1, 50, 30, "dormant");
  simuler(e, 10, () => pas(53, 30, "discrete"));
  assert.equal(e.etat, "dormant");
});

test("démonter à côté d'un dormant le réveille, et il vient voir", () => {
  const e = nouvelEteint(1, 50, 30, "dormant");
  simuler(e, 8, () => pas(55, 30, "discrete", "outil"));
  assert.notEqual(e.etat, "dormant");
  assert.ok(e.x > 50, "il s'est approché de la source");
});

test("le jour, un errant voit un marcheur à 10 m et le poursuit ; il le perd s'il s'éloigne", () => {
  const e = nouvelEteint(1, 50, 30, "errant");
  const humain = (x: number): Humain => ({ id: 1, x, z: 30, discret: false, eclaire: false });
  simuler(e, 0.2, () => [], () => [humain(60)]);
  assert.equal(e.etat, "poursuivant");
  // Le marcheur s'en va à 2,4 m/s : le poursuivant (1,55 m/s) le perd de vue, puis va voir le dernier endroit.
  simuler(e, 20, () => [], (t) => [humain(60 + t * ALLURES.marche)]);
  assert.notEqual(e.etat, "poursuivant");
  assert.ok(VITESSES.poursuivant < ALLURES.marche && VITESSES.poursuivant > ALLURES.discrete);
});

test("la nuit, on ne le voit qu'à 5 m… sauf avec une lampe", () => {
  const sansLampe = nouvelEteint(1, 50, 30, "errant");
  simuler(sansLampe, 0.2, () => [], () => [{ id: 1, x: 58, z: 30, discret: false, eclaire: false }], true);
  assert.equal(sansLampe.etat, "errant");
  const avecLampe = nouvelEteint(2, 50, 30, "errant");
  simuler(avecLampe, 0.2, () => [], () => [{ id: 1, x: 62, z: 30, discret: false, eclaire: true }], true);
  assert.equal(avecLampe.etat, "poursuivant");
});

test("la charbonnière attire lentement, de très loin (intensité × durée)", () => {
  const e = nouvelEteint(1, 50, 30, "errant");
  const fumee: Stimulus = { genre: "odeur", x: 110, z: 30, ...CHARBONNIERE_ODEUR };
  simuler(e, 5, () => [fumee]);
  assert.equal(e.etat, "errant", "au bout de 5 s, pas encore");
  simuler(e, 60, () => [fumee]);
  assert.equal(e.etat, "attire");
  assert.ok(e.x > 55, "il marche vers la fumée");
});

test("coups au torse : il tombe, et se relève si on ne l'achève pas", () => {
  const marteau = ARMES.find((a) => a.objet === "marteau")!;
  const e = nouvelEteint(1, 10, 10, "poursuivant");
  const de = { x: 9, z: 10 };
  assert.equal(encaisser(e, marteau, false, 1, de, ZONE_STATION), "vacille");
  assert.equal(encaisser(e, marteau, false, 1, de, ZONE_STATION), "a_terre");
  for (let t = 0; t < DUREE_A_TERRE + 0.5; t += 0.1) penser(e, 0.1, [], [], [e], false, ZONE_STATION, () => 0.5);
  assert.notEqual(e.etat, "a_terre");
});

test("au sol, n'importe quel coup l'achève, même aux poings ou épuisé", () => {
  const e = nouvelEteint(1, 10, 10, "poursuivant");
  e.etat = "a_terre";
  e.aTerre = DUREE_A_TERRE;
  assert.equal(encaisser(e, POINGS, false, 0.5, { x: 9, z: 10 }, ZONE_STATION), "detruit");
  assert.equal(e.etat, "detruit");
});

test("debout, un coup appuyé à la tête avec une arme solide le détruit ; au couteau, non", () => {
  const hache = ARMES.find((a) => a.objet === "hache")!;
  const couteau = ARMES.find((a) => a.objet === "couteau")!;
  assert.equal(encaisser(nouvelEteint(1, 10, 10, "poursuivant"), hache, true, 1, { x: 9, z: 10 }, ZONE_STATION), "detruit");
  assert.notEqual(encaisser(nouvelEteint(2, 10, 10, "poursuivant"), couteau, true, 1, { x: 9, z: 10 }, ZONE_STATION), "detruit");
});
