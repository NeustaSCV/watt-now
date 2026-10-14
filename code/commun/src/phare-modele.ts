// Tiré du modèle du phare par scripts/extraire-phare.mjs : ne pas modifier à la main (relancer le script après un import).
// Repère du modèle : le lot de 60 × 50 m, origine au centre, +x à l'est, +z au sud (la mer). commun/src/phare.ts le ramène
// dans le repère du jeu.

/* eslint-disable */

/** Un segment infranchissable du modèle (murs, falaise, bord de l'eau, coque de l'épave…). */
export interface SegmentModele {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  nature: string;
}

/** Un point de la fiche du modèle. */
export interface PointModele {
  x: number;
  z: number;
  y?: number;
  nature?: string;
  quoi?: string;
  type?: string;
  apresEpave?: boolean;
}

/** Une boîte centrée (l en x, p en z). */
export interface BoiteModele {
  x: number;
  z: number;
  l: number;
  p: number;
}

/** Une couche qui s'efface quand elle cache le personnage (les toits, le fût de la tour, la coque de l'épave). */
export interface CoucheModele {
  nom: string;
  boite: BoiteModele;
  bas: number;
  haut: number;
  horsDe?: BoiteModele;
}

export interface LumiereModele {
  x: number;
  y: number;
  z: number;
  couleur: number;
  intensite: number;
  portee: number;
  nature: string;
}

/** Une porte de la fiche (T6) ; `axe` : le sens du mur qui la porte. */
export interface PorteModele {
  id: string;
  x: number;
  z: number;
  y?: number;
  largeur: number;
  axe: string;
  entre: readonly string[];
  apresEpave?: boolean;
}

/** Une pièce de la fiche (T6). */
export interface PieceModele {
  nom: string;
  sombre: boolean;
  apresEpave?: boolean;
  boites: readonly BoiteModele[];
}

export const LOT_MODELE = {
  "l": 60,
  "p": 50
} as const;

export const DEPART_MODELE = {
  "x": 6,
  "z": 7.5
} as const;

