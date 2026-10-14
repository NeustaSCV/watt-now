// L2A, le Grand Hôtel des Flots (plan 0.10, chantier A ; le contenu est au chantier J) : un lieu à soi, comme la
// Coopérative et le Moulin, au bout de la route A du niveau 2, après la route du pont.
//
// Branché vide en 0.10 (chantier A) : une zone de 64 × 66 m (le lot du modèle `batiment/grand-hotel/`, FICHE.lot) et une
// sortie, à l'est, sur la promenade (l'arrivée du modèle, FICHE.entrees[0]), qui ramène à la route du pont. Le modèle,
// l'étage, les Éteints, le butin et « le check-in » viendront ici.
//
// Repère : comme le Moulin, le coin nord-ouest du lot est l'origine du jeu ; x du jeu = x du modèle + 32, z du jeu =
// z du modèle + 33 (`origineModele`).
//
// Ce fichier n'importe des autres modules du jeu que des types (lieux.ts l'importe pour sa zone et ses sorties).

import type { Sortie, Zone } from "./lieux.ts";

/** Le lot du modèle : 64 × 66 m (FICHE.lot), et son centre dans le repère du jeu. */
export const HOTEL = { largeur: 64, profondeur: 66, origineModele: { x: 32, z: 33 } } as const;

/** L'arrivée sur la promenade, par l'est (FICHE.entrees[0] : x 30,5, z 20 dans le repère du modèle). */
const PROMENADE = { x: 30.5 + HOTEL.origineModele.x, z: 20 + HOTEL.origineModele.z } as const;

/** L'hôtel tel qu'on le trouve (provisoire : sans obstacle, en attendant le modèle). */
export const ZONE_HOTEL: Zone = { xMin: 0.5, xMax: HOTEL.largeur - 0.5, zMin: 0.5, zMax: HOTEL.profondeur - 0.5, obstacles: [] };

export const SORTIES_HOTEL: Sortie[] = [
  {
    vers: "route_pont",
    boite: { x: HOTEL.largeur - 1.5, z: PROMENADE.z, l: 3, p: 8 },
    arrivee: { x: HOTEL.largeur - 4, z: PROMENADE.z, o: -Math.PI / 2 },
    libelle: "Reprendre la route du pont",
  },
];
