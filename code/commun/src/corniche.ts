// H2B, la corniche du Cap Rouge (plan 0.10, chantier A ; le contenu est au chantier I) : une halte partagée, comme la
// station et le gué, sur la route B du niveau 2, entre le Moulin du Gué et le phare du cap.
//
// Branchée vide en 0.10 (chantier A) : une zone de 200 × 70 m (le lot du modèle `batiment/halte-corniche/`, FICHE.lot),
// la route d'ouest en est au milieu, une sortie à chaque bout. Comme sur la carte, le Moulin est à l'ouest (à gauche de
// l'écran), le phare à l'est. Le modèle, les obstacles, les Éteints, le butin, le pin tombé et le tunnel viendront ici.
//
// Ce fichier n'importe des autres modules du jeu que des types (lieux.ts l'importe pour sa zone et ses sorties).

import type { Sortie, Zone } from "./lieux.ts";

/** Le lot du modèle : 200 × 70 m (FICHE.lot). */
export const CORNICHE = { longueur: 200, largeur: 70 } as const;

/** La route longe la falaise d'ouest en est, au milieu. */
const ROUTE_Z = CORNICHE.largeur / 2;

/** La halte telle qu'on la trouve (provisoire : sans obstacle, en attendant le modèle). */
export const ZONE_CORNICHE: Zone = {
  xMin: 0.5,
  xMax: CORNICHE.longueur - 0.5,
  zMin: 9,
  zMax: CORNICHE.largeur - 11,
  obstacles: [],
};

export const SORTIES_CORNICHE: Sortie[] = [
  {
    vers: "moulin",
    boite: { x: 2, z: ROUTE_Z, l: 4, p: 10 },
    arrivee: { x: 4.5, z: ROUTE_Z, o: Math.PI / 2 },
    libelle: "Reprendre la route du Moulin",
  },
  {
    vers: "phare",
    boite: { x: CORNICHE.longueur - 2, z: ROUTE_Z, l: 4, p: 10 },
    arrivee: { x: CORNICHE.longueur - 4.5, z: ROUTE_Z, o: -Math.PI / 2 },
    libelle: "Continuer vers le phare",
  },
];