export const SEGMENTS_MODELE: readonly SegmentModele[] = [
  {"x1":-30,"z1":12.11,"x2":-28.5,"z2":12.43,"nature":"falaise"},
  {"x1":-28.5,"z1":12.43,"x2":-27,"z2":12.82,"nature":"falaise"},
  {"x1":-27,"z1":12.82,"x2":-25.5,"z2":12.16,"nature":"falaise"},
  {"x1":-22.5,"z1":12.01,"x2":-21,"z2":12.82,"nature":"falaise"},
  {"x1":-21,"z1":12.82,"x2":-19.5,"z2":12.46,"nature":"falaise"},
  {"x1":-19.5,"z1":12.46,"x2":-18,"z2":12.29,"nature":"falaise"},
  {"x1":-18,"z1":12.29,"x2":-16.5,"z2":11.96,"nature":"falaise"},
  {"x1":-16.5,"z1":11.96,"x2":-15,"z2":12.36,"nature":"falaise"},
  {"x1":-15,"z1":12.36,"x2":-13.5,"z2":12.77,"nature":"falaise"},
  {"x1":-13.5,"z1":12.77,"x2":-12,"z2":12.35,"nature":"falaise"},
  {"x1":-12,"z1":12.35,"x2":-10.5,"z2":12.23,"nature":"falaise"},
  {"x1":-10.5,"z1":12.23,"x2":-9,"z2":11.9,"nature":"falaise"},
  {"x1":-9,"z1":11.9,"x2":-7.5,"z2":12.73,"nature":"falaise"},
  {"x1":-7.5,"z1":12.73,"x2":-6,"z2":12.49,"nature":"falaise"},
  {"x1":-6,"z1":12.49,"x2":-4.5,"z2":12.48,"nature":"falaise"},
  {"x1":-4.5,"z1":12.48,"x2":-3,"z2":11.89,"nature":"falaise"},
  {"x1":-3,"z1":11.89,"x2":-1.5,"z2":12.29,"nature":"falaise"},
  {"x1":-1.5,"z1":12.29,"x2":0,"z2":12.64,"nature":"falaise"},
  {"x1":0,"z1":12.64,"x2":1.5,"z2":12.54,"nature":"falaise"},
  {"x1":1.5,"z1":12.54,"x2":3,"z2":12.28,"nature":"falaise"},
  {"x1":3,"z1":12.28,"x2":4.5,"z2":11.86,"nature":"falaise"},
  {"x1":4.5,"z1":11.86,"x2":6,"z2":12.58,"nature":"falaise"},
  {"x1":6,"z1":12.58,"x2":7.5,"z2":12.5,"nature":"falaise"},
  {"x1":7.5,"z1":12.5,"x2":9,"z2":12.65,"nature":"falaise"},
  {"x1":9,"z1":12.65,"x2":10.5,"z2":12.06,"nature":"falaise"},
  {"x1":10.5,"z1":12.06,"x2":12,"z2":14.23,"nature":"falaise"},
  {"x1":12,"z1":14.23,"x2":13.5,"z2":16.3,"nature":"falaise"},
  {"x1":13.5,"z1":16.3,"x2":15,"z2":16.69,"nature":"falaise"},
  {"x1":15,"z1":16.69,"x2":16.5,"z2":16.35,"nature":"falaise"},
  {"x1":16.5,"z1":16.35,"x2":18,"z2":15.89,"nature":"falaise"},
  {"x1":18,"z1":15.89,"x2":19.5,"z2":16.4,"nature":"falaise"},
  {"x1":19.5,"z1":16.4,"x2":21,"z2":16.47,"nature":"falaise"},
  {"x1":21,"z1":16.47,"x2":22.5,"z2":16.79,"nature":"falaise"},
  {"x1":22.5,"z1":16.79,"x2":24,"z2":15.95,"nature":"falaise"},
  {"x1":24,"z1":15.95,"x2":25.5,"z2":16.2,"nature":"falaise"},
  {"x1":25.5,"z1":16.2,"x2":27,"z2":16.27,"nature":"falaise"},
  {"x1":27,"z1":16.27,"x2":28.5,"z2":16.78,"nature":"falaise"},
  {"x1":28.5,"z1":16.78,"x2":30,"z2":16.42,"nature":"falaise"},
  {"x1":-25.5,"z1":12,"x2":-25.5,"z2":22,"nature":"bord de la rampe du canot (le vide, les chevalets)"},
  {"x1":-22.5,"z1":12,"x2":-22.5,"z2":22,"nature":"bord de la rampe du canot (le vide, les chevalets)"},
  {"x1":-30,"z1":15.44,"x2":-28.5,"z2":15.83,"nature":"pied de la falaise (crique)"},
  {"x1":-30,"z1":15.66,"x2":-28.5,"z2":22.84,"nature":"la mer (bord de l'eau, crique)"},
  {"x1":-28.5,"z1":15.83,"x2":-27,"z2":16.22,"nature":"pied de la falaise (crique)"},
  {"x1":-28.5,"z1":22.84,"x2":-27,"z2":23.23,"nature":"la mer (bord de l'eau, crique)"},
  {"x1":-27,"z1":16.22,"x2":-25.5,"z2":15.56,"nature":"pied de la falaise (crique)"},
  {"x1":-27,"z1":23.23,"x2":-25.5,"z2":22.57,"nature":"la mer (bord de l'eau, crique)"},
  {"x1":-25.5,"z1":22.57,"x2":-24,"z2":22.61,"nature":"la mer (bord de l'eau, crique)"},
  {"x1":-24,"z1":22.61,"x2":-22.5,"z2":22.42,"nature":"la mer (bord de l'eau, crique)"},
  {"x1":-22.5,"z1":15.41,"x2":-21,"z2":16.22,"nature":"pied de la falaise (crique)"},
  {"x1":-22.5,"z1":22.42,"x2":-21,"z2":23.23,"nature":"la mer (bord de l'eau, crique)"},
  {"x1":-21,"z1":16.22,"x2":-19.5,"z2":15.86,"nature":"pied de la falaise (crique)"},
  {"x1":-21,"z1":23.23,"x2":-19.5,"z2":22.9,"nature":"la mer (bord de l'eau, crique)"},
  {"x1":-19.5,"z1":15.86,"x2":-18,"z2":15.69,"nature":"pied de la falaise (crique)"},
  {"x1":-19.5,"z1":22.9,"x2":-18,"z2":22.82,"nature":"la mer (bord de l'eau, crique)"},
  {"x1":-18,"z1":15.69,"x2":-16.5,"z2":15.36,"nature":"pied de la falaise (crique)"},
  {"x1":-18,"z1":22.82,"x2":-16.5,"z2":22.6,"nature":"la mer (bord de l'eau, crique)"},
  {"x1":-16.5,"z1":15.36,"x2":-15,"z2":15.76,"nature":"pied de la falaise (crique)"},
  {"x1":-16.5,"z1":22.6,"x2":-15,"z2":23.09,"nature":"la mer (bord de l'eau, crique)"},
  {"x1":-15,"z1":15.76,"x2":-13.5,"z2":16.17,"nature":"pied de la falaise (crique)"},
  {"x1":-15,"z1":23.09,"x2":-13.5,"z2":23.59,"nature":"la mer (bord de l'eau, crique)"},
  {"x1":-13.5,"z1":16.17,"x2":-12,"z2":15.75,"nature":"pied de la falaise (crique)"},
  {"x1":-13.5,"z1":23.59,"x2":-12,"z2":23.27,"nature":"la mer (bord de l'eau, crique)"},
  {"x1":-12,"z1":15.75,"x2":-10.5,"z2":15.63,"nature":"pied de la falaise (crique)"},
  {"x1":-12,"z1":23.27,"x2":-10.5,"z2":23.15,"nature":"la mer (bord de l'eau, crique)"},
  {"x1":-10.5,"z1":15.63,"x2":-9,"z2":15.3,"nature":"pied de la falaise (crique)"},
  {"x1":-10.5,"z1":23.15,"x2":-9,"z2":22.82,"nature":"la mer (bord de l'eau, crique)"},
  {"x1":-9,"z1":15.3,"x2":-7.5,"z2":16.13,"nature":"pied de la falaise (crique)"},
  {"x1":-9,"z1":22.82,"x2":-7.5,"z2":23.65,"nature":"la mer (bord de l'eau, crique)"},
  {"x1":-7.5,"z1":16.13,"x2":-6,"z2":15.89,"nature":"pied de la falaise (crique)"},
  {"x1":-7.5,"z1":23.65,"x2":-6,"z2":23.42,"nature":"la mer (bord de l'eau, crique)"},
  {"x1":-6,"z1":15.89,"x2":-4.5,"z2":15.88,"nature":"pied de la falaise (crique)"},
  {"x1":-6,"z1":23.42,"x2":-4.5,"z2":23.4,"nature":"la mer (bord de l'eau, crique)"},
  {"x1":-4.5,"z1":15.88,"x2":-3,"z2":15.25,"nature":"pied de la falaise (crique)"},
  {"x1":-4.5,"z1":23.4,"x2":-3,"z2":17.39,"nature":"la mer (bord de l'eau, crique)"},
  {"x1":-3,"z1":15.25,"x2":-1.6,"z2":15.55,"nature":"pied de la falaise (crique)"},
  {"x1":-3,"z1":17.39,"x2":-1.6,"z2":15.56,"nature":"la mer (bord de l'eau, crique)"},
  {"x1":-1.6,"z1":15.55,"x2":-1.6,"z2":15.56,"nature":"rochers au bout de la crique"},
  {"x1":-18,"z1":1.5,"x2":-12.85,"z2":1.5,"nature":"mur"},
  {"x1":-10.87,"z1":1.5,"x2":1,"z2":1.5,"nature":"mur"},
  {"x1":3.6,"z1":1.5,"x2":16,"z2":1.5,"nature":"mur"},
  {"x1":16,"z1":1.5,"x2":16,"z2":-6.45,"nature":"mur"},
  {"x1":16,"z1":-8.44,"x2":16,"z2":-16,"nature":"mur"},
  {"x1":16,"z1":-16,"x2":0,"z2":-16,"nature":"mur"},
  {"x1":-3,"z1":-16,"x2":-11.68,"z2":-16,"nature":"mur"},
  {"x1":-14.05,"z1":-16,"x2":-18,"z2":-16,"nature":"mur"},
  {"x1":-18,"z1":-16,"x2":-18,"z2":1.5,"nature":"mur"},
  {"x1":-6.71,"z1":-3.69,"x2":-6.04,"z2":-5.31,"nature":"mur"},
  {"x1":-7.85,"z1":-2.6,"x2":-6.6,"z2":-3.85,"nature":"mur"},
  {"x1":-9.31,"z1":-2.04,"x2":-7.69,"z2":-2.71,"nature":"mur"},
  {"x1":-12.31,"z1":-2.71,"x2":-10.69,"z2":-2.04,"nature":"mur"},
  {"x1":-13.4,"z1":-3.85,"x2":-12.15,"z2":-2.6,"nature":"mur"},
  {"x1":-13.96,"z1":-5.31,"x2":-13.29,"z2":-3.69,"nature":"mur"},
  {"x1":-13.92,"z1":-6.88,"x2":-13.92,"z2":-5.12,"nature":"mur"},
  {"x1":-13.29,"z1":-8.31,"x2":-13.96,"z2":-6.69,"nature":"mur"},
  {"x1":-12.15,"z1":-9.4,"x2":-13.4,"z2":-8.15,"nature":"mur"},
  {"x1":-10.69,"z1":-9.96,"x2":-12.31,"z2":-9.29,"nature":"mur"},
  {"x1":-9.12,"z1":-9.92,"x2":-10.88,"z2":-9.92,"nature":"mur"},
  {"x1":-7.69,"z1":-9.29,"x2":-9.31,"z2":-9.96,"nature":"mur"},
  {"x1":-6.6,"z1":-8.15,"x2":-7.85,"z2":-9.4,"nature":"mur"},
  {"x1":-6.04,"z1":-6.69,"x2":-6.71,"z2":-8.31,"nature":"mur"},
  {"x1":-6.08,"z1":-5.12,"x2":-6.08,"z2":-6.88,"nature":"mur"},
  {"x1":-12.14,"z1":-4.69,"x2":-10.94,"z2":-4.69,"nature":"cuve"},
  {"x1":-10.94,"z1":-4.69,"x2":-10.94,"z2":-3.49,"nature":"cuve"},
  {"x1":-5.6,"z1":-3,"x2":-1.64,"z2":-3,"nature":"mur"},
  {"x1":-0.06,"z1":-3,"x2":9.84,"z2":-3,"nature":"mur"},
  {"x1":12.21,"z1":-3,"x2":13.4,"z2":-3,"nature":"mur"},
  {"x1":13.4,"z1":-3,"x2":13.4,"z2":-11,"nature":"mur"},
  {"x1":13.4,"z1":-11,"x2":4.3,"z2":-11,"nature":"mur"},
  {"x1":3.5,"z1":-11,"x2":-5.6,"z2":-11,"nature":"mur"},
  {"x1":-5.6,"z1":-11,"x2":-5.6,"z2":-3,"nature":"mur"},
  {"x1":1.4,"z1":-10.8,"x2":1.4,"z2":-6.3,"nature":"cloison"},
  {"x1":1.4,"z1":-4.9,"x2":1.4,"z2":-3.2,"nature":"cloison"},
  {"x1":6.4,"z1":-10.8,"x2":6.4,"z2":-6.3,"nature":"cloison"},
  {"x1":6.4,"z1":-4.9,"x2":6.4,"z2":-3.2,"nature":"cloison"},
  {"x1":-4.6,"z1":-8.7,"x2":-4.6,"z2":-7.1,"nature":"cuisinière"},
  {"x1":-3.15,"z1":-7,"x2":-1.25,"z2":-7,"nature":"table"},
  {"x1":-3.15,"z1":-6,"x2":-1.25,"z2":-6,"nature":"table"},
  {"x1":-1,"z1":-10.25,"x2":1,"z2":-10.25,"nature":"vaisselier"},
  {"x1":1.8,"z1":-8.75,"x2":3.8,"z2":-8.75,"nature":"lit"},
  {"x1":8.2,"z1":-8.7,"x2":11.6,"z2":-8.7,"nature":"groupe électrogène"},
  {"x1":8.2,"z1":-7.1,"x2":11.6,"z2":-7.1,"nature":"groupe électrogène"},
  {"x1":8.2,"z1":-8.7,"x2":8.2,"z2":-7.1,"nature":"groupe électrogène"},
  {"x1":11.6,"z1":-8.7,"x2":11.6,"z2":-7.1,"nature":"groupe électrogène"},
  {"x1":12,"z1":-10.8,"x2":12,"z2":-8,"nature":"réservoirs"},
  {"x1":4.4,"z1":-2,"x2":6.6,"z2":-2,"nature":"jacuzzi"},
  {"x1":4.4,"z1":0.2,"x2":6.6,"z2":0.2,"nature":"jacuzzi"},
  {"x1":-28,"z1":3,"x2":-28,"z2":12,"nature":"mur"},
  {"x1":-20,"z1":3,"x2":-28,"z2":3,"nature":"mur"},
  {"x1":-20,"z1":12,"x2":-20,"z2":8.48,"nature":"mur"},
  {"x1":-20,"z1":6.52,"x2":-20,"z2":3,"nature":"mur"},
  {"x1":-28,"z1":12,"x2":-26.8,"z2":12,"nature":"mur"},
  {"x1":-21.2,"z1":12,"x2":-20,"z2":12,"nature":"mur"},
  {"x1":-25.3,"z1":4,"x2":-25.3,"z2":11.2,"nature":"canot"},
  {"x1":-22.7,"z1":4,"x2":-22.7,"z2":11.2,"nature":"canot"},
  {"x1":22,"z1":4,"x2":15,"z2":4,"nature":"mur"},
  {"x1":15,"z1":4,"x2":15,"z2":6,"nature":"mur"},
  {"x1":15,"z1":7.6,"x2":15,"z2":10,"nature":"mur"},
  {"x1":15,"z1":10,"x2":22,"z2":10,"nature":"mur"},
  {"x1":22,"z1":10,"x2":22,"z2":4,"nature":"mur"},
  {"x1":16.4,"z1":6.8,"x2":19,"z2":6.8,"nature":"compresseur"},
  {"x1":16.4,"z1":8.8,"x2":19,"z2":8.8,"nature":"compresseur"},
  {"x1":20.3,"z1":4.6,"x2":20.3,"z2":6.8,"nature":"réservoirs d'air"},
  {"x1":17.5,"z1":13.2,"x2":19.5,"z2":13.2,"nature":"corne de brume"},
  {"x1":17.5,"z1":13.2,"x2":17.5,"z2":15.7,"nature":"corne de brume"},
  {"x1":19.5,"z1":13.2,"x2":19.5,"z2":15.7,"nature":"corne de brume"},
  {"x1":-22.4,"z1":-8.8,"x2":-25.6,"z2":-8.8,"nature":"mur"},
  {"x1":-25.6,"z1":-8.8,"x2":-25.6,"z2":-5.2,"nature":"mur"},
  {"x1":-22.4,"z1":-5.2,"x2":-22.4,"z2":-7.6,"nature":"mur"},
  {"x1":-22.4,"z1":-8,"x2":-22.4,"z2":-8.8,"nature":"mur"},
  {"x1":-25.6,"z1":-5.2,"x2":-25.2,"z2":-5.2,"nature":"mur"},
  {"x1":-24.8,"z1":-5.2,"x2":-24.4,"z2":-5.2,"nature":"mur"},
];

