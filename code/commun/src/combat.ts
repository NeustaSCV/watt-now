// Le combat et la santé de la 0a (Book 21 §3.5 et §3.6, Book 06 §2 et §8, Book 05 §4 et §10, Book 08 §3.3).
// Un Éteint seul n'est presque jamais dangereux : le danger, c'est d'être saisi, encerclé, épuisé.
// Valeurs de réglage, à caler en test.

import type { Inventaire, TypeObjet } from "./objets.ts";
import { ETOILES, etoilesDe, etoilesDeBase, facteurs, meilleurExemplaire, soliditeExemplaire, typeDe, type CleObjet, type Etoiles } from "./etoiles.ts";
import { ARMES_COMMUNES } from "./armes/communes.ts";
import { ARMES_CHARBONNIERS, DEBRIS_ARMES_CHARBONNIERS, MATIERES_ARMES_CHARBONNIERS } from "./armes/charbonniers.ts";
import { ARMES_VOLTAIQUES } from "./armes/voltaiques.ts";
import { ARMES_MECANISTES } from "./armes/mecanistes.ts";
import { REGLAGES } from "./reglages.ts";
import type { LieuRecette } from "./recettes.ts";
import { aCote } from "./recettes/lieux.ts";

// ---------- Les armes ----------

/**
 * Le type de dégât (Book 23 §4.2) : une seule règle, le casque. Le contondant passe et étourdit plus longtemps ; le
 * tranchant ne tue pas un casqué à la tête ; le perçant vaut par son allonge. L'électrique (Book 25 §5.1 et §8.2) fait
 * lâcher, raidit, met à terre, et détruit en deux temps, casque ou pas ; depuis la 0.8, sa courte ajoute aussi ses
 * dégâts au torse (plan 0.8 §2.4).
 */
export type TypeDegat = "contondant" | "tranchant" | "percant" | "electrique";

/** Ce qu'une arme électrique fait de plus (Book 25 §8.2), à ses étoiles de base. */
export interface ArmeElectrique {
  /** Secondes de raidissement d'une décharge courte. */
  raidi: number;
  /** Wh pris au pack par la décharge courte, et par la longue (chantier 6). */
  whCourte: number;
  whLongue: number;
  /** La courte saute à un second Éteint à moins de 1 m (★★★ et plus). */
  saute: boolean;
  /** Ce que tient sa source, en Wh (absent : un pack de cellules, 12 Wh ; la petite batterie du kit : 50). */
  capaciteWh?: number;
}

/** Un pack de cellules plein (Book 25 §5.4). */
export const CAPACITE_PACK_WH = 12;
/** Ce que tient la source d'une arme électrique, en Wh (0 pour une autre arme). */
export function capaciteChargeArme(a: Arme): number {
  return a.electrique ? (a.electrique.capaciteWh ?? CAPACITE_PACK_WH) : 0;
}

/**
 * La charge d'un exemplaire d'arme électrique (Wh qui restent ; absente du registre : pleine, comme l'usure absente
 * veut dire neuve). Le chantier 6 la fait baisser à chaque décharge et remonter au banc ou à la manivelle.
 */
export function chargeArme(cle: string, charges: Partial<Record<string, number>>): number {
  const a = armeDeCle(cle);
  if (!a?.electrique) return 0;
  return Math.max(0, charges[cle] ?? capaciteChargeArme(a));
}

export interface Arme {
  objet: TypeObjet | null;
  nom: string;
  type: TypeDegat;
  /** Coups qui touchent avant qu'elle casse (Book 23 §4.3) ; les poings ne s'usent pas. */
  solidite: number;
  /** Coups au torse pour le faire tomber. */
  degatsTorse: number;
  /** Un coup appuyé à la tête le détruit-il ? (Book 06 §2.2 : un coup solide, oui) */
  tueALaTete: boolean;
  /** Portée en mètres. */
  allonge: number;
  /**
   * La durée du geste, en ms : coup simple, coup appuyé (P-004, 2026-10-08). Un coup va jusqu'au bout : on ne
   * refrappe pas avant. Le client joue l'animation sur cette durée ; le serveur refuse un coup plus tôt.
   * Une hache est lente et lourde, un couteau vif. Pour l'électrique, l'appuyé est la décharge longue.
   */
  coup: number;
  coupAppuye: number;
  /** Sa place dans ARMES, de la meilleure à la moins bonne (Book 25 §10.4 : les fichiers par famille). */
  rang?: number;
  /** Objet de métier : il porte des étoiles par exemplaire (Book 25 §4.2). Ses valeurs sont à ses étoiles de base. */
  metier?: true;
  /** Électrique (Book 25 §5.1). */
  electrique?: ArmeElectrique;
  /** Pour un exemplaire étoilé : sa clé dans le sac (« lame_forgee#4 ») et ses étoiles. */
  cle?: CleObjet;
  etoiles?: Etoiles;
  /**
   * Les valeurs décidées étoile par étoile (plan 0.8 §2.4, `decisions-armes.json`, K1 à K56) : elles remplacent les
   * multiplicateurs de `ETOILES` pour ce qu'elles donnent. Une étoile absente prend la valeur de l'étoile décidée la plus
   * proche en dessous (sinon au-dessus) ; un champ décidé nulle part suit `ETOILES`, comme avant la 0.8.
   */
  parEtoiles?: Partial<Record<Etoiles, ValeursEtoile>>;
}

