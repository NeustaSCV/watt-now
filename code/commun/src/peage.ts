// Le péage des survivants (plan 0.10 §3.4, S-19 ; N2-59, N2-60, Q-0.10-5) : à la chicane de la route du pont et à la
// barricade du tunnel de la corniche, des survivants réclament **12 wotts d'objets** par tête. Ce module dit la règle,
// la même aux deux passages ; il est partagé par le serveur (serveur/src/peage.ts, qui garde qui a payé) et par
// l'écran (le sac en mode « donner », client/src/panneau-peage.ts).
//
// - On touche la caisse ; le sac s'ouvre en mode « donner » ; on choisit soi-même ce qu'on donne, un compteur monte
//   jusqu'à 12 wotts ; « Payer ». Pas de monnaie rendue : ce qu'on donne de trop est perdu.
// - Chaque objet compte **au prix du Comptoir** : ce que les Compteurs en donneraient (`prixAchatCle`, sans compter une
//   trésorerie basse). Plan 0.10, V2-02 (« soyons sympa ») : une ordure compte si le Comptoir la reprend déjà (un sac de
//   canettes) ; celles qu'il refuse (à 0 : une canette seule) ne comptent pas. La règle est donc le seul prix de rachat.
// - Payé, on passe librement **une heure réelle** (S-19 : l'aller et le retour d'une sortie) ; la chicane s'ouvre
//   **pour soi seul**. Pendant cette heure, on ne redemande rien.
// - **À l'aller seulement** (N2-60 ; V2-01) : dans le sens lieu → terrain (le retour de l'hôtel par le pont, du phare par
//   la corniche), on passe toujours librement, même l'heure passée. Le serveur le sait par le côté d'où l'on arrive
//   dans la halte (serveur/src/peage.ts, `vientDuLieu`).
// - La voix vient d'en haut, en un message (jamais une fenêtre à croix) : « Douze, et tu passes. »
//
// Générique : paramétré par `passage` (« pont » ou « tunnel »). Le tunnel de la corniche (chantier I) le reprend tel
// quel, avec ses propres textes (TEXTES_PEAGE) s'il le veut.
//
// Ce fichier n'importe des autres modules du jeu que l'économie (les prix) et des types.

import { prixAchatCle } from "./economie.ts";
import { typeDe, type CleObjet } from "./etoiles.ts";
import type { Inventaire } from "./objets.ts";

/** Les deux péages du niveau 2 : la chicane du pont (H2A), la barricade du tunnel (H2B). */
export type Passage = "pont" | "tunnel";

/** Ce que demandent les survivants, par tête (N2-59). */
export const PRIX_PASSAGE = 12;

/** Payé, on passe librement une heure réelle (S-19). */
export const DUREE_PASSAGE_MS = 3_600_000;

/**
 * Ce qu'on ne donne pas à la caisse : le sac qu'on porte, et les batteries (leur charge vit à part, dans le sac ; on
 * ne la fait pas disparaître dans une caisse).
 */
const PAS_A_LA_CAISSE: ReadonlySet<string> = new Set(["sac_a_dos", "petite_batterie", "batterie_voiture", "batterie_cellules"]);

/** Peut-on mettre cet objet dans la caisse ? */
export function donnablePeage(cle: CleObjet): boolean {
  return !PAS_A_LA_CAISSE.has(typeDe(cle));
}

/**
 * Ce que vaut un objet à la caisse : ce que le Comptoir en donnerait (un exemplaire étoilé selon ses étoiles, un
 * objet-clé à son prix de rachat, une ordure qu'il reprend à son prix) ; ce que le Comptoir ne reprend pas (les ordures
 * à 0), 0 (V2-02).
 */
export function valeurPeage(cle: CleObjet): number {
  if (!donnablePeage(cle)) return 0;
  return prixAchatCle(cle, false) ?? 0;
}

/** Ce que valent ces objets à la caisse (wotts, au dixième). */
export function valeurObjets(objets: Readonly<Inventaire>): number {
  let total = 0;
  for (const [cle, n] of Object.entries(objets) as [CleObjet, number][]) total += valeurPeage(cle) * Math.max(0, Math.floor(n ?? 0));
  return Math.round(total * 10) / 10;
}

/** Ce qu'il reste à donner pour passer (0 : le compte y est). */
export function resteAPayer(objets: Readonly<Inventaire>): number {
  return Math.max(0, Math.round((PRIX_PASSAGE - valeurObjets(objets)) * 10) / 10);
}

