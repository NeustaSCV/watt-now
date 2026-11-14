// La halte de la digue : ce qui se visite et se fouille. Chaque fonction ne pose rien si son centre n'est pas dans le
// tronçon en cours (ctx.ici), et bâtit dans le repère de la halte entière (modele.js recentre ensuite).

import * as THREE from "three";
import { aleatoire, mur, gravats, debris, jonchee, flaque, toitDeuxPans, arbre, matiereLueur } from "../commun/atelier.js";
import { R } from "./atlas.js";
import {
  PI, COUL, M, zc, hache, hauteur, HD, HL, XB, WB, ZB, CH, Y_FOND, Y_ETANG, Y_CANAL, PLANCHERS,
  panneau, boiteEntre, planche, cylindre, geoCyl, quad, lame, BOULE, ROCHE, CONE, roseaux, nid, voiture, chaise, table,
  etagere, litDeCamp, rechaud, lanterne, feu, appelant, velo, murDouble, pignonX, plancher, lattes,
} from "./outils.js";

/** Un panneau sur deux poteaux, lisible des deux côtés (`r` devant, vers +z local ; `r2` derrière). */
export function pancarte(c, r, x, z, ry, l, h, y = 1.5, r2 = r, couleurPoteau = COUL.boisSombre) {
  c.repere({ x, y: 0, z, ry }, () => {
    for (const s of [-1, 1]) c.boite(0.1, y + h / 2 + 0.08, 0.1, couleurPoteau, { x: s * (l / 2 - 0.25), y: (y + h / 2 + 0.08) / 2 }, M.mat);
    c.boite(l + 0.08, h + 0.08, 0.05, 0x5a5650, { y }, M.tole);
    panneau(c, r, { y, z: 0.03 }, l, h);
    panneau(c, r2, { y, z: -0.03, ry: PI }, l, h);
  });
}

/** Une pancarte sur un seul piquet. */
function piquet(c, r, x, z, ry, l, h, y = 1.2, penche = 0) {
  c.repere({ x, y: 0, z, ry, rz: penche }, () => {
    c.boite(0.08, y + h / 2, 0.08, COUL.boisSombre, { y: (y + h / 2) / 2 }, M.mat);
    c.boite(l + 0.06, h + 0.06, 0.04, 0x6a5a48, { y, z: 0.05 }, M.mat);
    panneau(c, r, { y, z: 0.075 }, l, h);
    panneau(c, r, { y, z: 0.025, ry: PI }, l, h);
  });
}

/** Le contour d'un objet posé (rectangle l × p tourné de ry), noté comme obstacle. */
function contour(b, x, z, l, p, ry, nature) {
  const co = Math.cos(ry);
  const si = Math.sin(ry);
  const pts = [[-l / 2, -p / 2], [l / 2, -p / 2], [l / 2, p / 2], [-l / 2, p / 2]].map(([u, v]) => [x + u * co + v * si, z - u * si + v * co]);
  for (let i = 0; i < 4; i++) b.obstacle(pts[i][0], pts[i][1], pts[(i + 1) % 4][0], pts[(i + 1) % 4][1], nature);
}

/** Un sac de sable. */
function sac(c, x, y, z, ry) {
  c.poser(BOULE, M.toile, c.hasard() < 0.5 ? 0x8a7f62 : 0x7a7058, { x, y: y + 0.12, z, ry, e: [0.32, 0.13, 0.2] }, { nuance: 0.06 });
}

/** Une rangée de sacs de sable de a à b, sur `rangs` rangs. */
function sacs(ctx, a, bb, rangs = 3, nature = "sacs de sable") {
  const { c, b } = ctx;
  const L = Math.hypot(bb[0] - a[0], bb[1] - a[1]);
  const ry = -Math.atan2(bb[1] - a[1], bb[0] - a[0]);
  const n = Math.max(1, Math.round(L / 0.6));
  for (let r = 0; r < rangs; r++) {
    for (let i = 0; i < n - (r % 2); i++) {
      const t = (i + 0.5 + (r % 2) * 0.5) / n;
      sac(c, a[0] + (bb[0] - a[0]) * t, r * 0.22, a[1] + (bb[1] - a[1]) * t, ry + c.entre(-0.15, 0.15));
    }
  }
  b.obstacle(a[0], a[1], bb[0], bb[1], nature);
}

/** Une palette de bois (debout ou à plat). */
function palette(c, x, y, z, ry, debout = false) {
  c.repere({ x, y, z, ry, rx: debout ? -PI / 2 + 0.12 : 0 }, () => {
    for (let i = 0; i < 5; i++) c.boite(1.2, 0.025, 0.12, 0xa08a68, { y: 0.13, z: -0.4 + i * 0.2 }, M.planches, { nuance: 0.06 });
    for (const s of [-0.5, 0, 0.5]) c.boite(0.1, 0.1, 0.9, 0x8a7458, { x: s, y: 0.06 }, M.planches);
  });
}

/** Une coque de barque (ouverte, à double face), le long de z local, l'étrave vers −z. */
function coque(c, L, W, D, couleur, pose) {
  const st = [-0.5, -0.3, 0, 0.3, 0.5];
  const larg = [0.78, 0.97, 1, 0.82, 0.08];
  const prof = [0.82, 0.98, 1, 0.92, 0.55];
  const sect = st.map((t, i) => {
    const w = (W / 2) * larg[i];
    const d = D * prof[i];
    return [[-w, D * 0.05], [-w * 0.75, D * 0.05 - d * 0.65], [0, D * 0.05 - d], [w * 0.75, D * 0.05 - d * 0.65], [w, D * 0.05]].map(([x, y]) => [x, y + D * 0.95, t * L]);
  });
  const pos = [];
  for (let i = 0; i < sect.length - 1; i++) {
    for (let j = 0; j < 4; j++) {
      const a = sect[i][j], b = sect[i][j + 1], cc = sect[i + 1][j], d = sect[i + 1][j + 1];
      pos.push(...a, ...cc, ...b, ...b, ...cc, ...d);
    }
  }
  // Le tableau arrière
  const t = sect[sect.length - 1];
  const s0 = sect[0];
  for (let j = 1; j < 4; j++) pos.push(...s0[0], ...s0[j], ...s0[j + 1]);
  void t;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  c.poser(g, M.toile, couleur, pose, { nuance: 0.04 });
  g.dispose();
}

// ---------- Tronçon 1 : l'entrée des marais ----------

export function entree(ctx) {
  const { c, b, u } = ctx;
  if (ctx.ici(-96.5)) {
    // Le panneau de direction de l'entrée A, et la barrière de digue ouverte
    pancarte(c, R.dirA1, -96.5, zc(-96.5) + HL + 1.15, 0.12, 3.2, 0.8, 1.6, R.dirA2);
    const zb = zc(-92.5) - HL - 0.9;
    c.boite(0.22, 1.1, 0.22, 0xd8d4c8, { x: -92.5, y: 0.55, z: zb }, M.satin);
    c.repere({ x: -92.5, y: 1.0, z: zb, ry: 2.2, rz: 0.05 }, () => {
      for (let i = 0; i < 6; i++) c.boite(0.6, 0.1, 0.1, i % 2 ? 0xe4e0d6 : 0xa8473c, { x: 0.35 + i * 0.6 }, M.satin, { nuance: 0.05 });
    });
    piquet(c, R.barriere, -91.6, zb - 0.3, 0.2, 1.1, 0.4, 1.2);
    piquet(c, R.digue, -89.5, zc(-89.5) + HL + 0.9, 0.15, 1.1, 0.42, 1.3, u * 0.15);
  }
  // Le grand panneau de la réserve naturelle connectée, sur l'accotement sud
  if (ctx.ici(-78.5)) {
    const z = zc(-78.5) + HL + 1.2;
    c.repere({ x: -78.5, y: 0, z, ry: 0.08, rz: -0.03 * u }, () => {
      for (const s of [-1, 1]) c.boite(0.14, 2.9, 0.14, 0x5a5650, { x: s * 1.5, y: 1.45 }, M.tole);
      c.boite(3.75, 1.95, 0.08, 0x3d4a48, { y: 2.0 }, M.tole);
      panneau(c, R.reserve, { y: 2.0, z: 0.05 }, 3.6, 1.8);
      panneau(c, R.reserve, { y: 2.0, z: -0.05, ry: PI }, 3.6, 1.8);
      // Le QR code géant, délavé
      c.boite(0.5, 0.5, 0.02, 0xd9d4c4, { x: 1.35, y: 1.25, z: 0.06 }, M.satin, { crasse: false });
    });
    b.obstacle(-80, z, -77, z, "panneau de la réserve");
  }
  // La carte « vous êtes ici » à l'entrée du ponton de l'observatoire
  if (ctx.ici(-64.6)) piquet(c, R.carte, -64.6, zc(-64.6) - HD + 0.6, 0.3, 0.9, 0.35, 1.1);
  abriTourbe(ctx);
  observatoire(ctx);
  barque(ctx);
}

