// Tronçon 2 : le grand rond-point et sa pile Watty, les branches barrées, la chapelle et son calvaire, l'aire de
// covoiturage autonome, les silos de la coopérative.

import * as THREE from "three";
import { PALETTE, mur, touffes, semerTouffes, gravats, debris, jonchee, mousse, arbuste, arbre, flaque, lierre, toitDeuxPans } from "../commun/atelier.js";
import { R } from "./atlas.js";
import { bruit, bruitXZ, teinte, coucheStricte, panneau, panneauDouble, barre, obstacleBoite } from "./outils.js";
import { COUL, GEO, voiture, fourgon, nain, eolienne, rotorAnime, botte, palette, pneus, cone, jersey, sacs, bougie, caisse } from "./objets.js";
import { RP, W, CHAPELLE, CALVAIRE, COVOIT, SILOS, SILO_TOMBE, C } from "./plan.js";
import { murCoupe, pignon, ouv } from "./bati.js";

const JAUNE_WATTY = 0xd9b84a;
const VERT_WATTY = 0x5a8a4e;
const RESINE = 0xb9b4a6;

/** Une bande courbe (morceau de cylindre) qui porte une région de l'atlas : visage de Watty, nom peint sur un silo. */
function bandeCourbe(c, mat, r, pose, rayon, hauteur, centre, ouverture) {
  const g = new THREE.CylinderGeometry(rayon, rayon, hauteur, 10, 1, true, centre - ouverture / 2, ouverture);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / 1024, 1 - (py + (1 - uv.getY(i)) * ph) / 2048);
  c.poser(g, mat, 0xffffff, pose, { crasse: false, nuance: 0 });
  g.dispose();
}

// ---------- Le rond-point ----------

function ilot(ctx) {
  const { c, M, b, u } = ctx;
  const { x, z, ri } = RP;
  // la bordure de béton, le gazon devenu prairie, la butte centrale
  c.poser(new THREE.CylinderGeometry(ri, ri, 0.28, 32), M.satin, 0xc8c2b4, { x, y: 0.14, z }, { crasse: false });
  c.poser(new THREE.CylinderGeometry(ri - 0.3, ri - 0.3, 0.3, 32), M.mat, 0x7d9a50, { x, y: 0.16, z }, { crasse: false, nuance: 0.02 });
  c.poser(new THREE.CylinderGeometry(2.6, 6.2, 0.95, 14), M.mat, 0x6d8d4c, { x, y: 0.78, z }, { crasse: false, nuance: 0.03 });
  // le paillage d'écorce et les massifs de lavande sèche (en couronne)
  c.poser(new THREE.CylinderGeometry(7.6, 7.6, 0.04, 28), M.mat, 0x6a5040, { x, y: 0.31, z }, { crasse: false });
  c.poser(new THREE.CylinderGeometry(6.4, 6.4, 0.05, 28), M.mat, 0x7d9a50, { x, y: 0.33, z }, { crasse: false });
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const r = 7.0 + (bruit(i, 1, 61) - 0.5) * 0.6;
    c.poser(GEO.boule, M.mat, bruit(i, 2, 61) < 0.6 ? 0x8a80a0 : 0x8a8a6a, { x: x + Math.cos(a) * r, y: 0.48, z: z + Math.sin(a) * r, ry: a, e: [0.42, 0.28, 0.42] }, { crasse: false, nuance: 0.08 });
  }
  // herbes folles qui ont gagné l'îlot
  for (let i = 0; i < 14 + u * 18; i++) {
    const a = bruit(i, 3, 61) * Math.PI * 2;
    const r = 2.5 + bruit(i, 4, 61) * 6;
    touffes(c, [[x + Math.cos(a) * r, z + Math.sin(a) * r, r < 6 ? 0.55 + (6 - r) * 0.05 : 0.32]], bruit(i, 5, 61) < 0.5 ? PALETTE.herbeSeche : PALETTE.herbe);
  }
  if (u > 0.4) arbuste(c, x - 5.5, z - 4.2, 1.3, 0.3);
  if (u > 0.6) arbuste(c, x + 3.6, z + 6.2, 1.0, 0.3);
}

