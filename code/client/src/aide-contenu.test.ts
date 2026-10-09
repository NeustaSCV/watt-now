// 0.6, chantier 8 (Book 25 §9.5) : l'aide du jeu a ses cinq rubriques du métier ; chaque rubrique s'ouvre (elle a un
// titre, un résumé, du contenu) ; les touches citées existent ; et rien ne dit **où** est le rare.

import { test } from "node:test";
import assert from "node:assert/strict";
import { RUBRIQUES_AIDE } from "./aide-contenu.ts";
import { ACTIONS } from "./touches.ts";

/** Tout le texte d'une rubrique, à plat. */
function texte(r: (typeof RUBRIQUES_AIDE)[number]): string {
  return [r.titre, r.resume, ...r.blocs.map((b) => (typeof b === "string" ? b : "sous_titre" in b ? b.sous_titre : b.liste.join("\n")))].join("\n");
}

test("0.6 aide : les cinq rubriques du métier existent, et chacune a de quoi s'ouvrir", () => {
  const ids = RUBRIQUES_AIDE.map((r) => r.id);
  for (const id of ["tirer", "etoiles", "metier-autres", "electricite", "pieges"]) assert.ok(ids.includes(id), id);
  assert.equal(new Set(ids).size, ids.length, "des identifiants uniques");
  for (const r of RUBRIQUES_AIDE) {
    assert.match(r.id, /^[a-z]+(-[a-z]+)*$/, r.id);
    assert.ok(r.titre.length > 0 && r.titre.length <= 40, `${r.id} : titre`);
    assert.ok(r.resume.length > 0 && r.resume.length <= 110, `${r.id} : résumé de ${r.resume.length} caractères`);
    assert.ok(r.blocs.length > 0, `${r.id} : vide`);
  }
});

test("0.6 aide : les touches citées sont de vraies actions ({lancer} compris)", () => {
  for (const r of RUBRIQUES_AIDE) {
    for (const [, nom] of texte(r).matchAll(/\{(\w+)\}/g)) assert.ok(nom! in ACTIONS, `${r.id} : {${nom}}`);
  }
  assert.ok(RUBRIQUES_AIDE.some((r) => texte(r).includes("{lancer}")));
});

test("0.6 aide : comment, jamais où est le rare (l'if, la lime, le rail, les manuels, l'arc de tir sportif)", () => {
  const tout = RUBRIQUES_AIDE.map(texte).join("\n").toLowerCase();
  for (const secret of [/(^|[^a-zà-ÿ])ifs?([^a-zà-ÿ]|$)/, /lime usée/, /rail/, /directeur/, /tir sportif/, /carbone/, /bobine/, /fil dentaire/, /camionnette/]) {
    assert.ok(!secret.test(tout), `l'aide ne doit pas dire ${secret}`);
  }
});

// 0.7, chantier 6 : l'arbre de progression et les déchets de l'Abondance dans l'aide.
const rubrique = (id: string) => texte(RUBRIQUES_AIDE.find((r) => r.id === id)!);

test("0.7 aide : « Fabriquer » dit que les recettes viennent quand on y pense, et la pastille", () => {
  const t = rubrique("fabriquer");
  assert.match(t, /apparaissent quand tu y penses/);
  assert.match(t, /pastille/);
  assert.match(t, /À découvrir/);
  assert.match(rubrique("ecran"), /Fabriquer.*pastille/);
});

test("0.7 aide : « Je suis coincé » répond à la recette qui ne vient pas, et aux trouvailles invendables", () => {
  const t = rubrique("questions");
  assert.match(t, /Une recette ne vient pas/);
  assert.match(t, /deux heures/);
  assert.match(t, /refuse les ordures/);
});

test("0.7 aide : les déchets — tout se ramasse, presque rien ne vaut, les conteneurs se fouillent, le Comptoir refuse", () => {
  const t = rubrique("dechets");
  assert.match(t, /Tout ce que tu vois au sol se ramasse/);
  assert.match(t, /ordures/);
  assert.match(t, /se \*\*fouillent\*\*/);
  assert.match(t, /Comptoir les refuse/);
  assert.match(t, /sauf sur ton terrain/);
  assert.match(rubrique("wotts"), /refuse les ordures/);
  assert.match(rubrique("carnet"), /dernière idée/);
});
