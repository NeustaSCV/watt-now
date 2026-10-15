// La vue d'ensemble à l'arrivée dans un lieu (0.8.2, chantier G ; R4) : le cadrage de la caméra, sans rien dessiner.
// - `boiteDeLaVue` : ce qu'on montre du lieu (sa zone, le gué compris : 0.10, R52) ;
// - `tronconsVoulus` : dans les haltes par tronçons (la route du pont, la corniche, le gué), lesquels construire ;
// - `cadrerEnsemble` : le point regardé et le zoom pour que cette boîte, toits compris, tienne à l'écran, sous l'angle de
//   la caméra du moment ;
// - `VueEnsemble` : l'attente du premier geste, puis le zoom vers le personnage (≈ 1,5 s, doux), et c'est fini.
// La scène applique le cadrage (Scene.cadrage) ; arrivee.ts (le client) branche le tout : les gestes, l'invite, le serveur.

import type { LieuId, Zone } from "../../../commun/src/lieux.ts";
import { TAILLE_GUE } from "../../../commun/src/gue.ts";
import { ELEVATION, demiLargeurDeBase, type Cadrage } from "./scene.ts";

export interface BoiteVue {
  xMin: number;
  xMax: number;
  zMin: number;
  zMax: number;
}

/** La durée du zoom vers le personnage, en millisecondes. */
export const DUREE_ZOOM = 1500;
/** La hauteur des toits les plus hauts qu'on veut voir en entier (le Moulin, la Coopérative), en mètres. */
const HAUTEUR_TOITS = 9;
/** Un peu d'air autour du lieu (et la place du bandeau du haut et des boutons du bas). */
const MARGE = 1.08;
/**
 * Ce qu'on montre du lieu : sa zone (où l'on marche), le décor tout autour remplit l'écran. Au gué, tout le lieu
 * (200 × 70 m) : pendant la vue d'ensemble, ses quatre tronçons sont construits (0.10, R52 : `tronconsVoulus`).
 */
export function boiteDeLaVue(lieu: LieuId, zone: Zone, _arrivee: { x: number; z: number }): BoiteVue {
  if (lieu === "gue") return { xMin: 0, xMax: TAILLE_GUE.longueur, zMin: 0, zMax: TAILLE_GUE.largeur };
  return { xMin: zone.xMin, xMax: zone.xMax, zMin: zone.zMin, zMax: zone.zMax };
}

/**
 * Les haltes par tronçons (la route du pont, la corniche, le gué : quatre tronçons de 50 m d'ouest en est) : en jeu,
 * celui du joueur (`ici`) et ses voisins ; pendant la vue d'ensemble (`ensemble`), tous (0.10, R52 : de loin, on ne voit
 * plus le lieu coupé net). `voulus` : ce qui doit rester construit ; `aConstruire` : ce qu'on construit à cette image,
 * les voisins du joueur tout de suite, les autres un par image (sans figer l'écran).
 */
export function tronconsVoulus<T extends string>(ordre: readonly T[], ici: number, ensemble: boolean, construits: { has(id: T): boolean }): { voulus: Set<T>; aConstruire: T[] } {
  const proches = ordre.filter((_, i) => Math.abs(i - ici) <= 1);
  const voulus = new Set<T>(ensemble ? ordre : proches);
  const aConstruire = proches.filter((id) => !construits.has(id));
  const loin = ensemble ? ordre.find((id) => !proches.includes(id) && !construits.has(id)) : undefined;
  if (loin !== undefined) aConstruire.push(loin);
  return { voulus, aConstruire };
}

/**
 * Le cadrage où la boîte tient à l'écran (largeur × hauteur en pixels), vue sous l'angle `lacet` (Scene.angleCamera), en
 * comptant la hauteur des toits. `haut` : la part de la hauteur de l'écran que le HUD occupe en haut (en portrait, les
 * jauges et les raccourcis) : le lieu tient dans le reste. Jamais plus près que le zoom du jeu (1).
 */
