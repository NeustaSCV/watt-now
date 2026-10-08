// Petits réglages gardés dans le navigateur (jeton de connexion, qualité graphique).
// Le stockage peut être indisponible (navigation privée) : on ne plante jamais pour autant.

export function lire(cle: string): string | null {
  try {
    return localStorage.getItem(cle);
  } catch {
    return null;
  }
}

export function ecrire(cle: string, valeur: string | null): void {
  try {
    if (valeur === null) localStorage.removeItem(cle);
    else localStorage.setItem(cle, valeur);
  } catch {
    // Rien à faire : le réglage ne sera simplement pas retenu.
  }
}
