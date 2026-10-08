// Les mesures du test familial (Book 17 §6) : de quoi équilibrer le jeu après coup.
// Chaque mesure est une ligne de la table `mesures` : quand, qui (compte, famille), quoi, combien.
// Rien de personnel n'y est noté : pas de pseudo, pas de position, pas de message.

export type GenreMesure =
  /** Temps passé par activité (secondes réelles). */
  | "activite"
  /** Flux de wotts : créés (dépôt d'électricité), gagnés, dépensés, détruits. */
  | "wotts"
  /** Causes d'effondrement (Book 06 §12). */
  | "effondrement"
  /** Progression : recettes réussies, étapes du tutoriel. */
  | "progression"
  /** Connexions et durée des séances. */
  | "session"
  /** Charge du serveur, chaque minute. */
  | "serveur"
  /** Images par seconde des appareils, chaque minute. */
  | "client";

export interface Mesure {
  instant: number;
  compteId: number;
  famille: string;
  genre: GenreMesure;
  quoi: string;
  valeur: number;
  /** Détails, en JSON (facultatif). */
  details?: Record<string, unknown>;
}

/** Les grandes activités du Book 17 §6 : collecte, fabrication, expédition, soins, et le reste de la survie. */
export function categorieAction(libelle: string): string {
  const l = libelle.toLowerCase();
  if (/^(ramasser|cueillir|gauler|couper des joncs|prendre|fouiller|démonter|reprendre ton sac)/.test(l)) return "collecte";
  if (/pansement|panser/.test(l)) return "soins";
  if (/^(manger|boire|faire bouillir|remplir la gourde|faire rôtir)/.test(l)) return "nourriture et eau";
  if (/feu|meule|charbon/.test(l)) return "feu et charbon";
  if (/pédaler|recharger|batteries|affûter/.test(l)) return "énergie";
  return "fabrication";
}
