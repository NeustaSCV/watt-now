// Une grille d'obstacles (Book 23 §7) : des cases de 4 m, chacune avec les boîtes qui la touchent (élargies d'une
// marge). Une collision ne regarde que la case où l'on est : dans la Coopérative et ses 50 murs, ça reste bon marché.

import type { Boite } from "./lieux.ts";

export interface GrilleObstacles {
  taille: number;
  cases: Map<number, Boite[]>;
}

/** Marge couverte par la grille : assez pour le rayon d'un personnage (0,35 m) ou d'un Éteint (0,3 m), et au-delà. */
export const MARGE_GRILLE = 1;

const cle = (i: number, j: number) => i * 4096 + j;

export function creerGrille(boites: readonly Boite[], taille = 4): GrilleObstacles {
  const cases = new Map<number, Boite[]>();
  for (const b of boites) {
    const i0 = Math.floor((b.x - b.l / 2 - MARGE_GRILLE) / taille);
    const i1 = Math.floor((b.x + b.l / 2 + MARGE_GRILLE) / taille);
    const j0 = Math.floor((b.z - b.p / 2 - MARGE_GRILLE) / taille);
    const j1 = Math.floor((b.z + b.p / 2 + MARGE_GRILLE) / taille);
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        const k = cle(i, j);
        const liste = cases.get(k);
        if (liste) liste.push(b);
        else cases.set(k, [b]);
      }
    }
  }
  return { taille, cases };
}

const AUCUNE: readonly Boite[] = [];

/** Les boîtes proches d'un point (celles de sa case). */
export function boitesPres(g: GrilleObstacles, x: number, z: number): readonly Boite[] {
  return g.cases.get(cle(Math.floor(x / g.taille), Math.floor(z / g.taille))) ?? AUCUNE;
}
