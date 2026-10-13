// Le niveau 1 (plan 0.8, chantier 3) : tous les objets nouveaux de la 0.8, déclarés d'un coup, pour qu'aucun autre
// chantier n'ait à toucher le catalogue (plan 0.8 §3 et §4.2). Ici, les matières et les objets qu'on fabrique ; les
// objets qu'on trouve (les clés du niveau 1, les pièces de famille, la tête de marteau…) sont des vestiges, avec leur
// famille, leur rareté et leur valeur : vestiges.ts, bloc « 0.8 ».
//
// Les recettes qui les fabriquent arrivent avec les chantiers 5 et 6 (`recettes/communes.ts`). En attendant, leur
// énergie grise est une valeur provisoire (ENERGIE_GRISE_NIVEAU1) ; dès qu'une recette les produit, c'est elle qui compte.

import type { DefinitionObjet, TypeObjet } from "./objets.ts";

/** Les matières et les objets fabriqués du niveau 1. */
export const OBJETS_NIVEAU1 = {
  // ---------- La matière du gué (H1B, B6) ----------
  glaise: {
    nom: "motte de glaise",
    pluriel: "mottes de glaise",
    poids: 2,
    description: "Une motte de glaise grise tirée de la berge du gué, lourde et grasse. Elle calfate une auge, elle chemise un four.",
  },
  // ---------- Les outils de fortune, faits à la main (§2.1) : ils donnent le niveau 1 de leur qualité ----------
  serre_joint_fortune: {
    nom: "serre-joint de fortune",
    pluriel: "serre-joints de fortune",
    poids: 1.2,
    description: "Deux branches liées d'une corde qu'on tord au bâton : elles pincent une pièce et la tiennent, sans serrer fort (Serrer 1).",
  },
  scie_fortune: {
    nom: "scie de fortune",
    pluriel: "scies de fortune",
    poids: 0.4,
    description: "Des dents de récupération, deux lames ébréchées ou un vieux disque, ligaturées sur une latte. Elle mord le bois, lentement (Scier le bois 1).",
  },
  marteau_fortune: {
    nom: "marteau de fortune",
    pluriel: "marteaux de fortune",
    poids: 2,
    description: "Une barre de métal repliée sur elle-même et serrée de fil : une tête lourde au bout d'un manche de fer. Il tape assez fort pour cercler un coffre (Marteler 2).",
  },
  coin_bois: {
    nom: "coin de bois",
    pluriel: "coins de bois",
    poids: 0.3,
    description: "Un coin de bois dur taillé en biseau. Enfoncé à coups de pierre dans le bout d'une bûche, il la fend (Fendre 1).",
  },
  // Le bâton à fouir taillé à la main, passé au feu du foyer de pierres (I24).
  baton_fouir_durci: {
    nom: "bâton à fouir durci",
    pluriel: "bâtons à fouir durcis",
    poids: 0.6,
    description: "Le bâton à fouir passé au feu du foyer de pierres : la pointe noircie ne s'émousse plus. On creuse avec (Creuser 1), et plus longtemps.",
  },
  // ---------- Les recettes de l'établi à étau (I19) ----------
  maillet: {
    nom: "maillet de bois",
    pluriel: "maillets de bois",
    poids: 0.9,
    description: "Une tête de bois dur emmanchée sur une branche, serrée à l'étau le temps que le coin prenne. Il frappe un coin sans l'éclater.",
  },
  planche_fendue: {
    nom: "planche fendue",
    pluriel: "planches fendues",
    poids: 3,
    description: "Une planche fendue dans une bûche, au coin et au maillet, puis dressée à l'étau. Rugueuse, mais droite.",
  },
} satisfies Record<string, DefinitionObjet>;

export type TypeObjetNiveau1 = keyof typeof OBJETS_NIVEAU1;

/**
 * L'énergie grise provisoire des objets ci-dessus, en wotts : elle ne sert que tant qu'aucune recette ne les produit
 * (même règle que ENERGIE_GRISE_PROVISOIRE, objets-metier.ts). La glaise, elle, n'a pas de recette : sa valeur est
 * celle de sa collecte (un geste de 6 s, plus le chemin du gué), un peu moins qu'une pierre.
 */
export const ENERGIE_GRISE_NIVEAU1: Partial<Record<TypeObjet, number>> = {
  glaise: 4,
  serre_joint_fortune: 40,
  scie_fortune: 15,
  marteau_fortune: 35,
  coin_bois: 6,
  baton_fouir_durci: 12,
  maillet: 15,
  planche_fendue: 20,
};

/**
 * Tous les identifiants créés par la 0.8 (chantier 3), fabriqués ou trouvés : les chantiers suivants s'en servent, et
 * la planche des icônes les montre à part (icones.html#niveau 1).
 */
export const NOUVEAUX_OBJETS_0_8: readonly TypeObjet[] = [
  // Trouvés : la maison (la ruine, sa caisse), H1A (les pièces de famille), L1A, L1B.
  "bidon_5l",
  "tete_marteau",
  "enclume_depanneur",
  "petit_alternateur",
  "poignee_clous",
  "seau_10l",
  "toile_jute",
  "feuillards",
  "fourche_foin",
  "cle_moulin",
  // La matière du gué.
  "glaise",
  // Fabriqués.
  "serre_joint_fortune",
  "scie_fortune",
  "marteau_fortune",
  "coin_bois",
  "baton_fouir_durci",
  "maillet",
  "planche_fendue",
];

/** Les objets nouveaux de la 0.8.2 (chantier B, R14) : les deux condensateurs, des vestiges (vestiges.ts, bloc « 0.8.2 »). */
export const NOUVEAUX_OBJETS_0_8_2: readonly TypeObjet[] = ["petit_condensateur", "condensateur_moyen"];