/** Ce qu'une étoile d'une arme donne en propre (plan 0.8 §2.4) : les dégâts suivent l'étape de l'étoile (D1 à D37). */
export interface ValeursEtoile {
  /** Dégâts au torse d'un coup simple (pour une arme de tir : d'un tir plein). */
  degats?: number;
  solidite?: number;
  /** L'étape où cette étoile se fait seul (la grille Q-A2), pour la fiche et le chantier 9. */
  etape?: EtapeArme;
  /** Électrique : raidissement de la courte (s), durée de la longue (ms), source (Wh). Lus à leur étoile seulement. */
  raidi?: number;
  longueMs?: number;
  capaciteWh?: number;
}

/** Les étapes d'une étoile (la grille du plan 0.8 §2.4) : jusqu'au niveau 3, puis « plus tard ». */
export type EtapeArme = "maison" | "H1" | "L1" | "L2" | "L3" | "plus_tard";

/**
 * La valeur décidée d'un champ à `n` étoiles : celle de l'étoile, sinon celle de l'étoile décidée la plus proche en
 * dessous, sinon au-dessus (les dégâts ne baissent jamais quand les étoiles montent). undefined : rien de décidé.
 */
export function valeurDecidee<K extends keyof ValeursEtoile>(table: Partial<Record<Etoiles, ValeursEtoile>> | undefined, n: Etoiles, champ: K): ValeursEtoile[K] | undefined {
  if (!table) return undefined;
  for (let k = n; k >= 1; k--) {
    const v = table[k as Etoiles]?.[champ];
    if (v !== undefined) return v;
  }
  for (let k = n + 1; k <= 5; k++) {
    const v = table[k as Etoiles]?.[champ];
    if (v !== undefined) return v;
  }
  return undefined;
}

/**
 * Du meilleur au pire : sans arme équipée, on frappe avec ce qu'on a de mieux dans le sac. Chaque famille déclare ses
 * armes dans son fichier (`armes/<famille>.ts`) ; on les rassemble ici, triées par rang.
 */
export const ARMES: Arme[] = [...ARMES_COMMUNES, ...ARMES_CHARBONNIERS, ...ARMES_VOLTAIQUES, ...ARMES_MECANISTES].sort(
  (a, b) => (a.rang ?? 0) - (b.rang ?? 0),
);
export const POINGS: Arme = { objet: null, nom: "les poings", type: "contondant", solidite: Infinity, degatsTorse: 0.35, tueALaTete: false, allonge: 1.1, coup: 380, coupAppuye: 600 };

/** La clé de l'exemplaire d'une arme (celle de l'usure et de la charge) : « lame_forgee#4 », ou son type nu. */
export function cleArme(a: Arme): CleObjet | null {
  return a.cle ?? a.objet;
}

/**
 * L'arme que donne un exemplaire du sac : les valeurs de son objet à ses étoiles (Book 25 §4.2 et §8.2), les valeurs
 * décidées par étoile d'abord (`parEtoiles`, plan 0.8 §2.4), puis les réglages d'équilibre. Aux étoiles de base et aux
 * réglages par défaut, c'est l'arme déclarée elle-même. null : ce n'est pas une arme.
 *
 * La maîtrise n'a pas de plafond (K-Q1, refusé le 2026-10-10) : l'étoile du dessus vaut ses vrais dégâts, même quand elle
 * appartient à l'étape suivante.
 */
