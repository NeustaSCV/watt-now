// Le bois, les pierres et la cueillette semés au hasard (plan 0.9, chantiers G et I : M5, M7).
//
// Ce module est la **table des quantités** (SEMIS) : tout ce qu'un lieu sème dans l'herbe (branches, bûches, pierres ;
// cèpes, amanites, buissons à baies), ligne par ligne, avec son délai de retour. **Une seule table, à changer d'un coup.**
// Les lignes « 0.9 » sont à zéro : leurs quantités attendent la décision du porteur
// (`.claude-travail/proposition-quantites.md` du chantier). Changer un nombre change le contenu du lieu :
// **augmenter alors la version du lieu** (VERSION_HALTE, VERSION_GUE, VERSION_MOULIN, VERSION_COOP), sinon la base
// garde l'ancien semis (semis.test.ts le vérifie).
//
// Les règles (plan 0.9 §3.3 ter et quinquies) :
// - **au hasard** : chaque ligne se tire dans une « étendue » du lieu (la pelouse libre, sous les arbres, en lisière,
//   le banc de galets…), jamais dans l'eau, un bâtiment, sur une route, un chemin ou un obstacle ; les étendues sont
//   dans semis-lieux.ts ;
// - **un point pris revient ailleurs** (`ailleurs`) : sa nouvelle place est tirée dans la même étendue au moment de la
//   prise (on ne le voit plus) ; il y reparaît à son délai (serveur/src/lieu-vivant.ts, `DefinitionLieuVivant.semis`).
//   Un buisson, lui, reste où il pousse : on n'en prend que les baies (RESTE_EN_PLACE) ;
// - **le vrac grandit avec les voyageurs** (B8) pour les types marqués `vrac` : le lieu pose VRAC_MAX tournées de chaque
//   ligne, dont seule la première est en jeu pour un voyageur seul. Dans un lieu à un joueur (le Moulin, la
//   Coopérative), rien ne grandit.
//
// Ce fichier n'importe que terrain.ts : les lieux (halte.ts, gue.ts) y lisent leurs nombres sans cycle.

import { EMPRISE_RESSOURCE, type TypeRessource } from "./terrain.ts";

/** Ce qui se sème : le bois et les pierres (M5), la cueillette (M7). */
export type TypeSemis = Extract<TypeRessource, "branche" | "buche" | "pierre" | "cepe" | "amanite_tue_mouches" | "amanite_phalloide" | "buisson">;

/** Les lieux qui sèment (le Carrefour n'a aucune ressource ; le terrain a son propre semis, terrain.ts). */
export type LieuSemis = "station" | "gue" | "moulin" | "cooperative";

/** Une ligne du semis : tant de points d'un type, tirés dans une étendue du lieu. */
export interface LigneSemis {
  type: TypeSemis;
  /** Combien de points pour un voyageur seul (un type en vrac : par tournée ; le lieu en pose VRAC_MAX tournées). */
  n: number;
  /** L'étendue du lieu où on la tire (semis-lieux.ts, ETENDUES). */
  ou: string;
  /** L'écart minimal avec les autres ressources (m). */
  ecart: number;
  /** Un point pris revient ailleurs dans son étendue (M5) ; sinon, à sa place. */
  ailleurs: boolean;
  /** Le vrac : posée à la première tournée seulement ; aux suivantes, la ligne d'après prend sa part (le banc du gué). */
  premiereTourneeSeule?: true;
  /** Une ligne nouvelle de la 0.9 (posée après le contenu d'avant : les points d'avant gardent leur identifiant). */
  nouvelle?: true;
}

export interface SemisLieu {
  /** Les types qui grandissent avec les voyageurs (B8). */
  vrac: Partial<Record<TypeSemis, true>>;
  /** Le délai de retour de ces types dans ce lieu (ms ; null : jamais) ; sinon, REPOUSSE_MS. */
  repousse: Partial<Record<TypeSemis, number | null>>;
  lignes: Record<string, LigneSemis>;
}

const MIN = 60_000;

/**
 * **La table.** Les lignes d'avant gardent leurs quantités (0.8.2 : B2 à B8, Q1 du plan 0.8.2) ; les lignes nouvelles
 * (`nouvelle`) sont à zéro tant que le porteur ne les a pas validées. Ne pas ajouter de bûches ni de branches à la
 * station (porteur, 2026-10-13) ; la nourriture : la station et le gué seulement, pas de poules.
 */
