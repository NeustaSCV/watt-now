// L'idée de l'escabeau (0.10.1, A1) : devant un fruitier mûr sans escabeau dans son cercle, A dit que les fruits sont trop
// haut (rien ne se lance), et signale au serveur le fait « arbre_haut » ; avec l'escabeau au pied, A cueille.

import { test } from "node:test";
import assert from "node:assert/strict";
import { proposer } from "./interaction.ts";

const GOURDE = { litres: 0, contenu: "vide" } as never;
const POMMIER = { donnees: { id: 1, type: "pommier", x: 0, z: 0, disponible: true } } as never;

test("un fruitier sans escabeau : le texte d'examen, et le constat « arbre_haut » pour le serveur", () => {
  const A = proposer({ x: 1.5, z: 0, o: 0 }, "terrain", "mecanistes", [POMMIER], [], [], {}, GOURDE, {}, 0).A;
  assert.ok(A && "examiner" in A, "rien ne se lance");
  assert.match(A.examiner, /trop haut/);
  assert.equal(A.constat, "arbre_haut");
});

test("avec l'escabeau dans le cercle : A cueille, sans constat", () => {
  const escabeau = { id: 9, type: "escabeau", x: 0.5, z: 0, niveau: 1, etat: {} } as never;
  const A = proposer({ x: 1.5, z: 0, o: 0 }, "terrain", "mecanistes", [POMMIER], [], [escabeau], {}, GOURDE, {}, 0).A;
  assert.ok(A && "message" in A && A.message.t === "interagir");
});