/** Les segments de l'épave (`obstaclesEpave`) : ils n'existent qu'après l'échouage. */
export const SEGMENTS_EPAVE: readonly SegmentModele[] = [
  {"x1":-22.48,"z1":16.58,"x2":-16.43,"z2":16.34,"nature":"conteneur de la Livraison du Jour (paroi)"},
  {"x1":-22.37,"z1":19.26,"x2":-16.32,"z2":19.02,"nature":"conteneur de la Livraison du Jour (paroi)"},
  {"x1":-22.48,"z1":16.7,"x2":-22.38,"z2":19.14,"nature":"conteneur de la Livraison du Jour (paroi)"},
  {"x1":-14.7,"z1":16.29,"x2":-8.66,"z2":15.93,"nature":"conteneur des provisions du bord (paroi)"},
  {"x1":-14.54,"z1":18.97,"x2":-8.5,"z2":18.61,"nature":"conteneur des provisions du bord (paroi)"},
  {"x1":-8.65,"z1":16.05,"x2":-8.5,"z2":18.49,"nature":"conteneur des provisions du bord (paroi)"},
  {"x1":-0.39,"z1":22.63,"x2":-0.7,"z2":21.47,"nature":"coque du cargo (bordé, pavois)"},
  {"x1":-0.7,"z1":21.47,"x2":-0.99,"z2":20.41,"nature":"coque du cargo (bordé, pavois)"},
  {"x1":-0.99,"z1":20.41,"x2":-1.53,"z2":19.26,"nature":"coque du cargo (bordé, pavois)"},
  {"x1":-1.53,"z1":19.26,"x2":-2.37,"z2":18.14,"nature":"coque du cargo (bordé, pavois)"},
  {"x1":-2.37,"z1":18.14,"x2":-2.72,"z2":17.77,"nature":"coque du cargo (bordé, pavois)"},
  {"x1":-2.72,"z1":17.77,"x2":-3.48,"z2":17.04,"nature":"coque du cargo (bordé, pavois)"},
  {"x1":-3.48,"z1":17.04,"x2":-4.25,"z2":16.42,"nature":"coque du cargo (bordé, pavois)"},
  {"x1":-4.25,"z1":16.42,"x2":-4.97,"z2":15.89,"nature":"coque du cargo (bordé, pavois)"},
  {"x1":-4.97,"z1":15.89,"x2":-5.58,"z2":15.43,"nature":"coque du cargo (bordé, pavois)"},
  {"x1":-6.57,"z1":24.29,"x2":-6.88,"z2":23.13,"nature":"coque du cargo (bordé, pavois)"},
  {"x1":-6.88,"z1":23.13,"x2":-7.17,"z2":22.07,"nature":"coque du cargo (bordé, pavois)"},
  {"x1":-7.17,"z1":22.07,"x2":-7.28,"z2":20.81,"nature":"coque du cargo (bordé, pavois)"},
  {"x1":-7.11,"z1":19.41,"x2":-6.99,"z2":18.92,"nature":"coque du cargo (bordé, pavois)"},
  {"x1":-6.99,"z1":18.92,"x2":-6.69,"z2":17.91,"nature":"coque du cargo (bordé, pavois)"},
  {"x1":-6.69,"z1":17.91,"x2":-6.35,"z2":16.98,"nature":"coque du cargo (bordé, pavois)"},
  {"x1":-6.35,"z1":16.98,"x2":-5.99,"z2":16.16,"nature":"coque du cargo (bordé, pavois)"},
  {"x1":-5.99,"z1":16.16,"x2":-5.69,"z2":15.46,"nature":"coque du cargo (bordé, pavois)"},
  {"x1":-0.39,"z1":22.63,"x2":-6.57,"z2":24.29,"nature":"la cassure de la coque (le vide, la cale)"},
  {"x1":-7.1,"z1":20.76,"x2":-13.09,"z2":22.37,"nature":"rambarde de l'échelle de coupée"},
  {"x1":-7.44,"z1":19.5,"x2":-13.43,"z2":21.12,"nature":"rambarde de l'échelle de coupée"},
  {"x1":-3.43,"z1":23.03,"x2":-4.21,"z2":20.14,"nature":"conteneur d'outillage sur le pont (paroi)"},
  {"x1":-0.84,"z1":22.33,"x2":-1.62,"z2":19.44,"nature":"conteneur d'outillage sur le pont (paroi)"},
  {"x1":-3.31,"z1":23,"x2":-0.96,"z2":22.36,"nature":"conteneur d'outillage sur le pont (paroi)"},
  {"x1":-3.93,"z1":18.71,"x2":-5.47,"z2":19.13,"nature":"guindeau"},
  {"x1":-4.13,"z1":17.94,"x2":-5.68,"z2":18.36,"nature":"guindeau"},
];