export const SEMIS: Record<LieuSemis, SemisLieu> = {
  station: {
    vrac: { buche: true, pierre: true },
    // B2, B4 : bûches et pierres en 30 min ; les branches (40 min) et les buissons (20 min) : REPOUSSE_MS.
    repousse: { buche: 30 * MIN, pierre: 30 * MIN },
    lignes: {
      branches_lisiere: { type: "branche", n: 26, ou: "lisiere", ecart: 1.5, ailleurs: true },
      buches_lisiere: { type: "buche", n: 12, ou: "lisiere", ecart: 1.5, ailleurs: true },
      pierres_goulet: { type: "pierre", n: 8, ou: "goulet", ecart: 1.5, ailleurs: true },
      pierres_ferme: { type: "pierre", n: 5, ou: "ferme", ecart: 1.5, ailleurs: true },
      buissons: { type: "buisson", n: 5, ou: "bords", ecart: 1.5, ailleurs: false },
      // 0.9 (M5) : des pierres sur les pelouses ; pas de bois en plus.
      pierres_pelouse: { type: "pierre", n: 0, ou: "pelouse", ecart: 2, ailleurs: true, nouvelle: true },
      // 0.9 (M7) : des cèpes et quelques amanites sous les arbres de la lisière ; des buissons en lisière.
      cepes: { type: "cepe", n: 0, ou: "sous_arbres", ecart: 1.5, ailleurs: true, nouvelle: true },
      amanites_tue_mouches: { type: "amanite_tue_mouches", n: 0, ou: "sous_arbres", ecart: 1.5, ailleurs: true, nouvelle: true },
      amanites_phalloides: { type: "amanite_phalloide", n: 0, ou: "sous_arbres", ecart: 1.5, ailleurs: true, nouvelle: true },
      buissons_lisiere: { type: "buisson", n: 0, ou: "en_lisiere", ecart: 2.5, ailleurs: false, nouvelle: true },
    },
  },
  gue: {
    vrac: { pierre: true, buche: true },
    // Plan 0.8.2 (R1) : les pierres, les bûches et les branches reviennent en 30 min.
    repousse: { pierre: 30 * MIN, buche: 30 * MIN, branche: 30 * MIN },
    lignes: {
      // B5 : 15 pierres sur le banc de galets (première tournée seulement), 6 sur les pistes du radier (R1).
      pierres_banc: { type: "pierre", n: 15, ou: "banc", ecart: 0.5, ailleurs: true, premiereTourneeSeule: true },
      pierres_pistes: { type: "pierre", n: 6, ou: "pistes", ecart: 0.9, ailleurs: true },
      // Q1 (0.8.2) : 8 branches, les 5 du tas de bois flotté (à leur place) et 3 sur les berges ; 4 bûches au pied des talus.
      branches_tas: { type: "branche", n: 5, ou: "tas", ecart: 0, ailleurs: false },
      branches_berges: { type: "branche", n: 3, ou: "berges", ecart: 3, ailleurs: true },
      buches_talus: { type: "buche", n: 4, ou: "talus", ecart: 4, ailleurs: true },
      // 0.9 (M5) : du bois mort et des cailloux sur les pelouses du fond de vallée.
      branches_pelouse: { type: "branche", n: 0, ou: "pelouse", ecart: 2, ailleurs: true, nouvelle: true },
      buches_pelouse: { type: "buche", n: 0, ou: "pelouse", ecart: 2.5, ailleurs: true, nouvelle: true },
      pierres_pelouse: { type: "pierre", n: 0, ou: "pelouse", ecart: 2, ailleurs: true, nouvelle: true },
      // 0.9 (M7) : des cèpes et quelques amanites sous les saules, les aulnes et les frênes ; des buissons au pied des talus.
      cepes: { type: "cepe", n: 0, ou: "sous_arbres", ecart: 1.5, ailleurs: true, nouvelle: true },
      amanites_tue_mouches: { type: "amanite_tue_mouches", n: 0, ou: "sous_arbres", ecart: 1.5, ailleurs: true, nouvelle: true },
      amanites_phalloides: { type: "amanite_phalloide", n: 0, ou: "sous_arbres", ecart: 1.5, ailleurs: true, nouvelle: true },
      buissons: { type: "buisson", n: 0, ou: "en_lisiere", ecart: 2.5, ailleurs: false, nouvelle: true },
    },
  },
  moulin: {
    vrac: {},
    // À valider avec les quantités (tout revient de toute façon à 24 h, avec le Moulin).
    repousse: { branche: 30 * MIN, buche: 30 * MIN, pierre: 30 * MIN },
    lignes: {
      branches_pelouse: { type: "branche", n: 0, ou: "pelouse", ecart: 2, ailleurs: true, nouvelle: true },
      buches_pelouse: { type: "buche", n: 0, ou: "pelouse", ecart: 2.5, ailleurs: true, nouvelle: true },
      pierres_pelouse: { type: "pierre", n: 0, ou: "pelouse", ecart: 2, ailleurs: true, nouvelle: true },
    },
  },
  cooperative: {
    vrac: {},
    // À valider avec les quantités (tout revient de toute façon à 24 h, avec la Coopérative).
    repousse: { branche: 30 * MIN, buche: 30 * MIN, pierre: 30 * MIN },
    lignes: {
      // La Coopérative n'a pas de pelouse : la cour est de gravier ; l'herbe pousse le long du grillage.
      branches_grillage: { type: "branche", n: 0, ou: "grillage", ecart: 2, ailleurs: true, nouvelle: true },
      buches_grillage: { type: "buche", n: 0, ou: "grillage", ecart: 2.5, ailleurs: true, nouvelle: true },
      pierres_grillage: { type: "pierre", n: 0, ou: "grillage", ecart: 2, ailleurs: true, nouvelle: true },
    },
  },
};

