// Les outils de la halte du gué : matières (partagées par les quatre tronçons), pièces géométriques, végétation de
// berge (aulnes, frênes, saules, ronciers), mobilier, recentrage d'un tronçon.

import * as THREE from "three";
import { PALETTE, matiere, matiereMonde, matiereVerre, matiereLueur, matiereTexture, MAT, dessiner } from "../commun/atelier.js";
import { AL, AH, dessinerAtlas, dessinerAtlasMiroir, dessinerEau, dessinerEcume, dessinerPlanches, dessinerTerrain, dessinerGalets } from "./atlas.js";

export const PI = Math.PI;
export const arr = (v) => Math.round(v * 100) / 100;

// ---------- Matières ----------

let M = null;

export function matieres() {
  if (M) return M;
  const planches = matiereTexture(dessiner("gue-planches", 256, 256, dessinerPlanches), {});
  planches.userData.tuile = 2.4;
  const terrain = matiereTexture(dessiner("gue-terrain", 256, 256, dessinerTerrain), { roughness: 1 });
  terrain.userData.tuile = 6;
  const galets = matiereTexture(dessiner("gue-galets", 256, 256, dessinerGalets), { roughness: 0.95 });
  galets.userData.tuile = 2.2;
  const texEau = dessiner("gue-eau", 128, 256, dessinerEau);
  const eau = new THREE.MeshStandardMaterial({ map: texEau, vertexColors: true, roughness: 0.12, metalness: 0.3, transparent: true, opacity: 0.84, depthWrite: false, side: THREE.DoubleSide });
  eau.userData.sansOmbre = true;
  // La fine nappe qui court sur le radier : même texture (même courant), plus claire et transparente
  const film = new THREE.MeshStandardMaterial({ map: texEau, vertexColors: true, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
  film.userData.sansOmbre = true;
  const ecume = new THREE.MeshStandardMaterial({ map: dessiner("gue-ecume", 128, 128, dessinerEcume), vertexColors: true, roughness: 0.7, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide });
  ecume.userData.sansOmbre = true;
  const atlas = dessiner("gue-atlas", AL, AH, dessinerAtlas, false);
  atlas.anisotropy = 8;
  const panneaux = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.85, side: THREE.DoubleSide });
  const lumineux = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 0.9, vertexColors: true, roughness: 0.5, side: THREE.DoubleSide });
  lumineux.userData.sansOmbre = true;
  // Flammes, braises, verre des lanternes : elles « émettent » (pas d'éclairage), et vacillent.
  const flammes = new THREE.MeshBasicMaterial({ vertexColors: true, color: 0xffffff });
  flammes.userData.sansOmbre = true;
  // Les ampoules de la guirlande de la guinguette, sur batterie solaire fatiguée : intermittentes.
  const guirlande = new THREE.MeshBasicMaterial({ vertexColors: true, color: 0xffffff });
  guirlande.userData.sansOmbre = true;
  M = {
    mat: matiere(0.95, 0),
    satin: matiere(0.6, 0.05),
    lisse: matiere(0.3, 0.05),
    tole: matiere(0.75, 0.3),
    metal: matiere(0.4, 0.7),
    toile: MAT.toile(),
    terrain,
    galets,
    planches,
    pierre: matiereMonde("pierreTaille"),
    tuiles: matiereMonde("ardoise"),
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    eau,
    film,
    ecume,
    lueur: matiereLueur(0xeef7c8, 0.08),
    panneaux,
    lumineux,
    atlas,
    flammes,
    guirlande,
  };
  return M;
}

/** L'animation commune : le courant, l'écume qui respire, les flammes, la guirlande qui clignote. */
export function animer(t) {
  if (!M) return;
  M.eau.map.offset.y = (t * 0.2) % 1;
  M.ecume.map.offset.y = (t * 0.32) % 1;
  M.ecume.opacity = 0.7 + 0.14 * Math.sin(t * 1.9);
  const f = 0.82 + 0.18 * Math.sin(t * 13.1) * Math.sin(t * 7.3);
  M.flammes.color.setRGB(f, f, f);
  // La batterie solaire est à bout : des salves de clignotements, puis un noir d'une seconde.
  const cycle = t % 6.5;
  let g = 1;
  if (cycle > 5.4) g = 0.12;
  else if (cycle > 4.2) g = Math.sin(t * 31) > 0 ? 1 : 0.25;
  else g = 0.86 + 0.14 * Math.sin(t * 9);
  M.guirlande.color.setRGB(g, g, g);
  M.lumineux.emissiveIntensity = 0.75 + 0.15 * Math.sin(t * 2.1) + (Math.sin(t * 17) > 0.96 ? -0.4 : 0);
}

