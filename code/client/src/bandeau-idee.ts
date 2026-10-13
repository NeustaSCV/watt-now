// « Tu y penses » (plan 0.8 §2.2 et §2.6, chantier 2 ; plan 0.8.2, chantier H, R22) : la première fois qu'on ramasse une
// clé, un message d'information dans la voix du carnet, avec l'icône de la trouvaille et l'idée. Depuis la 0.8.2, il
// n'appelle aucune action : **pas de bouton**, un fond plus transparent, il ne prend ni le toucher ni la souris (on joue
// à travers) et il part tout seul (règle du porteur : un message d'information n'a pas de bouton et part seul ; jamais
// de fenêtre à croix). Plusieurs idées d'un coup (une fouille) passent l'une après l'autre. Le son, court et chaleureux,
// est joué par l'appelant.

import type { TypeObjet } from "../../commun/src/objets.ts";
import { icone } from "./icones.ts";

/** Le temps le plus long qu'un message reste (ms) : une idée longue se lit sans se presser. */
export const DUREE_BANDEAU_MS = 9000;
/** Le temps le plus court (ms) : même une idée de trois mots laisse le temps de voir l'icône. */
export const DUREE_BANDEAU_MIN_MS = 5000;
/** Le fondu de sortie (ms), avant de passer à l'idée suivante. */
export const FONDU_BANDEAU_MS = 300;

export interface IdeeAMontrer {
  texte: string;
  /** Le niveau d'avant n'est pas posé : l'idée est gardée pour plus tard. */
  plusTard: boolean;
  objet?: TypeObjet;
}

/** Combien de temps une idée reste : de quoi la lire (≈ 15 caractères par seconde), entre 5 et 9 s. */
export function dureeIdee(i: IdeeAMontrer): number {
  return Math.round(Math.min(DUREE_BANDEAU_MS, Math.max(DUREE_BANDEAU_MIN_MS, 2500 + i.texte.length * 65)));
}

/** Le contenu du message, en HTML (pur, pour les tests) : l'icône, « Tu y penses », l'idée. Aucun bouton. */
export function htmlBandeau(i: IdeeAMontrer): string {
  const echapper = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `${i.objet ? `<span class="trouvaille" aria-hidden="true">${icone(i.objet, 30)}</span>` : `<span class="trouvaille ampoule" aria-hidden="true">💡</span>`}
    <p><strong>Tu y penses</strong>${i.plusTard ? `<em> · gardé pour plus tard</em>` : ""}<span class="texte">${echapper(i.texte)}</span></p>`;
}

/** Ce dont le message a besoin du navigateur (le vrai `window` en jeu ; une fausse horloge dans les tests). */
export interface Horloge {
  setTimeout(f: () => void, ms: number): number;
  clearTimeout(id: number | undefined): void;
}

export class BandeauIdee {
  private readonly element: HTMLElement;
  private readonly file: IdeeAMontrer[] = [];
  private minuterie: number | undefined;
  private visible = false;
  private readonly horloge: Horloge;

  constructor(parent: HTMLElement, horloge: Horloge = window) {
    this.horloge = horloge;
    this.element = parent.ownerDocument.createElement("div");
    this.element.className = "bandeau-idee";
    this.element.setAttribute("role", "status");
    this.element.setAttribute("aria-live", "polite");
    this.element.hidden = true;
    parent.append(this.element);
  }

  /** Une idée de plus : montrée tout de suite, ou après celle qu'on lit. Renvoie vrai si elle part maintenant. */
  montrer(i: IdeeAMontrer): boolean {
    this.file.push(i);
    if (this.visible) return false;
    this.suivante();
    return true;
  }

  /** L'idée qu'on lit part en fondu, puis la suivante vient (ou le message se cache). */
  private sortir(): void {
    this.element.classList.add("sortie");
    this.minuterie = this.horloge.setTimeout(() => this.suivante(), FONDU_BANDEAU_MS);
  }

  private suivante(): void {
    this.horloge.clearTimeout(this.minuterie);
    const i = this.file.shift();
    this.element.classList.remove("sortie");
    if (!i) {
      this.visible = false;
      this.element.hidden = true;
      this.element.innerHTML = "";
      return;
    }
    this.visible = true;
    this.element.innerHTML = htmlBandeau(i);
    this.element.hidden = false;
    this.minuterie = this.horloge.setTimeout(() => this.sortir(), dureeIdee(i));
  }
}