export function armeDeCle(cle: string): Arme | null {
  const type = typeDe(cle);
  const declaree = ARMES.find((a) => a.objet === type);
  if (!declaree || !declaree.objet) return null;
  const n = declaree.metier ? etoilesDe(cle) : null;
  if (n === null || n === etoilesDeBase(declaree.objet)) return armeReglee(declaree);
  const t = declaree.parEtoiles;
  const f = facteurs(declaree.objet, n);
  const arme: Arme = {
    ...declaree,
    cle: cle as CleObjet,
    etoiles: n,
    degatsTorse: valeurDecidee(t, n, "degats") ?? declaree.degatsTorse * f.degats,
    solidite: valeurDecidee(t, n, "solidite") ?? soliditeExemplaire(declaree.objet, n, declaree.solidite),
  };
  if (declaree.electrique) {
    const ref = ETOILES[etoilesDeBase(declaree.objet)];
    // Le raidissement suit les étoiles ; la longue raccourcit avec elles. La courte ne saute qu'à ★★★ et plus.
    arme.electrique = {
      ...declaree.electrique,
      raidi: t?.[n]?.raidi ?? ETOILES[n].raidi,
      saute: declaree.electrique.saute && n >= 3,
    };
    const capacite = t?.[n]?.capaciteWh;
    if (capacite !== undefined) arme.electrique.capaciteWh = capacite;
    arme.coupAppuye = t?.[n]?.longueMs ?? Math.round((declaree.coupAppuye * ETOILES[n].longueMs) / ref.longueMs);
  }
  return armeReglee(arme);
}

/**
 * Les réglages d'équilibre du test (Book 25 §10.3, chantier 9 ; `reglages.ts`) : des multiplicateurs, à 1 par défaut,
 * sur les armes de métier seulement. Sans réglage changé, c'est l'arme elle-même.
 */
export function armeReglee(a: Arme): Arme {
  if (!a.metier) return a;
  const degats = a.type === "tranchant" ? REGLAGES.equilibre_lames_degats : a.electrique ? REGLAGES.equilibre_electrique_degats : 1;
  const raidi = a.electrique ? REGLAGES.equilibre_electrique_raidi : 1;
  const longue = a.electrique ? REGLAGES.equilibre_electrique_longue : 1;
  if (degats === 1 && raidi === 1 && longue === 1) return a;
  const r: Arme = { ...a, degatsTorse: a.degatsTorse * degats, coupAppuye: Math.round(a.coupAppuye * longue) };
  if (a.electrique) r.electrique = { ...a.electrique, raidi: a.electrique.raidi * raidi };
  return r;
}

/**
 * Les dégâts d'une arme électrique sont ceux du **coup** (C11, plan 0.8 §2.4) : pack vide, le courant n'en fait plus la
 * moitié, et elle frappe à la moitié de ses dégâts (elle remplace les 0,6 fixes d'avant la 0.8).
 */
export const PART_PACK_VIDE = 0.5;

/**
 * Une arme électrique dont le pack est vide (Book 25 §8.2, C11) : un gourdin court. Contondant, à la moitié de ses
 * dégâts, ne tue pas à la tête ; elle s'use comme l'arme qu'elle est. Le serveur s'en sert quand la charge manque.
 */
export function armeSansCharge(a: Arme): Arme {
  if (a.type !== "electrique") return a;
  const { electrique: _electrique, ...reste } = a;
  return { ...reste, type: "contondant", degatsTorse: a.degatsTorse * PART_PACK_VIDE, tueALaTete: false };
}

/** Sous 30 % de solidité, l'arme est abîmée : ses coups perdent 30 % (Book 23 §4.3). */
export const SEUIL_ABIMEE = 0.3;
export const MALUS_ABIMEE = 0.7;
/**
 * La réparation (Book 23 §4.3, Book 25 §4.4) : à l'établi pour le bois, à la meule (pédalier) ou à la forge pour les
 * lames, à la forge pour le métal ; depuis la 0.8 (chantier 9), au banc solaire pour une arme électrique, et le manche à
 * l'établi à étau, sans forge, pour toutes les familles (R-ARMES-4 : la tête du marteau ne s'use pas, seul le manche).
 * La réparation de fortune (ficelle, chiffons), partout et pour toutes les familles, ne remonte pas au-delà d'« abîmée ».
 * Le geste lui-même (« Reprendre l'arme », R-ARMES-5) est dans `evolution-armes.ts`.
 */
