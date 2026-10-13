// La vue d'ensemble à l'arrivée dans un lieu (0.8.2, chantier G ; R4) : le cadrage de la caméra, sans rien dessiner.
// - `boiteDeLaVue` : ce qu'on montre du lieu (sa zone ; au gué, le tronçon d'arrivée et son voisin vers le milieu) ;
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
/** Le gué se construit par tronçons de 50 m (rendu/gue.ts) ; on en montre deux de loin. */
const TRONCON_GUE = 50;

/**
 * Ce qu'on montre du lieu. Partout, sa zone (où l'on marche) : le décor tout autour remplit l'écran. Au gué (200 × 70 m,
 * quatre tronçons dont seuls celui du joueur et ses voisins sont construits), le tronçon d'arrivée et son voisin vers le
 * milieu du gué : 100 × 70 m, déjà construits, dans le budget de l'iPhone (deux tronçons, plus un bout du troisième).
 */
export function boiteDeLaVue(lieu: LieuId, zone: Zone, arrivee: { x: number; z: number }): BoiteVue {
  if (lieu === "gue") {
    const i = Math.max(0, Math.min(3, Math.floor(arrivee.x / TRONCON_GUE)));
    const voisin = i <= 1 ? i + 1 : i - 1;
    const de = Math.min(i, voisin) * TRONCON_GUE;
    return { xMin: de, xMax: de + 2 * TRONCON_GUE, zMin: 0, zMax: TAILLE_GUE.largeur };
  }
  return { xMin: zone.xMin, xMax: zone.xMax, zMin: zone.zMin, zMax: zone.zMax };
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
      return null;
    }
    const e = adoucir(t);
    const zoom = Math.exp(Math.log(d.zoom) + (Math.log(zoomJoueur) - Math.log(d.zoom)) * e);
    // L'écart au personnage, mesuré en largeurs d'écran, se réduit en ligne droite.
    const k = ((1 - e) * zoom) / d.zoom;
    return { x: joueur.x - (joueur.x - d.x) * k, z: joueur.z - (joueur.z - d.z) * k, zoom };
  }

  /** Les toits restent tant qu'on voit le lieu de loin, et s'effacent à la fin du zoom, comme d'habitude. */
  toitsVisibles(maintenant: number): boolean {
    return this.etatVue === "attente" || (this.etatVue === "zoom" && this.avancee(maintenant) < 0.85);
  }
}
