// Fabrication de l'É2 (Book 02, Book 03 §4) : qualités d'outil, recettes, énergie grise.

import { REGLAGES } from "./reglages.ts";
import { OBJETS, type Inventaire, type TypeObjet } from "./objets.ts";
import type { Famille } from "./regles.ts";
import { valeursVestiges } from "./vestiges.ts";

// ---------- Qualités d'outil (Book 03 §4) ----------

export type Qualite = "couper" | "marteler" | "fendre" | "visser" | "serrer" | "scier_bois" | "creuser";

export const NOMS_QUALITES: Record<Qualite, string> = {
  couper: "Couper",
  marteler: "Marteler",
  fendre: "Fendre",
  visser: "Visser",
  serrer: "Serrer",
  scier_bois: "Scier le bois",
  creuser: "Creuser",
};

/** Qualités apportées par chaque objet, avec leur niveau (1 à 3). */
export const QUALITES_OBJETS: Partial<Record<TypeObjet, Partial<Record<Qualite, number>>>> = {
  couteau: { couper: 1, visser: 1 },
  couteau_aiguise: { couper: 2, visser: 1 },
  lame_forgee: { couper: 2 },
  pierre: { marteler: 1 },
  marteau: { marteler: 2 },
  hache: { fendre: 3, couper: 1 },
  tete_hache: { fendre: 1 },
  cle_plate: { serrer: 2 },
  tournevis: { visser: 2 },
  scie: { scier_bois: 2 },
  baton_fouir: { creuser: 1 },
  // Vestiges, lot 1 (0.3) : la bêche trouvée dans la grange.
  beche: { creuser: 2 },
};

/** Le meilleur niveau d'une qualité parmi les objets portés (0 si aucun). */
export function niveauQualite(inventaire: Inventaire, qualite: Qualite): number {
  let meilleur = 0;
  for (const [type, n] of Object.entries(inventaire)) {
    if (!n) continue;
    meilleur = Math.max(meilleur, QUALITES_OBJETS[type as TypeObjet]?.[qualite] ?? 0);
  }
  return meilleur;
}

/**
 * Règle du Book 03 §4 : un niveau en dessous, malus (temps ×1,5) ; deux niveaux en dessous ou aucun outil, impossible.
 * Renvoie le multiplicateur de durée, ou null si c'est impossible.
 */
export function multiplicateurQualites(inventaire: Inventaire, demandees: Partial<Record<Qualite, number>>): number | null {
  let facteur = 1;
  for (const [q, niveau] of Object.entries(demandees)) {
    const possede = niveauQualite(inventaire, q as Qualite);
    // Sans aucun outil de cette qualité, impossible : ne rien avoir n'est pas un outil de fortune.
    if (possede === 0) return null;
    const ecart = (niveau ?? 0) - possede;
    if (ecart >= 2) return null;
    if (ecart === 1) facteur *= 1.5;
  }
  return facteur;
}

// ---------- Recettes ----------

export type TypeInstallation =
  | "etabli"
  | "abri"
  | "coffre"
  | "charbonniere"
  | "forge"
  | "pedalier"
  | "banc_recharge"
  | "panneau_solaire"
  | "escabeau"
  // La gamme bushcraft, lot 1 (P-002, 2026-10-08)
  | "recuperateur_pluie"
  | "alarme_boites"
  | "lit_branchages"
  // La décharge du terrain (P-001) : fixe, elle fait remonter des objets.
  | "decharge";

export const NOMS_INSTALLATIONS: Record<TypeInstallation, string> = {
  etabli: "établi",
  abri: "abri de branches et de bâche",
  coffre: "coffre",
  charbonniere: "meule de charbonnière",
  forge: "foyer de forge à soufflet",
  pedalier: "pédalier universel",
  banc_recharge: "banc de recharge",
  panneau_solaire: "petit panneau solaire",
  escabeau: "escabeau",
  recuperateur_pluie: "récupérateur de pluie",
  alarme_boites: "alarme à boîtes de conserve",
  lit_branchages: "lit de branchages",
  decharge: "décharge",
};

/** Les petites installations : on peut les poser plus près des autres (un lit à côté de l'abri, une alarme le long du chemin). */
export const PETITES_INSTALLATIONS: readonly string[] = ["lit_branchages", "alarme_boites"];

/** Intensité du travail (Book 02 §2), en kcal par heure de jeu. */
export const INTENSITES = { legere: 150, moyenne: 250, lourde: 350, tres_lourde: 500 } as const;

