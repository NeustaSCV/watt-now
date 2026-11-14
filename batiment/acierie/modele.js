// L'aciérie à l'arrêt et son haut fourneau (Book 20 §3.4 « Aciérie à l'arrêt », Zone industrielle, lointain, danger ●●●●).
//
// Inspiration : l'usine sidérurgique de Völklingen, les hauts fourneaux U4 d'Uckange et de Belval, Bethlehem Steel, le
// Landschaftspark Duisburg-Nord où les bouleaux ont pris les passerelles. Le squelette du haut fourneau n° 2 (45 m avec
// ses purgeurs) : la cuve rivetée, l'ossature et ses passerelles, l'escalier en zigzag dont la première volée est
// tombée, le gueulard et ses quatre prises de gaz coudées, la conduite descendante vers le pot à poussières, les trois
// cowpers et leur cheminée de 52 m, le plan incliné des skips. Au pied : la halle de coulée, ses rigoles de fonte
// figée, ses poches renversées et la fosse des torpilles. Plus loin, la laminerie : la longue nef, le four de
// réchauffage, les cinq cages du train, le refroidissoir et les piles de billettes (le trésor), puis les bâtiments du
// personnel : magasin des réfractaires, vestiaires, laboratoire, cantine et boutique du « Steel Experience ».
//
// Deux cartes qui partagent le même plan (« repère du site » : +x à l'est, +z au sud) ; chacune est recentrée sur son
// lot (voir `recentrer`) :
// - « fourneau » : le haut fourneau, les cowpers, la halle de coulée, l'accueil, la fosse des torpilles, le terril ;
// - « laminerie » : la halle de laminage et les bâtiments, le haut fourneau en silhouette au fond.

import * as THREE from "three";
import {
  Batiment, PALETTE, matiere, matiereMonde, matiereTexture, matiereLueur, matiereVerre, dessiner, aleatoire, taches, mur, lierre as lierreA,
  touffes, semerTouffes as semerA, gravats, debris as debrisA, jonchee as joncheeA, mousse, arbuste, arbre, raiDeLumiere as raiA, flaque, toitDeuxPans,
} from "../commun/atelier.js";

// La végétation et le petit désordre coûtent cher en triangles : on les dose.
const lierre = (c, x, y0, z, ry, l, h, n) => lierreA(c, x, y0, z, ry, l, h, Math.round(n * 0.5));
const semerTouffes = (c, x1, z1, x2, z2, n, t, y) => semerA(c, x1, z1, x2, z2, Math.round(n * 0.5), t, y);
const debris = (c, x1, z1, x2, z2, n, t, y) => debrisA(c, x1, z1, x2, z2, Math.round(n * 0.6), t, y);
const jonchee = (c, x1, z1, x2, z2, n, t, y) => joncheeA(c, x1, z1, x2, z2, Math.round(n * 0.6), t, y);
// Un seul matériau de lueur pour tous les rais et toutes les lueurs (l'opacité fait la clé du cache)
const raiDeLumiere = (c, a, b, l) => raiA(c, a, b, l, 0.1);

const PI = Math.PI;
const TAU = PI * 2;

// ---------- Le plan du site (repère « site ») ----------

const HF = { x: -30, z: -16 }; // l'axe du haut fourneau
const OSS = 8; // demi-côté de l'ossature
const NIV = [9, 15, 21, 27, 33]; // les passerelles (la dernière : le plancher du gueulard)
/** Le profil de la cuve [rayon, hauteur] : creuset, étalages, ventre, cuve, gueulard. */
const PROFIL = [[5.4, 2.5], [5.4, 3.9], [5.75, 4.0], [5.75, 5.5], [6.5, 9], [6.5, 12.5], [4.7, 25], [4.7, 28], [2.9, 30.6], [2.9, 32]];
const COWPERS = [-47, -36, -25];
const CZ = -32; // l'axe des cowpers
const CR = 4.2;
const CH = 28;
const CHEM = { x: -57.5, z: -31, h: 52 };
const DC = { x: -10, z: -31 }; // le pot à poussières
const SKIP0 = [-2, 0.4, -16];
const SKIP1 = [-27, 35.5, -16];
const HC = { x0: -46, x1: -14, z0: -8, z1: 9, h: 11, faite: 14 }; // la halle de coulée
const ACC = { x0: -12, x1: -2, z0: -2, z1: 8, h: 3.8 }; // l'accueil du Steel Experience (ancien poste de coulée)
const FOSSE_T = { x0: -48, x1: -8, z0: 10.5, z1: 15.5, prof: 4.1, rampe: 6 }; // la fosse des torpilles et sa rampe
const TORPILLES = [-36, -21];
const TERRIL = { x: -61, z: 15 };
const FOSSE_L = { x0: -55, x1: -47, z0: -8, z1: 1 }; // la fosse à laitier
const HL = { x0: 4, x1: 66, z0: -26, z1: -8, h: 12, faite: 15.5 }; // la halle de laminage
const BAT = { z0: 2, z1: 14, h: 3.8, x: [4, 18, 34, 46, 58, 70] }; // réfractaires, vestiaires, labo, cantine, boutique
const CAGES = [22.5, 27, 31.5, 36, 40.5];
const ORIGINES = { fourneau: { x: -33, z: -6 }, laminerie: { x: 36, z: -4 } };

function rayonHF(y) {
  if (y <= PROFIL[0][1]) return PROFIL[0][0];
  for (let i = 1; i < PROFIL.length; i++) {
    const [r1, y1] = PROFIL[i - 1];
    const [r2, y2] = PROFIL[i];
    if (y <= y2) return r1 + ((r2 - r1) * (y - y1)) / (y2 - y1);
  }
  return PROFIL[PROFIL.length - 1][0];
}

function arr(v) {
  return Math.round(v * 10) / 10;
}
function vers(carte, liste) {
  const o = ORIGINES[carte];
  return liste.map((p) => ({ ...p, x: arr(p.x - o.x), z: arr(p.z - o.z) }));
}

// ---------- La fiche ----------

const FOUILLE = [
  // Le fourneau
  { x: -38.5, z: -1.8, quoi: "forge des Charbonniers : creuset en graphite, pinces, ringards (outils de forge)" },
  { x: -28.6, z: -9.4, quoi: "trou de coulée : masse de bouchage (argile réfractaire), tiges de perçage (acier)" },
  { x: -35.8, z: -12.3, quoi: "tuyères tombées au pied du creuset : cuivre (lourd)" },
  { x: -27.8, z: 0.5, quoi: "rigole principale : fonte figée (à casser au marteau : ferraille de fonte)" },
  { x: -41, z: 4.8, quoi: "poche de coulée renversée : garnissage de briques réfractaires" },
  { x: -18.4, z: -2, quoi: "poche debout : croûte de fonte, tourillons d'acier" },
  { x: -4.5, z: -21, quoi: "sous les trémies : coke (excellent combustible de forge)" },
  { x: 1.6, z: -20.9, quoi: "tas d'agglomérés : minerai de fer, prêt pour un bas fourneau" },
  { x: -54, z: 9, quoi: "pied du terril : laitier concassé (remblai, amendement)" },
  { x: -50.5, z: -3, quoi: "fosse à laitier : laitier vitreux, sable de laitier" },
  { x: -20.5, z: 9.9, quoi: "bouche d'une torpille, depuis le bord de la fosse : briques réfractaires du garnissage" },
  { x: -10.6, z: 5, quoi: "accueil : lunettes AR (petite électronique, batteries)" },
  { x: -8, z: -1, quoi: "pupitres de l'ancien poste de coulée : relais, voyants, câbles" },
  { x: -10.4, z: -28.6, quoi: "sous le pot à poussières : poussier de gueulard (minerai fin)" },
  // La laminerie
  { x: 55, z: -12.6, quoi: "pile de billettes : acier en barres (lourd : 25 kg la barre)" },
  { x: 61.6, z: -11, quoi: "grande pile de billettes : acier en barres" },
  { x: 56, z: -18, quoi: "refroidissoir : ronds à béton, fers plats" },
  { x: 15.6, z: -14.5, quoi: "four de réchauffage : briques réfractaires (à démonter), portes en fonte" },
  { x: 31.5, z: -19.8, quoi: "cage de laminoir : coussinets de bronze, graisse" },
  { x: 48, z: -15.4, quoi: "cisaille : lames d'acier trempé" },
  { x: 33.5, z: -11.2, quoi: "cabine du lamineur : relais, voyants" },
  { x: 44, z: -3, quoi: "wagon plat : billettes arrimées (acier en barres)" },
  { x: 8, z: 7, quoi: "magasin : palettes de briques réfractaires" },
  { x: 14.5, z: 3.2, quoi: "rayonnages : creusets en graphite, creusets d'argile" },
  { x: 16.2, z: 12, quoi: "sacs d'argile réfractaire et de pisé" },
  { x: 21, z: 3.4, quoi: "casiers : combinaisons aluminisées, gants, casques" },
  { x: 30.4, z: 11.6, quoi: "camp des Charbonniers : braises, sac de coke" },
  { x: 38.5, z: 3.6, quoi: "paillasses : balance de précision, éprouvettes, flacons de réactifs" },
  { x: 44.5, z: 11.5, quoi: "échantillons d'acier, petits creusets de laboratoire" },
  { x: 53, z: 4, quoi: "comptoir de la cantine : conserves, sel, sucre" },
  { x: 63.6, z: 9.5, quoi: "présentoirs : porte-clés en acier « authentique » (ferraille légère), lingots souvenirs" },
  { x: 68.4, z: 5, quoi: "borne de la boutique : batterie, écran" },
];
const ETEINTS = [
  { x: -32.5, z: -4, type: "ancien habitant : fondeur en combinaison aluminisée (plancher de coulée)" },
  { x: -5.6, z: 3.5, type: "ancien habitant : guide du Steel Experience, lunettes AR sur le nez (accueil)" },
  { x: -12, z: -14, type: "errant (sous le plan incliné)" },
  { x: -50, z: -4.5, type: "rampant (dans la fosse à laitier)" },
  { x: -42.5, z: 6.5, type: "putréfié (contre la poche renversée)" },
  { x: -38, z: -19, type: "équipé : casque de fondeur et tablier de cuir (au pied du haut fourneau)" },
  { x: -54, z: 21, type: "errant (au pied du terril)" },
  { x: 33, z: -14, type: "ancien habitant : lamineur en bleu de travail (devant sa cabine)" },
  { x: 63, z: 7.5, type: "ancien habitant : vendeuse du Steel Experience en polo orange (boutique)" },
  { x: 45, z: -20, type: "rampant (sous la table à rouleaux)" },
  { x: 25, z: -2, type: "errant (cour)" },
  { x: 40, z: 8.5, type: "putréfié (laboratoire)" },
  { x: 12, z: 9.5, type: "errant (magasin des réfractaires)" },
];
const ENTREES = [
  { x: -29, z: 9.3, nature: "grande porte sud de la halle de coulée (bardage arraché)" },
  { x: -13.7, z: 2, nature: "baie est de la halle de coulée, face à l'accueil" },
  { x: -7, z: 8.3, nature: "porte de l'accueil Steel Experience (tourniquets)" },
  { x: -46.3, z: 4, nature: "porte ouest de la halle de coulée, vers le terril" },
  { x: -22, z: -13, nature: "sous l'ossature du haut fourneau, côté est" },
  { x: 66.3, z: -17, nature: "grande porte du pignon est de la halle de laminage (rideau arraché)" },
  { x: 20, z: -7.7, nature: "porte sud de la halle de laminage" },
  { x: 50, z: -7.7, nature: "baie sud de la halle (porte coulissante tombée)" },
  { x: 11, z: 14.3, nature: "porte de quai du magasin des réfractaires" },
  { x: 26, z: 14.3, nature: "porte des vestiaires" },
  { x: 40, z: 14.3, nature: "porte du laboratoire" },
  { x: 52, z: 14.3, nature: "porte de la cantine" },
  { x: 64, z: 14.3, nature: "porte de la boutique (vitrine brisée)" },
  { x: 8, z: 1.7, nature: "porte de service du magasin (côté cour)" },
];
const dans = (k) => (p) => {
  const o = ORIGINES[k.id];
  return Math.abs(p.x - o.x) <= k.lot.l / 2 && Math.abs(p.z - o.z) <= k.lot.p / 2;
};

const CARTES = [
  {
    id: "fourneau",
    nom: "Le haut fourneau et le plancher de coulée",
    lot: { l: 78, p: 66 },
    depart: { x: 23, z: 24 },
    description: "le squelette du haut fourneau, les cowpers et leur cheminée, le plan incliné, la halle de coulée, l'accueil du Steel Experience, la fosse des torpilles, le terril de laitier",
  },
  {
    id: "laminerie",
    nom: "La laminerie et les bâtiments",
    lot: { l: 80, p: 60 },
    depart: { x: -6, z: 26 },
    description: "la halle de laminage (four, cages, refroidissoir, billettes), le magasin des réfractaires, les vestiaires, le laboratoire, la cantine et la boutique ; le haut fourneau au fond",
  },
];
for (const k of CARTES) {
  k.fouille = vers(k.id, FOUILLE.filter(dans(k)));
  k.eteints = vers(k.id, ETEINTS.filter(dans(k)));
  k.entrees = vers(k.id, ENTREES.filter(dans(k)));
}

export const FICHE = {
  id: "acierie",
  nom: "L'aciérie et son haut fourneau",
  lieu: "Aciérie à l'arrêt · Zone industrielle · lointain",
  environnement: "zone industrielle",
  anneau: "lointain",
  danger: 4,
  recit:
    "Pendant un siècle, le haut fourneau n° 2 a craché sa fonte jour et nuit. L'Abondance l'a éteint pour le rouvrir en « Steel Experience » : on y vivait la coulée à travers des lunettes connectées, climatisé à 19 °C, avant de repartir avec un porte-clés en acier « authentique ». Les Charbonniers y reviennent chercher ce que la réalité augmentée n'a jamais su faire : des briques qui tiennent le feu, et de l'acier qu'on n'a pas à fondre.",
  inspiration: "l'usine sidérurgique de Völklingen, les hauts fourneaux U4 d'Uckange et de Belval, Bethlehem Steel, le Landschaftspark Duisburg-Nord",
  reperes: [
    "Le haut fourneau n° 2 : 45 m, la cuve rivetée, l'ossature et ses passerelles, le gueulard et ses quatre prises de gaz coudées, les purgeurs tout en haut",
    "L'escalier en zigzag dont la première volée est tombée au sol : les passerelles restent hors d'atteinte",
    "Les trois cowpers, la cheminée de 52 m, le pot à poussières et les conduites géantes ; le plan incliné des skips, un skip resté coincé à mi-pente",
    "La halle de coulée : le trou de coulée, la boucheuse et la foreuse, les rigoles de fonte figée, une poche renversée, une poche debout",
    "La fosse des torpilles : deux wagons-poches rouillés au fond de la tranchée",
    "La laminerie : le four de réchauffage, les cinq cages du train, la cisaille, le refroidissoir, le pont roulant et les piles de billettes",
    "Le magasin des réfractaires (palettes de briques, creusets), les vestiaires (combinaisons aluminisées), le laboratoire, la cantine",
    "Le « Steel Experience » : bornes « Vivez la chaleur sans la transpiration ! », lunettes AR pendues, tourniquets, boutique de porte-clés en acier « authentique », Burger Lingot",
    "Les bouleaux et les buddleias sur les passerelles et les toits ; le terril de laitier",
    "La nuit : la forge des Charbonniers rallumée dans un creuset, leur brasero dans les vestiaires, une lampe frontale tombée près des billettes",
  ],
  lot: CARTES[0].lot,
  depart: CARTES[0].depart,
  cartes: CARTES,
};

// ---------- Couleurs ----------

const C = {
  cuve: 0xa8968a, // tôle de la cuve, rouillée (la texture fait les dégradés orangés)
  cowper: 0xb3aba0,
  acier: 0x66707a, // charpente peinte gris-bleu, passée
  acierSombre: 0x4c4744,
  jaune: 0xb59c4e, // jaune industriel passé (pont roulant, garde-corps)
  grille: 0x45413c,
  rouille: PALETTE.rouille,
  rouilleSombre: PALETTE.rouilleSombre,
  orange: 0xc06a32,
  beton: 0xb0aba0,
  betonSombre: 0x8b867c,
  brique: 0x9a5a44,
  refractaire: 0xd6c29a,
  fonte: 0x4a4541,
  laitier: 0x7a746c,
  sable: 0xa49684,
  suie: 0x2c2926,
  cuivre: 0xb87440,
  graphite: 0x3a3836,
  alu: 0xd0d3d0,
  vert: 0x5d6f63,
  coke: 0x2b2927,
  minerai: 0x7c4733,
  bardage: 0xa8aca4,
  creme: 0xe2d9c4,
  blanc: 0xd8d4cc,
  bleuTravail: 0x4a5f78,
};

// ---------- Matériaux (tous partagés : un matériau = un appel de dessin) ----------

const memo = new Map();
function une(cle, f) {
  if (!memo.has(cle)) memo.set(cle, f());
  return memo.get(cle);
}
const M = {
  mat: () => matiere(0.95, 0),
  tole: () => matiere(0.75, 0.3),
  metal: () => matiere(0.4, 0.7),
  lisse: () => matiere(0.3, 0.05),
  beton: () => matiereMonde("beton"),
  brique: () => matiereMonde("brique"),
  carrelage: () => matiereMonde("carrelage"),
  verre: () => matiereVerre(PALETTE.verreSombre, 0.4),
  lueur: () => matiereLueur(0xfff0c8, 0.1),
  rouille: () =>
    une("rouille", () => {
      const m = matiereTexture(texRouille(), { roughness: 0.85, metalness: 0.25, flatShading: true });
      m.userData.tuile = 4;
      return m;
    }),
  bardage: () =>
    une("bardage", () => {
      const m = matiereTexture(texBardage(), { roughness: 0.8, metalness: 0.2 });
      m.userData.tuile = 4;
      return m;
    }),
  atlas: () =>
    une("atlas", () => {
      const m = new THREE.MeshStandardMaterial({ map: texAtlas(), vertexColors: true, transparent: true, alphaTest: 0.03, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      m.userData.sansOmbre = true;
      return m;
    }),
};

// ---------- Textures ----------

function coulures(g, a, n, l, h, lgMin, lgMax, couleur) {
  for (let i = 0; i < n; i++) {
    const x = a() * l;
    const y = a() * h;
    const lg = lgMin + a() * (lgMax - lgMin);
    const w = 1 + a() * 5;
    for (const dy of [0, -h]) {
      const d = g.createLinearGradient(0, y + dy, 0, y + dy + lg);
      d.addColorStop(0, couleur);
      d.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = d;
      g.fillRect(x, y + dy, w, lg);
    }
  }
}

function grain(g, a, n, l, h, force) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = a() < 0.5 ? `rgba(0,0,0,${force})` : `rgba(255,255,255,${force})`;
    g.fillRect(a() * l, a() * h, 1 + a() * 3, 1 + a() * 3);
  }
}

/** La tôle rivetée rongée de rouille : plaques d'un mètre, rivets, plaques orangées, coulures. Tuile de 4 m. */
function texRouille() {
  return dessiner("ac-rouille", 256, 256, (g) => {
    const a = aleatoire(501);
    g.fillStyle = "#d4cbc2";
    g.fillRect(0, 0, 256, 256);
    // Les dégradés orangés : de grandes plaques, des cœurs plus sombres, des éclats clairs
    taches(g, a, 30, "rgba(205,110,48,0.5)", 16, 64, 256, 256);
    taches(g, a, 22, "rgba(150,66,28,0.45)", 6, 28, 256, 256);
    taches(g, a, 14, "rgba(235,155,72,0.4)", 6, 22, 256, 256);
    // Ce qui reste de la peinture grise
    taches(g, a, 10, "rgba(200,200,196,0.5)", 8, 26, 256, 256);
    coulures(g, a, 46, 256, 256, 30, 140, "rgba(150,70,28,0.4)");
    coulures(g, a, 20, 256, 256, 20, 80, "rgba(60,40,30,0.3)");
    // Les plaques rivetées
    for (let y = 0; y < 256; y += 64) {
      g.fillStyle = "rgba(55,35,25,0.32)";
      g.fillRect(0, y, 256, 2);
      g.fillStyle = "rgba(60,38,26,0.45)";
      for (let x = 3; x < 256; x += 9) g.fillRect(x, y + 5, 2, 2);
    }
    for (let x = 0; x < 256; x += 128) {
      g.fillStyle = "rgba(55,35,25,0.3)";
      g.fillRect(x, 0, 2, 256);
    }
    grain(g, a, 2400, 256, 256, 0.06);
  });
}

/** Le bardage en tôle ondulée rouillée : ondes verticales, coulures orangées, plaques piquées. Tuile de 4 m. */
function texBardage() {
  return dessiner("ac-bardage", 128, 128, (g) => {
    const a = aleatoire(502);
    for (let x = 0; x < 128; x += 4) {
      const d = g.createLinearGradient(x, 0, x + 4, 0);
      d.addColorStop(0, "#c4c6c4");
      d.addColorStop(0.5, "#f4f4f2");
      d.addColorStop(1, "#9a9c9a");
      g.fillStyle = d;
      g.fillRect(x, 0, 4, 128);
    }
    taches(g, a, 10, "rgba(200,100,40,0.55)", 8, 30, 128, 128);
    coulures(g, a, 30, 128, 128, 20, 90, "rgba(196,96,36,0.55)");
    taches(g, a, 14, "rgba(150,64,28,0.5)", 3, 12, 128, 128);
    taches(g, a, 5, "rgba(90,50,30,0.4)", 3, 8, 128, 128);
    grain(g, a, 500, 128, 128, 0.05);
  });
}

// L'atlas des peintures et enseignes : une seule texture, un seul appel de dessin.
const ATLAS = {
  steel: [0, 0, 1024, 160],
  vivez: [0, 160, 512, 288],
  forges: [512, 160, 512, 128],
  portecles: [512, 288, 512, 160],
  hf2: [0, 448, 256, 96],
  danger: [256, 448, 128, 128],
  casque: [384, 448, 128, 128],
  parcours: [512, 448, 256, 64],
  accueil: [768, 448, 256, 64],
  refractaires: [512, 512, 256, 64],
  vestiaires: [768, 512, 256, 64],
  labo: [512, 576, 256, 64],
  cantine: [768, 576, 256, 64],
  burger: [0, 576, 256, 192],
  flamme: [256, 576, 128, 128],
  jours: [384, 576, 128, 128],
  ecran: [512, 640, 256, 128],
  tshirt: [768, 640, 256, 128],
  watty: [0, 768, 256, 256],
  lunettes: [256, 768, 256, 128],
  chapitre: [512, 768, 256, 128],
  boutique: [768, 768, 256, 128],
  graff: [256, 896, 512, 128],
};
const POLICE = '"Arial Black", "Helvetica Neue", Impact, sans-serif';
const FEUTRE = '"Marker Felt", "Chalkboard SE", "Comic Sans MS", cursive';
const CRAIE = '"Chalkboard SE", "Marker Felt", "Comic Sans MS", cursive';

function texte(g, t, x, y, largeurMax, taille, police, couleur, poids = "900") {
  g.font = `${poids} ${taille}px ${police}`;
  const w = g.measureText(t).width;
  if (w > largeurMax) g.font = `${poids} ${(taille * largeurMax) / w}px ${police}`;
  g.fillStyle = couleur;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(t, x, y);
}

function rectArrondi(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** La peinture s'en va : trous dans la couche (on voit le support derrière). */
function eroder(g, a, [x, y, w, h], n, rMin, rMax, force = 1) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < n; i++) {
    const px = x + a() * w;
    const py = y + a() * h;
    const r = rMin + a() * (rMax - rMin);
    const d = g.createRadialGradient(px, py, 0, px, py, r);
    d.addColorStop(0, `rgba(0,0,0,${force})`);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(px - r, py - r, r * 2, r * 2);
  }
  g.restore();
}

/** Salissures et coulures de rouille sur un panneau. */
function salir(g, a, [x, y, w, h], force = 0.3) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.translate(x, y);
  taches(g, a, 8, `rgba(120,80,50,${force})`, 6, Math.max(10, h * 0.4), w, h);
  coulures(g, a, 10, w, h, h * 0.2, h * 0.8, `rgba(130,70,35,${force})`);
  g.restore();
}

