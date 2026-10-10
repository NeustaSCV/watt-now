// Messages échangés entre le client et le serveur.
// Connexion et inscription passent par HTTP (JSON) ; le jeu passe par WebSocket (JSON).

import type { VueProgression } from "./progression.ts";
import type { OperationAdmin, VueAdmin } from "./admin.ts";
import type { FouilleVue, OperationDechets, PointDechetsVu, VueDechets } from "./couche-dechets.ts";
import type { Reglages } from "./reglages.ts";
import type { AnimalVu } from "./faune.ts";
import type { Apparence } from "./apparence.ts";
import type { Position } from "./deplacement.ts";
import type { MouvementRadeau } from "./gue.ts";
import type { Charges, TypeBatterie } from "./energie.ts";
import type { LieuId, LieuJouable } from "./lieux.ts";
import type { Saignement, TypeBlessure } from "./combat.ts";
import type { BruitVu } from "./bruits.ts";
import type { EteintVu, ResultatCoup } from "./eteints.ts";
import type { Inventaire, TypeObjet } from "./objets.ts";
import type { CleObjet } from "./etoiles.ts";
import type { BruitAction } from "./signature.ts";
import type { VueTutoriel } from "./tutoriel.ts";
import type { VueQuetes } from "./quetes.ts";
import type { TypeInstallation } from "./recettes.ts";
import type { Allure, Famille } from "./regles.ts";
import type { AspectFeu, Besoins, Gourde } from "./survie.ts";
import type { RessourceSol } from "./terrain.ts";

// ---------- HTTP ----------

export interface DemandeInscription {
  pseudo: string;
  motDePasse: string;
  famille: Famille;
}

export interface DemandeConnexion {
  pseudo: string;
  motDePasse: string;
}

export type ReponseAuth =
  | {
      ok: true;
      jeton: string;
      pseudo: string;
      famille: Famille;
      /** Vrai seulement juste après une création de personnage (/api/inscription) : le client montre alors, une
       *  seule fois, les trois écrans d'accueil (intro/NOTICE-DEV.md). Une connexion répond faux. */
      nouveau: boolean;
      /** L'apparence enregistrée à la création (celle que l'écran d'accueil n° 1 met en scène). */
      apparence?: Apparence;
    }
  | { ok: false; erreur: string };

// ---------- Objets du monde vus par le client ----------

export interface FeuVu {
  id: number;
  x: number;
  z: number;
  /** Bois restant, en kg. */
  bois: number;
  aspect: AspectFeu;
  /** Un foyer Dakota (P-002) : la voie creusée de la lignée du feu. */
  dakota?: boolean;
  /** Son niveau dans la lignée du feu (Book 24 §3.1). Absent : 1. */
  niveau?: number;
  /** Les accessoires montés (broche, marmite norvégienne). */
  accessoires?: string[];
  /** Couvert sous la cendre pour la nuit. */
  couvert?: boolean;
  /** L'orientation du muret réflecteur (foyer de pierres et au-delà). */
  o?: number;
}

export type Cible =
  | { genre: "ressource"; id: number }
  | { genre: "feu"; id: number }
  | { genre: "installation"; id: number }
  | { genre: "mare" }
  /** Un sac resté là après un effondrement (É3, lot 3). */
  | { genre: "sac"; id: number }
  /** Le pédalier des Compteurs (É4). */
  | { genre: "comptoir" }
  /** Un animal du terrain (la volaille, 2026-10-08). */
  | { genre: "animal"; id: number }
  /** Une porte de la Coopérative (Book 23 §2.2) : son identifiant dans le plan. */
  | { genre: "porte"; id: string }
  /** Un leurre du décor de la Coopérative (Book 23 §4.7) : le klaxon, la sonnette, la radio. */
  | { genre: "leurre"; id: string };

