// Le carreau de la mine et son chevalement (Book 20 §3.2 « Mine abandonnée », Montagne et forêt, lointain, danger ●●●●).
//
// Inspiration : les carreaux du Nord et de Lorraine (Wallers-Arenberg, puits Couriot) et les mines de montagne des
// Alpes. Au pied de la montagne, le chevalement métallique de 28 m avec sa molette (l'autre est tombée dans la cour),
// la salle des machines en brique à grandes baies cintrées et sa machine d'extraction à deux bobines, le criblage de
// bois et de tôle avec ses trémies et son convoyeur, la voie étroite et ses wagonnets renversés, l'entrée de galerie
// étayée puis murée, le terril noir envahi de bouleaux. Plus bas, les bains-douches : la lampisterie et ses râteliers,
// la « salle des pendus » où les vêtements des mineurs pendent encore au plafond, les bureaux ; à côté, la forge, que
// des Charbonniers ont rallumée.
//
// Deux cartes qui partagent le même plan (« repère du site » : +x à l'est, +z au sud, montagne au nord) ; chacune est
// recentrée sur son lot (voir `recentrer`) :
// - « carreau » : le chevalement, la salle des machines (en détail), le criblage, la voie, la galerie, le terril ; les
//   bains et la forge en plus simple ;
// - « batiments » : la lampisterie, la salle des pendus, les bureaux et la forge en détail ; le chevalement au fond.

import * as THREE from "three";
import {
  Batiment, PALETTE, matiere, matiereMonde, matiereTexture, matiereLueur, dessiner, aleatoire, taches, mur, lierre as lierreA, touffes,
  semerTouffes as semerA, gravats, debris as debrisA, jonchee as joncheeA, mousse, arbuste, arbre, raiDeLumiere as raiA, flaque, toitDeuxPans,
} from "../commun/atelier.js";

// La végétation et le petit désordre coûtent cher en triangles : on les dose (comme l'hôpital).
const lierre = (c, x, y0, z, ry, l, h, n) => lierreA(c, x, y0, z, ry, l, h, Math.round(n * 0.4));
const semerTouffes = (c, x1, z1, x2, z2, n, t, y) => semerA(c, x1, z1, x2, z2, Math.round(n * 0.5), t, y);
const debris = (c, x1, z1, x2, z2, n, t, y) => debrisA(c, x1, z1, x2, z2, Math.round(n * 0.6), t, y);
const jonchee = (c, x1, z1, x2, z2, n, t, y) => joncheeA(c, x1, z1, x2, z2, Math.round(n * 0.6), t, y);
// Un seul matériau de lueur pour tous les rais (l'opacité fait la clé du cache)
const raiDeLumiere = (c, a, b, l) => raiA(c, a, b, l, 0.1);

const PI = Math.PI;
const TAU = PI * 2;

// ---------- Le plan du site (repère « site ») ----------

const TOUR = { x: 0, z: -6, bas: 3.4, haut: 2.4, h: 21 }; // le chevalement : demi-côté en bas et en haut, hauteur du plancher
const MOL = { x: 1.2, y: 24.1, r: 2.5, z1: -7.4, z2: -4.6 }; // les molettes (z2 : celle qui est tombée)
const PUITS = { x: -1.3, z: -6 }; // l'axe des câbles dans le puits
const MACH = { x0: 16, x1: 32, z0: -16, z1: 0, h: 13.5, faite: 17.5 }; // la salle des machines
const BOB = { x: 22.5, y: 3.2, r: 2.2, z1: -8.4, z2: -5.6 }; // les bobines
const CRIB = { x0: -22, x1: -12, z0: -10, z1: -2 }; // le criblage
const GAL = { x: -8, z: -25.5 }; // l'entrée de la galerie
const TERRIL = { x: -43, z: -21, r: 17, h: 16 };
const BAINS = { x0: -26, x1: 4, z0: 6, z1: 17, xl: -17, xb: -3, h: 4.4, hp: 8 }; // lampisterie | pendus | bureaux
const FORGE = { x0: 10, x1: 22, z0: 7, z1: 16, h: 4.6 };
const ORIGINES = { carreau: { x: 0, z: -8 }, batiments: { x: -4, z: 9 } };

function arr(v) {
  return Math.round(v * 10) / 10;
}
function vers(carte, liste) {
  const o = ORIGINES[carte];
  return liste.map((p) => ({ ...p, x: arr(p.x - o.x), z: arr(p.z - o.z) }));
}

// ---------- La fiche ----------

const FOUILLE = [
  { x: 18.6, z: -14.8, quoi: "établi de la salle des machines : clés, burettes, graisse (outillage)" },
  { x: 25, z: -13.2, quoi: "rouleaux de câble d'acier (lourd, à couper)" },
  { x: 30.6, z: -6.2, quoi: "poste du machiniste : manomètres et robinets en laiton, petite mécanique" },
  { x: 10, z: -4.4, quoi: "la chute de câbles : câble d'acier" },
  { x: 7.6, z: -13.4, quoi: "la molette arrachée : acier, roulements (il faut des outils)" },
  { x: -1.3, z: -7.4, quoi: "le wagonnet resté dans la cage : minerai de fer" },
  { x: -19.5, z: -8.6, quoi: "sous les trémies : charbon minéral (seaux, sacs)" },
  { x: -14.5, z: -3.6, quoi: "tas de charbon tombé du criblage" },
  { x: -8, z: -18.4, quoi: "les wagonnets de la voie : minerai, ferraille, roues" },
  { x: -10.6, z: -14.6, quoi: "wagonnet renversé : minerai de fer" },
  { x: -28.5, z: -10.5, quoi: "pile de rails et de traverses (rails)" },
  { x: -8, z: -27.6, quoi: "entrée de la galerie : étais, lampes de mineur posées, minerai" },
  { x: 7, z: 1.4, quoi: "drone-inspecteur écrasé : batterie, moteurs, petite électronique" },
  { x: -3.6, z: 1.6, quoi: "camp des Charbonniers : braises, sac de charbon" },
  // Les bains et la forge
  { x: -25.2, z: 9.5, quoi: "râteliers de la lampisterie : lampes de mineur (lumière), mèches, verres" },
  { x: -24.4, z: 6.8, quoi: "râtelier de charge : lampes à accus à recharger, câbles" },
  { x: -21.5, z: 12, quoi: "râtelier central : lampes, pièces de laiton" },
  { x: -14.6, z: 6.8, quoi: "les douches : robinetterie, tuyaux de cuivre" },
  { x: -10, z: 12.6, quoi: "vêtements des pendus : vestes, bottes, casques (tissu, cuir)" },
  { x: -4.6, z: 6.9, quoi: "distributeur « Air pur premium » : bouteilles d'oxygène aromatisé" },
  { x: 0.4, z: 14.2, quoi: "table des plans : plans des galeries (la carte des filons)" },
  { x: -2.4, z: 12.4, quoi: "étagère des registres (papier, registres de paie)" },
  { x: 3.2, z: 7, quoi: "coffre-fort ouvert : enveloppes de paie vides, quelques pièces" },
  { x: 19.5, z: 8.2, quoi: "la forge rallumée : charbon, tisonniers" },
  { x: 17.6, z: 10.4, quoi: "enclume, marteaux, pinces (le trésor des Charbonniers)" },
  { x: 10.8, z: 8.8, quoi: "établi et panneau d'outils de la forge (outillage)" },
  { x: 13.2, z: 9.6, quoi: "marteau-pilon : pièces de fonte, courroies" },
  { x: 20.8, z: 14.6, quoi: "tas de charbon de la forge" },
  { x: 8.2, z: 13.6, quoi: "pile de rails et d'essieux de wagonnets (rails, roues)" },
];
const ETEINTS = [
  { x: 26, z: -12.6, type: "ancien habitant : machiniste en bleu de chauffe (salle des machines)" },
  { x: -8, z: -23.6, type: "ancien habitant : mineur au casque, la lampe éteinte au front (devant la galerie)" },
  { x: -17, z: -7.6, type: "rampant (sous le criblage)" },
  { x: -25, z: -19, type: "gelé (au pied de la montagne, à l'ombre)" },
  { x: 7, z: -8, type: "errant (sous les jambes de force)" },
  { x: 14, z: 3, type: "errant (cour)" },
  { x: -31, z: -4, type: "putréfié (dans la flaque noire au pied du terril)" },
  { x: 27, z: 5, type: "errant (près du portail)" },
  { x: -12, z: 10.4, type: "ancien habitant : mineur en bleu de travail (salle des pendus)" },
  { x: -6.6, z: 14.6, type: "ancien habitant : mineur à demi rhabillé (salle des pendus)" },
  { x: -15, z: 8, type: "rampant (sous les bancs, côté douches)" },
  { x: -22.6, z: 15.4, type: "ancien habitant : lampiste en blouse grise (lampisterie)" },
  { x: 1, z: 9, type: "ancien habitant : caissier en manches de lustrine (bureau de paie)" },
  { x: 7.4, z: 4, type: "errant (entre la forge et les bains)" },
  { x: -18, z: 20, type: "errant (devant les bains)" },
  { x: 24, z: 13, type: "équipé : casque de mineur et lampe frontale (derrière la forge)" },
];
const ENTREES = [
  { x: 36, z: 2.8, nature: "portail du carreau (un vantail tombé)" },
  { x: 24, z: 0, nature: "grande porte de la salle des machines" },
  { x: 16, z: -13, nature: "petite porte ouest de la salle des machines (côté chevalement)" },
  { x: -8, z: -25.6, nature: "entrée de la galerie (murée quatre mètres plus loin)" },
  { x: -10, z: 6, nature: "porte nord des bains-douches (côté carreau)" },
  { x: -10, z: 17, nature: "porte sud des bains-douches (salle des pendus)" },
  { x: -26, z: 15.6, nature: "porte de la lampisterie (pignon ouest)" },
  { x: 0, z: 6, nature: "porte du bureau de paie" },
  { x: 2, z: 17, nature: "porte du bureau de l'ingénieur" },
  { x: 10, z: 11.5, nature: "grand portail de la forge" },
  { x: 13.6, z: 16, nature: "porte sud de la forge" },
];

const CARTES = [
  {
    id: "carreau",
    nom: "Le carreau et le chevalement",
    lot: { l: 80, p: 52 },
    depart: { x: 32, z: 11 },
    description: "le chevalement, la salle des machines et sa machine d'extraction, le criblage, la voie, l'entrée de galerie, le terril ; les bains et la forge en plus simple (on les fouille sur l'autre carte)",
  },
  {
    id: "batiments",
    nom: "Les bains, la lampisterie et la forge",
    lot: { l: 62, p: 34 },
    depart: { x: -6, z: 13 },
    description: "la lampisterie et ses râteliers, la salle des pendus, les bureaux, la forge rallumée ; le chevalement au fond",
  },
];
// Chaque carte a ses propres points : la cour pour l'une, les intérieurs des bains et de la forge pour l'autre
// (sur la carte du carreau, les bains et la forge sont simplifiés ; on les fouille sur l'autre carte).
const PART = {
  carreau: { fouille: FOUILLE.slice(0, 14), eteints: ETEINTS.slice(0, 8), entrees: [...ENTREES.slice(0, 5), ENTREES[9]] },
  batiments: { fouille: FOUILLE.slice(14), eteints: ETEINTS.slice(8), entrees: ENTREES.slice(4) },
};
for (const k of CARTES) {
  k.fouille = vers(k.id, PART[k.id].fouille);
  k.eteints = vers(k.id, PART[k.id].eteints);
  k.entrees = vers(k.id, PART[k.id].entrees);
}

export const FICHE = {
  id: "mine",
  nom: "Le carreau de la mine et son chevalement",
  lieu: "Mine abandonnée · Montagne et forêt · lointain",
  environnement: "montagne et forêt",
  anneau: "lointain",
  danger: 4,
  recit:
    "Pendant un siècle, on a remonté d'ici le charbon qui chauffait la vallée ; à la fin, la Compagnie le vendait « 100 % vert, extrait avec bienveillance », inspecté par drone. Le matin de la Grande Panne, la machine d'extraction s'est arrêtée avec une cage à mi-chemin, et personne n'est venu reprendre ses vêtements au plafond de la salle des pendus. Les Charbonniers ont rallumé la forge : pour eux, la mine n'est pas morte, elle dort.",
  inspiration: "les carreaux du Nord et de Lorraine (Wallers-Arenberg, puits Couriot), les mines de montagne abandonnées des Alpes ; la salle des pendus, la lampisterie et la salle des machines des photos d'urbex",
  reperes: [
    "Le chevalement métallique de 28 m : tour en treillis, jambes de force, portique de levage ; une seule molette en haut, l'autre arrachée et posée dans la cour",
    "La cage arrêtée à la recette, un wagonnet encore dedans ; la bouche du puits grillagée, noire",
    "La salle des machines en brique à baies cintrées : la machine d'extraction à deux bobines, ses cylindres à vapeur, ses bielles, le poste du machiniste et ses indicateurs de profondeur",
    "Le câble encore tendu jusqu'à la molette, l'autre qui pend du pignon et s'enroule dans la cour : la chute de câbles",
    "Le criblage en bois et tôle sur pilotis, ses trémies, son convoyeur incliné ; la voie étroite et ses wagonnets renversés",
    "L'entrée de galerie à flanc de montagne : cadres d'étais, rails qui s'enfoncent, mur de parpaings et planches, le noir derrière",
    "Le terril noir envahi de bouleaux, la montagne et ses sapins",
    "La salle des pendus : vêtements, bottes, casques et paniers suspendus au plafond par des chaînes, les taquets numérotés, les bancs, les douches",
    "La lampisterie : râteliers de lampes, tableau des jetons, râtelier de charge des lampes à accus",
    "Les bureaux : la table des plans des galeries, le coffre-fort ouvert de la paie",
    "La forge rallumée par des Charbonniers, l'enclume, le marteau-pilon, « Le feu ne trahit pas »",
    "L'Abondance : le panneau « Charbon 100 % vert, extrait avec bienveillance », le drone-inspecteur de sécurité écrasé, le distributeur « Air pur premium »",
  ],
  lot: CARTES[0].lot,
  depart: CARTES[0].depart,
  cartes: CARTES,
};

// ---------- Couleurs ----------

const C = {
  brique: 0x9a5a44,
  briqueSombre: 0x6f3d2e,
  beton: 0xb0aba0,
  betonSombre: 0x8a857b,
  pierre: 0xa39d90,
  chev: 0x7d5040, // chevalement : minium passé
  chevSombre: 0x5c3a2f,
  machine: 0x6f8c7c, // vert machine
  machineFonce: 0x55695e,
  laiton: PALETTE.laiton,
  acier: 0x6b6f6c,
  cable: 0x3b3d3c,
  rail: 0x5e5048,
  schiste: 0x4f4b47,
  charbon: 0x272524,
  toit: 0x7a7266,
  tole: 0x8f9490,
  rouille: PALETTE.rouille,
  rouilleSombre: PALETTE.rouilleSombre,
  bois: PALETTE.bois,
  boisSombre: PALETTE.boisSombre,
  boisGris: PALETTE.boisGris,
  wagon: 0x6c5446,
  grille: 0x3d403e,
  suie: 0x2c2926,
  noir: 0x0d0c0b,
  roche: 0x6e746c,
  rocheSombre: 0x575c55,
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
  beton: () => matiereMonde("beton"),
  brique: () => matiereMonde("brique"),
  carrelage: () => matiereMonde("carrelage"),
  ondulee: () =>
    une("ondulee", () => {
      const m = matiereTexture(texOndulee(), { roughness: 0.8, metalness: 0.2 });
      m.userData.tuile = 4;
      return m;
    }),
  vitrage: (usure) => {
    const casse = Math.round((0.15 + 0.6 * usure) * 5) / 5;
    return une("vitrage" + casse, () => {
      const m = new THREE.MeshStandardMaterial({ map: texVitrage(casse), vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, roughness: 0.25, metalness: 0.3 });
      m.userData.sansOmbre = true;
      return m;
    });
  },
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

/** La tôle ondulée : ondes verticales, coulures de rouille, plaques piquées. Tuile de 4 m. */
function texOndulee() {
  return dessiner("mine-ondulee", 128, 128, (g) => {
    const a = aleatoire(702);
    for (let x = 0; x < 128; x += 4) {
      const d = g.createLinearGradient(x, 0, x + 4, 0);
      d.addColorStop(0, "#d8dad6");
      d.addColorStop(0.5, "#f2f2ee");
      d.addColorStop(1, "#b8bab4");
      g.fillStyle = d;
      g.fillRect(x, 0, 4, 128);
    }
    coulures(g, a, 30, 128, 128, 20, 90, "rgba(150,70,30,0.5)");
    taches(g, a, 12, "rgba(140,70,35,0.45)", 4, 16, 128, 128);
    grain(g, a, 500, 128, 128, 0.05);
  });
}

/** Le vitrage à petits bois : 8 × 7 carreaux par tuile de 4 m ; une part `casse` des carreaux manque. */
function texVitrage(casse) {
  return dessiner("mine-vitrage" + casse, 256, 256, (g) => {
    const a = aleatoire(703 + Math.round(casse * 10));
    g.clearRect(0, 0, 256, 256);
    const lc = 32;
    const hc = 256 / 7;
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 7; j++) {
        const r = a();
        const x = i * lc;
        const y = j * hc;
        if (r < casse) {
          if (a() < 0.5) {
            g.fillStyle = "rgba(150,170,165,0.55)";
            g.beginPath();
            const cx = a() < 0.5 ? x : x + lc;
            const cy = a() < 0.5 ? y : y + hc;
            g.moveTo(cx, cy);
            g.lineTo(cx + (cx === x ? 1 : -1) * lc * (0.3 + a() * 0.5), cy);
            g.lineTo(cx, cy + (cy === y ? 1 : -1) * hc * (0.3 + a() * 0.5));
            g.fill();
          }
        } else if (r < casse + 0.05) {
          g.fillStyle = "rgba(110,92,68,0.97)"; // planche clouée
          g.fillRect(x, y, lc, hc);
        } else {
          const v = 135 + Math.floor(a() * 40);
          const d = g.createLinearGradient(0, y, 0, y + hc);
          d.addColorStop(0, `rgba(${v},${v + 14},${v + 10},${0.45 + a() * 0.2})`);
          d.addColorStop(1, `rgba(${v - 45},${v - 35},${v - 40},${0.65 + a() * 0.25})`);
          g.fillStyle = d;
          g.fillRect(x, y, lc, hc);
        }
      }
    g.fillStyle = "rgba(40,42,40,1)";
    for (let i = 0; i <= 8; i++) g.fillRect(i * lc - 1.5, 0, 3, 256);
    for (let j = 0; j <= 7; j++) g.fillRect(0, j * hc - 1.5, 256, 3);
  });
}

// L'atlas : panneaux, enseignes, la lampisterie peinte, les plans, les graffitis. Une seule texture, un seul appel.
const ATLAS = {
  charbonVert: [0, 0, 1024, 320],
  airPur: [0, 320, 256, 384],
  lampes: [256, 320, 512, 192],
  plans: [768, 320, 256, 256],
  jetons: [256, 512, 512, 96],
  surveille: [256, 608, 512, 96],
  drone: [768, 576, 256, 128],
  numeros: [0, 704, 512, 128],
  feu: [512, 704, 512, 128],
  puits: [0, 832, 512, 96],
  galerie: [512, 832, 256, 96],
  bains: [768, 832, 256, 96],
  lampisterie: [0, 928, 512, 96],
  bureaux: [512, 928, 256, 96],
  forge: [768, 928, 256, 96],
};
const POLICE = '"Arial Black", "Helvetica Neue", Impact, sans-serif';
const FEUTRE = '"Marker Felt", "Chalkboard SE", "Comic Sans MS", cursive';
const SERIF = '"Georgia", serif';

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

/** La peinture s'en va : trous dans la couche. */
function eroder(g, a, [x, y, w, h], n, rMin, rMax, force = 1, basPlus = 0) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < n; i++) {
    const px = x + a() * w;
    const py = y + Math.pow(a(), 1 - basPlus * 0.6) * h;
    const r = rMin + a() * (rMax - rMin);
    const d = g.createRadialGradient(px, py, 0, px, py, r);
    d.addColorStop(0, `rgba(0,0,0,${force})`);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(px - r, py - r, r * 2, r * 2);
  }
  g.restore();
}

/** La couleur passe au soleil : voile clair, coulures. */
function delaver(g, a, [x, y, w, h], force = 0.3) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.fillStyle = `rgba(236,230,214,${force})`;
  g.fillRect(x, y, w, h);
  g.translate(x, y);
  taches(g, a, 8, `rgba(236,230,214,${force})`, 10, 50, w, h);
  coulures(g, a, 12, w, h, h * 0.2, h * 0.8, "rgba(90,70,50,0.25)");
  g.restore();
}

/** Une lampe de mineur (lampe de sûreté) vue de face, à l'échelle s (hauteur). */
function dessinerLampe(g, cx, by, s, allumee = false) {
  const w = s * 0.32;
  g.fillStyle = "#b08a45"; // pot en laiton
  g.fillRect(cx - w / 2, by - s * 0.32, w, s * 0.32);
  g.fillStyle = "rgba(0,0,0,0.25)";
  g.fillRect(cx - w / 2, by - s * 0.32, w * 0.25, s * 0.32);
  g.fillStyle = allumee ? "#ffd27a" : "#9fb0ae"; // verre
  g.fillRect(cx - w * 0.38, by - s * 0.55, w * 0.76, s * 0.23);
  g.strokeStyle = "#5a5246";
  g.lineWidth = 1;
  for (const dx of [-0.3, 0, 0.3]) {
    g.beginPath();
    g.moveTo(cx + dx * w, by - s * 0.55);
    g.lineTo(cx + dx * w, by - s * 0.32);
    g.stroke();
  }
  g.fillStyle = "#8c8f8a"; // tamis et bonnet
  g.fillRect(cx - w * 0.36, by - s * 0.8, w * 0.72, s * 0.25);
  g.fillStyle = "#6f726e";
  g.fillRect(cx - w * 0.42, by - s * 0.84, w * 0.84, s * 0.05);
  g.strokeStyle = "#4a4a46";
  g.lineWidth = 1.5;
  g.beginPath(); // crochet
  g.arc(cx, by - s * 0.9, s * 0.07, PI * 0.1, PI * 1.9);
  g.stroke();
}

