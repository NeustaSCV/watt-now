// L'arc pour tous, côté serveur (Book 25 §3, chantier 4 · 0.6) : le séchage des ébauches, et le redresseur de fûts.
//
// Comme le moteur des projectiles (tir.ts), ce module ne connaît pas le joueur : il passe par un contexte, si bien que
// joueur.ts n'ajoute que des appels d'une ligne (Book 25 §10.4). La règle elle-même est dans commun/src/arc.ts.

import { ACCELERATION_REDRESSEUR, avancerSechage, estRecetteFleche, type EtatSechage } from "../../commun/src/arc.ts";
import type { Inventaire, TypeObjet } from "../../commun/src/objets.ts";
import type { InstallationVue } from "../../commun/src/messages.ts";

/** Ce que le joueur prête au séchage. */
export interface ContexteSechage {
  maintenant(): number;
  inventaire(): Inventaire;
  /** Remplacer des ébauches vertes par des sèches (un seul envoi d'inventaire). */
  echanger(retire: Inventaire, ajoute: Inventaire): void;
  charger(): EtatSechage;
  sauver(etat: EtatSechage): void;
  info(texte: string): void;
}

/** On regarde où en est le séchage toutes les 5 secondes : il dure deux heures. */
const PERIODE_MS = 5000;

/** Les ébauches d'arc qui sèchent dans le sac, même hors ligne : on compare des instants. */
export class Sechage {
  /** Chargé au premier passage (le joueur n'est pas encore prêt quand on le construit). */
  private etat: EtatSechage | null = null;
  private prochain = 0;
  private readonly ctx: ContexteSechage;

  constructor(ctx: ContexteSechage) {
    this.ctx = ctx;
  }

  /** L'état, pour les tests et la fiche. */
  get departs(): EtatSechage {
    return (this.etat ??= this.ctx.charger());
  }

  /** Fait avancer le séchage (au plus toutes les 5 s, sauf `force`). Les ébauches sèches passent dans le sac. */
  avancer(force = false): void {
    const instant = this.ctx.maintenant();
    if (!force && instant < this.prochain) return;
    this.prochain = instant + PERIODE_MS;
    const r = avancerSechage(this.ctx.inventaire(), this.departs, instant);
    if (!r.change) return;
    this.etat = r.etat;
    this.ctx.sauver(this.etat);
    const seches = Object.entries(r.seches) as [TypeObjet, number][];
    if (!seches.length) return;
    this.ctx.echanger(r.vertes, r.seches);
    const n = seches.reduce((s, [, k]) => s + k, 0);
    this.ctx.info(`${n > 1 ? `${n} ébauches d'arc ont` : "Ton ébauche d'arc a"} séché. Monte l'arc près d'un feu, avec une corde d'arc.`);
  }
}

/**
 * Le redresseur de fûts (Book 25 §9.3) : une recette de flèches faite à côté d'un établi qui l'a reçu va deux fois plus
 * vite. Rend le multiplicateur de durée (1 : rien ne change).
 */
export function accelerationFleches(recette: string, installations: Iterable<InstallationVue>, proche: (x: number, z: number) => boolean): number {
  if (!estRecetteFleche(recette)) return 1;
  for (const i of installations) if (i.type === "etabli" && i.etat.redresseur && proche(i.x, i.z)) return ACCELERATION_REDRESSEUR;
  return 1;
}
