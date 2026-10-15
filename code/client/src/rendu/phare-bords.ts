// Les bords de la grève du phare (0.10, R52 « un lieu ne s'arrête jamais net » ; essai sur l'iPhone du 2026-10-15) :
// « Comme le décor s'arrête net, personne n'imagine qu'il y a quelque chose après » (le porteur). Ce que le jeu ajoute
// autour de la crique du modèle (batiments/phare/, jamais modifié ici) :
//
// - à l'ouest, la côte continue hors du lot : la falaise, la grève qui se resserre, et le sentier côtier dessiné (sable
//   tassé bordé de pierres et de bornes blanchies, comme le chemin des douaniers du plateau) qui part du panneau, près
//   de l'eau, longe le pied de la falaise jusqu'à la sortie, puis monte par des marches taillées dans le rocher et se perd
//   dans la lande ; au sud de la sortie, un chaos de rochers ferme la grève et l'eau (commun/src/phare.ts, ROCHERS_OUEST) ;
// - à l'est, un éboulis de gros rochers tombés de la falaise ferme la plage jusque dans l'eau (EBOULIS_EST) ;
// - la mer : claire sur la bande d'eau peu profonde où l'on marche, plus sombre au-delà, avec une ligne d'écume là où
//   l'on perd pied ;
// - le panneau du sentier côtier (ECRITEAU_SENTIER ; E-12) : grand, peint clair, éclairé la nuit par la lanterne des
//   panneaux de sortie, au-dessus de lui (rendu/lanterne-panneau.ts ; une source de la réserve de lumières : lumieresPhare).
//
// Le coût : la côte, le sentier, les rochers sont fondus dans le maillage du sol du modèle, la mer dans le sien, l'écume
// dans la sienne (aucun appel de dessin de plus) ; le panneau et sa lanterne ont chacun leur maillage (deux appels).
// Les profils de la falaise sont ceux du modèle (et de la maquette du cargo, qui les reproduit), prolongés.

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
// @ts-ignore — le modèle est en JavaScript (session « bâtiments »), sans déclaration de types.
import { hauteurSol } from "../batiments/phare/modele.js";
// @ts-ignore — l'atelier des modèles (session « bâtiments »), sans déclaration de types.
import { Chantier } from "../batiments/commun/atelier.js";
import { EBOULIS_EST, ECRITEAU_SENTIER, LARGEUR_EAU, ROCHERS_OUEST, auModele, jeu } from "../../../commun/src/phare.ts";
import { poserLanterne, type LanternePanneau, type PoseLanterne } from "./lanterne-panneau.ts";
import type { SourceLumiere } from "./lumieres.ts";

// ---------- Les profils de la côte (ceux du modèle, prolongés à l'ouest comme dans la maquette du cargo) ----------

const MER_Y = -9;
const PROFIL_D = [0, 0.6, 1.3, 2.0, 2.8, 3.6, 5.0];
const PROFIL_Y = [0, -1.6, -4.2, -6.6, -8.4, -9.6, -10.4];
const CRIQUE_D = [0, 0.6, 1.5, 2.3, 3.0, 3.6];
const CRIQUE_Y = [0, -2.0, -5.0, -7.4, -8.4, -8.7];
const lisse = (a: number, b: number, v: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));

/**
 * La crique (0 à 1) : celle du modèle dans le lot (au bord ouest du lot, x − 30, elle vaut déjà 2/3 : la grève y passe
 * sous l'eau) ; au-delà, le pied de la falaise reste une banquette mouillée qui s'efface vers x − 46.
 */
