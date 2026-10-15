// L2A, le Grand Hôtel des Flots (plan 0.10, chantier J ; niveau-2.md §9.2, S-01 à S-11) : le plan en données, partagé
// par le serveur (collisions, pièces, vue, butin, « le check-in ») et par le client (le modèle 3D de la session
// « bâtiments », copié dans client/src/batiments/grand-hotel/).
//
// Un lieu à soi, comme la Coopérative et le Moulin, au bout de la route A du niveau 2, après la route du pont.
//
// Repère : celui du lot du modèle (64 × 66 m, centré : FICHE.lot), ramené à celui du jeu par `jeuHotel()` : x + 32,
// z + 33 (le coin nord-ouest du lot est l'origine du jeu, comme pour le Moulin). Les coordonnées écrites ici sont celles
// du lot : on les relit sur la fiche du modèle (FICHE, `vers()`), et le test client/src/rendu/hotel.test.ts vérifie
// qu'elles la suivent.
//
// UN SEUL REPÈRE (S-01) : l'étage est posé au sol, au nord de l'hôtel, derrière lui (lot : z −31,6 à −20,6), clos de ses
// murs. On y monte par l'ascenseur (une téléportation, avec un fondu au noir d'une seconde), on en sort par le balcon
// effondré de la chambre 8 (une téléportation sur la dune, à sens unique). Tout ce qui est au nord du mur nord de
// l'hôtel (z < −17) est « l'étage » : le client y cache le rez-de-chaussée, et au rez-de-chaussée l'étage (L-2) ; les
// Éteints d'un niveau ne voient ni n'entendent l'autre (milieu-hotel.ts).
//
// Ce fichier n'importe des autres modules du jeu que des types, murs.ts, grille.ts et vue.ts (lieux.ts l'importe pour
// sa zone et ses sorties).

import { boitesPres, creerGrille } from "./grille.ts";
import type { Boite, Sortie, Zone } from "./lieux.ts";
import { declarerObstaclesBas } from "./murs.ts";
import type { TypeRessourceHotel } from "./ressources-hotel.ts";
import { percer, type FenetreVue, type PlanVue, type PorteVue } from "./vue.ts";

/** Le lot du modèle : 64 × 66 m (FICHE.lot), et son centre dans le repère du jeu. */
export const HOTEL = { largeur: 64, profondeur: 66, origineModele: { x: 32, z: 33 } } as const;

/** Un point du lot dans le repère du jeu. */
export function jeuHotel(x: number, z: number): { x: number; z: number } {
  return { x: x + HOTEL.origineModele.x, z: z + HOTEL.origineModele.z };
}

const boiteJeu = (x: number, z: number, l: number, p: number): Boite => ({ x: x + HOTEL.origineModele.x, z: z + HOTEL.origineModele.z, l, p });

// ---------- Les deux niveaux (S-01, L-2) ----------

/** Le niveau d'un point : le rez-de-chaussée et ses dehors, ou l'étage (posé au nord, derrière le mur nord). */
export type NiveauHotel = "rez_de_chaussee" | "etage";

/** Le mur nord de l'hôtel (lot) : au nord, c'est l'étage. */
const NORD_DE_L_HOTEL = -17;

/** Le niveau d'un point du jeu (seul z compte : l'étage est tout entier au nord de l'hôtel). */
export function niveauHotel(_x: number, z: number): NiveauHotel {
  return z - HOTEL.origineModele.z < NORD_DE_L_HOTEL ? "etage" : "rez_de_chaussee";
}

// ---------- Les obstacles : ceux du modèle (`userData.obstacles`), relevés tels quels ----------

/** Un segment infranchissable du modèle : x1, z1, x2, z2 (repère du lot), sa nature, son niveau (R : rez-de-chaussée, E : étage). */
export type SegmentHotel = readonly [number, number, number, number, string, "R" | "E"];

const R = "R" as const;
const E = "E" as const;

/**
 * Les segments du modèle (`creer().userData.obstacles`, avec leur champ `niveau`), dans l'ordre où il les note. Une
 * copie : le serveur ne construit pas le décor 3D. Le test client/src/rendu/hotel.test.ts vérifie qu'elle suit le
 * modèle importé ; s'il change (`npm run batiments:importer`), on recopie la liste.
 */
