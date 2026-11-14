// Wattyland, carte « entrée » : la tête géante de Watty (le porche d'entrée est sa bouche), la billetterie et les files
// d'attente, le carrousel, la grande roue, les stands (tir, pêche aux canards, barbe à papa), la boutique de souvenirs
// et le poste de secours. Tout est dans le repère du site (voir plan.js).

import { THREE, C, M, TAU, PI, panneau, panneauPart, cyl, boule, quad, tri2, obstacleRect, obstacleCercle, lerp3 } from "./outils.js";
import { PLAN } from "./plan.js";
import { pavillon, toitPlat, dallage, pelouse, cloture, banc, poubelle, lampadaire, guirlande, peluche, brasero, couchage, caisse, lierre, semerTouffes, debris, jonchee } from "./mobilier.js";
import { Chantier, PALETTE, gravats, arbre, arbuste, mousse, touffes } from "../commun/atelier.js";

// ---------- Petits outils ----------

/** Un bloc aux arêtes verticales arrondies. `coins` : [nord-ouest, nord-est, sud-est, sud-ouest] arrondis ou non. */
function blocArrondi(c, x1, x2, z1, z2, y1, y2, r, couleur, mat, coins = [1, 1, 1, 1], cotes = 10) {
  const h = y2 - y1;
  const ym = (y1 + y2) / 2;
  c.pave(x1 + r, y1, z1, x2 - r, y2, z2, couleur, mat, { nuance: 0.02 });
  c.pave(x1, y1, z1 + r, x1 + r, y2, z2 - r, couleur, mat, { nuance: 0.02 });
  c.pave(x2 - r, y1, z1 + r, x2, y2, z2 - r, couleur, mat, { nuance: 0.02 });
  const pts = [[x1 + r, z1 + r, x1, z1], [x2 - r, z1 + r, x2 - r, z1], [x2 - r, z2 - r, x2 - r, z2 - r], [x1 + r, z2 - r, x1, z2 - r]];
  pts.forEach(([cx, cz, bx, bz], i) => {
    if (coins[i]) cyl(c, cx, ym, cz, r, r, h, couleur, mat, cotes, {}, false, { nuance: 0.02 });
    else c.pave(bx, y1, bz, bx + r, y2, bz + r, couleur, mat, { nuance: 0.02 });
  });
}

/** Un cylindre couché le long de z (un œil, un moyeu). */
function disqueZ(c, x, y, z, r, ep, couleur, mat, cotes = 16) {
  cyl(c, x, y, z, r, r, ep, couleur, mat, cotes, { rx: PI / 2 });
}

// ---------- La tête géante de Watty ----------

function teteWatty(ctx) {
  const { b, c, u } = ctx;
  const T = PLAN.tete;
  const x1 = T.x - T.l / 2;
  const x2 = T.x + T.l / 2;
  const { z0, z1 } = T;
  const bg = T.x - T.bouche / 2;
  const bd = T.x + T.bouche / 2;
  const k = b.couche("la tête de Watty", { x: T.x, z: (z0 + z1) / 2, l: T.l + 2, p: z1 - z0 + 1 }, 3.4, 11.5);
  const corps = C.canard;
  const mat = M.satin();
  // Les deux joues (piliers de la bouche) et la lèvre du haut
  blocArrondi(c, x1, bg, z0, z1, 0, 3.4, 1, corps, mat, [1, 0, 0, 1]);
  blocArrondi(c, bd, x2, z0, z1, 0, 3.4, 1, corps, mat, [0, 1, 1, 0]);
  c.pave(bg, 3.2, z0, bd, 3.4, z1, corps, mat);
  obstacleRect(b, x1, z0, bg, z1, "la tête de Watty");
  obstacleRect(b, bd, z0, x2, z1, "la tête de Watty");
  // Le corps (au-dessus de 3,4 m : s'efface quand on passe dessous)
  blocArrondi(k, x1, x2, z0, z1, 3.4, 8.15, 1, corps, mat);
  blocArrondi(k, x1 - 0.03, x2 + 0.03, z0 - 0.03, z1 + 0.03, 8.15, 8.3, 1, 0x1f2526, mat);
  blocArrondi(k, x1, x2, z0, z1, 8.3, T.h, 1, C.creme, mat);
  // Le reflet peint (bande claire), l'éclair rouge sous la bouche n'existe pas : c'est la bouche qui fait l'entrée
  k.pave(x1 + 0.7, 3.9, z1, x1 + 1.15, 7.8, z1 + 0.03, C.canardPale, mat);
  // La borne « + » dorée, sur le dessus
  k.pave(T.x - 1.45, T.h, z0 + 0.6, T.x + 1.45, T.h + 0.85, z1 - 0.6, C.or, mat);
  k.pave(T.x - 0.5, T.h + 0.32, z1 - 0.62, T.x + 0.5, T.h + 0.52, z1 - 0.58, C.rougeVif, mat);
  k.pave(T.x - 0.1, T.h + 0.12, z1 - 0.62, T.x + 0.1, T.h + 0.72, z1 - 0.58, C.rougeVif, mat);
  panneau(k, "wattyland", T.x, 9.2, z1 + 0.02, 7.4, 0.92);
  // Les yeux : deux grosses lampes ; la gauche luit encore, la droite est morte, verre étoilé
  const ey = 6.6;
  for (const [ex, vivant] of [[T.x - 2, true], [T.x + 2, false]]) {
    disqueZ(k, ex, ey, z1 + 0.1, 1.0, 0.22, C.creme, mat);
    disqueZ(k, ex, ey, z1 + 0.22, 0.66, 0.08, C.fonte, mat, 14);
    if (vivant) disqueZ(k, ex + 0.08, ey - 0.05, z1 + 0.28, 0.5, 0.06, 0xffcf6a, M.ampoule(), 14);
    else {
      disqueZ(k, ex, ey, z1 + 0.27, 0.52, 0.04, 0x26302f, mat, 14);
      for (let i = 0; i < 4; i++) {
        const a = c.hasard() * TAU;
        tri2(k, mat, 0x8a9aa0, [[ex + Math.cos(a) * 0.5, ey + Math.sin(a) * 0.5, z1 + 0.31], [ex + Math.cos(a + 0.5) * 0.5, ey + Math.sin(a + 0.5) * 0.5, z1 + 0.31], [ex + Math.cos(a + 0.2) * 0.2, ey + Math.sin(a + 0.2) * 0.2, z1 + 0.31]]);
      }
      panneau(k, "coulures", ex, ey - 1.8, z1 + 0.02, 0.9, 2.2); // (atlas déjà présent dans la couche)
    }
  }
  b.lumiere(T.x - 2, ey, z1 + 1.2, 0xffd9a0, 7, 15, "l'œil de Watty (il luit encore)");
  // La bouche : lèvre rouge, commissures relevées, deux dents, la gorge sombre, la langue en tapis
  const levre = 0x8f3a34;
  k.pave(bg - 0.35, 3.4, z1, bd + 0.35, 3.75, z1 + 0.12, levre, mat);
  for (const s of [-1, 1]) k.boite(0.32, 1.1, 0.12, levre, { x: T.x + s * (T.bouche / 2 + 0.45), y: 3.9, z: z1 + 0.06, rz: -s * 0.55 }, mat);
  c.pave(bg - 0.25, 0, z1, bg, 3.4, z1 + 0.12, levre, mat);
  c.pave(bd, 0, z1, bd + 0.25, 3.4, z1 + 0.12, levre, mat);
  for (const s of [-1, 1]) c.pave(T.x + s * 0.05, 2.62, z1 - 0.3, T.x + s * 0.9, 3.2, z1 - 0.05, C.creme, mat);
  const gorge = 0x5a2a2a;
  c.pave(bg, 0, z0, bg + 0.02, 3.2, z1, gorge, M.mat());
  c.pave(bd - 0.02, 0, z0, bd, 3.2, z1, gorge, M.mat());
  c.pave(bg, 3.18, z0, bd, 3.2, z1, gorge, M.mat());
  c.pave(bg + 0.2, 0, z0 - 0.4, bd - 0.2, 0.04, z1 + 1.2, 0x9a5058, M.mat(), { crasse: false });
  // Les tourniquets à reconnaissance faciale ; le coupe-file du milieu est grand ouvert
  for (const tx of [bg + 0.55, bd - 0.55]) {
    c.boite(0.3, 1.0, 0.5, C.acier, { x: tx, y: 0.5, z: (z0 + z1) / 2 }, M.metal());
    const casse = tx > T.x && u > 0.4;
    for (let i = 0; i < (casse ? 2 : 3); i++) {
      const a = (i / 3) * TAU + 0.4;
      c.poutre([tx, 0.95, (z0 + z1) / 2], [tx + (tx < T.x ? 1 : -1) * Math.cos(a) * 0.55, 0.95 + Math.sin(a) * 0.3, (z0 + z1) / 2 + Math.sin(a) * 0.2], 0.04, 0xc9c6bc, M.metal());
    }
    c.boite(0.16, 1.5, 0.16, 0x2b3133, { x: tx, y: 0.75, z: z1 - 0.2 }, M.lisse());
    panneau(c, "ecran", tx, 1.55, z1 - 0.11, 0.34, 0.34);
    b.obstacle(tx, z0 + 0.4, tx, z1 - 0.4, "tourniquet");
  }
  if (u > 0.3) c.poutre([bd - 0.6, 0.05, z1 + 0.5], [bd - 0.1, 0.12, z1 + 1.0], 0.04, 0xc9c6bc, M.metal());
  // Les bras : le gauche salue encore, le droit est tombé sur le parvis
  const epaule = [x1 - 0.1, 5.6, (z0 + z1) / 2 + 0.3];
  const brasG = [epaule, [x1 - 1.6, 6.3, 22.4], [x1 - 2.5, 7.9, 22.8], [x1 - 2.4, 9.4, 23.0]];
  for (let i = 0; i < brasG.length - 1; i++) k.tube(brasG[i], brasG[i + 1], 0.3, 0x24292a, mat, 8);
  boule(k, x1 - 2.35, 10.05, 23.05, 0.72, 0xe8e0cc, mat, [1, 1.1, 0.8], 1);
  k.tube([x2 + 0.1, 5.6, 22.2], [x2 + 0.75, 5.2, 22.4], 0.3, 0x24292a, mat, 8);
  boule(k, x2 + 0.8, 5.2, 22.4, 0.33, 0x6a5040, mat);
  const sol = [[x2 + 0.6, 0.3, 24.3], [x2 + 2.2, 0.3, 25.0], [x2 + 3.4, 0.35, 25.9]];
  for (let i = 0; i < sol.length - 1; i++) c.tube(sol[i], sol[i + 1], 0.3, 0x24292a, mat, 8);
  boule(c, x2 + 4.0, 0.55, 26.3, 0.72, 0xd8cfb8, mat, [1, 0.8, 1.1], 1);
  b.obstacle(x2 + 0.6, 24.3, x2 + 3.4, 25.9, "le bras tombé de Watty");
  // La peinture qui s'en va par plaques, la rouille, le lierre
  const ecailles = [[x1 + 1.5, 1.6, 1.8], [x2 - 1.2, 2.2, 1.4], [T.x - 3.2, 5.0, 1.6], [T.x + 2.9, 4.6, 2.0], [T.x + 0.4, 7.6, 1.3], [T.x - 2.8, 8.8, 1.0], [T.x + 3.1, 9.4, 1.2]];
  ecailles.forEach(([ex, ey2, s], i) => {
    if (i > 2 + Math.round(u * 5)) return;
    panneau(ey2 > 3.4 ? k : c, "ecaille", ex, ey2, z1 + 0.025, s * 1.3, s, 0, 0, 0xffffff, c.hasard() * 3);
  });
  for (const [s, zz] of [[-1, 22], [1, 21.5]]) {
    const xx = s < 0 ? x1 : x2;
    panneau(k, "ecaille", xx + s * 0.02, 6 + s, zz, 2, 1.6, (s * PI) / 2);
    panneau(c, "ecaille", xx + s * 0.02, 1.8, zz + 0.3, 1.6, 1.3, (s * PI) / 2);
  }
  lierre(c, x1 + 0.9, 0, z1 + 0.04, 0, 1.6, 3.2, 60);
  lierre(c, x2 + 0.03, 0, z0 + 1.5, PI / 2, 2.2, 2.6, 40);
  touffes(c, [[x1 - 0.2, z1 + 0.2], [x1 + 0.4, z1 + 0.3], [x2 + 0.2, z1 + 0.25], [bg - 0.4, z1 + 0.3], [bd + 0.5, z1 + 0.25]]);
}

