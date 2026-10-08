// Règles de survie de l'É1 : besoins (faim, soif), feu de camp, eau, ramassage.
// Valeurs réalistes du Book 05 §3 et du Book 02, rapportées à l'horloge d'action. Réglages à caler en test.

import { REGLAGES } from "./reglages.ts";
import { OBJETS, type TypeObjet } from "./objets.ts";
import type { Allure } from "./regles.ts";

// ---------- Besoins (Book 05 §3) ----------

/** Besoin de nourriture : 2 500 kcal par jour de jeu (24 heures = 24 minutes réelles). */
export const KCAL_PAR_HEURE = 2500 / 24;
/** Besoin en eau : ≈ 2,5 L par jour de jeu. */
export const LITRES_PAR_HEURE = 2.5 / 24;
/** Réserves maximales : une journée de nourriture, une journée et demie d'eau. */
export const RESERVE_KCAL_MAX = 2500;
export const RESERVE_EAU_MAX = 2.5;
/** En dessous de ce seuil (part de la réserve), le personnage a faim ou soif : plus de course. */
export const SEUIL_MANQUE = 0.15;
/** Un plat chaud cale : la faim revient deux fois moins vite pendant ces heures de jeu (2026-10-08). */
export const RASSASIE_HEURES = 6;
/** La cuisson rend les aliments plus digestes : un plat apporte ≈ 25 % d'énergie de plus que ses ingrédients crus. */
export const BONUS_CUISSON = 1.25;
/** Contenance de la gourde, en litres. */
export const CONTENANCE_GOURDE = 1;
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

export function dormir(b: Besoins, heures: number, dansUnAbri: boolean): Besoins {
  return { ...b, repos: Math.min(1, b.repos + heures * (dansUnAbri ? REPOS_GAGNE_PAR_HEURE_ABRI : REPOS_GAGNE_PAR_HEURE_SOL)) };
}

export type ContenuGourde = "potable" | "brute";

export interface Gourde {
  contenu: ContenuGourde;
  litres: number;
}

export const BESOINS_DEPART: Besoins = { kcal: RESERVE_KCAL_MAX, eau: RESERVE_EAU_MAX * 0.8, repos: 1 };
export const GOURDE_DEPART: Gourde = { contenu: "potable", litres: CONTENANCE_GOURDE };

/**
 * Fait passer `heures` heures de jeu sur les besoins. Les besoins sont gelés hors ligne (Book 01 §2 bis).
 * `cale` : après un vrai repas chaud, la faim revient deux fois moins vite (voir RASSASIE_HEURES).
 */
export function consommer(besoins: Besoins, heures: number, effort = 1, endormi = false, cale = false): Besoins {
  return {
    kcal: Math.max(0, besoins.kcal - KCAL_PAR_HEURE * REGLAGES.faim_rythme * heures * effort * (cale ? 0.5 : 1)),
    eau: Math.max(0, besoins.eau - LITRES_PAR_HEURE * REGLAGES.soif_rythme * heures * effort),
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
}

export type AspectFeu = "eteint" | "flammes" | "braises" | "cendres";

/** Le feu brûle à l'horloge d'action, même hors ligne (processus passif, Book 01 §2 bis). */
export function bruler(feu: EtatFeu, heures: number): EtatFeu {
  if (!feu.allume) return feu;
  const bois = Math.max(0, feu.bois - BOIS_PAR_HEURE * heures);
  return { bois, allume: bois > 0 };
}

export function aspectFeu(feu: EtatFeu): AspectFeu {
  if (feu.allume) return feu.bois < SEUIL_BRAISES ? "braises" : "flammes";
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
