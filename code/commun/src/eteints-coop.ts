// Les Éteints de la Coopérative du Plateau (Book 23 §3). À part du plan (cooperative.ts) : le plan sert aux lieux, et
// les Éteints dépendent des lieux.

import { nouvelEteint, type Eteint } from "./eteints.ts";

/**
 * Les Éteints de la Coopérative, au calme. 0.5a : six Errants dans la cour, à plus de 15 m de l'arrivée (Book 23 §3).
 * Les 24 du Book 23 (groupes, dormants, Rampants, Équipés, magasinier, mécanicien) arrivent avec l'IA des bâtiments (0.5c).
 */
export function eteintsCoop(): Eteint[] {
  const places: [number, number, number][] = [
    [15, 45, 0.4],
    [27, 39, -1.2],
    [60, 48, 2.1],
    [72, 50, -2.6],
    [8, 14, 1],
    [76.5, 12, 3],
  ];
  return places.map(([x, z, o], i) => nouvelEteint(i + 1, x, z, "errant", o));
}
