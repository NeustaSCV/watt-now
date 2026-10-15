// L2B, le phare du cap (plan 0.10, chantier K ; niveau-2.md §9.1 ; précisions S-12 à S-18) : un lieu à soi, comme la
// Coopérative et le Moulin, au bout de la route B du niveau 2, après la corniche. Le plan en données, partagé par le
// serveur (collisions, pièces, portes, sorties, règles du « feu et du cargo ») et par le client (le modèle 3D de la
// session « bâtiments », copié dans client/src/batiments/phare/).
//
// Le scénario, « le feu et le cargo » (S-12 à S-18) : on prend l'escabeau du gardien au hangar, on le porte dans les bras
// jusqu'à la marque à la craie, sous l'escalier coupé à 3 m ; on remplit le bidon à la cuve, on ramasse le prisme tombé
// au pied de la tour ; on monte verser le pétrole et remettre le prisme ; la nuit seulement, on allume. La lumière
// réveille les dormeurs du chemin des douaniers, qui montent vers la tour ; la corne de brume (son compresseur réparé)
// les attire un moment vers la falaise. Deux minutes réelles après l'allumage, le cargo s'échoue dans la crique : l'épave
// et ses conteneurs (les objets-clés) restent jusqu'au retour du lieu, à 24 h. On descend à la grève par la rampe du canot
// (on saute son tronçon effondré : on ne la remonte pas), et l'on ressort par la grève, à l'ouest (une sortie sans
// arrivée).
//
// Le relief (L-1) : le serveur reste en 2D ; la grève (y ≈ − 8,8), la rampe (≈ 37°) et le pont de l'épave (y ≈ − 4) ne
// sont que des endroits du plan, séparés par la falaise, le bord de la rampe et la coque. Le client pose les personnages
// à la hauteur du sol donnée par le modèle (`hauteurSol`, client/src/rendu/phare.ts).
//
// Repère : comme le Moulin, le coin nord-ouest du lot est l'origine du jeu ; x du jeu = x du modèle + 30, z du jeu =
// z du modèle + 25 (`jeu`). Les données du modèle (segments, pièces, portes, objets, Éteints) sont tirées de lui par
// scripts/extraire-phare.mjs (commun/src/phare-modele.ts).
//
// Ce fichier n'importe des autres modules du jeu que des types, la grille et murs.ts (lieux.ts l'importe pour sa zone et
// ses sorties).

import { creerGrille } from "./grille.ts";
import type { Boite, Sortie, Zone } from "./lieux.ts";
import { declarerObstaclesBas } from "./murs.ts";
import {
  ESCABEAU_MODELE,
  PIECES_MODELE,
  PLACES_OBJETS,
  PORTES_MODELE,
  SEGMENTS_EPAVE,
  SEGMENTS_MODELE,
  SENS_UNIQUE_MODELE,
  type SegmentModele,
} from "./phare-modele.ts";

/** Le lot du modèle : 60 × 50 m (FICHE.lot), et son centre dans le repère du jeu. */
export const PHARE = { largeur: 60, profondeur: 50, origineModele: { x: 30, z: 25 } } as const;

/** Un point du modèle dans le repère du jeu. */
export function jeu(x: number, z: number): { x: number; z: number } {
  return { x: x + PHARE.origineModele.x, z: z + PHARE.origineModele.z };
}

/** Un point du jeu dans le repère du modèle (celui de `hauteurSol`). */
export function auModele(x: number, z: number): { x: number; z: number } {
  return { x: x - PHARE.origineModele.x, z: z - PHARE.origineModele.z };
}

// ---------- Les obstacles : ceux du modèle (`userData.obstacles`, `obstaclesEpave`) ----------

/** Les obstacles qui arrêtent les coups et les objets lancés : les murs, les cloisons, les parois des conteneurs. */
function arreteLesCoupsPhare(nature: string): boolean {
  return nature === "mur" || nature === "cloison" || nature.startsWith("conteneur");
}

/** L'épaisseur de la boîte d'un segment : les murs comptent leur maçonnerie, le reste est mince. */
function epaisseur(nature: string): number {
  return nature === "mur" ? 0.3 : 0.1;
}

