// L'arbre de progression dans le panneau Fabriquer (0.7, chantier 5 ; proposition « arbre-de-progression » §4 et
// décisions du porteur §10). Calculs purs, sans le DOM : ce que le panneau montre (les recettes dévoilées), les
// silhouettes « À découvrir » du prochain palier, la barre d'onglets à 8 recettes, les pastilles des nouveautés, et les
// recettes des autres familles (cachées, puis repliées par famille, Q6). Le dessin est dans hud.ts.

import { PROGRESSION, type Palier, type VueProgression } from "../../commun/src/progression.ts";
import { CATEGORIES_RECETTES, recette, recettesAutresFamilles, recettesConnues, type CategorieRecette, type Recette, type SavoirRecettes } from "../../commun/src/recettes.ts";
import { FAMILLES, type Famille } from "../../commun/src/regles.ts";
import type { Pictogramme } from "./icones.ts";

/** Pas de barre d'onglets tant qu'on voit moins de 8 recettes (§4.3) : une seule liste. */
export const SEUIL_ONGLETS = 8;

/** Les silhouettes montrées d'emblée ; les autres du palier se déplient d'un doigt (« Voir les N autres »). */
export const SILHOUETTES_DEPLIEES = 3;

/** La catégorie (l'onglet) d'une recette ou d'une carte spéciale (le feu de camp, le foyer Dakota). */
export function categorieDe(id: string): CategorieRecette {
  if (id === "feu_de_camp" || id === "foyer_dakota") return "feu";
  return recette(id)?.categorie ?? "batir";
}

/** Le pictogramme d'une recette ou d'une carte (la silhouette reprend l'icône, assombrie). */
export function pictogrammeDe(id: string): Pictogramme {
  if (id === "feu_de_camp" || id === "foyer_dakota") return "feu_de_camp";
  const r = recette(id);
  if (!r) return "feu_de_camp";
  return "objet" in r.produit ? r.produit.objet : r.produit.installation;
}

export interface Silhouette {
  id: string;
  categorie: CategorieRecette;
  pictogramme: Pictogramme;
  /** Le besoin, jamais la solution ni le lieu (~60 caractères). */
  indice: string;
}

/** Une famille repliée en une ligne (« Chez les Charbonniers · 6 ici »), qu'on déplie d'un doigt. */
export interface FamilleRepliee {
  famille: Famille;
  recettes: Recette[];
}

export interface PlanFabrication {
  /** Les recettes connues ET dévoilées, dans l'ordre du jeu. */
  recettes: Recette[];
  /** La carte du feu de camp, et son bouton « Creuser en Dakota ». */
  feu: boolean;
  dakota: boolean;
  /** Le nombre de cartes (feu compris) : l'en-tête, et la barre d'onglets à partir de 8. */
  nombre: number;
  avecOnglets: boolean;
  /** Le prochain palier (décision Q2) : ses recettes encore cachées, en silhouettes. */
  palier: Palier | null;
  silhouettes: Silhouette[];
  /** Les recettes des autres familles montrées une à une, grisées et dépliées (§3.3). */
  entrevues: Recette[];
  /** Les autres, repliées par famille ; vide tant que le déclencheur A n'est pas atteint (Q6). */
  repliees: FamilleRepliee[];
  /** Ce qui a été dévoilé et pas encore regardé (pastille, « Nouveau »). */
  nonVues: string[];
}

/**
 * Ce que montre le panneau. Sans état de progression (un serveur d'avant la 0.7), on montre tout comme avant :
 * toutes les recettes connues, et les autres familles grisées (repliées par famille).
 */