export const SEGMENTS_HOTEL: readonly SegmentHotel[] = [
  [-29, -3, -14.85, -3, "mur", R],
  [-13.15, -3, -11.65, -3, "mur", R],
  [-9.95, -3, 0.7, -3, "mur", R],
  [3.3, -3, 13.19, -3, "mur", R],
  [17, -9.26, 17, -17, "mur", R],
  [17, -17, 6.8, -17, "mur", R],
  [6.8, -17, -2.8, -17, "mur", R],
  [-2.8, -17, -15.6, -17, "mur", R],
  [-15.6, -17, -25.2, -17, "mur", R],
  [-25.2, -17, -29, -17, "mur", R],
  [-29, -17, -29, -11, "mur", R],
  [-29, -11, -29, -3, "mur", R],
  [13.19, -3, 14.46, -0.38, "mur", R],
  [14.46, -0.38, 16.89, 1.23, "mur", R],
  [16.89, 1.23, 17.55, 1.26, "mur", R],
  [19.15, 1.34, 19.8, 1.37, "mur", R],
  [19.8, 1.37, 20.38, 1.06, "mur", R],
  [21.79, 0.31, 22.37, 0, "mur", R],
  [22.37, 0, 23.89, -2.49, "mur", R],
  [23.89, -2.49, 23.92, -5.4, "mur", R],
  [23.92, -5.4, 22.46, -7.92, "mur", R],
  [22.46, -7.92, 19.91, -9.34, "mur", R],
  [19.91, -9.34, 17, -9.26, "mur", R],
  [-0.8, 0.45, -0.4, 0.45, "colonne", R],
  [4.4, 0.45, 4.8, 0.45, "colonne", R],
  [-15.6, -11, -9.7, -11, "mur", R],
  [-8.3, -11, -2.8, -11, "mur", R],
  [-15.6, -17, -15.6, -11, "mur", R],
  [-15.6, -11, -15.6, -3, "mur", R],
  [-2.8, -17, -2.8, -13.7, "mur", R],
  [-2.8, -12.3, -2.8, -11, "mur", R],
  [-2.8, -11, -2.8, -6.5, "mur", R],
  [-2.8, -3.9, -2.8, -3, "mur", R],
  [6.8, -17, 6.8, -14.7, "mur", R],
  [6.8, -13.3, 6.8, -8.5, "mur", R],
  [6.8, -5.5, 6.8, -3, "mur", R],
  [-15.6, -14.5, -14.85, -14.5, "mur", R],
  [-13.55, -14.5, -12.05, -14.5, "mur", R],
  [-10.75, -14.5, -10, -14.5, "mur", R],
  [-12.8, -17, -12.8, -14.5, "mur", R],
  [-10, -14.5, -10, -17, "mur", R],
  [-25.4, 12.2, -24.6, 12.2, "jardinière", R],
  [-13.4, 12.2, -12.6, 12.2, "jardinière", R],
  [-1.4, 12.2, -0.6, 12.2, "jardinière", R],
  [10.6, 12.2, 11.4, 12.2, "jardinière", R],
  [22.6, 12.2, 23.4, 12.2, "jardinière", R],
  [21.7, -2.87, 21.9, -4, "comptoir du bar", R],
  [21.9, -4, 21.7, -5.13, "comptoir du bar", R],
  [21.7, -5.13, 21.12, -6.13, "comptoir du bar", R],
  [21.12, -6.13, 20.24, -6.86, "comptoir du bar", R],
  [20.24, -6.86, 19.16, -7.25, "comptoir du bar", R],
  [19.16, -7.25, 18.01, -7.25, "comptoir du bar", R],
  [17, -9.26, 15.49, -6.77, "barricade", R],
  [14.71, -5.49, 13.19, -3, "barricade", R],
  [-1.2, -10.8, -1.2, -6.9, "comptoir de la réception", R],
  [-2.5, -16.7, -0.5, -16.7, "cabine de l'ascenseur", R],
  [-2.5, -14.7, -2.5, -16.7, "cabine de l'ascenseur", R],
  [-0.5, -14.7, -0.5, -16.7, "cabine de l'ascenseur", R],
  [-2.5, -14.62, -0.5, -14.62, "grille_ascenseur_bas (grille fermée : à lever quand le jeu efface la grille)", R],
  [0.4, -11.3, 4.4, -11.3, "barrière devant le grand escalier", R],
  [0.4, -11.3, 0.4, -17, "grand escalier effondré", R],
  [4.4, -11.3, 4.4, -17, "grand escalier effondré", R],
  [5.1, -4.4, 5.7, -4.4, "borne « Check-in par sourire »", R],
  [4.8, 3.8, 17.2, 3.8, "bord de la piscine", R],
  [4.8, 10.2, 17.2, 10.2, "bord de la piscine", R],
  [4.8, 3.8, 4.8, 10.2, "bord de la piscine", R],
  [17.2, 3.8, 17.2, 10.2, "bord de la piscine", R],
  [-32, 16.8, -12.5, 16.8, "balustrade", R],
  [-9.5, 16.8, -0.5, 16.8, "balustrade", R],
  [3.5, 16.8, 11.5, 16.8, "balustrade", R],
  [14.5, 16.8, 32, 16.8, "balustrade", R],
  [-18.43, 15.25, -19.35, 16.17, "comptoir de la buvette", R],
  [-19.35, 16.17, -20.65, 16.17, "comptoir de la buvette", R],
  [-20.65, 16.17, -21.57, 15.25, "comptoir de la buvette", R],
  [-21.57, 15.25, -21.57, 13.95, "comptoir de la buvette", R],
  [-21.57, 13.95, -20.65, 13.03, "comptoir de la buvette", R],
  [-18.43, 13.95, -18.43, 15.25, "comptoir de la buvette", R],
  [-28.95, 19.65, -27.45, 19.65, "cabine de plage", R],
  [-27.15, 19.65, -25.65, 19.65, "cabine de plage", R],
  [-25.35, 19.65, -23.85, 19.65, "cabine de plage", R],
  [5, 23, 9, 24.2, "barque", R],
  [-31.6, -11, -31.6, 12.8, "ganivelles (bord du lot)", R],
  [-31.6, 12.8, -31.6, 17.2, "ganivelle en travers de la promenade (bord du lot)", R],
  [-31.6, 17.2, -31.6, 32.2, "ganivelles (bord du lot)", R],
  [31.6, -9.6, 31.6, 12.8, "ganivelles (bord du lot)", R],
  [31.6, 16.7, 31.6, 32.2, "ganivelles (bord du lot)", R],
  [-32, 31.7, 32, 31.7, "le large : on perd pied (bord du lot)", R],
  [-32, -11, -29.25, -11, "mur de la cour de service (bord du lot)", R],
  [17.25, -9.6, 32, -9.6, "mur de la cour de service (bord du lot)", R],
  [10.2, -16.05, 13.8, -16.05, "cheminée", R],
  [9, -11.9, 9.8, -11.9, "colonne", R],
  [14, -11.9, 14.8, -11.9, "colonne", R],
  [-8.4, -14.25, -4.8, -14.25, "piano de cuisson", R],
  [-8.4, -12.95, -4.8, -12.95, "piano de cuisson", R],
  [7, -31.6, -19, -31.6, "mur", E],
  [-19, -31.6, -19, -20.6, "mur", E],
  [-19, -20.6, -4.2, -20.6, "mur", E],
  [-2.8, -20.6, 7, -20.6, "mur", E],
  [7, -20.6, 7, -31.6, "mur", E],
  [-19, -25.2, -15.3, -25.2, "mur", E],
  [-13.9, -25.2, -8, -25.2, "mur", E],
  [-6.6, -25.2, -4.2, -25.2, "mur", E],
  [-2.8, -25.2, -0.1, -25.2, "mur", E],
  [1.3, -25.2, 3, -25.2, "mur", E],
  [-19, -27.4, -14.7, -27.4, "mur", E],
  [-13.3, -27.4, -5.7, -27.4, "mur", E],
  [-4.3, -27.4, 0.05, -27.4, "mur", E],
  [1.45, -27.4, 4.3, -27.4, "mur", E],
  [5.7, -27.4, 7, -27.4, "mur", E],
  [-16.6, -25.2, -16.6, -24.05, "mur", E],
  [-16.6, -22.75, -16.6, -20.6, "mur", E],
  [-11, -25.2, -11, -20.6, "mur", E],
  [-6, -25.2, -6, -20.6, "mur", E],
  [-1, -25.2, -1, -20.6, "mur", E],
  [3, -25.2, 3, -20.6, "mur", E],
  [-8.6, -25.2, -8.6, -24.65, "mur", E],
  [-8.6, -23.35, -8.6, -22.8, "mur", E],
  [-11, -22.8, -8.6, -22.8, "mur", E],
  [-9, -31.6, -9, -27.4, "mur", E],
  [-1.5, -31.6, -1.5, -27.4, "mur", E],
  [3, -31.6, 3, -27.4, "mur", E],
  [6.8, -24.6, 6.8, -22.6, "cabine de l'ascenseur", E],
  [4.8, -24.6, 6.8, -24.6, "cabine de l'ascenseur", E],
  [4.8, -22.6, 6.8, -22.6, "cabine de l'ascenseur", E],
  [4.72, -24.6, 4.72, -22.6, "grille_ascenseur_haut (grille fermée : à lever quand le jeu efface la grille)", E],
  [-18.7, -22.7, -18.7, -21.1, "baignoire", E],
  [-17.9, -22.7, -17.9, -21.1, "baignoire", E],
  [-13.45, -23.7, -13.45, -21.5, "lit à baldaquin", E],
  [-11.75, -23.7, -11.75, -21.5, "lit à baldaquin", E],
  [-10.9, -24.8, -10.9, -23.2, "baignoire", E],
  [-8.4, -22.65, -6.2, -22.65, "lit", E],
  [-5.95, -24.05, -4.05, -24.05, "lit", E],
  [-2.4, -23.6, -2.4, -21.6, "pile de tôles", E],
  [-4.45, -20.6, -4.45, -19.7, "garde-corps tordu du balcon", E],
  [-2.55, -20.6, -2.55, -19.7, "garde-corps du balcon", E],
  [-0.7, -22.95, -0.7, -21.05, "lit", E],
  [-18.5, -28.3, -15.9, -28.3, "calandre", E],
  [-14.8, -30.25, -12.8, -30.25, "table de la lingerie", E],
  [-8.1, -29, -5.9, -29, "lit", E],
  [4.6, -29.8, 6.6, -29.8, "treuil de l'ascenseur", E],
  [3.8, -30.8, 3.8, -28.2, "établi", E],
];