function crique(x: number): number {
  return x >= -30 ? lisse(-31, -29.5, x) * (1 - lisse(-3.5, -1, x)) : lisse(-31, -29.5, -30) * lisse(-46, -30, x);
}
function largeurGreve(x: number): number {
  if (x < -20) return 8;
  if (x < -12) return 8 + (0.6 * (x + 20)) / 8;
  return 8.6;
}
/** L'arête de la falaise (z) à ce x : celle du modèle. */
export function bordFalaise(x: number): number {
  const t = Math.min(1, Math.max(0, (x - 10) / 4));
  const base = 12.6 + (16.6 - 12.6) * t * t * (3 - 2 * t);
  return base + 0.35 * Math.sin(0.9 * x + 1) + 0.2 * Math.sin(2.3 * x);
}
function profil(x: number): { D: number[]; Y: number[]; k: number } {
  const k = crique(x);
  const Dc = [...CRIQUE_D, 3.6 + largeurGreve(x)];
  const Yc = [...CRIQUE_Y, -9.05];
  return { D: PROFIL_D.map((d, i) => d * (1 - k) + Dc[i]! * k), Y: PROFIL_Y.map((y, i) => y * (1 - k) + Yc[i]! * k), k };
}
/** Le bord de l'eau (z) à ce x : là où le profil passe sous la mer. */
export function bordEauCote(x: number): number {
  const { D, Y } = profil(x);
  for (let n = 1; n < D.length; n++) if (Y[n]! <= MER_Y) return bordFalaise(x) + D[n - 1]! + ((D[n]! - D[n - 1]!) * (Y[n - 1]! - MER_Y)) / (Y[n - 1]! - Y[n]!);
  return bordFalaise(x) + D[D.length - 1]!;
}
/** Le sol de la côte (sans le bruit des facettes) : celui du modèle dans le lot, celui du prolongement au-delà. */
export function solCote(x: number, z: number): number {
  if (x >= -30) return (hauteurSol as (x: number, z: number) => number)(x, z);
  const { D, Y } = profil(x);
  const d = z - bordFalaise(x);
  if (d <= 0) return 0;
  for (let i = 1; i < D.length; i++) if (d <= D[i]!) return Y[i - 1]! + ((Y[i]! - Y[i - 1]!) * (d - D[i - 1]!)) / (D[i]! - D[i - 1]!);
  return Y[Y.length - 1]!;
}
/** La distance à l'arête où le profil descend à `y` (sur la paroi). */
function distanceA(x: number, y: number): number {
  const { D, Y } = profil(x);
  for (let i = 1; i < D.length; i++) if (Y[i]! <= y) return D[i - 1]! + ((D[i]! - D[i - 1]!) * (Y[i - 1]! - y)) / (Y[i - 1]! - Y[i]!);
  return D[D.length - 1]!;
}
/** Où l'on perd pied (z) : la ligne du large (le bord de l'eau du modèle, 30 cm en deçà, reculé de LARGEUR_EAU). */
export function zLarge(x: number): number {
  return bordEauCote(x) - 0.3 + LARGEUR_EAU;
}

// ---------- Les couleurs ----------

const HERBE = 0x8a9658;
const GALETS = [0xa39a88, 0x8f8676];
const GRANITS = [0x7b776f, 0x6e6b63, 0x625f58, 0x86837b];
const MOUILLE = 0x55524b;
const BATTUE = 0x7a6650; // la terre battue du sentier sur les galets, plus sombre qu'eux (les pierres de bordure, claires)
const TERRE = 0xa8957a; // la terre battue du chemin des douaniers (le modèle)
const BORNE = 0xe2ddd0;
const BORNE_ROUGE = 0xc8362b;

const ROCHE = new THREE.DodecahedronGeometry(1, 0);
const CAILLOU = new THREE.OctahedronGeometry(1, 0);
/** Une plaque d'écume à plat (deux triangles : l'écume du modèle est en boîtes, douze). */
const PLAQUE = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const CLE = new THREE.MeshBasicMaterial(); // la clé du lot du chantier (sa matière n'est pas utilisée)

type Ch = {
  poser(g: THREE.BufferGeometry, m: THREE.Material, c: number, pose?: Record<string, unknown>, o?: Record<string, unknown>): Ch;
  boite(l: number, h: number, p: number, c: number, pose?: Record<string, unknown>, m?: THREE.Material, o?: Record<string, unknown>): Ch;
  poutre(a: number[], b: number[], s: number, c: number, m?: THREE.Material, o?: Record<string, unknown>): Ch;
  hasard(): number;
  entre(a: number, b: number): number;
  lots: Map<THREE.Material, THREE.BufferGeometry[]>;
};
const SANS = { crasse: false, nuance: 0.06 };

/** Un rocher de granit à facettes (comme ceux du modèle, sans lichen). */
function rocher(c: Ch, x: number, y: number, z: number, s: number, ton: number, elance = 1): void {
  const ex = s * c.entre(1, 1.5);
  const ey = s * c.entre(0.55, 0.85) * elance;
  const ez = s * c.entre(0.9, 1.3);
  c.poser(ROCHE, CLE, ton, { x, y, z, rx: c.entre(-0.3, 0.3), ry: c.hasard() * 3, rz: c.entre(-0.3, 0.3), e: [ex, ey, ez] }, { crasse: false, nuance: 0.12 });
}

// ---------- La côte à l'ouest du lot ----------