export const COUCHES_MODELE: readonly CoucheModele[] = [
  {"nom":"tour du phare (fût, galerie, lanterne)","boite":{"x":-10,"z":-6,"l":9.2,"p":9.2},"bas":1.05,"haut":32},
  {"nom":"maisons des gardiens (hauts des murs, toits)","boite":{"x":3.9,"z":-7,"l":19.8,"p":9},"bas":1.05,"haut":6.2},
  {"nom":"hangar à bateau (hauts des murs, toit)","boite":{"x":-24,"z":7.5,"l":8.8,"p":9.8},"bas":1.05,"haut":5},
  {"nom":"salle de la corne de brume (hauts des murs, toit)","boite":{"x":18.5,"z":7,"l":7.8,"p":6.8},"bas":1.05,"haut":4},
  {"nom":"coque de l'épave (cargo « Prime Abondance »)","boite":{"x":-3.9,"z":20,"l":8.2,"p":9.4},"bas":0.6,"haut":6.2,"horsDe":{"x":-4.44,"z":19.89,"l":4.2,"p":5.2}},
];

export const LUMIERES_MODELE: readonly LumiereModele[] = [
  {"x":-5.32,"y":0.17,"z":16.6,"couleur":16726570,"intensite":3,"portee":8,"nature":"feu de détresse du cargo, sur batterie (seulement avec epave_apres)"},
  {"x":-10,"y":28.1,"z":-6,"couleur":16757850,"intensite":40,"portee":46,"nature":"lanterne du phare allumée (seulement quand lanterne_allumee est montrée ; signal : attire les Éteints)"},
  {"x":-4.5,"y":0.7,"z":-7.9,"couleur":16747069,"intensite":10,"portee":9,"nature":"feu de la cuisinière"},
  {"x":-27.1,"y":1.4,"z":6,"couleur":12576511,"intensite":3,"portee":6,"nature":"photophore solaire « Watty Glow » sur l'établi du hangar"},
  {"x":4.6,"y":0.95,"z":-10.3,"couleur":16760944,"intensite":2.5,"portee":5,"nature":"bougie"},
];

