// La vue par pièce (0.7.2, proposition « visibilité par pièce ») : ce qu'on voit d'un point à un autre, contre les murs
// et les portes fermées du plan ; ce qu'un son garde d'une pièce à l'autre ; par où il nous arrive.
//
// Une seule règle pour le serveur et l'écran :
// - le serveur n'envoie à un joueur que les Éteints, les joueurs et les coups qu'il voit (lieu-vivant.ts) ;
// - les Éteints voient le joueur par la même règle (« si je le vois, il me voit », milieu-coop.ts) ;
// - l'écran assombrit ce que le personnage ne voit pas, avec les mêmes boîtes (client/src/rendu/carte-vue.ts).
//
// Ce qui arrête la vue : les murs de plus de 1,2 m et les portes fermées. Pas les fenêtres et les vitrines (sauf
// condamnées), ni le mobilier bas, ni les rayonnages du hangar (décision du porteur du projet, 2026-10-09).

import { entreeDansBoite } from "./murs.ts";
import type { Boite } from "./lieux.ts";

/** Une ouverture dans un mur : une porte, une fenêtre. `sens` : le mur qui la porte court selon x ou selon z. */
export interface Ouverture {
  id: string;
  x: number;
  z: number;
  largeur: number;
  sens: "x" | "z";
  /** Les deux pièces qu'elle relie. */
  entre: readonly [string, string];
}

export interface PorteVue extends Ouverture {
  /** Une porte sans battant (défoncée, arrachée) : toujours ouverte. */
  toujoursOuverte?: boolean;
}

export interface FenetreVue extends Ouverture {
  /** Condamnée (planches, contreplaqué, store baissé) : elle arrête la vue. */
  opaque?: boolean;
}

/** Le plan de vue d'un lieu. */
export interface PlanVue {
  /** Ce qui arrête la vue, portes fermées non comprises (les fenêtres sont déjà percées dedans). */
  murs: readonly Boite[];
  portes: readonly PorteVue[];
  fenetres: readonly FenetreVue[];
  /** La pièce d'un point. */
  pieceDe(x: number, z: number): string;
  /** Les pièces (« dehors » compris). */
  pieces: readonly string[];
}

/** L'état des portes : ouverte (true), fermée (false), ou en mouvement (de 0, fermée, à 1, ouverte). */
export type EtatsPortes = Readonly<Record<string, boolean | number>>;

/** Ce qui arrête la vue pour un état des portes. */
export interface ObstaclesVue {
  boites: readonly Boite[];
}

/** Une boîte qui bouche une ouverture (ou une part de sa largeur, du côté `debut`). */
function boiteOuverture(o: Ouverture, part = 1, depuis: "debut" | "fin" | "milieu" = "debut", epaisseur = 0.3): Boite {
  const l = o.largeur * part;
  const decal = depuis === "milieu" ? 0 : (depuis === "debut" ? -1 : 1) * (o.largeur - l) / 2;
  return o.sens === "x" ? { x: o.x + decal, z: o.z, l, p: epaisseur } : { x: o.x, z: o.z + decal, l: epaisseur, p: l };
}

/** Ouvre des trous dans des murs : chaque mur traversé par une ouverture est coupé de part et d'autre. */
export function percer(murs: readonly Boite[], ouvertures: readonly Ouverture[]): Boite[] {
  let res = [...murs];
  for (const o of ouvertures) {
    const suite: Boite[] = [];
    for (const m of res) {
      const selonX = m.l >= m.p;
      const dansLaLigne = selonX ? o.sens === "x" && Math.abs(m.z - o.z) < m.p / 2 + 0.05 : o.sens === "z" && Math.abs(m.x - o.x) < m.l / 2 + 0.05;
      const a = selonX ? m.x - m.l / 2 : m.z - m.p / 2;
      const b = selonX ? m.x + m.l / 2 : m.z + m.p / 2;
      const oa = (selonX ? o.x : o.z) - o.largeur / 2;
      const ob = (selonX ? o.x : o.z) + o.largeur / 2;
      if (!dansLaLigne || ob <= a || oa >= b) {
        suite.push(m);
        continue;
      }
      const morceau = (u0: number, u1: number) => {
        if (u1 - u0 < 0.02) return;
        suite.push(selonX ? { x: (u0 + u1) / 2, z: m.z, l: u1 - u0, p: m.p } : { x: m.x, z: (u0 + u1) / 2, l: m.l, p: u1 - u0 });
      };
      morceau(a, oa);
      morceau(ob, b);
    }
    res = suite;
  }
  return res;
}

