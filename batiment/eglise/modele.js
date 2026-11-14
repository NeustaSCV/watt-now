// L'église du bourg et son presbytère (Book 20 §3.1, « Église du bourg », Campagne, anneau moyen, danger ●●).
//
// Une église de campagne en calcaire blond, dédiée à saint Éloi : nef à bas-côtés sur piliers ronds, chœur à chevet
// plat percé d'un triplet de lancettes, chapelle latérale au nord-ouest, sacristie collée au chœur, clocher-porche à
// flèche d'ardoise devant le bas-côté ouest. Autour, le cimetière envahi derrière son mur d'enceinte ; à l'est, le
// presbytère du curé et son jardin. La nuit de la Grande Panne, la cloche a sonné une dernière fois, puis le beffroi a
// cédé : elle est tombée par l'abat-son est et repose, fendue, au pied du clocher.
// Ce qu'on vient y voir : la nef dont le toit s'est ouvert sur le ciel (fermes de charpente à nu), les vitraux encore
// intacts qui posent des taches de couleur sur les dalles, la rosace à moitié brisée, l'orgue de tribune effondré sur
// les bancs, l'arbre qui pousse dans le chœur, et le confessionnal reconverti en « cabine de recharge express ».
//
// Une seule carte (lot de 60 × 50 m). Repère : +x à l'est, +z au sud, origine au centre du lot.
// - Église : nef x ∈ [-10, -2], bas-côtés x ∈ [-14, -10] et [-2, 2], z ∈ [-10, 10] ; chœur x ∈ [-9.5, -2.5],
//   z ∈ [-17, -10] ; chapelle x ∈ [-19, -14], z ∈ [-7, -1] ; sacristie x ∈ [-2.5, 2], z ∈ [-16, -10] ;
//   clocher-porche x ∈ [-15, -10], z ∈ [10, 15] ; appentis du sonneur x ∈ [-19, -15], z ∈ [10.5, 14.5].
// - Presbytère x ∈ [9, 19], z ∈ [-15, -5] ; mur d'enceinte du cimetière x ∈ [-29, 5], z ∈ [-24, 20].
// Les murs côté caméra (sud et est) sont coupés à hauteur d'allège (1,1 m) : leur haut, les voûtes, l'arcature de la
// nef et les toits sont des couches qui s'effacent (église, clocher, presbytère, appentis). Les murs nord et ouest,
// qui ne cachent rien vus du sud-est, restent entiers avec leurs vitraux.

import * as THREE from "three";
import {
  Batiment, PALETTE, matiere, matiereMonde, matiereTexture, matiereVerre, matiereLueur, mur, lierre as lierreA, touffes,
  semerTouffes as semerA, gravats as gravatsA, debris as debrisA, jonchee as joncheeA, mousse, arbuste, arbre, flaque,
  dessiner, aleatoire,
} from "../commun/atelier.js";

// La végétation et le petit désordre coûtent cher en triangles (une feuille = 20 triangles, un caillou = 36) : on dose.
const lierre = (c, x, y0, z, ry, l, h, n) => lierreA(c, x, y0, z, ry, l, h, Math.round(n * 0.26));
const semerTouffes = (c, x1, z1, x2, z2, n, t, y) => semerA(c, x1, z1, x2, z2, Math.round(n * 0.3), t, y);
const debris = (c, x1, z1, x2, z2, n, t, y) => debrisA(c, x1, z1, x2, z2, Math.round(n * 0.35), t, y);
const jonchee = (c, x1, z1, x2, z2, n, t, y) => joncheeA(c, x1, z1, x2, z2, Math.round(n * 0.45), t, y);
const gravats = (c, x, z, r, n, t, y) => gravatsA(c, x, z, r, Math.round(n * 0.7), t, y);

// ---------- La fiche ----------

export const FICHE = {
  id: "eglise",
  nom: "L'église du bourg",
  lieu: "Église du bourg · Campagne · moyen",
  environnement: "campagne",
  anneau: "moyen",
  danger: 2,
  recit:
    "Saint-Éloi a sonné l'angélus pendant six siècles, les dernières années par une appli « Clocher+ », sonnerie premium sur abonnement. La nuit de la Grande Panne, la cloche a sonné toute seule une dernière fois, puis le beffroi a cédé : elle attend au pied du clocher, fendue, que quelqu'un ait la force de l'emporter. Dans la nef, le confessionnal propose toujours la recharge express, et les vitraux, eux, n'ont jamais eu besoin de courant.",
  inspiration:
    "les églises abandonnées de Belgique, d'Italie et des campagnes françaises photographiées par les explorateurs urbains : nefs envahies de végétation, vitraux brisés dont les couleurs se posent sur les dalles, orgues effondrées, bancs renversés, voûtes ouvertes sur le ciel ; les églises rurales à clocher-porche et flèche d'ardoise, les cimetières d'ifs et de croix penchées",
  reperes: [
    "Le clocher-porche en pierre et sa flèche d'ardoise, horloge arrêtée, abat-son est crevé (visible, inaccessible)",
    "La cloche de bronze tombée au pied du clocher, fendue, battant à côté ; rondins et cordes déjà posés par des survivants",
    "La façade : grand portail en plein cintre (un vantail tombé), rosace à moitié brisée",
    "La nef à ciel ouvert : toit crevé sur les fermes de charpente, gravats et ardoises sur les bancs, flaque, herbes",
    "Les vitraux intacts du bas-côté est et des fenêtres hautes : leurs couleurs se posent sur les dalles",
    "L'orgue de tribune effondré : moitié de tribune tombée sur les bancs, tuyaux d'étain éparpillés",
    "La chaire et son abat-voix de travers, le lustre tombé, les bancs en désordre (certains déjà débités)",
    "Le chœur : autel, retable doré, triplet de lancettes, un arbre qui pousse à travers les dalles et le toit ; cierges allumés par des survivants",
    "Le confessionnal reconverti en « cabine de recharge express » : prise USB, écran mort, autocollant Watty",
    "L'affiche de kermesse du porche : « Tombola : gagnez une enceinte connectée ! »",
    "La sacristie : armoires à chasubles ouvertes, chasublier, cierges, pains de cire, registres paroissiaux",
    "La chapelle latérale : petit autel, statue, ex-voto, un vitrail intact",
    "Le presbytère : cuisine et sa cheminée où brûle un feu, bureau-bibliothèque, chambre, cellier, escalier effondré",
    "Le cimetière envahi : tombes penchées, croix de fer, calvaire, ifs ; mur d'enceinte à brèches, grille tombée",
    "L'appentis du sonneur : établi, cordes, échelle ; l'épouvantail du jardin coiffé d'un casque de réalité virtuelle",
  ],
  lot: { l: 60, p: 50 },
  depart: { x: -6, z: 23 },
  entrees: [
    { x: -6, z: 20, nature: "la grille du cimetière (un vantail tombé dans l'herbe)" },
    { x: -6, z: 10, nature: "le grand portail de la nef (un vantail tombé à l'intérieur)" },
    { x: -12.5, z: 15, nature: "le porche du clocher" },
    { x: 2, z: -6, nature: "la porte latérale du bas-côté est" },
    { x: 2, z: -13, nature: "la porte de la sacristie" },
    { x: -17, z: 14.5, nature: "la porte de l'appentis du sonneur" },
    { x: -29, z: -6, nature: "la brèche du mur d'enceinte, à l'ouest (on enjambe)" },
    { x: 5, z: 0.5, nature: "le portillon entre le cimetière et le jardin du presbytère" },
    { x: 13, z: 20, nature: "la barrière du jardin du presbytère" },
    { x: 13, z: -5, nature: "la porte du presbytère (cuisine)" },
    { x: 17, z: -15, nature: "la porte de derrière du presbytère (cellier)" },
  ],
  fouille: [
    { x: -8.3, z: 13.4, quoi: "la cloche de bronze fendue : plusieurs centaines de kilos de bronze (à débiter sur place ou à traîner sur les rondins) ; le battant en fer" },
    { x: -4.2, z: 7.2, quoi: "l'orgue effondré : tuyaux d'étain et de plomb, soufflet de cuir, bois sec du buffet" },
    { x: -1.2, z: -15.1, quoi: "armoires de la sacristie : chasubles et aubes (tissu, fil d'or), nappes d'autel" },
    { x: 0.9, z: -12.6, quoi: "caisses de la sacristie : cierges, pains de cire, encens, allumettes" },
    { x: -0.4, z: -12.2, quoi: "table de la sacristie : registres paroissiaux (papier, l'histoire du bourg)" },
    { x: 1.0, z: -8.5, quoi: "présentoir à cierges : coulures de cire à gratter, bouts de cierges" },
    { x: -8.2, z: 0.5, quoi: "bancs de chêne : bois sec (déjà à moitié débités)" },
    { x: 0.6, z: 3.2, quoi: "vitrail tombé : plomb des vitraux, verre coloré" },
    { x: 1.0, z: 0, quoi: "cabine de recharge express : câbles USB, batterie morte, écran, cuivre" },
    { x: -17.6, z: -4.2, quoi: "chapelle : ex-voto de laiton, cierges, nappe d'autel" },
    { x: -6, z: -15.2, quoi: "autel du chœur : chandeliers de laiton, nappe, cierges des survivants (à laisser ?)" },
    { x: -18, z: 12.4, quoi: "appentis du sonneur : cordes de cloche, graisse, outils, échelle, une clochette" },
    { x: 11.4, z: -9.3, quoi: "cuisine du presbytère : cuisinière en fonte, ustensiles, conserves, bocaux" },
    { x: 16.4, z: -9.3, quoi: "bibliothèque du curé : livres (savoir), almanachs, dictionnaires, papier" },
    { x: 10.4, z: -13.8, quoi: "chambre : couvertures, édredon, vêtements chauds" },
    { x: 15.4, z: -14.2, quoi: "cellier : bocaux, vin de messe, bonbonnes, tonneau" },
    { x: 24.5, z: 3, quoi: "puits du jardin (eau) ; potager redevenu sauvage" },
  ],
  eteints: [
    { x: -5.6, z: 3.5, type: "errant (dans l'allée centrale)" },
    { x: -8.6, z: -0.6, type: "rampant (entre les bancs)" },
    { x: -24.2, z: -9, type: "errant (dans le cimetière)" },
    { x: 0.2, z: -13.6, type: "ancien habitant (le sacristain, trousseau de clés à la ceinture)" },
    { x: -3.5, z: 16.5, type: "errant (sur le parvis, près de la cloche)" },
  ],
};

// ---------- Mesures et couleurs ----------

const CUT = 1.1; // coupe des murs côté caméra (hauteur d'allège)
const HA = 4.6; // haut des murs des bas-côtés
const HN = 10; // haut des murs de la nef
const HC = 8; // haut des murs du chœur
const SOLEIL = { x: 0.55, y: 0.75, z: 0.38 }; // direction du soleil de la visionneuse (le jour)

const COUL = {
  pierre: 0xd2c6ab, // calcaire blond, grisé
  pierreSombre: 0xa79c86,
  badigeon: 0xe2dacb, // chaux des murs intérieurs
  dalle: 0xcfc6b3,
  chene: 0x6d5038,
  cheneSombre: 0x4c3826,
  ardoise: 0x535a63,
  bronze: 0xa87e45,
  vertDeGris: 0x6f9a83,
  cire: 0xeee5cc,
  herbe: 0x84995a,
  herbeHaute: 0x9aa65e,
  gravier: 0xb7ad99,
  enduitPresb: 0xdccfb2,
  volet: 0x6c8a7e,
  fer: 0x3b3735,
  ifSombre: 0x2f4a33,
  etain: 0xa9acab,
};

// ---------- Matières (créées une fois, partagées) ----------

const AL = 1024;
const AH = 1024;

/** L'atlas : vitraux, rosace, affiches, panneaux (une seule texture) : [x, y, l, h] en pixels. */
const R = {
  v0: [0, 0, 128, 384],
  v1: [128, 0, 128, 384],
  v2: [256, 0, 128, 384],
  v3: [384, 0, 128, 384],
  v4: [512, 0, 128, 384],
  v5: [640, 0, 128, 384],
  rosace: [768, 0, 256, 256],
  horloge: [768, 256, 128, 128],
  ecran: [896, 256, 128, 128],
  kermesse: [0, 384, 256, 352],
  watty: [256, 384, 256, 256],
  retable: [512, 384, 384, 256],
  paroisse: [896, 384, 128, 192],
  exvoto: [896, 576, 128, 160],
  recharge: [256, 640, 512, 96],
  livres: [0, 736, 512, 128],
};

/** Les vitraux : teintes (fond, médaillon, bordure, bordure, accent) et part brisée. */
const VITRAUX = [
  { tons: [0x2f5a9a, 0xa83c30, 0xc9a23a, 0x3f7a4a, 0xe0d8b0], brise: 0 },
  { tons: [0x9a3a32, 0x2f5a9a, 0xc9a23a, 0x6a4a8a, 0xe0d8b0], brise: 0 },
  { tons: [0x3f7a4a, 0xc9a23a, 0x2f5a9a, 0xa83c30, 0xe8e0c0], brise: 0 },
  { tons: [0x2f5a9a, 0xc9a23a, 0xa83c30, 0x3f7a4a, 0xe0d8b0], brise: 0.35 },
  { tons: [0x6a4a8a, 0xa83c30, 0xc9a23a, 0x2f5a9a, 0xe0d8b0], brise: 0.65 },
  { tons: [0x9a3a32, 0x3f7a4a, 0xc9a23a, 0x2f5a9a, 0xe0d8b0], brise: 0.9 },
];

/** La rosace : secteurs (de 30°, comptés dans le sens trigonométrique depuis l'est) brisés, par anneau. */
const ROSACE = { r: 1.7, brisesExt: new Set([11, 0, 1, 2, 3]), brisesMil: new Set([0, 1, 2]), ext: [0x2f5a9a, 0xa83c30], mil: [0xc9a23a, 0x3f7a4a], centre: 0xa83c30 };

let MATS = null;

function matieres() {
  if (MATS) return MATS;
  const atlas = dessiner("eglise-atlas", AL, AH, dessinerAtlas, false);
  const dallage = matiereTexture(dessiner("eglise-dallage", 256, 256, dessinerDallage), { roughness: 0.9 });
  dallage.userData.tuile = 4;
  const enseignes = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.85, alphaTest: 0.5, side: THREE.DoubleSide });
  const vitraux = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 0.55, vertexColors: true, roughness: 0.35, alphaTest: 0.5, side: THREE.DoubleSide });
  vitraux.userData.sansOmbre = true;
  vitraux.userData.vitraux = true;
  const flamme = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true });
  flamme.userData.sansOmbre = true;
  MATS = {
    pierre: matiereMonde("pierreTaille"),
    enduit: matiereMonde("enduit"),
    ardoise: matiereMonde("ardoise"),
    parquet: matiereMonde("parquet"),
    dallage,
    enseignes,
    vitraux,
    flamme,
    lueur: matiereLueur(0xffffff, 0.6),
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    mat: matiere(0.95, 0),
    satin: matiere(0.6, 0.05),
    tole: matiere(0.75, 0.3),
    metal: matiere(0.4, 0.7),
  };
  return MATS;
}

// ---------- Textures dessinées ----------

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function texte(g, s, x, y, taille, couleur, poids = "bold", police = "Georgia, serif") {
  g.font = `${poids} ${taille}px ${police}`;
  g.fillStyle = couleur;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(s, x, y);
}

function salir(g, a, x, y, l, h, force = 1) {
  g.save();
  g.beginPath();
  g.rect(x, y, l, h);
  g.clip();
  for (let i = 0; i < (l * h) / 200; i++) {
    g.fillStyle = a() < 0.5 ? `rgba(0,0,0,${0.05 * force})` : `rgba(255,255,255,${0.05 * force})`;
    g.fillRect(x + a() * l, y + a() * h, 1 + a() * 3, 1 + a() * 3);
  }
  for (let i = 0; i < 5 * force; i++) {
    const cx = x + a() * l;
    const cy = y + a() * h;
    const r = 6 + a() * 20;
    const d = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    d.addColorStop(0, `rgba(90,75,50,${0.22 * force})`);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  g.restore();
}

/** Arracher un morceau (alpha à zéro : l'alphaTest le fait disparaître) : un polygone déchiqueté. */
function arracher(g, a, cx, cy, r, pointes = 9) {
  g.save();
  g.globalCompositeOperation = "destination-out";
  g.beginPath();
  for (let i = 0; i < pointes; i++) {
    const ang = (i / pointes) * Math.PI * 2;
    const rr = r * (0.45 + a() * 0.75);
    const px = cx + Math.cos(ang) * rr;
    const py = cy + Math.sin(ang) * rr;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.closePath();
  g.fill();
  g.restore();
}

function dessinerDallage(g) {
  const a = aleatoire(301);
  g.fillStyle = "#6f6a60";
  g.fillRect(0, 0, 256, 256);
  const h = 256 / 5;
  for (let r = 0; r < 5; r++) {
    let x = -a() * 40;
    while (x < 256) {
      const l = 40 + a() * 45;
      const v = 222 + Math.floor((a() - 0.5) * 34);
      g.fillStyle = `rgb(${v},${v - 3},${v - 10})`;
      g.fillRect(x + 1.5, r * h + 1.5, l - 3, h - 3);
      x += l;
    }
  }
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = a() < 0.5 ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)";
    g.fillRect(a() * 256, a() * 256, 1 + a() * 3, 1 + a() * 3);
  }
  for (let i = 0; i < 9; i++) {
    const cx = a() * 256;
    const cy = a() * 256;
    const r = 10 + a() * 30;
    const d = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    d.addColorStop(0, i % 3 ? "rgba(80,70,55,0.18)" : "rgba(80,105,55,0.22)");
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  g.strokeStyle = "rgba(50,44,36,0.5)";
  for (let i = 0; i < 4; i++) {
    let x = a() * 256;
    let y = a() * 256;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 5; k++) {
      x += (a() - 0.5) * 30;
      y += (a() - 0.5) * 30;
      g.lineTo(x, y);
    }
    g.stroke();
  }
}

function dessinerAtlas(g) {
  const a = aleatoire(77);
  g.clearRect(0, 0, AL, AH);
  VITRAUX.forEach((v, i) => dessinerLancette(g, a, R["v" + i], v));
  dessinerRosace(g, a);
  dessinerHorloge(g, a);
  dessinerEcran(g, a);
  dessinerKermesse(g, a);
  dessinerWatty(g, a);
  dessinerRetable(g, a);
  dessinerParoisse(g, a);
  dessinerExvoto(g, a);
  dessinerRecharge(g, a);
  dessinerLivres(g, a);
}

/** Une lancette : bordure perlée, fond de mosaïque, trois médaillons, plombs ; une part peut être brisée. */
function dessinerLancette(g, a, [x, y, l, h], v) {
  const t = v.tons.map(hex);
  g.fillStyle = "#26221e";
  g.fillRect(x, y, l, h);
  // Fond de mosaïque (losanges suggérés par des carreaux décalés)
  for (let yy = y + 6; yy < y + h - 4; yy += 15) {
    const dec = ((yy - y) / 15) % 2 ? 7 : 0;
    for (let xx = x + 14 + dec - 14; xx < x + l - 14; xx += 14) {
      const k = a();
      g.fillStyle = k < 0.7 ? t[0] : k < 0.85 ? t[4] : t[2];
      g.globalAlpha = 0.75 + a() * 0.25;
      g.fillRect(Math.max(x + 14, xx + 1), yy + 1, 12, 13);
    }
  }
  g.globalAlpha = 1;
  // Bordure : perles alternées
  for (let yy = y + 3; yy < y + h - 3; yy += 12) {
    const alt = ((yy - y) / 12) % 2 ? 2 : 3;
    g.fillStyle = t[alt];
    g.fillRect(x + 3, yy, 9, 10);
    g.fillRect(x + l - 12, yy, 9, 10);
  }
  // Trois médaillons
  for (let i = 0; i < 3; i++) {
    const cx = x + l / 2;
    const cy = y + h * (0.24 + i * 0.26);
    const r = l * 0.34;
    g.fillStyle = "#26221e";
    g.beginPath();
    g.arc(cx, cy, r + 4, 0, 7);
    g.fill();
    g.fillStyle = t[1];
    g.beginPath();
    g.arc(cx, cy, r, 0, 7);
    g.fill();
    // Un motif simple : quadrilobe et cœur
    g.fillStyle = t[2];
    for (let q = 0; q < 4; q++) {
      g.beginPath();
      g.arc(cx + Math.cos((q * Math.PI) / 2) * r * 0.42, cy + Math.sin((q * Math.PI) / 2) * r * 0.42, r * 0.3, 0, 7);
      g.fill();
    }
    g.fillStyle = t[4];
    g.beginPath();
    g.arc(cx, cy, r * 0.28, 0, 7);
    g.fill();
  }
  // Plombs
  g.strokeStyle = "rgba(30,26,22,0.9)";
  g.lineWidth = 2;
  for (let i = 0; i < 14; i++) {
    g.beginPath();
    const yy = y + a() * h;
    g.moveTo(x + 13, yy);
    g.lineTo(x + l - 13, yy + (a() - 0.5) * 20);
    g.stroke();
  }
  // Barlotières (fers horizontaux)
  g.fillStyle = "#1c1a18";
  for (let k = 1; k < 6; k++) g.fillRect(x, y + (k * h) / 6 - 2, l, 4);
  salir(g, a, x, y, l, h, 0.6);
  // Brisé : des trous déchiquetés (le vent est passé)
  if (v.brise > 0) {
    const n = Math.round(v.brise * 9);
    for (let i = 0; i < n; i++) arracher(g, a, x + 16 + a() * (l - 32), y + h * (0.2 + a() * 0.75), 20 + v.brise * 34, 8);
    if (v.brise > 0.8) {
      g.save();
      g.globalCompositeOperation = "destination-out";
      g.fillRect(x + 14, y + 20, l - 28, h - 40);
      g.restore();
      // quelques éclats restés dans le cadre
      for (let i = 0; i < 6; i++) {
        g.fillStyle = t[i % 4];
        const px = x + (i % 2 ? l - 26 : 14);
        const py = y + 30 + a() * (h - 60);
        g.beginPath();
        g.moveTo(px, py);
        g.lineTo(px + 12, py + 6);
        g.lineTo(px, py + 22);
        g.fill();
      }
    }
  }
}

