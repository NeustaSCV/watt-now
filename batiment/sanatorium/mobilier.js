// Le mobilier du sanatorium : chaises longues de cure, lits de fer, crachoirs émaillés, rayonnages de la
// bibliothèque, piano droit, gramophone, tables du réfectoire, poêle en fonte, appareil de radiologie, paravent…
// Et la nature qui revient : sapins, mélèzes dorés, plaques de neige à l'ombre.
// Chaque meuble est posé dans le repère du chantier `c` ; repère local : +z = face avant (vers le sud en général).

import * as THREE from "three";
import { COUL, R, matieres, panneau } from "./textures.js";

const GEO = {};

export function cylindre(r1, r2, h, cotes = 8, ouvert = false) {
  const cle = `cyl|${r1}|${r2}|${h}|${cotes}|${ouvert}`;
  if (!GEO[cle]) GEO[cle] = new THREE.CylinderGeometry(r1, r2, h, cotes, 1, ouvert);
  return GEO[cle];
}

const CONE = new THREE.ConeGeometry(1, 1, 7);
const PLAN = new THREE.PlaneGeometry(1, 1);
export const BOULE = new THREE.IcosahedronGeometry(1, 0);

/** Un plan unitaire (pour une vitre plate). */
export function plan() {
  return PLAN;
}

/** Un meuble éventuellement renversé : le repère est couché sur le flanc. */
function meuble(c, pose, renverse, poser, haut = 0.45) {
  c.repere(renverse ? { ...pose, y: (pose.y ?? 0) + haut * 0.55, rz: Math.PI / 2 - 0.1, rx: (pose.rx ?? 0) + 0.08 } : pose, poser);
}

// ---------- La galerie de cure ----------

/**
 * La chaise longue de cure en bois (dossier incliné, accoudoirs), pieds vers +z (face au vide).
 * Options : etat (« droite », « renversee », « pliee »), plaid (couleur), casque (réalité virtuelle), simple (lointaine).
 */
export function chaiseLongue(c, x, z, ry = 0, o = {}) {
  const m = matieres();
  const { y = 0, etat = "droite", plaid = null, casque = false, simple = false, teinte = COUL.chaise } = o;
  if (etat === "pliee") {
    c.boite(0.62, 0.1, 1.5, teinte, { x, y: y + 0.05, z, ry }, m.mat, { nuance: 0.06 });
    return;
  }
  const pose = etat === "renversee" ? { x, y: y + 0.33, z, ry, rz: 1.5 } : { x, y, z, ry };
  const yb = etat === "renversee" ? -0.33 : 0;
  c.repere(pose, () => {
    if (!simple) for (const s of [-1, 1]) c.boite(0.05, 0.07, 1.8, teinte, { x: s * 0.29, y: yb + 0.33, z: 0.1 }, m.mat, { nuance: 0.05 });
    c.boite(0.64, 0.32, 0.05, teinte, { y: yb + 0.16, z: 0.88 }, m.mat, { nuance: 0.05 });
    c.boite(0.64, 0.32, 0.05, teinte, { y: yb + 0.16, z: -0.6 }, m.mat, { nuance: 0.05 });
    c.boite(0.56, 0.04, 1.15, simple ? teinte : COUL.toile, { y: yb + 0.38, z: 0.35, rx: -0.05 }, simple ? m.mat : m.toile, { nuance: 0.07 });
    c.boite(0.56, 0.04, 0.82, teinte, { y: yb + 0.66, z: -0.47, rx: 0.85 }, m.mat, { nuance: 0.05 });
    if (!simple) {
      for (const s of [-1, 1]) {
        c.boite(0.05, 0.04, 0.62, teinte, { x: s * 0.31, y: yb + 0.6, z: -0.08 }, m.mat);
        c.boite(0.04, 0.25, 0.04, teinte, { x: s * 0.31, y: yb + 0.47, z: 0.2 }, m.mat);
      }
    }
    if (plaid != null) {
      c.boite(0.62, 0.05, 1.0, plaid, { y: yb + 0.43, z: 0.42, rx: -0.05 }, m.toile, { nuance: 0.08, crasse: false });
      if (!simple) c.boite(0.03, 0.34, 0.9, plaid, { x: 0.34, y: yb + 0.28, z: 0.42, rz: -0.12 }, m.toile, { nuance: 0.08 });
    }
    if (casque) {
      c.boite(0.21, 0.1, 0.12, COUL.noir, { y: yb + 0.93, z: -0.66, rx: 0.85 }, m.lisse, { crasse: false });
      c.boite(0.17, 0.035, 0.02, COUL.canard, { y: yb + 0.95, z: -0.59, rx: 0.85 }, m.lisse, { crasse: false });
    }
  });
}

