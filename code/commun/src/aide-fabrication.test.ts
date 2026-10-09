import { test } from "node:test";
import assert from "node:assert/strict";
import { ceQuiManque, ouTrouver, outilsPour } from "./aide-fabrication.ts";
import { recette } from "./recettes.ts";

test("la hache sans pierre ni marteau : on dit ce qui martèle", () => {
  const lignes = ceQuiManque(recette("hache")!, { tete_hache: 1, branche: 2, couteau: 1 });
  assert.equal(lignes.length, 1);
  assert.match(lignes[0]!, /marteler/);
  assert.match(lignes[0]!, /pierre/);
  assert.match(lignes[0]!, /marteau/);
});

test("une matière qui manque : combien, et où la trouver", () => {
  const lignes = ceQuiManque(recette("corde")!, { fibres: 1 });
  assert.match(lignes[0]!, /3 poignées de fibres/);
  assert.match(lignes[0]!, /tu en as 1/);
  assert.match(lignes[0]!, /couper des joncs/);
  assert.ok(ouTrouver("marteau").some((s) => s.includes("Comptoir")));
  assert.deepEqual(ceQuiManque(recette("corde")!, { fibres: 4 }), [], "tout y est : rien à dire");
});

test("les outils d'une qualité, à un niveau donné", () => {
  // La masse martèle aussi, et mieux (Marteler 3, Book 25 §11).
  assert.deepEqual(outilsPour("marteler", 2), ["marteau", "masse"]);
  assert.ok(outilsPour("marteler", 1).includes("pierre"));
});
