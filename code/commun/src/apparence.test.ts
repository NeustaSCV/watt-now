import { test } from "node:test";
import assert from "node:assert/strict";
import { APPARENCES_DE_REFERENCE, COULEURS_CHEVEUX, apparenceAncienne, apparenceValide, couleurCheveuxDe, hauteurDe, teinteValide } from "./apparence.ts";

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

// ---------- La couleur de cheveux personnalisée (R8, 0.8.2) ----------

test("une couleur de cheveux personnalisée est acceptée (en minuscules) et c'est elle qu'on peint", () => {
  const a = apparenceValide({ ...APPARENCES_DE_REFERENCE.charbonniers, cheveux: 3, teinteCheveux: "#2E8BC0" }, "charbonniers");
  assert.equal(a.teinteCheveux, "#2e8bc0");
  assert.equal(a.cheveux, 3, "la teinte de la palette reste gardée (un client d'avant la 0.8.2 la lit)");
  assert.equal(couleurCheveuxDe(a), 0x2e8bc0);
  // Validée deux fois (à l'inscription, puis à la relecture en base) : rien ne change.
  assert.deepEqual(apparenceValide(JSON.parse(JSON.stringify(a)), "charbonniers"), a);
});

test("une couleur de cheveux invalide est refusée : la palette reprend", () => {
  for (const mauvaise of ["bleu", "#12345", "#1234567", "#gg0000", "2e8bc0", "rgb(1,2,3)", "#fff", "url(x)", 0x2e8bc0, null, ["#2e8bc0"], { r: 1 }]) {
    const a = apparenceValide({ ...APPARENCES_DE_REFERENCE.voltaiques, cheveux: 4, teinteCheveux: mauvaise }, "voltaiques");
    assert.equal("teinteCheveux" in a, false, `refusée : ${JSON.stringify(mauvaise)}`);
    assert.equal(couleurCheveuxDe(a), COULEURS_CHEVEUX[4]);
  }
  assert.equal(teinteValide("#A0b1C2"), "#a0b1c2");
  assert.equal(teinteValide("#a0b1c2 "), null);
});

test("une apparence de la 0.8.1 (sans couleur personnalisée) se relit telle quelle", () => {
  // Ce que la 0.8.1 enregistrait en base : l'apparence en JSON, sans `teinteCheveux`.
  const enBase = JSON.stringify({ silhouette: "masculine", taille: 0.8, corpulence: 0.3, peau: 0, coiffure: "raie", cheveux: 3, barbe: true });
  const a = apparenceValide(JSON.parse(enBase), "mecanistes");
  assert.deepEqual(a, JSON.parse(enBase));
  assert.equal(couleurCheveuxDe(a), COULEURS_CHEVEUX[3]);
});
