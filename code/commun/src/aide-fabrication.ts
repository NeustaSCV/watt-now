// Pourquoi une recette n'est pas faisable (Book 03 §4) : ce qui manque, où le trouver, et par quoi le remplacer.
// Tout vient des données du jeu (ressources, recettes, stock du Comptoir, qualités d'outil) : rien n'est écrit à la main.

import { STOCK_DE_BASE } from "./economie.ts";
import { OBJETS, kitDeDepart, nommer, type Inventaire, type TypeObjet } from "./objets.ts";
import { FAMILLES, NOMS_FAMILLES } from "./regles.ts";
import { NOMS_INSTALLATIONS, NOMS_QUALITES, QUALITES_OBJETS, RECETTES, niveauQualite, type Qualite, type Recette } from "./recettes.ts";
import { USAGES, type TypeRessource } from "./terrain.ts";

/** Les vestiges de la station-service (le reste se trouve sur son terrain). */
const A_LA_HALTE = new Set<TypeRessource>(["rayonnage", "panneau_auvent", "epave_voiture", "epave_camion", "caisse_atelier", "grenier"]);

const minuscule = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Où trouver un objet : ce qu'on ramasse ou fouille, ce qu'on fabrique, ce qu'on achète. */
export function ouTrouver(type: TypeObjet): string[] {
  const ou: string[] = [];
  for (const [r, u] of Object.entries(USAGES) as [TypeRessource, (typeof USAGES)[TypeRessource]][]) {
    if ((u.donne[type] ?? 0) > 0) ou.push(`${minuscule(u.libelle)} (${A_LA_HALTE.has(r) ? "à la station-service" : "sur ton terrain"})`);
  }
  for (const r of RECETTES) if ("objet" in r.produit && r.produit.objet === type) ou.push(`le fabriquer (« ${r.nom} »)`);
  if ((STOCK_DE_BASE[type] ?? 0) > 0) ou.push("l'acheter au Comptoir");
  // Le kit de départ : celui de tout le monde, ou celui d'une famille (on peut alors l'échanger avec elle).
  const familles = FAMILLES.filter((f) => (kitDeDepart(f)[type] ?? 0) > 0);
  if (familles.length === FAMILLES.length) ou.unshift("dans le kit de départ");
  else if (familles.length > 0) ou.push(`l'échanger avec un joueur ${familles.map((f) => `des ${NOMS_FAMILLES[f]}`).join(" ou ")} (il est dans leur kit de départ)`);
  return ou;
}

/** Les objets qui apportent une qualité d'outil à ce niveau au moins. */
export function outilsPour(qualite: Qualite, niveau: number): TypeObjet[] {
  return (Object.entries(QUALITES_OBJETS) as [TypeObjet, Partial<Record<Qualite, number>>][])
    .filter(([, q]) => (q[qualite] ?? 0) >= niveau)
    .map(([t]) => t);
}

const ou = (l: string[]) => (l.length <= 1 ? (l[0] ?? "") : `${l.slice(0, -1).join(", ")} ou ${l.at(-1)}`);

/** « Pour en avoir : ramasser la branche (sur ton terrain) ou l'acheter au Comptoir. » (vide si on ne sait pas) */
export function ouTrouverPhrase(type: TypeObjet): string {
  const sources = ouTrouver(type);
  return sources.length ? `Pour en avoir : ${ou(sources)}.` : "";
}

/** Les outils qui manquent pour ces qualités, en phrases (vide : tout y est). */
export function outilsManquants(qualites: Partial<Record<Qualite, number>>, inventaire: Inventaire): string[] {
  const lignes: string[] = [];
  for (const [q, requis] of Object.entries(qualites) as [Qualite, number][]) {
    const possede = niveauQualite(inventaire, q);
    if (possede >= requis) continue;
    const types = outilsPour(q, requis);
    const bons = types.map((t) => OBJETS[t].nom);
    // Où trouver le plus simple d'entre eux (le premier qui a une source connue).
    const source = types.map((t) => ouTrouver(t)).find((l) => l.length > 0);
    const ouLeTrouver = source ? ` Où en trouver : ${ou(source)}.` : "";
    if (possede === requis - 1 && possede > 0) {
      lignes.push(`${NOMS_QUALITES[q]} ${requis} : ton outil fera l'affaire, mais plus lentement. Plus rapide avec : ${ou(bons)}.`);
      continue;
    }
    const fortune = requis >= 2 ? outilsPour(q, requis - 1).filter((t) => (QUALITES_OBJETS[t]?.[q] ?? 0) === requis - 1).map((t) => OBJETS[t].nom) : [];
    lignes.push(
      `Pour ${NOMS_QUALITES[q].toLowerCase()} (niveau ${requis}), il te faut ${ou(bons)}.` + (fortune.length ? ` À défaut, ${ou(fortune)} marche aussi, plus lentement.` : "") + ouLeTrouver,
    );
  }
  return lignes;
}

/** Ce qui manque pour faire cette recette, en phrases courtes (vide : tout y est). */
export function ceQuiManque(r: Recette, inventaire: Inventaire): string[] {
  const lignes: string[] = [];
  for (const [t, besoin] of Object.entries(r.ingredients) as [TypeObjet, number][]) {
    const a = inventaire[t] ?? 0;
    if (a >= besoin) continue;
    const sources = ouTrouver(t);
    lignes.push(
      `Il te manque ${besoin - a > 1 ? nommer(t, besoin - a) : `1 ${minuscule(OBJETS[t].nom)}`}${a > 0 ? ` (tu en as ${a})` : ""}.` + (sources.length ? ` Pour en avoir : ${ou(sources)}.` : ""),
    );
  }
  lignes.push(...outilsManquants(r.qualites, inventaire));
  if (r.feu) lignes.push("Elle se cuisine près d'un feu allumé.");
  if (r.installation) lignes.push(`Elle se fait près d'un ${NOMS_INSTALLATIONS[r.installation]}.`);
  return lignes;
}
