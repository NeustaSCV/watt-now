// Fabrication de l'É2 (Book 02, Book 03 §4) : qualités d'outil, recettes, énergie grise.
//
// Depuis la 0.6 (Book 25 §10.4), ce fichier ne garde que le moteur : les recettes elles-mêmes sont rangées par famille
// dans `recettes/<famille>.ts` (et `recettes/communes.ts` pour celles de tout le monde). Les recettes d'une autre
// famille se voient grisées, s'apprennent (leçon, manuel), coûtent ×1,5 et plafonnent à ★★ (Book 25 §2.2 et §2.3).

import { REGLAGES } from "./reglages.ts";
import { OBJETS, type Inventaire, type TypeObjet } from "./objets.ts";
import { ENERGIE_GRISE_PROVISOIRE } from "./objets-metier.ts";
import type { Famille } from "./regles.ts";
import { valeursVestiges } from "./vestiges.ts";
import { compter, estObjetDeMetier, etoilesDeBase, maillonFaible, typeDe, type Etoiles } from "./etoiles.ts";
import { SURCOUT_AUTRE_FAMILLE } from "./lignees.ts";
import { RECETTES_COMMUNES } from "./recettes/communes.ts";
import { RECETTES_CHARBONNIERS } from "./recettes/charbonniers.ts";
import { RECETTES_MECANISTES } from "./recettes/mecanistes.ts";
import { RECETTES_VOLTAIQUES } from "./recettes/voltaiques.ts";

// ---------- Qualités d'outil (Book 03 §4) ----------

export type Qualite =
  | "couper"
  | "marteler"
  | "fendre"
  | "visser"
  | "serrer"
  | "scier_bois"
  | "creuser"
  // Le métier des familles (Book 25 §4.3, 0.6)
  | "saisir_chaud"
  | "tailler_bois"
  | "trancher_metal"
  | "elaguer";

export const NOMS_QUALITES: Record<Qualite, string> = {
  couper: "Couper",
  marteler: "Marteler",
  fendre: "Fendre",
  visser: "Visser",
  serrer: "Serrer",
  scier_bois: "Scier le bois",
  creuser: "Creuser",
  saisir_chaud: "Saisir à chaud",
  tailler_bois: "Tailler le bois",
  trancher_metal: "Trancher le métal",
  elaguer: "Élaguer",
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
  // Les armes trouvées, qui sont aussi des outils (Book 25 §11) : la masse martèle, la machette coupe.
  masse: { marteler: 3 },
  pied_de_biche: { marteler: 1 },
  machette: { couper: 1 },
  // 🔥 La gamme des Charbonniers (Book 25 §4.3) : les qualités nouvelles viennent de leurs outils.
  pinces_forge: { saisir_chaud: 2 },
  machette_forgee: { couper: 2 },
  hachette: { fendre: 2, couper: 1 },
  hache_forgee: { fendre: 3, couper: 1 },
  serpe: { couper: 2, elaguer: 1 },
  glaive: { couper: 2 },
  ciseau_bois: { tailler_bois: 2 },
  burin: { trancher_metal: 1 },
};

