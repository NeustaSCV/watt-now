// L'arbre de progression des recettes (proposition « arbre-de-progression », décisions du porteur du 2026-10-09).
//
// Tout survivant connaît les gestes de base (Book 03 §5.2) ; il n'y **pense** qu'au bon moment. Une recette connue
// (sa famille, les communes, ce qu'il a appris) n'apparaît dans Fabriquer qu'une fois **dévoilée** : quand le
// personnage en a eu besoin, ou qu'il a tenu l'ingrédient clé. Cinq paliers, calqués sur Maslow, servent à concevoir
// et à trier (le corps, l'abri du danger, les siens puis les autres, le métier, l'œuvre) ; ce ne sont pas des niveaux.
//
// Ce fichier ne fait que des calculs purs : la table (chaque recette, son palier, ses déclencheurs « l'un ou
// l'autre », son indice), et les fonctions qui disent ce qui se dévoile. Le serveur constate les faits
// (serveur/src/devoilement.ts) ; le client affiche (chantier 5).

import { RECETTES, estApprise, estHorsFamille, recette, type Recette, type SavoirRecettes } from "./recettes.ts";
import type { TypeObjet } from "./objets.ts";
import type { Famille } from "./regles.ts";

// ---------- Les déclencheurs ----------

/** Ce qui fait penser à une recette. Tout se constate côté serveur (règle 6 de la proposition). */
export type Declencheur =
  /** D'emblée (le feu, l'abri). */
  | { a: "depart" }
  /** L'un de ces objets est entré au moins une fois dans le sac (ramassé, fouillé, démonté, fabriqué, reçu). */
  | { a: "vu"; objets: TypeObjet[] }
  /** Un fait compté (`feu_allume`, `nuit`, `detruit:gourdin`…), au moins `but` fois. */
  | { a: "fait"; fait: string; but: number }
  /** La somme des faits qui commencent par ce préfixe (« detruit: » : tous les Éteints détruits). */
  | { a: "prefixe"; prefixe: string; but: number }
  /** L'une de ces recettes a été faite (ou l'installation qu'elle pose est sur le terrain). */
  | { a: "fabrique"; recettes: string[]; but: number }
  /** La quête est en cours dans le carnet (ou déjà finie) : elle dévoile ce qu'elle demande (règle 5). */
  | { a: "quete"; quete: string }
  /** Le tutoriel a atteint cette étape (ou il est fini). */
  | { a: "tuto"; etape: number }
  /** Une installation de ce type, à ce niveau au moins (« feu » : le meilleur foyer). */
  | { a: "installation"; type: string; niveau: number }
  /** Le seuil S : l'abri posé et un premier danger surmonté (un Éteint détruit, ou une nuit), ou l'étape « La famille ». */
  | { a: "seuil" }
  /** Le déclencheur A : le Comptoir, un échange, une rencontre d'une autre famille, ou avoir vu faire quelqu'un. */
  | { a: "autres" }
  /** Plus de sac (l'effondrement l'a laissé sur place). */
  | { a: "sans_sac" }
  /** Une autre recette est déjà dévoilée. */
  | { a: "devoilee"; recette: string }
  /** Minutes de jeu connecté (le filet du temps). */
  | { a: "temps"; minutes: number }
  | { a: "et"; tous: Declencheur[] }
  | { a: "ou"; un: Declencheur[] };

export type Palier = 1 | 2 | 3 | 4 | 5;

export interface LigneProgression {
  palier: Palier;
  /** L'un ou l'autre suffit (règle 3). */
  quand: Declencheur[];
  /** La silhouette « À découvrir » : le besoin, jamais la solution ni le lieu (Book 14 §4.3). ~60 caractères. */
  indice: string;
}

const depart: Declencheur = { a: "depart" };
const vu = (...objets: TypeObjet[]): Declencheur => ({ a: "vu", objets });
const fait = (f: string, but = 1): Declencheur => ({ a: "fait", fait: f, but });
const fab = (...recettes: string[]): Declencheur => ({ a: "fabrique", recettes, but: 1 });
const quete = (q: string): Declencheur => ({ a: "quete", quete: q });
const tuto = (etape: number): Declencheur => ({ a: "tuto", etape });
const et = (...tous: Declencheur[]): Declencheur => ({ a: "et", tous });
const ou = (...un: Declencheur[]): Declencheur => ({ a: "ou", un });
const devoilee = (r: string): Declencheur => ({ a: "devoilee", recette: r });
const detruits = (but: number): Declencheur => ({ a: "prefixe", prefixe: "detruit:", but });
const SEUIL: Declencheur = { a: "seuil" };
const A: Declencheur = { a: "autres" };

