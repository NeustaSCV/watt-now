// La halte de la digue : le relief (la digue, ses avancées, la brèche, l'écluse), les couleurs, les matières et les
// petits outils de pose partagés par modele.js et lieux.js.
//
// Repère de la halte entière : 200 × 70 m, origine au centre, +x à l'est, +z au sud. La digue court d'ouest en est,
// crête à y = 0 ; au nord l'étang des Roselières (eau à y = −1), au sud le canal (eau à y = −1,5).

import * as THREE from "three";
import { aleatoire, PALETTE, matiere, matiereMonde, matiereVerre, matiereLueur, matiereTexture, MAT, mur, dessiner } from "../commun/atelier.js";
import { AL, AH, dessinerAtlas, dessinerEau, dessinerEcume, dessinerBrume, dessinerPlanches } from "./atlas.js";

export const PI = Math.PI;

// ---------- Couleurs du lieu (passées, humides) ----------

export const COUL = {
  herbe: 0x8b9a58,
  herbeSombre: 0x6c7d47,
  herbeSeche: 0xa5a26a,
  terre: 0x86735a,
  gravier: 0x8f8a7c,
  vase: 0x6d6447,
  boue: 0x4f4a38,
  boueSombre: 0x3e3a2d,
  enrochement: 0x7e7b72,
  roc: 0x8a877e,
  rocSombre: 0x67645d,
  roseau: 0x8e9a52,
  roseauSec: 0xb5a46e,
  massette: 0x5a3f2a,
  sauleFeuille: 0x93a77e,
  sauleFeuille2: 0x7f9670,
  sauleTronc: 0x5d5446,
  etang: 0x8ea0a2,
  canal: 0x88a2ad,
  asphalte: 0x56595a,
  asphalteR: 0x47494a,
  ligne: 0xd2cfc4,
  bois: 0x7a5a3c,
  boisSombre: 0x4f3b2b,
  boisGris: 0x8a8274,
  planche: 0x9a9282,
  poteau: 0x5b4b3a,
  enduit: 0xd8cdb4,
  bleuVolet: 0x5f7f99,
  tuile: 0x9a6250,
  brique: 0xa0614a,
  pierre: 0xa29d90,
  pierreEcluse: 0x8e897c,
  fonte: 0x37393a,
  acier: 0x6f767a,
  rouille: 0x8f5a36,
  tourbe: 0x3d2f24,
  tourbeSeche: 0x5a4532,
  fer: 0xa0643a,
  tole: 0x7d8689,
  toile: 0x6f6a55,
  nenuphar: 0x5f8a3e,
  lentilles: 0x7a9444,
};

// ---------- Bruit et interpolation ----------

