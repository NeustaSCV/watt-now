// Les outils propres à la halte du tunnel : matières partagées, lumière « cuite » dans les couleurs de sommet (le tunnel
// est noir : on assombrit tout ce qui est sous la voûte, sauf près des portails, du feu et des veilleuses), et quelques
// géométries simples (quadrilatère, prisme à dessus incliné, maillage à couleurs par sommet).

import * as THREE from "three";
import { matiere, matiereMonde, matiereLueur, matiereVerre, PALETTE } from "../commun/atelier.js";
import { ATLAS, texAtlas } from "./atlas.js";

export const PI = Math.PI;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export function lisse(a, b, v) {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
export const arr = (v) => Math.round(v * 100) / 100;

// ---------- Matières (toutes partagées : une matière = un appel de dessin) ----------

const memo = new Map();
const une = (k, f) => {
  if (!memo.has(k)) memo.set(k, f());
  return memo.get(k);
};

export const M = {
  mat: () => matiere(0.95, 0), // roche, terre, béton brut, bois, tissu
  satin: () => matiere(0.6, 0.05), // carrosseries, plastiques
  lisse: () => matiere(0.3, 0.05), // écrans, carrelage
  tole: () => matiere(0.75, 0.3), // tôle peinte, rouillée
  metal: () => matiere(0.4, 0.7), // acier nu, inox
  beton: () => matiereMonde("beton"), // portails, piédroits, voûte, abri
  verre: () => matiereVerre(PALETTE.verreSombre, 0.4),
  lueur: () => matiereLueur(0xffffff, 0.6), // le jour aux portails, le feu, la frontale (teinte par sommet)
  eau: () =>
    une("eau", () => {
      const m = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.1, metalness: 0.35, transparent: true, opacity: 0.84, depthWrite: false });
      m.userData.sansOmbre = true;
      return m;
    }),
  atlas: () =>
    une("atlas", () => {
      const m = new THREE.MeshStandardMaterial({ map: texAtlas(), vertexColors: true, transparent: true, alphaTest: 0.04, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      m.userData.sansOmbre = true;
      return m;
    }),
};

// ---------- La lumière cuite ----------

let eclairage = () => null;
/** `fn(x, z)` → null (dehors, plein jour) ou { f (jour restant, 0 à 1), chaud (feu), vert (veilleuse), blanc (frontale) }. */
export function reglerEclairage(fn) {
  eclairage = fn;
}

/** La position de l'objet en cours de pose (pour teinter ses pièces selon la lumière du lieu). */
export const ICI = { x: 0, z: 0 };
export function en(x, z, f) {
  const ox = ICI.x;
  const oz = ICI.z;
  ICI.x = x;
  ICI.z = z;
  f();
  ICI.x = ox;
  ICI.z = oz;
}

const _c = new THREE.Color();
/** Une couleur telle qu'on la voit en (x, z) : dans le noir du tunnel, presque rien ; près du feu, orangée. */
export function T(hex, x = ICI.x, z = ICI.z) {
  const e = eclairage(x, z);
  if (!e) return hex;
  _c.setHex(hex);
  const { r, g, b } = _c;
  const k = e.f;
  _c.setRGB(r * (k + e.chaud * 1.15 + e.vert * 0.1 + e.blanc), g * (k + e.chaud * 0.55 + e.vert * 0.55 + e.blanc), b * (k + e.chaud * 0.2 + e.vert * 0.22 + e.blanc * 1.05));
  return _c.getHex();
}

// ---------- Géométries ----------

/** Un panneau de l'atlas posé à plat (le plan regarde +z, tourné de `ry`), teinté par la lumière du lieu. */
export function panneau(c, region, x, y, z, l, h, ry = 0, rx = 0, teinte = 0xffffff) {
  const [px, py, pw, ph] = ATLAS[region];
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / 1024, 1 - (py + (1 - uv.getY(i)) * ph) / 1024);
  c.poser(g, M.atlas(), T(teinte, x, z), { x, y, z, ry, rx }, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Un maillage brut : `pos` (triangles à plat), `col` (une couleur [r, g, b] linéaire par sommet). */
export function pousser(c, mat, pos, col) {
  if (!pos.length) return;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  const n = pos.length / 3;
  const uv = new Float32Array(n * 2);
  const tuile = mat.userData?.tuile;
  if (tuile) {
    const nor = g.attributes.normal;
    for (let i = 0; i < n; i += 3) {
      let nx = 0, ny = 0, nz = 0;
      for (let j = 0; j < 3; j++) {
        nx += Math.abs(nor.getX(i + j));
        ny += Math.abs(nor.getY(i + j));
        nz += Math.abs(nor.getZ(i + j));
      }
      for (let j = 0; j < 3; j++) {
        const k = i + j;
        const x = pos[k * 3], y = pos[k * 3 + 1], z = pos[k * 3 + 2];
        if (ny >= nx && ny >= nz) uv.set([x / tuile, z / tuile], k * 2);
        else if (nx >= nz) uv.set([z / tuile, y / tuile], k * 2);
        else uv.set([x / tuile, y / tuile], k * 2);
      }
    }
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  let lot = c.lots.get(mat);
  if (!lot) c.lots.set(mat, (lot = []));
  lot.push(g);
}

/** Un quadrilatère (4 points, sens direct vu de face), visible d'un côté. */
export function quad(c, mat, couleur, p) {
  const pos = [];
  for (const k of [0, 1, 2, 0, 2, 3]) pos.push(...p[k]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  c.poser(g, mat, couleur, {}, { crasse: false, nuance: 0.03 });
  g.dispose();
}

/**
 * Un prisme allongé selon x, de x1 à x2 et de z1 à z2 : le dessous à `y0`, le dessus incliné de `ya` (en x1) à `yb`
 * (en x2). Pour les murs en aile qui suivent la pente de la montagne.
 */
export function prisme(c, mat, couleur, x1, x2, z1, z2, y0, ya, yb, options = {}) {
  const P = [
    [x1, y0, z1], [x2, y0, z1], [x2, y0, z2], [x1, y0, z2],
    [x1, ya, z1], [x2, yb, z1], [x2, yb, z2], [x1, ya, z2],
  ];
  const faces = [[0, 1, 5, 4], [2, 3, 7, 6], [3, 0, 4, 7], [1, 2, 6, 5], [4, 5, 6, 7]];
  const pos = [];
  // Ordre inversé : les normales regardent vers l'extérieur (z1 < z2, x1 < x2).
  for (const [a, b, d, e] of faces) for (const k of [a, d, b, a, e, d]) pos.push(...P[k]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  c.poser(g, mat, couleur, {}, { crasse: options.crasse ?? true, nuance: options.nuance ?? 0.02 });
  g.dispose();
}

/** Un cylindre couché selon x, de x1 à x2. */
export function cylX(c, mat, couleur, x1, x2, y, z, r, cotes = 10) {
  const g = new THREE.CylinderGeometry(r, r, Math.abs(x2 - x1), cotes, 1, false);
  c.poser(g, mat, couleur, { x: (x1 + x2) / 2, y, z, rz: PI / 2 });
  g.dispose();
}

/** Un cylindre debout. */
export function cylY(c, mat, couleur, x, z, y1, y2, r1, r2 = r1, cotes = 8, pose = {}) {
  const g = new THREE.CylinderGeometry(r2, r1, y2 - y1, cotes, 1, false);
  c.poser(g, mat, couleur, { x, y: (y1 + y2) / 2, z, ...pose });
  g.dispose();
}