/** La rosace : douze pétales, un anneau de six, un cœur ; la moitié haute droite est brisée. */
function dessinerRosace(g, a) {
  const [x, y, l] = R.rosace;
  const cx = x + l / 2;
  const cy = y + l / 2;
  const r = l / 2 - 4;
  g.fillStyle = "#26221e";
  g.beginPath();
  g.arc(cx, cy, r, 0, 7);
  g.fill();
  const secteur = (r1, r2, j, couleur) => {
    // angle du plan φ ∈ [j·30°, (j+1)·30°] ; dans le canevas (y vers le bas), l'angle s'inverse
    const a1 = -((j + 1) * Math.PI) / 6;
    const a2 = -(j * Math.PI) / 6;
    g.fillStyle = couleur;
    g.beginPath();
    g.arc(cx, cy, r2, a1 + 0.04, a2 - 0.04);
    g.arc(cx, cy, r1, a2 - 0.06, a1 + 0.06, true);
    g.closePath();
    g.fill();
  };
  for (let j = 0; j < 12; j++) {
    secteur(r * 0.57, r - 6, j, hex(ROSACE.ext[j % 2]));
    secteur(r * 0.3, r * 0.53, j, hex(ROSACE.mil[j % 2]));
  }
  g.fillStyle = hex(ROSACE.centre);
  g.beginPath();
  g.arc(cx, cy, r * 0.26, 0, 7);
  g.fill();
  salir(g, a, x, y, l, l, 0.5);
  // Les secteurs brisés : effacés, bords déchiquetés
  g.save();
  g.globalCompositeOperation = "destination-out";
  for (const j of ROSACE.brisesExt) {
    g.beginPath();
    g.moveTo(cx + Math.cos(-(j * Math.PI) / 6) * r * 0.56, cy + Math.sin(-(j * Math.PI) / 6) * r * 0.56);
    g.arc(cx, cy, r + 2, -(j * Math.PI) / 6, -((j + 1) * Math.PI) / 6, true);
    g.arc(cx, cy, r * 0.56, -((j + 1) * Math.PI) / 6, -(j * Math.PI) / 6);
    g.fill();
  }
  for (const j of ROSACE.brisesMil) {
    g.beginPath();
    g.arc(cx, cy, r * 0.55, -(j * Math.PI) / 6, -((j + 1) * Math.PI) / 6, true);
    g.arc(cx, cy, r * 0.29, -((j + 1) * Math.PI) / 6, -(j * Math.PI) / 6);
    g.fill();
  }
  g.restore();
  // Des éclats encore accrochés aux bords
  for (let i = 0; i < 4; i++) arracher(g, a, cx + (a() - 0.3) * r, cy - a() * r * 0.8, 10, 6);
}

function dessinerHorloge(g, a) {
  const [x, y, l] = R.horloge;
  const cx = x + l / 2;
  const cy = y + l / 2;
  g.fillStyle = "#e6e0cf";
  g.beginPath();
  g.arc(cx, cy, l / 2 - 2, 0, 7);
  g.fill();
  g.strokeStyle = "#25211c";
  g.lineWidth = 4;
  g.beginPath();
  g.arc(cx, cy, l / 2 - 6, 0, 7);
  g.stroke();
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2;
    g.lineWidth = i % 3 ? 2 : 5;
    g.beginPath();
    g.moveTo(cx + Math.cos(ang) * (l / 2 - 10), cy + Math.sin(ang) * (l / 2 - 10));
    g.lineTo(cx + Math.cos(ang) * (l / 2 - 20), cy + Math.sin(ang) * (l / 2 - 20));
    g.stroke();
  }
  // Arrêtée à 11 h 47, l'heure de la Grande Panne
  const aig = (frac, lg, ep) => {
    const ang = frac * Math.PI * 2 - Math.PI / 2;
    g.lineWidth = ep;
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(cx + Math.cos(ang) * lg, cy + Math.sin(ang) * lg);
    g.stroke();
  };
  aig((11 + 47 / 60) / 12, 28, 5);
  aig(47 / 60, 44, 3);
  // Coulures de rouille
  g.fillStyle = "rgba(140,80,40,0.35)";
  for (let i = 0; i < 6; i++) g.fillRect(cx - 30 + a() * 60, cy + a() * 20, 3, 20 + a() * 30);
  salir(g, a, x, y, l, l, 1.2);
}

function dessinerEcran(g, a) {
  const [x, y, l, h] = R.ecran;
  g.fillStyle = "#3a3c3e";
  g.fillRect(x, y, l, h);
  g.fillStyle = "#0c0e10";
  g.fillRect(x + 6, y + 6, l - 12, h - 12);
  const d = g.createLinearGradient(x, y, x + l, y + h);
  d.addColorStop(0, "rgba(255,255,255,0.12)");
  d.addColorStop(0.5, "rgba(255,255,255,0)");
  g.fillStyle = d;
  g.fillRect(x + 6, y + 6, l - 12, h - 12);
  texte(g, "Touchez pour", x + l / 2, y + h / 2 - 8, 11, "#2a2e33", "bold", "sans-serif");
  texte(g, "recharger", x + l / 2, y + h / 2 + 8, 11, "#2a2e33", "bold", "sans-serif");
  g.strokeStyle = "rgba(220,225,230,0.55)";
  g.lineWidth = 1;
  for (let i = 0; i < 7; i++) {
    g.beginPath();
    g.moveTo(x + 40, y + 50);
    g.lineTo(x + 40 + (a() - 0.3) * 90, y + 50 + (a() - 0.4) * 80);
    g.stroke();
  }
}

function fanions(g, x, y, l) {
  const tons = ["#c8362b", "#c79a3b", "#2f6f73"];
  g.strokeStyle = "#3b2a1e";
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(x, y);
  g.quadraticCurveTo(x + l / 2, y + 16, x + l, y);
  g.stroke();
  for (let i = 0; i < 9; i++) {
    const px = x + 8 + i * ((l - 16) / 9);
    const py = y + 3 + Math.sin((i / 8) * Math.PI) * 8;
    g.fillStyle = tons[i % 3];
    g.beginPath();
    g.moveTo(px, py);
    g.lineTo(px + 18, py);
    g.lineTo(px + 9, py + 20);
    g.fill();
  }
}

function dessinerKermesse(g, a) {
  const [x, y, l, h] = R.kermesse;
  g.fillStyle = "#e9dfc6";
  g.fillRect(x, y, l, h);
  fanions(g, x + 4, y + 6, l - 8);
  texte(g, "KERMESSE", x + l / 2, y + 62, 38, "#c8362b", "900", "sans-serif");
  texte(g, "de la paroisse Saint-Éloi", x + l / 2, y + 92, 15, "#3b2a1e", "italic 600");
  texte(g, "dimanche, après la messe", x + l / 2, y + 112, 13, "#3b2a1e", "600");
  // Le cadre de la tombola
  g.fillStyle = "#2f6f73";
  g.fillRect(x + 16, y + 132, l - 32, 120);
  texte(g, "TOMBOLA", x + l / 2, y + 152, 24, "#e9dfc6", "900", "sans-serif");
  texte(g, "gagnez une", x + l / 2, y + 178, 15, "#e9dfc6", "600", "sans-serif");
  texte(g, "ENCEINTE CONNECTÉE !", x + l / 2, y + 198, 17, "#c79a3b", "900", "sans-serif");
  // L'enceinte elle-même, dessinée avec amour
  g.fillStyle = "#1f2224";
  g.fillRect(x + l / 2 - 16, y + 210, 32, 36);
  g.fillStyle = "#c79a3b";
  g.beginPath();
  g.arc(x + l / 2, y + 222, 4, 0, 7);
  g.fill();
  texte(g, "Pêche à la ligne · Chamboule-tout", x + l / 2, y + 276, 12, "#3b2a1e", "600", "sans-serif");
  texte(g, "Crêpes · Buvette · Lâcher de ballons", x + l / 2, y + 294, 12, "#3b2a1e", "600", "sans-serif");
  texte(g, "Venez nombreux !", x + l / 2, y + 322, 16, "#c8362b", "italic 700");
  g.fillStyle = "rgba(233,223,198,0.3)";
  g.fillRect(x, y, l, h);
  salir(g, a, x, y, l, h, 1.4);
  arracher(g, a, x + l - 6, y + h - 10, 40, 8); // coin déchiré
  arracher(g, a, x + 4, y + 4, 14, 6); // la punaise a lâché
}

function dessinerWatty(g, a) {
  const [x, y, l, h] = R.watty;
  g.fillStyle = "#e9dfc6";
  g.beginPath();
  g.arc(x + l / 2, y + h / 2, l / 2 - 2, 0, 7);
  g.fill();
  g.strokeStyle = "#2f6f73";
  g.lineWidth = 8;
  g.stroke();
  // Watty : une pile souriante, le pouce levé
  const bx = x + l / 2 - 38;
  const by = y + 56;
  g.fillStyle = "#2f6f73";
  g.fillRect(bx + 24, by - 14, 28, 16);
  g.fillStyle = "#c79a3b";
  g.fillRect(bx, by, 76, 116);
  g.fillStyle = "#2f6f73";
  g.fillRect(bx, by + 84, 76, 32);
  g.fillStyle = "#1f1b16";
  g.beginPath();
  g.arc(bx + 24, by + 34, 6, 0, 7);
  g.arc(bx + 52, by + 34, 6, 0, 7);
  g.fill();
  g.strokeStyle = "#1f1b16";
  g.lineWidth = 4;
  g.beginPath();
  g.arc(bx + 38, by + 50, 18, 0.2, Math.PI - 0.2);
  g.stroke();
  g.strokeStyle = "#c79a3b";
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(bx + 76, by + 60);
  g.lineTo(bx + 100, by + 40);
  g.lineTo(bx + 100, by + 22);
  g.stroke();
  texte(g, "+", bx + 38, by + 100, 26, "#e9dfc6", "900", "sans-serif");
  texte(g, "Toujours plein,", x + l / 2, y + 196, 17, "#c8362b", "900", "sans-serif");
  texte(g, "jamais à plat !", x + l / 2, y + 216, 17, "#c8362b", "900", "sans-serif");
  salir(g, a, x, y, l, h, 0.8);
}

