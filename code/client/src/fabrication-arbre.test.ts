// 0.7, chantier 5 : l'arbre de progression dans le panneau Fabriquer (client/src/fabrication-arbre.ts).

import { test } from "node:test";
import assert from "node:assert/strict";
import { ceQuiManque, ouTrouver, SE_FABRIQUE_CACHE } from "../../commun/src/aide-fabrication.ts";
import { PROGRESSION, devoileesAuDepart, prochainPalier, recettesDuPalier, type VueProgression } from "../../commun/src/progression.ts";
import { recette, recettesConnues } from "../../commun/src/recettes.ts";
import { SEUIL_ONGLETS, categorieDe, enTete, nouveautesParOnglet, ongletsVides, planFabrication, recetteVisible, sousTitre } from "./fabrication-arbre.ts";

/** Une vue de progression, comme le serveur l'envoie. */
function vue(devoilees: string[], plus: Partial<VueProgression> = {}): VueProgression {
  return { devoilees, nonVues: [], prochain: prochainPalier("charbonniers", new Set(devoilees)), autres: false, entrevues: [], ...plus };
}

test("premier écran : le feu et l'abri, sans barre d'onglets, et les silhouettes du palier 1", () => {
  const plan = planFabrication("charbonniers", {}, vue(devoileesAuDepart()));
  assert.deepEqual(plan.recettes.map((r) => r.id), ["abri"]);
  assert.equal(plan.feu, true);
  assert.equal(plan.dakota, false, "le foyer Dakota attend de quoi creuser");
  assert.equal(plan.nombre, 2);
  assert.equal(plan.avecOnglets, false);
  assert.equal(plan.palier, 1);
  const attendues = recettesDuPalier(1, "charbonniers").filter((id) => !devoileesAuDepart().includes(id));
  assert.deepEqual(new Set(plan.silhouettes.map((s) => s.id)), new Set(attendues));
  // Une silhouette ne dit que le besoin : l'indice de la table, jamais le nom de la recette.
  for (const s of plan.silhouettes) {
    assert.equal(s.indice, PROGRESSION[s.id]!.indice);
    const nom = recette(s.id)?.nom;
    if (nom) assert.ok(!s.indice.toLowerCase().includes(nom.toLowerCase()), `${s.id} : l'indice donne le nom`);
  }
  assert.equal(sousTitre(plan), `2 recettes · ${attendues.length} à découvrir`);
  // Les autres familles : rien tant que le Comptoir ou la rencontre ne les a pas montrées (Q6).
  assert.deepEqual(plan.repliees, []);
  assert.deepEqual(plan.entrevues, []);
});

test("la barre d'onglets apparaît à 8 recettes, en entier ; les onglets vides sont atténués", () => {
  const sept = ["feu_de_camp", "abri", "lit_branchages", "ficelle", "corde", "volaille", "cepes_poeles"];
  assert.equal(planFabrication("charbonniers", {}, vue(sept)).avecOnglets, false);
  const huit = [...sept, "hache"];
  const plan = planFabrication("charbonniers", {}, vue(huit));
  assert.equal(plan.nombre, SEUIL_ONGLETS);
  assert.equal(plan.avecOnglets, true);
  const vides = ongletsVides(plan);
  assert.ok(!vides.has("feu") && !vides.has("batir") && !vides.has("materiaux") && !vides.has("outils"));
  assert.ok(vides.has("ateliers"), "aucun atelier encore : l'onglet reste, atténué");
});

test("les silhouettes sont celles du prochain palier (décision Q2), celles de la quête en cours d'abord", () => {
  const p1 = recettesDuPalier(1, "voltaiques");
  const prochain = prochainPalier("voltaiques", new Set(p1), new Set(["coffre"]));
  const plan = planFabrication("voltaiques", {}, { devoilees: p1, nonVues: [], prochain, autres: false, entrevues: [] });
  assert.equal(plan.palier, 2);
  assert.equal(plan.silhouettes[0]!.id, "coffre", "la quête « Un coffre à soi » passe en tête");
  assert.ok(plan.silhouettes.every((s) => PROGRESSION[s.id]!.palier === 2));
});

