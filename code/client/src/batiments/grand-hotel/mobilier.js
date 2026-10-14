// Le mobilier du Grand Hôtel des Flots : tables nappées, chaises bistrot, lustres de cristal, fauteuils club,
// lit à baldaquin, baignoire à pieds de lion, chariot à bagages en laiton, transats et parasols délavés…
// Chaque meuble est posé dans le repère du chantier `c` ; repère local : +z = face avant.

import * as THREE from "three";
import { PALETTE } from "../commun/atelier.js";
import { COUL, R, matieres, panneau, uvAtlas } from "./textures.js";

const GEO = {};

export function cylindre(r1, r2, h, cotes = 8, ouvert = false) {
  const cle = `cyl|${r1}|${r2}|${h}|${cotes}|${ouvert}`;
  if (!GEO[cle]) GEO[cle] = new THREE.CylinderGeometry(r1, r2, h, cotes, 1, ouvert);
  return GEO[cle];
}

export function geoTriangle(l, h, ep) {
  const cle = `tri|${l}|${h}|${ep}`;
  if (!GEO[cle]) {
    const s = new THREE.Shape([new THREE.Vector2(-l / 2, 0), new THREE.Vector2(l / 2, 0), new THREE.Vector2(0, h)]);
    GEO[cle] = new THREE.ExtrudeGeometry(s, { depth: ep, bevelEnabled: false }).translate(0, 0, -ep / 2);
  }
  return GEO[cle];
}

const CRISTAL = new THREE.OctahedronGeometry(0.06, 0);
const BOULE = new THREE.IcosahedronGeometry(1, 0);
const BOULE1 = new THREE.IcosahedronGeometry(1, 1);

/** Un meuble éventuellement renversé : le repère est couché sur le flanc. */
function meuble(c, pose, renverse, poser, haut = 0.45) {
  c.repere(renverse ? { ...pose, y: (pose.y ?? 0) + haut * 0.55, rz: Math.PI / 2 - 0.12, rx: (pose.rx ?? 0) + 0.1 } : pose, poser);
}

// ---------- Salle à manger, terrasse ----------

/** Une chaise bistrot cintrée (assise canée, dossier en arceau). */
export function chaise(c, x, z, ry = 0, renverse = false, y = 0, teinte = COUL.boisSombre) {
  const m = matieres();
  meuble(c, { x, y, z, ry }, renverse, () => {
    c.boite(0.4, 0.04, 0.38, 0xb39a6c, { y: 0.46 }, m.mat, { nuance: 0.06 });
    for (const [sx, sz] of [[-0.16, 0.15], [0.16, 0.15], [-0.15, -0.15], [0.15, -0.15]]) c.boite(0.035, 0.46, 0.035, teinte, { x: sx, y: 0.23, z: sz }, m.satin);
    c.boite(0.36, 0.5, 0.035, teinte, { y: 0.72, z: -0.18, rx: -0.12 }, m.satin);
  });
}

/** Une table ronde à pied central, nappée ou non. */
export function tableRonde(c, x, z, r = 0.55, nappe = true, renverse = false, y = 0) {
  const m = matieres();
  meuble(c, { x, y, z }, renverse, () => {
    c.boite(0.5, 0.05, 0.5, COUL.fonte, { y: 0.03 }, m.tole);
    c.tube([0, 0, 0], [0, 0.72, 0], 0.05, COUL.fonte, m.tole, 6);
    c.poser(cylindre(r, r, 0.04, 12), m.mat, COUL.boisSombre, { y: 0.74 });
    if (nappe) c.poser(cylindre(r + 0.06, r + 0.16, 0.36, 12), m.mat, COUL.nappe, { y: 0.605 }, { nuance: 0.05, crasse: false });
  }, 0.75);
}

/** Une table de terrasse en fonte, plateau de marbre. */
export function gueridon(c, x, z, renverse = false) {
  const m = matieres();
  meuble(c, { x, z }, renverse, () => {
    c.poser(cylindre(0.22, 0.26, 0.05, 8), m.tole, COUL.fonte, { y: 0.03 });
    c.tube([0, 0, 0], [0, 0.7, 0], 0.035, COUL.fonte, m.tole, 5);
    c.poser(cylindre(0.36, 0.36, 0.04, 10), m.lisse, COUL.marbre, { y: 0.72 }, { nuance: 0.05 });
  }, 0.72);
}

