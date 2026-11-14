// Tronçon 3 : la jardinerie-animalerie Jardi-Abondance et ses serres crevées, la concession aux trois tracteurs jamais
// livrés, les champs de maïs en friche.

import * as THREE from "three";
import { PALETTE, mur, touffes, semerTouffes, gravats, debris, jonchee, mousse, arbuste, arbre, flaque, lierre } from "../commun/atelier.js";
import { R } from "./atlas.js";
import { bruit, bruitXZ, teinte, coucheStricte, panneau, panneauDouble, barre, obstacleBoite } from "./outils.js";
import { COUL, GEO, voiture, tracteur, botte, palette, pneus, cone, lanterne, caisse, friche } from "./objets.js";
import { MAGASIN, SERRE, CONCESSION, BUREAU, C } from "./plan.js";
import { murCoupe, ouv } from "./bati.js";

const VERT = 0x4f8a4a;
const TERREAU = [0x6a4a8a, 0x3f7a4a, 0x8a5a3a, 0x5a6a8a];

/** Une pile de sacs de terreau sur palette. */
function sacsTerreau(ctx, x, z, rangs = 3, ry = 0) {
  const { c, M } = ctx;
  palette(ctx, x, z, { ry });
  c.repere({ x, y: 0.15, z, ry }, () => {
    for (let r = 0; r < rangs; r++)
      for (let i = 0; i < 4; i++) {
        if (r === rangs - 1 && bruit(i, r, Math.round(x * 3)) < 0.3) continue;
        const dx = (i % 2) * 0.58 - 0.29;
        const dz = Math.floor(i / 2) * 0.42 - 0.21;
        c.boite(0.55, 0.16, 0.4, TERREAU[(i + r + Math.round(x)) % 4], { x: dx, y: 0.08 + r * 0.16, z: dz, ry: (r % 2) * 0.05 }, M.toile, { nuance: 0.06 });
      }
  });
}

/** Un chariot de supermarché (grillage simplifié), parfois renversé. */
function chariot(ctx, x, z, ry, renverse = false) {
  const { c, M } = ctx;
  c.repere(renverse ? { x, y: 0.45, z, ry, rx: Math.PI / 2 } : { x, y: 0, z, ry }, () => {
    c.boite(0.9, 0.5, 0.55, 0xb8bcbc, { y: 0.75 }, M.metal);
    c.boite(0.86, 0.46, 0.51, 0x5a5e60, { y: 0.77 }, M.metal);
    c.boite(0.05, 0.05, 0.6, 0x2f6f73, { x: -0.55, y: 1.05 }, M.satin);
    for (const [dx, dz] of [[-0.35, -0.22], [0.35, -0.22], [-0.35, 0.22], [0.35, 0.22]]) {
      c.boite(0.03, 0.45, 0.03, 0x9a9e9e, { x: dx, y: 0.3, z: dz }, M.metal);
      c.boite(0.08, 0.08, 0.04, 0x2a2a28, { x: dx, y: 0.05, z: dz }, M.mat);
    }
  });
}

// ---------- Le magasin ----------

