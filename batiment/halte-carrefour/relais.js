// Tronçon 1 : le relais « Les Routiers du Carrefour », son parking à camions, l'abribus, la ferme isolée d'en face.

import * as THREE from "three";
import { PALETTE, mur, touffes, semerTouffes, gravats, debris, jonchee, mousse, arbuste, arbre, flaque, lierre, toitDeuxPans } from "../commun/atelier.js";
import { R } from "./atlas.js";
import { bruit, bruitXZ, teinte, coucheStricte, panneau, panneauDouble, barre, obstacleBoite } from "./outils.js";
import { COUL, GEO, voiture, semiRemorque, tracteur, botte, palette, pneus, cone, lanterne, caisse, conserves, tableNappee, friche } from "./objets.js";
import { RELAIS, GRANGE, MAISON, ABRIBUS, C } from "./plan.js";
import { murCoupe, pignon, ouv } from "./bati.js";

// ---------- Le relais ----------

export function relais(ctx) {
  const { x0, x1, z0, z1, zm, h, he } = RELAIS;
  const xm = (x0 + x1) / 2;
  if (!ctx.ici(xm)) return;
  const { c, M, b, u } = ctx;
  const haut = coucheStricte(b, "étage et toit du relais", { x: xm, z: (z0 + z1) / 2, l: x1 - x0 + 1, p: z1 - z0 + 1 }, 1.1, h + he + 3.4, [M.enduit, M.tuiles, M.mat, M.satin, M.enseignes]);
  const ext = { h, ep: 0.3, couleur: C.enduitRelais, mat: M.enduit, interieur: { couleur: C.enduitInt, mat: M.enduit } };
  const cloison = { h, ep: 0.15, couleur: C.enduitInt, mat: M.enduit };
  const bris = 0.35 + u * 0.55;
  const F = (uu, l = 2.0) => ouv.fenetre(uu, l, 0.9, 2.4, { bris, cadre: 0x7a4a34, croisillons: 1, traverses: 1, rideau: 0xb8433a });
  // Rez-de-chaussée : façades sud et est coupées à hauteur d'allège
  murCoupe(ctx, haut, [x0, z1], [x1, z1], { ...ext, ouvertures: [F(2.6), F(6.2), ouv.porte(9.6, 1.8, 2.4), F(13.2), ouv.porte(17.6, 1.0, 2.3)] }, 1.1);
  murCoupe(ctx, haut, [x1, z1], [x1, z0], { ...ext, ouvertures: [F(4.2, 1.8), ouv.porte(12.2, 1.0)] }, 1.1);
  murCoupe(ctx, haut, [x1, z0], [x0, z0], { ...ext, ouvertures: [ouv.fenetre(5, 1.2, 1.4, 2.4, { bris: 0.8 }), ouv.fenetre(14, 1.2, 1.4, 2.4, { bris: 0.8 })] }, h);
  murCoupe(ctx, haut, [x0, z0], [x0, z1], { ...ext, ouvertures: [ouv.fenetre(10, 1.4, 1.0, 2.3, { bris: 0.9 })] }, h);
  // Cloisons (coupées à 1,2 m) : salle et bar au sud, couloir et cuisine au nord
  murCoupe(ctx, haut, [x0, zm], [x1, zm], { ...cloison, ouvertures: [ouv.porte(4), ouv.porte(12.5, 1.2)] }, 1.2);
  murCoupe(ctx, haut, [x0 + 8, z0], [x0 + 8, zm], { ...cloison, ouvertures: [ouv.porte(3.2)] }, 1.2);
  // Les sols : tomettes dans la salle, carrelage dans la cuisine, lino du couloir
  c.pave(x0, 0, zm, x1, 0.04, z1, 0xc49a80, M.lisse, { crasse: false });
  c.pave(x0 + 8, 0, z0, x1, 0.04, zm, 0xc8c4b8, M.lisse, { crasse: false });
  c.pave(x0, 0, z0, x0 + 8, 0.04, zm, 0x7a8a7a, M.lisse, { crasse: false });
  // La dalle de l'étage (plafond), l'étage, le toit
  haut.pave(x0, h, z0, x1, h + 0.25, z1, 0xd8d0bc, M.enduit);
  const etage = { h: he, y0: h + 0.25, ep: 0.3, couleur: C.enduitRelais, mat: M.enduit };
  const FE = (uu) => ({ u: uu, l: 1.1, bas: 0.7, haut: 2.1, type: "fenetre", bris: 0.4 + u * 0.5, cadre: 0xe6e2d8, volet: bruit(Math.round(uu), 3, 7) < 0.4 ? "pendu" : "ouvert", couleurVolet: C.voletRouge, rideau: 0xd8ccb0 });
  mur(haut, [x0, z1], [x1, z1], { ...etage, ouvertures: [FE(2.6), FE(6.2), FE(10), FE(13.8), FE(17.4)] });
  mur(haut, [x1, z1], [x1, z0], { ...etage, ouvertures: [FE(4), FE(11)] });
  mur(haut, [x1, z0], [x0, z0], { ...etage, ouvertures: [FE(6), FE(14)] });
  mur(haut, [x0, z0], [x0, z1], { ...etage, ouvertures: [FE(7.5)] });
  const ytoit = h + 0.25 + he;
  // le bandeau d'égout, l'enseigne de façade
  haut.pave(x0 - 0.2, ytoit - 0.05, z1 - 0.05, x1 + 0.2, ytoit + 0.15, z1 + 0.25, 0xd8d0bc, M.enduit);
  haut.pave(x0 - 0.2, ytoit - 0.05, z0 - 0.25, x1 + 0.2, ytoit + 0.15, z0 + 0.05, 0xd8d0bc, M.enduit);
  panneau(haut, M.enseignes, R.facadeRoutiers, { x: xm, y: h + 0.62, z: z1 + 0.17 }, 11, 1.37);
  const trous = u > 0.45 ? [{ u: 4, v: 1, l: 3.2, p: 0.5 + u * 0.4 }, { u: -6, v: -1, l: 2.4, p: 0.6 }] : [];
  toitDeuxPans(haut, xm, (z0 + z1) / 2, x1 - x0, z1 - z0, ytoit, 3.2, { mat: M.tuiles, couleur: C.tuile, trous, debord: 0.45 });
  pignon(haut, M.enduit, C.enduitRelais, x0, ytoit, (z0 + z1) / 2, z1 - z0, 3.2, Math.PI / 2);
  pignon(haut, M.enduit, C.enduitRelais, x1, ytoit, (z0 + z1) / 2, z1 - z0, 3.2, Math.PI / 2);
  // la souche de cheminée de la cuisine, l'antenne
  haut.pave(x1 - 4, ytoit + 1, z0 + 3, x1 - 3.2, ytoit + 3.8, z0 + 3.8, 0xb8a894, M.enduit);
  haut.tube([x0 + 4, ytoit + 2.4, z0 + 5], [x0 + 4, ytoit + 5, z0 + 5], 0.04, 0x8a8a84, M.satin, 4);
  haut.boite(1.2, 0.05, 0.05, 0x8a8a84, { x: x0 + 4, y: ytoit + 4.6, z: z0 + 5 }, M.satin);

  // --- La salle : tables nappées, la grande tablée des routiers, le juke-box, la télé
  const tables = [[-77.6, -14.2], [-74.4, -14.2], [-71.2, -14.2], [-77.6, -17.6], [-71.2, -17.6]];
  tables.forEach(([tx, tz], i) => tableNappee(ctx, tx, tz, { nappe: i % 3 === 2 ? R.nappeBleue : R.nappe, chaises: 2 + (i % 2), couverts: i % 2 === 0, ry: (bruit(i, 2, 5) - 0.5) * 0.3 }));
  // la grande tablée (deux tables mises bout à bout, une seule nappe)
  c.repere({ x: -74.4, y: 0, z: -18.2 }, () => {
    c.boite(3.2, 0.05, 0.9, PALETTE.bois, { y: 0.74 }, M.mat);
    for (const dx of [-1.4, 1.4]) for (const dz of [-0.35, 0.35]) c.boite(0.06, 0.72, 0.06, PALETTE.boisSombre, { x: dx, y: 0.36, z: dz }, M.mat);
    const g = new THREE.PlaneGeometry(3.4, 1.1).rotateX(-Math.PI / 2);
    ctx.uvAtlas(g, R.carreaux);
    c.poser(g, M.enseignes, 0xf0b0a0, { y: 0.775 }, { crasse: false, nuance: 0 });
    g.dispose();
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) {
      const tombe = bruit(i, s, 13) < 0.3;
      c.boite(0.42, 0.04, 0.42, 0x8a5a3a, { x: -1.2 + i * 0.8, y: tombe ? 0.2 : 0.45, z: s * 0.75, rx: tombe ? 1.4 : 0 }, M.satin);
    }
    for (let i = 0; i < 5; i++) c.tube([-1.3 + i * 0.6, 0.78, (i % 2) * 0.2 - 0.1], [-1.3 + i * 0.6, 0.79, (i % 2) * 0.2 - 0.1], 0.11, 0xf2eee4, M.lisse, 8);
  });
  // le juke-box et le baby-foot
  c.boite(0.9, 1.5, 0.6, 0x8a3a3a, { x: -79.3, y: 0.75, z: -19.6, ry: Math.PI / 2 }, M.satin);
  c.poser(GEO.dome, M.satin, 0xc79a3b, { x: -79.3, y: 1.5, z: -19.6, rz: Math.PI / 2, e: [0.15, 0.45, 0.3] });
  c.repere({ x: -67.8, y: 0, z: -18.6, ry: 0.15 }, () => {
    c.boite(1.3, 0.25, 0.75, 0x3a6a4a, { y: 0.82 }, M.satin);
    for (const dx of [-0.55, 0.55]) for (const dz of [-0.3, 0.3]) c.boite(0.08, 0.7, 0.08, 0x3a3a38, { x: dx, y: 0.35, z: dz }, M.metal);
    for (let i = 0; i < 6; i++) c.tube([-0.5 + i * 0.2, 0.86, -0.6], [-0.5 + i * 0.2, 0.86, 0.6], 0.015, 0xb8b8b0, M.metal, 4);
  });
  // la télé murale (écran mort) et le menu au mur
  c.boite(1.1, 0.65, 0.08, 0x1e2022, { x: -79.75, y: 2.3, z: -15.2, ry: Math.PI / 2 }, M.lisse);
  panneau(c, M.enseignes, R.menu, { x: -72.5, y: 1.85, z: zm + 0.09 }, 1.1, 1.1);
  panneau(c, M.enseignes, R.prixRoutier, { x: -61.6, y: 1.8, z: zm + 0.09 }, 1.0, 1.0);
  // le portemanteau et un blouson de routier oublié
  c.tube([-65.5, 0, -12.6], [-65.5, 1.8, -12.6], 0.03, 0x3a3a38, M.metal, 5);
  c.boite(0.5, 0.8, 0.15, 0x3a4a6a, { x: -65.5, y: 1.3, z: -12.75 }, M.toile);

  // --- Le bar : le comptoir en L, les tabourets, la machine à café, la lanterne des survivants
  c.repere({ x: -64.2, y: 0, z: -16.8 }, () => {
    c.boite(0.6, 1.08, 5.6, 0x7a4a34, { y: 0.54 }, M.satin);
    c.boite(0.8, 0.06, 5.8, 0x4a3a2c, { y: 1.1, x: -0.05 }, M.satin);
    c.boite(2.4, 1.08, 0.6, 0x7a4a34, { x: 1.5, y: 0.54, z: -2.5 }, M.satin);
    c.boite(2.5, 0.06, 0.8, 0x4a3a2c, { x: 1.5, y: 1.1, z: -2.5 }, M.satin);
    c.tube([-0.38, 0.12, -2.7], [-0.38, 0.12, 2.7], 0.03, 0xb8b8b0, M.metal, 5);
    c.boite(0.45, 0.45, 0.4, 0x8a8a84, { x: 0.05, y: 1.35, z: -1.6 }, M.metal);
    c.boite(0.3, 0.6, 0.3, 0x3a3a38, { x: 0.05, y: 1.43, z: 1.4 }, M.lisse);
  });
  for (let i = 0; i < 4; i++) {
    const tz = -19 + i * 1.3;
    const tombe = bruit(i, 4, 17) < 0.3 + u * 0.2;
    if (tombe) c.boite(0.35, 0.75, 0.35, 0x8a3a3a, { x: -65.9, y: 0.2, z: tz, rz: Math.PI / 2 }, M.satin);
    else {
      c.tube([-65.2, 0, tz], [-65.2, 0.7, tz], 0.03, 0x8a8a84, M.metal, 5);
      c.tube([-65.2, 0.7, tz], [-65.2, 0.78, tz], 0.18, 0x8a3a3a, M.satin, 8);
    }
  }
  // l'étagère des bouteilles contre la cloison
  c.boite(3.4, 1.6, 0.3, 0x5a4030, { x: -61.9, y: 1.6, z: zm + 0.25 }, M.mat);
  for (let i = 0; i < 14; i++) {
    if (bruit(i, 6, 19) < u * 0.5) continue;
    const tons = [0x3a6a3a, 0x7a5a2a, 0xd8d0b0, 0x2a4a3a];
    c.tube([-63.4 + i * 0.22, 1.25 + (i % 2) * 0.55, zm + 0.3], [-63.4 + i * 0.22, 1.55 + (i % 2) * 0.55, zm + 0.3], 0.04, tons[i % 4], M.verre, 5);
  }
  lanterne(ctx, -64.2, 1.13, -18.8);
  ctx.b.lumiere(-64.2, 1.5, -18.8, 0xffc46a, 4, 9, "lanterne posée sur le comptoir du bar (les survivants de passage la rallument)");
  // éclats de verre, chaises renversées, journaux
  debris(c, -65.8, -20, -60.5, -12.5, 14, [0x6a8a6a, 0xd8d0b0, 0x7a5a2a]);
  jonchee(c, x0 + 0.5, zm + 0.4, -66.5, z1 - 0.4, 26, [0xe8e4d6, 0xd8d2c0, 0x9c7a45, 0xc9c0a8]);

  // --- La cuisine : piano, hotte, îlot inox, chambre froide
  c.pave(-71.6, 0, z0 + 0.3, -63, 0.9, z0 + 1.1, 0x9a9a94, M.metal);
  c.pave(-71.6, 0.9, z0 + 0.25, -63, 0.96, z0 + 1.15, 0xb8b8b0, M.metal);
  for (let i = 0; i < 4; i++) c.tube([-70.5 + i * 0.8, 0.97, z0 + 0.7], [-70.5 + i * 0.8, 0.99, z0 + 0.7], 0.14, 0x2a2a28, M.metal, 8);
  c.boite(4, 0.6, 1.0, 0xa8a8a0, { x: -68.8, y: 2.5, z: z0 + 0.7 }, M.metal);
  c.boite(2.6, 0.06, 1.0, 0xb8b8b0, { x: -66.5, y: 0.9, z: -23.6 }, M.metal);
  c.boite(2.4, 0.84, 0.9, 0x9a9a94, { x: -66.5, y: 0.45, z: -23.6 }, M.metal);
  for (let i = 0; i < 4; i++) c.tube([-67.4 + i * 0.6, 0.94, -23.5], [-67.4 + i * 0.6, 1.14, -23.5], 0.15, 0x8a8a84, M.metal, 7);
  c.boite(2.4, 2.4, 0.15, 0xd8d8d0, { x: -61.5, y: 1.2, z: -26.2 }, M.satin);
  c.boite(0.95, 2.0, 0.08, 0xc8c8c0, { x: -61.4, y: 1.0, z: -24.9, ry: 0.9 }, M.satin);
  conserves(ctx, -61.6, -22.4, 8, 0);
  caisse(ctx, -70.8, -21.6, 0.6, 0.5, 0.45);
  for (let i = 0; i < 5; i++) c.tube([-71.4 + i * 0.4, 1.8, z0 + 0.25], [-71.4 + i * 0.4, 2.1, z0 + 0.25], 0.12, 0x8a8a84, M.metal, 6);

  // --- Le couloir : l'escalier effondré vers les chambres, les douches des routiers
  for (let i = 0; i < 8; i++) {
    if (i > 4 && bruit(i, 8, 3) < 0.6) continue;
    c.boite(1.0, 0.18, 0.3, 0x7a5a3c, { x: x0 + 0.8, y: 0.09 + i * 0.2, z: -22 - i * 0.28 }, M.mat);
  }
  gravats(c, x0 + 1.6, -25.4, 1.1, 10, [0xd8d0bc, 0x7a5a3c, PALETTE.pierre]);
  for (const dx of [3.6, 5.6]) {
    c.boite(0.06, 2.0, 1.4, 0xb8c8c0, { x: x0 + dx, y: 1.0, z: -25.9 }, M.satin);
    c.boite(0.6, 0.4, 0.45, 0xeeeee8, { x: x0 + dx + 1, y: 0.2, z: -26.4 }, M.lisse);
  }
  c.boite(1.6, 0.4, 0.4, 0xd8d8d0, { x: x0 + 3, y: 1.6, z: zm - 0.3 }, M.lisse);
  c.boite(0.5, 0.6, 0.12, 0xd8402a, { x: x0 + 7.6, y: 1.5, z: zm - 0.12 }, M.satin);
  if (u > 0.5) gravats(c, -76, -17, 0.9, 6, [0xd8d0bc, PALETTE.pierre]);

  // --- La terrasse : parasols déchirés, tables de bistrot, le chevalet du menu
  c.pave(x0, 0, z1, x1 + 3, 0.06, z1 + 3.2, 0xb8aa94, M.lisse, { crasse: false });
  for (const [tx, tz, k] of [[-75.5, -10.3, 0], [-71, -10.1, 1], [-63.5, -10.4, 2]]) {
    tableNappee(ctx, tx, tz, { chaises: 2, chaise: 0xd8d4c8 });
    c.tube([tx, 0.75, tz], [tx + 0.1, 2.4, tz], 0.03, 0xc8c4b8, M.metal, 4);
    const pli = bruit(k, 1, 23) < u ? 0.5 : 0;
    for (let i = 0; i < 6; i++) {
      if (bruit(i, k, 24) < u * 0.35) continue;
      const a = (i / 6) * Math.PI * 2;
      c.boite(1.3, 0.02, 0.9, i % 2 ? 0xc8362b : 0xe8e0cc, { x: tx + 0.1 + Math.cos(a) * 0.6, y: 2.25 - pli * (i % 3) * 0.3, z: tz + Math.sin(a) * 0.6, ry: -a, rz: 0.35 }, M.toile, { crasse: false });
    }
  }
  c.repere({ x: -68.2, y: 0, z: -10.6, ry: -0.3 }, () => {
    for (const s of [-1, 1]) barre(c, [s * 0.35, 0, s * 0.1], [0, 1.3, 0], 0.04, 0.04, 0x6a4a30, M.mat);
    panneau(c, M.enseignes, R.menu, { y: 0.95, z: 0.06, rx: -0.12 }, 0.7, 0.7);
  });
  c.boite(0.6, 0.6, 0.6, 0x8a6a4a, { x: x1 + 0.6, y: 0.3, z: -11.5 }, M.mat);
  arbuste(c, x1 + 0.6, -11.5, 0.6, 0.6, [0x7a7a4a, 0x6a6a3a, 0x8a8a52]);
  // Lierre et mousse : le relais se rend à la haie
  lierre(c, x0 - 0.17, 0, -15, -Math.PI / 2, 4, 3.6 + u * 2, Math.round(50 + u * 70));
  if (u > 0.3) lierre(c, x1 - 3, 0, z0 - 0.17, Math.PI, 3, 2.5 + u * 2, Math.round(30 + u * 40));
  semerTouffes(c, x0 - 1, z1 + 3.2, x1 + 3, z1 + 3.8, Math.round(6 + u * 10));
  obstacleBoite(b, -79.3, -19.6, 0.6, 0.9, 0, "juke-box");
  b.obstacle(-64.5, -19.6, -64.5, -14, "comptoir du bar");

  // --- Le néon des Routiers : deux mâts, un caisson à double face, sur batterie (dans la base : jamais caché)
  const nx = -57.6;
  const nz = -8.2;
  for (const s of [-1, 1]) c.tube([nx + s * 1.3, 0, nz], [nx + s * 1.3, 6.4, nz], 0.09, 0x6a6e70, M.metal, 6);
  c.boite(3.4, 1.8, 0.4, 0x2a2c30, { x: nx, y: 5.3, z: nz }, M.tole);
  panneauDouble(c, M.neon, R.neonRoutiers, { x: nx, y: 5.3, z: nz }, 3.2, 1.6, 0.21);
  c.boite(0.6, 0.4, 0.4, 0x3a5a3a, { x: nx + 1.3, y: 0.2, z: nz + 0.5 }, M.satin);
  barre(c, [nx + 1.3, 0.4, nz + 0.5], [nx + 1.3, 1.2, nz], 0.03, 0.03, 0x2a2a28, M.mat);
  ctx.b.lumiere(nx - 0.6, 5.0, nz + 1.2, 0xff4a3a, 8, 14, "néon « Les Routiers » (tubes rouges), sur batterie");
  ctx.b.lumiere(nx + 0.8, 5.6, nz + 1.2, 0x5fb4ff, 6, 12, "néon « Les Routiers » (filet bleu), sur batterie");
}

