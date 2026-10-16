// Le halo (duel 0.11, D-19 V1, D-24) : l'anneau suit `rouge` et `protegeJusqua` ; aucune lumière, matières et géométries
// partagées, un seul appel de dessin hors protection.

import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { COULEUR_HALO, HAUTEUR_HALO, Halo, PROTECTION_MS, etatHalo, resteProtection } from "./halo.ts";

/** Un porteur : l'objet du personnage auquel le halo est accroché. */
function porteur(y = 0, o = 0): THREE.Group {
  const g = new THREE.Group();
  g.position.y = y;
  g.rotation.y = o;
  return g;
}

function maillages(h: Halo): THREE.Mesh[] {
  return h.objet.children.filter((o) => o.visible) as THREE.Mesh[];
}

test("vert lisse en Exploration, rouge à pointes en Combat, bordé de sombre ; un seul maillage", () => {
  const h = new Halo();
  const p = porteur();
  h.maj(0.016, false, undefined, 1000, 0, p);
  assert.equal(h.etat, "vert");
  assert.deepEqual([...h.teintes].sort(), [COULEUR_HALO.bord, COULEUR_HALO.vert].sort());
  assert.equal(maillages(h).length, 1, "un appel de dessin");
  const lisse = maillages(h)[0]!.geometry.getAttribute("position").count;
  h.maj(0.016, true, undefined, 1000, 0, p);
  assert.equal(h.etat, "rouge");
  assert.deepEqual([...h.teintes].sort(), [COULEUR_HALO.bord, COULEUR_HALO.rouge].sort());
  assert.ok(maillages(h)[0]!.geometry.getAttribute("position").count > lisse, "les pointes en plus");
  assert.equal(maillages(h).length, 1);
});

test("blanc pendant la protection, qui se vide comme une horloge, puis il reprend sa couleur (D-24)", () => {
  const h = new Halo();
  const p = porteur();
  const fin = 100_000;
  h.maj(0.016, false, fin, fin - PROTECTION_MS, 0, p);
  assert.equal(h.etat, "blanc");
  assert.ok(h.teintes.has(COULEUR_HALO.blanc) && !h.teintes.has(COULEUR_HALO.vert));
  assert.ok(Math.abs(h.partHorloge - 1) < 0.02, "pleine au début");
  h.maj(0.016, false, fin, fin - PROTECTION_MS / 2, 0, p);
  assert.ok(Math.abs(h.partHorloge - 0.5) < 0.02, "à moitié au milieu");
  h.maj(0.016, false, fin, fin - 1000, 0, p);
  assert.ok(h.partHorloge > 0 && h.partHorloge < 0.05);
  // Les 45 s passées : il reprend sa couleur, l'horloge est jetée.
  h.maj(0.016, true, fin, fin + 10, 0, p);
  assert.equal(h.etat, "rouge");
  assert.equal(h.partHorloge, 0);
  assert.ok(!h.teintes.has(COULEUR_HALO.blanc), "plus rien de blanc");
  assert.equal(maillages(h).length, 1);
});

test("blanc même en Combat ; ses pointes restent, blanches", () => {
  const h = new Halo();
  h.maj(0.016, true, 50_000, 40_000, 0, porteur());
  assert.equal(etatHalo(true, 50_000, 40_000), "blanc");
  assert.equal(h.etat, "blanc");
  assert.ok(!h.teintes.has(COULEUR_HALO.rouge));
  const blanc = new Halo();
  blanc.maj(0.016, false, 50_000, 40_000, 0, porteur());
  assert.ok(maillages(h)[0]!.geometry.getAttribute("position").count > maillages(blanc)[0]!.geometry.getAttribute("position").count, "les pointes");
});

test("la part de protection : bornée, nulle sans protection", () => {
  assert.equal(resteProtection(undefined, 5), 0);
  assert.equal(resteProtection(1000, 2000), 0);
  assert.equal(resteProtection(PROTECTION_MS * 3, 0), 1);
});

test("posé sur le vrai sol, même quand le personnage est plus haut ou plus bas (le relief)", () => {
  const h = new Halo();
  const p = porteur(-0.4);
  p.add(h.objet);
  h.maj(0.016, false, undefined, 0, -8.8, p);
  assert.ok(Math.abs(p.position.y + h.objet.position.y - (-8.8 + HAUTEUR_HALO)) < 1e-9);
});

test("aucune lumière, des matières sans éclairage, partagées par tous les halos", () => {
  const a = new Halo();
  const b = new Halo();
  for (const h of [a, b]) h.maj(0.016, true, undefined, 0, 0, porteur());
  const lumieres: THREE.Object3D[] = [];
  a.objet.traverse((o) => (o as THREE.Light).isLight && lumieres.push(o));
  assert.equal(lumieres.length, 0);
  const [ma, mb] = [maillages(a)[0]!, maillages(b)[0]!];
  assert.equal(ma.material, mb.material, "la même matière");
  assert.equal(ma.geometry, mb.geometry, "la même géométrie");
  const m = ma.material as THREE.Material;
  assert.equal(m.type, "MeshBasicMaterial");
  assert.equal(m.depthWrite, false);
});