/** Une plaque émaillée : fond, liseré, texte. */
function plaque(g, a, region, fond, encre, lignes) {
  const [x, y, w, h] = region;
  g.fillStyle = fond;
  rectArrondi(g, x + 3, y + 3, w - 6, h - 6, 8);
  g.fill();
  g.strokeStyle = encre;
  g.lineWidth = 3;
  rectArrondi(g, x + 8, y + 8, w - 16, h - 16, 6);
  g.stroke();
  const n = lignes.length;
  lignes.forEach((t, i) => texte(g, t, x + w / 2, y + (h * (i + 1)) / (n + 1), w - 30, (h / (n + 1)) * 0.8, POLICE, encre));
  salir(g, a, region, 0.25);
  eroder(g, a, region, 14, 2, 7, 1);
}

/** Watty, la pile souriante (version autocollant). */
function dessinerWatty(g, cx, cy, s) {
  const w = s * 0.5;
  const h = s * 0.85;
  const x = cx - w / 2;
  const y = cy - h / 2;
  g.save();
  g.lineJoin = "round";
  g.lineCap = "round";
  g.strokeStyle = "#1f2526";
  g.lineWidth = s * 0.03;
  // Les bras : un salut, un pouce levé
  g.lineWidth = s * 0.05;
  g.beginPath();
  g.moveTo(x, y + h * 0.5);
  g.lineTo(x - s * 0.16, y + h * 0.25);
  g.moveTo(x + w, y + h * 0.5);
  g.lineTo(x + w + s * 0.15, y + h * 0.65);
  g.stroke();
  // Le corps
  g.lineWidth = s * 0.03;
  g.fillStyle = "#e9dfc6";
  rectArrondi(g, x, y, w, h, s * 0.08);
  g.fill();
  g.stroke();
  g.fillStyle = "#c8362b";
  g.save();
  rectArrondi(g, x, y, w, h, s * 0.08);
  g.clip();
  g.fillRect(x, y, w, h * 0.3);
  g.restore();
  g.fillStyle = "#1f2526";
  g.fillRect(cx - w * 0.18, y - s * 0.06, w * 0.36, s * 0.07);
  // Le visage : un clin d'œil, un grand sourire
  g.beginPath();
  g.arc(cx - w * 0.2, y + h * 0.48, s * 0.035, 0, TAU);
  g.fill();
  g.lineWidth = s * 0.025;
  g.beginPath();
  g.moveTo(cx + w * 0.1, y + h * 0.48);
  g.lineTo(cx + w * 0.3, y + h * 0.47);
  g.stroke();
  g.beginPath();
  g.arc(cx, y + h * 0.6, w * 0.25, 0.15 * PI, 0.85 * PI);
  g.stroke();
  // L'éclair
  g.fillStyle = "#e9dfc6";
  g.beginPath();
  g.moveTo(cx + 2, y + h * 0.04);
  g.lineTo(cx - w * 0.12, y + h * 0.17);
  g.lineTo(cx, y + h * 0.16);
  g.lineTo(cx - 4, y + h * 0.27);
  g.lineTo(cx + w * 0.13, y + h * 0.12);
  g.lineTo(cx + 1, y + h * 0.13);
  g.closePath();
  g.fill();
  g.restore();
}

/** Une flamme bombée (le signe des Charbonniers). */
function dessinerFlamme(g, cx, cy, s, couleur, coeur) {
  g.save();
  g.fillStyle = couleur;
  g.beginPath();
  g.moveTo(cx, cy - s * 0.5);
  g.bezierCurveTo(cx + s * 0.45, cy - s * 0.1, cx + s * 0.4, cy + s * 0.45, cx, cy + s * 0.48);
  g.bezierCurveTo(cx - s * 0.42, cy + s * 0.45, cx - s * 0.4, cy, cx - s * 0.1, cy - s * 0.2);
  g.bezierCurveTo(cx - s * 0.05, cy, cx + s * 0.05, cy - s * 0.2, cx, cy - s * 0.5);
  g.fill();
  if (coeur) {
    g.fillStyle = coeur;
    g.beginPath();
    g.ellipse(cx, cy + s * 0.22, s * 0.14, s * 0.2, 0, 0, TAU);
    g.fill();
  }
  g.restore();
}

/** Les lunettes de réalité augmentée, au trait. */
function dessinerLunettes(g, cx, cy, s, couleur) {
  g.save();
  g.strokeStyle = couleur;
  g.lineWidth = s * 0.07;
  rectArrondi(g, cx - s * 0.62, cy - s * 0.2, s * 0.56, s * 0.4, s * 0.12);
  g.stroke();
  rectArrondi(g, cx + s * 0.06, cy - s * 0.2, s * 0.56, s * 0.4, s * 0.12);
  g.stroke();
  g.beginPath();
  g.moveTo(cx - s * 0.06, cy - s * 0.05);
  g.lineTo(cx + s * 0.06, cy - s * 0.05);
  g.stroke();
  g.restore();
}

function texAtlas() {
  return dessiner(
    "ac-atlas",
    1024,
    1024,
    (g) => {
      const a = aleatoire(707);
      g.clearRect(0, 0, 1024, 1024);

      // --- La banderole « STEEL EXPERIENCE » ---
      {
        const r = ATLAS.steel;
        const [x, y, w, h] = r;
        const d = g.createLinearGradient(x, 0, x + w, 0);
        d.addColorStop(0, "#1f1d1c");
        d.addColorStop(0.55, "#3a1d14");
        d.addColorStop(1, "#b9461f");
        g.fillStyle = d;
        g.fillRect(x + 4, y + 4, w - 8, h - 8);
        // Le logo : une goutte de fonte dans des lunettes
        g.fillStyle = "#e07a2c";
        g.beginPath();
        g.arc(x + 90, y + 80, 56, 0, TAU);
        g.fill();
        dessinerLunettes(g, x + 90, y + 80, 70, "#1f1d1c");
        texte(g, "STEEL EXPERIENCE", x + 560, y + 66, 780, 92, POLICE, "#efe4cc");
        texte(g, "LE FEU. SANS LE FEU.", x + 560, y + 128, 600, 34, POLICE, "#e8933f");
        salir(g, a, r, 0.3);
        eroder(g, a, r, 90, 4, 22, 1);
      }

      // --- L'écran de la borne : « Vivez la chaleur sans la transpiration ! » ---
      {
        const r = ATLAS.vivez;
        const [x, y, w, h] = r;
        const d = g.createLinearGradient(0, y, 0, y + h);
        d.addColorStop(0, "#0f2a3a");
        d.addColorStop(1, "#103e4a");
        g.fillStyle = d;
        g.fillRect(x, y, w, h);
        g.fillStyle = "#e8933f";
        g.beginPath();
        g.arc(x + w / 2, y + 74, 44, 0, TAU);
        g.fill();
        dessinerLunettes(g, x + w / 2, y + 74, 60, "#0f2a3a");
        texte(g, "VIVEZ LA CHALEUR", x + w / 2, y + 150, 460, 46, POLICE, "#f2ead6");
        texte(g, "SANS LA TRANSPIRATION !", x + w / 2, y + 196, 470, 40, POLICE, "#f2ead6");
        texte(g, "Touchez l'écran pour commencer", x + w / 2, y + 246, 400, 22, '"Helvetica Neue", Arial, sans-serif', "#7fd8ff", "600");
        // Lignes de balayage et fêlure en étoile
        for (let yy = y; yy < y + h; yy += 4) {
          g.fillStyle = "rgba(0,0,0,0.12)";
          g.fillRect(x, yy, w, 1);
        }
        g.strokeStyle = "rgba(230,240,245,0.6)";
        g.lineWidth = 1.5;
        const cx = x + 380;
        const cy = y + 220;
        for (let k = 0; k < 9; k++) {
          const an = a() * TAU;
          let px = cx;
          let py = cy;
          g.beginPath();
          g.moveTo(px, py);
          for (let s = 0; s < 4; s++) {
            px += Math.cos(an + (a() - 0.5) * 0.6) * 30;
            py += Math.sin(an + (a() - 0.5) * 0.6) * 30;
            g.lineTo(px, py);
          }
          g.stroke();
        }
        g.fillStyle = "rgba(255,255,255,0.08)";
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + w * 0.45, y);
        g.lineTo(x, y + h * 0.7);
        g.fill();
      }

      // --- « FORGES ET ACIÉRIES DU VAL-NOIR », peint sur le pignon (le fond reste transparent) ---
      {
        const r = ATLAS.forges;
        const [x, y, w, h] = r;
        texte(g, "FORGES ET ACIÉRIES", x + w / 2, y + 44, w - 30, 52, POLICE, "rgba(232,226,210,0.92)");
        texte(g, "DU VAL-NOIR", x + w / 2, y + 98, w - 120, 44, POLICE, "rgba(232,226,210,0.92)");
        eroder(g, a, r, 260, 3, 14, 1);
      }

      // --- L'étiquette des porte-clés ---
      {
        const r = ATLAS.portecles;
        const [x, y, w, h] = r;
        g.fillStyle = "#efe6d0";
        g.fillRect(x + 4, y + 4, w - 8, h - 8);
        g.fillStyle = "#c8362b";
        g.fillRect(x + 4, y + 4, w - 8, 46);
        texte(g, "PORTE-CLÉS EN ACIER AUTHENTIQUE*", x + w / 2, y + 28, w - 30, 30, POLICE, "#efe6d0");
        // Le petit lingot
        g.fillStyle = "#8d969a";
        g.beginPath();
        g.moveTo(x + 40, y + 120);
        g.lineTo(x + 140, y + 120);
        g.lineTo(x + 124, y + 76);
        g.lineTo(x + 56, y + 76);
        g.closePath();
        g.fill();
        g.strokeStyle = "#c79a3b";
        g.lineWidth = 4;
        g.beginPath();
        g.arc(x + 90, y + 66, 12, 0, TAU);
        g.stroke();
        texte(g, "19,90", x + 330, y + 96, 260, 64, POLICE, "#c8362b");
        texte(g, "*acier certifié authentique par nos soins", x + w / 2, y + 140, w - 40, 18, '"Helvetica Neue", Arial, sans-serif', "#4a4440", "600");
        salir(g, a, r, 0.2);
      }

      // --- Plaques émaillées ---
      plaque(g, a, ATLAS.hf2, "#2a4a6e", "#e9e4d6", ["HAUT FOURNEAU N° 2"]);
      plaque(g, a, ATLAS.parcours, "#d8b23a", "#1f1d1c", ["PARCOURS AR  ▶"]);
      plaque(g, a, ATLAS.accueil, "#2f6f73", "#efe6d0", ["ACCUEIL · STEEL EXPERIENCE"]);
      plaque(g, a, ATLAS.refractaires, "#2a4a6e", "#e9e4d6", ["MAGASIN DES RÉFRACTAIRES"]);
      plaque(g, a, ATLAS.vestiaires, "#2a4a6e", "#e9e4d6", ["VESTIAIRES · DOUCHES"]);
      plaque(g, a, ATLAS.labo, "#2a4a6e", "#e9e4d6", ["LABORATOIRE DE CONTRÔLE"]);
      plaque(g, a, ATLAS.cantine, "#c79a3b", "#2a2422", ["CANTINE"]);

      // --- Danger : fonte en fusion ---
      {
        const [x, y, w, h] = ATLAS.danger;
        g.fillStyle = "#e0b83a";
        g.strokeStyle = "#1f1d1c";
        g.lineWidth = 7;
        g.beginPath();
        g.moveTo(x + w / 2, y + 10);
        g.lineTo(x + w - 10, y + 96);
        g.lineTo(x + 10, y + 96);
        g.closePath();
        g.fill();
        g.stroke();
        texte(g, "!", x + w / 2, y + 66, 40, 50, POLICE, "#1f1d1c");
        texte(g, "FONTE EN FUSION", x + w / 2, y + 114, w - 8, 15, POLICE, "#e9e4d6");
        eroder(g, a, ATLAS.danger, 10, 2, 6, 1);
      }
      // --- Casque obligatoire ---
      {
        const [x, y, w, h] = ATLAS.casque;
        g.fillStyle = "#2a5a9a";
        g.beginPath();
        g.arc(x + w / 2, y + 54, 48, 0, TAU);
        g.fill();
        g.fillStyle = "#efe6d0";
        g.beginPath();
        g.arc(x + w / 2, y + 62, 26, PI, 0);
        g.fill();
        g.fillRect(x + w / 2 - 34, y + 60, 68, 8);
        texte(g, "CASQUE OBLIGATOIRE", x + w / 2, y + 116, w - 8, 14, POLICE, "#e9e4d6");
        eroder(g, a, ATLAS.casque, 10, 2, 6, 1);
      }

      // --- Le menu de la cantine (ardoise) ---
      {
        const r = ATLAS.burger;
        const [x, y, w, h] = r;
        g.fillStyle = "#2b2f2c";
        g.fillRect(x + 4, y + 4, w - 8, h - 8);
        g.strokeStyle = "#7a5a3c";
        g.lineWidth = 8;
        g.strokeRect(x + 4, y + 4, w - 8, h - 8);
        texte(g, "MENU STEEL EXPERIENCE", x + w / 2, y + 30, w - 30, 20, CRAIE, "#f0ead8", "700");
        texte(g, "Burger Lingot ........ 24,90", x + w / 2, y + 70, w - 30, 18, CRAIE, "#f0ead8", "400");
        texte(g, "(pain à la feuille d'or)", x + w / 2, y + 92, w - 60, 13, CRAIE, "#e8b04a", "400");
        texte(g, "Frites coulée continue .. 6,50", x + w / 2, y + 122, w - 30, 18, CRAIE, "#f0ead8", "400");
        texte(g, "Soda Haut Fourneau ..... 4,90", x + w / 2, y + 152, w - 30, 18, CRAIE, "#f0ead8", "400");
        eroder(g, a, r, 30, 3, 10, 0.6);
      }
      // --- La flamme des Charbonniers (bombe) ---
      {
        const [x, y, w, h] = ATLAS.flamme;
        dessinerFlamme(g, x + w / 2, y + h / 2, 110, "rgba(226,108,36,0.92)", "rgba(250,200,90,0.9)");
        eroder(g, a, ATLAS.flamme, 30, 2, 6, 0.8);
      }
      // --- « Jours sans accident » ---
      {
        const r = ATLAS.jours;
        const [x, y, w, h] = r;
        g.fillStyle = "#e9e4d6";
        g.fillRect(x + 4, y + 4, w - 8, h - 8);
        g.fillStyle = "#2f6f73";
        g.fillRect(x + 4, y + 4, w - 8, 30);
        texte(g, "JOURS SANS ACCIDENT", x + w / 2, y + 19, w - 16, 13, POLICE, "#e9e4d6");
        texte(g, "4 312", x + w / 2, y + 66, w - 20, 40, POLICE, "#2a2422");
        g.fillStyle = "#e8933f";
        g.save();
        g.translate(x + w / 2, y + 104);
        g.rotate(-0.12);
        g.fillRect(-56, -12, 112, 24);
        texte(g, "0 brûlure garantie !", 0, 0, 104, 13, POLICE, "#1f1d1c");
        g.restore();
        salir(g, a, r, 0.25);
      }
      // --- Un écran mort ---
      {
        const [x, y, w, h] = ATLAS.ecran;
        g.fillStyle = "#3c3f40";
        g.fillRect(x, y, w, h);
        g.fillStyle = "#121516";
        g.fillRect(x + 10, y + 10, w - 20, h - 20);
        g.fillStyle = "rgba(255,255,255,0.08)";
        g.beginPath();
        g.moveTo(x + 10, y + 10);
        g.lineTo(x + 120, y + 10);
        g.lineTo(x + 10, y + 100);
        g.fill();
        g.strokeStyle = "rgba(200,210,215,0.45)";
        g.lineWidth = 1.2;
        g.beginPath();
        g.moveTo(x + 160, y + 20);
        g.lineTo(x + 140, y + 60);
        g.lineTo(x + 170, y + 90);
        g.lineTo(x + 150, y + 118);
        g.stroke();
      }
      // --- Le T-shirt ---
      {
        const [x, y, w, h] = ATLAS.tshirt;
        g.fillStyle = "#2b2b2e";
        g.fillRect(x, y, w, h);
        dessinerFlamme(g, x + 46, y + 64, 70, "#e07a2c", "#f0c060");
        texte(g, "J'AI SURVÉCU", x + 150, y + 44, 170, 26, POLICE, "#efe6d0");
        texte(g, "À 1 500 °C", x + 150, y + 76, 170, 30, POLICE, "#e8933f");
        texte(g, "(en réalité augmentée)", x + 150, y + 104, 170, 14, '"Helvetica Neue", Arial, sans-serif', "#bdb6a6", "600");
      }
      // --- Watty, partenaire énergie officiel ---
      {
        const r = ATLAS.watty;
        const [x, y, w, h] = r;
        g.fillStyle = "#e9dfc6";
        g.beginPath();
        g.arc(x + w / 2, y + h / 2, 122, 0, TAU);
        g.fill();
        g.strokeStyle = "#c8362b";
        g.lineWidth = 10;
        g.stroke();
        dessinerWatty(g, x + w / 2, y + 112, 130);
        texte(g, "PARTENAIRE ÉNERGIE", x + w / 2, y + 196, 180, 18, POLICE, "#c8362b");
        texte(g, "OFFICIEL", x + w / 2, y + 218, 120, 18, POLICE, "#c8362b");
        salir(g, a, r, 0.3);
        eroder(g, a, r, 40, 4, 14, 1);
      }
      // --- Les lunettes AR ---
      {
        const r = ATLAS.lunettes;
        const [x, y, w, h] = r;
        g.fillStyle = "#1f2a30";
        g.fillRect(x + 4, y + 4, w - 8, h - 8);
        dessinerLunettes(g, x + 54, y + 64, 70, "#7fd8ff");
        texte(g, "LUNETTES AR", x + 165, y + 44, 150, 24, POLICE, "#efe6d0");
        texte(g, "Merci de les raccrocher", x + 165, y + 76, 150, 15, '"Helvetica Neue", Arial, sans-serif', "#bdd6de", "600");
        texte(g, "après la visite", x + 165, y + 96, 150, 15, '"Helvetica Neue", Arial, sans-serif', "#bdd6de", "600");
        salir(g, a, r, 0.2);
      }
      // --- Chapitre 3 : le laminage ---
      {
        const r = ATLAS.chapitre;
        const [x, y, w, h] = r;
        g.fillStyle = "#efe6d0";
        g.fillRect(x + 4, y + 4, w - 8, h - 8);
        g.fillStyle = "#b9461f";
        g.fillRect(x + 4, y + 4, w - 8, 34);
        texte(g, "CHAPITRE 3 : LE LAMINAGE", x + w / 2, y + 22, w - 20, 18, POLICE, "#efe6d0");
        texte(g, "Ici, l'acier devenait barre.", x + w / 2, y + 64, w - 24, 17, '"Helvetica Neue", Arial, sans-serif', "#2a2422", "700");
        texte(g, "Regardez-le couler…", x + w / 2, y + 88, w - 24, 17, '"Helvetica Neue", Arial, sans-serif', "#2a2422", "700");
        texte(g, "dans vos lunettes !", x + w / 2, y + 110, w - 24, 17, '"Helvetica Neue", Arial, sans-serif', "#b9461f", "700");
        salir(g, a, r, 0.25);
        eroder(g, a, r, 16, 3, 9, 1);
      }
      // --- L'enseigne de la boutique ---
      {
        const r = ATLAS.boutique;
        const [x, y, w, h] = r;
        g.fillStyle = "#1f1d1c";
        g.fillRect(x + 4, y + 4, w - 8, h - 8);
        texte(g, "BOUTIQUE", x + w / 2, y + 48, w - 30, 46, POLICE, "#e8933f");
        texte(g, "Souvenirs en acier authentique", x + w / 2, y + 96, w - 30, 17, '"Helvetica Neue", Arial, sans-serif', "#efe6d0", "700");
        eroder(g, a, r, 30, 3, 12, 1);
      }
      // --- Le graffiti des Charbonniers ---
      {
        const r = ATLAS.graff;
        const [x, y, w, h] = r;
        dessinerFlamme(g, x + 60, y + 64, 100, "rgba(226,108,36,0.9)", null);
        g.save();
        g.translate(x + 290, y + 66);
        g.rotate(-0.05);
        texte(g, "LE FEU, LE VRAI.", 0, 0, 380, 64, FEUTRE, "rgba(236,230,214,0.9)", "700");
        g.restore();
        eroder(g, a, r, 70, 2, 7, 0.8);
      }
    },
    false,
  );
}

// ---------- Petits outils de géométrie ----------

const ICO = new THREE.IcosahedronGeometry(1, 0);
const CAILLOU = new THREE.DodecahedronGeometry(0.5, 0);
const PANICULE = new THREE.ConeGeometry(0.09, 0.45, 4).translate(0, 0.2, 0);

/** Un panneau peint de l'atlas, posé à plat contre une face (le plan regarde +z, tourné de `ry`). */
function panneau(c, region, x, y, z, l, h, ry = 0, rx = 0) {
  const [px, py, pw, ph] = ATLAS[region];
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / 1024, 1 - (py + (1 - uv.getY(i)) * ph) / 1024);
  c.poser(g, M.atlas(), 0xffffff, { x, y, z, ry, rx }, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Un cylindre couché le long de x (de x1 à x2). */
function cylX(c, x1, x2, y, z, r, couleur, mat, cotes = 12, ouvert = false) {
  const g = new THREE.CylinderGeometry(r, r, Math.abs(x2 - x1), cotes, 1, ouvert);
  c.poser(g, mat, couleur, { x: (x1 + x2) / 2, y, z, rz: PI / 2 });
  g.dispose();
}

/** Un cylindre couché le long de z (de z1 à z2). */
function cylZ(c, x, y, z1, z2, r, couleur, mat, cotes = 12, ouvert = false) {
  const g = new THREE.CylinderGeometry(r, r, Math.abs(z2 - z1), cotes, 1, ouvert);
  c.poser(g, mat, couleur, { x, y, z: (z1 + z2) / 2, rx: PI / 2 });
  g.dispose();
}

/** Un cylindre (ou tronc de cône) debout. */
function cylY(c, x, z, y1, y2, r1, r2, couleur, mat, cotes = 8, ouvert = false) {
  const g = new THREE.CylinderGeometry(r2, r1, y2 - y1, cotes, 1, ouvert);
  c.poser(g, mat, couleur, { x, y: (y1 + y2) / 2, z });
  g.dispose();
}

/** Une surface de révolution autour de l'axe (x, z) : profil [[rayon, hauteur], …]. */
function revolution(c, x, z, profil, cotes, couleur, mat) {
  const g = new THREE.LatheGeometry(profil.map(([r, y]) => new THREE.Vector2(r, y)), cotes);
  c.poser(g, mat, couleur, { x, z });
  g.dispose();
}

/** Un dôme (demi-sphère aplatie). */
function dome(c, x, y, z, r, aplat, couleur, mat, cotes = 12) {
  const g = new THREE.SphereGeometry(r, cotes, 4, 0, TAU, 0, PI / 2);
  c.poser(g, mat, couleur, { x, y, z, e: [1, aplat, 1] });
  g.dispose();
}

/** Un tuyau qui suit une ligne brisée, avec des coudes et des brides. */
function tuyau(c, pts, r, couleur, mat = M.rouille(), cotes = 8) {
  for (let i = 0; i < pts.length - 1; i++) {
    c.tube(pts[i], pts[i + 1], r, couleur, mat, cotes);
    const a = new THREE.Vector3(...pts[i]);
    const b = new THREE.Vector3(...pts[i + 1]);
    const d = b.clone().sub(a).normalize();
    if (b.distanceTo(a) > 3) {
      const p = a.clone().addScaledVector(d, 0.45);
      c.tube(p.toArray(), p.clone().addScaledVector(d, 0.14).toArray(), r * 1.18, couleur, mat, cotes);
    }
    if (i > 0) c.poser(ICO, mat, couleur, { x: pts[i][0], y: pts[i][1], z: pts[i][2], e: r * 1.12 });
  }
}

/** Les quatre côtés d'un rectangle comme obstacles. */
function obstacleRect(b, x1, z1, x2, z2, nature) {
  b.obstacle(x1, z1, x2, z1, nature);
  b.obstacle(x2, z1, x2, z2, nature);
  b.obstacle(x2, z2, x1, z2, nature);
  b.obstacle(x1, z2, x1, z1, nature);
}

/** Un cercle d'obstacles (polygone à n côtés). */
function obstacleCercle(b, x, z, r, n, nature, rz = r) {
  for (let i = 0; i < n; i++) {
    const a1 = (i / n) * TAU;
    const a2 = ((i + 1) / n) * TAU;
    b.obstacle(x + r * Math.cos(a1), z + rz * Math.sin(a1), x + r * Math.cos(a2), z + rz * Math.sin(a2), nature);
  }
}

/** Un poteau en I (âme et deux ailes), de y0 à y1 ; `ry` oriente les ailes. */
function poteauI(c, x, z, y0, y1, s, couleur, ry = 0, mat = M.tole()) {
  c.repere({ x, z, ry }, () => {
    const h = y1 - y0;
    const ym = (y0 + y1) / 2;
    c.boite(s * 0.14, h, s, couleur, { y: ym }, mat);
    c.boite(s * 0.75, h, s * 0.1, couleur, { y: ym, z: s / 2 }, mat);
    c.boite(s * 0.75, h, s * 0.1, couleur, { y: ym, z: -s / 2 }, mat);
  });
}

/** Un garde-corps le long d'une ligne brisée [[x, z], …] posé à y0 : montants, lisse, sous-lisse. */
function gardeCorps(c, pts, y0, couleur = C.jaune, h = 1.1, pas = 1.8) {
  const mat = M.tole();
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, z1] = pts[i];
    const [x2, z2] = pts[i + 1];
    const L = Math.hypot(x2 - x1, z2 - z1);
    const n = Math.max(1, Math.ceil(L / pas));
    for (let k = i === 0 ? 0 : 1; k <= n; k++) {
      const t = k / n;
      c.poutre([x1 + (x2 - x1) * t, y0, z1 + (z2 - z1) * t], [x1 + (x2 - x1) * t, y0 + h, z1 + (z2 - z1) * t], 0.05, couleur, mat);
    }
    c.poutre([x1, y0 + h, z1], [x2, y0 + h, z2], 0.055, couleur, mat);
    c.poutre([x1, y0 + h * 0.5, z1], [x2, y0 + h * 0.5, z2], 0.04, couleur, mat);
  }
}

