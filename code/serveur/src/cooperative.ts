// La Coopérative du Plateau, côté serveur (Book 23) : un lieu vivant par joueur. Personne d'autre n'y entre ; ses
// Éteints, ses sacs tombés et son butin sont à lui. Le jour où on la partage, on ne change que la clé.
//
// Ce qu'on garde (Book 23 §7, 0.5d) : les Éteints détruits, l'état des portes, le butin pris (ressources de lieu).
// On ne garde ni l'attention ni le but : au retour, chaque Éteint encore debout reprend sa place. On sauve à chaque
// destruction, à chaque porte, quand le joueur s'en va, et toutes les 30 s. Le repeuplement se calcule à l'entrée :
// une Coopérative où l'on n'est pas ne coûte rien.

import { REGLAGES } from "../../commun/src/reglages.ts";
import {
  KLAXONS_PAR_BATTERIE,
  LEURRES,
  PILES_RADIO_S,
  RADIO_ETABLI,
  VERSION_COOP,
  butinCoop,
  chargeBatterieTracteur,
  pieceDe,
  portesInitiales,
} from "../../commun/src/cooperative.ts";
import type { EtatCoopVu } from "../../commun/src/messages.ts";
import { eteintsCoop } from "../../commun/src/eteints-coop.ts";
import { ZONE_COOP, zoneCoop } from "../../commun/src/lieux.ts";
import { milieuCoop } from "../../commun/src/milieu-coop.ts";
import type { Base } from "./base.ts";
import { LieuVivant, type DefinitionLieuVivant } from "./lieu-vivant.ts";

/** Ce qu'on garde d'une Coopérative entre deux visites. */
export interface EtatCoop {
  /** Les Éteints détruits (leur numéro dans `eteintsCoop`). */
  detruits: number[];
  portes: Record<string, boolean>;
  /** Instant réel (ms) du dernier repeuplement calculé. */
  repeupleLe: number;
  /** Les coups de klaxon qui restent à la batterie du tracteur, et les secondes de piles de la radio (Book 23 §4.7). */
  klaxons: number;
  piles: number;
  /** Où est posée la radio (0.5.1) ; null : dans le sac du joueur (ou dans un sac tombé, un tas posé par terre). */
  radio: { x: number; z: number } | null;
}

export function definitionCoop(compteId: number, detruits: () => readonly number[] = () => []): DefinitionLieuVivant {
  return {
    cle: `cooperative:${compteId}`,
    sacs: { lieu: "cooperative", terrainDe: compteId },
    zone: ZONE_COOP,
    portes: { initiales: portesInitiales, zone: zoneCoop },
    milieu: milieuCoop,
    econome: true,
    // Quand le lieu se rendort, les Éteints détruits ne reviennent pas pour autant.
    eteints: () => eteintsCoop().filter((e) => !detruits().includes(e.id)),
    ressources: butinCoop,
    version: VERSION_COOP,
  };
}

/** La chambre froide se repeuple d'abord (Book 23 §2.3 : jusqu'à ses 6 dormants). */
const DE_LA_CHAMBRE_FROIDE = new Set(eteintsCoop().filter((e) => pieceDe(e.x, e.z) === "chambre_froide").map((e) => e.id));

/**
 * Le repeuplement (Book 23 §2.3) : toutes les `coop_repeuplement_h` heures réelles, `coop_repeuplement_n` Éteints
 * détruits reviennent, la chambre froide d'abord. Calculé à l'entrée, d'un coup, pour tout le temps passé.
 */