/** La falaise, la grève qui se resserre et le fond, de l'ouest du lot (x − 30) jusqu'à x − 100 : des facettes coloriées. */
function coteOuest(p: number[], col: number[], alea: () => number): void {
  const X: number[] = [];
  for (let x = -30; x > -42; x -= 1) X.push(x);
  for (let x = -42; x > -60; x -= 2.5) X.push(x);
  X.push(-60, -72, -86, -100);
  const V = X.map((x0, i) => {
    const { D, Y, k } = profil(x0);
    const bz = bordFalaise(x0);
    const bord = i === 0;
    const rang: [number, number, number][] = [[x0, -0.02, 11.5]];
    for (let n = 0; n < D.length; n++) {
      const paroi = n >= 1 && n <= 5 && !bord;
      const x = paroi ? x0 + (alea() - 0.5) * 0.5 : x0;
      const y = Y[n]! + (paroi ? (alea() - 0.5) * (n >= 4 ? 0.3 : 1.0) * (1 - 0.7 * k) : 0);
      rang.push([x, Math.min(0, y), bz + D[n]! + (paroi ? (alea() - 0.5) * 0.4 : 0)]);
    }
    const zDernier = bz + D[6]!;
    for (let n = 1; n <= 3; n++) rang.push([x0, -10.8 * (1 - k) + (-9.35 - 0.3 * n) * k - n * 0.3, zDernier + ((26 - zDernier) * n) / 3]);
    rang.push([x0, -12, 60]);
    return rang;
  });
  const c = new THREE.Color();
  for (let i = 0; i < X.length - 1; i++) {
    const k = crique((X[i]! + X[i + 1]!) / 2);
    for (let j = 0; j < V[i]!.length - 1; j++) {
      const a = V[i]![j]!, b = V[i + 1]![j]!, cc = V[i]![j + 1]!, d = V[i + 1]![j + 1]!;
      // Vers l'ouest, les colonnes vont décroissant : (a, b, cc) et (b, d, cc) regardent vers le haut et le large.
      for (const t of [[a, b, cc], [b, d, cc]] as [number, number, number][][]) {
        const ys = t.map((q) => q[1]);
        const cy = (ys[0]! + ys[1]! + ys[2]!) / 3;
        const r = alea();
        let h: number;
        if (Math.min(...ys) > -0.05) h = r < 0.5 ? HERBE : 0x95a05e;
        else if (cy > -1.6) h = r < 0.4 ? 0xb59d52 : r < 0.55 ? 0x7f8a52 : 0x938e83;
        else if (cy > -7.4) h = GRANITS[Math.floor(r * GRANITS.length)]!;
        else if (k > 0.25 && cy > MER_Y - 0.5 && cy < MER_Y + 1.2) h = GALETS[r < 0.5 ? 0 : 1]!;
        else if (cy > MER_Y - 0.4) h = r < 0.35 ? 0x4f5a3a : MOUILLE;
        else h = cy > -9.9 ? 0x48463f : 0x3a4540;
        c.setHex(h).offsetHSL(0, 0, (alea() - 0.5) * 0.04);
        for (const q of t) {
          p.push(...q);
          col.push(c.r, c.g, c.b);
        }
      }
    }
  }
}

// ---------- Le sentier côtier ----------

/** Le tracé du sentier sur les galets (repère du modèle) : du panneau, près de l'eau, à la sortie, puis au pied des marches. */
const PANNEAU_MODELE = auModele(ECRITEAU_SENTIER.x, ECRITEAU_SENTIER.z);
const TRACE_GREVE: [number, number][] = [
  [PANNEAU_MODELE.x - 0.1, PANNEAU_MODELE.z - 0.6],
  [-26.8, 20.2],
  [-27.0, 18.6],
  [-27.7, 17.2],
  [-29.6, 16.9],
  [-30.5, 16.1],
  [-31.5, 15.75],
];
/** Les marches taillées dans la falaise : du pied (y − 8,6) à la lande, en allant vers l'ouest. */
const MARCHES = { x0: -31.9, pas: 0.42, n: 24, bas: -8.6 } as const;
/** La hauteur du dessus d'une marche. */
const hauteurMarche = (i: number) => MARCHES.bas * (1 - (i + 0.5) / MARCHES.n);
/** Le sol du sentier : les galets, ou, hors du lot, la banquette au pied de la falaise (au ras de l'eau). */
const solSentier = (x: number, z: number) => Math.max(solCote(x, z), MER_Y + 0.25);

