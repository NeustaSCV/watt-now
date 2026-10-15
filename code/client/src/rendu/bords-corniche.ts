// Les bords de la corniche du Cap Rouge (0.10, R52 ; décision du porteur du 2026-10-15, revue .claude-travail/revue-r52/) :
//
// - la route prolongée d'une quarantaine de mètres aux deux bouts (l'asphalte et ses lignes, le muret côté mer, la paroi
//   rouge côté montagne), jusqu'à ce qu'elle tourne derrière un éperon de roche : à l'ouest elle s'arrêtait sur le vide,
//   à l'est elle butait sur un gros bloc lisse (les masses de roche des anciens alentours, retirées) ;
// - la mer du lot et celle des alentours d'une seule matière (celle du modèle : `matiereEau(MER, 0.84)`, partagée par
//   le cache des matières des modèles), sur un fond sombre, comme dans le lot ;
// - la lanterne au-dessus des deux panneaux de sortie (le panneau routier des deux bouts, rendu/lanterne-panneau.ts).
//
// Le relief prolongé reprend celui du modèle (batiments/halte-corniche/modele.js : `hauteur`, ses tables ZC, ZR, ZN et
// son bruit, recopiés ici : le modèle ne les exporte pas), avec la même grille et le même désordre des sommets : au bord
// du lot (x = 0 et 200), il tombe exactement sur celui du modèle, sans couture. Au-delà, ses tables continuent : la route
// remonte vers le nord, l'éperon se lève entre elle et la mer, puis le cap plonge dans la mer. Rien de tout cela n'est
// dans la zone (on n'y marche pas) : aucun obstacle de plus. En attendant que la session « bâtiments » le dessine dans le
// modèle (à lui demander).

import * as THREE from "three";
import type { LanternePanneau } from "./lanterne-panneau.ts";
import { lanterneSurPanneau, type ChantierModele } from "./decor-cote.ts";
// @ts-expect-error : les outils des modèles sont en JavaScript, sans types (client/src/batiments/ ne se modifie pas).
import { Chantier, matiere, matiereEau, matiereMonde } from "../batiments/commun/atelier.js";

// ---------- Le relief du modèle (recopié), ses tables prolongées au-delà du lot ----------

const HL = 3.0;
const MER_Y = -15;
const MER = 0x2e7380;
const ASPHALTE = 0x55565a;
const LIGNE = 0xdedad0;
const GRAVIER = 0xa59b88;
const ROC = 0xa2654a;
const ROC_SOMBRE = 0x7c4a39;
const ROC_CLAIR = 0xbd8a69;
const CALCAIRE = 0xb8ab95;
const ROC_MOUILLE = 0x5a4038;
const TERRE = 0xb39a72;
const HERBE_SECHE = 0xa8a066;
const GARRIGUE = 0x8b8c56;
const GARRIGUE_SOMBRE = 0x6c7748;
const FOND = 0x8f8468;
const PIERRE = 0xc4b393;
const PIERRE_CHAPERON = 0xd2c4a8;
const ALU = 0xa2a7a8;

