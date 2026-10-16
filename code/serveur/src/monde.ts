// Le monde vivant côté serveur : les connexions, le calcul à cadence fixe et la sauvegarde.
// Chaque joueur connecté est un `Joueur` (joueur.ts), qui porte ses propres règles.

import { monitorEventLoopDelay } from "node:perf_hooks";
import type { WebSocket } from "ws";
import { FERMETURE_INACTIF, FERMETURE_JETON_REFUSE, FERMETURE_REMPLACE, type MessageClient, type MessageServeur } from "../../commun/src/messages.ts";
import { TICK_HZ } from "../../commun/src/regles.ts";
import { REGLAGES, reglagesChanges, type Reglages } from "../../commun/src/reglages.ts";
import type { Base, Compte } from "./base.ts";
import { journal } from "./journal.ts";
import { Comptoir } from "./comptoir.ts";
import { Echanges } from "./echange.ts";
import { Lecons } from "./lecon.ts";
import { Cooperatives } from "./cooperative.ts";
import { Halte } from "./halte.ts";
import { Gue } from "./gue.ts";
import { Moulins } from "./moulin.ts";
import { Joueur } from "./joueur.ts";
import { LieuxVivants } from "./lieux-vivants.ts";
import { diffuserPresences, tourDePresences, type MemoirePresences } from "./presences.ts";
import { messageValide } from "./controle.ts";
import { Rencontres, temoins, type Present } from "./rencontres.ts";
import { Duels } from "./duel.ts";
import { CorpsAbsents, corpsResteIci } from "./corps-absent.ts";

/** Intervalle entre deux sauvegardes de chaque joueur, en millisecondes. */
const INTERVALLE_SAUVEGARDE = 5000;
/**
 * Les sauvegardes sont étalées sur ce nombre de tics (1 s) et groupées en transactions : sauver tout le monde
 * d'un coup figeait le serveur (≈ 25 ms pour 100 joueurs sur un M2, bien plus sur un Raspberry Pi, Book 17 §5.2).
 */
const TICS_ETALEMENT = 20;
/** La charge du serveur est mesurée chaque minute. */
const INTERVALLE_MESURES = 60_000;
/** Les rencontres (l'arbre de progression, 0.7) sont regardées une fois par seconde. */
const INTERVALLE_RENCONTRES = 1000;

interface Connexion {
  joueur: Joueur;
  socket: WebSocket;
  /** Où partent les messages du joueur : sa socket, rien quand il est parti (son corps resté), la nouvelle s'il revient. */
  sortie: Sortie;
  /** Pour mesurer la durée de la séance. */
  arrivee: number;
  /** Le dernier vrai geste du joueur (ms) : au-delà de `inactivite_min`, on le déconnecte. */
  activite: number;
}

/** La sortie des messages d'un joueur, qui survit à sa socket (0.11, le corps qui reste : corps-absent.ts). */
interface Sortie {
  socket: WebSocket | null;
}