export type MatiereArme = "bois" | "lame" | "metal" | "manche" | "masse" | "electrique";
export const MATIERE_ARME: Partial<Record<TypeObjet, MatiereArme>> = {
  gourdin: "bois",
  epieu: "bois",
  lance: "bois",
  hache: "lame",
  machette: "lame",
  couteau: "lame",
  couteau_aiguise: "lame",
  lame_forgee: "lame",
  // Le marteau remmanché (R-ARMES-4) : la tête ne s'use pas, c'est le manche qu'on refait.
  marteau: "manche",
  // La masse (plan 0.8 §9.2, chantier 13) : la tête à la forge, ou le manche à l'établi à étau, comme le marteau.
  masse: "masse",
  barre_metal: "metal",
  pied_de_biche: "metal",
  // La fourche à foin (L1B, I30) : un manche de frêne, des dents d'acier ; c'est le manche qui lâche.
  fourche_foin: "bois",
  // 🔥 Les lames des Charbonniers (Book 25 §4.4, chantier 5).
  ...MATIERES_ARMES_CHARBONNIERS,
  // ⚡ Les armes électriques (Book 25 §5.3) : un manche de bois (gourdin, épieu) et leur câblage, qui se reprennent au
  // banc solaire (plan 0.8 §2.4) ; à défaut, le manche à l'établi.
  matraque_fortune: "electrique",
  matraque_electrique: "electrique",
  aiguillon: "electrique",
  // Les arcs et l'arbalète (tir.ts) : du bois, à l'établi (plan 0.8, chantier 9).
  arc_fortune: "bois",
  arc_simple: "bois",
  arc_if: "bois",
  arc_sportif: "bois",
  arbalete: "bois",
  arbalete_lourde: "bois",
};
/**
 * Un atelier où remettre une arme à neuf, lu dans les meubles (plan 0.8, chantier 9) : la construction, le niveau de sa
 * lignée qu'il y faut, l'accessoire monté dessus ; ce que le geste consomme. Le lieu se juge comme celui d'une recette
 * (`lieuAtelier`, `refusLieu` de lieu-recette.ts) : à 3 m, au bon niveau.
 */
export interface AtelierReparation {
  installation: "etabli" | "pedalier" | "forge" | "banc_recharge";
  /** Le niveau du meuble dans sa lignée (l'établi à étau : 2). Absent : 1. */
  niveau?: number;
  nom: string;
  /** L'accessoire posé sur l'installation (la meule du pédalier). */
  accessoire?: "meule";
  /** Ce que coûte la remise à neuf ici (absent : rien). */
  cout?: Inventaire;
  /** Le geste, s'il a un nom à lui : « Affûter », « Reprendre la lame », « Refaire le manche ». */
  geste?: string;
}
/**
 * Où l'on remet une arme à neuf, dans l'ordre où on les cherche (décision 8 du Book 25 : les deux pour les lames). La
 * meule affûte, vite et sans rien consommer ; la forge reprend la lame (chauffer, redresser, limer) pour un kilo de
 * charbon (le Book 25 §4.4 dit ½ kg ; le sac compte le charbon au kilo). Le manche se refait à l'établi à étau
 * (`LIEU_REPARER_MANCHE`, recettes/communes.ts) : l'étau tient la tête, une branche fait le manche neuf.
 */
export const ATELIER_REPARATION: Record<MatiereArme, AtelierReparation[]> = {
  bois: [{ installation: "etabli", nom: "l'établi" }],
  lame: [
    { installation: "pedalier", accessoire: "meule", nom: "la meule du pédalier", geste: "Affûter" },
    { installation: "forge", nom: "la forge", cout: { charbon_bois: 1 }, geste: "Reprendre la lame" },
  ],
  metal: [{ installation: "forge", nom: "la forge" }],
  manche: [{ installation: "etabli", niveau: 2, nom: "l'établi à étau", cout: { branche: 1 }, geste: "Refaire le manche" }],
  masse: [
    { installation: "forge", nom: "la forge" },
    { installation: "etabli", niveau: 2, nom: "l'établi à étau", cout: { branche: 1 }, geste: "Refaire le manche" },
  ],
  electrique: [
    { installation: "banc_recharge", nom: "le banc solaire" },
    { installation: "etabli", nom: "l'établi" },
  ],
};
/** Le lieu d'un atelier, comme celui d'une recette : à côté du meuble, à son niveau, avec son accessoire. */
export function lieuAtelier(a: AtelierReparation): LieuRecette {
  return aCote(a.installation, { ...(a.niveau ? { niveau: a.niveau } : {}), ...(a.accessoire ? { accessoire: a.accessoire } : {}) });
}
/** Les ateliers d'une matière, en toutes lettres : « la meule du pédalier ou la forge ». */
export function nomsAteliers(matiere: MatiereArme): string {
  const noms = ATELIER_REPARATION[matiere].map((a) => a.nom);
  return noms.length > 1 ? `${noms.slice(0, -1).join(", ")} ou ${noms[noms.length - 1]}` : (noms[0] ?? "");
}
export const REPARATION_FORTUNE: Inventaire = { ficelle: 1, chiffons: 1 };
/**
 * Ce que laisse une arme cassée (Book 23 §4.3, 0.5.1) : un débris qui se démonte (table DEMONTAGE). Le bois se fend,
 * la lame s'ébrèche, le fer se tord. La barre de métal tordue ne laisse rien : redressée, elle redeviendrait elle-même.
 */