/** Un guéridon de galerie (plateau rond sur pied). */
export function gueridon(c, x, z, renverse = false) {
  const m = matieres();
  meuble(c, { x, z }, renverse, () => {
    c.poser(cylindre(0.28, 0.28, 0.03, 8), m.satin, COUL.boisClair, { y: 0.6 });
    c.poser(cylindre(0.03, 0.03, 0.6, 5), m.tole, COUL.fer, { y: 0.3 });
    c.poser(cylindre(0.18, 0.2, 0.03, 6), m.tole, COUL.fer, { y: 0.015 });
  }, 0.3);
}

/** La lanterne des survivants (tempête, verre et tôle). */
export function lanterne(c, x, y, z) {
  const m = matieres();
  c.poser(cylindre(0.08, 0.09, 0.04, 6), m.tole, 0x6a5232, { x, y: y + 0.02, z });
  c.poser(cylindre(0.065, 0.065, 0.16, 6), m.verre, 0xffffff, { x, y: y + 0.12, z }, { crasse: false });
  c.poser(cylindre(0.03, 0.08, 0.06, 6), m.tole, 0x6a5232, { x, y: y + 0.23, z });
  c.boite(0.02, 0.12, 0.13, 0x6a5232, { x, y: y + 0.32, z }, m.tole);
}

/** Des bûches empilées (réserve de bois) : `l` le long de x local, `rangs` de haut, bûches de 0,5 m selon z. */
export function buches(c, x, z, ry, l, rangs) {
  const m = matieres();
  c.repere({ x, z, ry }, () => {
    for (let r = 0; r < rangs; r++) {
      const n = Math.floor(l / 0.2) - (r % 2);
      for (let i = 0; i < n; i++) {
        if (c.hasard() < 0.06) continue;
        const xx = -l / 2 + 0.1 + i * 0.2 + (r % 2) * 0.1;
        c.poser(cylindre(0.085, 0.085, 0.5, 5), m.mat, c.hasard() < 0.5 ? 0x7d6347 : 0x6a5038, { x: xx, y: 0.09 + r * 0.16, z: c.entre(-0.04, 0.04), rx: Math.PI / 2 }, { nuance: 0.1 });
      }
    }
  });
}

// ---------- Les chambres ----------

/** Un lit de fer de sanatorium, tête vers −z local. */
export function litFer(c, x, z, ry = 0, o = {}) {
  const m = matieres();
  const { matelas = 0xbdb39a, couverture = null, effondre = false } = o;
  c.repere({ x, z, ry }, () => {
    for (const [zz, hh] of [[-1, 1.05], [1, 0.75]]) {
      for (const s of [-1, 1]) c.tube([s * 0.45, 0, zz], [s * 0.45, hh, zz], 0.022, COUL.fer, m.tole, 5);
      c.tube([-0.45, hh - 0.03, zz], [0.45, hh - 0.03, zz], 0.018, COUL.fer, m.tole, 5);
      c.boite(0.9, 0.025, 0.02, COUL.fer, { y: 0.42, z: zz }, m.tole);
      for (const xx of [-0.22, 0, 0.22]) c.boite(0.015, hh - 0.45, 0.015, COUL.fer, { x: xx, y: 0.42 + (hh - 0.45) / 2, z: zz }, m.tole);
    }
    const yS = effondre ? 0.14 : 0.42;
    c.boite(0.9, 0.04, 1.96, 0x6d6a62, { y: yS, rx: effondre ? 0.12 : 0 }, m.tole);
    if (matelas != null) c.boite(0.84, 0.14, 1.88, matelas, { y: yS + 0.1, rx: effondre ? 0.12 : 0 }, m.toile, { nuance: 0.06 });
    if (couverture != null) c.boite(0.95, 0.05, 1.25, couverture, { y: yS + 0.2, z: 0.3, rz: 0.03 }, m.toile, { nuance: 0.08, crasse: false });
  });
}

