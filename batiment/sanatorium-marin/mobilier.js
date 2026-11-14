// Le sanatorium marin des Courlis : le mobilier (lits d'enfants en fer, lits roulants de cure, agrès de rééducation,
// réfectoire, cuisine collective, infirmerie, lingerie, jouets) et la végétation des dunes.
// Toutes les pièces sont des boîtes et des cylindres à peu de côtés : les détails passent par la couleur.

import * as THREE from "three";
import { COUL, matieres } from "./textures.js";

const GEO = {};
function geo(cle, f) {
  return GEO[cle] ?? (GEO[cle] = f());
}

/** Un cylindre vertical (ou orienté par `pose`) de rayon `r`, hauteur `h`. */
export function cylindre(c, mat, couleur, x, y, z, r, h, cotes = 8, pose = {}, options = {}) {
  c.poser(geo(`cyl|${r}|${h}|${cotes}`, () => new THREE.CylinderGeometry(r, r, h, cotes)), mat, couleur, { x, y, z, ...pose }, options);
}

/** Un cône tronqué (marmite, seau, bidon, lampe). */
export function tronc(c, mat, couleur, x, y, z, r1, r2, h, cotes = 8, pose = {}, options = {}) {
  c.poser(geo(`tronc|${r1}|${r2}|${h}|${cotes}`, () => new THREE.CylinderGeometry(r1, r2, h, cotes)), mat, couleur, { x, y, z, ...pose }, options);
}

/** Une boule à facettes (ballon, tête d'ours, bouée) : `fin` 0 (20 triangles) ou 1 (80 triangles). */
export function boule(c, mat, couleur, x, y, z, r, fin = 0, options = {}) {
  c.poser(geo(`ico|${fin}`, () => new THREE.IcosahedronGeometry(1, fin)), mat, couleur, { x, y, z, e: r }, { crasse: false, ...options });
}

/** Une roue (cylindre couché selon x local). */
function roue(c, mat, couleur, x, y, z, r, ep = 0.05) {
  c.poser(geo(`roue|${r}|${ep}`, () => new THREE.CylinderGeometry(r, r, ep, 10).rotateZ(Math.PI / 2)), mat, couleur, { x, y, z }, { crasse: false });
}

// ---------- Les lits ----------

/**
 * Un petit lit d'enfant en fer peint en blanc, tête vers −z local. `etat` : « fait », « defait », « nu » (sommier seul),
 * « renverse ». `ensable` : hauteur de sable qui le noie (le lit s'enfonce).
 */
export function litEnfant(c, x, z, ry = 0, etat = "fait", o = {}) {
  const M = matieres();
  const fer = o.fer ?? COUL.fer;
  const ens = o.ensable ?? 0;
  const renverse = etat === "renverse";
  c.repere({ x, y: renverse ? 0.36 : -ens, z, ry, rz: renverse ? Math.PI / 2 - 0.12 : 0 }, () => {
    for (const [sx, sz, h] of [[-0.33, -0.7, 1.0], [0.33, -0.7, 1.0], [-0.33, 0.7, 0.75], [0.33, 0.7, 0.75]]) c.boite(0.045, h, 0.045, fer, { x: sx, y: h / 2, z: sz }, M.satin);
    // tête : barreaux sous une traverse cintrée (deux pentes)
    c.boite(0.7, 0.04, 0.04, fer, { y: 0.97, z: -0.7 }, M.satin, { crasse: false });
    c.boite(0.7, 0.04, 0.04, fer, { y: 0.45, z: -0.7 }, M.satin, { crasse: false });
    for (const bx of [-0.17, 0, 0.17]) c.boite(0.025, 0.5, 0.025, fer, { x: bx, y: 0.71, z: -0.7 }, M.satin, { crasse: false });
    c.boite(0.7, 0.04, 0.04, fer, { y: 0.73, z: 0.7 }, M.satin, { crasse: false });
    c.boite(0.7, 0.04, 0.04, fer, { y: 0.45, z: 0.7 }, M.satin, { crasse: false });
    // longerons et sommier à ressorts (rouillé)
    c.boite(0.04, 0.05, 1.4, fer, { x: -0.33, y: 0.42 }, M.satin);
    c.boite(0.04, 0.05, 1.4, fer, { x: 0.33, y: 0.42 }, M.satin);
    c.boite(0.62, 0.02, 1.34, COUL.rouille, { y: 0.42 }, M.tole, { nuance: 0.08 });
    if (etat === "fait" || etat === "defait") {
      c.boite(0.6, 0.11, 1.3, COUL.matelas, { y: 0.49 }, M.mat, { nuance: 0.06 });
      const plaid = o.plaid ?? COUL.plaids[Math.floor(c.hasard() * COUL.plaids.length)];
      if (etat === "fait") {
        c.boite(0.64, 0.04, 0.8, plaid, { y: 0.56, z: 0.22 }, M.toile, { nuance: 0.05 });
        c.boite(0.42, 0.08, 0.26, COUL.draps, { y: 0.58, z: -0.5 }, M.mat, { crasse: false });
      } else {
        c.boite(0.7, 0.04, 0.9, plaid, { x: 0.3, y: 0.4, z: 0.1, rz: -0.9, ry: c.entre(-0.2, 0.2) }, M.toile, { nuance: 0.05 });
      }
    }
  });
}