const caches = new WeakMap<PlanVue, Map<string, ObstaclesVue>>();

/** L'ouverture d'une porte (0 : fermée, 1 : ouverte). */
function ouvertureDe(p: PorteVue, etats: EtatsPortes): number {
  if (p.toujoursOuverte) return 1;
  const e = etats[p.id];
  return e === undefined ? 1 : typeof e === "number" ? Math.max(0, Math.min(1, e)) : e ? 1 : 0;
}

/**
 * Ce qui arrête la vue pour cet état des portes. Une porte en mouvement (l'écran l'anime) ne bouche qu'une part de
 * son ouverture : le cône s'ouvre avec le battant. Gardé pour chaque état tout ouvert ou tout fermé.
 */
export function obstaclesVue(plan: PlanVue, etats: EtatsPortes): ObstaclesVue {
  const ouvertures = plan.portes.map((p) => ouvertureDe(p, etats));
  const entier = ouvertures.every((t) => t === 0 || t === 1);
  const cle = ouvertures.map((t) => (t === 1 ? "1" : t === 0 ? "0" : t.toFixed(2))).join("");
  let cache = caches.get(plan);
  if (!cache) caches.set(plan, (cache = new Map()));
  const deja = cache.get(cle);
  if (deja) return deja;
  const boites: Boite[] = [...plan.murs];
  plan.portes.forEach((p, i) => {
    const t = ouvertures[i]!;
    // Presque ouverte : le battant est rangé. Sinon, il bouche ce qui reste (la vue passe à côté, par l'entrebâillement).
    if (t < 0.97) boites.push(boiteOuverture(p, 1 - t));
  });
  const ov: ObstaclesVue = { boites };
  if (entier) cache.set(cle, ov);
  return ov;
}

/** Le point est-il dans la boîte (bords compris) ? */
function dans(x: number, z: number, b: Boite): boolean {
  return Math.abs(x - b.x) <= b.l / 2 && Math.abs(z - b.z) <= b.p / 2;
}

/**
 * La vue passe-t-elle de a à b ? Aucun mur ni porte fermée entre les deux. Un mur dans lequel se trouve l'un des deux
 * points ne compte pas (on se tient sur un seuil, un Éteint est plaqué contre une porte).
 */
export function voit(ov: ObstaclesVue, ax: number, az: number, bx: number, bz: number): boolean {
  const x0 = Math.min(ax, bx);
  const x1 = Math.max(ax, bx);
  const z0 = Math.min(az, bz);
  const z1 = Math.max(az, bz);
  for (const b of ov.boites) {
    // Tri grossier : la boîte touche-t-elle le rectangle du segment ?
    if (b.x + b.l / 2 < x0 || b.x - b.l / 2 > x1 || b.z + b.p / 2 < z0 || b.z - b.p / 2 > z1) continue;
    if (dans(ax, az, b) || dans(bx, bz, b)) continue;
    if (entreeDansBoite(ax, az, bx, bz, b) !== null) return false;
  }
  return true;
}

/** Le premier mur sur le segment a → b : la part du trajet (0 à 1), ou null si la vue passe. */
export function premierMur(ov: ObstaclesVue, ax: number, az: number, bx: number, bz: number): number | null {
  let t = Infinity;
  for (const b of ov.boites) {
    if (dans(ax, az, b) || dans(bx, bz, b)) continue;
    const e = entreeDansBoite(ax, az, bx, bz, b);
    if (e !== null && e < t) t = e;
  }
  return t === Infinity ? null : t;
}

// ---------- Le polygone de vue (pour l'écran) ----------

/**
 * Le polygone de ce qu'on voit depuis (x, z), dans un carré de demi-côté `demi` : des points (x, z) à la suite, rangés
 * par angle. Un rayon tous les 1°, plus deux rayons frôlant chaque coin de mur (les bords d'ombre restent nets). Chaque
 * rayon s'arrête au mur qu'il touche, prolongé de `paroi` mètres : le dessus et la face visible du mur restent vus.
 */
