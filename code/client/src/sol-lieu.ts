// La hauteur du sol du lieu courant, pour ce qui se pose par terre sans passer par la pose du phare (client/src/phare.ts,
// `poser`) : le sang d'un coup, ses taches (rendu/sang.ts) ; la lampe portée, les cercles, la visée (main.ts). Au phare (0.10, L-1), le relief du modèle : le plateau à 0,
// la rampe du canot, la grève à − 8,8, le pont de l'épave à − 4 quand elle est échouée. Partout ailleurs, le sol est plat (0).

import { piedsPhare, solPhare, surfacePhare } from "./rendu/phare.ts";

/** Le y du sol où l'on marche, au point (x, z) du lieu ; `portes.epave` : l'épave est échouée (comme la pose du phare). */
export function hauteurSolLieu(lieu: string, x: number, z: number, portes: Readonly<Record<string, boolean>>): number {
  return lieu === "phare" ? solPhare(x, z, portes.epave === true) : 0;
}

/**
 * Où sont les pieds de qui se tient en (x, z) : le sol, ou au phare, dans l'eau peu profonde de la crique, jusqu'aux genoux
 * (0.10). Ce qui suit le personnage s'y rapporte : sa lampe, celle des autres (main.ts).
 */
export function hauteurPiedsLieu(lieu: string, x: number, z: number, portes: Readonly<Record<string, boolean>>): number {
  return lieu === "phare" ? piedsPhare(x, z, portes.epave === true) : 0;
}

/** Où se dessine ce qui est posé à plat autour du personnage (les cercles du bruit et de la lumière, la visée) : le sol, ou la surface de l'eau. */
export function hauteurSurfaceLieu(lieu: string, x: number, z: number, portes: Readonly<Record<string, boolean>>): number {
  return lieu === "phare" ? surfacePhare(x, z, portes.epave === true) : 0;
}