/**
 * Le lit roulant de cure (les « gouttières » des enfants de la côte) : un châssis bas sur quatre grandes roues, un dossier
 * relevable, une couverture. On les poussait dans les galeries et jusque sur la plage. Tête vers −z local.
 */
export function litRoulant(c, x, z, ry = 0, o = {}) {
  const M = matieres();
  const bois = o.bois ?? COUL.bois;
  const ens = o.ensable ?? 0;
  c.repere({ x, y: -ens, z, ry, rx: o.penche ?? 0, rz: o.roule ?? 0 }, () => {
    // roues : deux grandes à la tête, deux petites au pied
    for (const s of [-1, 1]) {
      roue(c, M.tole, COUL.noir, s * 0.47, 0.3, -0.65, 0.3);
      roue(c, M.tole, COUL.noir, s * 0.42, 0.16, 0.8, 0.16);
    }
    c.boite(1.0, 0.04, 0.04, COUL.fonte, { y: 0.3, z: -0.65 }, M.tole);
    // le châssis de bois, ses brancards
    c.boite(0.86, 0.08, 1.9, bois, { y: 0.52 }, M.mat, { nuance: 0.05 });
    for (const s of [-1, 1]) {
      c.boite(0.05, 0.05, 2.3, bois, { x: s * 0.46, y: 0.6, z: 0.1 }, M.mat);
      c.boite(0.04, 0.22, 0.04, COUL.fonte, { x: s * 0.42, y: 0.4, z: 0.8 }, M.tole);
    }
    // matelas, dossier relevé, couverture et oreiller
    c.boite(0.78, 0.12, 1.25, COUL.matelas, { y: 0.62, z: 0.3 }, M.mat, { nuance: 0.05 });
    c.boite(0.78, 0.1, 0.75, COUL.matelas, { y: 0.82, z: -0.55, rx: -0.55 }, M.mat, { nuance: 0.05 });
    c.boite(0.6, 0.12, 0.08, COUL.boisSombre, { y: 0.64, z: -0.92, rx: 0.3 }, M.mat);
    if (o.couverture !== false) c.boite(0.84, 0.05, 1.0, o.plaid ?? COUL.plaids[Math.floor(c.hasard() * COUL.plaids.length)], { y: 0.7, z: 0.4, rz: c.entre(-0.06, 0.06) }, M.toile, { nuance: 0.06 });
    c.boite(0.46, 0.1, 0.28, COUL.draps, { y: 0.98, z: -0.72, rx: -0.55 }, M.mat, { crasse: false });
    // le casque de « réalité virtuelle » de ThalassoLuxe, posé sur l'oreiller face à la vraie mer
    if (o.casque) {
      c.boite(0.22, 0.1, 0.12, COUL.noir, { y: 1.06, z: -0.62, rx: -0.55 }, M.lisse, { crasse: false });
      c.boite(0.18, 0.03, 0.02, 0x4fb0c0, { y: 1.07, z: -0.55, rx: -0.55 }, M.lisse, { crasse: false });
    }
  });
}

/** Une table de chevet basse en fer, une tasse émaillée. */
export function chevet(c, x, z, ry = 0) {
  const M = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(0.36, 0.55, 0.34, COUL.fer, { y: 0.275 }, M.satin);
    c.boite(0.3, 0.1, 0.02, COUL.ferBleu, { y: 0.42, z: 0.18 }, M.satin, { crasse: false });
    if (c.hasard() < 0.6) tronc(c, M.lisse, 0xe9e6dc, 0.05, 0.6, 0, 0.04, 0.035, 0.09, 6);
  });
}

/** Un casier d'enfant (vestiaire de bois peint), porte entrouverte. */
export function casiers(c, x, z, ry, n) {
  const M = matieres();
  c.repere({ x, z, ry }, () => {
    for (let i = 0; i < n; i++) {
      const u = (i - (n - 1) / 2) * 0.46;
      c.boite(0.44, 1.5, 0.4, COUL.menuiserieClaire, { x: u, y: 0.75 }, M.mat, { nuance: 0.05 });
      if (c.hasard() < 0.5) c.boite(0.4, 1.3, 0.03, COUL.menuiserie, { x: u - 0.12, y: 0.8, z: 0.32, ry: -0.9 }, M.mat, { nuance: 0.06 });
      else c.boite(0.4, 1.3, 0.03, COUL.menuiserie, { x: u, y: 0.8, z: 0.21 }, M.mat, { nuance: 0.06 });
    }
  });
}

