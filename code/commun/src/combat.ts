// Le combat et la santé de la 0a (Book 21 §3.5 et §3.6, Book 06 §2 et §8, Book 05 §4 et §10, Book 08 §3.3).
// Un Éteint seul n'est presque jamais dangereux : le danger, c'est d'être saisi, encerclé, épuisé.
// Valeurs de réglage, à caler en test.

import type { Inventaire, TypeObjet } from "./objets.ts";

// ---------- Les armes ----------

/**
 * Le type de dégât (Book 23 §4.2) : une seule règle, le casque. Le contondant passe et étourdit plus longtemps ; le
 * tranchant ne tue pas un casqué à la tête ; le perçant vaut par son allonge.
 */
export type TypeDegat = "contondant" | "tranchant" | "percant";

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
   * Une hache est lente et lourde, un couteau vif.
   */
  coup: number;
  coupAppuye: number;
}

/** Du meilleur au pire : sans arme équipée, on frappe avec ce qu'on a de mieux dans le sac. */
export const ARMES: Arme[] = [
  // La masse (Book 23 §4.6) : très forte, lente ; le casque n'y résiste pas.
  { objet: "masse", nom: "la masse", type: "contondant", solidite: 70, degatsTorse: 2.5, tueALaTete: true, allonge: 1.6, coup: 950, coupAppuye: 1250 },
  { objet: "hache", nom: "la hache", type: "tranchant", solidite: 60, degatsTorse: 2, tueALaTete: true, allonge: 1.7, coup: 700, coupAppuye: 950 },
  // Le pied-de-biche : le vestige devient une arme, la plus solide de toutes (Book 23 §4.6).
  { objet: "pied_de_biche", nom: "le pied-de-biche", type: "contondant", solidite: 120, degatsTorse: 1.5, tueALaTete: true, allonge: 1.5, coup: 600, coupAppuye: 880 },
  { objet: "machette", nom: "la machette de fortune", type: "tranchant", solidite: 40, degatsTorse: 1.2, tueALaTete: true, allonge: 1.6, coup: 500, coupAppuye: 750 },
  { objet: "marteau", nom: "le marteau", type: "contondant", solidite: 80, degatsTorse: 1.5, tueALaTete: true, allonge: 1.5, coup: 600, coupAppuye: 850 },
  { objet: "barre_metal", nom: "la barre de métal", type: "contondant", solidite: 100, degatsTorse: 1.5, tueALaTete: true, allonge: 1.9, coup: 650, coupAppuye: 900 },
  // La lance (épieu + couteau, évolution P-002) : l'allonge, et cette fois la pointe tue à la tête.
  { objet: "lance", nom: "la lance", type: "percant", solidite: 40, degatsTorse: 1.2, tueALaTete: true, allonge: 2.6, coup: 650, coupAppuye: 900 },
  { objet: "lame_forgee", nom: "la lame forgée", type: "tranchant", solidite: 60, degatsTorse: 1, tueALaTete: true, allonge: 1.4, coup: 480, coupAppuye: 720 },
  { objet: "gourdin", nom: "le gourdin", type: "contondant", solidite: 25, degatsTorse: 1, tueALaTete: false, allonge: 1.5, coup: 550, coupAppuye: 800 },
  // L'épieu (P-002) : peu de dégâts, mais l'allonge : on le tient à distance, il saisit avant de mordre.
  { objet: "epieu", nom: "l'épieu", type: "percant", solidite: 30, degatsTorse: 0.8, tueALaTete: false, allonge: 2.3, coup: 650, coupAppuye: 900 },
  { objet: "couteau_aiguise", nom: "le couteau aiguisé", type: "tranchant", solidite: 40, degatsTorse: 0.7, tueALaTete: false, allonge: 1.25, coup: 420, coupAppuye: 650 },
  { objet: "couteau", nom: "le couteau", type: "tranchant", solidite: 40, degatsTorse: 0.5, tueALaTete: false, allonge: 1.2, coup: 420, coupAppuye: 650 },
];
export const POINGS: Arme = { objet: null, nom: "les poings", type: "contondant", solidite: Infinity, degatsTorse: 0.35, tueALaTete: false, allonge: 1.1, coup: 380, coupAppuye: 600 };

