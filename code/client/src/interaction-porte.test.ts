// Plan 0.8.2 (chantier D) : un objet jeté devant une porte ne cache plus « Ouvrir la porte » (la laiterie de la
// Coopérative, relevé à la recette de la 0.8), ni la grande porte du Moulin.

import { test } from "node:test";
import assert from "node:assert/strict";
import { PORTES, distancePorte } from "../../commun/src/cooperative.ts";
import type { SacVu } from "../../commun/src/messages.ts";
import { PORTES_MOULIN } from "../../commun/src/moulin.ts";
import { proposer } from "./interaction.ts";

const GOURDE = { litres: 0, contenu: "vide" } as never;

/** Ce que propose le bouton A, debout en (x, z), avec ces objets au sol et ces portes. */
function boutonA(lieu: "cooperative" | "moulin", x: number, z: number, sacs: SacVu[], portes: Record<string, boolean>) {
  return proposer({ x, z, o: Math.PI }, lieu, "voltaiques", [], [], [], {}, GOURDE, {}, 0, sacs, [], 1, [], 0, portes).A;
}

test("à la laiterie, un sac jeté devant la porte fermée : « Ouvrir la porte » reste proposé", () => {
  const porte = PORTES.find((p) => p.id === "froide_hangar")!;
  // Dans le hangar, face à la porte de la laiterie ; le tas jeté à 0,6 m devant soi, entre soi et la porte.
  const joueur = { x: porte.x, z: porte.z + 1.4 };
  const tas: SacVu = { id: 7, x: porte.x, z: porte.z + 0.8, aMoi: true, jete: true, contenu: { seau_10l: 1 } };
  assert.ok(Math.hypot(tas.x - joueur.x, tas.z - joueur.z) < distancePorte(porte, joueur.x, joueur.z) + 0.3, "le tas est plus près que la porte");
  const A = boutonA("cooperative", joueur.x, joueur.z, [tas], { froide_hangar: false });
  assert.equal(A?.libelle, "Ouvrir la porte");
  // Ouverte, c'est « Refermer la porte » qui reste proposé.
  assert.equal(boutonA("cooperative", joueur.x, joueur.z, [tas], { froide_hangar: true })?.libelle, "Refermer la porte");
  // Un pas en arrière, la porte n'est plus à portée : on ramasse le tas.
  const recul = { x: porte.x, z: porte.z + 2.2 };
  assert.match(boutonA("cooperative", recul.x, recul.z, [{ ...tas, z: porte.z + 1.6 }], { froide_hangar: false })?.libelle ?? "", /^Ramasser/);
  // Sans porte à portée, le tas se ramasse comme avant.
  assert.match(boutonA("cooperative", 20, 50, [{ ...tas, x: 20, z: 50.6 }], {})?.libelle ?? "", /^Ramasser/);
});

test("partout : un sac perdu devant une porte ne la cache pas non plus (la grande porte du Moulin)", () => {
  const porte = PORTES_MOULIN.find((p) => p.fermable)!;
  const sac: SacVu = { id: 3, x: porte.x + 0.3, z: porte.z + 0.3, aMoi: true };
  const A = boutonA("moulin", porte.x + 0.6, porte.z + 0.6, [sac], { [porte.id]: false });
  assert.match(A?.libelle ?? "", /grande porte|grosse clé/);
});

/** Ce que proposent A et B, debout en (x, z). */
function boutons(x: number, z: number, sacs: SacVu[], portes: Record<string, boolean>) {
  return proposer({ x, z, o: Math.PI }, "cooperative", "voltaiques", [], [], [], {}, GOURDE, {}, 0, sacs, [], 1, [], 0, portes);
}

test("une porte et un objet au sol à portée : A garde la porte, B ramasse l'objet (0.8.2, chantier H)", () => {
  const porte = PORTES.find((p) => p.id === "froide_hangar")!;
  const joueur = { x: porte.x, z: porte.z + 1.4 };
  const tas: SacVu = { id: 7, x: porte.x, z: porte.z + 0.8, aMoi: true, jete: true, contenu: { seau_10l: 1 } };
  const { A, B } = boutons(joueur.x, joueur.z, [tas], { froide_hangar: false });
  assert.equal(A?.libelle, "Ouvrir la porte");
  assert.match(B?.libelle ?? "", /^Ramasser : /);
  assert.ok(B && "message" in B && B.message.t === "interagir" && B.message.cible.genre === "sac" && B.message.cible.id === 7 && B.message.verbe === "reprendre");
  // Son propre sac perdu devant la porte : B le reprend.
  const sac: SacVu = { id: 9, x: porte.x, z: porte.z + 0.8, aMoi: true };
  assert.equal(boutons(joueur.x, joueur.z, [sac], { froide_hangar: false }).B?.libelle, "Reprendre ton sac");
  // Le sac de quelqu'un d'autre ne se prend pas : B reste « Examiner » la porte.
  assert.equal(boutons(joueur.x, joueur.z, [{ ...sac, aMoi: false }], { froide_hangar: false }).B?.libelle, "Examiner");
  // Sans objet au sol, B examine la porte, comme avant.
  assert.equal(boutons(joueur.x, joueur.z, [], { froide_hangar: false }).B?.libelle, "Examiner");
});