// ---------- Hasard déterministe ----------

/** Un hachage stable de deux entiers dans [0, 1[. */
export function hache(i, j) {
  let h = (i * 374761393 + j * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Un bruit de valeur lissé (0 à 1). */
export function bruit(x, z) {
  const i = Math.floor(x);
  const j = Math.floor(z);
  const fx = x - i;
  const fz = z - j;
  const s = (t) => t * t * (3 - 2 * t);
  const a = hache(i, j);
  const b = hache(i + 1, j);
  const c = hache(i, j + 1);
  const d = hache(i + 1, j + 1);
  return a + (b - a) * s(fx) + (c - a) * s(fz) + (a - b - c + d) * s(fx) * s(fz);
}

/** Interpolation linéaire dans une table [[x, v], …] triée. */
export function interp(table, x) {
  if (x <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    const [x1, v1] = table[i];
    const [x0, v0] = table[i - 1];
    if (x <= x1) {
      const t = (x - x0) / (x1 - x0);
      const s = t * t * (3 - 2 * t);
      return v0 + (v1 - v0) * (0.35 * t + 0.65 * s);
    }
  }
  return table[table.length - 1][1];
}

// ---------- Pièces ----------

/** Un panneau plat dont l'image vient de l'atlas (région `r`), face vers +z local. */
export function panneau(c, r, pose, l, h, mat = M.panneaux) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
  c.poser(g, mat, 0xffffff, pose, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Un quadrilatère (quatre coins [x, y, z]) avec ses UV. */
export function quad(c, mat, P, UV, couleur, options = {}) {
  const g = new THREE.BufferGeometry();
  const pos = [];
  const uv = [];
  for (const k of [0, 1, 2, 0, 2, 3]) {
    pos.push(...P[k]);
    uv.push(...UV[k]);
  }
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  c.poser(g, mat, couleur, {}, { crasse: false, nuance: 0, ...options });
  g.dispose();
}

/** Une lame d'eau qui tombe, du bord (y1) au pied (y2), le long d'un segment horizontal a → b. */
export function lame(c, mat, a, b, y1, y2, avance, couleur, T = 2) {
  const P = [[a[0], y1, a[1]], [b[0], y1, b[1]], [b[0] + avance[0], y2, b[1] + avance[1]], [a[0] + avance[0], y2, a[1] + avance[1]]];
  quad(c, mat, P, P.map(([x, y, z]) => [x / T, (y - z) / T]), couleur);
}

/** Une boîte posée entre deux points au sol (x1, z1) → (x2, z2), du niveau y sur une hauteur h. */
export function boiteEntre(c, x1, z1, x2, z2, y, h, ep, couleur, mat, options = {}, rallonge = 0.04) {
  const L = Math.hypot(x2 - x1, z2 - z1) + rallonge;
  c.boite(L, h, ep, couleur, { x: (x1 + x2) / 2, y: y + h / 2, z: (z1 + z2) / 2, ry: -Math.atan2(z2 - z1, x2 - x1) }, mat, options);
}

/** Une planche de a à b (points 3D), de largeur `larg` dans le plan qui contient `haut`, d'épaisseur `ep`. */
export function planche(c, a, bb, larg, ep, couleur, mat, haut = [0, 1, 0], options = {}) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...bb);
  const d = B.clone().sub(A);
  const L = d.length();
  d.normalize();
  const z = new THREE.Vector3().crossVectors(d, new THREE.Vector3(...haut));
  if (z.lengthSq() < 1e-6) z.set(0, 0, 1);
  z.normalize();
  const y = new THREE.Vector3().crossVectors(z, d).normalize();
  const e = new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().makeBasis(d, y, z));
  c.boite(L, larg, ep, couleur, { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2, z: (A.z + B.z) / 2, rx: e.x, ry: e.y, rz: e.z }, mat, options);
}