function abriTourbe(ctx) {
  if (!ctx.ici(-87)) return;
  const { c, b, u } = ctx;
  const X1 = -90.5, X2 = -83.5, Z1 = -12.5, Z2 = -8;
  const k = b.couche("abri à tourbe", { x: -87, z: -10.25, l: 8, p: 5.6 }, 1.05, 3.3);
  lattes(ctx, k, [X2, Z1], [X1, Z1], 2.3);
  lattes(ctx, k, [X1, Z1], [X1, Z2], 2.3);
  lattes(ctx, k, [X2, Z2], [X2, Z1], 2.3);
  // Les poteaux de la façade ouverte (sud)
  for (const x of [X1, (X1 + X2) / 2, X2]) {
    c.boite(0.16, 1.05, 0.16, COUL.boisSombre, { x, y: 0.525, z: Z2 }, M.mat);
    k.boite(0.16, 1.68, 0.16, COUL.boisSombre, { x, y: 1.05 + 0.84, z: Z2 }, M.mat);
  }
  // Le toit en appentis de tôle ondulée rouillée, percé
  const yS = 2.8, yN = 2.3;
  const yAt = (z) => yS + ((z - (Z2 + 0.5)) / (Z1 - 0.5 - (Z2 + 0.5))) * (yN - yS);
  for (const z of [Z2, (Z1 + Z2) / 2, Z1]) k.boite(X2 - X1 + 0.5, 0.12, 0.12, COUL.boisSombre, { x: -87, y: yAt(z) - 0.1, z }, M.mat);
  const n = 9;
  for (let i = 0; i < n; i++) {
    if (hache(i, 77) < 0.22 * u) continue;
    const x = X1 - 0.4 + (i + 0.5) * ((X2 - X1 + 0.8) / n);
    planche(k, [x, yS, Z2 + 0.5], [x, yN, Z1 - 0.5], (X2 - X1 + 0.8) / n + 0.02, 0.04, i % 2 ? COUL.rouille : 0x8a6a50, M.tole, [1, 0, 0], { crasse: false, nuance: 0.06 });
  }
  // Le sol de terre battue, noirci de poussière de tourbe
  c.pave(X1, 0, Z1, X2, 0.015, Z2, 0x4a3c30, M.mat, { crasse: false });
  // Les piles de briquettes de tourbe (le noyau sombre, les briquettes du front une à une)
  const piles = [[-89.4, 1.4], [-87.2, 1.4], [-85.0, 0.8 + 0.6 * (1 - u)]];
  for (const [px, ph] of piles) {
    c.pave(px - 0.9, 0, -12.2, px + 0.9, ph, -11.15, COUL.tourbe, M.mat, { nuance: 0.05 });
    const rangs = Math.round(ph / 0.13);
    for (let r = 0; r < rangs; r++) {
      for (let i = 0; i < 6; i++) {
        const x = px - 0.9 + 0.15 + i * 0.3 + (r % 2 ? 0.08 : -0.04);
        if (x > px + 0.85) continue;
        c.boite(0.27, 0.12, 0.13, c.hasard() < 0.5 ? COUL.tourbeSeche : 0x4e3c2c, { x, y: r * 0.13 + 0.065, z: -11.1, ry: c.entre(-0.05, 0.05) }, M.mat, { nuance: 0.08, crasse: false });
      }
    }
  }
  // Des briquettes tombées, la brouette, le louchet, les sacs de jute
  for (let i = 0; i < 10; i++) c.boite(0.27, 0.12, 0.13, COUL.tourbeSeche, { x: c.entre(-89.5, -84.5), y: 0.07, z: c.entre(-10.8, -8.6), ry: c.hasard() * 3 }, M.mat, { nuance: 0.08 });
  c.repere({ x: -84.6, y: 0, z: -9.6, ry: 0.5 }, () => {
    c.boite(1.0, 0.35, 0.6, 0x6d7478, { y: 0.55 }, M.tole);
    for (let i = 0; i < 5; i++) c.boite(0.27, 0.12, 0.13, COUL.tourbeSeche, { x: c.entre(-0.3, 0.3), y: 0.78, z: c.entre(-0.18, 0.18), ry: c.hasard() * 3 }, M.mat);
    c.poser(geoCyl(0.2, 0.2, 0.08, 8), M.mat, 0x232323, { x: 0.65, y: 0.2, rx: PI / 2 });
    for (const s of [-1, 1]) c.poutre([-0.3, 0.45, s * 0.25], [-1.1, 0.75, s * 0.3], 0.05, COUL.bois, M.mat);
  });
  c.repere({ x: -83.85, y: 0, z: -10.9, rz: 0.22 }, () => {
    c.boite(0.05, 1.3, 0.05, COUL.bois, { y: 0.75 }, M.mat);
    c.boite(0.13, 0.32, 0.03, 0x6f767a, { y: 0.12 }, M.metal);
  });
  for (const [x, z] of [[-89.8, -9.0], [-89.3, -8.7]]) c.poser(BOULE, M.toile, 0x9a8a62, { x, y: 0.3, z, ry: c.hasard() * 3, e: [0.3, 0.32, 0.25] }, { nuance: 0.06 });
  // Dehors : les chandelles de tourbe qui sèchent au vent, le front de taille noyé
  for (let p = 0; p < 7; p++) {
    const px = -82.2 + (p % 2) * 1.2;
    const pz = -12 + Math.floor(p / 2) * 1.6;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * PI * 2 + p;
      c.boite(0.13, 0.32, 0.12, i % 2 ? COUL.tourbeSeche : COUL.tourbe, { x: px + Math.cos(a) * 0.1, y: 0.16, z: pz + Math.sin(a) * 0.1, ry: -a, rz: 0.3 * Math.cos(a), rx: 0.3 * Math.sin(a) }, M.mat, { nuance: 0.06 });
    }
    c.boite(0.27, 0.12, 0.13, COUL.tourbeSeche, { x: px, y: 0.36, z: pz, ry: p }, M.mat);
  }
  for (let i = 0; i < 4; i++) c.pave(-90 + i * 1.5, -0.6 - i * 0.1, -14.3, -88.8 + i * 1.5, 0.0, -13.7, COUL.tourbe, M.mat, { crasse: false, nuance: 0.05 });
  // Le brasero des Charbonniers et leur pancarte
  const bx = -81.8, bz = -5.4;
  cylindre(c, M.tole, COUL.rouille, bx, 0, bz, 0.32, 0.7, 10, {}, { nuance: 0.05 });
  for (let i = 0; i < 6; i++) c.boite(0.05, 0.08, 0.05, 0xff8030, { x: bx + Math.cos(i) * 0.28, y: 0.4, z: bz + Math.sin(i) * 0.28 }, M.flamme, { crasse: false, nuance: 0 });
  for (let i = 0; i < 3; i++) c.poser(CONE, M.flamme, i ? 0xffb040 : 0xff7a2a, { x: bx + c.entre(-0.08, 0.08), y: 0.85 + i * 0.07, z: bz + c.entre(-0.08, 0.08), e: [0.15 - i * 0.03, 0.42 - i * 0.08, 0.15 - i * 0.03] }, { crasse: false, nuance: 0 });
  piquet(c, R.tourbe, -82.9, -4.5, 0.25, 1.2, 0.6, 1.25);
  b.lumiere(bx, 1.0, bz, 0xff8a3d, 8, 9, "brasero de tourbe des Charbonniers, devant l'abri");
}

function observatoire(ctx) {
  if (!ctx.ici(-66)) return;
  const { c, b, u, bris } = ctx;
  plancher(ctx, PLANCHERS.pontonObs, { manque: 0.18 * u });
  plancher(ctx, PLANCHERS.obs);
  const X1 = -70, X2 = -62, Z1 = -22, Z2 = -18.2, H = 2.4;
  const k = b.couche("observatoire ornithologique", { x: -66, z: -20.1, l: 8.8, p: 4.6 }, 1.05, 3.6);
  const bois = { couleur: 0x7d705c, mat: M.planches };
  mur(c, [X2, Z1], [X1, Z1], { h: H, ep: 0.15, ...bois, batiment: b, ouvertures: [{ u: 4, l: 6.8, bas: 1.0, haut: 1.4, type: "vide" }] });
  mur(c, [X1, Z1], [X1, Z2], { h: H, ep: 0.15, ...bois, batiment: b });
  murDouble(ctx, k, [X1, Z2], [X2, Z2], { h: H, ep: 0.15, ...bois, ouvertures: [{ u: 4, l: 0.95, bas: 0, haut: 2.1, type: "porte", vantail: "entrouvert", angle: 1.3, couleurPorte: 0x5a5040 }] });
  murDouble(ctx, k, [X2, Z2], [X2, Z1], { h: H, ep: 0.15, ...bois, ouvertures: [{ u: 1.9, l: 0.8, bas: 1.05, haut: 1.6, type: "fenetre", bris, cadre: 0x5a5040 }] });
  for (const [x, z] of [[X1, Z1], [X2, Z1], [X1, Z2], [X2, Z2]]) {
    c.boite(0.18, 1.05, 0.18, COUL.boisSombre, { x, y: 0.525, z }, M.mat);
    (z === Z2 || x === X2 ? k : c).boite(0.18, H - 1.05 + 0.3, 0.18, COUL.boisSombre, { x, y: 1.05 + (H - 0.75) / 2, z }, M.mat);
  }
  // Le toit plat en appentis, couvert de feutre goudronné et de mousse
  for (let i = 0; i < 6; i++) {
    const x = X1 - 0.4 + (i + 0.5) * ((X2 - X1 + 0.8) / 6);
    planche(k, [x, 2.78, Z2 + 0.6], [x, 2.5, Z1 - 0.5], (X2 - X1 + 0.8) / 6 + 0.02, 0.08, i % 2 ? 0x3e403c : 0x4a4c44, M.mat, [1, 0, 0], { crasse: false, nuance: 0.05 });
  }
  for (let i = 0; i < 6; i++) k.poser(BOULE, M.mat, 0x6a7a3c, { x: c.entre(X1, X2), y: 2.7, z: c.entre(Z1 + 0.5, Z2), e: [c.entre(0.3, 0.7), 0.06, c.entre(0.3, 0.6)] }, { crasse: false });
  // Dedans : le banc de guet, les écrans « réalité augmentée » (un seul luit encore), la frise des oiseaux absents
  c.boite(7.4, 0.06, 0.42, 0x8a7a62, { x: -66, y: 0.46, z: -21.55 }, M.planches);
  for (let x = -69.4; x <= -62.6; x += 1.7) c.boite(0.06, 0.44, 0.38, COUL.boisSombre, { x, y: 0.22, z: -21.55 }, M.mat);
  c.boite(7.6, 0.05, 0.3, 0x8a7a62, { x: -66, y: 0.98, z: -21.76 }, M.planches); // l'appui des coudes
  for (const [x, vivant] of [[-68.4, false], [-66, true], [-63.6, false]]) {
    c.boite(0.98, 0.54, 0.06, 0x1d1f1f, { x, y: 1.86, z: -21.88 }, M.satin, { crasse: false });
    panneau(c, vivant ? R.ecranOiseau : R.ecranMort, { x, y: 1.86, z: -21.845 }, 0.9, 0.45, vivant ? M.lumineux : M.panneaux);
  }
  panneau(c, R.oiseaux, { x: -69.9, y: 1.65, z: -20.1, ry: PI / 2 }, 3.2, 0.6);
  c.boite(0.2, 0.08, 0.12, 0x2b2b29, { x: -64.8, y: 0.52, z: -21.5 }, M.satin); // jumelles oubliées
  jonchee(c, X1 + 0.3, Z1 + 0.6, X2 - 0.3, Z2 - 0.2, 14, [0x9c8a5a, 0x6f5a3a, 0xd8d0b8]);
  // Sur le platelage : la longue-vue connectée, muette
  c.repere({ x: -62.8, y: 0, z: -17.4, ry: 0.6 }, () => {
    c.boite(0.12, 1.1, 0.12, 0x5a6670, { y: 0.55 }, M.tole);
    c.poser(geoCyl(0.11, 0.14, 0.55, 8), M.tole, 0x2f6f73, { y: 1.25, z: -0.05, rx: PI / 2 - 0.2 });
    c.boite(0.24, 0.18, 0.06, 0x1d1f1f, { y: 1.0, z: 0.1, rx: -0.4 }, M.satin);
  });
  // L'arbre mort et son nid de héron, vide
  const ya = hauteur(-73.5, -25.5);
  arbre(c, -73.5, -25.5, 7.5, "mort", ya - 0.2);
  nid(c, -73.4, ya + 5.6, -25.4, 1.1);
  b.lumiere(-66, 1.85, -21.4, 0x9fe0ff, 2.5, 5, "écran de l'observatoire qui luit encore (« Aucun oiseau détecté »)");
}

function barque(ctx) {
  if (!ctx.ici(-56.8)) return;
  const { c } = ctx;
  c.repere({ x: -56.8, y: -1.05, z: 6.4, ry: 0.4 }, () => {
    c.repere({ rx: 0.34, rz: 0.22 }, () => {
      coque(c, 4.2, 1.45, 0.62, 0x5f7a6a, {});
      for (const t of [-0.6, 0.6]) c.boite(1.25, 0.05, 0.28, COUL.boisGris, { y: 0.48, z: t }, M.planches);
      c.boite(0.06, 0.04, 2.3, COUL.bois, { x: 0.35, y: 0.55, z: 0.2, ry: 0.15 }, M.mat); // la rame
      c.boite(0.16, 0.02, 0.5, COUL.bois, { x: 0.43, y: 0.55, z: 1.4, ry: 0.15 }, M.mat);
      c.boite(0.9, 0.06, 0.5, 0x3c4a44, { y: 0.06, z: 0.9 }, M.mat, { crasse: false }); // l'eau croupie au fond
    });
  });
  // L'amarre jusqu'au piquet, sur la crête
  c.boite(0.08, 0.6, 0.08, COUL.boisSombre, { x: -56.1, y: 0.3, z: zc(-56.1) + HD - 0.6 }, M.mat);
  c.tube([-56.1, 0.45, zc(-56.1) + HD - 0.6], [-57.4, -0.6, 4.9], 0.02, 0x8a7a5a, M.mat, 3);
  debris(c, -58.5, 4.3, -55, 5.4, 6, [COUL.boisGris, 0x8a7a5a]);
}