/** Un ruban posé sur le sol (des quadrilatères), le long d'un tracé, de couleur `ton`. */
function ruban(p: number[], col: number[], trace: [number, number][], largeur: number, ton: number, sol: (x: number, z: number) => number, haut: number, alea: () => number, fondu?: number): void {
  // Le tracé, rééchantillonné tous les 50 cm.
  const pts: [number, number][] = [];
  for (let i = 0; i < trace.length - 1; i++) {
    const [x1, z1] = trace[i]!;
    const [x2, z2] = trace[i + 1]!;
    const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, z2 - z1) / 0.5));
    for (let k = 0; k < n; k++) pts.push([x1 + ((x2 - x1) * k) / n, z1 + ((z2 - z1) * k) / n]);
  }
  pts.push(trace[trace.length - 1]!);
  const c = new THREE.Color();
  const herbe = new THREE.Color(HERBE);
  const bords = pts.map(([x, z], i) => {
    const [xa, za] = pts[Math.max(0, i - 1)]!;
    const [xb, zb] = pts[Math.min(pts.length - 1, i + 1)]!;
    const l = Math.hypot(xb - xa, zb - za) || 1;
    // La largeur respire un peu (un sentier, pas une route).
    const w = (largeur / 2) * (0.85 + alea() * 0.3);
    const nx = -(zb - za) / l, nz = (xb - xa) / l;
    const g: [number, number] = [x + nx * w, z + nz * w];
    const d: [number, number] = [x - nx * w, z - nz * w];
    return [g, d].map(([px, pz]) => [px, sol(px, pz) + haut, pz] as [number, number, number]);
  });
  for (let i = 0; i < bords.length - 1; i++) {
    const [g1, d1] = bords[i]!;
    const [g2, d2] = bords[i + 1]!;
    // Le bout du sentier se fond dans la lande (`fondu` : le nombre de tronçons de la fin qui pâlissent).
    const f = fondu ? lisse(bords.length - 1 - fondu, bords.length - 1, i) : 0;
    c.setHex(ton).offsetHSL(0, 0, (alea() - 0.5) * 0.04).lerp(herbe, f * 0.85);
    // Dans ce sens, les faces regardent vers le haut.
    for (const q of [g1, g2, d1, d1, g2, d2]) {
      p.push(...q!);
      col.push(c.r, c.g, c.b);
    }
  }
}

/** Les marches, les pierres de bordure, les bornes blanchies, la main courante et les marques du sentier. */
function sentier(c: Ch): void {
  // Les pierres de bordure, de part et d'autre du tracé sur les galets (quelques-unes, pas une allée de jardin).
  for (let i = 0; i < TRACE_GREVE.length - 1; i++) {
    const [x1, z1] = TRACE_GREVE[i]!;
    const [x2, z2] = TRACE_GREVE[i + 1]!;
    const l = Math.hypot(x2 - x1, z2 - z1);
    const nx = -(z2 - z1) / l, nz = (x2 - x1) / l;
    for (let u = 0.3; u < l; u += c.entre(0.45, 0.75)) {
      const cote = c.hasard() < 0.5 ? 1 : -1;
      const x = x1 + ((x2 - x1) * u) / l + nx * cote * c.entre(0.7, 0.82);
      const z = z1 + ((z2 - z1) * u) / l + nz * cote * c.entre(0.7, 0.82);
      const s = c.entre(0.16, 0.26);
      c.poser(CAILLOU, CLE, c.hasard() < 0.5 ? 0xd2cbbb : 0xb9b2a2, { x, y: solSentier(x, z) + s * 0.25, z, ry: c.hasard() * 3, e: [s * 1.3, s * 0.6, s] }, SANS);
    }
  }
  // Hors du lot, sous le sable du sentier, la banquette de dalles plates au pied de la falaise, au ras de l'eau.
  for (let x = -30.2; x > MARCHES.x0 + 0.2; x -= 0.55) {
    const z = 15.75 + (x + 31.5) * -0.35;
    c.boite(0.7, 0.5, 1.3, GRANITS[Math.floor(c.hasard() * 4)]!, { x, y: MER_Y + 0.05, z, ry: c.entre(-0.2, 0.2) }, CLE, SANS);
  }
  // Les bornes blanchies au chapeau rouge (celles du chemin des douaniers) : au départ, à la sortie, en haut des marches.
  const haut = MARCHES.x0 - MARCHES.pas * (MARCHES.n - 1);
  for (const [x, z] of [[-26.2, 20.4], [-29.9, 18.0], [haut - 0.9, bordFalaise(haut - 0.9) - 0.9]] as [number, number][]) {
    const y = solSentier(x, z);
    c.boite(0.32, 0.55, 0.28, BORNE, { x, y: y + 0.27, z, ry: c.hasard() }, CLE, SANS);
    c.boite(0.33, 0.1, 0.29, BORNE_ROUGE, { x, y: y + 0.5, z }, CLE, { crasse: false, nuance: 0.1 });
  }
  // Les marches taillées dans le rocher : un bloc par marche, à moitié dans la paroi, qui monte vers l'ouest.
  const poteaux: number[][] = [];
  for (let i = 0; i < MARCHES.n; i++) {
    const x = MARCHES.x0 - i * MARCHES.pas;
    const y = hauteurMarche(i);
    const z = bordFalaise(x) + distanceA(x, y);
    c.boite(0.5, 1.3, 1.15, i % 3 ? 0xa59d8e : 0x9a9284, { x, y: y - 0.65, z: z + 0.2, ry: c.entre(-0.06, 0.06) }, CLE, SANS);
    if (i % 5 === 0 || i === MARCHES.n - 1) poteaux.push([x, y + 0.95, z + 0.72]);
  }
  // La main courante, côté vide : des piquets de bois et une corde.
  for (let i = 0; i < poteaux.length; i++) {
    const [x, yh, z] = poteaux[i]!;
    c.boite(0.08, 1.05, 0.08, 0x6b5a48, { x, y: yh! - 0.5, z }, CLE, SANS);
    if (i > 0) c.poutre(poteaux[i - 1]!, poteaux[i]!, 0.04, 0xb09a6a, CLE, SANS);
  }
  // Les marques blanc et rouge du sentier côtier, peintes sur la roche : au pied des marches et à mi-hauteur.
  for (const i of [0, 11]) {
    const x = MARCHES.x0 - i * MARCHES.pas + 0.05;
    const y = hauteurMarche(i);
    const z = bordFalaise(x) + distanceA(x, y + 0.6) + 0.12;
    c.boite(0.3, 0.07, 0.03, 0xf2efe6, { x, y: y + 0.62, z }, CLE, { crasse: false, nuance: 0 });
    c.boite(0.3, 0.07, 0.03, 0xc8362b, { x, y: y + 0.53, z }, CLE, { crasse: false, nuance: 0 });
  }
}