/** Un arc en main (fabriqué, trouvé) : il fait penser aux flèches. */
const ARC = vu("arc_fortune", "arc_simple", "arc_if", "arc_sportif");
const ARCS_FORTUNE = fab("arc_fortune", "arc_fortune_branche");
const COUTEAUX_FORGES = fab("lame_forgee", "lame_forgee_fer", "lame_forgee_lime");
const MACHETTES_FORGEES = fab("machette_forgee", "machette_forgee_fer", "machette_forgee_ebrechee");
const MODULES = fab("module_flash", "module_raquette", "module_bobine");
const CHARBON = ou(fait("defourne"), vu("charbon_bois"));
const FLECHES_OU_CARREAUX = vu("fleche_durcie", "fleche_os", "fleche_clou", "fleche_acier", "carreau", "carreau_acier");
/** Cinq lames forgées : la pratique ouvre seule ce que la rencontre ouvre plus vite (Book 25 §2.5). */
const CINQ_LAMES: Declencheur = {
  a: "fabrique",
  recettes: ["lame_forgee", "lame_forgee_fer", "lame_forgee_lime", "machette_forgee", "machette_forgee_fer", "machette_forgee_ebrechee", "serpe", "serpe_soc", "hachette", "hache_forgee", "hache_forgee_soc", "reforger_lame"],
  but: 5,
};
const FOYER_CUISINE = ou(fait("foyer:foyer_cuisine"), { a: "installation", type: "feu", niveau: 3 });

/** Les deux cartes qui ne sont pas des recettes : le feu de camp et le foyer Dakota (dessinées à part, hud.ts). */
export const CARTES_SPECIALES = ["feu_de_camp", "foyer_dakota"] as const;
export type CarteSpeciale = (typeof CARTES_SPECIALES)[number];

/**
 * La table complète (§2.4 à §2.8 de la proposition). Chaque recette de `RECETTES` y a sa ligne (un test le vérifie).
 * Le rythme (décision Q5) : les paliers 1 et 2 viennent vite, par des gestes de la première heure ; le filet du temps
 * (`FILET_MINUTES`) les ouvre de toute façon.
 */