export function repeupler(etat: EtatCoop, instant: number): EtatCoop {
  if (etat.detruits.length === 0) return { ...etat, repeupleLe: instant };
  const periode = REGLAGES.coop_repeuplement_h * 3_600_000;
  const fois = Math.floor((instant - etat.repeupleLe) / periode);
  if (fois <= 0) return etat;
  const ordre = [...etat.detruits].sort((a, b) => Number(DE_LA_CHAMBRE_FROIDE.has(b)) - Number(DE_LA_CHAMBRE_FROIDE.has(a)) || a - b);
  const reviennent = new Set(ordre.slice(0, fois * REGLAGES.coop_repeuplement_n));
  return { ...etat, detruits: etat.detruits.filter((id) => !reviennent.has(id)), repeupleLe: etat.repeupleLe + fois * periode };
}

function lireEtat(brut: unknown, instant: number): EtatCoop {
  const neuf: EtatCoop = { detruits: [], portes: portesInitiales(), repeupleLe: instant, klaxons: KLAXONS_PAR_BATTERIE, piles: PILES_RADIO_S, radio: { ...RADIO_ETABLI } };
  if (typeof brut !== "object" || brut === null) return neuf;
  const b = brut as Partial<EtatCoop>;
  const tous = new Set(eteintsCoop().map((e) => e.id));
  return {
    detruits: Array.isArray(b.detruits) ? b.detruits.filter((id): id is number => typeof id === "number" && tous.has(id)) : [],
    // Les portes connues seulement (le plan a pu changer).
    portes: { ...neuf.portes, ...Object.fromEntries(Object.entries(b.portes ?? {}).filter(([id, v]) => id in neuf.portes && typeof v === "boolean")) },
    repeupleLe: typeof b.repeupleLe === "number" ? b.repeupleLe : instant,
    klaxons: typeof b.klaxons === "number" ? Math.max(0, Math.min(KLAXONS_PAR_BATTERIE, b.klaxons)) : KLAXONS_PAR_BATTERIE,
    piles: typeof b.piles === "number" ? Math.max(0, Math.min(PILES_RADIO_S, b.piles)) : PILES_RADIO_S,
    // Absente (une Coopérative d'avant la 0.5.1) : sur l'établi ; null : emportée dans un sac.
    radio:
      b.radio === null
        ? null
        : typeof b.radio === "object" && b.radio !== undefined && Number.isFinite(b.radio.x) && Number.isFinite(b.radio.z)
          ? { x: b.radio.x, z: b.radio.z }
          : { ...RADIO_ETABLI },
  };
}

/** Une Coopérative vide depuis 5 minutes quitte la mémoire (elle sera rechargée au prochain passage). */
const DECHARGER_APRES_MS = 5 * 60_000;
/** On sauve aussi, au plus tard, toutes les 30 s. */
const SAUVER_TOUTES_MS = 30_000;

interface Chargee {
  lieu: LieuVivant;
  etat: EtatCoop;
  /** Ce qui a été écrit la dernière fois (pour ne réécrire qu'en cas de changement). */
  ecrit: string;
  sauveLe: number;
}

/** Les Coopératives chargées, une par joueur, créées au premier besoin. */
export class Cooperatives {
  private readonly instances = new Map<number, Chargee>();
  private readonly base: Base;
  private readonly alea: () => number;
  private readonly maintenant: () => number;

  constructor(base: Base, alea: () => number = Math.random, maintenant: () => number = Date.now) {
    this.base = base;
    this.alea = alea;
    this.maintenant = maintenant;
  }

  de(compteId: number): LieuVivant {
    const deja = this.instances.get(compteId);
    if (deja) return deja.lieu;
    const instant = this.maintenant();
    const cle = `cooperative:${compteId}`;
    const etat = repeupler(lireEtat(this.base.chargerInstance(cle), instant), instant);
    const lieu = new LieuVivant(this.base, definitionCoop(compteId, () => etat.detruits), this.alea);
    Object.assign(lieu.portes, etat.portes);
    const c: Chargee = { lieu, etat, ecrit: "", sauveLe: instant };
    this.instances.set(compteId, c);
    this.sauver(compteId, c, instant);
    return lieu;
  }

  get nombre(): number {
    return this.instances.size;
  }

