import { test } from "node:test";
import assert from "node:assert/strict";
import { enSaison, formaterDate, instantDuJour, jourDuCalendrier, phaseFruitier } from "./calendrier.ts";
import { MS_JOUR_CALENDRIER } from "./energie.ts";

test("le monde commence le 21 mars, premier jour du printemps ; un an dure 4 semaines réelles", () => {
  assert.equal(formaterDate(jourDuCalendrier(0, 0)), "21 mars");
  assert.equal(formaterDate(jourDuCalendrier(MS_JOUR_CALENDRIER * 365, 0)), "21 mars");
  assert.ok(Math.abs(MS_JOUR_CALENDRIER * 365 - 28 * 24 * 3_600_000) < 1);
  assert.equal(jourDuCalendrier(instantDuJour(240, 5000), 5000), 240);
  assert.equal(formaterDate(240), "28 août");
});

test("chaque fruit à sa saison : cerises en juin, pommes à l'automne, fleurs au printemps", () => {
  assert.equal(phaseFruitier("cerisier", 170), "murs");
  assert.equal(phaseFruitier("pommier", 170), "verts");
  assert.equal(phaseFruitier("pommier", 120), "fleurs");
  assert.equal(phaseFruitier("pommier", 280), "murs");
  assert.equal(phaseFruitier("cerisier", 280), "repos");
  assert.ok(enSaison("cepe", 160) && !enSaison("amanite_phalloide", 160) && enSaison("amanite_phalloide", 250));
  assert.ok(enSaison("branche", 1), "le bois mort, toute l'année");
});
