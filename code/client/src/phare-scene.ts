// La mise en scène du phare (0.10, K2 puis K4, choisie par le porteur après les essais sur l'iPhone) : ce que le client
// montre de l'allumage et de l'arrivée du cargo, en plus des règles (serveur/src/phare.ts) et de la scène de l'échouage
// (client/src/phare.ts, client/src/rendu/cargo/).
//
// - L'allumage : la caméra recule sur la tour 3 à 4 s, puis revient exactement au personnage (un cadrage, Scene.cadrage) ;
//   pas de recul avec un Éteint à moins de 6 m (on garde la main), ni si le système demande de réduire les mouvements.
// - L'approche du cargo (CARGO_MS après l'allumage : 50 s, S-17) : sa corne grave au large 10 s après l'allumage, puis
//   8 s avant l'échouage ; ses feux (rouge, vert, blanc) et leur reflet approchent dès la première corne, dans la vue
//   normale.
// - L'échouage (K4) : la scène de la maquette validée (variante 1, « Large »), ≈ 6,6 s, un moment à part rendu dans sa
//   propre scène (SCENE_CARGO, ci-dessous), puis le retour au personnage devant l'épave. Elle se joue aussi avec la
//   réduction des mouvements, sans la secousse de l'image.
// - Celui qui arrive après le cargo, ou se reconnecte après, trouve l'épave : rien ne se joue (le serveur ne donne plus
//   `cargoDans`). Celui qui arrive pendant l'approche voit la fin des feux, puis la scène.
//
// Le temps est celui de performance.now() (ms).

import { CARGO_MS, SCENE_CARGO_MS, type EtatPhareVu } from "../../commun/src/phare.ts";
import type { Cadrage } from "./rendu/scene.ts";
import { mouvementsReduits } from "./rendu/secousse.ts";

/** Le recul sur la tour : aller, rester, revenir (s) ; le point regardé (le milieu de la tour, repère du jeu) et le zoom. */
export const RECUL_TOUR = { aller: 0.7, reste: 2.4, retour: 0.7, x: 20, y: 13, z: 19, zoom: 2.6 } as const;
/**
 * La scène de l'échouage (K4), en secondes depuis l'annonce du serveur (CARGO_MS après l'allumage), celles de la maquette
 * validée : la vue du jeu s'éteint (noirDebut → noir), le plan de la crique s'ouvre (noir → ouvert), la corne du cargo,
 * le choc, la cassure de la poupe, le repos (le feu de détresse), le noir (noirFin → retour), le retour au personnage
 * devant l'épave (retour → jeu), la fin. Les bandes du cinéma, de noirDebut − 0,1 à jeu.
 */
export const SCENE_CARGO = { noirDebut: 0.45, noir: 0.75, ouvert: 1.05, corne: 0.55, choc: 4.0, cassure: 4.45, repos: 5.2, noirFin: 5.6, retour: 5.9, jeu: 6.25, fin: SCENE_CARGO_MS / 1000 } as const;
/** Le délai du cargo, en secondes (commun/src/phare.ts). */
const CARGO_S = CARGO_MS / 1000;
/** La corne grave du cargo au large, en secondes avant l'échouage : 10 s après l'allumage (on sait vite qu'il vient), puis 8 s avant. */
export const CORNES_CARGO_S = [CARGO_S - 10, 8] as const;
/**
 * Les feux du cargo : visibles dès la première corne, du large jusqu'à l'entrée de la crique (repère du jeu), sur la route
 * du cargo en marche du modèle (batiment/phare/cargo.js, `userData.route` : 0.10, P-9) : du départ conseillé, 90 m au
 * large, jusqu'à 5 m de l'échouage, sur l'axe de l'épave (le cap du cargo de la scène). Le test client/src/phare-scene.test.ts
 * vérifie qu'ils suivent la route du modèle.
 */
export const FEUX_CARGO = { avantS: CORNES_CARGO_S[0], depart: { x: 49.99, z: 135.66 }, arrivee: { x: 27.9, z: 53.58 } } as const;
/** À moins de cette distance, un Éteint annule le recul sur la tour (le mode Combat se met au même seuil). */
export const PROCHE_ETEINT = 6;

/** Ce que montre la scène de l'échouage à `t` s de son début. */
export interface MomentCargo {
  /** Le plan de la crique se dessine (à la place de la vue du jeu). */
  plan: boolean;
  /** L'opacité du noir par-dessus (0 à 1). */
  noir: number;
  /** Les bandes du cinéma. */
  bandes: boolean;
  /** L'épave du jeu se voit (le retour au personnage). */
  epave: boolean;
  /** La scène est finie. */
  fini: boolean;
}

/** La scène de l'échouage à `t` s de l'annonce (les fondus et les bandes de la maquette, scene.js : etat). */
export function momentCargo(t: number): MomentCargo {
  const T = SCENE_CARGO;
  let noir = 0;
  if (t > T.noirDebut && t < T.noir) noir = (t - T.noirDebut) / (T.noir - T.noirDebut);
  else if (t >= T.noir && t < T.ouvert) noir = 1 - (t - T.noir) / (T.ouvert - T.noir);
  else if (t > T.noirFin && t < T.retour) noir = (t - T.noirFin) / (T.retour - T.noirFin);
  else if (t >= T.retour && t < T.jeu) noir = 1 - (t - T.retour) / (T.jeu - T.retour);
  return { plan: t >= T.noir && t < T.retour, noir, bandes: t > T.noirDebut - 0.1 && t < T.jeu, epave: t >= T.retour, fini: t >= T.fin };
}

