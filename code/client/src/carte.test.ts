// Plan 0.8, chantier 4 : la carte à deux routes. Chaque lieu a son pictogramme sur la feuille, chaque tronçon son tracé,
// et le tracé de la route B a la longueur de celui de la route A (les distances de B16). La mise en page à 375 px se
// vérifie à l'écran (captures du chantier) : ici, la feuille garde ses proportions et tient dans sa boîte.

import { test } from "node:test";
import assert from "node:assert/strict";
import { LIEUX, ORDRE_ROUTE, TRONCONS } from "../../commun/src/lieux.ts";
import { POINTS, TRACES, dessinCarte } from "./carte.ts";

const longueur = (points: readonly [number, number][]) => points.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - points[i]![0], p[1] - points[i]![1]), 0);
const trace = (a: string, b: string) => TRACES.find((t) => (t.a === a && t.b === b) || (t.a === b && t.b === a))!;

test("chaque lieu a son pictogramme sur la feuille, nommé, dans le cadre", () => {
  const svg = dessinCarte();
  assert.match(svg, /viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid meet"/);
  for (const id of ORDRE_ROUTE) {
    const [x, y] = POINTS[id];
    assert.ok(x > 40 && x < 960 && y > 40 && y < 660, `${id} dans la feuille`);
    assert.match(svg, new RegExp(`data-lieu="${id}" transform="translate\\(${x} ${y}\\)"`), `${id} a son pictogramme`);
    assert.ok(svg.includes(`aria-label="${LIEUX[id].nom}"`), `${id} porte son nom`);
  }
  assert.ok(svg.includes(">Gué-aux-Saules<") && svg.includes(">Moulin du Gué<"));
});

test("chaque tronçon a son tracé, d'un lieu à l'autre ; la route B a la longueur de la route A", () => {
  for (const t of TRONCONS) {
    const tr = trace(t.a, t.b);
    assert.ok(tr, `${t.a} – ${t.b} est tracé`);
    const debut = tr.points[0]!;
    const fin = tr.points.at(-1)!;
    assert.deepEqual(debut, POINTS[tr.a]);
    assert.deepEqual(fin, POINTS[tr.b]);
  }
  // L'échelle de la carte : 53 unités par km. À 10 % près, le tracé de la route B vaut celui de la route A.
  const a1 = longueur(trace("terrain", "station").points);
  const b1 = longueur(trace("terrain", "gue").points);
  const a2 = longueur(trace("station", "cooperative").points);
  const b2 = longueur(trace("gue", "moulin").points);
  assert.ok(Math.abs(b1 - a1) / a1 < 0.1, `terrain → gué ${b1.toFixed(0)} contre terrain → station ${a1.toFixed(0)}`);
  assert.ok(Math.abs(b2 - a2) / a2 < 0.1, `gué → Moulin ${b2.toFixed(0)} contre station → Coopérative ${a2.toFixed(0)}`);
});

test("plan 0.8 §9.2 : la carte garde sa croix, et un clic ou un toucher en dehors de la feuille la ferme", async () => {
  const { clicEnDehors } = await import("./carte.ts");
  const fond = {};
  const feuille = {};
  assert.equal(clicEnDehors(fond, fond, fond), true, "sur le fond : elle se ferme");
  assert.equal(clicEnDehors(feuille, feuille, fond), false, "sur la feuille : non");
  assert.equal(clicEnDehors(feuille, fond, fond), false, "un geste commencé sur la feuille (un défilement) : non");
  assert.equal(clicEnDehors(null, fond, fond), false);
});