export function polygoneVue(ov: ObstaclesVue, x: number, z: number, demi: number, paroi = 0.3): Float32Array {
  // Les murs utiles, avec l'angle sous lequel on les voit (de a0 à a1, autour de leur centre).
  const utiles: { b: Boite; ac: number; d0: number; d1: number }[] = [];
  const angles: number[] = [];
  for (const b of ov.boites) {
    if (Math.abs(b.x - x) > demi + b.l || Math.abs(b.z - z) > demi + b.p) continue;
    if (dans(x, z, b)) continue;
    const ac = Math.atan2(b.z - z, b.x - x);
    let d0 = Infinity;
    let d1 = -Infinity;
    for (const [cx, cz] of [
      [b.x - b.l / 2, b.z - b.p / 2],
      [b.x + b.l / 2, b.z - b.p / 2],
      [b.x + b.l / 2, b.z + b.p / 2],
      [b.x - b.l / 2, b.z + b.p / 2],
    ] as const) {
      const a = Math.atan2(cz - z, cx - x);
      const d = enrouler(a - ac);
      d0 = Math.min(d0, d);
      d1 = Math.max(d1, d);
      angles.push(a - 1e-4, a + 1e-4);
    }
    utiles.push({ b, ac, d0, d1 });
  }
  for (let i = 0; i < 360; i++) angles.push(-Math.PI + (i / 360) * Math.PI * 2);
  angles.sort((a, b) => a - b);
  const points = new Float32Array(angles.length * 2);
  let n = 0;
  let precedent = Number.NaN;
  for (const a of angles) {
    if (a - precedent < 1e-6) continue;
    precedent = a;
    const dx = Math.cos(a);
    const dz = Math.sin(a);
    // Jusqu'au bord du carré.
    let t = Math.min(dx !== 0 ? demi / Math.abs(dx) : Infinity, dz !== 0 ? demi / Math.abs(dz) : Infinity);
    const bord = t;
    for (const u of utiles) {
      const d = enrouler(a - u.ac);
      if (d < u.d0 - 1e-6 || d > u.d1 + 1e-6) continue;
      const e = rayonBoite(x, z, dx, dz, u.b);
      if (e !== null && e + paroi < t) t = e + paroi;
    }
    t = Math.min(t, bord);
    points[n++] = x + dx * t;
    points[n++] = z + dz * t;
  }
  return points.subarray(0, n);
}

function enrouler(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/** Distance le long d'un rayon (origine, direction unitaire) jusqu'à une boîte ; null si le rayon la manque. */
function rayonBoite(ox: number, oz: number, dx: number, dz: number, b: Boite): number | null {
  let t0 = 0;
  let t1 = Infinity;
  for (const [o, d, min, max] of [
    [ox, dx, b.x - b.l / 2, b.x + b.l / 2],
    [oz, dz, b.z - b.p / 2, b.z + b.p / 2],
  ] as const) {
    if (Math.abs(d) < 1e-12) {
      if (o < min || o > max) return null;
      continue;
    }
    let ta = (min - o) / d;
    let tb = (max - o) / d;
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta);
    t1 = Math.min(t1, tb);
    if (t0 > t1) return null;
  }
  return t0;
}

// ---------- Le son d'une pièce à l'autre ----------

/** Ce qu'un son garde en passant une porte ouverte, une porte fermée, une fenêtre (une vitre, une vitrine brisée). */
export const SON_PORTE_OUVERTE = 0.5;
export const SON_PORTE_FERMEE = 0.15;
export const SON_FENETRE = 0.3;
/** À travers un mur sans ouverture : un bruit très fort s'entend encore un peu. */
export const SON_MUR = 0.05;

interface Acoustique {
  /** Ce que garde un son de la pièce a à la pièce b (le meilleur chemin, ouverture après ouverture). */
  passe: Map<string, number>;
  /** La première ouverture à passer depuis a pour aller vers b, sur ce meilleur chemin. */
  premiere: Map<string, Ouverture | null>;
}

const acoustiques = new WeakMap<PlanVue, Map<string, Acoustique>>();