export const DEBRIS_ARME: Partial<Record<TypeObjet, TypeObjet>> = {
  gourdin: "manche_fendu",
  epieu: "manche_fendu",
  lance: "manche_fendu",
  hache: "lame_ebrechee",
  machette: "lame_ebrechee",
  couteau: "lame_ebrechee",
  couteau_aiguise: "lame_ebrechee",
  lame_forgee: "lame_ebrechee",
  marteau: "ferraille_tordue",
  masse: "ferraille_tordue",
  pied_de_biche: "ferraille_tordue",
  fourche_foin: "manche_fendu",
  // 🔥 Les lames des Charbonniers : une lame ébréchée, que la forge reforge (Book 25 §4.4, chantier 5).
  ...DEBRIS_ARMES_CHARBONNIERS,
  // ⚡ Le manche fend ; le câblage brûlé ne se récupère pas.
  matraque_fortune: "manche_fendu",
  matraque_electrique: "manche_fendu",
  aiguillon: "manche_fendu",
};
/** La réparation de fortune remonte au plus jusqu'ici : encore abîmée, mais elle tient. */
export const PLAFOND_FORTUNE = 0.29;

/** La solidité d'un exemplaire d'arme, de 0 à 1 (1 : neuf). `cle` : son type, ou « type#n » pour un exemplaire étoilé. */
export function etatArme(cle: string, usure: Partial<Record<string, number>>): number {
  const a = armeDeCle(cle);
  if (!a || !Number.isFinite(a.solidite)) return 1;
  return Math.max(0, Math.min(1, (usure[cle] ?? a.solidite) / a.solidite));
}

/** Un coup contondant étourdit plus longtemps (Book 23 §4.2). */
export const BONUS_ETOURDI_CONTONDANT = 1.5;

/**
 * Jusqu'où s'entend un coup porté (Book 25 §8.4, réglage accepté le 2026-10-09) : le choc porte loin, le tranchant et
 * le perçant moins ; l'électrique crépite (la décharge courte) et claque (la longue).
 */
export const BRUIT_COUP: Record<TypeDegat, number> = { contondant: 14, tranchant: 10, percant: 10, electrique: 6 };
export const BRUIT_DECHARGE_LONGUE = 8;
export function porteeBruitCoup(a: Arme, appuye: boolean): number {
  return a.type === "electrique" && appuye ? BRUIT_DECHARGE_LONGUE : BRUIT_COUP[a.type];
}

/** Ce que le serveur accepte d'avance sur la fin d'un geste (le réseau n'est pas régulier). */
export const TOLERANCE_COUP_MS = 80;

/**
 * La meilleure arme du sac ; pour une arme de métier, son meilleur exemplaire. « Meilleure » se juge aux **dégâts
 * décidés** de l'exemplaire (plan 0.8 §2.4 : `parEtoiles`, `valeurDecidee`, lus par `armeDeCle`), pas au rang : sans
 * cela, la hache (1,0) passait avant le pied-de-biche (1,5) et le marteau (0,8) avant la lance (0,7)… À dégâts égaux,
 * le rang départage (la masse avant la fourche, l'allonge et le reste étant pesés quand on a rangé les armes).
 */
export function meilleureArme(inventaire: Inventaire): Arme {
  let meilleure: Arme | null = null;
  for (const a of ARMES) {
    if (!a.objet) continue;
    const cle = a.metier ? meilleurExemplaire(inventaire, a.objet) : (inventaire[a.objet] ?? 0) > 0 ? a.objet : null;
    if (!cle) continue;
    const exemplaire = armeDeCle(cle) ?? a;
    // ARMES est trié par rang : à dégâts égaux, la première trouvée reste.
    if (!meilleure || exemplaire.degatsTorse > meilleure.degatsTorse) meilleure = exemplaire;
  }
  return meilleure ?? POINGS;
}