const GEO = new Map();
export function geoCyl(r1, r2, h, n, ouvert = false) {
  const cle = `${r1}|${r2}|${h}|${n}|${ouvert}`;
  if (!GEO.has(cle)) GEO.set(cle, new THREE.CylinderGeometry(r1, r2, h, n, 1, ouvert));
  return GEO.get(cle);
}

/** Un cylindre vertical posé sur y (sa base), de rayons rh (haut) et rb (bas). */
export function cylindre(c, mat, couleur, x, y, z, rh, rb, h, cotes = 8, pose = {}, options = {}) {
  c.poser(geoCyl(rh, rb, h, cotes), mat, couleur, { x, y: y + h / 2, z, ...pose }, options);
}

/** Un câble qui pend entre deux points (chaînette approchée), en `n` tronçons de tube. `garder(x)` filtre les morceaux. */
export function cable(c, mat, couleur, a, b, fleche, r = 0.025, n = 10, garder = () => true) {
  let prec = a;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - fleche * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t];
    if (garder((prec[0] + p[0]) / 2)) c.tube(prec, p, r, couleur, mat, 4, { crasse: false, nuance: 0 });
    prec = p;
  }
}

/** Les points d'un câble qui pend (pour y accrocher des ampoules). */
export function pointsCable(a, b, fleche, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - fleche * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t]);
  }
  return pts;
}

export const BOULE = new THREE.IcosahedronGeometry(1, 0);
export const ROCHE = new THREE.DodecahedronGeometry(1, 0);
export const OCTA = new THREE.OctahedronGeometry(1, 0);
const TRONC = new THREE.CylinderGeometry(0.62, 1, 1, 5).translate(0, 0.5, 0);
const RAMEAU = new THREE.ConeGeometry(0.22, 1, 3).rotateX(PI).translate(0, -0.5, 0);
const TIGE = new THREE.ConeGeometry(0.03, 1, 3).translate(0, 0.5, 0);
const ANNEAU = new THREE.TorusGeometry(0.22, 0.05, 3, 9);
const COQUE = (() => {
  // Une coque de barque : un demi-tronc de cône aplati, pointu à l'avant (ouverte vers le haut)
  const g = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true, PI / 2, PI);
  g.rotateZ(PI / 2).rotateX(-PI / 2);
  return g;
})();

/** Un rocher à facettes. */
export function rocher(c, x, z, s, y = 0, ton = 0x8d877c) {
  c.poser(ROCHE, M.mat, ton, { x, y: y + s * 0.25, z, rx: c.hasard() * 3, ry: c.hasard() * 3, e: [s * c.entre(0.9, 1.5), s * c.entre(0.45, 0.7), s] }, { nuance: 0.08 });
}

// ---------- Végétation de berge ----------

const TONS = {
  aulne: [0x3d5e34, 0x47693a, 0x355330],
  frene: [0x6f9448, 0x7ea352, 0x5f8540],
  saule: [0x8ea56c, 0x7d975e, 0x9cb27a],
  jeune: [0x5d8a46, 0x6f9a4c, 0x4f7a3e],
};

/**
 * Un arbre de berge. `essence` : « aulne » (houppier sombre en ogive), « frene » (léger, étalé), « saule » (penché vers
 * l'eau, rameaux qui pendent), « jeune » (baliveau). `vers` : [dx, dz] la direction où il penche (l'eau, la lumière).
 */
