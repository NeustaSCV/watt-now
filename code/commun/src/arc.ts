// L'arc pour tous (Book 25 §3, chantier 4 · 0.6) : ce que le serveur et le client partagent, sans connaître le joueur.
//
// - Le séchage de l'ébauche : une perche taillée en arc doit sécher deux heures réelles avant d'être montée (processus
//   passif, même hors ligne). On tient, pour chaque sorte d'ébauche, l'instant où chacune s'est mise à sécher.
// - Le redresseur de fûts : un accessoire de l'établi (2 branches, 1 pierre chauffée) ; les flèches faites à côté vont
//   deux fois plus vite (Book 25 §9.3).
// - La qualité d'un arc monté : le maillon faible du bois et de la corde (Book 25 §3.3).

import type { Inventaire, TypeObjet } from "./objets.ts";
import { exemplaires, etoilesDeBase, type Etoiles } from "./etoiles.ts";

// ---------- Le séchage de l'ébauche ----------

/** Deux heures réelles, à l'abri du sac (Book 25 §3.3). */
export const SECHAGE_MS = 2 * 3_600_000;

/** Les ébauches qui sèchent, et ce qu'elles deviennent. */
export const SECHAGES = {
  ebauche_arc: "ebauche_arc_seche",
  ebauche_if: "ebauche_if_seche",
} as const satisfies Partial<Record<TypeObjet, TypeObjet>>;
export type EbaucheVerte = keyof typeof SECHAGES;
export const EBAUCHES_VERTES = Object.keys(SECHAGES) as EbaucheVerte[];

/** Pour chaque sorte d'ébauche verte : l'instant (ms) où chacune s'est mise à sécher, de la plus ancienne à la plus récente. */
export type EtatSechage = Partial<Record<EbaucheVerte, number[]>>;

/** Relit un état de séchage venu de la base (illisible : rien ne sèche). */
export function sechageValide(x: unknown): EtatSechage {
  const r: EtatSechage = {};
  if (!x || typeof x !== "object") return r;
  for (const t of EBAUCHES_VERTES) {
    const l = (x as Record<string, unknown>)[t];
    if (!Array.isArray(l)) continue;
    const instants = l.filter((v): v is number => typeof v === "number" && Number.isFinite(v)).sort((a, b) => a - b);
    if (instants.length) r[t] = instants;
  }
  return r;
}

/**
 * Fait avancer le séchage jusqu'à `instant` (pur : ne modifie rien). Chaque ébauche verte du sac a son instant de
 * départ : celles qui n'en ont pas (fabriquées, reprises au coffre, échangées) commencent maintenant ; celles qui ne
 * sont plus dans le sac sont oubliées (on garde les plus avancées) ; celles qui ont fini deviennent des ébauches sèches.
 */
export function avancerSechage(inventaire: Inventaire, etat: EtatSechage, instant: number, duree = SECHAGE_MS): { etat: EtatSechage; seches: Inventaire; vertes: Inventaire; change: boolean } {
  const suivant: EtatSechage = {};
  const seches: Inventaire = {};
  const vertes: Inventaire = {};
  let change = false;
  for (const t of EBAUCHES_VERTES) {
    const n = inventaire[t] ?? 0;
    const avant = etat[t] ?? [];
    let l = avant.slice(0, n);
    while (l.length < n) l.push(instant);
    const finies = l.filter((d) => instant - d >= duree).length;
    if (finies > 0) {
      seches[SECHAGES[t]] = (seches[SECHAGES[t]] ?? 0) + finies;
      vertes[t] = finies;
      l = l.slice(finies);
    }
    if (l.length !== avant.length || finies > 0) change = true;
    if (l.length) suivant[t] = l;
  }
  return { etat: suivant, seches, vertes, change };
}

/** Ce qui reste à sécher pour la plus avancée des ébauches vertes (ms), ou null s'il n'y en a pas. */
export function resteSechage(etat: EtatSechage, instant: number, duree = SECHAGE_MS): number | null {
  const departs = EBAUCHES_VERTES.flatMap((t) => etat[t] ?? []);
  if (!departs.length) return null;
  return Math.max(0, Math.min(...departs) + duree - instant);
}

// ---------- Le redresseur de fûts (accessoire de l'établi) ----------

/** Monter le redresseur sur l'établi : deux branches en chevalet, une pierre qu'on chauffe pour cintrer les fûts. */
export const REDRESSEUR = { cout: { branche: 2, pierre: 1 } as Inventaire, dureeS: 15 } as const;
/** Les flèches faites à côté d'un établi qui a son redresseur vont deux fois plus vite. */
export const ACCELERATION_REDRESSEUR = 0.5;
/** Les recettes de flèches (le redresseur les accélère). */
export const RECETTES_FLECHES: readonly string[] = ["fleches_durcies", "fleches_os", "fleches_clou", "fleches_acier"];

export function estRecetteFleche(id: string): boolean {
  return RECETTES_FLECHES.includes(id);
}

// ---------- La qualité d'un arc monté (Book 25 §3.3) ----------

/**
 * Les étoiles de la corde d'arc qu'une recette prendra : la moins bonne du sac (les recettes prennent les exemplaires
 * les moins bons d'abord). Sans corde : ★★★ (la recette ne se fera pas, de toute façon).
 */
export function etoilesCordeDuSac(inventaire: Inventaire): Etoiles {
  const piles = exemplaires(inventaire, "corde_arc");
  return piles[piles.length - 1]?.etoiles ?? etoilesDeBase("corde_arc");
}

/** Les facteurs d'un arc monté : le bois (frêne ★★★, if ★★★★), la corde. */
export function facteursArc(bois: "arc_simple" | "arc_if"): (inventaire: Inventaire) => number[] {
  return (inventaire) => [etoilesDeBase(bois), etoilesCordeDuSac(inventaire)];
}
