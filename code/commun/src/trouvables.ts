// Ce qu'un survivant peut se procurer, d'où, et ce qu'il peut donc fabriquer (0.7, chantier 6 : le rythme).
//
// Un calcul pur, en point fixe : on part de ce que le monde donne (le kit de départ, les ressources du sol et les
// vestiges posés, les tables de fouille, les tables des déchets de l'Abondance, les points à fouiller, la décharge,
// le stock du Comptoir, les primes des quêtes), puis on ajoute ce qui s'en démonte et ce qui s'en fabrique, tant que
// ça bouge. Il sert au simulateur de rythme (`npm run rythme`) et à ses tests : aucun parcours ne doit buter sur un
// ingrédient introuvable. Rien ici ne tourne en jeu.

import { CONTENEURS, POINTS_DECHETS, PROFILS_DECHETS, tableDechets, type GenreEmplacement, type TypeLieuDechets, type TypeConteneur } from "./dechets.ts";
import { tableDecharge } from "./decharge.ts";
import { STOCK_DE_BASE } from "./economie.ts";
import { kitDeDepart, type Inventaire, type TypeObjet } from "./objets.ts";
import { QUETES } from "./quetes.ts";
import { QUALITES_OBJETS, RECETTES, estHorsFamille, type Qualite, type Recette } from "./recettes.ts";
import type { Famille } from "./regles.ts";
import { USAGES, ressourceVisible, type TypeRessource } from "./terrain.ts";
import { CLES_L1A, CLES_L1B, DEMONTAGE, FAMILLES_PAR_LIEU, tableDeFouille, type LieuFouille } from "./vestiges.ts";

/** D'où vient un objet (pour le rapport). */
export type Source = "kit" | "sol" | "fouille" | "dechets" | "decharge" | "comptoir" | "quete" | "monde" | "demontage" | "fabrication" | "autres";

/**
 * Ce que le monde donne hors des tables (constaté dans le code du serveur) : la poule qu'on attrape, le charbon qu'on
 * défourne, l'ébauche qui sèche, l'eau qu'on boit, et les sous-produits de la cuisine. Chaque ligne dit d'où.
 */
const DU_MONDE: readonly { objet: TypeObjet; depuis: TypeObjet | "charbonniere" | null }[] = [
  // Les poules du terrain (faune.ts) : on les attrape.
  { objet: "poule", depuis: null },
  // La meule de charbonnière, défournée (joueur.ts) : quatre charbons de bois.
  { objet: "charbon_bois", depuis: "charbonniere" },
  // L'ébauche d'arc sèche d'elle-même dans le sac (Book 25 §3.3).
  { objet: "ebauche_arc_seche", depuis: "ebauche_arc" },
  { objet: "ebauche_if_seche", depuis: "ebauche_if" },
  // La graisse qui coule sous la broche quand on rôtit la volaille (joueur.ts) : la torche plantée en brûle.
  { objet: "graisse", depuis: "volaille_crue" },
];

/** Ce qu'on peut se procurer, et d'où (la première source trouvée). */
export interface Trouvables {
  objets: Map<TypeObjet, Source>;
  /** Les recettes qu'on peut faire (ingrédients, outils et installation à portée). */
  recettes: Set<string>;
  /** Les installations qu'on peut poser. */
  installations: Set<string>;
}

function ajouterInventaire(objets: Map<TypeObjet, Source>, inv: Inventaire, source: Source): void {
  for (const [t, n] of Object.entries(inv)) if ((n ?? 0) > 0 && !objets.has(t as TypeObjet)) objets.set(t as TypeObjet, source);
}

/** Toutes les sources du monde, sans rien fabriquer ni démonter. */
export function sourcesDuMonde(famille: Famille): Map<TypeObjet, Source> {
  const objets = new Map<TypeObjet, Source>();
  ajouterInventaire(objets, kitDeDepart(famille), "kit");
  // Les ressources du sol et les vestiges posés (terrain, halte, Coopérative). L'if du terrain : les Mécanistes seuls.
  for (const [type, u] of Object.entries(USAGES) as [TypeRessource, (typeof USAGES)[TypeRessource]][]) {
    if (!ressourceVisible(type, famille)) continue;
    ajouterInventaire(objets, u.donne, "sol");
  }
  for (const lieu of Object.keys(FAMILLES_PAR_LIEU) as LieuFouille[]) for (const [t] of tableDeFouille(lieu)) if (!objets.has(t)) objets.set(t, "fouille");
  const genres: GenreEmplacement[] = ["sol", ...(Object.keys(CONTENEURS) as TypeConteneur[])];
  for (const lieu of Object.keys(PROFILS_DECHETS) as TypeLieuDechets[])
    for (const g of genres) for (const ligne of Object.values(tableDechets(lieu, g))) for (const [t] of ligne) if (!objets.has(t)) objets.set(t, "dechets");
  for (const p of Object.values(POINTS_DECHETS)) ajouterInventaire(objets, p.donne, "dechets");
  for (const [t] of tableDecharge()) if (!objets.has(t)) objets.set(t, "decharge");
  ajouterInventaire(objets, STOCK_DE_BASE, "comptoir");
  // Les objets-clés du niveau 1, toujours au Comptoir après la visite de leur lieu (plan 0.10, chantier B). Ceux du
  // niveau 2 viendront avec leurs lieux (chantiers H à K, M) : le simulateur ne joue encore que le niveau 1.
  for (const t of [...CLES_L1A, ...CLES_L1B]) if (!objets.has(t)) objets.set(t, "comptoir");
  for (const q of QUETES) if ((!q.famille || q.famille === famille) && q.recompense?.objets) ajouterInventaire(objets, q.recompense.objets, "quete");
  for (const m of DU_MONDE) if (m.depuis === null && !objets.has(m.objet)) objets.set(m.objet, "monde");
  return objets;
}

