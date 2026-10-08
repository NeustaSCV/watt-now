// La décharge du terrain (proposition P-001, 2026-10-08) : un tas d'ordures de l'Âge de l'Abondance, au bord du terrain,
// qui fait remonter des objets au fil du temps, même hors ligne. Surtout des trucs nuls. Ils restent là tant qu'on ne
// les prend pas : le joueur qui joue peu n'est pas puni, il a même une surprise en revenant. On y fouille comme dans un
// coffre, objet par objet : il faut choisir ce qu'on emporte (le sac ne suit pas).

import type { Inventaire } from "./objets.ts";
import { POIDS_RARETE, VESTIGES, type DefinitionVestige, type TypeVestige } from "./vestiges.ts";

/** Sa place sur le terrain : à l'ouest, près de la lisière, loin de la ruine et de la mare. */
export const DECHARGE = { x: 7.5, z: 14 } as const;
/** Un objet remonte toutes les deux heures réelles. */
export const INTERVALLE_DECHARGE_MS = 2 * 3_600_000;
/** Au-delà, rien ne remonte plus tant qu'on n'a pas fait de place : un tas, pas une montagne. */
export const MAX_DECHARGE = 12;
/** Trop lourd pour remonter d'un tas d'ordures (on ne déterre pas un groupe électrogène). */
const POIDS_MAX = 25;

/** Ce qui est nul remonte plus souvent : la valeur divise les chances (P-001 : « surtout des trucs nuls »). */
function nullite(d: DefinitionVestige): number {
  return d.valeur <= 5 ? 4 : d.valeur <= 20 ? 2 : 1;
}

/** La table de la décharge : tous les vestiges assez légers, pondérés par rareté et par nullité. */
export function tableDecharge(): [TypeVestige, number][] {
  const table: [TypeVestige, number][] = [];
  for (const [type, d] of Object.entries(VESTIGES) as [TypeVestige, DefinitionVestige][]) {
    if (d.poids > POIDS_MAX || d.horsTirage) continue;
    table.push([type, POIDS_RARETE[d.rarete] * nullite(d)]);
  }
  return table;
}

function tirer(table: [TypeVestige, number][], alea: () => number): TypeVestige {
  const total = table.reduce((s, [, p]) => s + p, 0);
  let r = Math.min(Math.max(alea(), 0), 0.999999) * total;
  for (const [t, p] of table) {
    if (r < p) return t;
    r -= p;
  }
  return table[table.length - 1]![0];
}

export interface EtatDecharge {
  contenu: Inventaire;
  /** Instant réel (ms) du dernier calcul. */
  majLe: number;
}

function nombre(contenu: Inventaire): number {
  return Object.values(contenu).reduce((s, n) => s + (n ?? 0), 0);
}

/**
 * Ce qui a remonté depuis le dernier calcul : un objet par intervalle, jusqu'au plafond. Le temps passé avec un tas
 * plein est perdu (on ne fait pas de réserve). Renvoie le nouvel état et la liste de ce qui est arrivé.
 */
export function remonter(etat: EtatDecharge, instant: number, alea: () => number): { etat: EtatDecharge; arrives: Inventaire } {
  const contenu: Inventaire = { ...etat.contenu };
  const arrives: Inventaire = {};
  let majLe = etat.majLe > 0 ? etat.majLe : instant;
  const table = tableDecharge();
  while (instant - majLe >= INTERVALLE_DECHARGE_MS) {
    majLe += INTERVALLE_DECHARGE_MS;
    if (nombre(contenu) >= MAX_DECHARGE) {
      majLe = instant;
      break;
    }
    const t = tirer(table, alea);
    contenu[t] = (contenu[t] ?? 0) + 1;
    arrives[t] = (arrives[t] ?? 0) + 1;
  }
  return { etat: { contenu, majLe }, arrives };
}