export class Monde {
  private readonly connexions = new Map<number, Connexion>();
  /** 0.11 (D-18) : les corps restés une minute après la déconnexion, là où il y a des Éteints (corps-absent.ts). */
  private readonly corps = new CorpsAbsents<{ joueur: Joueur; sortie: Sortie }>();
  /** Ce qu'un joueur dont le corps est parti doit lire à son retour (son effondrement pendant la minute, D-18). */
  private readonly aDireAuRetour = new Map<number, string[]>();
  private minuterieTick: NodeJS.Timeout | undefined;
  private minuterieSauvegarde: NodeJS.Timeout | undefined;
  private dernierTick = performance.now();
  private readonly base: Base;
  private readonly debutMonde: number;
  /** La halte de la station-service : une seule instance en 0a (Book 21 §3.2). */
  private readonly halte: Halte;
  /** Le Comptoir du Carrefour : un seul pour tout le serveur (Book 21 §3.2). */
  private readonly comptoir: Comptoir;
  /** Les Coopératives, une par joueur (Book 23), chargées à la demande. */
  private readonly cooperatives: Cooperatives;
  /** 0.8, la route B : le Gué-aux-Saules, partagé comme la halte ; les Moulins du Gué, un par joueur. */
  private readonly gue: Gue;
  private readonly moulins: Moulins;
  /** 0.10 : tous les lieux vivants, rangés par le registre des lieux (les quatre d'avant, et ceux du niveau 2). */
  private readonly lieux: LieuxVivants;
  /** Les échanges entre joueurs (É4, lot 3). */
  private readonly echanges = new Echanges((id) => this.connexions.get(id)?.joueur);
  /** Les leçons entre joueurs de familles différentes (Book 25 §2.3). */
  private readonly lecons = new Lecons((id) => this.connexions.get(id)?.joueur);
  /**
   * Le duel entre joueurs (0.11, serveur/src/duel.ts) : un seul registre pour tout le serveur. Au premier coup, l'échange
   * et la leçon en cours des deux duellistes s'annulent.
   */
  private readonly duels = new Duels({
    trouver: (id) => this.connexions.get(id)?.joueur.duelliste,
    tous: () => [...this.connexions.values()].map(({ joueur }) => joueur.duelliste),
    maintenant: () => Date.now(),
    alea: () => Math.random(),
    auPremierCoup: (a, b) => {
      for (const d of [a, b]) {
        const j = this.connexions.get(d.id)?.joueur;
        if (!j) continue;
        this.echanges.annuler(j, "Un duel commence : l'échange est annulé.");
        this.lecons.annuler(j, "Un duel commence : la leçon s'arrête.");
      }
    },
  });
  /** Le ping de chacun (0.11) : l'heure d'envoi du dernier « ping » de WebSocket, en attente de sa réponse. */
  private readonly pingsEnvoyes = new Map<number, number>();
  /** Les tours de serveur comptés depuis le démarrage : les présences partent un tour sur deux (0.9, `tourDePresences`). */
  private tours = 0;
  /** Les rencontres entre familles et le « voir faire » (l'arbre de progression, 0.7). */
  private readonly rencontres = new Rencontres();
  private dernieresRencontres = 0;
  private minuterieMesures: NodeJS.Timeout | undefined;
  private readonly retard = monitorEventLoopDelay({ resolution: 10 });
  private cpuAvant = process.cpuUsage();
  /** Ce que chacun a déjà reçu des autres (présences allégées). */
  private readonly memoirePresences: MemoirePresences = new Map();
  /** Les joueurs à sauvegarder dans les prochains tics, et combien par tic. */
  private aSauver: number[] = [];
  private parTic = 1;

  constructor(base: Base) {
    this.base = base;
    this.debutMonde = base.debutMonde();
    this.halte = new Halte(base);
    this.comptoir = new Comptoir(base);
    this.cooperatives = new Cooperatives(base);
    this.gue = new Gue(base);
    this.moulins = new Moulins(base);
    this.lieux = new LieuxVivants(base, { station: this.halte, cooperative: this.cooperatives, gue: this.gue, moulin: this.moulins });
  }

  demarrer(): void {
    this.dernierTick = performance.now();
    // La charge du serveur, mesurée chaque minute (Book 17 §6) : processeur, mémoire, retard de la boucle, joueurs.
    this.retard.enable();
    this.cpuAvant = process.cpuUsage();
    this.minuterieMesures = setInterval(() => this.mesurerServeur(), INTERVALLE_MESURES);
    this.minuterieTick = setInterval(() => this.tick(), 1000 / TICK_HZ);
    this.minuterieSauvegarde = setInterval(() => this.planifierSauvegardes(), INTERVALLE_SAUVEGARDE);
  }

  arreter(): void {
    clearInterval(this.minuterieMesures);
    this.retard.disable();
    clearInterval(this.minuterieTick);
    clearInterval(this.minuterieSauvegarde);
    this.sauvegarder();
  }

  /** Les réglages ont changé : tous les joueurs connectés les reçoivent (ils en ont besoin pour prédire et afficher). */
  diffuserReglages(changes: Partial<Reglages>): void {
    for (const { socket } of this.connexions.values()) envoyer(socket, { t: "reglages", reglages: changes });
  }