/** La table de nuit de métal émaillé. */
export function tableNuit(c, x, z, ry = 0) {
  const m = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(0.44, 0.62, 0.4, COUL.email, { y: 0.33 }, m.satin, { nuance: 0.05 });
    c.boite(0.48, 0.03, 0.44, 0xd8d5cb, { y: 0.66 }, m.satin);
    c.boite(0.36, 0.14, 0.02, 0xcfcbc0, { y: 0.52, z: 0.205 }, m.satin);
  });
}

/** Le crachoir émaillé (blanc, filet bleu), posé à `y`. */
export function crachoir(c, x, y, z) {
  const m = matieres();
  c.poser(cylindre(0.1, 0.075, 0.12, 8), m.lisse, COUL.email, { x, y: y + 0.06, z });
  c.poser(cylindre(0.105, 0.105, 0.02, 8), m.lisse, COUL.emailBleu, { x, y: y + 0.125, z });
}

/** Une armoire de bois (portes, corniche) ; renversée : couchée face au sol. */
export function armoire(c, x, z, ry = 0, renverse = false) {
  const m = matieres();
  c.repere(renverse ? { x, z, ry, y: 0.3, rx: -Math.PI / 2 + 0.05 } : { x, z, ry }, () => {
    const y0 = renverse ? -0.28 : 0;
    c.boite(1.0, 1.95, 0.52, COUL.boisSombre, { y: y0 + 0.975 }, m.satin, { nuance: 0.05 });
    c.boite(1.08, 0.08, 0.58, COUL.boisSombre, { y: y0 + 1.98 }, m.satin);
    c.boite(0.02, 1.7, 0.02, 0x2e2018, { y: y0 + 1.0, z: 0.27 }, m.satin);
  });
}

/** Une chaise cintrée (bistrot), renversée ou non. */
export function chaise(c, x, z, ry = 0, renverse = false, teinte = COUL.boisSombre) {
  const m = matieres();
  meuble(c, { x, z, ry }, renverse, () => {
    c.boite(0.42, 0.04, 0.42, teinte, { y: 0.46 }, m.satin, { nuance: 0.06 });
    c.boite(0.42, 0.42, 0.03, teinte, { y: 0.7, z: -0.2 }, m.satin, { nuance: 0.06 });
    for (const s of [-1, 1]) c.boite(0.03, 0.46, 0.38, teinte, { x: s * 0.19, y: 0.23 }, m.satin);
  });
}

/** Un fauteuil de rotin de cure. */
export function fauteuil(c, x, z, ry = 0, renverse = false) {
  const m = matieres();
  meuble(c, { x, z, ry }, renverse, () => {
    c.boite(0.7, 0.38, 0.66, COUL.rotin, { y: 0.19 }, m.mat, { nuance: 0.06 });
    c.boite(0.62, 0.08, 0.56, 0x8a6f5a, { y: 0.42, z: 0.04 }, m.toile, { nuance: 0.08 });
    c.boite(0.7, 0.6, 0.1, COUL.rotin, { y: 0.66, z: -0.3, rx: -0.15 }, m.mat, { nuance: 0.06 });
    for (const s of [-1, 1]) c.boite(0.1, 0.28, 0.6, COUL.rotin, { x: s * 0.34, y: 0.52 }, m.mat);
  }, 0.5);
}

// ---------- La bibliothèque, le salon de musique ----------

