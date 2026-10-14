// L'arbre de progression des recettes (proposition « arbre-de-progression », décisions du porteur du 2026-10-09 ;
// plan 0.8 §2.1 et §2.2, chantier 2 : la fin des paliers).
//
// Tout survivant connaît les gestes de base (Book 03 §5.2) ; il n'y **pense** qu'au bon moment. Une recette connue
// (sa famille, les communes, ce qu'il a appris) n'apparaît dans Fabriquer qu'une fois **dévoilée**. Depuis la 0.8, plus
// de paliers : chaque recette a un **lieu** (`recettes-par-construction.md` §1.1) :
// - **à la main** : elle se dévoile quand on y pense (ses déclencheurs « l'un ou l'autre »), ou au plus tard à son filet
//   du temps, porté par sa ligne ;
// - **posée** (une construction, racine d'une lignée) : par ses déclencheurs, comme avant ;
// - **à une construction** : par la construction seule, dès qu'on la possède au bon niveau.
// Les silhouettes « À découvrir » sont ce que le niveau suivant d'une construction qu'on possède ouvrirait, plus ce
// qu'une quête en cours demande. Les **clés** des niveaux (`Etape.cle`, lignees.ts) font naître une idée au premier
// ramassage (« Tu y penses »), gardée si c'est trop tôt, et un indice « où chercher » en deux temps.
//
// Ce fichier ne fait que des calculs purs. Le serveur constate les faits (serveur/src/devoilement.ts) ; le client
// affiche (client/src/fabrication-arbre.ts, la fiche d'installation de hud.ts, client/src/bandeau-idee.ts).

import { RECETTES, estApprise, faconsRecette, installationDuLieu, estHorsFamille, niveauQualite, recette, type LieuRecette, type Recette, type SavoirRecettes } from "./recettes.ts";
import { ACCESSOIRES_FEU, LIGNEES_INSTALLATIONS, PIECES_DE_FAMILLE, VOIE_CREUSEE, VOIE_SURFACE, etapeAccessoire, lignee, type AccessoireFeu, type CleEvolution, type Etape } from "./lignees.ts";
import type { Inventaire, TypeObjet } from "./objets.ts";
import { QUETE, type Condition, type Quete } from "./quetes.ts";
import type { Famille } from "./regles.ts";
import { NOMS_ACCESSOIRES, lieuPossede, nomConstruction, nomFormeFeu } from "./lieu-recette.ts";
import { ETAPE_ABRI, ETAPE_FAMILLE, ETAPE_FEU, ETAPE_OUTIL } from "./tutoriel.ts";

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
  /** Une installation de ce type, à ce niveau au moins (« feu » : le meilleur foyer ; « feu:dakota » : cette forme). */
  | { a: "installation"; type: string; niveau: number }
  /**
   * La clé d'un niveau (plan 0.8 §2.2) : l'idée en est venue, au premier `vu` de l'objet clé ou avec l'outil clé en main
   * (`etape` : l'identifiant de l'étape de lignée qui la demande).
   */
  | { a: "cle"; etape: string }
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

