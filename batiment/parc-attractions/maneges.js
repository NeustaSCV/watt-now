// Wattyland, carte « manèges » : les montagnes russes du Court-Circuit (treillis, wagon arrêté au sommet, un tronçon
// effondré), le train fantôme (façade peinte, rails dans le noir, wagonnets), les autos tamponneuses sous leur plafond
// grillagé, la rivière des bûches à sec et sa fausse montagne, l'atelier de maintenance. Repère du site (plan.js).

import { THREE, C, M, TAU, PI, panneau, cyl, boule, quad, tri2, obstacleRect, obstacleCercle, lerp3 } from "./outils.js";
import { PLAN } from "./plan.js";
import { pavillon, toitPlat, dallage, pelouse, cloture, banc, poubelle, lampadaire, guirlande, peluche, couchage, caisse, lierre, semerTouffes, debris, jonchee } from "./mobilier.js";
import { cheval } from "./entree.js";
import { PALETTE, gravats, arbre, arbuste, flaque, touffes } from "../commun/atelier.js";

const HAUT = 3.2; // au-dessus : couches qui s'effacent

/** Oriente une pièce le long d'une tangente (x local = la tangente). */
function orienter(t) {
  return { ry: Math.atan2(-t.z, t.x), rz: Math.atan2(t.y, Math.hypot(t.x, t.z)) };
}

// ---------- Les montagnes russes du « Court-Circuit » ----------

const PARCOURS = [
  [5, 0.6, -12], [11, 0.6, -12], [15, 1.4, -12], [23, 9.6, -12], [31, 17.4, -12], [34.5, 18.1, -12.3], [37, 17.2, -13.2],
  [41.5, 9, -15.5], [45, 3.4, -18.5], [46.8, 3.4, -22.5], [44.8, 4.4, -26.5], [40, 6.6, -28], [33.5, 11, -28.2],
  [27, 11.6, -27.6], [21, 7.4, -27.2], [15, 5, -27.6], [9, 4.2, -26], [5, 3.6, -22], [3.4, 2.4, -17.5], [3.8, 1, -13.6],
];
/** Le tronçon effondré (entre ces x, sur la boucle nord). */
const ECROULE = { x1: 21.8, x2: 26.6, z: -24 };

/** Un wagon du Court-Circuit (repère : x = sens de la marche, y = haut). */
function wagon(c, couleur, vide = true) {
  c.boite(1.7, 0.55, 1.15, couleur, { y: 0.5 }, M.satin(), { crasse: false });
  c.boite(0.35, 0.5, 1.15, couleur, { x: 0.75, y: 0.85, rz: 0.4 }, M.satin(), { crasse: false });
  c.boite(0.12, 0.55, 1.0, 0x2a2826, { x: -0.25, y: 1.0 }, M.satin(), { crasse: false });
  c.boite(0.12, 0.55, 1.0, 0x2a2826, { x: -0.8, y: 1.0 }, M.satin(), { crasse: false });
  c.boite(0.5, 0.06, 0.95, C.acier, { x: 0.1, y: 1.05, rz: vide ? 0.9 : 0 }, M.metal());
  c.boite(0.3, 0.08, 1.17, C.rougeVif, { x: 0.2, y: 0.55 }, M.satin(), { crasse: false });
  c.boite(1.6, 0.2, 0.9, 0x3b3d3b, { y: 0.12 }, M.tole());
}

