// L'économie de la 0a (Book 07, Book 21 §3.7) : le Comptoir du Carrefour, à prix fixes, et le wott.
// Le wott est un bon des Compteurs, remboursable contre 1 Wh_é ; seul le dépôt d'électricité en crée.
// Valeurs de réglage, à caler pendant le test (Book 07 §3.6).

import { REGLAGES } from "./reglages.ts";
import type { Inventaire, TypeObjet } from "./objets.ts";
import { energieGrise } from "./recettes.ts";
import { etoilesDe, facteurs, typeDe, type CleObjet } from "./etoiles.ts";

// ---------- Les prix (Book 07 §4) ----------

// Fourchette du Carrefour : il vend 20 % au-dessus du prix de base, achète 20 % en dessous (Book 07 §4.2).
// Réglable à chaud : REGLAGES.prix_fourchette.
/** Prix plancher des ressources de base : toujours rachetées à au moins 0,5× (Book 07 §4.3). */
export const PLANCHER = 0.5;
export const RESSOURCES_DE_BASE: TypeObjet[] = ["branche", "buche", "pierre", "baies", "conserve"];
/** Ce que les Compteurs ne rachètent pas. */
const INVENDABLES: TypeObjet[] = ["sac_a_dos"];

export function prixBase(type: TypeObjet): number {
  return energieGrise(type);
}

/** Ce que coûte un objet au comptoir. */
export function prixVente(type: TypeObjet): number {
  return Math.max(1, Math.round(prixBase(type) * (1 + REGLAGES.prix_fourchette)));
}

/**
 * Ce que le comptoir paie pour un objet. Trésorerie basse : il n'achète plus que les ressources de base,
 * au prix plancher (Book 07 §3.6). Renvoie null s'il n'achète pas.
 */
export function prixAchat(type: TypeObjet, tresorerieBasse: boolean): number | null {
  if (INVENDABLES.includes(type)) return null;
  const base = prixBase(type);
  if (base <= 0) return null;
  if (tresorerieBasse) return RESSOURCES_DE_BASE.includes(type) ? Math.max(1, Math.round(base * PLANCHER * 10) / 10) : null;
  return Math.max(0.5, Math.round(base * (1 - REGLAGES.prix_fourchette) * 10) / 10);
}

// ---------- Les exemplaires étoilés (Book 25 §4.2, 0.6) ----------

/**
 * Ce que changent les étoiles d'un exemplaire au Comptoir : sa durée de vie. Une ★★★★★ dure deux fois plus qu'une
 * ★★★, elle vaut deux fois plus ; une ★ moitié moins. Un objet sans étoiles : ×1.
 */
export function facteurPrix(cle: string): number {
  const e = etoilesDe(cle);
  return e === null ? 1 : facteurs(typeDe(cle), e).solidite;
}

/** Ce que coûte un exemplaire (« machette_forgee#4 ») au Comptoir. */
export function prixVenteCle(cle: CleObjet): number {
  return Math.max(1, Math.round(prixVente(typeDe(cle)) * facteurPrix(cle)));
}

/** Ce que le Comptoir paie pour un exemplaire (null : il n'achète pas). */
export function prixAchatCle(cle: CleObjet, tresorerieBasse: boolean): number | null {
  return prixAchatExemplaire(prixAchat(typeDe(cle), tresorerieBasse), cle);
}

/** Le prix d'achat d'un exemplaire, à partir de celui de son type (le guichet du client n'a que celui-ci). */
export function prixAchatExemplaire(prixDuType: number | null | undefined, cle: string): number | null {
  if (prixDuType === null || prixDuType === undefined) return null;
  return Math.max(0.5, Math.round(prixDuType * facteurPrix(cle) * 10) / 10);
}

// ---------- L'énergie (Book 07 §3.4) ----------

/** Au printemps, le comptoir accepte l'énergie à 0,85 wott par Wh_é ; il la rend toujours à 1 wott par Wh_é. */
// Le taux de dépôt est réglable à chaud : REGLAGES.depot_wotts_par_wh.
export const PRIX_RETRAIT = 1;
/** Les cellules du Carrefour ont une capacité limitée (Book 07 §3.4). */
export const CAPACITE_CELLULES = 20_000;

