// Tronçon 4 : la voie rapide en remblai et son pont-cadre de béton sombre (goulet n° 2), le camion encastré sous le
// gabarit, les voitures coincées, le feu des survivants, la sortie vers la campagne.

import * as THREE from "three";
import { PALETTE, touffes, semerTouffes, gravats, debris, jonchee, mousse, arbuste, arbre, flaque } from "../commun/atelier.js";
import { R } from "./atlas.js";
import { bruit, bruitXZ, panneau, panneauDouble, barre, obstacleBoite } from "./outils.js";
import { COUL, GEO, voiture, porteurEncastre, palette, pneus, cone, jersey, feuDeCamp, lanterne, caisse, conserves, botte, friche } from "./objets.js";
import { VR, W, remblai } from "./plan.js";

const BETON = 0x8a8780;
const BETON_SOMBRE = 0x6a6862;

/** Un mur qui suit une pente (profil `hauteurA`), de xa à xb, entre z0 et z1 : le bas jusqu'à `coupe` dans la base,
 * le haut dans la couche `k` (null : tout dans la base). */
function murEnPente(ctx, k, xa, xb, z0, z1, hauteurA, coupe) {
  const { c, M } = ctx;
  const lo = Math.min(xa, xb);
  const hi = Math.max(xa, xb);
  const profil = (yb, chantier) => {
    const pts = [new THREE.Vector2(lo, yb), new THREE.Vector2(hi, yb)];
    for (let i = 8; i >= 0; i--) {
      const x = lo + ((hi - lo) * i) / 8;
      pts.push(new THREE.Vector2(x, Math.max(yb + 0.01, hauteurA(x))));
    }
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: z1 - z0, bevelEnabled: false });
    chantier.poser(g, M.beton, BETON, { z: z0 }, { nuance: 0.015 });
    g.dispose();
  };
  if (coupe === null) profil(0, c);
  else {
    c.pave(lo, 0, z0, hi, coupe, z1, BETON, M.beton, { nuance: 0.015 });
    profil(coupe, k);
  }
}