function montagnesRusses(ctx) {
  const { b, c, u } = ctx;
  const k = b.couche("les montagnes russes", { x: 25, z: -20, l: 48, p: 22 }, HAUT, 19.5);
  const ch = (...ys) => (Math.min(...ys) < HAUT ? c : k);
  const courbe = new THREE.CatmullRomCurve3(PARCOURS.map(([x, y, z]) => new THREE.Vector3(x, y, z)), true, "centripetal");
  const L = courbe.getLength();
  const n = Math.round(L / 1.25);
  const pts = courbe.getSpacedPoints(n);
  const haut = new THREE.Vector3(0, 1, 0);
  const rail = 0xa8a49a;
  const dos = 0x4f7f8a;
  const pied = 0xcbc4b4;
  const effondre = (p) => p.x > ECROULE.x1 && p.x < ECROULE.x2 && p.z < ECROULE.z;
  const tronçon = (a, bb, mat2 = M.tole()) => {
    const t = new THREE.Vector3().subVectors(bb, a).normalize();
    const s = new THREE.Vector3().crossVectors(t, haut).normalize();
    const n2 = new THREE.Vector3().crossVectors(s, t).normalize();
    const cc = ch(a.y - 0.9, bb.y - 0.9);
    const off = (p, ks, kn) => p.clone().addScaledVector(s, ks).addScaledVector(n2, kn).toArray();
    const rouille = c.hasard() < 0.15 + 0.35 * u;
    cc.poutre(off(a, 0.55, 0), off(bb, 0.55, 0), 0.1, rail, mat2);
    cc.poutre(off(a, -0.55, 0), off(bb, -0.55, 0), 0.1, rail, mat2);
    cc.poutre(off(a, 0, -0.42), off(bb, 0, -0.42), 0.3, rouille ? C.rouille : dos, M.tole());
    cc.poutre(off(a, 0, -0.95), off(bb, 0, -0.95), 0.14, rouille ? C.rouilleSombre : dos, M.tole());
    cc.poutre(off(a, 0, -0.95), off(bb, 0, -0.42), 0.07, dos, M.tole());
    cc.poutre(off(a, -0.6, -0.12), off(a, 0.6, -0.12), 0.08, 0x6a6660, M.tole());
  };
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const bb = pts[(i + 1) % n];
    if (effondre(a) || effondre(bb)) continue;
    tronçon(a, bb);
    // Les pylônes en treillis, tous les quatre pas
    if (i % 4 !== 0 || a.y < 1.4) continue;
    const t = new THREE.Vector3().subVectors(bb, a).normalize();
    const s = new THREE.Vector3(-t.z, 0, t.x).normalize();
    const y1 = a.y - 1.0;
    const e = y1 > 7 ? 1.3 : 0.9;
    const pieds = [];
    for (const ks of [-1, 1]) {
      const bas = [a.x + s.x * ks * e, 0, a.z + s.z * ks * e];
      const hautP = [a.x + s.x * ks * 0.4, y1, a.z + s.z * ks * 0.4];
      pieds.push([bas, hautP]);
      if (y1 > HAUT) {
        const m = lerp3(bas, hautP, HAUT / y1);
        c.poutre(bas, m, 0.2, pied, M.tole());
        k.poutre(m, hautP, 0.2, pied, M.tole());
      } else c.poutre(bas, hautP, 0.2, pied, M.tole());
      c.boite(0.5, 0.3, 0.5, C.betonSombre, { x: bas[0], y: 0.15, z: bas[2] }, M.mat());
    }
    b.obstacle(pieds[0][0][0], pieds[0][0][2], pieds[1][0][0], pieds[1][0][2], "pylône des montagnes russes");
    const etages = Math.max(1, Math.floor(y1 / 2.6));
    for (let q = 1; q <= etages; q++) {
      const f0 = (q - 1) / etages;
      const f1 = q / etages;
      const g0 = lerp3(pieds[0][0], pieds[0][1], f0);
      const d0 = lerp3(pieds[1][0], pieds[1][1], f0);
      const g1 = lerp3(pieds[0][0], pieds[0][1], f1);
      const d1 = lerp3(pieds[1][0], pieds[1][1], f1);
      ch(g1[1]).poutre(g1, d1, 0.1, pied, M.tole());
      ch(g0[1] + 0.5, d1[1]).poutre(q % 2 ? g0 : d0, q % 2 ? d1 : g1, 0.07, pied, M.tole());
    }
    if (c.hasard() < 0.35) arbuste(c, a.x + s.x * e, a.z + s.z * e, 0.8);
  }
  // Le tronçon effondré : il pend d'un côté jusqu'au sol, un pylône est couché dans les herbes
  {
    const p0 = courbe.getPointAt(0);
    let iA = -1;
    for (let i = 0; i < n; i++) if (!effondre(pts[i]) && effondre(pts[(i + 1) % n])) iA = i;
    const debut = pts[iA + 1] ?? p0;
    const pendant = [debut.clone(), new THREE.Vector3(debut.x - 1.6, debut.y - 3.4, debut.z + 0.3), new THREE.Vector3(debut.x - 3, debut.y - 7.6, debut.z + 0.6), new THREE.Vector3(debut.x - 3.6, 0.35, debut.z + 1.2)];
    for (let i = 0; i < pendant.length - 1; i++) tronçon(pendant[i], pendant[i + 1]);
    c.poutre([ECROULE.x1 + 0.5, 0.3, -27], [ECROULE.x1 + 1.5, 0.4, -21.5], 0.22, pied, M.tole());
    c.poutre([ECROULE.x1 + 1.8, 0.3, -27.2], [ECROULE.x1 + 3, 0.5, -21.8], 0.22, pied, M.tole());
    gravats(c, ECROULE.x1 + 1.5, -25.5, 2.2, 14, [C.betonSombre, pied, C.rouille, 0x4f7f8a]);
    debris(c, ECROULE.x1 - 2, -29, ECROULE.x2 + 1, -21, 30, [C.rouille, 0x4f7f8a, 0xa8a49a]);
  }
  // Le wagon arrêté au sommet : trois voitures, la première penchée au-dessus de la descente
  {
    const couleurs = [0xd2b450, 0xc8a040, 0xd2b450];
    const t0 = 0.255;
    for (let j = 0; j < 3; j++) {
      const t = (t0 - j * (2.0 / L) + 1) % 1;
      const p = courbe.getPointAt(t);
      const tg = courbe.getTangentAt(t);
      k.repere({ x: p.x, y: p.y + 0.05, z: p.z, ...orienter(tg) }, () => wagon(k, couleurs[j]));
    }
  }
  // La gare : quai, auvent, le train qui attend, l'enseigne
  {
    const x1 = 4;
    const x2 = 13.5;
    c.pave(x1, 0, -10.8, x2, 0.08, -9.3, 0x9a958a, M.mat(), { crasse: false });
    for (let x = x1; x <= x2 + 0.01; x += 3.15) {
      c.boite(0.16, 3.2, 0.16, 0x4f7f8a, { x, y: 1.6, z: -9.5 }, M.tole());
      c.boite(0.16, 3.2, 0.16, 0x4f7f8a, { x, y: 1.6, z: -14.2 }, M.tole());
    }
    k.pave(x1 - 0.4, 3.2, -14.6, x2 + 0.4, 3.35, -9.1, 0x6e6a64, M.tole());
    panneau(k, "courtCircuit", (x1 + x2) / 2, 3.85, -9.05, 6.4, 0.9);
    for (const s of [-1, 1]) k.boite(0.08, 0.6, 0.08, C.fonte, { x: (x1 + x2) / 2 + s * 2.8, y: 3.6, z: -9.1 }, M.tole());
    for (let x = x1; x < x2; x += 1.5) cyl(c, x, 0.5, -10.8, 0.04, 0.04, 1.0, C.jaune, M.tole(), 6);
    c.poutre([x1, 1.0, -10.8], [x2, 1.0, -10.8], 0.05, C.jaune, M.tole());
    b.obstacle(x1, -10.8, x2 - 1.5, -10.8, "barrière du quai");
    for (let j = 0; j < 3; j++) c.repere({ x: 10.5 - j * 2.0, y: 0.45, z: -12 }, () => wagon(c, j === 1 ? 0xc8a040 : 0xd2b450, j !== 0));
    obstacleRect(b, 4.6, -12.7, 11.4, -11.3, "le train du Court-Circuit");
    panneau(c, "ecran", 12.6, 1.4, -10.7, 0.32, 0.32);
    c.boite(0.16, 1.6, 0.16, 0x2b3133, { x: 12.6, y: 0.8, z: -10.85 }, M.lisse());
  }
}

// ---------- Le train fantôme ----------

function wagonnet(c, couleur = 0x4a3a5a) {
  c.boite(1.35, 0.55, 0.95, couleur, { y: 0.45 }, M.satin(), { crasse: false });
  c.boite(0.2, 0.9, 0.95, couleur, { x: 0.6, y: 0.75 }, M.satin(), { crasse: false });
  c.boite(0.15, 0.6, 0.85, 0x2a2826, { x: -0.55, y: 0.95 }, M.satin(), { crasse: false });
  c.boite(1.3, 0.15, 0.8, 0x2a2826, { y: 0.1 }, M.tole());
  panneau(c, "wattyX", 0.71, 0.85, 0, 0.75, 0.75, PI / 2);
}

