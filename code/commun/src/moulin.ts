// L1B, le Moulin du Gué (plan 0.8, chantier 12 ; étude h1b-l1b-conception §2, propositions M1 à M35) : le plan en
// données, partagé par le serveur (collisions, pièces, portes, obscurité, butin, leurres) et par le client (le modèle
// 3D de la session « bâtiments », copié dans client/src/batiments/moulin/). Tout est de plain-pied.
//
// Repère : celui du modèle (+x à l'est, +z au sud, origine au centre du lot de 64 × 54 m), ramené à celui du jeu par
// `jeu()` : x + 32, z + 27 (le coin nord-ouest du lot est l'origine du jeu, comme MOULIN.origineModele de lieux.ts).
// Les coordonnées écrites ici sont celles du modèle : on les relit sur sa fiche (FICHE) et sur le plan de l'étude.
//
// Le parcours (M1 à M35) : on arrive au pont ; la grosse clé pend au tableau de l'atelier, dans les dépendances ; elle
// ouvre la grande porte de la salle des meules ; on passe le couloir du rouet, le long de la fosse ; au nord, les meules
// nord, le magasin, le jardin clos ; on repart par la planche du bief et le chemin de halage (une sortie sans arrivée).
//
// Ce fichier n'importe des autres modules du jeu que des types, et murs.ts (lieux.ts l'importe pour sa zone).

import type { Boite } from "./lieux.ts";
import { declarerObstaclesBas } from "./murs.ts";
import type { TypeRessource } from "./terrain.ts";

/** Le coin nord-ouest du lot, dans le repère du modèle (le même que MOULIN.origineModele, vérifié par moulin.test.ts). */
export const ORIGINE_MODELE_MOULIN = { x: 32, z: 27 } as const;

/** Un point du modèle dans le repère du jeu. */
export function jeu(x: number, z: number): { x: number; z: number } {
  return { x: x + ORIGINE_MODELE_MOULIN.x, z: z + ORIGINE_MODELE_MOULIN.z };
}

/** Une boîte du modèle dans le repère du jeu. */
function boiteJeu(x: number, z: number, l: number, p: number): Boite {
  return { x: x + ORIGINE_MODELE_MOULIN.x, z: z + ORIGINE_MODELE_MOULIN.z, l, p };
}

// ---------- Les obstacles : ceux du modèle (`userData.obstacles`), relevés tels quels ----------

/** Un segment infranchissable du modèle : x1, z1, x2, z2 (repère du modèle), et sa nature. */
export type SegmentMoulin = readonly [number, number, number, number, string];

/**
 * Les segments du modèle (`creer().userData.obstacles`, usure 0,7 comme 1 : les mêmes), dans l'ordre où il les note.
 * Une copie : le serveur ne construit pas le décor 3D. Le test client/src/rendu/moulin.test.ts vérifie qu'elle suit le
 * modèle importé ; s'il change (`npm run batiments:importer`), on recopie la liste.
 */
