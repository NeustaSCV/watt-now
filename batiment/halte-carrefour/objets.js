// Les objets de la halte du carrefour : épaves, camions, tracteurs, nains de jardin, éoliennes miniatures, bottes de
// foin, haies bocagères, clôtures, feux. Chaque fonction reçoit le contexte du tronçon `ctx` ({ b, c, M, u, ici }) et,
// au besoin, un chantier `k` (une couche) à la place de `ctx.c`.

import * as THREE from "three";
import { PALETTE } from "../commun/atelier.js";
import { bruit, bruitXZ, teinte, barre, obstacleBoite } from "./outils.js";

export const COUL = {
  asphalte: 0x8a8882,
  marquage: 0xe6e2d4,
  bordure: 0xc4bfb2,
  pneu: 0x2b2a28,
  orange: 0xd9762e,
  sac: 0xa5966e,
  jerseyRouge: 0xb24a3c,
  jerseyBlanc: 0xd8d4c8,
  bache: 0x4f6f8f,
};
export const COUL_AUTO = [0x8e4a3e, 0x4e6a7a, 0xb8b4a8, 0x5d6b4a, 0x37424e, 0xa08a5a, 0x7a7f84, 0x9c6a3a, 0x6b5a78, 0xc2b79a];
export const COUL_TOLE = [0x8a6a4a, 0x6f7f86, 0x9a5a3c, 0x7a7a6a, 0x5f6e5c, 0x8c8a7c];

export const GEO = {
  cone: new THREE.ConeGeometry(0.14, 0.66, 6),
  bande: new THREE.CylinderGeometry(0.075, 0.095, 0.1, 6),
  boule: new THREE.IcosahedronGeometry(1, 0),
  dome: new THREE.SphereGeometry(1, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2),
  chapeau: new THREE.ConeGeometry(1, 1, 5),
  tige: new THREE.ConeGeometry(0.07, 1, 3),
  feuilleMais: new THREE.PlaneGeometry(0.14, 0.9),
};

// ---------- Épaves ----------

/** Une voiture épave. Options : couleur, retournee, flanc (couchée sur le côté), portiere, coffre, capot, y, k, sansObstacle. */
export function voiture(ctx, x, z, ry, o = {}) {
  const { M, u, b } = ctx;
  const c = o.k ?? ctx.c;
  const coul0 = o.couleur ?? COUL_AUTO[Math.floor(bruitXZ(x, z, 5) * COUL_AUTO.length)];
  const coul = teinte(coul0, PALETTE.rouille, bruitXZ(x, z, 6) * (0.15 + u * 0.4));
  const affaisse = bruitXZ(x, z, 7) < u ? 0.12 : 0;
  const y = o.y ?? 0;
  const pose = o.retournee ? { x, y: y + 1.52, z, ry, rx: Math.PI } : o.flanc ? { x, y: y + 0.9, z, ry, rx: Math.PI / 2 * o.flanc } : { x, y: y - affaisse, z, ry, rz: o.penche ?? 0 };
  c.repere(pose, () => {
    c.boite(4.2, 0.6, 1.76, coul, { y: 0.66 }, M.satin);
    c.boite(1.1, 0.12, 1.7, coul, { x: 1.45, y: 1.0, rz: -0.12 }, M.satin);
    c.boite(2.2, 0.48, 1.58, 0x2a3134, { x: -0.25, y: 1.2 }, M.lisse);
    c.boite(2.0, 0.08, 1.6, coul, { x: -0.3, y: 1.47 }, M.satin);
    c.boite(0.12, 0.5, 1.6, coul, { x: 0.82, y: 1.2, rz: -0.5 }, M.satin);
    c.boite(0.16, 0.22, 1.8, 0x3a3a38, { x: 2.12, y: 0.48 }, M.mat);
    c.boite(0.16, 0.22, 1.8, 0x3a3a38, { x: -2.12, y: 0.48 }, M.mat);
    c.boite(0.05, 0.12, 0.34, 0xd8d6c8, { x: 2.13, y: 0.72, z: -0.6 }, M.lisse);
    c.boite(0.05, 0.12, 0.34, 0xd8d6c8, { x: 2.13, y: 0.72, z: 0.6 }, M.lisse);
    c.boite(0.05, 0.12, 0.34, 0x8a3028, { x: -2.13, y: 0.76, z: -0.65 }, M.lisse);
    c.boite(0.05, 0.12, 0.34, 0x8a3028, { x: -2.13, y: 0.76, z: 0.65 }, M.lisse);
    for (const [wx, wz] of [[1.35, -0.8], [1.35, 0.8], [-1.35, -0.8], [-1.35, 0.8]]) {
      const r = affaisse ? 0.28 : 0.34;
      c.tube([wx, r, wz - 0.11], [wx, r, wz + 0.11], r, COUL.pneu, M.mat, 7);
    }
    if (o.portiere) c.boite(1.1, 0.75, 0.06, coul, { x: 0.25, y: 0.85, z: -1.25, ry: 0.85 }, M.satin);
    if (o.coffre) c.boite(0.9, 0.06, 1.6, coul, { x: -2.15, y: 1.45, rz: 1.1 }, M.satin);
    if (o.capot) c.boite(1.2, 0.06, 1.6, coul, { x: 2.0, y: 1.35, rz: -1.0 }, M.satin);
  });
  if (!o.sansObstacle && y < 0.5) obstacleBoite(b, x, z, 4.3, 1.85, ry, "épave");
}

