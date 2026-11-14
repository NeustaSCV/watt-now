// Halte : l'aire d'autoroute (route de la Zone industrielle, Book 20 §4).
//
// Une aire de repos ordinaire, celle de tous les départs en vacances, figée depuis la Grande Panne : bloc sanitaire en
// béton, tables de pique-nique sous les platanes, aire de jeux rouillée, camping-cars en épi, parking des poids lourds,
// passerelle piétonne au-dessus de l'autoroute. Le camion-citerne couché sous la passerelle ferme l'autoroute : tout le
// monde passe par l'aire.
//
// Format halte (CONSIGNE-HALTES.md) : 200 × 70 m, quatre tronçons de 50 × 70 m mis bout à bout d'ouest en est. Tout est
// bâti dans le « repère de la halte » (origine au centre, +x à l'est, +z au sud), puis chaque tronçon ne garde que ce
// qui tombe dans sa bande de x et se recentre sur son lot (voir `recentrer`). Les éléments longs (chaussées, talus,
// glissières, grillages, marquages) sont découpés exactement aux limites des tronçons : les raccords sont invisibles.
//
// Plan en travers (z, du nord au sud) :
//   −35 … −31   talus boisé nord, grillage au pied
//   −30,5 … −21 chaussée nord (vers l'ouest), bande d'arrêt d'urgence
//   −21 … −18   terre-plein central, glissière en béton
//   −18 … −8,5  chaussée sud (vers l'est), bande d'arrêt d'urgence
//   −7,2        grillage entre l'autoroute et l'aire
//   −2 … 5      la bretelle qui traverse l'aire (le chemin du joueur)
//   5 … 30      l'aire : parkings, sanitaires, pique-nique, jeux, camping-cars, poids lourds
//   30 … 35     talus boisé sud, grillage au pied

import * as THREE from "three";
import { Batiment, Chantier, PALETTE, matiere, matiereMonde, matiereTexture, matiereVerre, matiereLueur, dessiner, aleatoire, taches, mur, touffes, semerTouffes, gravats, debris, jonchee, mousse, arbuste, arbre, raiDeLumiere, flaque } from "../commun/atelier.js";

// ---------- Le plan de la halte (repère de la halte) ----------

const ZN = { talus: -31.2, bau: -30.5, chaussee1: -21, tpc: -19.5, chaussee2: -18, rive: -11, bauSud: -8.5, grillage: -7.2 };
const ALLEE = { z1: -2, z2: 5, xFin: 62 }; // la bretelle droite dans l'aire
const BRETELLE = { xDebut: 88 }; // au-delà de |x| = 88, la bretelle longe l'autoroute
const PASSERELLE = { x: 25, y: 6.1, z1: -33.5, z2: 10.2 };
const SANI = { x0: -35, x1: -19, z0: 13.5, z1: 22.5, h: 3.0 };
const CC = { x: 10.6, z: 15.5 }; // le camping-car qu'on visite (axe le long de x, avant vers l'est)
const BRECHE = { x1: -61, x2: -56.5 }; // le grillage couché par une voiture, à l'entrée de l'aire

const TRONCONS = [
  { id: "entree", nom: "L'entrée de l'aire", x: -75 },
  { id: "sanitaires", nom: "Sanitaires et pique-nique", x: -25 },
  { id: "passerelle", nom: "La passerelle", x: 25 },
  { id: "poids-lourds", nom: "Les poids lourds et la sortie", x: 75 },
];

/** Le centre de la bretelle et sa demi-largeur, en fonction de x (entrée à l'ouest, sortie à l'est, symétriques). */
function lisse(t) {
  t = Math.min(1, Math.max(0, t));
  return t * t * (3 - 2 * t);
}
function bretelle(x) {
  const ax = Math.abs(x);
  if (ax <= ALLEE.xFin) return { z: (ALLEE.z1 + ALLEE.z2) / 2, d: (ALLEE.z2 - ALLEE.z1) / 2 };
  const s = lisse((BRETELLE.xDebut - ax) / (BRETELLE.xDebut - ALLEE.xFin));
  return { z: -8 + 9.5 * s, d: 2 + 1.5 * s };
}

const arr = (v) => Math.round(v * 10) / 10;

// ---------- La fiche ----------

const FOUILLE = [
  // L'entrée
  { x: -66, z: 3.6, quoi: "bouchon de l'entrée : coffres des voitures (couvertures, bouteilles d'eau, trousse de secours)" },
  { x: -58.8, z: -6.4, quoi: "la voiture dans le grillage : batterie, alternateur, câbles" },
  { x: -73, z: 10.4, quoi: "point d'information : la carte de la région, sous plexiglas (à décoller)" },
  { x: -69.5, z: 7.5, quoi: "poubelles renversées : canettes en aluminium, sacs plastique" },
  { x: -92, z: 27.4, quoi: "au bout du sentier : sac de randonnée (gourde, couteau, briquet), champignons" },
  { x: -86, z: -13.2, quoi: "break sur l'autoroute : coffre de toit (vêtements, duvets)" },
  // Les sanitaires et le pique-nique
  { x: -20.1, z: 21, quoi: "local technique : tuyaux de cuivre, chauffe-eau, clés, produits ménagers" },
  { x: -32.5, z: 21.9, quoi: "lavabos des hommes : savon, papier, miroir" },
  { x: -18.0, z: 15.6, quoi: "distributeurs éventrés : quelques barres et canettes oubliées, monnaie inutile" },
  { x: -15.6, z: 15.2, quoi: "toilettes autonettoyantes : petit panneau solaire, circuits, pompe" },
  { x: -16.9, z: 11.4, quoi: "borne « Pause bien-être » : écran, haut-parleur, batterie" },
  { x: -6, z: 17.8, quoi: "camp sous l'abri : réserve de bois, couverture, popote" },
  { x: -44.6, z: 25.4, quoi: "aire de jeux : chaînes de la balançoire, tubes d'acier" },
  { x: -41.5, z: 8.6, quoi: "voiture du parking : peluche sur la plage arrière, boîte à gants (cartes routières)" },
  // La passerelle
  { x: 12.6, z: 15.4, quoi: "camping-car : placards (conserves, café), réchaud à gaz, batterie auxiliaire" },
  { x: 11.2, z: 17.6, quoi: "valises ouvertes : vêtements, trousse de toilette, crème solaire" },
  { x: 8.6, z: 15.4, quoi: "panneau solaire sur le toit du camping-car (à démonter, échelle arrière)" },
  { x: 21.5, z: -10.5, quoi: "camion-citerne couché : fond de gazole dans la cuve, ressorts à lames" },
  { x: 9.5, z: -22.8, quoi: "carambolage contre la citerne : ferraille, batteries" },
  { x: 25, z: 3.2, quoi: "barricade des pillards : palettes, pneus, caddies (bois, ferraille)" },
  // Les poids lourds
  { x: 71.2, z: 22.2, quoi: "remorque frigorifique ouverte : conserves… ou cartons de yaourts gonflés" },
  { x: 60.8, z: 12.2, quoi: "cabine du camion frigorifique : thermos, carte routière, couverture" },
  { x: 80.5, z: 13.2, quoi: "camion à la cabine basculée : moteur à nu, alternateur, batteries 24 V" },
  { x: 86, z: 21.5, quoi: "remorque bâchée : bâche, sangles, ressorts à lames" },
  { x: 70, z: -14.6, quoi: "voiture et caravane sur l'autoroute : bonbonne de gaz, auvent en toile" },
];
const ETEINTS = [
  { x: -60.5, z: 2.6, type: "errant (entre les voitures du bouchon)" },
  { x: -67.5, z: -0.6, type: "rampant (sous une voiture du bouchon)" },
  { x: -87, z: 21, type: "errant (dans le bois du sentier)" },
  { x: -32.5, z: 17.5, type: "ancien habitant : agent d'entretien en blouse (toilettes des hommes)" },
  { x: -44, z: 21.5, type: "errant (aire de jeux)" },
  { x: -28, z: 8, type: "errant (parking)" },
  { x: 9.2, z: 15.4, type: "ancien habitant : vacancier en chemise à fleurs (dans le camping-car)" },
  { x: 15.5, z: -14, type: "errant (contre la citerne)" },
  { x: 40, z: 21.5, type: "errant (entre les camping-cars)" },
  { x: 61.5, z: 14.5, type: "ancien habitant : chauffeur routier (au pied de sa cabine)" },
  { x: 76, z: 15.5, type: "rampant (sous la remorque frigorifique)" },
  { x: 88, z: 25, type: "errant (fond du parking)" },
];
const ENTREES = [
  { x: -99.5, z: -8, nature: "entrée A : l'autoroute, depuis le Comptoir" },
  { x: -64, z: 3.8, nature: "l'entrée de l'aire, entre les voitures du bouchon (passage de 2 m)" },
  { x: -58.8, z: -7.2, nature: "le grillage couché par une voiture (de l'autoroute vers l'aire)" },
  { x: -74.5, z: 12.5, nature: "le sentier « découverte du terroir »" },
  { x: -27, z: 13.5, nature: "sanitaires : le hall, côté parking" },
  { x: -27, z: 22.5, nature: "sanitaires : le hall, côté pique-nique" },
  { x: -23, z: 22.5, nature: "sanitaires : la cabine pour handicapés (la porte bat)" },
  { x: -18.9, z: 21.1, nature: "sanitaires : le local technique (porte forcée)" },
  { x: 10.6, z: 16.7, nature: "le camping-car : porte et paroi déchirée" },
  { x: 25, z: 1.5, nature: "sous la passerelle : la chicane des pillards" },
  { x: 71.4, z: 22.4, nature: "la remorque frigorifique, portes ouvertes" },
  { x: 99.5, z: -8, nature: "sortie B : l'autoroute, vers la Zone industrielle" },
];

const dansTroncon = (t) => (p) => p.x >= t.x - 25 && (p.x < t.x + 25 || (t.x === 75 && p.x <= 100));
const versTroncon = (t, liste) => liste.filter(dansTroncon(t)).map((p) => ({ ...p, x: arr(p.x - t.x), z: arr(p.z) }));

const DESCRIPTIONS = {
  entree: "la bretelle d'entrée et son bouchon de voitures, le point d'information, le sentier du terroir qui s'enfonce dans le bois",
  sanitaires: "le bloc sanitaire en béton (toilettes, lavabos, cabine pour handicapés, local technique), les distributeurs, le pique-nique sous l'abri, l'aire de jeux",
  passerelle: "la passerelle au-dessus de l'autoroute, le camion-citerne couché, la chicane des pillards, les camping-cars en épi (on visite l'un d'eux)",
  "poids-lourds": "le parking des poids lourds (remorque frigorifique ouverte), la bretelle de sortie",
};
const DEPARTS = { entree: { x: -96, z: -8 }, sanitaires: { x: -49, z: 1.5 }, passerelle: { x: 1, z: 1.5 }, "poids-lourds": { x: 51, z: 1.5 } };

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
  id: "halte-aire-autoroute",
  nom: "Halte · L'aire d'autoroute",
  lieu: "Halte · route de la Zone industrielle · entre le moyen et le lointain",
  environnement: "zone industrielle",
  anneau: "moyen",
  danger: 2,
  halte: true,
  solPropre: true,
  recit:
    "L'aire du Val-Fleuri a vu passer cinquante ans de départs en vacances : la pause pipi, le sandwich triangle, le chien qu'on promène sur trois mètres de gazon. Le jour de la Grande Panne, les voitures se sont arrêtées toutes en même temps, et le panneau qui calculait la fatigue de chacun n'a plus jamais conseillé de repartir. Depuis qu'une citerne s'est couchée sous la passerelle, tout le monde passe par l'aire, et certains y font payer le passage.",
  inspiration: "les aires de repos des autoroutes françaises (bloc sanitaire en béton des années 1980, tables en béton, passerelle grillagée), les photos d'autoroutes figées après une évacuation",
  reperes: [
    "La passerelle grillagée qui enjambe l'autoroute, son escalier effondré, et le camion-citerne couché dessous qui ferme les quatre voies",
    "La chicane des pillards sous la passerelle : palettes, pneus, caddies, et la pancarte « Passage : 1 conserve »",
    "Le bouchon figé à l'entrée de l'aire, une voiture couchée dans le grillage",
    "Le bloc sanitaire en béton : toilettes hommes et femmes, lavabos, sèche-mains, cabine pour handicapés dont la porte bat au vent, local technique",
    "Les distributeurs éventrés, la borne « Pause bien-être connectée : respirez 3 minutes » et les toilettes « à nettoyage autonome » payables par appli",
    "Le portique lumineux qui affiche encore « Votre prochaine pause dans 2 h 14 selon votre fatigue détectée »",
    "Le camping-car de la fête de départ : ballons dégonflés, banderole, valises ouvertes, lanterne allumée dedans",
    "Le chien en peluche sur la plage arrière d'une voiture du parking",
    "Le parking des poids lourds et la remorque frigorifique ouverte (conserves ou pas)",
    "Les tables en béton sous les platanes, le feu des survivants sous l'abri, l'aire de jeux rouillée",
    "Le point d'information et sa carte de la région, le sentier « découverte du terroir » qui s'enfonce dans le bois",
    "La nuit : le feu sous l'abri, le néon des toilettes qui grésille sur son panneau solaire, la lanterne du camping-car, le portique",
  ],
  lot: { l: 200, p: 70 },
  depart: DEPARTS.entree,
  goulets: [
    { x: -64, z: 3, nature: "l'entrée de l'aire, encombrée de voitures : un passage de deux mètres entre les carrosseries" },
    { x: 25, z: 1.5, nature: "sous la passerelle : chicane des pillards entre la pile, la barricade et la voiture retournée ; l'autoroute est fermée par la citerne couchée" },
  ],
  panneaux: [
    { x: -95, z: -3.4, texte: "Aire du Val-Fleuri · ← Comptoir · 8 km" },
    { x: -82, z: -2.2, texte: "Aire du Val-Fleuri · 1 000 m · toilettes, pique-nique, jeux" },
    { x: 95, z: -3.4, texte: "Zone industrielle · Centrale · Aciérie →" },
  ],
  cartes: CARTES,
};

// ---------- Couleurs ----------

const C = {
  asphalte: 0x5b5d5e,
  asphalteVieux: 0x6d6e6b,
  allee: 0x66676a,
  herbe: 0x7d9a55,
  herbeSeche: 0x9aa262,
  talus: 0x6f8a4c,
  terre: 0x8f7352,
  blanc: 0xdedbd2,
  jauneMarquage: 0xc9a84a,
  beton: 0xc9c3b5,
  betonSombre: 0x9a958a,
  gba: 0xc4c0b6,
  acier: 0x8d9497,
  acierPeint: 0x6f8c86, // vert d'eau de la passerelle
  rouille: PALETTE.rouille,
  rouilleSombre: PALETTE.rouilleSombre,
  pneu: 0x2a2928,
  plastique: 0x3c3f42,
  carrelage: 0xf2eee4,
  faience: 0xd6e4dd,
  porte: 0x5f7f8c, // portes bleu-gris des sanitaires
  creme: 0xe4dfd2, // camping-cars
  bois: 0x7a5a3c,
  boisGris: 0x8a8274,
};
const TEINTES_VOITURES = [0x7d8f9c, 0x9b3b33, 0xc9c5ba, 0x4c5a6b, 0x6b7b56, 0x8a7a63, 0x2f3a45, 0xb7a06a, 0x5d6b73, 0x8f4a3c];

// ---------- Matières (créées une fois, partagées) ----------

const AL = 1024;
const AH = 1536;
/** L'atlas des panneaux, enseignes, affiches et grillages : [x, y, l, h] en pixels. */
const R = {
  panOuest: [0, 0, 512, 224],
  panEst: [512, 0, 512, 224],
  aire: [0, 224, 512, 288],
  pmv: [512, 224, 512, 128],
  terroir: [512, 352, 512, 160],
  carte: [0, 512, 512, 384],
  frigo: [512, 512, 512, 128],
  citerne: [512, 640, 512, 96],
  banderole: [512, 736, 512, 96],
  graffiti: [512, 832, 512, 64],
  boissons: [0, 896, 160, 320],
  snacks: [160, 896, 160, 320],
  bienEtre: [320, 896, 192, 320],
  wcAuto: [512, 896, 256, 192],
  pictos: [768, 896, 256, 96],
  toilettes: [768, 992, 256, 96],
  watty: [512, 1088, 192, 256],
  jeux: [704, 1088, 320, 128],
  cc: [704, 1216, 320, 64],
  peage: [704, 1280, 320, 64],
  grillage: [0, 1216, 256, 256],
  saviez: [256, 1216, 256, 192],
  notez: [512, 1344, 192, 192],
  frigoAv: [704, 1344, 320, 96],
};

let MATS = null;
function matieres() {
  if (MATS) return MATS;
  const atlas = dessiner("aire-atlas", AL, AH, dessinerAtlas, false);
  const asphalte = matiereTexture(dessiner("aire-asphalte", 256, 256, dessinerAsphalte), { roughness: 0.95 });
  asphalte.userData.tuile = 6;
  const terrain = matiereTexture(dessiner("aire-terrain", 256, 256, dessinerTerrain), { roughness: 1 });
  terrain.userData.tuile = 9;
  const enseignes = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.8, alphaTest: 0.5, side: THREE.DoubleSide });
  const neon = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 1.2, vertexColors: true, roughness: 0.5, alphaTest: 0.5, side: THREE.DoubleSide });
  neon.userData.sansOmbre = true;
  MATS = {
    asphalte,
    terrain,
    beton: matiereMonde("beton"),
    carrelage: matiereMonde("carrelage"),
    enseignes,
    neon,
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    mat: matiere(0.95, 0),
    satin: matiere(0.6, 0.05),
    lisse: matiere(0.3, 0.05),
    tole: matiere(0.75, 0.3),
    metal: matiere(0.4, 0.7),
    toile: (() => {
      const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true, side: THREE.DoubleSide });
      return m;
    })(),
    lueur: matiereLueur(0xffb25a, 0.5),
  };
  return MATS;
}

// ---------- Textures dessinées ----------

function texte(g, t, x, y, taille, couleur, police = "900", align = "center", largeurMax = 0) {
  g.save();
  g.font = `${police} ${taille}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  if (largeurMax) {
    const l = g.measureText(t).width;
    if (l > largeurMax) {
      taille = Math.floor((taille * largeurMax) / l);
      g.font = `${police} ${taille}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
    }
  }
  g.fillStyle = couleur;
  g.textAlign = align;
  g.textBaseline = "middle";
  g.fillText(t, x, y);
  g.restore();
}

function salir(g, a, x, y, l, h, force = 1) {
  g.save();
  g.beginPath();
  g.rect(x, y, l, h);
  g.clip();
  for (let i = 0; i < (l * h) / 200; i++) {
    g.fillStyle = a() < 0.5 ? `rgba(0,0,0,${0.06 * force})` : `rgba(255,255,255,${0.05 * force})`;
    g.fillRect(x + a() * l, y + a() * h, 1 + a() * 3, 1 + a() * 3);
  }
  for (let i = 0; i < 7 * force; i++) {
    const cx = x + a() * l;
    const lg = h * (0.3 + a() * 0.8);
    const d = g.createLinearGradient(0, y, 0, y + lg);
    d.addColorStop(0, `rgba(60,52,40,${0.25 * force})`);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(cx, y, 2 + a() * 6, lg);
  }
  taches(g, a, Math.round(4 * force), `rgba(70,60,45,${0.18 * force})`, 6, Math.min(l, h) * 0.3, l, h);
  g.restore();
}

function rond(g, x, y, r, couleur) {
  g.fillStyle = couleur;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}

