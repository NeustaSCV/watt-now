// ⚡ Les armes des Voltaïques : l'électricité (Book 25 §5 et §8.2). Type « électrique » : rien au torse ; la courte
// (coup) fait lâcher et raidit, la longue (coupAppuye) met à terre un Éteint libre et détruit un Éteint raidi ou à
// terre, casque ou pas. Valeurs à ★★★ ; le raidissement et la durée de la longue suivent les étoiles (ETOILES,
// etoiles.ts). Le chantier 6 ajoute ici la matraque de fortune, la matraque électrique et l'aiguillon, par exemple :
//
//   { rang: 75, objet: "matraque_electrique", nom: "la matraque électrique", type: "electrique", solidite: 60,
//     degatsTorse: 0, tueALaTete: true, allonge: 1.3, coup: 450, coupAppuye: 1000, metier: true,
//     electrique: { raidi: 2.5, whCourte: 0.25, whLongue: 1, saute: true } },
//
// La consommation de Wh et le pack vide (un gourdin court) sont au chantier 6 : `armeSansCharge` (combat.ts) donne
// l'arme que devient une arme électrique vide.

import type { Arme } from "../combat.ts";

export const ARMES_VOLTAIQUES: Arme[] = [];