function sculpture(ctx) {
  const { c, M, b, u } = ctx;
  const { x, z } = RP;
  const y0 = 1.25;
  const face = Math.PI / 4; // la sculpture regarde le sud-est (la caméra)
  const fx = Math.sin(face);
  const fz = Math.cos(face);
  // le socle de pierre et sa plaque de laiton
  c.boite(2.8, 0.9, 2.8, 0xc9bea6, { x, y: y0 + 0.45, z, ry: face }, M.pierre);
  c.boite(3.1, 0.12, 3.1, 0xb8ae96, { x, y: y0 + 0.92, z, ry: face }, M.pierre);
  panneau(c, M.enseignes, R.plaqueWatty, { x: x + fx * 1.41, y: y0 + 0.45, z: z + fz * 1.41, ry: face }, 1.9, 0.48);
  // le corps : la pile, sa bande verte, son capuchon, sa borne +
  const yb = y0 + 0.98;
  c.tube([x, yb, z], [x, yb + 1.3, z], 1.3, teinte(VERT_WATTY, RESINE, u * 0.25), M.lisse, 14);
  c.tube([x, yb + 1.3, z], [x, yb + 4.2, z], 1.3, teinte(JAUNE_WATTY, RESINE, u * 0.2), M.lisse, 14);
  c.tube([x, yb + 4.2, z], [x, yb + 4.32, z], 1.24, 0x9a9a92, M.metal, 14);
  c.tube([x, yb + 4.32, z], [x, yb + 4.85, z], 0.48, 0xa8a8a0, M.metal, 10);
  bandeCourbe(c, M.enseignes, R.wattyVisage, { x, y: yb + 2.95, z }, 1.315, 2.1, face, 1.7);
  c.repere({ x: x + fx * 1.32, y: yb + 0.65, z: z + fz * 1.32, ry: face }, () => {
    c.boite(0.7, 0.18, 0.06, 0xf0ece0, {}, M.lisse);
    c.boite(0.18, 0.7, 0.06, 0xf0ece0, {}, M.lisse);
  });
  // les bras : l'un salue (le gant blanc), l'autre pend, cassé au coude
  const sx = Math.sin(face + Math.PI / 2);
  const sz = Math.cos(face + Math.PI / 2);
  const ep = [x + sx * 1.25, yb + 2.6, z + sz * 1.25];
  const main = [x + sx * 2.3, yb + 3.9, z + sz * 2.3];
  c.tube(ep, main, 0.18, teinte(JAUNE_WATTY, RESINE, 0.3), M.lisse, 8);
  c.poser(GEO.boule, M.lisse, 0xeeeae2, { x: main[0], y: main[1] + 0.15, z: main[2], e: [0.34, 0.4, 0.3] });
  const ep2 = [x - sx * 1.25, yb + 2.5, z - sz * 1.25];
  const coude = [x - sx * 2.0, yb + 1.7, z - sz * 2.0];
  c.tube(ep2, coude, 0.18, teinte(JAUNE_WATTY, RESINE, 0.3), M.lisse, 8);
  if (u < 0.5) c.tube(coude, [x - sx * 2.1, yb + 0.9, z - sz * 2.2], 0.17, teinte(JAUNE_WATTY, RESINE, 0.3), M.lisse, 8);
  else {
    // l'avant-bras tombé dans la lavande, avec son gant
    c.tube([x - sx * 3.1, 0.5, z - sz * 2.6], [x - sx * 3.9, 0.45, z - sz * 2.0], 0.17, teinte(JAUNE_WATTY, RESINE, 0.4), M.lisse, 8);
    c.poser(GEO.boule, M.lisse, 0xdedad2, { x: x - sx * 4.2, y: 0.5, z: z - sz * 1.8, e: [0.32, 0.28, 0.34] });
    c.tube(coude, [coude[0] + 0.05, coude[1] - 0.2, coude[2]], 0.12, RESINE, M.lisse, 6);
  }
  // les chaussures au pied de la pile
  for (const s of [-0.55, 0.55]) c.poser(GEO.dome, M.lisse, 0x3a3a3a, { x: x + fx * 1.25 + sx * s, y: yb, z: z + fz * 1.25 + sz * s, ry: face, e: [0.4, 0.3, 0.55] });
  // la résine qui s'écaille : des plaques grises sur la peinture, des éclats jaunes au pied
  const n = Math.round(10 + u * 22);
  for (let i = 0; i < n; i++) {
    const a = face + (bruit(i, 1, 71) - 0.5) * 2.8;
    const yy = yb + 0.2 + bruit(i, 2, 71) * 4.0;
    const s = 0.18 + bruit(i, 3, 71) * 0.35;
    c.boite(s, s * 0.7, 0.02, bruit(i, 4, 71) < 0.7 ? RESINE : 0x9e998c, { x: x + Math.sin(a) * 1.31, y: yy, z: z + Math.cos(a) * 1.31, ry: a, rz: bruit(i, 5, 71) * 3 }, M.mat, { crasse: false, nuance: 0.05 });
  }
  for (let i = 0; i < n; i++) {
    const a = bruit(i, 6, 71) * Math.PI * 2;
    const r = 1.6 + bruit(i, 7, 71) * 1.4;
    c.boite(0.16, 0.015, 0.12, i % 3 ? JAUNE_WATTY : VERT_WATTY, { x: x + Math.cos(a) * r, y: y0 - 0.15 + (3 - r) * 0.05 + 0.04, z: z + Math.sin(a) * r, ry: a * 3 }, M.lisse, { crasse: false });
  }
  // les coulures de rouille de la borne
  for (let i = 0; i < 4; i++) {
    const a = face + (i - 1.5) * 0.4;
    c.boite(0.06, 0.9, 0.02, 0x8a5a3a, { x: x + Math.sin(a) * 1.305, y: yb + 3.75, z: z + Math.cos(a) * 1.305, ry: a }, M.mat, { crasse: false });
  }
  obstacleBoite(b, x, z, 3.2, 3.2, face, "socle de la sculpture");
  // les éoliennes miniatures (une tourne encore) et les nains de jardin
  const eol = [[0.2, 2.8, false], [1.25, 2.2, true], [2.3, 2.6, false], [3.3, 2.0, u > 0.5], [4.3, 3.0, false], [5.4, 2.4, true]];
  eol.forEach(([a, h, cassee], i) => {
    const r = 4.3;
    const ex = x + Math.cos(a) * r;
    const ez = z + Math.sin(a) * r;
    const ye = 0.62 + (r < 6 ? (6.2 - r) * 0.15 : 0);
    c.repere({ y: ye }, () => eolienne(ctx, ex, ez, h, { cassee, ry: 0.6 + i * 0.3, angle: i }));
    if (i === 0) b.ajouter(rotorAnime(ctx.M, ex + Math.cos(0.6) * 0.18, ye + h, ez - Math.sin(0.6) * 0.18, 0.6));
  });
  for (let i = 0; i < 13; i++) {
    const a = bruit(i, 8, 71) * Math.PI * 2;
    const r = 3.0 + bruit(i, 9, 71) * 3.4;
    const yy = r < 6.2 ? 0.33 + Math.max(0, (6.2 - r) / 3.6) * 0.92 : 0.33;
    c.repere({ y: yy }, () => nain(ctx, x + Math.cos(a) * r, z + Math.sin(a) * r, a + Math.PI / 2 + 1.2, { renverse: bruit(i, 10, 71) < 0.2 + u * 0.25, brouette: i % 5 === 0, e: 1.4 }));
  }
}

