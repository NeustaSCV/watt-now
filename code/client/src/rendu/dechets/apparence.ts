// L'apparence au sol des objets de la couche de déchets (0.7, chantier 7) : chaque objet est une SILHOUETTE partagée,
// une TEINTE et une ÉCHELLE (Book 26 §9.2, chiffrage graphique §2.1). On ne dessine pas 160 modèles : une canette, une
// conserve et un rouleau de papier toilette sont le même cylindre couché, à leur taille et à leur couleur.
//
// Que des données (aucun three.js ici) : le test vérifie que chaque objet qui peut traîner au sol a son entrée.
// La teinte, si elle n'est pas donnée, est celle de l'icône du sac (le premier aplat qui n'est pas l'encre) : l'objet
// au sol et sa case dans le sac se reconnaissent l'un l'autre.

import type { TypeObjet } from "../../../../commun/src/objets.ts";
import { icone } from "../../icones.ts";

/** Les silhouettes partagées (les 16 du chiffrage, et ce qu'il fallait de plus pour ne rien rendre absurde). */
export type Silhouette =
  | "cylindre" // couché : canette, conserve, gobelet, rouleau
  | "bouteille" // couchée, avec son goulot
  | "boite" // carton, appareil de bureau, bidon
  | "livre"
  | "plaque" // plate : prospectus, magazine, plaque, panneau, écran
  | "chiffon" // froissé : t-shirt, jean, tente pliée, bâche
  | "coussin" // oreiller, matelas, gros sac
  | "barre" // piquet, tuyau, parapluie fermé, outil à manche
  | "roue" // pneu, chambre à air
  | "bobine" // câble, tuyau d'arrosage, corde, fil de fer enroulés
  | "ressort"
  | "appareil" // petit appareil à écran ou à boutons
  | "galet" // robot rond : aspirateur, tondeuse
  | "lame" // disque, lame, enjoliveur
  | "velo"
  | "trottinette"
  | "sac" // sac plastique, paquet
  | "pot" // cylindre debout : fût, pot de peinture, cocotte
  | "cone" // cône de chantier
  | "grille" // caddie
  | "barbecue"
  | "boule" // ballon
  | "flamant"
  | "nain";

/** Une échelle : un facteur, ou un par axe (x : la longueur, y : la hauteur, z : la largeur). */
export type Echelle = number | readonly [number, number, number];

export interface ApparenceObjet {
  s: Silhouette;
  /** L'échelle de la silhouette (1 : sa taille nominale, voir silhouettes.ts). */
  e?: Echelle;
  /** La teinte principale (sinon : celle de l'icône). */
  t?: number;
  /** La teinte d'un détail (bandeau, bouchon, écran), si la silhouette en a un. */
  a?: number;
}

/** Posé à sa taille, un objet est grandi de 15 % comme les outils tenus (Book 21 §5.3.2) : il se lit mieux. */
export const AGRANDISSEMENT = 1.15;

// Les teintes de l'Abondance (Book 21 §5.3.1), franches puisque tout se ramasse.
const CREME = 0xe8e0c8;
const ROUGE = 0xc8362b;
const BLEU = 0x2f6fa4;
const OCRE = 0xd8a83a;
const NOIR = 0x2b2b2b;
const GRIS = 0x8a8f96;
const ROUILLE = 0xa4552f;
const CARTON = 0xa88a5c;
const BLANC = 0xece8de;

/**
 * Chaque objet qui peut traîner au sol (les tables de commun/src/dechets.ts, sans les petits de moins de 10 cm). Les
 * échelles partent de la taille nominale de la silhouette pour retrouver la taille réelle (Book 12).
 */