function trainFantome(ctx) {
  const { b, c, u } = ctx;
  const F = PLAN.fantome;
  const H = 5;
  const k = b.couche("le train fantôme", { x: (F.x1 + F.x2) / 2, z: (F.z1 + F.z2) / 2, l: F.x2 - F.x1 + 1, p: F.z2 - F.z1 + 1.5 }, 1, 9.5);
  const xE = 10;
  const xS = 20;
  const sombre = 0x6a5a78;
  pavillon(ctx, k, {
    ...F, h: H, couleur: 0x5a4a66, sol: 0x5a5458, ep: 0.3, interieur: { couleur: sombre, mat: M.mat(), crasse: false },
    ouv: { s: [{ at: xE, l: 2.0, bas: 0, haut: 2.4, type: "vide" }, { at: xS, l: 2.0, bas: 0, haut: 2.4, type: "vide" }], n: [{ at: F.x2 - 2, l: 1.0, bas: 0, haut: 2.1, type: "vide" }] },
  });
  // La façade peinte, plus haute que le bâtiment : château hanté, Watty fantôme, tourelles pointues
  const zf = F.z2 + 0.2;
  k.pave(F.x1 + 1.5, H, F.z2, F.x2 - 1.5, 8.2, F.z2 + 0.18, 0x2a2436, M.mat());
  for (let x = F.x1 + 1.5; x < F.x2 - 1.6; x += 1.4) k.pave(x, 8.2, F.z2, x + 0.7, 8.75, F.z2 + 0.18, 0x2a2436, M.mat());
  panneau(k, "fantome", (F.x1 + F.x2) / 2, 5.4, zf, 10.6, 7.9 * 0.86);
  for (const x of [F.x1 + 0.9, F.x2 - 0.9]) {
    k.pave(x - 1, 1.0, F.z2 - 0.4, x + 1, 9, F.z2 + 0.6, 0x3a3048, M.mat());
    c.pave(x - 1, 0, F.z2 - 0.4, x + 1, 1.0, F.z2 + 0.6, 0x3a3048, M.mat());
    cyl(k, x, 10.1, F.z2 + 0.1, 1.5, 0.05, 2.2, 0x23202c, M.satin(), 4, { ry: PI / 4 });
    obstacleRect(b, x - 1, F.z2 - 0.4, x + 1, F.z2 + 0.6, "tourelle");
  }
  for (const xx of [xE, xS]) {
    k.pave(xx - 1.25, 2.4, F.z2 + 0.15, xx + 1.25, 2.75, F.z2 + 0.35, xx === xE ? 0x9fe060 : 0x6f8a4f, xx === xE ? M.ampoule() : M.satin());
    for (const s of [-1, 1]) {
      // Les portes battantes : un battant pend
      const pend = s > 0 && xx === xE;
      c.boite(0.95, 1.9, 0.06, 0x2a2436, { x: xx + s * 0.5, y: pend ? 0.7 : 1.15, z: F.z2 + 0.1, rx: pend ? 0.4 : 0, rz: pend ? 0.3 : 0, ry: pend ? 0.6 : 0 }, M.satin());
    }
  }
  b.lumiere(xE, 2.6, F.z2 + 1.2, 0x9fe060, 3, 7, "néon vert de l'entrée du train fantôme (il grésille encore)");
  panneau(c, "graffiti", 15, 0.6, F.z2 + 0.17, 1.8, 0.45, 0, 0, 0xffffff);
  // Les rails : dehors, la boucle de la gare devant la façade ; dedans, le parcours dans le noir
  const chemin = [[xS, 2], [xS, 8.6], [xE, 8.6], [xE, -5], [15, -5], [15, 2], [xS, 2]];
  for (let i = 0; i < chemin.length - 1; i++) {
    const [ax, az] = chemin[i];
    const [bx, bz] = chemin[i + 1];
    const horiz = az === bz;
    for (const d of [-0.35, 0, 0.35]) {
      const ox = horiz ? 0 : d;
      const oz = horiz ? d : 0;
      c.pave(Math.min(ax, bx) + ox - 0.04 - (horiz ? 0.35 : 0), 0, Math.min(az, bz) + oz - 0.04 - (horiz ? 0 : 0.35), Math.max(ax, bx) + ox + 0.04 + (horiz ? 0.35 : 0), d === 0 ? 0.12 : 0.07, Math.max(az, bz) + oz + 0.04 + (horiz ? 0 : 0.35), d === 0 ? 0x5b5d5b : 0xb0b0a8, M.metal(), { crasse: false });
    }
  }
  c.pave(F.x1 + 2, 0, F.z2 + 0.3, F.x2 - 2, 0.05, F.z2 + 4, 0x6a5a48, M.mat(), { crasse: false });
  wagonnetPose(c, xE + 0.3, 8.6, 0);
  wagonnetPose(c, 15, 8.6, 0, 0x5a3a4a);
  obstacleRect(b, xE - 0.4, 8.1, xE + 1.0, 9.1, "wagonnet");
  obstacleRect(b, 14.3, 8.1, 15.7, 9.1, "wagonnet");
  // Les cloisons du labyrinthe
  const cloison = (x1, z1, x2, z2) => {
    c.pave(x1, 0, z1, x2, 3.0, z2, sombre, M.mat(), { crasse: false });
    obstacleRect(b, x1, z1, x2, z2, "cloison");
  };
  cloison(12.4, -3.3, 12.6, F.z2);
  cloison(17.4, F.z1, 17.6, 0.3);
  cloison(12.6, 3.6, 17.5, 3.8);
  // Les décors : fantômes peints, cercueil debout, squelette pendu, araignée géante, draps, miroir déformant
  panneau(c, "decor", F.x1 + 0.17, 1.6, -1.5, 5, 2.5, PI / 2);
  panneau(c, "decor", 15, 1.6, F.z1 + 0.17, 4.5, 2.25);
  panneau(c, "decor", 12.35, 1.6, 0.5, 3.4, 1.7, -PI / 2);
  panneau(c, "decor", F.x2 - 0.17, 1.6, -1, 4.4, 2.2, -PI / 2);
  c.repere({ x: 13.4, z: -6.2, ry: 0.2 }, () => {
    c.boite(0.9, 2.1, 0.5, 0x2a1e1a, { y: 1.05, rx: -0.12 }, M.satin());
    c.boite(0.7, 1.6, 0.06, 0x8a2a2a, { y: 1.1, z: 0.28, rx: -0.12 }, M.satin());
    c.boite(0.45, 0.65, 0.3, 0x4f6a68, { y: 1.55, z: 0.3, rx: -0.12 }, M.satin());
    c.boite(0.47, 0.15, 0.32, C.creme, { y: 1.85, z: 0.3, rx: -0.12 }, M.satin());
  });
  obstacleRect(b, 12.9, -6.6, 13.9, -5.8, "cercueil");
  {
    const sx = 8;
    const sz = -3;
    c.poutre([sx, 3.0, sz], [sx, 2.4, sz], 0.02, 0x8a8a84, M.mat());
    c.boite(0.22, 0.24, 0.2, 0xe6e0cc, { x: sx, y: 2.25, z: sz }, M.satin());
    c.boite(0.08, 0.6, 0.08, 0xe6e0cc, { x: sx, y: 1.8, z: sz }, M.satin());
    for (let i = 0; i < 4; i++) c.boite(0.36 - i * 0.03, 0.03, 0.18, 0xe6e0cc, { x: sx, y: 1.95 - i * 0.12, z: sz }, M.satin());
    for (const s of [-1, 1]) {
      c.poutre([sx + s * 0.15, 2.0, sz], [sx + s * 0.3, 1.4, sz + 0.05], 0.035, 0xe6e0cc, M.satin());
      c.poutre([sx + s * 0.07, 1.5, sz], [sx + s * 0.12, 0.8, sz], 0.04, 0xe6e0cc, M.satin());
    }
  }
  {
    const ax = 21.5;
    const az = -5.5;
    boule(c, ax, 2.6, az, 0.45, 0x1f1c22, M.satin(), [1.2, 0.8, 1]);
    boule(c, ax + 0.45, 2.55, az, 0.25, 0x1f1c22, M.satin());
    for (let i = 0; i < 8; i++) {
      const s = i < 4 ? -1 : 1;
      const a = -0.9 + (i % 4) * 0.55;
      c.poutre([ax + Math.sin(a) * 0.3, 2.6, az + s * 0.3], [ax + Math.sin(a) * 1.0, 1.9, az + s * 1.0], 0.05, 0x1f1c22, M.satin());
      c.poutre([ax + Math.sin(a) * 1.0, 1.9, az + s * 1.0], [ax + Math.sin(a) * 1.3, 1.1, az + s * 1.3], 0.04, 0x1f1c22, M.satin());
    }
    c.poutre([ax, 2.9, az], [ax, 4.9, az], 0.015, 0xd8d8d0, M.mat());
  }
  for (const [dx, dz] of [[11, 1], [16.2, -2.5], [19, -3], [9, 4.5]]) {
    c.poutre([dx, 4.9, dz], [dx, 2.6, dz], 0.012, 0xd8d8d0, M.mat());
    tri2(c, M.toile(), 0xe2ddd0, [[dx - 0.4, 2.65, dz], [dx + 0.4, 2.65, dz + 0.1], [dx + 0.05, 1.3, dz + 0.2]]);
    tri2(c, M.toile(), 0xd8d2c4, [[dx, 2.8, dz - 0.3], [dx - 0.1, 2.65, dz + 0.3], [dx - 0.3, 1.5, dz]]);
  }
  c.boite(1.0, 2.0, 0.06, 0x8a9aa0, { x: 22.5, y: 1.2, z: 1.5, ry: -PI / 2 - 0.3, rz: 0.04 }, M.lisse(), { crasse: false });
  // Un wagonnet déraillé dans le noir
  c.repere({ x: 15.6, y: 0.15, z: -1.2, ry: 0.5, rz: 0.25 }, () => wagonnet(c, 0x4a3a5a));
  // La veilleuse SORTIE, sur sa pile, rouge
  panneau(c, "sortie", xS, 2.65, F.z2 - 0.17, 0.8, 0.4, PI);
  c.boite(0.12, 0.08, 0.06, 0xff4a3a, { x: xS + 0.55, y: 2.65, z: F.z2 - 0.2 }, M.ampoule(), { crasse: false });
  b.lumiere(xS, 2.4, F.z2 - 1.2, 0xff3a2a, 3, 7, "veilleuse SORTIE du train fantôme (sur pile)");
  jonchee(c, F.x1 + 0.4, F.z1 + 0.4, F.x2 - 0.4, F.z2 - 0.4, 30, [0x3a3044, 0x5a4a38, 0xd8d2c4]);
  toitPlat(k, F.x1, F.z1, F.x2, F.z2, H, 0x3e3a3c, { debord: 0.2, acrotere: 0.4, couleurAcrotere: 0x3a3048, trou: u > 0.4 ? { x1: 17, x2: 21, z1: -5, z2: -1 } : null });
  lierre(c, F.x2 + 0.16, 0, F.z1 + 3, PI / 2, 3.5, 3, 40);
}

