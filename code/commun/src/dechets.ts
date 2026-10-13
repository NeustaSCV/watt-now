// Les déchets de l'Abondance (0.7) : les tables de tirage par type de lieu (proposition « objets et déchets », §4.1),
// et les points du monde qu'on fouille ou qu'on démonte sur place (§3.8). Que des fonctions pures : une graine donne
// toujours le même contenu, si bien que le serveur ne garde qu'un bit « ramassé » par pièce et un délai de
// renouvellement par carreau de 20 m (décision du 2026-10-09, §7.1). Rien ne tourne en continu.
//
// La règle des trois tiers : ≈ 70 % de déchets (0 à 2 wotts), ≈ 25 % de petites trouvailles (3 à 14), ≈ 5 % de bonnes
// (15 et plus). On tire d'abord le palier, puis l'objet dans le palier (famille du lieu × rareté) : la part de chaque
// palier tient quelle que soit la taille du catalogue.
//
// Les objets de moins de 10 cm ne se trouvent que dans les conteneurs (chiffrage graphique, Q-G3) : au sol, ils ne se
// liraient pas. Le placement des amas et des points dans les lieux est fait ailleurs.

import { OBJETS, type Inventaire, type TypeObjet } from "./objets.ts";
import { energieGrise, type Qualite } from "./recettes.ts";
import { POIDS_RARETE, VESTIGES, estOrdure, type FamilleVestige, type Rarete, type TypeVestige } from "./vestiges.ts";
import { TOUS_LES_CODES_LIEU, VESTIGES_LOT2, estVestigeLot2, type CodeLieu } from "./vestiges-lot2.ts";

// ---------- Les types de lieu (§4.1) ----------

export type TypeLieuDechets = "route" | "parking" | "village" | "interieur" | "jardin" | "ferme" | "champ" | "bois" | "atelier" | "decharge" | "comptoir" | "berge";

/**
 * Un groupe de tirage (plan 0.8.2, la berge du gué) : une part des pièces, et ses objets avec leur poids. Un profil qui
 * a des groupes ne tire pas par familles et par paliers (§1.2) : il tire d'abord le groupe, puis l'objet.
 */
export interface GroupeDechets {
  nom: string;
  part: number;
  objets: Partial<Record<TypeObjet, number>>;
}

export interface ProfilLieuDechets {
  /** Le code de lieu des objets qu'on y trouve (vestiges-lot2.ts). */
  code: CodeLieu;
  /** Emplacements pour 100 m² (un carré de 10 m), réglage de départ à caler au test familial (Q3). */
  densite: number;
  /** La part des emplacements qui sont des conteneurs à fouiller (le reste : des pièces à ramasser). */
  partConteneurs: number;
  /** Le poids de chaque famille de vestiges. Un objet du lot 2 qui traîne là sans famille listée pèse 1. */
  familles: Partial<Record<FamilleVestige, number>>;
  /** Rien que des déchets (le Comptoir : les Compteurs ne laissent rien traîner de valeur). */
  seulementDechets?: true;
  /** Les trouvailles typiques du lieu (§4.1, dernière colonne) : leur poids est multiplié d'autant. */
  vedettes?: Partial<Record<TypeObjet, number>>;
  /** Un tirage par groupes, à la place des familles et des paliers (la berge du gué). */
  groupes?: readonly GroupeDechets[];
}

const TOUTES_LES_FAMILLES: Record<FamilleVestige, number> = {
  cuisine: 1,
  salle_de_bain: 1,
  salon: 1,
  gadget: 1,
  garage: 1,
  voiture: 1,
  ferme: 1,
  composant: 0,
  dechet: 1,
  textile: 1,
  loisir: 1,
};

