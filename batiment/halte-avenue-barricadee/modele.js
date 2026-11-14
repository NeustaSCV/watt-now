// Halte : l'avenue barricadée (route de la Ville, Book 20 §4).
//
// Le boulevard de la Prospérité, grande percée haussmannienne bordée d'immeubles de pierre, a été la dernière ligne
// de défense de la ville pendant la Grande Panne et la fièvre grise. Les habitants l'ont coupé de barricades civiles :
// à l'ouest, un mur de bus, de voitures empilées, de sommiers et de sacs de sable, qu'on ne franchit qu'en passant à
// l'intérieur d'un bus articulé ; à l'est, le point de contrôle sanitaire de la fièvre grise, son couloir de grillage
// et son sas de décontamination. Les portes cochères sont murées : la rue est le seul passage.
//
// Format halte (CONSIGNE-HALTES.md) : 200 × 70 m, quatre tronçons de 50 × 70 m mis bout à bout d'ouest en est. Tout est
// bâti dans le « repère de la halte » (origine au centre, +x à l'est, +z au sud) ; chaque tronçon ne construit que ce
// qui tombe dans sa bande de x, puis se recentre sur son lot (voir `recentrer`). Les immeubles ont leurs murs
// mitoyens exactement aux limites des tronçons : les raccords sont invisibles.
//
// Plan en travers (z, du nord au sud) :
//   −35 … −17   immeubles nord (rez-de-chaussée visitable par endroits, sur 9 m de profondeur), façade au sud
//   −17 … −12   trottoir nord
//   −12 … −4,5  chaussée nord
//   −4,5 … 4,5  terre-plein central planté de platanes
//    4,5 … 12   chaussée sud
//    12 … 17    trottoir sud
//    17 … 35    immeubles sud, façade au nord
//
// Les étages (inaccessibles) de chaque rangée forment une couche qui s'efface par tronçon : « etages-nord » quand on
// entre dans une boutique du nord, « etages-sud » dès qu'ils cachent le personnage. Les façades sont un atlas de
// cellules (une travée d'un étage = 3 × 3 m) : quelques centaines de triangles pour une rue entière.

import * as THREE from "three";
import { Batiment, Chantier, PALETTE, MAT, matiere, matiereMonde, matiereTexture, matiereVerre, matiereLueur, matiereEau, dessiner, aleatoire, mur, touffes, semerTouffes, gravats, debris, jonchee, mousse, arbuste, lierre, flaque } from "../commun/atelier.js";
import { AL, AH, R, FL, CELLULES, dessinerAtlas, dessinerFacades, dessinerAsphalte, dessinerStabilise } from "./textures.js";

// ---------- Le plan (repère de la halte) ----------

const Z = { fondN: -35, facN: -17, bordN: -12, tpN: -4.5, tpS: 4.5, bordS: 12, facS: 17, fondS: 35 };
const PROF = 9; // profondeur visitable des rez-de-chaussée
const Y0 = 4.5; // haut du rez-de-chaussée
const Y1 = 4.85; // bas du premier étage (au-dessus du bandeau)
const RANGS = {
  nord: { s: -1, zF: Z.facN, zB: Z.fondN, zI: Z.facN - PROF },
  sud: { s: 1, zF: Z.facS, zB: Z.fondS, zI: Z.facS + PROF },
};
const METRO = { x0: -58.6, x1: -53.4, z0: -1.4, z1: 1.4 };
const BUS_A = { x: -41, z: -3.5, porte: -9, sortie: 1.5 }; // le bus articulé qu'on traverse (porte à l'ouest, découpe à l'est)
const BUS_B = { x: -37.7, z: 11 }; // le bus brûlé (poste de guet)
const CONTROLE = { grille: 64, sasX1: 74.5, sasZ0: 5.4, sasZ1: 9.6, tente: { x0: 66, x1: 77, z0: -11.4, z1: -2.2 } };

const TRONCONS = [
  { id: "entree", nom: "L'entrée du boulevard", x: -75 },
  { id: "barricade", nom: "La grande barricade", x: -25 },
  { id: "coeur", nom: "Le cœur de l'avenue", x: 25 },
  { id: "controle", nom: "Le contrôle sanitaire", x: 75 },
];

/** Les immeubles : x0, x1, étages au-dessus du rez-de-chaussée, teinte de la pierre, et ce qui les distingue. */
const NORD = [
  { x0: -100, x1: -88, et: 5 },
  { x0: -88, x1: -73, et: 5, visite: "superette" },
  { x0: -73, x1: -62, et: 4, banderole: { r: "banRestez", etage: 3 } },
  { x0: -62, x1: -50, et: 5 },
  { x0: -50, x1: -38, et: 4 },
  { x0: -38, x1: -24, et: 5, visite: "cafe", banderole: { r: "banFaim", etage: 1 } },
  { x0: -24, x1: -12, et: 5 },
  { x0: -12, x1: 0, et: 4 },
  { x0: 0, x1: 12, et: 5 },
  { x0: 12, x1: 27, et: 5, visite: "pharmacie" },
  { x0: 27, x1: 38, et: 5, banderole: { r: "banVivants", etage: 1 }, lampe: 1 },
  { x0: 38, x1: 50, et: 4, chute: true },
  { x0: 50, x1: 62, et: 5 },
  { x0: 62, x1: 76, et: 4 },
  { x0: 76, x1: 88, et: 5, visite: "depot" },
  { x0: 88, x1: 100, et: 5, watty: true },
];
const SUD = [
  { x0: -100, x1: -88, et: 4 },
  { x0: -88, x1: -76, et: 5, visite: "hall" },
  { x0: -76, x1: -64, et: 5 },
  { x0: -64, x1: -50, et: 4 },
  { x0: -50, x1: -39, et: 5 },
  { x0: -39, x1: -27, et: 4, chute: true },
  { x0: -27, x1: -13, et: 5, visite: "boulangerie" },
  { x0: -13, x1: 0, et: 5 },
  { x0: 0, x1: 14, et: 4 },
  { x0: 14, x1: 26, et: 5 },
  { x0: 26, x1: 40, et: 5, visite: "banque" },
  { x0: 40, x1: 50, et: 4 },
  { x0: 50, x1: 63, et: 5 },
  { x0: 63, x1: 75, et: 4 },
  { x0: 75, x1: 88, et: 5 },
  { x0: 88, x1: 100, et: 4 },
];
const TEINTES_PIERRE = [0xe6dcc6, 0xdcd2bc, 0xe8e0cf, 0xd6ccb4, 0xe2d6bd, 0xd9d3c6];

const arr = (v) => Math.round(v * 10) / 10;

// ---------- La fiche ----------

const FOUILLE = [
  // L'entrée
  { x: -84, z: -24.5, quoi: "supérette : le fond d'un rayon (conserves cabossées, pâtes, sel)" },
  { x: -75.5, z: -19.6, quoi: "supérette : les caisses autonomes (écrans, lecteurs, piles du terminal)" },
  { x: -86.6, z: -21.5, quoi: "supérette : les frigos (eau gazeuse, sodas tièdes)" },
  { x: -64, z: -13.2, quoi: "kiosque : journaux (allume-feu), plans de la ville, briquets" },
  { x: -85.5, z: 20.4, quoi: "loge de la concierge : trousseau de clés, bougies, radio à piles" },
  { x: -81.5, z: 20.3, quoi: "boîtes aux lettres : colis jamais livrés (vêtements, petits appareils)" },
  { x: -80.9, z: 22.7, quoi: "barricade de l'escalier : planches, matelas, outils du gardien" },
  { x: -61.5, z: 13.8, quoi: "station Vélo+ : chambres à air, chaînes, dynamos des vélos verrouillés (à arracher)" },
  { x: -59.4, z: 0, quoi: "bouche de métro : sac abandonné contre la grille (lampe torche, carte)" },
  { x: -88, z: -6.2, quoi: "voiture abandonnée : boîte à gants, câbles, bidon" },
  // La grande barricade
  { x: -44.5, z: 13.6, quoi: "camion Miam Express : repas lyophilisés, sacs isothermes, batterie du hayon" },
  { x: -43.8, z: -15.2, quoi: "barricade nord : sommiers (ressorts), sacs de sable, planches" },
  { x: -40.6, z: -2, quoi: "dans le bus : trousse de secours, marteau brise-vitre, extincteur" },
  { x: -30.5, z: -1.2, quoi: "camp des survivants : réserve de bois, popote, couverture" },
  { x: -34, z: -24.2, quoi: "café-tabac : derrière le zinc (bouteilles, sucre, café moulu)" },
  { x: -25.6, z: -19.6, quoi: "café-tabac : présentoir du tabac (briquets, allumettes, jeux de grattage)" },
  { x: -21.8, z: 23.1, quoi: "boulangerie : le fournil (farine charançonnée, sel, levure sèche)" },
  { x: -17.5, z: 20.4, quoi: "boulangerie : le comptoir (caisse, sachets, plaques de cuisson)" },
  { x: -35.6, z: 9.4, quoi: "pied du poste de guet : jerricans, corde, caisse de bouteilles vides" },
  // Le cœur de l'avenue
  { x: 24.8, z: -24.4, quoi: "pharmacie : l'arrière-boutique (compresses, alcool, bandes)" },
  { x: 14.6, z: -24, quoi: "pharmacie : le PharmaBot éventré (quelques boîtes coincées dans le bras)" },
  { x: 19.5, z: -20.6, quoi: "pharmacie : tiroirs du comptoir (thermomètre, pansements)" },
  { x: 33, z: 24.6, quoi: "banque : la salle des coffres (des billets inutiles… et une montre)" },
  { x: 27.4, z: 15.8, quoi: "distributeurs éventrés : écrans, cartes électroniques, billets inutiles" },
  { x: 29.5, z: 22.2, quoi: "banque : les bureaux (calculatrices, lampe, câbles)" },
  { x: 10, z: -9, quoi: "drone de livraison écrasé : moteurs, hélices, petite batterie" },
  { x: 38, z: 6.5, quoi: "drone de livraison : un colis encore scellé (au hasard)" },
  { x: 45.5, z: -7, quoi: "scooter de livraison : coffre isotherme, batterie" },
  // Le contrôle sanitaire
  { x: 62.6, z: 9.1, quoi: "table du contrôle : thermomètres, masques, registre" },
  { x: 70, z: 8.6, quoi: "sas de décontamination : bidons de désinfectant, gants, combinaisons" },
  { x: 71.5, z: -9.6, quoi: "tente de quarantaine : couvertures, caisses de médicaments (presque vides)" },
  { x: 86.6, z: -22.5, quoi: "dépôt Miam Express : casiers connectés (des commandes jamais retirées)" },
  { x: 80, z: -22, quoi: "dépôt : rayonnages (conserves, eau, piles)" },
  { x: 81.5, z: -24.9, quoi: "dépôt : bornes de recharge des scooters (batteries, câbles)" },
  { x: 57, z: -6.2, quoi: "fourgon sanitaire : brancard, trousse, bouteille d'oxygène vide" },
];
const ETEINTS = [
  { x: -80, z: -2.6, type: "errant (entre les platanes)" },
  { x: -82.5, z: -21.5, type: "ancien habitant : le vigile de la supérette, gilet orange" },
  { x: -85, z: 19.2, type: "ancien habitant : la concierge, en robe de chambre (dans sa loge)" },
  { x: -60.5, z: 13, type: "ancien habitant : un livreur à vélo, veste fluo et sac isotherme" },
  { x: -68, z: 9.6, type: "rampant (sous la voiture de la chaussée sud)" },
  { x: -46.5, z: -6, type: "errant (le no man's land devant la barricade)" },
  { x: -43.6, z: 4, type: "putréfié (affalé contre le bus, côté ouest)" },
  { x: -40.6, z: -5.5, type: "rampant (sous les sièges du bus)" },
  { x: -31.5, z: -22, type: "ancien habitant : le patron du café, tablier noir" },
  { x: -16, z: 23.8, type: "ancien habitant : la boulangère, couverte de farine" },
  { x: 21.5, z: -23, type: "ancien habitant : le pharmacien, blouse blanche" },
  { x: 35, z: 21.8, type: "ancien habitant : le guichetier, cravate et badge" },
  { x: 12.5, z: -6.5, type: "errant (entre les drones écrasés)" },
  { x: 40.5, z: 9, type: "équipé : un ancien livreur casqué, blouson renforcé" },
  { x: 29, z: 14, type: "errant (trottoir de la banque)" },
  { x: 70.5, z: 7.4, type: "ancien habitant : un agent sanitaire en combinaison (dans le sas)" },
  { x: 72.5, z: -8.5, type: "putréfié (sur un lit de camp de la tente de quarantaine)" },
  { x: 68.5, z: -4.6, type: "putréfié (tente de quarantaine)" },
  { x: 82.5, z: -21.4, type: "errant (dans le dépôt)" },
  { x: 62.6, z: -3, type: "équipé : casque de chantier et gilet, contre le grillage" },
  { x: 91, z: 3, type: "errant (la sortie de l'avenue)" },
];
const ENTREES = [
  { x: -99.5, z: 8.2, nature: "entrée A : le boulevard, depuis le Comptoir de la Gare" },
  { x: -80.5, z: -17, nature: "supérette : les portes automatiques brisées" },
  { x: -74.5, z: -17, nature: "supérette : la vitrine défoncée" },
  { x: -80.5, z: 17, nature: "le 14, boulevard de la Prospérité : la porte cochère entrouverte (hall et loge)" },
  { x: -42.6, z: BUS_A.porte, nature: "la grande barricade : la porte arrière du bus articulé (côté ouest)" },
  { x: -39.4, z: BUS_A.sortie, nature: "la grande barricade : la découpe à la disqueuse dans le flanc du bus (côté est)" },
  { x: -33.8, z: -17, nature: "café-tabac : la porte du café" },
  { x: -25.4, z: -17, nature: "café-tabac : la porte du tabac" },
  { x: -20, z: 17, nature: "boulangerie : la porte" },
  { x: 19.5, z: -17, nature: "pharmacie : la porte (et la vitrine défoncée)" },
  { x: 33, z: 17, nature: "banque : la porte vitrée brisée" },
  { x: 55.5, z: 7.5, nature: "contrôle sanitaire : l'entrée du couloir de grillage" },
  { x: 74.5, z: 7.5, nature: "contrôle sanitaire : la sortie du sas de décontamination" },
  { x: 77, z: -6.5, nature: "la tente de quarantaine (rabat ouvert, côté est)" },
  { x: 80.5, z: -17, nature: "dépôt Miam Express : le rideau à moitié levé" },
  { x: 99.5, z: -8.2, nature: "sortie B : le boulevard, vers le centre-ville et l'hôpital" },
];

const dansTroncon = (t) => (p) => p.x >= t.x - 25 && (p.x < t.x + 25 || (t.x === 75 && p.x <= 100));
const versTroncon = (t, liste) => liste.filter(dansTroncon(t)).map((p) => ({ ...p, x: arr(p.x - t.x), z: arr(p.z) }));

const DESCRIPTIONS = {
  entree: "l'arrivée sur le boulevard : la supérette pillée, le kiosque, la colonne d'affichage, le hall du 14 et la loge de la concierge, la station Vélo+ et la bouche de métro condamnée",
  barricade: "la grande barricade (bus, voitures empilées, sommiers, sacs de sable, le camion Miam Express) qu'on ne franchit que par l'intérieur du bus articulé ; le camp des survivants, le café-tabac, la boulangerie",
  coeur: "le cœur de l'avenue : la pharmacie et sa croix verte qui clignote, la banque et ses distributeurs éventrés, les drones de livraison écrasés, la fenêtre éclairée des « 4 vivants »",
  controle: "le point de contrôle sanitaire de la fièvre grise : couloir de grillage, sas de décontamination, tente de quarantaine ; le dépôt Miam Express ; la sortie vers le centre-ville",
};
const DEPARTS = { entree: { x: -97, z: 8.2 }, barricade: { x: -48.5, z: 8 }, coeur: { x: 2, z: 8.2 }, controle: { x: 52, z: 7.5 } };

const CARTES = TRONCONS.map((t) => ({
  id: t.id,
  nom: t.nom,
  lot: { l: 50, p: 70 },
  decalage: { x: t.x, z: 0 },
  solPropre: true,
  depart: { x: arr(DEPARTS[t.id].x - t.x), z: DEPARTS[t.id].z },
  description: DESCRIPTIONS[t.id],
  entrees: versTroncon(t, ENTREES),
  fouille: versTroncon(t, FOUILLE),
  eteints: versTroncon(t, ETEINTS),
}));

export const FICHE = {
  id: "halte-avenue-barricadee",
  nom: "Halte · L'avenue barricadée",
  lieu: "Halte · route de la Ville · entre le moyen et le lointain",
  environnement: "ville",
  anneau: "moyen",
  danger: 3,
  halte: true,
  solPropre: true,
  recit:
    "Le boulevard de la Prospérité a tenu quarante et un jours : le temps que les livraisons « garanties en 10 minutes » s'arrêtent, que la préfecture placarde ses avis et que les voisins couchent des bus en travers de la chaussée. Derrière la barricade, on a fait la queue au contrôle de température, puis on n'a plus fait la queue du tout. Aujourd'hui on passe par le bus, on salue le guetteur, et on évite de lever les yeux vers la fenêtre éclairée du premier étage.",
  inspiration: "les grands boulevards haussmanniens (pierre de taille, balcons filants du 2e et du 5e, combles en zinc, platanes du terre-plein), les barricades civiles des sièges urbains, les points de contrôle sanitaires et leurs tentes blanches",
  reperes: [
    "La grande barricade : deux bus, des voitures empilées, des sommiers, des sacs de sable et le camion Miam Express encastré ; on ne passe que par l'intérieur du bus articulé (porte à l'ouest, découpe à la disqueuse à l'est)",
    "Le poste de guet sur le toit du bus brûlé, sa lanterne, et le feu des survivants sous la bâche, derrière la barricade",
    "Le point de contrôle sanitaire : couloir de grillage, borne thermique « 37,9 °C · accès refusé », sas de décontamination, tente de quarantaine et ses lits de camp",
    "Les façades continues : pierre de taille, balcons de fer forgé, persiennes, combles en zinc et lucarnes, souches de cheminées ; portes cochères murées ou barricadées",
    "Les banderoles aux fenêtres : « ON A FAIM », « ICI 4 VIVANTS » sous la seule fenêtre éclairée, « RESTEZ CHEZ VOUS »",
    "La pharmacie pillée et sa croix verte qui clignote encore sur batterie, son PharmaBot « Erreur 503 : santé momentanément indisponible »",
    "La banque Crédit Abondant : distributeurs éventrés, billets inutiles partout, la porte ronde de la salle des coffres grande ouverte",
    "Le café-tabac Le Narval et son comptoir en zinc, la boulangerie et son fournil, la supérette « Proxi-Tout » et ses caisses qui demandent de « scanner votre sourire »",
    "Le hall du 14 : boîtes aux lettres débordantes, loge de la concierge, escalier barricadé de meubles",
    "La bouche de métro condamnée (l'escalier descend dans le noir), le kiosque à journaux et sa une « La panne durera 48 h », la colonne d'affichage et l'avis de la préfecture",
    "L'Abondance : vélos Vélo+ Premium verrouillés « par abonnement », drones VitAir écrasés sur la chaussée, affiches « Restez chez vous, on vous livre ! » et « Livraison en 10 minutes garantie* (*hors fin du monde) »",
    "La nuit : le feu des survivants, la lanterne du guetteur, la lampe du premier étage, le néon vert de la pharmacie qui clignote, la lanterne et la borne du contrôle",
  ],
  lot: { l: 200, p: 70 },
  depart: DEPARTS.entree,
  goulets: [
    { x: BUS_A.x, z: BUS_A.z, nature: "la grande barricade : on ne la franchit qu'en traversant le bus articulé, sur dix mètres de couloir entre les sièges" },
    { x: 69, z: 7.5, nature: "le contrôle sanitaire : un couloir de grillage puis le sas de décontamination, seul passage dans la clôture" },
  ],
  panneaux: [
    { x: -95, z: 14.5, texte: "← Comptoir de la Gare · 3 km" },
    { x: -93, z: -16.6, texte: "Boulevard de la Prospérité (plaque de rue, 8e arrondissement)" },
    { x: 95, z: -14.5, texte: "Centre-ville · Hôpital · Toutes directions →" },
  ],
  cartes: CARTES,
};

// ---------- Couleurs ----------

const C = {
  asphalte: 0x55585a,
  trottoir: 0x6c6e6e,
  granite: 0x9c9a94,
  stabilise: 0xb8ad94,
  socle: 0x6e6a62,
  dalle: 0x857f74,
  blanc: 0xdedbd2,
  zinc: 0x7d8a92,
  zincClair: 0x95a1a8,
  pignon: 0xcdc3ad,
  brique: 0x9a5640,
  pot: 0xb0694a,
  fonte: 0x2f3d36, // vert sombre du mobilier de ville
  fer: 0x2a2826,
  pneu: 0x2a2928,
  bois: 0x7a5a3c,
  boisSombre: 0x4e3a2a,
  sable: 0xb4a27c,
  toileBlanche: 0xe2e0d8,
  bleuSanitaire: 0x2d5a8a,
  cremeBus: 0xd9d4c4,
  canard: 0x2f6f73,
  rouge: 0xb8352b,
  verreBouteille: 0x4f6b3a,
  enduit: 0xe8e1d0,
  faience: 0xe9e6dc,
};
const TEINTES_VOITURES = [0x7d8f9c, 0x9b3b33, 0xc9c5ba, 0x4c5a6b, 0x6b7b56, 0x8a7a63, 0x2f3a45, 0xb7a06a, 0x5d6b73, 0x8f4a3c];

// ---------- Matières (créées une fois, partagées) ----------