function wagonnetPose(c, x, z, ry, couleur) {
  c.repere({ x, z, ry }, () => wagonnet(c, couleur));
}

// ---------- Les autos tamponneuses ----------

function auto(c, couleur) {
  c.boite(2.05, 0.28, 1.4, 0x2a2826, { y: 0.24 }, M.mat());
  c.boite(1.75, 0.38, 1.15, couleur, { y: 0.52 }, M.satin(), { crasse: false });
  c.boite(0.55, 0.45, 1.05, couleur, { x: 0.6, y: 0.82, rz: -0.35 }, M.satin(), { crasse: false });
  c.boite(0.2, 0.55, 0.95, couleur, { x: -0.72, y: 0.95 }, M.satin(), { crasse: false });
  c.boite(0.55, 0.2, 0.8, 0x3a3030, { x: -0.4, y: 0.78 }, M.mat());
  cyl(c, 0.2, 1.0, 0, 0.17, 0.17, 0.04, 0x2a2826, M.tole(), 8, { rz: 0.9 });
  c.boite(0.45, 0.22, 0.6, C.canard, { x: 0.35, y: 0.82 }, M.satin(), { crasse: false }); // la batterie Watty, capot ouvert
  c.boite(0.47, 0.06, 0.62, C.creme, { x: 0.35, y: 0.95 }, M.satin(), { crasse: false });
}

