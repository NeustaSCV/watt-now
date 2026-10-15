// Règles de survie de l'É1 : besoins (faim, soif), feu de camp, eau, ramassage.
// Valeurs réalistes du Book 05 §3 et du Book 02, rapportées à l'horloge d'action. Réglages à caler en test.

import { REGLAGES } from "./reglages.ts";
import { OBJETS, type Inventaire, type TypeObjet } from "./objets.ts";
import type { Allure } from "./regles.ts";
import { FEU_COUVERT, effetsFeu } from "./lignees.ts";

// ---------- Besoins (Book 05 §3) ----------

/** Besoin de nourriture : 2 500 kcal par jour de jeu (24 heures = 24 minutes réelles). */
export const KCAL_PAR_HEURE = 2500 / 24;
/** Besoin en eau : ≈ 2,5 L par jour de jeu. */
export const LITRES_PAR_HEURE = 2.5 / 24;
/**
 * Réserves maximales : une journée de nourriture ; 1,5 L d'eau (plan 0.10.1, A8 : 2,5 L avant). La soif est un débit en
 * litres : `soif_rythme` a été ralenti d'autant (0,35 → 0,21), si bien que la jauge pleine dure toujours ≈ 70 min réelles.
 */
export const RESERVE_KCAL_MAX = 2500;
export const RESERVE_EAU_MAX = 1.5;
/** En dessous de ce seuil (part de la réserve), le personnage a faim ou soif : plus de course. */
export const SEUIL_MANQUE = 0.15;
/** Un plat chaud cale : la faim revient deux fois moins vite pendant ces heures de jeu (2026-10-08). */
export const RASSASIE_HEURES = 6;
/** La cuisson rend les aliments plus digestes : un plat apporte ≈ 25 % d'énergie de plus que ses ingrédients crus. */
export const BONUS_CUISSON = 1.25;
/** Contenance d'une gourde, en litres. */
export const CONTENANCE_GOURDE = 1;
/** La bouteille d'eau pleine (plan 0.10.1, A4) : un litre, qu'on boit d'un trait. */
export const LITRES_BOUTEILLE = 1;
/** Une gorgée, en litres. */
export const GORGEE = 0.25;

export interface Besoins {
  /** Réserve d'énergie, en kcal. */
  kcal: number;
  /** Réserve d'eau, en litres. */
  eau: number;
  /** Repos : 1 bien reposé, 0 à bout de forces (Book 05 §3 : ≈ 8 h de sommeil par jour). */
  repos: number;
}

// ---------- Sommeil (É5, Book 05 §3) ----------

/** Éveillé, on s'use en 16 heures de jeu ; on récupère en 8 heures dans un abri, deux fois moins vite par terre. */
export const REPOS_PERDU_PAR_HEURE = 1 / 16;
export const REPOS_GAGNE_PAR_HEURE_ABRI = 1 / 8;
export const REPOS_GAGNE_PAR_HEURE_SOL = 1 / 16;
/** En dessous, on est épuisé : plus de course, et le travail est plus lent. */
export const SEUIL_FATIGUE = 0.15;
/** Fatigué, on travaille moins vite (Book 05 §3 : erreurs de crafting). */
export const MALUS_FATIGUE = 1.3;

export function fatigue(b: Besoins): boolean {
  return b.repos < SEUIL_FATIGUE;
}

/** Le lit de branchages isole du sol : on récupère un tiers plus vite (P-002). */
export const BONUS_LIT = 1.3;

/**
 * `confort` : ce que l'abri amélioré et le foyer voisin ajoutent (Book 24 : abri garni ou fermé, muret qui renvoie
 * la chaleur). Il remplace le bonus du lit quand il est plus grand (l'abri garni a déjà son lit).
 */
export function dormir(b: Besoins, heures: number, dansUnAbri: boolean, surUnLit = false, confort = 1): Besoins {
  const taux = (dansUnAbri ? REPOS_GAGNE_PAR_HEURE_ABRI : REPOS_GAGNE_PAR_HEURE_SOL) * Math.max(surUnLit ? BONUS_LIT : 1, confort);
  return { ...b, repos: Math.min(1, b.repos + heures * taux) };
}

export type ContenuGourde = "potable" | "brute";

export interface Gourde {
  contenu: ContenuGourde;
  litres: number;
}

/**
 * Plusieurs gourdes, une seule réserve (plan 0.10.1, A5) : elle tient 1 L par gourde portée. Une gourde qui quitte le
 * sac emporte l'eau qui ne tient plus dans les autres.
 */
export function contenanceGourdes(inventaire: Inventaire): number {
  return CONTENANCE_GOURDE * Math.max(0, Math.floor(inventaire.gourde ?? 0));
}

/** « ta gourde » ou « tes gourdes », selon ce qu'on porte. */
export function taGourde(inventaire: Inventaire, majuscule = false): string {
  const t = (inventaire.gourde ?? 0) > 1 ? "tes gourdes" : "ta gourde";
  return majuscule ? t[0]!.toUpperCase() + t.slice(1) : t;
}

export const BESOINS_DEPART: Besoins = { kcal: RESERVE_KCAL_MAX, eau: RESERVE_EAU_MAX * 0.8, repos: 1 };
export const GOURDE_DEPART: Gourde = { contenu: "potable", litres: CONTENANCE_GOURDE };