export interface LigneProgression {
  /** L'un ou l'autre suffit (règle 3). Sans effet pour une recette liée à une construction (la construction seule). */
  quand: Declencheur[];
  /** Le besoin, en une phrase, jamais la solution ni le lieu (Book 14 §4.3). ~60 caractères. */
  indice: string;
  /**
   * Le filet du temps d'une recette **à la main** (plan 0.8 §3, chantier 2) : au plus tard après ces minutes de jeu
   * connecté, elle se dévoile (les 20 et 60 min des anciens paliers 1 et 2, portées par la ligne).
   */
  filet?: number;
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
const MACHETTES_FORGEES = fab("machette_forgee", "machette_forgee_fer", "machette_forgee_ebrechee", "machette_forgee_caoutchouc");
// Le module de décharge unique (0.8.2, R14) : les modules « au flash » et « à la raquette » d'une partie 0.8.1 comptent
// pour lui (ANCIENNES_RECETTES).
const MODULES = fab("module_decharge", "module_bobine");
const CHARBON = ou(fait("defourne"), vu("charbon_bois"));
const FLECHES_OU_CARREAUX = vu("fleche_durcie", "fleche_os", "fleche_clou", "fleche_acier", "carreau", "carreau_acier");
/** Cinq lames forgées : la pratique ouvre seule ce que la rencontre ouvre plus vite (Book 25 §2.5). */
const CINQ_LAMES: Declencheur = {
  a: "fabrique",
  recettes: ["lame_forgee", "lame_forgee_fer", "lame_forgee_lime", "machette_forgee", "machette_forgee_fer", "machette_forgee_ebrechee", "machette_forgee_caoutchouc", "serpe", "serpe_soc", "hachette", "hache_forgee", "hache_forgee_soc", "reforger_lame"],
  but: 5,
};
const FOYER_CUISINE = ou(fait("foyer:foyer_cuisine"), { a: "installation", type: "feu", niveau: 3 });

/** Les deux cartes qui ne sont pas des recettes : le feu de camp et le foyer Dakota (dessinées à part, hud.ts). */
export const CARTES_SPECIALES = ["feu_de_camp", "foyer_dakota"] as const;
export type CarteSpeciale = (typeof CARTES_SPECIALES)[number];

/**
 * La table complète (§2.4 à §2.8 de la proposition). Chaque recette de `RECETTES` y a sa ligne (un test le vérifie).
 * Le rythme (décision Q5) : les gestes à la main de la première heure viennent vite ; leur filet du temps (`filet`) les
 * ouvre de toute façon. Les lignes des recettes liées à une construction gardent leurs déclencheurs pour mémoire : seule
 * la construction les dévoile (`Recette.lieu`).
 */
export const PROGRESSION: Readonly<Record<string, LigneProgression>> = {
  // ---------- Le corps (la grille de conception du Book 02 : plus un palier du code) ----------
  feu_de_camp: { quand: [depart], indice: "Chaleur, eau bouillie, cuisine : tout commence là." },
  abri: { quand: [depart], indice: "Un toit pour dormir deux fois mieux." },
  ficelle: { filet: 20, quand: [vu("fibres")], indice: "Des fibres au bord de l'eau, et tes doigts." },
  corde: { filet: 20, quand: [vu("fibres")], indice: "Plus solide qu'une ficelle, pour ce qui pèse." },
  recuperateur_pluie: { quand: [fait("pluie"), fait("ebullition", 3), quete("eau_du_ciel")], indice: "Bouillir l'eau coûte du bois. Le ciel, lui, la donne." },
  volaille: { filet: 20, quand: [vu("poule")], indice: "Une poule, ça ne se mange pas avec les plumes." },
  cepes_poeles: { quand: [vu("cepe"), quete("repas")], indice: "Ce qui pousse sous les arbres, cuit, cale bien." },
  volaille_cepes: { quand: [et(vu("volaille_crue"), vu("cepe")), quete("repas")], indice: "Le vrai repas : de la viande et ce qui l'accompagne." },
  pommes_cuites: { quand: [vu("pomme"), quete("repas")], indice: "Un fruit sous la cendre devient un dessert." },
  escabeau: { quand: [fait("arbre_haut")], indice: "Les plus belles pommes sont toujours en haut." },
  soupe_cepes: { quand: [FOYER_CUISINE, quete("foyer_cuisine")], indice: "Un mijoté nourrit et désaltère à la fois." },
  pot_au_feu: { quand: [FOYER_CUISINE, quete("foyer_cuisine")], indice: "Ce qui mijote longtemps cale longtemps." },
  foyer_dakota: { quand: [vu("baton_fouir", "beche"), quete("dakota")], indice: "Un feu qui ne se voit pas de loin." },

  // ---------- À l'abri du danger ----------
  // R13 (0.8.2) : remmancher se fait à l'établi ; c'est l'établi qui le dévoile (plus de filet du temps).
  hache: { quand: [vu("tete_hache"), tuto(5)], indice: "Une tête d'outil sans manche ne sert à rien." },
  // R13 (0.8.2) : la hache et le marteau se remmanchent à l'établi ; leur tête trouvée y fait penser.
  etabli: { quand: [fab("hache"), vu("hache", "perche_frene", "tete_hache", "tete_marteau")], indice: "Les gestes fins demandent un plan de travail." },
  gourdin: { filet: 60, quand: [fait("feu_allume"), fait("eteint_vu"), quete("defense")], indice: "Les poings, c'est pour les films." },
  epieu: { quand: [fait("eteint_vu"), fab("gourdin"), quete("defense")], indice: "Mieux vaut les tenir à distance." },
  lance: { filet: 60, quand: [fab("epieu")], indice: "Une pointe d'acier au bout du bois." },
  arc_fortune_branche: { filet: 60, quand: [detruits(1), quete("premier_arc")], indice: "Frapper de plus loin, la prochaine fois." },
  arc_fortune: { filet: 60, quand: [vu("perche_frene"), detruits(1), quete("premier_arc")], indice: "Frapper avant d'être saisi." },
  fleches_durcies: { quand: [ARCS_FORTUNE, ARC], indice: "Un arc sans flèches, c'est un bâton." },
  fleches_os: { filet: 60, quand: [et(vu("os"), ARC)], indice: "Une pointe plus dure que le bois." },
  fleches_clou: { filet: 60, quand: [et(vu("bocal_clous"), ARC)], indice: "Des pointes toutes faites, par douzaines." },
  baton_fouir: { quand: [fait("nuit"), quete("dakota")], indice: "La nuit, toute lumière se voit de loin." },
  // Plan 0.8 (chantier 5, I24) : le bâton à fouir passé au foyer de pierres. Seule la construction le dévoile.
  baton_fouir_durci: { quand: [fab("baton_fouir"), fait("foyer:foyer_pierres")], indice: "Une pointe passée au feu ne s'émousse plus." },
  alarme_boites: { quand: [et(vu("boite_vide"), ou(fait("nuit"), fait("eteint_vu"))), quete("alarme")], indice: "Être prévenu avant qu'ils arrivent." },
  pansement: { filet: 60, quand: [vu("chiffons"), fait("blessure"), quete("soins")], indice: "Un chiffon propre vaut de l'or quand ça saigne." },
  protege_bras: { filet: 60, quand: [fait("saisi"), fait("morsure"), quete("protege_bras")], indice: "Ils mordent l'avant-bras qu'on lève." },
  coffre: { quand: [fait("sac_lourd"), fait("nuit", 2), quete("coffre")], indice: "Quand ton sac pèsera trop lourd…" },
  sac_fortune: { filet: 60, quand: [{ a: "sans_sac" }], indice: "Sans sac, tes poches ne portent pas grand-chose." },
  travois: { filet: 60, quand: [fait("trop_lourd"), quete("travois")], indice: "Ce qu'on ne porte pas, on le traîne." },

  // ---------- Les tiens : l'atelier et l'arme de base, seul ----------
  forge: { quand: [SEUIL], indice: "Quand tu auras un toit et tenu tête une fois…" },
  charbonniere: { quand: [fab("forge"), quete("charbonniere")], indice: "Ta forge aura faim d'un feu plus chaud." },
  // La charbonnette (plan 0.8, B9, chantier 7) : la même meule, de moitié moins de bûches.
  charbonniere_charbonnette: { quand: [fab("forge"), quete("charbonniere")], indice: "Des branches refendues font aussi du charbon." },
  lame_forgee_fer: { quand: [CHARBON, quete("lame")], indice: "Ton premier charbon, ta première lame." },
  lame_forgee: { quand: [et(CHARBON, vu("ressort_lames"))], indice: "Un bon acier de ressort fait une bonne lame." },
  lame_forgee_lime: { quand: [et(CHARBON, vu("lime_usee"))], indice: "Le meilleur acier dort dans les vieux outils." },
  machette_forgee_fer: { quand: [SEUIL, COUTEAUX_FORGES, quete("trempe")], indice: "Ton arme de métier : plus longue qu'un couteau." },
  machette_forgee: { quand: [et(COUTEAUX_FORGES, vu("ressort_lames"))], indice: "Une longue lame dans un bon acier." },
  machette_forgee_ebrechee: { quand: [et(COUTEAUX_FORGES, vu("lame_ebrechee"))], indice: "Deux lames cassées en font une neuve." },
  reforger_lame: { quand: [vu("lame_ebrechee")], indice: "Une lame cassée n'est pas perdue." },
  banc_recharge: { quand: [SEUIL], indice: "Quand tu auras un toit et tenu tête une fois…" },
  matraque_fortune: { quand: [SEUIL, fab("banc_recharge"), vu("appareil_photo_jetable", "petit_condensateur")], indice: "Ton arme de métier : le silence qui mord." },
  // R14 (0.8.2) : un condensateur, celui du flash ou celui de la raquette.
  module_decharge: { quand: [vu("petit_condensateur", "condensateur_moyen", "appareil_photo_jetable", "raquette_moustiques"), quete("raquette")], indice: "Un flash garde une belle décharge en réserve." },
  pack_cellules: { quand: [vu("cellule_lithium"), quete("pack")], indice: "Des petites piles ensemble font une vraie batterie." },
  // Un pack de cellules ou la petite batterie du kit (R16, 0.8.2 : l'ancienne « matraque à la petite batterie » y est
  // fondue).
  matraque_electrique: { quand: [fab("pack_cellules"), MODULES, quete("raquette")], indice: "Une décharge qui les éteint pour de bon." },
  pedalier: { quand: [SEUIL, vu("cadre_velo"), quete("meule"), quete("dynamo")], indice: "Ce qui tourne ne meurt pas." },
  arbalete: { quand: [SEUIL, fab("pedalier"), quete("arbalete")], indice: "Ton arme de métier : rien à bander, tout à viser." },
  arbrier: { quand: [devoilee("arbalete")], indice: "Le corps de l'arme, taillé dans une bûche." },
  noix_bois: { quand: [devoilee("arbalete")], indice: "Ce qui retient la corde jusqu'au tir." },
  arc_arbalete_frene: { quand: [devoilee("arbalete")], indice: "Un arc court et raide pour l'arbalète." },
  corde_arbalete: { quand: [devoilee("arbalete")], indice: "Une corde doublée, pour tenir la tension." },
  arc_arbalete_ressort: { quand: [et(vu("ressort_lames"), devoilee("arbalete"))], indice: "Un ressort plie mieux que le bois." },
  noix_os: { quand: [et(vu("os"), devoilee("arbalete"))], indice: "Un os dur tient mieux qu'un bout de bois." },
  corde_arbalete_ceinture: { quand: [et(vu("ceinture_securite"), devoilee("arbalete"))], indice: "Une sangle faite pour ne jamais lâcher." },
  carreaux_os: { quand: [fab("arbalete"), devoilee("arbalete"), quete("carreau")], indice: "Une arbalète sans carreaux, c'est un meuble." },
  carreaux_clou: { quand: [et(vu("bocal_clous"), devoilee("arbalete"))], indice: "Des pointes toutes faites, par douzaines." },
  carreaux_papier: { quand: [et(vu("papier"), devoilee("arbalete"))], indice: "Pas de plumes ? Le papier vole aussi." },

  // ---------- Les autres : le Comptoir, la rencontre ----------
  rivet: { quand: [A, MACHETTES_FORGEES, quete("fournisseur")], indice: "De petites pièces que les autres achètent." },
  pointe_acier: { quand: [A, MACHETTES_FORGEES, FLECHES_OU_CARREAUX], indice: "Les flèches des autres ont besoin de pointes." },
  pointe_acier_fil: { quand: [et(ou(A, MACHETTES_FORGEES, FLECHES_OU_CARREAUX), vu("rouleau_fil_fer"))], indice: "Du fil de fer, frappé à chaud." },
  pointe_lance: { quand: [A, fab("lance")], indice: "Une vraie pointe, pour une vraie lance." },
  lance_forgee: { quand: [fab("pointe_lance"), vu("pointe_lance")], indice: "L'épieu coiffé d'acier." },
  lampe_bricolee: { quand: [et(vu("led"), A), quete("courant_autres")], indice: "Une lumière à vendre aux autres familles." },
  fleches_acier: { quand: [vu("pointe_acier")], indice: "Une pointe d'acier perce mieux que l'os." },

  // ---------- Le métier ----------
  ebauche_arc: { quand: [ARCS_FORTUNE, fait("tete:fleche")], indice: "Le bois vert fatigue vite : il faut un bois sec." },
  // 3 ficelles ou une corde (R15, 0.8.2) : la corde vue y fait penser aussi.
  corde_arc_ficelle: { quand: [ARCS_FORTUNE, fait("tete:fleche"), et(vu("corde"), devoilee("arc_simple"))], indice: "Un arc ne vaut pas mieux que sa corde." },
  arc_simple: { quand: [ARCS_FORTUNE, fait("tete:fleche")], indice: "Un arc qui dure, et qui porte plus loin." },
  corde_arc_dentaire: { quand: [et(vu("fil_dentaire"), devoilee("arc_simple"))], indice: "Le fil le plus solide est dans la salle de bains." },
  corde_arc_boyau: { quand: [et(vu("boyaux"), devoilee("arc_simple"))], indice: "Les anciens tendaient leurs arcs autrement." },
  ebauche_if: { quand: [vu("baton_if")], indice: "Le meilleur bois d'arc pousse au fond du bois." },
  arc_if: { quand: [vu("baton_if")], indice: "Le meilleur arc, s'il sèche bien." },
  pinces_forge: { quand: [COUTEAUX_FORGES, quete("pinces")], indice: "Sans pinces, pas plus de deux étoiles." },
  hachette: { quand: [et(fab("pinces_forge"), MACHETTES_FORGEES), quete("mise_acier")], indice: "Une lame qui fend et qui se lance." },
  hache_forgee: { quand: [et(fab("pinces_forge"), MACHETTES_FORGEES), quete("mise_acier")], indice: "Les vieilles têtes rouillées ne durent pas." },
  hache_forgee_soc: { quand: [vu("soc_charrue")], indice: "Un vieil outil des champs cache un bel acier." },
  serpe_soc: { quand: [vu("soc_charrue")], indice: "Un vieil outil des champs cache un bel acier." },
  serpe: { quand: [COUTEAUX_FORGES], indice: "Une lame courbe pour élaguer." },
  ciseau_bois: { quand: [fab("pinces_forge")], indice: "Tailler le bois et trancher le métal." },
  module_bobine: { quand: [vu("bobine_allumage")], indice: "Ce qui allumait un moteur claque plus fort." },
  aiguillon: { quand: [et(fab("matraque_electrique", "matraque_electrodes", "matraque_manche_tourne"), fab("epieu"))], indice: "La décharge au bout d'une longue hampe." },
  alarme_electrique: { quand: [et(ou(vu("rouleau_fil_fer"), fab("alarme_boites")), fab("banc_recharge")), quete("alarme_electrique")], indice: "Une alarme qui ne fait pas de bruit." },
  cloture_fortune: { quand: [et(vu("condensateur_moyen", "raquette_moustiques"), MODULES), fab("alarme_electrique")], indice: "Un fil qui mord ceux qui passent." },
  electrificateur: { quand: [vu("resistance")], indice: "Une décharge qui revient sans cesse." },
  // Plan 0.10 (chantier C) : le poste de montage monté, des cellules en main.
  pack_soude: { quand: [et(fait("niveau:poste_montage"), vu("cellule_lithium"))], indice: "Des cellules soudées tiennent mieux que du scotch." },
  cloture_electrique: { quand: [fab("electrificateur")], indice: "Un vrai enclos qui se défend seul." },
  plaque_choc: { quand: [et(vu("casserole"), MODULES)], indice: "Le sol lui-même peut mordre." },
  bain_derouillage: { quand: [et(vu("casserole"), vu("machette"))], indice: "La rouille se défait, avec un peu de courant." },
  derouiller_machette: { quand: [fab("bain_derouillage")], indice: "Une lame rouillée retrouve son tranchant." },
  arc_arbalete_if: { quand: [vu("baton_if")], indice: "Le meilleur bois d'arc, en court et raide." },
  assommoir: { quand: [detruits(3), fab("arbalete"), quete("machoires")], indice: "Ils reviennent : qu'un piège travaille pour toi." },
  fosse_pieux: { quand: [vu("beche")], indice: "Un trou bien caché arrête net." },
  machoires_fortune: { quand: [et(fab("assommoir"), vu("ressort_lames"))], indice: "Un piège qui tient au lieu d'assommer." },
  tour_perche: { quand: [fab("arbalete")], indice: "Ce qui tourne façonne le bois." },
  manche_tourne: { quand: [fab("tour_perche")], indice: "Un manche rond et droit, fait au tour." },
  brouette: { quand: [et(ou(fait("trop_lourd"), fab("travois")), vu("roue_velo"))], indice: "Ce qui roule porte plus que ce qu'on traîne." },

  // ---------- L'œuvre ----------
  ressort_retrempe: { quand: [fait("rencontre:mecanistes"), et(A, CINQ_LAMES)], indice: "Un ressort qui ne casse plus, pour d'autres que toi." },
  electrodes_forgees: { quand: [fait("rencontre:voltaiques"), et(A, CINQ_LAMES)], indice: "Des pointes d'acier pour ceux qui manient le courant." },
  glaive: { quand: [et({ a: "installation", type: "forge", niveau: 2 }, vu("rivet"))], indice: "Ta plus belle lame, quand ta forge soufflera fort." },
  matraque_electrodes: { quand: [vu("electrodes_forgees")], indice: "Des électrodes forgées mordent plus fort." },
  matraque_manche_tourne: { quand: [vu("manche_tourne")], indice: "Un manche tourné, une matraque qui dure." },
  ventilateur_forge: { quand: [vu("petit_moteur"), fait("rencontre:charbonniers")], indice: "Une forge souffle mieux avec un moteur." },
  noix_forgee: { quand: [vu("rivet")], indice: "Des rivets d'acier, une détente qui ne s'use plus." },
  arc_arbalete_retrempe: { quand: [vu("ressort_retrempe")], indice: "Un ressort retrempé, l'arc le plus puissant." },
  arbalete_lourde: { quand: [vu("ressort_retrempe")], indice: "Deux ressorts retrempés, une arme lourde." },
  piege_machoires: { quand: [vu("ressort_retrempe")], indice: "Des mâchoires qui ne lâchent jamais." },
  cranequin: { quand: [et(fab("arbalete_lourde"), vu("roulements"))], indice: "Une manivelle pour bander l'arme lourde." },
  // Le niveau 2 (plan 0.10, chantier F) : liées à une construction, la construction seule les dévoile.
  cranequin_leger: { quand: [vu("roulements")], indice: "Un arc d'if ne se bande pas à la main." },
  machette_forgee_caoutchouc: { quand: [vu("caoutchouc")], indice: "Une poignée qui ne glisse plus." },
  matraque_contacts_soudes: { quand: [vu("tube_aluminium")], indice: "Un tube creux, des contacts soudés : une vraie matraque." },
  carreaux_acier: { quand: [vu("pointe_acier")], indice: "Une pointe d'acier perce mieux que l'os." },

  // ---------- Le niveau 1 : le stockage, l'établi, la lumière, les outils de fortune (plan 0.8, chantier 6) ----------
  ratelier_outils: { quand: [fab("coffre"), fait("trop_lourd")], indice: "Tes outils pèsent : chacun pourrait avoir sa place." },
  torche_plantee: { quand: [et(vu("graisse"), fait("nuit"))], indice: "Voir autour de l'abri, la nuit, sans allumer un feu." },
  marteau: { quand: [vu("tete_marteau")], indice: "Une tête d'outil sans manche ne sert à rien." },
  serre_joint_fortune: { filet: 60, quand: [fab("etabli"), vu("etau")], indice: "Tenir une pièce quand deux mains ne suffisent pas." },
  scie_fortune: { quand: [vu("disque_scie")], indice: "Des dents d'acier mordent le bois sans bruit." },
  scie_fortune_lames: { quand: [et(vu("lame_ebrechee"), fab("etabli"))], indice: "Des dents d'acier mordent le bois sans bruit." },
  marteau_fortune: { quand: [et(vu("barre_metal"), vu("feuillards"))], indice: "Une barre repliée tape plus fort qu'une pierre." },
  coin_bois: { filet: 60, quand: [fab("etabli"), vu("buche")], indice: "Un coin bien enfoncé ouvre une bûche en deux." },
  maillet: { quand: [{ a: "installation", type: "etabli", niveau: 2 }], indice: "Frapper un coin sans le fendre." },
  coins_bois: { quand: [{ a: "installation", type: "etabli", niveau: 2 }], indice: "Un coin bien enfoncé ouvre une bûche en deux." },
  planches_fendues: { quand: [{ a: "installation", type: "etabli", niveau: 2 }], indice: "Une bûche fendue droit donne de vraies planches." },
};

/** L'atelier de chaque famille : rien de son métier ne se dévoile avant lui (sauf ce qu'une quête demande). */
export const ATELIER: Readonly<Record<Famille, string>> = { charbonniers: "forge", voltaiques: "banc_recharge", mecanistes: "pedalier" };

// ---------- Les armes de métier attendent le meuble complet (R26, plan 0.8.2, chantier J) ----------

/**
 * Les armes de métier de chaque famille, leurs pièces comprises : ⚡ les matraques et le module de décharge, 🔥 les
 * lames forgées (et la lance à pointe forgée), ⚙️ l'arbalète, ses pièces et ses carreaux. Les niveaux « plus tard » y
 * sont aussi, pour le jour où ils viendront.
 */
export const ARMES_DE_METIER: Readonly<Record<Famille, readonly string[]>> = {
  voltaiques: ["matraque_fortune", "matraque_electrique", "matraque_electrodes", "matraque_manche_tourne", "matraque_contacts_soudes", "module_decharge", "module_bobine", "aiguillon"],
  charbonniers: [
    "lame_forgee",
    "lame_forgee_fer",
    "lame_forgee_lime",
    "reforger_lame",
    "machette_forgee",
    "machette_forgee_fer",
    "machette_forgee_ebrechee",
    "machette_forgee_caoutchouc",
    "hachette",
    "hache_forgee",
    "hache_forgee_soc",
    "serpe",
    "serpe_soc",
    "glaive",
    "pointe_lance",
    "lance_forgee",
  ],
  mecanistes: [
    "arbalete",
    "arbalete_lourde",
    "arbrier",
    "noix_bois",
    "noix_os",
    "noix_forgee",
    "arc_arbalete_frene",
    "arc_arbalete_ressort",
    "arc_arbalete_if",
    "arc_arbalete_retrempe",
    "corde_arbalete",
    "corde_arbalete_ceinture",
    "carreaux_os",
    "carreaux_clou",
    "carreaux_papier",
    "carreaux_acier",
    "cranequin",
    "cranequin_leger",
  ],
};

/** Le métier de chaque arme de métier (la famille dont le meuble l'ouvre). */
const METIER_DE_L_ARME: ReadonlyMap<string, Famille> = new Map(
  (Object.entries(ARMES_DE_METIER) as [Famille, readonly string[]][]).flatMap(([f, ids]) => ids.map((id) => [id, f] as const)),
);

/** Le meuble de famille est-il complet : bâti, et équipé de sa pièce (l'enclume, le panneau, l'alternateur) ? */
export function meubleComplet(famille: Famille, installations: ReadonlyMap<string, number>): boolean {
  const type = ATELIER[famille];
  const piece = PIECES_DE_FAMILLE[type as keyof typeof PIECES_DE_FAMILLE];
  return installations.has(piece ? `${type}+${piece}` : type);
}

/**
 * R26 : une arme de métier n'existe pas pour le joueur (ni dévoilée, ni en silhouette, ni annoncée) tant que le meuble
 * de **son métier** n'est pas complet ; le repli (la pierre plate, la manivelle, la dynamo) ne suffit pas, et l'établi
 * non plus. Une arme apprise d'une autre famille (leçon, manuel) attend le meuble de son métier, et non celui de
 * l'apprenti (plan 0.8.2 §7.3 : le couteau forgé d'un Mécaniste attend la forge et son enclume, qu'il peut poser une
 * fois la forge apprise). Ce qui est déjà gardé (une partie 0.8.1) n'est pas oublié : la carte revient avec la pièce.
 */
export function armeEnAttente(id: string, installations: ReadonlyMap<string, number>): boolean {
  const metier = METIER_DE_L_ARME.get(id);
  return metier !== undefined && !meubleComplet(metier, installations);
}

/** Le seuil du métier tombe de lui-même après ces minutes de jeu (l'étape « La famille » le fait plus tôt). */
export const FILET_SEUIL_MIN = 120;

/** Le pas (en minutes) du temps de jeu qui mérite de réévaluer les dévoilements : seuls les filets en dépendent. */
export const ECHEANCES_TEMPS: readonly number[] = [
  ...new Set([...Object.values(PROGRESSION).flatMap((l) => (l.filet !== undefined ? [l.filet] : [])), FILET_SEUIL_MIN]),
].sort((a, b) => a - b);

// ---------- Le lieu d'une recette (plan 0.8 §2.1 ; le moteur : lieu-recette.ts, chantier 1) ----------

/** Les deux voies du feu, avec leur forme. */
function etapeDeForme(forme: string): { voie: readonly Etape[]; etape: Etape } | null {
  for (const voie of [VOIE_SURFACE, VOIE_CREUSEE]) {
    const etape = voie.find((x) => x.id === forme);
    if (etape) return { voie, etape };
  }
  return null;
}

/** Le nom de la construction qu'un lieu demande, en tête de phrase (« Foyer de cuisine », « Forge ventilée »). */
export function nomDuLieu(lieu: LieuRecette): string | null {
  if (lieu.genre !== "construction") return null;
  const nom = lieu.construction === "feu" ? (lieu.formes?.[0] ? nomFormeFeu(lieu.formes[0]) : (VOIE_SURFACE[(lieu.niveau ?? 1) - 1]?.nom ?? "feu de camp")) : nomConstruction(lieu.construction, lieu.niveau);
  return nom.charAt(0).toUpperCase() + nom.slice(1);
}

/** Les noms de construction au féminin (pour « À la forge ventilée »). */
const FEMININS = new Set(["forge", "réserve", "citerne", "meule", "charbonnière", "marmite", "broche", "torche", "clôture", "fosse", "plaque", "hutte", "cabane"]);

/** « Au foyer de cuisine », « À la forge ventilée », « À l'établi à étau ». */
export function aLaConstruction(nom: string): string {
  const bas = nom.charAt(0).toLowerCase() + nom.slice(1);
  if (/^[aeiouyhéèêâîôû]/i.test(bas)) return `À l'${bas}`;
  return FEMININS.has(bas.split(/[ -]/)[0]!) ? `À la ${bas}` : `Au ${bas}`;
}

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
  module_decharge: "module_decharge",
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
  // Une recette à choix (0.8.2) : les maillons de sa première façon, la plus simple.
  for (const t of Object.keys(faconsRecette(r)[0]!) as TypeObjet[]) {
    const m = recetteDeBase(t);
    if (m && m.id !== r.id) liste.push(m);
  }
  const installation = installationDuLieu(r.lieu);
  if (installation) {
    const m = RECETTES.find((x) => "installation" in x.produit && x.produit.installation === installation);
    if (m) liste.push(m);
  }
  return liste;
}