export type Verbe =
  | "ramasser"
  | "demonter"
  | "fouiller"
  | "ajouter_bois"
  | "allumer"
  | "bouillir"
  | "remplir"
  // Installations des familles (É2, lot 2)
  | "allumer_meule"
  | "defourner"
  | "monter_meule"
  | "monter_dynamo"
  | "pedaler"
  | "affuter"
  | "recharger"
  | "reprendre"
  | "pedaler_comptoir"
  | "remplir_pluie"
  | "dormir"
  | "poser_batteries"
  | "reprendre_batteries"
  /** Un objet lourd posé (l'escabeau) : le prendre dans les bras pour le déplacer. */
  | "porter"
  /** Chasse à la volaille : un coup, sur-le-champ. */
  | "assommer"
  /** Au feu : rôtir la volaille crue. */
  | "rotir"
  /** Une porte de la Coopérative : l'ouvrir, la refermer. */
  | "ouvrir_porte"
  | "fermer_porte"
  /** Un leurre du décor : klaxonner, sonner, allumer ou éteindre la radio. */
  | "actionner"
  /** La radio à piles : la prendre dans son sac (0.5.1). */
  | "prendre_radio"
  // Améliorer sa base (Book 24) : sur un feu ou une installation, sur place.
  | "ameliorer"
  | "redescendre"
  | "demonter_installation"
  | "creuser_dakota"
  | "combler"
  | "monter_broche"
  | "monter_marmite"
  | "couvrir"
  | "ranimer"
  /** Un piège, une plaque de choc (Book 25 §5.3 et §6.3) : le réarmer ; une clôture couchée : la relever (chantiers 6 et 7). */
  | "rearmer_piege"
  /** L'établi : y monter le redresseur de fûts (Book 25 §9.3, chantier 4) ; les flèches vont deux fois plus vite. */
  | "monter_redresseur"
  // La forge des Charbonniers (Book 25 §9.3, chantier 5) : ses accessoires (serveur/src/forge.ts).
  | "poser_enclume"
  | "poser_bac"
  | "verser_huile"
  | "monter_ventilateur"
  /** Au banc de recharge : recharger ses armes électriques (Voltaïques, chantier 6). */
  | "recharger_armes"
  /** Le pédalier des Mécanistes (Book 25 §6.4, chantier 7) : monter le ventilateur à manivelle, la meule fine. */
  | "monter_soufflet"
  | "monter_meule_fine"
  // Les meubles de famille (plan 0.8, chantier 7) : la pièce de la station, montée sur son meuble.
  /** Le banc solaire ⚡ : poser le panneau sur le banc. */
  | "poser_panneau"
  /** Le pédalier générateur ⚙️ : monter le petit alternateur, entraîné par la roue. */
  | "monter_alternateur";

/** État propre à certaines installations. */
export interface EtatInstallation {
  /** Charbonnière : instant réel (ms, horloge du serveur) où le charbon sera prêt ; absent si pas encore allumée. */
  pretLe?: number;
  /** Pédalier : accessoires montés. */
  meule?: boolean;
  dynamo?: boolean;
  /** Établi : le redresseur de fûts est monté (Book 25 §9.3). */
  redresseur?: boolean;
  /** Pédalier, accessoires mécanistes (Book 25 §6.4) : le ventilateur à manivelle (`soufflet`), la meule fine. */
  soufflet?: boolean;
  meuleFine?: boolean;
  /** Coffre : ce qu'il contient (la charge des batteries rangées est dans `charges`). */
  contenu?: Inventaire;
  /** Banc de recharge : les batteries posées dessus, leur charge, et le dernier calcul de production (É4). */
  batteries?: Partial<Record<TypeBatterie, number>>;
  charges?: Charges;
  majLe?: number;
  /** Escabeau (objet lourd) : dans les bras du joueur, en cours de déplacement. */
  portee?: boolean;
  /** Récupérateur de pluie : l'eau recueillie, en litres (le calcul se fait jusqu'à `majLe`). */
  litres?: number;
  /** Améliorer sa base (Book 24) : ce qui a été payé à chaque niveau au-delà du premier (pour redescendre ou démonter). */
  payes?: Inventaire[];
  /** Un piège, une plaque de choc, une clôture (Book 25 §5.3 et §6.3) : son état (serveur/src/declencheurs.ts). */
  declencheur?: EtatDeclencheur;
  /**
   * La forge (Book 25 §9.3, chantier 5) : l'enclume posée (absente : la pierre plate du foyer), le bac de trempe, l'huile
   * qu'il tient (en trempes), le ventilateur 12 V des Voltaïques (la forge ventilée souffle seule).
   */
  enclume?: "depanneur" | "etau" | "masse" | "rail";
  bac?: boolean;
  huile?: number;
  ventilateur?: boolean;
  /**
   * Les meubles de famille (plan 0.8, chantier 7) : le panneau posé sur le banc solaire ⚡ ; le petit alternateur monté
   * sur le pédalier générateur ⚙️ (le pédalier, comme le banc, porte aussi ses batteries : `batteries`, `charges`).
   */
  panneau?: boolean;
  alternateur?: boolean;
  /** La torche plantée (plan 0.8, chantier 6) : l'instant réel où elle s'éteint (absente : pas encore allumée ; passé : consumée). */
  eteinteLe?: number;
}

