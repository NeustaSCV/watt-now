// La forge des Charbonniers : les règles pures (Book 25 §4, chantier 5 de la 0.6). Le client s'en sert pour proposer
// les gestes, le serveur pour juger (serveur/src/forge.ts), les recettes pour leurs étoiles (recettes/charbonniers.ts).
//
// La qualité d'une lame suit la règle du maillon faible (Book 25 §4.2) :
//   étoiles = min( acier, trempe, forge et outils ) + 1 si la sorte est maîtrisée   (★★ au plus hors famille)
// - l'acier : la matière de la recette (fer doux ★★, lame ébréchée et soc ★★★, ressort ★★★★, lime ★★★★★) ;
// - la trempe : à l'eau ★★★ (une lame sur trois se fend), à l'huile ★★★★ (graisse de volaille, ou l'huile du bac) ;
// - la forge et ses outils (plan 0.8, P1, Q-A6, Q-A2d) : le foyer de forge donne ★★ sur une enclume (l'enclume de
//   dépanneur de la station, un étau, une tête de masse), ★ sur sa grosse pierre plate (Q-0.8-1) ; la forge ventilée
//   et les pinces ★★★ (niveau 2, plan 0.10) ; ventilée, pinces et rail ★★★★★ (plus tard). Sans pinces, pas plus de ★★.
//   Le foyer plafonne : la trempe à l'eau (★★★) ne dépasse plus le maillon de la forge, et la lame ne passe pas ★★.

import type { EtatInstallation, InstallationVue } from "./messages.ts";
import type { Inventaire, TypeObjet } from "./objets.ts";
import type { ContexteFabrication } from "./recettes.ts";

/** Une installation telle qu'on la voit à côté de soi. */
export type ForgeVue = Pick<InstallationVue, "type" | "niveau" | "etat">;

/** Le niveau de la forge ventilée dans la lignée de la forge (lignees.ts). */
export const NIVEAU_FORGE_VENTILEE = 2;

/**
 * Les enclumes qu'on pose sur la forge (Book 25 §9.3). L'enclume de dépanneur est la clé du foyer de forge (la pièce de
 * famille de la station) ; l'étau et la tête de masse ne valent pas mieux qu'elle (P1, Q-A6 : ★★, plus ★★★) ; le rail
 * est pour plus tard. Sans enclume, la grosse pierre plate du foyer : ★ (`ETOILES_PIERRE_PLATE`, Q-0.8-1).
 */
export const ENCLUMES = {
  depanneur: { objet: "enclume_depanneur", etoiles: 2, nom: "l'enclume de dépanneur" },
  etau: { objet: "etau", etoiles: 2, nom: "l'étau" },
  masse: { objet: "masse", etoiles: 2, nom: "la tête de masse" },
  rail: { objet: "troncon_rail", etoiles: 5, nom: "le tronçon de rail" },
} as const satisfies Record<NonNullable<EtatInstallation["enclume"]>, { objet: TypeObjet; etoiles: number; nom: string }>;
export type Enclume = keyof typeof ENCLUMES;

/** La grosse pierre plate du foyer, le repli de l'enclume (Q-0.8-1 : un objet de fortune donne le niveau 1). */
export const ETOILES_PIERRE_PLATE = 1;
/** Le foyer de forge, au mieux (plan 0.8 §2.4 : ★★ jusqu'au niveau 1). */
export const ETOILES_FOYER = 2;
/** La forge ventilée et ses pinces (Q-A2d : ★★★, niveau 2). */
export const ETOILES_VENTILEE = 3;

/**
 * Ce qu'on pose dans l'ordre de préférence quand on a plusieurs enclumes dans le sac : la meilleure d'abord ; à étoiles
 * égales, la pièce faite pour ça (l'étau sert aussi à l'établi, la masse au combat).
 */
export const ORDRE_ENCLUMES: readonly Enclume[] = ["rail", "depanneur", "etau", "masse"];

/**
 * Le bac de trempe (plan 0.8 §2.3) : une auge de planches calfatée de glaise, sans clé, au pied de la forge. Deux
 * bûches refendues et deux mottes de glaise du gué ; il faut creuser son assise (Creuser 1). Plus de casserole (V4-4).
 */
export const COUT_BAC: Inventaire = { buche: 2, glaise: 2 };
export const QUALITES_BAC = { creuser: 1 } as const;
/** Un bidon d'huile moteur, versé dans le bac : vingt trempes (« cinq litres »). */
export const TREMPES_PAR_BIDON = 20;
/** La trempe à l'eau : une lame sur trois se fend (Book 25 §4.2). */
export const RISQUE_TREMPE_EAU = 1 / 3;
/** Le maillon « trempe ». */
export const ETOILES_TREMPE = { eau: 3, huile: 4 } as const;
/** La forge ventilée sans ventilateur : on pompe le soufflet double (kcal par heure de jeu, en plus du travail lourd). */
export const KCAL_POMPER = 150;

