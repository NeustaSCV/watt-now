// Les autres joueurs fluides (0.9, chantier B, plan-0.9 §3.1) : on les montre 150 ms en arrière, en ligne droite entre
// les deux positions reçues qui encadrent ce moment, d'après l'heure du serveur. Sans Three.js, pour le tester seul.

import type { AllureVue } from "../../../commun/src/messages.ts";

/** Le retard d'affichage des autres (ms, Q-2) : 1,5 envoi. */
export const RETARD_AFFICHAGE = 150;
/** Le pas d'envoi des présences au serveur (ms). */
const PAS_ENVOI = 100;
/** Au-delà de cet écart entre deux positions reçues (ms), le joueur était immobile entre les deux (rien n'est envoyé). */
const SEUIL_TROU = 175;
/** Au-delà de cet écart (m) entre deux positions (entrée dans le lieu, réapparition), il est posé directement. */
const SAUT = 3;
/** Sans paquet, il continue au plus ce temps (ms) dans la même direction, puis s'arrête sur place. */
const EXTRAPOLATION = 100;

/**
 * L'heure du serveur vue du client, recalée sur les heures reçues (`h` de `positions`). Elle suit l'arrivée moyenne
 * des paquets : le retard de 150 ms compte donc à partir de leur arrivée habituelle, latence comprise. Elle se recale
 * doucement (au plus 2 % du temps écoulé), sans saut, sauf grand écart (veille du téléphone, reconnexion).
 */
export class HorlogeServeur {
  /** L'écart visé (heure du serveur − heure locale), lissé sur les paquets. */
  private vise: number | null = null;
  /** L'écart appliqué, qui rejoint `vise` doucement. */
  private ecart = 0;
  private dernier = 0;

  /** Un paquet d'heure `h` (serveur) arrive à `maintenant` (heure locale, ms). */
  recaler(h: number, maintenant: number): void {
    const mesure = h - maintenant;
    if (this.vise === null || Math.abs(mesure - this.vise) > 1000) {
      this.vise = mesure;
      this.ecart = mesure;
      this.dernier = maintenant;
      return;
    }
    this.vise += (mesure - this.vise) * 0.1;
  }

  /** L'heure du serveur à `maintenant` (heure locale, ms) ; null tant qu'aucun paquet n'est arrivé. */
  heure(maintenant: number): number | null {
    if (this.vise === null) return null;
    const pas = Math.max(0, maintenant - this.dernier) * 0.02;
    this.ecart += Math.max(-pas, Math.min(pas, this.vise - this.ecart));
    this.dernier = maintenant;
    return maintenant + this.ecart;
  }
}

interface Point {
  h: number;
  x: number;
  z: number;
  o: number;
  allure: AllureVue;
}

/** Ce qu'on montre d'un autre joueur à un instant : où, tourné vers où, à quelle allure et à quelle vitesse (m/s). */
export interface Echantillon {
  x: number;
  z: number;
  o: number;
  allure: AllureVue;
  vitesse: number;
}

function angle(a: number, b: number, k: number): number {
  return a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;
}

/** Le tampon des positions horodatées d'un autre joueur. */
export class Interpolateur {
  private points: Point[] = [];

  /** Sa position connue sans heure (son entrée dans le champ, message « autres ») : tenue jusqu'au premier paquet. */
  constructor(x: number, z: number, o: number) {
    this.points.push({ h: -Infinity, x, z, o, allure: 0 });
  }

  /** Une position reçue, à l'heure du serveur `h`. */
  recevoir(h: number, x: number, z: number, o: number, allure: AllureVue): void {
    const dernier = this.points[this.points.length - 1]!;
    if (h <= dernier.h) return;
    if (Math.hypot(x - dernier.x, z - dernier.z) > SAUT) {
      // Un saut : posé directement, sans glisser d'un point à l'autre.
      this.points = [{ h, x, z, o, allure }];
      return;
    }
    // Immobile un moment, rien n'est parti : il était encore là un envoi avant de bouger.
    if (h - dernier.h > SEUIL_TROU) this.points.push({ ...dernier, h: h - PAS_ENVOI });
    this.points.push({ h, x, z, o, allure });
  }

