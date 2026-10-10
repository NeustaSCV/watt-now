// Contenu du terrain de départ (Book 21 §3.2 : une seule topologie en 0a — prairie, bois mort, une mare).
// La génération est déterministe : le même terrain pour un même compte.

import type { Inventaire } from "./objets.ts";
import type { Qualite } from "./recettes.ts";
import { TERRAIN_TAILLE, type Famille } from "./regles.ts";
import { MS_JOUR_CALENDRIER } from "./energie.ts";

export type TypeRessource =
  | "branche"
  | "buche"
  | "pierre"
  | "buisson"
  // Joncs et massettes au bord de la mare : des fibres pour tresser une corde.
  | "joncs"
  // Arbres fruitiers (2026-10-08) : on y cueille avec un escabeau posé à leur pied.
  | "pommier"
  | "poirier"
  | "prunier"
  | "cerisier"
  | "noyer"
  // Champignons, sous les arbres : le cèpe se mange, les amanites non.
  | "cepe"
  | "amanite_tue_mouches"
  | "amanite_phalloide"
  // Les essences du métier (Book 25 §3.2) : deux frênes à la lisière, et un if au fond du bois, que seuls les
  // Mécanistes repèrent (ils reconnaissent le bois par essence, Book 03 §5.3).
  | "frene"
  | "if_bois"
  // Vestiges de la ruine de ferme (Book 21 §3.2) : ils ne repoussent pas.
  | "velo"
  | "caisse_outils"
  | "batterie_voiture"
  | "ressort"
  | "bache"
  | "barre_metal"
  // Vestiges de la station-service (É3) : modestes, ils reviennent lentement (Book 01 §2 bis).
  | "rayonnage"
  | "panneau_auvent"
  | "epave_voiture"
  | "epave_camion"
  | "caisse_atelier"
  | "grenier"
  // Butin de la Coopérative du Plateau (Book 23 §2.2) : du commun dehors, du rare au fond.
  | "coop_caisse"
  | "coop_rayon"
  | "coop_palettes"
  | "coop_etabli"
  | "coop_rayonnage"
  | "coop_coffre"
  | "coop_caisse_froide"
  | "coop_masse"
  // La batterie du tracteur rouge (Book 23 §4.7) : la prendre, c'est faire taire le klaxon.
  | "coop_batterie"
  // La haie d'ifs taillés en boules, devant les bureaux de la Coopérative (Book 25 §3.2) : un bâton d'if par visite.
  | "coop_ifs"
  | TypeRessourceNiveau1;

/**
 * Les ressources du niveau 1 (plan 0.8, chantier 3) : déclarées d'avance, pour que les chantiers des lieux n'aient qu'à
 * les poser et à leur donner leur usage (USAGES_NIVEAU1, plus bas). Les joncs du gué sont les `joncs` de la mare : ils
 * se coupent et repoussent pareil (B7). Les 15 pierres en vrac du gué et les bûches de la station sont des `pierre`
 * et des `buche`.
 */
export type TypeRessourceNiveau1 =
  // La maison (chantier 10) : le bidon de 5 L, dans la ruine (plan 0.8 §2.5).
  | "ruine_bidon"
  // H1A, la station (chantier 10) : la pièce de famille, une par joueur (⚡ le panneau est `panneau_auvent`) ; le tas
  // de bois de chauffage personnel derrière l'atelier (B3).
  | "piece_enclume"
  | "piece_alternateur"
  | "tas_bois"
  // L1A, la Coopérative (chantier 10) : les clés à place fixe ; les seaux sont dans `coop_caisse_froide` (la laiterie).
  | "coop_grillage"
  | "coop_cocotte"
  // H1B, le gué (chantier 11) : le gisement de glaise de la berge (B6), le banc de galets personnel (B5).
  | "gisement_glaise"
  | "banc_galets"
  // H1B, les fouilles du gué (chantier 11) : « par chance », une bâche, des chiffons, une casserole, des cordes
  // (commun/src/gue.ts, FOUILLES_GUE), et rarement une clé de L1.
  | "gue_cabane"
  | "gue_buvette"
  | "gue_barques"
  | "gue_camping_car"
  | "gue_lavoir"
  | "gue_garde_peche"
  // L1B, le Moulin (chantier 12) : les clés du magasin et des meules, la fourche de l'étable, l'if du bief, les poutres
  // de rechange (B11), la grosse clé au tableau de l'atelier (§10.1).
  | "moulin_jute"
  | "moulin_feuillards"
  | "moulin_etau"
  | "moulin_fourche"
  | "if_bief"
  | "poutres_chene"
  | "moulin_cle";

/** L'emprise au sol de ce qu'on vise (m) : le cercle de visée s'y ajuste (P-007). 0,5 m par défaut. */
export const EMPRISE_RESSOURCE: Partial<Record<TypeRessource, number>> = {
  buisson: 0.8,
  joncs: 0.9,
  pommier: 1.1,
  poirier: 1.1,
  prunier: 1.0,
  cerisier: 1.1,
  noyer: 1.3,
  cepe: 0.35,
  amanite_tue_mouches: 0.35,
  amanite_phalloide: 0.35,
  velo: 1.0,
  caisse_outils: 0.6,
  batterie_voiture: 0.5,
  ressort: 0.7,
  bache: 0.6,
  barre_metal: 0.7,
  rayonnage: 1.2,
  panneau_auvent: 0.8,
  epave_voiture: 2.4,
  epave_camion: 3.4,
  caisse_atelier: 1.0,
  grenier: 2.5,
  coop_batterie: 0.4,
  frene: 0.9,
  if_bois: 1.1,
  coop_ifs: 1.2,
  ruine_bidon: 0.35,
  piece_enclume: 0.6,
  piece_alternateur: 0.45,
  tas_bois: 1.1,
  coop_grillage: 0.7,
  coop_cocotte: 0.4,
  // Le gué (chantier 11) : la berge de glaise, le banc de galets, les barques retournées.
  gisement_glaise: 0.8,
  banc_galets: 0.9,
  gue_barques: 1.2,
};