function texAtlas() {
  return dessiner(
    "mine-atlas",
    1024,
    1024,
    (g) => {
      const a = aleatoire(707);
      g.clearRect(0, 0, 1024, 1024);

      // --- Le grand panneau « Charbon 100 % vert » ---
      {
        const r = ATLAS.charbonVert;
        const [x0, y0, w, h] = r;
        const d = g.createLinearGradient(0, y0, 0, y0 + h);
        d.addColorStop(0, "#9fd0b4");
        d.addColorStop(1, "#e6efc8");
        g.fillStyle = d;
        g.fillRect(x0, y0, w, h);
        // Les collines vertes et un soleil
        g.fillStyle = "#e9c75a";
        g.beginPath();
        g.arc(x0 + 900, y0 + 70, 46, 0, TAU);
        g.fill();
        g.fillStyle = "#6fae6a";
        g.beginPath();
        g.moveTo(x0, y0 + 250);
        g.quadraticCurveTo(x0 + 250, y0 + 170, x0 + 520, y0 + 240);
        g.quadraticCurveTo(x0 + 780, y0 + 300, x0 + w, y0 + 210);
        g.lineTo(x0 + w, y0 + h);
        g.lineTo(x0, y0 + h);
        g.fill();
        // La mascotte : une gaillette souriante, une pousse sur la tête, les mains en cœur
        const cx = x0 + 160;
        const cy = y0 + 175;
        g.fillStyle = "#2a2826";
        g.beginPath();
        g.moveTo(cx - 80, cy + 20);
        g.lineTo(cx - 60, cy - 60);
        g.lineTo(cx + 10, cy - 85);
        g.lineTo(cx + 78, cy - 40);
        g.lineTo(cx + 85, cy + 45);
        g.lineTo(cx + 20, cy + 90);
        g.lineTo(cx - 55, cy + 75);
        g.closePath();
        g.fill();
        g.fillStyle = "rgba(255,255,255,0.12)";
        g.beginPath();
        g.moveTo(cx - 60, cy - 60);
        g.lineTo(cx + 10, cy - 85);
        g.lineTo(cx - 10, cy - 20);
        g.closePath();
        g.fill();
        g.strokeStyle = "#3f7f3a";
        g.lineWidth = 6;
        g.beginPath();
        g.moveTo(cx + 5, cy - 82);
        g.quadraticCurveTo(cx, cy - 115, cx + 12, cy - 130);
        g.stroke();
        g.fillStyle = "#4f9a46";
        g.beginPath();
        g.ellipse(cx + 35, cy - 128, 28, 12, -0.5, 0, TAU);
        g.fill();
        g.beginPath();
        g.ellipse(cx - 14, cy - 122, 22, 10, 0.6, 0, TAU);
        g.fill();
        for (const sx of [-1, 1]) {
          g.fillStyle = "#f6f0e0";
          g.beginPath();
          g.ellipse(cx + sx * 28, cy - 18, 15, 19, 0, 0, TAU);
          g.fill();
          g.fillStyle = "#1a1a1a";
          g.beginPath();
          g.arc(cx + sx * 28 + 3, cy - 14, 7, 0, TAU);
          g.fill();
          g.fillStyle = "rgba(230,120,120,0.7)";
          g.beginPath();
          g.ellipse(cx + sx * 50, cy + 14, 11, 6, 0, 0, TAU);
          g.fill();
        }
        g.strokeStyle = "#f6f0e0";
        g.lineWidth = 6;
        g.beginPath();
        g.arc(cx, cy + 10, 26, PI * 0.15, PI * 0.85);
        g.stroke();
        g.fillStyle = "#c8362b"; // le cœur
        g.beginPath();
        g.moveTo(cx + 115, cy + 40);
        g.bezierCurveTo(cx + 80, cy + 10, cx + 95, cy - 25, cx + 115, cy - 5);
        g.bezierCurveTo(cx + 135, cy - 25, cx + 150, cy + 10, cx + 115, cy + 40);
        g.fill();
        // Les textes
        texte(g, "CHARBON 100 % VERT", x0 + 610, y0 + 82, 640, 74, POLICE, "#1f4a2c");
        texte(g, "Extrait avec bienveillance.", x0 + 610, y0 + 150, 600, 44, SERIF, "#2b3a2a", "italic 700");
        g.fillStyle = "#c8362b";
        g.fillRect(x0, y0 + h - 56, w, 56);
        texte(g, "HOUILLÈRES DE L'ABONDANCE · PUITS SAINTE-CLÉMENCE · ZÉRO ÉMISSION DE MAUVAISE HUMEUR", x0 + w / 2, y0 + h - 28, w - 40, 24, POLICE, "#e9dfc6");
        delaver(g, a, r, 0.24);
        eroder(g, a, r, 45, 5, 22, 1, 0.8);
        eroder(g, a, r, 120, 2, 6, 1);
        g.save();
        g.translate(x0 + 640, y0 + 225);
        g.rotate(-0.08);
        g.shadowColor = "rgba(0,0,0,0.5)";
        g.shadowBlur = 3;
        texte(g, "VERT DE QUOI ?", 0, 0, 380, 50, FEUTRE, "rgba(20,20,20,0.9)", "700");
        g.restore();
      }

      // --- Le distributeur « Air pur premium » ---
      {
        const r = ATLAS.airPur;
        const [x0, y0, w, h] = r;
        const d = g.createLinearGradient(x0, y0, x0 + w, y0 + h);
        d.addColorStop(0, "#cfe8ef");
        d.addColorStop(1, "#8fc3cf");
        g.fillStyle = d;
        g.fillRect(x0, y0, w, h);
        g.fillStyle = "#2f6f73";
        g.fillRect(x0, y0, w, 74);
        texte(g, "AIR PUR", x0 + w / 2, y0 + 30, w - 30, 40, POLICE, "#e9dfc6");
        texte(g, "PREMIUM", x0 + w / 2, y0 + 60, w - 60, 22, POLICE, "#c79a3b");
        // La vitrine : les bouteilles
        g.fillStyle = "#1e3236";
        g.fillRect(x0 + 16, y0 + 86, 160, 210);
        const saveurs = [["#9fd0b4", "Alpage"], ["#c9b7e0", "Lavande"], ["#a8d4e8", "Brise"], ["#f0c9a0", "Matin"], ["#b8d98a", "Forêt"], ["#f2e6a0", "Foin"]];
        for (let j = 0; j < 3; j++)
          for (let i = 0; i < 3; i++) {
            const bx = x0 + 32 + i * 52;
            const byy = y0 + 96 + j * 68;
            if (a() < 0.35) continue; // case vide
            const [coul, nom] = saveurs[(i + j * 3) % saveurs.length];
            g.fillStyle = coul;
            rectArrondi(g, bx, byy + 14, 30, 44, 8);
            g.fill();
            g.fillStyle = "#e9dfc6";
            g.fillRect(bx + 10, byy + 4, 10, 12);
            g.fillStyle = "#2a2a2a";
            g.font = "700 9px sans-serif";
            g.textAlign = "center";
            g.fillText(nom, bx + 15, byy + 40);
          }
        // Une fêlure en étoile sur la vitrine
        g.strokeStyle = "rgba(255,255,255,0.75)";
        g.lineWidth = 1.5;
        for (let k = 0; k < 7; k++) {
          const an = (k / 7) * TAU + a();
          g.beginPath();
          g.moveTo(x0 + 110, y0 + 180);
          g.lineTo(x0 + 110 + Math.cos(an) * (30 + a() * 50), y0 + 180 + Math.sin(an) * (30 + a() * 50));
          g.stroke();
        }
        // Le petit écran, le clavier, la fente
        g.fillStyle = "#123";
        g.fillRect(x0 + 188, y0 + 90, 54, 40);
        texte(g, "9,99 ₩", x0 + 215, y0 + 104, 50, 14, POLICE, "#7fe0e8");
        texte(g, "/bouffée", x0 + 215, y0 + 120, 50, 10, SERIF, "#7fe0e8", "400");
        for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) {
          g.fillStyle = "#d9d2c0";
          g.fillRect(x0 + 190 + i * 17, y0 + 142 + j * 17, 13, 13);
        }
        g.fillStyle = "#333";
        g.fillRect(x0 + 200, y0 + 222, 30, 6);
        texte(g, "Respirez mieux", x0 + w / 2, y0 + 318, w - 30, 22, SERIF, "#1f3f44", "italic 700");
        texte(g, "que vos voisins.", x0 + w / 2, y0 + 342, w - 30, 22, SERIF, "#1f3f44", "italic 700");
        g.fillStyle = "#1e3236";
        g.fillRect(x0 + 40, y0 + 358, w - 80, 18);
        delaver(g, a, r, 0.18);
        eroder(g, a, r, 30, 3, 10, 0.6);
      }

      // --- Les lampes de la lampisterie (fond des râteliers) ---
      {
        const r = ATLAS.lampes;
        const [x0, y0, w, h] = r;
        g.fillStyle = "#7a6448";
        g.fillRect(x0, y0, w, h);
        for (let j = 0; j < 3; j++) {
          const by = y0 + 60 + j * 64;
          g.fillStyle = "#2e2620";
          g.fillRect(x0, by - 62, w, 4); // la tringle
          for (let i = 0; i < 22; i++) {
            const cx = x0 + 12 + i * 23;
            if (a() < 0.18) {
              g.strokeStyle = "#2a2a28";
              g.lineWidth = 1.5;
              g.beginPath();
              g.arc(cx, by - 52, 4, PI * 0.1, PI * 1.9);
              g.stroke();
              continue;
            }
            dessinerLampe(g, cx, by - 2, 54);
            g.fillStyle = "#c7a24e"; // le numéro
            g.beginPath();
            g.arc(cx + 8, by - 58, 4, 0, TAU);
            g.fill();
          }
        }
        delaver(g, a, r, 0.12);
      }

      // --- Le plan des galeries ---
      {
        const r = ATLAS.plans;
        const [x0, y0, w, h] = r;
        g.fillStyle = "#2f5a86";
        g.fillRect(x0, y0, w, h);
        g.strokeStyle = "rgba(220,235,255,0.18)";
        g.lineWidth = 1;
        for (let i = 0; i <= w; i += 16) {
          g.beginPath();
          g.moveTo(x0 + i, y0);
          g.lineTo(x0 + i, y0 + h);
          g.stroke();
          g.beginPath();
          g.moveTo(x0, y0 + i);
          g.lineTo(x0 + w, y0 + i);
          g.stroke();
        }
        g.strokeStyle = "#e8f0ff";
        g.lineWidth = 3;
        const pts = [[128, 40], [128, 120], [60, 150], [30, 210], [128, 120], [200, 140], [235, 200], [200, 140], [180, 90], [230, 60]];
        g.beginPath();
        g.moveTo(x0 + pts[0][0], y0 + pts[0][1]);
        for (const [px, py] of pts.slice(1)) g.lineTo(x0 + px, y0 + py);
        g.stroke();
        g.lineWidth = 1.5;
        for (let i = 0; i < 9; i++) {
          const px = x0 + 40 + a() * 180;
          const py = y0 + 60 + a() * 160;
          g.beginPath();
          g.moveTo(px, py);
          g.lineTo(px + (a() - 0.5) * 60, py + (a() - 0.5) * 40);
          g.stroke();
        }
        g.fillStyle = "#e8f0ff";
        g.beginPath();
        g.arc(x0 + 128, y0 + 40, 7, 0, TAU);
        g.fill();
        texte(g, "PUITS STE-CLÉMENCE", x0 + 128, y0 + 18, 200, 14, POLICE, "#e8f0ff");
        texte(g, "étage −420", x0 + 60, y0 + 135, 90, 12, SERIF, "#e8f0ff", "italic 400");
        texte(g, "étage −580", x0 + 205, y0 + 225, 90, 12, SERIF, "#e8f0ff", "italic 400");
        g.strokeStyle = "#e0584a";
        g.lineWidth = 4;
        g.beginPath();
        g.moveTo(x0 + 220, y0 + 185);
        g.lineTo(x0 + 248, y0 + 213);
        g.moveTo(x0 + 248, y0 + 185);
        g.lineTo(x0 + 220, y0 + 213);
        g.stroke();
        texte(g, "GRISOU", x0 + 222, y0 + 240, 70, 12, POLICE, "#f0a090");
        delaver(g, a, r, 0.12);
      }

      // --- Le tableau des jetons de la lampisterie ---
      {
        const r = ATLAS.jetons;
        const [x0, y0, w, h] = r;
        g.fillStyle = "#5e4a36";
        g.fillRect(x0, y0, w, h);
        for (let j = 0; j < 3; j++)
          for (let i = 0; i < 24; i++) {
            const cx = x0 + 12 + i * 20.8;
            const cy = y0 + 16 + j * 31;
            g.fillStyle = "#2a2a28";
            g.fillRect(cx - 1, cy - 9, 2, 6);
            if (a() < 0.22) continue; // jeton absent : le mineur n'est jamais remonté le rendre
            g.fillStyle = "#c7a24e";
            g.beginPath();
            g.arc(cx, cy + 4, 8, 0, TAU);
            g.fill();
            g.fillStyle = "#5a4520";
            g.font = "700 7px sans-serif";
            g.textAlign = "center";
            g.fillText(String(100 + j * 24 + i), cx, cy + 7);
          }
        delaver(g, a, r, 0.12);
      }

      // --- « Zone surveillée par drone » ---
      {
        const r = ATLAS.surveille;
        const [x0, y0, w, h] = r;
        g.fillStyle = "#e9dfc6";
        g.fillRect(x0, y0, w, h);
        g.fillStyle = "#c8362b";
        g.fillRect(x0, y0, 96, h);
        g.strokeStyle = "#e9dfc6";
        g.lineWidth = 5;
        g.beginPath();
        g.ellipse(x0 + 48, y0 + 48, 30, 18, 0, 0, TAU);
        g.stroke();
        g.fillStyle = "#e9dfc6";
        g.beginPath();
        g.arc(x0 + 48, y0 + 48, 9, 0, TAU);
        g.fill();
        texte(g, "ZONE SURVEILLÉE PAR DRONE", x0 + 304, y0 + 34, 390, 30, POLICE, "#3b2a20");
        texte(g, "Votre sécurité est notre algorithme.", x0 + 304, y0 + 70, 390, 24, SERIF, "#3b2a20", "italic 700");
        delaver(g, a, r, 0.3);
        eroder(g, a, r, 30, 3, 12, 0.7);
      }

      // --- La livrée du drone-inspecteur ---
      {
        const r = ATLAS.drone;
        const [x0, y0, w, h] = r;
        g.fillStyle = "#e6e4dc";
        g.fillRect(x0, y0, w, h);
        g.fillStyle = "#c8362b";
        g.fillRect(x0, y0 + 50, w, 26);
        texte(g, "INSPECTEUR SÉCURITÉ", x0 + w / 2, y0 + 63, w - 20, 18, POLICE, "#e9dfc6");
        texte(g, "Houillères de l'Abondance", x0 + w / 2, y0 + 100, w - 40, 14, SERIF, "#3b3a36", "italic 700");
        g.fillStyle = "#1f2526";
        g.beginPath();
        g.arc(x0 + w / 2, y0 + 24, 14, 0, TAU);
        g.fill();
        g.fillStyle = "#c8362b";
        g.beginPath();
        g.arc(x0 + w / 2, y0 + 24, 5, 0, TAU);
        g.fill();
        eroder(g, a, r, 40, 3, 12, 0.8);
      }

      // --- Les plaques émaillées des taquets ---
      {
        const r = ATLAS.numeros;
        const [x0, y0, w, h] = r;
        g.fillStyle = "#5a4430";
        g.fillRect(x0, y0, w, h);
        for (let i = 0; i < 16; i++) {
          const px = x0 + 4 + i * 32;
          g.fillStyle = "#2f4f7a";
          rectArrondi(g, px, y0 + 20, 26, 34, 4);
          g.fill();
          g.strokeStyle = "#e9e4d6";
          g.lineWidth = 2;
          rectArrondi(g, px + 2, y0 + 22, 22, 30, 3);
          g.stroke();
          g.fillStyle = "#e9e4d6";
          g.font = "900 11px sans-serif";
          g.textAlign = "center";
          g.fillText(String(301 + i), px + 13, y0 + 41);
          // Le taquet et son cadenas
          g.fillStyle = "#3a3a38";
          g.fillRect(px + 6, y0 + 66, 14, 8);
          g.fillStyle = a() < 0.6 ? "#b08a45" : "#555";
          g.fillRect(px + 8, y0 + 80, 10, 12);
          g.strokeStyle = "#555";
          g.beginPath();
          g.arc(px + 13, y0 + 80, 4, PI, 0);
          g.stroke();
        }
        delaver(g, a, r, 0.12);
      }

      // --- Graffiti des Charbonniers ---
      {
        const [x0, y0, w, h] = ATLAS.feu;
        g.save();
        g.translate(x0 + w / 2, y0 + h / 2);
        g.rotate(-0.03);
        g.fillStyle = "rgba(200,95,40,0.9)";
        g.beginPath(); // une flamme
        g.moveTo(-220, 30);
        g.quadraticCurveTo(-250, -10, -225, -50);
        g.quadraticCurveTo(-220, -20, -205, -25);
        g.quadraticCurveTo(-210, -50, -190, -60);
        g.quadraticCurveTo(-180, 0, -195, 30);
        g.closePath();
        g.fill();
        g.shadowColor = "rgba(0,0,0,0.4)";
        g.shadowBlur = 3;
        texte(g, "LE FEU NE TRAHIT PAS", 25, 4, w - 110, 52, FEUTRE, "rgba(22,20,18,0.92)", "700");
        g.restore();
      }

      // --- Lettres peintes sur la brique : le nom du puits ---
      {
        const r = ATLAS.puits;
        const [x0, y0, w, h] = r;
        texte(g, "PUITS SAINTE-CLÉMENCE · 1907", x0 + w / 2, y0 + h / 2 + 2, w - 16, 60, POLICE, "#ece4cf");
        eroder(g, a, r, 50, 3, 12, 0.9);
      }

      // --- La planche « Défense d'entrer » ---
      {
        const r = ATLAS.galerie;
        const [x0, y0, w, h] = r;
        g.fillStyle = "#8a7356";
        g.fillRect(x0, y0 + 6, w, h - 12);
        g.strokeStyle = "rgba(40,30,20,0.4)";
        for (let i = 0; i < 6; i++) {
          g.beginPath();
          g.moveTo(x0, y0 + 14 + i * 13);
          g.lineTo(x0 + w, y0 + 12 + i * 13 + a() * 4);
          g.stroke();
        }
        texte(g, "DÉFENSE D'ENTRER", x0 + w / 2, y0 + 40, w - 20, 34, POLICE, "#a8362b");
        texte(g, "galerie n° 2 — éboulée", x0 + w / 2, y0 + 72, w - 40, 16, FEUTRE, "#2a2420", "700");
        eroder(g, a, r, 14, 2, 8, 0.6);
      }

      // --- Les enseignes des bâtiments ---
      const enseigne = (rr, t, fond, encre) => {
        const [x0, y0, w, h] = rr;
        g.fillStyle = fond;
        g.fillRect(x0 + 4, y0 + 10, w - 8, h - 20);
        g.strokeStyle = encre;
        g.lineWidth = 3;
        g.strokeRect(x0 + 10, y0 + 16, w - 20, h - 32);
        texte(g, t, x0 + w / 2, y0 + h / 2 + 2, w - 40, 40, POLICE, encre);
        delaver(g, a, rr, 0.25);
        eroder(g, a, rr, 20, 3, 10, 0.8);
      };
      enseigne(ATLAS.bains, "BAINS-DOUCHES", "#2f5f62", "#e9dfc6");
      enseigne(ATLAS.lampisterie, "LAMPISTERIE", "#2f5f62", "#e9dfc6");
      enseigne(ATLAS.bureaux, "BUREAUX · PAIE", "#2f5f62", "#e9dfc6");
      enseigne(ATLAS.forge, "FORGE", "#6a3b2c", "#e9dfc6");
    },
    false,
  );
}

// ---------- Petits outils de géométrie ----------

/** Un quadrilatère (4 points [x, y, z]). */
function quad(c, mat, couleur, p, uv = [[0, 0], [1, 0], [1, 1], [0, 1]], recto = true, verso = false) {
  const pos = [];
  const u = [];
  if (recto)
    for (const k of [0, 1, 2, 0, 2, 3]) {
      pos.push(...p[k]);
      u.push(...uv[k]);
    }
  if (verso)
    for (const k of [0, 2, 1, 0, 3, 2]) {
      pos.push(...p[k]);
      u.push(...uv[k]);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(u, 2));
  g.computeVertexNormals();
  c.poser(g, mat, couleur, {}, { crasse: false, nuance: 0.03 });
  g.dispose();
}

/** Un panneau peint de l'atlas, posé à plat (le plan regarde +z, tourné de `ry`). */
function panneau(c, region, x, y, z, l, h, ry = 0, rx = 0, teinte = 0xffffff) {
  const [px, py, pw, ph] = ATLAS[region];
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / 1024, 1 - (py + (1 - uv.getY(i)) * ph) / 1024);
  c.poser(g, M.atlas(), teinte, { x, y, z, ry, rx }, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Un vitrage à petits bois (une seule face, visible des deux côtés), qui regarde +z tourné de `ry`. */
function vitre(c, usure, x, y, z, l, h, ry = 0) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  const du = Math.floor(c.hasard() * 8) / 8;
  const dv = Math.floor(c.hasard() * 7) / 7;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, du + (uv.getX(i) * l) / 4, dv + (uv.getY(i) * h) / 4);
  c.poser(g, M.vitrage(usure), 0xffffff, { x, y, z, ry }, { crasse: false, nuance: 0.05 });
  g.dispose();
}

/** Un cylindre couché le long de x. */
function cylX(c, x1, x2, y, z, r, couleur, mat, cotes = 12) {
  const g = new THREE.CylinderGeometry(r, r, Math.abs(x2 - x1), cotes);
  c.poser(g, mat, couleur, { x: (x1 + x2) / 2, y, z, rz: PI / 2 });
  g.dispose();
}

/** Un cylindre couché le long de z. */
function cylZ(c, z1, z2, x, y, r, couleur, mat, cotes = 12) {
  const g = new THREE.CylinderGeometry(r, r, Math.abs(z2 - z1), cotes);
  c.poser(g, mat, couleur, { x, y, z: (z1 + z2) / 2, rx: PI / 2 });
  g.dispose();
}