/** L'état d'une installation à déclencheur. */
export interface EtatDeclencheur {
  /** Armé : il prendra le prochain Éteint qui passe. Désarmé : il faut le réarmer (A sur le piège). */
  arme: boolean;
  /** Prises depuis qu'on l'a fait (les mâchoires de fortune se faussent au bout de 5). */
  prises: number;
  /** Faussé : il ne se réarme plus, il faut le refaire. */
  fausse?: boolean;
  /** Couché par des Éteints qui ont poussé ensemble (la clôture) : il faut la relever. */
  couche?: boolean;
}

export interface InstallationVue {
  id: number;
  type: TypeInstallation;
  x: number;
  z: number;
  /** Orientation en radians. */
  o: number;
  etat: EtatInstallation;
  /** Son niveau dans sa lignée (Book 24). Absent : 1. */
  niveau?: number;
}

// ---------- WebSocket : du client vers le serveur ----------

export type MessageClient =
  | { t: "intention"; dx: number; dz: number; allure: Allure; seq: number }
  | { t: "ping"; envoye: number }
  // Le métier des familles (Book 25 §2.3, chantier 3) : voir le bloc « savoir » en fin de fichier.
  | MessageClientSavoir
  // Le gué (plan 0.8, chantier 11) : voir le bloc « gué » en fin de fichier.
  | MessageClientGue
  // L'arbre de progression (0.7) : voir le bloc « progression » en fin de fichier.
  | MessageClientProgression
  // La couche de déchets (0.7) : voir le bloc « déchets » en fin de fichier.
  | MessageClientDechets
  // Reprendre une arme sur son meuble (plan 0.8, chantier 9) : voir le bloc « reprise » en fin de fichier.
  | MessageClientReprise
  // Les constats de l'interface (plan 0.8, chantier 14) : voir le bloc « constats » en fin de fichier.
  | MessageClientConstat
  | { t: "interagir"; cible: Cible; verbe: Verbe }
  | { t: "manger"; objet: TypeObjet }
  | { t: "boire" }
  | { t: "construire_feu"; x: number; z: number; dakota?: boolean }
  | { t: "fabriquer"; recette: string; x?: number; z?: number; o?: number }
  | { t: "lumiere"; allumee: boolean }
  | { t: "annuler" }
  /** Prendre la route depuis une sortie (É3). */
  | { t: "voyager"; vers: LieuId }
  /** Combat (É3, lot 3) : un coup (appuyé : visé à la tête), une esquive, un appui pour se dégager. */
  | { t: "frapper"; appuye: boolean }
  | { t: "esquiver"; dx: number; dz: number }
  | { t: "degager" }
  /** La pause (2026-10-09) : seulement là où l'on est seul (son terrain, sa Coopérative). */
  | { t: "pause"; oui: boolean }
  /** B selon la situation (Book 23 §4.4) : un Éteint à 1,2 m devant soi, on le repousse. */
  | { t: "repousser" }
  /** Réparer une arme (Book 23 §4.3) : de fortune (partout), ou pour de bon à l'atelier qui convient. */
  | { t: "reparer"; objet: CleObjet; fortune: boolean }
  | { t: "panser" }
  /** Au guichet des Compteurs (É4, Book 07). */
  | { t: "comptoir"; op: OperationComptoir }
  /** L'échange entre joueurs (É4, lot 3 : Book 07 §5, Book 21 §3.2 — une fenêtre, pas de chat). */
  | { t: "echange"; op: OperationEchange }
  /** Passer le tutoriel (É5). */
  | { t: "tutoriel_passer" }
  /** Le compte admin (outil du porteur, commun/src/admin.ts) : refusé à tout autre compte, vérifié à chaque fois. */
  | { t: "admin"; op: OperationAdmin }
  /** Ranger un objet dans un coffre, ou l'en sortir. */
  | { t: "coffre"; id: number; sens: "deposer" | "prendre"; objet: CleObjet; quantite: number }
  /** Jeter un objet par terre (quand le sac est trop lourd) : il reste au sol, ramassable. */
  | { t: "jeter"; objet: CleObjet; quantite: number }
  /** Démonter un vestige du sac en composants (Vestiges, lot 1, 0.3 ; table DEMONTAGE). */
  | { t: "demonter"; objet: TypeObjet }
  /** Poser devant soi l'objet lourd qu'on porte. */
  | { t: "poser" }
  /** Poser à ses pieds la radio à piles qu'on a dans le sac (à la Coopérative, 0.5.1). */
  | { t: "poser_radio" }
  /** Équiper une arme pour le mode Combat (null : plus d'arme choisie, la meilleure du sac) (P-005). */
  | { t: "equiper"; objet: CleObjet | null }
  /** Les images par seconde de l'appareil, chaque minute (mesures du test familial, Book 17 §6). */
  | { t: "mesures"; ips: number; ipsBas: number; appareil: string; qualite: string }
  // ---- Le lancer et le tir (Book 23 §5, Book 25 §3.4 et §10.3, chantier 1 · 0.6) ----
  /** L'objet rapide : « Prêt à lancer » (pierre, réveil, hachette) ou « Prêt à tirer » (arc, arbalète) ; null : la pierre. */
  | { t: "preparer"; objet: CleObjet | null }
  /** Le bouton Lancer enfoncé : l'arc se bande (le serveur compte le temps tenu : tir rapide ou tir plein). */
  | { t: "bander" }
  /**
   * Le bouton Lancer relâché : l'objet part dans la direction (dx, dz). `cible` : l'Éteint accroché (une arme) ;
   * `distance` : le point visé (un leurre). Le serveur vérifie tout et décide de l'impact.
   */
  | { t: "lancer"; dx: number; dz: number; cible?: number; distance?: number }
  /** Réarmer l'arbalète : un geste, immobile (chantier 7). */
  | { t: "rearmer" }
  /** Recharger un pack à la manivelle de la lampe à dynamo (Voltaïques, chantier 6). */
  | { t: "manivelle"; objet: CleObjet };