/**
 * Le bord du balcon effondré (le jeu l'ajoute au modèle) : on ne descend pas du balcon en marchant, on saute
 * (sensUnique[0], `BALCON`). Sans lui, on passerait du balcon à la cour, derrière l'hôtel.
 */
export const BORD_DU_BALCON: SegmentHotel = [-4.45, -19.7, -2.55, -19.7, "bord du balcon effondré (on saute sur la dune)", E];

/** Les obstacles qui arrêtent les coups et les objets lancés (murs, colonnes, barricades, l'ascenseur) ; les autres sont bas. */
function arreteLesCoupsHotel(nature: string): boolean {
  return (
    nature === "mur" ||
    nature === "colonne" ||
    nature === "barricade" ||
    nature === "cheminée" ||
    nature.startsWith("cabine de l'ascenseur") ||
    nature.startsWith("grille_ascenseur") ||
    nature.startsWith("mur de la cour")
  );
}

/** Les murs arrêtent la vue au-dessus de 1,2 m ; le reste est bas (comptoirs, lits, bord de la piscine…). */
function arreteLaVue(nature: string): boolean {
  return nature === "mur" || nature.startsWith("mur de la cour");
}

/** L'épaisseur de la boîte d'un segment : les murs comptent leur maçonnerie, le reste est mince. */
function epaisseur(nature: string): number {
  return nature === "mur" || nature.startsWith("mur de la cour") ? 0.3 : 0.1;
}

function boitesBrutes([x1, z1, x2, z2, nature]: SegmentHotel): Boite[] {
  const ep = epaisseur(nature);
  if (Math.abs(z2 - z1) < 1e-6) return [boiteJeu((x1 + x2) / 2, z1, Math.abs(x2 - x1), ep)];
  if (Math.abs(x2 - x1) < 1e-6) return [boiteJeu(x1, (z1 + z2) / 2, ep, Math.abs(z2 - z1))];
  // Un segment de biais (la rotonde) : une rangée de petits carrés.
  const longueur = Math.hypot(x2 - x1, z2 - z1);
  const n = Math.max(1, Math.ceil(longueur / 0.25));
  const cote = Math.max(0.2, longueur / n);
  const res: Boite[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    res.push(boiteJeu(x1 + (x2 - x1) * t, z1 + (z2 - z1) * t, cote, cote));
  }
  return res;
}

/** Les boîtes d'un segment (repère du jeu) ; les obstacles bas sont déclarés tels (murs.ts) : on frappe par-dessus. */
export function boitesDuSegment(segment: SegmentHotel): Boite[] {
  const boites = boitesBrutes(segment);
  if (!arreteLesCoupsHotel(segment[4])) declarerObstaclesBas(boites);
  return boites;
}

// ---------- L'eau peu profonde, au sud (0.10, R52 ; décision du porteur du 2026-10-15) ----------