/** Un cylindre debout. */
function cylY(c, x, z, y1, y2, r1, r2, couleur, mat, cotes = 8, ouvert = false) {
  const g = new THREE.CylinderGeometry(r2, r1, y2 - y1, cotes, 1, ouvert);
  c.poser(g, mat, couleur, { x, y: (y1 + y2) / 2, z });
  g.dispose();
}

/** Un tuyau (ou un câble) qui suit une ligne brisée, avec des coudes. */
function tuyau(c, pts, r, couleur, mat = M.tole(), cotes = 6, coudes = true) {
  for (let i = 0; i < pts.length - 1; i++) {
    c.tube(pts[i], pts[i + 1], r, couleur, mat, cotes);
    if (coudes && i > 0) {
      const g = new THREE.IcosahedronGeometry(r * 1.05, 0);
      c.poser(g, mat, couleur, { x: pts[i][0], y: pts[i][1], z: pts[i][2] });
      g.dispose();
    }
  }
}

/** Les quatre côtés d'un rectangle comme obstacles. */
function obstacleRect(b, x1, z1, x2, z2, nature) {
  b.obstacle(x1, z1, x2, z1, nature);
  b.obstacle(x2, z1, x2, z2, nature);
  b.obstacle(x2, z2, x1, z2, nature);
  b.obstacle(x1, z2, x1, z1, nature);
}

/** Le repère d'un mur de a à b (+x le long du mur, +z dehors si l'on tourne dans le bon sens). */
function repereMur(a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  return { x: a[0], z: a[1], ry: -Math.atan2(dz, dx), L: Math.hypot(dx, dz) };
}

/**
 * Une baie cintrée dans le repère d'un mur (+x le long du mur, +z dehors) : vitrage à petits bois, demi-lune vitrée,
 * cintre de briques à clé de pierre, écoinçons, appui de pierre. `yBas` : l'appui ; `yNais` : la naissance de l'arc.
 */
function baie(k, u, yBas, yNais, l, ep, usure, { verre = true, appui = true, coul = C.brique, coulClaveau = C.briqueSombre, mat = null } = {}) {
  const matB = mat ?? M.brique();
  const r = l / 2;
  if (verre) {
    if (yNais - yBas > 0.1) vitre(k, usure, u, (yBas + yNais) / 2, 0, l, yNais - yBas);
    const g = new THREE.CircleGeometry(r, 8, 0, PI);
    const uv = g.attributes.uv;
    const pos = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + r) / 4, pos.getY(i) / 4 + 0.25);
    k.poser(g, M.vitrage(usure), 0xffffff, { x: u, y: yNais, z: 0 }, { crasse: false, nuance: 0.05 });
    g.dispose();
  }
  // Les écoinçons : la brique qui remplit les coins entre l'ouverture rectangulaire et l'arc
  for (const s of [-1, 1])
    for (let j = 1; j < 4; j++) {
      const yt = ((j + 1) * r) / 4;
      const xc = Math.sqrt(Math.max(0, r * r - yt * yt));
      if (r - xc < 0.03) continue;
      const xa = s > 0 ? u + xc : u - r;
      const xb = s > 0 ? u + r : u - xc;
      k.pave(xa, yNais + (j * r) / 4, -ep / 2, xb, yNais + yt, ep / 2, coul, matB, { nuance: 0.02 });
    }
  // Le cintre : neuf claveaux, la clé en pierre
  const n = 9;
  const rr = r + 0.17;
  for (let i = 0; i < n; i++) {
    const th = ((i + 0.5) / n) * PI;
    const cle = i === (n - 1) / 2;
    k.boite((PI * rr) / n + 0.03, cle ? 0.5 : 0.34, ep + 0.08, cle ? C.pierre : coulClaveau, { x: u + rr * Math.cos(th), y: yNais + rr * Math.sin(th) + (cle ? 0.06 : 0), z: 0, rz: th + PI / 2 }, cle ? (mat ?? M.beton()) : matB, { nuance: 0.05, crasse: false });
  }
  if (appui) k.pave(u - r - 0.12, yBas - 0.14, -ep / 2 - 0.04, u + r + 0.12, yBas, ep / 2 + 0.14, C.pierre, M.beton(), { crasse: false });
}

/** Un pignon triangulaire extrudé, plein, à x donné (le faîtage court selon x), de z0 à z1, de y0 à yf. */
function pignon(k, x, z0, z1, y0, yf, ep, couleur, mat) {
  const demi = (z1 - z0) / 2;
  const forme = new THREE.Shape([new THREE.Vector2(-demi - 0.2, 0), new THREE.Vector2(demi + 0.2, 0), new THREE.Vector2(0, yf - y0)]);
  const g = new THREE.ExtrudeGeometry(forme, { depth: ep, bevelEnabled: false });
  k.poser(g, mat, couleur, { x: x - ep / 2, y: y0, z: (z0 + z1) / 2, ry: PI / 2 });
  g.dispose();
}

/** Une échelle à crinoline le long d'un chemin de points [x, y, z] ; `d` = [dx, dz] : la direction qui s'écarte du mur. */
function echelle(c, chemin, d, couleur, mat, crinolineDepuis = 2.6, pas = 0.9, pasArceau = 3) {
  const t = [-d[1], d[0]];
  const ecart = 0.2;
  const P = (p, s, e = 0) => [p[0] + t[0] * 0.22 * s + d[0] * (ecart + e), p[1], p[2] + t[1] * 0.22 * s + d[1] * (ecart + e)];
  for (let i = 0; i < chemin.length - 1; i++) {
    const a = chemin[i];
    const b = chemin[i + 1];
    for (const s of [-1, 1]) c.poutre(P(a, s), P(b, s), 0.06, couleur, mat);
    const n = Math.max(1, Math.round((b[1] - a[1]) / pas));
    for (let k = 0; k < n; k++) {
      const f = k / n;
      const p = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
      c.poutre(P(p, -1), P(p, 1), 0.035, couleur, mat);
    }
    const m = Math.max(1, Math.round((b[1] - a[1]) / pasArceau));
    for (let k = 0; k < m; k++) {
      const f = k / m;
      const p = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
      if (p[1] < crinolineDepuis) continue;
      const centre = [p[0] + d[0] * (ecart + 0.36), p[1], p[2] + d[1] * (ecart + 0.36)];
      let prec = null;
      for (let q = 0; q <= 4; q++) {
        const an = -PI / 2 + (q / 4) * PI;
        const v = [Math.cos(an), Math.sin(an)];
        const pt = [centre[0] + (d[0] * v[0] + t[0] * v[1]) * 0.38, p[1], centre[2] + (d[1] * v[0] + t[1] * v[1]) * 0.38];
        if (prec) c.poutre(prec, pt, 0.04, couleur, mat);
        prec = pt;
      }
    }
    if (b[1] > crinolineDepuis)
      for (const s of [-1, 0, 1]) {
        const off = (p) => [p[0] + d[0] * (ecart + 0.36 + (s === 0 ? 0.38 : 0)) + t[0] * (s * 0.38), p[1], p[2] + d[1] * (ecart + 0.36 + (s === 0 ? 0.38 : 0)) + t[1] * (s * 0.38)];
        const f0 = a[1] < crinolineDepuis ? (crinolineDepuis - a[1]) / (b[1] - a[1]) : 0;
        const a2 = [a[0] + (b[0] - a[0]) * f0, a[1] + (b[1] - a[1]) * f0, a[2] + (b[2] - a[2]) * f0];
        c.poutre(off(a2), off(b), 0.035, couleur, mat);
      }
  }
}

/** Un brasero de Charbonniers : demi-fût percé, braises, bûches, couchage, caisse. */
function brasero(ctx, x, z) {
  const c = ctx.c;
  cylY(c, x, z, 0, 0.7, 0.32, 0.34, C.rouilleSombre, M.tole(), 8, true);
  cylY(c, x, z, 0.12, 0.16, 0.3, 0.3, C.suie, M.mat(), 8);
  for (let i = 0; i < 7; i++) c.boite(0.12, 0.08, 0.1, i % 2 ? 0xff7a2a : 0xd2451c, { x: x + c.entre(-0.18, 0.18), y: 0.62, z: z + c.entre(-0.18, 0.18), ry: c.hasard() * 3 }, M.mat(), { crasse: false });
  for (let i = 0; i < 3; i++) c.boite(0.7, 0.12, 0.12, PALETTE.boisSombre, { x: x + 0.7 + i * 0.05, y: 0.06 + i * 0.12, z: z + 0.3 - i * 0.2, ry: c.hasard() }, M.mat());
  c.boite(1.8, 0.01, 1.8, C.suie, { x, y: 0.05, z, ry: 0.4 }, M.mat(), { crasse: false });
  c.boite(0.7, 0.15, 1.9, 0x5a4a38, { x: x - 1.3, y: 0.12, z: z + 0.4, ry: 0.3 }, M.mat()); // couchage
  c.boite(0.5, 0.4, 0.4, PALETTE.bois, { x: x + 0.4, y: 0.25, z: z - 1.0, ry: 0.5 }, M.mat()); // caisse
  c.boite(0.45, 0.55, 0.35, 0x4a4038, { x: x - 0.9, y: 0.27, z: z - 0.8, ry: 0.2 }, M.mat()); // sac de charbon
  ctx.b.lumiere(x, 1.1, z, 0xff8a3d, 9, 13, "feu de Charbonniers (brasero)");
}

/** Un baril de 200 L, debout ou couché. */
function baril(c, x, z, couleur, couche = false, ry = 0) {
  const g = new THREE.CylinderGeometry(0.29, 0.29, 0.88, 8);
  if (couche) c.poser(g, M.tole(), couleur, { x, y: 0.3, z, rz: PI / 2, ry });
  else c.poser(g, M.tole(), couleur, { x, y: 0.44, z });
  g.dispose();
}

/** Un rocher à facettes. */
function rocher(c, x, y, z, ex, ey, ez, couleur, ry = 0) {
  const g = new THREE.DodecahedronGeometry(1, 0);
  c.poser(g, M.mat(), couleur, { x, y, z, ry, e: [ex, ey, ez] }, { nuance: 0.06, crasse: false });
  g.dispose();
}

/** Un sapin : un fût, trois étages de cônes à facettes. */
function sapin(c, x, z, h, y = 0) {
  c.tube([x, y - 0.3, z], [x, y + h * 0.3, z], h * 0.03, 0x4a3a2c, M.mat(), 5);
  const tons = [0x2f5a3c, 0x3a6a45, 0x2a4f36];
  for (let i = 0; i < 3; i++) {
    const r = h * (0.3 - i * 0.075);
    const hh = h * (0.44 - i * 0.07);
    const g = new THREE.ConeGeometry(r, hh, 6);
    c.poser(g, M.mat(), tons[i], { x, y: y + h * (0.18 + i * 0.24) + hh / 2, z, ry: c.hasard() }, { nuance: 0.06, crasse: false });
    g.dispose();
  }
}

/** Une molette : jante à gorge, huit rayons, moyeu. Dans le plan x-y du repère donné. */
function molette(c, pose, couleur = C.chev) {
  c.repere(pose, () => {
    const R = MOL.r;
    for (const dz of [-0.13, 0.13]) {
      const g = new THREE.TorusGeometry(R, 0.11, 4, 20);
      c.poser(g, M.tole(), couleur, { z: dz });
      g.dispose();
    }
    const g2 = new THREE.TorusGeometry(R - 0.12, 0.07, 3, 20);
    c.poser(g2, M.tole(), C.chevSombre, {});
    g2.dispose();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + 0.2;
      c.poutre([0, 0, 0], [Math.cos(a) * (R - 0.1), Math.sin(a) * (R - 0.1), 0], 0.11, couleur, M.tole());
    }
    cylZ(c, -0.32, 0.32, 0, 0, 0.32, C.chevSombre, M.tole(), 8);
  });
}

/**
 * Un wagonnet (berline) : caisse, châssis, quatre roues. `etat` : « debout » (sur les rails, dessus des rails à `yr`),
 * « cote » (couché sur le flanc), « renverse » (cul par-dessus tête).
 */
function wagonnet(c, x, z, ry, etat = "debout", charge = true, yr = 0.3) {
  const pose = etat === "cote" ? { x, y: 0.45, z, ry, rx: PI / 2 } : etat === "renverse" ? { x, y: 0.6, z, ry, rx: PI } : { x, y: yr + 0.52, z, ry };
  c.repere(pose, () => {
    c.pave(-0.7, -0.15, -0.45, 0.7, 0.6, 0.45, C.wagon, M.tole(), { crasse: false, nuance: 0.08 });
    c.pave(-0.74, 0.5, -0.49, 0.74, 0.6, 0.49, C.rouilleSombre, M.tole(), { crasse: false });
    c.pave(-0.62, 0.58, -0.37, 0.62, 0.61, 0.37, charge ? C.charbon : 0x3a2f28, M.mat(), { crasse: false });
    if (charge && etat === "debout") for (let i = 0; i < 4; i++) c.boite(c.entre(0.25, 0.45), 0.2, c.entre(0.25, 0.4), i % 2 ? C.charbon : 0x7a5a48, { x: c.entre(-0.4, 0.4), y: 0.66, z: c.entre(-0.2, 0.2), ry: c.hasard() * 3 }, M.mat(), { crasse: false });
    c.pave(-0.8, -0.27, -0.3, 0.8, -0.15, 0.3, 0x3a3532, M.tole(), { crasse: false });
    for (const xx of [-0.45, 0.45])
      for (const s of [-1, 1]) {
        const g = new THREE.CylinderGeometry(0.17, 0.17, 0.08, 8);
        c.poser(g, M.tole(), 0x3a3532, { x: xx, y: -0.35, z: s * 0.3, rx: PI / 2 }, { crasse: false });
        g.dispose();
      }
    for (const s of [-1, 1]) c.pave(s * 0.8, -0.24, -0.08, s * 0.95, -0.14, 0.08, 0x3a3532, M.tole(), { crasse: false }); // tampons
  });
}

/** Une voie étroite (écartement 0,6 m) de a à b ([x, z]) : traverses de bois, deux rails. */
function voie(ctx, a, b, { manque = 0 } = {}) {
  const { c } = ctx;
  const R = repereMur(a, b);
  c.repere({ x: R.x, z: R.z, ry: R.ry }, () => {
    for (let u = 0.35; u < R.L; u += 0.75) {
      if (c.hasard() < manque) continue;
      c.boite(0.16, 0.1, 1.1, c.hasard() < 0.3 ? C.boisGris : C.boisSombre, { x: u, y: 0.07, ry: c.entre(-0.06, 0.06) }, M.mat(), { nuance: 0.08, crasse: false });
    }
    for (const s of [-1, 1]) c.pave(0, 0.12, s * 0.3 - 0.035, R.L, 0.22, s * 0.3 + 0.035, C.rail, M.metal(), { crasse: false });
  });
}

// ---------- Le sol du carreau ----------

function sol(ctx, x1, z1, x2, z2) {
  const { c, u } = ctx;
  // Le fond : la terre noire du carreau (schiste, poussier), d'un seul tenant
  c.pave(x1, -0.03, z1, x2, 0.005, z2, 0x55534f, M.mat(), { nuance: 0, crasse: false });
  const pas = 6;
  const evite = [
    [MACH.x0, MACH.z0, MACH.x1, MACH.z1],
    [BAINS.x0, BAINS.z0, BAINS.x1, BAINS.z1],
    [FORGE.x0, FORGE.z0, FORGE.x1, FORGE.z1],
  ];
  const pts = [];
  const tons = [0x4c4844, 0x625a50, 0x6a6458, 0x57524a, 0x4a4540];
  for (let x = x1; x < x2 - 0.1; x += pas)
    for (let z = Math.max(z1, -25); z < z2 - 0.1; z += pas) {
      const xa = x;
      const xb = Math.min(x2, x + pas);
      const za = z;
      const zb = Math.min(z2, z + pas);
      if (evite.some(([a1, b1, a2, b2]) => xa >= a1 - 1 && xb <= a2 + 1 && za >= b1 - 1 && zb <= b2 + 1)) continue;
      const cx = (xa + xb) / 2;
      const cz = (za + zb) / 2;
      if (Math.hypot(cx - TERRIL.x, cz - TERRIL.z) < TERRIL.r - 2) continue;
      const r = c.hasard();
      if (r < 0.18 + 0.25 * u) {
        // L'herbe a repris : une plaque d'herbe rase, des touffes
        mousse(c, cx + c.entre(-1.5, 1.5), 0.0, cz + c.entre(-1.5, 1.5), c.entre(1.6, 2.6), 3, c.hasard() < 0.5 ? 0x6f7f48 : 0x7d8a52);
        pts.push([cx + c.entre(-2, 2), cz + c.entre(-2, 2)]);
      } else if (r < 0.55) {
        // Une dalle de béton ou de poussier tassé, un peu plus claire ou plus sombre
        c.pave(xa + 0.05, 0.005, za + 0.05, xb - 0.05, 0.025, zb - 0.05, tons[Math.floor(c.hasard() * tons.length)], M.mat(), { nuance: 0.05, crasse: false });
      }
      if (c.hasard() < 0.2 + 0.3 * u) pts.push([xa + c.entre(0, pas), za + c.entre(0, pas)]);
    }
  touffes(c, pts.filter((p) => !evite.some(([a1, b1, a2, b2]) => p[0] > a1 && p[0] < a2 && p[1] > b1 && p[1] < b2)));
  // Le chemin pavé du portail au chevalement
  if (x2 > 6) c.pave(Math.max(x1, 4), 0.025, 1.2, Math.min(x2, 36), 0.05, 4.2, 0x7d776c, M.mat(), { crasse: false, nuance: 0.03 });
}

// ---------- Le chevalement ----------

/** Les tangentes « par-dessus » entre la bobine et la molette (dans le plan x-y), pour le câble tendu. */
function tangentes() {
  const dx = MOL.x - BOB.x;
  const dy = MOL.y - BOB.y;
  const l = Math.hypot(dx, dy);
  const n = [dy / l, -dx / l]; // normale vers le haut et l'est
  if (n[1] < 0) {
    n[0] = -n[0];
    n[1] = -n[1];
  }
  return { bob: [BOB.x + BOB.r * n[0], BOB.y + BOB.r * n[1]], mol: [MOL.x + MOL.r * n[0], MOL.y + MOL.r * n[1]] };
}
/** La hauteur du câble tendu à l'abscisse x. */
function hauteurCable(x) {
  const t = tangentes();
  const f = (t.bob[0] - x) / (t.bob[0] - t.mol[0]);
  return t.bob[1] + f * (t.mol[1] - t.bob[1]);
}

