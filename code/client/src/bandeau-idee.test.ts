// « Tu y penses » (plan 0.8, chantier 2) : le bandeau de l'idée se ferme d'un bouton, jamais d'une croix.

import { test } from "node:test";
import assert from "node:assert/strict";
import { DUREE_BANDEAU_MS, htmlBandeau } from "./bandeau-idee.ts";

test("le bandeau : l'icône de la trouvaille, « Tu y penses », l'idée, et un bouton à mot (pas de croix)", () => {
  const html = htmlBandeau({ texte: "Ce grillage, posé sur ton foyer, ferait une grille. Tu y penses.", plusTard: false, objet: "grillage_rouleau" });
  assert.match(html, /<strong>Tu y penses<\/strong>/);
  assert.match(html, /<button type="button" class="garder">Noté<\/button>/);
  assert.ok(!/[✕×✖]/.test(html), "jamais de croix");
  assert.ok(!html.includes("gardé pour plus tard"));
});

test("le bandeau d'une idée gardée pour plus tard le dit, et le texte est échappé", () => {
  const html = htmlBandeau({ texte: "Ce grillage pourra servir à ton feu, un jour. <b>", plusTard: true });
  assert.match(html, /gardé pour plus tard/);
  assert.match(html, />Je le garde</);
  assert.ok(html.includes("&lt;b&gt;") && !html.includes("<b>"));
  assert.ok(DUREE_BANDEAU_MS >= 6000 && DUREE_BANDEAU_MS <= 12000, "il passe, mais laisse le temps de lire");
});