export const PROFILS_DECHETS: Record<TypeLieuDechets, ProfilLieuDechets> = {
  route: {
    code: "R",
    densite: 2,
    partConteneurs: 0.3,
    familles: { dechet: 6, voiture: 3, textile: 2, loisir: 1 },
    vedettes: { velo_libre_service: 6, ressort_suspension: 3, trottinette_electrique: 5, appareil_photo_jetable: 3, oreiller_plumes: 2 },
  },
  parking: {
    code: "P",
    densite: 3,
    partConteneurs: 0.4,
    familles: { dechet: 6, voiture: 3, gadget: 1, garage: 1 },
    vedettes: { onduleur: 8, sac_charbon_bbq: 2, trottinette_electrique: 3, velo_libre_service: 3, appareil_photo_jetable: 3 },
  },
  village: {
    code: "V",
    densite: 2.5,
    partConteneurs: 0.5,
    familles: { dechet: 5, cuisine: 2, salon: 2, textile: 2, gadget: 2, loisir: 2 },
    vedettes: { appareils_mariage: 3, trottinette_electrique: 3 },
  },
  // Selon la pièce, comme le lot 1, plus des déchets.
  interieur: {
    code: "I",
    densite: 4,
    partConteneurs: 0.6,
    familles: { dechet: 3, cuisine: 2, salle_de_bain: 2, salon: 2, gadget: 2 },
    vedettes: { onduleur: 8, appareils_mariage: 2 },
  },
  jardin: { code: "J", densite: 1.5, partConteneurs: 0.4, familles: { loisir: 5, ferme: 2, dechet: 3 }, vedettes: { debroussailleuse: 2, sac_charbon_bbq: 2 } },
  ferme: { code: "F", densite: 1.5, partConteneurs: 0.4, familles: { ferme: 5, garage: 2, dechet: 3 }, vedettes: { soc_charrue: 2, fut_200: 2, oreiller_plumes: 2 } },
  champ: { code: "C", densite: 0.2, partConteneurs: 0.1, familles: { dechet: 4, ferme: 3, loisir: 1 }, vedettes: { piquet_cloture: 2 } },
  // 0,1 en sous-bois, 0,4 en lisière.
  bois: { code: "B", densite: 0.1, partConteneurs: 0.1, familles: { dechet: 4, loisir: 2, textile: 1 }, vedettes: { tente_popup: 2, hamac: 2 } },
  atelier: {
    code: "A",
    densite: 3,
    partConteneurs: 0.6,
    familles: { garage: 5, voiture: 4, dechet: 2 },
    vedettes: { ressort_suspension: 3, ressort_garage: 3, disque_scie: 2 },
  },
  decharge: { code: "D", densite: 15, partConteneurs: 0.8, familles: TOUTES_LES_FAMILLES },
  comptoir: { code: "P", densite: 1, partConteneurs: 0, familles: { dechet: 1 }, seulementDechets: true },
  // Plan 0.8.2 (chantier F, décision du porteur) : les berges du gué, plus nature que la route. La moitié de la densité
  // des bas-côtés de la station, un sac échoué de temps en temps. La moitié de ce qu'on y trouve vient de la rivière
  // elle-même, un tiers de ce que la crue charrie (abîmé, mouillé), le reste de la pêche et de la guinguette (un objet
  // de loisir, rarement une bonne trouvaille). Aucun objet propre à la berge : que des objets du catalogue.
  berge: {
    // Sa propre lettre (« G », le gué) : « R » est celle de la route. Le tirage par groupes ne la lit pas.
    code: "G",
    densite: 1,
    partConteneurs: 0.1,
    familles: {},
    groupes: [
      { nom: "la rivière", part: 0.5, objets: { branche: 4, fibres: 3, plumes: 2, os: 2 } },
      { nom: "ce que la crue charrie", part: 0.35, objets: { sac_plastique: 3, bouteille_plastique: 3, canette: 2, chiffons: 2, ficelle: 2, corde: 0.3 } },
      {
        nom: "la pêche et la guinguette",
        part: 0.15,
        objets: { ballon_foot: 3, flamant_rose: 2, volants_badminton: 2, attrape_reves: 1, parasol: 1, barbecue: 1, tente_popup: 0.5, sac_charbon_bbq: 0.3 },
      },
    ],
  },
};