// ---------- Les jouets abandonnés ----------

/** Un ours en peluche assis (quelques boules). */
export function ours(c, x, y, z, ry = 0, teinte = 0xa07a52) {
  const M = matieres();
  c.repere({ x, y, z, ry }, () => {
    boule(c, M.mat, teinte, 0, 0.13, 0, 0.13);
    boule(c, M.mat, teinte, 0, 0.32, 0.02, 0.1);
    boule(c, M.mat, teinte, -0.07, 0.4, 0.02, 0.04);
    boule(c, M.mat, teinte, 0.07, 0.4, 0.02, 0.04);
    boule(c, M.mat, teinte, -0.1, 0.06, 0.1, 0.05);
    boule(c, M.mat, teinte, 0.1, 0.06, 0.1, 0.05);
  });
}

/** Seau et pelle de plage. */
export function seau(c, x, z, couleur, couche = false) {
  const M = matieres();
  tronc(c, M.satin, couleur, x, 0.1, z, 0.11, 0.08, 0.2, 7, couche ? { rz: Math.PI / 2, y: 0.1 } : {});
  c.boite(0.05, 0.02, 0.38, COUL.jouets[(COUL.jouets.indexOf(couleur) + 1) % 4], { x: x + 0.2, y: 0.02, z: z + 0.1, ry: 0.7 }, M.satin, { crasse: false });
}

/** Un voilier de bois (jouet), couché. */
export function voilier(c, x, y, z, ry = 0) {
  const M = matieres();
  c.repere({ x, y, z, ry, rz: 0.5 }, () => {
    c.boite(0.36, 0.08, 0.12, 0xb5573f, { y: 0.04 }, M.satin);
    c.boite(0.015, 0.36, 0.015, COUL.boisSombre, { y: 0.26 }, M.mat);
    c.boite(0.16, 0.24, 0.01, COUL.draps, { x: 0.07, y: 0.24 }, M.toile);
  });
}

/** Un cerceau, un ballon, un cheval de bois à bascule. */
export function cerceau(c, x, z, couleur) {
  const M = matieres();
  c.poser(geo("cerceau", () => new THREE.TorusGeometry(0.32, 0.015, 3, 12)), M.satin, couleur, { x, y: 0.02, z, rx: Math.PI / 2 }, { crasse: false });
}

export function chevalBascule(c, x, z, ry = 0) {
  const M = matieres();
  c.repere({ x, z, ry }, () => {
    for (const s of [-1, 1]) c.poser(geo("bascule", () => new THREE.TorusGeometry(0.5, 0.025, 3, 10, Math.PI * 0.6).rotateZ(Math.PI * 1.2)), M.mat, COUL.boisSombre, { z: s * 0.14, y: 0.52 }, { crasse: false });
    c.boite(0.7, 0.2, 0.2, 0xc9b79a, { y: 0.45 }, M.satin);
    c.boite(0.14, 0.32, 0.16, 0xc9b79a, { x: 0.36, y: 0.62, rz: -0.3 }, M.satin);
    c.boite(0.22, 0.12, 0.13, 0xc9b79a, { x: 0.46, y: 0.78 }, M.satin);
    c.boite(0.2, 0.2, 0.03, 0x6a4f3a, { x: 0.3, y: 0.7 }, M.mat);
    for (const [px, pz] of [[-0.25, -0.08], [-0.25, 0.08], [0.25, -0.08], [0.25, 0.08]]) c.boite(0.05, 0.22, 0.05, 0xc9b79a, { x: px, y: 0.27, z: pz }, M.satin);
  });
}

// ---------- La salle de rééducation ----------

/** Un espalier contre un mur (face +z local) : deux montants, des barreaux ronds. */
export function espalier(c, x, z, ry, l = 0.9, casse = false) {
  const M = matieres();
  c.repere({ x, z, ry }, () => {
    for (const s of [-1, 1]) c.boite(0.08, 2.6, 0.1, COUL.bois, { x: (s * l) / 2, y: 1.3, z: 0.1 }, M.mat);
    for (let i = 0; i < 16; i++) {
      if (casse && i > 3 && i < 7) continue;
      c.boite(l, 0.035, 0.035, 0xb59a72, { y: 0.15 + i * 0.155, z: 0.1 }, M.satin, { crasse: false });
    }
    if (casse) c.boite(l, 0.035, 0.035, 0xb59a72, { y: 0.03, z: 0.4, ry: 0.4 }, M.satin, { crasse: false });
  });
}

