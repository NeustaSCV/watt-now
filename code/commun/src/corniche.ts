// H2B, la corniche du Cap Rouge (plan 0.10, chantier I ; N2-55) : une halte partagée, comme la station et le gué, sur
// la route B du niveau 2, entre le terrain et le phare du cap. Ce fichier dit ce que le serveur et le client partagent
// de sa géographie :
//
// - le repère : le modèle (`batiment/halte-corniche/`, copié dans client/src/batiments/) a le terrain à l'ouest et le
//   phare à l'est, comme la carte : on ne le retourne pas, on le décale (x du jeu = x du modèle + 100 ; z du jeu = z du
//   modèle + 35). Les données du modèle viennent de `corniche-modele.ts` (scripts/extraire-corniche.mjs) ;
// - la zone : les obstacles du modèle (la paroi, le bord de la falaise, les murets, les murs du Panoramique…), le pin
//   tombé (`obstaclesPin`, gardé dans les deux états : débité, ses rondelles et sa tête restent en travers), et la porte
//   de la barricade du tunnel (`obstaclesBarricade`), fermée tant qu'on n'a pas payé le péage (`zoneCorniche`) ;
// - les deux goulets (G16 du gué, R50) : le tunnel et sa barricade, l'éboulement et son ruban de 2,5 m ;
// - les pièces et les portes du modèle (la vue par pièce, les pièces noires) et le milieu des Éteints ;
// - la caisse et la barricade du péage (§3.4, S-19) : leurs places ; la règle est dans commun/src/peage.ts (chantier H).
//
// Le contenu (les Éteints, le pin tombé, les pierres, le bois, les fouilles, le semis) est dans corniche-contenu.ts,
// que seul le serveur charge. Ce module n'importe rien de lieux.ts que des types (lieux.ts en tire ZONE_CORNICHE).

import { boitesPres, creerGrille, MARGE_GRILLE, type GrilleObstacles } from "./grille.ts";
import type { Boite, Sortie, Zone } from "./lieux.ts";
import type { Milieu } from "./eteints.ts";
import { declarerObstaclesBas } from "./murs.ts";
import { obstaclesVue, voit, type PlanVue, type PorteVue } from "./vue.ts";
import type { SegmentModele } from "./gue-modele.ts";
import { OBSTACLES_BARRICADE, OBSTACLES_PIN, PIECES_CORNICHE, PORTES_CORNICHE, SEGMENTS_CORNICHE } from "./corniche-modele.ts";

// ---------- Le repère ----------

/** Le lot du modèle : 200 × 70 m (FICHE.lot), quatre tronçons de 50 × 70 m. */
export const CORNICHE = { longueur: 200, largeur: 70 } as const;

const arrondi = (v: number) => Math.round(v * 100) / 100;

/** Un point du modèle dans le repère du jeu (décalé : le terrain à l'ouest, comme sur la carte). */
export function aLaCorniche(xm: number, zm: number): { x: number; z: number } {
  return { x: arrondi(xm + 100), z: arrondi(zm + 35) };
}

/** Un point du jeu dans le repère du modèle. */
export function auModeleCorniche(x: number, z: number): { x: number; z: number } {
  return { x: x - 100, z: z - 35 };
}

/** Les quatre tronçons, d'ouest en est, et le x (jeu) de leur bord ouest (le modèle : X0 − 25). */
export const TRONCONS_CORNICHE = ["montee", "tunnel", "panoramique", "eboulement"] as const;
export type TronconCorniche = (typeof TRONCONS_CORNICHE)[number];

/** Le tronçon où se trouve un point du jeu. */
export function tronconCorniche(x: number): TronconCorniche {
  return TRONCONS_CORNICHE[Math.max(0, Math.min(3, Math.floor(x / 50)))]!;
}

// ---------- La route (reprise du modèle : ZC, HL) ----------

/** L'axe de la route (repère du modèle : z selon x), lissé entre ses points comme le modèle. */
const ZC_MODELE: readonly (readonly [number, number])[] = [[-101, 4], [-82, 3.5], [-62, 0.6], [-50, 0], [-28, 0], [-14, -1], [4, -1.4], [30, -1.2], [52, -1.5], [80, -1.5], [101, 1.5]];
/** La demi-largeur de la chaussée (le modèle : HL). */
export const DEMI_CHAUSSEE = 3.0;

function lisser(table: readonly (readonly [number, number])[], x: number): number {
  if (x <= table[0]![0]) return table[0]![1];
  for (let i = 1; i < table.length; i++) {
    const [xb, yb] = table[i]!;
    if (x <= xb) {
      const [xa, ya] = table[i - 1]!;
      const t = (x - xa) / (xb - xa);
      return ya + (yb - ya) * t * t * (3 - 2 * t);
    }
  }
  return table[table.length - 1]![1];
}