let MATS = null;
function matieres() {
  if (MATS) return MATS;
  const atlas = dessiner("avenue-atlas", AL, AH, dessinerAtlas, false);
  const facades = dessiner("avenue-facades", FL, FL, dessinerFacades, false);
  const asphalte = matiereTexture(dessiner("avenue-asphalte", 256, 256, dessinerAsphalte), { roughness: 0.95 });
  asphalte.userData.tuile = 6;
  const stabilise = matiereTexture(dessiner("avenue-stabilise", 256, 256, dessinerStabilise), { roughness: 1 });
  stabilise.userData.tuile = 5;
  const enseignes = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.8, alphaTest: 0.5, side: THREE.DoubleSide });
  const neon = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 1.2, vertexColors: true, roughness: 0.5, alphaTest: 0.5, side: THREE.DoubleSide });
  neon.userData.sansOmbre = true;
  const facade = new THREE.MeshStandardMaterial({ map: facades, vertexColors: true, roughness: 0.92 });
  MATS = {
    asphalte,
    stabilise,
    facade,
    pierre: matiereMonde("pierreTaille"),
    carrelage: matiereMonde("carrelage"),
    enseignes,
    neon,
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    mat: matiere(0.95, 0),
    satin: matiere(0.6, 0.05),
    lisse: matiere(0.3, 0.05),
    tole: matiere(0.75, 0.3),
    metal: matiere(0.4, 0.7),
    toile: MAT.toile(),
    lueur: matiereLueur(0xffb25a, 0.5),
    eau: matiereEau(0x3c4a44, 0.7),
  };
  return MATS;
}

// ---------- Petits outils ----------

const GEO = {};
function cyl(r, h, cotes = 8) {
  const cle = `c${r}|${h}|${cotes}`;
  if (!GEO[cle]) GEO[cle] = new THREE.CylinderGeometry(r, r, h, cotes);
  return GEO[cle];
}
const BOULE = new THREE.IcosahedronGeometry(1, 0);
const CONE = new THREE.ConeGeometry(1, 1, 6);
const ROUE = new THREE.CylinderGeometry(0.33, 0.33, 0.22, 8);

/** Les coordonnées de texture d'une région de l'atlas des enseignes. */
function uvAtlas([x, y, l, h]) {
  return [x / AL, 1 - (y + h) / AH, (x + l) / AL, 1 - y / AH];
}
/** Les coordonnées de texture d'une cellule de façade [colonne, ligne]. */
function uvCellule([c, l]) {
  const e = 0.6 / FL;
  return [c / 4 + e, 1 - (l + 1) / 4 + e, (c + 1) / 4 - e, 1 - l / 4 - e];
}

/** Un panneau plat dont l'image vient de l'atlas (région `r`), face vers +z local. */
function panneau(c, mat, r, pose, l, h, couleur = 0xffffff) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
  c.poser(g, mat, couleur, pose, { crasse: false, nuance: 0 });
  g.dispose();
}
/** Un panneau lisible des deux côtés (deux faces dos à dos). */
function panneauDouble(c, mat, r, pose, l, h, couleur = 0xffffff, ep = 0.006) {
  c.repere(pose, () => {
    panneau(c, mat, r, { z: ep }, l, h, couleur);
    panneau(c, mat, r, { z: -ep, ry: Math.PI }, l, h, couleur);
  });
}

/**
 * Des quadrilatères verticaux texturés (façades, garde-corps) en un seul maillage : `a` et `b` sont les pieds [x, z],
 * ordonnés de gauche à droite vus de l'extérieur ; uv = [u0, v0, u1, v1].
 */