/** Un portique à poulies : deux poulies au plafond, cordes, poignées et poids de fonte (face +z local). */
export function poulies(c, x, z, ry) {
  const M = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(1.6, 0.12, 0.12, COUL.bois, { y: 2.7, z: 0.3 }, M.mat);
    for (const s of [-1, 1]) {
      c.boite(0.1, 2.76, 0.1, COUL.bois, { x: s * 0.8, y: 1.38, z: 0.1 }, M.mat);
      roue(c, M.tole, COUL.fonte, s * 0.5, 2.55, 0.45, 0.09, 0.04);
      c.boite(0.015, 1.5, 0.015, 0xc9b98f, { x: s * 0.5, y: 1.75, z: 0.5 }, M.mat, { crasse: false });
      c.boite(0.16, 0.04, 0.04, COUL.boisSombre, { x: s * 0.5, y: 1.0, z: 0.5 }, M.mat);
      // les poids, contre le montant
      c.boite(0.015, 1.9, 0.015, 0xc9b98f, { x: s * 0.62, y: 1.6, z: 0.35 }, M.mat, { crasse: false });
      for (let k = 0; k < 3; k++) c.boite(0.18, 0.06, 0.12, COUL.fonte, { x: s * 0.62, y: 0.4 + k * 0.07, z: 0.35 }, M.tole);
    }
  });
}

/** Les barres parallèles (selon x local). */
export function barresParalleles(c, x, z, ry, l = 3) {
  const M = matieres();
  c.repere({ x, z, ry }, () => {
    for (const s of [-1, 1]) {
      c.boite(l, 0.05, 0.05, 0xb59a72, { y: 0.95, z: s * 0.3 }, M.satin);
      for (const u of [-l / 2 + 0.15, 0, l / 2 - 0.15]) c.boite(0.05, 0.95, 0.05, COUL.fonte, { x: u, y: 0.475, z: s * 0.3 }, M.tole);
    }
    c.boite(l + 0.2, 0.06, 0.9, COUL.fonte, { y: 0.03 }, M.tole);
  });
}

/** Un ballon de cuir (médecine-ball) ou un grand ballon de gymnastique. */
export function ballon(c, x, z, r, couleur) {
  const M = matieres();
  boule(c, M.satin, couleur, x, r * 0.95, z, r, 1);
}

/** Une table de massage (plinthe) et son tabouret. */
export function plinthe(c, x, z, ry = 0) {
  const M = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(1.9, 0.12, 0.65, COUL.cuir, { y: 0.72 }, M.satin, { nuance: 0.05 });
    for (const [px, pz] of [[-0.85, -0.27], [0.85, -0.27], [-0.85, 0.27], [0.85, 0.27]]) c.boite(0.06, 0.68, 0.06, COUL.bois, { x: px, y: 0.34, z: pz }, M.mat);
    c.boite(1.8, 0.04, 0.55, COUL.bois, { y: 0.22 }, M.mat);
  });
}

/** Un tapis de gymnastique, roulé ou à plat. */
export function tapis(c, x, z, ry, roule = false) {
  const M = matieres();
  if (roule) cylindre(c, M.mat, 0x7a6a52, x, 0.22, z, 0.22, 1.1, 7, { rz: Math.PI / 2, ry });
  else c.boite(1.9, 0.06, 0.95, 0x8a7a5e, { x, y: 0.03, z, ry }, M.mat, { nuance: 0.06 });
}

// ---------- Réfectoire et cuisine ----------

/** Une table basse d'enfants (formica crème, pieds de fer) selon x. */
export function tableEnfants(c, x, z, l, renverse = false) {
  const M = matieres();
  c.repere({ x, z, y: renverse ? 0.36 : 0, rz: renverse ? Math.PI / 2 : 0 }, () => {
    c.boite(l, 0.04, 0.8, 0xe2dccb, { y: 0.6 }, M.lisse, { nuance: 0.03 });
    for (const [px, pz] of [[-l / 2 + 0.1, -0.33], [l / 2 - 0.1, -0.33], [-l / 2 + 0.1, 0.33], [l / 2 - 0.1, 0.33]]) c.boite(0.04, 0.58, 0.04, COUL.fonte, { x: px, y: 0.29, z: pz }, M.tole);
  });
}

/** Une petite chaise d'écolier (assise de bois, piètement de fer). */
export function chaiseEnfant(c, x, z, ry = 0, renverse = false) {
  const M = matieres();
  c.repere({ x, z, ry, y: renverse ? 0.18 : 0, rx: renverse ? -Math.PI / 2 : 0 }, () => {
    c.boite(0.32, 0.03, 0.3, 0xb08f62, { y: 0.34 }, M.mat);
    c.boite(0.3, 0.14, 0.02, 0xb08f62, { y: 0.55, z: -0.14 }, M.mat);
    for (const [px, pz] of [[-0.14, -0.13], [0.14, -0.13], [-0.14, 0.13], [0.14, 0.13]]) c.boite(0.025, pz < 0 ? 0.62 : 0.34, 0.025, COUL.fonte, { x: px, y: pz < 0 ? 0.31 : 0.17, z: pz }, M.tole);
  });
}