export function arbreBerge(c, x, z, h, y, essence = "aulne", vers = [0, 0]) {
  const tons = TONS[essence];
  const r = 0.09 + h * 0.028;
  const lg = Math.hypot(vers[0], vers[1]) || 1;
  const pen = essence === "saule" ? 0.38 : essence === "jeune" ? 0.06 : 0.12;
  const ux = (vers[0] / lg) * pen * (vers[0] || vers[1] ? 1 : 0);
  const uz = (vers[1] / lg) * pen * (vers[0] || vers[1] ? 1 : 0);
  const fut = h * (essence === "saule" ? 0.38 : 0.5);
  // Le tronc penche de (ux, uz) : on le pose par ses deux bouts
  const tete = [x + ux * fut, y + fut, z + uz * fut];
  const tronc = essence === "frene" ? 0x7a7466 : essence === "saule" ? 0x5e5446 : 0x4c4236;
  c.tube([x, y - 0.3, z], tete, r, tronc, M.mat, 5);
  if (essence === "aulne") {
    for (let k = 0; k < 3; k++) {
      const s = h * (0.22 - k * 0.04);
      c.poser(BOULE, M.mat, tons[k], { x: tete[0] + c.entre(-0.3, 0.3), y: tete[1] + h * (0.08 + k * 0.17), z: tete[2] + c.entre(-0.3, 0.3), ry: c.hasard() * 3, rx: c.hasard(), e: [s, s * 1.25, s] }, { nuance: 0.07, crasse: false });
    }
  } else if (essence === "frene") {
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * PI * 2 + c.hasard();
      const s = h * c.entre(0.14, 0.2);
      const d = h * 0.16;
      if (k < 2) c.tube(tete, [tete[0] + Math.cos(a) * d, tete[1] + h * 0.25, tete[2] + Math.sin(a) * d], r * 0.5, tronc, M.mat, 4);
      c.poser(BOULE, M.mat, tons[k % 3], { x: tete[0] + Math.cos(a) * d, y: tete[1] + h * c.entre(0.25, 0.42), z: tete[2] + Math.sin(a) * d, ry: c.hasard() * 3, e: [s * 1.2, s * 0.8, s * 1.2] }, { nuance: 0.08, crasse: false });
    }
  } else if (essence === "saule") {
    const s = h * 0.24;
    const cx = tete[0] + ux * 1.2;
    const cz = tete[2] + uz * 1.2;
    for (let k = 0; k < 3; k++) {
      c.poser(BOULE, M.mat, tons[k], { x: cx + c.entre(-0.6, 0.6), y: tete[1] + h * (0.1 + k * 0.08), z: cz + c.entre(-0.6, 0.6), ry: c.hasard() * 3, e: [s * 1.15, s * 0.7, s * 1.15] }, { nuance: 0.07, crasse: false });
    }
    // Le rideau de rameaux qui retombe vers l'eau
    for (let k = 0; k < 9; k++) {
      const a = (k / 9) * PI * 2 + c.hasard() * 0.5;
      const rr = s * c.entre(0.8, 1.1);
      const haut = tete[1] + h * 0.12;
      const lgR = h * c.entre(0.25, 0.42);
      c.poser(RAMEAU, M.mat, tons[(k + 1) % 3], { x: cx + Math.cos(a) * rr, y: haut, z: cz + Math.sin(a) * rr, e: [1, lgR, 1], rx: c.entre(-0.08, 0.08), rz: c.entre(-0.08, 0.08) }, { nuance: 0.08, crasse: false });
    }
  } else {
    const s = h * 0.26;
    c.poser(BOULE, M.mat, tons[0], { x: tete[0], y: tete[1] + h * 0.2, z: tete[2], ry: c.hasard() * 3, e: [s, s * 1.2, s] }, { nuance: 0.08, crasse: false });
    c.poser(BOULE, M.mat, tons[1], { x: tete[0] + 0.3, y: tete[1] + h * 0.36, z: tete[2] - 0.2, ry: c.hasard() * 3, e: s * 0.7 }, { nuance: 0.08, crasse: false });
  }
}