export interface RessourceSol {
  id: number;
  type: TypeRessource;
  x: number;
  z: number;
  /** Faux tant que la ressource n'a pas repoussé (bois mort, baies). */
  disponible: boolean;
  /** Un butin personnel à plusieurs prises (le tas de bois de la station) : ce qu'il en reste pour ce joueur (0.8). */
  reste?: number;
}

/** La mare du terrain : de l'eau brute, à faire bouillir (Book 14 §4.2, étape 4). `rayon` : son rayon moyen. */
export const MARE = { x: 38, z: 33, rayon: 2.6 } as const;

/**
 * Le bord de la mare n'est pas un cercle (2026-10-08) : une anse, une avancée, des creux, comme une vraie mare de prairie.
 * Rayon du bord dans la direction `angle` (point = centre + (cos angle, sin angle) × rayon).
 */
export function rayonMare(angle: number): number {
  return MARE.rayon * (1 + 0.22 * Math.sin(2 * angle + 0.7) + 0.1 * Math.sin(3 * angle + 2.1) + 0.06 * Math.sin(5 * angle + 0.4));
}

/** Distance au bord de la mare : négative dans l'eau. */
export function distanceMare(x: number, z: number): number {
  return Math.hypot(x - MARE.x, z - MARE.z) - rayonMare(Math.atan2(z - MARE.z, x - MARE.x));
}

/** Distance maximale pour interagir avec un objet, en mètres. */
export const DISTANCE_INTERACTION = 2;

/**
 * Délai réel avant qu'une ressource ramassée réapparaisse, en millisecondes (null : ne revient pas). C'est le délai du
 * terrain, et celui de partout où un lieu ne dit pas autre chose (ButinLieu.repousse, plan 0.8 B4) : au terrain, les
 * bûches et les pierres ne reviennent jamais (B1) ; dans les haltes, elles reviennent en 30 min.
 */
export const REPOUSSE_MS: Record<TypeRessource, number | null> = {
  branche: 40 * 60_000,
  buche: null,
  pierre: null,
  buisson: 20 * 60_000,
  joncs: 30 * 60_000,
  // Un arbre cueilli se recharge (en 0a, sans calendrier des récoltes : à caler avec les saisons, Book 13).
  pommier: 60 * 60_000,
  poirier: 60 * 60_000,
  prunier: 60 * 60_000,
  cerisier: 60 * 60_000,
  noyer: 90 * 60_000,
  cepe: 45 * 60_000,
  amanite_tue_mouches: 45 * 60_000,
  amanite_phalloide: 45 * 60_000,
  velo: null,
  caisse_outils: null,
  batterie_voiture: null,
  ressort: null,
  bache: null,
  barre_metal: null,
  rayonnage: 8 * 3_600_000,
  panneau_auvent: 24 * 3_600_000,
  epave_voiture: 12 * 3_600_000,
  epave_camion: 12 * 3_600_000,
  caisse_atelier: 12 * 3_600_000,
  grenier: 12 * 3_600_000,
  // Le commun revient en quelques heures ; le rare, en plusieurs jours (Book 23 §2.3) ; le pied-de-biche, une fois.
  coop_caisse: null,
  coop_rayon: 6 * 3_600_000,
  coop_palettes: 6 * 3_600_000,
  coop_etabli: 12 * 3_600_000,
  coop_rayonnage: 8 * 3_600_000,
  // Plan 0.8 (§9.1, N1) : à la Coopérative, tout revient à 24 h (serveur/src/cooperative.ts la réinitialise), le
  // coffre du directeur, la laiterie et la batterie du tracteur aussi ; le klaxon revit avec elle.
  coop_coffre: 24 * 3_600_000,
  coop_caisse_froide: 24 * 3_600_000,
  coop_masse: 24 * 3_600_000,
  coop_batterie: 24 * 3_600_000,
  // Le frêne : une perche en 6 h réelles, même hors ligne (Book 25 §3.2). L'if du fond du bois : un bâton par jour de
  // calendrier (≈ 1 h 50 réelles) ; la haie de la Coopérative, un par visite (elle repousse en 12 h).
  frene: 6 * 3_600_000,
  if_bois: MS_JOUR_CALENDRIER,
  coop_ifs: 12 * 3_600_000,
  // Le niveau 1 (plan 0.8, chantier 3) : les délais décidés. La pièce de famille revient pour son joueur en 24 h
  // (Q-0.8-14) ; le tas de bois et le banc de galets en 6 h (B3, B5) ; le gisement de glaise ne s'épuise pas (B6) ; à
  // la Coopérative et au Moulin, tout revient en 24 h (§9.1, N1), sauf la fourche : une fois par personnage. Le bidon
  // de la ruine, comme les autres vestiges du terrain, une fois.
  ruine_bidon: null,
  piece_enclume: 24 * 3_600_000,
  piece_alternateur: 24 * 3_600_000,
  tas_bois: 6 * 3_600_000,
  coop_grillage: 24 * 3_600_000,
  coop_cocotte: 24 * 3_600_000,
  gisement_glaise: 0,
  banc_galets: 6 * 3_600_000,
  moulin_jute: 24 * 3_600_000,
  moulin_feuillards: 24 * 3_600_000,
  moulin_etau: 24 * 3_600_000,
  moulin_fourche: null,
  if_bief: 24 * 3_600_000,
  poutres_chene: 24 * 3_600_000,
  moulin_cle: 24 * 3_600_000,
  // Les fouilles du gué (chantier 11) : comme celles de la station, elles reviennent en 12 h.
  gue_cabane: 12 * 3_600_000,
  gue_buvette: 12 * 3_600_000,
  gue_barques: 12 * 3_600_000,
  gue_camping_car: 12 * 3_600_000,
  gue_lavoir: 12 * 3_600_000,
  gue_garde_peche: 12 * 3_600_000,
};

