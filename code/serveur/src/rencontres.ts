// Les rencontres et le « voir faire » (l'arbre de progression, 0.7, §2.3 et Q7) : dans un lieu public, rester une
// minute à portée de voix d'un joueur d'une autre famille, c'est l'avoir rencontré ; être à 5 m de quelqu'un qui
// fabrique, c'est l'avoir vu faire. Le monde regarde une fois par seconde ; rien sur son terrain (on y est seul).

import type { Famille } from "../../commun/src/regles.ts";

/** À portée de voix, comme pour un échange (m). */
export const DISTANCE_RENCONTRE = 3;
/** Le temps passé côte à côte pour que ce soit une rencontre (s). */
export const DUREE_RENCONTRE_S = 60;
/** On voit faire à moins de 5 m (m). */
export const DISTANCE_VOIR_FAIRE = 5;

export interface Present {
  id: number;
  famille: Famille;
  /** Le lieu public où il est (null : sur son terrain, en route : il ne croise personne). */
  lieu: string | null;
  x: number;
  z: number;
}

const cle = (a: number, b: number) => (a < b ? `${a}:${b}` : `${b}:${a}`);

export class Rencontres {
  /** Le temps passé côte à côte, par paire de joueurs de familles différentes (s). */
  private readonly cote = new Map<string, number>();
  /** Les paires déjà rencontrées pendant leurs séances (on ne compte qu'une fois). */
  private readonly faites = new Set<string>();

  /**
   * Une fois par seconde (`dt` : les secondes écoulées). Renvoie les paires qui viennent de se rencontrer. Les paires
   * qui se sont éloignées (ou dont l'un est parti) sont oubliées : la mémoire reste petite.
   */
  verifier(presents: readonly Present[], dt: number): [Present, Present][] {
    const proches = new Set<string>();
    const nouvelles: [Present, Present][] = [];
    for (let i = 0; i < presents.length; i++) {
      const a = presents[i]!;
      if (!a.lieu) continue;
      for (let j = i + 1; j < presents.length; j++) {
        const b = presents[j]!;
        if (b.lieu !== a.lieu || b.famille === a.famille) continue;
        if (Math.hypot(a.x - b.x, a.z - b.z) > DISTANCE_RENCONTRE) continue;
        const k = cle(a.id, b.id);
        proches.add(k);
        if (this.faites.has(k)) continue;
        const t = (this.cote.get(k) ?? 0) + dt;
        if (t >= DUREE_RENCONTRE_S) {
          this.faites.add(k);
          this.cote.delete(k);
          nouvelles.push([a, b]);
        } else this.cote.set(k, t);
      }
    }
    for (const k of this.cote.keys()) if (!proches.has(k)) this.cote.delete(k);
    const ids = new Set(presents.map((p) => p.id));
    for (const k of this.faites) {
      const [a, b] = k.split(":").map(Number);
      if (!ids.has(a!) || !ids.has(b!)) this.faites.delete(k);
    }
    return nouvelles;
  }
}

/** Ceux qui voient faire l'auteur : dans le même lieu public, à moins de 5 m. */
export function temoins(auteur: Present, presents: readonly Present[]): Present[] {
  if (!auteur.lieu) return [];
  return presents.filter((p) => p.id !== auteur.id && p.lieu === auteur.lieu && Math.hypot(p.x - auteur.x, p.z - auteur.z) <= DISTANCE_VOIR_FAIRE);
}
