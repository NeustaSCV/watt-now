// Dormir dans l'abri (0.8.2, chantier I : R12) : le personnage dort sous la bâche, à sa couche. Vue d'en haut, la bâche
// le cacherait tout entier : tant qu'on dort dessous (ou qu'on s'y rend), elle s'efface en partie, comme les toits de la
// halte, pour qu'on voie le dormeur à sa place. Seule la bâche de cet abri-là (son matériau est copié à la première fois).

import * as THREE from "three";

/** Ce qui reste de la bâche quand on dort dessous. */
const FANTOME = 0.28;

/** Efface (ou rend) peu à peu la bâche d'un abri. `dessous` : le joueur dort dessous, ou s'y rend. */
export function estomperAbri(abri: THREE.Object3D, dessous: boolean, dt: number): void {
  const cible = dessous ? FANTOME : 1;
  const k = 1 - Math.exp(-dt * 6);
  abri.traverse((o) => {
    if (!o.userData.bache) return;
    const m = o as THREE.Mesh;
    let mat = m.userData.materiauPropre as THREE.MeshStandardMaterial | undefined;
    if (!mat) {
      if (!dessous) return;
      mat = (m.material as THREE.MeshStandardMaterial).clone();
      mat.transparent = true;
      m.userData.materiauPropre = mat;
      m.material = mat;
    }
    let f = mat.opacity + (cible - mat.opacity) * k;
    if (Math.abs(f - cible) < 0.02) f = cible;
    mat.opacity = f;
    mat.depthWrite = f >= 1;
    // L'ombre de la bâche reste : on dort à l'abri du soleil comme de la pluie.
  });
}
