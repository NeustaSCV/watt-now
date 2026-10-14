// Le simulateur de rythme (0.7, chantier 6 ; décision Q5 de l'arbre de progression ; plan 0.8, chantier 14) : des
// parcours types, joués minute par minute de jeu connecté, pour chiffrer le temps entre deux recettes dévoilées, entre
// deux buts, entre deux portes, et ce que coûtent en bois et en pierre les constructions jusqu'au niveau 1.
//
// « Rapide au début pour accrocher, puis un bon rythme qui donne régulièrement des choses nouvelles et des buts. »
// La cible : dans la première demi-heure, une nouveauté (une recette, ou un but nouveau) toutes les 3 minutes en
// moyenne, et jamais 5 minutes sans rien ; puis un but nouveau au moins toutes les 20 minutes tant que le carnet a
// quelque chose à proposer. Au pas du joueur : le prudent, plus lent, a d'autant plus de marge.
//
// Un parcours est une suite d'activités (le tutoriel, ou son équivalent pour qui le saute, puis les quêtes du carnet,
// une par ligne, et les portes du niveau 1). Le monde fait le reste à heures fixes : un Éteint vu, la pluie, la
// fatigue, un sac lourd… Le dévoilement est calculé par la vraie fonction du jeu (`aDevoiler`), les ingrédients
// viennent des vraies tables (trouvables.ts) et les fouilles sont tirées dans les vraies tables de fouille et de
// déchets, avec une graine fixe : deux lancements donnent le même rapport. Les durées sont des estimations de joueur (à
// caler au test familial).
//
// Depuis la 0.8 (chantier 14), le simulateur ne suppose plus rien de ce qui se construit :
// - **les constructions** : chaque niveau se paie (ses coûts de `lignees.ts`), les formes du feu se bâtissent l'une
//   après l'autre (le foyer de pierres sur le feu de camp, le poêle-fusée sur le Dakota), les accessoires aussi (la
//   broche, la marmite, le bac de trempe, la meule du pédalier) et le meuble de famille attend sa pièce ;
// - **les clés** ne se ramassent qu'en allant dans leur lieu (la station, le gué, la Coopérative, le Moulin) : une
//   **sortie**, avec sa durée, ses fouilles tirées au sort (et la clé rare de R-BUTIN), son vrac et ses tas personnels ;
// - **le bois et la pierre** se comptent (plan 0.8 §2.7) : le terrain a ses 16 bûches et ses 26 pierres, qui ne
//   reviennent pas, ses branches qui repoussent ; le feu brûle des branches ; quand il manque des bûches, c'est un
//   aller-retour de **ravitaillement** à la station ; s'il en manque encore, le Comptoir ;
// - **à plusieurs** (`simulerServeur`), les haltes sont partagées : le vrac grandit avec les présents (B8), chacun a son
//   tas de bois et son banc de galets ; on rejoue les joueurs côte à côte jusqu'à ce que leurs prises s'accordent.
//
// Ce que le carnet du niveau 1 dira (« S'installer » en portes successives, chantier 13) est simulé ici par la ligne des
// **portes** : le niveau 1 de chaque meuble, dans l'ordre du parcours (§1.1 du plan). Le simulateur relève aussi les
// **blocages** : une recette que le tutoriel ou une quête demande et qui n'est jamais dévoilée, un ingrédient
// introuvable, une porte qu'on ne peut pas franchir. Calcul pur, sans état global ; il ne tourne jamais en jeu.
//
// Plan 0.10 (chantier M) : **le niveau 2**, joué à la suite de la première soirée par la même simulation
// (`jouerParcoursN2`) : les portes du niveau 2 (`postesNiveau2` : les dix évolutions, les meubles nouveaux, les étagères,
// le métier ★★★), les sorties à l'hôtel par la route du pont et au phare par la corniche, **le péage** à l'aller
// seulement (12 wotts, une heure de passage libre ; le retour toujours libre, V2-01), **le check-in** (la durée de la
// visite de l'hôtel), **le feu du phare la nuit** (on part pour l'allumer à la nuit tombée ; le cargo 2 min après), les
// objets-clés et les outils du niveau 2 (le rabot, le fer à souder), **les boîtes de roulements** (trois roulements
// chacune, V1-01 ; le Comptoir en vend s'il en manque), le bois (le pin tombé de la corniche, le tas de la station), la
// glaise du gué. Le budget des matières et de l'énergie est à côté : rythme-niveau2.ts.

import { DEMONTAGE, LIEU_DE_FOUILLE, etapeButin, tirerCleRare, tirerVestiges, type EtapeButin, type LieuFouille } from "./vestiges.ts";
import { aleaDe, contenuConteneur, graineDe, piecesAmas, type TypeLieuDechets } from "./dechets.ts";
import { tableDecharge } from "./decharge.ts";
import { LIEU_DES_CLES, PRIX_CLES_L1, REASSORT_MS, STOCK_DE_BASE } from "./economie.ts";
import { COUT_BAC } from "./forge.ts";
import { CHARBON_PRODUIT, MS_JOUR_CALENDRIER, productionPanneau } from "./energie.ts";
import { REGLAGES } from "./reglages.ts";
import { BUTIN_GUE } from "./gue.ts";
import { BUTIN_HALTE } from "./halte.ts";
import { ETAPES_LIEUX, LIEUX_NIVEAU_2, lieuDeLEtape, type LieuId } from "./lieux.ts";
import { SEMIS_CORNICHE } from "./corniche-contenu.ts";
import { SEMIS_ROUTE_PONT } from "./route-pont.ts";
import { DUREE_PASSAGE_MS, PRIX_PASSAGE, type Passage as PassagePeage } from "./peage.ts";
import { ACCESSOIRES_DE_NIVEAU } from "./meubles-niveau2.ts";
import { COUT_CREUSET, NIVEAU_FORGE_CREUSET } from "./meubles-neufs.ts";
import { HEURE_DEPART, HEURE_TOMBEE_NUIT, estNuit } from "./temps.ts";
import { CAPACITE_BROUETTE, CAPACITE_SAC, CAPACITE_TRAVOIS, OBJETS, type Inventaire, type TypeObjet } from "./objets.ts";
import { ATELIER, aDevoiler, devoileesAuDepart, devoileesDEmblee, etapesAvecCle, nomDuLieu, recetteDeBase, recettesDeLEtape, type EtatPourDevoilement } from "./progression.ts";
import type { LieuRecette } from "./recettes.ts";
import { lieuPossede } from "./lieu-recette.ts";
import { ACCESSOIRES_FEU, PIECES_DE_FAMILLE, VOIE_CREUSEE, VOIE_SURFACE, lignee, type AccessoireFeu, type EtapeMonde, type FormeFeu } from "./lignees.ts";
import { QUETES, queteSuivante, type Condition, type LigneQuete, type Quete } from "./quetes.ts";
import { QUALITES_OBJETS, RECETTES, faconsRecette, recette, type Qualite, type Recette } from "./recettes.ts";
import type { Famille } from "./regles.ts";
import { SEMIS, semisDe, type LieuSemis, type SemisLieu } from "./semis.ts";
import { REPOUSSE_MS, USAGES, genererRessources, vracEnJeu } from "./terrain.ts";
import { trouvables, type Source } from "./trouvables.ts";
import { etapesTutoriel } from "./tutoriel.ts";

// ---------- Les parcours types ----------

export type Profil = "prudent" | "presse" | "sans_tuto" | "malchanceux";

export interface DefinitionProfil {
  nom: string;
  /** Le temps que prend chaque activité, par rapport à un joueur moyen. */
  facteur: number;
  tuto: boolean;
  /** L'ordre dans lequel il suit les lignes du carnet (et la ligne des portes du niveau 1). */
  lignes: LigneSimulee[];
  /** Fouilles par sortie (station, Coopérative). */
  fouilles: number;
  /** Il ramasse au passage (des joncs, un cèpe, une poule). */
  curieux: boolean;
  /** Il dort chaque nuit dans son abri ; sinon, une nuit sur deux. */
  dortChaqueNuit: boolean;
  /** La route qu'il prend d'abord au niveau 1 (§1.1, sortie 3) : la Coopérative (A) ou le Moulin (B). */
  route: "A" | "B";
  /**
   * Le gué (H1B) : « parcours », il y va en sortie 2 comme le parcours visé (§1.1), même s'il n'en a pas besoin ;
   * « besoin », seulement pour ce qui lui manque (la glaise, des pierres), sinon en passant, sur la route du Moulin.
   */
  gue: "parcours" | "besoin";
  /**
   * La malchance (`avis-game-designer.md` §5.2, « le pire cas ») : le vrac des haltes a toujours été vidé juste avant
   * lui (il n'a que ses tas personnels), et la chance ne lui donne jamais de clé rare.
   */
  malchance: boolean;
}

/**
 * Comment le carnet mène aux portes du niveau 1 : « d'abord », le carnet nomme la porte suivante et le joueur la passe
 * avant ses autres quêtes (« S'installer » en portes successives, §2.6, ce que le chantier 13 écrit) ; « alternées »,
 * la ligne des portes n'est qu'une ligne de plus, à son tour, à côté de la ligne « S'installer » de la 0.7.
 */
export type ConduiteDesPortes = "dabord" | "alternees";

/** Une ligne du carnet, ou la ligne des portes du niveau 1 (simulée, en attendant les quêtes du chantier 13). */
export type LigneSimulee = LigneQuete | "portes";

export const PROFILS: Readonly<Record<Profil, DefinitionProfil>> = {
  prudent: { nom: "Le joueur prudent", facteur: 1.3, tuto: true, lignes: ["installer", "portes", "metier", "autres"], fouilles: 4, curieux: true, dortChaqueNuit: true, route: "A", gue: "parcours", malchance: false },
  presse: { nom: "Le joueur pressé", facteur: 0.75, tuto: true, lignes: ["metier", "portes", "installer", "autres"], fouilles: 1, curieux: false, dortChaqueNuit: false, route: "B", gue: "besoin", malchance: false },
  sans_tuto: { nom: "Le joueur qui saute le tutoriel", facteur: 1, tuto: false, lignes: ["metier", "portes", "installer", "autres"], fouilles: 2, curieux: false, dortChaqueNuit: true, route: "A", gue: "besoin", malchance: false },
  malchanceux: { nom: "Le joueur malchanceux", facteur: 1, tuto: true, lignes: ["installer", "portes", "metier", "autres"], fouilles: 2, curieux: false, dortChaqueNuit: true, route: "A", gue: "parcours", malchance: true },
};

/** La durée de jeu simulée (minutes de jeu connecté) : une première soirée, et un peu plus. */
export const HORIZON_MIN = 360;

/** La cible du rythme (décision Q5 ; plan 0.8 §5, critères 6 et 11). */
export const CIBLE = {
  /** La première demi-heure : une nouveauté (recette ou but) toutes les 3 minutes en moyenne… */
  debutMin: 30,
  nouveautesDebutMin: 10,
  /** … et jamais plus de 5 minutes sans rien de neuf. */
  trouDebutMax: 5,
  /** Ensuite : un but nouveau au moins toutes les 20 minutes, tant que le carnet a de quoi proposer. */
  ecartButsMax: 20,
  /** La première sortie avant 60 minutes (critère 11). */
  premiereSortieMax: 60,
  /** Au plus une sortie sur quatre sans porte dans les trois premières heures (critère 11). */
  sansPorteMax: 0.25,
  troisHeures: 180,
  /** Tout le niveau 1 en ≈ 3 h 20 pour le prudent (critère 6). */
  niveau1Prudent: 200,
} as const;

/** Le tutoriel, pour un joueur moyen : la durée de chaque étape, par son titre (≈ 45 min en tout, proposition §2.9). */
const DUREES_TUTO: Readonly<Record<string, number>> = {
  "L'arrivée": 3,
  Ramasser: 3,
  "Le feu": 4,
  "L'eau": 4,
  "Le vestige": 5,
  // R13 (0.8.2) : bâtir un établi avant de remmancher la hache.
  "L'outil": 4,
  "L'abri": 4,
  "Le premier Éteint": 3,
  "La saisie": 1,
  "La famille": 6,
  "La nuit": 3,
  // La station elle-même est une sortie (DUREES_SORTIES) : l'étape ne compte que l'ouverture de la carte.
  "La carte": 1,
};

/**
 * Les quêtes, pour un joueur moyen : le travail (minutes de jeu), et le lieu s'il faut voyager (avec ses fouilles).
 * Les attentes (la meule qui cuit trois jours, le panneau qui charge) sont à part : on fait autre chose entre-temps.
 * Plan 0.8 : le bidon de 5 L est dans la ruine (l'eau du ciel ne demande plus de voyage) ; le panneau se trouve à la
 * station pendant le tutoriel (« La carte », §2.6).
 */
const DUREES_QUETES: Readonly<Record<string, { travail: number; lieu?: "station" | "comptoir" }>> = {
  // Dans l'ordre du carnet : « Un vrai lit » juste après le coffre, avant les portes (0.8.2, chantier J).
  foyer_pierres: { travail: 5 },
  repas: { travail: 6 },
  eau_du_ciel: { travail: 6 },
  coffre: { travail: 6 },
  lit: { travail: 4 },
  dakota: { travail: 5 },
  defense: { travail: 3 },
  premier_arc: { travail: 6 },
  tir_plein: { travail: 8 },
  alarme: { travail: 6 },
  soins: { travail: 5 },
  protege_bras: { travail: 4 },
  travois: { travail: 6 },
  foyer_cuisine: { travail: 8 },
  // Les portes du niveau 1 (plan 0.8, chantier 13) : le travail à la maison, la clé en poche. La sortie qui la rapporte
  // reste à apprendre au simulateur (chantier 14).
  abri_ferme: { travail: 5 },
  marmite: { travail: 4 },
  coffre_cercle: { travail: 4 },
  dix_litres: { travail: 3 },
  etabli_etau: { travail: 4 },
  comptoir: { travail: 10, lieu: "comptoir" },
  premiers_wotts: { travail: 8, lieu: "comptoir" },
  main_tendue: { travail: 10, lieu: "comptoir" },
  charbonniere: { travail: 8 },
  charbon: { travail: 3 },
  lame: { travail: 5 },
  vendre_lame: { travail: 10, lieu: "comptoir" },
  pinces: { travail: 4 },
  trempe: { travail: 6 },
  mise_acier: { travail: 6 },
  fournisseur: { travail: 10, lieu: "comptoir" },
  meule: { travail: 5 },
  affuter: { travail: 3 },
  dynamo: { travail: 5 },
  depot_meca: { travail: 15, lieu: "comptoir" },
  arbalete: { travail: 12 },
  carreau: { travail: 8 },
  machoires: { travail: 6 },
  carquois: { travail: 10, lieu: "comptoir" },
  panneau_trouve: { travail: 4 },
  panneau_pose: { travail: 3 },
  charge: { travail: 3 },
  depot_volt: { travail: 10, lieu: "comptoir" },
  pack: { travail: 8, lieu: "station" },
  raquette: { travail: 10 },
  alarme_electrique: { travail: 8, lieu: "station" },
  courant_autres: { travail: 10, lieu: "comptoir" },
};

/** Les quêtes qui demandent un autre joueur : un joueur seul ne peut pas les finir (ce n'est pas un blocage). */
const QUETES_SOCIALES = new Set(["main_tendue"]);

/**
 * Le panneau suit le soleil (plan 0.10, chantier D ; S-30) : rien la nuit ni sous la pluie, moins sous les nuages. Sur
 * un mois de calendrier du monde, il ne donnait qu'une part de ses 80 Wh par jour (≈ 53 % : la nuit est déjà dans la
 * moyenne, pas la pluie ni les nuages). Depuis la compensation (V1-02), sa moyenne sur la vraie météo est celle d'avant :
 * ce mois-ci, un peu plus (≈ 107 %, le hasard du ciel) ; l'attente des 20 Wh de la quête « La charge » suit.
 */
export const PART_DU_SOLEIL = productionPanneau(0, 30 * MS_JOUR_CALENDRIER, 0) / (30 * REGLAGES.panneau_wh_jour);

/**
 * Les attentes du monde, en minutes de jeu (Book 25 : la meule cuit trois jours de jeu, 72 min). Le panneau donnait
 * 20 Wh en 25 min au calendrier ; il suit le soleil depuis la 0.10.
 */
const ATTENTE = { defourne: 72, wh_panneau: Math.round(25 / PART_DU_SOLEIL) } as const;

/**
 * Une sortie, pour un joueur moyen (minutes de jeu connecté) : le trajet (10 s à l'écran), le lieu à traverser, ses
 * Éteints, les fouilles et le butin. En passant (la station sur la route de la Coopérative, le gué sur celle du
 * Moulin) : quelques minutes de plus. Le ravitaillement : la station, droit au tas de bois et au vrac.
 */
export const DUREES_SORTIES = { station: 12, gue: 12, cooperative: 30, moulin: 30, comptoir: 10, enPassant: 4, ravitaillement: 10 } as const;

/**
 * Le travail d'une porte du niveau 1 à la maison (ramasser les matériaux à portée, bâtir : la fabrication est
 * accélérée), pour un joueur moyen. Les sorties ont leur durée à part.
 */
const TRAVAIL_PORTE = 2.5;

/**
 * Ce que le joueur porte toujours (kg) : le kit, la gourde pleine, ses outils et son arme. Le reste du sac (55 kg),
 * plus le travois (50 kg) ou la brouette (60 kg) s'il les a faits, est pour le butin.
 */
export const CHARGE_DE_BASE_KG = 10;

/** Ce qu'il garde en réserve en plus de ce que demandent les constructions qui restent (bûches, pierres). */
const RESERVE = 4;

/**
 * Le feu de tous les jours brûle des branches (B14 : le tutoriel conseille les branches ; le foyer de pierres couvert la
 * nuit) : ≈ 15 branches par jour de jeu, soit 24 minutes réelles (`candidats-h1b-l1b-et-budget.md`).
 */
export const BRANCHES_FEU_PAR_MIN = 15 / 24;

/** Ce que le monde fait de lui-même (minutes de jeu, pour chaque profil) : un constat noté une fois, ou un fait. */
function agendaDuMonde(profil: Profil): { minute: number; fait: string }[] {
  const p = PROFILS[profil];
  // Pendant le tutoriel, les Éteints attendent l'étape « Le premier Éteint » : les coups viennent après.
  const combat = p.tuto ? Object.values(DUREES_TUTO).reduce((s, d) => s + d, 0) * p.facteur : 10;
  const a: { minute: number; fait: string }[] = [
    { minute: combat + (profil === "prudent" ? 10 : 4), fait: "blessure" },
    { minute: 30, fait: "sommeil_bas" },
    { minute: profil === "prudent" ? 28 : profil === "presse" ? 40 : 32, fait: "sac_lourd" },
    { minute: 50, fait: "pluie" },
    { minute: profil === "prudent" ? 12 : profil === "presse" ? 45 : 18, fait: "arbre_haut" },
    { minute: combat + 20, fait: "morsure" },
    { minute: profil === "prudent" ? 55 : profil === "presse" ? 80 : 60, fait: "trop_lourd" },
    // Une poule attrapée et rôtie (la faim) : la graisse coule sous la broche (la torche plantée en brûle).
    { minute: profil === "prudent" ? 45 : 60, fait: "volaille_rotie" },
  ];
  // Un Éteint détruit de temps en temps (la fumée, le bruit), l'eau bouillie, les nuits dans l'abri.
  for (let m = combat + 15; m < HORIZON_MIN; m += 20) a.push({ minute: m, fait: "detruit:contondant" });
  for (let m = 20; m < HORIZON_MIN; m += 15) a.push({ minute: m, fait: "ebullition" });
  const pas = p.dortChaqueNuit ? 24 : 48;
  for (let m = (p.tuto ? 45 : 22) + pas; m < HORIZON_MIN; m += pas) a.push({ minute: m, fait: "nuit" });
  if (!p.tuto) {
    a.push({ minute: 4, fait: "eteint_vu" }, { minute: 10, fait: "detruit:hache" }, { minute: 15, fait: "saisi" }, { minute: 22, fait: "nuit" });
  }
  return a.sort((x, y) => x.minute - y.minute);
}

/** Ce que le joueur curieux ramasse au passage sur son terrain. */
const CUEILLETTE_CURIEUSE: readonly { minute: number; objets: TypeObjet[] }[] = [
  { minute: 9, objets: ["fibres"] },
  { minute: 14, objets: ["cepe", "baies"] },
  { minute: 30, objets: ["poule"] },
  { minute: 40, objets: ["perche_frene"] },
];

/**
 * Le tutoriel, geste par geste, par le titre de l'étape : à quel moment de l'étape (de 0 à 1) le joueur fait quoi. Une
 * étape longue donne ainsi ses idées en chemin, comme en jeu. Par le titre, et non par le rang : le tutoriel peut
 * changer d'ordre (Q-0.8-18 : la carte avant la famille) sans que le simulateur se trompe d'étape.
 */