export function hache(i, j) {
  let h = Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Bruit de valeur lissé, dans [0, 1]. */
export function bruit(x, z) {
  const i = Math.floor(x);
  const j = Math.floor(z);
  const fx = x - i;
  const fz = z - j;
  const sx = fx * fx * (3 - 2 * fx);
  const sz = fz * fz * (3 - 2 * fz);
  const a = hache(i, j) + (hache(i + 1, j) - hache(i, j)) * sx;
  const b = hache(i, j + 1) + (hache(i + 1, j + 1) - hache(i, j + 1)) * sx;
  return a + (b - a) * sz;
}

export function interp(table, x) {
  if (x <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    if (x <= table[i][0]) {
      const [x0, y0] = table[i - 1];
      const [x1, y1] = table[i];
      const t = (x - x0) / (x1 - x0);
      return y0 + (y1 - y0) * t * t * (3 - 2 * t);
    }
  }
  return table[table.length - 1][1];
}

export const arr = (v) => Math.round(v * 100) / 100;

// ---------- La digue ----------

/** L'axe de la route (z) le long de la digue, d'ouest en est : une S très douce. */
const ZC = [[-101, 0.8], [-62, 0.2], [-34, -0.9], [-14, -0.6], [6, 0], [38, 0], [62, 1.2], [84, 0.6], [101, 0.2]];
export const zc = (x) => interp(ZC, x);

export const HD = 4.0; // demi-largeur de la crête
export const HL = 2.4; // demi-largeur de la route (une voie et demie)
export const Y_ETANG = -1.0;
export const Y_CANAL = -1.5;

/** La brèche : centre et demi-largeur au niveau de la crête. */
export const XB = -24;
export const WB = 3.4;
export const ZB = zc(XB);

/** L'écluse : la chambre (vide entre les deux paires de portes), le fond, les portes amont et aval. */
export const CH = { x1: 19, x2: 25, z1: -11, z2: 15 };
export const Y_FOND = -3.6;
export const Z_AMONT = 0;
export const Z_AVAL = 13;

/** Les avancées de terre à y = 0, en rectangles arrondis [cx, cz, demi-l, demi-p, rayon]. */
const AVANCEES = [
  [-86, -8.5, 6.5, 5, 2.5], // l'abri à tourbe
  [22, 2, 10, 13, 1.5], // les terre-pleins de l'écluse
  [37.5, 10, 8.5, 7.5, 2.5], // la maison de l'éclusier et son jardin
  [62.5, -9.5, 7.5, 7, 2.5], // la station de pompage
];

/** Les planchers praticables au-dessus de l'eau (pontons, plates-formes sur pilotis, passerelles) : [x1, z1, x2, z2]. */
export const PLANCHERS = {
  pontonObs: [-66.7, -17, -65.3, -3.6],
  obs: [-70.5, -22.5, -61.5, -16.8],
  pontonH1: [-42.7, -16.2, -41.3, -4.4],
  hutte1: [-44.8, -21, -39.2, -16],
  pontonH2a: [-14.7, -13.4, -13.3, -4.3],
  pontonH2b: [-14.7, -13.4, -7.3, -12],
  pontonH2c: [-8.7, -20, -7.3, -12],
  hutte2: [-10.8, -25, -4.8, -19.8],
  pontonCab: [80.3, 4.3, 81.7, 11.2],
  cabane: [77.5, 11, 86.5, 16.6],
  passerelle: [XB - 3.9, ZB - 0.85, XB + 3.9, ZB + 0.85],
  portes: [CH.x1, -0.6, CH.x2, 0.6],
};
const LISTE_PLANCHERS = Object.values(PLANCHERS);

/** Les emprises bâties (pas de roseaux, d'arbres ni de rochers). */
export const EMPRISES = [
  [-91, -13, -83, -7.5], // abri à tourbe
  [17, -14, 27, 18], // l'écluse
  [29.5, 5.5, 44, 17.5], // maison et jardin
  [57, -16.8, 68, -7.5], // station de pompage
  [-58.8, 5, -54.8, 9], // la barque
];

export const dans = ([x1, z1, x2, z2], x, z, m = 0) => x > x1 - m && x < x2 + m && z > z1 - m && z < z2 + m;
export const occupe = (x, z, m = 0.6) => LISTE_PLANCHERS.some((r) => dans(r, x, z, m)) || EMPRISES.some((r) => dans(r, x, z, m));

function sdfRect(x, z, [cx, cz, hx, hz, r]) {
  const dx = Math.abs(x - cx) - hx + r;
  const dz = Math.abs(z - cz) - hz + r;
  return Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dz), 0) - r;
}

/** Le bord de la crête, un peu irrégulier (net autour de l'écluse). */
const bordDigue = (x) => (x > 8 && x < 50 ? 0 : 0.35 * (bruit(x * 0.23, 11.5) - 0.5));

/** Près de la borne des vélos, le talus sud s'est affaissé dans le canal. */
export const affaissement = (x) => {
  const t = 1 - Math.abs(x - 91.5) / 4.5;
  return t > 0 ? 1.4 * t * t * (3 - 2 * t) : 0;
};

/** La distance signée à la terre ferme (négative dedans). */
export function sdfTerre(x, z) {
  const zz = z - zc(x);
  let s = Math.abs(zz) - (HD + bordDigue(x) - (zz > 0 ? affaissement(x) : 0));
  if (Math.abs(x - XB) < WB + 5) s = Math.max(s, WB + 0.5 * (bruit(z * 0.6, 3.3) - 0.5) - Math.abs(x - XB));
  for (const a of AVANCEES) s = Math.min(s, sdfRect(x, z, a));
  return s;
}

/** La lisière nord (roselière haute) et la rive sud d'en face. */
export const zRoseliere = (x) => -27 + 3 * (bruit(x * 0.05, 5.5) - 0.5);
export const zRive = (x) => 25.5 + 3 * (bruit(x * 0.05, 8.5) - 0.5);