/** Un lustre à pampilles : `etat` « pendu » (y = hauteur du lustre, chaîne jusqu'au plafond `plafond`) ou « tombe ». */
export function lustre(c, x, z, etat = "pendu", y = 3.4, plafond = 4.8, r = 0.7) {
  const m = matieres();
  const pose = etat === "tombe" ? { x, y: 0.3, z, rx: 0.45, rz: -0.3, ry: c.hasard() * 3 } : { x, y, z };
  if (etat === "pendu") c.tube([x, y + 0.5, z], [x, plafond, z], 0.02, COUL.laiton, m.metal, 4);
  c.repere(pose, () => {
    c.poser(new THREE.TorusGeometry(r, 0.035, 4, 12).rotateX(Math.PI / 2), m.metal, COUL.laiton, {}, { crasse: false });
    c.tube([0, -0.3, 0], [0, 0.55, 0], 0.05, COUL.laiton, m.metal, 6);
    c.poser(BOULE, m.metal, COUL.laiton, { y: -0.32, e: 0.1 });
    const n = 6;
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      c.tube([0, 0.3, 0], [Math.cos(t) * r, 0.05, Math.sin(t) * r], 0.018, COUL.laiton, m.metal, 4);
      c.boite(0.035, 0.12, 0.035, 0xefe8d8, { x: Math.cos(t) * r, y: 0.1, z: Math.sin(t) * r }, m.mat, { crasse: false });
      if (c.hasard() < (etat === "tombe" ? 0.4 : 0.8)) c.poser(CRISTAL, m.lisse, 0xf2f4f2, { x: Math.cos(t + 0.3) * r * 0.9, y: -0.12, z: Math.sin(t + 0.3) * r * 0.9, e: [0.6, 1.4, 0.6] }, { crasse: false, nuance: 0 });
    }
    for (let i = 0; i < 5; i++) {
      const t = (i / 5) * Math.PI * 2;
      if (c.hasard() < 0.75) c.poser(CRISTAL, m.lisse, 0xf2f4f2, { x: Math.cos(t) * r * 0.45, y: -0.25, z: Math.sin(t) * r * 0.45, e: [0.7, 1.8, 0.7] }, { crasse: false, nuance: 0 });
    }
  });
  if (etat === "tombe") {
    // pampilles éparpillées, la chaîne arrachée
    for (let i = 0; i < 14; i++) {
      const a = c.hasard() * Math.PI * 2;
      const d = 0.6 + c.hasard() * 1.6;
      c.poser(CRISTAL, m.lisse, 0xf2f4f2, { x: x + Math.cos(a) * d, y: 0.04, z: z + Math.sin(a) * d, rx: c.hasard() * 3, rz: c.hasard() * 3, e: 0.8 }, { crasse: false, nuance: 0 });
    }
    c.tube([x + 0.2, 0.05, z], [x + 1.6, 0.05, z + 0.4], 0.02, COUL.laiton, m.metal, 4);
  }
}

/** Un fauteuil club (cuir craquelé). */
export function fauteuil(c, x, z, ry = 0, teinte = 0x6e4232, renverse = false) {
  const m = matieres();
  meuble(c, { x, z, ry }, renverse, () => {
    c.boite(0.85, 0.36, 0.8, teinte, { y: 0.22 }, m.satin, { nuance: 0.05 });
    c.boite(0.85, 0.5, 0.2, teinte, { y: 0.62, z: -0.32, rx: -0.1 }, m.satin, { nuance: 0.05 });
    for (const s of [-1, 1]) c.boite(0.18, 0.28, 0.8, teinte, { x: s * 0.36, y: 0.5 }, m.satin, { nuance: 0.05 });
    c.boite(0.55, 0.1, 0.55, teinte, { y: 0.44, z: 0.06 }, m.satin, { nuance: 0.08 });
  }, 0.8);
}

/** Un canapé capitonné. */
export function canape(c, x, z, ry = 0, teinte = COUL.veloursVert, l = 2.1) {
  const m = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(l, 0.38, 0.85, teinte, { y: 0.24 }, m.mat, { nuance: 0.04 });
    c.boite(l, 0.55, 0.2, teinte, { y: 0.68, z: -0.33, rx: -0.12 }, m.mat, { nuance: 0.04 });
    for (const s of [-1, 1]) c.boite(0.2, 0.35, 0.85, teinte, { x: s * (l / 2 - 0.1), y: 0.55 }, m.mat, { nuance: 0.04 });
    for (const s of [-1, 1]) c.boite(l / 2 - 0.25, 0.1, 0.6, teinte, { x: s * (l / 4 - 0.02), y: 0.47, z: 0.06 }, m.mat, { nuance: 0.1 });
  });
}

/** Un piano à queue, le couvercle levé (ou effondré sur un pied cassé). */
export function piano(c, x, z, ry = 0, casse = false) {
  const m = matieres();
  c.repere({ x, z, ry, rz: casse ? 0.12 : 0, y: casse ? -0.05 : 0 }, () => {
    const s = new THREE.Shape();
    s.moveTo(-0.75, 0);
    s.lineTo(0.75, 0);
    s.lineTo(0.75, -0.5);
    s.quadraticCurveTo(0.6, -1.4, 0.15, -1.75);
    s.lineTo(-0.75, -1.85);
    s.lineTo(-0.75, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false, curveSegments: 4 }).rotateX(Math.PI / 2).translate(0, 0.95, 0);
    c.poser(g, m.lisse, 0x1c1a19, {}, { crasse: false });
    g.dispose();
    c.boite(1.5, 0.12, 0.3, 0x1c1a19, { y: 0.72, z: 0.15 }, m.lisse);
    c.boite(1.3, 0.03, 0.15, 0xe8e2d0, { y: 0.79, z: 0.2 }, m.lisse);
    for (const [px, pz] of [[-0.6, 0.1], [0.6, 0.1], [-0.4, -1.6]]) {
      if (casse && px > 0) continue;
      c.boite(0.1, 0.65, 0.1, 0x1c1a19, { x: px, y: 0.33, z: pz }, m.lisse);
    }
    c.repere({ x: 0.75, y: 0.97, z: -0.2, rz: 0.6 }, () => c.boite(0.04, 0.02, 1.4, 0x1c1a19, { x: -0.7, z: -0.5, ry: 0.1 }, m.lisse));
  });
}