  /** Ce qu'on montre à l'heure du serveur `instant` : sa position 150 ms plus tôt. */
  echantillon(instant: number): Echantillon {
    const t = instant - RETARD_AFFICHAGE;
    const p = this.points;
    // On ne garde que le point juste avant `t` (et celui d'avant, pour prolonger la direction).
    while (p.length > 2 && p[1]!.h <= t) p.shift();
    // Avant le premier point gardé (posé par un saut) : il est déjà là.
    if (t < p[0]!.h) return { ...p[0]!, vitesse: 0 };
    const dernier = p[p.length - 1]!;
    if (t >= dernier.h) {
      const avant = p.length > 1 ? p[p.length - 2]! : null;
      if (!avant || dernier.allure === 0 || dernier.h - avant.h > SEUIL_TROU) return { ...dernier, vitesse: 0 };
      // Plus rien n'arrive : il continue au plus 100 ms, puis s'arrête sur place.
      const duree = Math.min(t - dernier.h, EXTRAPOLATION);
      const vx = (dernier.x - avant.x) / (dernier.h - avant.h);
      const vz = (dernier.z - avant.z) / (dernier.h - avant.h);
      const enCours = t - dernier.h < EXTRAPOLATION;
      return {
        x: dernier.x + vx * duree,
        z: dernier.z + vz * duree,
        o: dernier.o,
        allure: enCours ? dernier.allure : 0,
        vitesse: enCours ? Math.hypot(vx, vz) * 1000 : 0,
      };
    }
    let i = 0;
    while (p[i + 1]!.h <= t) i++;
    const a = p[i]!;
    const b = p[i + 1]!;
    const k = (t - a.h) / (b.h - a.h);
    const distance = Math.hypot(b.x - a.x, b.z - a.z);
    // L'allure du segment : celle du point d'arrivée ; s'il s'arrête au bout (0), celle qu'il avait en y allant.
    const allure = b.allure !== 0 || distance < 0.01 ? b.allure : a.allure;
    return {
      x: a.x + (b.x - a.x) * k,
      z: a.z + (b.z - a.z) * k,
      o: angle(a.o, b.o, k),
      allure,
      vitesse: (distance / (b.h - a.h)) * 1000,
    };
  }
}

/** Les gestes d'un autre joueur, joués à leur heure, avec le même retard que sa position. */
export class FileGestes<G extends { h: number }> {
  private file: G[] = [];

  mettre(g: G): void {
    this.file.push(g);
    this.file.sort((a, b) => a.h - b.h);
  }

  /** Les gestes dont l'heure est venue à l'heure du serveur `instant`, retard compris (chacun une seule fois). */
  sortir(instant: number): G[] {
    const t = instant - RETARD_AFFICHAGE;
    let n = 0;
    while (n < this.file.length && this.file[n]!.h <= t) n++;
    return n === 0 ? [] : this.file.splice(0, n);
  }
}

/** Vitesse propre des animations de déplacement (m/s, mesurée sur la bibliothèque, ramenée à 1,75 m). */
export const VITESSE_ANIM = { accroupi: 0.71, marche: 0.93, trot: 5.1 } as const;

/**
 * Le clip de déplacement d'un autre joueur d'après l'allure reçue (null : immobile, au repos), et sa cadence. La
 * vitesse réelle ne règle que la cadence : freiné au gué ou chargé, il reste en marche, il marche lentement.
 */
export function clipDAllure(allure: AllureVue, vitesse: number): { nom: string; cadence: number } | null {
  switch (allure) {
    case 0:
      return null;
    case 1:
      return { nom: "Crouch_Fwd_Loop", cadence: Math.max(0.5, Math.min(1.8, vitesse / VITESSE_ANIM.accroupi)) };
    case 2:
      return { nom: "Walk_Loop", cadence: Math.max(0.5, Math.min(2.2, vitesse / VITESSE_ANIM.marche)) };
    case 3:
      return { nom: "Jog_Fwd_Loop", cadence: Math.max(0.7, vitesse / VITESSE_ANIM.trot) };
  }
}
