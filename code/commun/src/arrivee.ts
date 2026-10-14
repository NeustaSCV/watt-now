// La vue d'ensemble à l'arrivée dans un lieu (0.8.2, chantier G ; plan 0.8 §9.4, R4 ; plan 0.8.2 §7.1, Q2).
//
// À chaque arrivée dans un lieu (le terrain compris, au retour d'une sortie ; jamais à une reconnexion sur place), la vue
// est dézoomée, toits visibles : on voit tout le lieu de loin. Au premier geste (une touche, un toucher), la vue zoome
// vers le personnage et le jeu commence. Deux façons d'attendre ce geste :
// - « pause » : là où l'on est seul (son terrain, sa Coopérative, son Moulin), la pause habituelle : le monde attend ;
// - « abri » : dans une halte (la station, le Carrefour, le gué), le monde ne s'arrête pas pour les autres ; le joueur
//   reste immobile et on ne peut pas le saisir, jusqu'à son premier geste ou au plus PROTECTION_ARRIVEE_MS.

import { TOUS_LES_LIEUX, type LieuId } from "./lieux.ts";
import { pausePossibleIci } from "./registre-lieux.ts";

export type ModeArrivee = "pause" | "abri";

/**
 * Les lieux où l'on est seul : la pause y est possible (la même règle que le bouton pause : le registre des lieux,
 * commun/src/registre-lieux.ts). Le terrain, la Coopérative, le Moulin ; en 0.10, l'hôtel et le phare.
 */
export const LIEUX_A_SOI: readonly LieuId[] = TOUS_LES_LIEUX.filter(pausePossibleIci);

/**
 * Dans une halte, la protection ne dure pas plus de 15 s : de quoi regarder le lieu, pas de quoi s'en servir pour
 * laisser passer un Éteint (on arrive toujours par une entrée, loin du gros de la halte).
 */
export const PROTECTION_ARRIVEE_MS = 15_000;

/** Comment on attend le premier geste dans ce lieu. */
export function modeArrivee(lieu: LieuId): ModeArrivee {
  return LIEUX_A_SOI.includes(lieu) ? "pause" : "abri";
}
