// Un lieu vivant (Book 23 §7) : des ressources, des Éteints, des sacs tombés, les joueurs présents, et l'envoi filtré
// de ce que chacun voit. La station-service en est un, partagé par tous les voyageurs (Book 01 §2 bis) ; chaque joueur a
// sa Coopérative (Book 23), un lieu vivant à lui. Le jour où on la partage, on ne change que la clé.

import { DUREE_CORPS } from "../../commun/src/combat.ts";
import { GEMISSEMENT, penser, vue, type Eteint, type Humain, type Milieu } from "../../commun/src/eteints.ts";
import type { Zone } from "../../commun/src/lieux.ts";
import type { MessageServeur, SacVu } from "../../commun/src/messages.ts";
import type { Stimulus } from "../../commun/src/signature.ts";
import type { RessourceSol } from "../../commun/src/terrain.ts";
import { estNuit, heureDeJeu } from "../../commun/src/temps.ts";
import { vueDuSac, type Base, type RessourceEnBase, type SacEnBase } from "./base.ts";

/** Une ressource d'un lieu vivant, telle qu'on la génère (sa disponibilité vient de la base). */
export type RessourceDeLieu = Omit<RessourceSol, "disponible">;

const INTERVALLE_REPOUSSE = 5000;
/** Les Éteints sont envoyés 5 fois par seconde. */
const INTERVALLE_ETEINTS = 200;
/** Sans voyageur pendant 2 minutes, la halte retrouve son calme : les Éteints reprennent leur place. */
const DELAI_RETOUR_AU_CALME = 120_000;

/** Ce qui distingue un lieu vivant d'un autre. */
export interface DefinitionLieuVivant {
  /** Clé des ressources en base (« station », « cooperative:12 »). */
  cle: string;
  /** Où sont rangés ses sacs tombés : le lieu et, pour un lieu à un joueur, son compte (0 : lieu public). */
  sacs: { lieu: string; terrainDe: number };
  zone: Zone;
  /** Les portes du lieu et leur état d'origine (ouverte : true), s'il en a ; et la zone selon leur état. */
  portes?: { initiales: () => Record<string, boolean>; zone: (etats: Readonly<Record<string, boolean>>) => Zone };
  /** Ce que l'endroit fait à la perception des Éteints (murs, portes, obscurité), selon l'état des portes. */
  milieu?: (portes: Readonly<Record<string, boolean>>) => Milieu;
  /**
   * Calcul économe (Book 23 §7) : l'IA tourne à 10 Hz, et à 2 Hz pour les dormants et les Éteints loin de tout joueur.
   * Sans : à chaque tic, comme à la halte.
   */
  econome?: boolean;
  /** Les Éteints du lieu, au calme (au début, et quand le lieu se rendort). */
  eteints: () => Eteint[];
  /** Ses ressources à la première visite (et la version de ce contenu : la changer régénère). */
  ressources: () => RessourceDeLieu[];
  version: number;
}

/** Un joueur présent dans le lieu, vu par lui. */
export interface Voyageur {
  envoyer(m: MessageServeur): void;
  stimuli(nuit: boolean): Stimulus[];
  humain(): Humain;
  /** En pause : le lieu (s'il est à lui seul) ne bouge plus. */
  enPause?(): boolean;
}

/** On voit les Éteints de la halte jusqu'à cette distance (la caméra en montre ≈ 30 m ; un peu de marge). */
const RAYON_VUE_ETEINTS = 45;

export class LieuVivant {
  readonly ressources = new Map<number, RessourceEnBase>();
  eteints: Eteint[];
  /** Les sacs tombés là après un effondrement. */
  readonly sacs: SacEnBase[] = [];
  private readonly presents = new Set<Voyageur>();
  /** Ceux qui ont déjà reçu une liste vide (inutile de la renvoyer tant qu'aucun Éteint n'approche). */
  private readonly aucunEnvoye = new Set<Voyageur>();
  private derniereRepousse = 0;
  private dernierEnvoi = 0;
  /** Des bruits qui durent (un leurre : klaxon, sonnette, radio), jusqu'à un instant réel. */
  private readonly bruits = new Map<string, { stimulus: Stimulus; jusqua: number }>();

  ajouterBruit(id: string, stimulus: Stimulus, jusqua: number): void {
    this.bruits.set(id, { stimulus, jusqua });
  }

  retirerBruit(id: string): void {
    this.bruits.delete(id);
  }