// ---------- Le parking des camions ----------

export function parkingCamions(ctx) {
  if (!ctx.ici(-90)) return;
  const { c, M, u } = ctx;
  semiRemorque(ctx, -90.6, -27.6, 0, { bachee: true, cabine: 0x4e6a7a, caisse: 0x8a8f94 });
  semiRemorque(ctx, -91.4, -20.4, Math.PI, { ouverte: true, cabine: 0xb8433a, caisse: 0xe0dcd0, bande: 0xc79a3b });
  // les cartons de « Watty Fizz » tombés de la remorque ouverte
  for (let i = 0; i < 9; i++) c.boite(0.5, 0.35, 0.4, i % 3 ? 0xc79a3b : 0xd8d0b8, { x: -81.4 + bruit(i, 1, 3) * 1.4, y: 0.18 + (i % 3 === 0 ? 0.35 : 0), z: -21.4 + bruit(i, 2, 3) * 2.2, ry: bruit(i, 3, 3) * 3 }, M.mat, { nuance: 0.08 });
  for (let i = 0; i < 10; i++) c.tube([-82.6 + bruit(i, 4, 3) * 2, 0.05, -18.6 + bruit(i, 5, 3) * 2], [-82.4 + bruit(i, 4, 3) * 2, 0.05, -18.6 + bruit(i, 5, 3) * 2], 0.05, i % 2 ? 0xc79a3b : 0xb8433a, M.metal, 6);
  // les marquages des places, un plot, un tas de pneus, des palettes
  for (let k = 0; k < 3; k++) c.boite(18, 0.02, 0.14, 0xd8d4c8, { x: -90.5, y: 0.03, z: -31 + k * 7.3 }, M.satin, { crasse: false });
  pneus(ctx, -98.6, -12.6, 4);
  pneus(ctx, -97.6, -12.2, 2);
  palette(ctx, -96, -12.4, { ry: 0.3 });
  palette(ctx, -96, -12.4, { ry: 0.25, y: 0.15 });
  palette(ctx, -94.3, -11.6, { debout: true, ry: 1.2 });
  cone(ctx, -83.4, -11.2);
  cone(ctx, -85, -10.6);
  flaque(c, -88, -15, 1.6);
  flaque(c, -85, -31.2, 1.0);
  semerTouffes(c, -100, -32, -82, -10, Math.round(18 + u * 26));
  arbuste(c, -99, -31.5, 1.4);
}

