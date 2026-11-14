// Les outils et les objets de la halte du passage à niveau : matériaux partagés, petites géométries, murs coupés à
// hauteur d'allège, mobilier de pavillon, véhicules, clôtures et haies. Tout est posé dans le repère de la halte entière.

import * as THREE from "three";
import { PALETTE, matiere, matiereMonde, matiereVerre, matiereLueur, matiereEau, matiereTexture, mur, arbuste } from "../commun/atelier.js";
import { ATLAS, texAtlas, texBitume, texHerbe, texTuiles, texOndule, matiereGrillage } from "./textures.js";

export const PI = Math.PI;
export const TAU = PI * 2;

// ---------- Matériaux (tous partagés : un matériau = un appel de dessin) ----------

const memo = new Map();
function une(cle, f) {
  if (!memo.has(cle)) memo.set(cle, f());
  return memo.get(cle);
}
function monde(cle, tex, tuile, options = {}) {
  return une(cle, () => {
    const m = matiereTexture(tex(), options);
    m.userData.tuile = tuile;
    return m;
  });
}

export const M = {
  mat: () => matiere(0.95, 0),
  satin: () => matiere(0.6, 0.05),
  lisse: () => matiere(0.3, 0.05),
  tole: () => matiere(0.75, 0.3),
  metal: () => matiere(0.4, 0.7),
  enduit: () => matiereMonde("enduit"),
  brique: () => matiereMonde("brique"),
  beton: () => matiereMonde("beton"),
  carrelage: () => matiereMonde("carrelage"),
  parquet: () => matiereMonde("parquet"),
  verre: () => matiereVerre(PALETTE.verreSombre, 0.4),
  eau: () => matiereEau(0x4a5a3e, 0.85),
  feu: () => matiereLueur(0xff9a40, 0.6),
  bitume: () => monde("bitume", texBitume, 8, { roughness: 0.95 }),
  herbe: () => monde("herbe", texHerbe, 8, { roughness: 1 }),
  tuiles: () => monde("tuiles", texTuiles, 2, { roughness: 0.9 }),
  ondule: () => monde("ondule", texOndule, 2, { roughness: 0.7, metalness: 0.25 }),
  grillage: () => une("grillage", matiereGrillage),
  atlas: () =>
    une("atlas", () => {
      const m = new THREE.MeshStandardMaterial({ map: texAtlas(), vertexColors: true, transparent: true, alphaTest: 0.05, roughness: 0.85, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      m.userData.sansOmbre = true;
      return m;
    }),
};

// ---------- Couleurs ----------

export const C = {
  herbe: 0x8ea763,
  herbeJardin: 0x86a85a,
  herbeSeche: 0xa9a86a,
  friche: 0x9c9f63,
  terre: 0x9c7a55,
  terreSombre: 0x7a5f45,
  gravier: 0xb0a898,
  bitume: 0x6a6966,
  trottoir: 0xbab5aa,
  bordure: 0xcfcabe,
  marquage: 0xd8d4c4,
  ballast: 0x8c857a,
  traverse: 0x6a5a48,
  rail: 0x6e625a,
  crepi: 0xe2d6be,
  crepiRose: 0xdcc0ae,
  crepiJaune: 0xe0cd9e,
  crepiGris: 0xcfcbc0,
  interieur: 0xe8e0cc,
  tuile: 0xb06a4c,
  tuileBrune: 0x8f5c46,
  volet: 0x7b8a8e,
  menuiserie: 0xe6e2d8,
  alu: 0x3a3c3e,
  thuya: 0x3d5e36,
  thuyaClair: 0x557540,
  thuyaMort: 0x8a6a3e,
  bois: PALETTE.bois,
  boisSombre: PALETTE.boisSombre,
  boisGris: PALETTE.boisGris,
  chassis: 0x2e2c2a,
  rouille: PALETTE.rouille,
  rouilleSombre: PALETTE.rouilleSombre,
  rouge: 0xb8332a,
  blanc: 0xe6e0d2,
  gris: 0x8a8c88,
  grisFonce: 0x4a4c4a,
  noir: 0x222322,
  canard: 0x3d6f70,
  ocre: 0xb08a3e,
  creme: PALETTE.abondanceCreme,
};

// ---------- Petites géométries ----------

/** Un quadrilatère (4 points [x, y, z]) ; `verso` : visible des deux côtés. */
export function quad(c, mat, couleur, p, verso = false) {
  const pos = [];
  for (const k of [0, 1, 2, 0, 2, 3]) pos.push(...p[k]);
  if (verso) for (const k of [0, 2, 1, 0, 3, 2]) pos.push(...p[k]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  c.poser(g, mat, couleur, {}, { crasse: false, nuance: 0.03 });
  g.dispose();
}

/** Un triangle visible des deux côtés. */
export function triangle2(c, mat, couleur, p) {
  const pos = [...p[0], ...p[1], ...p[2], ...p[0], ...p[2], ...p[1]];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  c.poser(g, mat, couleur, {}, { crasse: false, nuance: 0.03 });
  g.dispose();
}

/** Un panneau peint de l'atlas (le plan regarde +z, tourné de `ry`). */
export function panneau(c, region, x, y, z, l, h, ry = 0, rx = 0, rz = 0) {
  const [px, py, pw, ph] = ATLAS[region];
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / 1024, 1 - (py + (1 - uv.getY(i)) * ph) / 1024);
  c.poser(g, M.atlas(), 0xffffff, { x, y, z, ry, rx, rz }, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Un cylindre debout. */
export function cylY(c, x, z, y1, y2, r1, r2, couleur, mat, cotes = 8, ouvert = false) {
  const g = new THREE.CylinderGeometry(r2, r1, y2 - y1, cotes, 1, ouvert);
  c.poser(g, mat, couleur, { x, y: (y1 + y2) / 2, z });
  g.dispose();
}

/** Un cylindre couché le long de z. */
export function cylZ(c, x, y, z, r, l, couleur, mat, cotes = 10) {
  const g = new THREE.CylinderGeometry(r, r, l, cotes);
  c.poser(g, mat, couleur, { x, y, z, rx: PI / 2 });
  g.dispose();
}

/** Un cylindre couché le long de x. */
export function cylX(c, x, y, z, r, l, couleur, mat, cotes = 10) {
  const g = new THREE.CylinderGeometry(r, r, l, cotes);
  c.poser(g, mat, couleur, { x, y, z, rz: PI / 2 });
  g.dispose();
}

/** Une boule à facettes (feuillage, tête, dôme). */
export function boule(c, x, y, z, r, couleur, mat = M.mat(), e = [1, 1, 1]) {
  const g = new THREE.IcosahedronGeometry(1, 0);
  c.poser(g, mat, couleur, { x, y, z, ry: x * 0.7 + z, e: [r * e[0], r * e[1], r * e[2]] }, { crasse: false, nuance: 0.08 });
  g.dispose();
}

/** Les quatre côtés d'un rectangle comme obstacles. */
export function obstacleRect(b, x1, z1, x2, z2, nature) {
  b.obstacle(x1, z1, x2, z1, nature);
  b.obstacle(x2, z1, x2, z2, nature);
  b.obstacle(x2, z2, x1, z2, nature);
  b.obstacle(x1, z2, x1, z1, nature);
}

// ---------- Murs coupés à hauteur d'allège ----------

/** La hauteur où les murs sont coupés : le bas reste visible, le haut part avec le toit (couche qui s'efface). */
export const COUPE = 0.9;

/**
 * Un mur de `a` à `b` (voir `mur()` de l'atelier), coupé en deux à `COUPE` : le bas dans le chantier toujours visible
 * (et noté comme obstacle), le haut dans la couche `k`. Les fenêtres ont leur appui à 0,9 m.
 */
export function murCoupe(ctx, k, a, b, spec) {
  const { h, ouvertures = [], breches = [], y0 = 0 } = spec;
  const dh = h - COUPE;
  const bas = ouvertures.map((o) => ({ ...o, type: o.type === "porte" ? "porte" : "vide" }));
  const brechesBas = breches.filter((br) => br.profondeur > dh).map((br) => ({ ...br, profondeur: br.profondeur - dh, l: (br.l * (br.profondeur - dh)) / br.profondeur }));
  mur(ctx.c, a, b, { ...spec, y0, h: COUPE, ouvertures: bas, breches: brechesBas, batiment: ctx.b });
  const haut = ouvertures.filter((o) => o.haut > COUPE + 0.02).map((o) => ({ ...o, bas: Math.max(0, o.bas - COUPE), haut: o.haut - COUPE, vantail: undefined }));
  mur(k, a, b, { ...spec, y0: y0 + COUPE, h: dh, ouvertures: haut, breches, batiment: null });
}

/**
 * La coque d'une maison d'un niveau, rectangle (x0..x1, z0..z1) : quatre murs coupés, chaînes d'angle, sol, et une
 * couche pour le haut des murs et le toit. `ouv` : { s, e, n, o } listes d'ouvertures avec leur `x` (façades s, n) ou
 * leur `z` (façades e, o) absolus. Renvoie la couche.
 */
export function coque(ctx, spec) {
  const { x0, x1, z0, z1, h, nom, couleur, mat = M.enduit(), interieur = { couleur: C.interieur, mat: M.enduit(), crasse: false }, ouv = {}, breches = {}, ep = 0.25, angle = null, hautCouche = h + 3, boite = null } = spec;
  const k = ctx.b.couche(nom, boite ?? { x: (x0 + x1) / 2, z: (z0 + z1) / 2, l: x1 - x0 + 0.8, p: z1 - z0 + 0.8 }, COUPE, hautCouche);
  const faces = [
    ["s", [x0, z1], [x1, z1], (o) => o.x - x0],
    ["e", [x1, z1], [x1, z0], (o) => z1 - o.z],
    ["n", [x1, z0], [x0, z0], (o) => x1 - o.x],
    ["o", [x0, z0], [x0, z1], (o) => o.z - z0],
  ];
  for (const [f, a, bb, u] of faces) {
    const o = (ouv[f] ?? []).map((q) => ({ ...q, u: u(q) }));
    murCoupe(ctx, k, a, bb, { h, ep, couleur, mat, ouvertures: o, breches: breches[f] ?? [], interieur });
  }
  // Les chaînes d'angle (elles bouchent aussi la jonction des murs)
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) {
    ctx.c.pave(x - ep / 2 - 0.03, 0, z - ep / 2 - 0.03, x + ep / 2 + 0.03, COUPE, z + ep / 2 + 0.03, angle ?? couleur, mat);
    k.pave(x - ep / 2 - 0.03, COUPE, z - ep / 2 - 0.03, x + ep / 2 + 0.03, h, z + ep / 2 + 0.03, angle ?? couleur, mat);
  }
  return k;
}

/** Une cloison intérieure coupée (même règle que les murs), de `a` à `b`, avec ses portes. */
export function cloison(ctx, k, a, b, h, portes = [], couleur = C.interieur) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ouvertures = portes.map((d) => ({ u: d, l: 0.9, bas: 0, haut: 2.1, type: "porte" }));
  murCoupe(ctx, k, a, b, { h, ep: 0.12, couleur, mat: M.enduit(), ouvertures: ouvertures.filter((o) => o.u < L) });
}

/** Un toit à deux pans de tuiles mécaniques (faîtage selon x si `ry` = 0), ses pignons enduits, sa gouttière. */
export function toitTuiles(k, spec) {
  const { x0, x1, z0, z1, h, hf, couleur = C.tuile, pignon = C.crepi, trous = [], selonZ = false, debord = 0.4 } = spec;
  const xm = (x0 + x1) / 2;
  const zm = (z0 + z1) / 2;
  const l = selonZ ? z1 - z0 : x1 - x0;
  const p = selonZ ? x1 - x0 : z1 - z0;
  // Le toit lui-même : des lés de tuiles (texture), percés à l'usure
  const demi = p / 2 + debord;
  const pente = Math.atan2(hf, p / 2);
  const rampant = Math.hypot(demi, hf * (demi / (p / 2)));
  const lg = l + debord * 2;
  const nb = Math.max(2, Math.round(lg / 1.6));
  k.repere({ x: xm, y: h, z: zm, ry: selonZ ? PI / 2 : 0 }, () => {
    for (const s of [-1, 1]) {
      for (let i = 0; i < nb; i++) {
        const u = -lg / 2 + (i + 0.5) * (lg / nb);
        const troue = trous.find((t) => Math.sign(t.v) === s && Math.abs(u - t.u) < t.l / 2);
        for (const [v1, v2] of [[0, 0.5], [0.5, 1]]) {
          if (troue && v1 >= 1 - (troue.p ?? 1) - 1e-6) continue;
          const vm = (v1 + v2) / 2;
          const yy = hf - hf * (demi / (p / 2)) * vm;
          const zz = s * demi * vm;
          k.boite(lg / nb + 0.01, 0.07, rampant * (v2 - v1) + 0.02, couleur, { x: u, y: yy, z: zz, rx: s * pente }, M.tuiles(), { nuance: 0.04, crasse: false });
        }
      }
      for (const t of trous.filter((q) => Math.sign(q.v) === s)) {
        for (let u = t.u - t.l / 2 + 0.3; u < t.u + t.l / 2; u += 0.6) k.poutre([u, hf - 0.1, 0], [u, -0.05, s * (p / 2)], 0.09, C.boisSombre, M.mat());
      }
      // la gouttière et sa descente
      k.boite(lg, 0.1, 0.12, C.gris, { y: -hf * (debord / (p / 2)) - 0.02, z: s * demi }, M.mat(), { crasse: false });
    }
    k.boite(lg, 0.14, 0.24, couleur, { y: hf + 0.02 }, M.tuiles(), { crasse: false });
    // Les pignons
    for (const sx of [-1, 1]) {
      const x = sx * (l / 2);
      triangle2(k, M.enduit(), pignon, [[x, 0, -p / 2 - 0.12], [x, 0, p / 2 + 0.12], [x, hf, 0]]);
    }
  });
}

// ---------- Ouvertures ----------

export const fen = (pos, l = 1.2, o = {}) => ({ type: "fenetre", x: pos, z: pos, l, bas: COUPE, haut: 2.15, croisillons: 1, traverses: 2, cadre: C.menuiserie, matCadre: M.mat(), ...o });
export const porteF = (pos, l = 1.0, o = {}) => ({ type: "porte", x: pos, z: pos, l, bas: 0, haut: 2.15, vantail: "entrouvert", couleurPorte: 0x6a5a48, ...o });
export const vide = (pos, l = 1.0, haut = 2.15) => ({ type: "vide", x: pos, z: pos, l, bas: 0, haut });

// ---------- Mobilier ----------

export function table(c, x, z, l, p, couleur = C.bois, ry = 0, h = 0.76, renversee = false) {
  c.repere({ x, z, ry, rz: renversee ? PI / 2 - 0.1 : 0, y: renversee ? p * 0.1 : 0 }, () => {
    c.boite(l, 0.05, p, couleur, { y: h }, M.satin());
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.boite(0.06, h, 0.06, couleur, { x: sx * (l / 2 - 0.08), y: h / 2, z: sz * (p / 2 - 0.08) }, M.satin());
  });
}

export function chaise(c, x, z, ry, couleur = C.bois, renversee = false) {
  c.repere({ x, z, ry, rx: renversee ? -PI / 2 + 0.15 : 0, y: renversee ? 0.22 : 0 }, () => {
    c.boite(0.42, 0.04, 0.42, couleur, { y: 0.45 }, M.satin());
    c.boite(0.42, 0.45, 0.04, couleur, { y: 0.7, z: -0.19 }, M.satin());
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.boite(0.04, 0.45, 0.04, couleur, { x: sx * 0.18, y: 0.22, z: sz * 0.18 }, M.satin());
  });
}

export function lit(c, x, z, ry, l = 2, p = 1.5, drap = 0xc9c2b0) {
  c.repere({ x, z, ry }, () => {
    c.boite(l, 0.3, p, C.boisSombre, { y: 0.15 }, M.satin());
    c.boite(l - 0.1, 0.18, p - 0.08, drap, { y: 0.39 }, M.mat(), { nuance: 0.06 });
    c.boite(0.08, 0.9, p, C.boisSombre, { x: -l / 2, y: 0.45 }, M.satin());
    c.boite(0.4, 0.12, p * 0.4, 0xe6e0d0, { x: -l / 2 + 0.3, y: 0.53, z: -p * 0.22 }, M.mat());
    c.boite(0.4, 0.12, p * 0.4, 0xe6e0d0, { x: -l / 2 + 0.3, y: 0.53, z: p * 0.22 }, M.mat());
    c.boite(l * 0.6, 0.05, p + 0.1, 0x7a6a8a, { x: l * 0.15, y: 0.5, rz: 0.03 }, M.mat(), { nuance: 0.08 });
  });
}

export function armoire(c, x, z, ry, l = 1.2, p = 0.55, h = 2, couleur = C.bois, ouverte = false) {
  c.repere({ x, z, ry }, () => {
    c.boite(l, h, p, couleur, { y: h / 2 }, M.satin());
    c.boite(0.03, h - 0.1, 0.03, 0x3a2a1a, { y: h / 2, z: p / 2 + 0.01 }, M.satin());
    if (ouverte) c.boite(l / 2, h - 0.1, 0.03, couleur, { x: -l / 2 - 0.1, y: h / 2, z: p / 2 + l / 4, ry: 1.3 }, M.satin());
  });
}

export function etagere(c, x, z, ry, l, h, p, couleur = C.boisGris, n = 4, mat = M.satin()) {
  c.repere({ x, z, ry }, () => {
    for (const s of [-1, 1]) c.boite(0.04, h, p, couleur, { x: s * (l / 2 - 0.02), y: h / 2 }, mat);
    for (let i = 0; i < n; i++) c.boite(l, 0.03, p, couleur, { y: 0.12 + (i * (h - 0.15)) / Math.max(1, n - 1) }, mat);
    c.boite(l, h, 0.02, couleur, { y: h / 2, z: -p / 2 }, mat);
  });
}

export function canape(c, x, z, ry, l = 2.2, couleur = 0x6a6a72, angle = false) {
  c.repere({ x, z, ry }, () => {
    c.boite(l, 0.42, 0.9, couleur, { y: 0.21 }, M.mat(), { nuance: 0.05 });
    c.boite(l, 0.45, 0.2, couleur, { y: 0.62, z: -0.35 }, M.mat());
    for (const s of [-1, 1]) c.boite(0.2, 0.6, 0.9, couleur, { x: s * (l / 2 - 0.1), y: 0.3 }, M.mat());
    if (angle) {
      c.boite(0.9, 0.42, 1.6, couleur, { x: l / 2 - 0.45, y: 0.21, z: 1.2 }, M.mat());
      c.boite(0.2, 0.45, 1.6, couleur, { x: l / 2 + 0.1, y: 0.62, z: 1.2 }, M.mat());
    }
    c.boite(0.45, 0.3, 0.15, 0xb08a5a, { x: -l / 4, y: 0.55, z: -0.15, rz: 0.3 }, M.mat());
  });
}

export function frigo(c, x, z, ry, ouvert = true, ecran = false) {
  c.repere({ x, z, ry }, () => {
    c.boite(0.7, 1.85, 0.65, 0xd8d6d0, { y: 0.925 }, M.lisse());
    if (ouvert) c.boite(0.7, 1.8, 0.05, 0xd8d6d0, { x: -0.62, y: 0.925, z: 0.6, ry: 1.25 }, M.lisse());
    else c.boite(0.02, 0.5, 0.03, C.gris, { x: 0.3, y: 1.2, z: 0.34 }, M.metal());
    if (ecran) panneau(c, "frigo", 0.05, 1.35, 0.335, 0.34, 0.13);
  });
}

/** Un plan de travail le long de x local (évier, plaque, placards). */
export function planTravail(c, x, z, ry, l, couleur = 0xe2ddd0, plan = 0x8a7a68) {
  c.repere({ x, z, ry }, () => {
    c.boite(l, 0.86, 0.6, couleur, { y: 0.43 }, M.satin());
    c.boite(l + 0.04, 0.04, 0.64, plan, { y: 0.88 }, M.lisse());
    c.boite(0.6, 0.06, 0.42, 0x9a9c9a, { x: -l / 4, y: 0.88 }, M.metal());
    c.boite(0.56, 0.02, 0.5, 0x202020, { x: l / 4, y: 0.9 }, M.lisse());
    for (let i = 0; i < Math.floor(l / 0.6); i++) c.boite(0.02, 0.7, 0.01, 0x9a948a, { x: -l / 2 + 0.6 * (i + 1), y: 0.43, z: 0.305 }, M.satin());
    c.boite(l, 0.7, 0.35, couleur, { y: 1.85, z: -0.12 }, M.satin());
  });
}

/** Un vélo couché ou debout, dans le repère (axe du cadre selon x local). */
export function velo(c, x, z, ry, couleur = 0x3a6a8a, couche = false, y = 0) {
  c.repere({ x, y, z, ry, rx: couche ? PI / 2 - 0.08 : 0 }, () => {
    const roue = new THREE.TorusGeometry(0.33, 0.03, 4, 10);
    for (const dx of [-0.52, 0.52]) {
      c.poser(roue, M.mat(), 0x222222, { x: dx, y: 0.35, z: 0 }, { crasse: false });
      c.boite(0.04, 0.04, 0.08, 0x8a8a88, { x: dx, y: 0.35 }, M.metal());
    }
    roue.dispose();
    c.poutre([-0.52, 0.35, 0], [-0.05, 0.38, 0], 0.035, couleur, M.satin());
    c.poutre([-0.05, 0.38, 0], [0.38, 0.78, 0], 0.035, couleur, M.satin());
    c.poutre([-0.52, 0.35, 0], [-0.2, 0.8, 0], 0.035, couleur, M.satin());
    c.poutre([-0.2, 0.8, 0], [0.38, 0.8, 0], 0.035, couleur, M.satin());
    c.poutre([-0.05, 0.38, 0], [-0.2, 0.8, 0], 0.035, couleur, M.satin());
    c.poutre([0.52, 0.35, 0], [0.4, 0.95, 0], 0.03, 0x8a8a88, M.metal());
    c.boite(0.05, 0.03, 0.5, 0x2a2a2a, { x: 0.4, y: 0.98 }, M.metal());
    c.boite(0.24, 0.05, 0.1, 0x2a2a2a, { x: -0.22, y: 0.86 }, M.mat());
  });
}

/** Une trottinette électrique de location (couchée par défaut). */
export function trottinette(c, x, z, ry, couleur = 0x3d8a7a, couche = true, y = 0) {
  c.repere({ x, y, z, ry, rx: couche ? PI / 2 - 0.05 : 0 }, () => {
    c.boite(0.8, 0.06, 0.16, couleur, { y: 0.1 }, M.satin());
    c.boite(0.05, 1.0, 0.05, 0x2a2a2a, { x: 0.38, y: 0.6, rz: -0.12 }, M.metal());
    c.boite(0.05, 0.05, 0.45, 0x2a2a2a, { x: 0.44, y: 1.08 }, M.metal());
    cylZ(c, -0.38, 0.1, 0, 0.1, 0.06, 0x1a1a1a, M.mat(), 6);
    cylZ(c, 0.38, 0.1, 0, 0.1, 0.06, 0x1a1a1a, M.mat(), 6);
  });
}

/** Un nain de jardin (bonnet rouge, barbe blanche) ; `ry` le tourne, `tombe` le couche. */
export function nain(c, x, z, ry = 0, tombe = false, y = 0, s = 1) {
  const veste = [0x3d6f70, 0x5a7a3a, 0x8a5a3a, 0x3a4a7a][Math.floor(Math.abs(x * 7 + z * 3)) % 4];
  c.repere({ x, y, z, ry, rz: tombe ? PI / 2 - 0.1 : 0, e: s }, () => {
    c.boite(0.22, 0.24, 0.18, veste, { y: tombe ? 0.12 : 0.14 }, M.satin(), { crasse: false });
    c.boite(0.18, 0.1, 0.16, 0xe8e4da, { y: 0.3, z: 0.03 }, M.satin(), { crasse: false });
    boule(c, 0, 0.36, 0, 0.09, 0xe0b49a, M.satin());
    const bonnet = new THREE.ConeGeometry(0.09, 0.2, 5);
    c.poser(bonnet, M.satin(), 0xb8332a, { y: 0.52, rz: 0.15 }, { crasse: false });
    bonnet.dispose();
  });
}

/** Un téléviseur à écran plat (posé, couché ou appuyé). */
export function tele(c, x, y, z, ry, rx = 0, l = 1.2, h = 0.72) {
  c.repere({ x, y, z, ry, rx }, () => {
    c.boite(l, h, 0.06, 0x1e1f20, { y: h / 2 }, M.lisse(), { crasse: false });
    c.boite(l * 0.9, h * 0.86, 0.01, 0x2a3238, { y: h / 2, z: 0.035 }, M.lisse(), { crasse: false });
  });
}

/** Un carton (colis, télé emballée). */
export function carton(c, x, y, z, ry, l = 0.6, h = 0.4, p = 0.45, couleur = 0xb08a5a) {
  c.boite(l, h, p, couleur, { x, y: y + h / 2, z, ry }, M.mat(), { nuance: 0.08 });
}

/** Une caisse de bois à claire-voie. */
export function caisse(c, x, y, z, ry = 0, s = 0.8, couleur = C.bois) {
  c.repere({ x, y, z, ry }, () => {
    c.boite(s, s * 0.8, s, couleur, { y: s * 0.4 }, M.mat(), { nuance: 0.08 });
    for (const sz of [-1, 1]) c.boite(s + 0.02, 0.08, 0.04, C.boisSombre, { y: s * 0.4, z: sz * (s / 2 + 0.01) }, M.mat());
  });
}

/** Une botte de paille. */
export function paille(c, x, y, z, ry = 0) {
  c.boite(1.0, 0.45, 0.5, 0xc9b06a, { x, y: y + 0.225, z, ry }, M.mat(), { nuance: 0.1 });
}

/** Un bidon (jerrycan ou fût). */
export function bidon(c, x, z, couleur = 0x3a6a9a, y = 0, fut = false, ry = 0) {
  if (fut) cylY(c, x, z, y, y + 0.88, 0.29, 0.29, couleur, M.tole(), 10);
  else c.boite(0.34, 0.45, 0.17, couleur, { x, y: y + 0.225, z, ry }, M.satin());
}

/** Une cuve de 1 000 litres dans sa cage (eau de pluie des jardins). */
export function cuve(c, x, z, ry = 0, niveau = 0.5) {
  c.repere({ x, z, ry }, () => {
    c.boite(1.2, 0.14, 1.0, C.boisGris, { y: 0.07 }, M.mat());
    c.boite(1.12, 1.0, 0.92, 0xd8dcd8, { y: 0.66 }, M.lisse(), { crasse: false });
    c.boite(1.0, 1.0 * niveau, 0.8, 0x7a8a6a, { y: 0.16 + 0.5 * niveau }, M.lisse(), { crasse: false });
    for (const sx of [-0.58, 0.58]) for (const sz of [-0.48, 0.48]) c.boite(0.03, 1.1, 0.03, C.gris, { x: sx, y: 0.7, z: sz }, M.metal());
    for (const y of [0.4, 0.8, 1.18]) {
      c.boite(1.18, 0.03, 0.03, C.gris, { y, z: 0.48 }, M.metal());
      c.boite(1.18, 0.03, 0.03, C.gris, { y, z: -0.48 }, M.metal());
    }
  });
}

/** Un brasero de survivants : un fût découpé, des braises, des flammes (lueur), et sa lumière. */
export function brasero(ctx, x, z, y = 0, nature = "feu de survivants") {
  const { b, c } = ctx;
  cylY(c, x, z, y, y + 0.55, 0.28, 0.3, C.rouilleSombre, M.tole(), 8, true);
  for (let i = 0; i < 4; i++) c.boite(0.5, 0.06, 0.06, C.boisSombre, { x, y: y + 0.5, z, ry: i * 0.8 }, M.mat());
  for (let i = 0; i < 4; i++) c.boite(0.12, 0.25 + i * 0.07, 0.12, 0xffa040, { x: x + Math.cos(i * 1.7) * 0.08, y: y + 0.65 + i * 0.05, z: z + Math.sin(i * 1.7) * 0.08, ry: i, rz: 0.3 }, M.feu(), { crasse: false, nuance: 0 });
  b.lumiere(x, y + 1.0, z, 0xff8a3d, 7, 11, nature);
}

/** Une poubelle à roulettes (tri « connecté »). */
export function poubelle(c, x, z, ry = 0, couleur = 0x4a6a4a, renversee = false) {
  c.repere({ x, z, ry, rx: renversee ? PI / 2 - 0.1 : 0, y: renversee ? 0.32 : 0 }, () => {
    c.boite(0.6, 1.0, 0.65, couleur, { y: 0.5 }, M.satin());
    c.boite(0.64, 0.05, 0.7, couleur, { y: 1.02, z: renversee ? 0.2 : 0, rx: renversee ? 0.6 : 0 }, M.satin());
    cylX(c, 0, 0.1, -0.28, 0.1, 0.66, 0x1a1a1a, M.mat(), 6);
  });
}

// ---------- Véhicules ----------

/**
 * Une épave de voiture (axe selon x local) : caisse, habitacle, vitres sombres ou brisées, roues à plat, rouille.
 * `type` : « berline », « break », « citadine », « utilitaire ».
 */
export function epave(c, x, z, ry, couleur, type = "berline", usure = 0.7, k = c) {
  const L = type === "citadine" ? 3.6 : type === "utilitaire" ? 5.0 : 4.4;
  const H = type === "utilitaire" ? 2.1 : 1.35;
  c.repere({ x, z, ry, rz: (usure - 0.5) * 0.03 }, () => {
    // Le bas de caisse (posé un peu bas : pneus à plat)
    c.boite(L, 0.55, 1.75, couleur, { y: 0.5 }, M.satin(), { nuance: 0.06 });
    c.boite(L - 0.3, 0.12, 1.65, C.chassis, { y: 0.2 }, M.tole());
    // Pare-chocs
    for (const s of [-1, 1]) c.boite(0.12, 0.22, 1.7, 0x3a3a3a, { x: s * (L / 2), y: 0.42 }, M.mat());
    // Les roues
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) cylZ(c, sx * (L / 2 - 0.75), 0.28, sz * 0.8, 0.3, 0.22, 0x1c1c1c, M.mat(), 8);
    // L'habitacle
    if (type === "utilitaire") {
      c.boite(L * 0.7, H - 0.75, 1.75, couleur, { x: -L * 0.15, y: 0.78 + (H - 0.75) / 2 }, M.satin(), { nuance: 0.05 });
      c.boite(L * 0.25, 0.65, 1.7, couleur, { x: L * 0.36, y: 1.1 }, M.satin());
      c.boite(0.05, 0.5, 1.5, 0x2a3236, { x: L * 0.49, y: 1.15, rz: 0.2 }, M.lisse());
    } else {
      const lh = type === "break" ? L * 0.62 : L * 0.5;
      const dx = type === "break" ? -L * 0.08 : -L * 0.02;
      c.boite(lh, 0.55, 1.6, couleur, { x: dx, y: 1.03 }, M.satin());
      c.boite(lh - 0.15, 0.42, 1.62, 0x2a3236, { x: dx, y: 1.05 }, M.lisse(), { crasse: false });
      c.boite(0.05, 0.5, 1.4, 0x2a3236, { x: dx + lh / 2 + 0.15, y: 1.0, rz: 0.55 }, M.lisse());
      c.boite(lh + 0.05, 0.06, 1.62, couleur, { x: dx, y: 1.32 }, M.satin());
    }
    // La rouille sur le capot, une portière ouverte
    c.boite(0.8, 0.02, 0.9, C.rouille, { x: L * 0.3, y: 0.79, z: 0.1 }, M.mat(), { nuance: 0.1 });
    if (usure > 0.4) c.boite(1.0, 0.55, 0.05, couleur, { x: -0.1 + 0.4, y: 0.75, z: 0.88 + 0.45, ry: -0.9 }, M.satin());
  });
}

/** Un bus urbain (12 m, axe selon x local), vitres en bandeau, flanc peint. */
export function bus(c, x, z, ry, couleur = 0xd8d2c0, bande = 0x2f6f73, usure = 0.7, flanc = null) {
  const L = 11.6;
  c.repere({ x, z, ry }, () => {
    c.boite(L, 1.1, 2.5, couleur, { y: 0.95 }, M.satin(), { nuance: 0.04 });
    c.boite(L, 0.35, 2.52, bande, { y: 0.55 }, M.satin());
    c.boite(L, 1.2, 2.5, 0x2a3236, { y: 2.1 }, M.lisse(), { crasse: false });
    for (let i = 0; i <= 8; i++) c.boite(0.12, 1.2, 2.54, couleur, { x: -L / 2 + 0.2 + (i * (L - 0.4)) / 8, y: 2.1 }, M.satin());
    c.boite(L, 0.35, 2.5, couleur, { y: 2.88 }, M.satin());
    c.boite(L * 0.4, 0.3, 1.4, 0x9a9a96, { x: -L * 0.15, y: 3.2 }, M.tole());
    for (const sx of [-L / 2 + 2.4, L / 2 - 3.2]) for (const sz of [-1, 1]) cylZ(c, sx, 0.45, sz * 1.1, 0.48, 0.32, 0x1c1c1c, M.mat(), 10);
    // les portes (côté +z local)
    for (const dx of [L / 2 - 1.2, -0.6]) c.boite(1.1, 2.3, 0.04, 0x3a4246, { x: dx, y: 1.5, z: 1.27 }, M.lisse());
    if (flanc) panneau(c, flanc, -1.2, 1.15, 1.27, 5.2, 0.8);
    if (usure > 0.5) for (let i = 0; i < 3; i++) c.boite(1.2, 0.02, 2.5, C.rouille, { x: -3 + i * 2.5, y: 0.6 + i * 0.1, z: 0 }, M.mat());
  });
}

/** Un drone de livraison écrasé : corps, quatre bras, hélices tordues, et son colis. `mat` : la matière (toits). */
export function drone(c, x, y, z, ry = 0, rz = 0.3, colis = true, mat = M.satin()) {
  c.repere({ x, y, z, ry, rz }, () => {
    c.boite(0.6, 0.18, 0.4, 0x2f6f73, { y: 0.15 }, mat, { crasse: false });
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      c.poutre([0, 0.18, 0], [sx * 0.55, 0.22, sz * 0.45], 0.04, 0x2a2a2a, mat);
      c.boite(0.55, 0.01, 0.06, 0x1a1a1a, { x: sx * 0.55, y: 0.26, z: sz * 0.45, ry: sx * sz * 0.8, rz: sx > 0 ? 0.3 : 0 }, mat);
    }
    if (colis) {
      c.boite(0.4, 0.3, 0.32, 0xb08a5a, { x: 0.5, y: 0.15, z: 0.4, ry: 0.4 }, M.mat());
      if (mat === M.satin()) panneau(c, "wattydrop", 0.5, 0.31, 0.4, 0.34, 0.09, 0.4, -PI / 2);
    }
  });
}