/** Un garde-corps circulaire (rayon r autour de x, z). */
function gardeCorpsRond(c, x, z, r, y0, n = 14, couleur = C.jaune) {
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push([x + r * Math.cos((i / n) * TAU), z + r * Math.sin((i / n) * TAU)]);
  gardeCorps(c, pts, y0, couleur, 1.05, 20);
}

/** Un escalier métallique droit qui monte selon +x local (repère x, z, ry), de y0 à y1, de largeur l. */
function escalier(c, x, z, ry, y0, y1, l, couleur = C.acier) {
  const n = Math.round((y1 - y0) / 0.2);
  const g = 0.26;
  const L = n * g;
  const mat = M.tole();
  c.repere({ x, z, ry }, () => {
    for (const s of [-1, 1]) {
      c.poutre([0, y0, (s * l) / 2], [L, y1, (s * l) / 2], 0.12, couleur, mat);
      c.poutre([0, y0 + 0.95, (s * l) / 2], [L, y1 + 0.95, (s * l) / 2], 0.05, C.jaune, mat);
      for (let k = 0; k <= n; k += 5) c.poutre([k * g, y0 + k * 0.2, (s * l) / 2], [k * g, y0 + k * 0.2 + 0.95, (s * l) / 2], 0.045, C.jaune, mat);
    }
    for (let k = 1; k <= n; k++) c.boite(0.24, 0.035, l - 0.1, C.grille, { x: k * g - 0.12, y: y0 + k * 0.2 - 0.02 }, mat, { nuance: 0.03 });
  });
}

/** Une échelle verticale le long d'une paroi, de y0 à y1 ; `d` = [dx, dz] : la direction qui s'écarte de la paroi. */
function echelle(c, x, z, y0, y1, d, couleur = C.acierSombre) {
  const mat = M.tole();
  const t = [-d[1], d[0]];
  const P = (y, s, e = 0.2) => [x + t[0] * 0.22 * s + d[0] * e, y, z + t[1] * 0.22 * s + d[1] * e];
  for (const s of [-1, 1]) c.poutre(P(y0, s), P(y1, s), 0.06, couleur, mat);
  for (let y = y0 + 0.4; y < y1; y += 0.9) c.poutre(P(y, -1), P(y, 1), 0.035, couleur, mat);
  // La crinoline, simplifiée : des arceaux en trois traits, reliés par une barre
  for (let y = y0 + 2.6; y < y1; y += 2.4) {
    const a = P(y, -1.6, 0.25);
    const b = P(y, -1.6, 0.9);
    const e = P(y, 1.6, 0.9);
    const f = P(y, 1.6, 0.25);
    c.poutre(a, b, 0.04, couleur, mat);
    c.poutre(b, e, 0.04, couleur, mat);
    c.poutre(e, f, 0.04, couleur, mat);
  }
  c.poutre(P(y0 + 2.6, 0, 0.9), P(y1, 0, 0.9), 0.035, couleur, mat);
}

/** Une butte bosselée (terril, tas de coke) : icosaèdre déformé, posé à moitié dans le sol. */
function butte(c, x, z, l, h, p, couleur, detail = 1, graine = 1, mat = M.mat()) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const py = pos.getY(i);
    const pz = pos.getZ(i);
    const n = 0.5 * Math.sin(px * 3.1 + graine) * Math.cos(pz * 2.7 - graine) + 0.5 * Math.sin((px + pz) * 5.3 + py * 4.1 + graine * 2);
    const f = 1 + 0.16 * n;
    pos.setXYZ(i, px * f, py * f, pz * f);
  }
  g.computeVertexNormals();
  c.poser(g, mat, couleur, { x, y: -h * 0.25, z, e: [l, h, p] }, { nuance: 0.05 });
  g.dispose();
}

/** Un buddleia : touffe gris-vert et grappes mauves (l'arbre aux papillons des friches). */
function buddleia(c, x, z, s = 1, y = 0) {
  arbuste(c, x, z, s, y, [0x7f9470, 0x6f8a62, 0x8ea07a]);
  for (let i = 0; i < 6; i++) {
    const a = c.hasard() * TAU;
    const r = c.entre(0.15, 0.5) * s;
    c.poser(PANICULE, M.mat(), i % 2 ? 0x8d5fa8 : 0xa47cbc, { x: x + Math.cos(a) * r, y: y + s * c.entre(0.95, 1.4), z: z + Math.sin(a) * r, rx: Math.sin(a) * 0.7, rz: -Math.cos(a) * 0.7, e: s * c.entre(0.9, 1.4) }, { crasse: false, nuance: 0.08 });
  }
}

/** Une borne du « Steel Experience » : socle blanc, écran incliné, petit panneau solaire ; `lueur` : l'écran luit encore. */
function borne(c, x, z, ry, lueur = false) {
  c.repere({ x, z, ry }, () => {
    c.boite(0.55, 1.05, 0.4, C.blanc, { y: 0.52 }, M.lisse());
    c.boite(0.62, 0.06, 0.46, 0xe07a2c, { y: 1.06 }, M.lisse());
    c.boite(0.78, 0.5, 0.08, 0x2a2c2e, { y: 1.38, z: 0.05, rx: -0.35 }, M.lisse());
    panneau(c, "vivez", 0, 1.385, 0.1, 0.7, 0.42, 0, -0.35);
    if (lueur) c.boite(0.72, 0.44, 0.01, 0x7fd8ff, { y: 1.39, z: 0.12, rx: -0.35 }, M.lueur(), { crasse: false, nuance: 0 });
    c.poutre([0.2, 1.05, -0.15], [0.2, 2.0, -0.15], 0.04, C.acierSombre, M.metal());
    c.boite(0.6, 0.03, 0.4, 0x2a3a5a, { x: 0.2, y: 2.02, z: -0.1, rx: 0.4 }, M.lisse()); // le panneau solaire qui l'alimente encore
  });
}

/** Des lunettes AR pendues à une tringle : chacune au bout de son cordon, à des hauteurs différentes. */
function lunettesPendues(c, x, z, ry, n = 7, h = 2.3) {
  c.repere({ x, z, ry }, () => {
    c.poutre([-n * 0.16, h, 0], [n * 0.16, h, 0], 0.05, C.acierSombre, M.metal());
    for (const s of [-1, 1]) c.poutre([s * n * 0.16, 0, 0], [s * n * 0.16, h, 0], 0.06, C.blanc, M.lisse());
    for (let i = 0; i < n; i++) {
      if (c.hasard() < 0.2) continue; // une paire a disparu
      const px = -n * 0.16 + (i + 0.5) * 0.32;
      const y = h - c.entre(0.5, 0.95);
      c.poutre([px, h, 0], [px, y + 0.04, 0], 0.012, 0x2a2a2a, M.mat());
      c.boite(0.17, 0.06, 0.05, 0x1e2124, { x: px, y, z: 0, ry: c.entre(-0.5, 0.5) }, M.lisse());
      c.boite(0.15, 0.035, 0.01, 0x5fb6d8, { x: px, y, z: 0.03, ry: c.entre(-0.4, 0.4) }, M.lisse(), { crasse: false });
    }
  });
}

/** Une poche de coulée : cuve tronconique ouverte, garnissage réfractaire, tourillons, bec. Dans le repère (bas au sol). */
function poche(c, couleur = C.cuve) {
  const R = M.rouille();
  const g = new THREE.CylinderGeometry(1.75, 1.45, 3.2, 12, 1, true);
  c.poser(g, R, couleur, { y: 1.6 });
  // Le garnissage, vu de l'intérieur (l'échelle négative retourne les faces)
  c.poser(g, M.brique(), C.refractaire, { y: 1.65, e: [-0.9, 0.98, 0.9] });
  g.dispose();
  cylY(c, 0, 0, 0, 0.12, 1.45, 1.45, couleur, R, 12);
  cylY(c, 0, 0, 3.12, 3.3, 1.82, 1.82, C.acierSombre, M.tole(), 12, true);
  for (const s of [-1, 1]) {
    cylX(c, s * 1.6, s * 2.05, 2.3, 0, 0.26, C.acierSombre, M.tole(), 8);
    c.boite(0.25, 1.4, 0.5, C.acierSombre, { x: s * 1.62, y: 2.1 }, M.tole());
  }
  c.boite(0.7, 0.3, 0.8, C.acierSombre, { x: 0, y: 3.2, z: 1.85, rx: -0.3 }, M.tole()); // le bec
  for (const y of [0.8, 1.6]) cylY(c, 0, 0, y, y + 0.14, 1.52 + (y / 3.2) * 0.3, 1.52 + (y / 3.2) * 0.3, C.acierSombre, M.tole(), 12, true);
}

/** Une torpille (wagon-poche) le long de x, centrée en (x, y, z). */
function torpille(c, x, y, z) {
  const R = M.rouille();
  cylX(c, x - 3, x + 3, y, z, 1.6, C.cuve, R, 14, true);
  for (const s of [-1, 1]) {
    const g = new THREE.CylinderGeometry(1.0, 1.6, 2.6, 14, 1, true);
    c.poser(g, R, C.cuve, { x: x + s * 4.3, y, z, rz: -s * PI / 2 });
    g.dispose();
    cylX(c, x + s * 5.6, x + s * 6.1, y, z, 1.0, C.acierSombre, M.tole(), 14);
    cylX(c, x + s * 6.1, x + s * 6.5, y, z, 0.45, C.acierSombre, M.tole(), 8);
    // Le bogie : châssis, roues, tampons
    c.pave(x + s * 5.0, y - 2.0, z - 1.0, x + s * 7.4, y - 1.4, z + 1.0, 0x3a3532, M.tole());
    c.pave(x + s * 5.9, y - 1.4, z - 0.5, x + s * 6.7, y - 0.4, z + 0.5, 0x3a3532, M.tole());
    for (const dx of [5.4, 7.0])
      for (const dz of [-0.72, 0.72]) {
        const gr = new THREE.CylinderGeometry(0.42, 0.42, 0.12, 10);
        c.poser(gr, M.tole(), 0x3a3532, { x: x + s * dx, y: y - 2.08, z: z + dz, rx: PI / 2 });
        gr.dispose();
      }
    c.poutre([x + s * 7.4, y - 1.7, z - 0.6], [x + s * 7.9, y - 1.7, z - 0.6], 0.16, 0x3a3532, M.tole());
    c.poutre([x + s * 7.4, y - 1.7, z + 0.6], [x + s * 7.9, y - 1.7, z + 0.6], 0.16, 0x3a3532, M.tole());
  }
  // Les cerclages et la bouche, avec sa coulée de fonte figée
  for (const dx of [-2.2, 0, 2.2]) cylX(c, x + dx - 0.08, x + dx + 0.08, y, z, 1.66, C.acierSombre, M.tole(), 14, true);
  cylY(c, x, z, y + 1.3, y + 2.0, 0.62, 0.62, C.acierSombre, M.tole(), 10, true);
  cylY(c, x, z, y + 1.95, y + 2.05, 0.72, 0.72, C.fonte, M.metal(), 10);
  for (let i = 0; i < 4; i++) c.poser(CAILLOU, M.metal(), C.fonte, { x: x + c.entre(-0.7, 0.7), y: y + 1.75 - i * 0.25, z: z - 0.55 - i * 0.2, rx: c.hasard() * 3, ry: c.hasard() * 3, e: [0.7, 0.35, 0.5] });
}

// ---------- Le sol du site ----------

function sol(ctx, x1, z1, x2, z2, evite) {
  const { c, u } = ctx;
  const beton = M.beton();
  const pas = 6;
  const pts = [];
  const dansEvite = (xa, za, xb, zb) => evite.some(([a1, b1, a2, b2]) => xa < a2 && xb > a1 && za < b2 && zb > b1);
  for (let x = x1; x < x2 - 0.1; x += pas)
    for (let z = z1; z < z2 - 0.1; z += pas) {
      const xa = x;
      const xb = Math.min(x2, x + pas);
      const za = z;
      const zb = Math.min(z2, z + pas);
      if (dansEvite(xa, za, xb, zb)) {
        // Découper la dalle autour de ce qu'il faut éviter : on la garde si elle n'est qu'effleurée
        continue;
      }
      if (c.hasard() < 0.12 + 0.2 * u) {
        pts.push([(xa + xb) / 2 + c.entre(-2, 2), (za + zb) / 2 + c.entre(-2, 2)]);
        continue; // dalle disparue : l'herbe a repris
      }
      c.pave(xa + 0.04, -0.02, za + 0.04, xb - 0.04, 0.04, zb - 0.04, c.hasard() < 0.25 ? 0x8a867c : 0x9e998e, beton, { nuance: 0.06, crasse: false });
      if (c.hasard() < 0.15 + 0.3 * u) pts.push(c.hasard() < 0.5 ? [xa + 0.05, za + c.entre(0, pas)] : [xa + c.entre(0, pas), za + 0.05]);
    }
  touffes(c, pts.filter((p) => !evite.some(([a1, b1, a2, b2]) => p[0] > a1 && p[0] < a2 && p[1] > b1 && p[1] < b2)));
}

// ---------- Le haut fourneau ----------

function hautFourneau(ctx, simple) {
  const { b, u } = ctx;
  const R = M.rouille();
  const T = M.tole();
  const k = simple ? ctx.loin : b.couche("haut fourneau : cuve, ossature, passerelles, gueulard", { x: HF.x + 1.5, z: HF.z - 1, l: 2 * OSS + 7, p: 2 * OSS + 4 }, 2.5, 50);
  const c = simple ? ctx.loin : ctx.c;
  const X = HF.x;
  const Z = HF.z;

  // --- Le creuset (au sol, toujours visible) et le trou de coulée ---
  if (!simple) {
    cylY(c, X, Z, 0, 0.35, 6.6, 6.6, C.betonSombre, M.beton(), 12);
    cylY(c, X, Z, 0.35, 2.5, 5.4, 5.4, C.cuve, R, 16);
    for (const y of [0.9, 1.9]) cylY(c, X, Z, y, y + 0.16, 5.5, 5.5, C.acierSombre, T, 16, true);
    obstacleCercle(b, X, Z, 5.8, 12, "creuset du haut fourneau");
    // Le nez de réfractaire, la niche noircie, le bouchon d'argile
    c.pave(X - 1.4, 0, Z + 5.0, X + 1.4, 2.5, Z + 6.2, C.refractaire, M.brique());
    c.pave(X - 0.45, 0.6, Z + 6.2, X + 0.45, 1.4, Z + 6.24, C.suie, M.mat(), { crasse: false });
    c.poser(CAILLOU, M.mat(), 0x7a6a58, { x: X, y: 1.0, z: Z + 6.3, e: [0.6, 0.5, 0.25] });
    c.pave(X - 1.6, 2.5, Z + 4.9, X + 1.6, 2.7, Z + 6.3, C.acierSombre, T);
    // Les tuyères tombées, et la suie qui remonte
    for (const [dx, dz, ry] of [[-5.8, 3.7, 0.4], [-5.2, 4.4, 1.5]]) {
      const g = new THREE.CylinderGeometry(0.13, 0.26, 0.9, 8);
      c.poser(g, M.metal(), C.cuivre, { x: X + dx, y: 0.24, z: Z + dz, rz: PI / 2, ry });
      g.dispose();
    }
  }
  const profil = simple ? [[5.4, 0], ...PROFIL.slice(1)] : PROFIL;
  revolution(k, X, Z, profil, simple ? 10 : 16, C.cuve, R);
  cylY(k, X, Z, 31.9, 32.05, 2.95, 2.95, C.acierSombre, T, simple ? 8 : 12);
  if (!simple) {
    for (const y of [3.2, 7.0, 10.6, 18]) {
      const r = rayonHF(y) + 0.07;
      cylY(k, X, Z, y, y + 0.2, r, r, C.acierSombre, T, 16, true);
    }
    // Les conduites d'eau de refroidissement, plaquées sur la cuve
    for (let i = 0; i < 10; i++) {
      const th = (i / 10) * TAU + 0.2;
      const p = (y) => [X + Math.cos(th) * (rayonHF(y) + 0.22), y, Z + Math.sin(th) * (rayonHF(y) + 0.22)];
      k.poutre(p(9.4), p(12.5), 0.12, C.acierSombre, T);
      k.poutre(p(12.5), p(24.5), 0.12, C.acierSombre, T);
    }
    // Le porte-vent circulaire et les descentes vers les tuyères (le nez en cuivre)
    const g = new THREE.TorusGeometry(7.2, 0.6, 6, 20).rotateX(PI / 2);
    k.poser(g, R, C.cuve, { x: X, y: 7.6, z: Z });
    g.dispose();
    for (let i = 0; i < 12; i++) {
      const th = (i / 12) * TAU + 0.13;
      const P = (r, y) => [X + Math.cos(th) * r, y, Z + Math.sin(th) * r];
      k.tube(P(7.2, 7.1), P(6.15, 5.2), 0.22, C.acierSombre, T, 6);
      k.tube(P(6.15, 5.2), P(5.7, 4.75), 0.17, C.cuivre, T, 6);
      k.poser(ICO, T, C.acierSombre, { x: P(6.15, 5.2)[0], y: 5.2, z: P(6.15, 5.2)[2], e: 0.26 });
    }
  }

  // --- L'ossature : huit poteaux, des passerelles à chaque niveau, des contreventements ---
  const cols = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
  for (const [sx, sz] of cols) {
    const x = X + sx * OSS;
    const z = Z + sz * OSS;
    if (!simple) {
      c.pave(x - 0.55, 0, z - 0.55, x + 0.55, 0.5, z + 0.55, C.betonSombre, M.beton());
      poteauI(k, x, z, 0, 33, 0.6, C.acier, sz === 0 ? PI / 2 : 0, T);
      b.obstacle(x - 0.5, z, x + 0.5, z, "poteau");
    } else k.pave(x - 0.3, 0, z - 0.3, x + 0.3, 33, z + 0.3, C.acier, T);
  }
  for (const y of NIV) {
    // Les poutres de rive
    k.pave(X - OSS - 0.2, y - 0.5, Z - OSS - 0.15, X + OSS + 0.2, y, Z - OSS + 0.15, C.acier, T);
    k.pave(X - OSS - 0.2, y - 0.5, Z + OSS - 0.15, X + OSS + 0.2, y, Z + OSS + 0.15, C.acier, T);
    k.pave(X - OSS - 0.15, y - 0.5, Z - OSS, X - OSS + 0.15, y, Z + OSS, C.acier, T);
    k.pave(X + OSS - 0.15, y - 0.5, Z - OSS, X + OSS + 0.15, y, Z + OSS, C.acier, T);
    // Le caillebotis, avec des trous et un pan qui pend
    const a = rayonHF(y) + 0.4;
    const bandes = [
      [X - OSS, Z - OSS, X + OSS, Z - a],
      [X - OSS, Z + a, X + OSS, Z + OSS],
      [X - OSS, Z - a, X - a, Z + a],
      [X + a, Z - a, X + OSS, Z + a],
    ];
    let pendu = !simple && y === 21;
    for (const [x1, z1, x2, z2] of bandes) {
      const long = x2 - x1 > z2 - z1;
      for (let h = 0; h < 2; h++) {
        const q = long ? [x1 + ((x2 - x1) * h) / 2, z1, x1 + ((x2 - x1) * (h + 1)) / 2, z2] : [x1, z1 + ((z2 - z1) * h) / 2, x2, z1 + ((z2 - z1) * (h + 1)) / 2];
        if (y < 33 && c.hasard() < 0.1 + 0.25 * u) {
          if (pendu) {
            // Un pan de caillebotis arraché qui pend, accroché par un coin
            pendu = false;
            k.boite(q[2] - q[0], 0.08, q[3] - q[1], C.grille, { x: (q[0] + q[2]) / 2 + 0.4, y: y - 1.6, z: (q[1] + q[3]) / 2, rz: 0.9, rx: 0.3 }, T);
          }
          continue;
        }
        k.pave(q[0], y - 0.1, q[1], q[2], y, q[3], C.grille, T, { nuance: 0.05, crasse: false });
      }
    }
    if (!simple) {
      const o = OSS + 0.05;
      gardeCorps(k, [[X - o, Z - o], [X + o, Z - o], [X + o, Z + o], [X - o, Z + o], [X - o, Z - o]], y, C.jaune, 1.1, 2.6);
    }
  }
  // Contreventements en croix de Saint-André, alternés (le bas des faces sud et est reste ouvert)
  if (!simple) {
    const etages = [0, ...NIV];
    for (let e = 0; e < etages.length - 1; e++) {
      const y1 = etages[e] + (e === 0 ? 0.6 : 0);
      const y2 = etages[e + 1] - 0.5;
      for (const face of ["n", "s", "o", "e"]) {
        if (e === 0 && face !== "n") continue;
        for (const h of [0, 1]) {
          const t1 = -OSS + h * OSS;
          const t2 = t1 + OSS;
          const P = (t, y) => (face === "n" ? [X + t, y, Z - OSS] : face === "s" ? [X + t, y, Z + OSS] : face === "o" ? [X - OSS, y, Z + t] : [X + OSS, y, Z + t]);
          if ((e + h) % 2) k.poutre(P(t1, y1), P(t2, y2), 0.2, C.acier, T);
          else k.poutre(P(t2, y1), P(t1, y2), 0.2, C.acier, T);
        }
      }
    }
  }

  // --- Le gueulard : la cloche, le portique du skip, les prises de gaz, les purgeurs ---
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const x = X + sx * 4;
    const z = Z + sz * 4;
    if (simple) k.pave(x - 0.2, 33, z - 0.2, x + 0.2, 41.5, z + 0.2, C.acier, T);
    else poteauI(k, x, z, 33, 41.5, 0.42, C.acier, 0, T);
  }
  {
    const y = 38.5;
    const a = 2.7;
    const o = 4.6;
    for (const [x1, z1, x2, z2] of [[X - o, Z - o, X + o, Z - a], [X - o, Z + a, X + o, Z + o], [X - o, Z - a, X - a, Z + a], [X + a, Z - a, X + o, Z + a]]) k.pave(x1, y - 0.1, z1, x2, y, z2, C.grille, T);
    k.pave(X - o, 41.3, Z - o, X + o, 41.6, Z - o + 0.3, C.acier, T);
    k.pave(X - o, 41.3, Z + o - 0.3, X + o, 41.6, Z + o, C.acier, T);
    if (!simple) gardeCorps(k, [[X - o, Z - o], [X + o, Z - o], [X + o, Z + o], [X - o, Z + o], [X - o, Z - o]], y, C.jaune, 1.1, 3);
  }
  cylY(k, X, Z, 32, 35.6, 1.7, 1.7, C.cuve, R, simple ? 8 : 12);
  revolution(k, X, Z, [[1.0, 35.6], [2.3, 37.3]], simple ? 8 : 12, C.cuve, R);
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    tuyau(k, [[X + 1.9 * sx, 31.9, Z + 1.9 * sz], [X + 1.9 * sx, 42.6, Z + 1.9 * sz], [X + 0.4 * sx, 45.2, Z + 0.4 * sz]], 0.55, C.cuve, R, simple ? 6 : 8);
  }
  {
    const g = new THREE.IcosahedronGeometry(1.15, 1);
    k.poser(g, R, C.cuve, { x: X, y: 45.3, z: Z });
    g.dispose();
  }
  for (const s of [-1, 1]) {
    k.tube([X + s * 0.85, 45.6, Z + 0.4], [X + s * 0.85, 49.6, Z + 0.4], 0.3, C.cuve, R, 6);
    k.boite(0.9, 0.3, 0.9, C.acierSombre, { x: X + s * 0.85, y: 49.8, z: Z + 0.4 }, T);
  }
  // La conduite descendante, vers le pot à poussières
  tuyau(k, [[X, 45.3, Z], [X, 45.3, Z - 6], [DC.x, 20.8, DC.z]], 0.85, C.cuve, R, simple ? 8 : 10);
  // Le portique et la poulie du skip
  for (const s of [-1, 1]) k.poutre([X + 4.8, 33, Z + s * 1.3], [X + 3.4, 41, Z + s * 1.3], 0.3, C.acier, T);
  k.poutre([X + 3.4, 41, Z - 1.4], [X + 3.4, 41, Z + 1.4], 0.3, C.acier, T);
  {
    const g = new THREE.TorusGeometry(1.0, 0.12, 4, 14);
    k.poser(g, T, C.acierSombre, { x: X + 3.4, y: 40.2, z: Z });
    g.dispose();
  }
  if (!simple) panneau(k, "hf2", X, 30.2, Z + OSS + 0.2, 4.4, 1.65);

  if (simple) return;

  // --- L'escalier en zigzag de la face est (la première volée est tombée) ---
  const xe = X + OSS;
  const z1 = Z - 3.65;
  const z2 = Z - 7.55;
  for (const z of [Z - 8.7, Z - 2.5]) {
    c.pave(xe + 2.4, 0, z - 0.3, xe + 3.0, 0.4, z + 0.3, C.betonSombre, M.beton());
    k.pave(xe + 2.55, 0, z - 0.15, xe + 2.85, 34, z + 0.15, C.acier, T);
  }
  for (let n = 1; n <= 9; n++) {
    const y0 = 3 + 3 * n;
    const pair = n % 2 === 0;
    if (pair) escalier(k, xe + 0.9, z1, PI / 2, y0, y0 + 3, 1.0);
    else escalier(k, xe + 2.1, z2, -PI / 2, y0, y0 + 3, 1.0);
    // Le palier d'arrivée
    const zp = pair ? [Z - 8.7, z2] : [z1, Z - 2.5];
    k.pave(xe, y0 + 2.9, zp[0], xe + 2.75, y0 + 3, zp[1], C.grille, T);
    if (y0 + 3 > 33 - 0.1) break;
  }
  k.pave(xe, 5.9, Z - 8.7, xe + 2.75, 6, z2, C.grille, T); // le palier du bas, qui ne mène plus nulle part
  for (const s of [-0.45, 0.45]) k.poutre([xe + 2.1 + s, 6, z2], [xe + 2.6 + s, 3.3, z2 + 1.5], 0.1, C.acier, T); // les limons arrachés
  // La volée tombée, couchée au pied de l'ossature
  ctx.c.repere({ x: xe + 4.2, y: 0.12, z: Z + 0.5, ry: -1.25 }, () => {
    ctx.c.repere({ rz: -0.62 }, () => escalier(ctx.c, 0, 0, 0, 0, 3, 1.0));
  });
  b.obstacle(xe + 4.2, Z + 0.5, xe + 4.2 + 4.9 * Math.cos(-1.25), Z + 0.5 - 4.9 * Math.sin(-1.25), "volée d'escalier tombée");

  // --- La nature reprend les passerelles ---
  arbre(k, X - 4.2, Z + 7.2, 3.6, "bouleau", 15);
  arbre(k, X + 6.9, Z - 1.5, 3.2, "bouleau", 21);
  arbre(k, X - 6.8, Z - 6.5, 2.6, "bouleau", 27);
  buddleia(k, X - 7, Z + 3, 0.9, 9);
  buddleia(k, X + 3, Z + 7.2, 0.8, 27);
  buddleia(k, X + 6.6, Z + 6.5, 1.0, 15);
  mousse(k, X - 5, 9, Z - 7, 1.2, 4);
  mousse(k, X + 5, 21, Z + 7, 1.0, 3);
}