/** Une grande marmite de cuisine collective (fonte émaillée, anses). */
export function marmite(c, x, y, z, r = 0.32, h = 0.45, couvercle = true) {
  const M = matieres();
  tronc(c, M.tole, 0x6f7472, x, y + h / 2, z, r, r * 0.92, h, 9);
  for (const s of [-1, 1]) c.boite(0.12, 0.04, 0.05, 0x4a4d4c, { x: x + s * (r + 0.05), y: y + h * 0.8, z }, M.tole);
  if (couvercle) tronc(c, M.tole, 0x7a7f7c, x, y + h + 0.02, z, r * 0.98, r * 0.98, 0.03, 9);
}

/** Le grand fourneau de fonte (piano de cuisine) : plaques, portes de four, barre de laiton. */
export function fourneau(c, x, z, ry, l = 2.4) {
  const M = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(l, 0.85, 1.0, 0x3c3f3e, { y: 0.425 }, M.tole, { nuance: 0.03 });
    c.boite(l + 0.06, 0.05, 1.06, 0x55595a, { y: 0.87 }, M.tole);
    for (let i = 0; i < Math.floor(l / 0.6); i++) {
      c.boite(0.5, 0.42, 0.03, 0x2c2e2d, { x: -l / 2 + 0.3 + i * 0.6, y: 0.4, z: 0.51 }, M.tole);
      c.boite(0.14, 0.03, 0.04, 0xb59048, { x: -l / 2 + 0.3 + i * 0.6, y: 0.55, z: 0.54 }, M.satin, { crasse: false });
    }
    c.boite(l, 0.03, 0.03, 0xb59048, { y: 0.78, z: 0.58 }, M.satin, { crasse: false });
    c.boite(0.4, 2.1, 0.4, 0x3c3f3e, { x: -l / 2 + 0.3, y: 1.9, z: -0.3 }, M.tole);
  });
}

/** Une étagère de bois à conserves : quelques boîtes encore pleines, beaucoup de vides. */
export function etagereConserves(c, x, z, ry, l, plein = 0.4) {
  const M = matieres();
  c.repere({ x, z, ry }, () => {
    for (const s of [-1, 1]) c.boite(0.05, 2.0, 0.4, COUL.bois, { x: (s * l) / 2, y: 1.0 }, M.mat);
    for (let k = 0; k < 4; k++) {
      const y = 0.3 + k * 0.5;
      c.boite(l, 0.03, 0.4, COUL.bois, { y }, M.mat, { nuance: 0.05 });
      for (let u = -l / 2 + 0.12; u < l / 2 - 0.1; u += 0.14) {
        if (c.hasard() > plein) continue;
        c.boite(0.09, 0.12, 0.09, [0xb5573f, 0xc9b68a, 0x8a9a6a, 0xd9c9a0][Math.floor(c.hasard() * 4)], { x: u, y: y + 0.075, z: c.entre(-0.08, 0.08) }, M.tole, { crasse: false, nuance: 0.05 });
      }
    }
  });
}

/** Un évier de grès (bac profond) sur ses jambages. */
export function evier(c, x, z, ry, l = 1.6) {
  const M = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(l, 0.3, 0.65, 0xd8d0bf, { y: 0.8 }, M.lisse);
    c.boite(l - 0.12, 0.02, 0.5, 0x8d8a80, { y: 0.96 }, M.lisse, { crasse: false });
    for (const s of [-1, 1]) c.boite(0.25, 0.65, 0.5, 0xb7ad9a, { x: (s * (l - 0.4)) / 2, y: 0.325 }, M.mat);
    c.tube([0, 0.95, -0.3], [0, 1.25, -0.3], 0.02, 0xb59048, M.tole, 5);
    c.tube([0, 1.25, -0.3], [0, 1.25, -0.12], 0.02, 0xb59048, M.tole, 5);
  });
}

/** Un brasero de survivants dans un demi-fût, des bûches de bois flotté, une gamelle. */
export function brasero(c, x, z) {
  const M = matieres();
  tronc(c, M.tole, COUL.rouille, x, 0.3, z, 0.32, 0.3, 0.6, 9);
  tronc(c, M.mat, 0x2a2624, x, 0.58, z, 0.29, 0.29, 0.04, 9);
  for (let i = 0; i < 4; i++) c.boite(0.6, 0.08, 0.08, COUL.boisGris, { x: x + c.entre(-0.1, 0.1), y: 0.64, z: z + c.entre(-0.1, 0.1), ry: i * 0.8, rz: 0.15 }, M.mat);
  c.boite(0.5, 0.03, 0.03, 0x4a4d4c, { x, y: 0.72, z }, M.tole);
  tronc(c, M.tole, 0x6f7472, x, 0.82, z, 0.12, 0.1, 0.16, 8);
  // le bois flotté de réserve
  for (let i = 0; i < 6; i++) cylindre(c, M.mat, COUL.boisGris, x + 0.9 + c.entre(-0.2, 0.2), 0.06 + (i % 3) * 0.1, z + c.entre(-0.4, 0.4), 0.05, c.entre(0.7, 1.2), 5, { rz: Math.PI / 2, ry: c.entre(-0.3, 0.3) });
}

