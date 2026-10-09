// Le menu ⚙ du compte admin « god » (outil du porteur, 0.7 ; commun/src/admin.ts) : invincible ou non, aller d'un
// coup dans un lieu, remplir ses coffres. Ces boutons n'apparaissent que si le serveur dit que c'est l'admin (et le
// serveur revérifie chaque geste : un joueur qui les fabriquerait n'obtiendrait rien).

import { lieuxAdmin, type OperationAdmin, type VueAdmin } from "../../commun/src/admin.ts";

/** « La station-service » → « Station », « Le Comptoir du Carrefour » → « Comptoir » : les boutons sont petits. */
function nomCourt(nom: string): string {
  const s = nom.replace(/^(La |Le |L')/, "").split(/[ -]/)[0] ?? nom;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export class MenuAdmin {
  private readonly bloc: HTMLDivElement;
  private readonly invincible: HTMLButtonElement;
  private readonly lieux: HTMLDivElement;
  private readonly aller: HTMLButtonElement;
  private readonly menu: HTMLElement;

  /** `menu` : la liste du menu ⚙ (hud.ts) ; `fermer` : referme le menu après un geste. */
  constructor(menu: HTMLElement, envoyer: (op: OperationAdmin) => void, fermer: () => void) {
    this.menu = menu;
    this.bloc = document.createElement("div");
    this.bloc.className = "menu-admin";
    this.bloc.hidden = true;
    this.bloc.innerHTML = `
      <p class="titre-admin">Admin</p>
      <button type="button" class="a-invincible" role="menuitem" aria-pressed="true">Invincible : oui</button>
      <button type="button" class="a-aller" role="menuitem" aria-expanded="false">Aller à…</button>
      <div class="a-lieux" hidden>${lieuxAdmin()
        .map((l) => `<button type="button" role="menuitem" data-lieu="${l.id}">${l.id === "terrain" ? "Mon terrain" : nomCourt(l.nom)}</button>`)
        .join("")}</div>
      <button type="button" class="a-remplir" role="menuitem">Remplir mes coffres</button>`;
    menu.append(this.bloc);
    this.invincible = this.bloc.querySelector(".a-invincible")!;
    this.aller = this.bloc.querySelector(".a-aller")!;
    this.lieux = this.bloc.querySelector(".a-lieux")!;
    this.invincible.addEventListener("click", () => envoyer({ genre: "invincible", oui: this.invincible.getAttribute("aria-pressed") !== "true" }));
    this.aller.addEventListener("click", () => this.deplier(this.lieux.hidden !== false));
    for (const b of this.lieux.querySelectorAll<HTMLButtonElement>("[data-lieu]")) {
      b.addEventListener("click", () => {
        envoyer({ genre: "aller", vers: b.dataset.lieu as Extract<OperationAdmin, { genre: "aller" }>["vers"] });
        this.deplier(false);
        fermer();
      });
    }
    this.bloc.querySelector(".a-remplir")!.addEventListener("click", () => {
      envoyer({ genre: "remplir" });
      fermer();
    });
  }

  private deplier(oui: boolean): void {
    this.lieux.hidden = !oui;
    this.aller.setAttribute("aria-expanded", String(oui));
  }

  /** Le statut d'admin (bienvenue, puis chaque changement) ; absent : un joueur comme les autres. */
  maj(vue: VueAdmin | undefined): void {
    this.bloc.hidden = !vue;
    this.menu.classList.toggle("avec-admin", !!vue);
    if (!vue) return;
    this.invincible.setAttribute("aria-pressed", String(vue.invincible));
    this.invincible.textContent = `Invincible : ${vue.invincible ? "oui" : "non"}`;
  }
}