type Geste = { voir: TypeObjet[] } | { fabriquer: string } | { noter: string } | { fouiller: LieuFouille } | { atelier: true } | { sortie: "station" };
const GESTES_TUTO: Readonly<Record<string, readonly (readonly [number, Geste])[]>> = {
  Ramasser: [
    [0.3, { voir: ["branche"] }],
    [0.8, { voir: ["pierre"] }],
  ],
  "Le feu": [
    [0.6, { fabriquer: "feu_de_camp" }],
    [0.9, { noter: "feu_allume" }],
  ],
  "L'eau": [[0.9, { noter: "ebullition" }]],
  "Le vestige": [
    // La caisse à outils de la ruine : la tête de hache, la clé plate, le tournevis, la tête de marteau (I10).
    [0.4, { voir: ["tete_hache", "cle_plate", "tournevis", "tete_marteau"] }],
    [0.45, { fouiller: "caisse_ruine" }],
    [0.9, { voir: ["cadre_velo", "chaine_velo", "roue_velo", "dynamo_velo"] }],
  ],
  "L'outil": [[0.9, { fabriquer: "hache" }]],
  "L'abri": [
    // La ruine : la bâche, le bidon de 5 L (plan 0.8 §2.5), et les 4 sacs plastique du premier sac-poubelle (I28).
    [0.4, { voir: ["bache", "buche", "bidon_5l", "sac_plastique"] }],
    [0.9, { fabriquer: "abri" }],
  ],
  "Le premier Éteint": [
    [0.1, { noter: "eteint_vu" }],
    [0.8, { noter: "detruit:hache" }],
  ],
  "La saisie": [[0.2, { noter: "saisi" }]],
  "La famille": [
    [0.4, { voir: ["barre_metal", "ressort_lames", "batterie_voiture"] }],
    [0.9, { atelier: true }],
  ],
  "La nuit": [[0.9, { noter: "nuit" }]],
  // « La carte » (§2.6) : la station, la pièce de sa famille, et du bois.
  "La carte": [[0.5, { sortie: "station" }]],
};

/** Le vétéran qui saute le tutoriel s'installe seul, entre deux objectifs du carnet (minutes de jeu). */
const INSTALLATION_DU_VETERAN: readonly [number, Geste][] = [
  [1, { voir: ["branche", "pierre", "buche", "baies"] }],
  [2.5, { fabriquer: "feu_de_camp" }],
  [2.6, { noter: "feu_allume" }],
  [5, { voir: ["tete_hache", "cle_plate", "tournevis", "tete_marteau", "bache", "barre_metal", "ressort_lames", "bidon_5l", "sac_plastique"] }],
  [5.1, { fouiller: "caisse_ruine" }],
  [6, { voir: ["cadre_velo", "chaine_velo", "roue_velo", "dynamo_velo"] }],
  [9, { fabriquer: "abri" }],
  // « Ta famille t'attend à la station » (Q-0.8-15) : il y va tout de suite après s'être installé.
  [10, { sortie: "station" }],
  [16, { atelier: true }],
  // R13 (0.8.2) : la hache se remmanche à l'établi ; il le bâtit au retour de la station, avec les bûches rapportées.
  [17, { fabriquer: "hache" }],
];

// ---------- Le niveau 1 : les portes, et ce qu'il faut bâtir (plan 0.8 §1.1, §2.3, §5 critères 2 à 5) ----------

/** Les formes du feu qu'on bâtit (la voie de surface sur un premier feu, la voie creusée sur un second). */
type FormeBatie = "foyer_pierres" | "foyer_cuisine" | "dakota" | "poele_fusee" | "four_terre";

/** Une chose à bâtir pour avoir « tout le niveau 1 ». */
export type Poste =
  /** Une recette : une installation posée (le coffre, le râtelier) ou un objet (le marteau remmanché, le gourdin). */
  | { id: string; genre: "recette"; recette: string }
  /** Un niveau d'une lignée (l'abri garni, le coffre cerclé…) : le niveau d'avant, ses coûts, sa clé. */
  | { id: string; genre: "niveau"; type: string; niveau: number }
  /** Une forme du feu. */
  | { id: string; genre: "feu"; forme: FormeBatie }
  /** Un accessoire du feu (la broche, la marmite norvégienne). */
  | { id: string; genre: "accessoire"; accessoire: AccessoireFeu }
  /** La pièce de famille posée sur son meuble (l'enclume, le panneau, le petit alternateur). */
  | { id: string; genre: "piece"; type: "forge" | "banc_recharge" | "pedalier" }
  /** 🔥 Le bac de trempe (la glaise du gué) ; ⚙️ la meule du pédalier (3 pierres). */
  | { id: string; genre: "bac" }
  | { id: string; genre: "meule" }
  /** La sortie au gué du parcours visé (sortie 2 : « de quoi bâtir »), pour qui la fait sans en avoir besoin. */
  | { id: string; genre: "gue" }
  /** Plan 0.10 (chantier M) : une recette du niveau 2, fabriquée une fois de plus (l'arme ★★★ sur le meuble du niveau 2). */
  | { id: string; genre: "objet2"; recette: string }
  /** Un accessoire posé sur un meuble du niveau 2 (le creuset de la forge ventilée). */
  | { id: string; genre: "accessoire2"; type: "forge"; accessoire: "creuset" };

const r = (id: string): Poste => ({ id, genre: "recette", recette: id });
const n = (type: string, niveau: number): Poste => ({ id: `${type}#${niveau}`, genre: "niveau", type, niveau });

/**
 * La maison (critère 2) : tout ce que le terrain, la ruine et sa caisse permettent. D'abord ce que le parcours met au
 * retour de la sortie 0 (§1.1 : « feu, foyer de pierres, abri, coffre, établi, marteau remmanché »), qui montre dans
 * les fiches les clés de L1 ; le reste de la maison ensuite.
 */
const POSTES_MAISON: readonly Poste[] = [
  { id: "foyer_pierres", genre: "feu", forme: "foyer_pierres" },
  r("hache"),
  r("marteau"),
  n("abri", 2),
  r("recuperateur_pluie"),
  n("coffre", 1),
  n("etabli", 1),
];
const POSTES_MAISON_ENSUITE: readonly Poste[] = [
  r("gourdin"),
  r("ratelier_outils"),
  r("torche_plantee"),
  r("alarme_boites"),
  r("escabeau"),
  { id: "dakota", genre: "feu", forme: "dakota" },
  { id: "poele_fusee", genre: "feu", forme: "poele_fusee" },
  { id: "broche", genre: "accessoire", accessoire: "broche" },
];

/** Le métier de chaque famille jusqu'au niveau 1 (§2.3 ; `candidats-h1b-l1b-et-budget.md`, « ce que chaque famille ajoute »). */
const POSTES_FAMILLE: Readonly<Record<Famille, readonly Poste[]>> = {
  charbonniers: [n("forge", 1), { id: "enclume", genre: "piece", type: "forge" }],
  voltaiques: [n("banc_recharge", 1), { id: "panneau", genre: "piece", type: "banc_recharge" }],
  mecanistes: [n("pedalier", 1), { id: "alternateur", genre: "piece", type: "pedalier" }],
};
/** Le bac de trempe 🔥 vient au retour du gué (§1.1, sortie 2) ; le reste du métier se fait entre deux sorties. */
const POSTES_GUE: Readonly<Record<Famille, readonly Poste[]>> = { charbonniers: [{ id: "bac", genre: "bac" }], voltaiques: [], mecanistes: [] };
const POSTES_METIER: Readonly<Record<Famille, readonly Poste[]>> = {
  charbonniers: [r("charbonniere")],
  voltaiques: [r("cloture_fortune"), r("alarme_electrique"), r("matraque_fortune")],
  mecanistes: [{ id: "meule", genre: "meule" }, r("tour_perche"), r("assommoir"), r("arbalete"), r("brouette")],
};

/** La Coopérative (L1A, critère 4) et le Moulin (L1B, critère 5). */
const POSTES_L1A: readonly Poste[] = [{ id: "foyer_cuisine", genre: "feu", forme: "foyer_cuisine" }, { id: "marmite", genre: "accessoire", accessoire: "marmite" }, n("recuperateur_pluie", 2)];
const POSTES_L1B: readonly Poste[] = [n("abri", 3), n("coffre", 2), n("etabli", 2)];

/**
 * Tout le niveau 1 d'une famille, dans l'ordre du parcours (§1.1) : la maison de la sortie 0, la famille (H1A), le gué
 * (H1B), les deux L1 dans l'ordre de sa route, puis le reste de la maison et du métier.
 */
export function postesNiveau1(famille: Famille, route: "A" | "B" = "A", gue: "parcours" | "besoin" = "parcours"): Poste[] {
  const l1 = route === "A" ? [...POSTES_L1A, ...POSTES_L1B] : [...POSTES_L1B, ...POSTES_L1A];
  const auGue = gue === "parcours" ? [{ id: "gue", genre: "gue" } as Poste, ...POSTES_GUE[famille]] : POSTES_GUE[famille];
  return [...POSTES_MAISON, ...POSTES_FAMILLE[famille], ...auGue, ...l1, ...POSTES_MAISON_ENSUITE, ...POSTES_METIER[famille]];
}

// ---------- Le niveau 2 : ce qu'il faut bâtir (plan 0.10 §3.1, §4 chantier M ; niveau-2.md §2 à §4) ----------

const r2 = (id: string): Poste => ({ id: `${id}@2`, genre: "objet2", recette: id });

/** Les évolutions communes de l'hôtel (L2A) : l'abri doublé, la lanterne fixe, la réserve couverte. */
const POSTES_N2_L2A: readonly Poste[] = [n("abri", 4), n("torche_plantee", 2), n("coffre", 3)];
/** Celles du phare (L2B) : le four de terre, le récupérateur à jerrican, l'établi de menuisier, la cloche d'alarme. */
const POSTES_N2_L2B: readonly Poste[] = [{ id: "four_terre", genre: "feu", forme: "four_terre" }, n("recuperateur_pluie", 3), n("etabli", 3), n("alarme_boites", 2)];
/** Le meuble de famille du niveau 2, à son lieu : ⚡ le poste de montage et ⚙️ les roulements montés (L2A), 🔥 la forge ventilée (L2B). */
const POSTES_N2_FAMILLE: Readonly<Record<Famille, { lieu: "L2A" | "L2B"; postes: readonly Poste[] }>> = {
  voltaiques: { lieu: "L2A", postes: [n("banc_recharge", 2)] },
  mecanistes: { lieu: "L2A", postes: [n("pedalier", 2)] },
  charbonniers: { lieu: "L2B", postes: [n("forge", 2)] },
};
/** Les meubles nouveaux communs (N2-40, N2-41) et les étagères de l'établi de menuisier (V1-04). */
const POSTES_N2_COMMUNS_ENSUITE: readonly Poste[] = [r2("cuiseur_solaire"), r2("bacs_tri"), r2("etageres")];
/**
 * Ce que chaque famille fait de son meuble du niveau 2 : ses armes ★★★ et ses meubles nouveaux (N2-43 à N2-48). 🔥 le
 * creuset, la hache et la machette ★★★ (le glaive attend la maîtrise du couteau), un lingot ; ⚡ le pack soudé, la
 * matraque à contacts soudés, le module à bobine, la batterie de cellules, la rampe de LED ; ⚙️ le cranequin léger, l'arc
 * d'arbalète en if et l'arbalète, la charrette à bras, le moulin de jerricans, l'arbalète de garde.
 */
const POSTES_N2_METIER: Readonly<Record<Famille, readonly Poste[]>> = {
  charbonniers: [{ id: "creuset", genre: "accessoire2", type: "forge", accessoire: "creuset" }, r2("hache_forgee"), r2("machette_forgee"), r2("lingot_aluminium")],
  voltaiques: [r2("pack_soude"), r2("matraque_contacts_soudes"), r2("module_bobine"), r2("batterie_cellules"), r2("rampe_led")],
  mecanistes: [r2("cranequin_leger"), r2("arc_arbalete_if"), r2("arbalete"), r2("charrette_bras"), r2("moulin_jerricans"), r2("arbalete_garde")],
};

/**
 * Tout le niveau 2 d'une famille, dans l'ordre de sa route : le lieu de la route prise d'abord (A : l'hôtel ; B : le
 * phare), ses évolutions communes et le meuble de famille s'il y est, puis l'autre lieu, puis les meubles nouveaux et le
 * métier. `famille` seulement : le meuble de famille et son métier (le critère 8 : le Mécaniste seul, sans aller aux deux
 * lieux).
 */
export function postesNiveau2(famille: Famille, route: "A" | "B" = "A", seulementFamille = false): Poste[] {
  const f = POSTES_N2_FAMILLE[famille];
  const auLieu = (l: "L2A" | "L2B") => [...(seulementFamille ? [] : l === "L2A" ? POSTES_N2_L2A : POSTES_N2_L2B), ...(f.lieu === l ? f.postes : [])];
  const ordre = route === "A" ? (["L2A", "L2B"] as const) : (["L2B", "L2A"] as const);
  return [...auLieu(ordre[0]), ...auLieu(ordre[1]), ...(seulementFamille ? [] : POSTES_N2_COMMUNS_ENSUITE), ...POSTES_N2_METIER[famille]];
}

/** Les lieux du niveau 2 où l'on va pour un objet-clé, et la halte qu'on traverse (et son péage) pour y aller. */
type LieuNiveau2 = "grand_hotel" | "phare";
const HALTE_DE: Readonly<Record<LieuNiveau2, { halte: "route_pont" | "corniche"; passage: PassagePeage }>> = {
  grand_hotel: { halte: "route_pont", passage: "pont" },
  phare: { halte: "corniche", passage: "tunnel" },
};

/**
 * Une sortie du niveau 2, pour un joueur moyen (minutes de jeu connecté), aux mêmes distances que le niveau 1 (B16 : 3 km
 * jusqu'à la halte, 2 km jusqu'au lieu) : l'hôtel, 35 min (la Coopérative : 30) pour le check-in (la batterie à la borne,
 * le robot dégagé, sa tête portée à deux mains, l'ascenseur) ; le phare, 30 min, dont la préparation (l'escabeau, le
 * pétrole, le prisme, le compresseur : faisable de jour) et les 2 min du cargo après l'allumage (S-17), qui se fait la
 * nuit. Des estimations, à caler au test familial comme celles du niveau 1.
 */
export const DUREES_SORTIES_N2 = { grand_hotel: 35, phare: 30, preparerPhare: 8, cargo: 2 } as const;

/**
 * Le ravitaillement de bois à la corniche ne passe pas la barricade (on ne paie pas) : le pin tombé est en deçà (x = − 78
 * du modèle, la barricade à − 25), avec 4 des 9 pins sous lesquels le vrac de bûches est semé (corniche-contenu.ts,
 * `PINS`) : ≈ 4/9 de ses 8 bûches, soit 3.
 */
export const BUCHES_CORNICHE_EN_DECA = 3;

/**
 * Les tables de fouille des lieux du niveau 2, dans l'ordre de leurs points (vestiges.ts, LIEU_DE_FOUILLE : les points de
 * l'hôtel, du phare, de la route du pont et de la corniche, reconnus à leur préfixe).
 */
export const FOUILLES_N2: Readonly<Partial<Record<LieuId, readonly LieuFouille[]>>> = (() => {
  const prefixes: Partial<Record<LieuId, string>> = { route_pont: "pont_", grand_hotel: "hotel_", corniche: "corniche_", phare: "phare_" };
  const t: Partial<Record<LieuId, LieuFouille[]>> = {};
  for (const [lieu, prefixe] of Object.entries(prefixes) as [LieuId, string][]) t[lieu] = Object.entries(LIEU_DE_FOUILLE).filter(([r]) => r.startsWith(prefixe)).map(([, f]) => f!);
  return t;
})();

/** La durée simulée du niveau 2 (minutes de jeu connecté), après la première soirée (HORIZON_MIN). */
export const HORIZON_NIVEAU_2_MIN = 600;

/** L'heure du monde à une minute du serveur simulé : il commence au matin (HEURE_DEPART) ; une heure de jeu par minute. */
export function heureDuMonde(minute: number): number {
  return (((HEURE_DEPART + minute) % 24) + 24) % 24;
}

/** Les ressources que le simulateur compte (le reste se ramasse ou se fouille sans compter). */
export type Vrac = "buche" | "pierre" | "branche" | "glaise" | "charbon_bois";
const COMPTES: readonly Vrac[] = ["buche", "pierre", "branche", "glaise", "charbon_bois"];
function estCompte(t: string): t is Vrac {
  return (COMPTES as readonly string[]).includes(t);
}

/**
 * Les clés de lieu (plan 0.8 §2.2) : un objet qui ouvre un niveau du niveau 1 et qui ne se trouve qu'à sa place fixe,
 * dans son lieu (la pièce de famille à la station, le grillage à la Coopérative, l'étau au Moulin…). Relevées dans les
 * lignées ; la glaise du gué (le bac de trempe, sans clé) s'y ajoute : elle ne se trouve qu'au gisement de la berge.
 */
export const CLES_DE_LIEU: ReadonlyMap<TypeObjet, LieuId> = (() => {
  const m = new Map<TypeObjet, LieuId>();
  for (const x of etapesAvecCle()) {
    const c = x.etape.cle;
    // Le niveau 2 (plan 0.10, chantier M) a sa table à part (CLES_NIVEAU_2) : le parcours du niveau 1 n'en sait rien.
    if (x.etape.aVenir || !c.objet || c.ou === "maison" || x.etape.etapeLieu === "L2" || x.etape.etapeLieu === "H2") continue;
    const lieu = lieuDeLEtape(c.ou);
    if (lieu) m.set(c.objet, lieu);
  }
  return m.set("glaise", "gue");
})();

/**
 * Les objets-clés du niveau 2 (plan 0.10 §3.1) et leur lieu, tels que le Comptoir les connaît (LIEU_DES_CLES) : les
 * cinq de l'hôtel (à l'étage, après le check-in), les cinq du phare (dans l'épave, après le feu et le cargo). Le rabot et
 * le fer à souder en sont : ce sont des outils (OUTILS_NIVEAU_2). Seul le parcours du niveau 2 s'en sert.
 */
export const CLES_NIVEAU_2: ReadonlyMap<TypeObjet, LieuId> = new Map(
  (Object.entries(LIEU_DES_CLES) as [TypeObjet, LieuId][]).filter(([, l]) => (LIEUX_NIVEAU_2 as readonly LieuId[]).includes(l)),
);

/**
 * Les qualités qu'aucun outil ne donne hors des objets-clés du niveau 2 (Raboter : le rabot ; Souder : le fer à souder) :
 * l'établi de menuisier, le poste de montage et ce qui s'y fait attendent l'objet, et donc sa sortie.
 */
export const OUTILS_NIVEAU_2: Readonly<Partial<Record<Qualite, TypeObjet>>> = (() => {
  const par = new Map<Qualite, TypeObjet[]>();
  for (const [t, q] of Object.entries(QUALITES_OBJETS) as [TypeObjet, Partial<Record<Qualite, number>>][]) for (const k of Object.keys(q) as Qualite[]) par.set(k, [...(par.get(k) ?? []), t]);
  const outils: Partial<Record<Qualite, TypeObjet>> = {};
  for (const [q, objets] of par) if (objets.every((t) => CLES_NIVEAU_2.has(t))) outils[q] = objets[0]!;
  return outils;
})();

/** L'étape du monde d'un lieu (H1A pour la station…), ou « maison ». */
function etapeDuLieu(lieu: LieuId): EtapeMonde | null {
  for (const [etape, l] of Object.entries(ETAPES_LIEUX)) if (l === lieu) return etape as EtapeMonde;
  return null;
}

/** La pièce de famille de ce meuble (l'objet de sa clé). */
function objetPiece(type: "forge" | "banc_recharge" | "pedalier"): TypeObjet {
  return lignee(type)![0]!.cle!.objet!;
}

// ---------- Les haltes partagées (plan 0.8 §2.7 : B2 à B8, B11, B13) ----------

/** Ce que le terrain donne une fois (B1) : ses bûches et ses pierres ; ses branches repoussent (40 min). */
export const TERRAIN_VRAC: Readonly<Record<"buche" | "pierre" | "branche", number>> = (() => {
  const c = { buche: 0, pierre: 0, branche: 0 };
  for (const x of genererRessources(1)) if (x.type === "buche" || x.type === "pierre" || x.type === "branche") c[x.type]++;
  return c;
})();
const RETOUR_BRANCHE_MIN = REPOUSSE_MS.branche! / 60_000;
/**
 * Les lieux semés (plan 0.9, semis.ts) : les haltes, partagées, et les lieux à un joueur (le Moulin, la Coopérative) ;
 * plan 0.10 : les deux haltes du niveau 2, qui tiennent leur semis à part (route-pont.ts, corniche-contenu.ts).
 */
type LieuSeme = LieuSemis | "route_pont" | "corniche";
function semisDu(lieu: LieuSeme): SemisLieu {
  return lieu === "route_pont" ? SEMIS_ROUTE_PONT : lieu === "corniche" ? SEMIS_CORNICHE : SEMIS[lieu];
}
const A_UN_JOUEUR: ReadonlySet<LieuSeme> = new Set(["moulin", "cooperative"]);
/** Ce qui se ramasse dans un lieu semé : le bois et les pierres (la cueillette ne se simule pas : pas de faim ici). */
type TypeRamasse = "buche" | "pierre" | "branche";