export type OperationEchange =
  /** Proposer un échange à un joueur proche. */
  | { genre: "proposer"; a: number }
  | { genre: "repondre"; accepte: boolean }
  /** Ce que je pose dans la fenêtre (remplace mon offre précédente). */
  | { genre: "offrir"; offre: OffreEchange }
  | { genre: "accord"; oui: boolean }
  | { genre: "annuler" };

export interface OffreEchange {
  objets: Inventaire;
  wotts: number;
}

export interface Personne {
  id: number;
  pseudo: string;
  famille: Famille;
}

/** Ce que voit le joueur de l'échange en cours. */
export interface EchangeVu {
  avec: Personne;
  moi: OffreEchange;
  lui: OffreEchange;
  accordMoi: boolean;
  accordLui: boolean;
}

/** Un autre joueur dans le même lieu public (halte, comptoir). */
export interface AutreVu extends Personne {
  x: number;
  z: number;
  o: number;
  /** Sa lumière portée allumée (on la voit de loin la nuit). */
  lumiere: boolean;
  /** Son apparence (Book 14 §3) : on reconnaît les gens. */
  apparence: Apparence;
}

export type OperationComptoir =
  /** Un exemplaire étoilé (« machette_forgee#4 ») se vend et s'achète à son prix (Book 25 §4.2, 0.6). */
  | { genre: "vendre"; objet: CleObjet; quantite: number }
  | { genre: "acheter"; objet: CleObjet; quantite: number }
  /** Déposer l'électricité d'un type de batterie (crée des wotts), ou en racheter pour la recharger. */
  | { genre: "deposer"; batterie: TypeBatterie }
  | { genre: "retirer"; batterie: TypeBatterie }
  /** Mettre des bons à l'abri sur son compte, ou les reprendre. */
  | { genre: "verser"; montant: number }
  | { genre: "tirer"; montant: number };

/** Ce que le joueur voit du guichet. */
export interface VueComptoir {
  stock: Inventaire;
  /** Ce que le comptoir paie, objet par objet (null : il n'achète pas). */
  achats: Partial<Record<TypeObjet, number | null>>;
  tresorerieBasse: boolean;
  /** Énergie disponible au retrait, en Wh_é. */
  reserveWh: number;
}

/** Le rapport de la base (Book 01 §2 bis) : ce qui a tourné, ce qui s'est arrêté, et pourquoi. */
export interface RapportBase {
  /** Durée de l'absence, en ms. */
  absence: number;
  /** Électricité du panneau : produite, mise en batterie, perdue (batteries pleines ou absentes). */
  produit: number;
  stocke: number;
  perdu: number;
  /** Charge des batteries du banc au retour. */
  surLeBanc: Charges;
  /** Wh perdus par la décharge des batteries portées et posées. */
  decharge: number;
  /** La charbonnière : prête, ou minutes restantes. */
  charbonniere: "prete" | number | null;
  /** Les feux : encore allumés, éteints faute de bois. */
  feuxAllumes: number;
  feuxEteints: number;
  /** Ce qui a repoussé sur le terrain. */
  repousse: number;
  /** Ce que la décharge a fait remonter pendant l'absence (P-001). */
  decharge_remonte?: number;
}

