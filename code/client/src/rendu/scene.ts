// La scène 3D : rendu, caméra isométrique orthographique, lumière du petit matin.
// Règles du Book 21 §5.3 : 1 unité = 1 m, ≈ 20 m de large à l'écran, un soleil et une seule carte d'ombre.

import * as THREE from "three";
import { Ciel } from "./ciel.ts";
import { ReserveLumieres, type SourceLumiere } from "./lumieres.ts";
import { PALETTE } from "./materiaux.ts";
import { FrustumOmbre } from "./ombres.ts";
import type { Qualite } from "./qualite.ts";

/** Élévation isométrique « vraie » : arctan(1/√2) ≈ 35,26°. */
const ELEVATION = Math.atan(1 / Math.SQRT2);
const DISTANCE_CAMERA = 60;
/** Demi-largeur visible au zoom par défaut, en mètres (≈ 20 m de large en paysage). */
const DEMI_LARGEUR = 10;
const ZOOM_MIN = 0.6;
const ZOOM_MAX = 1.7;

export class Scene {
  readonly rendu: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  private readonly soleil: THREE.DirectionalLight;
  readonly ciel: Ciel;
  private readonly lumieres: ReserveLumieres;
  /** La passe d'ombre du soleil n'écarte que les objets dont l'ombre ne peut pas tomber à l'écran (ombres.ts). */
  readonly frustumOmbre: FrustumOmbre | null = null;
  private readonly cible = new THREE.Vector3(25, 0, 25);
  /** Orientation de la caméra autour du joueur, par quarts de tour. */
  private quartDeTour = 0;
  private lacet = Math.PI / 4;
  private zoom = 1;
  /** La pièce noire où l'on est (Book 23 §4.5) : l'obscurité locale y monte, en fondu. */
  private pieceNoireVisee = false;
  /** Mode photo : un angle de caméra libre (en radians), ou null pour suivre les quarts de tour. */
  lacetLibre: number | null = null;
  /** Le dézoom le plus large (le mode `?obstacles=1` le pousse, pour voir un lieu en entier). */
  zoomMax = ZOOM_MAX;
  /** Le mode `?obstacles=ensemble` : la caméra regarde ce point (le centre du lieu) au lieu du personnage. */
  cibleForcee: { x: number; z: number } | null = null;

