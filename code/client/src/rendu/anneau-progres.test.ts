// L'anneau de progression d'un geste (plan 0.8.2, chantier H, R23) : bleu vif, par-dessus le décor, autour de la visée.

import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { AnneauProgres, BLEU_PROGRES, RAYON_INTERIEUR } from "./anneau-progres.ts";

test("un bleu franc, sans effet de lumière ni de profondeur : le même en basse qualité, jamais caché par ce qu'on fouille", () => {
  const a = new AnneauProgres();
  const [piste, remplissage] = a.children as THREE.Mesh[];
  const m = remplissage!.material as THREE.MeshBasicMaterial;
  assert.equal(m.color.getHex(), BLEU_PROGRES);
  const c = new THREE.Color(BLEU_PROGRES);
  assert.ok(c.b > 0.9 && c.r < 0.3, "bleu");
  for (const mesh of [piste!, remplissage!]) {
    const mat = mesh.material as THREE.MeshBasicMaterial;
    assert.equal(mat.depthTest, false);
    assert.equal(mat.toneMapped, false);
  }
  assert.ok(remplissage!.renderOrder > piste!.renderOrder);
  // Il entoure la visée d'un geste (rayon 0,5 m) au lieu de se poser sur son trait blanc.
  assert.ok(RAYON_INTERIEUR > 0.5);
});

test("il se remplit par pas, et repart à zéro pour un geste neuf", () => {
  const a = new AnneauProgres();
  const remplissage = a.children[1] as THREE.Mesh;
  a.remplir(0.5);
  const g1 = remplissage.geometry;
  a.remplir(0.501);
  assert.equal(remplissage.geometry, g1, "même pas : rien n'est refait");
  a.remplir(1);
  assert.notEqual(remplissage.geometry, g1);
  const g2 = remplissage.geometry;
  a.repartir();
  a.remplir(1);
  assert.notEqual(remplissage.geometry, g2, "un geste neuf refait l'anneau");
});