function quads(liste) {
  const pos = [];
  const uv = [];
  for (const q of liste) {
    const [ax, az] = q.a;
    const [bx, bz] = q.b;
    const [u0, v0, u1, v1] = q.uv;
    const P = [[ax, q.y0, az], [bx, q.y0, bz], [bx, q.y1, bz], [ax, q.y1, az]];
    const T = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
    for (const i of [0, 1, 2, 0, 2, 3]) {
      pos.push(...P[i]);
      uv.push(...T[i]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}
/** Les pieds [a, b] d'une face qui regarde vers (nx, nz). */
function pieds(x1, z1, x2, z2, nx, nz) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  return -dz * nx + dx * nz > 0 ? [[x1, z1], [x2, z2]] : [[x2, z2], [x1, z1]];
}

/** Passe d'un repère local (x0, z0, ry) au repère de la halte. */
function versMonde(x0, z0, ry, lx, lz) {
  const co = Math.cos(ry);
  const si = Math.sin(ry);
  return [x0 + lx * co + lz * si, z0 - lx * si + lz * co];
}

/** Un rectangle infranchissable, éventuellement tourné. */
function rect(b, x, z, l, p, ry = 0, nature = "obstacle") {
  const pts = [[-l / 2, -p / 2], [l / 2, -p / 2], [l / 2, p / 2], [-l / 2, p / 2]].map(([u, v]) => versMonde(x, z, ry, u, v));
  for (let i = 0; i < 4; i++) {
    const [a1, b1] = pts[i];
    const [a2, b2] = pts[(i + 1) % 4];
    b.obstacle(a1, b1, a2, b2, nature);
  }
}

/** Un mur dont l'extérieur est du côté opposé au point (xi, zi) (l'atelier : +z local = extérieur). */
function murVers(c, a, b, xi, zi, spec) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const ry = -Math.atan2(dz, dx);
  const nx = Math.sin(ry);
  const nz = Math.cos(ry);
  const mx = (a[0] + b[0]) / 2;
  const mz = (a[1] + b[1]) / 2;
  if (nx * (xi - mx) + nz * (zi - mz) > 0) {
    // inverser : les ouvertures sont comptées depuis l'autre bout
    const L = Math.hypot(dx, dz);
    const ouv = (spec.ouvertures ?? []).map((o) => ({ ...o, u: L - o.u }));
    const br = (spec.breches ?? []).map((o) => ({ ...o, u: L - o.u }));
    mur(c, b, a, { ...spec, ouvertures: ouv, breches: br });
  } else mur(c, a, b, spec);
}

/** Les ouvertures d'un mur coupé à `yc` : la partie haute, recalée sur son propre bas. */
function ouverturesHautes(ouv, yc) {
  return ouv.filter((o) => o.haut > yc + 0.05).map((o) => ({ ...o, bas: Math.max(0, o.bas - yc), haut: o.haut - yc, type: o.type === "fenetre" ? "fenetre" : "vide" }));
}
function ouverturesBasses(ouv) {
  return ouv.map((o) => ({ ...o, type: "vide" }));
}

// ---------- Les immeubles ----------

function hauteurs(bat) {
  const yT = Y1 + 3 * bat.et;
  return { yT, yR0: yT + 0.45, yR1: yT + 0.45 + 2.9 };
}
function teinteDe(bat, rang) {
  const i = Math.abs(Math.round(bat.x0 * 7 + (rang === "nord" ? 3 : 11))) % TEINTES_PIERRE.length;
  return TEINTES_PIERRE[i];
}
function hachage(x, k) {
  return aleatoire(Math.abs(Math.round(x * 131 + k * 7919)) + 17);
}

/** Les étages, la corniche, les balcons, les combles en zinc d'un immeuble (dans la couche de sa rangée). */
function etages(ctx, rang, bat) {
  const { u } = ctx;
  const M = matieres();
  const h = rang === "nord" ? ctx.hautN : ctx.hautS;
  const { s, zF, zB } = RANGS[rang];
  const o = -s; // la façade sur rue regarde vers o (en z)
  const { x0, x1 } = bat;
  const { yT, yR0, yR1 } = hauteurs(bat);
  const W = x1 - x0;
  const n = Math.max(1, Math.round(W / 3));
  const w = W / n;
  const teinte = teinteDe(bat, rang);
  const al = hachage(x0, rang === "nord" ? 1 : 2);

  // Les cellules des façades (rue et cour)
  const liste = [];
  for (let k = 0; k < bat.et; k++) {
    const y0 = Y1 + 3 * k;
    for (let i = 0; i < n; i++) {
      const xa = x0 + i * w;
      const xb = xa + w;
      const r1 = al();
      const r2 = al();
      const abime = r1 < 0.18 + 0.4 * u;
      let cel;
      if (k === 1) cel = CELLULES.noble[abime ? (r2 < 0.5 ? 2 : 3) : r2 < 0.5 ? 0 : 1];
      else cel = CELLULES.courant[abime ? [2, 3, 4, 5, 6][Math.floor(r2 * 5)] : [0, 1, 7][Math.floor(r2 * 3)]];
      const [a, b] = pieds(xa, zF, xb, zF, 0, o);
      liste.push({ a, b, y0, y1: y0 + 3, uv: uvCellule(cel) });
      // côté cour : des fenêtres plus simples
      const r3 = al();
      const celB = r3 < 0.55 ? CELLULES.cour : r3 < 0.8 ? CELLULES.courFermee : CELLULES.nu;
      const [a2, b2] = pieds(xa, zB, xb, zB, 0, -o);
      liste.push({ a: a2, b: b2, y0, y1: y0 + 3, uv: uvCellule(celB) });
    }
  }
  const g = quads(liste);
  h.poser(g, M.facade, teinte, {}, { crasse: false, nuance: 0 });
  g.dispose();

  const pierre = teinte;
  const pierreSombre = new THREE.Color(teinte).multiplyScalar(0.86).getHex();
  // Le bandeau au-dessus des boutiques, la corniche, des deux côtés
  for (const [zf, oo] of [[zF, o], [zB, -o]]) {
    h.pave(x0, Y0, zf - oo * 0.1, x1, Y1, zf + oo * 0.32, pierreSombre, M.pierre, { crasse: false });
    h.pave(x0, yT, zf - oo * 0.1, x1, yT + 0.36, zf + oo * 0.45, pierre, M.pierre, { crasse: false });
    h.pave(x0, yT + 0.36, zf - oo * 0.1, x1, yT + 0.45, zf + oo * 0.6, pierreSombre, M.pierre, { crasse: false });
    // cordon sous les fenêtres du 1er étage
    h.pave(x0, Y1 + 3 - 0.08, zf - oo * 0.05, x1, Y1 + 3 + 0.06, zf + oo * 0.12, pierre, M.pierre, { crasse: false });
  }

  // Les balcons filants (2e et dernier étage), garde-corps en fer forgé, consoles
  const garde = [];
  const balcons = [...new Set([1, bat.et - 1])];
  const chute = bat.chute && u > 0.72 ? [Math.floor(n / 2) - 1, Math.floor(n / 2)] : [];
  for (const k of balcons) {
    const yk = Y1 + 3 * k;
    const casse = k === bat.et - 1 ? chute : [];
    const morceaux = [];
    let debut = 0;
    for (let i = 0; i <= n; i++) {
      if (i === n || casse.includes(i)) {
        if (i > debut) morceaux.push([debut, i]);
        debut = i + 1;
      }
    }
    for (const [i0, i1] of morceaux) {
      const xa = x0 + i0 * w + (i0 === 0 ? 0.2 : 0);
      const xb = x0 + i1 * w - (i1 === n ? 0.2 : 0);
      h.pave(xa, yk - 0.12, zF, xb, yk + 0.06, zF + o * 0.85, pierre, M.pierre, { crasse: false });
      for (let i = i0; i < i1; i++) {
        const ga = x0 + i * w + (i === 0 ? 0.2 : 0);
        const gb = x0 + (i + 1) * w - (i === n - 1 ? 0.2 : 0);
        const [a, b] = pieds(ga, zF + o * 0.8, gb, zF + o * 0.8, 0, o);
        garde.push({ a, b, y0: yk + 0.06, y1: yk + 1.06, uv: uvAtlas(R.garde) });
      }
      for (const xc of [xa, xb]) {
        const [a, b] = pieds(xc, zF, xc, zF + o * 0.8, xc === xa ? -1 : 1, 0);
        garde.push({ a, b, y0: yk + 0.06, y1: yk + 1.06, uv: uvAtlas([R.garde[0], R.garde[1], 64, R.garde[3]]) });
      }
      for (let i = i0; i <= i1; i++) {
        const xc = Math.min(xb - 0.2, Math.max(xa + 0.2, x0 + i * w));
        h.pave(xc - 0.09, yk - 0.5, zF, xc + 0.09, yk - 0.12, zF + o * 0.6, pierreSombre, M.pierre, { crasse: false });
      }
    }
    if (casse.length) {
      // le morceau de balcon tombé, en travers du trottoir (gravats)
      const xm = x0 + (casse[0] + 1) * w;
      gravats(ctx.c, xm, zF + o * 2.2, 1.6, 12, [pierre, pierreSombre, 0xb9b2a2]);
      ctx.c.boite(w * 1.6, 0.18, 0.85, pierre, { x: xm, y: 0.35, z: zF + o * 2.6, rz: 0.25, ry: 0.12 }, M.pierre);
      // le garde-corps tordu qui pend encore
      h.repere({ x: xm, y: yk + 0.06, z: zF + o * 0.85, rx: o * 1.2 }, () => panneau(h, M.enseignes, R.garde, { y: -0.5 }, w * 1.5, 1.0));
    }
  }
  if (garde.length) {
    const gg = quads(garde);
    h.poser(gg, M.enseignes, 0xffffff, {}, { crasse: false, nuance: 0 });
    gg.dispose();
  }

  // Les combles en zinc : brisis (pente raide) avec lucarnes, terrasson presque plat
  const d = 1.3;
  const L = Math.hypot(d, yR1 - yR0);
  for (const [zf, oo] of [[zF, o], [zB, -o]]) {
    const dedans = -oo;
    h.boite(W, 0.12, L, C.zinc, { x: (x0 + x1) / 2, y: (yR0 + yR1) / 2, z: zf + dedans * (d / 2 + 0.05), rx: Math.atan2(yR1 - yR0, -dedans * d) }, M.tole, { crasse: false, nuance: 0.03 });
    // les lucarnes
    for (let i = 0; i < n; i++) {
      const ra = al();
      if (ra > 0.8) continue;
      const xc = x0 + (i + 0.5) * w;
      const zf2 = zf + dedans * 0.5;
      const yb = yR0 + 0.25;
      h.boite(1.3, 1.85, 1.25, ra < 0.5 ? C.zincClair : pierre, { x: xc, y: yb + 0.92, z: zf2 + dedans * 0.62 }, ra < 0.5 ? M.tole : M.pierre, { crasse: false });
      h.boite(0.95, 0.95, 1.4, C.zinc, { x: xc, y: yb + 1.85, z: zf2 + dedans * 0.62, rz: Math.PI / 4 }, M.tole, { crasse: false });
      const [a, b] = pieds(xc - 0.58, zf2 - dedans * 0.01, xc + 0.58, zf2 - dedans * 0.01, 0, oo);
      const gl = quads([{ a, b, y0: yb + 0.05, y1: yb + 1.75, uv: uvCellule(CELLULES.lucarne) }]);
      h.poser(gl, M.facade, teinte, {}, { crasse: false, nuance: 0 });
      gl.dispose();
    }
  }
  const zt0 = zF - o * d;
  const zt1 = zB + o * d;
  h.pave(x0, yR1 - 0.08, zt0, x1, yR1 + 0.04, zt1, 0x76828a, M.tole, { crasse: false, nuance: 0.02 });
  // les tasseaux du zinc, de la rue à la cour
  for (let x = x0 + 0.45; x < x1 - 0.2; x += 0.9) h.pave(x - 0.03, yR1 + 0.04, zt0, x + 0.03, yR1 + 0.1, zt1, 0x8e9aa2, M.tole, { crasse: false, nuance: 0 });
  // le faîtage, les châssis de toit, une antenne
  h.pave(x0, yR1 + 0.04, (zt0 + zt1) / 2 - 0.12, x1, yR1 + 0.2, (zt0 + zt1) / 2 + 0.12, 0x9aa6ac, M.tole, { crasse: false });
  for (let i = 0; i < n; i += 2) {
    const xc = x0 + (i + 0.5) * w;
    const zc = (zt0 + zt1) / 2 + (i % 4 ? 2.5 : -2.5);
    h.boite(0.9, 0.18, 1.2, 0x3a4248, { x: xc, y: yR1 + 0.12, z: zc }, M.tole, { crasse: false });
    h.boite(0.75, 0.04, 1.05, 0x22282c, { x: xc, y: yR1 + 0.22, z: zc }, M.tole, { crasse: false });
  }
  if (al() < 0.6) {
    const xa = x0 + W * (0.3 + 0.4 * al());
    h.tube([xa, yR1, (zt0 + zt1) / 2], [xa, yR1 + 2.6, (zt0 + zt1) / 2], 0.03, 0x8e9599, M.tole, 4);
    for (let k = 0; k < 3; k++) h.boite(1.2 - k * 0.3, 0.03, 0.03, 0x8e9599, { x: xa, y: yR1 + 1.6 + k * 0.4, z: (zt0 + zt1) / 2 }, M.tole, { crasse: false });
  }

  // Les banderoles peintes sur des draps, accrochées au garde-corps
  if (bat.banderole) {
    const k = bat.banderole.etage;
    const yk = Y1 + 3 * k;
    const xm = (x0 + x1) / 2;
    h.repere({ x: xm, y: yk + 0.55, z: zF + o * 0.9, ry: o > 0 ? 0 : Math.PI, rx: 0.06 }, () => panneau(h, M.enseignes, R[bat.banderole.r], { y: -0.45 }, 5.2, 1.4));
  }
  // La lampe d'une fenêtre du premier étage : on devine des vivants
  if (bat.lampe !== undefined) {
    const i = bat.lampe;
    const xc = x0 + (i + 0.5) * w;
    h.repere({ x: xc, y: Y1 + 0.08 + 1.2, z: zF + o * 0.02, ry: o > 0 ? 0 : Math.PI }, () => panneau(h, M.neon, R.fenetreLumiere, {}, 1.12, 2.3));
    ctx.b.lumiere(xc, Y1 + 1.4, zF + o * 1.2, 0xffc070, 3, 9, "lampe à une fenêtre du premier étage : on devine des vivants");
  }
}

/** Les murs mitoyens qui dépassent des toits, leurs souches de cheminée, et les pignons aux bouts de chaque tronçon. */
function mitoyens(ctx, rang) {
  const { c } = ctx;
  const M = matieres();
  const h = rang === "nord" ? ctx.hautN : ctx.hautS;
  const { s, zF, zB } = RANGS[rang];
  const toutes = rang === "nord" ? NORD : SUD;
  const bornes = [...new Set(toutes.flatMap((b) => [b.x0, b.x1]))].filter((x) => x >= ctx.x0 - 0.01 && x <= ctx.x1 + 0.01);
  for (const xb of bornes) {
    const gauche = toutes.find((b) => Math.abs(b.x1 - xb) < 0.01);
    const droite = toutes.find((b) => Math.abs(b.x0 - xb) < 0.01);
    const ouest = Math.abs(xb - ctx.x0) < 0.01;
    const est = Math.abs(xb - ctx.x1) < 0.01;
    const xa = est ? xb - 0.22 : xb - (ouest ? 0 : 0.22);
    const xe = ouest ? xb + 0.22 : xb + (est ? 0 : 0.22);
    const hs = [gauche, droite].filter(Boolean).map(hauteurs);
    const yTop = Math.max(...hs.map((k) => k.yR0));
    const yToit = Math.max(...hs.map((k) => k.yR1)) + 0.45;
    h.pave(xa, Y0, zF, xe, yTop, zB, C.pignon, M.pierre, { crasse: false });
    h.pave(xa, yTop, zF + s * 1.25, xe, yToit, zB - s * 1.25, C.pignon, M.pierre, { crasse: false });
    h.pave(xa - 0.05, yToit, zF + s * 1.2, xe + 0.05, yToit + 0.1, zB - s * 1.2, 0x9c9486, M.pierre, { crasse: false });
    // Les rez-de-chaussée sont fermés aux bouts de chaque tronçon
    if (ouest || est) c.pave(xa, 0, zF - s * 0.0, xe, Y0, zB, C.pignon, M.pierre, { crasse: false });
    // Les souches de cheminée (une seule fois par mur, dans le tronçon à l'est de la borne, ou au bout de la halte)
    if (!est || xb >= 99.9) {
      for (const zc of [zF + s * 4.2, zB - s * 4.2]) {
        h.pave(xb - 0.3, yToit, zc - 0.75, xb + 0.3, yToit + 1.5, zc + 0.75, C.brique, M.mat, { crasse: false });
        h.pave(xb - 0.36, yToit + 1.5, zc - 0.8, xb + 0.36, yToit + 1.62, zc + 0.8, 0x8a7a6a, M.mat, { crasse: false });
        for (let k = 0; k < 3; k++) h.poser(cyl(0.11, 0.55, 6), M.mat, C.pot, { x: xb, y: yToit + 1.9, z: zc - 0.5 + k * 0.5 }, { crasse: false });
      }
    }
    // La vieille réclame peinte de Watty, sur le pignon du bout de la halte
    if (est && xb >= 99.9 && gauche?.watty) {
      const { yR0 } = hauteurs(gauche);
      h.repere({ x: xb + 0.03, y: Y0 + (yR0 - Y0) / 2 + 1, z: (zF + zB) / 2, ry: Math.PI / 2 }, () => panneau(h, M.enseignes, R.watty, {}, 8, 10.5));
    }
  }
}

/** Le rez-de-chaussée d'un immeuble non visitable : rideaux baissés, portes cochères murées, socle et plafond. */
function rdcFerme(ctx, rang, bat, bande = null) {
  const { c, b, u } = ctx;
  const M = matieres();
  const { s, zF, zB } = RANGS[rang];
  const o = -s;
  const { x0, x1 } = bat;
  const W = x1 - x0;
  const n = Math.max(1, Math.round(W / 3));
  const w = W / n;
  const teinte = new THREE.Color(teinteDe(bat, rang)).multiplyScalar(0.94).getHex();
  const al = hachage(x0, rang === "nord" ? 5 : 6);
  const ouv = [];
  const panneaux = [];
  const cochere = Math.floor(n / 2);
  for (let i = 0; i < n; i++) {
    const xc = x0 + (i + 0.5) * w;
    const r = al();
    if (i === cochere) {
      ouv.push({ x: xc, l: 2.7, bas: 0, haut: 3.9, type: "vide" });
      panneaux.push({ x: xc, r: r < 0.5 ? R.cochere : R.parpaings, l: 2.7, h: 3.9 });
    } else if (r < 0.62) {
      ouv.push({ x: xc, l: Math.min(2.6, w - 0.5), bas: 0, haut: 3.3, type: "vide" });
      panneaux.push({ x: xc, r: r < 0.2 ? R.rideau2 : R.rideau, l: Math.min(2.6, w - 0.5), h: 3.3, rideau: true });
    } else {
      ouv.push({ x: xc, l: 1.3, bas: 1.0, haut: 3.2, type: "fenetre", bris: 0.4 + 0.5 * u, croisillons: 1, traverses: 3, cadre: 0xd8d2c2 });
      panneaux.push({ x: xc, fond: true, l: 1.3, h: 2.2 });
    }
  }
  const [a, bb] = pieds(x0, zF, x1, zF, 0, o);
  const ouvU = ouv.map((q) => ({ ...q, u: Math.abs(q.x - a[0]) }));
  mur(c, a, bb, { h: Y0, ep: 0.45, couleur: teinte, mat: M.pierre, ouvertures: ouvU });
  b.obstacle(x0, zF + o * 0.25, x1, zF + o * 0.25, "façade");
  for (const p of panneaux) {
    if (p.fond) {
      c.pave(p.x - 0.7, 1.0, zF - o * 0.2, p.x + 0.7, 3.2, zF - o * 0.3, 0x1c1e1f, M.mat, { crasse: false });
      // barreaux
      for (let k = 0; k < 5; k++) c.boite(0.03, 2.1, 0.03, C.fer, { x: p.x - 0.5 + k * 0.25, y: 2.1, z: zF + o * 0.24 }, M.metal);
      continue;
    }
    c.repere({ x: p.x, y: p.h / 2, z: zF + o * 0.02, ry: o > 0 ? 0 : Math.PI }, () => panneau(c, M.enseignes, p.r, {}, p.l, p.h));
    if (p.rideau) c.pave(p.x - p.l / 2 - 0.1, p.h, zF + o * 0.05, p.x + p.l / 2 + 0.1, p.h + 0.35, zF + o * 0.3, 0x6e7476, M.tole, { crasse: false });
  }
  // Le fond (côté cour) et le plafond, sauf la bande laissée à la couche (voir `rangee`)
  const [a2, b2] = pieds(x0, zB, x1, zB, 0, -o);
  mur(c, a2, b2, { h: Y0, ep: 0.45, couleur: teinte, mat: M.pierre });
  const px0 = bande ? Math.max(x0, bande[1]) : x0;
  if (px0 < x1) c.pave(px0, Y0 - 0.08, zF, x1, Y0, zB, C.socle, M.mat, { crasse: false });
  if (bande && bande[1] > x0) ctx[rang === "nord" ? "hautN" : "hautS"].pave(x0, Y0 - 0.08, zF, Math.min(x1, bande[1]), Y0, zB, C.socle, M.mat, { crasse: false });
  // lierre et touffes au pied
  if (u > 0.45 && al() < 0.5) lierre(c, x0 + W * al(), 0, zF + o * 0.25, o > 0 ? 0 : Math.PI, 2.5, 3 + 2 * u, Math.round(30 * u));
  semerTouffes(c, x0, zF + o * 0.3, x1, zF + o * 0.6, Math.round(4 + 8 * u), PALETTE.herbeSeche);
}

/**
 * Une boutique visitable : la façade (coupée à hauteur d'allège quand elle regarde la caméra), les murs, le sol, le
 * plafond du reste de l'immeuble, l'enseigne. Renvoie le rectangle intérieur.
 */
function boutique(ctx, rang, bat, spec) {
  const { c, b, u } = ctx;
  const M = matieres();
  const h = rang === "nord" ? ctx.hautN : ctx.hautS;
  const { s, zF, zB, zI } = RANGS[rang];
  const o = -s;
  const { x0, x1 } = bat;
  const W = x1 - x0;
  const n = Math.max(1, Math.round(W / 3));
  const w = W / n;
  const teinte = new THREE.Color(teinteDe(bat, rang)).multiplyScalar(0.94).getHex();
  const int = { couleur: spec.mur ?? C.enduit, mat: spec.matMur ?? M.mat };
  // Les ouvertures de la façade
  const ouv = [];
  const panneaux = [];
  for (let i = 0; i < n; i++) {
    const xc = x0 + (i + 0.5) * w;
    const type = spec.baies[i] ?? "vitrine";
    if (type === "porte") ouv.push({ x: xc, l: 1.6, bas: 0, haut: 2.8, type: "vide" });
    else if (type === "defoncee") ouv.push({ x: xc, l: Math.min(2.5, w - 0.4), bas: 0, haut: 3.4, type: "vide" });
    else if (type === "vitrine") ouv.push({ x: xc, l: Math.min(2.5, w - 0.4), bas: 0.55, haut: 3.4, type: "vide", vitrine: true });
    else if (type === "cochere") ouv.push({ x: xc, l: 2.8, bas: 0, haut: 3.9, type: "vide" });
    else if (type === "fenetre") ouv.push({ x: xc, l: 1.3, bas: 1.0, haut: 3.0, type: "fenetre", bris: 0.4 + 0.5 * u, croisillons: 1, traverses: 3, cadre: 0x5a4130, rideau: 0xc9b89a });
    else if (type === "dab") ouv.push({ x: xc, l: 1.1, bas: 0.8, haut: 2.1, type: "vide", dab: true });
    else if (type === "rideau" || type === "rideauLeve") {
      ouv.push({ x: xc, l: Math.min(2.6, w - 0.4), bas: 0, haut: 3.3, type: "vide" });
      panneaux.push({ x: xc, l: Math.min(2.6, w - 0.4), leve: type === "rideauLeve" });
    }
  }
  const [a, bb] = pieds(x0, zF, x1, zF, 0, o);
  const ouvU = ouv.map((q) => ({ ...q, u: Math.abs(q.x - a[0]) }));
  const coupeFace = rang === "nord"; // la façade sur rue regarde la caméra : coupée à l'allège
  const yc = 1.2;
  if (coupeFace) {
    mur(c, a, bb, { h: yc, ep: 0.45, couleur: teinte, mat: M.pierre, ouvertures: ouverturesBasses(ouvU), batiment: b, interieur: int });
    mur(h, a, bb, { h: Y0 - yc, y0: yc, ep: 0.45, couleur: teinte, mat: M.pierre, ouvertures: ouverturesHautes(ouvU, yc), interieur: int });
  } else mur(c, a, bb, { h: Y0, ep: 0.45, couleur: teinte, mat: M.pierre, ouvertures: ouvU, batiment: b, interieur: int });
  // Garnir les ouvertures : éclats des vitrines, rideaux, distributeurs
  for (const q of ouv) {
    if (q.vitrine) {
      const k = coupeFace ? h : c;
      k.pave(q.x - q.l / 2, 0.5, zF - 0.06, q.x + q.l / 2, 0.58, zF + 0.06, 0x3a3020, M.satin);
      k.pave(q.x - q.l / 2, 3.34, zF - 0.06, q.x + q.l / 2, 3.42, zF + 0.06, 0x3a3020, M.satin);
      // des éclats plantés dans le cadre
      for (let e = 0; e < 3; e++) {
        const g = new THREE.BufferGeometry();
        const xe = q.x - q.l / 2 + (e === 2 ? q.l : 0);
        const ye = e === 1 ? 3.34 : 0.58;
        const sx = e === 2 ? -1 : 1;
        const sy = e === 1 ? -1 : 1;
        g.setAttribute("position", new THREE.Float32BufferAttribute([xe, ye, zF, xe + sx * 0.7, ye, zF, xe, ye + sy * 0.9, zF], 3));
        g.computeVertexNormals();
        (e === 1 && coupeFace ? h : c).poser(g, M.verre, 0xffffff, {}, { crasse: false, nuance: 0 });
      }
    }
    if (q.dab) {
      c.pave(q.x - 0.5, 0.8, zF - o * 0.3, q.x + 0.5, 2.1, zF + o * 0.05, 0x3a3d40, M.tole);
      c.repere({ x: q.x, y: 1.65, z: zF + o * 0.06, ry: o > 0 ? 0 : Math.PI }, () => panneau(c, M.enseignes, R.dab, {}, 0.95, 0.5));
      // la façade du distributeur arrachée, au sol
      c.boite(0.9, 0.05, 0.6, 0x4a4d50, { x: q.x + 0.3, y: 0.08, z: zF + o * 1.0, ry: 0.4, rx: 0.1 }, M.tole);
    }
  }
  for (const p of panneaux) {
    const hh = p.leve ? 1.3 : 3.3;
    const yb = p.leve ? 2.0 : 0;
    const k = coupeFace && p.leve ? h : c;
    k.repere({ x: p.x, y: yb + hh / 2, z: zF + o * 0.02, ry: o > 0 ? 0 : Math.PI }, () => panneau(k, M.enseignes, [R.rideau[0], R.rideau[1], R.rideau[2], p.leve ? 100 : R.rideau[3]], {}, p.l, hh));
    if (!p.leve) b.obstacle(p.x - p.l / 2, zF + o * 0.1, p.x + p.l / 2, zF + o * 0.1, "rideau baissé");
  }
  // L'enseigne en bandeau au-dessus des baies
  if (spec.enseigne) {
    const k = coupeFace ? h : c;
    const lg = Math.min(W - 1.5, 8);
    k.pave(x0 + W / 2 - lg / 2 - 0.1, 3.55, zF + o * 0.22, x0 + W / 2 + lg / 2 + 0.1, 4.35, zF + o * 0.3, spec.couleurEnseigne ?? 0x2a2826, M.satin);
    k.repere({ x: x0 + W / 2, y: 3.95, z: zF + o * 0.31, ry: o > 0 ? 0 : Math.PI }, () => panneau(k, M.enseignes, spec.enseigne, {}, lg, 0.72));
  }
  // Les murs : fond (côté intérieur de l'îlot), ouest, est
  const xi = (x0 + x1) / 2;
  const zm = (zF + zI) / 2;
  const coupeFond = rang === "sud"; // le fond sud regarde la caméra
  const ep = 0.3;
  if (coupeFond) {
    murVers(c, [x0, zI], [x1, zI], xi, zm, { h: yc, ep, couleur: teinte, mat: M.pierre, batiment: b, interieur: int, ouvertures: spec.ouvFond ?? [] });
    murVers(h, [x0, zI], [x1, zI], xi, zm, { h: Y0 - yc, y0: yc, ep, couleur: teinte, mat: M.pierre, interieur: int, ouvertures: ouverturesHautes(spec.ouvFond ?? [], yc) });
  } else murVers(c, [x0, zI], [x1, zI], xi, zm, { h: Y0, ep, couleur: teinte, mat: M.pierre, batiment: b, interieur: int, ouvertures: spec.ouvFond ?? [] });
  murVers(c, [x0 + ep / 2, zF], [x0 + ep / 2, zI], xi, zm, { h: Y0, ep, couleur: teinte, mat: M.pierre, batiment: b, interieur: int });
  murVers(c, [x1 - ep / 2, zF], [x1 - ep / 2, zI], xi, zm, { h: yc, ep, couleur: teinte, mat: M.pierre, batiment: b, interieur: int });
  murVers(h, [x1 - ep / 2, zF], [x1 - ep / 2, zI], xi, zm, { h: Y0 - yc, y0: yc, ep, couleur: teinte, mat: M.pierre, interieur: int });
  // Le sol
  c.pave(x0 + 0.1, 0, zF - o * 0.2, x1 - 0.1, 0.04, zI + o * 0.15, spec.sol ?? 0xd8d2c4, spec.matSol ?? M.carrelage, { crasse: false, nuance: 0 });
  // Le reste de l'immeuble (côté cour) : mur de fond et plafond ; au sud, ce plafond passe dans la couche
  const [a2, b2] = pieds(x0, zB, x1, zB, 0, -o);
  mur(c, a2, b2, { h: Y0, ep: 0.45, couleur: teinte, mat: M.pierre });
  (coupeFond ? h : c).pave(x0, Y0 - 0.08, zI, x1, Y0, zB, C.socle, M.mat, { crasse: false });
  // Un plafond intérieur dans la couche (on le voit d'en haut quand elle est là)
  h.pave(x0, Y0 - 0.06, zF, x1, Y0, zI, C.socle, M.mat, { crasse: false });
  // Débris, papiers, plâtre tombé
  debris(c, x0 + 0.6, Math.min(zF, zI) + 0.6, x1 - 0.6, Math.max(zF, zI) - 0.6, Math.round(14 + 30 * u), [0xeeeae2, 0xd8d2c0, 0xb8b2a2], 0.05);
  if (u > 0.55) gravats(c, x0 + W * 0.7, zF + s * (PROF * 0.65), 0.9, 8, [0xe2dccd, 0xc8c0ae, 0x9a9488], 0.05);
  return { x0: x0 + ep, x1: x1 - ep, zF: zF + s * 0.25, zI: zI - s * 0.15, s, o };
}

/** Une rangée d'immeubles dans le tronçon. */
function rangee(ctx, rang) {
  const toutes = rang === "nord" ? NORD : SUD;
  const liste = toutes.filter((b) => b.x0 >= ctx.x0 - 0.01 && b.x1 <= ctx.x1 + 0.01);
  // Au sud, le plafond du voisin est d'un immeuble visitable passe dans la couche (sinon il cache la boutique).
  const bandes = new Map();
  if (rang === "sud") for (const b of liste) if (b.visite) {
    const voisin = liste.find((k) => Math.abs(k.x0 - b.x1) < 0.01);
    if (voisin) bandes.set(voisin, [voisin.x0, voisin.x0 + 4.6]);
  }
  for (const b of liste) {
    etages(ctx, rang, b);
    if (b.visite) INTERIEURS[b.visite](ctx, rang, b);
    else rdcFerme(ctx, rang, b, bandes.get(b) ?? null);
  }
  mitoyens(ctx, rang);
}

// ---------- Les intérieurs ----------

/** Une étagère murale ou une gondole : montants, tablettes, quelques produits (de moins en moins avec l'usure). */
function etagere(c, u, x, z, l, p, h, ry, couleur, produits, mat) {
  const M = matieres();
  c.repere({ x, z, ry }, () => {
    c.boite(l, h, 0.05, couleur, { y: h / 2, z: -p / 2 + 0.03 }, mat ?? M.satin);
    for (const sx of [-1, 1]) c.boite(0.05, h, p, couleur, { x: sx * (l / 2 - 0.03), y: h / 2 }, mat ?? M.satin);
    const nt = Math.max(2, Math.round(h / 0.45));
    for (let k = 0; k < nt; k++) {
      const y = 0.12 + (k * (h - 0.2)) / (nt - 1);
      c.boite(l - 0.06, 0.03, p, couleur, { y }, mat ?? M.satin);
      if (!produits) continue;
      const nb = Math.round((1 - u * 0.75) * l * 2.2 * c.hasard());
      for (let i = 0; i < nb; i++) c.boite(0.12 + c.hasard() * 0.12, 0.14 + c.hasard() * 0.16, 0.14, produits[Math.floor(c.hasard() * produits.length)], { x: -l / 2 + 0.15 + c.hasard() * (l - 0.3), y: y + 0.1, z: c.entre(-p / 4, p / 4) }, M.satin, { crasse: false, nuance: 0.1 });
    }
  });
}

function chaiseBistrot(c, x, z, ry, tombee = false) {
  const M = matieres();
  c.repere(tombee ? { x, y: 0.22, z, ry, rz: Math.PI / 2 } : { x, z, ry }, () => {
    c.boite(0.42, 0.04, 0.42, 0x6a4a30, { y: 0.46 }, M.satin);
    c.boite(0.42, 0.42, 0.04, 0x6a4a30, { y: 0.7, z: -0.2, rx: -0.12 }, M.satin);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.boite(0.03, 0.46, 0.03, 0x2a2826, { x: sx * 0.18, y: 0.23, z: sz * 0.18 }, M.metal);
  });
}
function tableBistrot(c, x, z, renversee = false) {
  const M = matieres();
  c.repere(renversee ? { x, y: 0.36, z, rz: Math.PI / 2 - 0.15 } : { x, z }, () => {
    c.poser(cyl(0.36, 0.04, 10), M.lisse, 0xd9d4c4, { y: 0.74 }, { crasse: false });
    c.poser(cyl(0.035, 0.72, 6), M.metal, 0x2a2826, { y: 0.37 }, { crasse: false });
    c.poser(cyl(0.22, 0.03, 8), M.metal, 0x2a2826, { y: 0.02 }, { crasse: false });
  });
}

const INTERIEURS = {
  superette(ctx, rang, bat) {
    const { c, b, u } = ctx;
    const M = matieres();
    const r = boutique(ctx, rang, bat, { baies: ["vitrine", "vitrine", "porte", "vitrine", "defoncee"], enseigne: R.superette, couleurEnseigne: 0x8a2a22, sol: 0xdedad0 });
    const produits = [0xc8362b, 0xc79a3b, 0x2f6f73, 0xe0d6c0, 0x4c6a9a, 0x7aa04a];
    // Les gondoles, perpendiculaires à la façade
    for (const x of [-85.6, -82.6, -78.2]) {
      etagere(c, u, x, -21.6, 4.2, 0.9, 1.6, Math.PI / 2, 0xe8e6e0, produits);
      rect(b, x, -21.6, 0.9, 4.2, 0, "gondole");
    }
    // Les frigos du fond (portes vitrées, noir dedans)
    c.pave(-87.6, 0.15, -25.7, -79.5, 1.95, -25.0, 0x1c2022, M.mat, { crasse: false });
    c.pave(-87.6, 0, -25.7, -79.5, 0.15, -24.9, 0xe8e6e0, M.satin);
    c.pave(-87.6, 1.95, -25.7, -79.5, 2.2, -24.9, 0xe8e6e0, M.satin);
    for (let i = 0; i < 5; i++) {
      const x = -87.6 + i * 1.62;
      c.pave(x, 0.15, -25.0, x + 0.08, 1.95, -24.92, 0xe8e6e0, M.satin);
      if (i !== 2 || u < 0.3) c.boite(1.5, 1.78, 0.03, 0xffffff, { x: x + 0.81, y: 1.05, z: -24.94 }, M.verre, { crasse: false });
      for (let k = 0; k < 3; k++) for (let j = 0; j < Math.round(4 * (1 - u * 0.8)); j++) c.poser(cyl(0.04, 0.26, 6), M.lisse, [0x8fb5d0, 0xc8362b, 0x7aa04a][j % 3], { x: x + 0.3 + j * 0.3, y: 0.42 + k * 0.55, z: -25.3 }, { crasse: false });
    }
    if (u > 0.3) c.boite(1.5, 1.8, 0.04, 0xffffff, { x: -84.2, y: 0.4, z: -23.6, rx: -1.35, ry: 0.2 }, M.verre, { crasse: false });
    b.obstacle(-87.6, -24.9, -79.5, -24.9, "frigos");
    // Les caisses autonomes : « scannez votre sourire »
    for (const x of [-76.3, -74.6]) {
      c.repere({ x, z: -20, ry: Math.PI }, () => {
        c.boite(0.7, 0.95, 0.6, 0xd8d6cf, { y: 0.48 }, M.satin);
        c.boite(0.55, 0.42, 0.06, 0x1d2433, { y: 1.3, z: 0.1, rx: -0.3 }, M.lisse);
        panneau(c, M.enseignes, R.caisse, { y: 1.3, z: 0.14, rx: -0.3 }, 0.5, 0.25);
        c.boite(0.05, 0.4, 0.05, 0x8e9599, { y: 1.05, z: 0.1 }, M.metal);
      });
      rect(b, x, -20, 0.7, 0.6, 0, "caisse autonome");
    }
    // Des caddies renversés, des cartons, des produits au sol
    for (const [x, z, ry, couche] of [[-81, -18.6, 0.5, true], [-76.8, -23.4, 2.2, false]]) {
      c.repere(couche ? { x, y: 0.42, z, ry, rx: Math.PI / 2 } : { x, z, ry }, () => {
        c.boite(0.9, 0.5, 0.55, 0x9aa0a3, { y: 0.75 }, M.metal);
        c.boite(0.86, 0.04, 0.5, 0x7d8285, { y: 0.48 }, M.metal);
        for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.boite(0.03, 0.45, 0.03, 0x8e9599, { x: sx * 0.38, y: 0.24, z: sz * 0.22 }, M.metal);
      });
    }
    jonchee(c, -87, -24.5, -74, -18, Math.round(20 + 40 * u), produits, 0.06);
    for (let i = 0; i < 5; i++) c.boite(0.5, 0.35, 0.4, 0xb8a27a, { x: c.entre(-80, -76), y: 0.2, z: c.entre(-25, -23), ry: c.hasard() * 3, rz: c.entre(-0.3, 0.3) }, M.mat, { nuance: 0.1 });
  },

  cafe(ctx, rang, bat) {
    const { c, b, u } = ctx;
    const M = matieres();
    const r = boutique(ctx, rang, bat, { baies: ["vitrine", "porte", "vitrine", "vitrine", "porte"], enseigne: R.cafe, couleurEnseigne: 0x1f3a33, sol: 0xcfc6b4, mur: 0xd8c7a4 });
    // Le comptoir en zinc, en L, et le bar derrière
    const zc = -23.2;
    c.pave(-37.6, 0, zc - 0.35, -31.4, 1.05, zc + 0.35, 0x5a3a26, M.satin);
    c.pave(-37.7, 1.05, zc - 0.42, -31.3, 1.12, zc + 0.45, 0xb8bcbe, M.metal);
    c.pave(-31.4, 0, zc - 0.35, -30.7, 1.05, zc + 1.6, 0x5a3a26, M.satin);
    c.pave(-31.5, 1.05, zc - 0.42, -30.6, 1.12, zc + 1.68, 0xb8bcbe, M.metal);
    rect(b, -34.5, zc, 6.2, 0.7, 0, "comptoir");
    b.obstacle(-31.05, zc + 0.35, -31.05, zc + 1.6, "comptoir");
    // percolateur et tireuse
    c.boite(0.7, 0.45, 0.4, 0xc8c8c4, { x: -36.4, y: 1.35, z: zc }, M.metal);
    c.poser(cyl(0.09, 0.2, 8), M.metal, 0xb59048, { x: -36.6, y: 1.67, z: zc }, { crasse: false });
    c.poser(cyl(0.09, 0.2, 8), M.metal, 0xb59048, { x: -36.2, y: 1.67, z: zc }, { crasse: false });
    for (let k = 0; k < 3; k++) c.tube([-33.5 + k * 0.25, 1.12, zc - 0.1], [-33.5 + k * 0.25, 1.55, zc - 0.1], 0.025, 0xb59048, M.metal, 5);
    // Le fond du bar : miroir, étagères de bouteilles
    c.boite(5.8, 1.2, 0.03, 0xffffff, { x: -34.6, y: 2.2, z: -25.62 }, M.verre, { crasse: false });
    for (const y of [1.3, 1.65, 3.0]) {
      c.pave(-37.5, y, -25.65, -31.6, y + 0.04, -25.35, 0x5a3a26, M.satin);
      const nb = Math.round(16 * (1 - 0.7 * u));
      for (let i = 0; i < nb; i++) c.poser(cyl(0.04, 0.3, 6), M.lisse, [C.verreBouteille, 0x8a5a2a, 0xd8d0b0, 0x6a2a2a][i % 4], { x: -37.3 + c.hasard() * 5.6, y: y + 0.19, z: -25.5 }, { crasse: false });
    }
    // Les tables et les chaises, certaines renversées
    for (const [x, z, renv] of [[-29.5, -19.2, false], [-27.2, -21.2, u > 0.4], [-29.2, -23.6, false], [-26.4, -24.2, false], [-35.8, -19.6, u > 0.6]]) {
      tableBistrot(c, x, z, renv);
      if (!renv) rect(b, x, z, 0.6, 0.6, 0, "table");
      chaiseBistrot(c, x - 0.6, z + 0.1, Math.PI / 2 + 0.2, c.hasard() < u * 0.5);
      chaiseBistrot(c, x + 0.55, z - 0.1, -Math.PI / 2 - 0.3, c.hasard() < u * 0.5);
    }
    // La banquette de moleskine le long du mur est
    c.pave(-25.1, 0, -25.4, -24.4, 0.45, -18.2, PALETTE.velours, M.satin);
    c.pave(-24.6, 0.45, -25.4, -24.35, 1.15, -18.2, PALETTE.velours, M.satin);
    b.obstacle(-25.1, -25.4, -25.1, -18.2, "banquette");
    // Le coin tabac : présentoir, jeux de grattage
    c.pave(-27.8, 0, -18.5, -26.6, 1.0, -17.7, 0x5a3a26, M.satin);
    c.repere({ x: -27.2, y: 1.6, z: -18.42 }, () => panneau(c, M.enseignes, R.grattage, {}, 1.0, 0.66));
    jonchee(c, -28, -18.8, -24.8, -17.5, 14, [0x6a2a8a, 0xf2d26a, 0xe9e4d6, 0xc8362b], 0.06);
    // La lampe-tempête sur le zinc (les survivants y passent la soirée)
    c.poser(cyl(0.09, 0.22, 8), M.metal, 0xc8362b, { x: -32.6, y: 1.24, z: zc }, { crasse: false });
    c.poser(cyl(0.07, 0.14, 8), M.lueur, 0xffffff, { x: -32.6, y: 1.42, z: zc }, { crasse: false, nuance: 0 });
    ctx.b.lumiere(-32.6, 1.6, zc + 0.6, 0xffc880, 2.5, 7, "lampe-tempête sur le zinc du café");
    // La carotte du tabac (perpendiculaire à la façade) et la terrasse empilée sur le trottoir
    c.boite(0.06, 0.06, 0.8, C.fer, { x: -24.4, y: 4.0, z: -16.5 }, M.metal);
    c.repere({ x: -24.4, y: 3.5, z: -16.1, ry: Math.PI / 2 }, () => {
      c.boite(0.9, 0.9, 0.12, C.rouge, { rz: Math.PI / 4 }, M.satin);
      panneauDouble(c, M.enseignes, R.tabac, {}, 0.95, 0.95, 0xffffff, 0.065);
    });
    for (const [x, z] of [[-35.5, -15.4], [-29, -15.2]]) {
      tableBistrot(c, x, z, false);
      for (let k = 0; k < 3; k++) chaiseBistrot(c, x + 0.8, z + 0.0, Math.PI / 2, false);
      rect(b, x, z, 0.7, 0.7, 0, "terrasse");
    }
    chaiseBistrot(c, -32, -14.6, 0.9, true);
    // Le mot à la craie sur la façade
    c.repere({ x: -29.5, y: 1.85, z: -16.74 }, () => panneau(c, M.enseignes, R.craie2, {}, 2.6, 0.98));
  },

  pharmacie(ctx, rang, bat) {
    const { c, b, u } = ctx;
    const M = matieres();
    boutique(ctx, rang, bat, { baies: ["vitrine", "vitrine", "porte", "defoncee", "vitrine"], enseigne: R.pharmacie, couleurEnseigne: 0xe8e2d2, sol: 0xe6e4dc, mur: 0xeef0ea });
    const produits = [0xe9e6dc, 0x58a06a, 0x4c6a9a, 0xd8c8a8, 0xc8362b];
    // Les comptoirs (deux îlots)
    for (const [xa, xb] of [[15.0, 18.4], [20.7, 24.0]]) {
      c.pave(xa, 0, -21.9, xb, 1.0, -21.1, 0xeeeeea, M.lisse);
      c.pave(xa - 0.05, 1.0, -21.95, xb + 0.05, 1.05, -21.05, 0x58a06a, M.lisse);
      b.obstacle(xa, -21.5, xb, -21.5, "comptoir");
    }
    // tiroirs tirés, boîtes au sol
    for (let i = 0; i < 6; i++) c.boite(0.4, 0.15, 0.35, 0xeeeeea, { x: 15.6 + i * 1.4, y: 0.5 + (i % 2) * 0.25, z: -21.0 + c.entre(-0.1, 0.25), ry: c.entre(-0.3, 0.3) }, M.lisse);
    // Les rayonnages muraux
    etagere(c, u, 12.6, -22.4, 3.4, 0.5, 2.3, Math.PI / 2, 0xeeeeea, produits);
    b.obstacle(12.85, -24.1, 12.85, -20.7, "rayonnage");
    etagere(c, u, 21.5, -25.35, 3.2, 0.5, 2.3, 0, 0xeeeeea, produits);
    // La cloison de l'arrière-boutique
    murVers(c, [23.3, -25.7], [23.3, -22.6], 25, -24, { h: 2.7, ep: 0.12, couleur: 0xeef0ea, mat: M.mat, batiment: b, ouvertures: [{ u: 2.2, l: 1.0, bas: 0, haut: 2.2, type: "vide" }] });
    murVers(c, [23.3, -22.6], [26.7, -22.6], 25, -24, { h: 2.7, ep: 0.12, couleur: 0xeef0ea, mat: M.mat, batiment: b });
    etagere(c, u, 25.2, -25.4, 2.4, 0.45, 2.0, 0, 0xc8c2b0, [0xe9e6dc, 0xd8c8a8, 0x9aa0a3]);
    for (let i = 0; i < 4; i++) c.boite(0.45, 0.32, 0.35, 0xb8a27a, { x: 24.2 + c.hasard() * 2, y: 0.17, z: -23.6 + c.hasard() * 0.8, ry: c.hasard() * 3 }, M.mat, { nuance: 0.1 });
    // Le PharmaBot : une armoire robot, son bras tombé
    c.pave(13.2, 0, -25.6, 16.4, 2.6, -24.5, 0xe0e4e0, M.satin);
    c.repere({ x: 14.8, y: 1.55, z: -24.48 }, () => panneau(c, M.enseignes, R.pharmabot, {}, 1.5, 0.75));
    c.poutre([16.0, 2.0, -24.4], [16.6, 0.9, -23.6], 0.12, 0xd8dcd8, M.satin);
    c.poutre([16.6, 0.9, -23.6], [16.3, 0.1, -23.0], 0.1, 0xd8dcd8, M.satin);
    rect(b, 14.8, -25.05, 3.2, 1.1, 0, "PharmaBot");
    jonchee(c, 13.5, -24.3, 17.5, -22.3, Math.round(20 + 30 * u), produits, 0.06);
    // La croix verte, perpendiculaire à la façade, qui clignote sur batterie (objet animé)
    croixVerte(ctx, 26.4, 3.7, -16.0);
    c.boite(0.06, 0.06, 0.9, C.fer, { x: 26.4, y: 4.45, z: -16.4 }, M.metal);
    ctx.b.lumiere(26.4, 3.6, -15.2, 0x58e07a, 3.5, 10, "néon vert de la pharmacie, qui clignote sur batterie");
  },

  depot(ctx, rang, bat) {
    const { c, b, u } = ctx;
    const M = matieres();
    boutique(ctx, rang, bat, { baies: ["rideau", "rideauLeve", "rideau", "rideau"], enseigne: R.depot, couleurEnseigne: C.canard, sol: 0xb8b6ae, matSol: M.mat, mur: 0xd8dad6 });
    // Les rayonnages métalliques et leurs caisses de plastique
    for (const z of [-23.6, -20.9]) {
      const x0 = 77.0;
      const x1 = 84.0;
      for (let x = x0; x <= x1 + 0.01; x += 1.75) c.boite(0.08, 2.4, 0.08, 0x2f6f73, { x, y: 1.2, z: z - 0.45 }, M.tole), c.boite(0.08, 2.4, 0.08, 0x2f6f73, { x, y: 1.2, z: z + 0.45 }, M.tole);
      for (const y of [0.15, 0.95, 1.75]) {
        c.pave(x0, y, z - 0.5, x1, y + 0.05, z + 0.5, 0xc79a3b, M.tole);
        const nb = Math.round(9 * (1 - 0.6 * u));
        for (let i = 0; i < nb; i++) c.boite(0.55, 0.32, 0.4, [C.canard, 0xc8362b, 0xe8e6e0][i % 3], { x: x0 + 0.4 + c.hasard() * (x1 - x0 - 0.8), y: y + 0.21, z: z + c.entre(-0.2, 0.2) }, M.satin, { crasse: false, nuance: 0.06 });
      }
      rect(b, (x0 + x1) / 2, z, x1 - x0, 1.0, 0, "rayonnage");
    }
    // Le mur de casiers connectés
    c.pave(86.9, 0, -25.5, 87.6, 2.4, -19.0, 0xd9dcd8, M.satin);
    c.repere({ x: 86.88, y: 1.4, z: -22.25, ry: -Math.PI / 2 }, () => panneau(c, M.enseignes, R.casiers, {}, 6.2, 2.0));
    b.obstacle(86.9, -25.5, 86.9, -19.0, "casiers");
    ctx.b.lumiere(86.4, 1.6, -22.3, 0x6fc8ff, 1.8, 5, "une diode des casiers connectés, qui clignote encore");
    // Les scooters de livraison à la borne de recharge
    for (let i = 0; i < 3; i++) scooterLivraison(c, 77.4 + i * 1.1, -25.0, Math.PI / 2, false);
    c.pave(76.6, 0, -25.7, 80.6, 1.2, -25.5, 0x3a3d40, M.tole);
    rect(b, 78.6, -25.0, 4, 1.2, 0, "scooters");
    jonchee(c, 77, -25, 86, -18, Math.round(16 + 30 * u), [C.canard, 0xc8362b, 0xe8e6e0, 0xb8a27a], 0.06);
  },

  hall(ctx, rang, bat) {
    const { c, b, u } = ctx;
    const M = matieres();
    boutique(ctx, rang, bat, { baies: ["fenetre", "fenetre", "cochere", "fenetre"], sol: 0xd8d0c0, mur: 0xd9cdb2 });
    // Le vantail de la porte cochère, entrouvert vers l'intérieur
    c.repere({ x: -79.1, z: 17.25, ry: 2.0 }, () => {
      c.boite(1.4, 3.85, 0.1, 0x33503f, { x: 0.7, y: 1.95 }, M.satin);
      c.boite(1.1, 1.4, 0.04, 0x2a4434, { x: 0.7, y: 2.7, z: 0.06 }, M.satin);
    });
    // La loge de la concierge : cloisons, guichet vitré, porte
    const cl = { h: 2.4, ep: 0.14, couleur: 0xd9cdb2, mat: M.mat, batiment: b };
    murVers(c, [-82.2, 17.3], [-82.2, 22.4], -85, 20, { ...cl, ouvertures: [{ u: 1.8, l: 1.2, bas: 1.0, haut: 2.0, type: "fenetre", bris: 0.3 + 0.4 * u, croisillons: 1, traverses: 1, cadre: 0x5a4130 }, { u: 4.2, l: 0.9, bas: 0, haut: 2.15, type: "vide" }] });
    murVers(c, [-87.7, 22.4], [-82.2, 22.4], -85, 20, { ...cl });
    // dans la loge : table, chaise, télé, lit, tableau des clés, la bougie
    c.boite(1.0, 0.75, 0.7, 0x6a4a30, { x: -84.6, y: 0.38, z: 19.4 }, M.satin);
    rect(b, -84.6, 19.4, 1.0, 0.7, 0, "table");
    chaiseBistrot(c, -84.0, 20.2, 0.4, false);
    c.boite(0.5, 0.4, 0.4, 0x2a2826, { x: -87.2, y: 0.95, z: 19.0 }, M.lisse);
    c.boite(0.6, 0.75, 0.45, 0x5a4130, { x: -87.2, y: 0.38, z: 19.0 }, M.satin);
    c.pave(-87.6, 0, 20.4, -85.6, 0.5, 22.2, 0x8a7a63, M.mat);
    c.pave(-87.6, 0.5, 20.6, -86.0, 0.6, 22.2, 0x7a2630, MAT.toile(), { crasse: false });
    rect(b, -86.6, 21.3, 2.0, 1.8, 0, "lit");
    c.boite(0.6, 0.5, 0.04, 0x8a6a40, { x: -83.8, y: 1.7, z: 22.3 }, M.satin);
    for (let i = 0; i < 6; i++) c.boite(0.03, 0.08, 0.02, 0xb59048, { x: -84.0 + (i % 3) * 0.18, y: 1.6 + Math.floor(i / 3) * 0.2, z: 22.27 }, M.metal);
    c.poser(cyl(0.035, 0.1, 6), M.lisse, 0xeee8d8, { x: -84.4, y: 0.8, z: 19.3 }, { crasse: false });
    c.poser(cyl(0.025, 0.06, 6), M.lueur, 0xffffff, { x: -84.4, y: 0.88, z: 19.3 }, { crasse: false, nuance: 0 });
    ctx.b.lumiere(-84.4, 1.1, 19.3, 0xffb060, 2, 5, "une bougie dans la loge de la concierge");
    // Le passage cocher, les boîtes aux lettres, le local à poubelles
    murVers(c, [-78.9, 17.3], [-78.9, 22.4], -80.5, 20, { ...cl, ouvertures: [{ u: 4.0, l: 1.0, bas: 0, haut: 2.15, type: "vide" }] });
    c.repere({ x: -82.12, y: 1.45, z: 20.35, ry: Math.PI / 2 }, () => panneau(c, M.enseignes, R.boites, {}, 1.2, 0.95));
    jonchee(c, -82, 19.2, -80.6, 21.2, 18, [0xf2efe6, 0xe0d6c0, 0xc8362b, 0x2f6f73], 0.06);
    for (let i = 0; i < 4; i++) c.boite(0.45, 0.3, 0.35, 0xb8a27a, { x: -79.8 + c.entre(-0.3, 0.3), y: 0.16 + (i % 2) * 0.3, z: 20.8 + c.entre(-0.5, 0.5), ry: c.hasard() * 3 }, M.mat, { nuance: 0.1 });
    for (let i = 0; i < 2; i++) {
      c.poser(cyl(0.3, 0.95, 8), M.satin, 0x3f5a3a, { x: -77.4 + i * 0.7, y: 0.48, z: 18.2 }, {});
      c.poser(cyl(0.32, 0.06, 8), M.satin, 0x2f4a2a, { x: -77.4 + i * 0.7, y: 0.98, z: 18.2 }, {});
    }
    // L'escalier, barricadé de meubles : les étages sont aux vivants qui s'y terrent
    for (let k = 0; k < 8; k++) c.pave(-80.6 + k * 0.32, 0, 22.9, -80.6 + (k + 1) * 0.32, 0.18 * (k + 1), 25.5, 0xb8a888, M.pierre, { crasse: false });
    c.tube([-80.6, 1.0, 22.85], [-78.0, 2.4, 22.85], 0.03, 0x5a3a26, M.satin, 5);
    c.boite(1.0, 2.0, 0.55, 0x5a4130, { x: -78.6, y: 1.6, z: 24.2, ry: 0.15 }, M.satin);
    c.boite(1.8, 0.2, 1.3, 0xd8cfc0, { x: -79.6, y: 1.2, z: 24.0, rz: 0.7, ry: 0.3 }, MAT.toile());
    chaiseBistrot(c, -79.4, 23.4, 1.0, true);
    c.boite(1.4, 0.06, 0.25, C.bois, { x: -79.0, y: 1.1, z: 23.0, rz: 0.4 }, M.mat);
    rect(b, -79.2, 24.2, 3.0, 2.6, 0, "escalier barricadé");
    gravats(c, -77.2, 24.6, 0.8, 7, [0xe2dccd, 0xc8c0ae, 0x9a9488], 0.05);
  },

  boulangerie(ctx, rang, bat) {
    const { c, b, u } = ctx;
    const M = matieres();
    boutique(ctx, rang, bat, { baies: ["vitrine", "vitrine", "porte", "vitrine", "vitrine"], enseigne: R.boulangerie, couleurEnseigne: 0x5a2e26, sol: 0xc8b8a0, mur: C.faience, matMur: M.carrelage });
    // La devanture en bois peint (côté rue)
    for (let i = 0; i <= 5; i++) c.pave(-27 + i * 2.8 - 0.12, 0, 16.6, -27 + i * 2.8 + 0.12, 3.5, 16.72, 0x5a2e26, M.satin);
    // Le comptoir vitré
    c.pave(-25.8, 0, 19.3, -20.9, 0.95, 19.9, 0xd8c8a8, M.satin);
    c.pave(-19.1, 0, 19.3, -14.2, 0.95, 19.9, 0xd8c8a8, M.satin);
    c.boite(4.9, 0.35, 0.55, 0xffffff, { x: -23.35, y: 1.13, z: 19.6 }, M.verre, { crasse: false });
    c.boite(4.9, 0.35, 0.55, 0xffffff, { x: -16.65, y: 1.13, z: 19.6 }, M.verre, { crasse: false });
    b.obstacle(-25.8, 19.6, -20.9, 19.6, "comptoir");
    b.obstacle(-19.1, 19.6, -14.2, 19.6, "comptoir");
    c.boite(0.4, 0.3, 0.35, 0x3a3d40, { x: -18.6, y: 1.1, z: 19.6 }, M.lisse);
    // Le mur aux corbeilles (vides) derrière le comptoir
    for (let k = 0; k < 2; k++) {
      c.pave(-26.4, 1.2 + k * 0.6, 21.9, -14.6, 1.24 + k * 0.6, 22.3, 0x7a5a3c, M.satin);
      for (let i = 0; i < 8; i++) c.boite(0.5, 0.18, 0.32, 0xb08f55, { x: -25.8 + i * 1.5, y: 1.36 + k * 0.6, z: 22.1, rz: c.entre(-0.1, 0.1) }, M.mat, { nuance: 0.1 });
    }
    // La cloison du fournil
    murVers(c, [-26.7, 22.6], [-13.3, 22.6], -20, 20, { h: 2.9, ep: 0.14, couleur: C.faience, mat: M.carrelage, batiment: b, ouvertures: [{ u: 10.7, l: 1.0, bas: 0, haut: 2.2, type: "vide" }] });
    // Le fournil : le four en briques, le pétrin, les sacs de farine, le chariot à plaques
    c.pave(-26.6, 0, 23.4, -22.4, 2.2, 25.7, PALETTE.brique, M.pierre);
    c.pave(-25.4, 0.7, 23.36, -23.6, 1.2, 23.42, 0x1a1614, M.mat, { crasse: false });
    c.pave(-26.6, 2.2, 23.3, -22.4, 2.3, 25.7, 0x5a5048, M.pierre);
    rect(b, -24.5, 24.55, 4.2, 2.3, 0, "four");
    c.poser(cyl(0.45, 0.5, 10), M.metal, 0xc8c8c4, { x: -20.6, y: 0.85, z: 24.6 }, {});
    c.boite(0.6, 0.6, 0.5, 0x8a9094, { x: -20.6, y: 0.3, z: 24.6 }, M.tole);
    rect(b, -20.6, 24.6, 1.0, 1.0, 0, "pétrin");
    for (let i = 0; i < 6; i++) c.boite(0.55, 0.28, 0.85, 0xeee8d8, { x: -16.8 + (i % 3) * 0.6, y: 0.14 + Math.floor(i / 3) * 0.28, z: 24.9, ry: c.entre(-0.2, 0.2) }, M.mat, { nuance: 0.05 });
    c.boite(0.6, 0.12, 0.9, 0xeee8d8, { x: -18.4, y: 0.06, z: 24.0, ry: 0.7 }, M.mat);
    c.pave(-19.4, 0.002, 23.4, -17.4, 0.06, 24.8, 0xf2efe6, M.mat, { crasse: false });
    c.pave(-14.8, 0, 23.2, -14.0, 1.8, 24.0, 0x9aa0a3, M.metal);
    for (let k = 0; k < 6; k++) c.pave(-14.75, 0.2 + k * 0.27, 23.25, -14.05, 0.22 + k * 0.27, 23.95, 0x5a5a58, M.metal);
    rect(b, -16.2, 24.9, 2.2, 1.2, 0, "sacs de farine");
  },

  banque(ctx, rang, bat) {
    const { c, b, u } = ctx;
    const M = matieres();
    boutique(ctx, rang, bat, { baies: ["dab", "fenetre", "porte", "fenetre", "dab"], enseigne: R.banque, couleurEnseigne: 0x24344d, sol: 0xd8d0c4, mur: 0xe2dccc });
    // Les guichets : comptoir, vitres de sécurité, le portillon ouvert
    c.pave(26.4, 0, 20.6, 37.0, 1.05, 21.2, 0x6a4a30, M.satin);
    c.pave(26.3, 1.05, 20.55, 37.1, 1.1, 21.25, 0x2a2826, M.lisse);
    for (let i = 0; i < 5; i++) if (c.hasard() > 0.35 * u) c.boite(2.0, 1.1, 0.03, 0xffffff, { x: 27.5 + i * 2.15, y: 1.65, z: 20.9 }, M.verre, { crasse: false });
    b.obstacle(26.4, 20.9, 37.0, 20.9, "guichets");
    c.boite(1.0, 0.95, 0.06, 0x6a4a30, { x: 37.7, y: 0.5, z: 21.4, ry: 1.2 }, M.satin);
    // Les bureaux derrière les guichets
    for (const x of [28.4, 32.4]) {
      c.boite(1.4, 0.75, 0.7, 0x5a4130, { x, y: 0.38, z: 22.3 }, M.satin);
      c.boite(0.45, 0.35, 0.05, 0x1d2433, { x, y: 0.95, z: 22.45 }, M.lisse);
      chaiseBistrot(c, x + 0.2, 21.6, Math.PI, c.hasard() < u * 0.6);
      rect(b, x, 22.3, 1.4, 0.7, 0, "bureau");
    }
    // Le conseiller virtuel, toujours souriant
    c.repere({ x: 26.6, y: 1.4, z: 18.8, ry: Math.PI / 2 }, () => {
      c.boite(0.8, 2.4, 0.15, 0x24344d, { y: -0.2, z: -0.08 }, M.satin);
      panneau(c, M.enseignes, R.conseiller, { y: 0.1 }, 0.75, 0.75);
    });
    // La salle des coffres : cloison, la porte ronde ouverte, les coffres individuels, les billets
    murVers(c, [26.3, 23.4], [39.7, 23.4], 33, 21, { h: 3.2, ep: 0.4, couleur: 0x9a9690, mat: M.pierre, batiment: b, ouvertures: [{ u: 6.7, l: 1.7, bas: 0, haut: 2.3, type: "vide" }] });
    c.repere({ x: 33.85, y: 1.15, z: 23.2, ry: -1.9 }, () => {
      c.poser(new THREE.CylinderGeometry(1.05, 1.05, 0.45, 14), M.metal, 0xa8acae, { x: 1.05, rx: Math.PI / 2 }, {});
      c.poser(new THREE.TorusGeometry(0.35, 0.05, 4, 8), M.metal, 0xc8c8c4, { x: 1.05, z: -0.3 }, {});
      for (let k = 0; k < 4; k++) c.boite(0.08, 0.08, 0.3, 0xc8c8c4, { x: 1.05 + Math.cos(k * 1.57) * 0.75, y: Math.sin(k * 1.57) * 0.75, z: 0.3 }, M.metal);
    });
    c.pave(26.5, 0, 25.2, 39.5, 2.4, 25.7, 0x8e9599, M.metal);
    for (let i = 0; i < 18; i++) for (let k = 0; k < 4; k++) {
      const ouvert = c.hasard() < 0.3 + 0.3 * u;
      c.boite(0.62, 0.45, 0.03, ouvert ? 0x2a2c2e : 0xb8bcbe, { x: 27.0 + i * 0.7, y: 0.4 + k * 0.52, z: 25.18 }, M.metal);
    }
    b.obstacle(26.5, 25.2, 39.5, 25.2, "coffres");
    // Les billets inutiles, partout
    const billets = [0x8fb59a, 0xc8b88a, 0x9ab0c8, 0xd8a890];
    for (let i = 0; i < Math.round(60 + 80 * u); i++) {
      const dedans = i % 3 !== 0;
      const x = dedans ? c.entre(27, 39) : c.entre(26.2, 39.8);
      const z = dedans ? c.entre(i % 2 ? 23.8 : 18, i % 2 ? 25 : 20.4) : c.entre(14.5, 16.6);
      c.boite(0.15, 0.004, 0.07, billets[i % 4], { x, y: 0.05, z, ry: c.hasard() * 3 }, M.mat, { crasse: false, nuance: 0.08 });
    }
    // La veilleuse de l'alarme, sur sa batterie
    c.boite(0.12, 0.12, 0.06, 0xffffff, { x: 33, y: 3.3, z: 23.62 }, M.lueur, { crasse: false });
    ctx.b.lumiere(33, 3.2, 22.6, 0xff4a3a, 1.5, 5, "veilleuse rouge de l'alarme de la banque, sur batterie");
  },
};

/** La croix verte de la pharmacie : un objet à part, qui clignote (néon sur batterie fatiguée). */
let MAT_CROIX = null;
function croixVerte(ctx, x, y, z) {
  const M = matieres();
  if (!MAT_CROIX) {
    MAT_CROIX = M.neon.clone();
    MAT_CROIX.userData = { sansOmbre: true };
  }
  const ch = new Chantier(5);
  ch.boite(1.1, 1.1, 0.14, 0x1a2a1e, {}, M.tole);
  panneauDouble(ch, MAT_CROIX, R.croix, {}, 1.0, 1.0, 0xffffff, 0.075);
  const pivot = new THREE.Group();
  pivot.position.set(x, y, z);
  pivot.rotation.y = Math.PI / 2;
  pivot.add(ch.construire());
  pivot.userData.animer = (t) => {
    // Une batterie fatiguée : des salves, des absences, un grésillement
    const cycle = t % 5.3;
    const allume = cycle < 3.2 ? Math.sin(t * 31) > -0.7 : cycle < 3.6 ? Math.sin(t * 57) > 0.3 : cycle > 4.6;
    MAT_CROIX.emissiveIntensity = allume ? 1.4 : 0.05;
  };
  pivot.userData.mobile = true;
  ctx.b.ajouter(pivot);
  ctx.mobiles.push(pivot);
}

// ---------- Le sol, la chaussée, les trottoirs ----------

function sol(ctx) {
  const { c, x0, x1, u } = ctx;
  const M = matieres();
  // Sous les immeubles (caché, sauf dans la coupe)
  c.pave(x0, -0.3, Z.fondN, x1, 0, Z.facN, C.socle, M.mat, { crasse: false, nuance: 0 });
  c.pave(x0, -0.3, Z.facS, x1, 0, Z.fondS, C.socle, M.mat, { crasse: false, nuance: 0 });
  // Trottoirs (asphalte clair) et chaussées
  c.pave(x0, -0.3, Z.facN, x1, 0.02, Z.bordN, C.trottoir, M.asphalte, { crasse: false, nuance: 0 });
  c.pave(x0, -0.3, Z.bordS, x1, 0.02, Z.facS, C.trottoir, M.asphalte, { crasse: false, nuance: 0 });
  c.pave(x0, -0.3, Z.bordN, x1, 0, Z.tpN, C.asphalte, M.asphalte, { crasse: false, nuance: 0 });
  c.pave(x0, -0.3, Z.tpS, x1, 0, Z.bordS, C.asphalte, M.asphalte, { crasse: false, nuance: 0 });
  // Le terre-plein en stabilisé, troué par la bouche de métro
  const trou = METRO.x1 > x0 && METRO.x0 < x1;
  if (!trou) c.pave(x0, -0.3, Z.tpN, x1, 0.03, Z.tpS, C.stabilise, M.stabilise, { crasse: false, nuance: 0 });
  else {
    c.pave(x0, -0.3, Z.tpN, METRO.x0, 0.03, Z.tpS, C.stabilise, M.stabilise, { crasse: false, nuance: 0 });
    c.pave(METRO.x1, -0.3, Z.tpN, x1, 0.03, Z.tpS, C.stabilise, M.stabilise, { crasse: false, nuance: 0 });
    c.pave(METRO.x0, -0.3, Z.tpN, METRO.x1, 0.03, METRO.z0, C.stabilise, M.stabilise, { crasse: false, nuance: 0 });
    c.pave(METRO.x0, -0.3, METRO.z1, METRO.x1, 0.03, Z.tpS, C.stabilise, M.stabilise, { crasse: false, nuance: 0 });
  }
  // Bordures de granite et caniveaux
  for (const z of [Z.bordN, Z.bordS]) {
    const sz = Math.sign(z);
    c.pave(x0, 0, z - 0.14, x1, 0.09, z + 0.14, C.granite, M.pierre, { crasse: false, nuance: 0.02 });
    c.pave(x0, 0, z - sz * 0.14, x1, 0.006, z - sz * 0.45, 0x4a4c4c, M.asphalte, { crasse: false, nuance: 0 });
  }
  for (const z of [Z.tpN, Z.tpS]) c.pave(x0, 0, z - 0.14, x1, 0.12, z + 0.14, C.granite, M.pierre, { crasse: false, nuance: 0.02 });
  // Marquages : tirets entre les voies (3 m tous les 10 m, calés sur la halte), voie de bus au sud
  for (let k = -100; k < 100; k += 10) {
    const xm = k + 1.5;
    if (xm < x0 || xm >= x1) continue;
    c.pave(k, 0, -8.32, k + 3, 0.008, -8.18, C.blanc, M.mat, { crasse: false, nuance: 0 });
  }
  c.pave(x0, 0, 8.6, x1, 0.008, 8.85, C.blanc, M.mat, { crasse: false, nuance: 0 });
  // Passages piétons
  for (const xp of [-70, 20, 88]) {
    if (xp < x0 || xp >= x1) continue;
    for (const [za, zb] of [[Z.bordN + 0.6, Z.tpN - 0.4], [Z.tpS + 0.4, Z.bordS - 0.6]]) {
      for (let z = za; z < zb - 0.3; z += 1.0) c.pave(xp - 2, 0, z, xp + 2, 0.008, z + 0.5, C.blanc, M.mat, { crasse: false, nuance: 0 });
    }
  }
  // Touffes dans les fissures, flaques
  const n = Math.round(8 + 30 * u);
  semerTouffes(c, x0, Z.bordN - 0.4, x1, Z.bordN - 0.15, n, PALETTE.herbeSeche);
  semerTouffes(c, x0, Z.bordS + 0.15, x1, Z.bordS + 0.4, n, PALETTE.herbeSeche);
  semerTouffes(c, x0, Z.tpN + 0.3, x1, Z.tpS - 0.3, Math.round(n * 1.4), PALETTE.herbe, 0.03);
  semerTouffes(c, x0, Z.facN + 0.4, x1, Z.facN + 0.7, Math.round(n * 0.5), PALETTE.herbeSeche, 0.02);
  for (let i = 0; i < 4; i++) {
    const fx = x0 + 6 + i * 11 + ((i * 37) % 5);
    const fz = [-10, 6.4, -6.2, 10.8][i];
    flaque(c, fx, fz, 1.0 + 0.8 * u, 0.012);
  }
  jonchee(c, x0, Z.facN, x1, Z.bordN, Math.round(20 + 40 * u));
  jonchee(c, x0, Z.bordS, x1, Z.facS, Math.round(20 + 40 * u));
}

// ---------- Le mobilier de la rue ----------

/** Un platane de boulevard : tronc clair tacheté, houppier haut, grille au pied. */
function platane(c, x, z, h, coupe = false, k = c) {
  const M = matieres();
  c.pave(x - 0.75, 0.03, z - 0.75, x + 0.75, 0.06, z + 0.75, 0x3a3c3a, M.metal, { crasse: false });
  if (coupe) {
    c.poser(cyl(0.38, 0.6, 7), M.mat, 0xa79f86, { x, y: 0.3, z }, {});
    c.poser(cyl(0.36, 0.02, 7), M.mat, 0xd8c8a0, { x, y: 0.61, z }, { crasse: false });
    return;
  }
  c.tube([x, 0, z], [x + 0.2, h * 0.45, z - 0.1], h * 0.032, 0xa79f86, matiere(0.95), 6);
  for (const [dx, dz] of [[-1.2, 0.8], [1.4, -0.6], [0.2, 1.3]]) k.tube([x + 0.2, h * 0.43, z - 0.1], [x + dx, h * 0.62, z + dz], h * 0.018, 0xb5ad94, matiere(0.95), 5);
  const tons = [0x5f8a46, 0x6f9650, 0x4f7a3c, 0x7a9a50];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + c.hasard();
    const r = i === 0 ? 0 : h * 0.17;
    const s = h * c.entre(0.13, 0.18);
    k.poser(BOULE, matiere(0.95), tons[i % 4], { x: x + Math.cos(a) * r, y: h * 0.72 + c.entre(-0.06, 0.1) * h, z: z + Math.sin(a) * r, rx: c.hasard() * 3, ry: c.hasard() * 3, e: [s, s * 0.75, s] }, { nuance: 0.07, crasse: false });
  }
}

