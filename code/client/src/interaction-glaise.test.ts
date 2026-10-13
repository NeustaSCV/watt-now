// À la glaise du gué, venu du nord, A propose de creuser, pas les joncs de la touffe voisine (plan 0.8.2 §7.6).

import { test } from "node:test";
import assert from "node:assert/strict";
import { GLAISE, genererGue } from "../../commun/src/gue.ts";
import { USAGES } from "../../commun/src/terrain.ts";
import { proposer } from "./interaction.ts";

const GOURDE = { litres: 0, contenu: "vide" } as never;
const autour = genererGue().filter((r) => Math.hypot(r.x - GLAISE.x, r.z - GLAISE.z) < 6);
const ressources = autour.map((r) => ({ donnees: { ...r, disponible: true } })) as never;

/** Le libellé de A, debout en (x, z), regardant vers o (0 : vers +z, le sud). */
function libelleA(x: number, z: number, o: number): string | undefined {
  return proposer({ x, z, o }, "gue", "mecanistes", ressources, [], [], {}, GOURDE, {}, 0).A?.libelle;
}

test("0.8.2 §7.6 : la touffe de joncs voisine de la glaise est bien là (le cas de la recette)", () => {
  assert.ok(autour.some((r) => r.type === "joncs" && Math.hypot(r.x - GLAISE.x, r.z - GLAISE.z) < 3));
});

test("0.8.2 §7.6 : venu du nord, la touffe passée, A creuse la glaise qu'on regarde", () => {
  const creuser = USAGES.gisement_glaise.libelle;
  const joncs = autour.find((r) => r.type === "joncs")!;
  // Entre la touffe et la glaise, plus près de la touffe, tourné vers la glaise (vers le sud).
  const x = (joncs.x + GLAISE.x) / 2;
  const z = joncs.z + 0.9;
  assert.ok(Math.hypot(joncs.x - x, joncs.z - z) < Math.hypot(GLAISE.x - x, GLAISE.z - z), "la touffe est la plus proche");
  assert.equal(libelleA(x, z, 0), creuser);
  // Tourné vers la touffe (le nord), elle reste à couper.
  assert.equal(libelleA(joncs.x, joncs.z + 0.6, Math.PI), "Couper des joncs");
  // Le cas de la recette au téléphone : 2 m du point de la glaise, la touffe à 0,75 m, tourné vers le sud.
  assert.equal(libelleA(83.35, 43.2, 0), creuser);
  // Tout contre la glaise, quel que soit le regard : creuser.
  assert.equal(libelleA(GLAISE.x, GLAISE.z - 0.9, Math.PI), creuser);
});