export const SEGMENTS_MODELE: readonly SegmentMoulin[] = [
  [9.5, -27, 9.5, -21.45, "berge"],
  [9.5, -20.55, 9.5, 8, "berge"],
  [13, -27, 13, -21.45, "berge"],
  [13, -20.55, 13, -16, "berge"],
  [13, -14, 13, 4, "berge"],
  [13, -16, 14.4, -16, "berge"],
  [15.6, -16, 17, -16, "berge"],
  [13, -14, 14.4, -14, "berge"],
  [15.6, -14, 17, -14, "berge"],
  [13, 4, 17, 4, "berge"],
  [9.5, 8, 17, 8, "berge"],
  [17, -27, 17, -16, "berge"],
  [17, -14, 17, 4, "berge"],
  [17, 8, 17, 15, "berge"],
  [17, 19, 17, 27, "berge"],
  [25, -27, 25, 15, "berge"],
  [25, 19, 25, 27, "berge"],
  [15.3, 15.21, 26.7, 15.21, "parapet"],
  [15.3, 18.79, 26.7, 18.79, "parapet"],
  [14.45, -16.2, 14.45, -13.8, "garde-corps"],
  [15.55, -16.2, 15.55, -13.8, "garde-corps"],
  [13, -3.6, 13.75, -3.6, "palier"],
  [13, -2.4, 13.75, -2.4, "palier"],
  [8.3, -3, 9.5, -3, "arbre de la roue"],
  [-4, 1, 0.1, 1, "mur"],
  [1.9, 1, 5.4, 1, "mur"],
  [6.6, 1, 8, 1, "mur"],
  [8, 1, 8, -11, "mur"],
  [8, -11, -4, -11, "mur"],
  [0.1, 1, 1.9, 1, "grande porte (fermée à clé ; reste ouverte une fois déverrouillée)"],
  [5.4, 1, 6.6, 1, "porte bouchée (éboulis du plancher de l'étage)"],
  [-3.2, -8.8, 3.4, -8.8, "beffroi"],
  [-3.2, -4.2, 3.4, -4.2, "beffroi"],
  [-3.2, -8.8, -3.2, -4.2, "beffroi"],
  [3.4, -8.8, 3.4, -4.2, "beffroi"],
  [3.4, -5.7, 4.2, -5.7, "escalier du beffroi (condamné)"],
  [3.4, -4.9, 4.2, -4.9, "escalier du beffroi (condamné)"],
  [-3.78, -6.5, -3.2, -6.5, "beffroi (claire-voie : la vue passe, pas les corps)"],
  [-1.95, -3.95, -0.85, -3.95, "huche"],
  [-2.95, -10.2, -1.45, -10.2, "meule"],
  [1.2, -10.12, 3, -10.12, "établi du rhabilleur"],
  [4.2, 0.7, 4.2, -0.95, "mur"],
  [4.2, -2.45, 4.2, -9, "mur"],
  [4.2, -10.4, 4.2, -10.7, "mur"],
  [5.85, -4.85, 5.85, -3.5, "fosse du rouet"],
  [5.85, -3.5, 5.85, -2.5, "fosse du rouet : garde-corps brisé (on y repousse un Éteint)"],
  [5.85, -2.5, 5.85, -1.15, "fosse du rouet"],
  [5.85, -1.15, 6.95, -1.15, "fosse du rouet"],
  [5.85, -4.85, 6.95, -4.85, "fosse du rouet"],
  [7, -3.35, 7, -2.65, "palier"],
  [4.5, -10.08, 7.45, -10.08, "poutres de rechange"],
  [-18, 3, -10.4, 3, "mur"],
  [-8.8, 3, -4, 3, "mur"],
  [-4, 3, -4, -9.15, "mur"],
  [-4, -10.35, -4, -13, "mur"],
  [-4, -13, -14.85, -13, "mur"],
  [-16.15, -13, -18, -13, "mur"],
  [-18, -13, -18, 3, "mur"],
  [-18, -3, -11.8, -3, "mur"],
  [-10.2, -3, -4, -3, "mur"],
  [-11.8, -3, -10.2, -3, "porte condamnée (boutique – magasin)"],
  [-17.6, -9.9, -15.2, -9.9, "sacs"],
  [-15.2, -12.7, -15.2, -9.9, "sacs"],
  [-15.6, -6.2, -15.6, -8.6, "sacs"],
  [-9, -9.6, -8, -9.6, "bascule"],
  [-16.9, -5.22, -13.1, -5.22, "blutoir"],
  [-16.9, -3.98, -13.1, -3.98, "blutoir"],
  [-8.35, -11.15, -6.65, -11.15, "barils à farine cerclés"],
  [-8.35, -12.75, -8.35, -11.15, "barils à farine cerclés"],
  [-6.65, -12.75, -6.65, -11.15, "barils à farine cerclés"],
  [-16.4, -0.4, -12.6, -0.4, "gondole"],
  [-7.6, 0.4, -5, 0.4, "comptoir"],
  [-9.2, -2.55, -5.2, -2.55, "étagère"],
  [-21, 4, -21, 2.5, "mur"],
  [-21, 1.5, -21, -6, "mur"],
  [-30, 4, -21, 4, "mur"],
  [-30, -6, -30, 4, "mur"],
  [-21, -6, -30, -6, "mur"],
  [-30, -1, -26.45, -1, "mur"],
  [-25.55, -1, -21, -1, "mur"],
  [-20.7, -5.6, -20.7, -1.9, "tas de bois"],
  [-27, 1.35, -25, 1.35, "table"],
  [-27, 2.25, -25, 2.25, "table"],
  [-23.9, -0.4, -22.5, -0.4, "buffet"],
  [-29.7, -3.45, -27.6, -3.45, "lit"],
  [-27.6, -4.95, -27.6, -3.45, "lit"],
  [-27, -5.15, -25.6, -5.15, "armoire"],
  [-6, 9, -9.3, 9, "mur"],
  [-10.7, 9, -18.8, 9, "mur"],
  [-20.2, 9, -24, 9, "mur"],
  [-24, 16, -6, 16, "mur"],
  [-6, 16, -6, 13.7, "mur"],
  [-6, 11.3, -6, 9, "mur"],
  [-24, 9, -24, 16, "mur"],
  [-15, 16, -15, 11, "mur"],
  [-15, 10, -15, 9, "mur"],
  [-12.6, 13, -12.6, 15.05, "stalle"],
  [-8.3, 13, -8.3, 15.05, "stalle"],
  [-14.6, 15.05, -6.45, 15.05, "auge"],
  [-22.9, 10.3, -22.9, 13.4, "établi"],
  [-20.9, 12.75, -18.3, 12.75, "tréteaux"],
  [-23.6, 6.6, -23.86, 7.24, "puits"],
  [-23.86, 7.24, -24.5, 7.5, "puits"],
  [-24.5, 7.5, -25.14, 7.24, "puits"],
  [-25.14, 7.24, -25.4, 6.6, "puits"],
  [-25.4, 6.6, -25.14, 5.96, "puits"],
  [-25.14, 5.96, -24.5, 5.7, "puits"],
  [-24.5, 5.7, -23.86, 5.96, "puits"],
  [-23.86, 5.96, -23.6, 6.6, "puits"],
  [-2.6, 5.6, -0.4, 7.2, "charrette"],
  [-32, -6, -30.25, -6, "mur"],
  [-20.75, -6, -18.22, -6, "mur"],
  [8.1, -16.7, 8.5, -16.3, "if"],
  [9.5, -21.45, 13, -21.45, "bord de la planche (le bief)"],
  [9.5, -20.55, 13, -20.55, "bord de la planche (le bief)"],
];

