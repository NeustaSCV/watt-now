// Wattyland : ce qui revient partout — petits bâtiments, sols, clôtures, bancs, poubelles-mascottes, lampadaires,
// guirlandes d'ampoules (dont quelques-unes s'allument encore), peluches, braseros de survivants, végétation dosée.

import { THREE, C, M, TAU, PI, panneau, cyl, boule, obstacleRect } from "./outils.js";
import { PALETTE, mur, semerTouffes as semerA, touffes, lierre as lierreA, debris as debrisA, jonchee as joncheeA } from "../commun/atelier.js";

// La végétation et le menu désordre coûtent cher en triangles : on les dose.
export const lierre = (c, x, y0, z, ry, l, h, n) => lierreA(c, x, y0, z, ry, l, h, Math.round(n * 0.4));
export const semerTouffes = (c, x1, z1, x2, z2, n, t, y) => semerA(c, x1, z1, x2, z2, Math.round(n * 0.5), t, y);
export const debris = (c, x1, z1, x2, z2, n, t, y) => debrisA(c, x1, z1, x2, z2, Math.round(n * 0.6), t, y);
export const jonchee = (c, x1, z1, x2, z2, n, t, y) => joncheeA(c, x1, z1, x2, z2, Math.round(n * 0.6), t, y);

/**
 * Un petit bâtiment d'un niveau : murs (ceux du sud et de l'est coupés à `coupe`, le haut part dans la couche `k`),
 * sol. `ouv` : { s, e, n, o } listes d'ouvertures { at, l, bas, haut, type } où `at` est la coordonnée monde du centre
 * (x pour les murs sud et nord, z pour les murs est et ouest).
 */
export function pavillon(ctx, k, spec) {
  const { b, c } = ctx;
  const { x1, z1, x2, z2, h = 3.2, coupe = 1.0, ep = 0.25, couleur, mat = M.mat(), interieur = null, ouv = {}, sol = null, solMat = null, bris = 0.5 } = spec;
  const e2 = ep / 2;
  const cotes = [
    ["s", [x1 - e2, z2], [x2 + e2, z2], true, (q) => q - (x1 - e2)],
    ["e", [x2, z2], [x2, z1], true, (q) => z2 - q],
    ["n", [x2 + e2, z1], [x1 - e2, z1], false, (q) => x2 + e2 - q],
    ["o", [x1, z1], [x1, z2], false, (q) => q - z1],
  ];
  for (const [cle, a, bb, coupee, versU] of cotes) {
    const o = (ouv[cle] ?? []).map((q) => ({ bris, cadre: q.cadre ?? 0xd9d2bf, ...q, u: versU(q.at) }));
    if (!coupee) {
      mur(c, a, bb, { h, ep, couleur, mat, ouvertures: o, batiment: b, interieur });
      continue;
    }
    mur(c, a, bb, { h: coupe, ep, couleur, mat, ouvertures: o.map((q) => ({ ...q, type: "vide" })), batiment: b, interieur });
    mur(k, a, bb, { y0: coupe, h: h - coupe, ep, couleur, mat, ouvertures: o.map((q) => ({ ...q, bas: Math.max(0, q.bas - coupe), haut: q.haut - coupe, appui: q.bas > coupe + 0.05 })), interieur });
  }
  if (sol) c.pave(x1, 0, z1, x2, 0.05, z2, sol, solMat ?? M.mat(), { crasse: false, nuance: 0.03 });
}