/** Les wotts du joueur : en bons dans la poche, et sur son compte au comptoir (valeur du moment). */
export interface WottsVus {
  poche: number;
  compte: number;
}

/** La santé vue par le joueur (Book 05 §11). */
export interface SanteVue {
  points: number;
  saignement: Saignement;
  blessures: TypeBlessure[];
  convalescence: boolean;
  /** Malade d'un champignon toxique (les symptômes sont là). */
  intoxique?: boolean;
}

/** Un sac tombé au sol après un effondrement : on peut revenir le chercher (Book 05 §10.3). */
export interface SacVu {
  id: number;
  x: number;
  z: number;
  aMoi: boolean;
  /** Des objets jetés par terre (et non un sac perdu) : n'importe qui peut les ramasser. */
  jete?: boolean;
  /** Ce qu'il y a dans le tas (seulement pour les objets jetés : un sac perdu reste fermé). */
  contenu?: Inventaire;
}

// ---------- WebSocket : du serveur vers le client ----------

export interface Moi {
  id: number;
  pseudo: string;
  famille: Famille;
  /** L'apparence choisie à la création (Book 14 §3). */
  apparence: Apparence;
  /** Le compte admin seulement (commun/src/admin.ts) : son menu ⚙ montre les gestes admin. */
  admin?: VueAdmin;
}

export interface Bienvenue {
  t: "bienvenue";
  moi: Moi;
  /** Le lieu où se trouve le personnage : son terrain ou la halte (É3). */
  lieu: LieuJouable;
  position: Position;
  terrain: { taille: number };
  tickHz: number;
  /** Début du monde (ms) et heure du serveur à l'envoi : le client en déduit l'heure de jeu. */
  temps: { debutMonde: number; serveur: number };
  inventaire: Inventaire;
  besoins: Besoins;
  gourde: Gourde;
  ressources: RessourceSol[];
  feux: FeuVu[];
  installations: InstallationVue[];
  charges: Charges;
  lumiere: boolean;
  /** Les Éteints du lieu (É3). */
  eteints: EteintVu[];
  sante: SanteVue;
  endurance: number;
  sacs: SacVu[];
  wotts: WottsVus;
  tutoriel: VueTutoriel | null;
  /** Les quêtes après le tutoriel (Book 22) ; null pendant le tutoriel. */
  quetes: VueQuetes | null;
  /** L'arme équipée pour le combat (P-005) ; null : la meilleure du sac. */
  arme: CleObjet | null;
  /** Au comptoir seulement. */
  comptoir?: VueComptoir;
  /** À la Coopérative seulement : l'état de ses portes (ouverte : true). */
  portes?: Record<string, boolean>;
  /** À la Coopérative seulement : les leurres en marche (la radio allumée). */
  leurres?: string[];
  /** À la Coopérative seulement : où est la radio, et ce qui reste à la batterie du tracteur (0.5.1). */
  etatCoop?: EtatCoopVu;
  /** L'usure des armes (coups qui restent ; absente : neuve). */
  usure?: Partial<Record<CleObjet, number>>;
  /** La charge des armes électriques, par exemplaire (Wh qui restent ; absente : pleine), Book 25 §5.4. */
  charge?: Partial<Record<CleObjet, number>>;
  /** La volaille du terrain (2026-10-08). */
  animaux?: AnimalVu[];
  /** L'objet rapide choisi (« Prêt à lancer / Prêt à tirer », 0.6) ; absent : la pierre. */
  pret?: CleObjet | null;
  /** Ce qu'on a appris hors de sa famille (Book 25 §2.3) ; absent : rien. */
  savoir?: SavoirVu;
  /** Les recettes dévoilées, vues, et le prochain palier (l'arbre de progression, 0.7). */
  progression?: VueProgression;
  /** La couche de déchets du lieu (0.7) : de quoi reconstruire les amas, les conteneurs et les points (≈ 1 Ko). */
  dechets?: VueDechets;
}

/**
 * Ce que le joueur sait de sa Coopérative (Book 23 §4.7, 0.5.1) : où est la radio (null : dans un sac), et combien
 * de coups de klaxon il reste à la batterie du tracteur (sa charge s'en déduit ; la batterie prise : voir la ressource).
 */
export interface EtatCoopVu {
  radio: { x: number; z: number } | null;
  klaxons: number;
}

