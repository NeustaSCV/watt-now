// Entrées du joueur (Book 08 §3) : clavier, souris, joystick et boutons tactiles.
// Les touches viennent de touches.ts (réassignables, menu « Commandes »). A = agir ou clic gauche,
// B = examiner ou clic droit. En combat, A se juge au relâchement : appui court = coup rapide, maintenu = coup appuyé.

import { DUREE_APPUI_MS } from "../../commun/src/combat.ts";
import type { Allure } from "../../commun/src/regles.ts";
import { actionDe, tenue } from "./touches.ts";

export interface EntreeDeplacement {
  /** Direction à l'écran, de longueur ≤ 1. */
  x: number;
  y: number;
  allure: Allure;
}

export type Commande =
  | "A"
  /** A relâché : après un appui court, ou maintenu (coup appuyé, Book 08 §3.3). */
  | "A_court"
  | "A_long"
  | "B"
  | "mode"
  | "photo"
  | "photo_panneau"
  | "sac"
  | "fabriquer"
  | "carte"
  | "carnet"
  | "lumiere"
  | "tourner+"
  | "tourner-"
  | "fermer"
  /** Lancer (0.6, Book 23 §6) : enfoncé (on vise, l'arc se bande), relâché (l'objet part). */
  | "lancer"
  | "lancer_fin";

/** Seuils d'inclinaison du joystick pour les trois allures. */
const SEUIL_DISCRETE = 0.45;
const SEUIL_COURSE = 0.9;

export class Entrees {
  private readonly touches = new Set<string>();
  private joystick = { x: 0, y: 0, actif: false };
  private commandes: Commande[] = [];
  /** Instant où A a été enfoncé (null : relâché). */
  private debutA: number | null = null;
  /** Réassignation en cours : la prochaine touche frappée lui est donnée. */
  private capture: ((code: string) => void) | null = null;