/**
 * Les boîtes d'un segment (repère du jeu) : droit, une boîte ; de biais (la falaise, la coque, les rambardes de l'échelle
 * de coupée), une rangée de petits carrés de son épaisseur (plus gros, ils mangeraient l'échelle, large de 1,3 m).
 */
function boitesBrutes(s: SegmentModele): Boite[] {
  const ep = epaisseur(s.nature);
  const a = jeu(s.x1, s.z1);
  const b = jeu(s.x2, s.z2);
  if (Math.abs(b.z - a.z) < 1e-6) return [{ x: (a.x + b.x) / 2, z: a.z, l: Math.max(ep, Math.abs(b.x - a.x)), p: ep }];
  if (Math.abs(b.x - a.x) < 1e-6) return [{ x: a.x, z: (a.z + b.z) / 2, l: ep, p: Math.max(ep, Math.abs(b.z - a.z)) }];
  const longueur = Math.hypot(b.x - a.x, b.z - a.z);
  const n = Math.max(1, Math.ceil(longueur / ep));
  const cote = ep;
  const res: Boite[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    res.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, l: cote, p: cote });
  }
  return res;
}

/** Les boîtes d'un segment ; les obstacles bas (falaise, bord de l'eau, mobilier, coque) sont déclarés tels (murs.ts). */
function boitesDuSegment(s: SegmentModele): Boite[] {
  const boites = boitesBrutes(s);
  if (!arreteLesCoupsPhare(s.nature)) declarerObstaclesBas(boites);
  return boites;
}

/**
 * La coque de l'épave, vue d'en haut (repère du modèle) : le pont du cargo. Le bord de l'eau du modèle passe dessous ;
 * quand l'épave est là, il ne compte plus à l'intérieur (on marche sur le pont, pas dans l'eau).
 */
const COQUE: readonly (readonly [number, number])[] = (() => {
  const points: [number, number][] = [];
  for (const s of SEGMENTS_EPAVE) {
    if (!s.nature.startsWith("coque") && !s.nature.startsWith("la cassure")) continue;
    points.push([s.x1, s.z1], [s.x2, s.z2]);
  }
  const cx = points.reduce((t, p) => t + p[0], 0) / points.length;
  const cz = points.reduce((t, p) => t + p[1], 0) / points.length;
  return points.sort((p, q) => Math.atan2(p[1] - cz, p[0] - cx) - Math.atan2(q[1] - cz, q[0] - cx));
})();

/** Ce point du modèle est-il sur le pont de l'épave (dans la coque) ? */
export function dansLaCoque(x: number, z: number): boolean {
  let dedans = false;
  for (let i = 0, j = COQUE.length - 1; i < COQUE.length; j = i++) {
    const [xi, zi] = COQUE[i]!;
    const [xj, zj] = COQUE[j]!;
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) dedans = !dedans;
  }
  return dedans;
}

/** Le bord de l'eau qui passe sous la coque : il s'efface quand l'épave est là. */
const SOUS_LA_COQUE = (s: SegmentModele) => (s.nature.startsWith("la mer") || s.nature.startsWith("rochers")) && dansLaCoque((s.x1 + s.x2) / 2, (s.z1 + s.z2) / 2);

/**
 * Le tronçon effondré de la rampe du canot (P8, `sensUnique` « rampe_canot ») : un trou de 0,85 m dans la rampe, entre la
 * partie haute (z 18,95, y − 5,15) et la partie basse affaissée (z 19,8, y − 6,65). En 2D, un obstacle qui barre la rampe :
 * personne ne le franchit à pied, ni joueur ni Éteint ; on le saute d'en haut (SAUT_RAMPE), on ne le remonte jamais.
 */
const TROU_RAMPE: Boite = { ...jeu(-24, 19.375), l: 3.2, p: 0.85 };
declarerObstaclesBas([TROU_RAMPE]);

/**
 * Les deux bords de la rampe (le vide, les chevalets), retouchés pour qu'on y passe à pied (T4, 1,2 m au moins) : ils
 * commencent 0,6 m après le seuil du hangar (la poupe du canot, sur son ber, n'y laissait que 0,8 m), et s'arrêtent à
 * z 21 : on descend du bas de la rampe sur les galets, d'un côté ou de l'autre (le bord de l'eau, à z 22,6, ne laissait
 * que 0,6 m sous le bout des garde-fous). Le client pose le personnage sur la rampe ou sur la grève (hauteurSol).
 */