/** Un toit plat : dalle, acrotère, débord ; `trou` : une part effondrée (le ciel entre). */
export function toitPlat(k, x1, z1, x2, z2, h, couleur = 0x6e6a64, { debord = 0.3, acrotere = 0.35, couleurAcrotere = null, trou = null } = {}) {
  const ca = couleurAcrotere ?? couleur;
  if (!trou) k.pave(x1 - debord, h, z1 - debord, x2 + debord, h + 0.18, z2 + debord, couleur, M.mat(), { crasse: false });
  else {
    // La dalle en bandes, dont une part manque
    const n = Math.max(2, Math.round((x2 - x1) / 1.5));
    for (let i = 0; i < n; i++) {
      const a = x1 - debord + ((x2 - x1 + 2 * debord) * i) / n;
      const bx = x1 - debord + ((x2 - x1 + 2 * debord) * (i + 1)) / n;
      const xm = (a + bx) / 2;
      if (xm > trou.x1 && xm < trou.x2) {
        k.pave(a, h, z1 - debord, bx, h + 0.18, trou.z1, couleur, M.mat(), { crasse: false });
        k.pave(a, h, trou.z2, bx, h + 0.18, z2 + debord, couleur, M.mat(), { crasse: false });
        k.boite(bx - a, 0.12, trou.z2 - trou.z1, couleur, { x: xm, y: h - 0.9, z: (trou.z1 + trou.z2) / 2 + 0.3, rx: 0.5, rz: (i % 2 ? 1 : -1) * 0.15 }, M.mat());
      } else k.pave(a, h, z1 - debord, bx, h + 0.18, z2 + debord, couleur, M.mat(), { crasse: false });
    }
  }
  if (acrotere > 0) {
    k.pave(x1 - debord, h + 0.18, z1 - debord, x2 + debord, h + 0.18 + acrotere, z1 - debord + 0.15, ca, M.mat());
    k.pave(x1 - debord, h + 0.18, z2 + debord - 0.15, x2 + debord, h + 0.18 + acrotere, z2 + debord, ca, M.mat());
    k.pave(x1 - debord, h + 0.18, z1 - debord, x1 - debord + 0.15, h + 0.18 + acrotere, z2 + debord, ca, M.mat());
    k.pave(x2 + debord - 0.15, h + 0.18, z1 - debord, x2 + debord, h + 0.18 + acrotere, z2 + debord, ca, M.mat());
  }
}

/** Des dalles posées sur un rectangle, avec des manques où l'herbe a repris. `garder(x, z)` filtre les dalles. */
export function dallage(ctx, x1, z1, x2, z2, couleur = C.beton, pas = 2, garder = () => true, manque = null) {
  const { c, u } = ctx;
  const pts = [];
  const pm = manque ?? 0.06 + 0.16 * u;
  for (let x = x1; x < x2 - 0.05; x += pas)
    for (let z = z1; z < z2 - 0.05; z += pas) {
      const xb = Math.min(x2, x + pas);
      const zb = Math.min(z2, z + pas);
      const cx = (x + xb) / 2;
      const cz = (z + zb) / 2;
      if (!garder(cx, cz)) continue;
      if (c.hasard() < pm) {
        pts.push([cx + c.entre(-0.5, 0.5), cz + c.entre(-0.5, 0.5)]);
        continue;
      }
      c.pave(x + 0.03, -0.02, z + 0.03, xb - 0.03, 0.03, zb - 0.03, couleur, M.beton(), { nuance: 0.07, crasse: false });
      if (c.hasard() < 0.1 + 0.25 * u) pts.push([x + 0.03, z + c.entre(0, pas)]);
    }
  touffes(c, pts.slice(0, 18));
}

/** Des plaques d'herbe plus verte que le terrain, en carreaux irréguliers. */
export function pelouse(ctx, x1, z1, x2, z2, garder = () => true, densite = 0.7) {
  const { c } = ctx;
  const pas = 4;
  for (let x = x1; x < x2 - 0.1; x += pas)
    for (let z = z1; z < z2 - 0.1; z += pas) {
      const cx = x + pas / 2;
      const cz = z + pas / 2;
      if (!garder(cx, cz) || c.hasard() > densite) continue;
      const t = [C.herbe, C.herbeSombre, PALETTE.herbeSeche, 0x6f8f4c][Math.floor(c.hasard() * 4)];
      c.boite(pas * c.entre(0.8, 1.25), 0.03, pas * c.entre(0.8, 1.25), t, { x: cx, y: 0.0, z: cz, ry: c.entre(-0.3, 0.3) }, M.mat(), { crasse: false, nuance: 0.05 });
    }
}

