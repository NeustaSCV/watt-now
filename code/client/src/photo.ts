// Le mode photo (Book 21 §5.2.7, outil de vitrine) : l'interface disparaît, on règle l'heure, le temps,
// l'angle de la caméra et le zoom, pour des captures utilisables telles quelles. P pour entrer et sortir,
// H pour masquer ce panneau.

import type { Temps } from "../../commun/src/meteo.ts";

export interface ReglagesPhoto {
  heure: number;
  temps: Temps | null;
  /** En degrés, 0 à 360. */
  angle: number;
  zoom: number;
}

export class ModePhoto {
  actif = false;
  readonly reglages: ReglagesPhoto = { heure: 6.5, temps: null, angle: 45, zoom: 1 };
  private readonly panneau: HTMLElement;
  private readonly hud: HTMLElement;
  private readonly changer: () => void;

  constructor(hud: HTMLElement, changer: () => void) {
    this.hud = hud;
    this.changer = changer;
    this.panneau = document.createElement("div");
    this.panneau.className = "photo";
    this.panneau.hidden = true;
    document.body.append(this.panneau);
  }

  basculer(heureActuelle: number, zoom: number): void {
    this.actif = !this.actif;
    this.hud.classList.toggle("en-photo", this.actif);
    this.panneau.hidden = !this.actif;
    if (this.actif) {
      this.reglages.heure = Math.round(heureActuelle * 4) / 4;
      this.reglages.zoom = zoom;
      this.dessiner();
    }
    this.changer();
  }

  masquerPanneau(): void {
    if (this.actif) this.panneau.hidden = !this.panneau.hidden;
  }

  private dessiner(): void {
    const r = this.reglages;
    const h = Math.floor(r.heure);
    const m = Math.round((r.heure - h) * 60);
    this.panneau.innerHTML = `
      <strong>Mode photo</strong>
      <label>Heure <span>${String(h).padStart(2, "0")} h ${String(m).padStart(2, "0")}</span>
        <input type="range" min="0" max="23.75" step="0.25" value="${r.heure}" data-r="heure"></label>
      <label>Temps
        <select data-r="temps">${[["", "Celui du monde"], ["soleil", "Soleil"], ["voile", "Voilé"], ["couvert", "Couvert"], ["pluie", "Pluie"]]
          .map(([v, n]) => `<option value="${v}" ${(r.temps ?? "") === v ? "selected" : ""}>${n}</option>`)
          .join("")}</select></label>
      <label>Angle <span>${Math.round(r.angle)}°</span><input type="range" min="0" max="360" step="1" value="${r.angle}" data-r="angle"></label>
      <label>Zoom <span>×${r.zoom.toFixed(2)}</span><input type="range" min="0.6" max="1.7" step="0.01" value="${r.zoom}" data-r="zoom"></label>
      <small>P : quitter · H : masquer ce panneau</small>`;
    for (const el of this.panneau.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-r]")) {
      el.addEventListener("input", () => {
        const cle = el.dataset.r as keyof ReglagesPhoto;
        if (cle === "temps") r.temps = (el.value || null) as Temps | null;
        else r[cle] = Number(el.value);
        this.changer();
        const span = el.parentElement?.querySelector("span");
        if (span && cle === "heure") {
          const hh = Math.floor(r.heure);
          span.textContent = `${String(hh).padStart(2, "0")} h ${String(Math.round((r.heure - hh) * 60)).padStart(2, "0")}`;
        }
        if (span && cle === "angle") span.textContent = `${Math.round(r.angle)}°`;
        if (span && cle === "zoom") span.textContent = `×${r.zoom.toFixed(2)}`;
      });
    }
  }
}
