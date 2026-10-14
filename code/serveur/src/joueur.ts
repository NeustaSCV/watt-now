// Un joueur connecté, côté serveur : déplacement, besoins, inventaire, actions, feux de son terrain.
// Le serveur fait autorité : chaque action est vérifiée (distance, inventaire, état) avant d'être appliquée.

import { raisonEmplacement } from "../../commun/src/emplacement.ts";
import { RASSASIE_HEURES } from "../../commun/src/survie.ts";
import { ceQuiManqueBref, outilsManquantsBref, ouTrouverPhrase } from "../../commun/src/aide-fabrication.ts";
import { categorieAction, mesuresDuFait, mesuresFabrication, mesuresNaissance, objetsDeMetierDonnes, type GenreMesure, type MesureDuFait } from "./mesures.ts";
import { REGLAGES } from "../../commun/src/reglages.ts";
import { voieLibre } from "../../commun/src/murs.ts";
import { enSaison, etatDuFruitier, jourDuCalendrier, prochaineRecolte } from "../../commun/src/calendrier.ts";
import { nouvellePoule, penserPoule, vuePoule, type Poule } from "../../commun/src/faune.ts";
import type { Apparence } from "../../commun/src/apparence.ts";
import { INTENTION_REPOS, avancer, nettoyerIntention, type Intention, type Position } from "../../commun/src/deplacement.ts";
import { AttenteArrivee } from "./arrivee.ts";
import type { Bienvenue, Cible, FeuVu, InstallationVue, MessageClient, MessageServeur } from "../../commun/src/messages.ts";
import { CAPACITE_SAC, CONTENANTS, OBJETS, capaciteDe, estCleObjet, estObjet, lumierePortee, nommer, poidsInventaire, traineTravois, type Inventaire, type TypeObjet } from "../../commun/src/objets.ts";
import { compter, estMaitrisee, estObjetDeMetier, retirerExemplaires, typeDe, type CleObjet } from "../../commun/src/etoiles.ts";
import { NOMS_INSTALLATIONS, RECETTES, dureeReelle, ingredientsPresents, multiplicateurQualites, niveauQualite, recette, recettesConnues, type Recette, type TypeInstallation } from "../../commun/src/recettes.ts";
import { estHorsFamille, etoilesDuProduit, recetteAvecFacon, recettePour } from "../../commun/src/recettes.ts";
import { texteTropLourd } from "./trop-lourd.ts";
import { chezLaFamille, estManuel, type Savoir } from "../../commun/src/savoir.ts";
import { lireManuel, type ParticipantLecon } from "./lecon.ts";
import {
  CHARBON_PRODUIT,
  CHARGE_TROUVEE,
  CONSOMMATION_FRONTALE,
  DUREE_CHARBONNIERE_MS,
  DUREE_PEDALAGE,
  KCAL_PEDALAGE_EN_PLUS,
  capacite,
  decharger,
  type Charges,
  type TypeBatterie,
} from "../../commun/src/energie.ts";
import { GESTE_TENU_MAX_S, PROGRESSION_GARDEE_MS, TERRAIN_TAILLE, TICK_HZ, type Famille } from "../../commun/src/regles.ts";
import {
  BOIS_INITIAL_FEU,
  BOIS_PAR_LITRE_BOUILLI,
  CONTENANCE_GOURDE,
  DUREES,
  EFFORT_PAR_ALLURE,
  GORGEE,
  RECETTE_FEU,
  RECETTE_DAKOTA,
  BONUS_LIT,
  RESERVE_EAU_MAX,
  RESERVE_KCAL_MAX,
  allureAutorisee,
  dormir,
  fatigue,
  MALUS_FATIGUE,
  aspectFeu,
  bruler,
  combustibleDe,
  consommer,
  type Besoins,
  type Gourde,
} from "../../commun/src/survie.ts";
import { DISTANCE_INTERACTION, EMPRISE_RESSOURCE, PORTEE_ARBRE, TEXTE_GOURDE_AU_MILIEU, auMilieuDeLaMare, distanceMare, RAYON_ESCABEAU, REPOUSSE_MS, USAGES, estArbre, ressourceVisible } from "../../commun/src/terrain.ts";
import { heuresEcoulees } from "../../commun/src/temps.ts";
import { DEMONTAGE, LIEU_DE_FOUILLE, estOrdure, etapeButin, tirerVestiges } from "../../commun/src/vestiges.ts";
import {
  DUREE_VOYAGE_S,
  EAU_PAR_KM,
  KCAL_PAR_KM,
  LIEUX,
  arriveeDans,
  entreesDe,
  distanceKm,
  sortiePourPartir,
  zoneDe,
  type LieuId,
  type LieuJouable,
} from "../../commun/src/lieux.ts";
import { vueDuSac, type Base, type Compte, type FeuEnBase, type RessourceEnBase, type SacEnBase as SacPose } from "./base.ts";
import { Cooperatives } from "./cooperative.ts";
import { Halte, type Voyageur } from "./halte.ts";
import { Gue, type ContexteGue } from "./gue.ts";
import { GESTE_RICOCHET_MS, ricochet } from "../../commun/src/gue.ts";
import { Moulins } from "./moulin.ts";
import type { ContexteLieu, LieuVivant } from "./lieu-vivant.ts";
import { LieuxVivants } from "./lieux-vivants.ts";
import { estHalte, estPartage, estPersonnel, ficheLieu, pausePossibleIci, traverserLieu } from "../../commun/src/registre-lieux.ts";
import { Comptoir } from "./comptoir.ts";
import { Tir, type ContexteTir } from "./tir.ts";
import { Sechage, accelerationFleches } from "./arc.ts";
// L'arbre de progression (0.7) : les recettes dévoilées (serveur/src/devoilement.ts).
import { SuiviDevoilement, type Constat, type SourceDevoilement } from "./devoilement.ts";
// La couche de déchets (0.7) : ramasser, fouiller, démonter (serveur/src/couche-dechets.ts).
import { CoucheDechets } from "./couche-dechets.ts";
import { REDRESSEUR } from "../../commun/src/arc.ts";
import { Forge, type ContexteForge } from "./forge.ts";
import { EvolutionArmes, type ContexteEvolution } from "./evolution-armes.ts";
import { declencher, declencheurNeuf, definitionDeclencheur, estDeclencheur, type DeclencheurPose } from "./declencheurs.ts";
import { Electricite, alimenterClotures, batteriesEnTrop, coutEnduranceCoup, produireBancsSolaires, type ContexteElectricite } from "./electricite.ts";
import { FilsDeRasoir, utiliserMecanique, type ContexteMecanique } from "./mecanique.ts";
import { refusMontageArbalete, rendDesAccessoires } from "../../commun/src/mecanique.ts";
import {
  PRIX_RETRAIT,
  WOTTS_PAR_WH_M,
  ajouterWotts,
  estObjetCle,
  etalPour,
  formaterWotts,
  prixAchatCle,
  prixVenteCle,
  refusVenteCle,
  valeurWotts,
  type Wotts,
} from "../../commun/src/economie.ts";
import { BONUS_MECANISTE, PORTEE_CABLE_PANNEAU, TYPES_BATTERIES, WH_M_PAR_HEURE, porteBatteries, productionPanneau, stocker } from "../../commun/src/energie.ts";
import type { AutreVu, OffreEchange, OperationComptoir, RapportBase, WottsVus } from "../../commun/src/messages.ts";
import { COMPTOIR, dansBoite, deLieu, destinations, etapeVers, minuscule, type Zone } from "../../commun/src/lieux.ts";
import { LEURRES, PORTEE_PORTE, PORTES, boitePorte, distancePorte } from "../../commun/src/cooperative.ts";
import { atteintDansLaFosse, pousserDansLaFosse } from "../../commun/src/moulin.ts";
import { DECHARGE, remonter } from "../../commun/src/decharge.ts";
import { phraseDuDepart, type Quete, type VueQuetes } from "../../commun/src/quetes.ts";
import { SuiviQuetes, type EtatJoueurPourQuetes } from "./quetes.ts";
import { debout, encaisserCoup, lacher, nouvelEteint, penser, repousser, vue as vueEteint, type Eteint, type Humain } from "../../commun/src/eteints.ts";
import {
  ANGLE_CIBLAGE,
  APPUIS_DEGAGEMENT,
  COUT_ENDURANCE,
  DEGATS_MORSURE,
  DELAI_MORSURE,
  DUREE_CORPS,
  ENDURANCE_CONVALESCENCE,
  ENDURANCE_COURSE,
  ENDURANCE_MAX,
  ESQUIVE,
  NIVEAU_APRES_EFFONDREMENT,
  SEUIL_EPUISE,
  aggraver,
  evoluer,
  freinSaisie,
  intoxiquer,
  nauseeux,
  prendreLaNausee,
  recuperationEndurance,
  MALUS_ABIMEE,
  DEBRIS_ARME,
  REPOUSSER,
  SEUIL_ABIMEE,
  armeDeCle,
  capaciteChargeArme,
  armeEnMain,
  cleArme,
  porteeBruitCoup,
  etatArme,
  type Arme,
  estArme,
  TOLERANCE_COUP_MS,
  panser,
  seRelever,
  symptomes,
  type Sante,
} from "../../commun/src/combat.ts";
import { ALLURES, POINT_ARRIVEE, type Allure } from "../../commun/src/regles.ts";
import type { SacVu, SanteVue, Verbe } from "../../commun/src/messages.ts";
import type { SacEnBase } from "./base.ts";
import { CHARBONNIERE_ODEUR, FEU_LUMIERE_NUIT, FEU_ODEUR, stimuliJoueur, type BruitAction, type Stimulus } from "../../commun/src/signature.ts";
import { estNuit, heureDeJeu } from "../../commun/src/temps.ts";
import { attenuationMeteo, meteo, pluieRecueillie } from "../../commun/src/meteo.ts";
import {
  ACCESSOIRES_FEU,
  BOUILLIR_AVEC_CASSEROLE,
  CASSEROLES,
  COMBLER,
  CREUSER,
  FEU_COUVERT,
  MAX_FOYERS,
  sommeilAbri,
  VOIE_CREUSEE,
  VOIE_SURFACE,
  accessoiresIncompatibles,
  boisRepris,
  capaciteCoffre,
  boisMarmite,
  contenanceRecuperateur,
  choisirCout,
  coutPour,
  effetsFeu,
  etapeFeu,
  etapeInstallation,
  etapeSuivanteFeu,
  etapeSuivanteInstallation,
  formeFeu,
  lignee,
  niveauFeu,
  niveauInstallation,
  rendDuDemontage,
  somme,
  type AccessoireFeu,
  type Etape,
} from "../../commun/src/lignees.ts";
import { refusAVenir, type AVenir } from "../../commun/src/lignees.ts";
import { outilsAPortee, refusRatelier } from "../../commun/src/outils-a-portee.ts";
import { stimuliTorches } from "../../commun/src/torche.ts";
import { stimuliRampes } from "../../commun/src/meubles-neufs.ts";
import { MeublesNeufs, etatDePose, rendDeLArbaleteGarde, rendusMeublesNeufs, type ContexteMeublesNeufs } from "./meubles-neufs.ts";
import { estClocheAlarme, sonAlarme } from "../../commun/src/meubles-niveau2.ts";
// Se servir du meuble d'une autre famille, une fois sa recette apprise (plan 0.8.2 §7.3, chantier J).
import { saitSeServir } from "../../commun/src/savoir-meuble.ts";
import { utiliserNiveau1 } from "./niveau1-base.ts";
import { carteInstallations, feuxDuLieu, refusLieu, type Alentours } from "../../commun/src/lieu-recette.ts";
import { ETAPE_CARTE, ETAPE_FAMILLE, ETAPE_NUIT, ETAPE_PREMIER_ETEINT, ETAPE_SAISIE, NOMBRE_ETAPES, REPAS_DU_TUTORIEL, etapesTutoriel, type EtatTutoriel, type VueTutoriel } from "../../commun/src/tutoriel.ts";
import { AvertissementBuche, etapesReussies, progresCarte, progresFamille, type PourFinDuTutoriel } from "./tutoriel-fin.ts";
// Le compte admin « god » (outil du porteur) : serveur/src/admin.ts.
import { remplirCoffres, savoirAdmin, vueProgressionAdmin } from "./admin.ts";
import { ARRIVEE_DEPART } from "../../commun/src/lieux.ts";
import { pasVersLaCouche, trajetCouche, type AbriPose, type TrajetCouche } from "./sommeil-abri.ts";
import { SANTE_DEPART } from "../../commun/src/combat.ts";
import type { OperationAdmin, VueAdmin } from "../../commun/src/admin.ts";
import { nombreFabriques, type VueProgression } from "../../commun/src/progression.ts";
// Les présences de la 0.9 (chantier A) : l'allure et les gestes montrés aux autres, l'arme dans le dos.
import { armeDansLeDos } from "../../commun/src/combat.ts";
import type { AllureVue, GesteVu } from "../../commun/src/messages.ts";
import { GESTES_MAX } from "./presences.ts";

const JAMAIS = Number.MAX_SAFE_INTEGER;
const INTERVALLE_BESOINS = 1000;
const INTERVALLE_FEUX = 2000;
const INTERVALLE_REPOUSSE = 5000;

interface ActionEnCours {
  libelle: string;
  /** Instant où le geste aurait commencé s'il avait été fait d'une traite (un geste repris commence « dans le passé »). */
  debut: number;
  fin: number;
  /** Durée totale, en secondes. */
  total: number;
  /** Instant réel où on l'a lancée (pour mesurer le temps passé). */
  lance: number;
  appliquer: () => void;
  /** Effort en plus du métabolisme (pédaler, forger…), en kcal par heure de jeu. */
  kcalEnPlus: number;
  /** Le bruit que fait l'action (signature sonore, Book 02 §7). */
  bruit: BruitAction;
}

/** Les Éteints du terrain : peu nombreux, et seulement s'ils sont attirés (Book 21 §3.5, pas de siège hors ligne). */
// Le nombre d'Éteints, leur attirance et le répit entre deux arrivées sont réglables à chaud (REGLAGES.eteints_*).
const INTERVALLE_TIRAGE = 20_000;
const INTERVALLE_ETEINTS = 200;

const BATTERIES: readonly TypeBatterie[] = TYPES_BATTERIES;
/** Au comptoir, rien à ramasser : l'esplanade est entretenue par les Compteurs. */
const SANS_RESSOURCES = new Map<number, RessourceEnBase>();

interface Voyage {
  de: LieuId;
  vers: LieuJouable;
  arrivee: number;
}

export class Joueur implements Voyageur, ParticipantLecon {
  readonly compte: Compte;
  position: Position;
  /** Le lieu où se trouve le personnage (É3). */
  lieu: LieuJouable;
  private voyage: Voyage | null = null;
  private readonly debutMonde: number;
  private readonly alea: () => number;
  /** Les Éteints venus sur le terrain, attirés par la signature (ils repartent quand le joueur s'en va). */
  private eteints: Eteint[] = [];
  private prochainIdEteint = 1;
  private dernierTirage = 0;
  private derniereApparition = 0;
  private dernierEnvoiEteints = 0;
  /** Après un plat chaud, la faim revient deux fois moins vite jusqu'à cet instant. */
  private caleJusqua = 0;
  /** Les compteurs du tutoriel déjà envoyés (pour ne renvoyer le carnet que s'ils changent). */
  private dernierProgresTuto = "";
  /** Pour mesurer le temps de sommeil. */
  private endormiDepuis = 0;
  /** Les gestes longs interrompus : la part faite, par geste (2026-10-08). */
  private readonly progressions = new Map<string, { part: number; le: number }>();
  /** La volaille du terrain (2026-10-08) : vivante seulement quand le joueur est là. */
  private poules: Poule[] = [];
  private prochainIdPoule = 1;
  private dernierEnvoiAnimaux = 0;
  private derniersAnimaux = "";
  private faune: { prises: number[] } = { prises: [] };
  /** Le savoir hors de sa famille (Book 25 §2.3) : leçons reçues, manuels lus, leçons données. Voir lecon.ts. */
  savoir: Savoir;
  /** Les recettes dévoilées (l'arbre de progression, 0.7) : serveur/src/devoilement.ts. */
  private devoilement!: SuiviDevoilement;
  /** La couche de déchets du lieu où l'on est (0.7) : serveur/src/couche-dechets.ts. */
  private dechets!: CoucheDechets;
  /** « Il te manque… » ne cite pas une recette encore cachée (l'arbre de progression, 0.7, chantier 5). L'admin voit tout. */
  private readonly recetteVisible = (id: string): boolean => this.admin || (this.devoilement?.estDevoilee(id) ?? true);
  /**
   * Le compte admin (serveur/src/admin.ts) : lu en base à la connexion, relu toutes les 5 s (un autre peut avoir été
   * désigné), et relu à chaque geste admin. Invincible : ni dégâts, ni faim, ni soif, ni fatigue.
   */
  private admin = false;
  private invincible = false;
  private derniereVerifAdmin = 0;
  /** Le monde est prévenu de chaque fabrication (« voir faire », à 5 m) ; null : personne n'écoute. */
  surFabrication: ((recette: string) => void) | null = null;
  private bouge = false;
  /** Ses gestes depuis la dernière diffusion des présences, montrés aux autres (0.9, presences.ts vide la file). */
  readonly gestesRecents: GesteVu[] = [];
  // ---------- Combat et santé (É3, lot 3) ----------
  private sante: Sante;
  private endurance: number;
  /** Jusqu'à quand il ne peut pas être saisi (esquive), et l'élan qui le pousse. */
  private esquiveJusqua = 0;
  private elan: { dx: number; dz: number; restant: number } | null = null;
  private prochaineFrappe = 0;
  /** L'arme équipée pour le combat (P-005) ; null : la meilleure du sac. */
  private armeEquipee: CleObjet | null = null;
  /** On a déjà prévenu que l'arme équipée n'est plus dans le sac. */
  private armePerdueSignalee = false;
  private bruitCoupJusqua = 0;
  /** Jusqu'où porte le dernier coup (Book 25 §8.4 : le choc, le tranchant, la décharge). */
  private porteeDuCoup: number | undefined;
  /** Une porte qu'on vient d'ouvrir ou de fermer : un bruit bref, là où elle est (0.5b). */
  private bruitPorte: { x: number; z: number; portee: number; jusqua: number } | null = null;
  private appuisDegagement = 0;
  private santeEnvoyee = "";
  private dernierEnvoiSante = 0;
  /** Les sacs tombés sur son terrain. */
  private sacsTerrain: SacEnBase[] = [];
  // ---------- Wotts (É4) ----------
  private readonly comptoir: Comptoir;
  /** Les bons en poche, et le compte au comptoir (Book 07 §3.2) ; ils se déchargent (§3.3). */
  private poche: Wotts = { valeur: 0, majLe: 0 };
  private compteWotts: Wotts = { valeur: 0, majLe: 0 };
  /** Ce que la base a fait pendant l'absence, à montrer au retour (null : absence trop courte). */
  readonly rapport: RapportBase | null = null;
  private derniereProduction = 0;
  /** Endormi (É5) : dans un abri ou par terre. Bouger, être saisi ou être reposé réveille. */
  private sommeil: { dansUnAbri: boolean; surUnLit: boolean; confort?: number } | null = null;
  /** L'avertissement de la bûche (B14) : la dernière nuit où il est parti. */
  private readonly avertissementBuche = new AvertissementBuche();
  /** Le tutoriel en cours (null : terminé ou passé). */
  private tuto: EtatTutoriel | null;
  private derniereVerifTuto = 0;
  /** Les quêtes après le tutoriel (Book 22). */
  private readonly quetes: SuiviQuetes;
  private derniereVerifQuetes = 0;
  /** Le carnet des quêtes déjà envoyé (on ne le renvoie que s'il change). */
  private derniereVueQuetes = "";
  private quetesASauver = false;
  /** Le dernier constat de l'interface reçu (plan 0.8, chantier 14) : un par 10 s au plus. */
  private dernierConstat = 0;
  /** La carnation choisie à la création (−1 : celle de la famille). */
  private readonly apparence: Apparence;
  private intention: Intention = INTENTION_REPOS;
  private seq = 0;
  private besoins: Besoins;
  private gourde: Gourde;
  private inventaire: Inventaire;
  private readonly ressources = new Map<number, RessourceEnBase>();
  private readonly feux = new Map<number, FeuEnBase>();
  private readonly installations = new Map<number, InstallationVue>();
  private action: ActionEnCours | null = null;
  private lumiere = false;
  private charges: Charges = {};
  private chargesEnvoyees = "";

  private positionEnvoyee = true;
  private dernierEnvoiBesoins = 0;
  private dernierEnvoiFeux = 0;
  private derniereRepousse = 0;
  private readonly meulesAnnoncees = new Set<number>();
  /** Les alarmes qui tintent : jusqu'à quand (puis 20 s de silence avant de pouvoir retinter). */
  private readonly alarmesSonnent = new Map<number, number>();

  private readonly base: Base;
  readonly envoyer: (message: MessageServeur) => void;
  private readonly maintenant: () => number;
  private readonly cooperatives: Cooperatives;
  /** 0.8 : le Gué-aux-Saules (partagé, comme la halte) et les Moulins du Gué (un par joueur, comme les Coopératives). */
  private readonly gue: Gue;
  private readonly moulins: Moulins;
  /** Le lancer et le tir (Book 25 §10.3) : son moteur est dans serveur/src/tir.ts. */
  private readonly tir: Tir = new Tir(this.contexteTir());
  /** Les ébauches d'arc qui sèchent dans le sac, même hors ligne (Book 25 §3.3) : serveur/src/arc.ts. */
  private readonly sechage: Sechage = new Sechage({
    maintenant: () => this.maintenant(),
    inventaire: () => this.inventaire,
    echanger: (retire, ajoute) => {
      this.retirerPlusieurs(retire);
      this.ajouterPlusieurs(ajoute);
    },
    charger: () => this.base.chargerSechage(this.compte.id),
    sauver: (etat) => this.base.sauverSechage(this.compte.id, etat),
    info: (t) => this.info(t),
  });
  /** La forge des Charbonniers (Book 25 §4) : trempe, reforgeage, accessoires ; dans serveur/src/forge.ts. */
  private readonly forge: Forge = new Forge(this.contexteForge());
  /** L'électricité des Voltaïques (Book 25 §5) : décharges, recharge, pièges électriques (serveur/src/electricite.ts). */
  private readonly electricite: Electricite = new Electricite(this.contexteElectricite());
  /** Les meubles nouveaux du niveau 2 (plan 0.10, chantier D) : cuiseur, bacs de tri, creuset, moulin, rampe, arbalète de garde. */
  private readonly meublesNeufs: MeublesNeufs = new MeublesNeufs(this.contexteMeublesNeufs());
  /** Reprendre une arme sur son meuble : la réparer, la monter d'une étoile (plan 0.8, chantier 9 ; serveur/src/evolution-armes.ts). */
  private readonly evolution: EvolutionArmes = new EvolutionArmes(this.contexteEvolution());

  /**
   * Les lieux vivants (0.10, le registre des lieux : serveur/src/lieux-vivants.ts) : la halte, le gué, la route du pont,
   * la corniche, partagés ; la Coopérative, le Moulin, l'hôtel, le phare, à soi.
   */
  private readonly lieux: LieuxVivants;

  /** Le lieu vivant où l'on se trouve (une halte partagée, ou son lieu à soi) ; null sur le terrain, au Comptoir, en route. */
  private get vivant(): LieuVivant | null {
    if (this.voyage) return null;
    return this.lieux.vivant(this.lieu, this.compte.id);
  }

  constructor(
    compte: Compte,
    base: Base,
    envoyer: (message: MessageServeur) => void,
    maintenant: () => number = Date.now,
    halte: Halte = new Halte(base),
    alea: () => number = Math.random,
    comptoir: Comptoir = new Comptoir(base),
    cooperatives: Cooperatives = new Cooperatives(base),
    gue: Gue = new Gue(base),
    moulins: Moulins = new Moulins(base),
    lieux: LieuxVivants = new LieuxVivants(base, { station: halte, cooperative: cooperatives, gue, moulin: moulins }),
  ) {
    this.compte = compte;
    this.base = base;
    this.envoyer = envoyer;
    this.maintenant = maintenant;
    this.alea = alea;
    this.comptoir = comptoir;
    this.cooperatives = cooperatives;
    this.gue = gue;
    this.moulins = moulins;
    this.lieux = lieux;
    const w = base.chargerWotts(compte.id);
    this.poche = w.poche;
    this.compteWotts = w.compte;
    this.debutMonde = base.debutMonde();
    this.tuto = base.chargerTutoriel(compte.id);
    this.quetes = new SuiviQuetes(base.chargerQuetes(compte.id));
    this.armeEquipee = base.chargerArme(compte.id);
    this.usure = base.chargerUsure(compte.id);
    this.chargeArmes = base.chargerChargeArmes(compte.id);
    this.admin = base.estAdmin(compte.id);
    this.invincible = this.admin && base.adminInvincible(compte.id);
    // L'admin porte la toge blanche : posée ici, jamais venue du client ni gardée en base.
    this.apparence = this.admin ? { ...base.chargerApparence(compte.id, compte.famille), toge: true } : base.chargerApparence(compte.id, compte.famille);
    this.faune = base.chargerFaune(compte.id);
    this.savoir = base.chargerSavoir(compte.id);
    const { sante, endurance } = base.chargerSante(compte.id);
    this.sante = sante;
    this.endurance = endurance;
    this.sacsTerrain = base.chargerSacs("terrain", compte.id);

    const perso = base.chargerPersonnage(compte.id);
    if (!perso) throw new Error(`Personnage introuvable pour le compte ${compte.id}`);
    this.position = perso.position;
    this.lieu = perso.lieu;
    if (this.lieu !== "terrain") {
      // Reconnexion hors de chez soi (le registre des lieux) : dans une halte, à l'entrée la plus proche (Book 01 §2 bis :
      // à la station, le bout est de la route, le bout ouest ou le chemin de la Coopérative) ; ailleurs, à la première
      // entrée (la route du Comptoir, le portail de la Coopérative, le pont du Moulin : M19).
      const { x, z } = this.position;
      const entrees = entreesDe(this.lieu);
      const entree = estHalte(this.lieu)
        ? entrees.reduce((a, b) => (Math.hypot(b.arrivee.x - x, b.arrivee.z - z) < Math.hypot(a.arrivee.x - x, a.arrivee.z - z) ? b : a))
        : entrees[0]!;
      this.position = { ...entree.arrivee };
      this.lieux.vivant(this.lieu, compte.id)?.entrer(this);
      if (this.lieu === "comptoir") comptoir.entrer(this.envoyer, () => this.quetes.etat.faits);
    }
    this.besoins = perso.besoins;
    this.gourde = perso.gourde;
    this.inventaire = base.chargerInventaire(compte.id);
    if (this.lieu === "cooperative") cooperatives.retrouverRadio(compte.id, (this.inventaire.radio_piles ?? 0) > 0);
    for (const r of base.chargerRessources(compte.id)) this.ressources.set(r.id, r);
    for (const i of base.chargerInstallations(compte.id)) {
      // Parti avec l'escabeau dans les bras : il est resté là où on l'a lâché.
      if (i.etat.portee) {
        i.etat = { ...i.etat, portee: false };
        base.sauverEtatInstallation(compte.id, i.id, i.etat);
      }
      this.installations.set(i.id, i);
    }
    // Chaque terrain a sa décharge (P-001) : on la pose au premier passage.
    if (![...this.installations.values()].some((i) => i.type === "decharge")) {
      const d = base.ajouterInstallation(compte.id, "decharge", DECHARGE.x, DECHARGE.z, 0);
      d.etat = { contenu: {}, majLe: this.maintenant() };
      base.sauverEtatInstallation(compte.id, d.id, d.etat);
      this.installations.set(d.id, d);
    }

    // Les feux ont brûlé pendant l'absence du joueur (processus passif, Book 01 §2 bis).
    const instant = maintenant();
    let feuxEteints = 0;
    for (const f of base.chargerFeux(compte.id)) {
      const brulait = f.allume && f.bois > 0;
      const etat = bruler(f, heuresEcoulees(f.majLe, instant));
      this.feux.set(f.id, { ...f, ...etat, majLe: instant });
      if (brulait && etat.bois <= 0) feuxEteints++;
    }
    const repousse = this.verifierRepousse(instant);

    // Se déconnecter dans son abri compte comme une nuit complète (Book 05 §3).
    const abri = [...this.installations.values()].some((i) => i.type === "abri" && Math.hypot(i.x - this.position.x, i.z - this.position.z) <= 3);
    if (this.lieu === "terrain" && abri && perso.vuLe > 0 && instant - perso.vuLe >= 8 * 60_000) {
      this.besoins = { ...this.besoins, repos: 1 };
      this.noterFait("nuit");
    }

    // Les batteries se déchargent un peu pendant l'absence (calendrier, Book 01 §2 bis).
    const { charges, majLe } = base.chargerCharges(compte.id);
    this.charges = majLe > 0 ? decharger(charges, instant - majLe) : charges;
    const dechargePortee = Object.values(charges).reduce((s, v) => s + (v ?? 0), 0) - Object.values(this.charges).reduce((s, v) => s + (v ?? 0), 0);

    // La base a produit pendant l'absence : le panneau, au calendrier (Book 01 §2 bis).
    const bilan = this.mettreAJourBase(instant);
    const absence = perso.vuLe > 0 ? instant - perso.vuLe : 0;
    if (absence >= 120_000) {
      const meule = [...this.installations.values()].find((i) => i.type === "charbonniere" && i.etat.pretLe);
      this.rapport = {
        absence,
        produit: Math.round(bilan.produit),
        stocke: Math.round(bilan.stocke),
        perdu: Math.round(bilan.perdu),
        surLeBanc: this.chargesDuBanc(),
        decharge: Math.round(bilan.decharge + dechargePortee),
        charbonniere: meule?.etat.pretLe ? (instant >= meule.etat.pretLe ? "prete" : Math.ceil((meule.etat.pretLe - instant) / 60_000)) : null,
        feuxAllumes: [...this.feux.values()].filter((f) => f.allume && f.bois > 0).length,
        feuxEteints,
        repousse,
        ...(bilan.remonte > 0 ? { decharge_remonte: bilan.remonte } : {}),
      };
    }
    for (const b of BATTERIES) {
      const n = this.inventaire[b] ?? 0;
      if (n > 0 && this.charges[b] === undefined) this.charges[b] = Math.min(CHARGE_TROUVEE[b] * n, capacite(b, n));
    }
    // Une partie d'avant la 0.8.2 (R17) : le banc ne garde qu'une batterie ; les autres reviennent au sac, avec leur charge.
    for (const banc of this.installations.values()) this.rendreBatteriesEnTrop(banc);
    this.devoilement = this.creerDevoilement();
    this.dechets = this.creerDechets();
    // Plan 0.8 (chantier 14) : la naissance du personnage, `atteint:maison` (une fois).
    this.mesurerLesFaits(mesuresNaissance(this.quetes.etat.faits, this.devoilement.etat.secondes / 60));
  }

