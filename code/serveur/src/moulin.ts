// L1B, le Moulin du Gué, côté serveur (plan 0.8, chantier 12) : un lieu vivant par joueur, comme la Coopérative
// (Book 23). Personne d'autre n'y entre ; ses Éteints, ses sacs tombés et son butin sont à lui.
//
// Chantier 4 : le lieu est branché vide (on y arrive par le pont, on en repart par la route ou par le chemin de halage).
// Le chantier 12 le remplit : la définition (zone, portes, plan de vue, milieu, Éteints, butin, version) vient alors de
// `commun/src/moulin.ts`, et ce qu'on garde entre deux visites (Éteints détruits, grande porte, réinitialisation à 24 h)
// se range en base comme pour les Coopératives (serveur/src/cooperative.ts).

import { ZONE_MOULIN } from "../../commun/src/lieux.ts";
import type { Base } from "./base.ts";
import { LieuVivant, type DefinitionLieuVivant } from "./lieu-vivant.ts";

/** Le Moulin d'un joueur tel que le chantier 4 le branche : sans Éteints ni butin. */
export function definitionMoulin(compteId: number): DefinitionLieuVivant {
  return {
    cle: `moulin:${compteId}`,
    sacs: { lieu: "moulin", terrainDe: compteId },
    zone: ZONE_MOULIN,
    econome: true,
    eteints: () => [],
    ressources: () => [],
    version: 1,
  };
}

/** Un Moulin vide depuis 5 minutes quitte la mémoire (il sera rechargé au prochain passage). */
const DECHARGER_APRES_MS = 5 * 60_000;

/** Les Moulins chargés, un par joueur, créés au premier besoin. */
export class Moulins {
  private readonly instances = new Map<number, LieuVivant>();
  private readonly base: Base;
  private readonly alea: () => number;

  constructor(base: Base, alea: () => number = Math.random) {
    this.base = base;
    this.alea = alea;
  }

  de(compteId: number): LieuVivant {
    let lieu = this.instances.get(compteId);
    if (!lieu) {
      lieu = new LieuVivant(this.base, definitionMoulin(compteId), this.alea);
      this.instances.set(compteId, lieu);
    }
    return lieu;
  }

  get nombre(): number {
    return this.instances.size;
  }

  tick(instant: number, dt: number): void {
    for (const [id, lieu] of this.instances) {
      lieu.tick(instant, dt);
      if (lieu.videDepuisPlusDe(instant, DECHARGER_APRES_MS)) this.instances.delete(id);
    }
  }
}