/** Un rayonnage de livres (dos des livres en atlas), contre un mur ; face vers +z local. */
export function rayonnage(c, x, z, ry, l, renverse = false) {
  const m = matieres();
  const pose = renverse ? { x, z, ry, y: 0.2, rx: -Math.PI / 2 + 0.25 } : { x, z, ry };
  c.repere(pose, () => {
    const y0 = renverse ? -0.2 : 0;
    c.boite(l, 2.3, 0.4, COUL.boisSombre, { y: y0 + 1.15, z: -0.02 }, m.satin, { nuance: 0.04 });
    for (const yy of [0.05, 1.15, 2.25]) c.boite(l + 0.04, 0.05, 0.44, 0x5a4130, { y: y0 + yy }, m.satin);
    for (const [yy, hh] of [[0.6, 1.08], [1.7, 1.08]]) panneau(c, m.enseignes, R.livres, { y: y0 + yy, z: 0.185 }, l - 0.08, hh);
  });
}

/** Des livres tombés, éparpillés au sol. */
export function livresAuSol(c, x1, z1, x2, z2, n) {
  const m = matieres();
  const tons = [0x7a2f2c, 0x3f5a3c, 0x8d6a32, 0x2f3f5a, 0x6b4a33, 0xb8a986, 0x5a2f45];
  for (let i = 0; i < n; i++) {
    const t = tons[Math.floor(c.hasard() * tons.length)];
    const ouvert = c.hasard() < 0.3;
    c.boite(ouvert ? 0.3 : 0.16, 0.035, 0.22, ouvert ? 0xe0d8c2 : t, { x: c.entre(x1, x2), y: 0.02 + (c.hasard() < 0.2 ? 0.035 : 0), z: c.entre(z1, z2), ry: c.hasard() * 3 }, m.satin, { nuance: 0.1, crasse: false });
  }
}

/** Le piano droit (face vers +z local), son tabouret, une partition. */
export function piano(c, x, z, ry = 0) {
  const m = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(1.48, 1.28, 0.56, 0x3a2a20, { y: 0.64 }, m.satin, { nuance: 0.03 });
    c.boite(1.52, 0.05, 0.6, 0x3a2a20, { y: 1.3 }, m.satin);
    c.boite(1.4, 0.1, 0.26, 0x3a2a20, { y: 0.74, z: 0.38 }, m.satin);
    c.boite(1.22, 0.025, 0.15, 0xe8e2cf, { y: 0.8, z: 0.42 }, m.lisse, { crasse: false });
    for (let i = 0; i < 22; i++) {
      if ([2, 6, 9, 13, 16, 20].includes(i)) continue;
      c.boite(0.025, 0.02, 0.08, 0x1c1a19, { x: -0.58 + i * 0.054, y: 0.82, z: 0.39 }, m.lisse, { crasse: false });
    }
    for (const s of [-1, 1]) c.boite(0.08, 0.74, 0.08, 0x3a2a20, { x: s * 0.68, y: 0.37, z: 0.4 }, m.satin);
    c.boite(0.4, 0.28, 0.02, 0xe2dccb, { y: 1.02, z: 0.3, rx: -0.2 }, m.mat, { crasse: false });
    c.boite(0.6, 0.06, 0.34, 0x3a2a20, { y: 0.5, z: 0.95 }, m.satin);
    for (const s of [-1, 1]) c.boite(0.05, 0.48, 0.3, 0x3a2a20, { x: s * 0.26, y: 0.24, z: 0.95 }, m.satin);
  });
}

/** Le gramophone et son pavillon de laiton, sur son meuble. */
export function gramophone(c, x, z, ry = 0) {
  const m = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(0.5, 0.8, 0.45, COUL.bois, { y: 0.4 }, m.satin);
    c.boite(0.38, 0.12, 0.38, COUL.boisSombre, { y: 0.86 }, m.satin);
    c.poser(cylindre(0.16, 0.16, 0.01, 10), m.lisse, 0x1a1a1a, { y: 0.93 }, { crasse: false });
    c.tube([0.12, 0.94, -0.12], [0.1, 1.15, -0.1], 0.02, 0xb59048, m.metal, 5);
    c.poser(cylindre(0.3, 0.025, 0.55, 10, true), m.metal, 0xb59048, { x: 0.1, y: 1.35, z: 0.05, rx: 0.9 });
  });
}

