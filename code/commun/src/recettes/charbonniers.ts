// 🔥 Les recettes des Charbonniers : bois → charbonnière → forge → lames (Book 21 §3.4, Book 25 §4).
// Toute la gamme se fait seul (Book 25 §2.5) ; ce que les autres familles apportent (le manche tourné ⚙️, le
// ventilateur ⚡) n'est qu'une amélioration. Les autres familles voient ces recettes grisées, « chez les Charbonniers ».
//
// La qualité d'une lame est le maillon faible de l'acier, de la trempe et de la forge (commun/src/forge.ts) : chaque
// matière a sa recette (« Forger une machette », « … (fer doux) », « … (lames ébréchées) »), parce qu'une recette n'a
// qu'une liste d'ingrédients. Le serveur fait la trempe, le reforgeage et le manche tourné (serveur/src/forge.ts).
//
// Les demi-mesures du Book 25 §4.3 (½ barre, ½ ressort, ½ kg de charbon) sont doublées, et la recette en donne deux.

import type { AVenir } from "../lignees.ts";
import type { Inventaire, TypeObjet } from "../objets.ts";
import type { LieuRecette, Recette } from "../recettes.ts";
import { ETOILES_ACIER, facteursLame } from "../forge.ts";
import { A_LA_MAIN, POSEE, aCote } from "./lieux.ts";

// Les lieux de la forge (`recettes-par-construction.md` §4.1, plan 0.8 Q-0.8-2) : chauffer et étirer au foyer de forge ;
// tremper l'acier au bac de trempe ; tremper doux à l'huile (la graisse du sac, ou l'huile du bac) ; souder à la forge
// ventilée. Ils remplacent les listes `FORGE_VENTILEE_REQUISE` et `HUILE_REQUISE` d'avant la 0.8.
/** Le foyer de forge : le fer doux, les petites pièces. */
const FOYER_DE_FORGE = aCote("forge");
/** Le bac de trempe posé au pied de la forge : une lame d'acier n'existe pas sans son bain. */
const AU_BAC = aCote("forge", { accessoire: "bac" });
/** La trempe douce : de l'huile dans le bac, ou de la graisse dans le sac. */
const A_L_HUILE = aCote("forge", { accessoire: "huile" });
/** La forge ventilée (niveau 2) : souder la mise d'acier ; la trempe toujours au bac. */
const FORGE_VENTILEE = aCote("forge", { niveau: 2, accessoire: "bac" });

/** Une recette qui attend un niveau absent de la 0.8 (plan 0.8 §1.3) : grisée « plus tard », refusée par le serveur. */
function plusTard(r: Recette, a: AVenir): Recette {
  return { ...r, aVenir: a };
}

/** Une lame forgée : à la forge (son lieu), Marteler 2, travail lourd ; ses étoiles suivent l'acier, la trempe et la forge. */
function lame(id: string, nom: string, objet: TypeObjet, ingredients: Inventaire, acier: TypeObjet, duree: number, lieu: LieuRecette, quantite = 1): Recette {
  const etoilesAcier = ETOILES_ACIER[acier] ?? 3;
  return {
    id,
    lieu,
    categorie: "outils",
    nom,
    produit: { objet, quantite },
    ingredients,
    qualites: { marteler: 2 },
    duree,
    intensite: "lourde",
    famille: "charbonniers",
    facteursEtoiles: (inventaire, contexte) => facteursLame(etoilesAcier, inventaire, contexte),
  };
}

/** Une pièce de forge sans étoiles (pinces, pointes, rivets…) : à la forge (son lieu), Marteler 2. */
function piece(id: string, nom: string, objet: TypeObjet, quantite: number, ingredients: Inventaire, duree: number, lieu: LieuRecette, sousProduits?: Inventaire): Recette {
  return {
    id,
    lieu,
    categorie: "outils",
    nom,
    produit: { objet, quantite },
    ...(sousProduits ? { sousProduits } : {}),
    ingredients,
    qualites: { marteler: 2 },
    duree,
    intensite: "lourde",
    famille: "charbonniers",
  };
}

/** Le manche ficelé (une branche et de la ficelle) glisse dans la main : la lame ne passe pas ★★ (plan 0.10, N2-35). */
export const ETOILES_MANCHE_FICELE = 2;