function tamponneuses(ctx) {
  const { b, c, u } = ctx;
  const T = PLAN.tamponneuses;
  const k = b.couche("les autos tamponneuses", { x: (T.x1 + T.x2) / 2, z: (T.z1 + T.z2) / 2, l: T.x2 - T.x1 + 1.2, p: T.z2 - T.z1 + 1.2 }, 3.4, 6.2);
  const hP = 4.4;
  c.pave(T.x1, 0, T.z1, T.x2, 0.08, T.z2, 0x6a6c68, M.tole(), { crasse: false });
  // La bordure en caoutchouc, avec deux passages
  const bord = (x1, z1, x2, z2) => {
    c.pave(x1, 0, z1, x2, 0.55, z2, C.jaune, M.satin());
    c.pave(x1 - 0.03, 0.4, z1 - 0.03, x2 + 0.03, 0.6, z2 + 0.03, 0x2a2826, M.mat());
    obstacleRect(b, x1, z1, x2, z2, "bordure");
  };
  bord(T.x1, T.z1, T.x2, T.z1 + 0.3);
  bord(T.x1, T.z2 - 0.3, (T.x1 + T.x2) / 2 - 1.2, T.z2);
  bord((T.x1 + T.x2) / 2 + 1.2, T.z2 - 0.3, T.x2, T.z2);
  bord(T.x1, T.z1, T.x1 + 0.3, (T.z1 + T.z2) / 2 - 1);
  bord(T.x1, (T.z1 + T.z2) / 2 + 1, T.x1 + 0.3, T.z2);
  bord(T.x2 - 0.3, T.z1, T.x2, T.z2);
  // Les poteaux, le plafond grillagé (d'où les perches prenaient le courant), le toit en tôle crevé
  for (let x = T.x1; x <= T.x2 + 0.01; x += 4)
    for (const z of [T.z1, T.z2]) {
      c.boite(0.22, HAUT, 0.22, 0xc8a040, { x, y: HAUT / 2, z }, M.tole());
      k.boite(0.22, hP + 0.6 - HAUT, 0.22, 0xc8a040, { x, y: (HAUT + hP + 0.6) / 2, z }, M.tole());
    }
  for (let x = T.x1; x <= T.x2 + 0.01; x += 0.8) k.boite(0.03, 0.03, T.z2 - T.z1, 0x8a8a84, { x, y: hP, z: (T.z1 + T.z2) / 2 }, M.metal());
  for (let z = T.z1; z <= T.z2 + 0.01; z += 0.8) k.boite(T.x2 - T.x1, 0.03, 0.03, 0x8a8a84, { x: (T.x1 + T.x2) / 2, y: hP, z }, M.metal());
  for (const z of [T.z1, (T.z1 + T.z2) / 2, T.z2]) k.boite(T.x2 - T.x1 + 0.4, 0.3, 0.18, 0xc8a040, { x: (T.x1 + T.x2) / 2, y: hP + 0.2, z }, M.tole());
  const nb = 8;
  for (let i = 0; i < nb; i++) {
    const x1 = T.x1 - 0.4 + ((T.x2 - T.x1 + 0.8) * i) / nb;
    const x2 = T.x1 - 0.4 + ((T.x2 - T.x1 + 0.8) * (i + 1)) / nb;
    if (c.hasard() < 0.15 + 0.3 * u) continue;
    quad(k, M.tole(), i % 2 ? 0x8a8f8a : C.rouille, [[x1, hP + 0.55, T.z2 + 0.4], [x2, hP + 0.55, T.z2 + 0.4], [x2, hP + 1.1, (T.z1 + T.z2) / 2], [x1, hP + 1.1, (T.z1 + T.z2) / 2]], true);
    quad(k, M.tole(), i % 2 ? 0x8a8f8a : 0x7a7f7a, [[x1, hP + 1.1, (T.z1 + T.z2) / 2], [x2, hP + 1.1, (T.z1 + T.z2) / 2], [x2, hP + 0.55, T.z1 - 0.4], [x1, hP + 0.55, T.z1 - 0.4]], true);
  }
  panneau(k, "tamponneuses", (T.x1 + T.x2) / 2, hP + 0.95, T.z2 + 0.35, 7.5, 1.4, 0, -0.25);
  // Les autos, figées en pleine bousculade ; une est retournée, une autre a fini dehors
  const couleurs = [0xa94a3c, 0xd2b450, 0x3f7774, 0x5b7f97, 0x8a7096, 0xa94a3c, 0x6d9466];
  const places = [[33, 0, 0.3], [35.5, 1.4, 2.8], [39, -0.6, 1.2], [42.5, 2.2, -0.5], [37.2, 5.2, 4.1], [32.5, 6.6, 0.9], [43.4, 6.4, 2.2]];
  places.forEach(([x, z, ry], i) => {
    const retournee = i === 3 && u > 0.3;
    c.repere({ x, z, ry, rx: retournee ? PI : 0, y: retournee ? 1.15 : 0.08 }, () => auto(c, couleurs[i]));
    if (!retournee) {
      c.poutre([x - Math.cos(ry) * 0.7, 1.0, z + Math.sin(ry) * 0.7], [x - Math.cos(ry) * 0.9, HAUT, z + Math.sin(ry) * 0.9], 0.045, 0x3b3d3b, M.tole());
      k.poutre([x - Math.cos(ry) * 0.9, HAUT, z + Math.sin(ry) * 0.9], [x - Math.cos(ry) * 1.0, hP - 0.05, z + Math.sin(ry) * 1.0], 0.045, 0x3b3d3b, M.tole());
    }
    obstacleCercle(b, x, z, 1.0, 6, "auto tamponneuse");
  });
  c.repere({ x: 48.4, z: 10.6, ry: 2.2, rz: 0.15 }, () => auto(c, 0xd2b450));
  obstacleCercle(b, 48.4, 10.6, 1.0, 6, "auto tamponneuse");
  // La borne de recharge par abonnement (son voyant vert s'allume encore)
  c.boite(0.5, 1.6, 0.4, C.canard, { x: T.x1 - 0.8, y: 0.8, z: T.z2 - 1.5 }, M.satin());
  c.boite(0.52, 0.3, 0.42, C.creme, { x: T.x1 - 0.8, y: 1.7, z: T.z2 - 1.5 }, M.satin());
  panneau(c, "ecran", T.x1 - 0.8, 1.15, T.z2 - 1.29, 0.36, 0.36);
  c.boite(0.08, 0.08, 0.04, 0x7aff6a, { x: T.x1 - 0.65, y: 1.48, z: T.z2 - 1.29 }, M.ampoule(), { crasse: false });
  obstacleRect(b, T.x1 - 1.05, T.z2 - 1.7, T.x1 - 0.55, T.z2 - 1.3, "borne");
  b.lumiere(T.x1 - 0.8, 1.6, T.z2 - 0.9, 0x7aff6a, 1.6, 4, "voyant vert de la borne de recharge des tamponneuses");
  semerTouffes(c, T.x1, T.z1, T.x2, T.z2, 30);
  debris(c, T.x1 + 1, T.z1 + 1, T.x2 - 1, T.z2 - 1, 30, [C.rouille, 0x8a8f8a, 0x2a2826]);
}

// ---------- La rivière des bûches (à sec) ----------

function buche(c, x, y, z, ry, rx = 0, rz = 0) {
  c.repere({ x, y, z, ry, rx, rz }, () => {
    c.boite(2.2, 0.5, 0.95, 0x7a5a3c, { y: 0.25 }, M.mat(), { nuance: 0.06 });
    c.boite(0.4, 0.55, 0.85, 0x6a4a30, { x: 1.05, y: 0.4, rz: -0.4 }, M.mat());
    for (const s of [-0.4, 0.3]) c.boite(0.15, 0.4, 0.8, 0x5a4030, { x: s, y: 0.55 }, M.mat());
    for (const s of [-0.18, 0.18]) c.boite(0.03, 0.12, 0.12, 0x1a1a1a, { x: 1.2, y: 0.55, z: s }, M.mat());
    c.boite(1.8, 0.04, 0.7, 0x3a3028, { y: 0.51 }, M.mat());
  });
}

