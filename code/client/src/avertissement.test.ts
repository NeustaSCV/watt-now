// L'avertissement de la bûche (plan 0.8 §2.6, B14) : un bandeau du carnet fermé par son bouton « Compris », jamais par
// une croix (règle du porteur).

import { test } from "node:test";
import assert from "node:assert/strict";
import { BOUTON_AVERTISSEMENT, TEXTE_AVERTISSEMENT_BUCHE } from "../../commun/src/tutoriel.ts";
import { htmlAvertissement } from "./avertissement.ts";

test("l'avertissement n'a pas de croix : il se ferme par son bouton « Compris »", () => {
  const html = htmlAvertissement({ texte: TEXTE_AVERTISSEMENT_BUCHE, bouton: BOUTON_AVERTISSEMENT, objet: "buche" });
  assert.match(html, /<button type="button" class="compris">Compris<\/button>/);
  assert.equal(html.match(/<button/g)!.length, 1, "un seul bouton");
  assert.ok(!/[✕×✖]/.test(html), "jamais de croix");
  assert.ok(!/fermer|close/i.test(html));
  assert.match(html, /Une bûche ne repousse pas : garde-la pour bâtir\./);
  assert.match(html, /<svg/, "l'icône de la bûche");
  assert.ok(htmlAvertissement({ texte: "<b>", bouton: "Compris" }).includes("&lt;b&gt;"), "le texte est échappé");
});