// ---------- Les cowpers, la cheminée, le pot à poussières et les conduites ----------

function cowpers(ctx, simple) {
  const { b } = ctx;
  const R = M.rouille();
  const T = M.tole();
  const k = simple ? ctx.loin : b.couche("cowpers, cheminée, pot à poussières, conduites", { x: -33, z: -32.5, l: 54, p: 15 }, 3, 53);
  const c = simple ? ctx.loin : ctx.c;
  for (const x of COWPERS) {
    if (!simple) {
      cylY(c, x, CZ, 0, 0.5, CR + 0.6, CR + 0.6, C.betonSombre, M.beton(), 12);
      cylY(c, x, CZ, 0.5, 3, CR, CR, C.cowper, R, 16);
      obstacleCercle(b, x, CZ, CR + 0.6, 12, "cowper");
    }
    cylY(k, x, CZ, simple ? 0 : 3, CH, CR, CR, C.cowper, R, simple ? 10 : 16, true);
    dome(k, x, CH, CZ, CR, 0.85, C.cowper, R, simple ? 10 : 14);
    if (simple) continue;
    for (const y of [9, 16, 23]) cylY(k, x, CZ, y, y + 0.22, CR + 0.06, CR + 0.06, C.acierSombre, T, 16, true);
    // La passerelle circulaire du haut
    const g = new THREE.RingGeometry(CR, CR + 1.1, 16, 1).rotateX(-PI / 2);
    k.poser(g, T, C.grille, { x, y: CH - 0.05, z: CZ });
    g.dispose();
    gardeCorpsRond(k, x, CZ, CR + 1.05, CH, 14);
    echelle(k, x + (CR + 0.05) * Math.SQRT1_2, CZ + (CR + 0.05) * Math.SQRT1_2, 3, CH, [Math.SQRT1_2, Math.SQRT1_2]);
    // Le piquage vers la conduite de vent chaud, sa vanne et son volant
    tuyau(k, [[x, 8, CZ + CR - 0.2], [x, 8, -25.6]], 0.5, C.acierSombre, R, 8);
    cylZ(k, x, 8, -27.2, -26.8, 0.85, C.acierSombre, T, 10);
    const v = new THREE.TorusGeometry(0.45, 0.05, 4, 10);
    k.poser(v, T, C.jaune, { x: x + 0.95, y: 8.9, z: -27, ry: PI / 2 });
    v.dispose();
  }
  // La conduite de vent chaud vers le porte-vent circulaire
  tuyau(k, [[-51, 8, -25.6], [-34, 8, -25.6], [-34, 7.6, -22.1]], 0.75, C.cuve, R, simple ? 6 : 10);
  for (const x of [-49, -41.5]) {
    if (simple) k.pave(x - 0.4, 0, -26, x + 0.4, 7.25, -25.2, C.beton, M.beton());
    else {
      c.pave(x - 0.45, 0, -26.05, x + 0.45, 7.2, -25.15, C.beton, M.beton());
      obstacleRect(b, x - 0.45, -26.05, x + 0.45, -25.15, "pile de conduite");
    }
  }
  // La conduite de gaz épuré, du pot à poussières aux cowpers, sur ses chevalets
  tuyau(k, [[DC.x, 14, DC.z - 2.6], [DC.x, 14, -37.8], [-51, 14, -37.8]], 0.8, C.cuve, R, simple ? 6 : 10);
  if (!simple) {
    for (const x of COWPERS) tuyau(k, [[x, 14, -37.8], [x, 12.6, -36.1]], 0.42, C.cuve, R, 8);
    for (const x of [-18, -30, -42]) {
      for (const s of [-1, 1]) k.poutre([x + s * 1.2, 0, -37.8], [x + s * 0.4, 13.2, -37.8], 0.3, C.acier, T);
      k.poutre([x - 1, 13.2, -37.8], [x + 1, 13.2, -37.8], 0.3, C.acier, T);
      k.poutre([x - 1, 6, -37.8], [x + 1, 6, -37.8], 0.2, C.acier, T);
    }
  }
  // La cheminée : brique, cerclages, couronne
  if (!simple) {
    cylY(c, CHEM.x, CHEM.z, 0, 3, 2.5, 2.45, C.brique, M.brique(), 12);
    obstacleCercle(b, CHEM.x, CHEM.z, 2.6, 10, "cheminée");
    // Le carneau qui la relie au premier cowper
    c.pave(CHEM.x + 2.2, 0, CZ - 1.0, COWPERS[0] - CR + 0.2, 2.2, CZ + 1.0, C.brique, M.brique());
    c.pave(CHEM.x + 2.2, 2.2, CZ - 1.15, COWPERS[0] - CR + 0.2, 2.45, CZ + 1.15, C.betonSombre, M.beton());
    obstacleRect(b, CHEM.x + 2.2, CZ - 1.0, COWPERS[0] - CR + 0.2, CZ + 1.0, "carneau");
  }
  revolution(k, CHEM.x, CHEM.z, [[2.45, simple ? 0 : 3], [1.55, CHEM.h]], simple ? 8 : 12, C.brique, M.brique());
  for (const y of [18, 32, 45]) {
    const r = 2.45 - (0.9 * y) / CHEM.h + 0.05;
    cylY(k, CHEM.x, CHEM.z, y, y + 0.35, r, r - 0.01, C.acierSombre, T, 12, true);
  }
  cylY(k, CHEM.x, CHEM.z, CHEM.h - 0.2, CHEM.h + 0.5, 1.8, 1.8, C.suie, T, 12, true);

  // Le pot à poussières sur ses quatre jambes
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    if (!simple) c.pave(DC.x + sx * 2.4 - 0.4, 0, DC.z + sz * 2.4 - 0.4, DC.x + sx * 2.4 + 0.4, 0.4, DC.z + sz * 2.4 + 0.4, C.betonSombre, M.beton());
    k.poutre([DC.x + sx * 2.4, 0, DC.z + sz * 2.4], [DC.x + sx * 2.1, 10.3, DC.z + sz * 2.1], 0.42, C.acier, T);
  }
  if (!simple) {
    k.poutre([DC.x - 2.3, 4, DC.z - 2.3], [DC.x + 2.3, 4, DC.z - 2.3], 0.22, C.acier, T);
    k.poutre([DC.x - 2.3, 4, DC.z + 2.3], [DC.x + 2.3, 4, DC.z + 2.3], 0.22, C.acier, T);
  }
  revolution(k, DC.x, DC.z, [[0.5, 6.2], [3.25, 10.2]], simple ? 8 : 12, C.cuve, R);
  cylY(k, DC.x, DC.z, 10.2, 18.2, 3.25, 3.25, C.cuve, R, simple ? 8 : 14, true);
  dome(k, DC.x, 18.2, DC.z, 3.25, 0.75, C.cuve, R, simple ? 8 : 12);
  cylY(k, DC.x, DC.z, 5.2, 6.3, 0.45, 0.5, C.acierSombre, T, 8);
  if (!simple) {
    echelle(k, DC.x + 3.3, DC.z, 0.4, 18, [1, 0]);
    butte(c, DC.x, DC.z + 0.4, 2.6, 0.9, 2.2, 0x6d6a66, 0, 7);
  }
}

// ---------- Le plan incliné des skips et les trémies ----------

function planIncline(ctx, simple) {
  const { b, u } = ctx;
  const T = M.tole();
  const k = simple ? ctx.loin : b.couche("plan incliné, trémies", { x: -11, z: -22, l: 36, p: 28 }, 2.2, 37);
  const c = simple ? ctx.loin : ctx.c;
  const A = new THREE.Vector3(...SKIP0);
  const B = new THREE.Vector3(...SKIP1);
  const d = B.clone().sub(A);
  const L = d.length();
  d.normalize();
  const bas = new THREE.Vector3(-d.y, d.x, 0); // perpendiculaire, vers le dessous du pont
  const P = (t, s, p) => A.clone().addScaledVector(d, t * L).addScaledVector(bas, p).add(new THREE.Vector3(0, 0, s * 1.2)).toArray();
  const t0 = 0.05;
  const pr = 1.6;
  for (const s of [-1, 1]) {
    k.poutre(P(t0, s, 0), P(1, s, 0), 0.24, C.acier, T);
    k.poutre(P(t0 + 0.04, s, pr), P(0.97, s, pr), 0.22, C.acier, T);
  }
  const n = simple ? 8 : 15;
  for (let i = 0; i <= n; i++) {
    const t = t0 + 0.04 + ((0.93 - t0) * i) / n;
    const t2 = t0 + 0.04 + ((0.93 - t0) * (i + 1)) / n;
    k.poutre(P(t, -1, 0), P(t, 1, 0), 0.14, C.acier, T);
    if (simple) continue;
    k.poutre(P(t, -1, pr), P(t, 1, pr), 0.12, C.acier, T);
    for (const s of [-1, 1]) {
      k.poutre(P(t, s, 0), P(t, s, pr), 0.12, C.acier, T);
      if (i < n) k.poutre(P(t, s, 0), P(t2, s, pr), 0.1, C.acier, T);
    }
  }
  if (!simple) {
    // Les rails du skip, et le skip resté coincé à mi-pente
    for (const s of [-0.45, 0.45]) k.poutre(P(t0, s / 1.2, -0.12), P(1, s / 1.2, -0.12), 0.08, 0x5a4d44, T);
    const ps = P(0.56, 0, -0.95);
    k.boite(2.6, 1.5, 1.6, C.rouille, { x: ps[0], y: ps[1], z: ps[2], rz: Math.atan2(d.y, d.x) }, T);
    const pc = P(0.56, 0, -1.8);
    k.boite(2.2, 0.4, 1.3, C.coke, { x: pc[0], y: pc[1], z: pc[2], rz: Math.atan2(d.y, d.x) }, T);
    // Les câbles, du skip à la poulie
    k.poutre(P(0.58, -0.2, -1.2), [HF.x + 3.4, 40.2, HF.z - 0.2], 0.04, 0x2a2a2a, T);
    k.poutre(P(0.58, 0.2, -1.2), [HF.x + 3.4, 40.2, HF.z + 0.2], 0.04, 0x2a2a2a, T);
  }
  // Le chevalet en A
  const tA = 0.4;
  for (const s of [-1, 1]) {
    const haut = P(tA, s, pr);
    const pied = [haut[0] + 0.8, 0, HF.z + s * 3.8];
    k.poutre(pied, haut, 0.42, C.acier, T);
    if (!simple) {
      c.pave(pied[0] - 0.5, 0, pied[2] - 0.5, pied[0] + 0.5, 0.45, pied[2] + 0.5, C.betonSombre, M.beton());
      b.obstacle(pied[0] - 0.5, pied[2], pied[0] + 0.5, pied[2], "pied du chevalet");
    }
  }
  {
    const hA = P(tA, -1, pr);
    k.poutre([hA[0] + 0.45, 7, HF.z - 2.6], [hA[0] + 0.45, 7, HF.z + 2.6], 0.25, C.acier, T);
  }

  // --- Les trémies (soutes à coke et à minerai) et le pied du plan incliné ---
  const bx = [-3.6, 0.6];
  const bz = [-33.6, -27.8];
  for (const x of bx)
    for (const z of bz) {
      k.pave(x - 1.95, 3.7, z - 2.8, x + 1.95, 7.6, z + 2.8, C.beton, M.beton());
      const g = new THREE.ConeGeometry(2.75, 1.7, 4, 1, true);
      k.poser(g, M.beton(), C.betonSombre, { x, y: 2.85, z, rx: PI, ry: PI / 4, e: [1, 1, 1.43] });
      g.dispose();
      k.pave(x - 1.75, 7.25, z - 2.6, x + 1.75, 7.45, z + 2.6, (bx.indexOf(x) + bz.indexOf(z)) % 2 ? C.coke : C.minerai, M.beton(), { crasse: false });
    }
  if (simple) return;
  for (const x of [-5.7, -1.5, 2.7])
    for (const z of [-36.5, -30.7, -24.9]) {
      c.pave(x - 0.25, 0, z - 0.25, x + 0.25, 3.75, z + 0.25, C.betonSombre, M.beton());
      b.obstacle(x - 0.25, z, x + 0.25, z, "pilier des trémies");
    }
  // La fosse du skip : un trou noir cerclé de jaune et noir
  c.pave(-3.3, -0.6, -17.3, -0.7, 0.01, -14.7, 0x1c1b1a, M.mat(), { crasse: false });
  for (let i = 0; i < 6; i++) {
    c.pave(-3.5 + i * 0.5, 0.02, -17.5, -3.25 + i * 0.5, 0.06, -17.3, 0xc9a93a, M.mat(), { crasse: false });
    c.pave(-3.5 + i * 0.5, 0.02, -14.7, -3.25 + i * 0.5, 0.06, -14.5, 0xc9a93a, M.mat(), { crasse: false });
  }
  obstacleRect(b, -3.4, -17.4, -0.6, -14.6, "fosse du skip");
  // Le tapis incliné, des trémies à la fosse
  c.boite(1.0, 0.14, 7.4, 0x2a2826, { x: -1.8, y: 1.75, z: -21.2, rx: 0.24 }, M.mat());
  for (const s of [-1, 1]) c.boite(0.08, 0.4, 7.4, C.acier, { x: -1.8 + s * 0.52, y: 1.9, z: -21.2, rx: 0.24 }, T);
  for (const z of [-23.6, -21, -18.6]) {
    const y = 1.75 - (z + 21.2) * 0.24;
    for (const s of [-1, 1]) c.poutre([-1.8 + s * 0.45, 0, z], [-1.8 + s * 0.45, y - 0.1, z], 0.1, C.acier, T);
  }
  b.obstacle(-1.8, -24.8, -1.8, -17.6, "tapis d'alimentation");
  // Mur de soutènement et tas au sol : coke et agglomérés
  mur(c, [-7, -24], [-7, -36.5], { h: 1.4, ep: 0.4, couleur: C.beton, mat: M.beton(), batiment: b });
  butte(c, -4.6, -22.4, 2.4, 1.1, 1.8, C.coke, 1, 3);
  butte(c, 1.6, -22.6, 2.6, 1.3, 2.0, C.minerai, 1, 5);
  butte(c, 3.2, -27, 1.6, 0.7, 1.4, C.minerai, 0, 9);
  debris(c, -6.5, -36, 4, -20.5, Math.round(25 + 25 * u), [C.coke, 0x3b3835, C.minerai]);
}

// ---------- La halle de coulée ----------

/** Une rigole de coulée droite (de a à b, alignée sur x ou z) : fond et bords réfractaires, fonte figée dedans. */
function rigole(c, a, b, l, pleine = true) {
  const horiz = Math.abs(a[1] - b[1]) < 0.01;
  const x1 = Math.min(a[0], b[0]) - (horiz ? 0 : l / 2);
  const x2 = Math.max(a[0], b[0]) + (horiz ? 0 : l / 2);
  const z1 = Math.min(a[1], b[1]) - (horiz ? l / 2 : 0);
  const z2 = Math.max(a[1], b[1]) + (horiz ? l / 2 : 0);
  const coul = C.refractaire;
  const br = M.brique();
  c.pave(x1, 0.02, z1, x2, 0.1, z2, coul, br, { crasse: false });
  if (horiz) {
    c.pave(x1, 0.02, z1 - 0.28, x2, 0.45, z1, coul, br);
    c.pave(x1, 0.02, z2, x2, 0.45, z2 + 0.28, coul, br);
  } else {
    c.pave(x1 - 0.28, 0.02, z1, x1, 0.45, z2, coul, br);
    c.pave(x2, 0.02, z1, x2 + 0.28, 0.45, z2, coul, br);
  }
  if (pleine) {
    c.pave(x1 + 0.02, 0.1, z1 + 0.02, x2 - 0.02, 0.32, z2 - 0.02, C.fonte, M.metal(), { crasse: false, nuance: 0.06 });
    const n = Math.max(1, Math.round(Math.max(x2 - x1, z2 - z1) / 1.6));
    for (let i = 0; i < n; i++) {
      const t = (i + c.hasard()) / n;
      c.poser(CAILLOU, M.metal(), C.fonte, { x: horiz ? x1 + (x2 - x1) * t : (x1 + x2) / 2, y: 0.32, z: horiz ? (z1 + z2) / 2 : z1 + (z2 - z1) * t, rx: c.hasard() * 3, ry: c.hasard() * 3, e: [l * 0.8, 0.25, l * 0.7] }, { crasse: false });
    }
  }
}

