// La mise en scène du phare (0.10, K2, choisie par le porteur après l'essai sur l'iPhone) : ce que le client montre de
// l'allumage et de l'arrivée du cargo, en plus des règles (serveur/src/phare.ts) et de la scène du choc (client/src/phare.ts).
//
// - L'allumage : la caméra recule sur la tour 3 à 4 s, puis revient exactement au personnage (un cadrage, Scene.cadrage).
// - L'arrivée du cargo (2 min après l'allumage, S-17) : la corne grave au large 10 s après l'allumage et à 110 s ; ses feux (rouge, vert,
//   blanc) et leur reflet approchent dans les 40 dernières secondes ; 7 s avant le choc, la caméra cadre la crique, jusqu'à
//   l'épave revenue du fondu.
// - Pas de cadrage avec un Éteint à moins de 6 m (on garde la main) ; aucun mouvement de caméra si le système demande de
//   réduire les mouvements : la corne et les feux disent seuls ce qui arrive.
// - Celui qui arrive après le cargo, ou se reconnecte après, trouve l'épave : rien ne se joue (le serveur ne donne plus
//   `cargoDans`). Celui qui arrive pendant l'approche la voit finir.
//
// Le temps est celui de performance.now() (ms), comme la scène du choc.

import type { EtatPhareVu } from "../../commun/src/phare.ts";
import type { Cadrage } from "./rendu/scene.ts";
import { mouvementsReduits } from "./rendu/secousse.ts";

/** Le recul sur la tour : aller, rester, revenir (s) ; le point regardé (le milieu de la tour, repère du jeu) et le zoom. */
export const RECUL_TOUR = { aller: 0.7, reste: 2.4, retour: 0.7, x: 20, y: 13, z: 19, zoom: 2.6 } as const;
/** Le cadrage de la crique : il commence 7 s avant le choc, finit 1 s après l'épave revenue du fondu. */
export const CADRAGE_CRIQUE = { avantChoc: 7, aller: 0.9, retour: 0.9, x: 22, y: -6, z: 45, zoom: 2.4 } as const;
/** Les secondes de la scène du choc (client/src/phare.ts, SCENE_CARGO) dont dépend le cadrage. */
const CHOC_S = 3.8;
const FIN_SCENE_S = 6.2;
/** Les feux du cargo : visibles dans les 40 dernières secondes, du large jusqu'à l'entrée de la crique (repère du jeu). */
export const FEUX_CARGO = { avantS: 40, depart: { x: 10, z: 112 }, arrivee: { x: 23, z: 52 } } as const;
/** La corne grave du cargo au large, en secondes avant l'échouage : 10 s après l'allumage (on sait vite qu'il vient), et à 110 s. */
export const CORNES_CARGO_S = [110, 10] as const;
/** À moins de cette distance, un Éteint annule le cadrage (le mode Combat se met au même seuil). */
export const PROCHE_ETEINT = 6;

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
  /** Un cadrage annulé (un Éteint trop près) ne reprend pas. */
  private annule = new Set<"recul" | "crique">();
  private cornes = new Set<number>();
  private readonly reduit: () => boolean;

  constructor(reduit: () => boolean = mouvementsReduits) {
    this.reduit = reduit;
  }

  /** Le message `phare` : `avant`, l'état d'avant (null : le premier, à l'arrivée : on ne rejoue pas l'allumage). */
  recevoir(avant: EtatPhareVu | null, etat: EtatPhareVu, maintenant: number): void {
    if (avant && !avant.lanterne && etat.lanterne) {
      this.recul = maintenant;
      this.annule.delete("recul");
    }
    if (etat.cargoDans !== undefined) {
      // Un nouveau cargo en route (le premier, ou celui d'un nouvel allumage, la nuit suivante) : tout repart.
      if (this.cargoPrevu === null || (this.cargoArrive !== null && maintenant - this.cargoArrive > 30_000)) {
        this.cargoArrive = null;
        this.cornes.clear();
        this.annule.delete("crique");
      }
      this.cargoPrevu = maintenant + etat.cargoDans;
      // Une approche qu'on prend en route : les cornes déjà passées ne sonnent pas après coup.
      for (const s of CORNES_CARGO_S) if (etat.cargoDans < s * 1000 - 1500) this.cornes.add(s);
    } else if (this.cargoArrive === null) this.cargoPrevu = null;
  }

  /** Le serveur annonce l'échouage : la scène du choc commence. */
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

  /** La corne des dernières secondes a-t-elle sonné ? (la scène du choc ne la redouble pas) */
  get corneProcheJouee(): boolean {
    return this.cornes.has(CORNES_CARGO_S[CORNES_CARGO_S.length - 1]!);
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
   * Le cadrage de cette image (null : la caméra suit le joueur). `menace` : un Éteint debout à moins de 6 m (le cadrage
   * s'annule, et ne reprend pas). Rien si le système demande de réduire les mouvements.
   */
  cadrage(maintenant: number, joueur: VueJoueur, menace: boolean): Cadrage | null {
    if (this.reduit()) return null;
    const vers = (k: number, c: { x: number; y: number; z: number; zoom: number }): Cadrage => ({
      x: joueur.x + (c.x - joueur.x) * k,
      z: joueur.z + (c.z - joueur.z) * k,
      y: joueur.y + (c.y - joueur.y) * k,
      zoom: joueur.zoom + (c.zoom - joueur.zoom) * k,
    });
    // Le cadrage de la crique passe avant le recul (ils ne se croisent pas : 2 min les séparent).
    if (this.cargoPrevu !== null && !this.annule.has("crique")) {
      const debut = this.cargoPrevu + CHOC_S * 1000 - CADRAGE_CRIQUE.avantChoc * 1000;
      const fin = (this.cargoArrive ?? Math.max(this.cargoPrevu, maintenant)) + (FIN_SCENE_S + 1) * 1000;
      if (maintenant >= debut && maintenant < fin) {
        if (menace) {
          this.annule.add("crique");
          return null;
        }
        const t = (maintenant - debut) / 1000;
        // Tant que l'échouage n'est pas annoncé, on reste sur la crique ; après, on revient à la fin de la scène.
        const k = this.cargoArrive === null ? lisse(t / CADRAGE_CRIQUE.aller) : poidsCadrage(t, (fin - debut) / 1000, CADRAGE_CRIQUE.aller, CADRAGE_CRIQUE.retour);
        if (k > 0) return vers(k, CADRAGE_CRIQUE);
      }
    }
    if (this.recul !== null && !this.annule.has("recul")) {
      const t = (maintenant - this.recul) / 1000;
      const duree = RECUL_TOUR.aller + RECUL_TOUR.reste + RECUL_TOUR.retour;
      if (t >= duree) this.recul = null;
      else if (menace) this.annule.add("recul");
      else {
        const k = poidsCadrage(t, duree, RECUL_TOUR.aller, RECUL_TOUR.retour);
        if (k > 0) return vers(k, RECUL_TOUR);
      }
    }
    return null;
  }
}
