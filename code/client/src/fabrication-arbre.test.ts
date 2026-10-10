// 0.7, chantier 5 : l'arbre de progression dans le panneau Fabriquer (client/src/fabrication-arbre.ts) ; plan 0.8,
// chantier 2 : les silhouettes du niveau suivant des constructions qu'on a.

import { test } from "node:test";
import assert from "node:assert/strict";
import { ceQuiManque, ouTrouver, SE_FABRIQUE_CACHE } from "../../commun/src/aide-fabrication.ts";
import { devoileesAuDepart, type SilhouetteVue, type VueProgression } from "../../commun/src/progression.ts";
import { recette, recettesConnues } from "../../commun/src/recettes.ts";
import { VOIE_SURFACE } from "../../commun/src/lignees.ts";
import { SEUIL_ONGLETS, categorieDe, etatCle, enTete, nouveautesParOnglet, ongletsVides, planFabrication, recetteVisible, sousTitre } from "./fabrication-arbre.ts";

/** Une vue de progression, comme le serveur l'envoie. */
function vue(devoilees: string[], plus: Partial<VueProgression> = {}): VueProgression {
  return { devoilees, nonVues: [], silhouettes: [], autres: false, entrevues: [], idees: [], indices: {}, ...plus };
}

test("premier écran : le feu et l'abri, sans barre d'onglets, sans silhouette tant qu'on n'a rien construit", () => {
  const plan = planFabrication("charbonniers", {}, vue(devoileesAuDepart()));
  assert.deepEqual(plan.recettes.map((r) => r.id), ["abri"]);
  assert.equal(plan.feu, true);
  assert.equal(plan.dakota, false, "le foyer Dakota attend de quoi creuser");
  assert.equal(plan.nombre, 2);
  assert.equal(plan.avecOnglets, false);
  assert.deepEqual(plan.silhouettes, []);
  assert.equal(sousTitre(plan), "2 recettes");
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

test("les silhouettes disent où et quoi (« Au foyer de pierres : poêlée de cèpes »), celles de la quête d'abord", () => {
  const silhouettes: SilhouetteVue[] = [
    { id: "lame_forgee", ou: "Au foyer de forge", quete: true },
    { id: "cepes_poeles", ou: "Au foyer de pierres" },
    { id: "epieu", ou: "Au foyer de pierres" },
    { id: "abri", ou: "Au foyer de pierres" },
  ];
  const plan = planFabrication("charbonniers", {}, vue(["feu_de_camp", "abri"], { silhouettes }));
  assert.deepEqual(plan.silhouettes.map((s) => s.indice), ["Au foyer de forge : forger un couteau", "Au foyer de pierres : poêlée de cèpes", "Au foyer de pierres : épieu durci au feu"]);
  assert.equal(plan.silhouettes.length, 3, "une recette déjà dévoilée n'est pas une silhouette");
  assert.equal(plan.silhouettes[0]!.quete, true);
  assert.equal(plan.silhouettes[1]!.categorie, "feu");
  assert.equal(sousTitre(plan), "2 recettes · 3 à découvrir");
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

test("la fiche du foyer de cuisine montre le grillage « déjà en poche » une fois l'idée venue, sinon l'indice en deux temps", () => {
  const foyer = VOIE_SURFACE.find((e) => e.id === "foyer_cuisine")!;
  const e = { ...foyer, cle: foyer.cle! };
  assert.deepEqual(etatCle(e, vue([], { idees: ["foyer_cuisine"] })), { enPoche: true });
  assert.deepEqual(etatCle(e, vue([])), { indice: "Une grille ? Les clôtures en sont faites.", temps: 1 });
  assert.deepEqual(etatCle(e, vue([], { indices: { foyer_cuisine: 2 } })), { indice: "Le parc à volailles de L1A.", temps: 2 });
  assert.deepEqual(etatCle({ ...e, aVenir: "niveau 2" }, vue([])), { plusLoin: true });
});
