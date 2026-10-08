// Les ressources nombreuses et identiques (branches, bûches, pierres) dessinées en lots (2026-10-08) : un seul appel
// de dessin pour toutes les pierres du terrain, au lieu d'un par pierre (et autant pour leurs ombres). L'image ne
// change pas : chaque ressource garde sa place, sa taille, sa rotation ; ramassée, elle disparaît de son lot.

import * as THREE from "three";
import type { VueRessource } from "./ressources.ts";

interface Place {
  maillage: THREE.InstancedMesh;
  index: number;
  matrice: THREE.Matrix4;
}

const RIEN = new THREE.Matrix4().makeScale(0, 0, 0);

export class Lots {
  readonly groupe = new THREE.Group();
  private entrees: { cle: string; geometrie: THREE.BufferGeometry; materiau: THREE.Material; ombre: boolean; matrice: THREE.Matrix4; vue: VueRessource }[] = [];
  private readonly places = new Map<VueRessource, Place[]>();

  /** Prend les maillages d'une ressource (elle ne garde que sa place et ses données). */
  prendre(vue: VueRessource): void {
    vue.objet.updateMatrixWorld(true);
    for (const enfant of [...vue.objet.children]) {
      const m = enfant as THREE.Mesh;
      if (!m.isMesh || Array.isArray(m.material)) continue;
      this.entrees.push({
        cle: `${m.geometry.uuid}|${(m.material as THREE.Material).uuid}|${m.castShadow}`,
        geometrie: m.geometry,
        materiau: m.material as THREE.Material,
        ombre: m.castShadow,
        matrice: m.matrixWorld.clone(),
        vue,
      });
      vue.objet.remove(m);
    }
    vue.surVisibilite = (visible) => this.montrer(vue, visible);
  }

  /** Construit les lots, une fois toutes les ressources prises. */
  construire(): void {
    const parCle = new Map<string, typeof this.entrees>();
    for (const e of this.entrees) {
      const l = parCle.get(e.cle) ?? [];
      l.push(e);
      parCle.set(e.cle, l);
    }
    for (const liste of parCle.values()) {
      const premiere = liste[0]!;
      const maillage = new THREE.InstancedMesh(premiere.geometrie, premiere.materiau, liste.length);
      maillage.castShadow = premiere.ombre;
      maillage.receiveShadow = true;
      liste.forEach((e, index) => {
        maillage.setMatrixAt(index, e.vue.objet.visible ? e.matrice : RIEN);
        const places = this.places.get(e.vue) ?? [];
        places.push({ maillage, index, matrice: e.matrice });
        this.places.set(e.vue, places);
      });
      maillage.computeBoundingSphere();
      this.groupe.add(maillage);
    }
    this.entrees = [];
  }

  private montrer(vue: VueRessource, visible: boolean): void {
    for (const p of this.places.get(vue) ?? []) {
      p.maillage.setMatrixAt(p.index, visible ? p.matrice : RIEN);
      p.maillage.instanceMatrix.needsUpdate = true;
    }
  }

  vider(): void {
    this.groupe.clear();
    this.places.clear();
    this.entrees = [];
  }
}