function pontCadre(ctx) {
  if (!ctx.ici(73)) return;
  const { c, M, b, u } = ctx;
  const k = ctx.voieRapide;
  const { a, d, h, couloir, mur: zm, cadre0, cadre1, sous } = VR;
  // --- Le cadre : deux voiles, la dalle, les têtes, les murs en aile
  c.pave(cadre0, 0, -couloir, cadre1, sous, -zm, BETON_SOMBRE, M.beton);
  c.pave(cadre0, 0, zm, cadre1, 1.1, couloir, BETON_SOMBRE, M.beton);
  k.pave(cadre0, 1.1, zm, cadre1, sous, couloir, BETON_SOMBRE, M.beton);
  k.pave(cadre0 - 0.2, sous, -couloir - 0.6, cadre1 + 0.2, sous + 0.8, couloir + 0.6, BETON, M.beton);
  // le remblai au-dessus de la dalle (entre les têtes), jusqu'à la chaussée de la voie rapide
  k.pave(cadre0 + 0.3, sous + 0.8, -couloir - 0.6, cadre1 - 0.3, h - 0.05, couloir + 0.6, 0x7a6a50, M.mat);
  for (const xt of [cadre0, cadre1]) {
    k.pave(xt - 0.35, sous, -couloir - 0.6, xt + 0.35, h + 0.55, couloir + 0.6, BETON, M.beton);
    k.pave(xt - 0.45, h + 0.45, -couloir - 0.6, xt + 0.45, h + 0.6, couloir + 0.6, 0xa8a49a, M.beton);
  }
  // les murs en aile : ils retiennent le remblai à l'entrée et à la sortie
  const pente = (x) => remblai(x) + 0.35;
  for (const s of [-1, 1]) {
    const z0 = s < 0 ? -couloir : zm;
    const z1 = s < 0 ? -zm : couloir;
    murEnPente(ctx, k, a, cadre0, z0, z1, pente, s < 0 ? null : 1.1);
    murEnPente(ctx, k, cadre1, d, z0, z1, pente, s < 0 ? null : 1.1);
  }
  for (const s of [-1, 1]) b.obstacle(a, s * zm, d, s * zm, "voile du pont-cadre");
  // les traces du temps sous la dalle : calcite, suintements, mousse, flaques
  for (let i = 0; i < 8; i++) {
    const xx = cadre0 + 1 + i * 2.2;
    if (bruit(i, 6, 201) < 0.5) c.boite(0.12 + bruit(i, 1, 201) * 0.25, 0.8 + bruit(i, 2, 201) * 1.2, 0.02, 0x7a6a58, { x: xx, y: sous - 0.7, z: -zm + 0.02 }, M.mat, { crasse: false });
    if (bruit(i, 3, 201) < 0.6) flaque(c, xx + 0.5, (bruit(i, 4, 201) - 0.5) * 6, 0.6 + bruit(i, 5, 201) * 0.8);
  }
  if (u > 0.3) mousse(c, cadre0 + 2, 0.02, -zm + 0.4, 1.2, 5, 0x4f6a3a);
  panneau(c, M.enseignes, R.feuAmis, { x: 76.6, y: 2.0, z: -zm + 0.03 }, 3.0, 1.5);
  // le panneau de gabarit et le panneau vert de la voie rapide
  c.tube([60.5, 0, -6.4], [60.5, 2.6, -6.4], 0.05, 0x8a8e8a, M.metal, 5);
  panneauDouble(c, M.enseignes, R.gabarit, { x: 60.5, y: 2.3, z: -6.4, ry: -0.5 }, 1.0, 0.5);
  for (const s of [-1, 1]) k.tube([73 + s * 1.8, h, 10.5], [73 + s * 1.8, h + 3.2, 10.5], 0.08, 0x8a8e8a, M.tole, 6);
  panneauDouble(k, M.enseignes, R.voieRapide, { x: 73, y: h + 2.6, z: 10.5 }, 4.4, 1.1);
  // --- La voie rapide, en haut du remblai : chaussée, glissières, terre-plein, épaves
  const chaussee = (kk, z0, z1) => kk.pave(VR.b + 1.2, h, z0, VR.c - 1.2, h + 0.04, z1, 0x7e7c76, M.asphalte, { crasse: false });
  chaussee(c, -35, -couloir - 0.6);
  chaussee(k, -couloir - 0.6, 35);
  for (const [kk, z0, z1] of [[c, -35, -couloir - 0.6], [k, -couloir - 0.6, 35]]) {
    for (const xg of [VR.b + 1.0, VR.c - 1.0, 72.7, 73.3]) {
      kk.boite(0.08, 0.3, z1 - z0, 0xb8bcb8, { x: xg, y: h + 0.62, z: (z0 + z1) / 2 }, M.tole);
      for (let z = Math.ceil(z0 / 4) * 4; z < z1; z += 4) kk.boite(0.1, 0.65, 0.1, 0x8a8e8a, { x: xg, y: h + 0.33, z }, M.tole);
    }
    for (let z = Math.ceil(z0 / 12) * 12; z < z1 - 3; z += 12) for (const xm of [69.8, 76.2]) kk.boite(0.14, 0.01, 3, 0xd8d4c8, { x: xm, y: h + 0.05, z: z + 1.5 }, M.satin, { crasse: false });
  }
  voiture(ctx, 70, -15, Math.PI / 2 + 0.1, { y: h + 0.04, sansObstacle: true, couleur: 0x4e6a7a });
  voiture(ctx, 76, -24, -Math.PI / 2 + 0.2, { y: h + 0.04, sansObstacle: true, portiere: true });
  voiture(ctx, 69.6, 16, Math.PI / 2 - 0.15, { y: h + 0.04, sansObstacle: true, k, couleur: 0xa08a5a });
  voiture(ctx, 76.3, 25, -Math.PI / 2, { y: h + 0.04, sansObstacle: true, k, flanc: 1, couleur: 0x8e4a3e });
  // les ronces et les buissons du remblai
  for (let i = 0; i < 16; i++) {
    const zz = -33 + bruit(i, 1, 211) * 26;
    const xx = bruit(i, 2, 211) < 0.5 ? a + 2 + bruit(i, 3, 211) * 5 : d - 2 - bruit(i, 3, 211) * 5;
    const yy = remblai(xx);
    c.poser(GEO.boule, M.mat, i % 3 ? 0x5a7a3a : 0x6a7a4a, { x: xx, y: yy + 0.3, z: zz, ry: i, e: [1.0 + bruit(i, 4, 211), 0.7, 0.9] }, { crasse: false, nuance: 0.08 });
  }
  for (let i = 0; i < 12; i++) {
    const zz = couloir + 3 + bruit(i, 5, 211) * 28;
    const xx = bruit(i, 6, 211) < 0.5 ? a + 2 + bruit(i, 7, 211) * 5 : d - 2 - bruit(i, 7, 211) * 5;
    k.poser(GEO.boule, M.mat, i % 3 ? 0x5a7a3a : 0x6a7a4a, { x: xx, y: remblai(xx) + 0.3, z: zz, ry: i, e: [1.0 + bruit(i, 8, 211), 0.7, 0.9] }, { crasse: false, nuance: 0.08 });
  }
  arbre(c, a + 1.5, -20, 7, "bouleau");
  arbre(c, d - 1.2, -28, 8, "feuillu");
}

