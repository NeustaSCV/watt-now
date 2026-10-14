// L1B, le Moulin du Gué, côté serveur (plan 0.8, chantier 12) : un lieu vivant par joueur, comme la Coopérative
// (Book 23). Personne d'autre n'y entre ; ses Éteints, ses sacs tombés et son butin sont à lui.
//
// Le plan (zone, pièces, portes, butin, leurres) est dans commun/src/moulin.ts, les Éteints dans eteints-moulin.ts, le
// milieu dans milieu-moulin.ts, la vue dans vue-lieux.ts (PLAN_VUE_MOULIN).
//
// Ce qu'on garde entre deux visites (comme la Coopérative, serveur/src/cooperative.ts) : les Éteints détruits, ceux
// qu'on a fait tomber dans la fosse du rouet, la grande porte (déverrouillée, ouverte ou fermée), la batterie de la
// borne, le butin pris (ressources de lieu), et si la fourche à foin a été trouvée. On sauve à chaque changement, quand
// le joueur s'en va, et toutes les 30 s. En base : l'instance `moulin:<compte>`, les ressources `moulin:<compte>`.
//
// Plan 0.8 (§9.1, N1 ; R51) : au bout de 24 h, **tout revient** — les Éteints, le butin, les clés à place fixe, la
// grosse clé au tableau, la grande porte refermée à clé, la batterie de la borne. Sauf la fourche à foin : une fois par
// personnage. Le retour se calcule à l'entrée, quand personne n'est dedans : un Moulin où l'on n'est pas ne coûte rien.

import { GEMISSEMENT, type Eteint } from "../../commun/src/eteints.ts";
import { eteintsMoulin } from "../../commun/src/eteints-moulin.ts";
import { ZONE_MOULIN, zoneMoulin } from "../../commun/src/lieux.ts";
import { milieuMoulin } from "../../commun/src/milieu-moulin.ts";
import {
  CARNET_DU_MEUNIER,
  FOSSE_ROUET,
  GEMIT_FOSSE,
  LEURRES_MOULIN,
  PORTEE_PORTE_MOULIN,
  PORTES_MOULIN,
  REINITIALISATION_MOULIN_MS,
  TEXTE_GRANDE_PORTE_FERMEE,
  VERSION_MOULIN,
  boitePorteMoulin,
  dansLaFosse,
  distancePorteMoulin,
  portesInitialesMoulin,
} from "../../commun/src/moulin.ts";
import { DISTANCE_INTERACTION } from "../../commun/src/terrain.ts";
import { PLAN_VUE_MOULIN } from "../../commun/src/vue-lieux.ts";
import { butinDuSemis, ressourcesSemees, semisVivant } from "../../commun/src/semis-lieux.ts";
import type { Base, RessourceEnBase } from "./base.ts";
import { JAMAIS, LieuVivant, type DefinitionLieuVivant, type Voyageur } from "./lieu-vivant.ts";

/** Ce qu'on garde d'un Moulin entre deux visites. */
export interface EtatMoulin {
  /** Les Éteints détruits (leur numéro de fiche, E1 : 1). */
  detruits: number[];
  /** Les Éteints tombés dans la fosse du rouet (M14) : ils y restent, même quand le Moulin se rendort. */
  tombes: number[];
  portes: Record<string, boolean>;
  /** La grosse clé est dans la serrure : la grande porte ne se verrouille plus (M4), jusqu'au retour à 24 h. */
  deverrouillee: boolean;
  /** Les jingles qui restent à la batterie de la borne (M31). */
  borne: number;
  /** La fourche à foin a été trouvée (une fois par personnage : plan 0.8 §9.1, N1). Survit au retour à 24 h. */
  fourche: boolean;
  /** Instant réel (ms) où le Moulin a été trouvé plein, pour la dernière fois : 24 h après, tout revient. */
  pleineLe: number;
}

