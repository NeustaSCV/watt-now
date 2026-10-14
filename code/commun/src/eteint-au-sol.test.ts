// À terre ou détruit, au corps de l'Éteint (plan 0.9 §3.3 bis, chantier F) : ce que la vue envoie au client.

import { test } from "node:test";
import assert from "node:assert/strict";
import { EFFACEMENT_S, SE_RELEVE_S, encaisser, nouvelEteint, penser, vue } from "./eteints.ts";
import { ARMES, DUREE_A_TERRE, DUREE_CORPS, POINGS } from "./combat.ts";
import { ZONE_STATION } from "./lieux.ts";

const fixe = () => 0.5;
const marteau = ARMES.find((a) => a.objet === "marteau")!;

test("à terre, la vue dit « il va se relever » dans ses dernières secondes au sol, et seulement là", () => {
  const e = nouvelEteint(1, 10, 10, "poursuivant");
  const de = { x: 9, z: 10 };
  for (let i = 0; i < 3; i++) encaisser(e, marteau, false, 1, de, ZONE_STATION);
  assert.equal(encaisser(e, marteau, false, 1, de, ZONE_STATION), "a_terre");
  const vues: { t: number; seReleve: boolean; etat: string }[] = [];
  for (let t = 0; t < DUREE_A_TERRE + 0.5; t += 0.1) {
    penser(e, 0.1, [], [], [e], false, ZONE_STATION, fixe);
    const v = vue(e);
    vues.push({ t, seReleve: !!v.seReleve, etat: v.etat });
  }
  const auSol = vues.filter((v) => v.etat === "a_terre");
  const annonces = auSol.filter((v) => v.seReleve);
  assert.ok(annonces.length > 0, "il annonce qu'il se relève");
  // Tout ce qui est annoncé tient dans les SE_RELEVE_S dernières secondes, et rien avant.
  const debut = annonces[0]!.t;
  assert.ok(debut >= DUREE_A_TERRE - SE_RELEVE_S - 0.15, `annoncé trop tôt (${debut.toFixed(1)} s)`);
  assert.ok(auSol.filter((v) => v.t >= debut).every((v) => v.seReleve), "puis jusqu'à ce qu'il se relève");
  // Debout, plus rien.
  assert.equal(vues.at(-1)!.etat, "poursuivant");
  assert.equal(vue(e).seReleve, undefined);
});

test("détruit, la vue ne dit jamais qu'il se relève ; elle dit « il s'efface » dans ses dernières secondes", () => {
  const e = nouvelEteint(1, 10, 10, "poursuivant");
  e.etat = "a_terre";
  e.aTerre = 1;
  assert.equal(vue(e).seReleve, true);
  assert.equal(encaisser(e, POINGS, false, 0.5, { x: 9, z: 10 }, ZONE_STATION), "detruit");
  assert.equal(vue(e).seReleve, undefined);
  assert.equal(vue(e).efface, undefined);
  for (let t = 0; t < DUREE_CORPS - EFFACEMENT_S - 0.5; t += 0.5) penser(e, 0.5, [], [], [e], false, ZONE_STATION, fixe);
  assert.equal(vue(e).efface, undefined, "pas encore");
  for (let t = 0; t < 1; t += 0.5) penser(e, 0.5, [], [], [e], false, ZONE_STATION, fixe);
  assert.equal(vue(e).efface, true);
  assert.equal(vue(e).seReleve, undefined);
});

test("debout, rien de neuf dans la vue (le débit ne change pas)", () => {
  const e = nouvelEteint(1, 10, 10, "errant");
  assert.deepEqual(Object.keys(vue(e)).sort(), ["etat", "id", "o", "x", "z"]);
});