// ---------- Tronçon 2 : la brèche et les huttes ----------

export function breche(ctx) {
  if (!ctx.ici(XB)) return;
  const { c, b, u } = ctx;
  // La porte de grange couchée en travers de la brèche
  c.repere({ x: XB, y: 0.13, z: ZB, ry: 0.04 }, () => {
    c.boite(3.4, 0.09, 2.1, 0x8a4a3a, {}, M.planches, { nuance: 0.03 });
    for (const z of [-0.95, 0, 0.95]) c.boite(3.4, 0.05, 0.16, 0x6a3a2e, { y: 0.07, z }, M.planches);
    c.boite(3.7, 0.05, 0.16, 0x6a3a2e, { y: 0.07, ry: Math.atan2(1.9, 3.3) }, M.planches);
    for (const x of [-1.2, 1.2]) c.boite(0.6, 0.02, 0.08, 0x2b2b29, { x, y: 0.1, z: -0.85 }, M.metal);
  });
  // Le tronc échoué qui la porte, et les fûts calés dessous
  c.tube([XB - 0.25, -0.34, ZB - 3.4], [XB + 0.2, -0.3, ZB + 3.6], 0.33, 0x5d5446, M.mat, 7);
  c.poser(BOULE, M.mat, 0x4f463a, { x: XB + 0.25, y: -0.4, z: ZB + 3.9, e: [0.9, 0.7, 0.6] }, { nuance: 0.05 });
  for (let i = 0; i < 5; i++) c.tube([XB + 0.2, -0.4, ZB + 3.8], [XB + 0.2 + Math.cos(i * 1.3) * 1.2, -0.6 + c.entre(0, 0.6), ZB + 4.2 + Math.sin(i * 1.3) * 0.8], 0.06, 0x4f463a, M.mat, 4);
  for (const [dx, dz] of [[-1.3, -0.7], [1.3, 0.6]]) cylindre(c, M.tole, COUL.rouille, XB + dx, -1.9, ZB + dz, 0.3, 1.95, 8, { rz: 0.06 }, { nuance: 0.05 });
  // Les planches qui raccordent la porte à la crête, de chaque côté
  for (const s of [-1, 1]) {
    for (const dz of [-0.48, 0, 0.48]) {
      planche(c, [XB + s * 4.05, 0.03, ZB + dz + c.entre(-0.03, 0.03)], [XB + s * 1.5, 0.15, ZB + dz], 0.06, 0.3, COUL.planche, M.planches, [0, 1, 0], { nuance: 0.05 });
    }
  }
  // La main courante de corde, sur des piquets
  const piquets = [];
  for (const s of [-1, 1]) for (const dz of [-0.92, 0.92]) piquets.push([XB + s * 3.9, ZB + dz]);
  for (const dz of [-1.05, 1.05]) piquets.push([XB, ZB + dz]);
  for (const [x, z] of piquets) c.boite(0.08, 1.4, 0.08, COUL.boisSombre, { x, y: Math.abs(x - XB) < 0.1 ? 0.35 : 0.5, z }, M.mat);
  for (const dz of [-1, 1]) {
    const pts = [[XB - 3.9, 0.95, ZB + dz * 0.92], [XB, 0.9, ZB + dz * 1.05], [XB + 3.9, 0.95, ZB + dz * 0.92]];
    for (let i = 0; i < 2; i++) {
      const [a, bb] = [pts[i], pts[i + 1]];
      const m = [(a[0] + bb[0]) / 2, (a[1] + bb[1]) / 2 - 0.18, (a[2] + bb[2]) / 2];
      c.tube(a, m, 0.018, 0x9a8a62, M.mat, 3);
      c.tube(m, bb, 0.018, 0x9a8a62, M.mat, 3);
    }
  }
  // L'eau de l'étang passe d'un côté à l'autre : la chute et son écume
  for (let x = XB - 2.8; x < XB + 2.8 - 0.01; x += 0.7) lame(c, [x, zc(x)], [x + 0.7, zc(x + 0.7)], Y_ETANG, Y_CANAL - 0.02, [0, 0.35]);
  const pe = [[XB - 2.6, Y_CANAL + 0.025, ZB + 0.3], [XB - 2.6, Y_CANAL + 0.025, ZB + 2.4], [XB + 2.6, Y_CANAL + 0.025, ZB + 2.4], [XB + 2.6, Y_CANAL + 0.025, ZB + 0.3]];
  quad(c, M.ecume, pe, pe.map(([x, , z]) => [x / 2, z / 2]), 0xffffff);
  // La route arrachée : plaques d'enrobé basculées, mottes de terre et cailloux au fond
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const dz = -1.5 + i * 1.5 + c.entre(-0.3, 0.3);
      c.boite(c.entre(0.9, 1.4), 0.12, c.entre(0.8, 1.3), COUL.asphalte, { x: XB + s * c.entre(2.6, 3.1), y: -0.45 - c.hasard() * 0.4, z: ZB + dz, rz: s * c.entre(0.4, 0.8), ry: c.entre(-0.3, 0.3) }, M.mat, { nuance: 0.04 });
    }
  }
  gravats(c, XB - 1, ZB - 2.6, 1.4, 10, [COUL.terre, COUL.roc, 0x6e6046], -1.9);
  gravats(c, XB + 0.8, ZB + 2.8, 1.4, 10, [COUL.terre, COUL.roc, 0x6e6046], -2.3);
  // L'argile grise mise à nu sur la lèvre est de la brèche
  c.poser(BOULE, M.mat, 0x8f8a7e, { x: XB + 3.6, y: -0.25, z: ZB + 3.2, e: [0.9, 0.35, 0.8] }, { crasse: false });
  // Les pancartes : la consigne des survivants à l'ouest, le « Digue fragile » officiel, tordu, à l'est
  piquet(c, R.passerelle, XB - 4.7, ZB - 1.5, 0.55, 1.2, 0.45, 1.25);
  piquet(c, R.danger, XB + 4.6, ZB + 2.0, -0.4, 1.0, 0.5, 1.4, 0.25 * u + 0.05);
  // Le poste de guet des survivants, côté est : sacs de sable, palettes, une chaise, un jerrican
  sacs(ctx, [XB + 5.2, ZB - 2.7], [XB + 8.4, ZB - 3.1], 3, "sacs de sable du poste de guet");
  sacs(ctx, [XB + 5.0, ZB - 2.7], [XB + 4.9, ZB - 3.8], 3, "sacs de sable du poste de guet");
  palette(c, XB + 7.2, 0, ZB - 3.5, 0.1);
  palette(c, XB + 7.2, 0.15, ZB - 3.5, 0.2);
  chaise(c, XB + 6.5, ZB - 2.2, 2.5);
  c.boite(0.35, 0.45, 0.2, 0x5a6a4a, { x: XB + 5.8, y: 0.23, z: ZB - 3.3, ry: 0.4 }, M.satin);
  c.boite(1.6, 0.04, 1.1, 0x4f6a5a, { x: XB + 7.2, y: 0.42, z: ZB - 3.5, rz: 0.05 }, M.toile); // la bâche
  sacs(ctx, [XB - 5.6, ZB + 2.4], [XB - 7.8, ZB + 2.6], 2, "sacs de sable");
  // L'épave de la voiture poussée de travers sur l'accotement : un couvert au bord du canal
  if (ctx.ici(-35.5)) {
    voiture(c, -35.5, 0, zc(-35.5) + 2.9, -0.35, 0x8a4a40, { rz: 0.06, capot: true });
    contour(b, -35.5, zc(-35.5) + 2.9, 3.9, 1.8, -0.35, "épave de voiture");
  }
}

export function huttes(ctx) {
  hutte(ctx, { n: 1, X1: -44.2, X2: -39.8, Z1: -20.6, Z2: -17.6, xp: -42, planchers: [PLANCHERS.pontonH1, PLANCHERS.hutte1] });
  hutte(ctx, { n: 2, X1: -10.2, X2: -5.4, Z1: -24.4, Z2: -21.4, xp: -7.8, planchers: [PLANCHERS.pontonH2a, PLANCHERS.pontonH2b, PLANCHERS.pontonH2c, PLANCHERS.hutte2] });
}

