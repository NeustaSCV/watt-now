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
    // L'if du fond du bois ne se dit pas : l'aide explique comment, jamais où est le rare (Book 25 §9.5).
    if (r === "if_bois") continue;
    const ici = A_LA_HALTE.has(r) ? "à la station-service" : r.startsWith("coop_") ? "à la Coopérative" : "sur ton terrain";
    if ((u.donne[type] ?? 0) > 0) ou.push(`${minuscule(u.libelle)} (${ici})`);
  }
  for (const r of RECETTES) if ("objet" in r.produit && r.produit.objet === type) ou.push(`le fabriquer (« ${r.nom} »)`);
  // Ce qui reste d'une recette (Book 25 §9.6) : les plumes et l'os de la poule qu'on plume.
  for (const r of RECETTES) if ((r.sousProduits?.[type] ?? 0) > 0) ou.push(`ce qui reste quand on fait « ${r.nom} »`);
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

/**
 * « Pour en avoir : ramasser la branche (sur ton terrain). » (vide si on ne sait pas). La première source seulement :
 * la phrase finit dans un message du haut de l'écran, limité à deux lignes.
 */
export function ouTrouverPhrase(type: TypeObjet): string {
  const sources = ouTrouver(type);
  return sources.length ? `Pour en avoir : ${sources[0]}.` : "";
}

/** Longueur d'un message du haut de l'écran : deux lignes sur l'iPhone 13 mini. */
export const MESSAGE_MAX = 110;

const et = (l: string[]) => (l.length <= 1 ? (l[0] ?? "") : `${l.slice(0, -1).join(", ")} et ${l.at(-1)}`);

/** La première phrase qui tient dans un message (sinon la dernière, la plus courte). */
const tenir = (candidates: string[], max: number) => candidates.find((c) => c.length <= max) ?? candidates.at(-1)!;

/**
 * Les outils qui manquent, en messages courts (deux lignes au plus chacun) : au plus deux outils par qualité, et où
 * trouver le premier si la place le permet. Un seul message si tout y tient ; sinon un par qualité (deux au plus, au-delà
 * une phrase compacte). Le détail complet reste dans le panneau Fabriquer (outilsManquants).
 */
export function outilsManquantsBref(qualites: Partial<Record<Qualite, number>>, inventaire: Inventaire, max = MESSAGE_MAX): string[] {
  const manques = (Object.entries(qualites) as [Qualite, number][])
    .filter(([q, requis]) => {
      const possede = niveauQualite(inventaire, q);
      return possede < requis && !(possede === requis - 1 && possede > 0);
    })
    .map(([q, requis]) => {
      const types = outilsPour(q, requis);
      const fortune = requis >= 2 ? outilsPour(q, requis - 1).filter((t) => (QUALITES_OBJETS[t]?.[q] ?? 0) === requis - 1).map((t) => OBJETS[t].nom) : [];
      const source = types.map((t) => ouTrouver(t)).find((l) => l.length > 0)?.[0];
      return { q: NOMS_QUALITES[q].toLowerCase(), requis, bons: ou(types.slice(0, 2).map((t) => OBJETS[t].nom)), fortune: fortune[0], source };
    });
  if (manques.length === 0) return ["Il te manque un outil."];
  const phrase = (m: (typeof manques)[number], details: boolean) =>
    `Pour ${m.q} (niveau ${m.requis}), il te faut ${m.bons}${details && m.fortune ? ` (ou ${m.fortune}, plus lent)` : ""}.` +
    (details && m.source ? ` Où : ${m.source}.` : "");
  const sansSource = (m: (typeof manques)[number]) => phrase({ ...m, source: undefined }, true);
  const ensemble = manques.map((m) => phrase(m, true)).join(" ");
  if (ensemble.length > max && manques.length <= 2) return manques.map((m) => tenir([phrase(m, true), sansSource(m), phrase(m, false)], max));
  return [tenir(
    [
      manques.map((m) => phrase(m, true)).join(" "),
      manques.map(sansSource).join(" "),
      manques.map((m) => phrase(m, false)).join(" "),
      `Il te faut ${et(manques.map((m) => `${m.bons} (${m.q} ${m.requis})`))}.`,
      `Il te faut ${manques[0]!.bons} (${manques[0]!.q} ${manques[0]!.requis}), et d'autres outils.`,
    ],
    max,
  )];
}

/** Ce qui manque pour une recette, en un message court (deux lignes au plus) ; le détail est dans Fabriquer. */
export function ceQuiManqueBref(r: Recette, inventaire: Inventaire, max = MESSAGE_MAX): string {
  const manquants = (Object.entries(r.ingredients) as [TypeObjet, number][]).filter(([t, besoin]) => (inventaire[t] ?? 0) < besoin);
  const noms = manquants.map(([t, besoin]) => {
    const a = inventaire[t] ?? 0;
    return besoin - a > 1 ? nommer(t, besoin - a) : `1 ${minuscule(OBJETS[t].nom)}`;
  });
  const outils = outilsManquantsBref(r.qualites, inventaire, max).join(" ");
  const outilsVides = Object.entries(r.qualites).every(([q, n]) => niveauQualite(inventaire, q as Qualite) >= (n ?? 0));
  const reste = [outilsVides ? "" : outils, r.feu ? "Elle se cuisine près d'un feu allumé." : "", r.installation ? `Elle se fait près d'un ${NOMS_INSTALLATIONS[r.installation]}.` : ""].filter(Boolean);
  if (noms.length === 0) return tenir([reste.join(" ")], max);
  const manque = `Il te manque ${et(noms)}.`;
  const unSeul = manquants.length === 1 ? manquants[0]! : null;
  const source = unSeul ? ouTrouver(unSeul[0])[0] : undefined;
  const a = unSeul ? (inventaire[unSeul[0]] ?? 0) : 0;
  const detail = `Il te manque ${noms[0]}${a > 0 ? ` (tu en as ${a})` : ""}.${source ? ` Pour en avoir : ${source}.` : ""}`;
  return tenir([[unSeul ? detail : manque, ...reste].join(" "), [manque, ...reste].join(" "), `${manque} Le détail est dans Fabriquer.`, manque], max);
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