const BORD_RAMPE = "bord de la rampe du canot (le vide, les chevalets)";
const BORDS_RAMPE: SegmentModele[] = [-25.5, -22.5].map((x) => ({ x1: x, z1: 12.6, x2: x, z2: 21, nature: BORD_RAMPE }));
/**
 * Le canot, sur son ber, dans le hangar : ses flancs s'arrêtent 0,6 m avant sa poupe dessinée, pour qu'on passe entre la
 * poupe et la grande porte (1,4 m, au lieu de 0,8) vers la rampe.
 */
const CANOT = (s: SegmentModele): SegmentModele => (s.nature === "canot" ? { ...s, z2: Math.min(s.z2, 10.6) } : s);

const FIXES = [...SEGMENTS_MODELE.filter((s) => !SOUS_LA_COQUE(s) && s.nature !== BORD_RAMPE).map(CANOT), ...BORDS_RAMPE].flatMap(boitesDuSegment);
FIXES.push(TROU_RAMPE);
const SOUS_COQUE = SEGMENTS_MODELE.filter(SOUS_LA_COQUE).flatMap(boitesDuSegment);
const EPAVE = SEGMENTS_EPAVE.flatMap(boitesDuSegment);
const zones = new Map<string, Zone>();

/** L'état du phare qui change sa zone (S-02, comme les portes du Moulin) : l'épave échouée (true) ou la crique vide. */
export function portesInitialesPhare(): Record<string, boolean> {
  return { epave: false };
}

/**
 * Le phare selon son état : la crique vide (le bord de l'eau du modèle), ou l'épave échouée (la coque, l'échelle de
 * coupée, les conteneurs : `obstaclesEpave`). La grille est gardée par état.
 */
export function zonePhare(portes: Readonly<Record<string, boolean>>): Zone {
  const epave = portes.epave === true;
  const cle = epave ? "epave" : "crique";
  let z = zones.get(cle);
  if (!z) {
    const obstacles = epave ? [...FIXES, ...EPAVE] : [...FIXES, ...SOUS_COQUE];
    z = { xMin: 0.5, xMax: PHARE.largeur - 0.5, zMin: 0.5, zMax: PHARE.profondeur - 0.5, obstacles, grille: creerGrille(obstacles) };
    zones.set(cle, z);
  }
  return z;
}

/** Le phare tel qu'on le trouve : la crique vide. */
export const ZONE_PHARE: Zone = zonePhare(portesInitialesPhare());

// ---------- Les sorties ----------

/** La grille du nord, sur la route d'accès (FICHE.entrees[1] : x − 1,5, z − 16 dans le repère du modèle). */
const GRILLE_NORD = jeu(-1.5, -16);
/** La grève de la crique, à l'ouest (FICHE.entrees, y ≈ − 8,8) : entre le pied de la falaise et l'eau. */
const GREVE_OUEST = jeu(-28.6, 16.8);

/**
 * On arrive toujours par la route d'accès, au nord (la première sortie). La grève de la crique, à l'ouest, est une
 * sortie sans arrivée : on repart par là vers la corniche, on n'y entre jamais (comme le halage du Moulin).
 */
export const SORTIES_PHARE: Sortie[] = [
  {
    vers: "corniche",
    boite: { x: GRILLE_NORD.x, z: 1.5, l: 6, p: 3 },
    arrivee: { x: GRILLE_NORD.x, z: 4, o: 0 },
    libelle: "Reprendre la route de la corniche",
  },
  {
    vers: "corniche",
    boite: { x: 1.4, z: GREVE_OUEST.z, l: 2.8, p: 3 },
    arrivee: { x: GREVE_OUEST.x, z: GREVE_OUEST.z, o: -Math.PI / 2 },
    libelle: "Longer la grève vers la corniche",
    sansArrivee: true,
    examen: "Les galets de la crique filent vers l'ouest, au pied de la falaise, jusqu'à la route de la corniche. On repart par là ; on n'y revient pas.",
  },
];

// ---------- Les pièces et les portes (la vue par pièce, le son, l'obscurité) ----------

/**
 * Les pièces du modèle (FICHE.pieces), dans le repère du jeu. Les conteneurs de l'épave n'y sont pas : ce sont des caisses
 * ouvertes sur la grève, qui n'existent qu'après l'échouage (la vue et le son y passent comme dehors).
 */
