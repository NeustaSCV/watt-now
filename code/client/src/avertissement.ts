// Un avertissement du carnet (plan 0.8 §2.6, chantier 13) : la première nuit, une bûche du terrain mise au feu quand
// il en reste moins de 6 (B14). Un bandeau dans la charte du carnet (papier crème, encre brune, un filet rouge), avec
// un bouton « Compris » : jamais une fenêtre à croix (règle du porteur : « les dialogues avec une croix cassent
// complètement la dynamique de jeu »). Il reste jusqu'au bouton : c'est un avertissement, on le lit.

import { icone } from "./icones.ts";

export interface AvertissementAMontrer {
  texte: string;
  /** Le libellé du bouton qui le ferme (« Compris »). */
  bouton: string;
  /** De quoi il parle : l'icône de l'objet (la bûche). */
  objet?: "buche";
}

/** Le contenu du bandeau, en HTML (pur, pour les tests) : pas de croix, un seul bouton. */
export function htmlAvertissement(a: AvertissementAMontrer): string {
  const echapper = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `${a.objet ? `<span class="sujet" aria-hidden="true">${icone(a.objet, 34)}</span>` : ""}
    <p><strong>Le carnet</strong><span class="texte">${echapper(a.texte)}</span></p>
    <button type="button" class="compris">${echapper(a.bouton)}</button>`;
}

export class BandeauAvertissement {
  private readonly element: HTMLElement;

  constructor(parent: HTMLElement) {
    this.element = document.createElement("div");
    this.element.className = "bandeau-avertissement";
    this.element.setAttribute("role", "alert");
    this.element.hidden = true;
    parent.append(this.element);
  }

  /** Montre l'avertissement (il remplace celui d'avant, s'il en reste un) ; il se ferme par son bouton. */
  montrer(a: AvertissementAMontrer): void {
    this.element.innerHTML = htmlAvertissement(a);
    this.element.hidden = false;
    this.element.querySelector(".compris")!.addEventListener("click", () => this.fermer());
  }

  fermer(): void {
    this.element.hidden = true;
  }

  get visible(): boolean {
    return !this.element.hidden;
  }
}
