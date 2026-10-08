// Limiter les essais (0.1.1, revue de sécurité) : sans limite, on peut essayer des mots de passe en masse, et chaque
// essai coûte un calcul scrypt qui bloque la boucle de jeu. On compte par clé (adresse, pseudo) sur une fenêtre glissante.
// Une famille derrière la même box partage une adresse : les seuils restent larges pour un usage honnête.

export class Limiteur {
  private readonly essais = new Map<string, number[]>();
  /** Combien d'essais dans la fenêtre. */
  private readonly maximum: number;
  /** La fenêtre, en millisecondes. */
  private readonly fenetre: number;

  constructor(maximum: number, fenetre: number) {
    this.maximum = maximum;
    this.fenetre = fenetre;
  }

  /** Reste-t-il des essais pour cette clé ? */
  autorise(cle: string, maintenant = Date.now()): boolean {
    return this.recents(cle, maintenant).length < this.maximum;
  }

  /** Compte un essai. */
  compter(cle: string, maintenant = Date.now()): void {
    const r = this.recents(cle, maintenant);
    r.push(maintenant);
    this.essais.set(cle, r);
    // La mémoire reste bornée : de temps en temps, on oublie les clés sans essai récent.
    if (this.essais.size > 5000) for (const k of [...this.essais.keys()]) if (this.recents(k, maintenant).length === 0) this.essais.delete(k);
  }

  private recents(cle: string, maintenant: number): number[] {
    const r = (this.essais.get(cle) ?? []).filter((t) => maintenant - t < this.fenetre);
    if (r.length === 0) this.essais.delete(cle);
    else this.essais.set(cle, r);
    return r;
  }
}
