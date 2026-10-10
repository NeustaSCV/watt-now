// L'économie de la 0a (Book 07, Book 21 §3.7) : le Comptoir du Carrefour, à prix fixes, et le wott.
// Le wott est un bon des Compteurs, remboursable contre 1 Wh_é ; seul le dépôt d'électricité en crée.
// Valeurs de réglage, à caler pendant le test (Book 07 §3.6).

import { REGLAGES } from "./reglages.ts";
import { LIEUX, minuscule, type LieuId } from "./lieux.ts";
import { OBJETS, type Inventaire, type TypeObjet } from "./objets.ts";
import { energieGrise } from "./recettes.ts";
import { etoilesDe, facteurs, typeDe, type CleObjet } from "./etoiles.ts";

// ---------- Les prix (Book 07 §4) ----------

// Fourchette du Carrefour : il vend 20 % au-dessus du prix de base, achète 20 % en dessous (Book 07 §4.2).
// Réglable à chaud : REGLAGES.prix_fourchette.
/** Prix plancher des ressources de base : toujours rachetées à au moins 0,5× (Book 07 §4.3). */
export const PLANCHER = 0.5;
export const RESSOURCES_DE_BASE: TypeObjet[] = ["branche", "buche", "pierre", "baies", "conserve"];
/**
 * Ce que les Compteurs ne rachètent pas. Plan 0.8 (§2.5, chantier 10) : les pièces de famille ne s'y vendent pas
 * (chacun trouve la sienne à la station, et elle revient pour lui) ; elles n'entrent donc jamais dans son stock.
 */
const INVENDABLES: TypeObjet[] = ["sac_a_dos", "panneau_solaire", "enclume_depanneur", "petit_alternateur"];

// ---------- Les clés de L1 au Comptoir (plan 0.8, chantier 10 ; avis du game designer, règle 6 et Q4 ; Q-0.8-12) ----------

/**
 * Le prix des clés de L1 : « une soupape, pas un raccourci ». Il vaut **deux allers-retours de travail** jusqu'à leur
 * lieu. Un aller-retour à la Coopérative (ou au Moulin, à la même distance, B16) : 2 × 5 km, à 60 kcal/km à vide et
 * ≈ 85 chargé, plus la visite, soit ≈ 720 kcal. Le Comptoir paie déjà la calorie 0,24 wott (la conserve : 400 kcal
 * pour 96 wotts ; son pédalier : 60 wotts pour 250 kcal) : deux allers-retours ≈ 1 450 kcal ≈ **350 wotts**. Le
 * temps et le risque de la route ne sont pas comptés : c'est ce que le joueur pressé achète. Le porteur l'a monté à
 * **500 wotts** (2026-10-10 : « ça me semble encore abordable »). Il les **rachète 90
 * wotts** (≈ un aller simple) : la chance d'un joueur devient un peu de richesse, sans faire de la Coopérative une
 * mine de wotts (trois clés par jour, 270 wotts, pour ≈ 180 wotts de vivres et le combat).
 */
export const PRIX_CLES_L1 = { vente: 500, rachat: 90 } as const;

/** Les clés de L1 et leur lieu : le Comptoir ne les vend qu'à qui y est déjà allé (le fait `visite:<lieu>`). */
export const LIEU_DES_CLES: Partial<Record<TypeObjet, LieuId>> = {
  grillage_rouleau: "cooperative",
  cocotte_fonte: "cooperative",
  seau_10l: "cooperative",
  toile_jute: "moulin",
  feuillards: "moulin",
  etau: "moulin",
};

/**
 * Le Comptoir refuse-t-il de vendre cet objet à ce joueur ? Une clé de L1 ne se vend qu'après une première visite de
 * son lieu (plan 0.8 §2.2 : la quatrième source d'une clé). Renvoie la phrase du refus, ou null.
 */
export function refusVenteCle(type: TypeObjet, faits: Readonly<Record<string, number>>): string | null {
  const lieu = LIEU_DES_CLES[type];
  if (!lieu || (faits[`visite:${lieu}`] ?? 0) > 0) return null;
  return `« ${OBJETS[type].nom.charAt(0).toUpperCase()}${OBJETS[type].nom.slice(1)} ? Va d'abord voir ${minuscule(LIEUX[lieu].nom)} : on en reparlera. » Les Compteurs ne vendent une clé qu'à qui connaît son lieu.`;
}

/**
 * L'étal du Comptoir tel qu'un joueur le voit (plan 0.8 §9.2, chantier 13) : les clés de L1 dont il n'a pas visité le
 * lieu en sont **absentes** (pas grisées) ; tout le reste, tel quel. Le serveur l'applique à chaque vue qu'il envoie.
 */
export function etalPour(stock: Inventaire, faits: Readonly<Record<string, number>>): Inventaire {
  const etal: Inventaire = {};
  for (const [cle, n] of Object.entries(stock) as [CleObjet, number][]) {
    const lieu = LIEU_DES_CLES[typeDe(cle)];
    if (!lieu || (faits[`visite:${lieu}`] ?? 0) > 0) etal[cle] = n;
  }
  return etal;
}

export function prixBase(type: TypeObjet): number {
  return energieGrise(type);
}

/** Ce que coûte un objet au comptoir (une clé de L1 : PRIX_CLES_L1). */
export function prixVente(type: TypeObjet): number {
  if (LIEU_DES_CLES[type]) return PRIX_CLES_L1.vente;
  return Math.max(1, Math.round(prixBase(type) * (1 + REGLAGES.prix_fourchette)));
}

/**
 * Ce que le comptoir paie pour un objet. Trésorerie basse : il n'achète plus que les ressources de base,
 * au prix plancher (Book 07 §3.6). Renvoie null s'il n'achète pas.
 */
export function prixAchat(type: TypeObjet, tresorerieBasse: boolean): number | null {
  if (INVENDABLES.includes(type)) return null;
  if (LIEU_DES_CLES[type]) return tresorerieBasse ? null : PRIX_CLES_L1.rachat;
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
  // L'arbrier et la brouette demandent de scier le bois, et seuls les Mécanistes partent avec une scie (0.7,
  // chantier 6) : sans elle, celui qui les apprend d'un Mécaniste ou d'un manuel ne pouvait jamais les faire.
  scie: 1,
  // Plan 0.8 (B13) : le filet du bois et de la pierre, au prix de vente (19 et 7 wotts) : 190 wotts les 10 bûches.
  buche: 10,
  pierre: 10,
  // Plan 0.8 (chantier 10) : une clé de L1 de chaque, en stock limité, vendue après une première visite de son lieu.
  grillage_rouleau: 1,
  cocotte_fonte: 1,
  seau_10l: 1,
  toile_jute: 1,
  feuillards: 1,
  etau: 1,
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