/**
 * Les hypothèses du budget : les chiffres décidés (§2.7), dont les trois « à vérifier en test » (le tas de bois et son
 * retour, le stock du Comptoir), qu'on fait varier pour voir s'ils tiennent.
 */
export interface Hypotheses {
  /** B3 : le tas de bois personnel de la station (bûches par joueur), et son retour (minutes réelles). */
  tasBois: number;
  retourTasMin: number;
  /** B5 : le banc de galets personnel du gué. */
  bancGalets: number;
  retourBancMin: number;
  /** B2, B4, B5, B8 : le vrac des haltes pour un voyageur seul, et son retour. */
  vracStation: { buche: number; pierre: number };
  vracGue: number;
  retourVracMin: number;
  /** B11 : les bûches des poutres du Moulin. */
  poutresMoulin: number;
  /** B13 : le stock de bûches et de pierres du Comptoir, et son réassort (une unité toutes les… minutes). */
  stockComptoir: number;
  reassortMin: number;
  /** Les bûches brûlées la première nuit (0 : le joueur suit le conseil du tutoriel, B14). */
  buchesPremiereNuit: number;
  /** Plan 0.10 (N2-29, S-21) : le pin tombé de la corniche, tas personnel (bûches), et son retour (minutes réelles). */
  pinTombe: number;
  retourPinMin: number;
  /** Plan 0.10 (V1-01) : combien de boîtes de trois roulements la machinerie de l'hôtel donne d'un coup. */
  boitesHotel: number;
}

export const HYPOTHESES_DECIDEES: Hypotheses = {
  tasBois: BUTIN_HALTE.personnel!.tas_bois!,
  // Plan 0.8.2 (chantier D) : le retour du tas de bois est un réglage à chaud, lu par la halte (6 h par défaut).
  retourTasMin: BUTIN_HALTE.repousse!.tas_bois! / 60_000,
  bancGalets: BUTIN_GUE.personnel!.banc_galets!,
  retourBancMin: REPOUSSE_MS.banc_galets! / 60_000,
  vracStation: { buche: BUTIN_HALTE.vrac!.buche!, pierre: BUTIN_HALTE.vrac!.pierre! },
  vracGue: BUTIN_GUE.vrac!.pierre!,
  retourVracMin: BUTIN_HALTE.repousse!.buche! / 60_000,
  poutresMoulin: USAGES.poutres_chene.donne.buche ?? 0,
  stockComptoir: STOCK_DE_BASE.buche ?? 0,
  reassortMin: REASSORT_MS / 60_000,
  buchesPremiereNuit: 0,
  // S-21 : les réglages du tas de bois de la station (corniche-contenu.ts, BUTIN_CORNICHE).
  pinTombe: REGLAGES.tas_bois_buches,
  retourPinMin: REGLAGES.tas_bois_retour_h * 60,
  // ressources-hotel.ts : la machinerie de l'ascenseur (hotel_roulements).
  boitesHotel: USAGES.hotel_roulements.donne.roulements ?? 1,
};

/** Un passage d'un joueur dans un lieu (minutes absolues : depuis le début du serveur simulé). */
export interface Passage {
  joueur: number;
  lieu: LieuId;
  debut: number;
  fin: number;
}

/** Une prise dans un vrac partagé (station, gué) ou un achat au Comptoir. */
export interface Prise {
  joueur: number;
  lieu: LieuSeme | "comptoir";
  type: "buche" | "pierre" | "branche";
  minute: number;
  n: number;
}

/** Ce que les autres joueurs font des lieux partagés, tel que la passe précédente l'a joué. */
export interface Autres {
  passages: readonly Passage[];
  prises: readonly Prise[];
}

const PERSONNE: Autres = { passages: [], prises: [] };

/**
 * Les haltes vues par un joueur : le vrac partagé (il grandit avec les présents, B8 ; chaque point pris revient en
 * 30 min, B2 et B4), ses tas personnels (B3, B5), le Comptoir (B13). Les autres joueurs y passent et y prennent comme la
 * passe précédente l'a dit. Un comptage, pas des points : `vracEnJeu` moins ce qui a été pris depuis moins de 30 min.
 */
export class Haltes {
  readonly passages: Passage[] = [];
  readonly prises: Prise[] = [];
  private readonly tas = new Map<string, { reste: number; revient: number }>();
  private readonly joueur: number;
  private readonly autres: Autres;
  private readonly h: Hypotheses;
  /** Le malchanceux : le vrac a toujours été pris juste avant lui. */
  private readonly videAvant: boolean;

  constructor(joueur: number, autres: Autres, h: Hypotheses, videAvant: boolean) {
    this.joueur = joueur;
    this.autres = autres;
    this.h = h;
    this.videAvant = videAvant;
  }

  passer(lieu: LieuId, debut: number, fin: number): void {
    this.passages.push({ joueur: this.joueur, lieu, debut, fin });
  }

  /** Les voyageurs présents à cet instant (lui compris). */
  presents(lieu: LieuId, t: number): number {
    const qui = new Set<number>([this.joueur]);
    for (const p of this.autres.passages) if (p.lieu === lieu && p.debut <= t && t < p.fin) qui.add(p.joueur);
    return qui.size;
  }

  /** Combien de points de ce type le lieu a pour un voyageur seul (le vrac de la station et du gué : les hypothèses). */
  private base(lieu: LieuSeme, type: TypeRamasse): number {
    if (type !== "branche" && lieu === "station") return this.h.vracStation[type];
    if (type === "pierre" && lieu === "gue") return this.h.vracGue;
    if (lieu === "route_pont" || lieu === "corniche") return Object.values(semisDu(lieu).lignes).reduce((s, l) => s + (l.type === type ? l.n : 0), 0);
    return semisDe(lieu, type);
  }

  /** Le délai de retour (minutes) : celui du lieu (semis.ts), sinon REPOUSSE_MS ; le vrac des haltes : l'hypothèse. */
  private retour(lieu: LieuSeme, type: TypeRamasse): number {
    const semis = semisDu(lieu);
    if (type !== "branche" && semis.vrac[type]) return this.h.retourVracMin;
    const ms = semis.repousse[type] !== undefined ? semis.repousse[type]! : REPOUSSE_MS[type];
    return ms === null ? Infinity : ms / 60_000;
  }

  /**
   * Ce qu'il y a de ce bois ou de ces pierres à prendre à cet instant (plan 0.9 : tout le semis du lieu). Un type en vrac
   * grandit avec les présents (B8) ; un lieu à un joueur ne voit que ses propres prises.
   */
  vrac(lieu: LieuSeme, type: TypeRamasse, t: number): number {
    const seul = A_UN_JOUEUR.has(lieu);
    const enVrac = semisDu(lieu).vrac[type] === true;
    if (this.videAvant && enVrac && !seul) return 0;
    const retour = this.retour(lieu, type);
    const pris = [...this.prises, ...(seul ? [] : this.autres.prises)].filter((p) => p.lieu === lieu && p.type === type && p.minute <= t && p.minute > t - retour).reduce((s, p) => s + p.n, 0);
    const base = this.base(lieu, type);
    return Math.max(0, (enVrac ? vracEnJeu(base, seul ? 1 : this.presents(lieu, t)) : base) - pris);
  }

  /** Les branches d'un lieu (partagées dans une halte ; à la station, 40 min ; au gué, 30). */
  branches(lieu: LieuSeme, t: number): number {
    return this.vrac(lieu, "branche", t);
  }

  prendreBranches(lieu: LieuSeme, t: number, max: number): number {
    return this.prendreVrac(lieu, "branche", t, max);
  }

  prendreVrac(lieu: LieuSeme, type: TypeRamasse, t: number, max: number): number {
    const k = Math.max(0, Math.min(Math.floor(max), this.vrac(lieu, type, t)));
    if (k > 0) this.prises.push({ joueur: this.joueur, lieu, type, minute: t, n: k });
    return k;
  }

  /** Ce qu'il reste de son tas personnel à cet instant (sans rien prendre). */
  resteTas(quel: "tas_bois" | "banc_galets" | "pin_tombe", t: number): number {
    const e = this.tas.get(quel);
    return !e || t >= e.revient ? this.pleinTas(quel) : e.reste;
  }

  private pleinTas(quel: "tas_bois" | "banc_galets" | "pin_tombe"): number {
    return quel === "tas_bois" ? this.h.tasBois : quel === "pin_tombe" ? this.h.pinTombe : this.h.bancGalets;
  }

  /**
   * Son tas personnel (le tas de bois de la station, le banc de galets du gué ; plan 0.10 : le pin tombé de la
   * corniche) : plein, ou ce qu'il en reste.
   */
  prendreTas(quel: "tas_bois" | "banc_galets" | "pin_tombe", t: number, max: number): number {
    const plein = this.pleinTas(quel);
    const retour = quel === "tas_bois" ? this.h.retourTasMin : quel === "pin_tombe" ? this.h.retourPinMin : this.h.retourBancMin;
    let e = this.tas.get(quel);
    if (!e || t >= e.revient) e = { reste: plein, revient: Infinity };
    const k = Math.max(0, Math.min(Math.floor(max), e.reste));
    // Le délai court à partir de la première prise (lieu-vivant.ts) : au bout, tout est de nouveau là.
    if (k > 0 && e.revient === Infinity) e.revient = t + retour;
    e.reste -= k;
    this.tas.set(quel, e);
    return k;
  }

  /** Les poutres du Moulin (B11) : son Moulin à lui, 2 bûches garanties, qui reviennent à 24 h. */
  prendrePoutres(t: number): number {
    const e = this.tas.get("poutres");
    if (e && t < e.revient) return 0;
    this.tas.set("poutres", { reste: 0, revient: t + 24 * 60 });
    return this.h.poutresMoulin;
  }

  /** Le stock du Comptoir à cet instant (B13) : la base, moins les achats de tous, plus une unité toutes les 2 h. */
  stockComptoir(type: "buche" | "pierre", t: number): number {
    const achats = [...this.prises, ...this.autres.prises].filter((p) => p.lieu === "comptoir" && p.type === type && p.minute <= t).sort((a, b) => a.minute - b.minute);
    let stock = this.h.stockComptoir;
    let depuis = 0;
    for (const a of achats) {
      const plein = this.h.stockComptoir;
      stock = Math.min(plein, stock + Math.floor((a.minute - depuis) / this.h.reassortMin));
      depuis = a.minute;
      stock -= a.n;
    }
    return Math.max(0, Math.min(this.h.stockComptoir, stock + Math.floor((t - depuis) / this.h.reassortMin)));
  }

  acheter(type: "buche" | "pierre", t: number, max: number): number {
    const k = Math.max(0, Math.min(Math.floor(max), this.stockComptoir(type, t)));
    if (k > 0) this.prises.push({ joueur: this.joueur, lieu: "comptoir", type, minute: t, n: k });
    return k;
  }
}

/** Le plus long moment (minutes) où un voyageur qui arrive trouverait ce vrac vide, à plusieurs (critère 7). */
export function plusLongVide(tous: Autres, lieu: LieuSeme, type: TypeRamasse, fin: number, h: Hypotheses = HYPOTHESES_DECIDEES): number {
  const vue = new Haltes(-1, tous, h, false);
  let max = 0;
  let debut: number | null = null;
  for (let t = 0; t <= fin; t += 0.5) {
    if (vue.vrac(lieu, type, t) === 0) {
      debut ??= t;
      max = Math.max(max, t - debut);
    } else debut = null;
  }
  return max;
}

// ---------- Ce que le simulateur rend ----------

export interface Evenement {
  minute: number;
  genre: "recette" | "but";
  /** Les recettes dévoilées, ou le but (« Tutoriel : Le feu », « Quête : Un coffre à soi »). */
  quoi: string[];
}

/** Pourquoi on sort. */
export type MotifSortie = "tutoriel" | "parcours" | "cle" | "ravitaillement" | "quete" | "pierres" | "glaise" | "achat";

export interface SortieSimulee {
  minute: number;
  lieu: LieuId;
  motif: MotifSortie;
  /** Le gué ou la station traversés en passant (sur la route du Moulin, de la Coopérative). */
  enPassant: LieuId[];
  /** Ce qu'on rapporte en vrac, et les clés (objets de `CLES_DE_LIEU`, clé rare comprise). */
  rapporte: Partial<Record<Vrac, number>>;
  cles: TypeObjet[];
  /** Une porte s'est ouverte au retour grâce à ce qu'elle a rapporté (une clé, une pièce, la glaise). */
  porte: boolean;
}

export interface PorteFranchie {
  minute: number;
  id: string;
  /** La clé qui l'a ouverte (ou la glaise du bac). */
  cle: TypeObjet;
}

export interface Mesures {
  /** Nouveautés (recettes dévoilées ou buts) dans la première demi-heure, et le plus long écart entre deux. */
  nouveautesDebut: number;
  ecartNouveautesDebut: number;
  /** Recettes dévoilées dans la première demi-heure, et le plus long écart entre deux dévoilements. */
  recettesDebut: number;
  ecartRecettesDebut: number;
  /**
   * Après la première demi-heure et jusqu'à la fin des trois premières heures (critère 11, la première soirée) : le
   * plus long écart entre deux buts nouveaux (une quête, une porte nommée, un lieu atteint, une idée au ramassage).
   */
  ecartButsEnsuite: number;
  /** Le même, jusqu'au dernier but de l'horizon (la queue du carnet). */
  ecartButsTout: number;
  /** Le dernier but proposé (le carnet n'a plus rien après, sauf ce qui attend un autre joueur). */
  dernierBut: number;
  /** Recettes dévoilées en tout, à l'horizon. */
  recettes: number;
  /** Quêtes finies à l'horizon. */
  quetesFinies: number;
  /** Plan 0.8 (chantier 14) : la première sortie (minutes), null s'il n'en fait pas. */
  premiereSortie: number | null;
  /** Le plus long écart entre deux portes franchies (de la première à la dernière). */
  ecartPortes: number;
  /** Dans les trois premières heures : les sorties, et celles qui n'ont ouvert aucune porte. */
  sorties3h: number;
  sansPorte3h: number;
  /** Les mêmes, sans les voyages au Comptoir (vendre, déposer, acheter : ils ne cherchent pas de porte). */
  sortiesButin3h: number;
  sansPorteButin3h: number;
  /** Tout le niveau 1 bâti (minutes), null s'il ne l'a pas à l'horizon. */
  niveau1: number | null;
  /** La dernière porte à clé franchie (ce que les sorties ouvrent : la pièce de famille, le bac, les six clés de L1). */
  dernierePorte: number | null;
  /** Les allers-retours de ravitaillement à la station (pour les bûches), en plus de la visite du tutoriel. */
  ravitaillements: number;
}

export interface ResultatParcours {
  profil: Profil;
  famille: Famille;
  evenements: Evenement[];
  /** Ce qui bloque (une recette demandée jamais dévoilée, un ingrédient introuvable, une porte infranchissable). */
  blocages: string[];
  /** Ce qui a dû attendre un dévoilement (minutes), par quête : le rythme en souffre, sans bloquer. */
  attentes: Record<string, number>;
  mesures: Mesures;
  /** Plan 0.8 : les sorties, les portes, la première arrivée à chaque étape (`atteint:<étape>`, minutes de jeu). */
  sorties: SortieSimulee[];
  portes: PorteFranchie[];
  /** Chaque chose du niveau 1, et quand elle a été bâtie (dans l'ordre). */
  postesFaits: { id: string; minute: number }[];
  atteint: Partial<Record<EtapeMonde, number>>;
  /** Le budget : ce qui est venu d'où, ce qui a été acheté, ce qui reste ; l'attente des branches et le feu à court. */
  budget: Budget;
  /** Le monde partagé de ce joueur (ses passages et ses prises), pour la passe suivante à plusieurs. */
  haltes: { passages: Passage[]; prises: Prise[] };
}

export interface Budget {
  /** Ce que les constructions ont consommé. */
  depense: Partial<Record<Vrac, number>>;
  /** D'où vient ce qu'on a eu : le terrain, chaque lieu, le Comptoir. */
  venu: Partial<Record<"terrain" | "station" | "tas_bois" | "gue" | "banc_galets" | "moulin" | "cooperative" | "comptoir" | "sac_charbon" | "meule" | "route_pont" | "corniche" | "pin_tombe", Partial<Record<Vrac, number>>>>;
  /** Les bûches et les pierres achetées au Comptoir (wotts). */
  achats: number;
  /** Les meules de charbonnière (🔥), et combien en charbonnette. */
  meules: number;
  charbonnette: number;
  /** Minutes passées à attendre que les branches repoussent ; minutes où le feu a manqué de branches. */
  attenteBranches: number;
  feuACourt: number;
  /** Ce qui reste en réserve à la fin. */
  reste: Partial<Record<Vrac, number>>;
}

// ---------- Le moteur ----------

/** Le résultat d'une tentative : fait, à reprendre plus tard (une attente du monde), ou bloqué. */
type Issue = { ok: true } | { ok: false; attente?: number; raison: string };
const OK: Issue = { ok: true };

/** Les options d'un parcours : la graine, et, à plusieurs, sa place dans le serveur simulé. */
export interface OptionsParcours {
  graine?: string;
  joueur?: number;
  /** Quand il commence, en minutes après le premier joueur du serveur. */
  decalage?: number;
  autres?: Autres;
  hypotheses?: Hypotheses;
  /** Les portes d'abord (par défaut : le parcours, §2.6), ou alternées avec le carnet de la 0.7. */
  portes?: ConduiteDesPortes;
}

class Simulation {
  readonly famille: Famille;
  readonly profil: Profil;
  readonly def: DefinitionProfil;
  minute = 0;
  readonly vus = new Set<string>();
  readonly faits: Record<string, number> = {};
  readonly installations = new Map<string, number>();
  readonly finies: string[] = [];
  tuto: number | null = null;
  tutoFini = false;
  readonly devoilees: Set<string>;
  readonly evenements: Evenement[] = [];
  readonly blocages = new Set<string>();
  readonly attentes: Record<string, number> = {};
  /** La minute à partir de laquelle un fait du monde est possible (le charbon défourné, la batterie chargée). */
  readonly pret: Record<string, number> = {};
  /** Ce qui arrive à heure fixe (le monde, la cueillette, les gestes du tutoriel), trié par minute. */
  private readonly agenda: { minute: number; faire: () => void }[] = [];
  /** D'où vient chaque objet qu'on peut se procurer seul. */
  private readonly sources: ReadonlyMap<TypeObjet, Source>;
  private readonly alea: () => number;
  private readonly butsVus = new Set<string>();
  private derniereDecharge = 0;

  // ----- Plan 0.8 : le niveau 1 -----
  readonly h: Hypotheses;
  readonly haltes: Haltes;
  readonly decalage: number;
  /** Les deux foyers : celui de la voie de surface (le premier feu), celui de la voie creusée. */
  readonly foyers: { surface: FormeFeu | null; creuse: FormeFeu | null } = { surface: null, creuse: null };
  /** Les clés de lieu ramassées, et la sortie qui les a rapportées. */
  readonly cles = new Map<TypeObjet, number>();
  readonly stock: Record<Vrac, number> = { buche: 0, pierre: 0, branche: 0, glaise: 0, charbon_bois: 0 };
  /** Ce qu'il reste du vrac du terrain (bûches et pierres, une fois) ; les branches prises, pour leur repousse. */
  readonly terrain: { buche: number; pierre: number } = { buche: TERRAIN_VRAC.buche, pierre: TERRAIN_VRAC.pierre };
  private readonly branchesPrises: number[] = [];
  private feuReste = 0;
  readonly sorties: SortieSimulee[] = [];
  readonly portes: PorteFranchie[] = [];
  readonly atteint: Partial<Record<EtapeMonde, number>> = { maison: 0 };
  /** Les portes du niveau 1 ; `postes` : celles qu'on passe maintenant (le niveau 1, puis le niveau 2). */
  readonly postesN1: Poste[];
  postes: Poste[];
  readonly faits0_8 = new Set<string>();
  readonly budget: Budget = { depense: {}, venu: {}, achats: 0, meules: 0, charbonnette: 0, attenteBranches: 0, feuACourt: 0, reste: {} };
  private enSortie = false;
  readonly portesDabord: boolean;
  /** Ce que la construction en cours attend tout de suite (le ravitaillement le rapporte au moins). */
  private demande: Partial<Record<Vrac, number>> = {};
  private premiereNuitBrulee = false;
  readonly postesFaits: { id: string; minute: number }[] = [];
  /** La minute où tout le niveau 1 est bâti. */
  private niveau1Le: number | null = null;

  // ----- Plan 0.10 (chantier M) : le niveau 2 -----
  /** Le parcours en est au niveau 2 (les objets-clés de l'hôtel et du phare, les roulements, les péages). */
  niveau2 = false;
  /** Les roulements à billes sous la main (des boîtes ouvertes), les boîtes ouvertes et celles achetées au Comptoir. */
  roulements = 0;
  boites = { hotel: 0, chance: 0, comptoir: 0 };
  /** Les péages payés (12 wotts d'objets à l'aller, une fois par voyage ; S-19, V2-01). */
  readonly peages: { minute: number; passage: PassagePeage }[] = [];
  /** Le phare : depuis quand on voudrait y aller, et l'attente de la nuit à chaque fois (minutes). */
  private phareVoulu: number | null = null;
  readonly attentesNuit: number[] = [];
  /** Ce que le Comptoir a vendu au niveau 2 (wotts : les boîtes de roulements). */
  achatsN2 = 0;