export type MessageServeur =
  | Bienvenue
  | { t: "etat"; position: Position; seq: number }
  | { t: "pong"; envoye: number; serveur: number }
  // Le métier des familles (Book 25 §2.3, chantier 3) : voir le bloc « savoir » en fin de fichier.
  | MessageServeurSavoir
  // Le gué (plan 0.8, chantier 11) : voir le bloc « gué » en fin de fichier.
  | MessageServeurGue
  // Un avertissement fermé par un bouton (plan 0.8, chantier 13) : voir le bloc en fin de fichier.
  | MessageServeurAvertissement
  // L'arbre de progression (0.7) : voir le bloc « progression » en fin de fichier.
  | MessageServeurProgression
  // La couche de déchets (0.7) : voir le bloc « déchets » en fin de fichier.
  | MessageServeurDechets
  // Reprendre une arme sur son meuble (plan 0.8, chantier 9) : voir le bloc « reprise » en fin de fichier.
  | MessageServeurReprise
  | { t: "expulse"; raison: string }
  | { t: "inventaire"; inventaire: Inventaire }
  | { t: "besoins"; besoins: Besoins; gourde: Gourde }
  | { t: "ressource"; id: number; disponible: boolean; reste?: number }
  | { t: "feu"; feu: FeuVu }
  | { t: "installation"; installation: InstallationVue }
  | { t: "installation_retiree"; id: number }
  /** Un feu démonté (Book 24 §2.4). */
  | { t: "feu_retire"; id: number }
  | { t: "charges"; charges: Charges }
  /** `duree` : la durée totale ; `deja` : la part déjà faite (un geste long repris), de 0 à 1. */
  | { t: "action"; etat: "debut"; libelle: string; duree: number; bruit: BruitAction; deja?: number }
  | { t: "action"; etat: "fin" | "annulee" }
  | { t: "info"; texte: string }
  /** Un conseil discret (comment s'y prendre) : affiché en petit, sans gêner le jeu (2026-10-08). */
  | { t: "indice"; texte: string }
  | { t: "lumiere"; allumee: boolean }
  /** Départ sur la route : le client montre le trajet sur la carte ; l'arrivée est un nouveau `bienvenue`. */
  | { t: "voyage"; de: LieuId; vers: LieuId; duree: number }
  /** Positions des Éteints du lieu, quelques fois par seconde. */
  | { t: "eteints"; eteints: EteintVu[] }
  /** Ce qu'on entend sans le voir (0.7.2, bruits.ts) : genre, force, point de passage de notre côté ; jamais la source. */
  | { t: "bruits"; bruits: BruitVu[] }
  /** Les réglages d'équilibrage qui diffèrent du défaut (à la connexion, puis à chaque changement). */
  | { t: "reglages"; reglages: Partial<Reglages> }
  /** La volaille du terrain, quelques fois par seconde. */
  | { t: "animaux"; animaux: AnimalVu[] }
  /** Santé, endurance, et combien d'Éteints le tiennent. */
  | { t: "sante"; sante: SanteVue; endurance: number; saisi: number }
  /** Un coup a porté : le client en tire le sang et l'impact. */
  | { t: "coup"; id: number; x: number; z: number; resultat: ResultatCoup; electrique?: true }
  | { t: "morsure" }
  /** Il s'effondre : le client montre le réveil, puis arrive un `bienvenue` sur le terrain. */
  | { t: "effondrement" }
  | { t: "sacs"; sacs: SacVu[] }
  /** L'usure des armes (coups qui restent ; absente : neuve), et ce qui vient d'arriver à l'une d'elles (Book 23 §4.3). */
  | { t: "usure"; usure: Partial<Record<CleObjet, number>>; evenement?: { objet: CleObjet; etat: "abimee" | "cassee" | "reparee" }; charge?: Partial<Record<CleObjet, number>> }
  /** Un leurre de la Coopérative s'est déclenché, ou s'est tu (la radio). */
  | { t: "leurre"; id: string; actif: boolean; x: number; z: number }
  /** La radio a changé de place, ou le klaxon a sonné (0.5.1). */
  | { t: "etat_coop"; etat: EtatCoopVu }
  /** La pause est prise (ou refusée), ou finie. */
  | { t: "pause"; oui: boolean }
  /** L'état des portes de la Coopérative (ouverte : true), à chaque changement (0.5b). */
  | { t: "portes"; portes: Record<string, boolean> }
  | { t: "wotts"; wotts: WottsVus }
  /** À la reconnexion : ce que la base a fait pendant l'absence (Book 01 §2 bis). */
  | { t: "rapport"; rapport: RapportBase }
  | { t: "comptoir"; comptoir: VueComptoir }
  /** Le carnet du tutoriel (É5) ; null : terminé. */
  | { t: "tutoriel"; tutoriel: VueTutoriel | null }
  /** Le carnet des quêtes a changé (un compteur, une réussite). */
  | { t: "quetes"; quetes: VueQuetes | null }
  /** L'arme équipée a changé (P-005). */
  | { t: "arme"; arme: CleObjet | null }
  /** Une alarme à boîtes de conserve tinte sur le terrain (P-002). */
  | { t: "alarme"; x: number; z: number }
  /** On s'endort (dans l'abri ou par terre) ou on se réveille (É5). */
  | { t: "sommeil"; dort: boolean; dansUnAbri: boolean }
  /** Les autres joueurs du lieu, plusieurs fois par seconde (É4, lot 3). */
  /** L'identité des autres joueurs en vue (envoyée seulement quand elle change ou que quelqu'un entre ou sort du champ). */
  | { t: "autres"; joueurs: AutreVu[] }
  /** Leurs positions, 10 fois par seconde : id, x, z, orientation, à la suite (Book 17 §5.2). */
  | { t: "positions"; p: number[] }
  | { t: "demande_echange"; de: Personne }
  /** L'échange en cours (null : terminé ou annulé). */
  | { t: "echange"; echange: EchangeVu | null }
  // ---- Le lancer et le tir (chantier 1 · 0.6) ----
  /** Ce qui est prêt à lancer (null : la pierre, s'il y en a), et si l'arbalète est armée. */
  | { t: "pret"; objet: CleObjet | null; armee?: boolean }
  /** Un objet en vol, du lanceur au point d'impact : le client le dessine, puis montre l'impact. */
  | { t: "projectile"; projectile: ProjectileVu };