export const APPARENCES: Partial<Record<TypeObjet, ApparenceObjet>> = {
  // ---- Emballages et ordures ----
  canette: { s: "cylindre", e: [1, 0.6, 1] },
  sac_canettes: { s: "sac", e: 1.6, t: 0x9cc8d8 },
  bouteille_plastique: { s: "bouteille", t: 0x9cc8d8, a: BLEU },
  // Plan 0.10.1 (A4) : pleine, l'eau la fonce un peu.
  bouteille_eau: { s: "bouteille", t: 0x6fb0d0, a: BLEU },
  bouteille_verre: { s: "bouteille", e: [0.95, 1.1, 1.1], t: 0x3a7a4a, a: 0xc9ccd0 },
  sac_plastique: { s: "sac", t: BLANC },
  barquette: { s: "plaque", e: [0.7, 3, 0.8], t: BLANC },
  paquet_chips: { s: "sac", e: [1, 0.55, 0.8] },
  boite_capsules: { s: "boite", e: 0.45 },
  boite_pizza: { s: "plaque", e: [1.1, 2.5, 1.55], a: ROUGE },
  brique_lait: { s: "boite", e: [0.6, 0.35, 0.25] },
  billets: { s: "plaque", e: [0.5, 2, 0.35] },
  carton: { s: "plaque", e: [1.7, 2.5, 1.7], t: CARTON },
  caddie: { s: "grille" },
  cone_chantier: { s: "cone" },
  conserve_bombee: { s: "cylindre", e: [0.9, 1.35, 1.35], t: ROUGE },
  coque_plastique: { s: "plaque", e: [0.6, 3, 0.8], t: 0xd6dfe4 },
  gobelet: { s: "cylindre", e: [0.9, 1.1, 1.1], t: BLANC, a: CARTON },
  magazine: { s: "plaque", e: [0.8, 1.5, 1.1] },
  os_nylon: { s: "barre", e: [0.17, 2.2, 2.2], t: 0xe8a8b8, a: 0xe8a8b8 },
  pot_peinture: { s: "pot", e: [1.1, 0.9, 1.1] },
  prospectus: { s: "plaque", e: [0.8, 3, 1], t: CREME, a: ROUGE },
  bidon_lave_glace: { s: "bouteille", e: [1, 1.6, 1.3], t: 0x3f8fb0 },
  ballon_baudruche: { s: "chiffon", e: [0.4, 0.6, 0.4] },
  // ---- Textile ----
  tshirt_promo: { s: "chiffon" },
  jean_troue: { s: "chiffon", e: [1.2, 1, 1.1], t: 0x3b5a8c },
  doudoune: { s: "chiffon", e: [1.1, 1.4, 1] },
  rideau: { s: "chiffon", e: [1.6, 1, 1.4] },
  oreiller_plumes: { s: "coussin", t: BLANC },
  matelas: { s: "coussin", e: [2.6, 1.4, 5.2], t: CREME },
  cintres: { s: "sac", e: [1.7, 1.2, 1.6] },
  couverture_survie: { s: "chiffon", e: [1.2, 0.5, 1], t: 0xd8b84a },
  parapluie: { s: "barre", e: [0.8, 1.8, 1.8], t: NOIR },
  basket_led: { s: "appareil", e: [1.25, 1.3, 0.65] },
  chiffons: { s: "chiffon", e: [0.6, 0.8, 0.6] },
  // ---- Loisir, sport, jardin ----
  ballon_foot: { s: "boule" },
  flamant_rose: { s: "flamant" },
  tente_popup: { s: "chiffon", e: [1.8, 2.2, 1.8] },
  hamac: { s: "chiffon", e: [2.5, 1, 1.2] },
  piscine_gonflable: { s: "chiffon", e: [3.4, 1.2, 3.4], t: 0x4a9ac2 },
  planche_roulettes: { s: "plaque", e: [2.7, 2.5, 1], a: NOIR },
  tapis_yoga: { s: "cylindre", e: [5, 1.5, 1.5], a: 0x6a5a8c },
  volants_badminton: { s: "cylindre", e: [2.2, 0.9, 0.9], a: BLANC },
  attrape_reves: { s: "roue", e: [0.3, 0.15, 0.3] },
  balise_solaire: { s: "barre", e: [0.35, 1.8, 1.8], t: 0x5c5953, a: 0xd6dfe4 },
  parasol: { s: "barre", e: [2, 3, 3] },
  // 0.10 (chantier B) : la chaise de camping repliée, sa toile autour des tubes.
  chaise_camping: { s: "chiffon", e: [1.1, 0.7, 2.6], t: 0x2f6f8a },
  barbecue: { s: "barbecue", t: ROUILLE },
  sac_charbon_bbq: { s: "coussin", e: [1, 1.2, 1.1] },
  trottinette_electrique: { s: "trottinette" },
  trottinette_enfant: { s: "trottinette", e: 0.7 },
  velo_enfant: { s: "velo", e: 0.65 },
  velo_libre_service: { s: "velo" },
  velo_appartement: { s: "boite", e: [2.6, 4, 1.4] },
  peluche_parlante: { s: "coussin", e: [0.55, 1.6, 0.7] },
  laisse_enrouleur: { s: "appareil", e: [0.6, 1, 0.3] },
  // ---- Maison, gadgets ----
  bougie_parfumee: { s: "pot", e: 0.5 },
  pot_stylos: { s: "pot", e: [0.4, 0.5, 0.4] },
  fontaine_chat: { s: "pot", e: [1, 0.8, 1], t: BLANC },
  tableau_vivre_rire: { s: "plaque", e: [2, 3, 1.5], t: CREME },
  livre_meilleur_soi: { s: "livre" },
  livre_cuisiner: { s: "livre" },
  manuel_arbalete: { s: "livre" },
  manuel_electricien: { s: "livre" },
  manuel_forgeron: { s: "livre" },
  encyclopedie: { s: "boite", e: [1.1, 1.3, 0.9] },
  casque_vr: { s: "appareil", e: [1, 1.3, 1], t: BLANC },
  camera_surveillance: { s: "appareil", e: [0.7, 1.2, 0.7], t: BLANC },
  chargeur_sans_fil: { s: "appareil", e: [0.45, 0.3, 0.6] },
  box_internet: { s: "appareil", e: [1, 0.6, 1] },
  agrafeuse: { s: "appareil", e: [0.8, 1, 0.35] },
  onduleur: { s: "boite", e: [0.9, 1, 0.6], t: NOIR },
  imprimante: { s: "boite", e: [1.1, 0.9, 1.1], t: BLANC },
  radiateur: { s: "boite", e: [1.6, 2.5, 0.3], t: CREME },
  aspirateur_robot: { s: "galet" },
  tondeuse_robot: { s: "galet", e: [1.6, 2, 1.4] },
  robot_domestique: { s: "boite", e: [1.2, 2.2, 1], t: BLANC },
  smartphone_fele: { s: "appareil", e: [0.4, 0.15, 1], t: NOIR },
  telecommande: { s: "appareil", e: [0.25, 0.3, 1.1], t: NOIR },
  calculatrice_solaire: { s: "appareil", e: [0.4, 0.15, 0.9] },
  batterie_externe: { s: "appareil", e: [0.5, 0.3, 0.5] },
  reveil: { s: "appareil", e: [0.6, 1.4, 0.4] },
  enceinte_intelligente: { s: "pot", e: [0.5, 0.9, 0.5] },
  balance_connectee: { s: "appareil", e: [1.4, 0.4, 2], t: BLANC },
  grille_pain_facial: { s: "appareil", e: [1.2, 2.2, 0.9] },
  seche_cheveux: { s: "appareil", e: [1, 1.2, 0.5] },
  brosse_dents_connectee: { s: "barre", e: [0.18, 1.2, 1.2], t: BLANC },
  machine_capsules: { s: "boite", e: [0.6, 1.4, 0.8] },
  micro_ondes: { s: "boite", e: [1.25, 1.4, 1.2] },
  ordinateur_portable: { s: "appareil", e: [1.5, 0.35, 1.5], t: 0x9a9fa6 },
  tele_85: { s: "plaque", e: [6.3, 5, 5], t: NOIR, a: 0x1e2328 },
  miroir_salle_bain: { s: "plaque", e: [1.7, 2, 2.4], t: 0xb8c8d0 },
  pyramide_papier_toilette: { s: "boite", e: [2, 2.6, 1.7], t: BLANC },
  rouleau_papier_toilette: { s: "cylindre", e: [0.9, 1.4, 1.4], t: BLANC, a: BLANC },
  parfum_luxe: { s: "bouteille", e: [0.45, 1.2, 1.2] },
  appareils_mariage: { s: "boite", e: 0.6 },
  appareil_photo_jetable: { s: "appareil", e: [0.55, 0.9, 0.3] },
  guirlande: { s: "bobine", e: [0.9, 1, 0.9], t: 0x3a5a3a },
  coussin_peteur: { s: "coussin", e: [0.5, 0.4, 0.7], t: 0xe8a8b8 },
  perche_selfie: { s: "barre", e: [0.7, 1, 1], t: NOIR },
  raquette_moustiques: { s: "barre", e: [0.45, 1.3, 1.3], t: OCRE },
  arc_sportif: { s: "barre", e: [1.2, 1, 1] },
  fleche_carbone: { s: "barre", e: [0.7, 0.4, 0.4], t: NOIR },
  ventilateur: { s: "barre", e: [1.2, 2.2, 2.2], t: BLANC },
  sac_cables: { s: "sac", e: [1.5, 1.3, 1.5] },
  // ---- Cuisine ----
  bocal: { s: "pot", e: [0.45, 0.7, 0.45], t: 0xc8d8dc },
  casserole: { s: "pot", e: [1, 0.5, 1], t: 0x9a9fa6 },
  cocotte_fonte: { s: "pot", e: [1.3, 0.8, 1.3] },
  autocuiseur: { s: "pot", e: [1.2, 1, 1.2], t: 0xb8bcc0 },
  couteau_cuisine: { s: "barre", e: [0.22, 0.8, 1.5], t: 0xb8bcc0 },
  couteau: { s: "barre", e: [0.2, 0.8, 1.5], t: 0x9a9fa6 },
  conserve: { s: "cylindre", e: [0.9, 1.35, 1.35], t: ROUGE },
  boite_vide: { s: "cylindre", e: [0.9, 1.3, 1.3], t: 0xb8b4ac },
  gourde: { s: "bouteille", e: [0.8, 1.3, 1.3] },
  // ---- Atelier, garage, route, voiture ----
  ressort_suspension: { s: "ressort", t: ROUILLE },
  ressort_garage: { s: "ressort", e: [1.8, 0.55, 0.55], t: 0x6b6862 },
  disque_scie: { s: "lame", t: 0xb8bcc0 },
  fut_200: { s: "pot", e: [3, 4.4, 3] },
  tuyau_cuivre: { s: "barre", e: [0.8, 1.4, 1.4], t: 0xc87a3a },
  bocal_clous: { s: "pot", e: [0.6, 0.9, 0.6], t: 0xc8d8dc },
  bidon_huile: { s: "boite", e: [0.8, 1.5, 0.6] },
  jerrican: { s: "boite", e: [1, 1.6, 0.6] },
  etau: { s: "boite", e: [0.6, 0.8, 0.5], t: BLEU },
  lime_usee: { s: "barre", e: [0.3, 1, 1.4], t: 0x6b6862 },
  perceuse_visseuse: { s: "appareil", e: [1, 2, 0.4] },
  pied_de_biche: { s: "barre", e: [0.7, 1.3, 1.3], t: 0x3a3a3c },
  rallonge: { s: "bobine", e: [1.2, 1.5, 1.2], t: 0xe8743a },
  rouleau_fil_fer: { s: "bobine", t: 0x8a8f96 },
  ruban_adhesif: { s: "roue", e: [0.18, 0.5, 0.18], t: 0x9a9fa6 },
  sac_ciment: { s: "coussin", e: [1.2, 1.3, 1.1], t: 0xb8b0a0 },
  troncon_rail: { s: "barre", e: [0.9, 4, 4], t: ROUILLE },
  groupe_electrogene: { s: "boite", e: [1.5, 2.4, 1.5] },
  bobine_allumage: { s: "pot", e: [0.35, 0.6, 0.35], t: NOIR },
  boite_gants_pv: { s: "boite", e: [0.6, 0.5, 0.6] },
  cables_demarrage: { s: "bobine", e: [1, 1.2, 1], t: ROUGE },
  ceinture_securite: { s: "plaque", e: [1.6, 1, 0.25], t: 0x55606a },
  chambre_air: { s: "roue", e: [0.95, 0.4, 0.95], t: NOIR },
  cric: { s: "appareil", e: [1.6, 1.5, 0.6], t: 0x8a3b2a },
  enjoliveur: { s: "lame", e: [1.25, 3, 1.25], t: 0xc9ccd0 },
  panneau_routier: { s: "plaque", e: [2.3, 1.5, 2.6], t: 0xe8e4dc, a: ROUGE },
  plaque_immat: { s: "plaque", e: [1.7, 1, 0.55], t: BLANC, a: BLEU },
  pneu: { s: "roue", t: 0x2a2a2a },
  retroviseur: { s: "appareil", e: [0.9, 1.4, 0.5], t: NOIR },
  barre_metal: { s: "barre", t: 0x6b6862 },
  bache: { s: "chiffon", e: [1.5, 0.8, 1.2], t: BLEU },
  corde: { s: "bobine", e: [0.9, 1.5, 0.9], t: 0xb59a6a },
  // ---- Ferme, jardin ----
  beche: { s: "barre", e: [1, 1.5, 1.5], t: 0x7a5a3c },
  debroussailleuse: { s: "barre", e: [1.4, 1.6, 1.6], t: 0xe8743a },
  grillage_rouleau: { s: "cylindre", e: [7, 6, 6], t: 0x7a8a6a },
  lame_tondeuse: { s: "lame", e: [1.6, 0.8, 0.35], t: 0x6b6862 },
  nain_jardin: { s: "nain" },
  piquet_cloture: { s: "barre", e: [1.1, 2.5, 2.5], t: 0x7a5a3c },
  sac_engrais: { s: "coussin", e: [1.2, 1.3, 1.1], t: 0x5f7f45 },
  secateur: { s: "barre", e: [0.2, 1.5, 1.5], t: ROUGE },
  soc_charrue: { s: "lame", e: [1.5, 4, 1], t: ROUILLE },
  tuyau_arrosage: { s: "bobine", e: [1.4, 1.5, 1.4], t: 0x4a8a3a },
  // ---- Matières de base qui traînent aussi ----
  papier: { s: "plaque", e: [0.7, 3, 0.9], t: CREME },
  plastique: { s: "sac", e: 0.8, t: 0x5a8ab0 },
  verre: { s: "plaque", e: [0.5, 1, 0.5], t: 0xb8d8d0 },
  sapin_desodorisant: { s: "plaque", e: [0.3, 1, 0.45], t: 0x3a8a4a },
  stylo_ressort: { s: "barre", e: [0.14, 0.5, 0.5], t: BLEU },
  // ---- Le lot 1 (salle de bain, salon) ----
  plumeau: { s: "barre", e: [0.6, 2, 2], t: 0xd8a8c8 },
  // ---- La berge du gué (plan 0.8.2, chantier F) : ce que la rivière laisse, et le bout de ficelle ----
  branche: { s: "barre", e: [1.3, 2.2, 2.2], t: 0x8a7a64 },
  fibres: { s: "chiffon", e: [0.6, 0.5, 0.5], t: 0xb8a878 },
  plumes: { s: "plaque", e: [0.35, 1, 0.35], t: 0xf0ece0 },
  os: { s: "barre", e: [0.3, 1.4, 1.4], t: 0xe8dcc0 },
  ficelle: { s: "bobine", e: [0.5, 0.6, 0.5], t: 0xc8b088 },
};