export interface Recette {
  id: string;
  nom: string;
  /** Ce que la recette produit : un objet dans le sac, ou une installation posée sur le terrain. */
  produit: { objet: TypeObjet; quantite: number } | { installation: TypeInstallation };
  ingredients: Inventaire;
  qualites: Partial<Record<Qualite, number>>;
  /** Installation à proximité nécessaire. */
  installation?: TypeInstallation;
  /** Il faut un feu allumé tout près (la cuisine, 2026-10-08). */
  feu?: true;
  /**
   * Durée du travail, en minutes de jeu : elle fait l'énergie grise (Book 01 §6).
   * À l'écran, la fabrication va bien plus vite : voir `dureeReelle`.
   */
  duree: number;
  intensite: keyof typeof INTENSITES;
  /** « tous » : recette commune, connue d'emblée par tous (Book 03 §5.2). */
  famille: Famille | "tous";
}

export const RECETTES: Recette[] = [
  {
    id: "hache",
    nom: "Remmancher la hache",
    produit: { objet: "hache", quantite: 1 },
    ingredients: { tete_hache: 1, branche: 1 },
    qualites: { couper: 1, marteler: 1 },
    duree: 30,
    intensite: "moyenne",
    famille: "tous",
  },
  {
    id: "etabli",
    nom: "Établi",
    produit: { installation: "etabli" },
    ingredients: { buche: 4, branche: 6 },
    qualites: { marteler: 1, couper: 1 },
    duree: 90,
    intensite: "moyenne",
    famille: "tous",
  },
  {
    id: "abri",
    nom: "Abri de branches et de bâche",
    produit: { installation: "abri" },
    ingredients: { branche: 8, bache: 1 },
    qualites: { couper: 1 },
    duree: 60,
    intensite: "lourde",
    famille: "tous",
  },
  {
    // Pour ranger ce qu'on ne porte pas : le sac ne tient que 55 kg (Book 01 §6 bis, Book 19 §2).
    id: "coffre",
    nom: "Coffre de rangement",
    produit: { installation: "coffre" },
    ingredients: { buche: 4, branche: 4, corde: 1 },
    qualites: { couper: 1, marteler: 1 },
    duree: 60,
    intensite: "moyenne",
    famille: "tous",
  },
  {
    // Le geste de base du bushcraft : tordre et tresser les feuilles de jonc (Book 02 §4, fibres ; sans rouissage en 0a).
    id: "corde",
    nom: "Tresser une corde",
    produit: { objet: "corde", quantite: 1 },
    ingredients: { fibres: 4 },
    qualites: {},
    duree: 20,
    intensite: "legere",
    famille: "tous",
  },
  {
    // Deux montants de bûche refendue, des barreaux de branches, le tout ligaturé de corde : pour cueillir dans les arbres.
    // Il se porte et se déplace (le premier objet lourd à porter) ; il servira aussi pour monter un mur (Book 10).
    id: "escabeau",
    nom: "Escabeau de bois",
    produit: { installation: "escabeau" },
    ingredients: { buche: 2, branche: 6, corde: 1 },
    qualites: { couper: 1, marteler: 1 },
    duree: 45,
    intensite: "moyenne",
    famille: "tous",
  },
  {
    // Un rondin de bûche, dégrossi au couteau : l'arme la plus simple (Book 11 §10, chasse à la volaille).
    id: "gourdin",
    nom: "Tailler un gourdin",
    produit: { objet: "gourdin", quantite: 1 },
    ingredients: { buche: 1 },
    qualites: { couper: 1 },
    duree: 20,
    intensite: "legere",
    famille: "tous",
  },
  {
    // Plumer à l'eau chaude ou à sec, vider, découper : quatre portions de 200 g.
    id: "volaille",
    nom: "Plumer et vider la poule",
    produit: { objet: "volaille_crue", quantite: 4 },
    ingredients: { poule: 1 },
    qualites: { couper: 1 },
    duree: 25,
    intensite: "legere",
    famille: "tous",
  },
  // ---------- La cuisine au feu (2026-10-08) : les plats nourrissent mieux que les ingrédients crus ----------
  {
    id: "volaille_cepes",
    nom: "Volaille aux cèpes",
    produit: { objet: "volaille_cepes", quantite: 1 },
    ingredients: { volaille_crue: 1, cepe: 2 },
    qualites: {},
    feu: true,
    duree: 40,
    intensite: "legere",
    famille: "tous",
  },
  {
    id: "cepes_poeles",
    nom: "Poêlée de cèpes",
    produit: { objet: "cepes_poeles", quantite: 1 },
    ingredients: { cepe: 3 },
    qualites: {},
    feu: true,
    duree: 20,
    intensite: "legere",
    famille: "tous",
  },
  {
    id: "pommes_cuites",
    nom: "Pommes cuites sous la cendre",
    produit: { objet: "pommes_cuites", quantite: 1 },
    ingredients: { pomme: 3 },
    qualites: {},
    feu: true,
    duree: 30,
    intensite: "legere",
    famille: "tous",
  },
  {
    // Perdu son sac à l'effondrement ? Un cadre de branches et de la corde : on porte 30 kg au lieu de 10.
    id: "sac_fortune",
    nom: "Sac de fortune",
    produit: { objet: "sac_fortune", quantite: 1 },
    ingredients: { branche: 4, corde: 2 },
    qualites: { couper: 1 },
    duree: 40,
    intensite: "legere",
    famille: "tous",
  },
  {
    id: "pansement",
    nom: "Pansements",
    produit: { objet: "pansement", quantite: 2 },
    ingredients: { chiffons: 1 },
    qualites: { couper: 1 },
    duree: 15,
    intensite: "legere",
    famille: "tous",
  },
  // ---------- La gamme bushcraft, lot 1 (P-002, Book 02 §14 bis) : avec ce qu'on a déjà, pour tous ----------
  {
    id: "ficelle",
    nom: "Rouler une ficelle",
    produit: { objet: "ficelle", quantite: 1 },
    ingredients: { fibres: 2 },
    qualites: {},
    duree: 8,
    intensite: "legere",
    famille: "tous",
  },
  {
    id: "baton_fouir",
    nom: "Bâton à fouir",
    produit: { objet: "baton_fouir", quantite: 1 },
    ingredients: { branche: 1 },
    qualites: { couper: 1 },
    feu: true,
    duree: 15,
    intensite: "legere",
    famille: "tous",
  },
  {
    id: "epieu",
    nom: "Épieu durci au feu",
    produit: { objet: "epieu", quantite: 1 },
    ingredients: { branche: 2 },
    qualites: { couper: 1 },
    feu: true,
    duree: 30,
    intensite: "legere",
    famille: "tous",
  },
  {
    id: "protege_bras",
    nom: "Protège-bras de fortune",
    produit: { objet: "protege_bras", quantite: 1 },
    ingredients: { chiffons: 2, ficelle: 1 },
    qualites: { couper: 1 },
    duree: 10,
    intensite: "legere",
    famille: "tous",
  },
  {
    id: "travois",
    nom: "Travois",
    produit: { objet: "travois", quantite: 1 },
    ingredients: { branche: 6, corde: 2 },
    qualites: { couper: 1 },
    duree: 40,
    intensite: "moyenne",
    famille: "tous",
  },
  {
    id: "recuperateur_pluie",
    nom: "Récupérateur de pluie",
    produit: { installation: "recuperateur_pluie" },
    ingredients: { bache: 1, branche: 4, corde: 1 },
    qualites: { couper: 1 },
    duree: 30,
    intensite: "legere",
    famille: "tous",
  },
  {
    id: "alarme_boites",
    nom: "Alarme à boîtes de conserve",
    produit: { installation: "alarme_boites" },
    ingredients: { boite_vide: 2, ficelle: 1, branche: 2 },
    qualites: {},
    duree: 10,
    intensite: "legere",
    famille: "tous",
  },
  {
    id: "lit_branchages",
    nom: "Lit de branchages",
    produit: { installation: "lit_branchages" },
    ingredients: { branche: 6 },
    qualites: { couper: 1 },
    duree: 20,
    intensite: "legere",
    famille: "tous",
  },
  // ---------- 🔥 Charbonniers : bois → charbonnière → forge → lame (Book 21 §3.4) ----------
  {
    id: "charbonniere",
    nom: "Meule de charbonnière",
    produit: { installation: "charbonniere" },
    ingredients: { buche: 10, branche: 4 },
    qualites: {},
    duree: 60,
    intensite: "lourde",
    famille: "charbonniers",
  },
  {
    id: "forge",
    nom: "Foyer de forge à soufflet",
    produit: { installation: "forge" },
    ingredients: { pierre: 8, barre_metal: 1, branche: 2 },
    qualites: { marteler: 1 },
    duree: 90,
    intensite: "lourde",
    famille: "charbonniers",
  },
  {
    id: "lame_forgee",
    nom: "Forger une lame",
    produit: { objet: "lame_forgee", quantite: 1 },
    ingredients: { ressort_lames: 1, charbon_bois: 1 },
    qualites: { marteler: 2 },
    installation: "forge",
    duree: 90,
    intensite: "lourde",
    famille: "charbonniers",
  },
  // ---------- ⚙️ Mécanistes : vieux vélo → pédalier → meule et dynamo ----------
  {
    id: "pedalier",
    nom: "Pédalier universel",
    produit: { installation: "pedalier" },
    ingredients: { cadre_velo: 1, chaine_velo: 1, roue_velo: 1, buche: 2 },
    qualites: { serrer: 1, visser: 1, marteler: 1 },
    duree: 90,
    intensite: "moyenne",
    famille: "mecanistes",
  },
  // ---------- ⚡ Voltaïques : batterie → banc de recharge → lampe ----------
  {
    id: "banc_recharge",
    nom: "Banc de recharge",
    produit: { installation: "banc_recharge" },
    ingredients: { buche: 2, barre_metal: 1 },
    qualites: { visser: 1, serrer: 1 },
    duree: 60,
    intensite: "moyenne",
    famille: "voltaiques",
  },
  {
    // Le panneau de la station-service, posé sur un support de branches, plein sud, câblé au banc (É4).
    id: "panneau_solaire",
    nom: "Poser le panneau solaire",
    produit: { installation: "panneau_solaire" },
    ingredients: { panneau_solaire: 1, branche: 3 },
    qualites: { visser: 1 },
    duree: 30,
    intensite: "legere",
    famille: "voltaiques",
  },
];

