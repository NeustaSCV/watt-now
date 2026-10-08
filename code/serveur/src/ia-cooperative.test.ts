// Étape 0.5c (Book 23 §7, §8) : l'IA dans un bâtiment. Les murs arrêtent le son et la vue, l'obscurité est locale,
// les Éteints passent par les portes, la cascade des gémissements, les groupes, le retour dans sa zone.

import { test } from "node:test";
import assert from "node:assert/strict";
import { ARRIVEE_COOP, pieceDe, portesInitiales } from "../../commun/src/cooperative.ts";
import { GEMISSEMENT, RETOUR_ZONE_S, penser, type Eteint, type Humain, type Milieu } from "../../commun/src/eteints.ts";
import { eteintsCoop } from "../../commun/src/eteints-coop.ts";
import { heurte, zoneCoop } from "../../commun/src/lieux.ts";
import { milieuCoop } from "../../commun/src/milieu-coop.ts";
import type { Stimulus } from "../../commun/src/signature.ts";

function alea() {
  let g = 11;
  return () => ((g = (g * 9301 + 49297) % 233280) / 233280);
}

/** Fait vivre les Éteints `secondes` durant (pas de 0,1 s), avec des bruits qui peuvent dépendre du temps. */
function vivre(
  eteints: Eteint[],
  secondes: number,
  bruits: (t: number) => Stimulus[],
  portes = portesInitiales(),
  humains: Humain[] = [],
  /** null : à ciel ouvert, sans murs. */
  milieu: Milieu | null = milieuCoop(portes),
) {
  const zone = zoneCoop(portes);
  const a = alea();
  for (let t = 0; t < secondes; t += 0.1) {
    const gemissements: Stimulus[] = eteints
      .filter((e) => (e.gemit ?? 0) > 0)
      .map((e) => ({ genre: "son", x: e.x, z: e.z, portee: GEMISSEMENT.portee, intensite: GEMISSEMENT.intensite }));
    const stimuli = [...bruits(t), ...gemissements];
    for (const e of eteints) penser(e, 0.1, stimuli, humains, eteints, false, zone, a, milieu ?? undefined);
  }
}

const course = (x: number, z: number): Stimulus => ({ genre: "son", x, z, portee: 16, intensite: 1 });
const chambreFroide = (es: Eteint[]) => es.filter((e) => pieceDe(e.maison!.x, e.maison!.z) === "chambre_froide");
const groupe = (es: Eteint[], g: number) => es.filter((e) => e.groupe === g);

test("0.5c : 24 Éteints, chacun dans sa pièce, aucun dans un mur, aucun à moins de 15 m du portail", () => {
  const es = eteintsCoop();
  assert.equal(es.length, 24);
  const zone = zoneCoop(portesInitiales());
  for (const e of es) {
    assert.ok(!heurte(zone, e.x, e.z, 0.3), `Éteint ${e.id} dans un obstacle`);
    assert.ok(Math.hypot(e.x - ARRIVEE_COOP.x, e.z - ARRIVEE_COOP.z) >= 15, `Éteint ${e.id} trop près de l'arrivée`);
  }
  assert.equal(chambreFroide(es).length, 6);
  for (const g of [1, 2, 3]) assert.ok(groupe(es, g).every((e) => pieceDe(e.x, e.z) === "hangar"));
  // Les groupes sont espacés de 12 m au moins.
  const centre = (g: number) => groupe(es, g).reduce((c, e) => ({ x: c.x + e.x / 3, z: c.z + e.z / 3 }), { x: 0, z: 0 });
  for (const [a, b] of [[1, 2], [2, 3], [1, 3]] as const) assert.ok(Math.hypot(centre(a).x - centre(b).x, centre(a).z - centre(b).z) >= 12);
});

test("0.5c : un dormant n'entend pas à travers un mur (et entendrait à ciel ouvert)", () => {
  // On court dans le hangar, juste derrière le mur de la chambre froide (portes fermées).
  const bruit = () => [course(64, 18.2)];
  const murs = eteintsCoop();
  vivre(murs, 20, bruit);
  assert.ok(chambreFroide(murs).every((e) => e.etat === "dormant"));
  // Le même bruit, sans murs : ils se réveillent.
  const libres = eteintsCoop();
  vivre(libres, 20, bruit, portesInitiales(), [], null);
  assert.ok(chambreFroide(libres).some((e) => e.etat !== "dormant"));
});

