// Un lieu vivant (Book 23 §7) : des ressources, des Éteints, des sacs tombés, les joueurs présents, et l'envoi filtré
// de ce que chacun voit. La station-service en est un, partagé par tous les voyageurs (Book 01 §2 bis) ; chaque joueur a
// sa Coopérative (Book 23), un lieu vivant à lui. Le jour où on la partage, on ne change que la clé.
//
// ---------- Le butin d'un lieu (plan 0.8, chantier 10) : à lire par les chantiers 11 (le gué) et 12 (le Moulin) ----------
//
// La définition d'un lieu porte un `butin` (ButinLieu, commun/src/terrain.ts), qui règle trois choses :
//
// 1. **La repousse par lieu** (B4) : `butin.repousse[type]` (ms, ou null : jamais) remplace REPOUSSE_MS pour ce lieu.
//    REPOUSSE_MS est le délai du terrain : les bûches et les pierres n'y reviennent jamais (B1) ; une halte les fait
//    revenir en 30 min (`{ buche: 30 * 60_000, pierre: 30 * 60_000 }`). Le réglage `repousse_rythme` s'applique partout.
//    La repousse ne se calcule que quand quelqu'un est là : une halte vide ne coûte rien (rien ne tourne, rien ne
//    s'écrit) ; la disponibilité d'une ressource se lit à l'instant (son `disponibleLe`), dès l'entrée.
//
// 2. **Le butin personnel** (R4 du game designer) : `butin.personnel[type] = n` fait de chaque point de ce type un butin
//    à chacun : chaque joueur le voit plein, le prend pour lui, et il revient pour lui à son délai, sans que les autres
//    voient rien bouger. `n` est le nombre de prises (1 : la pièce de famille, la caisse de l'atelier ; 10 : le tas de
//    bois, une bûche par prise ; 8 : le banc de galets du gué). `n` et le délai se lisent à chaque usage : un getter
//    peut les lier à un réglage à chaud (le tas de bois de la station, `tas_bois_buches`, `tas_bois_retour_h`). Le délai court à partir de la première prise ; au bout, tout est revenu.
//    L'état de chacun est gardé en base (instance « perso:<clé du lieu>:<compte> »), avec la version du lieu.
//    Le filtre par famille (la pièce de famille : un Voltaïque ne voit pas l'enclume) est celui de `ressourceVisible`
//    (FAMILLE_DE_RESSOURCE, commun/src/terrain.ts), comme l'if du fond du bois : il vaut partout, sur le serveur et
//    dans le simulateur.
//
// 3. **Le vrac qui grandit avec les voyageurs** (B8) : `butin.vrac[type] = base` dit combien de points de ce type sont
//    en jeu pour un voyageur seul ; le générateur du lieu en pose VRAC_MAX (3) fois plus, et seuls les premiers (par
//    identifiant) sont en jeu : `vracEnJeu(base, présents)`, soit +50 % par voyageur en plus, jusqu'à ×3 (3 voyageurs :
//    ×2 ; 5 : ×3). Un point hors jeu est vu « indisponible » ; quand le nombre de présents change, les points qui
//    entrent en jeu ou en sortent sont annoncés à tous (au tic suivant).
//
// L'API, côté joueur (serveur/src/joueur.ts s'en sert pour tout lieu vivant) :
//
// - `vuePour(compteId, famille, instant)` : les ressources telles que ce joueur les voit (bienvenue) ;
// - `disponiblePour(r, compteId, instant)` : ce joueur peut-il la prendre maintenant ?
// - `prendrePar(r, compteId, instant)` : il la prend (le délai, l'écriture en base, les messages : à lui seul pour un
//   butin personnel, à tous sinon) ;
// - `delaiRepousse(type)` : le délai de ce lieu pour ce type (ms ; null : jamais).
//
// 4. **Le semis** (plan 0.9, M5 et M7 : commun/src/semis.ts, semis-lieux.ts) : `semis.tournee(id)` range le vrac par
//    tournée (la première en jeu d'abord), et `semis.ailleurs(...)` donne la nouvelle place d'un point qu'on prend : il
//    y est déplacé aussitôt (on ne le voit plus) et y reparaît à son délai ; le message du retour porte sa place (x, z).
//
// Exemple, le gué (chantier 11) : `butin: { repousse: { pierre: 30 * 60_000, joncs: 30 * 60_000 }, vrac: { pierre: 15 },
// personnel: { banc_galets: 8 } }`, avec 45 pierres posées par le générateur et REPOUSSE_MS.banc_galets (6 h).
// Le Moulin (chantier 12) est à un joueur : il n'a besoin que de `repousse` (et de son retour à 24 h, comme la
// Coopérative, serveur/src/cooperative.ts : `reinitialiser`).

