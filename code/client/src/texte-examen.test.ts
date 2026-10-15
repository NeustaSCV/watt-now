// Le texte d'Examiner (plan 0.8.2, chantier H, Q9) : en entier, et le temps de le lire.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dureeExamen } from "./texte-examen.ts";

test("il reste le temps de le lire : plus long pour un texte long, entre 4 et 12 s", () => {
  assert.equal(dureeExamen("Une branche."), 4000);
  const long = "Un petit panneau solaire tombé de l'auvent, appuyé contre un pilier. Il alimentait l'enseigne lumineuse de la boutique.";
  assert.ok(dureeExamen(long) > 8000 && dureeExamen(long) <= 12_000);
  assert.equal(dureeExamen("x".repeat(500)), 12_000);
});

test("le texte d'Examiner n'est jamais coupé à deux lignes", () => {
  const css = readFileSync(new URL("./style.css", import.meta.url), "utf8");
  assert.match(css, /#hud \.messages p\.examen \{[^}]*-webkit-line-clamp: unset;[^}]*overflow: visible;/);
  assert.match(css, /#hud \.messages:has\(p\.examen\) \{[^}]*max-height: none;/);
  // Le texte d'Examiner part avec le genre « examen » (main.ts) ; le HUD l'accepte.
  const main = readFileSync(new URL("./main.ts", import.meta.url), "utf8");
  assert.match(main, /hud\.message\(a\.examiner, "examen", a\.raison\)/);
});