// ---------- Ce que demandent le tutoriel et le carnet (règle 5) ----------

/**
 * Les étapes du tutoriel qui demandent une fabrication (Book 14 §4.2) : le feu (étape 3), la hache (6), l'abri (7) et
 * le meuble de famille (11 : « La famille », après « La carte », plan 0.8 V5-2). Une étape atteinte dévoile ce qu'elle
 * demande : le tutoriel ne demande jamais une recette invisible.
 */
export function recettesDeLEtape(etape: number, famille: Famille): string[] {
  switch (etape) {
    case ETAPE_FEU:
      return ["feu_de_camp"];
    case ETAPE_OUTIL:
      // R13 (0.8.2) : on remmanche à l'établi ; l'étape le fait bâtir, et l'établi dévoile la hache.
      return ["etabli"];
    case ETAPE_ABRI:
      return ["abri"];
    case ETAPE_FAMILLE:
      return [ATELIER[famille]];
    default:
      return [];
  }
}

/**
 * Les faits du carnet qui demandent une fabrication : le plat cuisiné, le foyer Dakota (et son bâton à fouir), le tir à
 * la tête (les flèches, les carreaux), le charbon (la meule).
 */
const FAITS_A_FABRIQUER: Readonly<Record<string, readonly string[]>> = {
  // Q-0.8-11 : les pommes cuites (feu de camp), puis la poêlée (foyer de pierres) ; la volaille attend le four.
  plat_mange: ["pommes_cuites", "cepes_poeles", "volaille_cepes"],
  foyer_dakota: ["foyer_dakota", "baton_fouir"],
  "tete:fleche": ["fleches_durcies"],
  "tete:carreau": ["carreaux_os"],
  defourne: ["charbonniere"],
};

