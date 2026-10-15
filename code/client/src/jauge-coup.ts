// Le coup appuyé (Book 08) se voit enfin (0.10, décision du porteur) : en mode Combat, un anneau fait le tour du bouton A
// pendant qu'on le tient, plein en DUREE_APPUI_MS (« coup à la tête prêt »), vidé dès qu'on lâche. Ici, sans navigateur :
// la charge d'un appui tenu, ce que l'anneau montre, et le branchement d'un bouton tactile tenu, sûr sur iPhone.
// Aucune règle ne change : la durée vient de commun/src/combat.ts, le coup se juge toujours au relâchement (entrees.ts).

import { DUREE_APPUI_MS } from "../../commun/src/combat.ts";

/** Un appui qu'on tient puis qu'on lâche (A) : court ou long selon DUREE_APPUI_MS. */
export class AppuiTenu {
  /** Instant de l'appui (ms) ; null : relâché. */
  private debut: number | null = null;
  private readonly horloge: () => number;

  constructor(horloge: () => number = () => performance.now()) {
    this.horloge = horloge;
  }

  get tenu(): boolean {
    return this.debut !== null;
  }

  /** Enfoncé ; faux s'il l'était déjà (un second appui ne recommence pas la charge). */
  appuyer(): boolean {
    if (this.debut !== null) return false;
    this.debut = this.horloge();
    return true;
  }

  /** Relâché : « long » s'il a été tenu au moins DUREE_APPUI_MS ; null s'il n'était pas enfoncé. */
  relacher(): "court" | "long" | null {
    if (this.debut === null) return null;
    const duree = this.horloge() - this.debut;
    this.debut = null;
    return duree >= DUREE_APPUI_MS ? "long" : "court";
  }

  /** Oublié sans rien juger (la fenêtre perd la main). */
  oublier(): void {
    this.debut = null;
  }

  /** La charge : 0 relâché, 1 tenu DUREE_APPUI_MS ou plus. */
  get charge(): number {
    return this.debut === null ? 0 : Math.min(1, (this.horloge() - this.debut) / DUREE_APPUI_MS);
  }
}

/** Ce que l'anneau autour de A montre : sa part remplie (au centième) et « prêt » (plein : le coup ira à la tête). */
export function etatJaugeCoup(charge: number): { part: number; pret: boolean } {
  // Arrondie par défaut : l'anneau n'a l'air plein qu'au moment où il l'est vraiment (le coup appuyé est acquis).
  const c = Math.max(0, Math.min(1, charge));
  return { part: Math.floor(c * 100) / 100, pret: c >= 1 };
}

/** Ce qu'il faut d'un bouton pour le brancher (un HTMLElement ; une cible d'évènements factice dans les tests). */
interface BoutonTenu extends EventTarget {
  setPointerCapture?(id: number): void;
}

/**
 * Un bouton tactile qu'on tient (A) : enfoncé au `pointerdown`, relâché au `pointerup`, et aussi quand le système reprend
 * le doigt (`pointercancel`, la capture perdue) : la charge ne reste jamais pendue. Sur iPhone, l'appui long ne doit
 * déclencher ni la loupe, ni la sélection, ni un menu : le `touchstart` du bouton est retenu (les évènements de pointeur,
 * envoyés avant lui, passent quand même), et le CSS du bouton ajoute `touch-action: none` et `-webkit-touch-callout: none`.
 */
export function brancherBoutonTenu(bouton: BoutonTenu, gestes: { appuyer(): void; relacher(): void }): void {
  bouton.addEventListener("pointerdown", (e) => {
    const p = e as PointerEvent;
    p.preventDefault();
    // La capture garde le relâchement pour le bouton, même si le pouce glisse hors du rond.
    try {
      bouton.setPointerCapture?.(p.pointerId);
    } catch {
      // Le pointeur n'est déjà plus actif : le relâchement arrivera quand même au bouton.
    }
    gestes.appuyer();
  });
  for (const fin of ["pointerup", "pointercancel", "lostpointercapture"]) bouton.addEventListener(fin, () => gestes.relacher());
  bouton.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });
  bouton.addEventListener("contextmenu", (e) => e.preventDefault());
}
