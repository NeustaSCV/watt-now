// La torche plantée (plan 0.8 §2.3, chantier 6 ; Book 24 §3.5) : une branche, un chiffon, de la graisse. Plantée près de
// l'abri, on l'allume (briquet ou pierre à feu) : elle éclaire 6 m pendant une heure de jeu, puis elle est consumée.
// La nuit, sa flamme se voit de loin, comme une torche à la main (LUMIERE_NUIT.torche) : elle compte dans la signature.

import type { EtatInstallation } from "./messages.ts";
import { LUMIERE_NUIT, type Stimulus } from "./signature.ts";
import { MS_PAR_HEURE_JEU } from "./temps.ts";

/** Une heure de jeu (une minute réelle) : le chiffon gras est brûlé. */
export const DUREE_TORCHE_MS = MS_PAR_HEURE_JEU;
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