export const ENTREES_MODELE: readonly PointModele[] = [
  {"x":2.3,"z":1.5,"nature":"grille du sud de l'enceinte (depuis le chemin des douaniers)"},
  {"x":-1.5,"z":-16,"nature":"grille du nord (la route d'accès)"},
  {"x":-10,"z":-1.9,"nature":"porte de la tour (entrouverte)"},
  {"x":-1,"z":-3,"nature":"porte de la cuisine des gardiens"},
  {"x":11,"z":-3,"nature":"grande porte de la salle des machines (vantail tombé)"},
  {"x":-20,"z":7.5,"nature":"porte latérale du hangar à bateau"},
  {"x":-24,"z":12,"nature":"grande porte du hangar, ouverte sur la rampe du canot (descente vers la crique)"},
  {"x":15,"z":7,"nature":"porte de la salle de la corne de brume"},
  {"x":-29.6,"z":20,"y":-8.8,"nature":"la grève de galets de la crique, vers l'ouest : on ressort par là"},
];

/** La marque à la craie où poser l'escabeau, sous la première marche de l'escalier coupé (P4). */
export const ESCABEAU_MODELE = {
  "marque": {
    "x": -12.01,
    "z": -8.25
  },
  "premiereMarche": {
    "x": -12.01,
    "z": -8.25,
    "y": 3.04
  }
} as const;

