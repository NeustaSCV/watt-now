// Plan 0.10 (V4-19) : tant qu'elle est fermée, la côte reste sur la carte, grisée. Ses deux routes et ses quatre lieux
// portent la classe `acces-cote` (la feuille grise ce qui la porte, `.carte.cote-fermee .acces-cote`) ; rien d'autre ne la porte.

import { test } from "node:test";
import assert from "node:assert/strict";
import { LIEUX_NIVEAU_2, ORDRE_ROUTE } from "../../commun/src/lieux.ts";
import { TRACES, dessinCarte } from "./carte.ts";

test("les quatre lieux et les quatre tronçons de la côte, et eux seuls, sont marqués pour être grisés", () => {
  const svg = dessinCarte();
  for (const l of LIEUX_NIVEAU_2) assert.ok(svg.includes(`<g class="lieu acces-cote" data-lieu="${l}"`), l);
  for (const l of ORDRE_ROUTE) assert.ok(svg.includes(`<g class="lieu" data-lieu="${l}"`), l);
  const tracesCote = TRACES.filter((t) => LIEUX_NIVEAU_2.includes(t.a) || LIEUX_NIVEAU_2.includes(t.b));
  assert.equal(tracesCote.length, 4);
  assert.equal((svg.match(/class="route acces-cote"/g) ?? []).length, 4);
  assert.equal((svg.match(/\bacces-cote\b/g) ?? []).length, 8);
});
