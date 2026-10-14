// ⚙️ Les recettes des Mécanistes : le vélo de la ruine → pédalier générateur (le petit alternateur de la station, ou la
// dynamo du vélo) → meule ; et, depuis la 0.6 (Book 25 §6, chantier 7),
// l'arbalète et ses pièces, les carreaux, les pièges, le tour à perche, le cranequin, la brouette. Les accessoires du
// pédalier (ventilateur à manivelle, meule fine) se montent sur place, comme la meule (serveur/src/mecanique.ts).
// Les autres familles voient ces recettes grisées, « chez les Mécanistes » (savoir.ts).
//
// La règle d'or (Book 25 §2.5) : un Mécaniste seul monte son arbalète ★ dès le premier jour (frêne, noix de bois, scie
// et clé plate du kit), ★★ avec une lame de ressort trouvée, ★★★ avec l'if qu'il est seul à voir. Les pièces des
// Charbonniers (ressort retrempé, rivets, pointes d'acier, ciseau) ne font qu'améliorer : ★★★★, la lourde, le vrai
// piège à mâchoires, des carreaux qui cassent moins.

import type { AVenir } from "../lignees.ts";
import type { LieuRecette, Recette } from "../recettes.ts";
import { A_LA_MAIN, POSEE, aCote } from "./lieux.ts";
import { ETOILES_ARC_ARBALETE, ETOILES_NOIX, etoilesArbrier, facteursArbalete, facteursArbaleteLourde } from "../mecanique.ts";

/** Une recette qui attend un niveau absent de la 0.8 (plan 0.8 §1.3) : grisée « plus tard », refusée par le serveur. */
function plusTard(r: Recette, a: AVenir): Recette {
  return { ...r, aVenir: a };
}

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

/**
 * Une recette de carreaux : des fûts courts de bois dur, un empennage, une pointe (Book 25 §6.1). `auChoix` : l'empennage,
 * de plumes ou, depuis la 0.10 (N2-39), de plastique découpé dans une bouteille.
 */
function carreaux(id: string, nom: string, ingredients: Recette["ingredients"], objet: "carreau" | "carreau_acier", quantite: number, auChoix?: Recette["auChoix"]): Recette {
  return {
    id,
    lieu: aCote("etabli"),
    categorie: "outils",
    nom,
    produit: { objet, quantite },
    ingredients,
    ...(auChoix ? { auChoix } : {}),
    qualites: { couper: 1 },
    duree: 20 * (quantite / 4),
    intensite: "legere",
    famille: "mecanistes",
  };
}