/** Les ressources qui restent en place une fois fouillées (une épave ne disparaît pas). */
export const RESTE_EN_PLACE: Partial<Record<TypeRessource, true>> = {
  buisson: true,
  joncs: true,
  pommier: true,
  poirier: true,
  prunier: true,
  cerisier: true,
  noyer: true,
  rayonnage: true,
  epave_voiture: true,
  epave_camion: true,
  grenier: true,
  coop_caisse: true,
  coop_rayon: true,
  coop_palettes: true,
  coop_etabli: true,
  coop_rayonnage: true,
  coop_coffre: true,
  coop_caisse_froide: true,
  coop_masse: true,
  frene: true,
  if_bois: true,
  coop_ifs: true,
  // Le tas de bois de la station reste là, plus bas à chaque bûche (rendu/ressources.ts).
  tas_bois: true,
  // La tête de gondole de la cocotte reste, vide, sa pancarte de promotion encore plantée.
  coop_cocotte: true,
  // Le gué (chantier 11) : la berge de glaise ne s'épuise pas ; le banc de galets et les fouilles restent là.
  gisement_glaise: true,
  banc_galets: true,
  gue_cabane: true,
  gue_buvette: true,
  gue_barques: true,
  gue_camping_car: true,
  gue_lavoir: true,
  gue_garde_peche: true,
};

// ---------- Le butin d'un lieu vivant (plan 0.8, chantier 10 ; le moteur est serveur/src/lieu-vivant.ts) ----------

/**
 * Ce qu'un lieu vivant fait de ses ressources, en plus de REPOUSSE_MS : sa repousse à lui (B4), son butin personnel
 * (R4 du game designer, B3, B5) et son vrac qui grandit avec les voyageurs (B8). Un lieu sans `butin` se comporte comme
 * avant la 0.8 : tout est partagé, au délai de REPOUSSE_MS.
 */
export interface ButinLieu {
  /** Les délais du lieu (ms ; null : jamais), à la place de REPOUSSE_MS pour ces types (B4 : 30 min dans les haltes). */
  repousse?: Partial<Record<TypeRessource, number | null>>;
  /**
   * Le butin personnel : chacun voit le sien et le prend pour lui ; il revient pour lui à son délai, sans rien changer
   * pour les autres. La valeur dit combien de prises il tient (1 : une pièce de famille ; 10 : le tas de bois, une
   * bûche par prise). Le délai court à partir de la première prise ; au bout, tout est de nouveau là.
   */
  personnel?: Partial<Record<TypeRessource, number>>;
  /**
   * Le vrac qui grandit avec les voyageurs (B8) : pour ces types, combien de points sont en jeu pour un voyageur seul.
   * Le lieu en pose VRAC_MAX fois plus ; facteurVrac() dit combien sont en jeu selon le nombre de présents.
   */
  vrac?: Partial<Record<TypeRessource, number>>;
}

/** Le vrac ne dépasse jamais trois fois sa quantité de base (B8). */
export const VRAC_MAX = 3;

/** +50 % par voyageur présent en plus du premier, jusqu'à ×3 (B8) : 1 → ×1, 3 → ×2, 5 et plus → ×3. */
export function facteurVrac(voyageurs: number): number {
  return Math.min(VRAC_MAX, 1 + 0.5 * Math.max(0, voyageurs - 1));
}

/** Combien de points d'un vrac de base `base` sont en jeu avec ce nombre de voyageurs. */
export function vracEnJeu(base: number, voyageurs: number): number {
  return Math.round(base * facteurVrac(voyageurs));
}

/**
 * Les pièces de famille (plan 0.8 §2.5) : seule leur famille les voit. Le panneau du Voltaïque (déjà à la station),
 * l'enclume et le sac de charbon du Charbonnier, le petit alternateur du Mécaniste.
 */
export const FAMILLE_DE_RESSOURCE: Partial<Record<TypeRessource, Famille>> = {
  panneau_auvent: "voltaiques",
  piece_enclume: "charbonniers",
  piece_alternateur: "mecanistes",
};

/** La ruine de ferme du terrain (Book 21 §3.2), dans le coin nord-est. */
export const RUINE = { x: 40.5, z: 11, largeur: 8, profondeur: 6 } as const;

export type VerbeRessource = "ramasser" | "demonter" | "fouiller";

export interface UsageRessource {
  verbe: VerbeRessource;
  libelle: string;
  donne: Inventaire;
  qualites: Partial<Record<Qualite, number>>;
  /** Durée réelle, en secondes. */
  duree: number;
  /** Ce que dit l'examen (bouton B). */
  examen: string;
  /** Il faut un escabeau posé au pied (dans le disque de l'arbre). */
  escabeau?: true;
}

/** Les arbres fruitiers : on y monte avec l'escabeau. */
export const ARBRES_FRUITIERS: readonly TypeRessource[] = ["pommier", "poirier", "prunier", "cerisier", "noyer"];
export function estFruitier(type: TypeRessource): boolean {
  return ARBRES_FRUITIERS.includes(type);
}
/** Les arbres (fruitiers et essences du métier) : larges, on les touche d'un peu plus loin (PORTEE_ARBRE). */
export function estArbre(type: TypeRessource): boolean {
  return estFruitier(type) || type === "frene" || type === "if_bois" || type === "coop_ifs";
}
/**
 * Ce qu'une famille voit (Book 25 §3.2) : l'if du fond du bois ne se repère que si l'on reconnaît le bois par essence,
 * comme les Mécanistes (Book 03 §5.3). Pour les autres, c'est un arbre sombre du décor de la lisière. Une pièce de famille
 * (FAMILLE_DE_RESSOURCE, 0.8) ne se voit que de sa famille.
 */