// ---------- Le parvis : billetterie, files d'attente, coupe-file premium ----------

function parvis(ctx) {
  const { b, c, u } = ctx;
  const T = PLAN.tete;
  dallage(ctx, -52, 22.2, -0.2, 30, C.asphalte, 2.5);
  // La billetterie
  const G = PLAN.guichet;
  const k = b.couche("la billetterie", { x: (G.x1 + G.x2) / 2, z: (G.z1 + G.z2) / 2, l: G.x2 - G.x1 + 1, p: G.z2 - G.z1 + 1.2 }, 1, 4.8);
  pavillon(ctx, k, {
    ...G, h: 3.0, couleur: C.creme, sol: 0x9a958a, interieur: { couleur: 0xd8cfb4, mat: M.mat() }, bris: 0.3 + 0.5 * u,
    ouv: {
      s: [-44.6, -43, -41.4].map((at) => ({ at, l: 1.0, bas: 1.0, haut: 2.1, type: "fenetre", croisillons: 0, traverses: 1, cadre: C.canard })),
      e: [{ at: 26.6, l: 1.2, bas: 1.0, haut: 2.2, type: "fenetre", croisillons: 1, cadre: C.canard }],
      o: [{ at: 25, l: 1.0, bas: 0, haut: 2.2, type: "vide" }],
    },
  });
  // Soubassement bleu canard, guichets
  c.pave(G.x1 - 0.14, 0, G.z2 + 0.12, G.x2 + 0.14, 0.9, G.z2 + 0.16, C.canard, M.satin());
  c.pave(G.x1 + 0.15, 0, G.z2 - 0.75, G.x2 - 0.15, 0.95, G.z2 - 0.15, C.bois, M.mat());
  c.pave(G.x1 + 0.12, 0.95, G.z2 - 0.8, G.x2 - 0.12, 1.0, G.z2 - 0.1, 0x9a7a52, M.satin());
  for (const at of [-44.6, -43, -41.4]) {
    c.boite(0.35, 0.25, 0.3, 0x3a3c3a, { x: at, y: 1.12, z: G.z2 - 0.45 }, M.satin()); // imprimante à billets
    panneau(c, "ecran", at + 0.68, 1.55, G.z2 + 0.15, 0.3, 0.3); // caméra de reconnaissance faciale
    cyl(c, at, 0.35, G.z2 - 1.2, 0.18, 0.18, 0.7, C.fonte, M.tole(), 6);
  }
  b.obstacle(G.x1 + 0.15, G.z2 - 0.8, G.x2 - 0.15, G.z2 - 0.8, "comptoir");
  c.boite(0.7, 0.9, 0.6, 0x4a4e4c, { x: G.x1 + 0.6, y: 0.45, z: G.z1 + 0.55 }, M.tole()); // le coffre
  c.boite(0.1, 0.12, 0.6, C.acier, { x: G.x1 + 0.97, y: 0.6, z: G.z1 + 0.55 }, M.metal());
  c.pave(G.x2 - 0.5, 0, G.z1 + 0.15, G.x2 - 0.15, 1.8, G.z1 + 2.2, C.boisSombre, M.mat()); // étagère
  for (let i = 0; i < 6; i++) c.boite(0.25, 0.25, 0.25, 0xd8c8a0, { x: G.x2 - 0.33, y: 0.5 + (i % 3) * 0.5, z: G.z1 + 0.5 + Math.floor(i / 3) * 1.1 }, M.mat());
  c.boite(0.45, 0.04, 0.45, C.boisSombre, { x: -42, y: 0.25, z: 25.2, rx: 1.4, ry: 0.4 }, M.mat()); // chaise renversée
  jonchee(ctx.c, G.x1 + 0.3, G.z1 + 0.3, G.x2 - 0.3, G.z2 - 1, 30, [0xe6dcc0, 0xd8c8a0, 0xc96a5a, 0x9fb8c0]);
  // Toit, enseigne, affiche
  toitPlat(k, G.x1, G.z1, G.x2, G.z2, 3.0, 0x6e6a64, { debord: 0.5, couleurAcrotere: C.canard });
  panneau(k, "billetterie", (G.x1 + G.x2) / 2, 3.95, G.z2 + 0.52, 5.6, 0.7);
  for (const s of [-1, 1]) k.boite(0.08, 0.5, 0.08, C.fonte, { x: (G.x1 + G.x2) / 2 + s * 2.4, y: 3.7, z: G.z2 + 0.5 }, M.mat());
  panneau(c, "affiche", G.x2 + 0.14, 1.6, 24.75, 0.9, 1.35, PI / 2);
  // La file d'attente ordinaire : poteaux et barres en zigzag, quelques-uns renversés
  const zs = [24.4, 25.6, 26.8, 28.0, 29.2];
  const xa = -38.6;
  const xb = -32.6;
  zs.forEach((zz, i) => {
    const ouvertA = i % 2 === 0;
    const xg = ouvertA ? xa + 1.2 : xa;
    const xd = ouvertA ? xb : xb - 1.2;
    for (let x = xg; x <= xd + 0.01; x += 1.5) {
      const tombe = c.hasard() < 0.08 + 0.15 * u;
      if (tombe) cyl(c, x + 0.4, 0.06, zz, 0.04, 0.04, 1.0, C.acier, M.metal(), 6, { rz: PI / 2 - 0.1 });
      else cyl(c, x, 0.5, zz, 0.04, 0.04, 1.0, C.acier, M.metal(), 6);
    }
    c.poutre([xg, 0.95, zz], [xd, 0.95, zz], 0.04, C.acier, M.metal());
    c.poutre([xg, 0.6, zz], [xd, 0.6, zz], 0.03, C.acier, M.metal());
    b.obstacle(xg, zz, xd, zz, "barrière de file d'attente");
  });
  debris(c, xa, 24, xb, 29.6, 30, [0xe6dcc0, 0xc8b490, 0x9fb8c0, 0x7a8a6a]);
  // Le coupe-file premium : tapis rouge, poteaux dorés, cordons de velours ; parfaitement vide
  const xp = T.x + 0.8;
  c.pave(xp - 0.65, 0, T.z1 + 1.2, xp + 0.65, 0.035, 29.7, 0x8a3434, M.mat(), { crasse: false });
  for (const s of [-1, 1]) {
    let prec = null;
    for (let z = T.z1 + 1.4; z <= 29.6; z += 1.4) {
      const x = xp + s * 0.85;
      cyl(c, x, 0.5, z, 0.05, 0.05, 1.0, C.or, M.metal(), 8);
      boule(c, x, 1.04, z, 0.07, C.or, M.metal());
      if (prec !== null) {
        const m = (prec + z) / 2;
        c.poutre([x, 0.95, prec], [x, 0.78, m], 0.035, 0x7a2630, M.satin());
        c.poutre([x, 0.78, m], [x, 0.95, z], 0.035, 0x7a2630, M.satin());
      }
      prec = z;
    }
    b.obstacle(xp + s * 0.85, T.z1 + 1.4, xp + s * 0.85, 29.6, "cordon du coupe-file");
  }
  for (const s of [-1.3, 1.3]) c.boite(0.08, 2.2, 0.08, C.or, { x: xp + s, y: 1.1, z: 29.75 }, M.metal());
  panneau(c, "coupeFile", xp, 2.0, 29.8, 2.6, 0.65);
  // Une voiturette électrique de la Compagnie, garée de travers
  c.repere({ x: -10, z: 26.5, ry: 0.4 }, () => {
    c.boite(2.4, 0.6, 1.3, C.creme, { y: 0.55 }, M.satin());
    c.boite(1.0, 0.7, 1.25, C.canard, { x: -0.5, y: 1.2 }, M.satin());
    c.boite(0.05, 0.6, 1.1, 0x3a5560, { x: 0.05, y: 1.25 }, M.lisse());
    c.boite(2.2, 0.05, 1.35, C.canard, { y: 1.9 }, M.satin());
    for (const [px, pz] of [[-1, -0.6], [1, -0.6], [-1, 0.6], [1, 0.6]]) c.boite(0.06, 1.0, 0.06, C.acier, { x: px, y: 1.4, z: pz }, M.metal());
    for (const [px, pz] of [[-0.8, -0.68], [0.8, -0.68], [-0.8, 0.68], [0.8, 0.68]]) cyl(c, px, 0.25, pz, 0.25, 0.25, 0.15, C.caoutchouc, M.mat(), 8, { rx: PI / 2 });
    panneau(c, "souriez", 0.6, 0.6, 0.66, 1.0, 0.5);
  });
  obstacleRect(b, -11.3, 25.6, -8.7, 27.4, "voiturette");
}