/** Les pictogrammes des aires : WC, table, jeux, couverts (blanc sur bleu). */
function picto(g, nom, x, y, s, couleur = "#f2efe6") {
  g.save();
  g.fillStyle = couleur;
  g.strokeStyle = couleur;
  g.lineWidth = s * 0.08;
  if (nom === "wc") {
    rond(g, x - s * 0.22, y - s * 0.32, s * 0.09, couleur);
    g.fillRect(x - s * 0.3, y - s * 0.2, s * 0.16, s * 0.5);
    rond(g, x + s * 0.22, y - s * 0.32, s * 0.09, couleur);
    g.beginPath();
    g.moveTo(x + s * 0.22, y - s * 0.22);
    g.lineTo(x + s * 0.38, y + s * 0.12);
    g.lineTo(x + s * 0.06, y + s * 0.12);
    g.fill();
    g.fillRect(x + s * 0.15, y + s * 0.1, s * 0.14, s * 0.2);
  } else if (nom === "table") {
    g.fillRect(x - s * 0.4, y - s * 0.12, s * 0.8, s * 0.1);
    g.fillRect(x - s * 0.45, y + s * 0.12, s * 0.3, s * 0.07);
    g.fillRect(x + s * 0.15, y + s * 0.12, s * 0.3, s * 0.07);
    g.beginPath();
    g.moveTo(x - s * 0.3, y + s * 0.35);
    g.lineTo(x + s * 0.3, y - s * 0.05);
    g.moveTo(x + s * 0.3, y + s * 0.35);
    g.lineTo(x - s * 0.3, y - s * 0.05);
    g.stroke();
    // un arbre
    rond(g, x + s * 0.2, y - s * 0.35, s * 0.14, couleur);
  } else if (nom === "jeux") {
    g.beginPath();
    g.moveTo(x - s * 0.35, y + s * 0.38);
    g.lineTo(x - s * 0.15, y - s * 0.35);
    g.lineTo(x + s * 0.05, y + s * 0.38);
    g.stroke();
    g.beginPath();
    g.moveTo(x - s * 0.15, y - s * 0.3);
    g.lineTo(x + s * 0.38, y + s * 0.3);
    g.stroke();
    rond(g, x + s * 0.2, y - s * 0.2, s * 0.08, couleur);
  } else if (nom === "pmr") {
    rond(g, x, y - s * 0.32, s * 0.09, couleur);
    g.beginPath();
    g.arc(x, y + s * 0.12, s * 0.24, 0.3, Math.PI * 1.7);
    g.stroke();
    g.fillRect(x - s * 0.04, y - s * 0.2, s * 0.08, s * 0.28);
    g.fillRect(x - s * 0.04, y + s * 0.02, s * 0.3, s * 0.07);
  } else if (nom === "femme") {
    rond(g, x, y - s * 0.32, s * 0.1, couleur);
    g.beginPath();
    g.moveTo(x, y - s * 0.2);
    g.lineTo(x + s * 0.2, y + s * 0.15);
    g.lineTo(x - s * 0.2, y + s * 0.15);
    g.fill();
    g.fillRect(x - s * 0.1, y + s * 0.1, s * 0.07, s * 0.28);
    g.fillRect(x + s * 0.03, y + s * 0.1, s * 0.07, s * 0.28);
  } else if (nom === "homme") {
    rond(g, x, y - s * 0.32, s * 0.1, couleur);
    g.fillRect(x - s * 0.13, y - s * 0.2, s * 0.26, s * 0.3);
    g.fillRect(x - s * 0.12, y + s * 0.08, s * 0.09, s * 0.3);
    g.fillRect(x + s * 0.03, y + s * 0.08, s * 0.09, s * 0.3);
  }
  g.restore();
}

/** Watty, la pile souriante de la Compagnie. */
function watty(g, x, y, s) {
  g.save();
  g.fillStyle = "#e8c24a";
  g.fillRect(x - s * 0.28, y - s * 0.45, s * 0.56, s * 0.9);
  g.fillStyle = "#c8362b";
  g.fillRect(x - s * 0.28, y - s * 0.45, s * 0.56, s * 0.18);
  g.fillStyle = "#9a9a96";
  g.fillRect(x - s * 0.1, y - s * 0.55, s * 0.2, s * 0.1);
  rond(g, x - s * 0.1, y - s * 0.08, s * 0.05, "#1d2433");
  rond(g, x + s * 0.1, y - s * 0.08, s * 0.05, "#1d2433");
  g.strokeStyle = "#1d2433";
  g.lineWidth = s * 0.04;
  g.beginPath();
  g.arc(x, y + s * 0.05, s * 0.14, 0.2, Math.PI - 0.2);
  g.stroke();
  g.restore();
}

function dessinerAtlas(g) {
  const a = aleatoire(2027);
  g.clearRect(0, 0, AL, AH);
  const bleu = "#2d5a8a";
  const blanc = "#f0ede4";

  // Panneau ouest : retour vers le Comptoir
  {
    const [x, y, l, h] = R.panOuest;
    g.fillStyle = blanc;
    g.fillRect(x, y, l, h);
    g.fillStyle = bleu;
    g.fillRect(x + 8, y + 8, l - 16, h - 16);
    g.strokeStyle = blanc;
    g.lineWidth = 4;
    g.strokeRect(x + 16, y + 16, l - 32, h - 32);
    texte(g, "Aire du Val-Fleuri", x + l / 2, y + 62, 40, blanc, "700", "center", l - 60);
    texte(g, "← Comptoir · 8 km", x + l / 2, y + 140, 50, blanc, "900", "center", l - 60);
    salir(g, a, x, y, l, h, 1.2);
  }
  // Panneau est : vers la Zone industrielle
  {
    const [x, y, l, h] = R.panEst;
    g.fillStyle = blanc;
    g.fillRect(x, y, l, h);
    g.fillStyle = bleu;
    g.fillRect(x + 8, y + 8, l - 16, h - 16);
    g.strokeStyle = blanc;
    g.lineWidth = 4;
    g.strokeRect(x + 16, y + 16, l - 32, h - 32);
    texte(g, "Zone industrielle", x + l / 2, y + 62, 42, blanc, "700", "center", l - 60);
    texte(g, "Centrale · Aciérie →", x + l / 2, y + 140, 48, blanc, "900", "center", l - 60);
    // un impact de plomb
    for (let i = 0; i < 6; i++) rond(g, x + 380 + a() * 60, y + 40 + a() * 50, 4, "#2a2a2a");
    salir(g, a, x, y, l, h, 1.2);
  }
  // Panneau d'annonce de l'aire
  {
    const [x, y, l, h] = R.aire;
    g.fillStyle = blanc;
    g.fillRect(x, y, l, h);
    g.fillStyle = bleu;
    g.fillRect(x + 8, y + 8, l - 16, h - 16);
    texte(g, "Aire du Val-Fleuri", x + l / 2, y + 50, 46, blanc, "800", "center", l - 50);
    const noms = ["wc", "table", "jeux", "pmr"];
    for (let i = 0; i < 4; i++) {
      g.strokeStyle = blanc;
      g.lineWidth = 3;
      g.strokeRect(x + 46 + i * 110, y + 92, 90, 90);
      picto(g, noms[i], x + 91 + i * 110, y + 137, 80);
    }
    texte(g, "1 000 m", x + l / 2, y + 214, 40, blanc, "900");
    g.fillStyle = "#d8b13c";
    g.fillRect(x + 8, y + h - 50, l - 16, 42);
    texte(g, "Pause offerte* · *avec l'abonnement Route+", x + l / 2, y + h - 29, 22, "#1d2433", "700", "center", l - 40);
    salir(g, a, x, y, l, h, 1.1);
  }
  // Le portique à messages : lettres ambrées sur fond noir
  {
    const [x, y, l, h] = R.pmv;
    g.fillStyle = "#121314";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#26282a";
    for (let i = 0; i < l; i += 6) for (let j = 0; j < h; j += 6) g.fillRect(x + i, y + j, 3, 3);
    texte(g, "VOTRE PROCHAINE PAUSE DANS 2 H 14", x + l / 2, y + 42, 36, "#ffb33a", "700", "center", l - 30);
    texte(g, "SELON VOTRE FATIGUE DÉTECTÉE", x + l / 2, y + 92, 36, "#ffb33a", "700", "center", l - 30);
  }
  // Le sentier du terroir : panneau en bois brûlé
  {
    const [x, y, l, h] = R.terroir;
    g.fillStyle = "#8a6440";
    g.fillRect(x, y, l, h);
    for (let j = 0; j < h; j += 40) {
      g.fillStyle = "rgba(40,25,10,0.25)";
      g.fillRect(x, y + j, l, 2);
    }
    for (let i = 0; i < 60; i++) {
      g.fillStyle = "rgba(50,30,15,0.12)";
      g.fillRect(x + a() * l, y + a() * h, 40 + a() * 80, 1.5);
    }
    texte(g, "SENTIER DÉCOUVERTE", x + l / 2, y + 40, 36, "#f1e2c4", "900", "center", l - 40);
    texte(g, "du terroir · 1,2 km · les saveurs d'antan", x + l / 2, y + 90, 26, "#f1e2c4", "700", "center", l - 40);
    texte(g, "suite du parcours : accès Premium", x + l / 2, y + 130, 20, "#e2c88a", "600", "center", l - 40);
    salir(g, a, x, y, l, h, 0.8);
  }
  // La carte de la région, au point d'information
  {
    const [x, y, l, h] = R.carte;
    g.fillStyle = "#e9e1c8";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#2d5a8a";
    g.fillRect(x, y, l, 52);
    texte(g, "LA RÉGION · à découvrir sans modération", x + l / 2, y + 27, 26, blanc, "800", "center", l - 30);
    // mer, forêts, ville
    g.fillStyle = "#9cc0cf";
    g.beginPath();
    g.moveTo(x, y + 250);
    g.bezierCurveTo(x + 80, y + 230, x + 120, y + 320, x + 200, y + h);
    g.lineTo(x, y + h);
    g.fill();
    g.fillStyle = "#a9c08a";
    for (let i = 0; i < 9; i++) rond(g, x + 330 + a() * 160, y + 80 + a() * 90, 18 + a() * 16, "#a9c08a");
    g.fillStyle = "#d4b5a0";
    g.fillRect(x + 150, y + 140, 70, 60);
    g.fillStyle = "#b9b4a8";
    g.fillRect(x + 360, y + 250, 110, 80);
    // l'autoroute
    g.strokeStyle = "#c8362b";
    g.lineWidth = 8;
    g.beginPath();
    g.moveTo(x + 20, y + 170);
    g.lineTo(x + 185, y + 172);
    g.bezierCurveTo(x + 260, y + 175, x + 300, y + 240, x + l - 20, y + 280);
    g.stroke();
    g.strokeStyle = "#7d6143";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(x + 185, y + 200);
    g.lineTo(x + 140, y + 330);
    g.moveTo(x + 185, y + 140);
    g.lineTo(x + 260, y + 80);
    g.stroke();
    texte(g, "Comptoir", x + 185, y + 120, 22, "#1d2433", "800");
    texte(g, "Zone industrielle", x + 415, y + 345, 20, "#1d2433", "800");
    texte(g, "Côte", x + 50, y + 330, 20, "#1d2433", "800");
    texte(g, "Forêt", x + 410, y + 70, 20, "#1d2433", "800");
    rond(g, x + 280, y + 222, 12, "#c8362b");
    rond(g, x + 280, y + 222, 5, blanc);
    texte(g, "Vous êtes ici", x + 280, y + 196, 18, "#c8362b", "900");
    watty(g, x + l - 40, y + h - 60, 70);
    salir(g, a, x, y, l, h, 1.3);
  }
  // Remorque frigorifique
  {
    const [x, y, l, h] = R.frigo;
    g.fillStyle = "#e4e2dc";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#3f7fa6";
    g.fillRect(x, y + h - 26, l, 14);
    texte(g, "FRAÎCHEUR+", x + 30, y + 46, 54, "#2f6f9a", "900", "left");
    texte(g, "livré en 3 h par drone, garanti", x + 30, y + 90, 22, "#3a4a55", "700", "left");
    g.fillStyle = "#7db4d8";
    for (let i = 0; i < 5; i++) {
      const cx = x + 400 + i * 22;
      g.fillRect(cx, y + 30, 4, 50);
      g.fillRect(cx - 12, y + 53, 28, 4);
    }
    salir(g, a, x, y, l, h, 1.4);
  }
  // Citerne
  {
    const [x, y, l, h] = R.citerne;
    g.fillStyle = "#cfcac0";
    g.fillRect(x, y, l, h);
    texte(g, "TRANSPORTS ROULE-TOUJOURS", x + 20, y + 30, 26, "#3a4048", "900", "left", 330);
    texte(g, "votre carburant livré avant même d'en manquer", x + 20, y + 66, 16, "#555b60", "700", "left", 330);
    g.fillStyle = "#e07a28";
    g.fillRect(x + 380, y + 12, 110, 72);
    g.strokeStyle = "#1d1d1d";
    g.lineWidth = 3;
    g.strokeRect(x + 384, y + 16, 102, 64);
    g.beginPath();
    g.moveTo(x + 384, y + 48);
    g.lineTo(x + 486, y + 48);
    g.stroke();
    texte(g, "30", x + 435, y + 32, 24, "#1d1d1d", "900");
    texte(g, "1202", x + 435, y + 64, 24, "#1d1d1d", "900");
    salir(g, a, x, y, l, h, 1.6);
  }
  // Banderole de la fête de départ
  {
    const [x, y, l, h] = R.banderole;
    g.fillStyle = "#efe7d0";
    g.fillRect(x, y, l, h);
    const coul = ["#c8362b", "#2f6f73", "#c79a3b", "#4c6a9a"];
    const t = "EN ROUTE POUR L'AVENTURE !";
    g.font = `900 40px "Arial Black", Arial, sans-serif`;
    let cx = x + 20;
    for (let i = 0; i < t.length; i++) {
      g.fillStyle = coul[i % 4];
      g.fillText(t[i], cx, y + 62);
      cx += g.measureText(t[i]).width;
    }
    g.fillStyle = "#c8362b";
    for (let i = 0; i < l; i += 32) {
      g.beginPath();
      g.moveTo(x + i, y);
      g.lineTo(x + i + 16, y + 14);
      g.lineTo(x + i + 32, y);
      g.fill();
    }
    salir(g, a, x, y, l, h, 1.2);
  }
  // Graffiti sur la passerelle
  {
    const [x, y, l, h] = R.graffiti;
    texte(g, "ICI ON PAIE · LES ÉTEINTS AUSSI", x + l / 2, y + h / 2, 38, "#d8d2c2", "900", "center", l - 20);
  }
  // Distributeurs
  for (const [r, titre, coul] of [[R.boissons, "BOISSONS", "#b8352c"], [R.snacks, "SNACKS", "#2f6f73"]]) {
    const [x, y, l, h] = r;
    g.fillStyle = coul;
    g.fillRect(x, y, l, h);
    texte(g, titre, x + l / 2, y + 26, 28, blanc, "900", "center", l - 16);
    g.fillStyle = "#1a1c1e";
    g.fillRect(x + 12, y + 50, l - 60, h - 110);
    // rangées vides, une seule rescapée
    for (let j = 0; j < 6; j++) {
      g.fillStyle = "#3a3d40";
      g.fillRect(x + 14, y + 60 + j * 32, l - 64, 3);
      if (a() < 0.25) {
        g.fillStyle = ["#c79a3b", "#7aa04a", "#c8362b"][j % 3];
        g.fillRect(x + 20 + a() * 50, y + 42 + j * 32, 14, 16);
      }
    }
    // la vitre éclatée
    g.strokeStyle = "rgba(230,230,230,0.7)";
    g.lineWidth = 2;
    const ex = x + 50;
    const ey = y + 150;
    for (let k = 0; k < 9; k++) {
      g.beginPath();
      g.moveTo(ex, ey);
      const an = (k / 9) * Math.PI * 2 + a();
      g.lineTo(ex + Math.cos(an) * 70, ey + Math.sin(an) * 90);
      g.stroke();
    }
    g.fillStyle = "#3a3d40";
    g.fillRect(x + l - 40, y + 60, 28, 90);
    g.fillStyle = "#9aa0a3";
    for (let j = 0; j < 4; j++) g.fillRect(x + l - 36, y + 66 + j * 20, 20, 12);
    texte(g, "sans contact", x + l / 2, y + h - 34, 15, blanc, "700");
    salir(g, a, x, y, l, h, 1.3);
  }
  // Borne bien-être
  {
    const [x, y, l, h] = R.bienEtre;
    g.fillStyle = "#e8e4dc";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#151719";
    g.fillRect(x + 16, y + 20, l - 32, 170);
    g.strokeStyle = "#5fa6a0";
    g.lineWidth = 4;
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      g.arc(x + l / 2, y + 100, 20 + k * 18, 0, Math.PI * 2);
      g.stroke();
    }
    texte(g, "Pause bien-être", x + l / 2, y + 214, 22, "#2f6f73", "900", "center", l - 20);
    texte(g, "connectée", x + l / 2, y + 240, 20, "#2f6f73", "800", "center", l - 20);
    texte(g, "respirez 3 minutes", x + l / 2, y + 270, 18, "#3a4048", "700", "center", l - 20);
    texte(g, "(sans abonnement : 30 s)", x + l / 2, y + 296, 13, "#6a6a66", "600", "center", l - 20);
    salir(g, a, x, y, l, h, 1.1);
  }
  // Toilettes autonettoyantes
  {
    const [x, y, l, h] = R.wcAuto;
    g.fillStyle = "#dfe3e0";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, l, 50);
    texte(g, "WC AUTONETTOYANT", x + l / 2, y + 26, 24, blanc, "900", "center", l - 20);
    texte(g, "0,80 € · paiement par l'appli", x + l / 2, y + 78, 18, "#1d2433", "800", "center", l - 20);
    texte(g, "WattyPause", x + l / 2, y + 104, 22, "#c8362b", "900", "center", l - 20);
    texte(g, "nettoyage en cours… 1 247 jours", x + l / 2, y + 140, 15, "#3a4048", "700", "center", l - 20);
    rond(g, x + l / 2, y + 170, 10, "#c8362b");
    salir(g, a, x, y, l, h, 1.2);
  }
  // Pictogrammes des portes
  {
    const [x, y, l, h] = R.pictos;
    const noms = ["homme", "femme", "pmr"];
    for (let i = 0; i < 3; i++) {
      const cx = x + i * 85 + 4;
      g.fillStyle = bleu;
      g.fillRect(cx, y + 4, 78, h - 8);
      picto(g, noms[i], cx + 39, y + h / 2, 70);
    }
    salir(g, a, x, y, l, h, 0.8);
  }
  // L'enseigne néon « TOILETTES » (sert aussi de matière lumineuse)
  {
    const [x, y, l, h] = R.toilettes;
    g.fillStyle = "#16353a";
    g.fillRect(x, y, l, h);
    texte(g, "TOILETTES", x + l / 2, y + h / 2, 44, "#9ff5e6", "900", "center", l - 24);
  }
  // L'affiche Watty, collée sur le hall
  {
    const [x, y, l, h] = R.watty;
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, l, h);
    watty(g, x + l / 2, y + 100, 110);
    texte(g, "Bonnes vacances !", x + l / 2, y + 190, 22, "#f2e6c4", "900", "center", l - 16);
    texte(g, "Watty veille sur votre", x + l / 2, y + 216, 14, "#f2e6c4", "700", "center", l - 16);
    texte(g, "maison connectée", x + l / 2, y + 234, 14, "#f2e6c4", "700", "center", l - 16);
    // à moitié arrachée
    g.clearRect(x + l - 60, y + h - 70, 60, 70);
    salir(g, a, x, y, l - 60, h, 1.5);
  }
  // Panneau de l'aire de jeux
  {
    const [x, y, l, h] = R.jeux;
    g.fillStyle = "#e9dfc6";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#c79a3b";
    g.fillRect(x, y, l, 34);
    texte(g, "AIRE DE JEUX CONNECTÉE", x + l / 2, y + 18, 22, "#1d2433", "900", "center", l - 16);
    texte(g, "enfants sous la surveillance", x + l / 2, y + 58, 18, "#3a4048", "700", "center", l - 16);
    texte(g, "d'un adulte connecté", x + l / 2, y + 82, 18, "#3a4048", "700", "center", l - 16);
    texte(g, "2 à 12 ans · 3 à 9 Wh", x + l / 2, y + 108, 15, "#6a6a66", "700", "center", l - 16);
    salir(g, a, x, y, l, h, 1.4);
  }
  // Bande décorative des camping-cars
  {
    const [x, y, l, h] = R.cc;
    g.fillStyle = "#e4dfd2";
    g.fillRect(x, y, l, h);
    const coul = ["#8a5a3c", "#b07a45", "#c9a25a"];
    for (let k = 0; k < 3; k++) {
      g.fillStyle = coul[k];
      g.beginPath();
      g.moveTo(x, y + 14 + k * 14);
      g.bezierCurveTo(x + l * 0.4, y + 10 + k * 14, x + l * 0.6, y + 40 + k * 8, x + l, y + 6 + k * 16);
      g.lineTo(x + l, y + 14 + k * 16);
      g.bezierCurveTo(x + l * 0.6, y + 48 + k * 8, x + l * 0.4, y + 18 + k * 14, x, y + 22 + k * 14);
      g.fill();
    }
    salir(g, a, x, y, l, h, 1.2);
  }
  // La pancarte des pillards
  {
    const [x, y, l, h] = R.peage;
    g.fillStyle = "#9a8462";
    g.fillRect(x, y, l, h);
    g.fillStyle = "rgba(40,25,10,0.3)";
    g.fillRect(x, y + h / 2, l, 2);
    texte(g, "PASSAGE : 1 CONSERVE", x + l / 2, y + h / 2 + 2, 32, "#1f1a14", "900", "center", l - 20);
    salir(g, a, x, y, l, h, 1);
  }
  // Le grillage (losanges, transparent entre les fils)
  {
    const [x, y, l, h] = R.grillage;
    g.strokeStyle = "#d8dcd8";
    g.lineWidth = 3;
    for (let k = -l; k < l * 2; k += 22) {
      g.beginPath();
      g.moveTo(x + k, y);
      g.lineTo(x + k + h, y + h);
      g.stroke();
      g.beginPath();
      g.moveTo(x + k + h, y);
      g.lineTo(x + k, y + h);
      g.stroke();
    }
    g.clearRect(x - 30, y, 30, h);
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(x, y + 3);
    g.lineTo(x + l, y + 3);
    g.moveTo(x, y + h - 3);
    g.lineTo(x + l, y + h - 3);
    g.stroke();
    // restaurer les bords de l'atlas voisins (le motif a pu déborder)
  }
  // « Le saviez-vous ? » au bout du sentier
  {
    const [x, y, l, h] = R.saviez;
    g.fillStyle = "#e6dcc0";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#6f8a4c";
    g.fillRect(x, y, l, 36);
    texte(g, "LE SAVIEZ-VOUS ?", x + l / 2, y + 19, 22, blanc, "900", "center", l - 16);
    texte(g, "Ici poussait autrefois", x + l / 2, y + 62, 17, "#3a4048", "700", "center", l - 16);
    texte(g, "le blé de votre pain,", x + l / 2, y + 84, 17, "#3a4048", "700", "center", l - 16);
    texte(g, "avant la livraison", x + l / 2, y + 106, 17, "#3a4048", "700", "center", l - 16);
    texte(g, "par drone.", x + l / 2, y + 128, 17, "#3a4048", "700", "center", l - 16);
    texte(g, "Scannez pour la suite →", x + l / 2, y + 166, 14, "#6a6a66", "700", "center", l - 16);
    salir(g, a, x, y, l, h, 1.3);
  }
  // « Notez votre passage » : la borne de satisfaction du hall
  {
    const [x, y, l, h] = R.notez;
    g.fillStyle = "#dfe3e0";
    g.fillRect(x, y, l, h);
    texte(g, "Notez votre passage", x + l / 2, y + 30, 20, "#1d2433", "900", "center", l - 16);
    const c = ["#5c9a4a", "#c9a84a", "#c8362b"];
    for (let i = 0; i < 3; i++) {
      rond(g, x + 40 + i * 56, y + 100, 22, c[i]);
      g.strokeStyle = "#1d2433";
      g.lineWidth = 3;
      g.beginPath();
      if (i === 0) g.arc(x + 40, y + 102, 10, 0.2, Math.PI - 0.2);
      else if (i === 1) {
        g.moveTo(x + 86, y + 108);
        g.lineTo(x + 106, y + 108);
      } else g.arc(x + 152, y + 114, 10, Math.PI + 0.2, -0.2);
      g.stroke();
    }
    texte(g, "Merci ! Votre avis compte.", x + l / 2, y + 160, 15, "#3a4048", "700", "center", l - 16);
    salir(g, a, x, y, l, h, 1.2);
  }
  // Face avant du groupe frigorifique
  {
    const [x, y, l, h] = R.frigoAv;
    g.fillStyle = "#cfd2d0";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#2a2c2e";
    for (let i = 0; i < 2; i++) {
      rond(g, x + 80 + i * 160, y + h / 2, 34, "#2a2c2e");
      g.strokeStyle = "#6a6e70";
      g.lineWidth = 2;
      for (let k = 0; k < 4; k++) {
        g.beginPath();
        g.arc(x + 80 + i * 160, y + h / 2, 8 + k * 7, 0, Math.PI * 2);
        g.stroke();
      }
    }
    salir(g, a, x, y, l, h, 1.5);
  }
}

