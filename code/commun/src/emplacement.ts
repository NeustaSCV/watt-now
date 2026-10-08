// Où peut-on construire ? La même règle pour le serveur (qui décide) et pour le client (le fantôme de pose
// vert ou rouge, 2026-10-08). On construit sur une grille de 50 cm, à portée de bras.

import { TERRAIN_TAILLE } from "./regles.ts";
import { RUINE, distanceMare } from "./terrain.ts";

/** Le pas de la grille de construction (m). */
export const GRILLE = 0.5;
/** On construit à portée : le fantôme ne s'éloigne pas plus du personnage (m). */
export const PORTEE_POSE = 3;

export function surLaGrille(v: number): number {
  return Math.round(v / GRILLE) * GRILLE;
}

interface Point {
  x: number;
  z: number;
}

/**
 * Pourquoi on ne peut pas construire ici (null : c'est possible). `genre` : un feu de camp, ou une installation.
 * Les escabeaux ne gênent pas : on les déplace.
 */
export function raisonEmplacement(
  genre: "feu" | "installation",
  x: number,
  z: number,
  joueur: Point,
  feux: Iterable<Point>,
  installations: Iterable<Point & { type: string }>,
): string | null {
  const bord = genre === "feu" ? 1 : 1.5;
  if (x < bord || z < bord || x > TERRAIN_TAILLE - bord || z > TERRAIN_TAILLE - bord) return "Pas ici : trop près du bord.";
  if (Math.hypot(x - joueur.x, z - joueur.z) > PORTEE_POSE) return "C'est trop loin : approche-toi.";
  if (distanceMare(x, z) < (genre === "feu" ? 1 : 1.5)) return "Pas les pieds dans l'eau.";
  if (genre === "installation" && Math.abs(x - RUINE.x) < RUINE.largeur / 2 + 0.5 && Math.abs(z - RUINE.z) < RUINE.profondeur / 2 + 0.5) return "Pas dans les ruines.";
  for (const f of feux) if (Math.hypot(f.x - x, f.z - z) < (genre === "feu" ? 2.5 : 2.2)) return genre === "feu" ? "Il y a déjà un feu tout près." : "Trop près d'un feu.";
  for (const i of installations) {
    if (i.type === "escabeau") continue;
    if (Math.hypot(i.x - x, i.z - z) < (genre === "feu" ? 2.2 : 2.4)) return genre === "feu" ? "Trop près d'une installation." : "Il y a déjà quelque chose ici.";
  }
  return null;
}