export const PROGRESSION: Readonly<Record<string, LigneProgression>> = {
  // ---------- Palier 1 · Le corps ----------
  feu_de_camp: { palier: 1, quand: [depart], indice: "Chaleur, eau bouillie, cuisine : tout commence là." },
  abri: { palier: 1, quand: [depart], indice: "Un toit pour dormir deux fois mieux." },
  lit_branchages: { palier: 1, quand: [fab("abri"), fait("nuit"), fait("sommeil_bas"), quete("lit")], indice: "Dormir par terre, c'est dormir à moitié." },
  ficelle: { palier: 1, quand: [vu("fibres")], indice: "Des fibres au bord de l'eau, et tes doigts." },
  corde: { palier: 1, quand: [vu("fibres")], indice: "Plus solide qu'une ficelle, pour ce qui pèse." },
  recuperateur_pluie: { palier: 1, quand: [fait("pluie"), fait("ebullition", 3), quete("eau_du_ciel")], indice: "Bouillir l'eau coûte du bois. Le ciel, lui, la donne." },
  volaille: { palier: 1, quand: [vu("poule")], indice: "Une poule, ça ne se mange pas avec les plumes." },
  cepes_poeles: { palier: 1, quand: [vu("cepe"), quete("repas")], indice: "Ce qui pousse sous les arbres, cuit, cale bien." },
  volaille_cepes: { palier: 1, quand: [et(vu("volaille_crue"), vu("cepe")), quete("repas")], indice: "Le vrai repas : de la viande et ce qui l'accompagne." },
  pommes_cuites: { palier: 1, quand: [vu("pomme"), quete("repas")], indice: "Un fruit sous la cendre devient un dessert." },
  escabeau: { palier: 1, quand: [fait("arbre_haut")], indice: "Les plus belles pommes sont toujours en haut." },
  soupe_cepes: { palier: 1, quand: [FOYER_CUISINE, quete("foyer_cuisine")], indice: "Un mijoté nourrit et désaltère à la fois." },
  pot_au_feu: { palier: 1, quand: [FOYER_CUISINE, quete("foyer_cuisine")], indice: "Ce qui mijote longtemps cale longtemps." },
  foyer_dakota: { palier: 1, quand: [vu("baton_fouir", "beche"), quete("dakota")], indice: "Un feu qui ne se voit pas de loin." },

  // ---------- Palier 2 · À l'abri du danger ----------
  hache: { palier: 2, quand: [vu("tete_hache"), tuto(5)], indice: "Une tête d'outil sans manche ne sert à rien." },
  etabli: { palier: 2, quand: [fab("hache"), vu("hache", "perche_frene")], indice: "Les gestes fins demandent un plan de travail." },
  gourdin: { palier: 2, quand: [fait("feu_allume"), fait("eteint_vu"), quete("defense")], indice: "Les poings, c'est pour les films." },
  epieu: { palier: 2, quand: [fait("eteint_vu"), fab("gourdin"), quete("defense")], indice: "Mieux vaut les tenir à distance." },
  lance: { palier: 2, quand: [fab("epieu")], indice: "Une pointe d'acier au bout du bois." },
  arc_fortune_branche: { palier: 2, quand: [detruits(1), quete("premier_arc")], indice: "Frapper de plus loin, la prochaine fois." },
  arc_fortune: { palier: 2, quand: [vu("perche_frene"), detruits(1), quete("premier_arc")], indice: "Frapper avant d'être saisi." },
  fleches_durcies: { palier: 2, quand: [ARCS_FORTUNE, ARC], indice: "Un arc sans flèches, c'est un bâton." },
  fleches_os: { palier: 2, quand: [et(vu("os"), ARC)], indice: "Une pointe plus dure que le bois." },
  fleches_clou: { palier: 2, quand: [et(vu("bocal_clous"), ARC)], indice: "Des pointes toutes faites, par douzaines." },
  baton_fouir: { palier: 2, quand: [fait("nuit"), quete("dakota")], indice: "La nuit, toute lumière se voit de loin." },
  alarme_boites: { palier: 2, quand: [et(vu("boite_vide"), ou(fait("nuit"), fait("eteint_vu"))), quete("alarme")], indice: "Être prévenu avant qu'ils arrivent." },
  pansement: { palier: 2, quand: [vu("chiffons"), fait("blessure"), quete("soins")], indice: "Un chiffon propre vaut de l'or quand ça saigne." },
  protege_bras: { palier: 2, quand: [fait("saisi"), fait("morsure"), quete("protege_bras")], indice: "Ils mordent l'avant-bras qu'on lève." },
  coffre: { palier: 2, quand: [fait("sac_lourd"), fait("nuit", 2), quete("coffre")], indice: "Quand ton sac pèsera trop lourd…" },
  sac_fortune: { palier: 2, quand: [{ a: "sans_sac" }], indice: "Sans sac, tes poches ne portent pas grand-chose." },
  travois: { palier: 2, quand: [fait("trop_lourd"), quete("travois")], indice: "Ce qu'on ne porte pas, on le traîne." },

  // ---------- Palier 3a · Les tiens : l'atelier et l'arme de base, seul ----------
  forge: { palier: 3, quand: [SEUIL], indice: "Quand tu auras un toit et tenu tête une fois…" },
  charbonniere: { palier: 3, quand: [fab("forge"), quete("charbonniere")], indice: "Ta forge aura faim d'un feu plus chaud." },
  lame_forgee_fer: { palier: 3, quand: [CHARBON, quete("lame")], indice: "Ton premier charbon, ta première lame." },
  lame_forgee: { palier: 3, quand: [et(CHARBON, vu("ressort_lames"))], indice: "Un bon acier de ressort fait une bonne lame." },
  lame_forgee_lime: { palier: 3, quand: [et(CHARBON, vu("lime_usee"))], indice: "Le meilleur acier dort dans les vieux outils." },
  machette_forgee_fer: { palier: 3, quand: [SEUIL, COUTEAUX_FORGES, quete("trempe")], indice: "Ton arme de métier : plus longue qu'un couteau." },
  machette_forgee: { palier: 3, quand: [et(COUTEAUX_FORGES, vu("ressort_lames"))], indice: "Une longue lame dans un bon acier." },
  machette_forgee_ebrechee: { palier: 3, quand: [et(COUTEAUX_FORGES, vu("lame_ebrechee"))], indice: "Deux lames cassées en font une neuve." },
  reforger_lame: { palier: 3, quand: [vu("lame_ebrechee")], indice: "Une lame cassée n'est pas perdue." },
  banc_recharge: { palier: 3, quand: [SEUIL], indice: "Quand tu auras un toit et tenu tête une fois…" },
  matraque_fortune: { palier: 3, quand: [SEUIL, fab("banc_recharge"), vu("appareil_photo_jetable")], indice: "Ton arme de métier : le silence qui mord." },
  module_flash: { palier: 3, quand: [vu("appareil_photo_jetable")], indice: "Un flash garde une belle décharge en réserve." },
  panneau_solaire: { palier: 3, quand: [vu("panneau_solaire"), quete("panneau_trouve"), quete("panneau_pose")], indice: "Le soleil donne, encore faut-il le recueillir." },
  pack_cellules: { palier: 3, quand: [vu("cellule_lithium"), quete("pack")], indice: "Des petites piles ensemble font une vraie batterie." },
  module_raquette: { palier: 3, quand: [vu("raquette_moustiques"), quete("raquette")], indice: "Ce qui grillait les moustiques peut servir encore." },
  matraque_electrique: { palier: 3, quand: [fab("pack_cellules"), MODULES, quete("raquette")], indice: "Une décharge qui les éteint pour de bon." },
  pedalier: { palier: 3, quand: [SEUIL, vu("cadre_velo"), quete("meule"), quete("dynamo")], indice: "Ce qui tourne ne meurt pas." },
  arbalete: { palier: 3, quand: [SEUIL, fab("pedalier"), quete("arbalete")], indice: "Ton arme de métier : rien à bander, tout à viser." },
  arbrier: { palier: 3, quand: [devoilee("arbalete")], indice: "Le corps de l'arme, taillé dans une bûche." },
  noix_bois: { palier: 3, quand: [devoilee("arbalete")], indice: "Ce qui retient la corde jusqu'au tir." },
  arc_arbalete_frene: { palier: 3, quand: [devoilee("arbalete")], indice: "Un arc court et raide pour l'arbalète." },
  corde_arbalete: { palier: 3, quand: [devoilee("arbalete")], indice: "Une corde doublée, pour tenir la tension." },
  arc_arbalete_ressort: { palier: 3, quand: [et(vu("ressort_lames"), devoilee("arbalete"))], indice: "Un ressort plie mieux que le bois." },
  noix_os: { palier: 3, quand: [et(vu("os"), devoilee("arbalete"))], indice: "Un os dur tient mieux qu'un bout de bois." },
  corde_arbalete_ceinture: { palier: 3, quand: [et(vu("ceinture_securite"), devoilee("arbalete"))], indice: "Une sangle faite pour ne jamais lâcher." },
  carreaux_os: { palier: 3, quand: [fab("arbalete"), devoilee("arbalete"), quete("carreau")], indice: "Une arbalète sans carreaux, c'est un meuble." },
  carreaux_clou: { palier: 3, quand: [et(vu("bocal_clous"), devoilee("arbalete"))], indice: "Des pointes toutes faites, par douzaines." },
  carreaux_papier: { palier: 3, quand: [et(vu("papier"), devoilee("arbalete"))], indice: "Pas de plumes ? Le papier vole aussi." },

  // ---------- Palier 3b · Les autres : le Comptoir, la rencontre ----------
  rivet: { palier: 3, quand: [A, MACHETTES_FORGEES, quete("fournisseur")], indice: "De petites pièces que les autres achètent." },
  pointe_acier: { palier: 3, quand: [A, MACHETTES_FORGEES, FLECHES_OU_CARREAUX], indice: "Les flèches des autres ont besoin de pointes." },
  pointe_acier_fil: { palier: 3, quand: [et(ou(A, MACHETTES_FORGEES, FLECHES_OU_CARREAUX), vu("rouleau_fil_fer"))], indice: "Du fil de fer, frappé à chaud." },
  pointe_lance: { palier: 3, quand: [A, fab("lance")], indice: "Une vraie pointe, pour une vraie lance." },
  lance_forgee: { palier: 3, quand: [fab("pointe_lance"), vu("pointe_lance")], indice: "L'épieu coiffé d'acier." },
  lampe_bricolee: { palier: 3, quand: [et(vu("led"), A), quete("courant_autres")], indice: "Une lumière à vendre aux autres familles." },
  fleches_acier: { palier: 3, quand: [vu("pointe_acier")], indice: "Une pointe d'acier perce mieux que l'os." },

  // ---------- Palier 4 · Le métier ----------
  ebauche_arc: { palier: 4, quand: [ARCS_FORTUNE, fait("tete:fleche")], indice: "Le bois vert fatigue vite : il faut un bois sec." },
  corde_arc_ficelle: { palier: 4, quand: [ARCS_FORTUNE, fait("tete:fleche")], indice: "Un arc ne vaut pas mieux que sa corde." },
  arc_simple: { palier: 4, quand: [ARCS_FORTUNE, fait("tete:fleche")], indice: "Un arc qui dure, et qui porte plus loin." },
  corde_arc_corde: { palier: 4, quand: [et(vu("corde"), devoilee("arc_simple"))], indice: "Une corde défaite fait une meilleure corde d'arc." },
  corde_arc_dentaire: { palier: 4, quand: [et(vu("fil_dentaire"), devoilee("arc_simple"))], indice: "Le fil le plus solide est dans la salle de bains." },
  corde_arc_boyau: { palier: 4, quand: [et(vu("boyaux"), devoilee("arc_simple"))], indice: "Les anciens tendaient leurs arcs autrement." },
  ebauche_if: { palier: 4, quand: [vu("baton_if")], indice: "Le meilleur bois d'arc pousse au fond du bois." },
  arc_if: { palier: 4, quand: [vu("baton_if")], indice: "Le meilleur arc, s'il sèche bien." },
  pinces_forge: { palier: 4, quand: [COUTEAUX_FORGES, quete("pinces")], indice: "Sans pinces, pas plus de deux étoiles." },
  hachette: { palier: 4, quand: [et(fab("pinces_forge"), MACHETTES_FORGEES), quete("mise_acier")], indice: "Une lame qui fend et qui se lance." },
  hache_forgee: { palier: 4, quand: [et(fab("pinces_forge"), MACHETTES_FORGEES), quete("mise_acier")], indice: "Les vieilles têtes rouillées ne durent pas." },
  hache_forgee_soc: { palier: 4, quand: [vu("soc_charrue")], indice: "Un vieil outil des champs cache un bel acier." },
  serpe_soc: { palier: 4, quand: [vu("soc_charrue")], indice: "Un vieil outil des champs cache un bel acier." },
  serpe: { palier: 4, quand: [COUTEAUX_FORGES], indice: "Une lame courbe pour élaguer." },
  ciseau_bois: { palier: 4, quand: [fab("pinces_forge")], indice: "Tailler le bois et trancher le métal." },
  module_bobine: { palier: 4, quand: [vu("bobine_allumage")], indice: "Ce qui allumait un moteur claque plus fort." },
  aiguillon: { palier: 4, quand: [et(fab("matraque_electrique", "matraque_electrodes", "matraque_manche_tourne"), fab("epieu"))], indice: "La décharge au bout d'une longue hampe." },
  alarme_electrique: { palier: 4, quand: [et(ou(vu("rouleau_fil_fer"), fab("alarme_boites")), fab("banc_recharge")), quete("alarme_electrique")], indice: "Une alarme qui ne fait pas de bruit." },
  cloture_fortune: { palier: 4, quand: [fab("module_raquette"), fab("alarme_electrique")], indice: "Un fil qui mord ceux qui passent." },
  electrificateur: { palier: 4, quand: [vu("resistance")], indice: "Une décharge qui revient sans cesse." },
  cloture_electrique: { palier: 4, quand: [fab("electrificateur")], indice: "Un vrai enclos qui se défend seul." },
  plaque_choc: { palier: 4, quand: [et(vu("casserole"), MODULES)], indice: "Le sol lui-même peut mordre." },
  bain_derouillage: { palier: 4, quand: [et(vu("casserole"), vu("machette"))], indice: "La rouille se défait, avec un peu de courant." },
  derouiller_machette: { palier: 4, quand: [fab("bain_derouillage")], indice: "Une lame rouillée retrouve son tranchant." },
  arc_arbalete_if: { palier: 4, quand: [vu("baton_if")], indice: "Le meilleur bois d'arc, en court et raide." },
  assommoir: { palier: 4, quand: [detruits(3), fab("arbalete"), quete("machoires")], indice: "Ils reviennent : qu'un piège travaille pour toi." },
  fosse_pieux: { palier: 4, quand: [vu("beche")], indice: "Un trou bien caché arrête net." },
  machoires_fortune: { palier: 4, quand: [et(fab("assommoir"), vu("ressort_lames"))], indice: "Un piège qui tient au lieu d'assommer." },
  tour_perche: { palier: 4, quand: [fab("arbalete")], indice: "Ce qui tourne façonne le bois." },
  manche_tourne: { palier: 4, quand: [fab("tour_perche")], indice: "Un manche rond et droit, fait au tour." },
  brouette: { palier: 4, quand: [et(ou(fait("trop_lourd"), fab("travois")), vu("roue_velo"))], indice: "Ce qui roule porte plus que ce qu'on traîne." },

  // ---------- Palier 5 · L'œuvre ----------
  ressort_retrempe: { palier: 5, quand: [fait("rencontre:mecanistes"), et(A, CINQ_LAMES)], indice: "Un ressort qui ne casse plus, pour d'autres que toi." },
  electrodes_forgees: { palier: 5, quand: [fait("rencontre:voltaiques"), et(A, CINQ_LAMES)], indice: "Des pointes d'acier pour ceux qui manient le courant." },
  glaive: { palier: 5, quand: [et({ a: "installation", type: "forge", niveau: 2 }, vu("rivet"))], indice: "Ta plus belle lame, quand ta forge soufflera fort." },
  matraque_electrodes: { palier: 5, quand: [vu("electrodes_forgees")], indice: "Des électrodes forgées mordent plus fort." },
  matraque_manche_tourne: { palier: 5, quand: [vu("manche_tourne")], indice: "Un manche tourné, une matraque qui dure." },
  ventilateur_forge: { palier: 5, quand: [vu("petit_moteur"), fait("rencontre:charbonniers")], indice: "Une forge souffle mieux avec un moteur." },
  noix_forgee: { palier: 5, quand: [vu("rivet")], indice: "Des rivets d'acier, une détente qui ne s'use plus." },
  arc_arbalete_retrempe: { palier: 5, quand: [vu("ressort_retrempe")], indice: "Un ressort retrempé, l'arc le plus puissant." },
  arbalete_lourde: { palier: 5, quand: [vu("ressort_retrempe")], indice: "Deux ressorts retrempés, une arme lourde." },
  piege_machoires: { palier: 5, quand: [vu("ressort_retrempe")], indice: "Des mâchoires qui ne lâchent jamais." },
  cranequin: { palier: 5, quand: [et(fab("arbalete_lourde"), vu("roulements"))], indice: "Une manivelle pour bander l'arme lourde." },
  carreaux_acier: { palier: 5, quand: [vu("pointe_acier")], indice: "Une pointe d'acier perce mieux que l'os." },
};

