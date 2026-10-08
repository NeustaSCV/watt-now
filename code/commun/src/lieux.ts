// Les lieux de la phase 0a (Book 21 §3.2, Book 01 §2 bis) : le terrain du joueur, la halte de la
// station-service et le Comptoir du Carrefour, sur la route de la Campagne (Book 20 §4).
// On ne se promène pas d'un lieu à l'autre : on part d'une sortie, on voyage sur la carte, on arrive.

import { ARRIVEE_COOP, COOP, PORTAIL, obstaclesCoop } from "./cooperative.ts";
import type { Position } from "./deplacement.ts";
import { MARGE_BORD, POINT_ARRIVEE, TERRAIN_TAILLE } from "./regles.ts";

export type LieuId = "terrain" | "station" | "comptoir" | "cooperative";

/** Lieux où l'on peut se trouver (le comptoir ouvre à l'É4, la Coopérative en 0.5). */
export type LieuJouable = LieuId;

/** Tous les lieux, dans l'ordre de la route (Book 23 §7 : terrain → station → Carrefour → Coopérative). */
export const ORDRE_ROUTE: readonly LieuId[] = ["terrain", "station", "comptoir", "cooperative"];

/** Une boîte au sol, alignée sur les axes : centre (x, z), largeur en x, profondeur en z. */
export interface Boite {
  x: number;
  z: number;
  l: number;
  p: number;
}

export interface Zone {
  xMin: number;
  xMax: number;
  zMin: number;
  zMax: number;
  /** Ce qu'on ne traverse pas : bâtiments, épaves, éboulis. */
  obstacles: readonly Boite[];
}

/** Une sortie : là où l'on se tient pour prendre la route. */
export interface Sortie {
  vers: LieuId;
  /** Boîte où il faut se tenir. */
  boite: Boite;
  /** Où l'on apparaît en revenant par cette sortie. */
  arrivee: Position;
  libelle: string;
}

// ---------- Le terrain ----------

export const ZONE_TERRAIN: Zone = {
  xMin: MARGE_BORD,
  xMax: TERRAIN_TAILLE - MARGE_BORD,
  zMin: MARGE_BORD,
  zMax: TERRAIN_TAILLE - MARGE_BORD,
  obstacles: [],
};

/** Le chemin de terre qui part au sud du terrain (Book 19), vers la route de la Campagne. */
export const SORTIE_TERRAIN: Sortie = {
  vers: "station",
  boite: { x: 25, z: TERRAIN_TAILLE - 1.5, l: 6, p: 3 },
  arrivee: { x: 25, z: TERRAIN_TAILLE - 3, o: Math.PI },
  libelle: "Prendre la route",
};

// ---------- La halte : la station-service (≈ 200 × 70 m, Book 01 §2 bis) ----------

export const HALTE = { longueur: 200, largeur: 70 } as const;

/** La route traverse la halte d'ouest en est, au milieu. */
export const ROUTE = { z: 35, demiLargeur: 3.5 } as const;

/** La station (auvent, boutique et atelier), au nord de la route, façade tournée vers elle. */
export const STATION = {
  auvent: { x: 104, z: 24.5, l: 20, p: 8 },
  boutique: { x: 103, z: 14.5, l: 14, p: 6 },
  atelier: { x: 115.5, z: 14.5, l: 9, p: 6 },
} as const;

/**
 * La boutique se visite (moment-vitrine n° 4, Book 21 §5.1.2) : des murs, une porte en façade, un comptoir de caisse.
 * Façade au sud (z = 17,5), porte de 1,6 m centrée en x = 104,1.
 */
export const BOUTIQUE = {
  murs: [
    { x: 103, z: 11.65, l: 14, p: 0.3 },
    { x: 96.15, z: 14.5, l: 0.3, p: 6 },
    { x: 109.85, z: 14.5, l: 0.3, p: 6 },
    { x: 99.65, z: 17.35, l: 7.3, p: 0.3 },
    { x: 107.45, z: 17.35, l: 5.1, p: 0.3 },
  ],
  porte: { x: 104.1, z: 17.35, largeur: 1.6 },
  caisse: { x: 100.6, z: 14.4, l: 3, p: 0.7 },
  /** L'intérieur : quand on y est, le toit et la façade s'effacent pour qu'on se voie. */
  interieur: { x: 103, z: 14.5, l: 13.4, p: 5.4 },
} as const;

/** La ferme en ruine, au nord, à l'écart de la route. */
export const FERME_HALTE = { x: 40, z: 18, largeur: 11, profondeur: 8 } as const;

/** Le goulet : un éboulis de part et d'autre de la route, où les voyageurs se croisent forcément. */
export const GOULET = { x: 154, largeur: 8 } as const;

