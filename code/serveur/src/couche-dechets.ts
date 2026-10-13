// La couche de déchets côté serveur (0.7, chantier 2) : ramasser une pièce d'un amas, fouiller un conteneur (une liste
// au choix, comme à la décharge), démonter un point du monde (le vélo du fossé, le trampoline…), le renouvellement des
// carreaux, l'effacement des ordures jetées, les balises solaires qui attirent les Éteints la nuit.
//
// Ce que le serveur garde (table `dechets`) : par carreau entamé, son numéro de remplissage, les pièces prises et
// l'instant où il se remplira ; par point, son cycle, ce qui en a été pris et son retour. Le contenu se recalcule
// d'une graine (commun/src/couche-dechets.ts). Rien ne tourne en continu : on regarde l'heure quand quelqu'un est là,
// au plus toutes les 5 secondes par lieu.

import { outilsManquantsBref } from "../../commun/src/aide-fabrication.ts";
import {
  POINTS_LIEUX,
  cleCarreau,
  cleCouche,
  contenuPointCycle,
  delaiPoint,
  dispositionLieu,
  lireRef,
  lieuDeCle,
  nomConteneur,
  piecesCarreau,
  placePoint,
  seFouille,
  type FouilleVue,
  type OperationDechets,
  type PieceDechets,
  type PointDechetsVu,
  type PointLieu,
  type VueDechets,
} from "../../commun/src/couche-dechets.ts";
import { POINTS_DECHETS, delaiRenouvellement, graineCarreau, tasAEffacer, DUREE_ORDURE_JETEE_MS } from "../../commun/src/dechets.ts";
import type { LieuJouable } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { OBJETS, capaciteDe, nommer, poidsInventaire, type Inventaire, type TypeObjet } from "../../commun/src/objets.ts";
import { multiplicateurQualites, niveauQualite, type Qualite } from "../../commun/src/recettes.ts";
import { REGLAGES } from "../../commun/src/reglages.ts";
import type { BruitAction, Stimulus } from "../../commun/src/signature.ts";
import { DISTANCE_INTERACTION } from "../../commun/src/terrain.ts";
import { estNuit, heureDeJeu } from "../../commun/src/temps.ts";
import type { Base } from "./base.ts";
import type { LieuVivant } from "./lieu-vivant.ts";

/** On regarde le renouvellement, les balises et les ordures au plus toutes les 5 s par lieu. */
const INTERVALLE_VERIF = 5000;
/** Les ordures jetées sont regardées une fois par minute dans un lieu où quelqu'un est là. */
const INTERVALLE_PURGE = 60_000;
/** La lumière d'une balise solaire, la nuit : faible et proche (Q12). Bien moins qu'un feu (45 m, 0,3). */
export const BALISE_LUMIERE_NUIT = { portee: 12, intensite: 0.06 } as const;
/** Ramasser une pièce : une seconde (§4.2). */
export const DUREE_RAMASSER_S = 1;
/** Un conteneur ouvert se referme quand on s'en éloigne. */
const PORTEE_FOUILLE = 3.2;

/** L'état d'un carreau entamé, ou d'un point : son remplissage (son cycle), ce qui a été pris, et son retour. */
interface EtatCase {
  r: number;
  pris: number[];
  /** Instant réel où il se remplit à nouveau (0 : rien de prévu). */
  renouvLe: number;
}

const NEUF = (): EtatCase => ({ r: 0, pris: [], renouvLe: 0 });

/** La couche d'un lieu, partagée par tous ceux qui y sont. */
export class CoucheLieu {
  readonly cle: string;
  readonly lieu: LieuJouable;
  readonly carreaux = new Map<string, EtatCase>();
  readonly points = new Map<string, EtatCase>();
  derniereVerif = 0;
  dernierePurge = 0;
  /** Les pièces calculées, par carreau et par remplissage. */
  private readonly cache = new Map<string, { r: number; pieces: PieceDechets[] }>();
  /** Les balises solaires encore au sol (null : à recalculer). */
  private balisesCache: { id: string; x: number; z: number }[] | null = null;

  constructor(cle: string, lignes: { carreau: string; remplissage: number; pris: number[]; renouveleLe: number }[]) {
    this.cle = cle;
    this.lieu = lieuDeCle(cle);
    for (const l of lignes) {
      const e: EtatCase = { r: l.remplissage, pris: l.pris, renouvLe: l.renouveleLe };
      if (l.carreau.startsWith("p:")) this.points.set(l.carreau.slice(2), e);
      else this.carreaux.set(l.carreau, e);
    }
  }