export function cadrerEnsemble(boite: BoiteVue, lacet: number, largeur: number, hauteur: number, haut = 0): Cadrage {
  // Les axes de l'écran, au sol : la droite, et « vers le haut de l'écran » (de la caméra vers la cible, à plat).
  const droite = { x: Math.sin(lacet), z: -Math.cos(lacet) };
  const avant = { x: -Math.cos(lacet), z: -Math.sin(lacet) };
  const sinE = Math.sin(ELEVATION);
  const cosE = Math.cos(ELEVATION);
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const x of [boite.xMin, boite.xMax]) {
    for (const z of [boite.zMin, boite.zMax]) {
      const sx = x * droite.x + z * droite.z;
      const sy = (x * avant.x + z * avant.z) * sinE;
      xMin = Math.min(xMin, sx);
      xMax = Math.max(xMax, sx);
      yMin = Math.min(yMin, sy);
      // Un toit au bord du lieu monte plus haut à l'écran que son pied.
      yMax = Math.max(yMax, sy + HAUTEUR_TOITS * cosE);
    }
  }
  const rapport = largeur / hauteur;
  const base = demiLargeurDeBase(rapport);
  const libre = 1 - Math.min(0.5, Math.max(0, haut));
  const zoom = Math.max(1, (((xMax - xMin) / 2) * MARGE) / base, (((yMax - yMin) / 2) * MARGE * rapport) / (base * libre));
  // Le point au sol qui tombe au milieu de l'écran : le milieu du lieu tombe au milieu de la part libre (plus bas).
  const demiHauteur = (base * zoom) / rapport;
  const mx = (xMin + xMax) / 2;
  const my = ((yMin + yMax) / 2 + (1 - libre) * demiHauteur) / sinE;
  const x = droite.x * mx + avant.x * my;
  const z = droite.z * mx + avant.z * my;
  return { x, z, zoom };
}

/** Doux au départ, doux à l'arrivée. */
function adoucir(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/** La brume revient en fondu à la fin du zoom (ms ; 0.10.1, A10). */
export const FONDU_BRUME = 1000;

export type EtatVue = "attente" | "zoom" | null;

/**
 * L'attente puis le zoom. Pendant le zoom, le personnage glisse en ligne droite vers le milieu de l'écran pendant que
 * l'image se resserre (le zoom « vers » lui : il ne sort jamais du cadre), et le zoom suit une courbe régulière (en
 * logarithme : chaque instant resserre l'image d'autant).
 */
export class VueEnsemble {
  private etatVue: EtatVue = null;
  private depart: Cadrage | null = null;
  private debutZoom = 0;
  /** Quand le zoom vers le personnage s'est fini (performance.now) : la brume revient en fondu à partir de là. */
  private finZoom = -Infinity;

  get etat(): EtatVue {
    return this.etatVue;
  }

  /** On arrive : la vue d'ensemble, jusqu'au premier geste. */
  commencer(cadrage: Cadrage): void {
    this.etatVue = "attente";
    this.depart = cadrage;
  }

  /** Plus de vue d'ensemble (une connexion, un autre lieu). */
  arreter(): void {
    this.etatVue = null;
    this.depart = null;
  }

  /** Le premier geste : le zoom part. */
  lancer(maintenant: number): void {
    if (this.etatVue !== "attente") return;
    this.etatVue = "zoom";
    this.debutZoom = maintenant;
  }

  /** L'avancée du zoom (0 à 1), 1 hors du zoom. */
  avancee(maintenant: number): number {
    if (this.etatVue === "attente") return 0;
    if (this.etatVue !== "zoom") return 1;
    return Math.min(1, Math.max(0, (maintenant - this.debutZoom) / DUREE_ZOOM));
  }

  /**
   * Le cadrage de cette image : celui de la vue d'ensemble, puis le chemin vers le personnage (`joueur` : sa place ;
   * `zoomJoueur` : son zoom habituel) ; null quand c'est fini (la caméra le suit de nouveau, sans à-coup).
   */
  cadrage(maintenant: number, joueur: { x: number; z: number }, zoomJoueur: number): Cadrage | null {
    const d = this.depart;
    if (!d || this.etatVue === null) return null;
    if (this.etatVue === "attente") return d;
    const t = this.avancee(maintenant);
    if (t >= 1) {
      this.arreter();
      this.finZoom = maintenant;
      return null;
    }
    const e = adoucir(t);
    const zoom = Math.exp(Math.log(d.zoom) + (Math.log(zoomJoueur) - Math.log(d.zoom)) * e);
    // L'écart au personnage, mesuré en largeurs d'écran, se réduit en ligne droite.
    const k = ((1 - e) * zoom) / d.zoom;
    return { x: joueur.x - (joueur.x - d.x) * k, z: joueur.z - (joueur.z - d.z) * k, zoom };
  }

  /**
   * La part de la brume de l'aube qu'on montre (0.10.1, A10) : vue de haut, ses nappes de 70 m, qui suivent la caméra, se
   * lisaient comme un voile carré au-dessus du lieu, et glissaient pendant le zoom. Masquée pendant toute la vue
   * d'ensemble, elle revient en fondu (FONDU_BRUME) à la fin du zoom.
   */
  brume(maintenant: number): number {
    if (this.etatVue !== null) return 0;
    return Math.min(1, Math.max(0, (maintenant - this.finZoom) / FONDU_BRUME));
  }

  /** Les toits restent tant qu'on voit le lieu de loin, et s'effacent à la fin du zoom, comme d'habitude. */
  toitsVisibles(maintenant: number): boolean {
    return this.etatVue === "attente" || (this.etatVue === "zoom" && this.avancee(maintenant) < 0.85);
  }
}