  bienvenue(debutMonde: number): Bienvenue {
    const instant = this.maintenant();
    return {
      t: "bienvenue",
      moi: { id: this.compte.id, pseudo: this.compte.pseudo, famille: this.compte.famille, apparence: this.apparence, ...(this.admin ? { admin: this.vueAdmin() } : {}) },
      lieu: this.lieu,
      position: this.position,
      terrain: { taille: TERRAIN_TAILLE },
      tickHz: TICK_HZ,
      temps: { debutMonde, serveur: instant },
      inventaire: this.inventaire,
      besoins: this.besoins,
      gourde: this.gourde,
      // L'if du fond du bois ne se voit que si l'on reconnaît les essences (Book 25 §3.2) ; dans un lieu vivant, le butin
      // personnel et le vrac qui grandit (plan 0.8, chantier 10 : serveur/src/lieu-vivant.ts).
      ressources: this.vivant
        ? this.vivant.vuePour(this.compte.id, this.compte.famille, instant)
        : [...this.ressourcesIci().values()]
            .filter((r) => ressourceVisible(r.type, this.compte.famille))
            .map((r) => ({ id: r.id, type: r.type, x: r.x, z: r.z, disponible: r.disponibleLe <= instant })),
      feux: this.lieu === "terrain" ? [...this.feux.values()].map(vue) : [],
      installations: this.lieu === "terrain" ? [...this.installations.values()] : [],
      charges: this.chargesArrondies(),
      lumiere: this.lumiere,
      eteints: this.vivant ? this.vivant.eteintsVus(this.position) : this.eteints.map(vueEteint),
      animaux: this.lieu === "terrain" ? this.peuplerPoules().map(vuePoule) : [],
      sante: this.santeVue(),
      endurance: Math.round(this.endurance),
      sacs: this.sacsVus(),
      wotts: this.wottsVus(),
      tutoriel: this.vueTutoriel(),
      quetes: this.vueQuetes(),
      arme: this.armeEquipee,
      usure: { ...this.usure },
      charge: { ...this.chargeArmes },
      pret: this.tir.pret,
      savoir: this.vueSavoir(),
      progression: this.vueProgression(this.devoilement.vue()),
      dechets: this.dechets.vue(),
      ...(this.lieu === "cooperative"
        ? { leurres: this.cooperatives.leurresActifs(this.compte.id, this.maintenant()), etatCoop: this.cooperatives.vue(this.compte.id) }
        : {}),
      ...(this.lieu === "comptoir" ? { comptoir: this.vueComptoir(instant) } : {}),
      ...(ficheLieu(this.lieu).portes && this.vivant ? { portes: { ...this.vivant.portes } } : {}),
    };
  }

  // ---------- Réception ----------

  /** En pause (2026-10-09) : sur son terrain ou dans sa Coopérative seulement, là où l'on est seul. */
  private pause = false;
  /** La vue d'ensemble à l'arrivée (0.8.2, chantier G) : seul, la pause jusqu'au premier geste ; dans une halte, à l'abri. */
  private readonly arrivee = new AttenteArrivee(() => (this.pause = false));

  enPause(): boolean {
    return this.pause;
  }

  /** On peut faire une pause là où personne d'autre ne joue : son terrain, ses lieux à soi (le registre des lieux). */
  private pausePossible(): string | null {
    if (this.voyage) return "Pas en route.";
    if (!pausePossibleIci(this.lieu)) return "Pas de pause ici : d'autres joueurs partagent ce lieu.";
    if (this.saisisseurs().length > 0) return "Pas pendant qu'il te tient !";
    return null;
  }

  private basculerPause(oui: boolean): void {
    if (oui === this.pause) return this.envoyer({ t: "pause", oui });
    if (oui) {
      const refus = this.pausePossible();
      if (refus) {
        this.info(refus);
        return this.envoyer({ t: "pause", oui: false });
      }
      this.annulerAction();
      this.intention = INTENTION_REPOS;
      this.elan = null;
    }
    this.pause = oui;
    this.envoyer({ t: "pause", oui });
  }

  recevoir(message: MessageClient): void {
    // Le premier geste après l'arrivée met fin à la vue d'ensemble (0.8.2, chantier G).
    if (this.arrivee.recevoir(message)) return;
    if (message.t === "pause") return this.basculerPause(message.oui === true);
    // En pause, le monde attend : on n'agit pas (le client le sait aussi).
    if (this.pause && message.t !== "ping" && message.t !== "mesures") return;
    switch (message.t) {
      case "intention": {
        const intention = nettoyerIntention(message);
        if (!intention || !Number.isInteger(message.seq)) return;
        this.intention = intention;
        this.seq = message.seq;
        return;
      }
      case "ping":
        this.envoyer({ t: "pong", envoye: message.envoye, serveur: this.maintenant() });
        return;
      case "interagir":
        this.interagir(message.cible, message.verbe);
        return;
      case "manger":
        this.manger(message.objet);
        return;
      case "boire":
        this.boire();
        return;
      case "construire_feu":
        this.construireFeu(message.x, message.z, message.dakota === true);
        return;
      case "fabriquer":
        this.fabriquer(message.recette, message.x, message.z, message.o);
        return;
      case "lumiere":
        if (message.allumee && !lumierePortee(this.inventaire)) return this.info("Rien pour t'éclairer : chaque famille a sa lumière, échanges-en une.");
        if (message.allumee && lumierePortee(this.inventaire) === "lampe_frontale" && (this.charges.petite_batterie ?? 0) <= 0.1) {
          return this.info("La petite batterie de la frontale est vide : charge-la au banc, depuis sa fiche.");
        }
        this.lumiere = message.allumee === true;
        this.envoyer({ t: "lumiere", allumee: this.lumiere });
        return;
      case "annuler":
        // Endormi, A « Se réveiller » envoie « annuler » : on se réveille, comme en bougeant (0.8.2, chantier K).
        if (this.sommeil) return this.reveiller("");
        this.annulerAction();
        return;
      case "voyager":
        this.voyager(message.vers);
        return;
      case "poser":
        // Ce que le lieu met dans les bras (0.10, chantier J : la batterie, la tête du robot de l'hôtel) se pose là.
        if (this.vivant?.poser(this.contexteLieu())) return;
        this.poserObjetLourd();
        return;
      case "poser_radio":
        this.poserRadio();
        return;
      case "equiper":
        this.equiper(message.objet);
        return;
      case "mesures":
        this.mesuresClient(message);
        return;
      case "constat":
        // Plan 0.8 (chantier 14) : la fiche ouverte sans pouvoir améliorer, l'aide « Je suis coincé » (une fois par 10 s).
        if (Date.now() - this.dernierConstat < 10_000) return;
        this.dernierConstat = Date.now();
        this.noterFait(message.quoi === "fiche_bloquee" ? `fiche_bloquee:${message.construction ?? "?"}` : message.quoi);
        return;
      case "frapper":
        // On ne frappe pas avec un escabeau dans les bras : on le lâche d'abord.
        if (this.objetPorte()) this.poserObjetLourd();
        // Ni avec ce que le lieu met dans les bras (0.10, chantier J : la tête du robot, 8 kg à deux mains, Q-0.10-8).
        if (this.brasDuLieu()) return this.info(`Les bras pris, on ne frappe pas : pose d'abord ${this.brasDuLieu()}.`);
        this.frapper(message.appuye === true);
        return;
      case "esquiver":
        this.esquiver(message.dx, message.dz);
        return;
      case "degager":
        this.degager();
        return;
      case "repousser":
        this.repousserDevant();
        return;
      case "reparer":
        this.evolution.reparer(message.objet, message.fortune === true);
        return;
      // Reprendre une arme sur son meuble : la réparer, ou la monter d'une étoile (plan 0.8, chantier 9).
      case "reprendre_arme":
        return this.evolution.reprendre(message.objet, message.geste);
      case "panser":
        this.soigner();
        return;
      case "comptoir":
        this.operer(message.op);
        return;
      case "coffre":
        this.utiliserCoffre(message.id, message.sens, message.objet, message.quantite);
        return;
      case "jeter":
        this.jeter(message.objet, message.quantite);
        return;
      case "demonter":
        this.demonter(message.objet);
        return;
      // Le lancer et le tir (Book 25 §10.3, chantier 1) : tout se juge dans serveur/src/tir.ts.
      case "preparer":
        return this.tir.preparer(message.objet);
      case "bander":
        return this.tir.bander();
      case "lancer":
        return this.tir.lancer(message.dx, message.dz, message.cible, message.distance);
      case "rearmer":
        return this.tir.rearmer();
      // Le banc de recharge (0.8.2, chantier C) : charger ce qu'on porte, échanger la batterie, la remplir à la manivelle (serveur/src/electricite.ts).
      case "banc":
        return this.auBanc(message.id, (banc) => (message.op === "charger" ? this.electricite.charger(banc, message.cible) : message.op === "manivelle" ? this.electricite.manivelle(banc) : this.electricite.echanger(banc)));
      case "lire":
        this.lire(message.objet);
        return;
      case "dechets":
        if (!this.voyage) this.dechets.recevoir(message.op);
        return;
      case "tutoriel_passer":
        if (!this.tuto) return;
        this.tuto = null;
        this.base.sauverTutoriel(this.compte.id, null);
        this.envoyer({ t: "tutoriel", tutoriel: null });
        // Le vétéran qui saute le tutoriel connaît le début (Q8) : les recettes communes à la main d'emblée (plan 0.8).
        this.devoilement.devoilerDEmblee();
        return;
      case "recettes_vues":
        this.devoilement.marquerVues(message.recettes);
        return;
      case "admin":
        this.commandeAdmin(message.op);
        return;
      // Le gué (plan 0.8, chantier 11) : haler le bac, sonner la cloche du passeur (serveur/src/gue.ts).
      case "gue":
        if (this.lieu === "gue" && !this.voyage) message.op === "haler" ? this.gue.haler(this.contexteGue()) : this.gue.sonnerCloche(this.contexteGue());
        return;
    }
  }

  // ---------- Le compte admin « god » (outil du porteur ; serveur/src/admin.ts) ----------

  private vueAdmin(): VueAdmin {
    return { invincible: this.invincible };
  }

  /** Le savoir montré au client : l'admin a les manuels des quatre familles (toutes les recettes dans Fabriquer). */
  private vueSavoir(): { apprises: string[]; manuels: Famille[] } {
    return this.admin ? savoirAdmin(this.savoir.apprises) : { apprises: [...this.savoir.apprises], manuels: [...this.savoir.manuels] };
  }

  /** La progression montrée au client : pour l'admin, tout est dévoilé. */
  private vueProgression(v: VueProgression): VueProgression {
    return this.admin ? vueProgressionAdmin(v) : v;
  }

  /** Relit en base si ce compte est (toujours) l'admin, et s'il est invincible. */
  private relireAdmin(): void {
    this.admin = this.base.estAdmin(this.compte.id);
    this.invincible = this.admin && this.base.adminInvincible(this.compte.id);
    this.derniereVerifAdmin = this.maintenant();
  }

  /** Un geste du menu ⚙ admin : refusé (sans bruit) à tout compte qui n'est pas l'admin en base, à cet instant. */
  private commandeAdmin(op: OperationAdmin): void {
    this.relireAdmin();
    if (!this.admin) return;
    switch (op.genre) {
      case "invincible":
        this.base.reglerInvincible(this.compte.id, op.oui);
        this.invincible = op.oui;
        this.envoyer({ t: "admin", admin: this.vueAdmin() });
        this.info(op.oui ? "Invincible." : "Plus invincible : tu peux mourir.");
        return;
      case "aller":
        return this.allerA(op.vers);
      case "remplir": {
        // Les coffres sont remplis en base, puis relus : le terrain se met à jour s'il y est.
        const { coffres, sansPlace } = remplirCoffres(this.base, this.compte.id);
        this.installations.clear();
        for (const i of this.base.chargerInstallations(this.compte.id)) this.installations.set(i.id, i);
        if (this.lieu === "terrain" && !this.voyage) for (const i of this.installations.values()) if (i.type === "coffre") this.envoyer({ t: "installation", installation: i });
        this.info(sansPlace ? `${coffres} coffres remplis : plus de place pour en poser d'autres.` : `${coffres} coffres remplis.`);
        return;
      }
    }
  }

  /** « Aller à… » : l'admin arrive tout de suite dans un lieu, sans trajet ni dépense. */
  private allerA(vers: LieuId): void {
    if (this.voyage) return;
    this.annulerAction();
    this.tir.quitterLieu();
    if (this.objetPorte()) this.poserObjetLourd();
    const de = this.lieu;
    if (de === "cooperative" && (this.inventaire.radio_piles ?? 0) > 0) this.poserRadio();
    if (de === "comptoir") this.comptoir.sortir(this.envoyer);
    this.lieux.vivant(de, this.compte.id)?.sortir(this);
    this.eteints = [];
    this.intention = INTENTION_REPOS;
    this.elan = null;
    // Chez lui, il arrive au camp (et non à la sortie du terrain).
    this.arriver({ de, vers, arrivee: this.maintenant() }, vers === "terrain" ? { ...ARRIVEE_DEPART } : undefined);
    this.base.sauverPosition(this.compte.id, this.position, this.lieu, this.maintenant());
  }

  /** Invincible : santé, besoins et endurance restent pleins (les Éteints l'attaquent quand même). */
  private garderInvincible(): void {
    if (!this.invincible) return;
    if (this.sante.points < 100 || this.sante.blessures.length > 0 || this.sante.saignement !== "aucun" || this.sante.intoxication) this.sante = { ...SANTE_DEPART };
    this.besoins = { kcal: RESERVE_KCAL_MAX, eau: RESERVE_EAU_MAX, repos: 1 };
    this.endurance = this.enduranceMax();
  }

  // ---------- Ensemble (É4, lot 3) : ce que les autres voient, ce qu'on échange ----------

  /** Dans un lieu public (halte, comptoir), on voit les autres et on peut échanger ; le terrain et la Coopérative restent privés. */

  get enLieuPublic(): boolean {
    return estPartage(this.lieu) && !this.voyage;
  }

  get vu(): AutreVu {
    return {
      id: this.compte.id,
      pseudo: this.compte.pseudo,
      famille: this.compte.famille,
      x: Math.round(this.position.x * 100) / 100,
      z: Math.round(this.position.z * 100) / 100,
      o: Math.round(this.position.o * 100) / 100,
      lumiere: this.lumiere,
      apparence: this.apparence,
      // L'arme encombrante équipée se voit dans le dos (0.9, Q-7).
      ...(this.dos ? { dos: this.dos } : {}),
      ...(this.sommeil ? { couche: true as const } : {}),
    };
  }

  private get dos(): TypeObjet | null {
    return armeDansLeDos(this.inventaire, this.armeEquipee);
  }

  /** L'allure montrée aux autres (0.9) : 0 immobile, 1 discrète, 2 marche, 3 course. */
  get allureVue(): AllureVue {
    // En route vers sa couche, il avance accroupi (0.8.2, R12).
    if (this.versLaCouche) return 1;
    if (!this.bouge) return 0;
    const allure = this.allureEffective();
    return allure === "discrete" ? 1 : allure === "marche" ? 2 : 3;
  }

  /** Un geste montré aux autres joueurs qui le voient (0.9), à l'heure du serveur. */
  private geste(g: Omit<GesteVu, "id" | "h">): void {
    if (this.gestesRecents.length >= GESTES_MAX) this.gestesRecents.shift();
    this.gestesRecents.push({ id: this.compte.id, h: this.maintenant(), ...g });
  }

  /** Ce qui manque pour donner une offre, ou null si tout y est. */
  manqueA(offre: OffreEchange): string | null {
    for (const [type, n] of Object.entries(offre.objets) as [CleObjet, number][]) {
      if (!estCleObjet(type) ||!Number.isInteger(n) || n < 0) return "Offre invalide.";
      if ((this.inventaire[type] ?? 0) < n) return `${this.compte.pseudo} n'a plus ${nommer(type, n)}.`;
    }
    if (!(offre.wotts >= 0) || offre.wotts > valeurWotts(this.poche, this.maintenant()) + 1e-6) return `${this.compte.pseudo} n'a pas assez de wotts en poche.`;
    return null;
  }

  /** La charge qui part avec des batteries données (au prorata). */
  chargesQuiPartent(objets: Inventaire): Charges {
    const c: Charges = {};
    for (const b of BATTERIES) {
      const n = objets[b] ?? 0;
      const total = this.inventaire[b] ?? 0;
      if (n > 0 && total > 0) c[b] = ((this.charges[b] ?? 0) * n) / total;
    }
    return c;
  }

  /** Ce qu'on pourra porter après l'échange (un sac peut changer de mains). */
  capaciteApres(donne: OffreEchange, recoit: OffreEchange): number {
    const apres: Inventaire = { ...this.inventaire };
    for (const [t, n] of Object.entries(donne.objets) as [TypeObjet, number][]) apres[t] = (apres[t] ?? 0) - n;
    for (const [t, n] of Object.entries(recoit.objets) as [TypeObjet, number][]) apres[t] = (apres[t] ?? 0) + n;
    return capaciteDe(apres);
  }

  /** Le poids du sac après l'échange. */
  poidsApres(donne: OffreEchange, recoit: OffreEchange): number {
    return poidsInventaire(this.inventaire, this.gourde.litres) - poidsInventaire(donne.objets) + poidsInventaire(recoit.objets);
  }

  /** L'échange validé par les deux : on donne, on reçoit (le serveur a tout vérifié avant). */
  appliquerEchange(donne: OffreEchange, recoit: OffreEchange, chargesRecues: Charges, avec?: Famille): void {
    const instant = this.maintenant();
    const partent = this.chargesQuiPartent(donne.objets);
    this.charges = Object.fromEntries(BATTERIES.map((b) => [b, Math.max(0, (this.charges[b] ?? 0) - (partent[b] ?? 0))])) as Charges;
    this.retirerPlusieurs(donne.objets);
    this.ajouterPlusieurs(recoit.objets);
    for (const [b, wh] of Object.entries(chargesRecues) as [TypeBatterie, number][]) this.charges = { ...this.charges, [b]: (this.charges[b] ?? 0) + wh };
    this.bornerCharges();
    this.poche = ajouterWotts(this.poche, recoit.wotts - donne.wotts, instant);
    this.base.sauverCharges(this.compte.id, this.charges, instant);
    this.envoyerWotts();
    this.noterFait("echange");
    if (avec && avec !== this.compte.famille) this.noterFait(`rencontre:${avec}`);
    // Ce qu'on a passé à une autre famille (Book 25 §9.4 : « Le fournisseur », « Le carquois des autres »).
    if (avec && avec !== this.compte.famille) for (const [cle, n] of Object.entries(donne.objets)) this.noterFait(`don_autre_famille:${typeDe(cle)}`, n ?? 0);
    if (objetsDeMetierDonnes(donne.objets) > 0) this.mesurer("metier", "echange", objetsDeMetierDonnes(donne.objets));
  }

  /** Des écritures qui vont ensemble (un échange : les deux côtés) : toutes enregistrées, ou aucune. */
  enBloc(f: () => void): void {
    this.base.transaction(f);
  }

  // ---------- Le comptoir et les wotts (É4, lot 1 : Book 07) ----------

  private wottsVus(): WottsVus {
    const instant = this.maintenant();
    return { poche: Math.round(valeurWotts(this.poche, instant) * 10) / 10, compte: Math.round(valeurWotts(this.compteWotts, instant) * 10) / 10 };
  }

  private envoyerWotts(): void {
    this.base.sauverWotts(this.compte.id, this.poche, this.compteWotts);
    this.envoyer({ t: "wotts", wotts: this.wottsVus() });
  }

  /** Les charges ne dépassent jamais ce que peuvent tenir les batteries qu'on a encore. */
  private bornerCharges(): void {
    const c: Charges = {};
    for (const b of BATTERIES) {
      const n = this.inventaire[b] ?? 0;
      if (n > 0 && this.charges[b] !== undefined) c[b] = Math.min(this.charges[b]!, capacite(b, n));
    }
    this.charges = c;
    this.envoyerCharges();
  }

  private operer(op: OperationComptoir): void {
    if (this.lieu !== "comptoir" || this.voyage) return;
    if (!this.proche(COMPTOIR.guichet.x, COMPTOIR.guichet.z, 3)) return this.info("Approche-toi du guichet.");
    const instant = this.maintenant();
    const enPoche = valeurWotts(this.poche, instant);
    switch (op?.genre) {
      case "vendre": {
        const n = Math.floor(op.quantite);
        if (!estCleObjet(op.objet) || !(n >= 1) || (this.inventaire[op.objet] ?? 0) < n) return;
        // Un exemplaire étoilé se paie selon ses étoiles (Book 25 §4.2) ; il entre en stock tel quel.
        // Une ordure (valeur 0, lot 2) ne se reprend jamais, trésorerie basse ou non (Q2).
        if (estOrdure(typeDe(op.objet))) return this.info("Les Compteurs ne reprennent pas les ordures.");
        const prix = prixAchatCle(op.objet, this.comptoir.basse);
        if (prix === null) return this.info(this.comptoir.basse ? "Les caisses sont presque vides : on ne rachète plus que le bois, la pierre et la nourriture." : "Les Compteurs ne rachètent pas ça.");
        const total = prix * n;
        if (!this.comptoir.payer(total)) return this.info("Le comptoir n'a plus de quoi payer. Reviens plus tard : sa trésorerie se refait quand les joueurs achètent.");
        this.retirerPlusieurs({ [op.objet]: n });
        this.bornerCharges();
        // Un objet-clé racheté n'entre pas en stock : le Comptoir en a toujours (plan 0.10, chantier B).
        if (!estObjetCle(typeDe(op.objet))) this.comptoir.entrerEnStock(op.objet, n);
        this.poche = ajouterWotts(this.poche, total, instant);
        this.mesurer("wotts", "vente", total, { objet: op.objet, n });
        this.noterFait("wotts_gagnes", total);
        this.noterFait(`vente:${typeDe(op.objet)}`, n);
        this.info(`Vendu : ${nommer(op.objet, n)}, +${formaterWotts(total)}.`);
        break;
      }
      case "acheter": {
        const n = Math.floor(op.quantite);
        // Un objet-clé ne manque jamais (plan 0.10, chantier B) : il ne sort pas du stock.
        const toujours = estCleObjet(op.objet) && estObjetCle(typeDe(op.objet));
        if (!(n >= 1) || !estCleObjet(op.objet) || (!toujours && (this.comptoir.stock[op.objet] ?? 0) < n)) return;
        // Un objet-clé : seulement après une première visite de son lieu (plan 0.8, chantier 10).
        const refusCle = refusVenteCle(typeDe(op.objet), this.quetes.etat.faits);
        if (refusCle) return this.info(refusCle);
        const total = prixVenteCle(op.objet) * n;
        if (total > enPoche + 1e-6) return this.info(`Il te faut ${formaterWotts(total)} en bons. Gagne-les : dépose de l'électricité, vends, ou pédale pour les Compteurs.`);
        if (poidsInventaire(this.inventaire, this.gourde.litres) + OBJETS[typeDe(op.objet)].poids * n > capaciteDe(this.inventaire)) return this.sacTropLourd({ [op.objet]: n });
        if (!toujours && !this.comptoir.sortirDuStock(op.objet, n)) return;
        this.poche = ajouterWotts(this.poche, -total, instant);
        this.mesurer("wotts", "achat", -total, { objet: op.objet, n });
        this.comptoir.encaisser(total);
        this.ajouterPlusieurs({ [op.objet]: n });
        break;
      }
      case "deposer": {
        // Le seul geste qui crée des wotts : de l'électricité qui entre dans une cellule (Book 07 §3.1).
        if (!BATTERIES.includes(op.batterie)) return;
        const wh = Math.min(this.charges[op.batterie] ?? 0, this.comptoir.placeCellules());
        if (wh < 1) return this.info(this.comptoir.placeCellules() < 1 ? "Les cellules des Compteurs sont pleines : reviens plus tard." : "Cette batterie est vide : charge-la chez toi (banc solaire, pédalier générateur).");
        const wotts = wh * REGLAGES.depot_wotts_par_wh;
        this.charges = { ...this.charges, [op.batterie]: (this.charges[op.batterie] ?? 0) - wh };
        this.envoyerCharges();
        this.comptoir.stocker(wh);
        this.poche = ajouterWotts(this.poche, wotts, instant);
        this.mesurer("wotts", "création (dépôt d'électricité)", wotts, { wh });
        this.noterFait("wotts_gagnes", wotts);
        this.noterFait("depot_wh", wh);
        this.info(`${Math.round(wh)} Wh déposés : +${formaterWotts(wotts)} en bons frais.`);
        break;
      }
      case "retirer": {
        // Recharger une batterie au comptoir détruit les wotts payés (Book 07 §3.1).
        if (!BATTERIES.includes(op.batterie)) return;
        const n = this.inventaire[op.batterie] ?? 0;
        const place = capacite(op.batterie, n) - (this.charges[op.batterie] ?? 0);
        const wh = Math.min(place, this.comptoir.reserveWh, enPoche / PRIX_RETRAIT);
        if (n === 0) return this.info("Tu n'as pas cette batterie.");
        if (wh < 1) return this.info(place < 1 ? "Elle est déjà pleine." : enPoche < 1 ? "Il te faut des bons : dépose de l'électricité, vends, ou pédale pour les Compteurs." : "Les cellules des Compteurs sont vides : reviens plus tard.");
        this.comptoir.destocker(wh);
        this.poche = ajouterWotts(this.poche, -wh * PRIX_RETRAIT, instant);
        this.mesurer("wotts", "destruction (recharge au comptoir)", -wh * PRIX_RETRAIT, { wh });
        this.ajouterCharge(op.batterie, wh);
        this.info(`+${Math.round(wh)} Wh dans ${nommer(op.batterie, 1)}.`);
        break;
      }
      case "verser": {
        const m = Math.min(op.montant, enPoche);
        if (!(m > 0)) return;
        this.poche = ajouterWotts(this.poche, -m, instant);
        this.compteWotts = ajouterWotts(this.compteWotts, m, instant);
        break;
      }
      case "tirer": {
        const m = Math.min(op.montant, valeurWotts(this.compteWotts, instant));
        if (!(m > 0)) return;
        this.compteWotts = ajouterWotts(this.compteWotts, -m, instant);
        this.poche = ajouterWotts(this.poche, m, instant);
        break;
      }
      default:
        return;
    }
    this.envoyerWotts();
    this.comptoir.publier(instant);
  }

  /** Le Comptoir tel que ce joueur le voit : les clés de L1 d'un lieu jamais visité sont absentes de l'étal (§9.2). */
  private vueComptoir(instant: number): ReturnType<Comptoir["vue"]> {
    const vue = this.comptoir.vue(instant);
    return { ...vue, stock: etalPour(vue.stock, this.quetes.etat.faits) };
  }

  /** Pédaler pour les Compteurs : ils paient le Wh_m sur leur trésorerie, sans créer de wotts (Book 07 §3.1). */
  private pedalerAuComptoir(): void {
    if (this.lieu !== "comptoir") return;
    if (!this.proche(COMPTOIR.pedalier.x, COMPTOIR.pedalier.z, 2.5)) return this.info("Approche-toi du pédalier.");
    const whM = WH_M_PAR_HEURE * (this.compte.famille === "mecanistes" ? BONUS_MECANISTE : 1);
    const paie = Math.round(whM * WOTTS_PAR_WH_M);
    this.commencer(
      "Pédaler pour les Compteurs",
      DUREE_PEDALAGE,
      () => {
        if (!this.comptoir.payer(paie)) return this.info("Les Compteurs n'ont plus de quoi payer.");
        this.poche = ajouterWotts(this.poche, paie, this.maintenant());
        this.mesurer("wotts", "pédalier des Compteurs", paie);
        this.noterFait("wotts_gagnes", paie);
        this.envoyerWotts();
        this.comptoir.publier(this.maintenant());
        this.info(`+${formaterWotts(paie)} pour une heure de pédalage.`);
      },
      KCAL_PEDALAGE_EN_PLUS,
      "outil",
    );
  }

  // ---------- Combat (É3, lot 3 : Book 06 §2 et §8, Book 08 §3.3) ----------

  private eteintsIci(): Eteint[] {
    if (this.lieu === "comptoir") return [];
    return this.vivant ? this.vivant.eteints : this.eteints;
  }

  /** Ceux qui le tiennent. */
  private saisisseurs(): Eteint[] {
    return this.eteintsIci().filter((e) => e.saisit === this.compte.id);
  }

  private enduranceMax(): number {
    return this.maintenant() < this.sante.convalescenceJusqua ? ENDURANCE_CONVALESCENCE : ENDURANCE_MAX;
  }

  /**
   * Ciblage assisté (Book 08 §3.3) : l'Éteint le plus proche, devant soi, à portée d'arme. Jamais à travers un mur
   * (0.7.1) : celui qui est derrière ne se touche pas, et le coup part dans le vide.
   */
  private cibleDevant(allonge: number): Eteint | null {
    let meilleur: Eteint | null = null;
    let meilleureDistance = Infinity;
    const zone = this.zoneIci();
    for (const e of this.eteintsIci()) {
      if (e.etat === "detruit") continue;
      const dx = e.x - this.position.x;
      const dz = e.z - this.position.z;
      const d = Math.hypot(dx, dz);
      if (d > allonge + 0.35) continue;
      const ecart = Math.abs(Math.atan2(Math.sin(Math.atan2(dx, dz) - this.position.o), Math.cos(Math.atan2(dx, dz) - this.position.o)));
      if (ecart > ANGLE_CIBLAGE) continue;
      // Au fond de la fosse du rouet (le Moulin, M14) : on l'atteint d'en haut avec une arme de 2 m d'allonge.
      if (d >= meilleureDistance || !(voieLibre(zone, this.position, e) || (this.lieu === "moulin" && atteintDansLaFosse(e, allonge)))) continue;
      meilleur = e;
      meilleureDistance = d;
    }
    return meilleur;
  }