// ---------- Les rochers des deux bouts ----------

/** La distance (m) d'un point au tracé du sentier sur les galets. */
function distanceAuSentier(x: number, z: number): number {
  let d = Infinity;
  for (let i = 0; i < TRACE_GREVE.length - 1; i++) {
    const [x1, z1] = TRACE_GREVE[i]!;
    const [x2, z2] = TRACE_GREVE[i + 1]!;
    const l2 = (x2 - x1) ** 2 + (z2 - z1) ** 2;
    const t = Math.min(1, Math.max(0, ((x - x1) * (x2 - x1) + (z - z1) * (z2 - z1)) / l2));
    d = Math.min(d, Math.hypot(x - x1 - (x2 - x1) * t, z - z1 - (z2 - z1) * t));
  }
  return d;
}

/**
 * Des rochers le long d'une ligne d'obstacle (repère du modèle), du côté `cote` (+1 : à sa droite en allant de 1 à 2),
 * leur face au ras de la ligne : là où l'on bute, on touche la pierre. `hauts` : près du premier bout, contre la falaise,
 * ils s'entassent plus haut (un éboulis). Dans l'eau, ils dépassent de la surface, l'écume autour.
 */
function rochersLe(c: Ch, ecume: Ch, ligne: { x1: number; z1: number; x2: number; z2: number }, cote: number, n: number, taille: [number, number], hauts: boolean): void {
  const l = Math.hypot(ligne.x2 - ligne.x1, ligne.z2 - ligne.z1);
  const ux = (ligne.x2 - ligne.x1) / l, uz = (ligne.z2 - ligne.z1) / l;
  const px = -uz * cote, pz = ux * cote;
  for (let i = 0; i < n; i++) {
    const t = (i + c.entre(0.1, 0.9)) / n;
    for (let rang = 0; rang < 2; rang++) {
      const s = c.entre(taille[0], taille[1]) * (rang ? 0.85 : 1);
      // La face côté grève au ras de la ligne (le rocher s'étend sur 1 à 1,5 fois s autour de son centre).
      const ecart = s * 1.05 + rang * s * 1.6 + c.entre(0, 0.4);
      const x = ligne.x1 + ux * l * t + px * ecart;
      const z = ligne.z1 + uz * l * t + pz * ecart;
      // Le sentier reste libre (on doit voir où il passe) : pas de rocher dessus ni contre lui.
      if (distanceAuSentier(x, z) < s * 1.4 + 0.7) continue;
      const sol = solCote(x, z);
      let y = Math.max(sol, -10.2) + s * 0.3;
      // Au-dessus de l'eau d'au moins 40 cm : on le voit, de loin, de nuit.
      if (y + s * 0.6 < MER_Y + 0.4) y = MER_Y + 0.4 - s * 0.6 + c.entre(0, 0.5);
      rocher(c, x, y, z, s, GRANITS[Math.floor(c.hasard() * GRANITS.length)]!, 1.1);
      if (sol < MER_Y - 0.05) for (let k = 0; k < 2; k++) {
        const a = c.hasard() * 6.3;
        ecume.poser(PLAQUE, CLE, 0xffffff, { x: x + Math.cos(a) * s * 1.2, y: MER_Y + 0.07, z: z + Math.sin(a) * s * 1.1, ry: -a + Math.PI / 2, e: [c.entre(0.6, 1.2), 1, c.entre(0.15, 0.3)] }, { crasse: false, nuance: 0.05 });
      }
    }
    // Contre la falaise, l'éboulis monte : des blocs sur la paroi, au-dessus du pied.
    if (hauts && t < 0.3) {
      const s = c.entre(0.8, 1.3);
      const x = ligne.x1 + ux * l * t + px * c.entre(0.8, 2.2);
      const z = ligne.z1 + uz * l * t - c.entre(0.4, 1.4);
      rocher(c, x, solCote(x, z) + s * 0.4, z, s, GRANITS[Math.floor(c.hasard() * GRANITS.length)]!, 1.2);
    }
  }
  // Quelques cailloux roulés devant, sur les galets.
  for (let i = 0; i < 6; i++) {
    const t = c.hasard();
    const x = ligne.x1 + ux * l * t - px * c.entre(0.5, 1.6);
    const z = ligne.z1 + uz * l * t - pz * c.entre(0.5, 1.6);
    const sol = solCote(x, z);
    if (sol < MER_Y - 0.05) continue;
    const s = c.entre(0.15, 0.3);
    c.poser(CAILLOU, CLE, GRANITS[i % 4]!, { x, y: sol + s * 0.3, z, ry: c.hasard() * 3, e: [s * 1.3, s * 0.7, s] }, SANS);
  }
}