// ---------- L'abribus ----------

export function abribus(ctx) {
  const { x, z } = ABRIBUS;
  if (!ctx.ici(x)) return;
  const { c, M, b, u } = ctx;
  c.pave(x - 2.4, 0, z - 1.3, x + 2.4, 0.12, z + 1.2, 0xb8b2a4, M.lisse);
  // la structure : poteaux, toit en tôle, paroi du fond et côtés vitrés (plexi rayé, un côté cassé)
  for (const dx of [-2.1, 2.1]) for (const dz of [-1.0, 0.9]) c.boite(0.08, 2.4, 0.08, 0x5a6a6a, { x: x + dx, y: 1.32, z: z + dz }, M.metal);
  c.boite(4.6, 0.1, 2.3, 0x6a7a7a, { x, y: 2.55, z: z - 0.05, rx: 0.05 }, M.tole);
  c.boite(4.2, 1.9, 0.03, 0xc8d8d8, { x, y: 1.35, z: z - 1.0 }, M.verre, { crasse: false });
  c.boite(0.03, 1.9, 1.8, 0xc8d8d8, { x: x - 2.1, y: 1.35, z: z - 0.05 }, M.verre, { crasse: false });
  if (u < 0.6) c.boite(0.03, 1.9, 1.8, 0xc8d8d8, { x: x + 2.1, y: 1.35, z: z - 0.05 }, M.verre, { crasse: false });
  else debris(c, x + 2.2, z - 0.8, x + 3.2, z + 0.8, 10, [0xc8d8d8, 0xb8c8c8]);
  panneau(c, M.enseignes, R.wattyAffiche, { x: x - 2.08, y: 1.4, z: z - 0.05, ry: Math.PI / 2 }, 1.2, 1.2);
  panneau(c, M.enseignes, R.horaires, { x: x - 0.9, y: 1.4, z: z - 0.97 }, 1.0, 1.0);
  // le banc, le sac oublié, la poubelle
  c.boite(2.6, 0.05, 0.4, 0x6a7a7a, { x: x + 0.5, y: 0.5, z: z - 0.65 }, M.metal);
  for (const dx of [-0.6, 1.6]) c.boite(0.05, 0.48, 0.35, 0x5a6a6a, { x: x + dx, y: 0.26, z: z - 0.65 }, M.metal);
  c.boite(0.45, 0.3, 0.25, 0x5a4a6a, { x: x + 1.2, y: 0.27, z: z - 0.6, ry: 0.4 }, M.toile);
  c.tube([x + 2.6, 0, z + 0.6], [x + 2.6, 0.8, z + 0.6], 0.22, 0x4a6a5a, M.tole, 8);
  // le poteau d'arrêt
  c.tube([x - 2.8, 0, z + 0.9], [x - 2.8, 2.6, z + 0.9], 0.04, 0x8a8e8a, M.metal, 5);
  c.boite(0.5, 0.5, 0.04, 0x2f6f73, { x: x - 2.8, y: 2.45, z: z + 0.92 }, M.satin);
  c.boite(0.3, 0.06, 0.05, 0xeeeae0, { x: x - 2.8, y: 2.45, z: z + 0.95 }, M.satin, { crasse: false });
  obstacleBoite(b, x, z - 1.0, 4.2, 0.1, 0, "abribus");
  semerTouffes(c, x - 2.5, z - 1.6, x + 2.5, z - 1.2, 6);
}