export function ressourceVisible(type: TypeRessource, famille: Famille): boolean {
  if (type === "if_bois") return famille === "mecanistes";
  const de = FAMILLE_DE_RESSOURCE[type];
  return de === undefined || de === famille;
}
/** L'escabeau sert s'il est posé dans ce disque autour du tronc (m). */
export const RAYON_ESCABEAU = 2.4;
/** Un arbre est large : on le touche d'un peu plus loin que le reste. */
export const PORTEE_ARBRE = 0.8;
/** Les arbres isolés du terrain (décor, sans fruits) : les champignons poussent dessous. */
export const ARBRES_ISOLES: readonly (readonly [number, number])[] = [[6, 8], [47.5, 3], [7, 43], [41, 40], [12, 30]];

/** Ce qu'on fait de chaque ressource du sol, et ce qu'elle donne (Book 02 §5). */
const USAGES_ETABLIS: Record<Exclude<TypeRessource, TypeRessourceNiveau1>, UsageRessource> = {
  branche: { verbe: "ramasser", libelle: "Ramasser la branche", donne: { branche: 1 }, qualites: {}, duree: 1.2, examen: "Du bois mort, bien sec." },
  buche: { verbe: "ramasser", libelle: "Ramasser la bûche", donne: { buche: 1 }, qualites: {}, duree: 2.5, examen: "Une bûche tombée d'un vieux tas. Sèche." },
  pierre: { verbe: "ramasser", libelle: "Ramasser la pierre", donne: { pierre: 1 }, qualites: {}, duree: 1.8, examen: "Une pierre plate, bonne pour un cercle de feu." },
  buisson: { verbe: "ramasser", libelle: "Cueillir des baies", donne: { baies: 1 }, qualites: {}, duree: 2.5, examen: "Des baies sauvages. Elles repoussent." },
  joncs: {
    verbe: "ramasser",
    libelle: "Couper des joncs",
    donne: { fibres: 2 },
    qualites: { couper: 1 },
    duree: 3,
    examen: "Des joncs et des massettes, au bord de l'eau. Leurs feuilles se tordent et se tressent en corde. Ils repoussent.",
  },
  pommier: {
    verbe: "ramasser",
    libelle: "Cueillir des pommes",
    donne: { pomme: 4 },
    qualites: {},
    duree: 4,
    escabeau: true,
    examen: "Un vieux pommier, chargé de pommes. Les plus belles sont en haut : il faut un escabeau.",
  },
  poirier: {
    verbe: "ramasser",
    libelle: "Cueillir des poires",
    donne: { poire: 3 },
    qualites: {},
    duree: 4,
    escabeau: true,
    examen: "Un poirier haut et droit. Les poires pendent hors de portée : il faut un escabeau.",
  },
  prunier: {
    verbe: "ramasser",
    libelle: "Cueillir des prunes",
    donne: { prunes: 2 },
    qualites: {},
    duree: 4,
    escabeau: true,
    examen: "Un prunier aux fruits violets, des quetsches. Il faut un escabeau pour les atteindre.",
  },
  cerisier: {
    verbe: "ramasser",
    libelle: "Cueillir des cerises",
    donne: { cerises: 2 },
    qualites: {},
    duree: 5,
    escabeau: true,
    examen: "Un merisier aux cerises rouge sombre. Les oiseaux en ont laissé : il faut un escabeau.",
  },
  noyer: {
    verbe: "ramasser",
    libelle: "Gauler des noix",
    donne: { noix: 2 },
    qualites: {},
    duree: 5,
    escabeau: true,
    examen: "Un grand noyer. Ses noix, dans leur brou vert, se gaulent depuis un escabeau.",
  },
  cepe: {
    verbe: "ramasser",
    libelle: "Cueillir le champignon",
    donne: { cepe: 1 },
    qualites: {},
    duree: 1.5,
    examen: "Chapeau brun et bombé, pied ventru et clair, et sous le chapeau une éponge blanche, sans lames : un cèpe. Il se mange.",
  },
  amanite_tue_mouches: {
    verbe: "ramasser",
    libelle: "Cueillir le champignon",
    donne: { amanite_tue_mouches: 1 },
    qualites: {},
    duree: 1.5,
    examen: "Chapeau rouge vif semé de flocons blancs, lames blanches, un anneau au pied : une amanite tue-mouches. Toxique.",
  },
  amanite_phalloide: {
    verbe: "ramasser",
    libelle: "Cueillir le champignon",
    donne: { amanite_phalloide: 1 },
    qualites: {},
    duree: 1.5,
    examen: "Chapeau vert olive pâle, lames blanches, un anneau, et le pied pris dans un sac blanc (la volve) : une amanite phalloïde. Mortelle.",
  },
  // Les essences du métier (Book 25 §3.2) : Couper 1, le couteau du kit suffit (plan 0.8 : les outils sont des portes
  // dures, et le tableau `outils` met la perche de frêne et le bâton d'if à Couper 1).
  frene: {
    verbe: "ramasser",
    libelle: "Couper une perche de frêne",
    donne: { perche_frene: 1 },
    qualites: { couper: 1 },
    duree: 6,
    examen: "Un frêne : écorce grise et lisse, bourgeons noirs comme du velours. Ses rejets droits font de bons arcs.",
  },
  if_bois: {
    verbe: "ramasser",
    libelle: "Tailler un bâton d'if",
    donne: { baton_if: 1 },
    qualites: { couper: 1 },
    duree: 8,
    examen: "Un if, sombre et lent, au fond du bois : le meilleur bois d'arc. Toxique : on n'en mange ni baies ni aiguilles.",
  },
  coop_ifs: {
    verbe: "ramasser",
    libelle: "Tailler un bâton d'if",
    donne: { baton_if: 1 },
    qualites: { couper: 1 },
    duree: 8,
    examen: "La haie d'ifs taillés en boules : on la faisait tailler tous les mois. Une branche droite s'y cache encore.",
  },
  velo: {
    verbe: "demonter",
    libelle: "Démonter le vieux vélo",
    donne: { cadre_velo: 1, chaine_velo: 1, roue_velo: 2, dynamo_velo: 1 },
    qualites: { serrer: 1, visser: 1 },
    duree: 45,
    examen: "Un vieux vélo rouillé. Démonté, il donnerait un cadre, une chaîne, deux roues et sa dynamo. Il faut de quoi desserrer les écrous.",
  },
  caisse_outils: {
    verbe: "fouiller",
    libelle: "Fouiller la caisse à outils",
    // Plan 0.8 (I10) : la tête de marteau, à remmancher sur une branche (le marteau, Marteler 2, pour toutes les familles).
    donne: { tete_hache: 1, cle_plate: 1, tournevis: 1, tete_marteau: 1 },
    qualites: {},
    duree: 4,
    examen: "Une caisse en fer, rouillée. Quelque chose cliquette dedans, et quelque chose de lourd roule au fond.",
  },
  batterie_voiture: {
    verbe: "ramasser",
    libelle: "Prendre la batterie de voiture",
    donne: { batterie_voiture: 1 },
    qualites: {},
    duree: 3,
    examen: "Une batterie de voiture sortie d'une épave. 18 kg. Il lui reste peut-être de la charge.",
  },
  ressort: {
    verbe: "ramasser",
    libelle: "Prendre les lames de ressort",
    donne: { ressort_lames: 2 },
    qualites: {},
    duree: 2,
    examen: "Deux lames d'un ressort de camionnette. Le meilleur acier qu'on puisse trouver.",
  },
  bache: { verbe: "ramasser", libelle: "Prendre la bâche", donne: { bache: 1 }, qualites: {}, duree: 2, examen: "Une bâche bleue pliée, un peu déchirée." },
  barre_metal: { verbe: "ramasser", libelle: "Prendre la barre de métal", donne: { barre_metal: 1 }, qualites: {}, duree: 1.5, examen: "Une barre de fer rond, d'un mètre." },
  rayonnage: {
    verbe: "fouiller",
    libelle: "Fouiller le rayonnage",
    donne: { conserve: 1 },
    qualites: {},
    duree: 6,
    examen: "Des étagères renversées. « Saveur Bonheur », « Croustillant Liberté »… Il reste peut-être une boîte au fond.",
  },
  panneau_auvent: {
    verbe: "demonter",
    libelle: "Démonter le petit panneau solaire",
    donne: { panneau_solaire: 1 },
    qualites: { visser: 1 },
    duree: 25,
    examen:
      "Un petit panneau solaire tombé de l'auvent, appuyé contre un pilier. Il alimentait l'enseigne. Quatre vis le tiennent encore à son cadre : il faut de quoi visser (couteau ou tournevis).",
  },
  epave_voiture: {
    verbe: "demonter",
    libelle: "Démonter la suspension",
    donne: { ressort_lames: 1 },
    qualites: { serrer: 1 },
    duree: 30,
    examen: "Une voiture couchée sur ses jantes. Sous l'arrière, une lame de ressort encore bonne.",
  },
  epave_camion: {
    verbe: "fouiller",
    libelle: "Fouiller la benne du camion",
    donne: { bache: 1, chiffons: 2 },
    qualites: {},
    duree: 8,
    examen: "Un camion de livraison, la benne ouverte. Des sangles, des bâches déchirées.",
  },
  caisse_atelier: {
    verbe: "fouiller",
    libelle: "Fouiller l'établi de l'atelier",
    // Plan 0.8 (I1, I2) : la caisse de l'atelier garantit un bocal de clous (5 poignées), un rouleau de fil de fer et
    // un bidon d'huile ; ils reviennent avec elle.
    donne: { barre_metal: 1, bocal_clous: 1, rouleau_fil_fer: 1, bidon_huile: 1 },
    qualites: {},
    duree: 6,
    examen: "L'atelier de la station : un établi, des chutes de métal, une odeur d'huile froide. Dans la caisse, un bocal de clous, un rouleau de fil de fer, un bidon d'huile.",
  },
  grenier: {
    verbe: "fouiller",
    libelle: "Fouiller la grange effondrée",
    donne: { corde: 1, chiffons: 1 },
    qualites: {},
    duree: 7,
    examen: "Le toit est tombé sur le foin. Une corde pend encore à la poulie.",
  },
  // ---------- La Coopérative du Plateau (Book 23 §2.2) ----------
  coop_caisse: {
    verbe: "fouiller",
    libelle: "Fouiller sous le comptoir de caisse",
    donne: { pied_de_biche: 1 },
    qualites: {},
    duree: 5,
    examen: "Le comptoir de la caisse, tiroir arraché. Dessous, quelque chose de lourd est resté coincé contre la plinthe.",
  },
  coop_rayon: {
    verbe: "fouiller",
    libelle: "Fouiller le rayon",
    donne: { conserve: 1 },
    qualites: {},
    duree: 6,
    examen: "Un rayon bas du libre-service : bocaux cassés, sachets éventrés. Pillé, mais pas par quelqu'un de patient.",
  },
  coop_palettes: {
    verbe: "fouiller",
    libelle: "Fouiller les palettes du quai",
    donne: { corde: 1 },
    qualites: {},
    duree: 6,
    examen: "Des palettes filmées, des sangles, des cartons détrempés. Ce qui restait à livrer quand tout s'est arrêté.",
  },
  coop_etabli: {
    verbe: "fouiller",
    libelle: "Fouiller l'établi du mécanicien",
    donne: { cle_plate: 1, machette: 1 },
    qualites: {},
    duree: 7,
    examen: "L'établi de l'atelier des tracteurs : des outils de qualité, rangés par quelqu'un qui en prenait soin.",
  },
  coop_rayonnage: {
    verbe: "fouiller",
    libelle: "Fouiller le rayonnage",
    donne: { bache: 1 },
    qualites: {},
    duree: 8,
    examen: "Quatre mètres d'étagères : sacs d'engrais, bidons, bâches, cordages. Tout en haut, ce qu'on ne voit pas d'en bas.",
  },
  coop_coffre: {
    verbe: "fouiller",
    libelle: "Ouvrir le coffre du directeur",
    // Et un manuel de chaque famille (Book 25 §2.3) : le joueur seul sur le serveur y apprend le métier des autres.
    donne: { semences_f1: 1, manuel_forgeron: 1, manuel_electricien: 1, manuel_arbalete: 1 },
    qualites: {},
    duree: 6,
    examen: "Un petit coffre-fort vert, scellé au mur. Fermé à clé : le magasinier la portait toujours sur lui.",
  },
  coop_masse: {
    verbe: "ramasser",
    libelle: "Prendre la masse",
    donne: { masse: 1 },
    qualites: {},
    duree: 2,
    examen: "Une masse appuyée contre la roue du tracteur, le manche poli par les mains. Trois kilos d'arguments.",
  },
  coop_caisse_froide: {
    verbe: "fouiller",
    libelle: "Prendre un seau de la laiterie",
    // Plan 0.8 (I8) : les roulements et l'alternateur de tracteur en sont retirés (rien de propre à une famille en L1) ;
    // la chambre froide devient la laiterie, et ses seaux de 10 L sont la clé du récupérateur à seau.
    donne: { seau_10l: 1 },
    qualites: {},
    duree: 4,
    examen: "La laiterie : des seaux de tôle galvanisée empilés sur une caisse, dans le froid. Ils ont attendu le lait du matin.",
  },
  // Book 23 §4.7 : la batterie du klaxon. Sa charge dépend des coups déjà donnés (le client la dit à l'examen).
  coop_batterie: {
    verbe: "demonter",
    libelle: "Démonter la batterie du tracteur",
    donne: { batterie_voiture: 1 },
    qualites: { serrer: 1 },
    duree: 8,
    examen: "La batterie du tracteur rouge, sanglée sur le garde-boue : c'est elle qui fait sonner le klaxon. Une 12 V de 18 kg, comme celle d'une voiture.",
  },
};