// ---------- La mer ----------

/**
 * La mer autour du lot (x − 100 à 100, z 11,5 à 95) : claire sur la bande d'eau peu profonde où l'on marche, plus sombre
 * au-delà (là où l'on perd pied) ; à l'est de la crique, sombre partout. Une rangée de colonnes de quadrilatères.
 */
function mer(p: number[], col: number[]): void {
  const CLAIRE = [1.12, 1.18, 1.08];
  const SOMBRE = [0.5, 0.56, 0.66];
  const colonnes: [number, number, boolean][] = [];
  const X: number[] = [-100, -80, -64];
  for (let x = -54; x < -1.6; x += x < -36 ? 3 : 1.5) X.push(x);
  X.push(-1.6);
  for (let i = 0; i < X.length - 1; i++) colonnes.push([X[i]!, X[i + 1]!, true]);
  colonnes.push([-1.6, 30, false], [30, 100, false]);
  const sommet = (x: number, z: number, c: number[]) => {
    p.push(x, MER_Y, z);
    col.push(c[0]!, c[1]!, c[2]!);
  };
  for (const [x1, x2, bande] of colonnes) {
    // Les rangées : le pied de la falaise, la bande claire, le passage (60 cm), le large.
    const rangs = (x: number): [number, number[]][] => {
      if (!bande) return [[11.5, SOMBRE], [95, SOMBRE]];
      const z = zLarge(x) + 0.35;
      return [[11.5, CLAIRE], [z - 0.3, CLAIRE], [z + 0.3, SOMBRE], [95, SOMBRE]];
    };
    const r1 = rangs(x1);
    const r2 = rangs(x2);
    for (let j = 0; j < r1.length - 1; j++) {
      const [a, ca] = r1[j]!, [b, cb] = r1[j + 1]!, [c2, cc] = r2[j]!, [d, cd] = r2[j + 1]!;
      sommet(x1, a, ca); sommet(x1, b, cb); sommet(x2, d, cd);
      sommet(x1, a, ca); sommet(x2, d, cd); sommet(x2, c2, cc);
    }
  }
}

/** L'écume là où l'on perd pied : une ligne de brisants le long du large, de l'ouest jusqu'à l'éboulis. */
function brisants(e: Ch): void {
  for (let x = -40; x < EBOULIS_EST.x2 + 0.5; x += e.entre(0.7, 1.3)) {
    const z = zLarge(x) + 0.35 + e.entre(-0.2, 0.2);
    e.poser(PLAQUE, CLE, 0xffffff, { x, y: MER_Y + 0.07, z, ry: e.entre(-0.25, 0.25), e: [e.entre(0.8, 1.6), 1, e.entre(0.2, 0.45)] }, { crasse: false, nuance: 0.05 });
    if (e.hasard() < 0.45) e.poser(PLAQUE, CLE, 0xffffff, { x: x + e.entre(-0.3, 0.3), y: MER_Y + 0.07, z: z + e.entre(0.6, 1.2), ry: e.entre(-0.3, 0.3), e: [e.entre(0.5, 1.1), 1, e.entre(0.15, 0.3)] }, { crasse: false, nuance: 0.05 });
  }
}

// ---------- La fonte dans les maillages du modèle ----------

/** Une géométrie à partir de sommets et de couleurs (repère du lot), au format des maillages du modèle. */
function geometrie(p: number[], col: number[]): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(new Array((p.length / 3) * 2).fill(0), 2));
  g.computeVertexNormals();
  return g;
}

/** Ajoute des géométries à un maillage du modèle (mêmes attributs, même repère) : aucun appel de dessin de plus. */
function fondre(cible: THREE.Mesh | null, geos: THREE.BufferGeometry[]): boolean {
  if (!cible || !geos.length) return false;
  const noms = Object.keys(cible.geometry.attributes);
  for (const g of geos) {
    for (const nom of Object.keys(g.attributes)) if (!noms.includes(nom)) g.deleteAttribute(nom);
    if (noms.some((nom) => !g.getAttribute(nom))) return false;
  }
  const fondu = mergeGeometries([cible.geometry, ...geos]);
  for (const g of geos) g.dispose();
  if (!fondu) return false;
  cible.geometry.dispose();
  cible.geometry = fondu;
  return true;
}

