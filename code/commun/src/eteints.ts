// Les Éteints de la 0a (Book 21 §3.5) : l'Errant seul, avec quatre états — dormant, errant, attiré, poursuivant.
// Book 06 : lents, bêtes, guidés par l'ouïe ; la vue est mauvaise. L'attention monte avec intensité × durée,
// et retombe quand plus rien ne se passe.

import { BONUS_ETOURDI_CONTONDANT, DELAI_SAISIE, DUREE_A_TERRE, DUREE_CORPS, DUREE_A_TERRE_ELECTRIQUE, DUREE_ETOURDI, PORTEE_SAUT_DECHARGE, RESISTANCE_TORSE, type Arme } from "./combat.ts";
import { heurte, type Zone } from "./lieux.ts";
import { REGLAGES } from "./reglages.ts";
import { voieLibre } from "./murs.ts";
import { NOYE_ODEUR, type Stimulus } from "./signature.ts";

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
  // ---------- L'Équipé encaisse (plan 0.9 §3.3) ----------
  /** Coups reçus depuis qu'il est debout : l'Équipé ne vacille qu'un coup sur N (`tientLeCoup`). Remis à zéro à terre. */
  coupsRecus?: number;
  // ---------- Le Noyé (0.10, chantier G) ----------
  /** Le Noyé à la jambe brisée : il rampe, et reste un Noyé (il crèvera en mourant). Les autres deviennent des Rampants. */
  jambeBrisee?: boolean;
  /** Le Noyé détruit a crevé : ses fluides et son odeur sont partis (une seule fois, `noyesQuiCrevent`). */
  creve?: boolean;
}

/**
 * Les variantes de la Coopérative : le Rampant, l'Équipé (casque de moto), les anciens habitants ; celles de la côte
 * (0.10) : le Noyé, gonflé par l'eau, et l'Ensablé, un Rampant dormeur enfoui dans le sable.
 */
export type VarianteEteint = "rampant" | "equipe" | "magasinier" | "mecanicien" | "noye" | "ensable";

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
  /**
   * Peut-on, de a, saisir ou frapper qui est en b ? (même étage du relief : au phare, le plateau, la grève, le pont de
   * l'épave, 0.10) ; absent : partout.
   */
  atteint?(ax: number, az: number, bx: number, bz: number): boolean;
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
  // ---------- À terre ou détruit, au corps (plan 0.9, chantier F) ----------
  /** À terre, il va se relever : ses dernières secondes au sol (SE_RELEVE_S). Il prend appui. */
  seReleve?: true;
  /** Détruit, le corps va être retiré : ses dernières secondes (EFFACEMENT_S). Il s'efface doucement. */
  efface?: true;
  /** Le Noyé à la jambe brisée (0.10) : il rampe. */
  rampe?: true;
}

/** À terre, il prend appui ces dernières secondes avant de se relever : le geste annonce le danger (chantier F). */
export const SE_RELEVE_S = 1.6;
/** Le corps détruit s'efface pendant ces dernières secondes avant d'être retiré (DUREE_CORPS), au lieu de disparaître. */
export const EFFACEMENT_S = 4;

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
  // À terre ou détruit, au corps (chantier F).
  if (e.etat === "a_terre" && e.aTerre <= SE_RELEVE_S) v.seReleve = true;
  if (e.etat === "detruit" && e.corps >= DUREE_CORPS - EFFACEMENT_S) v.efface = true;
  if (e.jambeBrisee && e.variante === "noye") v.rampe = true;
  return v;
}

/**
 * Le résultat d'un coup porté à un Éteint. « raidi » : une décharge courte l'a tétanisé (Book 25 §5.1). « encaisse » :
 * l'Équipé a pris le coup sans vaciller (plan 0.9 §3.3).
 */
export type ResultatCoup = "detruit" | "a_terre" | "vacille" | "raidi" | "encaisse";

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
  e.coupsRecus = 0;
}