function chevalement(ctx, niveau) {
  const { b, c, u } = ctx;
  const fin = niveau === "fin";
  const T = TOUR;
  const k = b.couche("chevalement : tour, molette, jambes de force", { x: 5.5, z: T.z, l: 18, p: 11 }, 3, 28.2);
  const tole = M.tole();
  const coin = (sx, sz, y) => {
    const d = T.bas + (T.haut - T.bas) * (y / T.h);
    return [T.x + sx * d, y, T.z + sz * d];
  };
  const coins = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  // Les quatre montants : le pied (3 m) reste, le reste s'efface
  for (const [sx, sz] of coins) {
    c.poutre(coin(sx, sz, 0), coin(sx, sz, 3), 0.44, C.chev, tole);
    k.poutre(coin(sx, sz, 3), coin(sx, sz, T.h), 0.44, C.chev, tole);
    c.pave(coin(sx, sz, 0)[0] - 0.6, 0, coin(sx, sz, 0)[2] - 0.6, coin(sx, sz, 0)[0] + 0.6, 0.35, coin(sx, sz, 0)[2] + 0.6, C.betonSombre, M.beton());
    obstacleRect(b, coin(sx, sz, 0)[0] - 0.6, coin(sx, sz, 0)[2] - 0.6, coin(sx, sz, 0)[0] + 0.6, coin(sx, sz, 0)[2] + 0.6, "pied du chevalement");
  }
  // Les étages de treillis : ceintures et croix de Saint-André sur les quatre faces
  const niv = [3, 5.6, 8.2, 10.8, 13.4, 16, 18.6, T.h];
  for (let i = 0; i < niv.length; i++) {
    const y = niv[i];
    for (let q = 0; q < 4; q++) {
      const [sx, sz] = coins[q];
      const [tx, tz] = coins[(q + 1) % 4];
      k.poutre(coin(sx, sz, y), coin(tx, tz, y), 0.26, C.chev, tole);
      if (i < niv.length - 1) {
        const y2 = niv[i + 1];
        k.poutre(coin(sx, sz, y), coin(tx, tz, y2), 0.12, C.chevSombre, tole);
        k.poutre(coin(tx, tz, y), coin(sx, sz, y2), 0.12, C.chevSombre, tole);
      }
    }
  }
  // Goussets du bas (le passage reste libre pour la voie et la recette)
  for (const [sx, sz] of coins) {
    k.poutre(coin(sx, sz, 3), [coin(sx, sz, 1.9)[0] - sx * 0.9, 3, coin(sx, sz, 1.9)[2]], 0.12, C.chevSombre, tole);
    k.poutre(coin(sx, sz, 3), [coin(sx, sz, 1.9)[0], 3, coin(sx, sz, 1.9)[2] - sz * 0.9], 0.12, C.chevSombre, tole);
  }
  // Les guidages de la cage (bois), du puits au plancher
  for (const z of [MOL.z1 - 0.62, MOL.z1 + 0.62]) {
    c.pave(PUITS.x - 0.08, 0, z - 0.08, PUITS.x + 0.08, 3, z + 0.08, C.boisSombre, M.mat());
    k.pave(PUITS.x - 0.08, 3, z - 0.08, PUITS.x + 0.08, T.h, z + 0.08, C.boisSombre, tole);
  }

  // --- Le plancher des molettes, le garde-corps, les paliers ---
  const yP = T.h;
  const d = T.haut;
  k.pave(T.x - d - 0.3, yP, T.z - d - 0.3, T.x + d + 0.3, yP + 0.12, T.z + d + 0.3, C.grille, tole);
  for (const s of [-1, 1]) k.pave(T.x - d - 0.3, yP + 0.12, T.z + s * (d + 0.15) - 0.1, T.x + d + 0.3, yP + 1.2, T.z + s * (d + 0.15) + 0.1, C.chev, tole, { crasse: false });
  for (const [sx, sz] of coins) k.poutre([T.x + sx * (d + 0.25), yP, T.z + sz * (d + 0.25)], [T.x + sx * (d + 0.25), yP + 1.2, T.z + sz * (d + 0.25)], 0.06, C.chev, tole);
  for (const s of [-1, 1]) k.poutre([T.x - s * 0 + (s < 0 ? -d - 0.25 : d + 0.25), yP + 1.15, T.z - d - 0.25], [T.x + (s < 0 ? -d - 0.25 : d + 0.25), yP + 1.15, T.z + d + 0.25], 0.06, C.chev, tole);
  for (const z of [MOL.z1, MOL.z2]) {
    // Les poutres-paliers et les chaises
    for (const dz of [-0.45, 0.45]) k.pave(T.x - d, yP + 0.12, z + dz - 0.15, T.x + d, yP + 0.7, z + dz + 0.15, C.chev, tole);
    for (const dz of [-0.45, 0.45]) k.pave(MOL.x - 0.35, yP + 0.7, z + dz - 0.18, MOL.x + 0.35, MOL.y - 0.2, z + dz + 0.18, C.chevSombre, tole);
  }
  // La molette qui reste
  molette(k, { x: MOL.x, y: MOL.y, z: MOL.z1 });
  // À la place de l'autre : l'axe nu et un rayon tordu
  cylZ(k, MOL.z2 - 0.6, MOL.z2 + 0.6, MOL.x, MOL.y, 0.16, C.chevSombre, tole, 6);
  k.poutre([MOL.x, MOL.y, MOL.z2], [MOL.x + 0.9, MOL.y - 1.4, MOL.z2 + 0.1], 0.1, C.rouille, tole);
  // Le portique de levage au-dessus des molettes
  for (const x of [T.x - d + 0.2, T.x + d - 0.2]) {
    for (const s of [-1, 1]) k.poutre([x, yP + 0.12, T.z + s * 1.4], [x, 27.6, T.z + s * 0.2], 0.2, C.chev, tole);
  }
  k.pave(T.x - d - 1.2, 27.5, T.z - 0.22, T.x + d + 0.6, 27.95, T.z + 0.22, C.chev, tole);
  k.poutre([T.x - d - 1.0, 27.5, T.z], [T.x - d - 1.0, 25.2, T.z], 0.04, C.cable, tole); // le palan
  k.boite(0.3, 0.3, 0.3, C.chevSombre, { x: T.x - d - 1.0, y: 25.0, z: T.z }, tole);

  // --- Les jambes de force, vers la salle des machines ---
  const piedJ = (s) => [12.5, 0, T.z + s * 4.6];
  const hautJ = (s) => coin(1, s, T.h);
  const surJ = (s, f) => {
    const a = piedJ(s);
    const bb = hautJ(s);
    return [a[0] + (bb[0] - a[0]) * f, a[1] + (bb[1] - a[1]) * f, a[2] + (bb[2] - a[2]) * f];
  };
  const f3 = 3 / T.h;
  for (const s of [-1, 1]) {
    c.poutre(piedJ(s), surJ(s, f3), 0.55, C.chev, tole);
    k.poutre(surJ(s, f3), hautJ(s), 0.55, C.chev, tole);
    c.pave(12.5 - 0.8, 0, T.z + s * 4.6 - 0.8, 12.5 + 0.8, 0.5, T.z + s * 4.6 + 0.8, C.betonSombre, M.beton());
    obstacleRect(b, 11.7, T.z + s * 4.6 - 0.8, 13.3, T.z + s * 4.6 + 0.8, "massif d'une jambe de force");
  }
  const fs = [0.22, 0.4, 0.58, 0.76, 0.92];
  for (let i = 0; i < fs.length; i++) {
    k.poutre(surJ(-1, fs[i]), surJ(1, fs[i]), 0.2, C.chev, tole);
    if (i < fs.length - 1) {
      k.poutre(surJ(-1, fs[i]), surJ(1, fs[i + 1]), 0.1, C.chevSombre, tole);
      k.poutre(surJ(1, fs[i]), surJ(-1, fs[i + 1]), 0.1, C.chevSombre, tole);
    }
  }
  for (const s of [-1, 1]) {
    const p = surJ(s, 0.55);
    k.poutre(p, coin(1, s, p[1]), 0.18, C.chev, tole);
  }

  // --- L'échelle à crinoline, face sud ---
  if (fin) {
    const ch = [];
    for (const y of [0, 3, 6, 9, 12, 15, 18, 21]) {
      const p = coin(0, 1, y);
      ch.push([T.x + 0.9, y, p[2]]);
    }
    echelle(c, ch.slice(0, 2), [0, 1], C.chevSombre, tole, 2.6);
    echelle(k, ch.slice(1), [0, 1], C.chevSombre, tole, 0);
  }

  // --- La recette : dalle, bouche du puits grillagée, la cage arrêtée ---
  const px = PUITS.x;
  const zc = MOL.z1;
  const trou = { x1: px - 1.5, x2: px + 1.5, z1: -5.8, z2: -3.2 };
  const dal = [T.x - 4.3, T.z - 4.3, T.x + 4.3, T.z + 4.3];
  c.pave(dal[0], -0.01, dal[1], dal[2], 0.07, trou.z1, 0x8f8a80, M.beton(), { crasse: false });
  c.pave(dal[0], -0.01, trou.z2, dal[2], 0.07, dal[3], 0x8f8a80, M.beton(), { crasse: false });
  c.pave(dal[0], -0.01, trou.z1, trou.x1, 0.07, trou.z2, 0x8f8a80, M.beton(), { crasse: false });
  c.pave(trou.x2, -0.01, trou.z1, dal[2], 0.07, trou.z2, 0x8f8a80, M.beton(), { crasse: false });
  // Le compartiment vide : le noir
  c.pave(trou.x1, -4, trou.z1, trou.x2, -3.9, trou.z2, C.noir, M.mat(), { crasse: false });
  for (const [p, q, r, s] of [[trou.x1, trou.z1, trou.x2, trou.z1 + 0.06], [trou.x1, trou.z2 - 0.06, trou.x2, trou.z2], [trou.x1, trou.z1, trou.x1 + 0.06, trou.z2], [trou.x2 - 0.06, trou.z1, trou.x2, trou.z2]]) c.pave(p, -4, q, r, 0.0, s, 0x24221f, M.mat(), { crasse: false });
  // La grille autour de la bouche du puits (un panneau arraché)
  const G = { x1: px - 2.0, x2: px + 1.9, z1: zc - 1.5, z2: -2.9 };
  const cotes = [[[G.x1, G.z1], [G.x2, G.z1]], [[G.x2, G.z1], [G.x2, G.z2]], [[G.x2, G.z2], [G.x1, G.z2]], [[G.x1, G.z2], [G.x1, G.z1]]];
  cotes.forEach(([a, bb], i) => {
    const L = Math.hypot(bb[0] - a[0], bb[1] - a[1]);
    const n = Math.round(L / 0.22);
    const arrache = i === 2 && u > 0.4;
    for (let j = 0; j <= n; j++) {
      const f = j / n;
      const x = a[0] + (bb[0] - a[0]) * f;
      const z = a[1] + (bb[1] - a[1]) * f;
      if (arrache && f > 0.35 && f < 0.7) continue;
      const poteau = j % 8 === 0;
      c.poutre([x, 0.05, z], [x, poteau ? 2.3 : 2.2, z], poteau ? 0.08 : 0.025, poteau ? C.acier : C.grille, M.tole());
    }
    for (const y of [0.15, 1.1, 2.15]) {
      if (arrache) {
        const m1 = [a[0] + (bb[0] - a[0]) * 0.35, a[1] + (bb[1] - a[1]) * 0.35];
        const m2 = [a[0] + (bb[0] - a[0]) * 0.7, a[1] + (bb[1] - a[1]) * 0.7];
        c.poutre([a[0], y, a[1]], [m1[0], y, m1[1]], 0.04, C.acier, M.tole());
        c.poutre([m2[0], y, m2[1]], [bb[0], y, bb[1]], 0.04, C.acier, M.tole());
      } else c.poutre([a[0], y, a[1]], [bb[0], y, bb[1]], 0.04, C.acier, M.tole());
    }
    if (arrache) {
      // Le panneau tombé, à plat, devant
      const m = [a[0] + (bb[0] - a[0]) * 0.52, a[1] + (bb[1] - a[1]) * 0.52];
      c.repere({ x: m[0] + 0.3, y: 0.1, z: m[1] + 1.2, ry: 0.25 }, () => {
        for (let j = 0; j < 7; j++) c.boite(0.025, 0.025, 2.0, C.grille, { x: -0.7 + j * 0.22 }, M.tole());
        for (const zz of [-0.95, 0, 0.95]) c.boite(1.4, 0.04, 0.04, C.acier, { z: zz }, M.tole());
      });
    }
  });
  obstacleRect(b, G.x1, G.z1, G.x2, G.z2, "grille de la bouche du puits");
  // La cage d'extraction, arrêtée à la recette, un wagonnet dedans
  c.repere({ x: px, z: zc }, () => {
    const cc = C.acier;
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) c.pave(sx * 0.68 - 0.05, 0.07, sz * 0.55 - 0.05, sx * 0.68 + 0.05, 3.5, sz * 0.55 + 0.05, cc, M.tole());
    for (const y of [0.07, 1.75, 3.45]) c.pave(-0.72, y, -0.6, 0.72, y + 0.1, 0.6, C.machineFonce, M.tole());
    for (const s of [-1, 1]) for (let j = 0; j < 6; j++) c.pave(-0.65 + j * 0.26, 0.2, s * 0.56 - 0.01, -0.63 + j * 0.26, 1.75, s * 0.56 + 0.01, C.grille, M.tole());
    c.pave(-0.75, 3.55, -0.62, 0.75, 3.62, 0.62, C.machineFonce, M.tole()); // le toit de la cage
    for (const s of [-1, 1]) c.poutre([s * 0.6, 3.62, 0], [0, 4.2, 0], 0.05, C.cable, M.metal()); // la suspension
  });
  wagonnet(c, px, zc, PI / 2, "debout", true, 0.17);
  // Le câble tendu, de la molette jusqu'à la cage
  c.tube([MOL.x - MOL.r, 3, MOL.z1], [MOL.x - MOL.r, 4.2, MOL.z1], 0.045, C.cable, M.metal(), 4);
  k.tube([MOL.x - MOL.r, 3, MOL.z1], [MOL.x - MOL.r, MOL.y, MOL.z1], 0.045, C.cable, tole, 4);
  // Le câble tendu, de la bobine à la molette (passe par le mur ouest de la salle des machines)
  const t = tangentes();
  k.tube([t.mol[0], t.mol[1], MOL.z1], [MACH.x0, hauteurCable(MACH.x0), BOB.z1 + (MOL.z1 - BOB.z1) * ((t.bob[0] - MACH.x0) / (t.bob[0] - t.mol[0]))], 0.05, C.cable, tole, 4);
  // Le chapeau de tôle sur les deux montants côté ouest (abri de la recette)
  if (fin) {
    c.pave(T.x - 4.4, 3.0, T.z - 4.0, T.x - 3.4, 3.12, T.z + 4.0, C.rouille, M.ondulee(), { crasse: false });
  }
}

// ---------- La salle des machines ----------

