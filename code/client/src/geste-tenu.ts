// Le geste court se fait-il en tenant A ? (plan 0.8 ; plan 0.8.2 §7.6.) Au clavier et à la souris, un geste court sur
// ce qu'on vise (ramasser, couper, creuser, fouiller…) se fait en tenant la touche : la lâcher l'arrête. Au toucher,
// un appui bref suffit : le geste va jusqu'au bout, comme une action longue ; un nouvel appui sur A ou un pas l'arrête.

import { GESTE_TENU_MAX_S } from "../../commun/src/regles.ts";

export interface GesteAnnonce {
  /** L'écran est tactile (le bouton rond A). */
  tactile: boolean;
  /** Une action sans cible (manger, boire, panser…). */
  sansCible: boolean;
  /** Une fabrication (le tas de matières devant soi). */
  fabrication: boolean;
  /** La durée annoncée par le serveur (s). */
  duree: number;
}

/** Vrai si lâcher A arrête ce geste. */
export function seFaitEnTenantA(g: GesteAnnonce): boolean {
  return !g.tactile && !g.sansCible && !g.fabrication && g.duree <= GESTE_TENU_MAX_S;
}
