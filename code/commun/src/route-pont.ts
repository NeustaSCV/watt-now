// H2A, la route du pont (plan 0.10, chantier A ; le contenu est au chantier H) : une halte partagée, comme la station et
// le gué, sur la route A du niveau 2, entre le terrain et le Grand Hôtel des Flots.
//
// Branchée vide en 0.10 (chantier A) : une zone de 200 × 70 m (le lot du modèle `batiment/halte-route-pont/`, FICHE.lot),
// la route d'est en ouest au milieu, une sortie à chaque bout. Comme sur la carte, le terrain est à l'est (à droite de
// l'écran), l'hôtel à l'ouest. Le modèle, les obstacles, les Éteints, le butin, le péage et la marée viendront ici.
//
// Ce fichier n'importe des autres modules du jeu que des types (lieux.ts l'importe pour sa zone et ses sorties).

import type { Sortie, Zone } from "./lieux.ts";

/** Le lot du modèle : 200 × 70 m (FICHE.lot). */
export const ROUTE_PONT = { longueur: 200, largeur: 70 } as const;

/** La route traverse la halte d'est en ouest, au milieu. */
const ROUTE_Z = ROUTE_PONT.largeur / 2;

/** La halte telle qu'on la trouve (provisoire : sans obstacle, en attendant le modèle). */
export const ZONE_ROUTE_PONT: Zone = {
  xMin: 0.5,
  xMax: ROUTE_PONT.longueur - 0.5,
  zMin: 9,
  zMax: ROUTE_PONT.largeur - 11,
  obstacles: [],
};

export const SORTIES_ROUTE_PONT: Sortie[] = [
  {
    vers: "terrain",
    boite: { x: ROUTE_PONT.longueur - 2, z: ROUTE_Z, l: 4, p: 10 },
    arrivee: { x: ROUTE_PONT.longueur - 4.5, z: ROUTE_Z, o: -Math.PI / 2 },
    libelle: "Rentrer chez toi",
  },
  {
    vers: "grand_hotel",
    boite: { x: 2, z: ROUTE_Z, l: 4, p: 10 },
    arrivee: { x: 4.5, z: ROUTE_Z, o: Math.PI / 2 },
    libelle: "Continuer vers le Grand Hôtel",
  },
];