function qualitesAPortee(objets: ReadonlyMap<TypeObjet, Source>, demandees: Partial<Record<Qualite, number>>): boolean {
  for (const [q, niveau] of Object.entries(demandees) as [Qualite, number][]) {
    let meilleur = 0;
    for (const t of objets.keys()) meilleur = Math.max(meilleur, QUALITES_OBJETS[t]?.[q] ?? 0);
    // Un niveau en dessous se fait (plus lentement) ; deux, non (Book 03 §4).
    if (meilleur === 0 || niveau - meilleur >= 2) return false;
  }
  return true;
}

/**
 * Le point fixe : ce qu'un personnage de cette famille peut se procurer. `seul` : sans rien recevoir des autres
 * familles (ni recette apprise, ni objet de leur métier) ; sinon, toutes les recettes comptent (le Comptoir, l'échange,
 * les manuels de la Coopérative les rendent accessibles).
 */
export function trouvables(famille: Famille, seul = true): Trouvables {
  const objets = sourcesDuMonde(famille);
  const recettes = new Set<string>();
  const installations = new Set<string>(["feu"]);
  const permises = RECETTES.filter((r) => !seul || !estHorsFamille(r, famille));
  for (let passe = 0; passe < 40; passe++) {
    const avant = objets.size + recettes.size;
    // Ce qui se démonte.
    for (const [t, d] of Object.entries(DEMONTAGE) as [TypeObjet, NonNullable<(typeof DEMONTAGE)[TypeObjet]>][]) {
      if (objets.has(t) && qualitesAPortee(objets, d.qualites)) ajouterInventaire(objets, d.donne, "demontage");
    }
    // Ce que le monde transforme (le charbon, le séchage).
    for (const m of DU_MONDE) {
      if (m.depuis === null || objets.has(m.objet)) continue;
      if (m.depuis === "charbonniere" ? installations.has("charbonniere") : objets.has(m.depuis)) objets.set(m.objet, "monde");
    }
    // Ce qui se fabrique.
    for (const r of permises) {
      if (recettes.has(r.id) || !recetteFaisable(r, objets, installations)) continue;
      recettes.add(r.id);
      if ("objet" in r.produit) {
        if (!objets.has(r.produit.objet)) objets.set(r.produit.objet, estHorsFamille(r, famille) ? "autres" : "fabrication");
      } else installations.add(r.produit.installation);
      if (r.sousProduits) ajouterInventaire(objets, r.sousProduits, "fabrication");
    }
    if (objets.size + recettes.size === avant) break;
  }
  return { objets, recettes, installations };
}

/** Une recette est-elle faisable avec ce qu'on peut se procurer ? */
export function recetteFaisable(r: Recette, objets: ReadonlyMap<TypeObjet, Source>, installations: ReadonlySet<string>): boolean {
  if (r.installation && !installations.has(r.installation)) return false;
  for (const t of Object.keys(r.ingredients) as TypeObjet[]) if (!objets.has(t)) return false;
  // Les ingrédients au choix (0.8.2) : l'une des façons suffit.
  if (r.auChoix?.length && !r.auChoix.some((c) => (Object.keys(c) as TypeObjet[]).every((t) => objets.has(t)))) return false;
  return qualitesAPortee(objets, r.qualites);
}

/** Ce qui manque à une recette infaisable (pour le rapport) : les ingrédients, l'installation, les outils. */
export function manquesDe(r: Recette, t: Trouvables): string[] {
  const manques: string[] = [];
  if (r.installation && !t.installations.has(r.installation)) manques.push(`installation ${r.installation}`);
  for (const o of Object.keys(r.ingredients) as TypeObjet[]) if (!t.objets.has(o)) manques.push(o);
  if (r.auChoix?.length && !r.auChoix.some((c) => (Object.keys(c) as TypeObjet[]).every((o) => t.objets.has(o)))) manques.push(r.auChoix.map((c) => Object.keys(c).join("+")).join(" ou "));
  if (!qualitesAPortee(t.objets, r.qualites)) manques.push(`outils ${JSON.stringify(r.qualites)}`);
  return manques;
}
