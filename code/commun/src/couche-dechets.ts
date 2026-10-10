// La couche de déchets des lieux (0.7, chantier 2) : où sont les amas et les conteneurs, et ce qu'ils contiennent.
// Partagé par le serveur (qui fait foi) et par le client (qui les dessine) : tout se recalcule d'une graine.
//
// Décisions du porteur (proposition « objets et déchets », §7 et §7.1) : tout ce qu'on voit au sol se ramasse ; chaque
// pièce d'un amas est un objet du catalogue, tiré d'une graine par carreau de 20 m ; le serveur ne garde qu'un bit
// « ramassé » par pièce et un délai de renouvellement par carreau (8 à 24 h réelles, tirage neuf). Sur le terrain
// personnel : seulement les 12 déchets de départ (et la décharge existante), sans renouvellement.
//
// La disposition (où sont les emplacements, combien de pièces dans chaque amas) dépend du lieu et du carreau ; le
// contenu (quels objets) dépend en plus du numéro de remplissage : on revient, on trouve autre chose au même endroit.

import {
  DECHETS_DU_TERRAIN,
  POINTS_DECHETS,
  PROFILS_DECHETS,
  RENOUVELLEMENT_POINT_MS,
  TAILLE_CARREAU,
  aleaDe,
  contenuConteneur,
  contenuPoint,
  delaiRenouvellement,
  graineCarreau,
  graineDe,
  piecesAmas,
  type TypeConteneur,
  type TypeLieuDechets,
  type TypePointDechets,
} from "./dechets.ts";
import { ATELIER, BATIMENT, PIECES } from "./cooperative.ts";
import { BOUTIQUE, FERME_HALTE, ROUTE, ZONE_COMPTOIR, dansBoite, heurte, sortiesDe, zoneDe, type Boite, type LieuJouable } from "./lieux.ts";
import type { Inventaire, TypeObjet } from "./objets.ts";
import { POINT_ARRIVEE, TERRAIN_TAILLE } from "./regles.ts";
import { ARBRES_ISOLES, MARE, RUINE, distanceMare } from "./terrain.ts";
import { DECHARGE } from "./decharge.ts";

// ---------- Les zones typées de chaque lieu (§4.1, §4.3) ----------

/** Un rectangle du lieu, d'un type de lieu (sa table, sa densité), dont on retire des boîtes. */
export interface ZoneDechets {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  type: TypeLieuDechets;
  /** Emplacements pour 100 m², si ce n'est pas celle du type (une lisière, une cour moins encombrée). */
  densite?: number;
  /** Ce qui n'en fait pas partie (un bâtiment, une autre zone posée dessus). Ne se chevauchent pas entre elles. */
  exclure?: readonly Boite[];
}

const rect = (b: Boite) => ({ x0: b.x - b.l / 2, x1: b.x + b.l / 2, z0: b.z - b.p / 2, z1: b.z + b.p / 2 });
const boite = (x0: number, x1: number, z0: number, z1: number): Boite => ({ x: (x0 + x1) / 2, z: (z0 + z1) / 2, l: x1 - x0, p: z1 - z0 });

// La halte : la route et ses bas-côtés (4 m de chaque côté), la station, la ferme et son jardin, les prés, les lisières.
const PARKING_STATION = boite(84, 126, 17.5, 27.5);
const COUR_FERME = boite(FERME_HALTE.x - 10, FERME_HALTE.x + 12, 12, 27.5);
const JARDIN_FERME = boite(FERME_HALTE.x + 12, FERME_HALTE.x + 22, 13, 24);
const BORD = { nord: ROUTE.z - ROUTE.demiLargeur, sud: ROUTE.z + ROUTE.demiLargeur };

// La Coopérative : le parking devant le portail, la cour, le hangar, l'atelier, les pièces de devant.
const PARKING_COOP = boite(30, 56, 42, 58.5);