/** L'atelier de chaque famille : rien de son métier ne se dévoile avant lui (sauf ce qu'une quête demande). */
export const ATELIER: Readonly<Record<Famille, string>> = { charbonniers: "forge", voltaiques: "banc_recharge", mecanistes: "pedalier" };

/**
 * Le filet du temps (décision Q5 : rapide au début pour accrocher, puis un rythme régulier) : au plus tard après ces
 * minutes de jeu connecté, tout le palier est dévoilé. Le seuil S tombe de lui-même après `FILET_SEUIL_MIN`.
 */
export const FILET_MINUTES: Readonly<Partial<Record<Palier, number>>> = { 1: 20, 2: 60 };
export const FILET_SEUIL_MIN = 120;

/** Le pas (en minutes) du temps de jeu qui mérite de réévaluer les dévoilements : seuls les filets en dépendent. */
export const ECHEANCES_TEMPS: readonly number[] = [...new Set([...Object.values(FILET_MINUTES), FILET_SEUIL_MIN])].sort((a, b) => a - b);

/**
 * Les voies « de base » de la chaîne (règle 4) : quand une recette demande un ingrédient fabricable, on dévoile la
 * manière la plus simple de le faire (les variantes à matière rare viennent avec leur trouvaille).
 */
const VOIE_DE_BASE: Partial<Record<TypeObjet, string>> = {
  corde_arc: "corde_arc_ficelle",
  noix_detente: "noix_bois",
  arc_arbalete: "arc_arbalete_frene",
  lame_forgee: "lame_forgee_fer",
  machette_forgee: "machette_forgee_fer",
  module_decharge: "module_flash",
  pointe_acier: "pointe_acier",
  arc_fortune: "arc_fortune_branche",
  matraque_electrique: "matraque_electrique",
  hache_forgee: "hache_forgee",
  serpe: "serpe",
  carreau: "carreaux_os",
  // Le charbon ne sort pas d'une recette, mais de la meule de charbonnière.
  charbon_bois: "charbonniere",
  // L'ébauche sèche d'elle-même (Book 25 §3.3) : c'est l'ébauche qu'il faut savoir faire.
  ebauche_arc_seche: "ebauche_arc",
  ebauche_if_seche: "ebauche_if",
};

