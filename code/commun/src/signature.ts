// La signature (Book 01 §2, Book 06 §3) : ce que le joueur émet, et jusqu'où ça porte.
// Ce qui compte, c'est l'intensité multipliée par la durée : un bruit faible mais long finit par attirer.
// Valeurs de réglage, à caler en test (Book 21 §3.9, réglages à chaud).

import type { Allure } from "./regles.ts";

export type GenreStimulus = "son" | "lumiere" | "odeur";

/** Ce qu'un Éteint peut percevoir : une source, sa portée et sa force. */
export interface Stimulus {
  genre: GenreStimulus;
  x: number;
  z: number;
  /** Portée en mètres. */
  portee: number;
  /** Attention ajoutée par seconde, au contact de la source (elle décroît jusqu'à 0 à la portée). */
  intensite: number;
}

/** Bruit des pas, selon l'allure (en mouvement). À l'arrêt, on ne fait presque pas de bruit. */
export const BRUIT_ALLURE: Record<Allure, { portee: number; intensite: number }> = {
  discrete: { portee: 2.5, intensite: 0.4 },
  marche: { portee: 7, intensite: 0.8 },
  course: { portee: 16, intensite: 1 },
};
const BRUIT_IMMOBILE = { portee: 1, intensite: 0.2 };

/** Bruit des actions (Book 02 §7 : aucun outil n'est silencieux). */
export type BruitAction = "aucun" | "leger" | "outil" | "lourd" | "coup";
export const BRUIT_ACTION: Record<BruitAction, { portee: number; intensite: number }> = {
  aucun: { portee: 0, intensite: 0 },
  // Fouiller, ramasser, cuisiner : des froissements, des boîtes qui tombent
  leger: { portee: 9, intensite: 0.7 },
  // Démonter, visser, pédaler : le métal qui grince
  outil: { portee: 18, intensite: 1 },
  // Marteler, forger, abattre : on l'entend de loin
  lourd: { portee: 40, intensite: 1.2 },
  // Un coup porté à un Éteint : un choc sourd, des cris (Book 06 §8.1 : un peu de bruit)
  coup: { portee: 14, intensite: 1.1 },
};

/** Un joueur qui saigne laisse une odeur (Book 06 §3.2 : ≈ 30 m). */
export const SANG_ODEUR = { portee: 30, intensite: 0.25 };

/** La lumière portée ne compte que la nuit : elle porte alors loin (Book 06 §3.2 : ×3). */
export const LUMIERE_NUIT: Record<"torche" | "frontale" | "lanterne", { portee: number; intensite: number }> = {
  torche: { portee: 30, intensite: 0.5 },
  frontale: { portee: 26, intensite: 0.45 },
  lanterne: { portee: 14, intensite: 0.35 },
};

/** Un feu de camp allumé : fumée le jour comme la nuit, flammes visibles la nuit. */
export const FEU_ODEUR = { portee: 35, intensite: 0.15 };
export const FEU_LUMIERE_NUIT = { portee: 45, intensite: 0.3 };
/** La charbonnière qui fume trois jours : faible, mais très loin et très longtemps (Book 06 §3.1). */
export const CHARBONNIERE_ODEUR = { portee: 80, intensite: 0.12 };

export interface EtatSignature {
  x: number;
  z: number;
  allure: Allure;
  bouge: boolean;
  action: BruitAction;
  /** La lumière portée allumée, s'il y en a une. */
  lumiere: "torche" | "frontale" | "lanterne" | null;
  nuit: boolean;
  /** Il saigne : les Éteints le sentent. */
  saigne?: boolean;
}

/** Les stimuli qu'émet un joueur. */
export function stimuliJoueur(e: EtatSignature): Stimulus[] {
  const s: Stimulus[] = [];
  const pas = e.bouge ? BRUIT_ALLURE[e.allure] : BRUIT_IMMOBILE;
  const action = BRUIT_ACTION[e.action];
  const son = action.portee > pas.portee ? action : pas;
  s.push({ genre: "son", x: e.x, z: e.z, ...son });
  if (e.nuit && e.lumiere) s.push({ genre: "lumiere", x: e.x, z: e.z, ...LUMIERE_NUIT[e.lumiere] });
  if (e.saigne) s.push({ genre: "odeur", x: e.x, z: e.z, ...SANG_ODEUR });
  return s;
}

/** Le cercle de signature affiché au sol (Book 06 §3.3) : la portée du bruit, et celle de la lumière la nuit. */
export function cerclesSignature(e: EtatSignature): { son: number; lumiere: number } {
  const st = stimuliJoueur(e);
  return {
    son: st.find((s) => s.genre === "son")?.portee ?? 0,
    lumiere: st.find((s) => s.genre === "lumiere")?.portee ?? 0,
  };
}