function buches(ctx) {
  const { b, c, u } = ctx;
  const B = PLAN.buches;
  const k = b.couche("la rivière des bûches", { x: (B.x1 + B.x2) / 2, z: (B.z1 + B.z2) / 2, l: B.x2 - B.x1 + 1, p: B.z2 - B.z1 + 1 }, HAUT, 11);
  const ch = (y) => (y < HAUT ? c : k);
  // Le canal : une boucle de béton à sec (le fond vert de mousse et de feuilles)
  const xa = 53.5;
  const xb = 62.5;
  const za = -12;
  const zb = 7;
  const lg = 0.85;
  const canal = (x1, z1, x2, z2) => {
    const horiz = z1 === z2;
    const [ax, az, bx, bz] = horiz ? [Math.min(x1, x2) - lg, z1 - lg, Math.max(x1, x2) + lg, z1 + lg] : [x1 - lg, Math.min(z1, z2) - lg, x1 + lg, Math.max(z1, z2) + lg];
    c.pave(ax, 0, az, bx, 0.06, bz, 0x6a6a52, M.mat(), { crasse: false });
    if (horiz) {
      for (const zz of [az, bz]) {
        c.pave(ax, 0, zz - 0.1, bx, 0.7, zz + 0.1, C.beton, M.beton());
        b.obstacle(ax, zz, bx, zz, "bord du canal");
      }
    } else
      for (const xx of [ax, bx]) {
        c.pave(xx - 0.1, 0, az, xx + 0.1, 0.7, bz, C.beton, M.beton());
        b.obstacle(xx, az, xx, bz, "bord du canal");
      }
  };
  canal(xa, za, xb, za);
  canal(xa, zb, 57, zb);
  canal(61, zb, xb, zb);
  canal(xa, za, xa, -1);
  canal(xa, 2, xa, zb);
  canal(xb, za, xb, zb);
  jonchee(c, xa - 0.8, za - 0.8, xb + 0.8, zb + 0.8, 60);
  semerTouffes(c, xa - 0.6, za - 0.6, xb + 0.6, zb + 0.6, 40, PALETTE.herbe);
  flaque(c, xb, 1, 0.7);
  // Le bassin d'arrivée (la grande éclaboussure), à sec, une bûche couchée dedans
  c.pave(56.5, 0, 6.2, 61.5, 0.05, 9.6, 0x6a6a52, M.mat(), { crasse: false });
  c.pave(56.5, 0, 9.4, 61.5, 0.9, 9.7, C.beton, M.beton());
  b.obstacle(56.5, 9.55, 61.5, 9.55, "bassin");
  flaque(c, 59.5, 8.3, 1.3);
  buche(c, 58.6, 0.1, 8.2, 0.3, 0, 0.9);
  buche(c, xa, 0.08, -6.5, PI / 2);
  // La fausse montagne en béton peint, la montée, la descente
  const roches = [[58, -3, 1.6, 3.2], [59.6, -6.4, 2.2, 2.6], [57.2, 0.6, 1.1, 2.0], [58.6, -4.6, 4.6, 2.4], [57.4, -1.6, 4.2, 1.8], [59.2, -6.0, 6.8, 1.8], [60.2, -3.2, 1.2, 2.0], [56.4, -5.6, 1.4, 1.8]];
  for (const [x, z, y, r] of roches) boule(ch(y + r * 0.5), x, y, z, r, [0x9a8a72, 0x8a7e6c, 0xa89878, 0x7e8a6a][Math.floor(c.hasard() * 4)], M.mat(), [1, 1.15, 1], 0, { rx: c.hasard() * 3, ry: c.hasard() * 3 });
  boule(k, 59.6, 9.6, -6.6, 0.9, 0x6a8a4a, M.mat(), 1, 0);
  obstacleCercle(b, 58.3, -3, 3.4, 10, "la fausse montagne");
  arbre(c, 56.6, 1.6, 5, "bouleau", 0.4);
  // La descente : un toboggan de béton sur pilotis, une bûche coincée à mi-pente
  const haut = new THREE.Vector3(60.6, 8.8, -5);
  const bas = new THREE.Vector3(59.2, 0.3, 6.2);
  const N = 6;
  for (let i = 0; i < N; i++) {
    const p1 = haut.clone().lerp(bas, i / N);
    const p2 = haut.clone().lerp(bas, (i + 1) / N);
    const cc = ch(Math.min(p1.y, p2.y));
    const t = p2.clone().sub(p1);
    cc.repere({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2, z: (p1.z + p2.z) / 2, ry: Math.atan2(t.x, t.z) }, () => {
      const l = t.length();
      const pente = Math.atan2(t.y, Math.hypot(t.x, t.z));
      cc.repere({ rx: pente }, () => {
        cc.boite(1.5, 0.15, l + 0.05, 0x8a8a74, {}, M.beton());
        for (const s of [-1, 1]) cc.boite(0.15, 0.6, l + 0.05, C.beton, { x: s * 0.75, y: 0.3 }, M.beton());
      });
    });
    if (i > 0 && p1.y > 1) {
      const m = lerp3(p1.toArray(), [p1.x, 0, p1.z], 0);
      for (const s of [-0.6, 0.6]) {
        if (p1.y > HAUT) {
          c.poutre([p1.x + s, 0, p1.z], [p1.x + s, HAUT, p1.z], 0.18, C.betonSombre, M.mat());
          k.poutre([p1.x + s, HAUT, p1.z], [p1.x + s, p1.y - 0.1, p1.z], 0.18, C.betonSombre, M.mat());
        } else c.poutre([p1.x + s, 0, p1.z], [p1.x + s, p1.y - 0.1, p1.z], 0.18, C.betonSombre, M.mat());
        b.obstacle(p1.x + s - 0.1, p1.z, p1.x + s + 0.1, p1.z, "pilier");
      }
      void m;
    }
  }
  {
    const p = haut.clone().lerp(bas, 0.45);
    const t = bas.clone().sub(haut);
    buche(ch(p.y), p.x, p.y + 0.1, p.z, Math.atan2(t.x, t.z) - PI / 2, 0, -Math.atan2(t.y, Math.hypot(t.x, t.z)));
  }
  // La montée à chaîne, depuis le canal ouest
  {
    const p1 = new THREE.Vector3(xa + 0.2, 0.3, -9.5);
    const p2 = new THREE.Vector3(57.2, 8.6, -7.2);
    const N2 = 5;
    for (let i = 0; i < N2; i++) {
      const a = p1.clone().lerp(p2, i / N2);
      const bb = p1.clone().lerp(p2, (i + 1) / N2);
      const cc = ch(Math.min(a.y, bb.y));
      cc.poutre(a.toArray(), bb.toArray(), 0.25, 0x2a2826, M.tole());
      for (const s of [-0.6, 0.6]) cc.poutre([a.x, a.y + 0.3, a.z + s], [bb.x, bb.y + 0.3, bb.z + s], 0.12, C.beton, M.mat());
      if (i > 0) {
        c.poutre([a.x, 0, a.z], [a.x, Math.min(a.y, HAUT), a.z], 0.16, C.betonSombre, M.mat());
        if (a.y > HAUT) k.poutre([a.x, HAUT, a.z], [a.x, a.y, a.z], 0.16, C.betonSombre, M.mat());
      }
    }
  }
  // L'enseigne, sur son portique de rondins
  for (const x of [52.2, 55.8]) c.boite(0.25, 3.0, 0.25, 0x6a4a30, { x, y: 1.5, z: 10.5 }, M.mat());
  k.boite(4.2, 0.3, 0.3, 0x6a4a30, { x: 54, y: 3.6, z: 10.5 }, M.mat());
  panneau(k, "riviere", 54, 4.2, 10.68, 4.6, 1.15);
  b.obstacle(52.1, 10.5, 52.3, 10.5, "portique");
}

// ---------- L'atelier de maintenance (le trésor des Mécanistes) ----------

function moteur(c, x, z, ry = 0, s = 1) {
  c.repere({ x, z, ry, e: s }, () => {
    cyl(c, 0, 0.42, 0, 0.32, 0.32, 0.8, 0x5e7a6a, M.tole(), 10, { rz: PI / 2 });
    for (let i = 0; i < 4; i++) cyl(c, -0.3 + i * 0.2, 0.42, 0, 0.35, 0.35, 0.04, 0x4e6a5a, M.tole(), 10, { rz: PI / 2 });
    cyl(c, 0.5, 0.42, 0, 0.05, 0.05, 0.25, C.acier, M.metal(), 6, { rz: PI / 2 });
    c.boite(0.7, 0.1, 0.55, 0x3b3d3b, { y: 0.05 }, M.tole());
    c.boite(0.22, 0.16, 0.2, 0x3b3d3b, { y: 0.8 }, M.tole());
  });
}

function engrenage(c, x, y, z, r, couleur = C.acier, rx = PI / 2, ry = 0) {
  cyl(c, x, y, z, r, r, 0.06, couleur, M.metal(), Math.max(8, Math.round(r * 30)), { rx, ry });
}