// ---------- La ferme isolée d'en face ----------

export function grange(ctx) {
  const { x0, x1, z0, z1, h } = GRANGE;
  const xm = (x0 + x1) / 2;
  const zc = (z0 + z1) / 2;
  if (!ctx.ici(xm)) return;
  const { c, M, b, u } = ctx;
  const hf = 4.2;
  const haut = coucheStricte(b, "toit et fenil de la grange", { x: xm, z: zc, l: x1 - x0 + 1, p: z1 - z0 + 1 }, 1.1, h + hf + 1, [M.pierre, M.tuiles, M.mat]);
  const pierre = { h, ep: 0.5, couleur: C.pierre, mat: M.pierre };
  // façades : sud et est coupées à hauteur d'allège (la grande porte à l'est, la porte charretière au nord)
  murCoupe(ctx, haut, [x0, z1], [x1, z1], { ...pierre, ouvertures: [ouv.porte(4, 1.3, 2.3), { u: 12, l: 0.8, bas: 2.0, haut: 2.8, type: "vide" }], breches: u > 0.5 ? [{ u: 15, l: 3, profondeur: 1.6 * u }] : [] }, 1.1);
  murCoupe(ctx, haut, [x1, z1], [x1, z0], { ...pierre, ouvertures: [ouv.porte(6, 4.2, 3.7)] }, 1.1);
  murCoupe(ctx, haut, [x1, z0], [x0, z0], { ...pierre, ouvertures: [ouv.porte(6.5, 3.2, 3.4), { u: 14, l: 0.6, bas: 2.4, haut: 3.2, type: "vide" }] }, h);
  murCoupe(ctx, haut, [x0, z0], [x0, z1], pierre, h);
  // pignons et toit (le faîtage court d'ouest en est)
  pignon(haut, M.pierre, C.pierre, x0, h, zc, z1 - z0 + 0.5, hf, Math.PI / 2, 0.5);
  pignon(haut, M.pierre, C.pierre, x1, h, zc, z1 - z0 + 0.5, hf, Math.PI / 2, 0.5);
  const trous = [{ u: -3, v: 1, l: 2.6 + u * 3, p: 0.4 + u * 0.5 }, ...(u > 0.6 ? [{ u: 5, v: -1, l: 2.4, p: 0.7 }] : [])];
  toitDeuxPans(haut, xm, zc, x1 - x0, z1 - z0, h, hf, { mat: M.tuiles, couleur: C.tuileVieille, trous, debord: 0.5, charpente: 0x5a4130 });
  // le fenil : un plancher sur la moitié ouest, à 2,6 m (inaccessible), des bottes empilées dessus
  haut.pave(x0 + 0.3, 2.6, z0 + 0.3, x0 + 8, 2.75, z1 - 0.3, 0x7a5a3c, M.mat);
  for (let i = 0; i < 5; i++) haut.boite(0.25, 2.6, 0.25, 0x5a4130, { x: x0 + 8, y: 1.3, z: z0 + 1 + i * 2.5 }, M.mat);
  for (let i = 0; i < 12; i++) botte(ctx, x0 + 1.2 + (i % 4) * 1.6, z0 + 1.5 + Math.floor(i / 4) * 3.3, { y: 2.75 + (i % 2) * 0.45, k: haut, vieille: 0.7 });
  // l'échelle du fenil (les barreaux du haut ont cédé)
  barre(c, [x0 + 8.6, 0, 18], [x0 + 8.1, 2.7, 18], 0.06, 0.06, PALETTE.boisGris, M.mat);
  barre(c, [x0 + 8.6, 0, 18.6], [x0 + 8.1, 2.7, 18.6], 0.06, 0.06, PALETTE.boisGris, M.mat);
  for (let i = 0; i < 5; i++) c.boite(0.05, 0.05, 0.6, PALETTE.boisGris, { x: x0 + 8.55 - i * 0.09, y: 0.3 + i * 0.4, z: 18.3 }, M.mat);
  // le sol de terre battue et de paille
  c.pave(x0 + 0.25, 0, z0 + 0.25, x1 - 0.25, 0.03, z1 - 0.25, 0xa8925e, M.mat, { crasse: false });
  // les bottes de foin du bas, en tas (le rampant y dort), une botte ronde éventrée
  for (let i = 0; i < 9; i++) botte(ctx, x0 + 1.2 + (i % 3) * 1.05, z1 - 1.2 - Math.floor(i / 3) * 0.55, { y: (i % 2) * 0.45, ry: (bruit(i, 1, 41) - 0.5) * 0.2, vieille: 0.6 });
  botte(ctx, x0 + 5.5, z1 - 2.2, { ronde: true, ry: 0.4, vieille: 0.8 });
  jonchee(c, x0 + 0.5, z0 + 0.5, x1 - 4, z1 - 0.5, 40, [0xc9b071, 0xb8a060, 0xa89058]);
  // le vieux tracteur de la ferme (sans cabine), la charrette, la herse
  tracteur(ctx, xm + 2.4, zc + 0.5, Math.PI + 0.1, 0xb8433a, { petit: true });
  c.repere({ x: x1 - 3.2, y: 0, z: z0 + 2.4, ry: 0.15 }, () => {
    c.boite(2.6, 0.08, 1.5, PALETTE.boisGris, { y: 0.8 }, M.mat);
    for (const s of [-1, 1]) c.boite(2.6, 0.45, 0.06, PALETTE.boisGris, { y: 1.05, z: s * 0.72 }, M.mat);
    for (const s of [-1, 1]) c.tube([0, 0.55, s * 0.8], [0, 0.55, s * 0.88], 0.55, 0x5a4130, M.mat, 9);
    barre(c, [1.3, 0.8, -0.3], [2.8, 0.1, -0.2], 0.08, 0.08, PALETTE.bois, M.mat);
    barre(c, [1.3, 0.8, 0.3], [2.8, 0.1, 0.4], 0.08, 0.08, PALETTE.bois, M.mat);
  });
  obstacleBoite(b, x1 - 3.2, z0 + 2.4, 2.8, 1.8, 0.15, "charrette");
  // l'établi et les outils pendus au mur nord (fourches, faux, serpes)
  c.boite(2.4, 0.85, 0.7, PALETTE.bois, { x: x0 + 12, y: 0.43, z: z0 + 0.65 }, M.mat);
  for (let i = 0; i < 6; i++) {
    const tx = x0 + 10.6 + i * 0.5;
    barre(c, [tx, 0.95, z0 + 0.35], [tx + 0.05, 2.4, z0 + 0.32], 0.035, 0.035, PALETTE.boisGris, M.mat);
    c.boite(0.25, 0.3, 0.03, 0x6a6a64, { x: tx + 0.05, y: 2.5, z: z0 + 0.32 }, M.metal);
  }
  for (let i = 0; i < 4; i++) c.boite(0.45, 0.6, 0.35, 0xb8a888, { x: x0 + 9.3 + i * 0.55, y: 0.3, z: z1 - 0.6, ry: i * 0.3 }, M.toile, { nuance: 0.06 });
  c.tube([x1 - 1.2, 0, z1 - 1.0], [x1 - 1.2, 0.9, z1 - 1.0], 0.3, 0x4a6a8a, M.tole, 8);
  // le grand portail est : un battant ouvert, l'autre tombé dans la cour
  c.boite(2.1, 3.6, 0.08, 0x6a5a44, { x: x1 + 0.9, y: 1.8, z: z0 + 3.9 - 0.2, ry: -1.3 }, M.mat, { nuance: 0.05 });
  c.boite(2.1, 0.08, 3.6, 0x6a5a44, { x: x1 + 2.2, y: 0.08, z: z0 + 7.1, ry: 0.2 }, M.mat, { nuance: 0.05 });
  lierre(c, x0 - 0.27, 0, 17, -Math.PI / 2, 5, 4, Math.round(40 + u * 60));
  // les rais de lumière qui tombent du toit percé
  semerTouffes(c, x0 - 1, z1 + 0.3, x1 + 1, z1 + 1.2, Math.round(8 + u * 10));
}