/** Le candélabre du terre-plein : fût de fonte vert sombre, deux crosses, deux lanternes (mortes). */
function candelabre(c, x, z) {
  const M = matieres();
  c.poser(cyl(0.16, 0.6, 8), M.tole, C.fonte, { x, y: 0.3, z }, {});
  c.tube([x, 0.6, z], [x, 5.8, z], 0.07, C.fonte, M.tole, 6);
  for (const s of [-1, 1]) {
    c.tube([x, 5.5, z], [x + s * 0.9, 5.9, z], 0.04, C.fonte, M.tole, 5);
    c.boite(0.34, 0.5, 0.34, 0x2a3a32, { x: x + s * 0.95, y: 5.6, z }, M.tole);
    c.boite(0.26, 0.3, 0.26, 0xd8d4c0, { x: x + s * 0.95, y: 5.55, z }, M.verre, { crasse: false });
    c.poser(CONE, M.tole, C.fonte, { x: x + s * 0.95, y: 6.0, z, e: [0.28, 0.3, 0.28] }, {});
  }
}

function banc(c, b, x, z, ry) {
  const M = matieres();
  c.repere({ x, z, ry }, () => {
    for (let k = 0; k < 3; k++) c.boite(1.8, 0.04, 0.12, 0x6a5a40, { y: 0.45, z: -0.15 + k * 0.15 }, M.mat);
    for (let k = 0; k < 2; k++) c.boite(1.8, 0.1, 0.03, 0x6a5a40, { y: 0.65 + k * 0.15, z: -0.25, rx: 0.2 }, M.mat);
    for (const sx of [-1, 1]) c.boite(0.06, 0.45, 0.45, C.fonte, { x: sx * 0.75, y: 0.23 }, M.tole);
  });
  rect(b, x, z, 1.8, 0.5, ry, "banc");
}