  /** Le terrain personnel ne se renouvelle pas (Q4). */
  get renouvelable(): boolean {
    return this.lieu !== "terrain";
  }

  carreau(cx: number, cz: number): EtatCase {
    return this.carreaux.get(cleCarreau(cx, cz)) ?? NEUF();
  }

  point(id: string): EtatCase {
    return this.points.get(id) ?? NEUF();
  }

  pieces(cx: number, cz: number): PieceDechets[] {
    const k = cleCarreau(cx, cz);
    const r = this.carreau(cx, cz).r;
    const deja = this.cache.get(k);
    if (deja && deja.r === r) return deja.pieces;
    const pieces = piecesCarreau(this.cle, cx, cz, r);
    this.cache.set(k, { r, pieces });
    return pieces;
  }

  definitionPoint(id: string): PointLieu | undefined {
    return POINTS_LIEUX[this.lieu]?.find((p) => p.id === id);
  }

  vuePoint(p: PointLieu): PointDechetsVu {
    const e = this.point(p.id);
    const { x, z } = placePoint(this.cle, p, e.r);
    const vu: PointDechetsVu = { id: p.id, type: p.type, x, z, o: p.o, dispo: true };
    if (seFouille(p.type)) {
      const reste = contenuPointCycle(this.cle, p, e.r).length - e.pris.length;
      vu.reste = Math.max(0, reste);
      vu.dispo = reste > 0;
    } else vu.dispo = e.renouvLe === 0;
    return vu;
  }

  vue(): VueDechets {
    return {
      cle: this.cle,
      carreaux: [...this.carreaux].filter(([, e]) => e.r > 0 || e.pris.length > 0).map(([k, e]) => {
        const [cx, cz] = k.split(",").map(Number) as [number, number];
        return [cx, cz, e.r, [...e.pris]];
      }),
      points: (POINTS_LIEUX[this.lieu] ?? []).map((p) => this.vuePoint(p)),
    };
  }

  /** Les balises solaires encore au sol dans ce lieu (pour leur lumière, la nuit). */
  balises(): { id: string; x: number; z: number }[] {
    if (this.balisesCache) return this.balisesCache;
    const liste: { id: string; x: number; z: number }[] = [];
    for (const k of dispositionLieu(this.cle).keys()) {
      const [cx, cz] = k.split(",").map(Number) as [number, number];
      const pris = this.carreau(cx, cz).pris;
      for (const p of this.pieces(cx, cz)) if (p.objet === "balise_solaire" && !p.dedans && !pris.includes(p.i)) liste.push({ id: `balise:${cx}:${cz}:${p.i}`, x: p.x, z: p.z });
    }
    return (this.balisesCache = liste);
  }

  oublierBalises(): void {
    this.balisesCache = null;
  }
}

/** Ce qui reçoit les changements d'une couche : un joueur, tant qu'il est dans ce lieu. */
interface Abonne {
  cle(): string | null;
  envoyer(m: MessageServeur): void;
}

/** Les couches de tous les lieux d'un serveur (une par base : chaque test a la sienne). */
export class RegistreDechets {
  readonly base: Base;
  readonly debutMonde: number;
  private readonly couches = new Map<string, CoucheLieu>();
  readonly abonnes = new Set<Abonne>();

  constructor(base: Base, instant: number) {
    this.base = base;
    this.debutMonde = base.debutMonde();
    // Au démarrage : les ordures jetées depuis plus de 24 h hors des terrains, même dans un lieu que personne n'a revu.
    base.purgerSacsHorsTerrain(instant - DUREE_ORDURE_JETEE_MS, (c, creeLe) => c.jete === true && tasAEffacer(c.inventaire, creeLe, instant, false));
  }

  couche(cle: string): CoucheLieu {
    let c = this.couches.get(cle);
    if (!c) {
      c = new CoucheLieu(cle, this.base.chargerDechets(cle));
      this.couches.set(cle, c);
    }
    return c;
  }

  diffuser(cle: string, m: MessageServeur): void {
    for (const a of this.abonnes) if (a.cle() === cle) a.envoyer(m);
  }

  sauverCarreau(c: CoucheLieu, cx: number, cz: number, e: EtatCase): void {
    c.carreaux.set(cleCarreau(cx, cz), e);
    this.base.sauverDechets(c.cle, cleCarreau(cx, cz), e.r, e.pris, e.renouvLe);
    c.oublierBalises();
  }