/** Un roncier : buissons sombres, tiges en arceau, quelques mûres. */
export function roncier(c, x, z, s, y = 0) {
  const tons = [0x3f5a32, 0x4a6638, 0x56703d];
  const n = 3 + Math.floor(c.hasard() * 3);
  for (let k = 0; k < n; k++) {
    const e = s * c.entre(0.45, 0.75);
    c.poser(BOULE, M.mat, tons[k % 3], { x: x + c.entre(-1, 1) * s * 0.8, y: y + e * 0.35, z: z + c.entre(-1, 1) * s * 0.8, ry: c.hasard() * 3, e: [e * 1.2, e * 0.6, e] }, { nuance: 0.08, crasse: false });
  }
  for (let k = 0; k < 2; k++) {
    const a = c.hasard() * PI * 2;
    const d = s * c.entre(0.9, 1.4);
    c.tube([x, y + s * 0.5, z], [x + Math.cos(a) * d, y + 0.05, z + Math.sin(a) * d], 0.025, 0x6a4a3e, M.mat, 3, { crasse: false });
  }
  for (let k = 0; k < 3; k++) c.poser(BOULE, M.lisse, 0x3a2638, { x: x + c.entre(-0.8, 0.8) * s, y: y + s * c.entre(0.4, 0.7), z: z + c.entre(-0.8, 0.8) * s, e: 0.05 }, { crasse: false, nuance: 0.1 });
}

/** Une touffe de joncs, de prêles ou de fougères (tiges fines). */
export function joncs(c, x, z, y = 0, h = 1.1, ton = 0x6f8a45) {
  const n = 5;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * PI * 2 + c.hasard();
    c.poser(TIGE, M.mat, k % 2 ? ton : 0x8a9a55, { x: x + Math.cos(a) * 0.08, y, z: z + Math.sin(a) * 0.08, rz: Math.cos(a) * 0.25, rx: Math.sin(a) * 0.25, e: [1, h * c.entre(0.6, 1.1), 1] }, { crasse: false, nuance: 0.1 });
  }
}

/** Une fougère : quatre frondes couchées en étoile. */
export function fougere(c, x, z, y = 0, s = 0.6) {
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * PI * 2 + c.hasard();
    c.boite(s, 0.03, s * 0.28, k % 2 ? 0x5f8a3c : 0x6d9645, { x: x + Math.cos(a) * s * 0.4, y: y + 0.12, z: z + Math.sin(a) * s * 0.4, ry: -a, rz: 0.4 }, M.mat, { crasse: false, nuance: 0.08 });
  }
}

/** Un tronc flotté (ou couché), de a à b, rayon r, avec un moignon de branche. */
export function bois(c, a, b, r, ton = 0x8f8676) {
  c.tube(a, b, r, ton, M.mat, 6);
  const t = c.entre(0.3, 0.7);
  const p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  c.tube(p, [p[0] + c.entre(-0.6, 0.6), p[1] + c.entre(0.3, 0.8), p[2] + c.entre(-0.6, 0.6)], r * 0.35, ton, M.mat, 4);
}

// ---------- Mobilier ----------

export function chaisePliante(c, x, z, ry, renversee = false, couleur = 0x6f8b76) {
  c.repere({ x, y: renversee ? 0.22 : 0, z, ry, rx: renversee ? PI / 2 - 0.15 : 0 }, () => {
    c.boite(0.42, 0.03, 0.4, couleur, { y: 0.45 }, M.tole);
    c.boite(0.42, 0.42, 0.03, couleur, { y: 0.7, z: -0.2, rx: -0.08 }, M.tole);
    for (const [px, pz] of [[-0.19, 0.17], [0.19, 0.17], [-0.19, -0.18], [0.19, -0.18]]) c.boite(0.03, 0.46, 0.03, 0x4a4a46, { x: px, y: 0.23, z: pz }, M.metal);
  });
}

export function tableBistrot(c, x, z, couleur = 0x6f8b76, renversee = false) {
  c.repere({ x, y: renversee ? 0.32 : 0, z, rx: renversee ? PI / 2 : 0, ry: c.hasard() * 3 }, () => {
    cylindre(c, M.tole, couleur, 0, 0.7, 0, 0.36, 0.36, 0.03, 10);
    cylindre(c, M.metal, 0x4a4a46, 0, 0.02, 0, 0.03, 0.03, 0.7, 4);
    cylindre(c, M.metal, 0x4a4a46, 0, 0, 0, 0.18, 0.2, 0.04, 6);
  });
}

export function caisse(c, x, y, z, s = 0.5, ry = 0, ton = 0x9a7a52) {
  c.boite(s, s * 0.7, s * 0.8, ton, { x, y: y + s * 0.35, z, ry }, M.planches, { nuance: 0.08 });
}

