// Le lancer et le tir (Book 23 §5, Book 25 §3.4, §8.3 et §10.3, chantier 1) : ce qui se lance, ce qui tire, et la
// géométrie que le serveur et le client partagent (la trajectoire, le premier mur, la chance de toucher).
//
// Deux tables :
// - OBJETS_LANCES : ce qu'on lance à la main (la pierre, le réveil, la hachette). L'objet part lui-même et retombe au sol ;
// - ARMES_TIR : les armes de tir (l'arc, l'arbalète). Elles restent en main et consomment des MUNITIONS (flèches,
//   carreaux). Cette table est **à part** de ARMES (combat.ts) : sinon `meilleureArme` prendrait un arc au contact.
//   Elle est vide ici : le chantier 4 remplit le bloc « arc », le chantier 7 le bloc « arbalète » (Book 25 §10.4).
//
// Un même bouton, Lancer : on le maintient (l'arc de visée paraît, l'arc se bande), on le relâche (l'objet part).

import { estObjet, type Inventaire, type TypeObjet } from "./objets.ts";
import { ETOILES, compter, etoilesDe, etoilesDeBase, estObjetDeMetier, meilleurExemplaire, soliditeExemplaire, typeDe, type CleObjet, type Etoiles } from "./etoiles.ts";
import type { Boite, Zone } from "./lieux.ts";
import type { TypeDegat } from "./combat.ts";
import { MOBILIER } from "./cooperative.ts";

// ---------- Ce qu'on lance à la main (Book 23 §5) ----------

/** Un objet qu'on lance : il part de la main, retombe au sol, et se ramasse. */
export interface ObjetLance {
  /** L'identifiant de l'objet (une chaîne : la hachette n'existe qu'une fois déclarée par le chantier 3). */
  objet: string;
  nom: string;
  /** Une arme qu'on lance (elle vise un Éteint), ou un leurre (il vise un point au sol et fait du bruit). */
  genre: "arme" | "leurre";
  /** La portée, en mètres : au-delà, il retombe avant. */
  portee: number;
  /** Ce qu'il fait au torse (0 : rien). */
  degats: number;
  type: TypeDegat;
  /** Il étourdit, quel que soit l'endroit où il touche (s). */
  etourdi: number;
  /** La chance d'un coup heureux à la tête, qui détruit (la hachette : Book 23 §5). */
  coupHeureux: number;
  /** Le temps entre deux lancers (ms). */
  cadenceMs: number;
  /** L'endurance d'un lancer. */
  endurance: number;
  /** Le bruit de l'impact : sa portée (m) et sa durée (s). Une pierre qui tombe attire un peu (le leurre du pauvre). */
  bruitImpact: { portee: number; duree: number };
  /** Un leurre qui sonne après l'impact (le réveil : 20 s). */
  sonne?: { portee: number; duree: number; intensite: number };
  /** La vitesse en vol (m/s), pour le dessin et la durée du vol. */
  vitesse: number;
}

/**
 * Les objets qu'on lance (Book 23 §5). Une ligne qui vise un objet pas encore déclaré (la hachette, chantiers 3 et 5)
 * reste en attente : `objetLance` ne la propose que quand l'objet existe.
 */
export const OBJETS_LANCES: ObjetLance[] = [
  { objet: "pierre", nom: "la pierre", genre: "arme", portee: 8, degats: 0.3, type: "contondant", etourdi: 1, coupHeureux: 0, cadenceMs: 1000, endurance: 4, bruitImpact: { portee: 8, duree: 1 }, vitesse: 14 },
  { objet: "reveil", nom: "le réveil", genre: "leurre", portee: 10, degats: 0, type: "contondant", etourdi: 0, coupHeureux: 0, cadenceMs: 1000, endurance: 3, bruitImpact: { portee: 4, duree: 0.5 }, sonne: { portee: 18, duree: 20, intensite: 1.3 }, vitesse: 12 },
  { objet: "hachette", nom: "la hachette", genre: "arme", portee: 10, degats: 1.3, type: "tranchant", etourdi: 1.2, coupHeureux: 0.25, cadenceMs: 1000, endurance: 8, bruitImpact: { portee: 6, duree: 1 }, vitesse: 13 },
];

