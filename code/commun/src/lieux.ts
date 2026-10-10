// Les lieux de la phase 0a (Book 21 §3.2, Book 01 §2 bis) : le terrain du joueur, la halte de la
// station-service et le Comptoir du Carrefour, sur la route de la Campagne (Book 20 §4).
// On ne se promène pas d'un lieu à l'autre : on part d'une sortie, on voyage sur la carte, on arrive.
//
// 0.8 (plan §3, chantier 4) : la carte à deux routes. La route A passe la rivière par le pont (la station, puis la
// Coopérative) ; la route B la passe à gué (le Gué-aux-Saules, puis le Moulin du Gué). Le gué et le Moulin sont
// branchés ici vides : leur contenu (obstacles, butin, Éteints, rendu) est aux chantiers 11 et 12.

import { ARRIVEE_COOP, BRECHE, COOP, PORTAIL, PORTES, boitePorte, obstaclesCoop, portesInitiales } from "./cooperative.ts";
import type { Position } from "./deplacement.ts";
import { MARGE_GRILLE, boitesPres, creerGrille, type GrilleObstacles } from "./grille.ts";
import type { EtapeMonde } from "./lignees.ts";
import { MARGE_BORD, POINT_ARRIVEE, TERRAIN_TAILLE } from "./regles.ts";

export type LieuId = "terrain" | "station" | "comptoir" | "cooperative" | "gue" | "moulin";

/** Lieux où l'on peut se trouver (le comptoir ouvre à l'É4, la Coopérative en 0.5, le gué et le Moulin en 0.8). */
export type LieuJouable = LieuId;

/**
 * Tous les lieux, dans l'ordre où on les découvre (Book 23 §7 : terrain → station → Carrefour → Coopérative ; plan 0.8
 * §1.1, le parcours : la station à la 1re sortie, le gué à la 2e, puis l'un des deux L1).
 */
export const ORDRE_ROUTE: readonly LieuId[] = ["terrain", "station", "comptoir", "gue", "cooperative", "moulin"];

/**
 * Les tronçons de la route, d'un lieu à son voisin, en km (Book 01 §2 bis : ≈ 60 kcal et 0,08 L d'eau par km).
 * 0.7.3 : la Coopérative est derrière la station-service, comme le Comptoir (un chemin de terre part de la halte) ;
 * le chemin agricole du Carrefour à la Coopérative reste (un deuxième accès).
 * 0.8 (B16) : la route B à la même distance que la route A : terrain → gué 3 km, gué → Moulin 2 km. On passe par le gué
 * pour aller au Moulin, comme par la station pour la Coopérative.
 */
export const TRONCONS: readonly { a: LieuId; b: LieuId; km: number }[] = [
  { a: "terrain", b: "station", km: 3 },
  { a: "station", b: "comptoir", km: 2 },
  { a: "station", b: "cooperative", km: 2 },
  { a: "comptoir", b: "cooperative", km: 3 },
  { a: "terrain", b: "gue", km: 3 },
  { a: "gue", b: "moulin", km: 2 },
];

/**
 * Les étapes du monde et leur lieu (plan 0.8 §3, chantier 4) : le contenu du jeu (clés, quêtes, indices) cite l'étape
 * (`EtapeMonde`, lignees.ts) ; l'affichage met le nom du lieu. Le niveau 2 complétera la même table.
 */
export const ETAPES_LIEUX = {
  maison: "terrain",
  H1A: "station",
  H1B: "gue",
  L1A: "cooperative",
  L1B: "moulin",
} as const satisfies Partial<Record<EtapeMonde, LieuId>>;

/** Le lieu d'une étape du monde (undefined : une étape qui n'a pas encore de lieu, le niveau 2). */
export function lieuDeLEtape(etape: EtapeMonde): LieuId | undefined {
  return (ETAPES_LIEUX as Partial<Record<EtapeMonde, LieuId>>)[etape];
}

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
  /** Pour les lieux aux nombreux obstacles (la Coopérative) : les obstacles rangés par cases. */
  grille?: GrilleObstacles;
}

/** Un point (avec son rayon) touche-t-il un obstacle de la zone ? */
export function heurte(zone: Zone, x: number, z: number, rayon: number): boolean {
  const boites = zone.grille && rayon <= MARGE_GRILLE ? boitesPres(zone.grille, x, z) : zone.obstacles;
  for (const b of boites) if (dansBoite(x, z, b, rayon)) return true;
  return false;
}