/** Le bouchon dans le couloir : le camion encastré, les voitures coincées, le camp des survivants. */
function bouchon(ctx) {
  const { c, M, b, u } = ctx;
  if (ctx.ici(55)) {
    // la file qui s'est arrêtée avant le pont
    voiture(ctx, 52.4, -1.9, 0.06, { couleur: 0x5d6b4a });
    voiture(ctx, 54.6, 2.2, -0.12, { portiere: true, couleur: 0xb8b4a8 });
    jersey(ctx, 51, -5.6, 0.3, COUL.jerseyBlanc);
    cone(ctx, 56.4, -3.6);
    cone(ctx, 57.0, -4.4);
    for (let i = 0; i < 4; i++) c.boite(0.5, 0.35, 0.4, 0xd8d0b8, { x: 58 + bruit(i, 1, 221) * 3, y: 0.18, z: 3.8 + bruit(i, 2, 221) * 1.4, ry: i }, M.mat, { nuance: 0.08 });
    debris(c, 56, 0.8, 60, 4.8, 18, [0xe8e4dc, 0xd8d0c0, 0x8a8e8a]);
    semerTouffes(c, 50, -5, 58, 5, Math.round(6 + u * 10));
  }
  if (ctx.ici(62)) porteurEncastre(ctx, 62.2, 1.9, 0);
  if (!ctx.ici(73)) return;
  // une voiture en travers dans le couloir (on la contourne au nord ou au sud), une autre au fond
  voiture(ctx, 71, -0.6, 0.85, { couleur: 0x37424e, coffre: true });
  voiture(ctx, 78.2, 2.6, 0.15, { couleur: 0x7a7f84, capot: true });
  // le camp des survivants contre le voile nord : le feu, deux matelas, un banc de palettes, la lanterne
  feuDeCamp(ctx, 76.4, -3.3);
  ctx.b.lumiere(76.4, 0.9, -3.3, 0xff8a3a, 6, 12, "feu des survivants sous le pont-cadre");
  for (let i = 0; i < 2; i++) {
    c.boite(1.9, 0.16, 0.9, 0xc8c0a8, { x: 79.5, y: 0.08, z: -4.3 + i * 1.0, ry: 0.05 }, M.toile, { nuance: 0.06 });
    c.boite(1.2, 0.05, 0.85, [0x5a6a8a, 0x8a5a4a][i], { x: 79.8, y: 0.19, z: -4.3 + i * 1.0, ry: 0.1 }, M.toile, { crasse: false });
  }
  palette(ctx, 74.2, -4.4, { ry: 0.1 });
  palette(ctx, 74.2, -4.4, { ry: 0.1, y: 0.15 });
  caisse(ctx, 77.8, -4.5, 0.6, 0.45, 0.4);
  conserves(ctx, 77.6, -4.6, 3, 0.45);
  c.tube([75.5, 0, -2.6], [75.5, 0.3, -2.6], 0.18, 0x5a5a56, M.metal, 7);
  for (let i = 0; i < 8; i++) c.tube([73.0 + (i % 4) * 0.2, 0.06 + Math.floor(i / 4) * 0.13, -2.4], [73.0 + (i % 4) * 0.2, 0.06 + Math.floor(i / 4) * 0.13, -1.8], 0.06, PALETTE.bois, M.mat, 5);
  c.boite(0.04, 0.04, 0.3, 0x3a3a38, { x: 78.6, y: 2.4, z: -zmMur() + 0.15 }, M.metal);
  lanterne(ctx, 78.6, 2.0, -zmMur() + 0.3);
  ctx.b.lumiere(78.6, 2.2, -zmMur() + 0.5, 0xffc46a, 3, 8, "lanterne accrochée au voile du pont-cadre");
  obstacleBoite(b, 76.4, -3.3, 1.4, 1.4, 0, "feu de camp");
  jonchee(c, 72, -4.8, 81, -1.5, 14, [0x9c7a45, 0x7d6143, 0xe8e4d6]);
  // l'autre bout : les voitures poussées sur les bas-côtés, la sortie vers la campagne
  voiture(ctx, 85.2, -4.6, 0.5, { couleur: 0x9c6a3a, portiere: true });
  pneus(ctx, 84.6, 4.6, 3);
}

