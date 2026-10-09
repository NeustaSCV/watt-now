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
  /** Pas encore jouable : il attend la phase 0b (l'argile, la cabane). Montré grisé, comme une recette pressentie. */
  phase?: "0b";
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
    apporte: "Brûle 20 % de bois en moins, tient 16 kg de bois, se couvre sous la cendre pour la nuit ; son muret renvoie la chaleur vers l'abri (sommeil ×1,15 à moins de 3 m).",
    examen: "Un foyer maçonné à sec, plus haut et plus régulier, avec un muret réflecteur. À l'abri du vent, il brûle moins de bois.",
  },
  {
    id: "foyer_cuisine",
    nom: "Foyer de cuisine",
    niveau: 3,
    couts: [
      { branche: 3, corde: 1, grillage_rouleau: 1 },
      { branche: 3, corde: 1, barre_metal: 2 },
    ],
    qualites: { couper: 1, marteler: 1 },
    duree: 30,
    intensite: "moyenne",
    apporte: "Une crémaillère et une grille : deux plats à la fois, les soupes mijotées, l'eau bout deux fois plus vite, on rôtit deux fois plus vite.",
    examen: "Un trépied et sa crémaillère au-dessus du foyer, une grille posée sur les pierres. Une vraie cuisine.",
  },
  {
    id: "four_terre",
    nom: "Four de terre",
    niveau: 4,
    couts: [{ pierre: 6, branche: 4 }],
    qualites: { marteler: 1 },
    duree: 180,
    intensite: "lourde",
    phase: "0b",
    apporte: "Un dôme d'argile : la cuisson continue seule, même quand tu n'es pas là ; deux fois moins de bois ; le pain.",
    examen: "Un dôme d'argile sur le foyer.",
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
    phase: "0b",
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
    apporte: "Un feu creusé dans le sol : 40 % de bois en moins, il se voit trois fois moins la nuit, fume moins. Pas de chaleur pour l'abri.",
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
    apporte: "Quatre boîtes de conserve dans un lit de pierres : le bois ×0,4, l'eau bout avec 40 % de bois en moins, presque invisible. Mais petit : 4 kg de bois, un seul plat.",
    examen: "Quatre boîtes de conserve emboîtées dans un lit de pierres : le tirage aspire la flamme. Les déchets de l'Âge de l'Abondance font le meilleur réchaud de bivouac.",
  },
];

/** Creuser un feu de camp en Dakota, sur place (Book 24 §3.1) : on retire des pierres, on creuse. */
export const CREUSER: { qualites: Partial<Record<Qualite, number>>; duree: number; rend: Inventaire } = { qualites: { creuser: 1 }, duree: 15, rend: { pierre: 3 } };
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
  nom: string;
  /** Les formes qui l'acceptent. */
  formes: readonly FormeFeu[];
  couts: Inventaire[];
  qualites: Partial<Record<Qualite, number>>;
  duree: number;
  apporte: string;
}

