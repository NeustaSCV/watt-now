// La fiche Examiner (plan 0.8 §9.2) : plus de croix ; ouverte par B, elle se ferme par B ; un bouton « Fermer » en bas.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LIBELLE_FERMER_FICHE, enteteFiche, piedFiche } from "./fiche-examiner.ts";

// « × » sert aussi aux multiplicateurs (« brûle ×0,75 ») : la croix, c'est ✕ ou ✖.
const CROIX = /[✕✖]/;

test("la fiche : un en-tête sans croix, un bouton « Fermer » en bas", () => {
  assert.equal(enteteFiche("Foyer de forge"), "<header><h2>Foyer de forge</h2></header>");
  assert.ok(!CROIX.test(enteteFiche("Abri")));
  assert.match(piedFiche(), /<button type="button" class="fermer-fiche">Fermer<\/button>/);
  assert.ok(!CROIX.test(piedFiche()));
  assert.equal(LIBELLE_FERMER_FICHE, "Fermer");
});

test("la fiche d'un feu et celle d'une construction se dessinent sans croix, avec le bouton du bas", () => {
  const hud = readFileSync(new URL("./hud.ts", import.meta.url), "utf8");
  for (const nom of ["ficheFeu", "ficheInstallation"]) {
    const debut = hud.indexOf(`  private ${nom}(`);
    assert.ok(debut > 0, nom);
    const corps = hud.slice(debut, hud.indexOf("\n  }\n", debut));
    assert.ok(!CROIX.test(corps), `${nom} : pas de croix`);
    assert.match(corps, /\$\{enteteFiche\(/, `${nom} : l'en-tête sans croix`);
    assert.match(corps, /\$\{piedFiche\(\)\}/, `${nom} : le bouton « Fermer »`);
  }
  // Le bouton du bas ferme la fiche ; B aussi (main.ts), et le bouton tactile B dit alors « Fermer ».
  assert.match(hud, /querySelector\("\.fermer-fiche"\)!\.addEventListener\("click"/);
  const main = readFileSync(new URL("./main.ts", import.meta.url), "utf8");
  assert.match(main, /if \(hud\.ficheOuverte\) return hud\.fermerPanneaux\(\);/);
  assert.match(main, /hud\.ficheOuverte\) propositions = \{ \.\.\.propositions, B: \{ libelle: LIBELLE_FERMER_FICHE/);
});