/** Où l'on regarde quand rien n'est cadré : le personnage, à sa hauteur, au zoom du joueur. */
export interface VueJoueur {
  x: number;
  z: number;
  y: number;
  zoom: number;
}

/** Les feux du cargo à un instant : leur place et leur cap (radians, comme `o` : 0 vers + z). */
export interface FeuxCargo {
  x: number;
  z: number;
  cap: number;
}

const lisse = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/** Le poids du cadrage (0 : le joueur, 1 : le point cadré) à `t` s de son début, s'il dure `duree` s. */
export function poidsCadrage(t: number, duree: number, aller: number, retour: number): number {
  if (t <= 0 || t >= duree) return 0;
  return Math.min(lisse(t / aller), lisse((duree - t) / retour));
}

export class MiseEnScenePhare {
  /** Le recul sur la tour en cours : son début (ms), ou null. */
  private recul: number | null = null;
  /** L'échouage prévu (ms), d'après `cargoDans` ; null : pas de cargo en route. */
  private cargoPrevu: number | null = null;
  /** L'échouage annoncé par le serveur (la scène du choc a commencé), ou null. */
  private cargoArrive: number | null = null;
  /** Le recul annulé (un Éteint trop près) ne reprend pas. */
  private reculAnnule = false;
  private cornes = new Set<number>();
  private readonly reduit: () => boolean;

  constructor(reduit: () => boolean = mouvementsReduits) {
    this.reduit = reduit;
  }

  /** Le message `phare` : `avant`, l'état d'avant (null : le premier, à l'arrivée : on ne rejoue pas l'allumage). */
  recevoir(avant: EtatPhareVu | null, etat: EtatPhareVu, maintenant: number): void {
    if (avant && !avant.lanterne && etat.lanterne) {
      this.recul = maintenant;
      this.reculAnnule = false;
    }
    if (etat.cargoDans !== undefined) {
      // Un nouveau cargo en route (le premier, ou celui d'un nouvel allumage, la nuit suivante) : tout repart.
      if (this.cargoPrevu === null || (this.cargoArrive !== null && maintenant - this.cargoArrive > 30_000)) {
        this.cargoArrive = null;
        this.cornes.clear();
      }
      this.cargoPrevu = maintenant + etat.cargoDans;
      // Une approche qu'on prend en route : les cornes déjà passées ne sonnent pas après coup.
      for (const s of CORNES_CARGO_S) if (etat.cargoDans < s * 1000 - 1500) this.cornes.add(s);
    } else if (this.cargoArrive === null) this.cargoPrevu = null;
  }

  /** Le serveur annonce l'échouage : la scène commence. */
  echouage(maintenant: number): void {
    this.cargoArrive = maintenant;
    this.cargoPrevu ??= maintenant;
  }

  /** Les cornes de l'approche à jouer maintenant (une seule fois chacune), en secondes avant l'échouage. */
  cornesAJouer(maintenant: number): number[] {
    if (this.cargoPrevu === null || this.cargoArrive !== null) return [];
    const reste = (this.cargoPrevu - maintenant) / 1000;
    const res: number[] = [];
    for (const s of CORNES_CARGO_S) {
      if (reste > s || this.cornes.has(s)) continue;
      this.cornes.add(s);
      res.push(s);
    }
    return res;
  }

  /** Les feux du cargo à cet instant, ou null (hors des 40 dernières secondes, ou l'épave revenue du fondu). */
  feux(maintenant: number, epaveVisible: boolean): FeuxCargo | null {
    if (this.cargoPrevu === null || epaveVisible) return null;
    const reste = (this.cargoPrevu - maintenant) / 1000;
    if (reste > FEUX_CARGO.avantS) return null;
    const { depart: a, arrivee: b } = FEUX_CARGO;
    // Il avance à vitesse constante, et finit sa course dans le noir du fondu (un peu après l'échouage annoncé).
    const k = Math.min(1.08, 1 - reste / FEUX_CARGO.avantS);
    return { x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k, cap: Math.atan2(b.x - a.x, b.z - a.z) };
  }

  /**
   * Le cadrage de cette image (null : la caméra suit le joueur) : le recul sur la tour à l'allumage. `menace` : un Éteint
   * debout à moins de 6 m (le recul s'annule, et ne reprend pas). Rien si le système demande de réduire les mouvements.
   * K4 : plus de cadrage de la crique avant le choc (la scène de l'échouage le remplace).
   */
  cadrage(maintenant: number, joueur: VueJoueur, menace: boolean): Cadrage | null {
    if (this.reduit() || this.recul === null || this.reculAnnule) return null;
    const t = (maintenant - this.recul) / 1000;
    const duree = RECUL_TOUR.aller + RECUL_TOUR.reste + RECUL_TOUR.retour;
    if (t >= duree) {
      this.recul = null;
      return null;
    }
    if (menace) {
      this.reculAnnule = true;
      return null;
    }
    const k = poidsCadrage(t, duree, RECUL_TOUR.aller, RECUL_TOUR.retour);
    if (k <= 0) return null;
    const c = RECUL_TOUR;
    return {
      x: joueur.x + (c.x - joueur.x) * k,
      z: joueur.z + (c.z - joueur.z) * k,
      y: joueur.y + (c.y - joueur.y) * k,
      zoom: joueur.zoom + (c.zoom - joueur.zoom) * k,
      // La brume du temps recule au-delà de ce qu'on voit (sinon, de loin et la nuit : un voile gris).
      degage: true,
    };
  }
}