export const ZONE_STATION: Zone = {
  xMin: 0.5,
  xMax: HALTE.longueur - 0.5,
  // Forêt dense au nord et au sud (Book 01 §2 bis : la route est le seul passage).
  zMin: 9,
  // Au sud, côté caméra, on s'arrête un peu avant les arbres pour rester visible.
  zMax: 59,
  obstacles: [
    ...BOUTIQUE.murs,
    BOUTIQUE.caisse,
    STATION.atelier,
    // Les piliers de l'auvent
    { x: 95.5, z: STATION.auvent.z, l: 0.6, p: 0.6 },
    { x: 112.5, z: STATION.auvent.z, l: 0.6, p: 0.6 },
    // Épaves (alignées sur les axes pour les collisions)
    { x: 63, z: 33.2, l: 4.2, p: 1.9 },
    { x: 139, z: 37, l: 4.2, p: 1.9 },
    { x: 170, z: 22, l: 7.5, p: 2.6 },
    // Le goulet : l'éboulis ne laisse que la route
    { x: GOULET.x, z: 20, l: GOULET.largeur, p: 22 },
    { x: GOULET.x, z: 50.5, l: GOULET.largeur, p: 21 },
  ],
};

/**
 * Les sorties de la halte (P-006, 0.3) : comme sur la carte du monde, le terrain est à l'est (à droite de l'écran)
 * et le Carrefour à l'ouest (à gauche). On arrive du terrain par le bout est de la route.
 */
export const SORTIES_STATION: Sortie[] = [
  {
    vers: "terrain",
    boite: { x: HALTE.longueur - 2, z: ROUTE.z, l: 4, p: 10 },
    arrivee: { x: HALTE.longueur - 4.5, z: ROUTE.z, o: -Math.PI / 2 },
    libelle: "Rentrer chez toi",
  },
  {
    vers: "comptoir",
    boite: { x: 2, z: ROUTE.z, l: 4, p: 10 },
    arrivee: { x: 4.5, z: ROUTE.z, o: Math.PI / 2 },
    libelle: "Continuer vers le Carrefour",
  },
];

// ---------- Le Comptoir du Carrefour (É4, Book 07 §4) : zone neutre gardée, sans Éteints ----------

export const CARREFOUR = { largeur: 60, profondeur: 44 } as const;
/** La route de la station arrive de l'est (P-006 : le Carrefour est à l'ouest de la station, comme sur la carte) et croise trois chemins barrés. */
export const ROUTE_CARREFOUR = { z: 26, demiLargeur: 3.2, x: 32 } as const;
/** Le bâtiment des Compteurs, au nord du carrefour, façade vers la route ; le guichet devant. */
export const COMPTOIR = {
  batiment: { x: 32, z: 11, l: 16, p: 8 },
  guichet: { x: 32, z: 16.6 },
  /** Les cellules de stockage, à l'est du bâtiment. */
  cellules: { x: 46, z: 12, l: 7, p: 5 },
  /** Le pédalier des Compteurs : on y pédale contre des wotts (Book 21 §3.7). */
  pedalier: { x: 19, z: 15.5 },
} as const;

export const ZONE_COMPTOIR: Zone = {
  xMin: 6,
  xMax: CARREFOUR.largeur - 0.5,
  zMin: 4,
  zMax: CARREFOUR.profondeur - 4,
  obstacles: [COMPTOIR.batiment, COMPTOIR.cellules, { x: COMPTOIR.pedalier.x, z: COMPTOIR.pedalier.z - 0.6, l: 1.6, p: 0.7 }],
};

/** Le chemin agricole qui part au nord du Carrefour, vers la Coopérative du Plateau (Book 23 §1). */
export const CHEMIN_COOP = { x: 52, demiLargeur: 1.8 } as const;

export const SORTIES_COMPTOIR: Sortie[] = [
  {
    vers: "station",
    boite: { x: CARREFOUR.largeur - 2, z: ROUTE_CARREFOUR.z, l: 4, p: 10 },
    arrivee: { x: CARREFOUR.largeur - 4.5, z: ROUTE_CARREFOUR.z, o: -Math.PI / 2 },
    libelle: "Reprendre la route",
  },
  {
    vers: "cooperative",
    boite: { x: CHEMIN_COOP.x, z: 5.5, l: 5, p: 3 },
    arrivee: { x: CHEMIN_COOP.x, z: 8, o: 0 },
    libelle: "Prendre le chemin de la Coopérative",
  },
];

// ---------- La Coopérative du Plateau (Book 23) : une par joueur, au bout du chemin agricole ----------

/** On reste dans le grillage ; on entre et on sort par le portail, au sud. */
export const ZONE_COOP: Zone = {
  xMin: 1,
  xMax: COOP.largeur - 1,
  zMin: 1,
  zMax: COOP.profondeur - 0.6,
  obstacles: obstaclesCoop(),
};

export const SORTIES_COOP: Sortie[] = [
  {
    vers: "comptoir",
    boite: { x: PORTAIL.x, z: COOP.profondeur - 1.4, l: PORTAIL.largeur, p: 2.8 },
    arrivee: { ...ARRIVEE_COOP },
    libelle: "Repartir vers le Carrefour",
  },
];