/** La recette qui pose cette installation. */
function recetteDInstallation(type: string): Recette | undefined {
  return RECETTES.find((r) => "installation" in r.produit && r.produit.installation === type);
}

/** Ce qu'une condition du carnet demande de fabriquer : la voie la plus simple, la première qui passe par une recette. */
function recettesDeCondition(c: Condition): string[] {
  switch (c.a) {
    case "installation": {
      const r = recetteDInstallation(c.type);
      return r ? [r.id] : [];
    }
    case "fait":
      return [...(FAITS_A_FABRIQUER[c.fait] ?? []), ...(c.fait.startsWith("fabrique:") ? [c.fait.slice("fabrique:".length)] : [])];
    case "faits": {
      const f = c.faits.find((x) => x.startsWith("fabrique:") || FAITS_A_FABRIQUER[x]);
      return f ? recettesDeCondition({ a: "fait", fait: f, but: 1 }) : [];
    }
    case "objet": {
      const r = recetteDeBase(c.types[0]!);
      return r ? [r.id] : [];
    }
    case "un_de":
      for (const x of c.conditions) {
        const ids = recettesDeCondition(x);
        if (ids.length > 0) return ids;
      }
      return [];
    default:
      return [];
  }
}

/** Ce qu'une quête du carnet demande de fabriquer (règle 5) : elle le dévoile dès qu'elle est en cours. */
export function recettesDeLaQuete(q: Quete): string[] {
  return [...new Set(q.objectifs.flatMap((o) => recettesDeCondition(o.condition)).filter((id) => PROGRESSION[id] !== undefined))];
}