  private mesurerServeur(): void {
    const cpu = process.cpuUsage(this.cpuAvant);
    this.cpuAvant = process.cpuUsage();
    const instant = Date.now();
    const m = (quoi: string, valeur: number) =>
      this.base.mesurer({ instant, compteId: 0, famille: "", genre: "serveur", quoi, valeur: Math.round(valeur * 100) / 100 });
    m("processeur (% d'un cœur)", ((cpu.user + cpu.system) / 1000 / INTERVALLE_MESURES) * 100);
    m("mémoire (Mo)", process.memoryUsage().rss / 1_048_576);
    m("retard de boucle p99 (ms)", this.retard.percentile(99) / 1e6);
    m("retard de boucle max (ms)", this.retard.max / 1e6);
    m("joueurs connectés", this.connexions.size);
    this.retard.reset();
  }

  get nombreConnectes(): number {
    return this.connexions.size;
  }

  rejoindre(compte: Compte, socket: WebSocket): void {
    const ancienne = this.connexions.get(compte.id);
    if (ancienne) {
      // Même compte ouvert ailleurs : on garde la nouvelle connexion.
      this.quitter(compte.id);
      ancienne.socket.close(FERMETURE_REMPLACE, "Connecté ailleurs");
    }

    // Son corps est encore là (parti il y a moins d'une minute, D-18) : il reprend la main sur le même joueur, là où il est.
    const reste = this.corps.reprendre(compte.id);
    let joueur: Joueur;
    let sortie: Sortie;
    if (reste) {
      ({ joueur, sortie } = reste);
      sortie.socket = socket;
      // Le nouveau client ne voit encore personne : les présences repartent de zéro pour lui.
      this.memoirePresences.delete(compte.id);
      this.comptoir.doter();
    } else {
      sortie = { socket };
      try {
        // Un nouveau joueur apporte sa dotation à la trésorerie du comptoir (Book 07 §3.6).
        this.comptoir.doter();
        joueur = new Joueur(compte, this.base, (m) => sortie.socket && envoyer(sortie.socket, m), Date.now, this.halte, Math.random, this.comptoir, this.cooperatives, this.gue, this.moulins, this.lieux);
      } catch (erreur) {
        journal(`Impossible de charger ${compte.pseudo} : ${String(erreur)}`);
        socket.close(1011, "Personnage introuvable");
        return;
      }
    }
    // `activite` : le dernier vrai geste du joueur (pas les pings, ni l'intention « ne pas bouger » renvoyée par sécurité).
    const connexion = { joueur, socket, sortie, arrivee: Date.now(), activite: Date.now() };
    this.connexions.set(compte.id, connexion);
    joueur.duels = this.duels;
    // Le ping (0.11, chantier C) : le navigateur répond seul aux « ping » du protocole WebSocket ; le duel juge le coup
    // d'après ce que voyait le frappeur, un demi-aller-retour plus tôt.
    socket.on?.("pong", () => {
      const envoye = this.pingsEnvoyes.get(compte.id);
      if (envoye !== undefined && this.connexions.get(compte.id) === connexion) this.duels.noterPing(compte.id, Date.now() - envoye);
    });
    // « Voir faire » (Q7) : ceux qui sont à 5 m de lui, dans un lieu public, y penseront aussi.
    joueur.surFabrication = (recette) => {
      const presents = this.presents();
      const moi = presents.find((p) => p.id === compte.id);
      if (moi) for (const t of temoins(moi, presents)) this.connexions.get(t.id)?.joueur.vuFaire(recette);
    };

    socket.on("message", (donnees) => {
      let message: MessageClient;
      try {
        const brut: unknown = JSON.parse(donnees.toString());
        // Un client modifié peut envoyer n'importe quoi : seule la forme attendue passe (controle.ts).
        if (!messageValide(brut)) return;
        message = brut;
      } catch {
        return;
      }
      if (estUnGeste(message)) connexion.activite = Date.now();
      try {
        if (message.t === "echange") this.echanges.traiter(joueur, message.op);
        else if (message.t === "lecon") this.lecons.traiter(joueur, message.op);
        else joueur.recevoir(message);
      } catch (erreur) {
        journal(`Message refusé de ${compte.pseudo} : ${String(erreur)}`);
      }
    });
    socket.on("close", () => {
      if (this.connexions.get(compte.id) === connexion) this.quitter(compte.id);
    });

    envoyer(socket, { t: "reglages", reglages: reglagesChanges() });
    envoyer(socket, joueur.bienvenue(this.debutMonde));
    if (reste) {
      joueur.reprendreLeCorps();
      journal(`${compte.pseudo} revient dans son corps (${this.connexions.size} connecté(s))`);
      return;
    }
    // Ce que la base a fait pendant l'absence (Book 01 §2 bis).
    if (joueur.rapport) envoyer(socket, { t: "rapport", rapport: joueur.rapport });
    // Son corps s'est effondré pendant la minute après sa déconnexion (0.11, D-18) : on le lui dit maintenant.
    for (const texte of this.aDireAuRetour.get(compte.id) ?? []) envoyer(socket, { t: "info", texte });
    this.aDireAuRetour.delete(compte.id);
    journal(`${compte.pseudo} arrive (${this.connexions.size} connecté(s))`);
  }

