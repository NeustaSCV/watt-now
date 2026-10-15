// Plan 0.10, chantier A : la carte gagne la côte. Les quatre lieux du niveau 2 y sont, ouverts dès le départ comme ceux
// du niveau 1 (il n'y a pas de dévoilement par visite sur la carte), chacun avec son pictogramme, son nom et le tracé
// de ses routes ; leur fiche ne dit que l'ambiance (R18).

import { test } from "node:test";
import assert from "node:assert/strict";
import { LIEUX, LIEUX_NIVEAU_2, TOUS_LES_LIEUX, TRONCONS } from "../../commun/src/lieux.ts";
import { POINTS, TRACES, dessinCarte } from "./carte.ts";

test("les dix lieux ont leur pictogramme sur la feuille, nommé, dans le cadre", () => {
  const svg = dessinCarte();
  for (const id of TOUS_LES_LIEUX) {
    const [x, y] = POINTS[id];
    assert.ok(x > 40 && x < 960 && y > 40 && y < 660, `${id} dans la feuille`);
    assert.match(svg, new RegExp(`data-lieu="${id}" transform="translate\\(${x} ${y}\\)"`), `${id} a son pictogramme`);
    assert.ok(svg.includes(`aria-label="${LIEUX[id].nom}"`), `${id} porte son nom`);
  }
  for (const nom of ["Route du pont", "Grand Hôtel des Flots", "Corniche", "du Cap Rouge", "Phare du cap"]) assert.ok(svg.includes(`>${nom}<`), nom);
  // Le seul phare de la feuille est celui du cap (l'ancien dessin pâli, à l'est, est retiré).
  assert.ok(!svg.includes("M880 600 l-5 -22 h10 z"));
});

test("chaque tronçon du niveau 2 a son tracé, d'un lieu à l'autre, à l'échelle de la carte (53 unités par km, à 15 % près)", () => {
  const longueur = (pts: readonly [number, number][]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i]![0], p[1] - pts[i]![1]), 0);
  for (const t of TRONCONS.filter((t) => LIEUX_NIVEAU_2.includes(t.a) || LIEUX_NIVEAU_2.includes(t.b))) {
    const tr = TRACES.find((x) => (x.a === t.a && x.b === t.b) || (x.a === t.b && x.b === t.a));
    assert.ok(tr, `${t.a} – ${t.b} est tracé`);
    assert.deepEqual(tr.points[0], POINTS[tr.a]);
    assert.deepEqual(tr.points.at(-1), POINTS[tr.b]);
    const km = longueur(tr.points) / 53;
    assert.ok(Math.abs(km - t.km) / t.km < 0.15, `${t.a} – ${t.b} : ${km.toFixed(2)} km dessinés pour ${t.km}`);
  }
});
