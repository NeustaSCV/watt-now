// L'indicateur hors champ (Book 23 §4.5) : en vue isométrique sur un téléphone, un Éteint qui approche hors de
// l'écran est la première cause probable de mort injuste. Une flèche, sur un cercle autour du personnage, montre d'où
// il vient ; plus il est près, plus elle est nette ; elle bat quand il poursuit.

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
      const centre = this.v.set(moi.x, 1, moi.z).project(camera).clone();
      for (const e of eteints) {
        if (e.etat !== "attire" && e.etat !== "poursuivant") continue;
        const d = Math.hypot(e.x - moi.x, e.z - moi.z);
        if (d > PORTEE) continue;
        this.v.set(e.x, 1.2, e.z).project(camera);
        const nx = this.v.x;
        const ny = this.v.y;
        if (Math.abs(nx) <= BORD && Math.abs(ny) <= BORD) continue;
        // Autour du personnage, dans la direction de l'Éteint : là où le regard se pose, et jamais sur un
        // bouton ou une jauge (les bords de l'écran d'un téléphone en sont couverts).
        const dx = (nx - centre.x) * l;
        const dy = (centre.y - ny) * h;
        const n = Math.hypot(dx, dy) || 1;
        // Une ellipse plus large que haute, comme le sol vu en isométrique (et qui laisse les messages du haut).
        const rx = Math.min(l, h) * 0.36;
        const ry = Math.min(l, h) * 0.22;
        const px = ((centre.x + 1) / 2) * l + (dx / n) * rx;
        const py = ((1 - centre.y) / 2) * h + (dy / n) * ry;
        let f = this.fleches.get(e.id);
        if (!f) {
          const el = document.createElement("div");
          el.className = "fleche";
          el.innerHTML = `<svg viewBox="0 0 40 40" width="48" height="48"><circle cx="20" cy="20" r="17" class="fond"/><path d="M11 11 L30 20 L11 29 L16 20 Z" class="pointe"/></svg>`;
          this.calque.append(el);
          f = { el, vu: true };
          this.fleches.set(e.id, f);
        }
        f.vu = true;
        const angle = Math.atan2(dy, dx);
        f.el.style.transform = `translate(${px - 24}px, ${py - 24}px) rotate(${angle}rad)`;
        f.el.style.opacity = String(0.6 + 0.4 * (1 - d / PORTEE));
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