/** Les caractéristiques d'une arme (ou d'un exemplaire étoilé), telles que le joueur les lit dans son sac (2026-10-08). */
export function caracteristiquesArme(cle: string): {
  degats: number;
  vitesse: number;
  coup: number;
  coupAppuye: number;
  allonge: number;
  tueALaTete: boolean;
  type: TypeDegat;
  solidite: number;
  etoiles: Etoiles | null;
  raidi: number | null;
} | null {
  const a = armeDeCle(cle);
  if (!a || !a.objet) return null;
  // Vitesse : coups simples par seconde. Dégâts : en « points » de torse (il en faut 3 pour le faire tomber).
  return {
    degats: a.degatsTorse,
    vitesse: 1000 / a.coup,
    coup: a.coup / 1000,
    coupAppuye: a.coupAppuye / 1000,
    allonge: a.allonge,
    tueALaTete: a.tueALaTete,
    type: a.type,
    solidite: a.solidite,
    etoiles: a.metier ? (a.etoiles ?? etoilesDeBase(a.objet)) : null,
    raidi: a.electrique?.raidi ?? null,
  };
}

/** Cet objet (ou cet exemplaire) est-il une arme qu'on peut équiper (P-005) ? */
export function estArme(cle: string): boolean {
  return armeDeCle(cle) !== null;
}

/**
 * L'arme en main en mode Combat (P-005) : l'exemplaire équipé, si on l'a toujours ; sinon le meilleur exemplaire de la
 * même arme ; sinon la meilleure du sac.
 */
export function armeEnMain(inventaire: Inventaire, equipee: CleObjet | null): Arme {
  if (equipee) {
    if ((inventaire[equipee] ?? 0) > 0) {
      const a = armeDeCle(equipee);
      if (a) return a;
    }
    const memeArme = meilleurExemplaire(inventaire, typeDe(equipee));
    if (memeArme) {
      const a = armeDeCle(memeArme);
      if (a) return a;
    }
  }
  return meilleureArme(inventaire);
}

/** Un Éteint tombe au bout de 3 « points » de coups au torse, puis se relève (Book 06 §2.2). */
export const RESISTANCE_TORSE = 3;
export const DUREE_A_TERRE = 5;
/** La décharge longue sur un Éteint debout le met à terre 4 s (Book 25 §5.1). */
export const DUREE_A_TERRE_ELECTRIQUE = 4;
/** La décharge courte d'une arme ★★★ saute à un voisin à moins de 1 m (Book 25 §8.2). */
export const PORTEE_SAUT_DECHARGE = 1;
/** Un coup le fait vaciller : il lâche prise et recule. */
export const DUREE_ETOURDI = 1.2;
/** Un corps reste au sol un moment, puis on n'en parle plus (en 0a). */
export const DUREE_CORPS = 120;
/** Le coup appuyé : il faut tenir le bouton au moins ce temps (Book 08 §3.3). */
export const DUREE_APPUI_MS = 350;
/** Le ciblage assisté : le zombie le plus proche, devant soi (Book 08 §3.3). */
export const ANGLE_CIBLAGE = Math.PI / 2.4;

// ---------- L'endurance (Book 01 §4 : END, réserve d'effort) ----------

export const ENDURANCE_MAX = 100;
export const COUT_ENDURANCE = { coup: 9, coupAppuye: 16, esquive: 14, degagement: 3 } as const;
/** Par seconde : la course fatigue, le repos récupère. */
export const ENDURANCE_COURSE = 4;
export const ENDURANCE_RECUPERATION = 12;
/** En dessous, on est épuisé : coups faibles, pas de course, dégagement plus dur. */
export const SEUIL_EPUISE = 15;

// ---------- Repousser (Book 23 §4.4) : l'outil contre l'encerclement ----------

/** Un Éteint à 1,2 m ou moins devant soi (cône de 90°) : B le repousse, deux au plus. */
export const REPOUSSER = { portee: 1.2, demiAngle: Math.PI / 4, cout: 12, recul: 1.5, etourdi: 0.8, max: 2 } as const;

// ---------- L'esquive ----------

export const ESQUIVE = { distance: 1.9, duree: 0.25, invulnerable: 0.45 } as const;

// ---------- La saisie (Book 06 §2.3) ----------

