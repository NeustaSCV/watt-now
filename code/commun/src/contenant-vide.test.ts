// Un contenant vidé (plan 0.8.2, chantier I : R24 ; Q-0.8.2-6) : il reste au sol, en décor muet, et ne propose plus rien.

import { test } from "node:test";
import assert from "node:assert/strict";
import { cleCouche, contenantsCarreau, dispositionLieu, piecesCarreau, pointPropose, type PointDechetsVu } from "./couche-dechets.ts";

/** Le premier sac-poubelle d'un lieu : son carreau, ses pièces. */
function premierSac(cle: string) {
  for (const [k, l] of dispositionLieu(cle)) {
    const em = l.find((e) => e.genre === "sac_poubelle");
    if (!em) continue;
    const [cx, cz] = k.split(",").map(Number) as [number, number];
    const pieces = piecesCarreau(cle, cx, cz, 0);
    if (!pieces.some((p) => p.dedans && p.e === em.e)) continue;
    return { cx, cz, em, pieces };
  }
  throw new Error(`pas de sac-poubelle plein : ${cle}`);
}

for (const cle of ["station", cleCouche("terrain", 7), cleCouche("cooperative", 7)]) {
  test(`un sac-poubelle vidé reste au sol et ne propose plus rien (${cle})`, () => {
    const { cx, cz, em, pieces } = premierSac(cle);
    const plein = contenantsCarreau(cle, cx, cz, pieces, new Set()).find((c) => c.em.e === em.e)!;
    assert.ok(plein.reste > 0 && plein.propose, "plein, il se fouille");
    // On a tout pris : il est vide.
    const pris = new Set(pieces.filter((p) => p.dedans && p.e === em.e).map((p) => p.i));
    const vide = contenantsCarreau(cle, cx, cz, pieces, pris).find((c) => c.em.e === em.e);
    assert.ok(vide, "il reste dans la liste de ce qu'on dessine (terrain compris)");
    assert.equal(vide.reste, 0);
    assert.equal(vide.propose, false, "ni « Fouiller », ni « Examiner »");
    // Les autres contenants du carreau ne changent pas.
    const autres = contenantsCarreau(cle, cx, cz, pieces, pris).filter((c) => c.em.e !== em.e);
    for (const c of autres) assert.equal(c.propose, c.reste > 0);
  });
}

test("un coffre de voiture fouillé jusqu'au bout, une poubelle vidée : décor muet ; un point parti : rien", () => {
  const coffre: PointDechetsVu = { id: "coffre_1", type: "coffre_voiture", x: 0, z: 0, o: 0, dispo: true, reste: 2 };
  assert.equal(pointPropose(coffre), true);
  assert.equal(pointPropose({ ...coffre, reste: 0 }), false);
  // Un point qui se démonte (le vélo du fossé) propose tant qu'il est là.
  const velo: PointDechetsVu = { id: "velo", type: "velo_fosse", x: 0, z: 0, o: 0, dispo: true };
  assert.equal(pointPropose(velo), true);
  assert.equal(pointPropose({ ...velo, dispo: false }), false);
});