/** Une camionnette (fourgon tôlé). */
export function fourgon(ctx, x, z, ry, o = {}) {
  const { M, u, b } = ctx;
  const c = o.k ?? ctx.c;
  const coul = teinte(o.couleur ?? 0xd8d4c8, PALETTE.rouille, 0.1 + u * 0.3);
  const pose = o.flanc ? { x, y: 1.0, z, ry, rx: (Math.PI / 2) * o.flanc } : { x, y: 0, z, ry };
  c.repere(pose, () => {
    c.boite(3.6, 2.0, 2.0, coul, { x: -0.6, y: 1.35 }, M.satin);
    c.boite(1.3, 1.2, 2.0, coul, { x: 1.85, y: 0.95 }, M.satin);
    c.boite(0.8, 0.6, 1.9, 0x2a3134, { x: 1.75, y: 1.65, rz: -0.35 }, M.lisse);
    c.boite(0.12, 0.3, 2.0, 0x3a3a38, { x: 2.5, y: 0.45 }, M.mat);
    for (const [wx, wz] of [[1.7, -0.9], [1.7, 0.9], [-1.6, -0.9], [-1.6, 0.9]]) c.tube([wx, 0.36, wz - 0.12], [wx, 0.36, wz + 0.12], 0.36, COUL.pneu, M.mat, 7);
    c.boite(3.0, 0.4, 0.02, o.bande ?? 0x2f6f73, { x: -0.6, y: 1.6, z: 1.01 }, M.satin, { crasse: false });
    if (o.portes) c.boite(0.06, 1.8, 0.95, coul, { x: -2.6, y: 1.3, z: 1.4, ry: 1.2 }, M.satin);
  });
  if (!o.sansObstacle) obstacleBoite(b, x, z, 5.0, 2.1, ry, "fourgon");
}

/** Un semi-remorque : tracteur et remorque. `bachee` : rideaux coulissants (déchirés) ; `ouverte` : portes ouvertes. */
export function semiRemorque(ctx, x, z, ry, o = {}) {
  const { M, u, b } = ctx;
  const c = o.k ?? ctx.c;
  const cabine = teinte(o.cabine ?? 0xb8433a, PALETTE.rouille, 0.12 + u * 0.25);
  const caisse = o.caisse ?? 0xd8d4c8;
  c.repere({ x, y: 0, z, ry }, () => {
    // Le tracteur (vers +x)
    c.boite(2.3, 2.6, 2.45, cabine, { x: 6.85, y: 2.15 }, M.satin);
    c.boite(0.06, 1.0, 2.1, 0x2a3134, { x: 8.02, y: 2.75 }, M.lisse);
    c.boite(1.6, 0.6, 2.4, cabine, { x: 6.7, y: 3.75, rz: 0.05 }, M.satin);
    c.boite(0.2, 0.55, 2.45, 0x5a5a56, { x: 8.0, y: 0.95 }, M.metal);
    for (const s of [-1, 1]) c.boite(0.5, 0.1, 0.3, 0x3a3a38, { x: 7.9, y: 2.8, z: s * 1.35 }, M.metal);
    c.boite(4.2, 0.4, 1.0, 0x3a3a38, { x: 5.6, y: 0.85 }, M.mat);
    c.tube([5.6, 0.9, 1.15], [4.4, 0.9, 1.15], 0.28, 0x8a8a84, M.metal, 7);
    c.tube([5.6, 2.2, -1.05], [5.6, 4.1, -1.05], 0.07, 0x7a7a74, M.metal, 5);
    for (const wx of [7.1, 4.9]) for (const s of [-1, 1]) c.tube([wx, 0.52, s * 0.95], [wx, 0.52, s * 1.22], 0.52, COUL.pneu, M.mat, 8);
    // La remorque (13,6 m)
    c.boite(13.6, 0.3, 2.5, 0x3a3a38, { x: -2.6, y: 1.3 }, M.mat);
    if (o.bachee) {
      c.boite(13.6, 0.12, 2.5, 0x8a8f94, { x: -2.6, y: 4.0 }, M.tole);
      for (let i = 0; i <= 6; i++) c.boite(0.1, 2.6, 2.5, 0x6a6a64, { x: -9.3 + i * 2.25, y: 2.7 }, M.metal);
      // les rideaux : entiers côté nord, en lambeaux côté sud
      c.boite(13.4, 2.55, 0.03, teinte(caisse, 0x6a6a5a, 0.2), { x: -2.6, y: 2.72, z: -1.24 }, M.toile);
      for (let i = 0; i < 6; i++) {
        const lg = 1.0 + bruit(i, 3, 11) * 1.5;
        c.boite(2.0, lg, 0.03, teinte(caisse, 0x6a6a5a, 0.2), { x: -8.3 + i * 2.25, y: 3.95 - lg / 2, z: 1.26, rx: (bruit(i, 4, 11) - 0.5) * 0.25 }, M.toile, { crasse: false });
      }
      // le chargement : des palettes filmées
      for (let i = 0; i < 5; i++) {
        c.boite(1.1, 0.14, 1.1, PALETTE.bois, { x: -8 + i * 2.5, y: 1.52 }, M.mat);
        c.boite(1.05, 1.1, 1.05, i % 2 ? 0xc9c4b0 : 0x8fa0a8, { x: -8 + i * 2.5, y: 2.15 }, M.satin, { nuance: 0.05 });
      }
    } else {
      c.boite(13.6, 2.7, 2.5, caisse, { x: -2.6, y: 2.8 }, M.tole);
      for (let i = 0; i < 12; i++) c.boite(0.08, 2.6, 0.04, teinte(caisse, 0x6a6a64, 0.25), { x: -8.8 + i * 1.12, y: 2.8, z: 1.27 }, M.tole);
      if (o.texte !== false) c.boite(9, 0.9, 0.02, o.bande ?? 0x2f6f73, { x: -2.6, y: 3.3, z: 1.27 }, M.satin, { crasse: false });
      if (o.ouverte) {
        c.boite(0.06, 2.6, 1.22, caisse, { x: -9.9, y: 2.8, z: 1.85, ry: 1.3 }, M.tole);
        c.boite(0.06, 2.6, 1.22, caisse, { x: -9.9, y: 2.8, z: -1.85, ry: -1.3 }, M.tole);
        c.boite(0.05, 2.5, 2.4, 0x3a3834, { x: -9.38, y: 2.8 }, M.mat);
      }
    }
    // essieux de la remorque, béquilles, pare-cycliste
    for (const wx of [-7.4, -8.7, -10.0]) for (const s of [-1, 1]) c.tube([wx, 0.5, s * 0.95], [wx, 0.5, s * 1.22], 0.5, COUL.pneu, M.mat, 8);
    for (const s of [-1, 1]) c.boite(0.15, 1.1, 0.15, 0x5a5a56, { x: 2.0, y: 0.6, z: s * 0.9 }, M.metal);
    for (const s of [-1, 1]) c.boite(6, 0.3, 0.05, 0xc0c0b8, { x: -1.5, y: 0.9, z: s * 1.24 }, M.metal);
  });
  if (!o.sansObstacle) obstacleBoite(b, x - Math.cos(ry) * 1.1, z + Math.sin(ry) * 1.1, 18.4, 2.6, ry, "semi-remorque");
}

