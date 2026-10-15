// Plan 0.10, V2-12 (chantier L) : les bras pris (l'escabeau, la batterie, la tête du robot), le bouton A dit « Poser »,
// jamais « Frapper », y compris en mode Combat ; saisi, on se dégage toujours.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { POSER, gesteDesBras, propositionsCombat } from "./bras-pris.ts";
import type { ActionProposee } from "./interaction.ts";

const libelle = (a: ActionProposee | null) => a?.libelle ?? "";

test("V2-12 : en Combat, les bras pris, A pose (l'escabeau, la batterie, la tête du robot) ; les bras libres, A frappe", () => {
  const escabeau: ActionProposee = { libelle: "Poser l'escabeau", message: { t: "poser" } };
  const phare: ActionProposee = { libelle: "Poser l'escabeau sous l'escalier", message: { t: "interagir", cible: { genre: "phare", id: "escabeau" }, verbe: "poser" } };
  const tete: ActionProposee = { libelle: "Poser la tête du robot", message: { t: "poser" } };
  const presenter: ActionProposee = { libelle: "Présenter la tête du robot à la borne", message: { t: "interagir", cible: { genre: "lieu", id: "borne" }, verbe: "presenter" } };
  for (const bras of [escabeau, phare, tete]) {
    const p = propositionsCombat({ saisi: false, brasPris: true, bras, repousser: false });
    assert.equal(p.A, bras);
    assert.match(libelle(p.A), /^Poser/);
    assert.equal(libelle(p.B), "Esquiver");
  }
  // Devant la borne, A garde le geste des bras (présenter la tête), jamais « Frapper ».
  assert.equal(propositionsCombat({ saisi: false, brasPris: true, bras: presenter, repousser: true }).A, presenter);
  // Le lieu n'a rien proposé (ou autre chose qu'un geste des bras) : A pose quand même.
  assert.equal(propositionsCombat({ saisi: false, brasPris: true, bras: null, repousser: false }).A, POSER);
  assert.equal(propositionsCombat({ saisi: false, brasPris: true, bras: { libelle: "Ramasser la canette", message: { t: "interagir", cible: { genre: "ressource", id: 3 }, verbe: "ramasser" } }, repousser: false }).A, POSER);
  for (const bras of [escabeau, null]) assert.doesNotMatch(libelle(propositionsCombat({ saisi: false, brasPris: true, bras, repousser: false }).A), /Frapper/);
  // Les bras libres : frapper ; saisi : se dégager, bras pris ou non.
  assert.match(libelle(propositionsCombat({ saisi: false, brasPris: false, bras: null, repousser: true }).A), /^Frapper/);
  assert.equal(libelle(propositionsCombat({ saisi: false, brasPris: false, bras: null, repousser: true }).B), "Repousser");
  for (const brasPris of [true, false]) assert.equal(libelle(propositionsCombat({ saisi: true, brasPris, bras: escabeau, repousser: false }).A), "Se dégager");
});

test("V2-12 : un geste des bras, c'est poser, brancher ou présenter", () => {
  assert.ok(gesteDesBras(POSER));
  assert.ok(gesteDesBras({ libelle: "Brancher la batterie à la borne", message: { t: "interagir", cible: { genre: "lieu", id: "borne" }, verbe: "brancher" } }));
  assert.ok(!gesteDesBras({ libelle: "Examiner", examiner: "…" }));
  assert.ok(!gesteDesBras(null));
});

test("V2-12 : main.ts ne frappe pas les bras pris (A pose, le relâchement ne frappe pas)", () => {
  const main = readFileSync(new URL("./main.ts", import.meta.url), "utf8");
  assert.match(main, /if \(modeCombat && !brasPris\(\)\) return;/);
  assert.match(main, /if \(brasPris\(\)\) return;/);
  assert.match(main, /propositionsCombat\(\{ saisi: saisi > 0, brasPris: bras, bras: gesteBras, repousser: aRepousser\(\) \}\)/);
  assert.doesNotMatch(main, /"Frapper \(maintenir/);
});