function hutte(ctx, d) {
  const { X1, X2, Z1, Z2, xp, n } = d;
  const cx = (X1 + X2) / 2;
  const cz = (Z1 + Z2) / 2;
  if (!ctx.ici(cx)) return;
  const { c, b, u, bris } = ctx;
  for (const p of d.planchers) plancher(ctx, p, { manque: (n === 2 ? 0.4 : 0.15) * u });
  const H = 2.2;
  const k = b.couche(`hutte de chasse ${n}`, { x: cx, z: cz, l: X2 - X1 + 1.4, p: Z2 - Z1 + 1.4 }, 1.05, 3.4);
  const bois = { couleur: 0x6f6450, mat: M.planches };
  // La jupe de planches qui plonge dans l'eau : la hutte est à demi immergée
  for (const [a, bb] of [[[X1, Z1], [X2, Z1]], [[X2, Z1], [X2, Z2]], [[X2, Z2], [X1, Z2]], [[X1, Z2], [X1, Z1]]]) boiteEntre(c, a[0], a[1], bb[0], bb[1], -1.4, 1.38, 0.2, 0x4a4234, M.planches, { crasse: false }, 0.2);
  mur(c, [X2, Z1], [X1, Z1], { h: H, ep: 0.18, ...bois, batiment: b, ouvertures: [{ u: (X2 - X1) / 2, l: X2 - X1 - 0.8, bas: 0.85, haut: 1.15, type: "vide" }] });
  mur(c, [X1, Z1], [X1, Z2], { h: H, ep: 0.18, ...bois, batiment: b });
  murDouble(ctx, k, [X1, Z2], [X2, Z2], { h: H, ep: 0.18, ...bois, ouvertures: [{ u: xp - X1, l: 0.85, bas: 0, haut: 2.1, type: "porte", vantail: "entrouvert", angle: 1.2, couleurPorte: 0x4f4536 }] });
  murDouble(ctx, k, [X2, Z2], [X2, Z1], { h: H, ep: 0.18, ...bois, ouvertures: [{ u: 1.5, l: 0.6, bas: 1.05, haut: 1.5, type: "fenetre", bris, cadre: 0x4f4536 }] });
  // Le toit de chaume de roseaux, bas et bossu (percé et affaissé sur la seconde hutte)
  const W = (Z2 - Z1) / 2 + 0.55;
  const ye = H - 0.05;
  const yf = H + 0.85;
  const nl = 6;
  for (const s of [-1, 1]) {
    for (let i = 0; i < nl; i++) {
      const x = X1 - 0.5 + (i + 0.5) * ((X2 - X1 + 1) / nl);
      if (n === 2 && s === 1 && (i === 2 || i === 3) && u > 0.3) continue;
      planche(k, [x, yf + 0.1, cz], [x, ye - 0.15, cz + s * W], (X2 - X1 + 1) / nl + 0.08, 0.3, i % 2 ? COUL.roseauSec : 0xa29a62, M.mat, [1, 0, 0], { crasse: false, nuance: 0.07 });
    }
  }
  k.boite(X2 - X1 + 1.1, 0.35, 0.5, 0x9a8f5a, { x: cx, y: yf + 0.15, z: cz }, M.mat, { crasse: false });
  pignonX(k, M.planches, 0x6f6450, X1, cz, Z2 - Z1, H, yf - H, 0.18);
  pignonX(k, M.planches, 0x6f6450, X2, cz, Z2 - Z1, H, yf - H, 0.18);
  if (n === 2 && u > 0.3) {
    // Le pan effondré pend dans la pièce
    planche(c, [cx - 0.3, 1.9, cz + 0.2], [cx + 0.5, 0.4, Z2 - 0.4], 1.1, 0.25, COUL.roseauSec, M.mat, [1, 0, 0], { crasse: false });
    for (let i = 0; i < 3; i++) c.poutre([cx - 0.6 + i * 0.5, 2.5, cz], [cx - 0.4 + i * 0.5, 0.1, cz + 0.8], 0.08, COUL.boisSombre, M.mat);
  }
  // Les fagots de roseaux contre les murs nord et ouest (le camouflage)
  for (let i = 0; i < 9; i++) {
    const t = (i + 0.5) / 9;
    const nord = i < 6;
    const x = nord ? X1 + t * 1.5 * (X2 - X1) : X1 - 0.3;
    const z = nord ? Z1 - 0.3 : Z1 + (t - 0.66) * 3 * (Z2 - Z1);
    c.poser(geoCyl(0.15, 0.22, 2.2, 6), M.mat, c.hasard() < 0.5 ? COUL.roseauSec : 0xa29a62, { x, y: 0.4, z, rx: nord ? 0.18 : 0, rz: nord ? 0 : -0.18 }, { crasse: false, nuance: 0.08 });
  }
  // Dedans : deux lits de camp, le banc du guet sous l'affût, le réchaud, la lanterne, les appelants sur l'étagère
  litDeCamp(c, X1 + 0.5, cz + 0.15, PI / 2, n === 1 ? 0x6a5a4a : 0x4f5a6a);
  if (n === 1) litDeCamp(c, X2 - 0.5, cz + 0.2, PI / 2, 0x5a6a4a);
  c.boite(X2 - X1 - 1.5, 0.05, 0.36, COUL.boisGris, { x: cx, y: 0.45, z: Z1 + 0.35 }, M.planches);
  for (const s of [-1, 1]) c.boite(0.06, 0.45, 0.3, COUL.boisSombre, { x: cx + s * (X2 - X1 - 1.7) / 2, y: 0.22, z: Z1 + 0.35 }, M.mat);
  rechaud(c, X2 - 0.45, Z2 - 0.45, n === 2);
  c.boite(1.1, 0.03, 0.25, COUL.boisGris, { x: cx, y: 1.55, z: Z1 + 0.22 }, M.mat);
  for (let i = 0; i < 3; i++) appelant(c, cx - 0.35 + i * 0.35, 1.6, Z1 + 0.22, 0.1 * i, i === 1 ? 0x7a6a50 : 0x5a4a38);
  if (n === 1) {
    lanterne(c, cx + 0.5, 0.48, Z1 + 0.35);
    b.lumiere(cx + 0.5, 0.9, Z1 + 0.6, 0xffc070, 4, 7, "lanterne allumée dans la hutte de chasse");
  } else {
    b.lumiere(X2 - 0.45, 0.6, Z2 - 0.45, 0xff8a3d, 2.5, 4, "braises du réchaud dans la seconde hutte");
    panneau(c, R.appli, { x: X1 + 0.11, y: 1.45, z: cz - 0.4, ry: PI / 2 }, 0.5, 0.2, M.panneaux);
  }
  jonchee(c, X1 + 0.3, Z1 + 0.3, X2 - 0.3, Z2 - 0.3, 10, [0x9c8a5a, 0x7d6143, 0xb5a46e]);
  // La pancarte de la hutte « connectée », à l'entrée du platelage
  piquet(c, R.hutte, xp + 1.1, Z2 + 1.1, 0.1, 1.3, 0.32, 1.15);
  // La mare de hutte : les appelants qui flottent encore devant l'affût
  const A = aleatoire(n * 97);
  for (let i = 0; i < 9; i++) appelant(c, X1 - 1 + A() * (X2 - X1 + 2), Y_ETANG + 0.03, Z1 - 1.5 - A() * 4, A() * 6, A() < 0.3 ? 0x7a6a50 : 0x4f4232);
  // Un piquet de balisage de la mare, une nasse
  cylindre(c, M.mat, COUL.boisSombre, X2 + 1.2, -1.8, Z1 - 2.5, 0.06, 3.0, 5);
}

// ---------- Tronçon 3 : l'écluse et la maison de l'éclusier ----------

const zPorte = (x, zHeel, zMitre) => (x < 22 ? zHeel + ((x - 19.02) / 2.98) * (zMitre - zHeel) : zHeel + ((24.98 - x) / 2.98) * (zMitre - zHeel));

/** Une porte d'écluse : deux vantaux busqués (pointe vers l'amont, −z), de 19 à 25, du fond à y = 0,15. */
function porteEcluse(ctx, zHeel, zMitre, passerelle) {
  const { c } = ctx;
  const vantaux = [[[19.02, zHeel], [22, zMitre]], [[24.98, zHeel], [22, zMitre]]];
  vantaux.forEach(([a, bb], iv) => {
    boiteEntre(c, a[0], a[1], bb[0], bb[1], Y_FOND, 0.15 - Y_FOND, 0.34, 0x4a3c30, M.planches, { nuance: 0.03 });
    // Les ferrures et les bordages qui suintent
    for (const y of [-3.0, -2.1, -1.2, -0.4]) boiteEntre(c, a[0], a[1] + 0.18, bb[0], bb[1] + 0.18, y, 0.1, 0.03, 0x3a3532, M.metal, { crasse: false });
    boiteEntre(c, a[0], a[1] + 0.19, bb[0], bb[1] + 0.19, Y_FOND, 2.0, 0.02, 0x3f4a3a, M.mat, { crasse: false });
    if (!passerelle) return;
    const L = Math.hypot(bb[0] - a[0], bb[1] - a[1]);
    const dx = (bb[0] - a[0]) / L;
    const dz = (bb[1] - a[1]) / L;
    const nx = -dz, nz = dx;
    const garde = passerelle === "entiere" ? 1 : 0.5;
    const fin = [a[0] + (bb[0] - a[0]) * garde, a[1] + (bb[1] - a[1]) * garde];
    boiteEntre(c, a[0], a[1], fin[0], fin[1], 0.15, 0.06, 0.95, COUL.planche, M.planches, { nuance: 0.03 });
    for (const s of [-1, 1]) {
      const o = s * 0.47;
      const n = Math.round(L * garde / 0.75);
      for (let i = 0; i <= n; i++) {
        const t = (i / n) * L * garde;
        c.boite(0.06, 0.95, 0.06, COUL.acier, { x: a[0] + dx * t + nx * o, y: 0.21 + 0.475, z: a[1] + dz * t + nz * o }, M.metal);
      }
      for (const y of [1.12, 0.66]) {
        if (passerelle === "cassee" && s === 1 && y > 1) {
          // La main courante tordue pend vers le fond
          planche(c, [a[0] + nx * o, y, a[1] + nz * o], [fin[0] + nx * o + 0.2, y - 1.1, fin[1] + nz * o + 0.4], 0.05, 0.05, COUL.acier, M.metal);
          continue;
        }
        boiteEntre(c, a[0] + nx * o, a[1] + nz * o, fin[0] + nx * o, fin[1] + nz * o, y, 0.05, 0.05, iv ? 0x6f767a : 0x7a6f66, M.metal);
      }
    }
    // Le cric de vanne : un fût de fonte, une roue, la crémaillère qui plonge
    const t = L * 0.3;
    const px = a[0] + dx * t - nx * 0.62;
    const pz = a[1] + dz * t - nz * 0.62;
    c.boite(0.22, 1.0, 0.22, COUL.fonte, { x: px, y: 0.15 + 0.5, z: pz }, M.metal);
    c.poser(geoCyl(0.26, 0.26, 0.05, 10), M.metal, 0x5a5250, { x: px, y: 1.2, z: pz });
    c.boite(0.08, 2.2, 0.08, COUL.rouille, { x: px, y: -0.6, z: pz }, M.metal);
  });
}