export const ZONES_DECHETS: Record<Exclude<LieuJouable, "terrain">, readonly ZoneDechets[]> = {
  station: [
    { x0: 0.5, x1: 199.5, z0: 9, z1: 13, type: "bois", densite: 0.4 },
    { x0: 0.5, x1: 199.5, z0: 13, z1: BORD.nord - 4, type: "champ", exclure: [PARKING_STATION, COUR_FERME, JARDIN_FERME, BOUTIQUE.interieur] },
    { x0: 0.5, x1: 199.5, z0: BORD.nord - 4, z1: BORD.nord, type: "route" },
    { x0: 0.5, x1: 199.5, z0: BORD.sud, z1: BORD.sud + 4, type: "route" },
    { x0: 0.5, x1: 199.5, z0: BORD.sud + 4, z1: 54.5, type: "champ" },
    { x0: 0.5, x1: 199.5, z0: 54.5, z1: 59, type: "bois", densite: 0.4 },
    { ...rect(PARKING_STATION), type: "parking", exclure: [BOUTIQUE.interieur] },
    { ...rect(BOUTIQUE.interieur), type: "interieur" },
    { ...rect(COUR_FERME), type: "ferme" },
    { ...rect(JARDIN_FERME), type: "jardin" },
  ],
  // Le Carrefour : rien que des déchets (les Compteurs ne laissent rien traîner de valeur).
  comptoir: [{ x0: ZONE_COMPTOIR.xMin, x1: ZONE_COMPTOIR.xMax, z0: ZONE_COMPTOIR.zMin, z1: ZONE_COMPTOIR.zMax, type: "comptoir" }],
  // ≈ 60 emplacements (proposition §4.1) : la cour est plus clairsemée qu'une vraie cour de ferme, le hangar qu'une casse.
  cooperative: [
    { ...rect(PARKING_COOP), type: "parking" },
    { x0: 1, x1: 79, z0: 1, z1: 59, type: "ferme", densite: 0.75, exclure: [BATIMENT, ATELIER, PARKING_COOP] },
    { ...rect(PIECES.hangar.boite), type: "atelier", densite: 1.5 },
    { ...rect(PIECES.atelier.boite), type: "atelier", densite: 1.5 },
    { ...rect(PIECES.libre_service.boite), type: "interieur", densite: 2.5 },
    { ...rect(PIECES.bureaux.boite), type: "interieur", densite: 2.5 },
    { ...rect(PIECES.chambre_froide.boite), type: "interieur", densite: 2 },
  ],
  // 0.8 : le gué et le Moulin, branchés vides (chantier 4) ; leurs chantiers (11, 12) y mettront leurs zones.
  gue: [],
  moulin: [],
};

// ---------- La disposition ----------

/** Un emplacement : un amas de pièces au sol, ou un conteneur à fouiller. */
export interface EmplacementDechets {
  /** Son rang dans le carreau. */
  e: number;
  genre: "sol" | TypeConteneur;
  type: TypeLieuDechets;
  x: number;
  z: number;
  o: number;
  /** Combien de pièces dans l'amas (au sol). */
  n: number;
  /** Ce qu'un conteneur contient à coup sûr, en plus de son tirage, à son premier remplissage (plan 0.8, I28). */
  garanti?: Inventaire;
}

/** Une pièce : un objet du catalogue, posé dans un amas ou rangé dans un conteneur. */
export interface PieceDechets {
  /** Son rang dans le carreau : c'est son bit « ramassé ». */
  i: number;
  /** L'emplacement qui la porte. */
  e: number;
  objet: TypeObjet;
  x: number;
  z: number;
  /** Dans un conteneur : elle ne se ramasse pas, elle se prend en fouillant. */
  dedans: boolean;
}

/** La clé d'un carreau (« 3,1 »). */
export function cleCarreau(cx: number, cz: number): string {
  return `${cx},${cz}`;
}

/** La clé de la couche d'un lieu : partagée (« station », « gue »), ou à un joueur (« cooperative:12 », « terrain:12 »). */
export function cleCouche(lieu: LieuJouable, compteId: number): string {
  return lieu === "station" || lieu === "comptoir" || lieu === "gue" ? lieu : `${lieu}:${compteId}`;
}

/** Le lieu d'une clé de couche. */
export function lieuDeCle(cle: string): LieuJouable {
  return cle.split(":")[0] as LieuJouable;
}

const arrondi = (v: number) => Math.round(v * 100) / 100;

/** La surface d'un rectangle dans un autre (m²). */
function intersection(a: { x0: number; x1: number; z0: number; z1: number }, b: { x0: number; x1: number; z0: number; z1: number }): number {
  return Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0));
}

/** On ne pose rien sur un mur, au ras d'une sortie, ni hors du lieu. */
function placeLibre(lieu: LieuJouable, x: number, z: number): boolean {
  const zone = zoneDe(lieu);
  if (x < zone.xMin + 0.8 || x > zone.xMax - 0.8 || z < zone.zMin + 0.8 || z > zone.zMax - 0.8) return false;
  if (heurte(zone, x, z, 0.5)) return false;
  return !sortiesDe(lieu).some((s) => dansBoite(x, z, s.boite, 1));
}