/** Sous 30 % de solidité, l'arme est abîmée : ses coups perdent 30 % (Book 23 §4.3). */
export const SEUIL_ABIMEE = 0.3;
export const MALUS_ABIMEE = 0.7;
/**
 * La réparation (Book 23 §4.3) : à l'établi pour le bois, à la meule (pédalier) pour les lames, à la forge pour le
 * métal. La réparation de fortune (ficelle, chiffons), partout et pour toutes les familles, ne remonte pas au-delà
 * d'« abîmée ».
 */
export type MatiereArme = "bois" | "lame" | "metal";
export const MATIERE_ARME: Partial<Record<TypeObjet, MatiereArme>> = {
  gourdin: "bois",
  epieu: "bois",
  lance: "bois",
  hache: "lame",
  machette: "lame",
  couteau: "lame",
  couteau_aiguise: "lame",
  lame_forgee: "lame",
  marteau: "metal",
  masse: "metal",
  barre_metal: "metal",
  pied_de_biche: "metal",
};
export const ATELIER_REPARATION: Record<MatiereArme, { installation: "etabli" | "pedalier" | "forge"; nom: string }> = {
  bois: { installation: "etabli", nom: "l'établi" },
  lame: { installation: "pedalier", nom: "la meule du pédalier" },
  metal: { installation: "forge", nom: "la forge" },
};
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
};
/** La réparation de fortune remonte au plus jusqu'ici : encore abîmée, mais elle tient. */
export const PLAFOND_FORTUNE = 0.29;

/** La solidité d'une arme, de 0 à 1 (1 : neuve). */
export function etatArme(objet: TypeObjet, usure: Partial<Record<TypeObjet, number>>): number {
  const a = ARMES.find((x) => x.objet === objet);
  if (!a || !Number.isFinite(a.solidite)) return 1;
  return Math.max(0, Math.min(1, (usure[objet] ?? a.solidite) / a.solidite));
}

/** Un coup contondant étourdit plus longtemps (Book 23 §4.2). */
export const BONUS_ETOURDI_CONTONDANT = 1.5;

/** Ce que le serveur accepte d'avance sur la fin d'un geste (le réseau n'est pas régulier). */
export const TOLERANCE_COUP_MS = 80;

export function meilleureArme(inventaire: Inventaire): Arme {
  return ARMES.find((a) => a.objet && (inventaire[a.objet] ?? 0) > 0) ?? POINGS;
}

/** Les caractéristiques d'une arme, telles que le joueur les lit dans son sac (2026-10-08). */
export function caracteristiquesArme(
  objet: TypeObjet,
): { degats: number; vitesse: number; coup: number; coupAppuye: number; allonge: number; tueALaTete: boolean; type: TypeDegat; solidite: number } | null {
  const a = ARMES.find((x) => x.objet === objet);
  if (!a) return null;
  // Vitesse : coups simples par seconde. Dégâts : en « points » de torse (il en faut 3 pour le faire tomber).
  return { degats: a.degatsTorse, vitesse: 1000 / a.coup, coup: a.coup / 1000, coupAppuye: a.coupAppuye / 1000, allonge: a.allonge, tueALaTete: a.tueALaTete, type: a.type, solidite: a.solidite };
}

/** Cet objet est-il une arme qu'on peut équiper (P-005) ? */
export function estArme(objet: TypeObjet): boolean {
  return ARMES.some((a) => a.objet === objet);
}

/**
 * L'arme en main en mode Combat (P-005) : celle qu'on a équipée, si on l'a toujours ; sinon la meilleure du sac.
 */
export function armeEnMain(inventaire: Inventaire, equipee: TypeObjet | null): Arme {
  if (equipee && (inventaire[equipee] ?? 0) > 0) {
    const a = ARMES.find((x) => x.objet === equipee);
    if (a) return a;
  }
  return meilleureArme(inventaire);
}

/** Un Éteint tombe au bout de 3 « points » de coups au torse, puis se relève (Book 06 §2.2). */
export const RESISTANCE_TORSE = 3;
export const DUREE_A_TERRE = 5;
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
/** Appuis rapides pour se dégager, par Éteint qui tient. Épuisé : il en faut plus. */
export const APPUIS_DEGAGEMENT = 6;
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
  champignon: "tue_mouches" | "phalloide" | "viande_crue";
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