/**
 * Combien de secondes réelles dure une fabrication (décision du 2026-10-08) : le travail est condensé
 * (un vingtième de sa durée de jeu, 2 s au moins) — monter l'abri prend 3 s. L'énergie grise ne change pas.
 */
export function dureeReelle(r: Recette): number {
  return Math.max(2, r.duree / REGLAGES.fabrication_acceleration);
}

export function recette(id: string): Recette | undefined {
  return RECETTES.find((r) => r.id === id);
}

/** Les recettes qu'un personnage connaît (Book 21 §3.4 : celles de sa famille et les communes). */
export function recettesConnues(famille: Famille): Recette[] {
  return RECETTES.filter((r) => r.famille === "tous" || r.famille === famille);
}

export function ingredientsPresents(inventaire: Inventaire, r: Recette): boolean {
  return Object.entries(r.ingredients).every(([t, n]) => (inventaire[t as TypeObjet] ?? 0) >= (n ?? 0));
}

// ---------- Énergie grise (Book 01 §6, Book 02 §3) ----------

/** Cours de base du travail humain : 0,2 wott par kcal (Book 01 §6). */
export const WOTTS_PAR_KCAL = 0.2;

/**
 * Énergie grise des objets de base, en wotts : coût de collecte pour les ressources (Book 02 §3),
 * valeur de remplacement pour les vestiges. Valeurs provisoires, à caler avec le Book 07.
 */