// ---------- Clôtures, haies, réverbères ----------

/** Une haie de thuyas taillée en mur, laissée pousser : un bloc et des bosses, des pieds morts (bruns). Obstacle. */
export function haie(ctx, x1, z1, x2, z2, h = 2.2, ep = 0.9) {
  const { b, c, u } = ctx;
  const L = Math.hypot(x2 - x1, z2 - z1);
  if (L < 0.2) return;
  const ry = -Math.atan2(z2 - z1, x2 - x1);
  const n = Math.max(1, Math.round(L / 1.4));
  c.repere({ x: (x1 + x2) / 2, z: (z1 + z2) / 2, ry }, () => {
    for (let i = 0; i < n; i++) {
      const mort = c.hasard() < 0.08 + 0.15 * u;
      const coul = mort ? C.thuyaMort : c.hasard() < 0.5 ? C.thuya : C.thuyaClair;
      const xi = -L / 2 + (i + 0.5) * (L / n);
      const hh = h * (0.85 + c.hasard() * 0.3);
      c.boite(L / n + 0.05, hh, ep * (0.9 + c.hasard() * 0.2), coul, { x: xi, y: hh / 2 }, M.mat(), { nuance: 0.06 });
      const g = new THREE.IcosahedronGeometry(1, 0);
      c.poser(g, M.mat(), coul, { x: xi + c.entre(-0.3, 0.3), y: hh, z: c.entre(-0.1, 0.1), ry: c.hasard() * 3, e: [L / n * 0.55, 0.35 + u * 0.4, ep * 0.6] }, { crasse: false, nuance: 0.08 });
      g.dispose();
    }
  });
  b.obstacle(x1, z1, x2, z2, "haie de thuyas");
}

