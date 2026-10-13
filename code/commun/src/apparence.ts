// L'apparence du personnage (Book 14 §3) : choisie à la création, purement esthétique (aucun effet de jeu).
// La tenue reste celle de la famille (Book 18 §4.1) : c'est elle qui fait reconnaître la famille de loin.

import type { Famille } from "./regles.ts";

export type Silhouette = "feminine" | "masculine";
export type Coiffure = "chignons" | "longs" | "raie" | "courts" | "ras" | "rase";

export const COIFFURES: Coiffure[] = ["chignons", "longs", "raie", "courts", "ras", "rase"];
export const NOMS_COIFFURES: Record<Coiffure, string> = {
  chignons: "Chignons",
  longs: "Longs",
  raie: "Raie sur le côté",
  courts: "Courts",
  ras: "Ras",
  rase: "Crâne rasé",
};

/** Les carnations (de la plus claire à la plus foncée). */
export const CARNATIONS = [0xf1d2b6, 0xe8c4a0, 0xd2a07a, 0xc68e64, 0x9a6444, 0x6e4430] as const;
/** Les couleurs de cheveux : noir, brun, châtain, roux, blond, gris. */
export const COULEURS_CHEVEUX = [0x1c1714, 0x3b2a1e, 0x6b4a2e, 0x9a4a24, 0xc9a35a, 0xb9b3a8] as const;
export const NOMS_COULEURS_CHEVEUX = ["Noirs", "Bruns", "Châtains", "Roux", "Blonds", "Gris"] as const;

export interface Apparence {
  silhouette: Silhouette;
  /** Taille, de 0 (1,60 m) à 1 (1,90 m). */
  taille: number;
  /** Corpulence, de 0 (mince) à 1 (forte). */
  corpulence: number;
  /** Indice dans CARNATIONS. */
  peau: number;
  coiffure: Coiffure;
  /** Indice dans COULEURS_CHEVEUX. */
  cheveux: number;
  /**
   * La couleur de cheveux personnalisée (le « + » du choix, R8, 0.8.2), en « #rrggbb » minuscules. Quand elle est là,
   * elle remplace la teinte de `cheveux` (qui reste gardé : un client d'avant la 0.8.2 le lit toujours). Absente
   * d'une apparence d'avant la 0.8.2.
   */
  teinteCheveux?: string;
  barbe: boolean;
  /**
   * La toge blanche du compte admin (commun/src/admin.ts) : posée par le serveur seul, jamais lue du client
   * (`apparenceValide` ne la garde pas) ni enregistrée en base.
   */
  toge?: true;
}

export const TAILLE_MIN = 1.6;
export const TAILLE_MAX = 1.9;

/** La hauteur en mètres. */
export function hauteurDe(a: Apparence): number {
  return TAILLE_MIN + (TAILLE_MAX - TAILLE_MIN) * a.taille;
}

/** Les personnages de référence (Book 18 §4.1) : l'apparence par défaut de chaque famille. */
export const APPARENCES_DE_REFERENCE: Record<Famille, Apparence> = {
  // 🔥 Nadia, forgeronne
  charbonniers: { silhouette: "feminine", taille: 0.5, corpulence: 0.55, peau: 3, coiffure: "chignons", cheveux: 0, barbe: false },
  // ⚡ Malik, ancien monteur de lignes
  voltaiques: { silhouette: "masculine", taille: 0.55, corpulence: 0.45, peau: 5, coiffure: "ras", cheveux: 0, barbe: false },
  // ⚙️ Rose, maraîchère à la retraite
  mecanistes: { silhouette: "feminine", taille: 0.4, corpulence: 0.5, peau: 1, coiffure: "longs", cheveux: 5, barbe: false },
};

/** Une couleur personnalisée lisible : « #rrggbb » (six chiffres hexadécimaux, rien d'autre). */
const COULEUR_HEX = /^#[0-9a-f]{6}$/i;

/** La couleur personnalisée rendue sûre (en minuscules), ou `null` si elle n'en est pas une : elle est alors refusée. */
export function teinteValide(x: unknown): string | null {
  return typeof x === "string" && COULEUR_HEX.test(x) ? x.toLowerCase() : null;
}

/** La couleur des cheveux à peindre : la couleur personnalisée si le joueur en a choisi une, sinon celle de la palette. */
export function couleurCheveuxDe(a: Apparence): number {
  const teinte = teinteValide(a.teinteCheveux);
  if (teinte) return Number.parseInt(teinte.slice(1), 16);
  return COULEURS_CHEVEUX[a.cheveux] ?? COULEURS_CHEVEUX[0];
}

const entre = (x: unknown, min: number, max: number, defaut: number): number => (typeof x === "number" && Number.isFinite(x) ? Math.min(max, Math.max(min, x)) : defaut);

/**
 * Une apparence reçue du client, rendue sûre : chaque champ est borné, ce qui manque prend la valeur de la famille.
 * Les curseurs sont arrondis au vingtième (le client n'a rien de plus fin, et les apparences se mettent en cache).
 * Une couleur de cheveux personnalisée invalide est refusée : le champ disparaît, et la palette (`cheveux`) reprend.
 */
export function apparenceValide(x: unknown, famille: Famille): Apparence {
  const d = APPARENCES_DE_REFERENCE[famille];
  const o = (typeof x === "object" && x !== null ? x : {}) as Record<string, unknown>;
  const vingtieme = (v: number) => Math.round(v * 20) / 20;
  const teinte = teinteValide(o.teinteCheveux);
  return {
    silhouette: o.silhouette === "feminine" || o.silhouette === "masculine" ? o.silhouette : d.silhouette,
    taille: vingtieme(entre(o.taille, 0, 1, d.taille)),
    corpulence: vingtieme(entre(o.corpulence, 0, 1, d.corpulence)),
    peau: Math.round(entre(o.peau, 0, CARNATIONS.length - 1, d.peau)),
    coiffure: COIFFURES.includes(o.coiffure as Coiffure) ? (o.coiffure as Coiffure) : d.coiffure,
    cheveux: Math.round(entre(o.cheveux, 0, COULEURS_CHEVEUX.length - 1, d.cheveux)),
    barbe: o.barbe === true,
    ...(teinte ? { teinteCheveux: teinte } : {}),
  };
}

/** L'apparence d'un ancien compte (avant le menu d'apparence) : celle de la famille, avec sa carnation d'alors. */
export function apparenceAncienne(famille: Famille, ancienneCarnation: number): Apparence {
  const a = { ...APPARENCES_DE_REFERENCE[famille] };
  // Les trois anciennes carnations correspondent aux teintes 1, 3 et 4 de la nouvelle palette.
  if (ancienneCarnation >= 0 && ancienneCarnation <= 2) a.peau = [1, 3, 4][ancienneCarnation]!;
  return a;
}