import { FilDesBruits, PORTEES_BRUIT, type BruitVu } from "../../commun/src/bruits.ts";
import { DUREE_CORPS } from "../../commun/src/combat.ts";
import { CREVAISON, GEMISSEMENT, noyesQuiCrevent, odeurDeCrevaison, penser, vue, type Eteint, type Humain, type Milieu } from "../../commun/src/eteints.ts";
import type { Position } from "../../commun/src/deplacement.ts";
import type { Zone } from "../../commun/src/lieux.ts";
import type { Cible, MessageServeur, SacVu } from "../../commun/src/messages.ts";
import type { Inventaire, TypeObjet } from "../../commun/src/objets.ts";
import type { Stimulus } from "../../commun/src/signature.ts";
import { REGLAGES } from "../../commun/src/reglages.ts";
import type { Famille } from "../../commun/src/regles.ts";
import type { SemisVivant } from "../../commun/src/semis.ts";
import { REPOUSSE_MS, ressourceVisible, vracEnJeu, type ButinLieu, type RessourceSol, type TypeRessource } from "../../commun/src/terrain.ts";
import { estNuit, heureDeJeu } from "../../commun/src/temps.ts";
import { obstaclesVue, passageSon, voit, type ObstaclesVue, type PlanVue } from "../../commun/src/vue.ts";
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
   * Ce qui arrête la vue (0.7.2, commun/src/vue.ts) : un joueur ne reçoit que ce qu'il voit (Éteints, autres joueurs,
   * coups, projectiles) ; ce qu'il entend sans le voir lui arrive en « bruits ». Sans : tout est à ciel ouvert.
   */
  plan?: PlanVue;
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
  /** La repousse du lieu, son butin personnel, son vrac qui grandit (plan 0.8, chantier 10 : voir en tête du fichier). */
  butin?: ButinLieu;
  /** Le semis au hasard (plan 0.9, M5 et M7) : les tournées du vrac, et un point pris qui revient ailleurs. */
  semis?: SemisVivant;
}

/** Une ressource prise qui ne revient jamais. */
export const JAMAIS = Number.MAX_SAFE_INTEGER;

/** Ce qui reste à un joueur d'un butin personnel : combien de prises, et quand tout revient (0 : jamais entamé). */
interface EtatPersonnel {
  reste: number;
  revientLe: number;
}

/** Un joueur présent dans le lieu, vu par lui. */
export interface Voyageur {
  envoyer(m: MessageServeur): void;
  stimuli(nuit: boolean): Stimulus[];
  humain(): Humain;
  /** En pause : le lieu (s'il est à lui seul) ne bouge plus. */
  enPause?(): boolean;
  /** Un Noyé vient de crever tout près (0.10) : ses fluides l'éclaboussent (la nausée). */
  eclabousser?(instant: number): void;
}

/**
 * Ce qu'un joueur prête à un lieu pour ses gestes propres (0.10, le registre des lieux : `geste` et `accompagner`, plus
 * bas) : rien que des accès, aucune règle. Les chantiers des lieux y ajoutent ce dont ils ont besoin (serveur/src/joueur.ts,
 * `contexteLieu`).
 */
export interface ContexteLieu {
  readonly id: number;
  maintenant(): number;
  position(): Position;
  deplacer(p: Position): void;
  info(texte: string): void;
  envoyer(m: MessageServeur): void;
  inventaire(): Readonly<Inventaire>;
  ajouter(objets: Inventaire): void;
  /** Retire n objets du sac ; false s'il n'y en a pas assez (rien n'est retiré). */
  retirer(objet: TypeObjet, n: number): boolean;
  /** Un geste qui dure (il s'arrête si l'on bouge, si l'on frappe, ou d'un second appui). */
  commencer(libelle: string, dureeS: number, appliquer: () => void): void;
  annuler(): void;
}

