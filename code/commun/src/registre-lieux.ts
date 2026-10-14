// Le registre des lieux (plan 0.10, chantier A) : ce que le serveur et le client savent de chaque lieu, en un seul
// endroit, pour qu'aucun module n'ait de branche écrite en dur par lieu (« si c'est le Moulin, alors… »).
//
// Chaque lieu y a sa fiche : sa nature (le terrain, une halte partagée, le Comptoir neutre, ou un lieu à soi), son
// étape du monde, sa zone et ses sorties (lieux.ts), ses portes, son plan de vue, ses pièces noires, sa
// réinitialisation, sa musique, et deux textes (comment on dit qu'on traverse une halte, comment on en repart).
// Le contenu vivant (les Éteints, le butin, le semis, le milieu) est à côté, dans contenu-lieux.ts : le serveur seul
// s'en sert, le client n'a pas à le charger.
//
// Ce qui est propre à un lieu (les portes et la grosse clé du Moulin, le bac du gué, la radio de la Coopérative) reste
// dans son module : le registre ne le réécrit pas, il dit seulement ce que tous les lieux ont en commun.
//
// ---------- Ajouter un lieu (la recette, pour les chantiers H à K de la 0.10 et les suivants) ----------
//
// 1. lieux.ts : son identifiant dans `LieuId` et `LIEUX_NIVEAU_<n>`, ses tronçons (TRONCONS), son étape
//    (ETAPES_LIEUX), sa fiche de carte (LIEUX), sa zone et ses sorties (ZONES, SORTIES), importées de son module.
// 2. Son module commun (comme route-pont.ts, hotel.ts…) : son plan, sa zone, ses sorties, ses portes. Il n'importe
//    des autres modules du jeu que des types (lieux.ts l'importe ; un module de lieu n'importe jamais ce registre).
// 3. Ici, une entrée dans REGISTRE_LIEUX (la nature, le plan, les portes…), et dans contenu-lieux.ts son contenu
//    (Éteints, ressources, butin, semis, milieu, version).
// 4. Côté serveur, rien de plus : serveur/src/lieux-vivants.ts le construit d'après sa nature (une halte partagée,
//    ou un lieu à soi qui revient à 24 h). Un lieu qui a ses propres règles (un état gardé, des gestes) déclare sa
//    fabrique dans FABRIQUES (serveur/src/lieux-vivants.ts), sur `LieuVivant` et `LieuxPersonnels`.
// 5. Côté client, son décor dans DECORS (client/src/main.ts) ; tant que le modèle n'est pas importé,
//    `creerLieuVide(lieu)` (client/src/rendu/lieu-vide.ts). Sa place et son tracé sur la carte (client/src/carte.ts).
// 6. Ses déchets (ZONES_DECHETS, couche-dechets.ts : `[]` s'il n'en a pas).

import type { EtapeMonde } from "./lignees.ts";
import { REINITIALISATION_COOP_MS, portesInitiales, sombreIci } from "./cooperative.ts";
import { PLAN_VUE_HOTEL, sombreHotel } from "./hotel.ts";
import { TOUS_LES_LIEUX, zoneCoop, zoneDe, zoneMoulin, type LieuId, type Sortie, type Zone } from "./lieux.ts";
import { REINITIALISATION_MOULIN_MS, portesInitialesMoulin, sombreMoulin } from "./moulin.ts";
import { PLAN_VUE_COOP, PLAN_VUE_GUE, PLAN_VUE_HALTE, PLAN_VUE_MOULIN } from "./vue-lieux.ts";
import type { PlanVue } from "./vue.ts";

/**
 * La nature d'un lieu :
 * - `terrain` : chez soi ;
 * - `halte` : un lieu partagé par tous les voyageurs présents, qu'on traverse (la station, le gué, la route du pont…) ;
 * - `neutre` : partagé, mais sans Éteints ni lieu vivant (le Comptoir du Carrefour) ;
 * - `personnel` : un lieu à soi, que personne d'autre ne voit, qui revient au bout de 24 h (la Coopérative, le Moulin…).
 */
export type NatureLieu = "terrain" | "halte" | "neutre" | "personnel";