/** La poubelle de ville : un cerceau et un sac vert transparent (vidé par le vent). */
function poubelle(c, x, z) {
  const M = matieres();
  c.tube([x, 0, z], [x, 0.95, z], 0.03, C.fonte, M.tole, 5);
  c.poser(new THREE.TorusGeometry(0.22, 0.02, 3, 10), M.tole, C.fonte, { x, y: 0.92, z: z + 0.25, rx: Math.PI / 2 }, {});
  c.poser(cyl(0.2, 0.55, 8), M.verre, 0x8fb59a, { x, y: 0.62, z: z + 0.25 }, { crasse: false });
}

function potelet(c, x, z) {
  const M = matieres();
  c.poser(cyl(0.06, 0.9, 6), M.tole, C.fonte, { x, y: 0.45, z }, {});
  c.poser(cyl(0.08, 0.06, 6), M.tole, C.fonte, { x, y: 0.92, z }, {});
}

/** Le panneau de direction de ville, sur deux poteaux. */
function panneauDirection(ctx, x, z, r, ry = 0) {
  const { c, b } = ctx;
  const M = matieres();
  c.repere({ x, z, ry }, () => {
    for (const s of [-1, 1]) c.boite(0.08, 3.2, 0.08, 0x8e9599, { x: s * 1.0, y: 1.6 }, M.metal);
    c.boite(3.0, 1.0, 0.05, 0xd8d6cf, { y: 2.6 }, M.tole);
    panneauDouble(c, M.enseignes, r, { y: 2.6 }, 2.95, 0.93, 0xffffff, 0.032);
  });
  b.obstacle(...versMonde(x, z, ry, -1, 0), ...versMonde(x, z, ry, 1, 0), "panneau");
}

/** La colonne d'affichage : avis de la préfecture et réclames de livraison. */
function colonne(ctx, x, z) {
  const { c, b } = ctx;
  const M = matieres();
  c.poser(cyl(0.62, 0.3, 10), M.tole, C.fonte, { x, y: 0.15, z }, {});
  c.poser(cyl(0.58, 2.6, 10), M.tole, 0x3a4a40, { x, y: 1.6, z }, {});
  c.poser(cyl(0.72, 0.25, 10), M.tole, C.fonte, { x, y: 3.0, z }, {});
  c.poser(new THREE.SphereGeometry(0.62, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2), M.tole, C.fonte, { x, y: 3.1, z }, {});
  c.poser(cyl(0.05, 0.4, 6), M.tole, C.fonte, { x, y: 3.85, z }, {});
  for (const [a, r] of [[0.3, R.prefecture], [1.45, R.affLivre], [-0.85, R.aff10min], [2.6, R.velo]]) {
    c.repere({ x: x + Math.sin(a) * 0.6, y: 1.65, z: z + Math.cos(a) * 0.6, ry: a }, () => panneau(c, M.enseignes, r, {}, 0.78, 1.08));
  }
  rect(b, x, z, 1.2, 1.2, 0, "colonne d'affichage");
}

/** Le kiosque à journaux : vert sombre, toit en dôme, la une « La panne durera 48 h ». */
function kiosque(ctx, x, z) {
  const { c, b, u } = ctx;
  const M = matieres();
  c.pave(x - 1.4, 0, z - 0.9, x + 1.4, 2.4, z + 0.9, C.fonte, M.tole);
  c.pave(x - 1.55, 2.4, z - 1.05, x + 1.55, 2.55, z + 1.05, 0x24302a, M.tole);
  c.poser(new THREE.SphereGeometry(1.15, 8, 3, 0, Math.PI * 2, 0, Math.PI / 2), M.tole, 0x3a4a40, { x, y: 2.55, z, e: [1.25, 0.55, 0.85] }, {});
  c.poser(cyl(0.05, 0.6, 6), M.tole, C.fonte, { x, y: 3.4, z }, {});
  for (const s of [-1, 1]) c.repere({ x, y: 2.15, z: z + s * 0.91, ry: s > 0 ? 0 : Math.PI }, () => panneau(c, M.enseignes, R.kiosque, {}, 2.4, 0.42));
  // le volet ouvert sur la rue (côté sud), les revues
  c.boite(2.4, 0.05, 0.8, C.fonte, { x, y: 1.95, z: z + 1.25, rx: 0.3 }, M.tole);
  c.pave(x - 1.2, 1.0, z + 0.9, x + 1.2, 1.06, z + 1.25, 0x5a4a3a, M.satin);
  c.repere({ x: x - 0.6, y: 1.5, z: z + 0.92 }, () => panneau(c, M.enseignes, R.presse, {}, 0.7, 0.47));
  jonchee(c, x - 1.6, z + 0.9, x + 1.8, z + 2.6, Math.round(14 + 20 * u), [0xe9e4d6, 0xc8362b, 0x2f6f73, 0xf2b33d, 0xd8d0b8], 0.03);
  rect(b, x, z, 2.8, 1.8, 0, "kiosque");
}

/** Un vélo Vélo+ verrouillé à sa borne (axe le long de z). */
function veloLibre(c, x, z, couche = false) {
  const M = matieres();
  c.repere(couche ? { x, y: 0.12, z, rz: Math.PI / 2 - 0.1, ry: 0.3 } : { x, z }, () => {
    for (const dz of [-0.52, 0.52]) c.poser(new THREE.TorusGeometry(0.33, 0.035, 3, 10), M.mat, 0x2a2928, { y: 0.35, z: dz, ry: Math.PI / 2 }, { crasse: false });
    c.poutre([0, 0.35, -0.52], [0, 0.85, 0.05], 0.05, 0xe9efe6, M.satin);
    c.poutre([0, 0.35, 0.52], [0, 0.9, 0.38], 0.05, 0xe9efe6, M.satin);
    c.poutre([0, 0.85, 0.05], [0, 0.9, 0.38], 0.06, 0x3f8f5a, M.satin);
    c.poutre([0, 0.35, -0.52], [0, 0.85, -0.35], 0.04, 0xe9efe6, M.satin);
    c.boite(0.18, 0.06, 0.26, 0x2a2928, { y: 0.9, z: -0.32 }, M.mat);
    c.boite(0.6, 0.04, 0.04, 0x2a2928, { y: 1.05, z: 0.4 }, M.metal);
    c.boite(0.36, 0.22, 0.3, 0x3f8f5a, { y: 0.95, z: 0.62 }, M.satin);
  });
}

/** Un scooter de livraison (coffre isotherme), couché ou debout ; axe le long de x local. */
function scooterLivraison(c, x, z, ry, couche = true) {
  const M = matieres();
  c.repere(couche ? { x, y: 0.32, z, ry, rx: Math.PI / 2 - 0.15 } : { x, z, ry }, () => {
    for (const dx of [-0.55, 0.55]) c.poser(cyl(0.22, 0.12, 8), M.mat, C.pneu, { x: dx, y: 0.22, rx: Math.PI / 2 }, { crasse: false });
    c.boite(1.0, 0.25, 0.32, 0xe8e6e0, { y: 0.4 }, M.satin);
    c.boite(0.45, 0.2, 0.3, 0x2a2928, { x: -0.15, y: 0.62 }, M.mat);
    c.poutre([0.5, 0.35, 0], [0.62, 1.0, 0], 0.07, 0xe8e6e0, M.satin);
    c.boite(0.06, 0.04, 0.6, 0x2a2928, { x: 0.62, y: 1.02 }, M.metal);
    c.boite(0.45, 0.45, 0.45, 0xc8362b, { x: -0.45, y: 0.95 }, M.satin);
  });
}