function machines(ctx, niveau) {
  const { b, c, u } = ctx;
  const R = MACH;
  const fin = niveau === "fin";
  const brique = M.brique();
  const beton = M.beton();
  const CUT = 1.2;
  const EP = 0.5;
  const xm = (R.x0 + R.x1) / 2;
  const zm = (R.z0 + R.z1) / 2;
  // Le sol (carrelage dans la salle détaillée)
  c.pave(R.x0 + 0.2, -0.02, R.z0 + 0.2, R.x1 - 0.2, 0.06, R.z1 - 0.2, fin ? 0xc9c0ac : 0x9d998f, fin ? M.carrelage() : beton, { nuance: 0.02, crasse: false });
  // Le soubassement de pierre
  for (const [p, q, r, s] of [[R.x0 - 0.35, R.z1 + 0.25, 23, R.z1 + 0.4], [25.2, R.z1 + 0.25, R.x1 + 0.4, R.z1 + 0.4], [R.x1 + 0.25, R.z0 - 0.35, R.x1 + 0.4, R.z1 + 0.4]]) c.pave(p, 0, q, r, 0.6, s, C.pierre, beton, { nuance: 0.03 });

  // --- Les murs du bas : sud et est coupés à hauteur d'allège, nord et ouest pleins ---
  const m = { ep: EP, couleur: C.brique, mat: brique, batiment: b };
  const porteS = 8; // la grande porte, au milieu de la façade sud
  mur(c, [R.x0, R.z1], [R.x1, R.z1], { ...m, h: CUT, ouvertures: [{ u: porteS, l: 2.4, bas: 0, haut: 5, type: "vide" }] });
  mur(c, [R.x1, R.z1], [R.x1, R.z0], { ...m, h: CUT });
  mur(c, [R.x1, R.z0], [R.x0, R.z0], { ...m, h: 4 });
  mur(c, [R.x0, R.z0], [R.x0, R.z1], { ...m, h: 4, ouvertures: [{ u: 3, l: 1.2, bas: 0, haut: 2.3, type: "vide" }] });
  // Le vantail de la grande porte, tombé dehors ; la petite porte ouest entrouverte
  c.boite(2.2, 0.08, 3.2, 0x55665e, { x: R.x0 + porteS + 0.3, y: 0.1, z: R.z1 + 1.9, ry: 0.12 }, M.tole());
  c.repere({ x: R.x0 - 0.25, z: R.z0 + 2.4, ry: 2.2 }, () => c.boite(1.1, 2.2, 0.05, PALETTE.boisSombre, { x: 0.55, y: 1.12 }, M.mat()));

  // --- Ce qui s'efface : hauts murs, baies cintrées, pignons, toit, pont roulant ---
  const k = b.couche("salle des machines : hauts murs, baies, toit, pont roulant", { x: xm, z: zm, l: R.x1 - R.x0 + 1.4, p: R.z1 - R.z0 + 1.4 }, CUT, R.faite + 1.2);
  const nais = 9.4; // naissance des grandes baies
  const baiesS = [2.2, 5, 11, 13.8];
  const baiesE = [3.5, 7.5, 11.5];
  const mh = { ep: EP, couleur: C.brique, mat: brique };
  // Sud
  mur(k, [R.x0, R.z1], [R.x1, R.z1], { ...mh, y0: CUT, h: R.h - CUT, ouvertures: [...baiesS.map((uu) => ({ u: uu, l: 2.2, bas: 0, haut: nais + 1.1 - CUT, type: "vide" })), { u: porteS, l: 2.4, bas: 0, haut: 5 - CUT, type: "vide" }] });
  // Est (on va du sud au nord : l'extérieur est à +z local)
  mur(k, [R.x1, R.z1], [R.x1, R.z0], { ...mh, y0: CUT, h: R.h - CUT, ouvertures: baiesE.map((uu) => ({ u: uu, l: 2.4, bas: 0, haut: nais + 1.2 - CUT, type: "vide" })) });
  // Nord : fenêtres hautes
  const baiesN = [2.4, 5.6, 8, 10.4, 13.6];
  mur(k, [R.x1, R.z0], [R.x0, R.z0], { ...mh, y0: 4, h: R.h - 4, ouvertures: baiesN.map((uu) => ({ u: uu, l: 2.0, bas: 0.9, haut: nais + 1.0 - 4, type: "vide" })) });
  // Ouest : les passages des câbles, deux fenêtres hautes
  const yc = hauteurCable(R.x0);
  const zcab = [BOB.z1 + (MOL.z1 - BOB.z1) * 0.37, BOB.z2];
  mur(k, [R.x0, R.z0], [R.x0, R.z1], {
    ...mh,
    y0: 4,
    h: R.h - 4,
    ouvertures: [{ u: 2.6, l: 2.0, bas: 0.9, haut: nais + 1.0 - 4, type: "vide" }, { u: 13.4, l: 2.0, bas: 0.9, haut: nais + 1.0 - 4, type: "vide" }, ...zcab.map((z) => ({ u: z - R.z0, l: 1.0, bas: yc - 4 - 0.7, haut: yc - 4 + 0.7, type: "vide" }))],
  });
  // Les baies garnies
  const garnir = (a, bb, liste, l, yB, ny) => {
    const r = repereMur(a, bb);
    k.repere({ x: r.x, z: r.z, ry: r.ry }, () => {
      for (const uu of liste) baie(k, uu, yB, ny, l, EP, u);
    });
  };
  garnir([R.x0, R.z1], [R.x1, R.z1], baiesS, 2.2, CUT, nais);
  garnir([R.x1, R.z1], [R.x1, R.z0], baiesE, 2.4, CUT, nais);
  garnir([R.x1, R.z0], [R.x0, R.z0], baiesN, 2.0, 4.9, nais);
  garnir([R.x0, R.z0], [R.x0, R.z1], [2.6, 13.4], 2.0, 4.9, nais);
  // La grande porte : un cintre au-dessus, une imposte vitrée
  {
    const r = repereMur([R.x0, R.z1], [R.x1, R.z1]);
    k.repere({ x: r.x, z: r.z, ry: r.ry }, () => baie(k, porteS, 3.8, 3.8, 2.4, EP, u, { appui: false }));
  }
  // Pilastres, bandeau, corniche à modillons
  const pilastres = (a, bb, liste, y0) => {
    const r = repereMur(a, bb);
    k.repere({ x: r.x, z: r.z, ry: r.ry }, () => {
      for (const uu of liste) k.pave(uu - 0.32, y0, EP / 2, uu + 0.32, R.h - 0.6, EP / 2 + 0.16, C.brique, brique, { nuance: 0.03 });
      k.pave(-0.3, R.h - 0.6, EP / 2, r.L + 0.3, R.h, EP / 2 + 0.3, C.briqueSombre, brique);
      for (let uu = 0.4; uu < r.L; uu += 0.8) k.pave(uu - 0.12, R.h - 0.9, EP / 2, uu + 0.12, R.h - 0.6, EP / 2 + 0.22, C.briqueSombre, brique);
      k.pave(-0.3, 5.2, EP / 2, r.L + 0.3, 5.4, EP / 2 + 0.1, C.pierre, beton, { crasse: false });
    });
    c.repere({ x: r.x, z: r.z, ry: r.ry }, () => {
      for (const uu of liste) c.pave(uu - 0.32, 0, EP / 2, uu + 0.32, y0, EP / 2 + 0.16, C.brique, brique, { nuance: 0.03 });
    });
  };
  pilastres([R.x0, R.z1], [R.x1, R.z1], [0.2, 3.6, 6.4, 9.6, 12.4, 15.8], CUT);
  pilastres([R.x1, R.z1], [R.x1, R.z0], [0.2, 5.5, 9.5, 14.8], CUT);
  pilastres([R.x1, R.z0], [R.x0, R.z0], [0.2, 4, 6.8, 9.2, 12, 15.8], 4);
  pilastres([R.x0, R.z0], [R.x0, R.z1], [0.2, 5.5, 10.2, 14.8], 4);
  // Les pignons est et ouest, le nom du puits peint sur le pignon est, un oculus
  for (const x of [R.x0, R.x1]) {
    pignon(k, x, R.z0, R.z1, R.h, R.faite, EP, C.brique, brique);
    const g = new THREE.CylinderGeometry(0.9, 0.9, EP + 0.12, 12);
    k.poser(g, beton, C.pierre, { x, y: R.h + 1.6, z: zm, rz: PI / 2 });
    g.dispose();
    const g2 = new THREE.CylinderGeometry(0.7, 0.7, EP + 0.16, 12);
    k.poser(g2, brique, 0x2a2c2c, { x, y: R.h + 1.6, z: zm, rz: PI / 2 });
    g2.dispose();
  }
  panneau(k, "puits", R.x1 + EP / 2 + 0.17, R.h - 1.6, zm, 9.6, 1.8, PI / 2);
  // Le toit de tôle, ses trous, le lanterneau
  const trous = u > 0.3 ? [{ u: -3.5, v: 1, l: 3.2, p: 0.55 + 0.4 * u }, { u: 4.5, v: 1, l: 2.4, p: 0.4 }, { u: 1, v: -1, l: 2.6, p: 0.7 }] : [];
  toitDeuxPans(k, xm, zm, R.x1 - R.x0, R.z1 - R.z0, R.h, R.faite - R.h, { mat: M.ondulee(), couleur: C.toit, debord: 0.4, trous, charpente: C.machineFonce });
  k.pave(xm - 5, R.faite + 0.15, zm - 0.7, xm + 5, R.faite + 1.0, zm + 0.7, C.toit, M.ondulee());
  for (const s of [-1, 1]) k.pave(xm - 5.2, R.faite + 0.95, zm + s * 0.45 - 0.5, xm + 5.2, R.faite + 1.05, zm + s * 0.45 + 0.5, C.toit, M.ondulee(), { crasse: false });
  // Les fermes métalliques
  for (let x = R.x0 + 3.2; x < R.x1 - 1; x += 3.2) {
    k.poutre([x, R.h, R.z0 + 0.3], [x, R.h, R.z1 - 0.3], 0.18, C.machineFonce, M.tole());
    for (const s of [-1, 1]) k.poutre([x, R.h, zm + s * 7.6], [x, R.faite - 0.1, zm], 0.2, C.machineFonce, M.tole());
    k.poutre([x, R.h, zm], [x, R.faite - 0.1, zm], 0.1, C.machineFonce, M.tole());
  }
  // Le pont roulant
  for (const z of [R.z0 + 0.6, R.z1 - 0.6]) k.pave(R.x0 + 0.3, 10.6, z - 0.2, R.x1 - 0.3, 11.0, z + 0.2, C.machineFonce, M.tole());
  for (const dx of [-0.5, 0.5]) k.pave(19.6 + dx - 0.2, 11.0, R.z0 + 0.4, 19.6 + dx + 0.2, 11.8, R.z1 - 0.4, 0xa89850, M.tole());
  k.pave(19.0, 11.8, -9.4, 20.2, 12.5, -8.2, 0xa89850, M.tole());
  k.poutre([19.6, 11.8, -8.8], [19.6, 7.2, -8.8], 0.04, C.cable, M.tole());
  k.boite(0.4, 0.5, 0.3, 0xa89850, { x: 19.6, y: 7.0, z: -8.8 }, M.tole());

  if (!fin) return;

  // ===== L'intérieur : la machine d'extraction =====
  const tole = M.tole();
  // Le massif de béton
  c.pave(19.4, 0, -10.9, 29.2, 0.9, -2.9, C.betonSombre, beton, { nuance: 0.02 });
  // La rampe de laiton autour du massif
  {
    const r0 = [19.0, -11.3, 29.6, -2.5];
    const pts = [[r0[0], r0[1]], [r0[2], r0[1]], [r0[2], r0[3]], [r0[0], r0[3]], [r0[0], r0[1]]];
    for (let i = 0; i < 4; i++) {
      const [x1, z1] = pts[i];
      const [x2, z2] = pts[i + 1];
      const L = Math.hypot(x2 - x1, z2 - z1);
      const n = Math.ceil(L / 1.6);
      for (let j = 0; j < n; j++) c.poutre([x1 + ((x2 - x1) * j) / n, 0, z1 + ((z2 - z1) * j) / n], [x1 + ((x2 - x1) * j) / n, 1.0, z1 + ((z2 - z1) * j) / n], 0.05, C.machineFonce, M.metal());
      if (i === 2 && u > 0.5) {
        // une lisse tombée
        c.poutre([x1, 0.1, z1 + 0.3], [x1 - 3, 0.1, z1 + 0.6], 0.05, C.laiton, M.metal());
        continue;
      }
      c.tube([x1, 1.0, z1], [x2, 1.0, z2], 0.035, C.laiton, M.metal(), 5);
    }
    obstacleRect(b, ...r0, "rampe de la machine d'extraction");
  }
  // Les paliers, l'arbre, les bobines
  for (const z of [-9.6, -7.0, -4.2]) {
    c.pave(BOB.x - 0.6, 0.9, z - 0.3, BOB.x + 0.6, BOB.y - 0.15, z + 0.3, C.machineFonce, tole);
    c.pave(BOB.x - 0.45, BOB.y - 0.15, z - 0.25, BOB.x + 0.45, BOB.y + 0.35, z + 0.25, C.machine, tole);
    c.boite(0.12, 0.2, 0.12, C.laiton, { x: BOB.x, y: BOB.y + 0.45, z }, M.metal()); // le graisseur
  }
  cylZ(c, -10.5, -3.3, BOB.x, BOB.y, 0.22, C.acier, M.metal(), 8);
  for (const zb of [BOB.z1, BOB.z2]) {
    cylZ(c, zb - 0.8, zb + 0.8, BOB.x, BOB.y, BOB.r, 0x6a6e6b, M.metal(), 16);
    for (const s of [-1, 1]) cylZ(c, zb + s * 0.8 - 0.07, zb + s * 0.8 + 0.07, BOB.x, BOB.y, BOB.r + 0.3, C.chev, tole, 16);
    // Les spires du câble enroulé
    for (let j = -2; j <= 2; j++) cylZ(c, zb + j * 0.28 - 0.04, zb + j * 0.28 + 0.04, BOB.x, BOB.y, BOB.r + 0.03, 0x4f5250, M.metal(), 16);
    // Le frein (côté ouest) : un montant, une mâchoire de bois
    c.pave(BOB.x - BOB.r - 0.5, 0.9, zb - 0.5, BOB.x - BOB.r - 0.3, BOB.y + 0.2, zb + 0.5, C.machineFonce, tole);
    c.pave(BOB.x - BOB.r - 0.22, BOB.y - 1.0, zb - 0.5, BOB.x - BOB.r - 0.06, BOB.y + 0.4, zb + 0.5, C.boisSombre, M.mat());
  }
  // Les manivelles, les bielles, les glissières, les cylindres à vapeur
  for (const [z, phi] of [[-10.2, 0.5], [-3.6, 0.5 + PI / 2]]) {
    cylZ(c, z - 0.13, z + 0.13, BOB.x, BOB.y, 1.0, C.machine, tole, 12);
    const pin = [BOB.x + 0.8 * Math.cos(phi), BOB.y + 0.8 * Math.sin(phi), z + (z < -6 ? -0.22 : 0.22)];
    cylZ(c, pin[2] - 0.12, pin[2] + 0.12, pin[0], pin[1], 0.13, C.acier, M.metal(), 6);
    const xt = 24.2 + 0.8 * (1 + Math.cos(phi)) * 0.5; // la crosse
    const tete = [xt, BOB.y, pin[2]];
    c.tube(pin, tete, 0.13, C.acier, M.metal(), 6); // la bielle
    c.boite(0.45, 0.4, 0.4, C.acier, { x: xt, y: BOB.y, z: pin[2] }, M.metal());
    for (const dy of [-0.32, 0.32]) c.pave(23.9, BOB.y + dy - 0.06, pin[2] - 0.12, 26.2, BOB.y + dy + 0.06, pin[2] + 0.12, C.laiton, M.metal());
    c.pave(23.8, 0.9, pin[2] - 0.5, 26.2, BOB.y - 0.4, pin[2] + 0.5, C.machineFonce, tole); // le bâti des glissières
    c.tube([xt, BOB.y, pin[2]], [26.3, BOB.y, pin[2]], 0.06, C.acier, M.metal(), 5); // la tige de piston
    // Le cylindre et sa boîte à tiroir
    c.pave(26.0, 0.9, pin[2] - 0.65, 29.0, BOB.y - 0.7, pin[2] + 0.65, C.machineFonce, tole);
    cylX(c, 26.2, 28.9, BOB.y, pin[2], 0.75, C.machine, tole, 12);
    for (const x of [26.2, 28.9]) cylX(c, x - 0.06, x + 0.06, BOB.y, pin[2], 0.85, C.laiton, M.metal(), 12);
    c.pave(26.6, BOB.y + 0.6, pin[2] - 0.4, 28.5, BOB.y + 1.2, pin[2] + 0.4, C.machineFonce, tole);
    // La conduite de vapeur qui monte et s'en va vers les chaudières disparues (au nord)
    tuyau(c, [[27.6, BOB.y + 1.2, pin[2]], [27.6, 8.6, pin[2]], [27.6, 8.6, R.z0 + 0.6], [27.6, 8.6, R.z0 - 0.4]], 0.16, 0x7a6f62, tole, 6);
  }
  // Le poste du machiniste : leviers, indicateurs de profondeur, fauteuil, cloche
  {
    c.pave(29.8, 0.06, -9.2, 31.6, 0.14, -3.6, C.boisSombre, M.mat(), { crasse: false });
    for (const [z, a] of [[-7.4, 0.25], [-6.4, -0.15], [-5.4, 0.4]]) {
      c.poutre([30.2, 0.14, z], [30.2 - Math.sin(a) * 1.3, 1.45, z], 0.07, C.acier, M.metal());
      const g = new THREE.IcosahedronGeometry(0.08, 0);
      c.poser(g, M.mat(), 0x2a2420, { x: 30.2 - Math.sin(a) * 1.3, y: 1.5, z });
      g.dispose();
      c.boite(0.3, 0.12, 0.2, C.machineFonce, { x: 30.2, y: 0.2, z }, M.tole());
    }
    for (const z of [-8.6, -4.2]) {
      c.pave(31.1, 0.14, z - 0.28, 31.45, 3.1, z + 0.28, C.machine, M.tole());
      c.pave(31.05, 0.6, z - 0.06, 31.12, 2.9, z + 0.06, C.laiton, M.metal()); // l'échelle graduée
      c.boite(0.12, 0.16, 0.34, C.laiton, { x: 31.0, y: z < -6 ? 1.1 : 2.3, z }, M.metal()); // le curseur : une cage en bas, l'autre en haut
      const g = new THREE.CylinderGeometry(0.42, 0.42, 0.12, 14);
      c.poser(g, M.metal(), C.laiton, { x: 31.05, y: 3.5, z, rz: PI / 2 });
      g.dispose();
      const g2 = new THREE.CylinderGeometry(0.36, 0.36, 0.13, 14);
      c.poser(g2, M.mat(), 0xe8e2d0, { x: 31.04, y: 3.5, z, rz: PI / 2 });
      g2.dispose();
    }
    // le fauteuil du machiniste, renversé
    c.repere({ x: 29.4, z: -6.2, ry: 0.6 }, () => {
      c.boite(0.5, 0.5, 0.08, 0x6a5a48, { y: 0.27 }, M.mat());
      c.boite(0.5, 0.08, 0.5, 0x6a5a48, { y: 0.27, z: 0.3 }, M.mat());
    });
    const g = new THREE.CylinderGeometry(0.05, 0.22, 0.28, 10, 1, true);
    c.poser(g, M.metal(), C.laiton, { x: R.x1 - 0.35, y: 2.6, z: -2.2 });
    g.dispose();
    obstacleRect(b, 30.9, -9.0, 31.6, -3.8, "indicateurs de profondeur");
  }
  // Le câble tendu (bobine 1) et le câble cassé (bobine 2), qui sortent par le mur ouest
  {
    const t = tangentes();
    const z1 = zcab[0];
    c.tube([t.bob[0], t.bob[1], BOB.z1], [R.x0 - 0.1, yc, z1], 0.05, C.cable, M.metal(), 4);
    c.tube([t.bob[0], t.bob[1], BOB.z2], [R.x0 - 0.1, yc, BOB.z2], 0.05, C.cable, M.metal(), 4);
  }
  // L'allée nord : l'établi, les rouleaux de câble, les fûts de graisse
  {
    const z0 = R.z0 + 0.3;
    c.pave(17.2, 0.85, z0, 20.4, 0.95, z0 + 0.75, C.boisSombre, M.mat());
    for (const x of [17.3, 20.2]) c.pave(x, 0, z0 + 0.05, x + 0.08, 0.85, z0 + 0.7, C.acier, M.tole());
    c.boite(0.3, 0.2, 0.18, 0x3b4a44, { x: 19.6, y: 1.05, z: z0 + 0.4 }, M.tole());
    c.pave(17.2, 1.3, z0, 20.4, 2.6, z0 + 0.05, 0x6f6a5c, M.mat()); // le panneau à outils
    for (let i = 0; i < 9; i++) c.boite(0.06, c.entre(0.2, 0.5), 0.04, 0x2c2e2c, { x: 17.5 + i * 0.34, y: c.entre(1.6, 2.2), z: z0 + 0.08, rz: c.entre(-0.3, 0.3) }, M.metal());
    obstacleRect(b, 17.2, z0, 20.4, z0 + 0.75, "établi");
    for (const [x, z, n] of [[25, -13.2, 5], [23.4, -14.3, 3]])
      for (let i = 0; i < n; i++) {
        const g = new THREE.TorusGeometry(0.62 - i * 0.03, 0.06, 4, 12);
        c.poser(g, M.metal(), C.cable, { x, y: 0.09 + i * 0.1, z, rx: PI / 2 });
        g.dispose();
      }
    for (const [x, z] of [[28.4, -14.9], [29.1, -14.4]]) baril(c, x, z, 0x4f6a5c);
    baril(c, 27.6, -13.6, C.rouille, true, 0.6);
    flaque(c, 27.0, -13.0, 0.8, 0.075);
    obstacleRect(b, 27.9, -15.6, 29.6, -13.9, "fûts de graisse");
  }
  // La lumière par les baies et les trous du toit, la poussière, les gravats
  for (const x of [18.2, 21, 27]) raiDeLumiere(c, [x + 1.2, 8.0, -0.7], [x - 1.2, 0.08, -4.8], 1.5);
  if (u > 0.3) {
    raiDeLumiere(c, [20.6, 14.6, -4.2], [19.5, 0.08, -6.6], 2.2);
    gravats(c, 19.4, -12.6, 1.2, 12, [C.brique, C.briqueSombre, C.toit]);
    jonchee(c, 17, -14, 22, -11.5, 20, [0x9fb0ae, 0xc0ccc8, C.toit], 0.07);
  }
  debris(c, 17, -2.4, 31, -0.5, 30, [C.brique, 0xc0ccc8, PALETTE.enduitCreme], 0.06);
  jonchee(c, 22, -2.3, 31, -0.5, 25, [0x9c7a45, 0x7d6143, 0xd9d2c0], 0.07);
}

// ---------- Le criblage, ses trémies, son convoyeur ----------

function criblage(ctx, niveau) {
  const { b, c, u } = ctx;
  const R = CRIB;
  const fin = niveau === "fin";
  const k = b.couche("criblage : caisse, trémies, toit", { x: (R.x0 + R.x1) / 2, z: (R.z0 + R.z1) / 2, l: R.x1 - R.x0 + 1.4, p: R.z1 - R.z0 + 1.4 }, 2.6, 13);
  const bois = C.boisSombre;
  const tole = M.tole();
  // Les pilotis (bois sur dés de béton) et leurs contreventements
  for (const x of [R.x0, (R.x0 + R.x1) / 2, R.x1])
    for (const z of [R.z0, R.z1]) {
      c.pave(x - 0.35, 0, z - 0.35, x + 0.35, 0.4, z + 0.35, C.betonSombre, M.beton());
      c.pave(x - 0.2, 0.4, z - 0.2, x + 0.2, 3.2, z + 0.2, bois, M.mat());
      k.pave(x - 0.2, 3.2, z - 0.2, x + 0.2, 5.2, z + 0.2, bois, M.mat());
      obstacleRect(b, x - 0.35, z - 0.35, x + 0.35, z + 0.35, "pilotis du criblage");
    }
  for (const z of [R.z0, R.z1]) {
    k.pave(R.x0 - 0.2, 5.0, z - 0.25, R.x1 + 0.2, 5.4, z + 0.25, bois, M.mat());
    for (let x = R.x0; x < R.x1 - 1; x += 5) {
      k.poutre([x, 3.0, z], [x + 2.5, 5.2, z], 0.14, bois, M.mat());
      k.poutre([x + 5, 3.0, z], [x + 2.5, 5.2, z], 0.14, bois, M.mat());
    }
  }
  for (const x of [R.x0, (R.x0 + R.x1) / 2, R.x1]) k.pave(x - 0.25, 5.0, R.z0, x + 0.25, 5.4, R.z1, bois, M.mat());
  // Les trémies (pyramides renversées en tôle rivetée) et leurs goulottes au-dessus de la voie
  for (const x of [-19.5, -14.5]) {
    const g = new THREE.CylinderGeometry(2.6, 0.5, 2.0, 4, 1, true);
    k.poser(g, M.ondulee(), C.rouille, { x, y: 4.1, z: -6, ry: PI / 4 }, { nuance: 0.06 });
    g.dispose();
    k.poutre([x, 3.1, -6], [x + 0.9, 2.75, -6], 0.5, C.rouilleSombre, tole);
  }
  // La caisse : ossature de bois, bardage de tôle ondulée dont il manque des plaques
  const y0 = 5.4;
  const y1 = 10.6;
  k.pave(R.x0 - 0.3, y0, R.z0 - 0.3, R.x1 + 0.3, y0 + 0.15, R.z1 + 0.3, C.boisGris, M.mat());
  for (let x = R.x0; x <= R.x1 + 0.01; x += 2.5)
    for (const z of [R.z0, R.z1]) k.pave(x - 0.14, y0, z - 0.14, x + 0.14, y1, z + 0.14, bois, M.mat());
  for (let z = R.z0 + 2; z < R.z1; z += 2) for (const x of [R.x0, R.x1]) k.pave(x - 0.14, y0, z - 0.14, x + 0.14, y1 + (R.z1 - z) * 0.18, z + 0.14, bois, M.mat());
  for (const y of [7.2, 9.0])
    for (const z of [R.z0, R.z1]) k.pave(R.x0, y - 0.07, z - 0.12, R.x1, y + 0.07, z + 0.12, bois, M.mat());
  const plaque = (x, z, ry, l, h, yb) => {
    if (c.hasard() < 0.14 + 0.3 * u) return;
    const pend = c.hasard() < 0.15;
    k.boite(l, h, 0.04, c.hasard() < 0.4 ? C.rouille : C.tole, { x, y: yb + h / 2, z, ry, rz: pend ? 0.3 : 0 }, M.ondulee(), { nuance: 0.05 });
  };
  for (let x = R.x0 + 0.65; x < R.x1; x += 1.25)
    for (const [z, s] of [[R.z1 + 0.18, 1], [R.z0 - 0.18, -1]]) {
      plaque(x, z, 0, 1.24, 1.7, y0 + 0.1);
      plaque(x, z, 0, 1.24, 1.5, 9.1);
      if (s > 0 && c.hasard() < 0.5) continue; // la bande vitrée sans vitres
      plaque(x, z, 0, 1.24, 0.9, 7.6);
    }
  for (let z = R.z0 + 0.65; z < R.z1; z += 1.25)
    for (const x of [R.x0 - 0.18, R.x1 + 0.18]) {
      plaque(x, z, PI / 2, 1.24, 1.8, y0 + 0.1);
      plaque(x, z, PI / 2, 1.24, 2.2, 7.6);
    }
  // Le toit en appentis
  const yT = (z) => y1 + (R.z1 - z) * 0.18 + 0.3;
  for (let x = R.x0 - 0.3; x < R.x1 + 0.2; x += 1.3) {
    if (c.hasard() < 0.1 + 0.3 * u) continue;
    quad(k, M.ondulee(), C.toit, [[x, yT(R.z1 + 0.5), R.z1 + 0.5], [x + 1.32, yT(R.z1 + 0.5), R.z1 + 0.5], [x + 1.32, yT(R.z0 - 0.5), R.z0 - 0.5], [x, yT(R.z0 - 0.5), R.z0 - 0.5]], undefined, true, true);
  }
  // Les cribles dedans (on les devine), la cheminée d'aspiration
  k.pave(-20.5, y0 + 0.2, -8, -15, y0 + 1.6, -4, C.machineFonce, tole);
  k.tube([-13.5, y1, -3], [-13.5, y1 + 3, -3], 0.3, C.rouille, tole, 8);

  // --- Le convoyeur incliné couvert, de la recette au sommet du criblage ---
  const A = [1.5, 0.9, -17.5];
  const B = [R.x1 - 0.2, 8.4, -8.2];
  const L = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]);
  const n = Math.round(L / 1.6);
  const P = (f, dy, s) => {
    const nx = -(B[2] - A[2]);
    const nz = B[0] - A[0];
    const nl = Math.hypot(nx, nz);
    return [A[0] + (B[0] - A[0]) * f + (nx / nl) * s * 0.8, A[1] + (B[1] - A[1]) * f + dy, A[2] + (B[2] - A[2]) * f + (nz / nl) * s * 0.8];
  };
  const kc = fin ? c : k;
  for (const s of [-1, 1])
    for (const dy of [0, 1.6]) kc.poutre(P(0, dy, s), P(1, dy, s), 0.12, C.chev, tole);
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    for (const s of [-1, 1]) kc.poutre(P(f, 0, s), P(f, 1.6, s), 0.08, C.chev, tole);
    kc.poutre(P(f, 0, -1), P(f, 0, 1), 0.08, C.chev, tole);
    kc.poutre(P(f, 1.6, -1), P(f, 1.6, 1), 0.08, C.chev, tole);
    if (i < n) {
      const f2 = (i + 1) / n;
      for (const s of [-1, 1]) kc.poutre(P(f, 0, s), P(f2, 1.6, s), 0.06, C.chevSombre, tole);
      if (c.hasard() > 0.18 + 0.3 * u) quad(kc, M.ondulee(), C.toit, [P(f, 1.75, -1.1), P(f2, 1.75, -1.1), P(f2, 1.75, 1.1), P(f, 1.75, 1.1)], undefined, true, true);
      if (c.hasard() > 0.4 + 0.3 * u) quad(kc, M.ondulee(), C.rouille, [P(f, 0.1, 1), P(f2, 0.1, 1), P(f2, 1.5, 1), P(f, 1.5, 1)], undefined, true, true);
    }
  }
  // La bande (on voit les rouleaux par en dessous)
  quad(kc, M.mat(), 0x2e2c2a, [P(0, 0.3, -0.5), P(1, 0.3, -0.5), P(1, 0.3, 0.5), P(0, 0.3, 0.5)], undefined, true, true);
  // Les palées
  for (const f of [0.36, 0.7]) {
    const p = P(f, 0, 0);
    for (const s of [-1, 1]) {
      const q = P(f, 0, s);
      kc.poutre([q[0], 0, q[2]], q, 0.22, C.chev, tole);
    }
    c.pave(p[0] - 1.1, 0, p[2] - 1.1, p[0] + 1.1, 0.3, p[2] + 1.1, C.betonSombre, M.beton());
    obstacleRect(b, p[0] - 1.1, p[2] - 1.1, p[0] + 1.1, p[2] + 1.1, "palée du convoyeur");
  }
  // La trémie de queue, au sol près de la recette
  c.pave(A[0] - 1.2, 0, A[2] - 1.2, A[0] + 1.2, 0.9, A[2] + 1.2, C.betonSombre, M.beton());
  {
    const g = new THREE.CylinderGeometry(1.4, 0.6, 1.2, 4, 1, true);
    c.poser(g, M.ondulee(), C.rouille, { x: A[0], y: 1.5, z: A[2], ry: PI / 4 });
    g.dispose();
  }
  obstacleRect(b, A[0] - 1.2, A[2] - 1.2, A[0] + 1.2, A[2] + 1.2, "trémie de queue du convoyeur");
  // Les tas de charbon sous les trémies
  gravats(c, -19.5, -8.6, 1.5, fin ? 22 : 10, [C.charbon, 0x3a3734, 0x1e1d1c]);
  gravats(c, -14.5, -3.6, 1.8, fin ? 26 : 12, [C.charbon, 0x3a3734, 0x1e1d1c]);
  mousse(c, -17, 0.02, -6, 4, 6, 0x2e2c2a); // la poussière noire
}

// ---------- La montagne, l'entrée de la galerie ----------

