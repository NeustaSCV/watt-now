// Plan 0.10.1, chantier A : la jauge de soif à 1,5 L (A8), les gourdes (A5) et les saisons (A7), côté règles pures.

import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFINITIONS_REGLAGES } from "./reglages.ts";
import { ETE, HIVER, surplusSaison } from "./saisons.ts";
import { LITRES_PAR_HEURE, RESERVE_EAU_MAX, consommer, contenanceGourdes, taGourde } from "./survie.ts";

const proche = (a: number, b: number, eps = 1e-3) => Math.abs(a - b) < eps;

test("A8 : la jauge de soif tient 1,5 L, et pleine, elle dure toujours ≈ 70 min réelles (comme 2,5 L à 0,35)", () => {
  assert.equal(RESERVE_EAU_MAX, 1.5);
  assert.equal(DEFINITIONS_REGLAGES.soif_rythme.defaut, 0.21);
  // Une heure de jeu = une minute réelle (24 h en 24 min).
  const avant = 2.5 / (LITRES_PAR_HEURE * 0.35);
  const apres = RESERVE_EAU_MAX / (LITRES_PAR_HEURE * DEFINITIONS_REGLAGES.soif_rythme.defaut);
  assert.ok(proche(avant, apres, 0.01), `${avant} min avant, ${apres} min après`);
  assert.ok(apres > 68 && apres < 70);
  assert.match(DEFINITIONS_REGLAGES.soif_rythme.aide, /0,21/);
});

test("A5 : la réserve tient 1 L par gourde du sac ; les textes passent au pluriel", () => {
  assert.equal(contenanceGourdes({}), 0);
  assert.equal(contenanceGourdes({ gourde: 1 }), 1);
  assert.equal(contenanceGourdes({ gourde: 3, couteau: 1 }), 3);
  assert.equal(taGourde({ gourde: 1 }), "ta gourde");
  assert.equal(taGourde({ gourde: 2 }, true), "Tes gourdes");
});

test("A7 : la cloche des saisons vaut 1 aux bords, 1,25 au milieu, 1 au printemps et à l'automne", () => {
  // L'hiver : du 21 décembre (355) au 20 mars (79), son milieu le 3 février à midi (34,5).
  assert.deepEqual(surplusSaison(HIVER.debut), { faim: 1, soif: 1 });
  assert.ok(proche(surplusSaison(HIVER.fin).faim, 1));
  assert.ok(proche(surplusSaison(34.5).faim, 1.25));
  assert.equal(surplusSaison(34.5).soif, 1);
  // Elle monte, puis redescend, en passant le 1er janvier.
  assert.ok(surplusSaison(365).faim > 1 && surplusSaison(1).faim > surplusSaison(365).faim && surplusSaison(60).faim < surplusSaison(34).faim);
  // L'été : du 21 juin (172) au 22 septembre (265), au plus fort le 6 août à midi (218,5).
  assert.equal(surplusSaison(ETE.debut).soif, 1);
  assert.ok(proche(surplusSaison(ETE.fin).soif, 1));
  assert.ok(proche(surplusSaison(218.5).soif, 1.25));
  assert.equal(surplusSaison(218.5).faim, 1);
  // Le printemps et l'automne : rien.
  for (const j of [80, 120, 152, 171, 266, 300, 354]) assert.deepEqual(surplusSaison(j), { faim: 1, soif: 1 }, `jour ${j}`);
});

test("A7 : consommer() applique le surplus de la saison", () => {
  const b = { kcal: 2000, eau: 1, repos: 1 };
  const normal = consommer(b, 1);
  const hiver = consommer(b, 1, 1, false, false, { faim: 1.25, soif: 1 });
  assert.ok(proche(2000 - hiver.kcal, 1.25 * (2000 - normal.kcal)));
  assert.equal(hiver.eau, normal.eau);
});
