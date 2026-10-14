// La scène 3D : rendu, caméra isométrique orthographique, lumière du petit matin.
// Règles du Book 21 §5.3 : 1 unité = 1 m, ≈ 20 m de large à l'écran, un soleil et une seule carte d'ombre.

import * as THREE from "three";
import { Ciel } from "./ciel.ts";
import { ReserveLumieres, type SourceLumiere } from "./lumieres.ts";
import { PALETTE } from "./materiaux.ts";
import { FrustumOmbre } from "./ombres.ts";
import type { Qualite } from "./qualite.ts";

/** Élévation isométrique « vraie » : arctan(1/√2) ≈ 35,26°. */
export const ELEVATION = Math.atan(1 / Math.SQRT2);
const DISTANCE_CAMERA = 60;
/** Demi-largeur visible au zoom par défaut, en mètres (≈ 20 m de large en paysage). */
const DEMI_LARGEUR = 10;
const ZOOM_MIN = 0.6;
const ZOOM_MAX = 1.7;
/** La carte d'ombre du soleil couvre ± 24 m autour du point regardé (agrandie seulement pour la vue d'ensemble). */
const OMBRE_DEMI = 24;
const OMBRE_PRES = 1;
const OMBRE_LOIN = 90;

/**
 * La demi-largeur visible (en mètres) au zoom 1, selon le rapport largeur / hauteur de l'écran : en paysage, ≈ 20 m de
 * large ; en portrait, on garde de quoi voir autour de soi.
 */
export function demiLargeurDeBase(rapport: number): number {
  return rapport >= 1 ? DEMI_LARGEUR : Math.max(6.5, DEMI_LARGEUR * rapport * 1.35);
}

