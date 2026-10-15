// Autour de la station-service (0.10, R52 ; décision du porteur du 2026-10-15) : vue de loin, à l'arrivée, la halte
// flottait sur le ciel (son sol s'arrête 30 m au-delà de ses bords). Un décor simple la prolonge : le sous-bois de la
// forêt, vu d'en haut (des verts sombres mêlés), et la route de la Campagne qui file vers le Carrefour et vers le terrain.
// Un seul maillage (un appel de dessin), sous le sol de la halte (qui le recouvre là où il est).

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { HALTE, ROUTE } from "../../../commun/src/lieux.ts";
import { aleatoire } from "./materiaux.ts";
import { bruit } from "./terrain.ts";

/** Jusqu'où le décor s'étend autour de la halte (m), et la taille de ses carreaux. */
const LOIN = 260;
const PAS = 8;

export function creerBordsStation(): THREE.Mesh {
  const n = bruit(aleatoire(907), 64);
  const x0 = -LOIN;
  const x1 = HALTE.longueur + LOIN;
  const z0 = -LOIN;
  const z1 = HALTE.largeur + LOIN;
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, Math.round((x1 - x0) / PAS), Math.round((z1 - z0) / PAS)).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, -0.12, (z0 + z1) / 2);
  const pos = g.attributes.position!;
  const couleurs = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const sombre = new THREE.Color(0x2f4428);
  const feuillage = new THREE.Color(0x4a6236);
  const clair = new THREE.Color(0x5d7440);
  const asphalte = new THREE.Color(0x56554f);
  const gravier = new THREE.Color(0x8f876f);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    // Les houppiers vus d'en haut : des taches de vert, plus ou moins sombres.
    const a = n((x - x0) / 23, (z - z0) / 23);
    const b = n((x - x0) / 12, (z - z0) / 12);
    c.copy(sombre).lerp(feuillage, a).lerp(clair, Math.max(0, b - 0.6) * 1.5);
    // L'accotement de la route, éclairci (la route elle-même est posée dessus, ci-dessous).
    const d = Math.abs(z - ROUTE.z);
    if (d < ROUTE.demiLargeur + PAS) c.lerp(gravier, Math.max(0, 1 - (d - ROUTE.demiLargeur) / PAS) * 0.6);
    c.toArray(couleurs, i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(couleurs, 3));
  // La route, hors de la halte (dans la halte, son sol la recouvre), aux deux bouts : l'asphalte, dans le même maillage.
  const routes = [[x0, -29], [HALTE.longueur + 29, x1]].map(([a, b]) => {
    const r = new THREE.PlaneGeometry(b! - a!, ROUTE.demiLargeur * 2).rotateX(-Math.PI / 2).translate((a! + b!) / 2, -0.08, ROUTE.z);
    const k = new Float32Array(r.attributes.position!.count * 3);
    for (let i = 0; i < k.length; i += 3) asphalte.toArray(k, i);
    r.setAttribute("color", new THREE.BufferAttribute(k, 3));
    return r;
  });
  const tout = mergeGeometries([g, ...routes]) ?? g;
  for (const r of routes) r.dispose();
  if (tout !== g) g.dispose();
  const m = new THREE.Mesh(tout, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  m.name = "alentours de la station";
  m.receiveShadow = true;
  return m;
}
