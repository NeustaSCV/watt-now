// L'indicateur hors champ (Book 23 §4.5) : en vue isométrique sur un téléphone, un Éteint qui approche hors de
// l'écran est la première cause probable de mort injuste. Une flèche au bord de l'écran montre d'où il vient ; plus il
// est près, plus elle est nette ; elle bat quand il poursuit.

import * as THREE from "three";
import type { EtatEteint } from "../../commun/src/eteints.ts";

/** On signale ceux qui viennent vers nous (attirés, poursuivants), jusqu'à cette distance. */
const PORTEE = 24;
/** Marge de l'écran (en coordonnées normalisées) : au-delà, il est « hors champ ». */
const BORD = 0.9;

interface Fleche {
  el: HTMLDivElement;
  vu: boolean;
}

export class IndicateurHorsChamp {
  private readonly calque: HTMLDivElement;
  private readonly fleches = new Map<number, Fleche>();
  private readonly v = new THREE.Vector3();

  constructor(parent: HTMLElement) {
    this.calque = document.createElement("div");
    this.calque.className = "hors-champ";
    this.calque.setAttribute("aria-hidden", "true");
    parent.append(this.calque);
  }

  /** À chaque image : les Éteints (position, état) et le joueur. */
  maj(camera: THREE.Camera, eteints: Iterable<{ id: number; x: number; z: number; etat: EtatEteint }>, moi: { x: number; z: number } | null): void {
    for (const f of this.fleches.values()) f.vu = false;
    if (moi) {
      const l = this.calque.clientWidth || window.innerWidth;
      const h = this.calque.clientHeight || window.innerHeight;
      for (const e of eteints) {
        if (e.etat !== "attire" && e.etat !== "poursuivant") continue;
        const d = Math.hypot(e.x - moi.x, e.z - moi.z);
        if (d > PORTEE) continue;
        this.v.set(e.x, 1.2, e.z).project(camera);
        const nx = this.v.x;
        const ny = this.v.y;
        if (Math.abs(nx) <= BORD && Math.abs(ny) <= BORD) continue;
        // Du centre vers lui, ramené sur le bord de l'écran.
        const k = BORD / Math.max(Math.abs(nx), Math.abs(ny));
        const bx = nx * k;
        const by = Math.max(-0.8, Math.min(0.72, ny * k));
        let f = this.fleches.get(e.id);
        if (!f) {
          const el = document.createElement("div");
          el.className = "fleche";
          el.innerHTML = `<svg viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="17" class="fond"/><path d="M14 11 L28 20 L14 29 Z" class="pointe"/></svg>`;
          this.calque.append(el);
          f = { el, vu: true };
          this.fleches.set(e.id, f);
        }
        f.vu = true;
        const angle = Math.atan2(-ny, nx);
        f.el.style.transform = `translate(${((bx + 1) / 2) * l - 20}px, ${((1 - by) / 2) * h - 20}px) rotate(${angle}rad)`;
        f.el.style.opacity = String(0.45 + 0.55 * (1 - d / PORTEE));
        f.el.classList.toggle("poursuit", e.etat === "poursuivant");
      }
    }
    for (const [id, f] of this.fleches) {
      if (f.vu) continue;
      f.el.remove();
      this.fleches.delete(id);
    }
  }
}