/** L'axe de la route (z du jeu) pour un x du jeu. */
export function zRouteCorniche(x: number): number {
  return lisser(ZC_MODELE, Math.max(-101, Math.min(101, x - 100))) + 35;
}

/** Sur la chaussée (à `marge` près) : le semis n'y pose rien. */
export function surLaChaussee(x: number, z: number, marge = 0): boolean {
  return Math.abs(z - zRouteCorniche(x)) < DEMI_CHAUSSEE + marge;
}

// ---------- Les goulets, le péage, le pin ----------

/** La barricade du tunnel (la porte du péage, x du jeu) et la caisse au pied, côté ouest (FICHE.objets.caisse_peage). */
export const BARRICADE = { ...aLaCorniche(-24.55, 0.44), largeur: 2.12 } as const;
export const CAISSE_PEAGE = aLaCorniche(-25.78, 2.35);

/** L'éboulement : le ruban de 2,5 m entre la paroi et le vide, de x = 61 à x = 74 dans le modèle (FICHE.goulets). */
export const RUBAN = { x0: aLaCorniche(61, 0).x, x1: aLaCorniche(74, 0).x, largeur: 2.5 } as const;

/** Le pin d'Alep tombé sur l'aire de la station (le tas de bois personnel : corniche-contenu.ts). */
export const PIN_TOMBE = aLaCorniche(-77.6, -9.0);

// ---------- La zone ----------

/**
 * Ce qui arrête un coup ou un objet lancé : la paroi, les murs, les épaves, la barricade, les vitres. Le reste (le bord
 * de la falaise, les murets, les glissières, les balustrades, le mobilier, le pin couché) est bas : on lance par-dessus.
 */
const HAUTES = /^(mur\b|paroi|épave|rocher|sacs de sable|poste de guet|souche|porte de la barricade|baie vitrée|chambre froide|falaise \(bout)/;

/** Un segment du modèle, en boîtes du jeu (les segments en biais : en morceaux de 0,5 m qui se recouvrent). */
function boitesDuSegment(s: SegmentModele): Boite[] {
  const ep = s.nature === "mur" ? 0.24 : s.nature.startsWith("paroi") || s.nature.startsWith("bord") ? 0.3 : 0.2;
  const a = aLaCorniche(s.x1, s.z1);
  const b = aLaCorniche(s.x2, s.z2);
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  // Un segment droit garde sa longueur (une porte du modèle reste aussi large qu'il l'a voulue).
  if (Math.abs(dx) < 0.02 || Math.abs(dz) < 0.02) {
    const selonX = Math.abs(dx) >= Math.abs(dz);
    return [{ x: arrondi(a.x + dx / 2), z: arrondi(a.z + dz / 2), l: arrondi(selonX ? Math.abs(dx) : ep), p: arrondi(selonX ? ep : Math.abs(dz)) }];
  }
  const n = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.5));
  const boites: Boite[] = [];
  for (let i = 0; i < n; i++) {
    boites.push({ x: arrondi(a.x + (dx * (i + 0.5)) / n), z: arrondi(a.z + (dz * (i + 0.5)) / n), l: arrondi(Math.abs(dx) / n + ep), p: arrondi(Math.abs(dz) / n + ep) });
  }
  return boites;
}

/** Les segments en boîtes, les basses déclarées (murs.ts : un coup passe par-dessus). */
function boites(segments: readonly SegmentModele[]): Boite[] {
  const toutes: Boite[] = [];
  for (const s of segments) {
    const b = boitesDuSegment(s);
    if (!HAUTES.test(s.nature)) declarerObstaclesBas(b);
    toutes.push(...b);
  }
  return toutes;
}

const FIXES: readonly Boite[] = [...boites(SEGMENTS_CORNICHE), ...boites(OBSTACLES_PIN)];
const PORTE_BARRICADE: readonly Boite[] = boites(OBSTACLES_BARRICADE);
const BORNES = { xMin: 0.5, xMax: CORNICHE.longueur - 0.5, zMin: 0.5, zMax: CORNICHE.largeur - 0.5 } as const;

const zones = new Map<boolean, Zone>();

/**
 * La zone de la corniche : les obstacles du modèle et le pin tombé ; la porte de la barricade, sauf pour qui a payé le
 * péage (`barricadeOuverte`). Les deux zones sont faites une fois.
 */
