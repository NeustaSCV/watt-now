// Dormir dans l'abri, côté serveur (0.8.2, chantier I : R12) : le trajet accroupi jusqu'à la couche, pas à pas. Le
// joueur (serveur/src/joueur.ts) le lance au geste « Dormir dans l'abri » et s'endort à l'arrivée ; bouger l'interrompt.

import type { Position } from "../../commun/src/deplacement.ts";
import { avancerVersLaCouche, cheminVersLaCouche, placeDeLaCouche, type AbriPose, type Point } from "../../commun/src/sommeil-abri.ts";

export type { AbriPose };

/** Un trajet en cours : ce qui reste à parcourir, l'orientation du dormeur, et la qualité du sommeil qui l'attend. */
export interface TrajetCouche {
  chemin: Point[];
  o: number;
  surUnLit: boolean;
  confort: number;
}

export function trajetCouche(abri: AbriPose, depart: Position, surUnLit: boolean, confort: number): TrajetCouche {
  return { chemin: cheminVersLaCouche(abri, depart), o: placeDeLaCouche(abri).o, surUnLit, confort };
}

/** Un pas du trajet (le trajet avance en place) : la nouvelle position, et si l'on est couché à sa place. */
export function pasVersLaCouche(t: TrajetCouche, position: Position, dt: number): { position: Position; arrive: boolean } {
  const pas = avancerVersLaCouche(position, t.chemin, dt, t.o);
  t.chemin = pas.chemin;
  return { position: pas.position, arrive: pas.chemin.length === 0 };
}