  sauverPoint(c: CoucheLieu, id: string, e: EtatCase): void {
    c.points.set(id, e);
    this.base.sauverDechets(c.cle, `p:${id}`, e.r, e.pris, e.renouvLe);
  }

  /** Ce qui est revenu depuis la dernière fois : un carreau se remplit (tirage neuf), un point revient. */
  renouveler(c: CoucheLieu, instant: number): void {
    if (!c.renouvelable) return;
    for (const [k, e] of c.carreaux) {
      if (e.renouvLe === 0 || e.renouvLe > instant) continue;
      const [cx, cz] = k.split(",").map(Number) as [number, number];
      const neuf = { r: e.r + 1, pris: [], renouvLe: 0 };
      this.sauverCarreau(c, cx, cz, neuf);
      this.diffuser(c.cle, { t: "dechets_carreau", cx, cz, r: neuf.r, pris: [] });
    }
    for (const [id, e] of c.points) {
      const p = c.definitionPoint(id);
      if (!p || e.renouvLe === 0 || e.renouvLe > instant) continue;
      this.sauverPoint(c, id, { r: e.r + 1, pris: [], renouvLe: 0 });
      this.diffuser(c.cle, { t: "dechets_point", point: c.vuePoint(p) });
    }
  }
}

const REGISTRES = new WeakMap<Base, RegistreDechets>();

/** Le registre des couches de déchets d'une base (créé à la première demande). */
export function registreDechets(base: Base, instant = Date.now()): RegistreDechets {
  let r = REGISTRES.get(base);
  if (!r) {
    r = new RegistreDechets(base, instant);
    REGISTRES.set(base, r);
  }
  return r;
}

/** Ce que la couche de déchets demande au joueur (serveur/src/joueur.ts). */
export interface ContexteDechets {
  readonly id: number;
  readonly base: Base;
  maintenant(): number;
  /** Le lieu où il est ; null en route. */
  lieu(): LieuJouable | null;
  position(): { x: number; z: number };
  inventaire(): Inventaire;
  litresGourde(): number;
  ajouter(objets: Inventaire): void;
  commencer(libelle: string, dureeS: number, appliquer: () => void, bruit: BruitAction): void;
  info(texte: string): void;
  envoyer(m: MessageServeur): void;
  /** Le sac est trop lourd : `vise`, ce qu'on voulait prendre (son poids est dit, 0.8.2). */
  sacTropLourd(vise?: Inventaire): void;
  /** Le lieu vivant (la halte, sa Coopérative) : ses Éteints voient les balises, ses ordures jetées s'effacent. */
  vivant(): LieuVivant | null;
  noterFait(fait: string): void;
  /** « Il te manque… » ne nomme pas une recette encore cachée (l'arbre de progression) ; absent : toutes se citent. */
  recetteVisible?(id: string): boolean;
}

/** La couche de déchets vue par un joueur : ses gestes, et ce qu'il reçoit. */
export class CoucheDechets {
  private readonly ctx: ContexteDechets;
  private readonly registre: RegistreDechets;
  /** Le conteneur ouvert (sa liste est à l'écran) : où, et à quel remplissage. */
  private fouille: { cle: string; ref: string; r: number; x: number; z: number } | null = null;
  private derniereVerif = 0;
  private readonly abonne: Abonne;

  constructor(ctx: ContexteDechets) {
    this.ctx = ctx;
    this.registre = registreDechets(ctx.base, ctx.maintenant());
    this.abonne = { cle: () => this.cle(), envoyer: (m) => ctx.envoyer(m) };
    this.registre.abonnes.add(this.abonne);
  }

  /** La clé de la couche du lieu où l'on est (null en route). */
  private cle(): string | null {
    const l = this.ctx.lieu();
    return l ? cleCouche(l, this.ctx.id) : null;
  }

  private couche(): CoucheLieu | null {
    const cle = this.cle();
    return cle ? this.registre.couche(cle) : null;
  }

  /** Ce que le client reçoit à l'entrée dans un lieu (dans `bienvenue`). */
  vue(): VueDechets | undefined {
    const c = this.couche();
    if (!c) return undefined;
    this.fouille = null;
    this.registre.renouveler(c, this.ctx.maintenant());
    return c.vue();
  }

  /** Le joueur se déconnecte : il ne reçoit plus rien. */
  partir(): void {
    this.registre.abonnes.delete(this.abonne);
  }

