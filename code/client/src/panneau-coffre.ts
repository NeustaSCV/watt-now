// Le panneau du coffre (le coffre, le coffre cerclé, le râtelier à outils, la décharge) : son en-tête et ses gestes.
//
// Plan 0.8.2, chantier A (R5) : en 0.8, ce panneau s'ouvrait mais ne répondait plus, ni au doigt ni à la souris. Le
// correctif de la fiche Examiner (« plus de croix », plan 0.8 §9.2) avait aussi changé, par erreur, la ligne qui branche la
// croix du coffre : elle cherchait le bouton « Fermer » de la fiche (`.fermer-fiche`), absent ici. `querySelector`
// rendait null, `addEventListener` levait une erreur, et rien de ce qui suivait n'était branché : ni la croix, ni les
// cases, ni « Ranger » / « Prendre ». L'en-tête et les gestes vivent donc ici, ensemble, pour que l'un suive l'autre ;
// le panneau, ouvert au toucher ou à la souris (bouton A), garde sa croix (règle du porteur).

/** L'en-tête du panneau : son titre et sa croix. */
export function enteteCoffre(titre: string): string {
  return `<header><h2>${titre}</h2><button type="button" class="fermer" aria-label="Fermer">✕</button></header>`;
}

/** Ce que font les gestes du panneau (tenus par le HUD). */
export interface GestesCoffre {
  fermer(): void;
  /** Une case touchée : `sens` dit où est l'objet (« deposer » : sur soi ; « prendre » : dans le coffre). */
  toucherCase(sens: "deposer" | "prendre", objet: string): void;
  /** « Ranger » / « Prendre » (un seul), ou « Tout ». */
  deplacer(tout: boolean): void;
}

/**
 * Branche les gestes sur le panneau tout juste dessiné. Chaque groupe se branche seul : si l'un manquait, les autres
 * répondraient encore (une seule erreur avait suffi à rendre tout le panneau sourd).
 */
export function brancherCoffre(p: Pick<ParentNode, "querySelectorAll">, gestes: GestesCoffre): void {
  for (const b of p.querySelectorAll<HTMLElement>("header .fermer")) b.addEventListener("click", () => gestes.fermer());
  for (const b of p.querySelectorAll<HTMLElement>(".case[data-sens]")) {
    b.addEventListener("click", () => gestes.toucherCase(b.dataset.sens as "deposer" | "prendre", b.dataset.objet!));
  }
  for (const b of p.querySelectorAll<HTMLElement>("[data-deplacer]")) b.addEventListener("click", () => gestes.deplacer(b.dataset.deplacer === "tout"));
}