/** Le point qu'un leurre vise par défaut : à 8 m devant soi (Book 23 §5). */
export const DISTANCE_LEURRE = 8;

// ---------- Les armes de tir (Book 25 §8.3 et §8.5) ----------

/** Une arme de tir, à ses étoiles de base (★★★ en général) : les étoiles règlent dégâts et portées (ETOILES). */
export interface ArmeTir {
  objet: TypeObjet;
  nom: string;
  type: "percant";
  /** Utile : la cible accrochée est touchée. Max : au-delà, aucune chance. Tête : le tir plein peut détruire. */
  porteeUtile: number;
  porteeMax: number;
  porteeTete: number;
  /** Les dégâts au torse : tir rapide (null : il n'y en a pas, l'arbalète tire toujours plein), tir plein. */
  degatsRapide: number | null;
  degatsPlein: number;
  /** Arc : bander jusqu'au tir plein (ms). Arbalète armée : viser. */
  pleinMs: number;
  /** Arc : encocher (ms). Arbalète : réarmer (immobile). */
  rechargeMs: number;
  /** L'endurance : bander l'arc, ou réarmer l'arbalète. */
  endurance: number;
  /** La corde qui claque (m). L'impact, lui, s'entend à BRUIT_IMPACT_TIR. */
  bruit: number;
  /** Tirs avant qu'elle casse. */
  solidite: number;
  metier?: true;
  /**
   * Portée armée d'avance (l'arbalète, Book 25 §6.1) : le premier tir part sans attendre ; après, il faut la réarmer,
   * immobile (le geste « Réarmer », `rechargeMs`). Sans : l'arc, qu'on encoche tout seul en `rechargeMs`.
   */
  armeeDAvance?: true;
}

/** Contre un Équipé, la flèche passe la visière ouverte : de face, à la moitié de la portée de tête (Book 25 §3.4). */
export const PART_TETE_EQUIPE = 0.5;

/** Les armes de tir. Deux blocs réservés, un par chantier (Book 25 §10.4) ; rien d'autre n'y écrit. */
export const ARMES_TIR: ArmeTir[] = [
  // ---- Bloc « arc » (chantier 4) ----
  // L'arc pour tous (Book 25 §3 et §8.3). Chaque ligne est donnée à ses étoiles de base (etoiles.ts) : l'arc de fortune
  // à ★, l'arc de frêne à ★★★, l'arc d'if à ★★★★, l'arc de tir sportif à ★★★★★ ; `armeTirExemplaire` règle le reste.
  // Bander 1,5 s pour le tir plein, encocher 1 s (réglage accepté par le porteur, 2026-10-09). La corde claque à 3 m.
  { objet: "arc_fortune", nom: "l'arc de fortune", type: "percant", porteeUtile: 8, porteeMax: 15, porteeTete: 4, degatsRapide: 0.5, degatsPlein: 1, pleinMs: 1500, rechargeMs: 1000, endurance: 6, bruit: 3, solidite: 75, metier: true },
  { objet: "arc_simple", nom: "l'arc", type: "percant", porteeUtile: 12, porteeMax: 25, porteeTete: 6, degatsRapide: 0.6, degatsPlein: 1.2, pleinMs: 1500, rechargeMs: 1000, endurance: 6, bruit: 3, solidite: 150, metier: true },
  { objet: "arc_if", nom: "l'arc d'if", type: "percant", porteeUtile: 15, porteeMax: 30, porteeTete: 7, degatsRapide: 0.65, degatsPlein: 1.3, pleinMs: 1500, rechargeMs: 1000, endurance: 6, bruit: 3, solidite: 225, metier: true },
  { objet: "arc_sportif", nom: "l'arc de tir sportif", type: "percant", porteeUtile: 16, porteeMax: 33, porteeTete: 8, degatsRapide: 0.72, degatsPlein: 1.44, pleinMs: 1500, rechargeMs: 1000, endurance: 6, bruit: 3, solidite: 300, metier: true },
  // ---- Bloc « arbalète » (chantier 7) ----
];