function halleCoulee(ctx) {
  const { b, c, u } = ctx;
  const H = HC;
  const T = M.tole();
  const bard = M.bardage();
  const zc = (H.z0 + H.z1) / 2;

  // --- Le sol de coulée : dalle couverte de sable noirci, des lits de sable plus clairs ---
  c.pave(H.x0, -0.02, H.z0 - 2.4, H.x1, 0.04, H.z1, C.sable, M.beton(), { nuance: 0.03, crasse: false });
  for (const [x1, z1, x2, z2] of [[-44, 4.5, -38, 8], [-24, -6, -16, -1], [-44, -7, -39, -2]]) c.pave(x1, 0.04, z1, x2, 0.09, z2, 0x9a8c78, M.mat(), { crasse: false, nuance: 0.05 });

  // --- Les murs bas (toujours visibles) : bardage au nord et à l'ouest, socle de béton au sud et à l'est ---
  const bas = { couleur: C.bardage, mat: bard, batiment: b, ep: 0.25 };
  mur(c, [H.x1, H.z0], [-22.2, H.z0], { ...bas, h: 4 });
  mur(c, [-37.8, H.z0], [H.x0, H.z0], { ...bas, h: 4 });
  mur(c, [H.x0, H.z0], [H.x0, H.z1], { ...bas, h: 4, ouvertures: [{ u: 3.5, l: 1.4, bas: 0, haut: 2.3, type: "vide" }, { u: 12, l: 2.2, bas: 0, haut: 2.6, type: "vide" }] });
  const socle = { couleur: C.beton, mat: M.beton(), batiment: b, ep: 0.35, h: 1.0 };
  mur(c, [H.x0, H.z1], [H.x1, H.z1], { ...socle, ouvertures: [{ u: 10, l: 1.6, bas: 0, haut: 2, type: "vide" }, { u: 17, l: 3.6, bas: 0, haut: 4, type: "vide" }, { u: 25, l: 1.6, bas: 0, haut: 2, type: "vide" }] });
  mur(c, [H.x1, H.z1], [H.x1, H.z0], { ...socle, ouvertures: [{ u: 7, l: 4.2, bas: 0, haut: 4.5, type: "vide" }] });
  // Les poteaux de la halle (au sud et à l'est, ils restent debout quand la coupe efface le bardage)
  for (let i = 0; i <= 6; i++) {
    const x = H.x0 + (i * (H.x1 - H.x0)) / 6;
    poteauI(c, x, H.z1 + 0.3, 0, H.h, 0.5, C.acier, 0, T);
    if (i > 0 && i < 6 && Math.abs(x - HF.x) > 7) poteauI(c, x, H.z0 - 0.2, 0, H.h, 0.5, C.acier, 0, T);
  }

  // --- Ce qui s'efface : bardage haut, toit, pont roulant ---
  const k = b.couche("halle de coulée : bardage haut, toit, pont roulant", { x: (H.x0 + H.x1) / 2, z: zc, l: H.x1 - H.x0 + 1, p: H.z1 - H.z0 + 1 }, 1.0, H.faite + 1.2);
  const haut = { couleur: C.bardage, mat: bard, ep: 0.25 };
  mur(k, [H.x1, H.z0], [-22.2, H.z0], { ...haut, y0: 4, h: H.h - 4 });
  mur(k, [-37.8, H.z0], [H.x0, H.z0], { ...haut, y0: 4, h: H.h - 4 });
  k.pave(-38, 6.5, H.z0 - 0.2, -22, H.h, H.z0 + 0.2, C.bardage, bard); // le linteau au-dessus du fourneau
  mur(k, [H.x0, H.z0], [H.x0, H.z1], { ...haut, y0: 4, h: H.h - 4, ouvertures: [{ u: 8.5, l: 6, bas: 2.2, haut: 4.6, type: "vide" }] });
  mur(k, [H.x0, H.z1], [H.x1, H.z1], { ...haut, y0: 1, h: H.h - 1, ouvertures: [{ u: 10, l: 1.6, bas: 0, haut: 1, type: "vide" }, { u: 17, l: 3.6, bas: 0, haut: 3, type: "vide" }, { u: 25, l: 1.6, bas: 0, haut: 1, type: "vide" }, { u: 5, l: 4.4, bas: 5, haut: 7.5, type: "vide" }, { u: 29, l: 3.4, bas: 5, haut: 7.5, type: "vide" }], breches: u > 0.55 ? [{ u: 23, l: 5, profondeur: 2 + 5 * u }] : [] });
  mur(k, [H.x1, H.z1], [H.x1, H.z0], { ...haut, y0: 1, h: H.h - 1, ouvertures: [{ u: 7, l: 4.2, bas: 0, haut: 3.5, type: "vide" }] });
  for (const x of [H.x0 + 5, H.x0 + 29]) k.pave(x - 2.2, 6.2, H.z1 - 0.03, x + 2.2, 8.4, H.z1 + 0.03, 0x2c3436, M.verre());
  // Les pignons
  for (const x of [H.x0, H.x1]) {
    const forme = new THREE.Shape([new THREE.Vector2(-(H.z1 - H.z0) / 2 - 0.2, 0), new THREE.Vector2((H.z1 - H.z0) / 2 + 0.2, 0), new THREE.Vector2(0, H.faite - H.h)]);
    const g = new THREE.ExtrudeGeometry(forme, { depth: 0.25, bevelEnabled: false });
    k.poser(g, bard, C.bardage, { x: x - 0.125, y: H.h, z: zc, ry: PI / 2 });
    g.dispose();
  }
  // Le toit (tôle ondulée, des lés manquent) et sa charpente
  const trous = [{ u: -8, v: 1, l: 4.5, p: 0.6 + 0.4 * u }, { u: 6, v: -1, l: 3.5, p: 0.5 }];
  if (u > 0.5) trous.push({ u: 12, v: 1, l: 3, p: 1 });
  toitDeuxPans(k, (H.x0 + H.x1) / 2, zc, H.x1 - H.x0, H.z1 - H.z0, H.h, H.faite - H.h, { couleur: 0x9c9a92, mat: bard, debord: 0.5, trous, charpente: C.acier });
  for (let i = 1; i < 6; i++) {
    const x = H.x0 + (i * (H.x1 - H.x0)) / 6;
    k.poutre([x, H.h, H.z0], [x, H.h, H.z1], 0.22, C.acier, T);
    for (const s of [-1, 1]) {
      const ze = zc + (s * (H.z1 - H.z0)) / 2;
      k.poutre([x, H.h, ze], [x, H.faite, zc], 0.26, C.acier, T);
      k.poutre([x, H.h, zc + s * 4.2], [x, H.h + ((H.faite - H.h) * 4.3) / 8.5, zc + s * 4.2], 0.12, C.acier, T);
    }
    k.poutre([x, H.h, zc], [x, H.faite, zc], 0.14, C.acier, T);
  }
  // Le pont roulant, jaune passé, son crochet descendu
  for (const z of [H.z0 + 0.5, H.z1 - 0.5]) k.pave(H.x0 + 0.3, 8.6, z - 0.2, H.x1 - 0.3, 9.2, z + 0.2, C.acier, T);
  const xp = -24;
  for (const dx of [-0.8, 0.8]) k.pave(xp + dx - 0.25, 9.2, H.z0 + 0.3, xp + dx + 0.25, 10.3, H.z1 - 0.3, C.jaune, T);
  for (const z of [H.z0 + 0.5, H.z1 - 0.5]) k.pave(xp - 1.4, 9.2, z - 0.4, xp + 1.4, 9.9, z + 0.4, C.jaune, T);
  k.pave(xp - 1.3, 10.3, 0.2, xp + 1.3, 11.2, 2.4, C.jaune, T);
  k.boite(1.4, 1.6, 1.4, C.jaune, { x: xp + 1.3, y: 8.3, z: H.z1 - 1.6 }, T); // la cabine
  k.pave(xp + 0.62, 8.0, H.z1 - 2.3, xp + 0.66, 8.8, H.z1 - 0.9, 0x2c3436, M.verre());
  for (const dz of [-0.2, 0.2]) k.poutre([xp, 10.3, 1.3 + dz], [xp, 5.4, 1.3 + dz], 0.05, 0x2a2a2a, T);
  k.boite(0.6, 0.7, 0.4, C.jaune, { x: xp, y: 5.1, z: 1.3 }, T);
  {
    const g = new THREE.TorusGeometry(0.32, 0.1, 4, 8, PI * 1.4);
    k.poser(g, T, C.acierSombre, { x: xp, y: 4.5, z: 1.3, rz: -0.5 });
    g.dispose();
  }
  panneau(k, "steel", (H.x0 + H.x1) / 2 + 2, 9.6, H.z1 + 0.16, 12, 1.875);
  panneau(k, "hf2", -21.5, 2.9, H.z1 + 0.16, 2.2, 0.82);
  panneau(k, "danger", -31.8, 3.4, H.z1 + 0.16, 1.0, 1.0);
  buddleia(k, H.x0 + 3, H.z0 + 3.4, 0.8, H.h + 1.5);
  arbre(k, H.x1 - 5, H.z1 - 2.5, 3.2, "bouleau", H.h + 0.9);
  mousse(k, -40, H.h + 1.2, 6, 1.4, 4);

  // --- Les rigoles : la principale, l'écrémeur, les branches vers les torpilles, la rigole à laitier ---
  rigole(c, [HF.x, HF.z + 6.3], [HF.x, -2.2], 1.2);
  c.pave(HF.x - 0.9, 0.3, -3.3, HF.x + 0.9, 0.95, -2.9, C.refractaire, M.brique()); // l'écrémeur
  rigole(c, [HF.x - 0.6, -4.6], [H.x0 - 1.4, -4.6], 0.8);
  rigole(c, [HF.x, -2.2], [HF.x, 2.6], 1.0);
  rigole(c, [HF.x + 0.5, 3.1], [-21, 3.1], 0.9);
  rigole(c, [-21, 3.5], [-21, H.z1 + 0.2], 0.9, u < 0.6);
  rigole(c, [HF.x - 0.5, 3.1], [-36, 3.1], 0.9);
  rigole(c, [-36, 3.5], [-36, H.z1 + 0.2], 0.9);
  // Les becs de coulée au-dessus de la fosse des torpilles
  for (const x of [-36, -21]) {
    c.repere({ x, y: 0.28, z: H.z1 + 1.4, rx: 0.12 }, () => {
      c.boite(1.1, 0.12, 2.5, C.acierSombre, {}, T);
      for (const s of [-1, 1]) c.boite(0.1, 0.35, 2.5, C.acierSombre, { x: s * 0.5, y: 0.2 }, T);
    });
    b.obstacle(x - 0.7, H.z1 + 0.3, x - 0.7, H.z1 + 2.6, "bec de coulée");
    b.obstacle(x + 0.7, H.z1 + 0.3, x + 0.7, H.z1 + 2.6, "bec de coulée");
  }
  b.obstacle(HF.x - 0.6, HF.z + 6.3, HF.x - 0.6, -2.2, "rigole");
  b.obstacle(HF.x + 0.6, HF.z + 6.3, HF.x + 0.6, -2.2, "rigole");

  // --- La boucheuse et la foreuse, de part et d'autre du trou de coulée ---
  cylY(c, -24.6, -9.4, 0, 1.4, 0.55, 0.55, C.acierSombre, T, 10);
  c.repere({ x: -24.6, y: 1.5, z: -9.4, ry: -0.55 }, () => {
    c.boite(4.0, 0.5, 0.6, C.vert, { x: -1.9 }, T);
    cylX(c, -4.6, -2.4, 0.15, 0, 0.42, C.vert, T, 10);
    c.boite(0.5, 0.5, 0.5, C.cuivre, { x: -4.8, y: 0.15 }, M.tole());
  });
  b.obstacle(-25.2, -9.4, -24, -9.4, "boucheuse");
  cylY(c, -35.6, -9.4, 0, 1.6, 0.45, 0.45, C.acierSombre, T, 10);
  c.repere({ x: -35.6, y: 1.7, z: -9.4, ry: 0.45 }, () => {
    c.boite(4.2, 0.35, 0.4, C.jaune, { x: 2.0 }, T);
    c.poutre([2.0, -0.1, 0], [5.0, -0.5, 0], 0.08, 0x5a5550, M.metal());
    c.boite(0.6, 0.5, 0.5, C.acierSombre, { x: 0.4, y: 0.4 }, T);
  });
  b.obstacle(-36.1, -9.4, -35.1, -9.4, "foreuse");

  // --- Les poches de coulée : une renversée, une debout sur ses chaises ---
  c.repere({ x: -41.2, y: 1.78, z: 3.2, ry: 0.35, rz: -PI / 2 + 0.06 }, () => c.repere({ y: -1.6 }, () => poche(c, C.cuve)));
  obstacleCercle(b, -41.2, 3.2, 2.2, 8, "poche renversée", 1.9);
  for (let i = 0; i < 9; i++) c.poser(CAILLOU, M.metal(), i % 3 ? C.laitier : C.fonte, { x: -38.4 + c.entre(0, 2.2), y: 0.15, z: 3.6 + c.entre(-1.4, 1.4), rx: c.hasard() * 3, ry: c.hasard() * 3, e: [c.entre(0.6, 1.4), 0.4, c.entre(0.5, 1)] });
  for (const dz of [-1.5, 1.5]) c.pave(-20.2, 0, -3.2 + dz - 0.4, -16.8, 0.9, -3.2 + dz + 0.4, C.betonSombre, M.beton());
  c.repere({ x: -18.5, y: 0.9, z: -3.2 }, () => {
    poche(c, C.rouille);
    cylY(c, 0, 0, 2.6, 2.9, 1.7, 1.7, C.fonte, M.metal(), 12); // la croûte de fonte qui a figé dedans
    for (let i = 0; i < 4; i++) c.poser(CAILLOU, M.metal(), C.fonte, { x: c.entre(-1.6, 1.6), y: 2.4 - i * 0.5, z: 1.75, e: [0.35, 0.8, 0.25] });
  });
  obstacleCercle(b, -18.5, -3.2, 2.0, 8, "poche debout");

  // --- La forge des Charbonniers, rallumée dans un creuset ---
  {
    const x = -38.5;
    const z = -3.0;
    c.pave(x - 0.8, 0, z - 0.8, x + 0.8, 0.5, z + 0.8, C.refractaire, M.brique());
    cylY(c, x, z, 0.5, 1.45, 0.48, 0.62, C.graphite, M.lisse(), 10);
    cylY(c, x, z, 1.32, 1.42, 0.56, 0.56, C.suie, M.mat(), 10);
    for (let i = 0; i < 9; i++) c.boite(0.13, 0.09, 0.11, i % 2 ? 0xff7a2a : 0xd2451c, { x: x + c.entre(-0.38, 0.38), y: 1.44, z: z + c.entre(-0.38, 0.38), ry: c.hasard() * 3 }, M.mat(), { crasse: false });
    {
      const g = new THREE.IcosahedronGeometry(0.75, 0);
      c.poser(g, M.lueur(), 0xff8a3a, { x, y: 1.75, z, e: [1, 0.7, 1] }, { crasse: false, nuance: 0 });
      g.dispose();
    }
    // Le soufflet de forge et sa buse
    c.repere({ x: x - 1.6, y: 0.75, z: z + 0.2, ry: 0.2 }, () => {
      c.boite(1.2, 0.08, 0.7, PALETTE.bois, { y: 0.2, rz: 0.18 }, M.mat());
      c.boite(1.2, 0.08, 0.7, PALETTE.bois, { y: -0.2, rz: -0.06 }, M.mat());
      c.boite(1.0, 0.32, 0.62, 0x5a4030, { y: 0.0 }, M.mat());
      c.boite(0.5, 0.05, 0.05, PALETTE.boisSombre, { x: -0.8, y: 0.25 }, M.mat());
    });
    c.poutre([x - 1.0, 0.75, z + 0.3], [x - 0.45, 1.1, z + 0.1], 0.08, C.acierSombre, M.metal());
    for (const s of [-1, 1]) c.poutre([x - 1.4 + s * 0.4, 0, z + 0.2], [x - 1.4 + s * 0.4, 0.6, z + 0.2], 0.08, PALETTE.boisSombre, M.mat());
    // L'enclume (un bout de rail sur un billot), le seau de trempe, les ringards appuyés
    cylY(c, x + 1.6, z + 1.0, 0, 0.6, 0.3, 0.3, PALETTE.bois, M.mat(), 8);
    c.boite(0.6, 0.25, 0.22, C.acierSombre, { x: x + 1.6, y: 0.72, z: z + 1.0 }, M.metal());
    c.boite(0.25, 0.12, 0.2, C.acierSombre, { x: x + 1.95, y: 0.8, z: z + 1.0 }, M.metal());
    cylY(c, x + 1.5, z - 0.9, 0, 0.45, 0.24, 0.27, 0x6a6e6a, M.tole(), 8);
    for (let i = 0; i < 3; i++) c.poutre([x + 0.9 + i * 0.12, 0, z - 1.8], [x + 0.6 + i * 0.12, 1.9, z - 1.5], 0.04, C.acierSombre, M.metal());
    for (let i = 0; i < 3; i++) c.boite(0.5, 0.42, 0.35, 0x5a4a38, { x: x - 1.4 + i * 0.55, y: 0.21, z: z - 1.6, ry: c.entre(-0.3, 0.3) }, M.mat()); // sacs de charbon de bois
    c.boite(1.9, 0.01, 1.9, C.suie, { x, y: 0.1, z, ry: 0.3 }, M.mat(), { crasse: false });
    b.obstacle(x - 0.8, z - 0.8, x + 0.8, z - 0.8, "forge");
    b.obstacle(x - 0.8, z + 0.8, x + 0.8, z + 0.8, "forge");
    panneau(c, "flamme", H.x0 + 0.15, 2.2, z, 1.4, 1.4, PI / 2);
    b.lumiere(x, 1.8, z, 0xff7a2a, 10, 14, "forge des Charbonniers rallumée dans un creuset");
  }
  panneau(c, "graff", H.x0 + 0.15, 2.4, 1.0, 4.4, 1.1, PI / 2);

  // --- Le parcours du Steel Experience : marquage au sol, bornes, lunettes pendues ---
  for (const [x1, z1, x2, z2] of [[-15.5, 0.6, -22, 0.6], [-22, 0.6, -22, -5.8], [-22, -5.8, -26.5, -5.8]]) {
    const L = Math.hypot(x2 - x1, z2 - z1);
    for (let t = 0; t < L; t += 1.0) {
      const x = x1 + ((x2 - x1) * t) / L;
      const z = z1 + ((z2 - z1) * t) / L;
      c.boite(0.6, 0.02, 0.6, 0xc9a93a, { x, y: 0.06, z, ry: 0.785 }, M.mat(), { crasse: false, nuance: 0.1 });
    }
  }
  panneau(c, "parcours", -18, 0.08, -0.5, 2.6, 0.65, 0, -PI / 2);
  for (const [x, z] of [[-21.2, -6.6], [-23.2, -6.6], [-25.2, -6.6], [-27.2, -6.6]]) c.poutre([x, 0, z], [x, 1.0, z], 0.07, C.jaune, M.tole());
  for (const [x1, x2] of [[-21.2, -23.2], [-23.2, -25.2], [-25.2, -27.2]]) {
    for (let i = 0; i < 6; i++) {
      const t1 = i / 6;
      const t2 = (i + 1) / 6;
      const sag = (t) => 0.95 - 0.25 * Math.sin(t * PI);
      c.poutre([x1 + (x2 - x1) * t1, sag(t1), -6.6], [x1 + (x2 - x1) * t2, sag(t2), -6.6], 0.03, 0xc8362b, M.mat());
    }
  }
  borne(c, -22.5, -5.0, PI * 0.85);
  borne(c, -40.5, 7.6, PI * 0.9);
  lunettesPendues(c, -15.2, 4.6, PI / 2, 7);
  panneau(c, "lunettes", -15.0, 2.0, 2.6, 1.3, 0.65, -PI / 2);
  b.lumiere(-29, 2.3, -8.4, 0xffb060, 3.5, 8, "lanterne des Charbonniers pendue à la rambarde du trou de coulée");
  c.poutre([-29, 2.6, -8.3], [-29, 2.15, -8.3], 0.02, 0x2a2a2a, M.metal());
  c.boite(0.2, 0.3, 0.2, 0x3a3532, { x: -29, y: 2.0, z: -8.3 }, M.tole());

  // --- Le temps : gravats, flaques sous les trous du toit, rais de lumière ---
  gravats(c, -43.5, -6.2, 1.4, Math.round(6 + 10 * u), [C.laitier, C.fonte, C.refractaire]);
  gravats(c, -16, 7, 1.0, Math.round(4 + 8 * u), [C.bardage, C.rouille, C.beton]);
  debris(c, H.x0 + 1, H.z0 + 0.5, H.x1 - 1, H.z1 - 0.5, Math.round(30 + 40 * u), [C.laitier, C.fonte, C.rouille, 0x9a8c78]);
  flaque(c, -38, 6.4, 1.3);
  flaque(c, -24, 4.8, 1.0);
  raiDeLumiere(c, [-38, 13.2, 6.4], [-38, 0.1, 6.8], 2.6);
  raiDeLumiere(c, [-24, 13.4, -3.5], [-24.3, 0.1, -3], 2.2);
  semerTouffes(c, H.x0 + 0.5, H.z0, H.x1 - 0.5, H.z1, Math.round(10 + 30 * u), PALETTE.herbeSeche, 0.04);
}

// ---------- L'accueil du Steel Experience (ancien poste de coulée) ----------

function accueil(ctx) {
  const { b, c, u } = ctx;
  const A = ACC;
  const br = M.brique();
  c.pave(A.x0, -0.02, A.z0, A.x1, 0.06, A.z1, 0xc8c0b0, M.carrelage(), { crasse: false, nuance: 0.02 });
  const int = { couleur: 0xd9d2c2, mat: M.mat() };
  mur(c, [A.x1, A.z0], [A.x0, A.z0], { h: A.h, ep: 0.3, couleur: C.brique, mat: br, batiment: b, interieur: int, ouvertures: [{ u: 2.5, l: 1.4, bas: 1.0, haut: 2.3, type: "fenetre", bris: 0.4 + 0.5 * u }, { u: 7.5, l: 1.4, bas: 1.0, haut: 2.3, type: "fenetre", bris: 0.4 + 0.5 * u }] });
  mur(c, [A.x0, A.z0], [A.x0, A.z1], { h: A.h, ep: 0.3, couleur: C.brique, mat: br, batiment: b, interieur: int, ouvertures: [{ u: 4, l: 1.4, bas: 0, haut: 2.3, type: "vide" }] });
  mur(c, [A.x0, A.z1], [A.x1, A.z1], { h: 1.1, ep: 0.3, couleur: C.brique, mat: br, batiment: b, ouvertures: [{ u: 5, l: 2.2, bas: 0, haut: 2.3, type: "vide" }] });
  mur(c, [A.x1, A.z1], [A.x1, A.z0], { h: 1.1, ep: 0.3, couleur: C.brique, mat: br, batiment: b });
  const k = b.couche("accueil : hauts murs et toit", { x: (A.x0 + A.x1) / 2, z: (A.z0 + A.z1) / 2, l: A.x1 - A.x0 + 0.8, p: A.z1 - A.z0 + 0.8 }, 1.1, A.h + 0.8);
  mur(k, [A.x0, A.z1], [A.x1, A.z1], { y0: 1.1, h: A.h - 1.1, ep: 0.3, couleur: C.brique, mat: br, ouvertures: [{ u: 5, l: 2.2, bas: 0, haut: 1.2, type: "vide" }, { u: 2, l: 1.6, bas: 0, haut: 1.3, type: "fenetre", bris: 0.4 + 0.5 * u }, { u: 8.3, l: 1.6, bas: 0, haut: 1.3, type: "fenetre", bris: 0.4 + 0.5 * u }] });
  mur(k, [A.x1, A.z1], [A.x1, A.z0], { y0: 1.1, h: A.h - 1.1, ep: 0.3, couleur: C.brique, mat: br, ouvertures: [{ u: 3, l: 1.6, bas: 0, haut: 1.3, type: "fenetre", bris: 0.5 }, { u: 7, l: 1.6, bas: 0, haut: 1.3, type: "fenetre", bris: 0.6 }] });
  // Le toit-terrasse, percé, et l'enseigne
  const trou = u > 0.4 ? [A.x0 + 2, A.z0 + 2.5, A.x0 + 4.5, A.z0 + 5] : null;
  for (let x = A.x0 - 0.15; x < A.x1 + 0.1; x += 2.6)
    for (let z = A.z0 - 0.15; z < A.z1 + 0.1; z += 2.6) {
      const x2 = Math.min(A.x1 + 0.15, x + 2.6);
      const z2 = Math.min(A.z1 + 0.15, z + 2.6);
      if (trou && x < trou[2] && x2 > trou[0] && z < trou[3] && z2 > trou[1]) continue;
      k.pave(x, A.h, z, x2, A.h + 0.22, z2, C.beton, M.beton(), { crasse: false });
    }
  for (const [x1, z1, x2, z2] of [[A.x0 - 0.15, A.z1 - 0.1, A.x1 + 0.15, A.z1 + 0.15], [A.x0 - 0.15, A.z0 - 0.15, A.x1 + 0.15, A.z0 + 0.1], [A.x1 - 0.1, A.z0, A.x1 + 0.15, A.z1], [A.x0 - 0.15, A.z0, A.x0 + 0.1, A.z1]]) k.pave(x1, A.h + 0.22, z1, x2, A.h + 0.6, z2, C.beton, M.beton(), { crasse: false });
  panneau(k, "accueil", -7, 3.15, A.z1 + 0.17, 3.6, 0.9);
  panneau(k, "watty", -3.6, 2.6, A.z1 + 0.17, 0.9, 0.9);
  buddleia(k, A.x1 - 1.2, A.z0 + 1.3, 0.7, A.h + 0.22);
  if (trou) {
    raiDeLumiere(c, [A.x0 + 3.2, A.h, A.z0 + 3.7], [A.x0 + 3.5, 0.08, A.z0 + 4.1], 1.8);
    gravats(c, A.x0 + 3.3, A.z0 + 3.8, 0.9, 8, [C.beton, C.betonSombre, 0xd9d2c2]);
  }

  // --- L'intérieur : comptoir, tourniquets, vieux pupitres de coulée, lunettes, borne qui luit encore ---
  c.pave(-11.6, 0, 2.6, -8.2, 1.05, 3.3, C.creme, M.lisse());
  c.pave(-11.7, 1.05, 2.5, -8.1, 1.12, 3.4, 0xe07a2c, M.lisse());
  c.pave(-8.9, 0, 3.3, -8.2, 1.05, 4.8, C.creme, M.lisse());
  b.obstacle(-11.6, 2.6, -8.2, 2.6, "comptoir");
  b.obstacle(-8.2, 2.6, -8.2, 4.8, "comptoir");
  panneau(c, "ecran", -10.2, 1.32, 2.85, 0.6, 0.32, PI, -0.3);
  for (const x of [-8.2, -7.0, -5.8]) {
    c.boite(0.25, 1.0, 0.7, 0xb8bcbc, { x, y: 0.5, z: 6.6 }, M.metal());
    for (let i = 0; i < 3; i++) {
      const an = (i / 3) * TAU + 0.4;
      c.poutre([x + 0.13, 0.95, 6.6], [x + 0.13 + 0.45 * Math.abs(Math.cos(an)), 0.95 + 0.4 * Math.sin(an), 6.6 + 0.45 * Math.cos(an) * 0.5], 0.04, 0xb8bcbc, M.metal());
    }
  }
  b.obstacle(-12, 6.6, -8.4, 6.6, "tourniquets");
  b.obstacle(-5.6, 6.6, -2, 6.6, "barrière");
  c.pave(-5.6, 0, 6.55, -2.2, 1.0, 6.65, 0xb8bcbc, M.metal());
  for (let i = 0; i < 3; i++) {
    const x = -11 + i * 1.7;
    c.pave(x - 0.75, 0, -1.8, x + 0.75, 0.9, -1.0, C.vert, M.tole());
    c.boite(1.5, 0.08, 0.8, C.vert, { x, y: 1.0, z: -1.35, rx: 0.35 }, M.tole());
    panneau(c, "ecran", x, 1.45, -1.6, 0.7, 0.36, 0, -0.25);
    c.boite(0.6, 0.45, 0.06, 0x2a2c2e, { x, y: 1.45, z: -1.66, rx: -0.25 }, M.lisse());
  }
  b.obstacle(-11.8, -1.0, -6.6, -1.0, "pupitres");
  panneau(c, "jours", -5.2, 1.9, A.z0 + 0.17, 0.8, 0.8);
  lunettesPendues(c, -11.55, 5.4, PI / 2, 5, 2.2);
  borne(c, -3.2, 1.2, -PI * 0.7, true);
  b.lumiere(-3.5, 1.4, 1.5, 0x7fd8ff, 1.6, 4.5, "borne Steel Experience qui luit encore (son panneau solaire)");
  // Deux chaises renversées, des dépliants
  c.boite(0.45, 0.06, 0.45, C.vert, { x: -6.2, y: 0.25, z: 3.4, rx: 1.2 }, M.tole());
  c.boite(0.45, 0.5, 0.06, C.vert, { x: -6.2, y: 0.25, z: 3.8, rx: 1.2 }, M.tole());
  c.boite(0.45, 0.06, 0.45, C.vert, { x: -4.4, y: 0.45, z: -0.2 }, M.tole());
  jonchee(c, A.x0 + 0.5, A.z0 + 0.5, A.x1 - 0.5, A.z1 - 0.5, Math.round(12 + 20 * u), [0xe9dfc6, 0xe07a2c, 0xd8d4cc, 0x9c7a45]);
  debris(c, A.x0 + 0.4, A.z0 + 0.4, A.x1 - 0.4, A.z1 - 0.4, Math.round(8 + 14 * u));
}