/** Une clôture de grillage sur poteaux, de (x1, z1) à (x2, z2). `trous` : [[t1, t2]] parts arrachées (0 à 1). */
export function grillage(ctx, x1, z1, x2, z2, h = 1.6, poteau = 0x5a6a5a, trous = [], nature = "grillage") {
  const { b, c } = ctx;
  const L = Math.hypot(x2 - x1, z2 - z1);
  if (L < 0.2) return;
  const ry = -Math.atan2(z2 - z1, x2 - x1);
  const pas = 2.5;
  const n = Math.max(1, Math.round(L / pas));
  const pleins = [];
  let t = 0;
  for (const [a, bb] of [...trous].sort((p, q) => p[0] - q[0])) {
    if (a > t) pleins.push([t, a]);
    t = Math.max(t, bb);
  }
  if (t < 1) pleins.push([t, 1]);
  c.repere({ x: x1, z: z1, ry }, () => {
    for (let i = 0; i <= n; i++) {
      const u = (i / n) * L;
      const dansTrou = trous.some(([a, bb]) => u / L > a + 0.02 && u / L < bb - 0.02);
      c.boite(0.07, h + 0.1, 0.07, poteau, { x: u, y: (h + 0.1) / 2, rz: dansTrou ? 0.6 : 0 }, M.tole());
    }
    for (const [a, bb] of pleins) {
      const u1 = a * L;
      const u2 = bb * L;
      c.boite(u2 - u1, h, 0.01, 0x9aa49a, { x: (u1 + u2) / 2, y: h / 2 }, M.grillage(), { crasse: false, nuance: 0 });
      c.boite(u2 - u1, 0.03, 0.03, poteau, { x: (u1 + u2) / 2, y: h }, M.tole());
    }
    // le grillage arraché, roulé au sol
    for (const [a, bb] of trous) {
      const u1 = a * L;
      const u2 = bb * L;
      c.boite((u2 - u1) * 0.8, 0.5, 0.01, 0x9aa49a, { x: (u1 + u2) / 2, y: 0.12, z: 0.4, rx: -1.3 }, M.grillage(), { crasse: false, nuance: 0 });
    }
  });
  for (const [a, bb] of pleins) b.obstacle(x1 + (x2 - x1) * a, z1 + (z2 - z1) * a, x1 + (x2 - x1) * bb, z1 + (z2 - z1) * bb, nature);
}

