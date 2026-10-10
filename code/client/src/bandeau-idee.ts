// « Tu y penses » (plan 0.8 §2.2 et §2.6, chantier 2) : la première fois qu'on ramasse une clé, un bandeau dans la voix
// du carnet, avec l'icône de la trouvaille et l'idée. Il passe tout seul, ou se ferme d'un bouton : jamais une fenêtre
// à croix (règle du porteur : « les dialogues avec une croix cassent complètement la dynamique de jeu »). Plusieurs
// idées d'un coup (une fouille) passent l'une après l'autre. Le son, court et chaleureux, est joué par l'appelant.

import type { TypeObjet } from "../../commun/src/objets.ts";
import { icone } from "./icones.ts";

/** Le temps qu'un bandeau reste, s'il n'est pas fermé avant (ms) : de quoi lire deux lignes sans se presser. */
export const DUREE_BANDEAU_MS = 9000;

export interface IdeeAMontrer {
  texte: string;
  /** Le niveau d'avant n'est pas posé : l'idée est gardée pour plus tard. */
  plusTard: boolean;
  objet?: TypeObjet;
}

/** Le contenu du bandeau, en HTML (pur, pour les tests). */
export function htmlBandeau(i: IdeeAMontrer): string {
  const echapper = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `${i.objet ? `<span class="trouvaille" aria-hidden="true">${icone(i.objet, 34)}</span>` : `<span class="trouvaille ampoule" aria-hidden="true">💡</span>`}
    <p><strong>Tu y penses</strong>${i.plusTard ? `<em> · gardé pour plus tard</em>` : ""}<span class="texte">${echapper(i.texte)}</span></p>
    <button type="button" class="garder">${i.plusTard ? "Je le garde" : "Noté"}</button>`;
}

export class BandeauIdee {
  private readonly element: HTMLElement;
  private readonly file: IdeeAMontrer[] = [];
  private minuterie: number | undefined;
  private visible = false;

  constructor(parent: HTMLElement) {
    this.element = document.createElement("div");
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

  private suivante(): void {
    window.clearTimeout(this.minuterie);
    const i = this.file.shift();
    if (!i) {
      this.visible = false;
      this.element.classList.add("sortie");
      this.minuterie = window.setTimeout(() => {
        this.element.hidden = true;
        this.element.classList.remove("sortie");
      }, 300);
      return;
    }
    this.visible = true;
    this.element.classList.remove("sortie");
    this.element.innerHTML = htmlBandeau(i);
    this.element.hidden = false;
    this.element.querySelector(".garder")!.addEventListener("click", () => this.suivante());
    this.minuterie = window.setTimeout(() => this.suivante(), DUREE_BANDEAU_MS);
  }
}
