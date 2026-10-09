// Le savoir d'un personnage hors de sa famille (Book 25 §2.3, Book 03 §5.4) : ce qu'il a appris d'un joueur d'une autre
// famille (la leçon), les manuels qu'il a lus, et, pour l'enseignant, ce qu'il a déjà enseigné (le rayonnement ne se
// gagne qu'une fois par élève et par recette). Le savoir est gardé avec le personnage, pas dans le sac.

import { estObjet, type TypeObjet } from "./objets.ts";
import { FAMILLES, NOMS_FAMILLES, type Famille } from "./regles.ts";
import { RECETTES, recette, recettesEnseignables, type Recette, type SavoirRecettes } from "./recettes.ts";

export interface Savoir extends SavoirRecettes {
  apprises: string[];
  manuels: Famille[];
  /** Les leçons déjà données : « idÉlève:idRecette ». */
  enseignees: string[];
  /** Le rayonnement gagné à enseigner (Book 03 §5.4, composante « Contribuer » du Book 09 §3.1). */
  rayonnement: number;
}

export const SAVOIR_VIDE: Savoir = { apprises: [], manuels: [], enseignees: [], rayonnement: 0 };

/** Lit un savoir venu de la base (ou d'ailleurs) : ce qui n'a pas la bonne forme est ignoré. */
export function savoirValide(x: unknown): Savoir {
  if (typeof x !== "object" || x === null) return { ...SAVOIR_VIDE, apprises: [], manuels: [], enseignees: [] };
  const o = x as Record<string, unknown>;
  const chaines = (v: unknown) => (Array.isArray(v) ? v.filter((s): s is string => typeof s === "string" && s.length <= 80) : []);
  const ids = new Set(RECETTES.map((r) => r.id));
  return {
    // Une recette disparue du jeu est oubliée sans bruit ; une recette inconnue aussi.
    apprises: [...new Set(chaines(o.apprises).filter((id) => ids.has(id)))],
    manuels: [...new Set(chaines(o.manuels).filter((f): f is Famille => (FAMILLES as readonly string[]).includes(f)))],
    enseignees: [...new Set(chaines(o.enseignees))],
    rayonnement: typeof o.rayonnement === "number" && Number.isFinite(o.rayonnement) && o.rayonnement >= 0 ? o.rayonnement : 0,
  };
}

// ---------- Les manuels (Book 25 §2.3) ----------

/** Les trois manuels, et la famille dont ils ouvrent les recettes. */
export const MANUELS: Partial<Record<TypeObjet, Famille>> = {
  manuel_forgeron: "charbonniers",
  manuel_electricien: "voltaiques",
  manuel_arbalete: "mecanistes",
};

export function estManuel(type: unknown): type is TypeObjet {
  return estObjet(type) && MANUELS[type] !== undefined;
}

// ---------- La leçon (Book 03 §5.4) ----------

/** Pour commencer une leçon, il faut être à portée de voix, comme pour un échange (m). */
export const DISTANCE_LECON = 3;
/** Au-delà, la leçon s'interrompt (m). */
export const DISTANCE_RUPTURE_LECON = 6;
/** La leçon dure « quelques minutes réelles » (Book 03 §5.4) : deux, côte à côte (secondes). */
export const DUREE_LECON_S = 120;
/** Ce que gagne l'enseignant, une seule fois par élève et par recette. */
export const RAYONNEMENT_LECON = 1;
/** On répond à une proposition de leçon dans ce délai (ms), sinon elle tombe. */
export const DELAI_REPONSE_LECON = 20_000;

/** « chez les Charbonniers » */
export function chezLaFamille(famille: Famille): string {
  return `chez les ${NOMS_FAMILLES[famille]}`;
}

/**
 * Pourquoi `maitre` ne peut pas enseigner `idRecette` à un élève de la famille `familleEleve` qui sait déjà `savoirEleve`
 * (null : c'est possible). On n'enseigne que les recettes de son propre métier (Book 03 §5.4 : il faut les maîtriser).
 */
export function refusLecon(familleMaitre: Famille, idRecette: string, familleEleve: Famille, savoirEleve: SavoirRecettes): string | null {
  const r = recette(idRecette);
  if (!r || !recettesEnseignables(familleMaitre).includes(r)) return "Tu n'enseignes que les recettes de ton métier.";
  if (familleEleve === familleMaitre) return "Vous êtes de la même famille : il la connaît déjà.";
  if ((savoirEleve.apprises ?? []).includes(r.id) || (savoirEleve.manuels ?? []).includes(r.famille as Famille)) return "Il connaît déjà cette recette.";
  return null;
}

/** Les recettes qu'un maître peut proposer à un élève : celles de son métier que l'élève ne sait pas encore. */
export function leconsPossibles(familleMaitre: Famille, familleEleve: Famille, savoirEleve: SavoirRecettes): Recette[] {
  return recettesEnseignables(familleMaitre).filter((r) => refusLecon(familleMaitre, r.id, familleEleve, savoirEleve) === null);
}