/** Un palmier en pot, mort : stipe à bagues, palmes brunes qui pendent. `pot` : bac de 0 à 1 m. */
export function palmier(c, x, z, h = 3, mort = true, y = 0, pot = 0.6) {
  const m = matieres();
  if (pot) {
    c.poser(cylindre(0.42, 0.32, pot, 8), m.mat, 0x8f7d66, { x, y: y + pot / 2, z });
    c.poser(cylindre(0.38, 0.38, 0.04, 8), m.mat, 0x5a4a38, { x, y: y + pot, z }, { crasse: false });
  }
  const base = y + pot;
  const penche = c.entre(-0.15, 0.15);
  const top = [x + penche * h, base + h, z + c.entre(-0.1, 0.1) * h];
  c.tube([x, base, z], top, 0.11, 0x6e5e4a, m.mat, 6);
  const tons = mort ? [0x8a7450, 0x6f5e42, 0x9b8458] : [PALETTE.feuillageSombre, PALETTE.feuillage];
  for (let i = 0; i < 9; i++) {
    const t = (i / 9) * Math.PI * 2 + c.hasard() * 0.4;
    const tombe = mort ? 0.9 + c.hasard() * 0.7 : 0.35 + c.hasard() * 0.4;
    c.repere({ x: top[0], y: top[1], z: top[2], ry: -t }, () => {
      c.boite(1.5, 0.03, 0.34, tons[i % tons.length], { x: 0.7, y: -0.35 * tombe, rz: -tombe * 0.75 }, m.mat, { nuance: 0.1, crasse: false });
    });
  }
}

// ---------- Plage ----------

/** Un transat en bois, toile rayée (atlas), parfois renversé. */
export function transat(c, x, z, ry = 0, toile = R.rayuresR, renverse = false) {
  const m = matieres();
  meuble(c, { x, z, ry }, renverse, () => {
    for (const s of [-1, 1]) {
      c.boite(0.04, 0.04, 1.6, COUL.boisClair, { x: s * 0.3, y: 0.3, z: 0, rx: -0.15 }, m.mat);
      c.boite(0.04, 0.04, 0.9, COUL.boisClair, { x: s * 0.3, y: 0.55, z: -0.55, rx: 0.9 }, m.mat);
      c.boite(0.04, 0.04, 0.7, COUL.boisClair, { x: s * 0.33, y: 0.2, z: 0.45, rx: 0.8 }, m.mat);
    }
    c.repere({ y: 0.45, z: -0.05, rx: -Math.PI / 2 + 0.5 }, () => panneau(c, m.enseignes, toile, { x: 0, y: 0.15, z: 0.0 }, 0.56, 1.3));
  }, 0.5);
}

/** Un parasol délavé : mât de bois, toile conique rayée (UV de l'atlas), éventuellement tombé. */
export function parasol(c, x, z, tombe = false, toile = R.rayuresR, r = 1.5, y = 0) {
  const m = matieres();
  const pose = tombe ? { x, y: y + 0.35, z, rz: Math.PI / 2 - 0.25, ry: c.hasard() * 3 } : { x, y, z, rz: c.entre(-0.06, 0.06) };
  c.repere(pose, () => {
    c.tube([0, 0, 0], [0, 2.4, 0], 0.035, COUL.boisClair, m.mat, 5);
    const g = uvAtlas(new THREE.ConeGeometry(r, 0.55, 10, 1, true), toile);
    c.poser(g, m.enseignes, 0xffffff, { y: 2.3 }, { crasse: false, nuance: 0 });
    g.dispose();
    c.poser(BOULE, m.mat, COUL.boisClair, { y: 2.6, e: 0.06 });
  });
  if (!tombe && y === 0) c.boite(0.5, 0.12, 0.5, 0x8a8478, { x, y: 0.06, z }, m.mat);
}

/** Une cabine de plage à rayures, porte entrouverte. */
export function cabine(c, x, z, ry = 0, toile = R.rayuresB) {
  const m = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(1.5, 0.08, 1.5, COUL.boisClair, { y: 0.15 }, m.mat);
    for (const [px, pz, l, p] of [[-0.72, 0, 0.06, 1.5], [0.72, 0, 0.06, 1.5], [0, -0.72, 1.5, 0.06]]) c.boite(l, 2.0, p, 0xede2c6, { x: px, y: 1.15, z: pz }, m.mat);
    for (const s of [-1, 1]) panneau(c, m.enseignes, toile, { x: s * 0.755, y: 1.15, z: 0, ry: s * Math.PI / 2 }, 1.5, 2.0);
    panneau(c, m.enseignes, toile, { x: 0, y: 1.15, z: -0.755, ry: Math.PI }, 1.5, 2.0);
    c.boite(0.25, 2.0, 0.06, 0xede2c6, { x: -0.62, y: 1.15, z: 0.72 }, m.mat);
    c.boite(0.25, 2.0, 0.06, 0xede2c6, { x: 0.62, y: 1.15, z: 0.72 }, m.mat);
    // le toit à deux pans et sa boule
    for (const s of [-1, 1]) c.boite(0.95, 0.05, 1.7, 0xc97a62, { x: s * 0.4, y: 2.38, rz: -s * 0.5 }, m.mat);
    c.poser(BOULE, m.mat, 0xede2c6, { y: 2.62, e: 0.08 });
    // la porte battue par le vent
    c.repere({ x: -0.5, y: 0.2, z: 0.74, ry: 1.1 + c.hasard() * 0.5 }, () => c.boite(1.0, 1.9, 0.04, 0x6f9fb3, { x: 0.5, y: 0.95 }, m.mat, { nuance: 0.06 }));
  });
}