function dessinerAsphalte(g) {
  const a = aleatoire(77);
  g.fillStyle = "#c4c4c0";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5000; i++) {
    const v = 150 + Math.floor(a() * 90);
    g.fillStyle = `rgba(${v},${v},${v - 4},0.5)`;
    g.fillRect(a() * 256, a() * 256, 1 + a() * 2, 1 + a() * 2);
  }
  taches(g, a, 10, "rgba(40,40,40,0.18)", 10, 50, 256, 256);
  taches(g, a, 6, "rgba(255,255,255,0.12)", 10, 40, 256, 256);
  g.strokeStyle = "rgba(35,35,35,0.55)";
  g.lineWidth = 1.5;
  for (let i = 0; i < 7; i++) {
    let x = a() * 256;
    let y = a() * 256;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 8; k++) {
      x += (a() - 0.5) * 30;
      y += (a() - 0.5) * 30;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  // une reprise de goudron, plus sombre
  g.fillStyle = "rgba(30,30,30,0.15)";
  g.fillRect(40, 150, 90, 40);
}

function dessinerTerrain(g) {
  const a = aleatoire(78);
  g.fillStyle = "#d8d8cc";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4000; i++) {
    const v = a();
    g.fillStyle = v < 0.5 ? "rgba(60,70,40,0.12)" : "rgba(255,255,230,0.12)";
    g.fillRect(a() * 256, a() * 256, 1 + a() * 3, 1 + a() * 3);
  }
  taches(g, a, 16, "rgba(90,80,40,0.16)", 12, 50, 256, 256);
  taches(g, a, 10, "rgba(255,255,220,0.14)", 12, 44, 256, 256);
}

// ---------- Petits outils ----------

const GEO = {};
function cyl(r, h, cotes = 8) {
  const cle = `c${r}|${h}|${cotes}`;
  if (!GEO[cle]) GEO[cle] = new THREE.CylinderGeometry(r, r, h, cotes);
  return GEO[cle];
}
const ROUE = new THREE.CylinderGeometry(0.33, 0.33, 0.22, 8);
const ROUE_PL = new THREE.CylinderGeometry(0.52, 0.52, 0.3, 8);
const BOULE = new THREE.IcosahedronGeometry(1, 0);
const CONE = new THREE.ConeGeometry(1, 1, 6);

/** Un panneau plat dont l'image vient de l'atlas (région `r`), face vers +z local. */
function panneau(c, mat, r, pose, l, h, couleur = 0xffffff) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
  c.poser(g, mat, couleur, pose, { crasse: false, nuance: 0 });
  g.dispose();
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

/** Un ruban horizontal (chaussée courbe) de x0 à x1 : centre fz(x), demi-largeur fd(x), posé à y. */
function ruban(c, mat, couleur, x0, x1, fz, fd, y, pas = 1) {
  const xs = [];
  for (let x = x0; x < x1 - 1e-6; x += pas) xs.push(x);
  xs.push(x1);
  const pos = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i];
    const b = xs[i + 1];
    const za1 = fz(a) - fd(a);
    const za2 = fz(a) + fd(a);
    const zb1 = fz(b) - fd(b);
    const zb2 = fz(b) + fd(b);
    pos.push(a, 0, za1, a, 0, za2, b, 0, zb2, a, 0, za1, b, 0, zb2, b, 0, zb1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  c.poser(g, mat, couleur, { y }, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Une bande étroite (ligne peinte, bordure) le long d'une courbe z = fz(x), de x0 à x1, faite de boîtes. */
function bande(c, x0, x1, fz, larg, h, y, couleur, mat, pas = 2, plein = 1) {
  const n = Math.max(1, Math.round((x1 - x0) / pas));
  const dx = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const a = x0 + i * dx;
    const b = a + dx;
    const za = fz(a);
    const zb = fz(b);
    const lg = Math.hypot(dx, zb - za) * plein;
    c.boite(lg + (plein === 1 ? 0.02 : 0), h, larg, couleur, { x: (a + b) / 2, y: y + h / 2, z: (za + zb) / 2, ry: -Math.atan2(zb - za, dx) }, mat, { crasse: false, nuance: 0.02 });
  }
}

/** Une surface extrudée le long de x (talus, glissière en béton) : profil [[z, y], ...], `centre` [z, y] vers l'intérieur. */
function profilX(c, mat, couleur, x0, x1, pts, centre) {
  const pos = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [za, ya] = pts[i];
    const [zb, yb] = pts[i + 1];
    // normale du segment dans le plan (z, y), tournée vers l'extérieur (loin du centre)
    let nz = yb - ya;
    let ny = -(zb - za);
    const mz = (za + zb) / 2 - centre[0];
    const my = (ya + yb) / 2 - centre[1];
    const dehors = nz * mz + ny * my > 0;
    const A = [x0, ya, za];
    const B = [x1, ya, za];
    const Cc = [x1, yb, zb];
    const D = [x0, yb, zb];
    // triangle A B C : normale = (B − A) × (C − A) ; on choisit l'ordre qui sort
    const tri = (p, q, r) => pos.push(...p, ...q, ...r);
    // pour B − A = (dx, 0, 0) et C − A = (dx, dy, dz) : normale = (0, −dx·dz, dx·dy) → (ny, nz) ∝ (−dz, dy)
    const sortant = (-(zb - za) * ny + (yb - ya) * nz) > 0;
    const sens = dehors === sortant;
    if (sens) {
      tri(A, B, Cc);
      tri(A, Cc, D);
    } else {
      tri(A, Cc, B);
      tri(A, D, Cc);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  c.poser(g, mat, couleur, {}, { crasse: false, nuance: 0.02 });
  g.dispose();
}

/** Un conifère : tronc et trois étages de cônes. */
function sapin(c, x, z, h, y = 0) {
  c.tube([x, y, z], [x, y + h * 0.35, z], h * 0.03, 0x5a4636, matiere(0.95), 5);
  const tons = [0x3f6342, 0x4a6e47, 0x365a3c];
  for (let k = 0; k < 3; k++) {
    const r = h * (0.28 - k * 0.07);
    const hh = h * 0.36;
    c.poser(CONE, matiere(0.95), tons[k], { x, y: y + h * 0.3 + k * h * 0.22 + hh / 2, z, ry: c.hasard() * 3, e: [r, hh, r] }, { nuance: 0.06, crasse: false });
  }
}

/** Un platane d'aire de repos : tronc clair tacheté, grand houppier. */
function platane(c, x, z, h) {
  c.tube([x, 0, z], [x, h * 0.42, z], h * 0.04, 0xa79f86, matiere(0.95), 6);
  const tons = [0x5f8a46, 0x6f9650, 0x4f7a3c];
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + c.hasard();
    const r = k === 0 ? 0 : h * 0.18;
    const s = h * c.entre(0.17, 0.24);
    c.poser(BOULE, matiere(0.95), tons[k % 3], { x: x + Math.cos(a) * r, y: h * 0.62 + c.entre(-0.08, 0.12) * h, z: z + Math.sin(a) * r, rx: c.hasard() * 3, ry: c.hasard() * 3, e: [s, s * 0.8, s] }, { nuance: 0.07, crasse: false });
  }
}

// ---------- Listes globales (indépendantes du tronçon : mêmes objets à toutes les usures) ----------

const SENTIER = [[-74.5, 12.5], [-78, 15.5], [-82.5, 17.5], [-86, 21.5], [-89.5, 25], [-92.5, 27.6], [-95, 29.6]];
function distSentier(x, z) {
  let d = Infinity;
  for (let i = 0; i < SENTIER.length - 1; i++) {
    const [ax, az] = SENTIER[i];
    const [bx, bz] = SENTIER[i + 1];
    const vx = bx - ax;
    const vz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)));
    d = Math.min(d, Math.hypot(x - ax - vx * t, z - az - vz * t));
  }
  return d;
}

/** Hauteur des talus (nord et sud) en fonction de z. */
function hTalus(z) {
  if (z < ZN.talus) return Math.min(2.7, ((ZN.talus - z) / 3.4) * 2.6);
  if (z > 30.2) return Math.min(2.7, ((z - 30.2) / 3.4) * 2.6);
  return 0;
}

const ARBRES = (() => {
  const a = aleatoire(4242);
  const liste = [];
  // Talus nord : une haie dense de conifères et de feuillus
  for (let x = -99; x < 100; x += 3.4 + a() * 1.6) {
    const z = -32.2 - a() * 2.6;
    liste.push({ x, z, y: hTalus(z), h: 6 + a() * 4, essence: a() < 0.45 ? "sapin" : a() < 0.75 ? "feuillu" : "bouleau" });
  }
  // Talus sud
  for (let x = -99; x < 100; x += 3.2 + a() * 1.8) {
    const z = 31.4 + a() * 3.2;
    if (x < -94 && z < 31.5) continue;
    liste.push({ x, z, y: hTalus(z), h: 5 + a() * 3.5, essence: a() < 0.55 ? "sapin" : a() < 0.8 ? "feuillu" : "bouleau" });
  }
  // Le bois du sentier (sud-ouest)
  for (let i = 0; i < 46; i++) {
    const x = -99 + a() * 24;
    const z = 11 + a() * 19;
    if (distSentier(x, z) < 3.4) continue;
    if (x > -78 && z < 14) continue;
    if (Math.hypot(x + 92, z - 27) < 4.5) continue; // la clairière du bout du sentier
    liste.push({ x, z, y: 0, h: 6.5 + a() * 4, essence: a() < 0.5 ? "sapin" : a() < 0.75 ? "bouleau" : "feuillu" });
  }
  // L'aire : platanes et bouquets
  for (const [x, z, h] of [
    [-55, 22, 9], [-52, 14, 8], [-37.5, 29, 8], [-19, 29.5, 8.5], [-9, 29.6, 8.5], [-11.5, 16.4, 9], [-2, 12.5, 8.5],
    [-48, 12.5, 7.5], [2.5, 27, 9], [17, 27.5, 10], [30, 28.5, 9], [47, 27, 9.5], [3, 21, 7.5], [94, 16, 9], [97, 27, 9], [53, 27.5, 8.5],
  ]) liste.push({ x, z, y: 0, h, essence: "platane" });
  // Le terre-plein entre l'autoroute et l'aire : quelques arbustes (jamais devant la bretelle)
  return liste;
})();

// ---------- Le sol, l'autoroute, la bretelle ----------

function sol(ctx) {
  const { c, x0, x1, u } = ctx;
  const M = matieres();
  c.pave(x0, -0.2, -35, x1, 0, 35, C.herbe, M.terrain, { crasse: false, nuance: 0 });
  // Les talus boisés (on ne sort pas)
  profilX(c, M.terrain, C.talus, x0, x1, [[ZN.talus, 0], [ZN.talus - 3.4, 2.6], [-35, 2.7]], [-33.5, 0]);
  profilX(c, M.terrain, C.talus, x0, x1, [[30.2, 0], [33.6, 2.6], [35, 2.7]], [33, 0]);
  // L'autoroute : deux chaussées et leurs bandes d'arrêt
  c.pave(x0, 0, ZN.bau, x1, 0.02, ZN.chaussee1, C.asphalte, M.asphalte, { crasse: false, nuance: 0 });
  c.pave(x0, 0, ZN.chaussee2, x1, 0.02, ZN.bauSud, C.asphalte, M.asphalte, { crasse: false, nuance: 0 });
  // Les accotements de terre et de gravier
  c.pave(x0, 0, ZN.talus, x1, 0.012, ZN.bau, 0x9b927e, M.terrain, { crasse: false, nuance: 0 });
  // Marquages : lignes de rive pleines, tirets entre les voies (3 m tous les 13 m, calés sur la halte entière)
  const blanc = C.blanc;
  for (const z of [-30.1, -21.35, -17.65]) c.pave(x0, 0.02, z - 0.12, x1, 0.026, z + 0.12, blanc, M.mat, { crasse: false, nuance: 0 });
  // Ligne de rive sud : pleine dans l'aire, en tirets là où la bretelle rejoint l'autoroute
  for (let k = -100; k < 100; k += 4) {
    const xm = k + 1.5;
    if (xm < x0 || xm >= x1) continue;
    if (Math.abs(xm) < BRETELLE.xDebut) continue;
    c.pave(k, 0.02, -11.3, k + 3, 0.026, -11.05, blanc, M.mat, { crasse: false, nuance: 0 });
  }
  const rx0 = Math.max(x0, -BRETELLE.xDebut);
  const rx1 = Math.min(x1, BRETELLE.xDebut);
  if (rx1 > rx0) c.pave(rx0, 0.02, -11.3, rx1, 0.026, -11.05, blanc, M.mat, { crasse: false, nuance: 0 });
  for (let k = -100; k < 100; k += 13) {
    const xm = k + 1.5;
    if (xm < x0 || xm >= x1) continue;
    for (const z of [-25.7, -14.35]) c.pave(k, 0.02, z - 0.08, k + 3, 0.026, z + 0.08, blanc, M.mat, { crasse: false, nuance: 0 });
  }
  // Le terre-plein central : glissière en béton (ouverte là où la citerne l'a franchie)
  const gba = [[ZN.tpc - 0.32, 0], [ZN.tpc - 0.24, 0.24], [ZN.tpc - 0.09, 0.82], [ZN.tpc + 0.09, 0.82], [ZN.tpc + 0.24, 0.24], [ZN.tpc + 0.32, 0]];
  const trou = [17.5, 23.5];
  for (const [a, b] of [[x0, Math.min(x1, trou[0])], [Math.max(x0, trou[1]), x1]]) {
    if (b - a < 0.05) continue;
    profilX(c, M.beton, C.gba, a, b, gba, [ZN.tpc, 0.3]);
    ctx.b.obstacle(a, ZN.tpc, b, ZN.tpc, "glissière en béton");
  }
  if (x0 <= 20 && x1 > 20) {
    // les morceaux de la glissière éventrée
    for (let i = 0; i < 4; i++) c.boite(c.entre(0.8, 1.6), c.entre(0.3, 0.6), 0.6, C.gba, { x: trou[0] + 0.8 + i * 1.4, y: 0.25, z: ZN.tpc + c.entre(-1.4, 1.4), ry: c.entre(-0.6, 0.6), rz: c.entre(-0.3, 0.3) }, M.beton);
  }
  // Touffes dans le terre-plein, sur les accotements, dans les fissures (plus il y a d'usure, plus ça pousse)
  const n = Math.round(10 + 40 * u);
  semerTouffes(c, x0, ZN.chaussee1 + 0.2, x1, ZN.chaussee2 - 0.2, n, C.herbeSeche);
  semerTouffes(c, x0, ZN.bauSud + 0.3, x1, ZN.grillage + 0.6, Math.round(n * 0.6), C.herbeSeche);
  semerTouffes(c, x0, ZN.talus + 0.2, x1, ZN.bau, Math.round(n * 0.5), C.herbeSeche);
  semerTouffes(c, x0, ZN.bau + 0.3, x1, ZN.bauSud - 0.3, Math.round(n * 0.7 * u), C.herbeSeche, 0.02);
  semerTouffes(c, x0, 24, x1, 30, Math.round(n * 0.8), C.herbe);
  // Arbustes au pied des talus quand l'usure monte
  if (u > 0.5) for (let x = x0 + 3; x < x1; x += 11) arbuste(c, x + c.entre(-2, 2), ZN.talus + 0.8, c.entre(0.9, 1.6));
}