export function ecluse(ctx) {
  if (!ctx.ici(22)) return;
  const { c, b, u } = ctx;
  // Les bajoyers de pierre, leur couronnement de granit, la trace de l'eau et des algues
  for (const [xa, xb2] of [[18, 19], [25, 26]]) c.pave(xa, Y_FOND - 0.3, -13, xb2, -0.06, 17, COUL.pierreEcluse, M.pierre, { nuance: 0.02 });
  c.pave(18.4, -0.06, -13, 19.12, 0.1, 17, 0xb0aca2, M.pierre, { crasse: false });
  c.pave(24.88, -0.06, -13, 25.6, 0.1, 17, 0xb0aca2, M.pierre, { crasse: false });
  for (const x of [19.012, 24.988]) {
    const e = x < 22 ? 1 : -1;
    c.pave(x, Y_FOND, -13, x + e * 0.02, -1.15, 17, 0x55604a, M.pierre, { crasse: false });
    c.pave(x, -1.15, -13, x + e * 0.02, -0.9, 17, 0x6a6a52, M.pierre, { crasse: false });
  }
  // Le fond de la chambre vide : vase, flaques, pneus, branches, un frigo, une annexe retournée
  c.pave(19, Y_FOND - 0.3, -13, 25, Y_FOND, 17, COUL.boue, M.mat, { crasse: false });
  for (const [x, z, r] of [[21, 7, 1.4], [23.4, 3.5, 0.8], [22, 11.6, 1.1], [20.2, 1.6, 0.7]]) flaque(c, x, z, r, Y_FOND + 0.02);
  for (let i = 0; i < 8; i++) c.poser(BOULE, M.mat, i % 2 ? COUL.boueSombre : COUL.vase, { x: c.entre(19.4, 24.6), y: Y_FOND, z: c.entre(1, 12), ry: c.hasard() * 3, e: [c.entre(0.4, 1), 0.15, c.entre(0.4, 0.9)] }, { crasse: false });
  const pneu = new THREE.TorusGeometry(0.32, 0.12, 4, 9);
  for (const [x, z] of [[20, 4.5], [24, 8.2], [23.6, 8.6]]) c.poser(pneu, M.mat, 0x252525, { x, y: Y_FOND + 0.1, z, rx: PI / 2 + c.entre(-0.2, 0.2) }, { crasse: false });
  pneu.dispose();
  for (let i = 0; i < 4; i++) c.tube([c.entre(19.5, 24.5), Y_FOND + 0.1, c.entre(2, 11)], [c.entre(19.5, 24.5), Y_FOND + 0.2, c.entre(2, 11)], 0.06, 0x4f463a, M.mat, 4);
  c.boite(0.7, 1.6, 0.65, 0xcfcac0, { x: 23.8, y: Y_FOND + 0.3, z: 5.6, rx: 1.3, rz: 0.2 }, M.lisse);
  coque(c, 2.6, 1.1, 0.45, 0x9a5a40, { x: 20.6, y: Y_FOND + 0.55, z: 9.5, ry: 0.5, rz: PI - 0.15 });
  for (let i = 0; i < 3; i++) c.boite(1.8, 0.05, 0.3, COUL.planche, { x: 21.5 + i * 0.4, y: Y_FOND + 0.08 + i * 0.05, z: 11.3 - i * 0.3, ry: 0.3 + i * 0.7 }, M.planches);
  // Les portes : amont (la passerelle qu'on traverse, goulet), aval (passerelle effondrée)
  porteEcluse(ctx, 0.28, -0.32, "entiere");
  porteEcluse(ctx, 13.25, 12.65, "cassee");
  // L'étang fuit à travers les portes amont, le canal suinte par les portes aval
  for (const [x, w, y1] of [[20.5, 0.18, -1.35], [22, 0.32, -1.25], [23.7, 0.14, -1.6]]) {
    const z0 = zPorte(x, 0.28, -0.32) + 0.2;
    lame(c, [x - w, z0], [x + w, z0], y1, Y_FOND + 0.02, [0, 0.45]);
    const pe = [[x - 0.6, Y_FOND + 0.04, z0 + 0.1], [x - 0.6, Y_FOND + 0.04, z0 + 1.2], [x + 0.6, Y_FOND + 0.04, z0 + 1.2], [x + 0.6, Y_FOND + 0.04, z0 + 0.1]];
    quad(c, M.ecume, pe, pe.map(([xx, , zz]) => [xx / 1.5, zz / 1.5]), 0xffffff);
  }
  lame(c, [21.85, zPorte(21.9, 13.25, 12.65) - 0.2], [22.15, zPorte(21.9, 13.25, 12.65) - 0.2], -1.8, Y_FOND + 0.02, [0, -0.3]);
  // Les échelles de fer scellées dans les bajoyers
  for (const [x, z, e] of [[19.06, 6, 1], [24.94, 9.5, -1]]) {
    for (const dz of [-0.2, 0.2]) c.boite(0.05, -Y_FOND + 0.5, 0.05, COUL.rouille, { x: x + e * 0.06, y: (Y_FOND + 0.5) / 2, z: z + dz }, M.metal);
    for (let y = Y_FOND + 0.3; y < 0; y += 0.32) c.boite(0.04, 0.04, 0.4, COUL.rouille, { x: x + e * 0.06, y, z }, M.metal);
  }
  // Les bittes d'amarrage, la bouée, les garde-corps (des travées manquent)
  for (const [x, z] of [[17.4, -8], [17.4, 8], [26.6, -8], [26.6, 6]]) {
    cylindre(c, M.metal, COUL.fonte, x, 0, z, 0.17, 0.5, 8);
    cylindre(c, M.metal, COUL.fonte, x, 0.5, z, 0.24, 0.08, 8);
  }
  c.boite(0.1, 1.5, 0.1, COUL.boisSombre, { x: 17.6, y: 0.75, z: -5 }, M.mat);
  c.poser(new THREE.TorusGeometry(0.34, 0.09, 4, 10), M.satin, 0xc07a50, { x: 17.6, y: 1.15, z: -4.92 }, { crasse: false });
  for (const [x, z1, z2] of [[18.3, 1.3, 12.1], [25.7, 1.3, 12.1], [18.3, -10.5, -1.0], [25.7, -10.5, -1.0]]) {
    for (let z = z1; z < z2 - 0.1; z += 1.5) {
      const ze = Math.min(z2, z + 1.5);
      if (hache(Math.round(z * 3 + x), 61) < 0.3 * u) continue;
      c.boite(0.06, 1.0, 0.06, COUL.acier, { x, y: 0.5, z }, M.metal);
      for (const y of [0.98, 0.55]) boiteEntre(c, x, z, x, ze, y, 0.04, 0.04, 0x7a6f66, M.metal, {}, 0);
    }
  }
  // Les bras de manœuvre des portes, couchés sur les terre-pleins
  for (const [a, bb] of [[[19.3, 0.75], [15.4, 5.6]], [[24.7, 0.75], [28.6, 5.6]], [[19.3, 12.8], [15.0, 9.7]], [[24.7, 12.8], [28.7, 10.1]]]) {
    boiteEntre(c, a[0], a[1], bb[0], bb[1], 0.72, 0.32, 0.3, 0x5a4a3a, M.planches, { nuance: 0.04 }, 0.2);
    c.boite(0.25, 0.72, 0.25, 0x4a3c30, { x: bb[0], y: 0.36, z: bb[1] }, M.mat);
    b.obstacle(a[0], a[1], bb[0], bb[1], "bras de manœuvre de la porte d'écluse");
  }
  // Le treuil des vannes, en fonte, sur le terre-plein est
  c.repere({ x: 27.5, y: 0, z: -2.7 }, () => {
    c.boite(1.4, 0.2, 1.0, COUL.pierre, { y: 0.1 }, M.pierre);
    for (const s of [-1, 1]) c.boite(0.1, 1.0, 0.8, COUL.fonte, { x: s * 0.45, y: 0.7 }, M.metal);
    c.poser(geoCyl(0.22, 0.22, 0.8, 10), M.metal, 0x4a4644, { y: 0.85, rz: PI / 2 });
    c.poser(geoCyl(0.46, 0.46, 0.06, 14), M.metal, 0x5a4a40, { x: 0.55, y: 0.85, rz: PI / 2 });
    c.boite(0.05, 0.5, 0.05, COUL.fonte, { x: 0.62, y: 0.65 }, M.metal);
    c.boite(0.05, 0.05, 0.3, 0x2b2b29, { x: 0.62, y: 0.42, z: 0.12 }, M.metal);
    c.poser(new THREE.TorusGeometry(0.25, 0.05, 3, 8), M.metal, COUL.rouille, { x: -0.3, y: 0.25, z: 0.6, rx: PI / 2 }, { crasse: false });
  });
  contour(b, 27.5, -2.7, 1.4, 1.0, 0, "treuil des vannes");
  // Les pavés des terre-pleins, à la place de la route
  c.pave(12.6, 0, -2.7, 18.4, 0.035, 2.7, 0x8e8a80, M.pierre, { crasse: false });
  c.pave(25.6, 0, -2.7, 31, 0.035, 2.7, 0x8e8a80, M.pierre, { crasse: false });
  // La plaque de l'écluse, à l'approche ouest
  pancarte(c, R.ecluse, 13.6, 3.7, 0.1, 2.8, 0.52, 1.5);
  // La chicane des survivants : sacs de sable et palettes qui ne laissent qu'un passage d'homme vers la passerelle
  sacs(ctx, [16.8, -2.9], [16.8, -0.8], 3, "chicane de sacs de sable");
  sacs(ctx, [16.8, 0.8], [16.8, 2.9], 3, "chicane de sacs de sable");
  palette(c, 14.4, 0, -1.6, PI / 2 - 0.2, true);
  palette(c, 14.6, 0, 1.9, PI / 2 + 0.15, true);
  b.obstacle(14.4, -2.2, 14.4, -1.0, "palette dressée");
  b.obstacle(14.6, 1.3, 14.6, 2.5, "palette dressée");
  piquet(c, R.unALaFois, 17.5, 1.4, -0.5, 1.3, 0.32, 1.3);
}