  constructor(profil: Profil, famille: Famille, o: OptionsParcours = {}) {
    this.profil = profil;
    this.famille = famille;
    this.def = PROFILS[profil];
    this.devoilees = new Set(devoileesAuDepart());
    this.sources = trouvables(famille, true).objets;
    this.alea = aleaDe(graineDe("rythme", profil, famille, o.graine ?? ""));
    this.h = o.hypotheses ?? HYPOTHESES_DECIDEES;
    this.decalage = o.decalage ?? 0;
    this.haltes = new Haltes(o.joueur ?? 0, o.autres ?? PERSONNE, this.h, this.def.malchance);
    this.postesN1 = postesNiveau1(famille, this.def.route, this.def.gue);
    this.postes = this.postesN1;
    this.portesDabord = (o.portes ?? "dabord") === "dabord";
    for (const a of agendaDuMonde(profil)) this.planifier(a.minute, () => (a.fait === "volaille_rotie" ? this.voir(["poule", "volaille_crue", "graisse"]) : this.noter(a.fait)));
    if (this.def.curieux) for (const c of CUEILLETTE_CURIEUSE) this.planifier(c.minute, () => this.voir(c.objets));
  }

  planifier(minute: number, faire: () => void): void {
    let i = this.agenda.length;
    while (i > 0 && this.agenda[i - 1]!.minute > minute) i--;
    this.agenda.splice(i, 0, { minute, faire });
  }

  /** Un geste du joueur (tutoriel, installation du vétéran). */
  geste(g: Geste, contexte: string): void {
    const faire = (id: string) => {
      let i = this.fabriquer(id);
      // Le tutoriel attend que ce soit fait : si le monde fait attendre (les branches qui repoussent), on attend.
      for (let garde = 0; !i.ok && i.attente !== undefined && garde < 5; garde++) {
        this.avancer(Math.max(0.5, i.attente - this.minute));
        i = this.fabriquer(id);
      }
      if (!i.ok) this.blocages.add(`${this.famille} : ${contexte}, ${id} : ${i.raison}`);
    };
    if ("voir" in g) this.voir(g.voir);
    else if ("noter" in g) this.noter(g.noter);
    else if ("fouiller" in g) this.voir(Object.keys(tirerVestiges(g.fouiller, this.alea)));
    else if ("sortie" in g) this.sortie(g.sortie, "tutoriel");
    else if ("atelier" in g) {
      faire(ATELIER[this.famille]);
      this.poserPieces();
    } else if (g.fabriquer === "feu_de_camp") {
      // Le feu de camp (une carte) : 5 pierres et 3 branches du terrain.
      const i = this.payer(VOIE_SURFACE[0]!.couts[0]!);
      if (!i.ok) this.blocages.add(`${this.famille} : ${contexte}, feu de camp : ${i.raison}`);
      this.foyers.surface = "feu_camp";
      this.majFeux();
    } else faire(g.fabriquer);
  }

  // ----- L'état, tel que le serveur le voit -----

  quetesVues(): Set<string> {
    if (this.tuto !== null) return new Set();
    const enCours = this.lignesQuetes().map((l) => queteSuivante(l, this.famille, this.finies)).filter((q): q is Quete => q !== null);
    return new Set([...enCours.map((q) => q.id), ...this.finies]);
  }

  lignesQuetes(): LigneQuete[] {
    return this.def.lignes.filter((l): l is LigneQuete => l !== "portes");
  }

  etat(): EtatPourDevoilement {
    return {
      famille: this.famille,
      vus: this.vus,
      faits: this.faits,
      installations: this.installations,
      quetes: this.quetesVues(),
      tuto: this.tuto ?? (this.tutoFini ? 12 : null),
      minutes: this.minute,
      sansSac: false,
      devoilees: this.devoilees,
    };
  }

  reevaluer(): void {
    if (this.niveau1Le === null) {
      for (const p of this.postesN1) if (!this.postesFaits.some((x) => x.id === p.id) && this.posteFait(p)) this.postesFaits.push({ id: p.id, minute: this.minute });
      if (this.postesFaits.length === this.postesN1.length) this.niveau1Le = this.minute;
    }
    const neuves = aDevoiler(this.etat());
    if (neuves.length === 0) return;
    for (const id of neuves) this.devoilees.add(id);
    this.evenements.push({ minute: this.minute, genre: "recette", quoi: neuves });
  }

  but(cle: string, libelle: string): void {
    if (this.butsVus.has(cle)) return;
    this.butsVus.add(cle);
    this.evenements.push({ minute: this.minute, genre: "but", quoi: [libelle] });
  }

  voir(objets: Iterable<string>): void {
    for (const o of objets) this.vus.add(o);
  }

  noter(fait: string, n = 1): void {
    this.faits[fait] = (this.faits[fait] ?? 0) + n;
  }

  // ----- Le temps qui passe, et le monde qui vit -----

  /** Avance de `dt` minutes : ce que le monde fait entre-temps est noté à sa minute, et le filet du temps joue. */
  avancer(dt: number): void {
    const fin = this.minute + dt;
    for (;;) {
      const prochain = Math.min(this.agenda[0]?.minute ?? Infinity, ...[20, 60, 120].filter((m) => m > this.minute));
      if (prochain > fin) break;
      this.brulerBranches(Math.max(this.minute, prochain) - this.minute);
      this.minute = Math.max(this.minute, prochain);
      while (this.agenda.length > 0 && this.agenda[0]!.minute <= this.minute) this.agenda.shift()!.faire();
      this.reevaluer();
    }
    this.brulerBranches(fin - this.minute);
    // Une sortie faite au milieu (un geste du tutoriel) a pu mener plus loin : le temps ne recule jamais.
    this.minute = Math.max(this.minute, fin);
    // La décharge du terrain remonte un objet toutes les deux heures : on y passe en rentrant.
    if (this.minute - this.derniereDecharge >= 120) {
      this.derniereDecharge = this.minute;
      const table = tableDecharge();
      const total = table.reduce((s, [, p]) => s + p, 0);
      let r = this.alea() * total;
      for (const [t, p] of table) {
        if (r < p) {
          this.voir([t]);
          break;
        }
        r -= p;
      }
    }
    this.reevaluer();
  }

  /**
   * Le feu de tous les jours (B14) : des branches du terrain, une à une. Qui n'en trouve pas met une bûche (la première
   * nuit, s'il ne suit pas le conseil : `buchesPremiereNuit`), sinon son feu a manqué de bois.
   */
  brulerBranches(dt: number): void {
    if (dt <= 0 || this.foyers.surface === null || this.enSortie) return;
    if (!this.premiereNuitBrulee && (this.faits.nuit ?? 0) > 0) {
      this.premiereNuitBrulee = true;
      const k = Math.min(this.h.buchesPremiereNuit, this.terrain.buche + this.stock.buche);
      this.prendreChezSoi("buche", k);
      this.depenser("buche", k);
    }
    this.feuReste += dt * BRANCHES_FEU_PAR_MIN;
    while (this.feuReste >= 1) {
      if (this.stock.branche > 0) {
        this.stock.branche--;
        this.feuReste -= 1;
      } else if (this.branchesDispo() > 0) {
        this.branchesPrises.push(this.minute);
        this.feuReste -= 1;
      } else {
        this.budget.feuACourt += this.feuReste / BRANCHES_FEU_PAR_MIN;
        this.feuReste = 0;
      }
    }
  }

  /**
   * Pas assez de branches pour ce coût : on fera autre chose en attendant qu'elles repoussent (une attente du monde,
   * comme la meule qui cuit), plutôt que de rester planté. null : il y en a assez.
   */
  attendreBranches(cout: Inventaire): Issue | null {
    const k = cout.branche ?? 0;
    const manque = k - this.stock.branche - this.branchesDispo();
    if (k === 0 || manque <= 0) return null;
    const prises = this.branchesPrises.filter((m) => m > this.minute - RETOUR_BRANCHE_MIN).sort((a, b) => a - b);
    const quand = (prises[manque - 1] ?? this.minute) + RETOUR_BRANCHE_MIN + 0.01;
    this.budget.attenteBranches += quand - this.minute;
    return { ok: false, attente: quand, raison: `${k} branches (elles repoussent)` };
  }

  branchesDispo(): number {
    return TERRAIN_VRAC.branche - this.branchesPrises.filter((m) => m > this.minute - RETOUR_BRANCHE_MIN).length;
  }

  /** Minute absolue (le serveur simulé), pour les haltes partagées. */
  get absolu(): number {
    return this.decalage + this.minute;
  }

  // ----- Le budget : payer, ravitailler -----

  private venu(source: keyof Budget["venu"], type: Vrac, k: number): void {
    if (k <= 0) return;
    const v = (this.budget.venu[source] ??= {});
    v[type] = (v[type] ?? 0) + k;
  }

  private depenser(type: Vrac, k: number): void {
    if (k <= 0) return;
    this.stock[type] -= k;
    this.budget.depense[type] = (this.budget.depense[type] ?? 0) + k;
  }

  /** Ramasser chez soi ce qui y reste (les bûches et les pierres du terrain, une fois). */
  private prendreChezSoi(type: "buche" | "pierre", k: number): void {
    const t = Math.max(0, Math.min(k, this.terrain[type]));
    this.terrain[type] -= t;
    this.stock[type] += t;
    this.venu("terrain", type, t);
  }

  /** Ce que demandent encore les portes du niveau 1 qui restent (pour savoir combien rapporter d'une sortie). */
  besoinRestant(type: "buche" | "pierre" | "branche" | "glaise"): number {
    let total = 0;
    for (const p of this.postes) if (!this.posteFait(p)) total += coutPoste(p)[type] ?? 0;
    return total;
  }

  /** Le manque prévu de ce vrac : ce que demandent les portes qui restent, moins le stock et le terrain. */
  manquePrevu(type: "buche" | "pierre"): number {
    return Math.max(0, this.besoinRestant(type) - this.stock[type] - this.terrain[type]);
  }

  /**
   * Ce qu'on rapporte d'une sortie : le manque prévu et une réserve (s'il manque quelque chose), au moins ce que
   * demande tout de suite la construction en cours (`demande`).
   */
  aRapporter(type: "buche" | "pierre"): number {
    const manque = this.manquePrevu(type);
    return Math.max(manque > 0 ? manque + RESERVE : 0, (this.demande[type] ?? 0) - this.stock[type]);
  }

  /**
   * Payer un coût : le vrac compté (bûches, pierres, branches, glaise, charbon) d'abord chez soi, puis, s'il manque,
   * une sortie (le ravitaillement à la station, le gué), le Comptoir, ou l'attente (les branches qui repoussent).
   */
  payer(cout: Inventaire): Issue {
    for (const [t, k] of Object.entries(cout) as [string, number][]) {
      if (!estCompte(t) || !k) continue;
      const i = this.assurer(t, k);
      if (!i.ok) return i;
    }
    for (const [t, k] of Object.entries(cout) as [string, number][]) {
      if (!estCompte(t) || !k) continue;
      if (t === "branche") {
        const duStock = Math.min(k, this.stock.branche);
        this.stock.branche -= duStock;
        for (let j = duStock; j < k; j++) this.branchesPrises.push(this.minute);
        this.budget.depense.branche = (this.budget.depense.branche ?? 0) + k;
      } else this.depenser(t, k);
    }
    if (this.niveau2 && cout.roulement) this.roulements -= cout.roulement;
    return OK;
  }

  /**
   * Avoir `k` roulements sous la main (V1-01) : les boîtes de la machinerie de l'hôtel d'abord (une sortie) ; elle ne
   * les rend qu'au bout de 4 jours (S-03) : au-delà, une boîte au Comptoir (500 wotts, après la visite de l'hôtel).
   */
  private assurerRoulements(k: number): Issue {
    if (this.roulements >= k) return OK;
    if (!this.cles.has("roulements")) {
      const i = this.obtenir("roulements");
      if (!i.ok) return i;
    }
    for (let garde = 0; this.roulements < k && garde < 4; garde++) {
      this.sortie("comptoir", "achat");
      this.ouvrirBoites(1, "comptoir");
      this.achatsN2 += PRIX_CLES_L1.vente;
    }
    return this.roulements >= k ? OK : { ok: false, raison: "roulements" };
  }

  /** Les outils qui ne sont que des objets-clés du niveau 2 (le rabot, le fer à souder) : on va les chercher. */
  private outilsN2(qualites: Partial<Record<Qualite, number>>): Issue {
    if (!this.niveau2) return OK;
    for (const q of Object.keys(qualites) as Qualite[]) {
      const t = OUTILS_NIVEAU_2[q];
      if (!t) continue;
      const i = this.obtenir(t);
      if (!i.ok) return i;
    }
    return OK;
  }

  /** Avoir `k` de ce vrac sous la main. */
  assurer(t: Vrac, k: number): Issue {
    if (t === "branche") {
      // Les branches repoussent en 40 min : on attend, au besoin (on fait autre chose entre-temps).
      let garde = 0;
      while (this.stock.branche + this.branchesDispo() < k && garde++ < 60) {
        this.budget.attenteBranches += 1;
        this.avancer(1);
      }
      return this.stock.branche + this.branchesDispo() >= k ? OK : { ok: false, raison: `${k} branches` };
    }
    if (t === "charbon_bois") {
      let garde = 0;
      while (this.stock.charbon_bois < k && garde++ < 4) {
        const c = this.charbon();
        if (!c.ok) return c;
      }
      return this.stock.charbon_bois >= k ? OK : { ok: false, raison: "charbon" };
    }
    if (t === "buche" || t === "pierre") this.prendreChezSoi(t, k - this.stock[t]);
    let garde = 0;
    this.demande = { [t]: k };
    while (this.stock[t] < k && garde++ < 6) {
      const avant = this.stock[t];
      if (t === "glaise") this.sortie("gue", "glaise");
      else if (t === "pierre") this.sortie(this.atteint.H1B !== undefined || this.def.gue === "parcours" ? "gue" : "station", "pierres");
      else this.sortie(this.niveau2 ? this.haltePourBois() : "station", "ravitaillement");
      if (this.stock[t] < k && (t === "buche" || t === "pierre")) {
        // Le filet payant (B13) : le Comptoir, deux kilomètres après la station.
        const achat = this.haltes.acheter(t, this.absolu, k - this.stock[t]);
        this.stock[t] += achat;
        this.venu("comptoir", t, achat);
        this.budget.achats += achat;
      }
      // Rien n'est revenu : on attend que le vrac revienne (30 min).
      if (this.stock[t] === avant) this.avancer(this.h.retourVracMin / 2);
    }
    this.demande = {};
    return this.stock[t] >= k ? OK : { ok: false, raison: `${t} : il en manque ${k - this.stock[t]}` };
  }

  /**
   * Les branches à rapporter de la lisière d'une halte : ce que demandent les portes qui restent, et le feu d'un
   * quart d'heure, moins ce qu'on a et ce que le terrain offre tout de suite (il repousse en 40 min).
   */
  branchesARapporter(): number {
    return Math.max(0, this.besoinRestant("branche") + Math.ceil(15 * BRANCHES_FEU_PAR_MIN) - this.stock.branche - this.branchesDispo());
  }

  /** Ce que le sac et le travois emportent encore (kg). */
  private capacite(): number {
    const roule = Math.max(this.vus.has("travois") ? CAPACITE_TRAVOIS : 0, this.vus.has("brouette") ? CAPACITE_BROUETTE : 0);
    return CAPACITE_SAC + roule - CHARGE_DE_BASE_KG;
  }

  // ----- Les sorties -----