  /**
   * La connexion se ferme (ou est remplacée, ou fermée par l'admin). `laisserLeCorps` : là où il y a des Éteints, son
   * corps reste une minute (D-18) ; faux pour la page d'administration, qui le fait partir tout de suite.
   */
  private quitter(compteId: number, laisserLeCorps = true): void {
    const connexion = this.connexions.get(compteId);
    if (!connexion) return;
    const { joueur } = connexion;
    this.echanges.annuler(joueur, `${joueur.compte.pseudo} est parti.`);
    this.lecons.annuler(joueur, `${joueur.compte.pseudo} est parti : la leçon s'arrête.`);
    // Se déconnecter pendant un duel, c'est le perdre tout de suite (0.11, §6, D-13).
    this.duels.abandonner(compteId);
    this.pingsEnvoyes.delete(compteId);
    joueur.sauvegarder();
    this.connexions.delete(compteId);
    connexion.sortie.socket = null;
    const c = joueur.compte;
    this.base.mesurer({ instant: Date.now(), compteId: c.id, famille: c.famille, genre: "session", quoi: "séance", valeur: (Date.now() - connexion.arrivee) / 1000 });
    // Le corps reste une minute, immobile, exposé aux Éteints (D-18 ; corps-absent.ts).
    if (laisserLeCorps && corpsResteIci(joueur.etatPourCorps)) {
      joueur.laisserLeCorps();
      this.corps.laisser(compteId, { joueur, sortie: connexion.sortie }, Date.now());
      journal(`${c.pseudo} part, état sauvegardé, son corps reste une minute (${this.connexions.size} connecté(s))`);
      return;
    }
    joueur.partir();
    journal(`${c.pseudo} part, état sauvegardé (${this.connexions.size} connecté(s))`);
  }

  /** Les corps restés vivent comme les autres ; au bout de la minute (ou effondrés), ils s'en vont, sauvegarde à jour. */
  private tickCorps(dt: number): void {
    for (const { joueur } of this.corps.tous()) {
      try {
        joueur.tick(dt);
      } catch (erreur) {
        journal(`Erreur de calcul pour ${joueur.compte.pseudo} : ${String(erreur)}`);
      }
    }
    for (const { joueur } of this.corps.aRenvoyer(Date.now(), ({ joueur }) => corpsResteIci(joueur.etatPourCorps))) this.renvoyerCorps(joueur);
  }

  private renvoyerCorps(joueur: Joueur, sauver = true): void {
    joueur.corpsAbsent = false;
    if (joueur.aDireAuRetour.length > 0) this.aDireAuRetour.set(joueur.compte.id, joueur.aDireAuRetour);
    if (sauver) joueur.sauvegarder();
    joueur.partir();
    this.aSauver = this.aSauver.filter((id) => id !== joueur.compte.id);
    journal(`Le corps de ${joueur.compte.pseudo} s'en va.`);
  }