/**
 * La mer du modèle (FICHE.mer, G-3) : l'eau claire, où l'on marche jusqu'aux genoux, du bord de l'eau (lot z 28,2) à la
 * ligne de brisants (lot z 31,7), où l'obstacle du modèle « le large : on perd pied » arrête tout le monde. Comme à la
 * grève du phare (commun/src/phare.ts) : on y avance ralenti (FREIN_EAU_HOTEL), sans courir ; les Éteints aussi. Le test
 * client/src/rendu/hotel.test.ts vérifie que ces deux lignes sont celles du modèle.
 */
export const MER_HOTEL = { bord: 28.2, brisants: 31.7 } as const;
/** Le bord de l'eau, dans le repère du jeu. */
export const BORD_EAU_HOTEL = jeuHotel(0, MER_HOTEL.bord).z;
/** La ligne du large (les brisants), dans le repère du jeu. */
export const LARGE_HOTEL = jeuHotel(0, MER_HOTEL.brisants).z;
/** Dans l'eau jusqu'aux genoux, on avance à 60 % de son allure (comme au phare). */
export const FREIN_EAU_HOTEL = 0.6;
/** De combien on s'enfonce dans l'eau (m), au plus : jusqu'aux genoux. */
export const ENFONCE_EAU_HOTEL = 0.42;

/** Ce point du jeu est-il dans l'eau peu profonde, au sud de la plage ? */
export function dansLEauHotel(x: number, z: number): boolean {
  return z > BORD_EAU_HOTEL && z < LARGE_HOTEL + 0.5 && x > 0 && x < HOTEL.largeur;
}

/** De combien les pieds s'enfoncent dans l'eau (0 sur le sable ; jusqu'aux genoux à 1,5 m du bord). */
export function profondeurEauHotel(x: number, z: number): number {
  if (!dansLEauHotel(x, z)) return 0;
  return ENFONCE_EAU_HOTEL * Math.min(1, 0.3 + (z - BORD_EAU_HOTEL) / 1.5);
}

/** Tous les obstacles de l'hôtel (les grilles de l'ascenseur restent fermées : on monte par une téléportation, S-01). */
export function obstaclesHotel(): Boite[] {
  return [...SEGMENTS_HOTEL, BORD_DU_BALCON].flatMap(boitesDuSegment);
}

/** L'hôtel tel qu'on le trouve : rien n'y change de place (la borne, le robot, l'ascenseur sont des états, pas des murs). */
export const ZONE_HOTEL: Zone = (() => {
  const obstacles = obstaclesHotel();
  const frein = (x: number, z: number) => (dansLEauHotel(x, z) ? FREIN_EAU_HOTEL : 1);
  return { xMin: 0.5, xMax: HOTEL.largeur - 0.5, zMin: 0.5, zMax: HOTEL.profondeur - 0.5, obstacles, grille: creerGrille(obstacles), frein };
})();

// ---------- La sortie ----------

/** L'arrivée sur la promenade, par l'est (FICHE.entrees[0] : x 31,5, z 15 du lot ; FICHE.depart : x 28). */
const PROMENADE = jeuHotel(28, 15);

/**
 * Le panneau de sortie du modèle (FICHE.panneaux, 0.10, G-1 : lot x 32,9, z 12,2) : juste au-delà de la sortie, au bord
 * nord de la promenade prolongée ; on le lit (commun/src/guidage.ts, E-16), la lanterne du modèle l'éclaire la nuit. Le
 * test client/src/rendu/hotel.test.ts vérifie qu'il est là où le modèle le plante.
 */
export const PANNEAU_SORTIE_HOTEL = jeuHotel(32.9, 12.2);

export const SORTIES_HOTEL: Sortie[] = [
  {
    vers: "route_pont",
    boite: { x: HOTEL.largeur - 1.5, z: PROMENADE.z, l: 3, p: 8 },
    arrivee: { x: PROMENADE.x, z: PROMENADE.z, o: -Math.PI / 2 },
    libelle: "Reprendre la route du pont",
  },
];

// ---------- Les pièces (la vue par pièce, le son, l'obscurité) ----------

export type PieceHotel =
  | "dehors"
  | "hall"
  | "salle_a_manger"
  | "cuisines"
  | "chambre_froide_1"
  | "chambre_froide_2"
  | "salon"
  | "bar"
  | "couloir"
  | "palier"
  | "machinerie"
  | "suite"
  | "salle_de_bain_suite"
  | "chambre_7"
  | "salle_de_bain_7"
  | "chambre_8"
  | "chambre_9"
  | "lingerie"
  | "chambre_11"
  | "office"
  /** La cour derrière l'hôtel, où donne le balcon de la chambre 8 (à l'étage : on n'y descend pas, on saute). */
  | "balcon";

/**
 * Les pièces de la fiche (FICHE.pieces, repère du lot), et « balcon » : tout ce qui est au nord de l'hôtel sans être
 * une pièce de l'étage. Les pièces sombres : les chambres froides, les salles de bains, la machinerie, l'office.
 */