function magasin(ctx) {
  const { x0, x1, z0, z1, zs, h } = MAGASIN;
  const xm = (x0 + x1) / 2;
  const zc = (z0 + z1) / 2;
  if (!ctx.ici(xm)) return;
  const { c, M, b, u } = ctx;
  const haut = coucheStricte(b, "toit et enseigne de la jardinerie", { x: xm, z: zc, l: x1 - x0 + 1, p: z1 - z0 + 1 }, 1.1, h + 2.2, [M.tole, M.mat, M.satin, M.enseignes]);
  const bardage = { h, ep: 0.25, couleur: 0xd8d4c4, mat: M.tole, interieur: { couleur: 0xe8e4d8, mat: M.mat } };
  const vit = (uu, l = 3.4) => ({ u: uu, l, bas: 0.4, haut: 3.3, type: "fenetre", bris: 0.4 + u * 0.5, cadre: 0x3a6a3a, croisillons: 1, traverses: 1 });
  murCoupe(ctx, haut, [x0, z1], [x1, z1], { ...bardage, ouvertures: [vit(2.4), vit(6.2), ouv.porte(10, 2.6, 2.6), vit(13.8), vit(17.6)] }, 1.1);
  murCoupe(ctx, haut, [x1, z1], [x1, z0], { ...bardage, ouvertures: [vit(4, 2.6), { u: 12.4, l: 3, bas: 0, haut: 3.2, type: "vide" }] }, 1.1);
  murCoupe(ctx, haut, [x1, z0], [x0, z0], bardage, h);
  murCoupe(ctx, haut, [x0, z0], [x0, z1], { ...bardage, ouvertures: [ouv.porte(9, 1.2)] }, h);
  // la cloison de la réserve (coupée à 1,2 m)
  murCoupe(ctx, haut, [x1, zs], [x0, zs], { h, ep: 0.15, couleur: 0xe8e4d8, mat: M.mat, ouvertures: [ouv.porte(4, 2.4, 2.6), ouv.porte(14, 1.0)] }, 1.2);
  c.pave(x0, 0, z0, x1, 0.04, z1, 0xb0aca0, M.lisse, { crasse: false });
  // le toit plat (bacs acier, des tôles manquent), l'acrotère, le grand fronton de l'enseigne
  for (let i = 0; i < 10; i++) {
    if (bruit(i, 1, 131) < u * 0.3) continue;
    haut.boite(2.02, 0.08, z1 - z0 + 0.4, 0xb8bcb8, { x: x0 + 1 + i * 2, y: h + 0.04, z: zc }, M.tole, { nuance: 0.03 });
  }
  for (let i = 0; i < 5; i++) haut.boite(0.15, 0.4, z1 - z0, 0x6a6e6a, { x: x0 + 2 + i * 4, y: h - 0.2, z: zc }, M.tole);
  haut.pave(x0 - 0.1, h, z1 - 0.1, x1 + 0.1, h + 1.6, z1 + 0.15, VERT, M.satin);
  panneau(haut, M.enseignes, R.jardinerie, { x: xm, y: h + 0.8, z: z1 + 0.17 }, 13, 1.6);
  haut.pave(x1 - 0.1, h, z0, x1 + 0.15, h + 0.6, z1, VERT, M.satin);
  panneau(haut, M.enseignes, R.kitPotager, { x: x1 + 0.17, y: 2.6, z: zc + 1, ry: Math.PI / 2 }, 3.2, 1.6);
  // l'auvent d'entrée
  haut.pave(xm - 3, 3.0, z1, xm + 3, 3.15, z1 + 2.2, VERT, M.satin);
  for (const s of [-1, 1]) c.tube([xm + s * 2.8, 0, z1 + 2], [xm + s * 2.8, 3.0, z1 + 2], 0.06, 0x3a6a3a, M.metal, 6);
  // les portes coulissantes forcées
  c.boite(1.3, 2.5, 0.04, 0xc8d8d8, { x: xm - 1.9, y: 1.3, z: z1 + 0.12 }, M.verre, { crasse: false });
  c.boite(1.3, 2.5, 0.04, 0xc8d8d8, { x: xm + 2.1, y: 1.3, z: z1 + 0.2, ry: -0.1 }, M.verre, { crasse: false });

  // --- Les caisses, les gondoles de graines, les sacs, le mur d'outils
  for (const cx of [27, 30.2]) {
    c.boite(2.2, 0.9, 0.7, 0xd8d4c8, { x: cx, y: 0.45, z: z1 - 2.2 }, M.satin);
    c.boite(0.4, 0.3, 0.35, 0x2a2a28, { x: cx + 0.6, y: 1.05, z: z1 - 2.3 }, M.lisse);
    c.boite(0.6, 0.06, 0.5, 0x2a2a28, { x: cx - 0.5, y: 0.93, z: z1 - 2.2 }, M.metal);
  }
  for (const gx of [27, 30.5, 34]) {
    c.boite(0.6, 1.7, 5.4, 0x8a9a8a, { x: gx, y: 0.85, z: -21.8 }, M.tole);
    for (const s of [-1, 1]) {
      for (const y of [0.6, 1.1, 1.55]) c.boite(0.35, 0.03, 5.3, 0xa8b0a8, { x: gx + s * 0.45, y, z: -21.8 }, M.tole);
      panneau(c, M.enseignes, R.graines, { x: gx + s * 0.31, y: 1.15, z: -21.8, ry: s * Math.PI / 2 }, 5.0, 0.7);
    }
    obstacleBoite(b, gx, -21.8, 1.2, 5.4, 0, "gondole");
  }
  // les sachets tombés, renversés au sol
  jonchee(c, 26, -25, 35, -18, 30, [0xd8402a, 0xe0a020, 0x6aa84a, 0x8a4aa0, 0x3a7ac0]);
  for (const [sx, sz] of [[37.2, -24], [37.2, -21.2]]) sacsTerreau(ctx, sx, sz, 4);
  // le mur des outils : bêches, râteaux, fourches, pendus au mur ouest
  for (let i = 0; i < 9; i++) {
    if (bruit(i, 2, 131) < u * 0.4) continue;
    const tz = -25 + i * 0.6;
    barre(c, [x0 + 0.3, 0.4, tz], [x0 + 0.3, 1.9, tz], 0.035, 0.035, PALETTE.bois, M.mat);
    c.boite(0.03, 0.3, 0.22, 0x8a8e8a, { x: x0 + 0.3, y: 0.35, z: tz }, M.metal);
  }
  c.boite(0.3, 0.04, 6.0, 0x6a6a64, { x: x0 + 0.3, y: 2.0, z: -22.4 }, M.metal);
  // le présentoir du kit potager connecté : l'écran luit encore (sur sa batterie)
  c.repere({ x: 33, y: 0, z: -17.6 }, () => {
    c.boite(2.0, 0.8, 1.0, 0xe8e4d8, { y: 0.4 }, M.satin);
    for (let i = 0; i < 3; i++) {
      c.boite(0.55, 0.25, 0.35, 0x3a3a38, { x: -0.65 + i * 0.65, y: 0.93, z: -0.15 }, M.lisse);
      c.poser(GEO.boule, M.mat, 0x8a7a4a, { x: -0.65 + i * 0.65, y: 1.1, z: -0.15, e: [0.2, 0.12, 0.14] });
    }
    c.boite(0.6, 0.4, 0.05, 0x2a2a28, { y: 1.2, z: 0.3, rx: -0.3 }, M.lisse);
    panneau(c, M.neon, R.kitEcran, { y: 1.2, z: 0.33, rx: -0.3 }, 0.52, 0.27);
  });
  ctx.b.lumiere(33, 1.4, -16.9, 0x9fe07a, 1.8, 5, "écran du kit potager connecté (« abonnement expiré »), sur batterie");
  // --- L'animalerie : aquariums vides sur leurs étagères, cages, croquettes
  for (let t = 0; t < 3; t++) {
    c.boite(0.6, 0.05, 5.5, 0x5a5e60, { x: x1 - 0.5, y: 0.4 + t * 0.7, z: -21.8 }, M.metal);
    for (let i = 0; i < 4; i++) {
      if (bruit(i, t, 141) < u * 0.25) {
        debris(c, x1 - 1.6, -24 + i * 1.3, x1 - 0.8, -23.4 + i * 1.3, 4, [0xc8d8d8, 0xb8c8c8]);
        continue;
      }
      c.boite(0.5, 0.45, 1.2, 0xc8d8d8, { x: x1 - 0.5, y: 0.66 + t * 0.7, z: -23.8 + i * 1.32 }, M.verre, { crasse: false });
      c.boite(0.48, 0.06, 1.18, 0x6a5a40, { x: x1 - 0.5, y: 0.46 + t * 0.7, z: -23.8 + i * 1.32 }, M.mat, { crasse: false });
    }
  }
  for (const [dx, dz] of [[-0.25, -24.6], [-0.25, -19]]) c.boite(0.05, 2.0, 0.05, 0x3a3a38, { x: x1 - 0.5 + dx, y: 1.0, z: dz }, M.metal);
  panneau(c, M.enseignes, R.aquarium, { x: x1 - 0.85, y: 2.45, z: -21.8, ry: -Math.PI / 2 }, 1.2, 0.6);
  for (let i = 0; i < 4; i++) {
    const cx = 39.4 + (i % 2) * 1.1;
    const cz = -25.6 + Math.floor(i / 2) * 1.0;
    const y = 0;
    c.repere({ x: cx, y, z: cz, ry: i * 0.2 }, () => {
      c.boite(0.9, 0.04, 0.7, 0x3a3a38, { y: 0.02 }, M.metal);
      for (const [ex, ez] of [[-0.45, -0.35], [0.45, -0.35], [-0.45, 0.35], [0.45, 0.35]]) c.boite(0.03, 0.7, 0.03, 0x8a8e8a, { x: ex, y: 0.35, z: ez }, M.metal);
      for (let k = 0; k < 6; k++) c.boite(0.015, 0.68, 0.015, 0xa8aca8, { x: -0.3 + k * 0.12, y: 0.35, z: 0.35 }, M.metal);
      c.boite(0.92, 0.03, 0.72, 0x8a8e8a, { y: 0.71 }, M.metal);
    });
  }
  for (let i = 0; i < 6; i++) c.boite(0.5, 0.65, 0.2, i % 2 ? 0xc79a3b : 0x8a3a3a, { x: 41.4 + (i % 3) * 0.55, y: 0.33, z: -17.4, ry: (bruit(i, 3, 141) - 0.5) * 0.4 }, M.toile, { nuance: 0.06 });
  // --- La réserve : engrais, arrosoirs, palettes
  for (const [sx, sz] of [[27, -29], [29.2, -29.4], [34.5, -29]]) sacsTerreau(ctx, sx, sz, 3);
  for (let i = 0; i < 8; i++) c.boite(0.55, 0.7, 0.3, 0xd8d0c0, { x: 37.4 + (i % 4) * 0.6, y: 0.35 + Math.floor(i / 4) * 0.7, z: -30.4 }, M.toile, { nuance: 0.05 });
  for (let i = 0; i < 5; i++) {
    const ax = 41.8 + (i % 2) * 0.5;
    const az = -29 + i * 0.4;
    c.tube([ax, 0, az], [ax, 0.35, az], 0.15, 0x3a8a5a, M.satin, 7);
    barre(c, [ax + 0.12, 0.25, az], [ax + 0.4, 0.4, az], 0.03, 0.03, 0x3a8a5a, M.satin);
  }
  palette(ctx, 31.5, -30, { debout: true });
  // les dalles tombées, le toit qui fuit (une flaque), les feuilles entrées par les vitrines
  for (let i = 0; i < 10; i++) c.boite(0.6, 0.02, 0.6, 0xd8d4c8, { x: x0 + 1 + bruit(i, 4, 141) * 18, y: 0.06, z: z0 + 1 + bruit(i, 5, 141) * 13, ry: i }, M.mat, { crasse: false });
  flaque(c, 30.5, -25.6, 1.0);
  jonchee(c, x0 + 0.5, -19, x1 - 0.5, z1 - 0.5, 20);
  if (u > 0.5) gravats(c, 36, -27.6, 0.9, 6, [0xd8d4c4, 0xb8bcb8]);
  lierre(c, x0 - 0.15, 0, -27, -Math.PI / 2, 4, 2 + u * 2, Math.round(20 + u * 40));
}