/** On voit les Éteints de la halte jusqu'à cette distance (la caméra en montre ≈ 30 m ; un peu de marge). */
const RAYON_VUE_ETEINTS = 45;
/** Un Éteint à moins de 3 m derrière un mur se « sent » (onde rouge, souffle), une fois toutes les 1,2 s. */
const RAYON_SENTI = 3;
const RYTHME_SENTI_MS = 1200;
/** Contre une porte fermée (à moins de ce nombre de mètres de son battant), un Éteint qui pousse cogne. */
const CONTRE_LA_PORTE = 0.9;

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
  /** Le fil des bruits des Éteints (ce qu'on entend sans le voir, 0.7.2). */
  private readonly fil = new FilDesBruits();
  /** Pour chaque joueur, quand chaque Éteint tout proche a été « senti » pour la dernière fois. */
  private readonly sentis = new WeakMap<Voyageur, Map<number, number>>();

  // ---------- Les points d'appel des lieux (0.10, le registre des lieux) ----------
  // Un lieu qui a ses propres gestes (brancher la borne, payer le péage, allumer la lanterne…) les prend ici, dans sa
  // classe (sur LieuVivant) : le joueur lui passe la main avant ses gestes à lui, et l'accompagne à chaque tic. Par
  // défaut, un lieu n'a rien en propre.

  /** Un geste propre au lieu : true s'il l'a pris (le joueur n'en fait rien d'autre). */
  geste(_ctx: ContexteLieu, _cible: Cible, _verbe: string): boolean {
    return false;
  }

  /** À chaque tic, pour chaque joueur présent (hors voyage) : ce que le lieu fait de lui (la marée qui monte…). */
  accompagner(_ctx: ContexteLieu, _dt: number): void {}

  /**
   * 0.10, chantier K : ce joueur porte-t-il dans les bras un objet du lieu (l'escabeau du phare ; S-08, S-12) ? On ne court
   * pas, on ne frappe pas.
   */
  dansLesBras(_compteId: number): boolean {
    return false;
  }

  /** 0.10, chantier K : il frappe les bras chargés : ce qu'il portait tombe là où il est. */
  lacher(_ctx: ContexteLieu): void {}

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

  /** Le rang de chaque point de vrac parmi ceux de son type (par identifiant) : les premiers sont en jeu (B8). */
  private readonly rangsVrac = new Map<number, number>();
  /** Combien de points de chaque vrac étaient en jeu au dernier envoi (pour n'annoncer que ce qui change). */
  private readonly vracAnnonce = new Map<TypeRessource, number>();
  /** Le butin personnel de chaque joueur passé ici : compte → point → ce qu'il lui en reste (chargé au premier besoin). */
  private readonly personnels = new Map<number, Map<number, EtatPersonnel>>();

  constructor(base: Base, definition: DefinitionLieuVivant, alea: () => number = Math.random) {
    this.base = base;
    this.definition = definition;
    this.debutMonde = base.debutMonde();
    this.alea = alea;
    this.eteints = definition.eteints();
    this.portes = definition.portes?.initiales() ?? {};
    for (const r of base.chargerRessourcesLieu(definition.cle, definition.ressources, definition.version)) this.ressources.set(r.id, r);
    this.sacs.push(...base.chargerSacs(definition.sacs.lieu, definition.sacs.terrainDe));
    const vrac = definition.butin?.vrac ?? {};
    const rangs = new Map<TypeRessource, number>();
    // Par tournée du semis (plan 0.9), puis par identifiant : la première tournée est en jeu d'abord.
    const tournee = (r: RessourceEnBase) => definition.semis?.tournee(r.id) ?? 0;
    for (const r of [...this.ressources.values()].sort((a, b) => tournee(a) - tournee(b) || a.id - b.id)) {
      if (vrac[r.type] === undefined) continue;
      const k = rangs.get(r.type) ?? 0;
      this.rangsVrac.set(r.id, k);
      rangs.set(r.type, k + 1);
    }
    for (const [type, n] of Object.entries(vrac) as [TypeRessource, number][]) this.vracAnnonce.set(type, vracEnJeu(n, 0));
  }

  // ---------- Le butin (plan 0.8, chantier 10 : voir en tête du fichier) ----------

  /** Le délai de repousse de ce lieu pour ce type (ms, réglage compris) ; null : il ne revient jamais. */
  delaiRepousse(type: TypeRessource): number | null {
    const propre = this.definition.butin?.repousse;
    const ms = propre && type in propre ? propre[type]! : REPOUSSE_MS[type];
    return ms === null ? null : ms / REGLAGES.repousse_rythme;
  }

  /** Combien de prises tient ce butin personnel (undefined : la ressource est partagée). */
  private prisesPersonnelles(type: TypeRessource): number | undefined {
    return this.definition.butin?.personnel?.[type];
  }

  /** Un point de vrac est-il en jeu, avec les voyageurs présents ? (les autres ressources le sont toujours) */
  enJeu(r: RessourceEnBase): boolean {
    const base = this.definition.butin?.vrac?.[r.type];
    if (base === undefined) return true;
    return (this.rangsVrac.get(r.id) ?? 0) < vracEnJeu(base, this.presents.size);
  }

  /** L'état gardé du butin personnel d'un joueur (chargé de la base à la première demande). */
  private personnelDe(compteId: number): Map<number, EtatPersonnel> {
    let m = this.personnels.get(compteId);
    if (m) return m;
    m = new Map();
    const brut = this.base.chargerInstance(`perso:${this.definition.cle}:${compteId}`) as { version?: number; etats?: Record<string, EtatPersonnel> } | null;
    // Le contenu du lieu a changé (une autre version) : ses points aussi ; on repart plein.
    if (brut && brut.version === this.definition.version && brut.etats) {
      for (const [id, e] of Object.entries(brut.etats)) {
        const r = this.ressources.get(Number(id));
        if (r && this.prisesPersonnelles(r.type) !== undefined && Number.isFinite(e?.reste) && Number.isFinite(e?.revientLe)) m.set(r.id, { reste: e.reste, revientLe: e.revientLe });
      }
    }
    this.personnels.set(compteId, m);
    return m;
  }

  /** Ce qui reste à ce joueur d'un butin personnel, à cet instant (plein s'il ne l'a jamais entamé, ou si le délai est passé). */
  private restePersonnel(r: RessourceEnBase, compteId: number, instant: number): number {
    const prises = this.prisesPersonnelles(r.type) ?? 1;
    const e = this.personnelDe(compteId).get(r.id);
    return !e || instant >= e.revientLe ? prises : e.reste;
  }

  /** Ce joueur peut-il prendre cette ressource maintenant ? */
  disponiblePour(r: RessourceEnBase, compteId: number, instant: number): boolean {
    if (this.prisesPersonnelles(r.type) !== undefined) return this.restePersonnel(r, compteId, instant) > 0;
    return this.enJeu(r) && r.disponibleLe <= instant;
  }

  /** Les ressources telles qu'un joueur les voit (à son arrivée) : sa famille, son butin personnel, le vrac en jeu. */
  vuePour(compteId: number, famille: Famille, instant: number): RessourceSol[] {
    const vues: RessourceSol[] = [];
    for (const r of this.ressources.values()) {
      if (!ressourceVisible(r.type, famille)) continue;
      const prises = this.prisesPersonnelles(r.type);
      const vue: RessourceSol = { id: r.id, type: r.type, x: r.x, z: r.z, disponible: this.disponiblePour(r, compteId, instant) };
      if (prises !== undefined && prises > 1) vue.reste = this.restePersonnel(r, compteId, instant);
      vues.push(vue);
    }
    return vues;
  }

  /**
   * Ce joueur prend la ressource. Partagée : elle disparaît pour tous jusqu'à son délai. Personnelle : une prise de moins
   * pour lui seul ; le délai court depuis sa première prise ; les autres ne voient rien bouger.
   */
  prendrePar(r: RessourceEnBase, compteId: number, instant: number): void {
    const delai = this.delaiRepousse(r.type);
    const prises = this.prisesPersonnelles(r.type);
    if (prises === undefined) return this.prendre(r, delai === null ? JAMAIS : instant + delai);
    const etats = this.personnelDe(compteId);
    const avant = etats.get(r.id);
    const e = !avant || instant >= avant.revientLe ? { reste: prises, revientLe: delai === null ? JAMAIS : instant + delai } : { ...avant };
    e.reste = Math.max(0, e.reste - 1);
    etats.set(r.id, e);
    this.sauverPersonnel(compteId, instant);
    const m: MessageServeur = { t: "ressource", id: r.id, disponible: e.reste > 0, ...(prises > 1 ? { reste: e.reste } : {}) };
    for (const v of this.presents) if (v.humain().id === compteId) v.envoyer(m);
  }

  private sauverPersonnel(compteId: number, instant: number): void {
    const etats = this.personnelDe(compteId);
    this.base.sauverInstance(`perso:${this.definition.cle}:${compteId}`, { version: this.definition.version, etats: Object.fromEntries(etats) }, instant);
  }

  /** Le butin personnel revenu pendant qu'on était là : on le dit à son joueur (une fois), et on l'oublie. */
  private rendrePersonnels(instant: number): void {
    for (const v of this.presents) {
      const id = v.humain().id;
      const etats = this.personnels.get(id);
      if (!etats) continue;
      let change = false;
      for (const [rid, e] of etats) {
        if (instant < e.revientLe) continue;
        etats.delete(rid);
        change = true;
        const r = this.ressources.get(rid);
        const prises = r ? this.prisesPersonnelles(r.type) : undefined;
        if (r && prises !== undefined) v.envoyer({ t: "ressource", id: rid, disponible: true, ...(prises > 1 ? { reste: prises } : {}) });
      }
      if (change) this.sauverPersonnel(id, instant);
    }
  }

  /**
   * Tout revient (plan 0.8 §9.1, N1 : la Coopérative et le Moulin, au bout de 24 h) : les Éteints de la définition, les
   * portes à leur état d'origine, le butin (sauf ce qui ne se trouve qu'une fois : JAMAIS), le butin personnel de chacun.
   * À appeler quand personne n'est là (à l'entrée) : rien n'est envoyé.
   */
  reinitialiser(): void {
    this.eteints = this.definition.eteints();
    Object.assign(this.portes, this.definition.portes?.initiales() ?? {});
    for (const r of this.ressources.values()) {
      if (r.disponibleLe === 0 || r.disponibleLe === JAMAIS) continue;
      r.disponibleLe = 0;
      this.base.sauverRessourceLieu(this.definition.cle, r.id, 0);
    }
    for (const id of this.personnels.keys()) {
      this.personnels.set(id, new Map());
      this.base.sauverInstance(`perso:${this.definition.cle}:${id}`, { version: this.definition.version, etats: {} }, 0);
    }
  }

  /** Le nombre de présents a changé : les points de vrac qui entrent en jeu ou en sortent sont annoncés à tous. */
  private annoncerVrac(instant: number): void {
    const vrac = this.definition.butin?.vrac;
    if (!vrac) return;
    for (const [type, base] of Object.entries(vrac) as [TypeRessource, number][]) {
      const avant = this.vracAnnonce.get(type) ?? 0;
      const maintenant = vracEnJeu(base, this.presents.size);
      if (avant === maintenant) continue;
      this.vracAnnonce.set(type, maintenant);
      const [de, a] = avant < maintenant ? [avant, maintenant] : [maintenant, avant];
      for (const r of this.ressources.values()) {
        if (r.type !== type) continue;
        const rang = this.rangsVrac.get(r.id) ?? 0;
        if (rang < de || rang >= a) continue;
        this.diffuser(this.messageRessource(r, this.enJeu(r) && r.disponibleLe <= instant));
      }
    }
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

  /** Ce qui arrête la vue, pour l'état actuel des portes (null : lieu à ciel ouvert). */
  get obstacles(): ObstaclesVue | null {
    return this.definition.plan ? obstaclesVue(this.definition.plan, this.portes) : null;
  }

  /** La vue passe-t-elle de a à b ? (les mêmes murs pour le serveur, les Éteints et l'écran) */
  voitEntre(a: { x: number; z: number }, b: { x: number; z: number }): boolean {
    const ov = this.obstacles;
    return !ov || voit(ov, a.x, a.z, b.x, b.z);
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
    // Ce qu'on voit par la porte qui s'ouvre part tout de suite (au prochain tic), sans attendre l'envoi suivant.
    this.dernierEnvoi = 0;
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
    const ov = this.obstacles;
    return autour ? this.eteints.filter((e) => this.percoit(autour, e, ov)).map(vue) : this.eteints.map(vue);
  }

  /**
   * Un joueur ne reçoit que les Éteints qu'il voit (Book 23 §7 ; 0.7.2) : à portée, et en ligne droite, sans mur ni
   * porte fermée entre eux (commun/src/vue.ts). On ne « voit » pas à travers les murs en lisant les messages. Tout près
   * derrière un mur (3 m), on le sent : c'est un bruit (« presence »), sans sa position.
   */
  private percoit(h: { x: number; z: number }, e: { x: number; z: number }, ov = this.obstacles): boolean {
    const d = Math.hypot(e.x - h.x, e.z - h.z);
    if (d > RAYON_VUE_ETEINTS) return false;
    return !ov || voit(ov, h.x, h.z, e.x, e.z);
  }

  /** Envoie un message seulement à ceux qui voient l'un de ces points (un coup, un projectile : 0.7.2). */
  diffuserVu(m: MessageServeur, points: readonly { x: number; z: number }[]): void {
    const ov = this.obstacles;
    for (const v of this.presents) {
      const h = v.humain();
      if (!ov || points.some((p) => Math.hypot(p.x - h.x, p.z - h.z) <= RAYON_VUE_ETEINTS && voit(ov, h.x, h.z, p.x, p.z))) v.envoyer(m);
    }
  }

  /** La porte fermée contre laquelle se tient ce point (un Éteint qui la pousse), ou null. */
  private porteContre(x: number, z: number): string | null {
    for (const p of this.definition.plan?.portes ?? []) {
      if (p.toujoursOuverte || this.portes[p.id] !== false) continue;
      const le = p.sens === "x" ? Math.abs(x - p.x) - p.largeur / 2 : Math.abs(z - p.z) - p.largeur / 2;
      const travers = p.sens === "x" ? Math.abs(z - p.z) : Math.abs(x - p.x);
      if (le < 0.2 && travers < CONTRE_LA_PORTE) return p.id;
    }
    return null;
  }

  /**
   * Ce que chacun entend sans le voir (0.7.2, bruits.ts) : les bruits des Éteints cachés, étouffés par les murs et les
   * portes, au point de passage de son côté ; et ceux qu'il sent, tout près derrière un mur.
   */
  private envoyerBruits(instant: number, dt: number, ov: ObstaclesVue): void {
    const plan = this.definition.plan!;
    const milieu = this.milieu;
    const humains = [...this.presents].map((v) => v.humain());
    // Seulement les Éteints que quelqu'un peut entendre.
    const proches = this.eteints.filter((e) => e.etat !== "detruit" && humains.some((h) => Math.hypot(h.x - e.x, h.z - e.z) <= 32));
    const emis = this.fil.ecouter(proches, dt, this.alea, (x, z) => this.porteContre(x, z));
    for (const v of this.presents) {
      const h = v.humain();
      const liste: BruitVu[] = [];
      const ajouter = (g: BruitVu["g"], f: number, source: { x: number; z: number }, porte?: string) => {
        let point: { x: number; z: number };
        const p = porte ? plan.portes.find((q) => q.id === porte) : undefined;
        if (p) {
          // Le battant qu'on pousse, de notre côté.
          const cote = p.sens === "x" ? Math.sign(h.z - p.z) || 1 : Math.sign(h.x - p.x) || 1;
          point = p.sens === "x" ? { x: p.x, z: p.z + cote * 0.45 } : { x: p.x + cote * 0.45, z: p.z };
        } else point = passageSon(plan, this.portes, h, source);
        liste.push({ g, f: Math.round(f * 100) / 100, x: Math.round(point.x * 100) / 100, z: Math.round(point.z * 100) / 100, ...(porte ? { porte } : {}) });
      };
      for (const b of emis) {
        const d = Math.hypot(b.x - h.x, b.z - h.z);
        if (d > PORTEES_BRUIT[b.g] || voit(ov, h.x, h.z, b.x, b.z)) continue;
        const portee = PORTEES_BRUIT[b.g] * (milieu ? milieu.son(b.x, b.z, h.x, h.z) : 1);
        if (d >= portee) continue;
        ajouter(b.g, 1 - d / portee, b, b.porte);
      }
      // Tout près, derrière le mur : on le sent.
      let sentis = this.sentis.get(v);
      if (!sentis) this.sentis.set(v, (sentis = new Map()));
      for (const e of proches) {
        const d = Math.hypot(e.x - h.x, e.z - h.z);
        if (d > RAYON_SENTI || voit(ov, h.x, h.z, e.x, e.z) || instant - (sentis.get(e.id) ?? 0) < RYTHME_SENTI_MS) continue;
        sentis.set(e.id, instant);
        ajouter("presence", 1 - d / RAYON_SENTI, e);
      }
      if (liste.length > 0) v.envoyer({ t: "bruits", bruits: liste });
    }
  }

  /**
   * Une ressource a été prise : on l'enregistre et on prévient tous ceux qui sont là. Semée au hasard (plan 0.9), elle
   * part aussitôt à sa nouvelle place, où elle reparaîtra.
   */
  prendre(r: RessourceEnBase, disponibleLe: number): void {
    r.disponibleLe = disponibleLe;
    this.base.sauverRessourceLieu(this.definition.cle, r.id, disponibleLe);
    this.diffuser({ t: "ressource", id: r.id, disponible: false });
    const ailleurs = this.definition.semis?.ailleurs(r, this.alea, this.ressources.values());
    if (!ailleurs) return;
    r.x = ailleurs.x;
    r.z = ailleurs.z;
    this.base.deplacerRessourceLieu(this.definition.cle, r.id, r.x, r.z);
  }

  /** Le message d'une ressource qui paraît ou disparaît ; dans un lieu semé, avec sa place (elle a pu changer). */
  private messageRessource(r: RessourceEnBase, disponible: boolean): MessageServeur {
    return { t: "ressource", id: r.id, disponible, ...(disponible && this.definition.semis ? { x: r.x, z: r.z } : {}) };
  }

  tick(instant: number, dt: number): void {
    // La repousse ne se calcule que si quelqu'un est là (plan 0.8 §6 : une halte vide ne coûte rien) ; la disponibilité
    // se lit de toute façon à l'instant (disponibleLe), dès l'entrée.
    if (this.presents.size > 0) {
      this.annoncerVrac(instant);
      if (instant - this.derniereRepousse >= INTERVALLE_REPOUSSE) {
        this.derniereRepousse = instant;
        for (const r of this.ressources.values()) {
          if (r.disponibleLe === 0 || r.disponibleLe > instant) continue;
          r.disponibleLe = 0;
          this.base.sauverRessourceLieu(this.definition.cle, r.id, 0);
          // Un butin devenu personnel (la caisse de l'atelier, 0.8.2) qu'une partie d'avant avait pris en commun : son
          // délai partagé s'efface sans rien annoncer ; chacun le voit selon son propre état.
          if (this.prisesPersonnelles(r.type) !== undefined) continue;
          // Un point de vrac hors jeu revient sans se montrer : il paraîtra quand les voyageurs seront assez nombreux.
          if (this.enJeu(r)) this.diffuser(this.messageRessource(r, true));
        }
        this.rendrePersonnels(instant);
      }
    }

    // Les corps finissent par ne plus compter (en 0a, on ne les enterre pas encore).
    this.eteints = this.eteints.filter((e) => e.etat !== "detruit" || e.corps < DUREE_CORPS);
    this.crever(instant);

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
      const dtEnvoi = this.dernierEnvoi === 0 ? INTERVALLE_ETEINTS / 1000 : Math.min(0.5, (instant - this.dernierEnvoi) / 1000);
      this.dernierEnvoi = instant;
      const ov = this.obstacles;
      if (ov) this.envoyerBruits(instant, dtEnvoi, ov);
      // Chacun reçoit les Éteints qu'il voit ; rien s'il n'y en a toujours aucun.
      for (const v of this.presents) {
        const h = v.humain();
        const proches = this.eteints.filter((e) => this.percoit(h, e, ov)).map(vue);
        if (proches.length === 0 && this.aucunEnvoye.has(v)) continue;
        if (proches.length === 0) this.aucunEnvoye.add(v);
        else this.aucunEnvoye.delete(v);
        v.envoyer({ t: "eteints", eteints: proches });
      }
    }
  }

  // ---------- Le Noyé crève (0.10, chantier G ; S-32) ----------

  /**
   * Un Noyé détruit, par un coup, un tir, un piège ou autre chose : il crève. Ceux qui sont à moins de 1,5 m reçoivent
   * ses fluides ; son odeur reste une minute au point de sa mort. Le client le voit se dégonfler (rendu/eteint.ts).
   */
  private crever(instant: number): void {
    for (const e of noyesQuiCrevent(this.eteints)) {
      this.ajouterBruit(`noye:${e.id}`, odeurDeCrevaison(e), instant + CREVAISON.odeurMs);
      for (const v of this.presents) {
        const h = v.humain();
        if (Math.hypot(h.x - e.x, h.z - e.z) < CREVAISON.rayon) v.eclabousser?.(instant);
      }
    }
  }

  diffuser(m: MessageServeur): void {
    for (const v of this.presents) v.envoyer(m);
  }
}
