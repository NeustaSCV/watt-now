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
  | "coop_ifs";

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
};

export interface RessourceSol {
  id: number;
  type: TypeRessource;
  x: number;
  z: number;
  /** Faux tant que la ressource n'a pas repoussé (bois mort, baies). */
  disponible: boolean;
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

/** Délai réel avant qu'une ressource ramassée réapparaisse, en millisecondes (null : ne revient pas). */
export const REPOUSSE_MS: Record<TypeRessource, number | null> = {
  branche: 40 * 60_000,
  buche: 90 * 60_000,
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
  coop_coffre: 4 * 24 * 3_600_000,
  coop_caisse_froide: 4 * 24 * 3_600_000,
  coop_masse: 24 * 3_600_000,
  // Une autre batterie se retrouve dans le tracteur en 4 jours, comme le butin rare : le klaxon revit avec elle.
  coop_batterie: 4 * 24 * 3_600_000,
  // Le frêne : une perche en 6 h réelles, même hors ligne (Book 25 §3.2). L'if du fond du bois : un bâton par jour de
  // calendrier (≈ 1 h 50 réelles) ; la haie de la Coopérative, un par visite (elle repousse en 12 h).
  frene: 6 * 3_600_000,
  if_bois: MS_JOUR_CALENDRIER,
  coop_ifs: 12 * 3_600_000,
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
 * comme les Mécanistes (Book 03 §5.3). Pour les autres, c'est un arbre sombre du décor de la lisière.
 */
export function ressourceVisible(type: TypeRessource, famille: Famille): boolean {
  return type !== "if_bois" || famille === "mecanistes";
}
/** L'escabeau sert s'il est posé dans ce disque autour du tronc (m). */
export const RAYON_ESCABEAU = 2.4;
/** Un arbre est large : on le touche d'un peu plus loin que le reste. */
export const PORTEE_ARBRE = 0.8;
/** Les arbres isolés du terrain (décor, sans fruits) : les champignons poussent dessous. */
export const ARBRES_ISOLES: readonly (readonly [number, number])[] = [[6, 8], [47.5, 3], [7, 43], [41, 40], [12, 30]];

/** Ce qu'on fait de chaque ressource du sol, et ce qu'elle donne (Book 02 §5). */
export const USAGES: Record<TypeRessource, UsageRessource> = {
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
  // Les essences du métier (Book 25 §3.2) : Couper 2 (couteau aiguisé, serpe, lame) ; le couteau du kit, ×1,5.
  frene: {
    verbe: "ramasser",
    libelle: "Couper une perche de frêne",
    donne: { perche_frene: 1 },
    qualites: { couper: 2 },
    duree: 6,
    examen: "Un frêne : écorce grise et lisse, bourgeons noirs comme du velours. Ses rejets droits font de bons arcs.",
  },
  if_bois: {
    verbe: "ramasser",
    libelle: "Tailler un bâton d'if",
    donne: { baton_if: 1 },
    qualites: { couper: 2 },
    duree: 8,
    examen: "Un if, sombre et lent, au fond du bois : le meilleur bois d'arc. Toxique : on n'en mange ni baies ni aiguilles.",
  },
  coop_ifs: {
    verbe: "ramasser",
    libelle: "Tailler un bâton d'if",
    donne: { baton_if: 1 },
    qualites: { couper: 2 },
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
    donne: { tete_hache: 1, cle_plate: 1, tournevis: 1 },
    qualites: {},
    duree: 4,
    examen: "Une caisse en fer, rouillée. Quelque chose cliquette dedans.",
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
    donne: { barre_metal: 1 },
    qualites: {},
    duree: 5,
    examen: "L'atelier de la station : un établi, des chutes de métal, une odeur d'huile froide.",
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
    libelle: "Ouvrir les caisses de pièces",
    donne: { roulements: 1, alternateur_tracteur: 1 },
    qualites: {},
    duree: 10,
    examen: "Des caisses plombées « PIÈCES DÉTACHÉES — STOCK DE RÉSERVE », alignées dans le froid. Personne n'y a touché.",
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

/** Les vestiges de la ruine, à leur place dans les décombres. */
export function genererVestiges(premierId: number): Omit<RessourceSol, "disponible">[] {
  const places: [TypeRessource, number, number][] = [
    ["velo", -2.2, 1.6],
    ["caisse_outils", 1.8, -1.4],
    ["batterie_voiture", 2.6, 1.5],
    ["ressort", -0.4, -1.9],
    ["bache", 0.6, 1.9],
    ["barre_metal", -2.6, -1.2],
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
