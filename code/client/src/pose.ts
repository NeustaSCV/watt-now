// Choisir où l'on construit (2026-10-08, ergonomie revue pour la 0.3, Book 10 §7.1) : après « Construire », un
// fantôme de l'installation (ou du feu) apparaît devant le personnage. Pendant la pose, le personnage ne bouge plus :
// c'est le fantôme qui bouge, et lui seul.
// - Clavier et joystick le déplacent ; un clic (ou un appui du doigt) au sol l'y amène ; un nouveau clic dessus construit.
// - Bouger la souris ne le déplace pas : on peut aller cliquer sur les boutons du bandeau sans rien déranger.
// - Molette ou touche de lumière : un quart de tour. Clic droit ou Échap : annuler.
// Il se cale sur la grille de 50 cm, reste à portée (un cercle pointillé la montre), et son empreinte dit si l'on
// peut construire là (vert) ou non (rouge, avec la raison).
// Plus tard : un vrai mode construction, pour déplacer les constructions et poser des murs (Book 10 §7).

import * as THREE from "three";
import type { Position } from "../../commun/src/deplacement.ts";
import { PORTEE_POSE, surLaGrille } from "../../commun/src/emplacement.ts";
import type { Recette } from "../../commun/src/recettes.ts";

export type GenrePose = "feu" | "installation";

const VERT = new THREE.Color(0x6fd18a);
const ROUGE = new THREE.Color(0xe0574a);

/** Un feu de camp en devenir : un cercle de pierres et trois branches (un foyer Dakota : un trou, sans pierres). */
export function fantomeFeu(dakota = false): THREE.Group {
  const g = new THREE.Group();
  if (dakota) {
    const trou = new THREE.Mesh(new THREE.CircleGeometry(0.28, 16).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2e2018 }));
    trou.position.y = 0.02;
    const event = new THREE.Mesh(new THREE.CircleGeometry(0.14, 12).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2e2018 }));
    event.position.set(0, 0.02, 0.6);
    g.add(trou, event);
    return g;
  }
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
  actif: { genre: GenrePose; recette: Recette | null; dakota?: boolean } | null = null;
  /** La place sur la grille. */
  x = 0;
  z = 0;
  /** Orientation de la construction (radians), par quarts de tour. */
  o = 0;
  /** Pourquoi on ne peut pas construire ici (null : on peut). */
  raison: string | null = null;
  /** Un clic sur le fantôme déjà placé : construire (le jeu le lit et le remet à false). */
  confirme = false;
  /** La place voulue, avant la grille (le clavier la déplace en douceur). */
  private cx = 0;
  private cz = 0;
  private fantome: THREE.Object3D | null = null;
  private readonly empreinte: THREE.Mesh;
  private readonly materiauEmpreinte = new THREE.MeshBasicMaterial({ color: VERT, transparent: true, opacity: 0.35, depthWrite: false });
  /** Le cercle de portée, autour du personnage. */
  private readonly portee: THREE.LineLoop;
  private readonly rayon = new THREE.Raycaster();
  private readonly sol = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private camera: THREE.Camera | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.empreinte = new THREE.Mesh(new THREE.CircleGeometry(1, 32).rotateX(-Math.PI / 2), this.materiauEmpreinte);
    this.empreinte.position.y = 0.03;
    this.groupe.add(this.empreinte);
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < 64; i++) points.push(new THREE.Vector3(Math.cos((i / 64) * Math.PI * 2) * PORTEE_POSE, 0.04, Math.sin((i / 64) * Math.PI * 2) * PORTEE_POSE));
    this.portee = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineDashedMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, dashSize: 0.25, gapSize: 0.18 }));
    this.portee.computeLineDistances();
    this.portee.visible = false;
    this.groupe.visible = false;

    // Pendant la pose, un clic (ou un appui du doigt) sur le sol est pour le fantôme, pas pour le jeu : on le prend
    // avant les entrées (phase de capture) et on l'arrête là.
    canvas.addEventListener(
      "pointerdown",
      (e) => {
        if (!this.actif || !this.camera) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.stopImmediatePropagation();
        e.preventDefault();
        const r = canvas.getBoundingClientRect();
        const ecran = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        this.rayon.setFromCamera(ecran, this.camera);
        const p = this.rayon.ray.intersectPlane(this.sol, new THREE.Vector3());
        if (!p) return;
        // Sur le fantôme déjà là : on construit. Ailleurs : il y va.
        if (Math.hypot(p.x - this.x, p.z - this.z) < 0.7) this.confirme = true;
        else this.allerA(p.x, p.z);
      },
      { capture: true },
    );
    // La molette tourne le fantôme d'un quart de tour.
    canvas.addEventListener(
      "wheel",
      (e) => {
        if (!this.actif) return;
        e.preventDefault();
        this.tourner(e.deltaY > 0 ? 1 : -1);
      },
      { passive: false },
    );
  }

  demarrer(genre: GenrePose, recette: Recette | null, modele: THREE.Object3D, rayonEmpreinte: number, dakota = false, joueur?: Position, camera?: THREE.Camera): void {
    this.arreter();
    this.actif = { genre, recette, ...(dakota ? { dakota } : {}) };
    this.confirme = false;
    if (camera) this.camera = camera;
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
    this.portee.visible = true;
    // Il apparaît devant le personnage.
    if (joueur) {
      this.cx = joueur.x + Math.sin(joueur.o) * 1.8;
      this.cz = joueur.z + Math.cos(joueur.o) * 1.8;
    }
  }

  /** Un quart de tour (la plupart des installations ont un devant). */
  tourner(sens = 1): void {
    this.o = (((this.o + (sens * Math.PI) / 2) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  }

  /** Amène le fantôme à cet endroit (dans la limite de la portée). */
  allerA(x: number, z: number): void {
    this.cx = x;
    this.cz = z;
  }

  /** Le clavier ou le joystick le pousse : (dx, dz) dans le monde, de longueur ≤ 1. */
  pousser(dx: number, dz: number, dt: number): void {
    const VITESSE = 2.5;
    this.cx += dx * VITESSE * dt;
    this.cz += dz * VITESSE * dt;
  }

  arreter(): void {
    if (this.fantome) this.groupe.remove(this.fantome);
    this.fantome = null;
    this.actif = null;
    this.confirme = false;
    this.groupe.visible = false;
    this.portee.visible = false;
  }

  /** Le cercle de portée, à ajouter à la scène (il suit le personnage, pas le fantôme). */
  get cerclePortee(): THREE.Object3D {
    return this.portee;
  }

  /**
   * Cale le fantôme : à portée du personnage, sur la grille. `verifier` dit pourquoi on ne pourrait pas construire là
   * (la même règle que le serveur).
   */
  placer(joueur: Position, camera: THREE.Camera, verifier: (x: number, z: number) => string | null): void {
    if (!this.actif) return;
    this.camera = camera;
    const dx = this.cx - joueur.x;
    const dz = this.cz - joueur.z;
    const d = Math.hypot(dx, dz);
    const max = PORTEE_POSE - 0.3;
    if (d > max) {
      this.cx = joueur.x + (dx / d) * max;
      this.cz = joueur.z + (dz / d) * max;
    }
    this.x = surLaGrille(this.cx);
    this.z = surLaGrille(this.cz);
    this.raison = verifier(this.x, this.z);
    this.groupe.position.set(this.x, 0, this.z);
    this.portee.position.set(joueur.x, 0, joueur.z);
    if (this.fantome) this.fantome.rotation.y = this.o;
    this.materiauEmpreinte.color.copy(this.raison ? ROUGE : VERT);
  }
}
