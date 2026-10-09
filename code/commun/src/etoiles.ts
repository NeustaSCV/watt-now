// La qualité ★ d'un objet de métier, portée par exemplaire (Book 25 §4.2 et §9.6, Book 02 §9).
//
// Seuls les objets de métier ont des étoiles (lames, arcs, arbalètes, armes électriques) : un caillou n'en a pas.
// Dans un inventaire, un exemplaire s'écrit `type#n` (« machette_forgee#4 ») ; les exemplaires de mêmes étoiles
// s'empilent, ceux d'étoiles différentes non. La clé nue (« lame_forgee ») désigne l'exemplaire aux étoiles de base
// de l'objet (★★★ en général, ★ pour la machette de fortune) : c'est la forme canonique, si bien que les sauvegardes
// d'avant la 0.6 se relisent telles quelles, sans perte.
//
// Ce module n'a que des types et des fonctions pures : les chantiers 1 (tir), 3 (recettes) et 4 à 7 (métiers) s'appuient
// dessus.

import type { TypeObjet } from "./objets.ts";

/** Le nombre d'étoiles d'un exemplaire, de ★ à ★★★★★. */
export type Etoiles = 1 | 2 | 3 | 4 | 5;

/** La clé d'un exemplaire étoilé dans un inventaire (« machette_forgee#4 »). */
export type CleEtoilee = `${TypeObjet}#${Etoiles}`;
/** Une clé d'inventaire : un type nu (étoiles de base, ou objet sans étoiles), ou un exemplaire étoilé. */
export type CleObjet = TypeObjet | CleEtoilee;

export const ETOILES_MIN: Etoiles = 1;
export const ETOILES_MAX: Etoiles = 5;
/** Les valeurs des armes sont données à ★★★ (Book 25 §8.5) : c'est la référence. */
export const ETOILES_REFERENCE: Etoiles = 3;
/** Hors de sa famille, on ne dépasse pas ★★ (Book 25 §2.2). */
export const PLAFOND_HORS_FAMILLE: Etoiles = 2;
/** La maîtrise (Book 03 §5.4) : 10 exemplaires de la même sorte, +1 étoile. */
export const SEUIL_MAITRISE = 10;

/**
 * Ce que font les étoiles d'un exemplaire (Book 02 §9, Book 25 §4.2, §8.2 et §8.3) : dégâts et solidité pour toutes
 * les armes de métier ; le raidissement (s) et la durée de la décharge longue (ms) pour l'arme électrique ; la portée
 * de tête (en part de celle de ★★★) pour l'arc et l'arbalète.
 */
export const ETOILES = {
  1: { degats: 0.8, solidite: 0.5, raidi: 1.5, longueMs: 1400, porteeTete: 2 / 3 },
  2: { degats: 0.9, solidite: 0.75, raidi: 2, longueMs: 1200, porteeTete: 5 / 6 },
  3: { degats: 1, solidite: 1, raidi: 2.5, longueMs: 1000, porteeTete: 1 },
  4: { degats: 1.1, solidite: 1.5, raidi: 3, longueMs: 900, porteeTete: 7 / 6 },
  5: { degats: 1.2, solidite: 2, raidi: 3.5, longueMs: 800, porteeTete: 4 / 3 },
} as const satisfies Record<Etoiles, { degats: number; solidite: number; raidi: number; longueMs: number; porteeTete: number }>;

/**
 * Les objets de métier, et les étoiles de leur clé nue (celles d'un exemplaire trouvé ou d'une sauvegarde d'avant la
 * 0.6). Chaque chantier de métier ajoute ses lignes dans son bloc, sans toucher aux autres (Book 25 §10.4).
 */
export const OBJETS_DE_METIER: Partial<Record<TypeObjet, Etoiles>> = {
  // 🔥 Charbonniers (chantier 5)
  lame_forgee: 3,
  // La machette de fortune, trouvée : une tôle découpée, un manche ficelé ; une lame ★ (Book 25 §0.2).
  machette: 1,
  // ⚡ Voltaïques (chantier 6)
  // ⚙️ Mécanistes (chantier 7)
  // Tous : l'arc (chantier 4). Le bois vert fatigue vite (★) ; le frêne séché fait ★★★, l'if ★★★★ ; l'arc de tir sportif
  // trouvé est tout fait (★★★★★). La corde d'arc porte la qualité de ses brins : ficelle ★★, corde ★★★, fil dentaire
  // ou boyau ★★★★ (Book 25 §3.2 et §3.3) ; un arc monté ne vaut jamais mieux que sa corde.
  arc_fortune: 1,
  arc_simple: 3,
  arc_if: 4,
  arc_sportif: 5,
  corde_arc: 3,
};

/** Cet objet porte-t-il des étoiles ? */
export function estObjetDeMetier(type: string): type is TypeObjet {
  return Object.hasOwn(OBJETS_DE_METIER, type);
}

