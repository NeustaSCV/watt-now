// Un lieu vivant (Book 23 §7) : des ressources, des Éteints, des sacs tombés, les joueurs présents, et l'envoi filtré
// de ce que chacun voit. La station-service en est un, partagé par tous les voyageurs (Book 01 §2 bis) ; chaque joueur a
// sa Coopérative (Book 23), un lieu vivant à lui. Le jour où on la partage, on ne change que la clé.

import { DUREE_CORPS } from "../../commun/src/combat.ts";
import { penser, vue, type Eteint, type Humain } from "../../commun/src/eteints.ts";
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
  /** Depuis quand personne n'est là (0 : quelqu'un est là). */
  private videDepuis = 0;
  /** Dernier retour au calme des Éteints, pendant que le lieu est vide. */
  private calmeDepuis = 0;
  private readonly base: Base;
  private readonly debutMonde: number;
  private readonly alea: () => number;
  readonly definition: DefinitionLieuVivant;

  constructor(base: Base, definition: DefinitionLieuVivant, alea: () => number = Math.random) {
    this.base = base;
    this.definition = definition;
    this.debutMonde = base.debutMonde();
    this.alea = alea;
    this.eteints = definition.eteints();
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

  /** Un lieu à un seul joueur, vide depuis longtemps, peut être déchargé de la mémoire. */
  videDepuisPlusDe(instant: number, ms: number): boolean {
    return this.presents.size === 0 && this.videDepuis > 0 && instant - this.videDepuis > ms;
  }

  /**
   * Les Éteints qu'un joueur voit : ceux à moins de RAYON_VUE_ETEINTS mètres (la halte fait 200 m ; on n'envoie
   * pas ceux de l'autre bout, 2026-10-08). Sans position : tous.
   */
  eteintsVus(autour?: { x: number; z: number }) {
    const vues = this.eteints.map(vue);
    return autour ? vues.filter((e) => Math.hypot(e.x - autour.x, e.z - autour.z) <= RAYON_VUE_ETEINTS) : vues;
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

    const nuit = estNuit(heureDeJeu(instant, this.debutMonde));
    const stimuli = [...this.presents].flatMap((v) => v.stimuli(nuit));
    const humains = [...this.presents].map((v) => v.humain());
    for (const e of this.eteints) penser(e, dt, stimuli, humains, this.eteints, nuit, this.definition.zone, this.alea);

    if (instant - this.dernierEnvoi >= INTERVALLE_ETEINTS) {
      this.dernierEnvoi = instant;
      // Chacun reçoit les Éteints autour de lui ; rien s'il n'y en a toujours aucun.
      const vues = this.eteints.map(vue);
      for (const v of this.presents) {
        const h = v.humain();
        const proches = vues.filter((e) => Math.hypot(e.x - h.x, e.z - h.z) <= RAYON_VUE_ETEINTS);
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
