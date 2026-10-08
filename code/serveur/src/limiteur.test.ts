// La limite d'essais (0.1.1) : au-delà du maximum dans la fenêtre, refusé ; la fenêtre passée, ça repart.

import { test } from "node:test";
import assert from "node:assert/strict";
import { Limiteur } from "./limiteur.ts";

test("le limiteur bloque après le maximum, puis oublie avec le temps", () => {
  const l = new Limiteur(3, 1000);
  for (let i = 0; i < 3; i++) {
    assert.ok(l.autorise("a", 100));
    l.compter("a", 100);
  }
  assert.equal(l.autorise("a", 500), false);
  assert.ok(l.autorise("b", 500), "une autre clé n'est pas touchée");
  assert.ok(l.autorise("a", 1200), "la fenêtre est passée");
});