  private proche(x: number, z: number, d: number): boolean {
    const p = this.ctx.position();
    return Math.hypot(p.x - x, p.z - z) <= d;
  }

  /** Le sac peut-il prendre ça en plus ? */
  private peutPorter(objets: Inventaire): boolean {
    const inv = this.ctx.inventaire();
    const apres: Inventaire = { ...inv };
    for (const [t, n] of Object.entries(objets) as [TypeObjet, number][]) apres[t] = (apres[t] ?? 0) + n;
    return poidsInventaire(apres, this.ctx.litresGourde()) <= capaciteDe(apres) + 1e-9;
  }

  recevoir(op: OperationDechets): void {
    switch (op.genre) {
      case "ramasser":
        return this.ramasser(op.cx, op.cz, op.i);
      case "fouiller":
        return this.fouiller(op.ref);
      case "prendre":
        return this.prendre(op.ref, op.i);
      case "demonter":
        return this.demonter(op.ref);
      case "fermer":
        this.fouille = null;
        return;
    }
  }

  /** Ramasser une pièce d'un amas : une seconde, et elle est dans le sac. */
  private ramasser(cx: number, cz: number, i: number): void {
    const c = this.couche();
    if (!c) return;
    const r = c.carreau(cx, cz).r;
    const piece = c.pieces(cx, cz)[i];
    if (!piece || piece.dedans || c.carreau(cx, cz).pris.includes(i)) return;
    if (!this.proche(piece.x, piece.z, DISTANCE_INTERACTION + 0.3)) return this.ctx.info("C'est trop loin : approche-toi encore un peu.");
    if (!this.peutPorter({ [piece.objet]: 1 })) return this.ctx.sacTropLourd({ [piece.objet]: 1 });
    this.ctx.commencer(`Ramasser : ${OBJETS[piece.objet].nom}`, DUREE_RAMASSER_S / REGLAGES.gestes_vitesse, () => {
      const e = c.carreau(cx, cz);
      if (this.cle() !== c.cle || e.r !== r || e.pris.includes(i)) return;
      if (!this.peutPorter({ [piece.objet]: 1 })) return this.ctx.sacTropLourd({ [piece.objet]: 1 });
      this.prendrePiece(c, cx, cz, i);
      this.ctx.ajouter({ [piece.objet]: 1 });
      this.ctx.noterFait("dechet_ramasse");
      if (piece.objet === "balise_solaire") this.ctx.vivant()?.retirerBruit(`balise:${cx}:${cz}:${i}`);
    }, "leger");
  }

  /** Marque une pièce prise ; le premier geste dans un carreau lance son renouvellement (8 à 24 h). */
  private prendrePiece(c: CoucheLieu, cx: number, cz: number, i: number): void {
    const avant = c.carreau(cx, cz);
    const e: EtatCase = { r: avant.r, pris: [...avant.pris, i].sort((a, b) => a - b), renouvLe: avant.renouvLe };
    if (c.renouvelable && e.renouvLe === 0) e.renouvLe = this.ctx.maintenant() + delaiRenouvellement(graineCarreau(c.cle, cx, cz, e.r));
    this.registre.sauverCarreau(c, cx, cz, e);
    this.registre.diffuser(c.cle, { t: "dechets_carreau", cx, cz, r: e.r, pris: [...e.pris] });
  }

  /** Ce que garde un conteneur (ou un point qui se fouille) : sa place, son nom, sa durée, ce qui reste. */
  private conteneur(c: CoucheLieu, ref: string): { x: number; z: number; nom: string; duree: number; r: number; objets: { i: number; objet: TypeObjet }[] } | null {
    const lu = lireRef(ref);
    if (!lu) return null;
    if (lu.genre === "conteneur") {
      const em = dispositionLieu(c.cle).get(cleCarreau(lu.cx, lu.cz))?.[lu.e];
      if (!em || em.genre === "sol") return null;
      const e = c.carreau(lu.cx, lu.cz);
      const objets = c.pieces(lu.cx, lu.cz).filter((p) => p.e === em.e && p.dedans && !e.pris.includes(p.i)).map((p) => ({ i: p.i, objet: p.objet }));
      return { x: em.x, z: em.z, nom: nomConteneur(em.genre), duree: POINTS_DECHETS[em.genre].duree, r: e.r, objets };
    }
    const p = c.definitionPoint(lu.id);
    if (!p || !seFouille(p.type)) return null;
    const e = c.point(p.id);
    const { x, z } = placePoint(c.cle, p, e.r);
    const d = POINTS_DECHETS[p.type];
    // L'outil qui va plus vite sans être obligatoire (un bâton à fouir pour les gravats) : deux fois plus vite.
    const vite = Object.entries(d.accelerePar ?? {}).every(([q, n]) => niveauQualite(this.ctx.inventaire(), q as Qualite) >= (n ?? 0)) && d.accelerePar;
    const objets = contenuPointCycle(c.cle, p, e.r)
      .map((objet, i) => ({ i, objet }))
      .filter((o) => !e.pris.includes(o.i));
    return { x, z, nom: d.nom, duree: vite ? d.duree / 2 : d.duree, r: e.r, objets };
  }