export function tonneau(c, x, y, z, ton = 0x7a5a3c, couche = false) {
  if (couche) c.poser(geoCyl(0.3, 0.3, 0.85, 8), M.mat, ton, { x, y: y + 0.3, z, rz: PI / 2, ry: c.hasard() * 3 });
  else cylindre(c, M.mat, ton, x, y, z, 0.28, 0.3, 0.85, 8);
}

export function bidon(c, x, y, z, ton = 0x2f5f8a, ry = 0) {
  c.boite(0.35, 0.5, 0.2, ton, { x, y: y + 0.25, z, ry }, M.satin, { nuance: 0.06 });
}

/** Une corde lovée (rouleau à plat, ou pendu à un clou si `debout`). */
export function corde(c, x, y, z, debout = false, ton = 0xb9a679, ry = 0) {
  c.poser(ANNEAU, M.mat, ton, { x, y, z, rx: debout ? 0 : PI / 2, ry, e: c.entre(0.9, 1.2) }, { crasse: false, nuance: 0.06 });
  c.poser(ANNEAU, M.mat, ton, { x: x + 0.03, y: y + (debout ? -0.03 : 0.05), z, rx: debout ? 0.2 : PI / 2, ry, e: 0.85 }, { crasse: false, nuance: 0.06 });
}

/** Une gaffe : longue perche à crochet de fer. */
export function gaffe(c, a, b) {
  c.tube(a, b, 0.025, 0x9a7a55, M.mat, 4);
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const l = Math.hypot(...d);
  const u = d.map((v) => v / l);
  c.tube(b, [b[0] + u[0] * 0.25, b[1] + u[1] * 0.25, b[2] + u[2] * 0.25], 0.02, 0x3a3a38, M.metal, 4);
  c.tube([b[0] + u[0] * 0.15, b[1] + u[1] * 0.15, b[2] + u[2] * 0.15], [b[0] + u[0] * 0.05 + 0.12, b[1] + u[1] * 0.05 - 0.05, b[2] + u[2] * 0.05], 0.018, 0x3a3a38, M.metal, 4);
}

/** Une lanterne-tempête : socle, verre qui luit, anse. */
export function lanterne(c, x, y, z) {
  cylindre(c, M.tole, 0x6a4a2a, x, y, z, 0.1, 0.11, 0.06, 8);
  cylindre(c, M.flammes, 0xffc977, x, y + 0.06, z, 0.07, 0.08, 0.17, 8);
  cylindre(c, M.tole, 0x6a4a2a, x, y + 0.23, z, 0.04, 0.1, 0.06, 8);
  c.boite(0.02, 0.12, 0.2, 0x3a3a38, { x, y: y + 0.33, z }, M.metal);
}

/** Une barque en bois (coque ouverte). `retournee` : quille en l'air, posée sur des tréteaux ou sur l'herbe. */
export function barque(c, x, y, z, ry, couleur, opts = {}) {
  const { retournee = false, rx = 0, rz = 0, l = 3.6, larg = 1.3, numero = true } = opts;
  c.repere({ x, y, z, ry, rx: rx + (retournee ? PI : 0), rz }, () => {
    const h = 0.48;
    // La coque : un demi-cylindre aplati (ouvert vers le haut), fermé par deux pointes
    c.poser(COQUE, M.satin, couleur, { y: h, e: [l * 0.8, h, larg / 2] }, { nuance: 0.05 });
    for (const s of [-1, 1]) {
      c.poser(BOULE, M.satin, couleur, { x: s * l * 0.4, y: h * 0.62, e: [l * 0.14, h * 0.42, larg * 0.36] }, { nuance: 0.05 });
    }
    // Plat-bord, bancs
    for (const s of [-1, 1]) c.boite(l * 0.82, 0.05, 0.07, 0x6a5a48, { y: h, z: s * larg * 0.48 }, M.mat);
    if (!retournee) for (const bx of [-0.6, 0.5]) c.boite(0.22, 0.04, larg * 0.9, 0x8a7458, { x: bx, y: h * 0.75 }, M.planches);
    if (numero) c.boite(0.36, 0.2, 0.01, 0xe9e3d2, { x: 0.6, y: h * 0.62, z: larg * 0.5 + 0.005 }, M.mat, { crasse: false });
  });
}

