// L'énergie stockée et produite de l'É2 (lot 2) : batteries, pédalier, charbonnière, lumière électrique.
// Valeurs réalistes (Book 01 §2), rapportées à l'horloge d'action. Réglages à caler en test.

import { REGLAGES } from "./reglages.ts";
import type { Famille } from "./regles.ts";
import { DUREE_TRANCHE_MS, tempsDeLaTranche, vent, type Temps, type Vent } from "./meteo.ts";
import { HEURE_DEPART, HEURE_FIN_NUIT, HEURE_TOMBEE_NUIT, MS_PAR_HEURE_JEU } from "./temps.ts";

// ---------- Batteries ----------

/** Plan 0.10 (chantier D, S-26) : la batterie de cellules ⚡, 120 Wh, se pose à la base comme celle de voiture. */
export type TypeBatterie = "petite_batterie" | "batterie_voiture" | "batterie_cellules";

/** Tous les types de batteries, de la petite (la frontale) aux batteries de base. */
export const TYPES_BATTERIES: readonly TypeBatterie[] = ["petite_batterie", "batterie_voiture", "batterie_cellules"];

/** Charges stockées, en Wh_é, par type de batterie (toutes les batteries d'un type mises en commun). */
export type Charges = Partial<Record<TypeBatterie, number>>;

/** Capacité utile d'une batterie, en Wh_é. Batterie de voiture : 12 V × 60 Ah, à 50 % (Book 01 §2). */
// La batterie de cellules (N2-45) : douze cellules d'environ 10 Wh, soit 120 Wh.
export const CAPACITES: Record<TypeBatterie, number> = { petite_batterie: 50, batterie_voiture: 360, batterie_cellules: 120 };

/** Charge à la découverte : la batterie de la ruine est à moitié pleine ; la petite batterie du kit, presque. */
// La batterie de cellules ne se trouve pas : elle sort vide du poste de montage.
export const CHARGE_TROUVEE: Record<TypeBatterie, number> = { petite_batterie: 40, batterie_voiture: 180, batterie_cellules: 0 };

/** Décharge spontanée par saison (= semaine réelle), Book 01 §2 bis : plomb ≈ 10 %, lithium ≈ 5 %. */
export const DECHARGE_PAR_SAISON: Record<TypeBatterie, number> = { petite_batterie: 0.05, batterie_voiture: 0.1, batterie_cellules: 0.05 };
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
/**
 * Ce que la roue du pédalier générateur entraîne (plan 0.8, chantier 7) : le petit alternateur de la station (la clé),
 * ou la dynamo du vélo (le repli).
 */
export type OrganePedalier = "alternateur" | "dynamo";
/**
 * Le petit alternateur, entraîné par une courroie : ≈ 46 % de l'énergie des jambes, à ce petit régime (un alternateur de
 * voiture tourne loin de son meilleur point). Un Mécaniste qui pédale une heure : ≈ 60 Wh dans la batterie.
 */
export const RENDEMENT_ALTERNATEUR = 0.46;
/** La dynamo de vélo (le repli) : faite pour une lampe, elle plafonne à 3 à 6 W, quoi qu'on mette dans les jambes. */
export const WATTS_DYNAMO_VELO = 5;
/** Pédaler coûte ≈ 350 kcal par heure, soit ≈ 250 de plus qu'au repos. */
export const KCAL_PEDALAGE_EN_PLUS = 250;
/** Une séance de pédalage : une heure de jeu = une minute réelle. */
export const DUREE_PEDALAGE = 60;