/**
 * Les usages des ressources du niveau 1 (TypeRessourceNiveau1) : chacun arrive avec son lieu, en fin de table (chantier
 * 10 : la station et la Coopérative ; 11 : le gué ; 12 : le Moulin). Une ressource sans usage ne se pose pas.
 */
const USAGES_NIVEAU1: Partial<Record<TypeRessourceNiveau1, UsageRessource>> = {
  // ---------- La maison (chantier 10) ----------
  ruine_bidon: {
    verbe: "ramasser",
    libelle: "Prendre le bidon",
    donne: { bidon_5l: 1 },
    qualites: {},
    duree: 1.5,
    examen: "Un bidon de plastique blanc, coincé sous une poutre de la ruine. Cinq litres, le bouchon encore vissé.",
  },
  // ---------- H1A, la station (chantier 10) : la pièce de famille, chacun la sienne (Q-0.8-14 : elle revient en 24 h) ----------
  piece_enclume: {
    verbe: "ramasser",
    libelle: "Prendre l'enclume et le sac de charbon",
    // I23 : le sac de charbon donne 4 charbons.
    donne: { enclume_depanneur: 1, charbon_bois: 4 },
    qualites: {},
    duree: 4,
    examen: "Sous l'établi, une petite enclume de dépanneur, dix kilos d'acier, et à côté un sac de charbon de bois entamé. De quoi forger.",
  },
  piece_alternateur: {
    verbe: "ramasser",
    libelle: "Prendre le petit alternateur",
    donne: { petit_alternateur: 1 },
    qualites: {},
    duree: 3,
    examen: "Sur l'établi, à côté de la voiture éventrée : son alternateur, sorti du moteur avec sa poulie. Quelqu'un l'avait déjà déposé.",
  },
  tas_bois: {
    verbe: "ramasser",
    libelle: "Prendre une bûche au tas",
    donne: { buche: 1 },
    qualites: {},
    duree: 2,
    examen: "Le bois de chauffage de l'atelier, fendu et rangé contre le mur. Personne ne viendra plus s'y chauffer : prends-en.",
  },
  // ---------- L1A, la Coopérative (chantier 10) : les clés à place fixe ----------
  coop_grillage: {
    verbe: "ramasser",
    libelle: "Prendre le rouleau de grillage",
    donne: { grillage_rouleau: 1 },
    qualites: {},
    duree: 5,
    examen: "Au parc à volailles, un rouleau de grillage neuf resté contre un piquet : de quoi faire une grille de cuisine.",
  },
  coop_cocotte: {
    verbe: "ramasser",
    libelle: "Prendre la cocotte en fonte",
    donne: { cocotte_fonte: 1 },
    qualites: {},
    duree: 2,
    examen: "En tête de gondole, sous une pancarte « −20 % », une cocotte en fonte rouge, son couvercle encore posé dessus. Cinq kilos et demi.",
  },
  // ---------- H1B, le Gué-aux-Saules (chantier 11 ; commun/src/gue.ts) ----------
  // B6 : la vase de la berge, sous le camping-car : inépuisable, une motte de 2 kg par geste de 6 s, avec Creuser 1.
  gisement_glaise: {
    verbe: "ramasser",
    libelle: "Creuser une motte de glaise",
    donne: { glaise: 1 },
    qualites: { creuser: 1 },
    duree: 6,
    examen: "La berge de vase, sous le camping-car : une glaise grise et grasse, entamée à la bêche. Il en reste pour des années. Il faut de quoi creuser.",
  },
  // B5 : le banc de galets accroché au radier, 8 pierres à chacun (6 h).
  banc_galets: {
    verbe: "ramasser",
    libelle: "Prendre un galet plat",
    donne: { pierre: 1 },
    qualites: {},
    duree: 1.8,
    examen: "Le banc de galets, au pied du radier : des pierres plates et rondes, polies par l'eau. Bonnes pour un foyer, et pour les ricochets.",
  },
  // Les fouilles du gué : rien de sûr, mais par chance une bâche, des chiffons, une casserole, une corde.
  gue_cabane: {
    verbe: "fouiller",
    libelle: "Fouiller la cabane du passeur",
    donne: {},
    qualites: {},
    duree: 4,
    examen: "Le râtelier du passeur : des gaffes, des avirons, des cordes lovées. Le registre des passages est resté ouvert sur la table.",
  },
  gue_buvette: {
    verbe: "fouiller",
    libelle: "Fouiller la buvette",
    donne: {},
    qualites: {},
    duree: 4,
    examen: "Derrière le comptoir de Chez Lulu : la friteuse à l'huile figée, des paniers, une caisse et des jetons de bal.",
  },
  gue_barques: {
    verbe: "fouiller",
    libelle: "Regarder sous les barques",
    donne: {},
    qualites: {},
    duree: 3,
    examen: "Les barques de location, retournées sur la plage. Dessous, des rames, une écope, peut-être une corde d'amarrage.",
  },
  gue_camping_car: {
    verbe: "fouiller",
    libelle: "Fouiller le camping-car",
    donne: {},
    qualites: {},
    duree: 5,
    examen: "« Liberté Totale », embourbé jusqu'aux essieux. Dedans, des duvets, un réchaud, des placards qui claquent.",
  },
  gue_lavoir: {
    verbe: "fouiller",
    libelle: "Fouiller le lavoir",
    donne: {},
    qualites: {},
    duree: 3,
    examen: "Le lavoir de 1887 : des battoirs, un pain de savon, des draps oubliés sur la pierre. Le filet d'eau de la source coule encore.",
  },
  gue_garde_peche: {
    verbe: "fouiller",
    libelle: "Fouiller le cabanon du garde-pêche",
    donne: {},
    qualites: {},
    duree: 4,
    examen: "Le cabanon du garde-pêche : des cannes, des hameçons, des filets pendus, une paire de bottes.",
  },
};