/** Les numéros des Éteints du Moulin, et ceux qui vivent au fond de la fosse (le rampant du rouet). */
const IDS = eteintsMoulin().map((e) => e.id);
const NATIFS_FOSSE = new Set(eteintsMoulin().filter((e) => dansLaFosse(e.x, e.z)).map((e) => e.id));

/** Les jingles de la borne, au départ (sa batterie). */
const JINGLES_BORNE = LEURRES_MOULIN.find((l) => l.id === "borne")!.fois ?? 3;

/** Un Moulin plein, comme à la première visite (la fourche, une fois trouvée, le reste). */
function etatNeuf(instant: number, fourche = false): EtatMoulin {
  return { detruits: [], tombes: [], portes: portesInitialesMoulin(), deverrouillee: false, borne: JINGLES_BORNE, fourche, pleineLe: instant };
}

/** Faut-il tout faire revenir ? (24 h depuis qu'on l'a trouvé plein : plan 0.8 §9.1, N1) */
export function aReinitialiser(etat: EtatMoulin, instant: number): boolean {
  return instant - etat.pleineLe >= REINITIALISATION_MOULIN_MS;
}

function lireEtat(brut: unknown, instant: number): EtatMoulin {
  const neuf = etatNeuf(instant);
  if (typeof brut !== "object" || brut === null) return neuf;
  const b = brut as Partial<EtatMoulin>;
  const ids = (v: unknown) => (Array.isArray(v) ? v.filter((id): id is number => typeof id === "number" && IDS.includes(id)) : []);
  return {
    detruits: ids(b.detruits),
    tombes: ids(b.tombes),
    portes: { ...neuf.portes, ...Object.fromEntries(Object.entries(b.portes ?? {}).filter(([id, v]) => id in neuf.portes && typeof v === "boolean")) },
    deverrouillee: b.deverrouillee === true,
    borne: typeof b.borne === "number" ? Math.max(0, Math.min(JINGLES_BORNE, b.borne)) : JINGLES_BORNE,
    fourche: b.fourche === true,
    pleineLe: typeof b.pleineLe === "number" ? b.pleineLe : instant,
  };
}

/** Les Éteints du Moulin selon ce qu'on en garde : sans les détruits ; ceux qui sont tombés, au fond de la fosse. */
function eteintsSelon(etat: EtatMoulin): Eteint[] {
  return eteintsMoulin()
    .filter((e) => !etat.detruits.includes(e.id))
    .map((e) => {
      if (!etat.tombes.includes(e.id) || dansLaFosse(e.x, e.z)) return e;
      // Au fond, sous le rouet : il y attend, il n'en remonte pas.
      const z = FOSSE_ROUET.z - FOSSE_ROUET.p / 2 + 0.6 + ((e.id * 0.37) % 1) * (FOSSE_ROUET.p - 1.2);
      e.x = FOSSE_ROUET.x;
      e.z = z;
      e.maison = { x: e.x, z };
      return e;
    });
}

export function definitionMoulin(compteId: number, etat: () => EtatMoulin = () => etatNeuf(0)): DefinitionLieuVivant {
  return {
    cle: `moulin:${compteId}`,
    sacs: { lieu: "moulin", terrainDe: compteId },
    zone: ZONE_MOULIN,
    portes: { initiales: portesInitialesMoulin, zone: zoneMoulin },
    milieu: milieuMoulin,
    plan: PLAN_VUE_MOULIN,
    econome: true,
    // Quand le lieu se rendort, les Éteints détruits ne reviennent pas, et ceux de la fosse y restent.
    eteints: () => eteintsSelon(etat()),
    // Son butin, puis le bois et les pierres semés au hasard (plan 0.9, M5 : commun/src/semis.ts).
    ressources: ressourcesSemees("moulin"),
    version: VERSION_MOULIN,
    butin: butinDuSemis("moulin"),
    semis: semisVivant("moulin"),
  };
}