/** La recette qui fait cet objet, par la voie de base. */
export function recetteDeBase(objet: TypeObjet): Recette | undefined {
  const id = VOIE_DE_BASE[objet];
  if (id) return recette(id);
  return RECETTES.find((r) => "objet" in r.produit && r.produit.objet === objet);
}

/** Les maillons d'une recette : la recette de chaque ingrédient fabricable, et celle de l'installation requise. */
export function maillons(r: Recette): Recette[] {
  const liste: Recette[] = [];
  for (const t of Object.keys(r.ingredients) as TypeObjet[]) {
    const m = recetteDeBase(t);
    if (m && m.id !== r.id) liste.push(m);
  }
  if (r.installation) {
    const m = RECETTES.find((x) => "installation" in x.produit && x.produit.installation === r.installation);
    if (m) liste.push(m);
  }
  return liste;
}

// ---------- L'état qu'on regarde ----------

/** Ce que le serveur sait du personnage, pour décider ce qui se dévoile. */
export interface EtatPourDevoilement {
  famille: Famille;
  savoir?: SavoirRecettes;
  /** Les types d'objets entrés au moins une fois dans le sac. */
  vus: ReadonlySet<string>;
  /** Les faits comptés (ceux des quêtes, plus ceux de la progression). */
  faits: Readonly<Record<string, number>>;
  /** Les installations du terrain : type → meilleur niveau (« feu » : le meilleur foyer). */
  installations: ReadonlyMap<string, number>;
  /** Les quêtes en cours ou finies. */
  quetes: ReadonlySet<string>;
  /** L'étape atteinte du tutoriel (12 : fini) ; null : pas de tutoriel suivi (passé, ou compte d'avant). */
  tuto: number | null;
  minutes: number;
  sansSac: boolean;
  /** Ce qui est déjà dévoilé. */
  devoilees: ReadonlySet<string>;
}