  /** Ce bruit dure-t-il encore ? */
  bruitEnCours(id: string, instant: number): boolean {
    return (this.bruits.get(id)?.jusqua ?? 0) > instant;
  }

  /** Le temps accumulé par chaque Éteint depuis son dernier calcul (calcul économe). */
  private readonly attente = new Map<number, number>();
  /** Depuis quand personne n'est là (0 : quelqu'un est là). */
  private videDepuis = 0;
  /** Dernier retour au calme des Éteints, pendant que le lieu est vide. */
  private calmeDepuis = 0;
  private readonly base: Base;
  private readonly debutMonde: number;
  private readonly alea: () => number;
  readonly definition: DefinitionLieuVivant;
  /** L'état des portes (vide s'il n'y en a pas). Gardé tant que le lieu est en mémoire. */
  readonly portes: Record<string, boolean>;

  constructor(base: Base, definition: DefinitionLieuVivant, alea: () => number = Math.random) {
    this.base = base;
    this.definition = definition;
    this.debutMonde = base.debutMonde();
    this.alea = alea;
    this.eteints = definition.eteints();
    this.portes = definition.portes?.initiales() ?? {};
    for (const r of base.chargerRessourcesLieu(definition.cle, definition.ressources, definition.version)) this.ressources.set(r.id, r);
    this.sacs.push(...base.chargerSacs(definition.sacs.lieu, definition.sacs.terrainDe));
  }

  sacsVus(pour: number): SacVu[] {
    return this.sacs.map((s) => vueDuSac(s, pour));
  }

  poserSac(sac: SacEnBase): void {
    this.sacs.push(sac);
    this.diffuserSacs();
  }

  retirerSac(id: number): void {
    const i = this.sacs.findIndex((s) => s.id === id);
    if (i >= 0) this.sacs.splice(i, 1);
    this.base.retirerSac(id);
    this.diffuserSacs();
  }

  private diffuserSacs(): void {
    for (const v of this.presents) v.envoyer({ t: "sacs", sacs: this.sacsVus(v.humain().id) });
  }

  entrer(v: Voyageur): void {
    this.presents.add(v);
  }

  sortir(v: Voyageur): void {
    this.presents.delete(v);
    this.aucunEnvoye.delete(v);
  }

  get nombrePresents(): number {
    return this.presents.size;
  }

  /** La zone où l'on se déplace : celle du lieu, avec ses portes fermées. */
  get zone(): Zone {
    return this.definition.portes ? this.definition.portes.zone(this.portes) : this.definition.zone;
  }

  /** Le milieu des Éteints (murs, portes, obscurité), s'il y en a un. */
  get milieu(): Milieu | undefined {
    return this.definition.milieu?.(this.portes);
  }

  /** Fait-il noir ici, même en plein jour ? (une pièce sombre de la Coopérative) */
  obscur(x: number, z: number): boolean {
    return this.milieu?.obscur(x, z) ?? false;
  }

  /** Ouvre ou ferme une porte, et prévient tous ceux qui sont là. Renvoie false si rien n'a changé. */
  basculerPorte(id: string, ouverte: boolean): boolean {
    if (!(id in this.portes) || this.portes[id] === ouverte) return false;
    this.portes[id] = ouverte;
    this.diffuser({ t: "portes", portes: { ...this.portes } });
    return true;
  }

  /** Un lieu à un seul joueur, vide depuis longtemps, peut être déchargé de la mémoire. */
  videDepuisPlusDe(instant: number, ms: number): boolean {
    return this.presents.size === 0 && this.videDepuis > 0 && instant - this.videDepuis > ms;
  }

  /**
   * Les Éteints qu'un joueur voit : ceux à moins de RAYON_VUE_ETEINTS mètres (la halte fait 200 m ; on n'envoie
   * pas ceux de l'autre bout, 2026-10-08). Sans position : tous.
   */
  eteintsVus(autour?: { x: number; z: number }) {
    return autour ? this.eteints.filter((e) => this.percoit(autour, e)).map(vue) : this.eteints.map(vue);
  }

  /**
   * Un joueur ne reçoit que les Éteints qu'il peut percevoir (Book 23 §7) : à portée, et pas derrière un mur. On ne
   * « voit » pas à travers les murs en lisant les messages. Tout près (3 m), on les sent quand même.
   */
  private percoit(h: { x: number; z: number }, e: { x: number; z: number }): boolean {
    const d = Math.hypot(e.x - h.x, e.z - h.z);
    if (d > RAYON_VUE_ETEINTS) return false;
    const m = this.milieu;
    return !m || d <= 3 || m.vue(h.x, h.z, e.x, e.z);
  }