/** Un camion porteur encastré sous le gabarit du pont-cadre : la caisse arrachée, pliée vers l'arrière. */
export function porteurEncastre(ctx, x, z, ry) {
  const { M, b, u } = ctx;
  const c = ctx.c;
  const cab = teinte(0xd8d4c8, PALETTE.rouille, 0.2 + u * 0.2);
  c.repere({ x, y: 0, z, ry }, () => {
    c.boite(2.0, 2.4, 2.4, cab, { x: 3.2, y: 1.95 }, M.satin);
    c.boite(0.06, 0.9, 2.0, 0x2a3134, { x: 4.22, y: 2.5 }, M.lisse);
    c.boite(7.5, 0.35, 1.0, 0x3a3a38, { x: -0.6, y: 0.8 }, M.mat);
    for (const wx of [3.2, -2.4, -3.4]) for (const s of [-1, 1]) c.tube([wx, 0.5, s * 0.92], [wx, 0.5, s * 1.18], 0.5, COUL.pneu, M.mat, 8);
    // la caisse : sa face avant écrasée contre le linteau, le toit replié
    c.boite(5.6, 2.3, 2.45, 0xe0dcd0, { x: -1.0, y: 2.3 }, M.tole);
    c.boite(5.4, 0.08, 2.45, 0xd0ccc0, { x: -1.6, y: 3.7, rz: 0.22 }, M.tole);
    c.boite(0.08, 1.4, 2.4, 0xc8c4b8, { x: 1.7, y: 3.6, rz: -0.6 }, M.tole);
    c.boite(4.8, 0.7, 0.03, 0xc79a3b, { x: -1.0, y: 2.6, z: 1.24 }, M.satin, { crasse: false });
  });
  obstacleBoite(b, x, z, 8.4, 2.6, ry, "camion encastré");
}

