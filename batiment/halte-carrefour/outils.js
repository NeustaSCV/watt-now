// Les outils de la halte du carrefour : bruit indexé sur la position, matières (liste fermée), pose de panneaux de
// l'atlas, couches à matières strictes, obstacles, recentrage d'un tronçon.

import * as THREE from "three";
import { PALETTE, MAT, matiere, matiereMonde, matiereTexture, matiereVerre, matiereEau, matiereLueur, dessiner } from "../commun/atelier.js";
import { AL, AH, dessinerAtlas, dessinerAsphalte, dessinerTuiles, dessinerBeton } from "./atlas.js";

export const lisse = (t) => {
  t = Math.min(1, Math.max(0, t));
  return t * t * (3 - 2 * t);
};
export const mix = (a, b, t) => a + (b - a) * t;
export const arr = (v) => Math.round(v * 10) / 10;

/** Bruit déterministe indexé sur des entiers : deux tronçons voisins voient la même chose à leur frontière. */
export function bruit(i, j = 0, k = 0) {
  let h = Math.imul(i | 0, 374761393) ^ Math.imul(j | 0, 668265263) ^ Math.imul((k | 0) + 1013, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export const bruitXZ = (x, z, k = 0) => bruit(Math.round(x * 10), Math.round(z * 10), k);
export function bruitLisse(x, z, k, echelle) {
  const fx = x / echelle;
  const fz = z / echelle;
  const i = Math.floor(fx);
  const j = Math.floor(fz);
  const tx = lisse(fx - i);
  const tz = lisse(fz - j);
  return mix(mix(bruit(i, j, k), bruit(i + 1, j, k), tx), mix(bruit(i, j + 1, k), bruit(i + 1, j + 1, k), tx), tz);
}

export function teinte(hex, vers, t) {
  const a = new THREE.Color(hex);
  a.lerp(new THREE.Color(vers), t);
  return a.getHex();
}

// ---------- Matières : une liste fermée ----------

let MATS = null;
export function matieres() {
  if (MATS) return MATS;
  const atlas = dessiner("carrefour-atlas", AL, AH, dessinerAtlas, false);
  const asphalte = matiereTexture(dessiner("carrefour-asphalte", 256, 256, dessinerAsphalte), { roughness: 0.95 });
  asphalte.userData.tuile = 9;
  const tuiles = matiereTexture(dessiner("carrefour-tuiles", 128, 128, dessinerTuiles), { roughness: 0.85, flatShading: true });
  tuiles.userData.tuile = 2;
  const beton = matiereTexture(dessiner("carrefour-beton", 256, 256, dessinerBeton), { roughness: 0.95 });
  beton.userData.tuile = 4;
  const enseignes = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.85, alphaTest: 0.5, side: THREE.DoubleSide });
  const neon = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 1.0, vertexColors: true, roughness: 0.5, side: THREE.DoubleSide });
  neon.userData.sansOmbre = true;
  MATS = {
    atlas,
    asphalte,
    tuiles,
    beton,
    enseignes,
    neon,
    enduit: matiereMonde("enduit"),
    pierre: matiereMonde("pierreTaille"),
    mat: matiere(0.95, 0),
    satin: matiere(0.6, 0.05),
    lisse: matiere(0.3, 0.05),
    tole: matiere(0.75, 0.3),
    metal: matiere(0.4, 0.7),
    toile: MAT.toile(),
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    eau: matiereEau(0x3c4a44, 0.7),
    lueur: matiereLueur(0xffffff, 0.5),
  };
  return MATS;
}

/**
 * Une couche qui s'efface, à matières strictes : toute matière hors de la liste est ramenée à la plus proche permise
 * (tôle → tôle ou mat, verre → verre ou rien…). Chaque matière d'une couche coûte un appel de dessin de plus.
 */
export function coucheStricte(b, nom, boite, bas, haut, permises, horsDe) {
  const k = b.couche(nom, boite, bas, haut, horsDe);
  const M = matieres();
  const ok = new Set(permises);
  const repli = (m) => {
    if (ok.has(m)) return m;
    if ((m === M.metal || m === M.satin || m === M.lisse) && ok.has(M.tole)) return M.tole;
    if ((m === M.tole || m === M.metal || m === M.lisse) && ok.has(M.satin)) return M.satin;
    if (m === M.enduit && ok.has(M.pierre)) return M.pierre;
    if (m === M.pierre && ok.has(M.enduit)) return M.enduit;
    if (m === M.tuiles && ok.has(M.tole)) return M.tole;
    return M.mat;
  };
  const poser = k.poser.bind(k);
  k.poser = (geo, mat, couleur, pose, options) => {
    if (mat === M.verre && !ok.has(M.verre)) return k; // pas de verre dans cette couche
    return poser(geo, repli(mat), couleur, pose, options);
  };
  return k;
}