/**
 * Ce que le jeu ajoute aux segments du modèle. La fosse du rouet n'a pas de garde-corps à l'est : le rouet la remplit
 * (sa jante descend dans la fosse) et le palier de l'arbre la ferme ; sans ce bord, on entrerait dans la fosse par là,
 * et le rampant du fond en sortirait. À demander aussi à la session « bâtiments » (compte rendu du chantier 12).
 */
export const SEGMENTS_EN_PLUS: readonly SegmentMoulin[] = [[6.95, -4.85, 6.95, -1.15, "fosse du rouet (bord est, sous le rouet)"]];

/**
 * Les segments du modèle que le jeu corrige, en attendant une retouche demandée à la session « bâtiments » (compte rendu
 * du chantier 12). La porte de derrière du magasin (x −16,15 → −14,85) donne contre la grande pile de sacs (x −17,4 →
 * −15,5) : il reste 0,65 m de passage pour un personnage de 0,7 m, et le jardin n'est plus accessible. On recule
 * l'obstacle de la pile de 0,7 m vers l'ouest : on frôle les sacs en passant.
 */
const CORRECTIONS: readonly (readonly [SegmentMoulin, SegmentMoulin])[] = [
  [
    [-15.2, -12.7, -15.2, -9.9, "sacs"],
    [-15.9, -12.3, -15.9, -9.9, "sacs"],
  ],
  [
    [-17.6, -9.9, -15.2, -9.9, "sacs"],
    [-17.6, -9.9, -15.9, -9.9, "sacs"],
  ],
];

/** Un segment du modèle, corrigé s'il le faut. */
function corrige(s: SegmentMoulin): SegmentMoulin {
  return CORRECTIONS.find(([a]) => a.every((v, i) => v === s[i]))?.[1] ?? s;
}

/** Les obstacles qui arrêtent les coups et les objets lancés (murs, portes, piles de sacs) ; les autres sont bas. */
function arreteLesCoupsMoulin(nature: string): boolean {
  return (
    nature === "mur" ||
    nature === "sacs" ||
    nature === "if" ||
    nature.startsWith("grande porte") ||
    nature.startsWith("porte ") ||
    nature.startsWith("escalier du beffroi") ||
    // Le garde-corps de la fosse : un Éteint tombé au fond ne saisit personne, et ne se touche que d'en haut, avec une
    // arme longue (M14 : atteintDansLaFosse).
    nature.startsWith("fosse du rouet")
  );
}

/** Les murs (et les portes condamnées) arrêtent la vue au-dessus de 1,2 m ; le reste est bas, ou à claire-voie. */
function arreteLaVue(nature: string): boolean {
  return nature === "mur" || nature.startsWith("porte condamnée");
}

/** L'épaisseur de la boîte d'un segment : les murs comptent leur maçonnerie, le reste est mince. */
function epaisseur(nature: string): number {
  return nature === "mur" || nature.startsWith("grande porte") || nature.startsWith("porte ") ? 0.3 : 0.1;
}