/** La musique d'un lieu : celle que la session musique livre (la station joue « halte »), ou livrera. */
export type MusiqueLieu = Exclude<LieuId, "station"> | "halte";

/** Les portes d'un lieu : leur état d'origine (ouverte : true), et la zone selon leur état. */
export interface PortesLieu {
  initiales: () => Record<string, boolean>;
  zone: (portes: Readonly<Record<string, boolean>>) => Zone;
}

export interface FicheLieu {
  id: LieuId;
  nature: NatureLieu;
  /** Le niveau du lieu (0 : chez soi et le Comptoir). */
  niveau: 0 | 1 | 2;
  /** Son étape du monde (ETAPES_LIEUX) ; null pour le Comptoir. */
  etape: EtapeMonde | null;
  /** Ses portes, s'il en a (la zone change quand on en ferme une). */
  portes?: PortesLieu;
  /** Ce qui arrête la vue (null : à ciel ouvert). */
  plan: PlanVue | null;
  /** Une pièce noire, où il fait nuit même de jour. */
  sombre?: (x: number, z: number) => boolean;
  /** Un lieu à soi : au bout de ce délai (ms), tout revient (à l'entrée, lieu vide ; plan 0.8 §9.1, N1). */
  reinitialisationMs?: number;
  /** Une halte : ce qu'on dit quand la route y passe (« il faudra la traverser à pied ») ; sans : « y passer ». */
  traverser?: string;
  musique: MusiqueLieu;
  /** Sur la carte, quand on n'est pas à la bonne sortie : par où repartir vers `etape` (sans : la phrase commune). */
  pourPartir?: (etape: LieuId) => string;
}

/** La réinitialisation des lieux à soi (24 h, comme la Coopérative et le Moulin : plan 0.8 §9.1, N1). */
export const REINITIALISATION_LIEU_MS = 24 * 3_600_000;

/** Les fiches de tous les lieux. Une entrée par lieu ; un nouveau lieu ajoute la sienne à la fin. */
export const REGISTRE_LIEUX: Readonly<Record<LieuId, FicheLieu>> = {
  terrain: {
    id: "terrain",
    nature: "terrain",
    niveau: 0,
    etape: "maison",
    plan: null,
    musique: "terrain",
    pourPartir: () => "D'ici, la route ne mène pas là.",
  },
  station: {
    id: "station",
    nature: "halte",
    niveau: 1,
    etape: "H1A",
    plan: PLAN_VUE_HALTE,
    traverser: "la traverser",
    musique: "halte",
    pourPartir: (etape) =>
      etape === "cooperative"
        ? "Pour partir, prends le chemin de terre au nord de la route, à l'ouest de la station, jusqu'à la lisière."
        : "Pour partir, rejoins le bout de la route, du côté de ta destination.",
  },
  comptoir: { id: "comptoir", nature: "neutre", niveau: 0, etape: null, plan: null, musique: "comptoir" },
  gue: { id: "gue", nature: "halte", niveau: 1, etape: "H1B", plan: PLAN_VUE_GUE, traverser: "le traverser", musique: "gue" },
  cooperative: {
    id: "cooperative",
    nature: "personnel",
    niveau: 1,
    etape: "L1A",
    portes: { initiales: portesInitiales, zone: zoneCoop },
    plan: PLAN_VUE_COOP,
    sombre: sombreIci,
    reinitialisationMs: REINITIALISATION_COOP_MS,
    musique: "cooperative",
    pourPartir: (etape) =>
      etape === "comptoir" ? "Pour partir, repasse le portail, au sud (ou glisse-toi par la brèche, à l'ouest)." : "Pour partir, repasse le portail, au sud.",
  },
  moulin: {
    id: "moulin",
    nature: "personnel",
    niveau: 1,
    etape: "L1B",
    portes: { initiales: portesInitialesMoulin, zone: zoneMoulin },
    plan: PLAN_VUE_MOULIN,
    sombre: sombreMoulin,
    reinitialisationMs: REINITIALISATION_MOULIN_MS,
    musique: "moulin",
    pourPartir: () => "Pour partir, repasse le pont de pierre (ou prends le chemin de halage, au bout de la levée).",
  },
  // ---------- 0.10 : le niveau 2, branché vide (chantier A) ; leur contenu aux chantiers H à K ----------
  route_pont: { id: "route_pont", nature: "halte", niveau: 2, etape: "H2A", plan: null, traverser: "la traverser", musique: "route_pont" },
  grand_hotel: {
    id: "grand_hotel",
    nature: "personnel",
    niveau: 2,
    etape: "L2A",
    // 0.10, chantier J : le plan de l'hôtel, ses pièces sombres (commun/src/hotel.ts).
    plan: PLAN_VUE_HOTEL,
    sombre: sombreHotel,
    reinitialisationMs: REINITIALISATION_LIEU_MS,
    musique: "grand_hotel",
    pourPartir: () => "Pour partir, reprends la promenade, à l'est.",
  },
  corniche: { id: "corniche", nature: "halte", niveau: 2, etape: "H2B", plan: null, traverser: "la traverser", musique: "corniche" },
  phare: {
    id: "phare",
    nature: "personnel",
    niveau: 2,
    etape: "L2B",
    plan: null,
    reinitialisationMs: REINITIALISATION_LIEU_MS,
    musique: "phare",
    pourPartir: () => "Pour partir, repasse la grille, au nord.",
  },
};