/** La hauteur du sol (y) : crête et avancées à 0, talus, fond vaseux de l'étang, canal, rive d'en face. */
export function hauteur(x, z) {
  // Le chenal de l'écluse, prolongé dans l'eau au nord et au sud de la chambre
  if (x >= CH.x1 - 0.01 && x <= CH.x2 + 0.01 && (z <= CH.z1 + 0.01 || z >= CH.z2 - 0.01)) return -1.9;
  const s = sdfTerre(x, z);
  if (s <= 0) return 0;
  const zr = z - zc(x);
  let h;
  if (zr < 0) {
    h = -Math.min(1.7, s * 0.6);
    // Les bancs de vase qui affleurent au milieu de l'étang
    if (s > 4) {
      const b = bruit(x * 0.09, z * 0.12);
      if (b > 0.56) h = Math.max(h, -1.7 + Math.min(0.95, (b - 0.56) * 5));
    }
    const zn = zRoseliere(x);
    if (z < zn) h = Math.max(h, Math.min(-0.75, -1.7 + (zn - z) * 0.5));
  } else {
    h = -Math.min(2.6, s * 0.85);
    const zf = zRive(x);
    if (z > zf) h = Math.max(h, Math.min(0.35, -2.6 + (z - zf) * 0.9));
  }
  return h;
}

/** Ce qui est praticable à pied (pour les bords notés comme obstacles). */
export function praticable(x, z) {
  if (LISTE_PLANCHERS.some((r) => dans(r, x, z))) return true;
  if (x > CH.x1 && x < CH.x2 && z > CH.z1 - 3 && z < CH.z2 + 3) return false;
  return hauteur(x, z) > -0.3;
}

// ---------- Matières ----------

export let M = null;

export function matieres() {
  if (M) return M;
  const atlas = dessiner("digue-atlas", AL, AH, dessinerAtlas, false);
  const eau = new THREE.MeshStandardMaterial({ map: dessiner("digue-eau", 256, 256, dessinerEau), vertexColors: true, roughness: 0.18, metalness: 0.05, transparent: true, opacity: 0.8, depthWrite: false });
  eau.userData.sansOmbre = true;
  const chute = new THREE.MeshStandardMaterial({ map: dessiner("digue-eau", 256, 256, dessinerEau), vertexColors: true, roughness: 0.2, metalness: 0.2, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide });
  chute.map = chute.map.clone();
  chute.map.needsUpdate = true;
  chute.userData.sansOmbre = true;
  const ecume = new THREE.MeshStandardMaterial({ map: dessiner("digue-ecume", 128, 128, dessinerEcume), vertexColors: true, roughness: 0.7, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide });
  ecume.userData.sansOmbre = true;
  const brume = new THREE.MeshStandardMaterial({ map: dessiner("digue-brume", 512, 128, dessinerBrume), vertexColors: true, roughness: 1, transparent: true, opacity: 0.65, depthWrite: false, blending: THREE.AdditiveBlending });
  brume.map.wrapT = THREE.ClampToEdgeWrapping;
  brume.userData.sansOmbre = true;
  const planches = matiereTexture(dessiner("digue-planches", 256, 256, dessinerPlanches), {});
  planches.userData.tuile = 2.4;
  const panneaux = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.8, side: THREE.DoubleSide });
  const lumineux = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 0.9, vertexColors: true, roughness: 0.4 });
  lumineux.userData.sansOmbre = true;
  M = {
    mat: matiere(0.95, 0),
    satin: matiere(0.6, 0.05),
    lisse: matiere(0.3, 0.05),
    tole: matiere(0.75, 0.3),
    metal: matiere(0.4, 0.7),
    toile: MAT.toile(),
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    flamme: matiereLueur(0xffb060, 0.8),
    voyant: matiereLueur(0xff3020, 0.9),
    pierre: matiereMonde("pierreTaille"),
    brique: matiereMonde("brique"),
    enduit: matiereMonde("enduit"),
    ardoise: matiereMonde("ardoise"),
    carrelage: matiereMonde("carrelage"),
    parquet: matiereMonde("parquet"),
    planches,
    eau,
    chute,
    ecume,
    brume,
    panneaux,
    lumineux,
  };
  return M;
}

// ---------- Outils de pose ----------

/** Un panneau plat dont l'image vient de l'atlas (région `r`), face vers +z local. */
export function panneau(c, r, pose, l, h, mat = M.panneaux) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
  c.poser(g, mat, 0xffffff, pose, { crasse: false, nuance: 0 });
  g.dispose();
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

/** Un cylindre vertical posé sur y (bas), centré en (x, z). */
export function cylindre(c, mat, couleur, x, y, z, r, h, n = 8, pose = {}, options = {}) {
  c.poser(geoCyl(r, r, h, n), mat, couleur, { x, y: y + h / 2, z, ...pose }, options);
}

/** Un quadrilatère [P0..P3] (sommets 3D) avec ses UV, en deux triangles. */
export function quad(c, mat, P, UV, couleur, options = {}) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([...P[0], ...P[1], ...P[2], ...P[0], ...P[2], ...P[3]], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([...UV[0], ...UV[1], ...UV[2], ...UV[0], ...UV[2], ...UV[3]], 2));
  g.computeVertexNormals();
  c.poser(g, mat, couleur, {}, { crasse: false, nuance: 0, ...options });
  g.dispose();
}