/** Le cadrage imposé par la vue d'ensemble à l'arrivée (rendu/vue-ensemble.ts). */
export interface Cadrage {
  x: number;
  z: number;
  zoom: number;
  /** La hauteur du point regardé (0.10, K2 : le milieu de la tour du phare, la crique) ; 0 par défaut. */
  y?: number;
}

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
  /**
   * La vue d'ensemble à l'arrivée (0.8.2, chantier G ; rendu/vue-ensemble.ts) : le point regardé et le zoom imposés, sans
   * lissage et au-delà des bornes de la molette ; null : la caméra suit le personnage, au zoom du joueur.
   */
  cadrage: Cadrage | null = null;
  /**
   * 0.10, chantier K : la hauteur du sol sous le personnage (le phare : la grève à − 8,8, le pont de l'épave) ; la caméra
   * la suit, en douceur. 0 partout ailleurs.
   */
  hauteurSuivie = 0;
  /**
   * 0.10, chantier K : un décalage de la caméra et de ce qu'elle regarde (une secousse : rendu/secousse.ts) ; l'image
   * glisse d'autant, sans tourner. Zéro hors d'une secousse.
   */
  decalageCamera: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  private readonly regard = new THREE.Vector3();
  /** Le zoom de la projection en place (pour ne la refaire que s'il change). */
  private zoomApplique = 1;
  /** La vue d'ensemble immobile : le cadrage de l'image d'avant, et depuis combien d'images il n'a pas bougé. */
  private cadrageAvant: Cadrage | null = null;
  private imagesImmobiles = 0;

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
    if (this.cadrage) {
      ({ x, z } = this.cadrage);
      immediat = true;
    }
    if (this.zoomEffectif !== this.zoomApplique) this.projeter();
    // La vue d'ensemble : la caméra recule d'autant qu'on dézoome (rien ne change à l'image, orthographique), pour que
    // tout le lieu tienne entre ses plans proche et lointain.
    const distance = DISTANCE_CAMERA * this.echelleEnsemble;
    const lacetVise = this.lacetLibre ?? Math.PI / 4 + (this.quartDeTour * Math.PI) / 2;
    const lissage = immediat ? 1 : Math.min(1, dt * 6);
    this.lacet += (lacetVise - this.lacet) * (immediat ? 1 : Math.min(1, dt * 8));
    this.cible.x += (x - this.cible.x) * lissage;
    this.cible.z += (z - this.cible.z) * lissage;
    this.cible.y += ((this.cadrage ? (this.cadrage.y ?? 0) : this.hauteurSuivie) - this.cible.y) * lissage;

    const horizontal = Math.cos(ELEVATION) * distance;
    const s = this.decalageCamera;
    this.camera.position.set(
      this.cible.x + Math.cos(this.lacet) * horizontal + s.x,
      this.cible.y + Math.sin(ELEVATION) * distance + s.y,
      this.cible.z + Math.sin(this.lacet) * horizontal + s.z,
    );
    this.camera.lookAt(this.regard.set(this.cible.x + s.x, this.cible.y + s.y, this.cible.z + s.z));

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
    this.etendreEnsemble();
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

  /** Le zoom de l'image : celui de la vue d'ensemble pendant qu'elle dure, sinon celui du joueur. */
  get zoomEffectif(): number {
    return this.cadrage?.zoom ?? this.zoom;
  }

  /** De combien la vue d'ensemble agrandit la profondeur, la brume et l'ombre (1 : pas du tout, et jamais au zoom du jeu). */
  private get echelleEnsemble(): number {
    return this.cadrage ? Math.max(1, this.cadrage.zoom / 1.5) : 1;
  }

  /**
   * La vue d'ensemble (0.8.2, chantier G) : la brume recule avec la caméra, et la carte d'ombre couvre ce qu'on voit
   * (même taille de carte : l'ombre est moins fine, mais de loin, c'est la finesse de l'écran). Sinon, les réglages
   * d'origine, une seule fois au retour.
   */
  private etendreEnsemble(): void {
    const k = this.echelleEnsemble;
    if (k > 1 && this.scene.fog instanceof THREE.Fog) {
      const recul = DISTANCE_CAMERA * (k - 1);
      this.scene.fog.near += recul;
      this.scene.fog.far += recul;
    }
    const c = this.soleil.shadow.camera;
    if (c.right === OMBRE_DEMI * k) return;
    c.left = -OMBRE_DEMI * k;
    c.right = OMBRE_DEMI * k;
    c.top = OMBRE_DEMI * k;
    c.bottom = -OMBRE_DEMI * k;
    // Le soleil est à ≈ 46 m du point regardé : la boîte de l'ombre s'allonge des deux côtés.
    c.near = OMBRE_PRES - OMBRE_DEMI * 1.5 * (k - 1);
    c.far = OMBRE_LOIN + OMBRE_DEMI * 1.5 * (k - 1);
    c.updateProjectionMatrix();
  }

  /** Point regardé par la caméra (au sol). */
  get centre(): THREE.Vector3 {
    return this.cible;
  }

  dessiner(): void {
    // 0.8.4 : sur iPhone, après un quart de tour (pendant l'accueil surtout), « resize » arrive avant que la fenêtre ait
    // sa nouvelle taille ; l'image restait alors à l'ancien format, étirée. On revérifie à chaque image (deux lectures).
    if (window.innerWidth !== this.largeurDessin || window.innerHeight !== this.hauteurDessin) this.redimensionner();
    if (this.frustumOmbre && this.soleil.castShadow) this.frustumOmbre.preparer(this.camera, this.soleil);
    // La vue d'ensemble immobile (0.8.2, chantier G) : tout le lieu est dans la passe d'ombre, mais rien ne bouge ou
    // presque (le monde est en pause, ou l'on regarde de loin) : on ne refait les ombres qu'une image sur 20.
    const c = this.cadrage;
    const a = this.cadrageAvant;
    const immobile = c !== null && a !== null && c.x === a.x && c.z === a.z && c.zoom === a.zoom;
    this.cadrageAvant = c ? { ...c } : null;
    this.imagesImmobiles = immobile ? this.imagesImmobiles + 1 : 0;
    this.rendu.shadowMap.autoUpdate = !immobile;
    if (immobile) this.rendu.shadowMap.needsUpdate = this.imagesImmobiles % 20 === 0;
    this.rendu.render(this.scene, this.camera);
  }

  /** La taille de fenêtre du dernier redimensionnement : l'image est dessinée pour elle. */
  private largeurDessin = 0;
  private hauteurDessin = 0;

  private redimensionner(): void {
    this.largeurDessin = window.innerWidth;
    this.hauteurDessin = window.innerHeight;
    this.projeter();
    this.rendu.setSize(this.largeurDessin, this.hauteurDessin, false);
  }

  /** La projection de la caméra, au zoom de l'image (sans toucher à la taille du dessin : la vue d'ensemble l'appelle à chaque image). */
  private projeter(): void {
    const rapport = window.innerWidth / window.innerHeight;
    // En paysage, ≈ 20 m de large ; en portrait, on garde de quoi voir autour de soi.
    this.zoomApplique = this.zoomEffectif;
    const demiLargeur = demiLargeurDeBase(rapport) * this.zoomApplique;
    const demiHauteur = demiLargeur / rapport;
    this.camera.left = -demiLargeur;
    this.camera.right = demiLargeur;
    this.camera.top = demiHauteur;
    this.camera.bottom = -demiHauteur;
    this.camera.far = 200 * this.echelleEnsemble;
    this.camera.updateProjectionMatrix();
  }
}