  private frapper(appuye: boolean): void {
    let enMain: Arme;
    this.mesurer("activite", "combat", 0.6);
    const instant = this.maintenant();
    // Un coup va jusqu'au bout (P-004) : on ne refrappe pas avant la fin du geste.
    if (this.voyage || instant < this.prochaineFrappe) return;
    // Tenu, on n'a pas l'amplitude pour frapper (0.8.4) : A compte comme un appui pour se dégager, quelle que soit l'arme.
    if (this.saisisseurs().length > 0) return this.degager();
    // L'arme électrique sans courant n'est qu'un gourdin court ; trop faible, la longue part en courte (Book 25 §8.2).
    ({ arme: enMain, appuye } = this.electricite.pourFrapper(this.armeDuCombat(), appuye));
    const cout = coutEnduranceCoup(enMain, appuye);
    this.annulerAction();
    const force = this.endurance < SEUIL_EPUISE ? 0.5 : 1;
    this.endurance = Math.max(0, this.endurance - cout);
    this.prochaineFrappe = instant + (appuye ? enMain.coupAppuye : enMain.coup) - TOLERANCE_COUP_MS;
    this.geste({ geste: "frappe", appuye, ...(enMain.objet ? { objet: enMain.objet } : {}), duree: (appuye ? enMain.coupAppuye : enMain.coup) / 1000 });
    this.bruitCoupJusqua = instant + 600;
    // Le choc s'entend plus loin que le tranchant ; la décharge crépite (Book 25 §8.4).
    this.porteeDuCoup = porteeBruitCoup(enMain, appuye);
    const cible = this.cibleDevant(enMain.allonge);
    if (!cible) return;
    this.position = { ...this.position, o: Math.atan2(cible.x - this.position.x, cible.z - this.position.z) };
    // Abîmée (sous 30 % de solidité), elle frappe 30 % moins fort (Book 23 §4.3).
    const cle = cleArme(enMain);
    const abimee = cle !== null && etatArme(cle, this.usure) < SEUIL_ABIMEE;
    const arme = abimee ? { ...enMain, degatsTorse: enMain.degatsTorse * MALUS_ABIMEE } : this.filsDeRasoir.affile(enMain, cle);
    // L'électricité (Book 25 §5.1) peut raidir un voisin : on donne les autres Éteints du lieu.
    const effet = encaisserCoup(cible, arme, appuye, force, this.position, this.zoneIci(), this.eteintsIci());
    const resultat = effet.resultat;
    this.user(enMain);
    this.electricite.apresDecharge(enMain, appuye);
    if (resultat === "detruit") this.apresDestruction(cible, arme.type);
    // Pour les quêtes (Book 25 §9.4 : « La Raquette ») : détruit au contact, et de quel type.
    if (resultat === "detruit") this.noterFait(`detruit:${arme.type}`);
    const electrique = arme.type === "electrique" ? ({ electrique: true } as const) : {};
    const coups = [{ t: "coup" as const, id: cible.id, x: cible.x, z: cible.z, resultat, ...electrique }];
    if (effet.voisinRaidi) coups.push({ t: "coup" as const, id: effet.voisinRaidi.id, x: effet.voisinRaidi.x, z: effet.voisinRaidi.z, resultat: "raidi", ...electrique });
    for (const coup of coups) {
      // Seuls ceux qui voient le coup (le frappeur ou sa cible) le reçoivent (0.7.2) ; le frappeur, toujours.
      if (this.vivant) this.vivant.diffuserVu(coup, [this.position, coup]);
      else this.envoyer(coup);
    }
    if (arme.type === "electrique") {
      if (resultat === "detruit") this.info("Il s'éteint.");
      else if (resultat === "raidi") this.indice("raidi", "Il est raidi : maintiens {agir} pour l'éteindre.");
    } else if (resultat === "a_terre") this.indice("a_terre", "Achève-le : frappe à la tête (maintiens {agir}, relâche).");
    if (resultat === "detruit" && arme.objet === null) this.info(`À mains nues, ça ne suffira pas : prends une arme. ${ouTrouverPhrase("gourdin", this.recetteVisible)}`);
  }

  /** Ce que le joueur prête au moteur des projectiles (tir.ts) : rien que des accès, aucune règle. */
  private contexteTir(): ContexteTir {
    const j = this;
    return {
      get id() {
        return j.compte.id;
      },
      maintenant: () => j.maintenant(),
      alea: () => j.alea(),
      position: () => j.position,
      orienter: (o) => {
        j.position = { ...j.position, o };
        j.positionEnvoyee = false;
      },
      lieu: () => j.lieu,
      zone: () => j.zoneIci(),
      eteints: () => j.eteintsIci(),
      inventaire: () => j.inventaire,
      retirer: (cle, n) => j.retirer(cle, n),
      poserAuSol: (objets, ou) => j.poserAuSol(objets, {}, ou),
      saisi: () => j.saisisseurs().length > 0,
      empeche: () =>
        j.voyage
          ? "En route, on ne lance rien."
          : j.lieu === "comptoir"
            ? "Pas au Comptoir : les Compteurs n'aiment pas le désordre."
            : j.objetPorte()
            ? "Tu as les bras pris : pose d'abord l'escabeau."
            : j.brasDuLieu()
            ? "Tu as les bras pris."
            : j.sommeil
              ? "Tu dors."
              : null,
      endurance: () => j.endurance,
      depenser: (n) => {
        j.endurance = Math.max(0, j.endurance - n);
      },
      info: (t) => j.info(t),
      indice: (sorte, t) => j.indice(sorte, t),
      envoyer: (m) => j.envoyer(m),
      // Un projectile ne part qu'à ceux qui voient son départ ou son arrivée (0.7.2).
      diffuser: (m) =>
        j.vivant
          ? m.t === "projectile"
            ? j.vivant.diffuserVu(m, [{ x: m.projectile.x0, z: m.projectile.z0 }, { x: m.projectile.x1, z: m.projectile.z1 }])
            : j.vivant.diffuser(m)
          : j.envoyer(m),
      user: (arme) => j.user(arme),
      apresDestruction: (e, comment) => j.apresDestruction(e, comment),
      noterTir: (objet, secondes) => {
        j.mesurer("metier", `tir:${objet}`, 1);
        j.mesurer("activite", "combat", secondes);
      },
      commencer: (libelle, dureeS, appliquer) => j.commencer(libelle, dureeS, appliquer, 0, "outil"),
      noter: (fait) => j.noterFait(fait),
      // Au gué, un objet tombe dans la rivière ; un galet bien lancé y ricoche (G8, plan 0.8 chantier 11).
      surLEau: (de, ou, objet, tenuMs) => (j.lieu === "gue" ? ricochet(de, ou, objet === "pierre" && tenuMs >= GESTE_RICOCHET_MS) : null),
    };
  }

  /** Ce que le joueur prête au gué (serveur/src/gue.ts, plan 0.8 chantier 11) : rien que des accès, aucune règle. */
  private ctxGue: ContexteGue | null = null;
  private contexteGue(): ContexteGue {
    const j = this;
    return (this.ctxGue ??= {
      id: j.compte.id,
      maintenant: () => j.maintenant(),
      position: () => j.position,
      deplacer: (p) => {
        j.position = p;
        j.positionEnvoyee = false;
      },
      info: (t) => j.info(t),
      endurance: () => j.endurance,
      depenser: (n) => {
        j.endurance = Math.max(0, j.endurance - n);
      },
      commencer: (libelle, dureeS, appliquer) => {
        // Le radeau garde sa place : un geste repris repart de là, pas d'une progression gardée.
        j.progressions.delete(libelle);
        j.commencer(libelle, dureeS, appliquer, 0, "outil");
      },
      geste: () => j.action?.libelle ?? null,
      annuler: () => j.annulerAction(),
    });
  }

  private ctxLieu: ContexteLieu | null = null;
  /** Ce que le joueur prête au lieu où il est, pour ses gestes propres (0.10, LieuVivant.geste et accompagner). */
  private contexteLieu(): ContexteLieu {
    const j = this;
    return (this.ctxLieu ??= {
      id: j.compte.id,
      maintenant: () => j.maintenant(),
      position: () => j.position,
      deplacer: (p) => {
        j.position = p;
        j.positionEnvoyee = false;
      },
      info: (t) => j.info(t),
      envoyer: (m) => j.envoyer(m),
      inventaire: () => j.inventaire,
      ajouter: (objets) => j.ajouterPlusieurs(objets),
      retirer: (objet, n) => {
        if ((j.inventaire[objet] ?? 0) < n) return false;
        j.retirer(objet, n);
        return true;
      },
      commencer: (libelle, dureeS, appliquer) => j.commencer(libelle, dureeS, appliquer),
      annuler: () => j.annulerAction(),
    });
  }

  /** Ce que le joueur prête à la forge (forge.ts) : rien que des accès, aucune règle. */
  /** La couche de déchets (0.7) : ce qu'elle demande au joueur. */
  private creerDechets(): CoucheDechets {
    const j = this;
    return new CoucheDechets({
      id: j.compte.id,
      base: j.base,
      maintenant: () => j.maintenant(),
      lieu: () => (j.voyage ? null : j.lieu),
      position: () => j.position,
      inventaire: () => j.inventaire,
      litresGourde: () => j.gourde.litres,
      ajouter: (objets) => j.ajouterPlusieurs(objets),
      commencer: (libelle, duree, appliquer, bruit) => j.commencer(libelle, duree, appliquer, 0, bruit),
      info: (t) => j.info(t),
      envoyer: (m) => j.envoyer(m),
      sacTropLourd: (vise) => j.sacTropLourd(vise),
      vivant: () => j.vivant,
      noterFait: (f) => j.noterFait(f),
      recetteVisible: (id) => j.recetteVisible(id),
    });
  }

  private contexteForge(): ContexteForge {
    const j = this;
    return {
      get id() {
        return j.compte.id;
      },
      alea: () => j.alea(),
      inventaire: () => j.inventaire,
      outils: () => j.outils(),
      retirer: (cle, n) => j.retirer(cle, n),
      ajouter: (objets) => j.ajouterPlusieurs(objets),
      installationsProches: () => (j.lieu !== "terrain" || j.voyage ? [] : [...j.installations.values()].filter((i) => j.proche(i.x, i.z, 3))),
      majInstallation: (i) => {
        j.base.sauverEtatInstallation(j.compte.id, i.id, i.etat);
        j.envoyer({ t: "installation", installation: i });
      },
      faits: (cle) => j.quetes.etat.faits[cle] ?? 0,
      info: (t) => j.info(t),
      commencer: (libelle, dureeS, appliquer) => j.commencer(libelle, dureeS, appliquer, 0, "outil"),
      lire: (cle) => j.base.lireMonde(cle),
      ecrire: (cle, valeur) => j.base.ecrireMonde(cle, valeur),
    };
  }

  /** Ce que le joueur prête au module de l'électricité (electricite.ts) : des accès, aucune règle. */
  /** Ce que le joueur prête aux meubles nouveaux du niveau 2 (serveur/src/meubles-neufs.ts) : rien que des accès. */
  private contexteMeublesNeufs(): ContexteMeublesNeufs {
    const j = this;
    return {
      maintenant: () => j.maintenant(),
      debutMonde: () => j.debutMonde,
      position: () => j.position,
      installations: () => j.installations.values(),
      inventaire: () => j.inventaire,
      outils: () => j.outils(),
      retirer: (objets) => j.retirerPlusieurs(objets),
      gourde: () => j.gourde,
      eauBouillie: () => {
        j.gourde = { contenu: "potable", litres: j.gourde.litres };
        if (j.tuto) j.tuto.bouilli = true;
        j.noterFait("ebullition");
        j.envoyerBesoins();
      },
      sauverInstallation: (i) => {
        j.base.sauverEtatInstallation(j.compte.id, i.id, i.etat);
        if (j.lieu === "terrain" && !j.voyage) j.envoyer({ t: "installation", installation: i });
      },
      majBase: () => j.mettreAJourBase(j.maintenant()),
      info: (t) => j.info(t),
      noter: (f) => j.noterFait(f),
      commencer: (libelle, dureeS, appliquer) => j.commencer(libelle, dureeS, appliquer),
      alea: () => j.alea(),
      apresDestruction: (e, comment) => j.apresDestruction(e, comment),
    };
  }

  private contexteElectricite(): ContexteElectricite {
    const j = this;
    return {
      maintenant: () => j.maintenant(),
      inventaire: () => j.inventaire,
      chargeArmes: () => j.chargeArmes,
      majChargeArme: (cle, wh) => j.majChargeArme(cle, wh),
      charges: () => j.charges,
      majCharges: (c) => {
        j.charges = c;
        j.envoyerCharges();
      },
      endurance: () => j.endurance,
      depenser: (n) => {
        j.endurance = Math.max(0, j.endurance - n);
      },
      sauverInstallation: (i) => {
        j.base.sauverEtatInstallation(j.compte.id, i.id, i.etat);
        j.envoyer({ t: "installation", installation: i });
      },
      info: (t) => j.info(t),
      indice: (sorte, t) => j.indice(sorte, t),
      commencer: (libelle, dureeS, appliquer, kcal) => j.commencer(libelle, dureeS, appliquer, kcal ?? 0, "outil"),
      retirer: (objets) => j.retirerPlusieurs(objets),
      noter: (fait) => j.noterFait(fait),
      // Le banc de recharge (0.8.2, chantier C).
      prendreBatterie: (b) => j.sortirBatterie(b),
      rendreBatterie: (b, wh) => {
        j.ajouterPlusieurs({ [b]: 1 });
        j.ajouterCharge(b, wh);
      },
      chargerBatterie: (b, wh) => j.ajouterCharge(b, wh),
      majBase: () => j.mettreAJourBase(j.maintenant()),
    };
  }

  /** Une batterie sort du sac (posée dans le banc, échangée) : sa part de charge part avec elle ; rend cette charge. */
  private sortirBatterie(b: TypeBatterie): number {
    const wh = this.chargesQuiPartent({ [b]: 1 })[b] ?? 0;
    this.charges = { ...this.charges, [b]: Math.max(0, (this.charges[b] ?? 0) - wh) };
    this.retirerPlusieurs({ [b]: 1 });
    this.envoyerCharges();
    return wh;
  }

  /** Ce que le joueur prête à la mécanique des Mécanistes (mecanique.ts) : des accès, aucune règle. */
  private contexteMecanique(maj: () => void): ContexteMecanique {
    return {
      inventaire: () => this.inventaire,
      endurance: () => this.endurance,
      depenser: (n) => {
        this.endurance = Math.max(0, this.endurance - n);
      },
      retirer: (objets) => this.retirerPlusieurs(objets),
      info: (t) => this.info(t),
      commencer: (libelle, secondes, appliquer, bruit, kcal) => this.commencer(libelle, secondes, appliquer, kcal ?? 0, bruit),
      maj,
      noter: (fait) => this.noterFait(fait),
      famille: () => this.compte.famille,
      batterieDuSac: () => this.batterieAvecPlace(),
      chargerSac: (b, wh) => this.ajouterCharge(b, wh),
      installations: () => this.installations.values(),
      sauverInstallation: (i) => {
        this.base.sauverEtatInstallation(this.compte.id, i.id, i.etat);
        this.envoyer({ t: "installation", installation: i });
      },
    };
  }

  /** Ce qui suit la destruction d'un Éteint, au contact comme au tir. */
  private apresDestruction(cible: Eteint, comment?: string): void {
    // Les mesures du métier (Book 25 §10.1) : comment on l'a détruit (tranchant, électrique, tir plein…).
    if (comment) this.mesurer("metier", `detruit:${comment}`, 1);
    if (this.tuto) this.tuto.premierEteintDetruit = true;
    // Le magasinier portait la clé du coffre à sa ceinture (Book 23 §3) : elle tombe là où il tombe.
    if (cible.variante === "magasinier") {
      this.poserAuSol({ cle_coffre: 1 }, {}, { x: cible.x, z: cible.z });
      this.info("Une chaînette tinte à sa ceinture : il portait une clé « MAGASIN ».");
    }
  }

  /** Équiper une arme pour le mode Combat (P-005) : elle doit être dans le sac. null : revenir au choix automatique. */
  private equiper(objet: CleObjet | null): void {
    if (objet !== null && (!estCleObjet(objet) || !estArme(objet) || (this.inventaire[objet] ?? 0) < 1)) return;
    this.armeEquipee = objet;
    this.armePerdueSignalee = false;
    this.base.sauverArme(this.compte.id, objet);
    this.envoyer({ t: "arme", arme: objet });
    if (objet) this.info(`En mode Combat, tu frapperas avec ${armeEnMain(this.inventaire, objet).nom}.`);
    else this.info("Plus d'arme choisie : en mode Combat, tu prendras la meilleure de ton sac.");
  }

  /**
   * L'arme en main : l'exemplaire équipé si on l'a encore (ou un autre de la même arme), sinon la meilleure du sac (et
   * on le dit, une fois).
   */
  private armeDuCombat(): Arme {
    const arme = armeEnMain(this.inventaire, this.armeEquipee);
    const memeArme = this.armeEquipee !== null && arme.objet === typeDe(this.armeEquipee);
    if (this.armeEquipee && !memeArme && !this.armePerdueSignalee) {
      this.armePerdueSignalee = true;
      const nom = armeDeCle(this.armeEquipee)?.nom ?? nommer(this.armeEquipee, 1);
      this.info(`${nom.charAt(0).toUpperCase()}${nom.slice(1)} n'est plus dans ton sac : tu te bats avec ${arme.nom}.`);
    }
    if (memeArme) this.armePerdueSignalee = false;
    return arme;
  }

  private esquiver(dx: number, dz: number): void {
    const instant = this.maintenant();
    if (this.voyage || !Number.isFinite(dx) || !Number.isFinite(dz)) return;
    if (this.endurance < COUT_ENDURANCE.esquive) return this.info("Trop essoufflé pour esquiver : recule en marchant, ton souffle revient vite (jauge d'endurance).");
    const l = Math.hypot(dx, dz);
    // Sans direction, on recule.
    const [ux, uz] = l > 0.01 ? [dx / l, dz / l] : [-Math.sin(this.position.o), -Math.cos(this.position.o)];
    this.annulerAction();
    this.geste({ geste: "esquive" });
    this.endurance -= COUT_ENDURANCE.esquive;
    this.esquiveJusqua = instant + ESQUIVE.invulnerable * 1000;
    this.elan = { dx: ux, dz: uz, restant: ESQUIVE.duree };
    for (const e of this.saisisseurs()) lacher(e, this.position, this.zoneIci());
    this.appuisDegagement = 0;
  }

  /** L'usure de chaque exemplaire d'arme en main : coups qui restent (absente : neuf). Clé : « lame_forgee#4 », ou le type. */
  private usure: Partial<Record<CleObjet, number>> = {};
  /** Les lames affûtées à la meule fine : +10 % jusqu'à la casse (Book 25 §6.4, serveur/src/mecanique.ts). */
  private readonly filsDeRasoir = new FilsDeRasoir();
  /** La charge de chaque exemplaire d'arme électrique : Wh qui restent (absente : pleine), Book 25 §5.4. */
  private chargeArmes: Partial<Record<CleObjet, number>> = {};

  /**
   * Fixe la charge d'un exemplaire d'arme électrique (Wh qui restent), la sauve et la montre dans le sac. C'est le point
   * d'entrée du chantier 6 (décharges, recharge au banc et à la manivelle) ; `chargeArme` (combat.ts) la lit.
   */
  majChargeArme(cle: CleObjet, wh: number): void {
    const a = armeDeCle(cle);
    if (!a?.electrique || !Number.isFinite(wh)) return;
    const max = capaciteChargeArme(a);
    const borne = Math.max(0, Math.min(max, wh));
    if (borne >= max) delete this.chargeArmes[cle];
    else this.chargeArmes[cle] = Math.round(borne * 1000) / 1000;
    this.base.sauverChargeArmes(this.compte.id, this.chargeArmes);
    this.envoyer({ t: "usure", usure: { ...this.usure }, charge: { ...this.chargeArmes } });
  }

  /**
   * Un coup qui touche use l'arme en main (Book 23 §4.3). Sous 30 %, elle est abîmée (on le dit, une fois) ; à 0, elle
   * casse : on en perd une, et la suivante du même exemplaire est neuve. L'usure est tenue par exemplaire (Book 25
   * §9.6) : une lame ★★ et une lame ★★★★ s'usent chacune de leur côté.
   */
  private user(arme: Arme): void {
    const o = cleArme(arme);
    if (!o || !arme.objet || !Number.isFinite(arme.solidite)) return;
    const avant = etatArme(o, this.usure);
    const reste = (this.usure[o] ?? arme.solidite) - 1;
    if (reste <= 0) {
      delete this.usure[o];
      this.filsDeRasoir.casse(o);
      this.retirer(o, 1);
      this.envoyer({ t: "usure", usure: { ...this.usure }, evenement: { objet: o, etat: "cassee" } });
      // Elle laisse un débris, qui se démonte (Book 23 §4.3) : dans le sac, ou par terre s'il n'y a plus de place.
      const debris = DEBRIS_ARME[arme.objet];
      let reste = "";
      if (debris) {
        if (poidsInventaire(this.inventaire, this.gourde.litres) + poidsDe({ [debris]: 1 }) <= capaciteDe(this.inventaire)) {
          this.ajouterPlusieurs({ [debris]: 1 });
          if (debris === "lame_ebrechee") this.forge.noterDebris(o);
          reste = ` Il n'en reste qu'un débris (${nommer(debris, 1)}), qui se démonte : Sac → Démonter.`;
        } else {
          this.poserAuSol({ [debris]: 1 });
          reste = ` Son débris (${nommer(debris, 1)}) est tombé par terre : ton sac est plein.`;
        }
      }
      this.info(`${arme.nom.charAt(0).toUpperCase()}${arme.nom.slice(1)} vient de casser.${reste} ${compter(this.inventaire, arme.objet) > 0 ? "Tu prends la suivante, neuve." : "Il te faudra une autre arme."}`);
      this.base.sauverUsure(this.compte.id, this.usure);
      return;
    }
    this.usure[o] = reste;
    if (avant >= SEUIL_ABIMEE && reste / arme.solidite < SEUIL_ABIMEE) {
      this.envoyer({ t: "usure", usure: { ...this.usure }, evenement: { objet: o, etat: "abimee" } });
      this.info(`${arme.nom.charAt(0).toUpperCase()}${arme.nom.slice(1)} est abîmée : ses coups portent moins. Répare-la (Sac).`);
    }
  }

  /**
   * Ce que le joueur prête à la reprise des armes (serveur/src/evolution-armes.ts, plan 0.8 chantier 9) : rien que des
   * accès, aucune règle. Le `reparer` d'avant la 0.8 y est.
   */
  private contexteEvolution(): ContexteEvolution {
    const j = this;
    return {
      inventaire: () => j.inventaire,
      usure: () => j.usure,
      chargeArmes: () => j.chargeArmes,
      alentours: () => (j.lieu === "terrain" && !j.voyage ? j.alentours() : null),
      occupe: () => j.voyage !== null || j.action !== null,
      retirerPlusieurs: (objets) => j.retirerPlusieurs(objets),
      // En un seul envoi : le client ne doit pas voir l'arme quitter le sac puis y revenir (« +1 arbalète »).
      echanger: (retire, ajoute) => {
        const inventaire = { ...j.inventaire };
        for (const [t, n] of Object.entries(retire) as [CleObjet, number][]) {
          const reste = (inventaire[t] ?? 0) - n;
          if (reste > 0) inventaire[t] = reste;
          else delete inventaire[t];
        }
        for (const [t, n] of Object.entries(ajoute) as [CleObjet, number][]) inventaire[t] = (inventaire[t] ?? 0) + n;
        j.inventaire = inventaire;
        j.base.sauverInventaire(j.compte.id, j.inventaire);
        j.envoyer({ t: "inventaire", inventaire: j.inventaire });
      },
      commencer: (libelle, dureeS, appliquer, pose) => j.commencer(libelle, dureeS, appliquer, 0, pose),
      info: (t) => j.info(t),
      envoyer: (m) => j.envoyer(m),
      sauver: () => {
        j.base.sauverUsure(j.compte.id, j.usure);
        j.base.sauverChargeArmes(j.compte.id, j.chargeArmes);
      },
      armeEquipee: () => j.armeEquipee,
      changerArmeEquipee: (cle) => {
        j.armeEquipee = cle;
        j.base.sauverArme(j.compte.id, cle);
        j.envoyer({ t: "arme", arme: cle });
      },
      affuterFin: (cle) => {
        if ([...j.installations.values()].some((i) => i.type === "pedalier" && i.etat.meuleFine && j.proche(i.x, i.z, 3))) j.filsDeRasoir.affuter(cle);
      },
    };
  }

  /** A-t-on tout cela dans le sac ? */
  private aDeQuoi(objets: Inventaire): boolean {
    return Object.entries(objets).every(([t, n]) => (this.inventaire[t as CleObjet] ?? 0) >= (n ?? 0));
  }