function anneau(ctx) {
  const { c, M, u } = ctx;
  const { x, z } = RP;
  // les épaves de l'anneau : l'une encastrée dans la bordure, l'autre sur le flanc, une troisième portière ouverte
  const pos = (a, r) => [x + Math.cos(a) * r, z + Math.sin(a) * r];
  {
    const a = Math.PI * 0.78;
    const [px, pz] = pos(a, 10.6);
    voiture(ctx, px, pz, -a + 0.5, { penche: 0.06, capot: true, couleur: 0x4e6a7a });
  }
  {
    const a = -Math.PI * 0.42;
    const [px, pz] = pos(a, 12.6);
    voiture(ctx, px, pz, -a - Math.PI / 2, { flanc: 1, couleur: 0xa08a5a });
  }
  {
    const a = Math.PI * 0.12;
    const [px, pz] = pos(a, 12.4);
    voiture(ctx, px, pz, -a - Math.PI / 2 + 0.3, { portiere: true, coffre: true });
  }
  fourgon(ctx, x - 6.5, z + 12.2, 2.6, { couleur: 0xe0dcd0, portes: true });
  // des séparateurs poussés en travers de l'entrée ouest (on a voulu filtrer, puis on a fui)
  jersey(ctx, x - RP.ro - 3.5, z - 1.8, 1.3, COUL.jerseyRouge);
  jersey(ctx, x - RP.ro - 1.6, z + 2.4, 0.4, COUL.jerseyBlanc);
  jersey(ctx, x + RP.ro + 2.2, z - 2.6, -0.5, COUL.jerseyRouge);
  pneus(ctx, x + 6.5, z - 13.5, 3);
  cone(ctx, x - 13.5, z + 5.2);
  cone(ctx, x - 12.6, z + 6.4);
  cone(ctx, x + 12.0, z - 6.0);
  // d'autres couverts autour de l'anneau : la panne de l'approche ouest, un muret de sacs au nord-est
  voiture(ctx, x - RP.ro - 9, z - 1.7, 0.12, { couleur: 0x5d6b4a, capot: true });
  sacs(ctx, x + 10.5, z - 17.5, x + 13.6, z - 15.6, 3, { nature: "muret de sacs" });
  palette(ctx, x + 14.2, z - 14.6, { debout: true, ry: 0.9 });
  flaque(c, x + 4, z + 13.2, 1.4);
  flaque(c, x - 12.5, z - 8, 0.9);
  // le panneau du rond-point intelligent, à l'entrée ouest
  const px = RP.x - RP.ro - 6;
  const pz = W + 3.0;
  for (const s of [-1, 1]) c.tube([px + s * 1.3, 0, pz], [px + s * 1.3, 3.4, pz], 0.06, 0x8a8e8a, M.metal, 6);
  panneauDouble(c, M.enseignes, R.rondPoint, { x: px, y: 2.4, z: pz, ry: -0.15, rz: u > 0.6 ? 0.06 : 0 }, 3.2, 1.6);
}

// ---------- Les branches barrées ----------

function barricadeNord(ctx) {
  const { c, M, b, u } = ctx;
  const x = RP.x;
  // les carcasses : un fourgon couché, une voiture retournée, une autre hissée par-dessus
  fourgon(ctx, x + 2.6, -25.6, 0.12, { flanc: 1, couleur: 0x8a9aa0 });
  voiture(ctx, x - 2.4, -25.2, -0.1, { retournee: true, couleur: 0x6b5a78 });
  voiture(ctx, x + 0.4, -27.6, 0.25, { y: 0.4, penche: 0.12, sansObstacle: true, couleur: 0x9c6a3a });
  voiture(ctx, x - 5.2, -27.4, 1.4, { couleur: 0x7a7f84 });
  // palettes, pneus, fûts, barbelés, panneaux
  palette(ctx, x - 5.8, -23.2, { debout: true, ry: 0.1 });
  palette(ctx, x + 5.6, -23.4, { debout: true, ry: -0.2 });
  palette(ctx, x + 6.0, -24.6, { ry: 0.6 });
  pneus(ctx, x + 5.4, -27.8, 5);
  pneus(ctx, x - 6.2, -25.4, 3);
  for (const dx of [-3.8, 4.2]) c.tube([x + dx, 0, -22.8], [x + dx, 0.9, -22.8], 0.3, dx < 0 ? 0x3f6a7a : PALETTE.rouille, M.tole, 8);
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const g = new THREE.TorusGeometry(0.45, 0.02, 3, 10);
    c.poser(g, M.metal, 0x8a8a84, { x: x - 6 + t * 12, y: 0.45, z: -22.4 + (i % 2) * 0.25, ry: Math.PI / 2 + (bruit(i, 1, 81) - 0.5) * 0.4 }, { crasse: false });
    g.dispose();
  }
  for (const s of [-1, 1]) c.tube([x + s * 2.4, 0, -22.4], [x + s * 2.4, 1.6, -22.4], 0.05, 0x8a8e8a, M.metal, 5);
  panneauDouble(c, M.enseignes, R.barree, { x, y: 1.3, z: -22.4, rz: 0.04 }, 4.6, 1.15);
  c.tube([x + 6.6, 0, -21.6], [x + 6.6, 2.3, -21.6], 0.04, 0x8a8e8a, M.metal, 5);
  panneauDouble(c, M.enseignes, R.deviation, { x: x + 6.6, y: 2.0, z: -21.6, ry: -0.3 }, 1.0, 0.5);
  b.obstacle(x - 7.5, -22.6, x + 7.5, -22.6, "barricade de carcasses");
  sacs(ctx, x - 7.4, -23.2, x - 4.2, -23.4, 3, { obstacle: false });
  semerTouffes(c, x - 7, -33, x + 7, -29, Math.round(8 + u * 14));
  if (u > 0.4) arbuste(c, x + 3, -31.5, 1.6);
}

