// 🔥 Les armes des Charbonniers : les lames (Book 25 §4 et §8.1). Valeurs à ★★★ ; les étoiles s'appliquent par
// exemplaire (etoiles.ts : déclarer chaque arme de métier dans OBJETS_DE_METIER). Le chantier 5 ajoute ici la gamme :
// couteau de forge, hachette, serpe, machette forgée, hache forgée, glaive, avec des rangs glissés entre ceux des
// armes communes (communes.ts).

import type { Arme } from "../combat.ts";

export const ARMES_CHARBONNIERS: Arme[] = [
  { rang: 80, objet: "lame_forgee", nom: "la lame forgée", type: "tranchant", solidite: 60, degatsTorse: 1, tueALaTete: true, allonge: 1.4, coup: 480, coupAppuye: 720, metier: true },
];