/**
 * Le Moulin d'un joueur : un lieu vivant, plus ce qui lui est propre. Le rampant de la fosse gémit quand on passe en
 * marchant (M15) ; le monte-sacs ne lâche son sac qu'une fois par visite ; la malle du meunier livre son carnet (M28).
 */
export class LieuMoulin extends LieuVivant {
  /** Ceux qui sont là (on les entend marcher près de la fosse). */
  private readonly ici = new Set<Voyageur>();
  /** Le sac du monte-sacs est tombé pendant cette visite. */
  monteSacsTombe = false;
  /** Quand chaque Éteint de la fosse a gémi pour la dernière fois. */
  private readonly gemi = new Map<number, number>();

  override entrer(v: Voyageur): void {
    // Une nouvelle visite : un sac pend de nouveau à la corde du monte-sacs.
    if (this.nombrePresents === 0) this.monteSacsTombe = false;
    super.entrer(v);
    this.ici.add(v);
  }

  override sortir(v: Voyageur): void {
    super.sortir(v);
    this.ici.delete(v);
  }

  override prendrePar(r: RessourceEnBase, compteId: number, instant: number): void {
    super.prendrePar(r, compteId, instant);
    if (r.type !== "moulin_malle") return;
    for (const v of this.ici) if (v.humain().id === compteId) v.envoyer({ t: "info", texte: CARNET_DU_MEUNIER });
  }

  override tick(instant: number, dt: number): void {
    this.gemirDansLaFosse(instant);
    super.tick(instant, dt);
  }

  /** M15 : qui passe en marchant près de la fosse fait gémir le rampant du fond ; le gémissement porte jusqu'au nord. */
  private gemirDansLaFosse(instant: number): void {
    if (this.ici.size === 0) return;
    for (const e of this.eteints) {
      if (e.etat === "detruit" || !dansLaFosse(e.x, e.z)) continue;
      if (instant - (this.gemi.get(e.id) ?? -Infinity) < GEMIT_FOSSE.repos * 1000) continue;
      const pres = [...this.ici].some((v) => {
        const h = v.humain();
        return !h.discret && Math.hypot(h.x - e.x, h.z - e.z) <= GEMIT_FOSSE.distance;
      });
      if (!pres) continue;
      this.gemi.set(e.id, instant);
      e.gemit = Math.max(e.gemit ?? 0, GEMISSEMENT.duree);
      this.ajouterBruit(`fosse:${e.id}`, { genre: "son", x: e.x, z: e.z, portee: GEMIT_FOSSE.portee, intensite: GEMIT_FOSSE.intensite }, instant + GEMIT_FOSSE.duree * 1000);
    }
  }
}

/** Ce que le Moulin demande au joueur pour la grande porte : où il est, s'il a la grosse clé, et la lui prendre. */
export interface QuiOuvre {
  x: number;
  z: number;
  aLaCle: boolean;
  laisserLaCle(): void;
}

/** Un Moulin vide depuis 5 minutes quitte la mémoire (il sera rechargé au prochain passage). */
const DECHARGER_APRES_MS = 5 * 60_000;
/** On sauve aussi, au plus tard, toutes les 30 s. */
const SAUVER_TOUTES_MS = 30_000;
/** La grande porte grince (M6) : comme le portail de la Coopérative, on l'entend à 18 m. */
const GRINCEMENT = { portee: 18, intensite: 1.3, duree: 1500 } as const;

interface Charge {
  lieu: LieuMoulin;
  etat: EtatMoulin;
  /** Ce qui a été écrit la dernière fois (pour ne réécrire qu'en cas de changement). */
  ecrit: string;
  sauveLe: number;
}

/** Les Moulins chargés, un par joueur, créés au premier besoin. */
export class Moulins {
  private readonly instances = new Map<number, Charge>();
  private readonly base: Base;
  private readonly alea: () => number;
  private readonly maintenant: () => number;