/** La bretelle : décélération, traversée de l'aire, réinsertion. Bordures, lignes, flèches. */
function bretelleEtParkings(ctx) {
  const { c, x0, x1, u } = ctx;
  const M = matieres();
  const fz = (x) => bretelle(x).z;
  const fd = (x) => bretelle(x).d;
  ruban(c, M.asphalte, C.allee, x0, x1, fz, fd, 0.03, 1);
  // Lignes de rive de la bretelle (dans les virages : en morceaux) et bordures en béton dans l'aire
  bande(c, x0, x1, (x) => fz(x) - fd(x) + 0.25, 0.15, 0.006, 0.03, C.blanc, M.mat, 2);
  bande(c, x0, x1, (x) => fz(x) + fd(x) - 0.25, 0.15, 0.006, 0.03, C.blanc, M.mat, 2);
  const bx0 = Math.max(x0, -ALLEE.xFin - 6);
  const bx1 = Math.min(x1, ALLEE.xFin + 6);
  if (bx1 > bx0) {
    bande(c, bx0, bx1, (x) => fz(x) - fd(x) - 0.1, 0.2, 0.14, 0, C.beton, M.beton, 2);
    bande(c, bx0, bx1, (x) => fz(x) + fd(x) + 0.1, 0.2, 0.14, 0, C.beton, M.beton, 2);
  }
  // Flèches peintes (sens unique, vers l'est)
  for (const xf of [-45, -15, 15, 40]) {
    if (xf < x0 || xf >= x1) continue;
    const z = fz(xf);
    c.boite(3, 0.006, 0.25, C.blanc, { x: xf, y: 0.036, z }, M.mat, { crasse: false });
    c.boite(1.1, 0.006, 0.22, C.blanc, { x: xf + 1.15, y: 0.036, z: z - 0.35, ry: 0.6 }, M.mat, { crasse: false });
    c.boite(1.1, 0.006, 0.22, C.blanc, { x: xf + 1.15, y: 0.036, z: z + 0.35, ry: -0.6 }, M.mat, { crasse: false });
  }
  // Les parkings : voitures (ouest), camping-cars (centre), poids lourds (est)
  const pads = [
    [-50, 5, -2, 11, "vl"],
    [2, 5, 48, 22.5, "cc"],
    [52, 5, 93, 28.5, "pl"],
    [62, 1, 93, 5, "pl"],
  ];
  for (const [a, z1, b, z2, type] of pads) {
    const ax = Math.max(a, x0);
    const bxx = Math.min(b, x1);
    if (bxx - ax < 0.05) continue;
    c.pave(ax, 0, z1, bxx, 0.028, z2, C.asphalteVieux, M.asphalte, { crasse: false, nuance: 0 });
    // bordure du fond
    c.pave(ax, 0, z2, bxx, 0.14, z2 + 0.2, C.beton, M.beton, { crasse: false, nuance: 0.02 });
    // marquage des places
    if (type === "vl") for (let x = a; x <= b; x += 2.5) if (x >= x0 && x < x1) c.boite(0.12, 0.006, 5, C.blanc, { x, y: 0.031, z: z1 + 3 }, M.mat, { crasse: false });
    if (type === "cc") for (let x = a + 2; x <= b - 2; x += 4.2) if (x >= x0 && x < x1) c.boite(0.12, 0.006, 7.5, C.blanc, { x: x + 2, y: 0.031, z: 14, ry: -0.6 }, M.mat, { crasse: false });
    if (type === "pl" && z1 === 5) for (let x = a + 4; x <= b; x += 11.3) if (x >= x0 && x < x1) c.boite(0.15, 0.006, 19, C.blanc, { x: x + 6, y: 0.031, z: 16.5, ry: Math.PI / 4 }, M.mat, { crasse: false });
  }
  // Allées piétonnes en béton désactivé vers les sanitaires et les tables
  for (const [a, z1, b, z2] of [[-29, 11, -25, 13.5], [-27.6, 22.5, -26.2, 25.5], [-26.2, 24.2, -3, 25.4], [-19, 11, -10, 12.4]]) {
    const ax = Math.max(a, x0);
    const bxx = Math.min(b, x1);
    if (bxx - ax < 0.05) continue;
    c.pave(ax, 0, z1, bxx, 0.04, z2, 0xbdb6a6, M.beton, { crasse: false, nuance: 0.02 });
  }
  // Herbes dans les joints de l'enrobé
  const n = Math.round(30 * u);
  semerTouffes(c, x0, ALLEE.z2 + 0.4, x1, 10.5, n, C.herbeSeche, 0.03);
  if (u > 0.4) {
    for (let i = 0; i < Math.round(6 * u); i++) {
      const x = c.entre(x0 + 2, x1 - 2);
      const z = c.entre(6, 21);
      if (x > -36 && x < -18 && z > 12) continue;
      if (Math.abs(x - CC.x) < 5 && Math.abs(z - CC.z) < 4.5) continue; // pas d'arbuste dans le camping-car visité
      if (x > 55 && x < 90 && z > 6) continue; // ni sous les poids lourds
      arbuste(c, x, z, c.entre(0.5, 1.1), 0.03);
    }
  }
}

// ---------- Glissières, grillages, panneaux ----------

function glissiere(ctx, xa, xb, z, cote = 1) {
  const { c, x0, x1, b } = ctx;
  const M = matieres();
  const a = Math.max(xa, x0);
  const e = Math.min(xb, x1);
  if (e - a < 0.05) return;
  for (let x = Math.ceil(xa / 2) * 2; x < xb; x += 2) {
    if (x < x0 || x >= x1) continue;
    c.boite(0.1, 0.75, 0.1, C.acier, { x, y: 0.375, z: z + cote * 0.12 }, M.tole);
  }
  c.pave(a, 0.48, z - 0.04, e, 0.8, z + 0.04, C.acier, M.tole, { crasse: false });
  b.obstacle(a, z, e, z, "glissière");
}

function grillage(ctx, xa, xb, z, trous = []) {
  const { c, x0, x1, b, u } = ctx;
  const M = matieres();
  const pas = 3;
  for (let x = Math.ceil(xa / pas) * pas; x < xb; x += pas) {
    const xm = x + pas / 2;
    if (xm < x0 || xm >= x1) continue;
    if (trous.some(([t1, t2]) => xm > t1 && xm < t2)) continue;
    // un panneau penche quand l'usure monte
    const penche = ((Math.sin(x * 12.9898) * 43758.5453) % 1 + 1) % 1;
    const rx = u > 0.6 && penche < 0.15 ? 0.25 : 0;
    panneau(c, M.enseignes, R.grillage, { x: xm, y: 1.0, z, rx }, pas, 2.0, 0xc4c8c4);
    c.boite(0.07, 2.1, 0.07, 0x7f8a86, { x, y: 1.05, z }, M.tole);
  }
  const a = Math.max(xa, x0);
  const e = Math.min(xb, x1);
  let debut = a;
  for (const [t1, t2] of trous) {
    if (t1 > debut && t1 < e) b.obstacle(debut, z, t1, z, "grillage");
    if (t2 > debut) debut = Math.max(debut, t2);
  }
  if (e > debut) b.obstacle(debut, z, e, z, "grillage");
}

function bords(ctx) {
  // Grillages au pied des talus (toute la longueur), et entre l'autoroute et l'aire
  grillage(ctx, -100, 100, ZN.talus);
  grillage(ctx, -100, 100, 30.2, [[-96.5, -93.5]]);
  grillage(ctx, -76, 76, ZN.grillage, [[BRECHE.x1, BRECHE.x2]]);
  glissiere(ctx, -100, 100, ZN.bau + 0.2, -1);
  glissiere(ctx, -84, BRECHE.x1 + 1, -8.3, 1);
  glissiere(ctx, BRECHE.x2 + 0.5, 84, -8.3, 1);
}

/** Les arbres (listes globales, filtrées par tronçon). */
function arbres(ctx) {
  const { c, dans, u } = ctx;
  for (const t of ARBRES) {
    if (!dans(t.x)) continue;
    if (t.essence === "sapin") sapin(c, t.x, t.z, t.h, t.y);
    else if (t.essence === "platane") platane(c, t.x, t.z, t.h);
    else arbre(c, t.x, t.z, t.h, u > 0.9 && (Math.abs(t.x * 7.3) % 5) < 0.6 ? "mort" : t.essence, t.y);
  }
  // Sous-bois : arbustes et fougères sur les talus
  for (let x = ctx.x0 + 2; x < ctx.x1; x += 6) {
    arbuste(c, x + c.entre(-1.5, 1.5), -32 - c.entre(0, 1.5), c.entre(0.8, 1.5), 1.6);
    arbuste(c, x + c.entre(-1.5, 1.5), 31.6 + c.entre(0, 1.5), c.entre(0.8, 1.5), 1.6);
  }
}

/** Un panneau routier sur deux poteaux, tourné vers la caméra (ry). */
function panneauRoute(ctx, x, z, ry, r, l, h, y = 1.8) {
  const { c } = ctx;
  const M = matieres();
  c.repere({ x, z, ry }, () => {
    for (const s of [-1, 1]) c.boite(0.1, y + h, 0.1, C.acier, { x: s * l * 0.32, y: (y + h) / 2 }, M.metal);
    c.boite(l + 0.08, h + 0.08, 0.06, 0xd8d6cf, { y: y + h / 2, z: -0.04 }, M.tole);
    panneau(c, M.enseignes, r, { y: y + h / 2, z: 0.0 }, l, h);
  });
  ctx.b.obstacle(...versMonde(x, z, ry, -l * 0.32, 0), ...versMonde(x, z, ry, l * 0.32, 0), "panneau");
}

/** Lampadaire de l'aire (10 m) : un mât conique, une crosse, une lanterne ; certains penchent. */
function lampadaire(ctx, x, z, penche = 0) {
  const { c } = ctx;
  const M = matieres();
  c.repere({ x, z, rz: penche }, () => {
    c.tube([0, 0, 0], [0, 8, 0], 0.09, 0x8e9599, M.metal, 6);
    c.tube([0, 7.9, 0], [0, 8.2, -1.2], 0.06, 0x8e9599, M.metal, 5);
    c.boite(0.5, 0.18, 0.9, 0x6a7175, { y: 8.1, z: -1.5 }, M.tole);
    c.boite(0.45, 0.04, 0.8, 0xd8d4c4, { y: 8.0, z: -1.5 }, M.lisse);
    c.boite(0.4, 0.3, 0.4, 0x7a8185, { y: 0.15 }, M.beton);
  });
}

function signalisation(ctx) {
  const { dans } = ctx;
  if (dans(-95)) panneauRoute(ctx, -95, -3.4, 0.35, R.panOuest, 3.4, 1.5, 1.9);
  if (dans(-82)) panneauRoute(ctx, -82, -2.2, 0.35, R.aire, 3.2, 1.8, 1.6);
  if (dans(95)) panneauRoute(ctx, 95, -3.4, 0.35, R.panEst, 3.4, 1.5, 1.9);
  for (const [x, z, p] of [[-52, 5.6, 0], [-33, 5.6, 0], [-12, 5.6, 0.18], [6, 5.6, 0], [36, 5.6, -0.12], [55, 5.6, 0], [74, 3.0, 0], [-62, 5.6, 0]]) if (dans(x)) lampadaire(ctx, x, z, p * Math.min(1, ctx.u * 1.4));
}

// ---------- Véhicules ----------

/**
 * Une voiture (épave) : avant vers +x local. Options : type (« citadine », « break », « monospace »), couleur, peluche,
 * coffreToit, velos, ouverte (portière ouverte), retournee, rz (sur le flanc).
 */
function voiture(ctx, k, x, z, ry, o = {}) {
  const { u } = ctx;
  const M = matieres();
  const type = o.type ?? "citadine";
  const L = type === "monospace" ? 4.5 : type === "break" ? 4.6 : 3.9;
  const W = 1.78;
  let coul = o.couleur ?? 0x7d8f9c;
  const col = new THREE.Color(coul).lerp(new THREE.Color(0x8a7a66), 0.15 + 0.35 * u);
  coul = col.getHex();
  const plat = u > 0.35 ? -0.1 : 0;
  const haut = type === "monospace" ? 1.75 : 1.46;
  const lh = type === "monospace" ? L * 0.7 : type === "break" ? L * 0.6 : L * 0.5;
  const xh = type === "monospace" ? -0.25 : type === "break" ? -0.45 : -0.3;
  const hh = haut - 0.95;
  const retournee = !!o.retournee;
  const pose = retournee ? { x, y: 1.5, z, ry, rx: Math.PI } : { x, y: plat, z, ry, rz: o.rz ?? 0, rx: o.rx ?? 0 };
  k.repere(pose, () => {
    k.boite(L, 0.6, W, coul, { y: 0.65 }, M.satin);
    // capot un peu plus bas à l'avant
    k.boite(L * 0.25, 0.08, W - 0.1, coul, { x: L * 0.36, y: 0.97, rz: -0.08 }, M.satin);
    k.boite(lh, hh, W - 0.14, 0xffffff, { x: xh, y: 0.95 + hh / 2 }, M.verre, { crasse: false });
    k.boite(lh - 0.2, 0.07, W - 0.1, coul, { x: xh, y: haut }, M.satin);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.boite(0.09, hh, 0.08, coul, { x: xh + sx * (lh / 2 - 0.08), y: 0.95 + hh / 2, z: sz * (W / 2 - 0.1) }, M.satin);
    // pare-chocs, phares, plaque
    for (const s of [-1, 1]) k.boite(0.14, 0.22, W + 0.02, 0x3a3b3c, { x: s * L / 2, y: 0.45 }, M.mat);
    for (const sz of [-1, 1]) {
      k.boite(0.06, 0.12, 0.32, 0xd8d4c4, { x: L / 2 + 0.01, y: 0.75, z: sz * 0.6 }, M.lisse);
      k.boite(0.06, 0.12, 0.28, 0x8a2a24, { x: -L / 2 - 0.01, y: 0.78, z: sz * 0.62 }, M.lisse);
    }
    // roues
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.poser(ROUE, M.mat, C.pneu, { x: sx * L * 0.32, y: 0.33, z: sz * (W / 2 - 0.08), rx: Math.PI / 2 }, { crasse: false });
    // rouille sur les bas de caisse
    if (u > 0.3) for (const sz of [-1, 1]) k.boite(L * 0.5, 0.18, 0.02, C.rouille, { x: k.entre(-0.4, 0.4), y: 0.45, z: sz * (W / 2 + 0.005) }, M.mat, { nuance: 0.1 });
    if (o.peluche) {
      // le chien en peluche sur la plage arrière (et sa tête qui dodelinait)
      const xp = xh - lh / 2 + 0.22;
      k.boite(0.3, 0.16, 0.14, 0xb58a5a, { x: xp, y: 1.02, z: 0.3 }, M.mat, { crasse: false });
      k.boite(0.14, 0.14, 0.14, 0xb58a5a, { x: xp - 0.12, y: 1.16, z: 0.3 }, M.mat, { crasse: false });
      k.boite(0.05, 0.08, 0.04, 0x6a4a30, { x: xp - 0.12, y: 1.2, z: 0.37 }, M.mat, { crasse: false });
      k.boite(0.05, 0.08, 0.04, 0x6a4a30, { x: xp - 0.12, y: 1.2, z: 0.23 }, M.mat, { crasse: false });
    }
    if (o.coffreToit) {
      k.boite(1.7, 0.36, 0.85, 0x2f3236, { x: xh, y: haut + 0.24 }, M.satin);
      k.boite(1.7, 0.06, 0.85, 0x2f3236, { x: xh, y: haut + 0.62, z: -0.3, rx: -0.9 }, M.satin);
    }
    if (o.velos) {
      for (const dz of [-0.35, 0.05]) {
        for (const dx of [-0.35, 0.35]) k.poser(new THREE.TorusGeometry(0.3, 0.025, 3, 10), M.metal, 0x3a3d40, { x: -L / 2 - 0.35, y: 1.15 + dx * 0, z: dz + dx, ry: Math.PI / 2 }, { crasse: false });
        k.boite(0.04, 0.04, 0.7, 0x8a2a24, { x: -L / 2 - 0.35, y: 1.3, z: dz }, M.metal);
      }
    }
    if (o.ouverte) k.boite(0.9, 0.55, 0.05, coul, { x: 0.3 + 0.35, y: 0.85, z: W / 2 + 0.38, ry: -0.9 }, M.satin);
  });
  rect(ctx.b, x, z, L, W, ry, "épave");
}

/** Une caravane (épave) : avant vers +x. */
function caravane(ctx, k, x, z, ry) {
  const M = matieres();
  k.repere({ x, z, ry, rz: 0.04 }, () => {
    k.boite(4.4, 2.0, 2.1, 0xe2dccd, { y: 1.35 }, M.satin);
    k.boite(4.2, 0.1, 1.9, 0xd2cbbb, { y: 2.4 }, M.satin);
    panneau(k, M.enseignes, R.cc, { y: 1.15, z: 1.06 }, 4.2, 0.5);
    k.boite(1.2, 0.6, 0.04, 0xffffff, { x: 0.8, y: 1.6, z: 1.06 }, M.verre, { crasse: false });
    k.boite(0.1, 0.5, 1.6, 0xffffff, { x: 2.2, y: 1.6 }, M.verre, { crasse: false });
    k.poutre([2.2, 0.45, 0], [3.4, 0.4, 0], 0.1, 0x3a3d40, M.metal);
    for (const sz of [-1, 1]) k.poser(ROUE, M.mat, C.pneu, { x: -0.2, y: 0.3, z: sz * 0.95, rx: Math.PI / 2 }, { crasse: false });
  });
  rect(ctx.b, x, z, 4.4, 2.1, ry, "épave");
}

