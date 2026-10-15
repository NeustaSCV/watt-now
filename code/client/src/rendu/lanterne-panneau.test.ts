// La lanterne des panneaux de sortie (0.10, décision du porteur du 2026-10-15) : une potence et une lanterne au-dessus
// d'un panneau, en un maillage ; sa lumière devant le panneau, dans le repère du jeu ; son verre luit la nuit.

import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { LUMIERE_LANTERNE, poserLanterne } from "./lanterne-panneau.ts";

test("la lanterne pend devant le panneau, au-dessous du haut du poteau ; sa lumière est comptée dans le repère du jeu", () => {
  const l = poserLanterne({ x: 2, y: 2.3, z: -1, angle: Math.PI / 2, avance: 0.5, monde: { x: 100, z: 50 } });
  // Le panneau regarde vers +x : la lanterne est 50 cm devant (+x), un peu sous la potence.
  assert.ok(Math.abs(l.source.x - 102.5) < 1e-6, `x ${l.source.x}`);
  assert.ok(Math.abs(l.source.z - 49) < 1e-6, `z ${l.source.z}`);
  assert.ok(l.source.y < 2.3 && l.source.y > 1.9, `y ${l.source.y}`);
  assert.equal(l.source.couleur, LUMIERE_LANTERNE.couleur);
  assert.ok(l.source.vacillement > 0, "une flamme");
  // Le maillage : la potence part du poteau et va jusqu'à la lanterne, devant.
  const b = new THREE.Box3().setFromObject(l.maillage);
  assert.ok(b.min.x > 1.9 && b.max.x < 2.65, `de ${b.min.x} à ${b.max.x}`);
  assert.ok(b.max.y <= 2.33 && b.min.y > 1.9);
});

test("un appel de dessin par lanterne, une matière pour toutes ; le verre luit la nuit, pas le jour", () => {
  const a = poserLanterne({ x: 0, y: 2, z: 0, angle: 0 });
  const b = poserLanterne({ x: 5, y: 2, z: 0, angle: 1 });
  assert.ok(!Array.isArray(a.maillage.material), "une seule matière");
  assert.equal(a.maillage.material, b.maillage.material, "partagée");
  const m = a.maillage.material as THREE.MeshStandardMaterial;
  a.allumer(true);
  assert.ok(m.emissiveIntensity > 1, "allumée la nuit");
  assert.ok(m.emissiveMap, "seul le verre luit (carte d'émission)");
  a.allumer(false);
  assert.equal(m.emissiveIntensity, 0);
});