/** Le passage à sens unique de la rampe du canot (P8). */
export const SENS_UNIQUE_MODELE = [
  {
    "id": "rampe_canot",
    "de": {
      "x": -24,
      "z": 18.6,
      "y": -4.9
    },
    "vers": {
      "x": -24,
      "z": 20.3,
      "y": -7
    },
    "nature": "on saute du tronçon effondré de la rampe du canot sur la partie basse, affaissée (≈ 1,5 m) : on ne remonte pas"
  }
] as const;

export const PIECES_MODELE: Readonly<Record<string, PieceModele>> = {
  "tour": {
    "nom": "le pied de la tour",
    "sombre": true,
    "boites": [
      {
        "x": -10,
        "z": -6,
        "l": 7.4,
        "p": 7.4
      }
    ]
  },
  "cuisine": {
    "nom": "la cuisine du gardien",
    "sombre": false,
    "boites": [
      {
        "x": -2.1,
        "z": -7,
        "l": 6.6,
        "p": 7.6
      }
    ]
  },
  "chambre": {
    "nom": "la chambre",
    "sombre": false,
    "boites": [
      {
        "x": 3.9,
        "z": -7,
        "l": 4.8,
        "p": 7.6
      }
    ]
  },
  "machines": {
    "nom": "la salle des machines",
    "sombre": true,
    "boites": [
      {
        "x": 9.9,
        "z": -7,
        "l": 6.8,
        "p": 7.6
      }
    ]
  },
  "hangar": {
    "nom": "le hangar à bateau",
    "sombre": true,
    "boites": [
      {
        "x": -24,
        "z": 7.5,
        "l": 7.6,
        "p": 8.6
      }
    ]
  },
  "corne": {
    "nom": "la salle de la corne de brume",
    "sombre": false,
    "boites": [
      {
        "x": 18.5,
        "z": 7,
        "l": 6.6,
        "p": 5.6
      }
    ]
  },
  "abri": {
    "nom": "l'abri du douanier",
    "sombre": false,
    "boites": [
      {
        "x": -24,
        "z": -7,
        "l": 2.8,
        "p": 3.2
      }
    ]
  },
  "conteneur_livraison": {
    "nom": "le conteneur de la Livraison du Jour",
    "sombre": true,
    "apresEpave": true,
    "boites": [
      {
        "x": -19.4,
        "z": 17.8,
        "l": 5.9,
        "p": 2.3
      }
    ]
  },
  "conteneur_bord": {
    "nom": "le conteneur des provisions du bord",
    "sombre": true,
    "apresEpave": true,
    "boites": [
      {
        "x": -11.6,
        "z": 17.45,
        "l": 5.9,
        "p": 2.4
      }
    ]
  },
  "conteneur_outillage": {
    "nom": "le conteneur d'outillage (sur le pont du cargo, y ≈ −4,1)",
    "sombre": true,
    "apresEpave": true,
    "boites": [
      {
        "x": -2.5,
        "z": 21.2,
        "l": 2.7,
        "p": 3
      }
    ]
  }
};