/** Une lame d'eau qui tombe : du bord (y1) au pied (y2), le long d'un segment horizontal a → b. */
export function lame(c, a, b, y1, y2, avance, couleur = 0xc8d4cc, T = 2.5) {
  const P = [[a[0], y1, a[1]], [b[0], y1, b[1]], [b[0] + avance[0], y2, b[1] + avance[1]], [a[0] + avance[0], y2, a[1] + avance[1]]];
  quad(c, M.chute, P, P.map(([x, y, z]) => [(x + z) / T, y / T]), couleur);
}

export const BOULE = new THREE.IcosahedronGeometry(1, 0);
export const ROCHE = new THREE.DodecahedronGeometry(1, 0);
const TIGE = new THREE.ConeGeometry(0.03, 1, 3, 1, true).translate(0, 0.5, 0);
const POUSSE = new THREE.ConeGeometry(0.045, 1, 3, 1, true).translate(0, 0.5, 0);
const MASSETTE = new THREE.CylinderGeometry(0.045, 0.045, 0.24, 4, 1, true);
export const CONE = new THREE.ConeGeometry(1, 1, 6);

/** Une touffe de roseaux : tiges fines, penchées, quelques massettes brunes. */
export function roseaux(c, x, z, y, h = 2, n = 5) {
  for (let i = 0; i < n; i++) {
    const hh = h * c.entre(0.6, 1.15);
    const sec = c.hasard() < 0.35;
    c.poser(TIGE, M.mat, sec ? COUL.roseauSec : COUL.roseau, { x: x + c.entre(-0.22, 0.22), y, z: z + c.entre(-0.22, 0.22), rx: c.entre(-0.18, 0.18), rz: c.entre(-0.18, 0.18), e: [1, hh, 1] }, { crasse: false, nuance: 0.1 });
  }
  if (c.hasard() < 0.5) c.poser(MASSETTE, M.mat, COUL.massette, { x, y: y + h * 0.78, z, rz: c.entre(-0.1, 0.1) }, { crasse: false, nuance: 0.05 });
}

/** Une masse de roselière haute (un bourrelet à facettes, quelques tiges qui dépassent). */
export function roseliere(c, x, z, y, s) {
  c.poser(BOULE, M.mat, c.hasard() < 0.5 ? COUL.roseauSec : 0xa29a62, { x, y: y + s * 0.5, z, ry: c.hasard() * 3, e: [s * c.entre(1, 1.6), s * 0.8, s * c.entre(0.8, 1.2)] }, { crasse: false, nuance: 0.08 });
  for (let i = 0; i < 3; i++) c.poser(TIGE, M.mat, COUL.roseau, { x: x + c.entre(-s, s) * 0.6, y: y + s * 0.6, z: z + c.entre(-s, s) * 0.5, rx: c.entre(-0.2, 0.2), rz: c.entre(-0.2, 0.2), e: [1.3, s * 1.2, 1.3] }, { crasse: false, nuance: 0.08 });
}

/** Un saule têtard : tronc court et trapu, tête noueuse, gerbe de pousses droites et feuillage argenté. */
export function sauleTetard(c, x, z, y, h = 2.2) {
  const px = c.entre(-0.15, 0.15);
  const pz = c.entre(-0.15, 0.15);
  const tete = [x + px, y + h, z + pz];
  c.tube([x, y - 0.4, z], tete, 0.32, COUL.sauleTronc, M.mat, 6);
  c.poser(BOULE, M.mat, COUL.sauleTronc, { x: tete[0], y: tete[1], z: tete[2], ry: c.hasard() * 3, e: [0.55, 0.38, 0.5] }, { nuance: 0.06 });
  // Une cavité sombre dans le tronc (les vieux têtards sont creux)
  c.boite(0.22, 0.5, 0.08, 0x2b2620, { x: x + px * 0.5, y: y + h * 0.5, z: z + pz * 0.5 + 0.3, rz: 0.1 }, M.mat, { crasse: false });
  const n = 13;
  const sommets = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2 + c.hasard() * 0.5;
    const ec = c.entre(0.15, 0.55);
    const lg = c.entre(1.6, 3.2);
    c.poser(POUSSE, M.mat, i % 3 ? 0x6b5a48 : 0x7a6a50, { x: tete[0] + Math.cos(a) * 0.25, y: tete[1], z: tete[2] + Math.sin(a) * 0.25, rx: Math.sin(a) * ec, rz: -Math.cos(a) * ec, e: [1, lg, 1] }, { crasse: false, nuance: 0.08 });
    if (i % 2 === 0) sommets.push([tete[0] + Math.cos(a) * (0.25 + lg * Math.sin(ec)), tete[1] + lg * 0.8, tete[2] + Math.sin(a) * (0.25 + lg * Math.sin(ec))]);
  }
  for (const s of sommets) c.poser(BOULE, M.mat, c.hasard() < 0.5 ? COUL.sauleFeuille : COUL.sauleFeuille2, { x: s[0], y: s[1] - 0.3, z: s[2], ry: c.hasard() * 3, e: [c.entre(0.45, 0.75), c.entre(0.6, 0.9), c.entre(0.45, 0.7)] }, { crasse: false, nuance: 0.07 });
}