export function maisonEclusier(ctx) {
  if (!ctx.ici(36)) return;
  const { c, b, u, bris } = ctx;
  const k = b.couche("maison de l'éclusier", { x: 36.75, z: 9.25, l: 14.8, p: 7.8 }, 1.05, 6.2);
  const E = { couleur: COUL.enduit, mat: M.enduit };
  const fen = (o) => ({ type: "fenetre", bris, cadre: 0xe6e2d8, volet: c.hasard() < 0.6 ? "ouvert" : "pendu", couleurVolet: COUL.bleuVolet, croisillons: 1, traverses: 2, ...o });
  mur(c, [39, 6], [30, 6], { h: 2.9, ep: 0.4, ...E, batiment: b, ouvertures: [{ u: 7, l: 1.0, bas: 0, haut: 2.15, type: "porte", vantail: "entrouvert", couleurPorte: COUL.bleuVolet }, fen({ u: 2, l: 1.1, bas: 1.0, haut: 2.1 })] });
  mur(c, [30, 6], [30, 12.5], { h: 2.9, ep: 0.4, ...E, batiment: b, ouvertures: [fen({ u: 3.2, l: 1.0, bas: 1.0, haut: 2.05 })] });
  murDouble(ctx, k, [30, 12.5], [39, 12.5], { h: 2.9, ep: 0.4, ...E, ouvertures: [{ u: 1.6, l: 0.95, bas: 0, haut: 2.15, type: "porte", vantail: "entrouvert", angle: 1.45, couleurPorte: COUL.bleuVolet }, fen({ u: 3.6, l: 1.1, bas: 1.05, haut: 2.1 }), fen({ u: 6.6, l: 1.2, bas: 1.05, haut: 2.1 })] });
  murDouble(ctx, k, [39, 12.5], [39, 6], { h: 2.9, ep: 0.4, ...E, ouvertures: [{ u: 3, l: 0.9, bas: 0, haut: 2.1, type: "porte" }] });
  murDouble(ctx, k, [34.6, 12.3], [34.6, 6.2], { h: 2.9, ep: 0.15, couleur: 0xe2dccb, mat: M.enduit, ouvertures: [{ u: 3.2, l: 0.9, bas: 0, haut: 2.1, type: "porte" }] });
  // L'atelier en appentis, à l'est
  murDouble(ctx, k, [39, 12.5], [43.5, 12.5], { h: 2.5, ep: 0.3, ...E, ouvertures: [fen({ u: 2.2, l: 1.0, bas: 1.05, haut: 1.9, volet: null })] });
  murDouble(ctx, k, [43.5, 12.5], [43.5, 7], { h: 2.5, ep: 0.3, ...E, ouvertures: [{ u: 2.8, l: 1.1, bas: 0, haut: 2.1, type: "porte", vantail: "tombe", couleurPorte: 0x5a5a50 }] });
  mur(c, [43.5, 7], [39, 7], { h: 2.5, ep: 0.3, ...E, batiment: b });
  // Les chaînes d'angle en pierre
  for (const [x, z] of [[30, 6], [39, 6], [30, 12.5], [39, 12.5]]) {
    for (let i = 0; i < 9; i++) {
      const y = 0.16 + i * 0.32;
      const long = i % 2 === 0;
      const ch = y > 1.05 && (z > 12 || x > 38) ? k : c;
      ch.boite(long ? 0.55 : 0.46, 0.3, long ? 0.46 : 0.55, 0xc9c0a8, { x: x + (x < 35 ? -0.02 : 0.02), y, z: z + (z < 9 ? -0.02 : 0.02) }, M.pierre, { nuance: 0.04 });
    }
  }
  // Le toit de tuiles, les pignons, la cheminée ; l'appentis de tôle
  toitDeuxPans(k, 34.5, 9.25, 9, 6.5, 2.9, 2.2, { couleur: COUL.tuile, mat: M.ardoise, debord: 0.45, trous: u > 0.5 ? [{ u: 2.2, v: 1, l: 1.8, p: 0.6 }] : [] });
  pignonX(k, M.enduit, COUL.enduit, 30, 9.25, 6.9, 2.9, 2.2, 0.4);
  pignonX(k, M.enduit, COUL.enduit, 39, 9.25, 6.9, 2.9, 2.2, 0.4);
  k.pave(31.1, 3.4, 8.8, 31.8, 5.9, 9.5, COUL.brique, M.brique);
  k.pave(31.0, 5.9, 8.7, 31.9, 6.02, 9.6, 0x6f6a62, M.mat);
  for (let i = 0; i < 7; i++) {
    if (hache(i, 91) < 0.2 * u) continue;
    const z = 6.6 + i * 0.9;
    planche(k, [39.1, 2.62, z], [44.0, 2.28, z], 0.04, 0.92, i % 2 ? COUL.rouille : 0x7d6a58, M.tole, [0, 1, 0], { crasse: false, nuance: 0.05 });
  }
  // Les sols : tomettes de la cuisine, parquet de la chambre, terre battue de l'atelier
  c.pave(30.2, 0, 6.2, 34.53, 0.025, 12.3, 0xb4775e, M.carrelage, { crasse: false });
  c.pave(34.67, 0, 6.2, 38.8, 0.025, 12.3, 0xc0a080, M.parquet, { crasse: false });
  c.pave(39.15, 0, 7.15, 43.35, 0.02, 12.35, 0x857e70, M.mat, { crasse: false });
  // La cuisine : cuisinière à bois, buffet, évier de pierre, table et sa lampe, le calendrier Watty
  c.boite(0.9, 0.85, 0.65, COUL.fonte, { x: 30.75, y: 0.43, z: 7.0 }, M.metal);
  c.boite(0.95, 0.04, 0.7, 0x8a8f90, { x: 30.75, y: 0.87, z: 7.0 }, M.metal);
  c.tube([30.55, 0.87, 6.8], [30.55, 2.85, 6.8], 0.07, 0x2b2b29, M.metal, 6);
  c.boite(1.4, 1.9, 0.45, 0x7a6248, { x: 33.1, y: 0.95, z: 6.45 }, M.satin);
  c.boite(1.3, 0.04, 0.42, 0x6a5240, { x: 33.1, y: 1.0, z: 6.5 }, M.satin);
  for (let i = 0; i < 5; i++) c.boite(0.12, 0.18, 0.12, [0xd8d0b8, 0x8a9a6a, 0xa8705a][i % 3], { x: 32.6 + i * 0.25, y: 1.12, z: 6.5 }, M.lisse, { crasse: false });
  c.boite(0.6, 0.85, 1.0, 0xa9a49a, { x: 30.5, y: 0.43, z: 10.8 }, M.pierre);
  c.boite(0.45, 0.12, 0.7, 0x6f6a62, { x: 30.5, y: 0.82, z: 10.8 }, M.pierre);
  table(c, 32.4, 9.6, 1.4, 0.85, 0.05, COUL.bois);
  chaise(c, 32.0, 10.4, PI);
  chaise(c, 33.3, 9.6, -PI / 2);
  chaise(c, 31.5, 8.8, 0.4, true);
  lanterne(c, 32.5, 0.76, 9.5);
  c.boite(0.3, 0.1, 0.22, 0xd8d0b8, { x: 32.0, y: 0.81, z: 9.8 }, M.lisse);
  panneau(c, R.calendrier, { x: 31.6, y: 1.6, z: 6.215 }, 0.38, 0.57);
  etagere(c, 34.37, 11.2, -PI / 2, 1.3, 1.6, [0xd8d0b8, 0x8a9a6a, 0xa8705a, 0x5a6a7a], 0.65);
  jonchee(c, 30.4, 6.4, 34.3, 12.1, 18, [0xd8d0b8, 0x9c8a5a, 0x6f5a3a]);
  // La chambre : le lit et son édredon, l'armoire entrouverte, le chevet, le tapis
  c.repere({ x: 37.0, y: 0, z: 11.55 }, () => {
    c.boite(2.05, 0.35, 1.4, 0x6a4a34, { y: 0.3 }, M.satin);
    c.boite(1.95, 0.18, 1.32, 0xd8d0c0, { y: 0.55 }, M.toile);
    c.boite(1.3, 0.1, 1.38, 0xa86a6a, { x: -0.3, y: 0.66, ry: 0.06 }, M.toile, { nuance: 0.05 });
    c.boite(0.4, 0.12, 0.9, 0xe8e0d0, { x: 0.75, y: 0.7 }, M.toile);
    c.boite(0.08, 1.1, 1.45, 0x5a3e2c, { x: 1.04, y: 0.55 }, M.satin);
  });
  c.boite(1.0, 2.0, 0.55, 0x6a4a34, { x: 38.3, y: 1.0, z: 6.75 }, M.satin);
  c.boite(0.5, 1.9, 0.04, 0x5f4230, { x: 37.55, y: 1.0, z: 7.25, ry: -0.9 }, M.satin);
  c.boite(0.45, 0.55, 0.4, 0x6a4a34, { x: 38.45, y: 0.28, z: 10.4 }, M.satin);
  c.boite(1.6, 0.012, 1.0, 0x8a4a40, { x: 36.4, y: 0.03, z: 9.6, ry: 0.1 }, M.toile, { crasse: false });
  chaise(c, 35.4, 7.2, 0.5);
  c.boite(0.32, 0.24, 0.03, 0x3a2a20, { x: 36.2, y: 1.55, z: 6.215 }, M.satin);
  jonchee(c, 34.8, 6.4, 38.7, 12.1, 12, [0xd8d0b8, 0x9c8a5a]);
  // L'atelier : l'établi et son étau, les engrenages de rechange, les fûts d'huile, les manivelles
  c.boite(3.1, 0.07, 0.7, 0x6a5a48, { x: 41.1, y: 0.9, z: 7.55 }, M.mat);
  for (const x of [39.7, 42.5]) for (const z of [7.3, 7.8]) c.boite(0.08, 0.88, 0.08, 0x5a4a3a, { x, y: 0.44, z }, M.mat);
  c.boite(0.22, 0.2, 0.18, 0x4a5a6a, { x: 42.3, y: 1.04, z: 7.6 }, M.metal);
  c.boite(2.6, 1.0, 0.04, 0x5a4a3a, { x: 41.1, y: 1.65, z: 7.18 }, M.mat);
  for (let i = 0; i < 9; i++) c.boite(0.05, c.entre(0.25, 0.55), 0.04, i % 3 ? 0x6f767a : COUL.bois, { x: 40.0 + i * 0.27, y: 1.65, z: 7.22, rz: c.entre(-0.2, 0.2) }, M.metal);
  c.poser(geoCyl(0.62, 0.62, 0.1, 12), M.metal, COUL.rouille, { x: 43.15, y: 0.64, z: 11.3, rx: PI / 2 - 0.1, ry: PI / 2 });
  c.poser(geoCyl(0.35, 0.35, 0.08, 10), M.metal, 0x5a5250, { x: 42.9, y: 0.36, z: 10.6, rz: 0.2, rx: PI / 2 });
  for (const [x, z] of [[42.85, 8.1], [42.3, 8.35]]) cylindre(c, M.tole, x > 42.5 ? 0x4f6a5a : COUL.rouille, x, 0, z, 0.3, 0.88, 10);
  for (let i = 0; i < 3; i++) c.boite(0.05, 0.05, 0.45, 0x2b2b29, { x: 39.5 + i * 0.3, y: 1.6, z: 12.32, ry: 0.2 }, M.metal);
  c.poser(new THREE.TorusGeometry(0.28, 0.06, 3, 9), M.metal, COUL.rouille, { x: 40.0, y: 0.06, z: 11.6, rx: PI / 2 }, { crasse: false });
  debris(c, 39.4, 8.3, 43.2, 12.2, 10, [0x6f767a, 0x8a7a5a, 0x4a4a44]);
  // Le jardin : le feu des survivants, les bancs de bûches, le potager, l'étendoir, le tonneau d'eau, le bois sec
  const fx = 36.4, fz = 15.2;
  feu(c, fx, fz, 0.55);
  for (let i = 0; i < 3; i++) c.tube([fx + Math.cos(i * 2.1) * 0.75, 0, fz + Math.sin(i * 2.1) * 0.75], [fx, 1.35, fz], 0.025, COUL.fonte, M.metal, 4);
  cylindre(c, M.metal, COUL.fonte, fx, 0.55, fz, 0.2, 0.28, 8);
  for (const [x, z, ry] of [[35.0, 15.9, 0.4], [37.9, 14.6, -0.5], [36.7, 16.6, 0.1]]) c.tube([x - Math.cos(ry) * 0.6, 0.2, z + Math.sin(ry) * 0.6], [x + Math.cos(ry) * 0.6, 0.2, z - Math.sin(ry) * 0.6], 0.2, 0x6a5440, M.mat, 7);
  for (let r = 0; r < 3; r++) {
    c.pave(40.6, 0, 13.9 + r * 0.95, 44.2, 0.18, 14.45 + r * 0.95, 0x4f4232, M.mat, { crasse: false });
    for (let i = 0; i < 6; i++) c.poser(BOULE, M.mat, u > 0.7 && i % 2 ? 0x8a8a4a : 0x6f8f4a, { x: 40.9 + i * 0.58, y: 0.3, z: 14.17 + r * 0.95, e: [0.2, 0.15, 0.2] }, { crasse: false, nuance: 0.08 });
  }
  for (const [x, z] of [[30.8, 13.4], [34.2, 16.8]]) c.boite(0.08, 1.9, 0.08, COUL.boisSombre, { x, y: 0.95, z }, M.mat);
  c.tube([30.8, 1.8, 13.4], [34.2, 1.75, 16.8], 0.012, 0x9a8a62, M.mat, 3);
  for (let i = 0; i < 3; i++) c.boite(0.6, 0.7, 0.02, [0x8a4a40, 0xd8d0c0, 0x4f6a7a][i], { x: 31.6 + i * 0.9, y: 1.4, z: 14.2 + i * 0.9, ry: -PI / 4 }, M.toile, { crasse: false });
  cylindre(c, M.mat, 0x5a4a3a, 44.0, 0, 12.9, 0.38, 0.95, 10);
  for (let i = 0; i < 12; i++) c.tube([39.6 + (i % 4) * 0.08, 0.12 + Math.floor(i / 4) * 0.2, 12.85], [41.0 + (i % 4) * 0.08, 0.12 + Math.floor(i / 4) * 0.2, 12.85], 0.09, 0x7a5a3c, M.mat, 5);
  b.obstacle(39.5, 12.85, 41.1, 12.85, "bois sec empilé");
  b.lumiere(fx, 0.7, fz, 0xff8a3d, 12, 11, "feu de survivants devant la maison de l'éclusier");
  b.lumiere(32.5, 1.0, 9.5, 0xffc070, 2.5, 6, "lampe à pétrole sur la table de la cuisine");
}

// ---------- Tronçon 4 : la station de pompage, le carrelet, la borne des vélos ----------

