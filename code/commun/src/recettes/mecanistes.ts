// ⚙️ Les recettes des Mécanistes : vieux vélo → pédalier → meule et dynamo ; et, depuis la 0.6 (Book 25 §6, chantier 7),
// l'arbalète et ses pièces, les carreaux, les pièges, le tour à perche, le cranequin, la brouette. Les accessoires du
// pédalier (ventilateur à manivelle, meule fine) se montent sur place, comme la meule (serveur/src/mecanique.ts).
// Les autres familles voient ces recettes grisées, « chez les Mécanistes » (savoir.ts).
//
// La règle d'or (Book 25 §2.5) : un Mécaniste seul monte son arbalète ★ dès le premier jour (frêne, noix de bois, scie
// et clé plate du kit), ★★ avec une lame de ressort trouvée, ★★★ avec l'if qu'il est seul à voir. Les pièces des
// Charbonniers (ressort retrempé, rivets, pointes d'acier, ciseau) ne font qu'améliorer : ★★★★, la lourde, le vrai
// piège à mâchoires, des carreaux qui cassent moins.

import type { LieuRecette, Recette } from "../recettes.ts";
import { A_LA_MAIN, POSEE, aCote } from "./lieux.ts";
import { ETOILES_ARC_ARBALETE, ETOILES_NOIX, etoilesArbrier, facteursArbalete, facteursArbaleteLourde } from "../mecanique.ts";

/** Une recette de l'arc d'arbalète : la matière fait les étoiles (frêne ★, lame brute ★★, if ★★★, retrempé ★★★★). */
function arcArbalete(id: string, nom: string, ingredients: Recette["ingredients"], etoiles: number, duree: number, couper: boolean, lieu: LieuRecette): Recette {
  return {
    id,
    lieu,
    categorie: "materiaux",
    nom,
    produit: { objet: "arc_arbalete", quantite: 1 },
    ingredients,
    // Serrer 1 : les brides qui tiennent l'arc en travers de l'arbrier (la clé plate du kit).
    qualites: couper ? { serrer: 1, couper: 1 } : { serrer: 1 },
    duree,
    intensite: "moyenne",
    famille: "mecanistes",
    facteursEtoiles: () => [etoiles],
  };
}

/** Une recette de noix et détente : bois ★★, os ★★★, acier forgé ★★★★. */
function noix(id: string, nom: string, ingredients: Recette["ingredients"], etoiles: number, marteler: boolean, lieu: LieuRecette = aCote("etabli")): Recette {
  return {
    id,
    lieu,
    categorie: "materiaux",
    nom,
    produit: { objet: "noix_detente", quantite: 1 },
    ingredients,
    qualites: marteler ? { couper: 1, marteler: 1 } : { couper: 1 },
    duree: 40,
    intensite: "legere",
    famille: "mecanistes",
    facteursEtoiles: () => [etoiles],
  };
}

/** Une recette de carreaux : des fûts courts de bois dur, un empennage, une pointe (Book 25 §6.1). */
function carreaux(id: string, nom: string, ingredients: Recette["ingredients"], objet: "carreau" | "carreau_acier", quantite: number): Recette {
  return {
    id,
    lieu: aCote("etabli"),
    categorie: "outils",
    nom,
    produit: { objet, quantite },
    ingredients,
    qualites: { couper: 1 },
    duree: 20 * (quantite / 4),
    intensite: "legere",
    famille: "mecanistes",
  };
}