export const PORTES_MODELE: readonly PorteModele[] = [
  {"id":"tour","x":-10,"z":-2.08,"largeur":1.38,"axe":"x","entre":["dehors","tour"]},
  {"id":"cuisine","x":-1,"z":-3,"largeur":1.6,"axe":"x","entre":["dehors","cuisine"]},
  {"id":"cuisine_chambre","x":1.4,"z":-5.6,"largeur":1.4,"axe":"z","entre":["cuisine","chambre"]},
  {"id":"chambre_machines","x":6.4,"z":-5.6,"largeur":1.4,"axe":"z","entre":["chambre","machines"]},
  {"id":"machines","x":11,"z":-3,"largeur":2.2,"axe":"x","entre":["dehors","machines"]},
  {"id":"hangar_cote","x":-20,"z":7.5,"largeur":1.6,"axe":"z","entre":["dehors","hangar"]},
  {"id":"hangar_rampe","x":-24,"z":12,"largeur":5.4,"axe":"x","entre":["hangar","dehors"]},
  {"id":"corne","x":15,"z":7,"largeur":1.6,"axe":"z","entre":["dehors","corne"]},
  {"id":"abri","x":-23.6,"z":-5.2,"largeur":1.6,"axe":"x","entre":["dehors","abri"]},
  {"id":"conteneur_livraison","x":-16.4,"z":17.85,"largeur":2.3,"axe":"z","entre":["dehors","conteneur_livraison"],"apresEpave":true},
  {"id":"conteneur_bord","x":-14.6,"z":17.6,"largeur":2.3,"axe":"z","entre":["dehors","conteneur_bord"],"apresEpave":true},
  {"id":"conteneur_outillage","x":-2.9,"z":19.8,"y":-4.1,"largeur":2.3,"axe":"x","entre":["dehors","conteneur_outillage"],"apresEpave":true},
];

/** Les objets nommés du modèle (FICHE.objets). */
export const OBJETS_MODELE = ["lanterne_eteinte","lanterne_allumee","prisme_manquant","prisme_tombe","escabeau_phare","bidon_petrole","courroie_compresseur","harpon","epave_apres","cloche_cargo","porte_four","soufflet","rabot","jerrican"] as const;