  constructor(canvas: HTMLCanvasElement, qualite: Qualite) {
    this.rendu = new THREE.WebGLRenderer({ canvas, antialias: qualite.anticrenelage, powerPreference: "high-performance" });
    this.rendu.setPixelRatio(Math.min(window.devicePixelRatio, qualite.rapportPixelsMax));
    this.rendu.outputColorSpace = THREE.SRGBColorSpace;
    this.rendu.toneMapping = THREE.ACESFilmicToneMapping;
    this.rendu.toneMappingExposure = 1.05;
    this.rendu.shadowMap.enabled = qualite.ombres;
    this.rendu.shadowMap.type = THREE.PCFShadowMap;

    this.scene.background = new THREE.Color(PALETTE.ciel);
    // La caméra est à 60 m : le brouillard ne touche que la lisière lointaine.
    this.scene.fog = new THREE.Fog(PALETTE.brume, 80, 135);

    // Petit matin (moment-vitrine n° 3, Book 21 §5.1.2) : lumière rasante et dorée, ombres longues.
    const hemi = new THREE.HemisphereLight(0xdfe8f0, 0x4d5a3a, 1.15);
    this.scene.add(hemi);
    this.soleil = new THREE.DirectionalLight(0xffdcae, 2.6);
    this.soleil.castShadow = qualite.ombres;
    if (qualite.ombres) {
      this.soleil.shadow.mapSize.set(qualite.tailleCarteOmbre, qualite.tailleCarteOmbre);
      const c = this.soleil.shadow.camera;
      c.left = -24;
      c.right = 24;
      c.top = 24;
      c.bottom = -24;
      c.near = 1;
      c.far = 90;
      this.soleil.shadow.bias = -0.0006;
      this.soleil.shadow.normalBias = 0.03;
      this.frustumOmbre = new FrustumOmbre();
      // three.js range les objets de la passe d'ombre avec ce frustum (LightShadow.getFrustum).
      (this.soleil.shadow as unknown as { _frustum: THREE.Frustum })._frustum = this.frustumOmbre;
    }
    this.scene.add(this.soleil, this.soleil.target);
    this.ciel = new Ciel(this.scene, this.rendu, hemi, this.soleil);
    // Réserve fixe de lumières : 4 sur mobile, 8 sur ordinateur (Book 21 §5.3.3).
    // En qualité haute seulement, la lumière la plus proche (la lampe qu'on porte) projette une ombre, dans le noir.
    this.lumieres = new ReserveLumieres(this.scene, qualite.niveau === "haut" ? 8 : 4, qualite.niveau === "haut" && qualite.ombres ? 512 : 0);

    window.addEventListener("resize", () => this.redimensionner());
    canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        this.zoom = Math.min(this.zoomMax, Math.max(ZOOM_MIN, this.zoom * (e.deltaY > 0 ? 1.1 : 1 / 1.1)));
        this.redimensionner();
      },
      { passive: false },
    );
    this.redimensionner();
  }

  /** Angle horizontal de la caméra : sert à convertir « haut de l'écran » en direction dans le monde. */
  get angleCamera(): number {
    return this.lacet;
  }

  tourner(sens: number): void {
    this.quartDeTour += sens;
  }

  /** Direction dans le monde correspondant à une direction à l'écran (x droite, y haut). */
  versMonde(x: number, y: number): { dx: number; dz: number } {
    // Vers l'avant = de la caméra vers la cible, à plat.
    const avantX = -Math.cos(this.lacet);
    const avantZ = -Math.sin(this.lacet);
    const droiteX = -avantZ;
    const droiteZ = avantX;
    return { dx: avantX * y + droiteX * x, dz: avantZ * y + droiteZ * x };
  }

  suivre(x: number, z: number, dt: number, immediat = false): void {
    if (this.cibleForcee) ({ x, z } = this.cibleForcee);
    const lacetVise = this.lacetLibre ?? Math.PI / 4 + (this.quartDeTour * Math.PI) / 2;
    const lissage = immediat ? 1 : Math.min(1, dt * 6);
    this.lacet += (lacetVise - this.lacet) * (immediat ? 1 : Math.min(1, dt * 8));
    this.cible.x += (x - this.cible.x) * lissage;
    this.cible.z += (z - this.cible.z) * lissage;

    const horizontal = Math.cos(ELEVATION) * DISTANCE_CAMERA;
    this.camera.position.set(
      this.cible.x + Math.cos(this.lacet) * horizontal,
      Math.sin(ELEVATION) * DISTANCE_CAMERA,
      this.cible.z + Math.sin(this.lacet) * horizontal,
    );
    this.camera.lookAt(this.cible);

  }

  /**
   * On entre dans une pièce noire (ou on en sort) : l'ambiance passe en nuit intérieure en ≈ 0,6 s, même de jour,
   * et revient de même. Les autres lieux ne l'appellent pas : leur cycle du jour ne change pas.
   */
  pieceNoire(oui: boolean): void {
    this.pieceNoireVisee = oui;
  }

  /** Heure de jeu et sources de lumière artificielles de l'image. */
  eclairer(heure: number, sources: SourceLumiere[], dt: number, nuages = 0): void {
    const c = this.ciel;
    c.obscurite = Math.min(1, Math.max(0, c.obscurite + (this.pieceNoireVisee ? 1 : -1) * (dt / 0.6)));
    // Le ciel place aussi le soleil (ou la lune) : une seule carte d'ombre, centrée sur ce qu'on voit.
    c.appliquer(heure, this.cible, nuages);
    this.lumieres.mettreAJour(sources, this.cible, dt, c.obscurite > 0.5 || c.nuit > 0.5);
  }

  /** Mode photo : régler le zoom (0,6 à 1,7). */
  reglerZoom(z: number): void {
    this.zoom = Math.min(this.zoomMax, Math.max(ZOOM_MIN, z));
    this.redimensionner();
  }

  get niveauZoom(): number {
    return this.zoom;
  }

  /** Point regardé par la caméra (au sol). */
  get centre(): THREE.Vector3 {
    return this.cible;
  }

  dessiner(): void {
    if (this.frustumOmbre && this.soleil.castShadow) this.frustumOmbre.preparer(this.camera, this.soleil);
    this.rendu.render(this.scene, this.camera);
  }

  private redimensionner(): void {
    const largeur = window.innerWidth;
    const hauteur = window.innerHeight;
    const rapport = largeur / hauteur;
    // En paysage, ≈ 20 m de large ; en portrait, on garde de quoi voir autour de soi.
    const demiLargeur = (rapport >= 1 ? DEMI_LARGEUR : Math.max(6.5, DEMI_LARGEUR * rapport * 1.35)) * this.zoom;
    const demiHauteur = demiLargeur / rapport;
    this.camera.left = -demiLargeur;
    this.camera.right = demiLargeur;
    this.camera.top = demiHauteur;
    this.camera.bottom = -demiHauteur;
    this.camera.updateProjectionMatrix();
    this.rendu.setSize(largeur, hauteur, false);
  }
}