test("Fabriquer ne montre que les recettes dévoilées, même connues (Q4 : on cache, on ne détruit rien)", () => {
  const plan = planFabrication("mecanistes", {}, vue(["feu_de_camp", "abri", "pedalier"]));
  const connues = new Set(recettesConnues("mecanistes").map((r) => r.id));
  assert.ok(connues.has("arbalete"));
  assert.deepEqual(plan.recettes.map((r) => r.id).sort(), ["abri", "pedalier"]);
});

test("les autres familles : cachées, puis repliées par famille au déclencheur A ; les entrevues à part", () => {
  const base = ["feu_de_camp", "abri"];
  const plan = planFabrication("charbonniers", {}, vue(base, { autres: true, entrevues: ["matraque_fortune"] }));
  assert.deepEqual(plan.repliees.map((g) => g.famille), ["voltaiques", "mecanistes"]);
  assert.ok(plan.repliees.every((g) => g.recettes.every((r) => r.famille === g.famille)));
  assert.deepEqual(plan.entrevues.map((r) => r.id), ["matraque_fortune"]);
  assert.ok(!plan.repliees.some((g) => g.recettes.some((r) => r.id === "matraque_fortune")), "une entrevue ne se compte pas deux fois");
  // Sans A, seules les entrevues se montrent.
  const sansA = planFabrication("charbonniers", {}, vue(base, { entrevues: ["matraque_fortune"] }));
  assert.deepEqual(sansA.repliees, []);
  assert.equal(sansA.entrevues.length, 1);
});

test("la pastille de l'onglet : les nouveautés de chaque catégorie, éteinte une fois l'onglet regardé", () => {
  const ids = ["corde", "ficelle", "hache", "foyer_dakota"];
  assert.equal(categorieDe("foyer_dakota"), "feu");
  assert.deepEqual(nouveautesParOnglet(ids), { materiaux: 2, outils: 1, feu: 1 });
  assert.deepEqual(nouveautesParOnglet(ids, new Set(["materiaux"])), { outils: 1, feu: 1 });
  const plan = planFabrication("charbonniers", {}, vue(["feu_de_camp", "abri", "corde"], { nonVues: ["corde", "inconnue"] }));
  assert.deepEqual(plan.nonVues, ["corde"], "une recette non dévoilée ne fait pas de pastille");
});

test("une carte nouvelle passe en tête de son onglet à l'ouverture, les autres gardent leur ordre", () => {
  const cartes = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
  assert.deepEqual(enTete(cartes, new Set(["c"])).map((c) => c.id), ["c", "a", "b", "d"]);
  assert.deepEqual(enTete(cartes, new Set()).map((c) => c.id), ["a", "b", "c", "d"]);
});

test("« Il manque… » ne cite jamais une recette cachée (§4.4)", () => {
  const plan = planFabrication("charbonniers", {}, vue(["feu_de_camp", "abri", "recuperateur_pluie"]));
  const visible = recetteVisible(plan);
  assert.equal(visible("corde"), false);
  const sources = ouTrouver("corde", visible);
  assert.ok(sources.includes(SE_FABRIQUE_CACHE), sources.join(" | "));
  assert.ok(!sources.some((s) => s.includes("Tresser")), "le nom de la recette cachée ne sort pas");
  const lignes = ceQuiManque(recette("recuperateur_pluie")!, {}, visible).join(" ");
  assert.ok(!lignes.includes("« Tresser"), lignes);
  // Dévoilée, on la nomme comme avant.
  const avecCorde = recetteVisible(planFabrication("charbonniers", {}, vue(["feu_de_camp", "abri", "corde"])));
  assert.ok(ouTrouver("corde", avecCorde).some((s) => s.startsWith("le fabriquer (« ")));
  // Sans arbre (les tests, l'aide), rien ne change.
  assert.ok(ouTrouver("corde").some((s) => s.startsWith("le fabriquer (« ")));
});

test("sans état de progression (serveur d'avant la 0.7), on montre tout comme avant", () => {
  const plan = planFabrication("voltaiques", {}, null);
  assert.equal(plan.recettes.length, recettesConnues("voltaiques").length);
  assert.equal(plan.avecOnglets, true);
  assert.equal(plan.dakota, true);
  assert.deepEqual(plan.silhouettes, []);
  assert.ok(plan.repliees.length === 2);
});