// ---------- Les serres ----------

function serres(ctx) {
  const { x0, x1, z0, z1, h, hf } = SERRE;
  const xm = (x0 + x1) / 2;
  const zc = (z0 + z1) / 2;
  if (!ctx.ici(xm)) return;
  const { c, M, b, u } = ctx;
  const alu = 0xc8ccc8;
  const vitre = (pose, l, hh) => {
    const r = bruitXZ(pose.x, pose.z + pose.y, 151);
    if (r > 0.25 + u * 0.55) c.boite(l, hh, 0.02, 0xe0ecec, pose, M.verre, { crasse: false });
    else if (r > 0.12) c.boite(l * 0.5, hh * 0.35, 0.02, 0xe0ecec, { ...pose, y: pose.y - hh * 0.3 }, M.verre, { crasse: false });
  };
  c.pave(x0, 0, z0, x1, 0.12, z1, 0xa8a49a, M.mat);
  // les montants et les vitres des long pans (sud, nord) et des pignons
  for (let x = x0; x <= x1 + 0.01; x += 2) {
    for (const z of [z0, z1]) c.boite(0.07, h, 0.07, alu, { x, y: h / 2, z }, M.metal);
    if (x < x1 - 0.01) for (const z of [z0, z1]) vitre({ x: x + 1, y: h / 2, z }, 1.95, h - 0.1);
    // les fermes du toit
    for (const s of [-1, 1]) barre(c, [x, h, s > 0 ? z1 : z0], [x, h + hf, zc], 0.06, 0.06, alu, M.metal);
    // les pans de toit vitrés (beaucoup manquent)
    if (x < x1 - 0.01) for (const s of [-1, 1]) {
      const r = bruitXZ(x, s, 152);
      if (r < 0.3 + u * 0.45) continue;
      const pz = (zc + (s > 0 ? z1 : z0)) / 2;
      const pente = Math.atan2(hf, (z1 - z0) / 2);
      c.boite(1.95, 0.02, Math.hypot(hf, (z1 - z0) / 2), 0xe0ecec, { x: x + 1, y: h + hf / 2, z: pz, rx: s * pente }, M.verre, { crasse: false });
    }
  }
  c.boite(x1 - x0, 0.08, 0.08, alu, { x: xm, y: h + hf, z: zc }, M.metal);
  for (const z of [z0, z1]) c.boite(x1 - x0, 0.08, 0.08, alu, { x: xm, y: h, z }, M.metal);
  for (const x of [x0, x1]) {
    for (let z = z0; z < z1 - 0.01; z += 2.6) {
      c.boite(0.07, h, 0.07, alu, { x, y: h / 2, z }, M.metal);
      if (x === x1 && Math.abs(z + 1.3 - (-24.2)) < 1.4) continue; // la porte des serres
      vitre({ x, y: h / 2, z: z + 1.3, ry: Math.PI / 2 }, 2.55, h - 0.1);
    }
  }
  b.obstacle(x0, z0, x1, z0, "serre");
  b.obstacle(x0, z1, x1, z1, "serre");
  b.obstacle(x0, z0, x0, z1, "serre");
  b.obstacle(x1, z0, x1, -25.4, "serre");
  b.obstacle(x1, -23, x1, z1, "serre");
  // les tables de culture, les pots, les plants morts et ceux qui ont tout envahi
  for (const tz of [-28.6, -24.5, -20.4]) {
    c.boite(x1 - x0 - 3, 0.06, 1.4, 0x8a8e8a, { x: xm - 0.6, y: 0.8, z: tz }, M.metal);
    for (let k = 0; k < 6; k++) c.boite(0.05, 0.8, 1.3, 0x6a6e6a, { x: x0 + 1 + k * 2.4, y: 0.4, z: tz }, M.metal);
    for (let i = 0; i < 18; i++) {
      const px = x0 + 0.8 + i * 0.72;
      if (bruit(i, Math.round(tz), 153) < 0.2) continue;
      for (const dz of [-0.35, 0.35]) {
        c.tube([px, 0.83, tz + dz], [px, 1.05, tz + dz], 0.13, 0xa8603a, M.mat, 6);
        const vivant = bruit(i, Math.round(tz * dz), 154) < 0.25 + u * 0.3;
        c.poser(GEO.boule, M.mat, vivant ? 0x5d8a46 : 0x8a7a52, { x: px, y: 1.2 + (vivant ? 0.15 : 0), z: tz + dz, ry: i, e: vivant ? [0.3, 0.35, 0.3] : [0.15, 0.2, 0.15] }, { crasse: false, nuance: 0.08 });
      }
    }
    obstacleBoite(b, xm - 0.6, tz, x1 - x0 - 3, 1.4, 0, "table de culture");
  }
  // la vigne vierge et les tomates redevenues sauvages qui grimpent aux montants
  for (let i = 0; i < 8 + u * 10; i++) {
    const px = x0 + bruit(i, 1, 155) * (x1 - x0);
    const pz = bruit(i, 2, 155) < 0.5 ? z1 - 0.3 : z0 + 0.3;
    c.poser(GEO.boule, M.mat, i % 2 ? 0x5d8a46 : 0x4f7a3c, { x: px, y: 0.6 + bruit(i, 3, 155) * 1.6, z: pz, ry: i, e: [0.7, 0.6, 0.35] }, { crasse: false, nuance: 0.08 });
  }
  debris(c, x0 + 0.5, z0 + 0.5, x1 - 0.5, z1 - 0.5, Math.round(16 + u * 20), [0xe0ecec, 0xc8d8d8, 0xb8c8c8]);
  semerTouffes(c, x0 + 0.5, z0 + 0.5, x1 - 0.5, z1 - 0.5, Math.round(10 + u * 16), PALETTE.herbe, 0.12);
}

