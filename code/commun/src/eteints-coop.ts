// Les Éteints de la Coopérative du Plateau (Book 23 §3) : 24 à la première visite. À part du plan (cooperative.ts) :
// le plan sert aux lieux, et les Éteints dépendent des lieux.
//
// Le tableau du Book 23 §3 compte 28 Éteints (6 Errants) pour un total annoncé de 24 : on garde 24 (le total, et le
// budget de calcul du Pi), avec 2 Errants. À trancher par le porteur du projet.

import { nouvelEteint, type EtatEteint, type Eteint, type VarianteEteint } from "./eteints.ts";

interface Place {
  x: number;
  z: number;
  o: number;
  etat: EtatEteint;
  variante?: VarianteEteint;
  groupe?: number;
}

const PLACES: Place[] = [
  // 2 Errants : la cour, le libre-service.
  { x: 15, z: 45, o: 0.4, etat: "errant" },
  { x: 48, z: 36.5, o: 2.6, etat: "errant" },
  // 3 groupes de 3 dans le hangar, espacés de plus de 12 m (on peut en isoler un) ; immobiles, ils se suivent.
  { x: 38, z: 22.2, o: 1.2, etat: "dormant", groupe: 1 },
  { x: 40, z: 21.8, o: -2.2, etat: "dormant", groupe: 1 },
  { x: 39.2, z: 22.9, o: 0.3, etat: "dormant", groupe: 1 },
  { x: 53.5, z: 26.8, o: 2, etat: "dormant", groupe: 2 },
  { x: 55, z: 27.2, o: -1.1, etat: "dormant", groupe: 2 },
  { x: 54.3, z: 27.9, o: 0.7, etat: "dormant", groupe: 2 },
  { x: 69, z: 17.6, o: -0.4, etat: "dormant", groupe: 3 },
  { x: 70.5, z: 17.2, o: 2.8, etat: "dormant", groupe: 3 },
  { x: 71.5, z: 18.2, o: 1.6, etat: "dormant", groupe: 3 },
  // 3 Rampants : près des tracteurs, et dans l'herbe de la brèche.
  { x: 12, z: 23.2, o: 3, etat: "errant", variante: "rampant" },
  { x: 22.5, z: 29.2, o: 0.2, etat: "errant", variante: "rampant" },
  { x: 3, z: 33, o: 1.5, etat: "errant", variante: "rampant" },
  // 2 Équipés : un dormant visible dans la cour (évitable), un aux bureaux.
  { x: 30, z: 44, o: 1.9, etat: "dormant", variante: "equipe" },
  { x: 66, z: 35, o: -1.4, etat: "errant", variante: "equipe" },
  // Les anciens habitants : le magasinier aux bureaux, le mécanicien à l'atelier.
  { x: 71, z: 38.6, o: 3.1, etat: "errant", variante: "magasinier" },
  { x: 17, z: 22, o: -0.6, etat: "errant", variante: "mecanicien" },
  // 6 dormants serrés dans la chambre froide : réveillés, ils gémissent (la cascade).
  { x: 63, z: 10.5, o: 0.5, etat: "dormant" },
  { x: 64.5, z: 11, o: -2.4, etat: "dormant" },
  { x: 65.5, z: 12.5, o: 1.2, etat: "dormant" },
  { x: 63.5, z: 12.8, o: 2.9, etat: "dormant" },
  { x: 66.5, z: 10.2, o: -0.9, etat: "dormant" },
  { x: 62, z: 12, o: 1.7, etat: "dormant" },
];

/** Les Éteints de la Coopérative, au calme : chacun chez lui. */
export function eteintsCoop(): Eteint[] {
  return PLACES.map((p, i) => {
    const e = nouvelEteint(i + 1, p.x, p.z, p.etat, p.o);
    e.maison = { x: p.x, z: p.z };
    e.sansVoir = 0;
    if (p.etat === "dormant") e.dormeur = true;
    if (p.variante) e.variante = p.variante;
    if (p.groupe !== undefined) e.groupe = p.groupe;
    return e;
  });
}
