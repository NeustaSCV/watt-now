// Les Éteints du Moulin du Gué (plan 0.8, chantier 12 ; étude h1b-l1b-conception §2.8, M29) : 22, dont 9 dormants,
// placés comme sur la fiche du modèle (`FICHE.eteints`, E1 à E22). À part du plan (moulin.ts), comme ceux de la
// Coopérative (eteints-coop.ts) : le plan sert aux lieux, et les Éteints dépendent des lieux.
//
// Ce que le jeu n'a pas encore (à proposer au porteur, rien n'est codé) : le putréfié de l'étable (E4, ses fluides
// infectieux) et les anciens habitants (le charpentier E6, le meunier E12) n'ont ni variante ni costume : ce sont des
// Errants ordinaires. Les Équipés (E19, E22) portent le casque de l'Équipé.

import { nouvelEteint, type EtatEteint, type Eteint, type VarianteEteint } from "./eteints.ts";
import { jeu } from "./moulin.ts";

interface Place {
  /** Le numéro de la fiche (E1 à E22). */
  n: number;
  x: number;
  z: number;
  o: number;
  etat: EtatEteint;
  variante?: VarianteEteint;
  groupe?: number;
}

/** Les places de la fiche, dans le repère du modèle. */
const PLACES: Place[] = [
  // Le pont et la cour (M32 : rien à moins de 15 m de l'arrivée) : le rampant des roseaux, deux Errants.
  { n: 1, x: 26.2, z: 3.5, o: 2.8, etat: "errant", variante: "rampant" },
  { n: 2, x: -0.8, z: 7.6, o: 0.6, etat: "errant" },
  { n: 3, x: -23.2, z: 7.6, o: -1.2, etat: "errant" },
  // L'étable : le putréfié de la stalle, le rampant sous la litière.
  { n: 4, x: -11.4, z: 13.2, o: 0.3, etat: "errant" },
  { n: 5, x: -9.4, z: 14.3, o: 2.2, etat: "errant", variante: "rampant" },
  // L'atelier : deux dormants à 3,5 m du tableau à clés (M3), le charpentier de moulin et son apprenti.
  { n: 6, x: -20.0, z: 11.2, o: -2.4, etat: "dormant" },
  { n: 7, x: -18.6, z: 12.4, o: 1.1, etat: "dormant" },
  // Les meules sud : le groupe des garçons meuniers ; la grande porte qui grince les met en marche ensemble.
  { n: 8, x: 0.9, z: -2.0, o: 3.0, etat: "errant", groupe: 1 },
  { n: 9, x: -0.9, z: -2.2, o: 2.6, etat: "errant", groupe: 1 },
  { n: 10, x: 1.8, z: -0.6, o: -2.9, etat: "errant", groupe: 1 },
  // Au fond de la fosse du rouet : le rampant qui ne sort pas, et gémit quand on passe en marchant (M15).
  { n: 11, x: 6.4, z: -4.3, o: -1.6, etat: "errant", variante: "rampant" },
  // Les meules nord : le meunier, deux dormants.
  { n: 12, x: 0.5, z: -9.8, o: 0.2, etat: "errant" },
  { n: 13, x: -1.6, z: -9.6, o: 1.4, etat: "dormant" },
  { n: 14, x: 3.4, z: -9.3, o: -0.8, etat: "dormant" },
  // Le magasin : cinq dormants serrés entre les piles de sacs, dont l'Équipé (le livreur au casque de moto) : la cascade.
  { n: 15, x: -14.6, z: -8.6, o: 0.4, etat: "dormant" },
  { n: 16, x: -13.8, z: -9.9, o: 2.1, etat: "dormant" },
  { n: 17, x: -12.2, z: -10.6, o: -2.7, etat: "dormant" },
  { n: 18, x: -14.4, z: -6.6, o: 1.0, etat: "dormant" },
  { n: 19, x: -11.0, z: -4.0, o: 3.1, etat: "dormant", variante: "equipe" },
  // Le jardin : le rampant des roseaux du bief, près de l'if.
  { n: 20, x: 9.0, z: -18.0, o: -1.9, etat: "errant", variante: "rampant" },
  // La boutique : le vendeur au tablier « Authentique », l'Équipé technicien des robots.
  { n: 21, x: -12.8, z: -0.6, o: 0.9, etat: "errant" },
  { n: 22, x: -7.2, z: -1.0, o: -0.5, etat: "errant", variante: "equipe" },
];

/** Les Éteints du Moulin, au calme : chacun chez lui. Leur numéro est celui de la fiche (E1 : 1). */
export function eteintsMoulin(): Eteint[] {
  return PLACES.map((p) => {
    const { x, z } = jeu(p.x, p.z);
    const e = nouvelEteint(p.n, x, z, p.etat, p.o);
    e.maison = { x, z };
    e.sansVoir = 0;
    if (p.etat === "dormant") e.dormeur = true;
    if (p.variante) e.variante = p.variante;
    if (p.groupe !== undefined) e.groupe = p.groupe;
    return e;
  });
}