  private tick(): void {
    const instant = performance.now();
    const dt = Math.min((instant - this.dernierTick) / 1000, 0.25);
    this.dernierTick = instant;
    // La halte, les Coopératives, le gué, les Moulins, puis les lieux du niveau 2 où quelqu'un est déjà allé.
    this.lieux.tick(Date.now(), dt);
    this.echanges.verifier();
    this.lecons.verifier();
    // Les autres joueurs d'un lieu public : 10 fois par seconde, à pas fixe (0.9 ; avant, 100 ou 150 ms selon les tours).
    if (tourDePresences(this.tours++)) this.diffuserPresences();
    if (instant - this.dernieresRencontres >= INTERVALLE_RENCONTRES) {
      const dtRencontres = this.dernieresRencontres > 0 ? (instant - this.dernieresRencontres) / 1000 : 1;
      this.dernieresRencontres = instant;
      for (const [a, b] of this.rencontres.verifier(this.presents(), Math.min(dtRencontres, 2))) {
        this.connexions.get(a.id)?.joueur.noterRencontre(b.famille);
        this.connexions.get(b.id)?.joueur.noterRencontre(a.famille);
      }
    }
    for (const { joueur } of this.connexions.values()) {
      try {
        joueur.tick(dt);
      } catch (erreur) {
        journal(`Erreur de calcul pour ${joueur.compte.pseudo} : ${String(erreur)}`);
      }
    }
    this.tickCorps(dt);
    // Le duel (0.11) : les positions de la dernière seconde, la fuite, après le pas de chaque joueur.
    this.duels.tick();
    this.sauvegarderUnPeu();
  }

  /** Toutes les 5 s : chacun est mis dans la file des sauvegardes, qui se vide sur une seconde. */
  /**
   * Un joueur qui ne fait plus rien depuis `inactivite_min` minutes est déconnecté d'office (2026-10-08) : il a sans
   * doute fermé la page ou quitté son écran. Hors ligne, ses besoins sont gelés (Book 01 §2 bis) ; connecté, ils
   * continueraient de baisser pour rien. En pause (0.10.1, C2), le monde attend le joueur : on ne le déconnecte pas, et
   * le compte ne repart qu'à la fin de la pause.
   */
  private deconnecterInactifs(): void {
    const limite = Date.now() - REGLAGES.inactivite_min * 60_000;
    for (const c of this.connexions.values()) {
      if (c.joueur.enPause()) c.activite = Date.now();
      if (c.activite >= limite) continue;
      journal(`${c.joueur.compte.pseudo} ne joue plus depuis ${REGLAGES.inactivite_min} min : déconnecté.`);
      c.socket.close(FERMETURE_INACTIF, "Inactif");
    }
  }

  private planifierSauvegardes(): void {
    this.deconnecterInactifs();
    this.mesurerPings();
    const deja = new Set(this.aSauver);
    for (const id of [...this.connexions.keys(), ...this.corps.ids()]) if (!deja.has(id)) this.aSauver.push(id);
    this.parTic = Math.max(1, Math.ceil(this.aSauver.length / TICS_ETALEMENT));
  }

  /** Toutes les 5 s, un « ping » du protocole WebSocket à chacun (0.11) : sa réponse donne l'aller-retour. */
  private mesurerPings(): void {
    for (const [id, { socket }] of this.connexions) {
      if (socket.readyState !== socket.OPEN || typeof socket.ping !== "function") continue;
      this.pingsEnvoyes.set(id, Date.now());
      try {
        socket.ping();
      } catch {
        // Une socket qui se ferme : son ping n'a plus d'importance.
      }
    }
  }

  private sauvegarderUnPeu(): void {
    if (this.aSauver.length === 0) return;
    const lot = this.aSauver.splice(0, this.parTic);
    try {
      this.base.transaction(() => {
        for (const id of lot) (this.connexions.get(id) ?? this.corps.get(id))?.joueur.sauvegarder();
      });
    } catch (erreur) {
      journal(`Sauvegarde impossible : ${String(erreur)}`);
    }
  }