/** Le meilleur niveau d'une qualité parmi les objets portés (0 si aucun). */
export function niveauQualite(inventaire: Inventaire, qualite: Qualite): number {
  let meilleur = 0;
  for (const [type, n] of Object.entries(inventaire)) {
    if (!n) continue;
    // Un exemplaire étoilé (« lame_forgee#4 ») a les qualités de son objet.
    meilleur = Math.max(meilleur, QUALITES_OBJETS[typeDe(type)]?.[qualite] ?? 0);
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
  | "decharge"
  // ⚡ Les Voltaïques (Book 25 §5.3, chantier 6) : l'alarme, les clôtures, la plaque de choc, le bain de dérouillage.
  | "alarme_electrique"
  | "cloture_fortune"
  | "cloture_electrique"
  | "plaque_choc"
  | "bain_derouillage"
  // ⚙️ Les Mécanistes (Book 25 §6.3 et §6.4, chantier 7) : les pièges et le tour à perche ; le collet, pour tous.
  | "collet"
  | "assommoir"
  | "machoires_fortune"
  | "piege_machoires"
  | "fosse_pieux"
  | "tour_perche";

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
  alarme_electrique: "alarme électrique",
  cloture_fortune: "clôture de fortune",
  cloture_electrique: "clôture électrique",
  plaque_choc: "plaque de choc",
  bain_derouillage: "bain de dérouillage",
  collet: "collet",
  assommoir: "assommoir",
  machoires_fortune: "mâchoires de fortune",
  piege_machoires: "piège à mâchoires",
  fosse_pieux: "fosse à pieux",
  tour_perche: "tour à perche",
};

/** Les petites installations : on peut les poser plus près des autres (un lit à côté de l'abri, une alarme le long du chemin). */
export const PETITES_INSTALLATIONS: readonly string[] = ["lit_branchages", "alarme_boites", "alarme_electrique", "collet", "plaque_choc", "machoires_fortune", "piege_machoires"];

/** Intensité du travail (Book 02 §2), en kcal par heure de jeu. */
export const INTENSITES = { legere: 150, moyenne: 250, lourde: 350, tres_lourde: 500 } as const;

/**
 * Les onglets du panneau Fabriquer (avis de Sally, 2026-10-08) : on range selon ce à quoi sert l'objet. Une installation
 * qui fabrique ou produit de l'énergie va dans Ateliers ; une qui sert à vivre au camp, dans Bâtir. Une recette n'a
 * qu'une catégorie (les compteurs ne mentent pas), et « Tout » reste le filet.
 */
export type CategorieRecette = "feu" | "outils" | "sur_soi" | "materiaux" | "batir" | "ateliers";
export const CATEGORIES_RECETTES: readonly { id: CategorieRecette; nom: string; long: string }[] = [
  { id: "feu", nom: "Feu", long: "Feu et cuisine" },
  { id: "outils", nom: "Outils", long: "Outils et armes" },
  { id: "sur_soi", nom: "Sur soi", long: "Sur soi : sacs, protections, soins" },
  { id: "materiaux", nom: "Matériaux", long: "Matériaux" },
  { id: "batir", nom: "Bâtir", long: "Bâtir : vivre au camp" },
  { id: "ateliers", nom: "Ateliers", long: "Ateliers : fabriquer, produire" },
];

export interface Recette {
  id: string;
  /** Son onglet dans le panneau Fabriquer. */
  categorie: CategorieRecette;
  nom: string;
  /** Ce que la recette produit : un objet dans le sac, ou une installation posée sur le terrain. */
  produit: { objet: TypeObjet; quantite: number } | { installation: TypeInstallation };
  /** Ce qui reste en plus (Book 25 §9.6) : plumer une poule laisse des plumes et un os. */
  sousProduits?: Inventaire;
  ingredients: Inventaire;
  qualites: Partial<Record<Qualite, number>>;
  /** Installation à proximité nécessaire. */
  installation?: TypeInstallation;
  /** Il faut un feu allumé tout près (la cuisine, 2026-10-08). */
  feu?: true;
  /** Le foyer doit savoir le cuire (Book 24 §3.1) : 3 pour les mijotés (la crémaillère du foyer de cuisine). Absent : 1. */
  feuNiveau?: number;
  /** De l'eau prise dans la gourde, en litres (elle bout : celle de la mare suffit). */
  eau?: number;
  /** Le bois que la cuisson prend au foyer, en kg (moitié moins avec la marmite norvégienne). */
  boisFeu?: number;
  /**
   * Durée du travail, en minutes de jeu : elle fait l'énergie grise (Book 01 §6).
   * À l'écran, la fabrication va bien plus vite : voir `dureeReelle`.
   */
  duree: number;
  intensite: keyof typeof INTENSITES;
  /** « tous » : recette commune, connue d'emblée par tous (Book 03 §5.2). */
  famille: Famille | "tous";
  /**
   * Pour un objet de métier : les étoiles de chaque facteur (matière, geste, outils), d'après le sac au moment de
   * fabriquer (Book 25 §4.2 : le maillon faible). Absent : les étoiles de base de l'objet. Rempli par les chantiers 4 à 7.
   */
  facteursEtoiles?: (inventaire: Inventaire) => number[];
}

/** Toutes les recettes : les communes, puis celles de chaque famille (Book 25 §10.4). */
export const RECETTES: Recette[] = [...RECETTES_COMMUNES, ...RECETTES_CHARBONNIERS, ...RECETTES_MECANISTES, ...RECETTES_VOLTAIQUES];

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

// ---------- Le savoir : sa famille, et ce qu'on a appris des autres (Book 25 §2.2 et §2.3) ----------

/** Ce qu'un personnage a appris hors de sa famille : des recettes (leçons), et les manuels qu'il a lus. */
export interface SavoirRecettes {
  /** Les recettes apprises d'un joueur d'une autre famille (identifiants). */
  apprises?: readonly string[];
  /** Les familles dont on a lu le manuel : toutes leurs recettes s'ouvrent. */
  manuels?: readonly Famille[];
}

/** Une recette d'une autre famille que la sienne (ni commune, ni de sa famille). */
export function estHorsFamille(r: Recette, famille: Famille): boolean {
  return r.famille !== "tous" && r.famille !== famille;
}

/** A-t-on appris cette recette d'une autre famille (leçon ou manuel) ? */
export function estApprise(r: Recette, savoir: SavoirRecettes = {}): boolean {
  if (r.famille === "tous") return false;
  return (savoir.apprises ?? []).includes(r.id) || (savoir.manuels ?? []).includes(r.famille);
}

/**
 * Les recettes qu'un personnage connaît (Book 21 §3.4 : celles de sa famille et les communes ; Book 25 §2.3 : plus
 * celles qu'il a apprises d'une autre famille).
 */
export function recettesConnues(famille: Famille, savoir: SavoirRecettes = {}): Recette[] {
  return RECETTES.filter((r) => !estHorsFamille(r, famille) || estApprise(r, savoir));
}

/** Les recettes des autres familles qu'on n'a pas encore apprises : montrées grisées, « chez les Charbonniers ». */
export function recettesAutresFamilles(famille: Famille, savoir: SavoirRecettes = {}): Recette[] {
  return RECETTES.filter((r) => estHorsFamille(r, famille) && !estApprise(r, savoir));
}

/** Les recettes qu'un joueur de cette famille peut enseigner (Book 03 §5.4 : celles de son métier). */
export function recettesEnseignables(famille: Famille): Recette[] {
  return RECETTES.filter((r) => r.famille === famille);
}

const horsFamille = new Map<string, Recette>();

/**
 * La même recette faite hors de sa famille (Book 01 §5, Book 25 §2.2) : ×1,5 en matières (arrondi au-dessus) et en
 * temps. L'énergie grise suit. Le plafond ★★ est appliqué par `etoilesDuProduit`.
 */
export function recetteHorsFamille(r: Recette): Recette {
  let h = horsFamille.get(r.id);
  if (!h) {
    const ingredients: Inventaire = {};
    for (const [t, n] of Object.entries(r.ingredients)) ingredients[t as TypeObjet] = Math.ceil((n ?? 0) * SURCOUT_AUTRE_FAMILLE);
    h = { ...r, ingredients, duree: r.duree * SURCOUT_AUTRE_FAMILLE };
    horsFamille.set(r.id, h);
  }
  return h;
}

/** La recette telle qu'un personnage de cette famille la fait : normale, ou ×1,5 hors de sa famille. */
export function recettePour(r: Recette, famille: Famille): Recette {
  return estHorsFamille(r, famille) ? recetteHorsFamille(r) : r;
}

/**
 * Les étoiles de ce que produit une recette (Book 25 §4.2) : null si le produit n'est pas un objet de métier. Le maillon
 * faible de ses facteurs (sinon les étoiles de base de l'objet), +1 si la sorte est maîtrisée ; plafond ★★ hors famille.
 */
export function etoilesDuProduit(r: Recette, inventaire: Inventaire, conditions: { horsFamille?: boolean; maitrise?: boolean } = {}): Etoiles | null {
  if (!("objet" in r.produit) || !estObjetDeMetier(r.produit.objet)) return null;
  const facteurs = r.facteursEtoiles?.(inventaire) ?? [etoilesDeBase(r.produit.objet)];
  return maillonFaible(facteurs, conditions);
}

/** Les ingrédients sont-ils dans le sac ? Un objet de métier compte toutes étoiles confondues. */
export function ingredientsPresents(inventaire: Inventaire, r: Recette): boolean {
  return Object.entries(r.ingredients).every(([t, n]) => compter(inventaire, t as TypeObjet) >= (n ?? 0));
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
  // Les matières du métier (Book 25 §9.1) : couper une perche, tailler l'if, et les restes de la volaille.
  perche_frene: 10,
  baton_if: 30,
  plumes: 2,
  os: 2,
  graisse: 3,
  boyaux: 4,
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

/** Énergie grise d'une unité d'objet, en wotts : sa valeur de base, sinon sa recette, sinon sa valeur provisoire (0.6). */
export function energieGrise(type: TypeObjet): number {
  const base = ENERGIE_GRISE_BASE[type];
  if (base !== undefined) return base;
  const r = RECETTES.find((x) => "objet" in x.produit && x.produit.objet === type);
  if (r && "objet" in r.produit) return energieGriseRecette(r) / r.produit.quantite;
  return ENERGIE_GRISE_PROVISOIRE[type] ?? 0;
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

const COLLECTE: TypeObjet[] = [
  "branche",
  "buche",
  "pierre",
  "baies",
  "fibres",
  "pomme",
  "poire",
  "prunes",
  "cerises",
  "noix",
  "cepe",
  "amanite_tue_mouches",
  "amanite_phalloide",
  "perche_frene",
  "baton_if",
  "plumes",
  "os",
  "graisse",
  "boyaux",
];
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
  // Un objet de la 0.6 pas encore fabricable : il vaut sa valeur provisoire, comme un objet fabriqué.
  if (ENERGIE_GRISE_PROVISOIRE[type] !== undefined) return { total, nature: "fabrique" };
  return { total, nature: "vestige" };
}

/** Vérifie que tous les objets du catalogue ont une énergie grise (utilisé par les tests). */
export function objetsSansEnergieGrise(): TypeObjet[] {
  return (Object.keys(OBJETS) as TypeObjet[]).filter((t) => energieGrise(t) <= 0);
}