/** Camping-car (capucine), avant vers +x local. Non visitable. */
function campingCar(ctx, k, x, z, ry, o = {}) {
  const { u } = ctx;
  const M = matieres();
  const coul = new THREE.Color(C.creme).lerp(new THREE.Color(0x9a9a7a), 0.2 * u).getHex();
  k.repere({ x, z, ry, rz: o.penche ?? 0 }, () => {
    k.boite(7.0, 0.3, 2.0, 0x3a3b3c, { y: 0.5 }, M.mat);
    k.boite(5.4, 2.55, 2.3, coul, { x: -0.8, y: 1.95 }, M.satin);
    k.boite(1.3, 1.45, 2.2, 0xe6e2d8, { x: 2.55, y: 1.35 }, M.satin);
    k.boite(1.9, 0.85, 2.3, coul, { x: 2.2, y: 2.75 }, M.satin);
    k.boite(0.08, 0.75, 2.0, 0xffffff, { x: 3.2, y: 1.6, rz: 0.25 }, M.verre, { crasse: false });
    for (const sz of [-1, 1]) {
      panneau(k, M.enseignes, R.cc, { x: -0.8, y: 1.15, z: sz * 1.16, ry: sz < 0 ? Math.PI : 0 }, 5.3, 0.5);
      k.boite(1.1, 0.55, 0.03, 0xffffff, { x: -2.3, y: 2.25, z: sz * 1.16 }, M.verre, { crasse: false });
      k.boite(0.8, 0.55, 0.03, 0xffffff, { x: 0.6, y: 2.25, z: sz * 1.16 }, M.verre, { crasse: false });
      k.boite(0.7, 0.5, 0.03, 0xffffff, { x: 2.6, y: 1.6, z: sz * 1.11 }, M.verre, { crasse: false });
    }
    k.boite(0.03, 1.9, 0.7, 0xd8d2c4, { x: -3.5, y: 1.95, z: 0.4 }, M.satin);
    k.boite(0.9, 0.15, 0.9, 0xe0dcd2, { x: -1.5, y: 3.3 }, M.satin);
    // échelle arrière
    for (let y = 0.8; y < 3.2; y += 0.4) k.boite(0.04, 0.03, 0.4, C.acier, { x: -3.56, y, z: -0.6 }, M.metal);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.poser(ROUE, M.mat, C.pneu, { x: sx < 0 ? -2.2 : 2.3, y: 0.33, z: sz * 0.95, rx: Math.PI / 2 }, { crasse: false });
    if (u > 0.4) {
      // traînées vertes sous les gouttières
      for (const sz of [-1, 1]) k.boite(5.2, 0.5, 0.01, 0x7a8a5a, { x: -0.8, y: 2.95, z: sz * 1.165 }, M.mat, { crasse: false, nuance: 0.1 });
    }
  });
  rect(ctx.b, x, z, 7.0, 2.3, ry, "camping-car");
}

/**
 * Le camion (tracteur + semi-remorque de 13,6 m), avant vers +x local. `k` : chantier du châssis ; `kh` : chantier de
 * la caisse haute (une couche qui s'efface). Options : frigo (portes arrière ouvertes, groupe froid), cabineBasculee.
 */
function camion(ctx, k, kh, x, z, ry, o = {}) {
  const { u } = ctx;
  const M = matieres();
  const cabine = o.couleurCabine ?? 0x9b3b33;
  k.repere({ x, z, ry }, () => {
    // châssis et roues
    k.boite(15.6, 0.35, 1.0, 0x2e2f30, { x: 0, y: 0.95 }, M.mat);
    for (const xr of [-6.6, -5.3, -4.0, 5.6, 7.3]) for (const sz of [-1, 1]) k.poser(ROUE_PL, M.mat, C.pneu, { x: xr, y: 0.52, z: sz * 1.02, rx: Math.PI / 2 }, { crasse: false });
    // la cabine (basculée en avant : moteur à nu)
    const bascule = o.cabineBasculee ? 0.75 : 0;
    k.repere({ x: 8.3, y: 1.1, ry: 0, rz: -bascule }, () => {
      k.boite(2.2, 2.6, 2.45, cabine, { x: -1.1, y: 1.4 }, M.satin);
      k.boite(0.05, 1.0, 2.1, 0xffffff, { x: 0.02, y: 1.95 }, M.verre, { crasse: false });
      k.boite(0.06, 0.5, 2.3, 0x3a3b3c, { x: 0.02, y: 0.55 }, M.mat);
      for (const sz of [-1, 1]) k.boite(0.9, 0.7, 0.04, 0xffffff, { x: -0.45, y: 1.95, z: sz * 1.23 }, M.verre, { crasse: false });
      k.boite(1.6, 0.6, 2.4, cabine, { x: -1.2, y: 2.95 }, M.satin);
    });
    if (o.cabineBasculee) {
      k.boite(1.6, 1.0, 1.0, 0x4a4c4e, { x: 6.9, y: 1.6 }, M.tole);
      k.boite(0.5, 0.4, 0.5, 0x6a6e70, { x: 7.4, y: 2.3, z: 0.3 }, M.metal);
    }
    // sellette, garde-boue, réservoir
    k.boite(1.0, 0.6, 0.6, 0x8e9599, { x: 5.6, y: 0.9, z: 1.0 }, M.metal);
    if (u > 0.3) k.boite(3, 0.3, 0.02, C.rouille, { x: -2, y: 1.15, z: 0.51 }, M.mat);
  });
  // La caisse de la semi-remorque (dans la couche haute)
  kh.repere({ x, z, ry }, () => {
    const lg = 13.6;
    const xc = -1.0;
    const h0 = 1.2;
    const h1 = 4.0;
    const w = 2.55;
    const coul = o.frigo ? 0xe2e2dc : 0x6f7f74;
    kh.boite(lg, 0.12, w, 0x55585a, { x: xc, y: h0 + 0.06 }, M.tole);
    kh.boite(lg, 0.1, w, coul, { x: xc, y: h1 - 0.05 }, o.frigo ? M.satin : M.toile);
    for (const sz of [-1, 1]) {
      kh.boite(lg, h1 - h0, 0.06, coul, { x: xc, y: (h0 + h1) / 2, z: sz * (w / 2 - 0.03) }, o.frigo ? M.satin : M.toile);
      if (o.frigo) panneau(kh, M.enseignes, R.frigo, { x: xc + 1.5, y: 2.9, z: sz * (w / 2 + 0.005), ry: sz < 0 ? Math.PI : 0 }, 8.5, 2.1);
    }
    kh.boite(0.08, h1 - h0, w, coul, { x: xc + lg / 2, y: (h0 + h1) / 2 }, o.frigo ? M.satin : M.toile);
    if (o.frigo) {
      // le groupe froid à l'avant, les portes arrière grandes ouvertes, l'intérieur sombre et ses palettes
      kh.boite(0.5, 1.4, 2.2, 0xc8ccca, { x: xc + lg / 2 + 0.3, y: 3.2 }, M.tole);
      panneau(kh, M.enseignes, R.frigoAv, { x: xc + lg / 2 + 0.56, y: 3.2, ry: Math.PI / 2 }, 2.1, 0.62);
      kh.boite(lg - 0.4, 0.03, w - 0.2, 0x3a3c3e, { x: xc, y: h1 - 0.12 }, M.mat);
      for (const sz of [-1, 1]) {
        kh.repere({ x: xc - lg / 2, z: sz * (w / 2), ry: sz * 2.0 }, () => {
          kh.boite(0.06, h1 - h0 - 0.1, w / 2, 0xdcdcd6, { y: (h0 + h1) / 2, z: -sz * w / 4 }, M.satin);
        });
      }
    } else {
      // bâche déchirée qui pend
      kh.boite(4, 1.4, 0.05, 0x6f7f74, { x: -4, y: 2.4, z: w / 2 + 0.2, rx: 0.25 }, M.toile);
      kh.boite(0.08, h1 - h0, w, 0x6f7f74, { x: xc - lg / 2, y: (h0 + h1) / 2 }, M.toile);
    }
  });
  if (o.frigo) {
    // L'intérieur (au sol de la remorque, toujours visible) : palettes, cartons crevés
    k.repere({ x, z, ry }, () => {
      k.boite(13.2, 0.06, 2.4, 0x6a6c6c, { x: -1.0, y: 1.2 }, M.tole);
      for (let i = 0; i < 4; i++) {
        k.boite(1.2, 0.15, 1.0, 0x9a7e5a, { x: 3.5 - i * 1.5, y: 1.33, z: -0.5 }, M.mat);
        k.boite(1.1, 0.6 + (i % 2) * 0.4, 0.95, 0xb8a27a, { x: 3.5 - i * 1.5, y: 1.7 + (i % 2) * 0.2, z: -0.5 }, M.mat, { nuance: 0.1 });
      }
      k.boite(1.1, 0.5, 0.9, 0xb8a27a, { x: -5.5, y: 1.5, z: 0.5, ry: 0.4 }, M.mat);
      // une rampe d'acier posée au cul de la remorque (on monte jeter un œil)
      k.boite(2.2, 0.06, 0.9, 0x8e9599, { x: -8.85, y: 0.62, rz: 0.55 }, M.metal);
    });
  }
  rect(ctx.b, x, z, 16.5, 2.6, ry, "poids lourd");
}

/** Le camion-citerne couché sur le flanc, avant vers +x local. */
function citerne(ctx, k, x, z, ry) {
  const M = matieres();
  k.repere({ x, y: 1.25, z, ry }, () => {
    k.repere({ rx: Math.PI / 2 }, () => {
      // repère « camion debout » : y vers le haut du camion (devenu z), le flanc gauche au sol
      const y0 = -1.25 - 0.95;
      k.poser(new THREE.CylinderGeometry(1.25, 1.25, 10.8, 12), M.satin, 0xbfbab0, { x: -1.6, y: 0, rz: Math.PI / 2 }, { crasse: false });
      for (const s of [-1, 1]) k.poser(new THREE.CylinderGeometry(1.15, 1.25, 0.3, 12), M.satin, 0xa9a49a, { x: -1.6 + s * 5.5, rz: Math.PI / 2 }, { crasse: false });
      panneau(k, M.enseignes, R.citerne, { x: -1.6, y: 0.05, z: -1.27, rx: Math.PI }, 8, 1.5);
      k.boite(13, 0.3, 0.9, 0x2e2f30, { x: -1, y: y0 + 0.5 }, M.mat);
      for (const xr of [-5.6, -4.4, 4.6, 6.6]) for (const sz of [-1, 1]) k.poser(ROUE_PL, M.mat, C.pneu, { x: xr, y: y0 + 0.1, z: sz * 1.0, rx: Math.PI / 2 }, { crasse: false });
      // passerelle de dôme et échelle
      k.boite(8, 0.06, 0.5, 0x8e9599, { x: -1.6, y: 1.32 }, M.metal);
      // la cabine écrasée contre la pile
      k.boite(2.2, 2.3, 2.4, 0xd8b13c, { x: 5.6, y: y0 + 1.8, rz: 0.1 }, M.satin);
      k.boite(0.05, 0.9, 2.0, 0xffffff, { x: 6.72, y: y0 + 2.2 }, M.verre, { crasse: false });
    });
  });
  rect(ctx.b, x - 1.6 * Math.cos(ry), z + 1.6 * Math.sin(ry), 11.5, 2.6, ry, "camion-citerne couché");
  const [cx, cz] = versMonde(x, z, ry, 5.6, 0);
  rect(ctx.b, cx, cz, 2.4, 2.6, ry, "cabine du camion-citerne");
  flaque(k, x - 3, z + 2.6, 2.6, 0.04);
}

// ---------- L'entrée de l'aire ----------

function troncon1(ctx) {
  const { c, b, u } = ctx;
  const M = matieres();
  // Le bouchon figé de l'entrée : les voitures se sont arrêtées pare-chocs contre pare-chocs.
  // Il reste un passage de deux mètres au sud, entre le monospace et la bordure.
  const bouchon = [
    [-71.5, -2.8, 0.42, { type: "monospace", couleur: TEINTES_VOITURES[0], coffreToit: true }],
    [-69, 1.8, 0.28, { type: "break", couleur: TEINTES_VOITURES[1], velos: true }],
    [-66.4, -0.5, 0.12, { couleur: TEINTES_VOITURES[2], ouverte: true }],
    [-63.2, 0.2, -0.05, { type: "break", couleur: TEINTES_VOITURES[3] }],
    [-60.6, -1.2, 0.3, { couleur: TEINTES_VOITURES[4] }],
    [-67.6, 3.4, 0.18, { couleur: TEINTES_VOITURES[5] }],
  ];
  for (const [x, z, ry, o] of bouchon) voiture(ctx, c, x, z, ry, o);
  caravane(ctx, c, -75.6, -4.3, 0.55);
  // La voiture couchée dans le grillage (le passage de l'autoroute vers l'aire)
  voiture(ctx, c, -58.8, -6.6, 1.25, { couleur: TEINTES_VOITURES[6], rz: 0.35 });
  for (let i = 0; i < 2; i++) panneau(c, M.enseignes, R.grillage, { x: BRECHE.x1 + 1 + i * 2.2, y: 0.12, z: ZN.grillage + 0.8, rx: -Math.PI / 2 + 0.1, ry: 0.2 * i }, 2.6, 1.8, 0xc4c8c4);
  // Épaves sur l'autoroute
  voiture(ctx, c, -86, -13.8, 0.06, { type: "break", couleur: TEINTES_VOITURES[7], coffreToit: true });
  voiture(ctx, c, -57, -24.5, Math.PI + 0.1, { couleur: TEINTES_VOITURES[8] });
  voiture(ctx, c, -92, -26, Math.PI - 0.05, { type: "monospace", couleur: TEINTES_VOITURES[9] });
  // Bagages tombés du coffre de toit, éparpillés
  jonchee(c, -73.5, -1.5, -70, 1.5, 14, [0xc8362b, 0x2f6f73, 0xe0d6c0, 0x4c6a9a, 0xc79a3b], 0.04);

  // Le point d'information touristique : un auvent en bois et la grande carte de la région
  c.repere({ x: -73, z: 9.6, ry: 0.3 }, () => {
    for (const s of [-1, 1]) c.boite(0.16, 2.9, 0.16, C.bois, { x: s * 1.6, y: 1.45 }, M.mat);
    c.boite(3.6, 0.1, 1.2, C.boisGris, { y: 2.95, z: 0.1, rx: 0.2 }, M.mat);
    c.boite(3.3, 2.1, 0.1, 0x6a5040, { y: 1.75, z: -0.05 }, M.mat);
    panneau(c, M.enseignes, R.carte, { y: 1.75, z: 0.01 }, 3.0, 1.95);
    c.boite(3.1, 0.06, 0.02, 0xffffff, { y: 1.75, z: 0.04, rz: 0.02 }, M.verre, { crasse: false });
  });
  rect(b, -73, 9.55, 3.4, 0.3, 0.3, "point d'information");
  // Le banc et les poubelles renversées
  c.boite(1.8, 0.08, 0.4, C.bois, { x: -69, y: 0.45, z: 11, ry: 0.2 }, M.mat);
  for (const s of [-1, 1]) c.boite(0.08, 0.45, 0.4, 0x3a3d40, { x: -69 + s * 0.8, y: 0.22, z: 11 + s * -0.16, ry: 0.2 }, M.metal);
  poubelles(ctx, -69.6, 7.4, 3);

  // Le sentier « découverte du terroir » qui s'enfonce dans le bois
  for (let i = 0; i < SENTIER.length - 1; i++) {
    const [ax, az] = SENTIER[i];
    const [bx, bz] = SENTIER[i + 1];
    const lg = Math.hypot(bx - ax, bz - az);
    c.boite(lg + 0.6, 0.02, 1.5, C.terre, { x: (ax + bx) / 2, y: 0.012, z: (az + bz) / 2, ry: -Math.atan2(bz - az, bx - ax) }, M.terrain, { crasse: false, nuance: 0.03 });
  }
  jonchee(c, -95, 13, -76, 30, 50);
  // Le panneau d'entrée du sentier
  c.repere({ x: -75.8, z: 12.2, ry: 0.5 }, () => {
    for (const s of [-1, 1]) c.boite(0.14, 2.2, 0.14, C.bois, { x: s * 1.0, y: 1.1 }, M.mat);
    panneau(c, M.enseignes, R.terroir, { y: 1.75, z: 0.08 }, 2.3, 0.72);
  });
  // Au bout : le pupitre « le saviez-vous ? », le portillon fermé, le sac du randonneur
  c.repere({ x: -92.6, z: 27.2, ry: 0.6 }, () => {
    c.boite(0.12, 0.95, 0.12, C.bois, { y: 0.47 }, M.mat);
    panneau(c, M.enseignes, R.saviez, { y: 1.05, z: 0.05, rx: -0.6 }, 0.9, 0.68);
  });
  c.boite(1.4, 1.1, 0.06, C.boisGris, { x: -95, y: 0.6, z: 30.1 }, M.mat);
  c.boite(0.4, 0.5, 0.25, 0x5a6a4a, { x: -91.6, y: 0.25, z: 27.8, ry: 0.4, rz: 0.3 }, M.toile);
  c.boite(0.12, 0.06, 0.1, 0x2e2f30, { x: -91.3, y: 0.05, z: 28.2 }, M.mat);
  for (let i = 0; i < 5; i++) {
    const x = -90 + c.entre(-2, 2);
    const z = 26 + c.entre(-1.5, 1.5);
    c.tube([x, 0, z], [x, 0.08, z], 0.02, 0xe8e0cc, M.mat, 4);
    c.poser(CONE, M.mat, 0xa8643a, { x, y: 0.1, z, e: [0.07, 0.04, 0.07] }, { crasse: false });
  }
  // Un tronc couché en travers du sentier
  c.tube([-84.5, 0.25, 18], [-81, 0.3, 21.5], 0.25, 0x5e4a36, M.mat, 6);
  // Les lumières : le lampadaire solaire « intelligent » qui s'allume encore à la nuit, la frontale dans le sac
  c.boite(0.6, 0.04, 0.5, 0x1f2a44, { x: -62, y: 8.45, z: 5.2, rx: -0.4 }, M.lisse);
  c.boite(0.4, 0.06, 0.7, 0xfff1c8, { x: -62, y: 7.98, z: 4.1 }, M.lueur, { crasse: false });
  b.lumiere(-62, 7.6, 4.2, 0xdfe8ff, 5, 14, "lampadaire solaire « intelligent » qui s'allume encore, à 10 %");
  b.lumiere(-91.4, 0.3, 28, 0xfff4dc, 1.5, 4, "lampe frontale encore allumée dans le sac (pile solaire)");
  // Gravillons et herbes à l'entrée
  debris(c, -75, -3, -58, 5, Math.round(30 * u), [0x8e9599, 0xd8d4c4, 0x6a6e70], 0.03);
  if (u > 0.4) gravats(c, -58.6, -5.2, 1.2, 10, [0x8e9599, 0x7f8a86, PALETTE.pierre], 0.02);
}

/** Des poubelles vertes (bacs ronds de l'aire), certaines couchées, leur contenu répandu. */
function poubelles(ctx, x, z, n) {
  const { c, b } = ctx;
  const M = matieres();
  for (let i = 0; i < n; i++) {
    const px = x + i * 1.1;
    const couchee = i % 2 === 0;
    if (couchee) c.poser(cyl(0.32, 0.9, 8), M.satin, 0x4f6b4a, { x: px, y: 0.32, z: z + 0.3, rx: Math.PI / 2, ry: 0.5 + i }, { crasse: false });
    else {
      c.poser(cyl(0.32, 0.9, 8), M.satin, 0x4f6b4a, { x: px, y: 0.45, z }, {});
      c.tube([px, 0, z - 0.4], [px, 0.9, z - 0.4], 0.04, 0x3a3d40, M.metal, 4);
    }
  }
  jonchee(c, x - 0.6, z - 0.4, x + n * 1.1 + 1.4, z + 2.4, 26, [0xe0d6c0, 0xc8362b, 0x9a9a96, 0x4c6a9a, 0xb8b2a2], 0.02);
  rect(b, x + (n - 1) * 0.55, z + 0.15, n * 1.1, 0.8, 0, "poubelles");
}

// ---------- Les sanitaires, le pique-nique, les jeux ----------

