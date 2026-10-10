// Les mesures du test familial (Book 17 §6) : de quoi équilibrer le jeu après coup.
// Chaque mesure est une ligne de la table `mesures` : quand, qui (compte, famille), quoi, combien.
// Rien de personnel n'y est noté : pas de pseudo, pas de position, pas de message.

import { MS_JOUR_CALENDRIER } from "../../commun/src/energie.ts";
import { estObjetDeMetier, etoilesDe, typeDe } from "../../commun/src/etoiles.ts";
import type { TypeObjet } from "../../commun/src/objets.ts";
import { RECETTES } from "../../commun/src/recettes.ts";
import { FAMILLES, type Famille } from "../../commun/src/regles.ts";

export type GenreMesure =
  /** Temps passé par activité (secondes réelles). */
  | "activite"
  /** Flux de wotts : créés (dépôt d'électricité), gagnés, dépensés, détruits. */
  | "wotts"
  /** Causes d'effondrement (Book 06 §12). */
  | "effondrement"
  /** Progression : recettes réussies, étapes du tutoriel. */
  | "progression"
  /** Connexions et durée des séances. */
  | "session"
  /** Charge du serveur, chaque minute. */
  | "serveur"
  /** Images par seconde des appareils, chaque minute. */
  | "client"
  /** Le métier des familles (Book 25 §10.1) : tirs, destructions par arme, objets de métier faits et échangés. */
  | "metier";

/**
 * Le rythme de progression (décision du porteur, 2026-10-10) : `progression` / `atteint:<étape>` (maison, H1A, L1A…),
 * la valeur en minutes de jeu depuis la création du personnage. Ce sont les seules mesures gardées quand on supprime un
 * compte, rendues anonymes (compte 0, sans détails) : « en combien de temps de jeu il est arrivé à L1, à L2 ».
 */
export const PREFIXE_ATTEINT = "atteint:";
/** Le compte des mesures rendues anonymes (aucun compte réel n'a le numéro 0). */
export const COMPTE_ANONYME = 0;

export interface Mesure {
  instant: number;
  compteId: number;
  famille: string;
  genre: GenreMesure;
  quoi: string;
  valeur: number;
  /** Détails, en JSON (facultatif). */
  details?: Record<string, unknown>;
}

/** Les grandes activités du Book 17 §6 : collecte, fabrication, expédition, soins, et le reste de la survie. */
export function categorieAction(libelle: string): string {
  const l = libelle.toLowerCase();
  if (/^(ramasser|cueillir|gauler|couper des joncs|prendre|fouiller|démonter|reprendre ton sac)/.test(l)) return "collecte";
  if (/pansement|panser/.test(l)) return "soins";
  if (/^(manger|boire|faire bouillir|remplir la gourde|faire rôtir)/.test(l)) return "nourriture et eau";
  if (/feu|meule|charbon/.test(l)) return "feu et charbon";
  if (/pédaler|recharger|batteries|affûter/.test(l)) return "énergie";
  return "fabrication";
}

// ---------- Le métier des familles (Book 25 §10.1, chantier 9 · 0.6) ----------
//
// Ce qu'on note, genre « metier » :
// - `tir:<arme>` à chaque flèche ou carreau tiré ;
// - `detruit:<comment>` à chaque Éteint détruit : le type de l'arme de contact (tranchant, electrique…), `tir_plein`
//   (un tir plein à la tête), `tir` (au torse, ou achevé à terre), `lancer` ;
// - `fabrique:<objet>` pour un objet de métier fabriqué, ses étoiles en valeur ;
// - `echange` quand un joueur donne des objets de métier à un autre (leur nombre en valeur).

/** Les armes de métier de chaque famille (Book 25 §8.4) : la machette et sa gamme, la matraque, l'arbalète. */
export const ARMES_DE_METIER_DES_FAMILLES: Record<Famille, readonly TypeObjet[]> = {
  charbonniers: ["machette_forgee", "lame_forgee", "hachette", "serpe", "hache_forgee", "glaive"],
  voltaiques: ["matraque_fortune", "matraque_electrique", "aiguillon"],
  mecanistes: ["arbalete", "arbalete_lourde"],
};

/** Les objets de métier qui sortent d'une fabrication : `fabrique:<objet>`, ses étoiles en valeur. */
export function mesuresFabrication(sortie: Partial<Record<string, number>>): { quoi: string; valeur: number }[] {
  const r: { quoi: string; valeur: number }[] = [];
  for (const [cle, n] of Object.entries(sortie)) {
    const etoiles = etoilesDe(cle);
    if (!n || etoiles === null) continue;
    for (let i = 0; i < n; i++) r.push({ quoi: `fabrique:${typeDe(cle)}`, valeur: etoiles });
  }
  return r;
}