/** Une barque échouée, couchée sur le flanc. */
export function barque(c, x, z, ry = 0) {
  const m = matieres();
  c.repere({ x, z, ry, rz: 0.35, y: 0.15 }, () => {
    const s = new THREE.Shape();
    s.moveTo(-2.1, 0);
    s.quadraticCurveTo(-1.6, -0.75, 0, -0.8);
    s.quadraticCurveTo(1.6, -0.75, 2.2, 0);
    s.quadraticCurveTo(1.6, 0.75, 0, 0.8);
    s.quadraticCurveTo(-1.6, 0.75, -2.1, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.6, bevelEnabled: true, bevelSize: 0.15, bevelThickness: 0.2, bevelSegments: 1, curveSegments: 4 }).rotateX(Math.PI / 2).translate(0, 0.65, 0);
    c.poser(g, m.mat, 0x5f7f86, {}, { nuance: 0.04 });
    g.dispose();
    c.boite(4.1, 0.06, 1.4, 0x8a6a4c, { y: 0.66 }, m.mat);
    c.boite(0.25, 0.06, 1.4, 0x6a4f38, { y: 0.75, x: 0.3 }, m.mat);
    c.boite(0.06, 0.06, 2.4, COUL.boisClair, { y: 0.8, x: -0.6, ry: 0.4 }, m.mat);
  });
}

// ---------- Hall ----------

/** Le chariot à bagages en laiton, chargé de valises. */
export function chariotBagages(c, x, z, ry = 0) {
  const m = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(1.4, 0.08, 0.7, 0x7a2630, { y: 0.24 }, m.mat);
    c.boite(1.45, 0.05, 0.75, COUL.laiton, { y: 0.19 }, m.metal);
    for (const [sx, sz] of [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]]) c.poser(cylindre(0.09, 0.09, 0.05, 8), m.tole, 0x2a2826, { x: sx, y: 0.09, z: sz, rx: Math.PI / 2 });
    for (const s of [-1, 1]) {
      c.tube([s * 0.68, 0.2, 0], [s * 0.68, 1.75, 0], 0.03, COUL.laiton, m.metal, 6);
      c.poser(BOULE, m.metal, COUL.laiton, { x: s * 0.68, y: 1.78, e: 0.06 });
    }
    // l'arceau
    let p = [-0.68, 1.75];
    for (let i = 1; i <= 6; i++) {
      const t = Math.PI - (i / 6) * Math.PI;
      const q = [Math.cos(t) * 0.68, 1.75 + Math.sin(t) * 0.32];
      c.tube([p[0], p[1], 0], [q[0], q[1], 0], 0.025, COUL.laiton, m.metal, 5);
      p = q;
    }
    c.tube([-0.68, 1.55, 0], [0.68, 1.55, 0], 0.02, COUL.laiton, m.metal, 5);
    // valises
    const tons = [0x6e4a32, 0x2f4a3a, 0x8a6a4c, 0x4a3a5a];
    c.boite(0.75, 0.42, 0.55, tons[0], { x: -0.3, y: 0.49, ry: 0.05 }, m.satin, { nuance: 0.06 });
    c.boite(0.6, 0.32, 0.5, tons[1], { x: 0.35, y: 0.44, ry: -0.08 }, m.satin, { nuance: 0.06 });
    c.boite(0.55, 0.28, 0.42, tons[2], { x: -0.25, y: 0.85, ry: -0.2 }, m.satin, { nuance: 0.06 });
    c.poser(cylindre(0.2, 0.2, 0.28, 10), m.mat, 0xc9b48a, { x: 0.35, y: 0.74 });
    for (const xx of [-0.3, 0.35]) c.boite(0.04, 0.02, 0.56, COUL.laiton, { x: xx, y: 0.71 }, m.metal);
  });
  // une valise tombée, ouverte, des vêtements sortis
  c.repere({ x: x + 0.9, z: z + 0.7, ry: ry + 0.6 }, () => {
    c.boite(0.62, 0.1, 0.45, 0x4a3a5a, { y: 0.05 }, m.satin);
    c.boite(0.62, 0.45, 0.06, 0x4a3a5a, { y: 0.24, z: -0.24, rx: -0.3 }, m.satin);
    c.boite(0.5, 0.05, 0.6, 0xc9b9a0, { y: 0.12, x: 0.2, ry: 0.4 }, m.mat, { crasse: false });
  });
}

/** La borne « Check-in par sourire » (écran qui luit encore) et son autocollant Watty. */
export function borneSourire(c, x, z, ry = 0) {
  const m = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(0.6, 0.1, 0.5, COUL.abondanceCreme, { y: 0.05 }, m.satin);
    c.boite(0.34, 1.1, 0.28, COUL.abondanceCreme, { y: 0.6 }, m.satin);
    c.boite(0.64, 0.6, 0.1, COUL.abondanceCreme, { y: 1.45, rx: -0.2 }, m.satin);
    panneau(c, m.neon, R.sourire, { y: 1.45, z: 0.056, rx: -0.2 }, 0.52, 0.52);
    c.boite(0.56, 0.06, 0.08, COUL.abondanceRouge, { y: 1.8, rx: -0.2, z: -0.03 }, m.satin);
    panneau(c, m.enseignes, R.watty, { x: 0.1, y: 0.75, z: 0.145 }, 0.22, 0.22);
  });
}