function sanitaires(ctx) {
  const { c, b, u } = ctx;
  const M = matieres();
  const { x0, x1, z0, z1, h } = SANI;
  const couleur = C.beton;
  const toit = b.couche("toit-sanitaires", { x: (x0 + x1) / 2, z: (z0 + z1) / 2, l: x1 - x0 + 1.4, p: z1 - z0 + 1.4 }, 1.2, h + 0.6);
  const brisV = 0.3 + 0.6 * u;
  // Sol carrelé et socle
  c.pave(x0, 0, z0, x1, 0.05, z1, 0xdcd6c8, M.carrelage, { crasse: false, nuance: 0 });
  // Façade sud (vue de la caméra) : en bas toujours là, le haut dans la couche (coupée à hauteur d'allège)
  const ouvSudBas = [
    { u: 8, l: 3.2, bas: 0, haut: 2.7, type: "vide" },
    { u: 12, l: 1.2, bas: 0, haut: 2.2, type: "vide" },
  ];
  mur(c, [x0, z1], [x1, z1], { h: 1.2, ep: 0.25, couleur, mat: M.beton, ouvertures: ouvSudBas, batiment: b, interieur: { couleur: C.carrelage, mat: M.carrelage } });
  mur(toit, [x0, z1], [x1, z1], {
    h: h - 1.2, y0: 1.2, ep: 0.25, couleur, mat: M.beton,
    ouvertures: [
      { u: 8, l: 3.2, bas: 0, haut: 1.5, type: "vide" },
      { u: 12, l: 1.2, bas: 0, haut: 1.0, type: "vide" },
      { u: 3, l: 2.4, bas: 0.95, haut: 1.45, type: "fenetre", bris: brisV, croisillons: 3, traverses: 1, cadre: 0xb8b2a2 },
    ],
    interieur: { couleur: C.carrelage, mat: M.carrelage },
  });
  // Façade est
  mur(c, [x1, z1], [x1, z0], { h: 1.2, ep: 0.25, couleur, mat: M.beton, ouvertures: [{ u: 1.5, l: 1.1, bas: 0, haut: 2.2, type: "vide" }], batiment: b, interieur: { couleur: C.carrelage, mat: M.carrelage } });
  mur(toit, [x1, z1], [x1, z0], {
    h: h - 1.2, y0: 1.2, ep: 0.25, couleur, mat: M.beton,
    ouvertures: [
      { u: 1.5, l: 1.1, bas: 0, haut: 1.0, type: "vide" },
      { u: 4.9, l: 1.6, bas: 0.95, haut: 1.45, type: "fenetre", bris: brisV, croisillons: 2, traverses: 1, cadre: 0xb8b2a2 },
    ],
    interieur: { couleur: C.carrelage, mat: M.carrelage },
  });
  // Façades nord et ouest (de dos) : pleine hauteur
  mur(c, [x1, z0], [x0, z0], {
    h, ep: 0.25, couleur, mat: M.beton, batiment: b,
    ouvertures: [
      { u: 8, l: 3.2, bas: 0, haut: 2.7, type: "vide" },
      { u: 3.5, l: 2.0, bas: 2.15, haut: 2.65, type: "fenetre", bris: brisV, croisillons: 2, traverses: 1, cadre: 0xb8b2a2 },
      { u: 12.5, l: 2.0, bas: 2.15, haut: 2.65, type: "fenetre", bris: brisV, croisillons: 2, traverses: 1, cadre: 0xb8b2a2 },
    ],
    breches: u > 0.75 ? [{ u: 14.2, l: 1.6, profondeur: 0.8 }] : [],
    interieur: { couleur: C.carrelage, mat: M.carrelage },
  });
  mur(c, [x0, z0], [x0, z1], { h, ep: 0.25, couleur, mat: M.beton, batiment: b, ouvertures: [{ u: 5, l: 2.4, bas: 2.15, haut: 2.65, type: "fenetre", bris: brisV, croisillons: 3, traverses: 1, cadre: 0xb8b2a2 }], interieur: { couleur: C.carrelage, mat: M.carrelage } });
  // Les piles d'angle et les bandeaux de béton lavé (le style années 1980)
  for (const [x, z] of [[x0, z1], [x1, z1], [x1, z0], [x0, z0]]) c.boite(0.45, h, 0.45, 0xb7b0a0, { x, y: h / 2, z }, M.beton);
  // Cloisons intérieures (faïence) : hall, hommes, femmes, cabine pour handicapés, local technique
  const cl = { h: 2.45, ep: 0.12, couleur: C.faience, mat: M.carrelage, batiment: b };
  mur(c, [-29, z0], [-29, z1], { ...cl, ouvertures: [{ u: 6.5, l: 1.2, bas: 0, haut: 2.2, type: "vide" }] });
  mur(c, [-25, z0], [-25, z1], { ...cl, ouvertures: [{ u: 2.6, l: 1.2, bas: 0, haut: 2.2, type: "vide" }] });
  mur(c, [-25, 19], [x1, 19], { ...cl });
  mur(c, [-21, 19], [-21, z1], { ...cl });
  // Le hall traversant : sol plus sombre, l'affiche Watty, la borne « Notez votre passage »
  c.pave(-29, 0.05, z0, -25, 0.06, z1, 0x9a958a, M.beton, { crasse: false });
  panneau(c, M.enseignes, R.watty, { x: -28.92, y: 1.6, z: 15.2, ry: Math.PI / 2 }, 0.75, 1.0);
  c.repere({ x: -25.4, z: 21.2, ry: -Math.PI / 2 }, () => {
    c.boite(0.5, 1.2, 0.3, 0xd8d4cc, { y: 0.6 }, M.satin);
    panneau(c, M.enseignes, R.notez, { y: 1.0, z: 0.16 }, 0.45, 0.45);
  });
  // Hommes : urinoirs, deux cabines, lavabos et miroir, sèche-mains
  for (let i = 0; i < 3; i++) {
    const x = -34 + i * 1.0;
    c.boite(0.45, 0.7, 0.35, 0xeeeae2, { x, y: 1.0, z: z0 + 0.32 }, M.lisse);
    if (i < 2) c.boite(0.04, 0.9, 0.5, C.faience, { x: x + 0.5, y: 1.1, z: z0 + 0.35 }, M.lisse);
  }
  for (const [za, zb] of [[15.6, 17.3], [17.3, 19.0]]) {
    c.pave(x0 + 0.13, 0.1, zb - 0.03, x0 + 1.6, 2.0, zb + 0.03, C.porte, M.satin);
    c.boite(0.4, 0.45, 0.55, 0xeeeae2, { x: x0 + 0.45, y: 0.22, z: (za + zb) / 2 }, M.lisse);
  }
  c.pave(x0 + 0.13, 0.1, 15.57, x0 + 1.6, 2.0, 15.63, C.porte, M.satin);
  c.boite(0.05, 1.9, 0.8, C.porte, { x: x0 + 1.95, y: 1.05, z: 16.2, ry: 0.9 }, M.satin);
  c.boite(0.05, 1.9, 0.8, C.porte, { x: x0 + 1.6, y: 0.05, z: 18.4, rz: Math.PI / 2 - 0.1 }, M.satin);
  c.boite(4.2, 0.85, 0.55, 0xd8d4cc, { x: -32.4, y: 0.42, z: z1 - 0.4 }, M.lisse);
  for (let i = 0; i < 3; i++) c.boite(0.45, 0.06, 0.35, 0xf2efe8, { x: -33.8 + i * 1.4, y: 0.88, z: z1 - 0.42 }, M.lisse);
  c.boite(4.0, 0.8, 0.03, 0xffffff, { x: -32.4, y: 1.55, z: z1 - 0.15 }, M.verre, { crasse: false });
  c.boite(0.35, 0.5, 0.22, 0xe8e6e0, { x: -29.4, y: 1.4, z: 21.2 }, M.satin);
  // Femmes : trois cabines au nord, lavabos au sud
  for (let i = 0; i <= 3; i++) c.pave(-24.85 + i * 1.9, 0.1, z0 + 0.13, -24.79 + i * 1.9, 2.0, 15.5, C.porte, M.satin);
  for (let i = 0; i < 3; i++) {
    const xc = -23.9 + i * 1.9;
    c.boite(0.45, 0.45, 0.55, 0xeeeae2, { x: xc, y: 0.22, z: z0 + 0.5 }, M.lisse);
    if (i === 1) c.boite(0.8, 1.9, 0.05, C.porte, { x: xc + 0.4, y: 1.05, z: 15.9, ry: -1.1 }, M.satin);
    else c.boite(1.7, 1.9, 0.05, C.porte, { x: xc, y: 1.05, z: 15.5 }, M.satin);
  }
  c.boite(3.6, 0.85, 0.55, 0xd8d4cc, { x: -22.4, y: 0.42, z: 18.6 }, M.lisse);
  c.boite(3.4, 0.8, 0.03, 0xffffff, { x: -22.4, y: 1.55, z: 18.9 }, M.verre, { crasse: false });
  c.boite(0.35, 0.5, 0.22, 0xe8e6e0, { x: x1 - 0.25, y: 1.4, z: 17.4 }, M.satin);
  // Cabine pour handicapés : cuvette, barres d'appui, lavabo
  c.boite(0.45, 0.45, 0.6, 0xeeeae2, { x: -24.4, y: 0.22, z: 20.5 }, M.lisse);
  c.tube([-24.75, 0.75, 19.6], [-24.75, 0.75, 21.2], 0.025, 0xc8c8c4, M.metal, 5);
  c.tube([-23.9, 0.75, 19.15], [-22.6, 0.75, 19.15], 0.025, 0xc8c8c4, M.metal, 5);
  c.boite(0.55, 0.15, 0.4, 0xf2efe8, { x: -21.5, y: 0.8, z: 20.0 }, M.lisse);
  // Le local technique : chauffe-eau, tuyaux de cuivre, étagère de produits
  c.poser(cyl(0.3, 1.2, 8), M.satin, 0xe8e6e0, { x: -19.7, y: 1.9, z: 19.6 }, {});
  c.tube([-19.5, 0.1, 19.3], [-19.5, 1.4, 19.3], 0.03, 0xb87440, M.metal, 4);
  c.tube([-19.9, 0.1, 19.3], [-19.9, 1.4, 19.3], 0.03, 0xb87440, M.metal, 4);
  c.tube([-20.9, 2.3, 19.3], [-19.3, 2.3, 19.3], 0.03, 0xb87440, M.metal, 4);
  c.boite(0.35, 1.6, 1.2, 0x8e9599, { x: -20.65, y: 0.8, z: 21.6 }, M.tole);
  for (let i = 0; i < 4; i++) c.boite(0.25, 0.3, 0.2, [0x4c6a9a, 0xc79a3b, 0xe8e6e0, 0x7aa04a][i], { x: -20.6, y: 1.75, z: 21.1 + i * 0.3 }, M.satin);
  // Les débris : papier, carreaux tombés, une flaque sous la fuite
  debris(c, x0 + 0.5, z0 + 0.5, x1 - 0.5, z1 - 0.5, Math.round(30 * u), [0xeeeae2, C.faience, 0xb8b2a2], 0.05);
  if (u > 0.5) flaque(c, -27, 18.5, 1.1, 0.07);
  // Le porche : la porte de la cabine pour handicapés qui bat au vent (objet animé)
  porteQuiBat(ctx, -23.6, z1 + 0.13);

  // Le toit-terrasse en béton (la couche), débord, acrotère, panneau solaire du néon
  const yT = h;
  const trouToit = u > 0.6;
  const parts = trouToit ? [[x0 - 0.6, -29.5], [-26.5, x1 + 0.6]] : [[x0 - 0.6, x1 + 0.6]];
  for (const [a, e] of parts) toit.pave(a, yT, z0 - 0.6, e, yT + 0.28, z1 + 0.6, 0xb7b0a0, M.beton, { crasse: false });
  if (trouToit) {
    toit.pave(-29.5, yT, z0 - 0.6, -26.5, yT + 0.28, 17, 0xb7b0a0, M.beton, { crasse: false });
    raiDeLumiere(c, [-28, 3.2, 19.5], [-27.4, 0.06, 20.4], 2.2, 0.16);
    gravats(c, -27.8, 19.8, 1.0, 9, [C.beton, 0xb7b0a0, 0x8e8a80], 0.06);
  }
  for (const [a, b2, c2, d2] of [[x0 - 0.6, z0 - 0.6, x1 + 0.6, z0 - 0.45], [x0 - 0.6, z1 + 0.45, x1 + 0.6, z1 + 0.6], [x0 - 0.6, z0 - 0.6, x0 - 0.45, z1 + 0.6], [x1 + 0.45, z0 - 0.6, x1 + 0.6, z1 + 0.6]]) toit.pave(a, yT + 0.28, b2, c2, yT + 0.55, d2, 0xa9a395, M.beton, { crasse: false });
  toit.boite(1.6, 0.06, 1.0, 0x1f2a44, { x: -21.5, y: yT + 0.75, z: 20.5, rx: -0.35 }, M.lisse);
  toit.boite(0.08, 0.5, 0.08, 0x8e9599, { x: -21.5, y: yT + 0.5, z: 20.9 }, M.metal);
  mousse(toit, -32, yT + 0.28, 16, 2.0, Math.round(10 * u));

  // L'enseigne-drapeau « TOILETTES » au néon, accrochée à l'angle sud-est (elle grésille encore la nuit)
  c.boite(0.06, 0.06, 0.9, 0x6a7175, { x: x1 + 0.3, y: 2.95, z: z1 - 0.1 }, M.metal);
  c.repere({ x: x1 + 0.75, y: 2.65, z: z1 - 0.1, ry: Math.PI / 4 }, () => {
    c.boite(1.35, 0.55, 0.12, 0x16353a, {}, M.tole);
    panneau(c, M.neon, R.toilettes, { z: 0.065 }, 1.25, 0.48);
    panneau(c, M.neon, R.toilettes, { z: -0.065, ry: Math.PI }, 1.25, 0.48);
  });
  b.lumiere(x1 + 0.9, 2.5, z1 + 0.5, 0x9ff5e6, 3.5, 9, "néon « TOILETTES » qui grésille, sur son panneau solaire");
  // Les pictogrammes au-dessus des portes
  panneau(c, M.enseignes, R.pictos, { x: -27, y: 2.9, z: z1 + 0.14 }, 1.6, 0.6);

  // Les distributeurs éventrés, sous leur auvent, côté est (boissons, snacks), canettes au sol
  c.pave(x1 + 0.1, 2.5, 14.2, x1 + 1.5, 2.58, 17.6, 0x8e9599, M.tole);
  for (const [zc, r, ouvert] of [[15.0, R.boissons, true], [16.6, R.snacks, false]]) {
    c.repere({ x: x1 + 0.6, z: zc, ry: Math.PI / 2 }, () => {
      c.boite(1.0, 1.85, 0.75, 0x3a3d40, { y: 0.93, z: -0.1 }, M.tole);
      if (ouvert) {
        c.repere({ x: 0.5, z: 0.28, ry: 1.2 }, () => panneau(c, M.enseignes, r, { x: -0.48, y: 0.93 }, 0.96, 1.8));
      } else panneau(c, M.enseignes, r, { y: 0.93, z: 0.28 }, 0.96, 1.8);
    });
  }
  rect(b, x1 + 0.55, 15.8, 0.8, 2.2, 0, "distributeurs");
  jonchee(c, x1 + 0.8, 14, x1 + 3.2, 17.5, 18, [0xc8362b, 0xc79a3b, 0x9aa0a3, 0x2f6f73, 0xe0d6c0], 0.03);

  // Les toilettes « à nettoyage autonome », payables par l'appli : une capsule ronde, porte coulissante bloquée
  c.repere({ x: -15.2, z: 15.6, ry: 0.35 }, () => {
    c.poser(new THREE.CylinderGeometry(1.2, 1.25, 2.6, 10), M.satin, 0xd4d8d4, { y: 1.3 }, {});
    c.poser(new THREE.CylinderGeometry(1.35, 1.25, 0.25, 10), M.satin, 0x2f6f73, { y: 2.72 }, {});
    panneau(c, M.enseignes, R.wcAuto, { x: 0, y: 1.7, z: 1.24 }, 0.95, 0.72);
    c.boite(0.8, 2.0, 0.05, 0x9aa0a3, { x: 0.15, y: 1.0, z: 1.22 }, M.metal);
    c.boite(0.6, 0.04, 0.45, 0x1f2a44, { y: 2.92, rx: -0.2 }, M.lisse);
  });
  rect(b, -15.2, 15.6, 2.4, 2.4, 0.35, "toilettes autonettoyantes");
  // La borne « Pause bien-être connectée : respirez 3 minutes »
  c.repere({ x: -16.9, z: 11.2, ry: 0.2 }, () => {
    c.boite(0.6, 1.7, 0.35, 0xe8e4dc, { y: 0.85 }, M.satin);
    panneau(c, M.enseignes, R.bienEtre, { y: 1.05, z: 0.18 }, 0.56, 0.94);
    c.boite(0.9, 0.1, 0.6, 0x9a958a, { y: 0.05 }, M.beton);
  });
  rect(b, -16.9, 11.2, 0.6, 0.35, 0.2, "borne");
  // Bancs et poubelles devant le bloc
  poubelles(ctx, -33.6, 11.6, 2);
  semerTouffes(c, x0 - 1, z0 - 1.5, x1 + 1, z0 - 0.2, Math.round(16 * u), C.herbeSeche);
  semerTouffes(c, x0 - 1, z1 + 0.3, x1 + 1, z1 + 1.4, Math.round(16 * u), C.herbeSeche);
}

/** La porte de la cabine pour handicapés, qui bat au vent (un objet à part, animé). */
function porteQuiBat(ctx, x, z) {
  const ch = new Chantier(7);
  const M = matieres();
  ch.boite(1.0, 2.05, 0.05, C.porte, { x: 0.5, y: 1.06 }, M.satin);
  ch.boite(0.12, 0.12, 0.06, 0xd8d4cc, { x: 0.85, y: 1.05, z: 0.03 }, M.metal);
  panneau(ch, M.enseignes, [R.pictos[0] + 170, R.pictos[1], 86, R.pictos[3]], { x: 0.5, y: 1.6, z: 0.03 }, 0.35, 0.4);
  const pivot = new THREE.Group();
  pivot.position.set(x, 0.05, z);
  pivot.add(ch.construire());
  let phase = 0;
  pivot.userData.animer = (t) => {
    // Des rafales : la porte s'ouvre d'un coup, hésite, et claque
    phase = t;
    const r = Math.max(0, Math.sin(phase * 0.8)) ** 3 * 0.9 + Math.max(0, Math.sin(phase * 2.3 + 1)) ** 6 * 0.25;
    pivot.rotation.y = -0.08 - r;
  };
  pivot.userData.mobile = true;
  ctx.b.ajouter(pivot);
  ctx.mobiles.push(pivot);
}

function tableBeton(c, x, z, ry, renversee = false) {
  const M = matieres();
  c.repere({ x, z, ry, rz: renversee ? 1.35 : 0 }, () => {
    const y0 = renversee ? 0.42 : 0;
    c.boite(2.0, 0.09, 0.8, 0xc9c3b5, { y: y0 + 0.74 }, M.beton);
    for (const s of [-1, 1]) {
      c.boite(2.0, 0.07, 0.3, 0xc9c3b5, { y: y0 + 0.44, z: s * 0.68 }, M.beton);
      c.boite(0.14, 0.72, 1.6, 0xb8b2a2, { x: s * 0.75, y: y0 + 0.36 }, M.beton);
    }
  });
}

