// La vue d'ensemble à l'arrivée, côté serveur (0.8.2, chantier G ; commun/src/arrivee.ts). Le joueur l'appelle en trois
// points : à l'arrivée d'un voyage (`commencer`), à chaque message reçu (`recevoir`), et pour savoir si on peut le saisir
// (`protege`). L'état ne vit qu'en mémoire : une reconnexion n'en garde rien (pas de vue d'ensemble sur place).
//
// - Seul (son terrain, sa Coopérative, son Moulin) : la pause habituelle du joueur (son drapeau `pause`), levée au
//   premier geste ; le monde attend aussi longtemps qu'il le faut, comme pour la pause du bouton.
// - Dans une halte : pas de pause ; le joueur n'a rien demandé, il ne bouge pas, et on ne peut pas le saisir jusqu'à son
//   premier geste, au plus PROTECTION_ARRIVEE_MS.
// Le premier geste : le message « arrivee » du client, ou tout geste de jeu (bouger, frapper, agir…) ; ne comptent pas
// les messages que le client envoie seul (ping, mesures, recettes vues, constats, une intention de repos). Un client
// d'avant la 0.8.2, qui n'envoie jamais « arrivee », sort donc de la pause dès qu'il bouge.

import { PROTECTION_ARRIVEE_MS, modeArrivee, type ModeArrivee } from "../../commun/src/arrivee.ts";
import type { LieuId } from "../../commun/src/lieux.ts";
import type { MessageClient } from "../../commun/src/messages.ts";

/** Les messages que le client envoie sans geste du joueur : ils ne mettent pas fin à l'attente. */
// 0.11 : le mode (Combat ou Exploration) part aussi tout seul, quand un Éteint approche (D-17).
const SANS_GESTE: ReadonlySet<MessageClient["t"]> = new Set(["ping", "mesures", "recettes_vues", "constat", "mode"]);

export class AttenteArrivee {
  private mode: ModeArrivee | null = null;
  /** Dans une halte : la fin de la protection (instant du serveur). */
  private jusqua = 0;

  /** Lever la pause du joueur (seul). */
  private readonly lever: () => void;

  constructor(lever: () => void) {
    this.lever = lever;
  }

  /** On arrive dans un lieu : renvoie ce que le client doit savoir (Bienvenue.arrivee). La pause, s'il en faut une, est au joueur. */
  commencer(lieu: LieuId, instant: number): { mode: ModeArrivee; protection: number } {
    this.mode = modeArrivee(lieu);
    this.jusqua = this.mode === "abri" ? instant + PROTECTION_ARRIVEE_MS : 0;
    return { mode: this.mode, protection: this.mode === "abri" ? PROTECTION_ARRIVEE_MS : 0 };
  }

  /** L'attente en cours (null : on joue). */
  get enCours(): ModeArrivee | null {
    return this.mode;
  }

  /** Dans une halte, à l'abri des coups : on ne peut pas le saisir. */
  protege(instant: number): boolean {
    if (this.mode !== "abri") return false;
    if (instant < this.jusqua) return true;
    this.mode = null;
    return false;
  }

  /**
   * À chaque message du client, avant tout : un geste met fin à l'attente. Renvoie vrai si le message est consommé
   * (« arrivee » : il n'y a rien d'autre à en faire).
   */
  recevoir(m: MessageClient): boolean {
    if (m.t === "arrivee") {
      this.finir();
      return true;
    }
    if (this.mode === null || SANS_GESTE.has(m.t)) return false;
    if (m.t === "intention" && Math.hypot(m.dx, m.dz) <= 0.01) return false;
    this.finir();
    return false;
  }

  /** Le premier geste : on joue (seul, la pause est levée). */
  private finir(): void {
    if (this.mode === "pause") this.lever();
    this.mode = null;
    this.jusqua = 0;
  }
}