export const RECETTES_MECANISTES: Recette[] = [
  {
    id: "pedalier",
    lieu: POSEE,
    categorie: "ateliers",
    nom: "Pédalier universel",
    produit: { installation: "pedalier" },
    ingredients: { cadre_velo: 1, chaine_velo: 1, roue_velo: 1, buche: 2 },
    qualites: { serrer: 1, visser: 1, marteler: 1 },
    duree: 90,
    intensite: "moyenne",
    famille: "mecanistes",
  },

  // ---------- L'arbalète (Book 25 §6.1) ----------
  {
    // Le fût : la rainure du carreau, le logement de la noix. La scie du kit suffit ; le ciseau d'un Charbonnier y
    // taille une vraie mortaise (une étoile de plus).
    id: "arbrier",
    lieu: aCote("etabli"),
    categorie: "materiaux",
    nom: "Arbrier d'arbalète",
    produit: { objet: "arbrier", quantite: 1 },
    ingredients: { buche: 1 },
    qualites: { scier_bois: 2 },
    duree: 90,
    intensite: "moyenne",
    famille: "mecanistes",
    facteursEtoiles: (inventaire) => [etoilesArbrier(inventaire)],
  },
  // La noix : une cheville de bois dur (★★), un os de poule (★★★), ou deux rivets forgés d'un Charbonnier (★★★★).
  noix("noix_bois", "Noix et détente (bois)", { petit_ressort: 1, branche: 1 }, ETOILES_NOIX.bois, false),
  noix("noix_os", "Noix et détente (os)", { petit_ressort: 1, os: 1 }, ETOILES_NOIX.os, false),
  noix("noix_forgee", "Noix et détente (rivets forgés)", { petit_ressort: 1, rivet: 2 }, ETOILES_NOIX.forgee, true, aCote("etabli", { niveau: 2 })),
  // L'arc : le bois s'use plus vite que l'acier ; la lame brute est fatiguée ; l'if est le meilleur bois ; le ressort
  // retrempé, le meilleur arc.
  arcArbalete("arc_arbalete_frene", "Arc d'arbalète (frêne)", { perche_frene: 1 }, ETOILES_ARC_ARBALETE.frene, 20, true, aCote("etabli")),
  arcArbalete("arc_arbalete_ressort", "Arc d'arbalète (lame de ressort)", { ressort_lames: 1 }, ETOILES_ARC_ARBALETE.ressort, 30, false, aCote("etabli")),
  arcArbalete("arc_arbalete_if", "Arc d'arbalète (if)", { baton_if: 1 }, ETOILES_ARC_ARBALETE.if, 40, true, aCote("etabli", { niveau: 3 })),
  arcArbalete("arc_arbalete_retrempe", "Arc d'arbalète (ressort retrempé)", { ressort_retrempe: 1 }, ETOILES_ARC_ARBALETE.retrempe, 30, false, aCote("etabli", { niveau: 2 })),
  {
    id: "corde_arbalete",
    lieu: A_LA_MAIN,
    categorie: "materiaux",
    nom: "Corde d'arbalète (cordes d'arc)",
    produit: { objet: "corde_arbalete", quantite: 1 },
    ingredients: { corde_arc: 2 },
    qualites: {},
    duree: 15,
    intensite: "legere",
    famille: "mecanistes",
  },
  {
    // La sangle d'une ceinture de sécurité, découpée et cousue en boucle : increvable.
    id: "corde_arbalete_ceinture",
    lieu: A_LA_MAIN,
    categorie: "materiaux",
    nom: "Corde d'arbalète (ceinture de sécurité)",
    produit: { objet: "corde_arbalete", quantite: 1 },
    ingredients: { ceinture_securite: 1 },
    qualites: { couper: 1 },
    duree: 15,
    intensite: "legere",
    famille: "mecanistes",
  },
  {
    // Le maillon faible de l'arbrier, de la noix et de l'arc : la moins bonne des trois fixe les étoiles.
    id: "arbalete",
    lieu: aCote("etabli"),
    categorie: "outils",
    nom: "Monter l'arbalète",
    produit: { objet: "arbalete", quantite: 1 },
    ingredients: { arbrier: 1, noix_detente: 1, arc_arbalete: 1, corde_arbalete: 1 },
    qualites: { serrer: 1 },
    duree: 30,
    intensite: "moyenne",
    famille: "mecanistes",
    facteursEtoiles: facteursArbalete,
  },
  {
    // La variante supérieure (Book 25 §7.3) : deux ressorts retrempés d'un Charbonnier, superposés. Une arme qui
    // n'existe qu'à deux familles.
    id: "arbalete_lourde",
    lieu: aCote("etabli", { niveau: 2 }),
    categorie: "outils",
    nom: "Monter l'arbalète lourde",
    produit: { objet: "arbalete_lourde", quantite: 1 },
    ingredients: { arbrier: 1, noix_detente: 1, ressort_retrempe: 2, corde_arbalete: 1 },
    qualites: { serrer: 1 },
    duree: 45,
    intensite: "moyenne",
    famille: "mecanistes",
    facteursEtoiles: facteursArbaleteLourde,
  },
  {
    // Un roulement, une chaîne de vélo, une barre : le pignon se taille à la meule du pédalier. Il réarme la lourde en
    // 4 s au lieu de 6.
    id: "cranequin",
    lieu: aCote("pedalier", { accessoire: "roulements" }),
    categorie: "outils",
    nom: "Cranequin",
    produit: { objet: "cranequin", quantite: 1 },
    ingredients: { roulements: 1, chaine_velo: 1, barre_metal: 1 },
    qualites: { serrer: 2 },
    duree: 120,
    intensite: "moyenne",
    famille: "mecanistes",
  },
  // Les carreaux : quatre par recette ; un bocal de clous arme douze pointes.
  carreaux("carreaux_os", "Carreaux à pointe d'os", { branche: 1, plumes: 1, os: 2 }, "carreau", 4),
  carreaux("carreaux_papier", "Carreaux empennés de papier", { branche: 1, papier: 2, os: 2 }, "carreau", 4),
  carreaux("carreaux_clou", "Carreaux à pointe de clou", { branche: 3, plumes: 3, bocal_clous: 1 }, "carreau", 12),
  carreaux("carreaux_acier", "Carreaux à pointe d'acier", { branche: 1, plumes: 1, pointe_acier: 4 }, "carreau_acier", 4),

  // ---------- Les pièges (Book 25 §6.3) : posés sur place, ils prennent le premier Éteint qui passe ----------
  {
    id: "assommoir",
    lieu: POSEE,
    categorie: "batir",
    nom: "Assommoir",
    produit: { installation: "assommoir" },
    ingredients: { buche: 2, corde: 1, branche: 2 },
    qualites: { couper: 1 },
    duree: 30,
    intensite: "moyenne",
    famille: "mecanistes",
  },
  {
    // La voie autonome : deux lames de ressort brutes, fatiguées. Elles tiennent 10 s et se faussent en 5 prises.
    id: "machoires_fortune",
    lieu: POSEE,
    categorie: "batir",
    nom: "Mâchoires de fortune",
    produit: { installation: "machoires_fortune" },
    ingredients: { ressort_lames: 2, barre_metal: 1, corde: 1, bocal_clous: 1 },
    qualites: { serrer: 1, marteler: 1 },
    duree: 40,
    intensite: "moyenne",
    famille: "mecanistes",
  },
  {
    // La commande type entre familles : deux ressorts retrempés du Charbonnier, la mécanique du Mécaniste.
    id: "piege_machoires",
    lieu: POSEE,
    categorie: "batir",
    nom: "Piège à mâchoires",
    produit: { installation: "piege_machoires" },
    ingredients: { ressort_retrempe: 2, barre_metal: 1, rivet: 4, chaine_velo: 1 },
    qualites: { serrer: 1, marteler: 1 },
    duree: 45,
    intensite: "moyenne",
    famille: "mecanistes",
  },
  {
    id: "fosse_pieux",
    lieu: POSEE,
    categorie: "batir",
    nom: "Fosse à pieux",
    produit: { installation: "fosse_pieux" },
    ingredients: { branche: 6 },
    qualites: { creuser: 2, couper: 1 },
    duree: 90,
    intensite: "lourde",
    famille: "mecanistes",
  },

  // ---------- Le tour et le reste (Book 25 §6.4) ----------
  {
    // Une perche de frêne en ressort au-dessus, une corde enroulée sur la pièce, une pédale : le bois tourne.
    id: "tour_perche",
    lieu: POSEE,
    categorie: "ateliers",
    nom: "Tour à perche",
    produit: { installation: "tour_perche" },
    ingredients: { perche_frene: 1, corde: 1, buche: 4, branche: 2 },
    qualites: { couper: 1, serrer: 1 },
    duree: 60,
    intensite: "moyenne",
    famille: "mecanistes",
  },
  {
    // Le manche tourné : une étoile de plus à l'arme qui le reçoit (les lames des Charbonniers, les matraques des
    // Voltaïques). Il se vend.
    id: "manche_tourne",
    lieu: aCote("tour_perche"),
    categorie: "materiaux",
    nom: "Manche tourné",
    produit: { objet: "manche_tourne", quantite: 1 },
    ingredients: { branche: 1 },
    qualites: { couper: 1 },
    duree: 25,
    intensite: "legere",
    famille: "mecanistes",
  },
  {
    id: "brouette",
    lieu: aCote("etabli"),
    categorie: "sur_soi",
    nom: "Brouette",
    produit: { objet: "brouette", quantite: 1 },
    ingredients: { roue_velo: 1, branche: 4, buche: 2 },
    qualites: { scier_bois: 1 },
    duree: 60,
    intensite: "moyenne",
    famille: "mecanistes",
  },
];
