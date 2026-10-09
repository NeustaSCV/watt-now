// La pluie (Book 13, É5) : des traits fins qui tombent en biais autour de ce que regarde la caméra.
// Un seul maillage de segments, déplacé avec la caméra : léger, même sur iPhone 13.

import * as THREE from "three";

const ETENDUE = 34;
const HAUTEUR = 16;
const VITESSE = 17;
/** Le vent pousse les gouttes un peu de côté. */
const VENT = new THREE.Vector3(-0.22, -1, 0.12).normalize();
const LONGUEUR = 0.55;

export class Pluie {
  private readonly segments: THREE.LineSegments;
  private readonly depart: Float32Array;
  private readonly materiau: THREE.LineBasicMaterial;

  constructor(scene: THREE.Scene, nombre: number) {
    const positions = new Float32Array(nombre * 6);
    this.depart = new Float32Array(nombre * 3);
    for (let i = 0; i < nombre; i++) {
      this.depart[i * 3] = (Math.random() - 0.5) * ETENDUE;
      this.depart[i * 3 + 1] = Math.random() * HAUTEUR;
      this.depart[i * 3 + 2] = (Math.random() - 0.5) * ETENDUE;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.materiau = new THREE.LineBasicMaterial({ color: 0xc6d3dc, transparent: true, opacity: 0, depthWrite: false });
    this.segments = new THREE.LineSegments(geo, this.materiau);
    this.segments.frustumCulled = false;
    this.segments.visible = false;
    this.segments.userData.poste = "pluie";
    scene.add(this.segments);
  }

  /** `force` : 0 (pas de pluie) à 1 ; `centre` : ce que regarde la caméra. */
  animer(dt: number, force: number, centre: THREE.Vector3, nuit: number): void {
    this.segments.visible = force > 0.02;
    if (!this.segments.visible) return;
    this.materiau.opacity = force * (0.42 - nuit * 0.18);
    const pos = this.segments.geometry.attributes.position as THREE.BufferAttribute;
    const p = pos.array as Float32Array;
    for (let i = 0; i < this.depart.length / 3; i++) {
      let y = this.depart[i * 3 + 1]! - VITESSE * dt;
      if (y < 0) y += HAUTEUR;
      this.depart[i * 3 + 1] = y;
      const x = centre.x + this.depart[i * 3]! + VENT.x * (HAUTEUR - y) * 0.4;
      const z = centre.z + this.depart[i * 3 + 2]! + VENT.z * (HAUTEUR - y) * 0.4;
      p[i * 6] = x;
      p[i * 6 + 1] = y;
      p[i * 6 + 2] = z;
      p[i * 6 + 3] = x + VENT.x * LONGUEUR;
      p[i * 6 + 4] = y + VENT.y * LONGUEUR;
      p[i * 6 + 5] = z + VENT.z * LONGUEUR;
    }
    pos.needsUpdate = true;
  }
}
