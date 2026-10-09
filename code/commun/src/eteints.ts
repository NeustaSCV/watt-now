// Les Éteints de la 0a (Book 21 §3.5) : l'Errant seul, avec quatre états — dormant, errant, attiré, poursuivant.
// Book 06 : lents, bêtes, guidés par l'ouïe ; la vue est mauvaise. L'attention monte avec intensité × durée,
// et retombe quand plus rien ne se passe.

import { BONUS_ETOURDI_CONTONDANT, DELAI_SAISIE, DUREE_A_TERRE, DUREE_A_TERRE_ELECTRIQUE, DUREE_ETOURDI, PORTEE_SAUT_DECHARGE, RESISTANCE_TORSE, type Arme } from "./combat.ts";
import { heurte, type Zone } from "./lieux.ts";
import { voieLibre } from "./murs.ts";
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
  // ---------- La Coopérative (Book 23 §3, 0.5c) ----------
  /** Une variante (Book 06 §5) ; sans : l'Errant ordinaire. */
  variante?: VarianteEteint;
  /** Son groupe (comportement grégaire) : quand l'un bouge, les autres suivent. */
  groupe?: number;
  /** Sa zone : il y revient quand il a perdu le joueur de vue depuis 3 minutes, et y erre. */
  maison?: { x: number; z: number };
  /** Il dormait là au départ : revenu chez lui et calmé, il se rendort. */
  dormeur?: boolean;
  /** Secondes sans voir personne. */
  sansVoir?: number;
  /** Secondes de gémissement qui restent (un dormant qui se réveille gémit : la cascade). */
  gemit?: number;
  // ---------- Le métier des familles (Book 25 §5.1, 0.6) ----------
  /**
   * Secondes de tétanie qui restent : une décharge l'a raidi (il ne bouge plus, ne saisit plus). Il est aussi
   * étourdi pendant ce temps ; ce champ sert à le montrer raidi plutôt que vacillant.
   */
  raidi?: number;
  /** Détruit par le courant : « il s'éteint » (le client le montre s'affaisser, les yeux qui ternissent). */
  eteintParLeCourant?: boolean;
  /** Secondes pendant lesquelles un piège le tient sur place (mâchoires, Book 25 §6.3) : il ne peut plus avancer. */
  retenu?: number;
}

/** Les variantes de la Coopérative : le Rampant, l'Équipé (casque de moto), les anciens habitants. */
export type VarianteEteint = "rampant" | "equipe" | "magasinier" | "mecanicien";

/**
 * Ce que l'endroit fait à la perception et aux déplacements (Book 23 §7). Sans milieu, tout est à ciel ouvert :
 * c'est le terrain. La Coopérative en a un (milieu-coop.ts) ; la halte aussi, pour la vue seulement (les murs de la
 * boutique, 0.7.2).
 */