// ---------- Pose ----------

/** Un panneau plat dont l'image vient de l'atlas (région `r`), face vers +z local. */
export function panneau(c, mat, r, pose, l, h, couleur = 0xffffff) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
  c.poser(g, mat, couleur, pose, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Un panneau double face (deux plans dos à dos) : lisible des deux côtés, le texte jamais en miroir. */
export function panneauDouble(c, mat, r, pose, l, h, ecart = 0.03) {
  const ry = pose.ry ?? 0;
  const dx = Math.sin(ry) * ecart;
  const dz = Math.cos(ry) * ecart;
  panneau(c, mat, r, { ...pose, x: (pose.x ?? 0) + dx, z: (pose.z ?? 0) + dz }, l, h);
  panneau(c, mat, r, { ...pose, x: (pose.x ?? 0) - dx, z: (pose.z ?? 0) - dz, ry: ry + Math.PI }, l, h);
}

/** Une boîte tendue entre deux points (section h × ep). */
export function barre(c, a, b, h, ep, couleur, mat, options) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  const L = Math.hypot(dx, dz);
  c.boite(Math.hypot(L, dy), h, ep, couleur, { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, z: (a[2] + b[2]) / 2, ry: -Math.atan2(dz, dx), rz: Math.atan2(dy, L) }, mat, options);
}

/** Un rectangle d'obstacles (quatre segments) tourné de `ry`. */
export function obstacleBoite(b, x, z, l, p, ry = 0, nature = "obstacle") {
  const co = Math.cos(ry);
  const si = Math.sin(ry);
  const pts = [[-l / 2, -p / 2], [l / 2, -p / 2], [l / 2, p / 2], [-l / 2, p / 2]].map(([lx, lz]) => [x + lx * co + lz * si, z - lx * si + lz * co]);
  for (let i = 0; i < 4; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % 4];
    b.obstacle(p1[0], p1[1], p2[0], p2[1], nature);
  }
}

/** Pose une géométrie déjà colorée (attribut « color ») sans la reteinter. */
export function poserBrut(c, positions, couleurs, mat) {
  if (!positions.length) return;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(couleurs, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array((positions.length / 3) * 2), 2));
  g.computeVertexNormals();
  let lot = c.lots.get(mat);
  if (!lot) c.lots.set(mat, (lot = []));
  lot.push(g);
}

/** Des triangles (positions à plat) d'une seule teinte (UV « monde » si la matière est texturée). */
export function poserTriangles(c, positions, mat, couleur, options = { crasse: false, nuance: 0 }) {
  if (!positions.length) return;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.computeVertexNormals();
  c.poser(g, mat, couleur, {}, options);
  g.dispose();
}

/** Recentre un tronçon bâti dans le repère de la halte sur son propre lot (géométries, couches, obstacles, lumières). */
export function recentrer(groupe, o, lot) {
  const vues = new Set();
  groupe.traverse((obj) => {
    if (obj.geometry && !vues.has(obj.geometry)) {
      vues.add(obj.geometry);
      obj.geometry.translate(-o.x, 0, -o.z);
    }
  });
  const ud = groupe.userData;
  for (const t of ud.toits) {
    t.boite = { ...t.boite, x: arr(t.boite.x - o.x), z: arr(t.boite.z - o.z) };
    if (t.horsDe) t.horsDe = { ...t.horsDe, x: t.horsDe.x - o.x, z: t.horsDe.z - o.z };
  }
  const dedans = (x, z) => Math.abs(x) <= lot.l / 2 + 1 && Math.abs(z) <= lot.p / 2 + 1;
  ud.obstacles = ud.obstacles
    .map((s) => ({ ...s, x1: arr(s.x1 - o.x), z1: arr(s.z1 - o.z), x2: arr(s.x2 - o.x), z2: arr(s.z2 - o.z) }))
    .filter((s) => dedans(s.x1, s.z1) || dedans(s.x2, s.z2));
  ud.lumieres = ud.lumieres.map((l) => ({ ...l, x: arr(l.x - o.x), z: arr(l.z - o.z) })).filter((l) => dedans(l.x, l.z));
  return groupe;
}