// ---------- La fosse des torpilles et la voie ----------

function fosseTorpilles(ctx, xDebut, avecTorpilles) {
  const { b, c, u } = ctx;
  const F = FOSSE_T;
  const y0 = -F.prof;
  const beton = M.beton();
  const x0 = Math.max(F.x0, xDebut);
  if (xDebut <= F.x1) {
    // Les parois, le fond, le mur du bout
    c.pave(x0, y0 - 0.2, F.z0, F.x1, y0, F.z1, 0x6e6a62, beton, { crasse: false });
    c.pave(x0, y0, F.z0 - 0.3, F.x1, 0.05, F.z0, C.beton, beton);
    c.pave(x0, y0, F.z1, F.x1, 0.05, F.z1 + 0.3, C.beton, beton);
    if (x0 === F.x0) c.pave(F.x0 - 0.3, y0, F.z0 - 0.3, F.x0, 0.05, F.z1 + 0.3, C.beton, beton);
    for (const x of [-42, -30, -16]) if (x > x0) c.pave(x - 0.3, y0, F.z0, x + 0.3, -0.6, F.z0 + 0.25, C.betonSombre, beton);
    gardeCorps(c, [[x0, F.z0 - 0.15], [-37, F.z0 - 0.15]], 0.05);
    gardeCorps(c, [[-35, F.z0 - 0.15], [-22, F.z0 - 0.15]], 0.05);
    gardeCorps(c, [[-20, F.z0 - 0.15], [F.x1, F.z0 - 0.15]], 0.05);
    gardeCorps(c, [[x0, F.z1 + 0.15], [F.x1 + 6, F.z1 + 0.15]], 0.05);
    b.obstacle(x0, F.z0 - 0.15, F.x1 + 4, F.z0 - 0.15, "bord de la fosse des torpilles");
    b.obstacle(x0, F.z1 + 0.15, F.x1 + 4, F.z1 + 0.15, "bord de la fosse des torpilles");
    if (x0 === F.x0) b.obstacle(F.x0, F.z0, F.x0, F.z1, "bord de la fosse des torpilles");
    // Les traverses et les rails au fond
    for (let x = x0 + 0.5; x < F.x1; x += 0.9) c.boite(0.24, 0.12, 2.5, PALETTE.boisGris, { x, y: y0 + 0.06, z: (F.z0 + F.z1) / 2, ry: c.entre(-0.04, 0.04) }, M.mat(), { nuance: 0.08 });
    for (const dz of [-0.72, 0.72]) c.pave(x0, y0 + 0.12, 13 + dz - 0.04, F.x1, y0 + 0.24, 13 + dz + 0.04, 0x6d5a4a, M.metal());
    semerTouffes(c, x0, F.z0 + 0.3, F.x1, F.z1 - 0.3, Math.round(10 + 30 * u), PALETTE.herbeSeche, y0);
    flaque(c, -28, 13, 1.6, y0 + 0.02);
  }
  // La rampe qui remonte vers l'est, puis la voie au sol jusqu'au heurtoir
  const pente = Math.atan2(F.prof, F.rampe + 8);
  const L = Math.hypot(F.prof, F.rampe + 8);
  c.repere({ x: F.x1, y: y0, z: 13, rz: pente }, () => {
    c.pave(0, -0.2, -2.5, L, 0, 2.5, 0x6e6a62, beton, { crasse: false });
    for (let x = 0.5; x < L; x += 0.9) c.boite(0.24, 0.12, 2.5, PALETTE.boisGris, { x, y: 0.06 }, M.mat(), { nuance: 0.08 });
    for (const dz of [-0.72, 0.72]) c.pave(0, 0.12, dz - 0.04, L, 0.24, dz + 0.04, 0x6d5a4a, M.metal());
  });
  // Les murs de la rampe, en gradins
  for (let i = 0; i < 4; i++) {
    const xa = F.x1 + (i * (F.rampe + 8)) / 4;
    const xb = F.x1 + ((i + 1) * (F.rampe + 8)) / 4;
    const h = F.prof * (1 - i / 4);
    for (const z of [F.z0 - 0.15, F.z1 + 0.15]) c.pave(xa, -h, z - 0.15, xb, 0.05, z + 0.15, C.beton, beton);
  }
  b.obstacle(F.x1 + 4, F.z0 - 0.15, F.x1 + 4, F.z1 + 0.15, "rampe des torpilles");
  const xh = F.x1 + F.rampe + 8;
  for (let x = xh; x < xh + 3; x += 0.9) c.boite(0.24, 0.12, 2.5, PALETTE.boisGris, { x, y: 0.06, z: 13 }, M.mat(), { nuance: 0.08 });
  for (const dz of [-0.72, 0.72]) c.pave(xh, 0.12, 13 + dz - 0.04, xh + 3.2, 0.24, 13 + dz + 0.04, 0x6d5a4a, M.metal());
  // Le heurtoir, rayé rouge et blanc délavés
  c.repere({ x: xh + 3.2, z: 13 }, () => {
    for (const dz of [-0.72, 0.72]) c.poutre([-1.4, 0.24, dz], [0, 1.2, dz], 0.2, 0x3a3532, M.tole());
    c.pave(-0.1, 0.6, -1.3, 0.25, 1.3, 1.3, 0x9a3a2e, M.tole());
    for (const dz of [-0.9, 0, 0.9]) c.pave(0.26, 0.6, dz - 0.15, 0.28, 1.3, dz + 0.15, 0xd8d0c0, M.mat(), { crasse: false });
  });
  b.obstacle(xh + 3.2, 11.7, xh + 3.2, 14.3, "heurtoir");
  if (!avecTorpilles) return;
  for (const x of TORPILLES) torpille(c, x, y0 + 2.5, 13);
}

// ---------- Le terril de laitier et la fosse à laitier ----------

function terril(ctx) {
  const { b, c, u } = ctx;
  const { x, z } = TERRIL;
  butte(c, x, z, 11.5, 7.5, 9.5, C.laitier, 2, 11);
  butte(c, x + 7, z + 4, 6, 3.6, 5, 0x655e56, 1, 4);
  butte(c, x - 3, z - 7, 5, 2.6, 4, 0x746c62, 1, 8);
  // Des coulées plus claires et ocre, figées
  for (let i = 0; i < 10; i++) {
    const a = c.hasard() * TAU;
    const r = c.entre(4, 10);
    c.poser(CAILLOU, M.mat(), i % 2 ? 0x8a7a62 : 0x9a6a42, { x: x + Math.cos(a) * r, y: Math.max(0.2, 4.6 * (1 - (r / 11.5) ** 2)), z: z + Math.sin(a) * r * 0.85, rx: c.hasard() * 3, ry: c.hasard() * 3, e: [c.entre(1, 2.4), 0.4, c.entre(0.8, 1.6)] });
  }
  obstacleCercle(b, x, z, 9.5, 12, "terril de laitier", 8);
  arbre(c, x - 2, z - 1, 5.5, "bouleau", 4.2);
  arbre(c, x + 4, z + 2, 4.6, "bouleau", 2.8);
  arbre(c, x - 6, z + 4, 4.2, "bouleau", 2.0);
  arbre(c, x + 9, z - 4, 5, "bouleau", 0.2);
  buddleia(c, x + 1.5, z - 4.5, 1.1, 3.8);
  buddleia(c, x - 5.5, z - 2, 1.0, 3.0);
  buddleia(c, x + 6.5, z + 5.5, 1.2, 1.5);
  semerTouffes(c, x - 11, z - 9, x + 11, z + 9, Math.round(20 + 30 * u), PALETTE.herbeSeche, 0.3);
}

function fosseLaitier(ctx) {
  const { b, c, u } = ctx;
  const F = FOSSE_L;
  c.pave(F.x0, -0.02, F.z0, F.x1, 0.12, F.z1, 0x55504a, M.mat(), { crasse: false });
  for (let i = 0; i < 16; i++) c.poser(CAILLOU, M.lisse(), i % 3 ? 0x5e6a5a : 0x6a5e50, { x: c.entre(F.x0 + 0.6, F.x1 - 0.6), y: 0.15, z: c.entre(F.z0 + 0.6, F.z1 - 0.6), rx: c.hasard() * 3, ry: c.hasard() * 3, e: [c.entre(0.8, 1.8), 0.35, c.entre(0.6, 1.4)] });
  mur(c, [F.x1, F.z0], [F.x0, F.z0], { h: 0.8, ep: 0.4, couleur: C.beton, mat: M.beton(), batiment: b });
  mur(c, [F.x0, F.z0], [F.x0, F.z1], { h: 0.8, ep: 0.4, couleur: C.beton, mat: M.beton(), batiment: b });
  mur(c, [F.x0, F.z1], [F.x1 - 3, F.z1], { h: 0.8, ep: 0.4, couleur: C.beton, mat: M.beton(), batiment: b });
  semerTouffes(c, F.x0, F.z0, F.x1, F.z1, Math.round(6 + 16 * u), PALETTE.herbeSeche, 0.12);
}

// ---------- La laminerie au loin (carte « fourneau ») ----------

function laminerieLoin(ctx) {
  // Hors du lot, la laminerie masquerait le premier plan : on n'en garde que la cheminée du four, au loin.
  cylY(ctx.loin, 8, -22, 0, 26, 1.1, 0.9, C.brique, M.brique(), 8, true);
  cylY(ctx.loin, 8, -22, 25.6, 26.3, 1.05, 1.05, C.suie, M.tole(), 8, true);
}

function halleCouleeLoin(ctx) {
  const k = ctx.loin;
  const H = HC;
  const bard = M.bardage();
  k.pave(H.x0, 0, H.z1 - 0.25, H.x1, H.h, H.z1, C.bardage, bard);
  k.pave(H.x1 - 0.25, 0, H.z0, H.x1, H.h, H.z1, C.bardage, bard);
  k.pave(H.x0, 0, H.z0, H.x0 + 0.25, H.h, H.z1, C.bardage, bard);
  toitDeuxPans(k, (H.x0 + H.x1) / 2, (H.z0 + H.z1) / 2, H.x1 - H.x0, H.z1 - H.z0, H.h, H.faite - H.h, { couleur: 0x9c9a92, mat: bard, debord: 0.4 });
}

// ---------- La halle de laminage ----------

function halleLaminage(ctx) {
  const { b, c, u } = ctx;
  const H = HL;
  const T = M.tole();
  const R = M.rouille();
  const bard = M.bardage();
  const zc = (H.z0 + H.z1) / 2;
  const zl = -17; // l'axe du train

  c.pave(H.x0, -0.02, H.z0, H.x1, 0.05, H.z1, 0x8a857a, M.beton(), { nuance: 0.03, crasse: false });
  for (let i = 0; i < 6; i++) c.boite(c.entre(1.5, 3.5), 0.01, c.entre(1, 2.5), 0x3c3a36, { x: c.entre(H.x0 + 14, H.x1 - 4), y: 0.06, z: c.entre(H.z0 + 2, H.z1 - 2), ry: c.hasard() * 3 }, M.lisse(), { crasse: false }); // taches d'huile

  // --- Les murs bas : bardage au nord et à l'ouest, socle de béton au sud et à l'est ---
  const bas = { couleur: C.bardage, mat: bard, batiment: b, ep: 0.25 };
  mur(c, [H.x1, H.z0], [H.x0, H.z0], { ...bas, h: 4 });
  mur(c, [H.x0, H.z0], [H.x0, H.z1], { ...bas, h: 4 });
  const socle = { couleur: C.beton, mat: M.beton(), batiment: b, ep: 0.35, h: 1.2 };
  mur(c, [H.x0, H.z1], [H.x1, H.z1], { ...socle, ouvertures: [{ u: 16, l: 2.6, bas: 0, haut: 2.6, type: "vide" }, { u: 46, l: 4.4, bas: 0, haut: 4.4, type: "vide" }] });
  mur(c, [H.x1, H.z1], [H.x1, H.z0], { ...socle, ouvertures: [{ u: 9, l: 5.6, bas: 0, haut: 5.6, type: "vide" }] });
  const pas = (H.x1 - H.x0) / 10;
  for (let i = 0; i <= 10; i++) {
    const x = H.x0 + i * pas;
    poteauI(c, x, H.z1 + 0.3, 0, H.h, 0.5, C.acier, 0, T);
    poteauI(c, x, H.z0 - 0.25, 0, H.h, 0.5, C.acier, 0, T);
  }

  // --- Ce qui s'efface : bardage haut, bandeaux vitrés, toit et lanterneau, pont roulant ---
  const k = b.couche("halle de laminage : bardage haut, toit, pont roulant", { x: (H.x0 + H.x1) / 2, z: zc, l: H.x1 - H.x0 + 1, p: H.z1 - H.z0 + 1 }, 1.2, H.faite + 2.2);
  const haut = { couleur: C.bardage, mat: bard, ep: 0.25 };
  const baiesN = [];
  for (let i = 0; i < 10; i++) baiesN.push({ u: H.x1 - (H.x0 + (i + 0.5) * pas), l: 4.2, bas: 2, haut: 4.6, type: "vide" });
  mur(k, [H.x1, H.z0], [H.x0, H.z0], { ...haut, y0: 4, h: H.h - 4, ouvertures: baiesN });
  mur(k, [H.x0, H.z0], [H.x0, H.z1], { ...haut, y0: 4, h: H.h - 4 });
  const baiesS = [{ u: 16, l: 2.6, bas: 0, haut: 1.4, type: "vide" }, { u: 46, l: 4.4, bas: 0, haut: 3.2, type: "vide" }];
  for (let i = 0; i < 10; i++) if (i !== 2 && i !== 7) baiesS.push({ u: (i + 0.5) * pas, l: 4.2, bas: 4.8, haut: 7.4, type: "vide" });
  mur(k, [H.x0, H.z1], [H.x1, H.z1], { ...haut, y0: 1.2, h: H.h - 1.2, ouvertures: baiesS, breches: u > 0.6 ? [{ u: 33.5, l: 5, profondeur: 2 + 6 * (u - 0.6) }] : [] });
  mur(k, [H.x1, H.z1], [H.x1, H.z0], { ...haut, y0: 1.2, h: H.h - 1.2, ouvertures: [{ u: 9, l: 5.6, bas: 0, haut: 4.4, type: "vide" }] });
  for (let i = 0; i < 10; i++) {
    const x = H.x0 + (i + 0.5) * pas;
    k.pave(x - 2.1, 6, H.z0 - 0.03, x + 2.1, 8.6, H.z0 + 0.03, 0x2c3436, M.verre());
    if (i !== 2 && i !== 7 && !(u > 0.6 && i === 5)) k.pave(x - 2.1, 6, H.z1 - 0.03, x + 2.1, 8.6, H.z1 + 0.03, 0x2c3436, M.verre());
  }
  for (const x of [H.x0, H.x1]) {
    const forme = new THREE.Shape([new THREE.Vector2(-(H.z1 - H.z0) / 2 - 0.2, 0), new THREE.Vector2((H.z1 - H.z0) / 2 + 0.2, 0), new THREE.Vector2(0, H.faite - H.h)]);
    const g = new THREE.ExtrudeGeometry(forme, { depth: 0.25, bevelEnabled: false });
    k.poser(g, bard, C.bardage, { x: x - 0.125, y: H.h, z: zc, ry: PI / 2 });
    g.dispose();
  }
  const trous = [{ u: -18, v: 1, l: 5, p: 0.5 + 0.5 * u }, { u: 4, v: -1, l: 4, p: 0.6 }, { u: 20, v: 1, l: 3.5, p: 0.5 }];
  if (u > 0.5) trous.push({ u: -4, v: 1, l: 3, p: 1 });
  toitDeuxPans(k, (H.x0 + H.x1) / 2, zc, H.x1 - H.x0, H.z1 - H.z0, H.h, H.faite - H.h, { couleur: 0x9c9a92, mat: bard, debord: 0.5, trous, charpente: C.acier });
  // Le lanterneau
  k.pave(H.x0 + 4, H.faite + 0.1, zc - 1.6, H.x1 - 4, H.faite + 0.2, zc - 1.4, C.acier, T);
  k.pave(H.x0 + 4, H.faite + 0.1, zc + 1.4, H.x1 - 4, H.faite + 0.2, zc + 1.6, C.acier, T);
  k.pave(H.x0 + 4, H.faite + 0.2, zc + 1.47, H.x1 - 4, H.faite + 1.3, zc + 1.53, 0x2c3436, M.verre());
  for (let x = H.x0 + 4; x < H.x1 - 4; x += 3.2) {
    if (c.hasard() < 0.25 * u) continue;
    k.boite(3.2, 0.08, 1.9, 0x9c9a92, { x: x + 1.6, y: H.faite + 1.55, z: zc - 0.8, rx: -0.3 }, bard);
    k.boite(3.2, 0.08, 1.9, 0x9c9a92, { x: x + 1.6, y: H.faite + 1.55, z: zc + 0.8, rx: 0.3 }, bard);
  }
  // Les fermes
  for (let i = 1; i < 10; i++) {
    const x = H.x0 + i * pas;
    k.poutre([x, H.h, H.z0], [x, H.h, H.z1], 0.22, C.acier, T);
    for (const s of [-1, 1]) {
      const ze = zc + (s * (H.z1 - H.z0)) / 2;
      k.poutre([x, H.h, ze], [x, H.faite, zc], 0.26, C.acier, T);
      k.poutre([x, H.h, zc + s * 4.5], [x, H.h + ((H.faite - H.h) * 4.5) / 9, zc + s * 4.5], 0.12, C.acier, T);
      k.poutre([x, H.h, zc + s * 4.5], [x, H.faite, zc], 0.1, C.acier, T);
    }
  }
  // Le pont roulant au-dessus des billettes, et son palonnier
  for (const z of [H.z0 + 0.45, H.z1 - 0.45]) k.pave(H.x0 + 0.3, 9.2, z - 0.2, H.x1 - 0.3, 9.8, z + 0.2, C.acier, T);
  const xp = 57;
  for (const dx of [-1, 1]) k.pave(xp + dx - 0.25, 9.8, H.z0 + 0.3, xp + dx + 0.25, 11, H.z1 - 0.3, C.jaune, T);
  for (const z of [H.z0 + 0.45, H.z1 - 0.45]) k.pave(xp - 1.6, 9.8, z - 0.4, xp + 1.6, 10.5, z + 0.4, C.jaune, T);
  k.pave(xp - 1.4, 11, -14.6, xp + 1.4, 11.9, -12.2, C.jaune, T);
  k.boite(1.4, 1.6, 1.4, C.jaune, { x: xp - 1.6, y: 8.8, z: H.z1 - 1.8 }, T);
  for (const dz of [-0.2, 0.2]) k.poutre([xp, 11, -13.4 + dz], [xp, 5.2, -13.4 + dz], 0.05, 0x2a2a2a, M.metal());
  k.pave(xp - 3, 4.8, -13.6, xp + 3, 5.2, -13.2, C.jaune, T);
  for (const dx of [-2.6, 2.6]) k.poutre([xp + dx, 4.8, -13.4], [xp + dx, 2.9, -13.4], 0.04, 0x2a2a2a, M.metal());
  // Les enseignes
  panneau(k, "steel", 35, 10.3, H.z1 + 0.16, 16, 2.5);
  panneau(k, "forges", H.x1 + 0.16, 8.4, -17, 7.6, 1.9, PI / 2);
  arbre(k, H.x0 + 10, zc + 6, 3.4, "bouleau", H.h + 1.4);
  buddleia(k, H.x0 + 30, zc - 6, 0.9, H.h + 1.2);
  buddleia(k, H.x1 - 8, zc + 7.2, 0.8, H.h + 0.6);
  mousse(k, 26, H.h + 1.0, zc + 6, 1.6, 4);

  // --- Le four de réchauffage poussant, contre le pignon ouest ---
  {
    const [x1, x2, z1, z2] = [H.x0 + 0.15, 15.2, H.z0 + 0.15, -12];
    c.pave(x1, 0, z1, x2, 4.2, z2, 0x8c5040, M.brique());
    for (let x = x1 + 1.2; x < x2; x += 2.2) {
      c.pave(x - 0.15, 0, z2, x + 0.15, 4.6, z2 + 0.25, C.acierSombre, T); // les poteaux de serrage
    }
    for (let z = z1 + 1.5; z < z2; z += 2.4) c.pave(x2, 0, z - 0.15, x2 + 0.25, 4.6, z + 0.15, C.acierSombre, T);
    c.pave(x1, 4.2, z1, x2 + 0.25, 4.5, z2 + 0.25, C.acierSombre, T);
    // Les brûleurs et leurs conduites, sur la face sud
    for (let x = x1 + 2.2; x < x2 - 1; x += 2.2) {
      cylZ(c, x, 2.6, z2 + 0.25, z2 + 0.85, 0.22, C.acierSombre, T, 6);
      c.tube([x, 2.6, z2 + 0.85], [x, 4.9, z2 + 0.85], 0.1, C.cuivre, T, 5);
    }
    c.tube([x1 + 1.5, 4.9, z2 + 0.85], [x2 - 1.2, 4.9, z2 + 0.85], 0.18, C.rouille, R, 6);
    // La porte de défournement et une billette restée à moitié sortie
    c.pave(x2 + 0.25, 0.4, zl - 0.8, x2 + 0.35, 1.8, zl + 0.8, C.suie, M.mat(), { crasse: false });
    c.boite(3.4, 0.16, 0.16, 0x6a5a50, { x: x2 + 1.2, y: 1.0, z: zl }, R);
    obstacleRect(b, H.x0, H.z0, x2 + 0.3, z2 + 0.3, "four de réchauffage");
    const kc = k;
    cylY(kc, 8, -22, 4.5, 26, 1.1, 0.9, C.brique, M.brique(), 10, true);
    cylY(kc, 8, -22, 25.6, 26.3, 1.05, 1.05, C.suie, T, 10, true);
  }

  // --- La table à rouleaux (deux trous pour la traverser), les cinq cages, la cisaille ---
  const segments = [[15.4, 43], [46.5, 57.5], [59.5, 63]];
  for (const [x1, x2] of segments) {
    for (const s of [-1, 1]) c.pave(x1, 0, zl + s * 0.6 - 0.12, x2, 0.85, zl + s * 0.6 + 0.12, C.acier, T);
    for (let x = x1 + 0.45; x < x2; x += 0.9) {
      if (CAGES.some((xc) => Math.abs(x - xc) < 0.9)) continue;
      cylZ(c, x, 0.78, zl - 0.55, zl + 0.55, 0.15, 0x6a6460, M.metal(), 6);
    }
    b.obstacle(x1, zl - 0.7, x2, zl - 0.7, "table à rouleaux");
    b.obstacle(x1, zl + 0.7, x2, zl + 0.7, "table à rouleaux");
  }
  // Les rouleaux tombés dans les trous
  for (const [x, z, ry] of [[44, -16.2, 0.3], [45.5, -17.8, 1.4], [58.2, -16.6, 0.9]]) {
    const g = new THREE.CylinderGeometry(0.15, 0.15, 1.1, 6);
    c.poser(g, M.metal(), 0x6a6460, { x, y: 0.15, z, rx: PI / 2, ry });
    g.dispose();
  }
  for (const xc of CAGES) {
    for (const s of [-1, 1]) {
      const z = zl + s * 1.65;
      c.pave(xc - 0.55, 0, z - 0.4, xc - 0.25, 4.0, z + 0.4, C.vert, T);
      c.pave(xc + 0.25, 0, z - 0.4, xc + 0.55, 4.0, z + 0.4, C.vert, T);
      c.pave(xc - 0.55, 0, z - 0.4, xc + 0.55, 0.5, z + 0.4, C.vert, T);
    }
    c.pave(xc - 0.6, 4.0, zl - 2.1, xc + 0.6, 4.7, zl + 2.1, C.vert, T);
    cylY(c, xc, zl, 4.7, 5.5, 0.42, 0.42, C.acierSombre, T, 8);
    cylZ(c, xc, 1.15, zl - 1.85, zl + 1.85, 0.42, 0x5a5856, M.metal(), 10);
    cylZ(c, xc, 2.05, zl - 1.85, zl + 1.85, 0.42, 0x5a5856, M.metal(), 10);
    // Les allonges vers la cage à pignons, le moteur
    c.tube([xc, 1.15, zl - 2.0], [xc, 1.3, -21.4], 0.17, C.acierSombre, M.metal(), 6);
    c.tube([xc, 2.05, zl - 2.0], [xc, 1.9, -21.4], 0.17, C.acierSombre, M.metal(), 6);
    c.pave(xc - 0.9, 0, -22.8, xc + 0.9, 2.3, -21.4, C.vert, T);
    c.pave(xc - 1.1, 0, -25.6, xc + 1.1, 0.6, -23.0, C.betonSombre, M.beton());
    cylZ(c, xc, 1.7, -25.4, -23.0, 1.05, 0x4f5f6a, T, 12);
    cylZ(c, xc, 1.7, -23.0, -22.8, 0.4, C.acierSombre, T, 8);
    obstacleRect(b, xc - 0.6, zl - 2.1, xc + 0.6, zl + 2.1, "cage de laminoir");
    obstacleRect(b, xc - 1.1, -25.6, xc + 1.1, -21.4, "moteur du laminoir");
  }
  // La cisaille
  for (const s of [-1, 1]) c.pave(47.4, 0, zl + s * 1.1 - 0.35, 48.6, 3.4, zl + s * 1.1 + 0.35, 0xb98a3a, T);
  c.pave(47.3, 3.4, zl - 1.6, 48.7, 4.2, zl + 1.6, 0xb98a3a, T);
  c.pave(47.85, 1.6, zl - 0.8, 48.15, 2.6, zl + 0.8, 0x8a8c8e, M.metal());
  obstacleRect(b, 47.4, zl - 1.5, 48.6, zl + 1.5, "cisaille");
  panneau(c, "danger", 48, 2.6, zl + 1.46, 0.8, 0.8);

  // --- Le refroidissoir (au nord), chargé de ronds ---
  {
    const [x1, x2, z1, z2] = [49.5, 62.5, -24.6, -18.6];
    for (const z of [z1 + 0.5, z2 - 0.5]) c.pave(x1, 0, z - 0.2, x2, 0.5, z + 0.2, C.acier, T);
    for (let x = x1 + 0.3; x < x2; x += 0.75) c.pave(x - 0.05, 0.5, z1, x + 0.05, 0.8, z2, 0x5e5a56, T);
    for (let i = 0; i < 11; i++) {
      const z = c.entre(z1 + 0.4, z2 - 0.4);
      c.pave(x1 - c.entre(0, 0.6), 0.8, z - 0.035, x2 + c.entre(0, 0.6), 0.87, z + 0.035, i % 3 ? 0x6a5e56 : C.rouille, M.rouille());
    }
    obstacleRect(b, x1, z1, x2, z2, "refroidissoir");
  }

  // --- Les piles de billettes : le trésor ---
  {
    const pile = (x1, z1, couches, rangs) => {
      for (let n = 0; n < couches; n++) {
        const y = 0.06 + n * 0.22;
        for (const dx of [0.6, 3, 5.4]) c.pave(x1 + dx - 0.08, y, z1 - 0.1, x1 + dx + 0.08, y + 0.06, z1 + rangs * 0.19 + 0.1, PALETTE.boisGris, M.mat());
        for (let r = 0; r < rangs; r++) {
          if (n === couches - 1 && c.hasard() < 0.3) continue;
          const z = z1 + r * 0.19 + 0.08;
          c.pave(x1 + c.entre(-0.08, 0.08), y + 0.06, z - 0.075, x1 + 6 + c.entre(-0.08, 0.08), y + 0.21, z + 0.075, c.hasard() < 0.5 ? 0x8a827c : 0x9a7a66, M.rouille(), { crasse: false });
        }
      }
      obstacleRect(b, x1, z1 - 0.1, x1 + 6, z1 + rangs * 0.19 + 0.1, "pile de billettes");
    };
    pile(51.5, -14.6, 5, 8);
    pile(51.5, -12.2, 4, 8);
    pile(58.6, -14.4, 7, 9);
    pile(58.6, -11.2, 3, 7);
    // Des billettes tombées, en travers
    for (const [x, z, ry] of [[54, -9.8, 0.25], [56.8, -10.2, -0.15], [50.2, -11, 1.3]]) c.boite(6, 0.15, 0.15, 0x8a7a6c, { x, y: 0.08, z, ry }, M.rouille());
    panneau(c, "flamme", 64.62, 0.75, -13.4, 0.9, 0.9, PI / 2);
  }
  // La lampe frontale tombée près des billettes, son faisceau sur le sol
  {
    const x = 57.6;
    const z = -9.7;
    const g = new THREE.TorusGeometry(0.1, 0.02, 3, 8).rotateX(PI / 2);
    c.poser(g, M.mat(), 0x2a2a2a, { x, y: 0.03, z });
    g.dispose();
    c.boite(0.07, 0.05, 0.06, 0x3a3c3e, { x: x - 0.1, y: 0.04, z }, M.lisse());
    const f = new THREE.BufferGeometry();
    f.setAttribute("position", new THREE.Float32BufferAttribute([x - 0.14, 0.03, z, x - 2.4, 0.03, z - 0.7, x - 2.4, 0.03, z + 0.7], 3));
    f.computeVertexNormals();
    c.poser(f, M.lueur(), 0xdfe8ff, {}, { crasse: false, nuance: 0 });
    f.dispose();
    b.lumiere(x - 0.3, 0.15, z, 0xe9f1ff, 3, 7, "lampe frontale tombée (pile presque à plat)");
  }

  // --- La cabine du lamineur ---
  {
    const [x1, x2, z1, z2] = [31.6, 35.2, -12.6, -10.2];
    for (const [a, bb] of [[[x1, z1], [x2, z1]], [[x1, z2], [x2, z2]], [[x1, z1], [x1, z2]]]) mur(c, a, bb, { h: 1.0, ep: 0.1, couleur: C.vert, mat: T, batiment: b });
    mur(c, [x2, z2], [x2, z1], { h: 1.0, ep: 0.1, couleur: C.vert, mat: T, batiment: b, ouvertures: [{ u: 1.2, l: 0.9, bas: 0, haut: 2.2, type: "vide" }] });
    for (const [x, z] of [[x1, z1], [x2, z1], [x1, z2], [x2, z2]]) c.pave(x - 0.06, 0, z - 0.06, x + 0.06, 2.5, z + 0.06, C.vert, T);
    c.pave(x1, 1.0, z1 - 0.02, x2, 2.3, z1 + 0.02, 0x2c3436, M.verre());
    c.pave(x1 - 0.02, 1.0, z1, x1 + 0.02, 2.3, z2, 0x2c3436, M.verre());
    c.pave(x1 + 0.2, 0, z1 + 0.1, x2 - 0.2, 0.95, z1 + 0.7, 0x6a7a70, T);
    c.boite(x2 - x1 - 0.4, 0.06, 0.6, 0x5a6a60, { x: (x1 + x2) / 2, y: 1.0, z: z1 + 0.45, rx: 0.3 }, T);
    for (let i = 0; i < 8; i++) c.boite(0.06, 0.04, 0.06, [0xc8362b, 0xd8b23a, 0x5aa04a][i % 3], { x: x1 + 0.5 + i * 0.32, y: 1.06, z: z1 + 0.45 }, M.lisse(), { crasse: false });
    c.boite(0.5, 0.06, 0.5, 0x2a2c2e, { x: (x1 + x2) / 2, y: 0.5, z: z2 - 0.8 }, M.mat());
    k.pave(x1 - 0.15, 2.5, z1 - 0.15, x2 + 0.15, 2.65, z2 + 0.15, C.vert, T);
  }

  // --- Le Steel Experience dans la nef ---
  for (let x = 18; x < 46; x += 1.6) {
    if (x > 30.5 && x < 36.5) continue;
    c.poutre([x, 0, -13.6], [x, 1.0, -13.6], 0.06, C.jaune, T);
    c.poutre([x, 1.0, -13.6], [x + 1.6, 1.0, -13.6], 0.05, C.jaune, T);
  }
  borne(c, 19.5, -11.2, PI * 0.9);
  borne(c, 44.4, -12.0, -PI * 0.85);
  lunettesPendues(c, 22.4, -8.9, 0, 6);
  {
    c.pave(26.6, 0, -10.2, 26.7, 1.4, -10.1, C.acierSombre, T);
    panneau(c, "chapitre", 26.65, 1.65, -10.04, 1.6, 0.8);
  }
  // Le temps
  gravats(c, 38, -14.8, 1.2, Math.round(6 + 10 * u), [C.bardage, C.rouille, C.beton]);
  gravats(c, 22, -24.4, 0.9, Math.round(4 + 8 * u), [C.bardage, C.rouille]);
  debris(c, H.x0 + 12, H.z0 + 0.5, H.x1 - 1, H.z1 - 0.5, Math.round(30 + 40 * u), [C.rouille, C.bardage, 0x6a6460, C.beton]);
  flaque(c, 17.5, -11, 1.4);
  flaque(c, 39, -11.4, 1.1);
  flaque(c, 53, -20.8, 1.2);
  raiDeLumiere(c, [17, 14.4, -12.6], [17.4, 0.1, -11.2], 2.8);
  raiDeLumiere(c, [39, 14.8, -12.9], [39.3, 0.1, -11.6], 2.4);
  raiDeLumiere(c, [55, 14.4, -21], [55.3, 0.1, -20.2], 2.4);
  semerTouffes(c, H.x0 + 12, H.z0 + 0.5, H.x1 - 0.5, H.z1 - 0.5, Math.round(10 + 30 * u), PALETTE.herbeSeche, 0.05);
  buddleia(c, 63.5, -24.6, 0.9);
  buddleia(c, 16.5, -24.8, 0.7);
}