function acoustique(plan: PlanVue, etats: EtatsPortes): Acoustique {
  const cle = plan.portes.map((p) => (ouvertureDe(p, etats) >= 0.5 ? "1" : "0")).join("");
  let cache = acoustiques.get(plan);
  if (!cache) acoustiques.set(plan, (cache = new Map()));
  const deja = cache.get(cle);
  if (deja) return deja;
  const aretes: { o: Ouverture; k: number }[] = [
    ...plan.portes.map((p) => ({ o: p as Ouverture, k: ouvertureDe(p, etats) >= 0.5 ? SON_PORTE_OUVERTE : SON_PORTE_FERMEE })),
    ...plan.fenetres.map((f) => ({ o: f as Ouverture, k: f.opaque ? SON_PORTE_FERMEE : SON_FENETRE })),
  ];
  const passe = new Map<string, number>();
  const premiere = new Map<string, Ouverture | null>();
  for (const a of plan.pieces) {
    const meilleur = new Map<string, number>([[a, 1]]);
    const par = new Map<string, Ouverture | null>([[a, null]]);
    const file: string[] = [a];
    while (file.length) {
      const ici = file.shift()!;
      for (const { o, k } of aretes) {
        if (!o.entre.includes(ici)) continue;
        const la = o.entre[0] === ici ? o.entre[1] : o.entre[0];
        const v = meilleur.get(ici)! * k;
        if (v > (meilleur.get(la) ?? 0)) {
          meilleur.set(la, v);
          par.set(la, par.get(ici) ?? o);
          file.push(la);
        }
      }
    }
    for (const [b, v] of meilleur) passe.set(`${a}>${b}`, v);
    for (const [b, o] of par) premiere.set(`${a}>${b}`, o);
  }
  const ac = { passe, premiere };
  cache.set(cle, ac);
  return ac;
}

/** Ce qu'un son garde (0 à 1) de la pièce a à la pièce b : 1 dans la même pièce, au moins SON_MUR. */
export function facteurSon(plan: PlanVue, etats: EtatsPortes, pa: string, pb: string): number {
  if (pa === pb) return 1;
  return Math.max(SON_MUR, acoustique(plan, etats).passe.get(`${pa}>${pb}`) ?? 0);
}

/**
 * Par où un son nous arrive, de notre côté (le point de passage d'un « bruit », message `bruits`) : le milieu de
 * l'ouverture par où il entre dans notre pièce, ou le point du mur le plus proche sur la ligne qui nous en sépare.
 * Jamais la position de la source : à au moins `recul` mètres de nous… et de notre côté du mur.
 */
export function passageSon(plan: PlanVue, etats: EtatsPortes, ecoute: { x: number; z: number }, source: { x: number; z: number }): { x: number; z: number } {
  const pa = plan.pieceDe(ecoute.x, ecoute.z);
  const pb = plan.pieceDe(source.x, source.z);
  if (pa !== pb) {
    const o = acoustique(plan, etats).premiere.get(`${pa}>${pb}`);
    if (o) {
      // Un peu en deçà de l'ouverture, côté écoute.
      const versNous = o.sens === "x" ? { x: 0, z: Math.sign(ecoute.z - o.z) || 1 } : { x: Math.sign(ecoute.x - o.x) || 1, z: 0 };
      // Le long de l'ouverture : vers nous, sans sortir de sa largeur.
      const le = o.sens === "x" ? Math.max(-o.largeur / 2 + 0.3, Math.min(o.largeur / 2 - 0.3, ecoute.x - o.x)) : Math.max(-o.largeur / 2 + 0.3, Math.min(o.largeur / 2 - 0.3, ecoute.z - o.z));
      return o.sens === "x" ? { x: o.x + le * 0.5, z: o.z + versNous.z * 0.45 } : { x: o.x + versNous.x * 0.45, z: o.z + le * 0.5 };
    }
  }
  // Pas d'ouverture (ou la même pièce, derrière un angle) : sur le mur, de notre côté, sur la ligne qui nous en sépare.
  const ov = obstaclesVue(plan, etats);
  const t = premierMur(ov, ecoute.x, ecoute.z, source.x, source.z);
  const d = Math.hypot(source.x - ecoute.x, source.z - ecoute.z) || 1;
  const tt = t === null ? 0.5 : Math.max(0, t - 0.35 / d);
  return { x: ecoute.x + (source.x - ecoute.x) * tt, z: ecoute.z + (source.z - ecoute.z) * tt };
}