export function planFabrication(famille: Famille, savoir: SavoirRecettes, progression: VueProgression | null): PlanFabrication {
  const connues = recettesConnues(famille, savoir);
  const autres = recettesAutresFamilles(famille, savoir).filter((r) => r.famille !== "tous");
  if (!progression) {
    return {
      recettes: connues,
      feu: true,
      dakota: true,
      nombre: connues.length + 1,
      avecOnglets: true,
      palier: null,
      silhouettes: [],
      entrevues: [],
      repliees: replier(autres),
      nonVues: [],
    };
  }
  const devoilees = new Set(progression.devoilees);
  const recettes = connues.filter((r) => devoilees.has(r.id));
  const feu = devoilees.has("feu_de_camp");
  const nombre = recettes.length + (feu ? 1 : 0);
  const silhouettes: Silhouette[] = (progression.prochain?.recettes ?? [])
    .filter((id) => !devoilees.has(id) && PROGRESSION[id] !== undefined)
    .map((id) => ({ id, categorie: categorieDe(id), pictogramme: pictogrammeDe(id), indice: PROGRESSION[id]!.indice }));
  const entrevuesIds = new Set(progression.entrevues);
  const entrevues = autres.filter((r) => entrevuesIds.has(r.id));
  return {
    recettes,
    feu,
    dakota: devoilees.has("foyer_dakota"),
    nombre,
    avecOnglets: nombre >= SEUIL_ONGLETS,
    palier: progression.prochain?.palier ?? null,
    silhouettes,
    entrevues,
    repliees: progression.autres ? replier(autres.filter((r) => !entrevuesIds.has(r.id))) : [],
    nonVues: progression.nonVues.filter((id) => devoilees.has(id)),
  };
}

function replier(recettes: readonly Recette[]): FamilleRepliee[] {
  return FAMILLES.map((f) => ({ famille: f, recettes: recettes.filter((r) => r.famille === f) })).filter((g) => g.recettes.length > 0);
}

/** « 4 recettes · 3 à découvrir » (§4.3), au lieu de « 60 recettes connues ». */
export function sousTitre(plan: Pick<PlanFabrication, "nombre" | "silhouettes">): string {
  const n = `${plan.nombre} recette${plan.nombre > 1 ? "s" : ""}`;
  return plan.silhouettes.length > 0 ? `${n} · ${plan.silhouettes.length} à découvrir` : n;
}

/** Les nouveautés par onglet (la pastille de l'onglet) : seulement les onglets qu'on n'a pas encore regardés. */
export function nouveautesParOnglet(ids: Iterable<string>, ongletsVus: ReadonlySet<CategorieRecette | "tout"> = new Set()): Partial<Record<CategorieRecette, number>> {
  const compte: Partial<Record<CategorieRecette, number>> = {};
  for (const id of ids) {
    const c = categorieDe(id);
    if (ongletsVus.has(c)) continue;
    compte[c] = (compte[c] ?? 0) + 1;
  }
  return compte;
}

/** Un onglet encore vide est atténué, pas caché (les onglets ne se décalent jamais). */
export function ongletsVides(plan: Pick<PlanFabrication, "recettes" | "feu">): Set<CategorieRecette> {
  const pleins = new Set<CategorieRecette>(plan.recettes.map((r) => r.categorie));
  if (plan.feu) pleins.add("feu");
  return new Set(CATEGORIES_RECETTES.map((c) => c.id).filter((c) => !pleins.has(c)));
}

/**
 * L'ordre des cartes d'un onglet : celles qui étaient nouvelles à l'ouverture du panneau d'abord (§4.1), les autres à
 * leur place. On ne réordonne qu'à l'ouverture : l'ordre ne bouge jamais sous le doigt (Book 02 §14 ter).
 */
export function enTete<T extends { id: string }>(cartes: readonly T[], nouvellesALOuverture: ReadonlySet<string>): T[] {
  return [...cartes.filter((c) => nouvellesALOuverture.has(c.id)), ...cartes.filter((c) => !nouvellesALOuverture.has(c.id))];
}

/**
 * Pour « Il manque… » (§4.4) : une recette se cite si on la voit dans Fabriquer (dévoilée, ou montrée grisée d'une
 * autre famille). Sinon on dit seulement qu'elle se fabrique : on ne trahit pas la suite.
 */
export function recetteVisible(plan: Pick<PlanFabrication, "recettes" | "entrevues" | "repliees">): (id: string) => boolean {
  const ids = new Set<string>([...plan.recettes, ...plan.entrevues, ...plan.repliees.flatMap((g) => g.recettes)].map((r) => r.id));
  return (id: string) => ids.has(id);
}