/** Le sous-bois est plus propre que sa lisière (§4.1) : 0,4 emplacement pour 100 m². */
export const DENSITE_LISIERE = 0.4;

/** Combien d'emplacements pour une surface (m²) d'un type de lieu, arrondi au plus proche. */
export function nombreEmplacements(lieu: TypeLieuDechets, surfaceM2: number): number {
  return Math.round((PROFILS_DECHETS[lieu].densite * Math.max(0, surfaceM2)) / 100);
}

// ---------- Les paliers ----------

export type Palier = "dechet" | "petite" | "bonne";

/** ≈ 70 % de déchets, ≈ 25 % de petites trouvailles, ≈ 5 % de bonnes (§1.2). */
export const PARTS_PALIERS: Record<Palier, number> = { dechet: 0.7, petite: 0.25, bonne: 0.05 };

/** Le palier d'un objet, d'après sa valeur au Comptoir : 0 à 2 wotts, 3 à 14, 15 et plus. */
export function palierDe(type: TypeObjet): Palier {
  const v = energieGrise(type);
  return v <= 2 ? "dechet" : v < 15 ? "petite" : "bonne";
}

// ---------- Ce qu'on tire ----------

interface Tirable {
  rarete: Rarete;
  famille: FamilleVestige;
  /** Absent : un vestige du lot 1, présent partout où sa famille l'est. */
  lieux?: readonly CodeLieu[] | "partout";
  petit?: true;
  poids: number;
}

/**
 * Des objets qui existent déjà et qui traînent aussi parmi les déchets (§2.4) : la boîte vide, le couteau abîmé
 * (rare, pour la lance, Q8), une gourde, une conserve, les matières de base, et l'appareil photo jetable, qu'il faut
 * trouver bien plus souvent (base des Voltaïques).
 */
export const EXISTANTS_DANS_LES_DECHETS: Partial<Record<TypeObjet, Omit<Tirable, "poids">>> = {
  boite_vide: { rarete: "C", famille: "dechet", lieux: "partout" },
  couteau: { rarete: "R", famille: "cuisine", lieux: ["V", "I", "D"] },
  gourde: { rarete: "R", famille: "dechet", lieux: ["R", "P"] },
  conserve: { rarete: "R", famille: "cuisine", lieux: ["V", "I", "D"] },
  chiffons: { rarete: "C", famille: "textile", lieux: "partout" },
  papier: { rarete: "C", famille: "dechet", lieux: "partout" },
  plastique: { rarete: "C", famille: "dechet", lieux: "partout" },
  verre: { rarete: "C", famille: "dechet", lieux: ["R", "P", "V", "D"] },
  barre_metal: { rarete: "P", famille: "garage", lieux: ["R", "F", "P", "A"] },
  corde: { rarete: "P", famille: "ferme", lieux: ["F", "P", "R"] },
  bache: { rarete: "P", famille: "garage", lieux: ["R", "F", "P", "A"] },
  // Jeté après la fête, il traîne aussi au bord des routes et sur les parkings.
  appareil_photo_jetable: { rarete: "C", famille: "salon", lieux: ["V", "I", "D", "P", "R"] },
};

/**
 * Les vestiges de moins de 10 cm (au plus long) : seulement dans les conteneurs. Ceux du lot 2 le disent eux-mêmes
 * (`petit`) ; voici ceux du lot 1.
 */
const PETITS_DU_LOT1: ReadonlySet<string> = new Set(["aimant_frigo", "montre_connectee", "fil_dentaire", "vapoteuse"]);

/** Au-delà, un objet ne tient pas dans un sac-poubelle ni dans un coffre : il traîne au sol (kg). */
export const POIDS_MAX_CONTENEUR = 8;