/** La fiche d'un lieu. */
export function ficheLieu(lieu: LieuId): FicheLieu {
  return REGISTRE_LIEUX[lieu];
}

/** Un lieu partagé : on y voit les autres et on peut échanger (les haltes, le Comptoir). */
export function estPartage(lieu: LieuId): boolean {
  const n = REGISTRE_LIEUX[lieu].nature;
  return n === "halte" || n === "neutre";
}

/** Un lieu à soi, hors de chez soi : personne d'autre n'y entre (la Coopérative, le Moulin, l'hôtel, le phare). */
export function estPersonnel(lieu: LieuId): boolean {
  return REGISTRE_LIEUX[lieu].nature === "personnel";
}

/** Une halte partagée, qu'on traverse (la station, le gué, la route du pont, la corniche). */
export function estHalte(lieu: LieuId): boolean {
  return REGISTRE_LIEUX[lieu].nature === "halte";
}

/** Là où l'on est seul (son terrain, ses lieux à soi) : la pause y est possible. */
export function pausePossibleIci(lieu: LieuId): boolean {
  const n = REGISTRE_LIEUX[lieu].nature;
  return n === "terrain" || n === "personnel";
}

/** La zone d'un lieu selon l'état de ses portes (sans portes : sa zone, telle qu'on la trouve). */
export function zoneSelonPortes(lieu: LieuId, portes: Readonly<Record<string, boolean>>): Zone {
  const p = REGISTRE_LIEUX[lieu].portes;
  return p ? p.zone(portes) : zoneDe(lieu);
}

/** Le plan de vue d'un lieu (null : à ciel ouvert). */
export function planDe(lieu: LieuId): PlanVue | null {
  return REGISTRE_LIEUX[lieu].plan;
}

/** Fait-il noir ici, même de jour ? (une pièce noire de la Coopérative, du Moulin…) */
export function sombreDans(lieu: LieuId, x: number, z: number): boolean {
  return REGISTRE_LIEUX[lieu].sombre?.(x, z) ?? false;
}

/** « il faudra la traverser à pied », « le traverser », « y passer ». */
export function traverserLieu(lieu: LieuId): string {
  return REGISTRE_LIEUX[lieu].traverser ?? "y passer";
}

/** Par où repartir d'ici vers `etape`, quand on n'est pas à la bonne sortie (la note de la carte). */
export function pourPartirDe(lieu: LieuId, etape: LieuId): string {
  return REGISTRE_LIEUX[lieu].pourPartir?.(etape) ?? "Pour partir, rejoins le bout de la route, du côté de ta destination.";
}

/** Ce qu'on dit d'une sortie quand on l'examine. */
export function examenSortie(s: Sortie): string {
  return s.examen ?? "La route continue. Au bout, il faudra la carte.";
}

/** Les lieux d'un niveau, dans l'ordre des routes. */
export function lieuxDuNiveau(niveau: FicheLieu["niveau"]): LieuId[] {
  return TOUS_LES_LIEUX.filter((l) => REGISTRE_LIEUX[l].niveau === niveau);
}
