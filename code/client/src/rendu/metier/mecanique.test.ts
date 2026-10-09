// ⚙️ Les modèles des Mécanistes (chantier 7 · 0.6) : chacun se construit, reste dans un budget de triangles raisonnable
// (Book 21 §5.3.4), et les pièges ont bien leurs deux visages (armé, déclenché).

import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { modeleMetier } from "./index.ts";
import { modelesMecanique } from "./mecanique.ts";

function triangles(o: THREE.Object3D): number {
  let n = 0;
  o.traverse((m) => {
    const g = (m as THREE.Mesh).geometry;
    if (!(m as THREE.Mesh).isMesh || !g) return;
    n += (g.index ? g.index.count : g.getAttribute("position").count) / 3;
  });
  return n;
}

test("⚙️ modèles : chaque modèle des Mécanistes est enregistré, se construit, et tient sous 3 000 triangles", () => {
  for (const [objet, usage] of modelesMecanique()) {
    const m = modeleMetier(objet, usage);
    assert.ok(m, `${usage}:${objet} enregistré`);
    const t = triangles(m);
    assert.ok(t > 20 && t < 3000, `${objet} : ${t} triangles`);
    // Deux appels donnent deux objets distincts (on les place et on les anime seuls).
    assert.notEqual(modeleMetier(objet, usage), m);
  }
});

test("⚙️ modèles : un piège a un visage armé et un visage déclenché ; un accessoire du pédalier dit quel état le montre", () => {
  for (const type of ["assommoir", "machoires_fortune", "piege_machoires", "fosse_pieux"]) {
    const m = modeleMetier(type, "sol")!;
    const faces: boolean[] = [];
    m.traverse((o) => {
      if (typeof o.userData.siArme === "boolean") faces.push(o.userData.siArme);
    });
    assert.deepEqual(faces.sort(), [false, true], type);
  }
  assert.equal(modeleMetier("pedalier_soufflet", "sol")!.userData.siEtat, "soufflet");
  assert.equal(modeleMetier("pedalier_meule_fine", "sol")!.userData.siEtat, "meuleFine");
});