function tirables(): [TypeObjet, Tirable][] {
  const liste: [TypeObjet, Tirable][] = [];
  for (const [type, d] of Object.entries(VESTIGES) as [TypeVestige, (typeof VESTIGES)[TypeVestige]][]) {
    if ("horsTirage" in d && d.horsTirage) continue;
    if (estVestigeLot2(type)) {
      const l2 = VESTIGES_LOT2[type];
      liste.push([type, { rarete: l2.rarete, famille: l2.famille, lieux: l2.lieux, petit: "petit" in l2 ? l2.petit : undefined, poids: l2.poids }]);
    } else liste.push([type, { rarete: d.rarete, famille: d.famille, petit: PETITS_DU_LOT1.has(type) ? true : undefined, poids: d.poids }]);
  }
  for (const [type, t] of Object.entries(EXISTANTS_DANS_LES_DECHETS) as [TypeObjet, Omit<Tirable, "poids">][]) {
    liste.push([type, { ...t, poids: OBJETS[type].poids }]);
  }
  return liste;
}

// ---------- Les conteneurs ----------

export type TypeConteneur = "sac_poubelle" | "poubelle_renversee" | "coffre_voiture";

export interface ProfilConteneur {
  min: number;
  max: number;
  /** Ce qui s'ajoute aux familles du lieu (le sac-poubelle sent la cuisine, le coffre la voiture). */
  biais: Partial<Record<FamilleVestige, number>>;
}

export const CONTENEURS: Record<TypeConteneur, ProfilConteneur> = {
  sac_poubelle: { min: 1, max: 3, biais: { dechet: 4, textile: 1, cuisine: 1 } },
  poubelle_renversee: { min: 1, max: 3, biais: { dechet: 4, cuisine: 3 } },
  coffre_voiture: { min: 1, max: 2, biais: { voiture: 6, textile: 3 } },
};

/** Où l'on tire : une pièce au sol, ou un conteneur. */
export type GenreEmplacement = "sol" | TypeConteneur;

/** Une table : pour chaque palier, les objets et leur poids. */
export type TableDechets = Record<Palier, [TypeObjet, number][]>;

const CACHE = new Map<string, TableDechets>();

/**
 * La table d'un type de lieu, pour une pièce au sol ou un conteneur. Un objet du lot 2 (ou un objet existant du
 * §2.4) y est s'il traîne dans ce type de lieu ; un vestige du lot 1, si sa famille y est. Poids : famille × rareté.
 * Calculée une fois, puis gardée.
 */
export function tableDechets(lieu: TypeLieuDechets, genre: GenreEmplacement = "sol"): TableDechets {
  const cle = `${lieu}:${genre}`;
  const deja = CACHE.get(cle);
  if (deja) return deja;
  const profil = PROFILS_DECHETS[lieu];
  if (profil.groupes) {
    // Un tirage par groupes : la table liste ce qu'on peut trouver, chaque objet au poids de son espérance.
    const table: TableDechets = { dechet: [], petite: [], bonne: [] };
    for (const [groupe, objets] of groupesPour(profil.groupes, genre)) {
      const total = objets.reduce((t, [, w]) => t + w, 0);
      for (const [type, w] of objets) table[palierDe(type)].push([type, (groupe.part * w) / total]);
    }
    CACHE.set(cle, table);
    return table;
  }
  const familles: Partial<Record<FamilleVestige, number>> = { ...profil.familles };
  if (genre !== "sol") for (const [f, p] of Object.entries(CONTENEURS[genre].biais) as [FamilleVestige, number][]) familles[f] = (familles[f] ?? 0) + p;
  const table: TableDechets = { dechet: [], petite: [], bonne: [] };
  for (const [type, t] of tirables()) {
    if (genre === "sol" && t.petit) continue;
    if (genre !== "sol" && t.poids > POIDS_MAX_CONTENEUR) continue;
    let f: number;
    if (t.lieux === undefined) f = familles[t.famille] ?? 0;
    else if (t.lieux === "partout" || t.lieux.includes(profil.code)) f = familles[t.famille] ?? 1;
    else f = 0;
    if (f <= 0) continue;
    f *= profil.vedettes?.[type] ?? 1;
    const palier = palierDe(type);
    if (profil.seulementDechets && palier !== "dechet") continue;
    const ligne = table[palier];
    const existant = ligne.find(([x]) => x === type);
    if (existant) existant[1] += f * POIDS_RARETE[t.rarete];
    else ligne.push([type, f * POIDS_RARETE[t.rarete]]);
  }
  CACHE.set(cle, table);
  return table;
}