export const PIECES_HOTEL: Record<PieceHotel, { nom: string; sombre: boolean; boites: readonly Boite[] }> = {
  dehors: { nom: "la terrasse", sombre: false, boites: [] },
  hall: { nom: "le hall de réception", sombre: false, boites: [{ x: 2, z: -10, l: 9.6, p: 14 }] },
  salle_a_manger: { nom: "la salle à manger ensablée", sombre: false, boites: [{ x: -9.2, z: -7, l: 12.8, p: 8 }] },
  cuisines: { nom: "les cuisines", sombre: false, boites: [{ x: -6.4, z: -14, l: 7.2, p: 6 }, { x: -12.8, z: -12.75, l: 5.6, p: 3.5 }] },
  chambre_froide_1: { nom: "la chambre froide des conserves", sombre: true, boites: [{ x: -14.2, z: -15.75, l: 2.8, p: 2.5 }] },
  chambre_froide_2: { nom: "la chambre froide du poisson", sombre: true, boites: [{ x: -11.4, z: -15.75, l: 2.8, p: 2.5 }] },
  salon: { nom: "le grand salon (camp de survivants)", sombre: false, boites: [{ x: 11.9, z: -13.15, l: 10.2, p: 7.7 }, { x: 10, z: -6.15, l: 6.4, p: 6.3 }] },
  bar: { nom: "le bar de la rotonde", sombre: false, boites: [{ x: 18.65, z: -3.9, l: 10.9, p: 10.8 }] },
  couloir: { nom: "le couloir de l'étage", sombre: false, boites: [{ x: -8, z: -26.3, l: 22, p: 2.2 }] },
  palier: { nom: "le palier de l'ascenseur", sombre: false, boites: [{ x: 5, z: -24, l: 4, p: 6.8 }] },
  machinerie: { nom: "la machinerie de l'ascenseur", sombre: true, boites: [{ x: 5, z: -29.5, l: 4, p: 4.2 }] },
  suite: { nom: "la suite (lit à baldaquin)", sombre: false, boites: [{ x: -13.8, z: -22.9, l: 5.6, p: 4.6 }] },
  salle_de_bain_suite: { nom: "la salle de bains de la suite", sombre: true, boites: [{ x: -17.8, z: -22.9, l: 2.4, p: 4.6 }] },
  chambre_7: { nom: "la chambre 7", sombre: false, boites: [{ x: -8.5, z: -22.9, l: 5, p: 4.6 }] },
  salle_de_bain_7: { nom: "la salle de bains de la chambre 7", sombre: true, boites: [{ x: -9.8, z: -24, l: 2.4, p: 2.4 }] },
  chambre_8: { nom: "la chambre 8, au balcon effondré", sombre: false, boites: [{ x: -3.5, z: -22.9, l: 5, p: 4.6 }] },
  chambre_9: { nom: "la chambre 9", sombre: false, boites: [{ x: 1, z: -22.9, l: 4, p: 4.6 }] },
  lingerie: { nom: "la lingerie", sombre: false, boites: [{ x: -14, z: -29.5, l: 10, p: 4.2 }] },
  chambre_11: { nom: "la chambre 11 (sur la cour)", sombre: false, boites: [{ x: -5.25, z: -29.5, l: 7.5, p: 4.2 }] },
  office: { nom: "l'office d'étage", sombre: true, boites: [{ x: 0.75, z: -29.5, l: 4.5, p: 4.2 }] },
  balcon: { nom: "le balcon effondré", sombre: false, boites: [] },
};

/** Les pièces dans l'ordre où on les cherche : les plus petites d'abord (les salles de bains dans les chambres). */
const ORDRE_PIECES: readonly PieceHotel[] = [
  "salle_de_bain_7",
  "salle_de_bain_suite",
  "chambre_froide_1",
  "chambre_froide_2",
  "machinerie",
  "office",
  "palier",
  "couloir",
  "suite",
  "chambre_7",
  "chambre_8",
  "chambre_9",
  "lingerie",
  "chambre_11",
  "cuisines",
  "hall",
  "salle_a_manger",
  "salon",
  "bar",
];

const dansBoiteLot = (x: number, z: number, b: Boite) => Math.abs(x - b.x) <= b.l / 2 && Math.abs(z - b.z) <= b.p / 2;

/** La pièce d'un point du jeu (sinon : dehors, ou le balcon s'il est à l'étage). */
export function pieceHotel(x: number, z: number): PieceHotel {
  const lx = x - HOTEL.origineModele.x;
  const lz = z - HOTEL.origineModele.z;
  for (const p of ORDRE_PIECES) if (PIECES_HOTEL[p].boites.some((b) => dansBoiteLot(lx, lz, b))) return p;
  return lz < NORD_DE_L_HOTEL ? "balcon" : "dehors";
}

/** Fait-il noir ici, même en plein jour ? (assombri, jamais noir : la lampe y porte comme la nuit) */
export function sombreHotel(x: number, z: number): boolean {
  return PIECES_HOTEL[pieceHotel(x, z)].sombre;
}

// ---------- Les portes et les fenêtres (toutes ouvertes : leurs battants ont disparu) ----------

/** Une ouverture de l'hôtel, dans le repère du jeu. `sens` : le mur qui la porte court selon x ou selon z. */
export interface OuvertureHotel {
  id: string;
  x: number;
  z: number;
  largeur: number;
  sens: "x" | "z";
  entre: [PieceHotel, PieceHotel];
}

const ouverture = (id: string, x: number, z: number, largeur: number, sens: "x" | "z", entre: [PieceHotel, PieceHotel]): OuvertureHotel => ({ id, ...jeuHotel(x, z), largeur, sens, entre });