  /**
   * Une sortie : le trajet, le lieu (sa durée au pas du joueur), ses fouilles tirées au sort, ses clés à place fixe,
   * son vrac et ses tas personnels. Le gué est sur la route du Moulin, la station sur celle de la Coopérative et du
   * Comptoir : on y passe, et l'on y prend ce qu'il faut.
   */
  sortie(lieu: LieuId, motif: MotifSortie): void {
    if (this.enSortie) return;
    this.enSortie = true;
    const s: SortieSimulee = { minute: this.minute, lieu, motif, enPassant: [], rapporte: {}, cles: [], porte: false };
    this.sorties.push(s);
    let charge = 0;
    const porter = (type: Vrac, k: number, source: keyof Budget["venu"]) => {
      if (k <= 0) return;
      this.stock[type] += k;
      s.rapporte[type] = (s.rapporte[type] ?? 0) + k;
      this.venu(source, type, k);
      charge += k * (OBJETS[type as TypeObjet]?.poids ?? 2);
    };
    const place = (kg: number) => Math.max(0, Math.floor((this.capacite() - charge) / kg));
    const arriver = (l: LieuId, duree: number) => {
      const debut = this.absolu;
      this.haltes.passer(l, debut, debut + duree);
      const etape = etapeDuLieu(l);
      if (etape && this.atteint[etape] === undefined) {
        this.atteint[etape] = this.minute;
        this.but(`lieu:${l}`, `Sortie : ${l}`);
      }
      this.noter(`visite:${l}`);
    };
    const duree = (base: number) => base * this.def.facteur;

    // Le garage de la station : la caisse de l'atelier et la pièce de sa famille. Plan 0.8 (chantier 13) : on y arrive
    // au milieu de la visite (on traverse d'abord la cour), ce qui compte quand la visite est celle du tutoriel.
    const garage = () => {
      // La caisse de l'atelier (I1, I2) : la barre, le bocal de clous, le fil de fer, le bidon d'huile.
      this.voir(Object.keys(USAGES.caisse_atelier.donne));
      // La pièce de sa famille (personnelle), et le sac de charbon des Charbonniers (I23).
      const piece = objetPiece(ATELIER[this.famille] as "forge" | "banc_recharge" | "pedalier");
      this.obtenirCle(piece, s);
      charge += OBJETS[piece]?.poids ?? 0;
      if (this.famille === "charbonniers" && !this.faits0_8.has("sac_charbon")) {
        this.faits0_8.add("sac_charbon");
        porter("charbon_bois", USAGES.piece_enclume.donne.charbon_bois ?? 0, "sac_charbon");
      }
    };
    const station = (dureeLa: number, ravitailler: boolean) => {
      arriver("station", dureeLa);
      if (!ravitailler) this.fouiller(["boutique", "atelier", "epave", "grange"], "H1A");
      // Le bois : ce que demandent les portes qui restent, et une réserve ; son tas d'abord, puis le vrac.
      const veut = this.aRapporter("buche");
      porter("buche", this.haltes.prendreTas("tas_bois", this.absolu, Math.min(veut, place(2))), "tas_bois");
      porter("buche", this.haltes.prendreVrac("station", "buche", this.absolu, Math.min(veut - (s.rapporte.buche ?? 0), place(2))), "station");
      const pierres = this.aRapporter("pierre") - (s.rapporte.pierre ?? 0);
      if (pierres > 0) porter("pierre", this.haltes.prendreVrac("station", "pierre", this.absolu, Math.min(pierres, place(2))), "station");
      porter("branche", this.haltes.prendreBranches("station", this.absolu, Math.min(this.branchesARapporter(), place(0.5))), "station");
    };
    const gue = (dureeLa: number) => {
      arriver("gue", dureeLa);
      if (!this.def.malchance) this.cleRare("H1B");
      // La glaise du bac (B6), les pierres : son banc de galets, puis le vrac ; les joncs repoussent comme à la maison.
      const glaise = this.installations.has("forge+bac") ? 0 : Math.max(0, (COUT_BAC.glaise ?? 0) - this.stock.glaise);
      if (this.famille === "charbonniers" && glaise > 0 && !this.niveau2) {
        porter("glaise", Math.min(glaise, place(2)), "gue");
        this.obtenirCle("glaise", s);
      }
      // Plan 0.10 : au niveau 2, la glaise du four de terre (pour tous), de la forge ventilée et du creuset (🔥).
      if (this.niveau2) porter("glaise", Math.min(Math.max(0, Math.max(this.demande.glaise ?? 0, this.besoinRestant("glaise")) - this.stock.glaise), place(2)), "gue");
      const veut = this.aRapporter("pierre");
      porter("pierre", this.haltes.prendreTas("banc_galets", this.absolu, Math.min(veut, place(2))), "banc_galets");
      porter("pierre", this.haltes.prendreVrac("gue", "pierre", this.absolu, Math.min(Math.max(0, veut - (s.rapporte.pierre ?? 0)), place(2))), "gue");
      // Plan 0.9 : les bûches en vrac du gué (au pied des talus, et sur les pelouses quand la table en sème).
      porter("buche", this.haltes.prendreVrac("gue", "buche", this.absolu, Math.min(Math.max(0, this.aRapporter("buche") - (s.rapporte.buche ?? 0)), place(2))), "gue");
      porter("branche", this.haltes.prendreBranches("gue", this.absolu, Math.min(this.branchesARapporter(), place(0.5))), "gue");
    };
    // Plan 0.9 (M5) : le bois et les pierres semés dans un lieu à un joueur (le Moulin, la Coopérative), en repartant.
    const semis = (l: "moulin" | "cooperative") => {
      porter("buche", this.haltes.prendreVrac(l, "buche", this.absolu, Math.min(Math.max(0, this.aRapporter("buche") - (s.rapporte.buche ?? 0)), place(2))), l);
      porter("pierre", this.haltes.prendreVrac(l, "pierre", this.absolu, Math.min(Math.max(0, this.aRapporter("pierre") - (s.rapporte.pierre ?? 0)), place(2))), l);
      porter("branche", this.haltes.prendreBranches(l, this.absolu, Math.min(this.branchesARapporter(), place(0.5))), l);
    };

    // Plan 0.10 : une halte du niveau 2. Le bois : le pin tombé de la corniche (à soi, S-21), puis le vrac ; en deçà de la
    // barricade (sans la passer), une part du vrac seulement. Les pierres et les branches en vrac, en passant.
    const halteN2 = (l: "route_pont" | "corniche", dureeLa: number, traverse: boolean) => {
      arriver(l, dureeLa);
      const veut = this.aRapporter("buche");
      if (l === "corniche") porter("buche", this.haltes.prendreTas("pin_tombe", this.absolu, Math.min(veut, place(2))), "pin_tombe");
      const part = traverse ? Infinity : BUCHES_CORNICHE_EN_DECA;
      porter("buche", this.haltes.prendreVrac(l, "buche", this.absolu, Math.min(Math.max(0, veut - (s.rapporte.buche ?? 0)), place(2), part)), l);
      if (traverse) porter("pierre", this.haltes.prendreVrac(l, "pierre", this.absolu, Math.min(Math.max(0, this.aRapporter("pierre") - (s.rapporte.pierre ?? 0)), place(2))), l);
      porter("branche", this.haltes.prendreBranches(l, this.absolu, Math.min(this.branchesARapporter(), place(0.5))), l);
    };

    switch (lieu) {
      case "station":
        if (motif === "ravitaillement") {
          station(duree(DUREES_SORTIES.ravitaillement), true);
          this.avancerEnSortie(duree(DUREES_SORTIES.ravitaillement));
          break;
        }
        station(duree(DUREES_SORTIES.station), false);
        this.avancerEnSortie(duree(DUREES_SORTIES.station) / 2);
        garage();
        this.avancerEnSortie(duree(DUREES_SORTIES.station) / 2);
        break;
      case "gue":
        gue(duree(DUREES_SORTIES.gue));
        this.avancerEnSortie(duree(DUREES_SORTIES.gue));
        break;
      case "cooperative":
      case "comptoir": {
        arriver(lieu, duree(lieu === "cooperative" ? DUREES_SORTIES.cooperative : DUREES_SORTIES.comptoir));
        if (lieu === "cooperative") {
          this.fouiller(["libre_service", "quai", "atelier_coop", "hangar"], "L1A");
          this.clesDuLieu("cooperative", s, duree(DUREES_SORTIES.cooperative));
        }
        this.avancerEnSortie(duree(lieu === "cooperative" ? DUREES_SORTIES.cooperative : DUREES_SORTIES.comptoir));
        for (const t of s.cles) charge += OBJETS[t]?.poids ?? 0;
        if (lieu === "cooperative") semis("cooperative");
        // Le retour passe par la station : on y prend du bois s'il en manque.
        s.enPassant.push("station");
        station(duree(DUREES_SORTIES.enPassant), true);
        this.avancerEnSortie(duree(DUREES_SORTIES.enPassant));
        break;
      }
      case "moulin": {
        // La route B : le gué d'abord (3 km), puis le Moulin (2 km, B16).
        s.enPassant.push("gue");
        gue(duree(DUREES_SORTIES.enPassant));
        this.avancerEnSortie(duree(DUREES_SORTIES.enPassant));
        arriver("moulin", duree(DUREES_SORTIES.moulin));
        if (!this.def.malchance) this.cleRare("L1B");
        this.clesDuLieu("moulin", s, duree(DUREES_SORTIES.moulin));
        // La fourche à foin, l'if du bief, la grosse clé de la grande porte.
        this.voir(["fourche_foin", "baton_if", "cle_moulin"]);
        this.avancerEnSortie(duree(DUREES_SORTIES.moulin));
        for (const t of s.cles) charge += OBJETS[t]?.poids ?? 0;
        // Les 2 bûches des poutres de chêne (B11), en repartant.
        porter("buche", Math.min(this.haltes.prendrePoutres(this.absolu), place(2)), "moulin");
        semis("moulin");
        break;
      }
      // ---------- Plan 0.10 (chantier M) : le niveau 2 ----------
      case "corniche":
        // Le ravitaillement de bois : le pin tombé (à soi) et les bûches en deçà de la barricade, sans payer.
        halteN2("corniche", duree(DUREES_SORTIES.ravitaillement), false);
        this.avancerEnSortie(duree(DUREES_SORTIES.ravitaillement));
        break;
      case "grand_hotel":
      case "phare": {
        // L'aller : la halte (sa chicane ou sa barricade : le péage, une fois par voyage), son bois et ses pierres s'il en
        // manque, puis le lieu. Le retour repasse la halte librement (V2-01 : dans le sens lieu → terrain, on ne paie pas).
        const { halte, passage } = HALTE_DE[lieu];
        s.enPassant.push(halte);
        this.payerPeage(passage);
        halteN2(halte, duree(DUREES_SORTIES.enPassant), true);
        this.avancerEnSortie(duree(DUREES_SORTIES.enPassant));
        const dureeLa = duree(DUREES_SORTIES_N2[lieu]);
        arriver(lieu, dureeLa);
        this.fouillerN2(lieu);
        // L'arme trouvée du lieu : le pied de guéridon de la terrasse (N2-49), le harpon du gardien (N2-62).
        this.voir([lieu === "grand_hotel" ? "pied_gueridon" : "harpon"]);
        let reste = dureeLa;
        if (lieu === "phare") {
          // La préparation, puis le feu (la nuit, S-14), les 2 min du cargo (S-17) : les objets-clés sont dans l'épave.
          const avant = duree(DUREES_SORTIES_N2.preparerPhare) + DUREES_SORTIES_N2.cargo;
          this.avancerEnSortie(avant);
          reste -= avant;
          this.noter("phare_allume");
        }
        this.clesDuLieu(lieu, s, reste);
        this.avancerEnSortie(reste);
        for (const t of s.cles) charge += OBJETS[t]?.poids ?? 0;
        this.haltes.passer(halte, this.absolu, this.absolu + duree(DUREES_SORTIES.enPassant));
        this.avancerEnSortie(duree(DUREES_SORTIES.enPassant));
        break;
      }
      default:
        this.avancerEnSortie(duree(DUREES_SORTIES.station));
    }
    this.enSortie = false;
    this.poserPieces();
    this.reevaluer();
  }

  /** Le temps passe dehors : le monde vit, mais le feu de la maison se garde couvert (rien à brûler en plus). */
  private avancerEnSortie(dt: number): void {
    this.avancer(dt);
  }

  /** Les fouilles d'un lieu (ses tables), et la clé rare de R-BUTIN (2 %) pour qui n'est pas malchanceux. */
  private fouiller(lieux: LieuFouille[], etape: "H1A" | "L1A"): void {
    const n = this.def.fouilles;
    for (let i = 0; i < n; i++) {
      this.voir(Object.keys(tirerVestiges(lieux[i % lieux.length]!, this.alea)));
      if (!this.def.malchance) this.cleRare(etape);
    }
    if (etape === "H1A") {
      const routes: TypeLieuDechets[] = ["route", "parking"];
      for (let i = 0; i < n; i++) {
        const graine = Math.floor(this.alea() * 1e9);
        this.voir(piecesAmas(graine, routes[i % 2]!, 2));
        this.voir(Object.keys(contenuConteneur(graine + 1, routes[i % 2]!, "sac_poubelle")));
      }
    }
  }

  private cleRare(etape: EtapeButin): void {
    const t = tirerCleRare(etape, this.alea);
    if (t && this.lieuDeCle(t)) this.obtenirCle(t, this.sorties.at(-1)!, "chance");
  }

  /** Le lieu d'une clé de lieu (au niveau 2, aussi les objets-clés de l'hôtel et du phare), sinon undefined. */
  lieuDeCle(t: TypeObjet): LieuId | undefined {
    return CLES_DE_LIEU.get(t) ?? (this.niveau2 ? CLES_NIVEAU_2.get(t) : undefined);
  }

  /**
   * `origine` : à sa place, ou par chance (R-BUTIN). La boîte de roulements (V1-01) : la machinerie de l'hôtel en donne
   * `boitesHotel` d'un coup ; une fouille, une seule.
   */
  private obtenirCle(t: TypeObjet, s: SortieSimulee, origine: "place" | "chance" = "place"): void {
    if (this.cles.has(t)) return;
    this.cles.set(t, this.sorties.indexOf(s));
    s.cles.push(t);
    this.voir([t]);
    // « Tu y penses » (§2.2) : un but nouveau, celui de la porte que la clé ouvre.
    this.but(`idee:${t}`, `Tu y penses : ${OBJETS[t]?.nom ?? t}`);
    if (this.niveau2 && t === "roulements") this.ouvrirBoites(origine === "place" ? this.h.boitesHotel : 1, origine === "place" ? "hotel" : "chance");
  }

  /** Ouvrir des boîtes de roulements (V1-01, DEMONTAGE.roulements) : trois roulements chacune. */
  private ouvrirBoites(n: number, d: "hotel" | "chance" | "comptoir"): void {
    this.boites[d] += n;
    this.roulements += n * (DEMONTAGE.roulements?.donne.roulement ?? 3);
  }

  /** Les clés à place fixe d'un lieu, ramassées au fil de la visite (pas toutes à l'entrée). */
  private clesDuLieu(lieu: LieuId, s: SortieSimulee, duree: number): void {
    const cles = [...CLES_DE_LIEU, ...(this.niveau2 ? CLES_NIVEAU_2 : [])].filter(([, l]) => l === lieu).map(([t]) => t);
    cles.forEach((t, i) => this.planifier(this.minute + ((i + 1) / (cles.length + 1)) * duree, () => this.obtenirCle(t, s)));
  }

  /** Une clé de lieu qu'on n'a pas : on va la chercher (une sortie). Le phare attend la nuit (S-14) : on part à l'heure. */
  obtenir(t: TypeObjet): Issue {
    if (this.cles.has(t)) return OK;
    const lieu = this.lieuDeCle(t)!;
    if (lieu === "phare") {
      const depart = this.departAuPhare();
      if (depart > this.minute + 1e-9) {
        this.phareVoulu ??= this.minute;
        return { ok: false, attente: depart, raison: "le feu attend la nuit" };
      }
      this.attentesNuit.push(this.minute - (this.phareVoulu ?? this.minute));
      this.phareVoulu = null;
    }
    this.sortie(lieu, lieu === "gue" ? "glaise" : "cle");
    return this.cles.has(t) ? OK : { ok: false, raison: `${t} : pas trouvé ${lieu === "station" ? "à la station" : `au lieu ${lieu}`}` };
  }

  /**
   * Quand partir au phare pour que le feu s'allume la nuit (S-14 : de 21 h à 5 h 30) : la traversée de la corniche et la
   * préparation (l'escabeau, le pétrole, le prisme, le compresseur : de jour, c'est possible) passent avant ; le feu,
   * lui, attend la nuit. Maintenant, si l'allumage tombe la nuit ; sinon, à l'heure qui le met à la tombée de la nuit.
   */
  departAuPhare(): number {
    const avant = (DUREES_SORTIES.enPassant + DUREES_SORTIES_N2.preparerPhare) * this.def.facteur;
    const h = heureDuMonde(this.absolu + avant);
    if (estNuit(h)) return this.minute;
    return this.minute + ((HEURE_TOMBEE_NUIT - h + 24) % 24);
  }

  /**
   * Le péage des survivants (§3.4, S-19, V2-01) : 12 wotts d'objets à l'aller, une fois ; payé, on passe librement une
   * heure réelle. Le retour ne le demande jamais.
   */
  private payerPeage(passage: PassagePeage): void {
    const dernier = this.peages.findLast((p) => p.passage === passage);
    if (dernier && this.minute - dernier.minute < DUREE_PASSAGE_MS / 60_000) return;
    this.peages.push({ minute: this.minute, passage });
  }

  /** Les fouilles d'un lieu du niveau 2 (les tables de ses points de fouille), et l'objet-clé rare de R-BUTIN. */
  private fouillerN2(lieu: LieuId): void {
    const tables = FOUILLES_N2[lieu] ?? [];
    const etape = etapeButin(lieu);
    for (let i = 0; i < this.def.fouilles && tables.length > 0; i++) {
      this.voir(Object.keys(tirerVestiges(tables[i % tables.length]!, this.alea)));
      if (!this.def.malchance && etape) this.cleRare(etape);
    }
  }

  /**
   * Où aller chercher du bois au niveau 2 : la station (son tas de bois et son vrac) ou la corniche (le pin tombé et les
   * bûches en deçà de la barricade), là où il y en a le plus pour soi à cet instant ; à égalité, la station.
   */
  haltePourBois(): "station" | "corniche" {
    const t = this.absolu;
    const station = this.haltes.resteTas("tas_bois", t) + this.haltes.vrac("station", "buche", t);
    const corniche = this.haltes.resteTas("pin_tombe", t) + Math.min(BUCHES_CORNICHE_EN_DECA, this.haltes.vrac("corniche", "buche", t));
    return corniche > station ? "corniche" : "station";
  }

  /** Une porte franchie : la clé, et la sortie qui l'a rapportée. */
  private porte(id: string, cle: TypeObjet): void {
    if (this.portes.some((p) => p.id === id)) return;
    this.portes.push({ minute: this.minute, id, cle });
    const i = this.cles.get(cle);
    if (i !== undefined && this.sorties[i]) this.sorties[i]!.porte = true;
  }

  // ----- Fabriquer, ramasser -----

  /** Cet objet se ramasse, se fouille ou se démonte (pas besoin de recette) ? Pas les clés de lieu : il faut sortir. */
  brut(t: TypeObjet): boolean {
    if (this.lieuDeCle(t)) return false;
    const s = this.sources.get(t);
    return s !== undefined && s !== "fabrication" && s !== "autres" && !(t === "charbon_bois" || t === "ebauche_arc_seche" || t === "ebauche_if_seche");
  }

  /**
   * Fournir des ingrédients : les clés de lieu (une sortie), ce qui se ramasse (ce qui peut faire y penser), puis ce qui
   * se fabrique, la voie de base. Le vrac compté (bois, pierre, glaise, charbon) se paie à part (`payer`).
   */
  fournir(ingredients: Inventaire, pour: string, profondeur: number): Issue {
    const aFabriquer: TypeObjet[] = [];
    for (const t of Object.keys(ingredients) as TypeObjet[]) {
      if (estCompte(t)) continue;
      // Plan 0.10 (V1-01) : au niveau 2, les roulements se comptent (trois par boîte, et les boîtes viennent de l'hôtel).
      if (this.niveau2 && t === "roulement") {
        const i = this.assurerRoulements(ingredients[t] ?? 0);
        if (!i.ok) return i;
        continue;
      }
      if (this.lieuDeCle(t)) {
        const i = this.obtenir(t);
        if (!i.ok) return i;
      } else if (this.brut(t)) this.voir([t]);
      else aFabriquer.push(t);
    }
    this.reevaluer();
    for (const t of aFabriquer) {
      if (t === "ebauche_arc_seche" || t === "ebauche_if_seche") return { ok: false, raison: "attend l'ébauche sèche" };
      const m = recetteDeBase(t);
      if (!m) {
        this.blocages.add(`${this.famille} : ${t} introuvable seul (pour ${pour})`);
        return { ok: false, raison: `${t} introuvable` };
      }
      const i = this.fabriquer(m.id, profondeur + 1);
      if (!i.ok) return i;
    }
    return OK;
  }

  /**
   * Fabrique une recette (ou pose une carte), ingrédients compris, et la construction qu'elle demande à côté (le feu de
   * la bonne forme, l'installation au bon niveau, son accessoire), pour de vrai : niveaux, clés, coûts et sorties.
   */
  fabriquer(id: string, profondeur = 0): Issue {
    if (profondeur > 6) return { ok: false, raison: `chaîne trop longue pour ${id}` };
    const r = recette(id);
    if (!r) {
      // Une carte (le foyer Dakota) : il suffit d'y avoir pensé.
      if (!this.devoilees.has(id)) return { ok: false, raison: `${id} pas dévoilé` };
      return OK;
    }
    const lieu = r.lieu;
    if (lieu.genre === "construction" && !lieuPossede(lieu, this.installations)) {
      const i = this.batirPour(lieu, profondeur);
      if (!i.ok) return i;
    }
    const ingredients = this.facon(r);
    const b = this.attendreBranches(ingredients);
    if (b) return b;
    const o = this.outilsN2(r.qualites);
    if (!o.ok) return o;
    const f = this.fournir(ingredients, id, profondeur);
    if (!f.ok) return f;
    if (!this.devoilees.has(id)) return { ok: false, raison: `${id} pas dévoilé` };
    const p = this.payer(ingredients);
    if (!p.ok) return p;
    this.produire(r);
    return OK;
  }

  /**
   * La façon d'une recette à choix (0.8.2, `Recette.auChoix`) : la première dont chaque ingrédient se procure (compté, clé
   * de lieu, ou trouvable par cette famille seule), sinon la première ; une recette sans choix : ses ingrédients.
   */
  facon(r: Recette): Inventaire {
    const facons = faconsRecette(r);
    return facons.find((f) => (Object.keys(f) as TypeObjet[]).every((t) => estCompte(t) || this.lieuDeCle(t) || this.sources.has(t))) ?? facons[0]!;
  }

  /** Les foyers dans la carte des constructions : « feu » au meilleur niveau, chaque forme, les accessoires montés. */
  majFeux(): void {
    for (const k of [...this.installations.keys()]) if (k === "feu" || k.startsWith("feu:")) this.installations.delete(k);
    let niveau = 0;
    for (const forme of [this.foyers.surface, this.foyers.creuse]) {
      if (!forme) continue;
      const voie = forme === "dakota" || forme === "poele_fusee" ? VOIE_CREUSEE : VOIE_SURFACE;
      const n = voie.findIndex((e) => e.id === forme) + 1;
      niveau = Math.max(niveau, n);
      this.installations.set(`feu:${forme}`, 1);
    }
    if (niveau > 0) this.installations.set("feu", niveau);
  }

  /** Une forme du feu : sur le feu d'avant de sa voie, avec ses coûts et sa clé (le grillage du foyer de cuisine). */
  batirFeu(forme: FormeBatie, profondeur = 0): Issue {
    const voie = forme === "dakota" || forme === "poele_fusee" ? "creuse" : "surface";
    const etapes = voie === "creuse" ? VOIE_CREUSEE : VOIE_SURFACE;
    const rang = etapes.findIndex((e) => e.id === forme);
    const actuel = this.foyers[voie];
    const rangActuel = actuel ? etapes.findIndex((e) => e.id === actuel) : -1;
    if (rangActuel >= rang) return OK;
    if (rang > 0 && rangActuel < rang - 1) {
      const avant = this.batirFeu(etapes[rang - 1]!.id as FormeBatie, profondeur + 1);
      if (!avant.ok) return avant;
    }
    if (voie === "surface" && !this.foyers.surface) return { ok: false, raison: "pas de feu de camp" };
    const etape = etapes[rang]!;
    if (etape.aVenir) return { ok: false, raison: `${etape.nom} : plus tard` };
    // Le Dakota, une carte : il faut y avoir pensé (le bâton à fouir, Creuser 1).
    if (forme === "dakota") {
      if (!this.devoilees.has("foyer_dakota")) {
        const b = this.fabriquer("baton_fouir", profondeur + 1);
        if (!b.ok || !this.devoilees.has("foyer_dakota")) return { ok: false, raison: "foyer Dakota pas dévoilé" };
      }
    }
    const cout = etape.couts[0] ?? {};
    const b = this.attendreBranches(cout);
    if (b) return b;
    const f = this.fournir(cout, etape.id, profondeur);
    if (!f.ok) return f;
    const p = this.payer(cout);
    if (!p.ok) return p;
    this.foyers[voie] = forme;
    this.majFeux();
    if (etape.cle?.objet) this.porte(etape.id, etape.cle.objet);
    this.noter(`foyer:${etape.id}`);
    this.reevaluer();
    return OK;
  }

  /** Un accessoire du feu (la broche, la marmite et sa cocotte), sur un foyer qui l'accepte. */
  monterAccessoire(a: AccessoireFeu, profondeur = 0): Issue {
    if (this.installations.has(`feu+${a}`)) return OK;
    const def = ACCESSOIRES_FEU[a];
    if (![this.foyers.surface, this.foyers.creuse].some((f) => f && def.formes.includes(f))) {
      const forme = def.formes.find((f): f is FormeBatie => f === "foyer_pierres" || f === "foyer_cuisine");
      const b = forme ? this.batirFeu(forme, profondeur + 1) : { ok: false as const, raison: `pas de foyer pour ${def.nom}` };
      if (!b.ok) return b;
    }
    const cout = def.couts[0] ?? {};
    const b = this.attendreBranches(cout);
    if (b) return b;
    const f = this.fournir(cout, def.id, profondeur);
    if (!f.ok) return f;
    const p = this.payer(cout);
    if (!p.ok) return p;
    this.installations.set(`feu+${a}`, 1);
    if (def.cle?.objet) this.porte(def.id, def.cle.objet);
    this.reevaluer();
    return OK;
  }

