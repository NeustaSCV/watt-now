// Le monde vivant côté serveur : les connexions, le calcul à cadence fixe et la sauvegarde.
// Chaque joueur connecté est un `Joueur` (joueur.ts), qui porte ses propres règles.

import { monitorEventLoopDelay } from "node:perf_hooks";
import type { WebSocket } from "ws";
import { FERMETURE_INACTIF, FERMETURE_REMPLACE, type MessageClient, type MessageServeur } from "../../commun/src/messages.ts";
import { TICK_HZ } from "../../commun/src/regles.ts";
import { REGLAGES, reglagesChanges, type Reglages } from "../../commun/src/reglages.ts";
import type { Base, Compte } from "./base.ts";
import { journal } from "./journal.ts";
import { Comptoir } from "./comptoir.ts";
import { Echanges } from "./echange.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { diffuserPresences, type MemoirePresences } from "./presences.ts";
import { messageValide } from "./controle.ts";

/** Intervalle entre deux sauvegardes de chaque joueur, en millisecondes. */
const INTERVALLE_SAUVEGARDE = 5000;
/**
 * Les sauvegardes sont étalées sur ce nombre de tics (1 s) et groupées en transactions : sauver tout le monde
 * d'un coup figeait le serveur (≈ 25 ms pour 100 joueurs sur un M2, bien plus sur un Raspberry Pi, Book 17 §5.2).
 */
const TICS_ETALEMENT = 20;
/** La charge du serveur est mesurée chaque minute. */
const INTERVALLE_MESURES = 60_000;
/** Les autres joueurs d'un lieu public sont envoyés 10 fois par seconde. */
const INTERVALLE_PRESENCES = 100;

interface Connexion {
  joueur: Joueur;
  socket: WebSocket;
  /** Pour mesurer la durée de la séance. */
  arrivee: number;
  /** Le dernier vrai geste du joueur (ms) : au-delà de `inactivite_min`, on le déconnecte. */
  activite: number;
}

export class Monde {
  private readonly connexions = new Map<number, Connexion>();
  private minuterieTick: NodeJS.Timeout | undefined;
  private minuterieSauvegarde: NodeJS.Timeout | undefined;
  private dernierTick = performance.now();
  private readonly base: Base;
  private readonly debutMonde: number;
  /** La halte de la station-service : une seule instance en 0a (Book 21 §3.2). */
  private readonly halte: Halte;
  /** Le Comptoir du Carrefour : un seul pour tout le serveur (Book 21 §3.2). */
  private readonly comptoir: Comptoir;
  /** Les échanges entre joueurs (É4, lot 3). */
  private readonly echanges = new Echanges((id) => this.connexions.get(id)?.joueur);
  private dernieresPresences = 0;
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

    let joueur: Joueur;
    try {
      // Un nouveau joueur apporte sa dotation à la trésorerie du comptoir (Book 07 §3.6).
      this.comptoir.doter();
      joueur = new Joueur(compte, this.base, (m) => envoyer(socket, m), Date.now, this.halte, Math.random, this.comptoir);
    } catch (erreur) {
      journal(`Impossible de charger ${compte.pseudo} : ${String(erreur)}`);
      socket.close(1011, "Personnage introuvable");
      return;
    }
    // `activite` : le dernier vrai geste du joueur (pas les pings, ni l'intention « ne pas bouger » renvoyée par sécurité).
    const connexion = { joueur, socket, arrivee: Date.now(), activite: Date.now() };
    this.connexions.set(compte.id, connexion);

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
    // Ce que la base a fait pendant l'absence (Book 01 §2 bis).
    if (joueur.rapport) envoyer(socket, { t: "rapport", rapport: joueur.rapport });
    journal(`${compte.pseudo} arrive (${this.connexions.size} connecté(s))`);
  }

  private quitter(compteId: number): void {
    const connexion = this.connexions.get(compteId);
    if (!connexion) return;
    this.echanges.annuler(connexion.joueur, `${connexion.joueur.compte.pseudo} est parti.`);
    connexion.joueur.sauvegarder();
    connexion.joueur.partir();
    this.connexions.delete(compteId);
    const c = connexion.joueur.compte;
    this.base.mesurer({ instant: Date.now(), compteId: c.id, famille: c.famille, genre: "session", quoi: "séance", valeur: (Date.now() - connexion.arrivee) / 1000 });
    journal(`${connexion.joueur.compte.pseudo} part, état sauvegardé (${this.connexions.size} connecté(s))`);
  }

  private tick(): void {
    const instant = performance.now();
    const dt = Math.min((instant - this.dernierTick) / 1000, 0.25);
    this.dernierTick = instant;
    this.halte.tick(Date.now(), dt);
    this.echanges.verifier();
    if (instant - this.dernieresPresences >= INTERVALLE_PRESENCES) {
      this.dernieresPresences = instant;
      this.diffuserPresences();
    }
    for (const { joueur } of this.connexions.values()) {
      try {
        joueur.tick(dt);
      } catch (erreur) {
        journal(`Erreur de calcul pour ${joueur.compte.pseudo} : ${String(erreur)}`);
      }
    }
    this.sauvegarderUnPeu();
  }

  /** Toutes les 5 s : chacun est mis dans la file des sauvegardes, qui se vide sur une seconde. */
  /**
   * Un joueur qui ne fait plus rien depuis `inactivite_min` minutes est déconnecté d'office (2026-10-08) : il a sans
   * doute fermé la page ou quitté son écran. Hors ligne, ses besoins sont gelés (Book 01 §2 bis) ; connecté, ils
   * continueraient de baisser pour rien.
   */
  private deconnecterInactifs(): void {
    const limite = Date.now() - REGLAGES.inactivite_min * 60_000;
    for (const c of this.connexions.values()) {
      if (c.activite >= limite) continue;
      journal(`${c.joueur.compte.pseudo} ne joue plus depuis ${REGLAGES.inactivite_min} min : déconnecté.`);
      c.socket.close(FERMETURE_INACTIF, "Inactif");
    }
  }

  private planifierSauvegardes(): void {
    this.deconnecterInactifs();
    const deja = new Set(this.aSauver);
    for (const id of this.connexions.keys()) if (!deja.has(id)) this.aSauver.push(id);
    this.parTic = Math.max(1, Math.ceil(this.aSauver.length / TICS_ETALEMENT));
  }

  private sauvegarderUnPeu(): void {
    if (this.aSauver.length === 0) return;
    const lot = this.aSauver.splice(0, this.parTic);
    try {
      this.base.transaction(() => {
        for (const id of lot) this.connexions.get(id)?.joueur.sauvegarder();
      });
    } catch (erreur) {
      journal(`Sauvegarde impossible : ${String(erreur)}`);
    }
  }

  /** Dans chaque lieu public, chacun voit les autres joueurs proches (Book 01 §2 bis ; présences allégées, presences.ts). */
  private diffuserPresences(): void {
    diffuserPresences(
      [...this.connexions.values()].map(({ joueur }) => ({
        id: joueur.compte.id,
        lieu: joueur.enLieuPublic ? joueur.lieu : null,
        vu: joueur.vu,
        envoyer: (m: MessageServeur) => joueur.envoyer(m),
      })),
      this.memoirePresences,
    );
  }

  /** Sauvegarde tout le monde d'un coup (à l'arrêt du serveur), en une seule transaction. */
  sauvegarder(): void {
    this.aSauver = [];
    this.base.transaction(() => {
      for (const { joueur } of this.connexions.values()) joueur.sauvegarder();
    });
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
