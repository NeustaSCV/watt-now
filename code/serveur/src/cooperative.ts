// La Coopérative du Plateau, côté serveur (Book 23) : un lieu vivant par joueur. Personne d'autre n'y entre ; ses
// Éteints, ses sacs tombés et (bientôt) son butin sont à lui. Le jour où on la partage, on ne change que la clé.

import { VERSION_COOP } from "../../commun/src/cooperative.ts";
import { eteintsCoop } from "../../commun/src/eteints-coop.ts";
import { ZONE_COOP } from "../../commun/src/lieux.ts";
import type { Base } from "./base.ts";
import { LieuVivant, type DefinitionLieuVivant } from "./lieu-vivant.ts";

export function definitionCoop(compteId: number): DefinitionLieuVivant {
  return {
    cle: `cooperative:${compteId}`,
    sacs: { lieu: "cooperative", terrainDe: compteId },
    zone: ZONE_COOP,
    eteints: eteintsCoop,
    // Le butin arrive avec la persistance et le renouvellement (0.5d).
    ressources: () => [],
    version: VERSION_COOP,
  };
}

/** Une Coopérative vide depuis 5 minutes quitte la mémoire (elle sera rechargée au prochain passage). */
const DECHARGER_APRES_MS = 5 * 60_000;

/** Les Coopératives chargées, une par joueur, créées au premier besoin. */
export class Cooperatives {
  private readonly instances = new Map<number, LieuVivant>();
  private readonly base: Base;
  private readonly alea: () => number;

  constructor(base: Base, alea: () => number = Math.random) {
    this.base = base;
    this.alea = alea;
  }

  de(compteId: number): LieuVivant {
    let c = this.instances.get(compteId);
    if (!c) {
      c = new LieuVivant(this.base, definitionCoop(compteId), this.alea);
      this.instances.set(compteId, c);
    }
    return c;
  }

  get nombre(): number {
    return this.instances.size;
  }

  tick(instant: number, dt: number): void {
    for (const [id, c] of this.instances) {
      c.tick(instant, dt);
      if (c.videDepuisPlusDe(instant, DECHARGER_APRES_MS)) this.instances.delete(id);
    }
  }
}