/** Une rame. */
export function rame(c, a, b) {
  c.tube(a, b, 0.025, 0x9a7a55, M.mat, 4);
  c.boite(0.5, 0.02, 0.14, 0x9a7a55, { x: b[0], y: b[1] + 0.02, z: b[2], ry: -Math.atan2(b[2] - a[2], b[0] - a[0]) }, M.mat);
}

/** Un feu : pierres en cercle, bûches, flammes. */
export function feu(c, x, y, z, s = 1) {
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * PI * 2;
    c.poser(ROCHE, M.mat, 0x7a756c, { x: x + Math.cos(a) * 0.55 * s, y: y + 0.08, z: z + Math.sin(a) * 0.55 * s, ry: c.hasard() * 3, e: [0.17 * s, 0.13 * s, 0.15 * s] }, { nuance: 0.1 });
  }
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * PI * 2 + 0.3;
    c.tube([x + Math.cos(a) * 0.42 * s, y + 0.05, z + Math.sin(a) * 0.42 * s], [x, y + 0.3 * s, z], 0.06 * s, 0x3a2a20, M.mat, 5, { crasse: false });
  }
  c.poser(OCTA, M.flammes, 0xff9a3d, { x, y: y + 0.38 * s, z, e: [0.22 * s, 0.4 * s, 0.22 * s] }, { crasse: false, nuance: 0 });
  c.poser(OCTA, M.flammes, 0xffd27a, { x: x + 0.05, y: y + 0.32 * s, z: z - 0.04, ry: 0.6, e: [0.14 * s, 0.3 * s, 0.14 * s] }, { crasse: false, nuance: 0 });
  c.poser(BOULE, M.flammes, 0xc8501e, { x, y: y + 0.1, z, e: [0.3 * s, 0.07, 0.3 * s] }, { crasse: false, nuance: 0 });
}

/** Un piquet de balisage de radier : blanc à bande rouge, réfléchissant. */
/**
 * Une balise du radier, échelle de crue : un piquet sombre, une bande blanche à 0,35–0,55 m, une bande rouge à
 * 0,7–0,9 m (« L'eau est à la bande blanche. À la rouge, on ne passe plus. »).
 */
export function balise(c, x, z, penche = 0, y = 0) {
  const pos = (h) => ({ x: x - Math.sin(penche) * h, y: y + h * Math.cos(penche), z, rz: penche, rx: penche * 0.5 });
  c.boite(0.09, 1.15, 0.09, 0x3c3f3d, { ...pos(0.575) }, M.satin, { nuance: 0.03 });
  c.boite(0.13, 0.2, 0.13, 0xf2efe6, pos(0.45), M.satin, { crasse: false });
  c.boite(0.13, 0.2, 0.13, 0xc0392b, pos(0.8), M.satin, { crasse: false });
}

// ---------- Recentrage d'un tronçon ----------

export function recentrer(groupe, x0) {
  const vues = new Set();
  // Un objet mobile (le radeau du bac) garde sa géométrie locale : on déplace l'objet, pas ses sommets.
  groupe.traverse((obj) => {
    if (obj.userData.deplacer) {
      obj.position.x -= x0;
      obj.traverse((o) => o.geometry && vues.add(o.geometry));
    }
  });
  groupe.traverse((obj) => {
    if (obj.geometry && !vues.has(obj.geometry)) {
      vues.add(obj.geometry);
      obj.geometry.translate(-x0, 0, 0);
    }
  });
  const ud = groupe.userData;
  for (const t of ud.toits) {
    t.boite = { ...t.boite, x: arr(t.boite.x - x0) };
    if (t.horsDe) t.horsDe = { ...t.horsDe, x: t.horsDe.x - x0 };
  }
  ud.obstacles = ud.obstacles.map((s) => ({ ...s, x1: arr(s.x1 - x0), x2: arr(s.x2 - x0) }));
  ud.lumieres = ud.lumieres.map((l) => ({ ...l, x: arr(l.x - x0) }));
  return groupe;
}

