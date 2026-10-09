// 🔥 Les recettes des Charbonniers : bois → charbonnière → forge → lames (Book 21 §3.4, Book 25 §4).
// Toute la gamme se fait seul (Book 25 §2.5) ; ce que les autres familles apportent (le manche tourné ⚙️, le
// ventilateur ⚡) n'est qu'une amélioration. Les autres familles voient ces recettes grisées, « chez les Charbonniers ».
//
// La qualité d'une lame est le maillon faible de l'acier, de la trempe et de la forge (commun/src/forge.ts) : chaque
// matière a sa recette (« Forger une machette », « … (fer doux) », « … (lames ébréchées) »), parce qu'une recette n'a
// qu'une liste d'ingrédients. Le serveur fait la trempe, le reforgeage et le manche tourné (serveur/src/forge.ts).
//
// Les demi-mesures du Book 25 §4.3 (½ barre, ½ ressort, ½ kg de charbon) sont doublées, et la recette en donne deux.

import type { Inventaire, TypeObjet } from "../objets.ts";
import type { Recette } from "../recettes.ts";
import { ETOILES_ACIER, facteursLame } from "../forge.ts";

/** Une lame forgée : à la forge, Marteler 2, travail lourd ; ses étoiles suivent l'acier, la trempe et la forge. */
function lame(id: string, nom: string, objet: TypeObjet, ingredients: Inventaire, acier: TypeObjet, duree: number, quantite = 1): Recette {
  const etoilesAcier = ETOILES_ACIER[acier] ?? 3;
  return {
    id,
    categorie: "outils",
    nom,
    produit: { objet, quantite },
    ingredients,
    qualites: { marteler: 2 },
    installation: "forge",
    duree,
    intensite: "lourde",
    famille: "charbonniers",
    facteursEtoiles: (inventaire, contexte) => facteursLame(etoilesAcier, inventaire, contexte),
  };
}

/** Une pièce de forge sans étoiles (pinces, pointes, rivets…) : à la forge, Marteler 2. */
function piece(id: string, nom: string, objet: TypeObjet, quantite: number, ingredients: Inventaire, duree: number, sousProduits?: Inventaire): Recette {
  return {
    id,
    categorie: "outils",
    nom,
    produit: { objet, quantite },
    ...(sousProduits ? { sousProduits } : {}),
    ingredients,
    qualites: { marteler: 2 },
    installation: "forge",
    duree,
    intensite: "lourde",
    famille: "charbonniers",
  };
}

/** La recette qui reforge une lame ébréchée : la même arme, une étoile de moins (Book 25 §4.4). */
export const RECETTE_REFORGER = "reforger_lame";