export const PIECES_PHARE: Readonly<Record<string, { nom: string; sombre: boolean; boites: readonly Boite[] }>> = Object.fromEntries([
  ["dehors", { nom: "le cap", sombre: false, boites: [] }],
  ...Object.entries(PIECES_MODELE)
    .filter(([, p]) => !p.apresEpave)
    .map(([id, p]) => [id, { nom: p.nom, sombre: p.sombre, boites: p.boites.map((b) => ({ ...b, ...jeu(b.x, b.z) })) }]),
]);

const ORDRE_PIECES = Object.keys(PIECES_PHARE).filter((p) => p !== "dehors");

/** La pièce d'un point du jeu (sinon : dehors). */
export function piecePhare(x: number, z: number): string {
  for (const id of ORDRE_PIECES) if (PIECES_PHARE[id]!.boites.some((b) => Math.abs(x - b.x) <= b.l / 2 && Math.abs(z - b.z) <= b.p / 2)) return id;
  return "dehors";
}

/** Fait-il noir ici, même de jour ? (le pied de la tour, la salle des machines, le hangar) */
export function sombrePhare(x: number, z: number): boolean {
  return PIECES_PHARE[piecePhare(x, z)]!.sombre;
}

/** Une porte du phare (repère du jeu) : toutes ont perdu leur battant, ou sont restées ouvertes. */
export interface PorteDuPhare {
  id: string;
  x: number;
  z: number;
  largeur: number;
  sens: "x" | "z";
  entre: [string, string];
}

export const PORTES_PHARE: readonly PorteDuPhare[] = PORTES_MODELE.filter((p) => !p.apresEpave).map((p) => ({
  id: p.id,
  ...jeu(p.x, p.z),
  largeur: p.largeur,
  sens: p.axe === "z" ? "z" : "x",
  entre: [p.entre[0]!, p.entre[1]!],
}));

/**
 * Les murs qui arrêtent la vue (repère du jeu) : ceux des pièces (la tour, les maisons, le hangar, la salle de la corne,
 * l'abri), et leurs cloisons. Le muret de l'enceinte (1,15 m, noté « mur » lui aussi) ne cache rien : on voit par-dessus.
 */
export function mursVuePhare(): Boite[] {
  const pieces = Object.values(PIECES_MODELE).filter((p) => !p.apresEpave).flatMap((p) => p.boites);
  const contre = (x: number, z: number) => pieces.some((b) => Math.abs(x - b.x) <= b.l / 2 + 0.6 && Math.abs(z - b.z) <= b.p / 2 + 0.6);
  return SEGMENTS_MODELE.filter((s) => (s.nature === "mur" || s.nature === "cloison") && contre((s.x1 + s.x2) / 2, (s.z1 + s.z2) / 2)).flatMap(boitesBrutes);
}

// ---------- Les endroits du scénario (repère du jeu) ----------

const place = (id: keyof typeof PLACES_OBJETS) => jeu(PLACES_OBJETS[id].x, PLACES_OBJETS[id].z);

/** Où l'on touche ce qui fait le scénario, et d'où part la corne. */
export const ENDROITS_PHARE = {
  /** La marque à la craie, sous la première marche de l'escalier coupé : on y pose l'escabeau, on monte de là. */
  marque: jeu(ESCABEAU_MODELE.marque.x, ESCABEAU_MODELE.marque.z),
  /** L'escabeau du gardien, contre le mur du hangar, au départ. */
  hangar: place("escabeau_phare"),
  /** La cuve à pompe et son bidon, au pied de la tour. */
  cuve: place("bidon_petrole"),
  /** Le prisme tombé de la lentille, dans l'herbe au pied de la tour. */
  prisme: place("prisme_tombe"),
  /** Le compresseur de la corne : on le répare, puis on y sonne. */
  compresseur: jeu(17.4, 7.8),
  /** Les deux pavillons de la corne, tournés vers le large, au bord de la falaise : c'est de là que part le bruit. */
  pavillons: jeu(18.5, 15.2),
  /** Le haut du tronçon effondré de la rampe (`sensUnique.de`), et où l'on retombe (`sensUnique.vers`). */
  sautDe: jeu(SENS_UNIQUE_MODELE[0].de.x, SENS_UNIQUE_MODELE[0].de.z),
  sautVers: jeu(SENS_UNIQUE_MODELE[0].vers.x, SENS_UNIQUE_MODELE[0].vers.z),
  /** Devant la porte de la tour (dehors) : la lumière de la lanterne y descend, pour les Éteints du chemin. */
  lumiere: jeu(-10, -0.6),
} as const;

