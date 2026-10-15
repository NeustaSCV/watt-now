// Pas de zoom de la page sur iPhone (0.10.1, A6) : le second appui rapide, au même endroit, est retenu sur un bouton
// grisé ou un fond ; jamais sur un bouton actif, un champ de saisie, le canevas ou le joystick (le double appui du
// coffre, les appuis longs de A). Le CSS met `touch-action: manipulation` sur html, body et #hud.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DOUBLE_APPUI_MS, retenirDoubleAppui } from "./anti-zoom.ts";

/** Un élément factice : `garde` dit s'il est (ou est dans) un contrôle qui garde ses appuis. */
const element = (garde: boolean) => ({ closest: (s: string) => (garde && s.includes("button:not(:disabled)") ? {} : null) });

test("un double appui rapide, au même endroit, sur un bouton grisé ou un fond : retenu", () => {
  assert.equal(retenirDoubleAppui(element(false), 120, 5), true);
  assert.equal(retenirDoubleAppui(null, 120, 5), true);
});

test("sur un bouton actif, un champ, le canevas ou le joystick : jamais retenu (leurs appuis passent)", () => {
  assert.equal(retenirDoubleAppui(element(true), 120, 5), false);
});

test("deux appuis lents, ou loin l'un de l'autre : rien n'est retenu", () => {
  assert.equal(retenirDoubleAppui(element(false), DOUBLE_APPUI_MS + 1, 0), false);
  assert.equal(retenirDoubleAppui(element(false), 100, 80), false);
});

test("le CSS : touch-action manipulation sur html, body et #hud ; le canevas et le joystick gardent none", () => {
  const css = readFileSync(new URL("./style.css", import.meta.url), "utf8");
  const regle = (selecteur: RegExp) => css.match(new RegExp(`${selecteur.source}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
  assert.match(regle(/html,\s*body/), /touch-action:\s*manipulation/);
  assert.match(regle(/\n#hud/), /touch-action:\s*manipulation/);
  assert.match(regle(/\n#monde/), /touch-action:\s*none/);
  assert.match(regle(/\n#joystick/), /touch-action:\s*none/);
});