// ---------- Les bâtiments du personnel ----------

function batiments(ctx) {
  const { b, c, u } = ctx;
  const [xa, xr, xv, xl, xc, xb] = BAT.x; // 4, 18, 34, 46, 58, 70
  const z0 = BAT.z0;
  const z1 = BAT.z1;
  const h = BAT.h;
  const br = M.brique();
  const coup = 1.1; // la coupe des façades sud et est, et des refends (hauteur d'allège)
  const casse = 0.35 + 0.55 * u;

  // Les sols
  c.pave(xa, -0.02, z0, xr, 0.06, z1, 0x9a958a, M.beton(), { crasse: false, nuance: 0.02 });
  c.pave(xr, -0.02, z0, xc, 0.06, z1, 0xc4bcab, M.carrelage(), { crasse: false, nuance: 0.02 });
  c.pave(xc, -0.02, z0, xb, 0.06, z1, 0xd8cbb6, M.carrelage(), { crasse: false, nuance: 0.02 });

  // --- Les murs bas (toujours visibles) ---
  const int = { couleur: 0xd9d2c2, mat: M.mat() };
  mur(c, [xb, z0], [xa, z0], {
    h, ep: 0.3, couleur: C.brique, mat: br, batiment: b, interieur: int,
    ouvertures: [
      { u: xb - 8, l: 1.4, bas: 0, haut: 2.3, type: "vide" },
      { u: xb - 50, l: 1.4, bas: 0, haut: 2.3, type: "vide" },
      ...[13, 22, 30, 40, 54, 64].map((x) => ({ u: xb - x, l: 1.8, bas: 2.2, haut: 3.2, type: "fenetre", bris: casse, croisillons: 2, traverses: 1 })),
    ],
  });
  mur(c, [xa, z0], [xa, z1], { h, ep: 0.3, couleur: C.brique, mat: br, batiment: b, interieur: int });
  const portes = [[11, 2.8], [26, 1.6], [40, 1.4], [52, 1.6], [64, 1.6]];
  mur(c, [xa, z1], [xb, z1], { h: coup, ep: 0.3, couleur: C.brique, mat: br, batiment: b, ouvertures: portes.map(([x, l]) => ({ u: x - xa, l, bas: 0, haut: 2.3, type: "vide" })) });
  mur(c, [xb, z1], [xb, z0], { h: coup, ep: 0.3, couleur: C.brique, mat: br, batiment: b });
  for (const x of [xr, xv, xl, xc]) mur(c, [x, z0], [x, z1], { h: coup, ep: 0.2, couleur: 0xd9d2c2, mat: M.mat(), batiment: b, ouvertures: x === xv ? [{ u: 9.5, l: 1.2, bas: 0, haut: 2.2, type: "vide" }] : [] });

  // --- Ce qui s'efface : hauts murs, toits, enseignes ---
  const k = b.couche("bâtiments du personnel : hauts murs et toits", { x: (xa + xb) / 2, z: (z0 + z1) / 2, l: xb - xa + 0.8, p: z1 - z0 + 0.8 }, coup, h + 1);
  const fen = (x, l = 1.8) => ({ u: x - xa, l, bas: 0, haut: 1.3, type: "fenetre", bris: casse, croisillons: 1 });
  mur(k, [xa, z1], [xb, z1], {
    y0: coup, h: h - coup, ep: 0.3, couleur: C.brique, mat: br,
    ouvertures: [...portes.map(([x, l]) => ({ u: x - xa, l, bas: 0, haut: 1.2, type: "vide" })), fen(15.5), fen(21), fen(30.5), fen(37), fen(43.5), fen(48.5), fen(55.5), fen(60.8, 3.2), fen(67, 3.6)],
    breches: u > 0.7 ? [{ u: 34, l: 3, profondeur: 1.4 }] : [],
  });
  mur(k, [xb, z1], [xb, z0], { y0: coup, h: h - coup, ep: 0.3, couleur: C.brique, mat: br, ouvertures: [{ u: 6, l: 2, bas: 0, haut: 1.3, type: "fenetre", bris: casse }] });
  for (const x of [xr, xv, xl, xc]) mur(k, [x, z0], [x, z1], { y0: coup, h: h - coup, ep: 0.2, couleur: 0xd9d2c2, mat: M.mat(), ouvertures: x === xv ? [{ u: 9.5, l: 1.2, bas: 0, haut: 1.1, type: "vide" }] : [] });
  // Les toits-terrasses, percés, et leur acrotère
  const trous = u > 0.35 ? [[21, 9, 24, 12], [49, 4, 52, 7]] : [];
  for (let x = xa - 0.15; x < xb; x += 3) {
    for (let z = z0 - 0.15; z < z1; z += 3) {
      const x2 = Math.min(xb + 0.15, x + 3);
      const z2 = Math.min(z1 + 0.15, z + 3);
      if (trous.some(([p, q, r, s]) => x < r && x2 > p && z < s && z2 > q)) continue;
      k.pave(x, h, z, x2, h + 0.22, z2, C.beton, M.beton(), { crasse: false, nuance: 0.03 });
    }
  }
  for (const [x1, za, x2, zb] of [[xa - 0.15, z1 - 0.1, xb + 0.15, z1 + 0.15], [xa - 0.15, z0 - 0.15, xb + 0.15, z0 + 0.1], [xb - 0.1, z0, xb + 0.15, z1], [xa - 0.15, z0, xa + 0.1, z1]]) k.pave(x1, h + 0.22, za, x2, h + 0.65, zb, C.beton, M.beton(), { crasse: false });
  for (const [r, x, l] of [["refractaires", 11, 4.4], ["vestiaires", 26, 4], ["labo", 40, 4], ["cantine", 52, 3.2]]) panneau(k, r, x, 3.1, z1 + 0.17, l, l / 4);
  panneau(k, "boutique", 64, 3.15, z1 + 0.17, 3.6, 1.8);
  arbre(k, 29, 6, 3.4, "bouleau", h + 0.22);
  buddleia(k, 13, 4, 0.8, h + 0.22);
  buddleia(k, 61, 11, 0.9, h + 0.22);
  mousse(k, 42, h + 0.22, 8, 1.6, 5);
  mousse(k, 8, h + 0.22, 11, 1.2, 3);
  for (const [p, q, r, s] of trous) {
    raiDeLumiere(c, [(p + r) / 2, h, (q + s) / 2], [(p + r) / 2 + 0.3, 0.08, (q + s) / 2 + 0.4], 2.2);
    gravats(c, (p + r) / 2, (q + s) / 2 + 0.3, 1.0, Math.round(6 + 6 * u), [C.beton, C.betonSombre, 0xd9d2c2]);
  }

  // --- Le magasin des réfractaires : palettes de briques, rayonnages de creusets, sacs d'argile ---
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 2; j++) {
      if (i === 3 && j === 1) continue;
      const x = 6 + i * 2.2;
      const z = 6.4 + j * 2.6;
      c.pave(x - 0.6, 0, z - 0.5, x + 0.6, 0.15, z + 0.5, PALETTE.bois, M.mat());
      const hp = c.entre(0.6, 1.1);
      c.pave(x - 0.55, 0.15, z - 0.45, x + 0.55, 0.15 + hp, z + 0.45, (i + j) % 3 ? C.refractaire : 0xc4a882, M.brique());
      obstacleRect(b, x - 0.6, z - 0.5, x + 0.6, z + 0.5, "palette de briques réfractaires");
    }
  for (let i = 0; i < 14; i++) c.boite(0.23, 0.07, 0.11, C.refractaire, { x: c.entre(5, 15), y: 0.1, z: c.entre(11, 13.4), ry: c.hasard() * 3 }, M.brique());
  {
    const [x1, x2] = [11, 17.6];
    for (const x of [x1, (x1 + x2) / 2, x2]) for (const z of [2.3, 3.4]) c.pave(x - 0.05, 0, z - 0.05, x + 0.05, 2.6, z + 0.05, 0x3a6aa0, T());
    for (const y of [0.3, 1.2, 2.1]) {
      c.pave(x1, y, 2.3, x2, y + 0.08, 3.4, 0xc06a32, T());
      for (let x = x1 + 0.4; x < x2 - 0.2; x += 0.55) {
        if (c.hasard() < 0.25) continue;
        const gr = c.hasard() < 0.7;
        cylY(c, x, 2.85, y + 0.08, y + 0.08 + (gr ? 0.5 : 0.35), gr ? 0.18 : 0.15, gr ? 0.22 : 0.19, gr ? C.graphite : 0xc8b089, gr ? M.lisse() : M.mat(), 8);
      }
    }
    obstacleRect(b, x1, 2.3, x2, 3.4, "rayonnage");
    // Un creuset tombé, fendu
    cylY(c, 15.8, 5.2, 0, 0.42, 0.2, 0.17, C.graphite, M.lisse(), 8);
  }
  for (let i = 0; i < 6; i++) c.boite(0.55, 0.25, 0.85, 0xcfc2a2, { x: 15.5 + (i % 3) * 0.62, y: 0.12 + Math.floor(i / 3) * 0.24, z: 12.3, ry: c.entre(-0.1, 0.1) }, M.mat(), { nuance: 0.06 });
  obstacleRect(b, 15.2, 11.8, 17.3, 12.8, "sacs d'argile");
  // Le chariot élévateur rouillé
  c.repere({ x: 7, z: 11.6, ry: 0.4 }, () => {
    c.boite(1.0, 0.9, 2.0, 0xb98a3a, { y: 0.75 }, T());
    c.boite(1.0, 0.05, 0.9, 0x2a2826, { y: 2.1, z: 0.2 }, T());
    for (const s of [-1, 1]) c.poutre([s * 0.45, 0.4, 0.5], [s * 0.45, 2.1, 0.5], 0.06, 0x2a2826, T());
    for (const s of [-1, 1]) c.poutre([s * 0.4, 0.3, -1.05], [s * 0.4, 2.4, -1.05], 0.1, 0x3a3532, T());
    for (const s of [-1, 1]) c.boite(0.12, 0.06, 1.0, 0x3a3532, { x: s * 0.25, y: 0.1, z: -1.6 }, T());
    for (const [dx, dz] of [[-0.55, 0.6], [0.55, 0.6], [-0.55, -0.6], [0.55, -0.6]]) cylX(c, dx - 0.12, dx + 0.12, 0.3, dz, 0.3, 0x2a2826, M.mat(), 8);
  });
  obstacleCercle(b, 7, 11.6, 1.2, 6, "chariot élévateur");

  // --- Les vestiaires : casiers, bancs, combinaisons aluminisées, casques, et le camp des Charbonniers ---
  const casier = (x, z, ry, n) => {
    c.repere({ x, z, ry }, () => {
      for (let i = 0; i < n; i++) {
        const px = (i - (n - 1) / 2) * 0.42;
        c.boite(0.4, 1.85, 0.5, 0x6f7f74, { x: px, y: 0.93 }, T(), { nuance: 0.06 });
        if (c.hasard() < 0.35) c.boite(0.38, 1.7, 0.03, 0x6f7f74, { x: px - 0.18 + 0.15, y: 0.95, z: 0.4, ry: -1.0 }, T());
        else c.boite(0.04, 0.12, 0.02, 0xb8bcbc, { x: px + 0.12, y: 1.1, z: 0.26 }, M.metal());
      }
    });
  };
  casier(23, 2.45, 0, 10);
  obstacleRect(b, 20.8, 2.15, 25.2, 2.7, "casiers");
  casier(26.5, 7.6, 0, 8);
  casier(26.5, 8.4, PI, 8);
  obstacleRect(b, 24.8, 7.3, 28.2, 8.7, "casiers");
  for (const [x, z] of [[23, 4.4], [26.5, 10.2]]) {
    c.pave(x - 1.6, 0.42, z - 0.18, x + 1.6, 0.48, z + 0.18, PALETTE.bois, M.mat());
    for (const s of [-1, 1]) c.pave(x + s * 1.4 - 0.05, 0, z - 0.15, x + s * 1.4 + 0.05, 0.42, z + 0.15, C.acierSombre, T());
  }
  // Les combinaisons aluminisées, pendues à la tringle
  c.poutre([30, 2.2, 2.6], [33.6, 2.2, 2.6], 0.05, C.acierSombre, M.metal());
  for (let i = 0; i < 5; i++) {
    if (i === 3 && u > 0.5) continue;
    const x = 30.4 + i * 0.75;
    c.repere({ x, z: 2.75, ry: c.entre(-0.25, 0.25) }, () => {
      c.boite(0.5, 0.72, 0.26, C.alu, { y: 1.62 }, M.metal(), { crasse: false });
      c.boite(0.36, 0.42, 0.3, C.alu, { y: 2.1 }, M.metal(), { crasse: false });
      c.boite(0.26, 0.14, 0.02, 0x8a6a2a, { y: 2.12, z: 0.16 }, M.lisse(), { crasse: false }); // la visière dorée
      for (const s of [-1, 1]) {
        c.boite(0.2, 0.82, 0.22, C.alu, { x: s * 0.13, y: 0.86 }, M.metal(), { crasse: false });
        c.boite(0.14, 0.62, 0.16, C.alu, { x: s * 0.33, y: 1.62, rz: s * 0.08 }, M.metal(), { crasse: false });
      }
    });
  }
  c.boite(0.5, 0.12, 1.3, C.alu, { x: 33, y: 0.08, z: 4.4, ry: 0.6 }, M.metal()); // une combinaison tombée
  c.pave(19, 2.3, 2.3, 22.6, 2.34, 2.7, PALETTE.bois, M.mat());
  for (let i = 0; i < 5; i++) {
    const g = new THREE.SphereGeometry(0.17, 8, 3, 0, TAU, 0, PI / 2);
    c.poser(g, M.lisse(), i % 2 ? 0xe0e0d8 : 0xd8b23a, { x: 19.3 + i * 0.7, y: 2.34, z: 2.5 });
    g.dispose();
  }
  panneau(c, "casque", 24, 2.6, z0 + 0.17, 0.7, 0.7);
  // Le camp des Charbonniers : brasero, couchages, sacs
  {
    const x = 30.2;
    const z = 9.6;
    cylY(c, x, z, 0, 0.7, 0.32, 0.34, C.rouilleSombre, T(), 8, true);
    cylY(c, x, z, 0.12, 0.16, 0.3, 0.3, C.suie, M.mat(), 8);
    for (let i = 0; i < 7; i++) c.boite(0.12, 0.08, 0.1, i % 2 ? 0xff7a2a : 0xd2451c, { x: x + c.entre(-0.18, 0.18), y: 0.62, z: z + c.entre(-0.18, 0.18), ry: c.hasard() * 3 }, M.mat(), { crasse: false });
    c.boite(1.8, 0.01, 1.8, C.suie, { x, y: 0.08, z, ry: 0.4 }, M.mat(), { crasse: false });
    c.boite(0.8, 0.15, 1.9, 0x5a4a38, { x: x + 1.6, y: 0.14, z: z + 1.6, ry: 0.2 }, M.mat());
    c.boite(0.8, 0.15, 1.9, 0x6a5a48, { x: x - 1.8, y: 0.14, z: z + 1.2, ry: -0.3 }, M.mat());
    c.boite(0.5, 0.5, 0.4, 0x3a3634, { x: x + 0.4, y: 0.25, z: z + 2.0 }, M.mat()); // sac de coke
    c.boite(0.6, 0.45, 0.4, PALETTE.bois, { x: x - 0.9, y: 0.22, z: z - 1.1, ry: 0.5 }, M.mat());
    panneau(c, "flamme", 33.85, 1.0, 9.6, 0.8, 0.8, -PI / 2);
    b.lumiere(x, 1.1, z, 0xff8a3d, 8, 11, "brasero des Charbonniers (vestiaires)");
  }

  // --- Le laboratoire de contrôle : paillasses, balances, éprouvettes, échantillons ---
  for (const [x1, x2, za, zb] of [[35, 45, 2.3, 3.1], [37.5, 43.5, 6.6, 7.6]]) {
    c.pave(x1, 0, za, x2, 0.88, zb, 0xd9d2c2, M.mat());
    c.pave(x1 - 0.03, 0.88, za - 0.03, x2 + 0.03, 0.94, zb + 0.03, 0x2a2c2e, M.lisse());
    obstacleRect(b, x1, za, x2, zb, "paillasse");
  }
  for (const x of [36, 39.2]) {
    c.boite(0.5, 0.18, 0.4, C.blanc, { x, y: 1.03, z: 2.7 }, M.lisse());
    cylY(c, x, 2.7, 1.12, 1.14, 0.14, 0.14, 0xb8bcbc, M.metal(), 8);
  }
  c.pave(41, 0.94, 2.4, 42.6, 1.6, 3.05, C.blanc, M.lisse()); // le spectromètre mort
  panneau(c, "ecran", 41.8, 1.35, 3.07, 0.9, 0.42);
  for (let i = 0; i < 10; i++) {
    if (c.hasard() < 0.2) continue;
    cylY(c, 38 + i * 0.45, 7.1, 0.94, 1.12, 0.05, 0.05, 0x9a9a98, M.metal(), 6); // les éprouvettes de traction
  }
  for (let i = 0; i < 6; i++) cylY(c, 41 + i * 0.32, 7.0, 0.94, 1.18, 0.045, 0.045, 0xc8dce0, M.verre(), 6); // des flacons
  c.pave(43.6, 0, 11.2, 45.6, 0.8, 13.6, 0x8a8c8e, T()); // le bac à échantillons
  for (let i = 0; i < 8; i++) c.boite(0.04, 0.3, 0.04, 0x6a6460, { x: 43.9 + (i % 4) * 0.45, y: 0.95, z: 11.8 + Math.floor(i / 4) * 0.9, rx: 0.2 }, M.metal());
  obstacleRect(b, 43.6, 11.2, 45.6, 13.6, "bac à échantillons");
  for (const [x, z] of [[36.5, 4.2], [40.5, 8.4]]) {
    cylY(c, x, z, 0, 0.6, 0.16, 0.16, C.acierSombre, T(), 6);
    cylY(c, x, z, 0.6, 0.66, 0.2, 0.2, 0x2a2c2e, M.mat(), 8);
  }
  c.boite(0.3, 0.06, 0.3, 0x2a2c2e, { x: 41.4, y: 0.1, z: 9.6, rx: 1.3 }, M.mat()); // un tabouret renversé
  jonchee(c, 35, 3.5, 45, 13.5, Math.round(10 + 16 * u), [0xe9e4d6, 0xd8d4cc, 0xbdb6a6]);
  for (let i = 0; i < 8; i++) c.boite(0.04, 0.01, 0.04, 0xc8dce0, { x: c.entre(37, 44), y: 0.07, z: c.entre(3.5, 6.2) }, M.verre(), { crasse: false });

  // --- La cantine : comptoir, tables et bancs, l'ardoise du Burger Lingot ---
  c.pave(47, 0, 2.4, 57, 1.0, 3.2, 0xb8bcbc, M.metal());
  c.pave(47, 1.0, 2.35, 57, 1.06, 3.25, 0x8a8c8e, M.metal());
  obstacleRect(b, 47, 2.4, 57, 3.2, "comptoir de la cantine");
  for (let i = 0; i < 4; i++) c.boite(0.45, 0.03, 0.32, i % 2 ? 0xc06a32 : 0x2f6f73, { x: 48 + i * 1.6, y: 1.08, z: 2.8, ry: 0.1 }, M.lisse());
  panneau(c, "burger", 52, 2.4, z0 + 0.17, 1.6, 1.2);
  for (const [x, z, ry, renv] of [[49.5, 6.2, 0, false], [54.2, 6.2, 0, false], [49.5, 10.6, 0.1, false], [54.5, 11, 0.3, true]]) {
    c.repere({ x, z, ry }, () => {
      if (renv) {
        c.boite(3.0, 0.06, 0.9, 0xe2d9c4, { y: 0.45, z: 0.5, rx: 1.45 }, M.lisse());
        for (const s of [-1, 1]) c.boite(0.06, 0.7, 0.06, C.acierSombre, { x: s * 1.3, y: 0.45, z: 0.1, rx: 1.45 - PI / 2 }, M.metal());
      } else {
        c.pave(-1.5, 0.72, -0.45, 1.5, 0.76, 0.45, 0xe2d9c4, M.lisse());
        for (const s of [-1, 1]) c.pave(s * 1.3 - 0.04, 0, -0.04, s * 1.3 + 0.04, 0.72, 0.04, C.acierSombre, M.metal());
      }
      for (const s of [-1, 1]) {
        if (renv && s === 1) continue;
        c.pave(-1.5, 0.42, s * 0.85 - 0.15, 1.5, 0.46, s * 0.85 + 0.15, 0xc06a32, M.lisse());
        for (const t of [-1, 1]) c.pave(t * 1.3 - 0.03, 0, s * 0.85 - 0.03, t * 1.3 + 0.03, 0.42, s * 0.85 + 0.03, C.acierSombre, M.metal());
      }
    });
    if (!renv) obstacleRect(b, x - 1.5, z - 0.45, x + 1.5, z + 0.45, "table");
  }
  jonchee(c, 47, 4, 57, 13.5, Math.round(10 + 14 * u), [0xc06a32, 0x2f6f73, 0xe9dfc6, 0x9c7a45]);

  // --- La boutique du Steel Experience ---
  c.pave(59, 0, 2.4, 63.5, 1.0, 3.1, 0x2a2826, M.lisse());
  c.pave(58.95, 1.0, 2.35, 63.55, 1.05, 3.15, 0xe07a2c, M.lisse());
  obstacleRect(b, 59, 2.4, 63.5, 3.1, "comptoir de la boutique");
  c.boite(0.4, 0.3, 0.06, 0x2a2c2e, { x: 61, y: 1.25, z: 2.75, rx: -0.4 }, M.lisse()); // la caisse connectée
  panneau(c, "portecles", 62.6, 1.55, z0 + 0.17, 1.6, 0.5);
  for (const [x, z] of [[61, 7.8], [65.2, 9.2]]) {
    // Le présentoir tournant : mât, couronnes de crochets, porte-clés
    cylY(c, x, z, 0, 0.08, 0.35, 0.35, 0x2a2826, M.metal(), 8);
    c.poutre([x, 0, z], [x, 1.8, z], 0.05, 0xb8bcbc, M.metal());
    for (const y of [0.9, 1.3, 1.7]) {
      for (let i = 0; i < 6; i++) {
        if (c.hasard() < 0.35) continue;
        const an = (i / 6) * TAU + y;
        c.poutre([x, y, z], [x + Math.cos(an) * 0.3, y + 0.03, z + Math.sin(an) * 0.3], 0.015, 0xb8bcbc, M.metal());
        c.boite(0.06, 0.1, 0.02, 0x8d969a, { x: x + Math.cos(an) * 0.3, y: y - 0.08, z: z + Math.sin(an) * 0.3, ry: -an }, M.metal());
      }
    }
    obstacleCercle(b, x, z, 0.4, 6, "présentoir");
  }
  // Les lingots souvenirs, en vitrine, et les T-shirts
  c.pave(66.4, 0, 2.4, 69.6, 0.9, 3.0, C.creme, M.lisse());
  for (let i = 0; i < 7; i++) {
    if (c.hasard() < 0.3) continue;
    c.boite(0.18, 0.07, 0.09, i % 3 ? 0x8d969a : PALETTE.dore, { x: 66.8 + i * 0.42, y: 0.94, z: 2.7, ry: c.entre(-0.3, 0.3) }, M.metal());
  }
  c.pave(66.4, 1.6, 2.2, 69.6, 1.65, 2.6, C.acierSombre, M.metal());
  for (let i = 0; i < 4; i++) {
    if (i === 2 && u > 0.6) continue;
    c.boite(0.55, 0.7, 0.04, 0x2b2b2e, { x: 66.9 + i * 0.75, y: 1.22, z: 2.5 }, M.mat());
    panneau(c, "tshirt", 66.9 + i * 0.75, 1.28, 2.53, 0.5, 0.25);
  }
  obstacleRect(b, 66.4, 2.2, 69.6, 3.0, "vitrine des lingots");
  c.boite(0.55, 0.04, 0.7, 0x2b2b2e, { x: 64.2, y: 0.08, z: 5.2, ry: 0.5 }, M.mat()); // un T-shirt par terre
  lunettesPendues(c, 69.6, 10.4, PI / 2, 5, 2.2);
  panneau(c, "lunettes", 69.82, 1.8, 7.9, 1.2, 0.6, -PI / 2);
  borne(c, 68.4, 5.2, -PI / 2, true);
  b.lumiere(68.1, 1.4, 5.2, 0x7fd8ff, 1.6, 4.5, "borne Steel Experience qui luit encore (boutique)");
  panneau(c, "watty", 59.1, 2.2, 6, 0.9, 0.9, PI / 2);
  jonchee(c, 59, 3.5, 69.5, 13.5, Math.round(8 + 14 * u), [0x2b2b2e, 0xe07a2c, 0xe9dfc6, 0x8d969a]);
  for (let i = 0; i < 10; i++) c.boite(0.05, 0.01, 0.05, 0xc8dce0, { x: c.entre(59, 69), y: 0.07, z: c.entre(13.2, 14.6) }, M.verre(), { crasse: false }); // les éclats de la vitrine

  debris(c, xa + 0.4, z0 + 0.4, xb - 0.4, z1 - 0.4, Math.round(30 + 40 * u));
  semerTouffes(c, xa + 0.5, z0 + 0.5, xb - 0.5, z1 - 0.5, Math.round(8 + 24 * u), PALETTE.herbeSeche, 0.06);

  function T() {
    return M.tole();
  }
}