function dessinerRetable(g, a) {
  const [x, y, l, h] = R.retable;
  g.fillStyle = "#6b4a2a";
  g.fillRect(x, y, l, h);
  const panneaux = [[x + 12, 108], [x + 132, 120], [x + 264, 108]];
  const robes = ["#3f5f8f", "#9b3b35", "#4f7f55"];
  panneaux.forEach(([px, lp], i) => {
    const top = y + (i === 1 ? 12 : 30);
    const ph = h - (top - y) - 14;
    const d = g.createLinearGradient(px, top, px, top + ph);
    d.addColorStop(0, "#d9b25a");
    d.addColorStop(1, "#a07a34");
    g.fillStyle = d;
    g.beginPath();
    g.moveTo(px, top + lp / 2);
    g.arc(px + lp / 2, top + lp / 2, lp / 2, Math.PI, 0);
    g.lineTo(px + lp, top + ph);
    g.lineTo(px, top + ph);
    g.closePath();
    g.fill();
    // Une figure drapée, auréolée (pas de visage : le temps l'a effacé)
    const cx = px + lp / 2;
    g.fillStyle = robes[i];
    g.beginPath();
    g.moveTo(cx - lp * 0.32, top + ph - 6);
    g.quadraticCurveTo(cx - lp * 0.2, top + ph * 0.45, cx, top + ph * 0.36);
    g.quadraticCurveTo(cx + lp * 0.2, top + ph * 0.45, cx + lp * 0.32, top + ph - 6);
    g.fill();
    g.fillStyle = "#d8c4a0";
    g.beginPath();
    g.arc(cx, top + ph * 0.28, lp * 0.11, 0, 7);
    g.fill();
    g.strokeStyle = "#f0d68a";
    g.lineWidth = 4;
    g.beginPath();
    g.arc(cx, top + ph * 0.28, lp * 0.18, 0, 7);
    g.stroke();
  });
  // Le temps : écailles, coulures
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(${a() < 0.5 ? "60,45,30" : "200,190,170"},${0.2 + a() * 0.3})`;
    g.fillRect(x + a() * l, y + a() * h, 3 + a() * 8, 3 + a() * 6);
  }
  salir(g, a, x, y, l, h, 1.5);
}

function dessinerParoisse(g, a) {
  const [x, y, l, h] = R.paroisse;
  g.fillStyle = "#efe9da";
  g.fillRect(x, y, l, h);
  g.fillStyle = "#3b4a6b";
  g.fillRect(x, y, l, 26);
  texte(g, "PAROISSE", x + l / 2, y + 13, 13, "#efe9da", "900", "sans-serif");
  texte(g, "Saint-Éloi", x + l / 2, y + 42, 16, "#3b2a1e", "italic 700");
  texte(g, "Messe : dimanche", x + l / 2, y + 70, 11, "#3b2a1e", "600", "sans-serif");
  texte(g, "10 h 30", x + l / 2, y + 86, 13, "#3b2a1e", "800", "sans-serif");
  texte(g, "Angélus sonné par", x + l / 2, y + 114, 10, "#3b2a1e", "600", "sans-serif");
  texte(g, "l'appli CLOCHER+", x + l / 2, y + 130, 11, "#c8362b", "900", "sans-serif");
  texte(g, "(sonnerie premium)", x + l / 2, y + 146, 9, "#3b2a1e", "italic 600", "sans-serif");
  texte(g, "Permanence : mardi", x + l / 2, y + 172, 10, "#3b2a1e", "600", "sans-serif");
  salir(g, a, x, y, l, h, 1.3);
  arracher(g, a, x + l - 4, y + h - 6, 22, 7);
}

function dessinerExvoto(g, a) {
  const [x, y, l, h] = R.exvoto;
  g.fillStyle = "#8f8879";
  g.fillRect(x, y, l, h);
  const mots = ["MERCI", "RECONNAISSANCE", "MERCI · 1918", "PROTÉGEZ-NOUS", "GRÂCE OBTENUE", "MERCI"];
  for (let i = 0; i < 6; i++) {
    const px = x + 4 + (i % 2) * 62;
    const py = y + 4 + Math.floor(i / 2) * 52;
    g.fillStyle = i % 3 === 2 ? "#d8d2c4" : "#ece8de";
    g.fillRect(px, py, 58, 46);
    g.strokeStyle = "#b8b0a0";
    g.strokeRect(px + 3, py + 3, 52, 40);
    texte(g, mots[i], px + 29, py + 23, mots[i].length > 9 ? 6 : 9, "#5a5040", "700", "Georgia, serif");
  }
  salir(g, a, x, y, l, h, 1);
}

function dessinerRecharge(g, a) {
  const [x, y, l, h] = R.recharge;
  g.fillStyle = "#2f6f73";
  g.fillRect(x, y, l, h);
  g.fillStyle = "#c79a3b";
  g.beginPath();
  g.moveTo(x + 46, y + 10);
  g.lineTo(x + 24, y + 52);
  g.lineTo(x + 40, y + 52);
  g.lineTo(x + 30, y + 86);
  g.lineTo(x + 62, y + 38);
  g.lineTo(x + 46, y + 38);
  g.closePath();
  g.fill();
  texte(g, "RECHARGE EXPRESS", x + l / 2 + 20, y + 38, 44, "#e9dfc6", "900", "sans-serif");
  texte(g, "USB · 15 MIN · SANS ATTENTE", x + l / 2 + 20, y + 76, 20, "#c79a3b", "800", "sans-serif");
  salir(g, a, x, y, l, h, 1.2);
}

function dessinerLivres(g, a) {
  const [x, y, l, h] = R.livres;
  g.fillStyle = "#2a2018";
  g.fillRect(x, y, l, h);
  const tons = ["#6b2a26", "#2f4a3a", "#5a4630", "#2e3a52", "#7a6440", "#4a3a2a", "#8a7a5a"];
  let px = x + 2;
  while (px < x + l - 6) {
    const lb = 8 + Math.floor(a() * 12);
    const hb = h - 4 - Math.floor(a() * 34);
    if (a() < 0.08) {
      px += lb; // un trou dans le rang
      continue;
    }
    g.fillStyle = tons[Math.floor(a() * tons.length)];
    g.fillRect(px, y + h - hb, lb - 1, hb);
    g.fillStyle = "rgba(210,180,100,0.7)";
    g.fillRect(px + 1, y + h - hb + 8, lb - 3, 2);
    g.fillRect(px + 1, y + h - 14, lb - 3, 2);
    px += lb;
  }
  salir(g, a, x, y, l, h, 0.8);
}

// ---------- Outils de pose ----------

/** Un panneau plat dont l'image vient de l'atlas (région `r`), face vers +z local. */
function panneau(c, mat, r, pose, l, h) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
  c.poser(g, mat, 0xffffff, pose, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Le repère d'un mur de a à b (comme mur() : x le long du mur, +z vers l'extérieur). */
function cadre(a, b, y = 0) {
  return { x: a[0], y, z: a[1], ry: -Math.atan2(b[1] - a[1], b[0] - a[0]) };
}

/** Une forme 2D extrudée d'épaisseur `ep`, centrée sur son plan. */
function poserForme(ch, mat, couleur, forme, ep, pose = {}, options = {}) {
  const g = new THREE.ExtrudeGeometry(forme, { depth: ep, bevelEnabled: false, curveSegments: 14 });
  g.translate(0, 0, -ep / 2);
  ch.poser(g, mat, couleur, pose, { nuance: 0.02, ...options });
  g.dispose();
}

const hauteurArc = (l, type) => (type === "ogive" ? 0.866 * l : l / 2);

/** Les points d'un arc (ogive ou plein cintre) de largeur l, posé à y0, du pied gauche au pied droit inclus. */
function pointsArc(cx, y0, l, type, n = 5) {
  const p = [];
  if (type === "ogive") {
    for (let i = 0; i <= n; i++) {
      const t = Math.PI - (i / n) * (Math.PI / 3);
      p.push([cx + l / 2 + l * Math.cos(t), y0 + l * Math.sin(t)]);
    }
    for (let i = 1; i <= n; i++) {
      const t = Math.PI / 3 - (i / n) * (Math.PI / 3);
      p.push([cx - l / 2 + l * Math.cos(t), y0 + l * Math.sin(t)]);
    }
  } else {
    for (let i = 0; i <= 2 * n; i++) {
      const t = Math.PI - (i / (2 * n)) * Math.PI;
      p.push([cx + (l / 2) * Math.cos(t), y0 + (l / 2) * Math.sin(t)]);
    }
  }
  return p;
}

/** Un trou en forme de baie (rectangle coiffé d'un arc) pour une Shape. */
function cheminBaie(u, bas, haut, l, type) {
  const ys = haut - hauteurArc(l, type);
  const p = new THREE.Path();
  p.moveTo(u - l / 2, bas);
  p.lineTo(u + l / 2, bas);
  const arc = pointsArc(u, ys, l, type).reverse();
  for (const [px, py] of arc) p.lineTo(px, py);
  p.closePath();
  return p;
}

/** Projette un point au sol le long des rayons du soleil. */
function auSol(x, y, z, y0 = 0.06) {
  const t = (y - y0) / SOLEIL.y;
  return [x - SOLEIL.x * t, z - SOLEIL.z * t];
}

/** Un quadrilatère au sol (points [x, z]), dans la matière donnée. */
function quadSol(c, mat, couleur, pts, y = 0.065) {
  const [p0, p1, p2, p3] = pts;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([p0[0], y, p0[1], p2[0], y, p2[1], p1[0], y, p1[1], p0[0], y, p0[1], p3[0], y, p3[1], p2[0], y, p2[1]], 3));
  g.computeVertexNormals();
  c.poser(g, mat, couleur, {}, { crasse: false, nuance: 0.03 });
  g.dispose();
}

/** Un rai de lumière colorée (prisme additif), d'intensité donnée par la teinte. */
function rai(k, depuis, vers, largeur, teinte) {
  const a = new THREE.Vector3(...depuis);
  const b = new THREE.Vector3(...vers);
  const d = new THREE.Vector3().subVectors(b, a);
  const g = new THREE.CylinderGeometry(largeur * 0.5, largeur * 0.62, d.length(), 4, 1, true);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  const e = new THREE.Euler().setFromQuaternion(q);
  k.c.poser(g, k.m.lueur, teinte, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2, rx: e.x, ry: e.y + Math.PI / 4, rz: e.z }, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Assombrit une teinte (les rais sont bien plus discrets que les taches). */
function attenuer(couleur, f) {
  const c = new THREE.Color(couleur);
  c.multiplyScalar(f);
  return c.getHex();
}

/**
 * La tache colorée qu'un vitrail pose sur les dalles : la baie (largeur l, de `bas` à `haut`) découpée en carreaux,
 * chacun projeté au sol le long du soleil, teinté de la couleur du verre. `p0` : centre de la baie au sol (monde),
 * `w` : direction du mur.
 */
function tacheVitrail(k, p0, w, l, bas, haut, variante) {
  const V = VITRAUX[variante];
  const nx = 2;
  const ny = 6;
  const perte = V.brise > 0 ? 0.45 : 0.08;
  // La flaque de soleil sous la baie (blanc chaud), puis les carreaux colorés par-dessus
  const coin = (u, y) => auSol(p0[0] + w[0] * u, y, p0[1] + w[1] * u);
  quadSol(k.c, k.m.lueur, V.brise > 0 ? 0x2a2620 : 0x4a4236, [coin(-l / 2 - 0.05, bas), coin(l / 2 + 0.05, bas), coin(l / 2 + 0.05, haut), coin(-l / 2 - 0.05, haut)], 0.062);
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    if (k.c.hasard() < perte) continue;
    const u1 = -l / 2 + ((i + 0.04) * l) / nx;
    const u2 = -l / 2 + ((i + 0.96) * l) / nx;
    const y1 = bas + ((j + 0.04) * (haut - bas)) / ny;
    const y2 = bas + ((j + 0.96) * (haut - bas)) / ny;
    const pts = [[u1, y1], [u2, y1], [u2, y2], [u1, y2]].map(([u, y]) => auSol(p0[0] + w[0] * u, y, p0[1] + w[1] * u));
    const couleur = V.tons[(i + j) % 3 === 0 ? 1 : (j % 2 ? 0 : (i ? 2 : 0))];
    quadSol(k.c, k.m.lueur, attenuer(couleur, 0.7), pts);
  }
  // Le rai, discret, du milieu de la baie au milieu de la tache
  const ym = (bas + haut) / 2;
  const [sx, sz] = auSol(p0[0], ym, p0[1]);
  rai(k, [p0[0], ym, p0[1]], [sx, 0.1, sz], l * 0.75, attenuer(V.tons[0], 0.05));
}

// ---------- Murs à baies ----------

/**
 * Un mur monté en bandes (chaque bande dans son chantier : la base garde les obstacles, le haut va dans une couche).
 * Les baies `forme` (« ogive » | « cintre ») sont garnies ici : écoinçons de pierre, vitrail, tache de couleur.
 */
function murBandes(k, a, b, spec, bandes) {
  const base = { ep: spec.ep ?? 0.7, couleur: spec.couleur ?? COUL.pierre, mat: spec.mat ?? k.m.pierre, interieur: spec.interieur ?? null };
  const ouv = spec.ouvertures ?? [];
  bandes.forEach((bd, i) => {
    const derniere = i === bandes.length - 1;
    const o = ouv
      .filter((q) => q.haut > bd.y0 + 0.01 && q.bas < bd.y1 - 0.01)
      .map((q) => {
        const r = { ...q, bas: Math.max(0, q.bas - bd.y0), haut: q.haut - bd.y0 };
        const partielle = q.bas < bd.y0 - 0.01 || q.haut > bd.y1 + 0.01;
        if (q.forme || (partielle && r.type === "fenetre")) r.type = "vide";
        r.vantail = bd.y0 === 0 ? q.vantail : undefined;
        return r;
      });
    mur(bd.ch, a, b, { ...base, y0: bd.y0, h: bd.y1 - bd.y0, ouvertures: o, breches: derniere ? spec.breches ?? [] : [], arase: derniere ? spec.arase ?? 0 : 0, batiment: bd.y0 < 0.5 ? k.b : null });
  });
  for (const q of ouv) {
    if (!q.forme) continue;
    const bd = bandes.find((x) => q.haut <= x.y1 + 0.01) ?? bandes[bandes.length - 1];
    baie(k, bd.ch, a, b, q, base.ep, base.couleur, base.mat);
  }
}

/** Garnit une baie : écoinçons sous l'arc (pierre), appui, vitrail ; et la tache colorée au sol si demandée. */
function baie(k, ch, a, b, o, ep, couleur, mat) {
  const { u, l, bas, haut, forme } = o;
  const ha = hauteurArc(l, forme);
  const ys = haut - 0.12 - ha;
  ch.repere(cadre(a, b), () => {
    const s = new THREE.Shape();
    s.moveTo(u - l / 2, ys);
    s.lineTo(u - l / 2, haut);
    s.lineTo(u + l / 2, haut);
    s.lineTo(u + l / 2, ys);
    const arc = pointsArc(u, ys, l, forme).reverse();
    for (let i = 1; i < arc.length - 1; i++) s.lineTo(arc[i][0], arc[i][1]);
    poserForme(ch, mat, couleur, s, ep, {}, { crasse: false });
    // Ébrasement : un fin bandeau mouluré autour de l'arc, côté extérieur
    if (o.type !== "porte" && bas > 0.5) ch.pave(u - l / 2 - 0.1, bas - 0.1, ep / 2 - 0.05, u + l / 2 + 0.1, bas, ep / 2 + 0.12, COUL.pierreSombre, mat, { crasse: false });
    if (o.vitrail !== undefined) panneau(ch, k.m.vitraux, R["v" + o.vitrail], { x: u, y: (bas + haut - 0.12) / 2, z: 0 }, l, haut - 0.12 - bas);
  });
  if (o.vitrail !== undefined && o.tache) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const w = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
    tacheVitrail(k, [a[0] + w[0] * u, a[1] + w[1] * u], w, l, bas, haut - 0.12 - ha * 0.4, o.vitrail);
  }
}

/** Un contrefort contre un mur aligné sur les axes : bas dans la base, haut dans `chHaut` (ou tout en base). */
function contrefort(k, chHaut, x, z, nx, nz, h, coupe = CUT) {
  const ep = 0.75;
  const saillie = 0.9;
  const poser = (ch, y1, y2, s) => {
    const cx = x + nx * (0.35 + s / 2);
    const cz = z + nz * (0.35 + s / 2);
    const lx = nx ? s : ep;
    const lz = nz ? s : ep;
    ch.pave(cx - lx / 2, y1, cz - lz / 2, cx + lx / 2, y2, cz + lz / 2, COUL.pierre, k.m.pierre, { nuance: 0.03 });
  };
  const etages = [[0, h * 0.55, saillie], [h * 0.55, h, saillie * 0.62]];
  for (const [y1, y2, s] of etages) {
    if (!chHaut) poser(k.c, y1, y2, s);
    else {
      if (y1 < coupe) poser(k.c, y1, Math.min(y2, coupe), s);
      if (y2 > coupe) poser(chHaut, Math.max(y1, coupe), y2, s);
    }
  }
  // Le glacis du sommet
  const ch = chHaut ?? k.c;
  const s = saillie * 0.62;
  const cx = x + nx * (0.35 + s / 2);
  const cz = z + nz * (0.35 + s / 2);
  ch.boite(nx ? s * 1.15 : ep, 0.18, nz ? s * 1.15 : ep, COUL.pierreSombre, { x: cx, y: h + 0.15, z: cz, rz: nx ? -nx * 0.55 : 0, rx: nz ? nz * 0.55 : 0 }, k.m.pierre, { crasse: false });
  if (!chHaut || h * 0.55 < coupe) k.b.obstacle(x + nx * 0.35, z + nz * 0.35, x + nx * (0.35 + saillie), z + nz * (0.35 + saillie), "contrefort");
}

/** Un pignon triangulaire dans le repère d'un mur (de u1 à u2, base à y0, sommet à y0 + hf au milieu). */
function pignon(ch, k, a, b, u1, u2, y0, hf, ep = 0.7, couleur = COUL.pierre, mat = k.m.pierre, sommet = null) {
  ch.repere(cadre(a, b), () => {
    const s = new THREE.Shape();
    s.moveTo(u1, y0);
    s.lineTo(u2, y0);
    s.lineTo(sommet ?? (u1 + u2) / 2, y0 + hf);
    s.closePath();
    poserForme(ch, mat, couleur, s, ep, {}, { crasse: false });
  });
}

// ---------- Toitures ----------

/**
 * Une toiture à un ou deux pans. `axe` : direction du faîtage (« x » ou « z ») ; `f` : position du faîtage sur l'autre
 * axe ; de `d1` à `d2` le long du faîtage ; `y0` : haut des murs ; `demi` : du faîtage au nu des murs ; `hf` : hauteur
 * du faîtage au-dessus de y0. `cotes` : [-1, 1] (deux pans) ou [±1] (appentis). `trous` : [{ d1, d2, cote, v1, v2 }]
 * avec v de 0 (faîtage) à 1 (égout). `fermes` : pas des fermes de charpente (0 : aucune) ; `cassees` : leurs positions
 * tombées.
 */
function toiture(ch, k, s) {
  const { axe = "z", f, d1, d2, y0, demi, hf, cotes = [-1, 1], trous = [], debord = 0.4, couleur = COUL.ardoise, mat = k.m.ardoise, fermes = 0, faitage = true } = s;
  const pente = Math.atan2(hf, demi);
  const Dh = demi + debord;
  const yr = y0 + hf;
  const nv = 3;
  const seg = Dh / nv / Math.cos(pente) + 0.03;
  const L = d2 - d1;
  const nl = Math.max(2, Math.round(L / 1.1));
  const lg = L / nl;
  const P = (d, across, y) => (axe === "z" ? { x: f + across, y, z: d } : { x: d, y, z: f + across });
  const dansTrou = (d, cote, v) => trous.some((t) => t.cote === cote && d > t.d1 && d < t.d2 && v > (t.v1 ?? 0) - 1e-6 && v < (t.v2 ?? 1) + 1e-6);
  const charpente = COUL.cheneSombre;
  for (const cote of cotes) {
    for (let i = 0; i < nl; i++) {
      const d = d1 + (i + 0.5) * lg;
      for (let j = 0; j < nv; j++) {
        const v = (j + 0.5) / nv;
        if (dansTrou(d, cote, v)) continue;
        const h = v * Dh;
        const pose = P(d, cote * h, yr - h * Math.tan(pente) + 0.04);
        if (axe === "z") ch.boite(seg, 0.09, lg + 0.01, couleur, { ...pose, rz: -cote * pente }, mat, { crasse: false, nuance: 0.03 });
        else ch.boite(lg + 0.01, 0.09, seg, couleur, { ...pose, rx: cote * pente }, mat, { crasse: false, nuance: 0.03 });
      }
    }
    // Sous les trous : chevrons nus, certains cassés, et la panne
    for (const t of trous.filter((q) => q.cote === cote)) {
      for (let d = t.d1 + 0.25; d < t.d2; d += 0.55) {
        if (ch.hasard() < 0.3) continue;
        const casse = ch.hasard() < 0.35;
        const a = P(d, 0, yr - 0.12);
        const fin = casse ? ch.entre(0.35, 0.7) : 1;
        const bb = P(d, cote * demi * fin, yr - 0.12 - hf * fin - (casse ? ch.entre(0.2, 0.8) : 0));
        ch.poutre([a.x, a.y, a.z], [bb.x, bb.y, bb.z], 0.1, charpente, k.m.mat);
      }
      const a = P(t.d1, cote * demi * 0.5, yr - hf * 0.5 - 0.15);
      const bb = P(t.d2, cote * demi * 0.5, yr - hf * 0.5 - 0.15);
      if (t.d2 - t.d1 < 6) ch.poutre([a.x, a.y, a.z], [bb.x, bb.y - 0.4, bb.z], 0.18, charpente, k.m.mat);
    }
  }
  // Le faîtage (interrompu au-dessus des trous qui l'atteignent)
  if (faitage && cotes.length === 2) {
    for (let i = 0; i < nl; i++) {
      const d = d1 + (i + 0.5) * lg;
      if (trous.some((t) => d > t.d1 && d < t.d2 && (t.v1 ?? 0) < 0.05)) continue;
      const p = P(d, 0, yr + 0.08);
      ch.boite(axe === "z" ? 0.3 : lg + 0.02, 0.16, axe === "z" ? lg + 0.02 : 0.3, 0x4a4642, p, mat, { crasse: false, nuance: 0.02 });
    }
  }
  // Les fermes : entrait, arbalétriers, poinçon
  if (fermes > 0) {
    for (let d = d1 + fermes / 2; d < d2; d += fermes) {
      if ((s.cassees ?? []).some((q) => Math.abs(q - d) < fermes / 2)) continue;
      const g = P(d, -demi, y0 - 0.1);
      const dr = P(d, demi, y0 - 0.1);
      const som = P(d, 0, yr - 0.2);
      const pied = P(d, 0, y0 - 0.1);
      ch.poutre([g.x, g.y, g.z], [dr.x, dr.y, dr.z], 0.24, charpente, k.m.mat);
      ch.poutre([g.x, g.y, g.z], [som.x, som.y, som.z], 0.2, charpente, k.m.mat);
      ch.poutre([dr.x, dr.y, dr.z], [som.x, som.y, som.z], 0.2, charpente, k.m.mat);
      ch.poutre([pied.x, pied.y, pied.z], [som.x, som.y, som.z], 0.18, charpente, k.m.mat);
    }
  }
}

// ---------- Le bâtiment ----------

export function creer({ usure = 0.7 } = {}) {
  const b = new Batiment(1477, usure);
  const m = matieres();
  // Les couches qui s'effacent
  const E = b.couche("église (hauts des murs, arcatures, toits)", { x: -8.2, z: -3.4, l: 22.6, p: 27.8 }, CUT, 15);
  const K = b.couche("clocher et flèche", { x: -12.5, z: 12.5, l: 5.9, p: 5.9 }, CUT, 32);
  const P = b.couche("presbytère (hauts des murs, étage, toit)", { x: 14, z: -10, l: 10.6, p: 10.6 }, CUT, 10.5);
  const A = b.couche("appentis du sonneur", { x: -17, z: 12.5, l: 4.4, p: 4.4 }, CUT, 3.9);
  const k = { b, c: b.c, E, K, P, A, m, usure, bris: 0.2 + 0.6 * usure };

  sols(k);
  nef(k);
  facade(k);
  choeur(k);
  chapelle(k);
  sacristie(k);
  clocher(k);
  appentis(k);
  mobilierNef(k);
  orgue(k);
  confessionnal(k);
  mobilierChoeur(k);
  mobilierChapelle(k);
  mobilierSacristie(k);
  porche(k);
  cloche(k);
  enceinte(k);
  cimetiere(k);
  presbytere(k);
  interieurPresbytere(k);
  jardin(k);

  // La nuit : les cierges des survivants dans le chœur et la chapelle, la lanterne du presbytère, le feu de la cheminée.
  b.lumiere(-6, 1.3, -14.6, 0xffc070, 6, 11, "cierges allumés par des survivants (chœur)");
  b.lumiere(-17.6, 1.2, -4.4, 0xffb860, 3, 6, "cierges de la chapelle");
  b.lumiere(12.05, 2.0, -4.4, 0xffd27a, 5, 9, "lanterne du presbytère");
  b.lumiere(9.9, 0.6, -7.5, 0xff8a3d, 9, 9, "feu dans la cheminée du presbytère");

  // Les flammes tremblent un peu
  const anime = new THREE.Object3D();
  anime.userData.animer = (t) => {
    m.flamme.color.setScalar(0.88 + 0.12 * Math.sin(t * 11) * Math.sin(t * 7.3 + 1));
  };
  b.ajouter(anime);

  const groupe = b.construire();
  reglerJourNuit(groupe);
  return groupe;
}

/**
 * Les taches et rais de lumière colorée ne sont là qu'en plein jour, et les vitraux ne luisent plus la nuit : la
 * luminosité du ciel de la scène (son fond) dose les deux au moment du rendu.
 */
function reglerJourNuit(groupe) {
  const jour = (scene) => {
    const c = scene?.background;
    if (!c?.isColor) return 1;
    const l = 0.3 * c.r + 0.59 * c.g + 0.11 * c.b;
    return Math.min(1, Math.max(0, (l - 0.05) / 0.4));
  };
  groupe.traverse((o) => {
    if (!o.isMesh) return;
    const mat = o.material;
    if (mat.userData?.lueur) {
      mat.userData.opaciteJour ??= mat.opacity;
      o.onBeforeRender = (r, scene) => {
        mat.opacity = mat.userData.opaciteJour * jour(scene);
      };
    } else if (mat.userData?.vitraux) {
      o.onBeforeRender = (r, scene) => {
        mat.emissiveIntensity = 0.1 + 0.45 * jour(scene);
      };
    }
  });
}

// ---------- Sols : herbe, route, parvis, dallages ----------

function sols(k) {
  const { c, m, usure } = k;
  // Le terrain : herbe du lot, route au sud
  c.pave(-30, -0.03, -25, 30, 0, 25, COUL.herbe, m.mat, { crasse: false, nuance: 0 });
  c.pave(-30, 0, 21.2, 30, 0.03, 25, 0x7f7c75, m.mat, { crasse: false, nuance: 0 });
  for (let x = -28; x < 30; x += 4) c.boite(1.8, 0.01, 0.14, 0xd8d2c0, { x, y: 0.035, z: 23.1 }, m.mat, { crasse: false });
  for (let i = 0; i < 10; i++) c.boite(c.entre(1, 3), 0.01, 0.04, 0x4a4842, { x: c.entre(-28, 28), y: 0.035, z: c.entre(21.6, 24.6), ry: c.entre(-0.6, 0.6) }, m.mat, { crasse: false });
  semerTouffes(c, -30, 20.6, 30, 21.6, 40 * usure, COUL.herbeHaute);
  // Le parvis de dalles, de la grille au portail et au porche
  c.pave(-9.8, 0, 10.4, -2.2, 0.04, 20, COUL.dalle, m.dallage, { crasse: false, nuance: 0 });
  c.pave(-15.6, 0, 15, -9.8, 0.04, 18.2, COUL.dalle, m.dallage, { crasse: false, nuance: 0 });
  // Les allées de gravier du cimetière
  c.pave(-28.7, 0, 16.2, -15.6, 0.02, 17.6, COUL.gravier, m.mat, { crasse: false, nuance: 0 });
  c.pave(-24.2, 0, -23.6, -23, 0.02, 16.2, COUL.gravier, m.mat, { crasse: false, nuance: 0 });
  c.pave(-28.7, 0, -0.6, -14.4, 0.02, 0.6, COUL.gravier, m.mat, { crasse: false, nuance: 0 });
  c.pave(2.4, 0, -10, 4.7, 0.02, 20, COUL.gravier, m.mat, { crasse: false, nuance: 0 });
  c.pave(-2.2, 0, 17.4, 2.4, 0.02, 18.6, COUL.gravier, m.mat, { crasse: false, nuance: 0 });
  // L'allée du presbytère, de la barrière à la porte, et vers le puits
  c.pave(12.3, 0, -4.8, 13.7, 0.02, 20, COUL.gravier, m.mat, { crasse: false, nuance: 0 });
  c.pave(13.7, 0, 2.4, 23.6, 0.02, 3.6, COUL.gravier, m.mat, { crasse: false, nuance: 0 });
  c.pave(5, 0, 0, 12.3, 0.02, 1.1, COUL.gravier, m.mat, { crasse: false, nuance: 0 });
  // Le dallage de l'église : nef et bas-côtés, chœur, chapelle, sacristie, porche
  c.pave(-14, 0, -10, 2, 0.04, 10, COUL.dalle, m.dallage, { crasse: false, nuance: 0 });
  c.pave(-9.5, 0, -17, -2.5, 0.05, -10, 0xddd5c4, m.dallage, { crasse: false, nuance: 0 });
  c.pave(-19, 0, -7, -14, 0.04, -1, COUL.dalle, m.dallage, { crasse: false, nuance: 0 });
  c.pave(-2.5, 0, -16, 2, 0.04, -10, 0xc4bba8, m.dallage, { crasse: false, nuance: 0 });
  c.pave(-15, 0, 10, -10, 0.045, 15, COUL.dalle, m.dallage, { crasse: false, nuance: 0 });
  c.pave(-19, 0, 10.5, -15, 0.03, 14.5, 0x8f7c62, m.mat, { crasse: false, nuance: 0 });
  // L'herbe gagne entre les dalles
  const pts = [];
  for (let i = 0; i < 70 * usure; i++) pts.push([c.entre(-13.5, 1.5), c.entre(-9.5, 9.5), 0.04]);
  for (let i = 0; i < 26 * usure; i++) pts.push([c.entre(-9.6, -2.4), c.entre(10.6, 19.8), 0.04]);
  touffes(c, pts.filter((_, i) => i % 3 === 0), COUL.herbeHaute);
}

// ---------- La nef, les bas-côtés, l'arcature, les toits ----------

function nef(k) {
  const { c, E, m, usure } = k;
  const bas = [{ ch: c, y0: 0, y1: CUT }, { ch: E, y0: CUT, y1: HA }];
  const int = { couleur: COUL.badigeon, mat: m.enduit };
  const lanc = (u, vitrail, tache = false) => ({ u, l: 1.0, bas: 1.9, haut: 4.1, forme: "ogive", type: "vide", vitrail, tache });
  // Le bas-côté est (côté caméra : coupé à l'allège), quatre lancettes, une porte latérale
  murBandes(k, [2, 10], [2, -10], { interieur: int, ouvertures: [lanc(2, 0, true), lanc(6, 3, true), lanc(14, 1, true), lanc(18, 4), { u: 16, l: 1.4, bas: 0, haut: 2.9, forme: "ogive", type: "porte", vantail: "entrouvert", couleurPorte: COUL.cheneSombre, angle: 1.4 }] }, bas);
  // Le bas-côté ouest (au fond : entier), trois lancettes et l'arc de la chapelle
  murBandes(k, [-14, -10], [-14, 10], { interieur: int, ouvertures: [lanc(2, 2), lanc(11, 5), lanc(15, 1), lanc(18, 4), { u: 6, l: 3.2, bas: 0, haut: 4.3, forme: "cintre", type: "vide" }] }, [{ ch: c, y0: 0, y1: HA }]);
  // Les murs nord des bas-côtés : l'ouest entier, l'est (vers la sacristie) coupé
  murBandes(k, [-10, -10], [-14, -10], { interieur: int }, [{ ch: c, y0: 0, y1: HA }]);
  pignon(c, k, [-10, -10], [-14, -10], -0.3, 4.35, HA, 1.9, 0.7, COUL.pierre, m.pierre, -0.3);
  murBandes(k, [2, -10], [-2, -10], { interieur: int, ouvertures: [{ u: 2, l: 1.0, bas: 0, haut: 2.3, type: "porte", vantail: "entrouvert", couleurPorte: COUL.chene, angle: 1.2 }] }, bas);
  pignon(E, k, [2, -10], [-2, -10], -0.35, 4, HA, 1.9, 0.7, COUL.pierre, m.pierre, 4);
  // Contreforts du bas-côté est (coupés) et ouest (entiers)
  for (const z of [10, 6, -2, -10]) contrefort(k, E, 2, z === 10 ? 9.65 : z === -10 ? -9.65 : z, 1, 0, 3.8);
  for (const z of [6, -10]) contrefort(k, null, -14, z === -10 ? -9.65 : z, -1, 0, 3.8);

  // Les piliers ronds de la nef (toujours visibles) : base, fût, chapiteau
  for (const x of [-10, -2]) for (const z of [6, 2, -2, -6]) {
    c.pave(x - 0.5, 0, z - 0.5, x + 0.5, 0.35, z + 0.5, COUL.pierreSombre, m.pierre, { nuance: 0.03 });
    c.tube([x, 0.35, z], [x, 3.95, z], 0.36, COUL.pierre, m.pierre, 8);
    c.pave(x - 0.42, 3.9, z - 0.42, x + 0.42, 4.05, z + 0.42, COUL.pierreSombre, m.pierre, { crasse: false });
    c.pave(x - 0.55, 4.05, z - 0.55, x + 0.55, 4.3, z + 0.55, COUL.pierre, m.pierre, { crasse: false });
    k.b.obstacle(x - 0.45, z, x + 0.45, z, "pilier");
  }
  // Les arcatures et les fenêtres hautes (couche) : arcs en plein cintre, murs gouttereaux jusqu'à 10 m
  const hautes = { "-2": [0, 3, 1, 4, 2], "-10": [1, 5, 0, 3, 2] };
  for (const x of [-2, -10]) {
    const a = [x, 10];
    const bb = [x, -10];
    const s = new THREE.Shape();
    s.moveTo(0, 4.3);
    for (let i = 0; i < 5; i++) {
      const u = 2 + i * 4;
      s.lineTo(u - 1.6, 4.3);
      for (const [px, py] of pointsArc(u, 4.3, 3.2, "cintre").slice(1)) s.lineTo(px, py);
    }
    s.lineTo(20, 4.3);
    s.lineTo(20, HN);
    s.lineTo(0, HN);
    s.closePath();
    for (let i = 0; i < 5; i++) s.holes.push(cheminBaie(2 + i * 4, 7.0, 9.3, 0.9, "ogive"));
    E.repere(cadre(a, bb), () => {
      poserForme(E, m.pierre, COUL.pierre, s, 0.6);
      // Une moulure : le bandeau sous les fenêtres hautes et la corniche
      E.pave(0, 6.6, -0.42, 20, 6.75, 0.42, COUL.pierreSombre, m.pierre, { crasse: false });
      E.pave(0, HN - 0.05, -0.45, 20, HN + 0.2, 0.45, COUL.pierreSombre, m.pierre, { crasse: false });
      for (let i = 0; i < 5; i++) panneau(E, m.vitraux, R["v" + hautes[x][i]], { x: 2 + i * 4, y: 8.15, z: 0 }, 0.9, 2.3);
    });
    // Le soleil vient de l'est : seules les fenêtres hautes de l'est posent leurs couleurs dans la nef
    if (x === -2) for (let i = 0; i < 5; i++) if (VITRAUX[hautes[x][i]].brise === 0) tacheVitrail(k, [x, 10 - (2 + i * 4)], [0, -1], 0.9, 7.0, 8.9, hautes[x][i]);
  }
  // Les toits : la nef (crevée, fermes à nu), les deux appentis des bas-côtés
  toiture(E, k, { axe: "z", f: -6, d1: -10, d2: 10.4, y0: HN, demi: 4.3, hf: 4.4, debord: 0.45, fermes: 3.4, cassees: usure > 0.3 ? [-5.3] : [], trous: usure > 0.25 ? [{ d1: -8.2, d2: -2.4, cote: -1, v1: 0, v2: 1 }, { d1: -6.6, d2: -3.8, cote: 1, v1: 0.4, v2: 1 }] : [] });
  toiture(E, k, { axe: "z", f: -10.3, d1: -10.35, d2: 9.6, y0: HA, demi: 4.05, hf: 1.8, cotes: [-1], faitage: false });
  toiture(E, k, { axe: "z", f: -1.7, d1: -10.0, d2: 10.4, y0: HA, demi: 4.05, hf: 1.8, cotes: [1], faitage: false, trous: usure > 0.4 ? [{ d1: 2.2, d2: 4.6, cote: 1, v1: 0.3, v2: 1 }] : [] });
  // Le toit de la nef est tombé dans la nef : gravats, ardoises, une ferme brisée, une flaque, des herbes
  if (usure > 0.25) {
    gravats(c, -8.2, -5.2, 2.2, 22 + 24 * usure, [COUL.pierre, COUL.pierreSombre, COUL.ardoise, 0x6a5040], 0.04);
    for (let i = 0; i < 26 * usure; i++) c.boite(c.entre(0.25, 0.4), 0.03, c.entre(0.2, 0.3), COUL.ardoise, { x: c.entre(-9.8, -5), y: 0.08 + c.hasard() * 0.3, z: c.entre(-8.4, -2), ry: c.hasard() * 3, rx: c.entre(-0.5, 0.5) }, m.mat, { crasse: false, nuance: 0.06 });
    c.poutre([-9.6, 0.1, -4.6], [-4.4, 1.1, -6.2], 0.24, COUL.cheneSombre, m.mat);
    c.poutre([-7.6, 0.05, -3.2], [-5.6, 1.8, -5.9], 0.2, COUL.cheneSombre, m.mat);
    c.poutre([-8.8, 0.08, -7.4], [-6.4, 0.4, -7.9], 0.18, COUL.cheneSombre, m.mat);
    flaque(c, -7.0, -3.4, 1.3, 0.05);
    semerTouffes(c, -9.6, -8, -6, -2.5, 30 * usure, COUL.herbeHaute, 0.04);
    arbuste(c, -9.2, -7.6, 0.6 + 0.6 * usure, 0.04);
    mousse(c, -8, 0.03, -4, 2, Math.round(8 * usure));
  }
  // Le lierre entre par les vitraux brisés de l'ouest, et grimpe dehors
  lierre(c, -14.42, 0, -6, -Math.PI / 2, 5, 4.4, 110 * usure);
  lierre(c, -14.42, 0, 5.5, -Math.PI / 2, 3.5, 3.8, 70 * usure);
  lierre(c, -13.58, 2.2, 1, Math.PI / 2, 1.6, 2, 30 * usure);
  lierre(c, 2.42, 0, -1, Math.PI / 2, 2.5, CUT, 30 * usure);
  lierre(E, 2.42, CUT, -1, Math.PI / 2, 2.5, 3.2, 40 * usure);
  // Le vitrail tombé du bas-côté est : plomb et verre de couleur sur les dalles
  for (let i = 0; i < 14; i++) c.boite(c.entre(0.08, 0.2), 0.012, c.entre(0.06, 0.16), VITRAUX[3].tons[i % 4], { x: c.entre(0.3, 1.5), y: 0.05, z: c.entre(2.6, 4.6), ry: c.hasard() * 3 }, m.satin, { crasse: false });
  jonchee(c, -13.5, -9.5, 1.5, 9.5, 120 * usure, undefined, 0.05);
  debris(c, -13.5, -9.5, 1.5, 9.5, 50 * usure, [COUL.badigeon, COUL.pierre, 0xd9d2c0], 0.04);
}

// ---------- La façade sud : portail, rosace, pignon ----------

function facade(k) {
  const { c, E, m, usure } = k;
  const a = [-10, 10];
  const b = [-2, 10];
  // En bas : le soubassement, coupé à l'allège, avec la baie du portail
  mur(c, a, b, { h: CUT, ep: 0.8, couleur: COUL.pierre, mat: m.pierre, batiment: k.b, ouvertures: [{ u: 4, l: 2.6, bas: 0, haut: 5, type: "vide" }] });
  // En haut : le mur et le pignon d'une seule pièce, percés du portail et de la rosace
  const s = new THREE.Shape();
  s.moveTo(-0.4, CUT);
  s.lineTo(2.7, CUT);
  for (const [px, py] of pointsArc(4, 3.4, 2.6, "cintre")) s.lineTo(px, py);
  s.lineTo(5.3, CUT);
  s.lineTo(8.4, CUT);
  s.lineTo(8.4, HN);
  s.lineTo(4, HN + 4.7);
  s.lineTo(-0.4, HN);
  s.closePath();
  const trou = new THREE.Path();
  trou.absarc(4, 8.1, ROSACE.r, 0, Math.PI * 2, true);
  s.holes.push(trou);
  E.repere(cadre(a, b), () => {
    poserForme(E, m.pierre, COUL.pierre, s, 0.8);
    // Les voussures du portail, le tympan nu, le linteau
    for (const [r, t] of [[1.55, 0.14], [1.78, 0.12]]) {
      const g = new THREE.TorusGeometry(r, t, 4, 12, Math.PI);
      E.poser(g, m.pierre, COUL.pierreSombre, { x: 4, y: 3.4, z: 0.42 }, { crasse: false });
      g.dispose();
    }
    E.pave(2.5, 3.25, -0.3, 5.5, 3.45, 0.3, COUL.pierreSombre, m.pierre, { crasse: false });
    // La rosace : remplage de pierre (cercle, rayons, anneau), à moitié brisé ; le vitrail
    const ro = new THREE.TorusGeometry(ROSACE.r, 0.13, 4, 20);
    E.poser(ro, m.pierre, COUL.pierreSombre, { x: 4, y: 8.1, z: 0.38 }, { crasse: false });
    ro.dispose();
    for (let j = 0; j < 12; j++) {
      const brise = ROSACE.brisesExt.has(j) && ROSACE.brisesExt.has((j + 11) % 12);
      const ang = (j * Math.PI) / 6;
      const r1 = ROSACE.r * 0.28;
      const r2 = brise ? ROSACE.r * 0.55 : ROSACE.r;
      E.poutre([4 + Math.cos(ang) * r1, 8.1 + Math.sin(ang) * r1, 0], [4 + Math.cos(ang) * r2, 8.1 + Math.sin(ang) * r2, 0], 0.09, COUL.pierre, m.pierre);
      if (!ROSACE.brisesMil.has(j)) {
        const t1 = ang;
        const t2 = ang + Math.PI / 6;
        const rr = ROSACE.r * 0.55;
        E.poutre([4 + Math.cos(t1) * rr, 8.1 + Math.sin(t1) * rr, 0], [4 + Math.cos(t2) * rr, 8.1 + Math.sin(t2) * rr, 0], 0.08, COUL.pierre, m.pierre);
      }
    }
    const coeur = new THREE.TorusGeometry(ROSACE.r * 0.28, 0.06, 3, 10);
    E.poser(coeur, m.pierre, COUL.pierre, { x: 4, y: 8.1, z: 0 }, { crasse: false });
    coeur.dispose();
    panneau(E, m.vitraux, R.rosace, { x: 4, y: 8.1, z: 0 }, ROSACE.r * 2, ROSACE.r * 2);
    // La corniche, les rampants du pignon, la croix de pierre au sommet
    E.pave(-0.4, HN - 0.1, -0.45, 8.4, HN + 0.1, 0.55, COUL.pierreSombre, m.pierre, { crasse: false });
    const ram = Math.hypot(4.4, 4.7);
    const pente = Math.atan2(4.7, 4.4);
    E.boite(ram + 0.2, 0.22, 0.95, COUL.pierreSombre, { x: 1.8, y: HN + 2.4, z: 0, rz: pente }, m.pierre, { crasse: false });
    E.boite(ram + 0.2, 0.22, 0.95, COUL.pierreSombre, { x: 6.2, y: HN + 2.4, z: 0, rz: -pente }, m.pierre, { crasse: false });
    E.pave(3.92, HN + 4.7, -0.08, 4.08, HN + 5.8, 0.08, COUL.pierre, m.pierre, { crasse: false });
    E.pave(3.65, HN + 5.25, -0.08, 4.35, HN + 5.41, 0.08, COUL.pierre, m.pierre, { crasse: false });
    // Des coulures sombres sous la rosace et la corniche
    for (let i = 0; i < 14; i++) {
      const x = E.entre(0, 8);
      const lg = E.entre(0.8, 2.6);
      E.pave(x, HN - 0.1 - lg, 0.41, x + E.entre(0.06, 0.2), HN - 0.1, 0.43, 0x8a8170, m.mat, { crasse: false, nuance: 0.08 });
    }
  });
  // La couleur de la rosace sur les dalles du bas-côté ouest (le soleil du sud-est la traverse)
  for (let anneau = 0; anneau < 3; anneau++) {
    const [r1, r2] = [[0, 0.27], [0.3, 0.53], [0.58, 0.97]][anneau];
    const n = anneau === 0 ? 6 : 12;
    for (let j = 0; j < n; j++) {
      if (anneau === 2 && ROSACE.brisesExt.has(j)) continue;
      if (anneau === 1 && ROSACE.brisesMil.has(j)) continue;
      const t1 = (j / n) * Math.PI * 2 + 0.04;
      const t2 = ((j + 1) / n) * Math.PI * 2 - 0.04;
      const pt = (r, t) => auSol(-6 + Math.cos(t) * r * ROSACE.r, 8.1 + Math.sin(t) * r * ROSACE.r, 10);
      const couleur = anneau === 0 ? ROSACE.centre : anneau === 1 ? ROSACE.mil[j % 2] : ROSACE.ext[j % 2];
      quadSol(c, k.m.lueur, couleur, [pt(r1, t1), pt(r2, t1), pt(r2, t2), pt(r1, t2)]);
    }
  }
  // Le bas-côté est en façade : une lancette (sa couleur tombe dans le bas-côté), le pignon d'appentis
  murBandes(k, [-2, 10], [2, 10], { ep: 0.7, interieur: { couleur: COUL.badigeon, mat: m.enduit }, ouvertures: [{ u: 2, l: 1.0, bas: 1.9, haut: 4.1, forme: "ogive", type: "vide", vitrail: 2, tache: true }] }, [{ ch: c, y0: 0, y1: CUT }, { ch: E, y0: CUT, y1: HA }]);
  pignon(E, k, [-2, 10], [2, 10], 0, 4.35, HA, 1.9, 0.7, COUL.pierre, m.pierre, 0);
  // Les contreforts de la façade
  for (const x of [-10, -2]) contrefort(k, E, x, 10.05, 0, 1, 6.2);
  // Le portail : un vantail entrouvert, l'autre tombé à l'intérieur
  c.repere({ x: -7.25, y: 0.04, z: 9.75, ry: 0.9 }, () => {
    c.pave(0, 0, -0.06, 1.3, 3.35, 0.06, COUL.cheneSombre, m.mat, { nuance: 0.03 });
    for (const y of [0.5, 1.6, 2.7]) c.pave(0, y, 0.06, 1.25, y + 0.07, 0.09, COUL.fer, m.tole, { crasse: false });
  });
  c.boite(1.3, 0.12, 3.3, COUL.cheneSombre, { x: -5.2, y: 0.12, z: 7.9, ry: 0.2, rx: 0.05 }, m.mat, { nuance: 0.04 });
  for (const dz of [-1.1, 0, 1.1]) c.boite(1.25, 0.04, 0.07, COUL.fer, { x: -5.2 + dz * 0.2, y: 0.2, z: 7.9 + dz, ry: 0.2 }, m.tole, { crasse: false });
  lierre(c, -9.2, 0, 10.42, 0, 1.8, CUT, 20 * usure);
  lierre(E, -9.2, CUT, 10.42, 0, 1.8, 3.4, 40 * usure);
}

// ---------- Le chœur : chevet plat, triplet, arc triomphal, toit crevé où passe l'arbre ----------

function choeur(k) {
  const { c, E, m, usure } = k;
  const int = { couleur: COUL.badigeon, mat: m.enduit };
  // L'arc triomphal : bas coupé, haut (mur de la nef au-dessus du chœur, avec son pignon) en couche
  mur(c, [-2, -10], [-10, -10], { h: CUT, ep: 0.8, couleur: COUL.pierre, mat: m.pierre, batiment: k.b, ouvertures: [{ u: 4, l: 5, bas: 0, haut: 9, type: "vide" }] });
  const s = new THREE.Shape();
  s.moveTo(-0.4, CUT);
  s.lineTo(1.5, CUT);
  for (const [px, py] of pointsArc(4, 6.0, 5, "cintre")) s.lineTo(px, py);
  s.lineTo(6.5, CUT);
  s.lineTo(8.4, CUT);
  s.lineTo(8.4, HN);
  s.lineTo(4, HN + 4.7);
  s.lineTo(-0.4, HN);
  s.closePath();
  E.repere(cadre([-2, -10], [-10, -10]), () => {
    poserForme(E, m.pierre, COUL.pierre, s, 0.8);
    const g = new THREE.TorusGeometry(2.55, 0.16, 4, 12, Math.PI);
    E.poser(g, m.pierre, COUL.pierreSombre, { x: 4, y: 6.0, z: -0.42 }, { crasse: false });
    g.dispose();
  });
  // Le mur est du chœur (au-dessus de la sacristie : deux lancettes ; en bas, la porte de la sacristie)
  murBandes(k, [-2.5, -10], [-2.5, -17], { interieur: int, ouvertures: [
    { u: 1.6, l: 0.9, bas: 5.0, haut: 7.4, forme: "ogive", type: "vide", vitrail: 0, tache: true },
    { u: 5.2, l: 0.9, bas: 5.0, haut: 7.4, forme: "ogive", type: "vide", vitrail: 3, tache: true },
    { u: 3, l: 1.0, bas: 0, haut: 2.2, type: "porte", vantail: "entrouvert", couleurPorte: COUL.chene, angle: -1.3 },
  ] }, [{ ch: c, y0: 0, y1: CUT }, { ch: E, y0: CUT, y1: HC }]);
  // Le mur ouest et le chevet (au fond : entiers), le triplet de lancettes, le pignon
  murBandes(k, [-9.5, -17], [-9.5, -10], { interieur: int, ouvertures: [
    { u: 2.4, l: 1.0, bas: 3.4, haut: 6.8, forme: "ogive", type: "vide", vitrail: 1 },
    { u: 5.0, l: 1.0, bas: 3.4, haut: 6.8, forme: "ogive", type: "vide", vitrail: 4 },
  ] }, [{ ch: c, y0: 0, y1: HC }]);
  murBandes(k, [-2.5, -17], [-9.5, -17], { interieur: int, ouvertures: [
    { u: 2, l: 0.8, bas: 4.4, haut: 7.0, forme: "ogive", type: "vide", vitrail: 2 },
    { u: 3.5, l: 1.0, bas: 4.2, haut: 7.6, forme: "ogive", type: "vide", vitrail: 0 },
    { u: 5, l: 0.8, bas: 4.4, haut: 7.0, forme: "ogive", type: "vide", vitrail: 5 },
  ] }, [{ ch: c, y0: 0, y1: HC }]);
  pignon(c, k, [-2.5, -17], [-9.5, -17], -0.35, 7.35, HC, 3.4);
  c.pave(-6.08, HC + 3.4, -17.08, -5.92, HC + 4.5, -16.92, COUL.pierre, m.pierre, { crasse: false });
  c.pave(-6.35, HC + 3.9, -17.08, -5.65, HC + 4.05, -16.92, COUL.pierre, m.pierre, { crasse: false });
  for (const x of [-9.5, -2.5]) contrefort(k, x === -2.5 ? E : null, x, -16.65, 0, -1, 5.6);
  // Le toit du chœur : crevé à l'ouest, l'arbre passe au travers ; fermes
  toiture(E, k, { axe: "z", f: -6, d1: -17.4, d2: -10.2, y0: HC, demi: 3.85, hf: 3.4, debord: 0.4, fermes: 2.5, cassees: [-14.9], trous: usure > 0.2 ? [{ d1: -16.6, d2: -12.2, cote: -1, v1: 0, v2: 1 }, { d1: -15.4, d2: -13.6, cote: 1, v1: 0.45, v2: 1 }] : [] });
  // Le lierre du chevet, et l'arbre du chœur (il a soulevé les dalles)
  lierre(c, -6, 0, -17.42, Math.PI, 6, 6.5, 120 * usure);
  // (sous un toit encore intact, ce n'est qu'un jeune arbuste)
  if (usure > 0.2) arbre(c, -7.4, -13.8, 9 + 4 * usure, "feuillu", 0.05);
  else arbuste(c, -7.4, -13.8, 1.2, 0.05);
  for (let i = 0; i < 7; i++) {
    const ang = (i / 7) * Math.PI * 2;
    c.boite(c.entre(0.5, 0.8), 0.1, c.entre(0.4, 0.6), 0xddd5c4, { x: -7.4 + Math.cos(ang) * 0.9, y: 0.12, z: -13.8 + Math.sin(ang) * 0.9, ry: ang, rx: c.entre(-0.3, 0.3), rz: c.entre(-0.3, 0.3) }, m.dallage, { nuance: 0.03 });
  }
  for (let i = 0; i < 4; i++) {
    const ang = c.hasard() * Math.PI * 2;
    c.tube([-7.4, 0.25, -13.8], [-7.4 + Math.cos(ang) * 1.6, 0.03, -13.8 + Math.sin(ang) * 1.6], 0.08, 0x5e4a36, m.mat, 5);
  }
  k.b.obstacle(-7.8, -13.8, -7.0, -13.8, "arbre");
  jonchee(c, -9.2, -16.7, -2.8, -10.3, 90 * usure, undefined, 0.06);
  semerTouffes(c, -9, -16.5, -3, -10.5, 24 * usure, COUL.herbeHaute, 0.05);
}

// ---------- La chapelle latérale ----------

function chapelle(k) {
  const { c, E, m, usure } = k;
  const int = { couleur: COUL.badigeon, mat: m.enduit };
  murBandes(k, [-19, -7], [-19, -1], { interieur: int, ouvertures: [{ u: 3, l: 0.9, bas: 2.0, haut: 4.0, forme: "ogive", type: "vide", vitrail: 1 }] }, [{ ch: c, y0: 0, y1: HA }]);
  murBandes(k, [-14, -7], [-19, -7], { interieur: int }, [{ ch: c, y0: 0, y1: HA }]);
  murBandes(k, [-19, -1], [-14, -1], { interieur: int, ouvertures: [{ u: 3.2, l: 1.0, bas: 1.8, haut: 4.0, forme: "ogive", type: "vide", vitrail: 0, tache: true }] }, [{ ch: c, y0: 0, y1: CUT }, { ch: E, y0: CUT, y1: HA }]);
  pignon(c, k, [-19, -7], [-19, -1], -0.35, 6.35, HA, 2.2);
  toiture(E, k, { axe: "x", f: -4, d1: -19.4, d2: -14.3, y0: HA, demi: 3.35, hf: 2.2, debord: 0.35, trous: usure > 0.6 ? [{ d1: -18.6, d2: -17.2, cote: 1, v1: 0.5, v2: 1 }] : [] });
  contrefort(k, null, -19, -6.65, -1, 0, 3.6);
  lierre(c, -19.42, 0, -4, -Math.PI / 2, 5, 4.2, 100 * usure);
  arbuste(c, -20, -1.6, 1.2, 0);
}

// ---------- La sacristie ----------

function sacristie(k) {
  const { c, E, m, usure } = k;
  const int = { couleur: 0xd8d0bc, mat: m.enduit };
  murBandes(k, [2, -16], [-2.5, -16], { interieur: int }, [{ ch: c, y0: 0, y1: 3.4 }]);
  pignon(c, k, [2, -16], [-2.5, -16], -0.35, 4.85, 3.4, 1.0, 0.7, COUL.pierre, m.pierre, 4.85);
  murBandes(k, [2, -10], [2, -16], { interieur: int, ouvertures: [
    { u: 3, l: 1.0, bas: 0, haut: 2.2, type: "porte", vantail: "entrouvert", couleurPorte: 0x5a4a3a, angle: 1.0 },
    { u: 5, l: 0.8, bas: 1.3, haut: 2.6, type: "fenetre", croisillons: 1, traverses: 2, cadre: 0x6a5a48, appui: true, bris: k.bris, verre: m.verre },
  ] }, [{ ch: c, y0: 0, y1: CUT }, { ch: E, y0: CUT, y1: 3.4 }]);
  toiture(E, k, { axe: "z", f: -2.15, d1: -16.4, d2: -10.35, y0: 3.4, demi: 4.2, hf: 0.95, cotes: [1], faitage: false, trous: usure > 0.5 ? [{ d1: -12.4, d2: -11.2, cote: 1, v1: 0.5, v2: 1 }] : [] });
  lierre(c, 2.42, 0, -14.5, Math.PI / 2, 2, CUT, 20 * usure);
}

// ---------- Le clocher-porche et sa flèche ----------

function clocher(k) {
  const { c, K, m, usure } = k;
  const H = 19.4;
  const ep = 0.8;
  const cloche = (u, casse) => ({ u, l: 0.9, bas: 14.2, haut: 17.8, forme: "cintre", type: "vide", abatSon: casse ? "casse" : true });
  const fente = (u) => ({ u, l: 0.4, bas: 7.4, haut: 9.0, forme: "cintre", type: "vide" });
  const avant = (y1) => [{ ch: c, y0: 0, y1 }, { ch: K, y0: y1, y1: 6.0 }, { ch: K, y0: 6.0, y1: 13.0 }, { ch: K, y0: 13.0, y1: H }];
  const murs = [
    { a: [-15, 15], b: [-10, 15], coupe: CUT, ouv: [{ u: 2.5, l: 1.9, bas: 0, haut: 3.6, forme: "ogive", type: "vide" }, fente(2.5), cloche(1.55), cloche(3.45)] },
    { a: [-10, 15], b: [-10, 10], coupe: CUT, ouv: [fente(2.5), cloche(1.55, true), cloche(3.45)] },
    { a: [-15, 10], b: [-15, 15], coupe: 4.5, ouv: [{ u: 2.5, l: 1.0, bas: 0, haut: 2.3, type: "porte", vantail: "entrouvert", couleurPorte: 0x6a5a48, angle: -1.0 }, fente(2.5), cloche(1.55), cloche(3.45)] },
    { a: [-10, 10], b: [-15, 10], coupe: 4.5, ouv: [{ u: 2.5, l: 1.6, bas: 0, haut: 3.2, forme: "ogive", type: "vide" }, fente(2.5), cloche(1.55), cloche(3.45)] },
  ];
  for (const w of murs) {
    murBandes(k, w.a, w.b, { ep, ouvertures: w.ouv }, avant(w.coupe));
    // Les abat-sons : lames inclinées ; à l'est, crevés (la cloche est passée par là)
    for (const o of w.ouv.filter((q) => q.abatSon)) {
      K.repere(cadre(w.a, w.b), () => {
        for (let i = 0; i < 7; i++) {
          if (o.abatSon === "casse" && i !== 0 && i !== 6) continue;
          K.boite(o.l, 0.04, 0.5, 0x5a4a3a, { x: o.u, y: o.bas + 0.3 + i * 0.42, z: 0, rx: 0.6 }, m.mat, { crasse: false });
        }
        if (o.abatSon === "casse") K.boite(o.l * 0.9, 0.04, 0.5, 0x5a4a3a, { x: o.u + 0.25, y: o.bas + 0.9, z: 0.4, rx: 1.3, rz: 0.4 }, m.mat, { crasse: false });
      });
    }
  }
  // Contreforts d'angle (sud) : bas en base, haut dans la couche du clocher
  contrefort(k, K, -15, 14.65, 0, 1, 9);
  contrefort(k, K, -10, 14.65, 0, 1, 9);
  contrefort(k, K, -10.35, 15, 1, 0, 9);
  // Le plancher du porche (voûte) percé de la trappe des cordes, les cordons d'étage, la corniche
  const y = 4.5;
  for (const [x1, z1, x2, z2] of [[-14.6, 10.4, -10.4, 12.1], [-14.6, 12.9, -10.4, 14.6], [-14.6, 12.1, -12.9, 12.9], [-12.1, 12.1, -10.4, 12.9]]) K.pave(x1, y, z1, x2, y + 0.3, z2, COUL.pierreSombre, m.pierre, { crasse: false });
  for (const [yy, s, h] of [[6.0, 0.15, 0.22], [13.0, 0.18, 0.26], [H, 0.32, 0.4]]) {
    K.pave(-15.4 - s, yy, 14.6, -9.6 + s, yy + h, 15.4 + s, COUL.pierreSombre, m.pierre, { crasse: false });
    K.pave(-15.4 - s, yy, 9.6 - s, -9.6 + s, yy + h, 10.4, COUL.pierreSombre, m.pierre, { crasse: false });
    K.pave(-15.4 - s, yy, 10.4, -14.6, yy + h, 14.6, COUL.pierreSombre, m.pierre, { crasse: false });
    K.pave(-10.4, yy, 10.4, -9.6 + s, yy + h, 14.6, COUL.pierreSombre, m.pierre, { crasse: false });
  }
  // L'horloge arrêtée, au sud
  panneau(K, m.enseignes, R.horloge, { x: -12.5, y: 10.6, z: 15.43 }, 1.5, 1.5);
  const cerc = new THREE.TorusGeometry(0.78, 0.08, 4, 14);
  K.poser(cerc, m.pierre, COUL.pierreSombre, { x: -12.5, y: 10.6, z: 15.42 }, { crasse: false });
  cerc.dispose();
  // Le beffroi vide : poteaux et moises de chêne, une traverse brisée qui pend
  for (const [x, z] of [[-14, 11], [-11, 11], [-14, 14], [-11, 14]]) K.tube([x, 13.3, z], [x, 18.6, z], 0.14, COUL.cheneSombre, m.mat, 4);
  K.pave(-14.2, 17.2, 10.8, -10.8, 17.5, 11.2, COUL.cheneSombre, m.mat);
  K.pave(-14.2, 17.2, 13.8, -10.8, 17.5, 14.2, COUL.cheneSombre, m.mat);
  K.poutre([-11, 17.3, 11.1], [-12.3, 14.6, 13.4], 0.26, COUL.cheneSombre, m.mat);
  // La flèche d'ardoise octogonale, ses lucarnes, ses pinacles, la croix et le coq
  const yb = H + 0.4;
  const hf = 12;
  const apo = 2.75;
  const g = new THREE.CylinderGeometry(0.05, apo / Math.cos(Math.PI / 8), hf, 8, 1, true);
  g.rotateY(Math.PI / 8);
  K.poser(g, m.ardoise, COUL.ardoise, { x: -12.5, y: yb + hf / 2, z: 12.5 }, { crasse: false, nuance: 0 });
  g.dispose();
  const incl = Math.atan2(apo, hf);
  for (let i = 0; i < 4; i++) {
    const t = (i * Math.PI) / 2;
    // Lucarne sur chaque grande face
    K.repere({ x: -12.5, y: yb, z: 12.5, ry: -t }, () => {
      const yl = 1.6;
      const r = apo * (1 - yl / hf);
      K.pave(r - 0.6, yl - 0.3, -0.4, r + 0.15, yl + 0.6, 0.4, COUL.ardoise, m.ardoise, { crasse: false });
      K.boite(0.95, 0.06, 0.62, COUL.ardoise, { x: r - 0.2, y: yl + 0.8, z: -0.2, rx: 0.8 }, m.ardoise, { crasse: false });
      K.boite(0.95, 0.06, 0.62, COUL.ardoise, { x: r - 0.2, y: yl + 0.8, z: 0.2, rx: -0.8 }, m.ardoise, { crasse: false });
      K.pave(r + 0.12, yl - 0.2, -0.25, r + 0.16, yl + 0.45, 0.25, 0x1f1d1b, m.mat, { crasse: false });
      // Ardoises arrachées, voliges à nu (côté est surtout)
      if (i === 0 || (i === 1 && usure > 0.6)) {
        for (let q = 0; q < 3; q++) {
          const yy = 4 + q * 1.7 + K.hasard();
          const rr = apo * (1 - yy / hf) + 0.03;
          K.boite(0.04, K.entre(0.5, 1.1), K.entre(0.4, 0.8), 0x7a6040, { x: rr, y: yy, z: K.entre(-0.5, 0.5), rz: incl }, m.mat, { crasse: false });
        }
      }
    });
    // Pinacle d'angle
    const pa = t + Math.PI / 4;
    const pc = new THREE.ConeGeometry(0.32, 2.2, 4);
    K.poser(pc, m.pierre, COUL.pierre, { x: -12.5 + Math.cos(pa) * 3.4, y: H + 0.4 + 1.1, z: 12.5 + Math.sin(pa) * 3.4, ry: Math.PI / 4 }, { crasse: false });
    pc.dispose();
  }
  const top = yb + hf;
  K.pave(-12.53, top - 0.2, 12.47, -12.47, top + 1.6, 12.53, 0x3a3634, m.metal, { crasse: false });
  K.pave(-12.85, top + 1.0, 12.47, -12.15, top + 1.07, 12.53, 0x3a3634, m.metal, { crasse: false });
  K.boite(0.5, 0.34, 0.05, 0x8a7a50, { x: -12.5, y: top + 1.85, z: 12.5, ry: 0.5 }, m.metal, { crasse: false });
  K.boite(0.16, 0.26, 0.05, 0x8a7a50, { x: -12.3, y: top + 2.0, z: 12.6, ry: 0.5, rz: 0.4 }, m.metal, { crasse: false });
  // Lierre au pied du clocher
  lierre(c, -12.5, 0, 15.42, 0, 2.2, CUT, 20 * usure);
  lierre(K, -14.6, CUT, 15.42, 0, 1.6, 7, 70 * usure);
  mousse(K, -12.5, 6.22, 15.2, 1.2, Math.round(5 * usure));
}

// ---------- L'appentis du sonneur ----------

function appentis(k) {
  const { c, A, m, usure } = k;
  const planches = 0x7d7262;
  const spec = { ep: 0.18, couleur: planches, mat: m.mat };
  murBandes(k, [-19, 10.5], [-19, 14.5], spec, [{ ch: c, y0: 0, y1: 2.7 }]);
  murBandes(k, [-15, 10.5], [-19, 10.5], spec, [{ ch: c, y0: 0, y1: 2.7 }]);
  murBandes(k, [-19, 14.5], [-15, 14.5], { ...spec, ouvertures: [{ u: 2, l: 1.2, bas: 0, haut: 2.2, type: "porte", vantail: "entrouvert", couleurPorte: 0x6a5e4e, angle: 1.5 }] }, [{ ch: c, y0: 0, y1: CUT }, { ch: A, y0: CUT, y1: 2.7 }]);
  pignon(c, k, [-15, 10.5], [-19, 10.5], -0.4, 4.1, 2.7, 1.0, 0.18, planches, m.mat, -0.4);
  pignon(A, k, [-19, 14.5], [-15, 14.5], -0.1, 4.4, 2.7, 1.0, 0.18, planches, m.mat, 4.4);
  // Couvre-joints verticaux (bardage)
  for (let z = 10.7; z < 14.4; z += 0.45) c.pave(-19.13, 0, z, -19.09, 2.7, z + 0.07, 0x6a604f, m.mat, { nuance: 0.05 });
  for (let x = -18.8; x < -15.1; x += 0.45) {
    if (Math.abs(x + 17) < 0.7) continue;
    c.pave(x, 0, 14.59, x + 0.07, CUT, 14.63, 0x6a604f, m.mat, { nuance: 0.05 });
    A.pave(x, CUT, 14.59, x + 0.07, 2.7, 14.63, 0x6a604f, m.mat, { nuance: 0.05 });
  }
  // Le toit de tôle ondulée rouillée, une plaque soulevée
  toiture(A, k, { axe: "z", f: -15.4, d1: 10.2, d2: 14.8, y0: 2.7, demi: 3.6, hf: 1.0, cotes: [-1], faitage: false, couleur: 0x8a6448, mat: m.tole, debord: 0.3, trous: usure > 0.5 ? [{ d1: 12.6, d2: 13.8, cote: -1, v1: 0.6, v2: 1 }] : [] });
  if (usure > 0.5) A.boite(1.4, 0.04, 1.3, 0x8a6448, { x: -18.6, y: 3.0, z: 13.2, rz: 0.9, ry: 0.2 }, m.tole, { crasse: false });
  lierre(c, -19.12, 0, 12, -Math.PI / 2, 2.5, 2.5, 50 * usure);
}

// ---------- Le mobilier de la nef ----------

/** Un banc d'église en chêne : debout, renversé, couché sur le dos ou brisé. */
function banc(k, x, z, ry, etat) {
  const { c, m } = k;
  if (etat === "brise") {
    c.boite(1.3, 0.06, 0.4, COUL.chene, { x: x - 0.5, y: 0.2, z, ry: ry + 0.3, rz: 0.3 }, m.satin, { nuance: 0.05 });
    c.boite(1.2, 0.5, 0.05, COUL.chene, { x: x + 0.7, y: 0.1, z: z + 0.3, ry: ry - 0.4, rx: -1.5 }, m.satin, { nuance: 0.05 });
    return;
  }
  const pose = etat === "renverse" ? { x, y: 0.3, z, ry, rx: -1.5 } : etat === "couche" ? { x, y: 0.52, z, ry, rx: 1.57 } : { x, y: 0.05, z, ry };
  c.repere(pose, () => {
    c.boite(2.5, 0.06, 0.4, COUL.chene, { y: 0.45 }, m.satin, { nuance: 0.04 });
    c.boite(2.5, 0.48, 0.05, COUL.chene, { y: 0.8, z: 0.2 }, m.satin, { nuance: 0.04 });
    c.boite(2.45, 0.05, 0.18, COUL.cheneSombre, { y: 0.78, z: 0.33 }, m.satin);
    for (const s of [-1, 1]) c.boite(0.06, 0.95, 0.52, COUL.cheneSombre, { x: s * 1.24, y: 0.47, z: 0.05 }, m.satin);
    c.boite(2.4, 0.07, 0.12, COUL.cheneSombre, { y: 0.15, z: 0.62 }, m.satin);
  });
}

function mobilierNef(k) {
  const { c, m, usure } = k;
  // Les bancs : deux rangées de part et d'autre de l'allée, en désordre ; certains déjà débités pour le feu
  for (let i = 0; i < 11; i++) {
    const z = 6.0 - i * 1.05;
    for (const x of [-8.25, -3.75]) {
      if (x < -6 && z < -2.4 && z > -8.4) continue; // sous le trou du toit : écrasés
      if (x > -6 && z > 4.5) continue; // l'orgue est tombé là
      const r = c.hasard();
      if (r < 0.12 + usure * 0.15) continue; // emportés (bois de chauffage)
      const etat = r < 0.3 ? "renverse" : r < 0.38 ? "brise" : r < 0.44 ? "couche" : "debout";
      banc(k, x + c.entre(-0.3, 0.3) * usure, z + c.entre(-0.2, 0.2) * usure, c.entre(-0.25, 0.25) * usure, etat);
    }
  }
  for (const [x, z] of [[-8, -4.6], [-7.6, -7.2]]) banc(k, x, z, c.entre(-0.6, 0.6), "brise");
  // La chaire contre un pilier : fût, cuve octogonale, escalier, abat-voix de travers
  const [cx, cz] = [-2.85, -2];
  c.tube([cx, 0.05, cz], [cx, 1.6, cz], 0.14, COUL.cheneSombre, m.satin, 6);
  const cuve = new THREE.CylinderGeometry(0.62, 0.48, 1.05, 8);
  c.poser(cuve, m.satin, COUL.chene, { x: cx, y: 2.1, z: cz }, { nuance: 0.02 });
  cuve.dispose();
  c.pave(cx - 0.65, 2.58, cz - 0.65, cx + 0.65, 2.68, cz + 0.65, COUL.cheneSombre, m.satin);
  for (let i = 0; i < 6; i++) c.pave(cx - 0.35, 0.05 + i * 0.27, cz + 0.5 + (5 - i) * 0.28, cx + 0.35, 0.05 + (i + 1) * 0.27, cz + 0.78 + (5 - i) * 0.28, COUL.chene, m.satin);
  const abat = new THREE.CylinderGeometry(0.85, 0.85, 0.14, 8);
  c.poser(abat, m.satin, COUL.cheneSombre, { x: cx - 0.2, y: 4.15, z: cz, rz: 0.35, rx: 0.12 }, { crasse: false });
  abat.dispose();
  c.boite(0.25, 0.4, 0.1, PALETTE.dore, { x: cx - 0.3, y: 4.5, z: cz, rz: 0.35 }, m.metal, { crasse: false });
  // Le lustre tombé dans l'allée : couronne, bras, pampilles
  const couronne = new THREE.TorusGeometry(0.7, 0.04, 4, 12);
  c.poser(couronne, m.metal, PALETTE.laiton, { x: -6, y: 0.12, z: 1.4, rx: Math.PI / 2 + 0.15 }, { crasse: false });
  couronne.dispose();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    c.poutre([-6, 0.3, 1.4], [-6 + Math.cos(a) * 0.7, 0.1, 1.4 + Math.sin(a) * 0.7], 0.03, PALETTE.laiton, m.metal);
  }
  for (let i = 0; i < 12; i++) c.boite(0.06, 0.02, 0.04, 0xe6e4dc, { x: -6 + c.entre(-1.4, 1.4), y: 0.06, z: 1.4 + c.entre(-1.3, 1.3), ry: c.hasard() * 3 }, m.satin, { crasse: false });
  c.tube([-6, 0.06, 1.4], [-5.2, 0.06, 0.2], 0.03, COUL.fer, m.tole, 4);
  // Les bénitiers
  for (const x of [-3.7, -8.3]) {
    c.tube([x, 0.04, 8.9], [x, 0.85, 8.9], 0.12, COUL.pierreSombre, m.pierre, 6);
    const coq = new THREE.CylinderGeometry(0.36, 0.22, 0.22, 7);
    c.poser(coq, m.pierre, COUL.pierre, { x, y: 0.95, z: 8.9 }, { crasse: false });
    coq.dispose();
  }
  // Le présentoir à cierges du bas-côté est, couvert de coulures (la cire !)
  c.repere({ x: 1.15, y: 0.04, z: -8.5, ry: -Math.PI / 2 }, () => {
    for (const s of [-0.55, 0.55]) c.pave(s - 0.03, 0, -0.03, s + 0.03, 0.9, 0.03, COUL.fer, m.tole);
    c.boite(1.25, 0.05, 0.5, COUL.fer, { y: 0.92, rx: -0.25 }, m.tole);
    for (let i = 0; i < 18; i++) {
      const hh = c.entre(0.05, 0.22);
      c.pave(-0.6 + (i % 9) * 0.14, 0.95, -0.15 + Math.floor(i / 9) * 0.22, -0.57 + (i % 9) * 0.14, 0.95 + hh, -0.12 + Math.floor(i / 9) * 0.22, COUL.cire, m.satin, { crasse: false });
    }
    for (let i = 0; i < 9; i++) c.boite(0.05, c.entre(0.2, 0.6), 0.03, COUL.cire, { x: c.entre(-0.6, 0.6), y: c.entre(0.5, 0.8), z: 0.26 }, m.satin, { crasse: false });
    c.boite(1.1, 0.04, 0.5, COUL.cire, { y: 0.02, z: 0.1 }, m.satin, { crasse: false });
  });
}

// ---------- L'orgue de tribune effondré ----------

function orgue(k) {
  const { c, E, m } = k;
  // Ce qui tient encore là-haut : la moitié ouest de la tribune, le buffet, ses tourelles de tuyaux
  E.pave(-9.65, 3.6, 7.6, -6.0, 3.85, 9.6, COUL.cheneSombre, m.mat);
  E.pave(-9.65, 3.85, 7.55, -6.1, 4.85, 7.68, COUL.chene, m.mat);
  for (let x = -9.5; x < -6.2; x += 0.3) E.pave(x, 3.85, 7.6, x + 0.06, 4.8, 7.66, COUL.cheneSombre, m.mat);
  for (let i = 0; i < 5; i++) E.poutre([-6.0, 3.7, 7.7 + i * 0.4], [-5.3 + E.entre(-0.3, 0.3), E.entre(2.2, 3.2), 7.7 + i * 0.4], 0.12, COUL.chene, m.mat);
  E.pave(-9.5, 3.85, 8.7, -6.4, 6.9, 9.55, COUL.cheneSombre, m.mat);
  E.pave(-9.6, 6.9, 8.6, -6.3, 7.2, 9.6, COUL.chene, m.mat);
  for (const [x0, n, h0] of [[-9.2, 5, 1.8], [-8.2, 7, 2.3], [-7.0, 5, 1.8]]) {
    for (let i = 0; i < n; i++) {
      if (E.hasard() < 0.25) continue;
      const x = x0 + i * 0.16;
      const hh = h0 * (1 - Math.abs(i - (n - 1) / 2) * 0.1);
      E.tube([x, 4.4, 8.6], [x, 4.4 + hh, 8.6], 0.065, COUL.etain, m.metal, 6);
    }
  }
  // Les colonnes de la tribune ; celle de l'est est tombée
  for (const x of [-9.2, -6.6]) c.tube([x, 0.04, 7.6], [x, 3.6, 7.6], 0.15, COUL.pierre, m.pierre, 8);
  c.tube([-4.6, 0.2, 7.4], [-2.6, 0.2, 5.4], 0.15, COUL.pierre, m.pierre, 8);
  // Ce qui est tombé : le plancher de la tribune sur les bancs, la console, une tourelle de tuyaux couchée
  c.boite(3.8, 0.22, 2.1, COUL.cheneSombre, { x: -4.0, y: 0.75, z: 8.5, rz: 0.36, ry: 0.05 }, m.mat, { nuance: 0.03 });
  for (let i = 0; i < 7; i++) c.boite(0.06, 0.9, 0.06, COUL.cheneSombre, { x: -5.6 + i * 0.45, y: 0.35, z: 7.4, rz: c.entre(-1.2, 1.2), rx: c.entre(-0.5, 0.5) }, m.mat);
  c.repere({ x: -3.6, y: 0.05, z: 6.6, ry: 0.5 }, () => {
    c.boite(1.5, 0.9, 0.8, COUL.chene, { y: 0.45, rx: -0.2 }, m.satin);
    for (let i = 0; i < 14; i++) c.boite(0.08, 0.03, 0.22, i % 3 === 2 ? 0x1f1d1b : 0xe8e2d0, { x: -0.6 + i * 0.09, y: 0.92, z: 0.1, rx: -0.2 }, m.satin, { crasse: false });
  });
  c.repere({ x: -3.2, y: 0.3, z: 4.6, ry: -0.35, rz: Math.PI / 2 - 0.25 }, () => {
    c.pave(-0.1, -0.7, -0.45, 2.6, 0.7, 0.45, COUL.cheneSombre, m.mat);
    for (let i = 0; i < 6; i++) c.tube([0.2 + i * 0.05, -0.5 + i * 0.2, 0.5], [2.3 - i * 0.18, -0.5 + i * 0.2, 0.5], 0.07, COUL.etain, m.metal, 6);
  });
  for (let i = 0; i < 16; i++) {
    const x = c.entre(-5.6, -2.4);
    const z = c.entre(4.4, 9.2);
    const a = c.hasard() * Math.PI;
    const lg = c.entre(0.6, 1.8);
    c.tube([x, 0.1, z], [x + Math.cos(a) * lg, 0.1 + c.hasard() * 0.3, z + Math.sin(a) * lg], c.entre(0.03, 0.08), COUL.etain, m.metal, 6);
  }
  k.b.obstacle(-5.9, 7.5, -2.3, 9.4, "orgue effondré");
  gravats(k.c, -4.2, 8.2, 1.4, 14, [COUL.cheneSombre, COUL.badigeon, COUL.pierre], 0.04);
}

// ---------- Le confessionnal reconverti ----------

function confessionnal(k) {
  const { c, m, usure } = k;
  // Contre le mur est, face à l'ouest : trois loges, celle du milieu est devenue « cabine de recharge express »
  c.repere({ x: 1.2, y: 0.04, z: 0, ry: -Math.PI / 2 }, () => {
    const ch = COUL.cheneSombre;
    c.pave(-1.45, 0, -0.45, 1.45, 0.1, 0.45, ch, m.satin);
    c.pave(-1.45, 2.4, -0.48, 1.45, 2.6, 0.5, ch, m.satin);
    c.pave(-1.45, 0, -0.45, 1.45, 2.4, -0.38, ch, m.satin);
    for (const x of [-1.42, -0.48, 0.48, 1.42]) c.pave(x - 0.04, 0, -0.45, x + 0.04, 2.4, 0.45, ch, m.satin);
    // Fronton et croix discrète
    c.pave(-0.6, 2.6, -0.3, 0.6, 2.95, 0.3, ch, m.satin);
    // Les loges latérales : rideaux violets passés, un déchiré
    for (const s of [-1, 1]) {
      const lg = s === 1 && usure > 0.5 ? 1.0 : 1.9;
      c.boite(0.86, lg, 0.02, 0x5e5070, { x: s * 0.95, y: 2.3 - lg / 2, z: 0.42 }, k.m.satin, { crasse: false, nuance: 0.06 });
    }
    // La porte du milieu, à mi-hauteur, devenue support d'écran
    c.boite(0.85, 1.6, 0.05, ch, { x: 0, y: 0.95, z: 0.42 }, m.satin);
    panneau(c, m.enseignes, R.ecran, { x: 0, y: 1.35, z: 0.46 }, 0.48, 0.48);
    // Le bandeau « RECHARGE EXPRESS » vissé sur le fronton, l'autocollant Watty sur la loge
    panneau(c, m.enseignes, R.recharge, { x: 0, y: 2.5, z: 0.52 }, 2.4, 0.45);
    panneau(c, m.enseignes, R.watty, { x: -0.95, y: 1.55, z: 0.45 }, 0.5, 0.5);
    // Le boîtier USB et ses câbles qui pendent, un tabouret de plastique dans la loge
    c.pave(0.62, 1.0, 0.43, 0.82, 1.3, 0.5, 0xe9dfc6, m.satin, { crasse: false });
    for (let i = 0; i < 4; i++) c.pave(0.66 + (i % 2) * 0.09, 1.05 + Math.floor(i / 2) * 0.12, 0.5, 0.71 + (i % 2) * 0.09, 1.08 + Math.floor(i / 2) * 0.12, 0.51, 0x1a1a1a, m.satin, { crasse: false });
    c.tube([0.7, 1.05, 0.52], [0.55, 0.2, 0.75], 0.012, 0x1a1a1a, m.satin, 3);
    c.tube([0.78, 1.05, 0.52], [0.95, 0.06, 0.9], 0.012, 0xe9dfc6, m.satin, 3);
    c.tube([0.95, 0.06, 0.9], [0.6, 0.06, 1.2], 0.012, 0xe9dfc6, m.satin, 3);
    c.pave(0.75, 0, -0.1, 1.15, 0.45, 0.3, PALETTE.abondanceOcre, m.satin);
    // Le câble d'alimentation qui part sous les dalles… vers rien
    c.tube([0, 0.06, -0.4], [0.2, 0.06, -0.9], 0.02, 0x1a1a1a, m.satin, 3);
  });
  k.b.obstacle(0.75, -1.45, 0.75, 1.45, "confessionnal");
}

// ---------- Le chœur : autel, retable, stalles, cierges ----------

function cierge(k, x, y, z, h, allume) {
  const { c, m } = k;
  c.pave(x - 0.03, y, z - 0.03, x + 0.03, y + h, z + 0.03, COUL.cire, m.satin, { crasse: false });
  if (allume) {
    const g = new THREE.ConeGeometry(0.025, 0.08, 4);
    c.poser(g, m.flamme, 0xffc060, { x, y: y + h + 0.05, z }, { crasse: false, nuance: 0 });
    g.dispose();
  }
}

function mobilierChoeur(k) {
  const { c, m, usure } = k;
  // La table de communion, en travers, à moitié tombée
  for (let x = -9.0; x < -2.9; x += 0.26) {
    if (Math.abs(x + 6) < 0.6) continue;
    if (x > -4.2 && usure > 0.4) {
      c.boite(0.07, 0.8, 0.07, COUL.pierre, { x: x + 0.1, y: 0.1, z: -10.2 + c.entre(-0.2, 0.3), rx: Math.PI / 2, ry: c.hasard() * 3 }, m.pierre, { crasse: false });
      continue;
    }
    c.pave(x - 0.035, 0.05, -10.65, x + 0.035, 0.85, -10.58, COUL.pierre, m.pierre);
  }
  c.pave(-9.1, 0.85, -10.7, -6.6, 0.95, -10.52, COUL.pierreSombre, m.pierre, { crasse: false });
  if (usure <= 0.4) c.pave(-5.4, 0.85, -10.7, -2.9, 0.95, -10.52, COUL.pierreSombre, m.pierre, { crasse: false });
  else c.boite(2.4, 0.1, 0.18, COUL.pierreSombre, { x: -4.1, y: 0.12, z: -10.1, ry: 0.15 }, m.pierre);
  k.b.obstacle(-9.1, -10.6, -6.6, -10.6, "table de communion");
  // L'autel de pierre, la nappe qui pend, le tabernacle doré ouvert et vide, les chandeliers
  c.pave(-7.2, 0.05, -16.3, -4.8, 1.0, -15.3, COUL.pierre, m.pierre);
  c.pave(-7.35, 1.0, -16.4, -4.65, 1.1, -15.15, COUL.pierreSombre, m.pierre, { crasse: false });
  c.boite(2.2, 0.02, 1.0, 0xe8e2d2, { x: -6.1, y: 1.12, z: -15.8 }, m.mat, { crasse: false });
  c.boite(1.2, 0.7, 0.02, 0xe8e2d2, { x: -6.6, y: 0.78, z: -15.12, rx: 0.05, rz: 0.08 }, m.mat, { crasse: false });
  c.pave(-6.3, 1.1, -16.35, -5.7, 1.65, -15.95, PALETTE.dore, m.metal, { crasse: false });
  c.boite(0.3, 0.45, 0.03, PALETTE.dore, { x: -5.55, y: 1.35, z: -15.85, ry: -1.0 }, m.metal, { crasse: false });
  for (const x of [-7.0, -5.0]) {
    c.tube([x, 1.1, -16.1], [x, 1.7, -16.1], 0.04, PALETTE.laiton, m.metal, 6);
    cierge(k, x, 1.7, -16.1, 0.3, true);
  }
  k.b.obstacle(-7.2, -15.3, -4.8, -15.3, "autel");
  // Le retable doré contre le chevet
  c.pave(-7.9, 1.1, -16.62, -4.1, 4.2, -16.5, 0x8a6a34, m.satin);
  panneau(c, m.enseignes, R.retable, { x: -6, y: 2.75, z: -16.48 }, 3.4, 2.26);
  c.pave(-8.0, 4.2, -16.65, -4.0, 4.45, -16.45, PALETTE.dore, m.metal, { crasse: false });
  // Les stalles du chœur
  for (const s of [-1, 1]) {
    const x = -6 + s * 2.9;
    c.pave(x - 0.3, 0.05, -14.6, x + 0.3, 0.5, -11.2, COUL.chene, m.satin);
    c.pave(x + s * 0.25, 0.05, -14.6, x + s * 0.35, 1.6, -11.2, COUL.cheneSombre, m.satin);
    c.pave(x - 0.35, 1.6, -14.6, x + 0.35, 1.7, -11.2, COUL.cheneSombre, m.satin, { crasse: false });
  }
  // Le lutrin renversé et le grand livre ouvert
  c.tube([-4.6, 0.1, -12.2], [-3.4, 0.1, -12.9], 0.05, PALETTE.laiton, m.metal, 6);
  c.boite(0.5, 0.06, 0.4, 0xd9d0b8, { x: -4.9, y: 0.08, z: -12.5, ry: 0.4, rz: 0.1 }, m.mat, { crasse: false });
  c.boite(0.5, 0.06, 0.4, 0xd9d0b8, { x: -4.45, y: 0.08, z: -12.35, ry: 0.4, rz: -0.1 }, m.mat, { crasse: false });
  // Les cierges des survivants : sur la marche de l'autel, en arc ; des coulures de cire
  for (let i = 0; i < 16; i++) {
    const a = Math.PI * (0.1 + (i / 15) * 0.8);
    cierge(k, -6 + Math.cos(a) * 1.5, 0.05, -15.0 + Math.sin(a) * 0.55, c.entre(0.08, 0.35), c.hasard() < 0.8);
  }
  for (let i = 0; i < 8; i++) c.boite(c.entre(0.08, 0.2), 0.012, c.entre(0.08, 0.2), COUL.cire, { x: -6 + c.entre(-1.6, 1.6), y: 0.055, z: -14.6 + c.entre(-0.4, 0.3), ry: c.hasard() * 3 }, m.satin, { crasse: false });
  // Une couverture et un sac : quelqu'un dort ici et veille les cierges
  c.boite(0.9, 0.06, 1.9, 0x6a6a52, { x: -3.6, y: 0.08, z: -14.0, ry: 0.15 }, m.mat, { crasse: false, nuance: 0.05 });
  c.boite(0.4, 0.5, 0.3, 0x5a5440, { x: -3.4, y: 0.3, z: -12.8, ry: 0.4 }, m.mat);
}

// ---------- La chapelle : autel, statue, ex-voto, vitrail ----------

function mobilierChapelle(k) {
  const { c, m } = k;
  c.pave(-18.65, 0.04, -5.0, -17.9, 0.95, -3.0, COUL.pierre, m.pierre);
  c.pave(-18.7, 0.95, -5.1, -17.8, 1.03, -2.9, COUL.pierreSombre, m.pierre, { crasse: false });
  c.boite(0.04, 0.6, 1.6, 0xe8e2d2, { x: -17.86, y: 0.7, z: -4.0 }, m.mat, { crasse: false });
  k.b.obstacle(-17.9, -5, -17.9, -3, "autel");
  // La statue, sur sa colonnette (le visage effacé par le temps, les mains jointes)
  c.tube([-18.3, 0.04, -6.1], [-18.3, 1.1, -6.1], 0.13, COUL.pierreSombre, m.pierre, 6);
  const robe = new THREE.CylinderGeometry(0.11, 0.26, 1.0, 7);
  c.poser(robe, m.pierre, 0xe4ddcc, { x: -18.3, y: 1.62, z: -6.1 }, { crasse: false });
  robe.dispose();
  c.poser(new THREE.IcosahedronGeometry(0.11, 1), m.pierre, 0xe4ddcc, { x: -18.3, y: 2.22, z: -6.1 }, { crasse: false });
  c.boite(0.36, 0.5, 0.1, 0xe4ddcc, { x: -18.27, y: 2.05, z: -6.1, ry: Math.PI / 2 }, m.pierre, { crasse: false });
  // Les ex-voto au mur nord
  panneau(c, m.enseignes, R.exvoto, { x: -16.3, y: 1.9, z: -6.63 }, 1.2, 1.5);
  // Le présentoir de veilleuses, les prie-Dieu
  c.pave(-15.6, 0.04, -6.5, -14.8, 0.8, -6.2, COUL.fer, m.tole);
  for (let i = 0; i < 10; i++) cierge(k, -15.55 + (i % 5) * 0.17, 0.8, -6.42 + Math.floor(i / 5) * 0.15, 0.06, i < 4);
  for (const z of [-3.4, -4.6]) {
    c.repere({ x: -16.4, y: 0.04, z, ry: Math.PI / 2 }, () => {
      c.pave(-0.3, 0, 0.0, 0.3, 0.2, 0.35, COUL.chene, m.satin);
      c.pave(-0.3, 0, -0.1, 0.3, 0.9, -0.04, COUL.chene, m.satin);
      c.pave(-0.3, 0.86, -0.25, 0.3, 0.92, 0.0, COUL.cheneSombre, m.satin);
    });
  }
  jonchee(c, -18.5, -6.5, -14.5, -1.5, 30 * k.usure, undefined, 0.05);
}

// ---------- La sacristie : armoires à chasubles, cire, registres ----------

function mobilierSacristie(k) {
  const { c, m, usure } = k;
  // Deux armoires contre le mur nord ; l'une ouverte sur ses chasubles
  for (const [x, ouverte] of [[-1.2, true], [0.7, false]]) {
    c.pave(x - 0.7, 0.04, -15.65, x + 0.7, 2.35, -15.05, COUL.cheneSombre, m.satin);
    c.pave(x - 0.75, 2.35, -15.7, x + 0.75, 2.5, -15.0, COUL.chene, m.satin, { crasse: false });
    if (ouverte) {
      c.boite(0.68, 2.2, 0.04, COUL.cheneSombre, { x: x - 0.95, y: 1.17, z: -14.8, ry: 1.2 }, m.satin);
      c.boite(0.68, 2.2, 0.04, COUL.cheneSombre, { x: x + 0.98, y: 1.17, z: -14.75, ry: -1.0 }, m.satin);
      c.pave(x - 0.66, 0.06, -15.04, x + 0.66, 2.3, -15.02, 0x2a2018, m.mat, { crasse: false });
      const tons = [0x4f7a4a, 0x5e4a7a, 0xe6dcc0, 0x9a4a40, 0xc9a85a];
      for (let i = 0; i < 5; i++) c.boite(0.04, 1.2, 0.5, tons[i], { x: x - 0.5 + i * 0.25, y: 1.5, z: -15.35, rz: c.entre(-0.06, 0.06) }, k.m.mat, { crasse: false, nuance: 0.04 });
    }
  }
  // Le chasublier : larges tiroirs plats ; un tiroir tiré, une chasuble dorée dépliée
  c.pave(-2.15, 0.04, -14.6, -1.25, 1.0, -11.4, COUL.chene, m.satin);
  for (let i = 0; i < 4; i++) c.pave(-1.26, 0.15 + i * 0.22, -14.5, -1.23, 0.3 + i * 0.22, -11.5, COUL.cheneSombre, m.satin, { crasse: false });
  c.pave(-1.25, 0.6, -14.4, -0.4, 0.7, -11.6, COUL.chene, m.satin);
  c.boite(1.0, 0.02, 1.4, 0xc9a85a, { x: -0.6, y: 0.72, z: -13, ry: 0.2 }, m.mat, { crasse: false });
  // La table et les registres paroissiaux
  c.pave(-0.9, 0.78, -12.9, 0.3, 0.84, -11.5, COUL.chene, m.satin);
  for (const [x, z] of [[-0.85, -12.85], [0.25, -12.85], [-0.85, -11.55], [0.25, -11.55]]) c.pave(x - 0.03, 0.04, z - 0.03, x + 0.03, 0.78, z + 0.03, COUL.cheneSombre, m.satin);
  for (let i = 0; i < 5; i++) c.boite(0.32, 0.07, 0.44, [0x5a3a2a, 0x3a4a3a, 0x4a3a2a][i % 3], { x: -0.6 + (i > 2 ? 0.5 : 0), y: 0.88 + (i % 3) * 0.07, z: -12.3 + (i > 2 ? 0.2 : 0), ry: c.entre(-0.2, 0.2) }, m.mat, { crasse: false });
  c.boite(0.6, 0.03, 0.42, 0xe0d6bc, { x: 0.05, y: 0.86, z: -11.85, ry: 0.3 }, m.mat, { crasse: false });
  // Caisses de cierges et pains de cire
  for (let i = 0; i < 3; i++) {
    const x = 0.6 + (i % 2) * 0.55;
    const z = -12.2 - Math.floor(i / 2) * 0.7;
    c.pave(x - 0.25, 0.04, z - 0.2, x + 0.25, 0.34, z + 0.2, 0xa08460, m.mat);
    for (let j = 0; j < 6; j++) c.pave(x - 0.2 + (j % 3) * 0.14, 0.34, z - 0.12 + Math.floor(j / 3) * 0.14, x - 0.15 + (j % 3) * 0.14, 0.42, z - 0.07 + Math.floor(j / 3) * 0.14, COUL.cire, m.satin, { crasse: false });
  }
  for (let i = 0; i < 6; i++) c.boite(0.25, 0.12, 0.16, 0xe6d8a4, { x: 1.2 + c.entre(-0.2, 0.2), y: 0.1 + (i % 3) * 0.12, z: -14.0 + Math.floor(i / 3) * 0.3, ry: c.entre(-0.3, 0.3) }, m.satin, { crasse: false });
  for (let i = 0; i < 5; i++) c.boite(0.05, 0.6, 0.05, COUL.cire, { x: c.entre(-1, 1.2), y: 0.07, z: c.entre(-14.5, -10.8), rx: Math.PI / 2, ry: c.hasard() * 3 }, m.satin, { crasse: false });
  // La piscine (évier de pierre) et le portemanteau avec son aube
  c.pave(1.2, 0.8, -10.85, 1.65, 0.95, -10.35, COUL.pierre, m.pierre);
  c.tube([-1.9, 0.04, -10.7], [-1.9, 1.9, -10.7], 0.03, COUL.cheneSombre, m.satin, 4);
  c.boite(0.5, 1.3, 0.12, 0xe8e4d8, { x: -1.9, y: 1.15, z: -10.6 }, m.mat, { crasse: false });
  debris(c, -2, -15.5, 1.5, -10.5, 20 * usure, [COUL.badigeon, 0xd9d2c0], 0.04);
}

// ---------- Le porche sous le clocher ----------

function porche(k) {
  const { c, m, usure } = k;
  // Bancs de pierre le long des murs
  c.pave(-14.6, 0.04, 11.0, -14.15, 0.48, 14.2, COUL.pierreSombre, m.pierre);
  c.pave(-10.85, 0.04, 11.0, -10.4, 0.48, 14.2, COUL.pierreSombre, m.pierre);
  // Les cordes des cloches qui descendent de la trappe ; l'une coupée net, avec sa « queue de vache » rayée
  c.tube([-12.4, 4.6, 12.5], [-12.4, 1.1, 12.5], 0.022, 0xb8a27a, m.mat, 4);
  c.pave(-12.46, 1.1, 12.44, -12.34, 1.5, 12.56, 0x9a3a32, m.mat, { crasse: false });
  c.pave(-12.46, 1.5, 12.44, -12.34, 1.6, 12.56, 0xe8e0c8, m.mat, { crasse: false });
  c.tube([-12.7, 4.6, 12.4], [-12.7, 3.0, 12.4], 0.022, 0xb8a27a, m.mat, 4);
  for (let i = 0; i < 3; i++) {
    const g = new THREE.TorusGeometry(0.28 - i * 0.04, 0.025, 3, 10);
    c.poser(g, m.mat, 0xb8a27a, { x: -11.8, y: 0.07 + i * 0.05, z: 13.6, rx: Math.PI / 2 }, { crasse: false });
    g.dispose();
  }
  // Le tableau d'affichage : l'affiche de la kermesse et les horaires de la paroisse
  c.pave(-14.62, 1.0, 11.4, -14.55, 2.2, 13.6, COUL.cheneSombre, m.satin);
  panneau(c, m.enseignes, R.kermesse, { x: -14.53, y: 1.6, z: 12.1, ry: Math.PI / 2 }, 0.72, 1.0);
  panneau(c, m.enseignes, R.paroisse, { x: -14.53, y: 1.62, z: 13.15, ry: Math.PI / 2, rz: 0.06 }, 0.48, 0.72);
  // Une seconde affiche de kermesse, collée de travers sur le contrefort de la façade
  panneau(c, m.enseignes, R.kermesse, { x: -2.0, y: 1.45, z: 10.98, rz: -0.05 }, 0.5, 0.7);
  debris(c, -14.4, 10.6, -10.6, 14.4, 16 * usure, [COUL.pierre, 0xd9d2c0], 0.045);
  jonchee(c, -14.4, 10.6, -10.6, 14.6, 40 * usure, undefined, 0.05);
}

// ---------- La cloche tombée au pied du clocher ----------

function cloche(k) {
  const { c, m, usure } = k;
  const [x, z] = [-8.3, 13.4];
  const profil = [[0.0, 1.02], [0.2, 1.02], [0.3, 0.97], [0.34, 0.84], [0.35, 0.62], [0.39, 0.42], [0.47, 0.22], [0.56, 0.07], [0.6, 0.0], [0.52, 0.02], [0.44, 0.2], [0.33, 0.55], [0.27, 0.9], [0.0, 0.93]].map(([r, y]) => new THREE.Vector2(r * 1.15, y * 1.15));
  const lathe = new THREE.LatheGeometry(profil, 12);
  // Couchée sur la lèvre et l'épaule, la bouche vers l'est
  c.repere({ x, y: 0.78, z, ry: 0.35, rz: 1.84, e: 1.13 }, () => {
    c.poser(lathe, m.satin, COUL.bronze, {}, { crasse: false, nuance: 0 });
    const bande = new THREE.TorusGeometry(0.41, 0.025, 3, 14);
    c.poser(bande, m.metal, 0x7a5c30, { y: 0.68, rx: Math.PI / 2 }, { crasse: false });
    bande.dispose();
    // Les anses de la couronne
    for (const a of [0, Math.PI / 2]) c.boite(0.3, 0.2, 0.06, COUL.bronze, { y: 1.25, ry: a }, m.metal, { crasse: false });
    // La fêlure, et la patine vert-de-gris sur le flanc qui regarde le ciel
    c.boite(0.04, 0.55, 0.04, 0x231c14, { x: 0.52, y: 0.3, z: 0.05, rz: -0.32 }, m.mat, { crasse: false });
    c.boite(0.03, 0.25, 0.03, 0x231c14, { x: 0.46, y: 0.62, z: 0.12, rz: -0.1, rx: 0.4 }, m.mat, { crasse: false });
    for (let i = 0; i < 6; i++) c.poser(new THREE.IcosahedronGeometry(0.12, 0), m.mat, COUL.vertDeGris, { x: c.entre(0.3, 0.45), y: c.entre(0.2, 0.95), z: c.entre(-0.3, 0.3), e: [0.4, 1.2, 1.2] }, { crasse: false, nuance: 0.06 });
  });
  lathe.dispose();
  // L'éclat détaché de la lèvre, le battant tombé plus loin
  c.poser(new THREE.DodecahedronGeometry(0.16, 0), m.metal, COUL.bronze, { x: x + 1.0, y: 0.08, z: z + 0.5, e: [1.4, 0.4, 1] }, { crasse: false });
  c.tube([x - 1.3, 0.1, z + 1.3], [x - 0.3, 0.1, z + 1.9], 0.05, 0x3a3634, m.tole, 6);
  c.poser(new THREE.IcosahedronGeometry(0.14, 1), m.tole, 0x3a3634, { x: x - 0.25, y: 0.13, z: z + 1.92 }, { crasse: false });
  // Les dalles du parvis cassées sous le choc
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    c.boite(c.entre(0.5, 0.8), 0.08, c.entre(0.4, 0.7), COUL.dalle, { x: x + Math.cos(a) * 1.1, y: 0.07, z: z + Math.sin(a) * 1.0, ry: a, rx: c.entre(-0.2, 0.2), rz: c.entre(-0.25, 0.25) }, m.dallage, { nuance: 0.03 });
  }
  // La poutre du beffroi qui l'a suivie, les lames d'abat-son, des ardoises
  c.poutre([-9.4, 0.15, 11.0], [-6.6, 0.45, 12.4], 0.26, COUL.cheneSombre, m.mat);
  c.poutre([-9.6, 0.1, 15.8], [-8.0, 0.1, 16.4], 0.22, COUL.cheneSombre, m.mat);
  for (let i = 0; i < 6; i++) c.boite(0.9, 0.04, 0.4, 0x5a4a3a, { x: x + c.entre(-1.5, 1.8), y: 0.08, z: z + c.entre(-1.8, 2), ry: c.hasard() * 3, rx: c.entre(-0.2, 0.2) }, m.mat, { crasse: false });
  for (let i = 0; i < 10; i++) c.boite(0.3, 0.025, 0.22, COUL.ardoise, { x: x + c.entre(-2, 2), y: 0.06, z: z + c.entre(-2, 2.2), ry: c.hasard() * 3 }, m.mat, { crasse: false });
  // Les Charbonniers sont passés : rondins sous la lèvre, cordes, un pied-de-biche, un piquet
  for (let i = 0; i < 3; i++) c.tube([x + 1.0 + i * 0.75, 0.12, z - 0.9], [x + 1.0 + i * 0.75, 0.12, z + 0.9], 0.12, 0x7a6248, m.mat, 6);
  c.tube([x - 0.2, 0.75, z - 0.5], [x + 0.6, 0.6, z + 0.3], 0.03, 0xb8a27a, m.mat, 4);
  c.tube([x + 0.6, 0.6, z + 0.3], [x + 3.4, 0.05, z + 0.4], 0.03, 0xb8a27a, m.mat, 4);
  c.tube([x + 3.4, 0, z + 0.4], [x + 3.4, 0.6, z + 0.4], 0.05, 0x7a6248, m.mat, 5);
  c.boite(0.9, 0.04, 0.05, 0x3a3634, { x: x + 1.7, y: 0.08, z: z + 1.2, ry: 0.6 }, m.tole, { crasse: false });
  k.b.obstacle(x - 0.8, z - 0.6, x + 0.7, z + 0.7, "cloche");
  semerTouffes(c, x - 2, z - 2, x + 2, z + 2, 12 * usure, COUL.herbeHaute, 0.04);
}

// ---------- Le mur d'enceinte et la grille ----------

function enceinte(k) {
  const { c, m, usure } = k;
  const spec = (ouvertures, breches) => ({ ep: 0.5, couleur: COUL.pierreSombre, mat: m.pierre, ouvertures, breches });
  const w = (a, b, o, br) => murBandes(k, a, b, spec(o, br), [{ ch: c, y0: 0, y1: 1.8 }]);
  w([-29, 20], [5, 20], [{ u: 23, l: 3.6, bas: 0, haut: 3, type: "vide" }], [{ u: 8, l: 2.6, profondeur: 1.0 * usure + 0.2 }]);
  w([5, 20], [5, -24], [{ u: 19.5, l: 1.2, bas: 0, haut: 3, type: "vide" }], [{ u: 34, l: 2, profondeur: 0.7 * usure }]);
  w([5, -24], [-29, -24], [], [{ u: 10, l: 3, profondeur: 0.9 * usure }]);
  w([-29, -24], [-29, 20], [], [{ u: 18, l: 2.8, profondeur: 1.7 }]);
  // Le chaperon de tuiles sur les longueurs intactes du mur sud (côté caméra)
  for (const [x1, x2] of [[-29, -22.6], [-19.4, -8.2], [-3.8, 5]]) c.pave(x1, 1.8, 19.65, x2, 1.92, 20.35, 0x7d6e60, m.mat, { crasse: false, nuance: 0.03 });
  // Les piliers de la grille, boules de pierre, la grille de fer (un vantail ouvert, l'autre tombé dans l'herbe)
  for (const x of [-8.15, -3.85]) {
    c.pave(x - 0.38, 0, 19.62, x + 0.38, 2.6, 20.38, COUL.pierre, m.pierre);
    c.pave(x - 0.45, 2.6, 19.55, x + 0.45, 2.75, 20.45, COUL.pierreSombre, m.pierre, { crasse: false });
    c.poser(new THREE.IcosahedronGeometry(0.3, 1), m.pierre, COUL.pierre, { x, y: 3.02, z: 20 }, { crasse: false });
  }
  const grille = (pose) => c.repere(pose, () => {
    c.pave(0, 0.15, -0.03, 1.75, 0.2, 0.03, COUL.fer, m.tole, { crasse: false });
    c.pave(0, 1.6, -0.03, 1.75, 1.65, 0.03, COUL.fer, m.tole, { crasse: false });
    for (let x = 0.08; x < 1.75; x += 0.16) c.pave(x - 0.015, 0.1, -0.015, x + 0.015, 1.95, 0.015, COUL.fer, m.tole, { crasse: false });
  });
  grille({ x: -7.75, y: 0, z: 20, ry: -1.1 });
  grille({ x: -5.0, y: 0.08, z: 22.1, rx: -Math.PI / 2, ry: 0.25 });
  // Le portillon vers le presbytère
  c.repere({ x: 5, y: 0, z: 1.1, ry: 2.2 }, () => {
    for (let x = 0.06; x < 1.1; x += 0.14) c.pave(x - 0.015, 0.1, -0.015, x + 0.015, 1.3, 0.015, COUL.fer, m.tole, { crasse: false });
    c.pave(0, 1.2, -0.02, 1.1, 1.25, 0.02, COUL.fer, m.tole, { crasse: false });
  });
  // Lierre et herbes au pied du mur
  lierre(c, -16, 0, 20.27, 0, 5, 1.8, 80 * usure);
  lierre(c, 0.5, 0, 20.27, 0, 3, 1.8, 40 * usure);
  lierre(c, 5.27, 0, -12, Math.PI / 2, 4, 1.8, 50 * usure);
  semerTouffes(c, -28.5, 19.2, 4.5, 19.7, 50 * usure, COUL.herbeHaute);
  semerTouffes(c, -28.6, -23.5, -28.2, 19.5, 40 * usure, COUL.herbeHaute);
  gravats(c, -28.8, -6, 1.2, 10, [COUL.pierreSombre, COUL.pierre], 0);
  gravats(c, -21, 20.3, 1.0, 8, [COUL.pierreSombre, COUL.pierre], 0);
}

// ---------- Le cimetière ----------

function tombe(k, x, z, type, usure) {
  const { c, m } = k;
  const pierres = [0xc9c2b2, 0xb3ab9b, 0x9a9488, 0xd6d0c2];
  const p = pierres[Math.floor(c.hasard() * pierres.length)];
  const pench = (f = 1) => ({ rx: c.entre(-0.25, 0.3) * usure * f, rz: c.entre(-0.3, 0.3) * usure * f });
  c.repere({ x, y: 0, z, ry: c.entre(-0.08, 0.08) }, () => {
    if (type === "tombeau" || type === "enclos") {
      c.pave(-0.45, 0, -1.0, 0.45, 0.32, 1.0, p, m.mat, { nuance: 0.05 });
      c.boite(0.8, 0.05, 1.9, p, { y: 0.34, rx: c.entre(-0.04, 0.04) }, m.mat);
      c.boite(0.75, 0.95, 0.16, p, { y: 0.75, z: -0.92, ...pench(0.6) }, m.mat);
      if (c.hasard() < 0.5) {
        c.boite(0.08, 0.45, 0.06, p, { y: 1.45, z: -0.92 }, m.mat, { crasse: false });
        c.boite(0.3, 0.07, 0.06, p, { y: 1.55, z: -0.92 }, m.mat, { crasse: false });
      }
      if (type === "enclos") {
        for (const [a, b] of [[[-0.6, -1.15], [0.6, -1.15]], [[0.6, -1.15], [0.6, 1.15]], [[0.6, 1.15], [-0.6, 1.15]], [[-0.6, 1.15], [-0.6, -1.15]]]) {
          c.poutre([a[0], 0.55, a[1]], [b[0], 0.55, b[1]], 0.03, COUL.fer, m.tole);
          c.poutre([a[0], 0, a[1]], [a[0], 0.6, a[1]], 0.035, COUL.fer, m.tole);
        }
      }
    } else if (type === "croix") {
      c.pave(-0.35, 0, -0.3, 0.35, 0.3, 0.3, p, m.mat);
      c.repere({ y: 0.3, ...pench(1.4) }, () => {
        c.pave(-0.07, 0, -0.07, 0.07, 1.25, 0.07, p, m.mat);
        c.pave(-0.32, 0.82, -0.065, 0.32, 0.96, 0.065, p, m.mat);
      });
      c.boite(0.8, 0.12, 1.6, 0x6f8a4a, { y: 0.03, z: 0.9 }, m.mat, { crasse: false });
    } else if (type === "fer") {
      c.repere({ y: 0, ...pench(1.8) }, () => {
        c.pave(-0.025, 0, -0.025, 0.025, 1.15, 0.025, 0x5a3a28, m.tole);
        c.pave(-0.25, 0.8, -0.02, 0.25, 0.85, 0.02, 0x5a3a28, m.tole);
        const g = new THREE.TorusGeometry(0.12, 0.012, 3, 8);
        c.poser(g, m.tole, 0x5a3a28, { y: 0.83 }, { crasse: false });
        g.dispose();
      });
      c.boite(0.7, 0.15, 1.5, 0x7a8a4f, { y: 0.05, z: 0.8 }, m.mat, { crasse: false });
    } else if (type === "couchee") {
      c.boite(0.7, 0.14, 0.95, p, { y: 0.07, z: 0.2, ry: c.entre(-0.4, 0.4) }, m.mat);
      c.pave(-0.3, 0, -0.65, 0.3, 0.18, -0.45, p, m.mat);
    } else {
      // Stèle arrondie (le haut : un demi-cylindre)
      c.repere({ ...pench(1.2) }, () => {
        c.pave(-0.32, 0, -0.08, 0.32, 0.75, 0.08, p, m.mat);
        const g = new THREE.CylinderGeometry(0.32, 0.32, 0.16, 8, 1, false, 0, Math.PI);
        c.poser(g, m.mat, p, { y: 0.75, rx: Math.PI / 2, rz: Math.PI / 2 }, { crasse: false });
        g.dispose();
      });
    }
  });
}

/** Un if : tronc rouge, masse sombre et dense, en cône irrégulier. */
function ifCimetiere(k, x, z, h) {
  const { c, m } = k;
  c.tube([x, 0, z], [x, h * 0.3, z], h * 0.05, 0x6a4030, m.mat, 6);
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const r = h * (0.32 - t * 0.2);
    c.poser(new THREE.IcosahedronGeometry(1, 0), m.mat, i % 2 ? COUL.ifSombre : 0x3a5a3c, { x: x + c.entre(-0.3, 0.3), y: h * (0.3 + t * 0.6), z: z + c.entre(-0.3, 0.3), ry: c.hasard() * 3, e: [r, h * 0.16, r] }, { crasse: false, nuance: 0.05 });
  }
}

function cimetiere(k) {
  const { c, m, usure } = k;
  const types = ["tombeau", "tombeau", "croix", "stele", "fer", "enclos", "couchee", "stele", "croix"];
  const evites = [[-25.6, 5.6, 2.2], [-12, -21, 2.0], [-23.6, 0, 1.6], [-27, -12, 1.4], [-26.2, -16.5, 2.4]];
  const libre = (x, z) => !evites.some(([ex, ez, r]) => Math.hypot(x - ex, z - ez) < r);
  const poser = (x, z) => {
    if (!libre(x, z) || c.hasard() < 0.22) return;
    tombe(k, x + c.entre(-0.15, 0.15), z + c.entre(-0.2, 0.2), types[Math.floor(c.hasard() * types.length)], usure);
  };
  // Le carré ouest, de part et d'autre de l'allée
  for (const x of [-27.6, -26.0, -22.0, -20.5]) for (let z = -21.6; z < 15.5; z += 2.8) {
    if (Math.abs(z) < 1.4) continue;
    if (x > -21 && z > -8.2 && z < 0.2) continue; // la chapelle
    if (x > -21 && z > 9.4) continue; // l'appentis
    poser(x, z);
  }
  // Le rang nord, derrière le chevet
  for (let x = -18.5; x < 4; x += 1.6) poser(x, -21.8);
  // Le petit carré à l'est du parvis
  for (const x of [-0.6, 1.0, 2.6]) for (const z of [14.4, 17.0]) if (!(z > 16 && x < 1)) poser(x, z);
  // La chapelle funéraire d'une grande famille, porte de fer entrouverte
  c.repere({ x: -26.2, y: 0, z: -16.5 }, () => {
    c.pave(-1.3, 0, -1.6, 1.3, 2.6, 1.6, 0xc4bca8, m.pierre);
    c.pave(-0.5, 0, 1.58, 0.5, 2.0, 1.62, 0x2a2826, m.mat, { crasse: false });
    c.boite(0.5, 1.9, 0.04, COUL.fer, { x: 0.65, y: 0.98, z: 1.9, ry: -1.0 }, m.tole);
    c.boite(1.85, 0.12, 3.6, COUL.ardoise, { x: -0.7, y: 3.15, rz: 0.6 }, m.ardoise, { crasse: false });
    c.boite(1.85, 0.12, 3.6, COUL.ardoise, { x: 0.7, y: 3.15, rz: -0.6 }, m.ardoise, { crasse: false });
    c.pave(-1.3, 2.6, 1.55, 1.3, 2.75, 1.7, 0xb3ab9b, m.pierre, { crasse: false });
    c.pave(-0.06, 3.5, 1.5, 0.06, 4.2, 1.62, 0xc4bca8, m.pierre, { crasse: false });
    c.pave(-0.25, 3.85, 1.5, 0.25, 3.95, 1.62, 0xc4bca8, m.pierre, { crasse: false });
  });
  k.b.obstacle(-27.5, -14.9, -24.9, -14.9, "chapelle funéraire");
  lierre(c, -27.52, 0, -16.5, -Math.PI / 2, 3, 2.6, 50 * usure);
  // Le calvaire, au croisement des allées
  c.pave(-24.4, 0, -0.8, -22.8, 0.3, 0.8, COUL.pierreSombre, m.pierre);
  c.pave(-24.0, 0.3, -0.4, -23.2, 0.6, 0.4, COUL.pierre, m.pierre);
  c.pave(-23.72, 0.6, -0.12, -23.48, 3.8, 0.12, COUL.pierre, m.pierre);
  c.pave(-24.3, 2.9, -0.11, -22.9, 3.12, 0.11, COUL.pierre, m.pierre);
  k.b.obstacle(-24.4, 0, -22.8, 0, "calvaire");
  // Les ifs, un arbre mort, les herbes hautes, des feuilles
  ifCimetiere(k, -25.6, 5.6, 7.5);
  ifCimetiere(k, -12, -21, 6.5);
  arbre(c, -27, -12, 7, "mort");
  arbre(c, 1.5, -21.5, 8, "feuillu");
  semerTouffes(c, -28.6, -23.6, -19.6, 15.8, 120 * usure, COUL.herbeHaute);
  semerTouffes(c, -19.5, -23.6, 4.6, -19.6, 50 * usure, COUL.herbeHaute);
  semerTouffes(c, -1.8, 13.4, 4.6, 19.5, 30 * usure, COUL.herbeHaute);
  jonchee(c, -28.5, -23.5, -19.5, 16, 120 * usure);
  for (let i = 0; i < 2 + 3 * usure; i++) arbuste(c, c.entre(-28.3, -20), c.entre(-23, 15), c.entre(0.5, 1.1));
}

// ---------- Le presbytère ----------

function presbytere(k) {
  const { c, P, m, usure } = k;
  const ext = { ep: 0.5, couleur: COUL.enduitPresb, mat: m.enduit, interieur: { couleur: 0xe6dcc6, mat: m.enduit } };
  const fen = (u, bas, haut, extra = {}) => ({ u, l: 1.1, bas, haut, type: "fenetre", croisillons: 1, traverses: 3, cadre: 0xe6e2d8, couleurVolet: COUL.volet, volet: "ouvert", bris: k.bris, verre: m.verre, ...extra });
  const fenH = (u, extra = {}) => fen(u, 3.9, 5.3, { traverses: 2, volet: null, ...extra });
  const avant = [{ ch: c, y0: 0, y1: CUT }, { ch: P, y0: CUT, y1: 3.2 }, { ch: P, y0: 3.2, y1: 6.0 }];
  const arriere = [{ ch: c, y0: 0, y1: 3.2 }, { ch: P, y0: 3.2, y1: 6.0 }];
  murBandes(k, [9, -5], [19, -5], { ...ext, ouvertures: [
    { u: 4, l: 1.1, bas: 0, haut: 2.3, type: "porte", vantail: "entrouvert", couleurPorte: 0x55695e, angle: 1.35 },
    fen(1.8, CUT, 2.6), fen(7.3, CUT, 2.6, { volet: "pendu" }), fenH(1.8), fenH(4, { l: 0.9 }), fenH(7.3),
  ] }, avant);
  murBandes(k, [19, -5], [19, -15], { ...ext, ouvertures: [fen(2.6, CUT, 2.6), fen(7.4, 1.6, 2.5, { l: 0.7, traverses: 1, volet: null }), fenH(2.6), fenH(7.4)] }, avant);
  murBandes(k, [19, -15], [9, -15], { ...ext, ouvertures: [
    { u: 2, l: 1.0, bas: 0, haut: 2.2, type: "porte", vantail: "entrouvert", couleurPorte: 0x55695e, angle: 1.1 },
    fen(7, CUT, 2.5, { volet: null }), fenH(2), fenH(7),
  ] }, arriere);
  murBandes(k, [9, -15], [9, -5], { ...ext, ouvertures: [fen(2.5, CUT, 2.4, { l: 0.9, volet: null }), fenH(2.5, { l: 0.9 })] }, arriere);
  // Cloisons : basses dans la base, le haut dans la couche
  const cl = { ep: 0.2, couleur: 0xe6dcc6, mat: m.enduit };
  murBandes(k, [14, -5.25], [14, -14.75], { ...cl, ouvertures: [{ u: 2.35, l: 0.9, bas: 0, haut: 2.1, type: "porte" }] }, [{ ch: c, y0: 0, y1: CUT }, { ch: P, y0: CUT, y1: 3.2 }]);
  murBandes(k, [9.25, -10], [18.75, -10], { ...cl, ouvertures: [{ u: 2.35, l: 0.9, bas: 0, haut: 2.1, type: "porte" }, { u: 7.25, l: 0.9, bas: 0, haut: 2.1, type: "porte" }] }, [{ ch: c, y0: 0, y1: CUT }, { ch: P, y0: CUT, y1: 3.2 }]);
  // Chaînes d'angle en pierre, bandeau d'étage, corniche (couche)
  for (const [x, z] of [[9, -5], [19, -5], [19, -15], [9, -15]]) {
    for (let y = 0, i = 0; y < 6; y += 0.45, i++) {
      const ch = y + 0.4 <= CUT || ((x === 9 || z === -15) && x !== 19 && y + 0.4 <= 3.2) ? c : P;
      const lx = i % 2 ? 0.7 : 0.45;
      const lz = i % 2 ? 0.45 : 0.7;
      ch.pave(x - (x === 9 ? 0.27 : lx - 0.27), y, z - (z === -15 ? 0.27 : lz - 0.27), x + (x === 9 ? lx - 0.27 : 0.27), y + 0.42, z + (z === -15 ? lz - 0.27 : 0.27), 0xcfc4a8, m.mat, { nuance: 0.03, crasse: y < 1 });
    }
  }
  for (const [yy, h, s] of [[3.2, 0.14, 0.08], [5.9, 0.22, 0.18]]) {
    P.pave(8.7 - s, yy, -5.3 + 0.03, 19.3 + s, yy + h, -4.72 + s, 0xd0c4a6, m.mat, { crasse: false });
    P.pave(8.7 - s, yy, -15.28 - s, 19.3 + s, yy + h, -14.7, 0xd0c4a6, m.mat, { crasse: false });
    P.pave(8.7 - s, yy, -14.7, 9.3, yy + h, -5.3, 0xd0c4a6, m.mat, { crasse: false });
    P.pave(18.7, yy, -14.7, 19.3 + s, yy + h, -5.3, 0xd0c4a6, m.mat, { crasse: false });
  }
  // Pignons, toit d'ardoise, plancher de l'étage (vu par les fenêtres), lucarne, cheminée
  pignon(P, k, [9, -15], [9, -5], -0.3, 10.3, 6.0, 3.4, 0.5, COUL.enduitPresb, m.enduit);
  pignon(P, k, [19, -5], [19, -15], -0.3, 10.3, 6.0, 3.4, 0.5, COUL.enduitPresb, m.enduit);
  toiture(P, k, { axe: "x", f: -10, d1: 8.55, d2: 19.45, y0: 6.0, demi: 5.25, hf: 3.4, debord: 0.45, trous: usure > 0.6 ? [{ d1: 16.2, d2: 17.4, cote: -1, v1: 0.3, v2: 0.7 }] : [] });
  P.pave(9.25, 3.12, -14.75, 18.75, 3.22, -5.25, 0x4a3a2c, m.mat, { crasse: false });
  P.repere({ x: 14, y: 6.0, z: -5.6 }, () => {
    P.pave(-0.7, -0.1, -1.6, 0.7, 1.4, 0, COUL.enduitPresb, m.enduit, { crasse: false });
    P.boite(1.1, 0.07, 1.9, COUL.ardoise, { x: -0.42, y: 1.65, z: -0.75, rz: 0.75 }, m.ardoise, { crasse: false });
    P.boite(1.1, 0.07, 1.9, COUL.ardoise, { x: 0.42, y: 1.65, z: -0.75, rz: -0.75 }, m.ardoise, { crasse: false });
    P.pave(-0.42, 0.15, 0.0, 0.42, 1.15, 0.03, 0x2a3236, m.mat, { crasse: false });
    P.pave(-0.48, 0.1, 0.01, 0.48, 0.16, 0.08, 0xe6e2d8, m.mat, { crasse: false });
  });
  P.pave(8.75, 6.0, -8.1, 9.65, 10.6, -6.9, 0xb9ab8c, m.mat);
  P.pave(8.65, 10.6, -8.2, 9.75, 10.75, -6.8, 0xa89a7c, m.mat, { crasse: false });
  for (const z of [-7.8, -7.2]) P.tube([9.2, 10.75, z], [9.2, 11.15, z], 0.1, 0x9a5a40, m.mat, 6);
  // Les survivants ont barricadé la fenêtre du bureau, côté route
  for (let i = 0; i < 3; i++) P.boite(1.5, 0.16, 0.04, 0x8a7a62, { x: 16.3, y: 1.5 + i * 0.42, z: -4.66, rz: (i - 1) * 0.12 }, m.mat, { nuance: 0.06 });
  // Lierre et mousse : le presbytère vieillit mieux que l'église
  lierre(c, 8.73, 0, -11, -Math.PI / 2, 4, 3.2, 70 * usure);
  lierre(P, 8.73, 3.2, -11, -Math.PI / 2, 3, 2.4, 40 * usure);
  lierre(c, 19.27, 0, -13.5, Math.PI / 2, 2.4, CUT, 18 * usure);
  lierre(P, 19.27, CUT, -13.5, Math.PI / 2, 2.4, 3.5, 40 * usure);
  mousse(P, 12, 7.8, -12.6, 2.2, Math.round(10 * usure));
  // La lanterne des survivants, accrochée à côté de la porte
  c.pave(12.02, 2.3, -4.75, 12.08, 2.34, -4.35, COUL.fer, m.tole, { crasse: false });
  c.repere({ x: 12.05, y: 1.95, z: -4.4 }, () => {
    for (const [dx, dz] of [[-0.09, -0.09], [0.09, -0.09], [-0.09, 0.09], [0.09, 0.09]]) c.pave(dx - 0.012, 0, dz - 0.012, dx + 0.012, 0.3, dz + 0.012, COUL.fer, m.tole, { crasse: false });
    c.pave(-0.11, 0.3, -0.11, 0.11, 0.36, 0.11, COUL.fer, m.tole, { crasse: false });
    c.pave(-0.1, -0.03, -0.1, 0.1, 0.02, 0.1, COUL.fer, m.tole, { crasse: false });
    c.pave(-0.05, 0.04, -0.05, 0.05, 0.2, 0.05, 0xffd890, m.flamme, { crasse: false });
  });
}

function interieurPresbytere(k) {
  const { c, m, usure } = k;
  // Les sols : dalles dans la cuisine, parquet au bureau et à la chambre, terre battue au cellier
  c.pave(9.25, 0, -9.9, 13.9, 0.05, -5.25, 0xbdb29c, m.dallage, { crasse: false, nuance: 0 });
  c.pave(14.1, 0, -9.9, 18.75, 0.05, -5.25, 0xc8b496, m.parquet, { crasse: false, nuance: 0 });
  c.pave(9.25, 0, -14.75, 13.9, 0.05, -10.1, 0xc8b496, m.parquet, { crasse: false, nuance: 0 });
  c.pave(14.1, 0, -14.75, 18.75, 0.04, -10.1, 0x8a7558, m.mat, { crasse: false, nuance: 0 });
  // --- La cuisine : la cheminée où brûle un feu, la table, la cuisinière en fonte, l'évier, le buffet ---
  const y = 0.05;
  c.pave(9.25, y, -8.5, 9.85, y + 1.3, -8.15, COUL.pierre, m.pierre);
  c.pave(9.25, y, -6.85, 9.85, y + 1.3, -6.5, COUL.pierre, m.pierre);
  c.pave(9.25, y + 1.3, -8.6, 9.95, y + 1.55, -6.4, COUL.pierreSombre, m.pierre);
  c.pave(9.25, y + 1.55, -8.35, 9.75, 3.2, -6.65, 0xd8ccb2, m.enduit);
  c.pave(9.25, y, -8.15, 9.3, y + 1.3, -6.85, PALETTE.suie, m.mat, { crasse: false });
  c.pave(9.3, y, -8.15, 9.85, y + 0.03, -6.85, 0x3a332c, m.mat, { crasse: false });
  for (const [a, b2] of [[[9.4, 0.12, -7.9], [9.8, 0.1, -7.1]], [[9.35, 0.12, -7.2], [9.85, 0.14, -7.85]], [[9.6, 0.2, -7.95], [9.6, 0.2, -7.05]]]) c.tube(a, b2, 0.07, 0x5a4232, m.mat, 5);
  const flammes = [[9.55, -7.5, 0.5, 0xffb040], [9.6, -7.3, 0.38, 0xff7a20], [9.5, -7.7, 0.34, 0xffd070], [9.68, -7.55, 0.28, 0xff9030]];
  for (const [fx, fz, fh, fc] of flammes) {
    const g = new THREE.ConeGeometry(0.1, fh, 5);
    c.poser(g, m.flamme, fc, { x: fx, y: 0.2 + fh / 2, z: fz }, { crasse: false, nuance: 0 });
    g.dispose();
  }
  for (let i = 0; i < 6; i++) c.boite(0.07, 0.04, 0.07, 0xff5a20, { x: 9.55 + c.entre(-0.15, 0.25), y: 0.08, z: -7.5 + c.entre(-0.3, 0.3), ry: c.hasard() * 3 }, m.flamme, { crasse: false, nuance: 0 });
  c.tube([9.55, 1.5, -7.5], [9.55, 0.75, -7.5], 0.012, COUL.fer, m.tole, 3);
  c.poser(new THREE.CylinderGeometry(0.18, 0.14, 0.22, 8), m.tole, 0x2a2826, { x: 9.55, y: 0.65, z: -7.5 }, { crasse: false });
  // Le bois des survivants, leur couchage près du feu
  for (let i = 0; i < 9; i++) c.tube([9.4, 0.1 + Math.floor(i / 3) * 0.14, -9.75 + (i % 3) * 0.15 + 0.05 * Math.floor(i / 3)], [10.2, 0.1 + Math.floor(i / 3) * 0.14, -9.75 + (i % 3) * 0.15 + 0.05 * Math.floor(i / 3)], 0.07, 0x7a6248, m.mat, 5);
  c.boite(0.8, 0.08, 1.9, 0x5a6a52, { x: 10.6, y: 0.1, z: -6.2, ry: 1.45 }, m.mat, { crasse: false, nuance: 0.05 });
  c.boite(0.5, 0.15, 0.35, 0xd8cfb8, { x: 11.4, y: 0.15, z: -6.15 }, m.mat, { crasse: false });
  // La table et les chaises (une renversée)
  c.pave(10.9, y + 0.74, -8.3, 12.7, y + 0.8, -7.4, 0x7a5a3c, m.satin);
  for (const [x, z] of [[11.0, -8.2], [12.6, -8.2], [11.0, -7.5], [12.6, -7.5]]) c.pave(x - 0.04, y, z - 0.04, x + 0.04, y + 0.74, z + 0.04, 0x6a4a30, m.satin);
  for (const [x, z, ry, renv] of [[11.4, -8.75, 0, false], [12.3, -6.95, Math.PI, false], [13.2, -7.6, -1.4, true]]) {
    c.repere({ x, y: renv ? y + 0.22 : y, z, ry, rx: renv ? -Math.PI / 2 : 0 }, () => {
      c.boite(0.42, 0.05, 0.42, 0x7a5a3c, { y: 0.45 }, m.satin);
      c.boite(0.42, 0.5, 0.04, 0x7a5a3c, { y: 0.72, z: -0.2 }, m.satin);
      for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) c.boite(0.04, 0.44, 0.04, 0x6a4a30, { x: dx, y: 0.22, z: dz }, m.satin);
    });
  }
  c.boite(0.25, 0.12, 0.25, 0xd8d2c4, { x: 11.6, y: y + 0.86, z: -7.85 }, m.satin, { crasse: false });
  c.boite(0.08, 0.2, 0.08, 0x3a5a3a, { x: 12.1, y: y + 0.9, z: -7.7 }, m.satin, { crasse: false });
  // La cuisinière en fonte et son tuyau
  c.pave(12.7, y, -9.9, 13.7, y + 0.85, -9.3, 0x2c2a28, m.tole);
  c.pave(12.68, y + 0.85, -9.92, 13.72, y + 0.9, -9.28, 0x3a3836, m.tole, { crasse: false });
  c.tube([13.4, y + 0.9, -9.7], [13.4, 2.4, -9.7], 0.07, 0x2c2a28, m.tole, 6);
  c.tube([13.4, 2.4, -9.7], [13.4, 2.4, -10.0], 0.07, 0x2c2a28, m.tole, 6);
  // L'évier de pierre sous la fenêtre, le buffet contre la cloison
  c.pave(10.3, y, -5.75, 11.3, y + 0.85, -5.25, COUL.pierre, m.pierre);
  c.pave(10.4, y + 0.7, -5.68, 11.2, y + 0.86, -5.32, 0x8a8478, m.pierre, { crasse: false });
  c.pave(13.35, y, -6.75, 13.9, y + 0.95, -5.45, 0x6a4a30, m.satin);
  c.pave(13.55, y + 0.95, -6.75, 13.9, y + 2.0, -5.45, 0x6a4a30, m.satin);
  for (let i = 0; i < 4; i++) c.boite(0.03, 0.22, 0.22, 0xe8e2d4, { x: 13.53, y: y + 1.3 + Math.floor(i / 2) * 0.35, z: -6.4 + (i % 2) * 0.5 }, m.satin, { crasse: false });
  // --- Le bureau-bibliothèque ---
  c.repere({ x: 16.4, y, z: -9.88 }, () => {
    c.pave(-2.0, 0, 0, 2.0, 2.0, 0.36, 0x5a4030, m.satin);
    for (let i = 0; i < 4; i++) panneau(c, m.enseignes, R.livres, { x: 0, y: 0.25 + i * 0.47, z: 0.37 }, 3.8, 0.4);
    for (let i = 0; i <= 4; i++) c.pave(-2.0, i * 0.47, 0.34, 2.0, i * 0.47 + 0.04, 0.4, 0x6a4a34, m.satin, { crasse: false });
  });
  c.repere({ x: 14.12, y, z: -9.1, ry: Math.PI / 2 }, () => {
    c.pave(-0.7, 0, 0, 0.7, 2.0, 0.34, 0x5a4030, m.satin);
    for (let i = 0; i < 4; i++) panneau(c, m.enseignes, R.livres, { x: 0, y: 0.25 + i * 0.47, z: 0.35 }, 1.3, 0.4);
  });
  for (let i = 0; i < 12; i++) c.boite(c.entre(0.15, 0.25), 0.04, c.entre(0.2, 0.3), [0x6b2a26, 0x2f4a3a, 0x5a4630, 0x2e3a52][i % 4], { x: c.entre(14.6, 18.2), y: y + 0.03 + (i % 3) * 0.03, z: c.entre(-9.3, -8.2), ry: c.hasard() * 3 }, m.satin, { crasse: false });
  c.pave(16.0, y + 0.74, -6.6, 17.6, y + 0.8, -5.9, 0x5a4030, m.satin);
  c.pave(16.0, y, -6.6, 16.4, y + 0.74, -5.9, 0x5a4030, m.satin);
  c.pave(17.2, y, -6.6, 17.6, y + 0.74, -5.9, 0x5a4030, m.satin);
  for (let i = 0; i < 5; i++) c.boite(0.21, 0.005, 0.29, 0xe8e0cc, { x: 16.8 + c.entre(-0.6, 0.6), y: y + 0.81 + i * 0.004, z: -6.25 + c.entre(-0.2, 0.2), ry: c.entre(-0.5, 0.5) }, m.mat, { crasse: false });
  c.boite(0.6, 0.85, 0.6, 0x6a3a2c, { x: 17.6, y: y + 0.42, z: -8.1, ry: 0.5 }, m.satin);
  c.tube([18.2, y, -5.9], [18.2, y + 0.75, -5.9], 0.03, 0x3a3a38, m.metal, 4);
  c.poser(new THREE.IcosahedronGeometry(0.22, 1), m.satin, 0xb8a878, { x: 18.2, y: y + 0.95, z: -5.9 }, { crasse: false });
  // --- La chambre du curé ---
  c.repere({ x: 10.35, y, z: -13.85 }, () => {
    for (const dx of [-1.0, 1.0]) {
      c.tube([dx, 0, -0.45], [dx, dx < 0 ? 1.1 : 0.8, -0.45], 0.025, 0x2a2826, m.tole, 4);
      c.tube([dx, 0, 0.45], [dx, dx < 0 ? 1.1 : 0.8, 0.45], 0.025, 0x2a2826, m.tole, 4);
      c.tube([dx, dx < 0 ? 1.08 : 0.78, -0.45], [dx, dx < 0 ? 1.08 : 0.78, 0.45], 0.025, 0x2a2826, m.tole, 4);
    }
    c.pave(-1.0, 0.35, -0.45, 1.0, 0.55, 0.45, 0xbeb79f, m.mat);
    c.boite(1.6, 0.06, 1.0, 0x7a2f2a, { x: 0.25, y: 0.58, rz: 0.03 }, m.mat, { nuance: 0.04 });
    c.boite(0.35, 0.12, 0.6, 0xe6e0d0, { x: -0.75, y: 0.62 }, m.mat, { crasse: false });
  });
  c.pave(9.3, y + 1.65, -13.9, 9.34, y + 2.15, -13.82, 0x5a4030, m.mat, { crasse: false });
  c.pave(9.3, y + 1.92, -14.02, 9.34, y + 2.0, -13.7, 0x5a4030, m.mat, { crasse: false });
  c.pave(9.3, y, -12.9, 9.7, y + 0.6, -12.5, 0x6a4a30, m.satin);
  c.pave(12.3, y, -14.72, 13.8, y + 2.1, -14.12, 0x5a4030, m.satin);
  c.boite(0.72, 1.95, 0.04, 0x5a4030, { x: 12.0, y: y + 1.05, z: -13.7, ry: 1.0 }, m.satin);
  c.repere({ x: 12.4, y, z: -11.6, ry: Math.PI }, () => {
    c.pave(-0.3, 0, 0.0, 0.3, 0.2, 0.35, COUL.chene, m.satin);
    c.pave(-0.3, 0, -0.1, 0.3, 0.9, -0.04, COUL.chene, m.satin);
  });
  c.boite(1.6, 0.01, 1.1, 0x8a4a3a, { x: 11.5, y: y + 0.01, z: -12.2 }, m.mat, { crasse: false });
  // --- Le cellier : bocaux, bonbonnes, tonneau, l'escalier effondré ---
  c.pave(14.3, y, -14.72, 16.7, y + 1.8, -14.35, 0x6a5a48, m.mat);
  for (let r = 0; r < 3; r++) {
    c.pave(14.3, y + 0.4 + r * 0.5, -14.72, 16.7, y + 0.44 + r * 0.5, -14.05, 0x7a6a54, m.mat, { crasse: false });
    for (let i = 0; i < 9; i++) {
      if (c.hasard() < 0.3) continue;
      c.pave(14.45 + i * 0.25, y + 0.44 + r * 0.5, -14.5, 14.6 + i * 0.25, y + 0.62 + r * 0.5, -14.35, [0xd8c690, 0xb07a4a, 0x8aa070, 0xc8a050][(i + r) % 4], m.satin, { crasse: false });
    }
  }
  for (const [x, z] of [[15.2, -12.6], [15.7, -13.1], [14.7, -13.3]]) {
    c.poser(new THREE.IcosahedronGeometry(0.26, 1), m.satin, 0x5a7a52, { x, y: y + 0.26, z, e: [1, 1.15, 1] }, { crasse: false });
    c.tube([x, y + 0.5, z], [x, y + 0.66, z], 0.05, 0x5a7a52, m.satin, 5);
  }
  c.poser(new THREE.CylinderGeometry(0.4, 0.36, 0.95, 10), m.mat, 0x6a4a30, { x: 16.6, y: y + 0.48, z: -11.0 }, {});
  for (let i = 0; i < 8; i++) {
    if (i > 4 && c.hasard() < 0.5 + usure * 0.4) continue;
    c.pave(17.95, y + i * 0.3, -10.5 - i * 0.3, 18.7, y + 0.3 + i * 0.3, -10.2 - i * 0.3, 0x6a5040, m.mat);
  }
  gravats(c, 17.8, -13.7, 0.9, 10, [0xdccfb2, 0x7a6040, COUL.pierre], 0.04);
  debris(c, 9.4, -14.6, 18.6, -5.4, 30 * usure, [0xe6dcc6, 0xd9d2c0], 0.05);
  jonchee(c, 12.2, -5.45, 13.8, -9.2, 20 * usure, undefined, 0.06);
}

// ---------- Le jardin du presbytère ----------

function jardin(k) {
  const { c, m, usure } = k;
  // La barrière de bois (poteaux et deux lisses, des trous)
  const barriere = (a, b, ouverture) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const w = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
    for (let u = 0; u <= L; u += 2.5) {
      const x = a[0] + w[0] * u;
      const z = a[1] + w[1] * u;
      if (ouverture && Math.abs(u - ouverture) < 1.2) continue;
      c.pave(x - 0.07, 0, z - 0.07, x + 0.07, 1.15, z + 0.07, 0x7a6a54, m.mat, { nuance: 0.06 });
      if (u + 2.5 <= L + 0.01 && !(ouverture && u + 2.5 > ouverture - 1.2 && u < ouverture + 1.2) && c.hasard() > 0.12 * usure) {
        for (const y of [0.45, 0.95]) c.poutre([x, y, z], [x + w[0] * 2.5, y + (c.hasard() < 0.1 ? -0.4 : 0), z + w[1] * 2.5], 0.06, 0x8a7a62, m.mat);
        k.b.obstacle(x, z, x + w[0] * 2.5, z + w[1] * 2.5, "barrière");
      }
    }
  };
  barriere([5.3, 20], [29.4, 20], 7.7);
  barriere([29.4, 20], [29.4, -24.4]);
  barriere([29.4, -24.4], [5.3, -24.4]);
  // Le puits : margelle, potence, seau
  c.poser(new THREE.CylinderGeometry(0.85, 0.9, 0.8, 10), m.pierre, COUL.pierre, { x: 24.5, y: 0.4, z: 3 }, {});
  c.poser(new THREE.CylinderGeometry(0.6, 0.6, 0.02, 10), m.mat, 0x1e2422, { x: 24.5, y: 0.81, z: 3 }, { crasse: false });
  for (const dx of [-0.75, 0.75]) c.pave(24.5 + dx - 0.06, 0.8, 2.94, 24.5 + dx + 0.06, 2.3, 3.06, 0x6a5a48, m.mat);
  c.tube([23.6, 2.0, 3], [25.4, 2.0, 3], 0.06, 0x6a5a48, m.mat, 6);
  c.boite(1.9, 0.06, 0.8, COUL.ardoise, { x: 24.5, y: 2.45, z: 2.75, rx: -0.5 }, m.ardoise, { crasse: false });
  c.boite(1.9, 0.06, 0.8, COUL.ardoise, { x: 24.5, y: 2.45, z: 3.25, rx: 0.5 }, m.ardoise, { crasse: false });
  c.poser(new THREE.CylinderGeometry(0.16, 0.12, 0.28, 7), m.tole, 0x6a6a64, { x: 25.2, y: 0.95, z: 3.4 }, { crasse: false });
  k.b.obstacle(23.6, 3, 25.4, 3, "puits");
  // Le potager redevenu sauvage, l'épouvantail au casque de réalité virtuelle
  for (let i = 0; i < 5; i++) {
    const x = 20.6 + i * 1.4;
    c.pave(x - 0.45, 0, -12.5, x + 0.45, 0.12, -2.5, 0x7d6143, m.mat, { crasse: false, nuance: 0.04 });
    semerTouffes(c, x - 0.4, -12.4, x + 0.4, -2.6, 12 * (0.4 + usure), i % 2 ? 0x7f9a4a : COUL.herbeHaute, 0.12);
  }
  for (let i = 0; i < 3; i++) arbuste(c, c.entre(20.2, 26.6), c.entre(-12, -3), c.entre(0.4, 0.8), 0.1, [0x5d7a40, 0x6d8f45, 0x8a9a4a]);
  c.repere({ x: 23.6, y: 0, z: -7.4, ry: 0.4 }, () => {
    c.pave(-0.05, 0, -0.05, 0.05, 2.0, 0.05, 0x6a5a48, m.mat);
    c.pave(-0.7, 1.4, -0.04, 0.7, 1.48, 0.04, 0x6a5a48, m.mat);
    c.boite(0.8, 0.7, 0.2, 0x5a6a8a, { y: 1.25 }, m.mat, { nuance: 0.05 });
    c.boite(1.3, 0.25, 0.18, 0x5a6a8a, { y: 1.45 }, m.mat);
    c.poser(new THREE.IcosahedronGeometry(0.2, 1), m.mat, 0xc8b88c, { y: 1.85 }, { crasse: false });
    c.boite(0.3, 0.13, 0.15, 0x1e2022, { y: 1.88, z: 0.14 }, m.satin, { crasse: false });
    c.boite(0.44, 0.05, 0.36, 0x2a2c2e, { y: 1.88 }, m.satin, { crasse: false });
    c.boite(0.5, 0.06, 0.5, 0x8a7a50, { y: 2.06, rz: 0.15 }, m.mat, { crasse: false });
  });
  // Pommiers, tas de bois, tonneau de pluie (plastique bleu canard de l'Abondance), trottinette électrique couchée
  arbre(c, 24, 13, 6, "feuillu");
  arbre(c, 8.5, 13.5, 5.5, "feuillu");
  for (let i = 0; i < 12; i++) c.tube([19.6, 0.1 + Math.floor(i / 4) * 0.16, -6.4 - (i % 4) * 0.4], [20.4, 0.1 + Math.floor(i / 4) * 0.16, -6.4 - (i % 4) * 0.4], 0.08, 0x7a6248, m.mat, 5);
  c.poser(new THREE.CylinderGeometry(0.36, 0.33, 0.95, 10), m.satin, PALETTE.abondanceCanard, { x: 19.65, y: 0.48, z: -5.35 }, {});
  c.repere({ x: 17, y: 0.12, z: 16.5, ry: 0.6, rz: Math.PI / 2 - 0.1 }, () => {
    c.boite(0.04, 0.9, 0.16, 0xd9d4c8, { y: 0.0 }, m.satin);
    c.boite(0.04, 0.06, 0.9, 0xd9d4c8, { y: 0.0, z: 0.35, rx: 0.2 }, m.satin);
    c.boite(0.04, 0.08, 0.45, PALETTE.abondanceCanard, { y: 0.0, z: 0.82 }, m.satin);
  });
  semerTouffes(c, 5.6, -24, 29, 19.6, 80 * usure, COUL.herbeHaute);
  for (let i = 0; i < 2 + 2 * usure; i++) arbuste(c, c.entre(20, 28.5), c.entre(-23.5, 19), c.entre(0.6, 1.3));
  jonchee(c, 6, -4, 28, 19, 50 * usure);
}