/** Un pupitre à musique (tombé ou debout). */
export function pupitre(c, x, z, ry = 0, tombe = false) {
  const m = matieres();
  c.repere(tombe ? { x, z, ry, y: 0.04, rx: Math.PI / 2 - 0.1 } : { x, z, ry }, () => {
    c.tube([0, 0, 0], [0, 1.1, 0], 0.015, COUL.fer, m.tole, 4);
    c.boite(0.5, 0.34, 0.02, COUL.fer, { y: 1.22, z: 0.02, rx: -0.3 }, m.tole);
    c.boite(0.36, 0.02, 0.36, COUL.fer, { y: 0.02 }, m.tole);
  });
}

// ---------- Le réfectoire ----------

/** Une longue table de réfectoire (le long de x local) sur deux tréteaux. */
export function tableLongue(c, x, z, l, renverse = false) {
  const m = matieres();
  meuble(c, { x, z }, renverse, () => {
    c.boite(l, 0.05, 0.9, COUL.boisClair, { y: 0.76 }, m.satin, { nuance: 0.04 });
    for (const s of [-1, 1]) c.boite(0.08, 0.74, 0.7, COUL.bois, { x: s * (l / 2 - 0.3), y: 0.37 }, m.satin);
    c.boite(l - 0.6, 0.06, 0.06, COUL.bois, { y: 0.3 }, m.satin);
  }, 0.8);
}

/** Un banc (le long de x local). */
export function banc(c, x, z, l, ry = 0, renverse = false) {
  const m = matieres();
  meuble(c, { x, z, ry }, renverse, () => {
    c.boite(l, 0.05, 0.3, COUL.boisClair, { y: 0.45 }, m.satin, { nuance: 0.05 });
    for (const s of [-1, 1]) c.boite(0.05, 0.43, 0.28, COUL.bois, { x: s * (l / 2 - 0.2), y: 0.215 }, m.satin);
  }, 0.3);
}

/** De la vaisselle émaillée (assiettes, gobelets, brocs) semée sur une table, à la hauteur `y`. */
export function vaisselle(c, x1, z1, x2, z2, n, y = 0.79) {
  const m = matieres();
  for (let i = 0; i < n; i++) {
    const x = c.entre(x1, x2);
    const z = c.entre(z1, z2);
    const r = c.hasard();
    if (r < 0.5) c.poser(cylindre(0.12, 0.09, 0.025, 8), m.lisse, COUL.email, { x, y: y + 0.013, z });
    else if (r < 0.85) {
      c.poser(cylindre(0.045, 0.045, 0.09, 6), m.lisse, c.hasard() < 0.5 ? COUL.emailBleu : COUL.email, { x, y: y + 0.045, z });
    } else c.poser(cylindre(0.07, 0.09, 0.22, 7), m.lisse, COUL.email, { x, y: y + 0.11, z });
  }
}

/** Le poêle en fonte (rallumé par des survivants), son tuyau qui monte au plafond. */
export function poele(c, x, z, hautTuyau) {
  const m = matieres();
  c.repere({ x, z }, () => {
    for (const [dx, dz] of [[0.22, 0.22], [-0.22, 0.22], [0.22, -0.22], [-0.22, -0.22]]) c.boite(0.05, 0.16, 0.05, COUL.fonte, { x: dx, y: 0.08, z: dz }, m.tole);
    c.poser(cylindre(0.34, 0.34, 0.85, 8), m.tole, COUL.fonte, { y: 0.58 });
    c.poser(cylindre(0.4, 0.4, 0.05, 8), m.tole, 0x2e3130, { y: 1.03 });
    c.boite(0.26, 0.26, 0.04, 0x2e3130, { y: 0.55, z: 0.34 }, m.tole);
    c.boite(0.16, 0.06, 0.02, 0xd9662a, { y: 0.47, z: 0.365 }, m.lisse, { crasse: false });
    c.tube([0, 1.05, 0], [0, hautTuyau, 0], 0.07, 0x3a3634, m.tole, 6);
    c.poser(cylindre(0.16, 0.13, 0.14, 7), m.metal, 0x8d8a82, { x: 0.12, y: 1.13, z: 0.05 });
  });
}

