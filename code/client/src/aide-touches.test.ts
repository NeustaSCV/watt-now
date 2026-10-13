// L'aide des touches sur ordinateur (plan 0.8.2, chantier H, R7) : des touches dessinées, une case par action.

import { test } from "node:test";
import assert from "node:assert/strict";
import { entreesAide, htmlAideTouches } from "./aide-touches.ts";
import type { Action } from "./touches.ts";

const AZERTY: Partial<Record<Action, string>> = { avancer: "Z", gauche: "Q", reculer: "S", droite: "D", courir: "Maj", discret: "C", agir: "E", examiner: "F", combat: "X", sac: "I", fabriquer: "B", carte: "M", lumiere: "R", tourner: "V" };
const nom = (a: Action) => AZERTY[a] ?? "?";

test("chaque action a sa case : la carte et la lumière ne se confondent plus", () => {
  const html = htmlAideTouches(nom);
  const cases = [...html.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]!);
  assert.equal(cases.length, entreesAide(nom).length);
  const carte = cases.find((c) => c.includes(">Carte<"))!;
  const lumiere = cases.find((c) => c.includes(">Lumière<"))!;
  assert.match(carte, /<kbd class="touche">M<\/kbd>/);
  assert.match(lumiere, /<kbd class="touche">R<\/kbd>/);
  assert.ok(!carte.includes(">R<") && !lumiere.includes(">M<"));
  // Plus de « R : lumière · M : carte » : ni deux-points ni point médian pour séparer.
  assert.ok(!/ : |·/.test(html.replace(/<p class="changer">.*<\/p>/, "")));
});

test("des touches dessinées et une souris, pas des lettres seules", () => {
  const html = htmlAideTouches(nom);
  // Chaque touche est un <kbd class="touche"> ; les clics et la molette, une souris dessinée.
  assert.equal([...html.matchAll(/<kbd class="touche/g)].length, 14);
  assert.match(html, /aria-label="clic gauche"/);
  assert.match(html, /aria-label="clic droit"/);
  assert.match(html, /aria-label="molette"/);
  // Les quatre touches de marche en croix ; « Maj » est une touche large.
  assert.match(html, /<span class="croix"><kbd class="touche">Z<\/kbd><kbd class="touche">Q<\/kbd><kbd class="touche">S<\/kbd><kbd class="touche">D<\/kbd><\/span>/);
  assert.match(html, /<kbd class="touche large">Maj<\/kbd>/);
});

test("les noms suivent les réglages du joueur, et sont échappés", () => {
  const html = htmlAideTouches((a) => (a === "carte" ? "<" : nom(a)));
  assert.match(html, /<kbd class="touche">&lt;<\/kbd>/);
});

test("le style : un petit rectangle en bas à gauche, une case par action séparée d'un filet", async () => {
  const { readFileSync } = await import("node:fs");
  const css = readFileSync(new URL("./style.css", import.meta.url), "utf8");
  const bloc = css.slice(css.indexOf("#hud .bloc.aide {"));
  assert.match(bloc.slice(0, 300), /left: max\(12px, env\(safe-area-inset-left\)\);\s*right: auto;\s*bottom:/);
  assert.match(css, /#hud \.aide-touches li \{[^}]*border-top: 1px solid/);
});