/** Le présentoir à brochures « Séjour Zéro-Effort ». */
export function presentoir(c, x, z, ry = 0) {
  const m = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(0.6, 0.04, 0.3, COUL.laiton, { y: 0.02 }, m.metal);
    for (const s of [-1, 1]) c.boite(0.03, 1.4, 0.03, COUL.laiton, { x: s * 0.28, y: 0.7 }, m.metal);
    for (let j = 0; j < 3; j++) {
      c.boite(0.6, 0.02, 0.12, COUL.laiton, { y: 0.45 + j * 0.38, z: 0.06 }, m.metal);
      for (const s of [-1, 1]) if (c.hasard() < 0.8) panneau(c, m.enseignes, R.zeroEffort, { x: s * 0.14, y: 0.6 + j * 0.38, z: 0.07, rx: -0.15 }, 0.2, 0.3);
    }
  });
  // brochures tombées au sol
  for (let i = 0; i < 4; i++) panneau(c, m.enseignes, R.zeroEffort, { x: x + c.entre(-0.8, 0.8), y: 0.075, z: z + c.entre(0.2, 1.2), rx: -Math.PI / 2, rz: c.hasard() * 3 }, 0.2, 0.3);
}

/** La banquette ronde du hall (pouf capitonné à jardinière centrale). */
export function pouf(c, x, z) {
  const m = matieres();
  c.poser(cylindre(1.2, 1.2, 0.42, 14), m.mat, COUL.velours, { x, y: 0.27, z }, { nuance: 0.03 });
  c.poser(cylindre(0.7, 0.85, 0.6, 12), m.mat, COUL.velours, { x, y: 0.75, z }, { nuance: 0.03 });
  c.poser(cylindre(0.45, 0.35, 0.5, 8), m.lisse, COUL.marbre, { x, y: 1.3, z });
  palmier(c, x, z, 1.8, true, 1.55, 0);
}

// ---------- Chambres ----------

/** Le lit à baldaquin : colonnes torses, ciel de lit, rideaux de velours en lambeaux. Tête au −z local. */
export function litBaldaquin(c, x, z, ry = 0) {
  const m = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(1.7, 0.4, 2.2, COUL.boisSombre, { y: 0.3 }, m.satin);
    c.boite(1.6, 0.25, 2.05, 0xd9d0bb, { y: 0.62 }, m.mat, { nuance: 0.05 });
    c.boite(1.66, 0.08, 1.4, COUL.velours, { y: 0.77, z: 0.35, rx: 0.02 }, m.mat, { nuance: 0.06, crasse: false });
    c.boite(1.66, 0.4, 0.04, COUL.velours, { y: 0.6, z: 1.08 }, m.mat, { crasse: false });
    for (const s of [-0.45, 0.45]) c.boite(0.6, 0.16, 0.4, 0xece6d6, { x: s, y: 0.82, z: -0.82 }, m.mat, { crasse: false });
    c.boite(1.7, 1.3, 0.1, COUL.boisSombre, { y: 1.05, z: -1.12 }, m.satin);
    for (const [sx, sz] of [[-0.82, -1.08], [0.82, -1.08], [-0.82, 1.08], [0.82, 1.08]]) c.tube([sx, 0, sz], [sx, 2.45, sz], 0.05, COUL.boisSombre, m.satin, 6);
    // le ciel de lit
    for (const [px, pz, l, p] of [[0, -1.08, 1.75, 0.08], [0, 1.08, 1.75, 0.08], [-0.82, 0, 0.08, 2.24], [0.82, 0, 0.08, 2.24]]) c.boite(l, 0.22, p, COUL.boisSombre, { x: px, y: 2.4, z: pz }, m.satin);
    c.boite(1.6, 0.03, 2.1, COUL.velours, { y: 2.35, rx: 0.06 }, m.mat, { crasse: false });
    // rideaux qui pendent, déchirés, un tombé
    for (const [sx, sz] of [[-0.88, -0.85], [0.88, -0.85], [-0.88, 0.85]]) c.boite(0.04, c.entre(1.3, 2.1), 0.5, COUL.velours, { x: sx, y: 1.5, z: sz }, m.mat, { nuance: 0.08, crasse: false });
    c.boite(0.6, 0.06, 1.4, COUL.velours, { x: 1.3, y: 0.05, z: 0.7, ry: 0.4 }, m.mat, { crasse: false });
  });
}

/** Un lit de fer simple, matelas éventré. */
export function litFer(c, x, z, ry = 0) {
  const m = matieres();
  c.repere({ x, z, ry }, () => {
    for (const sz of [-0.95, 0.95]) {
      for (const sx of [-0.45, 0.45]) c.boite(0.04, 0.9, 0.04, COUL.laiton, { x: sx, y: 0.45, z: sz }, m.metal);
      c.boite(0.94, 0.04, 0.04, COUL.laiton, { y: 0.88, z: sz }, m.metal);
    }
    c.boite(0.9, 0.2, 1.9, 0xc9bfa6, { y: 0.48 }, m.mat, { nuance: 0.08 });
    c.boite(0.5, 0.1, 0.4, 0xb9ab8a, { y: 0.62, z: 0.2, ry: 0.4 }, m.mat, { nuance: 0.1 });
  });
}