/** Un tracteur. `neuf` : jamais livré, sous un film plastique déchiré ; sinon un vieux tracteur de ferme. */
export function tracteur(ctx, x, z, ry, couleur = 0x4a7a3a, o = {}) {
  const { M, b, u } = ctx;
  const c = o.k ?? ctx.c;
  const coul = o.neuf ? couleur : teinte(couleur, PALETTE.rouille, 0.25 + u * 0.3);
  const e = o.petit ? 0.75 : 1;
  c.repere({ x, y: 0, z, ry, e }, () => {
    // le capot, le châssis
    c.boite(2.2, 0.9, 1.0, coul, { x: 0.9, y: 1.35 }, M.satin);
    c.boite(0.1, 0.7, 0.9, 0x3a3a38, { x: 2.02, y: 1.3 }, M.mat);
    c.boite(3.4, 0.4, 0.9, 0x3a3a38, { x: 0.3, y: 0.8 }, M.mat);
    // la cabine vitrée (ou l'arceau pour le vieux)
    if (o.neuf || o.cabine) {
      c.boite(1.5, 0.2, 1.7, coul, { x: -0.7, y: 1.5 }, M.satin);
      for (const [dx, dz] of [[-0.05, -0.8], [-0.05, 0.8], [-1.4, -0.8], [-1.4, 0.8]]) c.boite(0.08, 1.5, 0.08, 0x2a2a28, { x: -0.7 + dx + 0.7, y: 2.35, z: dz }, M.metal);
      c.boite(1.6, 1.4, 1.62, 0x2a3a40, { x: -0.7, y: 2.35 }, M.verre, { crasse: false });
      c.boite(1.75, 0.12, 1.85, o.neuf ? 0xe8e4d8 : coul, { x: -0.7, y: 3.1 }, M.satin);
      if (o.neuf) c.boite(0.25, 0.12, 0.25, 0xd9762e, { x: -0.7, y: 3.22 }, M.lisse);
    } else {
      c.boite(0.6, 0.15, 0.6, 0x2a2a28, { x: -0.6, y: 1.55 }, M.satin);
      barre(c, [-1.2, 1.2, -0.75], [-1.2, 2.7, -0.75], 0.08, 0.08, 0x3a3a38, M.metal);
      barre(c, [-1.2, 1.2, 0.75], [-1.2, 2.7, 0.75], 0.08, 0.08, 0x3a3a38, M.metal);
      barre(c, [-1.2, 2.7, -0.75], [-1.2, 2.7, 0.75], 0.08, 0.08, 0x3a3a38, M.metal);
      c.tube([0.6, 1.8, 0.3], [0.6, 2.4, 0.3], 0.05, 0x3a3a38, M.metal, 5);
    }
    // les roues : grandes à l'arrière, petites à l'avant
    for (const s of [-1, 1]) {
      c.tube([-0.7, 0.85, s * 0.75], [-0.7, 0.85, s * 1.3], 0.85, COUL.pneu, M.mat, 10);
      c.tube([-0.7, 0.85, s * 1.31], [-0.7, 0.85, s * 1.33], 0.5, o.neuf ? 0xd9b23a : 0x8a7a3a, M.satin, 8);
      c.tube([1.55, 0.5, s * 0.55], [1.55, 0.5, s * 0.9], 0.5, COUL.pneu, M.mat, 8);
      c.boite(1.0, 0.06, 0.5, coul, { x: -0.7, y: 1.75, z: s * 1.05 }, M.satin);
    }
    if (o.neuf) {
      // le film plastique : des pans translucides qui pendent
      c.boite(3.6, 0.04, 2.7, 0xe8ecf0, { x: 0.2, y: 3.28 }, M.verre, { crasse: false });
      for (const s of [-1, 1]) c.boite(3.2, 1.6 + bruitXZ(x, z, s + 3) * 0.8, 0.03, 0xe8ecf0, { x: 0.2, y: 2.2, z: s * 1.36, rx: s * 0.12 }, M.verre, { crasse: false });
      c.boite(0.6, 0.4, 0.02, 0xf2eee0, { x: 2.03, y: 1.6, ry: Math.PI / 2 }, M.mat, { crasse: false });
    }
  });
  if (!o.sansObstacle) obstacleBoite(b, x - Math.cos(ry) * 0.2 * e, z + Math.sin(ry) * 0.2 * e, 3.8 * e, 2.7 * e, ry, "tracteur");
}

// ---------- Le rond-point : nains, éoliennes, Watty ----------

/** Un nain de jardin en plâtre peint (40 cm), parfois renversé. */
export function nain(ctx, x, z, ry, o = {}) {
  const { M } = ctx;
  const c = o.k ?? ctx.c;
  const e = o.e ?? 1;
  const chapeau = [0xc8362b, 0x2f6f73, 0xc79a3b][Math.floor(bruitXZ(x, z, 2) * 3)];
  const pose = o.renverse ? { x, y: 0.12 * e, z, ry, rz: Math.PI / 2, e } : { x, y: 0, z, ry, e };
  c.repere(pose, () => {
    c.boite(0.2, 0.05, 0.2, 0x8a8a7a, { y: 0.025 }, M.mat);
    c.poser(GEO.boule, M.lisse, 0x4a6a8a, { y: 0.14, e: [0.11, 0.11, 0.1] });
    c.poser(GEO.boule, M.lisse, 0x6a4a3a, { y: 0.24, e: [0.09, 0.07, 0.08] });
    c.poser(GEO.boule, M.lisse, 0xe8c8a8, { y: 0.31, e: [0.07, 0.07, 0.07] });
    c.poser(GEO.chapeau, M.lisse, 0xeae6dc, { y: 0.26, z: 0.04, rx: Math.PI, e: [0.06, 0.12, 0.03] });
    c.poser(GEO.chapeau, M.lisse, chapeau, { y: 0.44, rz: 0.15, e: [0.075, 0.2, 0.075] });
    if (o.brouette) {
      c.boite(0.22, 0.08, 0.14, 0x8a6a44, { x: 0.2, y: 0.1 }, M.mat);
    }
  });
}

/** Une éolienne miniature de rond-point (2 à 3 m), pales cassées avec l'usure. */
export function eolienne(ctx, x, z, h = 2.5, o = {}) {
  const { M } = ctx;
  const c = o.k ?? ctx.c;
  const orient = o.ry ?? 0.6;
  c.tube([x, 0, z], [x, h, z], 0.05, 0xe8e6e0, M.satin, 6);
  c.repere({ x, y: h, z, ry: orient }, () => {
    c.boite(0.3, 0.12, 0.12, 0xe8e6e0, { x: -0.05 }, M.satin);
    c.boite(0.06, 0.06, 0.06, 0x2f6f73, { x: 0.13 }, M.satin);
    const n = o.cassee ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const a = (i / 3) * Math.PI * 2 + (o.angle ?? 0.3);
      c.boite(0.03, 0.75, 0.08, 0xf0eee8, { x: 0.15, y: Math.cos(a) * 0.38, z: Math.sin(a) * 0.38, rx: -a }, M.satin);
    }
  });
  if (o.cassee) c.boite(0.03, 0.75, 0.08, 0xf0eee8, { x: x + 0.5, y: 0.03, z: z + 0.3, rz: Math.PI / 2, ry: 1.2 }, M.satin);
}