function siloTombe(ctx) {
  const { c, M, b, u } = ctx;
  const { x0, x1, z, r } = SILO_TOMBE;
  // le silo couché, cabossé, ses anneaux de raidisseurs, sa tête conique arrachée
  c.tube([x0, r, z], [x1, r - 0.15, z + 0.4], r, 0xa8aaa4, M.tole, 14);
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    c.tube([x0 + (x1 - x0) * t - 0.08, r, z + 0.4 * t], [x0 + (x1 - x0) * t + 0.08, r, z + 0.4 * t], r + 0.06, 0x8a8c86, M.tole, 14);
  }
  c.poser(new THREE.ConeGeometry(r + 0.1, 1.8, 14), M.tole, 0x9a9c96, { x: x1 + 2.6, y: 1.6, z: z + 1.2, rz: -1.2, ry: 0.4 });
  c.tube([x1, r, z + 0.4], [x1 + 0.3, r - 0.1, z + 0.4], r - 0.4, 0x3a3834, M.mat, 12);
  bandeCourbe(c, M.enseignes, R.coop, { x: (x0 + x1) / 2, y: r, z: z + 0.2, rz: Math.PI / 2 }, r + 0.02, 7, 0.0, 1.5);
  // le grain répandu en travers de la branche sud (germé, moisi), la passerelle tordue
  for (let i = 0; i < 16; i++) {
    const gx = x1 - 2 + bruit(i, 1, 91) * 9;
    const gz = z - 3 + bruit(i, 2, 91) * 6.5;
    c.poser(GEO.boule, M.mat, bruit(i, 3, 91) < 0.6 ? 0xb89a5a : 0x8a8a52, { x: gx, y: 0.05, z: gz, ry: i, e: [1.3 + bruit(i, 4, 91), 0.35 + bruit(i, 5, 91) * 0.35, 1.0 + bruit(i, 6, 91)] }, { crasse: false, nuance: 0.05 });
  }
  semerTouffes(c, x1 - 1, z - 3, x1 + 7, z + 3.5, 14, 0x7a9a4a);
  barre(c, [x0 + 2, r * 2 + 0.2, z - 0.8], [x1 + 4, 0.2, z - 2.4], 0.1, 0.6, 0x6a6c66, M.tole);
  barre(c, [x0 + 2, r * 2 + 1.1, z - 1.2], [x1 + 4, 1.0, z - 2.8], 0.05, 0.05, 0x8a8a84, M.metal);
  // l'écriteau peint, tourné vers le rond-point
  c.tube([RP.x + 4.8, 0, 18.4], [RP.x + 4.8, 1.5, 18.4], 0.05, PALETTE.boisGris, M.mat, 5);
  panneauDouble(c, M.enseignes, R.pasParLa, { x: RP.x + 4.8, y: 1.3, z: 18.4, ry: 0.2 }, 1.2, 0.6);
  b.obstacle(x0, z - r, x1, z - r + 0.4, "silo couché");
  b.obstacle(x0, z + r, x1, z + r + 0.4, "silo couché");
  b.obstacle(RP.x - 7.5, 19.8, RP.x + 7.5, 20.6, "tas de grain et ferraille du silo");
  if (u > 0.3) mousse(c, (x0 + x1) / 2, r * 2 - 0.1, z, 2.2, 6, 0x7a8a4a);
}

