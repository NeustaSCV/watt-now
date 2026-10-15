// Un lieu à soi construit par le registre (plan 0.10, chantier A) : comme la Coopérative et le Moulin
// (serveur/src/cooperative.ts, moulin.ts), un lieu vivant par joueur, chargé au premier besoin, gardé en base
// (l'instance `<lieu>:<compte>`), et qui revient tout entier au bout de 24 h (S-04 : à l'entrée, lieu vide).
//
// Ce qu'on garde entre deux visites : les Éteints détruits, l'état des portes, le butin pris (les ressources de lieu,
// gardées par LieuVivant), et ce que le lieu garde de plus (`propre` : l'épave du phare, la borne de l'hôtel…, rempli
// par le chantier du lieu, vidé au retour à 24 h). On sauve à chaque changement, quand le joueur s'en va, et toutes les
// 30 s. Un lieu vide depuis 5 minutes quitte la mémoire.
//
// Un lieu qui a ses propres règles passe sa classe (sur LieuVivant) à la construction : `creer` (voir
// serveur/src/lieux-vivants.ts, FABRIQUES).

import { contenuDe } from "../../commun/src/contenu-lieux.ts";
import type { Eteint } from "../../commun/src/eteints.ts";
import { zoneDe, type LieuId } from "../../commun/src/lieux.ts";
import { REINITIALISATION_LIEU_MS, estPartage, ficheLieu } from "../../commun/src/registre-lieux.ts";
import type { Base } from "./base.ts";
import { LieuVivant, type DefinitionLieuVivant } from "./lieu-vivant.ts";

/** Ce qu'on garde d'un lieu à soi entre deux visites. */
export interface EtatLieuPersonnel {
  /** Les Éteints détruits (leur numéro). */
  detruits: number[];
  portes: Record<string, boolean>;
  /** Instant réel (ms) où le lieu a été trouvé plein, pour la dernière fois : au bout du délai, tout revient. */
  pleineLe: number;
  /** Ce que le lieu garde de plus (son chantier le remplit) ; vidé quand tout revient. */
  propre: Record<string, unknown>;
}

/**
 * La définition d'un lieu vivant, tirée du registre (registre-lieux.ts) et de son contenu (contenu-lieux.ts) : partagé
 * (une halte : la clé du lieu, ses sacs à tous) ou à un joueur (`<lieu>:<compte>`, ses sacs à lui). `detruits` : les
 * Éteints qui ne reviennent pas quand le lieu se rendort.
 */
export function definitionDuRegistre(lieu: LieuId, compteId = 0, detruits: () => readonly number[] = () => []): DefinitionLieuVivant {
  const fiche = ficheLieu(lieu);
  const contenu = contenuDe(lieu);
  const partage = estPartage(lieu);
  return {
    cle: partage ? lieu : `${lieu}:${compteId}`,
    sacs: { lieu, terrainDe: partage ? 0 : compteId },
    zone: zoneDe(lieu),
    ...(fiche.portes ? { portes: fiche.portes } : {}),
    ...(contenu.milieu ? { milieu: contenu.milieu } : {}),
    ...(fiche.plan ? { plan: fiche.plan } : {}),
    econome: contenu.econome ?? !partage,
    eteints: () => contenu.eteints().filter((e: Eteint) => !detruits().includes(e.id)),
    ressources: contenu.ressources,
    version: contenu.version,
    ...(contenu.butin ? { butin: contenu.butin } : {}),
    ...(contenu.semis ? { semis: contenu.semis } : {}),
  };
}

/** Faut-il tout faire revenir ? (le délai du lieu depuis qu'on l'a trouvé plein) */
export function aReinitialiserLieu(lieu: LieuId, etat: EtatLieuPersonnel, instant: number): boolean {
  return instant - etat.pleineLe >= (ficheLieu(lieu).reinitialisationMs ?? REINITIALISATION_LIEU_MS);
}

/** Un lieu vide depuis 5 minutes quitte la mémoire (il sera rechargé au prochain passage). */
const DECHARGER_APRES_MS = 5 * 60_000;
/** On sauve aussi, au plus tard, toutes les 30 s. */
const SAUVER_TOUTES_MS = 30_000;

/** Construit le lieu vivant d'un joueur : LieuVivant, ou la classe du lieu s'il a ses propres règles. */
export type CreerLieu = (base: Base, definition: DefinitionLieuVivant, alea: () => number) => LieuVivant;

interface Charge {
  lieu: LieuVivant;
  etat: EtatLieuPersonnel;
  /** Ce qui a été écrit la dernière fois (pour ne réécrire qu'en cas de changement). */
  ecrit: string;
  sauveLe: number;
}

/** Les lieux à soi d'un même endroit (un par joueur), créés au premier besoin. */
export class LieuxPersonnels {
  readonly lieu: LieuId;
  private readonly instances = new Map<number, Charge>();
  private readonly base: Base;
  private readonly alea: () => number;
  private readonly maintenant: () => number;
  private readonly creer: CreerLieu;
  /** Les numéros de tous les Éteints du lieu (pour relever les détruits). */
  private readonly ids: readonly number[];

