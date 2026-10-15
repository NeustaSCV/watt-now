// La hauteur du sol du lieu courant, pour ce qui se pose par terre sans passer par la pose du phare (client/src/phare.ts,
// `poser`) : le sang d'un coup, ses taches (rendu/sang.ts). Au phare (0.10, L-1), le relief du modèle : le plateau à 0,
// la rampe du canot, la grève à − 8,8, le pont de l'épave à − 4 quand elle est échouée. Partout ailleurs, le sol est plat (0).

import { solPhare } from "./rendu/phare.ts";

/** Le y du sol où l'on marche, au point (x, z) du lieu ; `portes.epave` : l'épave est échouée (comme la pose du phare). */
export function hauteurSolLieu(lieu: string, x: number, z: number, portes: Readonly<Record<string, boolean>>): number {
  return lieu === "phare" ? solPhare(x, z, portes.epave === true) : 0;
}