/** Où sont les objets nommés (le centre de leur boîte ; y : leur bas). */
export const PLACES_OBJETS: Readonly<Record<(typeof OBJETS_MODELE)[number], { x: number; z: number; y: number }>> = {
  "lanterne_eteinte": {
    "x": -10,
    "z": -6,
    "y": 27
  },
  "lanterne_allumee": {
    "x": -10,
    "z": -6,
    "y": 23.9
  },
  "prisme_manquant": {
    "x": -9.57,
    "z": -5.87,
    "y": 27.61
  },
  "prisme_tombe": {
    "x": -12.68,
    "z": -1.07,
    "y": -0.12
  },
  "escabeau_phare": {
    "x": -20.68,
    "z": 10.3,
    "y": -0.01
  },
  "bidon_petrole": {
    "x": -11.04,
    "z": -4.84,
    "y": 0.04
  },
  "courroie_compresseur": {
    "x": 18.83,
    "z": 8.45,
    "y": 0.02
  },
  "harpon": {
    "x": -5.34,
    "z": -7.76,
    "y": 1.52
  },
  "epave_apres": {
    "x": -13.36,
    "z": 20.48,
    "y": -13.26
  },
  "cloche_cargo": {
    "x": -5.14,
    "z": 17.28,
    "y": -3.6
  },
  "porte_four": {
    "x": -17.55,
    "z": 16.92,
    "y": -8.7
  },
  "soufflet": {
    "x": -19.32,
    "z": 18.25,
    "y": -8.63
  },
  "rabot": {
    "x": -2.55,
    "z": 22.28,
    "y": -3.17
  },
  "jerrican": {
    "x": -10.01,
    "z": 17.15,
    "y": -8.68
  }
};

/** L'échelle de coupée et la cloche de l'épave. */
export const EPAVE_MODELE = {
  "echelle": {
    "bas": {
      "x": -13.26,
      "z": 21.74,
      "y": -8.85
    },
    "haut": {
      "x": -7.27,
      "z": 20.13,
      "y": -4.06
    }
  },
  "cloche": {
    "x": -5.14,
    "z": 17.28,
    "y": -3.5
  }
} as const;

export const FOUILLE_MODELE: readonly PointModele[] = [
  {"x":-11.6,"z":-4.1},
  {"x":-11,"z":-4.9},
  {"x":-8,"z":-8.6},
  {"x":-12,"z":-8.2},
  {"x":-12.8,"z":-1.2},
  {"x":-4.8,"z":-7.9},
  {"x":0,"z":-10.4},
  {"x":-2.2,"z":-6.5},
  {"x":3,"z":-9.6},
  {"x":9.8,"z":-7.9},
  {"x":12.6,"z":-8.5},
  {"x":11.6,"z":-10.5},
  {"x":-24,"z":8},
  {"x":-27.2,"z":6},
  {"x":-20.6,"z":10.3},
  {"x":17.4,"z":7.8},
  {"x":5.5,"z":-0.9},
  {"x":0.2,"z":-2.2},
  {"x":-17.5,"z":10.8},
  {"x":-24,"z":-7},
  {"x":-27.6,"z":18.6,"y":-8.7},
  {"x":-18.6,"z":17.8,"y":-8.6,"apresEpave":true},
  {"x":-10.4,"z":17.3,"y":-8.6,"apresEpave":true},
  {"x":-2.5,"z":21.6,"y":-4.1,"apresEpave":true},
  {"x":-5.1,"z":17.6,"y":-3.9,"apresEpave":true},
  {"x":-15.5,"z":20.9,"y":-8.8,"apresEpave":true},
];

export const ETEINTS_MODELE: readonly PointModele[] = [
  {"x":-2.6,"z":-5.2,"type":"ancien habitant (le dernier gardien, ciré jaune délavé)"},
  {"x":-23.2,"z":6.5,"type":"rampant (sous le canot)"},
  {"x":-27,"z":1.9,"type":"dormeur (couché le long du chemin des douaniers, 1/9 ; se lève quand la lanterne s'allume)"},
  {"x":-20.5,"z":2.6,"type":"dormeur (couché le long du chemin des douaniers, 2/9 ; se lève quand la lanterne s'allume)"},
  {"x":-15.6,"z":5.3,"type":"dormeur (couché le long du chemin des douaniers, 3/9 ; se lève quand la lanterne s'allume)"},
  {"x":-9.4,"z":7.9,"type":"dormeur (couché le long du chemin des douaniers, 4/9 ; se lève quand la lanterne s'allume)"},
  {"x":-4.2,"z":8.4,"type":"dormeur (couché le long du chemin des douaniers, 5/9 ; se lève quand la lanterne s'allume)"},
  {"x":2.9,"z":5.3,"type":"dormeur (couché le long du chemin des douaniers, 6/9 ; se lève quand la lanterne s'allume)"},
  {"x":6.4,"z":7.6,"type":"dormeur (couché le long du chemin des douaniers, 7/9 ; se lève quand la lanterne s'allume)"},
  {"x":11.4,"z":3.9,"type":"dormeur (couché le long du chemin des douaniers, 8/9 ; se lève quand la lanterne s'allume)"},
  {"x":18.6,"z":2.7,"type":"dormeur (couché le long du chemin des douaniers, 9/9 ; se lève quand la lanterne s'allume)"},
  {"x":-27.4,"z":22,"y":-8.9,"type":"Noyé (au bord de l'eau, sur la grève de la crique)"},
  {"x":-19.8,"z":22.1,"y":-8.9,"type":"Noyé (au bord de l'eau, sur la grève de la crique)"},
  {"x":-14.4,"z":22.4,"y":-8.9,"type":"Noyé (au pied de l'échelle de coupée, au bord de l'eau)"},
];