function silos(ctx) {
  if (!ctx.ici(-41)) return;
  const { c, M, b, u } = ctx;
  const H = 15;
  const haut = coucheStricte(ctx.b, "silos de la coopérative", { x: -41.5, z: 28, l: 11, p: 9 }, 3.2, H + 6, [M.tole, M.mat, M.enseignes]);
  for (const [i, s] of SILOS.entries()) {
    // le pied de béton, la trémie, les anneaux
    c.tube([s.x, 0, s.z], [s.x, 0.5, s.z], s.r + 0.3, 0xa8a49a, M.mat, 14);
    c.tube([s.x, 0.5, s.z], [s.x, 3.2, s.z], s.r, 0xa8aaa4, M.tole, 14);
    haut.tube([s.x, 3.2, s.z], [s.x, H, s.z], s.r, 0xa8aaa4, M.tole, 14);
    for (let k = 1; k < 8; k++) (k * 1.9 < 3.2 ? c : haut).tube([s.x, k * 1.9, s.z], [s.x, k * 1.9 + 0.12, s.z], s.r + 0.05, 0x8a8c86, M.tole, 14);
    haut.poser(new THREE.ConeGeometry(s.r + 0.15, 1.6, 14), M.tole, 0x9a9c96, { x: s.x, y: H + 0.8, z: s.z });
    // l'échelle à crinoline
    for (const d of [-0.25, 0.25]) haut.boite(0.05, H - 3, 0.05, 0x6a6c66, { x: s.x + s.r + 0.15, y: 3 + (H - 3) / 2, z: s.z + d }, M.tole);
    for (let k = 0; k < 7; k++) haut.tube([s.x + s.r + 0.45, 4 + k * 1.6, s.z], [s.x + s.r + 0.45, 4 + k * 1.6 + 0.05, s.z], 0.4, 0x6a6c66, M.tole, 6);
    if (i === 1) bandeCourbe(haut, M.enseignes, R.coop, { x: s.x, y: 9, z: s.z }, s.r + 0.02, 1.4, Math.PI / 4, 1.9);
    obstacleBoite(b, s.x, s.z, s.r * 2, s.r * 2, 0, "silo");
  }
  // la tour d'élévation et ses goulottes, la passerelle entre les silos
  const tx = -41.6;
  const tz = 24.4;
  for (const [dx, dz] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) {
    c.boite(0.12, 3.2, 0.12, 0x7a7c76, { x: tx + dx, y: 1.6, z: tz + dz }, M.tole);
    haut.boite(0.12, H + 1.8, 0.12, 0x7a7c76, { x: tx + dx, y: 3.2 + (H + 1.8) / 2, z: tz + dz }, M.tole);
  }
  for (let k = 0; k < 6; k++) haut.boite(1.3, 0.08, 1.3, 0x7a7c76, { x: tx, y: 5 + k * 2.6, z: tz }, M.tole);
  haut.boite(1.6, 1.4, 1.6, 0x9a5a3c, { x: tx, y: H + 2.6, z: tz }, M.tole);
  for (const s of SILOS) barre(haut, [tx, H + 2.2, tz], [s.x, H + 1.2, s.z], 0.3, 0.3, 0x8a8c86, M.tole);
  barre(haut, [SILOS[0].x, H, SILOS[0].z], [SILOS[1].x, H, SILOS[1].z], 0.08, 0.9, 0x6a6c66, M.tole);
  obstacleBoite(b, tx, tz, 1.4, 1.4, 0, "tour d'élévation");
  // la fosse de réception, les sacs de jute, une pelle
  c.pave(-45.5, 0, 21.5, -42.5, 0.15, 23.5, 0x8a8c86, M.tole);
  for (let i = 0; i < 6; i++) c.boite(0.6, 0.35, 0.45, 0xb8a888, { x: -44.6 + (i % 3) * 0.65, y: 0.18 + Math.floor(i / 3) * 0.33, z: 24.3, ry: i * 0.2 }, M.toile, { nuance: 0.06 });
  barre(c, [-40.2, 0, 23.0], [-40.6, 1.4, 22.6], 0.04, 0.04, PALETTE.bois, M.mat);
  semerTouffes(c, -49, 20, -31, 33, Math.round(16 + u * 20), PALETTE.herbeSeche);
  if (u > 0.5) arbre(c, -47.5, 32, 8, "bouleau");
}

// ---------- La chapelle et le calvaire ----------