/** Au contact depuis ce temps, il saisit. */
export const DELAI_SAISIE = 0.6;
/** Saisi depuis ce temps : il mord. */
export const DELAI_MORSURE = 3;
/** Appuis rapides pour se dégager (A ou B), par Éteint qui tient, même épuisé (0.8.4 : 2 au lieu de 6). */
export const APPUIS_DEGAGEMENT = 2;
/** Vitesse quand on est saisi : ralenti par un, immobilisé par deux. */
export function freinSaisie(nombre: number): number {
  return nombre === 0 ? 1 : nombre === 1 ? 0.35 : 0;
}

// ---------- Blessures et santé (Book 05 §4, §10) ----------

export type TypeBlessure = "morsure" | "coupure" | "contusion";
export type Saignement = "aucun" | "leger" | "fort";

export interface Blessure {
  type: TypeBlessure;
  /** Instant réel où elle a été reçue. */
  depuis: number;
}

export interface Sante {
  /** 0 à 100 : à 0, effondrement. */
  points: number;
  blessures: Blessure[];
  saignement: Saignement;
  /** Instant réel où le saignement léger s'arrête de lui-même. */
  saignementFinLe: number;
  /** Convalescence après un effondrement : jusqu'à cet instant réel. */
  convalescenceJusqua: number;
  /** Un champignon toxique mangé : les symptômes arrivent plus tard (Book 05 §5 bis). */
  intoxication?: Intoxication;
}

export interface Intoxication {
  champignon: "tue_mouches" | "phalloide" | "viande_crue" | "conserve_bombee";
  /** Instants réels : début et fin des symptômes. */
  debutLe: number;
  finLe: number;
  /** Les symptômes ont été annoncés au joueur. */
  annoncee?: boolean;
}

/**
 * Les intoxications, à l'échelle du jeu (1 h de jeu = 1 min réelle) :
 * - amanite tue-mouches : symptômes en 30 min à 3 h (ici 1 min réelle) ; vomissements, délire ; on perd de l'eau et un peu de santé ;
 * - amanite phalloïde : 6 à 12 h sans rien sentir (ici 8 min), puis l'atteinte du foie : la santé fond jusqu'à l'effondrement.
 */
export const INTOXICATIONS = {
  tue_mouches: { latenceMs: 60_000, dureeMs: 120_000, santeParSeconde: 0.15, eauParSeconde: 0.004 },
  phalloide: { latenceMs: 8 * 60_000, dureeMs: 4 * 60_000, santeParSeconde: 0.5, eauParSeconde: 0.004 },
  // Une volaille mangée crue (salmonelles, campylobacter) : 6 à 72 h dans la réalité ; ici 3 min, puis 2 min de malaise.
  viande_crue: { latenceMs: 3 * 60_000, dureeMs: 2 * 60_000, santeParSeconde: 0.08, eauParSeconde: 0.005 },
  // Une conserve bombée (Book 05 §4, intoxication alimentaire) : vomissements et faiblesse, plus vite et plus fort que
  // la volaille crue, sans tuer un joueur en bonne santé (lot 2, 0.7).
  conserve_bombee: { latenceMs: 2 * 60_000, dureeMs: 3 * 60_000, santeParSeconde: 0.12, eauParSeconde: 0.006 },
} as const;

export function intoxiquer(s: Sante, champignon: Intoxication["champignon"], instant: number): Sante {
  const r = INTOXICATIONS[champignon];
  // La phalloïde l'emporte sur la tue-mouches ; deux du même genre ne s'additionnent pas en 0a.
  if (s.intoxication?.champignon === "phalloide" && champignon !== "phalloide") return s;
  return { ...s, intoxication: { champignon, debutLe: instant + r.latenceMs, finLe: instant + r.latenceMs + r.dureeMs } };
}

/** Les symptômes en cours (null : pas encore, ou c'est passé). */
export function symptomes(s: Sante, instant: number): (typeof INTOXICATIONS)[keyof typeof INTOXICATIONS] | null {
  const i = s.intoxication;
  if (!i || instant < i.debutLe || instant >= i.finLe) return null;
  return INTOXICATIONS[i.champignon];
}

export const SANTE_DEPART: Sante = { points: 100, blessures: [], saignement: "aucun", saignementFinLe: 0, convalescenceJusqua: 0 };

