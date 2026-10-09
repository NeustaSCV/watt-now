// La leçon entre joueurs, côté écran (Book 25 §2.3) : choisir la recette à enseigner, accepter ou refuser une leçon,
// et la barre de la leçon en cours (deux minutes côte à côte). Le serveur décide de tout (serveur/src/lecon.ts).
// Même allure que la demande d'échange (style.css, « .demande-echange ») ; des boutons de 44 px au doigt.

import type { LeconVue, OperationLecon, Personne } from "../../commun/src/messages.ts";
import { recette } from "../../commun/src/recettes.ts";
import { NOMS_FAMILLES } from "../../commun/src/regles.ts";
import { COULEURS_FAMILLES } from "./accueil.ts";
import { icone, type Pictogramme } from "./icones.ts";

const echapper = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export class InterfaceLecon {
  private readonly dialogue: HTMLElement;
  private readonly barre: HTMLElement;
  private readonly envoyer: (op: OperationLecon) => void;
  private minuterie: number | undefined;
  private delaiReponse: number | undefined;

  constructor(hud: HTMLElement, envoyer: (op: OperationLecon) => void) {
    this.envoyer = envoyer;
    this.dialogue = document.createElement("div");
    this.dialogue.className = "demande-echange demande-lecon";
    this.dialogue.setAttribute("role", "alertdialog");
    this.dialogue.hidden = true;
    this.barre = document.createElement("div");
    this.barre.className = "lecon-en-cours";
    this.barre.hidden = true;
    hud.append(this.dialogue, this.barre);
  }

  private pastille(p: Personne): string {
    return `<span class="pastille" style="background:${COULEURS_FAMILLES[p.famille]}"></span><b>${echapper(p.pseudo)}</b>`;
  }

  private fermerDialogue(): void {
    this.dialogue.hidden = true;
    window.clearTimeout(this.delaiReponse);
  }

  /** Le maître choisit ce qu'il enseigne : les recettes de son métier que l'autre ne sait pas encore. */
  choisir(eleve: Personne, recettes: string[]): void {
    const boutons = recettes
      .map((id) => recette(id))
      .filter((r) => r !== undefined)
      .map((r) => {
        const image: Pictogramme = "objet" in r.produit ? r.produit.objet : r.produit.installation;
        return `<button type="button" class="choix-lecon" data-recette="${r.id}">${icone(image, 22)}<span>${echapper(r.nom)}</span></button>`;
      })
      .join("");
    this.dialogue.innerHTML = `<p>Enseigner à ${this.pastille(eleve)} <small>(${NOMS_FAMILLES[eleve.famille]})</small></p>
      <div class="liste-lecons">${boutons}</div>
      <div><button type="button" data-r="non">Fermer</button></div>`;
    this.dialogue.hidden = false;
    for (const b of this.dialogue.querySelectorAll<HTMLButtonElement>("[data-recette]")) {
      b.addEventListener("click", () => {
        this.fermerDialogue();
        this.envoyer({ genre: "proposer", a: eleve.id, recette: b.dataset.recette! });
      });
    }
    this.dialogue.querySelector("[data-r='non']")!.addEventListener("click", () => this.fermerDialogue());
  }

  /** L'élève reçoit une proposition : il accepte ou refuse (sans réponse, elle tombe au bout de 20 s). */
  demande(de: Personne, idRecette: string): void {
    const r = recette(idRecette);
    if (!r) return;
    this.dialogue.innerHTML = `<p>${this.pastille(de)} veut t'apprendre « ${echapper(r.nom)} ».</p>
      <p class="detail-lecon">Deux minutes côte à côte. Hors de ta famille : ×1,5, ★★ au plus.</p>
      <div><button type="button" data-r="non">Refuser</button><button type="button" data-r="oui" class="oui">Apprendre</button></div>`;
    this.dialogue.hidden = false;
    const repondre = (accepte: boolean) => {
      if (this.dialogue.hidden) return;
      this.fermerDialogue();
      this.envoyer({ genre: "repondre", accepte });
    };
    this.dialogue.querySelector("[data-r='oui']")!.addEventListener("click", () => repondre(true));
    this.dialogue.querySelector("[data-r='non']")!.addEventListener("click", () => repondre(false));
    window.clearTimeout(this.delaiReponse);
    this.delaiReponse = window.setTimeout(() => repondre(false), 20_000);
  }

  /** La leçon en cours (null : finie ou interrompue) : une barre qui se remplit, et de quoi l'arrêter. */
  maj(l: LeconVue | null): void {
    window.clearInterval(this.minuterie);
    if (!l) {
      this.barre.hidden = true;
      return;
    }
    const nom = recette(l.recette)?.nom ?? l.recette;
    const debut = performance.now();
    this.barre.innerHTML = `<span class="texte-lecon">${l.role === "maitre" ? "Tu enseignes" : "Tu apprends"} « ${echapper(nom)} » ${l.role === "maitre" ? "à" : "avec"} ${echapper(l.avec.pseudo)}</span>
      <span class="jauge-lecon"><span></span></span>
      <button type="button" aria-label="Arrêter la leçon">Arrêter</button>`;
    this.barre.hidden = false;
    this.barre.querySelector("button")!.addEventListener("click", () => this.envoyer({ genre: "annuler" }));
    const jauge = this.barre.querySelector<HTMLElement>(".jauge-lecon > span")!;
    const avancer = () => {
      const part = Math.min(1, (performance.now() - debut) / (l.duree * 1000));
      jauge.style.width = `${Math.round(part * 100)}%`;
    };
    avancer();
    this.minuterie = window.setInterval(avancer, 500);
  }
}