  constructor(base: Base, alea: () => number = Math.random, maintenant: () => number = Date.now) {
    this.base = base;
    this.alea = alea;
    this.maintenant = maintenant;
  }

  de(compteId: number): LieuMoulin {
    const deja = this.instances.get(compteId);
    if (deja) {
      // Encore en mémoire, mais vide et au bout de ses 24 h : tout revient avant qu'on y rentre.
      if (deja.lieu.nombrePresents === 0) this.reinitialiserSiLeTempsEstVenu(compteId, deja, this.maintenant());
      return deja.lieu;
    }
    const instant = this.maintenant();
    const etat = lireEtat(this.base.chargerInstance(`moulin:${compteId}`), instant);
    // La définition lit l'état courant (le même objet, mis à jour en place).
    const c = { etat } as Charge;
    c.lieu = new LieuMoulin(this.base, definitionMoulin(compteId, () => c.etat), this.alea);
    Object.assign(c.lieu.portes, etat.portes);
    c.ecrit = "";
    c.sauveLe = instant;
    this.instances.set(compteId, c);
    this.reinitialiserSiLeTempsEstVenu(compteId, c, instant);
    this.garderLaFourche(c);
    this.sauver(compteId, c, instant);
    return c.lieu;
  }

  /** La fourche trouvée une fois ne revient jamais, même si le contenu du Moulin a changé de version. */
  private garderLaFourche(c: Charge): void {
    if (!c.etat.fourche) return;
    for (const r of c.lieu.ressources.values()) if (r.type === "moulin_fourche" && r.disponibleLe !== JAMAIS) c.lieu.prendre(r, JAMAIS);
  }

  /** 24 h après l'avoir trouvé plein, tout revient (plan 0.8 §9.1, N1), sauf la fourche. */
  private reinitialiserSiLeTempsEstVenu(compteId: number, c: Charge, instant: number): void {
    if (!aReinitialiser(c.etat, instant)) return;
    c.etat = etatNeuf(instant, c.etat.fourche);
    c.lieu.reinitialiser();
    c.lieu.monteSacsTombe = false;
    this.sauver(compteId, c, instant);
  }

  get nombre(): number {
    return this.instances.size;
  }

  /** Le compte est supprimé (page d'administration) : son Moulin quitte la mémoire sans être réécrit. */
  oublier(compteId: number): void {
    this.instances.delete(compteId);
  }

  /**
   * Ouvrir ou fermer une porte du Moulin : seule la grande porte se ferme (les autres ont perdu leur battant). Fermée à
   * clé, elle répond par une ligne (M5) ; avec la grosse clé, elle s'ouvre, grince (M6), et la clé reste dans la serrure :
   * elle ne se verrouille plus jusqu'au retour à 24 h (M4). Renvoie ce qu'on en dit au joueur (null : rien).
   */
  actionnerPorte(compteId: number, id: string, ouvrir: boolean, qui: QuiOuvre, instant: number): string | null {
    const c = this.instances.get(compteId);
    const p = PORTES_MOULIN.find((q) => q.id === id);
    if (!c || !p) return null;
    if (!p.fermable) return null;
    if (distancePorteMoulin(p, qui.x, qui.z) > PORTEE_PORTE_MOULIN + 0.5) return "Approche-toi de la porte.";
    if (!ouvrir) {
      // On ne referme pas une porte sur quelqu'un : ni sur soi, ni sur un Éteint.
      const b = boitePorteMoulin(p);
      const dedans = (x: number, z: number) => Math.abs(x - b.x) <= b.l / 2 + 0.4 && Math.abs(z - b.z) <= b.p / 2 + 0.4;
      if (dedans(qui.x, qui.z) || c.lieu.eteints.some((e) => e.etat !== "detruit" && dedans(e.x, e.z))) return "Quelque chose bloque la porte.";
    }
    let texte: string | null = null;
    if (ouvrir && !c.etat.deverrouillee) {
      if (!qui.aLaCle) return TEXTE_GRANDE_PORTE_FERMEE;
      qui.laisserLaCle();
      c.etat.deverrouillee = true;
      texte = "La grosse clé tourne en grinçant, la grande porte s'ouvre… et tout le moulin l'a entendue. La clé reste dans la serrure.";
    }
    if (!c.lieu.basculerPorte(id, ouvrir)) return texte;
    if (p.bruyante) c.lieu.ajouterBruit(`porte:${id}`, { genre: "son", x: p.x, z: p.z, portee: GRINCEMENT.portee, intensite: GRINCEMENT.intensite }, instant + GRINCEMENT.duree);
    this.noter(c);
    this.sauver(compteId, c, instant);
    return texte;
  }