/**
 * Fait passer `heures` heures de jeu sur les besoins. Les besoins sont gelés hors ligne (Book 01 §2 bis).
 * `cale` : après un vrai repas chaud, la faim revient deux fois moins vite (voir RASSASIE_HEURES).
 * `saison` : le surplus de la saison (saisons.ts, `surplusSaison`), 1 au printemps et à l'automne.
 */
export function consommer(besoins: Besoins, heures: number, effort = 1, endormi = false, cale = false, saison: { faim: number; soif: number } = { faim: 1, soif: 1 }): Besoins {
  return {
    kcal: Math.max(0, besoins.kcal - KCAL_PAR_HEURE * REGLAGES.faim_rythme * heures * effort * (cale ? 0.5 : 1) * saison.faim),
    eau: Math.max(0, besoins.eau - LITRES_PAR_HEURE * REGLAGES.soif_rythme * heures * effort * saison.soif),
    repos: endormi ? besoins.repos : Math.max(0, (besoins.repos ?? 1) - REPOS_PERDU_PAR_HEURE * REGLAGES.sommeil_rythme * heures),
  };
}

export function aFaim(b: Besoins): boolean {
  return b.kcal < RESERVE_KCAL_MAX * SEUIL_MANQUE;
}

export function aSoif(b: Besoins): boolean {
  return b.eau < RESERVE_EAU_MAX * SEUIL_MANQUE;
}

/**
 * Affamé, assoiffé ou épuisé, on ne peut plus courir ; un objet lourd dans les bras non plus (on marche).
 * Appliqué pareil sur le client et le serveur.
 */
export function allureAutorisee(allure: Allure, b: Besoins, charge = false): Allure {
  return allure === "course" && (charge || aFaim(b) || aSoif(b) || fatigue(b)) ? "marche" : allure;
}

/** L'effort fait brûler plus vite les réserves. */
export const EFFORT_PAR_ALLURE: Record<Allure | "repos", number> = { repos: 1, discrete: 1.1, marche: 1.15, course: 1.6 };

// ---------- Feu de camp (Book 02 §8) ----------

/** Pour monter un feu de camp : un cercle de pierres et un peu de petit bois. */
export const RECETTE_FEU: Partial<Record<TypeObjet, number>> = { pierre: 5, branche: 3 };
/** Bois de départ apporté par les branches de la recette, en kg. */
export const BOIS_INITIAL_FEU = 1.5;
/** Un petit feu de camp brûle ≈ 1,5 kg de bois sec par heure de jeu (réglage). */
export const BOIS_PAR_HEURE = 1.5;
/** Le feu n'accepte pas plus de bois que ça d'un coup, en kg. */
export const BOIS_MAX_FEU = 10;
/** En dessous, il ne reste que des braises. */
export const SEUIL_BRAISES = 0.3;
/** Faire bouillir un litre d'eau sur un feu de camp : ≈ 0,45 kg de bois (Book 02 §3). */
export const BOIS_PAR_LITRE_BOUILLI = 0.45;

export interface EtatFeu {
  /** Bois restant, en kg. */
  bois: number;
  allume: boolean;
  /** Un foyer Dakota (P-002) : creusé dans le sol, discret et économe. C'est la voie creusée de la lignée du feu. */
  dakota?: boolean;
  /** Son niveau dans sa lignée (Book 24 §3.1) : absent, le niveau 1 (les feux d'avant). */
  niveau?: number;
  /** Couvert sous la cendre pour la nuit (foyer de pierres et au-delà) : il brûle quatre fois moins, sans flamme. */
  couvert?: boolean;
}

/**
 * Le foyer Dakota (P-002) : deux trous reliés sous terre, la flamme reste dans le sol. Pas de pierres, un bâton à
 * fouir (Creuser 1). Il brûle moins de bois, se voit beaucoup moins la nuit et fume moins.
 */
export const RECETTE_DAKOTA: Partial<Record<TypeObjet, number>> = { branche: 3 };
export const DAKOTA = { bois: 0.6, lumiere: 0.3, odeur: 0.4 } as const;

export type AspectFeu = "eteint" | "flammes" | "braises" | "cendres";

/** Le feu brûle à l'horloge d'action, même hors ligne (processus passif, Book 01 §2 bis). */
export function bruler(feu: EtatFeu, heures: number): EtatFeu {
  if (!feu.allume) return feu;
  // Chaque niveau a son multiplicateur (Book 24 §3.1) : le foyer de pierres ×0,8, le Dakota ×0,6, le poêle-fusée ×0,4.
  const k = effetsFeu(feu).bois * (feu.couvert ? FEU_COUVERT.bois : 1);
  const bois = Math.max(0, feu.bois - BOIS_PAR_HEURE * k * heures);
  return bois > 0 ? { ...feu, bois } : { ...feu, bois, allume: false, couvert: false };
}

export function aspectFeu(feu: EtatFeu): AspectFeu {
  if (feu.allume) return feu.bois < SEUIL_BRAISES || feu.couvert ? "braises" : "flammes";
  return feu.bois > 0 ? "eteint" : "cendres";
}

// ---------- Durées des actions ----------

/** Durée réelle d'une action, en secondes. Réglages de confort, à caler en test. */
export const DUREES = {
  construireFeu: 4,
  allumer: 2.5,
  remplirGourde: 2,
  /** 10 minutes de jeu pour porter un litre à ébullition. */
  bouillir: 10,
  manger: 1.5,
  boire: 1,
} as const;

export function combustibleDe(type: TypeObjet): number {
  return OBJETS[type].combustible ?? 0;
}