/** Un peuplier de la rive d'en face : fût droit, colonne de feuillage. */
export function peuplier(c, x, z, y, h = 14) {
  c.tube([x, y - 0.3, z], [x, y + h * 0.4, z], 0.22, 0x6d6656, M.mat, 5);
  for (let k = 0; k < 3; k++) {
    const r = h * (0.13 - k * 0.025);
    c.poser(BOULE, M.mat, [0x5f7a45, 0x6f8a4c, 0x55703f][k], { x: x + c.entre(-0.2, 0.2), y: y + h * (0.42 + k * 0.2), z: z + c.entre(-0.2, 0.2), ry: c.hasard() * 3, e: [r, h * 0.17, r] }, { crasse: false, nuance: 0.06 });
  }
}

/** Un nid de héron, vide : un plateau de branchages. */
export function nid(c, x, y, z, s = 1) {
  c.poser(BOULE, M.mat, 0x5e5040, { x, y, z, ry: c.hasard() * 3, e: [0.7 * s, 0.22 * s, 0.6 * s] }, { crasse: false, nuance: 0.05 });
  for (let i = 0; i < 7; i++) {
    const a = c.hasard() * PI * 2;
    c.tube([x + Math.cos(a) * 0.2 * s, y + 0.05, z + Math.sin(a) * 0.2 * s], [x + Math.cos(a) * 0.85 * s, y + c.entre(-0.1, 0.25), z + Math.sin(a) * 0.85 * s], 0.025, 0x6a5a44, M.mat, 3, { crasse: false });
  }
  c.poser(BOULE, M.mat, 0xe8e2d4, { x: x + 0.15, y: y + 0.18 * s, z, e: [0.06, 0.04, 0.05] }, { crasse: false });
}

/** Une épave de voiture (repère : centre au sol, avant vers +x). */
export function voiture(c, x, y, z, ry, couleur, opts = {}) {
  const { rx = 0, rz = 0, capot = false } = opts;
  c.repere({ x, y, z, ry, rx, rz }, () => {
    c.boite(3.9, 0.62, 1.72, couleur, { y: 0.55 }, M.satin, { nuance: 0.05 });
    c.boite(2.0, 0.58, 1.54, couleur, { x: -0.25, y: 1.15 }, M.satin, { nuance: 0.05 });
    c.boite(2.02, 0.4, 1.5, 0x2c3a40, { x: -0.25, y: 1.12 }, M.verre, { crasse: false });
    c.boite(0.08, 0.18, 1.5, 0x9a9c98, { x: 1.97, y: 0.42 }, M.metal);
    c.boite(0.08, 0.18, 1.5, 0x9a9c98, { x: -1.97, y: 0.42 }, M.metal);
    for (const s of [-1, 1]) c.boite(0.04, 0.12, 0.3, 0xd8d2b8, { x: 1.96, y: 0.68, z: s * 0.6 }, M.lisse, { crasse: false });
    if (capot) c.boite(1.2, 0.05, 1.6, couleur, { x: 1.55, y: 1.1, z: 0.1, rz: 0.9 }, M.satin);
    for (const [px, pz] of [[1.25, 0.8], [1.25, -0.8], [-1.25, 0.8], [-1.25, -0.8]]) c.poser(geoCyl(0.32, 0.32, 0.22, 8), M.mat, 0x2a2a2a, { x: px, y: 0.25, z: pz, rx: PI / 2, e: [1, 1, 0.75] }, { crasse: false });
  });
}

export function chaise(c, x, z, ry, renversee = false, couleur = COUL.bois) {
  c.repere({ x, y: 0, z, ry, rx: renversee ? PI / 2 - 0.1 : 0 }, () => {
    const y0 = renversee ? 0.2 : 0;
    c.boite(0.44, 0.05, 0.44, couleur, { y: y0 + 0.46 }, M.mat);
    for (const [px, pz] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) c.boite(0.04, 0.46, 0.04, couleur, { x: px, y: y0 + 0.23, z: pz }, M.mat);
    c.boite(0.44, 0.48, 0.04, couleur, { y: y0 + 0.72, z: -0.2 }, M.mat);
  });
}