export function maisonMuree(ctx) {
  const { x0, x1, z0, z1, h, he } = MAISON;
  const xm = (x0 + x1) / 2;
  const zc = (z0 + z1) / 2;
  if (!ctx.ici(xm)) return;
  const { c, M, b, u } = ctx;
  const hf = 3.0;
  const haut = coucheStricte(b, "étage et toit de la maison murée", { x: xm, z: zc, l: x1 - x0 + 1, p: z1 - z0 + 1 }, 2.4, h + he + hf + 1.5, [M.pierre, M.tuiles, M.mat, M.satin, M.enseignes]);
  const pierre = { ep: 0.45, couleur: 0xd2c6ac, mat: M.pierre };
  // le rez-de-chaussée, ouvertures murées de parpaings (base jusqu'à 2,4 m, le reste en couche)
  const murs = [[[x0, z1], [x1, z1]], [[x1, z1], [x1, z0]], [[x1, z0], [x0, z0]], [[x0, z0], [x0, z1]]];
  for (const [a, b2] of murs) murCoupe(ctx, haut, a, b2, { ...pierre, h }, 2.4);
  for (const [a, b2] of murs) mur(haut, a, b2, { ...pierre, h: he, y0: h });
  // les ouvertures murées (parpaings gris), les volets cloués
  const parpaings = (x, z, l, hh, ry, y = 0) => {
    c.boite(l, hh, 0.12, 0x9a9890, { x, y: y + hh / 2, z, ry }, M.mat, { nuance: 0.03 });
    for (let k = 1; k < hh / 0.2; k++) c.boite(l, 0.015, 0.13, 0x7a7870, { x, y: y + k * 0.2, z, ry }, M.mat, { crasse: false });
  };
  parpaings(x0 + 4, z0 - 0.25, 1.0, 2.1, 0); // la porte, côté cour
  parpaings(x0 + 8, z0 - 0.25, 1.2, 1.2, 0, 0.9);
  parpaings(x0 + 3, z1 + 0.25, 1.2, 1.2, 0, 0.9);
  parpaings(x0 + 8.5, z1 + 0.25, 1.2, 1.2, 0, 0.9);
  parpaings(x1 + 0.25, zc, 1.2, 1.2, Math.PI / 2, 0.9);
  panneau(c, M.enseignes, R.inventorie, { x: x0 + 4, y: 1.3, z: z0 - 0.33, ry: Math.PI }, 1.0, 0.5);
  panneau(c, M.enseignes, R.inventorie, { x: x0 + 8.5, y: 1.6, z: z1 + 0.33 }, 1.0, 0.5);
  // l'étage : volets clos et cloués
  for (const [vx, vz, ry] of [[x0 + 3, z1 + 0.26, 0], [x0 + 8.5, z1 + 0.26, 0], [x1 + 0.26, zc, Math.PI / 2], [x0 + 6, z0 - 0.26, Math.PI]]) {
    haut.boite(1.3, 1.3, 0.06, C.volet, { x: vx, y: h + 1.3, z: vz, ry }, M.satin, { nuance: 0.06 });
    for (const dy of [-0.4, 0.4]) haut.boite(1.5, 0.12, 0.05, PALETTE.boisGris, { x: vx, y: h + 1.3 + dy, z: vz + (ry === 0 ? 0.05 : ry === Math.PI ? -0.05 : 0), ry, rz: dy * 0.1 }, M.mat);
  }
  // le toit, les pignons, la cheminée
  pignon(haut, M.pierre, 0xd2c6ac, x0, h + he, zc, z1 - z0 + 0.45, hf, Math.PI / 2, 0.45);
  pignon(haut, M.pierre, 0xd2c6ac, x1, h + he, zc, z1 - z0 + 0.45, hf, Math.PI / 2, 0.45);
  toitDeuxPans(haut, xm, zc, x1 - x0, z1 - z0, h + he, hf, { mat: M.tuiles, couleur: C.tuile, debord: 0.4, trous: u > 0.75 ? [{ u: 2, v: 1, l: 2, p: 0.5 }] : [] });
  haut.pave(x0 + 1.5, h + he + 1.5, zc - 0.4, x0 + 2.3, h + he + hf + 0.9, zc + 0.4, 0xc8bca2, M.pierre);
  lierre(c, x1 + 0.23, 0, z1 - 2, Math.PI / 2, 3, 3 + u * 2.5, Math.round(30 + u * 50));
  lierre(c, xm, 0, z1 + 0.23, 0, 6, 2 + u * 3, Math.round(30 + u * 50));
  // la cour : le puits, la niche, la cuve à fioul, la herse rouillée, le fil à linge
  const px = -66.5;
  const pz = 16;
  c.tube([px, 0, pz], [px, 0.85, pz], 0.75, 0xc9bea6, M.pierre, 10);
  c.tube([px, 0.85, pz], [px, 0.9, pz], 0.62, 0x2a3434, M.lisse, 10);
  for (const s of [-1, 1]) c.boite(0.12, 1.6, 0.12, PALETTE.boisSombre, { x: px + s * 0.75, y: 1.6, z: pz }, M.mat);
  c.tube([px - 0.8, 2.25, pz], [px + 0.8, 2.25, pz], 0.07, PALETTE.boisSombre, M.mat, 6);
  c.boite(1.9, 0.06, 1.2, C.tuileVieille, { x: px, y: 2.6, z: pz - 0.3, rx: -0.5 }, M.mat);
  c.boite(1.9, 0.06, 1.2, C.tuileVieille, { x: px, y: 2.6, z: pz + 0.3, rx: 0.5 }, M.mat);
  c.tube([px + 0.2, 1.4, pz], [px + 0.2, 1.75, pz], 0.15, 0x7a7a74, M.metal, 7);
  obstacleBoite(b, px, pz, 1.5, 1.5, 0, "puits");
  c.repere({ x: -72.5, y: 0, z: 21.5, ry: 0.4 }, () => {
    c.boite(1.0, 0.8, 1.2, 0x7a5a3c, { y: 0.4 }, M.mat);
    c.boite(1.1, 0.06, 0.75, 0x5a4130, { y: 0.95, z: -0.3, rx: -0.5 }, M.mat);
    c.boite(1.1, 0.06, 0.75, 0x5a4130, { y: 0.95, z: 0.3, rx: 0.5 }, M.mat);
    c.boite(0.45, 0.5, 0.05, 0x1e1a16, { y: 0.3, z: 0.61 }, M.mat);
  });
  c.repere({ x: -57.5, y: 0, z: 13.5, ry: Math.PI / 2 }, () => {
    c.tube([-1.2, 0.75, 0], [1.2, 0.75, 0], 0.6, 0x5f7a5a, M.tole, 10);
    for (const s of [-0.8, 0.8]) c.boite(0.1, 0.5, 1.0, 0x3a3a38, { x: s, y: 0.25 }, M.metal);
  });
  obstacleBoite(b, -57.5, 13.5, 1.3, 2.6, 0, "cuve à fioul");
  c.repere({ x: -61, y: 0, z: 19.5, ry: 0.3 }, () => {
    for (let i = 0; i < 4; i++) c.boite(2.4, 0.08, 0.08, PALETTE.rouille, { y: 0.3, z: -0.6 + i * 0.4 }, M.tole);
    for (let i = 0; i < 12; i++) c.boite(0.04, 0.3, 0.04, PALETTE.rouilleSombre, { x: -1.1 + (i % 6) * 0.44, y: 0.15, z: -0.6 + Math.floor(i / 6) * 0.8 }, M.tole);
  });
  for (const s of [0, 1]) c.tube([-70 + s * 8, 0, 11.5], [-70 + s * 8, 1.9, 11.5], 0.04, PALETTE.boisGris, M.mat, 5);
  barre(c, [-70, 1.85, 11.5], [-62, 1.75, 11.5], 0.012, 0.012, 0x8a8a84, M.metal);
  for (let i = 0; i < 3; i++) c.boite(0.6, 0.7, 0.02, [0xd8ccb0, 0x7a8aa0, 0xb8433a][i], { x: -68.5 + i * 2.4, y: 1.4, z: 11.5, rz: (i - 1) * 0.05 }, M.toile, { crasse: false });
  // l'écriteau « Œufs frais » au bout du chemin
  c.tube([-62.6, 0, 8.6], [-62.6, 1.6, 8.6], 0.05, PALETTE.boisGris, M.mat, 5);
  panneauDouble(c, M.enseignes, R.oeufs, { x: -62.6, y: 1.35, z: 8.6, ry: 0.15 }, 1.0, 0.5);
  // le fumier devenu talus d'orties, quelques poules ensauvagées ? (des plumes)
  c.poser(GEO.boule, M.mat, 0x5a4a32, { x: -74, y: 0.2, z: 12.5, e: [1.8, 0.7, 1.3] });
  semerTouffes(c, -75.5, 11, -72.5, 14, 10, 0x6a8a3a);
  semerTouffes(c, -76, 9.5, -55, 23, Math.round(16 + u * 20));
  arbre(c, -56, 27, 9, "feuillu");
  arbre(c, -98, 15, 10, "feuillu");
}

/** Le coin de friche au sud-ouest et le verger à l'abandon de la ferme. */
export function abordsFerme(ctx) {
  const { c } = ctx;
  friche(ctx, -99.5, 26.5, -95.5, 32);
  if (ctx.ici(-97)) {
    arbre(c, -97, 22, 6, "feuillu");
    arbre(c, -98.5, 11.5, 5, "mort");
  }
}

export const TRONCON1 = [relais, parkingCamions, abribus, grange, maisonMuree, abordsFerme];