/** Ce qu'un chantier a posé, en une géométrie. */
function lot(c: Ch): THREE.BufferGeometry[] {
  return c.lots.get(CLE) ?? [];
}

/**
 * L'eau du modèle dans le lot (sa tranche d'eau, x − 30 à 30, z 11,5 à 25) s'efface : la mer de `mer` la remplace (claire
 * sur la bande, sombre au-delà), sans double couche transparente. Ses triangles sont ramenés à un point.
 */
function effacerEauDuLot(m: THREE.Mesh): void {
  const pos = m.geometry.getAttribute("position") as THREE.BufferAttribute;
  const dedans = (i: number) => {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    return x > -30.01 && x < 30.01 && y > -12.01 && y < MER_Y + 0.01 && z > 11.49 && z < 25.01;
  };
  for (let i = 0; i < pos.count; i += 3) {
    if (!(dedans(i) && dedans(i + 1) && dedans(i + 2))) continue;
    for (let k = 1; k < 3; k++) pos.setXYZ(i + k, pos.getX(i), pos.getY(i), pos.getZ(i));
  }
  pos.needsUpdate = true;
}

export interface MaillagesDuModele {
  /** Le sol mat (le plateau, la falaise, la grève). */
  sol: THREE.Mesh | null;
  /** La mer. */
  mer: THREE.Mesh | null;
}

/**
 * Les bords de la grève (repère du lot : à ajouter au modèle, posé en OX, 0, OZ) : la côte de l'ouest, le sentier, les
 * rochers des deux bouts, la mer, l'écume. Le panneau est à part (`creerPanneauSentier`).
 */
export function poserBords(modele: THREE.Object3D, m: MaillagesDuModele): void {
  const alea = (() => {
    let s = 7741;
    return () => (s = (s * 9301 + 49297) % 233280) / 233280;
  })();
  // La côte de l'ouest, et le sentier tracé sur les galets puis sur la lande, en haut des marches.
  const p: number[] = [];
  const col: number[] = [];
  coteOuest(p, col, alea);
  ruban(p, col, TRACE_GREVE, 1.2, BATTUE, solSentier, 0.1, alea);
  const haut = MARCHES.x0 - MARCHES.pas * (MARCHES.n - 1);
  const lande: [number, number][] = [[haut + 0.1, bordFalaise(haut) - 0.3]];
  for (let x = haut - 0.2; x > -64; x -= 3) lande.push([x, bordFalaise(x) - 1.3 + 0.4 * Math.sin(x * 0.3)]);
  ruban(p, col, lande, 1.0, TERRE, () => 0, 0.012, alea, 6);
  const c = new Chantier(5151) as Ch;
  const ecume = new Chantier(5152) as Ch;
  sentier(c);
  rochersLe(c, ecume, EBOULIS_EST, -1, 10, [0.7, 1.25], true);
  rochersLe(c, ecume, ROCHERS_OUEST, 1, 7, [0.5, 0.9], false);
  brisants(ecume);
  fondre(m.sol, [geometrie(p, col), ...lot(c)]);
  // La mer : la bande claire, le large sombre.
  if (m.mer) {
    effacerEauDuLot(m.mer);
    const pm: number[] = [];
    const cm: number[] = [];
    mer(pm, cm);
    fondre(m.mer, [geometrie(pm, cm)]);
  }
  // L'écume du modèle (animée avec la houle) reçoit les brisants et l'écume autour des rochers.
  let maillageEcume: THREE.Mesh | null = null;
  modele.getObjectByName("écume")?.traverse((o) => {
    if (!maillageEcume && (o as THREE.Mesh).isMesh) maillageEcume = o as THREE.Mesh;
  });
  fondre(maillageEcume, lot(ecume));
}

// ---------- Le panneau du sentier côtier ----------

/** Le panneau (repère du lot) : sa planche peinte, son poteau, et la lanterne au-dessus (rendu/lanterne-panneau.ts). */
export const PANNEAU_SENTIER = {
  x: PANNEAU_MODELE.x,
  z: PANNEAU_MODELE.z,
  largeur: 1.7,
  hauteur: 0.95,
  /** La hauteur du milieu de la planche au-dessus des galets. */
  milieu: 1.6,
  /** Tourné vers la caméra du jeu (au sud-est) : on le lit en arrivant du bas de la rampe. */
  angle: Math.PI / 4,
  /** Le haut du poteau, où s'accroche la potence de la lanterne (au-dessus des galets). */
  poteau: 2.85,
} as const;

/** Les régions de la texture du panneau (x, y, largeur, hauteur, sur 512 × 512). */
const T = { face: [0, 0, 512, 300], dos: [0, 300, 256, 100], bois: [256, 300, 128, 100] } as const;