/** Une lame au manche ficelé : un maillon de plus, à ★★. */
function mancheFicele(r: Recette): Recette {
  const facteurs = r.facteursEtoiles!;
  return { ...r, facteursEtoiles: (inventaire, contexte, facon) => [...facteurs(inventaire, contexte, facon), ETOILES_MANCHE_FICELE] };
}

/** La recette qui reforge une lame ébréchée : la même arme, une étoile de moins (Book 25 §4.4). */
export const RECETTE_REFORGER = "reforger_lame";

export const RECETTES_CHARBONNIERS: Recette[] = [
  {
    id: "charbonniere",
    lieu: POSEE,
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
    // La charbonnette (plan 0.8, B9) : la meule se monte aussi de moitié moins de bûches et d'un fagot de branches
    // refendues. Les mêmes quatre charbons au défournement.
    id: "charbonniere_charbonnette",
    lieu: POSEE,
    categorie: "ateliers",
    nom: "Meule de charbonnière (charbonnette)",
    produit: { installation: "charbonniere" },
    ingredients: { buche: 5, branche: 20 },
    qualites: {},
    duree: 60,
    intensite: "lourde",
    famille: "charbonniers",
  },
  {
    id: "forge",
    lieu: POSEE,
    categorie: "ateliers",
    nom: "Foyer de forge",
    produit: { installation: "forge" },
    ingredients: { pierre: 8, barre_metal: 1, branche: 2 },
    qualites: { marteler: 1 },
    duree: 90,
    intensite: "lourde",
    famille: "charbonniers",
  },
  // Le premier outil du forgeron : sans pinces, pas plus de ★★.
  piece("pinces_forge", "Forger des pinces de forge", "pinces_forge", 1, { barre_metal: 1, charbon_bois: 1 }, 40, FOYER_DE_FORGE),
  // Le couteau de forge : la « lame forgée » d'avant, emmanchée sur une branche (même identifiant).
  lame("lame_forgee", "Forger un couteau", "lame_forgee", { ressort_lames: 1, charbon_bois: 1, branche: 1 }, "ressort_lames", 105, AU_BAC),
  lame("lame_forgee_fer", "Forger un couteau (fer doux)", "lame_forgee", { barre_metal: 1, charbon_bois: 1, branche: 1 }, "barre_metal", 105, FOYER_DE_FORGE),
  lame("lame_forgee_lime", "Forger un couteau (lime usée)", "lame_forgee", { lime_usee: 1, charbon_bois: 1, branche: 1 }, "lime_usee", 105, AU_BAC),
  // La mise d'acier : un tranchant de ressort soudé sur un corps de fer. Deux hachettes pour une barre et un ressort.
  // Au foyer de forge, à ★★ (plan 0.8, Q-0.8-2) ; l'acier se trempe au bac.
  lame("hachette", "Forger deux hachettes", "hachette", { barre_metal: 1, ressort_lames: 1, charbon_bois: 2, branche: 2 }, "ressort_lames", 150, AU_BAC, 2),
  // La hache et le glaive se forgent à la forge ventilée (niveau 2, sa clé : le soufflet de forge). Depuis la 0.10
  // (N2-35), leur manche est tourné de caoutchouc, une chambre à air : la poignée ne glisse plus.
  lame("hache_forgee", "Forger une hache", "hache_forgee", { barre_metal: 1, ressort_lames: 1, charbon_bois: 2, caoutchouc: 2 }, "ressort_lames", 120, FORGE_VENTILEE),
  lame("hache_forgee_soc", "Forger une hache (soc de charrue)", "hache_forgee", { soc_charrue: 1, charbon_bois: 2, caoutchouc: 2 }, "soc_charrue", 120, FORGE_VENTILEE),
  // L'arme de métier (Book 25 §8.4) : la machette forgée, solide. Le manche ficelé ; un manche tourné ⚙️ : +1 étoile.
  // Depuis la 0.10 (N2-35), le manche ficelé glisse : ★★ au plus (la maîtrise et le manche tourné en donnent toujours une
  // de plus) ; la machette ★★★ de la forge ventilée a son manche tourné de caoutchouc.
  mancheFicele(lame("machette_forgee", "Forger une machette", "machette_forgee", { ressort_lames: 2, charbon_bois: 2, branche: 1, ficelle: 1 }, "ressort_lames", 120, AU_BAC)),
  mancheFicele(lame("machette_forgee_ebrechee", "Forger une machette (lames ébréchées)", "machette_forgee", { lame_ebrechee: 2, charbon_bois: 2, branche: 1, ficelle: 1 }, "lame_ebrechee", 120, AU_BAC)),
  mancheFicele(lame("machette_forgee_fer", "Forger une machette (fer doux)", "machette_forgee", { barre_metal: 2, charbon_bois: 2, branche: 1, ficelle: 1 }, "barre_metal", 120, FOYER_DE_FORGE)),
  lame("machette_forgee_caoutchouc", "Forger une machette (manche de caoutchouc)", "machette_forgee", { ressort_lames: 2, charbon_bois: 2, caoutchouc: 2 }, "ressort_lames", 120, FORGE_VENTILEE),
  lame("serpe", "Forger une serpe", "serpe", { ressort_lames: 1, charbon_bois: 1, branche: 1 }, "ressort_lames", 80, AU_BAC),
  lame("serpe_soc", "Forger une serpe (soc de charrue)", "serpe", { soc_charrue: 1, charbon_bois: 1, branche: 1 }, "soc_charrue", 80, AU_BAC),
  // La pièce de vitrine : à la forge ventilée (son lieu), quand on maîtrise le couteau (serveur/src/forge.ts le vérifie).
  lame("glaive", "Forger un glaive de ressort", "glaive", { ressort_lames: 3, charbon_bois: 3, caoutchouc: 2, rivet: 2 }, "ressort_lames", 240, FORGE_VENTILEE),
  piece("pointe_lance", "Forger deux pointes de lance", "pointe_lance", 2, { ressort_lames: 1, charbon_bois: 1 }, 80, FOYER_DE_FORGE),
  // Les pointes des flèches et des carreaux : du ressort, ou du fil de fer (moins bon, mais on en trouve).
  piece("pointe_acier", "Forger douze pointes d'acier", "pointe_acier", 12, { ressort_lames: 1, charbon_bois: 1 }, 45, FOYER_DE_FORGE),
  piece("pointe_acier_fil", "Forger douze pointes (fil de fer)", "pointe_acier", 12, { rouleau_fil_fer: 1, charbon_bois: 1 }, 45, FOYER_DE_FORGE),
  piece("rivet", "Forger vingt rivets", "rivet", 20, { barre_metal: 1, charbon_bois: 1 }, 60, FOYER_DE_FORGE),
  piece("ciseau_bois", "Forger un ciseau à bois et un burin", "ciseau_bois", 1, { ressort_lames: 1, charbon_bois: 1 }, 60, AU_BAC, { burin: 1 }),
  // L'arc des arbalètes ★★★★ (chantier 7) : il ne se fait qu'à l'huile (son lieu). La trempe douce et l'arbalète
  // lourde sont du niveau 3 (plan 0.8 §1.3, Q-A2d) : grisé « plus tard ».
  plusTard(piece("ressort_retrempe", "Forger un ressort retrempé", "ressort_retrempe", 1, { ressort_lames: 1, charbon_bois: 1 }, 60, A_L_HUILE), "niveau 3"),
  // Les contacts de la matraque ★★★★ des Voltaïques (chantier 6).
  piece("electrodes_forgees", "Forger deux paires d'électrodes", "electrodes_forgees", 2, { ressort_lames: 1, charbon_bois: 1 }, 60, FOYER_DE_FORGE),
  // Reforger une lame cassée (Book 25 §4.4) : la même arme, une étoile de moins, en moitié moins de temps. Le serveur
  // se souvient de la lame qui a cassé ; une lame ébréchée d'origine inconnue donne un couteau (acier ★★★).
  {
    ...lame(RECETTE_REFORGER, "Forger de nouveau une lame ébréchée", "lame_forgee", { lame_ebrechee: 1, charbon_bois: 1 }, "lame_ebrechee", 45, AU_BAC),
    facteursEtoiles: (inventaire, contexte) => facteursLame(3, inventaire, contexte).slice(0, 2),
  },
  // La lance à pointe forgée : un épieu coiffé d'une pointe de Charbonnier. Les autres familles la leur achètent (ou
  // gardent la lance au couteau ligaturé, que tout le monde sait faire).
  {
    id: "lance_forgee",
    lieu: A_LA_MAIN,
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

/** Le glaive se forge quand on maîtrise le couteau (10 couteaux, Book 25 §4.3). */
export const MAITRISE_REQUISE: Readonly<Record<string, { recettes: readonly string[]; nom: string }>> = {
  glaive: { recettes: ["lame_forgee", "lame_forgee_fer", "lame_forgee_lime"], nom: "le couteau" },
};