/** On touche la marque, la cuve, le compresseur… jusqu'à cette distance (comme DISTANCE_INTERACTION, un peu plus). */
export const PORTEE_PHARE = 1.8;
/** On saute de la rampe jusqu'à cette distance du haut du tronçon effondré. */
export const PORTEE_SAUT = 1.6;
/** L'escabeau posé à moins de cette distance de la marque est « sous l'escalier ». */
export const RAYON_MARQUE = 1.2;

// ---------- Les règles du « feu et du cargo » (S-12 à S-18) ----------

/** Les gestes (secondes réelles) : remplir le bidon (S-13 : 5 s), monter les 31 m de marches, sauter. */
export const DUREES_PHARE = { cuve: 5, prisme: 1, verser: 6, remettre: 6, allumer: 4 } as const;

/**
 * Le cargo s'échoue 50 s réelles après l'allumage (S-17 ; réglage du porteur, 2026-10-15 : deux minutes, c'était trop
 * long pour qui a déjà fouillé tout le lieu). Le seul endroit où ce délai est écrit : le client (sa corne, ses feux, le
 * cadrage de la crique) et le simulateur de rythme en partent.
 */
export const CARGO_MS = 50_000;

/**
 * La lanterne allumée, la nuit : une lumière qui réveille les dormeurs du chemin des douaniers et les fait monter (S-15).
 * Elle descend devant la porte de la tour ; à 45 m, les plus loin se lèvent en quelques secondes.
 */
export const LUMIERE_LANTERNE = { portee: 45, intensite: 0.5 } as const;

/** La corne de brume (S-16) : un bruit fort au bord de la falaise, 60 s, une fois par nuit ; plus fort que la lanterne. */
export const CORNE = { portee: 60, intensite: 1.3, dureeS: 60 } as const;

/** Les heures de la nuit (S-14 : 21 h – 5 h 30), reprises de temps.ts pour le numéro de la nuit. */
const TOMBEE = 21;
const MS_HEURE = 60_000;
const HEURE_DEPART = 6;

/**
 * Le numéro de la nuit (une nuit va de 21 h à 21 h le lendemain : la corne ne sonne qu'une fois entre deux tombées de
 * la nuit). `instant`, `debutMonde` : ms réelles ; une heure de jeu dure une minute réelle (temps.ts).
 */
export function nuitDe(instant: number, debutMonde: number): number {
  const heures = (instant - debutMonde) / MS_HEURE + HEURE_DEPART;
  return Math.floor((heures + (24 - TOMBEE)) / 24);
}

/** Où est l'escabeau du gardien : au hangar, dans les bras, sous l'escalier (à la marque), ou posé ailleurs (jeu). */
export type PlaceEscabeau = "hangar" | "bras" | "marque" | { x: number; z: number };

/** Ce que le phare garde de plus que ses portes (LieuxPersonnels, `propre`), vidé au retour à 24 h. */
export interface EtatPhare {
  escabeau: PlaceEscabeau;
  /** Le bidon : à côté de la cuve, plein (dans les mains), versé dans la lanterne. */
  bidon: "cuve" | "plein" | "verse";
  /** Le prisme : tombé au pied de la tour, dans les mains, remis dans la lentille. */
  prisme: "tombe" | "main" | "remis";
  /** L'instant réel (ms) où l'on a allumé la lanterne (null : éteinte). */
  allumeLe: number | null;
  /** Le compresseur de la corne est réparé. */
  compresseur: boolean;
  /** La nuit (nuitDe) où la corne a sonné, pour la dernière fois. */
  corneNuit: number | null;
}

/** Le phare tel qu'on le trouve (et au retour à 24 h). */
export function etatPhareNeuf(): EtatPhare {
  return { escabeau: "hangar", bidon: "cuve", prisme: "tombe", allumeLe: null, compresseur: false, corneNuit: null };
}