/** Pédaler pour les Compteurs : leur pédalier paie le Wh_m au cours de base, 0,6 wott (Book 07 §2). */
export const WOTTS_PAR_WH_M = 0.6;

// ---------- Les bons (Book 07 §3.3) ----------

// Tous les wotts se déchargent d'≈ 2 % par semaine réelle, où qu'ils soient (REGLAGES.decharge_wotts_semaine).
const MS_SEMAINE = 7 * 24 * 3_600_000;

/** Une somme de wotts qui se décharge : sa valeur à un instant, et l'instant de cette valeur. */
export interface Wotts {
  valeur: number;
  majLe: number;
}

export function valeurWotts(w: Wotts, instant: number): number {
  if (w.valeur <= 0) return 0;
  return w.valeur * Math.pow(1 - REGLAGES.decharge_wotts_semaine, Math.max(0, instant - w.majLe) / MS_SEMAINE);
}

/** Ajoute (ou retire, si négatif) des wotts, à la valeur du moment. */
export function ajouterWotts(w: Wotts, montant: number, instant: number): Wotts {
  return { valeur: Math.max(0, valeurWotts(w, instant) + montant), majLe: instant };
}

/** Affichage : au dixième sous 10, à l'unité au-dessus. */
export function formaterWotts(valeur: number): string {
  // On arrondit vers le bas (jamais plus qu'on n'a), sans se laisser piéger par 254,999…
  const v = valeur < 10 ? Math.floor(valeur * 10 + 1e-6) / 10 : Math.floor(valeur + 1e-6);
  return `${String(v).replace(".", ",")} wott${v >= 2 ? "s" : ""}`;
}

// ---------- La trésorerie et le stock du Carrefour (Book 07 §3.6) ----------

/** Dotation : la part du Carrefour (≈ 20 % de ≈ 5 000 wotts par joueur attendu, pour une dizaine de joueurs)… */
export const DOTATION_CARREFOUR = 10_000;
/** … et ≈ 1 000 wotts de plus à chaque nouveau joueur. */
export const DOTATION_PAR_JOUEUR = 1_000;
/** La réserve plancher : sous ce seuil, il n'achète plus que les ressources de base, au plancher. */
export const RESERVE_PLANCHER = 0.2;
/** Énergie déjà dans les cellules au début du cycle (vestige de l'Abondance, Book 07 §3.6). */
export const RESERVE_ENERGIE_DEPART = 4_000;

/** Le stock que le Carrefour reconstitue lentement (validé, 2026-10-07). */
export const STOCK_DE_BASE: Inventaire = {
  conserve: 12,
  chiffons: 10,
  pansement: 6,
  cle_plate: 2,
  tournevis: 2,
  marteau: 2,
  petite_batterie: 1,
};
/** Un objet du stock de base revient toutes les deux heures réelles, jusqu'au niveau de départ. */
export const REASSORT_MS = 2 * 3_600_000;

export interface EtatComptoir {
  tresorerie: number;
  /** Énergie en réserve dans les cellules, en Wh_é. */
  reserveWh: number;
  stock: Inventaire;
  /** Le dernier réassort. */
  reassortLe: number;
}

export function tresorerieBasse(e: EtatComptoir, dotationTotale: number): boolean {
  return e.tresorerie < dotationTotale * RESERVE_PLANCHER;
}

/** Le stock revient peu à peu (une unité par objet manquant toutes les REASSORT_MS). */
export function reassortir(e: EtatComptoir, instant: number): EtatComptoir {
  const n = Math.floor((instant - e.reassortLe) / REASSORT_MS);
  if (n <= 0) return e;
  const stock = { ...e.stock };
  for (const [type, cible] of Object.entries(STOCK_DE_BASE) as [TypeObjet, number][]) {
    stock[type] = Math.min(Math.max(stock[type] ?? 0, cible), (stock[type] ?? 0) + n);
  }
  return { ...e, stock, reassortLe: e.reassortLe + n * REASSORT_MS };
}