// ---------- La carte du monde (Book 20, réduite à la route de la Campagne) ----------

export interface LieuCarte {
  id: LieuId;
  nom: string;
  /** Distance depuis le terrain, en km, par la route. */
  km: number;
  ouvert: boolean;
  description: string;
}

export const LIEUX: Record<LieuId, LieuCarte> = {
  terrain: { id: "terrain", nom: "Ton terrain", km: 0, ouvert: true, description: "Ta prairie, ta mare, ta ruine de ferme. Personne n'y entre sans toi." },
  station: {
    id: "station",
    nom: "La station-service",
    km: 3,
    ouvert: true,
    description: "Une halte sur la route de la Campagne. La boutique a été pillée, pas l'atelier. Des Éteints dorment dans le coin.",
  },
  comptoir: {
    id: "comptoir",
    nom: "Le Comptoir du Carrefour",
    km: 5,
    ouvert: true,
    description: "Tenu par les Compteurs. On y vend, on y achète, on y dépose son électricité contre des wotts. Zone neutre : pas d'Éteints, pas de combat.",
  },
  cooperative: {
    id: "cooperative",
    nom: "La Coopérative du Plateau",
    km: 8,
    ouvert: true,
    description:
      "Au bout du chemin agricole, au nord du Carrefour. Le hangar n'a jamais été vidé : on dit qu'il y reste de quoi tenir un hiver. Les Éteints y sont nombreux, et il fait noir à l'intérieur.",
  },
};

/** Coût d'un trajet à pied (Book 01 §2 bis) : ≈ 60 kcal et ≈ 0,08 L d'eau par km. */
export const KCAL_PAR_KM = 60;
export const EAU_PAR_KM = 0.08;
/** Durée du trajet à l'écran : une courte séquence sur la carte, quelle que soit la distance en 0a. */
export const DUREE_VOYAGE_S = 10;

export function distanceKm(de: LieuId, vers: LieuId): number {
  return Math.abs(LIEUX[de].km - LIEUX[vers].km);
}

// ---------- Outils ----------

const ZONES: Record<LieuId, Zone> = { terrain: ZONE_TERRAIN, station: ZONE_STATION, comptoir: ZONE_COMPTOIR, cooperative: ZONE_COOP };
const SORTIES: Record<LieuId, Sortie[]> = { terrain: [SORTIE_TERRAIN], station: SORTIES_STATION, comptoir: SORTIES_COMPTOIR, cooperative: SORTIES_COOP };

export function zoneDe(lieu: LieuJouable): Zone {
  return ZONES[lieu];
}

export function sortiesDe(lieu: LieuJouable): Sortie[] {
  return SORTIES[lieu];
}

/**
 * Les lieux se traversent à pied (Book 01 §2 bis) : la route est une ligne, et l'on s'arrête à chaque lieu entre les
 * deux (du terrain au Carrefour, la station ; du terrain à la Coopérative, la station puis le Carrefour).
 * Renvoie le lieu où l'on arrive vraiment en prenant la route vers `vers` depuis `de`.
 */
export function etapeVers(de: LieuJouable, vers: LieuId): LieuJouable {
  const i = ORDRE_ROUTE.indexOf(de);
  const j = ORDRE_ROUTE.indexOf(vers);
  if (i === j) return vers;
  return ORDRE_ROUTE[i + Math.sign(j - i)]!;
}

export function dansBoite(x: number, z: number, b: Boite, marge = 0): boolean {
  return Math.abs(x - b.x) <= b.l / 2 + marge && Math.abs(z - b.z) <= b.p / 2 + marge;
}

/** La sortie où se tient le personnage, s'il y en a une. */
export function sortieIci(lieu: LieuJouable, x: number, z: number): Sortie | null {
  return sortiesDe(lieu).find((s) => dansBoite(x, z, s.boite)) ?? null;
}

/** Où l'on arrive dans un lieu, selon d'où l'on vient. */
export function arriveeDans(lieu: LieuJouable, depuis: LieuId): Position {
  const sorties = SORTIES[lieu];
  // On arrive par la sortie qui mène d'où l'on vient (au Carrefour, par l'est depuis la station, par le nord depuis la Coopérative).
  const versDepuis = sorties.find((s) => s.vers === etapeVers(lieu, depuis)) ?? sorties[0]!;
  return { ...versDepuis.arrivee };
}

/** Point d'arrivée par défaut d'un nouveau personnage. */
export const ARRIVEE_DEPART: Position = { x: POINT_ARRIVEE.x, z: POINT_ARRIVEE.z, o: 0 };

export function estLieuJouable(valeur: unknown): valeur is LieuJouable {
  return typeof valeur === "string" && (ORDRE_ROUTE as readonly string[]).includes(valeur);
}
