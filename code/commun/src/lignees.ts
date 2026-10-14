// Améliorer sa base (Book 24) : les lignées des installations, leurs niveaux, ce que chaque niveau coûte et apporte.
// Une installation grandit sur place, au lieu d'en poser une autre à côté. Tout est ici, en données : le serveur
// vérifie et applique, le client montre la fiche (ce que le niveau suivant apporte, ce qui manque).
// Règles retenues par le porteur du projet (2026-10-08) : niveaux et accessoires (pas d'arbre libre) ; un démontage
// rend 50 % des matériaux naturels et 100 % des vestiges et objets fabriqués ; plafond de 3 foyers ; les niveaux
// propres à une famille coûtent ×1,5 aux autres familles et restent utilisables par tous.

import type { Inventaire, TypeObjet } from "./objets.ts";
import type { Qualite, TypeInstallation } from "./recettes.ts";
import type { Famille } from "./regles.ts";

/** Les matériaux naturels : on n'en récupère que la moitié au démontage (le reste casse, se perd, part en cendre). */
export const MATERIAUX_NATURELS: readonly TypeObjet[] = ["pierre", "branche", "buche", "fibres"];

/** Le plafond de foyers sur un terrain (Book 24 §4.2) : feux de camp, Dakota et leurs niveaux. La forge et la charbonnière à part. */
export const MAX_FOYERS = 3;

/** Le surcoût d'un niveau propre à une autre famille (Book 01 §5, Book 24 §2.3). */
export const SURCOUT_AUTRE_FAMILLE = 1.5;

/**
 * Les étapes du monde (plan 0.8 §1.1) : la maison, puis les haltes (H) et les lieux (L) de chaque niveau. Le contenu du jeu
 * (clés, quêtes, indices) cite l'étape ; l'affichage met le nom du lieu (`ETAPES_LIEUX` dans `lieux.ts`, chantier 4).
 */
export type EtapeMonde = "maison" | "H1A" | "H1B" | "L1A" | "L1B" | "H2A" | "H2B" | "L2A" | "L2B";

/** L'étape de la grille où se place un niveau ou une arme (plan 0.8 §2.4) : la maison, H1, L1, H2, L2, L3. */
export type EtapeGrille = "maison" | "H1" | "L1" | "H2" | "L2" | "L3";

/**
 * Pas encore jouable (plan 0.8 §1.3) : grisé « plus tard », avec sa clé nommée « à trouver plus loin ». Le serveur refuse,
 * le client grise. « 0b » : la phase 0b (l'argile, la cabane) ; « niveau 2 », « niveau 3 » : la grille.
 */
export type AVenir = "0b" | "niveau 2" | "niveau 3";

/** Ce qu'on dit d'une étape ou d'une recette « plus tard » : pourquoi pas encore. */
export function texteAVenir(a: AVenir): string {
  return a === "0b" ? "Pas encore. Il faudra de l'argile, et du temps." : "Plus tard. Ce qui lui manque est à trouver plus loin.";
}

/** Le refus du serveur pour une étape ou une recette « plus tard », ou null si elle est jouable. */
export function refusAVenir(x: { nom: string; aVenir?: AVenir }): string | null {
  if (!x.aVenir) return null;
  const texte = texteAVenir(x.aVenir);
  return `${x.nom} : ${texte.charAt(0).toLowerCase()}${texte.slice(1)}`;
}

/**
 * La clé d'un niveau (plan 0.8 §2.1 et §2.2 ; règle 2 du game designer) : un ingrédient **ou** un outil de dehors, jamais
 * les deux. Ses textes viennent du tableau maître (`progression-par-ingredients-page.json`). Plan 0.10 (chantier B) :
 * **pas de repli, à aucun niveau** ; qui n'a pas trouvé l'objet-clé l'achète au Comptoir (economie.ts, LIEU_DES_CLES).
 */
export interface CleEvolution {
  /** L'objet clé (un ingrédient de la montée). */
  objet?: TypeObjet;
  /** Ou l'outil clé : une qualité et son niveau. */
  qualite?: { qualite: Qualite; niveau: number };
  /** Le nom de la clé quand son objet n'existe pas encore (une clé du niveau 2 : « porte de four en fonte »). */
  nom?: string;
  /** Où on la trouve à place fixe. */
  ou: EtapeMonde;
  /** « Tu y penses » : le message au premier ramassage, dans la voix du carnet. */
  idee: string;
  /** Le même, quand le niveau d'avant n'est pas encore posé (« un jour… »). */
  ideePlusTard: string;
  /** L'indice « où chercher », en deux temps : le type de lieu, puis le coin. */
  indice: readonly [string, string];
}

/** Une étape d'une lignée : un niveau, avec ce que coûte d'y monter depuis le niveau d'avant. */
export interface Etape {
  id: string;
  nom: string;
  niveau: number;
  /** Ce que coûte la montée (des choix possibles : le premier qu'on a est pris). Vide : rien à fournir. */
  couts: Inventaire[];
  qualites: Partial<Record<Qualite, number>>;
  /** Durée du travail, en minutes de jeu (énergie grise, comme une recette). */
  duree: number;
  intensite: "legere" | "moyenne" | "lourde";
  /** Un niveau de métier : sa famille le bâtit au prix normal, les autres à ×1,5 (et tous s'en servent). */
  famille?: Famille;
  /**
   * Pas encore jouable (plan 0.8 §1.3) : « 0b » (l'argile, la cabane), « niveau 2 »… Montré grisé, comme une recette
   * pressentie ; le serveur le refuse (`refusAVenir`). Il remplace le `phase: "0b"` d'avant la 0.8.
   */
  aVenir?: AVenir;
  /** Plan 0.8 : l'étape de la grille où se place ce niveau. */
  etapeLieu?: EtapeGrille;
  /** Plan 0.8 : la clé du niveau, s'il en a une (les niveaux du niveau 1 en ont). */
  cle?: CleEvolution;
  /** Ce qu'il apporte, en une phrase, pour la fiche. */
  apporte: string;
  /** Ce qu'on en dit quand on l'examine. */
  examen: string;
}