/** Combien de pièces dans un amas : souvent 1 à 3, parfois 4. */
function taillesAmas(alea: () => number): number {
  const r = alea();
  return r < 0.35 ? 1 : r < 0.7 ? 2 : r < 0.92 ? 3 : 4;
}

/** Le genre d'un conteneur d'un type de lieu : la poubelle renversée seulement au village et au parking (§3.8). */
function genreConteneur(type: TypeLieuDechets, alea: () => number): TypeConteneur {
  return (type === "village" || type === "parking") && alea() < 0.4 ? "poubelle_renversee" : "sac_poubelle";
}

/** La disposition des carreaux d'un lieu partagé ou d'une Coopérative, par zone typée. */
function dispositionZones(cle: string, lieu: Exclude<LieuJouable, "terrain">): Map<string, EmplacementDechets[]> {
  const carreaux = new Map<string, EmplacementDechets[]>();
  const zone = zoneDe(lieu);
  for (let cx = Math.floor(zone.xMin / TAILLE_CARREAU); cx * TAILLE_CARREAU < zone.xMax; cx++) {
    for (let cz = Math.floor(zone.zMin / TAILLE_CARREAU); cz * TAILLE_CARREAU < zone.zMax; cz++) {
      const c = { x0: cx * TAILLE_CARREAU, x1: (cx + 1) * TAILLE_CARREAU, z0: cz * TAILLE_CARREAU, z1: (cz + 1) * TAILLE_CARREAU };
      const alea = aleaDe(graineDe("disposition", cle, cx, cz));
      const liste: EmplacementDechets[] = [];
      for (const z of ZONES_DECHETS[lieu]) {
        const surface = intersection(z, c) - (z.exclure ?? []).reduce((s, b) => s + intersection(rect(b), { x0: Math.max(z.x0, c.x0), x1: Math.min(z.x1, c.x1), z0: Math.max(z.z0, c.z0), z1: Math.min(z.z1, c.z1) }), 0);
        if (surface <= 0.5) continue;
        const profil = PROFILS_DECHETS[z.type];
        // L'espérance d'emplacements, et un tirage pour la part fractionnaire : la densité tient en moyenne.
        const attendu = ((z.densite ?? profil.densite) * surface) / 100;
        const n = Math.floor(attendu) + (alea() < attendu - Math.floor(attendu) ? 1 : 0);
        const x0 = Math.max(z.x0, c.x0);
        const x1 = Math.min(z.x1, c.x1);
        const z0 = Math.max(z.z0, c.z0);
        const z1 = Math.min(z.z1, c.z1);
        for (let k = 0; k < n; k++) {
          for (let essai = 0; essai < 12; essai++) {
            const x = arrondi(x0 + alea() * (x1 - x0));
            const zz = arrondi(z0 + alea() * (z1 - z0));
            if (z.exclure?.some((b) => dansBoite(x, zz, b))) continue;
            if (!placeLibre(lieu, x, zz) || liste.some((p) => Math.hypot(p.x - x, p.z - zz) < 1.2)) continue;
            const conteneur = alea() < profil.partConteneurs;
            liste.push({
              e: liste.length,
              genre: conteneur ? genreConteneur(z.type, alea) : "sol",
              type: z.type,
              x,
              z: zz,
              o: arrondi(alea() * Math.PI * 2),
              n: conteneur ? 0 : taillesAmas(alea),
            });
            break;
          }
        }
      }
      if (liste.length > 0) carreaux.set(cleCarreau(cx, cz), liste);
    }
  }
  return carreaux;
}

/**
 * Le premier sac-poubelle du chemin, sur le terrain (plan 0.8, I28) : 4 sacs plastique, en plus de son tirage. Le
 * récupérateur de pluie de 5 L en demande 4, et les 12 déchets de départ n'en donnaient qu'≈ 1 en moyenne.
 */
export const GARANTI_PREMIER_SAC: Inventaire = { sac_plastique: 4 };

/**
 * Les 12 déchets de départ du terrain personnel (Q4) : 4 près du chemin, 8 épars, dont 3 sacs-poubelle. Une pièce par
 * emplacement. Rien près de la ruine, de la mare, de la décharge, du point d'arrivée ni des arbres. Le premier, au bord
 * du chemin, est toujours un sac-poubelle, avec ses 4 sacs plastique garantis (I28).
 */