/** La clôture du parc : poteaux à boule dorée et panneaux de grille (texture), certains tombés. */
export function cloture(ctx, x1, x2, z, sauf = []) {
  const { b, c, u } = ctx;
  const pas = 2.5;
  let debut = null;
  for (let x = x1; x < x2 - 0.1; x += pas) {
    const xb = Math.min(x2, x + pas);
    const xm = (x + xb) / 2;
    const hors = sauf.some(([a, bb]) => xm > a && xm < bb);
    if (hors) {
      if (debut !== null) b.obstacle(debut, z, x, z, "clôture");
      debut = null;
      continue;
    }
    c.boite(0.14, 2.4, 0.14, C.fonte, { x, y: 1.2, z }, M.tole());
    boule(c, x, 2.5, z, 0.12, C.orTerni, M.metal());
    const r = c.hasard();
    if (r < 0.1 + 0.12 * u) {
      // Panneau tombé dans l'herbe
      panneau(c, "grille", xm + c.entre(-0.3, 0.3), 0.06, z + (r < 0.06 ? 1.2 : -1.2), xb - x, 2.2, c.entre(-0.2, 0.2), -PI / 2);
      if (debut !== null) b.obstacle(debut, z, x, z, "clôture");
      debut = null;
      continue;
    }
    const penche = r < 0.25 + 0.1 * u ? c.entre(-0.18, 0.18) : 0;
    panneau(c, "grille", xm, 1.1, z + penche * 1.1, xb - x - 0.05, 2.2, 0, penche);
    if (debut === null) debut = x;
  }
  if (debut !== null) b.obstacle(debut, z, x2, z, "clôture");
}

/** Un banc public : pieds en fonte, lattes de bois ; renversé ou à lattes manquantes. */
export function banc(ctx, x, z, ry = 0, renverse = false) {
  const { c } = ctx;
  c.repere({ x, z, ry, rx: renverse ? -PI / 2 + 0.1 : 0, y: renverse ? 0.42 : 0 }, () => {
    for (const s of [-0.75, 0.75]) {
      c.boite(0.08, 0.45, 0.5, C.fonte, { x: s, y: 0.22, z: 0.02 }, M.tole());
      c.boite(0.08, 0.5, 0.08, C.fonte, { x: s, y: 0.65, z: -0.24, rx: -0.15 }, M.tole());
    }
    for (let i = 0; i < 3; i++) if (c.hasard() > 0.15) c.boite(1.8, 0.04, 0.12, C.boisGris, { y: 0.46, z: -0.15 + i * 0.15 }, M.mat(), { nuance: 0.08 });
    for (let i = 0; i < 2; i++) if (c.hasard() > 0.2) c.boite(1.8, 0.11, 0.035, C.boisGris, { y: 0.7 + i * 0.16, z: -0.28 - i * 0.02, rx: -0.15 }, M.mat(), { nuance: 0.08 });
  });
}

/** Une poubelle-mascotte : un petit Watty à la bouche grande ouverte (« Nourrissez-moi ! »). */
export function poubelle(ctx, x, z, ry = 0, tombee = false) {
  const { b, c } = ctx;
  c.repere({ x, z, ry, rz: tombee ? PI / 2 - 0.1 : 0, y: tombee ? 0.32 : 0 }, () => {
    c.boite(0.62, 0.78, 0.5, C.canard, { y: 0.39 }, M.satin(), { nuance: 0.06 });
    c.boite(0.64, 0.2, 0.52, C.creme, { y: 0.88 }, M.satin());
    c.boite(0.2, 0.08, 0.14, C.orTerni, { y: 1.02 }, M.metal());
    c.boite(0.36, 0.2, 0.02, C.noir, { y: 0.48, z: 0.25 }, M.mat()); // la bouche
    for (const s of [-0.13, 0.13]) c.boite(0.07, 0.09, 0.02, C.noir, { x: s, y: 0.68, z: 0.25 }, M.mat());
    panneau(c, "ecaille", 0.05, 0.4, 0.262, 0.5, 0.5, 0, 0);
  });
  if (!tombee) b.obstacle(x - 0.3, z, x + 0.3, z, "poubelle");
}