/** Un rotor d'éolienne qui tourne encore (un objet animé à part : un appel de dessin de plus). */
export function rotorAnime(M, x, y, z, ry) {
  const geos = [];
  for (let i = 0; i < 3; i++) {
    const g = new THREE.BoxGeometry(0.03, 0.8, 0.09);
    g.translate(0, 0.4, 0);
    g.rotateX((i / 3) * Math.PI * 2);
    geos.push(g);
  }
  const g = new THREE.BufferGeometry();
  const pos = [];
  for (const gg of geos) {
    const n = gg.toNonIndexed();
    pos.push(...n.attributes.position.array);
  }
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  const col = new Float32Array(pos.length).fill(0.92);
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, M.satin);
  m.castShadow = true;
  m.position.set(x, y, z);
  m.rotation.order = "YXZ";
  m.rotation.y = ry;
  m.userData.animer = (t, dt) => {
    m.rotation.x += (dt ?? 0.016) * (1.4 + 0.8 * Math.sin(t * 0.3));
  };
  return m;
}

// ---------- La campagne ----------

/** Une botte de foin : ronde (couchée) ou carrée. */
export function botte(ctx, x, z, o = {}) {
  const { M } = ctx;
  const c = o.k ?? ctx.c;
  const y = o.y ?? 0;
  const ton = teinte(0xc9b071, 0x8a8a6a, (o.vieille ?? 0.4) * 0.6);
  if (o.ronde) {
    const ry = o.ry ?? 0;
    const dx = Math.cos(ry) * 0.6;
    const dz = -Math.sin(ry) * 0.6;
    c.tube([x - dx, y + 0.75, z - dz], [x + dx, y + 0.75, z + dz], 0.75, ton, M.mat, 9);
  } else {
    c.boite(1.0, 0.45, 0.5, ton, { x, y: y + 0.225, z, ry: o.ry ?? 0 }, M.mat, { nuance: 0.06 });
  }
}

/** Une palette en bois (posée à plat ou debout). */
export function palette(ctx, x, z, o = {}) {
  const { M } = ctx;
  const c = o.k ?? ctx.c;
  const y = o.y ?? 0;
  c.repere({ x, y, z, ry: o.ry ?? 0, rx: o.debout ? Math.PI / 2 : 0 }, () => {
    for (let i = 0; i < 5; i++) c.boite(1.2, 0.025, 0.12, PALETTE.boisGris, { y: 0.13, z: -0.36 + i * 0.18 }, M.mat, { nuance: 0.08 });
    for (const zz of [-0.35, 0, 0.35]) c.boite(1.2, 0.1, 0.1, PALETTE.bois, { y: 0.06, z: zz }, M.mat);
  });
}

export function pneus(ctx, x, z, n, k) {
  const { M } = ctx;
  const c = k ?? ctx.c;
  for (let i = 0; i < n; i++) {
    const dx = (bruit(i, Math.round(x * 3), 5) - 0.5) * 0.12;
    c.tube([x + dx, i * 0.24, z], [x + dx, i * 0.24 + 0.22, z], 0.36, COUL.pneu, M.mat, 8);
  }
}

export function cone(ctx, x, z, k) {
  const { M } = ctx;
  const c = k ?? ctx.c;
  c.boite(0.36, 0.04, 0.36, COUL.orange, { x, y: 0.02, z }, M.satin);
  c.poser(GEO.cone, M.satin, COUL.orange, { x, y: 0.36, z }, { nuance: 0.08 });
  c.poser(GEO.bande, M.satin, 0xe8e4d8, { x, y: 0.42, z }, { crasse: false });
}

/** Un séparateur modulaire (« jersey ») le long de x local. */
export function jersey(ctx, x, z, ry, coul, obstacle = true) {
  const { c, M, b } = ctx;
  c.repere({ x, y: 0, z, ry }, () => {
    c.boite(2, 0.3, 0.62, coul, { y: 0.15 }, M.satin);
    c.boite(2, 0.55, 0.32, coul, { y: 0.56 }, M.satin);
    c.boite(1.96, 0.06, 0.2, coul, { y: 0.86 }, M.satin);
  });
  if (obstacle) obstacleBoite(b, x, z, 2, 0.62, ry, "séparateur");
}

/** Un mur de sacs (sable, terreau) le long d'un segment, en quinconce. */
export function sacs(ctx, xa, za, xb, zb, rangs = 3, o = {}) {
  const { c, M, b } = ctx;
  const L = Math.hypot(xb - xa, zb - za);
  const ry = -Math.atan2(zb - za, xb - xa);
  const n = Math.max(1, Math.round(L / 0.52));
  const tons = o.tons ?? [COUL.sac, 0x8a7d5a];
  for (let r = 0; r < rangs; r++) {
    const dec = r % 2 ? 0.26 : 0;
    for (let i = 0; i < n - (r % 2); i++) {
      const t = (i * 0.52 + 0.26 + dec) / L;
      if (r === rangs - 1 && bruit(i, r, Math.round(xa * 7)) < 0.15) continue;
      c.boite(0.5, 0.2, 0.34, tons[(i + r) % tons.length], { x: xa + (xb - xa) * t, y: 0.1 + r * 0.19, z: za + (zb - za) * t, ry: ry + (bruit(i, r, 9) - 0.5) * 0.2 }, M.toile, { nuance: 0.08 });
    }
  }
  if (o.obstacle !== false) b.obstacle(xa, za, xb, zb, o.nature ?? "sacs");
}