function dispositionTerrain(cle: string): Map<string, EmplacementDechets[]> {
  const alea = aleaDe(graineDe("terrain", cle));
  const places: { x: number; z: number; genre: "sol" | "sac_poubelle"; garanti?: Inventaire }[] = [];
  const libre = (x: number, z: number) =>
    placeLibre("terrain", x, z) &&
    !dansBoite(x, z, { x: RUINE.x, z: RUINE.z, l: RUINE.largeur, p: RUINE.profondeur }, 2.5) &&
    distanceMare(x, z) > 2 &&
    Math.hypot(x - DECHARGE.x, z - DECHARGE.z) > 4.5 &&
    Math.hypot(x - POINT_ARRIVEE.x, z - POINT_ARRIVEE.z) > 3 &&
    Math.hypot(x - MARE.x, z - MARE.z) > MARE.rayon + 2 &&
    ARBRES_ISOLES.every(([ax, az]) => Math.hypot(x - ax, z - az) > 1.5) &&
    places.every((p) => Math.hypot(p.x - x, p.z - z) > 2.5);
  const poser = (tirer: () => [number, number], genre: "sol" | "sac_poubelle", garanti?: Inventaire, essais = 40) => {
    for (let essai = 0; essai < essais; essai++) {
      const [x, z] = tirer();
      if (!libre(x, z)) continue;
      places.push({ x: arrondi(x), z: arrondi(z), genre, ...(garanti ? { garanti } : {}) });
      return;
    }
  };
  // Le long du chemin d'entrée (au sud, x ≈ 25) : là où le vent les a poussés.
  const chemin = (): [number, number] => {
    const cote = alea() < 0.5 ? -1 : 1;
    return [TERRAIN_TAILLE / 2 + cote * (1.6 + alea() * 2), TERRAIN_TAILLE - 13 + alea() * 9];
  };
  const epars = (): [number, number] => [3 + alea() * (TERRAIN_TAILLE - 6), 3 + alea() * (TERRAIN_TAILLE - 6)];
  // Le premier sac du chemin a ses 4 sacs plastique (I28) : on insiste jusqu'à lui trouver sa place.
  poser(chemin, "sac_poubelle", GARANTI_PREMIER_SAC, 400);
  for (let k = 1; k < 4; k++) poser(chemin, "sol");
  for (let k = places.length; k < DECHETS_DU_TERRAIN; k++) poser(epars, k < 6 ? "sac_poubelle" : "sol");
  const carreaux = new Map<string, EmplacementDechets[]>();
  for (const p of places) {
    const k = cleCarreau(Math.floor(p.x / TAILLE_CARREAU), Math.floor(p.z / TAILLE_CARREAU));
    const liste = carreaux.get(k) ?? [];
    liste.push({ e: liste.length, genre: p.genre, type: "champ", x: p.x, z: p.z, o: arrondi(alea() * Math.PI * 2), n: p.genre === "sol" ? 1 : 0, ...(p.garanti ? { garanti: p.garanti } : {}) });
    carreaux.set(k, liste);
  }
  return carreaux;
}

/** Les dispositions déjà calculées (la halte, le Carrefour, les terrains et Coopératives des présents). */
const DISPOSITIONS = new Map<string, Map<string, EmplacementDechets[]>>();
const MAX_DISPOSITIONS = 64;

/** Les emplacements d'un lieu, carreau par carreau (toujours les mêmes pour une clé). */
export function dispositionLieu(cle: string): Map<string, EmplacementDechets[]> {
  const deja = DISPOSITIONS.get(cle);
  if (deja) return deja;
  const lieu = lieuDeCle(cle);
  const d = lieu === "terrain" ? dispositionTerrain(cle) : dispositionZones(cle, lieu);
  if (DISPOSITIONS.size >= MAX_DISPOSITIONS) DISPOSITIONS.delete(DISPOSITIONS.keys().next().value!);
  DISPOSITIONS.set(cle, d);
  return d;
}

/** Un inventaire déplié en liste, dans un ordre stable (pour numéroter les pièces d'un conteneur). */
export function deplier(contenu: Inventaire): TypeObjet[] {
  const liste: TypeObjet[] = [];
  for (const [t, n] of Object.entries(contenu) as [TypeObjet, number][]) for (let k = 0; k < (n ?? 0); k++) liste.push(t);
  return liste;
}

