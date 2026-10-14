// Les ressources de H2A, la route du pont (plan 0.10, chantier H ; commun/src/route-pont.ts les pose) : leurs types,
// leurs usages, leurs délais. terrain.ts les reprend dans ses tables (un bloc à la fin de chacune) ; ce fichier n'en
// importe que des types (pas de cycle).
//
// - Le vrac du thème « électrique et atelier » (I14, bible) : les câbles de cuivre arrachés au portique « connecté », les
//   résistances de son armoire, les cellules des colis et de la borne, le bidon d'huile du hangar ; les lames de ressort
//   et les barres sont les `ressort` et `barre_metal` du terrain (la ferraille au pied de la grue, la voiture brûlée).
// - La bobine d'allumage (N2-57, I12) : sur le moteur hors-bord de l'établi du hangar, et sur la mobylette échouée.
// - Les fouilles « par chance » (la table de leur lieu, et rarement un objet-clé : R-BUTIN, H2A) : la maison du pontier,
//   l'épicerie (le fil dentaire courant, N2-61), le bar, les voitures du tablier, la camionnette de colis, la péniche
//   (ses plaids polaires, N2-58), le hangar, la chapelle. La réserve des guetteurs, sur la pile, est enfermée dans le
//   modèle (entre le pied du pylône et la cabane, le passage fait 0,6 m) : pas de fouille là tant qu'il n'est pas élargi.
// - Les bancs de la cale basse (S-20) : à marée basse seulement, les caddies, les trottinettes d'enfant et la
//   débroussailleuse échoués (tubes d'aluminium, chutes, roues), et la mobylette.

import type { TypeRessource, UsageRessource } from "./terrain.ts";

/** Les types de ressources de la route du pont. */
export type TypeRessourcePont =
  // Le vrac (B8 : il grandit avec les voyageurs)
  | "pont_cuivre"
  | "pont_resistances"
  | "pont_cellules"
  | "pont_huile"
  // La bobine du moteur hors-bord
  | "pont_moteur"
  // Les fouilles « par chance »
  | "pont_pontier"
  | "pont_epicerie"
  | "pont_bar"
  | "pont_voiture"
  | "pont_camionnette"
  | "pont_peniche"
  | "pont_hangar"
  | "pont_chapelle"
  // Les bancs de la cale basse, à marée basse seulement
  | "banc_caddie"
  | "banc_trottinette"
  | "banc_debroussailleuse"
  | "banc_mobylette";

/** Les bancs de la cale : on ne les fouille qu'à marée basse (S-20). */
export const BANCS_DE_LA_CALE: readonly TypeRessourcePont[] = ["banc_caddie", "banc_trottinette", "banc_debroussailleuse", "banc_mobylette"];

/** Ce qui se fouille « par chance » (une table de vestiges, et rarement un objet-clé). */
export const FOUILLES_PONT: readonly TypeRessourcePont[] = ["pont_pontier", "pont_epicerie", "pont_bar", "pont_voiture", "pont_camionnette", "pont_peniche", "pont_hangar", "pont_chapelle"];

const H = 3_600_000;

/**
 * Les délais : le vrac revient en 30 min comme les pierres des haltes (B4 ; le lieu le dit dans son butin) ; les
 * fouilles, la bobine et les bancs en 12 h, comme les fouilles de la station et du gué.
 */
export const REPOUSSE_PONT: Record<TypeRessourcePont, number | null> = {
  pont_cuivre: 30 * 60_000,
  pont_resistances: 30 * 60_000,
  pont_cellules: 30 * 60_000,
  pont_huile: 30 * 60_000,
  pont_moteur: 12 * H,
  pont_pontier: 12 * H,
  pont_epicerie: 12 * H,
  pont_bar: 12 * H,
  pont_voiture: 12 * H,
  pont_camionnette: 12 * H,
  pont_peniche: 12 * H,
  pont_hangar: 12 * H,
  pont_chapelle: 12 * H,
  banc_caddie: 12 * H,
  banc_trottinette: 12 * H,
  banc_debroussailleuse: 12 * H,
  banc_mobylette: 12 * H,
};

/** Ce qui reste en place une fois fouillé : le décor est le modèle (les fouilles, le moteur, les bancs). */
export const RESTE_EN_PLACE_PONT: Partial<Record<TypeRessource, true>> = Object.fromEntries(
  (Object.keys(REPOUSSE_PONT) as TypeRessourcePont[]).filter((t) => !["pont_cuivre", "pont_resistances", "pont_cellules", "pont_huile"].includes(t)).map((t) => [t, true]),
);

/** L'emprise de ce qu'on vise (m) : les voitures, la camionnette, la péniche, les caddies. */
export const EMPRISE_PONT: Partial<Record<TypeRessource, number>> = {
  pont_voiture: 1.4,
  pont_camionnette: 1.6,
  pont_peniche: 1.2,
  pont_hangar: 1.0,
  banc_caddie: 0.7,
  banc_mobylette: 0.8,
};

const fouille = (libelle: string, examen: string, duree = 5, donne: UsageRessource["donne"] = {}): UsageRessource => ({ verbe: "fouiller", libelle, donne, qualites: {}, duree, examen });