export function zoneCorniche(barricadeOuverte = false): Zone {
  const deja = zones.get(barricadeOuverte);
  if (deja) return deja;
  const obstacles = barricadeOuverte ? FIXES : [...FIXES, ...PORTE_BARRICADE];
  const zone: Zone = { ...BORNES, obstacles, grille: creerGrille(obstacles) };
  zones.set(barricadeOuverte, zone);
  return zone;
}

/** La halte telle qu'on la trouve : la barricade du tunnel fermée (lieux.ts en fait la zone du lieu). */
export const ZONE_CORNICHE: Zone = zoneCorniche(false);

/** Un point (avec son rayon) touche-t-il un obstacle de la corniche, barricade ouverte ou non ? */
export function heurteCorniche(x: number, z: number, rayon: number, barricadeOuverte = false): boolean {
  const zone = zoneCorniche(barricadeOuverte);
  const g = zone.grille as GrilleObstacles;
  const liste = rayon <= MARGE_GRILLE ? boitesPres(g, x, z) : zone.obstacles;
  return liste.some((b) => Math.abs(x - b.x) <= b.l / 2 + rayon && Math.abs(z - b.z) <= b.p / 2 + rayon);
}

// ---------- Les sorties ----------

/** Les deux bouts de la route : vers le terrain (ouest, entrée A du modèle) et vers le phare (est, sortie B). */
const BOUT_OUEST = aLaCorniche(-100, zRouteCorniche(0) - 35);
const BOUT_EST = aLaCorniche(100, zRouteCorniche(200) - 35);

export const SORTIES_CORNICHE: Sortie[] = [
  {
    vers: "terrain",
    boite: { x: 2, z: BOUT_OUEST.z, l: 4, p: 6 },
    arrivee: { x: 4.5, z: BOUT_OUEST.z, o: Math.PI / 2 },
    libelle: "Rentrer chez toi",
  },
  {
    vers: "phare",
    boite: { x: CORNICHE.longueur - 2, z: BOUT_EST.z, l: 4, p: 6 },
    arrivee: { x: CORNICHE.longueur - 4.5, z: BOUT_EST.z, o: -Math.PI / 2 },
    libelle: "Continuer vers le phare",
  },
];

/**
 * Peut-on marcher jusqu'ici depuis la route ? (un point entre la paroi et le vide, hors des obstacles, barricade
 * ouverte) : calculé une fois, sur une grille de 0,5 m, en partant des deux arrivées. Pour le semis et les tests.
 */
let accessibles: Uint8Array | null = null;
const PAS = 0.5;
const NX = CORNICHE.longueur / PAS;
const NZ = CORNICHE.largeur / PAS;
export function accessibleCorniche(x: number, z: number): boolean {
  if (!accessibles) {
    accessibles = new Uint8Array(NX * NZ);
    const pile: number[] = [];
    for (const s of SORTIES_CORNICHE) pile.push(Math.floor(s.arrivee.x / PAS) * NZ + Math.floor(s.arrivee.z / PAS));
    for (const k of pile) accessibles[k] = 1;
    while (pile.length > 0) {
      const k = pile.pop()!;
      const i = Math.floor(k / NZ);
      const j = k % NZ;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const a = i + di;
        const b = j + dj;
        if (a < 1 || b < 1 || a >= NX - 1 || b >= NZ - 1) continue;
        const kk = a * NZ + b;
        if (accessibles[kk]) continue;
        if (heurteCorniche((a + 0.5) * PAS, (b + 0.5) * PAS, 0.3, true)) continue;
        accessibles[kk] = 1;
        pile.push(kk);
      }
    }
  }
  const i = Math.floor(x / PAS);
  const j = Math.floor(z / PAS);
  return i >= 0 && j >= 0 && i < NX && j < NZ && accessibles[i * NZ + j] === 1;
}

// ---------- Les pièces, la vue, la nuit ----------

/** Les pièces du modèle (FICHE.cartes[].pieces), dans le repère du jeu. */
const PIECES: readonly { id: string; sombre: boolean; boites: Boite[] }[] = Object.entries(PIECES_CORNICHE).map(([id, p]) => ({
  id,
  sombre: p.sombre,
  boites: p.boites.map((b) => ({ ...aLaCorniche(b.x, b.z), l: b.l, p: b.p })),
}));

/** La pièce d'un point (la plus petite qui le contient) ; « dehors » sinon. */
export function pieceCorniche(x: number, z: number): string {
  let meilleure = "dehors";
  let aire = Infinity;
  for (const p of PIECES) {
    for (const b of p.boites) {
      if (Math.abs(x - b.x) <= b.l / 2 && Math.abs(z - b.z) <= b.p / 2 && b.l * b.p < aire) {
        meilleure = p.id;
        aire = b.l * b.p;
      }
    }
  }
  return meilleure;
}

