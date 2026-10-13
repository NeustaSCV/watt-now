// La gourde au milieu de la mare (plan 0.8.2, chantier I : R21) : au bord, A coupe les joncs ; au milieu, A remplit la
// gourde. Au bord sans joncs à portée, A dit d'entrer dans l'eau.

import { test } from "node:test";
import assert from "node:assert/strict";
import { MARE, rayonMare } from "../../commun/src/terrain.ts";
import { proposer } from "./interaction.ts";

const GOURDE = { litres: 0, contenu: "vide" } as never;

/** Ce que proposent A et B, debout en (x, z), avec ces joncs autour et une gourde dans le sac. */
function boutons(x: number, z: number, joncs: { x: number; z: number }[], gourde = 1) {
  const ressources = joncs.map((j, i) => ({ donnees: { id: i + 1, type: "joncs", x: j.x, z: j.z, disponible: true } })) as never;
  return proposer({ x, z, o: 0 }, "terrain", "mecanistes", ressources, [], [], { gourde }, GOURDE, {}, 0);
}

test("au bord, A coupe les joncs ; au milieu, A remplit la gourde", () => {
  const r = rayonMare(Math.PI);
  const touffe = { x: MARE.x - r - 0.6, z: MARE.z };
  // Au bord, à côté d'une touffe : les joncs, comme avant, sans conflit.
  const bord = boutons(MARE.x - r - 0.2, MARE.z, [touffe]);
  assert.equal(bord.A?.libelle, "Couper des joncs");
  // Au milieu : la gourde, même si une touffe est encore à portée de main.
  // (au sud, la mare est étroite : la touffe du bord est à 1,4 m du milieu)
  const sud = { x: MARE.x, z: MARE.z - rayonMare(-Math.PI / 2) - 0.45 };
  assert.ok(Math.hypot(sud.x - MARE.x, sud.z - (MARE.z - 1)) < 2, "la touffe est à portée de main");
  const milieu = boutons(MARE.x, MARE.z - 1, [sud]);
  assert.equal(milieu.A?.libelle, "Remplir la gourde");
  assert.ok(milieu.A && "message" in milieu.A && milieu.A.message.t === "interagir" && milieu.A.message.cible.genre === "mare");
  // Sans gourde : rien à remplir.
  assert.equal(boutons(MARE.x, MARE.z, [], 0).A, null);
});

test("au bord, sans joncs à portée, A dit d'entrer jusqu'au milieu (rien ne se lance)", () => {
  const A = boutons(MARE.x - rayonMare(Math.PI) - 0.3, MARE.z, []).A;
  assert.equal(A?.libelle, "Remplir la gourde (au milieu)");
  assert.ok(A && "examiner" in A && /jusqu'au milieu/.test(A.examiner));
});
