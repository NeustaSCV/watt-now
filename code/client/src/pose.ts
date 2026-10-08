// Choisir où l'on construit (2026-10-08) : après « Construire », un fantôme de l'installation (ou du feu de camp)
// suit la souris, ou se tient devant le personnage sur téléphone. Il se cale sur la grille de 50 cm, reste à portée
// de bras, et son empreinte au sol dit si l'on peut construire là (vert) ou non (rouge, avec la raison).
// Plus tard : un vrai mode construction, pour déplacer les constructions et poser des murs (Book 10 §7).

import * as THREE from "three";
import type { Position } from "../../commun/src/deplacement.ts";
import { PORTEE_POSE, surLaGrille } from "../../commun/src/emplacement.ts";
import type { Recette } from "../../commun/src/recettes.ts";

export type GenrePose = "feu" | "installation";

const VERT = new THREE.Color(0x6fd18a);
const ROUGE = new THREE.Color(0xe0574a);

/** Un feu de camp en devenir : un cercle de pierres et trois branches. */
export function fantomeFeu(): THREE.Group {
  const g = new THREE.Group();
  const pierre = new THREE.DodecahedronGeometry(0.13, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x8f8a80, flatShading: true });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const p = new THREE.Mesh(pierre, mat);
    p.position.set(Math.cos(a) * 0.45, 0.08, Math.sin(a) * 0.45);
    g.add(p);
  }
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.7, 5), new THREE.MeshStandardMaterial({ color: 0x5a4130, flatShading: true }));
    b.rotation.set(Math.PI / 2 - 0.5, (i / 3) * Math.PI * 2, 0);
    b.position.y = 0.18;
    g.add(b);
  }
  return g;
}

export class ModePose {
  readonly groupe = new THREE.Group();
  /** Ce qu'on pose : un feu de camp, ou l'installation d'une recette. */
  actif: { genre: GenrePose; recette: Recette | null } | null = null;
  x = 0;
  z = 0;
  /** Orientation de la construction (radians), par quarts de tour. */
  o = 0;
  /** Pourquoi on ne peut pas construire ici (null : on peut). */
  raison: string | null = null;
  private fantome: THREE.Object3D | null = null;
  private readonly empreinte: THREE.Mesh;
  private readonly materiauEmpreinte = new THREE.MeshBasicMaterial({ color: VERT, transparent: true, opacity: 0.35, depthWrite: false });
  /** La souris sur le sol (coordonnées normalisées de l'écran), si elle a bougé il y a peu. */
  private souris: THREE.Vector2 | null = null;
  private readonly rayon = new THREE.Raycaster();
  private readonly sol = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  constructor(canvas: HTMLCanvasElement) {
    this.empreinte = new THREE.Mesh(new THREE.CircleGeometry(1, 32).rotateX(-Math.PI / 2), this.materiauEmpreinte);
    this.empreinte.position.y = 0.03;
    this.groupe.add(this.empreinte);
    this.groupe.visible = false;
    // La souris seulement : au doigt, le fantôme se tient devant le personnage (on le déplace en marchant).
    canvas.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = canvas.getBoundingClientRect();
      this.souris = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    });
  }

  demarrer(genre: GenrePose, recette: Recette | null, modele: THREE.Object3D, rayonEmpreinte: number): void {
    this.arreter();
    this.actif = { genre, recette };
    // Le fantôme : le vrai modèle, en transparence.
    modele.traverse((n) => {
      const m = n as THREE.Mesh;
      if (!m.isMesh) return;
      const materiaux = (Array.isArray(m.material) ? m.material : [m.material]).map((mat) => {
        const c = mat.clone();
        c.transparent = true;
        c.opacity = 0.55;
        c.depthWrite = false;
        return c;
      });
      m.material = Array.isArray(m.material) ? materiaux : materiaux[0]!;
      m.castShadow = false;
    });
    this.fantome = modele;
    this.groupe.add(modele);
    this.empreinte.scale.setScalar(rayonEmpreinte);
    this.groupe.visible = true;
  }

  /** Un quart de tour (la plupart des installations ont un devant). */
  tourner(): void {
    this.o = (this.o + Math.PI / 2) % (Math.PI * 2);
  }

  arreter(): void {
    if (this.fantome) this.groupe.remove(this.fantome);
    this.fantome = null;
    this.actif = null;
    this.groupe.visible = false;
  }

  /**
   * Place le fantôme : sous la souris (à portée de bras), sinon devant le personnage ; puis sur la grille.
   * `verifier` dit pourquoi on ne pourrait pas construire là (la même règle que le serveur).
   */
  placer(joueur: Position, camera: THREE.Camera, verifier: (x: number, z: number) => string | null): void {
    if (!this.actif) return;
    let x = joueur.x + Math.sin(joueur.o) * 1.8;
    let z = joueur.z + Math.cos(joueur.o) * 1.8;
    if (this.souris) {
      this.rayon.setFromCamera(this.souris, camera);
      const p = this.rayon.ray.intersectPlane(this.sol, new THREE.Vector3());
      if (p) {
        x = p.x;
        z = p.z;
      }
    }
    // À portée de bras : au-delà, le fantôme reste au bout du bras, dans la direction visée.
    const dx = x - joueur.x;
    const dz = z - joueur.z;
    const d = Math.hypot(dx, dz);
    const max = PORTEE_POSE - 0.3;
    if (d > max) {
      x = joueur.x + (dx / d) * max;
      z = joueur.z + (dz / d) * max;
    }
    this.x = surLaGrille(x);
    this.z = surLaGrille(z);
    this.raison = verifier(this.x, this.z);
    this.groupe.position.set(this.x, 0, this.z);
    if (this.fantome) this.fantome.rotation.y = this.o;
    this.materiauEmpreinte.color.copy(this.raison ? ROUGE : VERT);
  }
}
