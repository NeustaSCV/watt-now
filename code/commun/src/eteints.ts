// Les Éteints de la 0a (Book 21 §3.5) : l'Errant seul, avec quatre états — dormant, errant, attiré, poursuivant.
// Book 06 : lents, bêtes, guidés par l'ouïe ; la vue est mauvaise. L'attention monte avec intensité × durée,
// et retombe quand plus rien ne se passe.

import { DELAI_SAISIE, DUREE_A_TERRE, DUREE_ETOURDI, RESISTANCE_TORSE, type Arme } from "./combat.ts";
import { heurte, type Zone } from "./lieux.ts";
import type { Stimulus } from "./signature.ts";

export type EtatEteint = "dormant" | "errant" | "attire" | "poursuivant" | "a_terre" | "detruit";

export interface Eteint {
  id: number;
  x: number;
  z: number;
  o: number;
  etat: EtatEteint;
  attention: number;
  /** Où il va : la source perçue, le dernier endroit où il a vu quelqu'un, ou un point d'errance. */
  but: { x: number; z: number } | null;
  /** Secondes depuis qu'il a perdu de vue sa proie. */
  perdu: number;
  /** Secondes avant de choisir un nouveau point d'errance. */
  flane: number;
  /** Coups reçus au torse (Book 06 §2.2 : plusieurs coups, il tombe). */
  degats: number;
  /** Secondes de vacillement après un coup : il lâche prise et ne bouge plus. */
  etourdi: number;
  /** Secondes avant de se relever, quand il est à terre. */
  aTerre: number;
  /** L'humain qu'il tient (Book 06 §2.3), et depuis combien de temps. */
  saisit: number | null;
  tenue: number;
  /** Secondes passées au contact de sa proie : au-delà de DELAI_SAISIE, il saisit. */
  contact: number;
  /** Détruit : depuis combien de temps le corps est là. */
  corps: number;
  /** Mis en scène par le tutoriel : il ne mord jamais (Book 14 §5, validé le 2026-10-08). */
  tuto?: boolean;
}

/** Ce que voit un Éteint d'un humain proche. */
export interface Humain {
  id: number;
  x: number;
  z: number;
  /** Allure discrète : il se fond dans le décor. */
  discret: boolean;
  /** Lumière portée allumée la nuit : on le voit de loin. */
  eclaire: boolean;
  /** En pleine esquive : on ne peut pas le saisir. */
  intouchable?: boolean;
}

export interface EteintVu {
  id: number;
  x: number;
  z: number;
  o: number;
  etat: EtatEteint;
  /** Il tient quelqu'un (pour l'animation). */
  saisit?: true;
  /** Il vient d'être frappé. */
  etourdi?: true;
}

/**
 * Vitesses (m/s). Book 06 §2.1 : ≈ 0,6 m/s en marche, 0,9 en poursuite, pour un humain qui marche à 1,4.
 * Le jeu accélère la marche humaine (2,4 m/s) : on garde les mêmes rapports. Qui marche les distance ;
 * qui avance en allure discrète (1,2 m/s) se fait rattraper par un poursuivant.
 */
export const VITESSES: Record<EtatEteint, number> = { dormant: 0, errant: 0.45, attire: 1.0, poursuivant: 1.55, a_terre: 0, detruit: 0 };

/** Seuils d'attention (Book 06 §3.1). */
export const SEUIL_ATTIRE = 1;
export const SEUIL_REVEIL = 0.8;
export const ATTENTION_MAX = 5;
/** Oubli par seconde, quand plus rien n'est perçu. */
export const OUBLI = 0.12;
/** Les dormants n'entendent qu'à moitié (Book 06 §4 : invisibles tant qu'on ne s'approche pas). */
const OUIE_DORMANT = 0.5;
/** Vue : mauvaise (Book 06 §2.1). Le jour ≈ 12 m, la nuit ≈ 5 m ; bien plus si l'humain porte une lumière. */
export const VUE_JOUR = 12;
export const VUE_NUIT = 5;
export const VUE_LUMIERE = 16;
/** Distance de contact : il s'arrête là, et au bout d'un instant il saisit (Book 06 §2.3). */
export const CONTACT = 0.9;
/** Comportement grégaire (Book 06 §4) : un voisin en marche est un stimulus faible. */
const GREGAIRE = { portee: 8, intensite: 0.15 };
/** Il oublie la proie qu'il ne voit plus au bout de quelques secondes, et va voir le dernier endroit. */
const PATIENCE = 4;

export function vue(e: Eteint): EteintVu {
  const v: EteintVu = { id: e.id, x: Math.round(e.x * 100) / 100, z: Math.round(e.z * 100) / 100, o: Math.round(e.o * 100) / 100, etat: e.etat };
  if (e.saisit !== null) v.saisit = true;
  if (e.etourdi > 0) v.etourdi = true;
  return v;
}