function dessinerPanneau(g: CanvasRenderingContext2D): void {
  const [fx, fy, fl, fh] = T.face;
  g.fillStyle = "#fbf5e6";
  g.fillRect(fx, fy, fl, fh);
  g.strokeStyle = "#2f4a3a";
  g.lineWidth = 10;
  g.strokeRect(fx + 9, fy + 9, fl - 18, fh - 18);
  // La marque du sentier côtier : blanc sur rouge.
  g.fillStyle = "#ffffff";
  g.fillRect(fx + 40, fy + 40, 70, 18);
  g.fillStyle = "#c8362b";
  g.fillRect(fx + 40, fy + 58, 70, 18);
  g.fillStyle = "#1f3440";
  g.textAlign = "center";
  g.font = "bold 62px serif";
  g.fillText("Sentier côtier", fx + fl / 2 + 30, fy + 82);
  g.font = "bold 60px serif";
  g.fillText("← Port · 6 km", fx + fl / 2, fy + 190);
  g.fillStyle = "#c8362b";
  g.fillRect(fx + 60, fy + 232, fl - 120, 10);
  g.fillStyle = "#d9d1bd";
  g.fillRect(T.dos[0], T.dos[1], T.dos[2], T.dos[3]);
  g.fillStyle = "#6b5a48";
  g.fillRect(T.bois[0], T.bois[1], T.bois[2], T.bois[3]);
}

function toile(trace: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d");
  if (g) trace(g);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Une pièce du panneau : ses UV ramenés dans une région (la face avant d'une boîte peut en avoir une autre). */
function piece(g: THREE.BufferGeometry, region: readonly number[], face?: readonly number[]): THREE.BufferGeometry {
  const n = g.index ? g.toNonIndexed() : g;
  if (n !== g) g.dispose();
  const uv = n.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) {
    // Une boîte : six faces de six sommets ; la cinquième regarde vers +z (l'avant).
    const r = face && Math.floor(i / 6) === 4 ? face : region;
    uv.setXY(i, (r[0]! + uv.getX(i) * r[2]!) / 512, 1 - (r[1]! + (1 - uv.getY(i)) * r[3]!) / 512);
  }
  return n;
}

/** La pose de la lanterne du panneau : en haut du poteau, devant la planche (repère du lot ; la lumière, au jeu). */
function poseLanterne(): PoseLanterne {
  const P = PANNEAU_SENTIER;
  return { x: P.x, y: solCote(P.x, P.z) + P.poteau, z: P.z, angle: P.angle, avance: 0.4, monde: jeu(0, 0) };
}

/**
 * Le panneau du sentier côtier : la planche et le poteau (un maillage, une matière), la lanterne au-dessus (un maillage :
 * rendu/lanterne-panneau.ts). Deux appels de dessin. La lanterne luit la nuit (`allumerPanneau`).
 */
export function creerPanneauSentier(): THREE.Group {
  const P = PANNEAU_SENTIER;
  const pieces = [
    // La planche (5 cm d'épaisseur), peinte devant, claire derrière ; le poteau.
    piece(new THREE.BoxGeometry(P.largeur, P.hauteur, 0.05).translate(0, P.milieu, 0.1), T.dos, T.face),
    piece(new THREE.BoxGeometry(0.13, P.poteau + 0.04, 0.13).translate(0, (P.poteau + 0.04) / 2, 0), T.bois),
  ];
  const geo = mergeGeometries(pieces) ?? new THREE.BufferGeometry();
  for (const g of pieces) g.dispose();
  geo.rotateY(P.angle);
  geo.translate(P.x, solCote(P.x, P.z), P.z);
  const planche = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: toile(dessinerPanneau), roughness: 0.75 }));
  planche.name = "planche du sentier côtier";
  planche.castShadow = true;
  planche.receiveShadow = true;
  const lanterne = poserLanterne(poseLanterne());
  const groupe = new THREE.Group();
  groupe.name = "panneau du sentier côtier";
  groupe.add(planche, lanterne.maillage);
  groupe.userData.lanterne = lanterne;
  return groupe;
}

/** La lanterne du panneau, la nuit : elle luit (et la réserve de lumières l'allume : `lampePanneau`). */
export function allumerPanneau(panneau: THREE.Object3D | undefined, nuit: boolean): void {
  (panneau?.userData.lanterne as LanternePanneau | undefined)?.allumer(nuit);
}

/** La lumière de la lanterne du panneau, dans le repère du jeu (une source de la réserve de lumières, la nuit). */
let source: SourceLumiere | null = null;
export function lampePanneau(): SourceLumiere {
  if (!source) {
    const l = poserLanterne(poseLanterne());
    l.maillage.geometry.dispose();
    source = l.source;
  }
  return source;
}