/** Ce qui sort d'une recette de famille, ou un objet de métier : ce qui fait un échange de métier. */
const OBJETS_DE_FAMILLE = new Set<string>(RECETTES.flatMap((r) => (r.famille !== "tous" && "objet" in r.produit ? [r.produit.objet] : [])));
export function estObjetDeCommerce(cle: string): boolean {
  const type = typeDe(cle);
  return estObjetDeMetier(type) || OBJETS_DE_FAMILLE.has(type);
}

/** Un échange entre joueurs : combien d'objets de métier on donne (0 : rien à noter). */
export function objetsDeMetierDonnes(objets: Partial<Record<string, number>>): number {
  return Object.entries(objets).reduce((s, [cle, n]) => s + (estObjetDeCommerce(cle) ? (n ?? 0) : 0), 0);
}

/** Ce que mesurent les critères de réussite de la 0.6 (Book 25 §10.1). */
export interface BilanMetier {
  joueurs: number;
  /** Joueurs qui ont tiré au moins une flèche ou un carreau (objectif : 60 % ou plus). */
  tireurs: number;
  partTireurs: number | null;
  /** Éteints détruits d'un tir plein à la tête (on ne tire pas saisi : chacun est « sans saisie »). */
  tirPlein: number;
  /** Éteints détruits, par façon de faire. */
  destructions: Record<string, number>;
  /**
   * Par famille : le plus court délai (en jours de calendrier) entre la première mesure d'un joueur et sa première arme
   * de métier ★★ ou mieux (objectif : moins de 2). null : pas encore.
   */
  armeDeMetier: Record<Famille, number | null>;
  /** Échanges de métier entre joueurs, par joueur et par semaine (objectif : au moins 1 quand les trois familles sont là). */
  echangesParJoueurSemaine: number | null;
  /** Part du temps d'action passée à se défendre, par famille (objectif : ±5 % entre familles). */
  defense: Record<Famille, number | null>;
  ecartDefense: number | null;
  /** Arbalètes lourdes faites (objectif : une par test, à deux familles). */
  arbaletesLourdes: number;
}

const SEMAINE_MS = 7 * 24 * 3_600_000;

/** Le bilan du métier des familles, à partir des mesures (`npm run bilan`). */
export function bilanMetier(mesures: readonly Pick<Mesure, "instant" | "compteId" | "famille" | "genre" | "quoi" | "valeur">[]): BilanMetier {
  const joueurs = new Set(mesures.filter((m) => m.compteId > 0).map((m) => m.compteId));
  const metier = mesures.filter((m) => m.genre === "metier");
  const tireurs = new Set(metier.filter((m) => m.quoi.startsWith("tir:")).map((m) => m.compteId));
  const destructions: Record<string, number> = {};
  for (const m of metier) if (m.quoi.startsWith("detruit:")) destructions[m.quoi.slice(8)] = (destructions[m.quoi.slice(8)] ?? 0) + 1;

  // La première mesure de chaque joueur : son arrivée sur le serveur.
  const debut = new Map<number, number>();
  for (const m of mesures) if (m.compteId > 0) debut.set(m.compteId, Math.min(debut.get(m.compteId) ?? Infinity, m.instant));
  const armeDeMetier = {} as Record<Famille, number | null>;
  const defense = {} as Record<Famille, number | null>;
  for (const f of FAMILLES) {
    const faites = metier.filter((m) => m.famille === f && m.valeur >= 2 && ARMES_DE_METIER_DES_FAMILLES[f].some((o) => m.quoi === `fabrique:${o}`));
    const delais = faites.map((m) => (m.instant - (debut.get(m.compteId) ?? m.instant)) / MS_JOUR_CALENDRIER);
    armeDeMetier[f] = delais.length ? Math.min(...delais) : null;
    const activite = mesures.filter((m) => m.genre === "activite" && m.famille === f);
    const total = activite.reduce((s, m) => s + m.valeur, 0);
    defense[f] = total > 0 ? activite.filter((m) => m.quoi === "combat").reduce((s, m) => s + m.valeur, 0) / total : null;
  }
  const parts = Object.values(defense).filter((v): v is number => v !== null);
  const instants = mesures.map((m) => m.instant);
  const semaines = instants.length ? Math.max(1, (Math.max(...instants) - Math.min(...instants)) / SEMAINE_MS) : 1;
  const echanges = metier.filter((m) => m.quoi === "echange").length;
  return {
    joueurs: joueurs.size,
    tireurs: tireurs.size,
    partTireurs: joueurs.size ? tireurs.size / joueurs.size : null,
    tirPlein: destructions.tir_plein ?? 0,
    destructions,
    armeDeMetier,
    echangesParJoueurSemaine: joueurs.size ? echanges / joueurs.size / semaines : null,
    defense,
    ecartDefense: parts.length >= 2 ? Math.max(...parts) - Math.min(...parts) : null,
    arbaletesLourdes: metier.filter((m) => m.quoi === "fabrique:arbalete_lourde").length,
  };
}
