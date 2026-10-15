// Les saisons sur la faim et la soif (plan 0.10.1, A7 ; en-suspens §1 ter, point 7) : l'hiver, on mange davantage ;
// l'été, on boit davantage. Les vraies dates (Q-4) : l'hiver du 21 décembre au 20 mars, l'été du 21 juin au
// 22 septembre, au calendrier du monde (calendrier.ts : un an = 4 semaines réelles). L'effet suit une cloche sur la
// saison : rien le premier jour, + 25 % au milieu, rien le dernier jour. Au printemps et à l'automne, rien ne change.
// Le feu et l'abri annulent le surplus de l'hiver (le serveur en juge : serveur/src/joueur.ts) ; l'été, rien n'atténue
// la soif. Une fonction pure, sans affichage.

/** Au plus fort de la saison, au milieu : + 25 %. */
export const SURPLUS_SAISON_MAX = 0.25;

/** Les saisons qui pèsent, en jours de l'année (1 à 365) : le premier et le dernier jour, compris. */
export const HIVER = { debut: 355, fin: 79 } as const; // 21 décembre → 20 mars
export const ETE = { debut: 172, fin: 265 } as const; // 21 juin → 22 septembre

/** La cloche sur une saison : 0 au premier jour, 1 au milieu, 0 au dernier ; null hors de la saison. */
function cloche(jour: number, s: { debut: number; fin: number }): number | null {
  // L'hiver passe le 31 décembre : on le compte d'un seul tenant.
  const fin = s.fin < s.debut ? s.fin + 365 : s.fin;
  const j = jour < s.debut && s.fin < s.debut ? jour + 365 : jour;
  if (j < s.debut || j > fin) return null;
  const t = (j - s.debut) / (fin - s.debut);
  return Math.sin(Math.PI * t) ** 2;
}

/**
 * Ce que la saison ajoute à la faim et à la soif, en multiplicateurs (1 : rien de plus ; 1,25 au plus fort). `jour` :
 * le jour de l'année (calendrier.ts, `jourDuCalendrier`), qui peut avoir une partie décimale.
 */
export function surplusSaison(jour: number): { faim: number; soif: number } {
  const hiver = cloche(jour, HIVER);
  const ete = cloche(jour, ETE);
  return { faim: 1 + SURPLUS_SAISON_MAX * (hiver ?? 0), soif: 1 + SURPLUS_SAISON_MAX * (ete ?? 0) };
}