// ---------- Le feu (Book 24 §3.1) ----------

export type FormeFeu = "feu_camp" | "foyer_pierres" | "foyer_cuisine" | "four_terre" | "poele" | "dakota" | "poele_fusee";

/** Ce que fait un foyer, selon sa forme. Les règles lisent ces multiplicateurs (bois, signature, sommeil, cuisine). */
export interface EffetsFeu {
  /** Multiplicateur du bois brûlé par heure (BOIS_PAR_HEURE). */
  bois: number;
  /** Multiplicateurs des signatures (FEU_LUMIERE_NUIT, FEU_ODEUR). */
  lumiere: number;
  odeur: number;
  /** Bois qu'il accepte, en kg. */
  boisMax: number;
  /** Le sommeil dans un abri à moins de 3 m, quand il brûle (le muret renvoie la chaleur). 1 : rien de plus. */
  chaleur: number;
  /** Ce qu'on y cuisine : 1 les plats simples, 3 les mijotés (crémaillère), 4 le pain (four). */
  cuisine: number;
  /** Plats cuits d'un coup. */
  plats: number;
  /** Vitesse de rôtissage (2 : deux fois plus vite). */
  rotir: number;
  /** Faire bouillir l'eau : bois et durée, en multiplicateurs. */
  bouillirBois: number;
  bouillirDuree: number;
  /** On peut le couvrir sous la cendre pour la nuit. */
  couvrir: boolean;
}

const EFFETS_FEU: Record<FormeFeu, EffetsFeu> = {
  feu_camp: { bois: 1, lumiere: 1, odeur: 1, boisMax: 10, chaleur: 1, cuisine: 1, plats: 1, rotir: 1, bouillirBois: 1, bouillirDuree: 1, couvrir: false },
  foyer_pierres: { bois: 0.8, lumiere: 0.8, odeur: 1, boisMax: 16, chaleur: 1.15, cuisine: 2, plats: 1, rotir: 1, bouillirBois: 1, bouillirDuree: 1, couvrir: true },
  foyer_cuisine: { bois: 0.8, lumiere: 0.8, odeur: 1, boisMax: 16, chaleur: 1.15, cuisine: 3, plats: 2, rotir: 2, bouillirBois: 1, bouillirDuree: 0.5, couvrir: true },
  four_terre: { bois: 0.5, lumiere: 0.3, odeur: 1, boisMax: 16, chaleur: 1.15, cuisine: 4, plats: 2, rotir: 2, bouillirBois: 1, bouillirDuree: 0.5, couvrir: true },
  poele: { bois: 0.5, lumiere: 0.2, odeur: 0.8, boisMax: 16, chaleur: 1.15, cuisine: 3, plats: 2, rotir: 1, bouillirBois: 1, bouillirDuree: 0.5, couvrir: true },
  dakota: { bois: 0.6, lumiere: 0.3, odeur: 0.4, boisMax: 10, chaleur: 1, cuisine: 1, plats: 1, rotir: 1, bouillirBois: 1, bouillirDuree: 1, couvrir: false },
  poele_fusee: { bois: 0.4, lumiere: 0.2, odeur: 0.3, boisMax: 4, chaleur: 1, cuisine: 1, plats: 1, rotir: 1, bouillirBois: 0.6, bouillirDuree: 1, couvrir: false },
};

/** Un feu couvert sous la cendre (foyer de pierres et au-delà) : il brûle quatre fois moins, sans flamme. */
export const FEU_COUVERT = { bois: 0.25, lumiere: 0, odeur: 0.5 } as const;

/** Faire bouillir l'eau au foyer de cuisine avec une casserole ou une cocotte dans le sac : bois ×0,7. */
export const BOUILLIR_AVEC_CASSEROLE = 0.7;
export const CASSEROLES: readonly TypeObjet[] = ["casserole", "cocotte_fonte"];

// La lignée du feu jusqu'au niveau 1 (plan 0.8 §2.3, chantier 5 ; tableau maître de `progression-par-ingredients-page.json`).
// La maison : feu de camp, foyer de pierres, Dakota, poêle-fusée. La Coopérative : le foyer de cuisine (clé : le grillage)
// et la marmite norvégienne (clé : la cocotte). Le four de terre attend sa porte de fonte (« plus tard », niveau 2).