// ---------- L'allée principale et son mobilier ----------

function allees(ctx) {
  const { b, c, u } = ctx;
  const A = PLAN.allee;
  const R = PLAN.carrousel;
  const S = PLAN.alleeStands;
  const horsCarrousel = (x, z) => Math.hypot(x - R.x, z - R.z) > R.r + 0.3;
  dallage(ctx, A.x1, A.z1, A.x2, PLAN.tete.z0, C.terrazzo, 2, horsCarrousel);
  dallage(ctx, A.x2, S.z1, 0, S.z2, C.terrazzo, 2);
  // La place du carrousel (anneau de dalles) et l'allée de la grande roue
  dallage(ctx, R.x - 10.5, R.z - 10.5, A.x1, R.z + 10.5, 0xb9ad98, 2, (x, z) => {
    const d = Math.hypot(x - R.x, z - R.z);
    return d > R.r + 0.4 && d < 10.5;
  });
  dallage(ctx, -50, -14, A.x1, -10, C.terrazzo, 2);
  dallage(ctx, -59, -25, -43, -15, 0xa59f92, 2);
  dallage(ctx, A.x2, -1, -1, 4, 0xb4ab98, 2, () => true, 0.25 + 0.2 * u);
  // Lampadaires et guirlandes qui zigzaguent au-dessus de l'allée
  const zl = [18, 10, 2, -6];
  const g = zl.map((z) => lampadaire(ctx, A.x1 - 0.3, z, 4.2));
  const d = zl.map((z, i) => lampadaire(ctx, A.x2 + 0.3, z, 4.2, i === 2 ? 0.08 * u : 0));
  for (let i = 0; i < zl.length; i++) {
    guirlande(ctx, g[i], d[i], 0.7, 0.35);
    if (i < zl.length - 1) guirlande(ctx, d[i], g[i + 1], 0.9, 0.3, i === 1 && u > 0.5);
  }
  b.lumiere(A.x2 - 2, 3.4, 10, 0xff9ad8, 5, 11, "guirlande d'ampoules qui clignote (faux contact)");
  // Allée des stands
  const xs = [-22, -13, -4];
  const n = xs.map((x) => lampadaire(ctx, x, S.z1 - 0.3, 4.2));
  const s = xs.map((x) => lampadaire(ctx, x + 4.5, S.z2 + 0.3, 4.2));
  for (let i = 0; i < xs.length; i++) {
    guirlande(ctx, n[i], s[i], 0.8, 0.35);
    if (i < xs.length - 1) guirlande(ctx, s[i], n[i + 1], 0.8, 0.3);
  }
  guirlande(ctx, s[2], [3, 4, S.z1 - 0.3], 0.8, 0.3);
  b.lumiere(-12, 3.4, 14.5, 0xffd27a, 5, 11, "guirlande d'ampoules de l'allée des stands");
  // Bancs, poubelles-mascottes
  banc(ctx, A.x1 - 1.2, 14, PI / 2);
  banc(ctx, A.x1 - 1.2, 6.5, PI / 2, u > 0.5);
  banc(ctx, A.x2 + 1.2, -3, -PI / 2);
  banc(ctx, -16, S.z2 + 1.3, PI);
  banc(ctx, -7, S.z2 + 1.3, PI, true);
  banc(ctx, -47, -11, 0);
  poubelle(ctx, A.x1 - 0.8, 16.2, PI / 2);
  poubelle(ctx, A.x2 + 0.8, 4.5, -PI / 2, u > 0.35);
  poubelle(ctx, -10, S.z2 + 1.0, PI);
  poubelle(ctx, -40, -11.5, 0);
  // Le plan du parc et le grand panneau « Ici, même les sourires sont rechargeables ! »
  c.repere({ x: A.x1 - 1.6, z: 19.5, ry: 0.5 }, () => {
    for (const s2 of [-0.6, 0.6]) c.boite(0.1, 2.4, 0.1, C.fonte, { x: s2, y: 1.2 }, M.tole());
    c.boite(1.5, 1.5, 0.08, C.canard, { y: 1.7, z: -0.06 }, M.satin());
    panneau(c, "plan", 0, 1.7, 0.0, 1.35, 1.35);
  });
  c.repere({ x: -40.5, z: 17.2, ry: 0.35 }, () => {
    for (const s2 of [-1.6, 1.6]) c.boite(0.16, 3.4, 0.16, C.fonte, { x: s2, y: 1.7 }, M.tole());
    c.boite(4.3, 2.3, 0.1, 0x3a3c3a, { y: 2.3, z: -0.07 }, M.tole());
    panneau(c, "sourires", 0, 2.3, 0, 4.1, 2.05, 0, u > 0.6 ? 0.04 : 0);
  });
  b.obstacle(-42.1, 16.6, -38.9, 17.8, "panneau");
}

// ---------- Le Watty animatronique (il bégaie encore, sur panneau solaire) ----------

function animatronique(ctx) {
  const { b, c } = ctx;
  const { x, z } = PLAN.animatronique;
  cyl(c, x, 0.2, z, 1.25, 1.3, 0.4, C.canard, M.satin(), 12);
  cyl(c, x, 0.41, z, 1.18, 1.18, 0.02, C.creme, M.satin(), 12);
  panneau(c, "souriez", x, 0.22, z + 1.31, 0.9, 0.36);
  obstacleCercle(b, x, z, 1.3, 8, "le Watty animatronique");
  c.repere({ x, z, y: 0.42, rz: 0.06 }, () => {
    for (const s of [-1, 1]) {
      c.tube([s * 0.17, 0, 0], [s * 0.2, 0.45, 0], 0.05, 0x24292a, M.satin(), 6);
      c.boite(0.22, 0.1, 0.32, C.rougeVif, { x: s * 0.22, y: 0.05, z: 0.06 }, M.satin());
    }
    c.boite(0.72, 0.95, 0.42, C.canard, { y: 0.92 }, M.satin());
    c.boite(0.74, 0.22, 0.44, C.creme, { y: 1.48 }, M.satin());
    c.boite(0.26, 0.09, 0.2, C.or, { y: 1.64 }, M.metal());
    c.boite(0.1, 0.12, 0.02, 0x9ff0ff, { x: -0.15, y: 1.22, z: 0.215 }, M.ampoule());
    c.boite(0.1, 0.12, 0.02, C.noir, { x: 0.15, y: 1.22, z: 0.215 }, M.mat());
    c.boite(0.34, 0.04, 0.02, C.noir, { y: 1.06, z: 0.215 }, M.mat());
    c.boite(0.1, 0.22, 0.02, C.rougeVif, { y: 0.74, z: 0.215, rz: 0.4 }, M.satin());
    c.tube([0.38, 1.2, 0], [0.5, 0.75, 0.05], 0.05, 0x24292a, M.satin(), 6);
    boule(c, 0.52, 0.68, 0.06, 0.09, 0xe8e0cc, M.satin());
    panneau(c, "ecaille", 0, 0.9, 0.215, 0.6, 0.6);
  });
  // Le bras qui salue : un maillage à part, qui tourne par à-coups
  const bras = new Chantier(77);
  bras.tube([0, 0, 0], [-0.5, 0.05, 0.04], 0.05, 0x24292a, M.satin(), 6);
  const g = new THREE.IcosahedronGeometry(0.1, 0);
  bras.poser(g, M.satin(), 0xe8e0cc, { x: -0.56, y: 0.06, z: 0.04 }, { crasse: false });
  const objet = bras.construire();
  const pivot = new THREE.Group();
  pivot.add(objet);
  pivot.position.set(x - 0.4, 0.42 + 1.2, z);
  pivot.userData.deplacer = true;
  pivot.userData.animer = (t) => {
    // Il salue… se fige… repart en tremblant : le moteur bégaie
    const p = t % 5.3;
    let a;
    if (p < 2.4) a = -0.9 - 0.45 * Math.abs(Math.sin(p * 4.2));
    else if (p < 3.6) a = -1.1 + (Math.floor(p * 18) % 2 ? 0.05 : -0.05);
    else a = -0.3 - 0.8 * Math.min(1, (p - 3.6) * 1.4);
    pivot.rotation.z = a;
  };
  pivot.userData.animer(0);
  b.ajouter(pivot);
  // Le panneau solaire qui le fait encore vivre, et son câble
  c.boite(0.1, 2.4, 0.1, C.acier, { x: x + 0.3, y: 1.2, z: z - 1.6 }, M.metal());
  c.boite(1.5, 0.05, 1.0, 0x24344c, { x: x + 0.3, y: 2.45, z: z - 1.6, rx: 0.65 }, M.lisse());
  for (let i = -1; i <= 1; i++) c.boite(0.02, 0.06, 1.0, C.acier, { x: x + 0.3 + i * 0.5, y: 2.46, z: z - 1.6, rx: 0.65 }, M.metal());
  c.poutre([x + 0.3, 0.05, z - 1.6], [x + 0.6, 0.05, z - 1.0], 0.03, 0x1a1a1a, M.mat());
  b.lumiere(x, 1.8, z + 0.6, 0x7fe0ff, 2.5, 6, "les yeux du Watty animatronique (panneau solaire)");
}

// ---------- Le carrousel ----------