/** La baignoire à pieds de lion. */
export function baignoire(c, x, z, ry = 0) {
  const m = matieres();
  c.repere({ x, z, ry }, () => {
    c.poser(new THREE.CylinderGeometry(0.4, 0.33, 1.6, 10, 1, false).rotateX(Math.PI / 2).scale(1.0, 0.95, 1), m.lisse, 0xf0ece2, { y: 0.5, e: [1, 0.9, 1] });
    c.poser(new THREE.CylinderGeometry(0.4, 0.4, 1.62, 10, 1, true, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2), m.lisse, 0x3a3836, { y: 0.52, e: [0.9, 0.2, 0.98] }, { crasse: false });
    for (const [sx, sz] of [[-0.25, -0.65], [0.25, -0.65], [-0.25, 0.65], [0.25, 0.65]]) c.boite(0.08, 0.2, 0.1, COUL.laiton, { x: sx, y: 0.1, z: sz }, m.metal);
    c.tube([0, 0.85, -0.82], [0, 1.15, -0.82], 0.02, COUL.laiton, m.metal, 4);
    c.tube([0, 1.15, -0.82], [0, 1.1, -0.7], 0.02, COUL.laiton, m.metal, 4);
  });
}

/** Un lavabo sur colonne et son miroir piqué. */
export function lavabo(c, x, z, ry = 0) {
  const m = matieres();
  c.repere({ x, z, ry }, () => {
    c.poser(cylindre(0.12, 0.16, 0.8, 8), m.lisse, 0xf0ece2, { y: 0.4 });
    c.boite(0.6, 0.15, 0.45, 0xf0ece2, { y: 0.85 }, m.lisse);
    panneau(c, m.enseignes, R.miroir, { y: 1.6, z: -0.2 }, 0.7, 0.55);
  });
}

/** Une armoire à glace, une porte ouverte. */
export function armoire(c, x, z, ry = 0) {
  const m = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(1.2, 2.2, 0.6, COUL.bois, { y: 1.1 }, m.satin, { nuance: 0.04 });
    c.boite(1.3, 0.12, 0.66, COUL.bois, { y: 2.26 }, m.satin);
    c.boite(1.1, 2.0, 0.02, 0x2a1f16, { y: 1.1, z: 0.3 }, m.mat);
    c.repere({ x: -0.58, z: 0.3, ry: 1.3 }, () => c.boite(0.56, 2.0, 0.04, COUL.bois, { x: 0.28, y: 1.1 }, m.satin));
    panneau(c, m.enseignes, R.miroir, { x: 0.29, y: 1.15, z: 0.32 }, 0.48, 1.4);
    c.boite(0.5, 0.08, 0.4, 0xd8cfb8, { x: -0.25, y: 0.4, z: 0.05 }, m.mat, { crasse: false });
  });
}

// ---------- Cuisines, lingerie ----------

/** Le piano de cuisson : bloc d'acier, plaques noires, tiroirs chauffe-plats (pas de porte de four : objet-clé ailleurs), hotte inox au-dessus. */
export function pianoCuisson(c, x, z, l = 3.6, p = 1.3) {
  const m = matieres();
  c.repere({ x, z }, () => {
    c.boite(l, 0.85, p, 0x9a9e9f, { y: 0.425 }, m.satin, { nuance: 0.03 });
    c.boite(l + 0.06, 0.06, p + 0.06, 0x2a2a28, { y: 0.88 }, m.tole);
    for (let i = 0; i < 4; i++) {
      for (const s of [-1, 1]) {
        c.poser(cylindre(0.2, 0.2, 0.02, 10), m.tole, 0x1a1a19, { x: -l / 2 + 0.45 + i * (l - 0.9) / 3, y: 0.92, z: s * 0.3 }, { crasse: false });
        for (const yy of [0.3, 0.55]) c.boite(0.6, 0.18, 0.02, 0x6f7374, { x: -l / 2 + 0.45 + i * (l - 0.9) / 3, y: yy, z: s * (p / 2 + 0.01) }, m.metal);
        c.boite(0.5, 0.03, 0.04, COUL.laiton, { x: -l / 2 + 0.45 + i * (l - 0.9) / 3, y: 0.7, z: s * (p / 2 + 0.03) }, m.metal);
      }
    }
    c.boite(l + 0.2, 0.05, 0.05, COUL.laiton, { y: 0.8, z: p / 2 + 0.1 }, m.metal);
    // marmites, sauteuses
    c.poser(cylindre(0.26, 0.24, 0.42, 10), m.metal, 0xb08060, { x: -l / 2 + 0.45, y: 1.12, z: 0.3 });
    c.poser(cylindre(0.2, 0.2, 0.3, 10), m.satin, COUL.inox, { x: -l / 2 + 1.5, y: 1.07, z: -0.3 });
    c.poser(cylindre(0.22, 0.2, 0.08, 10), m.metal, 0x2a2a28, { x: l / 2 - 0.5, y: 0.96, z: 0.25 });
    c.boite(0.4, 0.03, 0.04, 0x2a2a28, { x: l / 2 - 0.1, y: 0.97, z: 0.4, ry: -0.5 }, m.metal);
    // la hotte et son conduit
    c.boite(l + 0.4, 0.5, p + 0.5, COUL.inox, { y: 2.5 }, m.satin, { crasse: false });
    c.boite(0.6, 1.6, 0.6, COUL.inox, { y: 3.55 }, m.satin, { crasse: false });
  });
}