function chapelle(ctx) {
  const { x0, x1, z0, z1, h } = CHAPELLE;
  const xm = (x0 + x1) / 2;
  const zc = (z0 + z1) / 2;
  if (!ctx.ici(xm)) return;
  const { c, M, b, u } = ctx;
  const hf = 3.6;
  const haut = coucheStricte(b, "toit et clocheton de la chapelle", { x: xm, z: zc, l: x1 - x0 + 1, p: z1 - z0 + 1.5 }, 1.1, h + hf + 3.4, [M.pierre, M.tuiles, M.mat, M.metal]);
  const pierre = { h, ep: 0.55, couleur: C.pierreChapelle, mat: M.pierre, interieur: { couleur: 0xe0d6c0, mat: M.pierre } };
  const lancette = (uu) => ({ u: uu, l: 0.7, bas: 1.7, haut: 3.6, type: "fenetre", bris: 0.3 + u * 0.5, cadre: 0x5a5a56, croisillons: 0, traverses: 3 });
  murCoupe(ctx, haut, [x0, z1], [x1, z1], { ...pierre, ouvertures: [ouv.porte((x1 - x0) / 2, 1.5, 2.8)] }, 1.1);
  murCoupe(ctx, haut, [x1, z1], [x1, z0], { ...pierre, ouvertures: [lancette(3), lancette(7)] }, 1.1);
  murCoupe(ctx, haut, [x1, z0], [x0, z0], { ...pierre, ouvertures: [{ u: (x1 - x0) / 2, l: 1.0, bas: 2.0, haut: 3.6, type: "fenetre", bris: 0.5, croisillons: 0, traverses: 2 }] }, h);
  murCoupe(ctx, haut, [x0, z0], [x0, z1], { ...pierre, ouvertures: [lancette(3), lancette(7)] }, h);
  // les pignons, le toit (faîtage nord-sud), le clocheton à une cloche sur le pignon sud
  pignon(haut, M.pierre, C.pierreChapelle, xm, h, z1, x1 - x0 + 0.55, hf, 0, 0.55);
  pignon(haut, M.pierre, C.pierreChapelle, xm, h, z0, x1 - x0 + 0.55, hf, 0, 0.55);
  toitDeuxPans(haut, xm, zc, z1 - z0, x1 - x0, h, hf, { mat: M.tuiles, couleur: 0x8a8a8a, ry: Math.PI / 2, debord: 0.4, trous: u > 0.55 ? [{ u: -2, v: 1, l: 2.2, p: 0.6 }] : [] });
  const yc = h + hf;
  for (const s of [-1, 1]) haut.boite(0.35, 1.8, 0.5, C.pierreChapelle, { x: xm + s * 0.6, y: yc + 0.7, z: z1 }, M.pierre);
  haut.boite(1.6, 0.35, 0.6, C.pierreChapelle, { x: xm, y: yc + 1.75, z: z1 }, M.pierre);
  haut.poser(new THREE.ConeGeometry(0.9, 1.0, 4), M.tuiles, 0x8a8a8a, { x: xm, y: yc + 2.4, z: z1, ry: Math.PI / 4 });
  haut.poser(GEO.dome, M.metal, 0x8a7a4a, { x: xm, y: yc + 0.85, z: z1, rx: Math.PI, e: [0.38, 0.5, 0.38] });
  haut.boite(0.05, 0.7, 0.05, 0x3a3a38, { x: xm, y: yc + 3.2, z: z1 }, M.metal);
  haut.boite(0.4, 0.05, 0.05, 0x3a3a38, { x: xm, y: yc + 3.35, z: z1 }, M.metal);
  // le perron, le seuil, la porte (un battant ouvert)
  c.pave(xm - 1.4, 0, z1 + 0.25, xm + 1.4, 0.15, z1 + 1.3, 0xb8ae96, M.pierre);
  c.boite(0.72, 2.7, 0.08, 0x5a4130, { x: xm - 0.4, y: 1.4, z: z1 + 0.6, ry: -1.2 }, M.mat);
  // l'intérieur : dallage, bancs, autel, la statue, le présentoir à cierges, les ex-voto
  c.pave(x0 + 0.27, 0, z0 + 0.27, x1 - 0.27, 0.04, z1 - 0.27, 0xb8b0a0, M.lisse, { crasse: false });
  for (let i = 0; i < 4; i++)
    for (const s of [-1, 1]) {
      const bz = z1 - 2.4 - i * 1.3;
      const tombe = bruit(i, s, 101) < u * 0.3;
      c.repere({ x: xm + s * 1.55, y: 0, z: bz, ry: tombe ? 0.4 : 0 }, () => {
        c.boite(2.2, 0.06, 0.38, 0x6a4a30, { y: 0.45 }, M.mat);
        c.boite(2.2, 0.5, 0.05, 0x6a4a30, { y: 0.75, z: 0.2 }, M.mat);
        for (const dx of [-1.0, 1.0]) c.boite(0.06, 0.45, 0.38, 0x5a4130, { x: dx, y: 0.22 }, M.mat);
      });
    }
  c.boite(2.2, 1.0, 0.9, 0xd8d0bc, { x: xm, y: 0.5, z: z0 + 1.2 }, M.pierre);
  c.boite(2.3, 0.02, 1.0, 0xeeeae0, { x: xm, y: 1.01, z: z0 + 1.2 }, M.toile, { crasse: false });
  c.boite(0.12, 0.6, 0.06, 0xb8963e, { x: xm, y: 1.3, z: z0 + 1.0 }, M.metal);
  c.boite(0.4, 0.06, 0.06, 0xb8963e, { x: xm, y: 1.45, z: z0 + 1.0 }, M.metal);
  c.tube([x0 + 0.9, 0, z0 + 1.2], [x0 + 0.9, 1.0, z0 + 1.2], 0.3, 0xc8bca2, M.pierre, 8);
  c.tube([x0 + 0.9, 1.0, z0 + 1.2], [x0 + 0.9, 1.9, z0 + 1.2], 0.2, 0xe8e4dc, M.lisse, 8);
  c.poser(GEO.boule, M.lisse, 0xe8e4dc, { x: x0 + 0.9, y: 2.05, z: z0 + 1.2, e: 0.16 });
  c.boite(0.6, 0.04, 0.4, 0x3a3a38, { x: x1 - 0.9, y: 0.95, z: z0 + 1.8 }, M.metal);
  c.tube([x1 - 0.9, 0, z0 + 1.8], [x1 - 0.9, 0.95, z0 + 1.8], 0.03, 0x3a3a38, M.metal, 5);
  for (let i = 0; i < 6; i++) c.tube([x1 - 1.1 + (i % 3) * 0.2, 0.97, z0 + 1.7 + Math.floor(i / 3) * 0.2], [x1 - 1.1 + (i % 3) * 0.2, 0.97 + 0.08 + (i % 2) * 0.05, z0 + 1.7 + Math.floor(i / 3) * 0.2], 0.025, 0xece4cc, M.satin, 5);
  panneau(c, M.enseignes, R.exVoto, { x: x0 + 0.29, y: 1.9, z: zc + 1, ry: Math.PI / 2 }, 1.6, 0.8);
  // la corde de la cloche, qui pend du plafond
  c.tube([xm + 0.6, 1.2, z1 - 0.8], [xm + 0.6, h, z1 - 0.8], 0.02, 0xc8b890, M.mat, 4);
  jonchee(c, x0 + 0.5, z0 + 0.5, x1 - 0.5, z1 - 0.5, 18);
  lierre(c, x1 + 0.28, 0, z0 + 2, Math.PI / 2, 4, 3 + u * 2, Math.round(30 + u * 50));
  lierre(c, xm - 2.5, 0, z1 + 0.28, 0, 2, 2 + u * 2, Math.round(16 + u * 20));
  if (u > 0.6) gravats(c, x0 + 1.2, zc - 2, 0.9, 7, [C.pierreChapelle, 0x8a8a8a]);
  // le petit enclos : un muret de pierre sèche autour du pré, un if, un banc
  for (const [xa, za, xb, zb] of [[-48.5, -19, -46.5, -19], [-37.5, -19, -35, -19]]) mur(c, [xa, za], [xb, zb], { h: 0.8, ep: 0.4, couleur: 0xb8ae96, mat: M.pierre, batiment: b, arase: 0.15 });
  arbre(c, -47.5, -24, 7, "feuillu");
  c.boite(1.4, 0.06, 0.4, PALETTE.boisGris, { x: -36.8, y: 0.45, z: -24 }, M.mat);
  for (const dz of [-0.6, 0.6]) c.boite(0.35, 0.44, 0.06, PALETTE.pierreSombre, { x: -36.8, y: 0.22, z: -24 + dz * 0.4 }, M.pierre);
}