function montagne(ctx) {
  const { b, c, u } = ctx;
  const G = GAL;
  // La couche de rocher au-dessus de la galerie (s'efface quand on est dans l'entrée)
  const k = b.couche("rocher au-dessus de la galerie", { x: G.x, z: G.z - 4, l: 14, p: 9 }, 2.9, 16);
  // Les grands rochers du flanc de montagne
  const blocs = [
    [-46, -33, 9, 10, 8], [-36, -34, 8, 8, 7.5], [-26, -32, 8, 9, 6.5], [-17.5, -31.5, 6.5, 8.5, 6], [3.5, -31, 7, 8.5, 5.5], [13, -33, 8, 10, 7],
    [23, -32, 8, 8, 6.5], [33, -34, 9, 11, 8], [43, -33, 8, 9, 7.5], [-30, -40, 12, 14, 8], [-6, -41, 14, 15, 9], [18, -41, 12, 13, 8], [40, -42, 12, 15, 9],
  ];
  blocs.forEach(([x, z, ex, ey, ez], i) => rocher(c, x, 0, z, ex, ey, ez, i % 3 ? C.roche : C.rocheSombre, i * 0.7));
  // L'escarpement autour du portail
  for (const [x, z, ex, ey, ez, ry] of [[-12.4, -27.6, 2.6, 5.5, 2.4, 0.3], [-3.6, -27.4, 2.6, 5.2, 2.4, -0.4]]) rocher(c, x, 0, z, ex, ey, ez, C.rocheSombre, ry);
  rocher(k, G.x, 7.6, -30.5, 6.5, 4.5, 5.5, C.roche, 0.4);
  rocher(k, G.x - 3, 4.6, -29, 3.4, 2.2, 3, C.rocheSombre, 1.2);
  rocher(k, G.x + 3, 4.6, -29, 3.4, 2.2, 3, C.rocheSombre, 2.1);
  // Les sapins et les herbes sur le flanc
  const sapins = [[-40, -36, 8, 6], [-32, -35, 7, 5], [-22, -36, 9, 6.5], [-14, -38, 8, 8], [-2, -37, 9, 8], [8, -36, 7, 7.5], [16, -38, 9, 8], [26, -36, 8, 6.5], [36, -37, 9, 7], [44, -36, 7, 6.5], [-26, -44, 10, 10], [-10, -46, 9, 11], [6, -45, 10, 10], [28, -45, 10, 10], [-44, -42, 9, 9]];
  for (const [x, z, h, y] of sapins) sapin(c, x, z, h, y);
  semerTouffes(c, -40, -26, 40, -24.6, 40, PALETTE.herbeSeche);
  // Les sommets enneigés au loin
  for (const [x, z, r, h] of [[-34, -96, 30, 38], [10, -104, 34, 46], [50, -92, 24, 30]]) {
    const g = new THREE.ConeGeometry(r, h, 7);
    c.poser(g, M.mat(), 0x8a95a3, { x, y: h / 2 - 2, z, ry: x * 0.1 }, { crasse: false, nuance: 0.04 });
    g.dispose();
    const g2 = new THREE.ConeGeometry(r * 0.36, h * 0.36, 7);
    c.poser(g2, M.mat(), 0xeef0f2, { x, y: h - 2 - h * 0.18 + 0.2, z, ry: x * 0.1 }, { crasse: false, nuance: 0.02 });
    g2.dispose();
  }
  b.obstacle(-40, -25.4, G.x - 1.7, -25.4, "pied de la montagne");
  b.obstacle(G.x + 1.7, -25.4, 40, -25.4, "pied de la montagne");

  // --- Le portail de la galerie : piédroits de pierre, cintre, mur en ailes, plaque ---
  const pierre = matiereMonde("pierreTaille");
  const zf = G.z;
  // La tête de galerie : un mur de pierre percé d'un arc ; le haut s'efface quand on entre
  const tete = { ep: 0.7, couleur: C.pierre, mat: pierre };
  mur(c, [G.x - 3.4, zf], [G.x + 3.4, zf], { ...tete, h: 2.9, batiment: b, ouvertures: [{ u: 3.4, l: 3.2, bas: 0, haut: 5, type: "vide" }] });
  mur(k, [G.x - 3.4, zf], [G.x + 3.4, zf], { ...tete, y0: 2.9, h: 2.4, arase: 0.2, ouvertures: [{ u: 3.4, l: 3.2, bas: 0, haut: 1.3, type: "vide" }] });
  k.repere({ x: G.x, z: zf }, () => baie(k, 0, 2.6, 2.6, 3.2, 0.7, u, { verre: false, appui: false, coul: C.pierre, coulClaveau: 0x948e82, mat: pierre }));
  k.pave(G.x - 3.6, 5.2, zf - 0.45, G.x + 3.6, 5.45, zf + 0.45, C.betonSombre, pierre); // le chaperon
  for (const s of [-1, 1]) {
    c.pave(G.x + s * 2.4 - 0.25, 0, zf + 0.35, G.x + s * 2.4 + 0.25, 2.9, zf + 0.6, C.pierre, pierre); // contreforts
    c.repere({ x: G.x + s * 3.4, z: zf, ry: s * 0.5 }, () => c.pave(s > 0 ? 0 : -3.2, 0, -0.5, s > 0 ? 3.2 : 0, 2.2, 0.1, C.pierre, pierre));
  }
  panneau(c, "galerie", G.x - 3.4 - 1.29, 1.4, zf - 0.57, 1.6, 0.6, -0.5);
  // Les cadres d'étais qui s'enfoncent
  const etai = (z, casse) => {
    for (const s of [-1, 1]) c.tube([G.x + s * 1.45, 0, z], [G.x + s * 1.3, casse && s > 0 ? 2.2 : 2.85, z], 0.13, C.boisSombre, M.mat(), 6);
    if (casse) k.tube([G.x - 1.4, 2.85, z], [G.x + 1.5, 2.0, z + 0.3], 0.14, C.boisSombre, M.mat(), 6);
    else k.tube([G.x - 1.5, 2.9, z], [G.x + 1.5, 2.9, z], 0.14, C.boisSombre, M.mat(), 6);
  };
  etai(zf - 0.9, false);
  etai(zf - 2.1, u > 0.5);
  etai(zf - 3.3, false);
  for (let i = 0; i < 6; i++) k.boite(0.18, 0.06, 3.4, C.boisGris, { x: G.x - 1.2 + i * 0.48, y: 3.05, z: zf - 2.1, rz: c.entre(-0.05, 0.05) }, M.mat());
  // Les parois de rocher et le noir derrière
  for (const s of [-1, 1]) c.pave(G.x + s * 1.65 - 0.1, 0, zf - 4.2, G.x + s * 1.65 + 0.1, 3.0, zf - 0.4, 0x4c4a46, M.mat());
  k.pave(G.x - 1.8, 3.1, zf - 6, G.x + 1.8, 3.4, zf - 0.4, 0x3a3834, M.mat());
  c.pave(G.x - 2, 0, zf - 6.2, G.x + 2, 3.2, zf - 6.0, C.noir, M.mat(), { crasse: false });
  for (const s of [-1, 1]) c.pave(G.x + s * 1.9 - 0.1, 0, zf - 6.0, G.x + s * 1.9 + 0.1, 3.2, zf - 4.2, C.noir, M.mat(), { crasse: false });
  // Le mur : parpaings jusqu'à 1,3 m, des planches clouées en croix au-dessus, une planche arrachée
  const zm = zf - 4.0;
  for (let i = 0; i < 7; i++)
    for (let j = 0; j < 6; j++) {
      if (j > 3 + (i % 3) && u > 0.4) continue;
      c.boite(0.48, 0.22, 0.2, j % 2 ? 0x9b978d : 0xa6a297, { x: G.x - 1.45 + i * 0.48 + (j % 2) * 0.24, y: 0.12 + j * 0.23, z: zm }, M.mat(), { nuance: 0.04 });
    }
  for (const [a, h] of [[0.5, 1.9], [-0.45, 2.3], [0.1, 2.6]]) c.boite(3.2, 0.2, 0.05, C.boisGris, { x: G.x, y: h, z: zm + 0.12, rz: a * 0.35 }, M.mat(), { nuance: 0.08 });
  c.boite(0.2, 1.4, 0.05, C.boisGris, { x: G.x + 1.0, y: 0.1, z: zm + 0.8, rx: -PI / 2 + 0.2, ry: 0.4 }, M.mat());
  b.obstacle(G.x - 1.6, zm, G.x + 1.6, zm, "galerie murée");
  b.obstacle(G.x - 1.6, zm, G.x - 1.6, zf, "paroi de la galerie");
  b.obstacle(G.x + 1.6, zm, G.x + 1.6, zf, "paroi de la galerie");
  // Les lampes de mineur posées devant le mur, laissées par les Charbonniers
  for (const [dx, dz] of [[-0.8, 0.5], [0.6, 0.7], [1.1, 0.4]]) {
    const x = G.x + dx;
    const z = zm + dz;
    cylY(c, x, z, 0, 0.12, 0.07, 0.07, C.laiton, M.metal(), 6);
    cylY(c, x, z, 0.12, 0.22, 0.055, 0.055, 0xffd27a, M.mat(), 6);
    cylY(c, x, z, 0.22, 0.3, 0.07, 0.04, 0x7a7c78, M.metal(), 6);
  }
  b.lumiere(G.x, 0.5, zm + 0.6, 0xffc66a, 3.5, 7, "lampes de mineur posées devant la galerie murée");
  gravats(c, G.x - 1.2, zf - 0.3, 0.8, 10, [C.rocheSombre, C.roche, 0x7a5a48]);
  touffes(c, [[G.x - 1.9, zf + 0.4], [G.x + 2.2, zf + 0.3], [G.x + 1.2, zf - 0.2]]);
}

// ---------- Le terril ----------

function terril(ctx, densite = 1) {
  const { c, u } = ctx;
  const T = TERRIL;
  const g = new THREE.CylinderGeometry(1.4, T.r, T.h, 14, 3);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const a = Math.atan2(z, x);
    const f = 1 + 0.08 * Math.sin(3 * a + y * 0.3) + 0.05 * Math.cos(7 * a);
    pos.setXYZ(i, x * f, y, z * f);
  }
  g.computeVertexNormals();
  c.poser(g, M.mat(), 0x4a4440, { x: T.x, y: T.h / 2 - 0.3, z: T.z }, { crasse: false, nuance: 0.03 });
  g.dispose();
  // Une coulée de schiste rouge (brûlé)
  const g2 = new THREE.ConeGeometry(T.r * 0.55, T.h * 0.55, 8);
  c.poser(g2, M.mat(), 0x7a5444, { x: T.x + 6, y: T.h * 0.25 - 0.5, z: T.z + 7, ry: 0.4 }, { crasse: false, nuance: 0.04 });
  g2.dispose();
  // Les bouleaux qui ont conquis ses flancs
  const n = Math.round((6 + 8 * u) * densite);
  for (let i = 0; i < n; i++) {
    const a = 0.2 + (i / n) * 4.2 + c.entre(-0.2, 0.2);
    const r = c.entre(0.35, 0.9) * T.r;
    const y = T.h * (1 - r / T.r) - 0.6;
    arbre(c, T.x + Math.cos(a) * r, T.z + Math.sin(a) * r, c.entre(4.5, 7.5), "bouleau", y);
  }
  for (let i = 0; i < Math.round(8 * densite); i++) {
    const a = c.entre(0, 4.5);
    const r = c.entre(0.5, 1) * T.r;
    arbuste(c, T.x + Math.cos(a) * r, T.z + Math.sin(a) * r, c.entre(0.8, 1.4), T.h * (1 - r / T.r) - 0.4);
  }
  // Une flaque noire au pied
  flaque(c, T.x + 12, T.z + 17.5, 2.2, 0.04);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    ctx.b.obstacle(T.x + Math.cos(a) * (T.r - 2), T.z + Math.sin(a) * (T.r - 2), T.x + Math.cos(a + TAU / 10) * (T.r - 2), T.z + Math.sin(a + TAU / 10) * (T.r - 2), "pied du terril");
  }
}

// ---------- Les bains-douches : lampisterie, salle des pendus, bureaux ----------