  /**
   * Un leurre du décor (Book 23 §4.7). Le klaxon vide la batterie du tracteur (quatre coups) ; la sonnette sonne
   * toujours ; la radio s'allume et s'éteint, et joue tant que les piles tiennent. Renvoie ce qu'on en dit au joueur.
   */
  actionner(compteId: number, id: string, instant: number): string | null {
    const c = this.instances.get(compteId);
    const l = LEURRES.find((x) => x.id === id);
    if (!c || !l) return null;
    // Là où il est : la radio, où on l'a posée (0.5.1) ; le reste ne bouge pas.
    const ou = l.id === "radio" ? c.etat.radio : { x: l.x, z: l.z };
    if (!ou) return null;
    const bruit = (jusqua: number) => {
      c.lieu.ajouterBruit(l.id, { genre: "son", x: ou.x, z: ou.z, portee: l.portee, intensite: 1.3 }, jusqua);
      c.lieu.diffuser({ t: "leurre", id: l.id, actif: true, x: ou.x, z: ou.z });
    };
    if (l.id === "klaxon") {
      if (!this.batterieEnPlace(c, instant)) return "Le klaxon reste muet : il n'y a plus de batterie sous le capot.";
      if (c.etat.klaxons <= 0) return "Le klaxon ne fait plus qu'un clic : la batterie du tracteur est morte.";
      c.etat.klaxons--;
      bruit(instant + l.duree * 1000);
      this.diffuserEtat(c);
      return c.etat.klaxons === 0 ? "Le klaxon s'étrangle : c'était le dernier souffle de la batterie." : null;
    }
    if (l.id === "sonnette") {
      bruit(instant + l.duree * 1000);
      return null;
    }
    // La radio : allumer, éteindre.
    if (c.lieu.bruitEnCours("radio", instant)) {
      this.eteindreRadio(c, instant);
      return null;
    }
    if (c.etat.piles <= 0) return "La radio ne s'allume plus : les piles sont vides.";
    bruit(instant + c.etat.piles * 1000);
    return "« … l'engrais Watty ! Watt… Now? » La radio de la Compagnie hurle sa réclame.";
  }

  /** Ce que le joueur sait de sa Coopérative : où est la radio, ce qui reste au klaxon (0.5.1). */
  vue(compteId: number): EtatCoopVu {
    const c = this.instances.get(compteId);
    return { radio: c?.etat.radio ? { ...c.etat.radio } : null, klaxons: c?.etat.klaxons ?? KLAXONS_PAR_BATTERIE };
  }

  /** Où est la radio (null : dans un sac, ou Coopérative pas chargée). */
  radio(compteId: number): { x: number; z: number } | null {
    return this.instances.get(compteId)?.etat.radio ?? null;
  }

  /** La batterie est-elle encore dans le tracteur ? (le point de butin `coop_batterie` n'a pas été pris) */
  private batterieEnPlace(c: Chargee, instant: number): boolean {
    const r = [...c.lieu.ressources.values()].find((x) => x.type === "coop_batterie");
    return !r || r.disponibleLe <= instant;
  }

  /**
   * On démonte la batterie du tracteur (Book 23 §4.7) : elle part avec ce que les coups de klaxon lui ont laissé.
   * Le klaxon se tait ; la batterie qu'on retrouvera dans 4 jours sera pleine. Renvoie sa charge (Wh).
   */
  prendreBatterie(compteId: number): number {
    const c = this.instances.get(compteId);
    if (!c) return 0;
    const wh = chargeBatterieTracteur(c.etat.klaxons);
    c.etat.klaxons = KLAXONS_PAR_BATTERIE;
    this.diffuserEtat(c);
    return wh;
  }

  /** Prendre la radio (dans le sac) : elle s'éteint. Faux si elle n'est pas posée là. */
  prendreRadio(compteId: number, instant: number): boolean {
    const c = this.instances.get(compteId);
    if (!c?.etat.radio) return false;
    this.eteindreRadio(c, instant);
    c.etat.radio = null;
    this.diffuserEtat(c);
    return true;
  }

