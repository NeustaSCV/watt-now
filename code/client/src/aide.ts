// Le panneau d'aide (menu ⚙ → Aide, demande du porteur du projet, 2026-10-08) : tous les mécanismes du jeu expliqués,
// sans en dévoiler les secrets, pour le joueur qui se sent perdu. Une rubrique ouverte à la fois ; les touches citées
// sont celles du joueur (ou les boutons, sur téléphone). Le texte est dans aide-contenu.ts.

import { RUBRIQUES_AIDE, type RubriqueAide } from "./aide-contenu.ts";
import { avecTouches } from "./touches.ts";

/** Échappe le texte, puis rend le **gras**. */
function enLigne(texte: string, tactile: boolean): string {
  const sur = avecTouches(texte, tactile).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  return sur.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function bloc(b: RubriqueAide["blocs"][number], tactile: boolean): string {
  if (typeof b === "string") return `<p>${enLigne(b, tactile)}</p>`;
  if ("sous_titre" in b) return `<h4>${enLigne(b.sous_titre, tactile)}</h4>`;
  return `<ul>${b.liste.map((l) => `<li>${enLigne(l, tactile)}</li>`).join("")}</ul>`;
}

export class PanneauAide {
  readonly element: HTMLDivElement;
  /** Appelé à l'ouverture et à la fermeture (le petit son des panneaux). */
  surBascule: ((ouvert: boolean) => void) | null = null;

  private readonly tactile: boolean;

  constructor(parent: HTMLElement, tactile: boolean) {
    this.tactile = tactile;
    this.element = document.createElement("div");
    this.element.className = "aide-jeu";
    this.element.hidden = true;
    this.element.setAttribute("role", "dialog");
    this.element.setAttribute("aria-modal", "true");
    this.element.setAttribute("aria-labelledby", "titre-aide");
    parent.append(this.element);
    // Un clic sur le fond (hors de la fiche) ferme l'aide.
    this.element.addEventListener("pointerdown", (e) => {
      if (e.target === this.element) this.fermer();
    });
  }

  get ouvert(): boolean {
    return !this.element.hidden;
  }

  ouvrir(rubrique?: string): void {
    this.dessiner(rubrique);
    this.element.hidden = false;
    // Pendant la lecture, le joystick et les boutons tactiles s'effacent (ils passaient par-dessus la fiche).
    document.body.classList.add("aide-ouverte");
    this.surBascule?.(true);
    this.element.querySelector<HTMLElement>(".fermer")?.focus({ preventScroll: true });
  }

  fermer(): void {
    if (!this.ouvert) return;
    this.element.hidden = true;
    document.body.classList.remove("aide-ouverte");
    this.surBascule?.(false);
  }

  /** Redessiné à chaque ouverture : les touches ont pu changer entre-temps. */
  private dessiner(rubrique?: string): void {
    const t = this.tactile;
    const sommaire = RUBRIQUES_AIDE.map((r) => `<button type="button" class="vers" data-id="${r.id}">${r.icone} ${enLigne(r.titre, t)}</button>`).join("");
    const rubriques = RUBRIQUES_AIDE.map(
      (r) => `<details class="rubrique" id="aide-${r.id}" name="aide"${r.id === rubrique ? " open" : ""}>
          <summary><span class="icone" aria-hidden="true">${r.icone}</span><span class="textes"><span class="titre">${enLigne(r.titre, t)}</span><span class="resume">${enLigne(r.resume, t)}</span></span></summary>
          <div class="corps">${r.blocs.map((b) => bloc(b, t)).join("")}</div>
        </details>`,
    ).join("");
    this.element.innerHTML = `
      <div class="fiche">
        <div class="entete"><h2 id="titre-aide">Aide</h2><button type="button" class="fermer" aria-label="Fermer l'aide">✕</button></div>
        <div class="defile">
          <p class="chapeau">Tout ce qu'il faut savoir pour s'en sortir… sans gâcher les surprises. Le reste, c'est à toi de le découvrir.</p>
          <nav class="sommaire" aria-label="Rubriques">${sommaire}</nav>
          ${rubriques}
        </div>
      </div>`;
    this.element.querySelector(".fermer")!.addEventListener("click", () => this.fermer());
    for (const b of this.element.querySelectorAll<HTMLButtonElement>(".vers")) {
      b.addEventListener("click", () => {
        const d = this.element.querySelector<HTMLDetailsElement>(`#aide-${b.dataset.id}`);
        if (!d) return;
        d.open = true;
        d.scrollIntoView({ block: "start", behavior: "smooth" });
      });
    }
    // Une rubrique ouverte à la fois (l'attribut `name` le fait déjà dans les navigateurs récents).
    for (const d of this.element.querySelectorAll<HTMLDetailsElement>("details.rubrique")) {
      d.addEventListener("toggle", () => {
        if (!d.open) return;
        for (const autre of this.element.querySelectorAll<HTMLDetailsElement>("details.rubrique")) if (autre !== d) autre.open = false;
      });
    }
    if (rubrique) requestAnimationFrame(() => this.element.querySelector(`#aide-${rubrique}`)?.scrollIntoView({ block: "start" }));
  }
}
