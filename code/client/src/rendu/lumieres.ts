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
  /** Décroissance avec la distance (2 par défaut, physique ; 1 : une lumière qui porte plus loin, plus égale). */
  decroissance?: number;
}

export class ReserveLumieres {
  private readonly lumieres: THREE.PointLight[] = [];
  private temps = 0;

  /**
   * `ombre` : taille de la carte d'ombre de la première lumière (la plus proche du point regardé, donc la lampe qu'on
   * porte), 0 pour aucune. L'ombre est créée une fois (pas de recompilation) et ne se calcule que si on la demande.
   */
  constructor(scene: THREE.Scene, nombre: number, ombre = 0) {
    for (let i = 0; i < nombre; i++) {
      const l = new THREE.PointLight(0xffffff, 0, 10, 2);
      l.castShadow = i === 0 && ombre > 0;
      if (l.castShadow) {
        l.shadow.mapSize.set(ombre, ombre);
        l.shadow.bias = -0.004;
        l.shadow.camera.near = 0.3;
        l.shadow.autoUpdate = false;
      }
      scene.add(l);
      this.lumieres.push(l);
    }
  }

  /** Attribue les lumières aux sources les plus proches du point regardé. */
  /** `ombre` : la première lumière projette son ombre (la nuit, dans une pièce noire), si elle en a une. */
  mettreAJour(sources: SourceLumiere[], centre: THREE.Vector3, dt: number, ombre = false): void {
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
      l.decay = s.decroissance ?? 2;
    });
    const premiere = this.lumieres[0];
    if (premiere?.castShadow) {
      // Sans ombre demandée, la carte n'est plus recalculée : de jour, dehors, la lampe ne se voit presque pas.
      // (La carte doit exister : sans elle, le nuanceur lit une texture du mauvais format. On la calcule donc au
      // moins une fois, à la première image.)
      premiere.shadow.autoUpdate = (ombre && premiere.intensity > 0) || premiere.shadow.map === null;
    }
  }
}