export const RECETTES_CHARBONNIERS: Recette[] = [
  {
    id: "charbonniere",
    categorie: "ateliers",
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
    categorie: "ateliers",
    nom: "Foyer de forge à soufflet",
    produit: { installation: "forge" },
    ingredients: { pierre: 8, barre_metal: 1, branche: 2 },
    qualites: { marteler: 1 },
    duree: 90,
    intensite: "lourde",
    famille: "charbonniers",
  },
  // Le premier outil du forgeron : sans pinces, pas plus de ★★.
  piece("pinces_forge", "Forger des pinces de forge", "pinces_forge", 1, { barre_metal: 1, charbon_bois: 1 }, 40),
  // Le couteau de forge : la « lame forgée » d'avant, emmanchée sur une branche (même identifiant).
  lame("lame_forgee", "Forger un couteau", "lame_forgee", { ressort_lames: 1, charbon_bois: 1, branche: 1 }, "ressort_lames", 105),
  lame("lame_forgee_fer", "Forger un couteau (fer doux)", "lame_forgee", { barre_metal: 1, charbon_bois: 1, branche: 1 }, "barre_metal", 105),
  lame("lame_forgee_lime", "Forger un couteau (lime usée)", "lame_forgee", { lime_usee: 1, charbon_bois: 1, branche: 1 }, "lime_usee", 105),
  // La mise d'acier : un tranchant de ressort soudé sur un corps de fer. Deux hachettes pour une barre et un ressort.
  lame("hachette", "Forger deux hachettes", "hachette", { barre_metal: 1, ressort_lames: 1, charbon_bois: 2, branche: 2 }, "ressort_lames", 150, 2),
  lame("hache_forgee", "Forger une hache", "hache_forgee", { barre_metal: 1, ressort_lames: 1, charbon_bois: 2, buche: 1 }, "ressort_lames", 120),
  lame("hache_forgee_soc", "Forger une hache (soc de charrue)", "hache_forgee", { soc_charrue: 1, charbon_bois: 2, buche: 1 }, "soc_charrue", 120),
  // L'arme de métier (Book 25 §8.4) : la machette forgée, solide. Le manche ficelé ; un manche tourné ⚙️ : +1 étoile.
  lame("machette_forgee", "Forger une machette", "machette_forgee", { ressort_lames: 2, charbon_bois: 2, branche: 1, ficelle: 1 }, "ressort_lames", 120),
  lame("machette_forgee_ebrechee", "Forger une machette (lames ébréchées)", "machette_forgee", { lame_ebrechee: 2, charbon_bois: 2, branche: 1, ficelle: 1 }, "lame_ebrechee", 120),
  lame("machette_forgee_fer", "Forger une machette (fer doux)", "machette_forgee", { barre_metal: 2, charbon_bois: 2, branche: 1, ficelle: 1 }, "barre_metal", 120),
  lame("serpe", "Forger une serpe", "serpe", { ressort_lames: 1, charbon_bois: 1, branche: 1 }, "ressort_lames", 80),
  lame("serpe_soc", "Forger une serpe (soc de charrue)", "serpe", { soc_charrue: 1, charbon_bois: 1, branche: 1 }, "soc_charrue", 80),
  // La pièce de vitrine : à la forge ventilée, quand on maîtrise le couteau (serveur/src/forge.ts le vérifie).
  lame("glaive", "Forger un glaive de ressort", "glaive", { ressort_lames: 3, charbon_bois: 3, branche: 1, rivet: 2 }, "ressort_lames", 240),
  piece("pointe_lance", "Forger deux pointes de lance", "pointe_lance", 2, { ressort_lames: 1, charbon_bois: 1 }, 80),
  // Les pointes des flèches et des carreaux : du ressort, ou du fil de fer (moins bon, mais on en trouve).
  piece("pointe_acier", "Forger douze pointes d'acier", "pointe_acier", 12, { ressort_lames: 1, charbon_bois: 1 }, 45),
  piece("pointe_acier_fil", "Forger douze pointes (fil de fer)", "pointe_acier", 12, { rouleau_fil_fer: 1, charbon_bois: 1 }, 45),
  piece("rivet", "Forger vingt rivets", "rivet", 20, { barre_metal: 1, charbon_bois: 1 }, 60),
  piece("ciseau_bois", "Forger un ciseau à bois et un burin", "ciseau_bois", 1, { ressort_lames: 1, charbon_bois: 1 }, 60, { burin: 1 }),
  // L'arc des arbalètes ★★★★ (chantier 7) : il ne se fait qu'à l'huile (serveur/src/forge.ts le vérifie).
  piece("ressort_retrempe", "Forger un ressort retrempé", "ressort_retrempe", 1, { ressort_lames: 1, charbon_bois: 1 }, 60),
  // Les contacts de la matraque ★★★★ des Voltaïques (chantier 6).
  piece("electrodes_forgees", "Forger deux paires d'électrodes", "electrodes_forgees", 2, { ressort_lames: 1, charbon_bois: 1 }, 60),
  // Reforger une lame cassée (Book 25 §4.4) : la même arme, une étoile de moins, en moitié moins de temps. Le serveur
  // se souvient de la lame qui a cassé ; une lame ébréchée d'origine inconnue donne un couteau (acier ★★★).
  {
    ...lame(RECETTE_REFORGER, "Forger de nouveau une lame ébréchée", "lame_forgee", { lame_ebrechee: 1, charbon_bois: 1 }, "lame_ebrechee", 45),
    facteursEtoiles: (inventaire, contexte) => facteursLame(3, inventaire, contexte).slice(0, 2),
  },
  // La lance à pointe forgée : un épieu coiffé d'une pointe de Charbonnier. Les autres familles la leur achètent (ou
  // gardent la lance au couteau ligaturé, que tout le monde sait faire).
  {
    id: "lance_forgee",
    categorie: "outils",
    nom: "Emmancher une pointe de lance",
    produit: { objet: "lance_forgee", quantite: 1 },
    ingredients: { epieu: 1, pointe_lance: 1, ficelle: 1 },
    qualites: { couper: 1 },
    duree: 15,
    intensite: "legere",
    famille: "charbonniers",
  },
];

/** Les recettes de lames qu'on trempe (et qui peuvent se fendre à l'eau) : l'acier qui prend la trempe. */
export const LAMES_TREMPEES: ReadonlySet<string> = new Set(
  RECETTES_CHARBONNIERS.filter((r) => r.id !== RECETTE_REFORGER && r.facteursEtoiles && Object.keys(r.ingredients).some((t) => (ETOILES_ACIER[t as TypeObjet] ?? 0) >= 3)).map((r) => r.id),
);

/** Les lames qu'on emmanche : un manche tourné ⚙️ dans le sac leur donne une étoile de plus (Book 25 §4.1). */
export const LAMES_EMMANCHEES: ReadonlySet<string> = new Set(RECETTES_CHARBONNIERS.filter((r) => r.facteursEtoiles && r.id !== RECETTE_REFORGER).map((r) => r.id));

/** Les recettes qui demandent la forge ventilée (Book 25 §4.3) : la hache, le glaive. */
export const FORGE_VENTILEE_REQUISE: ReadonlySet<string> = new Set(["hache_forgee", "hache_forgee_soc", "glaive"]);

/** Le glaive se forge quand on maîtrise le couteau (10 couteaux, Book 25 §4.3). */
export const MAITRISE_REQUISE: Readonly<Record<string, { recettes: readonly string[]; nom: string }>> = {
  glaive: { recettes: ["lame_forgee", "lame_forgee_fer", "lame_forgee_lime"], nom: "le couteau" },
};

/** Les recettes qui ne se trempent qu'à l'huile. */
export const HUILE_REQUISE: ReadonlySet<string> = new Set(["ressort_retrempe"]);