export const RECETTES_MECANISTES: Recette[] = [
  {
    // Le pédalier générateur (plan 0.8, chantier 7) : le vélo de la ruine sur un bâti. Le petit alternateur de la
    // station s'y monte ensuite (« monter l'alternateur », serveur/src/mecanique.ts) ; sinon, la dynamo du vélo.
    id: "pedalier",
    lieu: POSEE,
    categorie: "ateliers",
    nom: "Pédalier générateur",
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
    // taille une vraie mortaise (une étoile de plus). Depuis la 0.10 (N2-38), un tube d'aluminium, plus léger que le
    // bois, fait aussi l'affaire : la bûche passe d'abord.
    id: "arbrier",
    lieu: aCote("etabli"),
    categorie: "materiaux",
    nom: "Arbrier d'arbalète",
    produit: { objet: "arbrier", quantite: 1 },
    ingredients: {},
    auChoix: [{ buche: 1 }, { tube_aluminium: 1 }],
    qualites: { scier_bois: 2 },
    duree: 90,
    intensite: "moyenne",
    famille: "mecanistes",
    facteursEtoiles: (inventaire) => [etoilesArbrier(inventaire)],
  },
  // La noix : une cheville de bois dur (★★), un os de poule (★★★), ou deux rivets forgés d'un Charbonnier (★★★★).
  noix("noix_bois", "Noix et détente (bois)", { petit_ressort: 1, branche: 1 }, ETOILES_NOIX.bois, false),
  noix("noix_os", "Noix et détente (os)", { petit_ressort: 1, os: 1 }, ETOILES_NOIX.os, false),
  // Plan 0.8 §1.3 (I19) : la noix forgée, l'arc retrempé et l'arbalète lourde sont du niveau 3, grisés. L'arc en if
  // (★★★) se façonne à l'établi à étau depuis la 0.10 (N2-31) : c'est le cranequin léger qui ouvre l'arbalète ★★★.
  plusTard(noix("noix_forgee", "Noix et détente (rivets forgés)", { petit_ressort: 1, rivet: 2 }, ETOILES_NOIX.forgee, true, aCote("etabli", { niveau: 2 })), "niveau 3"),
  // L'arc : le bois s'use plus vite que l'acier ; la lame brute est fatiguée ; l'if est le meilleur bois ; le ressort
  // retrempé, le meilleur arc.
  arcArbalete("arc_arbalete_frene", "Arc d'arbalète (frêne)", { perche_frene: 1 }, ETOILES_ARC_ARBALETE.frene, 20, true, aCote("etabli")),
  arcArbalete("arc_arbalete_ressort", "Arc d'arbalète (lame de ressort)", { ressort_lames: 1 }, ETOILES_ARC_ARBALETE.ressort, 30, false, aCote("etabli")),
  arcArbalete("arc_arbalete_if", "Arc d'arbalète (if)", { baton_if: 1 }, ETOILES_ARC_ARBALETE.if, 40, true, aCote("etabli", { niveau: 2 })),
  plusTard(arcArbalete("arc_arbalete_retrempe", "Arc d'arbalète (ressort retrempé)", { ressort_retrempe: 1 }, ETOILES_ARC_ARBALETE.retrempe, 30, false, aCote("etabli", { niveau: 2 })), "niveau 3"),
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
    // Le maillon faible de l'arbrier, de la noix et de l'arc : la moins bonne des trois fixe les étoiles. Un arc d'if ne se
    // bande pas à la main : le monter demande un cranequin léger dans le sac (N2-32, `refusMontageArbalete`).
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
    note: "Avec un arc d'if, il faut aussi un cranequin léger dans le sac : un tel arc ne se bande pas à la main.",
  },
  {
    // La variante supérieure (Book 25 §7.3) : deux ressorts retrempés d'un Charbonnier, superposés. Une arme qui
    // n'existe qu'à deux familles.
    id: "arbalete_lourde",
    aVenir: "niveau 3",
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
    // 4 s au lieu de 6. Il la suit au niveau 3 (plan 0.10, N2-Q1) : au niveau 2, c'est le cranequin léger.
    id: "cranequin",
    aVenir: "niveau 3",
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
  // ---------- Le niveau 2 (plan 0.10, chantier F) ----------
  {
    // Le cranequin léger (N2-33, P9) : un roulement, une chaîne de vélo, une barre, au pédalier équipé des roulements
    // montés (la boîte de roulements de L2A). L'arbalète à arc d'if en a besoin ; il réarme toute arbalète légère en 2 s
    // au lieu de 3 (`plusViteAvec`, tir.ts).
    id: "cranequin_leger",
    lieu: aCote("pedalier", { accessoire: "roulements" }),
    categorie: "outils",
    nom: "Cranequin léger",
    produit: { objet: "cranequin_leger", quantite: 1 },
    ingredients: { roulements: 1, chaine_velo: 1, barre_metal: 1 },
    qualites: { serrer: 2 },
    duree: 90,
    intensite: "moyenne",
    famille: "mecanistes",
  },
  // Les carreaux : quatre par recette ; un bocal de clous arme douze pointes.
  // L'empennage : des plumes, ou du plastique découpé dans une bouteille (plan 0.10, N2-39) ; les plumes passent d'abord.
  carreaux("carreaux_os", "Carreaux à pointe d'os", { branche: 1, os: 2 }, "carreau", 4, [{ plumes: 1 }, { plastique: 1 }]),
  carreaux("carreaux_papier", "Carreaux empennés de papier", { branche: 1, papier: 2, os: 2 }, "carreau", 4),
  carreaux("carreaux_clou", "Carreaux à pointe de clou", { branche: 3, bocal_clous: 1 }, "carreau", 12, [{ plumes: 3 }, { plastique: 3 }]),
  carreaux("carreaux_acier", "Carreaux à pointe d'acier", { branche: 1, pointe_acier: 4 }, "carreau_acier", 4, [{ plumes: 1 }, { plastique: 1 }]),

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

  // ---------- Les meubles nouveaux du niveau 2, chantier D (plan 0.10 ; N2-46 à N2-48) : avec les roulements montés ----------
  {
    // La charrette à bras (S-27) : la brouette, avec 100 kg roulés au lieu de 60. Deux roulements neufs sur les moyeux.
    id: "charrette_bras",
    lieu: aCote("pedalier", { accessoire: "roulements" }),
    categorie: "sur_soi",
    nom: "Charrette à bras",
    produit: { objet: "charrette_bras", quantite: 1 },
    ingredients: { roue_velo: 2, roulements: 2, tube_aluminium: 4, buche: 2 },
    qualites: { serrer: 2 },
    duree: 120,
    intensite: "moyenne",
    famille: "mecanistes",
  },
  {
    // Le moulin de jerricans (S-28), une éolienne Savonius : 15 W quand il vente, 5 W par temps voilé, rien au calme, au
    // calendrier, même hors ligne, vers la batterie de la base. La poulie d'aluminium des Charbonniers : + 50 %.
    id: "moulin_jerricans",
    lieu: POSEE,
    categorie: "ateliers",
    nom: "Moulin de jerricans",
    produit: { installation: "moulin_jerricans" },
    ingredients: { jerrican: 2, tube_aluminium: 3, roulements: 1, petit_moteur: 1 },
    qualites: { serrer: 2 },
    duree: 120,
    intensite: "moyenne",
    famille: "mecanistes",
  },
  {
    // L'arbalète de garde (S-29) : un piège, comme l'assommoir ; le premier Éteint qui passe le fil, à 1 m devant elle,
    // reçoit un carreau (les dégâts de l'arbalète posée). Jamais un joueur (N2-Q5). On la réarme : 2 s au cranequin léger.
    id: "arbalete_garde",
    lieu: POSEE,
    categorie: "batir",
    nom: "Arbalète de garde",
    produit: { installation: "arbalete_garde" },
    ingredients: { arbalete: 1, tube_aluminium: 1, rouleau_fil_fer: 1, petit_ressort: 1 },
    qualites: { serrer: 1 },
    duree: 45,
    intensite: "legere",
    famille: "mecanistes",
  },
];