/** Un brasero (fût percé) et ses flammes. */
export function brasero(ctx, x, z) {
  const { c, M } = ctx;
  c.tube([x, 0, z], [x, 0.85, z], 0.3, PALETTE.rouilleSombre, M.tole, 8);
  for (let i = 0; i < 4; i++) c.boite(0.08, 0.05, 0.02, 0xff9a3a, { x: x + Math.cos(i * 1.6) * 0.31, y: 0.45, z: z + Math.sin(i * 1.6) * 0.31, ry: -i * 1.6 }, M.lueur, { crasse: false, nuance: 0 });
  for (let i = 0; i < 4; i++) c.poser(GEO.boule, M.lueur, i % 2 ? 0xff7a20 : 0xffc050, { x: x + (bruit(i, 1, Math.round(x)) - 0.5) * 0.25, y: 0.95 + i * 0.12, z: z + (bruit(i, 2, Math.round(z)) - 0.5) * 0.25, e: [0.16 - i * 0.025, 0.24, 0.16 - i * 0.025] }, { crasse: false, nuance: 0 });
}

/** Un feu de camp entouré de pierres, des braises, quelques bûches. */
export function feuDeCamp(ctx, x, z) {
  const { c, M } = ctx;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    c.poser(GEO.boule, M.mat, PALETTE.pierreSombre, { x: x + Math.cos(a) * 0.62, y: 0.08, z: z + Math.sin(a) * 0.62, ry: a, e: [0.16, 0.12, 0.13] });
  }
  for (let i = 0; i < 4; i++) {
    const a = i * 0.8;
    barre(c, [x - Math.cos(a) * 0.45, 0.08, z - Math.sin(a) * 0.45], [x + Math.cos(a) * 0.45, 0.2, z + Math.sin(a) * 0.45], 0.1, 0.1, 0x3a2a1a, M.mat);
  }
  for (let i = 0; i < 4; i++) c.poser(GEO.boule, M.lueur, i % 2 ? 0xff7a20 : 0xffc050, { x: x + (bruit(i, 7, 3) - 0.5) * 0.3, y: 0.3 + i * 0.13, z: z + (bruit(i, 8, 3) - 0.5) * 0.3, e: [0.2 - i * 0.035, 0.28, 0.2 - i * 0.035] }, { crasse: false, nuance: 0 });
}

export function lanterne(ctx, x, y, z, k) {
  const { M } = ctx;
  const c = k ?? ctx.c;
  c.boite(0.18, 0.04, 0.18, 0x2a2a28, { x, y, z }, M.metal);
  c.boite(0.14, 0.2, 0.14, 0xffd890, { x, y: y + 0.13, z }, M.lueur, { crasse: false, nuance: 0 });
  c.boite(0.18, 0.04, 0.18, 0x2a2a28, { x, y: y + 0.25, z }, M.metal);
  c.tube([x, y + 0.27, z], [x, y + 0.36, z], 0.04, 0x2a2a28, M.metal, 5);
}

export function bougie(ctx, x, y, z, h = 0.18) {
  const { c, M } = ctx;
  c.tube([x, y, z], [x, y + h, z], 0.035, 0xece4cc, M.satin, 6);
  c.poser(GEO.boule, M.lueur, 0xffc860, { x, y: y + h + 0.04, z, e: [0.022, 0.05, 0.022] }, { crasse: false, nuance: 0 });
}

export function caisse(ctx, x, z, l = 0.6, h = 0.45, p = 0.4, y = 0, ry = 0, coul = PALETTE.bois) {
  ctx.c.boite(l, h, p, coul, { x, y: y + h / 2, z, ry }, ctx.M.mat, { nuance: 0.08 });
}

export function conserves(ctx, x, z, n, y = 0) {
  const { c, M } = ctx;
  const tons = [0xb8452f, 0x2f6f73, 0xc79a3b, 0x8f9a8c];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / 4);
    const k = i % 4;
    c.tube([x + (k % 2) * 0.16 + r * 0.04, y + r * 0.2, z + Math.floor(k / 2) * 0.16], [x + (k % 2) * 0.16 + r * 0.04, y + r * 0.2 + 0.18, z + Math.floor(k / 2) * 0.16], 0.07, tons[i % tons.length], M.metal, 6);
  }
}