/** Les portes de la fiche (FICHE.portes) ; celle du balcon de la chambre 8 donne sur le balcon, pas sur la terrasse. */
export const PORTES_HOTEL: readonly OuvertureHotel[] = [
  ouverture("entree", 2, -3, 2.6, "x", ["dehors", "hall"]),
  ouverture("salle_terrasse_1", -14, -3, 1.7, "x", ["dehors", "salle_a_manger"]),
  ouverture("salle_terrasse_2", -10.8, -3, 1.7, "x", ["dehors", "salle_a_manger"]),
  ouverture("hall_salle", -2.8, -5.2, 2.6, "z", ["hall", "salle_a_manger"]),
  ouverture("hall_cuisines", -2.8, -13, 1.4, "z", ["hall", "cuisines"]),
  ouverture("salle_cuisines", -9, -11, 1.4, "x", ["salle_a_manger", "cuisines"]),
  ouverture("cuisines_froide_1", -14.2, -14.5, 1.3, "x", ["cuisines", "chambre_froide_1"]),
  ouverture("cuisines_froide_2", -11.4, -14.5, 1.3, "x", ["cuisines", "chambre_froide_2"]),
  ouverture("hall_salon_nord", 6.8, -14, 1.4, "z", ["hall", "salon"]),
  ouverture("hall_salon_sud", 6.8, -7, 3, "z", ["hall", "salon"]),
  ouverture("salon_bar", 15.1, -6.13, 1.5, "z", ["salon", "bar"]),
  ouverture("bar_terrasse_1", 18.35, 1.3, 1.6, "x", ["bar", "dehors"]),
  ouverture("bar_terrasse_2", 21.09, 0.68, 1.6, "x", ["bar", "dehors"]),
  ouverture("couloir_palier", 3, -26.3, 2.2, "z", ["couloir", "palier"]),
  ouverture("palier_machinerie", 5, -27.4, 1.4, "x", ["palier", "machinerie"]),
  ouverture("couloir_suite", -14.6, -25.2, 1.4, "x", ["couloir", "suite"]),
  ouverture("suite_bain", -16.6, -23.4, 1.3, "z", ["suite", "salle_de_bain_suite"]),
  ouverture("couloir_chambre_7", -7.3, -25.2, 1.4, "x", ["couloir", "chambre_7"]),
  ouverture("chambre_7_bain", -8.6, -24, 1.3, "z", ["chambre_7", "salle_de_bain_7"]),
  ouverture("couloir_chambre_8", -3.5, -25.2, 1.4, "x", ["couloir", "chambre_8"]),
  ouverture("couloir_chambre_9", 0.6, -25.2, 1.4, "x", ["couloir", "chambre_9"]),
  ouverture("couloir_lingerie", -14, -27.4, 1.4, "x", ["couloir", "lingerie"]),
  ouverture("couloir_chambre_11", -5, -27.4, 1.4, "x", ["couloir", "chambre_11"]),
  ouverture("couloir_office", 0.75, -27.4, 1.4, "x", ["couloir", "office"]),
  ouverture("balcon_chambre_8", -3.5, -20.6, 1.4, "x", ["chambre_8", "balcon"]),
];

/**
 * Les grandes fenêtres de la façade sur la mer (1,7 m, l'allège à 0,9 m : la vue passe, pas le corps), celles des
 * pièces qu'on visite (l'aile ouest est murée).
 */
export const FENETRES_HOTEL: readonly OuvertureHotel[] = [
  ouverture("salle_1", -7.6, -3, 1.7, "x", ["dehors", "salle_a_manger"]),
  ouverture("salle_2", -4.4, -3, 1.7, "x", ["dehors", "salle_a_manger"]),
  ouverture("hall_1", -1.2, -3, 1.7, "x", ["dehors", "hall"]),
  ouverture("hall_2", 5.2, -3, 1.7, "x", ["dehors", "hall"]),
  ouverture("salon_1", 8.4, -3, 1.7, "x", ["dehors", "salon"]),
  ouverture("salon_2", 11.6, -3, 1.7, "x", ["dehors", "salon"]),
];

/** Les murs qui arrêtent la vue (repère du jeu), fenêtres non percées. */
function mursVueHotel(): Boite[] {
  return SEGMENTS_HOTEL.filter((s) => arreteLaVue(s[4])).flatMap(boitesBrutes);
}

/** Le plan de vue de l'hôtel : ses murs, ses portes toujours ouvertes, ses fenêtres sur la mer (commun/src/vue.ts). */
export const PLAN_VUE_HOTEL: PlanVue = (() => {
  const fenetres: FenetreVue[] = FENETRES_HOTEL.map((f) => ({ ...f }));
  const portes: PorteVue[] = PORTES_HOTEL.map((p) => ({ ...p, toujoursOuverte: true }));
  return { murs: percer(mursVueHotel(), fenetres), portes, fenetres, pieceDe: pieceHotel, pieces: Object.keys(PIECES_HOTEL) };
})();

// ---------- « Le check-in » (§3.3, S-07 à S-11) : les points du scénario ----------

/** La borne « Check-in par sourire » du hall (FICHE : `borne_checkin`, son obstacle), dans le repère du jeu. */
export const BORNE = jeuHotel(5.4, -4.4);
/** Le robot-serveur ensablé de la salle à manger (`tete_robot`, `sable_robot`). */
export const ROBOT = jeuHotel(-10.1, -5.9);
/** La batterie, au pied du panneau « Zéro-Effort » de la promenade (`batterie_panneau`). */
export const PANNEAU = jeuHotel(27.3, 15.1);

/**
 * L'ascenseur (FICHE.teleports[0]) : on l'appelle devant sa grille, en bas (le hall) ou en haut (le palier) ; on
 * arrive devant l'autre grille, tourné vers le couloir. Les cabines ne bougent pas, les grilles restent fermées (S-01).
 */
export const ASCENSEUR = {
  bas: { grille: jeuHotel(-1.5, -14.62), arrivee: { ...jeuHotel(-1.5, -13.8), o: 0 } },
  haut: { grille: jeuHotel(4.72, -23.6), arrivee: { ...jeuHotel(3.85, -23.6), o: -Math.PI / 2 } },
} as const;

/**
 * Le balcon effondré de la chambre 8 (FICHE.sensUnique[0]) : qui pose le pied dessus saute sur la dune, devant la
 * façade, à côté du balcon tombé ; on ne remonte pas (S-11). `boite` : le balcon, entre ses deux garde-corps.
 */
export const BALCON = {
  boite: boiteJeu(-3.5, -20.15, 1.9, 0.9),
  arrivee: { ...jeuHotel(-9.4, 1.2), o: 0 },
} as const;

/** Sur le balcon, passé l'axe du mur de la porte-fenêtre : on saute. */
export function surLeBalcon(x: number, z: number): boolean {
  const b = BALCON.boite;
  return Math.abs(x - b.x) <= b.l / 2 && z > b.z - b.p / 2 && z <= b.z + b.p / 2;
}

/** On parle à la borne, on dégage le robot, on prend ce qu'on porte, on appelle l'ascenseur, jusqu'à cette distance. */
export const PORTEE_HOTEL = 2;

/** Dégager le robot (S-09) : 10 s avec Creuser 1 (la pelle, la bêche…), 30 s à mains nues. */
export const DEGAGER = { avecOutil: 10, aMainsNues: 30 } as const;