/** Un muret enduit surmonté d'une grille à barreaux (clôture de pavillon), avec chaperon. Obstacle. */
export function muret(ctx, x1, z1, x2, z2, couleur = C.crepi, grille = 0x3d4a48, h = 0.6, hg = 0.8) {
  const { b, c } = ctx;
  const L = Math.hypot(x2 - x1, z2 - z1);
  if (L < 0.2) return;
  const ry = -Math.atan2(z2 - z1, x2 - x1);
  c.repere({ x: (x1 + x2) / 2, z: (z1 + z2) / 2, ry }, () => {
    c.boite(L, h, 0.25, couleur, { y: h / 2 }, M.enduit());
    c.boite(L + 0.04, 0.06, 0.32, 0xcfc8b8, { y: h + 0.03 }, M.mat());
    if (hg > 0) {
      const n = Math.round(L / 0.22);
      for (let i = 0; i <= n; i++) {
        if (c.hasard() < 0.05) continue;
        c.boite(0.025, hg, 0.025, grille, { x: -L / 2 + (i * L) / n, y: h + 0.06 + hg / 2, rz: c.hasard() < 0.05 ? 0.3 : 0 }, M.tole(), { crasse: false });
      }
      c.boite(L, 0.04, 0.04, grille, { y: h + 0.06 + hg - 0.08 }, M.tole());
      c.boite(L, 0.04, 0.04, grille, { y: h + 0.2 }, M.tole());
    }
  });
  b.obstacle(x1, z1, x2, z2, "muret et grille");
}