function hache(i: number, j: number): number {
  let h = Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function bruit(x: number, z: number): number {
  const i = Math.floor(x);
  const j = Math.floor(z);
  const fx = x - i;
  const fz = z - j;
  const sx = fx * fx * (3 - 2 * fx);
  const sz = fz * fz * (3 - 2 * fz);
  const a = hache(i, j) + (hache(i + 1, j) - hache(i, j)) * sx;
  const b = hache(i, j + 1) + (hache(i + 1, j + 1) - hache(i, j + 1)) * sx;
  return a + (b - a) * sz;
}

function interp(table: readonly (readonly [number, number])[], x: number): number {
  if (x <= table[0]![0]) return table[0]![1];
  for (let i = 1; i < table.length; i++) {
    if (x <= table[i]![0]) {
      const [x0, y0] = table[i - 1]!;
      const [x1, y1] = table[i]!;
      const t = (x - x0) / (x1 - x0);
      return y0 + (y1 - y0) * t * t * (3 - 2 * t);
    }
  }
  return table[table.length - 1]![1];
}

const lisse = (a: number, b: number, v: number) => Math.min(1, Math.max(0, (v - a) / (b - a)));

/** Où le relief prolongé s'arrête, au-delà du lot (repère du modèle : x de −100 à 100). */
export const PROLONGEMENT = 60;
/** Où la route tourne derrière l'éperon (|x| du modèle) : le ruban d'asphalte s'arrête là. */
const FIN_ROUTE = 138;

// Les tables du modèle aux bouts (ZC, ZR, ZN : seuls leurs premiers et derniers points comptent hors du lot, le reste
// est recopié pour que l'interpolation tombe juste au bord), prolongées : la route remonte vers le nord, le pied de la
// paroi la suit, le bord de la falaise s'écarte (l'éperon).
const ZC: readonly (readonly [number, number])[] = [[-160, -16], [-128, -4], [-101, 4], [-82, 3.5], [-62, 0.6], [-50, 0], [-28, 0], [-14, -1], [4, -1.4], [30, -1.2], [52, -1.5], [80, -1.5], [101, 1.5], [128, -5], [160, -18]];
const ZR_BOUTS: readonly (readonly [number, number])[] = [[-160, 4], [-130, 10], [-101, 8.8], [-88, 8.6]];
const ZR_BOUTS_EST: readonly (readonly [number, number])[] = [[95.2, 5.2], [101, 6], [130, 8], [160, 0]];
const ZN_BOUTS: readonly (readonly [number, number])[] = [[-160, -27], [-128, -13], [-101, -5], [-90, -5.2]];
const ZN_BOUTS_EST: readonly (readonly [number, number])[] = [[51.5, -5.8], [101, -5.6], [128, -13], [160, -29]];

const zc = (x: number) => interp(ZC, x);
const pente = (x: number) => zc(x + 0.5) - zc(x - 0.5);
/** Le bord de la falaise : au bord du lot, celui du modèle (avec son bruit, hors des « zones nettes »). */
const zr = (x: number) => interp(x < 0 ? ZR_BOUTS : ZR_BOUTS_EST, x) + 0.6 * (bruit(x * 0.35, 7.5) - 0.5);
const zn = (x: number) => interp(x < 0 ? ZN_BOUTS : ZN_BOUTS_EST, x) + 1.2 * (bruit(x * 0.25, 3.5) - 0.5);

function distRoute(x: number, z: number): number {
  const p = pente(x);
  return Math.abs(z - zc(x)) / Math.sqrt(1 + p * p);
}

/** La hauteur du modèle (sa fonction `hauteur`, sans tunnel ni crique, qui ne vont pas jusqu'aux bouts), puis l'éperon. */
function hauteurModele(x: number, z: number): number {
  const d = distRoute(x, z);
  const r = zr(x);
  if (d < HL + 0.35 && z <= r) return 0;
  const n = zn(x);
  if (z >= n && z <= r) return 0;
  if (z > r) {
    const e = z - r;
    const h = -(2.4 * Math.min(1, e / 0.5) + 15.6 * (1 - Math.exp(-e / 2.1))) - 1.6 * bruit(x * 0.4, z * 0.4) * Math.min(1, e / 2);
    return Math.max(h, -20);
  }
  const e = n - z;
  return 2.2 * Math.min(1, e / 0.5) + 17 * (1 - Math.exp(-e / 5)) + 3 * (bruit(x * 0.27 + 40, z * 0.27) - 0.3) * Math.min(1, e / 2);
}

/** Le relief prolongé : celui du modèle, l'éperon de roche qui se lève côté mer puis sur la route, le cap qui plonge. */
export function hauteurBout(x: number, z: number): number {
  const u = Math.abs(x);
  let h = hauteurModele(x, z);
  // L'éperon : entre la route et le bord de la falaise, la roche se lève ; plus loin, sur la route aussi (elle tourne).
  const w = lisse(110, 134, u);
  if (w > 0) {
    const bord = zc(x) + HL + 0.35;
    if (z > bord && z <= zr(x) + 6) {
      const k = lisse(bord, bord + 4, z) * (1 - lisse(zr(x) + 1, zr(x) + 6, z));
      h = Math.max(h, w * k * (5 + 8 * lisse(118, 145, u)) * (0.75 + 0.5 * bruit(x * 0.3, z * 0.3)));
    }
    const fermeture = lisse(FIN_ROUTE - 2, FIN_ROUTE + 8, u);
    if (fermeture > 0 && z > zn(x) - 2 && z <= zr(x) + 6) h = Math.max(h, fermeture * (11 + 4 * bruit(x * 0.3 + 9, z * 0.3)));
  }
  // Le cap plonge dans la mer au bout du prolongement.
  const f = lisse(100 + PROLONGEMENT - 12, 100 + PROLONGEMENT, u);
  return h * (1 - f) - 20 * f;
}

/** La teinte d'un triangle (la `classe` du modèle, sans tunnel ni crique). */
function classe(x: number, y: number, z: number, ny: number, d: number): number {
  const b = bruit(x * 0.18, z * 0.18);
  const b2 = bruit(x * 0.5 + 9, z * 0.5);
  if (Math.abs(y) < 0.06 && ny > 0.97) {
    if (d < HL + 0.6) return GRAVIER;
    return b > 0.62 ? HERBE_SECHE : b < 0.3 ? TERRE : GARRIGUE;
  }
  if (y > 0) {
    if (ny < 0.55) return b2 > 0.55 ? ROC : b2 < 0.25 ? CALCAIRE : ROC_SOMBRE;
    if (y < 4) return b > 0.5 ? GARRIGUE : TERRE;
    return b2 > 0.6 ? ROC_CLAIR : b2 < 0.3 ? GARRIGUE_SOMBRE : GARRIGUE;
  }
  if (y < MER_Y - 0.7) return b2 > 0.6 ? 0x5e5848 : FOND;
  if (y < MER_Y + 1.1) return ROC_MOUILLE;
  if (ny < 0.5) return b2 > 0.5 ? ROC_SOMBRE : ROC;
  if (y > -2.5) return b > 0.5 ? GARRIGUE : ROC_CLAIR;
  return b2 > 0.4 ? ROC : GARRIGUE_SOMBRE;
}

// ---------- La construction (repère du modèle ; le groupe est décalé dans le repère du jeu) ----------

/** Le relief d'un bout : la grille du modèle (pas de 1,25 m, le même désordre des sommets), de x0 à x1 (repère du modèle). */
function relief(c: ChantierModele, x0: number, x1: number): void {
  const PAS = 1.25;
  const nx = Math.round((x1 - x0) / PAS);
  const nz = Math.round(70 / PAS);
  const bordLot = x0 === 100 ? 0 : nx;
  const V: [number, number, number, number][] = [];
  for (let j = 0; j <= nz; j++) {
    for (let i = 0; i <= nx; i++) {
      let x = x0 + i * PAS;
      let z = -35 + j * PAS;
      const gi = Math.round((x + 100) / PAS);
      // Le désordre du modèle (x, sauf au bord ; z, sauf en haut et en bas) : au bord du lot, les mêmes sommets que lui.
      if (i !== bordLot && i > 0 && i < nx) x += (hache(gi, j + 7) - 0.5) * 0.5;
      if (j > 0 && j < nz) z += (hache(gi + 3, j) - 0.5) * 0.5;
      V.push([x, hauteurBout(x, z), z, distRoute(x, z)]);
    }
  }
  const classes = new Map<number, number[]>();
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const tri = (a: number[], b: number[], d: number[]) => {
    va.set(b[0]! - a[0]!, b[1]! - a[1]!, b[2]! - a[2]!);
    vb.set(d[0]! - a[0]!, d[1]! - a[1]!, d[2]! - a[2]!);
    const n = va.cross(vb).normalize();
    const coul = classe((a[0]! + b[0]! + d[0]!) / 3, (a[1]! + b[1]! + d[1]!) / 3, (a[2]! + b[2]! + d[2]!) / 3, n.y, Math.min(a[3]!, b[3]!, d[3]!));
    let t = classes.get(coul);
    if (!t) classes.set(coul, (t = []));
    for (const p of [a, b, d]) t.push(p[0]!, p[1]!, p[2]!);
  };
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const v00 = V[j * (nx + 1) + i]!;
      const v10 = V[j * (nx + 1) + i + 1]!;
      const v01 = V[(j + 1) * (nx + 1) + i]!;
      const v11 = V[(j + 1) * (nx + 1) + i + 1]!;
      if ((i + j) % 2) {
        tri(v00, v01, v10);
        tri(v10, v01, v11);
      } else {
        tri(v00, v01, v11);
        tri(v00, v11, v10);
      }
    }
  }
  for (const [coul, pos] of classes) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    c.poser(g, matiere(0.95, 0), coul, {}, { crasse: false, nuance: 0 });
    g.dispose();
  }
}