export const ACCESSOIRES_FEU: Record<AccessoireFeu, DefAccessoire> = {
  broche: {
    nom: "Broche",
    formes: ["feu_camp", "foyer_pierres", "foyer_cuisine", "dakota"],
    couts: [{ branche: 2 }],
    qualites: { couper: 1 },
    duree: 5,
    apporte: "Deux fourches et une broche : on rôtit une portion de plus à la fois.",
  },
  marmite: {
    nom: "Marmite norvégienne",
    formes: ["foyer_cuisine", "four_terre", "poele"],
    couts: [
      { branche: 4, chiffons: 4, casserole: 1 },
      { branche: 4, chiffons: 4, cocotte_fonte: 1 },
    ],
    qualites: {},
    duree: 20,
    apporte: "Une caisse garnie de chiffons où la cuisson finit sans feu : les soupes demandent moitié moins de bois.",
  },
};

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
  abri: [
    {
      id: "abri",
      nom: "Abri",
      niveau: 1,
      couts: [{ branche: 8, bache: 1 }],
      qualites: { couper: 1 },
      duree: 60,
      intensite: "moyenne",
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
      apporte: "Un lit de branchages sous la bâche : sommeil ×1,3. Un lit posé à moins de 3 m est absorbé sans rien payer.",
      examen: "L'appentis, avec un lit de rameaux sous la bâche : on dort isolé du sol.",
    },
    {
      id: "abri_ferme",
      nom: "Abri fermé",
      niveau: 3,
      couts: [{ branche: 10, corde: 1, chiffons: 4 }],
      qualites: { couper: 1 },
      duree: 40,
      intensite: "moyenne",
      apporte: "Un coupe-vent tressé et une couverture : sommeil ×1,45.",
      examen: "L'abri, fermé du côté du vent par un panneau de branches tressées, une couverture de chiffons cousus sur le lit.",
    },
    {
      id: "hutte",
      nom: "Hutte de clayonnage et torchis",
      niveau: 4,
      couts: [],
      qualites: {},
      duree: 480,
      intensite: "lourde",
      phase: "0b",
      apporte: "Des murs de torchis : elle se chauffe avec un foyer voisin, elle a une porte.",
      examen: "Une hutte de torchis.",
    },
  ],
  recuperateur_pluie: [
    {
      id: "recuperateur_pluie",
      nom: "Récupérateur de pluie",
      niveau: 1,
      couts: [{ bache: 1, branche: 4, corde: 1 }],
      qualites: { couper: 1 },
      duree: 30,
      intensite: "legere",
      apporte: "5 L d'eau de pluie, potable, qui se remplit même quand tu n'es pas là.",
      examen: "Une bâche tendue en entonnoir au-dessus d'une bassine.",
    },
    {
      id: "citerne",
      nom: "Citerne de bâche",
      niveau: 2,
      couts: [{ bache: 1, branche: 6, corde: 1 }],
      qualites: { couper: 1 },
      duree: 40,
      intensite: "moyenne",
      apporte: "Un bac de perches doublé d'une deuxième bâche, avec un couvercle : 60 L d'eau de pluie, toujours potable.",
      examen: "Un grand bac de perches doublé de bâche, sous l'entonnoir, avec un couvercle. L'eau y reste propre.",
    },
  ],
  coffre: [
    {
      id: "coffre",
      nom: "Coffre",
      niveau: 1,
      couts: [{ buche: 4, branche: 4, corde: 1 }],
      qualites: { couper: 1 },
      duree: 45,
      intensite: "moyenne",
      apporte: "Garde 150 kg.",
      examen: "Un coffre de planches, ficelé de corde.",
    },
    {
      id: "coffre_cercle",
      nom: "Coffre cerclé",
      niveau: 2,
      couts: [{ barre_metal: 1, buche: 2 }],
      qualites: { marteler: 1 },
      duree: 30,
      intensite: "moyenne",
      apporte: "Cerclé de feuillards, le fond renforcé : il garde 250 kg.",
      examen: "Le coffre, cerclé de bandes de fer martelées, le fond doublé.",
    },
    {
      id: "reserve_couverte",
      nom: "Réserve couverte",
      niveau: 3,
      couts: [{ bache: 1, branche: 4, pierre: 4 }],
      qualites: { couper: 1 },
      duree: 40,
      intensite: "moyenne",
      apporte: "Sous un auvent de bâche, sur des pierres : il garde 400 kg.",
      examen: "Le coffre cerclé, monté sur des pierres sous un auvent de bâche.",
    },
  ],
  // 🔥 La lignée de la forge (Book 25 §4.1 et §9.3, chantier 5) : le foyer à soufflet, puis la forge ventilée. Ses
  // accessoires (enclume, bac de trempe, ventilateur ⚡) se posent sur place : serveur/src/forge.ts.
  forge: [
    {
      id: "forge",
      nom: "Foyer de forge à soufflet",
      niveau: 1,
      couts: [{ pierre: 8, barre_metal: 1, branche: 2 }],
      qualites: { marteler: 1 },
      duree: 90,
      intensite: "lourde",
      famille: "charbonniers",
      apporte: "Forger au charbon, vers 900 °C : couteau, hachette, machette, serpe, pointes. Les lames montent à ★★, ★★★ avec des pinces et une enclume.",
      examen: "Un foyer de pierres, un soufflet, une pierre plate pour enclume. Il faut du charbon de bois.",
    },
    {
      id: "forge_ventilee",
      nom: "Forge ventilée",
      niveau: 2,
      // La tuyère d'argile et le soufflet double : du cuir de bâche, ou des chiffons cousus.
      couts: [
        { bache: 1, pierre: 6, barre_metal: 1 },
        { chiffons: 4, pierre: 6, barre_metal: 1 },
      ],
      qualites: { marteler: 1 },
      duree: 60,
      intensite: "lourde",
      famille: "charbonniers",
      apporte: "Un soufflet double et une tuyère : vers 1 300 °C. Les lames montent à ★★★★ ; la hache et le glaive s'y forgent. On pompe soi-même, sauf avec un ventilateur.",
      examen: "Le foyer, chemisé d'argile, une tuyère de fer, et un grand soufflet double qu'on pompe d'une main. Le charbon y blanchit.",
    },
  ],
};

/** Ce que tient un coffre selon son niveau (kg). */
export const CAPACITES_COFFRE = [150, 250, 400] as const;
/** Ce que tient le récupérateur selon son niveau (L). */
export const CONTENANCES_RECUPERATEUR = [5, 60] as const;
/** Le sommeil dans l'abri selon son niveau (multiplicateur, comme le lit de branchages). */
export const SOMMEIL_ABRI = [1, 1.3, 1.45, 1.45] as const;

export function lignee(type: string): readonly Etape[] | null {
  return LIGNEES_INSTALLATIONS[type as TypeInstallation] ?? null;
}

export function niveauInstallation(i: { type: string; niveau?: number }): number {
  const l = lignee(i.type);
  return Math.max(1, Math.min(l?.length ?? 1, Math.floor(i.niveau ?? 1)));
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
