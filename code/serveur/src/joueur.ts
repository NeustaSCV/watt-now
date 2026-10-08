// Un joueur connecté, côté serveur : déplacement, besoins, inventaire, actions, feux de son terrain.
// Le serveur fait autorité : chaque action est vérifiée (distance, inventaire, état) avant d'être appliquée.

import { raisonEmplacement } from "../../commun/src/emplacement.ts";
import { RASSASIE_HEURES } from "../../commun/src/survie.ts";
import { ceQuiManque, outilsManquants, ouTrouverPhrase } from "../../commun/src/aide-fabrication.ts";
import { categorieAction, type GenreMesure } from "./mesures.ts";
import { REGLAGES } from "../../commun/src/reglages.ts";
import { enSaison, etatDuFruitier, jourDuCalendrier, prochaineRecolte } from "../../commun/src/calendrier.ts";
import { nouvellePoule, penserPoule, vuePoule, type Poule } from "../../commun/src/faune.ts";
import type { Apparence } from "../../commun/src/apparence.ts";
import { INTENTION_REPOS, avancer, nettoyerIntention, type Intention, type Position } from "../../commun/src/deplacement.ts";
import type { Bienvenue, Cible, FeuVu, InstallationVue, MessageClient, MessageServeur } from "../../commun/src/messages.ts";
import { CAPACITE_COFFRE, CAPACITE_SAC, CONTENANTS, OBJETS, capaciteDe, estObjet, lumierePortee, nommer, poidsInventaire, type Inventaire, type TypeObjet } from "../../commun/src/objets.ts";
import { NOMS_INSTALLATIONS, RECETTES, dureeReelle, ingredientsPresents, multiplicateurQualites, recette, recettesConnues, type TypeInstallation } from "../../commun/src/recettes.ts";
import {
  CHARBON_PRODUIT,
  CHARGE_TROUVEE,
  CONSOMMATION_FRONTALE,
  DUREE_CHARBONNIERE_MS,
  DUREE_PEDALAGE,
  KCAL_PEDALAGE_EN_PLUS,
  RENDEMENT_BANC,
  WH_RECHARGE_PAR_HEURE,
  capacite,
  decharger,
  whEDePedalage,
  type Charges,
  type TypeBatterie,
} from "../../commun/src/energie.ts";
import { GESTE_TENU_MAX_S, PROGRESSION_GARDEE_MS, TERRAIN_TAILLE, TICK_HZ } from "../../commun/src/regles.ts";
import {
  BOIS_INITIAL_FEU,
  BOIS_MAX_FEU,
  BOIS_PAR_LITRE_BOUILLI,
  CONTENANCE_GOURDE,
  DUREES,
  EFFORT_PAR_ALLURE,
  GORGEE,
  RECETTE_FEU,
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
import { DISTANCE_INTERACTION, PORTEE_ARBRE, distanceMare, RAYON_ESCABEAU, REPOUSSE_MS, USAGES, estFruitier } from "../../commun/src/terrain.ts";
import { heuresEcoulees } from "../../commun/src/temps.ts";
import {
  DUREE_VOYAGE_S,
  EAU_PAR_KM,
  KCAL_PAR_KM,
  LIEUX,
  arriveeDans,
  distanceKm,
  sortieIci,
  zoneDe,
  type LieuId,
  type LieuJouable,
} from "../../commun/src/lieux.ts";
import { vueDuSac, type Base, type Compte, type FeuEnBase, type RessourceEnBase, type SacEnBase as SacPose } from "./base.ts";
import { Halte, type Voyageur } from "./halte.ts";
import { Comptoir } from "./comptoir.ts";
import {
  PRIX_RETRAIT,
  WOTTS_PAR_WH_M,
  ajouterWotts,
  formaterWotts,
  prixAchat,
  prixVente,
  valeurWotts,
  type Wotts,
} from "../../commun/src/economie.ts";
import { BONUS_MECANISTE, PORTEE_CABLE_PANNEAU, WH_M_PAR_HEURE, productionPanneau, stocker } from "../../commun/src/energie.ts";
import type { AutreVu, OffreEchange, OperationComptoir, RapportBase, WottsVus } from "../../commun/src/messages.ts";
import { COMPTOIR, etapeVers } from "../../commun/src/lieux.ts";
import type { Quete, VueQuetes } from "../../commun/src/quetes.ts";
import { SuiviQuetes, type EtatJoueurPourQuetes } from "./quetes.ts";
import { debout, encaisser, lacher, nouvelEteint, penser, vue as vueEteint, type Eteint, type Humain } from "../../commun/src/eteints.ts";
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
  ENDURANCE_RECUPERATION,
  ESQUIVE,
  NIVEAU_APRES_EFFONDREMENT,
  SEUIL_EPUISE,
  aggraver,
  evoluer,
  freinSaisie,
  intoxiquer,
  meilleureArme,
  panser,
  seRelever,
  symptomes,
  type Sante,
} from "../../commun/src/combat.ts";
import { ALLURES, POINT_ARRIVEE } from "../../commun/src/regles.ts";
import type { SacVu, SanteVue } from "../../commun/src/messages.ts";
import type { SacEnBase } from "./base.ts";
import { CHARBONNIERE_ODEUR, FEU_LUMIERE_NUIT, FEU_ODEUR, stimuliJoueur, type BruitAction, type Stimulus } from "../../commun/src/signature.ts";
import { estNuit, heureDeJeu } from "../../commun/src/temps.ts";
import { attenuationMeteo, meteo } from "../../commun/src/meteo.ts";
import { NOMBRE_ETAPES, etapesTutoriel, type EtatTutoriel, type VueTutoriel } from "../../commun/src/tutoriel.ts";

const JAMAIS = Number.MAX_SAFE_INTEGER;
const MAX_FEUX = 3;
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

const BATTERIES: TypeBatterie[] = ["petite_batterie", "batterie_voiture"];
/** Au comptoir, rien à ramasser : l'esplanade est entretenue par les Compteurs. */
const SANS_RESSOURCES = new Map<number, RessourceEnBase>();

interface Voyage {
  de: LieuId;
  vers: LieuJouable;
  arrivee: number;
}

export class Joueur implements Voyageur {
  readonly compte: Compte;
  position: Position;
  /** Le lieu où se trouve le personnage (É3). */
  lieu: LieuJouable;
  private voyage: Voyage | null = null;
  private readonly halte: Halte;
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
  private bouge = false;
  // ---------- Combat et santé (É3, lot 3) ----------
  private sante: Sante;
  private endurance: number;
  /** Jusqu'à quand il ne peut pas être saisi (esquive), et l'élan qui le pousse. */
  private esquiveJusqua = 0;
  private elan: { dx: number; dz: number; restant: number } | null = null;
  private prochaineFrappe = 0;
  private bruitCoupJusqua = 0;
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
  private sommeil: { dansUnAbri: boolean } | null = null;
  /** Le tutoriel en cours (null : terminé ou passé). */
  private tuto: EtatTutoriel | null;
  private derniereVerifTuto = 0;
  /** Les quêtes après le tutoriel (Book 22). */
  private readonly quetes: SuiviQuetes;
  private derniereVerifQuetes = 0;
  /** Le carnet des quêtes déjà envoyé (on ne le renvoie que s'il change). */
  private derniereVueQuetes = "";
  private quetesASauver = false;
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

  private readonly base: Base;
  readonly envoyer: (message: MessageServeur) => void;
  private readonly maintenant: () => number;

