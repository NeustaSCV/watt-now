// À terre ou détruit, au corps de l'Éteint (plan 0.9 §3.3 bis, chantier F) : où en est le corps, sans Three.js, pour
// le tester seul. Le dessin (eteint-au-sol.ts) lit ces poids à chaque image.
//
// - À terre : après la chute, il remue (soubresauts, une main qui griffe, la tête qui se soulève) ; dans ses dernières
//   secondes au sol (`seReleve`), il prend appui.
// - Détruit : plus un mouvement ; la peau vire au gris cendre en une seconde et demie ; les membres se relâchent à plat
//   dans la seconde qui suit la chute ; à la fin (`efface`), il s'efface doucement.

import { EFFACEMENT_S, type EtatEteint } from "../../../commun/src/eteints.ts";

/** Les durées des fondus (s). */
export const FONDUS = {
  /** Le remuement s'installe, ou s'arrête (relevé, achevé). */
  remue: 0.35,
  /** Il prend appui. */
  appui: 0.45,
  /** Les membres du détruit se relâchent. */
  relache: 1,
  /** La peau du détruit vire au gris cendre (validé : « en une ou deux secondes »). */
  cendre: 1.5,
};
/** Où en est la chute (0 à 1, l'animation Death01) quand il commence à remuer, ou à se relâcher. */
export const FIN_DE_CHUTE = { remue: 0.8, relache: 0.85 };

export interface PoidsAuSol {
  /** À terre : il remue (0 à 1). */
  remue: number;
  /** À terre, bientôt relevé : il prend appui (0 à 1). */
  appui: number;
  /** Détruit : les membres relâchés (0 à 1, adouci). */
  relache: number;
  /** Détruit : la peau et les vêtements ternis (0 à 1). */
  cendre: number;
  /** Détruit, en fin de course : effacé (0 à 1). */
  effacement: number;
}

const vers = (x: number, cible: number, pas: number) => (x < cible ? Math.min(cible, x + pas) : Math.max(cible, x - pas));

export class SuiviAuSol {
  readonly poids: PoidsAuSol = { remue: 0, appui: 0, relache: 0, cendre: 0, effacement: 0 };
  /** Le relâchement avant adoucissement (linéaire). */
  private relacheLineaire = 0;
  private premier = true;

  /**
   * Avance de `dt`. `chute` : où en est l'animation de chute (0 à 1). Renvoie true quand on découvre un corps déjà
   * détruit (on arrive dans le lieu) : il est montré tout de suite à plat, terni, sans chute ni poussière.
   */
  avancer(dt: number, etat: EtatEteint, chute: number, seReleve: boolean, efface: boolean): boolean {
    const p = this.poids;
    const decouvert = this.premier && etat === "detruit";
    this.premier = false;
    if (decouvert) {
      this.relacheLineaire = 1;
      p.cendre = 1;
    }
    const aTerre = etat === "a_terre";
    const detruit = etat === "detruit";
    p.remue = vers(p.remue, aTerre && !seReleve && chute >= FIN_DE_CHUTE.remue ? 1 : 0, dt / FONDUS.remue);
    p.appui = vers(p.appui, aTerre && seReleve ? 1 : 0, dt / FONDUS.appui);
    // Le détruit ne revient jamais : le relâchement et la teinte ne font que monter.
    if (detruit && chute >= FIN_DE_CHUTE.relache) this.relacheLineaire = Math.min(1, this.relacheLineaire + dt / FONDUS.relache);
    if (!detruit) this.relacheLineaire = 0;
    const r = this.relacheLineaire;
    p.relache = r * r * (3 - 2 * r);
    p.cendre = detruit ? Math.min(1, p.cendre + dt / FONDUS.cendre) : 0;
    p.effacement = detruit && efface ? Math.min(1, p.effacement + dt / EFFACEMENT_S) : 0;
    return decouvert;
  }

  /** Il bouge encore, ou ses membres sont encore à poser : il faut retoucher la pose. */
  get pose(): boolean {
    const p = this.poids;
    return p.remue > 0 || p.appui > 0 || p.relache > 0;
  }

  /** Le détruit est posé pour de bon : sa pose ne change plus (on la garde telle quelle). */
  get fige(): boolean {
    return this.poids.relache >= 1 && this.poids.remue === 0 && this.poids.appui === 0;
  }
}