const ROBES = [0xe2dccd, 0xd8d0bc, 0xb9b3a6, 0xc9b08a, 0x8a7a68, 0xe6e0d4];
const SELLES = [0xa94a3c, 0x3f7774, 0xb8963e, 0x5b7f97, 0x8a5a7a];

/** Un cheval de bois : galop figé, selle, crinière, harnais doré ; `sansTete` : cassé. */
export function cheval(c, robe, selle, sansTete = false) {
  const m = M.satin();
  c.boite(1.2, 0.44, 0.38, robe, { y: 0 }, m, { crasse: false, nuance: 0.06 });
  c.boite(0.42, 0.4, 0.4, robe, { x: -0.48, y: 0.02 }, m, { crasse: false });
  c.boite(0.62, 0.24, 0.42, selle, { y: 0.12 }, m, { crasse: false });
  c.boite(0.4, 0.1, 0.44, 0x4a2a20, { y: 0.27 }, m, { crasse: false });
  c.boite(0.06, 0.22, 0.42, C.or, { x: 0.42, y: 0.04 }, M.metal(), { crasse: false });
  c.boite(0.28, 0.68, 0.27, robe, { x: 0.55, y: 0.36, rz: -0.6 }, m, { crasse: false });
  c.boite(0.1, 0.62, 0.08, 0x3a3028, { x: 0.47, y: 0.47, rz: -0.6 }, m, { crasse: false });
  if (!sansTete) {
    c.boite(0.52, 0.22, 0.2, robe, { x: 0.86, y: 0.62, rz: -0.65 }, m, { crasse: false });
    for (const s of [-0.06, 0.06]) c.boite(0.05, 0.13, 0.04, robe, { x: 0.74, y: 0.86, z: s }, m, { crasse: false });
    c.boite(0.05, 0.05, 0.22, C.or, { x: 0.95, y: 0.55, rz: -0.65 }, M.metal(), { crasse: false });
  }
  c.boite(0.08, 0.5, 0.08, 0x3a3028, { x: -0.74, y: -0.08, rz: 0.55 }, m, { crasse: false });
  for (const s of [-0.12, 0.12]) {
    c.boite(0.1, 0.45, 0.1, robe, { x: 0.62, y: -0.27, z: s, rz: 1.0 }, m, { crasse: false });
    c.boite(0.1, 0.6, 0.1, robe, { x: -0.58, y: -0.45, z: s, rz: -0.32 }, m, { crasse: false });
  }
}

function carrousel(ctx) {
  const { b, c, u } = ctx;
  const { x: X, z: Z, r: R } = PLAN.carrousel;
  const k = b.couche("le chapiteau du carrousel", { x: X, z: Z, l: R * 2 + 1, p: R * 2 + 1 }, 3.6, 9.6);
  const P = 0.18; // hauteur du plancher
  const pos = (r, a) => [X + Math.cos(a) * r, Z + Math.sin(a) * r];
  // Le plancher, sa jupe crème et dorée
  cyl(c, X, P / 2, Z, R, R, P, 0x8a6a48, M.mat(), 24);
  cyl(c, X, P / 2, Z, R + 0.05, R + 0.05, P * 0.7, C.creme, M.satin(), 24, {}, true);
  for (let i = 0; i < 24; i += 2) {
    const a = (i / 24) * TAU;
    const [px, pz] = pos(R + 0.07, a);
    c.boite(0.25, 0.08, 0.03, C.or, { x: px, y: P * 0.5, z: pz, ry: PI / 2 - a }, M.metal());
  }
  // L'arbre qui a poussé par une planche arrachée
  const aArbre = -2.4;
  const [ax, az] = pos(6.2, aArbre);
  // Le tambour central : miroirs ternis et panneaux peints
  const RT = 1.75;
  cyl(c, X, P + 1.75, Z, RT, RT, 3.5, C.creme, M.satin(), 12);
  cyl(k, X, 3.68 + 0.45, Z, RT, RT * 0.9, 0.9, C.creme, M.satin(), 12);
  obstacleCercle(b, X, Z, RT + 0.05, 12, "le tambour du carrousel");
  for (let i = 0; i < 12; i++) {
    const a = ((i + 0.5) / 12) * TAU;
    const [px, pz] = pos(RT * 0.97, a);
    const ry = Math.atan2(Math.cos(a), Math.sin(a));
    if (i % 2 === 0) {
      const brise = c.hasard() < 0.25 + 0.4 * u;
      c.boite(0.62, 1.3, 0.04, brise ? 0x3a4448 : 0xb9c4c6, { x: px, y: 2.2, z: pz, ry }, M.lisse(), { crasse: false });
      c.boite(0.72, 1.42, 0.03, C.or, { x: X + Math.cos(a) * RT * 0.955, y: 2.2, z: Z + Math.sin(a) * RT * 0.955, ry }, M.metal());
    } else panneauPart(c, "frise", [(i % 4) / 4, (i % 4) / 4 + 0.25, 0, 1], X + Math.cos(a) * RT * 0.99, 2.25, Z + Math.sin(a) * RT * 0.99, 0.85, 0.8, ry);
  }
  // L'orgue de Barbarie, tourné vers le sud-est
  {
    const a = PI / 4;
    const [ox, oz] = pos(RT + 0.32, a);
    c.repere({ x: ox, y: P, z: oz, ry: Math.atan2(Math.cos(a), Math.sin(a)) }, () => {
      c.boite(1.6, 1.4, 0.6, C.creme, { y: 0.7 }, M.satin());
      c.boite(1.7, 0.12, 0.66, C.or, { y: 1.42 }, M.metal());
      c.boite(1.2, 0.5, 0.5, C.rouge, { y: 1.72, z: -0.05 }, M.satin());
      for (let i = 0; i < 9; i++) {
        const hp = 0.4 + (4 - Math.abs(i - 4)) * 0.09;
        cyl(c, -0.56 + i * 0.14, 0.8 + hp / 2, 0.31, 0.045, 0.045, hp, i % 2 ? C.or : 0xcfcabb, M.metal(), 6);
      }
      cyl(c, 0, 0.32, 0.33, 0.24, 0.24, 0.12, C.rouge, M.satin(), 10, { rx: PI / 2 });
      peluche(c, 0.62, 1.48, 0.1, 1.4, -0.3);
      panneau(c, "ecaille", -0.3, 0.6, 0.305, 0.7, 0.6);
    });
  }
  // Les chevaux de bois : deux rangs, figés à mi-galop ; certains manquent, d'autres sont tombés
  const camp = 1.95; // angle du camp des survivants (vers le sud-sud-ouest)
  const rangs = [[5.7, 14], [3.95, 10]];
  let n = 0;
  for (const [r, nb] of rangs) {
    for (let i = 0; i < nb; i++) {
      const a = (i / nb) * TAU + (r < 5 ? 0.3 : 0);
      n++;
      const proche = (aa, ref, d) => Math.abs(Math.atan2(Math.sin(aa - ref), Math.cos(aa - ref))) < d;
      if (proche(a, aArbre, 0.35) && r > 5) continue;
      const [px, pz] = pos(r, a);
      const ry = Math.atan2(-Math.cos(a), -Math.sin(a));
      const barre = (y1, y2) => c.tube([px, y1, pz], [px, y2, pz], 0.035, C.or, M.metal(), 6);
      if (proche(a, camp, 0.42)) {
        if (r < 5) barre(P, 4.2);
        continue;
      }
      const sort = c.hasard();
      const h = 1.2 + 0.25 * Math.sin(n * 2.1);
      if (sort < 0.1 + 0.2 * u) {
        // Tombé de sa barre, couché sur le plancher (ou dans l'herbe, pour le rang extérieur)
        const dehors = r > 5 && sort < 0.12;
        const rr = dehors ? R + 1.2 : r;
        const [qx, qz] = pos(rr, a + 0.08);
        c.repere({ x: qx, y: (dehors ? 0 : P) + 0.2, z: qz, ry: ry + 0.6, rx: PI / 2 - 0.15 }, () => cheval(c, ROBES[n % ROBES.length], SELLES[n % SELLES.length], sort < 0.05));
        barre(P, 1.0 + c.hasard());
        c.tube([px, 3.3, pz], [px, 4.2, pz], 0.035, C.or, M.metal(), 6);
        continue;
      }
      if (n % 9 === 4) {
        // Un carrosse à la place d'un cheval
        c.repere({ x: px, y: P, z: pz, ry }, () => {
          c.boite(1.3, 0.5, 0.9, C.rouge, { y: 0.45 }, M.satin());
          c.boite(0.15, 1.1, 0.9, C.rouge, { x: -0.6, y: 0.75 }, M.satin());
          c.boite(0.5, 0.15, 0.95, C.or, { x: 0.5, y: 0.75, rz: 0.4 }, M.metal());
          c.boite(1.2, 0.08, 0.8, 0x6a3a30, { y: 0.72 }, M.mat());
        });
        continue;
      }
      barre(P, 4.2);
      c.repere({ x: px, y: P + h, z: pz, ry }, () => cheval(c, ROBES[n % ROBES.length], SELLES[(n * 3) % SELLES.length], sort > 0.9 && u > 0.6));
      if (sort < 0.45) panneau(c, "ecaille", px, P + h + 0.05, pz, 0.6, 0.4, ry + PI / 2, 0, 0xffffff);
    }
  }
  // Le camp des survivants : le feu dans un demi-fût, couchages entre les barres, linge qui sèche
  const [fx, fz] = pos(4.8, camp);
  brasero(ctx, fx, fz, P, "feu de survivants dans le carrousel");
  const [cx1, cz1] = pos(4.6, camp - 0.55);
  const [cx2, cz2] = pos(4.9, camp + 0.5);
  couchage(c, cx1, cz1, camp + 0.3, P);
  couchage(c, cx2, cz2, camp - 0.2, P);
  caisse(c, ...pos(3.2, camp + 0.15), 0.5, C.bois, P, 0.4);
  caisse(c, ...pos(3.3, camp - 0.2), 0.4, C.boisGris, P + 0.5, 0.9);
  const [l1x, l1z] = pos(3.95, camp - 0.65);
  const [l2x, l2z] = pos(3.95, camp + 0.35);
  c.poutre([l1x, 2.0, l1z], [l2x, 1.9, l2z], 0.02, 0xc8c0b0, M.mat());
  for (let i = 1; i < 4; i++) {
    const t = i / 4;
    c.boite(0.5, 0.7, 0.02, [0x8a6a5a, 0x5a6a80, 0xc8bca0][i - 1], { x: l1x + (l2x - l1x) * t, y: 1.55, z: l1z + (l2z - l1z) * t, ry: Math.atan2(-(l2z - l1z), l2x - l1x) }, M.mat(), { crasse: false });
  }
  // Le chapiteau : frise peinte, festons, toile rayée crevée, la coupole et son fanion
  const yR = 3.95;
  const hR = 0.8;
  cyl(k, X, yR + hR / 2, Z, R + 0.12, R + 0.12, hR, C.creme, M.satin(), 24, {}, true);
  const NS = 24;
  for (let i = 0; i < NS; i++) {
    const a = ((i + 0.5) / NS) * TAU;
    const ry = Math.atan2(Math.cos(a), Math.sin(a));
    const larg = 2 * (R + 0.14) * Math.sin(PI / NS) + 0.02;
    panneauPart(k, "frise", [(i % 4) / 4, (i % 4) / 4 + 0.25, 0, 1], X + Math.cos(a) * (R + 0.15), yR + hR / 2, Z + Math.sin(a) * (R + 0.15), larg, hR - 0.04, ry);
    if (!(c.hasard() < 0.15 * u)) panneau(k, "valance", X + Math.cos(a) * (R + 0.13), yR - 0.21, Z + Math.sin(a) * (R + 0.13), larg, 0.42, ry);
    k.boite(0.07, 0.07, 0.07, 0xd8cfb0, { x: X + Math.cos(a) * (R + 0.2), y: yR + hR + 0.04, z: Z + Math.sin(a) * (R + 0.2) }, M.satin(), { crasse: false });
  }
  const yA = 7.7;
  const RA = 0.55;
  const RB = R + 0.4;
  const yB = yR + hR;
  for (let i = 0; i < NS; i++) {
    const a1 = (i / NS) * TAU;
    const a2 = ((i + 1) / NS) * TAU;
    const am = (a1 + a2) / 2;
    const trou = Math.abs(Math.atan2(Math.sin(am - aArbre), Math.cos(am - aArbre))) < 0.3 || c.hasard() < 0.06 + 0.22 * u;
    const P1 = [X + Math.cos(a1) * RB, yB, Z + Math.sin(a1) * RB];
    const P2 = [X + Math.cos(a2) * RB, yB, Z + Math.sin(a2) * RB];
    const P3 = [X + Math.cos(a2) * RA, yA, Z + Math.sin(a2) * RA];
    const P4 = [X + Math.cos(a1) * RA, yA, Z + Math.sin(a1) * RA];
    const teinte = i % 2 ? (c.hasard() < 0.5 ? 0xa06456 : 0x9a5a4c) : c.hasard() < 0.5 ? 0xd2c6a8 : 0xc8bb9a;
    if (!trou) quad(k, M.toile(), teinte, [P1, P2, P3, P4], false, { nuance: 0.1 });
    else if (c.hasard() < 0.6) {
      // Un lambeau qui pend
      const m = lerp3(P4, P3, 0.5);
      tri2(k, M.toile(), teinte, [lerp3(P4, P1, 0.45), lerp3(P3, P2, 0.5), [m[0] + (P1[0] - m[0]) * 0.6, yB - 0.6, m[2] + (P1[2] - m[2]) * 0.6]]);
    }
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    k.poutre([X + Math.cos(a) * RA, yA - 0.12, Z + Math.sin(a) * RA], [X + Math.cos(a) * RB, yB - 0.1, Z + Math.sin(a) * RB], 0.1, C.boisSombre, M.satin());
  }
  cyl(k, X, yA + 0.35, Z, 0.7, 0.62, 0.7, C.creme, M.satin(), 10);
  cyl(k, X, yA + 0.95, Z, 0.85, 0.05, 0.6, 0xb0584a, M.satin(), 10);
  boule(k, X, yA + 1.35, Z, 0.16, C.or, M.satin());
  k.tube([X, yA + 1.35, Z], [X, yA + 2.3, Z], 0.025, C.fonte, M.satin(), 5);
  tri2(k, M.toile(), 0xa94a3c, [[X, yA + 2.25, Z], [X, yA + 1.85, Z], [X + 0.75, yA + 2.0, Z + 0.25]]);
  // Le graffiti des survivants sur le tambour, côté camp
  {
    const a = camp - 0.75;
    panneau(c, "graffiti", X + Math.cos(a) * (RT + 0.03), 1.0, Z + Math.sin(a) * (RT + 0.03), 1.5, 0.38, Math.atan2(Math.cos(a), Math.sin(a)));
  }
  // L'arbre, et le désordre
  arbre(c, ax, az, 11.5, "bouleau");
  c.boite(0.9, 0.06, 0.25, 0x8a6a48, { x: ax + 0.8, y: P + 0.15, z: az + 0.4, ry: 0.5, rz: 0.25 }, M.mat());
  jonchee(c, X - R, Z - R, X + R, Z + R, 50, undefined, P + 0.01);
  semerTouffes(c, X - R - 2, Z - R - 2, X + R + 2, Z + R + 2, 30, undefined, 0);
}