  /**
   * Fouiller un conteneur : 4 à 8 s, puis tout ce qu'il contient passe dans le sac (« + objet » à l'écran, comme un
   * ramassage) — pas de liste à choisir (choix du porteur, 2026-10-10). Ce qui ne rentre plus reste dedans.
   */
  private fouiller(ref: string): void {
    const c = this.couche();
    if (!c) return;
    const k = this.conteneur(c, ref);
    if (!k) return;
    if (!this.proche(k.x, k.z, DISTANCE_INTERACTION + 0.5)) return this.ctx.info("C'est trop loin : approche-toi encore un peu.");
    if (k.objets.length === 0) return this.ctx.info(`Le ${k.nom} est vide : déjà fouillé.`);
    this.ctx.commencer(`Fouiller : ${k.nom}`, k.duree / REGLAGES.gestes_vitesse, () => {
      const encore = this.conteneur(c, ref);
      if (!encore || this.cle() !== c.cle) return;
      this.ctx.noterFait("dechet_fouille");
      let reste = 0;
      for (const o of encore.objets) {
        if (!this.peutPorter({ [o.objet]: 1 })) {
          reste++;
          continue;
        }
        this.retirerDuConteneur(c, ref, o.i);
        this.ctx.ajouter({ [o.objet]: 1 });
      }
      if (reste > 0) this.ctx.info(`Ton sac est plein : ${reste === 1 ? "un objet reste" : `${reste} objets restent`} dans le ${encore.nom}.`);
    }, "leger");
  }

  /** Marque un objet du conteneur (ou du point qui se fouille) comme pris. */
  private retirerDuConteneur(c: CoucheLieu, ref: string, i: number): void {
    const lu = lireRef(ref)!;
    if (lu.genre === "conteneur") return this.prendrePiece(c, lu.cx, lu.cz, i);
    const p = c.definitionPoint(lu.id)!;
    const avant = c.point(p.id);
    const e: EtatCase = { r: avant.r, pris: [...avant.pris, i].sort((a, b) => a - b), renouvLe: avant.renouvLe };
    if (c.renouvelable && e.renouvLe === 0) e.renouvLe = this.ctx.maintenant() + delaiPoint(c.cle, p, e.r);
    this.registre.sauverPoint(c, p.id, e);
    this.registre.diffuser(c.cle, { t: "dechets_point", point: c.vuePoint(p) });
  }

  private envoyerFouille(c: CoucheLieu, ref: string): void {
    const k = this.conteneur(c, ref);
    const fouille: FouilleVue | null = k ? { ref, nom: k.nom, objets: k.objets } : null;
    this.ctx.envoyer({ t: "fouille", fouille });
  }

  /** Prendre un objet de la liste ouverte. Ce qu'on laisse reste dedans, pour soi ou pour un autre. */
  private prendre(ref: string, i: number): void {
    const c = this.couche();
    const f = this.fouille;
    if (!c || !f || f.ref !== ref || f.cle !== c.cle) return;
    const k = this.conteneur(c, ref);
    // Remplie entre-temps (un tirage neuf) : la liste ouverte ne vaut plus.
    if (!k || k.r !== f.r) {
      this.fouille = null;
      this.ctx.envoyer({ t: "fouille", fouille: null });
      return;
    }
    if (!this.proche(k.x, k.z, PORTEE_FOUILLE)) return this.ctx.info("Approche-toi pour fouiller.");
    const o = k.objets.find((x) => x.i === i);
    if (!o) return this.envoyerFouille(c, ref);
    if (!this.peutPorter({ [o.objet]: 1 })) return this.ctx.sacTropLourd({ [o.objet]: 1 });
    this.retirerDuConteneur(c, ref, i);
    this.ctx.ajouter({ [o.objet]: 1 });
    this.envoyerFouille(c, ref);
  }

