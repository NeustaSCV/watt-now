// Les bords des lieux de la côte (0.10, R52 : « un lieu ne s'arrête jamais net ») : ce que la route du pont, la corniche
// et le Grand Hôtel posent autour de leur lot, en plus du modèle de la session « bâtiments ». Ici, les pièces communes :
//
// - la ganivelle (lattes de châtaignier tenues par deux fils, sur des piquets ; un peu de travers, quelques lattes
//   couchées), dans le style de celles des modèles ; posée sur la limite de la zone, en dehors de ce qu'on foule, elle
//   n'ajoute aucun obstacle (la limite existe déjà) ;
// - `lesBordsTouches` : les morceaux d'une limite qu'on touche vraiment à pied (ailleurs, un bâtiment, l'eau ou un quai
//   la cachent déjà) ;
// - `lanterneSurPanneau` : la lanterne des panneaux de sortie (rendu/lanterne-panneau.ts), accrochée en haut d'un
//   poteau rallongé, au-dessus du panneau, qui l'éclaire la nuit.
//
// Tout se pose dans un chantier du modèle (batiments/commun/atelier.js : `Chantier`, fusionné par matière) : un appel de
// dessin par matière, quel que soit le nombre de pièces.

import { heurte, type Zone } from "../../../commun/src/lieux.ts";
import { poserLanterne, type LanternePanneau } from "./lanterne-panneau.ts";
import type { SourceLumiere } from "./lumieres.ts";

/** Ce que ce module prend du chantier des modèles (batiments/commun/atelier.js). */
export interface ChantierModele {
  boite(l: number, h: number, p: number, couleur: number, pose?: Record<string, number | number[]>, mat?: unknown, options?: Record<string, unknown>): ChantierModele;
  poser(geo: unknown, mat: unknown, couleur: number, pose?: Record<string, number | number[]>, options?: Record<string, unknown>): ChantierModele;
  hasard(): number;
  entre(a: number, b: number): number;
  readonly vide: boolean;
  construire(): import("three").Group;
}