export function pompage(ctx) {
  if (!ctx.ici(62.5)) return;
  const { c, b, u, bris } = ctx;
  const k = b.couche("station de pompage", { x: 62.5, z: -11, l: 11, p: 7 }, 1.05, 9);
  const B = { couleur: COUL.brique, mat: M.brique };
  const H = 4.2;
  const ep = 0.45;
  const fen = (o) => ({ type: "fenetre", bris, cadre: 0x5a5f5a, croisillons: 2, traverses: 3, ...o });
  mur(c, [67.5, -14], [57.5, -14], { h: H, ep, ...B, batiment: b, ouvertures: [2, 5.5, 8.5].map((uu) => fen({ u: uu, l: 1.0, bas: 2.3, haut: 3.7 })) });
  mur(c, [57.5, -14], [57.5, -8], { h: H, ep, ...B, batiment: b, ouvertures: [fen({ u: 3, l: 1.0, bas: 2.3, haut: 3.7 })] });
  murDouble(ctx, k, [57.5, -8], [67.5, -8], { h: H, ep, ...B, ouvertures: [{ u: 3.2, l: 2.2, bas: 0, haut: 3.0, type: "porte", vantail: "entrouvert", angle: 1.5, couleurPorte: 0x4f6a5a }, fen({ u: 5.6, l: 1.0, bas: 1.05, haut: 3.4, traverses: 4 }), fen({ u: 8.3, l: 1.1, bas: 1.05, haut: 3.0 })] });
  murDouble(ctx, k, [67.5, -8], [67.5, -14], { h: H, ep, ...B, ouvertures: [{ u: 1.2, l: 0.9, bas: 0, haut: 2.15, type: "porte", vantail: "tombe", couleurPorte: 0x4f6a5a }, fen({ u: 3.9, l: 1.1, bas: 1.05, haut: 3.2 })] });
  murDouble(ctx, k, [64, -8.25], [64, -13.75], { h: H, ep: 0.25, couleur: 0xd8d0bc, mat: M.enduit, ouvertures: [{ u: 4.3, l: 0.9, bas: 0, haut: 2.1, type: "porte" }] });
  // La corniche de briques claires, les linteaux des fenêtres
  for (const [a, bb, ch] of [[[57.3, -7.75], [67.7, -7.75], k], [[67.75, -7.8], [67.75, -14.2], k], [[67.7, -14.25], [57.3, -14.25], c], [[57.25, -14.2], [57.25, -7.8], c]]) {
    boiteEntre(ch, a[0], a[1], bb[0], bb[1], H - 0.3, 0.3, 0.12, 0xb8806a, M.brique, { crasse: false }, 0.1);
  }
  for (const x of [63.1, 65.8]) k.boite(1.4, 0.3, 0.52, 0xc99a7a, { x, y: x < 64 ? 3.55 : 3.15, z: -8 }, M.brique);
  k.boite(2.6, 0.32, 0.52, 0xc99a7a, { x: 60.7, y: 3.16, z: -8 }, M.brique);
  // Le toit, les pignons, la cheminée du vieux diesel, le cartouche de pierre
  toitDeuxPans(k, 62.5, -11, 10, 6, H, 2.3, { couleur: 0x8a5545, mat: M.ardoise, debord: 0.5, trous: u > 0.4 ? [{ u: -2.4, v: 1, l: 2.4, p: 0.7 }] : [] });
  pignonX(k, M.brique, COUL.brique, 57.5, -11, 6.45, H, 2.3, 0.45);
  pignonX(k, M.brique, COUL.brique, 67.5, -11, 6.45, H, 2.3, 0.45);
  k.pave(65.9, 4.2, -13.4, 66.8, 8.6, -12.5, 0x7f4a38, M.brique);
  k.pave(65.75, 8.6, -13.55, 66.95, 8.8, -12.35, 0x6f6a62, M.mat);
  panneau(k, R.pompage, { x: 60.9, y: 3.75, z: -7.76 }, 3.6, 0.68);
  // Les sols : carreaux de la salle des pompes, linoléum de la salle de commande
  c.pave(57.75, 0, -13.78, 63.88, 0.025, -8.22, 0x9aa49a, M.carrelage, { crasse: false });
  c.pave(64.12, 0, -13.78, 67.28, 0.025, -8.22, 0x7a6a58, M.mat, { crasse: false });
  // La fosse d'aspiration sous ses caillebotis
  c.pave(58.2, 0.026, -13.6, 63.6, 0.04, -12.7, 0x1f2220, M.mat, { crasse: false });
  for (let x = 58.3; x < 63.6; x += 0.3) c.boite(0.04, 0.04, 0.9, 0x5a6066, { x, y: 0.06, z: -13.15 }, M.metal, { crasse: false });
  // Les deux pompes : socle, volute, moteur, aspiration qui plonge, refoulement qui file sous la digue
  for (const x of [59.6, 62.3]) {
    c.pave(x - 0.7, 0, -12.5, x + 0.7, 0.32, -10.1, 0x8f8c84, M.mat);
    c.poser(geoCyl(0.62, 0.62, 0.55, 12), M.satin, 0x4f6a5a, { x, y: 1.0, z: -11.95, rx: PI / 2 });
    c.poser(geoCyl(0.3, 0.3, 0.6, 10), M.satin, 0x4f6a5a, { x, y: 1.0, z: -11.4, rx: PI / 2 });
    c.boite(0.8, 0.75, 1.0, 0x4f6a5a, { x, y: 0.72, z: -10.65 }, M.satin);
    for (let i = 0; i < 4; i++) c.boite(0.84, 0.04, 0.9, 0x3f5a4a, { x, y: 0.5 + i * 0.15, z: -10.65 }, M.metal, { crasse: false });
    c.tube([x, 0.6, -12.15], [x, -0.6, -13.1], 0.24, 0x3f5a4a, M.satin, 8);
    c.tube([x, 1.55, -11.95], [x, 2.3, -11.95], 0.22, 0x3f5a4a, M.satin, 8);
    c.tube([x, 2.3, -11.95], [x, 2.3, -8.75], 0.22, 0x3f5a4a, M.satin, 8);
    c.tube([x, 2.3, -8.75], [x, -0.4, -8.75], 0.22, 0x3f5a4a, M.satin, 8);
    for (const z of [-11.2, -9.6]) c.poser(geoCyl(0.3, 0.3, 0.06, 10), M.metal, 0x3a4a40, { x, y: 2.3, z, rx: PI / 2 });
    c.poser(geoCyl(0.28, 0.28, 0.04, 10), M.metal, 0xa8473c, { x: x + 0.3, y: 2.3, z: -10.4, rz: PI / 2 });
  }
  // Le pont roulant et son crochet
  c.pave(57.8, 3.5, -11.15, 63.85, 3.72, -10.85, 0x5a6670, M.tole);
  c.tube([61.0, 3.5, -11], [61.0, 2.5, -11], 0.02, 0x3a3a36, M.metal, 3);
  c.boite(0.12, 0.25, 0.06, 0x3a3a36, { x: 61.0, y: 2.4, z: -11 }, M.metal);
  // La salle de commande : le tableau à cadrans, le bureau et son registre, la tablette WattyPompe, l'armoire
  c.boite(2.2, 1.9, 0.4, 0x56605a, { x: 65.7, y: 0.95, z: -13.5 }, M.tole);
  panneau(c, R.tableau, { x: 65.7, y: 1.45, z: -13.29 }, 1.8, 0.9);
  c.boite(0.6, 0.06, 1.2, 0x6a5a48, { x: 66.9, y: 0.75, z: -11.9 }, M.mat);
  for (const [dx, dz] of [[-0.25, -0.5], [0.25, -0.5], [-0.25, 0.5], [0.25, 0.5]]) c.boite(0.05, 0.74, 0.05, 0x5a4a3a, { x: 66.9 + dx, y: 0.37, z: -11.9 + dz }, M.mat);
  c.boite(0.3, 0.05, 0.4, 0x7a3a30, { x: 66.85, y: 0.8, z: -12.0, ry: 0.2 }, M.satin);
  chaise(c, 66.2, -11.7, PI / 2);
  panneau(c, R.wattypompe, { x: 64.14, y: 1.45, z: -10.0, ry: PI / 2 }, 0.52, 0.32);
  c.boite(0.9, 1.8, 0.45, 0x8a8f90, { x: 64.75, y: 0.9, z: -8.55 }, M.tole);
  jonchee(c, 57.9, -12.5, 63.7, -8.5, 16, [0xd8d0b8, 0x9c8a5a, 0x6f5a3a]);
  debris(c, 64.3, -13.5, 67.1, -8.5, 10, [0xd8d0b8, 0x6f767a]);
  // Dehors au nord : le parvis, la grille d'aspiration dans l'étang, les murs en aile, le minerai de fer des marais
  c.pave(58, 0, -16.3, 67, 0.04, -14.2, 0x8f8c84, M.mat, { crasse: false });
  for (const x of [58.8, 66.2]) c.pave(x - 0.2, -1.9, -18.4, x + 0.2, 0.15, -16.2, 0x8f8c84, M.mat);
  c.pave(58.6, 0.15, -16.95, 66.4, 0.35, -16.55, 0x5a6066, M.tole);
  for (let x = 59.1; x < 66.0; x += 0.16) c.boite(0.03, 2.0, 0.05, 0x4f5250, { x, y: -0.85, z: -16.75, rx: 0.12 }, M.metal, { crasse: false });
  c.repere({ x: 63.6, y: 0, z: -15.9, rz: 0.15 }, () => {
    c.boite(0.05, 2.2, 0.05, COUL.bois, { y: 1.1 }, M.mat);
    c.boite(0.6, 0.06, 0.08, COUL.rouille, { y: 0.05 }, M.metal);
  });
  for (let i = 0; i < 14; i++) c.poser(ROCHE, M.mat, i % 3 ? COUL.fer : 0x7a4a2a, { x: c.entre(59.5, 66), y: Y_ETANG - 0.12 + c.hasard() * 0.1, z: c.entre(-19.5, -17.3), ry: c.hasard() * 3, e: [c.entre(0.15, 0.4), 0.12, c.entre(0.15, 0.35)] }, { nuance: 0.1, crasse: false });
  for (const [x, z, r] of [[61, -18.4, 1.4], [64.5, -19.2, 1.1]]) {
    const pts = [];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * PI * 2;
      const rr = r * c.entre(0.6, 1.1);
      pts.push(new THREE.Vector2(Math.cos(a) * rr, Math.sin(a) * rr));
    }
    const g = new THREE.ShapeGeometry(new THREE.Shape(pts)).rotateX(-PI / 2);
    c.poser(g, M.mat, 0xa0643a, { x, y: Y_ETANG + 0.015, z }, { crasse: false, nuance: 0.05 });
    g.dispose();
  }
  // Au sud, sous la digue : la tête de rejet en béton, les deux buses et leurs clapets rouillés
  const zr = zc(62) + HD + 0.5;
  c.pave(59.8, -2.2, zr, 64.6, -0.08, zr + 0.45, 0x8f8c84, M.mat);
  for (const x of [61, 63.4]) {
    c.tube([x, -1.05, zr + 0.2], [x, -1.05, zr + 1.0], 0.4, 0x3a3a36, M.tole, 10);
    c.poser(geoCyl(0.44, 0.44, 0.05, 10), M.tole, COUL.rouille, { x, y: -1.1, z: zr + 1.06, rx: PI / 2 - 0.25 });
    c.boite(0.08, 0.9, 0.02, COUL.rouille, { x: x + 0.2, y: -1.8, z: zr + 0.46 }, M.mat, { crasse: false });
  }
  lame(c, [62.9, zr + 1.08], [63.2, zr + 1.08], -1.25, Y_CANAL, [0, 0.12]);
}