/** Un matelas de survivant au sol, une couverture, un sac. */
export function couchage(c, x, z, ry, plaid) {
  const M = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(0.75, 0.12, 1.8, COUL.matelas, { y: 0.06 }, M.mat, { nuance: 0.05 });
    c.boite(0.8, 0.05, 1.1, plaid, { y: 0.14, z: 0.3, rz: 0.05 }, M.toile, { nuance: 0.05 });
    c.boite(0.35, 0.3, 0.25, 0x5f6448, { x: 0.6, y: 0.15, z: -0.7 }, M.mat);
  });
}

/** Une lanterne-tempête posée. */
export function lanterne(c, x, y, z) {
  const M = matieres();
  tronc(c, M.tole, 0x7a5a3c, x, y + 0.03, z, 0.09, 0.1, 0.06, 6);
  tronc(c, M.verre, 0xffe8b0, x, y + 0.16, z, 0.07, 0.07, 0.2, 6);
  tronc(c, M.tole, 0x7a5a3c, x, y + 0.29, z, 0.05, 0.09, 0.06, 6);
  c.boite(0.16, 0.012, 0.012, 0x4a4d4c, { x, y: y + 0.36, z }, M.tole);
}

/** Une caisse de bois. */
export function caisse(c, x, z, ry = 0, y = 0, s = 0.5) {
  const M = matieres();
  c.boite(s * 1.2, s * 0.8, s, 0x9c8a6a, { x, y: y + s * 0.4, z, ry }, M.mat, { nuance: 0.06 });
}

// ---------- Infirmerie et lingerie ----------

/** L'armoire à pharmacie vitrée (fer laqué blanc), bocaux. */
export function armoirePharmacie(c, x, z, ry, l = 1.2, bris = 0.5) {
  const M = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(l, 1.9, 0.42, 0xe4e0d4, { y: 0.95 }, M.satin);
    c.boite(l - 0.1, 1.2, 0.02, 0xffffff, { y: 1.3, z: 0.21 }, M.verre, { crasse: false });
    for (let k = 0; k < 3; k++) {
      const y = 0.85 + k * 0.38;
      c.boite(l - 0.08, 0.02, 0.36, 0xd8d4c6, { y }, M.satin, { crasse: false });
      for (let u = -l / 2 + 0.12; u < l / 2 - 0.1; u += 0.16) {
        if (c.hasard() < bris) continue;
        tronc(c, M.verre, [0xd9e8e0, 0x9a7a4a, 0x6f8f9a][Math.floor(c.hasard() * 3)], u, y + 0.09, c.entre(-0.06, 0.06), 0.05, 0.05, 0.16, 6, {}, { crasse: false });
      }
    }
    c.boite(0.04, 0.28, 0.03, 0xb7b2a4, { x: l / 2 - 0.1, y: 1.0, z: 0.22 }, M.satin);
  });
}

/** Le pèse-bébé émaillé sur sa console. */
export function peseBebe(c, x, z, ry = 0) {
  const M = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(0.8, 0.8, 0.5, 0xe4e0d4, { y: 0.4 }, M.satin);
    c.boite(0.6, 0.08, 0.36, 0xe9e6dc, { y: 0.88 }, M.lisse);
    c.boite(0.04, 0.4, 0.04, 0xb7b2a4, { x: 0.3, y: 1.1, z: -0.15 }, M.tole);
    c.boite(0.5, 0.04, 0.04, 0xb59048, { x: 0.05, y: 1.3, z: -0.15 }, M.tole);
  });
}

/** Un paravent de toile à trois feuilles. */
export function paravent(c, x, z, ry = 0, renverse = false) {
  const M = matieres();
  c.repere({ x, z, ry, y: renverse ? 0.05 : 0, rx: renverse ? -Math.PI / 2 : 0 }, () => {
    for (let i = -1; i <= 1; i++) {
      c.repere({ x: i * 0.6, z: i === 0 ? 0 : 0.12, ry: i * 0.35 }, () => {
        c.boite(0.56, 1.6, 0.02, 0xd9d5c6, { y: 1.0 }, M.toile, { nuance: 0.05 });
        c.boite(0.6, 0.03, 0.03, COUL.fer, { y: 1.8 }, M.satin);
        for (const s of [-1, 1]) c.boite(0.03, 1.8, 0.03, COUL.fer, { x: s * 0.29, y: 0.9 }, M.satin);
      });
    }
  });
}