  /**
   * Un leurre du décor (M31) : le monte-sacs (un sac par visite), le babillard (à volonté), la borne (trois jingles, tant
   * que sa batterie tient). Renvoie ce qu'on en dit au joueur (null : rien à dire).
   */
  actionner(compteId: number, id: string, qui: { x: number; z: number }, instant: number): string | null {
    const c = this.instances.get(compteId);
    const l = LEURRES_MOULIN.find((x) => x.id === id);
    if (!c || !l) return null;
    if (Math.hypot(qui.x - l.x, qui.z - l.z) > DISTANCE_INTERACTION + 0.5) return "Approche-toi.";
    if (c.lieu.bruitEnCours(l.id, instant)) return null;
    if (l.id === "monte_sacs") {
      if (c.lieu.monteSacsTombe) return "La corde du monte-sacs pend, vide : le sac est déjà en bas.";
      c.lieu.monteSacsTombe = true;
    }
    if (l.id === "borne") {
      if (c.etat.borne <= 0) return "L'écran de la borne reste noir : sa batterie est à plat.";
      c.etat.borne--;
    }
    c.lieu.ajouterBruit(l.id, { genre: "son", x: l.source.x, z: l.source.z, portee: l.portee, intensite: 1.3 }, instant + l.duree * 1000);
    c.lieu.diffuser({ t: "leurre", id: l.id, actif: true, x: l.source.x, z: l.source.z });
    this.sauver(compteId, c, instant);
    if (l.id === "monte_sacs") return "Tu lâches la corde : le sac dégringole du troisième et s'écrase dans la cour.";
    if (l.id === "borne") return c.etat.borne === 0 ? "« Pétrissez virtuellement ! » La borne chante… et s'éteint pour de bon." : "« Pétrissez virtuellement ! » La borne entonne son jingle.";
    return null;
  }

  /** Ce qu'il reste à la batterie de la borne (pour l'examen). */
  jinglesBorne(compteId: number): number {
    return this.instances.get(compteId)?.etat.borne ?? JINGLES_BORNE;
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

  /** Relève ce qui a changé dans le lieu : les Éteints détruits ou tombés, la grande porte, la fourche trouvée. */
  private noter(c: Charge): void {
    const presents = c.lieu.eteints.filter((e) => e.etat !== "detruit");
    const debout = new Set(presents.map((e) => e.id));
    c.etat.detruits = IDS.filter((id) => !debout.has(id));
    c.etat.tombes = presents.filter((e) => !NATIFS_FOSSE.has(e.id) && dansLaFosse(e.x, e.z)).map((e) => e.id);
    c.etat.portes = { ...c.lieu.portes };
    if (!c.etat.fourche) c.etat.fourche = [...c.lieu.ressources.values()].some((r) => r.type === "moulin_fourche" && r.disponibleLe === JAMAIS);
  }

  private sauver(id: number, c: Charge, instant: number): void {
    const ecrit = JSON.stringify(c.etat);
    if (ecrit !== c.ecrit) this.base.sauverInstance(`moulin:${id}`, c.etat, instant);
    c.ecrit = ecrit;
    c.sauveLe = instant;
  }
}