/**
 * Tous les usages. Les ressources du niveau 1 qui n'ont pas encore le leur n'existent dans aucun lieu : le type les
 * déclare d'avance, la table les reçoit avec leur lieu.
 */
export const USAGES = { ...USAGES_ETABLIS, ...USAGES_NIVEAU1 } as Record<TypeRessource, UsageRessource>;

/** Les vestiges de la ruine, à leur place dans les décombres. */
export function genererVestiges(premierId: number): Omit<RessourceSol, "disponible">[] {
  const places: [TypeRessource, number, number][] = [
    ["velo", -2.2, 1.6],
    ["caisse_outils", 1.8, -1.4],
    ["batterie_voiture", 2.6, 1.5],
    ["ressort", -0.4, -1.9],
    ["bache", 0.6, 1.9],
    ["barre_metal", -2.6, -1.2],
    // Plan 0.8 (§2.5) : le bidon de 5 L, pour le récupérateur de la maison.
    ["ruine_bidon", -1.3, 0.2],
  ];
  return places.map(([type, dx, dz], i) => ({ id: premierId + i, type, x: RUINE.x + dx, z: RUINE.z + dz }));
}

const NOMBRES = { branche: 34, buche: 16, pierre: 26, buisson: 10 } as const;

export function aleatoire(graine: number): () => number {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Les touffes de joncs autour de la mare (on les ajoute aussi aux terrains créés avant elles). */
export function genererJoncs(graine: number, premierId: number): Omit<RessourceSol, "disponible">[] {
  const aleat = aleatoire(graine * 104729 + 7);
  const nombre = 7;
  return Array.from({ length: nombre }, (_, i) => {
    const a = (i / nombre) * Math.PI * 2 + aleat() * 0.5;
    const r = rayonMare(a) + 0.45 + aleat() * 0.4;
    return { id: premierId + i, type: "joncs" as const, x: Math.round((MARE.x + Math.cos(a) * r) * 100) / 100, z: Math.round((MARE.z + Math.sin(a) * r) * 100) / 100 };
  });
}

/** Génère les ressources d'un terrain neuf. */
export function genererRessources(graine: number): Omit<RessourceSol, "disponible">[] {
  const aleat = aleatoire(graine * 7919 + 13);
  const places: { x: number; z: number }[] = [];
  const libre = (x: number, z: number) =>
    Math.hypot(x - 25, z - 26) > 4.5 && // l'aire du premier feu
    distanceMare(x, z) > 1.2 &&
    !(Math.abs(x - RUINE.x) < RUINE.largeur / 2 + 1 && Math.abs(z - RUINE.z) < RUINE.profondeur / 2 + 1) &&
    places.every((p) => Math.hypot(p.x - x, p.z - z) > 1.1);

  const ressources: Omit<RessourceSol, "disponible">[] = [];
  let id = 1;
  for (const type of ["buisson", "buche", "branche", "pierre"] as const) {
    for (let i = 0; i < NOMBRES[type]; i++) {
      let x = 0;
      let z = 0;
      let essais = 0;
      do {
        // Le bois mort se trouve plutôt près de la lisière, les buissons aussi.
        const bord = type === "pierre" ? 1 : 0.55;
        x = 1.5 + Math.pow(aleat(), bord) * (TERRAIN_TAILLE - 3);
        z = 1.5 + aleat() * (TERRAIN_TAILLE - 3);
        if (aleat() < 0.5) x = TERRAIN_TAILLE - x;
        essais++;
      } while (!libre(x, z) && essais < 50);
      places.push({ x, z });
      ressources.push({ id: id++, type, x: Math.round(x * 100) / 100, z: Math.round(z * 100) / 100 });
    }
  }
  ressources.push(...genererJoncs(graine, id));
  ressources.push(...genererVergerEtSousBois(graine, ressources.length + 1, ressources));
  ressources.push(...genererEssences(graine, ressources.length + 1, ressources));
  return ressources;
}

/**
 * Les essences du métier (Book 25 §3.2, 0.6) : deux frênes à la lisière, sur deux bords différents, et un if au fond du
 * bois, contre la lisière ouest, loin du feu. `occupees` : ce qui est déjà posé (pour les terrains d'avant la 0.6).
 */
export function genererEssences(graine: number, premierId: number, occupees: readonly { x: number; z: number }[] = []): Omit<RessourceSol, "disponible">[] {
  const aleat = aleatoire(graine * 2654435761 + 41);
  const T = TERRAIN_TAILLE;
  const places = [...occupees];
  const ressources: Omit<RessourceSol, "disponible">[] = [];
  let id = premierId;
  const libre = (x: number, z: number, d: number) =>
    Math.hypot(x - 25, z - 26) > 10 &&
    distanceMare(x, z) > 3 &&
    !(Math.abs(x - RUINE.x) < RUINE.largeur / 2 + 3 && Math.abs(z - RUINE.z) < RUINE.profondeur / 2 + 3) &&
    !(z > T - 8 && Math.abs(x - 25) < 4) && // le chemin du sud
    ARBRES_ISOLES.every(([ax, az]) => Math.hypot(ax - x, az - z) > 4) &&
    places.every((p) => Math.hypot(p.x - x, p.z - z) > d);
  const poser = (type: TypeRessource, tirer: () => [number, number]) => {
    for (let essai = 0; essai < 200; essai++) {
      const [x, z] = tirer();
      if (!libre(x, z, essai < 150 ? 2.2 : 1.2) && essai < 199) continue;
      const p = { x: Math.round(x * 100) / 100, z: Math.round(z * 100) / 100 };
      places.push(p);
      ressources.push({ id: id++, type, ...p });
      return;
    }
  };
  // Deux frênes, chacun sur un bord (nord, est, sud ou ouest), à 2,5 à 4 m de la lisière.
  const premier = Math.floor(aleat() * 4);
  for (const bord of [premier, (premier + 1 + Math.floor(aleat() * 3)) % 4]) {
    poser("frene", () => {
      const t = 6 + aleat() * (T - 12);
      const d = 2.5 + aleat() * 1.5;
      return ([[t, d], [T - d, t], [t, T - d], [d, t]] as const)[bord]! as [number, number];
    });
  }
  // L'if, au fond du bois : contre la lisière ouest, dans le tiers nord ou sud.
  poser("if_bois", () => [2.2 + aleat() * 1.6, aleat() < 0.5 ? 5 + aleat() * 9 : T - 14 + aleat() * 8]);
  return ressources;
}

/**
 * Le verger et le sous-bois (2026-10-08) : six arbres fruitiers sur le terrain (un de chaque espèce, et un second pommier),
 * et des champignons sous les arbres et le long de la lisière. `occupees` : ce qui est déjà posé (pour les anciens terrains).
 */
export function genererVergerEtSousBois(graine: number, premierId: number, occupees: readonly { x: number; z: number }[] = []): Omit<RessourceSol, "disponible">[] {
  const aleat = aleatoire(graine * 15485863 + 29);
  const T = TERRAIN_TAILLE;
  const ressources: Omit<RessourceSol, "disponible">[] = [];
  const places = [...occupees];
  let id = premierId;
  const loinDe = (x: number, z: number, d: number) => places.every((p) => Math.hypot(p.x - x, p.z - z) > d);

  const arbres: { x: number; z: number }[] = [];
  for (const type of [...ARBRES_FRUITIERS, "pommier"] as TypeRessource[]) {
    for (let essai = 0; essai < 200; essai++) {
      const x = 5 + aleat() * (T - 10);
      const z = 5 + aleat() * (T - 10);
      const libre =
        Math.hypot(x - 25, z - 26) > 8 &&
        distanceMare(x, z) > 4 &&
        !(Math.abs(x - RUINE.x) < RUINE.largeur / 2 + 3 && Math.abs(z - RUINE.z) < RUINE.profondeur / 2 + 3) &&
        !(z > 38 && Math.abs(x - 25) < 4) && // le chemin du sud
        ARBRES_ISOLES.every(([ax, az]) => Math.hypot(ax - x, az - z) > 6) &&
        arbres.every((a) => Math.hypot(a.x - x, a.z - z) > 7) &&
        loinDe(x, z, 2.6);
      if (!libre && essai < 199) continue;
      const p = { x: Math.round(x * 100) / 100, z: Math.round(z * 100) / 100 };
      arbres.push(p);
      places.push(p);
      ressources.push({ id: id++, type, ...p });
      break;
    }
  }

  // Les champignons : surtout des cèpes, quelques amanites qui leur ressemblent de loin.
  const pieds = [...ARBRES_ISOLES.map(([x, z]) => ({ x, z })), ...arbres];
  const champignons: TypeRessource[] = ["cepe", "cepe", "cepe", "cepe", "cepe", "cepe", "cepe", "amanite_tue_mouches", "amanite_tue_mouches", "amanite_tue_mouches", "amanite_phalloide", "amanite_phalloide", "amanite_phalloide"];
  for (const type of champignons) {
    for (let essai = 0; essai < 100; essai++) {
      let x: number;
      let z: number;
      if (aleat() < 0.55) {
        // Au pied d'un arbre, hors du tronc.
        const pied = pieds[Math.floor(aleat() * pieds.length)]!;
        const a = aleat() * Math.PI * 2;
        const r = 1 + aleat() * 1.4;
        x = pied.x + Math.cos(a) * r;
        z = pied.z + Math.sin(a) * r;
      } else {
        // Le long de la lisière, à l'ombre des grands arbres.
        const t = aleat() * T;
        const bord = 1.5 + aleat() * 2.5;
        [x, z] = [[t, bord], [T - bord, t], [t, T - bord], [bord, t]][Math.floor(aleat() * 4)]!;
      }
      const libre = x > 1 && x < T - 1 && z > 1 && z < T - 1 && !(z > T - 4 && Math.abs(x - 25) < 3) && distanceMare(x, z) > 1 && loinDe(x, z, 1.1);
      if (!libre && essai < 99) continue;
      const p = { x: Math.round(x * 100) / 100, z: Math.round(z * 100) / 100 };
      places.push(p);
      ressources.push({ id: id++, type, ...p });
      break;
    }
  }
  return ressources;
}