  /** Une ressource a été prise : on l'enregistre et on prévient tous ceux qui sont là. */
  prendre(r: RessourceEnBase, disponibleLe: number): void {
    r.disponibleLe = disponibleLe;
    this.base.sauverRessourceLieu(this.definition.cle, r.id, disponibleLe);
    this.diffuser({ t: "ressource", id: r.id, disponible: false });
  }

  tick(instant: number, dt: number): void {
    if (instant - this.derniereRepousse >= INTERVALLE_REPOUSSE) {
      this.derniereRepousse = instant;
      for (const r of this.ressources.values()) {
        if (r.disponibleLe === 0 || r.disponibleLe > instant) continue;
        r.disponibleLe = 0;
        this.base.sauverRessourceLieu(this.definition.cle, r.id, 0);
        this.diffuser({ t: "ressource", id: r.id, disponible: true });
      }
    }

    // Les corps finissent par ne plus compter (en 0a, on ne les enterre pas encore).
    this.eteints = this.eteints.filter((e) => e.etat !== "detruit" || e.corps < DUREE_CORPS);

    // Personne : rien ne bouge, et au bout d'un moment tout se rendort.
    if (this.presents.size === 0) {
      if (this.videDepuis === 0) this.videDepuis = this.calmeDepuis = instant;
      else if (instant - this.calmeDepuis > DELAI_RETOUR_AU_CALME) {
        this.eteints = this.definition.eteints();
        this.calmeDepuis = instant;
      }
      return;
    }
    this.videDepuis = 0;
    // Tout le monde est en pause (un lieu à un seul joueur, sa Coopérative) : les Éteints ne bougent plus.
    if ([...this.presents].every((v) => v.enPause?.() === true)) return;

    const nuit = estNuit(heureDeJeu(instant, this.debutMonde));
    // Les gémissements des Éteints qui se réveillent sont des bruits comme les autres : la cascade (Book 23 §3).
    const gemissements: Stimulus[] = this.eteints
      .filter((e) => (e.gemit ?? 0) > 0)
      .map((e) => ({ genre: "son", x: e.x, z: e.z, portee: GEMISSEMENT.portee, intensite: GEMISSEMENT.intensite }));
    for (const [id, b] of this.bruits) if (b.jusqua <= instant) this.bruits.delete(id);
    const leurres = [...this.bruits.values()].map((b) => b.stimulus);
    const stimuli = [...[...this.presents].flatMap((v) => v.stimuli(nuit)), ...gemissements, ...leurres];
    const humains = [...this.presents].map((v) => v.humain());
    const zone = this.zone;
    const milieu = this.milieu;
    for (const e of this.eteints) {
      if (!this.definition.econome) {
        penser(e, dt, stimuli, humains, this.eteints, nuit, zone, this.alea, milieu);
        continue;
      }
      // 10 Hz ; 2 Hz pour qui dort ou est loin de tout le monde (à plus de 30 m).
      const lent = e.etat === "dormant" || humains.every((h) => Math.hypot(h.x - e.x, h.z - e.z) > 30);
      const cumul = (this.attente.get(e.id) ?? 0) + dt;
      if (cumul < (lent ? 0.5 : 0.1)) {
        this.attente.set(e.id, cumul);
        continue;
      }
      this.attente.set(e.id, 0);
      penser(e, cumul, stimuli, humains, this.eteints, nuit, zone, this.alea, milieu);
    }

    if (instant - this.dernierEnvoi >= INTERVALLE_ETEINTS) {
      this.dernierEnvoi = instant;
      // Chacun reçoit les Éteints autour de lui ; rien s'il n'y en a toujours aucun.
      for (const v of this.presents) {
        const h = v.humain();
        const proches = this.eteints.filter((e) => this.percoit(h, e)).map(vue);
        if (proches.length === 0 && this.aucunEnvoye.has(v)) continue;
        if (proches.length === 0) this.aucunEnvoye.add(v);
        else this.aucunEnvoye.delete(v);
        v.envoyer({ t: "eteints", eteints: proches });
      }
    }
  }

  diffuser(m: MessageServeur): void {
    for (const v of this.presents) v.envoyer(m);
  }
}