/** La voie de surface : de la flamme au poêle. */
export const VOIE_SURFACE: readonly Etape[] = [
  {
    id: "feu_camp",
    nom: "Feu de camp",
    niveau: 1,
    couts: [{ pierre: 5, branche: 3 }],
    qualites: {},
    duree: 15,
    intensite: "legere",
    etapeLieu: "maison",
    apporte: "Cuire les plats, faire bouillir l'eau, rôtir, s'éclairer.",
    examen: "Un cercle de pierres noircies. On y cuit, on y fait bouillir l'eau, on s'y éclaire.",
  },
  {
    id: "foyer_pierres",
    nom: "Foyer de pierres",
    niveau: 2,
    couts: [{ pierre: 6, buche: 2 }],
    qualites: { marteler: 1 },
    duree: 30,
    intensite: "moyenne",
    etapeLieu: "maison",
    apporte: "Brûle 20 % de bois en moins, tient 16 kg de bois, se couvre sous la cendre pour la nuit ; son muret renvoie la chaleur vers l'abri (sommeil ×1,15 à moins de 3 m). On y durcit au feu l'épieu, les flèches, le bâton à fouir.",
    examen: "Un foyer maçonné à sec, plus haut et plus régulier, avec un muret réflecteur. À l'abri du vent, il brûle moins de bois.",
  },
  {
    id: "foyer_cuisine",
    nom: "Foyer de cuisine",
    niveau: 3,
    couts: [{ branche: 3, corde: 1, grillage_rouleau: 1 }],
    qualites: { couper: 1, marteler: 1 },
    duree: 30,
    intensite: "moyenne",
    etapeLieu: "L1",
    cle: {
      objet: "grillage_rouleau",
      ou: "L1A",
      idee: "Ce grillage, posé sur ton foyer, ferait une grille. Tu y penses.",
      ideePlusTard: "Ce grillage pourra servir à ton feu, un jour.",
      indice: ["Une grille ? Les fermes ont des clôtures.", "À la Coopérative."],
    },
    apporte: "Une crémaillère et une grille : deux plats à la fois, la soupe de cèpes, l'eau bout deux fois plus vite, on rôtit deux fois plus vite.",
    examen: "Un trépied et sa crémaillère au-dessus du foyer, une grille de grillage replié posée sur les pierres. Une vraie cuisine.",
  },
  {
    id: "four_terre",
    nom: "Four de terre",
    niveau: 4,
    couts: [{ pierre: 6, branche: 4, glaise: 4 }],
    qualites: { marteler: 1 },
    duree: 180,
    intensite: "lourde",
    // Plus tard (plan 0.8 §1.3, V4-6) : sa clé est au niveau 2 ; ses deux plats attendent, grisés.
    aVenir: "niveau 2",
    etapeLieu: "L2",
    cle: {
      nom: "porte de four en fonte",
      ou: "L2B",
      idee: "Cette porte de fonte sur un dôme de glaise : un vrai four.",
      ideePlusTard: "Cette porte servira à un four, un jour.",
      indice: ["Une porte de four ? Les boulangeries en ont.", "Plus loin, pas encore sur ta carte."],
    },
    apporte: "Un dôme de glaise fermé d'une porte de fonte : deux fois moins de bois en cuisine, le pot-au-feu de volaille et la volaille aux cèpes.",
    examen: "Un dôme de glaise sur le foyer, fermé d'une porte de fonte.",
  },
  {
    id: "poele",
    nom: "Poêle",
    niveau: 5,
    couts: [],
    qualites: {},
    duree: 240,
    intensite: "lourde",
    famille: "charbonniers",
    aVenir: "0b",
    etapeLieu: "L3",
    apporte: "Dans une cabane : il chauffe la pièce, et l'on cuisine sur sa plaque.",
    examen: "Un poêle, au cœur de la cabane.",
  },
];

/** La voie creusée : moins de signature, moins de confort. Elle s'arrête au niveau 2. */
export const VOIE_CREUSEE: readonly Etape[] = [
  {
    id: "dakota",
    nom: "Foyer Dakota",
    niveau: 1,
    couts: [{ branche: 3 }],
    qualites: { creuser: 1 },
    duree: 15,
    intensite: "moyenne",
    etapeLieu: "maison",
    apporte: "Un feu creusé dans le sol : 40 % de bois en moins, il se voit trois fois moins la nuit, fume moins ; la poêle posée sur le trou fait un réchaud. Pas de chaleur pour l'abri.",
    examen: "Deux trous reliés sous terre : la flamme reste dans le sol. On le voit à peine la nuit.",
  },
  {
    id: "poele_fusee",
    nom: "Poêle-fusée des Abondants",
    niveau: 2,
    couts: [{ boite_vide: 4, pierre: 4 }],
    qualites: { marteler: 1 },
    duree: 20,
    intensite: "legere",
    etapeLieu: "maison",
    apporte: "Quatre boîtes de conserve dans un lit de pierres : le bois ×0,4, l'eau bout avec 40 % de bois en moins, presque invisible. Mais petit : 4 kg de bois, un seul plat.",
    examen: "Quatre boîtes de conserve emboîtées dans un lit de pierres : le tirage aspire la flamme. Les déchets de l'Âge de l'Abondance font le meilleur réchaud de bivouac.",
  },
];

/**
 * Creuser un feu de camp en Dakota, sur place (Book 24 §3.1) : on retire les pierres du cercle, on creuse. On les reprend
 * toutes (B12) : combler en coûte autant, plus rien ne se perd à changer de voie.
 */
export const CREUSER: { qualites: Partial<Record<Qualite, number>>; duree: number; rend: Inventaire } = { qualites: { creuser: 1 }, duree: 15, rend: { pierre: 5 } };
/** Combler un Dakota pour en refaire un feu de camp : des pierres pour le cercle. */
export const COMBLER: { qualites: Partial<Record<Qualite, number>>; duree: number; cout: Inventaire } = { qualites: { creuser: 1 }, duree: 10, cout: { pierre: 5 } };

/** Ce qu'il faut savoir d'un feu pour le situer dans sa lignée. */
export interface FeuDansLignee {
  niveau?: number;
  dakota?: boolean;
}

export function voieFeu(f: FeuDansLignee): readonly Etape[] {
  return f.dakota ? VOIE_CREUSEE : VOIE_SURFACE;
}

/** Le niveau d'un feu (1 par défaut : les feux d'avant le Book 24). */
export function niveauFeu(f: FeuDansLignee): number {
  const voie = voieFeu(f);
  return Math.max(1, Math.min(voie.length, Math.floor(f.niveau ?? 1)));
}

export function etapeFeu(f: FeuDansLignee): Etape {
  return voieFeu(f)[niveauFeu(f) - 1]!;
}

export function formeFeu(f: FeuDansLignee): FormeFeu {
  return etapeFeu(f).id as FormeFeu;
}

export function effetsFeu(f: FeuDansLignee): EffetsFeu {
  return EFFETS_FEU[formeFeu(f)];
}

/** Le niveau d'après dans la même voie (même s'il attend la 0b), ou null au bout. */
export function etapeSuivanteFeu(f: FeuDansLignee): Etape | null {
  return voieFeu(f)[niveauFeu(f)] ?? null;
}

// ---------- Les accessoires du feu (comme la meule du pédalier) ----------

export type AccessoireFeu = "broche" | "marmite";