// ---------- Devant la jardinerie : l'aire de vente, le parking ----------

function devanture(ctx) {
  const { c, M, b, u } = ctx;
  if (ctx.ici(13)) {
    // les palettes de terreau et de paillage, les tables de plants, les chariots
    for (const [sx, sz, r] of [[7, -14.5, 0.1], [8.6, -14.6, -0.05], [10.2, -14.4, 0.2], [7.6, -12.6, 0.3], [14.2, -13.4, 0]]) sacsTerreau(ctx, sx, sz, 3 + (Math.round(sx) % 2), r);
    obstacleBoite(b, 8.6, -14.5, 4.8, 1.2, 0, "palettes de terreau");
    for (const tz of [-16.4, -12.0]) {
      c.boite(4.4, 0.05, 1.0, 0x8a8e8a, { x: 18.2, y: 0.75, z: tz }, M.metal);
      for (const dx of [-2, 2]) c.boite(0.05, 0.75, 0.9, 0x6a6e6a, { x: 18.2 + dx, y: 0.37, z: tz }, M.metal);
      for (let i = 0; i < 8; i++) {
        c.tube([16.4 + i * 0.5, 0.78, tz], [16.4 + i * 0.5, 0.95, tz], 0.1, 0xa8603a, M.mat, 6);
        c.poser(GEO.boule, M.mat, bruit(i, Math.round(tz), 161) < 0.4 ? 0x6a8a4a : 0x8a7a52, { x: 16.4 + i * 0.5, y: 1.05, z: tz, e: 0.13 });
      }
    }
    chariot(ctx, 12.4, -10.6, 0.6);
    chariot(ctx, 21.4, -8.6, 2.2, true);
    // le grand pot de terre cuite renversé, le nain géant de l'enseigne (les nains du rond-point viennent d'ici)
    c.tube([5.6, 0.5, -10.4], [6.9, 0.5, -10.0], 0.5, 0xa8603a, M.mat, 9);
    flaque(c, 15, -9.6, 1.1);
  }
  if (ctx.ici(35)) {
    // le parking : places, deux voitures, des chariots égarés
    for (let i = 0; i < 9; i++) c.boite(0.1, 0.01, 4.2, 0xd8d4c8, { x: 24 + i * 2.6, y: 0.03, z: -11.4 }, M.satin, { crasse: false });
    voiture(ctx, 28.3, -11.5, Math.PI / 2 + 0.05, { couleur: 0x5d6b4a, coffre: true });
    voiture(ctx, 38.7, -11.3, Math.PI / 2 - 0.08, { couleur: 0x8e4a3e });
    chariot(ctx, 33.6, -9.4, 1.0);
    chariot(ctx, 42.6, -13.8, -0.4, true);
    chariot(ctx, 44.5, -7.4, 0.2);
    for (let i = 0; i < 4; i++) cone(ctx, 46 + i * 0.6, -14.6 + (i % 2) * 0.4);
    semerTouffes(c, 22, -15.5, 48, -5, Math.round(12 + u * 20));
  }
}