/** Un tirage reproductible (le même décor à chaque visite). */
export function hache(i: number, j: number): number {
  let h = Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export interface Segment {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
}

/** Les teintes de la ganivelle : le châtaignier grisé, le fil de fer. */
export const GANIVELLE = { bois: 0x8f8778, fil: 0x5a5048, pas: 0.18, hauteur: 1.1 } as const;

/**
 * Une ganivelle le long d'un segment (repère du chantier) : une latte tous les GANIVELLE.pas mètres, plus ou moins
 * ensablée (`ensable` : de combien le sable en mange le pied), deux fils. `garder(u)` : une latte à u mètres du début
 * est-elle posée ? (les morceaux qu'on ne touche pas, une brèche).
 */
export function ganivelle(c: ChantierModele, matBois: unknown, matFil: unknown, s: Segment, ensable = 0.3, garder: (u: number) => boolean = () => true, graine = 7): void {
  const L = Math.hypot(s.x2 - s.x1, s.z2 - s.z1);
  if (L < 0.2) return;
  const ry = -Math.atan2(s.z2 - s.z1, s.x2 - s.x1);
  const dx = (s.x2 - s.x1) / L;
  const dz = (s.z2 - s.z1) / L;
  // Les fils, par morceaux continus (là où les lattes sont posées).
  let debut: number | null = null;
  const fil = (u0: number, u1: number) => {
    if (u1 - u0 < 0.3) return;
    const m = (u0 + u1) / 2;
    for (const y of [0.3, 0.85]) c.boite(u1 - u0, 0.018, 0.018, GANIVELLE.fil, { x: s.x1 + dx * m, y: y - ensable * 0.3, z: s.z1 + dz * m, ry }, matFil, { crasse: false });
  };
  let k = 0;
  for (let u = 0.08; u < L; u += GANIVELLE.pas, k++) {
    if (!garder(u)) {
      if (debut !== null) fil(debut, u);
      debut = null;
      continue;
    }
    debut ??= u;
    if (hache(k, graine) < 0.08) continue; // une latte arrachée
    const couchee = hache(k, graine + 1) < 0.07;
    const h = GANIVELLE.hauteur - ensable * hache(k, graine + 2);
    const pose = { x: s.x1 + dx * u, y: h / 2 - ensable * 0.3, z: s.z1 + dz * u + (hache(k, graine + 3) - 0.5) * 0.05, ry, rz: (hache(k, graine + 4) - 0.5) * 0.1, rx: couchee ? 0.7 : (hache(k, graine + 5) - 0.5) * 0.12 };
    c.boite(0.05, h, 0.03, GANIVELLE.bois, pose, matBois, { nuance: 0.1, crasse: false });
    // Un piquet plus gros tous les 2,5 m environ.
    if (k % 14 === 0) c.boite(0.08, h + 0.15, 0.08, 0x7a6e5e, { x: pose.x, y: (h + 0.15) / 2 - ensable * 0.3, z: pose.z }, matBois, { nuance: 0.08 });
  }
  if (debut !== null) fil(debut, L);
}

/**
 * Le long d'une limite (un segment), les longueurs u où l'on touche la limite à pied : un point à `dedans` mètres de la
 * limite, vers l'intérieur de la zone, est libre, à `marge` mètres près le long de la limite (la ganivelle ne s'arrête pas
 * net devant un poteau). `interieur` : le pas vers l'intérieur de la zone (une unité).
 */
export function lesBordsTouches(zone: Zone, s: Segment, interieur: { x: number; z: number }, dedans = 0.9, marge = 2.5): (u: number) => boolean {
  const L = Math.hypot(s.x2 - s.x1, s.z2 - s.z1);
  const pas = 0.5;
  const libres: boolean[] = [];
  for (let u = 0; u <= L + pas; u += pas) {
    const t = Math.min(1, u / L);
    const x = s.x1 + (s.x2 - s.x1) * t + interieur.x * dedans;
    const z = s.z1 + (s.z2 - s.z1) * t + interieur.z * dedans;
    libres.push(x > zone.xMin && x < zone.xMax && z > zone.zMin && z < zone.zMax && !heurte(zone, x, z, 0.3));
  }
  const n = Math.ceil(marge / pas);
  return (u: number) => {
    const i = Math.round(u / pas);
    for (let j = Math.max(0, i - n); j <= Math.min(libres.length - 1, i + n); j++) if (libres[j]) return true;
    return false;
  };
}

/**
 * La lanterne d'un panneau de sortie (rendu/lanterne-panneau.ts), en haut de l'un de ses poteaux, rallongé au-dessus du
 * panneau ; la potence revient vers le milieu du panneau. `centre`, `ry` : le panneau (repère du jeu ; il regarde +z
 * tourné de ry) ; `ecart` : la distance du poteau au milieu ; `haut` : le haut du panneau ; `cote` : le poteau de
 * droite (+1) ou de gauche (−1). Le mât se pose dans le chantier ; la lanterne est un maillage à part.
 */
export function lanterneSurPanneau(c: ChantierModele, matMetal: unknown, couleur: number, centre: { x: number; z: number }, ry: number, ecart: number, haut: number, cote: 1 | -1 = 1): LanternePanneau {
  const px = centre.x + Math.cos(ry) * ecart * cote;
  const pz = centre.z - Math.sin(ry) * ecart * cote;
  const sommet = haut + 0.6;
  // Le poteau rallongé : un tube de fer jusqu'au-dessus du panneau.
  c.boite(0.07, sommet - haut + 0.3, 0.07, couleur, { x: px, y: haut - 0.3 + (sommet - haut + 0.3) / 2, z: pz, ry }, matMetal, { crasse: false });
  // La potence revient vers le milieu du panneau (le sens opposé au poteau, le long du panneau).
  const angle = Math.atan2(-Math.cos(ry) * cote, Math.sin(ry) * cote);
  return poserLanterne({ x: px, y: sommet, z: pz, angle, avance: Math.min(0.8, ecart * 0.6) });
}

/** La nuit, les lanternes des panneaux luisent et éclairent (leurs sources, pour la réserve de lumières) ; le jour, rien. */
export function lumieresLanternes(lanternes: readonly LanternePanneau[], nuit: boolean): SourceLumiere[] {
  for (const l of lanternes) l.allumer(nuit);
  return nuit ? lanternes.map((l) => l.source) : [];
}