export interface Milieu {
  /** Ce qu'un son garde (0 à 1) entre deux points : 1 dans la même pièce, bien moins à travers une porte ou un mur. */
  son(ax: number, az: number, bx: number, bz: number): number;
  /** La vue passe-t-elle de a à b ? (en ligne droite, ni mur ni porte fermée entre les deux : commun/src/vue.ts) */
  vue(ax: number, az: number, bx: number, bz: number): boolean;
  /** Fait-il noir ici, même en plein jour ? */
  obscur(x: number, z: number): boolean;
  /** Le prochain point où aller pour rejoindre b depuis a (par les portes). */
  passage(ax: number, az: number, bx: number, bz: number): { x: number; z: number };
  /** Un dormant qui se réveille gémit, et réveille ses voisins (Book 23 §3) ; false : pas ici (la halte, 0.7.2). */
  cascade?: boolean;
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
  /** Sa variante, pour le dessiner (le Rampant au sol, l'Équipé casqué). */
  variante?: VarianteEteint;
  /** Il gémit : il vient de se réveiller (on l'entend). */
  gemit?: true;
  /**
   * Un dormant que la signature atteint remue (de 0,1 à 1 : 1, il se réveille). Le joueur voit le lien entre son cercle
   * et le réveil qui vient : les yeux s'entrouvrent, le corps commence à se soulever.
   */
  eveil?: number;
  /** Raidi par une décharge (Book 25 §5.1) : la pose tétanisée, de petits arcs bleus. */
  raidi?: true;
  /** Détruit par le courant : il s'affaisse, les yeux ternissent (pas de sang). */
  eteintParLeCourant?: true;
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
/**
 * La règle du cercle (bug du 2026-10-09) : si le cercle de signature affiché touche un Éteint, il réagit. La formule du
 * Book 06 §3.1 (intensité × (1 − d / portée)) ne donnait presque rien au bord du cercle ; on lui garde ce plancher, pour
 * que tout ce qui est dans le cercle compte (au bord, un dormant met une dizaine de secondes à se réveiller au pas).
 * Les dormants entendent tout le cercle (ils n'entendaient qu'à moitié : le cercle les touchait sans effet) et voient
 * la lumière qu'on porte (le cercle ambre) ; seule l'odeur, que le cercle ne montre pas, ne les tire pas du sommeil.
 */
export const PLANCHER_PERCEPTION = 0.2;
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
/** Un dormant qui se réveille gémit (Book 23 §3) : un bruit de 6 m, pendant 1,5 s. */
export const GEMISSEMENT = { portee: 6, intensite: 1.6, duree: 1.5 };
/** Sans voir personne depuis 3 minutes, il retourne dans sa zone (Book 23 §2.3). */
export const RETOUR_ZONE_S = 180;
/** Un groupe se suit : le voisin qui bouge entraîne les autres du groupe, jusqu'à cette distance. */
const GROUPE = { portee: 14, intensite: 0.9 };
/** Le Rampant, au sol, avance lentement. */
const VITESSE_RAMPANT = 0.55;

export function vue(e: Eteint): EteintVu {
  const v: EteintVu = { id: e.id, x: Math.round(e.x * 100) / 100, z: Math.round(e.z * 100) / 100, o: Math.round(e.o * 100) / 100, etat: e.etat };
  if (e.saisit !== null) v.saisit = true;
  if (e.etourdi > 0) v.etourdi = true;
  if (e.variante) v.variante = e.variante;
  if ((e.gemit ?? 0) > 0) v.gemit = true;
  if (e.etat === "dormant" && e.attention > 0) v.eveil = Math.max(0.1, Math.round(Math.min(1, e.attention / SEUIL_REVEIL) * 10) / 10);
  if ((e.raidi ?? 0) > 0 && e.etat !== "detruit") v.raidi = true;
  if (e.eteintParLeCourant && e.etat === "detruit") v.eteintParLeCourant = true;
  return v;
}

/** Le résultat d'un coup porté à un Éteint. « raidi » : une décharge courte l'a tétanisé (Book 25 §5.1). */
export type ResultatCoup = "detruit" | "a_terre" | "vacille" | "raidi";

/** Ce que fait un coup, et à qui : l'électricité peut raidir un second Éteint (★★★, la décharge saute). */
export interface EffetCoup {
  resultat: ResultatCoup;
  /** Un voisin raidi par la décharge qui a sauté. */
  voisinRaidi?: Eteint;
}

function detruire(e: Eteint): ResultatCoup {
  e.etat = "detruit";
  e.corps = 0;
  e.but = null;
  e.raidi = 0;
  e.etourdi = 0;
  return "detruit";
}

/** Raidir un Éteint (Book 25 §5.1) : il lâche, ne bouge plus, ne saisit plus, pendant `secondes`. */
export function raidir(e: Eteint, secondes: number): void {
  e.saisit = null;
  e.tenue = 0;
  e.contact = 0;
  if (e.etat === "dormant") e.etat = "poursuivant";
  e.etourdi = Math.max(e.etourdi, secondes);
  e.raidi = Math.max(e.raidi ?? 0, secondes);
}

/** Le mettre à terre (un piège, la décharge longue) : il se relèvera au bout de `secondes`. */
export function mettreATerre(e: Eteint, secondes: number): void {
  e.saisit = null;
  e.tenue = 0;
  e.contact = 0;
  e.etat = "a_terre";
  e.aTerre = Math.max(e.aTerre, secondes);
  e.degats = 0;
  e.raidi = 0;
}

/**
 * La règle électrique (Book 25 §5.1 et §8.2), la même pour toutes les armes électriques : une décharge courte le fait
 * lâcher et le raidit ; maintenue sur un Éteint debout, elle le met à terre ; maintenue à la tête d'un Éteint raidi
 * (ou étourdi), ou n'importe quelle décharge sur un Éteint à terre, elle le détruit. Le casque n'y change rien, et
 * rien ne va au torse.
 */
function encaisserDecharge(e: Eteint, arme: Arme, appuye: boolean, voisins: readonly Eteint[], zone: Zone): EffetCoup {
  const auSol = e.etat === "a_terre" || e.variante === "rampant";
  const pris = e.etourdi > 0 || (e.raidi ?? 0) > 0;
  if (auSol || (appuye && pris)) {
    e.eteintParLeCourant = true;
    return { resultat: detruire(e) };
  }
  if (appuye) {
    mettreATerre(e, DUREE_A_TERRE_ELECTRIQUE);
    return { resultat: "a_terre" };
  }
  const elec = arme.electrique;
  raidir(e, elec?.raidi ?? DUREE_ETOURDI);
  if (!elec?.saute) return { resultat: "raidi" };
  // ★★★ et plus : la courte saute au plus proche voisin debout, à moins d'un mètre.
  let voisin: Eteint | undefined;
  let meilleure = PORTEE_SAUT_DECHARGE;
  for (const v of voisins) {
    if (v === e || !debout(v) || v.etat === "dormant") continue;
    // Le courant ne saute pas à travers un mur (0.7.1).
    if (!voieLibre(zone, e, v)) continue;
    const d = Math.hypot(v.x - e.x, v.z - e.z);
    if (d <= meilleure) {
      meilleure = d;
      voisin = v;
    }
  }
  if (voisin) raidir(voisin, elec.raidi);
  return voisin ? { resultat: "raidi", voisinRaidi: voisin } : { resultat: "raidi" };
}

/**
 * Un coup, avec tout ce qu'il fait (le voisin raidi d'une décharge qui saute). `encaisser` en est la forme courte.
 * `voisins` : les autres Éteints du lieu.
 */
export function encaisserCoup(e: Eteint, arme: Arme, appuye: boolean, force: number, de: { x: number; z: number }, zone: Zone, voisins: readonly Eteint[] = []): EffetCoup {
  if (arme.type !== "electrique") return { resultat: encaisser(e, arme, appuye, force, de, zone) };
  e.saisit = null;
  e.tenue = 0;
  e.contact = 0;
  e.attention = Math.max(e.attention, 2);
  if (e.etat === "dormant") e.etat = "poursuivant";
  return encaisserDecharge(e, arme, appuye, voisins, zone);
}

/**
 * Un coup (Book 06 §2.2) : à la tête avec une arme solide, il est détruit ; au torse, il vacille, puis tombe
 * au bout de plusieurs coups, et se relève s'il n'est pas achevé : au sol, tout coup le détruit. `force` : 1, ou moins si l'on est épuisé.
 */
export function encaisser(e: Eteint, arme: Arme, appuye: boolean, force: number, de: { x: number; z: number }, zone: Zone, voisins: readonly Eteint[] = []): ResultatCoup {
  // L'électricité a sa règle à elle (Book 25 §5.1) : rien au torse, le casque n'y fait rien.
  if (arme.type === "electrique") return encaisserCoup(e, arme, appuye, force, de, zone, voisins).resultat;
  e.saisit = null;
  e.tenue = 0;
  e.contact = 0;
  e.attention = Math.max(e.attention, 2);
  if (e.etat === "dormant") e.etat = "poursuivant";
  // À terre, la tête est à portée : n'importe quel coup l'achève, même au couteau ou aux poings (décision du 2026-10-08).
  // Le Rampant est déjà au sol : un coup l'achève (Book 23 §3, Book 06 §8.4).
  const auSol = e.etat === "a_terre" || e.variante === "rampant";
  // Le casque de l'Équipé (Book 23 §4.2) : à la tête, le tranchant glisse ; au sol, seuls le contondant et le perçant
  // l'achèvent.
  const casque = e.variante === "equipe" && arme.type === "tranchant";
  if ((auSol && !casque) || (appuye && arme.tueALaTete && force >= 1 && !casque && !auSol)) return detruire(e);
  e.degats += arme.degatsTorse * force * (appuye ? 2 : 1);
  // L'Équipé (blouson, casque) encaisse un coup de plus au torse (Book 23 §3).
  if (e.degats >= RESISTANCE_TORSE + (e.variante === "equipe" ? 1 : 0)) {
    e.etat = "a_terre";
    e.aTerre = DUREE_A_TERRE;
    e.degats = 0;
    e.raidi = 0;
    return "a_terre";
  }
  const vacille = DUREE_ETOURDI * (arme.type === "contondant" && arme.objet !== null ? BONUS_ETOURDI_CONTONDANT : 1);
  // Raidi par une décharge, un coup ne raccourcit pas la tétanie.
  e.etourdi = (e.raidi ?? 0) > 0 ? Math.max(e.etourdi, vacille) : vacille;
  // Le coup le fait reculer d'un pas.
  const d = Math.hypot(e.x - de.x, e.z - de.z) || 1;
  deplacer(e, ((e.x - de.x) / d) * 0.6, ((e.z - de.z) / d) * 0.6, zone);
  return "vacille";
}

/** Repoussé (Book 23 §4.4) : il lâche, recule de `recul` mètres (sans traverser les murs) et reste étourdi un instant. */
export function repousser(e: Eteint, de: { x: number; z: number }, recul: number, etourdi: number, zone: Zone): void {
  e.saisit = null;
  e.tenue = 0;
  e.contact = 0;
  e.etourdi = Math.max(e.etourdi, etourdi);
  if (e.etat === "dormant") e.etat = "poursuivant";
  const d = Math.hypot(e.x - de.x, e.z - de.z) || 1;
  // Par petits pas, pour glisser le long d'un mur plutôt que de le traverser.
  for (let i = 0; i < 6; i++) deplacer(e, (((e.x - de.x) / d) * recul) / 6, (((e.z - de.z) / d) * recul) / 6, zone);
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

function voit(e: Eteint, h: Humain, nuit: boolean, milieu?: Milieu): boolean {
  // Dans une pièce noire, il fait nuit en plein jour (l'obscurité est locale, Book 23 §7).
  const noir = nuit || (milieu?.obscur(h.x, h.z) ?? false);
  let portee = noir ? (h.eclaire ? VUE_LUMIERE : VUE_NUIT) : VUE_JOUR;
  if (h.discret && !h.eclaire) portee *= 0.5;
  if (Math.hypot(h.x - e.x, h.z - e.z) > portee) return false;
  // Les murs arrêtent la vue : même pièce, ou par l'embrasure d'une porte ouverte.
  return !milieu || milieu.vue(e.x, e.z, h.x, h.z);
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
  /** Ce que l'endroit fait à la perception (la Coopérative) ; sans : à ciel ouvert. */
  milieu?: Milieu,
): void {
  if (e.etat === "detruit") {
    e.corps += dt;
    return;
  }
  if ((e.gemit ?? 0) > 0) e.gemit = Math.max(0, e.gemit! - dt);
  if (e.etat === "a_terre") {
    e.aTerre -= dt;
    if (e.aTerre <= 0) e.etat = "poursuivant";
    return;
  }

  // 1. Percevoir : l'attention monte avec ce qu'il entend, sent ou voit briller, selon la distance.
  let percu = false;
  let meilleur = 0;
  for (const s of stimuli) {
    if (e.etat === "dormant" && s.genre === "odeur") continue;
    // Les murs étouffent le son : à travers une porte fermée, presque rien n'arrive (Book 23 §7).
    const attenue = milieu ? milieu.son(s.x, s.z, e.x, e.z) : 1;
    const portee = s.portee * attenue;
    const d = Math.hypot(s.x - e.x, s.z - e.z);
    if (d >= portee) continue;
    const apport = s.intensite * Math.max(PLANCHER_PERCEPTION, 1 - d / portee);
    e.attention += apport * dt;
    percu = true;
    // Il se tourne vers la source la plus forte.
    if (apport > meilleur) {
      meilleur = apport;
      if (e.etat !== "poursuivant") e.but = { x: s.x, z: s.z };
    }
  }
  if (e.etat !== "dormant" || e.groupe !== undefined) {
    for (const v of voisins) {
      if (v === e || (v.etat !== "attire" && v.etat !== "poursuivant") || !v.but) continue;
      // Un groupe se suit de plus loin et bien plus fort ; les autres, à peine (Book 06 §4, Book 23 §3).
      const memeGroupe = e.groupe !== undefined && v.groupe === e.groupe;
      if (e.etat === "dormant" && !memeGroupe) continue;
      const g = memeGroupe ? GROUPE : GREGAIRE;
      const d = Math.hypot(v.x - e.x, v.z - e.z);
      if (d >= g.portee) continue;
      e.attention += g.intensite * (1 - d / g.portee) * dt;
      percu = true;
      if (meilleur === 0 && (e.etat === "errant" || e.etat === "dormant" || (memeGroupe && e.etat === "attire"))) e.but = { ...v.but };
    }
  }
  if (!percu) e.attention -= OUBLI * dt;
  e.attention = Math.max(0, Math.min(ATTENTION_MAX, e.attention));

  // 2. Décider
  if (e.etat === "dormant") {
    if (e.attention < SEUIL_REVEIL) return;
    e.etat = "attire";
    // Il se réveille en gémissant : ses voisins l'entendent (la cascade).
    if (milieu && milieu.cascade !== false) e.gemit = GEMISSEMENT.duree;
  }
  if ((e.raidi ?? 0) > 0) e.raidi = Math.max(0, e.raidi! - dt);
  if (e.etourdi > 0) {
    e.etourdi -= dt;
    return;
  }
  // Il tient quelqu'un : il ne lâche pas, sauf si l'humain s'est dégagé ou éloigné (Book 06 §2.3).
  if (e.saisit !== null) {
    const tenu = humains.find((h) => h.id === e.saisit);
    // Un mur entre eux (0.7.1) : il ne tient plus personne.
    if (!tenu || tenu.intouchable || Math.hypot(tenu.x - e.x, tenu.z - e.z) > CONTACT + 0.6 || !voieLibre(zone, e, tenu)) {
      e.saisit = null;
      e.tenue = 0;
    } else {
      e.tenue += dt;
      e.o = Math.atan2(tenu.x - e.x, tenu.z - e.z);
      return;
    }
  }
  const proie = humains
    .filter((h) => voit(e, h, nuit, milieu))
    .sort((a, b) => Math.hypot(a.x - e.x, a.z - e.z) - Math.hypot(b.x - e.x, b.z - e.z))[0];
  e.sansVoir = proie ? 0 : (e.sansVoir ?? 0) + dt;
  if (proie) {
    e.etat = "poursuivant";
    e.but = { x: proie.x, z: proie.z };
    e.perdu = 0;
    e.attention = Math.max(e.attention, SEUIL_ATTIRE + 1);
    // Au contact un instant, il attrape ; jamais à travers un mur (0.7.1 : ni saisie, ni morsure).
    if (Math.hypot(proie.x - e.x, proie.z - e.z) <= CONTACT + 0.15 && !proie.intouchable && voieLibre(zone, e, proie)) {
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

  // 3. Errer : un point au hasard, pas loin, de temps en temps ; autour de chez lui s'il a une zone.
  if (e.etat === "errant") {
    const maison = e.maison;
    const loinDeChezLui = maison && Math.hypot(maison.x - e.x, maison.z - e.z) > 5;
    if (maison && loinDeChezLui && (e.sansVoir ?? 0) >= RETOUR_ZONE_S) {
      // Trois minutes sans voir personne : il rentre (Book 23 §2.3 : il ne campe pas à l'entrée).
      e.but = { ...maison };
    } else if (maison && !loinDeChezLui && e.dormeur && (e.sansVoir ?? 0) >= RETOUR_ZONE_S && e.attention === 0) {
      e.etat = "dormant";
      e.but = null;
      return;
    } else {
      e.flane -= dt;
      if (e.flane <= 0 || !e.but) {
        e.flane = 6 + alea() * 8;
        const a = alea() * Math.PI * 2;
        const r = 2 + alea() * 6;
        const centre = maison && !loinDeChezLui ? maison : e;
        // Un dormeur revenu chez lui ne bouge plus guère ; les autres flânent.
        e.but = alea() < (e.dormeur ? 0.8 : 0.35) ? null : { x: centre.x + Math.cos(a) * r, z: centre.z + Math.sin(a) * r };
      }
    }
  }

  // 4. Avancer vers le but, sans traverser les obstacles ; il s'arrête au contact d'un humain.
  // Tenu par un piège (Book 25 §6.3), il se débat sur place : il saisit encore qui s'approche, mais n'avance plus.
  if ((e.retenu ?? 0) > 0) {
    e.retenu = Math.max(0, e.retenu! - dt);
    return;
  }
  if (!e.but) return;
  const arret = e.etat === "poursuivant" ? CONTACT : 0.2;
  const dBut = Math.hypot(e.but.x - e.x, e.but.z - e.z);
  if (dBut <= arret) return;
  // Dans un bâtiment, on passe par les portes (Book 23 §7) : le prochain point du chemin.
  const vers = milieu ? milieu.passage(e.x, e.z, e.but.x, e.but.z) : e.but;
  const dx = vers.x - e.x;
  const dz = vers.z - e.z;
  const d = Math.hypot(dx, dz);
  if (d < 1e-6) return;
  const vitesse = e.variante === "rampant" ? Math.min(VITESSES[e.etat], VITESSE_RAMPANT) : VITESSES[e.etat];
  // Le dernier tronçon s'arrête au contact ; un point de passage, on le dépasse.
  const final = Math.abs(vers.x - e.but.x) < 1e-6 && Math.abs(vers.z - e.but.z) < 1e-6;
  const pas = Math.min(final ? d - arret : d, vitesse * dt);
  if (pas <= 0) return;
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
