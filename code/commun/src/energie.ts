// L'énergie stockée et produite de l'É2 (lot 2) : batteries, pédalier, charbonnière, lumière électrique.
// Valeurs réalistes (Book 01 §2), rapportées à l'horloge d'action. Réglages à caler en test.

import { REGLAGES } from "./reglages.ts";
import type { Famille } from "./regles.ts";

// ---------- Batteries ----------

export type TypeBatterie = "petite_batterie" | "batterie_voiture";

/** Charges stockées, en Wh_é, par type de batterie (toutes les batteries d'un type mises en commun). */
export type Charges = Partial<Record<TypeBatterie, number>>;

/** Capacité utile d'une batterie, en Wh_é. Batterie de voiture : 12 V × 60 Ah, à 50 % (Book 01 §2). */
export const CAPACITES: Record<TypeBatterie, number> = { petite_batterie: 50, batterie_voiture: 360 };

/** Charge à la découverte : la batterie de la ruine est à moitié pleine ; la petite batterie du kit, presque. */
export const CHARGE_TROUVEE: Record<TypeBatterie, number> = { petite_batterie: 40, batterie_voiture: 180 };

/** Décharge spontanée par saison (= semaine réelle), Book 01 §2 bis : plomb ≈ 10 %, lithium ≈ 5 %. */
export const DECHARGE_PAR_SAISON: Record<TypeBatterie, number> = { petite_batterie: 0.05, batterie_voiture: 0.1 };
const MS_PAR_SAISON = 7 * 24 * 3600 * 1000;

export function capacite(type: TypeBatterie, nombre: number): number {
  return CAPACITES[type] * nombre;
}

/** Applique la décharge spontanée sur une durée réelle (calendrier). */
export function decharger(charges: Charges, ms: number): Charges {
  const resultat: Charges = {};
  for (const [type, wh] of Object.entries(charges) as [TypeBatterie, number][]) {
    resultat[type] = wh * Math.pow(1 - DECHARGE_PAR_SAISON[type], ms / MS_PAR_SAISON);
  }
  return resultat;
}

// ---------- Production et consommation ----------

/** Un humain qui pédale produit ≈ 100 Wh_m par heure de jeu (Book 01 §2) ; un Mécaniste 30 % de plus (Book 01 §4). */
export const WH_M_PAR_HEURE = 100;
export const BONUS_MECANISTE = 1.3;
/** La dynamo de vélo convertit ≈ 60 % de l'énergie mécanique en électricité (Book 01 §2 : 50 à 70 %). */
export const RENDEMENT_DYNAMO = 0.6;
/** Pédaler coûte ≈ 350 kcal par heure, soit ≈ 250 de plus qu'au repos. */
export const KCAL_PEDALAGE_EN_PLUS = 250;
/** Une séance de pédalage : une heure de jeu = une minute réelle. */
export const DUREE_PEDALAGE = 60;

export function whEDePedalage(famille: Famille, heures = 1): number {
  return WH_M_PAR_HEURE * heures * (famille === "mecanistes" ? BONUS_MECANISTE : 1) * RENDEMENT_DYNAMO;
}

/** Le banc de recharge transfère ≈ 30 Wh par heure de jeu, avec 85 % de rendement (Book 02 §8). */
export const WH_RECHARGE_PAR_HEURE = 30;
export const RENDEMENT_BANC = 0.85;

/** La lampe frontale consomme ≈ 3 W : 3 Wh par heure de jeu, pris sur la petite batterie. */
export const CONSOMMATION_FRONTALE = 3;

// ---------- Charbonnière (Book 02 §12.2) ----------

/** Trois jours de jeu à l'horloge d'action : 72 minutes réelles, même hors ligne. */
export const DUREE_CHARBONNIERE_MS = 3 * 24 * 60_000;
/** 10 bûches (20 kg de bois) donnent ≈ 4,4 kg de charbon (rendement réaliste de 20 à 25 %) : 4 kg récupérés. */
export const CHARBON_PRODUIT = 4;

// ---------- La base qui produit seule (É4, lot 2 : Book 01 §2 bis) ----------

/** Un jour de calendrier : 1 année (365 jours) = 4 semaines réelles, soit ≈ 1 h 50 réelle. */
export const MS_JOUR_CALENDRIER = (28 * 24 * 3_600_000) / 365;

/**
 * Le petit panneau de 20 W de la station-service. Book 01 §2 : un panneau de 100 W donne ≈ 400 Wh_é par jour de
 * calendrier en climat tempéré (≈ 100 l'hiver, ≈ 600 l'été). Au printemps (saison fixe de la 0a) : ≈ 80 Wh_é par jour.
 */
// Réglable à chaud : REGLAGES.panneau_wh_jour (80 par défaut).
/** Le panneau se branche tout seul sur un banc de recharge assez proche (le câble n'est pas long). */
export const PORTEE_CABLE_PANNEAU = 6;

/** Ce que produit un panneau pendant une durée réelle (au calendrier, connecté ou non). */
export function productionPanneau(ms: number): number {
  return (REGLAGES.panneau_wh_jour * Math.max(0, ms)) / MS_JOUR_CALENDRIER;
}

/** Des batteries posées sur un banc : combien de chaque type, et leur charge. */
export interface Stockage {
  batteries: Partial<Record<TypeBatterie, number>>;
  charges: Charges;
}

/**
 * Le surplus va aux batteries (la petite d'abord, puis celle de voiture) ; ce qui ne trouve pas de place est perdu
 * (Book 01 §2 bis : 1. les machines, 2. les batteries, 3. le reste est perdu). Renvoie ce qui a été stocké et perdu.
 */
export function stocker(s: Stockage, wh: number): { stockage: Stockage; stocke: number; perdu: number } {
  const charges: Charges = { ...s.charges };
  let reste = wh;
  for (const b of ["petite_batterie", "batterie_voiture"] as const) {
    const n = s.batteries[b] ?? 0;
    if (n === 0 || reste <= 0) continue;
    const place = Math.max(0, capacite(b, n) - (charges[b] ?? 0));
    const mis = Math.min(place, reste);
    charges[b] = (charges[b] ?? 0) + mis;
    reste -= mis;
  }
  return { stockage: { ...s, charges }, stocke: wh - reste, perdu: reste };
}