export function table(c, x, z, l, p, ry = 0, couleur = COUL.bois, h = 0.76) {
  c.repere({ x, y: 0, z, ry }, () => {
    c.boite(l, 0.06, p, couleur, { y: h - 0.03 }, M.mat);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.boite(0.07, h - 0.06, 0.07, couleur, { x: sx * (l / 2 - 0.1), y: (h - 0.06) / 2, z: sz * (p / 2 - 0.1) }, M.mat);
  });
}

/** Une étagère contre un mur (face vers +z local), chargée d'objets. */
export function etagere(c, x, z, ry, l, h, tons, plein = 0.7) {
  c.repere({ x, y: 0, z, ry }, () => {
    for (const s of [-1, 1]) c.boite(0.05, h, 0.38, COUL.boisGris, { x: s * (l / 2), y: h / 2 }, M.mat);
    const n = Math.max(2, Math.round(h / 0.45));
    for (let k = 0; k < n; k++) {
      const y = 0.12 + (k * (h - 0.2)) / (n - 1);
      c.boite(l, 0.03, 0.38, COUL.boisGris, { y }, M.mat);
      if (k === n - 1) continue;
      for (let xx = -l / 2 + 0.15; xx < l / 2 - 0.1; xx += 0.2) {
        if (c.hasard() > plein) continue;
        const hh = c.entre(0.1, 0.26);
        c.boite(0.13, hh, 0.15, tons[Math.floor(c.hasard() * tons.length)], { x: xx, y: y + 0.015 + hh / 2, z: c.entre(-0.05, 0.05), ry: c.entre(-0.3, 0.3) }, M.satin, { crasse: false, nuance: 0.1 });
      }
    }
  });
}

/** Un lit de camp : cadre de tubes, toile tendue, couverture froissée. */
export function litDeCamp(c, x, z, ry, couv = 0x6a5a4a) {
  c.repere({ x, y: 0, z, ry }, () => {
    for (const s of [-1, 1]) c.boite(1.9, 0.04, 0.04, COUL.acier, { y: 0.4, z: s * 0.32 }, M.metal);
    for (const s of [-1, 1]) for (const t of [-1, 1]) c.boite(0.04, 0.42, 0.04, COUL.acier, { x: s * 0.85, y: 0.2, z: t * 0.3, rx: t * 0.25 }, M.metal);
    c.boite(1.8, 0.03, 0.62, 0x6b6a4e, { y: 0.4 }, M.toile);
    c.boite(1.1, 0.08, 0.66, couv, { x: 0.3, y: 0.46, ry: c.entre(-0.15, 0.15) }, M.toile, { nuance: 0.06 });
  });
}

/** Un réchaud de camping sur une caisse, sa gamelle, éventuellement des braises. */
export function rechaud(c, x, z, braises = false) {
  c.boite(0.5, 0.4, 0.4, COUL.boisGris, { x, y: 0.2, z }, M.mat);
  cylindre(c, M.metal, 0x4f6a5a, x, 0.4, z, 0.13, 0.12, 8);
  cylindre(c, M.metal, 0x8a8f90, x + 0.02, 0.52, z, 0.12, 0.1, 8);
  if (braises) c.poser(BOULE, M.flamme, 0xff7a30, { x, y: 0.5, z, e: [0.1, 0.05, 0.1] }, { crasse: false, nuance: 0 });
}

/** Une lanterne (ou lampe-tempête) : socle, verre qui luit, anse. */
export function lanterne(c, x, y, z) {
  cylindre(c, M.tole, 0x5a4a3a, x, y, z, 0.09, 0.06, 6);
  c.poser(geoCyl(0.06, 0.07, 0.16, 6), M.flamme, 0xffc070, { x, y: y + 0.14, z }, { crasse: false, nuance: 0 });
  cylindre(c, M.tole, 0x5a4a3a, x, y + 0.22, z, 0.07, 0.04, 6);
  c.tube([x - 0.07, y + 0.26, z], [x + 0.07, y + 0.26, z], 0.008, 0x3a3a36, M.metal, 3);
}