/** Une étagère de lingerie : piles de draps et de couvertures pliés. */
export function etagereLinge(c, x, z, ry, l, plein = 0.7) {
  const M = matieres();
  c.repere({ x, z, ry }, () => {
    for (const s of [-1, 1]) c.boite(0.05, 2.2, 0.55, COUL.bois, { x: (s * l) / 2, y: 1.1 }, M.mat);
    c.boite(l, 2.2, 0.03, COUL.bois, { y: 1.1, z: -0.27 }, M.mat);
    for (let k = 0; k < 4; k++) {
      const y = 0.25 + k * 0.52;
      c.boite(l, 0.03, 0.55, COUL.bois, { y }, M.mat, { nuance: 0.04 });
      for (let u = -l / 2 + 0.3; u < l / 2 - 0.2; u += 0.5) {
        if (c.hasard() > plein) continue;
        const n = 2 + Math.floor(c.hasard() * 4);
        const t = c.hasard() < 0.5 ? COUL.draps : COUL.plaids[Math.floor(c.hasard() * COUL.plaids.length)];
        c.boite(0.42, n * 0.06, 0.4, t, { x: u, y: y + 0.015 + n * 0.03, z: 0.02, ry: c.entre(-0.08, 0.08) }, M.toile, { nuance: 0.04 });
      }
    }
  });
}

/**
 * Un portant de peignoirs brodés « ThalassoLuxe », chacun sous sa housse de plastique (le reflet passe par le verre).
 * `n` peignoirs le long de x local.
 */
export function portantPeignoirs(c, x, z, ry, n = 6, tombes = 1) {
  const M = matieres();
  const l = n * 0.32 + 0.3;
  c.repere({ x, z, ry }, () => {
    c.boite(l, 0.03, 0.03, 0xb7b2a4, { y: 1.7 }, M.tole);
    for (const s of [-1, 1]) {
      c.boite(0.03, 1.7, 0.03, 0xb7b2a4, { x: (s * l) / 2, y: 0.85 }, M.tole);
      c.boite(0.03, 0.03, 0.6, 0xb7b2a4, { x: (s * l) / 2, y: 0.02 }, M.tole);
    }
    for (let i = 0; i < n; i++) {
      const u = -l / 2 + 0.3 + i * 0.32;
      if (i < tombes) {
        c.boite(0.5, 0.06, 1.0, 0xf0ece2, { x: u + 0.2, y: 0.04, z: 0.5, ry: 0.4 }, M.toile, { nuance: 0.04 });
        c.boite(0.55, 0.02, 1.05, 0xffffff, { x: u + 0.2, y: 0.08, z: 0.5, ry: 0.4 }, M.verre, { crasse: false });
        continue;
      }
      c.boite(0.08, 1.05, 0.5, 0xf0ece2, { x: u, y: 1.12 }, M.toile, { nuance: 0.03, crasse: false });
      c.boite(0.02, 0.1, 0.1, 0x2f6f73, { x: u + 0.05, y: 1.35, z: 0.15 }, M.satin, { crasse: false });
      c.boite(0.13, 1.12, 0.56, 0xffffff, { x: u, y: 1.12 }, M.verre, { crasse: false });
    }
  });
}

/** Une machine à laver industrielle d'autrefois (tambour de cuivre dans un bâti de fonte). */
export function lessiveuse(c, x, z, ry = 0) {
  const M = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(1.3, 1.3, 1.1, 0x8a918c, { y: 0.65 }, M.tole, { nuance: 0.04 });
    cylindre(c, M.tole, 0xa77a4a, 0, 0.75, 0.56, 0.38, 0.06, 10, { rx: Math.PI / 2 });
    cylindre(c, M.verre, 0xffffff, 0, 0.75, 0.6, 0.3, 0.03, 10, { rx: Math.PI / 2 }, { crasse: false });
    c.boite(0.2, 0.1, 0.06, 0x2c2e2d, { x: 0.45, y: 1.15, z: 0.56 }, M.tole);
  });
}

/** Un panier de linge en osier. */
export function panier(c, x, z, renverse = false) {
  const M = matieres();
  tronc(c, M.mat, 0xb39b6c, x, renverse ? 0.25 : 0.22, z, 0.32, 0.26, 0.44, 8, renverse ? { rz: Math.PI / 2 } : {});
  if (!renverse) c.boite(0.5, 0.1, 0.5, COUL.draps, { x, y: 0.42, z, ry: 0.4 }, M.toile);
  else c.boite(0.8, 0.04, 0.6, COUL.draps, { x: x + 0.6, y: 0.03, z, ry: 0.3 }, M.toile);
}

// ---------- La chapelle ----------

/** Un banc d'enfants (bas, dossier). */
export function bancEnfants(c, x, z, l, ry = 0, renverse = false) {
  const M = matieres();
  c.repere({ x, z, ry, y: renverse ? 0.2 : 0, rx: renverse ? -Math.PI / 2 + 0.1 : 0 }, () => {
    c.boite(l, 0.04, 0.3, COUL.bois, { y: 0.36 }, M.mat, { nuance: 0.05 });
    c.boite(l, 0.3, 0.03, COUL.bois, { y: 0.62, z: 0.14 }, M.mat, { nuance: 0.05 });
    for (const s of [-1, 1]) c.boite(0.04, 0.78, 0.34, COUL.boisSombre, { x: (s * (l - 0.1)) / 2, y: 0.39, z: 0.02 }, M.mat);
  });
}