/** Le fondu au noir de l'ascenseur et du saut (S-01) : une seconde ; on change de place au milieu. */
export const FONDU_MS = 1000;

/** L'objet qu'on remet à la borne (S-10) : la carte de la chambre 7 ; elle reste à l'hôtel quand on en part. */
export const CARTE = "carte_chambre_7" as const;

/** Ce qu'on porte dans les bras (S-08) : la batterie du panneau, la tête du robot. */
export type ObjetPorte = "batterie" | "tete";

/** Un objet posé par terre (repère du jeu). */
export interface PlaceAuSol {
  x: number;
  z: number;
}

/**
 * Où en est « le check-in », ce que le serveur garde (dans l'état du lieu, `propre.hotel`) et ce que le client voit
 * (message `hotel`). Tout revient au bout de 24 h (S-04).
 */
export interface EtatHotel {
  /** La batterie : au pied du panneau, branchée à la borne (elle y reste, S-07), dans les bras, ou posée là. */
  batterie: "panneau" | "borne" | "bras" | PlaceAuSol;
  /** La tête du robot : sur le robot, sur la borne (elle y reste), dans les bras, ou posée là. */
  tete: "robot" | "borne" | "bras" | PlaceAuSol;
  /** Le robot est dégagé du sable : on peut dévisser sa tête. */
  degage: boolean;
}

/** L'hôtel tel qu'on le trouve. */
export function etatHotelNeuf(): EtatHotel {
  return { batterie: "panneau", tete: "robot", degage: false };
}

const placeValide = (v: unknown): v is PlaceAuSol =>
  typeof v === "object" && v !== null && Number.isFinite((v as PlaceAuSol).x) && Number.isFinite((v as PlaceAuSol).z);

/**
 * Relit l'état gardé en base : une partie d'avant la 0.10 n'en a pas (l'hôtel neuf). Ce qui était dans les bras (une
 * coupure) revient à sa place d'origine. Ce qui avait été posé devant la grille de l'ascenseur (avant qu'on l'en écarte)
 * en est écarté : sinon, il ne se reprend plus.
 */
export function lireEtatHotel(brut: unknown): EtatHotel {
  const neuf = etatHotelNeuf();
  if (typeof brut !== "object" || brut === null) return neuf;
  const b = brut as Record<string, unknown>;
  const batterie = b.batterie === "borne" ? "borne" : placeValide(b.batterie) ? horsDeLAscenseur({ x: b.batterie.x, z: b.batterie.z }) : "panneau";
  const tete = b.tete === "borne" ? "borne" : placeValide(b.tete) ? horsDeLAscenseur({ x: b.tete.x, z: b.tete.z }) : "robot";
  return { batterie, tete, degage: b.degage === true || tete !== "robot" };
}

/** La borne a du courant : la batterie y est branchée. */
export function borneAlimentee(e: EtatHotel): boolean {
  return e.batterie === "borne";
}

/** Ce qu'on a dans les bras (null : rien). */
export function dansLesBrasHotel(e: EtatHotel): ObjetPorte | null {
  return e.batterie === "bras" ? "batterie" : e.tete === "bras" ? "tete" : null;
}

/** « la batterie », « la tête du robot » (pour les messages). */
export const NOMS_PORTES: Record<ObjetPorte, string> = { batterie: "la batterie", tete: "la tête du robot" };

/** Où est la batterie, où est la tête quand elles sont à leur place d'origine ou sur la borne (repère du jeu). */
export function ouEst(e: EtatHotel, objet: ObjetPorte): PlaceAuSol | null {
  const place = objet === "batterie" ? e.batterie : e.tete;
  if (place === "bras") return null;
  if (place === "panneau") return PANNEAU;
  if (place === "robot") return ROBOT;
  if (place === "borne") return BORNE;
  return place;
}

/** Le rayon de la grille de l'ascenseur pour les propositions (le client compte la portée depuis son bord). */
export const RAYON_GRILLE = 0.9;

/**
 * Ce qu'on pose devant la grille de l'ascenseur (la batterie, la tête) en est écarté jusqu'à cette distance : sinon,
 * l'appel de l'ascenseur, plus proche, passe avant « Prendre », et l'objet ne se reprend plus (essai du porteur, 0.10).
 */
export const ECART_ASCENSEUR = PORTEE_HOTEL + 0.3;

/** Le rayon d'un personnage (deplacement.ts) : l'objet écarté est posé là où l'on peut se tenir. */
const RAYON_PERSONNAGE = 0.35;

const libreAuSol = (x: number, z: number): boolean => {
  if (x < ZONE_HOTEL.xMin || x > ZONE_HOTEL.xMax || z < ZONE_HOTEL.zMin || z > ZONE_HOTEL.zMax) return false;
  const r = RAYON_PERSONNAGE;
  const boites = ZONE_HOTEL.grille ? boitesPres(ZONE_HOTEL.grille, x, z) : ZONE_HOTEL.obstacles;
  return !boites.some((b) => Math.abs(x - b.x) <= b.l / 2 + r && Math.abs(z - b.z) <= b.p / 2 + r);
};

/**
 * Un objet posé trop près d'une grille de l'ascenseur (en bas comme en haut) est poussé à ECART_ASCENSEUR de la grille,
 * du côté de `depuis` (celui qui le pose ; sinon, du côté où il est tombé), sur un point libre de la même pièce que
 * l'arrivée de l'ascenseur. Si cette direction est bouchée, on tourne de 20° en 20° autour de la grille. Ailleurs (ou
 * sans point libre), il reste où il est.
 */