function bains(ctx, niveau) {
  const { b, c, u } = ctx;
  const B = BAINS;
  const fin = niveau === "fin";
  const brique = M.brique();
  const beton = M.beton();
  const CUT = 1.0;
  const CUTI = 1.2;
  const EP = 0.4;
  // Les sols
  c.pave(B.x0 + 0.2, -0.02, B.z0 + 0.2, B.xl, 0.06, B.z1 - 0.2, 0x8f8a80, beton, { crasse: false, nuance: 0.02 });
  c.pave(B.xl, -0.02, B.z0 + 0.2, B.xb, 0.06, B.z1 - 0.2, 0xb9b8ae, M.carrelage(), { crasse: false, nuance: 0.02 });
  c.pave(B.xb, -0.02, B.z0 + 0.2, B.x1 - 0.2, 0.06, B.z1 - 0.2, 0x8a6f58, M.mat(), { crasse: false, nuance: 0.02 });
  // Le soubassement sombre
  c.pave(B.x0 - 0.25, 0, B.z1 + 0.15, B.x1 + 0.25, 0.6, B.z1 + 0.28, C.briqueSombre, brique);
  c.pave(B.x1 + 0.15, 0, B.z0 - 0.25, B.x1 + 0.28, 0.6, B.z1 + 0.28, C.briqueSombre, brique);

  // --- Les murs du bas ---
  const m = { ep: EP, couleur: C.brique, mat: brique, batiment: b };
  const xS = (x) => x - B.x0; // abscisse le long de la façade sud (ouest → est)
  const xN = (x) => B.x1 - x; // le long de la façade nord (est → ouest)
  const portesS = [{ u: xS(-10), l: 1.6 }, { u: xS(2), l: 1.0 }];
  mur(c, [B.x0, B.z1], [B.x1, B.z1], { ...m, h: CUT, ouvertures: portesS.map((p) => ({ ...p, bas: 0, haut: 3, type: "vide" })) });
  mur(c, [B.x1, B.z1], [B.x1, B.z0], { ...m, h: CUT });
  const ouvN = [
    { u: xN(0), l: 1.0, bas: 0, haut: 2.2, type: "vide" }, // porte du bureau de paie
    { u: xN(2.6), l: 1.0, bas: 1.0, haut: 1.9, type: "vide" }, // guichet de paie
    { u: xN(-10), l: 1.6, bas: 0, haut: 2.5, type: "vide" }, // porte des bains
    { u: xN(-7.6), l: 1.4, bas: 1.5, haut: 3.2, type: "vide" },
    { u: xN(-21.5), l: 1.6, bas: 1.0, haut: 2.0, type: "vide" }, // guichet de la lampisterie
  ];
  mur(c, [B.x1, B.z0], [B.x0, B.z0], { ...m, h: B.h, ouvertures: ouvN });
  mur(c, [B.x0, B.z0], [B.x0, B.z1], { ...m, h: B.h, ouvertures: [{ u: 9.6, l: 1.1, bas: 0, haut: 2.2, type: "vide" }, { u: 4.5, l: 1.2, bas: 2.9, haut: 3.8, type: "vide" }] });
  // Les cloisons, coupées à hauteur d'appui
  const mi = { ep: 0.25, couleur: 0xcfc8b6, mat: M.mat(), batiment: b };
  mur(c, [B.xl, B.z0], [B.xl, B.z1], { ...mi, couleur: C.brique, mat: brique, h: CUTI, ouvertures: [{ u: 9.5, l: 1.1, bas: 0, haut: 3, type: "vide" }] });
  mur(c, [B.xb, B.z0], [B.xb, B.z1], { ...mi, couleur: C.brique, mat: brique, h: CUTI, ouvertures: [{ u: 8.5, l: 1.1, bas: 0, haut: 3, type: "vide" }] });
  mur(c, [B.xb, 11.5], [B.x1, 11.5], { ...mi, h: CUTI, ouvertures: [{ u: 5.5, l: 0.95, bas: 0, haut: 3, type: "vide" }] });
  // Les vantaux
  c.repere({ x: -10.8, z: B.z1 + 0.2, ry: -1.2 }, () => c.boite(0.8, 2.3, 0.05, 0x55665e, { x: 0.4, y: 1.17 }, M.mat()));
  c.boite(1.0, 0.05, 2.2, PALETTE.boisSombre, { x: 2.3, y: 0.08, z: B.z1 + 1.5, ry: -0.2 }, M.mat());

  // --- Ce qui s'efface : hauts murs, pignons, toits ---
  const k = b.couche("bains-douches : hauts murs et toits", { x: (B.x0 + B.x1) / 2, z: (B.z0 + B.z1) / 2, l: B.x1 - B.x0 + 1, p: B.z1 - B.z0 + 1 }, CUT, B.hp + 3.6);
  const mh = { ep: EP, couleur: C.brique, mat: brique };
  const fenS = [xS(-23.5), xS(-19.5), xS(-14.5), xS(-5.5), xS(-0.4)];
  mur(k, [B.x0, B.z1], [B.x1, B.z1], { ...mh, y0: CUT, h: B.h - CUT, ouvertures: [...fenS.map((uu) => ({ u: uu, l: 1.4, bas: 0.3, haut: 2.0, type: "vide" })), ...portesS.map((p) => ({ ...p, bas: 0, haut: 1.4, type: "vide" }))] });
  mur(k, [B.x1, B.z1], [B.x1, B.z0], { ...mh, y0: CUT, h: B.h - CUT, ouvertures: [{ u: 2.6, l: 1.3, bas: 0.3, haut: 2.0, type: "vide" }, { u: 8.4, l: 1.3, bas: 0.3, haut: 2.0, type: "vide" }] });
  for (const [a, bb] of [[[B.xl, B.z0], [B.xl, B.z1]], [[B.xb, B.z0], [B.xb, B.z1]]]) mur(k, a, bb, { ...mh, ep: 0.25, y0: CUTI, h: B.hp - CUTI, ouvertures: [{ u: a[0] === B.xl ? 9.5 : 8.5, l: 1.1, bas: 0, haut: 1.0, type: "vide" }] });
  mur(k, [B.xb, 11.5], [B.x1, 11.5], { ...mi, batiment: null, y0: CUTI, h: B.h - CUTI, ouvertures: [{ u: 5.5, l: 0.95, bas: 0, haut: 1.0, type: "vide" }] });
  // Les hauts murs de la salle des pendus, et leurs fenêtres hautes
  const fenP = [2, 5, 8, 11, 12.5].slice(0, 4);
  mur(k, [B.xl, B.z1], [B.xb, B.z1], { ...mh, y0: B.h, h: B.hp - B.h, ouvertures: fenP.map((uu) => ({ u: uu + 0.5, l: 1.6, bas: 0.5, haut: 2.6, type: "vide" })) });
  mur(k, [B.xb, B.z0], [B.xl, B.z0], { ...mh, y0: B.h, h: B.hp - B.h, ouvertures: fenP.map((uu) => ({ u: uu + 0.5, l: 1.6, bas: 0.5, haut: 2.6, type: "vide" })) });
  for (const uu of fenP) {
    vitre(k, u, B.xl + uu + 0.5, B.h + 1.55, B.z1, 1.6, 2.1);
    vitre(k, u, B.xb - uu - 0.5, B.h + 1.55, B.z0, 1.6, 2.1);
  }
  // Les fenêtres basses (vitrées) de la façade sud et de l'est, les linteaux de béton
  for (const uu of fenS) {
    vitre(k, u, B.x0 + uu, CUT + 1.15, B.z1, 1.4, 1.7);
    k.pave(B.x0 + uu - 0.85, CUT + 2.0, B.z1 - 0.2, B.x0 + uu + 0.85, CUT + 2.25, B.z1 + 0.28, C.beton, beton);
    k.pave(B.x0 + uu - 0.8, CUT + 0.18, B.z1 - 0.1, B.x0 + uu + 0.8, CUT + 0.3, B.z1 + 0.32, C.beton, beton);
  }
  for (const uu of [2.6, 8.4]) {
    vitre(k, u, B.x1, CUT + 1.15, B.z1 - uu, 1.3, 1.7, PI / 2);
    k.pave(B.x1 - 0.2, CUT + 2.0, B.z1 - uu - 0.8, B.x1 + 0.28, CUT + 2.25, B.z1 - uu + 0.8, C.beton, beton);
  }
  // Bandeaux, enseignes
  k.pave(B.x0 - 0.2, B.h - 0.3, B.z1 - 0.2, B.x1 + 0.2, B.h, B.z1 + 0.32, C.beton, beton);
  k.pave(B.x1 - 0.2, B.h - 0.3, B.z0 - 0.2, B.x1 + 0.32, B.h, B.z1 + 0.2, C.beton, beton);
  k.pave(B.xl - 0.2, B.hp - 0.3, B.z1 - 0.2, B.xb + 0.2, B.hp, B.z1 + 0.32, C.beton, beton);
  panneau(k, "bains", -10, CUT + 2.7, B.z1 + 0.25, 3.2, 1.2);
  panneau(k, "lampisterie", -21.5, B.h - 0.85, B.z1 + 0.25, 3.6, 0.68);
  panneau(k, "bureaux", 0.5, B.h - 0.85, B.z1 + 0.25, 2.6, 0.98);
  // Les pignons et les toits
  pignon(k, B.x0, B.z0, B.z1, B.h, B.h + 2.6, EP, C.brique, brique);
  pignon(k, B.x1, B.z0, B.z1, B.h, B.h + 2.6, EP, C.brique, brique);
  pignon(k, B.xl, B.z0, B.z1, B.hp, B.hp + 3, 0.3, C.brique, brique);
  pignon(k, B.xb, B.z0, B.z1, B.hp, B.hp + 3, 0.3, C.brique, brique);
  const zc = (B.z0 + B.z1) / 2;
  toitDeuxPans(k, (B.x0 + B.xl) / 2 - 0.2, zc, B.xl - B.x0 + 0.4, B.z1 - B.z0, B.h, 2.6, { mat: M.ondulee(), couleur: C.toit, debord: 0.3 });
  toitDeuxPans(k, (B.xb + B.x1) / 2 + 0.2, zc, B.x1 - B.xb + 0.4, B.z1 - B.z0, B.h, 2.6, { mat: M.ondulee(), couleur: C.toit, debord: 0.3, trous: u > 0.6 ? [{ u: 1.5, v: 1, l: 2, p: 0.5 }] : [] });
  const trousP = u > 0.25 ? [{ u: -3.2, v: 1, l: 2.6, p: 0.5 + 0.3 * u }, { u: 2.8, v: -1, l: 2.4, p: 0.6 }, { u: 0.2, v: 1, l: 1.2, p: 0.35 }] : [];
  toitDeuxPans(k, (B.xl + B.xb) / 2, zc, B.xb - B.xl, B.z1 - B.z0, B.hp, 3, { mat: M.ondulee(), couleur: 0x6f6a62, debord: 0.35, trous: trousP, charpente: C.machineFonce });
  // Les descentes d'eau
  for (const x of [B.x0 + 0.3, B.xl - 0.4, B.xb + 0.4, B.x1 - 0.3]) {
    k.tube([x, CUT, B.z1 + 0.32], [x, B.h, B.z1 + 0.32], 0.06, C.tole, M.tole(), 5);
    c.tube([x, 0.1, B.z1 + 0.32], [x, CUT, B.z1 + 0.32], 0.06, C.tole, M.tole(), 5);
  }
  // Les poutres des poulies de la salle des pendus
  for (let x = B.xl + 1.3; x < B.xb - 0.5; x += 2.6) k.pave(x - 0.12, 7.0, B.z0 + 0.2, x + 0.12, 7.3, B.z1 - 0.2, C.machineFonce, M.tole());
  lierre(c, B.x0 - 0.22, 0, 14.5, -PI / 2, 4, 4.2, 60);

  // ===== La salle des pendus =====
  const cols = fin ? 10 : 5;
  const rangs = fin ? [8.4, 10.6, 12.8, 15.0] : [9.2, 13.6];
  const tonsV = [0x56708e, 0x4a5a44, 0x7a6450, 0x8a8576, 0x46566e, 0x8a7656, 0xa49c88, 0x6a7a8e];
  const pendu = (x, z) => {
    const yh = 4.2 + c.hasard() * 0.9;
    c.poutre([x, yh, z], [x, 7.0, z], 0.025, C.cable, M.metal());
    c.boite(0.25, 0.04, 0.04, C.acier, { x, y: yh, z, ry: c.hasard() * 3 }, M.metal()); // le crochet
    const ry = c.hasard() * TAU;
    const t = tonsV[Math.floor(c.hasard() * tonsV.length)];
    c.repere({ x, y: yh, z, ry }, () => {
      const r = c.hasard();
      if (r < 0.75) c.boite(0.5, 0.66, 0.14, t, { y: -0.4, rz: c.entre(-0.08, 0.08) }, M.mat(), { crasse: false, nuance: 0.08 }); // la veste
      if (r < 0.55) for (const s of [-1, 1]) c.boite(0.17, 0.78, 0.13, tonsV[(tonsV.indexOf(t) + 1) % tonsV.length], { x: s * 0.1, y: -1.1, z: 0.08, rz: s * 0.04 }, M.mat(), { crasse: false, nuance: 0.06 });
      if (c.hasard() < 0.6) for (const s of [-1, 1]) c.boite(0.12, 0.3, 0.26, 0x2e2a26, { x: s * 0.09 + 0.2, y: -0.55 - c.hasard() * 0.3, z: -0.1 }, M.mat(), { crasse: false }); // les bottes
      if (c.hasard() < 0.5) {
        const g = new THREE.SphereGeometry(0.16, 6, 3, 0, TAU, 0, PI / 2);
        c.poser(g, M.mat(), c.hasard() < 0.5 ? 0xb9a982 : 0x5a5248, { y: 0.02 }, { crasse: false });
        g.dispose();
        c.boite(0.36, 0.02, 0.36, 0x5a5248, { y: 0.03 }, M.mat(), { crasse: false });
      } else if (c.hasard() < 0.6) {
        cylY(c, 0, 0, -0.35, -0.02, 0.18, 0.22, 0x8a7a5a, M.mat(), 6, true); // le panier
        c.poutre([-0.2, -0.02, 0], [0, 0.05, 0], 0.02, C.acier, M.metal());
        c.poutre([0.2, -0.02, 0], [0, 0.05, 0], 0.02, C.acier, M.metal());
      }
    });
  };
  for (const z of rangs)
    for (let i = 0; i < cols; i++) {
      const x = B.xl + 1.0 + i * ((B.xb - B.xl - 2) / Math.max(1, cols - 1));
      if (c.hasard() < 0.08 + 0.15 * u) continue; // la chaîne a lâché
      pendu(x + c.entre(-0.15, 0.15), z + c.entre(-0.2, 0.2));
    }
  // Les bancs sous les rangs
  for (const z of rangs)
    for (const [x1, x2] of [[B.xl + 0.6, -10.8], [-9.2, B.xb - 0.6]]) {
      c.pave(x1, 0.42, z - 0.17, x2, 0.48, z + 0.17, C.boisGris, M.mat(), { nuance: 0.05 });
      for (let x = x1 + 0.2; x < x2; x += 1.6) c.pave(x, 0, z - 0.14, x + 0.08, 0.42, z + 0.14, C.boisSombre, M.mat());
      obstacleRect(b, x1, z - 0.17, x2, z + 0.17, "banc");
    }
  // Les chaînes tendues le long des murs jusqu'aux taquets numérotés et cadenassés
  if (fin) {
    for (const [z, s] of [[B.z0 + 0.25, 1], [B.z1 - 0.25, -1]]) {
      const x1 = z < 10 ? -11.4 : B.xl + 0.4;
      const x2 = z < 10 ? B.xb - 1.6 : B.xb - 0.4;
      c.pave(x1, 1.25, z - 0.03, x2, 1.6, z + 0.03 + s * 0.06, C.boisSombre, M.mat());
      for (let x = x1; x < x2 - 0.5; x += 3.6) panneau(c, "numeros", x + 1.8, 1.42, z + s * 0.1, 3.6, 0.9, s > 0 ? 0 : PI);
      for (let x = x1 + 0.1; x < x2; x += 0.24) if (c.hasard() < 0.85) c.poutre([x, 1.5, z + s * 0.12], [x + c.entre(-0.1, 0.1), z < 10 ? B.h - 0.1 : CUT + 0.1, z + s * 0.12], 0.018, C.cable, M.metal());
    }
    // Les douches, le long du mur nord, à l'ouest
    c.pave(B.xl + 0.2, 0.06, B.z0 + 0.22, -12.2, 2.3, B.z0 + 0.26, 0xa9c4b8, M.carrelage(), { crasse: false });
    c.tube([B.xl + 0.3, 2.3, B.z0 + 0.4], [-12.3, 2.3, B.z0 + 0.4], 0.05, 0x8a6a48, M.metal(), 5);
    for (let x = B.xl + 0.8; x < -12.4; x += 0.95) {
      c.tube([x, 2.3, B.z0 + 0.4], [x, 2.15, B.z0 + 0.7], 0.03, 0x8a6a48, M.metal(), 4);
      const g = new THREE.CylinderGeometry(0.1, 0.04, 0.06, 8);
      c.poser(g, M.metal(), 0x8a6a48, { x, y: 2.12, z: B.z0 + 0.72 });
      g.dispose();
      c.boite(0.08, 0.08, 0.06, C.laiton, { x, y: 1.25, z: B.z0 + 0.3 }, M.metal());
    }
    for (let x = B.xl + 1.6; x < -12.4; x += 1.9) c.pave(x - 0.03, 0.06, B.z0 + 0.25, x + 0.03, 1.9, B.z0 + 1.2, 0xa9c4b8, M.carrelage(), { crasse: false });
    flaque(c, -14.6, 7.4, 0.9, 0.075);
    // Des vêtements tombés, des bottes, des paniers par terre
    for (let i = 0; i < 9; i++) c.boite(c.entre(0.4, 0.7), 0.06, c.entre(0.4, 0.6), tonsV[i % tonsV.length], { x: c.entre(B.xl + 1, B.xb - 1), y: 0.1, z: c.entre(7.5, 16), ry: c.hasard() * 3 }, M.mat(), { crasse: false, nuance: 0.08 });
    for (let i = 0; i < 4; i++) c.boite(0.12, 0.3, 0.28, 0x2e2a26, { x: c.entre(B.xl + 1, B.xb - 1), y: 0.15, z: c.entre(7.5, 16), ry: c.hasard() * 3, rz: c.hasard() < 0.5 ? PI / 2 : 0 }, M.mat());
    // Les rais de lumière par les trous du toit et les fenêtres hautes
    for (const t of trousP) raiDeLumiere(c, [(B.xl + B.xb) / 2 + t.u + 0.8, 8.9, zc + t.v * 2.8], [(B.xl + B.xb) / 2 + t.u - 1.2, 0.08, zc + t.v * 1.4 - 2.2], 1.6);
    jonchee(c, B.xl + 0.5, 6.6, B.xb - 0.5, 16.5, 40, [0x9c7a45, 0x7d6143, 0xd9d2c0, 0xbfb8a6], 0.07);
  }
  // Le distributeur « Air pur premium », contre le mur nord
  {
    const x = -4.6;
    const z = B.z0 + 0.6;
    c.pave(x - 0.62, 0.06, z - 0.38, x + 0.62, 2.0, z + 0.38, 0xd8dcd6, M.tole());
    c.pave(x - 0.66, 1.95, z - 0.4, x + 0.66, 2.1, z + 0.42, 0x2f6f73, M.tole(), { crasse: false });
    panneau(c, "airPur", x, 1.04, z + 0.39, 1.2, 1.8);
    if (fin) {
      for (const [dx, dz, t, couche] of [[0.9, 0.6, 0x9fd0b4, true], [1.3, 0.3, 0xc9b7e0, false], [-1.0, 0.9, 0xa8d4e8, true], [0.5, 1.2, 0xf0c9a0, true]]) {
        const g = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 6);
        c.poser(g, M.mat(), t, couche ? { x: x + dx, y: 0.14, z: z + dz, rz: PI / 2, ry: c.hasard() * 3 } : { x: x + dx, y: 0.26, z: z + dz }, { crasse: false });
        g.dispose();
      }
    }
    obstacleRect(b, x - 0.62, z - 0.38, x + 0.62, z + 0.38, "distributeur Air pur premium");
    // Son écran luit encore (pile de secours) : « Respirez mieux que vos voisins. »
    c.boite(0.2, 0.15, 0.01, 0x7fe0e8, { x: x + 0.33, y: 1.62, z: z + 0.4 }, M.mat(), { crasse: false });
    b.lumiere(x, 1.6, z + 0.9, 0x7fd8e0, 1.6, 4, "écran du distributeur « Air pur premium » (pile de secours)");
  }

  // ===== La lampisterie =====
  const lampe = (x, y, z, ry = 0) => {
    // Une lampe de mineur pendue à son crochet : pot de laiton, verre, tamis, bonnet
    cylY(c, x, z, y, y + 0.1, 0.055, 0.055, C.laiton, M.metal(), 6);
    cylY(c, x, z, y + 0.1, y + 0.17, 0.042, 0.042, 0xb8c4c0, M.mat(), 5);
    cylY(c, x, z, y + 0.17, y + 0.27, 0.045, 0.03, 0x7a7c78, M.metal(), 5);
  };
  {
    const x0 = B.x0 + 0.25;
    // Le râtelier du mur ouest : fond peint (des centaines de lampes), deux rangs en relief devant
    for (const z of [9.4, 13.0]) panneau(c, "lampes", x0 + 0.04, 1.75, z, 3.4, 1.28 * (3.4 / 3.4), PI / 2);
    c.pave(x0, 0.0, 7.4, x0 + 0.5, 0.9, 14.9, C.bois, M.mat()); // le bas du râtelier
    c.pave(x0, 2.4, 7.4, x0 + 0.45, 2.5, 14.9, C.bois, M.mat());
    for (const z of [7.5, 11.2, 14.8]) c.pave(x0, 0, z - 0.05, x0 + 0.45, 2.5, z + 0.05, C.bois, M.mat());
    obstacleRect(b, x0, 7.4, x0 + 0.5, 14.9, "râtelier à lampes");
    if (fin)
      for (const y of [0.95, 1.55])
        for (let z = 7.7; z < 14.7; z += 0.3) {
          if (c.hasard() < 0.2) continue;
          lampe(x0 + 0.38, y, z);
        }
    // Le râtelier central à double face
    const xr = -21.4;
    c.pave(xr - 0.08, 0, 9.2, xr + 0.08, 2.4, 15.2, C.bois, M.mat());
    for (const s of [-1, 1]) {
      panneau(c, "lampes", xr + s * 0.09, 1.55, 10.7, 2.9, 1.09, s > 0 ? PI / 2 : -PI / 2);
      panneau(c, "lampes", xr + s * 0.09, 1.55, 13.7, 2.9, 1.09, s > 0 ? PI / 2 : -PI / 2);
      c.pave(xr + s * 0.08, 0.55, 9.2, xr + s * 0.35, 0.62, 15.2, C.bois, M.mat());
      if (fin)
        for (let z = 9.4; z < 15.1; z += 0.32) {
          if (c.hasard() < 0.25) continue;
          lampe(xr + s * 0.25, 0.62, z);
        }
    }
    for (const z of [9.2, 15.2]) c.pave(xr - 0.4, 0, z - 0.06, xr + 0.4, 2.45, z + 0.06, C.bois, M.mat());
    obstacleRect(b, xr - 0.4, 9.2, xr + 0.4, 15.2, "râtelier central");
    // Le comptoir du guichet, le tableau des jetons, le râtelier de charge des lampes à accus
    c.pave(-22.5, 0, B.z0 + 0.25, -20.5, 1.0, B.z0 + 0.9, C.bois, M.mat());
    c.pave(-22.6, 1.0, B.z0 + 0.2, -20.4, 1.06, B.z0 + 1.0, C.bois, M.mat());
    obstacleRect(b, -22.5, B.z0 + 0.25, -20.5, B.z0 + 0.9, "comptoir de la lampisterie");
    panneau(c, "jetons", -19.0, 1.9, B.z0 + 0.24, 2.4, 0.45);
    c.pave(-25.6, 0, B.z0 + 0.25, -23.2, 1.5, B.z0 + 0.75, C.machineFonce, M.tole());
    for (let i = 0; i < 2; i++) c.pave(-25.55, 0.45 + i * 0.5, B.z0 + 0.3, -23.25, 0.5 + i * 0.5, B.z0 + 0.74, C.acier, M.tole());
    if (fin)
      for (let i = 0; i < 2; i++)
        for (let x = -25.4; x < -23.3; x += 0.26) {
          c.boite(0.16, 0.24, 0.16, 0x3a3a36, { x, y: 0.62 + i * 0.5, z: B.z0 + 0.5 }, M.mat());
          c.poutre([x, 0.74 + i * 0.5, B.z0 + 0.5], [x + 0.05, 1.5, B.z0 + 0.3], 0.015, 0x222222, M.mat());
        }
    obstacleRect(b, -25.6, B.z0 + 0.25, -23.2, B.z0 + 0.75, "râtelier de charge");
    // Une lampe allumée sur le comptoir (des Charbonniers sont passés)
    lampe(-21.0, 1.06, B.z0 + 0.6);
    c.boite(0.06, 0.05, 0.06, 0xffd27a, { x: -21.0, y: 1.2, z: B.z0 + 0.6 }, M.mat(), { crasse: false });
    if (fin) b.lumiere(-21.0, 1.5, B.z0 + 1.0, 0xffc66a, 2.6, 6, "lampe de mineur allumée sur le comptoir de la lampisterie");
    if (fin) {
      for (let i = 0; i < 6; i++) lampe(c.entre(-25, -18), 0.06, c.entre(7.5, 16.2));
      debris(c, -25.6, 7, -17.6, 16.5, 30, [0xb8c4c0, C.laiton, 0xd9d2c0], 0.06);
    }
  }

  // ===== Les bureaux =====
  if (fin) {
    // Le bureau de paie : le guichet à barreaux, le comptoir, le coffre-fort ouvert
    c.pave(-0.4, 0, B.z0 + 0.25, 3.8, 1.05, B.z0 + 0.85, C.boisSombre, M.mat());
    obstacleRect(b, -0.4, B.z0 + 0.25, 3.8, B.z0 + 0.85, "comptoir de la paie");
    for (let x = 2.15; x < 3.1; x += 0.12) c.poutre([x, 1.05, B.z0 + 0.3], [x, 1.9, B.z0 + 0.3], 0.02, C.laiton, M.metal());
    c.pave(2.7, 0.06, 9.6, 3.7, 1.1, 10.6, 0x3f5248, M.tole());
    c.repere({ x: 2.7, z: 9.6, ry: 2.0 }, () => c.boite(0.95, 1.0, 0.1, 0x3f5248, { x: 0.47, y: 0.58 }, M.tole()));
    obstacleRect(b, 2.7, 9.6, 3.7, 10.6, "coffre-fort");
    jonchee(c, -2.5, 7, 3.5, 11, 30, [0xd9d2c0, 0xc9b88a, 0xe8e2d2], 0.07);
    // Le bureau de l'ingénieur : la table des plans, la table de travail, les registres, les rouleaux de plans
    c.repere({ x: 0.4, z: 14.2, ry: 0.1 }, () => {
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) c.pave(sx * 0.9 - 0.04, 0, sz * 0.6 - 0.04, sx * 0.9 + 0.04, 0.95 + (sz < 0 ? 0.15 : 0), sz * 0.6 + 0.04, C.boisSombre, M.mat());
      c.boite(2.0, 0.05, 1.4, C.bois, { y: 1.0, rx: -0.12 }, M.mat());
      panneau(c, "plans", 0, 1.03, 0, 1.6, 1.15, 0, -PI / 2 - 0.12);
    });
    obstacleRect(b, -0.6, 13.5, 1.4, 14.9, "table des plans");
    c.pave(2.2, 0, 15.6, 3.7, 0.76, 16.6, C.boisSombre, M.mat());
    c.pave(2.1, 0.76, 15.5, 3.8, 0.8, 16.7, C.bois, M.mat());
    obstacleRect(b, 2.1, 15.5, 3.8, 16.7, "bureau");
    lampe(3.2, 0.8, 16.2);
    c.boite(0.06, 0.05, 0.06, 0xffd27a, { x: 3.2, y: 0.95, z: 16.2 }, M.mat(), { crasse: false });
    b.lumiere(3.2, 1.3, 16.0, 0xffc66a, 2.2, 5, "lampe de mineur sur le bureau de l'ingénieur");
    // L'étagère basse des registres
    c.pave(-2.75, 0, 11.9, -2.35, 1.15, 15.4, C.boisSombre, M.mat());
    const tons = [0x6a3b2c, 0x3f4f3a, 0x5a4a38, 0x2f3f52];
    for (const y of [0.1, 0.6])
      for (let z = 12.0; z < 15.3; z += c.entre(0.09, 0.14)) {
        if (c.hasard() < 0.15) continue;
        c.boite(0.3, 0.38, 0.07, tons[Math.floor(c.hasard() * tons.length)], { x: -2.55, y: y + 0.2, z, rx: c.hasard() < 0.1 ? 0.3 : 0 }, M.mat(), { crasse: false, nuance: 0.08 });
      }
    obstacleRect(b, -2.75, 11.9, -2.35, 15.4, "étagère des registres");
    for (let i = 0; i < 5; i++) cylY(c, -1.6 + i * 0.12, 16.3, 0.06, 0.9, 0.05, 0.05, 0xd8d2bf, M.mat(), 5); // rouleaux de plans
    for (let i = 0; i < 6; i++) c.boite(0.3, 0.06, 0.38, tons[i % tons.length], { x: c.entre(-2, 1.8), y: 0.09, z: c.entre(12, 16.4), ry: c.hasard() * 3 }, M.mat(), { crasse: false });
    jonchee(c, -2.5, 12, 3.5, 16.5, 30, [0xd9d2c0, 0xe8e2d2, 0x2f5a86], 0.07);
  }
}

// ---------- La forge ----------