export interface DefAccessoire {
  /** Son identifiant (celui de la carte des constructions, « feu+marmite », et de l'idée gardée). */
  id: AccessoireFeu;
  nom: string;
  /** Les formes qui l'acceptent. */
  formes: readonly FormeFeu[];
  couts: Inventaire[];
  qualites: Partial<Record<Qualite, number>>;
  duree: number;
  /** Plan 0.8 : l'étape de la grille où il se monte. */
  etapeLieu?: EtapeGrille;
  /** Plan 0.8 : sa clé, s'il en a une (la marmite : la cocotte en fonte). */
  cle?: CleEvolution;
  apporte: string;
}

export const ACCESSOIRES_FEU: Record<AccessoireFeu, DefAccessoire> = {
  broche: {
    id: "broche",
    nom: "Broche",
    formes: ["feu_camp", "foyer_pierres", "foyer_cuisine", "dakota"],
    couts: [{ branche: 2 }],
    qualites: { couper: 1 },
    duree: 5,
    etapeLieu: "maison",
    apporte: "Deux fourches et une broche : on rôtit une portion de plus à la fois.",
  },
  marmite: {
    id: "marmite",
    nom: "Marmite norvégienne",
    formes: ["foyer_cuisine", "four_terre", "poele"],
    couts: [{ branche: 4, chiffons: 4, cocotte_fonte: 1 }],
    qualites: {},
    duree: 20,
    etapeLieu: "L1",
    cle: {
      objet: "cocotte_fonte",
      ou: "L1A",
      idee: "Une cocotte dans une caisse de chiffons : la soupe finirait de cuire sans feu.",
      ideePlusTard: "Cette cocotte servira à ta cuisine, un jour.",
      indice: ["Une cocotte en fonte ? Les magasins en vendaient.", "À la Coopérative."],
    },
    apporte: "Une caisse garnie de chiffons, la cocotte dedans : la soupe finit de cuire sans feu, avec moitié moins de bois.",
  },
};

/**
 * Le bois d'un mijoté avec la marmite norvégienne montée (`paye` : ce qu'elle a coûté) : moitié moins avec la cocotte en
 * fonte, qui garde la chaleur ; un quart de moins seulement avec la casserole de l'ancien repli (la soupe refroidit plus
 * vite). Plan 0.10 : le repli ne se fait plus, mais une marmite montée ainsi dans une partie de la 0.9 se relit.
 */
export const BOIS_MARMITE = { cocotte: 0.5, casserole: 0.75 } as const;

export function boisMarmite(paye: Inventaire | undefined): number {
  if (!paye) return 1;
  return (paye.cocotte_fonte ?? 0) > 0 || (paye.casserole ?? 0) === 0 ? BOIS_MARMITE.cocotte : BOIS_MARMITE.casserole;
}

/**
 * Un accessoire à clé vu comme une étape (pour l'idée au ramassage, l'indice, la fiche) : un cran au-dessus des foyers qui
 * l'acceptent (niveau 2 : la forme posée vaut 1, l'accessoire monté 2).
 */
export function etapeAccessoire(def: DefAccessoire): Etape {
  return { id: def.id, nom: def.nom, niveau: 2, couts: def.couts, qualites: def.qualites, duree: def.duree, intensite: "legere", ...(def.etapeLieu ? { etapeLieu: def.etapeLieu } : {}), ...(def.cle ? { cle: def.cle } : {}), apporte: def.apporte, examen: def.apporte };
}

export function estAccessoireFeu(x: unknown): x is AccessoireFeu {
  return typeof x === "string" && Object.hasOwn(ACCESSOIRES_FEU, x);
}

/** Les accessoires montés qui ne vont plus sur cette forme (ils reviennent dans le sac). */
export function accessoiresIncompatibles(forme: FormeFeu, accessoires: Partial<Record<AccessoireFeu, Inventaire>>): AccessoireFeu[] {
  return (Object.keys(accessoires) as AccessoireFeu[]).filter((a) => estAccessoireFeu(a) && !ACCESSOIRES_FEU[a].formes.includes(forme));
}

// ---------- Les installations (Book 24 §3.2 à §3.4 : l'eau, le couchage, le stockage) ----------