/** Un projectile, vu par le client (Book 25 §10.3) : d'où il part, où il arrive, et ce qu'il y fait. */
export interface ProjectileVu {
  /** Qui l'a lancé. */
  de: number;
  /** Ce qui vole : la pierre, le réveil, la hachette, la flèche… */
  objet: TypeObjet;
  x0: number;
  z0: number;
  x1: number;
  z1: number;
  /** Durée du vol (ms). */
  duree: number;
  /** Ce qu'il heurte : un Éteint, un mur, le sol, l'eau de la mare. */
  impact: "eteint" | "mur" | "sol" | "eau";
  /** Un Éteint touché : lequel, et ce que ça lui a fait (le client en tire le sang, comme pour un coup). */
  coup?: { id: number; resultat: ResultatCoup };
  /** Une flèche ou un carreau (tendu, presque à plat) plutôt qu'un objet lancé en cloche. */
  tir?: true;
  /** Au gué (G8) : un galet bien lancé touche l'eau là, puis ricoche de point en point jusqu'à (x1, z1). */
  ricochets?: { x: number; z: number }[];
}

/** Code de fermeture WebSocket quand le jeton est refusé : le client doit redemander la connexion. */
export const FERMETURE_JETON_REFUSE = 4001;
/** Code de fermeture quand le même compte s'est connecté ailleurs. */
export const FERMETURE_REMPLACE = 4002;
/** Code de fermeture quand le joueur n'a rien fait depuis un moment (réglage `inactivite_min`) : ses besoins se figent. */
export const FERMETURE_INACTIF = 4003;

// ---------- Le savoir : leçons et manuels (Book 25 §2.3, chantier 3 de la 0.6) ----------

/** Ce que le joueur sait hors de sa famille : les recettes apprises en leçon, les familles dont il a lu le manuel. */
export interface SavoirVu {
  apprises: string[];
  manuels: Famille[];
}

export type OperationLecon =
  /** Le maître demande ce qu'il peut enseigner au joueur `a` (le serveur répond par « lecons_possibles »). */
  | { genre: "choisir"; a: number }
  /** Le maître propose une recette de son métier au joueur `a`. */
  | { genre: "proposer"; a: number; recette: string }
  /** L'élève accepte ou refuse. */
  | { genre: "repondre"; accepte: boolean }
  /** L'un ou l'autre arrête la leçon. */
  | { genre: "annuler" };

/** La leçon en cours, vue par l'un des deux. */
export interface LeconVue {
  avec: Personne;
  recette: string;
  role: "maitre" | "eleve";
  /** Sa durée, en secondes réelles (elle commence à la réception). */
  duree: number;
}

export type MessageClientSavoir =
  | { t: "lecon"; op: OperationLecon }
  /** Lire un manuel du sac : il ouvre les recettes d'une famille. */
  | { t: "lire"; objet: TypeObjet };

export type MessageServeurSavoir =
  | { t: "savoir"; savoir: SavoirVu }
  /** Le statut de l'admin a changé (invincible ou non). */
  | { t: "admin"; admin: VueAdmin }
  /** Ce que le maître peut enseigner à ce joueur (les recettes de son métier qu'il ne sait pas). */
  | { t: "lecons_possibles"; a: Personne; recettes: string[] }
  | { t: "demande_lecon"; de: Personne; recette: string }
  | { t: "lecon"; lecon: LeconVue | null };

