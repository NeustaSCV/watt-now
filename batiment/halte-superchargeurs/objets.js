// Halte des Superchargeurs Watty : les outils de pose et les objets répétés (voitures électriques, bornes, grillages,
// glissières, mobilier). Tout est posé dans le « repère de la halte » ; `ctx.dans(x)` dit si un objet appartient au
// tronçon en cours (un objet à cheval va dans le tronçon qui contient son centre).

import * as THREE from "three";
import { AL, AH, R } from "./atlas.js";

export const PI = Math.PI;
export const arr = (v) => Math.round(v * 100) / 100;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export function lisse(t) {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
}
/** Un nombre pseudo-aléatoire stable, fonction de la position (le même dans tous les tronçons). */
export function hash(a, b = 0) {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// ---------- Géométries partagées ----------

const ROUE = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 8);
const BOULE = new THREE.IcosahedronGeometry(1, 0);
const OEUF = new THREE.IcosahedronGeometry(1, 1);
const CONE = new THREE.ConeGeometry(1, 1, 6);
const TORE = new THREE.TorusGeometry(0.33, 0.03, 3, 10);
export const GEO = { ROUE, BOULE, OEUF, CONE, TORE };

// ---------- Outils de pose ----------

/** Un panneau plat dont l'image vient de l'atlas (région `r`), face vers +z local. */
export function panneau(c, mat, r, pose, l, h, couleur = 0xffffff) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
  c.poser(g, mat, couleur, pose, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Passe d'un repère local (x0, z0, ry) au repère de la halte. */
export function versMonde(x0, z0, ry, lx, lz) {
  const co = Math.cos(ry);
  const si = Math.sin(ry);
  return [x0 + lx * co + lz * si, z0 - lx * si + lz * co];
}

/** Un rectangle infranchissable, éventuellement tourné. */
export function rect(b, x, z, l, p, ry = 0, nature = "obstacle") {
  const pts = [[-l / 2, -p / 2], [l / 2, -p / 2], [l / 2, p / 2], [-l / 2, p / 2]].map(([u, v]) => versMonde(x, z, ry, u, v));
  for (let i = 0; i < 4; i++) {
    const [a1, b1] = pts[i];
    const [a2, b2] = pts[(i + 1) % 4];
    b.obstacle(a1, b1, a2, b2, nature);
  }
}

/** Un cylindre debout. */
export function cylY(c, mat, couleur, x, z, y1, y2, r1, r2 = r1, cotes = 8, options = {}) {
  const g = new THREE.CylinderGeometry(r2, r1, y2 - y1, cotes, 1, false);
  c.poser(g, mat, couleur, { x, y: (y1 + y2) / 2, z }, options);
  g.dispose();
}

/**
 * Un tronc de pyramide à base rectangulaire (cabine de voiture, capot, coque) : base `lb` × `wb` à y = 0, dessus
 * `lt` × `wt` décalé de `dx` à y = `h`, posé selon `pose`.
 */
export function tronc(c, mat, couleur, pose, lb, wb, lt, wt, dx, h, options = {}) {
  const g = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const haut = p.getY(i) > 0;
    p.setXYZ(i, haut ? p.getX(i) * lt + dx : p.getX(i) * lb, haut ? h : 0, p.getZ(i) * (haut ? wt : wb));
  }
  g.deleteAttribute("normal");
  g.computeVertexNormals();
  c.poser(g, mat, couleur, pose, options);
  g.dispose();
}