/** Une table de bistrot (plateau carré, pied central) et ses chaises, éventuellement nappée (région d'atlas). */
export function tableNappee(ctx, x, z, o = {}) {
  const { c, M } = ctx;
  const ry = o.ry ?? 0;
  c.repere({ x, y: 0, z, ry }, () => {
    c.tube([0, 0, 0], [0, 0.72, 0], 0.04, 0x3a3a38, M.metal, 5);
    c.boite(0.5, 0.03, 0.5, 0x3a3a38, { y: 0.015 }, M.metal);
    c.boite(0.86, 0.04, 0.86, PALETTE.bois, { y: 0.74 }, M.mat);
    if (o.nappe) {
      // la nappe : un carré de l'atlas, qui retombe sur deux côtés
      const g = new THREE.PlaneGeometry(1.1, 1.1).rotateX(-Math.PI / 2);
      ctx.uvAtlas(g, o.nappe);
      c.poser(g, M.enseignes, 0xffffff, { y: 0.765, ry: 0.1 }, { crasse: false, nuance: 0 });
      g.dispose();
      for (const s of [-1, 1]) c.boite(1.0, 0.22, 0.01, o.nappe === ctx.R.nappe ? 0xd8b0a8 : 0xa8b4cc, { y: 0.66, z: s * 0.55 }, M.toile, { crasse: false });
    }
    if (o.couverts) {
      for (const s of [-1, 1]) {
        c.tube([s * 0.2, 0.78, 0], [s * 0.2, 0.79, 0], 0.11, 0xf2eee4, M.lisse, 8);
        c.tube([s * 0.3, 0.78, 0.2], [s * 0.3, 0.92, 0.2], 0.03, 0x6a8a6a, M.verre, 5);
      }
    }
    const chaises = o.chaises ?? 2;
    for (let i = 0; i < chaises; i++) {
      const a = (i / chaises) * Math.PI * 2 + 0.2;
      const tombe = bruitXZ(x + i, z, 3) < 0.25 + ctx.u * 0.2;
      const cx = Math.cos(a) * 0.7;
      const cz = Math.sin(a) * 0.7;
      c.repere(tombe ? { x: cx * 1.4, y: 0.22, z: cz * 1.4, ry: -a, rz: Math.PI / 2 } : { x: cx, y: 0, z: cz, ry: -a + Math.PI / 2 }, () => {
        c.boite(0.42, 0.04, 0.42, o.chaise ?? 0x8a5a3a, { y: 0.45 }, M.satin);
        for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) c.boite(0.03, 0.45, 0.03, 0x3a3a38, { x: dx, y: 0.22, z: dz }, M.metal);
        c.boite(0.42, 0.42, 0.04, o.chaise ?? 0x8a5a3a, { y: 0.7, z: -0.2 }, M.satin);
      });
    }
  });
}

// ---------- Les bords : haies bocagères, clôtures, poteaux ----------

/**
 * Une haie bocagère épaisse entre deux points : un talus de terre, des touffes de feuillage serrées (deux rangs), des
 * arbres de haut jet çà et là. Le hasard vient de la position : deux tronçons voisins voient la même haie.
 * Chaque touffe va dans le tronçon qui contient son centre.
 */
export function haie(ctx, xa, za, xb, zb, o = {}) {
  const { c, M, b, u } = ctx;
  const L = Math.hypot(xb - xa, zb - za);
  const n = Math.max(1, Math.round(L / (o.pas ?? 1.3)));
  const hauteur = o.h ?? 2.6;
  const ep = o.ep ?? 2.2;
  const nx = -(zb - za) / L;
  const nz = (xb - xa) / L;
  const tons = [PALETTE.feuillageSombre, PALETTE.feuillage, 0x4f7a3c, 0x6d8f45, 0x5a7a3a];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = xa + (xb - xa) * t;
    const z = za + (zb - za) * t;
    if (!ctx.ici(x)) continue;
    const k1 = bruitXZ(x, z, 21);
    const k2 = bruitXZ(x, z, 22);
    const k3 = bruitXZ(x, z, 23);
    // le talus planté
    if (o.talus !== false && i < n) c.boite(L / n + 0.05, 0.5, ep + 0.8, PALETTE.terreSombre, { x: x + (xb - xa) / n / 2, y: 0.12, z: z + (zb - za) / n / 2, ry: -Math.atan2(zb - za, xb - xa) }, M.mat, { nuance: 0.05 });
    for (const s of [-0.5, 0.5]) {
      const r = (0.75 + k1 * 0.6) * (ep / 2.2);
      const hh = hauteur * (0.55 + k2 * 0.45);
      c.poser(GEO.boule, M.mat, tons[Math.floor((k3 + s + 0.5) * 2.4) % tons.length], { x: x + nx * s * ep * 0.45 + (k2 - 0.5) * 0.4, y: hh * 0.5 + 0.2, z: z + nz * s * ep * 0.45 + (k1 - 0.5) * 0.4, ry: k3 * 6, rx: k1 * 3, e: [r * 1.15, hh * 0.55, r] }, { crasse: false, nuance: 0.08 });
    }
    // des ronces et de la viorne qui débordent
    if (k3 < 0.35 + u * 0.3) c.poser(GEO.boule, M.mat, k1 < 0.5 ? 0x6a7a3a : 0x7a8a4a, { x: x + nx * (ep * 0.6) * (k2 < 0.5 ? -1 : 1), y: 0.35, z: z + nz * (ep * 0.6) * (k2 < 0.5 ? -1 : 1), ry: k1 * 5, e: [0.7, 0.45, 0.6] }, { crasse: false, nuance: 0.1 });
    // un arbre de haut jet (chêne têtard, frêne) de temps en temps
    if (o.arbres !== false && i % 7 === 3 && k1 < 0.75) {
      const h = 7 + k2 * 5;
      c.tube([x, 0, z], [x + (k3 - 0.5) * 0.6, h * 0.5, z], 0.28, 0x5e4a36, M.mat, 6);
      for (let j = 0; j < 4; j++) {
        const a = (j / 4) * Math.PI * 2 + k3 * 3;
        c.poser(GEO.boule, M.mat, tons[(j + i) % tons.length], { x: x + Math.cos(a) * 1.6, y: h * (0.62 + 0.12 * (j % 2)), z: z + Math.sin(a) * 1.6, ry: a, rx: k1 * 2, e: [2.0 + k2, 1.5, 2.0] }, { crasse: false, nuance: 0.07 });
      }
      c.poser(GEO.boule, M.mat, PALETTE.feuillageSombre, { x, y: h * 0.85, z, e: [2.2, 1.6, 2.2] }, { crasse: false, nuance: 0.07 });
    }
  }
  if (o.obstacle !== false) {
    // l'obstacle, découpé par tronçon
    const x1 = Math.max(Math.min(xa, xb), ctx.X0 - 1);
    const x2 = Math.min(Math.max(xa, xb), ctx.X1 + 1);
    if (Math.abs(xb - xa) < 0.01) {
      if (ctx.ici(xa)) b.obstacle(xa, za, xb, zb, "haie bocagère");
    } else if (x2 > x1) {
      const zA = za + ((zb - za) * (x1 - xa)) / (xb - xa);
      const zB = za + ((zb - za) * (x2 - xa)) / (xb - xa);
      b.obstacle(x1, zA, x2, zB, "haie bocagère");
    }
  }
}