function zmMur() {
  return VR.mur;
}

function sortie(ctx) {
  const { c, M, b, u } = ctx;
  if (!ctx.ici(94)) return;
  voiture(ctx, 92.2, -5.2, 0.3, { couleur: 0x6b5a78, coffre: true });
  friche(ctx, 89, 12.5, 100, 32.6, 1);
  for (let i = 0; i < 3; i++) botte(ctx, 92 + i * 2.6, -20 + i * 3, { ronde: true, ry: i, vieille: 0.9 });
  semerTouffes(c, 88, -33, 100, -10, Math.round(12 + u * 16));
  arbre(c, 98, -14, 9, "feuillu");
  // le mirador de chasse au bord du pré : un point de vue sur la sortie du pont-cadre
  const mx = 93.5;
  const mz = -16;
  for (const [dx, dz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) barre(c, [mx + dx * 1.3, 0, mz + dz * 1.3], [mx + dx * 0.8, 3.2, mz + dz * 0.8], 0.12, 0.12, PALETTE.boisGris, M.mat);
  c.boite(1.9, 0.1, 1.9, PALETTE.bois, { x: mx, y: 3.2, z: mz }, M.mat);
  for (const s of [-1, 1]) {
    c.boite(1.9, 0.9, 0.05, PALETTE.boisGris, { x: mx, y: 3.7, z: mz + s * 0.93 }, M.mat);
    c.boite(0.05, 0.9, 1.9, PALETTE.boisGris, { x: mx + s * 0.93, y: 3.7, z: mz }, M.mat);
  }
  for (const [dx, dz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) c.boite(0.08, 1.4, 0.08, PALETTE.boisGris, { x: mx + dx, y: 4.6, z: mz + dz }, M.mat);
  c.boite(2.3, 0.06, 2.3, 0x5a6a4a, { x: mx, y: 5.3, z: mz, rx: 0.1 }, M.tole);
  for (let i = 0; i < 6; i++) c.boite(0.6, 0.05, 0.08, PALETTE.boisGris, { x: mx - 1.2 + i * 0.05, y: 0.4 + i * 0.5, z: mz + 1.5, rz: 0.1 }, M.mat);
  barre(c, [mx - 1.1, 0, mz + 1.6], [mx - 0.8, 3.2, mz + 1.0], 0.06, 0.06, PALETTE.boisGris, M.mat);
  barre(c, [mx - 1.3 + 0.9, 0, mz + 1.6], [mx - 0.5 + 0.4, 3.2, mz + 1.0], 0.06, 0.06, PALETTE.boisGris, M.mat);
  obstacleBoite(b, mx, mz, 2.6, 2.6, 0, "mirador de chasse");
  // la caravane couchée dans le fossé, à la sortie
  c.repere({ x: 94.5, y: 1.1, z: 7.2, ry: -0.15, rx: 1.35 }, () => {
    c.boite(4.6, 2.1, 2.1, 0xe6e0d0, {}, M.satin);
    c.boite(4.62, 0.3, 2.12, 0x8a6a4a, { y: -0.3 }, M.satin);
    c.boite(0.9, 0.5, 2.14, 0x2a3134, { x: 1.2, y: 0.4 }, M.lisse);
    c.boite(1.8, 0.1, 0.1, 0x3a3a38, { x: 2.9, y: -0.9 }, M.metal);
  });
  obstacleBoite(b, 94.5, 7.6, 4.7, 2.2, -0.15, "caravane couchée");
}

export const TRONCON4 = [pontCadre, bouchon, sortie];