  /**
   * Bâtir la construction qu'une recette demande : la forme du feu, l'installation (posée, puis montée à son niveau),
   * et son accessoire (le bac de trempe, la meule). Ce qui est « plus tard » attend.
   */
  batirPour(lieu: LieuRecette, profondeur: number): Issue {
    if (lieu.genre !== "construction") return OK;
    if (lieu.construction === "feu") {
      if (lieu.accessoire) {
        const a = this.monterAccessoire(lieu.accessoire as AccessoireFeu, profondeur + 1);
        if (!a.ok) return a;
      }
      if (lieuPossede(lieu, this.installations)) return OK;
      const formes = (lieu.formes ?? VOIE_SURFACE.filter((e) => e.niveau >= (lieu.niveau ?? 1)).map((e) => e.id as FormeFeu)) as FormeFeu[];
      for (const forme of ["foyer_pierres", "dakota", "poele_fusee", "foyer_cuisine"] as const) {
        if (!formes.includes(forme)) continue;
        const b = this.batirFeu(forme, profondeur + 1);
        if (b.ok && lieuPossede(lieu, this.installations)) return OK;
      }
      return { ok: false, raison: `attend : ${nomDuLieu(lieu)}` };
    }
    const m = this.monter(lieu.construction, lieu.niveau ?? 1, profondeur + 1);
    if (!m.ok) return m;
    if (lieu.accessoire && lieu.accessoire !== "huile") {
      const a = this.monterAccessoireInstallation(lieu.construction, lieu.accessoire, profondeur + 1);
      if (!a.ok) return a;
    }
    this.reevaluer();
    return OK;
  }

  /** Les accessoires d'installation du niveau 1 : le bac de trempe (🔥), la meule du pédalier (⚙️), la pièce de famille. */
  monterAccessoireInstallation(type: string, accessoire: string, profondeur = 0): Issue {
    const cle = `${type}+${accessoire}`;
    if (this.installations.has(cle)) return OK;
    const m = this.monter(type, 1, profondeur + 1);
    if (!m.ok) return m;
    if (type === "forge" && accessoire === "bac") {
      const g = this.obtenir("glaise");
      if (!g.ok) return g;
      const p = this.payer(COUT_BAC);
      if (!p.ok) return p;
      this.installations.set(cle, 1);
      this.porte("bac", "glaise");
      return OK;
    }
    if (type === "pedalier" && accessoire === "meule") {
      const p = this.payer({ pierre: 3 });
      if (!p.ok) return p;
      this.installations.set(cle, 1);
      return OK;
    }
    // Plan 0.10 : le poste de montage ⚡ et les roulements montés ⚙️ sont des niveaux 2 (meubles-niveau2.ts).
    const deNiveau = ACCESSOIRES_DE_NIVEAU[accessoire];
    if (deNiveau && deNiveau.type === type) {
      const m2 = this.monter(type, deNiveau.niveau, profondeur + 1);
      if (!m2.ok) return m2;
      this.installations.set(cle, deNiveau.niveau);
      return OK;
    }
    // Le creuset 🔥, sur la forge ventilée : 4 glaises, 2 pierres (meubles-neufs.ts).
    if (type === "forge" && accessoire === "creuset") {
      const m2 = this.monter("forge", NIVEAU_FORGE_CREUSET, profondeur + 1);
      if (!m2.ok) return m2;
      const p = this.payer(COUT_CREUSET);
      if (!p.ok) return p;
      this.installations.set(cle, NIVEAU_FORGE_CREUSET);
      return OK;
    }
    const piece = PIECES_DE_FAMILLE[type as keyof typeof PIECES_DE_FAMILLE];
    if (piece === accessoire) {
      const o = this.obtenir(objetPiece(type as "forge" | "banc_recharge" | "pedalier"));
      if (!o.ok) return o;
      this.poserPieces();
      return this.installations.has(cle) ? OK : { ok: false, raison: `${accessoire} pas posé` };
    }
    return { ok: false, raison: `${cle} : plus tard` };
  }

  /** La pièce de famille, dès qu'on a son meuble et sa pièce : on la pose (« poser l'enclume »). */
  poserPieces(): void {
    for (const [type, piece] of Object.entries(PIECES_DE_FAMILLE) as ["forge" | "banc_recharge" | "pedalier", string][]) {
      const cle = `${type}+${piece}`;
      if (this.installations.has(cle) || !this.installations.has(type) || !this.cles.has(objetPiece(type))) continue;
      this.installations.set(cle, 1);
      this.porte(type, objetPiece(type));
      this.reevaluer();
    }
  }

  /**
   * Monter une installation à un niveau (plan 0.8 §2.1) : le niveau d'avant posé, les matériaux, la clé (une sortie,
   * s'il le faut) ; le niveau 1, c'est la poser (sa recette). « Plus tard » attend.
   */
  monter(type: string, niveau: number, profondeur = 0): Issue {
    if (profondeur > 8) return { ok: false, raison: `chaîne trop longue pour ${type}` };
    if ((this.installations.get(type) ?? 0) >= niveau) return OK;
    if (niveau <= 1) {
      const ri = RECETTES.find((x) => "installation" in x.produit && x.produit.installation === type);
      if (!ri) return { ok: false, raison: `installation ${type} introuvable` };
      return this.fabriquer(ri.id, profondeur + 1);
    }
    const avant = this.monter(type, niveau - 1, profondeur + 1);
    if (!avant.ok) return avant;
    const etape = lignee(type)?.[niveau - 1];
    if (!etape) return { ok: false, raison: `${type} niveau ${niveau}` };
    if (etape.aVenir) return { ok: false, raison: `${etape.nom} : plus tard` };
    const cout = etape.couts[0] ?? {};
    const b = this.attendreBranches(cout);
    if (b) return b;
    const o = this.outilsN2(etape.qualites);
    if (!o.ok) return o;
    const f = this.fournir(cout, etape.id, profondeur);
    if (!f.ok) return f;
    const p = this.payer(cout);
    if (!p.ok) return p;
    this.voir(Object.keys(cout).filter((t) => !this.lieuDeCle(t as TypeObjet)));
    this.installations.set(type, niveau);
    // Les accessoires montés suivent le niveau du meuble (lieu-recette.ts, carteInstallations : « forge+bac » au niveau 2) ;
    // le poste de montage et les roulements montés sont des niveaux, que la carte montre comme des accessoires.
    for (const [acc, a] of Object.entries(ACCESSOIRES_DE_NIVEAU)) if (a.type === type && niveau >= a.niveau) this.installations.set(`${type}+${acc}`, niveau);
    for (const k of [...this.installations.keys()]) if (k.startsWith(`${type}+`)) this.installations.set(k, Math.max(this.installations.get(k)!, niveau));
    if (etape.cle?.objet) this.porte(etape.id, etape.cle.objet);
    this.noter(`niveau:${etape.id}`);
    this.reevaluer();
    return OK;
  }

  /** Du charbon de bois : bâtir la meule (10 bûches, ou la charbonnette : 5 bûches et 20 branches), attendre qu'elle cuise, défourner. */
  charbon(): Issue {
    if (this.pret.defourne === undefined) {
      // La charbonnette (B9) quand les bûches manquent et qu'elle est dévoilée ; sinon la meule de bûches.
      // Plan 0.10 : au niveau 2, la charbonnette seulement si ses branches sont là (le feu de tous les jours prend celles du
      // terrain) ; sinon la meule de bûches, quitte à aller en chercher.
      const branches = recette("charbonniere_charbonnette")?.ingredients.branche ?? 0;
      const charbonnette = this.devoilees.has("charbonniere_charbonnette") && this.stock.buche + this.terrain.buche < 10 && (!this.niveau2 || this.stock.branche + this.branchesDispo() >= branches);
      const i = this.fabriquer(charbonnette ? "charbonniere_charbonnette" : "charbonniere");
      if (!i.ok) return i;
    }
    if (this.minute < this.pret.defourne!) return { ok: false, attente: this.pret.defourne, raison: "la meule cuit" };
    // Défourner : 4 charbons (la meule disparaît ; on la refait pour la fournée suivante).
    delete this.pret.defourne;
    this.installations.delete("charbonniere");
    this.noter("defourne");
    this.stock.charbon_bois += 4;
    this.venu("meule", "charbon_bois", 4);
    this.voir(["charbon_bois"]);
    this.reevaluer();
    return OK;
  }

  produire(r: Recette): void {
    this.noter(`fabrique:${r.id}`);
    if ("objet" in r.produit) this.voir([r.produit.objet]);
    else this.installations.set(r.produit.installation, Math.max(1, this.installations.get(r.produit.installation) ?? 0));
    if (r.sousProduits) this.voir(Object.keys(r.sousProduits));
    if (r.id === "charbonniere" || r.id === "charbonniere_charbonnette") {
      this.pret.defourne = this.minute + ATTENTE.defourne;
      this.budget.meules++;
      if (r.id === "charbonniere_charbonnette") this.budget.charbonnette++;
    }
    if (r.id === "panneau_solaire") this.pret.wh = this.minute + ATTENTE.wh_panneau;
    if (r.id === ATELIER[this.famille]) this.poserPieces();
    this.reevaluer();
  }

  /** La première qui réussit. */
  unDe(essais: (() => Issue)[]): Issue {
    let derniere: Issue = { ok: false, raison: "rien" };
    let attente: Issue | null = null;
    for (const e of essais) {
      derniere = e();
      if (derniere.ok) return derniere;
      if (derniere.attente !== undefined && !attente) attente = derniere;
    }
    // Une voie qui n'attend que le temps vaut mieux qu'une voie bloquée.
    return attente ?? derniere;
  }

  // ----- Les portes du niveau 1 -----

  posteFait(p: Poste): boolean {
    switch (p.genre) {
      case "recette": {
        const rc = recette(p.recette);
        if (!rc) return false;
        return "installation" in rc.produit ? this.installations.has(rc.produit.installation) || (this.faits[`fabrique:${p.recette}`] ?? 0) > 0 : (this.faits[`fabrique:${p.recette}`] ?? 0) > 0 || this.vus.has(rc.produit.objet);
      }
      case "niveau":
        return (this.installations.get(p.type) ?? 0) >= p.niveau;
      case "feu": {
        const voie = p.forme === "dakota" || p.forme === "poele_fusee" ? VOIE_CREUSEE : VOIE_SURFACE;
        const actuel = p.forme === "dakota" || p.forme === "poele_fusee" ? this.foyers.creuse : this.foyers.surface;
        return actuel !== null && voie.findIndex((e) => e.id === actuel) >= voie.findIndex((e) => e.id === p.forme);
      }
      case "accessoire":
        return this.installations.has(`feu+${p.accessoire}`);
      case "piece":
        return this.installations.has(`${p.type}+${PIECES_DE_FAMILLE[p.type]}`);
      case "bac":
        return this.installations.has("forge+bac");
      case "meule":
        return this.installations.has("pedalier+meule");
      case "gue":
        return this.atteint.H1B !== undefined;
      case "objet2":
        return (this.faits[`n2:${p.recette}`] ?? 0) > 0;
      case "accessoire2":
        return this.installations.has(`${p.type}+${p.accessoire}`);
    }
  }

  fairePoste(p: Poste): Issue {
    switch (p.genre) {
      case "recette": {
        const rc = recette(p.recette);
        // Une installation se pose une fois ; un objet (l'arbalète, la matraque), au moins une fois.
        if (rc && !this.devoilees.has(p.recette)) return { ok: false, raison: `${p.recette} pas dévoilé` };
        return this.fabriquer(p.recette);
      }
      case "niveau":
        return this.monter(p.type, p.niveau);
      case "feu":
        return this.batirFeu(p.forme);
      case "accessoire":
        return this.monterAccessoire(p.accessoire);
      case "piece":
        return this.monterAccessoireInstallation(p.type, PIECES_DE_FAMILLE[p.type]!);
      case "bac":
        return this.monterAccessoireInstallation("forge", "bac");
      case "meule":
        return this.monterAccessoireInstallation("pedalier", "meule");
      case "gue":
        this.sortie("gue", "parcours");
        return OK;
      case "objet2": {
        if (!this.devoilees.has(p.recette)) return { ok: false, raison: `${p.recette} pas dévoilé` };
        const i = this.fabriquer(p.recette);
        if (i.ok) this.noter(`n2:${p.recette}`);
        return i;
      }
      case "accessoire2":
        return this.monterAccessoireInstallation(p.type, p.accessoire);
    }
  }

  /** La porte suivante du niveau 1 qu'on peut tenter maintenant (null : tout est fait, ou tout attend). */
  porteSuivante(enAttente: ReadonlyMap<string, number>): Poste | null {
    return this.postes.find((p) => !this.posteFait(p) && (enAttente.get(p.id) ?? 0) <= this.minute) ?? null;
  }

  // ----- Les objectifs du carnet -----

  remplir(c: Condition): Issue {
    switch (c.a) {
      case "fait":
        return this.faireFait(c.fait, c.but);
      case "faits": {
        const f = c.faits.find((x) => x.startsWith("fabrique:")) ?? c.faits[0]!;
        return this.faireFait(f, c.but);
      }
      case "installation": {
        if (c.avec === "meule") return this.monterAccessoireInstallation("pedalier", "meule");
        if (c.avec === "alternateur" || c.avec === "panneau") return this.monterAccessoireInstallation(c.type, c.avec);
        if (c.avec === "dynamo") {
          // La dynamo du vélo (le repli de l'alternateur) : il suffit du pédalier.
          const m = this.monter(c.type, 1);
          if (m.ok) this.noter(`monte:${c.avec}`);
          return m;
        }
        return this.monter(c.type, c.niveau ?? 1);
      }
      case "objet": {
        if (c.n === 1 && !c.etoiles && c.types.some((t) => this.vus.has(t))) return OK;
        const t = c.types[0]!;
        if (t === "charbon_bois") return this.charbonDispo(c.n);
        if (this.lieuDeCle(t)) return this.obtenir(t);
        if (this.brut(t)) {
          this.voir([t]);
          return OK;
        }
        const r = recetteDeBase(t);
        return r ? this.fabriquer(r.id) : { ok: false, raison: `${t} sans recette` };
      }
      case "wh":
        if (this.pret.wh === undefined) return { ok: false, raison: "rien pour charger" };
        return this.minute >= this.pret.wh ? OK : { ok: false, attente: this.pret.wh, raison: "la batterie charge" };
      case "un_de":
        return this.unDe(c.conditions.map((x) => () => this.remplir(x)));
      default:
        return OK;
    }
  }

  /** Avoir du charbon sous la main (le sac de la station d'abord, puis une meule). */
  charbonDispo(n: number): Issue {
    if (this.stock.charbon_bois >= n || (this.faits.defourne ?? 0) > 0) return OK;
    return this.charbon();
  }

  faireFait(fait: string, but: number): Issue {
    const reussi = (): Issue => {
      this.noter(fait, Math.max(0, but - (this.faits[fait] ?? 0)));
      this.reevaluer();
      return OK;
    };
    if (fait.startsWith("fabrique:")) {
      const i = this.fabriquer(fait.slice("fabrique:".length));
      return i.ok ? reussi() : i;
    }
    switch (fait) {
      case "plat_mange": {
        const i = this.unDe(["cepes_poeles", "pommes_cuites", "volaille_cepes"].map((id) => () => this.fabriquer(id)));
        return i.ok ? reussi() : i;
      }
      case "foyer_dakota": {
        const d = this.batirFeu("dakota");
        return d.ok ? reussi() : d;
      }
      case "tete:fleche": {
        const i = this.fabriquer("fleches_durcies");
        return i.ok ? reussi() : i;
      }
      case "tete:carreau": {
        const i = this.fabriquer("carreaux_os");
        return i.ok ? reussi() : i;
      }
      case "defourne": {
        if ((this.faits.defourne ?? 0) > 0) return OK;
        const c = this.charbon();
        return c.ok ? OK : c;
      }
      case "depot_wh": {
        const w = this.remplir({ a: "wh", but: 1 });
        return w.ok ? reussi() : w;
      }
      case "foyer:foyer_pierres":
      case "foyer:foyer_cuisine": {
        const b = this.batirFeu(fait.slice("foyer:".length) as FormeBatie);
        return b.ok ? reussi() : b;
      }
      default:
        // Les faits du voyage et du métier (vendre, affûter, détruire à la décharge…) : le travail suffit.
        if (fait === "echange") return { ok: false, raison: "attend un autre joueur" };
        return reussi();
    }
  }

  /** Tente une quête : ses objectifs dans l'ordre, son travail, son voyage. */
  faireQuete(q: Quete): Issue {
    if (QUETES_SOCIALES.has(q.id)) return { ok: false, raison: "attend un autre joueur" };
    const d = DUREES_QUETES[q.id] ?? { travail: 8 };
    for (const o of q.objectifs) {
      const i = this.remplir(o.condition);
      if (!i.ok) return i;
    }
    // Le voyage fait partie du travail de la quête (il n'est pas compté deux fois).
    const avant = this.minute;
    if (d.lieu) this.sortie(d.lieu, "quete");
    this.avancer(Math.max(1, d.travail * this.def.facteur - (this.minute - avant)));
    if (q.id === "dynamo") this.pret.wh = this.minute;
    // Le panneau posé sur le banc solaire (plan 0.8, chantier 7) : la batterie charge au soleil.
    if (q.id === "panneau_pose") this.pret.wh = this.minute + ATTENTE.wh_panneau;
    this.finies.push(q.id);
    this.reevaluer();
    return OK;
  }

  // ----- Le début : le tutoriel, ou son équivalent -----

  tutoriel(): void {
    const etapes = etapesTutoriel(this.famille);
    for (let etape = 0; etape < etapes.length; etape++) {
      const titre = etapes[etape]!.titre;
      this.tuto = etape;
      this.but(`tuto:${etape}`, `Tutoriel : ${titre}`);
      this.reevaluer();
      for (const id of recettesDeLEtape(etape, this.famille)) {
        if (!this.devoilees.has(id)) this.blocages.add(`${this.famille} : le tutoriel (étape ${etape + 1}) demande ${id}, pas dévoilé`);
      }
      const duree = (DUREES_TUTO[titre] ?? 4) * this.def.facteur;
      for (const [part, g] of GESTES_TUTO[titre] ?? []) this.planifier(this.minute + part * duree, () => this.geste(g, `tutoriel étape ${etape + 1}`));
      this.avancer(duree);
    }
    this.tuto = null;
    this.tutoFini = true;
    this.noter("tutoriel_fini");
    this.reevaluer();
  }

  /** Le vétéran : il passe le tutoriel, connaît d'emblée les paliers 1 et 2, et s'installe seul entre deux objectifs. */
  debutSansTutoriel(): void {
    this.avancer(0.5);
    const neuves = devoileesDEmblee(this.famille).filter((id) => !this.devoilees.has(id));
    for (const id of neuves) this.devoilees.add(id);
    this.evenements.push({ minute: this.minute, genre: "recette", quoi: neuves });
    this.reevaluer();
    for (const [minute, g] of INSTALLATION_DU_VETERAN) this.planifier(minute, () => this.geste(g, "sans tutoriel"));
  }

  // ----- Le carnet, ligne par ligne -----