// ---------- Le gué retourné (option miroir) ----------

let MIROIR = null;

/** Les matières de l'atlas retourné (créées une fois). */
function matieresMiroir() {
  if (MIROIR) return MIROIR;
  const atlas = dessiner("gue-atlas-miroir", AL, AH, dessinerAtlasMiroir, false);
  atlas.anisotropy = 8;
  const panneaux = M.panneaux.clone();
  panneaux.map = atlas;
  const lumineux = M.lumineux.clone();
  lumineux.map = atlas;
  lumineux.emissiveMap = atlas;
  MIROIR = { atlas, remplace: new Map([[M.panneaux, panneaux], [M.lumineux, lumineux]]) };
  return MIROIR;
}

/** Retourne une géométrie de gauche à droite (x → −x) en gardant ses faces dans le bon sens. */
function retournerGeo(g) {
  for (const nom of ["position", "normal"]) {
    const a = g.attributes[nom];
    if (!a) continue;
    for (let i = 0; i < a.count; i++) a.setX(i, -a.getX(i));
    a.needsUpdate = true;
  }
  if (g.index) {
    const idx = g.index;
    for (let i = 0; i + 2 < idx.count; i += 3) {
      const t = idx.getX(i + 1);
      idx.setX(i + 1, idx.getX(i + 2));
      idx.setX(i + 2, t);
    }
    idx.needsUpdate = true;
  } else {
    for (const a of Object.values(g.attributes)) {
      const n = a.itemSize;
      const arr = a.array;
      for (let i = 0; i + 2 < a.count; i += 3) {
        for (let k = 0; k < n; k++) {
          const p = (i + 1) * n + k;
          const q = (i + 2) * n + k;
          const t = arr[p];
          arr[p] = arr[q];
          arr[q] = t;
        }
      }
      a.needsUpdate = true;
    }
  }
  g.computeBoundingBox();
  g.computeBoundingSphere();
}

/**
 * Retourne un tronçon déjà construit et recentré (x → −x) : géométrie, positions des objets, couches, obstacles,
 * lumières, obstacles du radeau. Les enseignes passent sur l'atlas retourné, pour se lire à l'endroit.
 */
export function miroiter(groupe) {
  const { atlas, remplace } = matieresMiroir();
  const vues = new Set();
  groupe.traverse((o) => {
    if (o !== groupe) o.position.x = -o.position.x;
    if (!o.isMesh) return;
    if (!vues.has(o.geometry)) {
      vues.add(o.geometry);
      retournerGeo(o.geometry);
    }
    const m = o.material;
    if (remplace.has(m)) o.material = remplace.get(m);
    else if (m.map === M.atlas) {
      // une matière propre à une couche (clonée pour son fondu) : on lui donne l'atlas retourné
      m.map = atlas;
      if (m.emissiveMap === M.atlas) m.emissiveMap = atlas;
    }
  });
  const nx = (v) => arr(-v);
  const segments = (l) => (l ?? []).map((s) => ({ ...s, x1: nx(s.x2), x2: nx(s.x1), z1: s.z2, z2: s.z1 }));
  const ud = groupe.userData;
  for (const t of ud.toits ?? []) {
    t.boite = { ...t.boite, x: nx(t.boite.x) };
    if (t.horsDe) t.horsDe = { ...t.horsDe, x: nx(t.horsDe.x) };
  }
  ud.obstacles = segments(ud.obstacles);
  ud.lumieres = (ud.lumieres ?? []).map((l) => ({ ...l, x: nx(l.x) }));
  groupe.traverse((o) => {
    if (o.name !== "radeau") return;
    o.userData.obstacles = segments(o.userData.obstacles);
    o.userData.obstaclesTraversee = segments(o.userData.obstaclesTraversee);
    o.userData.accostages = (o.userData.accostages ?? []).map((a) => ({ ...a, x: nx(a.x), embarquement: a.embarquement && { ...a.embarquement, x: nx(a.embarquement.x) } }));
  });
  ud.miroir = true;
  return groupe;
}
