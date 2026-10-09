// Le carnet note les idées dévoilées (0.7, chantier 6) : la dernière idée venue, sans le feu ni l'abri du départ.

import { test } from "node:test";
import assert from "node:assert/strict";
import { derniereIdee, ligneDerniereIdee, texteDerniereIdee } from "./carnet-idees.ts";
import { PROGRESSION } from "../../commun/src/progression.ts";

test("carnet : pas de ligne tant qu'aucune idée n'est venue en chemin (le feu et l'abri ne comptent pas)", () => {
  assert.equal(derniereIdee(["feu_de_camp", "abri"]), null);
  assert.equal(ligneDerniereIdee(null), "");
});

test("carnet : la dernière idée de la liste, ou celle du dernier dévoilement, avec le nombre des autres", () => {
  assert.deepEqual(derniereIdee(["feu_de_camp", "abri", "ficelle", "gourdin"]), { id: "gourdin", avec: 0 });
  assert.deepEqual(derniereIdee(["feu_de_camp", "abri", "ficelle", "corde"], ["ficelle", "corde"]), { id: "corde", avec: 1 });
  assert.equal(texteDerniereIdee({ id: "corde", avec: 1 }), "Dernière idée : Tresser une corde (+1)");
  assert.match(ligneDerniereIdee({ id: "gourdin", avec: 0 }), /class="derniere-idee".*Dernière idée : Tailler un gourdin/);
});

test("carnet : la ligne tient en peu de place pour toutes les recettes (≤ 70 caractères, jamais coupée)", () => {
  for (const id of Object.keys(PROGRESSION)) {
    const t = texteDerniereIdee({ id, avec: 12 });
    assert.ok(t.length <= 70, `${id} : ${t.length} caractères`);
    assert.ok(!t.includes("…") && !/[<>&]/.test(t), id);
  }
});
