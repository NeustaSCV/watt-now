// Les deux horloges du jeu (Book 01 §2 bis).
// Horloge d'action : 1 heure de jeu = 1 minute réelle, un jour = 24 minutes réelles.
// Calendrier : 1 saison = 1 semaine réelle. En phase 0a, la saison est fixée (Book 21 §3.6).

/** Millisecondes réelles pour une heure de jeu. */
export const MS_PAR_HEURE_JEU = 60_000;
/** Durée réelle d'un jour de jeu (jour + nuit). */
export const MS_PAR_JOUR_JEU = 24 * MS_PAR_HEURE_JEU;
/** Heure de jeu au tout début du monde : le petit matin (Book 14 §4.2, étape 1). */
export const HEURE_DEPART = 6;

/** Saison fixe de la phase 0a : la fin de printemps (Book 21 §5.6). */
export const SAISON_0A = "printemps" as const;

/** Heure de jeu (0 à 24, décimale) à un instant réel donné. */
export function heureDeJeu(instantMs: number, debutMondeMs: number): number {
  const heures = (instantMs - debutMondeMs) / MS_PAR_HEURE_JEU + HEURE_DEPART;
  return ((heures % 24) + 24) % 24;
}

/** Numéro du jour de jeu depuis le début du monde (commence à 1). */
export function jourDeJeu(instantMs: number, debutMondeMs: number): number {
  return Math.floor(((instantMs - debutMondeMs) / MS_PAR_HEURE_JEU + HEURE_DEPART) / 24) + 1;
}

/** Heures de jeu écoulées entre deux instants réels. */
export function heuresEcoulees(depuisMs: number, jusquaMs: number): number {
  return Math.max(0, (jusquaMs - depuisMs) / MS_PAR_HEURE_JEU);
}

/** La nuit va de 21 h à 5 h 30 : on a besoin de lumière. */
export function estNuit(heure: number): boolean {
  return heure >= 21 || heure < 5.5;
}

export function formaterHeure(heure: number): string {
  const h = Math.floor(heure);
  const m = Math.floor((heure - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