  /**
   * Le carnet : une quête en cours par ligne, et la porte suivante du niveau 1. Le joueur commence par sa ligne
   * préférée, puis passe à la suivante après chaque objectif réussi (il alterne) ; ce qui attend le monde (la meule,
   * la charge) est repris plus tard.
   */
  carnet(): void {
    const reprise = new Map<string, number>();
    const enSouffrance = new Map<string, { depuis: number; raison: string }>();
    const portesEnAttente = new Map<string, number>();
    const lignes = this.def.lignes;
    let debut = 0;
    while (this.minute < HORIZON_MIN) {
      let ordre = lignes.map((_, i) => lignes[(debut + i) % lignes.length]!);
      // Qui suit le parcours (§1.1) passe la porte que le carnet nomme avant tout le reste.
      if (this.portesDabord) ordre = ["portes", ...ordre.filter((l) => l !== "portes")];
      const actives: { ligne: LigneSimulee; quete?: Quete; poste?: Poste }[] = [];
      for (const l of ordre) {
        if (l === "portes") {
          const p = this.porteSuivante(portesEnAttente);
          if (p) actives.push({ ligne: l, poste: p });
        } else {
          const q = queteSuivante(l, this.famille, this.finies);
          if (q) actives.push({ ligne: l, quete: q });
        }
      }
      for (const a of actives) {
        if (a.quete && !QUETES_SOCIALES.has(a.quete.id)) this.but(`quete:${a.quete.id}`, `Quête : ${a.quete.titre}`);
        // Le carnet nomme la porte suivante (§2.6, chantier 13) : un but nouveau.
        if (a.poste) this.but(`porte:${a.poste.id}`, `Porte : ${nomPoste(a.poste)}`);
      }
      this.reevaluer();
      let avance = false;
      for (const a of actives) {
        const id = a.quete ? a.quete.id : `porte:${a.poste!.id}`;
        if ((reprise.get(id) ?? 0) > this.minute) continue;
        let i: Issue;
        if (a.quete) i = this.faireQuete(a.quete);
        else {
          i = this.fairePoste(a.poste!);
          if (i.ok) this.avancer(TRAVAIL_PORTE * this.def.facteur);
        }
        if (i.ok) {
          const s = enSouffrance.get(id);
          if (s) this.attentes[id] = (this.attentes[id] ?? 0) + (this.minute - s.depuis);
          enSouffrance.delete(id);
          debut = (lignes.indexOf(a.ligne) + 1) % lignes.length;
          avance = true;
          break;
        }
        if (i.attente !== undefined) reprise.set(id, i.attente);
        else if (a.poste) {
          // Une porte qui ne passe pas encore (une recette pas encore dévoilée) : on la reprend un peu plus tard.
          portesEnAttente.set(a.poste.id, this.minute + 10);
          if (!enSouffrance.has(id)) enSouffrance.set(id, { depuis: this.minute, raison: i.raison });
        } else if (i.raison !== "attend un autre joueur" && !enSouffrance.has(id)) enSouffrance.set(id, { depuis: this.minute, raison: i.raison });
      }
      if (avance) continue;
      // Rien à faire tout de suite : on explore, on ramasse, on attend que la meule cuise.
      const restantes = actives.filter((a) => !a.quete || !QUETES_SOCIALES.has(a.quete.id));
      if (restantes.length === 0 && !this.postes.some((p) => !this.posteFait(p))) break;
      const prochaine = Math.min(...restantes.map((a) => reprise.get(a.quete ? a.quete.id : `porte:${a.poste!.id}`) ?? Infinity), ...[...portesEnAttente.values()].filter((m) => m > this.minute));
      this.avancer(Number.isFinite(prochaine) ? Math.max(1, Math.min(5, prochaine - this.minute)) : 5);
    }
    for (const [id, s] of enSouffrance) {
      // Une porte finalement franchie (par une autre ligne) n'est pas un blocage.
      const p = id.startsWith("porte:") ? this.postes.find((x) => `porte:${x.id}` === id) : undefined;
      if (p && this.posteFait(p)) continue;
      this.blocages.add(`${this.famille} : ${id.startsWith("porte:") ? `la porte « ${id.slice(6)} »` : `la quête « ${id} »`} bloque depuis la minute ${Math.round(s.depuis)} (${s.raison})`);
    }
  }

  jouer(): ResultatParcours {
    if (this.def.tuto) this.tutoriel();
    else this.debutSansTutoriel();
    this.carnet();
    const niveau1 = this.postes.every((p) => this.posteFait(p)) ? this.niveau1Le : null;
    for (const t of COMPTES) if (this.stock[t]) this.budget.reste[t] = this.stock[t];
    if (this.terrain.buche) this.budget.reste.buche = (this.budget.reste.buche ?? 0) + this.terrain.buche;
    if (this.terrain.pierre) this.budget.reste.pierre = (this.budget.reste.pierre ?? 0) + this.terrain.pierre;
    return {
      profil: this.profil,
      famille: this.famille,
      evenements: this.evenements,
      blocages: [...this.blocages],
      attentes: this.attentes,
      mesures: mesurer(this.evenements, this.finies.length, this.devoilees.size, this.sorties, this.portes, niveau1),
      sorties: this.sorties,
      portes: this.portes,
      postesFaits: this.postesFaits,
      atteint: this.atteint,
      budget: this.budget,
      haltes: { passages: this.haltes.passages, prises: this.haltes.prises },
    };
  }

  // ----- Plan 0.10 (chantier M) : le niveau 2, après la première soirée -----

  /**
   * Le carnet du niveau 2 : les portes du niveau 2 l'une après l'autre (le carnet les nomme, comme au niveau 1), ce qui
   * attend (la nuit du phare, un dévoilement) est repris plus tard, et l'on passe à la suivante en attendant.
   */
  carnetNiveau2(fin: number): { id: string; minute: number }[] {
    const faits: { id: string; minute: number }[] = [];
    const reprise = new Map<string, number>();
    const enSouffrance = new Map<string, { depuis: number; raison: string }>();
    const noter = () => {
      for (const p of this.postes) if (!faits.some((x) => x.id === p.id) && this.posteFait(p)) faits.push({ id: p.id, minute: this.minute });
    };
    while (this.minute < fin) {
      noter();
      const p = this.postes.find((x) => !this.posteFait(x) && (reprise.get(x.id) ?? 0) <= this.minute);
      if (!p) {
        const restants = this.postes.filter((x) => !this.posteFait(x));
        if (restants.length === 0) break;
        const prochaine = Math.min(...restants.map((x) => reprise.get(x.id) ?? Infinity));
        this.avancer(Number.isFinite(prochaine) ? Math.max(0.5, Math.min(5, prochaine - this.minute)) : 5);
        continue;
      }
      this.but(`porte2:${p.id}`, `Porte : ${nomPoste(p)}`);
      const i = this.fairePoste(p);
      if (i.ok) {
        enSouffrance.delete(p.id);
        this.avancer(TRAVAIL_PORTE * this.def.facteur);
        continue;
      }
      if (i.attente !== undefined && i.attente > this.minute) reprise.set(p.id, i.attente);
      else {
        reprise.set(p.id, this.minute + 10);
        if (!enSouffrance.has(p.id)) enSouffrance.set(p.id, { depuis: this.minute, raison: i.raison });
      }
    }
    noter();
    for (const [id, x] of enSouffrance) {
      const p = this.postes.find((y) => y.id === id);
      if (p && !this.posteFait(p)) this.blocages.add(`${this.famille} : niveau 2, la porte « ${id} » bloque depuis la minute ${Math.round(x.depuis)} (${x.raison})`);
    }
    return faits;
  }

  /** Le niveau 2 (après `jouer`) : ses portes, ses sorties, ses péages, son budget, depuis la fin de la première soirée. */
  jouerNiveau2(seulementFamille = false): ResultatNiveau2 {
    this.niveau2 = true;
    const debut = this.minute;
    this.postes = postesNiveau2(this.famille, this.def.route, seulementFamille);
    const s0 = this.sorties.length;
    const p0 = this.portes.length;
    const e0 = this.evenements.length;
    const b0 = new Set(this.blocages);
    const depense0 = { ...this.budget.depense };
    const venu0 = JSON.parse(JSON.stringify(this.budget.venu)) as Budget["venu"];
    const faits = this.carnetNiveau2(debut + HORIZON_NIVEAU_2_MIN);
    const rel = (m: number) => m - debut;
    const sorties = this.sorties.slice(s0);
    const portes = this.portes.slice(p0);
    const buts = this.evenements.slice(e0).filter((e) => e.genre === "but").map((e) => e.minute);
    const atteint: ResultatNiveau2["atteint"] = {};
    for (const e of ["H2A", "H2B", "L2A", "L2B"] as const) if (this.atteint[e] !== undefined) atteint[e] = rel(this.atteint[e]!);
    const depense: Partial<Record<Vrac, number>> = {};
    for (const t of COMPTES) {
      const d = (this.budget.depense[t] ?? 0) - (depense0[t] ?? 0);
      if (d) depense[t] = d;
    }
    const venu: Budget["venu"] = {};
    for (const [src, v] of Object.entries(this.budget.venu) as [keyof Budget["venu"], Partial<Record<Vrac, number>>][]) {
      for (const t of COMPTES) {
        const d = (v[t] ?? 0) - (venu0[src]?.[t] ?? 0);
        if (d > 0) (venu[src] ??= {})[t] = d;
      }
    }
    const tout = faits.length === this.postes.length ? rel(Math.max(...faits.map((f) => f.minute))) : null;
    const dernierBut = buts.length ? Math.max(...buts) : debut;
    return {
      profil: this.profil,
      famille: this.famille,
      debut,
      postes: this.postes.map((p) => p.id),
      postesFaits: faits.map((f) => ({ id: f.id, minute: rel(f.minute) })),
      tout,
      atteint,
      sorties: sorties.map((x) => ({ ...x, minute: rel(x.minute) })),
      portes: portes.map((x) => ({ ...x, minute: rel(x.minute) })),
      peages: this.peages.map((x) => ({ ...x, minute: rel(x.minute) })),
      ravitaillements: sorties.filter((x) => x.motif === "ravitaillement" || x.motif === "pierres" || x.motif === "glaise").map((x) => ({ lieu: x.lieu, motif: x.motif })),
      roulements: { ...this.boites, reste: this.roulements },
      achats: this.achatsN2 + 0,
      attentesNuit: [...this.attentesNuit],
      ecartButs: buts.length ? ecartMax(buts, debut, dernierBut) : 0,
      blocages: [...this.blocages].filter((b) => !b0.has(b)),
      depense,
      venu,
      haltes: { passages: this.haltes.passages, prises: this.haltes.prises },
    };
  }
}

/**
 * Ce que coûte une porte en bois, en pierre et en glaise (pour savoir combien rapporter) ; la meule de charbonnière
 * comprise. Au niveau 2, le charbon d'une recette se compte en bûches (une meule : 10 bûches pour 4 charbons).
 */
export function coutPoste(p: Poste): Partial<Record<"buche" | "pierre" | "branche" | "glaise", number>> {
  const de = (inv: Inventaire | undefined) => ({ buche: inv?.buche ?? 0, pierre: inv?.pierre ?? 0, branche: inv?.branche ?? 0, glaise: inv?.glaise ?? 0 });
  switch (p.genre) {
    case "recette": {
      const rc = recette(p.recette);
      const base = de(rc?.ingredients);
      // L'arbalète : son arbrier (1 bûche) ; la matraque : son gourdin (1 bûche).
      if (p.recette === "arbalete") base.buche += recette("arbrier")?.ingredients.buche ?? 0;
      if (p.recette === "matraque_fortune") base.buche += recette("gourdin")?.ingredients.buche ?? 0;
      return base;
    }
    case "niveau": {
      if (p.niveau === 1) return de(RECETTES.find((x) => "installation" in x.produit && x.produit.installation === p.type)?.ingredients);
      return de(lignee(p.type)?.[p.niveau - 1]?.couts[0]);
    }
    case "feu": {
      const voie = p.forme === "dakota" || p.forme === "poele_fusee" ? VOIE_CREUSEE : VOIE_SURFACE;
      return de(voie.find((e) => e.id === p.forme)?.couts[0]);
    }
    case "accessoire":
      return de(ACCESSOIRES_FEU[p.accessoire].couts[0]);
    case "bac":
      return de(COUT_BAC);
    case "meule":
      return { pierre: 3 };
    // La meule de charbonnière compte avec sa recette (r("charbonniere")).
    case "piece":
    case "gue":
      return {};
    case "objet2": {
      const rc = recette(p.recette);
      const base = de(rc?.ingredients);
      base.buche += ((rc?.ingredients.charbon_bois ?? 0) * 10) / CHARBON_PRODUIT;
      return base;
    }
    case "accessoire2":
      return de(COUT_CREUSET);
  }
}

/** Le nom d'une porte, pour le rapport. */
export function nomPoste(p: Poste): string {
  switch (p.genre) {
    case "recette":
      return recette(p.recette)?.nom ?? p.recette;
    case "niveau":
      return lignee(p.type)?.[p.niveau - 1]?.nom ?? `${p.type} ${p.niveau}`;
    case "feu":
      return [...VOIE_SURFACE, ...VOIE_CREUSEE].find((e) => e.id === p.forme)?.nom ?? p.forme;
    case "accessoire":
      return ACCESSOIRES_FEU[p.accessoire].nom;
    case "piece":
      return `${OBJETS[objetPiece(p.type)]?.nom ?? p.id} posé sur le meuble`;
    case "bac":
      return "Bac de trempe";
    case "meule":
      return "Meule du pédalier";
    case "gue":
      return "Le Gué-aux-Saules";
    case "objet2":
      return recette(p.recette)?.nom ?? p.recette;
    case "accessoire2":
      return "Creuset et moules";
  }
}

/** Le plus long écart entre des instants triés, bornes comprises. */
function ecartMax(instants: number[], debut: number, fin: number): number {
  const t = [debut, ...instants.filter((x) => x >= debut && x <= fin).sort((a, b) => a - b), fin];
  let max = 0;
  for (let i = 1; i < t.length; i++) max = Math.max(max, t[i]! - t[i - 1]!);
  return max;
}

export function mesurer(evenements: readonly Evenement[], quetesFinies: number, recettes: number, sorties: readonly SortieSimulee[] = [], portes: readonly PorteFranchie[] = [], niveau1: number | null = null): Mesures {
  const D = CIBLE.debutMin;
  const tous = evenements.map((e) => e.minute);
  const rec = evenements.filter((e) => e.genre === "recette").map((e) => e.minute);
  const buts = evenements.filter((e) => e.genre === "but").map((e) => e.minute);
  const dernierBut = Math.max(0, ...buts);
  const instantsPortes = portes.map((p) => p.minute);
  const s3h = sorties.filter((s) => s.minute <= CIBLE.troisHeures);
  return {
    nouveautesDebut: tous.filter((m) => m <= D).length,
    ecartNouveautesDebut: ecartMax(tous, 0, D),
    recettesDebut: evenements.filter((e) => e.genre === "recette" && e.minute <= D).reduce((s, e) => s + e.quoi.length, 0),
    ecartRecettesDebut: ecartMax(rec, 0, D),
    ecartButsEnsuite: dernierBut > D ? ecartMax(buts, D, Math.min(dernierBut, CIBLE.troisHeures)) : 0,
    ecartButsTout: dernierBut > D ? ecartMax(buts, D, dernierBut) : 0,
    dernierBut,
    recettes,
    quetesFinies,
    premiereSortie: sorties[0]?.minute ?? null,
    ecartPortes: instantsPortes.length > 1 ? ecartMax(instantsPortes, Math.min(...instantsPortes), Math.max(...instantsPortes)) : 0,
    sorties3h: s3h.length,
    sansPorte3h: s3h.filter((s) => !s.porte).length,
    sortiesButin3h: s3h.filter((s) => s.lieu !== "comptoir").length,
    sansPorteButin3h: s3h.filter((s) => s.lieu !== "comptoir" && !s.porte).length,
    niveau1,
    dernierePorte: instantsPortes.length ? Math.max(...instantsPortes) : null,
    ravitaillements: sorties.filter((s) => s.motif === "ravitaillement").length,
  };
}

/** Le niveau 2 d'un parcours (minutes depuis le début du niveau 2, sauf `debut`). */
export interface ResultatNiveau2 {
  profil: Profil;
  famille: Famille;
  /** Quand le niveau 2 commence (minutes de jeu connecté depuis le début : la fin de la première soirée). */
  debut: number;
  /** Les portes du niveau 2, dans l'ordre, et quand chacune a été passée. */
  postes: string[];
  postesFaits: { id: string; minute: number }[];
  /** Tout le niveau 2 bâti, null s'il ne l'a pas à l'horizon. */
  tout: number | null;
  atteint: Partial<Record<"H2A" | "H2B" | "L2A" | "L2B", number>>;
  sorties: SortieSimulee[];
  portes: PorteFranchie[];
  /** Les péages payés (12 wotts d'objets chacun). */
  peages: { minute: number; passage: PassagePeage }[];
  /** Les allers-retours de ravitaillement (le bois, les pierres, la glaise), et où. */
  ravitaillements: { lieu: LieuId; motif: MotifSortie }[];
  /** Les boîtes de roulements ouvertes (de l'hôtel, par chance, du Comptoir) et les roulements qui restent. */
  roulements: { hotel: number; chance: number; comptoir: number; reste: number };
  /** Ce que le Comptoir a vendu (wotts). */
  achats: number;
  /** Chaque départ au phare : combien de temps il a attendu la nuit (en faisant autre chose). */
  attentesNuit: number[];
  /** Le plus long écart entre deux buts nouveaux au niveau 2. */
  ecartButs: number;
  blocages: string[];
  /** Ce que le niveau 2 a coûté en bois, pierre, glaise, charbon, et d'où c'est venu. */
  depense: Partial<Record<Vrac, number>>;
  venu: Budget["venu"];
  haltes: { passages: Passage[]; prises: Prise[] };
}

/**
 * Joue un parcours type jusqu'au bout du niveau 2 : la première soirée (le niveau 1, `jouerParcours`), puis le niveau 2.
 * `seulementFamille` : le niveau 2 ne fait que le meuble de famille et son métier (critère 8).
 */
export function jouerParcoursN2(profil: Profil, famille: Famille, o: OptionsParcours & { seulementFamille?: boolean } = {}): { niveau1: ResultatParcours; niveau2: ResultatNiveau2 } {
  const sim = new Simulation(profil, famille, o);
  // Une copie : le niveau 2 continue la même simulation (ses tableaux d'événements, de sorties, de portes grandissent).
  const niveau1 = structuredClone(sim.jouer());
  const niveau2 = sim.jouerNiveau2(o.seulementFamille ?? false);
  return { niveau1, niveau2 };
}

/** Ce que les péages ont coûté (wotts d'objets, au prix du Comptoir : 12 par passage, N2-59). */
export function wottsDePeage(r: ResultatNiveau2): number {
  return r.peages.length * PRIX_PASSAGE;
}

/** Tous les parcours types, jusqu'au bout du niveau 2. */
export function tousLesParcoursN2(): ResultatNiveau2[] {
  const familles: Famille[] = ["charbonniers", "voltaiques", "mecanistes"];
  return (Object.keys(PROFILS) as Profil[]).flatMap((p) => familles.map((f) => jouerParcoursN2(p, f).niveau2));
}

/** Joue un parcours type. */
export function jouerParcours(profil: Profil, famille: Famille, o: OptionsParcours = {}): ResultatParcours {
  return new Simulation(profil, famille, o).jouer();
}

/** Tous les parcours types : chaque profil, chaque famille. */
export function tousLesParcours(): ResultatParcours[] {
  const familles: Famille[] = ["charbonniers", "voltaiques", "mecanistes"];
  return (Object.keys(PROFILS) as Profil[]).flatMap((p) => familles.map((f) => jouerParcours(p, f)));
}

/** Ce qui ne tient pas la cible, parcours par parcours (vide : le rythme tient). */
export function ecartsALaCible(r: ResultatParcours): string[] {
  const m = r.mesures;
  const p = PROFILS[r.profil];
  const fautes: string[] = [];
  const qui = `${p.nom}, ${r.famille}`;
  const c = cibleDuProfil(r.profil);
  if (c.nouveautes !== null && m.nouveautesDebut < c.nouveautes) fautes.push(`${qui} : ${m.nouveautesDebut} nouveautés dans la première demi-heure (${c.nouveautes} au moins)`);
  if (c.trou !== null && m.ecartNouveautesDebut > c.trou + 1e-9) fautes.push(`${qui} : ${m.ecartNouveautesDebut.toFixed(1)} min sans nouveauté dans la première demi-heure`);
  if (m.ecartButsEnsuite > c.buts + 1e-9) fautes.push(`${qui} : ${m.ecartButsEnsuite.toFixed(1)} min sans but nouveau après la première demi-heure`);
  if (r.blocages.length > 0) fautes.push(`${qui} : ${r.blocages.length} blocage(s)`);
  return fautes;
}

/**
 * Le niveau 1 au regard des critères de réussite du plan 0.8 (§5) qui se tiennent par le code : la première sortie
 * avant 60 min et au plus une sortie de butin sur quatre sans porte dans les trois premières heures (critère 11), tout le
 * niveau 1 à l'horizon, sans blocage, et les allers-retours de ravitaillement par famille (critère 6 : ⚡ 0, ⚙️ 0 à 1,
 * 🔥 1 au plus). Vide : tout tient. Le temps du niveau 1 (≈ 3 h 20 pour le prudent) se lit à part : `tempsDuNiveau1`.
 */
export function ecartsAuNiveau1(r: ResultatParcours): string[] {
  const m = r.mesures;
  const qui = `${PROFILS[r.profil].nom}, ${r.famille}`;
  const fautes: string[] = [];
  if (m.premiereSortie === null || m.premiereSortie > CIBLE.premiereSortieMax) fautes.push(`${qui} : première sortie à ${m.premiereSortie === null ? "—" : m.premiereSortie.toFixed(0)} min (avant ${CIBLE.premiereSortieMax})`);
  if (m.sortiesButin3h > 0 && m.sansPorteButin3h / m.sortiesButin3h > CIBLE.sansPorteMax + 1e-9) fautes.push(`${qui} : ${m.sansPorteButin3h} sorties sans porte sur ${m.sortiesButin3h} dans les trois premières heures (au plus une sur quatre)`);
  if (m.niveau1 === null) fautes.push(`${qui} : pas tout le niveau 1 à ${HORIZON_MIN} min`);
  if (m.ravitaillements > RAVITAILLEMENTS_MAX[r.famille]) fautes.push(`${qui} : ${m.ravitaillements} allers-retours de ravitaillement (au plus ${RAVITAILLEMENTS_MAX[r.famille]})`);
  return fautes;
}

/**
 * Le critère 6 : tout le niveau 1 en ≈ 3 h 20 pour le prudent (à 10 % près), lu de deux façons : les portes à clé (ce
 * que les sorties ouvrent, le parcours du §1.1), et tout le niveau 1 avec le reste de la maison et du métier. null : pas
 * de cible pour ce profil.
 */