/** Cette recette (ou carte) est-elle pour ce personnage : commune, de sa famille, ou apprise ? */
export function accessible(id: string, famille: Famille, savoir: SavoirRecettes = {}): boolean {
  const r = recette(id);
  if (!r) return (CARTES_SPECIALES as readonly string[]).includes(id);
  return !estHorsFamille(r, famille) || estApprise(r, savoir);
}

function somme(faits: Readonly<Record<string, number>>, prefixe: string): number {
  let n = 0;
  for (const [cle, v] of Object.entries(faits)) if (cle.startsWith(prefixe)) n += v;
  return n;
}

function aFabrique(e: EtatPourDevoilement, id: string): number {
  let n = e.faits[`fabrique:${id}`] ?? 0;
  const r = recette(id);
  // Une installation déjà posée compte (les personnages d'avant la 0.7 n'ont pas toujours le fait).
  if (n === 0 && r && "installation" in r.produit && e.installations.has(r.produit.installation)) n = 1;
  return n;
}

/** Le seuil S : un toit, et un premier danger surmonté ; ou l'étape « La famille » du tutoriel ; ou le filet du temps. */
export function seuilAtteint(e: EtatPourDevoilement): boolean {
  const abri = e.installations.has("abri") || (e.faits["fabrique:abri"] ?? 0) > 0;
  const danger = somme(e.faits, "detruit:") >= 1 || (e.faits.nuit ?? 0) >= 1;
  return (abri && danger) || (e.tuto !== null && e.tuto >= 9) || e.minutes >= FILET_SEUIL_MIN;
}

/** Le déclencheur A : le Comptoir, un échange, une rencontre d'une autre famille, avoir vu faire. */
export function autresAtteints(e: Pick<EtatPourDevoilement, "faits" | "famille">): boolean {
  const f = e.faits;
  if ((f["visite:comptoir"] ?? 0) > 0 || (f.echange ?? 0) > 0 || (f.vu_faire ?? 0) > 0) return true;
  for (const [cle, n] of Object.entries(f)) if (n > 0 && cle.startsWith("rencontre:") && cle !== `rencontre:${e.famille}`) return true;
  return false;
}

