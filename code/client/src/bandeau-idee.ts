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

/** Un rectangle à l'écran (px), comme `getBoundingClientRect()`. */
export interface Boite {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** L'écart (px) entre le message et un panneau, et le bord bas qu'il ne dépasse pas. */
export const ECART_PANNEAU = 8;

function chevauche(a: Boite, b: Boite): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

/**
 * Où poser le message (plan 0.8.2 §7.6) : il ne recouvre jamais un panneau ouvert (le carnet du tutoriel, ouvert d'office
 * sur téléphone, le sac, une fiche…). À sa place s'il n'y touche pas (`null`) ; sinon juste sous les panneaux qu'il
 * croise (le haut, en px) s'il y tient avant le bas de l'écran ; sinon il attend qu'on les ferme (`"attendre"`).
 */
export function placerIdee(idee: Boite, obstacles: readonly Boite[], hauteurEcran: number): number | null | "attendre" {
  if (!obstacles.some((o) => chevauche(idee, o))) return null;
  const hauteur = idee.bottom - idee.top;
  let haut = idee.top;
  // Sous le plus bas des panneaux qu'il croise, puis encore dessous si la nouvelle place en croise un autre.
  for (let essai = 0; essai < obstacles.length + 1; essai++) {
    // (Pas de `...idee` : les côtés d'un DOMRect sont des accesseurs, que la décomposition ne copie pas.)
    const boite = { left: idee.left, right: idee.right, top: haut, bottom: haut + hauteur };
    const croises = obstacles.filter((o) => chevauche(boite, o));
    if (croises.length === 0) return haut + hauteur <= hauteurEcran - ECART_PANNEAU ? haut : "attendre";
    haut = Math.max(...croises.map((o) => o.bottom)) + ECART_PANNEAU;
  }
  return "attendre";
}

/** Ce dont le message a besoin du navigateur (le vrai `window` en jeu ; une fausse horloge dans les tests). */
export interface Horloge {
  setTimeout(f: () => void, ms: number): number;
  clearTimeout(id: number | undefined): void;
}

/** Tous les combien (ms) le message regarde si un panneau s'est ouvert sous lui, ou s'il peut enfin venir. */
export const VEILLE_PANNEAUX_MS = 300;

export class BandeauIdee {
  private readonly element: HTMLElement;
  private readonly file: IdeeAMontrer[] = [];
  private minuterie: number | undefined;
  private veille: number | undefined;
  private visible = false;
  private courante: IdeeAMontrer | null = null;
  private readonly horloge: Horloge;
  /** Les panneaux ouverts que le message ne doit pas recouvrir, et la hauteur de l'écran (absent : pas de placement). */
  private readonly ecran: { obstacles: () => Boite[]; hauteur: () => number } | undefined;

  constructor(parent: HTMLElement, horloge: Horloge = window, ecran?: { obstacles: () => Boite[]; hauteur: () => number }) {
    this.horloge = horloge;
    this.ecran = ecran;
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
    this.horloge.clearTimeout(this.veille);
    const i = this.file.shift();
    this.element.classList.remove("sortie");
    this.courante = i ?? null;
    if (!i) {
      this.visible = false;
      this.element.hidden = true;
      this.element.innerHTML = "";
      return;
    }
    this.visible = true;
    this.element.innerHTML = htmlBandeau(i);
    this.element.hidden = false;
    if (!this.placer()) return;
    this.minuterie = this.horloge.setTimeout(() => this.sortir(), dureeIdee(i));
    if (this.ecran) this.veille = this.horloge.setTimeout(() => this.veiller(), VEILLE_PANNEAUX_MS);
  }

  /**
   * Pose le message hors des panneaux ouverts. Faux s'il n'y a pas la place : l'idée retourne en tête de la file,
   * le message se cache, et l'on réessaie un peu plus tard (on ne la perd pas, on ne la montre pas par-dessus).
   */
  private placer(): boolean {
    if (!this.ecran) return true;
    const style = this.element.style;
    style.top = "";
    style.bottom = "";
    const ici = placerIdee(this.element.getBoundingClientRect(), this.ecran.obstacles(), this.ecran.hauteur());
    if (ici === "attendre") {
      if (this.courante) this.file.unshift(this.courante);
      this.courante = null;
      this.element.hidden = true;
      this.element.innerHTML = "";
      this.horloge.clearTimeout(this.minuterie);
      this.minuterie = this.horloge.setTimeout(() => this.suivante(), VEILLE_PANNEAUX_MS);
      return false;
    }
    if (ici !== null) {
      style.top = `${Math.round(ici)}px`;
      style.bottom = "auto";
    }
    return true;
  }

  /** Pendant qu'il est là : un panneau qui s'ouvre le pousse dessous, ou le renvoie attendre. */
  private veiller(): void {
    if (!this.courante || this.element.classList.contains("sortie")) return;
    if (!this.placer()) return;
    this.veille = this.horloge.setTimeout(() => this.veiller(), VEILLE_PANNEAUX_MS);
  }
}
