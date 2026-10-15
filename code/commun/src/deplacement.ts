// Déplacement d'un personnage. La même fonction tourne sur le serveur (qui fait autorité)
// et sur le client (qui prédit, pour que le mouvement soit immédiat à l'écran).

import { ZONE_TERRAIN, heurte, type Zone } from "./lieux.ts";
import { ALLURES, estAllure, type Allure } from "./regles.ts";
import { freinMare } from "./terrain.ts";

export interface Position {
  x: number;
  z: number;
  /** Orientation en radians : 0 regarde vers +z. */
  o: number;
}

export interface Intention {
  /** Direction voulue dans le monde, de longueur ≤ 1. */
  dx: number;
  dz: number;
  allure: Allure;
}

export const INTENTION_REPOS: Intention = { dx: 0, dz: 0, allure: "marche" };

const SEUIL_MOUVEMENT = 0.01;

function borner(valeur: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valeur));
}

/** Renvoie une intention sûre à partir de données venues du réseau, ou null si elles sont invalides. */
export function nettoyerIntention(brut: unknown): Intention | null {
  if (typeof brut !== "object" || brut === null) return null;
  const { dx, dz, allure } = brut as Record<string, unknown>;
  if (typeof dx !== "number" || typeof dz !== "number") return null;
  if (!Number.isFinite(dx) || !Number.isFinite(dz)) return null;
  if (!estAllure(allure)) return null;
  const longueur = Math.hypot(dx, dz);
  if (longueur > 1) return { dx: dx / longueur, dz: dz / longueur, allure };
  return { dx, dz, allure };
}

/** Rayon du personnage pour les collisions, en mètres. */
const RAYON = 0.35;

function bloque(x: number, z: number, zone: Zone): boolean {
  return heurte(zone, x, z, RAYON);
}

/**
 * Fait avancer une position pendant `dt` secondes selon une intention, dans les limites d'une zone.
 * Contre un obstacle, on glisse le long (un axe à la fois). Ne modifie pas l'entrée.
 */
export function avancer(position: Position, intention: Intention, dt: number, zone: Zone = ZONE_TERRAIN): Position {
  const longueur = Math.hypot(intention.dx, intention.dz);
  if (longueur < SEUIL_MOUVEMENT || dt <= 0) return position;

  const facteur = longueur > 1 ? 1 / longueur : 1;
  const dx = intention.dx * facteur;
  const dz = intention.dz * facteur;
  // Dans la mare du terrain, l'eau freine le pas (0.8.2, R21 : on y entre pour remplir la gourde au milieu). Ailleurs, ce
  // que la zone freine (l'eau de la crique du phare, 0.10) : on y marche, on n'y court pas.
  const frein = zone.frein?.(position.x, position.z) ?? 1;
  const allure = frein < 1 && intention.allure === "course" ? "marche" : intention.allure;
  const vitesse = ALLURES[allure] * (zone === ZONE_TERRAIN ? freinMare(position.x, position.z) : 1) * frein;

  let x = borner(position.x + dx * vitesse * dt, zone.xMin, zone.xMax);
  let z = borner(position.z + dz * vitesse * dt, zone.zMin, zone.zMax);
  if (bloque(x, z, zone)) {
    if (!bloque(x, position.z, zone)) z = position.z;
    else if (!bloque(position.x, z, zone)) x = position.x;
    else {
      x = position.x;
      z = position.z;
    }
  }
  return { x, z, o: Math.atan2(dx, dz) };
}