// ---------- La radiologie, la pharmacie ----------

/** L'appareil de radiographie : colonne, bras, tube à rayons X au-dessus de la table d'examen. */
export function appareilRX(c, x, z, ry = 0) {
  const m = matieres();
  const creme = 0xd9d4c5;
  c.repere({ x, z, ry }, () => {
    c.boite(0.7, 0.08, 0.7, 0x5d5f5c, { y: 0.04 }, m.tole);
    c.boite(0.2, 2.5, 0.2, creme, { y: 1.29 }, m.satin);
    c.boite(1.15, 0.16, 0.18, creme, { x: 0.55, y: 1.85 }, m.satin);
    c.poser(cylindre(0.17, 0.17, 0.5, 8), m.satin, 0x8d8f86, { x: 1.1, y: 1.66, rx: Math.PI / 2 });
    c.boite(0.3, 0.22, 0.3, creme, { x: 1.1, y: 1.45 }, m.satin);
    c.boite(0.72, 0.08, 2.0, 0x4e5654, { x: 1.1, y: 0.86 }, m.satin);
    c.boite(0.5, 0.8, 0.6, creme, { x: 1.1, y: 0.42 }, m.satin);
    c.boite(0.6, 0.06, 1.6, 0xd6d2c4, { x: 1.1, y: 0.92 }, m.toile, { crasse: false });
  });
}

/** Le pupitre de commande à cadrans. */
export function pupitreRX(c, x, z, ry = 0) {
  const m = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(1.1, 0.95, 0.5, 0x7b827c, { y: 0.475 }, m.tole);
    c.boite(1.1, 0.06, 0.45, 0x5d625d, { y: 1.0, z: 0.03, rx: 0.35 }, m.tole);
    for (let i = 0; i < 4; i++) c.poser(cylindre(0.06, 0.06, 0.02, 8), m.lisse, 0xe6e2d4, { x: -0.36 + i * 0.24, y: 1.04, z: 0.06, rx: 0.35 + Math.PI / 2 }, { crasse: false });
  });
}

/** Un paravent à trois volets (toile sur cadres de tube), plié en zigzag. */
export function paravent(c, x, z, ry = 0, renverse = false) {
  const m = matieres();
  c.repere(renverse ? { x, z, ry, y: 0.05, rx: -Math.PI / 2 + 0.05 } : { x, z, ry }, () => {
    for (let i = 0; i < 3; i++) {
      const ang = i % 2 ? -0.5 : 0.5;
      c.repere({ x: -0.6 + i * 0.6, ry: ang }, () => {
        c.boite(0.58, 1.7, 0.02, 0xd8d2c0, { y: 1.0 }, m.toile, { nuance: 0.05 });
        c.boite(0.6, 0.03, 0.03, COUL.fer, { y: 1.86 }, m.tole);
        for (const s of [-1, 1]) c.boite(0.025, 1.85, 0.025, COUL.fer, { x: s * 0.29, y: 0.925 }, m.tole);
      });
    }
  });
}

/** L'armoire à pharmacie vitrée, flacons sur les rayons (face vers +z local). */
export function armoirePharmacie(c, x, z, ry, l, bris = 0.5) {
  const m = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(l, 2.1, 0.45, COUL.email, { y: 1.05, z: -0.02 }, m.satin, { nuance: 0.03 });
    for (const yy of [0.5, 0.95, 1.4, 1.85]) {
      c.boite(l - 0.1, 0.03, 0.4, 0xd5d2c8, { y: yy }, m.satin);
      const n = Math.floor(l * 6);
      for (let i = 0; i < n; i++) {
        if (c.hasard() < 0.35) continue;
        const t = [0x6a4a2a, 0x3b5a7a, 0xd8d6cc, 0x4f6a4a][Math.floor(c.hasard() * 4)];
        c.poser(cylindre(0.035, 0.035, 0.13 + c.hasard() * 0.08, 5), m.lisse, t, { x: -l / 2 + 0.12 + i * ((l - 0.24) / n), y: yy + 0.09, z: c.entre(-0.08, 0.08) }, { crasse: false });
      }
    }
    if (c.hasard() > bris) c.boite(l - 0.1, 1.8, 0.01, 0xffffff, { y: 1.12, z: 0.21 }, m.verre, { crasse: false });
    else c.boite(l * 0.4, 0.5, 0.01, 0xffffff, { x: -l * 0.25, y: 0.5, z: 0.21 }, m.verre, { crasse: false });
  });
}