/** Le résultat d'un coup porté à un Éteint. */
export type ResultatCoup = "detruit" | "a_terre" | "vacille";

/**
 * Un coup (Book 06 §2.2) : à la tête avec une arme solide, il est détruit ; au torse, il vacille, puis tombe
 * au bout de plusieurs coups, et se relève s'il n'est pas achevé : au sol, tout coup le détruit. `force` : 1, ou moins si l'on est épuisé.
 */
export function encaisser(e: Eteint, arme: Arme, appuye: boolean, force: number, de: { x: number; z: number }, zone: Zone): ResultatCoup {
  e.saisit = null;
  e.tenue = 0;
  e.contact = 0;
  e.attention = Math.max(e.attention, 2);
  if (e.etat === "dormant") e.etat = "poursuivant";
  // À terre, la tête est à portée : n'importe quel coup l'achève, même au couteau ou aux poings (décision du 2026-10-08).
  const auSol = e.etat === "a_terre";
  if (auSol || (appuye && arme.tueALaTete && force >= 1)) {
    e.etat = "detruit";
    e.corps = 0;
    e.but = null;
    return "detruit";
  }
  e.degats += arme.degatsTorse * force * (appuye ? 2 : 1);
  if (e.degats >= RESISTANCE_TORSE) {
    e.etat = "a_terre";
    e.aTerre = DUREE_A_TERRE;
    e.degats = 0;
    return "a_terre";
  }
  e.etourdi = DUREE_ETOURDI;
  // Le coup le fait reculer d'un pas.
  const d = Math.hypot(e.x - de.x, e.z - de.z) || 1;
  deplacer(e, ((e.x - de.x) / d) * 0.6, ((e.z - de.z) / d) * 0.6, zone);
  return "vacille";
}

/** Un humain se dégage (ou esquive) : celui qui le tenait lâche et vacille. */
export function lacher(e: Eteint, de: { x: number; z: number }, zone: Zone): void {
  e.saisit = null;
  e.tenue = 0;
  e.contact = 0;
  e.etourdi = DUREE_ETOURDI;
  const d = Math.hypot(e.x - de.x, e.z - de.z) || 1;
  deplacer(e, ((e.x - de.x) / d) * 0.8, ((e.z - de.z) / d) * 0.8, zone);
}

function voit(e: Eteint, h: Humain, nuit: boolean): boolean {
  let portee = nuit ? (h.eclaire ? VUE_LUMIERE : VUE_NUIT) : VUE_JOUR;
  if (h.discret && !h.eclaire) portee *= 0.5;
  return Math.hypot(h.x - e.x, h.z - e.z) <= portee;
}

/**
 * Un pas de calcul pour un Éteint : perception, décision, déplacement.
 * `voisins` : les autres Éteints du lieu (comportement grégaire). `alea` : tirage entre 0 et 1.
 */