export function declencheurVrai(d: Declencheur, e: EtatPourDevoilement): boolean {
  switch (d.a) {
    case "depart":
      return true;
    case "vu":
      return d.objets.some((o) => e.vus.has(o));
    case "fait":
      return (e.faits[d.fait] ?? 0) >= d.but;
    case "prefixe":
      return somme(e.faits, d.prefixe) >= d.but;
    case "fabrique":
      return d.recettes.reduce((s, id) => s + aFabrique(e, id), 0) >= d.but;
    case "quete":
      return e.quetes.has(d.quete);
    case "tuto":
      return e.tuto !== null && e.tuto >= d.etape;
    case "installation":
      return (e.installations.get(d.type) ?? 0) >= d.niveau;
    case "seuil":
      return seuilAtteint(e);
    case "autres":
      return autresAtteints(e);
    case "sans_sac":
      return e.sansSac;
    case "devoilee":
      return e.devoilees.has(d.recette);
    case "temps":
      return e.minutes >= d.minutes;
    case "et":
      return d.tous.every((x) => declencheurVrai(x, e));
    case "ou":
      return d.un.some((x) => declencheurVrai(x, e));
  }
}

/** La ligne seule dit-elle oui (sans la garde du métier ni la chaîne) ? */
function ligneVraie(id: string, ligne: LigneProgression, e: EtatPourDevoilement): boolean {
  if ((e.faits[`vu_faire:${id}`] ?? 0) > 0) return true;
  // Ce qu'on a déjà fait (ou posé), on y a forcément pensé (un personnage d'avant la 0.7, Q4).
  if (recette(id) && aFabrique(e, id) > 0) return true;
  const filet = FILET_MINUTES[ligne.palier];
  if (filet !== undefined && e.minutes >= filet) return true;
  if (!ligne.quand.some((d) => declencheurVrai(d, e))) return false;
  // Le métier commence à l'atelier (§3.1) : avant lui, rien de sa famille, sauf ce qu'une quête demande (règle 5).
  const r = recette(id);
  if (r && r.famille !== "tous" && r.famille === e.famille && id !== ATELIER[e.famille] && !e.devoilees.has(ATELIER[e.famille])) {
    return ligne.quand.some((d) => d.a === "quete" && declencheurVrai(d, e));
  }
  return true;
}

/**
 * Ce qui se dévoile maintenant (dans l'ordre), chaîne comprise (règle 4). Rien ne se retire jamais : on ne renvoie
 * que du neuf. Calcul pur, en quelques passes sur une centaine de lignes : à n'appeler que quand quelque chose a changé.
 */
export function aDevoiler(e: EtatPourDevoilement): string[] {
  const devoilees = new Set(e.devoilees);
  const nouvelles: string[] = [];
  const savoir = e.savoir ?? {};
  const ajouter = (id: string) => {
    if (devoilees.has(id) || !accessible(id, e.famille, savoir)) return;
    devoilees.add(id);
    nouvelles.push(id);
    // La chaîne tire ses maillons, de proche en proche.
    const r = recette(id);
    if (r) for (const m of maillons(r)) ajouter(m.id);
  };
  // Une leçon ou un manuel dévoile en même temps qu'il apprend (§3.3).
  for (const r of RECETTES) if (estHorsFamille(r, e.famille) && estApprise(r, savoir)) ajouter(r.id);
  // Un dévoilement peut en ouvrir un autre (« une fois l'arbalète dévoilée ») : on repasse tant que ça bouge.
  for (let passe = 0; passe < 8; passe++) {
    const avant = nouvelles.length;
    const vue = { ...e, devoilees };
    for (const [id, ligne] of Object.entries(PROGRESSION)) {
      if (devoilees.has(id) || !accessible(id, e.famille, savoir)) continue;
      if (ligneVraie(id, ligne, vue)) ajouter(id);
    }
    if (nouvelles.length === avant) break;
  }
  return nouvelles;
}

/** Les recettes (et cartes) d'un palier, pour ce personnage. */
export function recettesDuPalier(palier: Palier, famille: Famille, savoir: SavoirRecettes = {}): string[] {
  return Object.entries(PROGRESSION)
    .filter(([id, l]) => l.palier === palier && accessible(id, famille, savoir))
    .map(([id]) => id);
}

/** Le vétéran qui saute le tutoriel, et les comptes créés sans tutoriel (Q8) : les paliers 1 et 2 d'emblée. */
export function devoileesDEmblee(famille: Famille): string[] {
  return [...recettesDuPalier(1, famille), ...recettesDuPalier(2, famille)];
}

/** Les recettes de départ d'un nouveau joueur : le feu et l'abri (Q3). */
export function devoileesAuDepart(): string[] {
  return Object.entries(PROGRESSION)
    .filter(([, l]) => l.quand.some((d) => d.a === "depart"))
    .map(([id]) => id);
}

/**
 * Le prochain palier (décision Q2 : les silhouettes « À découvrir » sont celles du prochain palier) : le premier palier
 * dont une recette reste à dévoiler, et ces recettes, celles que demande une quête en cours d'abord.
 */
export function prochainPalier(famille: Famille, devoilees: ReadonlySet<string>, quetes: ReadonlySet<string> = new Set(), savoir: SavoirRecettes = {}): { palier: Palier; recettes: string[] } | null {
  for (const palier of [1, 2, 3, 4, 5] as Palier[]) {
    const reste = recettesDuPalier(palier, famille, savoir).filter((id) => !devoilees.has(id));
    if (reste.length === 0) continue;
    const parQuete = (id: string) => (PROGRESSION[id]!.quand.some((d) => d.a === "quete" && quetes.has(d.quete)) ? 0 : 1);
    return { palier, recettes: reste.sort((a, b) => parQuete(a) - parQuete(b)) };
  }
  return null;
}