  /** Poser la radio à cet endroit de la Coopérative (éteinte). */
  poserRadio(compteId: number, x: number, z: number): void {
    const c = this.instances.get(compteId);
    if (!c) return;
    c.etat.radio = { x: Math.round(x * 100) / 100, z: Math.round(z * 100) / 100 };
    this.diffuserEtat(c);
  }

  /**
   * La radio n'est plus nulle part (ni posée, ni dans le sac du joueur, ni dans un sac ou un tas de la Coopérative) :
   * un tas qui a disparu, un sac perdu. Elle se retrouve sur l'établi, pour que le leurre ne soit jamais perdu.
   */
  retrouverRadio(compteId: number, dansLeSac: boolean): void {
    const c = this.instances.get(compteId);
    if (!c || c.etat.radio || dansLeSac) return;
    if (c.lieu.sacs.some((s) => (s.contenu.inventaire.radio_piles ?? 0) > 0)) return;
    c.etat.radio = { ...RADIO_ETABLI };
    this.diffuserEtat(c);
  }

  private eteindreRadio(c: Chargee, instant: number): void {
    if (!c.lieu.bruitEnCours("radio", instant)) return;
    c.lieu.retirerBruit("radio");
    const ou = c.etat.radio ?? RADIO_ETABLI;
    c.lieu.diffuser({ t: "leurre", id: "radio", actif: false, x: ou.x, z: ou.z });
  }

  private diffuserEtat(c: Chargee): void {
    c.lieu.diffuser({ t: "etat_coop", etat: { radio: c.etat.radio ? { ...c.etat.radio } : null, klaxons: c.etat.klaxons } });
  }

  /** Les leurres en marche (la radio allumée), pour qui arrive. */
  leurresActifs(compteId: number, instant: number): string[] {
    const c = this.instances.get(compteId);
    return c ? LEURRES.filter((l) => l.id === "radio" && c.lieu.bruitEnCours(l.id, instant)).map((l) => l.id) : [];
  }

  tick(instant: number, dt: number): void {
    for (const [id, c] of this.instances) {
      c.lieu.tick(instant, dt);
      // Les piles s'usent tant que la radio joue ; vides, elle se tait.
      if (c.lieu.bruitEnCours("radio", instant)) {
        c.etat.piles = Math.max(0, c.etat.piles - dt);
        if (c.etat.piles <= 0) this.eteindreRadio(c, instant);
      }
      this.noter(c, instant);
      if (JSON.stringify(c.etat) !== c.ecrit || instant - c.sauveLe >= SAUVER_TOUTES_MS) this.sauver(id, c, instant);
      if (c.lieu.videDepuisPlusDe(instant, DECHARGER_APRES_MS)) {
        this.sauver(id, c, instant);
        this.instances.delete(id);
      }
    }
  }

  /** Relève ce qui a changé dans le lieu : les Éteints détruits, les portes. */
  private noter(c: Chargee, instant: number): void {
    const debout = new Set(c.lieu.eteints.filter((e) => e.etat !== "detruit").map((e) => e.id));
    const detruits = eteintsCoop()
      .map((e) => e.id)
      .filter((id) => !debout.has(id));
    // Le premier détruit après une Coopérative pleine relance l'horloge du repeuplement.
    if (c.etat.detruits.length === 0 && detruits.length > 0) c.etat.repeupleLe = instant;
    c.etat.detruits = detruits;
    c.etat.portes = { ...c.lieu.portes };
  }

  private sauver(id: number, c: Chargee, instant: number): void {
    const ecrit = JSON.stringify(c.etat);
    if (ecrit !== c.ecrit) this.base.sauverInstance(`cooperative:${id}`, c.etat, instant);
    c.ecrit = ecrit;
    c.sauveLe = instant;
  }
}