/** Les lignées des installations : le niveau 1 est l'installation d'aujourd'hui (son coût est celui de sa recette). */
export const LIGNEES_INSTALLATIONS: Partial<Record<TypeInstallation, readonly Etape[]>> = {
  // ---------- Le couchage (plan 0.8 §2.3, chantier 6) ----------
  // L'abri garni est le lit de branchages (I25) : le lit ne se pose plus à part, celui qu'on trouve à côté est absorbé.
  abri: [
    {
      id: "abri",
      nom: "Abri",
      niveau: 1,
      couts: [{ branche: 8, bache: 1 }],
      qualites: { couper: 1 },
      duree: 60,
      intensite: "moyenne",
      etapeLieu: "maison",
      apporte: "Dormir deux fois mieux que par terre ; s'y déconnecter vaut une nuit complète.",
      examen: "Un appentis de branches et de bâche. De quoi dormir au sec, près du feu.",
    },
    {
      id: "abri_garni",
      nom: "Abri garni",
      niveau: 2,
      couts: [{ branche: 6 }],
      qualites: { couper: 1 },
      duree: 20,
      intensite: "legere",
      etapeLieu: "maison",
      apporte: "Un lit de branchages sous la bâche : sommeil ×1,3.",
      examen: "L'appentis, avec un lit de rameaux sous la bâche : on dort isolé du sol.",
    },
    {
      id: "abri_ferme",
      nom: "Abri fermé",
      niveau: 3,
      // La clé : la toile de jute du Moulin, tendue côté vent.
      couts: [{ branche: 10, corde: 1, poignee_clous: 1, toile_jute: 1 }],
      qualites: { couper: 1, marteler: 1 },
      duree: 40,
      intensite: "moyenne",
      etapeLieu: "L1",
      cle: {
        objet: "toile_jute",
        ou: "L1B",
        idee: "Cette toile tendue côté vent, et ton abri devient une chambre.",
        ideePlusTard: "Cette toile pourra fermer ton abri, un jour.",
        indice: ["De la grosse toile ? Pense à un moulin.", "Au Moulin du Gué."],
      },
      apporte: "Une toile clouée côté vent, l'abri devient une chambre : sommeil ×1,45, des nuits plus courtes.",
      examen: "L'abri, fermé côté vent par une toile de jute clouée sur des perches, le lit de rameaux à l'abri des courants d'air.",
    },
    {
      id: "abri_double",
      nom: "Abri doublé",
      niveau: 4,
      couts: [{ branche: 4 }],
      qualites: { couper: 1 },
      duree: 20,
      intensite: "legere",
      aVenir: "niveau 2",
      etapeLieu: "L2",
      cle: {
        nom: "couvertures de laine",
        ou: "L2A",
        idee: "Ces couvertures sur ton lit : tu dormirais comme avant.",
        ideePlusTard: "Ces couvertures serviront, un jour.",
        indice: ["De la vraie laine ? Une auberge, un hôtel.", "Plus loin, pas encore sur ta carte."],
      },
      apporte: "Des couvertures de laine sur le lit : on dort comme avant la Panne (sommeil ×1,6).",
      examen: "L'abri fermé, le lit doublé de couvertures de laine.",
    },
    {
      id: "hutte",
      nom: "Hutte de clayonnage et torchis",
      niveau: 5,
      couts: [],
      qualites: {},
      duree: 480,
      intensite: "lourde",
      aVenir: "0b",
      etapeLieu: "L3",
      apporte: "Des murs de torchis : elle se chauffe avec un foyer voisin, elle a une porte.",
      examen: "Une hutte de torchis.",
    },
  ],
  // L'eau jusqu'au niveau 1 (plan 0.8 §2.3, chantier 5) : le bidon de 5 L de la ruine sous un entonnoir de sacs plastique,
  // puis le seau de 10 L de la Coopérative. La citerne de 60 L sort de la lignée (V4-7) ; le 20 L attend le niveau 2.
  recuperateur_pluie: [
    {
      id: "recuperateur_pluie",
      nom: "Récupérateur de pluie",
      niveau: 1,
      couts: [{ bidon_5l: 1, branche: 4, corde: 1, sac_plastique: 4 }],
      qualites: { couper: 1 },
      duree: 30,
      intensite: "legere",
      etapeLieu: "maison",
      apporte: "5 L d'eau de pluie, potable, qui se remplit même quand tu n'es pas là.",
      examen: "Quatre sacs plastique tendus en entonnoir sur quatre piquets, qui gouttent dans un bidon de 5 L.",
    },
    {
      id: "recuperateur_seau",
      nom: "Récupérateur à seau",
      niveau: 2,
      couts: [{ seau_10l: 1, branche: 2 }],
      qualites: { couper: 1 },
      duree: 20,
      intensite: "legere",
      etapeLieu: "L1",
      cle: {
        objet: "seau_10l",
        ou: "L1A",
        idee: "Ce seau sous ton entonnoir : deux fois plus d'eau.",
        ideePlusTard: "Ce seau pourra garder ton eau, un jour.",
        indice: ["Un seau de 10 L ? Là où l'on trayait les vaches.", "À la Coopérative."],
      },
      apporte: "Un seau galvanisé sous l'entonnoir, calé sur deux branches : 10 L d'eau de pluie, potable, même quand tu n'es pas là.",
      examen: "L'entonnoir de sacs plastique goutte dans un seau de laiterie, calé sur deux branches. Dix litres.",
    },
    {
      id: "recuperateur_jerrican",
      nom: "Récupérateur à jerrican",
      niveau: 3,
      couts: [{ branche: 2 }],
      qualites: { couper: 1 },
      duree: 20,
      intensite: "legere",
      // Plus tard (plan 0.8 §1.2) : le jerrican de 20 L est la clé d'un lieu du niveau 2.
      aVenir: "niveau 2",
      etapeLieu: "L2",
      cle: {
        nom: "jerrican de 20 L",
        ou: "L2B",
        idee: "Ce jerrican sous ton entonnoir : vingt litres d'eau de pluie.",
        ideePlusTard: "Ce jerrican gardera ton eau, un jour.",
        indice: ["Un jerrican de 20 L ? Un dépôt, un entrepôt.", "Plus loin, pas encore sur ta carte."],
      },
      apporte: "20 L d'eau de pluie : l'eau d'une famille entière, et de quoi en vendre.",
      examen: "Un jerrican de 20 L sous l'entonnoir.",
    },
  ],
  // ---------- Le stockage (plan 0.8 §2.3, chantier 6) ----------
  // Le râtelier à outils est à part : une installation posée, sans niveaux (outils-a-portee.ts).
  coffre: [
    {
      id: "coffre",
      nom: "Coffre",
      niveau: 1,
      couts: [{ buche: 4, branche: 4, corde: 1 }],
      qualites: { couper: 1, fendre: 1, marteler: 1 },
      duree: 45,
      intensite: "moyenne",
      etapeLieu: "maison",
      apporte: "Garde 150 kg.",
      examen: "Un coffre de planches, ficelé de corde.",
    },
    {
      id: "coffre_cercle",
      nom: "Coffre cerclé",
      niveau: 2,
      // La clé : les feuillards des barils du Moulin.
      couts: [{ buche: 2, poignee_clous: 1, feuillards: 1 }],
      qualites: { marteler: 2 },
      duree: 30,
      intensite: "lourde",
      etapeLieu: "L1",
      cle: {
        objet: "feuillards",
        ou: "L1B",
        idee: "Ces cercles de fer autour de ton coffre : il tiendrait le double.",
        ideePlusTard: "Ces cercles tiendront un coffre, un jour.",
        indice: ["Des cercles de fer ? Là où l'on gardait tout en tonneaux.", "Au Moulin du Gué."],
      },
      apporte: "Cerclé de feuillards cloués, le fond renforcé : il garde 250 kg.",
      examen: "Le coffre, cerclé de feuillards de fer cloués, le fond doublé.",
    },
    {
      id: "reserve_couverte",
      nom: "Réserve couverte",
      niveau: 3,
      couts: [{ perche_frene: 4, pierre: 4, poignee_clous: 1 }],
      qualites: { couper: 1, marteler: 2 },
      duree: 40,
      intensite: "moyenne",
      aVenir: "niveau 2",
      etapeLieu: "L2",
      cle: {
        nom: "tôles ondulées",
        ou: "L2A",
        idee: "Ces tôles sur des perches : un vrai toit pour tes réserves.",
        ideePlusTard: "Ces tôles feront un toit, un jour.",
        indice: ["De la tôle ? Une ferme, ses granges.", "Plus loin, pas encore sur ta carte."],
      },
      apporte: "Sous un toit de tôles ondulées, sur des pierres : il garde 400 kg.",
      examen: "Le coffre cerclé, monté sur des pierres sous un auvent de tôles.",
    },
  ],
  // ---------- L'établi (plan 0.8 §2.3, chantier 6) ----------
  // L'établi à étau serre fort (Serrer 3, à 3 m : outils-a-portee.ts).
  etabli: [
    {
      id: "etabli",
      nom: "Établi",
      niveau: 1,
      couts: [{ buche: 4, branche: 6 }],
      qualites: { couper: 1, fendre: 1, marteler: 1 },
      duree: 90,
      intensite: "moyenne",
      etapeLieu: "maison",
      apporte: "Les gestes fins : ébaucher un arc, monter une arbalète, dresser des flèches.",
      examen: "Un établi solide. On y fabrique ce qui demande de la précision.",
    },
    {
      id: "etabli_etau",
      nom: "Établi à étau",
      niveau: 2,
      // La clé : l'étau du rhabilleur, boulonné sur le plateau.
      couts: [{ etau: 1 }],
      qualites: { serrer: 1 },
      duree: 30,
      intensite: "moyenne",
      etapeLieu: "L1",
      cle: {
        objet: "etau",
        ou: "L1B",
        idee: "Un étau ! Boulonné sur ton établi, il serrerait ce que tes mains ne tiennent pas.",
        ideePlusTard: "Cet étau servira sur un établi, un jour.",
        indice: ["Un étau ? Un atelier en a toujours un.", "Au Moulin du Gué."],
      },
      apporte: "L'étau boulonné serre fort (Serrer 3, à 3 m) : maillet, coins, planches fendues, et réparer un manche sans forge.",
      examen: "L'établi, un étau de fonte boulonné à son angle : il tient la pièce pendant qu'on la travaille.",
    },
    {
      id: "etabli_menuisier",
      nom: "Établi de menuisier",
      niveau: 3,
      couts: [{ buche: 2 }],
      qualites: { raboter: 1 },
      duree: 60,
      intensite: "moyenne",
      aVenir: "niveau 2",
      etapeLieu: "L2",
      cle: {
        qualite: { qualite: "raboter", niveau: 1 },
        ou: "L2B",
        idee: "Avec ce rabot, ton établi devient celui d'un menuisier.",
        ideePlusTard: "Ce rabot servira sur un établi, un jour.",
        indice: ["Un rabot ? Chez un menuisier.", "Plus loin, pas encore sur ta carte."],
      },
      apporte: "Un rabot : des planches lisses, des manches d'outils plus solides.",
      examen: "Un établi de menuisier, son rabot et ses planches lisses.",
    },
  ],
  // ---------- La lumière (plan 0.8 §2.3, chantier 6 ; Book 24 §3.5) ----------
  // La torche plantée brûle jusqu'au matin suivant, puis il faut en planter une autre (torche.ts).
  torche_plantee: [
    {
      id: "torche_plantee",
      nom: "Torche plantée",
      niveau: 1,
      couts: [{ branche: 1, chiffons: 1, graisse: 1 }],
      qualites: { couper: 1 },
      duree: 10,
      intensite: "legere",
      etapeLieu: "maison",
      apporte: "Éclaire 6 m autour jusqu'au matin, sans allumer de feu. La nuit, elle se voit de loin.",
      examen: "Une branche plantée, un chiffon gras qui brûle au bout. Elle éclaire six mètres autour, jusqu'au matin.",
    },
    {
      id: "lanterne_fixe",
      nom: "Lanterne fixe",
      niveau: 2,
      couts: [{ branche: 2 }],
      qualites: { couper: 1 },
      duree: 20,
      intensite: "legere",
      aVenir: "niveau 2",
      etapeLieu: "L2",
      cle: {
        nom: "lanterne-tempête",
        ou: "L2A",
        idee: "Cette lanterne pendue à ton abri : de la lumière toute la nuit, sans feu.",
        ideePlusTard: "Cette lanterne servira, un jour.",
        indice: ["Une lanterne-tempête ? Une vieille ferme en a une.", "Plus loin, pas encore sur ta carte."],
      },
      apporte: "Une lanterne-tempête pendue à une perche : 14 m de lumière toute la nuit, sans flamme nue.",
      examen: "Une lanterne-tempête pendue à une perche.",
    },
  ],
  // 🔥 La lignée de la forge (Book 25 §4.1 et §9.3 ; plan 0.8, chantier 7) : le foyer de forge, puis la forge ventilée
  // (plus tard). Ses accessoires (enclume, bac de trempe, ventilateur ⚡) se posent sur place : serveur/src/forge.ts. La
  // clé du foyer, l'enclume de dépanneur, se cale sur son billot (« poser l'enclume ») ; sans elle, sa grosse pierre
  // plate ne donne que ★ (Q-0.8-1). Le mot « soufflet » est réservé à la clé de la forge ventilée (Q-0.8-13).
  // Les trois meubles de famille ont la même règle : le niveau 1 se pose avec sa recette (les matériaux de la maison),
  // puis la pièce de la station se monte dessus. Sans sa pièce, le meuble fait moins bien : la pierre plate, la manivelle
  // de la lampe, la dynamo du vélo (montée à la place de l'alternateur) ; ce n'est pas un repli de sa clé (plan 0.10).
  forge: [
    {
      id: "forge",
      nom: "Foyer de forge",
      niveau: 1,
      couts: [{ pierre: 8, barre_metal: 1, branche: 2 }],
      qualites: { marteler: 1 },
      duree: 90,
      intensite: "lourde",
      famille: "charbonniers",
      etapeLieu: "H1",
      cle: {
        objet: "enclume_depanneur",
        ou: "H1A",
        idee: "Une enclume ! Avec un foyer de pierres et du charbon, tu pourrais forger.",
        ideePlusTard: "Cette enclume servira à une forge, un jour.",
        indice: ["Une enclume ? Les dépanneurs en avaient une.", "À la station."],
      },
      apporte: "Forger au charbon, vers 900 °C : des outils, des pièces de fer, des lames. Les lames montent à ★★ sur une enclume, ★ sur la pierre plate.",
      examen: "Un foyer de pierres, une tuyère de fer, un billot et sa pierre plate pour enclume. Il faut du charbon de bois.",
    },
    {
      id: "forge_ventilee",
      nom: "Forge ventilée",
      niveau: 2,
      // Le tableau maître : la tuyère chemisée de glaise du gué, le soufflet de forge de L2B (la clé, plus tard).
      couts: [{ pierre: 6, glaise: 2, barre_metal: 1 }],
      qualites: { marteler: 2 },
      duree: 60,
      intensite: "lourde",
      famille: "charbonniers",
      aVenir: "niveau 2",
      etapeLieu: "L2",
      cle: {
        nom: "soufflet de forge",
        ou: "L2B",
        idee: "Ce soufflet de forge sur ton foyer : le fer soudera.",
        ideePlusTard: "Ce soufflet de forge servira, un jour.",
        indice: ["Un soufflet de forge ? Chez un maréchal-ferrant.", "Plus loin, pas encore sur ta carte."],
      },
      apporte: "Avec un soufflet de forge, vers 1 300 °C : souder. Les lames montent à ★★★, et de plus grandes s'y forgent.",
      examen: "Le foyer, chemisé de glaise, une tuyère de fer, et le grand soufflet de forge d'un maréchal. Le charbon y blanchit.",
    },
  ],
  // ⚡ Le banc solaire (plan 0.8, chantier 7) : le banc de recharge et son panneau ne font plus qu'un meuble. La clé, le
  // petit panneau de la station, se pose sur le banc (« poser le panneau ») : 80 Wh par jour au soleil dans les
  // batteries posées dessus (la batterie de la ruine). Sans lui : la manivelle de la lampe à dynamo, lente.
  banc_recharge: [
    {
      id: "banc_recharge",
      nom: "Banc solaire",
      niveau: 1,
      couts: [{ buche: 2, barre_metal: 1, branche: 3 }],
      qualites: { visser: 1, serrer: 1 },
      duree: 60,
      intensite: "moyenne",
      famille: "voltaiques",
      etapeLieu: "H1",
      cle: {
        objet: "panneau_solaire",
        ou: "H1A",
        idee: "Ce panneau, posé sur un banc de planches : ton courant à toi, chaque jour.",
        ideePlusTard: "Ce panneau servira sur un banc, un jour.",
        indice: ["Un panneau solaire ? Les stations-service en avaient.", "À la station."],
      },
      apporte: "Brancher et assembler ce qui marche au courant. Le panneau posé dessus remplit sa batterie au soleil, 80 Wh par jour.",
      examen: "Un banc de planches, des pinces, un régulateur bricolé ; le petit panneau de la station couché dessus, plein sud.",
    },
  ],
  // ⚙️ Le pédalier générateur (plan 0.8, chantier 7) : le vélo de la ruine sur un bâti, la roue entraîne le petit
  // alternateur de la station (la clé, « monter l'alternateur ») par une courroie : ≈ 60 Wh par heure de pédalage dans
  // la batterie posée dessus (la batterie de la ruine). Sans lui : la dynamo du vélo, 3 à 6 W. La meule et le
  // ventilateur à manivelle s'y montent (serveur/src/mecanique.ts).
  pedalier: [
    {
      id: "pedalier",
      nom: "Pédalier générateur",
      niveau: 1,
      couts: [{ cadre_velo: 1, chaine_velo: 1, roue_velo: 1, buche: 2 }],
      qualites: { serrer: 1, visser: 1, marteler: 1 },
      duree: 90,
      intensite: "moyenne",
      famille: "mecanistes",
      etapeLieu: "H1",
      cle: {
        objet: "petit_alternateur",
        ou: "H1A",
        idee: "Un alternateur… Entraîné par le vélo de la ruine, il ferait du courant à chaque coup de pédale.",
        ideePlusTard: "Cet alternateur servira sur un pédalier, un jour.",
        indice: ["Un petit alternateur ? Là où l'on réparait les voitures.", "À la station."],
      },
      apporte: "Pédaler : l'alternateur fait du courant, environ 60 Wh par heure, pour la batterie d'un banc tout proche ou celle posée dessus. La meule et le ventilateur à manivelle s'y montent.",
      examen: "Le vieux vélo de la ruine sur un bâti de bois ; sa roue entraîne, par une courroie, le petit alternateur d'une voiture.",
    },
  ],
};