/** Les arcs (chantier 4) : ils tirent toutes les flèches. */
export const ARCS: readonly TypeObjet[] = ["arc_fortune", "arc_simple", "arc_if", "arc_sportif"];

/** Une munition : la flèche ou le carreau, et ce qu'il fait de plus. */
export interface Munition {
  objet: TypeObjet;
  /** Les armes qui la tirent. */
  pour: readonly TypeObjet[];
  /** La chance qu'elle casse en touchant (Book 25 §3.4 : 1/2 durcie, 1/3 os et clou, 1/5 acier). */
  casse: number;
  /** Un tir plein à portée de tête détruit-il ? (la pointe durcie au feu, non) */
  tueALaTete: boolean;
}

/** Les munitions, des meilleures aux moins bonnes. Mêmes blocs réservés que ARMES_TIR. */
export const MUNITIONS: Munition[] = [
  // ---- Bloc « arc » (chantier 4) ----
  // Toutes les flèches vont à tous les arcs. La pointe durcie au feu blesse, mais ne perce pas un crâne (Book 25 §3.4).
  { objet: "fleche_carbone", pour: ARCS, casse: 0, tueALaTete: true },
  { objet: "fleche_acier", pour: ARCS, casse: 1 / 5, tueALaTete: true },
  { objet: "fleche_os", pour: ARCS, casse: 1 / 3, tueALaTete: true },
  { objet: "fleche_clou", pour: ARCS, casse: 1 / 3, tueALaTete: true },
  { objet: "fleche_durcie", pour: ARCS, casse: 1 / 2, tueALaTete: false },
  // ---- Bloc « arbalète » (chantier 7) ----
];

/** L'impact d'une flèche ou d'un carreau s'entend à 4 m (Book 25 §3.4). */
export const BRUIT_IMPACT_TIR = 4;
/** Tenir l'arc bandé plus de 3 s fait trembler le bras : 2 d'endurance par seconde (Book 25 §3.4). */
export const TREMBLE_APRES_MS = 3000;
export const TREMBLE_PAR_SECONDE = 2;
/** La vitesse d'une flèche ou d'un carreau en vol (m/s), pour le dessin. */
export const VITESSE_TIR = 30;

// ---------- Ce qui est prêt à lancer (l'objet rapide, Book 08 §3.3) ----------

/** Ce que le bouton Lancer fera partir. */
export type Pret =
  | { genre: "lancer"; cle: CleObjet; def: ObjetLance }
  | { genre: "tir"; cle: CleObjet; arme: ArmeTir; munition: Munition | null };

/** La définition d'un objet lancé (null : il ne se lance pas, ou il n'est pas encore déclaré). */
export function objetLance(type: string, table: readonly ObjetLance[] = OBJETS_LANCES): ObjetLance | null {
  const d = table.find((o) => o.objet === type);
  return d && estObjet(d.objet) ? d : null;
}

/** L'arme de tir d'un objet (null : ce n'est pas une arme de tir). */
export function armeTirDe(type: string, table: readonly ArmeTir[] = ARMES_TIR): ArmeTir | null {
  return table.find((a) => a.objet === type) ?? null;
}

/** Cet objet peut-il être « prêt à lancer » (un objet qu'on lance, ou une arme de tir) ? */
export function estLancable(cle: string, tables: TablesTir = TABLES_TIR): boolean {
  const type = typeDe(cle);
  return objetLance(type, tables.lances) !== null || armeTirDe(type, tables.armes) !== null;
}

/** Les tables du tir, regroupées (les tests en donnent d'autres). */
export interface TablesTir {
  lances: readonly ObjetLance[];
  armes: readonly ArmeTir[];
  munitions: readonly Munition[];
}
export const TABLES_TIR: TablesTir = { lances: OBJETS_LANCES, armes: ARMES_TIR, munitions: MUNITIONS };

