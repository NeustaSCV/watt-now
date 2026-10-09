// L'apparence au sol des déchets (0.7, chantier 7) : chaque objet qui peut traîner au sol a sa silhouette, sa teinte
// et une taille plausible ; aucun petit objet (moins de 10 cm) n'est au sol.

import { test } from "node:test";
import assert from "node:assert/strict";
import { PROFILS_DECHETS, tableDechets, type TypeLieuDechets } from "../../../../commun/src/dechets.ts";
import { OBJETS, type TypeObjet } from "../../../../commun/src/objets.ts";
import { VESTIGES_LOT2 } from "../../../../commun/src/vestiges-lot2.ts";
import { APPARENCES, apparenceDe } from "./apparence.ts";

function objetsAuSol(): Set<TypeObjet> {
  const tous = new Set<TypeObjet>();
  for (const l of Object.keys(PROFILS_DECHETS) as TypeLieuDechets[]) {
    const t = tableDechets(l, "sol");
    for (const p of ["dechet", "petite", "bonne"] as const) for (const [o] of t[p]) tous.add(o);
  }
  return tous;
}

test("chaque objet qui peut traîner au sol a son apparence propre", () => {
  const manquants = [...objetsAuSol()].filter((o) => !APPARENCES[o]);
  assert.deepEqual(manquants, [], `sans apparence : ${manquants.join(", ")}`);
});

test("aucun petit objet (moins de 10 cm) n'est posé au sol", () => {
  for (const o of objetsAuSol()) {
    const l2 = (VESTIGES_LOT2 as Record<string, { petit?: true }>)[o];
    assert.ok(!l2?.petit, `${o} est petit, il ne devrait sortir que des conteneurs`);
  }
});

test("chaque apparence donne une teinte et une échelle sensées", () => {
  for (const o of objetsAuSol()) {
    const a = apparenceDe(o, OBJETS[o].poids);
    assert.ok(a.t >= 0 && a.t <= 0xffffff, `${o} : teinte`);
    for (const k of a.e) assert.ok(k > 0.1 && k < 9, `${o} : échelle ${k}`);
  }
});