  constructor(elementJoystick: HTMLElement, canvas: HTMLCanvasElement) {
    // `code` désigne la position de la touche ; touches.ts la nomme en AZERTY (ZQSD pour marcher).
    window.addEventListener("keydown", (e) => {
      if (e.target instanceof HTMLInputElement) return;
      // Pendant qu'on réassigne une touche, le jeu ne la voit pas.
      if (this.capture) {
        e.preventDefault();
        const f = this.capture;
        this.capture = null;
        f(e.code);
        return;
      }
      this.touches.add(e.code);
      if (e.code.startsWith("Arrow") || e.code === "Tab" || e.code === "Space") e.preventDefault();
      if (e.repeat) return;
      if (e.code === "Escape") return this.commande("fermer");
      // H : masquer le panneau du mode photo (touche fixe, utile seulement en mode photo).
      if (e.code === "KeyH") return this.commande("photo_panneau");
      switch (actionDe(e.code)) {
        case "agir":
          this.appuyerA();
          break;
        case "examiner":
          this.commande("B");
          break;
        case "combat":
          this.commande("mode");
          break;
        case "sac":
          this.commande("sac");
          break;
        case "fabriquer":
          this.commande("fabriquer");
          break;
        case "carte":
          this.commande("carte");
          break;
        case "carnet":
          this.commande("carnet");
          break;
        case "lumiere":
          this.commande("lumiere");
          break;
        case "tourner":
          this.commande(e.shiftKey ? "tourner-" : "tourner+");
          break;
        case "photo":
          this.commande("photo");
          break;
        case "lancer":
          this.appuyerLancer();
          break;
        default:
          break;
      }
    });
    window.addEventListener("keyup", (e) => {
      this.touches.delete(e.code);
      if (actionDe(e.code) === "agir") this.relacherA();
      if (actionDe(e.code) === "lancer") this.relacherLancer();
    });
    window.addEventListener("blur", () => {
      this.touches.clear();
      this.debutA = null;
      this.relacherLancer();
    });

    // Souris : clic gauche = A, clic droit = B, clic du milieu = Lancer (Book 08 §3.5, Book 23 §6).
    canvas.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") return;
      if (e.button === 0) this.appuyerA();
      if (e.button === 1) {
        e.preventDefault();
        this.appuyerLancer();
      }
      if (e.button === 2) this.commande("B");
    });
    canvas.addEventListener("pointerup", (e) => {
      if (e.pointerType === "mouse" && e.button === 0) this.relacherA();
      if (e.pointerType === "mouse" && e.button === 1) this.relacherLancer();
    });
    // La souris vise (sur ordinateur) : on garde sa dernière place sur l'écran.
    canvas.addEventListener("pointermove", (e) => {
      if (e.pointerType === "mouse") this.souris = { x: e.clientX, y: e.clientY, le: performance.now() };
    });
    // Le clic du milieu ne doit pas lancer le défilement automatique du navigateur.
    canvas.addEventListener("mousedown", (e) => {
      if (e.button === 1) e.preventDefault();
    });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    this.brancherJoystick(elementJoystick);
  }

  /** Attend la prochaine touche frappée (pour la réassigner) ; Échap annule. */
  attendreTouche(f: (code: string | null) => void): void {
    this.capture = (code) => f(code === "Escape" ? null : code);
  }

  /** Le joystick n'apparaît que sur les écrans tactiles. */
  static estTactile(): boolean {
    return window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  }

  /** A enfoncé (clavier, souris, bouton tactile). */
  appuyerA(): void {
    if (this.debutA !== null) return;
    this.debutA = performance.now();
    this.commande("A");
  }

  /** A relâché : court ou long. */
  relacherA(): void {
    if (this.debutA === null) return;
    const duree = performance.now() - this.debutA;
    this.debutA = null;
    this.commande(duree >= DUREE_APPUI_MS ? "A_long" : "A_court");
  }

  /** Instant où Lancer a été enfoncé (null : relâché). */
  private debutLancer: number | null = null;
  /** La dernière place de la souris sur l'écran (null : jamais bougée), pour viser sur ordinateur. */
  souris: { x: number; y: number; le: number } | null = null;

  /** Lancer enfoncé (clavier, clic du milieu, bouton tactile). */
  appuyerLancer(): void {
    if (this.debutLancer !== null) return;
    this.debutLancer = performance.now();
    this.commande("lancer");
  }

  /** Lancer relâché : l'objet part. */
  relacherLancer(): void {
    if (this.debutLancer === null) return;
    this.debutLancer = null;
    this.commande("lancer_fin");
  }

  /** Depuis combien de temps Lancer est tenu (ms) ; null : relâché. */
  get tenuLancer(): number | null {
    return this.debutLancer === null ? null : performance.now() - this.debutLancer;
  }

  /** A est-il tenu depuis assez longtemps pour un coup appuyé ? (pour l'animation de préparation) */
  get chargeA(): number {
    return this.debutA === null ? 0 : Math.min(1, (performance.now() - this.debutA) / DUREE_APPUI_MS);
  }

  /** Une commande venue d'un bouton de l'interface ou du clavier. */
  commande(c: Commande): void {
    this.commandes.push(c);
  }

  /** Renvoie les commandes reçues depuis le dernier appel. */
  prendreCommandes(): Commande[] {
    const c = this.commandes;
    this.commandes = [];
    return c;
  }

  lire(): EntreeDeplacement {
    if (this.joystick.actif) {
      const force = Math.hypot(this.joystick.x, this.joystick.y);
      const allure: Allure = force < SEUIL_DISCRETE ? "discrete" : force >= SEUIL_COURSE ? "course" : "marche";
      return { x: this.joystick.x, y: this.joystick.y, allure };
    }

    const t = this.touches;
    let x = 0;
    let y = 0;
    if (tenue("avancer", t)) y += 1;
    if (tenue("reculer", t)) y -= 1;
    if (tenue("droite", t)) x += 1;
    if (tenue("gauche", t)) x -= 1;
    const longueur = Math.hypot(x, y);
    if (longueur > 0) {
      x /= longueur;
      y /= longueur;
    }
    const allure: Allure = tenue("courir", t) ? "course" : tenue("discret", t) ? "discrete" : "marche";
    return { x, y, allure };
  }

  private brancherJoystick(element: HTMLElement): void {
    const manche = element.querySelector<HTMLElement>(".manche")!;
    let pointeur: number | null = null;

    const placer = (e: PointerEvent): void => {
      const cadre = element.getBoundingClientRect();
      const rayon = cadre.width / 2;
      let x = (e.clientX - (cadre.left + rayon)) / rayon;
      let y = -(e.clientY - (cadre.top + rayon)) / rayon;
      const longueur = Math.hypot(x, y);
      if (longueur > 1) {
        x /= longueur;
        y /= longueur;
      }
      this.joystick = { x, y, actif: true };
      manche.style.transform = `translate(${x * rayon * 0.6}px, ${-y * rayon * 0.6}px)`;
    };

    const relacher = (e: PointerEvent): void => {
      if (e.pointerId !== pointeur) return;
      pointeur = null;
      this.joystick = { x: 0, y: 0, actif: false };
      manche.style.transform = "";
    };

    element.addEventListener("pointerdown", (e) => {
      pointeur = e.pointerId;
      element.setPointerCapture(e.pointerId);
      placer(e);
    });
    element.addEventListener("pointermove", (e) => {
      if (e.pointerId === pointeur) placer(e);
    });
    element.addEventListener("pointerup", relacher);
    element.addEventListener("pointercancel", relacher);
  }
}