// ---------- La concession ----------

function concession(ctx) {
  const { x0, x1, z0, z1 } = CONCESSION;
  const xm = (x0 + x1) / 2;
  if (!ctx.ici(xm)) return;
  const { c, M, b, u } = ctx;
  // le grillage de la concession (poteaux, deux fils, des panneaux de treillis par endroits)
  const cote = (xa, za, xb, zb, trou) => {
    const L = Math.hypot(xb - xa, zb - za);
    const n = Math.round(L / 2.5);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = xa + (xb - xa) * t;
      const z = za + (zb - za) * t;
      if (trou && x > trou[0] && x < trou[1]) continue;
      c.boite(0.06, 1.8, 0.06, 0x5a6a5a, { x, y: 0.9, z, rz: (bruitXZ(x, z, 3) - 0.5) * 0.1 }, M.metal);
      if (i < n && !(trou && x + (xb - xa) / n > trou[0] && x < trou[1])) {
        const x2 = xa + (xb - xa) * ((i + 1) / n);
        const z2 = za + (zb - za) * ((i + 1) / n);
        if (bruitXZ(x, z, 4) < 0.85 - u * 0.4) c.boite(Math.hypot(x2 - x, z2 - z), 1.6, 0.02, 0x8a9a8a, { x: (x + x2) / 2, y: 0.85, z: (z + z2) / 2, ry: -Math.atan2(z2 - z, x2 - x) }, M.verre, { crasse: false });
        barre(c, [x, 1.75, z], [x2, 1.75, z2], 0.02, 0.02, 0x5a6a5a, M.metal);
      }
    }
  };
  cote(x0, z0, x1, z0, [13.5, 20.5]);
  cote(x0, z0, x0, z1);
  cote(x0, z1, x1, z1);
  b.obstacle(x0, z0, 13.5, z0, "grillage");
  b.obstacle(20.5, z0, x1, z0, "grillage");
  b.obstacle(x0, z0, x0, z1, "grillage");
  b.obstacle(x0, z1, x1, z1, "grillage");
  // le portail ouvert
  c.boite(3.4, 1.7, 0.05, 0x5a6a5a, { x: 13.6, y: 0.9, z: z0 + 1.7, ry: 1.4 }, M.metal);
  // le grand panneau à double face, les oriflammes délavées
  for (const s of [-1, 1]) c.tube([17 + s * 3.2, 0, 10.6], [17 + s * 3.2, 5.6, 10.6], 0.12, 0x6a6e70, M.metal, 6);
  c.boite(8.4, 4.2, 0.2, 0x3a3e40, { x: 17, y: 4.4, z: 10.6 }, M.tole);
  panneauDouble(c, M.enseignes, R.tracteurs, { x: 17, y: 4.4, z: 10.6 }, 8, 4, 0.11);
  obstacleBoite(b, 17, 10.6, 6.6, 0.3, 0, "pieds du panneau");
  for (let i = 0; i < 4; i++) {
    const fx = 6.2 + i * 1.6;
    c.tube([fx, 0, 13.2], [fx, 4.4, 13.2], 0.03, 0xb8bcb8, M.metal, 4);
    const lg = 2.4 - (bruit(i, 1, 171) < u ? 0.9 : 0);
    c.boite(0.02, lg, 0.6, i % 2 ? 0xc79a3b : 0x4a7a3a, { x: fx, y: 4.3 - lg / 2, z: 13.55, rx: (bruit(i, 2, 171) - 0.5) * 0.15 }, M.toile, { crasse: false });
  }
  // les trois tracteurs autonomes neufs, jamais livrés, sous leur film plastique
  tracteur(ctx, 10.5, 21.5, -0.55, 0x4a7a3a, { neuf: true });
  tracteur(ctx, 17.5, 23.5, -0.55, 0x4a7a3a, { neuf: true });
  tracteur(ctx, 24.5, 21.5, -0.55, 0x4a7a3a, { neuf: true });
  // les cales, une pile de pneus neufs encore étiquetés, la remorque de livraison
  for (const [tx, tz] of [[10.5, 21.5], [17.5, 23.5], [24.5, 21.5]]) c.boite(0.3, 0.2, 0.4, 0xd9b23a, { x: tx - 1.0, y: 0.1, z: tz + 1.9 }, M.satin);
  pneus(ctx, 28.6, 27.8, 4);
  pneus(ctx, 27.6, 28.4, 3);
  c.repere({ x: 13, y: 0, z: 27.6, ry: 0.05 }, () => {
    c.boite(9, 0.2, 2.5, 0x3a3a38, { y: 0.9 }, M.tole);
    for (const s of [-1, 1]) c.boite(9, 0.3, 0.05, 0xc79a3b, { y: 1.15, z: s * 1.24 }, M.satin);
    for (const wx of [-0.7, 0.7]) for (const s of [-1, 1]) c.tube([wx, 0.45, s * 1.0], [wx, 0.45, s * 1.25], 0.45, COUL.pneu, M.mat, 8);
    barre(c, [4.5, 0.9, 0], [6.2, 0.5, 0], 0.12, 0.12, 0x3a3a38, M.metal);
  });
  obstacleBoite(b, 13, 27.6, 9, 2.5, 0.05, "plateau de livraison");
  semerTouffes(c, x0 + 0.5, z0 + 0.5, x1 - 0.5, z1 - 0.5, Math.round(16 + u * 24));
}