/** Une table de travail en inox, avec étagère basse. */
export function tableInox(c, x, z, l = 1.8, p = 0.7, ry = 0) {
  const m = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(l, 0.04, p, COUL.inox, { y: 0.9 }, m.satin);
    c.boite(l - 0.1, 0.03, p - 0.1, COUL.inox, { y: 0.25 }, m.satin);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.boite(0.04, 0.9, 0.04, COUL.inox, { x: sx * (l / 2 - 0.05), y: 0.45, z: sz * (p / 2 - 0.05) }, m.metal);
  });
}

/** Une étagère (inox ou bois) garnie : `garnir(c, x, y, z, l)` remplit chaque tablette. */
export function etagere(c, x, z, l, ry, n, couleur, mat, garnir, h = 2.0, p = 0.5) {
  c.repere({ x, z, ry }, () => {
    for (const s of [-1, 1]) c.boite(0.04, h, p, couleur, { x: s * (l / 2), y: h / 2 }, mat);
    for (let i = 0; i < n; i++) {
      const y = 0.15 + (i * (h - 0.2)) / (n - 1 || 1);
      c.boite(l, 0.03, p, couleur, { y }, mat);
      if (garnir && i < n - 1) garnir(c, y + 0.015, l, p, i);
    }
  });
}

/** Des conserves sur une tablette : rangées de boîtes (étiquettes passées), quelques-unes tombées. */
export function conserves(c, y, l, p, i) {
  const m = matieres();
  const tons = [0xa8433a, 0x2f6f73, 0xc79a3b, 0x6e7a4a, 0x8a8e90];
  // des rangées de boîtes (une boîte longue par rangée, les étiquettes passées font le reste) et quelques boîtes seules
  for (let x = -l / 2 + 0.1; x < l / 2 - 0.3; x += 0.62) {
    if (c.hasard() < 0.25) continue;
    const t = tons[Math.floor(c.hasard() * tons.length)];
    c.boite(0.52, 0.18, 0.18, t, { x: x + 0.26, y: y + 0.09, z: -0.06 }, m.tole, { nuance: 0.08, crasse: false });
    if (c.hasard() < 0.4) c.poser(cylindre(0.09, 0.09, 0.18, 6), m.tole, t, { x: x + 0.1, y: y + 0.09, z: 0.14 }, { nuance: 0.08, crasse: false });
  }
  if (i === 0) c.boite(0.6, 0.3, 0.4, 0xb8a27a, { x: l / 4, y: y + 0.15, z: 0.0 }, m.mat, { nuance: 0.06 });
}

/** Des piles de linge plié (draps, serviettes, taies). */
export function linge(c, y, l, p, i) {
  const m = matieres();
  const tons = [COUL.linge, 0xe6e0cf, 0xdcd6c6, 0xb9c7cf, 0xe1d3b8];
  for (let x = -l / 2 + 0.25; x < l / 2 - 0.2; x += 0.45) {
    if (c.hasard() < 0.18) continue;
    const h = 0.12 + c.hasard() * 0.28;
    c.boite(0.4, h, p * 0.8, tons[Math.floor(c.hasard() * tons.length)], { x, y: y + h / 2, ry: c.entre(-0.08, 0.08) }, m.mat, { nuance: 0.05, crasse: false });
  }
}

/** Des bouteilles sur une tablette de bar. */
export function bouteilles(c, y, l, p, i) {
  const m = matieres();
  const tons = [0x3f5a3a, 0x6a3a2a, 0x8a7a40, 0x2f4a5a, 0xc9b48a];
  for (let x = -l / 2 + 0.1; x < l / 2 - 0.05; x += 0.2) {
    if (c.hasard() < 0.4) continue;
    c.boite(0.08, 0.3, 0.08, tons[Math.floor(c.hasard() * tons.length)], { x, y: y + 0.15, z: 0 }, m.lisse, { crasse: false });
  }
}

/** La calandre de la lingerie (grand fer à repasser à rouleaux). */
export function calandre(c, x, z, ry = 0) {
  const m = matieres();
  c.repere({ x, z, ry }, () => {
    for (const s of [-1, 1]) c.boite(0.25, 1.1, 0.9, 0x5a6058, { x: s * 1.2, y: 0.55 }, m.tole);
    c.poser(cylindre(0.3, 0.3, 2.2, 10), m.satin, COUL.inox, { y: 0.95, rz: Math.PI / 2 });
    c.poser(cylindre(0.22, 0.22, 2.2, 8), m.mat, 0xd8d0bc, { y: 0.95, z: 0.38, rz: Math.PI / 2 });
    c.boite(2.2, 0.04, 0.8, 0xe8e2d2, { y: 0.8, z: 0.75, rx: 0.2 }, m.mat, { crasse: false });
  });
}

