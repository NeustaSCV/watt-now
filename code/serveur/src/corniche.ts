// H2B, la corniche du Cap Rouge, côté serveur (plan 0.10, chantier I) : une halte partagée, construite d'après le
// registre des lieux (sa zone, son plan de vue et son contenu : commun/src/corniche.ts, corniche-contenu.ts,
// contenu-lieux.ts). Le pin tombé (le tas de bois personnel), la pierre et le bois, les fouilles, les Éteints passent
// par le moteur commun des lieux vivants (serveur/src/lieu-vivant.ts) : rien à écrire ici pour eux.
//
// Ce qui lui est propre : **le péage du tunnel** (§3.4, S-19 : la même règle que le pont, 12 wotts d'objets, 1 h de
// passage libre). La règle est dans commun/src/peage.ts (chantier H, générique : `passage: "pont" | "tunnel"`).
//
// ---------- Le point d'appel du péage (à brancher quand commun/src/peage.ts est là) ----------
//
// 1. `geste` (ci-dessous) : toucher la caisse (`CAISSE_PEAGE`, commun/src/corniche.ts) et payer (`payer_passage`,
//    `passage: "tunnel"`) passent par le module du péage ; le message `passage` dit au client si la porte est ouverte
//    pour lui (rendu/corniche.ts, `barricade(ouverte)`).
// 2. La zone d'un joueur qui a payé : `zoneCorniche(true)` (commun/src/corniche.ts : la porte de la barricade retirée),
//    au serveur (le déplacement du joueur) comme au client (main.ts, zoneIci) ; les autres gardent `ZONE_CORNICHE`, la
//    porte fermée. Les Éteints restent dans la zone fermée (ils ne passent pas la barricade).
// 3. Question au porteur (compte rendu du chantier I) : la caisse est du côté ouest (on vient du terrain) ; au retour du
//    phare, après l'heure de passage, la porte s'ouvre-t-elle depuis l'est sans payer (« à l'aller seulement », N2-60) ?

import type { Cible } from "../../commun/src/messages.ts";
import type { Base } from "./base.ts";
import { LieuVivant, type ContexteLieu } from "./lieu-vivant.ts";
import { definitionDuRegistre } from "./lieux-personnels.ts";

export class LieuCorniche extends LieuVivant {
  constructor(base: Base, alea: () => number = Math.random) {
    super(base, definitionDuRegistre("corniche"), alea);
  }

  /** Le péage du tunnel : à brancher sur commun/src/peage.ts (voir en tête du fichier). Rien d'autre en propre. */
  override geste(_ctx: ContexteLieu, _cible: Cible, _verbe: string): boolean {
    return false;
  }
}