/**
 * La pièce de chaque meuble de famille (plan 0.8 §9.2) : le champ de son état qui dit qu'elle est posée (l'enclume, le
 * panneau, l'alternateur). Le meuble ne compte comme monté au niveau de sa clé qu'une fois sa pièce posée : sans elle,
 * « Tu y penses » parle encore au ramassage de la pièce, et la fiche montre la clé à trouver.
 */
export const PIECES_DE_FAMILLE: Partial<Record<TypeInstallation, "enclume" | "panneau" | "alternateur">> = {
  forge: "enclume",
  banc_recharge: "panneau",
  pedalier: "alternateur",
};

/** Ce meuble de famille attend-il encore sa pièce ? (false pour tout autre meuble.) */
export function pieceAPoser(i: { type: string; etat?: Partial<Record<"enclume" | "panneau" | "alternateur", unknown>> }): boolean {
  const piece = PIECES_DE_FAMILLE[i.type as TypeInstallation];
  return piece !== undefined && !i.etat?.[piece];
}

/** Ce que tient un coffre selon son niveau (kg). */
export const CAPACITES_COFFRE = [150, 250, 400] as const;
/** Ce que tient le récupérateur selon son niveau (L) : le bidon, le seau, le jerrican (plus tard). */
export const CONTENANCES_RECUPERATEUR = [5, 10, 20] as const;
/** Le sommeil dans l'abri selon son niveau (multiplicateur, comme le lit de branchages). */
export const SOMMEIL_ABRI = [1, 1.3, 1.45, 1.6, 1.6] as const;
/**
 * L'abri fermé par l'ancien repli (chiffons et sacs plastique cousus, sans la toile de jute) : moins chaud (plan 0.8
 * §9.2). Plan 0.10 : ce repli ne se fait plus ; un abri fermé ainsi dans une partie de la 0.9 se relit tel quel.
 */