// ---------- La grande roue ----------

function grandeRoue(ctx) {
  const { b, c, u } = ctx;
  const { x: X, z: Z, y: Y, r: R } = PLAN.roue;
  const k = b.couche("la grande roue", { x: X, z: Z, l: 2 * R + 4, p: 9 }, 3.2, Y + R + 1);
  const ch = (...ys) => (Math.min(...ys) < 3.2 ? c : k);
  const N = 24;
  const RI = R - 1.05;
  const peinture = (i) => (c.hasard() < 0.25 + 0.4 * u ? (c.hasard() < 0.5 ? C.rouille : C.rouilleSombre) : i % 2 ? 0xb04a3c : 0xa8453a);
  const P = (r, a, zz) => [X + Math.cos(a) * r, Y + Math.sin(a) * r, zz];
  for (const zz of [Z - 0.9, Z + 0.9]) {
    for (let i = 0; i < N; i++) {
      const a1 = (i / N) * TAU;
      const a2 = ((i + 1) / N) * TAU;
      const o1 = P(R, a1, zz);
      const o2 = P(R, a2, zz);
      const i1 = P(RI, a1, zz);
      const i2 = P(RI, a2, zz);
      const col = peinture(i);
      ch(o1[1], o2[1]).poutre(o1, o2, 0.17, col, M.tole());
      ch(i1[1], i2[1]).poutre(i1, i2, 0.12, col, M.tole());
      ch(o1[1], i1[1]).poutre(o1, i1, 0.09, col, M.tole());
      ch(o1[1], i2[1]).poutre(o1, i2, 0.07, 0xcfc8b8, M.tole());
      if (i % 2 === 0) ch(i1[1]).poutre(P(0.95, a1, zz), i1, 0.07, 0xd8d0c0, M.tole());
      ch(o1[1]).boite(0.08, 0.08, 0.08, 0xd8cfb0, { x: o1[0] + Math.cos(a1) * 0.14, y: o1[1] + Math.sin(a1) * 0.14, z: zz + (zz < Z ? -0.1 : 0.1) }, M.tole(), { crasse: false });
    }
  }
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU;
    const p1 = P(R, a, Z - 0.9);
    const p2 = P(R, a, Z + 0.9);
    ch(p1[1]).poutre(p1, p2, 0.08, C.acier, M.tole());
  }
  // Le moyeu, l'axe
  cyl(k, X, Y, Z, 1.0, 1.0, 2.2, 0x6a6c68, M.tole(), 12, { rx: PI / 2 });
  cyl(k, X, Y, Z, 0.35, 0.35, 6.4, C.acier, M.tole(), 8, { rx: PI / 2 });
  for (const s of [-1, 1]) disqueZ(k, X, Y, Z + s * 1.12, 0.6, 0.05, 0xb8963e, M.tole(), 12);
  // Les deux chevalets en A, entretoisés
  const blanc = 0xcfc8b8;
  const pieds = [];
  for (const s of [-1, 1]) {
    const zs = Z + s * 3.6;
    const zh = Z + s * 2.9;
    const g0 = [X - 8, 0, zs];
    const d0 = [X + 8, 0, zs];
    const top = [X, Y, zh];
    for (const p0 of [g0, d0]) {
      const m = lerp3(p0, top, 3.2 / Y);
      c.poutre(p0, m, 0.48, blanc, M.tole());
      k.poutre(m, top, 0.46, blanc, M.tole());
      c.boite(1.1, 0.5, 1.1, C.betonSombre, { x: p0[0], y: 0.2, z: p0[2] }, M.mat());
      pieds.push(p0);
    }
    for (const t of [0.4, 0.72]) {
      const a = lerp3(g0, top, t);
      const bb = lerp3(d0, top, t);
      k.poutre(a, bb, 0.22, blanc, M.tole());
    }
    k.poutre(lerp3(g0, top, 0.4), lerp3(d0, top, 0.72), 0.14, blanc, M.tole());
    k.poutre(lerp3(d0, top, 0.4), lerp3(g0, top, 0.72), 0.14, blanc, M.tole());
    c.poutre(lerp3(g0, top, 0.08), lerp3(d0, top, 0.08), 0.2, blanc, M.tole());
  }
  for (const sx of [-1, 1]) {
    const p1 = lerp3([X + sx * 8, 0, Z - 3.6], [X, Y, Z - 2.9], 0.4);
    const p2 = lerp3([X + sx * 8, 0, Z + 3.6], [X, Y, Z + 2.9], 0.4);
    k.poutre(p1, p2, 0.16, blanc, M.tole());
  }
  for (const p of pieds) b.obstacle(p[0] - 0.55, p[2], p[0] + 0.55, p[2], "pied de la grande roue");
  // Les nacelles : seize, qui pendent ; une est tombée, une autre pend de travers
  const tons = [0xb04a3c, 0xd2b450, 0x3f7774, 0x8a7096, 0xe0d4b6, 0x5b7f97];
  const NN = 16;
  for (let j = 0; j < NN; j++) {
    const a = -PI / 2 + (j / NN) * TAU;
    if (j === 3) continue; // la nacelle tombée (au sol, voir plus bas)
    if (u > 0.8 && j === 11) continue;
    const [px, py] = P(R + 0.05, a, Z);
    const de = j === 6 ? 0.5 : j === 13 ? -0.25 : 0;
    const t = tons[j % tons.length];
    const cc = ch(py - 1.9);
    cc.repere({ x: px, y: py, z: Z, rz: de }, () => {
      for (const s of [-1, 1]) cc.poutre([0, 0, s * 0.75], [0, -0.55, s * 0.7], 0.06, C.acier, M.tole());
      cc.boite(0.08, 0.08, 1.6, C.acier, { y: 0 }, M.tole());
      cyl(cc, 0, -0.35, 0, 1.05, 0.08, 0.42, t, M.tole(), 8);
      cyl(cc, 0, -0.9, 0, 0.06, 0.06, 0.7, C.acier, M.tole(), 5);
      cyl(cc, 0, -1.65, 0, 0.78, 0.95, 0.95, t, M.tole(), 8);
      cyl(cc, 0, -1.2, 0, 0.97, 0.97, 0.08, 0xd8cfb0, M.tole(), 8);
    });
  }
  // Le quai d'embarquement, la cabine du forain, la nacelle tombée
  c.pave(X - 3.2, 0, Z - 2.4, X + 3.2, 0.06, Z + 2.4, 0x9a958a, M.mat(), { crasse: false });
  for (const s of [-1, 1]) {
    for (let x = X - 3; x <= X + 3; x += 1.5) cyl(c, x, 0.5, Z + s * 2.4, 0.04, 0.04, 1.0, 0xd2b450, M.tole(), 6);
    c.poutre([X - 3, 1.0, Z + s * 2.4], [X - 1, 1.0, Z + s * 2.4], 0.05, 0xd2b450, M.tole());
    c.poutre([X + 1, 1.0, Z + s * 2.4], [X + 3, 1.0, Z + s * 2.4], 0.05, 0xd2b450, M.tole());
  }
  const cx = X + 4.8;
  const cz = Z + 1.6;
  c.pave(cx - 0.9, 0, cz - 0.9, cx + 0.9, 1.0, cz + 0.9, C.creme, M.satin());
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) c.boite(0.1, 1.4, 0.1, C.canard, { x: cx + sx * 0.85, y: 1.7, z: cz + sz * 0.85 }, M.satin());
  c.pave(cx - 1.1, 2.4, cz - 1.1, cx + 1.1, 2.55, cz + 1.1, C.canard, M.satin());
  c.boite(0.6, 0.3, 0.4, 0x3a3c3a, { x: cx, y: 1.15, z: cz + 0.5, rx: -0.3 }, M.tole());
  c.boite(0.04, 0.35, 0.04, C.rougeVif, { x: cx + 0.15, y: 1.4, z: cz + 0.55, rz: 0.4 }, M.satin());
  obstacleRect(b, cx - 0.9, cz - 0.9, cx + 0.9, cz + 0.9, "cabine du forain");
  c.repere({ x: X + 6.5, y: 0.6, z: Z + 4.6, rx: 1.25, ry: 0.5 }, () => {
    cyl(c, 0, 0, 0, 0.78, 0.95, 0.95, 0xd2b450, M.satin(), 8);
    cyl(c, 0, 0.45, 0, 0.97, 0.97, 0.08, 0xd8cfb0, M.satin(), 8);
  });
  cyl(c, X + 8.2, 0.25, Z + 3.4, 1.05, 0.08, 0.42, 0xd2b450, M.satin(), 8, { rx: 0.5, rz: 0.4 });
  obstacleCercle(b, X + 6.5, Z + 4.6, 0.9, 6, "nacelle tombée");
  gravats(c, X + 7.2, Z + 5.4, 1.3, 10, [0xd2b450, C.acier, 0x9a958a]);
  debris(c, X + 5, Z + 3, X + 9.5, Z + 7, 20, [0x9aa8ac, 0xd2b450, C.acier]);
  semerTouffes(c, X - 9, Z - 5, X + 9, Z + 5, 40);
  for (const p of pieds) {
    arbuste(c, p[0] + 0.6, p[2] + (p[2] > Z ? 0.6 : -0.6), 1.1);
  }
}