/** Un drone de livraison écrasé : corps, bras (un cassé), hélices, colis « VitAir ». */
function drone(c, x, z, ry, y = 0, penche = 0.25) {
  const M = matieres();
  c.repere({ x, y: y + 0.12, z, ry, rz: penche }, () => {
    c.boite(0.5, 0.14, 0.5, 0xe8e6e0, {}, M.satin);
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + (k * Math.PI) / 2;
      const casse = k === 2;
      const lg = casse ? 0.25 : 0.55;
      c.boite(lg, 0.05, 0.06, 0x2a2928, { x: Math.cos(a) * (0.25 + lg / 2), z: Math.sin(a) * (0.25 + lg / 2), ry: -a }, M.satin);
      if (!casse) c.poser(cyl(0.24, 0.02, 6), M.lisse, 0x3a3d40, { x: Math.cos(a) * 0.78, y: 0.06, z: Math.sin(a) * 0.78 }, { crasse: false });
    }
    c.boite(0.38, 0.32, 0.38, 0xe8c24a, { y: -0.2, x: 0.05 }, M.satin);
  });
  c.repere({ x: x + 0.05, y: y + 0.0, z: z + 0.2, ry }, () => panneau(c, M.enseignes, R.drone, { y: 0.0, rx: -Math.PI / 2 + 0.2 }, 0.36, 0.09));
}

/** Une barrière de ville (« Vauban ») : cadre, barreaux, pieds plats ; axe le long de x local. */
function barriere(c, x, z, ry, tombee = false) {
  const M = matieres();
  c.repere(tombee ? { x, y: 0.1, z, ry, rx: Math.PI / 2 } : { x, z, ry }, () => {
    c.boite(2.0, 0.04, 0.04, 0x9aa0a3, { y: 1.08 }, M.metal);
    c.boite(2.0, 0.04, 0.04, 0x9aa0a3, { y: 0.2 }, M.metal);
    for (let k = 0; k <= 10; k++) c.boite(0.02, 0.88, 0.02, 0x9aa0a3, { x: -1 + k * 0.2, y: 0.64 }, M.metal);
    for (const s of [-1, 1]) {
      c.boite(0.04, 1.1, 0.04, 0x9aa0a3, { x: s, y: 0.55 }, M.metal);
      c.boite(0.04, 0.03, 0.7, 0x9aa0a3, { x: s * 0.9, y: 0.02 }, M.metal);
    }
  });
}

/** Un panneau de grillage de chantier sur ses plots de béton ; axe le long de x local. */
function grillage(c, x, z, ry, l = 3.4) {
  const M = matieres();
  c.repere({ x, z, ry }, () => {
    for (const s of [-1, 1]) {
      c.boite(0.05, 2.0, 0.05, 0xb8bcbc, { x: (s * l) / 2, y: 1.05 }, M.metal);
      c.boite(0.6, 0.15, 0.25, 0x9a968c, { x: (s * l) / 2, y: 0.075 }, M.mat);
    }
    c.boite(l, 0.05, 0.05, 0xb8bcbc, { y: 2.05 }, M.metal);
    c.boite(l, 0.05, 0.05, 0xb8bcbc, { y: 0.1 }, M.metal);
    panneau(c, M.enseignes, R.grillage, { y: 1.07 }, l, 1.95);
  });
}

/** Un sac de sable. */
function sac(c, x, y, z, ry) {
  const M = matieres();
  c.boite(0.6, 0.24, 0.38, C.sable, { x, y: y + 0.12, z, ry, rz: c.entre(-0.06, 0.06) }, M.mat, { nuance: 0.1 });
}
/** Un mur de sacs de sable le long de x local (n sacs de long, k rangs). */
function murSacs(c, x, z, ry, n, k) {
  c.repere({ x, z, ry }, () => {
    for (let j = 0; j < k; j++) for (let i = 0; i < n - (j % 2); i++) sac(c, -((n - 1) * 0.58) / 2 + i * 0.58 + (j % 2) * 0.29, j * 0.23, 0, c.entre(-0.08, 0.08));
  });
}

/** Un sommier à ressorts, debout ou couché. */
function sommier(c, x, y, z, ry, rx = 0) {
  const M = matieres();
  c.repere({ x, y, z, ry, rx }, () => {
    c.boite(1.9, 0.18, 1.35, 0xd8cfc0, {}, M.mat, { nuance: 0.06 });
    for (let k = 0; k < 4; k++) c.boite(1.9, 0.185, 0.08, 0x6a7f9a, { z: -0.5 + k * 0.33 }, M.mat, { crasse: false });
  });
}

function cone(c, x, z, couche = false) {
  const M = matieres();
  c.repere(couche ? { x, y: 0.15, z, rz: Math.PI / 2, ry: c.hasard() * 3 } : { x, z }, () => {
    c.poser(CONE, M.satin, 0xd8612b, { y: 0.38, e: [0.17, 0.72, 0.17] }, {});
    c.poser(cyl(0.13, 0.1, 6), M.satin, 0xe8e6e0, { y: 0.42 }, { crasse: false });
    c.boite(0.4, 0.04, 0.4, 0x2a2928, { y: 0.02 }, M.mat);
  });
}

// ---------- Véhicules ----------

