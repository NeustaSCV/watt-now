// À la glaise du gué, A propose de creuser (plan 0.8.2 §7.6) : la berge de glaise est une plaque, on la creuse depuis
// son bord, quel que soit le côté d'où l'on vient. Depuis la 0.8.3, elle est au point du modèle, au milieu de la berge
// de vase : la touffe de joncs n'est plus à côté, rien d'autre ne passe avant elle.

import { test } from "node:test";
import assert from "node:assert/strict";
import { GLAISE, genererGue } from "../../commun/src/gue.ts";
import { USAGES } from "../../commun/src/terrain.ts";
import { proposer } from "./interaction.ts";

const GOURDE = { litres: 0, contenu: "vide" } as never;
const autour = genererGue().filter((r) => Math.hypot(r.x - GLAISE.x, r.z - GLAISE.z) < 12);
const ressources = autour.map((r) => ({ donnees: { ...r, disponible: true } })) as never;
const creuser = USAGES.gisement_glaise.libelle;

/** Le libellé de A, debout en (x, z), regardant vers o (0 : vers +z, le sud). */
function libelleA(x: number, z: number, o: number): string | undefined {
  return proposer({ x, z, o }, "gue", "mecanistes", ressources, [], [], {}, GOURDE, {}, 0).A?.libelle;
}

test("0.8.3 : la glaise est à découvert, loin des joncs (la touffe voisine de la 0.8.2 n'y est plus)", () => {
  assert.ok(!autour.some((r) => r.type === "joncs" && Math.hypot(r.x - GLAISE.x, r.z - GLAISE.z) < 8));
});

test("0.8.2 §7.6 : tout autour de la plaque, tourné vers elle, A creuse la glaise", () => {
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    // À 1,5 m du point (le bord de la plaque est à 0,8 m), regardant le point.
    const x = GLAISE.x - Math.sin(a) * 1.5;
    const z = GLAISE.z - Math.cos(a) * 1.5;
    assert.equal(libelleA(x, z, a), creuser, `venu de l'angle ${k}`);
  }
  // Venu du camping-car (au nord), tourné vers le sud : creuser.
  assert.equal(libelleA(GLAISE.x, GLAISE.z - 1.6, 0), creuser);
  // Tout contre la glaise, quel que soit le regard : creuser.
  for (const o of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) assert.equal(libelleA(GLAISE.x, GLAISE.z - 0.9, o), creuser);
});
