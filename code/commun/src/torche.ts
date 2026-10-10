// La torche plantée (plan 0.8 §2.3, chantier 6 ; Book 24 §3.5) : une branche, un chiffon, de la graisse. Plantée près de
// l'abri, on l'allume (briquet ou pierre à feu) : elle éclaire 6 m **jusqu'au matin suivant** (5 h 30), quelle que soit
// l'heure où on l'allume (plan 0.8 §9.2, chantier 13), puis elle est consumée. On ne la regarnit pas : on en plante une
// autre.
// La nuit, sa flamme se voit de loin, comme une torche à la main (LUMIERE_NUIT.torche) : elle compte dans la signature.

import type { EtatInstallation } from "./messages.ts";
import { LUMIERE_NUIT, type Stimulus } from "./signature.ts";
import { HEURE_FIN_NUIT, MS_PAR_HEURE_JEU, heureDeJeu } from "./temps.ts";

/**
 * L'instant réel où une torche allumée à `allumeeLe` s'éteint : le matin suivant, à 5 h 30 de jeu. Allumée à 21 h, elle
 * brûle 8 h 30 ; à 3 h, 2 h 30 ; à midi, jusqu'au lendemain matin. Allumée pile à 5 h 30, jusqu'au matin d'après.
 */
export function extinctionTorche(allumeeLe: number, debutMonde: number): number {
  const heures = (HEURE_FIN_NUIT - heureDeJeu(allumeeLe, debutMonde) + 24) % 24;
  return allumeeLe + Math.round((heures > 1e-9 ? heures : 24) * MS_PAR_HEURE_JEU);
}
/** Ce qu'elle éclaire autour d'elle (m). */
export const PORTEE_TORCHE = 6;

/** Une torche telle que le jeu la regarde. */
export interface TorchePlantee {
  type: string;
  x: number;
  z: number;
  etat: EtatInstallation;
}

/** Brûle-t-elle à cet instant (allumée, pas encore consumée) ? */
export function torcheAllumee(i: TorchePlantee, instant: number): boolean {
  return i.type === "torche_plantee" && i.etat.eteinteLe !== undefined && instant < i.etat.eteinteLe;
}

/** A-t-elle déjà brûlé jusqu'au bout ? Une torche consumée ne se rallume pas : on en plante une autre. */
export function torcheConsumee(i: TorchePlantee, instant: number): boolean {
  return i.type === "torche_plantee" && i.etat.eteinteLe !== undefined && instant >= i.etat.eteinteLe;
}

/** La lumière des torches allumées, la nuit (Book 06 §3.2) : ce que les Éteints voient de loin. */
export function stimuliTorches(installations: Iterable<TorchePlantee>, instant: number, nuit: boolean): Stimulus[] {
  if (!nuit) return [];
  const s: Stimulus[] = [];
  for (const i of installations) if (torcheAllumee(i, instant)) s.push({ genre: "lumiere", x: i.x, z: i.z, ...LUMIERE_NUIT.torche });
  return s;
}