export function tempsDuNiveau1(r: ResultatParcours): { portes: number | null; tout: number | null; portesTiennent: boolean; toutTient: boolean } | null {
  if (r.profil !== "prudent") return null;
  const tient = (t: number | null) => t !== null && t <= CIBLE.niveau1Prudent * 1.1;
  return { portes: r.mesures.dernierePorte, tout: r.mesures.niveau1, portesTiennent: tient(r.mesures.dernierePorte), toutTient: tient(r.mesures.niveau1) };
}

/** Le budget décidé (§2.7) : en plus de la visite du tutoriel, ⚡ 0, ⚙️ 0 à 1, 🔥 1 aller-retour à la station. */
export const RAVITAILLEMENTS_MAX: Readonly<Record<Famille, number>> = { voltaiques: 0, mecanistes: 1, charbonniers: 1 };

/**
 * La cible, au pas du joueur : le prudent prend son temps (×1,3), on lui accorde d'autant plus ; le pressé n'en est
 * pas plus exigeant. Le vétéran qui saute le tutoriel a choisi de tout savoir d'un coup (les paliers 1 et 2 d'emblée) :
 * on ne lui doit que des buts réguliers (null : pas de cible).
 */
export function cibleDuProfil(profil: Profil): { nouveautes: number | null; trou: number | null; buts: number } {
  const p = PROFILS[profil];
  const pas = Math.max(1, p.facteur);
  return {
    nouveautes: p.tuto ? Math.floor(CIBLE.nouveautesDebutMin / pas) : null,
    trou: p.tuto ? CIBLE.trouDebutMax * pas : null,
    buts: CIBLE.ecartButsMax * pas,
  };
}

/** Les quêtes qu'une famille voit (pour vérifier que chacune dévoile ce qu'elle demande). */
export function quetesDeLaFamille(famille: Famille): Quete[] {
  return QUETES.filter((q) => !q.famille || q.famille === famille);
}

// ---------- À plusieurs : le serveur simulé (plan 0.8 §2.7, B8 ; critère 7) ----------

/** Un joueur du serveur simulé : son profil, sa famille, et quand il commence (minutes après le premier). */
export interface JoueurSimule {
  profil: Profil;
  famille: Famille;
  decalage: number;
}

export interface ResultatServeur {
  joueurs: ResultatParcours[];
  /** Le plus long moment où la station n'a plus de bûches en vrac, le gué plus de pierres (critère 7 : 30 min au plus). */
  videStation: number;
  videGue: number;
}

/**
 * Plusieurs joueurs sur un serveur : chacun joue son parcours, et les haltes sont partagées. On rejoue chacun avec ce
 * que les autres ont fait des haltes à la passe d'avant (passages, prises, achats), jusqu'à ce que tout s'accorde (trois
 * passes suffisent : les prises ne bougent plus).
 */
export function simulerServeur(joueurs: readonly JoueurSimule[], h: Hypotheses = HYPOTHESES_DECIDEES, passes = 3): ResultatServeur {
  const decaler = (x: { passages: Passage[]; prises: Prise[] }, i: number) => ({ passages: x.passages.map((p) => ({ ...p, joueur: i })), prises: x.prises.map((p) => ({ ...p, joueur: i })) });
  let resultats: ResultatParcours[] = joueurs.map((j, i) => jouerParcours(j.profil, j.famille, { joueur: i, decalage: j.decalage, hypotheses: h, graine: `j${i}` }));
  for (let passe = 1; passe < passes; passe++) {
    const mondes = resultats.map((r, i) => decaler(r.haltes, i));
    resultats = joueurs.map((j, i) => {
      const autres: Autres = { passages: mondes.filter((_, k) => k !== i).flatMap((m) => m.passages), prises: mondes.filter((_, k) => k !== i).flatMap((m) => m.prises) };
      return jouerParcours(j.profil, j.famille, { joueur: i, decalage: j.decalage, hypotheses: h, graine: `j${i}`, autres });
    });
  }
  const tous: Autres = { passages: resultats.flatMap((r) => r.haltes.passages), prises: resultats.flatMap((r) => r.haltes.prises) };
  const fin = Math.max(...joueurs.map((j) => j.decalage)) + HORIZON_MIN;
  return { joueurs: resultats, videStation: plusLongVide(tous, "station", "buche", fin, h), videGue: plusLongVide(tous, "gue", "pierre", fin, h) };
}

/** Les serveurs du test de jeu : seul, à trois (une famille chacun), à cinq (en file, puis ensemble). */
export const SERVEURS: Readonly<Record<"trois" | "cinq_en_file" | "cinq_ensemble", readonly JoueurSimule[]>> = {
  trois: [
    { profil: "prudent", famille: "charbonniers", decalage: 0 },
    { profil: "prudent", famille: "voltaiques", decalage: 5 },
    { profil: "prudent", famille: "mecanistes", decalage: 10 },
  ],
  // Cinq joueurs qui arrivent l'un après l'autre : chacun trouve la station juste après le précédent (le pire du vrac).
  cinq_en_file: [
    { profil: "prudent", famille: "voltaiques", decalage: 0 },
    { profil: "presse", famille: "mecanistes", decalage: 3 },
    { profil: "prudent", famille: "charbonniers", decalage: 6 },
    { profil: "prudent", famille: "mecanistes", decalage: 9 },
    { profil: "prudent", famille: "charbonniers", decalage: 12 },
  ],
  // Cinq joueurs ensemble : à la station en même temps, le vrac est à ×3 (B8).
  cinq_ensemble: [
    { profil: "prudent", famille: "charbonniers", decalage: 0 },
    { profil: "prudent", famille: "voltaiques", decalage: 0 },
    { profil: "prudent", famille: "mecanistes", decalage: 0 },
    { profil: "prudent", famille: "charbonniers", decalage: 0 },
    { profil: "prudent", famille: "mecanistes", decalage: 0 },
  ],
};

/** La malchance : le pire de plusieurs tirages (graines), au regard du temps jusqu'à tout le niveau 1. */
export function pireMalchance(famille: Famille, tirages = 20): ResultatParcours {
  let pire: ResultatParcours | null = null;
  for (let g = 0; g < tirages; g++) {
    const r = jouerParcours("malchanceux", famille, { graine: `m${g}` });
    const t = r.mesures.niveau1 ?? Infinity;
    if (!pire || t > (pire.mesures.niveau1 ?? Infinity) || (t === (pire.mesures.niveau1 ?? Infinity) && r.mesures.ravitaillements > pire.mesures.ravitaillements)) pire = r;
  }
  return pire!;
}

// ---------- Le budget de pierre et de bois, famille par famille (plan 0.8 §2.7 ; critère 6) ----------

const FAMILLES_BUDGET: readonly Famille[] = ["voltaiques", "mecanistes", "charbonniers"];

/** Le budget d'une famille dans un scénario : les allers-retours, les achats, ce qu'on a eu d'où. */
export interface LigneBudget {
  famille: Famille;
  /** Le pire des joueurs de cette famille dans le scénario. */
  ravitaillements: number;
  achats: number;
  /** Ce que le niveau 1 a coûté (bûches, pierres, branches) et d'où sont venues les bûches et les pierres. */
  depense: Partial<Record<Vrac, number>>;
  venu: Budget["venu"];
  /** Tout le niveau 1 (minutes), du plus lent des joueurs de cette famille. */
  niveau1: number | null;
  attenteBranches: number;
  feuACourt: number;
}

/** Les scénarios du budget : seul (le prudent), le malchanceux (vrac toujours vidé), à trois, à cinq. */
export type ScenarioBudget = "seul" | "malchanceux" | "trois" | "cinq_en_file" | "cinq_ensemble";

export function budgetNiveau1(scenario: ScenarioBudget, h: Hypotheses = HYPOTHESES_DECIDEES): LigneBudget[] {
  const joueurs: ResultatParcours[] =
    scenario === "seul"
      ? FAMILLES_BUDGET.map((f) => jouerParcours("prudent", f, { hypotheses: h }))
      : scenario === "malchanceux"
        ? FAMILLES_BUDGET.map((f) => jouerParcours("malchanceux", f, { hypotheses: h }))
        : simulerServeur(SERVEURS[scenario], h).joueurs;
  return FAMILLES_BUDGET.flatMap((famille) => {
    const les = joueurs.filter((r) => r.famille === famille);
    if (les.length === 0) return [];
    const pire = les.reduce((a, b) => (b.mesures.ravitaillements + b.budget.achats > a.mesures.ravitaillements + a.budget.achats ? b : a));
    const t = les.map((r) => r.mesures.niveau1);
    return [
      {
        famille,
        ravitaillements: Math.max(...les.map((r) => r.mesures.ravitaillements)),
        achats: Math.max(...les.map((r) => r.budget.achats)),
        depense: pire.budget.depense,
        venu: pire.budget.venu,
        niveau1: t.includes(null) ? null : Math.max(...(t as number[])),
        attenteBranches: Math.max(...les.map((r) => r.budget.attenteBranches)),
        feuACourt: Math.max(...les.map((r) => r.budget.feuACourt)),
      },
    ];
  });
}

/**
 * Les chiffres « à vérifier en test » (§2.7 : le tas de bois de 10 bûches et son retour de 6 h, le stock du Comptoir),
 * et le conseil de la première nuit (B14) : on les fait varier un à un, et l'on regarde les allers-retours de
 * ravitaillement, famille par famille, seul et à cinq (en file : le pire du vrac partagé).
 */
export const VARIANTES: readonly { nom: string; h: Hypotheses }[] = [
  { nom: "Décidé (§2.7)", h: HYPOTHESES_DECIDEES },
  { nom: "Tas de bois à 8 bûches", h: { ...HYPOTHESES_DECIDEES, tasBois: 8 } },
  { nom: "Tas de bois à 6 bûches", h: { ...HYPOTHESES_DECIDEES, tasBois: 6 } },
  { nom: "Sans tas de bois", h: { ...HYPOTHESES_DECIDEES, tasBois: 0 } },
  { nom: "Tas et banc de galets de retour en 3 h", h: { ...HYPOTHESES_DECIDEES, retourTasMin: 180, retourBancMin: 180 } },
  { nom: "Comptoir sans bûches ni pierres", h: { ...HYPOTHESES_DECIDEES, stockComptoir: 0 } },
  { nom: "6 bûches brûlées la première nuit (B14 pas suivi)", h: { ...HYPOTHESES_DECIDEES, buchesPremiereNuit: 6 } },
  { nom: "6 bûches la première nuit, tas à 8", h: { ...HYPOTHESES_DECIDEES, buchesPremiereNuit: 6, tasBois: 8 } },
];

export interface LigneSensibilite {
  nom: string;
  /** Par famille : allers-retours seul, à cinq (en file), et bûches achetées au Comptoir (le pire des deux). */
  familles: Record<Famille, { seul: number; cinq: number; achats: number }>;
}

export function sensibilite(): LigneSensibilite[] {
  return VARIANTES.map(({ nom, h }) => {
    const seul = budgetNiveau1("seul", h);
    const cinq = budgetNiveau1("cinq_en_file", h);
    const familles = {} as LigneSensibilite["familles"];
    for (const f of FAMILLES_BUDGET) {
      const a = seul.find((x) => x.famille === f)!;
      const b = cinq.find((x) => x.famille === f)!;
      familles[f] = { seul: a.ravitaillements, cinq: b.ravitaillements, achats: Math.max(a.achats, b.achats) };
    }
    return { nom, familles };
  });
}

// ---------- Le niveau 2 : les cibles, à plusieurs, le budget (plan 0.10, chantier M) ----------

/**
 * Les cibles du niveau 2 (plan 0.10 §4 chantier M, §6 critères 1 à 8 et 11 ; notice §3.i) :
 * - chaque parcours a tout le niveau 2 à l'horizon, sans blocage ;
 * - les allers-retours de ravitaillement (le bois, les pierres, la glaise), en plus des sorties aux lieux : « confortable »,
 *   4 au plus (notice §3.i) ; pour le bois des 🔥, 3 au plus (N2-29 : « 2 à 3 allers-retours de bois ») ;
 * - le péage (12 wotts) à l'aller seulement, une fois par voyage (S-19, V2-01) ;
 * - le feu du phare allumé la nuit seulement (S-14) ;
 * - une charge de sac par route : les matériaux des évolutions d'un lieu, et ses objets-clés, tiennent chacun dans un
 *   sac à dos (≈ 45 kg libres) — rythme-niveau2.ts le mesure ;
 * - le Mécaniste seul a son meuble de famille et son métier sans aller au phare (critère 8).
 */
export const CIBLE_NIVEAU_2 = { ravitaillementsMax: 4, boisCharbonniersMax: 3 } as const;

/** Les allers-retours de bois d'un parcours du niveau 2 (à la station ou à la corniche). */
export function ravitaillementsBois(r: ResultatNiveau2): number {
  return r.ravitaillements.filter((x) => x.motif === "ravitaillement").length;
}

/** Le feu de ce départ au phare s'allume-t-il la nuit (S-14) ? (la traversée et la préparation, puis le feu) */
export function allumeLaNuit(r: ResultatNiveau2, s: SortieSimulee): boolean {
  const avant = (DUREES_SORTIES.enPassant + DUREES_SORTIES_N2.preparerPhare) * PROFILS[r.profil].facteur;
  return estNuit(heureDuMonde(r.debut + s.minute + avant));
}

/** Ce qui ne tient pas les cibles du niveau 2, parcours par parcours (vide : tout tient). */
export function ecartsAuNiveau2(r: ResultatNiveau2): string[] {
  const qui = `${PROFILS[r.profil].nom}, ${r.famille}`;
  const fautes: string[] = [];
  if (r.tout === null) fautes.push(`${qui} : pas tout le niveau 2 en ${HORIZON_NIVEAU_2_MIN} min`);
  if (r.blocages.length > 0) fautes.push(`${qui} : ${r.blocages.length} blocage(s) au niveau 2`);
  if (r.ravitaillements.length > CIBLE_NIVEAU_2.ravitaillementsMax) fautes.push(`${qui} : ${r.ravitaillements.length} allers-retours de ravitaillement au niveau 2 (au plus ${CIBLE_NIVEAU_2.ravitaillementsMax})`);
  if (r.famille === "charbonniers" && ravitaillementsBois(r) > CIBLE_NIVEAU_2.boisCharbonniersMax) fautes.push(`${qui} : ${ravitaillementsBois(r)} allers-retours de bois (au plus ${CIBLE_NIVEAU_2.boisCharbonniersMax})`);
  // Le péage : un par voyage vers un lieu du niveau 2 (l'heure de passage libre peut en couvrir deux), jamais au retour.
  const versLieux = r.sorties.filter((s) => s.lieu === "grand_hotel" || s.lieu === "phare");
  if (r.peages.length > versLieux.length || r.peages.some((p) => !versLieux.some((s) => s.minute === p.minute))) fautes.push(`${qui} : un péage hors d'un aller vers l'hôtel ou le phare`);
  for (const s of r.sorties.filter((x) => x.lieu === "phare")) if (!allumeLaNuit(r, s)) fautes.push(`${qui} : le feu du phare allumé de jour (départ à ${Math.round(s.minute)} min)`);
  return fautes;
}

/** Plusieurs joueurs jusqu'au bout du niveau 2 : les haltes partagées (le vrac de la corniche et du pont, B8). */
export function simulerServeurN2(joueurs: readonly JoueurSimule[], h: Hypotheses = HYPOTHESES_DECIDEES, passes = 3): { joueurs: ResultatNiveau2[]; videCorniche: number; videPont: number } {
  const decaler = (x: { passages: Passage[]; prises: Prise[] }, i: number) => ({ passages: x.passages.map((p) => ({ ...p, joueur: i })), prises: x.prises.map((p) => ({ ...p, joueur: i })) });
  let resultats = joueurs.map((j, i) => jouerParcoursN2(j.profil, j.famille, { joueur: i, decalage: j.decalage, hypotheses: h, graine: `j${i}` }).niveau2);
  for (let passe = 1; passe < passes; passe++) {
    const mondes = resultats.map((r, i) => decaler(r.haltes, i));
    resultats = joueurs.map((j, i) => {
      const autres: Autres = { passages: mondes.filter((_, k) => k !== i).flatMap((m) => m.passages), prises: mondes.filter((_, k) => k !== i).flatMap((m) => m.prises) };
      return jouerParcoursN2(j.profil, j.famille, { joueur: i, decalage: j.decalage, hypotheses: h, graine: `j${i}`, autres }).niveau2;
    });
  }
  const tous: Autres = { passages: resultats.flatMap((r) => r.haltes.passages), prises: resultats.flatMap((r) => r.haltes.prises) };
  const fin = Math.max(...joueurs.map((j) => j.decalage)) + HORIZON_MIN + HORIZON_NIVEAU_2_MIN;
  return { joueurs: resultats, videCorniche: plusLongVide(tous, "corniche", "buche", fin, h), videPont: plusLongVide(tous, "route_pont", "buche", fin, h) };
}

/** Le malchanceux du niveau 2 : le pire de plusieurs tirages, au regard du temps de tout le niveau 2. */
export function pireMalchanceN2(famille: Famille, tirages = 10, h: Hypotheses = HYPOTHESES_DECIDEES): ResultatNiveau2 {
  let pire: ResultatNiveau2 | null = null;
  for (let g = 0; g < tirages; g++) {
    const r = jouerParcoursN2("malchanceux", famille, { graine: `m${g}`, hypotheses: h }).niveau2;
    const t = r.tout ?? Infinity;
    if (!pire || t > (pire.tout ?? Infinity) || (t === (pire.tout ?? Infinity) && r.ravitaillements.length > pire.ravitaillements.length)) pire = r;
  }
  return pire!;
}

/** Le budget du niveau 2 d'une famille dans un scénario : le pire de ses joueurs. */
export interface LigneBudgetN2 {
  famille: Famille;
  ravitaillements: number;
  bois: number;
  peages: number;
  achats: number;
  /** Les bûches, pierres, glaises et charbons du niveau 2, et d'où sont venues les bûches. */
  depense: Partial<Record<Vrac, number>>;
  venu: Budget["venu"];
  tout: number | null;
}

export function budgetNiveau2(scenario: "seul" | "malchanceux" | "cinq_en_file", h: Hypotheses = HYPOTHESES_DECIDEES): LigneBudgetN2[] {
  const joueurs: ResultatNiveau2[] =
    scenario === "seul"
      ? FAMILLES_BUDGET.map((f) => jouerParcoursN2("prudent", f, { hypotheses: h }).niveau2)
      : scenario === "malchanceux"
        ? FAMILLES_BUDGET.map((f) => pireMalchanceN2(f, 10, h))
        : simulerServeurN2(SERVEURS.cinq_en_file, h).joueurs;
  return FAMILLES_BUDGET.flatMap((famille) => {
    const les = joueurs.filter((r) => r.famille === famille);
    if (les.length === 0) return [];
    const pire = les.reduce((a, b) => (b.ravitaillements.length + b.achats > a.ravitaillements.length + a.achats ? b : a));
    const t = les.map((r) => r.tout);
    return [
      {
        famille,
        ravitaillements: Math.max(...les.map((r) => r.ravitaillements.length)),
        bois: Math.max(...les.map(ravitaillementsBois)),
        peages: Math.max(...les.map((r) => r.peages.length)),
        achats: Math.max(...les.map((r) => r.achats)),
        depense: pire.depense,
        venu: pire.venu,
        tout: t.includes(null) ? null : Math.max(...(t as number[])),
      },
    ];
  });
}

/**
 * Les chiffres du niveau 2 qu'on fait varier (plan 0.10 : le pin tombé, 10 bûches en 6 h ; V1-01 : les boîtes de la
 * machinerie de l'hôtel) : les allers-retours, les achats au Comptoir, le temps de tout le niveau 2, seul.
 */
export const VARIANTES_N2: readonly { nom: string; h: Hypotheses }[] = [
  { nom: "Décidé (code de la 0.10)", h: HYPOTHESES_DECIDEES },
  { nom: "La machinerie donne 1 boîte de roulements", h: { ...HYPOTHESES_DECIDEES, boitesHotel: 1 } },
  { nom: "La machinerie donne 2 boîtes de roulements", h: { ...HYPOTHESES_DECIDEES, boitesHotel: 2 } },
  { nom: "Pin tombé à 6 bûches", h: { ...HYPOTHESES_DECIDEES, pinTombe: 6 } },
  { nom: "Sans pin tombé", h: { ...HYPOTHESES_DECIDEES, pinTombe: 0 } },
  { nom: "Sans pin tombé ni tas de bois à la station", h: { ...HYPOTHESES_DECIDEES, pinTombe: 0, tasBois: 0 } },
];

export function sensibiliteN2(): { nom: string; familles: Record<Famille, LigneBudgetN2> }[] {
  return VARIANTES_N2.map(({ nom, h }) => {
    const seul = budgetNiveau2("seul", h);
    const familles = {} as Record<Famille, LigneBudgetN2>;
    for (const f of FAMILLES_BUDGET) familles[f] = seul.find((x) => x.famille === f)!;
    return { nom, familles };
  });
}