function piqueNique(ctx) {
  const { c, b, u } = ctx;
  const M = matieres();
  // Les tables en béton sous les platanes
  for (const [x, z, ry] of [[-13.5, 27.5, 0.1], [-6, 27.8, -0.15], [-14, 21.8, 0.3], [-21, 26.8, 0]]) {
    tableBeton(c, x, z, ry);
    rect(b, x, z, 2.0, 1.6, ry, "table de pique-nique");
  }
  tableBeton(c, -3.6, 15.2, 0.6, u > 0.5);
  // L'abri en bois et sa tôle ondulée : les survivants y ont fait leur feu
  const ax = -6.5;
  const az = 20;
  const abri = b.couche("abri-pique-nique", { x: ax, z: az, l: 8.6, p: 5.6 }, 2.2, 3.4);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    c.boite(0.18, 2.75, 0.18, C.bois, { x: ax + sx * 3.8, y: 1.37, z: az + sz * 2.3 }, M.mat);
    b.obstacle(ax + sx * 3.8 - 0.1, az + sz * 2.3, ax + sx * 3.8 + 0.1, az + sz * 2.3, "poteau");
  }
  abri.boite(8.0, 0.12, 0.18, C.bois, { x: ax, y: 2.75, z: az - 2.3 }, M.mat);
  abri.boite(8.0, 0.12, 0.18, C.bois, { x: ax, y: 2.55, z: az + 2.3 }, M.mat);
  const effondre = u > 0.85;
  for (let i = 0; i < 6; i++) {
    const tombee = effondre && i === 4;
    abri.boite(1.45, 0.05, 5.5, i % 2 ? 0x8a7a66 : 0x9a8a72, tombee ? { x: ax - 3.6 + i * 1.45 + 0.4, y: 1.2, z: az + 0.2, rx: 0.1, rz: 0.9 } : { x: ax - 3.6 + i * 1.45, y: 2.88, z: az, rx: 0.04 }, M.tole, { nuance: 0.08 });
  }
  tableBeton(c, ax - 2.4, az - 0.6, Math.PI / 2 + 0.2);
  rect(b, ax - 2.4, az - 0.6, 2.0, 1.6, Math.PI / 2 + 0.2, "table");
  // Le feu : un cercle de pierres, des braises, des bûches ; un pare-vent de palettes ; des couchages
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    c.poser(BOULE, M.mat, 0x8f8a80, { x: ax + 0.8 + Math.cos(a) * 0.6, y: 0.1, z: az + 0.4 + Math.sin(a) * 0.6, e: [0.18, 0.13, 0.15], ry: a }, {});
  }
  for (let i = 0; i < 4; i++) c.tube([ax + 0.8 + Math.cos(i * 1.6) * 0.45, 0.06, az + 0.4 + Math.sin(i * 1.6) * 0.45], [ax + 0.8, 0.32, az + 0.4], 0.05, 0x3a2a1e, M.mat, 4);
  c.poser(CONE, M.lueur, 0xffffff, { x: ax + 0.8, y: 0.45, z: az + 0.4, e: [0.3, 0.6, 0.3] }, { crasse: false, nuance: 0 });
  c.poser(CONE, M.lueur, 0xffffff, { x: ax + 0.9, y: 0.35, z: az + 0.35, e: [0.2, 0.4, 0.2], ry: 1 }, { crasse: false, nuance: 0 });
  for (let i = 0; i < 3; i++) c.boite(1.2, 0.14, 0.8, 0x9a7e5a, { x: ax + 3.2, y: 0.07 + i * 0.15, z: az + 1.6, ry: 0.1 * i }, M.mat);
  c.boite(0.14, 1.2, 1.2, 0x9a7e5a, { x: ax + 3.6, y: 0.6, z: az - 0.6 }, M.mat);
  c.boite(1.9, 0.12, 0.75, 0x4c6a9a, { x: ax + 1.6, y: 0.06, z: az - 1.4, ry: 0.2 }, M.toile);
  c.boite(1.9, 0.12, 0.75, 0x7a5a3c, { x: ax - 0.4, y: 0.06, z: az + 1.7, ry: -0.3 }, M.toile);
  c.boite(0.3, 0.45, 0.2, 0x5a7a4a, { x: ax + 3.3, y: 0.22, z: az - 1.6 }, M.satin);
  c.poser(cyl(0.12, 0.18, 8), M.metal, 0x6a6e70, { x: ax + 1.3, y: 0.09, z: az + 0.9 }, {});
  // Bois de réserve, empilé contre un poteau
  for (let i = 0; i < 6; i++) c.tube([ax - 3.6, 0.1 + (i % 3) * 0.18, az + 1.2 + Math.floor(i / 3) * 0.18], [ax - 2.6, 0.1 + (i % 3) * 0.18, az + 1.2 + Math.floor(i / 3) * 0.18], 0.08, 0x6a5040, M.mat, 5);
  b.lumiere(ax + 0.8, 0.6, az + 0.4, 0xff9a4a, 12, 14, "feu des survivants sous l'abri des tables");
  jonchee(c, -24, 13, -1, 30, Math.round(60 * (0.4 + u)));
}

function aireDeJeux(ctx) {
  const { c, b, u } = ctx;
  const M = matieres();
  // Le sol souple, rouge passé, déchiré par endroits
  c.pave(-49, 0, 16.5, -38.5, 0.05, 28, 0xa0675a, M.mat, { crasse: false, nuance: 0 });
  for (let i = 0; i < 6; i++) c.boite(c.entre(0.6, 1.4), 0.012, c.entre(0.4, 1.0), 0x7a6a4a, { x: c.entre(-48, -39.5), y: 0.055, z: c.entre(17, 27.5), ry: c.hasard() * 3 }, M.mat, { crasse: false });
  // La petite barrière de bois
  for (let x = -49; x <= -38.5; x += 1.5) c.boite(0.1, 0.8, 0.1, C.boisGris, { x, y: 0.4, z: 16.5 }, M.mat);
  c.pave(-49, 0.6, 16.47, -41, 0.7, 16.53, C.boisGris, M.mat);
  b.obstacle(-49, 16.5, -41, 16.5, "barrière");
  // Le toboggan : échelle, plate-forme à toit pointu, glissière
  const tx = -46.5;
  const tz = 20;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.tube([tx + sx * 0.6, 0, tz + sz * 0.6], [tx + sx * 0.6, 2.6, tz + sz * 0.6], 0.05, C.rouille, M.tole, 5);
  c.boite(1.3, 0.08, 1.3, 0x8a6a4a, { x: tx, y: 1.5, z: tz }, M.mat);
  c.poser(CONE, M.tole, 0xa4552f, { x: tx, y: 2.95, z: tz, ry: Math.PI / 4, e: [1.05, 0.7, 1.05] }, {});
  for (let y = 0.3; y < 1.5; y += 0.3) c.boite(0.6, 0.05, 0.08, C.rouille, { x: tx - 0.95, y, z: tz, ry: Math.PI / 2 }, M.tole);
  c.boite(2.8, 0.06, 0.6, 0xb8a03a, { x: tx + 1.75, y: 0.8, z: tz, rz: -0.55 }, M.satin);
  for (const s of [-1, 1]) c.boite(2.8, 0.2, 0.05, 0xb8a03a, { x: tx + 1.75, y: 0.88, z: tz + s * 0.3, rz: -0.55 }, M.satin);
  rect(b, tx, tz, 1.3, 1.3, 0, "toboggan");
  // La balançoire : portique en A, une balançoire qui pend, l'autre tombée
  const bx = -43;
  const bz = 25.6;
  for (const s of [-1, 1]) {
    c.tube([bx + s * 1.8, 0, bz - 0.8], [bx + s * 1.8, 2.3, bz], 0.06, C.rouille, M.tole, 5);
    c.tube([bx + s * 1.8, 0, bz + 0.8], [bx + s * 1.8, 2.3, bz], 0.06, C.rouille, M.tole, 5);
  }
  c.tube([bx - 1.9, 2.3, bz], [bx + 1.9, 2.3, bz], 0.06, C.rouille, M.tole, 5);
  for (const s of [-0.7, 0.7]) c.tube([bx - 0.7 + s * 0.25, 2.3, bz], [bx - 0.7 + s * 0.25, 0.55, bz + 0.15], 0.012, 0x6a6e70, M.metal, 3);
  c.boite(0.55, 0.05, 0.22, 0x2e2f30, { x: bx - 0.7, y: 0.52, z: bz + 0.15, rx: 0.15 }, M.mat);
  c.tube([bx + 0.7 - 0.17, 2.3, bz], [bx + 0.7 - 0.17, 1.1, bz], 0.012, 0x6a6e70, M.metal, 3);
  c.boite(0.55, 0.05, 0.22, 0x2e2f30, { x: bx + 0.8, y: 0.07, z: bz + 0.6, ry: 0.6 }, M.mat);
  b.obstacle(bx - 1.8, bz - 0.8, bx - 1.8, bz + 0.8, "portique");
  b.obstacle(bx + 1.8, bz - 0.8, bx + 1.8, bz + 0.8, "portique");
  // Le tourniquet et le cheval à ressort
  c.poser(new THREE.CylinderGeometry(1.0, 1.0, 0.08, 10), M.tole, 0x4c6a9a, { x: -40.6, y: 0.3, z: 22.2, rz: u > 0.6 ? 0.08 : 0 }, {});
  c.tube([-40.6, 0, 22.2], [-40.6, 0.95, 22.2], 0.05, C.rouille, M.tole, 5);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    c.tube([-40.6 + Math.cos(a) * 0.85, 0.34, 22.2 + Math.sin(a) * 0.85], [-40.6 + Math.cos(a) * 0.3, 0.95, 22.2 + Math.sin(a) * 0.3], 0.03, C.rouille, M.tole, 4);
  }
  rect(b, -40.6, 22.2, 1.6, 1.6, 0, "tourniquet");
  c.tube([-41.5, 0, 18.6], [-41.5, 0.4, 18.6], 0.12, 0x6a6e70, M.metal, 6);
  c.boite(0.9, 0.35, 0.3, 0xc79a3b, { x: -41.5, y: 0.65, z: 18.6 }, M.satin);
  c.boite(0.25, 0.4, 0.25, 0xc79a3b, { x: -41.05, y: 0.95, z: 18.6, rz: -0.3 }, M.satin);
  // Le panneau « Aire de jeux connectée »
  c.repere({ x: -40, z: 16.9, ry: 0.3 }, () => {
    c.boite(0.08, 1.6, 0.08, 0x6a6e70, { y: 0.8 }, M.metal);
    panneau(c, M.enseignes, R.jeux, { y: 1.3, z: 0.05 }, 1.2, 0.48);
  });
  semerTouffes(c, -49, 16.6, -38.5, 28, Math.round(30 * u), C.herbe, 0.05);
}

function parkingVL(ctx) {
  const { c } = ctx;
  // Les voitures du parking, nez vers le sud ; celle du chien en peluche est devant le bloc
  const places = [
    [-46.3, 8.2, { type: "break", couleur: TEINTES_VOITURES[3], coffreToit: true }],
    [-41.3, 8.3, { couleur: TEINTES_VOITURES[1], peluche: true }],
    [-36.2, 8.0, { type: "monospace", couleur: TEINTES_VOITURES[7], ouverte: true }],
    [-21.3, 8.4, { couleur: TEINTES_VOITURES[0] }],
    [-8.8, 8.2, { type: "break", couleur: TEINTES_VOITURES[5], velos: true }],
  ];
  for (const [x, z, o] of places) voiture(ctx, c, x, z, -Math.PI / 2 + (c.hasard() - 0.5) * 0.12, o);
  // Épaves sur l'autoroute
  voiture(ctx, c, -30, -13.4, 0.08, { couleur: TEINTES_VOITURES[6] });
  voiture(ctx, c, -9, -25.5, Math.PI - 0.12, { type: "monospace", couleur: TEINTES_VOITURES[2] });
  voiture(ctx, c, -42, -15.2, -0.05, { type: "break", couleur: TEINTES_VOITURES[9] });
}

// ---------- La passerelle, la citerne, les camping-cars ----------

function passerelle(ctx) {
  const { c, b, u } = ctx;
  const M = matieres();
  const { x, y, z1, z2 } = PASSERELLE;
  const larg = 3.0;
  const tablier = b.couche("passerelle", { x, z: (z1 + z2) / 2, l: larg + 2, p: z2 - z1 + 1 }, y - 0.6, y + 3.2);
  // Les piles en béton (toujours là) : au pied du talus nord, dans le terre-plein, entre l'autoroute et l'aire
  for (const zp of [-31.8, ZN.tpc, -6.4]) {
    c.boite(1.0, y - 0.3, 1.0, C.betonSombre, { x, y: (y - 0.3) / 2, z: zp }, M.beton);
    c.boite(larg + 0.6, 0.5, 1.2, C.betonSombre, { x, y: y - 0.25, z: zp }, M.beton);
    rect(b, x, zp, 1.0, 1.0, 0, "pile de la passerelle");
  }
  // Le tablier : dalle, poutres treillis vert d'eau, grillage en cage, arceaux
  tablier.pave(x - larg / 2, y, z1, x + larg / 2, y + 0.25, z2, C.beton, M.beton, { crasse: false });
  for (const s of [-1, 1]) {
    const xs = x + s * (larg / 2 + 0.05);
    tablier.pave(xs - 0.07, y - 0.4, z1, xs + 0.07, y - 0.1, z2, C.acierPeint, M.tole);
    tablier.pave(xs - 0.06, y + 1.25, z1, xs + 0.06, y + 1.35, z2, C.acierPeint, M.tole);
    for (let z = z1; z < z2 - 0.1; z += 2.2) {
      const zb = Math.min(z2, z + 2.2);
      tablier.poutre([xs, y + 0.2, z], [xs, y + 1.3, zb], 0.07, C.acierPeint, M.tole);
      tablier.poutre([xs, y + 0.2, z], [xs, y + 2.6, z], 0.07, C.acierPeint, M.tole);
      // un pan de grillage arraché quand l'usure monte
      const arrache = u > 0.7 && Math.abs(z + 14) < 1.5 && s > 0;
      if (!arrache) panneau(tablier, M.enseignes, R.grillage, { x: xs, y: y + 1.45, z: (z + zb) / 2, ry: Math.PI / 2 }, zb - z, 2.4, 0xc4c8c4);
    }
  }
  for (let z = z1 + 1.1; z < z2; z += 4.4) {
    tablier.poutre([x - larg / 2 - 0.05, y + 2.6, z], [x, y + 3.15, z], 0.06, C.acierPeint, M.tole);
    tablier.poutre([x + larg / 2 + 0.05, y + 2.6, z], [x, y + 3.15, z], 0.06, C.acierPeint, M.tole);
  }
  panneau(tablier, M.enseignes, R.graffiti, { x: x + larg / 2 + 0.16, y: y - 0.25, z: -2, ry: Math.PI / 2 }, 7, 0.55);
  // Un sac de couchage et des canettes là-haut : quelqu'un y guette
  tablier.boite(1.8, 0.12, 0.7, 0x4c6a9a, { x: x - 0.6, y: y + 0.32, z: -13 }, M.toile);
  tablier.boite(0.5, 0.35, 0.35, 0x5a6a4a, { x: x + 0.7, y: y + 0.42, z: -12 }, M.toile);

  // La tour d'escalier, au sud : volées en zigzag, garde-corps ; la volée du bas s'est effondrée
  const esc = b.couche("escalier-passerelle", { x, z: 12.7, l: 5.6, p: 5.6 }, 2.0, y + 1.5);
  const ex0 = x - 2.2;
  const ex1 = x + 2.2;
  for (const [px, pz] of [[ex0, 10.4], [ex1, 10.4], [ex0, 15], [ex1, 15]]) {
    c.boite(0.3, 2.0, 0.3, C.betonSombre, { x: px, y: 1.0, z: pz }, M.beton);
    esc.boite(0.3, y - 2.0, 0.3, C.betonSombre, { x: px, y: 2.0 + (y - 2.0) / 2, z: pz }, M.beton);
    rect(b, px, pz, 0.3, 0.3, 0, "poteau d'escalier");
  }
  // paliers et volées (couche), un palier intermédiaire bas (toujours visible, mais sans accès)
  esc.pave(ex0, y - 0.25, 10.2, ex1, y, 11.8, C.beton, M.beton);
  esc.pave(ex0, y / 2 - 0.2, 13.6, ex1, y / 2, 15.2, C.beton, M.beton);
  const volee = (k, za, ya, zb, yb, xc) => {
    const lg = Math.hypot(zb - za, yb - ya);
    k.boite(1.2, 0.22, lg, C.beton, { x: xc, y: (ya + yb) / 2, z: (za + zb) / 2, rx: Math.atan2(yb - ya, zb - za) * -1 }, M.beton);
    for (let i = 1; i < 10; i++) {
      const t = i / 10;
      k.boite(1.2, 0.18, 0.12, 0xb7b0a0, { x: xc, y: ya + (yb - ya) * t + 0.12, z: za + (zb - za) * t }, M.beton);
    }
    for (const s of [-1, 1]) k.poutre([xc + s * 0.6, ya + 1.0, za], [xc + s * 0.6, yb + 1.0, zb], 0.05, C.acierPeint, M.tole);
  };
  volee(esc, 13.6, y / 2, 11.8, y - 0.1, x + 1.2);
  volee(esc, 11.6, 2.0, 13.6, y / 2 - 0.1, x - 1.2);
  // la volée du bas, tombée en travers (on ne monte plus)
  c.repere({ x: x - 1.2, y: 0.4, z: 9.8, rx: 0.12, rz: 0.25 }, () => {
    c.boite(1.2, 0.22, 3.2, C.beton, {}, M.beton);
    for (let i = 0; i < 6; i++) c.boite(1.2, 0.16, 0.12, 0xb7b0a0, { y: 0.15, z: -1.4 + i * 0.5 }, M.beton);
  });
  rect(b, x - 1.2, 9.8, 1.4, 3.2, 0, "volée d'escalier effondrée");
  gravats(c, x - 0.6, 11.2, 1.2, 10, [C.beton, 0xb7b0a0, 0x8e9599]);
  // La descente nord, sur le talus (hors de la halte)
  tablier.pave(x - 1, 2.6, z1 - 1.5, x + 1, y, z1, C.beton, M.beton);
}

function chicane(ctx) {
  const { c, b } = ctx;
  const M = matieres();
  // Sous la passerelle, sur la bretelle : la barricade des pillards (palettes, pneus, caddies), la voiture retournée
  const x = PASSERELLE.x;
  for (let i = 0; i < 4; i++) {
    c.boite(1.2, 0.14, 1.0, 0x9a7e5a, { x: x - 2.6, y: 0.07 + i * 0.15, z: -1.4 + i * 0.05, ry: 0.1 * i }, M.mat, { nuance: 0.1 });
    c.boite(0.14, 1.0, 1.2, 0x9a7e5a, { x: x - 2.2 + (i % 2) * 0.2, y: 0.5, z: 0.0 + i * 0.9 }, M.mat, { nuance: 0.1 });
  }
  for (let i = 0; i < 5; i++) c.poser(new THREE.TorusGeometry(0.38, 0.14, 4, 8), M.mat, C.pneu, { x: x - 3.0 + (i % 2) * 0.3, y: 0.14 + Math.floor(i / 2) * 0.26, z: 1.9 + (i % 2) * 0.1, rx: Math.PI / 2 }, {});
  for (let i = 0; i < 2; i++) {
    c.repere({ x: x - 1.8, z: 2.9 + i * 0.4, ry: 0.4 + i * 0.3, rz: i ? 1.4 : 0 }, () => {
      c.boite(0.9, 0.04, 0.55, 0x9aa0a3, { y: 0.75 }, M.metal);
      for (const s of [-1, 1]) c.boite(0.9, 0.5, 0.02, 0x9aa0a3, { y: 0.95, z: s * 0.27 }, M.metal);
      for (const s of [-1, 1]) c.boite(0.02, 0.75, 0.55, 0x9aa0a3, { x: s * 0.45, y: 0.4 }, M.metal);
    });
  }
  b.obstacle(x - 2.6, -2, x - 2.6, 3.6, "barricade");
  // la pancarte
  c.repere({ x: x - 3.3, z: 1.0, ry: 0.15 }, () => {
    c.boite(0.08, 2.0, 0.08, C.bois, { y: 1.0 }, M.mat);
    panneau(c, M.enseignes, R.peage, { y: 1.75, z: 0.05 }, 1.6, 0.32);
  });
  voiture(ctx, c, x + 2.6, 2.0, Math.PI / 2 + 0.3, { couleur: TEINTES_VOITURES[8], retournee: true });
  // la voiture plantée contre la pile, côté nord
  voiture(ctx, c, x - 0.4, -4.2, 0.6, { couleur: TEINTES_VOITURES[2] });
}

