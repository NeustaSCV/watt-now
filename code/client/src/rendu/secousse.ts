// La secousse de la caméra (0.10, chantier K : le cargo qui s'échoue au phare) : un tremblement court qui s'amortit et
// revient exactement à zéro. Réutilisable : n'importe quel module la lance (`lancer`) et la fait avancer à chaque image
// (`avancer`), puis donne son décalage à la scène (`Scene.decalageCamera`), qui déplace la caméra et ce qu'elle regarde
// d'autant : l'image glisse, rien ne tourne. Rien du tout si le système demande de réduire les mouvements.

/** Un décalage de la caméra, en mètres (repère du jeu). */
export interface Decalage {
  x: number;
  y: number;
  z: number;
}

/** Ce que le système demande : réduire les mouvements (`prefers-reduced-motion: reduce`). */
export function mouvementsReduits(): boolean {
  try {
    return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** Le tremblement par défaut : assez fort pour se sentir sur un téléphone, assez court pour ne pas donner le mal de mer. */
export const SECOUSSE = { duree: 0.8, force: 0.45 } as const;

/** L'amplitude au temps `t` (s) d'une secousse de `duree` : forte au début, qui s'amortit, nulle à la fin et après. */
export function amplitudeSecousse(t: number, duree: number = SECOUSSE.duree): number {
  if (t < 0 || t >= duree) return 0;
  const reste = 1 - t / duree;
  return reste * reste;
}

export class Secousse {
  /** Le temps écoulé depuis le début de la secousse en cours (s), ou null : rien ne tremble. */
  private t: number | null = null;
  private duree: number = SECOUSSE.duree;
  private force: number = SECOUSSE.force;
  private readonly reduit: () => boolean;
  /** Le décalage de l'image en cours (lu par la scène) : exactement zéro hors d'une secousse. */
  readonly decalage: Decalage = { x: 0, y: 0, z: 0 };

  constructor(reduit: () => boolean = mouvementsReduits) {
    this.reduit = reduit;
  }

  /** Une secousse commence (elle remplace celle en cours) ; rien si les mouvements sont réduits. */
  lancer(force: number = SECOUSSE.force, duree: number = SECOUSSE.duree): void {
    if (this.reduit()) return;
    this.t = 0;
    this.force = force;
    this.duree = duree;
  }

  /** Une secousse est-elle en cours ? */
  get enCours(): boolean {
    return this.t !== null;
  }

  /** Fait avancer la secousse de `dt` secondes, et rend le décalage de cette image. */
  avancer(dt: number): Decalage {
    const d = this.decalage;
    if (this.t === null) return d;
    this.t += dt;
    const a = amplitudeSecousse(this.t, this.duree) * this.force;
    if (a === 0) {
      this.arreter();
      return d;
    }
    // Deux fréquences voisines sur les deux axes au sol, un peu de vertical : un choc sourd, pas une vibration régulière.
    const t = this.t;
    d.x = a * Math.sin(t * 2 * Math.PI * 13);
    d.z = a * Math.sin(t * 2 * Math.PI * 11 + 1.3);
    d.y = a * 0.4 * Math.sin(t * 2 * Math.PI * 9 + 0.7);
    return d;
  }

  /** Plus rien ne tremble (on quitte le lieu, par exemple) : le décalage revient à zéro tout de suite. */
  arreter(): void {
    this.t = null;
    this.decalage.x = this.decalage.y = this.decalage.z = 0;
  }
}