/**
 * La règle électrique (Book 25 §5.1 et §8.2), la même pour toutes les armes électriques : une décharge courte le fait
 * lâcher et le raidit ; maintenue sur un Éteint debout, elle le met à terre ; maintenue à la tête d'un Éteint raidi
 * (ou étourdi), ou n'importe quelle décharge sur un Éteint à terre, elle le détruit. Le casque n'y change rien.
 * Depuis la 0.8 (plan §2.4, `degats-electriques.md` E5 et E6), la courte ajoute aussi ses dégâts au torse : à 3 points
 * (4 pour l'Équipé), il tombe. La longue n'en fait pas : elle met à terre, ou elle détruit déjà.
 */
function encaisserDecharge(e: Eteint, arme: Arme, appuye: boolean, force: number, voisins: readonly Eteint[], zone: Zone): EffetCoup {
  const auSol = e.etat === "a_terre" || rampe(e);
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
  // La courte frappe le torse : à 3 points (4 pour l'Équipé), il tombe, comme sous un coup (le Noyé, jamais).
  e.degats += arme.degatsTorse * force;
  if (arme.degatsTorse > 0 && e.degats >= resistanceTorse(e)) {
    mettreATerre(e, DUREE_A_TERRE);
    return { resultat: "a_terre" };
  }
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
  return encaisserDecharge(e, arme, appuye, force, voisins, zone);
}

/**
 * Un coup (Book 06 §2.2) : à la tête avec une arme solide, il est détruit ; au torse, il vacille, puis tombe
 * au bout de plusieurs coups, et se relève s'il n'est pas achevé : au sol, tout coup le détruit. `force` : 1, ou moins si l'on est épuisé.
 */
export function encaisser(e: Eteint, arme: Arme, appuye: boolean, force: number, de: { x: number; z: number }, zone: Zone, voisins: readonly Eteint[] = []): ResultatCoup {
  // L'électricité a sa règle à elle (Book 25 §5.1) : le casque n'y fait rien.
  if (arme.type === "electrique") return encaisserCoup(e, arme, appuye, force, de, zone, voisins).resultat;
  // Ce qu'il tenait, si l'Équipé encaisse sans vaciller.
  const prise = { saisit: e.saisit, tenue: e.tenue, contact: e.contact };
  e.saisit = null;
  e.tenue = 0;
  e.contact = 0;
  e.attention = Math.max(e.attention, 2);
  if (e.etat === "dormant") e.etat = "poursuivant";
  // À terre, la tête est à portée : n'importe quel coup l'achève, même au couteau ou aux poings (décision du 2026-10-08).
  // Le Rampant est déjà au sol : un coup l'achève (Book 23 §3, Book 06 §8.4). L'Ensablé et le Noyé à la jambe brisée aussi.
  const auSol = e.etat === "a_terre" || rampe(e);
  // Le casque de l'Équipé (Book 23 §4.2) : à la tête, le tranchant glisse ; au sol, seuls le contondant et le perçant
  // l'achèvent.
  const casque = e.variante === "equipe" && arme.type === "tranchant";
  if ((auSol && !casque) || (appuye && arme.tueALaTete && force >= 1 && !casque && !auSol)) return detruire(e);
  e.degats += arme.degatsTorse * force * (appuye ? 2 : 1);
  // L'Équipé (blouson, casque) encaisse un coup de plus au torse (Book 23 §3) ; le Noyé ne tombe pas (resistanceTorse).
  if (e.degats >= resistanceTorse(e)) {
    e.etat = "a_terre";
    e.aTerre = DUREE_A_TERRE;
    e.degats = 0;
    e.raidi = 0;
    e.coupsRecus = 0;
    return "a_terre";
  }
  // À terre, la lame sur le casque ajoute ses dégâts au torse, sans le faire vaciller ni reculer (porteur, 2026-10-14).
  if (auSol) return "encaisse";
  // Un coup sur N, l'Équipé vacille (plan 0.9 §3.3) ; les autres : ni étourdi, ni recul, il garde sa prise et son contact.
  if (tientLeCoup(e)) {
    Object.assign(e, prise);
    return "encaisse";
  }
  const vacille = DUREE_ETOURDI * (arme.type === "contondant" && arme.objet !== null ? BONUS_ETOURDI_CONTONDANT : 1);
  // Raidi par une décharge, un coup ne raccourcit pas la tétanie.
  e.etourdi = (e.raidi ?? 0) > 0 ? Math.max(e.etourdi, vacille) : vacille;
  // Le coup le fait reculer d'un pas.
  const d = Math.hypot(e.x - de.x, e.z - de.z) || 1;
  deplacer(e, ((e.x - de.x) / d) * 0.6, ((e.z - de.z) / d) * 0.6, zone);
  return "vacille";
}