function atelier(ctx) {
  const { b, c, u } = ctx;
  const A = PLAN.atelier;
  const H = 4.2;
  const k = b.couche("l'atelier", { x: (A.x1 + A.x2) / 2, z: (A.z1 + A.z2) / 2, l: A.x2 - A.x1 + 1, p: A.z2 - A.z1 + 1 }, 1, 6.5);
  const xp = A.x1 + 4;
  pavillon(ctx, k, {
    ...A, h: H, couleur: 0x8f9a86, sol: 0x8a8578, interieur: { couleur: 0xb8b8a8, mat: M.mat() }, bris: 0.4 + 0.5 * u,
    ouv: {
      s: [{ at: xp, l: 3.6, bas: 0, haut: 3.2, type: "vide" }, { at: A.x2 - 2.5, l: 2.2, bas: 1.2, haut: 2.8, type: "fenetre", croisillons: 3, traverses: 2, cadre: 0x3b3d3b }],
      e: [{ at: (A.z1 + A.z2) / 2, l: 2.4, bas: 1.2, haut: 2.8, type: "fenetre", croisillons: 3, traverses: 2, cadre: 0x3b3d3b }],
      o: [{ at: A.z1 + 2.5, l: 1.0, bas: 0, haut: 2.1, type: "vide" }],
    },
  });
  // La porte coulissante, poussée de côté sur son rail
  c.pave(xp + 1.9, 0.02, A.z2 + 0.18, xp + 5.4, 3.2, A.z2 + 0.26, 0x7a8a76, M.tole());
  for (let x = xp + 2.2; x < xp + 5.3; x += 0.5) c.boite(0.06, 3.1, 0.04, 0x6a7a66, { x, y: 1.6, z: A.z2 + 0.29 }, M.tole());
  panneau(c, "atelier", xp + 3.65, 2.2, A.z2 + 0.31, 1.6, 0.8);
  k.pave(xp - 2.2, 3.3, A.z2 + 0.14, xp + 5.6, 3.42, A.z2 + 0.3, 0x3b3d3b, M.tole());
  // Les établis, les outils, les étagères d'engrenages et de roulements
  c.pave(A.x1 + 0.3, 0, A.z1 + 0.2, A.x1 + 6.5, 0.95, A.z1 + 1.0, C.bois, M.mat());
  c.pave(A.x1 + 0.25, 0.95, A.z1 + 0.15, A.x1 + 6.55, 1.02, A.z1 + 1.05, 0x6a5038, M.mat());
  c.pave(A.x1 + 0.3, 1.1, A.z1 + 0.15, A.x1 + 6.5, 2.4, A.z1 + 0.2, 0x9a8a6a, M.mat());
  for (let i = 0; i < 12; i++) c.boite(0.06, 0.3 + c.hasard() * 0.3, 0.03, [C.rouge, C.acier, C.jaune][i % 3], { x: A.x1 + 0.6 + i * 0.5, y: 1.6 + c.hasard() * 0.5, z: A.z1 + 0.24, rz: c.entre(-0.3, 0.3) }, M.metal());
  c.boite(0.25, 0.25, 0.35, 0x3b5a7a, { x: A.x1 + 1.2, y: 1.15, z: A.z1 + 0.6 }, M.tole()); // l'étau
  c.boite(0.5, 0.2, 0.3, C.rouge, { x: A.x1 + 3, y: 1.12, z: A.z1 + 0.6 }, M.tole()); // la caisse à outils
  moteur(c, A.x1 + 4.8, A.z1 + 0.6, 0.3, 0.6);
  obstacleRect(b, A.x1 + 0.3, A.z1 + 0.2, A.x1 + 6.5, A.z1 + 1.0, "établi");
  c.pave(A.x2 - 0.7, 0, A.z1 + 0.3, A.x2 - 0.2, 2.4, A.z1 + 4.5, 0x5a5e5a, M.tole());
  for (const y of [0.4, 1.0, 1.6, 2.2]) {
    c.pave(A.x2 - 0.75, y - 0.03, A.z1 + 0.3, A.x2 - 0.2, y, A.z1 + 4.5, 0x5a5e5a, M.tole());
    for (let z = A.z1 + 0.6; z < A.z1 + 4.3; z += 0.55) {
      if (c.hasard() < 0.2 * u) continue;
      if (c.hasard() < 0.5) engrenage(c, A.x2 - 0.45, y + 0.2, z, 0.12 + c.hasard() * 0.1, c.hasard() < 0.4 ? C.or : C.acier, 0, PI / 2);
      else cyl(c, A.x2 - 0.45, y + 0.06, z, 0.1, 0.1, 0.08, 0x8a8a84, M.metal(), 8);
    }
  }
  b.obstacle(A.x2 - 0.75, A.z1 + 0.3, A.x2 - 0.75, A.z1 + 4.5, "étagère");
  // Les moteurs des manèges, alignés au sol ; un palan qui en tient un ; une couronne dentée de carrousel
  for (let i = 0; i < 3; i++) moteur(c, A.x1 + 1.5 + i * 1.6, A.z2 - 2.2, PI / 2, 1);
  obstacleRect(b, A.x1 + 1.0, A.z2 - 2.7, A.x1 + 5.6, A.z2 - 1.7, "moteurs");
  k.poutre([A.x1 + 0.2, 3.9, A.z1 + 4.6], [A.x2 - 0.2, 3.9, A.z1 + 4.6], 0.25, 0xc8a040, M.tole());
  const xh = A.x1 + 7.4;
  c.poutre([xh, 3.9, A.z1 + 4.6], [xh, 1.7, A.z1 + 4.6], 0.04, 0x3b3d3b, M.metal());
  c.boite(0.25, 0.35, 0.2, C.jaune, { x: xh, y: 3.5, z: A.z1 + 4.6 }, M.tole());
  moteur(c, xh, A.z1 + 4.6, 0.2, 1.1);
  engrenage(c, A.x1 + 8.6, 0.06, A.z2 - 2.5, 1.0, C.rouille, 0);
  engrenage(c, A.x1 + 8.6, 0.12, A.z2 - 2.5, 0.6, C.acier, 0);
  // Un cheval de bois du carrousel, en réparation sur deux tréteaux ; une auto tamponneuse ouverte, ses batteries
  for (const s of [-0.5, 0.5]) c.boite(0.1, 0.8, 0.8, C.bois, { x: A.x1 + 9.8 + s, y: 0.4, z: A.z1 + 2.2 }, M.mat());
  c.repere({ x: A.x1 + 9.8, y: 1.35, z: A.z1 + 2.2 }, () => cheval(c, 0xe2dccd, 0xa94a3c));
  obstacleRect(b, A.x1 + 9.2, A.z1 + 1.8, A.x1 + 10.4, A.z1 + 2.6, "tréteaux");
  c.repere({ x: A.x2 - 2.2, y: 0.05, z: A.z2 - 2.2, ry: 0.4 }, () => auto(c, 0x3f7774));
  for (let i = 0; i < 3; i++) c.boite(0.35, 0.3, 0.25, C.canard, { x: A.x2 - 3.6 + i * 0.4, y: 0.15, z: A.z2 - 0.8 }, M.satin());
  obstacleCercle(b, A.x2 - 2.2, A.z2 - 2.2, 1.0, 6, "auto démontée");
  for (let i = 0; i < 3; i++) cyl(c, A.x1 + 0.6 + i * 0.65, 0.45, A.z2 - 0.6, 0.3, 0.3, 0.9, [0x4a5a6a, C.rouille, 0x6a3a2a][i], M.tole(), 8);
  // Le coin des Mécanistes : un lit de camp, la lampe sur batterie qui éclaire encore l'établi
  couchage(c, A.x1 + 8.2, A.z1 + 0.9, PI / 2);
  c.poutre([A.x1 + 3.5, H - 0.05, A.z1 + 1.2], [A.x1 + 3.5, 2.6, A.z1 + 1.2], 0.02, 0x2a2826, M.mat());
  cyl(c, A.x1 + 3.5, 2.5, A.z1 + 1.2, 0.3, 0.06, 0.2, 0x3b5a4a, M.tole(), 8);
  boule(c, A.x1 + 3.5, 2.38, A.z1 + 1.2, 0.08, 0xffe2a0, M.ampoule());
  b.lumiere(A.x1 + 3.5, 2.2, A.z1 + 1.4, 0xffd27a, 6, 10, "lampe de l'atelier (Mécanistes, sur batterie)");
  jonchee(c, A.x1 + 0.4, A.z1 + 0.4, A.x2 - 0.4, A.z2 - 0.4, 30, [0x5a5040, 0x3b3d3b, 0x9a8a6a]);
  flaque(c, A.x1 + 6, A.z1 + 6.5, 0.9);
  // Le toit en sheds, quelques vitres du nord brisées
  toitPlat(k, A.x1, A.z1, A.x2, A.z2, H, 0x6a6e66, { debord: 0.25, acrotere: 0.25, trou: u > 0.5 ? { x1: A.x1 + 7, x2: A.x1 + 9.5, z1: A.z1 + 2, z2: A.z1 + 5 } : null });
  for (let i = 0; i < 4; i++) {
    const z0 = A.z1 + 0.5 + i * 2.4;
    k.repere({ x: (A.x1 + A.x2) / 2, y: H + 0.2, z: z0 + 1.0 }, () => {
      k.boite(A.x2 - A.x1 - 0.6, 0.06, 2.1, 0x7a7e76, { y: 0.5, rx: -0.45 }, M.tole());
      k.boite(A.x2 - A.x1 - 0.6, 0.9, 0.06, 0x3a5560, { y: 0.45, z: -1.0 }, M.lisse());
    });
  }
  lierre(c, A.x1 - 0.16, 0, A.z1 + 6, -PI / 2, 5, 3.5, 50);
}