function campingCarVisite(ctx) {
  const { c, b, u } = ctx;
  const M = matieres();
  const { x, z } = CC;
  const L0 = -3.5;
  const L1 = 3.4;
  const W = 1.15;
  const yS = 0.14;
  const coul = new THREE.Color(C.creme).lerp(new THREE.Color(0x9a9a7a), 0.2 * u).getHex();
  const haut = b.couche("camping-car", { x, z: z + 0.8, l: 7.6, p: 5.2 }, 1.05, 3.4);
  // Pneus à plat, jantes dans le gravier : le plancher touche presque le sol
  c.pave(x + L0, 0, z - W, x + L1, yS, z + W, 0x8a8478, M.mat, { crasse: false });
  for (const sx of [-2.2, 2.3]) for (const sz of [-1, 1]) c.poser(ROUE, M.mat, C.pneu, { x: x + sx, y: 0.2, z: z + sz * 1.05, rx: Math.PI / 2, e: [1, 1, 1] }, { crasse: false });
  // Parois basses (toujours là) et parois hautes (la couche) : nord pleine, sud avec la porte et la déchirure
  const porte = [x - 0.3, x + 0.5];
  const dechire = u > 0.3 ? [x + 0.5, x + 1.4] : null;
  const ep = 0.06;
  c.pave(x + L0, yS, z - W, x + L1 - 1.2, 2.35, z - W + ep, coul, M.satin);
  c.pave(x + L0, yS, z - W, x + L0 + ep, 2.35, z + W, coul, M.satin);
  const sud = [[x + L0, porte[0]], [dechire ? dechire[1] : porte[1], x + L1 - 1.2]];
  for (const [a, e] of sud) c.pave(a, yS, z + W - ep, e, 1.05, z + W, coul, M.satin);
  for (const [a, e] of sud) haut.pave(a, 1.05, z + W - ep, e, 2.35, z + W, coul, M.satin);
  if (dechire) {
    haut.pave(dechire[0], 1.6, z + W - ep, dechire[1], 2.35, z + W, coul, M.satin);
    // le pan arraché, au sol
    c.boite(0.9, 0.04, 1.0, coul, { x: dechire[0] + 0.5, y: 0.05, z: z + W + 0.8, ry: 0.4 }, M.satin);
  }
  haut.pave(porte[0], 2.05, z + W - ep, porte[1], 2.35, z + W, coul, M.satin);
  for (const s of [-1, 1]) {
    panneau(haut, M.enseignes, R.cc, { x: x - 0.5, y: 1.35, z: z + s * (W + 0.01), ry: s < 0 ? Math.PI : 0 }, 5.6, 0.45);
  }
  // La porte, ouverte en grand ; la marchepied
  c.boite(0.05, 1.85, 0.75, 0xdcd8cc, { x: porte[0] - 0.02, y: 1.08, z: z + W + 0.38, ry: 0.15 }, M.satin);
  c.boite(0.8, 0.06, 0.35, 0x8e9599, { x: (porte[0] + porte[1]) / 2, y: 0.08, z: z + W + 0.2 }, M.metal);
  // La cabine avant (basse) et la capucine (couche)
  c.pave(x + L1 - 1.2, yS, z - W, x + L1, 1.05, z + W, 0xe6e2d8, M.satin);
  haut.pave(x + L1 - 1.2, 1.05, z - W, x + L1 - 0.6, 2.0, z + W, 0xe6e2d8, M.satin);
  haut.boite(0.08, 0.8, 2.1, 0xffffff, { x: x + L1 - 0.35, y: 1.5, z, rz: 0.3 }, M.verre, { crasse: false });
  haut.pave(x + L1 - 2.4, 2.35, z - W - 0.02, x + L1 - 0.2, 3.0, z + W + 0.02, coul, M.satin);
  haut.pave(x + L0, 2.35, z - W - 0.02, x + L1 - 2.4, 2.55, z + W + 0.02, coul, M.satin);
  // fenêtres hautes (couche)
  for (const xf of [x - 2.3, x + 1.6]) haut.boite(0.9, 0.5, 0.03, 0xffffff, { x: xf, y: 1.75, z: z - W - 0.01 }, M.verre, { crasse: false });
  haut.boite(0.8, 0.5, 0.03, 0xffffff, { x: x - 2.4, y: 1.75, z: z + W + 0.01 }, M.verre, { crasse: false });
  // le panneau solaire du toit, l'échelle
  haut.boite(1.6, 0.05, 1.0, 0x1f2a44, { x: x - 1.6, y: 2.6, z }, M.lisse);
  for (let yy = 0.6; yy < 2.6; yy += 0.4) c.boite(0.04, 0.03, 0.4, C.acier, { x: x + L0 - 0.06, y: yy, z: z - 0.5 }, M.metal);
  // Le store banne déployé et déchiré, sur ses deux pieds (couche)
  for (const xs of [x - 2.6, x + 1.8]) c.tube([xs, 0, z + W + 2.2], [xs, 2.3, z + W + 2.2], 0.03, 0x8e9599, M.metal, 4);
  haut.boite(5.0, 0.03, 2.3, 0x2f6f73, { x: x - 0.4, y: 2.35, z: z + W + 1.1, rx: -0.1 }, M.toile);
  if (u > 0.5) haut.boite(1.2, 0.9, 0.03, 0x2f6f73, { x: x - 2.0, y: 1.9, z: z + W + 2.25, rx: 0.2 }, M.toile);
  // La banderole de la fête de départ, sous le store
  panneau(haut, M.enseignes, R.banderole, { x: x - 0.4, y: 2.05, z: z + W + 2.25 }, 3.6, 0.6);
  // Les ballons dégonflés, accrochés au rétroviseur et au pied du store
  const tons = [0xb84a3c, 0xc79a3b, 0x4c6a9a, 0x6f9650];
  for (let i = 0; i < 5; i++) {
    const bx = x + 1.8 + (i % 2) * 0.2;
    const by = 1.1 + i * 0.22;
    const bz = z + W + 2.25 + (i - 2) * 0.14;
    c.tube([x + 1.8, 2.25, z + W + 2.2], [bx, by + 0.25, bz], 0.006, 0xdcd8cc, M.mat, 3);
    c.poser(BOULE, M.lisse, tons[i % 4], { x: bx, y: by, z: bz, e: [0.18, 0.12 + (i % 2) * 0.04, 0.1], rz: 0.6 + i * 0.3 }, { crasse: false });
  }
  // L'intérieur : lit au fond, coin cuisine, dînette avec la lanterne, placards, désordre
  c.pave(x + L0 + 0.06, yS, z - W + 0.06, x + L0 + 1.9, 0.62, z + W - 0.06, 0x8a7a63, M.mat);
  c.pave(x + L0 + 0.1, 0.62, z - W + 0.1, x + L0 + 1.85, 0.78, z + W - 0.1, 0xd8cdb4, M.toile);
  c.boite(0.6, 0.12, 0.4, 0xe8e0cc, { x: x + L0 + 0.5, y: 0.85, z: z - 0.5 }, M.toile);
  c.pave(x - 0.3, yS, z - W + 0.06, x + 1.4, 0.95, z - W + 0.62, 0xc8bfae, M.satin);
  c.boite(0.4, 0.04, 0.35, 0x9aa0a3, { x: x + 0.1, y: 0.97, z: z - W + 0.35 }, M.metal);
  c.boite(0.5, 0.05, 0.4, 0x2e2f30, { x: x + 0.85, y: 0.97, z: z - W + 0.35 }, M.metal);
  c.pave(x - 1.6, 1.4, z - W + 0.06, x + 1.4, 1.95, z - W + 0.45, 0xc8bfae, M.satin);
  // dînette (deux banquettes face à face et la table)
  for (const dx of [1.35, 2.4]) c.pave(x + dx - 0.25, yS, z - 0.2, x + dx + 0.25, 0.6, z + W - 0.08, 0x6a7f8c, M.toile);
  c.boite(0.7, 0.05, 0.9, 0xb8a27a, { x: x + 1.88, y: 0.82, z: z + 0.5 }, M.satin);
  c.tube([x + 1.88, yS, z + 0.5], [x + 1.88, 0.8, z + 0.5], 0.03, 0x8e9599, M.metal, 4);
  // la lanterne allumée sur la table
  c.poser(cyl(0.08, 0.22, 6), M.lueur, 0xffffff, { x: x + 1.88, y: 0.97, z: z + 0.5 }, { crasse: false, nuance: 0 });
  c.boite(0.18, 0.03, 0.18, 0x3a3d40, { x: x + 1.88, y: 1.1, z: z + 0.5 }, M.metal);
  b.lumiere(x + 1.88, 1.1, z + 0.5, 0xffc27a, 6, 8, "lanterne allumée dans le camping-car (quelqu'un y dort encore)");
  // désordre : vaisselle, vêtements, cartes routières
  jonchee(c, x + L0 + 2, z - 0.6, x + 1.2, z + 0.9, 16, [0xc8362b, 0xe0d6c0, 0x4c6a9a, 0xc79a3b], yS + 0.01);
  // Les obstacles (parois)
  b.obstacle(x + L0, z - W, x + L1, z - W, "paroi du camping-car");
  b.obstacle(x + L0, z - W, x + L0, z + W, "paroi du camping-car");
  b.obstacle(x + L1, z - W, x + L1, z + W, "cabine du camping-car");
  for (const [a, e] of sud) b.obstacle(a, z + W, e, z + W, "paroi du camping-car");
  // Les valises ouvertes, dehors, et leur contenu
  for (const [vx, vz, ry, col] of [[x + 0.4, z + W + 1.5, 0.3, 0x7a3a3a], [x + 1.6, z + W + 2.7, -0.5, 0x3a4a6a]]) {
    c.boite(0.75, 0.12, 0.5, col, { x: vx, y: 0.06, z: vz, ry }, M.satin);
    c.boite(0.75, 0.5, 0.06, col, { x: vx - Math.sin(ry) * 0.28, y: 0.28, z: vz - Math.cos(ry) * 0.28, ry, rx: -0.3 }, M.satin);
  }
  jonchee(c, x - 0.6, z + W + 1, x + 2.6, z + W + 3.4, 22, [0xc8362b, 0xe0d6c0, 0x2f6f73, 0xc79a3b, 0xd8b0a0], 0.03);
  // Chaises pliantes renversées, une glacière
  c.boite(0.45, 0.04, 0.45, 0x4c6a9a, { x: x - 1.6, y: 0.04, z: z + W + 1.6, ry: 0.5 }, M.toile);
  c.boite(0.45, 0.45, 0.04, 0x4c6a9a, { x: x - 1.9, y: 0.25, z: z + W + 1.3, rx: 1.2 }, M.toile);
  c.boite(0.6, 0.4, 0.4, 0x2f6f73, { x: x - 2.8, y: 0.2, z: z + W + 1.0 }, M.satin);
}

function troncon3(ctx) {
  const { c, b, u } = ctx;
  const M = matieres();
  passerelle(ctx);
  chicane(ctx);
  campingCarVisite(ctx);
  // Le camion-citerne couché sous la passerelle : il ferme les deux chaussées
  citerne(ctx, c, 21.5, -14.5, 0.95);
  // Le carambolage contre la citerne (chaussée nord) : plus de passage
  voiture(ctx, c, 13.5, -24.5, 0.25, { type: "monospace", couleur: TEINTES_VOITURES[4] });
  voiture(ctx, c, 9.2, -22.6, -0.4, { couleur: TEINTES_VOITURES[9], rz: 0.15 });
  voiture(ctx, c, 17.5, -27.5, 0.6, { type: "break", couleur: TEINTES_VOITURES[5] });
  voiture(ctx, c, 26, -25.2, 2.4, { couleur: TEINTES_VOITURES[1] });
  voiture(ctx, c, 5.5, -12.8, 0.05, { type: "break", couleur: TEINTES_VOITURES[0], coffreToit: true });
  voiture(ctx, c, 30.5, -9.8, 1.1, { couleur: TEINTES_VOITURES[3] });
  b.obstacle(13, -30.3, 18, -21, "carambolage");
  b.obstacle(18, -21, 25.4, -19.9, "carambolage");
  // Débris de la collision
  debris(c, 12, -27, 30, -9, Math.round(30 + 40 * u), [0x9aa0a3, 0xd8d4c4, 0x3a3b3c, 0xbfbab0], 0.03);
  // Les autres camping-cars en épi
  campingCar(ctx, c, 34.2, 13.4, 0.65);
  campingCar(ctx, c, 41.6, 16.4, 0.65, { penche: 0.04 });
  campingCar(ctx, c, 30, 23, 0.15);
  // Le portique à messages variables au-dessus de la chaussée nord (il luit encore)
  const px = 46.5;
  const portique = b.couche("portique", { x: px, z: -25, l: 3, p: 13 }, 5.6, 8.6);
  for (const zp of [-31, ZN.tpc]) {
    c.boite(0.5, 6.4, 0.5, 0x8e9599, { x: px, y: 3.2, z: zp }, M.metal);
    c.boite(1.0, 0.4, 1.0, C.betonSombre, { x: px, y: 0.2, z: zp }, M.beton);
    rect(b, px, zp, 0.6, 0.6, 0, "pied du portique");
  }
  portique.pave(px - 0.3, 6.3, -31.2, px + 0.3, 6.9, ZN.tpc + 0.2, 0x8e9599, M.metal);
  portique.boite(0.5, 1.7, 6.6, 0x2e2f30, { x: px, y: 7.6, z: -25.2 }, M.tole);
  panneau(portique, M.neon, R.pmv, { x: px + 0.26, y: 7.6, z: -25.2, ry: Math.PI / 2 }, 6.4, 1.6, 0xd8c8a8);
  b.lumiere(px + 1.5, 7.2, -25.2, 0xffb33a, 3, 10, "portique à messages : « Votre prochaine pause dans 2 h 14 » (il luit encore)");
  // Arbres et jonchée
  jonchee(c, 0, 6, 50, 29, Math.round(40 * (0.4 + u)));
}

function troncon4(ctx) {
  const { c, b, u } = ctx;
  const M = matieres();
  const remorque1 = b.couche("remorque-frigo", { x: 66, z: 17, l: 12.5, p: 12.5 }, 1.3, 4.3);
  const remorque2 = b.couche("remorque-bachee", { x: 80, z: 15, l: 12.5, p: 12.5 }, 1.3, 4.3);
  camion(ctx, c, remorque1, 66, 17, (3 * Math.PI) / 4, { frigo: true, couleurCabine: 0x4c6a9a });
  camion(ctx, c, remorque2, 80, 15, (3 * Math.PI) / 4, { cabineBasculee: true, couleurCabine: 0x9b3b33 });
  // Les conserves (ou pas) répandues au cul de la remorque frigorifique
  for (let i = 0; i < 26; i++) {
    const a = c.hasard() * Math.PI * 2;
    const r = Math.sqrt(c.hasard()) * 1.8;
    c.poser(cyl(0.05, 0.11, 6), M.metal, [0xc8c8c4, 0xc79a3b, 0xc8362b][i % 3], { x: 72.6 + Math.cos(a) * r, y: 0.05, z: 23.4 + Math.sin(a) * r, rx: Math.PI / 2, ry: c.hasard() * 3 }, { crasse: false });
  }
  for (let i = 0; i < 4; i++) c.boite(0.45, 0.3, 0.35, 0xb8a27a, { x: 73.4 + c.entre(-1, 1), y: 0.15, z: 22.4 + c.entre(-1, 1), ry: c.hasard() * 3, rz: c.entre(-0.3, 0.3) }, M.mat, { nuance: 0.12 });
  // Les feux de détresse du camion frigorifique : la batterie tient encore
  const [fx, fz] = versMonde(66, 17, (3 * Math.PI) / 4, 8.4, 1.0);
  c.boite(0.12, 0.12, 0.25, 0xffffff, { x: fx, y: 1.5, z: fz, ry: (3 * Math.PI) / 4 }, M.lueur, { crasse: false });
  b.lumiere(fx, 1.5, fz, 0xffa040, 3, 8, "feux de détresse du camion frigorifique (la batterie tient encore)");
  b.lumiere(70.5, 1.6, 21.2, 0xffd9a0, 2, 6, "bougie dans la remorque : un pillard y a dormi");
  // Les places vides : des palettes, des pneus de rechange
  for (let i = 0; i < 3; i++) c.poser(new THREE.TorusGeometry(0.45, 0.18, 4, 8), M.mat, C.pneu, { x: 88 + i * 0.4, y: 0.18 + i * 0.32, z: 25.5, rx: Math.PI / 2 }, {});
  for (let i = 0; i < 3; i++) c.boite(1.2, 0.14, 1.0, 0x9a7e5a, { x: 57 + i * 0.1, y: 0.07 + i * 0.15, z: 25.5, ry: 0.1 * i }, M.mat, { nuance: 0.1 });
  rect(b, 88.4, 25.5, 1.2, 1.0, 0, "pneus");
  poubelles(ctx, 92, 9, 2);
  // Épaves sur l'autoroute et sur la bretelle de sortie, la voiture et sa caravane
  voiture(ctx, c, 70, -12.8, 0.15, { type: "break", couleur: TEINTES_VOITURES[2], coffreToit: true });
  caravane(ctx, c, 64.6, -13.8, 0.2);
  voiture(ctx, c, 90, -24.5, Math.PI + 0.06, { couleur: TEINTES_VOITURES[6] });
  voiture(ctx, c, 82.5, -4.8, 0.35, { couleur: TEINTES_VOITURES[4], ouverte: true });
  voiture(ctx, c, 57, -27.5, Math.PI - 0.1, { type: "monospace", couleur: TEINTES_VOITURES[5] });
  jonchee(c, 50, 4, 100, 29, Math.round(40 * (0.4 + u)));
  debris(c, 54, 6, 94, 28, Math.round(30 * u), [0x9aa0a3, 0xd8d4c4, 0x3a3b3c], 0.03);
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
  const b = new Batiment(1986 + TRONCONS.indexOf(t) * 31, u);
  const x0 = t.x - 25;
  const x1 = t.x + 25;
  const ctx = { b, c: b.c, u, x0, x1, dans: (x) => x >= x0 && (x < x1 || (x1 === 100 && x <= 100)), mobiles: [] };

  sol(ctx);
  bretelleEtParkings(ctx);
  bords(ctx);
  signalisation(ctx);
  arbres(ctx);
  if (t.id === "entree") troncon1(ctx);
  else if (t.id === "sanitaires") {
    sanitaires(ctx);
    piqueNique(ctx);
    aireDeJeux(ctx);
    parkingVL(ctx);
  } else if (t.id === "passerelle") troncon3(ctx);
  else troncon4(ctx);

  return recentrer(b.construire(), { x: t.x, z: 0 }, ctx.mobiles);
}
