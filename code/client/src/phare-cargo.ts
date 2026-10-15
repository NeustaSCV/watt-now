// La scène de l'échouage du cargo au phare (0.10, K4), côté client : un moment à part, la variante 1 de la maquette validée
// par le porteur sur son iPhone (client/src/rendu/cargo/, le code de la maquette), rendue dans sa propre scène et avec sa
// propre caméra, par le rendu du jeu, à la place de la vue du jeu (ni la brume de la nuit, ni la vue par pièce, ni les
// lumières du jeu n'y entrent). Par-dessus : le fondu au noir et les bandes du cinéma ; l'interface du jeu se retire.
//
// - Préparée pendant l'approche (dès que le serveur donne `cargoDans`) : le module se charge à part (import dynamique),
//   la scène se construit, ses nuanceurs se compilent d'avance, ses sons se préparent ; libérée à la fin de la scène.
// - Le minutage est celui de la maquette (SCENE_CARGO, client/src/phare-scene.ts) ; client/src/phare.ts la conduit.
// - Si elle n'est pas prête à temps (le module pas chargé, arrivé une seconde avant), le plan reste noir, entre les bandes.
// - Le plan se dessine à la finesse de la maquette (2 pixels par point au plus, au lieu de 1,5 en qualité moyenne) : le
//   rapport change dans le noir du début et revient dans le noir de la fin. La qualité basse garde le sien.

import type * as THREE from "three";
import { SCENE_CARGO, type MomentCargo } from "./phare-scene.ts";
import { mouvementsReduits } from "./rendu/secousse.ts";
import type { SceneCargo } from "./rendu/cargo/scene-cargo.js";
import type { Son } from "./rendu/cargo/son.js";

/** Ce que client/src/phare.ts demande à la scène (une fausse dans les tests). */
export interface CinemaCargo {
  /** Charge et construit la scène, si ce n'est déjà fait (l'approche du cargo a commencé). */
  preparer(): void;
  /** La scène est construite et ses nuanceurs compilés. */
  readonly pret: boolean;
  /** La scène commence (ses sons, depuis `depuis` s). */
  commencer(depuis: number): void;
  /** Le noir, les bandes, l'interface du jeu, à cet instant de la scène. */
  montrer(m: MomentCargo): void;
  /** Dessine le plan à `t` s ; false s'il n'est pas prêt. */
  rendre(t: number): boolean;
  /** Le plan ne se dessine plus (le retour au jeu, avant la fin de la scène). */
  finPlan(): void;
  /** La scène est finie, ou interrompue (on quitte le lieu) : on retire tout et on libère. */
  arreter(): void;
}

/** Le contexte audio du jeu et la sortie où brancher les sons de la scène (null : le son n'est pas encore débloqué). */
export type SortieSon = () => { ctx: AudioContext; sortie: AudioNode } | null;

/** Une mesure du plan (le mode mesure, et la recette) : appels de dessin, triangles, temps du rendu, temps entre images. */
export interface MesureCargo {
  t: number;
  appels: number;
  triangles: number;
  msRendu: number;
  msImage: number;
}

/** Les éléments de l'interface du jeu qui se retirent pendant la scène (comme dans la maquette : l'image seule). */
const INTERFACE = ["hud", "joystick"];

export class ScenePhareCargo implements CinemaCargo {
  private readonly rendu: THREE.WebGLRenderer;
  private readonly sortieSon: SortieSon;
  private scene: SceneCargo | null = null;
  private chargement: Promise<void> | null = null;
  private son: Son | null = null;
  private ClasseSon: (new (ctx: AudioContext, sortie: AudioNode) => Son) | null = null;
  private calque: { racine: HTMLElement; voile: HTMLElement; bandes: HTMLElement[] } | null = null;
  private interfaceCachee = false;
  private derniereImage = 0;
  /** Le rapport de pixels du jeu, pendant que le plan se dessine plus fin (null : rien de changé). */
  private rapportDuJeu: number | null = null;
  /** Les mesures de la dernière scène jouée (une par image du plan). */
  readonly mesures: MesureCargo[] = [];
  /** En développement seulement (captures de recette) : le plan figé à cet instant de la scène (s), ou null. */
  tFige: number | null = null;

  constructor(rendu: THREE.WebGLRenderer, sortieSon: SortieSon) {
    this.rendu = rendu;
    this.sortieSon = sortieSon;
    if (import.meta.env?.DEV) Object.assign(window, { __sceneCargo: this });
  }

  get pret(): boolean {
    return this.scene !== null;
  }

