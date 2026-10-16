// Le corps qui reste à la déconnexion (0.11, chantier E ; duel-entre-joueurs.md D-13 et D-18).
//
// Partout où il y a des Éteints (les quatre haltes et les lieux à soi), toute déconnexion laisse le corps une minute,
// immobile, exposé : les Éteints le voient, le mordent, le saisissent comme un joueur ; sa santé encaisse ; s'il
// s'effondre, c'est l'effondrement habituel (le sac reste sur place). Dans une halte, les autres le voient, debout.
// Reconnecté avant la fin, le joueur reprend la main là où est son corps, dans l'état où il est (le même objet `Joueur`).
// Au bout de la minute, le corps s'en va : sauvegarde à jour, puis le départ d'aujourd'hui (`Joueur.partir`).
//
// Pas de corps sur le terrain, au Comptoir ni en route (il disparaît tout de suite, comme avant), ni en pause : le monde
// attend celui qui est en pause (son lieu à soi ne bouge plus), il n'est donc pas exposé, et il part comme avant.
// Les corps ne vivent qu'en mémoire : si le serveur redémarre pendant la minute, le joueur revient comme aujourd'hui
// (à l'entrée la plus proche, d'après la dernière sauvegarde).
//
// Le monde (monde.ts) garde ici les corps de ceux qui sont partis ; il les fait vivre à chaque tic, les montre aux autres
// (les présences), les sauvegarde avec les autres, et les rend au départ ou à la reconnexion.

import type { LieuId } from "../../commun/src/lieux.ts";
import { estHalte, estPersonnel } from "../../commun/src/registre-lieux.ts";

/** Combien de temps le corps reste après la déconnexion (D-18 : une minute). */
export const DUREE_CORPS_ABSENT_MS = 60_000;

/** Ce que le joueur dit de lui pour savoir si son corps reste. */
export interface EtatPourCorps {
  lieu: LieuId;
  enRoute: boolean;
  enPause: boolean;
}

/** Le corps reste-t-il ici ? Là où il y a des Éteints (une halte, un lieu à soi), ni en route ni en pause. */
export function corpsResteIci(e: EtatPourCorps): boolean {
  if (e.enRoute || e.enPause) return false;
  return estHalte(e.lieu) || estPersonnel(e.lieu);
}

/** Les corps laissés par ceux qui sont partis : par compte, ce qu'on rendra à la reconnexion, et jusqu'à quand. */
export class CorpsAbsents<T> {
  private readonly corps = new Map<number, { quoi: T; jusqua: number }>();

  /** Le joueur vient de partir : son corps reste jusqu'à `instant` + une minute. */
  laisser(compteId: number, quoi: T, instant: number): void {
    this.corps.set(compteId, { quoi, jusqua: instant + DUREE_CORPS_ABSENT_MS });
  }

  /** Le joueur revient (ou le corps doit partir) : on le rend, et il n'est plus ici. */
  reprendre(compteId: number): T | undefined {
    const c = this.corps.get(compteId);
    this.corps.delete(compteId);
    return c?.quoi;
  }

  get(compteId: number): T | undefined {
    return this.corps.get(compteId)?.quoi;
  }

  /** Les corps présents, pour les faire vivre et les montrer. */
  tous(): T[] {
    return [...this.corps.values()].map((c) => c.quoi);
  }

  ids(): number[] {
    return [...this.corps.keys()];
  }

  get nombre(): number {
    return this.corps.size;
  }

  /**
   * Les corps qui s'en vont : la minute est passée, ou ils ne peuvent plus rester (effondrés, donc ramenés chez eux).
   * Ils sont retirés ; à l'appelant de les faire partir.
   */
  aRenvoyer(instant: number, resteIci: (quoi: T) => boolean): T[] {
    const partis: T[] = [];
    for (const [id, c] of this.corps) {
      if (instant < c.jusqua && resteIci(c.quoi)) continue;
      this.corps.delete(id);
      partis.push(c.quoi);
    }
    return partis;
  }
}