export const SOMMEIL_ABRI_FERME_REPLI = 1.35;

export function lignee(type: string): readonly Etape[] | null {
  return LIGNEES_INSTALLATIONS[type as TypeInstallation] ?? null;
}

export function niveauInstallation(i: { type: string; niveau?: number }): number {
  const l = lignee(i.type);
  return Math.max(1, Math.min(l?.length ?? 1, Math.floor(i.niveau ?? 1)));
}

/**
 * Le sommeil dans un abri posé : celui de son niveau ; l'abri fermé sans la toile de jute (ce qu'on a payé pour le
 * fermer, le dernier de `etat.payes`, n'en a pas : l'ancien repli de sa clé, d'une partie de la 0.9) ne donne que ×1,35.
 */
export function sommeilAbri(i: { type: string; niveau?: number; etat?: { payes?: readonly Inventaire[] } }): number {
  const niveau = niveauInstallation(i);
  const s = SOMMEIL_ABRI[niveau - 1] ?? 1;
  if (i.type !== "abri" || niveau !== 3) return s;
  // Chaque montée ajoute ce qu'elle a coûté au bout de `payes`, chaque descente l'en retire : le dernier est le niveau 3.
  const ferme = i.etat?.payes?.at(-1);
  return ferme && !(ferme.toile_jute ?? 0) ? SOMMEIL_ABRI_FERME_REPLI : s;
}