/** Un lampadaire de fête : fût en fonte, crosse, globe ; renvoie le point d'accroche des guirlandes. */
export function lampadaire(ctx, x, z, h = 4.2, penche = 0) {
  const { c } = ctx;
  c.repere({ x, z, rz: penche }, () => {
    cyl(c, 0, 0.25, 0, 0.16, 0.14, 0.5, C.fonte, M.tole(), 8);
    cyl(c, 0, h / 2, 0, 0.07, 0.05, h, C.fonte, M.tole(), 6);
    c.boite(0.5, 0.05, 0.05, C.fonte, { y: h - 0.2 }, M.tole());
    boule(c, 0, h + 0.15, 0, 0.2, 0xd8d2c0, M.lisse(), [1, 1.2, 1]);
    cyl(c, 0, h + 0.4, 0, 0.12, 0.02, 0.2, C.fonte, M.tole(), 6);
  });
  ctx.b.obstacle(x - 0.15, z, x + 0.15, z, "lampadaire");
  return [x - Math.sin(penche) * (h - 0.2), Math.cos(penche) * (h - 0.2), z];
}

const TEINTES_AMPOULES = [0xffe2a0, 0xff6f5a, 0x8cff9a, 0x8ac8ff, 0xffd84a, 0xff8ad0];
const AMPOULE_MORTE = new THREE.OctahedronGeometry(0.06, 0);

/**
 * Une guirlande d'ampoules entre deux points [x, y, z], avec une flèche (creux) ; `vivantes` : la part des ampoules
 * qui s'allument encore (elles vont dans le maillage animé). `cassee` : le fil a lâché d'un côté, il pend.
 */
export function guirlande(ctx, a, b, fleche = 0.8, vivantes = 0.3, cassee = false, k = null) {
  const c = k ?? ctx.c;
  const L = Math.hypot(b[0] - a[0], b[2] - a[2]);
  const n = Math.max(4, Math.round(L / 0.55));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    let p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - fleche * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t];
    if (cassee) {
      // Accroché en a seulement : le fil retombe à la verticale, puis traîne au sol
      const d = t * L;
      p = [a[0] + (b[0] - a[0]) * Math.min(t, 0.12), Math.max(0.03, a[1] - d * 0.85), a[2] + (b[2] - a[2]) * Math.min(t, 0.12) + Math.max(0, d - a[1]) * 0.6];
    }
    pts.push(p);
  }
  for (let i = 0; i < n; i++) c.poutre(pts[i], pts[i + 1], 0.022, 0x2a2826, M.mat());
  for (let i = 1; i < n; i++) {
    const p = pts[i];
    const r = c.hasard();
    const teinte = TEINTES_AMPOULES[i % TEINTES_AMPOULES.length];
    if (!cassee && !k && r < vivantes) ctx.amp.push({ x: p[0], y: p[1] - 0.09, z: p[2], couleur: teinte });
    else if (r < 0.82) c.poser(AMPOULE_MORTE, M.satin(), new THREE.Color(teinte).lerp(new THREE.Color(0x8a8578), 0.6).getHex(), { x: p[0], y: p[1] - 0.09, z: p[2], e: [1, 1.4, 1] }, { crasse: false, nuance: 0.05 });
  }
}

/**
 * Le maillage des ampoules qui marchent encore : chacune clignote à son rythme, comme un faux contact (on met à jour
 * la couleur de ses sommets). Un seul appel de dessin pour toutes.
 */