/** Tout ce que demandent le tutoriel (ses étapes atteintes) et le carnet (ses quêtes en cours ou finies). */
export function recettesDemandees(e: Pick<EtatPourDevoilement, "famille" | "quetes" | "tuto">): Set<string> {
  const ids = new Set<string>();
  if (e.tuto !== null) for (let etape = 0; etape <= Math.min(e.tuto, 11); etape++) for (const id of recettesDeLEtape(etape, e.famille)) ids.add(id);
  for (const id of e.quetes) {
    const q = QUETE.get(id);
    if (q) for (const r of recettesDeLaQuete(q)) ids.add(r);
  }
  return ids;
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
  /**
   * Les constructions du terrain : type → meilleur niveau (« feu » : le meilleur foyer) ; `feu:<forme>` pour chaque forme
   * de feu qu'on a ; `<type>+<accessoire>` pour un accessoire monté (voir `lieuPossede`).
   */
  installations: ReadonlyMap<string, number>;
  /** Les quêtes en cours ou finies. */
  quetes: ReadonlySet<string>;
  /** L'étape atteinte du tutoriel (12 : fini) ; null : pas de tutoriel suivi (passé). */
  tuto: number | null;
  minutes: number;
  sansSac: boolean;
  /** Ce qui est déjà dévoilé. */
  devoilees: ReadonlySet<string>;
  /** Les étapes dont l'idée est venue (la clé ramassée une fois) : « déjà en poche » dans la fiche. */
  idees?: ReadonlySet<string>;
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

/**
 * Les recettes de la 0.8 fondues en une seule par la 0.8.2 (chantier B) : leurs faits, dans une partie 0.8.1, comptent
 * pour la recette qui les remplace (le module de décharge, la matraque électrique, la corde d'arc).
 */
export const ANCIENNES_RECETTES: Readonly<Record<string, readonly string[]>> = {
  module_decharge: ["module_flash", "module_raquette"],
  matraque_electrique: ["matraque_petite_batterie"],
  corde_arc_ficelle: ["corde_arc_corde"],
};

/** Combien de fois on a fait cette recette, ses anciennes formes comprises (la maîtrise, les déclencheurs). */
export function nombreFabriques(faits: Readonly<Record<string, number>>, id: string): number {
  let n = faits[`fabrique:${id}`] ?? 0;
  for (const ancienne of ANCIENNES_RECETTES[id] ?? []) n += faits[`fabrique:${ancienne}`] ?? 0;
  return n;
}

function aFabrique(e: EtatPourDevoilement, id: string): number {
  let n = nombreFabriques(e.faits, id);
  const r = recette(id);
  // Une installation déjà posée compte, même sans le fait.
  if (n === 0 && r && "installation" in r.produit && e.installations.has(r.produit.installation)) n = 1;
  return n;
}

/** Le seuil S : un toit, et un premier danger surmonté ; ou l'étape « La famille » du tutoriel ; ou le filet du temps. */
export function seuilAtteint(e: EtatPourDevoilement): boolean {
  const abri = e.installations.has("abri") || (e.faits["fabrique:abri"] ?? 0) > 0;
  // L'élève du tutoriel : le seuil tombe exactement à l'étape « La famille » (§2.6), pas trois étapes plus tôt parce
  // que l'Éteint du tutoriel (étape 8) suit l'abri (étape 7). Une nuit dormie hors du script compte toujours.
  const enTutoriel = e.tuto !== null && e.tuto < 12;
  const danger = (!enTutoriel && somme(e.faits, "detruit:") >= 1) || (e.faits.nuit ?? 0) >= 1;
  return (abri && danger) || (e.tuto !== null && e.tuto >= ETAPE_FAMILLE) || e.minutes >= FILET_SEUIL_MIN;
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
    case "cle":
      return e.idees?.has(d.etape) ?? false;
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

/** La ligne seule dit-elle oui (sans la chaîne) ? */
function ligneVraie(id: string, ligne: LigneProgression, e: EtatPourDevoilement, demandees: ReadonlySet<string>): boolean {
  const r = recette(id);
  // Ce qu'on a déjà fait (ou posé), on y a forcément pensé.
  if (r && aFabrique(e, id) > 0) return true;
  const lieu = r ? r.lieu : null;
  // Liée à une construction : la construction seule la dévoile (plan 0.8 §2.1).
  if (lieu?.genre === "construction") return lieuPossede(lieu, e.installations);
  if ((e.faits[`vu_faire:${id}`] ?? 0) > 0) return true;
  // Le tutoriel et le carnet ne demandent jamais une recette invisible (règle 5), même avant l'atelier.
  if (demandees.has(id)) return true;
  // Le filet du temps, porté par la ligne : les recettes à la main seulement.
  if (lieu?.genre === "main" && ligne.filet !== undefined && e.minutes >= ligne.filet) return true;
  if (!ligne.quand.some((d) => declencheurVrai(d, e))) return false;
  // Le métier commence à l'atelier (§3.1) : avant lui, rien de sa famille, sauf ce qu'une quête demande (règle 5).
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
  const ajouter = (id: string, parLaChaine: boolean) => {
    if (devoilees.has(id) || !accessible(id, e.famille, savoir)) return;
    // R26 : une arme de métier attend le meuble de famille complet, même tirée par la chaîne ou demandée.
    if (armeEnAttente(id, e.installations)) return;
    const r = recette(id);
    // La chaîne ne tire pas une recette liée à une construction qu'on n'a pas : elle attend sa construction.
    if (parLaChaine && r && !lieuPossede(r.lieu, e.installations)) return;
    devoilees.add(id);
    nouvelles.push(id);
    // La chaîne tire ses maillons, de proche en proche.
    if (r) for (const m of maillons(r)) ajouter(m.id, true);
  };
  // Une leçon ou un manuel dévoile en même temps qu'il apprend (§3.3).
  for (const r of RECETTES) if (estHorsFamille(r, e.famille) && estApprise(r, savoir)) ajouter(r.id, false);
  const demandees = recettesDemandees(e);
  // Une recette demandée qui attend sa construction reste en silhouette, mais ce qu'il faut pour y arriver (la
  // construction à poser, ses ingrédients) se dévoile : le carnet ne mène jamais à une impasse invisible (règle 5).
  for (const id of demandees) {
    const r = recette(id);
    if (r && accessible(id, e.famille, savoir) && !lieuPossede(r.lieu, e.installations)) for (const m of maillons(r)) ajouter(m.id, true);
  }
  // Un dévoilement peut en ouvrir un autre (« une fois l'arbalète dévoilée ») : on repasse tant que ça bouge.
  for (let passe = 0; passe < 8; passe++) {
    const avant = nouvelles.length;
    const vue = { ...e, devoilees };
    for (const [id, ligne] of Object.entries(PROGRESSION)) {
      if (devoilees.has(id) || !accessible(id, e.famille, savoir)) continue;
      if (ligneVraie(id, ligne, vue, demandees)) ajouter(id, false);
    }
    if (nouvelles.length === avant) break;
  }
  return nouvelles;
}

/**
 * Le vétéran qui saute le tutoriel, et les comptes créés sans tutoriel (Q8, plan 0.8 §3) : les recettes communes **à la
 * main** d'emblée. Les recettes liées à une construction arrivent avec la construction.
 */
export function devoileesDEmblee(famille: Famille): string[] {
  return Object.keys(PROGRESSION).filter((id) => {
    const r = recette(id);
    return r !== undefined && r.famille === "tous" && accessible(id, famille) && r.lieu.genre === "main";
  });
}

/** Le message du vétéran (Q-0.8-15) : il doit encore aller chercher la pièce de sa famille à la station. */
export const TEXTE_VETERAN = "Tu y penses : les gestes de base te reviennent tous. Ta famille t'attend à la station.";

/** Les recettes de départ d'un nouveau joueur : le feu et l'abri (Q3). */
export function devoileesAuDepart(): string[] {
  return Object.entries(PROGRESSION)
    .filter(([, l]) => l.quand.some((d) => d.a === "depart"))
    .map(([id]) => id);
}

// ---------- Les silhouettes « À découvrir » (plan 0.8 §3, chantier 2) ----------

/** Une recette encore cachée, et la construction qui l'ouvrira (« Au foyer de cuisine »). */
export interface SilhouetteVue {
  id: string;
  /** « Au foyer de cuisine », « À la forge ventilée » : où elle se fera. */
  ou: string;
  /** Une quête en cours la demande. */
  quete?: true;
}

/** Ce que le niveau suivant de chaque construction possédée ajouterait à la carte des constructions. */
function niveauxSuivants(installations: ReadonlyMap<string, number>): { nom: string; avec: Map<string, number> }[] {
  const suivants: { nom: string; avec: Map<string, number> }[] = [];
  for (const [cle, niveau] of installations) {
    if (cle.startsWith("feu:")) {
      const f = etapeDeForme(cle.slice(4));
      const suivante = f ? f.voie[f.etape.niveau] : undefined;
      if (!suivante) continue;
      const avec = new Map(installations);
      avec.set(`feu:${suivante.id}`, 1);
      avec.set("feu", Math.max(avec.get("feu") ?? 0, suivante.niveau));
      suivants.push({ nom: suivante.nom, avec });
    } else if (!cle.includes("+") && cle !== "feu") {
      const suivante = lignee(cle)?.[niveau];
      if (!suivante) continue;
      suivants.push({ nom: suivante.nom, avec: new Map(installations).set(cle, niveau + 1) });
    }
  }
  return suivants;
}

/**
 * Les silhouettes : ce que **le niveau suivant** d'une construction qu'on possède ouvrirait (« Au foyer de cuisine : soupe
 * de cèpes »), plus ce qu'une quête en cours demande et qui attend une construction. Celles de la quête d'abord.
 */
export function silhouettes(e: EtatPourDevoilement): SilhouetteVue[] {
  const savoir = e.savoir ?? {};
  const liste: SilhouetteVue[] = [];
  const deja = new Set<string>();
  // R26 : pas de silhouette d'arme de métier avant le meuble complet (pas même celle qu'une quête demande).
  const cachee = (id: string) => !e.devoilees.has(id) && !deja.has(id) && accessible(id, e.famille, savoir) && !armeEnAttente(id, e.installations);
  for (const id of recettesDemandees(e)) {
    const r = recette(id);
    if (!r || !cachee(id)) continue;
    const lieu = r.lieu;
    const nom = nomDuLieu(lieu);
    if (!nom || lieuPossede(lieu, e.installations)) continue;
    const avec = lieu.genre === "construction" && lieu.accessoire ? `, avec ${NOMS_ACCESSOIRES[lieu.accessoire] ?? lieu.accessoire}` : "";
    liste.push({ id, ou: `${aLaConstruction(nom)}${avec}`, quete: true });
    deja.add(id);
  }
  const suivants = niveauxSuivants(e.installations);
  for (const id of Object.keys(PROGRESSION)) {
    const r = recette(id);
    if (!r || r.aVenir || !cachee(id)) continue;
    const lieu = r.lieu;
    if (lieu.genre !== "construction" || lieuPossede(lieu, e.installations)) continue;
    // La construction d'abord (sans son accessoire) : déjà là, ou au niveau suivant d'une qu'on a.
    const sansAccessoire: LieuRecette = { ...lieu, accessoire: undefined };
    const nom = lieuPossede(sansAccessoire, e.installations) ? nomDuLieu(lieu) : (suivants.find((x) => lieuPossede(sansAccessoire, x.avec))?.nom ?? null);
    if (!nom) continue;
    // Puis l'accessoire qui manque (« Au foyer de forge, avec un bac de trempe »).
    const avec = lieu.accessoire ? `, avec ${NOMS_ACCESSOIRES[lieu.accessoire] ?? lieu.accessoire}` : "";
    liste.push({ id, ou: `${aLaConstruction(nom)}${avec}` });
    deja.add(id);
  }
  return liste;
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

// ---------- Les clés : l'idée au ramassage et l'indice en deux temps (plan 0.8 §2.2) ----------

/** Après ce temps de jeu (minutes) sans la clé, l'indice passe au second temps (Q-0.8-16). */
export const INDICE_SECOND_TEMPS_MIN = 45;

/** Une étape de lignée qui a une clé, et sa construction (« feu », ou le type d'installation). */
export interface EtapeAvecCle {
  construction: string;
  etape: Etape & { cle: CleEvolution };
}

let etapesCle: EtapeAvecCle[] | null = null;

/** Toutes les étapes à clé des lignées (le feu, puis les installations), relevées une fois (les lignées sont fixes). */
export function etapesAvecCle(): EtapeAvecCle[] {
  if (etapesCle) return etapesCle;
  const liste: EtapeAvecCle[] = [];
  const ajouter = (construction: string, etapes: readonly Etape[]) => {
    for (const etape of etapes) if (etape.cle) liste.push({ construction, etape: etape as Etape & { cle: CleEvolution } });
  };
  ajouter("feu", VOIE_SURFACE);
  ajouter("feu", VOIE_CREUSEE);
  for (const [type, etapes] of Object.entries(LIGNEES_INSTALLATIONS)) if (etapes) ajouter(type, etapes);
  // Les accessoires du feu à clé (la marmite norvégienne, chantier 5) : « feu+marmite », un cran au-dessus des foyers.
  for (const def of Object.values(ACCESSOIRES_FEU)) if (def.cle) ajouter(`feu+${def.id}`, [etapeAccessoire(def)]);
  etapesCle = liste;
  return liste;
}

export function etapeAvecCle(id: string): EtapeAvecCle | undefined {
  return etapesAvecCle().find((x) => x.etape.id === id);
}

/** Le niveau qu'on a dans la voie de cette étape (0 : rien de cette lignée). Pour le feu : la voie de surface ou creusée. */
export function niveauPossede(x: EtapeAvecCle, installations: ReadonlyMap<string, number>): number {
  // Un accessoire du feu : 2 s'il est monté, 1 si l'on a un foyer qui l'accepte, sinon 0.
  if (x.construction.startsWith("feu+")) {
    const def = ACCESSOIRES_FEU[x.construction.slice(4) as AccessoireFeu];
    if (installations.has(x.construction)) return 2;
    return def?.formes.some((f) => installations.has(`feu:${f}`)) ? 1 : 0;
  }
  // Un meuble de famille ne compte au niveau de sa clé qu'une fois sa pièce posée (plan 0.8 §9.2) : `forge+enclume`,
  // `banc_recharge+panneau`, `pedalier+alternateur` dans la carte des constructions.
  const piece = PIECES_DE_FAMILLE[x.construction as keyof typeof PIECES_DE_FAMILLE];
  if (piece && x.etape.niveau === 1) return installations.has(`${x.construction}+${piece}`) ? 1 : 0;
  if (x.construction !== "feu") return installations.get(x.construction) ?? 0;
  const voie = VOIE_SURFACE.some((v) => v.id === x.etape.id) ? VOIE_SURFACE : VOIE_CREUSEE;
  return Math.max(0, ...voie.filter((v) => installations.has(`feu:${v.id}`)).map((v) => v.niveau));
}

/** La clé est-elle là : l'objet entré une fois dans le sac, ou l'outil en main (sa qualité au niveau demandé) ? */
export function cleTenue(c: CleEvolution, vus: ReadonlySet<string>, inventaire: Inventaire): boolean {
  if (c.objet && vus.has(c.objet)) return true;
  return c.qualite !== undefined && niveauQualite(inventaire, c.qualite.qualite) >= c.qualite.niveau;
}

/** Une idée qui vient : on la garde toujours ; on ne la dit qu'une fois par trouvaille (`texte` null : gardée en silence). */
export interface IdeeNouvelle {
  etape: string;
  /** Le niveau d'avant n'est pas posé : « un jour ». */
  plusTard: boolean;
  texte: string | null;
  objet?: TypeObjet;
}

/**
 * Les idées qui viennent maintenant (jamais deux fois : `idees` les garde). « Une trouvaille, plusieurs idées » : pour un
 * même objet, le message cite la plus proche (celle dont le niveau d'avant est posé, sinon la plus basse) ; les autres
 * sont gardées en silence. Un niveau déjà construit (par un repli) est gardé sans message.
 */
export function nouvellesIdees(e: Pick<EtatPourDevoilement, "vus" | "installations"> & { idees: ReadonlySet<string>; inventaire: Inventaire }): IdeeNouvelle[] {
  const venues = etapesAvecCle()
    .filter((x) => !e.idees.has(x.etape.id) && cleTenue(x.etape.cle, e.vus, e.inventaire))
    .map((x) => {
      const a = niveauPossede(x, e.installations);
      return { x, a, plusTard: x.etape.niveau > 1 && a < x.etape.niveau - 1, faite: a >= x.etape.niveau };
    })
    .sort((p, q) => Number(p.plusTard) - Number(q.plusTard) || p.x.etape.niveau - q.x.etape.niveau);
  const dites = new Set<string>();
  return venues.map(({ x, plusTard, faite }) => {
    const cle = x.etape.cle;
    const quoi = cle.objet ?? `${cle.qualite?.qualite}`;
    const dire = !faite && !dites.has(quoi);
    if (dire) dites.add(quoi);
    const texte = dire ? (plusTard ? cle.ideePlusTard || cle.idee : cle.idee) : null;
    return { etape: x.etape.id, plusTard, texte, ...(cle.objet ? { objet: cle.objet } : {}) };
  });
}

/**
 * Les indices « où chercher » ouverts : les étapes à clé qui sont **le niveau suivant** d'une construction qu'on a (ou,
 * au niveau 1, dont la construction est dévoilée), pas encore jouables exceptées, et dont la clé n'est pas venue.
 */
export function indicesOuverts(e: Pick<EtatPourDevoilement, "installations" | "devoilees"> & { idees: ReadonlySet<string> }): EtapeAvecCle[] {
  return etapesAvecCle().filter((x) => {
    if (e.idees.has(x.etape.id) || x.etape.aVenir) return false;
    const a = niveauPossede(x, e.installations);
    if (a >= x.etape.niveau) return false;
    if (x.etape.niveau === 1) return x.construction !== "feu" && RECETTES.some((r) => "installation" in r.produit && r.produit.installation === x.construction && e.devoilees.has(r.id));
    return a >= x.etape.niveau - 1;
  });
}

// ---------- Ce que le serveur garde, et ce qu'il envoie ----------

/** L'indice d'une étape : depuis quand il est ouvert (secondes de jeu), et son temps (1 : le type de lieu ; 2 : le coin). */
export interface EtatIndice {
  depuis: number;
  temps: 1 | 2;
}

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
  /** Les idées gardées : les étapes dont la clé est venue une fois (jamais redites). */
  idees: string[];
  /** Les indices ouverts, par étape. */
  indices: Record<string, EtatIndice>;
}

export const PROGRESSION_VIDE: EtatProgression = { devoilees: [], nonVues: [], vus: [], secondes: 0, idees: [], indices: {} };

/** Lit un état venu de la base : ce qui n'a pas la bonne forme est ignoré ; une recette disparue est oubliée. */
export function progressionValide(x: unknown): EtatProgression {
  if (typeof x !== "object" || x === null) return { ...PROGRESSION_VIDE, devoilees: [], nonVues: [], vus: [], idees: [], indices: {} };
  const o = x as Record<string, unknown>;
  const chaines = (v: unknown) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === "string" && s.length <= 80) : []);
  const connues = (v: unknown) => [...new Set(chaines(v).filter((id) => PROGRESSION[id] !== undefined))];
  const devoilees = connues(o.devoilees);
  const indices: Record<string, EtatIndice> = {};
  if (typeof o.indices === "object" && o.indices !== null) {
    for (const [id, v] of Object.entries(o.indices as Record<string, unknown>).slice(0, 200)) {
      const i = v as Partial<EtatIndice> | null;
      if (id.length <= 80 && i && typeof i.depuis === "number" && Number.isFinite(i.depuis) && (i.temps === 1 || i.temps === 2)) indices[id] = { depuis: i.depuis, temps: i.temps };
    }
  }
  return {
    devoilees,
    nonVues: connues(o.nonVues).filter((id) => devoilees.includes(id)),
    vus: [...new Set(chaines(o.vus))].slice(0, 2000),
    secondes: typeof o.secondes === "number" && Number.isFinite(o.secondes) && o.secondes >= 0 ? o.secondes : 0,
    idees: [...new Set(chaines(o.idees))].slice(0, 200),
    indices,
  };
}