// ---------- Les stands ----------

/** Un stand forain : fond, flancs peints, comptoir à l'avant (sud), auvent rayé et toit en tôle (couche). */
function stand(ctx, k, S, couleurs, enseigne) {
  const { b, c, u } = ctx;
  const { x1, z1, x2, z2 } = S;
  const [cA, cB] = couleurs;
  const h = 2.6;
  c.pave(x1, 0, z1, x2, 0.06, z2, 0x8a7258, M.mat(), { crasse: false });
  c.pave(x1, 0, z1, x2, h, z1 + 0.15, cA, M.satin());
  c.pave(x1, 0, z1, x1 + 0.15, h, z2, cB, M.satin());
  c.pave(x2 - 0.15, 0, z1, x2, h, z2, cB, M.satin());
  c.pave(x1 + 0.15, 0, z2 - 0.55, x2 - 1.15, 1.0, z2, cA, M.satin());
  c.pave(x1 + 0.1, 1.0, z2 - 0.62, x2 - 1.1, 1.06, z2 + 0.05, 0x9a7a52, M.satin());
  for (let x = x1 + 0.6; x < x2 - 1.3; x += 0.9) c.boite(0.35, 0.6, 0.02, cB, { x, y: 0.5, z: z2 + 0.01 }, M.satin());
  obstacleRect(b, x1, z1, x2, z1 + 0.15, "stand");
  b.obstacle(x1, z1, x1, z2, "stand");
  b.obstacle(x2, z1, x2, z2, "stand");
  b.obstacle(x1, z2 - 0.3, x2 - 1.15, z2 - 0.3, "comptoir");
  // Toit, auvent, enseigne
  k.pave(x1 - 0.1, h, z1 - 0.1, x2 + 0.1, h + 0.12, z2 + 0.1, C.acier, M.mat());
  const n = Math.round((x2 - x1) / 0.5);
  for (let i = 0; i < n; i++) {
    const xa = x1 + ((x2 - x1) * i) / n;
    const xb = x1 + ((x2 - x1) * (i + 1)) / n;
    if (c.hasard() < 0.12 * u) continue;
    quad(k, M.toile(), i % 2 ? 0xb0584a : 0xddd0b0, [[xa, h + 0.15, z2 + 0.1], [xb, h + 0.15, z2 + 0.1], [xb, h - 0.35, z2 + 1.3], [xa, h - 0.35, z2 + 1.3]], true, { nuance: 0.05 });
  }
  panneau(k, enseigne, (x1 + x2) / 2, h + 0.55, z2 + 0.16, Math.min(x2 - x1 - 0.2, 5.6), 0.7);
  for (let x = x1 + 0.2; x < x2; x += 0.45) k.boite(0.07, 0.07, 0.07, 0xd8cfb0, { x, y: h + 0.15, z: z2 + 0.2 }, M.satin(), { crasse: false });
  // Deux poteaux d'auvent tordus
  for (const x of [x1 + 0.1, x2 - 0.1]) k.poutre([x, h - 0.35, z2 + 1.3], [x, 3.3, z2 + 1.3], 0.04, C.fonte, M.mat());
}

