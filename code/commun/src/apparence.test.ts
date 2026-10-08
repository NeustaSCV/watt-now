import { test } from "node:test";
import assert from "node:assert/strict";
import { APPARENCES_DE_REFERENCE, apparenceAncienne, apparenceValide, hauteurDe } from "./apparence.ts";

test("une apparence reçue est bornée ; ce qui manque ou est faux prend la valeur de la famille", () => {
  const a = apparenceValide({ silhouette: "masculine", taille: 7, corpulence: -2, peau: 99, coiffure: "iroquoise", cheveux: 2.4, barbe: "oui" }, "voltaiques");
  assert.equal(a.silhouette, "masculine");
  assert.equal(a.taille, 1);
  assert.equal(a.corpulence, 0);
  assert.equal(a.peau, 5);
  assert.equal(a.coiffure, APPARENCES_DE_REFERENCE.voltaiques.coiffure);
  assert.equal(a.cheveux, 2);
  assert.equal(a.barbe, false, "seul true active la barbe");
  assert.deepEqual(apparenceValide(null, "mecanistes"), APPARENCES_DE_REFERENCE.mecanistes);
});

test("les curseurs sont arrondis au vingtième, et la taille va de 1,60 à 1,90 m", () => {
  const a = apparenceValide({ taille: 0.333, corpulence: 0.678 }, "charbonniers");
  assert.equal(a.taille, 0.35);
  assert.equal(a.corpulence, 0.7);
  assert.equal(hauteurDe({ ...a, taille: 0 }), 1.6);
  assert.ok(Math.abs(hauteurDe({ ...a, taille: 1 }) - 1.9) < 1e-9);
});

test("un ancien compte garde sa carnation d'avant", () => {
  assert.equal(apparenceAncienne("charbonniers", 0).peau, 1);
  assert.equal(apparenceAncienne("charbonniers", 2).peau, 4);
  assert.equal(apparenceAncienne("charbonniers", -1).peau, APPARENCES_DE_REFERENCE.charbonniers.peau);
});