  /**
   * B au contact (Book 23 §4.4) : les Éteints à 1,2 m ou moins devant soi (cône de 90°), deux au plus, reculent d'un
   * mètre et demi, étourdis un instant. L'outil contre l'encerclement.
   */
  private repousserDevant(): void {
    if (this.voyage) return;
    if (this.endurance < REPOUSSER.cout) return this.info("Trop essoufflé pour repousser : recule, ton souffle revient vite.");
    // Le geste se voit même si personne n'est assez près pour reculer (le client l'a joué en l'envoyant).
    this.geste({ geste: "poussee" });
    const proches = this.eteintsIci()
      .filter((e) => debout(e))
      .map((e) => ({ e, d: Math.hypot(e.x - this.position.x, e.z - this.position.z) }))
      .filter(({ e, d }) => {
        if (d > REPOUSSER.portee + 0.3) return false;
        // On ne repousse pas à travers un mur (0.7.1).
        if (!voieLibre(this.zoneIci(), this.position, e)) return false;
        const angle = Math.atan2(e.x - this.position.x, e.z - this.position.z) - this.position.o;
        // Celui qui nous tient se repousse toujours, même de côté.
        return e.saisit === this.compte.id || Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle))) <= REPOUSSER.demiAngle;
      })
      .sort((a, b) => a.d - b.d)
      .slice(0, REPOUSSER.max);
    if (proches.length === 0) return;
    this.annulerAction();
    this.endurance -= REPOUSSER.cout;
    // Au Moulin, par le garde-corps brisé, il tombe dans la fosse du rouet (M14) ; ailleurs, il recule.
    for (const { e } of proches) if (!(this.lieu === "moulin" && pousserDansLaFosse(e, this.position, REPOUSSER.recul))) repousser(e, this.position, REPOUSSER.recul, REPOUSSER.etourdi, this.zoneIci());
    this.appuisDegagement = 0;
    this.bruitCoupJusqua = this.maintenant() + 400;
    this.porteeDuCoup = undefined;
  }

  /** Un leurre du décor de la Coopérative : klaxon, sonnette, radio (Book 23 §4.7). */
  private actionnerLeurre(id: string): void {
    // Les leurres du Moulin du Gué : le monte-sacs, le babillard, la borne (plan 0.8, chantier 12).
    if (this.lieu === "moulin" && !this.voyage) {
      const texte = this.moulins.actionner(this.compte.id, id, this.position, this.maintenant());
      if (texte) this.info(texte);
      return;
    }
    const l = LEURRES.find((x) => x.id === id);
    if (this.lieu !== "cooperative" || !l || this.voyage) return;
    // La radio est là où on l'a posée (0.5.1) ; dans le sac, on la pose d'abord.
    const ou = l.id === "radio" ? this.cooperatives.radio(this.compte.id) : l;
    if (!ou) return this.info("La radio est dans ton sac : pose-la d'abord, là où tu veux attirer les Éteints.");
    if (!this.proche(ou.x, ou.z, DISTANCE_INTERACTION + 0.5)) return this.info("Approche-toi.");
    const texte = this.cooperatives.actionner(this.compte.id, id, this.maintenant());
    if (texte) this.info(texte);
  }

  /** Prendre la radio à piles dans son sac (Book 23 §4.7 : « elle se transporte et se pose »). Elle s'éteint. */
  private prendreRadio(): void {
    if (this.lieu !== "cooperative" || this.voyage) return;
    const ou = this.cooperatives.radio(this.compte.id);
    if (!ou) return;
    if (!this.proche(ou.x, ou.z, DISTANCE_INTERACTION + 0.5)) return this.info("Approche-toi.");
    if (poidsInventaire(this.inventaire, this.gourde.litres) + poidsDe({ radio_piles: 1 }) > capaciteDe(this.inventaire)) return this.sacTropLourd({ radio_piles: 1 });
    if (!this.cooperatives.prendreRadio(this.compte.id, this.maintenant())) return;
    this.ajouterPlusieurs({ radio_piles: 1 });
    this.info("Tu glisses la radio dans ton sac. Pose-la où tu veux attirer les Éteints, puis allume-la.");
  }

  /** Poser la radio à ses pieds, dans la Coopérative (éteinte : on l'allume ensuite, ou on s'éloigne d'abord). */
  private poserRadio(): void {
    if (this.lieu !== "cooperative" || this.voyage || !(this.inventaire.radio_piles ?? 0)) return;
    if (this.cooperatives.radio(this.compte.id)) return;
    this.retirer("radio_piles", 1);
    this.cooperatives.poserRadio(this.compte.id, this.position.x, this.position.z);
  }

  /** Taper vite pour se dégager (Book 08 §3.3), avec A ou B : il en faut plus quand plusieurs tiennent (pas quand on est épuisé, 0.8.4). */
  private degager(): void {
    const tiennent = this.saisisseurs();
    if (tiennent.length === 0) return;
    this.geste({ geste: "degagement" });
    this.endurance = Math.max(0, this.endurance - COUT_ENDURANCE.degagement);
    this.appuisDegagement++;
    const besoin = APPUIS_DEGAGEMENT * tiennent.length;
    if (this.appuisDegagement < besoin) return;
    this.appuisDegagement = 0;
    for (const e of tiennent) lacher(e, this.position, this.zoneIci());
    if (this.tuto) this.tuto.degage = true;
  }

  private soigner(): void {
    if ((this.inventaire.pansement ?? 0) < 1) return this.info("Tu n'as pas de pansement. Des chiffons coupés en bandes feront l'affaire.");
    if (this.sante.saignement === "aucun") return this.info("Tu ne saignes pas.");
    this.commencer("Faire un pansement", 6, () => {
      if ((this.inventaire.pansement ?? 0) < 1) return;
      this.retirer("pansement", 1);
      this.sante = panser(this.sante);
      this.envoyerSante(true);
      this.info("Le saignement s'arrête.");
    }, 0, "aucun");
  }

  private santeVue(): SanteVue {
    return {
      points: Math.round(this.sante.points),
      saignement: this.sante.saignement,
      blessures: this.sante.blessures.map((b) => b.type),
      convalescence: this.maintenant() < this.sante.convalescenceJusqua,
      intoxique: symptomes(this.sante, this.maintenant()) !== null,
      ...(nauseeux(this.sante, this.maintenant()) ? { nauseeux: true } : {}),
    };
  }

  private envoyerSante(force = false): void {
    const instant = this.maintenant();
    if (!force && instant - this.dernierEnvoiSante < 250) return;
    const saisi = this.saisisseurs().length;
    const m = { t: "sante" as const, sante: this.santeVue(), endurance: Math.round(this.endurance), saisi };
    const cle = JSON.stringify(m);
    if (cle === this.santeEnvoyee) return;
    this.santeEnvoyee = cle;
    this.dernierEnvoiSante = instant;
    this.envoyer(m);
  }

  /** Le combat, la santé et l'endurance, à chaque pas. */
  private tickCombat(instant: number, dt: number): void {
    const tiennent = this.saisisseurs();
    if (tiennent.length === 0) this.appuisDegagement = 0;
    // Trois ou plus : effondrement quasi certain (Book 06 §2.3). Sauf l'admin invincible.
    if (tiennent.length >= 3 && !this.invincible) return this.effondrer("Ils sont trop nombreux.");
    for (const e of tiennent) {
      // L'Éteint du tutoriel ne mord jamais : il lâche prise tout seul (validé, 2026-10-08).
      if (e.tuto) {
        if (e.tenue >= 6) {
          lacher(e, this.position, this.zoneIci());
          if (this.tuto) this.tuto.degage = true;
          this.info("Il te lâche… La prochaine fois, tape deux fois {agir} ou {examiner} !");
        }
        continue;
      }
      if (e.tenue < DELAI_MORSURE) continue;
      e.tenue = 0;
      // Pas de morsure à travers un mur (0.7.1) : il lâche.
      if (!voieLibre(this.zoneIci(), e, this.position)) {
        lacher(e, this.position, this.zoneIci());
        continue;
      }
      // Le protège-bras de fortune (P-002) : une morsure sur deux n'y passe pas ; il finit par se déchirer.
      if ((this.inventaire.protege_bras ?? 0) > 0 && this.alea() < 0.5) {
        if (this.alea() < 0.25) {
          this.retirer("protege_bras", 1);
          this.info("Les dents ont glissé sur le protège-bras… qui part en lambeaux. Refais-en un (chiffons, ficelle).");
        } else this.info("Les dents ont glissé sur le protège-bras.");
        continue;
      }
      // L'admin invincible : la morsure se voit et s'entend, sans blessure.
      if (!this.invincible) this.sante = aggraver(this.sante, "morsure", DEGATS_MORSURE, instant);
      this.noterFait("morsure");
      this.envoyer({ t: "morsure" });
      this.geste({ geste: "touche" });
      this.envoyerSante(true);
    }

    // Endurance : la course fatigue, le reste du temps on souffle.
    const court = this.bouge && this.intention.allure === "course";
    if (court) this.endurance -= ENDURANCE_COURSE * dt;
    // La nausée d'un Noyé crevé (0.10) : deux fois moins vite.
    else if (instant > this.prochaineFrappe + 600) this.endurance += recuperationEndurance(this.sante, instant) * dt;
    this.endurance = Math.max(0, Math.min(this.enduranceMax(), this.endurance));

    this.sante = evoluer(this.sante, dt, instant, this.besoins.kcal > 0 && this.besoins.eau > 0);
    this.garderInvincible();
    // Un champignon toxique : vomissements (on perd de l'eau), et la santé qui baisse (Book 05 §5 bis).
    const malade = symptomes(this.sante, instant);
    const intox = this.sante.intoxication;
    if (malade && intox) {
      this.besoins = { ...this.besoins, eau: Math.max(0, this.besoins.eau - malade.eauParSeconde * dt) };
      if (!intox.annoncee) {
        this.sante = { ...this.sante, intoxication: { ...intox, annoncee: true } };
        this.info(
          intox.champignon === "phalloide"
            ? "Des crampes terribles, des vomissements : ce champignon était une amanite phalloïde. Ton foie lâche."
            : intox.champignon === "conserve_bombee"
              ? "Tu vomis, les jambes flanchent : la conserve bombée était avariée. Bois, et repose-toi."
              : "Tu vomis, la tête tourne, tu vois trouble : ce champignon était toxique.",
        );
        this.envoyerBesoins();
      }
    }
    if (this.sante.points <= 0) return this.effondrer(this.sante.intoxication ? "Le poison t'a terrassé." : "Tu as perdu trop de sang.");
    this.envoyerSante();
  }

  /**
   * L'effondrement (Book 05 §10.3) : le personnage tombe, perd ce qu'il portait (le sac reste sur place),
   * et se réveille chez lui. Les blessures restent, stabilisées ; faim et soif à 30 % ; convalescence.
   */
  private effondrer(raison: string): void {
    if (this.invincible) return this.garderInvincible();
    this.mesurer("effondrement", raison, 1, { lieu: this.lieu });
    this.geste({ geste: "effondre" });
    const instant = this.maintenant();
    this.reveiller("");
    this.poserObjetLourd();
    for (const e of this.saisisseurs()) lacher(e, this.position, this.zoneIci());
    const enPoche = valeurWotts(this.poche, instant);
    if (Object.keys(this.inventaire).length > 0 || enPoche > 0) {
      // Au comptoir, zone gardée : les Compteurs rapportent le sac chez lui.
      const auComptoir = this.lieu === "comptoir";
      const sac = this.base.poserSac({
        lieu: auComptoir ? "terrain" : this.lieu,
        terrainDe: estHalte(this.lieu) ? 0 : this.compte.id,
        proprietaire: this.compte.id,
        x: auComptoir ? POINT_ARRIVEE.x + 1.5 : this.position.x,
        z: auComptoir ? POINT_ARRIVEE.z + 1 : this.position.z,
        contenu: { inventaire: this.inventaire, charges: this.charges, wotts: enPoche },
        creeLe: instant,
      });
      if (this.vivant) this.vivant.poserSac(sac);
      else this.sacsTerrain.push(sac);
    }
    this.poche = { valeur: 0, majLe: instant };
    if (this.lieu === "comptoir") this.comptoir.sortir(this.envoyer);
    this.inventaire = {};
    this.charges = {};
    this.base.sauverInventaire(this.compte.id, this.inventaire);
    this.annulerAction();
    this.lumiere = false;
    this.elan = null;
    this.vivant?.sortir(this);
    this.eteints = [];
    this.lieu = "terrain";
    this.position = { x: POINT_ARRIVEE.x, z: POINT_ARRIVEE.z, o: 0 };
    this.besoins = { ...this.besoins, kcal: Math.min(this.besoins.kcal, RESERVE_KCAL_MAX * NIVEAU_APRES_EFFONDREMENT), eau: Math.min(this.besoins.eau, RESERVE_EAU_MAX * NIVEAU_APRES_EFFONDREMENT) };
    this.sante = seRelever(this.sante, instant);
    this.endurance = ENDURANCE_CONVALESCENCE;
    this.sauvegarder();
    this.envoyer({ t: "effondrement" });
    this.info(`${raison} Des inconnus t'ont ramené chez toi, sans ton sac.`);
    this.info("Tu n'as plus que tes poches (10 kg) : va reprendre ton sac, ou fabrique un sac de fortune.");
    this.envoyer(this.bienvenue(this.debutMonde));
  }

  private sacsVus(): SacVu[] {
    if (this.vivant) return this.vivant.sacsVus(this.compte.id);
    return this.sacsTerrain.map((s) => vueDuSac(s, this.compte.id));
  }

  /** La liste des sacs et tas au sol du lieu (lieu vivant, ou terrain). */
  private sacsIci(): SacPose[] {
    return this.vivant ? this.vivant.sacs : this.sacsTerrain;
  }

  /** Un tas d'objets jetés : n'importe qui le ramasse, autant que son sac peut porter. */
  private ramasserTas(tas: SacPose): void {
    const pris: Inventaire = {};
    let poids = poidsInventaire(this.inventaire, this.gourde.litres);
    // Un sac par terre se prend d'abord : il fait de la place pour le reste.
    const entrees = (Object.entries(tas.contenu.inventaire) as [CleObjet, number][]).sort(([a], [b]) => (CONTENANTS[typeDe(b)] ?? 0) - (CONTENANTS[typeDe(a)] ?? 0));
    for (const [type, n] of entrees) {
      const unite = OBJETS[typeDe(type)].poids;
      const capacite = capaciteDe({ ...this.inventaire, ...pris });
      const k = unite > 0 ? Math.min(n, Math.floor((capacite - poids + 1e-9) / unite)) : n;
      if (k > 0) {
        pris[type] = k;
        poids += unite * k;
      }
    }
    // Rien n'y entre, pas même le plus léger : c'est de lui qu'on dit le poids.
    if (Object.keys(pris).length === 0) {
      const plusLeger = entrees.map(([t]) => t).sort((a, b) => OBJETS[typeDe(a)].poids - OBJETS[typeDe(b)].poids)[0];
      return this.sacTropLourd(plusLeger ? { [plusLeger]: 1 } : undefined);
    }
    this.commencer("Ramasser", 1.5, () => {
      const encore = this.sacsIci().find((s) => s.id === tas.id);
      if (!encore) return;
      const reste: Inventaire = { ...encore.contenu.inventaire };
      const chargesReste = { ...encore.contenu.charges };
      const chargesPrises: Charges = {};
      for (const [type, k] of Object.entries(pris) as [TypeObjet, number][]) {
        const avant = reste[type] ?? 0;
        const b = type as TypeBatterie;
        if (BATTERIES.includes(b) && avant > 0) {
          chargesPrises[b] = ((chargesReste[b] ?? 0) * k) / avant;
          chargesReste[b] = (chargesReste[b] ?? 0) - chargesPrises[b]!;
        }
        if (avant - k > 0) reste[type] = avant - k;
        else delete reste[type];
      }
      this.ajouterPlusieurs(pris);
      for (const [b, wh] of Object.entries(chargesPrises) as [TypeBatterie, number][]) this.ajouterCharge(b, wh);
      this.remplacerSac(encore, Object.keys(reste).length ? { ...encore.contenu, inventaire: reste, charges: chargesReste } : null);
      const manque = Object.keys(reste).length > 0;
      this.info(manque ? "Tu as pris ce que tu pouvais porter ; le reste est resté par terre." : "Ramassé.");
    }, 0, "leger");
  }

  /** Remplace un sac ou un tas au sol par un autre contenu (ou le retire), et prévient ceux qui le voient. */
  private remplacerSac(sac: SacPose, contenu: SacPose["contenu"] | null): void {
    if (this.vivant) this.vivant.retirerSac(sac.id);
    else {
      this.sacsTerrain = this.sacsTerrain.filter((s) => s.id !== sac.id);
      this.base.retirerSac(sac.id);
    }
    if (contenu) {
      const nouveau = this.base.poserSac({ ...sac, contenu });
      if (this.vivant) this.vivant.poserSac(nouveau);
      else this.sacsTerrain.push(nouveau);
    }
    if (!this.vivant) this.envoyer({ t: "sacs", sacs: this.sacsVus() });
  }

  /** Jeter un objet par terre (quand le sac est trop lourd) : il reste là, ramassable (Book 01 §8). */
  private jeter(objet: CleObjet, quantite: number): void {
    if (this.voyage || !estCleObjet(objet)) return;
    const n = Math.floor(Number(quantite));
    if (!(n >= 1) || (this.inventaire[objet] ?? 0) < n) return;
    if (this.lieu === "comptoir") return this.info("Pas ici : les Compteurs n'aiment pas le désordre. Va au guichet, ou range-le chez toi.");
    if (objet === "sac_a_dos" || objet === "sac_fortune") return this.info("Ton sac, tu le gardes sur le dos.");
    const charges = this.chargesQuiPartent({ [objet]: n });
    this.charges = Object.fromEntries(BATTERIES.map((b) => [b, Math.max(0, (this.charges[b] ?? 0) - (charges[b] ?? 0))])) as Charges;
    this.retirerPlusieurs({ [objet]: n });
    this.bornerCharges();
    this.verifierLumiere();
    this.poserAuSol({ [objet]: n }, charges);
    this.info(`Tu as posé ${nommer(objet, n)} par terre.`);
  }

  /** Pose des objets par terre, en petit tas ramassable par tous (ajoutés au tas tout proche, s'il y en a un à soi). */
  private poserAuSol(objets: Inventaire, charges: Charges = {}, ou?: { x: number; z: number }): void {
    // Un tas à moi tout près : on y ajoute (pas une pile de petits tas).
    const tas = ou ? undefined : this.sacsIci().find((s) => s.contenu.jete && s.proprietaire === this.compte.id && this.proche(s.x, s.z, 1.2));
    if (tas) {
      const inventaire = { ...tas.contenu.inventaire };
      for (const [t, k] of Object.entries(objets) as [TypeObjet, number][]) inventaire[t] = (inventaire[t] ?? 0) + k;
      const total = { ...tas.contenu.charges };
      for (const [b, wh] of Object.entries(charges) as [TypeBatterie, number][]) total[b] = (total[b] ?? 0) + wh;
      this.remplacerSac(tas, { ...tas.contenu, inventaire, charges: total });
      return;
    }
    const sac = this.base.poserSac({
      lieu: estHalte(this.lieu) || estPersonnel(this.lieu) ? this.lieu : "terrain",
      terrainDe: estHalte(this.lieu) ? 0 : this.compte.id,
      proprietaire: this.compte.id,
      x: ou ? ou.x : this.position.x + Math.sin(this.position.o) * 0.6,
      z: ou ? ou.z : this.position.z + Math.cos(this.position.o) * 0.6,
      contenu: { inventaire: { ...objets }, charges, jete: true },
      creeLe: this.maintenant(),
    });
    if (this.vivant) this.vivant.poserSac(sac);
    else {
      this.sacsTerrain.push(sac);
      this.envoyer({ t: "sacs", sacs: this.sacsVus() });
    }
  }

  /**
   * Le bric-à-brac d'une fouille (Vestiges, lot 1) : ce qui rentre dans le sac y va, un par un dans l'ordre du tirage ;
   * le reste tombe par terre, en petit tas. Le joueur voit ce qu'il a trouvé et doit choisir ce qu'il garde.
   */
  private recevoirBricABrac(trouve: Inventaire): void {
    const pris: Inventaire = {};
    const laisse: Inventaire = {};
    let poids = poidsInventaire(this.inventaire, this.gourde.litres);
    const capacite = capaciteDe(this.inventaire);
    for (const [t, k] of Object.entries(trouve) as [TypeObjet, number][]) {
      for (let i = 0; i < k; i++) {
        if (poids + OBJETS[t].poids <= capacite + 1e-9) {
          pris[t] = (pris[t] ?? 0) + 1;
          poids += OBJETS[t].poids;
        } else laisse[t] = (laisse[t] ?? 0) + 1;
      }
    }
    const liste = (inv: Inventaire) => (Object.entries(inv) as [TypeObjet, number][]).map(([t, k]) => `${nommer(t, k)} (${kgTexte(OBJETS[t].poids * k)})`).join(", ");
    if (Object.keys(pris).length) this.ajouterPlusieurs(pris);
    if (Object.keys(laisse).length) this.poserAuSol(laisse);
    // Deux messages courts plutôt qu'un long : chacun tient en deux lignes en haut de l'écran.
    if (Object.keys(pris).length) this.info(`Dans le fatras, tu trouves aussi : ${liste(pris)}.`);
    if (Object.keys(laisse).length) this.info(`Trop lourd, laissé par terre : ${liste(laisse)}. Fais de la place pour le prendre.`);
  }

  /** Démonter un vestige du sac en composants (Vestiges, lot 1 ; table DEMONTAGE). */
  private demonter(objet: TypeObjet): void {
    if (this.voyage || !estObjet(objet) || (this.inventaire[objet] ?? 0) < 1) return;
    const d = DEMONTAGE[objet];
    if (!d) return this.info(`${OBJETS[objet].nom[0]!.toUpperCase()}${OBJETS[objet].nom.slice(1)} : rien à en tirer en le démontant, pour l'instant.`);
    // Certains se démontent par lots (0.8.2 : trois canettes pour une chute d'aluminium).
    const par = d.par ?? 1;
    if ((this.inventaire[objet] ?? 0) < par) return this.info(`Il en faut ${par} pour en tirer quelque chose : ${nommer(objet, par)}.`);
    const facteur = multiplicateurQualites(this.outils(), d.qualites);
    if (facteur === null) return this.infos(outilsManquantsBref(d.qualites, this.outils(), undefined, this.recetteVisible));
    // Le poids d'après : le démontage laisse le rebut sur place, mais une pyramide de rouleaux pèse toujours son poids.
    const apres: Inventaire = { ...this.inventaire, [objet]: (this.inventaire[objet] ?? 0) - par };
    for (const [t, k] of Object.entries(d.donne) as [TypeObjet, number][]) apres[t] = (apres[t] ?? 0) + k;
    if (poidsInventaire(apres) > capaciteDe(apres) + 1e-9) return this.sacTropLourd();
    // Les bacs de tri à 3 m (plan 0.10, chantier D ; S-23) : deux fois plus vite, une matière de plus un démontage sur trois.
    this.commencer(`Démonter : ${OBJETS[objet].nom}`, (d.duree * facteur) / REGLAGES.gestes_vitesse / this.meublesNeufs.vitesseDemontage(), () => {
      if ((this.inventaire[objet] ?? 0) < par) return;
      this.retirerPlusieurs({ [objet]: par });
      const enPlus = this.meublesNeufs.matiereEnPlus(d.donne);
      this.ajouterPlusieurs(somme(d.donne, enPlus));
      if (Object.keys(enPlus).length) this.info(`Aux bacs de tri, rien ne se perd : une matière de plus (${(Object.entries(enPlus) as [TypeObjet, number][]).map(([t, k]) => nommer(t, k)).join(", ")}).`);
      this.verifierLumiere();
      this.noterFait(`demonte:${objet}`);
      this.mesurer("progression", `demontage:${objet}`, 1);
      this.info(`Démonté : ${par > 1 ? nommer(objet, par) : OBJETS[objet].nom}. Tu en tires ${(Object.entries(d.donne) as [TypeObjet, number][]).map(([t, k]) => nommer(t, k)).join(", ")}.`);
    }, 0, d.qualites.marteler ? "lourd" : "outil");
  }

  // ---------- Le savoir des autres familles (Book 25 §2.3) : la leçon (lecon.ts) et les manuels ----------

  /** Lire un manuel du sac : il ouvre les recettes de sa famille. Le livre reste dans le sac. */
  private lire(objet: TypeObjet): void {
    if (this.voyage || !estManuel(objet) || (this.inventaire[objet] ?? 0) < 1) return;
    const essai = lireManuel(this.savoir, this.compte.famille, objet);
    if ("refus" in essai) return this.info(essai.refus);
    this.commencer(`Lire : ${OBJETS[objet].nom}`, 8 / REGLAGES.gestes_vitesse, () => {
      const r = lireManuel(this.savoir, this.compte.famille, objet);
      if ((this.inventaire[objet] ?? 0) < 1 || "refus" in r) return;
      this.majSavoir(r.savoir, `lu:${objet}`);
      this.info(r.message);
    }, 0, "leger");
  }

  /** Le savoir a changé (leçon, manuel) : on le garde, on le dit au client, on le compte. */
  majSavoir(savoir: Savoir, fait?: string): void {
    this.savoir = savoir;
    this.base.sauverSavoir(this.compte.id, savoir);
    this.envoyer({ t: "savoir", savoir: this.vueSavoir() });
    // La leçon et le manuel dévoilent ce qu'ils apprennent (§3.3).
    this.devoilement.aRevoir();
    if (fait) {
      this.noterFait(fait);
      this.mesurer("progression", `savoir:${fait}`, 1);
    }
  }

  /** Sans plus rien pour l'éclairer, la lumière s'éteint. */
  private verifierLumiere(): void {
    if (this.lumiere && !lumierePortee(this.inventaire)) {
      this.lumiere = false;
      this.envoyer({ t: "lumiere", allumee: false });
    }
  }

  /** Ranger un objet dans un coffre de son terrain, ou l'en sortir (la charge des batteries suit). */
  private utiliserCoffre(id: number, sens: "deposer" | "prendre", objet: CleObjet, quantite: number): void {
    const coffre = this.installations.get(id);
    // La décharge (P-001) s'ouvre comme un coffre, mais on ne fait qu'y prendre.
    const estDecharge = coffre?.type === "decharge";
    // Le râtelier à outils (plan 0.8, chantier 6) se remplit comme un coffre, d'outils seulement.
    const ratelier = coffre?.type === "ratelier_outils";
    if (!coffre || (coffre.type !== "coffre" && !estDecharge && !ratelier) || this.lieu !== "terrain" || this.voyage || !estCleObjet(objet)) return;
    if (ratelier && sens === "deposer" && refusRatelier(objet)) return this.info(refusRatelier(objet)!);
    if (estDecharge && sens === "deposer") return this.info("La décharge rend, elle ne reprend pas. Pour te débarrasser d'un objet : Sac → Jeter.");
    if (!this.proche(coffre.x, coffre.z, estDecharge ? 4.2 : 2.5)) return this.info(estDecharge ? "Approche-toi de la décharge." : ratelier ? "Approche-toi du râtelier." : "Approche-toi du coffre.");
    const n = Math.floor(Number(quantite));
    if (!(n >= 1)) return;
    const contenu: Inventaire = { ...(coffre.etat.contenu ?? {}) };
    const charges: Charges = { ...(coffre.etat.charges ?? {}) };
    const b = objet as TypeBatterie;
    const batterie = BATTERIES.includes(b);
    if (sens === "deposer") {
      if ((this.inventaire[objet] ?? 0) < n) return;
      if (objet === "sac_a_dos" || objet === "sac_fortune") return this.info("Ton sac, tu le gardes sur le dos.");
      const max = ratelier ? Infinity : capaciteCoffre(coffre);
      if (poidsInventaire(contenu) + OBJETS[typeDe(objet)].poids * n > max + 1e-9) {
        return this.info(`Le coffre est plein (${max} kg) : ${etapeSuivanteInstallation(coffre) ? "améliore-le (il tiendra plus)" : "construis-en un autre"}, ou vends le surplus au Comptoir.`);
      }
      if (batterie) {
        const part = this.chargesQuiPartent({ [objet]: n })[b] ?? 0;
        this.charges = { ...this.charges, [b]: Math.max(0, (this.charges[b] ?? 0) - part) };
        charges[b] = (charges[b] ?? 0) + part;
      }
      this.retirerPlusieurs({ [objet]: n });
      this.bornerCharges();
      this.verifierLumiere();
      contenu[objet] = (contenu[objet] ?? 0) + n;
    } else {
      const dispo = contenu[objet] ?? 0;
      if (dispo < n) return;
      if (poidsInventaire(this.inventaire, this.gourde.litres) + OBJETS[typeDe(objet)].poids * n > capaciteDe(this.inventaire) + 1e-9) return this.sacTropLourd({ [objet]: n });
      let part = 0;
      if (batterie) {
        part = ((charges[b] ?? 0) * n) / dispo;
        charges[b] = Math.max(0, (charges[b] ?? 0) - part);
      }
      if (dispo - n > 0) contenu[objet] = dispo - n;
      else delete contenu[objet];
      this.ajouterPlusieurs({ [objet]: n });
      if (part > 0) this.ajouterCharge(b, part);
    }
    coffre.etat = { ...coffre.etat, contenu, charges };
    this.base.sauverEtatInstallation(this.compte.id, coffre.id, coffre.etat);
    this.envoyer({ t: "installation", installation: coffre });
  }

  /** Reprendre son sac (en É4, on pourra aussi piller celui des autres à la halte). */
  private reprendreSac(id: number): void {
    const liste = this.vivant ? this.vivant.sacs : this.sacsTerrain;
    const sac = liste.find((s) => s.id === id);
    if (!sac) return;
    if (!this.proche(sac.x, sac.z)) return this.info("C'est trop loin.");
    if (sac.contenu.jete) return this.ramasserTas(sac);
    if (sac.proprietaire !== this.compte.id) return this.info("Ce n'est pas ton sac.");
    this.commencer("Reprendre ton sac", 3, () => {
      const encore = (this.vivant ? this.vivant.sacs : this.sacsTerrain).some((s) => s.id === id);
      if (!encore) return;
      this.ajouterPlusieurs(sac.contenu.inventaire);
      if (sac.contenu.wotts) {
        this.poche = ajouterWotts(this.poche, sac.contenu.wotts, this.maintenant());
        this.envoyerWotts();
      }
      for (const [b, wh] of Object.entries(sac.contenu.charges) as [TypeBatterie, number][]) this.ajouterCharge(b, wh);
      if (this.vivant) this.vivant.retirerSac(id);
      else {
        this.sacsTerrain = this.sacsTerrain.filter((s) => s.id !== id);
        this.base.retirerSac(id);
        this.envoyer({ t: "sacs", sacs: this.sacsVus() });
      }
    }, 0, "leger");
  }

  // ---------- Lieux et voyages (É3) ----------

  private ressourcesIci(): Map<number, RessourceEnBase> {
    if (this.lieu === "comptoir") return SANS_RESSOURCES;
    return this.vivant ? this.vivant.ressources : this.ressources;
  }

  get enVoyage(): boolean {
    return this.voyage !== null;
  }

  /** Prendre la route depuis une sortie : le trajet coûte des calories et de l'eau (Book 01 §2 bis). */
  private voyager(vers: LieuId): void {
    if (this.voyage) return;
    // Chez soi, on part de n'importe où sur le terrain (0.8.4) ; ailleurs, depuis une sortie. Jamais quand on est tenu.
    const sortie = sortiePourPartir(this.lieu, this.position.x, this.position.z);
    if (this.saisisseurs().length > 0) return this.info("Il te tient : dégage-toi d'abord.");
    // Du terrain au Carrefour, la route passe par la halte : on s'y arrête, il faut la traverser (Book 01 §2 bis).
    const etape = etapeVers(this.lieu, vers);
    if (!sortie || !destinations(sortie).includes(etape)) return this.info("Pour prendre la route, va jusqu'à la sortie.");
    if (this.objetPorte()) return this.info("Pose d'abord l'escabeau : il reste sur ton terrain.");
    if (!LIEUX[etape].ouvert) return this.info(`${LIEUX[etape].nom} n'a pas encore ouvert ses portes.`);
    if (etape !== vers) this.info(`La route ${deLieu(vers)} passe par ${minuscule(LIEUX[etape].nom)} : il faudra ${traverserLieu(etape)} à pied.`);
    vers = etape;
    this.annulerAction();
    this.tir.quitterLieu();
    // La radio ne capte la Compagnie qu'au Plateau (0.5.1) : on la pose au portail en partant.
    if (this.lieu === "cooperative" && (this.inventaire.radio_piles ?? 0) > 0) {
      this.poserRadio();
      this.info("Tu poses la radio au pied du portail : loin du Plateau, elle ne capterait plus la Compagnie.");
    }
    this.lumiere = false;
    const km = distanceKm(this.lieu, vers);
    this.besoins = { ...this.besoins, kcal: Math.max(0, this.besoins.kcal - km * KCAL_PAR_KM), eau: Math.max(0, this.besoins.eau - km * EAU_PAR_KM) };
    this.intention = INTENTION_REPOS;
    const de = this.lieu;
    // Plan 0.8 §2.6 : au départ de chez soi, le carnet nomme les portes ouvertes (« Une vraie cuisine : il te faut une grille »).
    const portes = de === "terrain" && !this.tuto ? phraseDuDepart(this.quetes.enCours(this.compte.famille)) : null;
    if (portes) this.info(portes);
    this.voyage = { de, vers, arrivee: this.maintenant() + DUREE_VOYAGE_S * 1000 };
    this.mesurer("activite", "expédition", DUREE_VOYAGE_S, { vers });
    if (de === "comptoir") this.comptoir.sortir(this.envoyer);
    this.lieux.vivant(de, this.compte.id)?.sortir(this);
    // Les Éteints du terrain ne suivent pas : il n'y a pas de siège en son absence.
    this.eteints = [];
    // On enregistre tout de suite la destination : une déconnexion en route fait arriver à bon port.
    this.base.sauverPosition(this.compte.id, arriveeDans(vers, de), vers, this.maintenant());
    this.base.sauverEtat(this.compte.id, this.besoins, this.gourde);
    this.envoyerBesoins();
    this.envoyer({ t: "voyage", de, vers, duree: DUREE_VOYAGE_S });
  }

  /** `ou` : un point d'arrivée choisi (l'admin qui va chez lui arrive au camp) ; sinon, l'entrée du lieu. */
  private arriver(voyage: Voyage, ou?: Position): void {
    this.voyage = null;
    this.lieu = voyage.vers;
    this.position = ou ?? arriveeDans(voyage.vers, voyage.de);
    this.vivant?.entrer(this);
    if (this.lieu === "cooperative") this.cooperatives.retrouverRadio(this.compte.id, (this.inventaire.radio_piles ?? 0) > 0);
    if (this.lieu === "comptoir") this.comptoir.entrer(this.envoyer, () => this.quetes.etat.faits);
    if (this.tuto && this.lieu === "station") this.tuto.visiteStation = true;
    this.noterFait(`visite:${this.lieu}`);
    // 0.8.2, chantier G : la vue d'ensemble ; seul, le monde attend le premier geste (serveur/src/arrivee.ts).
    const arrivee = this.arrivee.commencer(this.lieu, this.maintenant());
    if (arrivee.mode === "pause") this.pause = true;
    this.envoyer({ ...this.bienvenue(this.base.debutMonde()), arrivee });
  }

  /** Le joueur se déconnecte : il quitte la halte (hors ligne, il est sur la carte, Book 01 §2 bis). */
  partir(): void {
    this.dechets.partir();
    this.lieux.sortirDesHaltes(this);
    if (estPersonnel(this.lieu)) this.lieux.vivant(this.lieu, this.compte.id)?.sortir(this);
    this.comptoir.sortir(this.envoyer);
  }

  // ---------- Les quêtes après le tutoriel (Book 22) ----------

  private pourQuetes(): EtatJoueurPourQuetes {
    return { famille: this.compte.famille, inventaire: this.inventaire, charges: this.charges, installations: this.installations.values() };
  }

  /** Le carnet des quêtes (null pendant le tutoriel : il a son propre carnet). */
  private vueQuetes(): VueQuetes | null {
    return this.tuto ? null : this.quetes.vue(this.pourQuetes());
  }

  /** Un fait pour les quêtes (un repas, une vente, un échange…), compté même pendant le tutoriel. */
  private noterFait(fait: string, n = 1): void {
    // Plan 0.8 (chantier 14) : les faits du niveau 1 qui se mesurent (serveur/src/mesures.ts), avant d'être comptés.
    this.mesurerLesFaits(mesuresDuFait(fait, this.quetes.etat.faits, (this.devoilement?.etat.secondes ?? 0) / 60));
    if (this.quetes.noter(fait, n)) this.quetesASauver = true;
    // Un fait de plus peut faire penser à une recette : on réévaluera au prochain passage (pas de calcul continu).
    this.devoilement?.aRevoir();
  }

  /** Écrire les mesures d'un fait, et noter les faits qui les gardent d'être écrites deux fois (`atteint:<étape>`). */
  private mesurerLesFaits(r: { mesures: MesureDuFait[]; faits: string[] }): void {
    for (const m of r.mesures) this.mesurer("progression", m.quoi, m.valeur, m.details);
    for (const f of r.faits) if (this.quetes.noter(f)) this.quetesASauver = true;
  }

  private verifierQuetes(instant: number): void {
    if (this.tuto || instant - this.derniereVerifQuetes < 500) return;
    this.derniereVerifQuetes = instant;
    const j = this.pourQuetes();
    const reussies = this.quetes.verifier(j);
    for (const q of reussies) {
      this.recompenser(q);
      this.mesurer("progression", `quete:${q.id}`, 1);
    }
    if (this.quetes.etat.primes > 0) this.verserPrimes();
    const vue = this.quetes.vue(j, reussies);
    const cle = JSON.stringify(vue.quetes);
    if (reussies.length > 0 || cle !== this.derniereVueQuetes) {
      this.derniereVueQuetes = cle;
      this.envoyer({ t: "quetes", quetes: vue });
    }
    if (reussies.length > 0) {
      this.quetesASauver = false;
      this.base.sauverQuetes(this.compte.id, this.quetes.etat);
    }
  }

  /** La récompense d'une quête : des objets tout de suite, des wotts sur le compte (prime des Compteurs). */
  private recompenser(q: Quete): void {
    const r = q.recompense;
    if (!r) return;
    if (r.objets) this.ajouterPlusieurs(r.objets);
    if (r.wotts) {
      this.quetes.etat.primes += r.wotts;
      this.verserPrimes();
    }
  }

  /** Les Compteurs versent les primes sur leur trésorerie ; vide, la prime attend (Book 22 §1). */
  private verserPrimes(): void {
    const primes = this.quetes.etat.primes;
    if (!(primes > 0) || !this.comptoir.payer(primes)) return;
    this.quetes.etat.primes = 0;
    this.compteWotts = ajouterWotts(this.compteWotts, primes, this.maintenant());
    this.quetesASauver = true;
    this.envoyerWotts();
  }

  // ---------- Le tutoriel (É5, Book 14 §4.2) ----------

  private vueTutoriel(lecon?: string, repas: string[] = []): VueTutoriel | null {
    if (!this.tuto) return null;
    const etapes = etapesTutoriel(this.compte.famille);
    const e = etapes[Math.min(this.tuto.etape, NOMBRE_ETAPES - 1)]!;
    const progres = this.progresTutoriel();
    return { etape: this.tuto.etape, total: NOMBRE_ETAPES, titre: e.titre, consigne: e.consigne, lecon, ...(repas.length ? { repas } : {}), termine: this.tuto.etape >= NOMBRE_ETAPES, ...(progres.length ? { progres } : {}) };
  }

  /**
   * Le repas du tutoriel (0.8.2) : au sac ce qui y tient, comme le bric-à-brac d'une fouille ; le reste tombe par terre,
   * à ses pieds (les récompenses de quête, elles, entrent au sac quoi qu'il pèse).
   */
  private recevoirRepasDuTutoriel(objets: Inventaire): void {
    const pris: Inventaire = {};
    const laisse: Inventaire = {};
    let poids = poidsInventaire(this.inventaire, this.gourde.litres);
    const capacite = capaciteDe(this.inventaire);
    for (const [t, k] of Object.entries(objets) as [TypeObjet, number][]) {
      for (let i = 0; i < k; i++) {
        if (poids + OBJETS[t].poids <= capacite + 1e-9) {
          pris[t] = (pris[t] ?? 0) + 1;
          poids += OBJETS[t].poids;
        } else laisse[t] = (laisse[t] ?? 0) + 1;
      }
    }
    if (Object.keys(pris).length) this.ajouterPlusieurs(pris);
    if (Object.keys(laisse).length) {
      this.poserAuSol(laisse);
      this.info(`Ton sac est plein : ${(Object.entries(laisse) as [TypeObjet, number][]).map(([t, k]) => nommer(t, k)).join(", ")}, posé par terre.`);
    }
  }

  /** Ce que regarde la fin du tutoriel (serveur/src/tutoriel-fin.ts). */
  private pourFinDuTutoriel(): PourFinDuTutoriel {
    return { famille: this.compte.famille, lieu: this.lieu, inventaire: this.inventaire, installations: this.installations.values(), visiteStation: this.tuto?.visiteStation ?? false };
  }

  /** Les compteurs de l'étape en cours (2026-10-08) : on voit où on en est sans compter soi-même. */
  private progresTutoriel(): { libelle: string; fait: number; but: number }[] {
    const t = this.tuto!;
    switch (t.etape) {
      case 0:
        return [
          { libelle: "Mètres", fait: Math.min(12, Math.floor(t.marche)), but: 12 },
          { libelle: "Allures", fait: ["discrete", "marche", "course"].filter((a) => t.allures.includes(a)).length, but: 3 },
        ];
      case 1:
        return [
          { libelle: "Branches", fait: Math.min(3, t.branches), but: 3 },
          { libelle: "Pierres", fait: Math.min(5, t.pierres), but: 5 },
        ];
      case ETAPE_CARTE:
        return progresCarte(this.pourFinDuTutoriel());
      case ETAPE_FAMILLE:
        return progresFamille(this.pourFinDuTutoriel());
      default:
        return [];
    }
  }

  /** L'étape en cours est-elle réussie ? (d'après ce que le joueur a vraiment fait) */
  private etapeReussie(etape: number): boolean {
    const t = this.tuto!;
    // Plan 0.8, chantier 13 : la carte (la station, sa pièce rapportée), puis la famille (le meuble, la pièce posée dessus).
    const etapes = etapesReussies(this.pourFinDuTutoriel());
    switch (etape) {
      case 0:
        return t.marche >= 12 && t.allures.includes("course") && t.allures.includes("discrete");
      case 1:
        return t.branches >= 3 && t.pierres >= 5;
      case 2:
        return [...this.feux.values()].some((f) => f.allume);
      case 3:
        return t.bouilli;
      case 4:
        return [...this.ressources.values()].some((r) => r.type === "velo" && r.disponibleLe > 0);
      case 5:
        return (this.inventaire.hache ?? 0) > 0;
      case 6:
        return [...this.installations.values()].some((i) => i.type === "abri");
      case 7:
        return t.premierEteintDetruit;
      case 8:
        return t.degage;
      case ETAPE_CARTE:
        return etapes.carte;
      case ETAPE_FAMILLE:
        return etapes.famille;
      case ETAPE_NUIT:
        return t.dormiAbri;
      default:
        return false;
    }
  }

  private verifierTutoriel(instant: number): void {
    if (!this.tuto || instant - this.derniereVerifTuto < 500) return;
    this.derniereVerifTuto = instant;
    const etapes = etapesTutoriel(this.compte.famille);
    let lecon: string | undefined;
    const repas: string[] = [];
    while (this.tuto.etape < NOMBRE_ETAPES && this.etapeReussie(this.tuto.etape)) {
      lecon = etapes[this.tuto.etape]!.lecon;
      // 0.8.2 : le repas du tutoriel, une fois, à l'étape réussie (l'étape avance et se sauve dans le même tour).
      const r = REPAS_DU_TUTORIEL[this.tuto.etape];
      if (r) {
        this.recevoirRepasDuTutoriel(r.objets);
        repas.push(r.texte);
      }
      this.tuto.etape++;
      this.mesurer("progression", `tutoriel:${this.tuto.etape}`, 1);
    }
    // Un compteur a bougé (une branche, une pierre de plus) : le carnet suit.
    const progres = lecon === undefined && this.tuto.etape < NOMBRE_ETAPES ? JSON.stringify(this.progresTutoriel()) : "";
    if (progres && progres !== this.dernierProgresTuto) {
      this.dernierProgresTuto = progres;
      this.envoyer({ t: "tutoriel", tutoriel: this.vueTutoriel() });
    }
    if (lecon !== undefined) {
      const fini = this.tuto.etape >= NOMBRE_ETAPES;
      this.base.sauverTutoriel(this.compte.id, fini ? null : this.tuto);
      this.envoyer({ t: "tutoriel", tutoriel: this.vueTutoriel(lecon, repas) });
      // Les compteurs de la nouvelle étape partent avec la leçon : pas besoin de les renvoyer tout de suite.
      if (!fini) this.dernierProgresTuto = JSON.stringify(this.progresTutoriel());
      if (fini) {
        this.tuto = null;
        this.noterFait("tutoriel_fini");
        return;
      }
    }
    // Les deux Éteints mis en scène arrivent au bon moment (Book 14 §4.2, étapes 8 et 9).
    if (this.lieu === "terrain" && !this.voyage) {
      const enScene = this.eteints.some((e) => e.tuto && e.etat !== "detruit");
      if (this.tuto.etape === ETAPE_PREMIER_ETEINT && !enScene) this.amenerEteintDuTutoriel(false);
      // Un seul à la fois (0.8.4) : s'il a lâché sans qu'on se dégage, il revient saisir ; on n'en fait pas surgir un autre.
      if (this.tuto.etape === ETAPE_SAISIE && !this.tuto.degage && !enScene) this.amenerEteintDuTutoriel(true);
    }
  }

  /** Le premier Éteint sort de la lisière, attiré par la fumée ; le second surgit dans le dos et saisit (sans mordre). */
  private amenerEteintDuTutoriel(saisit: boolean): void {
    if (saisit) {
      const x = this.position.x - Math.sin(this.position.o) * 0.8;
      const z = this.position.z - Math.cos(this.position.o) * 0.8;
      const e = nouvelEteint(this.prochainIdEteint++, x, z, "poursuivant", this.position.o);
      e.tuto = true;
      e.saisit = this.compte.id;
      e.attention = 3;
      this.eteints.push(e);
      return;
    }
    const feu = [...this.feux.values()].find((f) => f.allume) ?? { x: this.position.x, z: this.position.z };
    const x = Math.min(TERRAIN_TAILLE - 2, Math.max(2, feu.x + 6));
    const e = nouvelEteint(this.prochainIdEteint++, x, 1, "attire", Math.PI);
    e.tuto = true;
    e.attention = 2;
    e.but = { x: feu.x, z: feu.z };
    this.eteints.push(e);
  }

  // ---------- Le sommeil (É5, Book 05 §3) ----------

  private endormir(dansUnAbri: boolean, surUnLit = false, confort = 1): void {
    if (this.sommeil || this.voyage) return;
    if (this.besoins.repos >= 0.97) return this.info("Tu n'as pas sommeil : reviens quand la jauge de sommeil aura baissé.");
    if (this.saisisseurs().length > 0) return;
    this.annulerAction();
    this.intention = INTENTION_REPOS;
    this.sommeil = { dansUnAbri, surUnLit, confort };
    this.geste({ geste: "couche" });
    this.endormiDepuis = this.maintenant();
    if (this.tuto && dansUnAbri) this.tuto.dormiAbri = true;
    this.lumiere = false;
    this.envoyer({ t: "lumiere", allumee: false });
    this.envoyer({ t: "sommeil", dort: true, dansUnAbri });
  }

  /** Le trajet jusqu'à la couche de l'abri, en cours (0.8.2, R12) : on y dormira à l'arrivée. */
  private versLaCouche: TrajetCouche | null = null;

  /** Dormir dans l'abri : d'abord se rendre accroupi jusqu'à sa couche (commun/src/sommeil-abri.ts). */
  private allerALaCouche(abri: AbriPose, surUnLit: boolean, confort: number): void {
    if (this.sommeil || this.voyage || this.versLaCouche) return;
    if (this.besoins.repos >= 0.97) return this.info("Tu n'as pas sommeil : reviens quand la jauge de sommeil aura baissé.");
    if (this.saisisseurs().length > 0) return;
    this.annulerAction();
    this.intention = INTENTION_REPOS;
    this.versLaCouche = trajetCouche(abri, this.position, surUnLit, confort);
    this.envoyer({ t: "vers_couche", chemin: this.versLaCouche.chemin, o: this.versLaCouche.o });
  }

  private suivreVersLaCouche(dt: number, bouge: boolean): void {
    const t = this.versLaCouche!;
    if (bouge || this.voyage || this.saisisseurs().length > 0) {
      this.versLaCouche = null;
      this.envoyer({ t: "vers_couche", chemin: null, o: t.o });
      return;
    }
    const pas = pasVersLaCouche(t, this.position, dt);
    this.position = pas.position;
    this.positionEnvoyee = false;
    if (!pas.arrive) return;
    this.versLaCouche = null;
    this.endormir(true, t.surUnLit, t.confort);
  }

  private reveiller(message: string): void {
    if (!this.sommeil) return;
    // Une vraie nuit (abri ou lit, une demi-minute au moins) : elle fait penser au bâton à fouir, au coffre…
    if ((this.sommeil.dansUnAbri || this.sommeil.surUnLit) && this.maintenant() - this.endormiDepuis >= 30_000) this.noterFait("nuit");
    this.sommeil = null;
    this.geste({ geste: "releve" });
    this.mesurer("activite", "sommeil", (this.maintenant() - this.endormiDepuis) / 1000);
    this.envoyer({ t: "sommeil", dort: false, dansUnAbri: false });
    this.envoyerBesoins();
    if (message) this.info(message);
  }

  // ---------- Signature et Éteints (É3, lot 2) ----------

  private nuit(): boolean {
    return estNuit(heureDeJeu(this.maintenant(), this.debutMonde));
  }

  /** Ce que le joueur émet : ses pas, son action, sa lumière la nuit (Book 06 §3). */
  stimuli(nuit: boolean): Stimulus[] {
    const portee = this.lumiere ? lumierePortee(this.inventaire) : null;
    const porte = this.bruitPorte && this.maintenant() < this.bruitPorte.jusqua ? this.bruitPorte : null;
    const bruitPorte: Stimulus[] = porte ? [{ genre: "son", x: porte.x, z: porte.z, portee: porte.portee, intensite: 1 }] : [];
    const emis = this.sousLaPluie([...bruitPorte, ...this.tir.stimuli(), ...stimuliJoueur({
      x: this.position.x,
      z: this.position.z,
      allure: this.allureEffective(),
      bouge: this.bouge,
      action: this.maintenant() < this.bruitCoupJusqua ? "coup" : (this.action?.bruit ?? "aucun"),
      porteeCoup: this.porteeDuCoup,
      lumiere: portee ? (OBJETS[portee].lumiere ?? null) : null,
      // Dans une pièce noire de la Coopérative, une lampe se voit comme en pleine nuit (Book 23 §2.2).
      nuit: nuit || (this.vivant?.obscur(this.position.x, this.position.z) ?? false),
      saigne: this.sante.saignement !== "aucun",
    })]);
    // Sur le radier du gué, le bruit de l'eau couvre les pas (G1, plan 0.8 chantier 11).
    return this.lieu === "gue" ? this.gue.assourdir(emis, this.position) : emis;
  }

  /**
   * L'allure qu'on a vraiment : épuisé, on ne court plus. Le bruit des pas en dépend, comme le cercle que le client
   * dessine (il fait le même calcul) : à bout de souffle, on ne fait pas le bruit d'une course.
   */
  private allureEffective(): Allure {
    const allure = allureAutorisee(this.intention.allure, this.besoins, this.objetPorte() !== undefined || this.brasDuLieu() !== null || traineTravois(this.inventaire));
    // Sur le radier du gué, on marche, on n'y court pas (plan 0.8, Q-0.8-22).
    if (allure === "course" && this.lieu === "gue" && this.gue.pasDeCourse(this.position)) return "marche";
    return allure === "course" && this.endurance < SEUIL_EPUISE ? "marche" : allure;
  }

  /** La zone où l'on se déplace ici : celle du lieu vivant (avec ses portes fermées), ou celle du lieu. */
  private zoneIci(): Zone {
    return this.vivant?.zone ?? zoneDe(this.lieu);
  }

  /**
   * Ouvrir ou refermer une porte de la Coopérative (Book 23 §2.2). Refermer une porte derrière soi, c'est la meilleure
   * retraite : un Éteint ne la traverse pas. Ça fait un peu de bruit (beaucoup, pour une porte qui grince).
   */
  private actionnerPorte(id: string, ouvrir: boolean): void {
    // La grande porte du Moulin du Gué (plan 0.8, chantier 12 : serveur/src/moulin.ts).
    if (this.lieu === "moulin" && !this.voyage && !this.action) return this.porteDuMoulin(id, ouvrir);
    const vivant = this.vivant;
    const p = PORTES.find((q) => q.id === id);
    if (this.lieu !== "cooperative" || !vivant || !p || this.action) return;
    if (distancePorte(p, this.position.x, this.position.z) > PORTEE_PORTE + 0.5) return this.info("Approche-toi de la porte.");
    if (!ouvrir) {
      // On ne referme pas une porte sur quelqu'un : ni sur soi, ni sur un Éteint.
      const b = boitePorte(p);
      const coince = dansBoite(this.position.x, this.position.z, b, 0.4) || vivant.eteints.some((e) => e.etat !== "detruit" && dansBoite(e.x, e.z, b, 0.4));
      if (coince) return this.info("Quelque chose bloque la porte.");
    }
    if (!vivant.basculerPorte(id, ouvrir)) return;
    this.bruitPorte = { x: p.x, z: p.z, portee: p.bruyante ? 18 : 6, jusqua: this.maintenant() + 1500 };
  }

  /** La grande porte du Moulin : fermée à clé, elle le dit ; avec la grosse clé, elle s'ouvre, et la clé y reste. */
  private porteDuMoulin(id: string, ouvrir: boolean): void {
    const qui = { x: this.position.x, z: this.position.z, aLaCle: (this.inventaire.cle_moulin ?? 0) > 0, laisserLaCle: () => this.retirer("cle_moulin", 1) };
    const texte = this.moulins.actionnerPorte(this.compte.id, id, ouvrir, qui, this.maintenant());
    if (texte) this.info(texte);
  }

  /** La pluie est une alliée : bruits −30 %, odeurs −50 % (Book 06 §3.2, Book 13 §4). */
  private sousLaPluie(stimuli: Stimulus[]): Stimulus[] {
    const m = meteo(this.maintenant(), this.debutMonde);
    if (m.pluie <= 0) return stimuli;
    return stimuli.map((s) => ({ ...s, portee: s.portee * attenuationMeteo(m, s.genre) }));
  }

  /** Comment les Éteints le voient : à l'arrêt ou en allure discrète, il se fond dans le décor. */
  humain(): Humain {
    return {
      id: this.compte.id,
      x: this.position.x,
      z: this.position.z,
      discret: !this.bouge || this.intention.allure === "discrete",
      eclaire: this.lumiere && (this.nuit() || (this.vivant?.obscur(this.position.x, this.position.z) ?? false)),
      intouchable: this.maintenant() < this.esquiveJusqua || this.arrivee.protege(this.maintenant()),
    };
  }

  /** Un Noyé crève tout près (0.10, chantier G) : ses fluides, la nausée (30 s, l'endurance revient deux fois moins vite). */
  eclabousser(instant: number): void {
    this.sante = prendreLaNausee(this.sante, instant);
    this.info("Il crève, et ses fluides t'éclaboussent : la nausée te coupe le souffle.");
    this.envoyerSante(true);
  }

  /** Les sources fixes du terrain : feux allumés, charbonnière qui fume. */
  private sourcesTerrain(nuit: boolean): Stimulus[] {
    const s: Stimulus[] = [];
    const instant = this.maintenant();
    for (const f of this.feux.values()) {
      if (!f.allume || f.bois <= 0) continue;
      // Chaque niveau a ses multiplicateurs (Book 24 §3.1) : le Dakota fume peu, la flamme reste sous terre ; couvert, plus de flamme.
      const e = effetsFeu(f);
      const k = { odeur: e.odeur * (f.couvert ? FEU_COUVERT.odeur : 1), lumiere: e.lumiere * (f.couvert ? FEU_COUVERT.lumiere : 1) };
      s.push({ genre: "odeur", x: f.x, z: f.z, portee: FEU_ODEUR.portee * k.odeur, intensite: FEU_ODEUR.intensite });
      if (nuit && k.lumiere > 0) s.push({ genre: "lumiere", x: f.x, z: f.z, portee: FEU_LUMIERE_NUIT.portee * k.lumiere, intensite: FEU_LUMIERE_NUIT.intensite });
    }
    // Une alarme qui tinte se fait entendre (les Éteints proches aussi l'entendent).
    for (const [id, jusqua] of this.alarmesSonnent) {
      const a = this.installations.get(id);
      if (!a || instant >= jusqua) this.alarmesSonnent.delete(id);
      else s.push({ genre: "son", x: a.x, z: a.z, ...sonAlarme(a) });
    }
    for (const i of this.installations.values()) {
      if (i.type === "charbonniere" && i.etat.pretLe && instant < i.etat.pretLe) s.push({ genre: "odeur", x: i.x, z: i.z, ...CHARBONNIERE_ODEUR });
    }
    s.push(...stimuliTorches(this.installations.values(), instant, nuit));
    s.push(...stimuliRampes(this.installations.values(), nuit));
    return this.sousLaPluie(s);
  }

  /** Les alarmes à boîtes de conserve (P-002) : un Éteint qui passe tout près les fait tinter. On est prévenu. */
  private verifierAlarmes(instant: number): void {
    for (const a of this.installations.values()) {
      if (a.type !== "alarme_boites" || (this.alarmesSonnent.get(a.id) ?? 0) > instant - 20_000) continue;
      const passe = this.eteints.some((e) => debout(e) && Math.hypot(e.x - a.x, e.z - a.z) < 2.5);
      if (!passe) continue;
      this.alarmesSonnent.set(a.id, instant + 3000);
      // La cloche d'alarme (plan 0.10, chantier C) : elle s'entend à 40 m, et elle réveille le dormeur.
      const cloche = estClocheAlarme(a);
      this.envoyer({ t: "alarme", x: a.x, z: a.z, ...(cloche ? { cloche: true as const } : {}) });
      if (cloche && this.sommeil) this.reveiller("La cloche sonne ! Quelque chose passe près de ton fil.");
      else this.info(cloche ? "La cloche sonne ! Quelque chose passe près de ton fil." : "Les boîtes de conserve tintent ! Quelque chose passe près de ton alarme.");
    }
  }

  /** Les dernières prises des déclencheurs, par déclencheur et par Éteint (declencheurs.ts). */
  private readonly prisesDeclencheurs = new Map<string, number>();

  /**
   * Les pièges, la plaque de choc, la clôture (Book 25 §5.3 et §6.3) : le moteur des déclencheurs prend les Éteints
   * qui passent. Sans déclencheur enregistré sur le terrain, rien ne se passe.
   */
  private verifierDeclencheurs(instant: number): void {
    const poses: DeclencheurPose[] = [];
    for (const i of this.installations.values()) {
      if (!estDeclencheur(i.type)) continue;
      // L'état vit dans celui de l'installation (sauvé avec elle) : le moteur le modifie en place.
      const etat = (i.etat.declencheur ??= declencheurNeuf());
      poses.push({ id: i.id, type: i.type, x: i.x, z: i.z, o: i.o, etat });
    }
    if (poses.length === 0) return;
    const faits = declencher(poses, this.eteints, instant, zoneDe("terrain"), this.prisesDeclencheurs);
    for (const id of new Set(faits.map((f) => f.declencheur))) {
      const i = this.installations.get(id);
      if (!i) continue;
      this.base.sauverEtatInstallation(this.compte.id, i.id, i.etat);
      this.envoyer({ t: "installation", installation: i });
      const message = definitionDeclencheur(i.type)?.message;
      if (message) this.info(message);
    }
  }

  /** La vie des Éteints du terrain : ils arrivent de la lisière quand la signature les attire. */
  private animerEteintsTerrain(instant: number, dt: number): void {
    const nuit = this.nuit();
    const sources = this.sourcesTerrain(nuit);
    const stimuli = [...this.stimuli(nuit), ...sources];
    for (const e of this.eteints) penser(e, dt, stimuli, [this.humain()], this.eteints, nuit, zoneDe("terrain"), this.alea);
    this.eteints = this.eteints.filter((e) => e.etat !== "detruit" || e.corps < DUREE_CORPS);
    this.verifierAlarmes(instant);
    this.verifierDeclencheurs(instant);
    // L'arbalète de garde (plan 0.10, chantier D) : un carreau sur le premier Éteint qui passe son fil.
    for (const a of this.meublesNeufs.verifierArbaletes(this.installations.values(), this.eteints, zoneDe("terrain"))) {
      this.base.sauverEtatInstallation(this.compte.id, a.id, a.etat);
      this.envoyer({ t: "installation", installation: a });
    }

    if (instant - this.dernierTirage >= INTERVALLE_TIRAGE) {
      this.dernierTirage = instant;
      this.tirerApparition(instant, nuit, sources);
    }
    if (instant - this.dernierEnvoiEteints >= INTERVALLE_ETEINTS && (this.eteints.length > 0 || this.dernierEnvoiEteints > 0)) {
      this.dernierEnvoiEteints = this.eteints.length > 0 ? instant : 0;
      this.envoyer({ t: "eteints", eteints: this.eteints.map(vueEteint) });
    }
  }

  /**
   * Un Éteint arrive-t-il ? Seulement si quelque chose attire de loin : un feu, la charbonnière, une lumière la
   * nuit, un travail bruyant. Marcher sur son terrain n'attire personne (Book 06 §9.1 : un désagrément, pas un siège).
   */
  private tirerApparition(instant: number, nuit: boolean, sources: Stimulus[]): void {
    // Pendant le tutoriel, pas d'Éteint imprévu avant d'avoir appris à se battre et à se dégager.
    if (this.tuto && this.tuto.etape < ETAPE_CARTE) return;
    if (this.eteints.filter(debout).length >= REGLAGES.eteints_terrain_max || instant - this.derniereApparition < REGLAGES.eteints_repit_min * 60_000) return;
    const attirants = [...sources, ...this.stimuli(nuit).filter((s) => s.genre === "lumiere" || s.portee >= 18)];
    const attrait = attirants.reduce((somme, s) => somme + (s.intensite * s.portee) / 10, 0);
    const p = Math.min(0.35, 0.04 * attrait * (nuit ? 1.5 : 1) * REGLAGES.eteints_attirance);
    if (attrait === 0 || this.alea() >= p) return;
    const fort = attirants.reduce((a, b) => (b.intensite * b.portee > a.intensite * a.portee ? b : a));
    // Il sort de la lisière, au nord, à l'est ou à l'ouest (le sud est le chemin).
    const cote = Math.floor(this.alea() * 3);
    const t = 3 + this.alea() * (TERRAIN_TAILLE - 6);
    const [x, z] = cote === 0 ? [t, 1] : cote === 1 ? [TERRAIN_TAILLE - 1, t] : [1, t];
    const e = nouvelEteint(this.prochainIdEteint++, x, z, "attire", Math.atan2(fort.x - x, fort.z - z));
    e.attention = 1.5;
    e.but = { x: fort.x, z: fort.z };
    this.eteints.push(e);
    this.derniereApparition = instant;
  }

  // ---------- Pas de calcul ----------

  tick(dt: number): void {
    // En pause : rien ne bouge pour ce joueur (besoins, actions, Éteints de son terrain).
    if (this.pause) return;
    const instant = this.maintenant();
    const heures = dt / 60; // horloge d'action : 1 minute réelle = 1 heure de jeu

    if (this.voyage && instant >= this.voyage.arrivee) this.arriver(this.voyage);

    // Déplacement : bouger interrompt l'action en cours. En route, on ne bouge pas : on est sur la carte.
    if (this.voyage) this.intention = INTENTION_REPOS;
    const bouge = Math.hypot(this.intention.dx, this.intention.dz) > 0.01;
    if (this.versLaCouche) this.suivreVersLaCouche(dt, bouge);
    if (this.sommeil) {
      if (bouge || this.saisisseurs().length > 0) this.reveiller(bouge ? "" : "Réveillé en sursaut !");
      else {
        this.besoins = dormir(this.besoins, heures, this.sommeil.dansUnAbri, this.sommeil.surUnLit, this.sommeil.confort ?? 1);
        if (this.besoins.repos >= 1) this.reveiller("Tu te réveilles, reposé.");
      }
    }
    if (bouge && this.action) this.annulerAction();
    // Au gué : le radeau emporte qui est à bord, la corde du bac coûte un peu d'endurance (plan 0.8, chantier 11).
    if (this.lieu === "gue" && !this.voyage) this.gue.suivre(this.contexteGue(), dt);
    // Ce que le lieu fait de qui s'y trouve (0.10, le registre des lieux : LieuVivant.accompagner ; rien par défaut).
    this.vivant?.accompagner(this.contexteLieu(), dt);
    // Saisi : ralenti par un, immobilisé par deux (Book 06 §2.3). Épuisé : on ne court plus.
    const frein = freinSaisie(this.saisisseurs().length);
    const allure = this.allureEffective();
    const intention = { dx: this.intention.dx * frein, dz: this.intention.dz * frein, allure };
    let nouvelle = avancer(this.position, intention, dt, this.zoneIci());
    // L'élan de l'esquive : un bond rapide, sur quelques dixièmes de seconde.
    if (this.elan) {
      const vitesse = ESQUIVE.distance / ESQUIVE.duree;
      const pas = Math.min(dt, this.elan.restant);
      nouvelle = avancer(nouvelle, { dx: this.elan.dx, dz: this.elan.dz, allure: "course" }, (pas * vitesse) / ALLURES.course, this.zoneIci());
      this.elan.restant -= dt;
      if (this.elan.restant <= 0) this.elan = null;
    }
    this.bouge = nouvelle !== this.position;
    if (this.tuto && this.bouge) {
      this.tuto.marche += Math.hypot(nouvelle.x - this.position.x, nouvelle.z - this.position.z);
      if (!this.tuto.allures.includes(allure)) this.tuto.allures.push(allure);
    }
    if (nouvelle !== this.position) {
      this.position = nouvelle;
      this.positionEnvoyee = false;
    }
    if (!this.positionEnvoyee) {
      // Au millimètre près : 17 décimales pesaient pour rien, vingt fois par seconde (2026-10-08).
      const p = this.position;
      this.envoyer({ t: "etat", position: { x: Math.round(p.x * 1000) / 1000, z: Math.round(p.z * 1000) / 1000, o: Math.round(p.o * 1000) / 1000 }, seq: this.seq });
      this.positionEnvoyee = true;
    }

    // Besoins : ils baissent seulement quand le joueur est connecté.
    this.besoins = consommer(this.besoins, heures, EFFORT_PAR_ALLURE[bouge ? intention.allure : "repos"], this.sommeil !== null, instant < this.caleJusqua);
    if (this.action?.kcalEnPlus) this.besoins = { ...this.besoins, kcal: Math.max(0, this.besoins.kcal - this.action.kcalEnPlus * heures) };
    // L'admin : relu en base toutes les 5 s (un autre a pu être désigné) ; invincible, ni faim, ni soif, ni fatigue.
    if (this.admin && instant - this.derniereVerifAdmin >= 5000) {
      this.relireAdmin();
      if (!this.admin) this.envoyer(this.bienvenue(this.debutMonde));
    }
    this.garderInvincible();

    // La lampe frontale vide la petite batterie (Book 18 §2 : la lumière a un prix).
    if (this.lumiere && lumierePortee(this.inventaire) === "lampe_frontale") {
      const reste = Math.max(0, (this.charges.petite_batterie ?? 0) - CONSOMMATION_FRONTALE * heures);
      this.charges = { ...this.charges, petite_batterie: reste };
      if (reste <= 0) {
        this.lumiere = false;
        this.envoyer({ t: "lumiere", allumee: false });
        this.info("La petite batterie de la frontale est vide : la lampe s'éteint. Charge-la au banc.");
      }
    }
    if (instant - this.dernierEnvoiBesoins >= INTERVALLE_BESOINS) {
      this.envoyerBesoins();
      this.envoyerCharges();
      this.dernierEnvoiBesoins = instant;
      for (const i of this.installations.values()) {
        if (i.type === "charbonniere" && i.etat.pretLe && !this.meulesAnnoncees.has(i.id) && instant >= i.etat.pretLe) {
          this.meulesAnnoncees.add(i.id);
          this.info("La meule de charbonnière a fini de cuire : le charbon est prêt.");
        }
      }
    }
    // Les ébauches d'arc sèchent (Book 25 §3.3).
    this.sechage.avancer();
    // La couche de déchets : renouvellement, balises, ordures jetées (au plus toutes les 5 s).
    this.dechets.tick(instant);

    // Feux : ils brûlent leur bois.
    const envoyerFeux = instant - this.dernierEnvoiFeux >= INTERVALLE_FEUX;
    for (const feu of this.feux.values()) {
      if (!feu.allume) continue;
      const avant = aspectFeu(feu);
      Object.assign(feu, bruler(feu, heures), { majLe: instant });
      if (this.lieu !== "terrain" || this.voyage) continue;
      if (aspectFeu(feu) !== avant || envoyerFeux) this.envoyer({ t: "feu", feu: vue(feu) });
      if (aspectFeu(feu) !== avant && aspectFeu(feu) === "cendres") this.info("Le feu s'est éteint : il ne reste que des cendres.");
    }
    if (envoyerFeux) this.dernierEnvoiFeux = instant;

    if (instant - this.derniereRepousse >= INTERVALLE_REPOUSSE) this.verifierRepousse(instant);
    if (instant - this.derniereProduction >= INTERVALLE_REPOUSSE) {
      this.derniereProduction = instant;
      this.mettreAJourBase(instant);
      if (this.lieu === "terrain" && !this.voyage) {
        for (const i of this.installations.values()) if (i.type === "banc_recharge" && i.etat.batteries) this.envoyer({ t: "installation", installation: i });
      }
    }

    if (this.lieu === "terrain" && !this.voyage) {
      this.animerEteintsTerrain(instant, dt);
      this.animerPoules(instant, dt);
    }
    if (!this.voyage) this.tickCombat(instant, dt);
    this.tir.tick(dt);
    this.verifierTutoriel(instant);
    this.verifierQuetes(instant);
    this.devoilement.tick(dt);

    // Fin d'action
    if (this.action && instant >= this.action.fin) {
      const action = this.action;
      this.action = null;
      this.mesurer("activite", categorieAction(action.libelle), (instant - action.lance) / 1000);
      action.appliquer();
      this.envoyer({ t: "action", etat: "fin" });
      this.geste({ geste: "fin_action" });
    }
  }

  sauvegarder(): void {
    // En route, la destination est déjà enregistrée (voyager).
    if (!this.voyage) this.base.sauverPosition(this.compte.id, this.position, this.lieu, this.maintenant());
    this.base.sauverEtat(this.compte.id, this.besoins, this.gourde);
    for (const feu of this.feux.values()) this.base.sauverFeu(this.compte.id, feu);
    this.base.sauverCharges(this.compte.id, this.charges, this.maintenant());
    this.base.sauverSante(this.compte.id, this.sante, this.endurance);
    this.base.sauverUsure(this.compte.id, this.usure);
    // L'escabeau dans les bras : s'il faut le lâcher (déconnexion), il tombe là où l'on est.
    const porte = this.objetPorte();
    if (porte) this.base.deplacerInstallation(this.compte.id, porte.id, this.position.x, this.position.z, this.position.o);
    if (this.tuto) this.base.sauverTutoriel(this.compte.id, this.tuto);
    this.base.sauverWotts(this.compte.id, this.poche, this.compteWotts);
    if (this.quetesASauver) {
      this.quetesASauver = false;
      this.base.sauverQuetes(this.compte.id, this.quetes.etat);
    }
    const progression = this.devoilement.aEnregistrer();
    if (progression) this.base.sauverProgression(this.compte.id, progression);
  }

  // ---------- L'arbre de progression (0.7) : ce que le suivi des dévoilements regarde ----------

  /** Le suivi des recettes dévoilées, des idées gardées et des indices (serveur/src/devoilement.ts). */
  private creerDevoilement(): SuiviDevoilement {
    const source: SourceDevoilement = {
      famille: this.compte.famille,
      maintenant: () => this.maintenant(),
      savoir: () => this.savoir,
      inventaire: () => this.inventaire,
      faits: () => this.quetes.etat.faits,
      // La carte des installations (plan 0.8) : chaque type à son niveau, chaque forme de feu, les accessoires montés.
      installations: () => carteInstallations(this.installations.values(), this.feux.values()),
      quetes: () => (this.tuto ? [] : [...this.quetes.enCours(this.compte.famille).map((q) => q.id), ...this.quetes.etat.finies]),
      tuto: () => this.tuto?.etape ?? null,
      sansSac: () => capaciteDe(this.inventaire) < CAPACITE_SAC && !(this.inventaire.sac_fortune ?? 0),
      lieu: () => (this.voyage ? null : this.lieu),
      constats: (quels) => quels.filter((c) => this.constat(c)),
      noter: (fait) => this.noterFait(fait),
      // L'admin voit toujours tout dévoilé : ses messages de dévoilement le gardent.
      envoyer: (m) => this.envoyer(m.t === "devoilement" ? { ...m, progression: this.vueProgression(m.progression) } : m),
    };
    // La 0.8 démarre sur une base neuve (plan 0.8 §9.1) : pas de migration ; un état absent repart du feu et de l'abri.
    return new SuiviDevoilement(this.base.chargerProgression(this.compte.id), source);
  }

  /** Un constat d'état, regardé une fois par seconde tant qu'il n'a jamais été vrai (§2.3). */
  private constat(c: Constat): boolean {
    switch (c) {
      case "sommeil_bas":
        return this.besoins.repos < 0.5;
      case "eteint_vu": {
        const eteints = this.vivant ? this.vivant.eteintsVus(this.position) : this.lieu === "terrain" && !this.voyage ? this.eteints : [];
        return eteints.some((e) => e.etat !== "detruit" && Math.hypot(e.x - this.position.x, e.z - this.position.z) <= 20);
      }
      case "blessure":
        return this.sante.saignement !== "aucun";
      case "saisi":
        return this.saisisseurs().length > 0;
      case "pluie":
        return this.lieu === "terrain" && !this.voyage && meteo(this.maintenant(), this.debutMonde).pluie > 0.5;
      case "sac_lourd":
        return poidsInventaire(this.inventaire, this.gourde.litres) > 0.7 * capaciteDe(this.inventaire);
    }
  }

  /** On a vu un joueur fabriquer cette recette, à moins de 5 m (« voir faire », Q7). */
  vuFaire(recette: string): void {
    this.noterFait(`vu_faire:${recette}`);
    this.noterFait("vu_faire");
  }

  /** On est resté une minute à portée de voix d'un joueur de cette famille (la rencontre). */
  noterRencontre(famille: Famille): void {
    this.noterFait(`rencontre:${famille}`);
  }

  // ---------- Les mesures du test familial (Book 17 §6) ----------

  private mesurer(genre: GenreMesure, quoi: string, valeur: number, details?: Record<string, unknown>): void {
    this.base.mesurer({ instant: this.maintenant(), compteId: this.compte.id, famille: this.compte.famille, genre, quoi, valeur, details });
  }

  /** Les images par seconde de l'appareil du joueur, chaque minute (objectif : 30 sur iPhone 13). */
  /** Dernière mesure du client reçue (ms) : il en envoie une par minute ; au-delà, on ignore (la base n'est pas un puits). */
  private derniereMesureClient = 0;

  private mesuresClient(m: { ips: number; ipsBas: number; appareil: string; qualite: string }): void {
    const t = Date.now();
    if (t - this.derniereMesureClient < 20_000) return;
    this.derniereMesureClient = t;
    const nombre = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(500, v)) : 0);
    const appareil = typeof m.appareil === "string" ? m.appareil.slice(0, 40) : "?";
    const qualite = typeof m.qualite === "string" ? m.qualite.slice(0, 12) : "?";
    this.mesurer("client", appareil, nombre(m.ips), { ipsBas: nombre(m.ipsBas), qualite });
  }

  // ---------- Les objets lourds : porter, déplacer, poser (l'escabeau, 2026-10-08) ----------

  /** L'objet lourd qu'on a dans les bras. */
  private objetPorte(): InstallationVue | undefined {
    for (const i of this.installations.values()) if (i.etat.portee) return i;
    return undefined;
  }

  /** Ce que le lieu met dans les bras (0.10, chantier J : « la tête du robot » à l'hôtel) ; null : rien. */
  private brasDuLieu(): string | null {
    return this.vivant?.dansLesBras(this.compte.id) ?? null;
  }

  /** Le pose devant soi, immédiatement. */
  private poserObjetLourd(): void {
    const i = this.objetPorte();
    if (!i) return;
    const o = this.position.o;
    i.x = Math.round((this.position.x + Math.sin(o) * 0.9) * 100) / 100;
    i.z = Math.round((this.position.z + Math.cos(o) * 0.9) * 100) / 100;
    i.o = o;
    i.etat = { ...i.etat, portee: false };
    this.base.deplacerInstallation(this.compte.id, i.id, i.x, i.z, i.o);
    this.base.sauverEtatInstallation(this.compte.id, i.id, i.etat);
    this.envoyer({ t: "installation", installation: i });
  }

  /** Un escabeau posé dans le disque de l'arbre. */
  private escabeauAuPied(x: number, z: number): boolean {
    for (const i of this.installations.values()) if (i.type === "escabeau" && !i.etat.portee && Math.hypot(i.x - x, i.z - z) <= RAYON_ESCABEAU) return true;
    return false;
  }

  // ---------- Actions ----------

  private commencer(libelle: string, dureeS: number, appliquer: () => void, kcalEnPlus = 0, bruit: BruitAction = "leger"): void {
    if (this.voyage) return;
    if (this.objetPorte()) return this.info("Tu as les bras pris : pose d'abord l'escabeau.");
    if (this.brasDuLieu()) return this.info(`Tu as les bras pris : pose d'abord ${this.brasDuLieu()}.`);
    if (this.action) return this.info(`Tu es déjà occupé : attends la fin, ou appuie sur A pour arrêter.`);
    if (this.sommeil) this.reveiller("");
    // Fatigué, on travaille moins vite (Book 05 §3).
    if (fatigue(this.besoins)) dureeS *= MALUS_FATIGUE;
    const instant = this.maintenant();
    // Un geste long déjà entamé reprend là où on l'avait laissé.
    const garde = this.progressions.get(libelle);
    const deja = dureeS > GESTE_TENU_MAX_S && garde && instant - garde.le < PROGRESSION_GARDEE_MS ? garde.part : 0;
    this.progressions.delete(libelle);
    const debut = instant - deja * dureeS * 1000;
    this.action = { libelle, debut, fin: debut + dureeS * 1000, total: dureeS, lance: instant, appliquer, kcalEnPlus, bruit };
    this.envoyer({ t: "action", etat: "debut", libelle, duree: dureeS, bruit, ...(deja > 0 ? { deja: Math.round(deja * 1000) / 1000 } : {}) });
    this.geste({ geste: "action", action: libelle });
  }

  private annulerAction(): void {
    if (!this.action) return;
    // Un geste long arrêté en cours de route : ce qui est fait reste fait.
    const a = this.action;
    const instant = this.maintenant();
    const part = (instant - a.debut) / (a.fin - a.debut);
    if (a.total > GESTE_TENU_MAX_S && part > 0.02 && part < 1) this.progressions.set(a.libelle, { part, le: instant });
    this.mesurer("activite", categorieAction(a.libelle), (instant - a.lance) / 1000);
    this.action = null;
    this.envoyer({ t: "action", etat: "annulee" });
    this.geste({ geste: "fin_action" });
  }

  private info(texte: string): void {
    this.envoyer({ t: "info", texte });
  }

  /** Plusieurs messages courts, dans l'ordre (chacun tient en deux lignes en haut de l'écran). */
  private infos(textes: string[]): void {
    for (const texte of textes) this.info(texte);
  }

  private proche(x: number, z: number, distance = DISTANCE_INTERACTION): boolean {
    return Math.hypot(this.position.x - x, this.position.z - z) <= distance;
  }

  private interagir(cible: Cible, verbe: string): void {
    // Un geste propre au lieu où l'on est (0.10, le registre des lieux : LieuVivant.geste) passe avant les autres.
    if (this.vivant?.geste(this.contexteLieu(), cible, verbe)) return;
    if (cible?.genre === "ressource" && (verbe === "ramasser" || verbe === "demonter" || verbe === "fouiller")) return this.utiliserRessource(cible.id);
    if (cible?.genre === "sac" && verbe === "reprendre") return this.reprendreSac(cible.id);
    if (cible?.genre === "comptoir" && verbe === "pedaler_comptoir") return this.pedalerAuComptoir();
    if (cible?.genre === "animal" && verbe === "assommer" && this.lieu === "terrain") return this.assommer(cible.id);
    if (cible?.genre === "porte" && (verbe === "ouvrir_porte" || verbe === "fermer_porte")) return this.actionnerPorte(cible.id, verbe === "ouvrir_porte");
    if (cible?.genre === "leurre" && verbe === "actionner") return this.actionnerLeurre(cible.id);
    if (cible?.genre === "leurre" && cible.id === "radio" && verbe === "prendre_radio") return this.prendreRadio();
    // Le reste (mare, feux, installations) n'existe que sur le terrain.
    if (this.lieu !== "terrain") return;
    if (cible?.genre === "mare" && verbe === "remplir") return this.remplirGourde();
    if (cible?.genre === "installation") return this.utiliserInstallation(cible.id, verbe);
    if (cible?.genre === "feu") {
      const feu = this.feux.get(cible.id);
      if (!feu) return;
      if (!this.proche(feu.x, feu.z)) return this.info("Approche-toi du feu.");
      if (verbe === "ajouter_bois") return this.ajouterBois(feu);
      if (verbe === "allumer") return this.allumer(feu);
      if (verbe === "bouillir") return this.bouillir(feu);
      if (verbe === "rotir") return this.rotir(feu);
      return this.amenagerFeu(feu, verbe);
    }
  }

  /** Ramasser, démonter ou fouiller une ressource du sol (Book 02 §5). */
  private utiliserRessource(id: number): void {
    const lieu = this.lieu;
    const r = this.ressourcesIci().get(id);
    // L'if du fond du bois : qui ne reconnaît pas les essences ne le voit pas (Book 25 §3.2).
    if (!r || !this.ressourceLibre(r, this.maintenant()) || !ressourceVisible(r.type, this.compte.famille)) return;
    // Plan 0.8.2 §7.6 : la berge de glaise se creuse depuis son bord (son emprise), comme l'écran la propose.
    if (!this.proche(r.x, r.z, DISTANCE_INTERACTION + (estArbre(r.type) ? PORTEE_ARBRE : r.type === "gisement_glaise" ? (EMPRISE_RESSOURCE.gisement_glaise ?? 0) : 0))) return this.info("C'est trop loin : approche-toi encore un peu.");
    const usage = USAGES[r.type];
    // Le coffre du directeur ne s'ouvre qu'avec la clé du magasinier (Book 23 §2.2).
    if (r.type === "coop_coffre" && !(this.inventaire.cle_coffre ?? 0)) return this.info("Fermé à clé. Le magasinier la portait toujours sur lui…");
    // Le calendrier des récoltes : chaque fruit, chaque champignon à sa saison (2026-10-08).
    const jour = jourDuCalendrier(this.maintenant(), this.debutMonde);
    if (!enSaison(r.type, jour)) return this.info(etatDuFruitier(r.type, jour) ?? `Ce n'est pas la saison : à partir du ${prochaineRecolte(r.type)}.`);
    if (usage.escabeau && !this.escabeauAuPied(r.x, r.z)) {
      // L'arbre hors de portée fait penser à l'escabeau (l'arbre de progression).
      this.noterFait("arbre_haut");
      return this.info("Les fruits sont trop haut : pose un escabeau au pied de l'arbre, dans le cercle.");
    }
    const facteur = multiplicateurQualites(this.outils(), usage.qualites);
    if (facteur === null) return this.infos(outilsManquantsBref(usage.qualites, this.outils(), undefined, this.recetteVisible));
    if (poidsInventaire(this.inventaire, this.gourde.litres) + poidsDe(usage.donne) > capaciteDe(this.inventaire)) return this.sacTropLourd(usage.donne);
    this.commencer(usage.libelle, (usage.duree * facteur) / REGLAGES.gestes_vitesse, () => {
      const instant = this.maintenant();
      if (this.lieu !== lieu || !this.ressourceLibre(r, instant)) return;
      const vivant = this.vivant;
      // Un lieu vivant a sa repousse, son butin personnel et son vrac (plan 0.8, chantier 10 : serveur/src/lieu-vivant.ts).
      if (vivant) vivant.prendrePar(r, this.compte.id, instant);
      else {
        const repousse = REPOUSSE_MS[r.type] === null ? null : REPOUSSE_MS[r.type]! / REGLAGES.repousse_rythme;
        r.disponibleLe = repousse === null ? JAMAIS : instant + repousse;
        this.base.sauverRessource(this.compte.id, r.id, r.disponibleLe);
        this.envoyer({ t: "ressource", id: r.id, disponible: false });
      }
      this.ajouterPlusieurs(usage.donne);
      if (r.type === "coop_batterie" && lieu === "cooperative") {
        // La batterie du tracteur (Book 23 §4.7) : ce que les coups de klaxon lui ont laissé. Le klaxon se tait.
        const wh = this.ajouterCharge("batterie_voiture", this.cooperatives.prendreBatterie(this.compte.id));
        this.info(
          wh >= 1
            ? `Tu desserres les cosses : la batterie du tracteur est à toi, ${Math.round(wh)} Wh dedans. Le klaxon se tait.`
            : "La batterie du tracteur est à toi, mais vide : le klaxon l'a épuisée. Recharge-la au banc.",
        );
      } else for (const b of BATTERIES) if (usage.donne[b]) this.ajouterCharge(b, CHARGE_TROUVEE[b] * (usage.donne[b] ?? 0));
      // Vestiges, lot 1 : une fouille rapporte aussi du bric-à-brac, tiré dans la table du lieu.
      const lieuFouille = LIEU_DE_FOUILLE[r.type];
      // Au niveau 1, rarement, une clé de L1 (R-BUTIN, plan 0.8 chantier 10 : etapeButin, tirerCleRare).
      if (lieuFouille) this.recevoirBricABrac(tirerVestiges(lieuFouille, this.alea, etapeButin(lieu)));
      // Au gué, « par chance » (plan 0.8, chantier 11) : une bâche, des chiffons, une casserole, une corde ; rarement une clé.
      else if (lieu === "gue") this.gue.fouiller(r.type, this.alea, (t) => this.recevoirBricABrac(t), (t) => this.info(t));
      if (this.tuto) {
        this.tuto.branches += usage.donne.branche ?? 0;
        this.tuto.pierres += usage.donne.pierre ?? 0;
      }
    }, 0, usage.silencieux ? "aucun" : usage.verbe === "demonter" ? "outil" : "leger");
  }

  /** Cette ressource est-elle là pour moi ? (dans un lieu vivant : mon butin personnel, le vrac en jeu) */
  private ressourceLibre(r: RessourceEnBase, instant: number): boolean {
    const vivant = this.vivant;
    return vivant ? vivant.disponiblePour(r, this.compte.id, instant) : r.disponibleLe <= instant;
  }

  /** Un indice, au plus une fois par période pour chaque sorte : on aide sans rabâcher. */
  private indice(sorte: string, texte: string, periodeMs = 30_000): void {
    const instant = this.maintenant();
    if (instant - (this.derniersIndices.get(sorte) ?? -Infinity) < periodeMs) return;
    this.derniersIndices.set(sorte, instant);
    this.envoyer({ t: "indice", texte });
  }
  private readonly derniersIndices = new Map<string, number>();

  /** Le sac est trop lourd : on dit ce que pèse ce qu'on voulait prendre (`vise`), où en est le sac, et comment s'en sortir. */
  private sacTropLourd(vise?: Inventaire): void {
    this.noterFait("trop_lourd");
    for (const ligne of texteTropLourd(this.inventaire, this.gourde.litres, vise)) this.info(ligne);
  }

  /** Fabriquer un objet ou poser une installation (Book 02 §2). */
  private fabriquer(id: string, x?: number, z?: number, o?: number): void {
    const modele = recette(id);
    // L'admin (vérifié en base) connaît toutes les recettes, des quatre familles, sans apprentissage ni surcoût.
    const admin = modele !== undefined && this.base.estAdmin(this.compte.id);
    if (!modele || (!admin && !recettesConnues(this.compte.famille, this.savoir).includes(modele))) {
      return this.info(modele && modele.famille !== "tous" ? `Recette ${chezLaFamille(modele.famille)} : une leçon, ou leur manuel, te l'ouvrira.` : "Tu ne connais pas cette recette.");
    }
    // Une recette pas encore dévoilée (Q1) : le client ne la montre pas ; c'est un filet de sécurité.
    if (!admin && !this.devoilement.estDevoilee(modele.id)) return this.info("Tu n'y as pas encore pensé.");
    // Hors de sa famille (Book 25 §2.2) : ×1,5 en matières et en temps, et ★★ au plus.
    const horsFamille = !admin && estHorsFamille(modele, this.compte.famille);
    // Des ingrédients au choix (0.8.2, chantier B) : on prend la façon qu'on a dans le sac, et c'est elle qu'on consomme.
    const r = recetteAvecFacon(admin ? modele : recettePour(modele, this.compte.famille), this.inventaire);
    // Plus tard (plan 0.8 §1.3) : le client la grise ; le serveur la refuse.
    const plusTard = refusAVenir(r);
    if (plusTard) return this.info(plusTard);
    if (this.lieu !== "terrain" && r.lieu.genre !== "main") return this.info(r.lieu.genre === "posee" ? "Ça se construit chez toi, sur ton terrain." : "Ça se fait chez toi, à côté de ce que tu y as construit.");
    if (!ingredientsPresents(this.inventaire, r)) return this.info(ceQuiManqueBref(admin ? modele : recettePour(modele, this.compte.famille), this.inventaire, undefined, this.recetteVisible));
    const facteur = multiplicateurQualites(this.outils(), r.qualites);
    if (facteur === null) return this.infos(outilsManquantsBref(r.qualites, this.outils(), undefined, this.recetteVisible));
    // Le lieu (plan 0.8, chantier 1) : la forme du foyer, la construction à son niveau, l'accessoire ; le refus nomme ce qui manque.
    const refus = refusLieu(r.lieu, this.alentours());
    // Le cuiseur solaire (plan 0.10, chantier D ; S-22) : sans feu à portée, les plats du foyer de pierres cuisent au
    // soleil, sans bois, deux fois plus lentement (`lenteur`).
    const soleil = refus ? this.meublesNeufs.cuissonSolaire(r) : null;
    if (soleil && "refus" in soleil) return this.info(soleil.refus);
    if (refus && !soleil) return this.info(refus);
    const lenteur = soleil?.lenteur ?? 1;
    // La cuisine selon le foyer (Book 24 §3.1) : les mijotés demandent de l'eau et du bois ; deux plats à la fois.
    const cuisine = r.lieu.genre === "construction" && r.lieu.construction === "feu" && !soleil ? this.cuisinePour(r) : { fois: 1, foyer: null, bois: 0, eau: 0 };
    if ("refus" in cuisine) return this.info(cuisine.refus);
    // La forge (Book 25 §4) : la maîtrise ; le risque de la trempe à l'eau est dit ici.
    const refusForge = this.forge.refus(r);
    if (refusForge) return this.info(refusForge);
    // L'arbalète à arc d'if demande le cranequin léger (plan 0.10, chantier F).
    const refusArbalete = refusMontageArbalete(r.id, this.inventaire);
    if (refusArbalete) return this.info(refusArbalete);

    if ("installation" in r.produit) {
      const type = r.produit.installation;
      if (x === undefined || z === undefined || !Number.isFinite(x) || !Number.isFinite(z)) return;
      const erreur = this.emplacementInvalide(x, z, type);
      if (erreur) return this.info(erreur);
      this.commencer(r.nom, dureeReelle(r) * facteur, () => {
        if (!ingredientsPresents(this.inventaire, r) || this.emplacementInvalide(x, z, type)) return;
        // L'état à la pose (plan 0.10, chantier D) : l'arbalète de garde garde les étoiles de l'arbalète qu'elle prend.
        const etatPose = etatDePose(type, this.inventaire);
        // Un ingrédient de métier (l'arbalète) se prend toutes étoiles confondues, le moins bon d'abord.
        this.retirerIngredients(r.ingredients);
        const installation = this.base.ajouterInstallation(this.compte.id, type, x, z, Number.isFinite(o) ? (o as number) : 0);
        if (etatPose) {
          installation.etat = { ...installation.etat, ...etatPose };
          this.base.sauverEtatInstallation(this.compte.id, installation.id, installation.etat);
        }
        this.installations.set(installation.id, installation);
        this.envoyer({ t: "installation", installation });
        this.mesurer("progression", `recette:${r.id}`, 1);
        this.noterFait(`fabrique:${r.id}`);
        this.surFabrication?.(r.id);
      }, 0, r.qualites.marteler ? "lourd" : "outil");
      return;
    }

    const produit = r.produit;
    const fois = cuisine.fois;
    const ingredients = fois > 1 ? somme(...Array.from({ length: fois }, () => r.ingredients)) : r.ingredients;
    const quantite = produit.quantite * fois;
    // Ce qui reste en plus (plumes et os de la poule, Book 25 §9.6).
    const sousProduits: Inventaire = {};
    for (const [t, n] of Object.entries(r.sousProduits ?? {})) sousProduits[t as TypeObjet] = (n ?? 0) * fois;
    const delta = OBJETS[produit.objet].poids * quantite + poidsDe(sousProduits) - poidsDe(ingredients);
    // La capacité d'après : fabriquer un sac fait de la place.
    if (poidsInventaire(this.inventaire, this.gourde.litres) + delta > capaciteDe({ ...this.inventaire, [produit.objet]: (this.inventaire[produit.objet] ?? 0) + quantite })) return this.sacTropLourd();
    // Le redresseur de fûts de l'établi : les flèches vont deux fois plus vite (Book 25 §9.3).
    const redresse = accelerationFleches(r.id, this.installations.values(), (ix, iz) => this.proche(ix, iz, 3));
    this.commencer(fois > 1 ? `${r.nom} (deux à la fois)` : soleil ? `${r.nom} (au soleil)` : r.nom, dureeReelle(r) * facteur * redresse * lenteur, () => {
      // Un ingrédient de métier compte toutes étoiles confondues.
      if (!Object.entries(ingredients).every(([t, n]) => compter(this.inventaire, t as TypeObjet) >= (n ?? 0))) return;
      if (cuisine.foyer) {
        const { foyer, bois, eau } = cuisine;
        if (foyer.bois < bois - 1e-9 || this.gourde.litres < eau - 1e-9) return;
        if (bois > 0) {
          foyer.bois = Math.max(0, foyer.bois - bois);
          this.envoyer({ t: "feu", feu: vue(foyer) });
        }
        if (eau > 0) {
          this.gourde = { ...this.gourde, litres: Math.max(0, Math.round((this.gourde.litres - eau) * 100) / 100) };
          if (this.gourde.litres === 0) this.gourde = { contenu: "potable", litres: 0 };
          this.envoyerBesoins();
        }
      }
      // Les étoiles d'un objet de métier (Book 25 §4.2) : le maillon faible, la maîtrise (10 faits), ★★ hors famille.
      const etoiles = etoilesDuProduit(r, this.inventaire, { horsFamille, maitrise: estMaitrisee(nombreFabriques(this.quetes.etat.faits, r.id)), contexte: this.forge.contexte() });
      this.retirerIngredients(ingredients);
      // Ce qui sort de la forge (trempe, reforgeage, manche tourné : forge.ts) ; ailleurs, le produit à ses étoiles.
      const sortie = this.forge.sortie(r, produit.objet, etoiles, quantite, horsFamille);
      this.ajouterPlusieurs(somme(sortie, sousProduits));
      for (const m of mesuresFabrication(sortie)) this.mesurer("metier", m.quoi, m.valeur);
      this.mesurer("progression", `recette:${r.id}`, 1);
      this.noterFait(`fabrique:${r.id}`);
      this.surFabrication?.(r.id);
    }, this.forge.kcalEnPlus(r), r.qualites.marteler ? "lourd" : "outil");
  }

  /** Retire les ingrédients d'une recette : un objet de métier, les exemplaires les moins bons d'abord. */
  private retirerIngredients(ingredients: Inventaire): void {
    const inventaire = { ...this.inventaire };
    for (const [t, n] of Object.entries(ingredients)) retirerExemplaires(inventaire, t as TypeObjet, n ?? 0);
    this.inventaire = inventaire;
    this.base.sauverInventaire(this.compte.id, this.inventaire);
    this.envoyer({ t: "inventaire", inventaire: this.inventaire });
  }

  /** Ce qu'il y a autour de soi pour le lieu d'une recette (commun/src/lieu-recette.ts) : sa position, ses feux, ses installations. */
  private alentours(): Alentours<FeuEnBase> {
    return { x: this.position.x, z: this.position.z, feux: this.feux.values(), installations: this.installations.values(), inventaire: this.inventaire };
  }

  /** Les outils à portée (plan 0.8, chantier 6) : le sac, et chez soi le râtelier et l'établi à étau à 3 m. */
  private outils(): Inventaire {
    return this.lieu === "terrain" && !this.voyage ? outilsAPortee(this.alentours()) : this.inventaire;
  }

  /** Raison pour laquelle on ne peut pas poser quelque chose ici, ou null. */
  private emplacementInvalide(x: number, z: number, type?: string): string | null {
    return raisonEmplacement("installation", x, z, this.position, this.feux.values(), this.installations.values(), type);
  }

  /** Ce qui a repoussé (bois mort, baies) ; renvoie combien. */
  private verifierRepousse(instant: number): number {
    this.derniereRepousse = instant;
    let n = 0;
    for (const r of this.ressources.values()) {
      if (r.disponibleLe === 0 || r.disponibleLe > instant) continue;
      n++;
      r.disponibleLe = 0;
      this.base.sauverRessource(this.compte.id, r.id, 0);
      // Ailleurs, le terrain repousse sans rien dire : on le retrouvera au retour.
      if (this.lieu === "terrain" && !this.voyage) this.envoyer({ t: "ressource", id: r.id, disponible: true });
    }
    return n;
  }

  // ---------- La base qui produit seule (É4, lot 2 : Book 01 §2 bis) ----------

  /** Le banc le plus proche d'un panneau, s'il est à portée de câble. */
  private bancDe(panneau: InstallationVue): InstallationVue | null {
    let meilleur: InstallationVue | null = null;
    let d = PORTEE_CABLE_PANNEAU;
    for (const i of this.installations.values()) {
      if (i.type !== "banc_recharge") continue;
      const di = Math.hypot(i.x - panneau.x, i.z - panneau.z);
      if (di <= d) {
        d = di;
        meilleur = i;
      }
    }
    return meilleur;
  }

  /**
   * Fait avancer la production de la base jusqu'à `instant`, au calendrier (connecté ou non) : chaque panneau
   * charge les batteries posées sur son banc ; sans batterie ou batteries pleines, l'énergie est perdue.
   */
  private mettreAJourBase(instant: number): { produit: number; stocke: number; perdu: number; decharge: number; remonte: number } {
    const bilan = { produit: 0, stocke: 0, perdu: 0, decharge: 0, remonte: 0 };
    const changes = new Set<InstallationVue>();
    // Le banc solaire (chantier 7) : son panneau remplit ses batteries (avant la décharge, qui avance `majLe`).
    for (const [k, v] of Object.entries(produireBancsSolaires(this.installations.values(), instant, this.debutMonde)) as [keyof typeof bilan, number][]) bilan[k] += v;
    // Les batteries posées (banc, pédalier) se déchargent, comme les autres.
    for (const banc of this.installations.values()) {
      if (!porteBatteries(banc.type)) continue;
      const depuis = banc.etat.majLe ?? instant;
      const avant = banc.etat.charges ?? {};
      const apres = decharger(avant, instant - depuis);
      bilan.decharge += Object.values(avant).reduce((s, v) => s + (v ?? 0), 0) - Object.values(apres).reduce((s, v) => s + (v ?? 0), 0);
      banc.etat = { ...banc.etat, charges: apres, majLe: instant };
      changes.add(banc);
    }
    for (const panneau of this.installations.values()) {
      if (panneau.type !== "panneau_solaire") continue;
      const depuis = panneau.etat.majLe ?? instant;
      const wh = productionPanneau(depuis, instant, this.debutMonde);
      panneau.etat = { ...panneau.etat, majLe: instant };
      changes.add(panneau);
      bilan.produit += wh;
      const banc = this.bancDe(panneau);
      if (!banc) {
        bilan.perdu += wh;
        continue;
      }
      const r = stocker({ batteries: banc.etat.batteries ?? {}, charges: banc.etat.charges ?? {} }, wh);
      banc.etat = { ...banc.etat, charges: r.stockage.charges };
      bilan.stocke += r.stocke;
      bilan.perdu += r.perdu;
    }
    // Le moulin de jerricans remplit la batterie de la base au vent ; la rampe de LED la vide la nuit (plan 0.10, chantier D).
    const neufs = this.meublesNeufs.majBase([...this.installations.values()], instant);
    bilan.produit += neufs.produit;
    bilan.stocke += neufs.stocke;
    bilan.perdu += neufs.perdu;
    for (const i of neufs.changees) changes.add(i);
    if (this.lieu === "terrain" && !this.voyage) for (const i of neufs.bascules) this.envoyer({ t: "installation", installation: i });
    // Les clôtures électriques tirent leur courant du banc, même hors ligne (Book 25 §5.3).
    for (const c of alimenterClotures(this.installations.values(), instant, (c) => this.lieu === "terrain" && !this.voyage && this.envoyer({ t: "installation", installation: c }))) changes.add(c);
    // La décharge fait remonter des objets, même hors ligne (P-001).
    for (const d of this.installations.values()) {
      if (d.type !== "decharge") continue;
      const r = remonter({ contenu: d.etat.contenu ?? {}, majLe: d.etat.majLe ?? instant }, instant, this.alea);
      const n = Object.values(r.arrives).reduce((s, x) => s + (x ?? 0), 0);
      if (r.etat.majLe === d.etat.majLe && n === 0) continue;
      d.etat = { ...d.etat, contenu: r.etat.contenu, majLe: r.etat.majLe };
      changes.add(d);
      bilan.remonte += n;
      if (n > 0 && this.lieu === "terrain" && !this.voyage) {
        this.envoyer({ t: "installation", installation: d });
        const nom = Object.entries(r.arrives).map(([t, k]) => nommer(t as TypeObjet, k ?? 1)).join(", ");
        this.info(`La décharge a recraché quelque chose : ${nom}.`);
      }
    }
    // Les récupérateurs de pluie se remplissent quand il pleut, même hors ligne (P-002).
    for (const r of this.installations.values()) {
      if (r.type !== "recuperateur_pluie") continue;
      const depuis = r.etat.majLe ?? instant;
      const avant = r.etat.litres ?? 0;
      const max = contenanceRecuperateur(r);
      const litres = Math.min(max, avant + pluieRecueillie(depuis, instant, this.debutMonde, max - avant));
      r.etat = { ...r.etat, litres: Math.round(litres * 100) / 100, majLe: instant };
      changes.add(r);
      if (Math.abs(litres - avant) >= 0.05 && this.lieu === "terrain" && !this.voyage) this.envoyer({ t: "installation", installation: r });
    }
    for (const i of changes) this.base.sauverEtatInstallation(this.compte.id, i.id, i.etat);
    return bilan;
  }

  /** Relire un banc d'avant la 0.8.2 (electricite.ts, `batteriesEnTrop`) : ce qu'il ne garde pas revient au sac, sans rien perdre. */
  private rendreBatteriesEnTrop(banc: InstallationVue): void {
    const r = batteriesEnTrop(banc);
    if (!r) return;
    const inventaire = { ...this.inventaire };
    for (const [b, n] of Object.entries(r.batteries) as [TypeBatterie, number][]) {
      inventaire[b] = (inventaire[b] ?? 0) + n;
      this.charges = { ...this.charges, [b]: Math.min(capacite(b, inventaire[b]!), (this.charges[b] ?? 0) + (r.charges[b] ?? 0)) };
    }
    this.inventaire = inventaire;
    this.base.sauverInventaire(this.compte.id, this.inventaire);
    this.base.sauverCharges(this.compte.id, this.charges, this.maintenant());
    this.base.sauverEtatInstallation(this.compte.id, banc.id, banc.etat);
  }

  private chargesDuBanc(): Charges {
    const total: Charges = {};
    for (const i of this.installations.values()) {
      if (i.type !== "banc_recharge") continue;
      for (const [b, wh] of Object.entries(i.etat.charges ?? {}) as [TypeBatterie, number][]) total[b] = Math.round((total[b] ?? 0) + wh);
    }
    return total;
  }

  /** Poser ses batteries sur le banc, avec leur charge (la lampe frontale n'a alors plus de courant). */
  private poserBatteries(banc: InstallationVue): void {
    const batteries = { ...(banc.etat.batteries ?? {}) };
    const charges = { ...(banc.etat.charges ?? {}) };
    let pose = 0;
    for (const b of BATTERIES) {
      const n = this.inventaire[b] ?? 0;
      if (n === 0) continue;
      batteries[b] = (batteries[b] ?? 0) + n;
      charges[b] = (charges[b] ?? 0) + (this.charges[b] ?? 0);
      pose += n;
    }
    if (pose === 0) return this.info("Tu n'as pas de batterie sur toi.");
    this.commencer("Brancher les batteries sur le banc", 4, () => {
      this.retirerPlusieurs(Object.fromEntries(BATTERIES.map((b) => [b, this.inventaire[b] ?? 0])));
      this.charges = {};
      this.envoyerCharges();
      if (this.lumiere && lumierePortee(this.inventaire) === "lampe_frontale") {
        this.lumiere = false;
        this.envoyer({ t: "lumiere", allumee: false });
      }
      banc.etat = { ...banc.etat, batteries, charges, majLe: this.maintenant() };
      this.base.sauverEtatInstallation(this.compte.id, banc.id, banc.etat);
      this.envoyer({ t: "installation", installation: banc });
    }, 0, "leger");
  }

  private reprendreBatteries(banc: InstallationVue): void {
    const batteries = banc.etat.batteries ?? {};
    if (Object.values(batteries).every((n) => !n)) return this.info("Aucune batterie sur le banc.");
    this.commencer("Reprendre les batteries", 4, () => {
      this.mettreAJourBase(this.maintenant());
      const charges = banc.etat.charges ?? {};
      this.ajouterPlusieurs(batteries);
      for (const [b, wh] of Object.entries(charges) as [TypeBatterie, number][]) this.ajouterCharge(b, wh);
      banc.etat = { ...banc.etat, batteries: {}, charges: {} };
      this.base.sauverEtatInstallation(this.compte.id, banc.id, banc.etat);
      this.envoyer({ t: "installation", installation: banc });
    }, 0, "leger");
  }

  private construireFeu(x: number, z: number, dakota = false): void {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return;
    if (this.lieu !== "terrain") return this.info("Pas de feu ici : on ne s'installe que sur son terrain.");
    // Le foyer Dakota, comme une recette : pas avant d'y avoir pensé (l'arbre de progression, Q1).
    if (dakota && !this.admin && !this.devoilement.estDevoilee("foyer_dakota")) return this.info("Tu n'y as pas encore pensé.");
    const raison = raisonEmplacement("feu", x, z, this.position, this.feux.values(), this.installations.values());
    if (raison) return this.info(raison);
    if (this.feux.size >= MAX_FOYERS) {
      return this.info(
        `Pas plus de ${MAX_FOYERS} foyers sur ton terrain : approche-toi d'un feu et ${dakota ? "creuse-le en Dakota" : "améliore-le"}, ou démonte-le.`,
      );
    }
    const recette: Partial<Record<TypeObjet, number>> = dakota ? RECETTE_DAKOTA : RECETTE_FEU;
    // Le foyer Dakota se creuse (P-002) : il faut de quoi creuser.
    if (dakota && niveauQualite(this.outils(), "creuser") < 1) return this.info("Pour creuser un foyer Dakota, il faut un bâton à fouir (une branche durcie au feu).");
    for (const [type, n] of Object.entries(recette)) {
      if ((this.inventaire[type as TypeObjet] ?? 0) < (n ?? 0)) {
        return this.info(
          dakota
            ? `Il te faut 3 branches (tu en as ${this.inventaire.branche ?? 0}).`
            : `Il te faut 5 pierres et 3 branches (tu as ${this.inventaire.pierre ?? 0} et ${this.inventaire.branche ?? 0}), à ramasser sur ton terrain.`,
        );
      }
    }
    this.commencer(dakota ? "Creuser un foyer Dakota" : "Monter un feu de camp", DUREES.construireFeu * (dakota ? 1.6 : 1), () => {
      for (const [type, n] of Object.entries(recette)) this.retirer(type as TypeObjet, n ?? 0);
      const id = Math.max(0, ...this.feux.keys()) + 1;
      const feu: FeuEnBase = { id, x, z, bois: BOIS_INITIAL_FEU, allume: false, majLe: this.maintenant(), ...(dakota ? { dakota: true } : {}) };
      if (dakota) this.noterFait("foyer_dakota");
      this.feux.set(id, feu);
      this.base.sauverFeu(this.compte.id, feu);
      this.envoyer({ t: "feu", feu: vue(feu) });
    });
  }

  private ajouterBois(feu: FeuEnBase): void {
    // Les branches d'abord, puis les bûches (plan 0.8 §9.3) : le conseil de la première nuit devient possible.
    const type: TypeObjet | null = (this.inventaire.branche ?? 0) > 0 ? "branche" : (this.inventaire.buche ?? 0) > 0 ? "buche" : null;
    if (!type) return this.info("Tu n'as pas de bois : ramasse des branches ou des bûches de bois mort sur ton terrain.");
    if (feu.bois + combustibleDe(type) > effetsFeu(feu).boisMax + 1e-9) return this.info(`Le feu a déjà assez de bois (${effetsFeu(feu).boisMax} kg au plus).`);
    // Immédiat (Book 08 §3, 2026-10-08) : une action sans jauge se fait sur-le-champ, un clic = un morceau de bois.
    if (this.action) return this.info(`Tu es déjà occupé : attends la fin, ou appuie sur A pour arrêter.`);
    this.retirer(type, 1);
    feu.bois += combustibleDe(type);
    this.envoyer({ t: "feu", feu: vue(feu) });
    // B14 : une bûche du terrain au feu, quand il en reste moins de 6 ; une fois par nuit (serveur/src/tutoriel-fin.ts).
    this.avertissementBuche.verifier({ lieu: this.lieu, bois: type, inventaire: this.inventaire, ressources: this.ressources.values(), installations: this.installations.values(), instant: this.maintenant(), debutMonde: this.debutMonde }, this.envoyer);
  }

  private allumer(feu: FeuEnBase): void {
    if (feu.couvert) return this.ranimer(feu);
    if (feu.allume) return;
    if (feu.bois <= 0) return this.info("Il faut d'abord du bois : ajoute une branche ou une bûche.");
    const outil = (this.inventaire.pierre_a_feu ?? 0) > 0 ? "la pierre à feu" : (this.inventaire.briquet ?? 0) > 0 ? "le briquet" : null;
    if (!outil) return this.info(`Rien pour allumer le feu : il faut un briquet ou une pierre à feu. ${ouTrouverPhrase("briquet", this.recetteVisible)}`);
    this.commencer(`Allumer le feu avec ${outil}`, DUREES.allumer, () => {
      if (feu.bois <= 0) return;
      feu.allume = true;
      feu.majLe = this.maintenant();
      this.noterFait("feu_allume");
      this.envoyer({ t: "feu", feu: vue(feu) });
      this.signalerFeux(feu);
    });
  }

  // ---------- La volaille (2026-10-08, Book 11 §10) ----------

  /** Les poules présentes : trois, moins celles prises depuis moins de 2 h. */
  private peuplerPoules(): Poule[] {
    const instant = this.maintenant();
    const avant = this.faune.prises.length;
    this.faune.prises = this.faune.prises.filter((t) => instant - t < REGLAGES.poule_retour_h * 3_600_000);
    if (this.faune.prises.length !== avant) this.base.sauverFaune(this.compte.id, this.faune);
    while (this.poules.length + this.faune.prises.length < REGLAGES.poules_terrain) this.poules.push(nouvellePoule(this.prochainIdPoule++, this.alea));
    return this.poules;
  }

  private animerPoules(instant: number, dt: number): void {
    const qui = { x: this.position.x, z: this.position.z, allure: allureAutorisee(this.intention.allure, this.besoins, this.objetPorte() !== undefined || traineTravois(this.inventaire)), bouge: this.bouge };
    for (const p of this.peuplerPoules()) {
      const avant = p.etat;
      penserPoule(p, dt, this.sommeil ? null : qui, this.alea);
      // Une poule effarouchée par un pas trop pressé : on dit comment s'y prendre.
      // Seulement pour qui pourrait chasser (une arme en main), pas avant d'en avoir attrapé une, et rarement.
      const chasseur = armeEnMain(this.inventaire, this.armeEquipee).objet !== null && (this.quetes.etat.faits.poule_attrapee ?? 0) === 0;
      if (chasseur && avant !== "fuit" && p.etat === "fuit" && qui.bouge && qui.allure !== "discrete") {
        this.indice("poule", "Les poules se méfient : approche en discret ({discret}).", 10 * 60_000);
      }
    }
    // Les poules : seulement quand elles ont bougé (elles passent beaucoup de temps à gratter sur place).
    // Calmes, elles avancent à petits pas : 3 fois moins d'envois suffisent (le client les fait glisser entre deux).
    const intervalle = this.poules.some((p) => p.etat === "fuit") ? INTERVALLE_ETEINTS : INTERVALLE_ETEINTS * 3;
    if (instant - this.dernierEnvoiAnimaux >= intervalle) {
      this.dernierEnvoiAnimaux = instant;
      const animaux = this.poules.map(vuePoule);
      const cle = JSON.stringify(animaux);
      if (cle !== this.derniersAnimaux) {
        this.derniersAnimaux = cle;
        this.envoyer({ t: "animaux", animaux });
      }
    }
  }

  /** Un coup sur une poule : immédiat. Il faut un outil (même un gourdin), et l'avoir approchée sans l'effrayer. */
  private assommer(id: number): void {
    const p = this.poules.find((x) => x.id === id);
    if (!p) return;
    if (this.objetPorte()) return this.info("Tu as les bras pris : pose d'abord l'escabeau.");
    const arme = this.armeDuCombat();
    if (!arme.objet) return this.info(`À mains nues, elle t'échappe : prends un gourdin. ${ouTrouverPhrase("gourdin", this.recetteVisible)}`);
    const d = Math.hypot(p.x - this.position.x, p.z - this.position.z);
    if (d > arme.allonge + 0.3) return this.info(`Trop loin : approche-toi doucement en allure discrète (${p.etat === "fuit" ? "elle détale : attends qu'elle se calme" : "à un mètre"}).`);
    // Une poule qui picore ne voit rien venir ; une poule qui guette esquive souvent ; une poule qui fuit, jamais.
    const chance = p.etat === "picore" ? 0.95 : p.etat === "inquiete" ? 0.55 : 0;
    if (this.alea() >= chance) {
      penserPoule(p, 0, { x: this.position.x, z: this.position.z, allure: "course", bouge: true }, this.alea);
      return this.info(
        p.etat === "inquiete"
          ? "Raté : elle te guettait. Attends qu'elle picore de nouveau, et approche en allure discrète."
          : "Raté : elle s'enfuit en caquetant. Approche en allure discrète, sans geste brusque.",
      );
    }
    if (poidsInventaire(this.inventaire, this.gourde.litres) + OBJETS.poule.poids > capaciteDe(this.inventaire)) return this.sacTropLourd({ poule: 1 });
    this.poules = this.poules.filter((x) => x !== p);
    this.faune.prises.push(this.maintenant());
    this.base.sauverFaune(this.compte.id, this.faune);
    this.ajouterPlusieurs({ poule: 1 });
    this.noterFait("poule_attrapee");
    // Les autres ont tout vu : elles détalent.
    for (const autre of this.poules) penserPoule(autre, 0, { x: this.position.x, z: this.position.z, allure: "course", bouge: true }, this.alea);
    this.envoyer({ t: "animaux", animaux: this.poules.map(vuePoule) });
  }

  /** Rôtir la volaille crue sur un feu allumé : 3 s par portion. */
  private rotir(feu: FeuEnBase): void {
    if (!feu.allume) return this.info("Le feu n'est pas allumé : allume-le d'abord (briquet ou pierre à feu).");
    const n = this.inventaire.volaille_crue ?? 0;
    if (n <= 0) return this.info("Tu n'as rien à rôtir.");
    // Une portion à la fois, une de plus avec la broche ; le foyer de cuisine rôtit deux fois plus vite (Book 24 §3.1).
    const parTour = 1 + (feu.accessoires?.broche ? 1 : 0);
    this.commencer("Faire rôtir la volaille", (3 * Math.ceil(n / parTour)) / effetsFeu(feu).rotir, () => {
      const crues = Math.min(n, this.inventaire.volaille_crue ?? 0);
      if (crues <= 0) return;
      this.retirer("volaille_crue", crues);
      // La graisse qui coule sous la broche (Book 25 §9.1) : de quoi tremper une lame à l'huile.
      this.ajouterPlusieurs({ volaille_cuite: crues, graisse: crues });
    }, 0, "leger");
  }

  private bouillir(feu: FeuEnBase): void {
    if (!feu.allume) return this.info("Le feu n'est pas allumé : allume-le d'abord (briquet ou pierre à feu).");
    if (this.gourde.litres <= 0) return this.info("Ta gourde est vide : remplis-la à la mare, puis fais bouillir l'eau sur un feu.");
    if (this.gourde.contenu === "potable") return this.info("L'eau de ta gourde est déjà potable.");
    const e = effetsFeu(feu);
    const casserole = e.cuisine >= 3 && CASSEROLES.some((t) => (this.inventaire[t] ?? 0) > 0);
    const boisNecessaire = BOIS_PAR_LITRE_BOUILLI * this.gourde.litres * e.bouillirBois * (casserole ? BOUILLIR_AVEC_CASSEROLE : 1);
    if (feu.bois < boisNecessaire) return this.info("Le feu n'a pas assez de bois pour faire bouillir l'eau : ajoute une bûche.");
    this.commencer("Faire bouillir l'eau de la gourde", DUREES.bouillir * this.gourde.litres * e.bouillirDuree, () => {
      feu.bois = Math.max(0, feu.bois - boisNecessaire);
      this.gourde = { contenu: "potable", litres: this.gourde.litres };
      if (this.tuto) this.tuto.bouilli = true;
      this.noterFait("ebullition");
      this.envoyerBesoins();
      this.envoyer({ t: "feu", feu: vue(feu) });
      this.info("L'eau est potable.");
    });
  }

  private remplirGourde(): void {
    if ((this.inventaire.gourde ?? 0) < 1) return this.info(`Tu n'as pas de gourde. ${ouTrouverPhrase("gourde", this.recetteVisible)}`);
    // Au milieu de la mare, pas au bord (0.8.2, R21) : au bord, on coupe les joncs.
    if (distanceMare(this.position.x, this.position.z) > 1.5) return this.info("Approche-toi de la mare.");
    if (!auMilieuDeLaMare(this.position.x, this.position.z)) return this.info(TEXTE_GOURDE_AU_MILIEU);
    if (this.gourde.litres >= CONTENANCE_GOURDE && this.gourde.contenu === "brute") return this.info("Ta gourde est déjà pleine.");
    this.commencer("Remplir la gourde à la mare", DUREES.remplirGourde, () => {
      // L'eau de la mare n'est pas potable : mélangée, toute la gourde devient de l'eau brute.
      this.gourde = { contenu: "brute", litres: CONTENANCE_GOURDE };
      this.envoyerBesoins();
      this.info("Eau de la mare : fais-la bouillir avant de la boire.");
    });
  }

  private manger(objet: TypeObjet): void {
    const kcal = estObjet(objet) ? OBJETS[objet].kcal : undefined;
    if (!kcal || (this.inventaire[objet] ?? 0) < 1) return;
    // Rassasié (et désaltéré, si l'aliment est juteux), on gaspillerait : on le garde pour plus tard.
    const eau = OBJETS[objet].eau ?? 0;
    const soif = eau >= 0.05 && this.besoins.eau < RESERVE_EAU_MAX * 0.97;
    if (this.besoins.kcal >= RESERVE_KCAL_MAX * 0.97 && !soif) return this.info("Tu n'as plus faim : garde-le pour plus tard (la jauge de faim est pleine).");
    if (objet === "volaille_crue") this.info("Crue, la volaille peut rendre malade. Mieux vaut la rôtir au feu.");
    this.commencer(`Manger : ${nommer(objet, 1)}`, DUREES.manger, () => {
      if ((this.inventaire[objet] ?? 0) < 1) return;
      this.retirer(objet, 1);
      // Rien ne se perd (P-002) : la conserve laisse sa boîte.
      if (objet === "conserve" || objet === "conserve_bombee") this.ajouterPlusieurs({ boite_vide: 1 });
      // Manger désaltère aussi : l'eau des fruits, des champignons, des plats (2026-10-08).
      this.besoins = { ...this.besoins, kcal: Math.min(RESERVE_KCAL_MAX, this.besoins.kcal + kcal), eau: Math.min(RESERVE_EAU_MAX, this.besoins.eau + (OBJETS[objet].eau ?? 0)) };
      // Un plat chaud réconforte et cale (2026-10-08).
      const plat = OBJETS[objet].plat;
      if (plat) {
        this.noterFait("plat_mange");
        this.sante = { ...this.sante, points: Math.min(100, this.sante.points + plat.sante) };
        this.caleJusqua = this.maintenant() + RASSASIE_HEURES * 60_000;
        this.envoyerSante(true);
        this.info("Un vrai repas : ça réconforte, et ça cale pour un bon moment.");
      }
      // Un champignon toxique n'a pas mauvais goût : rien ne se sent avant les symptômes.
      const toxique = OBJETS[objet].toxique;
      // La volaille crue ne rend pas toujours malade : une fois sur deux.
      if (toxique && (toxique !== "viande_crue" || this.alea() < 0.5)) {
        this.sante = intoxiquer(this.sante, toxique, this.maintenant());
        this.base.sauverSante(this.compte.id, this.sante, this.endurance);
      }
      this.envoyerBesoins();
    }, 0, "aucun");
  }

  private boire(): void {
    if (this.besoins.eau >= RESERVE_EAU_MAX * 0.97) return this.info("Tu n'as plus soif : garde ton eau pour plus tard.");
    if (this.gourde.litres <= 0) return this.info("Ta gourde est vide : remplis-la à la mare, puis fais bouillir l'eau sur un feu.");
    this.commencer("Boire", DUREES.boire, () => {
      const gorgee = Math.min(GORGEE, this.gourde.litres);
      this.gourde = { ...this.gourde, litres: Math.max(0, this.gourde.litres - gorgee) };
      this.besoins = { ...this.besoins, eau: Math.min(RESERVE_EAU_MAX, this.besoins.eau + gorgee) };
      if (this.gourde.contenu === "brute") this.info("Eau non bouillie : c'est risqué (les maladies arrivent bientôt).");
      if (this.gourde.litres === 0) this.gourde = { contenu: "potable", litres: 0 };
      this.envoyerBesoins();
    }, 0, "aucun");
  }

  // ---------- Améliorer sa base (Book 24) : sur place, au lieu de poser autre chose à côté ----------

  /** Ce qu'il faut pour une étape (montée de niveau, accessoire) : le coût choisi et la durée réelle, ou null (déjà dit). */
  private preparerEtape(e: { nom?: string; aVenir?: AVenir; couts: readonly Inventaire[]; qualites: Etape["qualites"]; duree: number; famille?: Etape["famille"]; cle?: Etape["cle"] }): { cout: Inventaire; dureeS: number } | null {
    // Plus tard (plan 0.8 §1.3) : le niveau se voit, grisé, mais ne se bâtit pas encore.
    const plusTard = refusAVenir({ nom: e.nom ?? "Ce niveau", aVenir: e.aVenir });
    if (plusTard) {
      this.info(plusTard);
      return null;
    }
    // Avec sa clé, et rien d'autre (plan 0.10, chantier B : plus de repli, à aucun niveau).
    const { cout, payable } = choisirCout(this.inventaire, e.couts, e, this.compte.famille);
    const facteur = multiplicateurQualites(this.outils(), e.qualites);
    if (!payable) {
      const manque = (Object.entries(cout) as [TypeObjet, number][])
        .filter(([t, n]) => (this.inventaire[t] ?? 0) < n)
        .map(([t, n]) => `${nommer(t, n)} (tu en as ${this.inventaire[t] ?? 0})`);
      const autres = e.couts.length > 1 ? ` Ou bien : ${e.couts.slice(1).map((c) => Object.entries(coutPour(c, e, this.compte.famille)).map(([t, n]) => nommer(t as TypeObjet, n ?? 0)).join(", ")).join(" ; ")}.` : "";
      this.info(`Il te manque : ${manque.join(", ")}.${autres}`);
      return null;
    }
    if (facteur === null) {
      this.infos(outilsManquantsBref(e.qualites, this.outils(), undefined, this.recetteVisible));
      return null;
    }
    return { cout, dureeS: Math.max(2, e.duree / REGLAGES.fabrication_acceleration) * facteur };
  }

  /** Rendre des objets au sac : refusé (et dit) si le sac ne peut pas les porter. */
  private peutReprendre(objets: Inventaire, enMoins: Inventaire = {}): boolean {
    if (poidsInventaire(this.inventaire, this.gourde.litres) - poidsInventaire(enMoins) + poidsInventaire(objets) <= capaciteDe(this.inventaire) + 1e-9) return true;
    this.sacTropLourd(objets);
    return false;
  }

  /** Ce qui a été payé, niveau après niveau (les feux d'avant le Book 24 : le coût de base de leur voie). */
  private payesFeu(feu: FeuEnBase): Inventaire[] {
    return feu.payes ?? [(feu.dakota ? VOIE_CREUSEE : VOIE_SURFACE)[0]!.couts[0]!];
  }

  /** Les accessoires qui ne vont plus sur la nouvelle forme reviennent dans le sac, entiers. */
  private rendreAccessoires(feu: FeuEnBase): Inventaire {
    const rendus: Inventaire[] = [];
    for (const a of accessoiresIncompatibles(formeFeu(feu), feu.accessoires ?? {})) {
      rendus.push(feu.accessoires![a]!);
      delete feu.accessoires![a];
      this.info(`${ACCESSOIRES_FEU[a].nom} ne va pas sur ce foyer : tu la reprends.`);
    }
    return somme(...rendus);
  }

  /** Le bois en trop quand le foyer devient plus petit (le poêle-fusée tient 4 kg) : on le reprend. */
  private boisEnTrop(feu: FeuEnBase): Inventaire {
    const max = effetsFeu(feu).boisMax;
    if (feu.bois <= max) return {};
    const repris = boisRepris(feu.bois - max);
    feu.bois = max;
    return repris;
  }

  private majFeu(feu: FeuEnBase): void {
    this.base.sauverFeu(this.compte.id, feu);
    this.envoyer({ t: "feu", feu: vue(feu) });
  }

  /** Les gestes d'aménagement sur un feu (Book 24 §2 et §3.1). */
  private amenagerFeu(feu: FeuEnBase, verbe: string): void {
    // On ne maçonne pas dans les flammes : éteint, ou en braises (Book 24 §2.2).
    const dansLesFlammes = () => feu.allume && aspectFeu(feu) === "flammes";
    const refusFlammes = "On ne travaille pas dans les flammes : attends qu'il ne reste que des braises, ou couvre le feu.";
    switch (verbe) {
      case "couvrir": {
        if (!effetsFeu(feu).couvrir) return this.info("Il faut un foyer de pierres pour couvrir le feu sous la cendre.");
        if (!feu.allume || feu.couvert) return;
        if (this.action) return this.info("Tu es déjà occupé : attends la fin, ou appuie sur A pour arrêter.");
        feu.couvert = true;
        this.majFeu(feu);
        return this.info("Le feu est couvert sous la cendre : il brûle quatre fois moins, sans flamme. Il se ranime sans briquet.");
      }
      case "ranimer":
        return this.ranimer(feu);
      case "ameliorer": {
        const suivante = etapeSuivanteFeu(feu);
        if (!suivante) return this.info(`${etapeFeu(feu).nom} : c'est le plus haut de sa lignée.`);
        if (dansLesFlammes()) return this.info(refusFlammes);
        const plan = this.preparerEtape(suivante);
        if (!plan) return;
        return this.commencer(`Améliorer : ${suivante.nom}`, plan.dureeS, () => {
          if (!this.feux.has(feu.id) || dansLesFlammes() || niveauFeu(feu) !== suivante.niveau - 1 || !Object.entries(plan.cout).every(([t, n]) => (this.inventaire[t as TypeObjet] ?? 0) >= (n ?? 0))) return;
          this.retirerPlusieurs(plan.cout);
          feu.payes = [...this.payesFeu(feu), plan.cout];
          feu.niveau = suivante.niveau;
          // Le muret réflecteur se monte derrière le feu, face à l'abri le plus proche (sinon face au maçon).
          if (feu.o === undefined) feu.o = this.orientationMuret(feu);
          const rendus = somme(this.rendreAccessoires(feu), this.boisEnTrop(feu));
          if (Object.keys(rendus).length) this.ajouterPlusieurs(rendus);
          this.majFeu(feu);
          this.noterFait(`foyer:${suivante.id}`);
          this.mesurer("progression", `ameliorer:${suivante.id}`, 1);
          this.info(`${suivante.nom}. ${suivante.apporte}`);
        }, 0, suivante.qualites.marteler ? "lourd" : "outil");
      }
      case "redescendre": {
        const niveau = niveauFeu(feu);
        if (niveau <= 1) return this.info("C'est déjà le premier niveau : pour l'enlever, démonte-le.");
        if (dansLesFlammes()) return this.info(refusFlammes);
        const payes = this.payesFeu(feu);
        const rend = rendDuDemontage(payes.at(-1) ?? {});
        if (!this.peutReprendre(rend)) return;
        const avant = etapeFeu(feu);
        return this.commencer(`Défaire : ${avant.nom}`, Math.max(2, avant.duree / 2 / REGLAGES.fabrication_acceleration), () => {
          if (!this.feux.has(feu.id) || niveauFeu(feu) !== niveau) return;
          feu.payes = payes.slice(0, -1);
          feu.niveau = niveau - 1;
          if (feu.niveau === 1) delete feu.o;
          this.ajouterPlusieurs(somme(rend, this.rendreAccessoires(feu), this.boisEnTrop(feu)));
          this.majFeu(feu);
          this.info(`Redevenu : ${etapeFeu(feu).nom}. Tu récupères la moitié des matériaux naturels, et tout le reste.`);
        }, 0, "outil");
      }
      case "demonter_installation": {
        if (feu.allume) return this.info("Éteins-le d'abord : on ne démonte pas un feu qui brûle encore (laisse-le s'éteindre).");
        const rend = somme(rendDuDemontage(somme(...this.payesFeu(feu), ...Object.values(feu.accessoires ?? {}))), boisRepris(feu.bois));
        if (!this.peutReprendre(rend)) return;
        return this.commencer(`Démonter : ${etapeFeu(feu).nom}`, DUREES.construireFeu, () => {
          if (!this.feux.has(feu.id) || feu.allume) return;
          this.feux.delete(feu.id);
          this.base.retirerFeu(this.compte.id, feu.id);
          this.envoyer({ t: "feu_retire", id: feu.id });
          if (Object.keys(rend).length) this.ajouterPlusieurs(rend);
          this.info("Démonté : la moitié des pierres et des branches, et tout le reste, est dans ton sac.");
        }, 0, "outil");
      }
      case "creuser_dakota": {
        if (feu.dakota) return;
        if (!this.devoilement.estDevoilee("foyer_dakota")) return this.info("Tu n'y as pas encore pensé.");
        if (niveauFeu(feu) !== 1) return this.info("On creuse un feu de camp, pas un foyer maçonné : redescends-le d'abord au feu de camp.");
        if (dansLesFlammes()) return this.info(refusFlammes);
        const plan = this.preparerEtape({ couts: [], ...CREUSER });
        if (!plan) return;
        if (!this.peutReprendre(CREUSER.rend)) return;
        return this.commencer("Creuser le feu en foyer Dakota", plan.dureeS, () => {
          if (!this.feux.has(feu.id) || feu.dakota || niveauFeu(feu) !== 1) return;
          feu.dakota = true;
          feu.niveau = 1;
          feu.payes = [VOIE_CREUSEE[0]!.couts[0]!];
          delete feu.o;
          this.ajouterPlusieurs(somme(CREUSER.rend, this.rendreAccessoires(feu), this.boisEnTrop(feu)));
          this.majFeu(feu);
          // L'objectif du carnet « Un feu qui ne se voit pas » compte aussi un feu creusé sur place (Book 24 §7).
          this.noterFait("foyer_dakota");
          this.info(`Foyer Dakota : le feu est dans le sol. Tu récupères ${nommer("pierre", CREUSER.rend.pierre ?? 0)}.`);
        }, 0, "outil");
      }
      case "combler": {
        if (!feu.dakota) return;
        if (niveauFeu(feu) !== 1) return this.info("Redescends d'abord le poêle-fusée au foyer Dakota.");
        if (dansLesFlammes()) return this.info(refusFlammes);
        const plan = this.preparerEtape({ couts: [COMBLER.cout], qualites: COMBLER.qualites, duree: COMBLER.duree });
        if (!plan) return;
        return this.commencer("Combler le Dakota en feu de camp", plan.dureeS, () => {
          if (!this.feux.has(feu.id) || !feu.dakota || (this.inventaire.pierre ?? 0) < (COMBLER.cout.pierre ?? 0)) return;
          this.retirerPlusieurs(COMBLER.cout);
          delete feu.dakota;
          feu.niveau = 1;
          feu.payes = [VOIE_SURFACE[0]!.couts[0]!];
          const rendus = this.rendreAccessoires(feu);
          if (Object.keys(rendus).length) this.ajouterPlusieurs(rendus);
          this.majFeu(feu);
          this.info("Le trou est comblé, le cercle de pierres posé : c'est de nouveau un feu de camp.");
        }, 0, "outil");
      }
      case "monter_broche":
      case "monter_marmite": {
        const a: AccessoireFeu = verbe === "monter_broche" ? "broche" : "marmite";
        const def = ACCESSOIRES_FEU[a];
        if (feu.accessoires?.[a]) return this.info(`${def.nom} : déjà montée.`);
        if (!def.formes.includes(formeFeu(feu))) return this.info(`${def.nom} ne va pas sur un ${etapeFeu(feu).nom.toLowerCase()}.${a === "marmite" ? " Il faut un foyer de cuisine." : ""}`);
        const plan = this.preparerEtape(def);
        if (!plan) return;
        return this.commencer(`Monter : ${def.nom}`, plan.dureeS, () => {
          if (!this.feux.has(feu.id) || feu.accessoires?.[a] || !Object.entries(plan.cout).every(([t, n]) => (this.inventaire[t as TypeObjet] ?? 0) >= (n ?? 0))) return;
          this.retirerPlusieurs(plan.cout);
          feu.accessoires = { ...feu.accessoires, [a]: plan.cout };
          this.noterFait(`accessoire:${a}`);
          this.majFeu(feu);
          this.info(`${def.nom}. ${def.apporte}`);
        }, 0, "outil");
      }
    }
  }

  /**
   * Cuisiner une recette au feu (Book 24 §3.1) : le meilleur foyer allumé tout près ; les mijotés demandent la
   * crémaillère (foyer de cuisine), de l'eau et du bois (moitié moins avec la marmite norvégienne) ; le foyer de cuisine
   * cuit deux plats à la fois quand on a de quoi.
   */
  private cuisinePour(r: Recette): { fois: number; foyer: FeuEnBase | null; bois: number; eau: number } | { refus: string } {
    // Le foyer : un feu allumé tout près, de la forme que demande la recette (le lieu), celui qui cuit le plus de plats.
    const foyer = feuxDuLieu(r.lieu, this.alentours()).sort((a, b) => effetsFeu(b).plats - effetsFeu(a).plats)[0];
    if (!foyer) return { refus: refusLieu(r.lieu, this.alentours()) ?? "Il te faut un feu allumé, tout près." };
    const parPlat = { bois: (r.boisFeu ?? 0) * boisMarmite(foyer.accessoires?.marmite), eau: r.eau ?? 0 };
    if (parPlat.eau > 0 && this.gourde.litres < parPlat.eau - 1e-9) return { refus: `Il faut ${String(parPlat.eau).replace(".", ",")} L d'eau dans ta gourde (celle de la mare suffit : elle va bouillir).` };
    if (parPlat.bois > 0 && foyer.bois < parPlat.bois - 1e-9) return { refus: "Le feu n'a pas assez de bois pour une longue cuisson : ajoute une bûche." };
    const deux =
      effetsFeu(foyer).plats >= 2 &&
      // Deux plats à la fois, oui ; deux arcs montés d'un coup, non (un objet de métier se fait un par un).
      !("objet" in r.produit && estObjetDeMetier(r.produit.objet)) &&
      Object.entries(r.ingredients).every(([t, n]) => (this.inventaire[t as TypeObjet] ?? 0) >= 2 * (n ?? 0)) &&
      this.gourde.litres >= 2 * parPlat.eau - 1e-9 &&
      foyer.bois >= 2 * parPlat.bois - 1e-9;
    const fois = deux ? 2 : 1;
    return { fois, foyer, bois: parPlat.bois * fois, eau: parPlat.eau * fois };
  }

  /** Ranimer un feu couvert : on écarte la cendre, les braises reprennent (sans briquet). */
  private ranimer(feu: FeuEnBase): void {
    if (!feu.couvert) return;
    if (this.action) return this.info("Tu es déjà occupé : attends la fin, ou appuie sur A pour arrêter.");
    feu.couvert = false;
    if (feu.bois <= 0) feu.allume = false;
    this.majFeu(feu);
    this.signalerFeux(feu);
  }

  /** La signature rendue visible (Book 24 §4.2) : deux feux allumés, on te sent deux fois plus loin. */
  private signalerFeux(feu: FeuEnBase): void {
    const n = [...this.feux.values()].filter((f) => f.allume && f.bois > 0 && !f.couvert).length;
    if (n < 2 || !feu.allume) return;
    this.indice("feux_allumes", `${n === 2 ? "Deux" : n === 3 ? "Trois" : n} feux : chacun attire les Éteints. Un seul suffit.`, 5 * 60_000);
  }

  /** Le muret réflecteur : derrière le feu, pour renvoyer la chaleur vers l'abri le plus proche (sinon vers le maçon). */
  private orientationMuret(feu: FeuEnBase): number {
    let cible = { x: this.position.x, z: this.position.z };
    let meilleure = 6;
    for (const i of this.installations.values()) {
      const d = Math.hypot(i.x - feu.x, i.z - feu.z);
      if ((i.type === "abri" || i.type === "lit_branchages") && d < meilleure) {
        meilleure = d;
        cible = { x: i.x, z: i.z };
      }
    }
    return Math.round(Math.atan2(cible.x - feu.x, cible.z - feu.z) * 1000) / 1000;
  }

  /** Le confort du sommeil (Book 24 §3.1, §3.3) : l'abri amélioré, le lit voisin, la chaleur d'un foyer de pierres voisin. */
  private confortDuSommeil(i: InstallationVue): number {
    const pres = (type: string) => [...this.installations.values()].filter((x) => x.type === type && Math.hypot(x.x - i.x, x.z - i.z) <= 3);
    const abri = i.type === "abri" ? i : pres("abri")[0];
    const lit = i.type === "lit_branchages" || pres("lit_branchages").length > 0;
    const couchage = Math.max(lit ? BONUS_LIT : 1, abri ? sommeilAbri(abri) : 1);
    const ici = abri ?? i;
    let chaleur = 1;
    for (const f of this.feux.values()) {
      if (f.allume && f.bois > 0 && Math.hypot(f.x - ici.x, f.z - ici.z) <= 3) chaleur = Math.max(chaleur, effetsFeu(f).chaleur);
    }
    return couchage * chaleur;
  }

  /** Améliorer, redescendre ou démonter une installation (Book 24 §2.4, §3.2 à §3.4). */
  private amenagerInstallation(i: InstallationVue, verbe: string): void {
    if (i.type === "decharge") return this.info("La décharge ne se démonte pas : elle était là avant toi.");
    if (i.etat.portee) return this.info("Pose-la d'abord.");
    const laRecette = RECETTES.find((r) => "installation" in r.produit && r.produit.installation === i.type);
    const etape = etapeInstallation(i);
    const nom = etape?.nom ?? laRecette?.nom ?? NOMS_INSTALLATIONS[i.type];
    const maj = () => {
      this.base.sauverNiveauInstallation(this.compte.id, i.id, niveauInstallation(i));
      this.base.sauverEtatInstallation(this.compte.id, i.id, i.etat);
      this.envoyer({ t: "installation", installation: i });
    };
    switch (verbe) {
      case "ameliorer": {
        const suivante = etapeSuivanteInstallation(i);
        if (!lignee(i.type)) return this.info("Cette installation ne s'améliore pas.");
        if (!suivante) return this.info(`${nom} : c'est le plus haut de sa lignée.`);
        // L'abri garni peut absorber le lit de branchages voisin, sans rien payer (Book 24 §3.3, proposé, jamais d'office).
        const lit = suivante.id === "abri_garni" ? [...this.installations.values()].find((x) => x.type === "lit_branchages" && Math.hypot(x.x - i.x, x.z - i.z) <= 3) : undefined;
        const plan = lit ? { cout: {}, dureeS: Math.max(2, suivante.duree / REGLAGES.fabrication_acceleration) } : this.preparerEtape(suivante);
        if (!plan) return;
        return this.commencer(lit ? "Glisser le lit sous l'abri" : `Améliorer : ${suivante.nom}`, plan.dureeS, () => {
          if (!this.installations.has(i.id) || niveauInstallation(i) !== suivante.niveau - 1) return;
          if (lit) {
            if (!this.installations.has(lit.id)) return;
            this.installations.delete(lit.id);
            this.base.retirerInstallation(this.compte.id, lit.id);
            this.envoyer({ t: "installation_retiree", id: lit.id });
          } else {
            if (!Object.entries(plan.cout).every(([t, n]) => (this.inventaire[t as TypeObjet] ?? 0) >= (n ?? 0))) return;
            this.retirerPlusieurs(plan.cout);
          }
          // Le lit absorbé compte comme payé : le démontage le rendra.
          i.etat = { ...i.etat, payes: [...(i.etat.payes ?? []), lit ? suivante.couts[0]! : plan.cout] };
          i.niveau = suivante.niveau;
          maj();
          this.noterFait(`niveau:${suivante.id}`);
          this.mesurer("progression", `ameliorer:${suivante.id}`, 1);
          this.info(`${suivante.nom}. ${suivante.apporte}`);
        }, 0, suivante.qualites.marteler ? "lourd" : "outil");
      }
      case "redescendre": {
        const niveau = niveauInstallation(i);
        if (niveau <= 1) return this.info("C'est déjà le premier niveau : pour l'enlever, démonte-le.");
        const payes = i.etat.payes ?? [];
        const rend = rendDuDemontage(payes.at(-1) ?? {});
        const apres = { type: i.type, niveau: niveau - 1, etat: i.etat };
        if (i.type === "coffre" && poidsInventaire(i.etat.contenu ?? {}) > capaciteCoffre(apres) + 1e-9) return this.info(`Il y a trop dans le coffre pour qu'il redevienne plus petit : vide-le jusqu'à ${capaciteCoffre(apres)} kg.`);
        if (!this.peutReprendre(rend)) return;
        return this.commencer(`Défaire : ${nom}`, Math.max(2, (etape?.duree ?? 20) / 2 / REGLAGES.fabrication_acceleration), () => {
          if (!this.installations.has(i.id) || niveauInstallation(i) !== niveau) return;
          i.niveau = niveau - 1;
          i.etat = { ...i.etat, payes: payes.slice(0, -1) };
          // Le seau redevient bidon : ce qui déborde se répand.
          if (i.type === "recuperateur_pluie") i.etat = { ...i.etat, litres: Math.min(i.etat.litres ?? 0, contenanceRecuperateur(i)) };
          if (i.niveau === 1) delete i.niveau;
          this.ajouterPlusieurs(rend);
          maj();
          this.info(`Redevenu : ${etapeInstallation(i)?.nom ?? nom}. Tu récupères la moitié des matériaux naturels, et tout le reste.`);
        }, 0, "outil");
      }
      case "demonter_installation": {
        if (!laRecette) return this.info("Ça ne se démonte pas.");
        if (i.type === "coffre" && Object.values(i.etat.contenu ?? {}).some((n) => (n ?? 0) > 0)) return this.info("Vide d'abord le coffre.");
        // La batterie du banc (0.8.2) est à demeure : elle revient au sac avec le reste ; celle du pédalier se reprend d'abord.
        const batterieDuBanc = i.type === "banc_recharge" ? (i.etat.batteries ?? {}) : {};
        if (i.type !== "banc_recharge" && porteBatteries(i.type) && Object.values(i.etat.batteries ?? {}).some((n) => (n ?? 0) > 0)) return this.info("Reprends d'abord les batteries posées dessus.");
        if (i.type === "ratelier_outils" && Object.values(i.etat.contenu ?? {}).some((n) => (n ?? 0) > 0)) return this.info("Reprends d'abord les outils du râtelier.");
        if (i.type === "charbonniere" && i.etat.pretLe) return this.info("La meule cuit : on ne l'ouvre qu'au défournement.");
        // Les accessoires du pédalier se démontent avec lui.
        const accessoires = somme(
          i.etat.meule ? { pierre: 3 } : {},
          i.etat.dynamo ? { dynamo_velo: 1 } : {},
          i.etat.redresseur ? REDRESSEUR.cout : {},
          Forge.accessoiresRendus(i),
          rendDesAccessoires(i.etat),
          rendusMeublesNeufs(i),
          batterieDuBanc,
        );
        const rend = rendDeLArbaleteGarde(i, rendDuDemontage(somme(laRecette.ingredients, ...(i.etat.payes ?? []), accessoires)));
        if (!this.peutReprendre(rend)) return;
        return this.commencer(`Démonter : ${nom}`, Math.max(2, dureeReelle(laRecette) / 2), () => {
          if (!this.installations.has(i.id)) return;
          this.installations.delete(i.id);
          this.base.retirerInstallation(this.compte.id, i.id);
          this.envoyer({ t: "installation_retiree", id: i.id });
          if (Object.keys(rend).length) this.ajouterPlusieurs(rend);
          for (const [b, wh] of Object.entries(i.type === "banc_recharge" ? (i.etat.charges ?? {}) : {}) as [TypeBatterie, number][]) this.ajouterCharge(b, wh);
          this.info(`${nom} démonté${i.type === "recuperateur_pluie" && (i.etat.litres ?? 0) > 0.05 ? " (eau perdue)" : ""}. Dans ton sac : la moitié des matériaux naturels, tout le reste.`);
        }, 0, "outil");
      }
    }
  }

  // ---------- Installations des familles (É2, lot 2) ----------

  /** Sait-on se servir de cette installation : sa famille, ou sa recette apprise (plan 0.8.2 §7.3 : savoir-meuble.ts). */
  private saitSeServir(type: TypeInstallation): boolean {
    return saitSeServir(type, this.compte.famille, this.savoir);
  }

  private utiliserInstallation(id: number, verbe: string): void {
    const i = this.installations.get(id);
    if (!i) return;
    if (!this.proche(i.x, i.z, DISTANCE_INTERACTION + 0.6)) return this.info("Approche-toi.");
    if (!this.saitSeServir(i.type)) return this.info("C'est le savoir d'une autre famille : échange avec l'un des siens, à la halte ou au Carrefour.");
    const maj = () => {
      this.base.sauverEtatInstallation(this.compte.id, i.id, i.etat);
      this.envoyer({ t: "installation", installation: i });
    };
    if (verbe === "ameliorer" || verbe === "redescendre" || verbe === "demonter_installation") return this.amenagerInstallation(i, verbe);
    if (this.forge.utiliser(i, verbe)) return;
    // Les pièges et les accessoires du pédalier des Mécanistes (Book 25 §6, chantier 7) : serveur/src/mecanique.ts.
    if (utiliserMecanique(this.contexteMecanique(maj), i, verbe as Verbe)) return;
    // Le banc solaire (plan 0.8, chantier 7) : poser le panneau sur le banc (serveur/src/electricite.ts).
    if (this.electricite.utiliser(i, verbe as Verbe)) return;
    if (utiliserNiveau1(this.contexteMecanique(maj), i, verbe as Verbe, () => this.maintenant(), this.debutMonde)) return;
    // Les meubles nouveaux du niveau 2 (plan 0.10, chantier D) : le cuiseur, le creuset, la poulie, l'arbalète de garde.
    if (this.meublesNeufs.utiliser(i, verbe)) return;

    switch (verbe) {
      case "porter":
        if (i.type !== "escabeau" || i.etat.portee) return;
        if (this.objetPorte()) return this.info("Tu portes déjà quelque chose.");
        if (this.action) return this.info(`Tu es déjà occupé : attends la fin, ou appuie sur A pour arrêter.`);
        // Immédiat : on le prend dans les bras (on marche, on ne court plus).
        i.etat = { ...i.etat, portee: true };
        return maj();
      case "dormir": {
        // Un lit de branchages à côté de l'abri (ou l'abri à côté du lit) : on dort mieux (P-002).
        const pres = (type: string) => [...this.installations.values()].some((x) => x.type === type && Math.hypot(x.x - i.x, x.z - i.z) <= 3);
        // Dans l'abri : on se rend accroupi jusqu'à sa couche, puis on y dort (0.8.2, R12 : serveur/src/sommeil-abri.ts).
        if (i.type === "abri") return this.allerALaCouche(i, pres("lit_branchages"), this.confortDuSommeil(i));
        if (i.type === "lit_branchages") return this.endormir(pres("abri"), true, this.confortDuSommeil(i));
        return;
      }
      case "remplir_pluie": {
        if (i.type !== "recuperateur_pluie") return;
        this.mettreAJourBase(this.maintenant());
        const l = i.etat.litres ?? 0;
        if (!this.inventaire.gourde) return this.info("Il te faut une gourde.");
        const place = CONTENANCE_GOURDE - (this.gourde.contenu === "potable" ? this.gourde.litres : 0);
        if (l < 0.1) return this.info("Le récupérateur est vide : il faut attendre la pluie.");
        if (place < 0.05) return this.info("Ta gourde est déjà pleine d'eau potable.");
        return this.commencer("Remplir la gourde (eau de pluie)", DUREES.remplirGourde, () => {
          const verse = Math.min(place, i.etat.litres ?? 0);
          // L'eau du ciel, tombée sur une bâche propre : elle se boit sans bouillir. Mélangée à de l'eau brute, non.
          const brute = this.gourde.contenu === "brute" && this.gourde.litres > 0.01;
          this.gourde = brute ? { contenu: "brute", litres: Math.min(CONTENANCE_GOURDE, this.gourde.litres + verse) } : { contenu: "potable", litres: Math.min(CONTENANCE_GOURDE, (this.gourde.contenu === "potable" ? this.gourde.litres : 0) + verse) };
          i.etat = { ...i.etat, litres: Math.max(0, (i.etat.litres ?? 0) - verse) };
          maj();
          this.envoyerBesoins();
          this.noterFait("eau_de_pluie");
          this.info(brute ? "Mélangée à l'eau brute de la mare, elle ne se boit pas : fais bouillir la gourde." : "De l'eau de pluie : elle se boit telle quelle.");
        });
      }
      case "allumer_meule": {
        if (i.type !== "charbonniere" || i.etat.pretLe) return;
        if (!(this.inventaire.pierre_a_feu || this.inventaire.briquet)) return this.info("Tu n'as rien pour allumer la meule : il faut une pierre à feu ou un briquet.");
        return this.commencer("Allumer la meule", 3, () => {
          i.etat = { ...i.etat, pretLe: this.maintenant() + DUREE_CHARBONNIERE_MS };
          maj();
          this.info("La meule fume : le charbon sera prêt dans trois jours de jeu (1 h 12 réelle).");
        });
      }
      case "defourner": {
        if (i.type !== "charbonniere" || !i.etat.pretLe) return;
        if (this.maintenant() < i.etat.pretLe) return this.info(`Le charbon n'est pas encore prêt : encore ${Math.ceil((i.etat.pretLe - this.maintenant()) / 60_000)} min réelles.`);
        if (poidsInventaire(this.inventaire, this.gourde.litres) + CHARBON_PRODUIT > capaciteDe(this.inventaire)) return this.sacTropLourd();
        return this.commencer("Défourner le charbon", 10, () => {
          this.ajouterPlusieurs({ charbon_bois: CHARBON_PRODUIT });
          this.noterFait("defourne");
          this.installations.delete(i.id);
          this.base.retirerInstallation(this.compte.id, i.id);
          this.envoyer({ t: "installation_retiree", id: i.id });
        }, 150);
      }
      case "monter_meule": {
        if (i.type !== "pedalier" || i.etat.meule) return;
        if ((this.inventaire.pierre ?? 0) < 3) return this.info(`Il faut 3 pierres pour tailler une meule (tu en as ${this.inventaire.pierre ?? 0}) : ramasse-les sur ton terrain.`);
        return this.commencer("Monter la meule sur le pédalier", 20, () => {
          if ((this.inventaire.pierre ?? 0) < 3) return;
          this.retirerPlusieurs({ pierre: 3 });
          i.etat = { ...i.etat, meule: true };
          maj();
        }, 0, "outil");
      }
      case "monter_redresseur": {
        // L'établi reçoit son redresseur de fûts (Book 25 §9.3) : les flèches y vont deux fois plus vite.
        if (i.type !== "etabli" || i.etat.redresseur) return;
        if (!this.aDeQuoi(REDRESSEUR.cout)) return this.info("Pour le redresseur de fûts, il faut 2 branches et 1 pierre.");
        return this.commencer("Monter le redresseur de fûts", REDRESSEUR.dureeS / REGLAGES.gestes_vitesse, () => {
          if (i.etat.redresseur || !this.aDeQuoi(REDRESSEUR.cout)) return;
          this.retirerPlusieurs(REDRESSEUR.cout);
          i.etat = { ...i.etat, redresseur: true };
          maj();
          this.info("Le redresseur est en place : à côté de l'établi, tes flèches vont deux fois plus vite.");
        }, 0, "outil");
      }
      case "monter_dynamo": {
        if (i.type !== "pedalier" || i.etat.dynamo) return;
        if (!this.inventaire.dynamo_velo) return this.info(`Il te faut la dynamo du vélo. ${ouTrouverPhrase("dynamo_velo", this.recetteVisible)}`);
        return this.commencer("Monter la dynamo sur le pédalier", 20, () => {
          if (!this.inventaire.dynamo_velo) return;
          this.retirerPlusieurs({ dynamo_velo: 1 });
          i.etat = { ...i.etat, dynamo: true };
          maj();
        }, 0, "outil");
      }
      case "affuter": {
        if (i.type !== "pedalier" || !i.etat.meule) return;
        if (!this.inventaire.couteau) return this.info("Tu n'as pas de couteau abîmé à affûter (celui du kit de départ).");
        return this.commencer(
          "Affûter le couteau à la meule",
          30,
          () => {
            if (!this.inventaire.couteau) return;
            this.retirerPlusieurs({ couteau: 1 });
            this.ajouterPlusieurs({ couteau_aiguise: 1 });
            this.noterFait("affute");
            this.info("Le couteau coupe enfin (Couper 2).");
          },
          KCAL_PEDALAGE_EN_PLUS,
          "outil",
        );
      }
      // L'électricité (Book 25 §5) : réarmer la plaque, relever une clôture. La recharge se fait depuis la fiche du banc.
      case "rearmer_piege":
        if (this.electricite.rearmer(i)) return;
        break;
      case "poser_batteries":
        if (!porteBatteries(i.type)) return;
        // Le banc (0.8.2, R17) : une seule batterie, à demeure (serveur/src/electricite.ts).
        if (i.type === "banc_recharge") return this.electricite.poserBatterie(i);
        return this.poserBatteries(i);
      case "reprendre_batteries":
        if (!porteBatteries(i.type)) return;
        // La batterie du banc ne se reprend plus : elle s'échange.
        if (i.type === "banc_recharge") return this.electricite.echanger(i);
        return this.reprendreBatteries(i);
    }
  }

  /** Un geste depuis la fiche du banc (0.8.2, chantier C) : le banc à soi, à portée, de sa famille ; la base à jour. */
  private auBanc(id: number, faire: (banc: InstallationVue) => void): void {
    const banc = this.installations.get(id);
    if (!banc || banc.type !== "banc_recharge" || this.lieu !== "terrain" || this.voyage) return;
    if (!this.proche(banc.x, banc.z, DISTANCE_INTERACTION + 0.6)) return this.info("Approche-toi.");
    if (!this.saitSeServir(banc.type)) return this.info("C'est le savoir d'une autre famille : échange avec l'un des siens, à la halte ou au Carrefour.");
    this.mettreAJourBase(this.maintenant());
    faire(banc);
  }

  /** La batterie à charger en priorité : la petite, puis celle de voiture. */
  private batterieAvecPlace(): TypeBatterie | null {
    for (const b of BATTERIES) {
      const n = this.inventaire[b] ?? 0;
      if (n > 0 && (this.charges[b] ?? 0) < capacite(b, n) - 0.5) return b;
    }
    return null;
  }

  /** Ajoute de l'énergie à une batterie, sans dépasser sa capacité ; renvoie ce qui a été ajouté. */
  private ajouterCharge(b: TypeBatterie, wh: number): number {
    const max = capacite(b, this.inventaire[b] ?? 0);
    const avant = this.charges[b] ?? 0;
    const apres = Math.min(max, avant + wh);
    this.charges = { ...this.charges, [b]: apres };
    this.envoyerCharges();
    return apres - avant;
  }

  private chargesArrondies(): Charges {
    const c: Charges = {};
    for (const [b, wh] of Object.entries(this.charges) as [TypeBatterie, number][]) c[b] = Math.round(wh * 10) / 10;
    return c;
  }

  private envoyerCharges(): void {
    const c = this.chargesArrondies();
    const cle = JSON.stringify(c);
    if (cle === this.chargesEnvoyees) return;
    this.chargesEnvoyees = cle;
    this.envoyer({ t: "charges", charges: c });
  }

  // ---------- Inventaire ----------

  private retirer(type: CleObjet, n: number): void {
    const reste = (this.inventaire[type] ?? 0) - n;
    const inventaire = { ...this.inventaire };
    if (reste > 0) inventaire[type] = reste;
    else delete inventaire[type];
    this.inventaire = inventaire;
    this.base.sauverInventaire(this.compte.id, this.inventaire);
    this.envoyer({ t: "inventaire", inventaire: this.inventaire });
  }

  private ajouterPlusieurs(objets: Inventaire): void {
    const inventaire = { ...this.inventaire };
    for (const [type, n] of Object.entries(objets)) inventaire[type as TypeObjet] = (inventaire[type as TypeObjet] ?? 0) + (n ?? 0);
    this.inventaire = inventaire;
    this.base.sauverInventaire(this.compte.id, this.inventaire);
    this.envoyer({ t: "inventaire", inventaire: this.inventaire });
  }

  private retirerPlusieurs(objets: Inventaire): void {
    const inventaire = { ...this.inventaire };
    for (const [type, n] of Object.entries(objets)) {
      const reste = (inventaire[type as TypeObjet] ?? 0) - (n ?? 0);
      if (reste > 0) inventaire[type as TypeObjet] = reste;
      else delete inventaire[type as TypeObjet];
    }
    this.inventaire = inventaire;
    this.base.sauverInventaire(this.compte.id, this.inventaire);
    this.envoyer({ t: "inventaire", inventaire: this.inventaire });
  }

  private envoyerBesoins(): void {
    this.envoyer({ t: "besoins", besoins: this.besoins, gourde: this.gourde });
  }
}

/** « 1,5 kg », « 45 kg ». */
function kgTexte(kg: number): string {
  return `${(Math.round(kg * 100) / 100).toString().replace(".", ",")} kg`;
}

function poidsDe(objets: Inventaire): number {
  return poidsInventaire(objets);
}


function vue(feu: FeuEnBase): FeuVu {
  const accessoires = Object.keys(feu.accessoires ?? {});
  return {
    id: feu.id,
    x: feu.x,
    z: feu.z,
    bois: Math.round(feu.bois * 100) / 100,
    aspect: aspectFeu(feu),
    ...(feu.dakota ? { dakota: true } : {}),
    ...(niveauFeu(feu) > 1 ? { niveau: niveauFeu(feu) } : {}),
    ...(accessoires.length ? { accessoires } : {}),
    ...(feu.couvert ? { couvert: true } : {}),
    ...(feu.o !== undefined ? { o: feu.o } : {}),
  };
}