export const USAGES_PONT: Record<TypeRessourcePont, UsageRessource> = {
  // ---------- Le vrac ----------
  pont_cuivre: {
    verbe: "ramasser",
    libelle: "Prendre le câble de cuivre",
    donne: { fil_cuivre: 2 },
    qualites: {},
    duree: 2,
    examen: "Des câbles arrachés au portique « connecté », dénudés par endroits : du bon cuivre, sous le plastique.",
  },
  pont_resistances: {
    verbe: "ramasser",
    libelle: "Prendre la carte électronique",
    donne: { resistance: 1 },
    qualites: {},
    duree: 2,
    examen: "Une carte tombée de l'armoire du portique, ses résistances encore soudées.",
  },
  pont_cellules: {
    verbe: "ramasser",
    libelle: "Prendre le bloc de cellules",
    donne: { cellule_lithium: 3 },
    qualites: {},
    duree: 2,
    examen: "Le bloc de batterie d'un appareil « connecté », éventré : trois cellules lithium, encore saines.",
  },
  pont_huile: {
    verbe: "ramasser",
    libelle: "Prendre le bidon d'huile",
    donne: { bidon_huile: 1 },
    qualites: {},
    duree: 1.5,
    examen: "Un bidon d'huile moteur, rond, au bouchon jaune. Il en reste une bonne moitié.",
  },
  // ---------- La bobine (N2-57) ----------
  pont_moteur: {
    verbe: "demonter",
    libelle: "Démonter la bobine du moteur",
    donne: { bobine_allumage: 1 },
    qualites: { visser: 1 },
    duree: 8,
    examen: "Le moteur hors-bord serré sur l'établi, capot ouvert. Sous le volant, la bobine d'allumage, intacte. Il faut de quoi visser.",
  },
  // ---------- Les fouilles « par chance » ----------
  pont_pontier: fouille("Fouiller le bureau du pontier", "Le bureau du pontier : le registre des passages depuis 1934, le tampon, une caisse de jetons. Le tarif est encore au mur : piéton, 0 f 10."),
  // V3-03 (chantier V3) : une bouteille vide à l'épicerie (la consigne), une derrière le comptoir du bar.
  pont_epicerie: fouille("Fouiller l'épicerie", "Les rayons de l'épicerie du bar : des sardines, du sel, des allumettes, des appâts, des brosses à dents, un casier de bouteilles consignées.", 5, { bouteille_verre: 1 }),
  pont_bar: fouille("Fouiller derrière le comptoir", "Le comptoir « Au Rendez-vous des Pêcheurs » : des bouteilles, du sucre, du tabac, l'ardoise du Wi-Fi des marées.", 5, { bouteille_verre: 1 }),
  pont_voiture: fouille("Fouiller la voiture", "Une voiture restée sur le pont : la boîte à gants, le coffre, les sièges. Les gens sont partis à pied.", 4),
  pont_camionnette: fouille("Fouiller les colis", "Des colis « Livré en 7 min, garanti » : des chargeurs, des gadgets, une bouilloire connectée, des chaussettes."),
  pont_peniche: fouille("Fouiller la péniche", "« Ma Liberté », échouée dans la forme : un salon de coussins et de plaids polaires, une cuisine, des livres de bord."),
  pont_hangar: fouille("Fouiller le hangar", "Le hangar des canotiers : des barques sur tréteaux, des filets, des avirons, des gilets de sauvetage."),
  pont_chapelle: fouille("Fouiller la chapelle", "La chapelle des marins : des cierges, une nappe d'autel, des maquettes de bateaux pendues à la voûte.", 4),
  // ---------- Les bancs de la cale basse (à marée basse) ----------
  banc_caddie: {
    verbe: "demonter",
    libelle: "Démonter le caddie échoué",
    // V3-02 (chantier V3) : deux tubes (le cadre et la poignée).
    donne: { tube_aluminium: 2, aluminium: 2, caoutchouc: 2 },
    qualites: { serrer: 1 },
    duree: 12,
    examen: "Un caddie couché dans la vase de la cale, des algues dans les roues. Son cadre d'aluminium se démonte.",
  },
  banc_trottinette: {
    verbe: "demonter",
    libelle: "Démonter la trottinette",
    donne: { tube_aluminium: 1, aluminium: 3, caoutchouc: 1 },
    qualites: { serrer: 1 },
    duree: 8,
    examen: "Une trottinette d'enfant, rose, plantée dans la vase. Le guidon est un tube d'aluminium.",
  },
  banc_debroussailleuse: {
    verbe: "demonter",
    libelle: "Démonter la débroussailleuse",
    donne: { tube_aluminium: 1, plastique: 2 },
    qualites: { serrer: 1 },
    duree: 12,
    examen: "Une débroussailleuse échouée sur la cale, le moteur noyé. Son manche est un long tube d'aluminium.",
  },
  banc_mobylette: {
    verbe: "demonter",
    libelle: "Démonter la bobine de la mobylette",
    donne: { bobine_allumage: 1, fil_cuivre: 1 },
    qualites: { visser: 1 },
    duree: 10,
    examen: "Une mobylette couchée dans la vase. Sous le réservoir, la bobine d'allumage, protégée de l'eau par sa gaine.",
  },
};