export function penser(
  e: Eteint,
  dt: number,
  stimuli: readonly Stimulus[],
  humains: readonly Humain[],
  voisins: readonly Eteint[],
  nuit: boolean,
  zone: Zone,
  alea: () => number,
): void {
  if (e.etat === "detruit") {
    e.corps += dt;
    return;
  }
  if (e.etat === "a_terre") {
    e.aTerre -= dt;
    if (e.aTerre <= 0) e.etat = "poursuivant";
    return;
  }

  // 1. Percevoir : l'attention monte avec ce qu'il entend, sent ou voit briller, selon la distance.
  let percu = false;
  let meilleur = 0;
  for (const s of stimuli) {
    if (e.etat === "dormant" && s.genre !== "son") continue;
    const portee = e.etat === "dormant" ? s.portee * OUIE_DORMANT : s.portee;
    const d = Math.hypot(s.x - e.x, s.z - e.z);
    if (d >= portee) continue;
    const apport = s.intensite * (1 - d / portee);
    e.attention += apport * dt;
    percu = true;
    // Il se tourne vers la source la plus forte.
    if (apport > meilleur) {
      meilleur = apport;
      if (e.etat !== "poursuivant") e.but = { x: s.x, z: s.z };
    }
  }
  if (e.etat !== "dormant") {
    for (const v of voisins) {
      if (v === e || (v.etat !== "attire" && v.etat !== "poursuivant") || !v.but) continue;
      const d = Math.hypot(v.x - e.x, v.z - e.z);
      if (d >= GREGAIRE.portee) continue;
      e.attention += GREGAIRE.intensite * (1 - d / GREGAIRE.portee) * dt;
      percu = true;
      if (meilleur === 0 && e.etat === "errant") e.but = { ...v.but };
    }
  }
  if (!percu) e.attention -= OUBLI * dt;
  e.attention = Math.max(0, Math.min(ATTENTION_MAX, e.attention));

  // 2. Décider
  if (e.etat === "dormant") {
    if (e.attention >= SEUIL_REVEIL) e.etat = "attire";
    else return;
  }
  if (e.etourdi > 0) {
    e.etourdi -= dt;
    return;
  }
  // Il tient quelqu'un : il ne lâche pas, sauf si l'humain s'est dégagé ou éloigné (Book 06 §2.3).
  if (e.saisit !== null) {
    const tenu = humains.find((h) => h.id === e.saisit);
    if (!tenu || tenu.intouchable || Math.hypot(tenu.x - e.x, tenu.z - e.z) > CONTACT + 0.6) {
      e.saisit = null;
      e.tenue = 0;
    } else {
      e.tenue += dt;
      e.o = Math.atan2(tenu.x - e.x, tenu.z - e.z);
      return;
    }
  }
  const proie = humains
    .filter((h) => voit(e, h, nuit))
    .sort((a, b) => Math.hypot(a.x - e.x, a.z - e.z) - Math.hypot(b.x - e.x, b.z - e.z))[0];
  if (proie) {
    e.etat = "poursuivant";
    e.but = { x: proie.x, z: proie.z };
    e.perdu = 0;
    e.attention = Math.max(e.attention, SEUIL_ATTIRE + 1);
    // Au contact un instant, il attrape.
    if (Math.hypot(proie.x - e.x, proie.z - e.z) <= CONTACT + 0.15 && !proie.intouchable) {
      e.contact += dt;
      if (e.contact >= DELAI_SAISIE) {
        e.saisit = proie.id;
        e.tenue = 0;
        e.contact = 0;
        return;
      }
    } else e.contact = 0;
  } else if (e.etat === "poursuivant") {
    e.perdu += dt;
    // Il continue vers le dernier point vu, puis se contente d'y aller (Book 06 §3.1).
    if (e.perdu > PATIENCE) e.etat = "attire";
  }
  if (e.etat === "errant" && e.attention >= SEUIL_ATTIRE && e.but) e.etat = "attire";
  if (e.etat === "attire" && e.but && Math.hypot(e.but.x - e.x, e.but.z - e.z) < 1 && e.attention < SEUIL_ATTIRE) {
    e.etat = "errant";
    e.but = null;
  }
  if (e.etat === "attire" && !e.but) e.etat = "errant";

  // 3. Errer : un point au hasard, pas loin, de temps en temps.
  if (e.etat === "errant") {
    e.flane -= dt;
    if (e.flane <= 0 || !e.but) {
      e.flane = 6 + alea() * 8;
      const a = alea() * Math.PI * 2;
      const r = 2 + alea() * 6;
      e.but = alea() < 0.35 ? null : { x: e.x + Math.cos(a) * r, z: e.z + Math.sin(a) * r };
    }
  }

  // 4. Avancer vers le but, sans traverser les obstacles ; il s'arrête au contact d'un humain.
  if (!e.but) return;
  const dx = e.but.x - e.x;
  const dz = e.but.z - e.z;
  const d = Math.hypot(dx, dz);
  const arret = e.etat === "poursuivant" ? CONTACT : 0.2;
  if (d <= arret) return;
  const pas = Math.min(d - arret, VITESSES[e.etat] * dt);
  deplacer(e, (dx / d) * pas, (dz / d) * pas, zone);
  e.o = Math.atan2(dx, dz);
}

/** Avance en glissant le long des obstacles (comme les joueurs) ; un Éteint ne contourne rien (Book 06 §2.1). */
function deplacer(e: Eteint, dx: number, dz: number, zone: Zone): void {
  const libre = (x: number, z: number) =>
    x >= zone.xMin && x <= zone.xMax && z >= zone.zMin && z <= zone.zMax && !heurte(zone, x, z, 0.3);
  if (libre(e.x + dx, e.z + dz)) {
    e.x += dx;
    e.z += dz;
  } else if (libre(e.x + dx, e.z)) e.x += dx;
  else if (libre(e.x, e.z + dz)) e.z += dz;
}

export function nouvelEteint(id: number, x: number, z: number, etat: EtatEteint, o = 0): Eteint {
  return { id, x, z, o, etat, attention: 0, but: null, perdu: 0, flane: 0, degats: 0, etourdi: 0, aTerre: 0, saisit: null, tenue: 0, contact: 0, corps: 0 };
}

/** Ceux qui peuvent encore agir (ni à terre, ni détruits). */
export function debout(e: Eteint): boolean {
  return e.etat !== "a_terre" && e.etat !== "detruit";
}