/** Les étoiles de la clé nue d'un objet de métier (★★★ si l'objet n'en déclare pas). */
export function etoilesDeBase(type: TypeObjet): Etoiles {
  return OBJETS_DE_METIER[type] ?? ETOILES_REFERENCE;
}

export function estEtoiles(n: unknown): n is Etoiles {
  return n === 1 || n === 2 || n === 3 || n === 4 || n === 5;
}

/** Ramène un nombre quelconque dans ★..★★★★★ (arrondi vers le bas). */
export function borner(n: number): Etoiles {
  if (!Number.isFinite(n)) return ETOILES_MIN;
  return Math.max(ETOILES_MIN, Math.min(ETOILES_MAX, Math.floor(n))) as Etoiles;
}

/**
 * La clé canonique d'un exemplaire : nue aux étoiles de base (ou pour un objet sans étoiles), `type#n` sinon. Deux
 * exemplaires de mêmes étoiles ont toujours la même clé : ils s'empilent.
 */
export function cleExemplaire(type: TypeObjet, etoiles?: number): CleObjet {
  if (!estObjetDeMetier(type) || etoiles === undefined) return type;
  const n = borner(etoiles);
  return n === etoilesDeBase(type) ? type : (`${type}#${n}` as CleEtoilee);
}

/**
 * Lit une clé d'inventaire : son type et ses étoiles (null pour un objet sans étoiles). Ne vérifie pas que le type
 * existe : c'est le travail de `estCleObjet` (objets.ts), pour tout ce qui vient du client.
 */
export function lireCle(cle: string): { type: TypeObjet; etoiles: Etoiles | null } {
  const i = cle.indexOf("#");
  if (i < 0) {
    const type = cle as TypeObjet;
    return { type, etoiles: estObjetDeMetier(type) ? etoilesDeBase(type) : null };
  }
  const type = cle.slice(0, i) as TypeObjet;
  const n = Number(cle.slice(i + 1));
  return { type, etoiles: estObjetDeMetier(type) ? (estEtoiles(n) ? n : etoilesDeBase(type)) : null };
}

/** Le type d'une clé d'inventaire (« machette_forgee#4 » → « machette_forgee »). */
export function typeDe(cle: string): TypeObjet {
  const i = cle.indexOf("#");
  return (i < 0 ? cle : cle.slice(0, i)) as TypeObjet;
}

/** Les étoiles d'une clé (null : pas un objet de métier). */
export function etoilesDe(cle: string): Etoiles | null {
  return lireCle(cle).etoiles;
}

/** Une clé étoilée bien formée : un objet de métier, de ★ à ★★★★★, écrite sous sa forme canonique. */
export function estCleEtoileeValide(cle: string): boolean {
  const i = cle.indexOf("#");
  if (i < 0) return false;
  const type = cle.slice(0, i);
  const suffixe = cle.slice(i + 1);
  if (!estObjetDeMetier(type) || !/^[1-5]$/.test(suffixe)) return false;
  return Number(suffixe) !== etoilesDeBase(type);
}

// ---------- La règle du maillon faible (Book 02 §9, Book 25 §4.2) ----------

export interface ConditionsFabrication {
  /** La sorte est maîtrisée (10 exemplaires faits) : +1 étoile. */
  maitrise?: boolean;
  /** Fabriqué hors de sa famille : plafond ★★. */
  horsFamille?: boolean;
}

/**
 * Les étoiles d'un objet fabriqué : la moins bonne de ses facteurs (matière, geste, outils), +1 si la sorte est
 * maîtrisée ; plafond ★★★★★, ou ★★ hors famille.
 */
export function maillonFaible(facteurs: readonly number[], conditions: ConditionsFabrication = {}): Etoiles {
  const base = facteurs.length ? Math.min(...facteurs.map(borner)) : ETOILES_REFERENCE;
  const n = borner(base + (conditions.maitrise ? 1 : 0));
  return conditions.horsFamille ? (Math.min(n, PLAFOND_HORS_FAMILLE) as Etoiles) : n;
}

/** La maîtrise d'une sorte : `faits` exemplaires de la même sorte (Book 03 §5.4). */
export function estMaitrisee(faits: number): boolean {
  return faits >= SEUIL_MAITRISE;
}

/** Une étoile de moins (le reforgeage d'une lame cassée, Book 25 §4.4), jamais sous ★. */
export function uneEtoileDeMoins(n: Etoiles): Etoiles {
  return borner(n - 1);
}

/** Une étoile de plus (manche tourné, dérouillage), jamais au-delà de ★★★★★. */
export function uneEtoileDePlus(n: Etoiles): Etoiles {
  return borner(n + 1);
}

// ---------- Ce que changent les étoiles ----------

