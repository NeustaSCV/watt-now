// Le foyer de forge (niveau 1) n'a plus de soufflet (plan 0.8 §9.2) : le mot et l'objet sont réservés au soufflet de
// forge, la clé de la forge ventilée. Le petit soufflet de cuir était couché à gauche de la tuyère (x < -0,85), sur un
// rondin, avec sa poignée jusqu'à x = -1,72.

import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { forge } from "./installations.ts";

test("le foyer de forge : plus rien à gauche de la tuyère (le petit soufflet de cuir a disparu)", () => {
  const g = forge();
  g.updateMatrixWorld(true);
  const boite = new THREE.Box3().setFromObject(g);
  assert.ok(boite.min.x > -1, `rien au-delà de la tuyère (x min ${boite.min.x.toFixed(2)})`);
  assert.ok(boite.max.x > 0.6, "le massif de pierres est bien là");
});