function calvaire(ctx) {
  const { x, z } = CALVAIRE;
  if (!ctx.ici(x)) return;
  const { c, M, b } = ctx;
  c.boite(1.9, 0.3, 1.9, 0xb8ae96, { x, y: 0.15, z, ry: 0.1 }, M.pierre);
  c.boite(1.4, 0.3, 1.4, 0xc0b6a0, { x, y: 0.45, z, ry: 0.1 }, M.pierre);
  c.boite(0.9, 0.5, 0.9, 0xc8bca2, { x, y: 0.85, z, ry: 0.1 }, M.pierre);
  c.boite(0.32, 2.6, 0.32, 0xc8bca2, { x, y: 2.4, z, ry: 0.1 }, M.pierre);
  // la croix de fer forgé et ses volutes
  c.boite(0.08, 1.6, 0.08, 0x2a2a28, { x, y: 4.4, z, ry: 0.1 }, M.metal);
  c.boite(1.0, 0.08, 0.08, 0x2a2a28, { x, y: 4.6, z, ry: 0.1 }, M.metal);
  for (const s of [-1, 1]) {
    const g = new THREE.TorusGeometry(0.12, 0.015, 3, 8);
    c.poser(g, M.metal, 0x2a2a28, { x: x + s * 0.25, y: 4.45, z, ry: 0.1 }, { crasse: false });
    g.dispose();
  }
  c.boite(0.16, 0.5, 0.06, 0xc0b8a8, { x, y: 4.45, z: z + 0.07, ry: 0.1 }, M.lisse);
  // la bougie toujours allumée, les fleurs séchées dans un pot, des cailloux posés
  bougie(ctx, x + 0.25, 1.1, z + 0.5, 0.2);
  bougie(ctx, x - 0.2, 1.1, z + 0.48, 0.12);
  c.tube([x - 0.45, 0.6, z + 0.6], [x - 0.45, 0.85, z + 0.6], 0.1, 0x9a5a3a, M.mat, 7);
  for (let i = 0; i < 5; i++) c.poser(GEO.boule, M.mat, [0x9a7a6a, 0xb8a080, 0x8a6a7a][i % 3], { x: x - 0.45 + (bruit(i, 1, 111) - 0.5) * 0.25, y: 0.95 + bruit(i, 2, 111) * 0.15, z: z + 0.6 + (bruit(i, 3, 111) - 0.5) * 0.2, e: 0.07 });
  for (let i = 0; i < 6; i++) c.poser(GEO.boule, M.mat, 0x9a968c, { x: x + (bruit(i, 4, 111) - 0.5) * 1.2, y: 0.63, z: z + 0.55 + bruit(i, 5, 111) * 0.1, e: 0.05 });
  ctx.b.lumiere(x + 0.1, 1.5, z + 0.7, 0xffc060, 2.5, 6, "bougie au pied du calvaire (quelqu'un la remplace)");
  obstacleBoite(b, x, z, 1.9, 1.9, 0.1, "calvaire");
  arbuste(c, x - 1.8, z - 1.0, 1.2, 0, [0x4f6a3a, 0x3f5a32, 0x5a7a40]);
}

// ---------- L'aire de covoiturage autonome ----------