/** Ce que le client reçoit (bienvenue, puis à chaque changement). */
export interface VueProgression {
  devoilees: string[];
  nonVues: string[];
  /** Les silhouettes « À découvrir » : ce que le niveau suivant d'une construction ouvrirait, et ce que demande une quête. */
  silhouettes: SilhouetteVue[];
  /** Les cartes grisées des autres familles se montrent (repliées par famille) : le déclencheur A est atteint. */
  autres: boolean;
  /** Les recettes des autres familles à montrer dépliées. */
  entrevues: string[];
  /** Les idées gardées (étapes de lignée) : la fiche montre leur clé « déjà en poche ». */
  idees: string[];
  /** Le temps de l'indice de chaque étape ouverte (1 : le type de lieu ; 2 : le coin). */
  indices: Record<string, 1 | 2>;
}

// Les noms de la 0.8 (un seul nom par meuble) : le banc solaire, le pédalier générateur.
const NOM_ATELIER: Readonly<Record<Famille, string>> = { charbonniers: "le foyer de forge", voltaiques: "le banc solaire", mecanistes: "le pédalier générateur" };

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
  return { ...PROGRESSION_VIDE, devoilees: Object.keys(PROGRESSION).filter((id) => accessible(id, famille)), nonVues: [], vus: [], idees: [], indices: {} };
}