/** Les pièces d'un carreau à son n-ième remplissage (0 au premier) : toujours les mêmes. */
export function piecesCarreau(cle: string, cx: number, cz: number, remplissage: number): PieceDechets[] {
  const emplacements = dispositionLieu(cle).get(cleCarreau(cx, cz)) ?? [];
  const graine = graineCarreau(cle, cx, cz, remplissage);
  const pieces: PieceDechets[] = [];
  for (const em of emplacements) {
    const g = graineDe(graine, em.e);
    if (em.genre === "sol") {
      // Les pièces d'un amas, serrées autour de son centre (leur place ne dépend pas du remplissage).
      const objets = piecesAmas(g, em.type, em.n);
      const places = aleaDe(graineDe("amas", cle, cx, cz, em.e));
      objets.forEach((objet, k) => {
        const a = em.o + (k * Math.PI * 2) / Math.max(1, objets.length) + places() * 0.6;
        const r = k === 0 && objets.length === 1 ? 0 : 0.25 + places() * 0.3;
        pieces.push({ i: pieces.length, e: em.e, objet, x: arrondi(em.x + Math.cos(a) * r), z: arrondi(em.z + Math.sin(a) * r), dedans: false });
      });
    } else {
      const contenu = contenuConteneur(g, em.type, em.genre);
      // Ce qui y est à coup sûr (I28), à son premier remplissage seulement : après les pièces tirées, pour ne rien renuméroter.
      const garanti = remplissage === 0 && em.garanti ? deplier(em.garanti) : [];
      for (const objet of [...deplier(contenu), ...garanti]) pieces.push({ i: pieces.length, e: em.e, objet, x: em.x, z: em.z, dedans: true });
    }
  }
  return pieces;
}

// ---------- Les points du monde (§3.8) ----------

/** Un point d'un lieu : un vélo dans le fossé, un tas de gravats, le coffre d'une épave… et ses places possibles. */
export interface PointLieu {
  id: string;
  type: TypePointDechets;
  /** Le type de lieu de ses tirages (un coffre de voiture tire dans la table de la route). */
  zone: TypeLieuDechets;
  /** Où il peut être : un événement (vélo, trampoline…) revient ailleurs, à une autre place de la liste. */
  places: readonly (readonly [number, number])[];
  o: number;
}

/** Les points de chaque lieu. Le terrain n'en a pas (Q-G1) ; le Carrefour non plus (les Compteurs veillent). */
export const POINTS_LIEUX: Partial<Record<LieuJouable, readonly PointLieu[]>> = {
  station: [
    { id: "velo", type: "velo_fosse", zone: "route", places: [[22, 41.5], [88, 29], [176, 41]], o: 0.3 },
    { id: "mobylette", type: "epave_mobylette", zone: "route", places: [[48, 29], [126, 41.8], [190, 29.5]], o: -0.4 },
    { id: "gravats", type: "tas_gravats", zone: "village", places: [[33, 14.5]], o: 0 },
    { id: "carcasse", type: "carcasse_mouton", zone: "champ", places: [[70, 48], [20, 19], [180, 50]], o: 1.1 },
    { id: "frigo", type: "frigo_connecte", zone: "village", places: [[47, 24], [32, 23]], o: 1.6 },
    { id: "machine", type: "machine_laver", zone: "village", places: [[36, 25.5], [49, 14.5]], o: 0.2 },
    { id: "trampoline", type: "trampoline", zone: "jardin", places: [[57, 18], [59.5, 21]], o: 0 },
    // Le coffre des deux voitures de la route : à l'arrière de l'épave, du côté ouest.
    { id: "coffre_1", type: "coffre_voiture", zone: "route", places: [[65.6, 33.2]], o: 0 },
    { id: "coffre_2", type: "coffre_voiture", zone: "route", places: [[136.4, 37]], o: 0 },
  ],
  cooperative: [
    { id: "gravats", type: "tas_gravats", zone: "village", places: [[8, 45]], o: 0.5 },
    { id: "carcasse", type: "carcasse_mouton", zone: "ferme", places: [[70, 50], [76, 4], [4, 6]], o: 0.4 },
  ],
};

/** Un point « lent » (gravats, carcasse) revient au bout de trois jours réels. */
export const RENOUVELLEMENT_LENT_MS = 3 * 24 * 3_600_000;