/**
 * L'état du phare relu de ce qu'on a gardé (`propre` : vide à la première visite et après le retour à 24 h ; une partie
 * plus ancienne n'a rien gardé ici) : chaque champ inconnu ou abîmé prend sa valeur de départ.
 */
export function lireEtatPhare(brut: Readonly<Record<string, unknown>>): EtatPhare {
  const neuf = etatPhareNeuf();
  const e = brut.escabeau;
  const escabeau: PlaceEscabeau =
    e === "hangar" || e === "bras" || e === "marque"
      ? e
      : typeof e === "object" && e !== null && Number.isFinite((e as { x?: unknown }).x) && Number.isFinite((e as { z?: unknown }).z)
        ? { x: (e as { x: number }).x, z: (e as { z: number }).z }
        : neuf.escabeau;
  return {
    escabeau,
    bidon: brut.bidon === "plein" || brut.bidon === "verse" ? brut.bidon : neuf.bidon,
    prisme: brut.prisme === "main" || brut.prisme === "remis" ? brut.prisme : neuf.prisme,
    allumeLe: typeof brut.allumeLe === "number" && Number.isFinite(brut.allumeLe) ? brut.allumeLe : null,
    compresseur: brut.compresseur === true,
    corneNuit: typeof brut.corneNuit === "number" && Number.isFinite(brut.corneNuit) ? brut.corneNuit : null,
  };
}

/** L'escabeau est-il sous l'escalier coupé ? (posé à la marque) */
export function escabeauSousLEscalier(e: PlaceEscabeau): boolean {
  return e === "marque";
}

/** Ce que le client sait du phare (le message `phare`), pour montrer le décor et proposer les gestes. */
export interface EtatPhareVu {
  escabeau: PlaceEscabeau;
  bidon: EtatPhare["bidon"];
  prisme: EtatPhare["prisme"];
  lanterne: boolean;
  compresseur: boolean;
  /** La corne a déjà sonné cette nuit. */
  corneSonnee: boolean;
  /**
   * Dans combien de ms le cargo s'échoue (la lanterne allumée, l'épave pas encore là) : le client en tire ses feux qui
   * approchent, la corne grave au large et le cadrage de la crique (K2). Absent sinon (une partie plus ancienne aussi).
   */
  cargoDans?: number;
}

/** Les gestes du phare (`interagir`, cible `{ genre: "phare", id }`) : en plus de porter, remplir, ramasser, allumer. */
export type VerbePhare = "poser" | "remettre" | "sonner_corne" | "sauter";

/** Ce qu'on touche au phare (la cible d'un geste). */
export type ElementPhare = "escabeau" | "escalier" | "cuve" | "prisme" | "corne" | "rampe";

/** Les textes courts du phare (S-14 et la suite) ; jamais « clé ». */
export const TEXTES_PHARE = {
  jour: "Le feu ne sert qu'à la nuit tombée.",
  escabeauPris: "Tu prends l'escabeau dans les bras. On marche, on ne court pas.",
  escabeauPose: "L'escabeau est calé sous l'escalier coupé : on peut monter.",
  escabeauLache: "Tu poses l'escabeau.",
  bidon: "Tu remplis le bidon de pétrole à la pompe de la cuve.",
  prisme: "Tu ramasses le prisme. Il manque à la lentille, tout en haut.",
  verse: "Trente et un mètres de marches. Tu verses le pétrole dans la lanterne.",
  remis: "Trente et un mètres de marches. Le prisme reprend sa place dans la lentille.",
  allume: "La mèche prend. Le faisceau balaie le cap… et le chemin des douaniers se réveille.",
  dejaAllume: "La lanterne brûle déjà.",
  manque: "La lanterne n'a ni pétrole ni prisme : il faut monter les deux.",
  manquePetrole: "La lanterne est sèche : il faut y monter du pétrole.",
  manquePrisme: "Il manque un prisme à la lentille : le feu ne porterait pas.",
  corne: "La corne de brume mugit vers le large : tout le cap l'entend.",
  corneSonnee: "Le réservoir d'air est vide : la corne a déjà sonné cette nuit.",
  sauter: "Tu sautes sur la partie basse de la rampe. Par là, on ne remonte pas.",
} as const;