// ---------- Les allées, la clôture, la végétation ----------

function alleesEtVegetation(ctx) {
  const { b, c, u } = ctx;
  const S = PLAN.alleeStands;
  dallage(ctx, 0, S.z1, 51, S.z2, C.terrazzo, 2);
  dallage(ctx, 26, -9, 29, S.z1, C.terrazzo, 2, (x, z) => !(z > -3 && x > 29));
  dallage(ctx, 6, 10.4, 26, S.z1, 0xb4ab98, 2);
  dallage(ctx, 47, -18, 52, S.z1, C.terrazzo, 2);
  dallage(ctx, 2, -9.2, 26, -7.2, 0xb4ab98, 2);
  dallage(ctx, 53, -18.8, 65, -14.6, 0xa59f92, 2);
  cloture(ctx, 0, 66, PLAN.cloture, [[30, 32.6]]);
  // Lampadaires et guirlandes
  const xs = [3, 13, 23, 33, 43];
  const n = xs.map((x) => lampadaire(ctx, x, S.z1 - 0.3, 4.2));
  const s = xs.map((x) => lampadaire(ctx, x + 5, S.z2 + 0.3, 4.2, x === 23 ? 0.1 * u : 0));
  for (let i = 0; i < xs.length; i++) {
    guirlande(ctx, n[i], s[i], 0.8, 0.35);
    if (i < xs.length - 1) guirlande(ctx, s[i], n[i + 1], 0.8, 0.3, i === 2 && u > 0.5);
  }
  b.lumiere(20, 3.4, 14.5, 0xffa0e0, 5, 11, "guirlande d'ampoules qui clignote (faux contact)");
  b.lumiere(42, 3.4, 14.5, 0xffd27a, 4, 10, "guirlande d'ampoules de l'allée");
  banc(ctx, 9, S.z2 + 1.3, PI);
  banc(ctx, 30, S.z2 + 1.3, PI, u > 0.4);
  banc(ctx, 40, S.z1 - 1.3, 0);
  poubelle(ctx, 17, S.z2 + 1.0, PI);
  poubelle(ctx, 36, S.z1 - 0.9, 0, u > 0.35);
  poubelle(ctx, 46, S.z2 + 1.0, PI);
  panneau(c, "sourires", 26, 2.2, 21.6, 3.4, 1.7, PI, u > 0.6 ? -0.05 : 0);
  for (const x of [24.4, 27.6]) c.boite(0.14, 3.0, 0.14, C.fonte, { x, y: 1.5, z: 21.7 }, M.tole());
  // La végétation
  const libre = (x, z) =>
    !(z > S.z1 - 0.5 && z < S.z2 + 0.5 && x < 51.5) &&
    !(x > PLAN.fantome.x1 - 0.5 && x < PLAN.fantome.x2 + 0.5 && z > PLAN.fantome.z1 - 0.5 && z < 12) &&
    !(x > PLAN.tamponneuses.x1 - 1 && x < PLAN.tamponneuses.x2 + 0.5 && z > PLAN.tamponneuses.z1 - 0.5 && z < PLAN.tamponneuses.z2 + 0.5) &&
    !(x > PLAN.buches.x1 && z > PLAN.buches.z1 && z < 11) &&
    !(x > PLAN.atelier.x1 - 0.5 && z < PLAN.atelier.z2 + 0.5) &&
    !(x > 3.5 && x < 14 && z > -15 && z < -9) &&
    z < 21.8;
  pelouse(ctx, 0, -30, 66, 22, libre, 0.55 + 0.3 * u);
  const arbres = [[24, -20, 10, "feuillu"], [14, -21, 7, "bouleau"], [36, -22, 8, "feuillu"], [2.5, -4, 8, "feuillu"], [48.5, 19.5, 8, "feuillu"], [63, 18.5, 9, "feuillu"], [36, 20, 7, "bouleau"], [14, 19.5, 8, "feuillu"], [64.5, -16, 7, "bouleau"], [48.5, -29, 9, "feuillu"], [2, -28.5, 8, "mort"], [29, -6, 6, "bouleau"], [48.5, 0, 7, "feuillu"]];
  for (const [x, z, h, e] of arbres) arbre(c, x, z, h * (0.85 + 0.3 * u), e);
  for (const [x, z] of [[18, -16], [30, -17], [42, -10], [5, 3], [26.5, 3], [47, -5], [65, 13], [56, 18], [20, 20.5], [1.5, 9]]) arbuste(c, x, z, 0.9 + c.hasard() * 0.7 * (0.6 + u));
  semerTouffes(c, 0, -30, 66, 22, 90 + Math.round(110 * u));
}

/** Toute la carte « manèges ». */
export function carteManeges(ctx) {
  alleesEtVegetation(ctx);
  montagnesRusses(ctx);
  trainFantome(ctx);
  tamponneuses(ctx);
  buches(ctx);
  atelier(ctx);
}
