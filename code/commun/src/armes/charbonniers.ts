// 🔥 Les armes des Charbonniers : les lames (Book 25 §4.3, §8.1 et §8.5). Valeurs à ★★★ (leurs étoiles de base) ; les
// autres étoiles ont leurs dégâts décidés (`parEtoiles`, plan 0.8 §2.4), et leur solidité suit `ETOILES`. Par
// exemplaire (chaque lame est déclarée dans OBJETS_DE_METIER, etoiles.ts). Les rangs se glissent entre ceux des armes
// communes (communes.ts) : sans arme équipée, on frappe avec la meilleure du sac.
//
// Toutes tranchantes : le casque d'un Équipé les arrête à la tête (Book 23 §4.2). La lance à pointe forgée est perçante.

import type { Arme, MatiereArme } from "../combat.ts";
import type { TypeObjet } from "../objets.ts";

/**
 * Les dégâts décidés étoile par étoile (plan 0.8 §2.4, `decisions-armes.json`, K1 à K24) : la bande de l'étape de
 * l'étoile (H1 0,8 – 1,5 ; L2 2 – 3 ; L3 3 – 4 ; plus tard 4 – 5). La forge du niveau 1 (le foyer et l'enclume de
 * dépanneur) fait ★★ ; ★★★ vient de la maîtrise, avec ses vrais dégâts (K-Q1), ou de la forge ventilée (L2B).
 */
const ETOILES_HACHE: Arme["parEtoiles"] = { 2: { degats: 2.6, etape: "L2" }, 3: { degats: 3, etape: "L2" }, 4: { degats: 4, etape: "L3" }, 5: { degats: 5, etape: "plus_tard" } };
const ETOILES_GLAIVE: Arme["parEtoiles"] = { 2: { degats: 2.3, etape: "L2" }, 3: { degats: 2.6, etape: "L2" }, 4: { degats: 3.7, etape: "L3" }, 5: { degats: 4.7, etape: "plus_tard" } };
const ETOILES_MACHETTE: Arme["parEtoiles"] = { 2: { degats: 1.2, etape: "H1" }, 3: { degats: 2.5, etape: "L2" }, 4: { degats: 3.5, etape: "L3" }, 5: { degats: 4.5, etape: "plus_tard" } };
const ETOILES_HACHETTE: Arme["parEtoiles"] = { 2: { degats: 1.1, etape: "H1" }, 3: { degats: 2.25, etape: "L2" }, 4: { degats: 3.15, etape: "L3" }, 5: { degats: 4.05, etape: "plus_tard" } };
const ETOILES_SERPE: Arme["parEtoiles"] = { 2: { degats: 1, etape: "H1" }, 3: { degats: 2.1, etape: "L2" }, 4: { degats: 3, etape: "L3" }, 5: { degats: 4, etape: "plus_tard" } };
const ETOILES_COUTEAU: Arme["parEtoiles"] = { 2: { degats: 0.9, etape: "H1" }, 3: { degats: 2, etape: "L2" }, 4: { degats: 3, etape: "L3" }, 5: { degats: 4, etape: "plus_tard" } };

export const ARMES_CHARBONNIERS: Arme[] = [
  // La hache forgée : la forge ventilée (L2B) ; une tête neuve plus solide que la hache trouvée.
  { rang: 15, objet: "hache_forgee", nom: "la hache forgée", type: "tranchant", solidite: 70, degatsTorse: 3, tueALaTete: true, allonge: 1.7, coup: 700, coupAppuye: 950, metier: true, parEtoiles: ETOILES_HACHE },
  // Le glaive de ressort : le meilleur rythme de la gamme (0,52 s), à la forge ventilée (L2B).
  { rang: 25, objet: "glaive", nom: "le glaive de ressort", type: "tranchant", solidite: 70, degatsTorse: 2.6, tueALaTete: true, allonge: 1.7, coup: 520, coupAppuye: 780, metier: true, parEtoiles: ETOILES_GLAIVE },
  // L'arme de métier (Book 25 §8.4) : la machette forgée, solide (80 contre 40 pour la machette de fortune). La
  // référence de chaque étape : 1,2 à ★★ (H1), 2,5 à ★★★ (L2).
  { rang: 35, objet: "machette_forgee", nom: "la machette forgée", type: "tranchant", solidite: 80, degatsTorse: 2.5, tueALaTete: true, allonge: 1.6, coup: 500, coupAppuye: 750, metier: true, parEtoiles: ETOILES_MACHETTE },
  // La lance à pointe forgée (D7, K25) : 1,15, sans étoiles ; on la mesure au test de jeu (Q-0.8-6).
  { rang: 65, objet: "lance_forgee", nom: "la lance à pointe forgée", type: "percant", solidite: 60, degatsTorse: 1.15, tueALaTete: true, allonge: 2.6, coup: 650, coupAppuye: 900 },
  // La hachette se lance aussi (tir.ts, OBJETS_LANCES) : lancée, elle fait les dégâts de l'exemplaire (K45).
  { rang: 73, objet: "hachette", nom: "la hachette", type: "tranchant", solidite: 50, degatsTorse: 2.25, tueALaTete: true, allonge: 1.4, coup: 520, coupAppuye: 780, metier: true, parEtoiles: ETOILES_HACHETTE },
  { rang: 76, objet: "serpe", nom: "la serpe", type: "tranchant", solidite: 50, degatsTorse: 2.1, tueALaTete: true, allonge: 1.4, coup: 480, coupAppuye: 720, metier: true, parEtoiles: ETOILES_SERPE },
  // Le couteau de forge (la « lame forgée » d'avant, même identifiant), désormais emmanché.
  { rang: 80, objet: "lame_forgee", nom: "le couteau de forge", type: "tranchant", solidite: 60, degatsTorse: 2, tueALaTete: true, allonge: 1.4, coup: 480, coupAppuye: 720, metier: true, parEtoiles: ETOILES_COUTEAU },
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
