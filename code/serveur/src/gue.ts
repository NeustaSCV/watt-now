// H1B, le Gué-aux-Saules, côté serveur (plan 0.8, chantier 11) : un lieu vivant partagé par tous les voyageurs, comme la
// halte de la station-service (Book 01 §2 bis).
//
// Chantier 4 : le lieu est branché vide (on y arrive, on en repart, on y voit les autres voyageurs). Le chantier 11 le
// remplit : la définition ci-dessous (zone avec ses obstacles, plan de vue, milieu, Éteints, ressources, version) vient
// alors de `commun/src/gue.ts`.

import { ZONE_GUE } from "../../commun/src/lieux.ts";
import type { Base } from "./base.ts";
import { LieuVivant, type DefinitionLieuVivant } from "./lieu-vivant.ts";

/** Le gué tel que le chantier 4 le branche : sans Éteints ni ressources. */
export function definitionGue(): DefinitionLieuVivant {
  return {
    cle: "gue",
    sacs: { lieu: "gue", terrainDe: 0 },
    zone: ZONE_GUE,
    eteints: () => [],
    ressources: () => [],
    version: 1,
  };
}

export class Gue extends LieuVivant {
  constructor(base: Base, alea: () => number = Math.random) {
    super(base, definitionGue(), alea);
  }
}