function stands(ctx) {
  const { b, c, u } = ctx;
  const z1 = Math.min(PLAN.tir.z1, PLAN.peche.z1, PLAN.barbe.z1) - 0.5;
  const z2 = PLAN.tir.z2 + 1.5;
  const k = b.couche("les stands", { x: (PLAN.tir.x1 + PLAN.barbe.x2) / 2, z: (z1 + z2) / 2, l: PLAN.barbe.x2 - PLAN.tir.x1 + 1, p: z2 - z1 }, 2.4, 4.4);
  // Le stand de tir
  {
    const S = PLAN.tir;
    stand(ctx, k, S, [0xa94a3c, 0xddd0b0], "tir");
    panneau(c, "cibles", (S.x1 + S.x2) / 2, 1.75, S.z1 + 0.17, S.x2 - S.x1 - 0.6, 1.4);
    for (const s of [0, 1]) {
      const xw = s ? S.x2 - 0.2 : S.x1 + 0.2;
      for (const y of [1.3, 1.9]) {
        c.boite(0.25, 0.04, S.z2 - S.z1 - 1, C.boisSombre, { x: xw + (s ? -0.1 : 0.1), y, z: (S.z1 + S.z2) / 2 - 0.3 }, M.mat());
        for (let z = S.z1 + 0.5; z < S.z2 - 0.9; z += 0.4) if (c.hasard() > 0.25 * u) peluche(c, xw + (s ? -0.12 : 0.12), y + 0.02, z, 1, s ? -PI / 2 : PI / 2, 0, 0, [C.peluche, 0xc99aa0, 0xd2b450, 0x8a7096][Math.floor(c.hasard() * 4)]);
      }
    }
    for (let i = 0; i < 3; i++) {
      c.repere({ x: S.x1 + 1 + i * 1.3, y: 1.1, z: S.z2 - 0.3, ry: 0.2 - i * 0.15 }, () => {
        c.boite(0.75, 0.05, 0.05, 0x2a2826, { x: 0.2 }, M.metal());
        c.boite(0.35, 0.1, 0.07, C.bois, { x: -0.3, y: -0.02 }, M.mat());
      });
    }
    peluche(c, S.x2 - 0.65, 1.06, S.z2 - 0.3, 3.2, -0.4);
    peluche(c, (S.x1 + S.x2) / 2 + 0.6, 0.06, S.z2 + 1.4, 1.2, 1.2, PI / 2 - 0.2);
  }
  // La pêche aux canards : le bassin à sec, les canards en plastique échoués, les cannes, les lots
  {
    const S = PLAN.peche;
    stand(ctx, k, S, [0x5b7f97, 0xe0d4b6], "peche");
    const bx = (S.x1 + S.x2) / 2 - 0.4;
    const bz = (S.z1 + S.z2) / 2 - 0.4;
    cyl(c, bx, 0.35, bz, 1.45, 1.45, 0.7, 0x4f7c9a, M.satin(), 14);
    cyl(c, bx, 0.71, bz, 1.32, 1.32, 0.02, 0x5a4a38, M.mat(), 14);
    cyl(c, bx, 0.5, bz, 0.45, 0.4, 1.0, 0xe0d4b6, M.satin(), 8);
    cyl(c, bx, 1.1, bz, 0.5, 0.05, 0.4, 0xb0584a, M.satin(), 8);
    obstacleCercle(b, bx, bz, 1.45, 10, "bassin de la pêche aux canards");
    for (let i = 0; i < 9; i++) {
      const a = c.hasard() * TAU;
      const r = 0.7 + c.hasard() * 0.45;
      const dehors = i > 6;
      const dx = dehors ? bx + 2 + c.hasard() : bx + Math.cos(a) * r;
      const dz = dehors ? S.z2 + 0.6 + c.hasard() * 0.8 : bz + Math.sin(a) * r;
      const y = dehors ? 0.02 : 0.72;
      c.boite(0.16, 0.1, 0.11, 0xe0c04a, { x: dx, y: y + 0.05, z: dz, ry: a, rz: dehors ? 1.2 : 0 }, M.satin(), { crasse: false });
      c.boite(0.08, 0.08, 0.08, 0xe0c04a, { x: dx + Math.cos(a) * 0.06, y: y + 0.13, z: dz - Math.sin(a) * 0.06, ry: a }, M.satin(), { crasse: false });
    }
    for (let i = 0; i < 3; i++) c.poutre([S.x2 - 0.5 - i * 0.2, 0.05, S.z2 - 0.7], [S.x2 - 1.1 - i * 0.3, 2.0, S.z1 + 0.5], 0.025, C.bois, M.mat());
    for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) if (c.hasard() > 0.3) c.boite(0.22, 0.22, 0.12, [0xc99aa0, 0xd2b450, 0x6d9466, 0x5b7f97, 0xb0584a][(i + r) % 5], { x: S.x1 + 0.6 + i * 0.6, y: 1.3 + r * 0.38, z: S.z1 + 0.25 }, M.satin(), { crasse: false });
  }
  // La barbe à papa : un kiosque rose, la machine, les sacs de sucre, les conserves
  {
    const S = PLAN.barbe;
    const { x1, z1: za, x2, z2: zb } = S;
    const rose = 0xc99aa0;
    c.pave(x1, 0, za, x2, 0.06, zb, 0x9a958a, M.mat(), { crasse: false });
    c.pave(x1, 0, za, x2, 2.7, za + 0.15, rose, M.satin());
    c.pave(x1, 0, za, x1 + 0.15, 2.7, zb, 0xe0d4b6, M.satin());
    c.pave(x2 - 0.15, 0, za, x2, 1.05, zb, 0xe0d4b6, M.satin());
    k.pave(x2 - 0.15, 1.05, za, x2, 2.7, zb - 1.2, 0xe0d4b6, M.satin());
    c.pave(x1 + 0.15, 0, zb - 0.15, x2 - 0.9, 1.05, zb, rose, M.satin());
    c.pave(x1 + 0.1, 1.05, zb - 0.3, x2 - 0.85, 1.1, zb + 0.15, 0xe0d4b6, M.satin());
    obstacleRect(b, x1, za, x2, za + 0.15, "kiosque");
    b.obstacle(x1, za, x1, zb, "kiosque");
    b.obstacle(x2, za, x2, zb, "kiosque");
    b.obstacle(x1, zb, x2 - 0.9, zb, "kiosque");
    // La machine (cuve inox), les sacs, les conserves
    c.boite(0.8, 0.9, 0.6, 0xd8d2c4, { x: x1 + 1.0, y: 0.45, z: zb - 0.65 }, M.satin());
    cyl(c, x1 + 1.0, 1.08, zb - 0.65, 0.3, 0.42, 0.35, 0xc8ccc8, M.metal(), 10, {}, true);
    for (let i = 0; i < 4; i++) c.boite(0.5, 0.22, 0.34, 0xe6e0d0, { x: x1 + 0.5 + (i % 2) * 0.55, y: 0.12 + Math.floor(i / 2) * 0.22, z: za + 0.5, ry: c.hasard() * 0.3 }, M.mat());
    c.pave(x1 + 0.15, 1.4, za + 0.15, x2 - 0.15, 1.45, za + 0.5, C.boisSombre, M.mat());
    for (let i = 0; i < 8; i++) cyl(c, x1 + 0.4 + i * 0.4, 1.56, za + 0.32, 0.07, 0.07, 0.2, [0xb0584a, 0xd2b450, 0x6d9466][i % 3], M.metal(), 6);
    for (let i = 0; i < 4; i++) cyl(c, x2 - 0.6 + c.entre(-0.3, 0.3), 0.07, za + 1 + i * 0.4, 0.07, 0.07, 0.2, 0xb0584a, M.metal(), 6, { rz: PI / 2, ry: c.hasard() * 3 });
    // Toit, enseigne, et la barbe à papa géante qui le coiffe
    toitPlat(k, x1, za, x2, zb, 2.7, rose, { debord: 0.35, acrotere: 0.2, couleurAcrotere: 0xe0d4b6 });
    panneau(k, "barbe", (x1 + x2) / 2, 3.5, zb + 0.36, 2.0, 1.0);
    k.tube([(x1 + x2) / 2, 3.1, (za + zb) / 2 - 0.5], [(x1 + x2) / 2, 4.3, (za + zb) / 2 - 0.5], 0.06, 0xe0d4b6, M.satin(), 6);
    boule(k, (x1 + x2) / 2, 4.8, (za + zb) / 2 - 0.5, 0.75, 0xd8a8b8, M.mat(), [1, 0.9, 1], 1);
    boule(k, (x1 + x2) / 2 + 0.4, 5.1, (za + zb) / 2 - 0.3, 0.45, 0xe0b8c4, M.mat(), 1, 0);
  }
  semerTouffes(c, PLAN.tir.x1, z1 - 3, PLAN.barbe.x2, z1, 30);
}

// ---------- La boutique de souvenirs et le poste de secours ----------