/** Un ruban horizontal (chaussée courbe) de x0 à x1 : centre fz(x), demi-largeur fd(x), posé à y. */
export function ruban(c, mat, couleur, x0, x1, fz, fd, y, pas = 1) {
  const xs = [];
  for (let x = x0; x < x1 - 1e-6; x += pas) xs.push(x);
  xs.push(x1);
  const pos = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i];
    const b = xs[i + 1];
    const za1 = fz(a) - fd(a);
    const za2 = fz(a) + fd(a);
    const zb1 = fz(b) - fd(b);
    const zb2 = fz(b) + fd(b);
    pos.push(a, 0, za1, a, 0, za2, b, 0, zb2, a, 0, za1, b, 0, zb2, b, 0, zb1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  c.poser(g, mat, couleur, { y }, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Une bande étroite (ligne peinte) le long d'une courbe z = fz(x), de x0 à x1, faite de boîtes. */
export function bande(c, x0, x1, fz, larg, h, y, couleur, mat, pas = 2, plein = 1) {
  const n = Math.max(1, Math.round((x1 - x0) / pas));
  const dx = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const a = x0 + i * dx;
    const b = a + dx;
    const za = fz(a);
    const zb = fz(b);
    const lg = Math.hypot(dx, zb - za) * plein;
    c.boite(lg + (plein === 1 ? 0.02 : 0), h, larg, couleur, { x: (a + b) / 2, y: y + h / 2, z: (za + zb) / 2, ry: -Math.atan2(zb - za, dx) }, mat, { crasse: false, nuance: 0.02 });
  }
}

/** Une surface extrudée le long de x (talus, merlon, glissière en béton) : profil [[z, y], ...], `centre` [z, y] intérieur. */
export function profilX(c, mat, couleur, x0, x1, pts, centre) {
  const pos = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [za, ya] = pts[i];
    const [zb, yb] = pts[i + 1];
    const nz = yb - ya;
    const ny = -(zb - za);
    const mz = (za + zb) / 2 - centre[0];
    const my = (ya + yb) / 2 - centre[1];
    const dehors = nz * mz + ny * my > 0;
    const A = [x0, ya, za];
    const B = [x1, ya, za];
    const C = [x1, yb, zb];
    const D = [x0, yb, zb];
    const tri = (p, q, r) => pos.push(...p, ...q, ...r);
    const sortant = -(zb - za) * ny + (yb - ya) * nz > 0;
    if (dehors === sortant) {
      tri(A, B, C);
      tri(A, C, D);
    } else {
      tri(A, C, B);
      tri(A, D, C);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  c.poser(g, mat, couleur, {}, { crasse: false, nuance: 0.02 });
  g.dispose();
}

/** Un quadrilatère (4 points), visible des deux côtés si la matière l'est. */
export function quad(c, mat, couleur, p, options = {}) {
  const pos = [];
  for (const k of [0, 1, 2, 0, 2, 3]) pos.push(...p[k]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  c.poser(g, mat, couleur, {}, { crasse: false, nuance: 0.03, ...options });
  g.dispose();
}

// ---------- Bords : grillages, glissières ----------

/**
 * Un grillage de `a` à `b` ([x, z]), en panneaux de ~3 m (texture de l'atlas), poteaux, obstacles. `trous` : intervalles
 * de distance depuis `a` sans panneau (brèches). `penche` : part des panneaux couchés par l'usure.
 */
export function grillage(ctx, a, b, o = {}) {
  const { c, M, dans } = ctx;
  const h = o.h ?? 2.0;
  const trous = o.trous ?? [];
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const L = Math.hypot(dx, dz);
  const n = Math.max(1, Math.round(L / 3));
  const pas = L / n;
  const ry = -Math.atan2(dz, dx);
  let debut = null;
  const fermer = (fin) => {
    if (debut === null) return;
    ctx.b.obstacle(a[0] + (dx * debut) / L, a[1] + (dz * debut) / L, a[0] + (dx * fin) / L, a[1] + (dz * fin) / L, o.nature ?? "grillage");
    debut = null;
  };
  for (let i = 0; i < n; i++) {
    const s = (i + 0.5) * pas;
    const xm = a[0] + (dx * s) / L;
    const zm = a[1] + (dz * s) / L;
    if (!dans(xm)) {
      fermer(i * pas);
      continue;
    }
    if (trous.some(([t1, t2]) => s > t1 && s < t2)) {
      fermer(i * pas);
      continue;
    }
    const couche = ctx.u > 0.55 && hash(xm, zm) < (o.penche ?? 0.12) * ctx.u;
    if (couche) {
      // un panneau couché au sol (on peut passer : brèche)
      panneau(c, M.enseignes, R.grillage, { x: xm, y: 0.05, z: zm, ry, rx: -PI / 2 + 0.1 }, pas, h, 0xc4c8c4);
      fermer(i * pas);
    } else {
      panneau(c, M.enseignes, R.grillage, { x: xm, y: h / 2, z: zm, ry }, pas, h, 0xc4c8c4);
      if (debut === null) debut = i * pas;
    }
    const xp = a[0] + (dx * i * pas) / L;
    const zp = a[1] + (dz * i * pas) / L;
    c.boite(0.06, h + 0.1, 0.06, 0x6f7a76, { x: xp, y: (h + 0.1) / 2, z: zp }, M.tole);
    if (o.barbele) c.boite(pas, 0.02, 0.02, 0x8a8a84, { x: xm, y: h + 0.15, z: zm, ry }, M.metal);
  }
  fermer(L);
}

/** Une glissière métallique le long de x, à z, de xa à xb (coupée aux bornes du tronçon). */
export function glissiere(ctx, xa, xb, z) {
  const { c, M, x0, x1, b } = ctx;
  const a = Math.max(xa, x0);
  const e = Math.min(xb, x1);
  if (e - a < 0.05) return;
  for (let x = Math.ceil(xa / 2) * 2; x < xb; x += 2) {
    if (x < x0 || x >= x1) continue;
    c.boite(0.1, 0.75, 0.1, 0x8d9497, { x, y: 0.375, z: z + 0.1 }, M.tole);
  }
  c.pave(a, 0.48, z - 0.04, e, 0.8, z + 0.04, 0x9aa1a3, M.tole, { crasse: false });
  b.obstacle(a, z, e, z, "glissière");
}

// ---------- Les voitures électriques ----------

const TEINTES = [0xe4e2dc, 0xcfd2d4, 0x2c3440, 0x1e2124, 0x8a2f2a, 0x3f6f7a, 0x9aa2a8, 0x5a6470, 0xd8d0bc, 0x46566a, 0xb9bec2, 0x6a3a4a];
export function teinte(i) {
  return TEINTES[((i % TEINTES.length) + TEINTES.length) % TEINTES.length];
}

/**
 * Une voiture électrique morte (épave), avant vers +x local. Options : type (« citadine », « berline », « suv »),
 * couleur, port (côté de la trappe de recharge : 1 = +z local, −1), brulee, rx, rz, y, ouverte, toitFeuilles.
 * Renvoie la position de la trappe dans le repère de la halte : [x, y, z].
 */
export function voiture(ctx, x, z, ry, o = {}) {
  const { u, M } = ctx;
  const k = o.k ?? ctx.c;
  const type = o.type ?? "berline";
  const L = type === "citadine" ? 3.9 : type === "suv" ? 4.75 : 4.65;
  const W = type === "suv" ? 1.95 : 1.84;
  const hc = type === "suv" ? 0.72 : 0.56;
  const hcab = type === "suv" ? 0.62 : 0.5;
  const brulee = !!o.brulee;
  let coul = o.couleur ?? 0xcfd2d4;
  if (brulee) coul = 0x3d3632;
  else coul = new THREE.Color(coul).lerp(new THREE.Color(0x8a8072), 0.1 + 0.3 * u).getHex();
  const plat = brulee ? -0.2 : u > 0.4 ? -0.07 : 0;
  const s = o.port ?? 1;
  const y0 = 0.3;
  k.repere({ x, y: plat + (o.y ?? 0), z, ry, rx: o.rx ?? 0, rz: o.rz ?? 0 }, () => {
    // La caisse, lisse, sans calandre ; le capot plongeant ; le bas de caisse noir
    k.boite(L, hc, W, coul, { y: y0 + hc / 2 }, M.satin);
    tronc(k, M.satin, coul, { x: L * 0.33, y: y0 + hc }, L * 0.3, W - 0.06, L * 0.24, W - 0.2, 0.05, 0.08);
    k.boite(L * 0.92, 0.14, W + 0.02, 0x2a2c2e, { y: y0 }, M.mat);
    // La cabine vitrée (toit panoramique) et sa bordure opaque
    const top = y0 + hc + hcab;
    if (brulee) {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.boite(0.08, hcab, 0.08, 0x2a2624, { x: -L * 0.06 + sx * L * 0.22, y: y0 + hc + hcab / 2, z: sz * (W / 2 - 0.2), rz: sx * 0.35 }, M.mat);
      k.boite(L * 0.4, 0.04, W - 0.4, 0x2e2a28, { x: -L * 0.1, y: top - 0.1, rz: 0.06 }, M.tole);
    } else {
      tronc(k, M.verre, 0xffffff, { x: -L * 0.05, y: y0 + hc }, L * 0.6, W - 0.12, L * 0.34, W - 0.38, -L * 0.06, hcab, { crasse: false });
      k.boite(L * 0.36, 0.05, W - 0.34, coul, { x: -L * 0.11, y: top + 0.02 }, M.satin);
      k.boite(L * 0.24, 0.01, W - 0.6, 0x3a4652, { x: -L * 0.11, y: top + 0.05 }, M.lisse);
      // Les sièges (et l'appuie-tête du conducteur)
      for (const sz of [-0.42, 0.42]) k.boite(0.5, 0.55, 0.5, 0x2a2b2c, { x: -0.05, y: y0 + hc + 0.05, z: sz }, M.mat);
      k.boite(1.0, 0.4, W - 0.4, 0x2a2b2c, { x: -L * 0.26, y: y0 + hc - 0.02 }, M.mat);
    }
    // Bandeaux lumineux avant (blanc) et arrière (rouge)
    k.boite(0.05, 0.06, W - 0.24, brulee ? 0x2a2624 : 0xdfe8ec, { x: L / 2 + 0.01, y: y0 + hc - 0.1 }, M.lisse);
    k.boite(0.05, 0.07, W - 0.16, brulee ? 0x2a2624 : 0x8a2a24, { x: -L / 2 - 0.01, y: y0 + hc - 0.08 }, M.lisse);
    // Les roues (pneus à plat avec l'usure)
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.poser(ROUE, M.mat, brulee ? 0x2a2828 : 0x242526, { x: sx * L * 0.33, y: 0.34, z: sz * (W / 2 - 0.12), rx: PI / 2, e: [1, 1, brulee ? 0.7 : u > 0.4 ? 0.82 : 1] }, { crasse: false });
    // La trappe de recharge, ouverte
    if (!brulee) k.boite(0.2, 0.2, 0.03, coul, { x: -L * 0.36 - 0.08, y: y0 + hc - 0.16, z: s * (W / 2 + 0.07), ry: s * 1.1 }, M.satin);
    // Poussière, feuilles, fientes sur le toit et le capot
    if (u > 0.35 && !brulee) for (let i = 0; i < 1 + Math.round(u * 2); i++) k.boite(k.entre(0.1, 0.22), 0.01, k.entre(0.08, 0.18), [0x6f6046, 0x5a5040, 0x6a7050][i % 3], { x: k.entre(-L * 0.25, L * 0.35), y: i % 2 ? top + 0.06 : y0 + hc + 0.09, z: k.entre(-0.6, 0.6), ry: k.hasard() * 3 }, M.mat, { crasse: false });
    // Portière ouverte
    if (o.ouverte) k.boite(1.0, 0.5, 0.05, coul, { x: 0.35 + 0.4, y: y0 + hc * 0.6, z: -s * (W / 2 + 0.42), ry: s * 0.9 }, M.satin);
    // Rouille de la carrosserie brûlée
    if (brulee) for (const sz of [-1, 1]) k.boite(L * 0.7, 0.3, 0.02, 0x6e3a22, { y: y0 + 0.25, z: sz * (W / 2 + 0.005) }, M.mat, { nuance: 0.1 });
  });
  if (!o.sansObstacle) rect(ctx.b, x, z, L, W, ry, o.nature ?? "épave");
  const [px, pz] = versMonde(x, z, ry, -L * 0.36, s * (W / 2 + 0.04));
  return [px, y0 + hc - 0.16 + plat, pz];
}

// ---------- Les bornes ----------

/**
 * Une borne « Watty Supercharge », écran vers +z local. `etat` du câble : « branche » (relié à `prise` [x, y, z]),
 * « coupe » (sectionné par les pillards de cuivre), « arrache ». `marche` : la dernière borne qui fonctionne.
 */
export function borne(ctx, x, z, ry, o = {}) {
  const { c, M } = ctx;
  const marche = !!o.marche;
  const etat = o.etat ?? "coupe";
  c.repere({ x, z, ry }, () => {
    c.boite(0.82, 0.14, 0.62, 0xb8b4aa, { y: 0.07 }, M.mat);
    c.boite(0.52, 2.0, 0.34, 0xe8e6e0, { y: 1.07 }, M.satin);
    c.boite(0.05, 1.8, 0.36, 0x1f4f8a, { x: -0.255, y: 1.02 }, M.satin);
    c.boite(0.62, 0.08, 0.44, 0xd2d0ca, { y: 2.11 }, M.satin, { crasse: false });
    c.boite(0.54, 0.04, 0.37, marche ? 0x9ff0ff : 0x4a6a78, { y: 2.04 }, M.lisse, { crasse: false });
    panneau(c, marche ? M.ecran : M.enseignes, marche ? R.borneOk : R.borneEcran, { y: 1.42, z: 0.172 }, 0.4, 0.32);
    panneau(c, M.enseignes, R.borneLogo, { y: 1.86, z: 0.172 }, 0.46, 0.23);
    panneau(c, M.enseignes, R.borneLogo, { y: 1.86, z: -0.172, ry: PI }, 0.46, 0.23);
    if (etat !== "arrache") c.boite(0.1, 0.24, 0.13, 0x2a2c2e, { x: 0.31, y: 1.1, z: 0.05 }, M.satin);
    else {
      // l'étui arraché : fils de couleur qui pendent
      for (const [dx, col] of [[0.27, 0x8a3a2a], [0.3, 0x2a5a8a], [0.33, 0xc8a23a]]) c.boite(0.015, c.entre(0.2, 0.4), 0.015, col, { x: dx, y: 1.0, z: 0.1, rz: c.entre(-0.3, 0.3) }, M.mat, { crasse: false });
    }
    // Les potelets de protection
    for (const sx of [-1, 1]) {
      c.boite(0.14, 0.9, 0.14, 0xc8a83a, { x: sx * 0.62, y: 0.45, z: 0.45 }, M.tole);
      c.boite(0.15, 0.1, 0.15, 0x2a2c2e, { x: sx * 0.62, y: 0.7, z: 0.45 }, M.tole, { crasse: false });
    }
  });
  const [hx, hz] = versMonde(x, z, ry, 0.31, 0.12);
  const noir = 0x1c1d1e;
  if (etat === "branche" && o.prise) {
    const [px, py, pz] = o.prise;
    const mx = (hx + px) / 2;
    const mz = (hz + pz) / 2;
    c.tube([hx, 1.0, hz], [mx + (hx - px) * 0.1, 0.12, mz], 0.025, noir, M.mat, 5);
    c.tube([mx + (hx - px) * 0.1, 0.12, mz], [px, py, pz], 0.025, noir, M.mat, 5);
  } else if (etat === "coupe") {
    // le moignon du câble, et le cuivre qui brille à la coupure
    const [bx, bz] = versMonde(x, z, ry, 0.42, 0.45);
    c.tube([hx, 1.0, hz], [bx, 0.35, bz], 0.026, noir, M.mat, 5);
    c.boite(0.04, 0.04, 0.04, 0xc87a3a, { x: bx, y: 0.33, z: bz }, M.metal, { crasse: false });
  }
  rect(ctx.b, x, z, 0.8, 0.6, ry, "borne de recharge");
}

// ---------- Mobilier et petits objets ----------

/** Un cône de chantier. */
export function cone(ctx, x, z, couche = false) {
  const { c, M } = ctx;
  if (couche) c.poser(CONE, M.satin, 0xd8622a, { x, y: 0.18, z, rz: PI / 2, ry: hash(x, z) * 3, e: [0.18, 0.6, 0.18] }, { crasse: false });
  else {
    c.poser(CONE, M.satin, 0xd8622a, { x, y: 0.33, z, e: [0.18, 0.62, 0.18] }, { crasse: false });
    c.boite(0.4, 0.04, 0.4, 0x2a2a2a, { x, y: 0.02, z }, M.mat, { crasse: false });
  }
}

/** Un potelet à sangle (file d'attente) ; renvoie le haut pour tendre la sangle. */
export function potelet(ctx, x, z, tombe = false) {
  const { c, M } = ctx;
  if (tombe) {
    c.boite(0.06, 0.06, 1.0, 0x9aa1a3, { x, y: 0.06, z, ry: hash(x, z) * 3 }, M.metal);
    cylY(c, M.tole, 0x2a2c2e, x, z, 0, 0.04, 0.17, 0.17, 8);
    return null;
  }
  cylY(c, M.metal, 0x9aa1a3, x, z, 0, 1.0, 0.035, 0.035, 6);
  cylY(c, M.tole, 0x2a2c2e, x, z, 0, 0.04, 0.17, 0.17, 8);
  return [x, 0.95, z];
}

/** Une trottinette électrique (couchée ou debout dans son socle), avant vers +x local. */
export function trottinette(ctx, x, z, ry, couchee = false) {
  const { c, M } = ctx;
  c.repere({ x, z, ry, rx: couchee ? PI / 2 - 0.1 : 0, y: couchee ? 0.12 : 0 }, () => {
    c.boite(0.95, 0.06, 0.16, 0x2a9a7a, { y: 0.14 }, M.satin);
    c.tube([0.42, 0.14, 0], [0.5, 1.05, 0], 0.025, 0x2a2c2e, M.metal, 5);
    c.boite(0.04, 0.04, 0.5, 0x2a2c2e, { x: 0.5, y: 1.05 }, M.metal);
    for (const dx of [-0.42, 0.45]) c.poser(TORE, M.mat, 0x222222, { x: dx, y: 0.11, e: 0.33 }, { crasse: false });
  });
}

/** Un vélo électrique, avant vers +x local. */
export function velo(ctx, x, z, ry, couche = false) {
  const { c, M } = ctx;
  c.repere({ x, z, ry, rx: couche ? PI / 2 - 0.15 : 0, y: couche ? 0.08 : 0 }, () => {
    for (const dx of [-0.52, 0.52]) c.poser(TORE, M.mat, 0x222222, { x: dx, y: 0.34 }, { crasse: false });
    c.tube([-0.52, 0.34, 0], [0.0, 0.75, 0], 0.025, 0x2a9a7a, M.tole, 5);
    c.tube([0.0, 0.75, 0], [0.42, 0.85, 0], 0.025, 0x2a9a7a, M.tole, 5);
    c.tube([0.0, 0.75, 0], [0.0, 0.3, 0], 0.03, 0x2a9a7a, M.tole, 5);
    c.tube([0.42, 0.85, 0], [0.52, 0.34, 0], 0.022, 0x2a2c2e, M.metal, 5);
    c.boite(0.04, 0.04, 0.5, 0x2a2c2e, { x: 0.42, y: 0.95 }, M.metal);
    c.boite(0.25, 0.06, 0.1, 0x222222, { x: -0.05, y: 0.82 }, M.mat);
    c.boite(0.36, 0.14, 0.12, 0x5a6a6a, { x: -0.24, y: 0.55, rz: 0.6 }, M.satin); // l'emplacement de la batterie (vide)
  });
}

/** Un fauteuil-œuf du lounge (coque blanche, coussin coloré), ouverture vers +x local. */
export function fauteuilOeuf(ctx, x, z, ry, coussin, renverse = false) {
  const { c, M } = ctx;
  c.repere({ x, z, ry, rz: renverse ? 1.35 : 0, y: renverse ? 0.2 : 0 }, () => {
    cylY(c, M.metal, 0xb8bcbe, 0, 0, 0, 0.32, 0.25, 0.06, 8);
    c.poser(OEUF, M.lisse, 0xeceae4, { x: -0.08, y: 0.95, e: [0.5, 0.68, 0.52] });
    c.boite(0.36, 0.55, 0.62, coussin, { x: 0.3, y: 0.78 }, M.mat);
    c.boite(0.5, 0.14, 0.6, coussin, { x: 0.25, y: 0.48 }, M.mat);
  });
}

/** Des étagères murales (dos vers −z local), avec des produits. */
export function etagere(ctx, x, z, ry, l, produits, pillee = 0.5) {
  const { c, M } = ctx;
  c.repere({ x, z, ry }, () => {
    for (const sx of [-1, 1]) c.boite(0.04, 1.8, 0.4, 0xd8d6d0, { x: (sx * l) / 2, y: 0.9 }, M.tole);
    for (const y of [0.3, 0.75, 1.2, 1.65]) {
      c.boite(l, 0.03, 0.4, 0xe2e0da, { y }, M.tole);
      for (let px = -l / 2 + 0.15; px < l / 2 - 0.1; px += 0.22) {
        if (c.hasard() < pillee) continue;
        const col = produits[Math.floor(c.hasard() * produits.length)];
        c.boite(0.16, c.entre(0.12, 0.26), 0.16, col, { x: px, y: y + 0.1, z: c.entre(-0.08, 0.08) }, M.satin, { crasse: false });
      }
    }
  });
}