/** Une palissade de chantier (panneaux de contreplaqué sur poteaux), avec des affiches. Obstacle. */
export function palissade(ctx, x1, z1, x2, z2, h = 2.2, affiches = [], couleur = 0xb8a888) {
  const { b, c } = ctx;
  const L = Math.hypot(x2 - x1, z2 - z1);
  if (L < 0.2) return;
  const ry = -Math.atan2(z2 - z1, x2 - x1);
  const n = Math.max(1, Math.round(L / 1.22));
  c.repere({ x: x1, z: z1, ry }, () => {
    for (let i = 0; i < n; i++) {
      const u = ((i + 0.5) * L) / n;
      const penche = c.hasard() < 0.1 ? c.entre(-0.08, 0.08) : 0;
      c.boite(L / n - 0.02, h, 0.03, couleur, { x: u, y: h / 2, rz: penche }, M.mat(), { nuance: 0.08 });
      c.boite(0.08, h + 0.1, 0.08, C.boisGris, { x: (i * L) / n, y: (h + 0.1) / 2, z: -0.06 }, M.mat());
    }
    for (const [reg, u, l, hh] of affiches) panneau(c, reg, u, h * 0.55, 0.03, l, hh);
  });
  b.obstacle(x1, z1, x2, z2, "palissade de chantier");
}

/** Un réverbère de rue (mât, crosse, lanterne), éteint. */
export function reverbere(c, x, z, ry = 0, penche = 0) {
  c.repere({ x, z, ry, rz: penche }, () => {
    cylY(c, 0, 0, 0, 0.5, 0.14, 0.12, 0x4a524e, M.tole(), 6);
    cylY(c, 0, 0, 0.5, 6.2, 0.07, 0.06, 0x4a524e, M.tole(), 6);
    c.poutre([0, 6.1, 0], [0, 6.4, 0.9], 0.06, 0x4a524e, M.tole());
    c.boite(0.35, 0.14, 0.6, 0x3a403e, { y: 6.35, z: 1.05 }, M.tole());
    c.boite(0.28, 0.03, 0.5, 0xd8d4c0, { y: 6.27, z: 1.05 }, M.lisse());
  });
}

/** Une touffe de massifs (arbustes) le long d'un rectangle. */
export function massif(c, x1, z1, x2, z2, n, taille = 1) {
  for (let i = 0; i < n; i++) arbuste(c, c.entre(x1, x2), c.entre(z1, z2), taille * c.entre(0.7, 1.2));
}