/** Une sortie : là où l'on se tient pour prendre la route. */
export interface Sortie {
  vers: LieuId;
  /** Les autres lieux où mène la même sortie (le chemin du portail de la Coopérative va à la station et au Carrefour). */
  aussi?: readonly LieuId[];
  /** Boîte où il faut se tenir. */
  boite: Boite;
  /** Où l'on apparaît en revenant par cette sortie (sauf pour une sortie `sansArrivee`). */
  arrivee: Position;
  libelle: string;
  /**
   * Une sortie où l'on n'arrive jamais (0.8) : on peut repartir par là, jamais entrer. La brèche de la Coopérative ; le
   * chemin de halage du Moulin, vers le gué (h1b-l1b-conception §2.6 : on arrive toujours au pont). `arrivee` ne sert
   * alors qu'à dire où l'on se tient juste à l'intérieur.
   */
  sansArrivee?: boolean;
}

// ---------- Le terrain ----------

export const ZONE_TERRAIN: Zone = {
  xMin: MARGE_BORD,
  xMax: TERRAIN_TAILLE - MARGE_BORD,
  zMin: MARGE_BORD,
  zMax: TERRAIN_TAILLE - MARGE_BORD,
  obstacles: [],
};

/**
 * Le chemin de terre qui part au sud du terrain (Book 19), vers la route de la Campagne. 0.8 : au bout du chemin, la
 * route se partage, par le pont vers la station (la route A), à gué vers le Gué-aux-Saules (la route B).
 */
export const SORTIE_TERRAIN: Sortie = {
  vers: "station",
  aussi: ["gue"],
  boite: { x: 25, z: TERRAIN_TAILLE - 1.5, l: 6, p: 3 },
  arrivee: { x: 25, z: TERRAIN_TAILLE - 3, o: Math.PI },
  libelle: "Prendre la route",
};

// ---------- La halte : la station-service (≈ 200 × 70 m, Book 01 §2 bis) ----------

export const HALTE = { longueur: 200, largeur: 70 } as const;

/** Le chemin de terre de la Coopérative (0.7.3) : il quitte la route vers le nord, entre la ferme et la station. */
export const CHEMIN_COOP_HALTE = { x: 72, demiLargeur: 1.8 } as const;

/** La route traverse la halte d'ouest en est, au milieu. */
export const ROUTE = { z: 35, demiLargeur: 3.5 } as const;

/** La station (auvent, boutique et atelier), au nord de la route, façade tournée vers elle. */
export const STATION = {
  auvent: { x: 104, z: 24.5, l: 20, p: 8 },
  boutique: { x: 103, z: 14.5, l: 14, p: 6 },
  atelier: { x: 115.5, z: 14.5, l: 9, p: 6 },
} as const;

/**
 * Le garage de la station (plan 0.8, chantier 10). Devant l'atelier, son établi de métal (la caisse de l'atelier, avec
 * les clous, le fil de fer et l'huile) et, à sa droite, un établi de bois bas : dessous, l'enclume de dépanneur et le
 * sac de charbon. À l'est, une voiture éventrée, capot ouvert, et l'établi où l'on a posé son petit alternateur.
 * Derrière l'atelier, contre le mur, le bois de chauffage. Les boîtes servent aux collisions (ZONE_STATION) et au rendu (rendu/halte.ts).
 */
