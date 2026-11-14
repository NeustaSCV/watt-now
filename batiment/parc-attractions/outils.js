// Wattyland : les couleurs, les matières partagées et les petits outils de géométrie.
//
// Chaque matière est créée une seule fois (une matière = un appel de dessin par chantier). Les teintes passent par les
// sommets : cent couleurs de manèges ne coûtent rien de plus.

import * as THREE from "three";
import { PALETTE, MAT, matiere, matiereMonde, matiereTexture, matiereVerre } from "../commun/atelier.js";
import { texAtlas, ATLAS, AL, AH } from "./textures.js";

export const TAU = Math.PI * 2;
export const PI = Math.PI;

/** Les couleurs du parc : l'Abondance passée au soleil (rien de vif, sauf les enseignes). */
export const C = {
  canard: 0x3f7774, // le bleu canard de Watty, délavé
  canardPale: 0x6e9c95,
  creme: 0xe0d4b6,
  cremeSale: 0xc9bc9c,
  or: 0xb8963e,
  orTerni: 0x9a8146,
  rouge: 0xa94a3c, // rouge de manège passé
  rougeVif: 0xc8362b,
  rose: 0xc99aa0,
  jaune: 0xd2b450,
  bleu: 0x5b7f97,
  vert: 0x6d9466,
  mauve: 0x8a7096,
  blanc: 0xe2ddd0,
  acier: 0x8c908c,
  fonte: 0x3b3d3b,
  caoutchouc: 0x2a2826,
  noir: 0x262422,
  rouille: PALETTE.rouille,
  rouilleSombre: PALETTE.rouilleSombre,
  bois: PALETTE.bois,
  boisSombre: PALETTE.boisSombre,
  boisGris: PALETTE.boisGris,
  beton: 0xb2ada2,
  betonSombre: 0x8e8a82,
  asphalte: 0x8b8880,
  terrazzo: 0xc6b89e,
  herbe: 0x7d9a55,
  herbeSombre: 0x5f7f45,
  suie: PALETTE.suie,
  peluche: 0x5f9a96,
};

const memo = new Map();
function une(cle, f) {
  if (!memo.has(cle)) memo.set(cle, f());
  return memo.get(cle);
}

/** Les matières partagées du parc. */
export const M = {
  mat: () => matiere(0.95, 0), // bois brut, béton peint, végétation, tissu épais
  satin: () => matiere(0.6, 0.05), // bois verni, fibre de verre peinte, plastique
  lisse: () => matiere(0.3, 0.05), // miroirs ternis, carrelage, émail
  tole: () => matiere(0.75, 0.3), // métal peint, rouillé
  metal: () => matiere(0.4, 0.7), // laiton, chrome, acier nu
  toile: () => MAT.toile(),
  beton: () => matiereMonde("beton"),
  verre: () => matiereVerre(PALETTE.verreSombre, 0.4),
  atlas: () =>
    une("atlas", () => {
      const m = new THREE.MeshStandardMaterial({ map: texAtlas(), vertexColors: true, transparent: true, alphaTest: 0.04, roughness: 0.85, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      m.userData.sansOmbre = true;
      return m;
    }),
  /** Ce qui luit encore : ampoules allumées, l'œil de Watty (sans éclairage, toujours vif). */
  ampoule: () =>
    une("ampoule", () => {
      const m = new THREE.MeshBasicMaterial({ vertexColors: true });
      m.userData.sansOmbre = true;
      return m;
    }),
};

/** Un panneau peint de l'atlas, posé à plat (le plan regarde +z, tourné de `ry`). `couleur` teinte le dessin. */
export function panneau(c, region, x, y, z, l, h, ry = 0, rx = 0, couleur = 0xffffff, rz = 0) {
  const [px, py, pw, ph] = ATLAS[region];
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
  c.poser(g, M.atlas(), couleur, { x, y, z, ry, rx, rz }, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Un panneau de l'atlas dont on ne prend qu'une part (u0..u1, v0..v1 de la région, 0 = gauche / haut). */
export function panneauPart(c, region, [u0, u1, v0, v1], x, y, z, l, h, ry = 0, rx = 0, couleur = 0xffffff) {
  const [px, py, pw, ph] = ATLAS[region];
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    const uu = u0 + uv.getX(i) * (u1 - u0);
    const vv = v0 + (1 - uv.getY(i)) * (v1 - v0);
    uv.setXY(i, (px + uu * pw) / AL, 1 - (py + vv * ph) / AH);
  }
  c.poser(g, M.atlas(), couleur, { x, y, z, ry, rx }, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Un cylindre de rayons r1 (bas) et r2 (haut), centré en (x, y, z), éventuellement tourné. */
export function cyl(c, x, y, z, r1, r2, h, couleur, mat, cotes = 8, pose = {}, ouvert = false, options = {}) {
  const g = new THREE.CylinderGeometry(r2, r1, h, cotes, 1, ouvert);
  c.poser(g, mat, couleur, { x, y, z, ...pose }, options);
  g.dispose();
}

/** Une sphère à facettes. */
export function boule(c, x, y, z, r, couleur, mat, e = 1, detail = 0, pose = {}) {
  const g = new THREE.IcosahedronGeometry(r, detail);
  c.poser(g, mat, couleur, { x, y, z, e, ...pose }, { crasse: false, nuance: 0.05 });
  g.dispose();
}

/** Un quadrilatère (4 points [x, y, z]) visible des deux côtés si `verso`. */
export function quad(c, mat, couleur, p, verso = true, options = {}) {
  const pos = [];
  for (const k of [0, 1, 2, 0, 2, 3]) pos.push(...p[k]);
  if (verso) for (const k of [0, 2, 1, 0, 3, 2]) pos.push(...p[k]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  c.poser(g, mat, couleur, {}, { crasse: false, nuance: 0.03, ...options });
  g.dispose();
}

/** Un triangle, des deux côtés. */
export function tri2(c, mat, couleur, p, options = {}) {
  const pos = [...p[0], ...p[1], ...p[2], ...p[0], ...p[2], ...p[1]];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  c.poser(g, mat, couleur, {}, { crasse: false, nuance: 0.04, ...options });
  g.dispose();
}

/** Les quatre côtés d'un rectangle comme obstacles. */
export function obstacleRect(b, x1, z1, x2, z2, nature) {
  b.obstacle(x1, z1, x2, z1, nature);
  b.obstacle(x2, z1, x2, z2, nature);
  b.obstacle(x2, z2, x1, z2, nature);
  b.obstacle(x1, z2, x1, z1, nature);
}

/** Un polygone régulier comme obstacle (cercle approché). */
export function obstacleCercle(b, x, z, r, n, nature, sauf = () => false) {
  for (let i = 0; i < n; i++) {
    const a1 = (i / n) * TAU;
    const a2 = ((i + 1) / n) * TAU;
    if (sauf((a1 + a2) / 2)) continue;
    b.obstacle(x + Math.cos(a1) * r, z + Math.sin(a1) * r, x + Math.cos(a2) * r, z + Math.sin(a2) * r, nature);
  }
}

/** Un point le long d'une ligne brisée. */
export function lerp3(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export { THREE, matiereTexture };