export function ampoulesVivantes(ampoules) {
  if (!ampoules.length) return null;
  const base = new THREE.OctahedronGeometry(0.1, 0);
  const nv = base.attributes.position.count;
  const pos = new Float32Array(ampoules.length * nv * 3);
  const col = new Float32Array(ampoules.length * nv * 3);
  const teintes = [];
  const c = new THREE.Color();
  ampoules.forEach((a, i) => {
    c.setHex(a.couleur);
    teintes.push([c.r, c.g, c.b]);
    for (let v = 0; v < nv; v++) {
      pos[(i * nv + v) * 3] = base.attributes.position.getX(v) + a.x;
      pos[(i * nv + v) * 3 + 1] = base.attributes.position.getY(v) * 1.35 + a.y;
      pos[(i * nv + v) * 3 + 2] = base.attributes.position.getZ(v) + a.z;
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true });
  const m = new THREE.Mesh(g, mat);
  m.name = "ampoules qui clignotent";
  // Chaque ampoule : une fréquence et une phase à elle, et quelques-unes presque mortes
  const rythmes = ampoules.map((_, i) => [0.6 + ((i * 37) % 11) * 0.21, (i * 2.399) % TAU, (i * 13) % 7 === 0 ? 0.85 : 0.15]);
  const etat = new Array(ampoules.length).fill(-1);
  const poser = (i, f) => {
    const [r, gg, bb] = teintes[i];
    const k = 0.18 + 0.82 * f;
    for (let v = 0; v < nv; v++) {
      col[(i * nv + v) * 3] = r * k;
      col[(i * nv + v) * 3 + 1] = gg * k;
      col[(i * nv + v) * 3 + 2] = bb * k;
    }
  };
  m.userData.animer = (t) => {
    let change = false;
    for (let i = 0; i < ampoules.length; i++) {
      const [f, p, seuil] = rythmes[i];
      const s = Math.sin(t * f + p) + 0.55 * Math.sin(t * f * 3.7 + p * 2) + 0.3 * Math.sin(t * 23 + i);
      const on = s > seuil ? 1 : 0;
      if (on !== etat[i]) {
        etat[i] = on;
        poser(i, on);
        change = true;
      }
    }
    if (change) g.attributes.color.needsUpdate = true;
  };
  m.userData.animer(0);
  return m;
}

/** Une petite peluche de Watty (corps bleu canard, tête crème, borne dorée). */
export function peluche(c, x, y, z, s = 1, ry = 0, rx = 0, rz = 0, couleur = C.peluche) {
  c.repere({ x, y, z, ry, rx, rz, e: s }, () => {
    c.boite(0.2, 0.26, 0.14, couleur, { y: 0.13 }, M.mat(), { crasse: false, nuance: 0.08 });
    c.boite(0.21, 0.07, 0.15, C.creme, { y: 0.27 }, M.mat(), { crasse: false });
  });
}

/** Un brasero de survivants : demi-fût, braises, bûches, couchages, et la lumière du feu. */
export function brasero(ctx, x, z, y0 = 0, nature = "feu de survivants") {
  const { c, b } = ctx;
  cyl(c, x, y0 + 0.35, z, 0.32, 0.34, 0.7, C.rouilleSombre, M.tole(), 8, {}, true);
  for (let i = 0; i < 7; i++) c.boite(0.12, 0.08, 0.1, i % 2 ? 0xff7a2a : 0xd2451c, { x: x + c.entre(-0.18, 0.18), y: y0 + 0.6, z: z + c.entre(-0.18, 0.18), ry: c.hasard() * 3 }, M.mat(), { crasse: false });
  c.boite(0.14, 0.12, 0.12, 0xffb050, { x, y: y0 + 0.66, z }, M.ampoule(), { crasse: false });
  for (let i = 0; i < 3; i++) c.boite(0.7, 0.12, 0.12, C.boisSombre, { x: x + 0.7 + i * 0.05, y: y0 + 0.06 + i * 0.12, z: z + 0.3 - i * 0.2, ry: c.hasard() }, M.mat());
  c.boite(1.6, 0.01, 1.6, C.suie, { x, y: y0 + 0.01, z, ry: 0.4 }, M.mat(), { crasse: false });
  b.lumiere(x, y0 + 1.1, z, 0xff8a3d, 9, 13, nature);
}

/** Un couchage de survivant : matelas de mousse, couverture, sac. */
export function couchage(c, x, z, ry, y0 = 0) {
  c.repere({ x, z, ry, y: y0 }, () => {
    c.boite(0.75, 0.1, 1.9, 0x6a6650, { y: 0.05 }, M.mat(), { nuance: 0.08 });
    c.boite(0.8, 0.06, 1.1, [0x7a4a3a, 0x4f6070, 0x6d6a3f][Math.floor(c.hasard() * 3)], { y: 0.13, z: 0.3, ry: 0.1 }, M.mat(), { nuance: 0.08 });
    c.boite(0.4, 0.3, 0.3, 0x5a5440, { x: 0.1, y: 0.15, z: -1.15 }, M.mat());
  });
}

/** Une caisse en bois. */
export function caisse(c, x, z, s = 0.5, couleur = C.bois, y = 0, ry = 0) {
  c.boite(s, s, s, couleur, { x, y: y + s / 2, z, ry }, M.mat(), { nuance: 0.08 });
}

export { obstacleRect };
