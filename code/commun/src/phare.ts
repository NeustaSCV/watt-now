// L2B, le phare du cap (plan 0.10, chantier A ; le contenu est au chantier K) : un lieu à soi, comme la Coopérative et
// le Moulin, au bout de la route B du niveau 2, après la corniche.
//
// Branché vide en 0.10 (chantier A) : une zone de 60 × 50 m (le lot du modèle `batiment/phare/`, FICHE.lot) et une
// sortie, au nord, à la grille de la route d'accès (FICHE.entrees[1]), qui ramène à la corniche. Le modèle, le relief,
// les Éteints, le butin, « le feu et le cargo » et la rampe du canot viendront ici.
//
// Repère : comme le Moulin, le coin nord-ouest du lot est l'origine du jeu ; x du jeu = x du modèle + 30, z du jeu =
// z du modèle + 25 (`origineModele`).
//
// Ce fichier n'importe des autres modules du jeu que des types (lieux.ts l'importe pour sa zone et ses sorties).

import type { Sortie, Zone } from "./lieux.ts";

/** Le lot du modèle : 60 × 50 m (FICHE.lot), et son centre dans le repère du jeu. */
export const PHARE = { largeur: 60, profondeur: 50, origineModele: { x: 30, z: 25 } } as const;

/** La grille du nord, sur la route d'accès (FICHE.entrees[1] : x − 1,5, z − 16 dans le repère du modèle). */
const GRILLE_NORD = { x: -1.5 + PHARE.origineModele.x, z: -16 + PHARE.origineModele.z } as const;

/** Le phare tel qu'on le trouve (provisoire : sans obstacle, en attendant le modèle). */
export const ZONE_PHARE: Zone = { xMin: 0.5, xMax: PHARE.largeur - 0.5, zMin: 0.5, zMax: PHARE.profondeur - 0.5, obstacles: [] };

export const SORTIES_PHARE: Sortie[] = [
  {
    vers: "corniche",
    boite: { x: GRILLE_NORD.x, z: 1.5, l: 6, p: 3 },
    arrivee: { x: GRILLE_NORD.x, z: 4, o: 0 },
    libelle: "Reprendre la route de la corniche",
  },
];
