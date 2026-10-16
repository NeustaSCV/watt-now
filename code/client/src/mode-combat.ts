// Le mode du joueur (Book 08 §3.3 ; duel 0.11, D-10, D-17, D-20) : Exploration (halo vert) ou Combat (halo rouge).
// Deux états seulement. Le bouton « Explorer / Combat » et la touche X le basculent ; un Éteint debout qui approche met
// en Combat tout seul, mais **rien ne repasse jamais tout seul en Exploration** : seul le joueur y revient (D-17).
// Chaque changement part au serveur (`{ t: "mode", combat }`) : il en fait le halo que voient les autres, et c'est lui
// qui permet, ou non, de frapper un joueur.

/** Un Éteint debout plus près que ça (m) met en Combat. */
export const DISTANCE_BASCULE = 6;
/** Plus aucun Éteint debout plus près que ça (m) : la prochaine approche remettra en Combat. */
export const DISTANCE_CALME = 10;

/** D'où vient un changement de mode : le joueur, un Éteint qui approche, ou le serveur (un coup reçu d'un joueur, D-20). */
export type OrigineMode = "joueur" | "eteint" | "serveur";

export class ModeCombat {
  combat = false;
  /**
   * La bascule automatique est prête : elle se fait une fois par approche. Revenu en Exploration avec un Éteint encore
   * tout près, le joueur y reste (c'est son choix, D-17) ; elle se réarme quand plus rien n'approche à 10 m.
   */
  private armee = true;

  private readonly changer: (combat: boolean, origine: OrigineMode) => void;

  /** `changer` : appelé à chaque changement, d'où qu'il vienne (on l'envoie au serveur, on le montre). */
  constructor(changer: (combat: boolean, origine: OrigineMode) => void) {
    this.changer = changer;
  }

  /** À l'entrée dans un lieu, à chaque connexion : Exploration (D-10), et on le redit au serveur. */
  entrer(): void {
    this.combat = false;
    this.armee = true;
    this.changer(false, "joueur");
  }

  /** Le bouton, la touche X. */
  basculer(): void {
    this.regler(!this.combat, "joueur");
  }

  /**
   * Chaque image : la distance de l'Éteint debout le plus proche (Infinity : aucun). Renvoie vrai si la bascule
   * automatique vient de mettre en Combat.
   */
  surveiller(plusProche: number): boolean {
    if (plusProche > DISTANCE_CALME) this.armee = true;
    if (plusProche >= DISTANCE_BASCULE || !this.armee) return false;
    this.armee = false;
    if (this.combat) return false;
    this.regler(true, "eteint");
    return true;
  }

  /** Le serveur met en Combat (un joueur vert frappé par un rouge, D-20 ; entré dans un duel). Vrai si ça change. */
  imposerCombat(): boolean {
    if (this.combat) return false;
    this.regler(true, "serveur");
    return true;
  }

  private regler(combat: boolean, origine: OrigineMode): void {
    if (combat === this.combat) return;
    this.combat = combat;
    this.changer(combat, origine);
  }
}
