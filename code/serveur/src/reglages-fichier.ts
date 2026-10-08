// Les réglages d'équilibrage lus dans un fichier JSON, rechargés à chaud dès qu'il change (Book 21 §3.9, É5 lot 4).
// Le fichier ne contient que ce qu'on veut changer : { "faim_rythme": 0.8, "eteints_terrain_max": 2 }.
// Une erreur de syntaxe n'arrête rien : on garde les réglages précédents et on le dit dans le journal.

import { existsSync, readFileSync, unwatchFile, watchFile } from "node:fs";
import { appliquerReglages, reglagesChanges, type Reglages } from "../../commun/src/reglages.ts";
import { journal } from "./journal.ts";

export class FichierReglages {
  private readonly chemin: string;
  private readonly surChangement: (changes: Partial<Reglages>) => void;
  private dernierTexte = "";

  constructor(chemin: string, surChangement: (changes: Partial<Reglages>) => void) {
    this.chemin = chemin;
    this.surChangement = surChangement;
  }

  /** Lit le fichier (s'il existe) et applique ses réglages. */
  charger(): void {
    const texte = existsSync(this.chemin) ? readFileSync(this.chemin, "utf8") : "";
    if (texte === this.dernierTexte) return;
    let brut: unknown = {};
    if (texte.trim()) {
      try {
        brut = JSON.parse(texte);
      } catch (erreur) {
        journal(`Réglages : ${this.chemin} illisible (${String(erreur)}) ; on garde les réglages en cours.`);
        return;
      }
    }
    this.dernierTexte = texte;
    for (const r of appliquerReglages(brut)) journal(`Réglages : ${r}`);
    const changes = reglagesChanges();
    const liste = Object.entries(changes).map(([n, v]) => `${n} = ${v}`);
    journal(`Réglages en vigueur : ${liste.length ? liste.join(", ") : "tous par défaut"}`);
    this.surChangement(changes);
  }

  /** Surveille le fichier (par sondage : ça marche aussi dans un volume Docker). */
  surveiller(): void {
    watchFile(this.chemin, { interval: 2000 }, () => this.charger());
  }

  arreter(): void {
    unwatchFile(this.chemin);
  }
}