export function etapeInstallation(i: { type: string; niveau?: number }): Etape | null {
  return lignee(i.type)?.[niveauInstallation(i) - 1] ?? null;
}

export function etapeSuivanteInstallation(i: { type: string; niveau?: number }): Etape | null {
  return lignee(i.type)?.[niveauInstallation(i)] ?? null;
}

export function capaciteCoffre(i: { type: string; niveau?: number }): number {
  return CAPACITES_COFFRE[niveauInstallation(i) - 1] ?? CAPACITES_COFFRE[0];
}

export function contenanceRecuperateur(i: { type: string; niveau?: number }): number {
  return CONTENANCES_RECUPERATEUR[niveauInstallation(i) - 1] ?? CONTENANCES_RECUPERATEUR[0];
}

// ---------- Les coûts ----------

/** Le coût d'une montée pour une famille : ×1,5 (arrondi au-dessus) si le niveau est le métier d'une autre famille. */
export function coutPour(cout: Inventaire, etape: { famille?: Famille }, famille: Famille): Inventaire {
  if (!etape.famille || etape.famille === famille) return { ...cout };
  const r: Inventaire = {};
  for (const [t, n] of Object.entries(cout) as [TypeObjet, number][]) r[t] = Math.ceil(n * SURCOUT_AUTRE_FAMILLE);
  return r;
}

export function aDeQuoi(inventaire: Inventaire, cout: Inventaire): boolean {
  return (Object.entries(cout) as [TypeObjet, number][]).every(([t, n]) => (inventaire[t] ?? 0) >= n);
}

/** Le premier choix de coût qu'on peut payer (ou le premier, pour dire ce qui manque). */
export function choisirCout(inventaire: Inventaire, couts: readonly Inventaire[], etape: { famille?: Famille }, famille: Famille): { cout: Inventaire; payable: boolean } {
  const possibles = (couts.length ? couts : [{}]).map((c) => coutPour(c, etape, famille));
  const bon = possibles.find((c) => aDeQuoi(inventaire, c));
  return bon ? { cout: bon, payable: true } : { cout: possibles[0]!, payable: false };
}

/**
 * Ce que rend un démontage (Book 24 §2.4, Book 02 §10, règle retenue le 2026-10-08) : la moitié des matériaux
 * naturels (arrondie en dessous), la totalité des vestiges et des objets fabriqués (une grille, une casserole, une corde).
 */
export function rendDuDemontage(paye: Inventaire): Inventaire {
  const r: Inventaire = {};
  for (const [t, n] of Object.entries(paye) as [TypeObjet, number][]) {
    const k = MATERIAUX_NATURELS.includes(t) ? Math.floor(n / 2) : n;
    if (k > 0) r[t] = k;
  }
  return r;
}

/** Additionne des inventaires. */
export function somme(...inventaires: Inventaire[]): Inventaire {
  const r: Inventaire = {};
  for (const inv of inventaires) for (const [t, n] of Object.entries(inv) as [TypeObjet, number][]) if (n) r[t] = (r[t] ?? 0) + n;
  return r;
}

/** Le bois resté dans un foyer éteint qu'on démonte : on reprend les bûches et les branches entières. */
export function boisRepris(kg: number): Inventaire {
  const buches = Math.floor(kg / 2 + 1e-9);
  const branches = Math.floor((kg - buches * 2) / 0.5 + 1e-9);
  const r: Inventaire = {};
  if (buches > 0) r.buche = buches;
  if (branches > 0) r.branche = branches;
  return r;
}