/** Le passage est-il libre pour qui a payé jusqu'à `jusqua` (ms ; 0 : jamais payé) ? */
export function passageLibre(jusqua: number | undefined, instant: number): boolean {
  return (jusqua ?? 0) > instant;
}

/** Pourquoi la caisse refuse : déjà payé (on passe), des objets qu'on n'a pas, ou pas assez. */
export type RefusPeage = "deja_paye" | "absent" | "trop_peu";

/**
 * Le paiement est-il accepté ? `objets` : ce qu'on met dans la caisse ; `sac` : ce qu'on porte ; `jusqua` : la fin du
 * passage déjà payé (0 : aucun). Accepté : on retire ces objets du sac, et le passage est libre jusqu'à
 * `instant + DUREE_PASSAGE_MS`.
 */
export function verifierPaiement(
  objets: Readonly<Inventaire>,
  sac: Readonly<Inventaire>,
  jusqua: number | undefined,
  instant: number,
): { accepte: true; valeur: number; objets: Inventaire } | { accepte: false; raison: RefusPeage; du: number } {
  if (passageLibre(jusqua, instant)) return { accepte: false, raison: "deja_paye", du: 0 };
  // On ne garde que des nombres entiers, positifs, d'objets qu'on porte vraiment et qu'on peut donner.
  const donnes: Inventaire = {};
  for (const [cle, n] of Object.entries(objets) as [CleObjet, number][]) {
    const k = Math.floor(n ?? 0);
    if (!(k >= 1)) continue;
    if (!donnablePeage(cle) || (sac[cle] ?? 0) < k) return { accepte: false, raison: "absent", du: resteAPayer({}) };
    donnes[cle] = k;
  }
  const valeur = valeurObjets(donnes);
  if (valeur < PRIX_PASSAGE) return { accepte: false, raison: "trop_peu", du: resteAPayer(donnes) };
  return { accepte: true, valeur, objets: donnes };
}

/** Ce que dit chaque passage (la voix d'en haut, les refus). */
export interface TextesPeage {
  /** Payé : la voix d'en haut, et la chicane s'ouvre. */
  paye: string;
  /** Pas assez : `du` wotts manquent. */
  tropPeu: (du: number) => string;
  /** On touche la caisse alors que le passage est libre : payé dans l'heure, ou sur le retour (V2-01). */
  dejaPaye: string;
  /** L'heure est passée : la chicane s'est refermée pour soi. */
  referme: string;
  /** On bute contre la porte fermée (une fois par tentative). */
  ferme: string;
  /** L'examen de la caisse. */
  examen: string;
}

const dixieme = (v: number) => (Math.round(v * 10) / 10).toString().replace(".", ",");

export const TEXTES_PEAGE: Record<Passage, TextesPeage> = {
  pont: {
    paye: "Une voix, d'en haut : « Douze, et tu passes. » La porte du péage s'ouvre pour toi.",
    tropPeu: (du) => `Une voix, d'en haut : « Douze, j'ai dit. Il en manque ${dixieme(du)}. »`,
    dejaPaye: "Une voix, d'en haut : « C'est bon pour toi. Passe. »",
    referme: "La porte du péage s'est refermée : ton heure est passée. Douze de plus, pour repasser.",
    ferme: "La porte du péage est fermée. Douze wotts d'objets, dans la caisse au pied du poste de guet.",
    examen: "Un coffre de bois cerclé, une fente dans le couvercle, « PÉAGE » peint à la main. Là-haut, quelqu'un regarde. Douze wotts d'objets par tête, au prix du Comptoir : ce qu'il ne reprend pas ne compte pas.",
  },
  tunnel: {
    paye: "Une voix, de derrière la barricade : « Douze, et tu passes. » Le passage s'ouvre pour toi.",
    tropPeu: (du) => `Une voix, de derrière la barricade : « Douze, j'ai dit. Il en manque ${dixieme(du)}. »`,
    dejaPaye: "Une voix, de derrière la barricade : « C'est bon pour toi. Passe. »",
    referme: "La barricade s'est refermée : ton heure est passée. Douze de plus, pour repasser.",
    ferme: "La barricade est fermée. Douze wotts d'objets, dans la caisse au pied de la barricade.",
    examen: "Une caisse de bois, une fente dans le couvercle. Derrière la barricade, on t'écoute. Douze wotts d'objets par tête, au prix du Comptoir : ce qu'il ne reprend pas ne compte pas.",
  },
};