/** Au sol, faute d'entrée : une boîte grise de la taille de son poids (un objet ajouté plus tard sans apparence). */
function repli(poids: number): ApparenceObjet {
  const e = Math.min(2, Math.max(0.4, Math.cbrt(poids) * 0.8));
  return { s: "boite", e, t: GRIS };
}

const ENCRE = "#3b2a1e";
const TEINTES_ICONE = new Map<string, number>();

/** La teinte de l'icône d'un objet : le premier aplat qui n'est ni l'encre ni « none ». */
export function teinteIcone(objet: TypeObjet): number | null {
  const deja = TEINTES_ICONE.get(objet);
  if (deja !== undefined) return deja;
  for (const m of icone(objet).matchAll(/fill="(#[0-9a-fA-F]{6})"/g)) {
    if (m[1]!.toLowerCase() === ENCRE) continue;
    const t = parseInt(m[1]!.slice(1), 16);
    TEINTES_ICONE.set(objet, t);
    return t;
  }
  return null;
}

/** L'apparence complète d'un objet : silhouette, échelle (× 1,15), teinte et détail. */
export function apparenceDe(objet: TypeObjet, poids: number): Required<Omit<ApparenceObjet, "e">> & { e: readonly [number, number, number] } {
  const a = APPARENCES[objet] ?? repli(poids);
  const e = typeof a.e === "number" ? [a.e, a.e, a.e] : (a.e ?? [1, 1, 1]);
  const t = a.t ?? teinteIcone(objet) ?? GRIS;
  return { s: a.s, e: [e[0]! * AGRANDISSEMENT, e[1]! * AGRANDISSEMENT, e[2]! * AGRANDISSEMENT], t, a: a.a ?? -1 };
}
