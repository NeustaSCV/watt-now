// Les lieux des recettes, en mots courts pour les données (plan 0.8, chantier 1 ; `recettes-par-construction.md`).
// Chaque recette a un seul lieu : à la main, posée (la construction elle-même), ou à côté d'une construction à son
// niveau, avec parfois un accessoire. Pour un feu, ce sont les formes du foyer qui comptent, pas un « niveau de cuisine ».
//
// Ce fichier n'importe que des types : les recettes de chaque famille s'en servent sans boucle d'import.

import type { FormeFeu } from "../lignees.ts";
import type { LieuRecette, TypeInstallation } from "../recettes.ts";

/** Assis par terre, avec ce qu'on porte. */
export const A_LA_MAIN: LieuRecette = { genre: "main" };

/** La construction elle-même : elle se pose sur le terrain (la racine d'une lignée, une installation). */
export const POSEE: LieuRecette = { genre: "posee" };

/** À côté d'une construction (3 m), à ce niveau de sa lignée au moins, avec cet accessoire monté s'il en faut un. */
export function aCote(construction: TypeInstallation, options: { niveau?: number; accessoire?: string } = {}): LieuRecette {
  return { genre: "construction", construction, ...(options.niveau && options.niveau > 1 ? { niveau: options.niveau } : {}), ...(options.accessoire ? { accessoire: options.accessoire } : {}) };
}

/** Sur un feu allumé (2,5 m), de l'une de ces formes. */
export function auFeu(formes: readonly FormeFeu[]): LieuRecette {
  return { genre: "construction", construction: "feu", formes };
}

// ---------- Les feux (`recettes-par-construction.md` §2 et §3 ; plan 0.8 §2.3) ----------
// Chaque niveau de la voie de surface garde ce que faisaient ceux d'avant, sauf le poêle (ni cendre, ni pièce à durcir).
// La voie creusée cuit sous la poêle, mais ne durcit rien et n'a pas de lit de braises à l'air.

/** Sous la cendre : le feu de camp et toute la surface jusqu'au four, et le Dakota (les braises au fond du trou). */
export const SOUS_LA_CENDRE = auFeu(["feu_camp", "foyer_pierres", "foyer_cuisine", "four_terre", "dakota"]);

/** Ce qui se durcit au feu : un lit de braises à l'abri du vent et un muret, dès le foyer de pierres. */
export const AU_FOYER_DE_PIERRES = auFeu(["foyer_pierres", "foyer_cuisine", "four_terre"]);

/** La poêlée : dès le foyer de pierres, et sur la voie creusée (la poêle posée sur le trou, c'est un réchaud). */
export const A_LA_POELE = auFeu(["foyer_pierres", "foyer_cuisine", "four_terre", "poele", "dakota", "poele_fusee"]);

/** Les mijotés : la crémaillère du foyer de cuisine, et au-dessus. */
export const A_LA_CREMAILLERE = auFeu(["foyer_cuisine", "four_terre", "poele"]);

/** Ce qui cuit enfermé : le four de terre (et le poêle, plus tard). */
export const AU_FOUR = auFeu(["four_terre", "poele"]);