/**
 * Les boîtes d'un segment, dans le repère du jeu. Un segment droit (selon x ou selon z) fait une boîte ; un segment de
 * biais (le puits, la charrette, l'if) une rangée de petits carrés. Les bords de la planche du bief sont reculés de
 * 15 cm vers l'eau : la planche fait 0,9 m, un personnage 0,7 m ; sans ce jeu, on n'y passerait qu'au centimètre.
 * Les obstacles bas (berges, huche, établis…) sont déclarés tels (murs.ts) : on frappe et l'on lance par-dessus.
 */
export function boitesDuSegment(segment: SegmentMoulin): Boite[] {
  const boites = boitesBrutes(segment);
  if (!arreteLesCoupsMoulin(segment[4])) declarerObstaclesBas(boites);
  return boites;
}

function boitesBrutes([x1, z1, x2, z2, nature]: SegmentMoulin): Boite[] {
  const ep = epaisseur(nature);
  if (nature.startsWith("bord de la planche")) {
    const recul = z1 < -21 ? -0.15 : 0.15;
    z1 += recul;
    z2 += recul;
  }
  if (Math.abs(z2 - z1) < 1e-6) return [boiteJeu((x1 + x2) / 2, z1, Math.abs(x2 - x1), ep)];
  if (Math.abs(x2 - x1) < 1e-6) return [boiteJeu(x1, (z1 + z2) / 2, ep, Math.abs(z2 - z1))];
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

/** La grande porte de la salle des meules : son segment dans le modèle (la porte fermée). */
const NATURE_GRANDE_PORTE = "grande porte (fermée à clé ; reste ouverte une fois déverrouillée)";

/** Tous les obstacles fixes du Moulin (la grande porte, quand elle est fermée, s'y ajoute : boitePorteMoulin). */
export function obstaclesMoulin(): Boite[] {
  return [...SEGMENTS_MODELE.map(corrige), ...SEGMENTS_EN_PLUS].filter((s) => s[4] !== NATURE_GRANDE_PORTE).flatMap(boitesDuSegment);
}

// ---------- Les pièces (la vue par pièce, le son, l'obscurité) ----------

export type PieceMoulin =
  | "dehors"
  | "jardin"
  | "etable"
  | "atelier"
  | "cuisine"
  | "chambre"
  | "boutique"
  | "magasin"
  | "meules_sud"
  | "meules_nord"
  | "roue";

/**
 * Les onze pièces (§2.11 de l'étude) : « dehors » est la cour, le pont et les berges ; le jardin, clos de murs, est la
 * partie nord (avec la levée, au-delà de la planche). Les pièces sombres (M30) : la salle de la roue, les meules nord,
 * le magasin. Les boîtes sont dans le repère du modèle ; `pieceMoulin` les relit.
 */
export const PIECES_MOULIN: Record<PieceMoulin, { boites: readonly Boite[]; sombre: boolean; nom: string }> = {
  dehors: { boites: [], sombre: false, nom: "la cour" },
  jardin: {
    // Le jardin du meunier, au nord des bâtiments ; le coin entre le moulin et le bief, au nord de l'arbre de la roue ;
    // la levée, entre le bief et la rivière.
    boites: [
      { x: -11.25, z: -16.5, l: 41.5, p: 21 },
      { x: 12.5, z: -15, l: 9, p: 24 },
      { x: 15, z: -11.5, l: 4, p: 31 },
    ],
    sombre: false,
    nom: "le jardin",
  },
  etable: { boites: [{ x: -10.5, z: 12.5, l: 9, p: 7 }], sombre: false, nom: "l'étable" },
  atelier: { boites: [{ x: -19.5, z: 12.5, l: 9, p: 7 }], sombre: false, nom: "l'atelier du charpentier" },
  cuisine: { boites: [{ x: -25.5, z: 1.5, l: 9, p: 5 }], sombre: false, nom: "la cuisine du meunier" },
  chambre: { boites: [{ x: -25.5, z: -3.5, l: 9, p: 5 }], sombre: false, nom: "la chambre du meunier" },
  boutique: { boites: [{ x: -11, z: 0, l: 14, p: 6 }], sombre: false, nom: "l'Expérience Farine Authentique" },
  magasin: { boites: [{ x: -11, z: -8, l: 14, p: 10 }], sombre: true, nom: "le magasin" },
  meules_sud: { boites: [{ x: 0.1, z: -2.75, l: 8.2, p: 7.5 }], sombre: false, nom: "les meules sud" },
  // Le beffroi coupe la salle des meules (z −6,5 à l'ouest ; à l'est, l'escalier condamné, z −5,3).
  meules_nord: {
    boites: [
      { x: 0.1, z: -8.75, l: 8.2, p: 4.5 },
      { x: 3.8, z: -5.9, l: 0.8, p: 1.2 },
    ],
    sombre: true,
    nom: "les meules nord",
  },
  roue: { boites: [{ x: 6.1, z: -5, l: 3.8, p: 12 }], sombre: true, nom: "la salle de la roue" },
};

/** Les pièces dans l'ordre où on les cherche : les bâtiments d'abord (les meules nord avant les meules sud), puis le jardin. */
const ORDRE_PIECES: readonly PieceMoulin[] = ["meules_nord", "meules_sud", "roue", "magasin", "boutique", "chambre", "cuisine", "atelier", "etable", "jardin"];

function dansBoiteModele(x: number, z: number, b: Boite): boolean {
  return Math.abs(x - b.x) <= b.l / 2 && Math.abs(z - b.z) <= b.p / 2;
}

/** La pièce d'un point du jeu (sinon : dehors). */
export function pieceMoulin(x: number, z: number): PieceMoulin {
  const mx = x - ORIGINE_MODELE_MOULIN.x;
  const mz = z - ORIGINE_MODELE_MOULIN.z;
  for (const p of ORDRE_PIECES) if (PIECES_MOULIN[p].boites.some((b) => dansBoiteModele(mx, mz, b))) return p;
  return "dehors";
}

/** Fait-il noir ici, même en plein jour ? (assombri, jamais noir : la lampe y porte comme la nuit) */
export function sombreMoulin(x: number, z: number): boolean {
  return PIECES_MOULIN[pieceMoulin(x, z)].sombre;
}

// ---------- Les portes, les fenêtres, la claire-voie du beffroi ----------

/** Une ouverture du Moulin, dans le repère du jeu. `sens` : le mur qui la porte court selon x ou selon z. */
export interface OuvertureMoulin {
  id: string;
  x: number;
  z: number;
  largeur: number;
  sens: "x" | "z";
  entre: [PieceMoulin, PieceMoulin];
}

/**
 * Une porte : la grande porte se ferme (à clé, au départ) ; toutes les autres ont leur battant ouvert, arraché ou
 * tombé dans le modèle : elles restent ouvertes (la vue, le son et les Éteints y passent).
 */
export interface PorteMoulin extends OuvertureMoulin {
  /** Ouverte au départ ; une porte sans `fermable` l'est toujours. */
  ouverte: boolean;
  fermable?: true;
  /** Elle grince : l'ouvrir s'entend loin (M6). */
  bruyante?: true;
}

const ouverture = (id: string, x: number, z: number, largeur: number, sens: "x" | "z", entre: [PieceMoulin, PieceMoulin]): OuvertureMoulin => ({ id, ...jeu(x, z), largeur, sens, entre });

export const PORTES_MOULIN: readonly PorteMoulin[] = [
  // La grande porte de la salle des meules (M4 à M6), fermée à clé au départ.
  { ...ouverture("grande_porte", 1, 1, 1.8, "x", ["dehors", "meules_sud"]), ouverte: false, fermable: true, bruyante: true },
  // Le couloir du rouet (M13) : la salle de la roue s'ouvre sur les meules sud et sur les meules nord.
  { ...ouverture("roue_sud", 4.2, -1.7, 1.5, "z", ["meules_sud", "roue"]), ouverte: true },
  { ...ouverture("roue_nord", 4.2, -9.7, 1.4, "z", ["roue", "meules_nord"]), ouverte: true },
  // Le magasin : sur les meules nord (M11), et sa porte de derrière sur le jardin (M20).
  { ...ouverture("magasin_meules", -4, -9.75, 1.2, "z", ["magasin", "meules_nord"]), ouverte: true },
  { ...ouverture("magasin_jardin", -15.5, -13, 1.3, "x", ["magasin", "jardin"]), ouverte: true },
  // La porte vitrée brisée de la boutique, sur la cour (M8).
  { ...ouverture("porte_vitree", -9.6, 3, 1.6, "x", ["dehors", "boutique"]), ouverte: true },
  // Le logis du meunier.
  { ...ouverture("logis", -21, 2, 1, "z", ["dehors", "cuisine"]), ouverte: true },
  { ...ouverture("logis_chambre", -26, -1, 0.9, "x", ["cuisine", "chambre"]), ouverte: true },
  // Les dépendances : l'étable et l'atelier sur la cour, la porte entre les deux, le grand portail de l'étable.
  { ...ouverture("etable", -10, 9, 1.4, "x", ["dehors", "etable"]), ouverte: true },
  { ...ouverture("atelier", -19.5, 9, 1.4, "x", ["dehors", "atelier"]), ouverte: true },
  { ...ouverture("dependances", -15, 10.5, 1, "z", ["atelier", "etable"]), ouverte: true },
  { ...ouverture("portail_etable", -6, 12.5, 2.4, "z", ["dehors", "etable"]), ouverte: true },
];

/**
 * La claire-voie du beffroi (M9) : le plancher des meules, sur ses poteaux, sous 1,2 m de mur. La vue et le son passent
 * d'une moitié de la salle à l'autre, pas les corps : pour un Éteint, les meules nord et sud ne se rejoignent que par le
 * couloir du rouet. Pour la vue, c'est une porte toujours ouverte ; ce n'est jamais un passage.
 */
export const CLAIRE_VOIE: OuvertureMoulin = ouverture("claire_voie", 0.1, -6.5, 7.4, "x", ["meules_sud", "meules_nord"]);

/**
 * Les fenêtres (la vue passe, pas le corps) et les ouvertures qu'on enjambe du regard : la porte de la roue, bouchée
 * par l'éboulis (on voit par-dessus, M7) ; le mur du jardin, 2 m (il arrête la vue ; le son passe par-dessus, étouffé) ;
 * la rivière, entre la cour et la levée (rien ne l'arrête). `opaque` : elle arrête la vue.
 */
export const FENETRES_MOULIN: readonly (OuvertureMoulin & { opaque?: true })[] = [
  ouverture("meules_sud", -2.5, 1, 0.9, "x", ["dehors", "meules_sud"]),
  ouverture("roue_bouchee", 6, 1, 1.2, "x", ["dehors", "roue"]),
  ouverture("roue_arbre", 8, -3, 0.8, "z", ["roue", "jardin"]),
  ouverture("roue_bief", 8, -8.5, 0.9, "z", ["roue", "jardin"]),
  // M34 : la fenêtre nord des meules nord, sur le jardin : on voit l'if avant d'y être.
  ouverture("meules_nord", 0, -11, 0.8, "x", ["meules_nord", "jardin"]),
  ouverture("vitrine", -14.5, 3, 4, "x", ["dehors", "boutique"]),
  ouverture("boutique_sud", -6, 3, 1.2, "x", ["dehors", "boutique"]),
  ouverture("boutique_est", -4, 2, 0.8, "z", ["dehors", "boutique"]),
  ouverture("boutique_ouest", -18, 0, 1.2, "z", ["dehors", "boutique"]),
  ouverture("magasin_nord", -11, -13, 1.2, "x", ["magasin", "jardin"]),
  ouverture("magasin_ouest", -18, -9.5, 1.2, "z", ["magasin", "jardin"]),
  ouverture("magasin_ruelle", -18, -5, 1.2, "z", ["magasin", "dehors"]),
  ouverture("chambre_est", -21, -3.5, 0.9, "z", ["dehors", "chambre"]),
  ouverture("chambre_nord", -25.5, -6, 0.8, "x", ["chambre", "jardin"]),
  ouverture("cuisine_1", -27.5, 4, 0.9, "x", ["dehors", "cuisine"]),
  ouverture("cuisine_2", -23.5, 4, 0.9, "x", ["dehors", "cuisine"]),
  ouverture("atelier_cour", -22.5, 9, 0.9, "x", ["dehors", "atelier"]),
  ouverture("atelier_sud", -20, 16, 1, "x", ["dehors", "atelier"]),
  ouverture("etable_sud_1", -12, 16, 0.6, "x", ["dehors", "etable"]),
  ouverture("etable_sud_2", -8, 16, 0.6, "x", ["dehors", "etable"]),
  { ...ouverture("mur_jardin", -25, -6, 14, "x", ["dehors", "jardin"]), opaque: true },
  ouverture("riviere", 21, -10, 30, "z", ["dehors", "jardin"]),
];

/** Les murs qui arrêtent la vue (repère du jeu), fenêtres non percées. */
export function mursVueMoulin(): Boite[] {
  return SEGMENTS_MODELE.filter((s) => arreteLaVue(s[4])).flatMap(boitesBrutes);
}

/** L'état des portes à la première visite : la grande porte fermée. */
export function portesInitialesMoulin(): Record<string, boolean> {
  return Object.fromEntries(PORTES_MOULIN.filter((p) => p.fermable).map((p) => [p.id, p.ouverte]));
}

/** Une porte fermée : la boîte qui bouche son ouverture. */
export function boitePorteMoulin(p: OuvertureMoulin): Boite {
  return p.sens === "x" ? { x: p.x, z: p.z, l: p.largeur, p: 0.3 } : { x: p.x, z: p.z, l: 0.3, p: p.largeur };
}

/** On ouvre ou ferme la grande porte jusqu'à cette distance de son battant. */
export const PORTEE_PORTE_MOULIN = 1.6;

/** Distance d'un point au battant d'une porte. */
export function distancePorteMoulin(p: OuvertureMoulin, x: number, z: number): number {
  const b = boitePorteMoulin(p);
  return Math.hypot(Math.max(0, Math.abs(x - b.x) - b.l / 2), Math.max(0, Math.abs(z - b.z) - b.p / 2));
}

/** La grande porte, fermée, répond par une ligne (M5) ; jamais une fenêtre. */
export const TEXTE_GRANDE_PORTE_FERMEE = "Fermée à clé. Le meunier laissait la grande clé à l'atelier, au tableau.";

// ---------- La fosse du rouet (M14, M15) ----------

/** La fosse du rouet, au fond de laquelle on tombe (repère du jeu) ; son fond est à 0,85 m sous le sol. */
export const FOSSE_ROUET: Boite = boiteJeu(6.4, -3, 0.9, 3.5);
export const PROFONDEUR_FOSSE = 0.85;
/** Le garde-corps brisé, côté couloir (x 5,85 ; z −3,5 → −2,5) : la seule place où l'on y repousse un Éteint. */
const BRECHE_FOSSE = { x: jeu(5.85, 0).x, z1: jeu(0, -3.5).z, z2: jeu(0, -2.5).z } as const;
/** On l'achève d'en haut avec une arme de 2 m d'allonge (la fourche) : rien de plus court n'y descend. */
export const ALLONGE_FOSSE = 2;

/** Ce point est-il au fond de la fosse ? */
export function dansLaFosse(x: number, z: number): boolean {
  return Math.abs(x - FOSSE_ROUET.x) <= FOSSE_ROUET.l / 2 + 0.05 && Math.abs(z - FOSSE_ROUET.z) <= FOSSE_ROUET.p / 2 + 0.05;
}

/** Un Éteint au fond de la fosse : avec une arme assez longue, on l'atteint d'en haut, par-dessus le garde-corps. */
export function atteintDansLaFosse(cible: { x: number; z: number }, allonge: number): boolean {
  return allonge >= ALLONGE_FOSSE && dansLaFosse(cible.x, cible.z);
}

/**
 * M14 : repoussé par le garde-corps brisé, un Éteint tombe dans la fosse, où il reste (on n'en remonte pas). Il tombe
 * si la poussée (de `de` vers lui, `recul` mètres) passe la brèche ; il est alors au fond, à terre un instant. Renvoie
 * vrai s'il est tombé. Ailleurs, la poussée ordinaire (commun/src/eteints.ts, repousser) le fait reculer.
 */
export function pousserDansLaFosse(
  e: { x: number; z: number; etat: string; aTerre: number; saisit: number | null; tenue: number; contact: number; etourdi: number },
  de: { x: number; z: number },
  recul = 1.5,
): boolean {
  if (e.x >= BRECHE_FOSSE.x) return false;
  const d = Math.hypot(e.x - de.x, e.z - de.z) || 1;
  const ux = (e.x - de.x) / d;
  const uz = (e.z - de.z) / d;
  // Il faut qu'il soit poussé vers l'est, et assez loin pour passer la lisse (son corps fait 0,3 m de rayon).
  if (ux <= 0.2) return false;
  const t = (BRECHE_FOSSE.x - e.x) / ux;
  if (t > recul + 0.3) return false;
  const zPassage = e.z + uz * t;
  if (zPassage < BRECHE_FOSSE.z1 - 0.1 || zPassage > BRECHE_FOSSE.z2 + 0.1) return false;
  e.x = FOSSE_ROUET.x;
  e.z = Math.max(FOSSE_ROUET.z - FOSSE_ROUET.p / 2 + 0.35, Math.min(FOSSE_ROUET.z + FOSSE_ROUET.p / 2 - 0.35, zPassage));
  e.etat = "a_terre";
  e.aTerre = 2.5;
  e.saisit = null;
  e.tenue = 0;
  e.contact = 0;
  e.etourdi = 0;
  return true;
}

/** M15 : le rampant du fond gémit quand on passe tout près en marchant (pas en allure discrète). */
export const GEMIT_FOSSE = { distance: 3.5, portee: 16, intensite: 1.6, duree: 1.5, repos: 6 } as const;

// ---------- Les leurres du décor (M31) ----------

/**
 * Trois leurres, comme à la Coopérative (Book 23 §4.7) : on les actionne, ils font un bruit qui attire les Éteints.
 * `x`, `z` : là où on les actionne ; `source` : d'où part le bruit. `fois` : combien de fois (le monte-sacs, une fois par
 * visite ; la borne, trois, tant que sa batterie tient jusqu'au retour du Moulin à 24 h) ; sans : à volonté.
 */
export interface LeurreMoulin {
  id: "monte_sacs" | "babillard" | "borne";
  nom: string;
  x: number;
  z: number;
  source: { x: number; z: number };
  portee: number;
  duree: number;
  fois?: number;
  /** Combien de fois par visite (le monte-sacs : un seul sac pend à la corde). */
  parVisite?: true;
}
export const LEURRES_MOULIN: readonly LeurreMoulin[] = [
  // Sous l'auvent du pignon de la minoterie : on lâche la corde, un sac tombe du troisième (≈ 30 m).
  { id: "monte_sacs", nom: "le monte-sacs", ...jeu(-11, 5.4), source: jeu(-11, 4.6), portee: 30, duree: 2, fois: 1, parVisite: true },
  // Les meules sud : la sonnette de la trémie, au pied du beffroi (≈ 20 m) ; on l'entend jusqu'aux meules nord.
  { id: "babillard", nom: "le babillard de la trémie", ...jeu(-0.3, -3.5), source: jeu(-1.4, -6.3), portee: 20, duree: 2.5 },
  // La boutique : la borne « Pétrissez virtuellement ! », un jingle de 20 s (≈ 22 m) ; sa batterie tient trois fois.
  { id: "borne", nom: "la borne « Pétrissez virtuellement ! »", ...jeu(-14, 1.9), source: jeu(-14, 1.9), portee: 22, duree: 20, fois: 3 },
];

// ---------- Le butin (M22 à M28, B11 ; plan 0.8 §2.5 et §9.1, N1) ----------

/** Version du contenu du Moulin (points de butin, Éteints) : la changer régénère les Moulins. */
export const VERSION_MOULIN = 2;

/**
 * Tout le Moulin revient au bout de 24 h (plan 0.8 §9.1, N1 ; R51) : les Éteints, le butin, les clés à place fixe, la
 * grosse clé au tableau, la grande porte refermée à clé, la batterie de la borne. Seule la fourche ne revient pas : elle
 * ne se trouve qu'une fois par personnage.
 */
export const REINITIALISATION_MOULIN_MS = 24 * 3_600_000;

/**
 * Les points de butin, posés sur le décor du modèle (sa fiche : `fouille`). Les clés de L1B à place fixe (la toile de
 * jute et les feuillards au magasin, l'étau sur l'établi du rhabilleur), la grosse clé au tableau de l'atelier, la
 * fourche contre le mur de l'étable, les 2 bûches des poutres de rechange, l'if du jardin ; puis le butin commun
 * (l'étable, l'atelier, le logis, la malle du meunier et son carnet, la boutique, le magasin, le camp du pont), où une
 * fouille donne aussi, rarement, une clé de la Coopérative (R-BUTIN : LIEU_DE_FOUILLE, etapeButin).
 */
export function butinMoulin(): { id: number; type: TypeRessource; x: number; z: number }[] {
  const points: [TypeRessource, number, number][] = [
    ["moulin_cle", -17, 9.4],
    ["moulin_fourche", -6.75, 10.4],
    ["moulin_etau", 2.65, -10.2],
    ["poutres_chene", 6, -10.3],
    ["moulin_jute", -15, -10.5],
    ["moulin_feuillards", -7.3, -12],
    ["if_bief", 8.4, -16.5],
    ["moulin_etable", -10, 14.6],
    ["moulin_atelier", -22.6, 11.8],
    ["moulin_logis", -26, 1.8],
    ["moulin_malle", -26.9, -4.1],
    ["moulin_boutique", -12, 0.8],
    ["moulin_magasin", -8.5, -9],
    ["moulin_camp", 19.3, 17.6],
  ];
  return points.map(([type, x, z], i) => ({ id: i + 1, type, ...jeu(x, z) }));
}

/** Le carnet du meunier, dans la malle de la chambre (M28) : il dit où est la clé, et que l'étau est monté au moulin. */
export const CARNET_DU_MEUNIER =
  "Au fond de la malle, le carnet du meunier : « La grande clé reste au tableau de l'atelier, au quatrième clou. J'ai monté l'étau au moulin, sur l'établi des meules : plus besoin de traverser la cour pour rhabiller. »";
