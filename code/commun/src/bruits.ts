// Ce qu'on entend sans le voir (0.7.2, proposition « visibilité par pièce » §1.6) : les bruits des Éteints cachés.
//
// Le serveur n'envoie pas au joueur les Éteints qu'il ne voit pas (lieu-vivant.ts). Avant, ils étaient donc muets : le
// client jouait leurs sons à partir des Éteints reçus. Maintenant, le serveur tient le fil de leurs bruits (pas, râles,
// coups dans une porte…) et envoie à chaque joueur ceux qu'il entend sans en voir la source (message `bruits`) :
// - le genre du bruit ;
// - sa force, déjà étouffée par les murs et les portes (0 : à peine, 1 : tout près) ;
// - un point de passage, de notre côté : le milieu de la porte par où il arrive, ou le mur le plus proche.
// Jamais la position de l'Éteint, ni son numéro : un client modifié n'en apprend pas plus qu'une oreille.

import type { EtatEteint } from "./eteints.ts";

export type GenreBruit =
  | "pas"
  | "pas_presses"
  | "rale"
  | "rale_rapide"
  | "halete"
  | "souffle"
  | "gemissement"
  | "rale_coupe"
  | "coups"
  | "chute"
  /** Un Éteint à moins de 3 m, derrière le mur : on le sent (onde rouge, souffle). */
  | "presence";

/** Un bruit tel que le joueur le reçoit. */
export interface BruitVu {
  g: GenreBruit;
  /** Sa force, déjà étouffée (0 à 1). */
  f: number;
  /** Le point de passage, de notre côté. */
  x: number;
  z: number;
  /** Une porte qu'on pousse (elle tremble). */
  porte?: string;
}

/** Jusqu'où porte chaque bruit, à l'air libre (m) : les mêmes portées que les sons du client (son/catalogue.ts). */
export const PORTEES_BRUIT: Record<GenreBruit, number> = {
  pas: 25,
  pas_presses: 30,
  rale: 25,
  rale_rapide: 30,
  halete: 30,
  souffle: 3,
  gemissement: 25,
  rale_coupe: 25,
  coups: 30,
  chute: 25,
  presence: 3,
};

/** Les bruits qui alarment : l'onde est rouge (coups dans la porte, présence toute proche). */
export function bruitAlarmant(g: GenreBruit): boolean {
  return g === "coups" || g === "presence" || g === "rale_rapide" || g === "pas_presses";
}

/** Un bruit émis, avec sa source (côté serveur seulement : on ne l'envoie jamais). */
export interface BruitEmis {
  g: GenreBruit;
  x: number;
  z: number;
  porte?: string;
}

/** Ce qu'il faut savoir d'un Éteint pour l'entendre. */
export interface SourceBruit {
  id: number;
  x: number;
  z: number;
  etat: EtatEteint;
  gemit?: number;
}

interface Suivi {
  etat: EtatEteint;
  x: number;
  z: number;
  foulee: number;
  prochainCri: number;
  prochainCoup: number;
  gemit: boolean;
}

/**
 * Le fil des bruits des Éteints d'un lieu, à appeler à chaque envoi (5 fois par seconde). Le même rythme que les sons
 * du client (son/bruiteur.ts) : pas à chaque foulée, râles espacés pour l'errant, rapprochés pour le poursuivant, le
 * râle coupé net quand il est attiré. Un Éteint attiré ou poursuivant qui bute contre une porte fermée cogne.
 */
export class FilDesBruits {
  private readonly suivis = new Map<number, Suivi>();
  private t = 0;

  /**
   * Les bruits émis pendant `dt` secondes. `porteContre` : la porte fermée contre laquelle se tient ce point (null :
   * aucune). `alea` : un tirage entre 0 et 1.
   */
  ecouter(sources: readonly SourceBruit[], dt: number, alea: () => number, porteContre: (x: number, z: number) => string | null): BruitEmis[] {
    this.t += dt;
    const emis: BruitEmis[] = [];
    const vus = new Set<number>();
    for (const e of sources) {
      vus.add(e.id);
      let s = this.suivis.get(e.id);
      if (!s) {
        s = { etat: e.etat, x: e.x, z: e.z, foulee: 0, prochainCri: this.t + 0.5 + alea() * 3, prochainCoup: 0, gemit: false };
        this.suivis.set(e.id, s);
      }
      const ou = { x: e.x, z: e.z };
      if (e.etat === "detruit") {
        s.etat = e.etat;
        continue;
      }
      if (e.etat !== s.etat) {
        if (e.etat === "attire" && s.etat !== "poursuivant") emis.push({ g: "rale_coupe", ...ou });
        else if (e.etat === "poursuivant") emis.push({ g: "rale_rapide", ...ou });
        else if (e.etat === "a_terre") emis.push({ g: "chute", ...ou });
        if (e.etat === "attire" || e.etat === "poursuivant") s.prochainCri = this.t + 1.5;
      }
      s.etat = e.etat;
      const gemit = (e.gemit ?? 0) > 0;
      if (gemit && !s.gemit) emis.push({ g: "gemissement", ...ou });
      s.gemit = gemit;
      const bouge = Math.hypot(e.x - s.x, e.z - s.z);
      s.x = e.x;
      s.z = e.z;
      const actif = e.etat === "attire" || e.etat === "poursuivant";
      // Les pas.
      if (e.etat === "errant" || actif) {
        s.foulee += bouge;
        const presse = e.etat === "poursuivant";
        if (s.foulee >= (presse ? 0.8 : 0.6)) {
          s.foulee = 0;
          emis.push({ g: presse ? "pas_presses" : "pas", ...ou });
        }
      }
      // Il pousse une porte fermée : il cogne, et la porte tremble (Book 23 §2.2).
      if (actif && bouge < 0.08 * Math.max(1, dt / 0.2) && this.t >= s.prochainCoup) {
        const porte = porteContre(e.x, e.z);
        if (porte) {
          emis.push({ g: "coups", ...ou, porte });
          s.prochainCoup = this.t + 0.6 + alea() * 0.5;
        }
      }
      // Les râles et les souffles, à intervalles irréguliers.
      if (this.t >= s.prochainCri) {
        if (e.etat === "dormant") {
          emis.push({ g: "souffle", ...ou });
          s.prochainCri = this.t + 3 + alea() * 1.5;
        } else if (e.etat === "errant") {
          emis.push({ g: "rale", ...ou });
          s.prochainCri = this.t + 4 + alea() * 6;
        } else if (e.etat === "attire") {
          if (alea() < 0.4) emis.push({ g: "halete", ...ou });
          s.prochainCri = this.t + 3 + alea() * 3;
        } else if (e.etat === "poursuivant") {
          emis.push({ g: alea() < 0.75 ? "rale_rapide" : "halete", ...ou });
          s.prochainCri = this.t + 1.2 + alea() * 1.6;
        } else s.prochainCri = this.t + 2;
      }
    }
    for (const id of this.suivis.keys()) if (!vus.has(id)) this.suivis.delete(id);
    return emis;
  }
}