/**
 * L'Équipé encaisse (plan 0.9 §3.3) : un coup reçu de plus, et ne vacille-t-il pas ? Le premier coup le fait vaciller
 * (Q-8), puis un coup sur N (`REGLAGES.equipe_vacille_un_sur`, 3 par défaut, porteur 2026-10-14) ; les autres, il les prend sans broncher.
 * Le Noyé, lui, ne vacille jamais sous un coup au torse : sa masse l'encaisse (plan 0.10, V1-15). Les autres Éteints
 * vacillent à chaque coup. La poussée et la décharge ne passent pas par ici : elles font toujours vaciller.
 */
export function tientLeCoup(e: Eteint): boolean {
  if (e.variante === "noye") return true;
  if (e.variante !== "equipe") return false;
  const n = (e.coupsRecus ?? 0) + 1;
  e.coupsRecus = n;
  return (n - 1) % Math.max(1, Math.round(REGLAGES.equipe_vacille_un_sur)) !== 0;
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
    // Tombé, l'Équipé repart de zéro (plan 0.9 §3.3), par quelque chemin qu'il soit tombé (la fosse du rouet comprise).
    if (e.coupsRecus) e.coupsRecus = 0;
    e.aTerre -= dt;
    if (e.aTerre <= 0) e.etat = "poursuivant";
    return;
  }

  // 1. Percevoir : l'attention monte avec ce qu'il entend, sent ou voit briller, selon la distance.
  let percu = false;
  let meilleur = 0;
  // L'Ensablé dort sous le sable (0.10) : il ne perçoit rien, et surgit quand on passe tout près.
  if (e.variante === "ensable" && e.etat === "dormant" && !surgir(e, humains, zone)) return;
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
    if (!tenu || tenu.intouchable || Math.hypot(tenu.x - e.x, tenu.z - e.z) > CONTACT + 0.6 || !voieLibre(zone, e, tenu) || milieu?.atteint?.(e.x, e.z, tenu.x, tenu.z) === false) {
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
    // Pas d'un autre étage du relief (au phare : du pont de l'épave à la grève, par-dessus la coque).
    if (Math.hypot(proie.x - e.x, proie.z - e.z) <= CONTACT + 0.15 && !proie.intouchable && voieLibre(zone, e, proie) && milieu?.atteint?.(e.x, e.z, proie.x, proie.z) !== false) {
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
  // Le Noyé, gonflé, est lent en toutes choses (0.10) ; à la jambe brisée, il rampe, et pas plus vite.
  const plafond = Math.min(rampe(e) ? VITESSE_RAMPANT : Infinity, e.variante === "noye" ? VITESSE_NOYE : Infinity);
  // Ce que la zone freine (l'eau de la crique du phare, 0.10) : les Éteints y vont aussi, ralentis comme les joueurs.
  const vitesse = Math.min(VITESSES[e.etat], plafond) * (zone.frein?.(e.x, e.z) ?? 1);
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

// ---------- Le Noyé et l'Ensablé (0.10, chantier G ; plan 0.10 §3.5, S-31 à S-33) ----------
// Pas de mutants, des corps humains abîmés (Book 06 §1) : le Noyé est un Errant resté longtemps dans l'eau, gonflé par
// les gaz ; l'Ensablé, un Rampant qui dort enfoui dans le sable. Les lieux de la côte les déclarent dans leur liste
// d'Éteints avec `eteintsDePlaces` (comme eteints-moulin.ts) ; le lieu vivant fait crever les Noyés détruits
// (serveur/src/lieu-vivant.ts, `crever`).

/** Le Noyé ne va jamais plus vite que ça (m/s), quel que soit son état (S-31). */
export const VITESSE_NOYE = 0.4;
/** L'Ensablé surgit quand un humain passe à moins de ces mètres (S-33). */
export const REVEIL_ENSABLE = 2;
/**
 * Quand le Noyé meurt, il crève (N2-64, S-32) : ce n'est pas une explosion, les gaz crèvent la peau. Ceux qui sont à
 * moins de `rayon` mètres reçoivent ses fluides (la nausée, commun/src/combat.ts) ; une odeur (NOYE_ODEUR,
 * commun/src/signature.ts) reste `odeurMs` au point de sa mort, et attire les Éteints éveillés alentour.
 */
export const CREVAISON = { rayon: 1.5, odeurMs: 60_000 } as const;

/** Au sol pour de bon : le Rampant, l'Ensablé, le Noyé à la jambe brisée. Un coup l'achève ; il rampe. */
export function rampe(e: Pick<Eteint, "variante" | "jambeBrisee">): boolean {
  return e.variante === "rampant" || e.variante === "ensable" || e.jambeBrisee === true;
}

/**
 * Ce qu'il faut de coups au torse pour le faire tomber : 3 points (RESISTANCE_TORSE), 4 pour l'Équipé ; le Noyé ne
 * tombe pas sous un coup au torse (sa masse, S-31) : la tête, ou les jambes.
 */
export function resistanceTorse(e: Pick<Eteint, "variante">): number {
  if (e.variante === "noye") return Infinity;
  return RESISTANCE_TORSE + (e.variante === "equipe" ? 1 : 0);
}

/** La jambe brisée (un piège, Book 06 §2.2) : il devient un Rampant ; le Noyé rampe, et reste un Noyé. */
export function briserJambe(e: Eteint): void {
  if (e.variante === "noye") e.jambeBrisee = true;
  else e.variante = "rampant";
}

/** L'Ensablé surgit-il ? Un humain à moins de 2 m, sans mur entre eux : il se réveille d'un coup, et va le chercher. */
function surgir(e: Eteint, humains: readonly Humain[], zone: Zone): boolean {
  const pres = humains.some((h) => Math.hypot(h.x - e.x, h.z - e.z) < REVEIL_ENSABLE && voieLibre(zone, e, h));
  if (pres) e.attention = Math.max(e.attention, SEUIL_ATTIRE + 1);
  return pres;
}

/** Les Noyés qui viennent d'être détruits, par quelque moyen que ce soit : ils crèvent (marqués, une fois). */
export function noyesQuiCrevent(eteints: readonly Eteint[]): Eteint[] {
  const creves = eteints.filter((e) => e.variante === "noye" && e.etat === "detruit" && !e.creve);
  for (const e of creves) e.creve = true;
  return creves;
}

/** L'odeur d'un Noyé crevé, au point de sa mort. */
export function odeurDeCrevaison(e: { x: number; z: number }): Stimulus {
  return { genre: "odeur", x: e.x, z: e.z, ...NOYE_ODEUR };
}

/** Une place d'Éteint dans la liste d'un lieu : son numéro (son identifiant), où il est, son état, sa variante. */
export interface PlaceEteint {
  n: number;
  x: number;
  z: number;
  o?: number;
  /** Par défaut : errant (l'Ensablé dort toujours). */
  etat?: EtatEteint;
  variante?: VarianteEteint;
  groupe?: number;
}

/**
 * Les Éteints d'un lieu, d'après leurs places (comme eteints-moulin.ts) : chacun a sa zone (il y revient) ; un dormant
 * y dort ; l'Ensablé est toujours un dormeur. `versJeu` : du repère du modèle à celui du jeu, s'il le faut. Par exemple :
 * `eteintsDePlaces([{ n: 1, x: 4, z: -2, variante: "noye" }, { n: 2, x: -6, z: 8, variante: "ensable" }], jeu)`.
 */
export function eteintsDePlaces(places: readonly PlaceEteint[], versJeu: (x: number, z: number) => { x: number; z: number } = (x, z) => ({ x, z })): Eteint[] {
  return places.map((p) => {
    const { x, z } = versJeu(p.x, p.z);
    const etat = p.variante === "ensable" ? "dormant" : (p.etat ?? "errant");
    const e = nouvelEteint(p.n, x, z, etat, p.o ?? 0);
    e.maison = { x, z };
    e.sansVoir = 0;
    if (etat === "dormant") e.dormeur = true;
    if (p.variante) e.variante = p.variante;
    if (p.groupe !== undefined) e.groupe = p.groupe;
    return e;
  });
}
