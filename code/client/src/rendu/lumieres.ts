// La réserve de lumières (Book 21 §5.3.3) : un nombre fixe de lumières ponctuelles, créées une fois,
// qu'on attribue chaque image aux sources les plus proches. On n'en crée jamais en cours de jeu :
// pas de recompilation des shaders, donc pas de saccade.

import * as THREE from "three";

export interface SourceLumiere {
  x: number;
  y: number;
  z: number;
  couleur: number;
  /** Intensité de base (en candelas pour Three.js). */
  intensite: number;
  /** Portée, en mètres. */
  portee: number;
  /** 0 : stable ; 1 : vacille comme une flamme. */
  vacillement: number;
}

export class ReserveLumieres {
  private readonly lumieres: THREE.PointLight[] = [];
  private temps = 0;

  constructor(scene: THREE.Scene, nombre: number) {
    for (let i = 0; i < nombre; i++) {
      const l = new THREE.PointLight(0xffffff, 0, 10, 2);
      l.castShadow = false;
      scene.add(l);
      this.lumieres.push(l);
    }
  }

  /** Attribue les lumières aux sources les plus proches du point regardé. */
  mettreAJour(sources: SourceLumiere[], centre: THREE.Vector3, dt: number): void {
    this.temps += dt;
    const triees = [...sources].sort((s1, s2) => Math.hypot(s1.x - centre.x, s1.z - centre.z) - Math.hypot(s2.x - centre.x, s2.z - centre.z));
    this.lumieres.forEach((l, i) => {
      const s = triees[i];
      if (!s) {
        l.intensity = 0;
        return;
      }
      const flamme = s.vacillement
        ? 1 + s.vacillement * (Math.sin(this.temps * 13 + i * 2.1) * 0.08 + Math.sin(this.temps * 7.3 + i) * 0.06 + Math.sin(this.temps * 23 + i * 5) * 0.04)
        : 1;
      l.position.set(s.x, s.y, s.z);
      l.color.setHex(s.couleur);
      l.intensity = s.intensite * flamme;
      l.distance = s.portee;
    });
  }
}