function bureau(ctx) {
  const { x0, x1, z0, z1, h } = BUREAU;
  const xm = (x0 + x1) / 2;
  const zc = (z0 + z1) / 2;
  if (!ctx.ici(xm)) return;
  const { c, M, b, u } = ctx;
  const haut = coucheStricte(b, "toit du bureau préfabriqué", { x: xm, z: zc, l: x1 - x0 + 1, p: z1 - z0 + 1 }, 1.1, h + 0.6, [M.tole, M.mat]);
  const module = { h, ep: 0.15, couleur: 0xd8d4c4, mat: M.tole, interieur: { couleur: 0xe0dcd0, mat: M.mat } };
  const F = (uu) => ouv.fenetre(uu, 1.4, 1.0, 2.0, { bris: 0.4 + u * 0.5, cadre: 0x8a8e8a });
  // posé sur des cales : le plancher à 0,2 m (une marche)
  c.pave(x0 - 0.1, 0, z0 - 0.1, x1 + 0.1, 0.2, z1 + 0.1, 0x8a8a84, M.tole);
  c.pave(x0 + 2.6, 0, z1 + 0.1, x0 + 3.8, 0.1, z1 + 0.8, 0x9a9690, M.mat);
  murCoupe(ctx, haut, [x0, z1], [x1, z1], { ...module, ouvertures: [ouv.porte(3.2, 0.95, 2.1), F(5.6)] }, 1.1);
  murCoupe(ctx, haut, [x1, z1], [x1, z0], { ...module, ouvertures: [F(2.5)] }, 1.1);
  murCoupe(ctx, haut, [x1, z0], [x0, z0], module, h);
  murCoupe(ctx, haut, [x0, z0], [x0, z1], module, h);
  haut.pave(x0 - 0.2, h, z0 - 0.2, x1 + 0.2, h + 0.2, z1 + 0.2, 0xb8bcb8, M.tole);
  haut.pave(x0 - 0.2, h + 0.2, z1 + 0.05, x1 + 0.2, h + 0.5, z1 + 0.2, 0x4a7a3a, M.tole);
  // le bureau du vendeur : catalogues, tableau des clés, calendrier, machine à café ; la lanterne d'un squatteur
  c.boite(1.6, 0.05, 0.8, 0xd8d0b8, { x: 36.4, y: 0.95, z: 15.6 }, M.satin);
  for (const dx of [-0.7, 0.7]) c.boite(0.05, 0.75, 0.75, 0x6a6e70, { x: 36.4 + dx, y: 0.58, z: 15.6 }, M.metal);
  c.boite(0.5, 0.06, 0.5, 0x2a3a5a, { x: 36.3, y: 0.65, z: 16.6, ry: 0.4 }, M.satin);
  c.boite(0.5, 0.5, 0.06, 0x2a3a5a, { x: 36.3, y: 0.95, z: 16.85, ry: 0.4 }, M.satin);
  for (let i = 0; i < 4; i++) c.boite(0.3, 0.03, 0.22, [0x4a7a3a, 0xc79a3b, 0xe8e4d8, 0x4a7a3a][i], { x: 35.9 + i * 0.25, y: 0.99 + i * 0.03, z: 15.5, ry: i * 0.3 }, M.mat, { crasse: false });
  c.boite(0.8, 0.6, 0.04, 0x8a6a44, { x: x0 + 0.12, y: 1.6, z: 16, ry: Math.PI / 2 }, M.mat);
  for (let i = 0; i < 6; i++) c.boite(0.03, 0.08, 0.03, 0xb8963e, { x: x0 + 0.16, y: 1.5 + (i % 2) * 0.2, z: 15.75 + Math.floor(i / 2) * 0.2 }, M.metal);
  c.boite(0.5, 1.3, 0.5, 0x6a6e70, { x: x1 - 0.5, y: 0.85, z: z0 + 0.45 }, M.tole);
  c.boite(0.6, 0.4, 0.8, 0x7a5a6a, { x: 34.2, y: 0.4, z: 14.4 }, M.toile);
  c.boite(1.6, 0.15, 0.7, 0x5a6a8a, { x: 34.4, y: 0.28, z: 14.4 }, M.toile);
  lanterne(ctx, 35.2, 0.95, 15.4);
  ctx.b.lumiere(35.2, 1.3, 15.4, 0xffc46a, 2.5, 7, "lanterne d'un voyageur qui dort dans le bureau de la concession");
  jonchee(c, x0 + 0.3, z0 + 0.3, x1 - 0.3, z1 - 0.3, 14, [0xe8e4d6, 0x4a7a3a, 0xc79a3b]);
}

function champs(ctx) {
  const { c, u } = ctx;
  friche(ctx, 32, 12.5, 56, 32.6, 1);
  friche(ctx, 5.5, 30.6, 31, 32.6, 0.8);
  if (ctx.ici(45)) {
    arbre(c, 46, 31.8, 9, "feuillu");
    botte(ctx, 52, 24, { ronde: true, ry: 0.4, vieille: 0.9 });
  }
}

export const TRONCON3 = [magasin, serres, devanture, concession, bureau, champs];