  /** Démonter un point sur place (le vélo du fossé, le trampoline…), ou prendre les os de la carcasse. */
  private demonter(ref: string): void {
    const c = this.couche();
    const lu = lireRef(ref);
    if (!c || lu?.genre !== "point") return;
    const p = c.definitionPoint(lu.id);
    if (!p || seFouille(p.type)) return;
    const e = c.point(p.id);
    if (e.renouvLe !== 0) return;
    const d = POINTS_DECHETS[p.type];
    const { x, z } = placePoint(c.cle, p, e.r);
    if (!this.proche(x, z, DISTANCE_INTERACTION + 0.6)) return this.ctx.info("C'est trop loin : approche-toi encore un peu.");
    const facteur = multiplicateurQualites(this.ctx.inventaire(), d.qualites);
    if (facteur === null) {
      for (const t of outilsManquantsBref(d.qualites, this.ctx.inventaire(), undefined, (id) => this.ctx.recetteVisible?.(id) ?? true)) this.ctx.info(t);
      return;
    }
    const donne: Inventaire = {};
    for (const t of contenuPointCycle(c.cle, p, e.r)) donne[t] = (donne[t] ?? 0) + 1;
    if (!this.peutPorter(donne)) return this.ctx.sacTropLourd(donne);
    this.ctx.commencer(d.libelle, (d.duree * facteur) / REGLAGES.gestes_vitesse, () => {
      const avant = c.point(p.id);
      if (this.cle() !== c.cle || avant.r !== e.r || avant.renouvLe !== 0) return;
      if (!this.peutPorter(donne)) return this.ctx.sacTropLourd(donne);
      // Sur le terrain, il n'y a pas de point ; ailleurs, il revient (un événement, au bout de 7 jours, ailleurs).
      const fini: EtatCase = { r: avant.r, pris: Object.keys(contenuPointCycle(c.cle, p, e.r)).map(Number), renouvLe: this.ctx.maintenant() + delaiPoint(c.cle, p, e.r) };
      this.registre.sauverPoint(c, p.id, fini);
      this.registre.diffuser(c.cle, { t: "dechets_point", point: c.vuePoint(p) });
      this.ctx.ajouter(donne);
      this.ctx.noterFait(`dechet_point:${p.type}`);
      this.ctx.info(`Tu en tires ${(Object.entries(donne) as [TypeObjet, number][]).map(([t, n]) => nommer(t, n)).join(", ")}.`);
    }, d.verbe === "demonter" ? "outil" : "leger");
  }

  /** À chaque tic du joueur ; le travail ne se fait qu'une fois toutes les 5 s (et par lieu, pour le partagé). */
  tick(instant: number): void {
    if (instant - this.derniereVerif < INTERVALLE_VERIF) return;
    this.derniereVerif = instant;
    // Le conteneur ouvert se referme quand on s'en éloigne (ou qu'on change de lieu).
    const f = this.fouille;
    if (f && (this.cle() !== f.cle || !this.proche(f.x, f.z, PORTEE_FOUILLE + 1))) {
      this.fouille = null;
      this.ctx.envoyer({ t: "fouille", fouille: null });
    }
    const c = this.couche();
    if (!c || instant - c.derniereVerif < INTERVALLE_VERIF) return;
    c.derniereVerif = instant;
    this.registre.renouveler(c, instant);
    const vivant = this.ctx.vivant();
    if (!vivant) return;
    // Les balises solaires restées au sol s'allument la nuit : une lumière faible, que les Éteints viennent voir (Q12).
    if (estNuit(heureDeJeu(instant, this.registre.debutMonde))) {
      for (const b of c.balises()) {
        const s: Stimulus = { genre: "lumiere", x: b.x, z: b.z, ...BALISE_LUMIERE_NUIT };
        vivant.ajouterBruit(b.id, s, instant + INTERVALLE_VERIF * 2);
      }
    }
    // Les ordures jetées depuis plus de 24 h s'effacent (Q10) ; le terrain personnel n'est jamais un lieu vivant.
    if (instant - c.dernierePurge >= INTERVALLE_PURGE) {
      c.dernierePurge = instant;
      for (const s of [...vivant.sacs]) if (s.contenu.jete && tasAEffacer(s.contenu.inventaire, s.creeLe, instant, false)) vivant.retirerSac(s.id);
    }
  }
}
