// Le calendrier des récoltes (décision du 2026-10-08, Book 13, Book 11 §10).
// Le calendrier tourne : 1 année de 365 jours = 4 semaines réelles (Book 01 §2 bis), soit un jour de calendrier
// toutes les ≈ 1 h 50 réelles, le même pour tout le serveur. Le monde commence le 21 mars, premier jour du printemps
// (décision du porteur du 2026-10-16 ; avant : le 1er juin).
// Les fruits et les champignons suivent leurs vraies périodes (France tempérée). En 0a, l'herbe, la lumière et la
// production solaire restent celles du printemps (Book 21 §3.6) : seules les récoltes suivent le calendrier.

import { MS_JOUR_CALENDRIER } from "./energie.ts";
import type { TypeRessource } from "./terrain.ts";

/**
 * Le monde commence le 21 mars (jour 80), le lendemain de la fin de l'hiver (saisons.ts) : les pruniers puis les
 * cerisiers fleurissent ; les premiers cèpes sortent le 1er juin et les cerises mûrissent le 5 juin, soit ≈ 5 jours
 * et demi réels après le début du monde (un jour de calendrier ≈ 1 h 50).
 */
export const JOUR_DEPART = 80;

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"] as const;
const LONGUEURS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Jour de l'année (1 à 365) à un instant réel. */
export function jourDuCalendrier(instantMs: number, debutMondeMs: number): number {
  const jours = Math.floor((instantMs - debutMondeMs) / MS_JOUR_CALENDRIER);
  return ((((JOUR_DEPART - 1 + jours) % 365) + 365) % 365) + 1;
}

/** L'instant réel où commence un jour de l'année donné (le prochain, à partir du début du monde). */
export function instantDuJour(jour: number, debutMondeMs: number): number {
  const ecart = (((jour - JOUR_DEPART) % 365) + 365) % 365;
  return debutMondeMs + ecart * MS_JOUR_CALENDRIER;
}

/** « 15 mai » */
export function formaterDate(jour: number): string {
  let j = jour;
  for (let m = 0; m < 12; m++) {
    if (j <= LONGUEURS[m]!) return `${j === 1 ? "1er" : j} ${MOIS[m]}`;
    j -= LONGUEURS[m]!;
  }
  return `${jour}`;
}

/** Jour de l'année d'une date (mois de 1 à 12). */
function jd(jour: number, mois: number): number {
  return LONGUEURS.slice(0, mois - 1).reduce((a, b) => a + b, 0) + jour;
}

/**
 * Les périodes, en jours de l'année : floraison (fleurs visibles), puis fruits verts jusqu'à `mur`, puis fruits mûrs
 * jusqu'à `fin`. Le noyer fleurit en chatons, sans fleurs visibles.
 */
export const PERIODES_FRUITIERS = {
  cerisier: { fleurs: [jd(1, 4), jd(25, 4)], mur: jd(5, 6), fin: jd(15, 7) },
  prunier: { fleurs: [jd(25, 3), jd(20, 4)], mur: jd(15, 8), fin: jd(30, 9) },
  poirier: { fleurs: [jd(1, 4), jd(30, 4)], mur: jd(1, 8), fin: jd(31, 10) },
  pommier: { fleurs: [jd(15, 4), jd(20, 5)], mur: jd(15, 8), fin: jd(15, 11) },
  noyer: { fleurs: null, mur: jd(15, 9), fin: jd(31, 10) },
} as const;

/** Les champignons sortent à leur saison (cèpe d'été puis cèpe de Bordeaux ; les amanites de l'été à l'automne). */
export const PERIODES_CHAMPIGNONS = {
  cepe: { debut: jd(1, 6), fin: jd(15, 11) },
  amanite_phalloide: { debut: jd(1, 7), fin: jd(15, 11) },
  amanite_tue_mouches: { debut: jd(15, 8), fin: jd(30, 11) },
} as const;

export type PhaseFruitier = "repos" | "fleurs" | "verts" | "murs";

export function phaseFruitier(type: keyof typeof PERIODES_FRUITIERS, jour: number): PhaseFruitier {
  const p = PERIODES_FRUITIERS[type];
  if (jour >= p.mur && jour <= p.fin) return "murs";
  if (p.fleurs && jour >= p.fleurs[0] && jour <= p.fleurs[1]) return "fleurs";
  const finFleurs = p.fleurs ? p.fleurs[1] : jd(15, 5);
  if (jour > finFleurs && jour < p.mur) return "verts";
  return "repos";
}

function estFruitierCal(type: TypeRessource): type is keyof typeof PERIODES_FRUITIERS {
  return type in PERIODES_FRUITIERS;
}
function estChampignon(type: TypeRessource): type is keyof typeof PERIODES_CHAMPIGNONS {
  return type in PERIODES_CHAMPIGNONS;
}

/** Peut-on récolter cette ressource ce jour-là ? (Tout ce qui n'a pas de saison se récolte toute l'année.) */
export function enSaison(type: TypeRessource, jour: number): boolean {
  if (estFruitierCal(type)) return phaseFruitier(type, jour) === "murs";
  if (estChampignon(type)) {
    const p = PERIODES_CHAMPIGNONS[type];
    return jour >= p.debut && jour <= p.fin;
  }
  return true;
}

/** Un champignon hors saison n'est tout simplement pas là. */
export function visibleEnSaison(type: TypeRessource, jour: number): boolean {
  return !estChampignon(type) || enSaison(type, jour);
}

/** Ce qu'on dit d'un fruitier hors saison : où il en est, et quand ce sera mûr. */
export function etatDuFruitier(type: TypeRessource, jour: number): string | null {
  if (!estFruitierCal(type)) return null;
  const p = PERIODES_FRUITIERS[type];
  const quand = `mûrs du ${formaterDate(p.mur)} au ${formaterDate(p.fin)}`;
  switch (phaseFruitier(type, jour)) {
    case "fleurs":
      return `En fleurs. Fruits ${quand}.`;
    case "verts":
      return `Les fruits sont encore verts : ${quand}.`;
    case "murs":
      return `Les fruits sont mûrs (jusqu'au ${formaterDate(p.fin)}).`;
    default:
      return `Plus de fruits cette année. Fruits ${quand}.`;
  }
}

/** Le premier jour où l'on pourra récolter (pour les messages). */
export function prochaineRecolte(type: TypeRessource): string | null {
  if (estFruitierCal(type)) return formaterDate(PERIODES_FRUITIERS[type].mur);
  if (estChampignon(type)) return formaterDate(PERIODES_CHAMPIGNONS[type].debut);
  return null;
}