/** Les groupes d'un profil, pour un genre d'emplacement : au sol, rien de petit ; dans un sac, rien de trop lourd. */
function groupesPour(groupes: readonly GroupeDechets[], genre: GenreEmplacement): [GroupeDechets, [TypeObjet, number][]][] {
  const petit = (t: TypeObjet) => PETITS_DU_LOT1.has(t) || (estVestigeLot2(t as TypeVestige) && "petit" in VESTIGES_LOT2[t as keyof typeof VESTIGES_LOT2]);
  return groupes
    .map((g): [GroupeDechets, [TypeObjet, number][]] => [
      g,
      (Object.entries(g.objets) as [TypeObjet, number][]).filter(([t]) => (genre === "sol" ? !petit(t) : OBJETS[t].poids <= POIDS_MAX_CONTENEUR)),
    ])
    .filter(([, objets]) => objets.length > 0);
}

/** Un objet tiré par groupes : le groupe d'abord (à sa part), puis l'objet dans le groupe. */
function tirerParGroupes(groupes: readonly GroupeDechets[], genre: GenreEmplacement, alea: () => number): TypeObjet {
  const liste = groupesPour(groupes, genre);
  const [, objets] = tirerPondere(liste.map((x): [[GroupeDechets, [TypeObjet, number][]], number] => [x, x[0].part]), alea);
  return tirerPondere(objets, alea);
}

/** Un objet tiré pour un type de lieu et un genre d'emplacement : par groupes si le lieu en a, sinon par paliers. */
export function tirerDansLeLieu(lieu: TypeLieuDechets, genre: GenreEmplacement, alea: () => number): TypeObjet {
  const groupes = PROFILS_DECHETS[lieu].groupes;
  return groupes ? tirerParGroupes(groupes, genre, alea) : tirerDechet(tableDechets(lieu, genre), alea);
}

/** Le seuil d'un aléa dans [0, 1[ (1 est ramené juste en dessous). */
function borne(x: number): number {
  return Math.min(Math.max(x, 0), 0.999999);
}

function tirerPondere<T>(table: [T, number][], alea: () => number): T {
  const total = table.reduce((s, [, p]) => s + p, 0);
  let r = borne(alea()) * total;
  for (const [t, p] of table) {
    if (r < p) return t;
    r -= p;
  }
  return table[table.length - 1]![0];
}

/** Les parts des paliers d'une table : celles du §1.2, sur les seuls paliers qui ont quelque chose. */
export function partsDe(table: TableDechets): Record<Palier, number> {
  const presents = (Object.keys(PARTS_PALIERS) as Palier[]).filter((p) => table[p].length > 0);
  const total = presents.reduce((s, p) => s + PARTS_PALIERS[p], 0);
  const parts: Record<Palier, number> = { dechet: 0, petite: 0, bonne: 0 };
  for (const p of presents) parts[p] = PARTS_PALIERS[p] / total;
  return parts;
}

/** Un objet tiré dans une table : le palier d'abord, puis l'objet. */
export function tirerDechet(table: TableDechets, alea: () => number): TypeObjet {
  const parts = partsDe(table);
  let r = borne(alea());
  let palier: Palier = "dechet";
  for (const p of ["dechet", "petite", "bonne"] as Palier[]) {
    if (parts[p] <= 0) continue;
    palier = p;
    if (r < parts[p]) break;
    r -= parts[p];
  }
  return tirerPondere(table[palier], alea);
}

/**
 * Ce qu'on peut espérer d'un tirage : pour chaque objet, sa probabilité de sortir (pour les tests d'équilibre et le
 * bilan). La somme vaut 1.
 */
export function esperanceTirage(table: TableDechets): Partial<Record<TypeObjet, number>> {
  const parts = partsDe(table);
  const e: Partial<Record<TypeObjet, number>> = {};
  for (const p of Object.keys(parts) as Palier[]) {
    const total = table[p].reduce((s, [, w]) => s + w, 0);
    if (total <= 0) continue;
    for (const [t, w] of table[p]) e[t] = (e[t] ?? 0) + (parts[p] * w) / total;
  }
  return e;
}