/** Une boîte entre deux points au sol (le `boiteEntre` du modèle). */
function boiteEntre(c: ChantierModele, x1: number, z1: number, x2: number, z2: number, y: number, h: number, ep: number, couleur: number, mat: unknown, options: Record<string, unknown> = {}): void {
  const L = Math.hypot(x2 - x1, z2 - z1) + 0.06;
  c.boite(L, h, ep, couleur, { x: (x1 + x2) / 2, y: y + h / 2, z: (z1 + z2) / 2, ry: -Math.atan2(z2 - z1, x2 - x1) }, mat, options);
}

/** La route prolongée (de |x| = 100 à FIN_ROUTE) : l'asphalte, les lignes de rive et l'axe, le muret côté mer. */
function route(c: ChantierModele, ouest: boolean): void {
  const s = ouest ? -1 : 1;
  const mat = matiere(0.95, 0);
  const pierre = matiereMonde("pierreTaille");
  const ruban = (o1: number, o2: number, y: number, couleur: number, garder: (k: number) => boolean) => {
    for (let k = 0, u = 100; u < FIN_ROUTE; u += 1, k++) {
      if (!garder(k)) continue;
      const xa = s * u;
      const xb = s * (u + 1);
      const p = pente((xa + xb) / 2);
      const l = Math.sqrt(1 + p * p);
      const nx = -p / l;
      const nz = 1 / l;
      const zm = zc((xa + xb) / 2);
      c.boite(l * 1.02, 0.02, o2 - o1, couleur, { x: (xa + xb) / 2 + nx * (o1 + o2) / 2, y, z: zm + nz * (o1 + o2) / 2, ry: -Math.atan(p) }, mat, { crasse: false, nuance: 0 });
    }
  };
  ruban(-HL, HL, 0.02, ASPHALTE, () => true);
  ruban(-HL + 0.25, -HL + 0.4, 0.035, LIGNE, (k) => hache(k, 1) > 0.15);
  ruban(HL - 0.4, HL - 0.25, 0.035, LIGNE, (k) => hache(k, 2) > 0.15);
  ruban(-0.07, 0.07, 0.035, LIGNE, (k) => k % 4 < 2 && hache(k, 3) > 0.25);
  // Le muret de pierre blonde côté mer, tant que la falaise borde la route (avant l'éperon).
  for (let u = 100; u < 118; u += 1) {
    const x1 = s * u;
    const x2 = s * (u + 1);
    const z1 = zr(x1) - 0.55;
    const z2 = zr(x2) - 0.55;
    const brise = hache(u, 41) < 0.06;
    const h = brise ? 0.35 : 0.72 + hache(u, 43) * 0.06;
    boiteEntre(c, x1, z1, x2, z2, 0, h, 0.45, PIERRE, pierre, { nuance: 0.03 });
    if (!brise) boiteEntre(c, x1, z1, x2, z2, h, 0.1, 0.56, PIERRE_CHAPERON, pierre, { nuance: 0.03, crasse: false });
  }
}