/** La meilleure munition du sac pour cette arme (null : plus rien à tirer). */
export function munitionPour(inventaire: Inventaire, arme: TypeObjet, tables: TablesTir = TABLES_TIR): Munition | null {
  return tables.munitions.find((m) => m.pour.includes(arme) && compter(inventaire, m.objet) > 0) ?? null;
}

/**
 * Ce que le bouton Lancer fera partir : l'objet choisi (« Prêt à lancer ») s'il est encore dans le sac ; sinon une
 * pierre, s'il y en a (la plus commune des choses qu'on lance). null : rien à lancer.
 */
export function pretALancer(inventaire: Inventaire, choisi: CleObjet | null, tables: TablesTir = TABLES_TIR): Pret | null {
  const candidats: CleObjet[] = [];
  if (choisi) {
    if ((inventaire[choisi] ?? 0) > 0) candidats.push(choisi);
    else {
      // L'exemplaire choisi n'y est plus : un autre de la même sorte.
      const autre = meilleurExemplaire(inventaire, typeDe(choisi));
      if (autre) candidats.push(autre);
    }
  }
  if ((inventaire.pierre ?? 0) > 0) candidats.push("pierre");
  for (const cle of candidats) {
    const type = typeDe(cle);
    const arme = armeTirDe(type, tables.armes);
    if (arme) return { genre: "tir", cle, arme, munition: munitionPour(inventaire, arme.objet, tables) };
    const def = objetLance(type, tables.lances);
    if (def) return { genre: "lancer", cle, def };
  }
  return null;
}

// ---------- Les étoiles d'une arme de tir (Book 25 §8.3) ----------

/** Une arme de tir telle que la donne un exemplaire : dégâts et portées suivent ses étoiles. */
export function armeTirExemplaire(cle: string, base: ArmeTir): ArmeTir & { etoiles: Etoiles | null } {
  const n = base.metier && estObjetDeMetier(base.objet) ? etoilesDe(cle) : null;
  if (n === null) return { ...base, etoiles: null };
  const ref = ETOILES[etoilesDeBase(base.objet)];
  const e = ETOILES[n];
  const kd = e.degats / ref.degats;
  const kp = e.porteeTete / ref.porteeTete;
  return {
    ...base,
    etoiles: n,
    porteeUtile: base.porteeUtile * kp,
    porteeMax: base.porteeMax * kp,
    porteeTete: base.porteeTete * kp,
    degatsRapide: base.degatsRapide === null ? null : base.degatsRapide * kd,
    degatsPlein: base.degatsPlein * kd,
    solidite: estObjetDeMetier(base.objet) ? soliditeExemplaire(base.objet, n, base.solidite) : base.solidite,
  };
}

// ---------- La géométrie : la trajectoire et le premier mur ----------

/** Le mobilier bas, par-dessus lequel on lance (une caisse, un rayon bas, des palettes) ; pas un rayonnage de 4 m. */
const GENRES_BAS = new Set(["caisse", "rayon_bas", "palettes", "transpalette", "bureau", "etabli", "coffre_fort"]);
const BOITES_BASSES = new Set<Boite>(MOBILIER.filter((m) => GENRES_BAS.has(m.genre)).map((m) => m.boite));

/** Un obstacle arrête-t-il un objet lancé ? (les murs, les rayonnages, les tracteurs ; pas le mobilier bas) */
export function arreteLeLancer(b: Boite): boolean {
  return !BOITES_BASSES.has(b);
}

/**
 * Où un segment (de a vers b) entre-t-il dans une boîte élargie de `marge` ? En part du segment (0 à 1), ou null.
 * La méthode des tranches : on coupe le segment par les deux plans de chaque axe.
 */