/** Un chariot à linge (toile sur cadre), renversé ou non. */
export function chariotLinge(c, x, z, ry = 0, renverse = false) {
  const m = matieres();
  meuble(c, { x, z, ry }, renverse, () => {
    c.boite(1.0, 0.6, 0.6, 0xc9bfa6, { y: 0.55 }, m.mat, { nuance: 0.06 });
    c.boite(1.04, 0.04, 0.64, 0x6f7374, { y: 0.86 }, m.metal);
    for (const [sx, sz] of [[-0.45, -0.25], [0.45, -0.25], [-0.45, 0.25], [0.45, 0.25]]) c.boite(0.05, 0.25, 0.05, 0x2a2826, { x: sx, y: 0.12, z: sz }, m.tole);
    c.boite(0.8, 0.2, 0.4, COUL.linge, { y: 0.9, ry: 0.2 }, m.mat, { crasse: false });
  }, 0.9);
}

// ---------- Survivants ----------

/** Une lanterne-tempête (posée ou pendue à un fil). Objet-clé du niveau 2 : une seule, dans la suite de l'étage. */
export function lanterne(c, x, y, z, fil = 0) {
  const m = matieres();
  c.poser(cylindre(0.11, 0.13, 0.05, 8), m.tole, 0x7a2a22, { x, y: y + 0.025, z });
  c.poser(cylindre(0.08, 0.08, 0.2, 8), m.lisse, 0xffe2a0, { x, y: y + 0.15, z }, { crasse: false });
  for (let i = 0; i < 3; i++) c.boite(0.015, 0.22, 0.015, 0x7a2a22, { x: x + Math.cos(i * 2.1) * 0.1, y: y + 0.15, z: z + Math.sin(i * 2.1) * 0.1 }, m.tole);
  c.poser(cylindre(0.04, 0.13, 0.08, 8), m.tole, 0x7a2a22, { x, y: y + 0.29, z });
  if (fil) c.tube([x, y + 0.33, z], [x, y + 0.33 + fil, z], 0.008, 0x2a2826, m.tole, 3);
}

/**
 * Un photophore de survivants : trois bougies dans un bocal de conserve, une anse de fil de fer (posé ou pendu à un
 * fil). Il remplace les lampes-tempête du décor (la lanterne-tempête est un objet-clé de l'étage).
 */
export function photophore(c, x, y, z, fil = 0) {
  const m = matieres();
  c.poser(cylindre(0.1, 0.1, 0.2, 8), m.satin, 0xd9e2d8, { x, y: y + 0.1, z }, { crasse: false });
  c.poser(cylindre(0.085, 0.085, 0.08, 8), m.satin, 0xffe2a0, { x, y: y + 0.05, z }, { crasse: false, nuance: 0 });
  c.poser(cylindre(0.105, 0.105, 0.03, 8), m.tole, 0x7a6a50, { x, y: y + 0.2, z });
  c.tube([x - 0.1, y + 0.2, z], [x, y + 0.34, z], 0.006, 0x3a3836, m.tole, 3);
  c.tube([x + 0.1, y + 0.2, z], [x, y + 0.34, z], 0.006, 0x3a3836, m.tole, 3);
  if (fil) c.tube([x, y + 0.34, z], [x, y + 0.34 + fil, z], 0.008, 0x2a2826, m.tole, 3);
}

/** Un couchage de survivant : matelas pris dans les chambres, couverture polaire (couleurs vives, synthétique), sac. */
export function couchage(c, x, z, ry = 0) {
  const m = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(0.9, 0.16, 1.9, 0xc9bfa6, { y: 0.08 }, m.mat, { nuance: 0.06 });
    c.boite(0.95, 0.06, 1.2, [0xd8457a, 0x2fa8c8, 0x8ccf3a, 0xf08a24][Math.floor(c.hasard() * 4)], { y: 0.19, z: 0.3, ry: 0.06 }, m.mat, { nuance: 0.08, crasse: false });
    c.boite(0.5, 0.14, 0.35, 0xece6d6, { y: 0.22, z: -0.7 }, m.mat, { crasse: false });
    c.boite(0.4, 0.5, 0.3, 0x4a5a3a, { x: 0.7, y: 0.25, z: -0.6, ry: 0.3 }, m.mat);
  });
}

/** Une caisse en bois. */
export function caisse(c, x, z, s = 0.6, ry = 0, y = 0) {
  const m = matieres();
  c.boite(s, s * 0.8, s, PALETTE.bois, { x, y: y + s * 0.4, z, ry }, m.mat, { nuance: 0.06 });
  c.boite(s + 0.02, 0.06, s + 0.02, PALETTE.boisSombre, { x, y: y + s * 0.65, z, ry }, m.mat);
}

/** Une dune de sable : quelques bosses aplaties (icosaèdres lissés), qui enterrent ce qui est dessous. */
export function dune(c, x, z, l, p, h, mat, teinte = COUL.sable, ry = 0) {
  c.repere({ x, z, ry }, () => {
    c.poser(BOULE1, mat, teinte, { y: -h * 0.15, e: [l / 2, h, p / 2] }, { crasse: false, nuance: 0.02 });
    for (let i = 0; i < 1; i++) {
      const s = c.entre(0.35, 0.6);
      c.poser(BOULE1, mat, teinte, { x: c.entre(-0.35, 0.35) * l, y: -h * 0.2, z: c.entre(-0.3, 0.3) * p, e: [(l / 2) * s, h * (0.7 + s * 0.4), (p / 2) * s], ry: c.hasard() * 3 }, { crasse: false, nuance: 0.02 });
    }
  });
}
