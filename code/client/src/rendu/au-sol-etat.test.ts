// À terre ou détruit, au corps de l'Éteint (plan 0.9, chantier F) : où en est le corps (l'état d'animation).

import { test } from "node:test";
import assert from "node:assert/strict";
import { EFFACEMENT_S, type EtatEteint } from "../../../commun/src/eteints.ts";
import { FONDUS, SuiviAuSol } from "./au-sol-etat.ts";

/** Avance de `secondes` par pas de 1/30 s, la chute finie (1) sauf si on dit le contraire. */
function avancer(s: SuiviAuSol, secondes: number, etat: EtatEteint, o: { chute?: number; seReleve?: boolean; efface?: boolean } = {}): void {
  for (let t = 0; t < secondes; t += 1 / 30) s.avancer(1 / 30, etat, o.chute ?? 1, !!o.seReleve, !!o.efface);
}

test("à terre, il remue une fois tombé ; il prend appui quand il va se relever ; relevé, plus rien", () => {
  const s = new SuiviAuSol();
  avancer(s, 0.5, "poursuivant");
  avancer(s, 0.5, "a_terre", { chute: 0.3 });
  assert.equal(s.poids.remue, 0, "pas pendant la chute");
  avancer(s, 1, "a_terre");
  assert.equal(s.poids.remue, 1);
  assert.equal(s.poids.relache, 0, "il ne se relâche pas : il n'est pas mort");
  assert.equal(s.poids.cendre, 0, "il garde ses couleurs");
  avancer(s, 1, "a_terre", { seReleve: true });
  assert.equal(s.poids.appui, 1);
  assert.equal(s.poids.remue, 0);
  avancer(s, 1, "poursuivant");
  assert.equal(s.pose, false, "debout, la pose est celle de l'animation");
});

test("un détruit ne remue pas : inerte, relâché, terni en une seconde et demie", () => {
  const s = new SuiviAuSol();
  avancer(s, 0.5, "poursuivant");
  let remue = 0;
  for (let t = 0; t < 5; t += 1 / 30) {
    s.avancer(1 / 30, "detruit", Math.min(1, t / 1.7), false, false);
    remue = Math.max(remue, s.poids.remue, s.poids.appui);
  }
  assert.equal(remue, 0, "jamais un mouvement");
  assert.equal(s.poids.relache, 1);
  assert.equal(s.poids.cendre, 1);
  assert.equal(s.fige, true, "sa pose ne change plus");
  // Même si on lui envoyait « il se relève » par erreur.
  avancer(s, 1, "detruit", { seReleve: true });
  assert.equal(s.poids.appui, 0);
});

test("la teinte du détruit vient en une ou deux secondes, pas d'un coup", () => {
  const s = new SuiviAuSol();
  avancer(s, 0.2, "errant");
  avancer(s, 0.5, "detruit", { chute: 0.5 });
  assert.ok(s.poids.cendre > 0.2 && s.poids.cendre < 0.5);
  avancer(s, FONDUS.cendre, "detruit");
  assert.equal(s.poids.cendre, 1);
});

test("achevé au sol : le remuement cesse, le corps se relâche", () => {
  const s = new SuiviAuSol();
  avancer(s, 0.2, "poursuivant");
  avancer(s, 2, "a_terre");
  assert.equal(s.poids.remue, 1);
  avancer(s, 2, "detruit");
  assert.equal(s.poids.remue, 0);
  assert.equal(s.poids.relache, 1);
});

test("un corps trouvé en arrivant est déjà posé et terni, sans chute", () => {
  const s = new SuiviAuSol();
  assert.equal(s.avancer(1 / 30, "detruit", 0, false, false), true);
  assert.equal(s.poids.relache, 1);
  assert.equal(s.poids.cendre, 1);
  // Un Éteint qu'on a vu debout, lui, tombe pour de bon.
  const t = new SuiviAuSol();
  t.avancer(1 / 30, "errant", 0, false, false);
  assert.equal(t.avancer(1 / 30, "detruit", 0, false, false), false);
});

test("à la fin, il s'efface doucement en EFFACEMENT_S secondes", () => {
  const s = new SuiviAuSol();
  avancer(s, 3, "detruit");
  avancer(s, EFFACEMENT_S / 2, "detruit", { efface: true });
  assert.ok(s.poids.effacement > 0.4 && s.poids.effacement < 0.6, String(s.poids.effacement));
  avancer(s, EFFACEMENT_S / 2 + 0.1, "detruit", { efface: true });
  assert.equal(s.poids.effacement, 1);
});