/** Dans une boîte de pièce (à `marge` près) : le semis n'y pose rien. */
export function dansUnePiece(x: number, z: number, marge = 0): boolean {
  return PIECES.some((p) => p.boites.some((b) => Math.abs(x - b.x) <= b.l / 2 + marge && Math.abs(z - b.z) <= b.p / 2 + marge));
}

const SOMBRES = new Set(PIECES.filter((p) => p.sombre).map((p) => p.id));

/** Les pièces noires (le tunnel, l'abri du cantonnier, la cuisine du Panoramique, le cabanon) : la nuit, même de jour. */
export function sombreCorniche(x: number, z: number): boolean {
  return SOMBRES.has(pieceCorniche(x, z));
}

/** Les portes du modèle, dans le repère du jeu. */
const PORTES: readonly PorteVue[] = PORTES_CORNICHE.map((p) => ({ id: p.id, ...aLaCorniche(p.x, p.z), largeur: p.largeur, sens: p.axe, entre: p.entre, toujoursOuverte: true }));

/**
 * La vue par pièce (0.7.2) : les murs du modèle qui bordent une pièce (le Panoramique, la villa, la station, l'abri, le
 * kiosque, le cabanon) et les parois du tunnel arrêtent la vue ; les portes, sans battant, restent ouvertes ; les baies
 * vitrées de la salle à manger laissent voir. Le reste de la corniche est à ciel ouvert.
 */
export const PLAN_CORNICHE: PlanVue = (() => {
  const dansUneBoite = (s: SegmentModele) => {
    const a = aLaCorniche(s.x1, s.z1);
    const b = aLaCorniche(s.x2, s.z2);
    return PIECES.some((p) => p.boites.some((q) => [a, b].every((m) => Math.abs(m.x - q.x) <= q.l / 2 + 0.4 && Math.abs(m.z - q.z) <= q.p / 2 + 0.4)));
  };
  const murs = SEGMENTS_CORNICHE.filter((s) => (s.nature === "mur" || s.nature === "paroi du tunnel") && dansUneBoite(s)).flatMap(boitesDuSegment);
  return { murs, portes: PORTES, fenetres: [], pieceDe: pieceCorniche, pieces: ["dehors", ...PIECES.map((p) => p.id)] };
})();

/** La porte qui relie deux pièces (ou la pièce au dehors), s'il y en a une. */
function porteEntre(a: string, b: string): PorteVue | undefined {
  return PORTES.find((p) => p.entre.includes(a) && p.entre.includes(b));
}

/** On vise d'abord le milieu de la porte, puis un peu au-delà, dans la pièce suivante. */
const AU_DELA = 0.9;

/**
 * Le milieu des Éteints de la corniche : à ciel ouvert (le son porte partout, pas de cascade de gémissements, comme à la
 * station) ; la vue arrêtée par les murs ; la nuit dans les pièces noires ; pour sortir d'une pièce ou y entrer, ils
 * passent par sa porte. La porte fermée de la barricade, elle, les arrête : ils ne la contournent pas (Book 06 §2.1).
 */
export const MILIEU_CORNICHE: Milieu = (() => {
  const ov = obstaclesVue(PLAN_CORNICHE, {});
  return {
    son: () => 1,
    vue: (ax, az, bx, bz) => voit(ov, ax, az, bx, bz),
    obscur: sombreCorniche,
    passage(ax, az, bx, bz) {
      const pa = pieceCorniche(ax, az);
      const pb = pieceCorniche(bx, bz);
      if (pa === pb) return { x: bx, z: bz };
      const p = porteEntre(pa, pb) ?? (pa !== "dehors" ? porteEntre(pa, "dehors") : porteEntre("dehors", pb));
      if (!p) return { x: bx, z: bz };
      const versLa = p.sens === "x" ? { x: 0, z: Math.sign(p.z - az) || 1 } : { x: Math.sign(p.x - ax) || 1, z: 0 };
      if (Math.hypot(p.x - ax, p.z - az) < 0.9) return { x: p.x + versLa.x * AU_DELA, z: p.z + versLa.z * AU_DELA };
      // On s'aligne d'abord sur l'axe de la porte (pour ne pas frotter le chambranle), puis on entre.
      const aligne = p.sens === "x" ? Math.abs(ax - p.x) < p.largeur / 2 - 0.35 : Math.abs(az - p.z) < p.largeur / 2 - 0.35;
      if (aligne) return { x: p.x + versLa.x * AU_DELA, z: p.z + versLa.z * AU_DELA };
      return p.sens === "x" ? { x: p.x, z: p.z - versLa.z * 0.8 } : { x: p.x - versLa.x * 0.8, z: p.z };
    },
    cascade: false,
  };
})();