  constructor(base: Base, lieu: LieuId, alea: () => number = Math.random, maintenant: () => number = Date.now, creer: CreerLieu = (b, d, a) => new LieuVivant(b, d, a)) {
    this.base = base;
    this.lieu = lieu;
    this.alea = alea;
    this.maintenant = maintenant;
    this.creer = creer;
    this.ids = contenuDe(lieu).eteints().map((e) => e.id);
  }

  private cle(compteId: number): string {
    return `${this.lieu}:${compteId}`;
  }

  private etatNeuf(instant: number): EtatLieuPersonnel {
    return { detruits: [], portes: ficheLieu(this.lieu).portes?.initiales() ?? {}, pleineLe: instant, propre: {} };
  }

  private lireEtat(brut: unknown, instant: number): EtatLieuPersonnel {
    const neuf = this.etatNeuf(instant);
    if (typeof brut !== "object" || brut === null) return neuf;
    const b = brut as Partial<EtatLieuPersonnel>;
    return {
      detruits: Array.isArray(b.detruits) ? b.detruits.filter((id): id is number => typeof id === "number" && this.ids.includes(id)) : [],
      // Les portes connues seulement (le plan a pu changer).
      portes: { ...neuf.portes, ...Object.fromEntries(Object.entries(b.portes ?? {}).filter(([id, v]) => id in neuf.portes && typeof v === "boolean")) },
      pleineLe: typeof b.pleineLe === "number" ? b.pleineLe : instant,
      propre: typeof b.propre === "object" && b.propre !== null && !Array.isArray(b.propre) ? { ...b.propre } : {},
    };
  }

  de(compteId: number): LieuVivant {
    const deja = this.instances.get(compteId);
    if (deja) {
      // Encore en mémoire, mais vide et au bout de son délai : tout revient avant qu'on y rentre.
      if (deja.lieu.nombrePresents === 0) this.reinitialiserSiLeTempsEstVenu(compteId, deja, this.maintenant());
      return deja.lieu;
    }
    const instant = this.maintenant();
    const etat = this.lireEtat(this.base.chargerInstance(this.cle(compteId)), instant);
    // La définition lit l'état courant (le même objet, remplacé au retour à 24 h).
    const c = { etat, ecrit: "", sauveLe: instant } as Charge;
    c.lieu = this.creer(this.base, definitionDuRegistre(this.lieu, compteId, () => c.etat.detruits), this.alea);
    Object.assign(c.lieu.portes, etat.portes);
    this.instances.set(compteId, c);
    this.reinitialiserSiLeTempsEstVenu(compteId, c, instant);
    this.sauver(compteId, c, instant);
    return c.lieu;
  }

  /** Ce qu'on garde du lieu de ce joueur (undefined : pas en mémoire). Le chantier du lieu y range son `propre`. */
  etat(compteId: number): EtatLieuPersonnel | undefined {
    return this.instances.get(compteId)?.etat;
  }

  /** Au bout du délai depuis qu'on l'a trouvé plein, tout revient (S-04). */
  private reinitialiserSiLeTempsEstVenu(compteId: number, c: Charge, instant: number): void {
    if (!aReinitialiserLieu(this.lieu, c.etat, instant)) return;
    c.etat = this.etatNeuf(instant);
    c.lieu.reinitialiser();
    this.sauver(compteId, c, instant);
  }

  get nombre(): number {
    return this.instances.size;
  }

  /** Le compte est supprimé (page d'administration) : son lieu quitte la mémoire sans être réécrit. */
  oublier(compteId: number): void {
    this.instances.delete(compteId);
  }

  tick(instant: number, dt: number): void {
    for (const [id, c] of this.instances) {
      c.lieu.tick(instant, dt);
      this.noter(c);
      if (JSON.stringify(c.etat) !== c.ecrit || instant - c.sauveLe >= SAUVER_TOUTES_MS) this.sauver(id, c, instant);
      if (c.lieu.videDepuisPlusDe(instant, DECHARGER_APRES_MS)) {
        this.sauver(id, c, instant);
        this.instances.delete(id);
      }
    }
  }

  /** Relève ce qui a changé dans le lieu : les Éteints détruits, les portes. */
  private noter(c: Charge): void {
    const debout = new Set(c.lieu.eteints.filter((e) => e.etat !== "detruit").map((e) => e.id));
    c.etat.detruits = this.ids.filter((id) => !debout.has(id));
    c.etat.portes = { ...c.lieu.portes };
  }

  /** Sauve l'état du lieu de ce joueur (le chantier du lieu l'appelle après avoir changé `propre`). */
  sauverEtat(compteId: number): void {
    const c = this.instances.get(compteId);
    if (c) this.sauver(compteId, c, this.maintenant());
  }

  private sauver(id: number, c: Charge, instant: number): void {
    const ecrit = JSON.stringify(c.etat);
    if (ecrit !== c.ecrit) this.base.sauverInstance(this.cle(id), c.etat, instant);
    c.ecrit = ecrit;
    c.sauveLe = instant;
  }
}