/** Le vrac d'un lieu pour un voyageur seul (B8) : la somme de ses lignes, par type en vrac. */
export function vracDuSemis(lieu: LieuSemis): Partial<Record<TypeSemis, number>> {
  const s = SEMIS[lieu];
  const vrac: Partial<Record<TypeSemis, number>> = {};
  for (const l of Object.values(s.lignes)) if (s.vrac[l.type]) vrac[l.type] = (vrac[l.type] ?? 0) + l.n;
  return vrac;
}

/** Combien de points d'un type un lieu a en jeu pour un voyageur seul (le vrac de base, ou toutes ses lignes). */
export function semisDe(lieu: LieuSemis, type: TypeSemis): number {
  return Object.values(SEMIS[lieu].lignes).reduce((s, l) => s + (l.type === type ? l.n : 0), 0);
}

/** Les lignes nouvelles de la 0.9 d'un lieu, dans l'ordre de la table. */
export function lignesNouvelles(lieu: LieuSemis): [string, LigneSemis][] {
  return Object.entries(SEMIS[lieu].lignes).filter(([, l]) => l.nouvelle);
}

/** Ce qu'un lieu a semé : pour chaque point, sa ligne (le nom dans la table) et sa tournée de vrac (0 : la première). */
export type Semes = Map<number, { ligne: string; tour: number }>;

/**
 * Ce que le lieu vivant sait du semis (serveur/src/lieu-vivant.ts, `DefinitionLieuVivant.semis`) : la tournée de chaque
 * point (le vrac met en jeu la première tournée d'abord, puis la suivante…), et où revient un point pris.
 */
export interface SemisVivant {
  tournee(id: number): number;
  /** La nouvelle place d'un point qu'on vient de prendre ; null : il reviendra à sa place. */
  ailleurs(r: { id: number; x: number; z: number }, alea: () => number, occupees: Iterable<{ x: number; z: number }>): { x: number; z: number } | null;
}

// ---------- Tirer une place ----------

/** Une étendue : où une ligne se tire, et ce qui y est libre (ni eau, ni bâtiment, ni route ou chemin, ni obstacle). */
export interface Etendue {
  /** Un point au hasard dans l'étendue (sans rien vérifier). */
  tirer(alea: () => number): { x: number; z: number };
  /** Ce point est-il libre ? (sans compter les autres ressources : l'écart s'en charge) */
  libre(x: number, z: number): boolean;
}

const arrondi = (v: number) => Math.round(v * 100) / 100;

/**
 * Une place libre de l'étendue, à `ecart` mètres au moins de chaque point de `occupees` (plus l'emprise d'une grosse
 * ressource : une épave, un buisson), en `essais` tirages au plus ; null s'il n'y en a pas (on n'en pose pas de force :
 * jamais dans l'eau ni dans un mur).
 */
export function placeLibre(e: Etendue, alea: () => number, occupees: Iterable<{ x: number; z: number; type?: TypeRessource }>, ecart: number, essais = 400): { x: number; z: number } | null {
  const autres = [...occupees];
  for (let i = 0; i < essais; i++) {
    const p = e.tirer(alea);
    if (!e.libre(p.x, p.z)) continue;
    if (autres.some((o) => Math.hypot(o.x - p.x, o.z - p.z) < ecart + (o.type ? (EMPRISE_RESSOURCE[o.type] ?? 0) : 0))) continue;
    return { x: arrondi(p.x), z: arrondi(p.z) };
  }
  return null;
}
