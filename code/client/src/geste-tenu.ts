// Le geste court se fait-il en tenant A ? (plan 0.8 ; plan 0.8.2 §7.6, décision du porteur.) Plus jamais : au toucher
// comme au clavier et à la souris, un appui bref sur A (E, ou le clic gauche) mène le geste court sur ce qu'on vise
// (ramasser, couper, creuser, fouiller…) jusqu'au bout, comme un geste long. Un nouvel appui sur A, ou un pas, l'arrête ;
// le bouton A et l'invite disent alors « Arrêter ». Les gestes qui ont leur propre règle ne changent pas : le combat
// (A jugé au relâchement, « maintenir pour frapper à la tête »), Lancer (maintenir pour viser).

export interface GesteAnnonce {
  /** L'écran est tactile (le bouton rond A). */
  tactile: boolean;
  /** Une action sans cible (manger, boire, panser…). */
  sansCible: boolean;
  /** Une fabrication (le tas de matières devant soi). */
  fabrication: boolean;
  /** La durée annoncée par le serveur (s). */
  duree: number;
}

/** Vrai si lâcher A arrêtait ce geste : jamais plus (0.8.2 §7.6), au toucher comme au clavier. */
export function seFaitEnTenantA(_g: GesteAnnonce): boolean {
  return false;
}

/** Le texte de l'invite au clavier pendant un geste : la touche d'action l'arrête. */
export function inviteArreter(touche: string): string {
  return `<kbd>${touche}</kbd> Arrêter`;
}
