// 🔥 Les armes des Charbonniers : les lames (Book 25 §4.3, §8.1 et §8.5). Valeurs à ★★★ ; les étoiles s'appliquent par
// exemplaire (chaque lame est déclarée dans OBJETS_DE_METIER, etoiles.ts). Les rangs se glissent entre ceux des armes
// communes (communes.ts) : sans arme équipée, on frappe avec la meilleure du sac.
//
// Toutes tranchantes : le casque d'un Équipé les arrête à la tête (Book 23 §4.2). La lance à pointe forgée est perçante.

import type { Arme, MatiereArme } from "../combat.ts";
import type { TypeObjet } from "../objets.ts";

export const ARMES_CHARBONNIERS: Arme[] = [
  // La hache forgée : les valeurs de la hache trouvée, une tête neuve plus solide.
  { rang: 15, objet: "hache_forgee", nom: "la hache forgée", type: "tranchant", solidite: 70, degatsTorse: 2, tueALaTete: true, allonge: 1.7, coup: 700, coupAppuye: 950, metier: true },
  // Le glaive de ressort : le meilleur rythme de la gamme (1,6 en 0,52 s), sous la masse en dégâts par coup.
  { rang: 25, objet: "glaive", nom: "le glaive de ressort", type: "tranchant", solidite: 70, degatsTorse: 1.6, tueALaTete: true, allonge: 1.7, coup: 520, coupAppuye: 780, metier: true },
  // L'arme de métier (Book 25 §8.4) : la machette forgée, solide (80 contre 40 pour la machette de fortune).
  { rang: 35, objet: "machette_forgee", nom: "la machette forgée", type: "tranchant", solidite: 80, degatsTorse: 1.5, tueALaTete: true, allonge: 1.6, coup: 500, coupAppuye: 750, metier: true },
  { rang: 65, objet: "lance_forgee", nom: "la lance à pointe forgée", type: "percant", solidite: 60, degatsTorse: 1.4, tueALaTete: true, allonge: 2.6, coup: 650, coupAppuye: 900 },
  // La hachette se lance aussi (tir.ts, OBJETS_LANCES).
  { rang: 73, objet: "hachette", nom: "la hachette", type: "tranchant", solidite: 50, degatsTorse: 1.3, tueALaTete: true, allonge: 1.4, coup: 520, coupAppuye: 780, metier: true },
  { rang: 76, objet: "serpe", nom: "la serpe", type: "tranchant", solidite: 50, degatsTorse: 1.2, tueALaTete: true, allonge: 1.4, coup: 480, coupAppuye: 720, metier: true },
  // Le couteau de forge (la « lame forgée » d'avant, même identifiant), désormais emmanché.
  { rang: 80, objet: "lame_forgee", nom: "le couteau de forge", type: "tranchant", solidite: 60, degatsTorse: 1, tueALaTete: true, allonge: 1.4, coup: 480, coupAppuye: 720, metier: true },
];

/** Où se répare chaque arme des Charbonniers (Book 25 §4.4) : les lames à la meule ou à la forge. */
export const MATIERES_ARMES_CHARBONNIERS: Partial<Record<TypeObjet, MatiereArme>> = {
  hache_forgee: "lame",
  glaive: "lame",
  machette_forgee: "lame",
  hachette: "lame",
  serpe: "lame",
  lance_forgee: "bois",
};

/** Ce que laisse une arme cassée : une lame ébréchée, que la forge reforge (Book 25 §4.4) ; la lance, son manche fendu. */
export const DEBRIS_ARMES_CHARBONNIERS: Partial<Record<TypeObjet, TypeObjet>> = {
  hache_forgee: "lame_ebrechee",
  glaive: "lame_ebrechee",
  machette_forgee: "lame_ebrechee",
  hachette: "lame_ebrechee",
  serpe: "lame_ebrechee",
  lance_forgee: "manche_fendu",
};