const ENERGIE_GRISE_BASE: Partial<Record<TypeObjet, number>> = {
  branche: 4,
  buche: 16,
  pierre: 6,
  baies: 33,
  conserve: 80,
  boite_vide: 2,
  couteau: 30,
  briquet: 20,
  gourde: 15,
  sac_a_dos: 60,
  pierre_a_feu: 15,
  marteau: 40,
  lampe_dynamo: 80,
  petite_batterie: 150,
  scie: 50,
  corde: 30,
  torche: 10,
  lampe_frontale: 60,
  lanterne: 70,
  tete_hache: 50,
  cle_plate: 25,
  tournevis: 15,
  cadre_velo: 120,
  chaine_velo: 30,
  roue_velo: 40,
  dynamo_velo: 60,
  ressort_lames: 50,
  bache: 40,
  barre_metal: 30,
  batterie_voiture: 360,
  // Charbon : (10 bûches + 4 branches + 1 h de travail lourd) / 4 kg ≈ 61 wotts/kg (Book 02 §12.2 : ≈ 47)
  charbon_bois: 61,
  couteau_aiguise: 45,
  // Vestige impossible à refaire : valeur de remplacement plafonnée (Book 01 §6).
  panneau_solaire: 250,
  chiffons: 5,
  // Couper des joncs au bord de l'eau : quelques minutes de travail léger pour deux poignées.
  fibres: 3,
  // Cueillir : quelques minutes de travail léger (avec l'escabeau pour les arbres).
  pomme: 6,
  poire: 7,
  prunes: 6,
  cerises: 8,
  noix: 10,
  cepe: 8,
  amanite_tue_mouches: 2,
  amanite_phalloide: 2,
  // Une poule : l'approche, le coup, le retour (≈ 15 min de travail léger), plus sa valeur de viande.
  poule: 60,
  volaille_cuite: 18,
  // Vestiges, lot 1 (0.3) : la valeur de chaque vestige et composant (commun/src/vestiges.ts). Les objets absurdes
  // valent 1 ou 2 wotts ; l'électronique est plafonnée (Book 01 §6) : on ne sait plus la refaire, mais elle ne marche plus.
  ...valeursVestiges(),
};