function boutique(ctx) {
  const { b, c, u } = ctx;
  const B = PLAN.boutique;
  const S2 = PLAN.secours;
  const k = b.couche("la boutique et le poste de secours", { x: (B.x1 + S2.x2) / 2, z: (B.z1 + B.z2) / 2, l: S2.x2 - B.x1 + 0.8, p: B.z2 - B.z1 + 0.8 }, 1, 6.6);
  const H = 3.4;
  pavillon(ctx, k, {
    ...B, h: H, couleur: C.creme, sol: 0xb8ab90, interieur: { couleur: 0xd9c8a0, mat: M.mat() }, bris: 0.4 + 0.5 * u,
    ouv: {
      s: [
        { at: B.x1 + 2.6, l: 3.2, bas: 0.6, haut: 2.7, type: "fenetre", croisillons: 2, traverses: 1, cadre: C.canard },
        { at: (B.x1 + B.x2) / 2, l: 1.6, bas: 0, haut: 2.4, type: "vide" },
        { at: B.x2 - 2.6, l: 3.2, bas: 0.6, haut: 2.7, type: "fenetre", croisillons: 2, traverses: 1, cadre: C.canard },
      ],
      e: [{ at: (B.z1 + B.z2) / 2, l: 1.6, bas: 1.0, haut: 2.4, type: "fenetre", croisillons: 1, cadre: C.canard }],
      n: [{ at: B.x2 - 2, l: 1.0, bas: 0, haut: 2.2, type: "vide" }],
    },
  });
  c.pave(B.x1 - 0.14, 0, B.z2 + 0.12, B.x2 + 0.14, 0.45, B.z2 + 0.16, C.canard, M.satin(), { crasse: true });
  // Les étagères pleines de peluches (rembourrage, isolation : de quoi passer l'hiver)
  const tons = [C.peluche, C.peluche, 0x6fa8a2, 0xc99aa0, 0xd2b450];
  c.pave(B.x1 + 0.2, 0, B.z1 + 0.15, B.x2 - 3.2, 2.2, B.z1 + 0.22, C.boisSombre, M.mat());
  for (const y of [0.5, 1.1, 1.7]) {
    c.pave(B.x1 + 0.2, y - 0.04, B.z1 + 0.15, B.x2 - 3.2, y, B.z1 + 0.62, C.bois, M.mat());
    for (let x = B.x1 + 0.45; x < B.x2 - 3.4; x += 0.42) if (c.hasard() > 0.15 + 0.3 * u) peluche(c, x, y, B.z1 + 0.42, 1.1, c.entre(-0.3, 0.3), 0, 0, tons[Math.floor(c.hasard() * tons.length)]);
  }
  b.obstacle(B.x1 + 0.2, B.z1 + 0.62, B.x2 - 3.2, B.z1 + 0.62, "étagère");
  c.pave(B.x1 + 0.15, 0, B.z1 + 1.2, B.x1 + 0.22, 1.8, B.z2 - 1.6, C.boisSombre, M.mat());
  for (const y of [0.7, 1.35]) c.pave(B.x1 + 0.15, y - 0.04, B.z1 + 1.2, B.x1 + 0.65, y, B.z2 - 1.6, C.bois, M.mat());
  for (const y of [0.7, 1.35]) for (let z = B.z1 + 1.4; z < B.z2 - 1.8; z += 0.45) if (c.hasard() > 0.25 * u) peluche(c, B.x1 + 0.42, y, z, 1.1, PI / 2, 0, 0, tons[Math.floor(c.hasard() * tons.length)]);
  b.obstacle(B.x1 + 0.6, B.z1 + 1.2, B.x1 + 0.6, B.z2 - 1.6, "étagère");
  // La gondole du milieu, le bac à peluches renversé, la peluche géante tombée
  const gx = (B.x1 + B.x2) / 2 - 1.5;
  const gz = (B.z1 + B.z2) / 2 - 0.3;
  c.boite(4, 1.3, 0.6, C.creme, { x: gx, y: 0.65, z: gz }, M.satin());
  for (let i = 0; i < 9; i++) if (c.hasard() > 0.3) peluche(c, gx - 1.8 + i * 0.45, 1.3, gz + c.entre(-0.15, 0.15), 1.1, c.hasard(), 0, 0, tons[i % tons.length]);
  obstacleRect(b, gx - 2, gz - 0.3, gx + 2, gz + 0.3, "gondole");
  c.repere({ x: B.x1 + 3.4, y: 0.35, z: B.z2 - 1.4, rz: 1.3 }, () => {
    c.boite(1.0, 0.7, 0.7, C.canard, {}, M.satin());
  });
  for (let i = 0; i < 16; i++) peluche(c, B.x1 + 2.2 + c.hasard() * 2.4, 0.05, B.z2 - 2.4 + c.hasard() * 1.8, 1.1, c.hasard() * 3, c.hasard() < 0.5 ? PI / 2 : 0, 0, tons[i % tons.length]);
  peluche(c, B.x2 - 4.6, 0.3, B.z2 - 1.3, 5.2, 0.4, -PI / 2 + 0.1);
  // Le comptoir et sa caisse, la borne à sourire
  c.pave(B.x2 - 2.6, 0, B.z1 + 2.4, B.x2 - 2.1, 1.0, B.z2 - 1.8, 0x9a7a52, M.satin());
  c.boite(0.4, 0.25, 0.35, 0x3a3c3a, { x: B.x2 - 2.35, y: 1.13, z: B.z1 + 3.3 }, M.satin());
  panneau(c, "ecran", B.x2 - 2.08, 1.35, B.z1 + 4.2, 0.3, 0.3, PI / 2);
  b.obstacle(B.x2 - 2.6, B.z1 + 2.4, B.x2 - 2.6, B.z2 - 1.8, "comptoir");
  panneau(c, "affiche", B.x1 + 0.14, 1.9, B.z2 - 0.9, 0.7, 1.05, PI / 2);
  jonchee(c, B.x1 + 0.6, B.z1 + 0.8, B.x2 - 0.4, B.z2 - 0.3, 40, [0xe6dcc0, C.peluche, 0xc99aa0, 0x9c7a45]);
  // Le toit (percé), l'enseigne, le grand Watty du toit
  toitPlat(k, B.x1, B.z1, B.x2, B.z2, H, 0x6a6660, { debord: 0.3, acrotere: 0.5, couleurAcrotere: C.canard, trou: u > 0.3 ? { x1: B.x1 + 1, x2: B.x1 + 3.5, z1: B.z1 + 1.5, z2: B.z1 + 4.5 } : null });
  panneau(k, "boutique", (B.x1 + B.x2) / 2 - 1, H + 0.75, B.z2 + 0.32, 6.4, 0.8);
  k.repere({ x: B.x2 - 1.4, y: H + 0.18, z: B.z2 - 1.2, rz: u > 0.5 ? -0.12 : 0 }, () => {
    k.boite(1.0, 1.6, 0.6, C.canard, { y: 0.8 }, M.satin());
    k.boite(1.02, 0.36, 0.62, C.creme, { y: 1.78 }, M.satin());
    k.boite(0.4, 0.15, 0.3, C.or, { y: 2.04 }, M.satin());
    for (const s of [-0.22, 0.22]) k.boite(0.12, 0.16, 0.02, C.noir, { x: s, y: 1.3, z: 0.31 }, M.mat());
    k.boite(0.5, 0.06, 0.02, C.noir, { y: 1.05, z: 0.31 }, M.mat());
    k.tube([-0.5, 1.2, 0], [-0.95, 1.9, 0.1], 0.07, 0x24292a, M.satin(), 6);
    k.tube([0.5, 1.2, 0], [0.95, 1.9, 0.1], 0.07, 0x24292a, M.satin(), 6);
    panneau(k, "ecaille", 0.1, 0.9, 0.305, 0.9, 0.9);
  });
  lierre(c, B.x1 - 0.13, 0, B.z1 + 2, -PI / 2, 4, 2.8, 50);
  lierre(k, B.x1 + 1.5, H, B.z2 + 0.15, 0, 2.4, 0.6 + u, 20);

  // Le poste de secours
  const S = PLAN.secours;
  const HS = 3.0;
  pavillon(ctx, k, {
    ...S, h: HS, couleur: 0xe2ddd0, sol: 0xc8c8c0, interieur: { couleur: 0xdcdcd2, mat: M.mat() }, bris: 0.5 + 0.4 * u,
    ouv: {
      s: [
        { at: S.x1 + 1.6, l: 1.2, bas: 0, haut: 2.2, type: "vide" },
        { at: S.x2 - 2.2, l: 1.5, bas: 1.0, haut: 2.2, type: "fenetre", croisillons: 1, cadre: 0xb8b2a2 },
      ],
      e: [{ at: (S.z1 + S.z2) / 2, l: 1.3, bas: 1.0, haut: 2.2, type: "fenetre", croisillons: 1, cadre: 0xb8b2a2 }],
    },
  });
  c.pave(S.x1 + 0.3, 0, S.z1 + 0.2, S.x1 + 2.3, 0.6, S.z1 + 0.95, C.acier, M.metal());
  c.pave(S.x1 + 0.35, 0.6, S.z1 + 0.25, S.x1 + 2.25, 0.72, S.z1 + 0.9, 0x6a8a8a, M.satin());
  c.boite(0.8, 1.8, 0.4, 0xe6e2d8, { x: S.x2 - 0.5, y: 0.9, z: S.z1 + 0.6 }, M.satin());
  c.boite(0.2, 0.2, 0.02, 0xb8362c, { x: S.x2 - 0.5, y: 1.5, z: S.z1 + 0.81 }, M.satin());
  for (let i = 0; i < 4; i++) c.boite(0.4, 0.25, 0.3, i % 2 ? 0xe6e2d8 : 0xb8362c, { x: S.x2 - 1.4 + c.entre(-0.4, 0.4), y: 0.12, z: S.z1 + 1.6 + c.hasard(), ry: c.hasard() * 3 }, M.satin());
  c.repere({ x: S.x1 + 3.6, z: S.z1 + 2.6, ry: 0.6 }, () => {
    for (const s of [-0.3, 0.3]) cyl(c, 0, 0.3, s, 0.3, 0.3, 0.04, C.fonte, M.tole(), 10, { rx: PI / 2 });
    c.boite(0.5, 0.06, 0.5, 0x2a2826, { y: 0.5 }, M.satin());
    c.boite(0.5, 0.5, 0.05, 0x2a2826, { y: 0.8, x: -0.25, ry: PI / 2 }, M.satin());
  });
  obstacleRect(b, S.x1 + 0.3, S.z1 + 0.2, S.x1 + 2.3, S.z1 + 0.95, "brancard");
  toitPlat(k, S.x1, S.z1, S.x2, S.z2, HS, 0x6a6660, { debord: 0.25, acrotere: 0.4, couleurAcrotere: 0xe2ddd0 });
  panneau(k, "secours", (S.x1 + S.x2) / 2, HS + 0.62, S.z2 + 0.27, 2.6, 1.3);
  debris(c, S.x1 + 0.3, S.z1 + 0.3, S.x2 - 0.3, S.z2 - 0.3, 20, [0xe6e2d8, 0xc8c8c0, 0xb8362c]);
}

// ---------- La végétation qui a tout envahi ----------

function vegetation(ctx) {
  const { c, u } = ctx;
  const R = PLAN.carrousel;
  const dehors = (x, z) =>
    !(x > PLAN.allee.x1 - 0.5 && x < PLAN.allee.x2 + 0.5 && z > -14 && z < 22) &&
    Math.hypot(x - R.x, z - R.z) > R.r + 0.5 &&
    !(z > PLAN.alleeStands.z1 && z < PLAN.alleeStands.z2 && x > -26) &&
    !(x > -25 && x < -1.5 && z > -9.5 && z < 11) &&
    !(Math.abs(x - PLAN.roue.x) < 4 && Math.abs(z - PLAN.roue.z) < 3) &&
    z < 21.8;
  pelouse(ctx, -66, -30, 0, 22, dehors, 0.55 + 0.3 * u);
  const arbres = [
    [-61, -6, 9, "feuillu"], [-63, 13, 8, "feuillu"], [-57, 18.5, 7, "bouleau"], [-39, -27, 8, "feuillu"],
    [-8, -16, 9, "feuillu"], [-21, -18, 10, "feuillu"], [-0.8, 3.2, 7, "bouleau"], [-30, -24, 7.5, "mort"],
    [-62, -27, 9, "feuillu"], [-14, -26, 8, "bouleau"], [-1.5, -26, 9, "feuillu"], [-55.5, 7, 6, "bouleau"],
  ];
  for (const [x, z, h, e] of arbres) arbre(c, x, z, h * (0.85 + 0.3 * u), e);
  const buissons = [[-58, 0], [-60, 9], [-52, 15], [-36.5, -16], [-29, -15], [-24, -12], [-11, -12.5], [-1.5, -11], [-1.5, 6], [-26.5, 0], [-37, 12], [-63, -17], [-44.5, -26], [-58, -12], [-47, 15]];
  for (const [x, z] of buissons) arbuste(c, x, z, 0.9 + c.hasard() * 0.7 * (0.6 + u));
  semerTouffes(c, -66, -30, 0, 22, 90 + Math.round(110 * u));
  // Le lierre sur la clôture
  lierre(c, -55, 0, PLAN.cloture - 0.05, PI, 5, 2.2, 40);
  lierre(c, -12, 0, PLAN.cloture - 0.05, PI, 4, 2.0, 30);
}

/** Toute la carte « entrée ». */
export function carteEntree(ctx) {
  teteWatty(ctx);
  parvis(ctx);
  cloture(ctx, -66, 0, PLAN.cloture, [[PLAN.tete.x - PLAN.tete.l / 2 - 0.2, PLAN.tete.x + PLAN.tete.l / 2 + 0.2]]);
  allees(ctx);
  animatronique(ctx);
  carrousel(ctx);
  grandeRoue(ctx);
  stands(ctx);
  boutique(ctx);
  vegetation(ctx);
}