/** La balance médicale à colonne (pesée hebdomadaire des curistes). */
export function balance(c, x, z, ry = 0) {
  const m = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(0.45, 0.08, 0.55, 0x6d706c, { y: 0.04 }, m.tole);
    c.tube([0, 0.08, -0.22], [0, 1.45, -0.22], 0.03, 0xd9d4c5, m.satin, 6);
    c.boite(0.5, 0.06, 0.06, 0xb59048, { y: 1.3, z: -0.22 }, m.metal);
    c.boite(0.2, 0.2, 0.08, 0xd9d4c5, { y: 1.48, z: -0.22 }, m.satin);
  });
}

// ---------- La nature qui revient ----------

/** Un sapin : tronc, trois ou quatre étages de cônes à facettes. */
export function sapin(c, x, z, h, y = 0, tons = COUL.sapins) {
  const m = matieres();
  c.tube([x, y - 0.1, z], [x, y + h * 0.3, z], h * 0.022 + 0.03, 0x4e3b2a, m.mat, 5);
  const etages = h > 4 ? 4 : 3;
  for (let i = 0; i < etages; i++) {
    const t = i / etages;
    const rr = h * 0.25 * (1 - t * 0.62);
    const hh = h * (0.46 - t * 0.12);
    const yy = y + h * (0.16 + t * 0.6);
    c.poser(CONE, m.mat, tons[(i + Math.floor(c.hasard() * 4)) % tons.length], { x, y: yy + hh / 2, z, ry: c.hasard() * 3, e: [rr, hh, rr] }, { nuance: 0.06, crasse: false });
  }
}

/** Un mélèze : plus élancé, plus clair, doré à l'automne. */
export function meleze(c, x, z, h, y = 0) {
  const m = matieres();
  c.tube([x, y - 0.1, z], [x, y + h * 0.45, z], h * 0.02 + 0.03, 0x5c4432, m.mat, 5);
  const ton = COUL.melezes[Math.floor(c.hasard() * COUL.melezes.length)];
  for (let i = 0; i < 3; i++) {
    const t = i / 3;
    const rr = h * 0.17 * (1 - t * 0.55);
    const hh = h * (0.44 - t * 0.1);
    c.poser(CONE, m.mat, ton, { x, y: y + h * (0.22 + t * 0.55) + hh / 2, z, ry: c.hasard() * 3, e: [rr, hh, rr] }, { nuance: 0.08, crasse: false });
  }
}

/**
 * Une plaque de neige résiduelle (à l'ombre) : un disque irrégulier qui épouse le sol `sol(x, z)`.
 */
export function plaqueNeige(c, x, z, r, sol = () => 0) {
  const m = matieres();
  const n = 9;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * c.entre(0.55, 1.1);
    pts.push([x + Math.cos(a) * rr * 1.3, z + Math.sin(a) * rr]);
  }
  const pos = [];
  const yc = sol(x, z) + 0.05;
  for (let i = 0; i < n; i++) {
    const [x1, z1] = pts[i];
    const [x2, z2] = pts[(i + 1) % n];
    pos.push(x, yc, z, x2, sol(x2, z2) + 0.035, z2, x1, sol(x1, z1) + 0.035, z1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  c.poser(g, m.mat, COUL.neige, {}, { nuance: 0.03, crasse: false });
  g.dispose();
}