/**
 * Les multiplicateurs d'un exemplaire par rapport aux valeurs déclarées de son objet (déclarées à ses étoiles de
 * base) : une machette de fortune ★ portée à ★★ gagne ×0,9/0,8 en dégâts et ×0,75/0,5 en solidité.
 */
export function facteurs(type: TypeObjet, etoiles: Etoiles): { degats: number; solidite: number; porteeTete: number } {
  const base = ETOILES[etoilesDeBase(type)];
  const e = ETOILES[etoiles];
  return { degats: e.degats / base.degats, solidite: e.solidite / base.solidite, porteeTete: e.porteeTete / base.porteeTete };
}

/** La solidité d'un exemplaire (en coups), à partir de celle de son objet. */
export function soliditeExemplaire(type: TypeObjet, etoiles: Etoiles, solidite: number): number {
  if (!Number.isFinite(solidite)) return solidite;
  return Math.max(1, Math.round(solidite * facteurs(type, etoiles).solidite));
}

/** Les étoiles affichées : « ★★★ ». */
export function etoilesTexte(n: Etoiles): string {
  return "★".repeat(n);
}

// ---------- Les exemplaires dans un inventaire ----------

/** Un inventaire vu par clés (types nus et exemplaires étoilés). */
export type InventaireCles = Partial<Record<CleObjet, number>>;

/** Les exemplaires d'un type dans un inventaire, des meilleurs aux moins bons. */
export function exemplaires(inventaire: InventaireCles, type: TypeObjet): { cle: CleObjet; etoiles: Etoiles | null; nombre: number }[] {
  const r: { cle: CleObjet; etoiles: Etoiles | null; nombre: number }[] = [];
  for (const [cle, n] of Object.entries(inventaire)) {
    if (!n || n <= 0 || typeDe(cle) !== type) continue;
    r.push({ cle: cle as CleObjet, etoiles: etoilesDe(cle), nombre: n });
  }
  return r.sort((a, b) => (b.etoiles ?? 0) - (a.etoiles ?? 0));
}

/** Combien d'exemplaires d'un type, toutes étoiles confondues. */
export function compter(inventaire: InventaireCles, type: TypeObjet): number {
  return exemplaires(inventaire, type).reduce((s, e) => s + e.nombre, 0);
}

/** Le meilleur exemplaire d'un type (null : aucun). */
export function meilleurExemplaire(inventaire: InventaireCles, type: TypeObjet): CleObjet | null {
  return exemplaires(inventaire, type)[0]?.cle ?? null;
}

/** Ajoute `nombre` exemplaires d'un type, à ces étoiles (sans étoiles : celles de base), sur leur pile. */
export function ajouterExemplaires(inventaire: InventaireCles, type: TypeObjet, etoiles: number | undefined, nombre = 1): CleObjet {
  const cle = cleExemplaire(type, etoiles);
  inventaire[cle] = (inventaire[cle] ?? 0) + nombre;
  return cle;
}

/**
 * Retire `nombre` exemplaires d'un type, toutes étoiles confondues : les moins bons d'abord (une recette ne prend pas
 * la meilleure lame du sac), ou les meilleurs. Rend les clés retirées ; rien n'est retiré s'il n'y en a pas assez.
 */
export function retirerExemplaires(inventaire: InventaireCles, type: TypeObjet, nombre: number, ordre: "moins_bons" | "meilleurs" = "moins_bons"): Partial<Record<CleObjet, number>> | null {
  const piles = exemplaires(inventaire, type);
  if (ordre === "moins_bons") piles.reverse();
  if (piles.reduce((s, p) => s + p.nombre, 0) < nombre) return null;
  const retire: Partial<Record<CleObjet, number>> = {};
  let reste = nombre;
  for (const p of piles) {
    if (reste <= 0) break;
    const k = Math.min(reste, p.nombre);
    const apres = p.nombre - k;
    if (apres > 0) inventaire[p.cle] = apres;
    else delete inventaire[p.cle];
    retire[p.cle] = k;
    reste -= k;
  }
  return retire;
}

/**
 * Remet un inventaire sous sa forme canonique (lecture d'une sauvegarde, d'un coffre) : « lame_forgee#3 » devient
 * « lame_forgee » ; un suffixe sur un objet sans étoiles, ou illisible, revient au type nu ; les quantités nulles
 * disparaissent. Une sauvegarde d'avant la 0.6 (sans suffixe) ressort identique.
 */
export function canoniser<T extends number>(inventaire: Partial<Record<string, T>>): Partial<Record<CleObjet, number>> {
  const r: Partial<Record<CleObjet, number>> = {};
  for (const [cle, n] of Object.entries(inventaire)) {
    if (typeof n !== "number" || !(n > 0)) continue;
    const { type, etoiles } = lireCle(cle);
    const c = cleExemplaire(type, etoiles ?? undefined);
    r[c] = (r[c] ?? 0) + n;
  }
  return r;
}
