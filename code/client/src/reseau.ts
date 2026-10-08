// Connexion WebSocket au serveur de jeu, avec reconnexion automatique.

import type { Intention } from "../../commun/src/deplacement.ts";
import { FERMETURE_INACTIF, FERMETURE_JETON_REFUSE, FERMETURE_REMPLACE, type MessageClient, type MessageServeur } from "../../commun/src/messages.ts";

export interface Evenements {
  message(message: MessageServeur): void;
  /** La connexion est perdue ; `tentative` compte les essais de reconnexion. */
  perdue(tentative: number): void;
  /** Le jeton n'est plus valable : il faut se reconnecter par mot de passe. */
  jetonRefuse(): void;
  /** Le compte vient d'être ouvert sur un autre appareil. */
  remplace(): void;
  /** Déconnecté d'office : rien fait depuis un moment (le serveur gèle alors les besoins). */
  inactif(): void;
}

const INTERVALLE_PING = 5000;
const RENVOI_INTENTION = 500;

export class Reseau {
  private socket: WebSocket | null = null;
  private tentative = 0;
  private arrete = false;
  private seq = 0;
  private derniereIntention = "";
  private dernierEnvoi = 0;
  private minuteriePing: number | undefined;
  /** Temps d'aller-retour mesuré, en millisecondes. */
  latence = 0;

  private readonly jeton: string;
  private readonly evenements: Evenements;

  constructor(jeton: string, evenements: Evenements) {
    this.jeton = jeton;
    this.evenements = evenements;
  }

  ouvrir(): void {
    this.arrete = false;
    const protocole = location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocole}://${location.host}/ws?jeton=${encodeURIComponent(this.jeton)}`);
    this.socket = socket;

    socket.addEventListener("open", () => {
      this.tentative = 0;
      this.derniereIntention = "";
      this.minuteriePing = window.setInterval(() => this.envoyer({ t: "ping", envoye: performance.now() }), INTERVALLE_PING);
    });

    socket.addEventListener("message", (e) => {
      const message = JSON.parse(String(e.data)) as MessageServeur;
      if (message.t === "pong") this.latence = performance.now() - message.envoye;
      this.evenements.message(message);
    });

    socket.addEventListener("close", (e) => {
      window.clearInterval(this.minuteriePing);
      if (this.socket !== socket || this.arrete) return;
      if (e.code === FERMETURE_JETON_REFUSE) return this.evenements.jetonRefuse();
      if (e.code === FERMETURE_REMPLACE) return this.evenements.remplace();
      if (e.code === FERMETURE_INACTIF) return this.evenements.inactif();
      this.tentative += 1;
      this.evenements.perdue(this.tentative);
      const delai = Math.min(8000, 500 * 2 ** (this.tentative - 1));
      window.setTimeout(() => {
        if (!this.arrete) this.ouvrir();
      }, delai);
    });
  }

  fermer(): void {
    this.arrete = true;
    this.socket?.close();
  }

  /** Envoie l'intention si elle a changé, et la renvoie régulièrement par sécurité. */
  envoyerIntention(intention: Intention): void {
    const cle = `${intention.dx.toFixed(3)}|${intention.dz.toFixed(3)}|${intention.allure}`;
    const instant = performance.now();
    if (cle === this.derniereIntention && instant - this.dernierEnvoi < RENVOI_INTENTION) return;
    this.seq += 1;
    if (this.envoyer({ t: "intention", ...intention, seq: this.seq })) {
      this.derniereIntention = cle;
      this.dernierEnvoi = instant;
    }
  }

  /** Envoie un message de jeu ; renvoie faux si la connexion n'est pas ouverte. */
  envoyer(message: MessageClient): boolean {
    if (this.socket?.readyState !== WebSocket.OPEN) return false;
    this.socket.send(JSON.stringify(message));
    return true;
  }
}