/** Où est un point à son n-ième cycle (un événement change de place à chaque retour). */
export function placePoint(cle: string, p: PointLieu, cycle: number): { x: number; z: number } {
  // Un décalage propre au lieu, puis une place après l'autre : il revient toujours ailleurs (§4.2).
  const k = (graineDe("place", cle, p.id) + cycle) % p.places.length;
  const [x, z] = p.places[k]!;
  return { x, z };
}

/** Ce que contient un point à son n-ième cycle, en liste (ce qu'il donne à coup sûr, puis ses tirages). */
export function contenuPointCycle(cle: string, p: PointLieu, cycle: number): TypeObjet[] {
  return deplier(contenuPoint(p.type, graineDe("point", cle, p.id, cycle), p.zone));
}

/** Combien de temps avant qu'un point entamé revienne (ou se remplisse à nouveau). */
export function delaiPoint(cle: string, p: PointLieu, cycle: number): number {
  const r = POINTS_DECHETS[p.type].renouvellement;
  if (r === "evenement") return RENOUVELLEMENT_POINT_MS;
  if (r === "lent") return RENOUVELLEMENT_LENT_MS;
  return delaiRenouvellement(graineDe("point", cle, p.id, cycle));
}

/** Un point qui se fouille (on choisit dans une liste) ; sinon, on le démonte ou on le prend d'un coup. */
export function seFouille(type: TypePointDechets): boolean {
  return POINTS_DECHETS[type].verbe === "fouiller";
}

// ---------- Ce que le client reçoit ----------

/** Un point vu par le client : sa place, et s'il est là (un conteneur : combien d'objets il garde). */
export interface PointDechetsVu {
  id: string;
  type: TypePointDechets;
  x: number;
  z: number;
  o: number;
  /** Encore là (démonter, prendre), ou pas encore vidé (fouiller). */
  dispo: boolean;
  /** Un point qui se fouille : combien d'objets il garde. */
  reste?: number;
}

/**
 * La couche d'un lieu telle que le client la reçoit à l'entrée (≈ 1 Ko) : la clé (d'où il tire tout le reste), les
 * carreaux déjà entamés (remplissage et pièces prises ; les autres sont pleins, au premier remplissage), les points.
 */
export interface VueDechets {
  cle: string;
  carreaux: [cx: number, cz: number, remplissage: number, pris: number[]][];
  points: PointDechetsVu[];
}

/** Ce qu'un conteneur ouvert montre (la liste de la fouille, comme à la décharge). */
export interface FouilleVue {
  /** « c:3:1:4 » (un conteneur d'un carreau) ou « p:velo » (un point). */
  ref: string;
  nom: string;
  objets: { i: number; objet: TypeObjet }[];
}

export type OperationDechets =
  /** Ramasser une pièce d'un amas (1 s). */
  | { genre: "ramasser"; cx: number; cz: number; i: number }
  /** Fouiller un conteneur ou un point qui se fouille (4 à 8 s) : la liste s'ouvre. */
  | { genre: "fouiller"; ref: string }
  /** Prendre un objet de la liste ouverte ; ce qu'on laisse reste dedans. */
  | { genre: "prendre"; ref: string; i: number }
  /** Démonter un point sur place (le vélo du fossé, le trampoline…), ou prendre la carcasse. */
  | { genre: "demonter"; ref: string }
  | { genre: "fermer" };

/** La référence d'un conteneur d'un carreau. */
export function refConteneur(cx: number, cz: number, e: number): string {
  return `c:${cx}:${cz}:${e}`;
}

/** Lit une référence : un conteneur de carreau, un point, ou rien de connu. */
export function lireRef(ref: string): { genre: "conteneur"; cx: number; cz: number; e: number } | { genre: "point"; id: string } | null {
  const m = /^c:(-?\d+):(-?\d+):(\d+)$/.exec(ref);
  if (m) return { genre: "conteneur", cx: Number(m[1]), cz: Number(m[2]), e: Number(m[3]) };
  const p = /^p:([a-z0-9_]{1,30})$/.exec(ref);
  return p ? { genre: "point", id: p[1]! } : null;
}

/** Le nom d'un conteneur, pour la liste et les boutons. */
export function nomConteneur(genre: TypeConteneur): string {
  return genre === "poubelle_renversee" ? "poubelle renversée" : genre === "coffre_voiture" ? "coffre de voiture" : "sac-poubelle crevé";
}