/** Une clôture électrique morte : piquets de bois, fils lâches, isolateurs jaunes, un panneau. */
export function clotureElectrique(ctx, xa, za, xb, zb) {
  const { c, M } = ctx;
  const L = Math.hypot(xb - xa, zb - za);
  const n = Math.max(1, Math.round(L / 4));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = xa + (xb - xa) * t;
    const z = za + (zb - za) * t;
    if (!ctx.ici(x)) continue;
    const pench = (bruitXZ(x, z, 4) - 0.5) * 0.3;
    c.boite(0.08, 1.2, 0.08, PALETTE.boisGris, { x, y: 0.6, z, rz: pench }, M.mat);
    c.boite(0.04, 0.05, 0.05, 0xd9b23a, { x: x + 0.05, y: 0.95, z }, M.satin, { crasse: false });
    if (i < n) {
      const x2 = xa + (xb - xa) * ((i + 1) / n);
      const z2 = za + (zb - za) * ((i + 1) / n);
      if (bruitXZ(x, z, 9) < 0.8) barre(c, [x, 0.95, z], [(x + x2) / 2, 0.7, (z + z2) / 2], 0.012, 0.012, 0xb8b0a0, M.metal);
      if (bruitXZ(x, z, 10) < 0.7) barre(c, [(x + x2) / 2, 0.7, (z + z2) / 2], [x2, 0.95, z2], 0.012, 0.012, 0xb8b0a0, M.metal);
    }
  }
}

/** Un poteau téléphonique en bois, ses isolateurs ; les fils vers le suivant (les poteaux tiennent la route). */
export function poteauTelephone(ctx, x, z, suivant, o = {}) {
  const { c, M } = ctx;
  const h = o.h ?? 7;
  const pench = o.penche ?? 0;
  c.tube([x, 0, z], [x + pench, h, z], 0.12, 0x6a5440, M.mat, 6);
  c.boite(0.08, 0.1, 1.0, 0x5a4a38, { x: x + pench, y: h - 0.4, z }, M.mat);
  if (suivant) {
    for (const dz of [-0.4, 0.4]) {
      const [x2, z2, p2] = suivant;
      const xm = (x + pench + x2 + p2) / 2;
      barre(c, [x + pench, h - 0.35, z + dz], [xm, h - 0.95, (z + z2) / 2 + dz], 0.015, 0.015, 0x2a2a28, M.metal);
      barre(c, [xm, h - 0.95, (z + z2) / 2 + dz], [x2 + p2, h - 0.35, z2 + dz], 0.015, 0.015, 0x2a2a28, M.metal);
    }
  }
}

/** Un champ de maïs redevenu friche : pieds secs en rangs, la plupart cassés, des herbes hautes entre. */
export function friche(ctx, x1, z1, x2, z2, densite = 1) {
  const { c, M, u } = ctx;
  const tons = [0xb8a868, 0xa89858, 0x9a8a50, 0xc8b878, 0x8a8a52];
  for (let x = Math.ceil(x1 / 0.8) * 0.8; x < x2; x += 0.8) {
    if (!ctx.ici(x)) continue;
    for (let z = z1; z < z2; z += 0.75) {
      const k = bruitXZ(x, z, 31);
      if (k > 0.55 * densite) continue;
      const xx = x + (bruitXZ(x, z, 32) - 0.5) * 0.25;
      const zz = z + (bruitXZ(x, z, 33) - 0.5) * 0.3;
      const casse = bruitXZ(x, z, 34) < 0.35 + u * 0.3;
      const h = casse ? 0.7 + k * 0.6 : 1.6 + k * 0.9;
      const ton = tons[Math.floor(bruitXZ(x, z, 35) * tons.length)];
      c.poser(GEO.tige, M.mat, ton, { x: xx, y: h / 2, z: zz, rz: (k - 0.25) * 0.6, rx: (bruitXZ(x, z, 36) - 0.5) * 0.4, e: [1, h, 1] }, { crasse: false, nuance: 0.06 });
      if (k < 0.4) c.poser(GEO.feuilleMais, M.toile, ton, { x: xx, y: h * 0.6, z: zz, ry: k * 9, rz: 0.8 }, { crasse: false, nuance: 0.05 });
    }
  }
}