// ---------- La cour, le wagon de billettes, la navette, le totem ----------

function cour(ctx) {
  const { b, c, u } = ctx;
  // L'épi de voie et le wagon plat chargé de billettes
  const z = -3.2;
  for (let x = 26; x < 62; x += 0.9) c.boite(0.24, 0.12, 2.5, PALETTE.boisGris, { x, y: 0.06, z, ry: c.entre(-0.04, 0.04) }, M.mat(), { nuance: 0.08 });
  for (const dz of [-0.72, 0.72]) c.pave(25.6, 0.12, z + dz - 0.04, 62, 0.24, z + dz + 0.04, 0x6d5a4a, M.metal());
  semerTouffes(c, 26, z - 1.3, 62, z + 1.3, Math.round(16 + 24 * u));
  c.repere({ x: 44, z }, () => {
    c.pave(-6, 0.9, -1.3, 6, 1.15, 1.3, 0x4a4542, M.rouille());
    c.pave(-6, 0.7, -0.4, 6, 0.9, 0.4, 0x3a3532, M.tole());
    for (const xx of [-5.6, -2, 2, 5.6]) for (const s of [-1, 1]) c.poutre([xx, 1.15, s * 1.25], [xx, 1.9, s * 1.25], 0.1, 0x3a3532, M.tole());
    for (const s of [-1, 1])
      for (const dx of [-4.2, -3, 3, 4.2])
        for (const dz of [-0.72, 0.72]) {
          if (s < 0 && dx > 0) continue;
          const g = new THREE.CylinderGeometry(0.42, 0.42, 0.12, 10);
          c.poser(g, M.tole(), 0x3a3532, { x: dx, y: 0.5, z: dz, rx: PI / 2 });
          g.dispose();
        }
    for (let n = 0; n < 3; n++) for (let r = 0; r < 6; r++) c.pave(-5.8, 1.15 + n * 0.16, -0.6 + r * 0.2, 0.2 + c.entre(-0.1, 0.1), 1.3 + n * 0.16, -0.46 + r * 0.2, 0x8a7a6c, M.rouille(), { crasse: false });
    for (let r = 0; r < 4; r++) c.pave(0.6, 1.15, -0.6 + r * 0.2, 5.8, 1.3, -0.46 + r * 0.2, 0x8a7a6c, M.rouille(), { crasse: false });
    c.poutre([-5.9, 1.6, -1.2], [5.9, 1.4, 1.2], 0.03, 0x2a2a2a, M.metal());
  });
  obstacleRect(b, 38, z - 1.3, 50, z + 1.3, "wagon plat");
  // Le chariot de manutention et quelques caisses
  for (const [x, zz, ry] of [[14, -4, 0.3], [15.2, -3.4, 0.1], [62, 0.5, 0.6]]) c.boite(1.1, 0.8, 0.9, PALETTE.bois, { x, y: 0.4, z: zz, ry }, M.mat(), { nuance: 0.08 });
  // La navette électrique du Steel Experience, à plat
  c.repere({ x: 48, z: 21, ry: 0.12, rz: 0.03 }, () => {
    c.boite(7.2, 1.0, 2.4, C.creme, { y: 0.85 }, M.lisse());
    c.boite(7.2, 0.18, 2.42, 0xe07a2c, { y: 1.2 }, M.lisse());
    c.boite(7.0, 0.85, 2.3, 0x2c3436, { y: 1.75 }, M.verre());
    for (let x = -3.2; x <= 3.2; x += 1.6) c.boite(0.08, 0.85, 2.32, C.creme, { x, y: 1.75 }, M.lisse());
    c.boite(7.2, 0.15, 2.4, C.creme, { y: 2.25 }, M.lisse());
    c.boite(1.0, 0.06, 0.8, 0x2a3a5a, { x: -1.5, y: 2.36 }, M.lisse());
    for (const [dx, dz] of [[-2.6, -1.1], [2.6, -1.1], [-2.6, 1.1], [2.6, 1.1]]) cylZ(c, dx, 0.32, dz - 0.14, dz + 0.14, 0.36, 0x2a2826, M.mat(), 8);
  });
  panneau(c, "steel", 48.2, 1.2, 22.3, 3.4, 0.53, 0.12);
  obstacleCercle(b, 48, 21, 3.7, 8, "navette du Steel Experience", 1.3);
  // Le totem d'entrée
  for (const s of [-1, 1]) c.pave(30 + s * 2.4 - 0.12, 0, 22 - 0.12, 30 + s * 2.4 + 0.12, 3.6, 22 + 0.12, C.acierSombre, M.metal());
  c.pave(27.4, 2.7, 21.95, 32.6, 3.6, 22.05, 0x1f1d1c, M.lisse());
  panneau(c, "steel", 30, 3.15, 22.07, 5.2, 0.81);
  panneau(c, "watty", 33.3, 3.15, 22.07, 0.85, 0.85);
  b.obstacle(27.6, 22, 32.4, 22, "totem");
  // Les bornes de stationnement et un peu de désordre
  for (let x = 40; x < 60; x += 2.5) cylY(c, x, 17.6, 0, 0.7, 0.1, 0.1, 0xb8b4ac, M.beton(), 6);
  debris(c, 4, -7.5, 66, 1.5, Math.round(16 + 20 * u), [C.rouille, C.beton, 0x6a6460]);
  jonchee(c, 4, 15, 70, 26, Math.round(16 + 20 * u));
}

// ---------- La végétation ----------

function vegetationFourneau(ctx, x1, z1, x2, z2) {
  const { c, u } = ctx;
  const arbres = [
    [-66, -30, 9], [-68, -16, 8], [-64, -6, 7], [-52, -15, 6], [-50, 24, 7], [-40, 22, 8], [-30, 23, 6], [-18, 24, 7.5],
    [-6, 22, 6], [8, 24, 8], [10, 4, 6], [6, -34, 7], [-20, -37, 6], [-3, -30, 8], [9, -26, 5.5], [-70, 4, 6], [-14, 18, 5],
  ];
  for (const [x, z, h] of arbres) {
    if (x < x1 || x > x2 || z < z1 || z > z2) continue;
    arbre(c, x, z, h * (0.75 + 0.4 * u), c.hasard() < 0.8 ? "bouleau" : "feuillu");
  }
  for (const [x, z, s] of [[-44, 18, 1.2], [-12, 12, 1.0], [-25, -26.5, 1.1], [-52, -24, 1.3], [-16, -22, 0.9], [4, 14, 1.0], [-62, -36, 1.2], [-1, 18, 0.8], [-36, 18.5, 1.1]]) {
    if (x > x1 && x < x2 && z > z1 && z < z2) buddleia(c, x, z, s);
  }
  for (const [x, z] of [[-20, -26], [-45, 20], [2, 9], [-56, 0], [-8, 14]]) if (x > x1 && x < x2 && z > z1 && z < z2) arbuste(c, x, z, c.entre(0.9, 1.5));
  lierre(c, -13.85, 0, 0, PI / 2, 4, 3.4, 30);
  lierre(c, CHEM.x + 2.4, 0, CHEM.z + 1, 0.9, 1.6, 6, 26);
  semerTouffes(c, x1, z1, x2, z2, Math.round(30 + 50 * u), PALETTE.herbeSeche);
}

function vegetationLaminerie(ctx, x1, z1, x2, z2) {
  const { c, u } = ctx;
  const arbres = [
    [0, -12, 7], [1, 8, 6], [-2, 20, 8], [10, 22, 6], [20, 25, 7], [40, 25, 5], [62, 23, 7.5], [72, 18, 8], [73, 2, 6],
    [72, -12, 7], [70, -30, 8], [50, -31, 6], [30, -31, 7], [12, -31, 6], [36, 0, 5], [20, -4.5, 5.5], [58, -1, 4.5],
  ];
  for (const [x, z, h] of arbres) {
    if (x < x1 || x > x2 || z < z1 || z > z2) continue;
    arbre(c, x, z, h * (0.75 + 0.4 * u), c.hasard() < 0.8 ? "bouleau" : "feuillu");
  }
  for (const [x, z, s] of [[6, -5, 1.0], [32, -6.5, 0.9], [66.8, 1.5, 1.2], [3, 15.5, 1.1], [68, -28, 1.2], [24, 17, 0.9], [56, 16.2, 1.0], [-2, -2, 1.2]]) {
    if (x > x1 && x < x2 && z > z1 && z < z2) buddleia(c, x, z, s);
  }
  lierre(c, BAT.x[0], 0, 8, -PI / 2, 5, 3.4, 30);
  lierre(c, HL.x1 + 0.15, 0, -23, PI / 2, 4, 3.6, 26);
  semerTouffes(c, x1, z1, x2, z2, Math.round(30 + 50 * u), PALETTE.herbeSeche);
}

// ---------- Le contrat : creer({ usure, carte }) ----------

/** Recentre tout ce qui a été construit dans le repère du site sur l'origine du lot de la carte. */
function recentrer(groupe, o, lot) {
  const vues = new Set();
  groupe.traverse((obj) => {
    if (obj.geometry && !vues.has(obj.geometry)) {
      vues.add(obj.geometry);
      obj.geometry.translate(-o.x, 0, -o.z);
    }
  });
  const ud = groupe.userData;
  for (const t of ud.toits) {
    t.boite = { ...t.boite, x: arr(t.boite.x - o.x), z: arr(t.boite.z - o.z) };
    if (t.horsDe) t.horsDe = { ...t.horsDe, x: t.horsDe.x - o.x, z: t.horsDe.z - o.z };
  }
  const dedans = (x, z) => Math.abs(x) <= lot.l / 2 + 1 && Math.abs(z) <= lot.p / 2 + 1;
  ud.obstacles = ud.obstacles
    .map((s) => ({ ...s, x1: arr(s.x1 - o.x), z1: arr(s.z1 - o.z), x2: arr(s.x2 - o.x), z2: arr(s.z2 - o.z) }))
    .filter((s) => dedans(s.x1, s.z1) || dedans(s.x2, s.z2));
  ud.lumieres = ud.lumieres.map((l) => ({ ...l, x: arr(l.x - o.x), z: arr(l.z - o.z) })).filter((l) => dedans(l.x, l.z));
  return groupe;
}

export function creer({ usure = 0.7, carte = "fourneau" } = {}) {
  const def = CARTES.find((k) => k.id === carte) ?? CARTES[0];
  const o = ORIGINES[def.id];
  const b = new Batiment(1959, usure);
  const ctx = { b, c: b.c, u: usure };
  const lot = [o.x - def.lot.l / 2, o.z - def.lot.p / 2, o.x + def.lot.l / 2, o.z + def.lot.p / 2];

  if (def.id === "fourneau") {
    ctx.loin = b.couche("cheminée du four de la laminerie (au loin)", { x: 8, z: -22, l: 3, p: 3 }, 0, 27);
    const evite = [
      [HC.x0, HC.z0 - 2.4, HC.x1, HC.z1],
      [ACC.x0, ACC.z0, ACC.x1, ACC.z1],
      [FOSSE_T.x0 - 0.3, FOSSE_T.z0 - 0.3, FOSSE_T.x1 + FOSSE_T.rampe + 11, FOSSE_T.z1 + 0.3],
      [TERRIL.x - 11, TERRIL.z - 8, TERRIL.x + 11, TERRIL.z + 9],
      [FOSSE_L.x0, FOSSE_L.z0, FOSSE_L.x1, FOSSE_L.z1],
      [-3.5, -17.5, -0.5, -14.5],
      [HL.x0, HL.z0, HL.x1, HL.z1],
      [BAT.x[0], BAT.z0, BAT.x[5], BAT.z1],
    ];
    sol(ctx, ...lot, evite);
    hautFourneau(ctx, false);
    cowpers(ctx, false);
    planIncline(ctx, false);
    halleCoulee(ctx);
    accueil(ctx);
    fosseTorpilles(ctx, FOSSE_T.x0, true);
    terril(ctx);
    fosseLaitier(ctx);
    laminerieLoin(ctx);
    vegetationFourneau(ctx, ...lot);
  } else {
    ctx.loin = b.couche("haut fourneau, cowpers et halle de coulée (au loin)", { x: -32, z: -16, l: 60, p: 50 }, 0, 50);
    const evite = [
      [HL.x0, HL.z0, HL.x1, HL.z1],
      [BAT.x[0], BAT.z0, BAT.x[5], BAT.z1],
      [FOSSE_T.x1 - 1, FOSSE_T.z0 - 0.3, FOSSE_T.x1 + FOSSE_T.rampe + 11, FOSSE_T.z1 + 0.3],
    ];
    sol(ctx, ...lot, evite);
    halleLaminage(ctx);
    batiments(ctx);
    cour(ctx);
    fosseTorpilles(ctx, lot[0], false);
    hautFourneau(ctx, true);
    cowpers(ctx, true);
    planIncline(ctx, true);
    halleCouleeLoin(ctx);
    vegetationLaminerie(ctx, ...lot);
  }
  return recentrer(b.construire(), o, def.lot);
}