export function horsDeLAscenseur(ou: PlaceAuSol, depuis?: { x: number; z: number }): PlaceAuSol {
  for (const cote of [ASCENSEUR.bas, ASCENSEUR.haut]) {
    const g = cote.grille;
    if (Math.hypot(ou.x - g.x, ou.z - g.z) >= ECART_ASCENSEUR) continue;
    const piece = pieceHotel(cote.arrivee.x, cote.arrivee.z);
    const vers = [depuis, ou, cote.arrivee].find((v) => v && Math.hypot(v.x - g.x, v.z - g.z) > 0.05)!;
    const angle = Math.atan2(vers.x - g.x, vers.z - g.z);
    // Un centimètre de plus : arrondi au centimètre, l'objet reste hors de l'écart (relu, il ne bouge plus).
    const d = ECART_ASCENSEUR + 0.01;
    for (let pas = 0; pas <= 9; pas++) {
      for (const signe of pas === 0 ? [1] : [1, -1]) {
        const a = angle + (signe * pas * Math.PI) / 9;
        const x = Math.round((g.x + Math.sin(a) * d) * 100) / 100;
        const z = Math.round((g.z + Math.cos(a) * d) * 100) / 100;
        if (pieceHotel(x, z) === piece && libreAuSol(x, z)) return { x, z };
      }
    }
    return ou;
  }
  return ou;
}

// ---------- Le butin (S-03 ; FICHE.fouille, FICHE.objets) ----------

/** Version du contenu de l'hôtel (points de butin, Éteints) : la changer régénère les hôtels. */
export const VERSION_HOTEL = 1;

/**
 * Les points de butin, posés sur le décor du modèle. Les objets-clés à leur place, tous à l'étage (Q-0.10-2), là où le
 * modèle les dessine (FICHE.objets) ; le pied de guéridon sur la terrasse ; puis les 22 fouilles de la fiche (sans le
 * robot ni la batterie du panneau, qui sont du « check-in »).
 */
export function butinHotel(): { id: number; type: TypeRessourceHotel; x: number; z: number }[] {
  const points: [TypeRessourceHotel, number, number][] = [
    ["hotel_couvertures", -13.6, -30.75],
    ["hotel_lanterne", -15.35, -21.5],
    ["hotel_roulements", 3.48, -29.9],
    ["hotel_fer", 3.5, -28.9],
    ["hotel_toles", -1.9, -22.53],
    ["hotel_gueridon", -5.2, 6.2],
    ["hotel_reception", -1.9, -8.8],
    ["hotel_bagages", -0.7, -4.6],
    ["hotel_cuisines", -6.6, -13.6],
    ["hotel_conserves", -14.2, -15.9],
    ["hotel_poisson", -11.4, -15.9],
    ["hotel_desserte", -9.3, -10.6],
    ["hotel_camp", 12, -15.4],
    ["hotel_bar", 20.2, -5.8],
    ["hotel_buvette", -20, 14.4],
    ["hotel_barque", 7, 23.6],
    ["hotel_maitre_nageur", 18, 22.5],
    ["hotel_transats", 11, 11.4],
    ["hotel_balcon_tombe", -10.8, -0.6],
    ["hotel_bain_suite", -17.9, -22],
    ["hotel_bain_7", -9.8, -24.6],
    ["hotel_toilette_9", 2.2, -21.5],
    ["hotel_chambre_11", -2.4, -30.9],
    ["hotel_lingerie", -13.6, -29.9],
    ["hotel_suite", -14.6, -21.8],
    ["hotel_machinerie", 4.1, -29.4],
    ["hotel_chambre_8", -2, -22],
    ["hotel_office", 1, -30.6],
  ];
  return points.map(([type, x, z], i) => ({ id: i + 1, type, ...jeuHotel(x, z) }));
}

// ---------- Les textes (courts, sans jargon ; jamais le mot qui ouvre les portes) ----------

export const TEXTES_HOTEL = {
  borneEteinte: "La borne « Check-in par sourire » : un écran noir, un petit objectif. Pas de courant.",
  borneAllumee: "La borne s'est réveillée : sur l'écran, Watty attend ton plus beau sourire.",
  borneSansCourant: "La borne ne répond pas : son écran reste noir.",
  sourireNonReconnu: "« Sourire non reconnu. Veuillez sourire davantage. »",
  carteRemise: "« Bienvenue, cher client ! » Une carte glisse de la fente : la carte de la chambre 7. La tête reste sur la borne.",
  dejaLaCarte: "« Vous avez déjà votre carte, cher client. »",
  brancher: "Tu branches la batterie au pied de la borne. L'écran s'allume : Watty sourit.",
  batterie: "Au pied du panneau « Séjour Zéro-Effort », sa batterie, lourde comme une brique de plomb. Elle se dévisse.",
  batterieAuSol: "La batterie du panneau, posée là. Lourde : on la porte à deux bras.",
  prendreBatterie: "Tu prends la batterie dans tes bras : le panneau s'éteint. On marche, on ne court pas.",
  robotEnsable: "Le robot-serveur, ensablé jusqu'aux épaules, sourit encore sous la poussière. Il faut le dégager pour dévisser sa tête.",
  robotDegage: "Le robot-serveur, dégagé du sable. Sa tête se dévisse : huit kilos.",
  degage: "Le robot est dégagé. Sa tête se dévisse.",
  aMainsNues: "À mains nues, ce sera long : une pelle irait plus vite.",
  teteAuSol: "La tête du robot-serveur, posée là, qui sourit toujours.",
  prendreTete: "Tu dévisses la tête du robot : huit kilos, à deux mains. Tu ne peux plus frapper.",
  ascenseurBas: "L'ascenseur à grille du hall. Le grand escalier s'est effondré : c'est le seul chemin vers les étages. Un lecteur attend une carte.",
  ascenseurHaut: "L'ascenseur à grille du palier. Il redescend au hall.",
  sansCarte: "La grille ne bouge pas. Sur le lecteur, une lumière rouge : « Votre carte, s'il vous plaît. »",
  monter: "Tu passes la carte : la grille s'ouvre, la cabine monte en grinçant.",
  descendre: "La cabine redescend en grinçant.",
  balcon: "Tu enjambes le garde-corps tordu et tu sautes sur la dune. Par là, on ne remonte pas.",
  carteLaissee: "La carte de la chambre 7 ne sert qu'à l'hôtel : tu l'y laisses.",
} as const;