/** Les Wh électriques d'une séance de pédalage : ≈ 60 par heure avec l'alternateur (Mécaniste), 5 avec la dynamo. */
export function whEDePedalage(famille: Famille, heures = 1, organe: OrganePedalier = "alternateur"): number {
  if (organe === "dynamo") return WATTS_DYNAMO_VELO * heures;
  return WH_M_PAR_HEURE * heures * (famille === "mecanistes" ? BONUS_MECANISTE : 1) * RENDEMENT_ALTERNATEUR;
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
// Réglable à chaud : REGLAGES.panneau_wh_jour (80 par défaut). Depuis la 0.8, il se pose sur le banc solaire (un seul
// meuble, `EtatInstallation.panneau`) et remplit les batteries posées dessus : la batterie de la ruine.
/** Un panneau posé à part (avant la 0.8) se branchait tout seul sur un banc de recharge assez proche (le câble n'est pas long). */
export const PORTEE_CABLE_PANNEAU = 6;

// ---------- Le banc qui suit le soleil (plan 0.10, chantier D ; S-30, Q-0.10-6) ----------
//
// Avant la 0.10, le panneau produisait au calendrier sans regarder le ciel : 80 Wh par jour de calendrier, la nuit et
// sous la pluie aussi. Désormais : la moyenne d'avant × un facteur d'heure (0 la nuit) × un facteur de temps. Le facteur
// d'heure est une cloche (un sinus) du lever (5 h 30) au coucher (21 h), réglée pour valoir 1 en moyenne sur 24 h : un
// jour de calendrier tout au soleil donne donc les mêmes 80 Wh qu'avant (≈ 17 Wh par jour de jeu de 24 min ; au plus haut,
// ≈ 8 W au lieu de 3,3 W en continu). Par temps voilé, 0,6 ; couvert, 0,3 ; sous la pluie, rien.

/** Le facteur de temps du panneau (S-30). */
export const SOLEIL_PAR_TEMPS: Record<Temps, number> = { soleil: 1, voile: 0.6, couvert: 0.3, pluie: 0 };

/** La durée du jour, en heures de jeu (15 h 30). */
const HEURES_JOUR = HEURE_TOMBEE_NUIT - HEURE_FIN_NUIT;
/** Le haut de la cloche, à 13 h 15 : 24 π / (2 × 15,5) ≈ 2,43, pour une moyenne de 1 sur 24 h. */
export const CRETE_SOLEIL = (24 * Math.PI) / (2 * HEURES_JOUR);

/** Le facteur d'heure du panneau (S-30) : 0 la nuit, une cloche le jour ; sa moyenne sur 24 h vaut 1. */
export function facteurHeureSoleil(heure: number): number {
  const h = ((heure % 24) + 24) % 24;
  if (h < HEURE_FIN_NUIT || h >= HEURE_TOMBEE_NUIT) return 0;
  return CRETE_SOLEIL * Math.sin((Math.PI * (h - HEURE_FIN_NUIT)) / HEURES_JOUR);
}

/** L'intégrale du facteur d'heure depuis le début du monde, en heures de jeu (`H` : heures de jeu absolues). */
function cumulSoleil(H: number): number {
  const jours = Math.floor(H / 24);
  const h = H - jours * 24;
  let dansLeJour = 0;
  if (h >= HEURE_TOMBEE_NUIT) dansLeJour = 24;
  else if (h > HEURE_FIN_NUIT) dansLeJour = ((CRETE_SOLEIL * HEURES_JOUR) / Math.PI) * (1 - Math.cos((Math.PI * (h - HEURE_FIN_NUIT)) / HEURES_JOUR));
  return jours * 24 + dansLeJour;
}

/** Les heures de jeu absolues (depuis minuit du jour 0) d'un instant réel. */
function heuresAbsolues(instant: number, debutMonde: number): number {
  return (instant - debutMonde) / MS_PAR_HEURE_JEU + HEURE_DEPART;
}

/** Le temps d'une tranche de météo : celui du monde, ou un autre pour les tests et les calculs (« un beau jour »). */
export type TempsDeLaTranche = (tranche: number) => Temps;

/**
 * Une production au calendrier, tranche de météo par tranche de météo (3 min réelles) : `parTemps` donne le facteur du
 * temps, `avecLeSoleil` multiplie par le facteur d'heure. Rend l'intégrale en « ms pleines » (des ms à facteur 1).
 */
function integrerMeteo(depuis: number, jusqua: number, debutMonde: number, parTemps: (t: Temps) => number, avecLeSoleil: boolean, tempsDe: TempsDeLaTranche): number {
  if (!(jusqua > depuis)) return 0;
  let total = 0;
  let t = depuis;
  while (t < jusqua) {
    const tranche = Math.floor(Math.max(0, t - debutMonde) / DUREE_TRANCHE_MS);
    const fin = Math.min(jusqua, t < debutMonde ? debutMonde : debutMonde + (tranche + 1) * DUREE_TRANCHE_MS);
    const f = parTemps(tempsDe(tranche));
    if (f > 0) total += f * (avecLeSoleil ? (cumulSoleil(heuresAbsolues(fin, debutMonde)) - cumulSoleil(heuresAbsolues(t, debutMonde))) * MS_PAR_HEURE_JEU : fin - t);
    t = fin;
  }
  return total;
}

/**
 * Ce que produit le panneau entre deux instants réels (au calendrier, connecté ou non) : 80 Wh par jour de calendrier
 * en moyenne au soleil, rien la nuit ni sous la pluie (S-30). `tempsDe` : le temps de chaque tranche (celui du monde).
 */
export function productionPanneau(depuis: number, jusqua: number, debutMonde: number, tempsDe: TempsDeLaTranche = tempsDeLaTranche): number {
  return (REGLAGES.panneau_wh_jour * integrerMeteo(depuis, jusqua, debutMonde, (t) => SOLEIL_PAR_TEMPS[t], true, tempsDe)) / MS_JOUR_CALENDRIER;
}

/** La puissance du panneau à un instant (W, au calendrier), pour la fiche du banc. */
export function puissancePanneau(instant: number, debutMonde: number, tempsDe: TempsDeLaTranche = tempsDeLaTranche): number {
  const tranche = Math.floor(Math.max(0, instant - debutMonde) / DUREE_TRANCHE_MS);
  return ((REGLAGES.panneau_wh_jour / 24) * facteurHeureSoleil(heuresAbsolues(instant, debutMonde)) * SOLEIL_PAR_TEMPS[tempsDe(tranche)]);
}

/** Des watts tenus pendant une durée réelle, en Wh, au calendrier (comme les clôtures : 3 W font 72 Wh par jour). */
export function whDePuissance(watts: number, ms: number): number {
  return (watts * 24 * Math.max(0, ms)) / MS_JOUR_CALENDRIER;
}

// ---------- Le moulin de jerricans ⚙️ (plan 0.10, chantier D ; N2-47, S-28) ----------

/** Ce que donne le moulin selon le vent (W) : 15 quand il vente (couvert, pluie), 5 par temps voilé, rien au calme. */
export const WATTS_MOULIN: Record<Vent, number> = { fort: 15, faible: 5, calme: 0 };
/** La poulie d'aluminium 🔥 posée sur son axe : 50 % de production en plus (au lieu d'entraîner la meule, S-28). */
export const BONUS_POULIE = 1.5;

/** Ce que produit le moulin entre deux instants réels, au calendrier, même hors ligne (Wh). */
export function productionMoulin(depuis: number, jusqua: number, debutMonde: number, poulie = false, tempsDe: TempsDeLaTranche = tempsDeLaTranche): number {
  const ms = integrerMeteo(depuis, jusqua, debutMonde, (t) => WATTS_MOULIN[vent(t)], false, tempsDe);
  return whDePuissance(poulie ? BONUS_POULIE : 1, ms);
}

/** Les heures réelles de nuit (ms) entre deux instants : la rampe de LED ne tire que la nuit (21 h – 5 h 30 de jeu). */
export function msDeNuit(depuis: number, jusqua: number, debutMonde: number): number {
  if (!(jusqua > depuis)) return 0;
  // Les heures de nuit = les heures écoulées moins les heures de jour ; le jour, de 5 h 30 à 21 h, par jour entier.
  const jour = (H: number) => {
    const j = Math.floor(H / 24);
    const h = H - j * 24;
    return j * HEURES_JOUR + Math.min(HEURES_JOUR, Math.max(0, h - HEURE_FIN_NUIT));
  };
  const a = heuresAbsolues(depuis, debutMonde);
  const b = heuresAbsolues(jusqua, debutMonde);
  return (b - a - (jour(b) - jour(a))) * MS_PAR_HEURE_JEU;
}

/**
 * Les meubles qui portent des batteries (plan 0.8, chantier 7) : le banc solaire ⚡, que le panneau remplit ; le pédalier
 * générateur ⚙️, que l'on remplit en pédalant. On y pose la batterie de la ruine, on l'y reprend.
 */
export const MEUBLES_A_BATTERIES = ["banc_recharge", "pedalier"] as const;

/**
 * La batterie de la base (plan 0.10, chantier D) : celle que remplit le moulin de jerricans et que vide la rampe de LED.
 * Le meuble à batteries le plus proche qui en porte une (le banc solaire, ou le pédalier), sinon null.
 */
export function meubleABatterieProche<T extends { type: string; x: number; z: number; etat: { batteries?: Partial<Record<TypeBatterie, number>> } }>(de: { x: number; z: number }, installations: Iterable<T>): T | null {
  let meilleur: T | null = null;
  let d = Infinity;
  for (const i of installations) {
    if (!porteBatteries(i.type) || !Object.values(i.etat.batteries ?? {}).some((n) => (n ?? 0) > 0)) continue;
    const di = Math.hypot(i.x - de.x, i.z - de.z);
    if (di < d) {
      d = di;
      meilleur = i;
    }
  }
  return meilleur;
}
export function porteBatteries(type: string): boolean {
  return (MEUBLES_A_BATTERIES as readonly string[]).includes(type);
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
  for (const b of TYPES_BATTERIES) {
    const n = s.batteries[b] ?? 0;
    if (n === 0 || reste <= 0) continue;
    const place = Math.max(0, capacite(b, n) - (charges[b] ?? 0));
    const mis = Math.min(place, reste);
    charges[b] = (charges[b] ?? 0) + mis;
    reste -= mis;
  }
  return { stockage: { ...s, charges }, stocke: wh - reste, perdu: reste };
}

// ---------- Le banc de recharge (0.8.2, chantier C : R17) ----------
//
// Le banc fait passer l'énergie de la batterie posée dedans vers ce qu'on porte. Une seule batterie, à demeure : au
// départ, la batterie de voiture de la ruine. On la remplit (le panneau posé sur le banc, un pédalier générateur tout
// près, la manivelle en secours), on l'échange contre une batterie du sac, et l'on charge ce qu'on porte, une chose à
// la fois, depuis la fiche du banc. Chaque batterie se nomme par son nom (jamais « grosse batterie »).

/**
 * Les batteries qui se posent dans le banc, de la préférée à la moins bonne. Une batterie de plus forte capacité, plus
 * tard, s'ajoutera ici (avec son type, sa capacité, sa décharge et son nom) ; la petite batterie reste à la frontale.
 */
export const BATTERIES_DE_BANC: readonly TypeBatterie[] = ["batterie_voiture", "batterie_cellules"];
export function estBatterieDeBanc(b: string): b is TypeBatterie {
  return (BATTERIES_DE_BANC as readonly string[]).includes(b);
}

/** Le nom de chaque batterie dans les textes. */
export const NOMS_BATTERIES: Record<TypeBatterie, string> = {
  petite_batterie: "la petite batterie de la frontale",
  batterie_voiture: "la batterie de voiture",
  batterie_cellules: "la batterie de cellules",
};
/** Celle que le banc reçoit au départ. */
export const NOM_BATTERIE_DE_LA_RUINE = "la batterie de voiture de la ruine";

/** La batterie posée dans un banc : son type, sa charge, sa capacité (null : aucune). */
export interface BatterieDuBanc {
  type: TypeBatterie;
  wh: number;
  capacite: number;
  nom: string;
}

/**
 * La batterie du banc. Une partie d'avant la 0.8.2 a pu en poser plusieurs : on lit alors la préférée (la batterie de
 * voiture) ; les autres reviennent au sac à la connexion (`batteriesEnTrop`).
 */
export function batterieDuBanc(etat: { batteries?: Partial<Record<TypeBatterie, number>>; charges?: Charges; batterieEchangee?: boolean }): BatterieDuBanc | null {
  const ordre = [...BATTERIES_DE_BANC, ...(Object.keys(CAPACITES) as TypeBatterie[]).filter((b) => !estBatterieDeBanc(b))];
  for (const type of ordre) {
    const n = etat.batteries?.[type] ?? 0;
    if (n <= 0) continue;
    const nom = type === "batterie_voiture" && !etat.batterieEchangee ? NOM_BATTERIE_DE_LA_RUINE : NOMS_BATTERIES[type];
    return { type, wh: Math.max(0, etat.charges?.[type] ?? 0), capacite: capacite(type, n), nom };
  }
  return null;
}

/** Un pédalier générateur posé à moins de 3 m du banc charge directement sa batterie (décidé le 2026-10-11). */
export const PORTEE_PEDALIER_BANC = 3;

/** Le banc qu'un pédalier charge : le plus proche à moins de 3 m (null : aucun). */
export function bancDuPedalier<T extends { type: string; x: number; z: number }>(pedalier: { x: number; z: number }, installations: Iterable<T>): T | null {
  let meilleur: T | null = null;
  let d = PORTEE_PEDALIER_BANC + 1e-9;
  for (const i of installations) {
    if (i.type !== "banc_recharge") continue;
    const di = Math.hypot(i.x - pedalier.x, i.z - pedalier.z);
    if (di <= d) {
      d = di;
      meilleur = i;
    }
  }
  return meilleur;
}

/** Une charge au banc ne dure jamais plus de 2 minutes réelles (≈ 60 Wh) : au-delà, on recommence. */
export const DUREE_CHARGE_MAX_S = 120;

/** La durée d'une charge au banc, en secondes réelles : 30 Wh par heure de jeu (une minute réelle), 3 s au moins. */
export function dureeCharge(wh: number): number {
  return Math.max(3, Math.min(DUREE_CHARGE_MAX_S, (wh / WH_RECHARGE_PAR_HEURE) * 60));
}

/** Ce qu'une charge fait entrer au plus, en Wh (le débit sur la durée maximale). */
export const WH_CHARGE_MAX = (WH_RECHARGE_PAR_HEURE * DUREE_CHARGE_MAX_S) / 60;