/** Une petite voiture de ville (épave) : avant vers +x local. */
function voiture(ctx, x, z, ry, o = {}) {
  const { c, u } = ctx;
  const M = matieres();
  const L = o.type === "break" ? 4.3 : 3.8;
  const W = 1.72;
  const col = new THREE.Color(o.couleur ?? 0x7d8f9c).lerp(new THREE.Color(0x8a7a66), 0.15 + 0.35 * u);
  const coul = o.brulee ? 0x3a3532 : col.getHex();
  const haut = 1.42;
  const lh = L * 0.5;
  const xh = -0.25;
  const hh = haut - 0.95;
  const pose = o.retournee ? { x, y: o.y ?? 1.45, z, ry, rx: Math.PI } : { x, y: (o.y ?? 0) + (u > 0.35 ? -0.08 : 0), z, ry, rz: o.rz ?? 0, rx: o.rx ?? 0 };
  c.repere(pose, () => {
    c.boite(L, 0.6, W, coul, { y: 0.65 }, o.brulee ? M.mat : M.satin);
    c.boite(L * 0.25, 0.08, W - 0.1, coul, { x: L * 0.36, y: 0.97, rz: -0.08 }, o.brulee ? M.mat : M.satin);
    if (!o.brulee) c.boite(lh, hh, W - 0.14, 0xffffff, { x: xh, y: 0.95 + hh / 2 }, M.verre, { crasse: false });
    c.boite(lh - 0.2, 0.07, W - 0.1, coul, { x: xh, y: haut }, o.brulee ? M.mat : M.satin);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.boite(0.09, hh, 0.08, coul, { x: xh + sx * (lh / 2 - 0.08), y: 0.95 + hh / 2, z: sz * (W / 2 - 0.1) }, M.satin);
    for (const s of [-1, 1]) c.boite(0.14, 0.22, W + 0.02, 0x3a3b3c, { x: (s * L) / 2, y: 0.45 }, M.mat);
    for (const sz of [-1, 1]) {
      c.boite(0.06, 0.12, 0.32, 0xd8d4c4, { x: L / 2 + 0.01, y: 0.75, z: sz * 0.58 }, M.lisse);
      c.boite(0.06, 0.12, 0.28, 0x8a2a24, { x: -L / 2 - 0.01, y: 0.78, z: sz * 0.6 }, M.lisse);
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.poser(ROUE, M.mat, o.brulee ? 0x2a2624 : C.pneu, { x: sx * L * 0.32, y: 0.33, z: sz * (W / 2 - 0.08), rx: Math.PI / 2 }, { crasse: false });
    if (u > 0.3 && !o.brulee) for (const sz of [-1, 1]) c.boite(L * 0.5, 0.18, 0.02, PALETTE.rouille, { x: c.entre(-0.4, 0.4), y: 0.45, z: sz * (W / 2 + 0.005) }, M.mat, { nuance: 0.1 });
    if (o.ouverte) c.boite(0.9, 0.55, 0.05, coul, { x: 0.65, y: 0.85, z: W / 2 + 0.38, ry: -0.9 }, M.satin);
  });
  if (!o.sansObstacle) rect(ctx.b, x, z, L, W, ry, "épave");
}

/**
 * Un bus de ville (épave), avant vers +x local, côté droit (portes) vers +z local. `couche` : le chantier des parties
 * hautes (vitres, toit) quand on peut entrer dedans. o : { longueur, articule, porte (x local de la porte ouverte),
 * decoupe (x local de la découpe côté gauche), brule }.
 */
function bus(ctx, cx, cz, ry, o = {}) {
  const { c, b, u } = ctx;
  const M = matieres();
  const k = o.couche ?? c;
  const L = o.longueur ?? 12;
  const W = 2.55;
  const yS = 0.14; // le plancher (le bus est posé sur ses jantes)
  const yB = 1.05; // le bas des vitres
  const yH = 2.65; // le haut des vitres
  const yT = 2.95;
  const brule = !!o.brule;
  const caisse = brule ? 0x4a4440 : C.cremeBus;
  const bande = brule ? 0x3a3532 : C.canard;
  const portes = o.portes ?? [L / 2 - 1.4, 1.5, -L / 2 + 3.2];
  const ouvertes = new Set([o.porte, o.decoupe].filter((v) => v !== undefined));
  const pose = { x: cx, z: cz, ry };
  const dessin = () => {
    // plancher et jupe
    c.pave(-L / 2, 0.0, -W / 2, L / 2, yS, W / 2, 0x4a4c4e, M.satin, { crasse: false });
    // Les flancs bas, avec leurs trous de portes
    for (const sz of [-1, 1]) {
      const trous = (sz > 0 ? portes.map((p) => [p, 1.25]) : o.decoupe !== undefined ? [[o.decoupe, 1.2]] : []).sort((p, q) => p[0] - q[0]);
      const coupes = [-L / 2, ...trous.flatMap(([p, l]) => [p - l / 2, p + l / 2]), L / 2];
      for (let i = 0; i < coupes.length; i += 2) {
        const a = coupes[i];
        const e = coupes[i + 1];
        if (e - a < 0.05) continue;
        c.pave(a, yS, sz * (W / 2 - 0.06), e, yB, sz * (W / 2), caisse, M.satin);
        c.pave(a, 0.62, sz * (W / 2 + 0.005), e, 0.72, sz * (W / 2 + 0.01), bande, M.satin, { crasse: false });
      }
      // les portes : fermées (vitrées), ouverte (repliée), ou la découpe aux bords tordus
      for (const [p, l] of trous) {
        const ouverte = ouvertes.has(p);
        if (!ouverte) {
          k.pave(p - l / 2, yS, sz * (W / 2 - 0.08), p + l / 2, yH, sz * (W / 2 - 0.03), 0x3a3d40, M.tole);
          k.boite(l - 0.2, 1.3, 0.02, 0xffffff, { x: p, y: 1.6, z: sz * (W / 2 - 0.02) }, M.verre, { crasse: false });
          c.pave(p - l / 2, yS, sz * (W / 2 - 0.08), p + l / 2, yB, sz * (W / 2 - 0.03), 0x3a3d40, M.tole);
        } else if (sz > 0) {
          for (const s of [-1, 1]) c.boite(0.3, yH - yS, 0.04, 0x3a3d40, { x: p + s * (l / 2 - 0.12), y: (yH + yS) / 2, z: W / 2 + 0.1, ry: s * 1.2 }, M.tole);
          k.pave(p - l / 2, yB, sz * (W / 2 - 0.06), p + l / 2, yH, sz * (W / 2), caisse, M.satin);
        } else {
          // découpe à la disqueuse : tôles retroussées
          c.boite(0.5, 0.9, 0.03, caisse, { x: p - l / 2 - 0.1, y: 0.6, z: -W / 2 - 0.2, ry: -0.8 }, M.satin);
          c.boite(0.4, 0.5, 0.03, caisse, { x: p + l / 2 + 0.05, y: 0.35, z: -W / 2 - 0.15, ry: 0.9, rz: 0.2 }, M.satin);
          k.pave(p - l / 2, 1.9, -W / 2, p + l / 2, yH, -W / 2 + 0.06, caisse, M.satin);
        }
      }
    }
    // Avant et arrière
    for (const sx of [-1, 1]) {
      c.pave(sx * L / 2 - sx * 0.06, yS, -W / 2, sx * L / 2, yB, W / 2, caisse, M.satin);
      c.boite(0.05, 0.12, 0.4, sx > 0 ? 0xd8d4c4 : 0x8a2a24, { x: sx * (L / 2 + 0.01), y: 0.55, z: 0.9 }, M.lisse);
      c.boite(0.05, 0.12, 0.4, sx > 0 ? 0xd8d4c4 : 0x8a2a24, { x: sx * (L / 2 + 0.01), y: 0.55, z: -0.9 }, M.lisse);
      if (!brule) k.boite(0.04, yH - yB - 0.1, W - 0.25, 0xffffff, { x: sx * (L / 2 - 0.02), y: (yB + yH) / 2, z: 0 }, M.verre, { crasse: false });
      k.pave(sx * L / 2 - sx * 0.06, yH - 0.05, -W / 2, sx * L / 2, yT, W / 2, caisse, M.satin);
      for (const sz of [-1, 1]) k.pave(sx * L / 2 - sx * 0.25, yB, sz * (W / 2 - 0.06), sx * L / 2, yH, sz * W / 2, caisse, M.satin);
    }
    // Les montants, les vitres (cassées en partie), le toit
    const nm = Math.round(L / 1.45);
    for (const sz of [-1, 1]) {
      for (let i = 0; i <= nm; i++) {
        const x = -L / 2 + (i * L) / nm;
        k.pave(x - 0.06, yB, sz * (W / 2 - 0.06), x + 0.06, yH, sz * W / 2, caisse, M.satin);
        if (i < nm && !brule && c.hasard() > 0.25 + 0.45 * u) k.boite(L / nm - 0.14, yH - yB - 0.1, 0.02, 0xffffff, { x: x + L / nm / 2, y: (yB + yH) / 2, z: sz * (W / 2 - 0.03) }, M.verre, { crasse: false });
      }
      k.pave(-L / 2, yB - 0.04, sz * (W / 2 - 0.07), L / 2, yB + 0.04, sz * (W / 2 + 0.01), bande, M.satin, { crasse: false });
    }
    const trouToit = brule && u > 0.5;
    if (trouToit) {
      k.pave(-L / 2, yT - 0.12, -W / 2, -L / 6, yT, W / 2, caisse, M.satin);
      k.pave(L / 6, yT - 0.12, -W / 2, L / 2, yT, W / 2, caisse, M.satin);
    } else k.pave(-L / 2, yT - 0.12, -W / 2, L / 2, yT, W / 2, caisse, M.satin);
    k.pave(-L / 4, yT, -0.7, L / 4, yT + 0.25, 0.7, brule ? 0x3a3532 : 0xc8c4b6, M.tole);
    // Le soufflet de l'articulation
    if (o.articule) {
      for (let i = 0; i < 6; i++) {
        c.pave(-0.5 + i * 0.18, yS, -W / 2 - 0.02, -0.42 + i * 0.18, yB, W / 2 + 0.02, 0x2a2928, M.mat);
        k.pave(-0.5 + i * 0.18, yB, -W / 2 - 0.02, -0.42 + i * 0.18, yT - 0.05, W / 2 + 0.02, 0x2a2928, M.mat);
      }
    }
    // Les roues (pneus crevés, jantes)
    const essieux = o.articule ? [L / 2 - 2.6, -0.5 - 2.6, -L / 2 + 1.8] : [L / 2 - 2.6, -L / 2 + 3.0];
    for (const ex of essieux) for (const sz of [-1, 1]) c.poser(cyl(0.5, 0.3, 8), M.mat, brule ? 0x2a2624 : C.pneu, { x: ex, y: 0.32, z: sz * (W / 2 - 0.12), rx: Math.PI / 2, e: [1, 1, 0.75] }, { crasse: false });
    // La réclame sur le flanc (côté gauche, vers la rue)
    if (!brule) panneau(c, M.enseignes, R.camion, { x: o.articule ? -4.5 : -1.5, y: 0.8, z: -W / 2 - 0.02, ry: Math.PI }, 3.6, 0.9);
    // Dedans : les sièges, en laissant l'allée centrale
    if (o.sieges) {
      for (let x = -L / 2 + 0.8; x < L / 2 - 1.6; x += 0.85) {
        for (const sz of [-1, 1]) {
          const pres = [...ouvertes].some((p) => Math.abs(x - p) < 0.9) || (sz > 0 && portes.some((p) => Math.abs(x - p) < 0.8));
          if (pres || Math.abs(x) < 0.7) continue;
          const tombe = c.hasard() < u * 0.25;
          c.repere({ x, y: yS, z: sz * 0.78, rz: tombe ? 0.5 : 0 }, () => {
            c.boite(0.45, 0.1, 0.9, 0x2f4a6a, { y: 0.45 }, M.satin);
            c.boite(0.08, 0.6, 0.9, 0x2f4a6a, { x: -0.22, y: 0.8 }, M.satin);
            c.boite(0.06, 0.45, 0.06, 0x9aa0a3, { y: 0.22 }, M.metal);
          });
        }
      }
      // les barres de maintien
      for (let x = -L / 2 + 1.5; x < L / 2 - 1; x += 2.2) c.tube([x, yS, 0.42], [x, yT - 0.1, 0.42], 0.025, 0xc8b84a, M.metal, 5);
      c.tube([-L / 2 + 0.5, 1.9, 0.38], [L / 2 - 0.5, 1.9, 0.38], 0.02, 0xc8b84a, M.metal, 4);
    }
  };
  // les deux chantiers (le bas et la couche du haut) suivent le même repère
  c.repere(pose, () => (k === c ? dessin() : k.repere(pose, dessin)));
  // Les obstacles : les flancs (sauf les ouvertures), les rangées de sièges
  const seg = (x1, z1, x2, z2, nature) => b.obstacle(...versMonde(cx, cz, ry, x1, z1), ...versMonde(cx, cz, ry, x2, z2), nature);
  for (const sz of [-1, 1]) {
    const ouv = [...ouvertes].filter((p) => (sz > 0 ? p === o.porte : p === o.decoupe));
    const coupes = [-L / 2, ...ouv.flatMap((p) => [p - 0.65, p + 0.65]), L / 2];
    for (let i = 0; i < coupes.length; i += 2) seg(coupes[i], (sz * W) / 2, coupes[i + 1], (sz * W) / 2, "flanc du bus");
  }
  seg(-L / 2, -W / 2, -L / 2, W / 2, "bus");
  seg(L / 2, -W / 2, L / 2, W / 2, "bus");
  if (o.sieges) {
    // l'allée : on entre par la porte (à droite), on sort par la découpe (à gauche)
    const p = o.porte;
    const d = o.decoupe;
    const xmin = Math.min(p, d);
    const xmax = Math.max(p, d);
    seg(-L / 2, 0.42, p - 0.65, 0.42, "sièges");
    seg(p + 0.65, 0.42, L / 2, 0.42, "sièges");
    seg(-L / 2, -0.42, d - 0.65, -0.42, "sièges");
    seg(d + 0.65, -0.42, L / 2, -0.42, "sièges");
    // les deux bouts de l'allée sont bouchés (sièges entassés)
    seg(xmin - 1.4, -0.42, xmin - 1.4, 0.42, "sièges entassés");
    seg(xmax + 1.4, -0.42, xmax + 1.4, 0.42, "sièges entassés");
    c.repere({ x: cx, z: cz, ry }, () => {
      for (const xe of [xmin - 1.7, xmax + 1.7]) for (let i = 0; i < 3; i++) c.boite(0.5, 0.5, 0.85, 0x2f4a6a, { x: xe + c.entre(-0.2, 0.2), y: yS + 0.3 + i * 0.4, z: c.entre(-0.2, 0.2), ry: c.entre(-0.5, 0.5), rz: c.entre(-0.4, 0.4) }, M.satin);
    });
  }
}

/** Le camion de livraison de repas « Miam Express », encastré dans la barricade : avant vers +x local. */
function camionMiam(ctx, x, z, ry) {
  const { c, b, u } = ctx;
  const M = matieres();
  c.repere({ x, z, ry, rz: 0.03 }, () => {
    // la cabine, enfoncée
    c.pave(1.6, 0.5, -1.05, 3.4, 2.4, 1.05, 0xe8e6e0, M.satin);
    c.boite(0.05, 0.8, 1.8, 0xffffff, { x: 3.38, y: 1.85 }, M.verre, { crasse: false });
    c.boite(0.8, 0.5, 2.1, 0x8a8e90, { x: 3.4, y: 0.75, rz: 0.4 }, M.tole);
    // la caisse isotherme
    c.pave(-3.4, 0.6, -1.15, 1.55, 3.1, 1.15, 0xf2efe6, M.satin);
    for (const s of [-1, 1]) panneau(c, M.enseignes, R.camion, { x: -0.9, y: 1.9, z: s * 1.16, ry: s > 0 ? 0 : Math.PI }, 4.6, 1.15);
    // les portes arrière ouvertes, les sacs isothermes répandus
    for (const s of [-1, 1]) c.boite(1.1, 2.4, 0.05, 0xe8e6e0, { x: -3.6, y: 1.8, z: s * 1.6, ry: s * 1.3 }, M.satin);
    c.pave(-3.38, 0.6, -1.1, -3.3, 3.05, 1.1, 0x1c1e1f, M.mat, { crasse: false });
    for (const [wx, wz] of [[-1.2, -0.7], [1.2, -0.7], [-1.2, 0.7], [1.2, 0.7]]) c.poser(ROUE, M.mat, C.pneu, { x: wx * (wx > 0 ? 2.1 : 1.8), y: 0.33, z: wz * 1.35, rx: Math.PI / 2, e: [1.3, 1, 1.3] }, { crasse: false });
  });
  rect(b, ...versMonde(x, z, ry, 0, 0), 7.0, 2.4, ry, "camion Miam Express");
  for (let i = 0; i < 9; i++) {
    const [px, pz] = versMonde(x, z, ry, -4.2 - c.hasard() * 1.6, c.entre(-1.6, 1.6));
    c.boite(0.4, 0.3, 0.3, [0xc8362b, 0x2f6f73, 0xf2b33d][i % 3], { x: px, y: 0.15, z: pz, ry: c.hasard() * 3, rz: c.entre(-0.4, 0.4) }, M.satin, { nuance: 0.1 });
  }
  jonchee(c, x - 6, z - 2, x - 3, z + 2, Math.round(10 + 14 * u), [0xe9e4d6, 0xc8362b, 0xb8a27a], 0.03);
}

/** Le fourgon de la sécurité sanitaire (blanc, bande bleue), portes arrière ouvertes : avant vers +x local. */
function fourgon(ctx, x, z, ry) {
  const { c, b } = ctx;
  const M = matieres();
  c.repere({ x, y: -0.06, z, ry }, () => {
    c.pave(-2.6, 0.45, -1.0, 1.8, 2.5, 1.0, 0xeceae2, M.satin);
    c.pave(1.8, 0.45, -1.0, 2.7, 1.5, 1.0, 0xeceae2, M.satin);
    c.boite(0.6, 0.7, 1.8, 0xffffff, { x: 2.1, y: 1.85, rz: -0.6 }, M.verre, { crasse: false });
    for (const s of [-1, 1]) c.pave(-2.6, 1.15, s * 1.0, 2.7, 1.45, s * 1.005, C.bleuSanitaire, M.satin, { crasse: false });
    for (const s of [-1, 1]) c.boite(0.9, 1.9, 0.05, 0xeceae2, { x: -2.85, y: 1.45, z: s * 1.35, ry: s * 1.4 }, M.satin);
    c.pave(-2.58, 0.47, -0.95, -2.5, 2.45, 0.95, 0x1c1e1f, M.mat, { crasse: false });
    c.boite(0.25, 0.15, 0.6, 0x3a6aaa, { x: 0.8, y: 2.58 }, M.lisse);
    for (const [wx, wz] of [[-1.7, -0.9], [1.9, -0.9], [-1.7, 0.9], [1.9, 0.9]]) c.poser(ROUE, M.mat, C.pneu, { x: wx, y: 0.33, z: wz, rx: Math.PI / 2 }, { crasse: false });
    // le brancard sorti
    c.boite(1.9, 0.08, 0.6, 0xd8dcd8, { x: -4.1, y: 0.75, ry: 0.15 }, M.satin);
    for (const s of [-1, 1]) c.boite(0.05, 0.7, 0.05, 0x9aa0a3, { x: -4.1 + s * 0.8, y: 0.38, z: 0.1 }, M.metal);
  });
  rect(b, x, z, 5.3, 2.1, ry, "fourgon sanitaire");
}

// ---------- Les tronçons ----------

/** Ce qui court sur toute la longueur : platanes, candélabres, potelets, bancs, poubelles. */
function rue(ctx) {
  const { c, b, dans } = ctx;
  for (let x = -96; x <= 96; x += 8) {
    if (!dans(x)) continue;
    if (x === -56 || x === -40 || x === 64 || x === 72) continue;
    const coupe = x === -32;
    platane(c, x, 0, 12.5 + ((x * 13) % 5) * 0.4, coupe, ctx.arbres);
    rect(b, x, 0, coupe ? 0.8 : 0.7, coupe ? 0.8 : 0.7, 0, "platane");
  }
  for (let x = -92; x <= 92; x += 16) {
    if (!dans(x) || x === 68 || x === -44) continue;
    candelabre(c, x, -3.0);
    rect(b, x, -3.0, 0.35, 0.35, 0, "candélabre");
  }
  for (let x = -98; x <= 98; x += 4) {
    if (!dans(x)) continue;
    if ((x > -46 && x < -36) || (x > 54 && x < 78)) continue;
    if (Math.abs(x + 70) < 3 || Math.abs(x - 20) < 3 || Math.abs(x - 88) < 3) continue;
    potelet(c, x, Z.bordN - 0.45);
    potelet(c, x + 2, Z.bordS + 0.45);
  }
  for (const [x, z, ry] of [[-84, -2.4, 0], [-68, 2.4, Math.PI], [-12, 2.4, Math.PI], [8, -2.4, 0], [44, 2.4, Math.PI], [86, -2.4, 0]]) if (dans(x)) banc(c, b, x, z, ry);
  for (const [x, z] of [[-90, -12.7], [-58, 12.4], [-20, -12.7], [4, 12.4], [36, -12.7], [92, 12.4]]) if (dans(x)) poubelle(c, x, z);
}

function troncon1(ctx) {
  const { c, b, u } = ctx;
  const M = matieres();
  panneauDirection(ctx, -95, 14.5, R.panOuest);
  // La plaque de rue, à l'angle du premier immeuble
  c.repere({ x: -93, y: 3.0, z: -16.74 }, () => panneau(c, M.enseignes, R.plaque, {}, 1.1, 0.55));
  colonne(ctx, -91, -14.2);
  kiosque(ctx, -64, -14.6);
  // La station Vélo+ : bornes mortes, vélos verrouillés, la borne-totem dont l'écran luit
  for (let i = 0; i < 9; i++) {
    const x = -69 + i * 1.05;
    c.boite(0.12, 0.95, 0.18, 0x3f8f5a, { x, y: 0.48, z: 15.6 }, M.satin);
    c.boite(0.13, 0.12, 0.2, 0x1d2433, { x, y: 0.9, z: 15.5 }, M.lisse);
    if (i % 3 !== 1) veloLibre(c, x, 14.8, i === 7 && u > 0.4);
  }
  b.obstacle(-69.5, 14.3, -60.4, 14.3, "station Vélo+");
  c.repere({ x: -59.3, z: 15.4 }, () => {
    c.boite(0.5, 2.0, 0.35, 0x3f8f5a, { y: 1.0 }, M.satin);
    panneau(c, M.neon, R.borneVelo, { y: 1.35, z: 0.18 }, 0.4, 0.8);
    c.repere({ y: 1.0, z: -0.18, ry: Math.PI }, () => panneau(c, M.enseignes, R.velo, {}, 0.45, 0.62));
  });
  rect(b, -59.3, 15.4, 0.5, 0.35, 0, "borne Vélo+");
  ctx.b.lumiere(-59.3, 1.6, 14.6, 0x7dffb0, 2.5, 6, "écran de la borne Vélo+ qui luit encore (« abonnez-vous pour déverrouiller »)");
  // La bouche de métro condamnée : balustrade, mât, l'escalier qui descend dans le noir
  const { x0, x1, z0, z1 } = METRO;
  c.pave(x0, -4.5, z0, x1, -4.3, z1, 0x0a0a0a, M.mat, { crasse: false });
  for (const [za, zb] of [[z0 - 0.2, z0], [z1, z1 + 0.2]]) {
    c.pave(x0, -1.6, za, x1, 0.03, zb, 0x8a857a, M.pierre, { crasse: false });
    c.pave(x0, -4.5, za, x1, -1.6, zb, 0x2a2826, M.pierre, { crasse: false });
  }
  c.pave(x1, -4.5, z0 - 0.2, x1 + 0.2, 0.03, z1 + 0.2, 0x8a857a, M.pierre, { crasse: false });
  for (let k = 0; k < 16; k++) c.pave(x0 + k * 0.32, -0.2 - k * 0.24, z0, x0 + (k + 1) * 0.32, -k * 0.24, z1, k < 10 ? 0x9a958a : 0x3a3836, M.pierre, { crasse: false });
  c.pave(x1 - 0.05, -4.5, z0, x1, -0.6, z1, 0x050505, M.mat, { crasse: false });
  // la balustrade (trois côtés), la grille fermée et ses planches à l'ouest
  for (const [ax, az, bx, bz] of [[x0, z0 - 0.1, x1 + 0.1, z0 - 0.1], [x0, z1 + 0.1, x1 + 0.1, z1 + 0.1], [x1 + 0.1, z0 - 0.1, x1 + 0.1, z1 + 0.1]]) {
    c.pave(Math.min(ax, bx) - 0.04, 0.95, Math.min(az, bz) - 0.04, Math.max(ax, bx) + 0.04, 1.02, Math.max(az, bz) + 0.04, C.fonte, M.tole, { crasse: false });
    const lg = Math.hypot(bx - ax, bz - az);
    for (let i = 0; i <= Math.round(lg / 0.25); i++) {
      const t = i / Math.round(lg / 0.25);
      c.boite(0.03, 0.95, 0.03, C.fonte, { x: ax + (bx - ax) * t, y: 0.5, z: az + (bz - az) * t }, M.tole);
    }
    b.obstacle(ax, az, bx, bz, "balustrade du métro");
  }
  for (let i = 0; i <= 10; i++) c.boite(0.03, 1.9, 0.03, C.fonte, { x: x0 - 0.05, y: 0.95, z: z0 + (i * (z1 - z0)) / 10 }, M.tole);
  c.pave(x0 - 0.08, 1.8, z0 - 0.1, x0 - 0.02, 1.9, z1 + 0.1, C.fonte, M.tole, { crasse: false });
  for (let k = 0; k < 3; k++) c.boite(0.05, 0.22, 3.1, [0x8a6f50, 0x7a5f44, 0x9a7f5c][k], { x: x0 - 0.12, y: 0.5 + k * 0.45, z: 0, rx: (k - 1) * 0.15 }, M.mat);
  b.obstacle(x0 - 0.05, z0 - 0.1, x0 - 0.05, z1 + 0.1, "grille du métro");
  c.repere({ x: x0 - 0.15, y: 1.25, z: 0, ry: -Math.PI / 2 }, () => panneau(c, M.enseignes, R.craie, {}, 2.6, 0.98));
  c.poser(cyl(0.07, 3.4, 6), M.tole, C.fonte, { x: x1 + 0.6, y: 1.7, z: z1 + 0.5 }, {});
  c.repere({ x: x1 + 0.6, y: 3.2, z: z1 + 0.5, ry: 0.4 }, () => {
    c.boite(1.7, 0.86, 0.1, 0x2b3a3a, {}, M.tole);
    panneauDouble(c, M.enseignes, R.metro, {}, 1.6, 0.8, 0xffffff, 0.055);
  });
  // un sac abandonné contre la grille
  c.boite(0.5, 0.35, 0.3, 0x4a5a3a, { x: x0 - 0.5, y: 0.18, z: -0.4, ry: 0.4 }, M.mat);
  // Voitures, scooters
  voiture(ctx, -88, -7.6, 0.05, { couleur: TEINTES_VOITURES[0], ouverte: true });
  voiture(ctx, -68, 8.2, -0.1, { couleur: TEINTES_VOITURES[3] });
  voiture(ctx, -78.5, 10.4, 2.9, { couleur: TEINTES_VOITURES[7], type: "break" });
  voiture(ctx, -97, -9.5, 0.2, { couleur: TEINTES_VOITURES[6] });
  scooterLivraison(c, -71.5, -14.4, 0.4, true);
  rect(b, -71.5, -14.4, 1.4, 0.6, 0.4, "scooter");
  scooterLivraison(c, -83, 6.4, 2.4, true);
  // Barrières renversées, cartons, un caddie sur le terre-plein
  barriere(c, -74, -2.6, 0.2, true);
  barriere(c, -91, 3.0, 1.2, false);
  rect(b, -91, 3.0, 2.0, 0.6, 1.2, "barrière");
  debris(c, -100, -12, -50, 12, Math.round(20 + 30 * u), [0x9aa0a3, 0xd8d4c4, 0x3a3b3c, 0xbfbab0], 0.03);
}

function troncon2(ctx) {
  const { c, b, u } = ctx;
  const M = matieres();
  // ---- La grande barricade ----
  // Le bus articulé qu'on traverse (avant au sud, portes à l'ouest, découpe à l'est)
  ctx.bus = b.couche("bus", { x: BUS_A.x, z: BUS_A.z, l: 2.8, p: 18.4 }, 1.05, 3.3);
  bus(ctx, BUS_A.x, BUS_A.z, -Math.PI / 2, { longueur: 18, articule: true, couche: ctx.bus, portes: [7.6, 2.4, -3.0, BUS_A.porte - BUS_A.z], porte: BUS_A.porte - BUS_A.z, decoupe: BUS_A.sortie - BUS_A.z, sieges: true });
  // la rampe de palettes devant la porte, la flèche à la craie sur le flanc
  c.boite(1.2, 0.12, 1.0, 0x9a7e5a, { x: -42.85, y: 0.06, z: BUS_A.porte, rz: 0.08 }, M.mat, { nuance: 0.1 });
  c.boite(1.0, 0.1, 0.9, 0x9a7e5a, { x: -39.1, y: 0.05, z: BUS_A.sortie, rz: -0.08 }, M.mat, { nuance: 0.1 });
  c.repere({ x: -42.32, y: 1.75, z: BUS_A.porte - 2.2, ry: -Math.PI / 2 }, () => panneau(c, M.enseignes, [R.craie[0], R.craie[1], R.craie[2], 64], {}, 2.6, 0.33));
  // Le bus brûlé (poste de guet) et le camion encastré
  bus(ctx, BUS_B.x, BUS_B.z, -Math.PI / 2, { longueur: 11.8, brule: true, portes: [3.5, -2.5] });
  camionMiam(ctx, -43.4, 11.6, 0.12);
  // Le poste de guet sur le toit du bus brûlé : sacs, chaise, parasol troué, échelle, lanterne
  const yT = 2.95;
  c.repere({ x: BUS_B.x - 0.2, y: yT, z: BUS_B.z - 1.0 }, () => murSacs(c, 0, 0, Math.PI / 2, 3, 2));
  c.repere({ x: BUS_B.x - 1.1, y: yT, z: BUS_B.z + 1.5 }, () => murSacs(c, 0, 0, 0, 2, 2));
  c.repere({ x: 0, y: yT, z: 0 }, () => chaiseBistrot(c, BUS_B.x + 0.2, BUS_B.z + 0.4, -Math.PI / 2, false));
  c.tube([BUS_B.x + 0.6, yT, BUS_B.z + 1.2], [BUS_B.x + 0.6, yT + 2.4, BUS_B.z + 1.2], 0.03, 0x8e9599, M.metal, 5);
  c.poser(CONE, MAT.toile(), 0xc8362b, { x: BUS_B.x + 0.6, y: yT + 2.35, z: BUS_B.z + 1.2, e: [1.2, 0.5, 1.2] }, { crasse: false });
  for (let k = 0; k < 9; k++) c.boite(0.5, 0.04, 0.05, 0x8e9599, { x: BUS_B.x + 1.45, y: 0.3 + k * 0.32, z: BUS_B.z - 2.6 }, M.metal);
  for (const s of [-1, 1]) c.tube([BUS_B.x + 1.45, 0, BUS_B.z - 2.6 + s * 0.25], [BUS_B.x + 1.45, yT + 0.6, BUS_B.z - 2.6 + s * 0.25], 0.025, 0x8e9599, M.metal, 4);
  c.poser(cyl(0.1, 0.25, 6), M.metal, 0x2a2826, { x: BUS_B.x - 0.6, y: yT + 0.6, z: BUS_B.z + 0.2 }, { crasse: false });
  c.poser(cyl(0.08, 0.15, 6), M.lueur, 0xffffff, { x: BUS_B.x - 0.6, y: yT + 0.8, z: BUS_B.z + 0.2 }, { crasse: false, nuance: 0 });
  ctx.b.lumiere(BUS_B.x - 0.6, yT + 1.1, BUS_B.z + 0.2, 0xffc070, 3, 9, "la lanterne du guetteur, sur le toit du bus brûlé");
  // Le trottoir nord : deux voitures empilées, sommiers, sacs de sable
  voiture(ctx, -41.2, -14.8, Math.PI / 2, { couleur: TEINTES_VOITURES[1], sansObstacle: true });
  voiture(ctx, -41.0, -14.7, Math.PI / 2 + 0.12, { couleur: TEINTES_VOITURES[4], retournee: true, y: 2.6, sansObstacle: true });
  rect(b, -41.1, -14.8, 2.2, 4.4, 0, "voitures empilées");
  for (const [z, ry] of [[-15.9, 0.1], [-13.7, -0.15]]) sommier(c, -42.9, 0.95, z, Math.PI / 2 + ry, 1.35);
  murSacs(c, -42.7, -12.2, Math.PI / 2, 2, 3);
  // Le no man's land, côté ouest : sommiers, mobilier urbain, sacs devant les portes condamnées
  for (const [z, ry] of [[-3.6, 0.1], [1.5, -0.2]]) sommier(c, -42.8, 0.9, z, Math.PI / 2 + ry, 1.3);
  for (const zp of [7.6 + BUS_A.z, 2.4 + BUS_A.z, -3.0 + BUS_A.z]) murSacs(c, -42.75, zp, Math.PI / 2, 3, 3);
  banc(c, b, -44.2, -3.2, 1.3);
  barriere(c, -44.5, 1.5, 1.6, false);
  barriere(c, -43.6, -11.4, 0.3, true);
  for (let i = 0; i < 4; i++) c.poser(new THREE.TorusGeometry(0.42, 0.17, 4, 8), M.mat, C.pneu, { x: -43.4, y: 0.17 + i * 0.32, z: 5.9, rx: Math.PI / 2 }, {});
  rect(b, -43.4, 5.9, 1.2, 1.2, 0, "pneus");
  // l'écart entre les deux bus, bouché de sacs
  murSacs(c, -39.4, 5.4, -0.7, 3, 4);
  b.obstacle(-39.7, 5.5, -38.9, 5.0, "sacs de sable");
  b.obstacle(-42.3, 5.5, -39.0, 5.0, "sacs de sable");
  // Le côté est : le camp des survivants (feu dans un fût, bâche, chaises, bois coupé)
  const fx = -30.2;
  const fz = 2.9;
  c.poser(cyl(0.32, 0.85, 8), M.tole, PALETTE.rouilleSombre, { x: fx, y: 0.43, z: fz }, {});
  c.poser(CONE, M.lueur, 0xffffff, { x: fx, y: 1.15, z: fz, e: [0.28, 0.6, 0.28] }, { crasse: false, nuance: 0 });
  c.poser(CONE, M.lueur, 0xffffff, { x: fx + 0.08, y: 1.05, z: fz - 0.05, ry: 0.5, e: [0.22, 0.4, 0.22] }, { crasse: false, nuance: 0 });
  rect(b, fx, fz, 0.7, 0.7, 0, "feu");
  ctx.b.lumiere(fx, 1.5, fz, 0xff8a3a, 6, 13, "le feu des survivants, derrière la barricade");
  c.tube([-33.6, 0, -3.0], [-33.6, 2.4, -3.0], 0.05, 0x6a5a40, M.mat, 5);
  c.tube([-27.4, 0, 2.6], [-27.4, 2.2, 2.6], 0.05, 0x6a5a40, M.mat, 5);
  c.boite(5.8, 0.04, 4.4, 0x3a5a7a, { x: -30.5, y: 2.25, z: -0.2, rx: 0.08, rz: -0.06 }, MAT.toile(), { crasse: false });
  for (const [x, z, ry] of [[-31.5, 2.3, 0.8], [-29.0, 2.2, -0.9], [-30.3, 1.4, 0.1]]) {
    c.repere({ x, z, ry }, () => {
      c.boite(0.55, 0.05, 0.5, 0x2f6f4a, { y: 0.42 }, MAT.toile());
      c.boite(0.55, 0.6, 0.05, 0x2f6f4a, { y: 0.72, z: -0.25, rx: -0.25 }, MAT.toile());
      for (const s of [-1, 1]) c.poutre([s * 0.26, 0, -0.25], [s * 0.26, 0.42, 0.25], 0.025, 0x9aa0a3, M.metal);
    });
  }
  for (let i = 0; i < 10; i++) c.tube([-34.6 + (i % 5) * 0.06, 0.12 + Math.floor(i / 5) * 0.22, -2.8 + (i % 5) * 0.22], [-33.2 + (i % 5) * 0.06, 0.12 + Math.floor(i / 5) * 0.22, -2.8 + (i % 5) * 0.22], 0.1, 0x8a6a48, M.mat, 5);
  rect(b, -33.9, -2.35, 1.6, 1.2, 0, "bois coupé");
  c.boite(0.6, 0.4, 0.4, 0x5a6a4a, { x: -28.4, y: 0.2, z: -1.8 }, M.mat);
  c.poser(cyl(0.18, 0.2, 8), M.metal, 0x5a5a58, { x: fx, y: 0.95, z: fz }, { crasse: false });
  for (let i = 0; i < 3; i++) c.boite(0.35, 0.45, 0.2, 0x3a6aaa, { x: -27.6 + i * 0.4, y: 0.23, z: -1.6 }, M.satin);
  // Voitures du no man's land, gravats
  voiture(ctx, -47.4, -8.4, 0.25, { couleur: TEINTES_VOITURES[5] });
  voiture(ctx, -48.6, 2.6, -0.5, { couleur: TEINTES_VOITURES[8], brulee: u > 0.5 });
  voiture(ctx, -16, 9.4, 0.08, { couleur: TEINTES_VOITURES[2] });
  voiture(ctx, -6, -9.6, Math.PI + 0.1, { couleur: TEINTES_VOITURES[9] });
  scooterLivraison(c, -20.5, -7.2, 1.8, true);
  debris(c, -50, -12, -36, 12, Math.round(40 + 40 * u), [0x9aa0a3, 0xd8d4c4, 0x3a3b3c, 0xbfbab0, C.sable], 0.03);
  gravats(c, -45.5, -5.5, 1.2, 12, [0xbfbab0, 0x9aa0a3, 0x8a857a]);
  jonchee(c, -36, -12, 0, 12, Math.round(30 * (0.4 + u)));
}

function troncon3(ctx) {
  const { c, b, u } = ctx;
  const M = matieres();
  // Les drones de livraison écrasés sur la chaussée (et un dans un platane)
  for (const [x, z, ry, p] of [[10, -9.4, 0.3, 0.3], [17, 7.2, 1.4, -0.4], [31, -10.6, 2.1, 0.2], [38, 6.6, -0.6, 0.5], [24.6, 1.8, 0.9, -0.2], [6, 10.6, 2.6, 0.35]]) drone(c, x, z, ry, 0, p);
  drone(ctx.arbres, 24.6, -0.6, 0.4, 8.4, 0.6);
  // Une voiture encastrée dans un platane, les autres épaves
  voiture(ctx, 14.0, -2.2, -0.35, { couleur: TEINTES_VOITURES[1], rz: 0.05 });
  voiture(ctx, 42.5, -9.2, 0.1, { couleur: TEINTES_VOITURES[6] });
  voiture(ctx, 5.0, 9.0, Math.PI - 0.08, { couleur: TEINTES_VOITURES[4], ouverte: true });
  scooterLivraison(c, 45.5, -6.8, 0.5, true);
  scooterLivraison(c, 3, -10.4, 2.6, true);
  // L'abribus et sa réclame
  c.repere({ x: 8, z: 14.6 }, () => {
    for (const s of [-1, 1]) c.boite(0.08, 2.4, 0.08, 0x8e9599, { x: s * 1.9, y: 1.2, z: 0.6 }, M.metal);
    c.boite(4.0, 0.08, 1.6, 0x8e9599, { y: 2.45, z: 0.2 }, M.metal);
    if (u < 0.75) c.boite(3.8, 1.8, 0.03, 0xffffff, { y: 1.3, z: 0.95 }, M.verre, { crasse: false });
    c.boite(0.04, 1.8, 1.2, 0xffffff, { x: -1.95, y: 1.3, z: 0.3 }, M.verre, { crasse: false });
    c.repere({ x: 1.95, y: 1.3, z: 0.3, ry: Math.PI / 2 }, () => panneauDouble(c, M.enseignes, R.aff10min, {}, 1.0, 1.4));
    c.boite(2.2, 0.06, 0.4, 0x6a5a40, { y: 0.48, z: 0.7 }, M.mat);
  });
  b.obstacle(6.1, 15.55, 9.9, 15.55, "abribus");
  // Les feux tricolores morts du passage piéton
  for (const [x, z] of [[17.2, -12.6], [22.8, 12.6]]) {
    c.poser(cyl(0.06, 3.2, 6), M.tole, 0x3a3d40, { x, y: 1.6, z }, {});
    c.boite(0.3, 0.85, 0.25, 0x2a2826, { x, y: 2.9, z: z + 0.15 * Math.sign(-z) }, M.tole);
    rect(b, x, z, 0.2, 0.2, 0, "feu tricolore");
  }
  // Billets envolés jusque sur la chaussée, barrières
  barriere(c, 30, -2.6, -0.2, true);
  barriere(c, 46, 13.2, 0.1, false);
  rect(b, 46, 13.2, 2.0, 0.5, 0.1, "barrière");
  debris(c, 0, -12, 50, 12, Math.round(25 + 30 * u), [0x9aa0a3, 0xd8d4c4, 0x3a3b3c, 0xe8c24a], 0.03);
}

function troncon4(ctx) {
  const { c, b, u } = ctx;
  const M = matieres();
  const { grille, sasX1, sasZ0, sasZ1, tente } = CONTROLE;
  const tentes = b.couche("tentes", { x: (grille + tente.x1) / 2 + 0.5, z: (tente.z0 + sasZ1) / 2, l: tente.x1 - grille + 1, p: sasZ1 - tente.z0 + 1 }, 1.0, 3.6);
  // La clôture de grillage de chantier, d'une façade à l'autre, ouverte seulement sur le sas
  for (const [za, zb] of [[Z.facN + 0.3, sasZ0], [sasZ1, Z.facS - 0.3]]) {
    const n = Math.ceil((zb - za) / 3.5);
    const l = (zb - za) / n;
    for (let i = 0; i < n; i++) grillage(c, grille, za + (i + 0.5) * l, Math.PI / 2, l - 0.05);
  }
  b.obstacle(grille, Z.facN, grille, sasZ0, "grillage du contrôle");
  b.obstacle(grille, sasZ1, grille, Z.facS, "grillage du contrôle");
  // Le couloir de barrières qui mène au sas
  for (let x = 55.2; x < grille - 0.5; x += 2.05) {
    barriere(c, x + 1.0, sasZ0, 0);
    barriere(c, x + 1.0, sasZ1, 0);
  }
  b.obstacle(55.2, sasZ0, grille, sasZ0, "barrières du couloir");
  b.obstacle(55.2, sasZ1, grille, sasZ1, "barrières du couloir");
  // Les panneaux : contrôle de température (à l'entrée du couloir), zone de quarantaine
  c.repere({ x: 55.0, y: 0, z: sasZ0 - 1.6, ry: Math.PI / 2 }, () => {
    for (const s of [-1, 1]) c.boite(0.06, 2.6, 0.06, 0x8e9599, { x: s * 1.3, y: 1.3 }, M.metal);
    panneauDouble(c, M.enseignes, R.controle, { y: 2.2 }, 2.8, 0.7);
  });
  c.repere({ x: grille + 0.06, y: 1.3, z: -8.0, ry: Math.PI / 2 }, () => panneauDouble(c, M.enseignes, R.quarantaine, {}, 2.6, 0.65));
  c.repere({ x: (tente.x0 + tente.x1) / 2, y: 1.7, z: tente.z1 + 0.05 }, () => panneau(tentes, M.enseignes, R.quarantaine, {}, 3.6, 0.9));
  // La borne thermique à l'entrée du couloir (l'écran luit encore)
  c.repere({ x: 56.4, z: sasZ0 + 0.55, ry: 0.5 }, () => {
    c.boite(0.45, 1.7, 0.3, 0xe8e6e0, { y: 0.85 }, M.satin);
    panneau(c, M.neon, R.thermique, { y: 1.3, z: 0.16 }, 0.36, 0.72);
    c.boite(0.2, 0.12, 0.15, 0x1d2433, { y: 1.78, z: 0.05 }, M.lisse);
  });
  rect(b, 56.4, sasZ0 + 0.55, 0.45, 0.3, 0.5, "borne thermique");
  ctx.b.lumiere(56.6, 1.4, sasZ0 + 1.1, 0xff5a3a, 2.5, 6, "la borne thermique : « 37,9 °C · accès refusé »");
  // La table du contrôle, la lanterne, la caméra thermique sur trépied
  c.pave(62.0, 0.72, sasZ1 - 0.8, 63.6, 0.76, sasZ1 - 0.2, 0xd8d6cf, M.satin);
  for (const [dx, dz] of [[0.1, 0.1], [1.5, 0.1], [0.1, 0.5], [1.5, 0.5]]) c.boite(0.03, 0.72, 0.03, 0x9aa0a3, { x: 62 + dx, y: 0.36, z: sasZ1 - 0.8 + dz }, M.metal);
  rect(b, 62.8, sasZ1 - 0.5, 1.6, 0.6, 0, "table du contrôle");
  c.boite(0.35, 0.05, 0.25, 0xe9e4d6, { x: 62.5, y: 0.79, z: sasZ1 - 0.5 }, M.mat);
  c.poser(cyl(0.1, 0.24, 8), M.metal, 0x2a2826, { x: 63.2, y: 0.88, z: sasZ1 - 0.5 }, { crasse: false });
  c.poser(cyl(0.07, 0.16, 8), M.lueur, 0xffffff, { x: 63.2, y: 1.06, z: sasZ1 - 0.5 }, { crasse: false, nuance: 0 });
  ctx.b.lumiere(63.2, 1.3, sasZ1 - 1.2, 0xffc070, 4, 10, "la lanterne du point de contrôle");
  for (const a of [0, 2.1, 4.2]) c.poutre([61.0, 1.5, sasZ0 + 0.7], [61.0 + Math.cos(a) * 0.4, 0, sasZ0 + 0.7 + Math.sin(a) * 0.4], 0.03, 0x2a2826, M.metal);
  c.boite(0.25, 0.2, 0.35, 0x2a2826, { x: 61.0, y: 1.6, z: sasZ0 + 0.7, ry: -0.6 }, M.lisse);
  // Le sas de décontamination : tunnel de toile sur arceaux
  const yP = 2.2;
  const yF = 3.1;
  for (let x = grille; x <= sasX1 + 0.01; x += (sasX1 - grille) / 4) {
    for (const z of [sasZ0, sasZ1]) c.tube([x, 0, z], [x, yP, z], 0.04, 0x9aa0a3, M.metal, 4);
    tentes.poutre([x, yP, sasZ0], [x, yF, (sasZ0 + sasZ1) / 2], 0.05, 0x9aa0a3, M.metal);
    tentes.poutre([x, yP, sasZ1], [x, yF, (sasZ0 + sasZ1) / 2], 0.05, 0x9aa0a3, M.metal);
  }
  for (const z of [sasZ0, sasZ1]) {
    c.pave(grille, 0, z - 0.03, sasX1, 1.0, z + 0.03, C.toileBlanche, MAT.toile(), { crasse: true });
    tentes.pave(grille, 1.0, z - 0.03, sasX1, yP, z + 0.03, C.toileBlanche, MAT.toile(), { crasse: false });
    tentes.pave(grille, 1.6, z - 0.04, sasX1, 1.85, z + 0.04, C.bleuSanitaire, MAT.toile(), { crasse: false });
  }
  const rampant = Math.hypot((sasZ1 - sasZ0) / 2, yF - yP);
  const pente = Math.atan2(yF - yP, (sasZ1 - sasZ0) / 2);
  for (const s of [-1, 1]) tentes.boite(sasX1 - grille + 0.3, 0.03, rampant + 0.1, C.toileBlanche, { x: (grille + sasX1) / 2, y: (yP + yF) / 2, z: (sasZ0 + sasZ1) / 2 + (s * (sasZ1 - sasZ0)) / 4, rx: s * pente }, MAT.toile(), { crasse: false });
  b.obstacle(grille, sasZ0, sasX1, sasZ0, "toile du sas");
  b.obstacle(grille, sasZ1, sasX1, sasZ1, "toile du sas");
  c.repere({ x: grille - 0.05, y: 2.55, z: (sasZ0 + sasZ1) / 2, ry: -Math.PI / 2 }, () => panneauDouble(c, M.enseignes, R.sas, {}, 1.8, 0.9));
  // dedans : l'arche de douche, les bacs, les bidons de désinfectant, les combinaisons jetées
  const xd = 68.4;
  for (const z of [sasZ0 + 0.4, sasZ1 - 0.4]) c.tube([xd, 0, z], [xd, 2.1, z], 0.035, 0xc8c8c4, M.metal, 5);
  c.tube([xd, 2.1, sasZ0 + 0.4], [xd, 2.1, sasZ1 - 0.4], 0.035, 0xc8c8c4, M.metal, 5);
  for (let i = 0; i < 4; i++) c.poser(cyl(0.05, 0.08, 6), M.metal, 0xc8c8c4, { x: xd, y: 2.02, z: sasZ0 + 1.0 + i * 0.75 }, { crasse: false });
  for (let i = 0; i < 3; i++) c.poser(cyl(0.18, 0.5, 8), M.satin, 0x3a6aaa, { x: 71.2 + i * 0.42, y: 0.25, z: sasZ1 - 0.35 }, {});
  rect(b, 71.6, sasZ1 - 0.35, 1.3, 0.4, 0, "bidons");
  c.pave(66.0, 0.0, sasZ0 + 0.3, 67.4, 0.22, sasZ0 + 1.0, 0x9ab0c8, M.lisse);
  for (let i = 0; i < 3; i++) c.boite(0.8, 0.05, 0.5, 0xe8e6e0, { x: 72.5 + c.entre(-0.8, 0.8), y: 0.04, z: (sasZ0 + sasZ1) / 2 + c.entre(-1, 1), ry: c.hasard() * 3 }, MAT.toile(), { crasse: false });
  // La tente de quarantaine : lits de camp, table de soins, perfusion
  const { x0: tx0, x1: tx1, z0: tz0, z1: tz1 } = tente;
  const yPt = 2.3;
  const yFt = 3.5;
  for (let x = tx0; x <= tx1 + 0.01; x += (tx1 - tx0) / 4) {
    for (const z of [tz0, tz1]) c.tube([x, 0, z], [x, yPt, z], 0.05, 0x9aa0a3, M.metal, 4);
    tentes.poutre([x, yPt, tz0], [x, yFt, (tz0 + tz1) / 2], 0.06, 0x9aa0a3, M.metal);
    tentes.poutre([x, yPt, tz1], [x, yFt, (tz0 + tz1) / 2], 0.06, 0x9aa0a3, M.metal);
  }
  for (const z of [tz0, tz1]) {
    c.pave(tx0, 0, z - 0.03, tx1, 1.0, z + 0.03, C.toileBlanche, MAT.toile());
    tentes.pave(tx0, 1.0, z - 0.03, tx1, yPt, z + 0.03, C.toileBlanche, MAT.toile(), { crasse: false });
    b.obstacle(tx0, z, tx1, z, "toile de la tente");
  }
  // pignons : ouest fermé, est ouvert (rabat relevé)
  c.pave(tx0 - 0.03, 0, tz0, tx0 + 0.03, 1.0, tz1, C.toileBlanche, MAT.toile());
  tentes.pave(tx0 - 0.03, 1.0, tz0, tx0 + 0.03, yPt, tz1, C.toileBlanche, MAT.toile(), { crasse: false });
  b.obstacle(tx0, tz0, tx0, tz1, "toile de la tente");
  const pe = -6.6;
  c.pave(tx1 - 0.03, 0, tz0, tx1 + 0.03, 1.0, pe - 0.8, C.toileBlanche, MAT.toile());
  c.pave(tx1 - 0.03, 0, pe + 0.8, tx1 + 0.03, 1.0, tz1, C.toileBlanche, MAT.toile());
  tentes.pave(tx1 - 0.03, 1.0, tz0, tx1 + 0.03, yPt, pe - 0.8, C.toileBlanche, MAT.toile(), { crasse: false });
  tentes.pave(tx1 - 0.03, 1.0, pe + 0.8, tx1 + 0.03, yPt, tz1, C.toileBlanche, MAT.toile(), { crasse: false });
  tentes.pave(tx1 - 0.03, 2.0, pe - 0.8, tx1 + 0.03, yPt, pe + 0.8, C.toileBlanche, MAT.toile(), { crasse: false });
  b.obstacle(tx1, tz0, tx1, pe - 0.8, "toile de la tente");
  b.obstacle(tx1, pe + 0.8, tx1, tz1, "toile de la tente");
  const rt = Math.hypot((tz1 - tz0) / 2, yFt - yPt);
  const pt = Math.atan2(yFt - yPt, (tz1 - tz0) / 2);
  for (const s of [-1, 1]) {
    const trou = s < 0 && u > 0.65;
    const lg = trou ? (tx1 - tx0) * 0.55 : tx1 - tx0 + 0.3;
    tentes.boite(lg, 0.03, rt + 0.1, C.toileBlanche, { x: trou ? tx0 + lg / 2 : (tx0 + tx1) / 2, y: (yPt + yFt) / 2, z: (tz0 + tz1) / 2 + (s * (tz1 - tz0)) / 4, rx: s * pt }, MAT.toile(), { crasse: false });
  }
  for (const [i, [x, z]] of [[66.9, -9.9], [68.8, -9.9], [70.7, -9.9], [72.6, -9.9], [66.9, -3.6], [68.8, -3.6], [70.7, -3.6]].entries()) {
    c.repere({ x, z, ry: Math.PI / 2 }, () => {
      c.boite(1.9, 0.06, 0.7, 0x5a6a4a, { y: 0.42 }, MAT.toile(), { crasse: false });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.boite(0.04, 0.42, 0.04, 0x9aa0a3, { x: sx * 0.85, y: 0.21, z: sz * 0.3 }, M.metal);
      if (i % 2 === 0) c.boite(1.2, 0.08, 0.72, [0x8a7a63, 0x6a7f9a, 0xa8443a][i % 3], { x: 0.2, y: 0.49, rz: 0.04 }, MAT.toile(), { crasse: false, nuance: 0.1 });
    });
    rect(b, x, z, 0.7, 1.9, 0, "lit de camp");
  }
  c.pave(74.4, 0.72, -10.9, 76.4, 0.76, -9.9, 0xd8d6cf, M.satin);
  for (let i = 0; i < 6; i++) c.boite(0.3, 0.18, 0.22, [0xe9e6dc, 0x58a06a, 0x4c6a9a][i % 3], { x: 74.7 + i * 0.28, y: 0.86, z: -10.4 + c.entre(-0.2, 0.2) }, M.satin, { crasse: false });
  rect(b, 75.4, -10.4, 2.0, 1.0, 0, "table de soins");
  c.tube([73.8, 0, -4.4], [73.8, 1.9, -4.4], 0.025, 0xc8c8c4, M.metal, 5);
  c.boite(0.18, 0.28, 0.06, 0xd8e8e0, { x: 73.8, y: 1.8, z: -4.3 }, M.lisse);
  c.poser(cyl(0.1, 1.0, 8), M.metal, 0x58a06a, { x: 75.8, y: 0.5, z: -3.0 }, {});
  // Cônes, rubalise, gants et masques par terre, le fourgon sanitaire
  for (const [x, z, k] of [[54.4, 4.6, false], [54.4, 10.4, false], [58.5, 3.4, true], [60, 11.8, false], [76.6, 4.4, false], [77.5, 10.6, true], [63, -12.6, false]]) cone(c, x, z, k);
  for (const [xa, za, xb, zb] of [[54.4, 4.6, 54.4, 3.0], [54.4, 10.4, 54.4, 12.0]]) c.pave(xa - 0.02, 0.6, Math.min(za, zb), xb + 0.02, 0.66, Math.max(za, zb), 0xc8362b, M.satin, { crasse: false });
  jonchee(c, 55, 3, 78, 12, Math.round(20 + 30 * u), [0xe9e6dc, 0x9ab0c8, 0x3a6aaa, 0xe8e6e0], 0.03);
  fourgon(ctx, 57.0, -8.4, 0.06);
  // Les épaves vers la sortie, le panneau de direction
  voiture(ctx, 88, 9.4, 0.05, { couleur: TEINTES_VOITURES[0] });
  voiture(ctx, 93.5, -9.6, Math.PI + 0.12, { couleur: TEINTES_VOITURES[3] });
  voiture(ctx, 52.5, -10.0, 0.4, { couleur: TEINTES_VOITURES[9], brulee: true });
  scooterLivraison(c, 81, 3.4, 1.1, true);
  panneauDirection(ctx, 95, -14.5, R.panEst);
  debris(c, 50, -12, 100, 12, Math.round(20 + 30 * u), [0x9aa0a3, 0xd8d4c4, 0x3a3b3c, 0xbfbab0], 0.03);
}

// ---------- Construction ----------

function recentrer(groupe, o, mobiles) {
  const vues = new Set();
  const bouge = new Set(mobiles);
  groupe.traverse((obj) => {
    let p = obj;
    while (p) {
      if (bouge.has(p)) return;
      p = p.parent;
    }
    if (obj.geometry && !vues.has(obj.geometry)) {
      vues.add(obj.geometry);
      obj.geometry.translate(-o.x, 0, -o.z);
    }
  });
  for (const m of mobiles) m.position.x -= o.x;
  const ud = groupe.userData;
  for (const t of ud.toits) {
    t.boite = { ...t.boite, x: arr(t.boite.x - o.x), z: arr(t.boite.z - o.z) };
    if (t.horsDe) t.horsDe = { ...t.horsDe, x: t.horsDe.x - o.x, z: t.horsDe.z - o.z };
  }
  const dedans = (x, z) => Math.abs(x) <= 25.5 && Math.abs(z) <= 35.5;
  const r2 = (v) => Math.round(v * 100) / 100;
  ud.obstacles = ud.obstacles
    .map((s) => ({ ...s, x1: r2(s.x1 - o.x), z1: r2(s.z1 - o.z), x2: r2(s.x2 - o.x), z2: r2(s.z2 - o.z) }))
    .filter((s) => dedans(s.x1, s.z1) || dedans(s.x2, s.z2));
  ud.lumieres = ud.lumieres.map((l) => ({ ...l, x: arr(l.x - o.x), z: arr(l.z - o.z) }));
  return groupe;
}

export function creer({ usure = 0.7, carte = "entree" } = {}) {
  const t = TRONCONS.find((k) => k.id === carte) ?? TRONCONS[0];
  const u = Math.max(0.1, Math.min(1, usure));
  const b = new Batiment(1871 + TRONCONS.indexOf(t) * 37, u);
  const x0 = t.x - 25;
  const x1 = t.x + 25;
  const ctx = { b, c: b.c, u, x0, x1, dans: (x) => x >= x0 && (x < x1 || (x1 === 100 && x <= 100)), mobiles: [] };
  ctx.hautN = b.couche("etages-nord", { x: t.x, z: (Z.fondN + Z.facN - 0.6) / 2, l: 50, p: Z.facN - Z.fondN - 0.6 }, 1.2, 24.5);
  // Les houppiers des platanes s'effacent quand ils cachent le personnage (chaussée nord)
  ctx.arbres = b.couche("platanes", { x: t.x, z: 0, l: 50, p: 12 }, 5.0, 13.5);
  ctx.hautS = b.couche("etages-sud", { x: t.x, z: (Z.fondS + Z.facS + 0.6) / 2, l: 50, p: Z.fondS - Z.facS - 0.6 }, 1.2, 24.5);

  sol(ctx);
  rue(ctx);
  rangee(ctx, "nord");
  rangee(ctx, "sud");
  if (t.id === "entree") troncon1(ctx);
  else if (t.id === "barricade") troncon2(ctx);
  else if (t.id === "coeur") troncon3(ctx);
  else troncon4(ctx);

  return recentrer(b.construire(), { x: t.x, z: 0 }, ctx.mobiles);
}