/** Énergie grise d'une recette : matières + travail humain (procédé de référence, sans malus). */
export function energieGriseRecette(r: Recette): number {
  let total = 0;
  for (const [t, n] of Object.entries(r.ingredients)) total += energieGrise(t as TypeObjet) * (n ?? 0);
  const heures = r.duree / 60;
  total += heures * INTENSITES[r.intensite] * WOTTS_PAR_KCAL;
  return total;
}

/** Énergie grise d'une unité d'objet, en wotts. */
export function energieGrise(type: TypeObjet): number {
  const base = ENERGIE_GRISE_BASE[type];
  if (base !== undefined) return base;
  const r = RECETTES.find((x) => "objet" in x.produit && x.produit.objet === type);
  if (r && "objet" in r.produit) return energieGriseRecette(r) / r.produit.quantite;
  return 0;
}

/** Ce qui compose l'énergie grise d'un objet, pour la fiche (Book 01 §6, affichage validé le 2026-10-07). */
export interface DetailEnergieGrise {
  total: number;
  /** Ramassé dans la nature, récupéré sur un vestige (valeur de remplacement), ou fabriqué. */
  nature: "collecte" | "vestige" | "fabrique";
  /** Pour un objet fabriqué : ce que valent les matières, et le travail (minutes de jeu, kcal, wotts). */
  matieres?: number;
  minutes?: number;
  kcal?: number;
  travail?: number;
}

const COLLECTE: TypeObjet[] = ["branche", "buche", "pierre", "baies", "fibres", "pomme", "poire", "prunes", "cerises", "noix", "cepe", "amanite_tue_mouches", "amanite_phalloide"];
/** Le charbon : 10 bûches, 4 branches et une heure de travail lourd, pour 4 kg (Book 02 §12.2). */
const CHARBON = { matieres: 10 * 16 + 4 * 4, minutes: 60, kcal: 350, parUnite: 4 };

export function detailEnergieGrise(type: TypeObjet): DetailEnergieGrise {
  const total = energieGrise(type);
  if (COLLECTE.includes(type)) return { total, nature: "collecte" };
  if (type === "charbon_bois") {
    return { total, nature: "fabrique", matieres: CHARBON.matieres / CHARBON.parUnite, minutes: CHARBON.minutes / CHARBON.parUnite, kcal: CHARBON.kcal / CHARBON.parUnite, travail: (CHARBON.kcal * WOTTS_PAR_KCAL) / CHARBON.parUnite };
  }
  const r = RECETTES.find((x) => "objet" in x.produit && x.produit.objet === type);
  if (r && "objet" in r.produit && ENERGIE_GRISE_BASE[type] === undefined) {
    const n = r.produit.quantite;
    let matieres = 0;
    for (const [t, q] of Object.entries(r.ingredients)) matieres += energieGrise(t as TypeObjet) * (q ?? 0);
    const kcal = (r.duree / 60) * INTENSITES[r.intensite];
    return { total, nature: "fabrique", matieres: matieres / n, minutes: r.duree / n, kcal: kcal / n, travail: (kcal * WOTTS_PAR_KCAL) / n };
  }
  return { total, nature: "vestige" };
}

/** Vérifie que tous les objets du catalogue ont une énergie grise (utilisé par les tests). */
export function objetsSansEnergieGrise(): TypeObjet[] {
  return (Object.keys(OBJETS) as TypeObjet[]).filter((t) => energieGrise(t) <= 0);
}