/** La qualité de chaque acier (Book 25 §4.2). Le fer doux ne prend pas la trempe. */
export const ETOILES_ACIER: Partial<Record<TypeObjet, number>> = {
  barre_metal: 2,
  rouleau_fil_fer: 2,
  bocal_clous: 2,
  lame_ebrechee: 3,
  soc_charrue: 3,
  ressort_lames: 4,
  lime_usee: 5,
};

/** Un acier qui prend la trempe (★★★ et plus) : le fer doux, non. */
export function prendLaTrempe(acier: number): boolean {
  return acier >= 3;
}

/** La meilleure forge à côté de soi (la plus haute dans sa lignée), ou null. */
export function forgeProche(contexte: ContexteFabrication | undefined): ForgeVue | null {
  let meilleure: ForgeVue | null = null;
  for (const i of contexte?.installations ?? []) {
    if (i.type !== "forge") continue;
    if (!meilleure || (i.niveau ?? 1) > (meilleure.niveau ?? 1)) meilleure = i;
  }
  return meilleure;
}

/** La forge est-elle ventilée (niveau 2 et plus) ? */
export function estVentilee(forge: ForgeVue | null): boolean {
  return (forge?.niveau ?? 1) >= NIVEAU_FORGE_VENTILEE;
}

/**
 * La forge ventilée a-t-elle son soufflet de forge (plan 0.10, chantier C) ? Il est payé à la montée de niveau (dans
 * `etat.payes`) : avec lui, on ne pompe pas.
 */
export function souffletDeForge(forge: ForgeVue | null): boolean {
  return estVentilee(forge) && (forge?.etat?.payes ?? []).some((p) => (p.soufflet_forge ?? 0) > 0);
}

/** Les étoiles de l'enclume posée (sans enclume, la grosse pierre plate du foyer : ★). */
export function etoilesEnclume(forge: ForgeVue | null): number {
  const e = forge?.etat?.enclume;
  return e ? ENCLUMES[e].etoiles : ETOILES_PIERRE_PLATE;
}

/**
 * Le maillon « forge et outils » (Book 25 §4.2, plan 0.8) : sans forge, un feu et une pierre (★) ; le foyer de forge ★★
 * sur une enclume, ★ sur sa pierre plate ; la forge ventilée et les pinces ★★★ (le rail : ★★★★★). Sans pinces, ★★.
 */
export function etoilesForge(inventaire: Inventaire, forge: ForgeVue | null): number {
  if (!forge) return 1;
  const enclume = etoilesEnclume(forge);
  if (!estVentilee(forge)) return Math.min(ETOILES_FOYER, enclume);
  const pinces = (inventaire.pinces_forge ?? 0) > 0;
  if (!pinces) return ETOILES_FOYER;
  return enclume >= 5 ? 5 : ETOILES_VENTILEE;
}

/** La trempe qu'on fera ici : à l'huile si le bac en tient ou si l'on a de la graisse, sinon à l'eau. */
export type Trempe = { genre: "huile"; source: "bac" | "graisse" } | { genre: "eau" };
export function trempeDisponible(inventaire: Inventaire, forge: ForgeVue | null): Trempe {
  if ((forge?.etat?.huile ?? 0) > 0) return { genre: "huile", source: "bac" };
  if ((inventaire.graisse ?? 0) > 0) return { genre: "huile", source: "graisse" };
  return { genre: "eau" };
}

/** Le maillon « trempe ». */
export function etoilesTrempe(inventaire: Inventaire, forge: ForgeVue | null): number {
  return ETOILES_TREMPE[trempeDisponible(inventaire, forge).genre];
}

/** Les trois maillons d'une lame forgée dans cet acier : acier, trempe, forge (le fer doux n'a pas de trempe à juger). */
export function facteursLame(acier: number, inventaire: Inventaire, contexte: ContexteFabrication | undefined): number[] {
  const forge = forgeProche(contexte);
  const f = [acier, etoilesForge(inventaire, forge)];
  if (prendLaTrempe(acier)) f.push(etoilesTrempe(inventaire, forge));
  return f;
}

/** L'enclume qu'on poserait avec ce qu'on a dans le sac (la meilleure), ou null. */
export function enclumeDuSac(inventaire: Inventaire): Enclume | null {
  return ORDRE_ENCLUMES.find((e) => (inventaire[ENCLUMES[e].objet] ?? 0) > 0) ?? null;
}
