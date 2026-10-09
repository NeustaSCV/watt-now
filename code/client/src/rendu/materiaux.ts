// Le matériau maison (Book 21 §5.3.3) : tous les modèles, libres ou faits pour le jeu, passent par ici.
// En É0, c'est un matériau standard de Three.js à facettes, partagé par couleur.
// Plus tard : atlas de palette, émission, masque de salissure, teinte de nuit, au même endroit.

import * as THREE from "three";

/** Palette indicative du Book 21 §5.3.1, à caler sur planche. */
export const PALETTE = {
  herbe: 0x7fa35a,
  herbeSombre: 0x5f7f45,
  herbeSeche: 0x9aa65e,
  terre: 0x9c7a55,
  terreSombre: 0x7d6143,
  rouille: 0xa4552f,
  bois: 0x7a5a3c,
  boisSombre: 0x5a4130,
  feuillage: 0x5d8a46,
  feuillageSombre: 0x3f6b3a,
  feuillageClair: 0x7da150,
  pierre: 0x8f8a80,
  pierreSombre: 0x6e6a63,
  peau: [0xe8c4a0, 0xc68e64, 0x8d5a3b] as const,
  cuir: 0x6b4a32,
  laiton: 0xb59048,
  bleuTravail: 0x3b5a8c,
  jauneReflechissant: 0xd8c43a,
  paille: 0xd9bf6e,
  vertLaine: 0x6f8b4e,
  toileEcrue: 0xd8ccb0,
  ciel: 0xc9d8e4,
  brume: 0xd6dccf,
} as const;

const cache = new Map<string, THREE.MeshStandardMaterial>();

export interface OptionsMateriau {
  rugosite?: number;
  metal?: number;
  emission?: number;
  intensiteEmission?: number;
}

export function materiau(couleur: number, options: OptionsMateriau = {}): THREE.MeshStandardMaterial {
  const cle = `${couleur}|${options.rugosite ?? 0.9}|${options.metal ?? 0}|${options.emission ?? 0}|${options.intensiteEmission ?? 0}`;
  let m = cache.get(cle);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color: couleur,
      roughness: options.rugosite ?? 0.9,
      metalness: options.metal ?? 0,
      flatShading: true,
      emissive: options.emission ?? 0x000000,
      emissiveIntensity: options.intensiteEmission ?? 0,
    });
    cache.set(cle, m);
  }
  return m;
}

/** Générateur pseudo-aléatoire déterministe : le même terrain à chaque chargement. */
/**
 * Nomme les enfants d'un décor, dans l'ordre où ils ont été ajoutés (sans écraser un nom déjà donné). Le mode mesure
 * (`?mesure=1`) s'en sert pour ranger les appels de dessin par morceau (sol, herbe, lisière, bâtiments…).
 */
export function nommer(groupe: THREE.Object3D, noms: string[]): void {
  noms.forEach((nom, i) => {
    const enfant = groupe.children[i];
    if (enfant && !enfant.name) enfant.name = nom;
  });
}

export function aleatoire(graine: number): () => number {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