function forge(ctx, niveau) {
  const { b, c, u } = ctx;
  const F = FORGE;
  const fin = niveau === "fin";
  const brique = M.brique();
  const CUT = 1.0;
  const EP = 0.4;
  c.pave(F.x0 + 0.2, -0.02, F.z0 + 0.2, F.x1 - 0.2, 0.06, F.z1 - 0.2, 0x5f5a52, M.mat(), { crasse: false, nuance: 0.03 });
  const m = { ep: EP, couleur: C.brique, mat: brique, batiment: b };
  mur(c, [F.x0, F.z1], [F.x1, F.z1], { ...m, h: CUT, ouvertures: [{ u: 3.6, l: 1.2, bas: 0, haut: 3, type: "vide" }] });
  mur(c, [F.x1, F.z1], [F.x1, F.z0], { ...m, h: CUT });
  mur(c, [F.x1, F.z0], [F.x0, F.z0], { ...m, h: F.h, ouvertures: [{ u: 6.5, l: 1.6, bas: 2.4, haut: 3.6, type: "vide" }, { u: 9.5, l: 1.6, bas: 2.4, haut: 3.6, type: "vide" }] });
  mur(c, [F.x0, F.z0], [F.x0, F.z1], { ...m, h: F.h, ouvertures: [{ u: 4.5, l: 3.0, bas: 0, haut: 3.1, type: "vide" }] });
  // Le grand vantail tombé, l'autre ouvert
  c.boite(1.5, 0.07, 3.0, PALETTE.boisSombre, { x: F.x0 - 1.4, y: 0.1, z: 10.6, ry: 0.15 }, M.mat());
  c.repere({ x: F.x0 - 0.2, z: 13.0, ry: -1.9 }, () => c.boite(1.45, 3.0, 0.07, PALETTE.boisSombre, { x: -0.72, y: 1.5 }, M.mat()));
  // Ce qui s'efface
  const k = b.couche("forge : hauts murs, toit, cheminée", { x: (F.x0 + F.x1) / 2, z: (F.z0 + F.z1) / 2, l: F.x1 - F.x0 + 1, p: F.z1 - F.z0 + 1 }, CUT, 15);
  const mh = { ep: EP, couleur: C.brique, mat: brique };
  mur(k, [F.x0, F.z1], [F.x1, F.z1], { ...mh, y0: CUT, h: F.h - CUT, ouvertures: [{ u: 3.6, l: 1.2, bas: 0, haut: 2.0, type: "vide" }, { u: 7.4, l: 1.6, bas: 0.4, haut: 2.6, type: "vide" }, { u: 10.2, l: 1.6, bas: 0.4, haut: 2.6, type: "vide" }] });
  mur(k, [F.x1, F.z1], [F.x1, F.z0], { ...mh, y0: CUT, h: F.h - CUT, ouvertures: [{ u: 3, l: 1.6, bas: 0.4, haut: 2.6, type: "vide" }, { u: 6.2, l: 1.6, bas: 0.4, haut: 2.6, type: "vide" }] });
  const rS = repereMur([F.x0, F.z1], [F.x1, F.z1]);
  k.repere({ x: rS.x, z: rS.z, ry: rS.ry }, () => {
    for (const uu of [7.4, 10.2]) baie(k, uu, CUT + 0.4, CUT + 1.8, 1.6, EP, u);
  });
  const rE = repereMur([F.x1, F.z1], [F.x1, F.z0]);
  k.repere({ x: rE.x, z: rE.z, ry: rE.ry }, () => {
    for (const uu of [3, 6.2]) baie(k, uu, CUT + 0.4, CUT + 1.8, 1.6, EP, u);
  });
  k.pave(F.x0 - 0.2, F.h - 0.3, F.z1 - 0.2, F.x1 + 0.2, F.h, F.z1 + 0.3, C.briqueSombre, brique);
  panneau(k, "forge", 13.6, CUT + 2.6, F.z1 + 0.22, 2.2, 0.82);
  pignon(k, F.x0, F.z0, F.z1, F.h, F.h + 2.4, EP, C.brique, brique);
  pignon(k, F.x1, F.z0, F.z1, F.h, F.h + 2.4, EP, C.brique, brique);
  toitDeuxPans(k, (F.x0 + F.x1) / 2, (F.z0 + F.z1) / 2, F.x1 - F.x0, F.z1 - F.z0, F.h, 2.4, { mat: M.ondulee(), couleur: C.rouille, debord: 0.35, trous: u > 0.5 ? [{ u: -3, v: 1, l: 2.2, p: 0.5 }] : [], charpente: C.boisSombre });
  // La cheminée de la forge
  const xc = 19.5;
  const zc = F.z0 + 0.75;
  c.pave(xc - 0.55, 0, zc - 0.55, xc + 0.55, 0.25, zc + 0.55, C.briqueSombre, brique);
  c.pave(xc - 0.3, 3.2, zc - 0.3, xc + 0.3, F.h, zc + 0.3, C.brique, brique);
  k.pave(xc - 0.55, F.h, zc - 0.55, xc + 0.55, 13.0, zc + 0.55, C.brique, brique);
  k.pave(xc - 0.68, 12.6, zc - 0.68, xc + 0.68, 13.2, zc + 0.68, C.briqueSombre, brique);
  // Le foyer de forge, la hotte, le soufflet, les braises rallumées
  c.pave(18.6, 0, F.z0 + 0.2, 20.4, 0.85, F.z0 + 1.4, C.briqueSombre, brique);
  c.pave(18.9, 0.85, F.z0 + 0.45, 20.1, 0.92, F.z0 + 1.2, C.suie, M.mat(), { crasse: false });
  for (let i = 0; i < 8; i++) c.boite(0.13, 0.08, 0.11, i % 3 ? 0xff7a2a : 0xd2451c, { x: 19.5 + c.entre(-0.45, 0.45), y: 0.95, z: F.z0 + 0.8 + c.entre(-0.25, 0.25), ry: c.hasard() * 3 }, M.mat(), { crasse: false });
  {
    const g = new THREE.CylinderGeometry(0.35, 1.05, 1.2, 4, 1, true);
    c.poser(g, M.tole(), C.suie, { x: 19.5, y: 2.6, z: F.z0 + 0.85, ry: PI / 4 });
    g.dispose();
  }
  c.repere({ x: 21.1, z: F.z0 + 0.9, ry: 0 }, () => {
    c.boite(0.6, 0.35, 0.9, 0x5a3a28, { y: 0.9, rx: 0.15 }, M.mat());
    c.boite(0.62, 0.05, 0.95, C.bois, { y: 1.1, rx: 0.3 }, M.mat());
    c.pave(-0.05, 0, -0.05, 0.05, 0.72, 0.05, C.boisSombre, M.mat());
  });
  obstacleRect(b, 18.6, F.z0 + 0.2, 21.4, F.z0 + 1.4, "foyer de forge");
  b.lumiere(19.5, 1.3, F.z0 + 1.7, 0xff9040, 10, 12, "forge rallumée par les Charbonniers");
  // L'enclume sur son billot, le seau de trempe, les pinces
  cylY(c, 17.6, 10.4, 0, 0.55, 0.36, 0.33, PALETTE.boisSombre, M.mat(), 8);
  c.repere({ x: 17.6, z: 10.4, ry: 0.3 }, () => {
    c.boite(0.45, 0.12, 0.3, 0x2f3130, { y: 0.61 }, M.metal());
    c.boite(0.22, 0.2, 0.18, 0x2f3130, { y: 0.77 }, M.metal());
    c.boite(0.62, 0.14, 0.24, 0x2f3130, { y: 0.93 }, M.metal());
    const g = new THREE.ConeGeometry(0.1, 0.38, 6);
    c.poser(g, M.metal(), 0x2f3130, { x: 0.48, y: 0.93, rz: -PI / 2 });
    g.dispose();
    c.boite(0.3, 0.05, 0.05, PALETTE.bois, { x: 0.05, y: 1.03, z: 0.05, ry: 0.4 }, M.mat()); // le marteau
    c.boite(0.08, 0.08, 0.12, 0x2f3130, { x: 0.18, y: 1.05, z: 0.12, ry: 0.4 }, M.metal());
  });
  obstacleRect(b, 17.2, 10.0, 18.0, 10.8, "enclume");
  baril(c, 20.9, 9.8, 0x4a5a58);
  c.boite(0.5, 0.01, 0.5, 0x3c4a44, { x: 20.9, y: 0.88, z: 9.8 }, M.mat(), { crasse: false });
  // Le marteau-pilon
  c.repere({ x: 13.2, z: 9.6 }, () => {
    c.pave(-0.8, 0, -0.6, 0.8, 0.4, 0.6, 0x2f3130, M.tole());
    for (const s of [-1, 1]) c.pave(s * 0.6 - 0.15, 0.4, -0.25, s * 0.6 + 0.15, 3.4, 0.25, C.machine, M.tole());
    c.pave(-0.8, 3.2, -0.35, 0.8, 3.6, 0.35, C.machine, M.tole());
    cylY(c, 0, 0, 3.6, 4.3, 0.32, 0.32, C.machineFonce, M.tole(), 8);
    c.pave(-0.3, 1.3, -0.22, 0.3, 2.0, 0.22, 0x2f3130, M.metal()); // la masse, restée en haut
    c.pave(-0.3, 0.4, -0.25, 0.3, 0.8, 0.25, 0x2f3130, M.metal()); // la chabotte
    c.tube([0, 2.0, 0], [0, 3.2, 0], 0.07, C.acier, M.metal(), 6);
  });
  obstacleRect(b, 12.4, 9.0, 14.0, 10.2, "marteau-pilon");
  if (fin) {
    // L'établi et le panneau d'outils (mur ouest)
    c.pave(F.x0 + 0.25, 0.85, 7.6, F.x0 + 1.0, 0.95, 9.8, C.boisSombre, M.mat());
    for (const z of [7.7, 9.7]) c.pave(F.x0 + 0.3, 0, z - 0.04, F.x0 + 0.95, 0.85, z + 0.04, C.boisSombre, M.mat());
    c.boite(0.3, 0.22, 0.2, 0x3b4a44, { x: F.x0 + 0.7, y: 1.07, z: 8.0 }, M.tole());
    c.pave(F.x0 + 0.22, 1.3, 7.5, F.x0 + 0.27, 2.7, 9.9, 0x6f6a5c, M.mat());
    for (let i = 0; i < 10; i++) c.boite(0.04, c.entre(0.25, 0.55), 0.07, 0x2c2e2c, { x: F.x0 + 0.3, y: c.entre(1.6, 2.3), z: 7.7 + i * 0.22, rx: c.entre(-0.3, 0.3) }, M.metal());
    obstacleRect(b, F.x0 + 0.25, 7.6, F.x0 + 1.0, 9.8, "établi");
    panneau(c, "feu", F.x0 + 0.23, 3.4, 13.4, 3.6, 0.9, PI / 2);
    // Les pinces et les tisonniers contre le foyer
    for (let i = 0; i < 5; i++) c.poutre([18.4 - i * 0.08, 0.05, F.z0 + 1.5], [18.5 - i * 0.08, 1.1, F.z0 + 1.35], 0.025, 0x2c2e2c, M.metal());
    // La meule
    c.pave(14.2, 0, 14.6, 14.8, 0.8, 15.2, C.machineFonce, M.tole());
    cylZ(c, 14.7, 15.1, 14.5, 1.1, 0.35, 0xb8b0a0, M.mat(), 10);
    // Le tas de charbon, les sacs
    gravats(c, 20.8, 14.6, 1.1, 16, [C.charbon, 0x3a3734, 0x1e1d1c]);
    for (const [x, z] of [[19.4, 15.2], [19.0, 14.6]]) c.boite(0.5, 0.6, 0.35, 0x4a4038, { x, y: 0.3, z, ry: c.hasard() }, M.mat());
    // Le coin des Charbonniers : couchages, une table faite d'un touret de câble
    c.boite(0.8, 0.14, 1.9, 0x5a4a38, { x: 11.2, y: 0.13, z: 14.7, ry: 0.1 }, M.mat());
    c.boite(0.8, 0.14, 1.9, 0x6a5440, { x: 12.2, y: 0.13, z: 14.8, ry: -0.05 }, M.mat());
    cylZ(c, 12.4, 12.8, 14.6, 0.75, 0.75, C.bois, M.mat(), 10);
    c.repere({ x: 15.6, z: 12.6 }, () => {
      cylY(c, 0, 0, 0, 0.75, 0.7, 0.7, C.bois, M.mat(), 10);
      cylY(c, 0, 0, 0.1, 0.65, 0.25, 0.25, C.boisSombre, M.mat(), 8);
    });
    obstacleRect(b, 14.9, 11.9, 16.3, 13.3, "touret de câble");
    jonchee(c, 10.5, 7.5, 21.5, 15.5, 20, [0x3a3734, 0x7d6143, 0x9c7a45], 0.07);
  }
  // La pile de rails et les essieux, dehors, contre le pignon ouest
  for (let i = 0; i < (fin ? 9 : 5); i++) c.boite(4.2, 0.12, 0.1, C.rail, { x: 8.2 + c.entre(-0.1, 0.1), y: 0.08 + Math.floor(i / 3) * 0.13, z: 12.6 + (i % 3) * 0.3, ry: c.entre(-0.03, 0.03) }, M.metal());
  for (const [x, z] of [[7.4, 15.0], [8.6, 15.4]]) {
    cylZ(c, z - 0.32, z + 0.32, x, 0.17, 0.04, C.acier, M.metal(), 5);
    for (const s of [-1, 1]) cylZ(c, z + s * 0.3 - 0.04, z + s * 0.3 + 0.04, x, 0.17, 0.17, 0x3a3532, M.tole(), 8);
  }
  obstacleRect(b, 6.1, 12.4, 10.3, 13.4, "pile de rails");
}

// ---------- La cour : la voie, les wagonnets, le drone, la molette tombée, le portail, le panneau ----------

function cour(ctx, niveau) {
  const { b, c, u } = ctx;
  const fin = niveau === "fin";
  // La voie étroite
  voie(ctx, [-38, -6], [-2.6, -6], { manque: 0.1 + 0.15 * u });
  voie(ctx, [GAL.x, -30], [GAL.x, -6.6], { manque: 0.1 + 0.15 * u });
  // Les wagonnets : un train de trois sur la voie de la galerie, deux renversés, un sous les trémies
  for (const z of [-20.2, -18.6, -17.0]) wagonnet(c, GAL.x, z, PI / 2, "debout", z > -20);
  wagonnet(c, -10.5, -14.6, 0.5, "cote", true);
  gravats(c, -11.2, -13.8, 0.9, 10, [0x7a5a48, 0x6a4a3a, C.charbon]);
  wagonnet(c, -13.6, 0.6, 1.3, "renverse");
  gravats(c, -14.4, 1.4, 0.8, 8, [C.charbon, 0x3a3734]);
  wagonnet(c, -19.5, -6, 0, "debout", true);
  wagonnet(c, -30, -6, 0, "debout", false);
  // La pile de rails et de traverses
  for (let i = 0; i < 8; i++) c.boite(5, 0.12, 0.1, C.rail, { x: -28.5, y: 0.08 + Math.floor(i / 4) * 0.13, z: -11 + (i % 4) * 0.3, ry: c.entre(-0.03, 0.03) }, M.metal());
  for (let i = 0; i < 6; i++) c.boite(1.2, 0.14, 0.18, C.boisSombre, { x: -28.5 + c.entre(-0.2, 0.2), y: 0.08 + i * 0.15, z: -9.2, ry: PI / 2 + c.entre(-0.1, 0.1) }, M.mat());
  obstacleRect(b, -31.1, -11.2, -25.9, -8.6, "pile de rails");

  // La molette tombée, adossée au massif d'une jambe de force
  molette(c, { x: 7.6, y: 2.35, z: -13.4, ry: 0.5, rx: -0.32 });
  gravats(c, 7.6, -12.4, 1.0, 10, [C.betonSombre, C.pierre, 0x7a5a48]);
  b.obstacle(5.6, -12.5, 9.6, -14.3, "molette tombée");
  // La chute de câbles : le câble cassé pend du pignon et s'enroule dans la cour
  {
    const yc = hauteurCable(MACH.x0);
    tuyau(c, [[MACH.x0 - 0.1, yc, BOB.z2], [14.8, 9.8, -5.3], [13.6, 5.2, -4.8], [12.4, 1.4, -4.3], [11.2, 0.12, -4.4]], 0.05, C.cable, M.metal(), 4, false);
    for (let i = 0; i < 7; i++) {
      const g = new THREE.TorusGeometry(1.3 - (i % 3) * 0.2, 0.06, 4, 14);
      c.poser(g, M.metal(), C.cable, { x: 9.8 + c.entre(-0.2, 0.2), y: 0.08 + i * 0.1, z: -4.4 + c.entre(-0.2, 0.2), rx: PI / 2 + c.entre(-0.12, 0.12), rz: c.entre(-0.1, 0.1) });
      g.dispose();
    }
    obstacleRect(b, 8.4, -5.8, 11.2, -3.0, "chute de câbles");
  }
  // Le drone-inspecteur de sécurité écrasé
  c.repere({ x: 7, z: 1.4, ry: 0.7 }, () => {
    c.repere({ y: 0.2, rz: 0.25, rx: -0.1 }, () => {
      c.boite(0.7, 0.22, 0.7, 0xe6e4dc, {}, M.tole());
      panneau(c, "drone", 0, 0.115, 0, 0.66, 0.33, 0, -PI / 2);
      for (const [a, casse] of [[0.785, false], [2.356, true], [3.927, false], [5.498, false]]) {
        const fin2 = casse ? 0.55 : 1.0;
        c.poutre([0, 0, 0], [Math.cos(a) * fin2, 0, Math.sin(a) * fin2], 0.06, 0x3a3a38, M.tole());
        if (casse) continue;
        cylY(c, Math.cos(a), Math.sin(a), -0.05, 0.1, 0.07, 0.07, 0x3a3a38, M.tole(), 6);
        c.boite(0.6, 0.01, 0.06, 0x2a2a2a, { x: Math.cos(a), y: 0.12, z: Math.sin(a), ry: a * 2 }, M.mat(), { crasse: false });
      }
      c.boite(0.05, 0.04, 0.05, 0xff3a2a, { x: 0.36, y: 0.02 }, M.mat(), { crasse: false });
    });
    c.boite(0.6, 0.01, 0.06, 0x2a2a2a, { x: 1.4, y: 0.03, z: 0.6, ry: 0.4 }, M.mat(), { crasse: false }); // l'hélice arrachée
    c.boite(0.3, 0.06, 0.06, 0x3a3a38, { x: 1.1, y: 0.04, z: -0.5, ry: 1.2 }, M.tole());
  });
  debris(c, 6, 0.4, 8.2, 2.4, 10, [0xe6e4dc, 0x3a3a38, C.schiste], 0.04);
  if (fin) b.lumiere(7.3, 0.5, 1.4, 0xff3a2a, 1.2, 3, "diode rouge du drone-inspecteur (« Danger détecté »)");
  // Le panneau « Zone surveillée par drone » et sa borne de recharge morte
  for (const x of [3.6, 5.8]) c.tube([x, 0, -1.4], [x, 2.5, -1.4], 0.04, C.acier, M.tole(), 5);
  panneau(c, "surveille", 4.7, 2.0, -1.36, 2.4, 0.45);
  c.pave(5.9, 0, -0.4, 6.3, 1.4, -0.0, 0xd8dcd6, M.tole());
  c.pave(5.6, 1.4, -0.7, 6.6, 1.46, 0.3, 0xd8dcd6, M.tole());
  // Le feu des Charbonniers, au pied du chevalement
  brasero(ctx, -3.6, 1.6);

  // Le portail du carreau (à l'est), les murs d'enceinte
  const xp = 36;
  for (const z of [-1.2, 6.8]) {
    c.pave(xp - 0.45, 0, z - 0.45, xp + 0.45, 3.0, z + 0.45, C.brique, M.brique());
    c.pave(xp - 0.55, 3.0, z - 0.55, xp + 0.55, 3.2, z + 0.55, C.pierre, M.beton());
    const g = new THREE.IcosahedronGeometry(0.32, 0);
    c.poser(g, M.beton(), C.pierre, { x: xp, y: 3.45, z });
    g.dispose();
  }
  c.repere({ x: xp, z: -0.75, ry: -0.9 }, () => {
    for (let i = 0; i < 9; i++) c.pave(0.2 + i * 0.4, 0.1, -0.02, 0.24 + i * 0.4, 2.2, 0.02, C.grille, M.tole());
    for (const y of [0.2, 1.1, 2.1]) c.pave(0.1, y, -0.03, 3.6, y + 0.08, 0.03, C.grille, M.tole());
  });
  c.repere({ x: xp + 1.5, y: 0.08, z: 4.5, ry: 0.2 }, () => {
    for (let i = 0; i < 9; i++) c.pave(-1.8 + i * 0.4, -0.02, -1.1, -1.76 + i * 0.4, 0.02, 1.1, C.grille, M.tole());
    for (const z of [-1, 0, 1]) c.pave(-1.9, -0.03, z - 0.04, 1.8, 0.03, z + 0.04, C.grille, M.tole());
  });
  for (const [z1, z2] of [[-24, -1.65], [7.25, 17.5]]) {
    const breche = z1 < 0 && u > 0.4 ? [{ u: 9, l: 3.5, profondeur: 1.6 }] : [];
    mur(c, [xp, z1], [xp, z2], { h: 2.0, ep: 0.35, couleur: C.brique, mat: M.brique(), batiment: b, breches: breche });
  }
  // Le grand panneau « Charbon 100 % vert, extrait avec bienveillance »
  c.repere({ x: 31, z: 12.5, ry: 0.55 }, () => {
    for (const x of [-2.6, 2.6]) {
      c.poutre([x, 0, 0], [x, 5.2, 0], 0.22, C.acier, M.tole());
      c.poutre([x, 0, -1.2], [x, 3.0, 0], 0.12, C.acier, M.tole());
      c.pave(x - 0.4, 0, -0.4, x + 0.4, 0.3, 0.4, C.betonSombre, M.beton());
    }
    c.pave(-3.75, 2.45, -0.1, 3.75, 5.0, -0.02, 0x6f6a60, M.tole());
    panneau(c, "charbonVert", 0, 3.72, 0.0, 7.4, 2.31);
    c.pave(-3.7, 2.3, 0, 3.7, 2.38, 0.6, C.grille, M.tole()); // la passerelle d'affichage
    // Une lettre tombée au pied
    c.boite(1.2, 0.06, 0.9, 0xe6efc8, { x: 1.2, y: 0.06, z: 1.4, ry: 0.4 }, M.tole());
  });
  b.obstacle(28.4, 11.0, 33.6, 14.0, "pieds du panneau");

  // La végétation de la cour
  const arbres = [[-34, 12, 7], [-30, 18, 6], [-37, 4, 8], [26, -22, 7], [34, -18, 6], [12, 21, 5.5], [-15, 22, 6.5], [30, 22, 7], [-2, 20, 5], [38, 12, 6]];
  for (const [x, z, h] of arbres) {
    arbre(c, x, z, h * (0.75 + 0.35 * u), c.hasard() < 0.8 ? "bouleau" : "feuillu");
    if (c.hasard() < 0.5) arbuste(c, x + c.entre(-1.5, 1.5), z + c.entre(-1.5, 1.5), c.entre(0.8, 1.4));
  }
  if (u > 0.4) {
    arbre(c, 4.6, -10.6, 4.2, "bouleau"); // un bouleau pousse au pied du chevalement
    arbre(c, -23.5, -1.0, 3.8, "bouleau");
  }
  for (const [x, z] of [[14.6, -16.6], [-24, 4], [9, 5], [33, -6], [-5, -12], [26, 8], [-35, -12]]) arbuste(c, x, z, c.entre(0.8, 1.5));
  for (const [x, z, r] of [[2, 6.8, 1.6], [-14, -18, 1.4], [24, 4, 1.1], [-26, -2, 1.2]]) flaque(c, x, z, r, 0.045);
  if (fin) semerTouffes(c, -38, -24, 38, 22, Math.round(40 + 60 * u), PALETTE.herbeSeche, 0.03);
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

export function creer({ usure = 0.7, carte = "carreau" } = {}) {
  const def = CARTES.find((k) => k.id === carte) ?? CARTES[0];
  const o = ORIGINES[def.id];
  const b = new Batiment(1907, usure);
  const ctx = { b, c: b.c, u: usure };
  const lot = [o.x - def.lot.l / 2, o.z - def.lot.p / 2, o.x + def.lot.l / 2, o.z + def.lot.p / 2];
  sol(ctx, ...lot);
  if (def.id === "carreau") {
    chevalement(ctx, "fin");
    machines(ctx, "fin");
    criblage(ctx, "fin");
    montagne(ctx);
    terril(ctx, 1);
    bains(ctx, "moyen");
    forge(ctx, "moyen");
    cour(ctx, "fin");
  } else {
    chevalement(ctx, "moyen");
    machines(ctx, "fond");
    criblage(ctx, "moyen");
    terril(ctx, 0.6);
    bains(ctx, "fin");
    forge(ctx, "fin");
    cour(ctx, "moyen");
  }
  return recentrer(b.construire(), o, def.lot);
}