/** Les deux panneaux routiers de sortie (le modèle : x = ± 96,5, au bord nord de la chaussée, tournés de 0,04 et −0,1). */
export const PANNEAUX_SORTIE_CORNICHE = [
  { x: -96.5, ry: 0.04 },
  { x: 96.5, ry: -0.1 },
].map((p) => ({ x: p.x + 100, z: zc(p.x) - HL - 0.9 + 35, ry: p.ry }));

/**
 * Les bords de la corniche : les deux bouts prolongés (un chantier chacun, posés dans le repère du jeu), la mer des
 * alentours sur son fond, et les lanternes des panneaux de sortie.
 */
export function creerBordsCorniche(): { groupe: THREE.Group; lanternes: LanternePanneau[] } {
  const groupe = new THREE.Group();
  groupe.name = "bords de la corniche";
  const lanternes: LanternePanneau[] = [];
  for (const ouest of [true, false]) {
    const c = new Chantier(ouest ? 913 : 914) as ChantierModele;
    if (ouest) relief(c, -100 - PROLONGEMENT, -100);
    else relief(c, 100, 100 + PROLONGEMENT);
    route(c, ouest);
    const g = c.construire();
    g.name = `bords de la corniche (${ouest ? "ouest" : "est"})`;
    g.position.set(100, 0, 35);
    // La lanterne du panneau de sortie, sur le poteau du côté où la route part (repère du jeu).
    const p = PANNEAUX_SORTIE_CORNICHE[ouest ? 0 : 1]!;
    const lc = new Chantier(ouest ? 915 : 916) as ChantierModele;
    const l = lanterneSurPanneau(lc, matiere(0.4, 0.7), ALU, p, p.ry, 1.15, 1.6 + 0.375, ouest ? -1 : 1);
    const mat = lc.construire();
    mat.name = "mât de la lanterne";
    groupe.add(g, mat, l.maillage);
    lanternes.push(l);
  }
  // La mer des alentours, de la matière de celle du lot, autour du lot (pas dessous : deux eaux se teinteraient) ;
  // dessous, un fond sombre, comme celui du lot (sous son relief, il ne se voit pas). Au nord du lot, rien : la montagne
  // le cache, et au-delà c'est le ciel, comme avant.
  const c = new Chantier(917) as ChantierModele;
  const eau = matiereEau(MER, 0.84);
  for (const [x1, z1, x2, z2] of [
    [-700, 0, 0, 600],
    [200, 0, 900, 600],
    [0, 70, 200, 600],
  ] as const) c.boite(x2 - x1, 0.02, z2 - z1, 0xffffff, { x: (x1 + x2) / 2, y: MER_Y - 0.01, z: (z1 + z2) / 2 }, eau, { crasse: false, nuance: 0 });
  c.boite(1600, 0.1, 600, 0x6f6553, { x: 100, y: -20.7, z: 300 }, matiere(0.95, 0), { crasse: false, nuance: 0 });
  const mer = c.construire();
  mer.name = "mer des alentours";
  for (const m of mer.children) (m as THREE.Mesh).castShadow = false;
  groupe.add(mer);
  return { groupe, lanternes };
}