export function cabane(ctx) {
  if (!ctx.ici(82)) return;
  const { c, b, u, bris } = ctx;
  plancher(ctx, PLANCHERS.pontonCab, { manque: 0.12 * u, yFond: -2.8 });
  plancher(ctx, PLANCHERS.cabane, { yFond: -2.8 });
  const k = b.couche("cabane du pêcheur", { x: 80.2, z: 13.3, l: 5.4, p: 4.6 }, 1.05, 3.6);
  const P = { couleur: 0x6f6658, mat: M.planches };
  mur(c, [82.4, 11.5], [78, 11.5], { h: 2.4, ep: 0.12, ...P, batiment: b, ouvertures: [{ u: 1.4, l: 0.9, bas: 0, haut: 2.1, type: "porte", vantail: "entrouvert", angle: 1.3, couleurPorte: 0x4f6a7a }] });
  mur(c, [78, 11.5], [78, 15.1], { h: 2.4, ep: 0.12, ...P, batiment: b, ouvertures: [{ u: 1.8, l: 0.7, bas: 1.1, haut: 1.7, type: "fenetre", bris, cadre: 0x4f6a7a }] });
  murDouble(ctx, k, [78, 15.1], [82.4, 15.1], { h: 2.4, ep: 0.12, ...P, ouvertures: [{ u: 2.2, l: 0.9, bas: 1.05, haut: 1.8, type: "fenetre", bris, cadre: 0x4f6a7a, volet: "pendu", couleurVolet: 0x4f6a7a }] });
  murDouble(ctx, k, [82.4, 15.1], [82.4, 11.5], { h: 2.4, ep: 0.12, ...P, ouvertures: [{ u: 1.8, l: 0.85, bas: 0, haut: 2.1, type: "porte" }] });
  for (let i = 0; i < 6; i++) {
    const x = 77.6 + (i + 0.5) * (5.2 / 6);
    planche(k, [x, 2.75, 11.1], [x, 2.38, 15.6], 5.2 / 6 + 0.02, 0.04, i % 2 ? 0x8a6a50 : COUL.tole, M.tole, [1, 0, 0], { crasse: false, nuance: 0.05 });
  }
  k.tube([78.6, 2.5, 12.2], [78.6, 3.5, 12.2], 0.07, 0x2b2b29, M.metal, 6);
  // Dedans : la couchette, le tas de filets et de flotteurs, le poêle, les seaux
  c.boite(0.8, 0.45, 2.0, 0x6a5a48, { x: 78.55, y: 0.23, z: 13.5 }, M.planches);
  c.boite(0.7, 0.1, 1.9, 0x5a6a5a, { x: 78.55, y: 0.5, z: 13.5 }, M.toile);
  c.poser(BOULE, M.toile, 0x6a6a52, { x: 81.4, y: 0.25, z: 14.3, e: [0.7, 0.35, 0.55] }, { nuance: 0.06 });
  for (let i = 0; i < 6; i++) c.poser(BOULE, M.satin, 0xc0703a, { x: 81.0 + c.entre(0, 0.9), y: 0.5, z: 14 + c.entre(0, 0.6), e: 0.08 }, { crasse: false });
  cylindre(c, M.metal, COUL.fonte, 78.6, 0, 12.2, 0.25, 0.6, 8);
  for (const [x, z] of [[81.8, 12.0], [81.5, 12.3]]) cylindre(c, M.tole, 0x7d8689, x, 0, z, 0.16, 0.32, 8);
  // Le séchoir à poissons sur la coursive sud, le fumoir
  for (const x of [78.3, 81.9]) c.boite(0.07, 1.6, 0.07, COUL.boisSombre, { x, y: 0.8, z: 16.2 }, M.mat);
  c.tube([78.3, 1.5, 16.2], [81.9, 1.5, 16.2], 0.012, 0x9a8a62, M.mat, 3);
  for (let i = 0; i < 8; i++) c.boite(0.05, 0.3, 0.1, 0xa9b0a8, { x: 78.7 + i * 0.42, y: 1.32, z: 16.2, rz: c.entre(-0.1, 0.1) }, M.satin, { crasse: false });
  cylindre(c, M.tole, COUL.rouille, 85.9, 0, 11.6, 0.3, 0.85, 8);
  c.tube([85.9, 0.85, 11.6], [85.9, 1.5, 11.6], 0.06, 0x2b2b29, M.metal, 5);
  // Le carrelet : le poteau-fourche, la perche, le treuil, la croix de perches pliées et le grand filet carré
  const A = [84.6, 0.9, 14.9];
  const T = [89.6, 3.6, 20.1];
  c.tube([85.8, 0, 16.15], [85.8, 1.5, 16.15], 0.13, COUL.boisSombre, M.mat, 6);
  for (const s of [-1, 1]) c.tube([85.8, 1.45, 16.15], [85.8 + s * 0.15, 1.75, 16.15 - s * 0.15], 0.05, COUL.boisSombre, M.mat, 4);
  c.tube(A, T, 0.09, COUL.boisGris, M.mat, 6);
  c.boite(0.5, 0.4, 0.5, 0x6a6a62, { x: A[0], y: A[1] - 0.35, z: A[2] }, M.pierre);
  c.repere({ x: 84.3, y: 0, z: 13.4 }, () => {
    for (const s of [-1, 1]) c.boite(0.08, 0.8, 0.5, COUL.boisSombre, { x: s * 0.3, y: 0.4 }, M.mat);
    c.poser(geoCyl(0.16, 0.16, 0.56, 8), M.mat, 0x7a6a50, { y: 0.65, rz: PI / 2 });
    c.boite(0.05, 0.35, 0.05, COUL.fonte, { x: 0.38, y: 0.55, z: 0.12 }, M.metal);
  });
  c.tube([84.3, 0.7, 13.4], T, 0.012, 0x9a8a62, M.mat, 3);
  const coins = [[87.1, 17.6], [92.1, 17.6], [92.1, 22.6], [87.1, 22.6]];
  for (const [x, z] of coins) {
    let prec = T;
    for (let i = 1; i <= 5; i++) {
      const t = i / 5;
      const p = [T[0] + (x - T[0]) * t, T[1] + (-0.9 - T[1]) * t + 1.0 * Math.sin(PI * t), T[2] + (z - T[2]) * t];
      c.tube(prec, p, 0.045, 0x8a7a62, M.mat, 4);
      prec = p;
    }
  }
  const yNet = (s, t) => -0.92 - 0.75 * (1 - (2 * s - 1) ** 2) * (1 - (2 * t - 1) ** 2);
  const N = 8;
  for (let i = 0; i <= N; i++) {
    for (const sens of [0, 1]) {
      let prec = null;
      for (let j = 0; j <= N; j++) {
        const s = sens ? i / N : j / N;
        const t = sens ? j / N : i / N;
        const p = [87.1 + 5 * s, yNet(s, t), 17.6 + 5 * t];
        if (prec) c.poutre(prec, p, 0.022, 0x8a8a6a, M.mat, { crasse: false, nuance: 0.03 });
        prec = p;
      }
    }
  }
  piquet(c, R.carrelet, 85.3, 16.35, -0.6, 0.55, 0.28, 0.95);
  lanterne(c, 86.6, 1.3, 17.0);
  c.tube([86.6, 1.55, 17.0], [86.6, 2.0, 17.02], 0.008, 0x3a3a36, M.metal, 3);
  b.lumiere(86.6, 1.5, 17.0, 0xffc070, 4, 8, "lampe-tempête accrochée à la perche du carrelet");
  // Le pêcheur a laissé sa barque amarrée sous la plate-forme
  coque(c, 3.2, 1.2, 0.5, 0x4f6a7a, { x: 77.2, y: Y_CANAL - 0.25, z: 13.8, ry: 0.15 });
}

export function borneVelos(ctx) {
  if (!ctx.ici(91.5)) return;
  const { c, b } = ctx;
  const z0 = zc(91.5);
  // Le bord de la route a suivi le talus dans le canal
  for (let i = 0; i < 5; i++) c.boite(c.entre(0.8, 1.3), 0.12, c.entre(0.6, 1.0), COUL.asphalte, { x: 89.5 + i * 1.0, y: -0.25 - c.hasard() * 0.5, z: z0 + 3.1 + c.hasard() * 0.8, rx: c.entre(0.3, 0.7), ry: c.entre(-0.3, 0.3) }, M.mat, { nuance: 0.04 });
  // La borne WattyVélo, penchée, à demi engloutie
  c.repere({ x: 91.6, y: -1.3, z: z0 + 4.3, rx: 0.32, rz: -0.12 }, () => {
    c.repere({ ry: 1.1 }, () => {
      c.boite(0.55, 1.8, 0.38, 0xd9d4c4, { y: 0.9 }, M.satin);
      c.boite(0.6, 0.12, 0.42, 0x2f6f73, { y: 1.85 }, M.satin);
      c.boite(0.44, 0.3, 0.02, 0x18262a, { y: 1.45, z: 0.2 }, M.lisse);
      panneau(c, R.borne, { y: 1.45, z: 0.215 }, 0.42, 0.27);
      c.boite(0.06, 0.06, 0.03, 0xff3020, { x: 0.18, y: 1.72, z: 0.2 }, M.voyant);
      c.tube([-0.2, 1.0, 0.2], [-0.5, 0.2, 0.6], 0.03, 0x232323, M.satin, 4);
    });
  });
  // Le râtelier tordu et les vélos électriques : un encore attaché, deux dans l'eau
  for (let i = 0; i < 3; i++) {
    const x = 90.2 + i * 0.8;
    c.repere({ x, y: -0.15 - i * 0.12, z: z0 + 3.4 + i * 0.1, rx: 0.4 }, () => {
      c.tube([0, 0, -0.3], [0, 0.7, -0.3], 0.03, 0x9a9c98, M.metal, 4);
      c.tube([0, 0.7, -0.3], [0, 0.7, 0.3], 0.03, 0x9a9c98, M.metal, 4);
      c.tube([0, 0.7, 0.3], [0, 0, 0.3], 0.03, 0x9a9c98, M.metal, 4);
    });
  }
  velo(c, 90.6, -0.25, z0 + 3.5, 1.4, 0.35);
  velo(c, 92.1, -1.25, z0 + 4.9, 0.7, 1.25, 0xc79a3b);
  velo(c, 93.3, -1.6, z0 + 5.6, -0.5, 1.45);
  b.lumiere(91.7, 0.2, z0 + 4.1, 0xff4030, 1.2, 3, "voyant de la borne WattyVélo qui clignote encore");
}

export function fourgon(ctx) {
  if (!ctx.ici(74.5)) return;
  const { c, b } = ctx;
  const z = zc(74.5) + 0.4;
  c.repere({ x: 74.5, y: 0, z, ry: 0.14, rz: 0.03 }, () => {
    c.boite(3.6, 2.2, 2.0, 0xd9d4c4, { x: -0.6, y: 1.45 }, M.satin, { nuance: 0.03 });
    c.boite(1.5, 1.6, 1.95, 0xd9d4c4, { x: 1.95, y: 1.15 }, M.satin);
    c.boite(0.5, 0.75, 1.9, 0x2c3a40, { x: 2.5, y: 1.55, rz: -0.35 }, M.verre, { crasse: false });
    c.boite(5.2, 0.3, 2.0, 0x2f6f73, { x: 0.15, y: 0.45 }, M.satin);
    panneau(c, R.fourgon, { x: -0.6, y: 1.55, z: 1.005 }, 3.4, 0.85);
    panneau(c, R.fourgon, { x: -0.6, y: 1.55, z: -1.005, ry: PI }, 3.4, 0.85);
    c.boite(0.05, 1.9, 0.95, 0xd9d4c4, { x: -2.75, y: 1.45, z: 0.95, ry: -1.1 }, M.satin);
    for (const [px, pz] of [[1.8, 0.85], [1.8, -0.85], [-1.6, 0.85], [-1.6, -0.85]]) c.poser(geoCyl(0.36, 0.36, 0.25, 8), M.mat, 0x2a2a2a, { x: px, y: 0.28, z: pz, rx: PI / 2, e: [1, 1, 0.7] }, { crasse: false });
  });
  contour(b, 74.5, z, 5.4, 2.0, 0.14, "fourgon Watty Services");
  for (let i = 0; i < 5; i++) c.boite(0.3, 0.2, 0.18, 0x2b2b29, { x: 71.4 + c.entre(-0.4, 0.4), y: 0.1, z: z + c.entre(-0.8, 0.8), ry: c.hasard() * 3 }, M.satin);
}

export function sortie(ctx) {
  const { c } = ctx;
  if (ctx.ici(96.5)) pancarte(c, R.dirB1, 96.5, zc(96.5) - HL - 1.2, 0.12, 3.2, 0.8, 1.6, R.dirB2);
}

void [Y_CANAL, WB, matiereLueur, gravats, cylindre, roseaux, CONE];
