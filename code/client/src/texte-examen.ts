// Le texte d'Examiner (plan 0.8.2, chantier H, Q9) : il passe dans la colonne des messages **en entier**, sans être
// coupé à deux lignes comme les autres, et il reste le temps de le lire.

/** Le temps qu'il reste (ms) : ≈ 15 caractères par seconde, entre 4 et 12 s. */
export function dureeExamen(texte: string): number {
  return Math.round(Math.min(12_000, Math.max(4000, 1500 + texte.length * 65)));
}
