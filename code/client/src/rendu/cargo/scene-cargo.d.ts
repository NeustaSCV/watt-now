// Types de la scène du cargo (scene-cargo.js : le code de la maquette validée, gardé en JavaScript).

import type * as THREE from "three";

/** Le minutage de la scène, en secondes depuis son début (client/src/phare-scene.ts, SCENE_CARGO). */
export interface MinutageCargo {
  noirDebut: number;
  noir: number;
  ouvert: number;
  corne: number;
  choc: number;
  cassure: number;
  repos: number;
  noirFin: number;
  retour: number;
  jeu: number;
  fin: number;
}

/** Les instants des sons de la scène (son.js). */
export interface EvenementsCargo {
  corne: number;
  apparition: number;
  choc: number;
  cassure: number;
  plouf: number[];
  clang: number[];
  grincement: number;
  fin: number;
}

export interface SceneCargo {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  /** Le cargo animé (cargo.js) : ses deux moitiés, ses conteneurs qui tombent, ses feux. */
  readonly cargo: { racine: THREE.Group; avant: THREE.Group; arriere: THREE.Group; chutes: { objet: THREE.Object3D }[] };
  /** Pose tout à l'instant `t` (s), sans dessiner (la caméra pour une image de `w` × `h`). */
  poser(t: number, w: number, h: number, hauteurPixels?: number): void;
  rendre(rendu: THREE.WebGLRenderer, t: number): void;
  compiler(rendu: THREE.WebGLRenderer): Promise<unknown>;
  liberer(): void;
  evenements(): EvenementsCargo;
  /** Le dernier rendu : appels de dessin, triangles, temps du processeur (ms). */
  readonly mesure: { appels: number; triangles: number; ms: number };
}

export function creerSceneCargo(T: MinutageCargo, options?: { secousse?: () => boolean }): SceneCargo;
