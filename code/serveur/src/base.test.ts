import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Base, PseudoPris } from "./base.ts";
import { POINT_ARRIVEE } from "../../commun/src/regles.ts";

// Les fichiers de test restent dans le projet (règle du CLAUDE.md).
const dossierTests = join(dirname(fileURLToPath(import.meta.url)), "..", "donnees", "tests");

test("créer un compte, puis se connecter avec le bon mot de passe seulement", () => {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Nadia", "enclume42", "charbonniers");
  assert.equal(base.verifierIdentifiants("Nadia", "enclume42")?.id, compte.id);
  assert.equal(base.verifierIdentifiants("nadia", "enclume42")?.id, compte.id, "le pseudo ne tient pas compte de la casse");
  assert.equal(base.verifierIdentifiants("Nadia", "mauvais"), null);
  assert.equal(base.verifierIdentifiants("Inconnu", "enclume42"), null);
  base.fermer();
});

test("un pseudo ne peut pas être pris deux fois, même avec une autre casse", () => {
  const base = new Base(":memory:");
  base.creerCompte("Malik", "courant42", "voltaiques");
  assert.throws(() => base.creerCompte("MALIK", "autre123", "mecanistes"), PseudoPris);
  base.fermer();
});

test("un nouveau personnage apparaît au point d'arrivée, avec sa famille", () => {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "mecanistes");
  const perso = base.chargerPersonnage(compte.id);
  assert.equal(perso?.famille, "mecanistes");
  assert.equal(perso?.position.x, POINT_ARRIVEE.x);
  assert.equal(perso?.position.z, POINT_ARRIVEE.z);
  base.fermer();
});

test("le jeton retrouve le compte ; un faux jeton ne retrouve rien", () => {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Nadia", "enclume42", "charbonniers");
  const jeton = base.creerJeton(compte.id);
  assert.equal(base.compteParJeton(jeton)?.pseudo, "Nadia");
  assert.equal(base.compteParJeton("faux"), null);
  base.fermer();
});

test("la position sauvegardée survit à la fermeture de la base", () => {
  mkdirSync(dossierTests, { recursive: true });
  const chemin = join(dossierTests, `base-${process.pid}.sqlite`);
  try {
    const base = new Base(chemin);
    const compte = base.creerCompte("Nadia", "enclume42", "charbonniers");
    base.sauverPosition(compte.id, { x: 12.5, z: 40.25, o: 1 });
    base.fermer();

    const rouverte = new Base(chemin);
    assert.deepEqual(rouverte.chargerPersonnage(compte.id)?.position, { x: 12.5, z: 40.25, o: 1 });
    rouverte.fermer();
  } finally {
    rmSync(dossierTests, { recursive: true, force: true });
  }
});

test("l'apparence choisie à la création est gardée ; un ancien compte a celle de sa famille", () => {
  const base = new Base(":memory:");
  const choisie = { silhouette: "masculine" as const, taille: 0.8, corpulence: 0.3, peau: 0, coiffure: "raie" as const, cheveux: 3, barbe: true };
  const a = base.creerCompte("Malo", "pedalier42", "mecanistes", true, choisie);
  assert.deepEqual(base.chargerApparence(a.id, "mecanistes"), choisie);
  const b = base.creerCompte("Rose", "potager42", "mecanistes");
  assert.equal(base.chargerApparence(b.id, "mecanistes").coiffure, "longs");
  assert.equal(base.pseudoPris("MALO"), true);
  assert.equal(base.pseudoPris("Personne"), false);
  base.fermer();
});