  constructor(
    compte: Compte,
    base: Base,
    envoyer: (message: MessageServeur) => void,
    maintenant: () => number = Date.now,
    halte: Halte = new Halte(base),
    alea: () => number = Math.random,
    comptoir: Comptoir = new Comptoir(base),
  ) {
    this.compte = compte;
    this.base = base;
    this.envoyer = envoyer;
    this.maintenant = maintenant;
    this.halte = halte;
    this.alea = alea;
    this.comptoir = comptoir;
    const w = base.chargerWotts(compte.id);
    this.poche = w.poche;
    this.compteWotts = w.compte;
    this.debutMonde = base.debutMonde();
    this.tuto = base.chargerTutoriel(compte.id);
    this.quetes = new SuiviQuetes(base.chargerQuetes(compte.id));
    this.apparence = base.chargerApparence(compte.id, compte.famille);
    this.faune = base.chargerFaune(compte.id);
    const { sante, endurance } = base.chargerSante(compte.id);
    this.sante = sante;
    this.endurance = endurance;
    this.sacsTerrain = base.chargerSacs("terrain", compte.id);

    const perso = base.chargerPersonnage(compte.id);
    if (!perso) throw new Error(`Personnage introuvable pour le compte ${compte.id}`);
    this.position = perso.position;
    this.lieu = perso.lieu;
    if (this.lieu === "station") {
      // Reconnexion dans la halte : on réapparaît à l'entrée la plus proche (Book 01 §2 bis).
      this.position = arriveeDans("station", this.position.x < 100 ? "terrain" : "comptoir");
      halte.entrer(this);
    }
    if (this.lieu === "comptoir") {
      this.position = arriveeDans("comptoir", "station");
      comptoir.entrer(this.envoyer);
    }
    this.besoins = perso.besoins;
    this.gourde = perso.gourde;
    this.inventaire = base.chargerInventaire(compte.id);
    for (const r of base.chargerRessources(compte.id)) this.ressources.set(r.id, r);
    for (const i of base.chargerInstallations(compte.id)) {
      // Parti avec l'escabeau dans les bras : il est resté là où on l'a lâché.
      if (i.etat.portee) {
        i.etat = { ...i.etat, portee: false };
        base.sauverEtatInstallation(compte.id, i.id, i.etat);
      }
      this.installations.set(i.id, i);
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
    if (this.lieu === "terrain" && abri && perso.vuLe > 0 && instant - perso.vuLe >= 8 * 60_000) this.besoins = { ...this.besoins, repos: 1 };

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
      };
    }
    for (const b of BATTERIES) {
      const n = this.inventaire[b] ?? 0;
      if (n > 0 && this.charges[b] === undefined) this.charges[b] = Math.min(CHARGE_TROUVEE[b] * n, capacite(b, n));
    }
  }

  bienvenue(debutMonde: number): Bienvenue {
    const instant = this.maintenant();
    return {
      t: "bienvenue",
      moi: { id: this.compte.id, pseudo: this.compte.pseudo, famille: this.compte.famille, apparence: this.apparence },
      lieu: this.lieu,
      position: this.position,
      terrain: { taille: TERRAIN_TAILLE },
      tickHz: TICK_HZ,
      temps: { debutMonde, serveur: instant },
      inventaire: this.inventaire,
      besoins: this.besoins,
      gourde: this.gourde,
      ressources: [...this.ressourcesIci().values()].map((r) => ({ id: r.id, type: r.type, x: r.x, z: r.z, disponible: r.disponibleLe <= instant })),
      feux: this.lieu === "terrain" ? [...this.feux.values()].map(vue) : [],
      installations: this.lieu === "terrain" ? [...this.installations.values()] : [],
      charges: this.chargesArrondies(),
      lumiere: this.lumiere,
      eteints: this.lieu === "station" ? this.halte.eteintsVus(this.position) : this.eteints.map(vueEteint),
      animaux: this.lieu === "terrain" ? this.peuplerPoules().map(vuePoule) : [],
      sante: this.santeVue(),
      endurance: Math.round(this.endurance),
      sacs: this.sacsVus(),
      wotts: this.wottsVus(),
      tutoriel: this.vueTutoriel(),
      quetes: this.vueQuetes(),
      ...(this.lieu === "comptoir" ? { comptoir: this.comptoir.vue(instant) } : {}),
    };
  }

  // ---------- Réception ----------

  recevoir(message: MessageClient): void {
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
        this.construireFeu(message.x, message.z);
        return;
      case "fabriquer":
        this.fabriquer(message.recette, message.x, message.z, message.o);
        return;
      case "lumiere":
        if (message.allumee && !lumierePortee(this.inventaire)) return this.info("Tu n'as rien pour t'éclairer : une torche, une lampe frontale ou une lanterne. Chacune est dans le kit de départ d'une famille : échange-la avec un autre joueur.");
        if (message.allumee && lumierePortee(this.inventaire) === "lampe_frontale" && (this.charges.petite_batterie ?? 0) <= 0.1) {
          return this.info("La petite batterie est vide : recharge-la au banc de recharge.");
        }
        this.lumiere = message.allumee === true;
        this.envoyer({ t: "lumiere", allumee: this.lumiere });
        return;
      case "annuler":
        this.annulerAction();
        return;
      case "voyager":
        this.voyager(message.vers);
        return;
      case "poser":
        this.poserObjetLourd();
        return;
      case "mesures":
        this.mesuresClient(message);
        return;
      case "frapper":
        // On ne frappe pas avec un escabeau dans les bras : on le lâche d'abord.
        if (this.objetPorte()) this.poserObjetLourd();
        this.frapper(message.appuye === true);
        return;
      case "esquiver":
        this.esquiver(message.dx, message.dz);
        return;
      case "degager":
        this.degager();
        return;
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
      case "tutoriel_passer":
        if (!this.tuto) return;
        this.tuto = null;
        this.base.sauverTutoriel(this.compte.id, null);
        this.envoyer({ t: "tutoriel", tutoriel: null });
        return;
    }
  }

  // ---------- Ensemble (É4, lot 3) : ce que les autres voient, ce qu'on échange ----------

  /** Dans un lieu public (halte, comptoir), on voit les autres et on peut échanger ; le terrain reste privé. */

  get enLieuPublic(): boolean {
    return this.lieu !== "terrain" && !this.voyage;
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
    };
  }

  /** Ce qui manque pour donner une offre, ou null si tout y est. */
  manqueA(offre: OffreEchange): string | null {
    for (const [type, n] of Object.entries(offre.objets) as [TypeObjet, number][]) {
      if (!estObjet(type) || !Number.isInteger(n) || n < 0) return "Offre invalide.";
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
    return poidsInventaire(this.inventaire) - poidsInventaire(donne.objets) + poidsInventaire(recoit.objets);
  }

  /** L'échange validé par les deux : on donne, on reçoit (le serveur a tout vérifié avant). */
  appliquerEchange(donne: OffreEchange, recoit: OffreEchange, chargesRecues: Charges): void {
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
        if (!estObjet(op.objet) || !(n >= 1) || (this.inventaire[op.objet] ?? 0) < n) return;
        const prix = prixAchat(op.objet, this.comptoir.basse);
        if (prix === null) return this.info(this.comptoir.basse ? "Les caisses sont presque vides : on ne rachète plus que le bois, la pierre et la nourriture." : "Les Compteurs ne rachètent pas ça.");
        const total = prix * n;
        if (!this.comptoir.payer(total)) return this.info("Le comptoir n'a plus de quoi payer. Reviens plus tard : sa trésorerie se refait quand les joueurs achètent.");
        this.retirerPlusieurs({ [op.objet]: n });
        this.bornerCharges();
        this.comptoir.entrerEnStock(op.objet, n);
        this.poche = ajouterWotts(this.poche, total, instant);
        this.mesurer("wotts", "vente", total, { objet: op.objet, n });
        this.noterFait("wotts_gagnes", total);
        this.noterFait(`vente:${op.objet}`, n);
        this.info(`Vendu : ${nommer(op.objet, n)}, +${formaterWotts(total)}.`);
        break;
      }
      case "acheter": {
        const n = Math.floor(op.quantite);
        if (!(n >= 1) || (this.comptoir.stock[op.objet] ?? 0) < n || !estObjet(op.objet)) return;
        const total = prixVente(op.objet) * n;
        if (total > enPoche + 1e-6) return this.info(`Il te faut ${formaterWotts(total)} en bons. Pour en gagner : dépose de l'électricité au guichet, vends ce que tu as en trop, ou pédale pour les Compteurs.`);
        if (poidsInventaire(this.inventaire) + OBJETS[op.objet].poids * n > capaciteDe(this.inventaire)) return this.sacTropLourd();
        if (!this.comptoir.sortirDuStock(op.objet, n)) return;
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
        if (wh < 1) return this.info(this.comptoir.placeCellules() < 1 ? "Les cellules des Compteurs sont pleines : reviens plus tard." : "Cette batterie est vide : charge-la chez toi (banc de recharge, panneau, pédalier).");
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
    return this.lieu === "station" ? this.halte.eteints : this.eteints;
  }

  /** Ceux qui le tiennent. */
  private saisisseurs(): Eteint[] {
    return this.eteintsIci().filter((e) => e.saisit === this.compte.id);
  }

  private enduranceMax(): number {
    return this.maintenant() < this.sante.convalescenceJusqua ? ENDURANCE_CONVALESCENCE : ENDURANCE_MAX;
  }

  /** Ciblage assisté (Book 08 §3.3) : l'Éteint le plus proche, devant soi, à portée d'arme. */
  private cibleDevant(allonge: number): Eteint | null {
    let meilleur: Eteint | null = null;
    let meilleureDistance = Infinity;
    for (const e of this.eteintsIci()) {
      if (e.etat === "detruit") continue;
      const dx = e.x - this.position.x;
      const dz = e.z - this.position.z;
      const d = Math.hypot(dx, dz);
      if (d > allonge + 0.35) continue;
      const ecart = Math.abs(Math.atan2(Math.sin(Math.atan2(dx, dz) - this.position.o), Math.cos(Math.atan2(dx, dz) - this.position.o)));
      // Celui qui nous tient se frappe toujours, même dans le dos.
      if (ecart > ANGLE_CIBLAGE && e.saisit !== this.compte.id) continue;
      if (d < meilleureDistance) {
        meilleur = e;
        meilleureDistance = d;
      }
    }
    return meilleur;
  }

  private frapper(appuye: boolean): void {
    this.mesurer("activite", "combat", 0.6);
    const instant = this.maintenant();
    if (this.voyage || instant < this.prochaineFrappe) return;
    const cout = appuye ? COUT_ENDURANCE.coupAppuye : COUT_ENDURANCE.coup;
    this.annulerAction();
    const force = this.endurance < SEUIL_EPUISE ? 0.5 : 1;
    this.endurance = Math.max(0, this.endurance - cout);
    this.prochaineFrappe = instant + (appuye ? 700 : 450);
    this.bruitCoupJusqua = instant + 600;
    const arme = meilleureArme(this.inventaire);
    const cible = this.cibleDevant(arme.allonge);
    if (!cible) return;
    this.position = { ...this.position, o: Math.atan2(cible.x - this.position.x, cible.z - this.position.z) };
    const resultat = encaisser(cible, arme, appuye, force, this.position, zoneDe(this.lieu));
    if (this.tuto && resultat === "detruit") this.tuto.premierEteintDetruit = true;
    const coup = { t: "coup" as const, id: cible.id, x: cible.x, z: cible.z, resultat };
    if (this.lieu === "station") this.halte.diffuser(coup);
    else this.envoyer(coup);
    if (resultat === "a_terre") this.indice("a_terre", "Il est à terre, mais il se relèvera : frappe-le encore pour l'achever. Un coup appuyé à la tête (maintenir A, puis relâcher) l'arrête net.");
    if (resultat === "detruit" && arme.objet === null) this.info(`À mains nues, ça ne suffira pas : prends une arme (gourdin, marteau, hache…). ${ouTrouverPhrase("gourdin")}`);
  }

  private esquiver(dx: number, dz: number): void {
    const instant = this.maintenant();
    if (this.voyage || !Number.isFinite(dx) || !Number.isFinite(dz)) return;
    if (this.endurance < COUT_ENDURANCE.esquive) return this.info("Trop essoufflé pour esquiver : recule en marchant, ton souffle revient vite (jauge d'endurance).");
    const l = Math.hypot(dx, dz);
    // Sans direction, on recule.
    const [ux, uz] = l > 0.01 ? [dx / l, dz / l] : [-Math.sin(this.position.o), -Math.cos(this.position.o)];
    this.annulerAction();
    this.endurance -= COUT_ENDURANCE.esquive;
    this.esquiveJusqua = instant + ESQUIVE.invulnerable * 1000;
    this.elan = { dx: ux, dz: uz, restant: ESQUIVE.duree };
    for (const e of this.saisisseurs()) lacher(e, this.position, zoneDe(this.lieu));
    this.appuisDegagement = 0;
  }

  /** Taper vite pour se dégager (Book 08 §3.3) : il en faut plus quand plusieurs tiennent, et quand on est épuisé. */
  private degager(): void {
    const tiennent = this.saisisseurs();
    if (tiennent.length === 0) return;
    this.endurance = Math.max(0, this.endurance - COUT_ENDURANCE.degagement);
    this.appuisDegagement++;
    const besoin = APPUIS_DEGAGEMENT * tiennent.length * (this.endurance < SEUIL_EPUISE ? 1.5 : 1);
    if (this.appuisDegagement < besoin) return;
    this.appuisDegagement = 0;
    for (const e of tiennent) lacher(e, this.position, zoneDe(this.lieu));
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
    // Trois ou plus : effondrement quasi certain (Book 06 §2.3).
    if (tiennent.length >= 3) return this.effondrer("Ils sont trop nombreux.");
    for (const e of tiennent) {
      // L'Éteint du tutoriel ne mord jamais : il lâche prise tout seul (validé, 2026-10-08).
      if (e.tuto) {
        if (e.tenue >= 6) {
          lacher(e, this.position, zoneDe(this.lieu));
          if (this.tuto) this.tuto.degage = true;
          this.info("Il te lâche… La prochaine fois, tape F (ou B) très vite !");
        }
        continue;
      }
      if (e.tenue < DELAI_MORSURE) continue;
      e.tenue = 0;
      this.sante = aggraver(this.sante, "morsure", DEGATS_MORSURE, instant);
      this.envoyer({ t: "morsure" });
      this.envoyerSante(true);
    }

    // Endurance : la course fatigue, le reste du temps on souffle.
    const court = this.bouge && this.intention.allure === "course";
    if (court) this.endurance -= ENDURANCE_COURSE * dt;
    else if (instant > this.prochaineFrappe + 600) this.endurance += ENDURANCE_RECUPERATION * dt;
    this.endurance = Math.max(0, Math.min(this.enduranceMax(), this.endurance));

    this.sante = evoluer(this.sante, dt, instant, this.besoins.kcal > 0 && this.besoins.eau > 0);
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
    this.mesurer("effondrement", raison, 1, { lieu: this.lieu });
    const instant = this.maintenant();
    this.reveiller("");
    this.poserObjetLourd();
    for (const e of this.saisisseurs()) lacher(e, this.position, zoneDe(this.lieu));
    const enPoche = valeurWotts(this.poche, instant);
    if (Object.keys(this.inventaire).length > 0 || enPoche > 0) {
      // Au comptoir, zone gardée : les Compteurs rapportent le sac chez lui.
      const auComptoir = this.lieu === "comptoir";
      const sac = this.base.poserSac({
        lieu: auComptoir ? "terrain" : this.lieu,
        terrainDe: this.lieu === "terrain" || auComptoir ? this.compte.id : 0,
        proprietaire: this.compte.id,
        x: auComptoir ? POINT_ARRIVEE.x + 1.5 : this.position.x,
        z: auComptoir ? POINT_ARRIVEE.z + 1 : this.position.z,
        contenu: { inventaire: this.inventaire, charges: this.charges, wotts: enPoche },
        creeLe: instant,
      });
      if (this.lieu === "station") this.halte.poserSac(sac);
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
    if (this.lieu === "station") this.halte.sortir(this);
    this.eteints = [];
    this.lieu = "terrain";
    this.position = { x: POINT_ARRIVEE.x, z: POINT_ARRIVEE.z, o: 0 };
    this.besoins = { ...this.besoins, kcal: Math.min(this.besoins.kcal, RESERVE_KCAL_MAX * NIVEAU_APRES_EFFONDREMENT), eau: Math.min(this.besoins.eau, RESERVE_EAU_MAX * NIVEAU_APRES_EFFONDREMENT) };
    this.sante = seRelever(this.sante, instant);
    this.endurance = ENDURANCE_CONVALESCENCE;
    this.sauvegarder();
    this.envoyer({ t: "effondrement" });
    this.info(`${raison} Des inconnus t'ont ramené chez toi. Ton sac est resté là-bas : tu n'as plus que tes poches (10 kg). Retourne le chercher, ou fabrique un sac de fortune (4 branches, 2 cordes).`);
    this.envoyer(this.bienvenue(this.debutMonde));
  }

  private sacsVus(): SacVu[] {
    if (this.lieu === "station") return this.halte.sacsVus(this.compte.id);
    return this.sacsTerrain.map((s) => vueDuSac(s, this.compte.id));
  }

  /** La liste des sacs et tas au sol du lieu (halte partagée, ou terrain). */
  private sacsIci(): SacPose[] {
    return this.lieu === "station" ? this.halte.sacs : this.sacsTerrain;
  }

  /** Un tas d'objets jetés : n'importe qui le ramasse, autant que son sac peut porter. */
  private ramasserTas(tas: SacPose): void {
    const pris: Inventaire = {};
    let poids = poidsInventaire(this.inventaire);
    // Un sac par terre se prend d'abord : il fait de la place pour le reste.
    const entrees = (Object.entries(tas.contenu.inventaire) as [TypeObjet, number][]).sort(([a], [b]) => (CONTENANTS[b] ?? 0) - (CONTENANTS[a] ?? 0));
    for (const [type, n] of entrees) {
      const unite = OBJETS[type].poids;
      const capacite = capaciteDe({ ...this.inventaire, ...pris });
      const k = unite > 0 ? Math.min(n, Math.floor((capacite - poids + 1e-9) / unite)) : n;
      if (k > 0) {
        pris[type] = k;
        poids += unite * k;
      }
    }
    if (Object.keys(pris).length === 0) return this.sacTropLourd();
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
    if (this.lieu === "station") this.halte.retirerSac(sac.id);
    else {
      this.sacsTerrain = this.sacsTerrain.filter((s) => s.id !== sac.id);
      this.base.retirerSac(sac.id);
    }
    if (contenu) {
      const nouveau = this.base.poserSac({ ...sac, contenu });
      if (this.lieu === "station") this.halte.poserSac(nouveau);
      else this.sacsTerrain.push(nouveau);
    }
    if (this.lieu !== "station") this.envoyer({ t: "sacs", sacs: this.sacsVus() });
  }

  /** Jeter un objet par terre (quand le sac est trop lourd) : il reste là, ramassable (Book 01 §8). */
  private jeter(objet: TypeObjet, quantite: number): void {
    if (this.voyage || !estObjet(objet)) return;
    const n = Math.floor(Number(quantite));
    if (!(n >= 1) || (this.inventaire[objet] ?? 0) < n) return;
    if (this.lieu === "comptoir") return this.info("Pas ici : les Compteurs n'aiment pas le désordre. Va au guichet, ou range-le chez toi.");
    if (objet === "sac_a_dos" || objet === "sac_fortune") return this.info("Ton sac, tu le gardes sur le dos.");
    const charges = this.chargesQuiPartent({ [objet]: n });
    this.charges = Object.fromEntries(BATTERIES.map((b) => [b, Math.max(0, (this.charges[b] ?? 0) - (charges[b] ?? 0))])) as Charges;
    this.retirerPlusieurs({ [objet]: n });
    this.bornerCharges();
    this.verifierLumiere();
    // Un tas à moi tout près : on y ajoute (pas une pile de petits tas).
    const tas = this.sacsIci().find((s) => s.contenu.jete && s.proprietaire === this.compte.id && this.proche(s.x, s.z, 1.2));
    if (tas) {
      const inventaire = { ...tas.contenu.inventaire, [objet]: (tas.contenu.inventaire[objet] ?? 0) + n };
      const total = { ...tas.contenu.charges };
      for (const [b, wh] of Object.entries(charges) as [TypeBatterie, number][]) total[b] = (total[b] ?? 0) + wh;
      this.remplacerSac(tas, { ...tas.contenu, inventaire, charges: total });
    } else {
      const sac = this.base.poserSac({
        lieu: this.lieu === "station" ? "station" : "terrain",
        terrainDe: this.lieu === "station" ? 0 : this.compte.id,
        proprietaire: this.compte.id,
        x: this.position.x + Math.sin(this.position.o) * 0.6,
        z: this.position.z + Math.cos(this.position.o) * 0.6,
        contenu: { inventaire: { [objet]: n }, charges, jete: true },
        creeLe: this.maintenant(),
      });
      if (this.lieu === "station") this.halte.poserSac(sac);
      else {
        this.sacsTerrain.push(sac);
        this.envoyer({ t: "sacs", sacs: this.sacsVus() });
      }
    }
    this.info(`Tu as posé ${nommer(objet, n)} par terre.`);
  }

  /** Sans plus rien pour l'éclairer, la lumière s'éteint. */
  private verifierLumiere(): void {
    if (this.lumiere && !lumierePortee(this.inventaire)) {
      this.lumiere = false;
      this.envoyer({ t: "lumiere", allumee: false });
    }
  }

  /** Ranger un objet dans un coffre de son terrain, ou l'en sortir (la charge des batteries suit). */
  private utiliserCoffre(id: number, sens: "deposer" | "prendre", objet: TypeObjet, quantite: number): void {
    const coffre = this.installations.get(id);
    if (!coffre || coffre.type !== "coffre" || this.lieu !== "terrain" || this.voyage || !estObjet(objet)) return;
    if (!this.proche(coffre.x, coffre.z, 2.5)) return this.info("Approche-toi du coffre.");
    const n = Math.floor(Number(quantite));
    if (!(n >= 1)) return;
    const contenu: Inventaire = { ...(coffre.etat.contenu ?? {}) };
    const charges: Charges = { ...(coffre.etat.charges ?? {}) };
    const b = objet as TypeBatterie;
    const batterie = BATTERIES.includes(b);
    if (sens === "deposer") {
      if ((this.inventaire[objet] ?? 0) < n) return;
      if (objet === "sac_a_dos" || objet === "sac_fortune") return this.info("Ton sac, tu le gardes sur le dos.");
      if (poidsInventaire(contenu) + OBJETS[objet].poids * n > CAPACITE_COFFRE + 1e-9) return this.info("Le coffre est plein (150 kg) : construis-en un autre, ou vends le surplus au Comptoir.");
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
      if (poidsInventaire(this.inventaire) + OBJETS[objet].poids * n > capaciteDe(this.inventaire) + 1e-9) return this.sacTropLourd();
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
    const liste = this.lieu === "station" ? this.halte.sacs : this.sacsTerrain;
    const sac = liste.find((s) => s.id === id);
    if (!sac) return;
    if (!this.proche(sac.x, sac.z)) return this.info("C'est trop loin.");
    if (sac.contenu.jete) return this.ramasserTas(sac);
    if (sac.proprietaire !== this.compte.id) return this.info("Ce n'est pas ton sac.");
    this.commencer("Reprendre ton sac", 3, () => {
      const encore = (this.lieu === "station" ? this.halte.sacs : this.sacsTerrain).some((s) => s.id === id);
      if (!encore) return;
      this.ajouterPlusieurs(sac.contenu.inventaire);
      if (sac.contenu.wotts) {
        this.poche = ajouterWotts(this.poche, sac.contenu.wotts, this.maintenant());
        this.envoyerWotts();
      }
      for (const [b, wh] of Object.entries(sac.contenu.charges) as [TypeBatterie, number][]) this.ajouterCharge(b, wh);
      if (this.lieu === "station") this.halte.retirerSac(id);
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
    return this.lieu === "station" ? this.halte.ressources : this.ressources;
  }

  get enVoyage(): boolean {
    return this.voyage !== null;
  }

  /** Prendre la route depuis une sortie : le trajet coûte des calories et de l'eau (Book 01 §2 bis). */
  private voyager(vers: LieuId): void {
    if (this.voyage) return;
    const sortie = sortieIci(this.lieu, this.position.x, this.position.z);
    // Du terrain au Carrefour, la route passe par la halte : on s'y arrête, il faut la traverser (Book 01 §2 bis).
    const etape = etapeVers(this.lieu, vers);
    if (!sortie || sortie.vers !== etape) return this.info("Pour prendre la route, va jusqu'à la sortie.");
    if (this.objetPorte()) return this.info("Pose d'abord l'escabeau : il reste sur ton terrain.");
    if (!LIEUX[etape].ouvert) return this.info(`${LIEUX[etape].nom} n'a pas encore ouvert ses portes.`);
    if (etape !== vers) this.info(`La route du ${LIEUX[vers].nom.replace(/^Le /, "")} passe par la station-service : il faudra la traverser à pied.`);
    vers = etape;
    this.annulerAction();
    this.lumiere = false;
    const km = distanceKm(this.lieu, vers);
    this.besoins = { ...this.besoins, kcal: Math.max(0, this.besoins.kcal - km * KCAL_PAR_KM), eau: Math.max(0, this.besoins.eau - km * EAU_PAR_KM) };
    this.intention = INTENTION_REPOS;
    const de = this.lieu;
    this.voyage = { de, vers, arrivee: this.maintenant() + DUREE_VOYAGE_S * 1000 };
    this.mesurer("activite", "expédition", DUREE_VOYAGE_S, { vers });
    if (de === "station") this.halte.sortir(this);
    if (de === "comptoir") this.comptoir.sortir(this.envoyer);
    // Les Éteints du terrain ne suivent pas : il n'y a pas de siège en son absence.
    this.eteints = [];
    // On enregistre tout de suite la destination : une déconnexion en route fait arriver à bon port.
    this.base.sauverPosition(this.compte.id, arriveeDans(vers, de), vers, this.maintenant());
    this.base.sauverEtat(this.compte.id, this.besoins, this.gourde);
    this.envoyerBesoins();
    this.envoyer({ t: "voyage", de, vers, duree: DUREE_VOYAGE_S });
  }

  private arriver(voyage: Voyage): void {
    this.voyage = null;
    this.lieu = voyage.vers;
    this.position = arriveeDans(voyage.vers, voyage.de);
    if (this.lieu === "station") this.halte.entrer(this);
    if (this.lieu === "comptoir") this.comptoir.entrer(this.envoyer);
    if (this.tuto && this.lieu === "station") this.tuto.visiteStation = true;
    this.noterFait(`visite:${this.lieu}`);
    this.envoyer(this.bienvenue(this.base.debutMonde()));
  }

  /** Le joueur se déconnecte : il quitte la halte (hors ligne, il est sur la carte, Book 01 §2 bis). */
  partir(): void {
    this.halte.sortir(this);
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
    if (this.quetes.noter(fait, n)) this.quetesASauver = true;
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
    const vue = this.quetes.vue(j, reussies.at(-1));
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

  private vueTutoriel(lecon?: string): VueTutoriel | null {
    if (!this.tuto) return null;
    const etapes = etapesTutoriel(this.compte.famille);
    const e = etapes[Math.min(this.tuto.etape, NOMBRE_ETAPES - 1)]!;
    const progres = this.progresTutoriel();
    return { etape: this.tuto.etape, total: NOMBRE_ETAPES, titre: e.titre, consigne: e.consigne, lecon, termine: this.tuto.etape >= NOMBRE_ETAPES, ...(progres.length ? { progres } : {}) };
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
      default:
        return [];
    }
  }

  /** L'étape en cours est-elle réussie ? (d'après ce que le joueur a vraiment fait) */
  private etapeReussie(etape: number): boolean {
    const t = this.tuto!;
    const familiale = { charbonniers: "forge", voltaiques: "banc_recharge", mecanistes: "pedalier" }[this.compte.famille];
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
      case 9:
        return [...this.installations.values()].some((i) => i.type === familiale);
      case 10:
        return t.dormiAbri;
      case 11:
        return t.visiteStation && this.lieu === "terrain";
      default:
        return false;
    }
  }

  private verifierTutoriel(instant: number): void {
    if (!this.tuto || instant - this.derniereVerifTuto < 500) return;
    this.derniereVerifTuto = instant;
    const etapes = etapesTutoriel(this.compte.famille);
    let lecon: string | undefined;
    while (this.tuto.etape < NOMBRE_ETAPES && this.etapeReussie(this.tuto.etape)) {
      lecon = etapes[this.tuto.etape]!.lecon;
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
      this.envoyer({ t: "tutoriel", tutoriel: this.vueTutoriel(lecon) });
      // Les compteurs de la nouvelle étape partent avec la leçon : pas besoin de les renvoyer tout de suite.
      if (!fini) this.dernierProgresTuto = JSON.stringify(this.progresTutoriel());
      if (fini) {
        this.tuto = null;
        return;
      }
    }
    // Les deux Éteints mis en scène arrivent au bon moment (Book 14 §4.2, étapes 8 et 9).
    if (this.lieu === "terrain" && !this.voyage) {
      const enScene = this.eteints.some((e) => e.tuto && e.etat !== "detruit");
      if (this.tuto.etape === 7 && !enScene) this.amenerEteintDuTutoriel(false);
      if (this.tuto.etape === 8 && !this.tuto.degage && !this.eteints.some((e) => e.tuto && e.saisit !== null)) this.amenerEteintDuTutoriel(true);
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

  private endormir(dansUnAbri: boolean): void {
    if (this.sommeil || this.voyage) return;
    if (this.besoins.repos >= 0.97) return this.info("Tu n'as pas sommeil : reviens quand la jauge de sommeil aura baissé.");
    if (this.saisisseurs().length > 0) return;
    this.annulerAction();
    this.intention = INTENTION_REPOS;
    this.sommeil = { dansUnAbri };
    this.endormiDepuis = this.maintenant();
    if (this.tuto && dansUnAbri) this.tuto.dormiAbri = true;
    this.lumiere = false;
    this.envoyer({ t: "lumiere", allumee: false });
    this.envoyer({ t: "sommeil", dort: true, dansUnAbri });
  }

  private reveiller(message: string): void {
    if (!this.sommeil) return;
    this.sommeil = null;
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
    return this.sousLaPluie(stimuliJoueur({
      x: this.position.x,
      z: this.position.z,
      allure: allureAutorisee(this.intention.allure, this.besoins, this.objetPorte() !== undefined),
      bouge: this.bouge,
      action: this.maintenant() < this.bruitCoupJusqua ? "coup" : (this.action?.bruit ?? "aucun"),
      lumiere: portee ? (OBJETS[portee].lumiere ?? null) : null,
      nuit,
      saigne: this.sante.saignement !== "aucun",
    }));
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
      eclaire: this.lumiere && this.nuit(),
      intouchable: this.maintenant() < this.esquiveJusqua,
    };
  }

  /** Les sources fixes du terrain : feux allumés, charbonnière qui fume. */
  private sourcesTerrain(nuit: boolean): Stimulus[] {
    const s: Stimulus[] = [];
    for (const f of this.feux.values()) {
      if (!f.allume || f.bois <= 0) continue;
      s.push({ genre: "odeur", x: f.x, z: f.z, ...FEU_ODEUR });
      if (nuit) s.push({ genre: "lumiere", x: f.x, z: f.z, ...FEU_LUMIERE_NUIT });
    }
    const instant = this.maintenant();
    for (const i of this.installations.values()) {
      if (i.type === "charbonniere" && i.etat.pretLe && instant < i.etat.pretLe) s.push({ genre: "odeur", x: i.x, z: i.z, ...CHARBONNIERE_ODEUR });
    }
    return this.sousLaPluie(s);
  }

  /** La vie des Éteints du terrain : ils arrivent de la lisière quand la signature les attire. */
  private animerEteintsTerrain(instant: number, dt: number): void {
    const nuit = this.nuit();
    const sources = this.sourcesTerrain(nuit);
    const stimuli = [...this.stimuli(nuit), ...sources];
    for (const e of this.eteints) penser(e, dt, stimuli, [this.humain()], this.eteints, nuit, zoneDe("terrain"), this.alea);
    this.eteints = this.eteints.filter((e) => e.etat !== "detruit" || e.corps < DUREE_CORPS);

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
    if (this.tuto && this.tuto.etape < 9) return;
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
    const instant = this.maintenant();
    const heures = dt / 60; // horloge d'action : 1 minute réelle = 1 heure de jeu

    if (this.voyage && instant >= this.voyage.arrivee) this.arriver(this.voyage);

    // Déplacement : bouger interrompt l'action en cours. En route, on ne bouge pas : on est sur la carte.
    if (this.voyage) this.intention = INTENTION_REPOS;
    const bouge = Math.hypot(this.intention.dx, this.intention.dz) > 0.01;
    if (this.sommeil) {
      if (bouge || this.saisisseurs().length > 0) this.reveiller(bouge ? "" : "Réveillé en sursaut !");
      else {
        this.besoins = dormir(this.besoins, heures, this.sommeil.dansUnAbri);
        if (this.besoins.repos >= 1) this.reveiller("Tu te réveilles, reposé.");
      }
    }
    if (bouge && this.action) this.annulerAction();
    // Saisi : ralenti par un, immobilisé par deux (Book 06 §2.3). Épuisé : on ne court plus.
    const frein = freinSaisie(this.saisisseurs().length);
    let allure = allureAutorisee(this.intention.allure, this.besoins, this.objetPorte() !== undefined);
    if (allure === "course" && this.endurance < SEUIL_EPUISE) allure = "marche";
    const intention = { dx: this.intention.dx * frein, dz: this.intention.dz * frein, allure };
    let nouvelle = avancer(this.position, intention, dt, zoneDe(this.lieu));
    // L'élan de l'esquive : un bond rapide, sur quelques dixièmes de seconde.
    if (this.elan) {
      const vitesse = ESQUIVE.distance / ESQUIVE.duree;
      const pas = Math.min(dt, this.elan.restant);
      nouvelle = avancer(nouvelle, { dx: this.elan.dx, dz: this.elan.dz, allure: "course" }, (pas * vitesse) / ALLURES.course, zoneDe(this.lieu));
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

    // La lampe frontale vide la petite batterie (Book 18 §2 : la lumière a un prix).
    if (this.lumiere && lumierePortee(this.inventaire) === "lampe_frontale") {
      const reste = Math.max(0, (this.charges.petite_batterie ?? 0) - CONSOMMATION_FRONTALE * heures);
      this.charges = { ...this.charges, petite_batterie: reste };
      if (reste <= 0) {
        this.lumiere = false;
        this.envoyer({ t: "lumiere", allumee: false });
        this.info("La petite batterie est vide : la lampe s'éteint.");
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
    this.verifierTutoriel(instant);
    this.verifierQuetes(instant);

    // Fin d'action
    if (this.action && instant >= this.action.fin) {
      const action = this.action;
      this.action = null;
      this.mesurer("activite", categorieAction(action.libelle), (instant - action.lance) / 1000);
      action.appliquer();
      this.envoyer({ t: "action", etat: "fin" });
    }
  }

  sauvegarder(): void {
    // En route, la destination est déjà enregistrée (voyager).
    if (!this.voyage) this.base.sauverPosition(this.compte.id, this.position, this.lieu, this.maintenant());
    this.base.sauverEtat(this.compte.id, this.besoins, this.gourde);
    for (const feu of this.feux.values()) this.base.sauverFeu(this.compte.id, feu);
    this.base.sauverCharges(this.compte.id, this.charges, this.maintenant());
    this.base.sauverSante(this.compte.id, this.sante, this.endurance);
    // L'escabeau dans les bras : s'il faut le lâcher (déconnexion), il tombe là où l'on est.
    const porte = this.objetPorte();
    if (porte) this.base.deplacerInstallation(this.compte.id, porte.id, this.position.x, this.position.z, this.position.o);
    if (this.tuto) this.base.sauverTutoriel(this.compte.id, this.tuto);
    this.base.sauverWotts(this.compte.id, this.poche, this.compteWotts);
    if (this.quetesASauver) {
      this.quetesASauver = false;
      this.base.sauverQuetes(this.compte.id, this.quetes.etat);
    }
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
  }

  private info(texte: string): void {
    this.envoyer({ t: "info", texte });
  }

  private proche(x: number, z: number, distance = DISTANCE_INTERACTION): boolean {
    return Math.hypot(this.position.x - x, this.position.z - z) <= distance;
  }

  private interagir(cible: Cible, verbe: string): void {
    if (cible?.genre === "ressource" && (verbe === "ramasser" || verbe === "demonter" || verbe === "fouiller")) return this.utiliserRessource(cible.id);
    if (cible?.genre === "sac" && verbe === "reprendre") return this.reprendreSac(cible.id);
    if (cible?.genre === "comptoir" && verbe === "pedaler_comptoir") return this.pedalerAuComptoir();
    if (cible?.genre === "animal" && verbe === "assommer" && this.lieu === "terrain") return this.assommer(cible.id);
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
    }
  }

  /** Ramasser, démonter ou fouiller une ressource du sol (Book 02 §5). */
  private utiliserRessource(id: number): void {
    const lieu = this.lieu;
    const r = this.ressourcesIci().get(id);
    if (!r || r.disponibleLe > this.maintenant()) return;
    if (!this.proche(r.x, r.z, DISTANCE_INTERACTION + (estFruitier(r.type) ? PORTEE_ARBRE : 0))) return this.info("C'est trop loin : approche-toi encore un peu.");
    const usage = USAGES[r.type];
    // Le calendrier des récoltes : chaque fruit, chaque champignon à sa saison (2026-10-08).
    const jour = jourDuCalendrier(this.maintenant(), this.debutMonde);
    if (!enSaison(r.type, jour)) return this.info(etatDuFruitier(r.type, jour) ?? `Ce n'est pas la saison : à partir du ${prochaineRecolte(r.type)}.`);
    if (usage.escabeau && !this.escabeauAuPied(r.x, r.z)) return this.info("Les fruits sont trop haut : pose un escabeau au pied de l'arbre, dans le cercle.");
    const facteur = multiplicateurQualites(this.inventaire, usage.qualites);
    if (facteur === null) return this.info(outilsManquants(usage.qualites, this.inventaire).join(" "));
    if (poidsInventaire(this.inventaire) + poidsDe(usage.donne) > capaciteDe(this.inventaire)) return this.sacTropLourd();
    this.commencer(usage.libelle, (usage.duree * facteur) / REGLAGES.gestes_vitesse, () => {
      const instant = this.maintenant();
      if (r.disponibleLe > instant || this.lieu !== lieu) return;
      const repousse = REPOUSSE_MS[r.type] === null ? null : REPOUSSE_MS[r.type]! / REGLAGES.repousse_rythme;
      const disponibleLe = repousse === null ? JAMAIS : instant + repousse;
      if (lieu === "station") this.halte.prendre(r, disponibleLe);
      else {
        r.disponibleLe = disponibleLe;
        this.base.sauverRessource(this.compte.id, r.id, r.disponibleLe);
        this.envoyer({ t: "ressource", id: r.id, disponible: false });
      }
      this.ajouterPlusieurs(usage.donne);
      for (const b of BATTERIES) if (usage.donne[b]) this.ajouterCharge(b, CHARGE_TROUVEE[b] * (usage.donne[b] ?? 0));
      if (this.tuto) {
        this.tuto.branches += usage.donne.branche ?? 0;
        this.tuto.pierres += usage.donne.pierre ?? 0;
      }
    }, 0, usage.verbe === "demonter" ? "outil" : "leger");
  }

  /** Un indice, au plus une fois par période pour chaque sorte : on aide sans rabâcher. */
  private indice(sorte: string, texte: string, periodeMs = 30_000): void {
    const instant = this.maintenant();
    if (instant - (this.derniersIndices.get(sorte) ?? -Infinity) < periodeMs) return;
    this.derniersIndices.set(sorte, instant);
    this.info(texte);
  }
  private readonly derniersIndices = new Map<string, number>();

  /** Le sac est trop lourd : on dit de combien, et comment s'en sortir. */
  private sacTropLourd(): void {
    const capacite = capaciteDe(this.inventaire);
    const sansSac = capacite < CAPACITE_SAC && !(this.inventaire.sac_fortune ?? 0);
    this.info(
      `${sansSac ? "Tes poches sont pleines" : "Ton sac est trop lourd"} (${Math.round(poidsInventaire(this.inventaire))} kg sur ${capacite}) : jette ce qui ne sert pas (Sac → Jeter) ou range-le dans un coffre.` +
        (sansSac ? " Sans sac, tu ne portes que 10 kg : retourne chercher le tien, ou fabrique un sac de fortune (4 branches, 2 cordes)." : ""),
    );
  }

  /** Fabriquer un objet ou poser une installation (Book 02 §2). */
  private fabriquer(id: string, x?: number, z?: number, o?: number): void {
    const r = recette(id);
    if (!r || !recettesConnues(this.compte.famille).includes(r)) return this.info("Tu ne connais pas cette recette.");
    if (this.lieu !== "terrain" && ("installation" in r.produit || r.installation)) return this.info("Ça se construit chez toi, sur ton terrain.");
    if (!ingredientsPresents(this.inventaire, r)) return this.info(ceQuiManque(r, this.inventaire).join(" "));
    const facteur = multiplicateurQualites(this.inventaire, r.qualites);
    if (facteur === null) return this.info(outilsManquants(r.qualites, this.inventaire).join(" "));
    if (r.feu && ![...this.feux.values()].some((f) => f.allume && f.bois > 0 && this.proche(f.x, f.z, 2.5))) {
      return this.info("Ça se cuisine près d'un feu allumé : approche-toi de ton feu (ou allumes-en un).");
    }
    if (r.installation && ![...this.installations.values()].some((i) => i.type === r.installation && this.proche(i.x, i.z, 2.5))) {
      return this.info(`Il faut être près d'un ${NOMS_INSTALLATIONS[r.installation]}.`);
    }

    if ("installation" in r.produit) {
      const type = r.produit.installation;
      if (x === undefined || z === undefined || !Number.isFinite(x) || !Number.isFinite(z)) return;
      const erreur = this.emplacementInvalide(x, z);
      if (erreur) return this.info(erreur);
      this.commencer(r.nom, dureeReelle(r) * facteur, () => {
        if (!ingredientsPresents(this.inventaire, r) || this.emplacementInvalide(x, z)) return;
        this.retirerPlusieurs(r.ingredients);
        const installation = this.base.ajouterInstallation(this.compte.id, type, x, z, Number.isFinite(o) ? (o as number) : 0);
        this.installations.set(installation.id, installation);
        this.envoyer({ t: "installation", installation });
        this.mesurer("progression", `recette:${r.id}`, 1);
        this.noterFait(`fabrique:${r.id}`);
      }, 0, r.qualites.marteler ? "lourd" : "outil");
      return;
    }

    const produit = r.produit;
    const delta = OBJETS[produit.objet].poids * produit.quantite - poidsDe(r.ingredients);
    // La capacité d'après : fabriquer un sac fait de la place.
    if (poidsInventaire(this.inventaire) + delta > capaciteDe({ ...this.inventaire, [produit.objet]: (this.inventaire[produit.objet] ?? 0) + produit.quantite })) return this.sacTropLourd();
    this.commencer(r.nom, dureeReelle(r) * facteur, () => {
      if (!ingredientsPresents(this.inventaire, r)) return;
      this.retirerPlusieurs(r.ingredients);
      this.ajouterPlusieurs({ [produit.objet]: produit.quantite });
      this.mesurer("progression", `recette:${r.id}`, 1);
        this.noterFait(`fabrique:${r.id}`);
    }, 0, r.qualites.marteler ? "lourd" : "outil");
  }

  /** Raison pour laquelle on ne peut pas poser quelque chose ici, ou null. */
  private emplacementInvalide(x: number, z: number): string | null {
    return raisonEmplacement("installation", x, z, this.position, this.feux.values(), this.installations.values());
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
  private mettreAJourBase(instant: number): { produit: number; stocke: number; perdu: number; decharge: number } {
    const bilan = { produit: 0, stocke: 0, perdu: 0, decharge: 0 };
    const changes = new Set<InstallationVue>();
    // Les batteries posées se déchargent, comme les autres.
    for (const banc of this.installations.values()) {
      if (banc.type !== "banc_recharge") continue;
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
      const wh = productionPanneau(instant - depuis);
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
    for (const i of changes) this.base.sauverEtatInstallation(this.compte.id, i.id, i.etat);
    return bilan;
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

  private construireFeu(x: number, z: number): void {
    if (!Number.isFinite(x) || !Number.isFinite(z)) return;
    if (this.lieu !== "terrain") return this.info("Pas de feu ici : on ne s'installe que sur son terrain.");
    const raison = raisonEmplacement("feu", x, z, this.position, this.feux.values(), this.installations.values());
    if (raison) return this.info(raison);
    if (this.feux.size >= MAX_FEUX) return this.info(`Pas plus de ${MAX_FEUX} feux sur ton terrain.`);
    for (const [type, n] of Object.entries(RECETTE_FEU)) {
      if ((this.inventaire[type as TypeObjet] ?? 0) < (n ?? 0)) {
        return this.info(`Il te faut 5 pierres et 3 branches (tu as ${this.inventaire.pierre ?? 0} pierres et ${this.inventaire.branche ?? 0} branches). On les ramasse sur ton terrain.`);
      }
    }
    this.commencer("Monter un feu de camp", DUREES.construireFeu, () => {
      for (const [type, n] of Object.entries(RECETTE_FEU)) this.retirer(type as TypeObjet, n ?? 0);
      const id = Math.max(0, ...this.feux.keys()) + 1;
      const feu: FeuEnBase = { id, x, z, bois: BOIS_INITIAL_FEU, allume: false, majLe: this.maintenant() };
      this.feux.set(id, feu);
      this.base.sauverFeu(this.compte.id, feu);
      this.envoyer({ t: "feu", feu: vue(feu) });
    });
  }

  private ajouterBois(feu: FeuEnBase): void {
    const type: TypeObjet | null = (this.inventaire.buche ?? 0) > 0 ? "buche" : (this.inventaire.branche ?? 0) > 0 ? "branche" : null;
    if (!type) return this.info("Tu n'as pas de bois : ramasse des branches ou des bûches de bois mort sur ton terrain.");
    if (feu.bois + combustibleDe(type) > BOIS_MAX_FEU) return this.info("Le feu a déjà assez de bois.");
    // Immédiat (Book 08 §3, 2026-10-08) : une action sans jauge se fait sur-le-champ, un clic = un morceau de bois.
    if (this.action) return this.info(`Tu es déjà occupé : attends la fin, ou appuie sur A pour arrêter.`);
    this.retirer(type, 1);
    feu.bois += combustibleDe(type);
    this.envoyer({ t: "feu", feu: vue(feu) });
  }

  private allumer(feu: FeuEnBase): void {
    if (feu.allume) return;
    if (feu.bois <= 0) return this.info("Il faut d'abord du bois : ajoute une branche ou une bûche.");
    const outil = (this.inventaire.pierre_a_feu ?? 0) > 0 ? "la pierre à feu" : (this.inventaire.briquet ?? 0) > 0 ? "le briquet" : null;
    if (!outil) return this.info(`Tu n'as rien pour allumer le feu : il faut un briquet ou une pierre à feu. ${ouTrouverPhrase("briquet")}`);
    this.commencer(`Allumer le feu avec ${outil}`, DUREES.allumer, () => {
      if (feu.bois <= 0) return;
      feu.allume = true;
      feu.majLe = this.maintenant();
      this.envoyer({ t: "feu", feu: vue(feu) });
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
    const qui = { x: this.position.x, z: this.position.z, allure: allureAutorisee(this.intention.allure, this.besoins, this.objetPorte() !== undefined), bouge: this.bouge };
    for (const p of this.peuplerPoules()) {
      const avant = p.etat;
      penserPoule(p, dt, this.sommeil ? null : qui, this.alea);
      // Une poule effarouchée par un pas trop pressé : on dit comment s'y prendre.
      if (avant !== "fuit" && p.etat === "fuit" && qui.bouge && qui.allure !== "discrete") {
        this.indice("poule", "Les poules se méfient : approche-toi en allure discrète (C), sans courir, et frappe pendant qu'elles picorent.", 60_000);
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
    const arme = meilleureArme(this.inventaire);
    if (!arme.objet) return this.info(`À mains nues, elle t'échappe : il te faut au moins un gourdin, un couteau ou un outil. ${ouTrouverPhrase("gourdin")}`);
    const d = Math.hypot(p.x - this.position.x, p.z - this.position.z);
    if (d > arme.allonge + 0.3) return this.info(`Trop loin : approche-toi doucement en allure discrète (${p.etat === "fuit" ? "elle détale : attends qu'elle se calme" : "à un mètre"}).`);
    // Une poule qui picore ne voit rien venir ; une poule qui guette esquive souvent ; une poule qui fuit, jamais.
    const chance = p.etat === "picore" ? 0.95 : p.etat === "inquiete" ? 0.55 : 0;
    if (this.alea() >= chance) {
      penserPoule(p, 0, { x: this.position.x, z: this.position.z, allure: "course", bouge: true }, this.alea);
      return this.info(
        p.etat === "inquiete"
          ? "Raté : elle te guettait. Attends qu'elle se remette à picorer avant de frapper, et approche en allure discrète."
          : "Raté : elle s'enfuit en caquetant. Approche en allure discrète, sans geste brusque.",
      );
    }
    if (poidsInventaire(this.inventaire) + OBJETS.poule.poids > capaciteDe(this.inventaire)) return this.sacTropLourd();
    this.poules = this.poules.filter((x) => x !== p);
    this.faune.prises.push(this.maintenant());
    this.base.sauverFaune(this.compte.id, this.faune);
    this.ajouterPlusieurs({ poule: 1 });
    // Les autres ont tout vu : elles détalent.
    for (const autre of this.poules) penserPoule(autre, 0, { x: this.position.x, z: this.position.z, allure: "course", bouge: true }, this.alea);
    this.envoyer({ t: "animaux", animaux: this.poules.map(vuePoule) });
  }

  /** Rôtir la volaille crue sur un feu allumé : 3 s par portion. */
  private rotir(feu: FeuEnBase): void {
    if (!feu.allume) return this.info("Le feu n'est pas allumé : allume-le d'abord (briquet ou pierre à feu).");
    const n = this.inventaire.volaille_crue ?? 0;
    if (n <= 0) return this.info("Tu n'as rien à rôtir.");
    this.commencer("Faire rôtir la volaille", 3 * n, () => {
      const crues = Math.min(n, this.inventaire.volaille_crue ?? 0);
      if (crues <= 0) return;
      this.retirer("volaille_crue", crues);
      this.ajouterPlusieurs({ volaille_cuite: crues });
    }, 0, "leger");
  }

  private bouillir(feu: FeuEnBase): void {
    if (!feu.allume) return this.info("Le feu n'est pas allumé : allume-le d'abord (briquet ou pierre à feu).");
    if (this.gourde.litres <= 0) return this.info("Ta gourde est vide : remplis-la à la mare, puis fais bouillir l'eau sur un feu.");
    if (this.gourde.contenu === "potable") return this.info("L'eau de ta gourde est déjà potable.");
    const boisNecessaire = BOIS_PAR_LITRE_BOUILLI * this.gourde.litres;
    if (feu.bois < boisNecessaire) return this.info("Le feu n'a pas assez de bois pour faire bouillir l'eau : ajoute une bûche.");
    this.commencer("Faire bouillir l'eau de la gourde", DUREES.bouillir * this.gourde.litres, () => {
      feu.bois = Math.max(0, feu.bois - boisNecessaire);
      this.gourde = { contenu: "potable", litres: this.gourde.litres };
      if (this.tuto) this.tuto.bouilli = true;
      this.envoyerBesoins();
      this.envoyer({ t: "feu", feu: vue(feu) });
      this.info("L'eau est potable.");
    });
  }

  private remplirGourde(): void {
    if ((this.inventaire.gourde ?? 0) < 1) return this.info(`Tu n'as pas de gourde. ${ouTrouverPhrase("gourde")}`);
    if (distanceMare(this.position.x, this.position.z) > 1.5) return this.info("Approche-toi de la mare.");
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

  // ---------- Installations des familles (É2, lot 2) ----------

  /** La famille qui sait se servir de chaque installation (celle de sa recette). */
  private famillePour(type: TypeInstallation): string {
    return RECETTES.find((r) => "installation" in r.produit && r.produit.installation === type)?.famille ?? "tous";
  }

  private utiliserInstallation(id: number, verbe: string): void {
    const i = this.installations.get(id);
    if (!i) return;
    if (!this.proche(i.x, i.z, DISTANCE_INTERACTION + 0.6)) return this.info("Approche-toi.");
    const famille = this.famillePour(i.type);
    if (famille !== "tous" && famille !== this.compte.famille) return this.info("Tu ne sais pas te servir de ça : c'est un savoir d'une autre famille. Échange avec un joueur de cette famille à la halte ou au Carrefour.");
    const maj = () => {
      this.base.sauverEtatInstallation(this.compte.id, i.id, i.etat);
      this.envoyer({ t: "installation", installation: i });
    };

    switch (verbe) {
      case "porter":
        if (i.type !== "escabeau" || i.etat.portee) return;
        if (this.objetPorte()) return this.info("Tu portes déjà quelque chose.");
        if (this.action) return this.info(`Tu es déjà occupé : attends la fin, ou appuie sur A pour arrêter.`);
        // Immédiat : on le prend dans les bras (on marche, on ne court plus).
        i.etat = { ...i.etat, portee: true };
        return maj();
      case "dormir":
        if (i.type !== "abri") return;
        return this.endormir(true);
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
        if (poidsInventaire(this.inventaire) + CHARBON_PRODUIT > capaciteDe(this.inventaire)) return this.sacTropLourd();
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
      case "monter_dynamo": {
        if (i.type !== "pedalier" || i.etat.dynamo) return;
        if (!this.inventaire.dynamo_velo) return this.info(`Il te faut la dynamo du vélo. ${ouTrouverPhrase("dynamo_velo")}`);
        return this.commencer("Monter la dynamo sur le pédalier", 20, () => {
          if (!this.inventaire.dynamo_velo) return;
          this.retirerPlusieurs({ dynamo_velo: 1 });
          i.etat = { ...i.etat, dynamo: true };
          maj();
        }, 0, "outil");
      }
      case "pedaler": {
        if (i.type !== "pedalier" || !i.etat.dynamo) return;
        const cible = this.batterieAvecPlace();
        if (!cible) return this.info("Aucune batterie à charger, ou elles sont pleines : il faut une batterie pas pleine dans ton sac.");
        return this.commencer(
          "Pédaler pour charger la batterie",
          DUREE_PEDALAGE,
          () => {
            const wh = whEDePedalage(this.compte.famille);
            const ajoute = this.ajouterCharge(cible, wh);
            this.info(`+${Math.round(ajoute)} Wh dans ${nommer(cible, 1)}.`);
          },
          KCAL_PEDALAGE_EN_PLUS,
          "outil",
        );
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
      case "poser_batteries":
        if (i.type !== "banc_recharge") return;
        return this.poserBatteries(i);
      case "reprendre_batteries":
        if (i.type !== "banc_recharge") return;
        return this.reprendreBatteries(i);
      case "recharger": {
        if (i.type !== "banc_recharge") return;
        const n = this.inventaire.petite_batterie ?? 0;
        const place = capacite("petite_batterie", n) - (this.charges.petite_batterie ?? 0);
        const source = this.charges.batterie_voiture ?? 0;
        if (n === 0) return this.info("Tu n'as pas de petite batterie.");
        if (!this.inventaire.batterie_voiture || source <= 1) return this.info("Il faut une batterie de voiture chargée sur le banc.");
        if (place <= 0.5) return this.info("La petite batterie est déjà pleine.");
        const transfert = Math.min(place, source * RENDEMENT_BANC);
        const duree = Math.min(120, (transfert / WH_RECHARGE_PAR_HEURE) * 60);
        return this.commencer("Recharger la petite batterie", duree, () => {
          this.charges = {
            ...this.charges,
            batterie_voiture: Math.max(0, (this.charges.batterie_voiture ?? 0) - transfert / RENDEMENT_BANC),
            petite_batterie: (this.charges.petite_batterie ?? 0) + transfert,
          };
          this.envoyerCharges();
          this.info(`+${Math.round(transfert)} Wh dans la petite batterie.`);
        });
      }
    }
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

  private retirer(type: TypeObjet, n: number): void {
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

function poidsDe(objets: Inventaire): number {
  return poidsInventaire(objets);
}


function vue(feu: FeuEnBase): FeuVu {
  return { id: feu.id, x: feu.x, z: feu.z, bois: Math.round(feu.bois * 100) / 100, aspect: aspectFeu(feu) };
}
