// Les Éteints du Grand Hôtel des Flots (plan 0.10, chantier J ; niveau-2.md §9.2, S-06, S-31 à S-33) : 18, placés comme
// sur la fiche du modèle (`FICHE.eteints`, dans l'ordre) : les clients du « Séjour Zéro-Effort » qui dorment dans les
// transats et dans leurs lits (des dormeurs, qui se relèvent quand on les réveille), les deux Noyés de la piscine,
// l'Ensablé dans la dune de la salle à manger, près du robot-serveur, le personnel et quelques Errants.
//
// Les anciens habitants (le groom, le maître-nageur, le marchand de glaces, la réceptionniste, le cuisinier, la femme de
// chambre) n'ont ni variante ni costume : ce sont des Errants ordinaires (comme au Moulin).

import { eteintsDePlaces, type Eteint, type PlaceEteint } from "./eteints.ts";
import { jeuHotel } from "./hotel.ts";

/** Les places de la fiche, dans le repère du lot (FICHE.eteints, `vers()`). */
const PLACES: readonly PlaceEteint[] = [
  // La terrasse : trois clients endormis dans leurs transats, au bord de la piscine.
  { n: 1, x: 10, z: 11.4, o: 3.1, etat: "dormant" },
  { n: 2, x: 14, z: 11.4, o: 3.1, etat: "dormant" },
  { n: 3, x: 19.6, z: 6.7, o: -1.6, etat: "dormant" },
  // Les deux Noyés, dans l'eau croupie de la piscine.
  { n: 4, x: 10.5, z: 6.5, o: 0.4, variante: "noye" },
  { n: 5, x: 14.8, z: 8.2, o: 2.2, variante: "noye" },
  // L'Ensablé, à moitié sous la dune de la salle à manger, près du robot-serveur.
  { n: 6, x: -12.6, z: -7.4, o: 1.2, variante: "ensable" },
  // Le groom sous la marquise, le maître-nageur, le marchand de glaces dans sa buvette, un Errant entre les guéridons.
  { n: 7, x: 3.6, z: -0.6, o: 0.2 },
  { n: 8, x: 17.6, z: 23, o: -2.6 },
  { n: 9, x: -19.4, z: 14.8, o: 1.4 },
  { n: 10, x: -3, z: 4, o: 2.4 },
  // La réceptionniste derrière son comptoir, le cuisinier, un Errant dans le grand salon, un autre sur la plage.
  { n: 11, x: -2.3, z: -9.4, o: 0 },
  { n: 12, x: -5.4, z: -15.2, o: 1.9 },
  { n: 13, x: 13.6, z: -8.6, o: -0.7 },
  { n: 14, x: -5, z: 23, o: 0.9 },
  // L'étage : le client de la suite dans son lit à baldaquin, ceux des chambres 7 et 11, la femme de chambre.
  { n: 15, x: -12.6, z: -22.6, o: 1.6, etat: "dormant" },
  { n: 16, x: -7.3, z: -21.8, o: 3.1, etat: "dormant" },
  { n: 17, x: -7, z: -30.2, o: 0, etat: "dormant" },
  { n: 18, x: -16.6, z: -29.2, o: -1.2 },
];

/** Les Éteints de l'hôtel, au calme : chacun chez lui. Leur numéro est leur rang sur la fiche (le premier : 1). */
export function eteintsHotel(): Eteint[] {
  return eteintsDePlaces(PLACES, jeuHotel);
}