/** Ce qu'enlève une morsure, et ce qu'elle fait saigner. */
export const DEGATS_MORSURE = 18;
export const DEGATS_CONTUSION = 5;
/** Points perdus par seconde réelle (Book 05 §4.3 : un saignement fort laisse ≈ 2 à 3 min pour agir). */
export const PERTE_SAIGNEMENT: Record<Saignement, number> = { aucun: 0, leger: 0.08, fort: 0.6 };
/** Un saignement léger s'arrête seul au bout d'un moment. */
export const DUREE_SAIGNEMENT_LEGER_MS = 90_000;
/** Récupération : quelques points par minute quand on ne saigne plus et qu'on a mangé et bu. */
export const RECUPERATION_PAR_MINUTE = 1;
/** Une blessure guérit (en 0a, simplifié) : morsure et coupure en 1 h réelle, contusion en 20 min. */
export const GUERISON_MS: Record<TypeBlessure, number> = { morsure: 3_600_000, coupure: 3_600_000, contusion: 1_200_000 };
/** Effondrement : faim et soif ramenées à 30 %, convalescence d'un jour de jeu (24 min) (Book 05 §10.3). */
export const NIVEAU_APRES_EFFONDREMENT = 0.3;
export const DUREE_CONVALESCENCE_MS = 24 * 60_000;
/** En convalescence, l'endurance ne remonte qu'à 60 %. */
export const ENDURANCE_CONVALESCENCE = 60;

export const NOMS_BLESSURES: Record<TypeBlessure, string> = { morsure: "Morsure", coupure: "Coupure", contusion: "Contusion" };

/** Une nouvelle plaie qui saigne : un saignement de plus devient fort. */
export function aggraver(s: Sante, type: TypeBlessure, degats: number, instant: number): Sante {
  const saigne = type !== "contusion";
  return {
    ...s,
    points: Math.max(0, s.points - degats),
    blessures: [...s.blessures, { type, depuis: instant }],
    saignement: !saigne ? s.saignement : s.saignement === "aucun" ? "leger" : "fort",
    saignementFinLe: saigne ? instant + DUREE_SAIGNEMENT_LEGER_MS : s.saignementFinLe,
  };
}

/** Un pas de temps pour la santé (connecté seulement : hors ligne, tout est gelé). */
export function evoluer(s: Sante, dt: number, instant: number, nourri: boolean): Sante {
  let saignement = s.saignement;
  if (saignement === "leger" && instant >= s.saignementFinLe) saignement = "aucun";
  let points = s.points - PERTE_SAIGNEMENT[saignement] * dt;
  const malade = symptomes(s, instant);
  if (malade) points -= malade.santeParSeconde * dt;
  else if (saignement === "aucun" && nourri) points += (RECUPERATION_PAR_MINUTE / 60) * dt;
  const blessures = s.blessures.filter((b) => instant - b.depuis < GUERISON_MS[b.type]);
  // Passée la fin des symptômes, l'intoxication est oubliée.
  const intoxication = s.intoxication && instant < s.intoxication.finLe ? s.intoxication : undefined;
  return { ...s, saignement, points: Math.max(0, Math.min(100, points)), blessures, intoxication };
}

/** Le pansement (Book 05 §7.1) arrête le saignement, léger comme fort (simplification de la 0a). */
export function panser(s: Sante): Sante {
  return { ...s, saignement: "aucun" };
}

/** Après l'effondrement : blessures gardées mais stabilisées, assez de forces pour repartir (Book 05 §10.3). */
export function seRelever(s: Sante, instant: number): Sante {
  return { ...s, points: Math.max(s.points, 35), saignement: "aucun", convalescenceJusqua: instant + DUREE_CONVALESCENCE_MS };
}

// ---------- L'arme dans le dos (0.9, chantier A ; plan 0.9 Q-7) ----------

/**
 * Les armes encombrantes : équipées, elles se portent dans le dos hors du coup (plan 0.8 §2.4), et les autres joueurs
 * les y voient en permanence (plan 0.9 Q-7). Une seule liste, pour le serveur (`AutreVu.dos`) et le client local.
 */
export const ARMES_DANS_LE_DOS: readonly TypeObjet[] = ["fourche_foin"];

/** L'arme qu'on porte dans le dos : celle qu'on a en main (`armeEnMain`) si elle est encombrante, sinon null. */
export function armeDansLeDos(inventaire: Inventaire, equipee: CleObjet | null): TypeObjet | null {
  const objet = armeEnMain(inventaire, equipee).objet;
  return objet !== null && ARMES_DANS_LE_DOS.includes(objet) ? objet : null;
}