/** L'ex-voto : une maquette de trois-mâts suspendue à la voûte. */
export function exVoto(c, x, y, z, ry = 0) {
  const M = matieres();
  c.repere({ x, y, z, ry, rz: 0.08 }, () => {
    c.boite(1.3, 0.2, 0.3, 0x3a3532, { y: 0 }, M.satin);
    c.boite(1.1, 0.06, 0.24, 0xb5573f, { y: -0.1 }, M.satin);
    c.boite(0.3, 0.12, 0.26, 0x6a4f3a, { x: -0.5, y: 0.14 }, M.mat);
    for (const u of [-0.35, 0.05, 0.42]) {
      c.boite(0.02, 0.9, 0.02, COUL.boisSombre, { x: u, y: 0.55 }, M.mat);
      for (const v of [0.35, 0.65]) c.boite(0.02, 0.22, 0.26, 0xe8e2d2, { x: u + 0.02, y: v }, M.toile, { crasse: false });
    }
    // les fils qui la tiennent
    c.boite(0.01, 1.2, 0.01, 0x9a9488, { x: -0.4, y: 1.4 }, M.mat, { crasse: false });
    c.boite(0.01, 1.2, 0.01, 0x9a9488, { x: 0.4, y: 1.4 }, M.mat, { crasse: false });
  });
}

/** Une statue drapée (plâtre peint, bleu pâli), mains jointes, sur sa console. */
export function statue(c, x, y, z, ry = 0) {
  const M = matieres();
  c.repere({ x, y, z, ry }, () => {
    tronc(c, M.mat, 0xd8d4c8, 0, 0.55, 0, 0.14, 0.24, 1.1, 7);
    tronc(c, M.mat, 0x8fb1c4, 0, 0.75, -0.04, 0.17, 0.26, 1.3, 7);
    boule(c, M.mat, 0xe3d9c6, 0, 1.25, 0, 0.11);
    tronc(c, M.mat, 0x8fb1c4, 0, 1.27, -0.02, 0.12, 0.15, 0.25, 7);
    c.boite(0.08, 0.14, 0.06, 0xe3d9c6, { y: 1.0, z: 0.16 }, M.mat);
  });
}

/** Des cierges de toutes tailles sur un présentoir. */
export function cierges(c, x, y, z, n = 6) {
  const M = matieres();
  for (let i = 0; i < n; i++) cylindre(c, M.mat, 0xefe9d8, x + (i - n / 2) * 0.09, y + 0.06 + (i % 3) * 0.04, z + (i % 2) * 0.06, 0.02, 0.12 + (i % 3) * 0.08, 5, {}, { crasse: false });
}

// ---------- Les dunes ----------

const BRIN = new THREE.ConeGeometry(0.035, 0.75, 3).translate(0, 0.37, 0);

/** Une touffe d'oyats : des brins longs, raides et blonds, couchés par le vent d'ouest. */
export function oyats(c, x, z, y = 0, taille = 1) {
  const M = matieres();
  const n = 4;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + c.hasard();
    const e = taille * c.entre(0.7, 1.2);
    c.poser(BRIN, M.mat, c.hasard() < 0.55 ? COUL.oyat : COUL.oyatVert, { x: x + Math.cos(a) * 0.08, y: y - 0.05, z: z + Math.sin(a) * 0.08, rz: -0.35 + 0.25 * Math.cos(a), rx: 0.25 * Math.sin(a), e: [e, e * c.entre(0.8, 1.3), e] }, { nuance: 0.1, crasse: false });
  }
}

/** Une congère de sable (tas aplati) : le sable entré par les portes et les vitres. */
export function congere(c, x, z, rx, rz, h, y = 0, ry = 0) {
  const M = matieres();
  c.poser(geo("congere", () => new THREE.SphereGeometry(1, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2)), M.sable, COUL.sable, { x, y: y - 0.02, z, ry, e: [rx, h, rz] }, { crasse: false, nuance: 0.03 });
}

/** Un morceau de bois flotté, blanchi par le sel. */
export function boisFlotte(c, x, y, z, l, ry) {
  const M = matieres();
  cylindre(c, M.mat, COUL.boisGris, x, y + 0.07, z, 0.07, l, 5, { rz: Math.PI / 2, ry });
  if (l > 1.2) c.boite(0.5, 0.05, 0.05, COUL.boisGris, { x: x + Math.cos(ry) * l * 0.2, y: y + 0.15, z: z - Math.sin(ry) * l * 0.2, ry: ry + 0.8, rz: 0.3 }, M.mat);
}