export function entreeDansBoite(ax: number, az: number, bx: number, bz: number, boite: Boite, marge = 0): number | null {
  let t0 = 0;
  let t1 = 1;
  const axes: [number, number, number, number][] = [
    [ax, bx - ax, boite.x - boite.l / 2 - marge, boite.x + boite.l / 2 + marge],
    [az, bz - az, boite.z - boite.p / 2 - marge, boite.z + boite.p / 2 + marge],
  ];
  for (const [o, d, min, max] of axes) {
    if (Math.abs(d) < 1e-9) {
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

/**
 * Le premier mur sur la trajectoire de a vers b (Book 23 §5 : « on ne lance pas par-dessus un rayonnage de 4 m ») :
 * la part du trajet faite avant de le heurter (1 : rien ne l'arrête). Les bords du lieu arrêtent aussi.
 */
export function premierMur(zone: Zone, ax: number, az: number, bx: number, bz: number, marge = 0.05): number {
  let t = 1;
  for (const b of zone.obstacles) {
    if (!arreteLeLancer(b)) continue;
    // Une boîte où l'on se tient déjà (on lance depuis le seuil d'une porte) ne compte pas.
    if (ax > b.x - b.l / 2 - marge && ax < b.x + b.l / 2 + marge && az > b.z - b.p / 2 - marge && az < b.z + b.p / 2 + marge) continue;
    const e = entreeDansBoite(ax, az, bx, bz, b, marge);
    if (e !== null && e < t) t = e;
  }
  // Les bords du lieu (le grillage de la Coopérative, la lisière du terrain).
  const dx = bx - ax;
  const dz = bz - az;
  const bords: [number, number, number][] = [
    [ax, dx, zone.xMin],
    [ax, dx, zone.xMax],
    [az, dz, zone.zMin],
    [az, dz, zone.zMax],
  ];
  for (const [o, d, lim] of bords) {
    if (Math.abs(d) < 1e-9) continue;
    const s = (lim - o) / d;
    if (s > 1e-6 && s < t) t = s;
  }
  return Math.max(0, t);
}

/** La distance d'un point au segment ab, et où il se projette (0 à 1). */
export function distanceAuSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number): { d: number; t: number } {
  const dx = bx - ax;
  const dz = bz - az;
  const l2 = dx * dx + dz * dz;
  const t = l2 < 1e-9 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2));
  return { d: Math.hypot(px - (ax + dx * t), pz - (az + dz * t)), t };
}

/**
 * La chance de toucher la cible accrochée (Book 25 §3.4) : sûre dans la portée utile, elle baisse jusqu'à 0 à la portée
 * maximale. Le cercle de visée le montre : blanc, puis orange.
 */
export function chanceDeToucher(distance: number, utile: number, max: number): number {
  if (distance <= utile) return 1;
  if (distance >= max) return 0;
  return 1 - (distance - utile) / (max - utile);
}

/**
 * La couleur du cercle de visée (Book 25 §3.4) : blanc dans la portée utile, orange au-delà, rouge quand un tir plein
 * détruirait (la tête est à portée).
 */
export function couleurVisee(distance: number, utile: number, tete: number | null, plein: boolean): "blanc" | "orange" | "rouge" {
  if (plein && tete !== null && distance <= tete) return "rouge";
  return distance <= utile ? "blanc" : "orange";
}

/** Un Éteint de face (pour la flèche qui passe la visière) : il regarde vers le tireur, à 60° près. */
export function deFace(eteint: { x: number; z: number; o: number }, tireur: { x: number; z: number }): boolean {
  const versTireur = Math.atan2(tireur.x - eteint.x, tireur.z - eteint.z);
  const ecart = Math.atan2(Math.sin(versTireur - eteint.o), Math.cos(versTireur - eteint.o));
  return Math.abs(ecart) <= Math.PI / 3;
}

/** La portée d'un objet prêt (pour viser) : celle de l'objet lancé, ou la portée maximale de l'arme de tir. */
export function porteeDe(pret: Pret): number {
  if (pret.genre === "lancer") return pret.def.portee;
  return armeTirExemplaire(pret.cle, pret.arme).porteeMax;
}