test("0.5c : la cascade — un dormant réveillé gémit, et toute la chambre froide se réveille", () => {
  const es = eteintsCoop();
  const froide = chambreFroide(es);
  // Un seul se réveille (un bruit tout contre lui, une seconde).
  vivre(es, 1, (t) => (t < 1 ? [{ genre: "son", x: froide[0]!.x + 0.5, z: froide[0]!.z, portee: 3, intensite: 4 }] : []));
  vivre(es, 15, () => []);
  assert.ok(froide.every((e) => e.etat !== "dormant"), froide.map((e) => e.etat).join(","));
});

test("0.5c : un bruit dans le hangar met en marche un seul groupe, qui se suit", () => {
  const es = eteintsCoop();
  const g1 = groupe(es, 1);
  // On court quelques secondes au bout de l'allée ouest, près du groupe 1.
  vivre(es, 4, (t) => (t < 3 ? [course(36, 18)] : []));
  vivre(es, 6, () => []);
  assert.ok(g1.every((e) => e.etat !== "dormant"), "le groupe 1 suit");
  assert.ok(groupe(es, 2).every((e) => e.etat === "dormant"), "le groupe 2 dort");
  assert.ok(groupe(es, 3).every((e) => e.etat === "dormant"), "le groupe 3 dort");
});

test("0.5c : le leurre fait sortir la chambre froide par sa porte arrière", () => {
  const es = eteintsCoop();
  const portes = { ...portesInitiales(), froide_arriere: true };
  // Un gros bruit derrière le bâtiment, dans la cour nord, pendant 40 s (le klaxon d'un tracteur, un réveil…).
  vivre(es, 40, () => [{ genre: "son", x: 70, z: 3.5, portee: 40, intensite: 1.2 }], portes);
  const dehors = chambreFroide(es).filter((e) => pieceDe(e.x, e.z) === "dehors");
  assert.ok(dehors.length >= 3, `${dehors.length} sortis ; positions : ${chambreFroide(es).map((e) => `(${e.x.toFixed(1)}, ${e.z.toFixed(1)})`).join(" ")}`);
  // Porte fermée : personne ne sort.
  const fermee = eteintsCoop();
  vivre(fermee, 40, () => [{ genre: "son", x: 70, z: 3.5, portee: 40, intensite: 1.2 }]);
  assert.equal(chambreFroide(fermee).filter((e) => pieceDe(e.x, e.z) === "dehors").length, 0);
});

test("0.5c : trois minutes sans voir personne, il rentre dans sa zone ; un dormeur s'y rendort", () => {
  const es = eteintsCoop();
  const rampant = es.find((e) => e.variante === "rampant" && e.maison!.x < 5)!;
  rampant.x = 18;
  rampant.z = 46;
  rampant.etat = "errant";
  const equipe = es.find((e) => e.variante === "equipe" && e.dormeur)!;
  equipe.x = 40;
  equipe.z = 50;
  equipe.etat = "errant";
  vivre(es, RETOUR_ZONE_S + 90, () => []);
  assert.ok(Math.hypot(rampant.x - rampant.maison!.x, rampant.z - rampant.maison!.z) < 6, `rampant en (${rampant.x.toFixed(1)}, ${rampant.z.toFixed(1)})`);
  assert.ok(Math.hypot(equipe.x - equipe.maison!.x, equipe.z - equipe.maison!.z) < 6);
  vivre(es, RETOUR_ZONE_S + 30, () => []);
  assert.equal(equipe.etat, "dormant");
});

test("0.5c : dans le noir, on ne voit qu'à quelques mètres ; une lampe se voit de loin", () => {
  const es = eteintsCoop();
  const errant = es.find((e) => e.variante === "equipe" && !e.dormeur)!; // aux bureaux, une pièce noire
  const humain = (x: number, eclaire: boolean): Humain => ({ id: 1, x, z: 35, discret: false, eclaire });
  // En plein jour, à 7 m dans le même bureau noir, sans lampe : il ne le voit pas (au jour, il le verrait à 12 m).
  assert.equal(pieceDe(errant.x - 7, 35), "bureaux");
  vivre([errant], 1, () => [], { ...portesInitiales() }, [humain(errant.x - 7, false)]);
  assert.notEqual(errant.etat, "poursuivant");
  // Avec une lampe allumée : si.
  vivre([errant], 1, () => [], { ...portesInitiales() }, [humain(errant.x - 7, true)]);
  assert.equal(errant.etat, "poursuivant");
});
