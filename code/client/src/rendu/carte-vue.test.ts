// 0.7.2 : le cercle de signature « honnête » (décision 6) : dans chaque pièce, à la portée que le serveur lui donne.

import { test } from "node:test";
import assert from "node:assert/strict";
import { pieceDe, portesInitiales } from "../../../commun/src/cooperative.ts";
import { PLAN_VUE_COOP } from "../../../commun/src/vue-lieux.ts";
import { SON_PORTE_FERMEE, SON_PORTE_OUVERTE } from "../../../commun/src/vue.ts";
import { arcsParPiece } from "./carte-vue.ts";

function arcs(portes: Record<string, boolean>, x: number, z: number, rayon: number) {
  const pos = new Float32Array(6 * 96 * 6);
  const dist = new Float32Array(6 * 96 * 2);
  const n = arcsParPiece(PLAN_VUE_COOP, portes, x, z, rayon, pos, dist);
  const segments: { piece: string; r: number }[] = [];
  for (let i = 0; i < n; i += 2) {
    const mx = (pos[i * 3]! + pos[(i + 1) * 3]!) / 2;
    const mz = (pos[i * 3 + 2]! + pos[(i + 1) * 3 + 2]!) / 2;
    segments.push({ piece: pieceDe(mx, mz), r: Math.hypot(pos[i * 3]! - x, pos[i * 3 + 2]! - z) });
  }
  return segments;
}

test("cercle honnête : dans sa pièce, le cercle entier ; derrière la porte fermée, ×0,15 ; ouverte, ×0,5", () => {
  const x = 41;
  const z = 33.5;
  // (Le quai fermé : sinon le son ferait le tour par la cour, ×0,5 × 0,5 = ×0,25, plus que la porte fermée.)
  const fermee = arcs({ ...portesInitiales(), libre_service_hangar: false, quai: false }, x, z, 12);
  const dansLeHangar = fermee.filter((s) => s.piece === "hangar");
  assert.ok(dansLeHangar.length > 0, "le cercle passe dans le hangar");
  for (const s of dansLeHangar) assert.ok(Math.abs(s.r - 12 * SON_PORTE_FERMEE) < 0.01, `rayon ${s.r}`);
  for (const s of fermee.filter((s) => s.piece === "libre_service")) assert.ok(Math.abs(s.r - 12) < 0.01);
  const ouverte = arcs({ ...portesInitiales(), libre_service_hangar: true }, x, z, 12);
  for (const s of ouverte.filter((s) => s.piece === "hangar")) assert.ok(Math.abs(s.r - 12 * SON_PORTE_OUVERTE) < 0.01);
});