/** Un feu : cercle de pierres, bûches croisées, flammes (cônes additifs), cendres. */
export function feu(c, x, z, r = 0.5) {
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * PI * 2;
    c.poser(ROCHE, M.mat, COUL.rocSombre, { x: x + Math.cos(a) * r, y: 0.07, z: z + Math.sin(a) * r, ry: a, e: [0.16, 0.11, 0.13] }, { crasse: false });
  }
  c.poser(BOULE, M.mat, 0x2a2420, { x, y: 0.03, z, e: [r * 0.7, 0.05, r * 0.7] }, { crasse: false });
  for (let i = 0; i < 4; i++) c.tube([x + Math.cos(i * 1.6) * r * 0.7, 0.05, z + Math.sin(i * 1.6) * r * 0.7], [x, 0.35, z], 0.05, 0x3a2b20, M.mat, 5);
  for (let i = 0; i < 3; i++) c.poser(CONE, M.flamme, i ? 0xffb040 : 0xff7a2a, { x: x + c.entre(-0.08, 0.08), y: 0.32 + i * 0.08, z: z + c.entre(-0.08, 0.08), e: [0.16 - i * 0.04, 0.5 - i * 0.1, 0.16 - i * 0.04] }, { crasse: false, nuance: 0 });
}

/** Un appelant : canard de bois peint (corps, tête, bec). */
export function appelant(c, x, y, z, ry, couleur = 0x5a4a38) {
  c.repere({ x, y, z, ry }, () => {
    c.poser(BOULE, M.satin, couleur, { e: [0.2, 0.08, 0.1] }, { crasse: false, nuance: 0.08 });
    c.poser(BOULE, M.satin, c.hasard() < 0.5 ? 0x3f6a4a : couleur, { x: 0.15, y: 0.1, e: [0.06, 0.055, 0.055] }, { crasse: false, nuance: 0.05 });
    c.boite(0.07, 0.02, 0.04, 0xb08a3a, { x: 0.23, y: 0.09 }, M.satin, { crasse: false });
  });
}

/** Un vélo électrique (repère : au sol, roues dans le plan x). */
export function velo(c, x, y, z, ry, rz = 0, couleur = 0x2f6f73) {
  c.repere({ x, y, z, ry, rz }, () => {
    for (const s of [-1, 1]) c.poser(geoTore(), M.mat, 0x232323, { x: s * 0.55, y: 0.34 }, { crasse: false });
    c.poutre([-0.55, 0.34, 0], [0, 0.4, 0], 0.04, couleur, M.satin);
    c.poutre([0, 0.4, 0], [0.45, 0.85, 0], 0.045, couleur, M.satin);
    c.poutre([-0.55, 0.34, 0], [-0.15, 0.8, 0], 0.035, couleur, M.satin);
    c.poutre([-0.15, 0.8, 0], [0.45, 0.85, 0], 0.035, couleur, M.satin);
    c.poutre([0.45, 0.85, 0], [0.55, 0.34, 0], 0.035, 0x9a9c98, M.metal);
    c.boite(0.36, 0.14, 0.12, 0x2b2b29, { x: 0.1, y: 0.58, rz: -0.6 }, M.satin); // la batterie
    c.boite(0.22, 0.05, 0.1, 0x2b2b29, { x: -0.2, y: 0.86 }, M.satin);
    c.boite(0.06, 0.04, 0.5, 0x2b2b29, { x: 0.47, y: 0.95 }, M.metal);
  });
}
let TORE = null;
function geoTore() {
  if (!TORE) TORE = new THREE.TorusGeometry(0.33, 0.035, 3, 10);
  return TORE;
}

/**
 * Un mur en deux parties : le bas (jusqu'à `coupe`, dans le chantier principal, obstacle pour le jeu) et le haut, dans
 * la couche `k` qui s'efface (façades sud et est, cloisons).
 */
export function murDouble(ctx, k, a, bb, spec) {
  const { h, ep = 0.3, coupe = 1.05, couleur, mat, ouvertures = [], breches = [] } = spec;
  mur(ctx.c, a, bb, { h: coupe, ep, couleur, mat, batiment: ctx.b, ouvertures: ouvertures.map((o) => ({ ...o, type: o.type === "porte" ? "porte" : "vide" })) });
  mur(k, a, bb, {
    h: h - coupe,
    y0: coupe,
    ep,
    couleur,
    mat,
    breches,
    ouvertures: ouvertures.map((o) => ({ ...o, vantail: undefined, bas: Math.max(0, o.bas - coupe), haut: o.haut - coupe })),
  });
}

/** Un pignon triangulaire dans le plan x = cste, base de largeur `W` centrée en cz, de hauteur `hf`. */
export function pignonX(c, mat, couleur, x, cz, W, y0, hf, ep = 0.3) {
  const s = new THREE.Shape();
  s.moveTo(-W / 2, 0);
  s.lineTo(W / 2, 0);
  s.lineTo(0, hf);
  s.lineTo(-W / 2, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: ep, bevelEnabled: false });
  c.poser(g, mat, couleur, { x: x - ep / 2, y: y0, z: cz, ry: PI / 2 }, { crasse: false, nuance: 0.02 });
  g.dispose();
}

