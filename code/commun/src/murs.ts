// Ce qui arrête un coup (0.7.1) : on ne frappe pas, on ne tire pas, on ne lance pas et l'on ne mord pas à travers un
// mur. Une seule règle pour tout le jeu, sur les obstacles mêmes qui arrêtent les déplacements (Zone.obstacles) :
// les murs et les cloisons de la Coopérative, ses portes fermées et ses rayonnages de 4 m, les murs de la boutique de
// la halte, l'atelier, l'éboulis du goulet… Le mobilier bas (une caisse, un rayon bas, des palettes) n'arrête rien :
// on frappe et l'on lance par-dessus.
// Le serveur fait autorité : il refuse le coup, la morsure ou l'impact quand un mur se trouve entre les deux.

import { MOBILIER } from "./cooperative.ts";
import type { Boite, Zone } from "./lieux.ts";

/** Le mobilier bas, par-dessus lequel on frappe et l'on lance (une caisse, un rayon bas, des palettes). */
const GENRES_BAS = new Set(["caisse", "rayon_bas", "palettes", "transpalette", "bureau", "etabli", "coffre_fort"]);
// Un ensemble faible : les obstacles bas d'un lieu qui bouge (le radeau du gué) s'en vont avec leur zone.
const BOITES_BASSES = new WeakSet<Boite>(MOBILIER.filter((m) => GENRES_BAS.has(m.genre)).map((m) => m.boite));

/**
 * Des obstacles bas d'un autre lieu (plan 0.8, chantier 11 : au gué, l'eau, les berges, les bords du radier) : on ne
 * les traverse pas à pied, mais on frappe, on saisit et l'on lance par-dessus.
 */
export function declarerObstaclesBas(boites: Iterable<Boite>): void {
  for (const b of boites) BOITES_BASSES.add(b);
}

/** Cet obstacle arrête-t-il un coup ou un objet lancé ? (les murs, les rayonnages, les tracteurs ; pas le mobilier bas) */
export function arreteLesCoups(b: Boite): boolean {
  return !BOITES_BASSES.has(b);
}

/**
 * Où un segment (de a vers b) entre-t-il dans une boîte élargie de `marge` ? En part du segment (0 à 1), ou null.
 * La méthode des tranches : on coupe le segment par les deux plans de chaque axe.
 */
export function entreeDansBoite(ax: number, az: number, bx: number, bz: number, boite: Boite, marge = 0): number | null {
  let t0 = 0;
  let t1 = 1;
  const axes: [number, number, number, number][] = [
    [ax, bx - ax, boite.x - boite.l / 2 - marge, boite.x + boite.l / 2 + marge],
    [az, bz - az, boite.z - boite.p / 2 - marge, boite.z + boite.p / 2 + marge],
  ];
  for (const [o, d, min, max] of axes) {
    if (Math.abs(d) < 1e-9) {
      if (o < min || o > max) return null;
      continue;
    }
    let ta = (min - o) / d;
    let tb = (max - o) / d;
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta);
    t1 = Math.min(t1, tb);
    if (t0 > t1) return null;
  }
  return t0;
}

function dedans(x: number, z: number, b: Boite, marge: number): boolean {
  return Math.abs(x - b.x) < b.l / 2 + marge && Math.abs(z - b.z) < b.p / 2 + marge;
}

/** Le premier mur rencontré : la part du trajet faite avant de le heurter (0 à 1), et le point d'impact. */
export interface Heurt {
  t: number;
  x: number;
  z: number;
}

/**
 * Le premier mur sur le segment de a vers b, ou null si la voie est libre. Un mur dans lequel se trouve déjà le point
 * de départ ne compte pas (on se tient sur le seuil d'une porte) ; avec `jusquALaCible`, un mur dans lequel se trouve
 * le point d'arrivée non plus (un Éteint plaqué contre un mur se frappe encore).
 */
export function murEntre(zone: Zone, ax: number, az: number, bx: number, bz: number, options: { marge?: number; jusquALaCible?: boolean } = {}): Heurt | null {
  const marge = options.marge ?? 0.05;
  let t = Infinity;
  for (const b of zone.obstacles) {
    if (!arreteLesCoups(b) || dedans(ax, az, b, marge)) continue;
    if (options.jusquALaCible && dedans(bx, bz, b, marge)) continue;
    const e = entreeDansBoite(ax, az, bx, bz, b, marge);
    if (e !== null && e < t) t = e;
  }
  if (t === Infinity) return null;
  return { t, x: ax + (bx - ax) * t, z: az + (bz - az) * t };
}

/** Rien n'arrête un coup de a vers b (de qui frappe, tire ou mord, jusqu'à sa cible) ? */
export function voieLibre(zone: Zone, a: { x: number; z: number }, b: { x: number; z: number }): boolean {
  return murEntre(zone, a.x, a.z, b.x, b.z, { jusquALaCible: true }) === null;
}