function covoiturage(ctx) {
  const { x0, x1, z0, z1 } = COVOIT;
  if (!ctx.ici((x0 + x1) / 2)) return;
  const { c, M, b, u } = ctx;
  c.pave(x0, 0.01, z0, x1, 0.035, z1 - 0.8, 0x8a8882, M.asphalte, { crasse: false });
  for (let i = 0; i <= 4; i++) c.boite(0.1, 0.01, 4.2, 0xd8d4c8, { x: x0 + 1 + i * 2.8, y: 0.045, z: z0 + 2.3 }, M.satin, { crasse: false });
  for (let i = 0; i < 4; i++) c.boite(1.0, 0.01, 1.0, 0x38c6a0, { x: x0 + 2.4 + i * 2.8, y: 0.046, z: z0 + 2.3 }, M.satin, { crasse: false });
  // le panneau de l'aire, la borne (son écran luit encore), son abri photovoltaïque
  for (const s of [-1, 1]) c.tube([-42 + s * 1.3, 0, z1 - 0.4], [-42 + s * 1.3, 2.8, z1 - 0.4], 0.05, 0x8a8e8a, M.metal, 6);
  panneauDouble(c, M.enseignes, R.covoitPanneau, { x: -42, y: 2.3, z: z1 - 0.4 }, 3.2, 0.8);
  const bx = -36.6;
  const bz = -10.6;
  c.repere({ x: bx, y: 0, z: bz, ry: 0.35 }, () => {
    c.boite(0.8, 0.1, 0.6, 0x9a9a92, { y: 0.05 }, M.satin);
    c.boite(0.62, 1.7, 0.42, 0xeeeae2, { y: 0.9 }, M.lisse);
    c.poser(GEO.dome, M.lisse, 0x38c6a0, { y: 1.75, e: [0.31, 0.18, 0.21] });
    panneau(c, M.neon, R.covoit, { y: 1.15, z: 0.215 }, 0.5, 0.5);
    c.boite(0.62, 0.08, 0.43, 0x38c6a0, { y: 0.45 }, M.lisse);
  });
  ctx.b.lumiere(bx + 0.2, 1.2, bz + 0.7, 0x5fe0c0, 1.5, 4, "écran de la borne de covoiturage autonome (cellule solaire)");
  obstacleBoite(b, bx, bz, 0.8, 0.6, 0.35, "borne");
  // la navette autonome (un œuf blanc sans volant) et deux voitures abandonnées
  c.repere({ x: -41.2, y: 0, z: -14.6, ry: 0.15 }, () => {
    c.poser(new THREE.SphereGeometry(1, 10, 6), M.lisse, 0xe6e2da, { y: 1.15, e: [2.1, 1.05, 1.05] });
    c.poser(new THREE.SphereGeometry(1, 10, 6), M.lisse, 0x2a3438, { y: 1.45, e: [1.5, 0.7, 1.08] });
    c.boite(3.6, 0.2, 0.02, 0x38c6a0, { y: 0.95, z: 1.03 }, M.lisse, { crasse: false });
    for (const [wx, wz] of [[1.2, -0.85], [1.2, 0.85], [-1.2, -0.85], [-1.2, 0.85]]) c.tube([wx, 0.32, wz - 0.1], [wx, 0.32, wz + 0.1], 0.32, COUL.pneu, M.mat, 7);
  });
  obstacleBoite(b, -41.2, -14.6, 4.2, 2.1, 0.15, "navette autonome");
  voiture(ctx, -46.2, -13.4, Math.PI / 2 + 0.1, { couleur: 0x37424e });
  voiture(ctx, -37.6, -15.0, Math.PI / 2 - 0.2, { portiere: true, couleur: 0xb8b4a8 });
  semerTouffes(c, x0, z0, x1, z1, Math.round(10 + u * 16));
}

// ---------- Les coins du rond-point ----------

function coins(ctx) {
  const { c, M, b, u } = ctx;
  if (!ctx.ici(-3)) return;
  // la meule de bottes rondes au sud-est (un point de vue sur le rond-point, un couvert)
  for (let i = 0; i < 3; i++) botte(ctx, -4.4 + i * 1.55, 24.5, { ronde: true, ry: Math.PI / 2, vieille: 0.7 });
  for (let i = 0; i < 2; i++) botte(ctx, -3.6 + i * 1.55, 24.5, { ronde: true, ry: Math.PI / 2, y: 1.3, vieille: 0.8 });
  obstacleBoite(b, -2.9, 24.5, 4.7, 1.6, 0, "meule de bottes");
  for (let i = 0; i < 5; i++) botte(ctx, -5 + i * 1.05, 27.2, { vieille: 0.6, ry: (bruit(i, 1, 121) - 0.5) * 0.3 });
  // une voiture partie dans la haie, au nord-est
  voiture(ctx, -3.4, -18.4, 0.9, { penche: -0.1, capot: true });
  // la table de pique-nique et la poubelle à couvercle
  c.repere({ x: -3, y: 0, z: -28, ry: 0.2 }, () => {
    c.boite(2.0, 0.06, 0.8, PALETTE.boisGris, { y: 0.75 }, M.mat);
    for (const s of [-1, 1]) c.boite(2.0, 0.05, 0.3, PALETTE.boisGris, { y: 0.45, z: s * 0.6 }, M.mat);
    for (const s of [-0.8, 0.8]) c.boite(0.08, 0.75, 1.5, PALETTE.bois, { x: s, y: 0.37 }, M.mat);
  });
  c.tube([-0.8, 0, -26.5], [-0.8, 0.9, -26.5], 0.28, 0x4a6a5a, M.tole, 8);
  semerTouffes(c, -8, 14, 0, 33, Math.round(10 + u * 14));
  semerTouffes(c, -8, -33, 0, -14, Math.round(10 + u * 14));
  arbuste(c, -1.5, 15.5, 1.4);
  arbuste(c, -1.4, -14.6, 1.2);
}

function rondPoint(ctx) {
  if (!ctx.ici(RP.x)) return;
  ilot(ctx);
  sculpture(ctx);
  anneau(ctx);
  barricadeNord(ctx);
  siloTombe(ctx);
}

export const TRONCON2 = [rondPoint, silos, chapelle, calvaire, covoiturage, coins];