/**
 * Les recettes des autres familles dépliées une à une (§3.3, Q6) : on a vu quelqu'un la faire, on en tient le produit,
 * ou c'est la pièce d'une recette qu'on voit. Les autres restent repliées (en une ligne par famille) jusqu'au
 * déclencheur A, puis visibles grisées.
 */
export function entrevues(e: EtatPourDevoilement): string[] {
  const savoir = e.savoir ?? {};
  const ids = new Set<string>();
  const pieces = new Set<string>();
  for (const id of e.devoilees) {
    const r = recette(id);
    if (r) for (const m of maillons(r)) pieces.add(m.id);
  }
  for (const r of RECETTES) {
    if (!estHorsFamille(r, e.famille) || estApprise(r, savoir)) continue;
    const produit = "objet" in r.produit ? r.produit.objet : null;
    if ((e.faits[`vu_faire:${r.id}`] ?? 0) > 0 || (produit && e.vus.has(produit)) || pieces.has(r.id)) ids.add(r.id);
  }
  return [...ids];
}

// ---------- Ce que le serveur garde, et ce qu'il envoie ----------

/** L'état gardé en base, par personnage (une liste courte, bornée par le nombre de recettes et d'objets). */
export interface EtatProgression {
  /** Les recettes (et cartes) dévoilées, dans l'ordre. */
  devoilees: string[];
  /** Dévoilées, mais pas encore regardées : la pastille et l'étiquette « Nouveau ». */
  nonVues: string[];
  /** Les types d'objets entrés au moins une fois dans le sac. */
  vus: string[];
  /** Le temps de jeu connecté, en secondes (le filet du temps). */
  secondes: number;
}

export const PROGRESSION_VIDE: EtatProgression = { devoilees: [], nonVues: [], vus: [], secondes: 0 };

/** Lit un état venu de la base : ce qui n'a pas la bonne forme est ignoré ; une recette disparue est oubliée. */
export function progressionValide(x: unknown): EtatProgression {
  if (typeof x !== "object" || x === null) return { ...PROGRESSION_VIDE, devoilees: [], nonVues: [], vus: [] };
  const o = x as Record<string, unknown>;
  const chaines = (v: unknown) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === "string" && s.length <= 80) : []);
  const connues = (v: unknown) => [...new Set(chaines(v).filter((id) => PROGRESSION[id] !== undefined))];
  const devoilees = connues(o.devoilees);
  return {
    devoilees,
    nonVues: connues(o.nonVues).filter((id) => devoilees.includes(id)),
    vus: [...new Set(chaines(o.vus))].slice(0, 2000),
    secondes: typeof o.secondes === "number" && Number.isFinite(o.secondes) && o.secondes >= 0 ? o.secondes : 0,
  };
}

/** Ce que le client reçoit (bienvenue, puis à chaque changement). */
export interface VueProgression {
  devoilees: string[];
  nonVues: string[];
  /** Le prochain palier et ses recettes cachées (les silhouettes « À découvrir ») ; null : tout est dévoilé. */
  prochain: { palier: Palier; recettes: string[] } | null;
  /** Les cartes grisées des autres familles se montrent (repliées par famille) : le déclencheur A est atteint. */
  autres: boolean;
  /** Les recettes des autres familles à montrer dépliées. */
  entrevues: string[];
}

const NOM_ATELIER: Readonly<Record<Famille, string>> = { charbonniers: "le foyer de forge", voltaiques: "le banc de recharge", mecanistes: "le pédalier" };

/** « Tu y penses : … » (Q10 : on y pense, on n'apprend pas). Une seule recette, plusieurs, ou le seuil du métier. */
export function texteDevoilement(ids: readonly string[], famille: Famille): string | null {
  if (ids.length === 0) return null;
  // Le seuil du métier, une seule fois, un peu plus solennel (§4.1).
  if (ids.includes(ATELIER[famille])) return `Ton métier commence : ${NOM_ATELIER[famille]} t'attend dans Fabriquer.`;
  if (ids.length === 1) return `Tu y penses : ${nomDevoile(ids[0]!)}.`;
  return `Tu y penses : ${ids.length} idées nouvelles dans Fabriquer.`;
}

/** Le nom d'une recette ou d'une carte, en minuscule initiale, pour le message. */
export function nomDevoile(id: string): string {
  const nom = id === "feu_de_camp" ? "Feu de camp" : id === "foyer_dakota" ? "Foyer Dakota" : (recette(id)?.nom ?? id);
  return nom.charAt(0).toLowerCase() + nom.slice(1);
}

/** Tout ce qu'un personnage de cette famille peut dévoiler (les tests du métier, qui ne portent pas sur l'arbre). */
export function toutDevoile(famille: Famille): EtatProgression {
  return { ...PROGRESSION_VIDE, devoilees: Object.keys(PROGRESSION).filter((id) => accessible(id, famille)), nonVues: [], vus: [] };
}
