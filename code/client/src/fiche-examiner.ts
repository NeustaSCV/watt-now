// La fiche Examiner (la fiche d'un feu ou d'une construction, ouverte par B « Examiner ») : plus de croix (plan 0.8 §9.2,
// règle du porteur : « les dialogues avec une croix cassent complètement la dynamique de jeu »). Ouverte par B, elle se
// ferme par B (F au clavier, clic droit, le bouton tactile B, qui dit alors « Fermer ») ; un bouton « Fermer » en bas de
// la fiche reste pour la souris et le doigt. La mise en page à 375 px et en paysage est au chantier 13.

/** Le libellé de B tant que la fiche est ouverte (le bouton tactile, l'invite du clavier). */
export const LIBELLE_FERMER_FICHE = "Fermer";

/** L'en-tête de la fiche : son titre seul, sans croix. */
export function enteteFiche(titre: string): string {
  return `<header><h2>${titre}</h2></header>`;
}

/** Le pied de la fiche : le bouton « Fermer », pour la souris et le toucher. */
export function piedFiche(): string {
  return `<footer class="pied-fiche"><button type="button" class="fermer-fiche">${LIBELLE_FERMER_FICHE}</button></footer>`;
}