// ---------- L'arbre de progression : les recettes dévoilées (0.7, commun/src/progression.ts) ----------

export type MessageClientProgression =
  /** Le client a montré ces cartes (« Nouveau ») : elles ne comptent plus dans la pastille. */
  { t: "recettes_vues"; recettes: string[] };

export type MessageServeurProgression =
  /**
   * Des recettes dévoilées (`nouvelles`), ou la liste qui change (les autres familles). `texte` : « Tu y penses : … »,
   * au plus un toutes les 10 s (les idées d'entre-temps sont regroupées).
   */
  | { t: "devoilement"; progression: VueProgression; nouvelles: string[]; texte?: string }
  /**
   * « Tu y penses » (plan 0.8 §2.2) : la première fois qu'une clé entre dans le sac (ou l'outil clé en main), l'idée de
   * l'étape qu'elle ouvre (`etape`), dans la voix du carnet ; `plusTard` : le niveau d'avant n'est pas posé (« un jour »).
   * Jamais au deuxième ramassage.
   */
  | { t: "idee"; etape: string; texte: string; plusTard: boolean; objet?: TypeObjet };

// ---------- La couche de déchets : ramasser, fouiller, démonter (0.7, commun/src/couche-dechets.ts) ----------

export type MessageClientDechets = { t: "dechets"; op: OperationDechets };

export type MessageServeurDechets =
  /** Un carreau a changé : une pièce prise, ou un remplissage neuf (`pris` vide). */
  | { t: "dechets_carreau"; cx: number; cz: number; r: number; pris: number[] }
  /** Un point a changé : démonté, vidé, revenu (ailleurs). */
  | { t: "dechets_point"; point: PointDechetsVu }
  /** La liste du conteneur qu'on fouille (null : refermé). */
  | { t: "fouille"; fouille: FouilleVue | null };

// ---------- Reprendre une arme sur son meuble (plan 0.8, chantier 9 ; commun/src/evolution-armes.ts) ----------

/** Réparer l'arme à son niveau, ou la monter d'une étoile. */
export type GesteRepriseArme = "reparer" | "monter";

export type MessageClientReprise =
  /** « Reprendre l'arme » (R-ARMES-5), près de son meuble : la réparer, ou la monter d'une étoile. */
  { t: "reprendre_arme"; objet: CleObjet; geste: GesteRepriseArme };

export type MessageServeurReprise =
  /**
   * L'arme est reprise : réparée (`avant` = `apres`), ou montée d'une étoile (le même exemplaire, sa clé a changé
   * d'étoile). Le client fait briller l'étoile qui s'ajoute dans le sac.
   */
  { t: "arme_reprise"; avant: CleObjet; apres: CleObjet; geste: GesteRepriseArme };

// ---------- Le gué : le bac, la cloche (plan 0.8, chantier 11 ; commun/src/gue.ts, serveur/src/gue.ts) ----------

export type MessageClientGue =
  /** Haler le bac (à bord, ou le rappeler depuis la cale ou le ponton), sonner la cloche du passeur. */
  { t: "gue"; op: "haler" | "cloche" };

export type MessageServeurGue =
  /** Le radeau du bac : sa place et où il va (le client le prolonge seul) ; `cloche` : la cloche du passeur sonne. */
  { t: "gue"; radeau: MouvementRadeau; cloche?: true };

// ---------- Un avertissement, fermé par un bouton (plan 0.8 §2.6, chantier 13 ; commun/src/tutoriel.ts) ----------

export type MessageServeurAvertissement =
  /**
   * Un bandeau dans la charte du carnet, fermé par son bouton (`bouton` : « Compris »), jamais par une croix (règle du
   * porteur). `id` : de quoi il parle (« buche » : une bûche du terrain mise au feu, B14).
   */
  { t: "avertissement"; id: "buche"; texte: string; bouton: string };

// ---------- Les constats de l'interface (plan 0.8, chantier 14 ; serveur/src/mesures.ts) ----------

export type MessageClientConstat =
  /**
   * Ce que le client signale pour les mesures du test (avis-game-designer.md §5.2) : la fiche d'une construction ouverte
   * sans pouvoir l'améliorer (`construction` : son type), l'aide « Je suis coincé » ouverte. Le serveur en fait un fait.
   */
  { t: "constat"; quoi: "fiche_bloquee" | "aide_coince"; construction?: string };