/**
 * Un plancher sur pilotis (ponton, plate-forme) : platelage de planches, longerons, pieux jusque dans la vase.
 * `manque` : part de planches arrachées (des vides sombres et des planches de travers).
 */
export function plancher(ctx, [x1, z1, x2, z2], { manque = 0, pieux = 2, yFond = -2.4 } = {}) {
  const { c } = ctx;
  const long = x2 - x1 > z2 - z1;
  c.pave(x1, -0.07, z1, x2, 0.03, z2, COUL.planche, M.planches, { nuance: 0.03 });
  // Les longerons sous le platelage
  if (long) for (const z of [z1 + 0.12, z2 - 0.12]) c.pave(x1, -0.27, z - 0.08, x2, -0.07, z + 0.08, COUL.boisSombre, M.mat, { crasse: false });
  else for (const x of [x1 + 0.12, x2 - 0.12]) c.pave(x - 0.08, -0.27, z1, x + 0.08, -0.07, z2, COUL.boisSombre, M.mat, { crasse: false });
  // Les pieux, sur le pourtour
  const L = long ? x2 - x1 : z2 - z1;
  const n = Math.max(1, Math.round(L / pieux));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    for (const s of [0, 1]) {
      const x = long ? x1 + 0.12 + t * (x2 - x1 - 0.24) : s ? x2 - 0.12 : x1 + 0.12;
      const z = long ? (s ? z2 - 0.12 : z1 + 0.12) : z1 + 0.12 + t * (z2 - z1 - 0.24);
      if (hauteur(x, z) > -0.25) continue;
      cylindre(c, M.mat, 0x4a3e32, x, yFond, z, 0.11, 0.2 - yFond, 6, { rz: c.entre(-0.04, 0.04) }, { nuance: 0.06 });
    }
  }
  // Des planches arrachées : un vide sombre, une planche de travers
  const A = aleatoire(Math.round(x1 * 31 + z1 * 7));
  for (let i = 0; i < 12; i++) {
    if (A() > manque) continue;
    const t = 0.1 + A() * 0.8;
    const x = long ? x1 + t * (x2 - x1) : (x1 + x2) / 2;
    const z = long ? (z1 + z2) / 2 : z1 + t * (z2 - z1);
    if (long) c.pave(x - 0.12, 0.031, z1 + 0.05, x + 0.12, 0.034, z2 - 0.05, 0x1f2420, M.mat, { crasse: false });
    else c.pave(x1 + 0.05, 0.031, z - 0.12, x2 - 0.05, 0.034, z + 0.12, 0x1f2420, M.mat, { crasse: false });
    if (A() < 0.5) c.boite(long ? 0.24 : x2 - x1 + 0.2, 0.04, long ? z2 - z1 + 0.2 : 0.24, COUL.planche, { x: x + 0.3, y: 0.07, z: z + 0.2, ry: 0.4, rz: 0.08 }, M.planches, { nuance: 0.05 });
  }
}

/** Un mur de lattes (abri à tourbe) : des planches horizontales espacées, des poteaux ; le haut peut aller en couche. */
export function lattes(ctx, k, a, bb, h, { coupe = 1.05 } = {}) {
  const { c, b } = ctx;
  const n = Math.round(h / 0.24);
  for (let i = 0; i < n; i++) {
    const y = 0.15 + i * 0.24;
    if (y > h - 0.1) break;
    const ch = y + 0.14 < coupe || !k ? c : k;
    boiteEntre(ch, a[0], a[1], bb[0], bb[1], y, 0.14, 0.04, i % 3 ? COUL.boisGris : 0x7f776a, M.planches, { nuance: 0.05 }, 0.1);
  }
  const L = Math.hypot(bb[0] - a[0], bb[1] - a[1]);
  const np = Math.max(1, Math.round(L / 2.3));
  for (let i = 0; i <= np; i++) {
    const t = i / np;
    const x = a[0] + (bb[0] - a[0]) * t;
    const z = a[1] + (bb[1] - a[1]) * t;
    c.boite(0.14, coupe, 0.14, COUL.boisSombre, { x, y: coupe / 2, z }, M.mat);
    (k ?? c).boite(0.14, h - coupe + 0.1, 0.14, COUL.boisSombre, { x, y: coupe + (h - coupe + 0.1) / 2, z }, M.mat);
  }
  b.obstacle(a[0], a[1], bb[0], bb[1], "mur de lattes");
}