export const GARAGE = {
  etabliBois: { x: 117.6, z: 18.05, l: 1.2, p: 0.5 },
  voitureEventree: { x: 125.6, z: 13.9, l: 4.2, p: 1.9 },
  etabliVoiture: { x: 123.9, z: 16.9, l: 1.6, p: 0.6 },
  tasBois: { x: 119.1, z: 10.85, l: 2, p: 0.62 },
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
    // Le garage (plan 0.8, chantier 10) : l'établi de bois de l'enclume, la voiture éventrée et son établi, le tas de bois.
    GARAGE.etabliBois,
    GARAGE.voitureEventree,
    GARAGE.etabliVoiture,
    GARAGE.tasBois,
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
  // 0.7.3 : le chemin de terre de la Coopérative, au nord de la route, à l'ouest de la station (on n'a plus à passer
  // par le Carrefour). La forêt s'ouvre sur sa largeur ; on part en le remontant jusqu'à la lisière.
  {
    vers: "cooperative",
    boite: { x: CHEMIN_COOP_HALTE.x, z: ZONE_STATION.zMin + 1.5, l: CHEMIN_COOP_HALTE.demiLargeur * 2 + 1.4, p: 3 },
    arrivee: { x: CHEMIN_COOP_HALTE.x, z: ZONE_STATION.zMin + 3.5, o: 0 },
    libelle: "Prendre le chemin de la Coopérative",
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

/** Le chemin agricole qui part au nord du Carrefour, vers la Coopérative du Plateau (Book 23 §1). */
export const CHEMIN_COOP = { x: 52, demiLargeur: 1.8 } as const;

/** Le bord est du Carrefour : le grillage au nord de la route, la haie au sud ; la route de la station passe entre. */
export const BORD_EST_CARREFOUR = CARREFOUR.largeur - 6;

/** Un tronçon au sol (clôture, haie), droit, d'un point à un autre ; aligné sur un axe pour les collisions. */
export interface Troncon {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
}

/** La boîte de collision d'un tronçon aligné sur un axe, d'une épaisseur donnée (débordant d'une demi-épaisseur aux bouts). */
export function boiteTroncon(t: Troncon, epaisseur: number): Boite {
  return {
    x: (t.x1 + t.x2) / 2,
    z: (t.z1 + t.z2) / 2,
    l: Math.abs(t.x2 - t.x1) + epaisseur,
    p: Math.abs(t.z2 - t.z1) + epaisseur,
  };
}

/**
 * L'enceinte du Carrefour (0.7.1 : plus de barrière invisible). Chaque bord du lieu est quelque chose qu'on voit :
 * le grillage des Compteurs autour de l'esplanade (une trouée au nord pour le chemin de la Coopérative), les barrages
 * des routes fermées (la Ville à l'ouest, la Côte au sud), une haie basse au sud de la route (basse : elle est côté
 * caméra). Le seul bord ouvert est la route de la station, à l'est : c'est la sortie. Le rendu (comptoir.ts) dessine
 * ces mêmes tronçons ; les collisions en sont tirées.
 */
export const ENCEINTE_COMPTOIR = {
  /** Le grillage des Compteurs, tenu (pas de pan arraché : ici, on entretient). */
  grillage: [
    { x1: 6, z1: 3, x2: CHEMIN_COOP.x - 3, z2: 3 },
    { x1: 6, z1: 3, x2: 6, z2: ROUTE_CARREFOUR.z - ROUTE_CARREFOUR.demiLargeur - 0.3 },
    { x1: BORD_EST_CARREFOUR, z1: 3, x2: BORD_EST_CARREFOUR, z2: ROUTE_CARREFOUR.z - ROUTE_CARREFOUR.demiLargeur - 0.3 },
  ] as readonly Troncon[],
  epaisseurGrillage: 0.2,
  /** La haie basse, au sud de la route : de l'ouest au barrage de la Côte, puis jusqu'à l'est. */
  haies: [
    { x1: 6, z1: ROUTE_CARREFOUR.z + 4, x2: 6, z2: CARREFOUR.profondeur - 2.5 },
    { x1: 6, z1: CARREFOUR.profondeur - 2.5, x2: ROUTE_CARREFOUR.x - ROUTE_CARREFOUR.demiLargeur - 0.4, z2: CARREFOUR.profondeur - 2.5 },
    { x1: ROUTE_CARREFOUR.x + ROUTE_CARREFOUR.demiLargeur + 0.4, z1: CARREFOUR.profondeur - 2.5, x2: BORD_EST_CARREFOUR, z2: CARREFOUR.profondeur - 2.5 },
    { x1: BORD_EST_CARREFOUR, z1: ROUTE_CARREFOUR.z + 4, x2: BORD_EST_CARREFOUR, z2: CARREFOUR.profondeur - 2.5 },
  ] as readonly Troncon[],
  epaisseurHaie: 1,
  /** Les routes barrées par les Compteurs : centre, orientation (0 : la planche suit x), longueur de la planche. */
  barrages: [
    { x: 6, z: ROUTE_CARREFOUR.z, o: Math.PI / 2, texte: "Route de la Ville : fermée" },
    { x: ROUTE_CARREFOUR.x, z: CARREFOUR.profondeur - 2.5, o: 0, texte: "Route de la Côte : fermée" },
  ],
  longueurBarrage: 6.2,
} as const;

/** La boîte d'un barrage de route (planche sur deux chevalets). */
export function boiteBarrage(b: { x: number; z: number; o: number }): Boite {
  const long = ENCEINTE_COMPTOIR.longueurBarrage;
  return Math.abs(Math.sin(b.o)) > 0.5 ? { x: b.x, z: b.z, l: 0.5, p: long } : { x: b.x, z: b.z, l: long, p: 0.5 };
}

/**
 * Ce qui meuble l'esplanade et qu'on ne traverse pas (0.7.1) : le rendu (comptoir.ts) pose chaque objet à ces places.
 * Les Compteurs (les deux gardes) ne bloquent pas : ce sont des personnages, comme les autres joueurs.
 */
const FACADE_AGENCE = COMPTOIR.batiment.z + COMPTOIR.batiment.p / 2;
export const MOBILIER_COMPTOIR = {
  /** Les deux chicanes de sacs de sable, devant l'agence (centre du premier sac du rang du bas). */
  sacs: [
    { x: COMPTOIR.batiment.x - 6.6, z: FACADE_AGENCE + 1.6 },
    { x: COMPTOIR.batiment.x + 6.8, z: FACADE_AGENCE + 1.6 },
  ],
  /** Les bacs de légumes, contre la façade. */
  bacs: [COMPTOIR.batiment.x - COMPTOIR.batiment.l / 2 + 1.2, COMPTOIR.batiment.x - COMPTOIR.batiment.l / 2 + 3.4],
  /** Le récupérateur d'eau de pluie, contre le pignon ouest. */
  tonneau: { x: COMPTOIR.batiment.x - COMPTOIR.batiment.l / 2 - 0.6, z: FACADE_AGENCE - 1.2 },
  /** Le panneau d'affichage. */
  avis: { x: COMPTOIR.batiment.x - 9.4, z: FACADE_AGENCE + 2.6, o: 0.35 },
  /** Le banc de la file d'attente. */
  banc: { x: COMPTOIR.guichet.x - 5.4, z: FACADE_AGENCE + 3.6, o: 0.1 },
  /** Le mât du drapeau des Compteurs. */
  drapeau: { x: COMPTOIR.batiment.x + COMPTOIR.batiment.l / 2 + 3.2, z: FACADE_AGENCE + 2.4 },
  /** Le lampadaire de la Compagnie, au coin du carrefour. */
  lampadaire: { x: ROUTE_CARREFOUR.x - 7, z: ROUTE_CARREFOUR.z - 4.4 },
  /** Le panneau de la route de la station. */
  panneauStation: { x: CARREFOUR.largeur - 9, z: ROUTE_CARREFOUR.z + ROUTE_CARREFOUR.demiLargeur + 1.6 },
} as const;

/** Les poteaux et la corde de la file d'attente : trois poteaux de chaque côté, en biais vers le guichet. */
export function poteauxFile(): { x: number; z: number }[][] {
  return [-1, 1].map((s) => [0, 1, 2].map((k) => ({ x: COMPTOIR.guichet.x + s * (1.8 + k * 0.35), z: FACADE_AGENCE + 2.2 + k * 1.1 })));
}

function obstaclesComptoir(): Boite[] {
  const { batiment, cellules, pedalier, guichet } = COMPTOIR;
  const m = MOBILIER_COMPTOIR;
  const e = ENCEINTE_COMPTOIR;
  return [
    batiment,
    cellules,
    // Le banc du pédalier
    { x: pedalier.x, z: pedalier.z - 0.6, l: 1.6, p: 0.7 },
    // La tablette du guichet, qui déborde de la façade
    { x: guichet.x, z: FACADE_AGENCE + 0.3, l: 3, p: 0.6 },
    // Le compteur à aiguille sur son poteau, au coin des cellules
    { x: cellules.x + cellules.l / 2 + 0.6, z: cellules.z + 1.45, l: 1, p: 0.3 },
    ...m.sacs.map((s) => ({ x: s.x + 0.22, z: s.z, l: 3.45, p: 0.75 })),
    { x: (m.bacs[0] + m.bacs[1]) / 2, z: FACADE_AGENCE + 0.8, l: m.bacs[1] - m.bacs[0] + 1.8, p: 0.6 },
    { x: m.tonneau.x, z: m.tonneau.z, l: 0.9, p: 0.9 },
    { x: m.avis.x, z: m.avis.z, l: 1.6, p: 0.7 },
    { x: m.banc.x, z: m.banc.z, l: 1.85, p: 0.6 },
    { x: m.drapeau.x, z: m.drapeau.z, l: 0.8, p: 0.8 },
    { x: m.lampadaire.x, z: m.lampadaire.z, l: 0.35, p: 0.35 },
    { x: m.panneauStation.x, z: m.panneauStation.z, l: 0.35, p: 0.35 },
    // La corde de la file : une boîte par longueur de corde, d'un poteau au suivant
    ...poteauxFile().flatMap((cote) =>
      cote.slice(1).map((b, k) => {
        const a = cote[k]!;
        return { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2, l: Math.abs(b.x - a.x) + 0.3, p: Math.abs(b.z - a.z) + 0.3 };
      }),
    ),
    // L'enceinte
    ...e.grillage.map((t) => boiteTroncon(t, e.epaisseurGrillage)),
    ...e.haies.map((t) => boiteTroncon(t, e.epaisseurHaie)),
    ...e.barrages.map(boiteBarrage),
  ];
}

/**
 * Les bornes du Carrefour sont celles de l'enceinte : on bute toujours sur le grillage, la haie ou un barrage avant
 * d'atteindre une borne, sauf aux deux sorties (la route de la station à l'est, le chemin de la Coopérative au nord).
 */
export const ZONE_COMPTOIR: Zone = {
  xMin: 6,
  xMax: BORD_EST_CARREFOUR,
  zMin: 3,
  zMax: CARREFOUR.profondeur - 2.5,
  obstacles: obstaclesComptoir(),
};

export const SORTIES_COMPTOIR: Sortie[] = [
  {
    vers: "station",
    boite: { x: BORD_EST_CARREFOUR, z: ROUTE_CARREFOUR.z, l: 4, p: 10 },
    arrivee: { x: BORD_EST_CARREFOUR - 2.5, z: ROUTE_CARREFOUR.z, o: -Math.PI / 2 },
    libelle: "Reprendre la route",
  },
  {
    vers: "cooperative",
    boite: { x: CHEMIN_COOP.x, z: 5, l: 6, p: 4 },
    arrivee: { x: CHEMIN_COOP.x, z: 8, o: 0 },
    libelle: "Prendre le chemin de la Coopérative",
  },
];

// ---------- La Coopérative du Plateau (Book 23) : une par joueur, au bout du chemin agricole ----------

const FIXES_COOP = obstaclesCoop();
const zonesCoop = new Map<string, Zone>();

/**
 * La Coopérative selon l'état de ses portes : une porte fermée bouche son ouverture (Book 23 §2.2). On reste dans le
 * grillage ; on entre et on sort par le portail, au sud. Une zone par combinaison de portes, gardée.
 */
export function zoneCoop(portes: Readonly<Record<string, boolean>>): Zone {
  const fermees = PORTES.filter((p) => !(portes[p.id] ?? p.ouverte));
  const cle = fermees.map((p) => p.id).join(",");
  let z = zonesCoop.get(cle);
  if (!z) {
    const obstacles = [...FIXES_COOP, ...fermees.map(boitePorte)];
    z = { xMin: 1, xMax: COOP.largeur - 1, zMin: 1, zMax: COOP.profondeur - 0.6, obstacles, grille: creerGrille(obstacles) };
    zonesCoop.set(cle, z);
  }
  return z;
}

/** La Coopérative telle qu'on la trouve : les portes dans leur état d'origine. */
export const ZONE_COOP: Zone = zoneCoop(portesInitiales());

export const SORTIES_COOP: Sortie[] = [
  {
    // 0.7.3 : le chemin du portail mène à la station-service (le plus court pour rentrer) et, comme avant, au Carrefour.
    vers: "station",
    aussi: ["comptoir"],
    boite: { x: PORTAIL.x, z: COOP.profondeur - 1.4, l: PORTAIL.largeur, p: 2.8 },
    arrivee: { ...ARRIVEE_COOP },
    libelle: "Reprendre le chemin",
  },
  // La brèche du grillage, à l'ouest (Book 23 §2 : une des entrées) : on la voit ouverte, on y passe (0.7.1). On arrive
  // toujours par le portail (la première sortie, qui mène aussi au Carrefour), mais on peut repartir par là, discrètement.
  {
    vers: "comptoir",
    boite: { x: BRECHE.x + 1.2, z: BRECHE.z, l: 2.4, p: BRECHE.largeur },
    arrivee: { x: BRECHE.x + 2.5, z: BRECHE.z, o: Math.PI / 2 },
    libelle: "Se glisser dehors par la brèche",
    sansArrivee: true,
  },
];

// ---------- H1B, le Gué-aux-Saules (plan 0.8, chantier 11) : une halte partagée, comme la station ----------

/**
 * Le gué fait 200 × 70 m, comme la station (le modèle `batiment/halte-gue/` : quatre tronçons de 50 × 70 m). Le repère
 * du jeu part du coin nord-ouest : x = x du modèle + 100, z = z du modèle + 35 (`origineModele`). La route descend de
 * la Campagne par l'ouest (l'entrée A du modèle, « ← Ton terrain »), passe la rivière à gué, et remonte à l'est (la
 * sortie B) vers le Moulin.
 */
export const GUE = { longueur: 200, largeur: 70, origineModele: { x: 100, z: 35 } } as const;

/**
 * Le gué, vide (chantier 4) : le fond de la vallée, sans obstacles. Le chantier 11 y met ceux du modèle (bâtiments,
 * rivière creusée, `userData.obstacles`), depuis `commun/src/gue.ts`, en remplaçant `obstacles: []`.
 */
export const ZONE_GUE: Zone = {
  xMin: 0.5,
  xMax: GUE.longueur - 0.5,
  zMin: 0.5,
  zMax: GUE.largeur - 0.5,
  obstacles: [],
};

/** Les deux bouts de la route du gué (l'entrée A et la sortie B du modèle, dans le repère du jeu). */
const ROUTE_GUE = { ouest: { x: 0, z: 7 + GUE.origineModele.z }, est: { x: GUE.longueur, z: -5 + GUE.origineModele.z } } as const;

export const SORTIES_GUE: Sortie[] = [
  {
    vers: "terrain",
    boite: { x: 2, z: ROUTE_GUE.ouest.z, l: 4, p: 10 },
    arrivee: { x: 4.5, z: ROUTE_GUE.ouest.z, o: Math.PI / 2 },
    libelle: "Rentrer chez toi",
  },
  {
    vers: "moulin",
    boite: { x: GUE.longueur - 2, z: ROUTE_GUE.est.z, l: 4, p: 10 },
    arrivee: { x: GUE.longueur - 4.5, z: ROUTE_GUE.est.z, o: -Math.PI / 2 },
    libelle: "Continuer vers le Moulin",
  },
];

// ---------- L1B, le Moulin du Gué (plan 0.8, chantier 12) : un lieu à soi, comme la Coopérative ----------

/**
 * Le Moulin fait 64 × 54 m (le modèle `batiment/moulin/` : `lot`). Le repère du jeu part du coin nord-ouest :
 * x = x du modèle + 32, z = z du modèle + 27 (`origineModele`).
 */
export const MOULIN = { largeur: 64, profondeur: 54, origineModele: { x: 32, z: 27 } } as const;

/** Le Moulin, vide (chantier 4). Le chantier 12 y met les obstacles du modèle, depuis `commun/src/moulin.ts`. */
export const ZONE_MOULIN: Zone = {
  xMin: 0.5,
  xMax: MOULIN.largeur - 0.5,
  zMin: 0.5,
  zMax: MOULIN.profondeur - 0.5,
  obstacles: [],
};

/** Un point du modèle du Moulin dans le repère du jeu. */
const auMoulin = (x: number, z: number) => ({ x: x + MOULIN.origineModele.x, z: z + MOULIN.origineModele.z });
/** La fiche du modèle : `arrivee` (la route, à l'est du pont de pierre) et `sorties` (la route ; le halage, au nord). */
const PONT_MOULIN = auMoulin(28.5, 20.5);
const HALAGE = auMoulin(15, -27);

/**
 * On arrive toujours au pont (la première sortie), d'où qu'on vienne ; une reconnexion dans le Moulin y ramène. Le
 * chemin de halage, au bout de la levée, est une sortie sans arrivée : on part par là vers le gué, on n'y entre jamais
 * (h1b-l1b-conception §2.6, M18, M19).
 */
export const SORTIES_MOULIN: Sortie[] = [
  {
    vers: "gue",
    boite: { x: MOULIN.largeur - 1.5, z: PONT_MOULIN.z - 3, l: 3, p: 8 },
    arrivee: { x: PONT_MOULIN.x, z: PONT_MOULIN.z, o: -Math.PI / 2 },
    libelle: "Reprendre la route du gué",
  },
  {
    vers: "gue",
    boite: { x: HALAGE.x, z: 1.5, l: 4, p: 3 },
    arrivee: { x: HALAGE.x, z: 3.5, o: Math.PI },
    libelle: "Prendre le chemin de halage",
    sansArrivee: true,
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
  /** Ce que le lieu promet, en une ligne (plan 0.8 §0 : ce qu'on y va chercher), pour la fiche de la carte. */
  promesse?: string;
}

export const LIEUX: Record<LieuId, LieuCarte> = {
  terrain: { id: "terrain", nom: "Ton terrain", km: 0, ouvert: true, description: "Ta prairie, ta mare, ta ruine de ferme. Personne n'y entre sans toi." },
  station: {
    id: "station",
    nom: "La station-service",
    km: 3,
    ouvert: true,
    description: "Une halte sur la route de la Campagne. La boutique a été pillée, pas l'atelier. Des Éteints dorment dans le coin.",
    promesse: "La station : le bois, le métal, et la pièce de ta famille.",
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
    km: 5,
    ouvert: true,
    description:
      "Au bout d'un chemin de terre qui part de la station-service vers le nord (un chemin agricole y mène aussi depuis le Carrefour). Le hangar n'a jamais été vidé : on dit qu'il y reste de quoi tenir un hiver. Les Éteints y sont nombreux, et il fait noir à l'intérieur.",
    promesse: "La Coopérative : le feu et l'eau.",
  },
  // 0.8 (Q-0.8-25) : « Le Gué-aux-Saules » et « Le Moulin du Gué » ; le lien entre les deux se lit sur la carte.
  gue: {
    id: "gue",
    nom: "Le Gué-aux-Saules",
    km: 3,
    ouvert: true,
    description:
      "Une halte sur la route des Marais. Le pont suspendu est parti avec la crue du premier hiver : on passe sur le radier, les pieds dans l'eau qui court, ou par le bac du passeur. Des Éteints rôdent sur les berges.",
    promesse: "Le gué : la pierre, la glaise et la rive.",
  },
  moulin: {
    id: "moulin",
    nom: "Le Moulin du Gué",
    km: 5,
    ouvert: true,
    description:
      "En aval du gué, la vieille minoterie et sa roue arrêtée sur le bief. On y entre par le pont de pierre ; le chemin de halage ramène au gué. Les Éteints dorment dans les pièces sombres.",
    promesse: "Le Moulin : le couchage, le stockage, l'établi.",
  },
};

/** Le nom d'un lieu en milieu de phrase : « la station-service », « le Comptoir du Carrefour », « ton terrain ». */
export function minuscule(nom: string): string {
  return nom.charAt(0).toLowerCase() + nom.slice(1);
}

/** « du Comptoir du Carrefour », « de la Coopérative du Plateau », « de ton terrain ». */
export function deLieu(id: LieuId): string {
  const nom = minuscule(LIEUX[id].nom);
  return nom.startsWith("le ") ? `du ${nom.slice(3)}` : `de ${nom}`;
}

/** Coût d'un trajet à pied (Book 01 §2 bis) : ≈ 60 kcal et ≈ 0,08 L d'eau par km. */
export const KCAL_PAR_KM = 60;
export const EAU_PAR_KM = 0.08;
/** Durée du trajet à l'écran : une courte séquence sur la carte, quelle que soit la distance en 0a. */
export const DUREE_VOYAGE_S = 10;

/** Les distances les plus courtes, par la route, de chaque lieu à chaque autre (calculées une fois). */
const DISTANCES: Record<LieuId, Record<LieuId, number>> = (() => {
  const d = {} as Record<LieuId, Record<LieuId, number>>;
  for (const a of ORDRE_ROUTE) {
    d[a] = {} as Record<LieuId, number>;
    for (const b of ORDRE_ROUTE) d[a][b] = a === b ? 0 : Infinity;
  }
  for (const t of TRONCONS) d[t.a][t.b] = d[t.b][t.a] = t.km;
  for (const k of ORDRE_ROUTE) for (const a of ORDRE_ROUTE) for (const b of ORDRE_ROUTE) d[a][b] = Math.min(d[a][b], d[a][k] + d[k][b]);
  return d;
})();

/** Les lieux voisins de `lieu` (un tronçon de route les relie directement). */
export function voisins(lieu: LieuId): LieuId[] {
  return TRONCONS.flatMap((t) => (t.a === lieu ? [t.b] : t.b === lieu ? [t.a] : []));
}

/** La distance par la route, en km (par le plus court). */
export function distanceKm(de: LieuId, vers: LieuId): number {
  return DISTANCES[de][vers];
}

// ---------- Outils ----------

const ZONES: Record<LieuId, Zone> = { terrain: ZONE_TERRAIN, station: ZONE_STATION, comptoir: ZONE_COMPTOIR, cooperative: ZONE_COOP, gue: ZONE_GUE, moulin: ZONE_MOULIN };
const SORTIES: Record<LieuId, Sortie[]> = {
  terrain: [SORTIE_TERRAIN],
  station: SORTIES_STATION,
  comptoir: SORTIES_COMPTOIR,
  cooperative: SORTIES_COOP,
  gue: SORTIES_GUE,
  moulin: SORTIES_MOULIN,
};

export function zoneDe(lieu: LieuJouable): Zone {
  return ZONES[lieu];
}

export function sortiesDe(lieu: LieuJouable): Sortie[] {
  return SORTIES[lieu];
}

/** Les sorties par où l'on peut aussi arriver (toutes, sauf les sorties sans arrivée : la brèche, le halage). */
export function entreesDe(lieu: LieuJouable): Sortie[] {
  return SORTIES[lieu].filter((s) => !s.sansArrivee);
}

/**
 * Les lieux se traversent à pied (Book 01 §2 bis) : on s'arrête à chaque lieu entre les deux (du terrain au Carrefour
 * ou à la Coopérative, la station). Renvoie le lieu où l'on arrive vraiment en prenant la route vers `vers` depuis
 * `de` : le premier voisin sur le plus court chemin.
 */
export function etapeVers(de: LieuJouable, vers: LieuId): LieuJouable {
  if (de === vers) return vers;
  return voisins(de).find((v) => DISTANCES[de][v] + DISTANCES[v][vers] === DISTANCES[de][vers])!;
}

/** Les lieux où mène une sortie. */
export function destinations(s: Sortie): LieuId[] {
  return [s.vers, ...(s.aussi ?? [])];
}

export function dansBoite(x: number, z: number, b: Boite, marge = 0): boolean {
  return Math.abs(x - b.x) <= b.l / 2 + marge && Math.abs(z - b.z) <= b.p / 2 + marge;
}

/** Un morceau de bord de zone, de (x1, z1) à (x2, z2). */
export type MorceauBord = Troncon;

/**
 * Les bords de zone qu'on peut toucher sans rien voir (0.7.1) : les morceaux de bornes (xMin… zMax) qu'un personnage
 * (de `rayon`) atteint à pied depuis les arrivées du lieu, sans heurter d'obstacle et hors des sorties. Un lieu bien
 * fait n'en a aucun : avant chaque borne, il y a un mur, une clôture, une haie… (sauf aux sorties, où le bord est le
 * départ sur la route). On parcourt le lieu sur une grille de `pas` mètres, de proche en proche.
 */
export function bordsLibres(zone: Zone, sorties: readonly Sortie[], rayon = 0.35, pas = 0.25): MorceauBord[] {
  const nx = Math.max(1, Math.round((zone.xMax - zone.xMin) / pas));
  const nz = Math.max(1, Math.round((zone.zMax - zone.zMin) / pas));
  const px = (zone.xMax - zone.xMin) / nx;
  const pz = (zone.zMax - zone.zMin) / nz;
  const x = (i: number) => zone.xMin + i * px;
  const z = (j: number) => zone.zMin + j * pz;
  const vu = new Uint8Array((nx + 1) * (nz + 1));
  const pile: number[] = [];
  const visiter = (i: number, j: number) => {
    if (i < 0 || j < 0 || i > nx || j > nz) return;
    const k = j * (nx + 1) + i;
    if (vu[k]) return;
    vu[k] = 1;
    if (heurte(zone, x(i), z(j), rayon)) return;
    vu[k] = 2;
    pile.push(i, j);
  };
  for (const s of sorties) visiter(Math.round((s.arrivee.x - zone.xMin) / px), Math.round((s.arrivee.z - zone.zMin) / pz));
  while (pile.length) {
    const j = pile.pop()!;
    const i = pile.pop()!;
    visiter(i + 1, j);
    visiter(i - 1, j);
    visiter(i, j + 1);
    visiter(i, j - 1);
  }
  const libre = (i: number, j: number) => vu[j * (nx + 1) + i] === 2 && !sorties.some((s) => dansBoite(x(i), z(j), s.boite));
  const morceaux: MorceauBord[] = [];
  const cotes: [number, number, number, number, number][] = [
    // i0, j0, di, dj, n
    [0, 0, 1, 0, nx],
    [nx, 0, 0, 1, nz],
    [0, nz, 1, 0, nx],
    [0, 0, 0, 1, nz],
  ];
  for (const [i0, j0, di, dj, n] of cotes) {
    let debut = -1;
    for (let t = 0; t <= n + 1; t++) {
      const ok = t <= n && libre(i0 + di * t, j0 + dj * t);
      if (ok && debut < 0) debut = t;
      if (!ok && debut >= 0) {
        morceaux.push({ x1: x(i0 + di * debut), z1: z(j0 + dj * debut), x2: x(i0 + di * (t - 1)), z2: z(j0 + dj * (t - 1)) });
        debut = -1;
      }
    }
  }
  return morceaux;
}

/** La sortie où se tient le personnage, s'il y en a une. */
export function sortieIci(lieu: LieuJouable, x: number, z: number): Sortie | null {
  return sortiesDe(lieu).find((s) => dansBoite(x, z, s.boite)) ?? null;
}

/** Où l'on arrive dans un lieu, selon d'où l'on vient. */
export function arriveeDans(lieu: LieuJouable, depuis: LieuId): Position {
  const sorties = entreesDe(lieu);
  // On arrive par la sortie qui mène d'où l'on vient (au Carrefour, par l'est depuis la station, par le nord depuis la
  // Coopérative ; à la Coopérative, toujours par le portail, la première de ses sorties ; au Moulin, toujours par le
  // pont). Jamais par une sortie sans arrivée.
  const etape = etapeVers(lieu, depuis);
  const versDepuis = sorties.find((s) => destinations(s).includes(etape)) ?? sorties[0]!;
  return { ...versDepuis.arrivee };
}

/** Point d'arrivée par défaut d'un nouveau personnage. */
export const ARRIVEE_DEPART: Position = { x: POINT_ARRIVEE.x, z: POINT_ARRIVEE.z, o: 0 };

export function estLieuJouable(valeur: unknown): valeur is LieuJouable {
  return typeof valeur === "string" && (ORDRE_ROUTE as readonly string[]).includes(valeur);
}