  preparer(): void {
    if (this.chargement) return;
    this.chargement = (async () => {
      const [{ creerSceneCargo }, { Son }] = await Promise.all([import("./rendu/cargo/scene-cargo.js"), import("./rendu/cargo/son.js")]);
      this.ClasseSon = Son;
      // La construction prend un moment : on la fait entre deux images, pas au milieu d'une.
      await new Promise((ok) => requestAnimationFrame(() => setTimeout(ok, 0)));
      const scene = creerSceneCargo(SCENE_CARGO, { secousse: () => !mouvementsReduits() });
      await scene.compiler(this.rendu);
      this.scene = scene;
      this.preparerSon();
    })().catch((e: unknown) => {
      console.warn("La scène du cargo n'a pas pu se préparer :", e);
      this.chargement = null;
    });
  }

  /** Les sons de la scène, dans le contexte audio du jeu (s'il est débloqué). */
  private preparerSon(): Son | null {
    if (this.son || !this.ClasseSon) return this.son;
    const s = this.sortieSon();
    if (!s) return null;
    this.son = new this.ClasseSon(s.ctx, s.sortie);
    void this.son.preparer();
    return this.son;
  }

  commencer(depuis: number): void {
    this.mesures.length = 0;
    this.derniereImage = 0;
    const scene = this.scene;
    const son = this.preparerSon();
    if (scene && son) son.jouer(depuis, scene.evenements());
  }

  montrer(m: MomentCargo): void {
    const c = this.calque ?? (m.bandes || m.noir > 0 ? (this.calque = creerCalque()) : null);
    if (c) {
      // Pas encore prête : le plan reste noir, entre les bandes.
      const noir = m.plan && !this.scene ? 1 : m.noir;
      c.voile.style.opacity = noir.toFixed(3);
      for (const b of c.bandes) b.style.height = m.bandes ? "6.5%" : "0";
    }
    this.cacherInterface(m.bandes);
  }

  rendre(t: number): boolean {
    const scene = this.scene;
    if (!scene) return false;
    if (this.tFige !== null && import.meta.env?.DEV) t = this.tFige;
    this.affiner(true);
    scene.rendre(this.rendu, t);
    const maintenant = performance.now();
    this.mesures.push({ t, appels: scene.mesure.appels, triangles: scene.mesure.triangles, msRendu: scene.mesure.ms, msImage: this.derniereImage ? maintenant - this.derniereImage : 0 });
    this.derniereImage = maintenant;
    return true;
  }

  /** Hors du plan (le retour au jeu) : le rapport de pixels du jeu revient. */
  finPlan(): void {
    this.affiner(false);
  }

  /** Le plan à la finesse de la maquette (min(écran, 2)), seulement si le jeu dessine déjà à 1,5 ou plus. */
  private affiner(oui: boolean): void {
    if (oui && this.rapportDuJeu === null) {
      const jeu = this.rendu.getPixelRatio();
      const plan = Math.min(window.devicePixelRatio || 1, 2);
      if (jeu < 1.5 || plan <= jeu) return;
      this.rapportDuJeu = jeu;
      this.rendu.setPixelRatio(plan);
    } else if (!oui && this.rapportDuJeu !== null) {
      this.rendu.setPixelRatio(this.rapportDuJeu);
      this.rapportDuJeu = null;
    }
  }

  arreter(): void {
    this.affiner(false);
    this.son?.arreter();
    this.cacherInterface(false);
    this.calque?.racine.remove();
    this.calque = null;
    this.scene?.liberer();
    this.scene = null;
    this.chargement = null;
  }

  private cacherInterface(oui: boolean): void {
    if (oui === this.interfaceCachee) return;
    this.interfaceCachee = oui;
    for (const id of INTERFACE) {
      const el = document.getElementById(id);
      if (el) el.style.visibility = oui ? "hidden" : "";
    }
  }
}

/** Le noir et les deux bandes du cinéma (ceux de la maquette : index.html), par-dessus le jeu, sans prendre aucun geste. */
function creerCalque(): { racine: HTMLElement; voile: HTMLElement; bandes: HTMLElement[] } {
  const racine = document.createElement("div");
  racine.className = "scene-cargo";
  racine.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:40;overflow:hidden";
  const bandes = ["top", "bottom"].map((cote) => {
    const b = document.createElement("div");
    b.style.cssText = `position:absolute;left:0;right:0;${cote}:0;height:0;background:#000;transition:height 0.35s ease`;
    return b;
  });
  const voile = document.createElement("div");
  voile.style.cssText = "position:absolute;inset:0;background:#000;opacity:0";
  racine.append(...bandes, voile);
  document.body.append(racine);
  return { racine, voile, bandes };
}