  /** Dans chaque lieu public, chacun voit les autres joueurs proches (Book 01 §2 bis ; présences allégées, presences.ts). */
  private diffuserPresences(): void {
    // Les corps restés aussi (D-18) : dans une halte, les autres le voient, debout et immobile.
    const voisins = diffuserPresences(
      [...this.connexions.values(), ...this.corps.tous()].map(({ joueur }) => ({
        id: joueur.compte.id,
        lieu: joueur.enLieuPublic ? joueur.lieu : null,
        vu: joueur.vu,
        allure: joueur.allureVue,
        gestes: joueur.gestesRecents,
        envoyer: (m: MessageServeur) => joueur.envoyer(m),
      })),
      this.memoirePresences,
      // Dans une halte, ses murs arrêtent la vue : la boutique de la station (0.7.2), la cabane du gué (0.8)…
      (lieu, a, b) => this.lieux.voitEntre(lieu, a, b),
    );
    // Les jauges du duel (0.11) : aux mêmes, au même tour, quand elles changent.
    this.duels.diffuser(voisins);
  }

  /** Les joueurs connectés, et le lieu public où chacun se trouve (pour les rencontres et le « voir faire »). */
  private presents(): Present[] {
    return [...this.connexions.values()].map(({ joueur }) => ({
      id: joueur.compte.id,
      famille: joueur.compte.famille,
      lieu: joueur.enLieuPublic ? joueur.lieu : null,
      x: joueur.vu.x,
      z: joueur.vu.z,
    }));
  }

  /** Sauvegarde tout le monde d'un coup (à l'arrêt du serveur), en une seule transaction. */
  sauvegarder(): void {
    this.aSauver = [];
    this.base.transaction(() => {
      for (const { joueur } of [...this.connexions.values(), ...this.corps.tous()]) joueur.sauvegarder();
    });
  }

  // ---------- La page d'administration (P-014, admin-web.ts) : la mémoire du serveur, en lecture, et la déconnexion ----------

  /** Les joueurs connectés à l'instant (pas d'historique, pas de pic) : qui, de quelle famille, dans quel lieu. */
  connectes(): { id: number; pseudo: string; famille: Compte["famille"]; lieu: string }[] {
    return [...this.connexions.values()].map(({ joueur }) => ({ id: joueur.compte.id, pseudo: joueur.compte.pseudo, famille: joueur.compte.famille, lieu: joueur.lieu }));
  }

  /**
   * Déconnecte un joueur depuis la page d'administration : son état est sauvegardé d'abord (comme à un départ), puis
   * la connexion est fermée comme un jeton refusé (le client revient à l'écran de connexion). `oublier` : le compte
   * va être supprimé, sa Coopérative chargée en mémoire est lâchée sans être réécrite. Renvoie true s'il était connecté.
   */
  deconnecter(compteId: number, oublier = false): boolean {
    const connexion = this.connexions.get(compteId);
    if (connexion) {
      this.quitter(compteId, false);
      connexion.socket.close(FERMETURE_JETON_REFUSE, "Session fermée");
    }
    // Son corps resté (D-18) part aussi, tout de suite ; un compte qu'on supprime n'est pas réécrit.
    const reste = this.corps.reprendre(compteId);
    if (reste) this.renvoyerCorps(reste.joueur, !oublier);
    this.aSauver = this.aSauver.filter((id) => id !== compteId);
    if (oublier) this.lieux.oublier(compteId);
    return connexion !== undefined || reste !== undefined;
  }
}

/**
 * Un message diffusé à plusieurs joueurs (le même objet) n'est mis en forme qu'une fois : on garde le dernier texte.
 * Chaque message est un objet neuf : on ne renvoie jamais un objet modifié entre deux envois.
 */
let dernierMessage: MessageServeur | null = null;
let dernierTexte = "";
function envoyer(socket: WebSocket, message: MessageServeur): void {
  if (socket.readyState !== socket.OPEN) return;
  if (message !== dernierMessage) {
    dernierMessage = message;
    dernierTexte = JSON.stringify(message);
  }
  socket.send(dernierTexte);
}

/** Un vrai geste du joueur (ce qui le garde connecté) : pas un ping, pas une mesure, pas « je ne bouge pas ». */
export function estUnGeste(m: MessageClient): boolean {
  if (m.t === "ping" || m.t === "mesures") return false;
  if (m.t === "intention") return m.dx !== 0 || m.dz !== 0;
  return true;
}