// ---------- Les graines ----------

/** Un nombre de 32 bits tiré de morceaux (FNV-1a) : le même lieu, le même carreau, le même remplissage, la même graine. */
export function graineDe(...morceaux: (string | number)[]): number {
  let h = 0x811c9dc5;
  for (const c of morceaux.join("|")) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Un aléa reproductible (mulberry32) : même graine, même suite de nombres dans [0, 1[. */
export function aleaDe(graine: number): () => number {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Les déchets se rangent par carreaux de 20 m de côté (§7.1, chiffrage graphique §3). */
export const TAILLE_CARREAU = 20;

/** Le carreau d'un point du lieu. */
export function carreauDe(x: number, z: number): { cx: number; cz: number } {
  return { cx: Math.floor(x / TAILLE_CARREAU), cz: Math.floor(z / TAILLE_CARREAU) };
}

/** La graine d'un carreau à son n-ième remplissage (0 au premier). */
export function graineCarreau(lieu: string, cx: number, cz: number, remplissage: number): number {
  return graineDe("carreau", lieu, cx, cz, remplissage);
}

// ---------- Les amas et les conteneurs ----------

/** Une pièce au sol, tirée dans la table du lieu. */
export function tirerPiece(lieu: TypeLieuDechets, alea: () => number): TypeObjet {
  return tirerDansLeLieu(lieu, "sol", alea);
}

/** Les pièces d'un amas : n objets du catalogue, toujours les mêmes pour une graine. */
export function piecesAmas(graine: number, lieu: TypeLieuDechets, n: number): TypeObjet[] {
  const alea = aleaDe(graine);
  const pieces: TypeObjet[] = [];
  for (let i = 0; i < n; i++) pieces.push(tirerPiece(lieu, alea));
  return pieces;
}

/** Le contenu d'un conteneur (1 à 3 objets, 1 à 2 pour un coffre), toujours le même pour une graine. */
export function contenuConteneur(graine: number, lieu: TypeLieuDechets, conteneur: TypeConteneur): Inventaire {
  const alea = aleaDe(graine);
  const { min, max } = CONTENEURS[conteneur];
  const n = Math.min(max, min + Math.floor(borne(alea()) * (max - min + 1)));
  const contenu: Inventaire = {};
  for (let i = 0; i < n; i++) {
    const t = tirerDansLeLieu(lieu, conteneur, alea);
    contenu[t] = (contenu[t] ?? 0) + 1;
  }
  return contenu;
}

// ---------- Le renouvellement ----------

/** Un emplacement vidé se remplit à nouveau au bout de 8 à 24 h réelles, tiré par carreau (§4.2). */
export const RENOUVELLEMENT_MS = { min: 8 * 3_600_000, max: 24 * 3_600_000 } as const;

/** Le délai d'un carreau, d'après sa graine. Le terrain personnel ne se renouvelle pas (Q4) : la décharge suffit. */
export function delaiRenouvellement(graine: number): number {
  const { min, max } = RENOUVELLEMENT_MS;
  return Math.round(min + aleaDe(graineDe("renouvellement", graine))() * (max - min));
}

/** Un point à démonter (vélo du fossé, trampoline…) revient, ailleurs, au bout de 7 jours ; jamais sur le terrain. */
export const RENOUVELLEMENT_POINT_MS = 7 * 24 * 3_600_000;

/** Les déchets de départ du terrain personnel, sans renouvellement (Q4). */
export const DECHETS_DU_TERRAIN = 12;

/** Une ordure jetée au sol disparaît au bout de 24 h réelles, sauf sur le terrain personnel (Q10). */
export const DUREE_ORDURE_JETEE_MS = 24 * 3_600_000;

/**
 * Un tas jeté au sol est-il à effacer ? Oui s'il n'a que des ordures (valeur 0), qu'il a plus de 24 h, et qu'il n'est
 * pas sur le terrain personnel, où les ordures restent (Q10). Un tas qui garde un objet de valeur reste entier.
 */
export function tasAEffacer(contenu: Inventaire, creeLe: number, instant: number, surTerrainPersonnel: boolean): boolean {
  if (surTerrainPersonnel || instant - creeLe < DUREE_ORDURE_JETEE_MS) return false;
  const types = Object.entries(contenu).filter(([, n]) => (n ?? 0) > 0);
  return types.length > 0 && types.every(([t]) => estOrdure(t));
}

// ---------- Les points du monde (§3.8) ----------

export type TypePointDechets =
  | "sac_poubelle"
  | "poubelle_renversee"
  | "tas_gravats"
  | "coffre_voiture"
  | "velo_fosse"
  | "epave_mobylette"
  | "trampoline"
  | "machine_laver"
  | "frigo_connecte"
  | "carcasse_mouton";

export interface DefinitionPointDechets {
  nom: string;
  verbe: "fouiller" | "demonter" | "ramasser";
  libelle: string;
  /** Ce que dit l'examen (bouton B). */
  examen: string;
  qualites: Partial<Record<Qualite, number>>;
  /** Durée réelle, en secondes. */
  duree: number;
  /** Ce qu'il donne à coup sûr. */
  donne: Inventaire;
  /** Un conteneur : on y tire des objets dans la table du lieu, et l'on choisit ce qu'on prend (comme la décharge). */
  conteneur?: TypeConteneur;
  /** Une chance de trouver en plus un déchet (le tas de gravats : 1 sur 3). */
  chanceDechet?: number;
  /** L'outil qui va plus vite, sans être obligatoire. */
  accelerePar?: Partial<Record<Qualite, number>>;
  lieux: readonly CodeLieu[] | "partout";
  /** remplissage : 8 à 24 h ; lent : quelques jours ; avec l'épave ; événement : 7 jours, ailleurs. */
  renouvellement: "remplissage" | "lent" | "avec_epave" | "evenement";
}

export const POINTS_DECHETS: Record<TypePointDechets, DefinitionPointDechets> = {
  sac_poubelle: {
    nom: "sac-poubelle crevé",
    verbe: "fouiller",
    libelle: "Fouiller le sac-poubelle",
    examen: "Un sac crevé par les bêtes. Surtout des ordures ; parfois une trouvaille.",
    qualites: {},
    duree: 5,
    donne: {},
    conteneur: "sac_poubelle",
    lieux: ["R", "P", "V", "I", "J", "F", "A", "D"],
    renouvellement: "remplissage",
  },
  poubelle_renversee: {
    nom: "poubelle renversée",
    verbe: "fouiller",
    libelle: "Fouiller la poubelle",
    examen: "Une poubelle couchée, le couvercle à côté. Des restes de cuisine d'avant.",
    qualites: {},
    duree: 6,
    donne: {},
    conteneur: "poubelle_renversee",
    lieux: ["V", "P"],
    renouvellement: "remplissage",
  },
  tas_gravats: {
    nom: "tas de gravats",
    verbe: "fouiller",
    libelle: "Fouiller les gravats",
    examen: "Des pierres et des morceaux de mur. Un bâton à fouir irait plus vite.",
    qualites: {},
    duree: 8,
    donne: { pierre: 2 },
    chanceDechet: 1 / 3,
    accelerePar: { creuser: 1 },
    lieux: ["V", "D"],
    renouvellement: "lent",
  },
  coffre_voiture: {
    nom: "coffre de voiture",
    verbe: "fouiller",
    libelle: "Fouiller le coffre",
    examen: "Le coffre est entrouvert. Des affaires de route, des vêtements.",
    qualites: {},
    duree: 5,
    donne: {},
    conteneur: "coffre_voiture",
    lieux: ["R", "P", "A"],
    renouvellement: "avec_epave",
  },
  velo_fosse: {
    nom: "vélo couché dans le fossé",
    verbe: "demonter",
    libelle: "Démonter le vélo",
    examen: "Un vélo dans l'herbe haute. Démonté : un cadre, une chaîne, deux roues, sa dynamo.",
    qualites: { serrer: 1, visser: 1 },
    duree: 45,
    donne: { cadre_velo: 1, chaine_velo: 1, roue_velo: 2, dynamo_velo: 1 },
    lieux: ["R", "C"],
    renouvellement: "evenement",
  },
  epave_mobylette: {
    nom: "épave de mobylette",
    verbe: "demonter",
    libelle: "Démonter la mobylette",
    // Plan 0.8 (I12) : sa bobine d'allumage est grillée ; la bonne attend une autre mobylette, à H2A.
    examen: "Selle éventrée, réservoir percé, la bobine grillée. Les roues tournent encore.",
    qualites: { serrer: 1, visser: 1 },
    duree: 40,
    donne: { roue_velo: 2, chaine_velo: 1, barre_metal: 1 },
    lieux: ["R", "V"],
    renouvellement: "evenement",
  },
  trampoline: {
    nom: "trampoline éventré",
    verbe: "demonter",
    libelle: "Démonter le trampoline",
    examen: "Il fait rebondir les feuilles mortes. Autour du cadre, soixante ressorts.",
    qualites: { serrer: 1 },
    duree: 60,
    donne: { petit_ressort: 12, barre_metal: 3, bache: 1 },
    lieux: ["J"],
    renouvellement: "evenement",
  },
  machine_laver: {
    nom: "machine à laver",
    verbe: "demonter",
    libelle: "Démonter la machine à laver",
    // Plan 0.8 (I9) : plus de roulement ; la boîte de roulements est une clé de L2A.
    examen: "Le hublot pend. Dedans : du cuivre, et un contrepoids de béton. Le roulement du tambour est mort.",
    qualites: { visser: 1, serrer: 1 },
    duree: 40,
    donne: { fil_cuivre: 6, pierre: 6 },
    lieux: ["V", "D"],
    renouvellement: "evenement",
  },
  frigo_connecte: {
    nom: "frigo connecté",
    verbe: "demonter",
    libelle: "Démonter le frigo",
    examen: "Son écran annonce encore « Lait : à racheter ». Du cuivre, de l'aluminium, du plastique.",
    qualites: { visser: 1 },
    duree: 30,
    donne: { fil_cuivre: 4, aluminium: 2, plastique: 6 },
    lieux: ["V", "D"],
    renouvellement: "evenement",
  },
  carcasse_mouton: {
    nom: "carcasse de mouton",
    verbe: "ramasser",
    libelle: "Prendre les os",
    examen: "Des os blanchis et un peu de laine grise. Rien d'autre ne reste.",
    qualites: {},
    duree: 4,
    donne: { os: 6 },
    lieux: ["C", "F"],
    renouvellement: "lent",
  },
};

/** Ce que contient un point (toujours le même pour une graine) : ce qu'il donne à coup sûr, plus ses tirages. */
export function contenuPoint(point: TypePointDechets, graine: number, lieu: TypeLieuDechets): Inventaire {
  const d = POINTS_DECHETS[point];
  const contenu: Inventaire = { ...d.donne };
  if (d.conteneur) for (const [t, n] of Object.entries(contenuConteneur(graine, lieu, d.conteneur))) contenu[t as TypeObjet] = (contenu[t as TypeObjet] ?? 0) + (n ?? 0);
  if (d.chanceDechet) {
    const alea = aleaDe(graineDe("gravats", graine));
    if (alea() < d.chanceDechet) {
      const t = tirerPondere(tableDechets(lieu, "sac_poubelle").dechet, alea);
      contenu[t] = (contenu[t] ?? 0) + 1;
    }
  }
  return contenu;
}

/** Les codes de lieu où un point peut se trouver. */
export function lieuxDuPoint(point: TypePointDechets): readonly CodeLieu[] {
  const l = POINTS_DECHETS[point].lieux;
  return l === "partout" ? TOUS_LES_CODES_LIEU : l;
}
