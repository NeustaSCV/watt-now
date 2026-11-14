// Le théâtre à l'italienne (nouveau lieu, Ville, anneau moyen, danger ●●●).
//
// Un théâtre municipal néoclassique : portique de six colonnes, fronton aux masques, lettres dorées « THÉÂTRE » dont
// l'É est tombé sur le parvis. Derrière, le hall de la billetterie, le grand foyer à miroirs où des survivants font du
// feu dans la cheminée, puis la salle : un parterre de fauteuils de velours sous trois rangs de balcons dorés en fer à
// cheval, un plafond peint crevé par où tombe un rai de lumière sur le lustre de cristal écrasé, la fosse d'orchestre
// noyée d'où dépasse un piano, la scène au rideau rouge en lambeaux, les cintres et leurs cordages qui pendent.
// La dernière affiche promettait un « Spectacle immersif 100 % holographique — sans acteurs ! » : le projecteur
// d'hologrammes est resté au milieu de la scène, et les fauteuils « premium vibrants connectés » attendent leur public.
//
// Deux cartes (budget : ≤ 60 000 triangles, ≤ 40 appels de dessin chacune) :
// - « facade » : le parvis, le portique, le hall et la billetterie, le vestiaire, le grand foyer à miroirs ;
// - « salle » : la salle (parterre, fosse, balcons inaccessibles), la scène et les coulisses, les loges des artistes,
//   l'atelier des décors, la régie.
// Tout est bâti dans le repère du site (S) puis recentré sur chaque carte.
//
// Repère S : +x à l'est, +z au sud. Façade au sud (z = 11), portique jusqu'à z = 14, parvis au-delà. Hall de z = 4 à 11,
// foyer de z = -3 à 4, salle de z = -23 à -3 (x de -12 à 12), cage de scène de z = -36 à -23 (x de -15 à 15), loges à
// l'ouest (x de -21 à -15), atelier des décors à l'est (x de 15 à 23). On ne visite que le rez-de-chaussée : les
// balcons, le paradis, les cintres et les étages sont des couches qui s'effacent.

import * as THREE from "three";
import {
  Batiment, PALETTE, MAT, matiere, matiereMonde, matiereVerre, matiereEau, matiereLueur, mur, lierre as lierreA,
  semerTouffes as semerA, gravats, debris as debrisA, jonchee as joncheeA, mousse, arbuste, arbre, raiDeLumiere as raiA,
  flaque, dessiner, taches, aleatoire, toitDeuxPans,
} from "../commun/atelier.js";

// Le petit désordre coûte cher en triangles : on le dose.
const lierre = (c, x, y0, z, ry, l, h, n) => lierreA(c, x, y0, z, ry, l, h, Math.round(n * 0.4));
const semerTouffes = (c, x1, z1, x2, z2, n, t, y) => semerA(c, x1, z1, x2, z2, Math.round(n * 0.5), t, y);
const debris = (c, x1, z1, x2, z2, n, t, y) => debrisA(c, x1, z1, x2, z2, Math.round(n * 0.6), t, y);
const jonchee = (c, x1, z1, x2, z2, n, t, y) => joncheeA(c, x1, z1, x2, z2, Math.round(n * 0.6), t, y);
// Un seul matériau de lueur pour tous les rais de lumière
const raiDeLumiere = (c, a, b, l) => raiA(c, a, b, l, 0.09);

// ---------- Les cartes ----------

/** Centre de chaque carte dans le repère S (l'origine d'une carte est le centre de son lot). */
const CENTRES = { facade: { x: 0, z: 7 }, salle: { x: 1, z: -18.5 } };

function versCarte(id, points) {
  const o = CENTRES[id];
  return points.map((p) => ({ ...p, x: Math.round((p.x - o.x) * 10) / 10, z: Math.round((p.z - o.z) * 10) / 10 }));
}

export const FICHE = {
  id: "theatre",
  nom: "Le théâtre à l'italienne",
  lieu: "Nouveau lieu · Ville · anneau moyen",
  environnement: "ville",
  anneau: "moyen",
  danger: 3,
  recit:
    "Pendant cent cinquante ans, on y a joué l'opérette, la tragédie et la revue du Nouvel An. Pour sa dernière saison, la Compagnie l'avait loué à un « spectacle immersif 100 % holographique, sans acteurs » : plus besoin de comédiens, seulement de beaucoup de watts. Le soir de la Grande Panne, la salle était complète, les fauteuils premium ont vibré une dernière fois, et l'hologramme n'est jamais entré en scène.",
  inspiration:
    "les théâtres et cinémas-théâtres à l'italienne abandonnés d'Europe et d'Amérique (photographies d'urbex : balcons dorés en fer à cheval effondrés, plafonds peints crevés, lustres de cristal, fauteuils de velours rouge sous la poussière, fosses d'orchestre inondées), les théâtres municipaux néoclassiques français",
  reperes: [
    "La façade néoclassique : portique de six colonnes, fronton aux masques de la comédie et de la tragédie, lettres dorées « TH ÂTRE » (l'É est tombé sur le parvis, le R pend de travers)",
    "Les affiches de la dernière représentation : « Spectacle immersif 100 % holographique — sans acteurs ! » (l'écran du hall luit encore la nuit), et l'opérette d'avant, recouverte d'un bandeau « ANNULÉ »",
    "Le parvis : colonne d'affiches, réverbères, poteaux à cordon de velours de la première, renversés",
    "Le hall : sol en damier, guichet de la billetterie « COMPLET », borne de billets à reconnaissance faciale, vestiaire plein de manteaux",
    "Le grand foyer à miroirs : trumeaux dorés fêlés, lustres, buvette, et le feu des survivants dans la cheminée de marbre",
    "La salle : parterre de fauteuils de velours (rangs effondrés dans le vide sanitaire, fauteuils arrachés), balcons en fer à cheval ivoire et or sur trois rangs, un pan du deuxième balcon tombé",
    "Le plafond peint crevé : un rai de lumière tombe sur le lustre de cristal écrasé au milieu du parterre, des morceaux de la fresque gisent entre les rangs",
    "La fosse d'orchestre noyée : eau noire, un piano à queue qui dépasse, pupitres et partitions qui flottent",
    "La scène : rideau rouge en lambeaux, le projecteur d'hologrammes mort au milieu, la lampe de servante sur batterie, les bougies d'une veillée de survivants, décors peints effondrés, cordages qui pendent des cintres",
    "Les fauteuils « premium vibrants connectés » du premier rang (49 Wh la séance)",
    "Les coulisses, les loges des artistes (miroirs à ampoules, costumes, perruques), l'atelier des décors, la régie et sa petite génératrice",
  ],
  cartes: [
    {
      id: "facade",
      nom: "La façade, le hall et le foyer",
      lot: { l: 36, p: 30 },
      depart: versCarte("facade", [{ x: 6, z: 19.5 }])[0],
      description: "le parvis, le portique, le hall de la billetterie et le vestiaire, le grand foyer à miroirs",
      entrees: versCarte("facade", [
        { x: 0, z: 11, nature: "la porte centrale du portique (un vantail ouvert)" },
        { x: 3.2, z: 11, nature: "la porte est du portique (vitre brisée)" },
        { x: 0, z: -3, nature: "la porte centrale de la salle, au fond du foyer (vers la carte « la salle, la scène et les coulisses »)" },
        { x: -6, z: -3, nature: "la porte ouest de la salle (vers la carte « la salle »)" },
        { x: 6, z: -3, nature: "la porte est de la salle (vers la carte « la salle »)" },
        { x: 12, z: 0.5, nature: "la porte-fenêtre brisée du foyer, côté est" },
      ]),
      fouille: versCarte("facade", [
        { x: -9.6, z: 7.2, quoi: "billetterie : caisse (pièces sans valeur), rouleaux de billets, trousseau de clés (dont « RÉGIE »), lampe de bureau" },
        { x: -6.5, z: 9.6, quoi: "borne de billets à reconnaissance faciale : écran, carte électronique, petite batterie" },
        { x: 9.8, z: 7.5, quoi: "vestiaire : manteaux, écharpes, parapluies (tissus, vêtements chauds)" },
        { x: 10.3, z: 0.5, quoi: "buvette du foyer : bouteilles (alcool), sucre, verres, tire-bouchon" },
        { x: -9.6, z: 0.5, quoi: "le campement du foyer : couvertures, marmite, allumettes, bois de fauteuils débité" },
        { x: 4, z: -1.8, quoi: "banquettes de velours : tissu lourd, rembourrage, ressorts" },
        { x: 11.5, z: 17.5, quoi: "colonne d'affiches et poteaux à cordon : cordons de velours, laiton" },
      ]),
      eteints: versCarte("facade", [
        { x: -4, z: 17.5, type: "errant (sur le parvis)" },
        { x: 13, z: 15, type: "errant (près des réverbères)" },
        { x: 2.5, z: 12.4, type: "rampant (sous le portique, entre les colonnes)" },
        { x: -2.5, z: 7, type: "ancien habitant (ouvreuse, lampe de poche et programme)" },
        { x: 6, z: 9.5, type: "errant (dans le hall)" },
        { x: 5.5, z: 0.5, type: "ancien habitant (spectateur en smoking, devant les miroirs)" },
        { x: -3, z: -1.5, type: "putréfié (affalé sur une banquette)" },
      ]),
    },
    {
      id: "salle",
      nom: "La salle, la scène et les coulisses",
      lot: { l: 46, p: 38 },
      depart: versCarte("salle", [{ x: 0, z: -1.6 }])[0],
      description: "le parterre et la fosse d'orchestre, la scène, les coulisses, les loges des artistes, l'atelier des décors, la régie",
      entrees: versCarte("salle", [
        { x: 0, z: -3, nature: "la porte centrale de la salle, depuis le foyer (vers la carte « la façade, le hall et le foyer »)" },
        { x: -6, z: -3, nature: "la porte ouest de la salle, depuis le foyer" },
        { x: 6, z: -3, nature: "la porte est de la salle, depuis le foyer" },
        { x: -16, z: -20, nature: "l'entrée des artistes, au sud des loges" },
        { x: 23, z: -30, nature: "le rideau métallique de l'atelier des décors, à moitié levé" },
      ]),
      fouille: versCarte("salle", [
        { x: -12.5 + 3.5, z: -10, quoi: "fauteuils de velours arrachés : tissu lourd (vêtements, isolation), crin, ressorts" },
        { x: 1.2, z: -13.2, quoi: "le lustre écrasé : cristaux (lentilles, signaux), fil de laiton, chaîne" },
        { x: -3, z: -20.8, quoi: "la fosse d'orchestre : partitions, cordes de violon, pupitres (il faut entrer dans l'eau noire)" },
        { x: 3.2, z: -18.6, quoi: "fauteuils « premium vibrants connectés » : moteurs vibrants, câbles, petite batterie" },
        { x: 0.6, z: -27.5, quoi: "projecteur d'hologrammes : lentilles, ventilateurs, carte électronique, câble de forte section" },
        { x: -2.5, z: -24.6, quoi: "le rideau tombé : grands lés de velours rouge (tissu lourd)" },
        { x: -13.6, z: -29, quoi: "le cintre à cordes : cordages de chanvre, poulies, mousquetons, contrepoids en fonte" },
        { x: 12.5, z: -26.5, quoi: "coulisse est : projecteurs sur pied (lentilles de Fresnel, câbles), malles de tournée" },
        { x: -19.6, z: -33.5, quoi: "loge 1 : costumes de scène (velours, soie, broderies), maquillage, perruques" },
        { x: -19.6, z: -28, quoi: "loge 2 : costumes, chaussures, nécessaire de couture (fil, aiguilles)" },
        { x: -19.6, z: -22.7, quoi: "loge 3 : miroir à ampoules (ampoules, fils), trousse à pharmacie, partitions" },
        { x: 19, z: -34.6, quoi: "atelier des décors : bois de scène (planches, tasseaux), outils, clous, colle, pots de peinture" },
        { x: 9.6, z: -5.6, quoi: "régie : petite génératrice (à remettre en marche), jerrican, câbles, poursuite (lentille)" },
      ]),
      eteints: versCarte("salle", [
        { x: -4.5, z: -9, type: "errant (assis au parterre, face à la scène)" },
        { x: 5.5, z: -11.5, type: "errant (assis au parterre)" },
        { x: -6.5, z: -15.5, type: "errant (dans l'allée latérale)" },
        { x: -3, z: -15.4, type: "rampant (dans le trou du parterre effondré)" },
        { x: 2.5, z: -21, type: "ancien habitant (violoniste, dans l'eau de la fosse)" },
        { x: -4.5, z: -21.2, type: "putréfié (pianiste, dans la fosse)" },
        { x: 4.5, z: -30.5, type: "ancien habitant (comédien en costume, sur la scène)" },
        { x: 11, z: -33, type: "errant (machiniste, en coulisse)" },
        { x: -16, z: -32, type: "rampant (couloir des loges)" },
        { x: 18.5, z: -29, type: "errant (atelier des décors)" },
        { x: 10.5, z: -14, type: "errant (couloir de l'est, sous le balcon)" },
      ]),
    },
  ],
};

// ---------- Mesures ----------

const FZ = 11; // nu de la façade
const ZH = 4; // mur entre le hall et le foyer
const ZS = -3; // mur entre le foyer et la salle
const ZP = -23; // mur de scène (cadre de scène)
const ZN = -36; // fond de scène
const XS = 12; // demi-largeur de la salle
const XC = 15; // demi-largeur de la cage de scène
const CUT = 0.9; // coupe des façades côté caméra
const CUTI = 1.2; // coupe des cloisons intérieures
const EP = 0.6; // murs de pierre
const EPI = 0.22; // cloisons
const SCENE = 0.15; // hauteur du plancher de scène
// Le fer à cheval des balcons
const ZC = -12.5; // centre du demi-cercle
const ZF = -21; // bout des bras (avant-scène)
const RF = 7.4; // rayon du nu des balcons (garde-corps)
const RB = 9.2; // rayon du fond des balcons
const NIVEAUX = [3.6, 6.4, 9.2]; // premier balcon, deuxième balcon, paradis
const HPLAF = 12.6; // plafond peint

const COUL = {
  pierre: 0xd8ceb6,
  pierreOmbre: 0xb9ae96,
  ivoire: 0xe4dac2,
  dore: 0xc29a45,
  doreSombre: 0x8e6e34,
  velours: 0x8a3038,
  veloursPasse: 0x9a5258,
  veloursSombre: 0x5e2128,
  moquette: 0x6a2c30,
  boisScene: 0x6a5642,
  noir: 0x262322,
  marbre: 0xe6e0d4,
  marbreRose: 0xc9a79a,
  miroir: 0xb9c6c9,
  cuivre: 0x6fa58f,
  rideau: 0x8c2a30,
  zinc: PALETTE.zinc,
  fonte: 0x3b3a38,
  laiton: 0xb59048,
  cristal: 0xdfeef2,
  papier: 0xe6dcc2,
  enduitSalle: 0xc9a98e,
  mur: 0xd9cdb6,
};

// ---------- L'atlas des affiches, enseignes, lettres, fresque et décors peints ----------

const AL = 1024;
const AH = 2048;
const R = {
  holo: [0, 0, 512, 768],
  operette: [512, 0, 512, 768],
  T: [0, 768, 128, 160],
  H: [128, 768, 128, 160],
  Eacc: [256, 768, 128, 160],
  Acirc: [384, 768, 128, 160],
  Rl: [512, 768, 128, 160],
  E: [640, 768, 128, 160],
  complet: [768, 768, 256, 160],
  ornement: [0, 928, 512, 128],
  billetterie: [512, 928, 512, 128],
  fresque: [0, 1056, 512, 512],
  foret: [512, 1056, 512, 256],
  palais: [512, 1312, 512, 256],
  masques: [0, 1568, 256, 256],
  miroirLoge: [256, 1568, 256, 256],
  premium: [512, 1568, 256, 128],
  sortie: [768, 1568, 256, 128],
  artistes: [512, 1696, 256, 128],
  regie: [768, 1696, 256, 128],
  partition: [0, 1824, 256, 224],
  graffiti: [256, 1824, 512, 224],
  watty: [768, 1824, 256, 224],
};

let MATS = null;

function matieres() {
  if (MATS) return MATS;
  const atlas = dessiner("theatre-atlas", AL, AH, dessinerAtlas, false);
  const affiches = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.8, alphaTest: 0.5, side: THREE.DoubleSide });
  const ecran = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 0.9, vertexColors: true, roughness: 0.4, alphaTest: 0.5, side: THREE.DoubleSide });
  ecran.userData.sansOmbre = true;
  MATS = {
    pierre: matiereMonde("pierreTaille"),
    enduit: matiereMonde("enduit"),
    damier: matiereMonde("damier"),
    parquet: matiereMonde("parquet"),
    ardoise: matiereMonde("ardoise"),
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    eau: matiereEau(0x3c4a44, 0.7),
    flamme: matiereLueur(0xffffff, 0.6),
    affiches,
    ecran,
    mat: matiere(0.95),
    satin: matiere(0.6, 0.05),
    lisse: matiere(0.3, 0.05),
    tole: MAT.tole(),
    metal: matiere(0.4, 0.7),
    toile: MAT.toile(),
  };
  return MATS;
}

function salir(g, a, x, y, l, h, force = 1) {
  g.save();
  g.beginPath();
  g.rect(x, y, l, h);
  g.clip();
  for (let i = 0; i < (l * h) / 260; i++) {
    g.fillStyle = a() < 0.5 ? `rgba(0,0,0,${0.05 * force})` : `rgba(255,255,255,${0.05 * force})`;
    g.fillRect(x + a() * l, y + a() * h, 1 + a() * 3, 1 + a() * 3);
  }
  for (let i = 0; i < 6 * force; i++) {
    const cx = x + a() * l;
    const lg = h * (0.3 + a() * 0.8);
    const d = g.createLinearGradient(0, y, 0, y + lg);
    d.addColorStop(0, `rgba(60,52,40,${0.2 * force})`);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(cx, y, 2 + a() * 6, lg);
  }
  g.restore();
}

const SERIF = '"Didot", "Bodoni 72", "Playfair Display", Georgia, "Times New Roman", serif';
const SANS = '"Arial Black", "Helvetica Neue", Arial, sans-serif';

function texte(g, t, x, y, taille, couleur, police = "900", align = "center", rotation = 0, famille = SANS) {
  g.save();
  g.translate(x, y);
  g.rotate(rotation);
  g.font = `${police} ${taille}px ${famille}`;
  g.fillStyle = couleur;
  g.textAlign = align;
  g.textBaseline = "middle";
  g.fillText(t, 0, 0);
  g.restore();
}

/** Une déchirure de papier (coin arraché) : on efface en transparence. */
function dechirer(g, a, x, y, l, h, coin) {
  g.save();
  g.globalCompositeOperation = "destination-out";
  g.beginPath();
  const [cx, cy, sx, sy] = coin === "bd" ? [x + l, y + h, -1, -1] : coin === "hg" ? [x, y, 1, 1] : [x, y + h, 1, -1];
  g.moveTo(cx, cy);
  let px = cx + sx * l * 0.45;
  g.lineTo(px, cy);
  for (let i = 0; i < 9; i++) {
    px -= sx * l * 0.045;
    g.lineTo(px, cy + sy * (i + 1) * h * 0.04 + (a() - 0.5) * 10);
  }
  g.lineTo(cx, cy + sy * h * 0.42);
  g.closePath();
  g.fill();
  g.restore();
}

function dessinerAtlas(g) {
  const a = aleatoire(1874);
  g.clearRect(0, 0, AL, AH);

  // L'affiche holographique de la dernière représentation (Abondance : canard, ocre, crème, rouge)
  {
    const [x, y, l, h] = R.holo;
    const d = g.createLinearGradient(x, y, x, y + h);
    d.addColorStop(0, "#14232c");
    d.addColorStop(0.55, "#1f3f48");
    d.addColorStop(1, "#2f1d2a");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
    // lignes de balayage
    g.fillStyle = "rgba(160,230,230,0.06)";
    for (let yy = y; yy < y + h; yy += 4) g.fillRect(x, yy, l, 1);
    texte(g, "SPECTACLE IMMERSIF", x + l / 2, y + 46, 38, "#e9dfc6", "900");
    texte(g, "100 %", x + l / 2, y + 112, 86, "#c79a3b", "900");
    texte(g, "HOLOGRAPHIQUE", x + l / 2, y + 180, 50, "#7fd6d0", "900");
    // le cône de lumière et la danseuse fantôme
    const cx = x + l / 2;
    const cone = g.createLinearGradient(0, y + 560, 0, y + 230);
    cone.addColorStop(0, "rgba(127,214,208,0.55)");
    cone.addColorStop(1, "rgba(127,214,208,0.02)");
    g.fillStyle = cone;
    g.beginPath();
    g.moveTo(cx - 30, y + 560);
    g.lineTo(cx + 30, y + 560);
    g.lineTo(cx + 150, y + 240);
    g.lineTo(cx - 150, y + 240);
    g.fill();
    g.strokeStyle = "rgba(200,255,250,0.85)";
    g.lineWidth = 3;
    g.beginPath();
    g.arc(cx, y + 290, 18, 0, 7);
    g.moveTo(cx, y + 308);
    g.lineTo(cx - 6, y + 400);
    g.lineTo(cx - 60, y + 480);
    g.moveTo(cx - 6, y + 400);
    g.lineTo(cx + 50, y + 470);
    g.lineTo(cx + 90, y + 450);
    g.moveTo(cx - 70, y + 300);
    g.lineTo(cx, y + 330);
    g.lineTo(cx + 80, y + 270);
    g.stroke();
    g.fillStyle = "#9aa3a6";
    g.beginPath();
    g.ellipse(cx, y + 566, 60, 14, 0, 0, 7);
    g.fill();
    // le bandeau rouge
    g.fillStyle = "#c8362b";
    g.fillRect(x, y + 596, l, 66);
    texte(g, "SANS ACTEURS !", x + l / 2, y + 630, 48, "#e9dfc6", "900");
    texte(g, "Fauteuils premium vibrants connectés · supplément 49 Wh", x + l / 2, y + 688, 17, "#e9dfc6", "700");
    texte(g, "Une production de la Compagnie · Watty vous souhaite un bon spectacle", x + l / 2, y + 716, 14, "#9cc7c4", "600");
    texte(g, "CE SOIR 20 h", x + l / 2, y + 746, 24, "#c79a3b", "900");
    // la pastille « DERNIÈRE »
    g.save();
    g.translate(x + 410, y + 250);
    g.rotate(0.35);
    g.fillStyle = "#c79a3b";
    g.fillRect(-90, -22, 180, 44);
    texte(g, "DERNIÈRE !", 0, 2, 28, "#14232c", "900");
    g.restore();
    salir(g, a, x, y, l, h, 0.8);
  }
  // L'opérette d'avant, sur papier crème, recouverte d'un bandeau « ANNULÉ »
  {
    const [x, y, l, h] = R.operette;
    g.fillStyle = "#e3d6b4";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "#7a2630";
    g.lineWidth = 6;
    g.strokeRect(x + 18, y + 18, l - 36, h - 36);
    g.lineWidth = 2;
    g.strokeRect(x + 30, y + 30, l - 60, h - 60);
    texte(g, "THÉÂTRE MUNICIPAL", x + l / 2, y + 70, 30, "#5a3b2a", "700", "center", 0, SERIF);
    texte(g, "Les Amants", x + l / 2, y + 150, 64, "#7a2630", "700", "center", 0, SERIF);
    texte(g, "de la Centrale", x + l / 2, y + 220, 54, "#7a2630", "700", "center", 0, SERIF);
    texte(g, "opérette en trois actes", x + l / 2, y + 274, 26, "#5a3b2a", "italic 400", "center", 0, SERIF);
    // deux silhouettes sous un réverbère
    g.fillStyle = "#2f2a26";
    g.fillRect(x + l / 2 - 4, y + 320, 8, 250);
    g.beginPath();
    g.arc(x + l / 2, y + 318, 22, 0, 7);
    g.fill();
    const lum = g.createRadialGradient(x + l / 2, y + 330, 10, x + l / 2, y + 400, 190);
    lum.addColorStop(0, "rgba(232,190,90,0.55)");
    lum.addColorStop(1, "rgba(232,190,90,0)");
    g.fillStyle = lum;
    g.fillRect(x + 40, y + 300, l - 80, 300);
    g.fillStyle = "#3b2a2a";
    for (const [sx, s] of [[-80, 1], [74, -1]]) {
      g.beginPath();
      g.ellipse(x + l / 2 + sx, y + 470, 26, 80, 0, 0, 7);
      g.fill();
      g.beginPath();
      g.arc(x + l / 2 + sx + s * 6, y + 376, 20, 0, 7);
      g.fill();
    }
    texte(g, "Orchestre et chœurs · 60 musiciens", x + l / 2, y + 616, 24, "#5a3b2a", "400", "center", 0, SERIF);
    texte(g, "Saison lyrique", x + l / 2, y + 660, 22, "#5a3b2a", "italic 400", "center", 0, SERIF);
    // le bandeau collé de travers
    g.save();
    g.translate(x + l / 2, y + 420);
    g.rotate(-0.32);
    g.fillStyle = "#e9dfc6";
    g.fillRect(-300, -36, 600, 72);
    texte(g, "ANNULÉ", 0, -8, 40, "#c8362b", "900");
    texte(g, "remplacé par l'hologramme", 0, 22, 18, "#2f6f73", "800");
    g.restore();
    taches(g, a, 10, "rgba(110,80,40,0.25)", 10, 50, l, h);
    salir(g, a, x, y, l, h, 1.4);
    dechirer(g, a, x, y, l, h, "bd");
  }
  // Les lettres dorées du fronton
  for (const [cle, lettre] of [["T", "T"], ["H", "H"], ["Eacc", "É"], ["Acirc", "Â"], ["Rl", "R"], ["E", "E"]]) {
    const [x, y, l, h] = R[cle];
    g.save();
    g.font = `700 ${h * 0.86}px ${SERIF}`;
    g.textAlign = "center";
    g.textBaseline = "alphabetic";
    const d = g.createLinearGradient(0, y, 0, y + h);
    d.addColorStop(0, "#fff0b0");
    d.addColorStop(0.45, "#e0b452");
    d.addColorStop(1, "#9a7228");
    g.lineWidth = 6;
    g.strokeStyle = "#4a3518";
    g.strokeText(lettre, x + l / 2, y + h - 12);
    g.fillStyle = d;
    g.fillText(lettre, x + l / 2, y + h - 12);
    g.restore();
  }
  // COMPLET
  {
    const [x, y, l, h] = R.complet;
    g.fillStyle = "#c8362b";
    g.fillRect(x, y + 40, l, 80);
    texte(g, "COMPLET", x + l / 2, y + 82, 50, "#e9dfc6", "900");
    salir(g, a, x, y + 40, l, 80, 1);
  }
  // L'ornement des balcons : ivoire, moulures dorées, cartouche et guirlandes
  {
    const [x, y, l, h] = R.ornement;
    g.fillStyle = "#e8dcc0";
    g.fillRect(x, y, l, h);
    const or = (yy, ep) => {
      const d = g.createLinearGradient(0, yy, 0, yy + ep);
      d.addColorStop(0, "#f0d27c");
      d.addColorStop(1, "#8e6a2a");
      g.fillStyle = d;
      g.fillRect(x, yy, l, ep);
    };
    or(y, 14);
    or(y + h - 16, 16);
    or(y + 20, 4);
    or(y + h - 24, 4);
    // cartouche central
    g.strokeStyle = "#b08a3a";
    g.lineWidth = 6;
    g.beginPath();
    g.ellipse(x + l / 2, y + h / 2, 52, 34, 0, 0, 7);
    g.stroke();
    g.fillStyle = "#c79a3b";
    g.beginPath();
    g.ellipse(x + l / 2, y + h / 2, 30, 18, 0, 0, 7);
    g.fill();
    // guirlandes
    g.lineWidth = 5;
    for (const s of [-1, 1]) {
      for (let k = 0; k < 2; k++) {
        const x0 = x + l / 2 + s * (70 + k * 92);
        g.beginPath();
        g.moveTo(x0, y + 34);
        g.quadraticCurveTo(x0 + s * 46, y + 92, x0 + s * 92, y + 34);
        g.stroke();
        g.fillStyle = "#c79a3b";
        g.beginPath();
        g.arc(x0, y + 36, 7, 0, 7);
        g.fill();
      }
    }
    taches(g, a, 8, "rgba(90,70,40,0.25)", 8, 40, l, h);
    salir(g, a, x, y, l, h, 1.3);
  }
  // BILLETTERIE : bois vert sombre, lettres dorées
  {
    const [x, y, l, h] = R.billetterie;
    g.fillStyle = "#24392f";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "#b8963e";
    g.lineWidth = 4;
    g.strokeRect(x + 8, y + 8, l - 16, h - 16);
    texte(g, "BILLETTERIE", x + l / 2, y + 54, 58, "#d9b763", "700", "center", 0, SERIF);
    texte(g, "LOCATION · GUICHET · ABONNEMENTS", x + l / 2, y + 100, 18, "#c9b27a", "700");
    salir(g, a, x, y, l, h, 1.2);
  }
  // La fresque du plafond : ciel, nuées, muses, nervures dorées, auréoles d'infiltration
  {
    const [x, y, l, h] = R.fresque;
    const cx = x + l / 2;
    const cy = y + h / 2;
    g.fillStyle = "#c9a36a";
    g.fillRect(x, y, l, h);
    const ciel = g.createRadialGradient(cx, cy, 20, cx, cy, l / 2);
    ciel.addColorStop(0, "#f3ecd6");
    ciel.addColorStop(0.35, "#b9d2dc");
    ciel.addColorStop(0.8, "#7fa7bd");
    ciel.addColorStop(1, "#5c7f96");
    g.fillStyle = ciel;
    g.beginPath();
    g.arc(cx, cy, l / 2 - 26, 0, 7);
    g.fill();
    // nuées
    for (let i = 0; i < 26; i++) {
      const an = a() * 7;
      const r = 70 + a() * 140;
      g.fillStyle = `rgba(250,244,230,${0.35 + a() * 0.4})`;
      g.beginPath();
      g.ellipse(cx + Math.cos(an) * r, cy + Math.sin(an) * r, 22 + a() * 30, 12 + a() * 14, an, 0, 7);
      g.fill();
    }
    // muses drapées (silhouettes colorées) entre les nervures
    const tons = ["#a8443c", "#3f6f86", "#c7954a", "#6f8a4f", "#8a5a8a", "#b56a4a", "#3f5f7a", "#c7a24a"];
    for (let i = 0; i < 8; i++) {
      const an = (i / 8) * Math.PI * 2 + 0.2;
      const r = 165;
      const px = cx + Math.cos(an) * r;
      const py = cy + Math.sin(an) * r;
      g.save();
      g.translate(px, py);
      g.rotate(an + Math.PI / 2);
      g.fillStyle = tons[i];
      g.beginPath();
      g.ellipse(0, 10, 20, 46, 0.2, 0, 7);
      g.fill();
      g.fillStyle = "#e8c9a6";
      g.beginPath();
      g.arc(0, -40, 11, 0, 7);
      g.fill();
      g.restore();
    }
    // nervures dorées et anneau
    g.strokeStyle = "#c79a3b";
    g.lineWidth = 7;
    for (let i = 0; i < 8; i++) {
      const an = (i / 8) * Math.PI * 2;
      g.beginPath();
      g.moveTo(cx + Math.cos(an) * 48, cy + Math.sin(an) * 48);
      g.lineTo(cx + Math.cos(an) * (l / 2 - 26), cy + Math.sin(an) * (l / 2 - 26));
      g.stroke();
    }
    g.lineWidth = 14;
    g.beginPath();
    g.arc(cx, cy, l / 2 - 20, 0, 7);
    g.stroke();
    g.fillStyle = "#c79a3b";
    g.beginPath();
    g.arc(cx, cy, 44, 0, 7);
    g.fill();
    g.fillStyle = "#e6c46a";
    for (let i = 0; i < 12; i++) {
      const an = (i / 12) * Math.PI * 2;
      g.beginPath();
      g.arc(cx + Math.cos(an) * 30, cy + Math.sin(an) * 30, 7, 0, 7);
      g.fill();
    }
    // auréoles d'infiltration et écailles
    for (let i = 0; i < 7; i++) {
      const px = x + 60 + a() * (l - 120);
      const py = y + 60 + a() * (h - 120);
      const r = 20 + a() * 50;
      g.strokeStyle = "rgba(110,80,40,0.45)";
      g.lineWidth = 3;
      g.beginPath();
      g.arc(px, py, r, 0, 7);
      g.stroke();
      g.fillStyle = "rgba(140,110,70,0.22)";
      g.fill();
    }
    g.fillStyle = "rgba(225,215,195,0.85)";
    for (let i = 0; i < 40; i++) g.fillRect(x + a() * l, y + a() * h, 4 + a() * 14, 3 + a() * 9);
    salir(g, a, x, y, l, h, 1.2);
  }
  // Décor peint : la forêt
  {
    const [x, y, l, h] = R.foret;
    const d = g.createLinearGradient(0, y, 0, y + h);
    d.addColorStop(0, "#9fc0c6");
    d.addColorStop(0.6, "#d8d2a8");
    d.addColorStop(1, "#7f8f52");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
    for (let i = 0; i < 14; i++) {
      const tx = x + a() * l;
      const th = 90 + a() * 120;
      g.fillStyle = "#4a3a2a";
      g.fillRect(tx - 5, y + h - th * 0.6, 10, th * 0.6);
      g.fillStyle = ["#4f7a3c", "#5f8a46", "#3f6b3a", "#7a9a4a"][i % 4];
      g.beginPath();
      g.ellipse(tx, y + h - th * 0.7, 34 + a() * 20, th * 0.42, 0, 0, 7);
      g.fill();
    }
    g.fillStyle = "#c9b98a";
    g.beginPath();
    g.moveTo(x + l * 0.4, y + h);
    g.lineTo(x + l * 0.48, y + h * 0.62);
    g.lineTo(x + l * 0.52, y + h * 0.62);
    g.lineTo(x + l * 0.7, y + h);
    g.fill();
    salir(g, a, x, y, l, h, 1.5);
  }
  // Décor peint : le palais en trompe-l'œil
  {
    const [x, y, l, h] = R.palais;
    g.fillStyle = "#d9c9a0";
    g.fillRect(x, y, l, h);
    for (let i = 0; i < 8; i++) {
      const yy = y + h * 0.55 + i * 15;
      g.fillStyle = i % 2 ? "#4a443c" : "#e8e0cc";
      g.fillRect(x, yy, l, 15);
    }
    g.fillStyle = "#a9c4cc";
    for (let i = 0; i < 5; i++) {
      const ax = x + 50 + i * 100;
      g.fillRect(ax, y + 40, 60, 100);
      g.beginPath();
      g.arc(ax + 30, y + 40, 30, Math.PI, 0);
      g.fill();
    }
    g.fillStyle = "#efe6cf";
    for (let i = 0; i < 6; i++) {
      g.fillRect(x + 22 + i * 100, y + 20, 22, h * 0.55 - 20);
      g.fillStyle = "#c7a24a";
      g.fillRect(x + 16 + i * 100, y + 16, 34, 10);
      g.fillStyle = "#efe6cf";
    }
    g.fillStyle = "#8a2a30";
    g.fillRect(x, y, l, 14);
    salir(g, a, x, y, l, h, 1.5);
  }
  // Le médaillon du fronton : masques de la comédie et de la tragédie
  {
    const [x, y, l, h] = R.masques;
    g.fillStyle = "#cfc5ad";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#ddd3bb";
    g.beginPath();
    g.arc(x + l / 2, y + h / 2, l / 2 - 8, 0, 7);
    g.fill();
    g.strokeStyle = "#a99f87";
    g.lineWidth = 6;
    g.stroke();
    const masque = (mx, my, rot, triste) => {
      g.save();
      g.translate(mx, my);
      g.rotate(rot);
      g.fillStyle = "#efe8d6";
      g.beginPath();
      g.ellipse(0, 0, 38, 50, 0, 0, 7);
      g.fill();
      g.strokeStyle = "#8f866e";
      g.lineWidth = 3;
      g.stroke();
      g.fillStyle = "#6e6650";
      for (const s of [-1, 1]) {
        g.beginPath();
        g.ellipse(s * 15, -10, 9, triste ? 5 : 7, s * (triste ? -0.4 : 0.3), 0, 7);
        g.fill();
      }
      g.lineWidth = 5;
      g.strokeStyle = "#6e6650";
      g.beginPath();
      if (triste) g.arc(0, 30, 16, Math.PI + 0.4, -0.4);
      else g.arc(0, 14, 16, 0.3, Math.PI - 0.3);
      g.stroke();
      g.restore();
    };
    masque(x + l / 2 - 36, y + h / 2 - 6, -0.3, false);
    masque(x + l / 2 + 36, y + h / 2 + 6, 0.3, true);
    taches(g, a, 6, "rgba(70,80,50,0.3)", 8, 30, l, h);
    salir(g, a, x, y, l, h, 1.4);
  }
  // Le miroir de loge à ampoules, avec un mot au rouge à lèvres
  {
    const [x, y, l, h] = R.miroirLoge;
    g.fillStyle = "#3a302a";
    g.fillRect(x, y, l, h);
    const d = g.createLinearGradient(x, y, x + l, y + h);
    d.addColorStop(0, "#c9d3d6");
    d.addColorStop(0.5, "#8d9ba0");
    d.addColorStop(1, "#b8c4c8");
    g.fillStyle = d;
    g.fillRect(x + 30, y + 30, l - 60, h - 60);
    g.fillStyle = "rgba(255,255,255,0.25)";
    g.beginPath();
    g.moveTo(x + 50, y + 30);
    g.lineTo(x + 90, y + 30);
    g.lineTo(x + 40, y + 140);
    g.lineTo(x + 30, y + 120);
    g.fill();
    for (let i = 0; i < 6; i++) {
      for (const [bx, by] of [[x + 30 + i * ((l - 60) / 5), y + 15], [x + 30 + i * ((l - 60) / 5), y + h - 15]]) {
        g.fillStyle = a() < 0.25 ? "#4a4440" : "#efe6c8";
        g.beginPath();
        g.arc(bx, by, 10, 0, 7);
        g.fill();
      }
    }
    for (let i = 1; i < 5; i++) {
      for (const bx of [x + 15, x + l - 15]) {
        g.fillStyle = a() < 0.25 ? "#4a4440" : "#efe6c8";
        g.beginPath();
        g.arc(bx, y + 30 + i * ((h - 60) / 5), 10, 0, 7);
        g.fill();
      }
    }
    texte(g, "MERDE !", x + l / 2, y + h / 2 + 10, 34, "rgba(170,40,50,0.85)", "900", "center", -0.15);
    salir(g, a, x, y, l, h, 1);
  }
  // La plaque des fauteuils premium
  {
    const [x, y, l, h] = R.premium;
    g.fillStyle = "#e9e6de";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, l, 34);
    texte(g, "PREMIUM", x + l / 2, y + 18, 24, "#e9dfc6", "900");
    texte(g, "VIBRANT · CONNECTÉ", x + l / 2, y + 54, 18, "#2f6f73", "900");
    texte(g, "synchronisé à l'hologramme", x + l / 2, y + 80, 13, "#555", "700");
    texte(g, "49 Wh / séance", x + l / 2, y + 104, 18, "#c8362b", "900");
    salir(g, a, x, y, l, h, 0.8);
  }
  // SORTIE (néon vert)
  {
    const [x, y, l, h] = R.sortie;
    g.fillStyle = "#1f8a4c";
    g.fillRect(x, y, l, h);
    texte(g, "SORTIE", x + l / 2, y + h / 2, 56, "#effff4");
  }
  // ENTRÉE DES ARTISTES (plaque émaillée bleue)
  {
    const [x, y, l, h] = R.artistes;
    g.fillStyle = "#24476e";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "#e9e2d0";
    g.lineWidth = 5;
    g.strokeRect(x + 8, y + 8, l - 16, h - 16);
    texte(g, "ENTRÉE", x + l / 2, y + 44, 34, "#e9e2d0", "900");
    texte(g, "DES ARTISTES", x + l / 2, y + 88, 30, "#e9e2d0", "900");
    salir(g, a, x, y, l, h, 1.3);
  }
  // RÉGIE · SILENCE
  {
    const [x, y, l, h] = R.regie;
    g.fillStyle = "#1e1c1b";
    g.fillRect(x, y, l, h);
    texte(g, "RÉGIE", x + l / 2, y + 42, 46, "#e6e0d0", "900");
    g.fillStyle = "#b0473b";
    g.fillRect(x + 20, y + 76, l - 40, 36);
    texte(g, "SILENCE", x + l / 2, y + 95, 28, "#f1ece0", "900");
  }
  // Une partition
  {
    const [x, y, l, h] = R.partition;
    g.fillStyle = "#e8dfc6";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "#3a332a";
    g.lineWidth = 1;
    for (let p = 0; p < 6; p++) {
      const y0 = y + 26 + p * 32;
      for (let k = 0; k < 5; k++) {
        g.beginPath();
        g.moveTo(x + 12, y0 + k * 4);
        g.lineTo(x + l - 12, y0 + k * 4);
        g.stroke();
      }
      g.fillStyle = "#2a241e";
      for (let n = 0; n < 12; n++) {
        const nx = x + 24 + n * 18 + a() * 4;
        const ny = y0 + Math.floor(a() * 9) * 2;
        g.beginPath();
        g.ellipse(nx, ny, 3.5, 2.6, -0.4, 0, 7);
        g.fill();
        g.fillRect(nx + 2.5, ny - 14, 1.2, 14);
      }
    }
    texte(g, "Acte III — Finale", x + l / 2, y + 12, 13, "#3a332a", "italic 700", "center", 0, SERIF);
    taches(g, a, 6, "rgba(90,70,40,0.3)", 8, 30, l, h);
  }
  // Le graffiti des survivants, sur le mur du fond de scène (transparent)
  {
    const [x, y, l, h] = R.graffiti;
    g.save();
    g.globalAlpha = 0.92;
    texte(g, "LE SPECTACLE", x + l / 2, y + 62, 64, "#ece6d8", "900", "center", -0.03);
    texte(g, "CONTINUE", x + l / 2, y + 132, 70, "#ece6d8", "900", "center", -0.03);
    g.strokeStyle = "#ece6d8";
    g.lineWidth = 6;
    for (let i = 0; i < 4; i++) {
      const bx = x + 40 + i * 70;
      for (let k = 0; k < 4; k++) {
        g.beginPath();
        g.moveTo(bx + k * 10, y + 168);
        g.lineTo(bx + k * 10, y + 208);
        g.stroke();
      }
      g.beginPath();
      g.moveTo(bx - 6, y + 202);
      g.lineTo(bx + 38, y + 174);
      g.stroke();
    }
    texte(g, "♥", x + l - 60, y + 186, 50, "#ece6d8");
    g.restore();
  }
  // Watty, partenaire officiel
  {
    const [x, y, l, h] = R.watty;
    g.fillStyle = "#e9dfc6";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#2f6f73";
    g.fillRect(x + 92, y + 34, 72, 116);
    g.fillRect(x + 114, y + 22, 28, 14);
    g.fillStyle = "#c79a3b";
    g.fillRect(x + 92, y + 108, 72, 42);
    g.fillStyle = "#e9dfc6";
    g.beginPath();
    g.arc(x + 114, y + 70, 6, 0, 7);
    g.arc(x + 142, y + 70, 6, 0, 7);
    g.fill();
    g.strokeStyle = "#e9dfc6";
    g.lineWidth = 4;
    g.beginPath();
    g.arc(x + 128, y + 84, 14, 0.3, Math.PI - 0.3);
    g.stroke();
    texte(g, "Toujours plein, jamais à plat !", x + l / 2, y + 176, 15, "#c8362b", "900");
    texte(g, "Partenaire du 100 % holographique", x + l / 2, y + 202, 12, "#2f6f73", "800");
    salir(g, a, x, y, l, h, 1.2);
  }
}

// ---------- Outils géométriques ----------

const GEO = {};

function geoCylindre(r1, r2, h, cotes) {
  const cle = `cyl|${r1}|${r2}|${h}|${cotes}`;
  if (!GEO[cle]) GEO[cle] = new THREE.CylinderGeometry(r1, r2, h, cotes);
  return GEO[cle];
}

function geoTriangle(l, h, ep) {
  const cle = `tri|${l}|${h}|${ep}`;
  if (!GEO[cle]) {
    const s = new THREE.Shape([new THREE.Vector2(-l / 2, 0), new THREE.Vector2(l / 2, 0), new THREE.Vector2(0, h)]);
    GEO[cle] = new THREE.ExtrudeGeometry(s, { depth: ep, bevelEnabled: false }).translate(0, 0, -ep / 2);
  }
  return GEO[cle];
}

const OCTA = new THREE.OctahedronGeometry(1, 0);
const BOULE = new THREE.IcosahedronGeometry(1, 0);
const CONE = new THREE.ConeGeometry(1, 1, 5).translate(0, 0.5, 0);

/** Les UV d'une géométrie plane (dans son plan xy, de -l/2 à l/2) ramenées à une région de l'atlas. */
function uvRegion(g, r, l, h) {
  const uv = g.attributes.uv;
  const pos = g.attributes.position;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) {
    const u = pos.getX(i) / l + 0.5;
    const v = pos.getY(i) / h + 0.5;
    uv.setXY(i, (px + u * pw) / AL, 1 - (py + (1 - v) * ph) / AH);
  }
}

/** Un panneau plat dont l'image vient de l'atlas (région `r`), face vers +z local. */
function panneau(c, mat, r, pose, l, h) {
  const g = new THREE.PlaneGeometry(l, h);
  uvRegion(g, r, l, h);
  c.poser(g, mat, pose.teinte ?? 0xffffff, pose, { crasse: false, nuance: 0 });
  g.dispose();
}

function repereMur(a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  return { L: Math.hypot(dx, dz), ry: -Math.atan2(dz, dx), dx, dz };
}

function soustraire(u1, u2, trous) {
  let res = [[u1, u2]];
  for (const [t1, t2] of trous) {
    res = res.flatMap(([p, q]) => {
      if (t2 <= p || t1 >= q) return [[p, q]];
      const o = [];
      if (t1 > p) o.push([p, t1]);
      if (t2 < q) o.push([t2, q]);
      return o;
    });
  }
  return res.filter(([p, q]) => q - p > 0.03);
}

function tranche(ouvertures, p0, p1) {
  return ouvertures
    .filter((o) => o.haut > p0 + 0.01 && o.bas < p1 - 0.01)
    .map((o) => {
      const entiere = o.bas >= p0 - 1e-6 && o.haut <= p1 + 1e-6;
      return { ...o, type: (o.type === "fenetre" || o.type === "porte") && entiere ? o.type : "vide", bas: Math.max(0, o.bas - p0), haut: Math.min(p1 - p0 + 0.5, o.haut - p0) };
    });
}

/**
 * Un mur coupé : le bas (0 → `cut`) dans le chantier visible, le haut (`cut` → h) dans la couche `haut`.
 * `cut` = 0 : tout dans la couche ; `haut` absent : tout dans le chantier visible. Obstacles d'après les ouvertures.
 */
function murCoupe(k, a, b, spec) {
  const { h, cut = CUT, haut = null, ouvertures = [], breches = [], obstacles = true, ...reste } = spec;
  if (!haut) mur(k.c, a, b, { ...reste, h, ouvertures, breches });
  else {
    if (cut > 0) mur(k.c, a, b, { ...reste, h: cut, ouvertures: tranche(ouvertures, 0, cut) });
    if (h > cut) mur(cut > 0 ? haut : k.c, a, b, { ...reste, y0: (reste.y0 ?? 0) + cut, h: h - cut, ouvertures: tranche(ouvertures, cut, h), breches });
  }
  if (obstacles) {
    const { L, dx, dz } = repereMur(a, b);
    const trous = ouvertures.filter((o) => o.bas < 0.5 && o.haut > 0.5).map((o) => [o.u - o.l / 2, o.u + o.l / 2]);
    for (const [u1, u2] of soustraire(0, L, trous)) k.b.obstacle(a[0] + (dx * u1) / L, a[1] + (dz * u1) / L, a[0] + (dx * u2) / L, a[1] + (dz * u2) / L);
  }
}

/** Des bandeaux en saillie sur la face extérieure (+z local) d'un mur : [{ y1, y2, s, couleur, mat, ch, trous }]. */
function bandeaux(a, b, ep, liste) {
  const { L, ry } = repereMur(a, b);
  for (const bd of liste) {
    const d = bd.deborde ?? bd.s;
    bd.ch.repere({ x: a[0], z: a[1], ry }, () => {
      for (const [u1, u2] of soustraire(-d, L + d, bd.trous ?? [])) bd.ch.pave(u1, bd.y1, ep / 2 - 0.02, u2, bd.y2, ep / 2 + bd.s, bd.couleur, bd.mat, { nuance: 0.02, crasse: bd.y1 < 1 });
    });
  }
}

/** Une colonne : base, fût cannelé (12 pans), chapiteau, tailloir. */
function colonne(c, m, x, z, y0, h, r, couleur = COUL.pierre, cassee = 0) {
  const hf = h - 0.75;
  c.boite(r * 2.5, 0.3, r * 2.5, couleur, { x, y: y0 + 0.15, z }, m.pierre);
  c.poser(geoCylindre(r * 1.15, r * 1.25, 0.2, 12), m.mat, couleur, { x, y: y0 + 0.4, z });
  const hfut = hf * (1 - cassee);
  c.poser(geoCylindre(r * 0.88, r, hfut, 12), m.mat, couleur, { x, y: y0 + 0.5 + hfut / 2, z }, { nuance: 0.03 });
  if (cassee) return;
  c.poser(geoCylindre(r * 1.2, r * 0.9, 0.3, 12), m.mat, couleur, { x, y: y0 + 0.5 + hf + 0.1, z });
  c.boite(r * 2.6, 0.22, r * 2.6, couleur, { x, y: y0 + h - 0.11, z }, m.pierre);
}

/** Une flamme (feu, bougie) : un petit cône de lueur. */
function flamme(c, m, x, y, z, s = 1, teinte = 0xffb050) {
  c.poser(CONE, m.flamme, teinte, { x, y, z, e: [0.05 * s, 0.14 * s, 0.05 * s] }, { crasse: false, nuance: 0 });
}

/** Une bougie (cire, flamme). */
function bougie(c, m, x, z, y = 0, h = 0.18) {
  c.poser(geoCylindre(0.035, 0.04, h, 5), m.mat, 0xe6dcc0, { x, y: y + h / 2, z }, { crasse: false, nuance: 0.05 });
  flamme(c, m, x, y + h, z, 0.8);
}

/** Un lustre de cristal (debout ou couché) : fût de laiton, trois couronnes, pampilles. */
function lustre(c, m, x, y, z, r, pose = {}) {
  c.repere({ x, y, z, rx: pose.rx ?? 0, rz: pose.rz ?? 0 }, () => {
    c.tube([0, -0.2, 0], [0, 1.4 * r, 0], 0.05 * r, COUL.laiton, m.metal, 6);
    const couronnes = [[1.0, 0.2], [0.72, 0.65], [0.42, 1.05]];
    for (const [rr, yy] of couronnes) {
      const n = Math.round(14 * rr);
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2;
        const a1 = ((i + 1) / n) * Math.PI * 2;
        c.tube([Math.cos(a0) * rr * r, yy * r, Math.sin(a0) * rr * r], [Math.cos(a1) * rr * r, yy * r, Math.sin(a1) * rr * r], 0.03 * r, COUL.laiton, m.metal, 4);
        if (pose.manque && c.hasard() < pose.manque) continue;
        c.poser(OCTA, m.lisse, COUL.cristal, { x: Math.cos(a0) * rr * r, y: yy * r - 0.16 * r, z: Math.sin(a0) * rr * r, e: [0.06 * r, 0.13 * r, 0.06 * r] }, { crasse: false, nuance: 0.05 });
      }
    }
    c.poser(OCTA, m.lisse, COUL.cristal, { y: -0.35 * r, e: [0.12 * r, 0.3 * r, 0.12 * r] }, { crasse: false });
  });
}

/** Un fauteuil de théâtre (velours) : `etat` « ok », « renverse », « bascule » (dans un trou), « premium ». */
function fauteuil(c, m, x, z, ry, etat = "ok", couleur = COUL.velours) {
  c.repere({ x, y: 0.06, z, ry }, () => {
    if (etat === "premium") {
      c.boite(0.6, 0.42, 0.56, 0xd9d6ce, { y: 0.21 }, m.lisse);
      c.boite(0.6, 0.16, 0.5, 0x2f6f73, { y: 0.5, z: 0.02 }, m.satin);
      c.boite(0.62, 0.95, 0.16, 0xd9d6ce, { y: 0.78, z: 0.3, rx: -0.12 }, m.lisse);
      c.boite(0.5, 0.06, 0.02, 0x7fd6d0, { y: 0.98, z: 0.21, rx: -0.12 }, m.satin, { crasse: false });
      for (const s of [-1, 1]) c.boite(0.08, 0.2, 0.5, 0xc9c6be, { x: s * 0.3, y: 0.66 }, m.lisse);
      return;
    }
    const pose = etat === "renverse" ? { rx: 1.35, y: 0.25, z: -0.3 } : etat === "bascule" ? { rx: 0.7, y: -0.1, z: 0.1, rz: c.entre(-0.3, 0.3) } : {};
    c.repere(pose, () => {
      c.boite(0.5, 0.12, 0.46, couleur, { y: 0.44, z: -0.02, rx: etat === "ok" && c.hasard() < 0.3 ? -1.2 : 0 }, m.mat, { nuance: 0.1 });
      c.boite(0.52, 0.72, 0.1, couleur, { y: 0.72, z: 0.24, rx: -0.1 }, m.mat, { nuance: 0.1 });
      c.boite(0.06, 0.62, 0.48, COUL.fonte, { x: -0.27, y: 0.31 }, m.tole);
    });
  });
}

// ---------- Le bâtiment ----------

export function creer({ usure = 0.7, carte } = {}) {
  const id = carte === "salle" ? "salle" : "facade";
  const b = new Batiment(1874, usure);
  const m = matieres();
  const k = { b, c: b.c, m, usure, id, bris: 0.25 + 0.65 * usure };
  if (id === "facade") {
    // Couche de l'avant-corps : façade au-dessus de l'allège, entablement, fronton, hauts des murs du hall et du foyer,
    // toits. Les colonnes restent.
    k.T = b.couche("avant-corps", { x: 0, z: 5.6, l: 25.2, p: 18 }, CUT, 19);
    sols1(k);
    facade(k);
    portique(k);
    hall(k);
    foyer(k);
    parvis(k);
    arriere1(k);
    b.lumiere(-10.6, 0.8, 0.6, 0xff8a3d, 14, 12, "feu des survivants dans la cheminée du foyer");
    b.lumiere(3, 2.4, 4.7, 0x7fd6d0, 3, 6, "affiche holographique du hall, sur sa batterie");
    b.lumiere(8.6, 1.0, 12.6, 0xffc070, 4, 7, "lanterne de survivant, sous le portique");
  } else {
    k.T = b.couche("salle", { x: 0, z: -13, l: 24.6, p: 20.6 }, CUT, 19);
    k.BA = b.couche("balcons-avant", { x: 1.8, z: -13, l: 20.4, p: 20 }, 3.0, 12.4);
    k.BF = b.couche("balcons-fond", { x: -9.1, z: -15.1, l: 6.2, p: 15.8 }, 3.0, 12.4);
    k.K = b.couche("cintres", { x: 0, z: -29.3, l: 30.6, p: 13.4 }, CUT, 23);
    k.L = b.couche("loges", { x: -18, z: -28, l: 6.4, p: 16.4 }, CUT, 5.6);
    k.A = b.couche("atelier", { x: 19, z: -30, l: 8.4, p: 12.4 }, CUT, 8);
    sols2(k);
    mursSalle(k);
    balcons(k);
    parterre(k);
    fosse(k);
    scene(k);
    cintres(k);
    loges(k);
    atelier(k);
    regie(k);
    abords2(k);
    b.lumiere(-2.2, 0.6, -26.2, 0xffb35a, 7, 8, "bougies de la veillée, sur la scène");
    b.lumiere(3.2, 1.7, -24.6, 0xfff0d0, 6, 11, "lampe de servante, sur batterie");
    b.lumiere(10, 1.2, -5.4, 0xff6040, 2, 4, "voyant de la génératrice, en régie");
    b.lumiere(3.6, 0.7, -18.6, 0x7fd6d0, 2, 5, "fauteuils premium : une diode qui clignote encore");
  }

  // Les flammes vacillent.
  const anime = new THREE.Object3D();
  anime.userData.animer = (t) => {
    m.flamme.opacity = 0.5 + 0.12 * Math.sin(t * 13) * Math.sin(t * 7.3 + 1);
    m.ecran.emissiveIntensity = 0.8 + 0.15 * Math.sin(t * 2.1) + (Math.sin(t * 31) > 0.97 ? -0.5 : 0);
  };
  b.ajouter(anime);

  // Recentrer sur le lot de la carte
  const o = CENTRES[id];
  const groupe = b.construire();
  for (const enfant of groupe.children) enfant.position.set(-o.x, 0, -o.z);
  for (const t of groupe.userData.toits) {
    t.boite = { ...t.boite, x: t.boite.x - o.x, z: t.boite.z - o.z };
    if (t.horsDe) t.horsDe = { ...t.horsDe, x: t.horsDe.x - o.x, z: t.horsDe.z - o.z };
  }
  for (const s of groupe.userData.obstacles) {
    s.x1 = Math.round((s.x1 - o.x) * 100) / 100;
    s.x2 = Math.round((s.x2 - o.x) * 100) / 100;
    s.z1 = Math.round((s.z1 - o.z) * 100) / 100;
    s.z2 = Math.round((s.z2 - o.z) * 100) / 100;
  }
  for (const l of groupe.userData.lumieres) {
    l.x -= o.x;
    l.z -= o.z;
  }
  return groupe;
}

/** Ce point est-il dans le lot de la carte ? */
function dansLot(k, x, z, marge = 0) {
  const o = CENTRES[k.id];
  const lot = FICHE.cartes.find((q) => q.id === k.id).lot;
  return Math.abs(x - o.x) <= lot.l / 2 + marge && Math.abs(z - o.z) <= lot.p / 2 + marge;
}

/** Un vantail de porte posé à la main (porte capitonnée, porte de service) : charnière en (x, z), angle `ry`. */
function vantail(c, m, x, z, ry, l, h, couleur, capitonne = false) {
  c.repere({ x, y: 0.06, z, ry }, () => {
    c.boite(l, h, 0.06, couleur, { x: l / 2, y: h / 2 }, capitonne ? m.mat : m.satin, { nuance: 0.05 });
    if (capitonne) {
      for (let i = 0; i < 3; i++) for (let j = 0; j < 5; j++) c.boite(0.04, 0.04, 0.03, COUL.laiton, { x: l * (0.25 + i * 0.25), y: h * (0.15 + j * 0.17), z: 0.04 }, m.metal, { crasse: false });
      c.boite(0.04, 0.3, 0.05, COUL.laiton, { x: l - 0.12, y: 1.05, z: 0.06 }, m.metal);
    }
  });
}

/** Un poteau à cordon de velours (laiton) ; `tombe` : renversé. */
function poteau(c, m, x, z, tombe = false, ry = 0) {
  c.repere({ x, y: 0, z, ry, rz: tombe ? 1.45 : 0 }, () => {
    c.poser(geoCylindre(0.16, 0.18, 0.05, 8), m.metal, COUL.laiton, { y: tombe ? 0.15 : 0.03 });
    c.tube([0, 0.05, 0], [0, 0.95, 0], 0.03, COUL.laiton, m.metal, 6);
    c.poser(BOULE, m.metal, COUL.laiton, { y: 0.98, e: 0.05 });
  });
}

/** Le cordon entre deux poteaux (qui pend). */
function cordon(c, m, a, b) {
  const mi = [(a[0] + b[0]) / 2, 0.62, (a[1] + b[1]) / 2];
  c.tube([a[0], 0.88, a[1]], mi, 0.025, COUL.velours, m.mat, 4);
  c.tube(mi, [b[0], 0.88, b[1]], 0.025, COUL.velours, m.mat, 4);
}

/** Un grand miroir de foyer : trumeau doré, glace fêlée ou brisée, posé contre un mur (face vers `ry`). */
function miroir(c, m, x, z, ry, l, h, etat = "fele") {
  c.repere({ x, y: 0, z, ry }, () => {
    const y0 = 0.7;
    if (etat !== "brise") c.boite(l, h, 0.03, COUL.miroir, { y: y0 + h / 2, z: 0.03 }, m.metal, { crasse: false, nuance: 0.03 });
    else {
      c.boite(l, h, 0.03, 0x3a3230, { y: y0 + h / 2, z: 0.02 }, m.mat);
      c.boite(l * 0.4, h * 0.3, 0.03, COUL.miroir, { x: -l * 0.3, y: y0 + h * 0.15, z: 0.035, rz: 0.1 }, m.metal, { crasse: false });
    }
    if (etat === "fele") {
      for (let i = 0; i < 4; i++) c.boite(0.015, h * c.entre(0.2, 0.5), 0.01, 0x2c2a28, { x: c.entre(-l / 3, l / 3), y: y0 + h * c.entre(0.3, 0.7), z: 0.05, rz: c.entre(-0.9, 0.9) }, m.mat, { crasse: false });
    }
    // le cadre doré et sa crête
    for (const s of [-1, 1]) c.boite(0.12, h + 0.24, 0.1, COUL.dore, { x: s * (l / 2 + 0.06), y: y0 + h / 2, z: 0.05 }, m.metal);
    c.boite(l + 0.36, 0.14, 0.1, COUL.dore, { y: y0 - 0.05, z: 0.05 }, m.metal);
    c.boite(l + 0.36, 0.16, 0.1, COUL.dore, { y: y0 + h + 0.06, z: 0.05 }, m.metal);
    c.boite(l * 0.5, 0.36, 0.08, COUL.dore, { y: y0 + h + 0.3, z: 0.05 }, m.metal);
    c.poser(BOULE, m.metal, COUL.dore, { y: y0 + h + 0.55, z: 0.05, e: 0.14 });
  });
}

/** Une banquette de velours (foyer). */
function banquette(c, m, x, z, ry, l) {
  c.repere({ x, y: 0.06, z, ry }, () => {
    c.boite(l, 0.38, 0.6, COUL.velours, { y: 0.24 }, m.mat, { nuance: 0.08 });
    c.boite(l, 0.5, 0.14, COUL.velours, { y: 0.6, z: -0.26 }, m.mat, { nuance: 0.08 });
    for (const s of [-1, 1]) c.boite(0.08, 0.1, 0.5, COUL.dore, { x: s * (l / 2 - 0.1), y: 0.03 }, m.metal);
  });
}

// ---------- Carte « facade » ----------

function sols1(k) {
  const { c, m } = k;
  // Le hall en damier, le foyer en parquet
  c.pave(-12, 0, ZH, 12, 0.06, FZ, COUL.marbre, m.damier, { crasse: false, nuance: 0 });
  c.pave(-12, 0, ZS - 0.3, 12, 0.06, ZH, 0xc8b08c, m.parquet, { crasse: false, nuance: 0 });
  // Le portique (dallage, trois marches basses)
  c.pave(-9.4, 0, FZ, 9.4, 0.15, 14.4, COUL.pierreOmbre, m.pierre, { crasse: false, nuance: 0 });
  c.pave(-9.8, 0, 14.4, 9.8, 0.1, 15.1, COUL.pierreOmbre, m.pierre, { nuance: 0.02 });
  c.pave(-10.2, 0, 15.1, 10.2, 0.05, 15.8, COUL.pierreOmbre, m.pierre, { nuance: 0.02 });
  // Le parvis pavé, la bordure, la rue
  c.pave(-18, 0, FZ, -9.4, 0.04, 20, 0xb9b3a6, m.pierre, { crasse: false, nuance: 0 });
  c.pave(9.4, 0, FZ, 18, 0.04, 20, 0xb9b3a6, m.pierre, { crasse: false, nuance: 0 });
  c.pave(-9.4, 0, 14.4, 9.4, 0.04, 20, 0xb9b3a6, m.pierre, { crasse: false, nuance: 0 });
  c.pave(-18, 0, 20, 18, 0.12, 20.3, 0xa39f94, m.mat, { nuance: 0.02 });
  c.pave(-18, 0, 20.3, 18, 0.02, 22, 0x6f6d68, m.mat, { crasse: false, nuance: 0 });
  // Le sol tout autour (cour de service, ruelles)
  c.pave(-18, 0, -8, -12, 0.03, FZ, 0x9f9a8c, m.mat, { crasse: false, nuance: 0 });
  c.pave(12, 0, -8, 18, 0.03, FZ, 0x9f9a8c, m.mat, { crasse: false, nuance: 0 });
}

function facade(k) {
  const { c, T, m, usure } = k;
  const pierre = { couleur: COUL.pierre, mat: m.pierre, ep: EP, interieur: { couleur: COUL.mur, mat: m.enduit } };
  const a = [-12, FZ];
  const bb = [12, FZ];
  // Bande basse (0 → 5,2) : trois portes, deux fenêtres de la billetterie et du vestiaire
  const portes = [
    { u: 8.8, l: 2.2, bas: 0, haut: 4.2, type: "vide" },
    { u: 12, l: 2.2, bas: 0, haut: 4.2, type: "vide" },
    { u: 15.2, l: 2.2, bas: 0, haut: 4.2, type: "vide" },
  ];
  const fen = (u, bas, haut, extra = {}) => ({ u, l: 1.8, bas, haut, type: "fenetre", croisillons: 1, traverses: 3, cadre: 0x4a463e, matCadre: m.tole, bris: k.bris, ...extra });
  murCoupe(k, a, bb, { ...pierre, h: 5.2, haut: T, ouvertures: [...portes, fen(2.5, 1.0, 4.4), fen(21.5, 1.0, 4.4)] });
  // Bande haute (5,2 → 13,4) : fenêtres de l'étage (inaccessible)
  mur(T, a, bb, { ...pierre, y0: 5.2, h: 8.2, ouvertures: [fen(2.5, 1.2, 4.2), fen(21.5, 1.2, 4.2), fen(7.5, 1.0, 3.2, { l: 1.6 }), fen(12, 1.0, 3.2, { l: 1.6 }), fen(16.5, 1.0, 3.2, { l: 1.6 })], breches: usure > 0.6 ? [{ u: 20.5, l: 3, profondeur: 1.2 * usure }] : [] });
  // Bandeaux : soubassement à bossages, cordon, corniche, attique
  bandeaux(a, bb, EP, [
    { y1: 0, y2: 0.9, s: 0.08, couleur: COUL.pierreOmbre, mat: m.pierre, ch: c, trous: [[7.7, 16.3], [1.6, 3.4], [20.6, 22.4]] },
    { y1: 5.0, y2: 5.35, s: 0.18, couleur: COUL.pierre, mat: m.pierre, ch: T },
    { y1: 13.0, y2: 13.4, s: 0.55, couleur: COUL.pierre, mat: m.pierre, ch: T },
  ]);
  // Pilastres des travées latérales, encadrements et frontons des fenêtres hautes
  for (const x of [-11.7, -7.4, 7.4, 11.7]) T.pave(x - 0.35, 0.9, FZ + 0.28, x + 0.35, 13.0, FZ + 0.5, COUL.pierre, m.pierre, { nuance: 0.02 });
  for (const x of [-9.5, 9.5]) {
    T.pave(x - 1.15, 9.45, FZ + 0.25, x + 1.15, 9.7, FZ + 0.6, COUL.pierre, m.pierre);
    T.poser(geoTriangle(2.4, 0.6, 0.3), m.pierre, COUL.pierre, { x, y: 9.7, z: FZ + 0.45 });
    T.pave(x - 1.1, 1.0, FZ + 0.25, x + 1.1, 4.6, FZ + 0.38, COUL.pierreOmbre, m.pierre, { nuance: 0.02 });
  }
  // L'attique et sa balustrade
  T.pave(-12, 13.4, FZ - 0.3, 12, 14.2, FZ + 0.3, COUL.pierre, m.pierre);
  for (let x = -11.5; x <= 11.5; x += 0.42) {
    if (Math.abs(x) < 8.6) continue;
    if (usure > 0.5 && c.hasard() < 0.2) continue;
    T.poser(geoCylindre(0.07, 0.11, 0.6, 6), m.mat, COUL.pierre, { x, y: 14.5, z: FZ });
  }
  T.pave(-12, 14.8, FZ - 0.18, -8.6, 14.95, FZ + 0.18, COUL.pierre, m.pierre);
  T.pave(8.6, 14.8, FZ - 0.18, 12, 14.95, FZ + 0.18, COUL.pierre, m.pierre);
  // Les vitrines d'affiches entre les portes et les fenêtres
  for (const [x, r] of [[-5.9, R.holo], [5.9, R.operette]]) {
    c.pave(x - 0.85, 1.05, FZ + 0.3, x + 0.85, 3.65, FZ + 0.38, COUL.dore, m.metal);
    panneau(c, m.affiches, r, { x, y: 2.35, z: FZ + 0.4 }, 1.5, 2.25);
  }
  // Les portes : la centrale ouverte, l'ouest condamnée de planches, l'est vitrée et brisée
  vantail(c, m, -1.1, FZ + 0.2, 1.3, 1.1, 4.1, 0x4a3a2c);
  vantail(c, m, 1.1, FZ + 0.2, Math.PI - 0.15, 1.1, 4.1, 0x4a3a2c);
  c.pave(-4.3, 0.06, FZ - 0.05, -2.1, 4.2, FZ + 0.05, 0x4a3a2c, m.satin);
  for (const [y, r] of [[1.0, 0.12], [2.2, -0.1], [3.3, 0.05]]) c.boite(2.6, 0.22, 0.05, PALETTE.boisGris, { x: -3.2, y, z: FZ + 0.34, rz: r }, m.mat, { nuance: 0.08 });
  k.b.obstacle(-4.3, FZ, -2.1, FZ, "porte condamnée");
  for (const s of [-1, 1]) c.pave(3.2 + s * 1.1 - 0.06, 0.06, FZ - 0.05, 3.2 + s * 1.1 + 0.06, 4.2, FZ + 0.05, COUL.dore, m.metal);
  c.pave(2.1, 2.9, FZ - 0.05, 4.3, 3.0, FZ + 0.05, COUL.dore, m.metal);
  // Les murs est et ouest du hall et du foyer (14 m), coupés côté caméra
  const est = [12, FZ];
  const estB = [12, ZS];
  const fenE = [fen(3.5, 1.0, 4.4), { u: 10.5, l: 1.8, bas: 0, haut: 4.6, type: "vide" }, fen(12.6, 1.0, 4.4)];
  murCoupe(k, est, estB, { ...pierre, h: 5.2, haut: T, ouvertures: fenE });
  mur(T, est, estB, { ...pierre, y0: 5.2, h: 8.2, ouvertures: [fen(3.5, 1.4, 4.2), fen(10.5, 1.4, 4.2)] });
  bandeaux(est, estB, EP, [
    { y1: 0, y2: 0.9, s: 0.08, couleur: COUL.pierreOmbre, mat: m.pierre, ch: c, trous: [[9.5, 11.5]] },
    { y1: 5.0, y2: 5.35, s: 0.18, couleur: COUL.pierre, mat: m.pierre, ch: T },
    { y1: 13.0, y2: 13.4, s: 0.55, couleur: COUL.pierre, mat: m.pierre, ch: T },
  ]);
  T.pave(12 - 0.3, 13.4, ZS, 12 + 0.3, 14.2, FZ, COUL.pierre, m.pierre);
  // la porte-fenêtre brisée du foyer : un battant pend
  c.boite(0.85, 4.2, 0.05, 0x5a5850, { x: 12.5, y: 2.2, z: 1.6, ry: 0.9 }, m.tole);
  const ouest = [-12, ZS];
  const ouestB = [-12, FZ];
  murCoupe(k, ouest, ouestB, { ...pierre, h: 14.2, cut: 6.6, haut: T, ouvertures: [fen(10.5, 1.0, 4.4), fen(10.5, 7.4, 9.6)] });
  bandeaux(ouest, ouestB, EP, [{ y1: 0, y2: 0.9, s: 0.08, couleur: COUL.pierreOmbre, mat: m.pierre, ch: c }]);
  // Lierre et coulures sur les angles
  if (usure > 0.3) {
    lierre(c, 12.35, 0, 9.2, Math.PI / 2, 3, 7 * usure, Math.round(50 * usure));
    lierre(c, -10.6, 0, FZ + 0.32, 0, 2.4, 6 * usure, Math.round(40 * usure));
  }
}

function portique(k) {
  const { c, T, m, usure } = k;
  const xs = [-7.5, -4.5, -1.5, 1.5, 4.5, 7.5];
  for (const x of xs) {
    colonne(c, m, x, 13.4, 0.15, 8.45, 0.42, COUL.pierre);
    k.b.obstacle(x - 0.4, 13.4, x + 0.4, 13.4, "colonne");
    k.b.obstacle(x, 13.0, x, 13.8, "colonne");
  }
  // Entablement : architrave, frise, corniche ; plafond du portique
  T.pave(-8.9, 8.6, 12.8, 8.9, 9.1, 14.0, COUL.pierre, m.pierre);
  T.pave(-8.9, 9.1, 12.9, 8.9, 10.1, 13.9, COUL.pierre, m.pierre);
  T.pave(-9.2, 10.1, 12.6, 9.2, 10.5, 14.3, COUL.pierre, m.pierre);
  T.pave(-8.9, 8.4, FZ + 0.3, 8.9, 8.6, 12.8, COUL.pierreOmbre, m.pierre);
  // Les lettres « THÉÂTRE » : l'É est tombé (il reste sa trace), le R pend de travers
  const lettres = [["T"], ["H"], ["Eacc", "tombe"], ["Acirc"], ["T"], ["Rl", "pend"], ["E"]];
  lettres.forEach(([cle, etat], i) => {
    const x = -4.2 + i * 1.4;
    if (etat === "tombe") {
      T.boite(0.9, 0.95, 0.01, 0xc4b89e, { x, y: 9.6, z: 13.905 }, m.pierre, { crasse: false });
      return;
    }
    if (etat === "pend") panneau(T, m.affiches, R[cle], { x: x + 0.12, y: 9.32, z: 13.96, rz: -0.55 }, 0.95, 1.2);
    else panneau(T, m.affiches, R[cle], { x, y: 9.6, z: 13.94 }, 0.95, 1.2);
  });
  // Le fronton : tympan, rampants, médaillon aux masques, acrotères
  T.poser(geoTriangle(17.6, 3.3, 0.8), m.pierre, COUL.pierre, { y: 10.5, z: 13.4 });
  const pente = Math.atan2(3.3, 8.8);
  for (const s of [-1, 1]) T.boite(9.6, 0.32, 1.1, COUL.pierre, { x: s * 4.4, y: 12.15, z: 13.5, rz: -s * pente }, m.pierre);
  panneau(T, m.affiches, R.masques, { x: 0, y: 11.6, z: 13.82 }, 1.8, 1.8);
  for (const x of [-9, 0, 9]) T.boite(0.7, 0.6, 0.7, COUL.pierre, { x, y: x === 0 ? 14.05 : 10.8, z: 13.4 }, m.pierre);
  // Les banderoles de la dernière représentation, entre les colonnes (l'une déchirée)
  panneau(c, m.affiches, R.holo, { x: -6, y: 6.1, z: 13.42 }, 2.0, 3.0);
  panneau(c, m.affiches, [R.holo[0], R.holo[1], R.holo[2], R.holo[3] * 0.55], { x: 6, y: 6.9, z: 13.42, rz: 0.06 }, 2.0, 1.65);
  for (const x of [-6, 6]) c.tube([x - 1.05, 7.65, 13.42], [x + 1.05, 7.65, 13.42], 0.03, COUL.fonte, m.tole, 4);
  // L'É tombé sur les marches, des éclats de corniche
  panneau(c, m.affiches, R.Eacc, { x: -3.4, y: 0.09, z: 16.6, rx: -Math.PI / 2 + 0.05, rz: 0.5 }, 1.2, 1.5);
  c.boite(0.5, 0.18, 0.4, COUL.pierre, { x: -3.0, y: 0.09, z: 15.9, ry: 0.3 }, m.pierre);
  gravats(c, -1.8, 14.7, 0.9, 6 + Math.round(6 * usure), [COUL.pierre, COUL.pierreOmbre], 0.1);
  debris(c, -8, 11.4, 8, 14.2, 30 * usure, [COUL.pierre, 0xd9d2c0, PALETTE.pierre], 0.15);
  jonchee(c, -8, 11.4, 8, 15, 30, [0x9c7a45, 0x7d6143, 0xe6dcc2, 0xc8362b], 0.16);
  // La lanterne d'un survivant
  c.boite(0.22, 0.04, 0.22, COUL.fonte, { x: 8.6, y: 0.17, z: 12.6 }, m.tole);
  c.boite(0.18, 0.26, 0.18, 0xfff0c8, { x: 8.6, y: 0.32, z: 12.6 }, m.verre, { crasse: false });
  flamme(c, m, 8.6, 0.24, 12.6, 0.9);
  c.boite(0.22, 0.04, 0.22, COUL.fonte, { x: 8.6, y: 0.47, z: 12.6 }, m.tole);
  // un sac de couchage roulé et une caisse près de la lanterne
  c.poser(geoCylindre(0.2, 0.2, 0.8, 7), m.mat, 0x4f5a3f, { x: 8.2, y: 0.35, z: 12.0, rz: Math.PI / 2 });
  c.boite(0.6, 0.4, 0.45, PALETTE.bois, { x: 9.0, y: 0.35, z: 12.0, ry: 0.3 }, m.mat, { nuance: 0.06 });
}

function hall(k) {
  const { c, T, m, usure } = k;
  // Le mur entre le hall et le foyer (face sud dans le hall, face nord dans le foyer)
  const ouv = [6, 12, 18].map((u) => ({ u, l: 2.4, bas: 0, haut: 3.6, type: "vide" }));
  murCoupe(k, [-12, ZH], [12, ZH], { h: 7, cut: CUTI, haut: T, ep: EPI * 1.6, couleur: COUL.mur, mat: m.enduit, ouvertures: ouv, interieur: { couleur: COUL.ivoire, mat: m.enduit } });
  for (const x of [-6, 0, 6]) {
    for (const s of [-1, 1]) {
      c.pave(x + s * 1.2 - 0.12, 0.06, ZH - 0.25, x + s * 1.2 + 0.12, CUTI, ZH + 0.25, COUL.dore, m.metal);
      T.pave(x + s * 1.2 - 0.12, CUTI, ZH - 0.25, x + s * 1.2 + 0.12, 3.75, ZH + 0.25, COUL.dore, m.metal);
    }
    T.pave(x - 1.35, 3.6, ZH - 0.25, x + 1.35, 3.85, ZH + 0.25, COUL.dore, m.metal);
  }
  // Plafonds (couche) : caissons du hall, plafond du foyer
  T.pave(-12, 6.5, ZH, 12, 6.7, FZ, COUL.ivoire, m.enduit);
  T.pave(-12, 7.0, ZS, 12, 7.2, ZH, COUL.ivoire, m.enduit);
  // Deux colonnes de marbre
  for (const x of [-5.2, 5.2]) {
    colonne(c, m, x, 7.6, 0.06, 6.44, 0.32, COUL.marbreRose);
    k.b.obstacle(x - 0.3, 7.6, x + 0.3, 7.6, "colonne");
  }
  // Le tapis rouge de la porte au foyer
  c.pave(-1.1, 0.06, ZH + 0.3, 1.1, 0.075, FZ - 0.3, COUL.moquette, m.mat, { crasse: false, nuance: 0.04 });
  for (let z = ZH + 0.8; z < FZ - 0.3; z += 1.6) for (const s of [-1, 1]) c.boite(0.05, 0.02, 0.5, COUL.laiton, { x: s * 1.1, y: 0.08, z }, m.metal);

  // La billetterie : guérite de bois vert, vitrée, « COMPLET » en travers du guichet
  {
    const x1 = -11.7, x2 = -8.2, z1 = 5.2, z2 = 9.2;
    const vert = 0x2f4a3c;
    c.pave(x1, 0.06, z2 - 0.08, x2, 1.1, z2, vert, m.satin);
    c.pave(x2 - 0.08, 0.06, z1, x2, 1.1, z2, vert, m.satin);
    c.pave(x1, 0.06, z1, x1 + 1.6, 1.1, z1 + 0.08, vert, m.satin);
    for (const z of [z1, z1 + 1.33, z1 + 2.66, z2]) c.pave(x2 - 0.08, 1.1, z - 0.04, x2, 2.5, z + 0.04, vert, m.satin);
    for (const x of [x1 + 1.75, x2]) c.pave(x - 0.04, 1.1, z2 - 0.08, x + 0.04, 2.5, z2, vert, m.satin);
    c.boite(0.02, 1.3, 3.9, 0xffffff, { x: x2 - 0.04, y: 1.8, z: (z1 + z2) / 2 }, m.verre, { crasse: false });
    c.pave(x1, 2.5, z1, x2 + 0.15, 2.85, z2 + 0.15, vert, m.satin);
    panneau(c, m.affiches, R.billetterie, { x: x2 + 0.17, y: 2.68, z: (z1 + z2) / 2, ry: Math.PI / 2 }, 3.6, 0.42);
    panneau(c, m.affiches, R.complet, { x: x2 + 0.03, y: 1.75, z: 7.2, ry: Math.PI / 2, rz: 0.3 }, 1.3, 0.8);
    c.pave(x2 - 0.7, 0.06, z1 + 0.2, x2 - 0.1, 0.95, z2 - 0.2, PALETTE.boisSombre, m.satin);
    c.boite(0.4, 0.25, 0.35, 0x5a5850, { x: x2 - 0.4, y: 1.08, z: 7.0 }, m.tole);
    c.boite(0.04, 0.3, 0.04, 0x4a4840, { x: x2 - 0.5, y: 1.2, z: 8.0 }, m.metal);
    c.poser(geoCylindre(0.18, 0.18, 0.5, 6), m.mat, 0x4a3a2c, { x: x1 + 1.3, y: 0.31, z: 7.6 });
    jonchee(c, x2 - 0.2, 5.4, x2 + 2.4, 9.8, 30, [0xe9dfc6, 0xd9cfb6, 0xc8362b, 0xe6dcc2], 0.065);
    k.b.obstacle(x1, z2, x2, z2, "guérite");
    k.b.obstacle(x2, z1, x2, z2, "guérite");
    k.b.obstacle(x1, z1, x1 + 1.6, z1, "guérite");
  }
  // La borne de billets à reconnaissance faciale (éteinte)
  {
    c.boite(0.55, 1.5, 0.4, 0xdedbd2, { x: -6.5, y: 0.81, z: 9.7 }, m.lisse);
    c.boite(0.42, 0.55, 0.02, 0x1a2a30, { x: -6.5, y: 1.25, z: 9.49 }, m.lisse, { crasse: false });
    c.poser(BOULE, m.lisse, 0x111111, { x: -6.5, y: 1.66, z: 9.5, e: 0.05 });
    c.boite(0.55, 0.12, 0.42, 0x2f6f73, { x: -6.5, y: 1.62, z: 9.7 }, m.satin);
    c.boite(0.18, 0.02, 0.1, 0xe9dfc6, { x: -6.4, y: 0.08, z: 9.2, ry: 0.4 }, m.mat, { crasse: false });
  }
  // Le vestiaire : comptoir de marbre, portants chargés de manteaux
  {
    c.pave(7.9, 0.06, 5.0, 8.5, 1.0, 10.2, PALETTE.boisSombre, m.satin);
    c.pave(7.8, 1.0, 4.9, 8.6, 1.08, 10.3, COUL.marbre, m.lisse);
    k.b.obstacle(8.2, 5.0, 8.2, 10.2, "comptoir");
    const tons = [0x3b3a40, 0x5a4a3c, 0x7a6a50, 0x2f3a4a, 0x6a3a3a, 0x8a8070, 0x3f4f3f];
    for (const x of [10.2, 11.2]) {
      c.tube([x, 1.85, 5.2], [x, 1.85, 10.2], 0.025, COUL.laiton, m.metal, 5);
      for (const z of [5.2, 10.2]) c.tube([x, 0.06, z], [x, 1.85, z], 0.03, COUL.laiton, m.metal, 5);
      for (let z = 5.45; z < 10.1; z += 0.32) {
        if (c.hasard() < 0.25 * usure) continue;
        c.boite(0.5, c.entre(0.9, 1.25), 0.1, tons[Math.floor(c.hasard() * tons.length)], { x, y: 1.25, z, ry: Math.PI / 2 + c.entre(-0.2, 0.2), rz: c.entre(-0.05, 0.05) }, m.mat, { nuance: 0.08, crasse: false });
      }
    }
    for (let i = 0; i < 4; i++) c.boite(0.6, 0.08, 1.0, tons[i], { x: c.entre(8.9, 11.6), y: 0.1, z: c.entre(5.4, 10), ry: c.hasard() * 3 }, m.mat, { nuance: 0.08 });
    c.tube([9, 0.08, 10.4], [9.8, 0.12, 9.4], 0.03, 0x2a2826, m.tole, 5);
  }
  // L'écran holographique du hall, qui luit encore la nuit
  c.pave(2.2, 1.1, ZH + 0.16, 3.8, 3.7, ZH + 0.26, 0x2a2a2c, m.lisse);
  panneau(c, m.ecran, R.holo, { x: 3, y: 2.4, z: ZH + 0.28 }, 1.5, 2.25);
  panneau(c, m.affiches, R.watty, { x: -3, y: 2.0, z: ZH + 0.18 }, 1.2, 1.05);
  // Poteaux à cordon devant le foyer, un sofa, des gravats
  const pts = [[-2.2, 5.0], [-0.8, 5.0], [0.8, 5.0], [2.2, 5.0]];
  pts.forEach(([x, z], i) => poteau(c, m, x, z, i === 2, 0.7));
  cordon(c, m, pts[0], pts[1]);
  banquette(c, m, -10, 10.4, Math.PI, 2.4);
  gravats(c, 6.8, 6.4, 1.0, 8 + Math.round(10 * usure), [COUL.ivoire, COUL.mur, COUL.dore]);
  debris(c, -11, 4.5, 11, 10.6, 50 * usure);
  jonchee(c, -6, 4.5, 6, 10.5, 30, [0xe9dfc6, 0xc8362b, 0x2f6f73, 0x9c7a45], 0.065);
  flaque(c, 5.4, 9.6, 0.9, 0.07);
}

function foyer(k) {
  const { c, T, m, usure } = k;
  // Le mur de la salle (fond du foyer) : trois portes capitonnées
  const ouv = [6, 12, 18].map((u) => ({ u, l: 2.4, bas: 0, haut: 3.6, type: "vide" }));
  murCoupe(k, [-12, ZS], [12, ZS], { h: 7.2, ep: EP, couleur: COUL.ivoire, mat: m.enduit, ouvertures: ouv });
  for (const x of [-6, 0, 6]) {
    c.pave(x - 1.35, 3.6, ZS + 0.3, x + 1.35, 3.9, ZS + 0.4, COUL.dore, m.metal);
    for (const s of [-1, 1]) c.pave(x + s * 1.2 - 0.1, 0.06, ZS + 0.3, x + s * 1.2 + 0.1, 3.6, ZS + 0.4, COUL.dore, m.metal);
  }
  vantail(c, m, -1.2, ZS + 0.3, 0.9, 1.2, 3.5, COUL.velours, true);
  vantail(c, m, 4.8, ZS + 0.3, 0.2, 1.2, 3.5, COUL.velours, true);
  vantail(c, m, 7.2, ZS + 0.3, Math.PI - 0.15, 1.2, 3.5, COUL.velours, true);
  vantail(c, m, -7.2, ZS + 0.3, Math.PI - 1.2, 1.2, 3.5, COUL.velours, true);
  // Les miroirs entre les portes, les pilastres dorés
  miroir(c, m, -9.3, ZS + 0.32, 0, 1.6, 4.2, "fele");
  miroir(c, m, -3, ZS + 0.32, 0, 1.6, 4.2, "fele");
  miroir(c, m, 3, ZS + 0.32, 0, 1.6, 4.2, usure > 0.4 ? "brise" : "fele");
  miroir(c, m, 9.3, ZS + 0.32, 0, 1.6, 4.2, "fele");
  for (const x of [-10.9, -7.7, -4.3, -1.7, 1.7, 4.3, 7.7, 10.9]) {
    c.pave(x - 0.2, 0.06, ZS + 0.3, x + 0.2, 6.4, ZS + 0.45, COUL.ivoire, m.enduit, { nuance: 0.02 });
    c.pave(x - 0.26, 6.0, ZS + 0.3, x + 0.26, 6.4, ZS + 0.52, COUL.dore, m.metal);
  }
  c.pave(-12, 6.4, ZS + 0.3, 12, 6.7, ZS + 0.6, COUL.dore, m.metal);
  // les éclats du miroir brisé
  if (usure > 0.4) debris(c, 2, ZS + 0.5, 4, ZS + 1.6, 20, [COUL.miroir, 0xdfe6e8], 0.06);
  // Banquettes de velours sous les miroirs
  for (const x of [-9.3, -3, 3, 9.3]) banquette(c, m, x, ZS + 1.0, 0, 2.4);
  // La cheminée de marbre et le feu des survivants
  {
    const x = -12 + EP / 2;
    const z = 0.5;
    c.pave(x, 0.06, z - 1.25, x + 0.55, 1.25, z - 0.9, COUL.marbre, m.lisse);
    c.pave(x, 0.06, z + 0.9, x + 0.55, 1.25, z + 1.25, COUL.marbre, m.lisse);
    c.pave(x, 1.25, z - 1.4, x + 0.7, 1.42, z + 1.4, COUL.marbre, m.lisse);
    c.pave(x, 0.06, z - 0.9, x + 0.2, 1.25, z + 0.9, PALETTE.suie, m.mat);
    c.pave(x, 0.06, z - 1.4, x + 1.1, 0.1, z + 1.4, COUL.marbre, m.lisse);
    k.b.obstacle(x + 0.6, z - 1.3, x + 0.6, z + 1.3, "cheminée");
    // les bûches (des pieds de fauteuils) et les flammes
    c.tube([x + 0.3, 0.16, z - 0.5], [x + 0.45, 0.2, z + 0.5], 0.08, 0x4a3426, m.mat, 5);
    c.tube([x + 0.4, 0.16, z - 0.4], [x + 0.25, 0.24, z + 0.45], 0.07, 0x3a2a20, m.mat, 5);
    c.boite(0.5, 0.08, 0.12, COUL.dore, { x: x + 0.5, y: 0.25, z: z + 0.1, ry: 0.6 }, m.metal);
    for (const [dx, dz, s] of [[0.35, 0, 3.4], [0.32, -0.3, 2.4], [0.4, 0.3, 2.6], [0.28, 0.15, 2]]) flamme(c, m, x + dx, 0.2, z + dz, s);
    // le trumeau au-dessus
    miroir(c, m, x + 0.05, z, Math.PI / 2, 1.5, 1.6, "fele");
    // le campement : matelas, couvertures, marmite, bois débité
    c.boite(0.9, 0.16, 1.9, 0x8a7a64, { x: -9.4, y: 0.14, z: -0.8, ry: 0.15 }, m.mat, { nuance: 0.06 });
    c.boite(0.8, 0.06, 1.2, 0x5a6a50, { x: -9.4, y: 0.25, z: -0.6, ry: 0.25 }, m.mat, { nuance: 0.06 });
    c.boite(0.9, 0.16, 1.9, 0x7a5a4a, { x: -9.2, y: 0.14, z: 2.1, ry: -0.2 }, m.mat, { nuance: 0.06 });
    c.poser(geoCylindre(0.2, 0.2, 0.7, 7), m.mat, 0x8a3038, { x: -8.6, y: 0.26, z: 1.2, rz: Math.PI / 2, ry: 0.4 });
    for (const s of [0, 1, 2]) {
      const an = (s / 3) * Math.PI * 2;
      c.tube([-10.4 + Math.cos(an) * 0.35, 0.06, 0.5 + Math.sin(an) * 0.35], [-10.4, 1.0, 0.5], 0.02, COUL.fonte, m.tole, 4);
    }
    c.poser(geoCylindre(0.2, 0.16, 0.25, 8), m.tole, 0x3a3836, { x: -10.4, y: 0.6, z: 0.5 });
    for (let i = 0; i < 7; i++) c.boite(c.entre(0.5, 0.9), 0.08, 0.08, i % 3 ? 0x6a4a34 : COUL.dore, { x: c.entre(-10.8, -10.0), y: 0.1 + i * 0.05, z: c.entre(2.6, 3.4), ry: c.hasard() * 3 }, i % 3 ? m.mat : m.metal);
    c.boite(0.5, 0.06, 0.5, COUL.velours, { x: -10.2, y: 0.1, z: 3.2, ry: 0.4 }, m.mat);
  }
  // La buvette : comptoir de zinc, étagère aux bouteilles, tabourets
  {
    c.pave(8.9, 0.06, -1.8, 9.5, 1.05, 2.8, PALETTE.boisSombre, m.satin);
    c.pave(8.8, 1.05, -1.9, 9.65, 1.12, 2.9, COUL.zinc, m.tole);
    k.b.obstacle(9.2, -1.8, 9.2, 2.8, "comptoir");
    for (const y of [1.0, 1.6, 2.2]) c.pave(11.3, y, -1.6, 11.7, y + 0.05, 2.6, PALETTE.boisSombre, m.satin);
    for (let i = 0; i < 26; i++) {
      if (c.hasard() < 0.45 * usure) continue;
      const y = [1.05, 1.65, 2.25][i % 3];
      c.poser(geoCylindre(0.04, 0.045, 0.3, 5), m.verre, [0x3a5a3a, 0x6a4a2a, 0x2a3a4a][i % 3], { x: 11.5, y: y + 0.15, z: -1.4 + Math.floor(i / 3) * 0.5 + c.entre(-0.1, 0.1) }, { crasse: false });
    }
    for (const [z, renv] of [[-1, false], [0.4, true], [1.8, false]]) {
      c.repere({ x: 8.4, y: 0, z, rz: renv ? 1.4 : 0 }, () => {
        c.tube([0, 0.06, 0], [0, 0.75, 0], 0.03, COUL.laiton, m.metal, 5);
        c.poser(geoCylindre(0.18, 0.18, 0.08, 8), m.mat, COUL.velours, { y: 0.78 });
      });
    }
    debris(c, 9.8, -1.5, 11.2, 2.6, 18, [0x3a5a3a, 0x6a4a2a, 0xdfe6e8], 0.06);
  }
  // Les lustres du foyer (l'un penché sur sa chaîne)
  lustre(c, m, -5, 4.6, 0.5, 0.8, { manque: 0.3 * usure });
  lustre(c, m, 5, 4.3, 0.5, 0.8, { rz: 0.18, manque: 0.5 * usure });
  for (const [x, y] of [[-5, 5.8], [5.1, 5.5]]) T.tube([x, y, 0.5], [x, 7.0, 0.5], 0.03, COUL.laiton, m.metal, 4);
  // Le temps : plâtre tombé, papiers, flaque sous une fuite
  gravats(c, 1.2, 1.4, 1.1, 8 + Math.round(10 * usure), [COUL.ivoire, COUL.mur, COUL.dore]);
  debris(c, -11, ZS + 0.6, 11, ZH - 0.4, 60 * usure);
  jonchee(c, -6, -1, 8, 3.6, 25, [0xe9dfc6, 0x9c7a45, 0x7d6143], 0.065);
  if (usure > 0.4) flaque(c, 6.5, 2.4, 1.2, 0.07);
  raiDeLumiere(c, [14, 5.2, 0.5], [7.5, 0.06, 0.2], 1.6);
}

function parvis(k) {
  const { c, m, usure } = k;
  // La colonne d'affiches : affiches enroulées, dôme de fonte
  {
    const x = 11.6, z = 17.4;
    c.poser(geoCylindre(0.72, 0.78, 0.3, 12), m.tole, 0x3f5a48, { x, y: 0.15, z });
    const g = new THREE.CylinderGeometry(0.66, 0.66, 2.6, 12, 1, true);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      const u = (uv.getX(i) * 2) % 1 || (uv.getX(i) > 0.5 ? 1 : 0);
      const r = uv.getX(i) < 0.5 ? R.holo : R.operette;
      uv.setXY(i, (r[0] + u * r[2]) / AL, 1 - (r[1] + (1 - uv.getY(i)) * r[3]) / AH);
    }
    c.poser(g, m.affiches, 0xffffff, { x, y: 1.6, z }, { crasse: false, nuance: 0 });
    g.dispose();
    c.poser(geoCylindre(0.78, 0.7, 0.25, 12), m.tole, 0x3f5a48, { x, y: 3.0, z });
    c.poser(new THREE.SphereGeometry(0.72, 12, 4, 0, Math.PI * 2, 0, Math.PI / 2), m.tole, 0x3f5a48, { x, y: 3.12, z, e: [1, 0.6, 1] });
    c.poser(BOULE, m.tole, 0x3f5a48, { x, y: 3.6, z, e: 0.12 });
    k.b.obstacle(x - 0.7, z, x + 0.7, z, "colonne d'affiches");
    k.b.obstacle(x, z - 0.7, x, z + 0.7, "colonne d'affiches");
  }
  // Les réverbères (l'un tordu)
  for (const [x, z, tordu] of [[-9.6, 18.8, false], [14.8, 14.6, true]]) {
    c.repere({ x, y: 0, z, rz: tordu ? 0.22 : 0, rx: tordu ? 0.1 : 0 }, () => {
      c.poser(geoCylindre(0.16, 0.22, 0.7, 8), m.tole, COUL.fonte, { y: 0.35 });
      c.tube([0, 0.7, 0], [0, 4.2, 0], 0.07, COUL.fonte, m.tole, 6);
      c.boite(0.36, 0.5, 0.36, 0xfff0c8, { y: 4.45 }, m.verre, { crasse: false });
      c.poser(CONE, m.tole, COUL.fonte, { y: 4.7, e: [0.32, 0.3, 0.32] });
    });
  }
  // Les poteaux à cordon de la première, renversés en partie
  const pts = [[-7, 16.6], [-5, 16.8], [-3, 16.7], [3, 16.8], [5, 16.6], [7, 16.7]];
  pts.forEach(([x, z], i) => poteau(c, m, x, z, i === 1 || i === 4, i * 0.7));
  cordon(c, m, pts[2], [-1.5, 17.5]);
  cordon(c, m, pts[5], [6.6, 17.8]);
  // Une voiture de l'Abondance abandonnée le long du trottoir (taxi autonome mort)
  {
    const x = -12.5, z = 21.1;
    c.repere({ x, y: 0, z, ry: 0.03 }, () => {
      c.boite(4.2, 0.6, 1.8, 0xd9d6ce, { y: 0.55 }, m.satin, { nuance: 0.03 });
      c.boite(2.6, 0.55, 1.6, 0xd9d6ce, { x: -0.2, y: 1.12 }, m.satin);
      c.boite(2.5, 0.45, 1.62, 0x2a3438, { x: -0.2, y: 1.12 }, m.lisse);
      c.boite(0.5, 0.18, 0.5, 0x2f6f73, { x: -0.2, y: 1.5 }, m.satin);
      for (const [dx, dz] of [[-1.4, -0.82], [1.4, -0.82], [-1.4, 0.82], [1.4, 0.82]]) c.poser(geoCylindre(0.34, 0.34, 0.24, 8), m.mat, 0x2a2826, { x: dx, y: 0.3, z: dz, rx: Math.PI / 2 });
    });
    k.b.obstacle(x - 2.1, z - 0.9, x + 2.1, z - 0.9, "voiture");
  }
  // Végétation : un arbre poussé dans les pavés, herbes dans les joints, lierre sur la colonne
  arbre(c, -15.2, 15.8, 6.5, "feuillu");
  arbuste(c, 15.6, 18.6, 1.2);
  arbuste(c, -14.6, 12.4, 1.0);
  semerTouffes(c, -17, 11.5, 17, 19.8, 60 * usure, PALETTE.herbeSeche, 0.04);
  semerTouffes(c, -9.8, 14.4, 9.8, 15.8, 16 * usure, PALETTE.herbeSeche, 0.1);
  mousse(c, -4, 0.15, 13, 1.2, 4);
  jonchee(c, -17, 15, 17, 20, 50, [0x9c7a45, 0x7d6143, 0xb08f55, 0xe9dfc6, 0xc8362b], 0.05);
  debris(c, -17, 15, 17, 19.8, 30);
  gravats(c, 11.2, 13.6, 0.8, 10, [COUL.pierre, COUL.pierreOmbre]);
}

/** La masse de la salle et de la cage de scène derrière le foyer : la silhouette du théâtre (sans intérieur). */
function arriere1(k) {
  const { c, T, m } = k;
  // Toit de l'avant-corps (ardoise) au-dessus du hall et du foyer
  toitDeuxPans(T, 0, 4, 24.6, 14.6, 14.2, 3.2, { couleur: PALETTE.ardoise, mat: m.ardoise, debord: 0.3, trous: k.usure > 0.5 ? [{ u: 6, v: -1, l: 3, p: 0.7 }] : [] });
  // La salle : murs de pierre de 16 m, pilastres, corniche, toit de cuivre vert-de-gris
  const ext = COUL.pierre;
  c.pave(-12.3, 7.2, ZS - 0.3, 12.3, 16, ZS + 0.3, ext, m.pierre);
  c.pave(-12.3, 0, ZP, -11.7, 16, ZS, ext, m.pierre);
  c.pave(11.7, 0, ZP, 12.3, 16, ZS, ext, m.pierre);
  for (let z = ZS - 2.5; z > ZP; z -= 5) for (const s of [-1, 1]) c.pave(s * 12.3 - 0.2, 0, z - 0.4, s * 12.3 + 0.2, 15.6, z + 0.4, COUL.pierreOmbre, m.pierre);
  for (const s of [-1, 1]) c.pave(s * 12 - 0.6, 15.6, ZP, s * 12 + 0.6, 16.1, ZS, ext, m.pierre);
  toitDeuxPans(c, 0, -13, 20.6, 24.6, 16, 4.6, { ry: Math.PI / 2, couleur: COUL.cuivre, mat: m.tole, debord: 0.3 });
  // La cage de scène, plus haute, et les ailes basses des loges et de l'atelier
  c.pave(-XC, 0, ZN, XC, 22, ZP, COUL.mur, m.pierre);
  toitDeuxPans(c, 0, (ZN + ZP) / 2, 30.4, 13.4, 22, 2.4, { couleur: PALETTE.ardoise, mat: m.ardoise, debord: 0.3 });
  c.pave(-21, 0, ZN, -XC, 4.8, -20, COUL.mur, m.pierre);
  c.pave(XC, 0, ZN, 23, 7, -24, COUL.mur, m.pierre);
}

// ---------- Carte « salle » ----------

/** Un point du fer à cheval de rayon r, au paramètre q (0 → 1 : bras ouest ; 1 → 1+π : demi-cercle ; puis bras est). */
function fer(r, q) {
  if (q <= 1) return { x: -r, z: ZF + q * (ZC - ZF), nx: 1, nz: 0 };
  if (q <= 1 + Math.PI) {
    const phi = Math.PI - (q - 1);
    return { x: r * Math.cos(phi), z: ZC + r * Math.sin(phi), nx: -Math.cos(phi), nz: -Math.sin(phi) };
  }
  const t = q - 1 - Math.PI;
  return { x: r, z: ZC - t * (ZC - ZF), nx: -1, nz: 0 };
}

/** Les segments du fer à cheval : [q0, q1]. */
function segmentsFer() {
  const s = [];
  const nb = 6;
  const nc = 18;
  for (let i = 0; i < nb; i++) s.push([i / nb, (i + 1) / nb]);
  for (let i = 0; i < nc; i++) s.push([1 + (i * Math.PI) / nc, 1 + ((i + 1) * Math.PI) / nc]);
  for (let i = 0; i < nb; i++) s.push([1 + Math.PI + i / nb, 1 + Math.PI + (i + 1) / nb]);
  return s;
}

const Q_FOND = 1 + Math.PI * 0.18; // en deçà : balcons du fond (côté ouest), qui ne cachent pas le parterre

function sols2(k) {
  const { c, m } = k;
  // Le parterre, les promenoirs, un bout du foyer
  c.pave(-XS, 0, -19.55, XS, 0.06, ZS, 0xd4b896, m.parquet, { crasse: false, nuance: 0 });
  c.pave(-XS, 0, ZS, XS, 0.06, -0.4, 0xc8b08c, m.parquet, { crasse: false, nuance: 0 });
  c.pave(-XS, 0, -21.8, -6.4, 0.06, -19.55, 0xb89c78, m.parquet, { crasse: false, nuance: 0 });
  c.pave(6.4, 0, -21.8, XS, 0.06, -19.55, 0xb89c78, m.parquet, { crasse: false, nuance: 0 });
  // La moquette des allées
  c.pave(-0.7, 0.06, -19.3, 0.7, 0.07, -3.6, COUL.moquette, m.mat, { crasse: false, nuance: 0.03 });
  // La scène (et l'avant-scène), les coulisses : plancher à 15 cm
  c.pave(-XC, 0, ZN, XC, SCENE, -22.6, 0x9a8466, m.parquet, { crasse: false, nuance: 0 });
  c.pave(-9, 0, -22.6, 9, SCENE, -21.8, 0x9a8466, m.parquet, { crasse: false, nuance: 0 });
  // Les loges (plancher) et leur couloir, l'atelier (béton)
  c.pave(-21, 0, ZN, -XC, SCENE, -20, 0xa48a6a, m.parquet, { crasse: false, nuance: 0 });
  c.pave(XC, 0, ZN, 23, 0.1, -24, 0x9a978e, m.mat, { crasse: false, nuance: 0 });
  // Dehors : cour de service, trottoirs
  c.pave(-22, 0, -37.5, 24, 0.03, ZN, 0x8f8c84, m.mat, { crasse: false, nuance: 0 });
  c.pave(-22, 0, ZN, -21, 0.03, 0.5, 0x8f8c84, m.mat, { crasse: false, nuance: 0 });
  c.pave(-21, 0, -20, -XS, 0.03, 0.5, 0x8f8c84, m.mat, { crasse: false, nuance: 0 });
  c.pave(XS, 0, -24, 24, 0.03, 0.5, 0x8f8c84, m.mat, { crasse: false, nuance: 0 });
  c.pave(23, 0, ZN, 24, 0.03, -24, 0x8f8c84, m.mat, { crasse: false, nuance: 0 });
}

function mursSalle(k) {
  const { c, T, K, m, usure } = k;
  const salle = { ep: EP, couleur: COUL.mur, mat: m.enduit, interieur: { couleur: COUL.enduitSalle, mat: m.enduit } };
  // Mur sud (vers le foyer) : trois portes capitonnées
  const portes = [6, 12, 18].map((u) => ({ u, l: 2.4, bas: 0, haut: 3.6, type: "vide" }));
  murCoupe(k, [-XS, ZS], [XS, ZS], { ...salle, h: 16, haut: T, ouvertures: portes, couleur: COUL.ivoire, interieur: { couleur: COUL.veloursSombre, mat: m.enduit } });
  vantail(c, m, -1.2, ZS - 0.3, -0.9, 1.2, 3.5, COUL.velours, true);
  vantail(c, m, 4.8, ZS - 0.3, -0.25, 1.2, 3.5, COUL.velours, true);
  vantail(c, m, -7.2, ZS - 0.3, Math.PI + 1.0, 1.2, 3.5, COUL.velours, true);
  // Mur est (coupé), mur ouest (fond)
  murCoupe(k, [XS, ZS], [XS, ZP], { ...salle, h: 16, haut: T, breches: usure > 0.5 ? [{ u: 9, l: 4, profondeur: 3 * usure }] : [] });
  murCoupe(k, [-XS, ZP], [-XS, ZS], { ...salle, h: 16, cut: 3.4, haut: T });
  // Le cadre de scène : mur de 22 m, ouverture de 14 m, deux passages vers les coulisses
  const cadre = [
    { u: 15, l: 14, bas: 0, haut: 10, type: "vide" },
    { u: 5, l: 1.2, bas: 0, haut: 2.4, type: "vide" },
    { u: 25, l: 1.2, bas: 0, haut: 2.4, type: "vide" },
  ];
  murCoupe(k, [-XC, ZP], [XC, ZP], { ep: 0.8, couleur: COUL.mur, mat: m.enduit, h: 22, haut: K, ouvertures: cadre, interieur: { couleur: 0x4a4440, mat: m.enduit } });
  // Le manteau d'Arlequin et le cadre doré
  for (const s of [-1, 1]) {
    c.pave(s * 7 - 0.3, SCENE, ZP + 0.4, s * 7 + 0.3, CUT, ZP + 0.6, COUL.dore, m.metal);
    K.pave(s * 7 - 0.3, CUT, ZP + 0.4, s * 7 + 0.3, 10.4, ZP + 0.6, COUL.dore, m.metal);
    K.pave(s * 7.6 - 0.4, CUT, ZP + 0.4, s * 7.6 + 0.4, 11.2, ZP + 0.5, COUL.ivoire, m.enduit);
  }
  K.pave(-7.6, 10.0, ZP + 0.4, 7.6, 11.2, ZP + 0.62, COUL.dore, m.metal);
  for (let i = 0; i < 4; i++) panneau(K, m.affiches, R.ornement, { x: -5.4 + i * 3.6, y: 10.6, z: ZP + 0.64 }, 3.5, 0.8);
  K.pave(-7, 8.6, ZP + 0.2, 7, 10.0, ZP + 0.4, COUL.velours, m.toile, { nuance: 0.05 });
  for (let x = -6.6; x < 7; x += 0.9) K.boite(0.9, 0.5, 0.06, COUL.velours, { x, y: 8.4, z: ZP + 0.32, rz: c.entre(-0.06, 0.06) }, m.toile, { nuance: 0.08 });
  // Le rideau rouge en lambeaux (couche des cintres : il cache la scène vue du parterre)
  for (let x = -6.8; x < 6.9; x += 0.46) {
    const releve = x < -4.6;
    if (!releve && c.hasard() < 0.18 + 0.25 * usure) continue;
    const bas = releve ? 0.6 : c.hasard() < 0.4 ? c.entre(0.2, 0.8) : c.entre(1.5, 6.5);
    const h = 8.6 - bas;
    const ep = releve ? 0.22 : 0.06;
    K.boite(0.48, h, ep, COUL.rideau, { x: releve ? -5.9 + (x + 6.8) * 0.3 : x, y: bas + h / 2, z: ZP - 0.25 + (Math.round(x * 2) % 2) * 0.07, rz: releve ? 0.04 : c.entre(-0.02, 0.02), rx: c.entre(-0.03, 0.03) }, m.toile, { nuance: 0.1, crasse: false });
  }
  // L'embrasse dorée du rideau releve
  K.tube([-6.2, 2.5, ZP - 0.4], [-4.9, 2.4, ZP - 0.4], 0.05, COUL.dore, m.metal, 5);
  // Les lés tombés sur l'avant-scène
  for (const [x, z, r] of [[-2.6, -24.3, 0.3], [-1.0, -24.9, -0.5], [1.4, -24.1, 0.9]]) c.boite(c.entre(1.4, 2.2), 0.12, c.entre(0.8, 1.3), 0x8c2a30, { x, y: SCENE + 0.07, z, ry: r, rx: c.entre(-0.08, 0.08) }, m.toile, { nuance: 0.1 });
  // SORTIE au-dessus des passages vers les coulisses
  for (const s of [-1, 1]) panneau(c, m.ecran, R.sortie, { x: s * 10, y: 2.75, z: ZP + 0.42 }, 0.8, 0.4);
  // Le plafond peint, crevé : fresque circulaire (face vers le bas), rives plates, chaîne du lustre
  {
    const pts = [];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      pts.push(new THREE.Vector2(Math.cos(a) * RB, Math.sin(a) * RB));
    }
    const forme = new THREE.Shape(pts);
    const trou = [];
    for (let i = 0; i < 9; i++) {
      const a = -(i / 9) * Math.PI * 2;
      const r = 2.2 * (0.7 + 0.45 * ((i * 7) % 5) / 4);
      trou.push(new THREE.Vector2(3.2 + Math.cos(a) * r, 1.0 + Math.sin(a) * r * 0.8));
    }
    forme.holes.push(new THREE.Path(trou));
    const g = new THREE.ShapeGeometry(forme);
    const uv = g.attributes.uv;
    const pos = g.attributes.position;
    const [px, py, pw, ph] = R.fresque;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + (pos.getX(i) / RB / 2 + 0.5) * pw) / AL, 1 - (py + (pos.getY(i) / RB / 2 + 0.5) * ph) / AH);
    g.rotateX(Math.PI / 2);
    T.poser(g, m.affiches, 0xffffff, { x: 0, y: HPLAF, z: ZC }, { crasse: false, nuance: 0 });
    g.dispose();
    // le plafond plat autour, avec la brèche
    const y1 = HPLAF + 0.02;
    T.pave(-XS, y1, ZP, 1, y1 + 0.3, ZS, COUL.ivoire, m.enduit);
    T.pave(6, y1, ZP, XS, y1 + 0.3, ZS, COUL.ivoire, m.enduit);
    T.pave(1, y1, ZP, 6, y1 + 0.3, -14.4, COUL.ivoire, m.enduit);
    T.pave(1, y1, -9.4, 6, y1 + 0.3, ZS, COUL.ivoire, m.enduit);
    T.tube([0, HPLAF, ZC], [0.2, 9.8, ZC], 0.04, COUL.laiton, m.metal, 4);
    // la corniche dorée du plafond
    for (const [q0, q1] of segmentsFer()) {
      const a = fer(RB, q0);
      const b = fer(RB, q1);
      T.poutre([a.x, HPLAF - 0.1, a.z], [b.x, HPLAF - 0.1, b.z], 0.22, COUL.dore, m.metal);
    }
  }
  // Le toit de cuivre, éventré au-dessus du parterre ; le rai de lumière qui tombe sur le lustre
  toitDeuxPans(T, 0, -13, 20.6, 24.6, 16, 4.6, { ry: Math.PI / 2, couleur: COUL.cuivre, mat: m.tole, debord: 0.3, trous: [{ u: -1.6, v: 1, l: 5.2, p: 0.8 }] });
  raiDeLumiere(c, [4.6, 16.5, -11.3], [1.3, 0.06, -12.9], 2.4);
  T.poser(geoTriangle(24.6, 4.6, 0.6), m.enduit, COUL.mur, { y: 16, z: ZS });
  T.pave(-XS - 0.3, 15.6, ZS - 0.3, XS + 0.3, 16.1, ZS + 0.7, 0xcfc4ac, m.enduit);
  T.pave(XS - 0.3, 15.6, ZP, XS + 0.7, 16.1, ZS, 0xcfc4ac, m.enduit);
  for (let z = ZS - 2; z > ZP; z -= 4.5) T.pave(XS + 0.3, CUT, z - 0.4, XS + 0.55, 15.6, z + 0.4, 0xcfc4ac, m.enduit);
  for (const x of [-9, -3, 3, 9]) T.pave(x - 0.4, CUT, ZS + 0.3, x + 0.4, 15.6, ZS + 0.55, 0xcfc4ac, m.enduit);
  // l'affiche peinte de l'opérette, délavée, sur le mur est
  panneau(T, m.affiches, R.operette, { x: XS + 0.58, y: 8.6, z: -12.6, ry: Math.PI / 2, teinte: 0xcfc6b4 }, 4.6, 6.9);
  // Le coin sud-ouest : l'escalier des balcons, effondré
  {
    const x1 = -11.6, x2 = -9.2;
    for (let i = 0; i < 9; i++) {
      const z = ZS - 0.5 - i * 0.45;
      const y = 0.06 + (i + 1) * 0.19;
      if (i > 5 && usure > 0.3) {
        c.boite(x2 - x1, 0.08, 0.45, PALETTE.boisGris, { x: (x1 + x2) / 2, y: 0.3 + (i - 5) * 0.2, z: z + 0.4, rx: 0.6, rz: 0.2 }, m.mat, { nuance: 0.06 });
        continue;
      }
      c.pave(x1, 0.06, z - 0.45, x2, y, z, COUL.boisScene, m.mat, { nuance: 0.03 });
    }
    c.tube([x2, 1.0, ZS - 0.5], [x2, 2.2, ZS - 3.2], 0.04, COUL.laiton, m.metal, 5);
    gravats(c, -10.4, ZS - 4.8, 1.2, 10, [COUL.ivoire, COUL.enduitSalle, COUL.dore]);
    k.b.obstacle(x2, ZS - 0.4, x2, ZS - 4.6, "escalier effondré");
    k.b.obstacle(x1, ZS - 4.6, x2, ZS - 4.6, "escalier effondré");
  }
}

function balcons(k) {
  const { c, BA, BF, m, usure } = k;
  const segs = segmentsFer();
  const effondre2 = [1 + Math.PI * 0.52, 1 + Math.PI * 0.68];
  segs.forEach(([q0, q1], i) => {
    const qm = (q0 + q1) / 2;
    const ch = qm < Q_FOND ? BF : BA;
    const f0 = fer(RF, q0), f1 = fer(RF, q1), fm = fer(RF, qm);
    const b0 = fer(RB, q0), b1 = fer(RB, q1), bm = fer(RB, qm);
    const lf = Math.hypot(f1.x - f0.x, f1.z - f0.z);
    const lb = Math.hypot(b1.x - b0.x, b1.z - b0.z);
    const ry = Math.atan2(fm.nx, fm.nz);
    const prof = RB - RF;
    const cx = (fm.x + bm.x) / 2;
    const cz = (fm.z + bm.z) / 2;
    NIVEAUX.forEach((Y, n) => {
      if (n === 1 && qm > effondre2[0] && qm < effondre2[1]) {
        // le pan effondré : il ne reste que le fond et un bout de plancher qui pend
        if (qm - effondre2[0] < 0.2) ch.boite(lb, 0.22, prof * 0.6, COUL.ivoire, { x: bm.x + fm.nx * prof * 0.3, y: Y - 0.5, z: bm.z + fm.nz * prof * 0.3, ry, rx: 0.5 }, m.mat);
        ch.boite(lb, 2.8, 0.18, COUL.veloursSombre, { x: bm.x, y: Y + 1.4, z: bm.z, ry }, m.mat, { nuance: 0.05 });
        return;
      }
      const gap = n === 2 && usure > 0.4 && i > 25 && i < 28;
      if (gap) return;
      // plancher, sous-face dorée, garde-corps ivoire à cartouches, main courante de velours
      ch.boite(lb + 0.04, 0.24, prof, COUL.ivoire, { x: cx, y: Y - 0.12, z: cz, ry }, m.mat, { nuance: 0.02 });
      ch.boite(lf + 0.02, 0.2, 0.18, COUL.dore, { x: fm.x + fm.nx * 0.04, y: Y - 0.32, z: fm.z + fm.nz * 0.04, ry }, m.metal);
      const garde = !(usure > 0.5 && c.hasard() < 0.12 * usure);
      if (garde) {
        ch.boite(lf + 0.02, 0.92, 0.12, COUL.ivoire, { x: fm.x, y: Y + 0.46, z: fm.z, ry }, m.mat, { nuance: 0.03 });
        panneau(ch, m.affiches, R.ornement, { x: fm.x + fm.nx * 0.065, y: Y + 0.46, z: fm.z + fm.nz * 0.065, ry }, lf, 0.78);
        ch.boite(lf + 0.04, 0.1, 0.24, COUL.velours, { x: fm.x - fm.nx * 0.02, y: Y + 0.97, z: fm.z - fm.nz * 0.02, ry }, m.mat, { nuance: 0.06 });
      }
      // fond des loges (tenture sombre), jusqu'au plafond pour le paradis
      const hf = n === 2 ? HPLAF - Y : 2.8;
      ch.boite(lb + 0.04, hf, 0.18, COUL.veloursSombre, { x: bm.x, y: Y + hf / 2, z: bm.z, ry }, m.mat, { nuance: 0.05 });
      // cloisons des loges du premier balcon, une chaise de loge sur deux
      if (n === 0 && i % 2 === 0) {
        ch.boite(0.08, 2.1, prof, COUL.ivoire, { x: (f0.x + b0.x) / 2, y: Y + 1.05, z: (f0.z + b0.z) / 2, ry }, m.mat);
        ch.boite(0.1, 2.1, 0.1, COUL.dore, { x: f0.x, y: Y + 1.05, z: f0.z, ry }, m.metal);
      }
      if (n < 2 && i % 2 === 1) ch.boite(0.45, 0.85, 0.45, COUL.velours, { x: cx, y: Y + 0.43, z: cz, ry: ry + c.entre(-0.4, 0.4) }, m.mat, { nuance: 0.1 });
      if (n === 2) ch.boite(lb, 0.4, 0.5, COUL.boisScene, { x: (cx + bm.x) / 2, y: Y + 0.2, z: (cz + bm.z) / 2, ry }, m.mat);
      // colonnettes de fonte dorée entre les rangs
      if (i % 3 === 0 && n < 2) ch.tube([f0.x - f0.nx * 0.1, Y + 0.95, f0.z - f0.nz * 0.1], [f0.x - f0.nx * 0.1, NIVEAUX[n + 1] - 0.3, f0.z - f0.nz * 0.1], 0.07, COUL.dore, m.metal, 6);
    });
    // Au sol : colonnes de fonte, parapet bas des baignoires (avec des passages)
    if (i % 3 === 0) {
      c.tube([f0.x - f0.nx * 0.1, 0.06, f0.z - f0.nz * 0.1], [f0.x - f0.nx * 0.1, NIVEAUX[0] - 0.3, f0.z - f0.nz * 0.1], 0.09, COUL.dore, m.metal, 6);
      c.boite(0.3, 0.3, 0.3, COUL.dore, { x: f0.x - f0.nx * 0.1, y: 0.2, z: f0.z - f0.nz * 0.1 }, m.metal);
    }
    const passage = i % 3 === 1 || (qm > 1 + Math.PI * 0.42 && qm < 1 + Math.PI * 0.58) || i === 0 || i === segs.length - 1;
    if (!passage) {
      c.boite(lf + 0.02, 1.0, 0.12, COUL.ivoire, { x: fm.x, y: 0.56, z: fm.z, ry }, m.mat, { nuance: 0.03 });
      c.boite(lf + 0.04, 0.08, 0.22, COUL.velours, { x: fm.x, y: 1.08, z: fm.z, ry }, m.mat, { nuance: 0.06 });
      k.b.obstacle(f0.x, f0.z, f1.x, f1.z, "parapet des baignoires");
    }
  });
  // Les loges d'avant-scène, de part et d'autre du cadre
  for (const s of [-1, 1]) {
    const ch = s < 0 ? BF : BA;
    for (const Y of NIVEAUX.slice(0, 2)) {
      ch.pave(s * RF, Y - 0.24, ZP + 0.6, s * (XS - 0.3), Y, ZF, COUL.ivoire, m.mat);
      ch.pave(s * RF - 0.06, Y, ZP + 0.6, s * RF + 0.06, Y + 0.92, ZF, COUL.ivoire, m.mat);
      ch.pave(s * RF - 0.12, Y + 0.92, ZP + 0.6, s * RF + 0.12, Y + 1.02, ZF, COUL.velours, m.mat);
      panneau(ch, m.affiches, R.ornement, { x: s * (RF - 0.07), y: Y + 0.46, z: (ZP + 0.6 + ZF) / 2, ry: -s * Math.PI / 2 }, ZF - ZP - 0.6, 0.78);
      ch.pave(s * RF - 0.1, Y - 0.42, ZP + 0.6, s * RF + 0.1, Y - 0.22, ZF, COUL.dore, m.metal);
      ch.pave(s * (XS - 0.3) - 0.1, Y, ZP + 0.6, s * (XS - 0.3) + 0.1, Y + 2.8, ZF, COUL.veloursSombre, m.mat);
    }
  }
  // Le pan du deuxième balcon tombé sur le parterre
  {
    const p = fer(RF, 1 + Math.PI * 0.6);
    const ry = Math.atan2(p.nx, p.nz);
    c.boite(3.2, 0.24, 1.6, COUL.ivoire, { x: p.x + p.nx * 1.6, y: 0.5, z: p.z + p.nz * 1.6, ry, rx: 0.35, rz: 0.15 }, m.mat);
    c.boite(3.0, 0.9, 0.12, COUL.ivoire, { x: p.x + p.nx * 2.3, y: 0.9, z: p.z + p.nz * 2.3, ry: ry + 0.2, rx: -0.5 }, m.mat);
    panneau(c, m.affiches, R.ornement, { x: p.x + p.nx * 2.38, y: 0.95, z: p.z + p.nz * 2.38, ry: ry + 0.2, rx: -0.5 }, 2.9, 0.75);
    gravats(c, p.x + p.nx * 1.8, p.z + p.nz * 1.8, 1.8, 14 + Math.round(10 * usure), [COUL.ivoire, COUL.dore, COUL.veloursSombre, COUL.enduitSalle]);
  }
}

function parterre(k) {
  const { c, m, usure } = k;
  const trou = { x: -3.0, z: -15.4, rx: 2.4, rz: 1.7 };
  const lustreP = { x: 1.3, z: -13, r: 1.7 };
  const p2 = fer(RF, 1 + Math.PI * 0.6);
  const chute = { x: p2.x + p2.nx * 1.8, z: p2.z + p2.nz * 1.8, r: 2.2 };
  const poussiere = new THREE.Color(COUL.velours).lerp(new THREE.Color(0x9a8a84), 0.15 + 0.3 * usure).getHex();
  for (let i = 0; i < 15; i++) {
    const z = -18.7 + i * 0.95;
    const premium = i < 2;
    const lmax = z > ZC ? Math.sqrt(Math.max(0, (RF - 0.95) ** 2 - (z - ZC) ** 2)) : RF - 0.95;
    const pas = premium ? 0.68 : 0.56;
    for (const s of [-1, 1]) {
      for (let x = 0.85 + pas / 2; x < lmax - pas / 2; x += pas) {
        const px = s * x;
        if (Math.hypot(px - lustreP.x, z - lustreP.z) < lustreP.r) continue;
        if (Math.hypot(px - chute.x, z - chute.z) < chute.r) continue;
        const dt = ((px - trou.x) / trou.rx) ** 2 + ((z - trou.z) / trou.rz) ** 2;
        if (dt < 1) {
          if (c.hasard() < 0.6) fauteuil(c, m, px, z, 0, "bascule", poussiere);
          continue;
        }
        const r = c.hasard();
        if (premium) {
          fauteuil(c, m, px, z, 0, "premium");
          continue;
        }
        if (r < 0.12 + 0.12 * usure) {
          c.boite(0.4, 0.06, 0.3, COUL.fonte, { x: px, y: 0.09, z: z + 0.1 }, m.tole); // arraché : il reste la platine
          continue;
        }
        fauteuil(c, m, px, z, -px * 0.012, r < 0.2 + 0.14 * usure ? "renverse" : "ok", poussiere);
      }
      k.b.obstacle(s * 0.8, z + 0.3, s * (lmax - 0.1), z + 0.3, "rang de fauteuils");
    }
  }
  // Le parterre effondré dans le vide sanitaire : un trou noir aux planches brisées
  {
    const pts = [];
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2;
      const f = 0.8 + 0.3 * (((i * 5) % 7) / 6);
      pts.push(new THREE.Vector2(trou.x + Math.cos(a) * trou.rx * f, -(trou.z + Math.sin(a) * trou.rz * f)));
    }
    const g = new THREE.ShapeGeometry(new THREE.Shape(pts)).rotateX(-Math.PI / 2);
    c.poser(g, m.mat, 0x0e0c0b, { y: 0.075 }, { crasse: false, nuance: 0 });
    g.dispose();
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.3;
      c.boite(c.entre(1.0, 1.7), 0.06, 0.2, 0xc8ae88, { x: trou.x + Math.cos(a) * trou.rx * 0.95, y: 0.02, z: trou.z + Math.sin(a) * trou.rz * 0.95, ry: -a + Math.PI / 2 + c.entre(-0.4, 0.4), rx: c.entre(-0.4, 0.4), rz: c.entre(-0.4, 0.4) }, m.mat, { nuance: 0.08 });
    }
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const b2 = ((i + 1) / n) * Math.PI * 2;
      k.b.obstacle(trou.x + Math.cos(a) * trou.rx, trou.z + Math.sin(a) * trou.rz, trou.x + Math.cos(b2) * trou.rx, trou.z + Math.sin(b2) * trou.rz, "trou du parterre");
    }
  }
  // Le lustre de cristal écrasé au milieu du parterre
  lustre(c, m, lustreP.x, 0.75, lustreP.z, 1.7, { rx: 1.15, rz: 0.3, manque: 0.2 });
  for (let i = 0; i < 70; i++) {
    const a = c.hasard() * Math.PI * 2;
    const r = 0.8 + Math.sqrt(c.hasard()) * 3.0;
    c.poser(OCTA, m.lisse, COUL.cristal, { x: lustreP.x + Math.cos(a) * r, y: 0.08, z: lustreP.z + Math.sin(a) * r, rx: c.hasard() * 3, ry: c.hasard() * 3, e: [0.07, 0.15, 0.07] }, { crasse: false, nuance: 0.05 });
  }
  for (const [dx, dz, rr] of [[1.6, 0.2, 1.2], [-1.4, -0.8, 0.5], [0.4, 1.6, -0.9]]) fauteuil(c, m, lustreP.x + dx, lustreP.z + dz, rr, "renverse", poussiere);
  gravats(c, lustreP.x + 0.8, lustreP.z + 0.6, 1.3, 10 + Math.round(8 * usure), [COUL.ivoire, COUL.dore, 0xb9d2dc, COUL.enduitSalle]);
  // Des morceaux de la fresque tombés face au ciel
  const [px, py, pw, ph] = R.fresque;
  for (const [x, z, r, u0, v0] of [[-0.8, -10.4, 1.3, 0.62, 0.55], [3.6, -15.6, 1.1, 0.75, 0.4], [3.4, -10.0, 0.9, 0.68, 0.62]]) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const f = r * (0.65 + 0.35 * (((i * 3) % 4) / 3));
      pts.push(new THREE.Vector2(Math.cos(a) * f, Math.sin(a) * f));
    }
    const g = new THREE.ShapeGeometry(new THREE.Shape(pts));
    const uv = g.attributes.uv;
    const pos = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + (u0 + pos.getX(i) / 12) * pw) / AL, 1 - (py + (v0 + pos.getY(i) / 12) * ph) / AH);
    g.rotateX(-Math.PI / 2);
    c.poser(g, m.affiches, 0xffffff, { x, y: 0.12, z, ry: c.hasard() * 3, rx: c.entre(-0.06, 0.06) }, { crasse: false, nuance: 0 });
    g.dispose();
  }
  // La plaque des fauteuils premium, au bout du premier rang
  panneau(c, m.affiches, R.premium, { x: 0.95, y: 0.75, z: -18.15, ry: Math.PI / 2 }, 0.62, 0.31);
  for (const x of [1.9, 3.6, 5.0]) c.tube([x, 0.09, -18.3], [x + 0.5, 0.08, -17.4], 0.025, 0x1c1c1c, m.tole, 4);
  // Plâtre, programmes, poussière
  debris(c, -7, -19, 7, -4, 90 * usure, [COUL.ivoire, COUL.enduitSalle, 0xd9d2c0]);
  jonchee(c, -6, -19, 6, -4, 50, [0xe9dfc6, 0xc8362b, 0x2f6f73, 0xe6dcc2], 0.07);
  if (usure > 0.3) flaque(c, 2.2, -11.6, 1.1, 0.07);
}

function fosse(k) {
  const { c, m, usure } = k;
  const z1 = -21.8, z2 = -19.6, xf = 6.4;
  // Fond noir, eau noire
  c.pave(-xf, 0, z1, xf, 0.012, z2, 0x0b0a0a, m.mat, { crasse: false, nuance: 0 });
  c.pave(-xf, 0.03, z1, xf, 0.045, z2, 0x1c2426, m.eau, { crasse: false, nuance: 0 });
  // Le parapet côté parterre (bois sombre, main courante de laiton), les côtés
  c.pave(-xf, 0, z2 + 0.0, xf, 1.0, z2 + 0.16, 0x3a2a24, m.satin);
  c.tube([-xf, 1.05, z2 + 0.08], [xf, 1.05, z2 + 0.08], 0.04, COUL.laiton, m.metal, 6);
  for (const s of [-1, 1]) c.pave(s * xf - 0.08, 0, z1, s * xf + 0.08, 1.0, z2 + 0.16, 0x3a2a24, m.satin);
  // Le nez de scène et la rampe des feux
  c.pave(-9, 0, z1 - 0.1, 9, SCENE, z1, 0x2a2420, m.mat);
  c.pave(-6.8, SCENE, z1 - 0.12, 6.8, SCENE + 0.14, z1 + 0.04, 0x3a3634, m.tole);
  for (let x = -6.3; x < 6.4; x += 0.7) c.boite(0.22, 0.1, 0.12, COUL.laiton, { x, y: SCENE + 0.16, z: z1 - 0.02, rx: 0.5 }, m.metal);
  k.b.obstacle(-xf, z2, xf, z2, "fosse d'orchestre");
  k.b.obstacle(-xf, z1, xf, z1, "fosse d'orchestre");
  for (const s of [-1, 1]) k.b.obstacle(s * xf, z1, s * xf, z2, "fosse d'orchestre");
  // Le piano à queue qui dépasse de l'eau, couvercle levé
  {
    const forme = new THREE.Shape();
    forme.moveTo(0, 0);
    forme.lineTo(1.5, 0);
    forme.lineTo(1.5, 0.5);
    forme.bezierCurveTo(1.4, 1.2, 0.9, 1.2, 0.8, 1.6);
    forme.bezierCurveTo(0.7, 2.0, 0.3, 2.1, 0, 2.0);
    forme.lineTo(0, 0);
    const g = new THREE.ExtrudeGeometry(forme, { depth: 0.32, bevelEnabled: false, curveSegments: 3 }).rotateX(Math.PI / 2);
    c.repere({ x: -4.4, y: 0.42, z: -21.5, ry: -1.35, rx: 0.12, rz: -0.22 }, () => {
      c.poser(g, m.lisse, 0x161414, {}, { crasse: false, nuance: 0.02 });
      c.boite(1.5, 0.08, 0.3, 0xe8e2d0, { x: 0.75, y: -0.06, z: -0.12 }, m.lisse, { crasse: false });
      c.boite(1.5, 0.12, 0.08, 0x161414, { x: 0.75, y: -0.04, z: -0.3 }, m.lisse);
      c.repere({ x: 1.5, y: 0.02, z: 0.3, rx: -0.75 }, () => {
        const lid = new THREE.ShapeGeometry(forme).rotateX(-Math.PI / 2).translate(-1.5, 0, -0.3);
        c.poser(lid, m.lisse, 0x1e1c1c, { y: 0.02 }, { crasse: false });
        lid.dispose();
      });
      c.tube([1.4, 0.0, 0.4], [1.4, 0.8, 0.9], 0.015, 0x1a1a1a, m.metal, 4);
    });
    g.dispose();
  }
  // Pupitres, chaises noyées, le manche d'un violoncelle, partitions qui flottent
  for (const [x, z, r] of [[-1.2, -20.4, 0.3], [0.6, -21.0, -0.4], [2.6, -20.2, 0.9], [4.8, -21.1, 0.1]]) {
    c.tube([x, 0.0, z], [x + 0.1, 1.0, z], 0.015, 0x2a2826, m.tole, 4);
    c.boite(0.5, 0.36, 0.02, 0x2a2826, { x: x + 0.1, y: 1.1, z, ry: r, rx: -0.5 }, m.tole);
  }
  for (const [x, z] of [[-0.4, -21.3], [1.8, -20.6], [3.8, -21.4]]) c.boite(0.42, 0.45, 0.06, 0x3a2a24, { x, y: 0.3, z, ry: c.hasard() * 3, rx: 0.3 }, m.satin);
  c.tube([3.2, 0.04, -20.5], [3.6, 1.1, -20.9], 0.04, 0x5a3a24, m.satin, 5);
  c.poser(BOULE, m.satin, 0x5a3a24, { x: 3.62, y: 1.16, z: -20.92, e: 0.07 });
  for (let i = 0; i < 9; i++) panneau(c, m.affiches, R.partition, { x: c.entre(-6, 6), y: 0.05, z: c.entre(z1 + 0.15, z2 - 0.15), rx: -Math.PI / 2, rz: c.hasard() * 3 }, 0.32, 0.28);
  for (let i = 0; i < 5; i++) panneau(c, m.affiches, R.partition, { x: c.entre(-6, 6), y: 0.08, z: c.entre(-19.4, -18.9), rx: -Math.PI / 2, rz: c.hasard() * 3 }, 0.32, 0.28);
  if (usure > 0.3) mousse(c, 5.5, 0.04, -21.2, 0.5, 3, 0x3f5a3a);
}

function scene(k) {
  const { c, m, usure } = k;
  const y0 = SCENE;
  // Le projecteur d'hologrammes, mort au milieu de la scène, et ses câbles
  {
    const x = 0.6, z = -27.5;
    c.poser(geoCylindre(0.95, 1.0, 0.22, 16), m.lisse, 0xe2e0da, { x, y: y0 + 0.11, z });
    c.poser(geoCylindre(0.7, 0.7, 0.05, 16), m.satin, 0x2f6f73, { x, y: y0 + 0.24, z });
    c.tube([x, y0 + 0.2, z], [x, y0 + 1.05, z], 0.18, 0xb8bcbe, m.metal, 10);
    c.poser(geoCylindre(0.62, 0.45, 0.22, 16), m.lisse, 0xe2e0da, { x, y: y0 + 1.15, z });
    c.poser(new THREE.SphereGeometry(0.34, 12, 5, 0, Math.PI * 2, 0, Math.PI / 2), m.lisse, 0x1d2a30, { x, y: y0 + 1.26, z });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      c.boite(0.08, 0.04, 0.04, 0x3a4446, { x: x + Math.cos(a) * 0.55, y: y0 + 1.24, z: z + Math.sin(a) * 0.55, ry: -a }, m.lisse);
    }
    const pts = [[x + 0.8, z + 0.2], [3, -27], [5.4, -28.2], [8.2, -27.4], [11.5, -27.9]];
    for (let i = 0; i < pts.length - 1; i++) c.tube([pts[i][0], y0 + 0.05, pts[i][1]], [pts[i + 1][0], y0 + 0.05, pts[i + 1][1]], 0.05, 0x1a1a1a, m.tole, 5);
    k.b.obstacle(x - 0.9, z, x + 0.9, z, "projecteur d'hologrammes");
    k.b.obstacle(x, z - 0.9, x, z + 0.9, "projecteur d'hologrammes");
  }
  // La lampe de servante : pied, ampoule nue dans sa cage, batterie au pied
  {
    const x = 3.2, z = -24.6;
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      c.tube([x + Math.cos(a) * 0.35, y0, z + Math.sin(a) * 0.35], [x, y0 + 0.4, z], 0.02, COUL.fonte, m.tole, 4);
    }
    c.tube([x, y0 + 0.4, z], [x, y0 + 1.55, z], 0.025, COUL.fonte, m.tole, 5);
    c.poser(BOULE, m.flamme, 0xfff4d8, { x, y: y0 + 1.66, z, e: [0.07, 0.09, 0.07] }, { crasse: false, nuance: 0 });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      c.tube([x + Math.cos(a) * 0.1, y0 + 1.55, z + Math.sin(a) * 0.1], [x + Math.cos(a) * 0.1, y0 + 1.8, z + Math.sin(a) * 0.1], 0.008, COUL.fonte, m.tole, 3);
    }
    c.boite(0.36, 0.24, 0.2, 0x2a2c2e, { x: x + 0.45, y: y0 + 0.12, z: z + 0.2, ry: 0.4 }, m.lisse);
    c.boite(0.2, 0.02, 0.1, 0x2f6f73, { x: x + 0.45, y: y0 + 0.25, z: z + 0.2, ry: 0.4 }, m.satin);
    c.tube([x + 0.3, y0 + 0.2, z + 0.2], [x, y0 + 0.5, z], 0.012, 0x1a1a1a, m.tole, 3);
  }
  // La veillée : cercle de bougies, coussins de velours, couvertures, bouteilles
  {
    const x = -2.2, z = -26.2;
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2;
      bougie(c, m, x + Math.cos(a) * 0.95, z + Math.sin(a) * 0.95, y0, 0.12 + (i % 3) * 0.08);
    }
    for (const [dx, dz] of [[0.2, 0.1], [-0.25, -0.1]]) {
      c.poser(geoCylindre(0.045, 0.06, 0.3, 6), m.verre, 0x3a5a3a, { x: x + dx, y: y0 + 0.15, z: z + dz }, { crasse: false });
      bougie(c, m, x + dx, z + dz, y0 + 0.3, 0.08);
    }
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.4;
      c.boite(0.5, 0.12, 0.5, COUL.velours, { x: x + Math.cos(a) * 1.6, y: y0 + 0.06, z: z + Math.sin(a) * 1.6, ry: a }, m.mat, { nuance: 0.1 });
    }
    c.boite(1.0, 0.1, 1.9, 0x5a6a50, { x: x - 2.1, y: y0 + 0.05, z: z + 0.2, ry: 0.3 }, m.mat, { nuance: 0.06 });
    c.boite(1.0, 0.1, 1.9, 0x7a5a4a, { x: x + 0.4, y: y0 + 0.05, z: z - 2.0, ry: 1.4 }, m.mat, { nuance: 0.06 });
    c.boite(0.25, 0.04, 0.18, 0x6a2a2a, { x: x + 0.5, y: y0 + 0.02, z: z + 0.6, ry: 0.5 }, m.mat);
  }
  // Les décors peints : un châssis debout (le palais), un couché (la forêt), une toile de fond déchirée
  {
    c.repere({ x: -5.2, y: y0, z: -33.6, rz: 0.06, ry: 0.15 }, () => {
      panneau(c, m.affiches, R.palais, { y: 1.55, z: 0.05 }, 5.6, 2.8);
      for (const xx of [-2.8, 2.8]) c.boite(0.08, 3.1, 0.08, PALETTE.boisGris, { x: xx, y: 1.55 }, m.mat);
      c.boite(5.6, 0.08, 0.08, PALETTE.boisGris, { y: 3.0 }, m.mat);
      for (const xx of [-1.8, 1.8]) c.poutre([xx, 2.4, -0.05], [xx, 0, -1.3], 0.06, PALETTE.boisGris, m.mat);
    });
    c.repere({ x: 5.4, y: y0 + 0.08, z: -31.2, ry: -0.3 }, () => {
      panneau(c, m.affiches, R.foret, { y: 0.03, rx: -Math.PI / 2 }, 4.8, 2.4);
      for (const zz of [-1.2, 1.2]) c.boite(4.8, 0.08, 0.08, PALETTE.boisGris, { z: zz }, m.mat);
    });
    // la toile de fond : la forêt, accrochée à sa perche, déchirée en bas
    c.tube([-7.5, 9.2, -35.1], [2.2, 9.2, -35.1], 0.05, COUL.fonte, m.tole, 4);
    panneau(c, m.affiches, R.foret, { x: -2.6, y: 5.6, z: -35.1 }, 9.6, 6.8);
    // le graffiti des survivants sur le mur du fond
    panneau(c, m.affiches, R.graffiti, { x: 6.0, y: 2.3, z: ZN + 0.32 }, 4.4, 1.9);
    k.b.obstacle(-8, -35.1, 2.4, -35.1, "toile de fond");
  }
  // La perche effondrée en travers de la scène, ses projecteurs tombés ; cordages qui pendent des cintres
  {
    c.tube([-7.2, 8.6, -29.6], [4.8, y0 + 0.1, -30.4], 0.06, COUL.fonte, m.tole, 6);
    for (let i = 0; i < 4; i++) {
      const t = 0.15 + i * 0.22;
      const px = -7.2 + 12 * t, py = 8.6 + (y0 + 0.1 - 8.6) * t, pz = -29.6 - 0.8 * t;
      c.repere({ x: px, y: py - 0.25, z: pz, rx: 0.4 + i * 0.3 }, () => {
        c.poser(geoCylindre(0.15, 0.18, 0.4, 8), m.tole, 0x2a2826, { rx: Math.PI / 2 });
        c.poser(geoCylindre(0.13, 0.13, 0.02, 8), m.lisse, 0xd8e0e0, { z: 0.21, rx: Math.PI / 2 });
      });
    }
    for (const [x, z] of [[2.2, -30.9], [3.4, -29.6]]) c.repere({ x, y: y0 + 0.16, z, rz: 1.4, ry: c.hasard() * 3 }, () => c.poser(geoCylindre(0.15, 0.18, 0.4, 8), m.tole, 0x2a2826, {}));
    for (let i = 0; i < 14; i++) {
      const x = c.entre(-9, 9);
      const z = c.entre(-34.5, -24.5);
      const bas = c.hasard() < 0.5 ? y0 : c.entre(1.2, 4);
      c.tube([x, bas, z], [x + c.entre(-0.1, 0.1), 9.5, z], 0.018, 0xb59a6a, m.mat, 3);
      if (bas === y0) c.poser(geoCylindre(0.22, 0.22, 0.06, 7), m.mat, 0xb59a6a, { x: x + 0.15, y: y0 + 0.03, z });
    }
  }
  // Coulisse ouest : le cintre à cordes (râtelier, cabillots, cordes qui montent), châssis empilés
  {
    const x = -XC + 0.5;
    c.pave(x - 0.12, 0.9, -33.5, x + 0.12, 1.05, -25.5, PALETTE.boisSombre, m.satin);
    for (let z = -33.2; z < -25.6; z += 0.5) {
      c.tube([x, 0.85, z], [x, 1.25, z], 0.02, PALETTE.boisSombre, m.satin, 4);
      c.tube([x + 0.05, 1.1, z], [x + 0.05, 9.5, z + 0.1], 0.018, 0xb59a6a, m.mat, 3);
    }
    k.b.obstacle(x + 0.2, -33.5, x + 0.2, -25.5, "cintre à cordes");
    for (let i = 0; i < 5; i++) c.boite(0.08, 3.2, 3.6, [0xc9b98a, 0x8a7a5a, 0xa4a08a][i % 3], { x: -XC + 1.2 + i * 0.12, y: y0 + 1.6, z: -23.9 - 1.9, rz: -0.12 - i * 0.02 }, m.mat, { nuance: 0.05 });
    for (const [xx, zz] of [[-12.6, -34.4], [-11.4, -34.6]]) c.poser(geoCylindre(0.35, 0.35, 0.18, 8), m.mat, 0xb59a6a, { x: xx, y: y0 + 0.09, z: zz });
  }
  // Coulisse est : projecteurs sur pied, malles de tournée, portant de costumes, trône de carton-pâte
  {
    for (const [x, z, r] of [[12.4, -26.2, 2.4], [11.4, -31.8, 2.0], [13.2, -29, 2.8]]) {
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        c.tube([x + Math.cos(a) * 0.4, y0, z + Math.sin(a) * 0.4], [x, y0 + 0.6, z], 0.02, COUL.fonte, m.tole, 4);
      }
      c.tube([x, y0 + 0.6, z], [x, y0 + 1.9, z], 0.03, COUL.fonte, m.tole, 4);
      c.repere({ x, y: y0 + 2.0, z, ry: r, rx: 0.3 }, () => {
        c.poser(geoCylindre(0.2, 0.24, 0.55, 8), m.tole, 0x2a2826, { rx: Math.PI / 2 });
        c.poser(geoCylindre(0.18, 0.18, 0.02, 8), m.lisse, 0xd8e0e0, { z: 0.28, rx: Math.PI / 2 });
      });
    }
    for (const [x, z, r] of [[9.2, -34.6, 0], [10.4, -34.5, 0.1], [9.8, -34.5, 0]]) c.boite(1.0, 0.7, 0.6, 0x1e1e20, { x, y: y0 + (x === 9.8 ? 1.05 : 0.35), z, ry: r }, m.satin, { nuance: 0.03 });
    k.b.obstacle(8.6, -34.2, 11, -34.2, "malles");
    c.tube([13.6, y0 + 1.7, -33], [13.6, y0 + 1.7, -35.2], 0.025, COUL.laiton, m.metal, 4);
    const tons = [0x7a2a40, 0xc79a3b, 0x2f4f7a, 0xe0d8c8, 0x2a2826, 0x4f7a5a];
    for (let z = -33.2; z > -35.1; z -= 0.28) c.boite(0.5, 1.1, 0.12, tons[Math.floor(c.hasard() * tons.length)], { x: 13.6, y: y0 + 1.1, z, ry: Math.PI / 2 + c.entre(-0.2, 0.2) }, m.mat, { nuance: 0.08, crasse: false });
    c.repere({ x: 8.2, y: y0, z: -25.4, ry: -0.6 }, () => {
      c.boite(0.8, 0.5, 0.7, COUL.dore, { y: 0.25 }, m.metal);
      c.boite(0.8, 1.5, 0.14, COUL.dore, { y: 1.0, z: 0.32 }, m.metal);
      c.boite(0.6, 0.12, 0.55, COUL.velours, { y: 0.56 }, m.mat);
      c.poser(BOULE, m.metal, COUL.dore, { y: 1.85, z: 0.32, e: 0.16 });
    });
  }
  // La trappe ouverte, les planches arrachées
  c.pave(-6.4, y0, -28.6, -4.8, y0 + 0.004, -27.4, 0x0e0c0b, m.mat, { crasse: false, nuance: 0 });
  c.boite(1.6, 0.05, 1.2, 0x8a7458, { x: -5.6, y: y0 + 0.5, z: -29.0, rx: -1.1 }, m.mat);
  k.b.obstacle(-6.4, -28.6, -4.8, -27.4, "trappe ouverte");
  debris(c, -9, -35, 9, -23.6, 50 * usure, [0xd9d2c0, COUL.ivoire, 0x8c2a30], y0);
  jonchee(c, -9, -34, 9, -24, 30, [0xe6dcc2, 0x8c2a30, 0x9c7a45], y0 + 0.01);
}

function cintres(k) {
  const { c, K, m, usure } = k;
  const murs = { ep: 0.6, couleur: COUL.mur, mat: m.enduit, interieur: { couleur: 0x6a625a, mat: m.enduit } };
  // Les murs de la cage (22 m) : est et ouest coupés, nord coupé à 6 m
  murCoupe(k, [XC, ZP], [XC, ZN], { ...murs, h: 22, haut: K, ouvertures: [{ u: 7, l: 4, bas: 0, haut: 6, type: "vide" }] });
  murCoupe(k, [-XC, ZN], [-XC, ZP], { ...murs, h: 22, haut: K, ouvertures: [{ u: 3, l: 1.4, bas: 0, haut: 2.4, type: "vide" }, { u: 10, l: 1.4, bas: 0, haut: 2.4, type: "vide" }] });
  murCoupe(k, [XC, ZN], [-XC, ZN], { ...murs, h: 22, cut: 6, haut: K });
  // Le gril, les passerelles de service, les frises noires
  for (let x = -14; x <= 14; x += 1.4) K.pave(x - 0.08, 19.6, ZN + 0.3, x + 0.08, 19.9, ZP - 0.4, 0x4a4844, m.tole);
  for (const s of [-1, 1]) {
    K.pave(s * XC - s * 1.6, 9.4, ZN + 0.3, s * XC - s * 0.3, 9.55, ZP - 0.4, 0x4a4844, m.tole);
    K.pave(s * XC - s * 1.6 - 0.03, 9.55, ZN + 0.3, s * XC - s * 1.6 + 0.03, 10.6, ZP - 0.4, 0x4a4844, m.tole);
  }
  for (const z of [-25.5, -28.5, -31.5]) {
    K.tube([-8.5, 11.8, z], [8.5, 11.8, z], 0.05, COUL.fonte, m.tole, 4);
    K.pave(-8.5, 10.2, z - 0.03, 8.5, 11.8, z + 0.03, 0x1e1c1c, m.toile, { nuance: 0.03 });
    for (let x = -7.5; x < 8; x += 2.5) K.tube([x, 11.8, z], [x, 19.6, z], 0.015, 0xb59a6a, m.toile, 3);
  }
  // Le toit de la cage de scène (ardoise), percé
  toitDeuxPans(K, 0, (ZN + ZP) / 2, 30.4, 13.4, 22, 2.4, { couleur: PALETTE.ardoise, mat: m.tole, debord: 0.3 });
  // Pilastres et corniche de la cage de scène, côté est (au-dessus de l'atelier)
  for (let z = ZP - 1.4; z > ZN; z -= 3.2) K.pave(XC + 0.3, 7, z - 0.35, XC + 0.5, 21.6, z + 0.35, 0xcfc4ac, m.enduit);
  K.pave(XC + 0.3, 21.4, ZN, XC + 0.7, 22, ZP, 0xcfc4ac, m.enduit);
  K.pave(-XC, 21.4, ZP + 0.3, XC, 22, ZP + 0.7, 0xcfc4ac, m.enduit);
}

function loges(k) {
  const { c, L, m, usure } = k;
  const ext = { ep: 0.4, couleur: COUL.mur, mat: m.enduit, interieur: { couleur: 0xd8cdb4, mat: m.enduit } };
  const cl = { ep: EPI, couleur: 0xd8cdb4, mat: m.enduit };
  const H = 4.5;
  // Façade sud : l'entrée des artistes
  murCoupe(k, [-21, -20], [-XC, -20], { ...ext, h: H, haut: L, ouvertures: [{ u: 5, l: 1.4, bas: 0, haut: 2.4, type: "vide" }] });
  vantail(c, m, -16.7, -19.8, 1.9, 1.3, 2.3, 0x3f4f5a);
  panneau(L, m.affiches, R.artistes, { x: -16, y: 2.95, z: -19.78 }, 0.9, 0.45);
  // Façade ouest (fond) : impostes, mur nord
  murCoupe(k, [-21, ZN], [-21, -20], { ...ext, h: H, cut: 2.4, haut: L, ouvertures: [2.7, 8, 13.3].map((u) => ({ u, l: 1.4, bas: 2.6, haut: 3.6, type: "vide" })) });
  for (const u of [2.7, 8, 13.3]) L.pave(-21.25, 2.5, ZN + u - 0.8, -20.9, 2.6, ZN + u + 0.8, 0xcfc4ac, m.enduit);
  murCoupe(k, [-XC, ZN], [-21, ZN], { ...ext, h: H, cut: 2.4, haut: L });
  // Le couloir, les cloisons des trois loges
  murCoupe(k, [-17, -20], [-17, ZN], { ...cl, h: H, cut: CUTI, haut: L, ouvertures: [2.7, 8, 13.3].map((u) => ({ u, l: 1.0, bas: 0, haut: 2.2, type: "vide" })) });
  for (const z of [-30.7, -25.4]) murCoupe(k, [-21, z], [-17, z], { ...cl, h: H, cut: CUTI, haut: L });
  // Le toit-terrasse et son acrotère
  L.pave(-21.2, H, ZN - 0.2, -XC, H + 0.2, -19.8, 0x8a8478, m.tole);
  L.pave(-21.2, H + 0.2, -20.1, -XC, H + 0.6, -19.8, COUL.mur, m.enduit);
  // Chaque loge : coiffeuse et miroirs à ampoules, chaise, portant de costumes, perruques, malle
  const tonsCost = [0x7a2a40, 0xc79a3b, 0x2f4f7a, 0xe0d8c8, 0x2a2826, 0x6a3a6a, 0x4f7a5a, 0xb05a3a];
  [-33.35, -28.05, -22.7].forEach((zc, n) => {
    const y = SCENE;
    c.pave(-20.8, y, zc - 1.8, -20.3, y + 0.78, zc + 1.8, PALETTE.boisSombre, m.satin);
    c.pave(-20.85, y + 0.78, zc - 1.85, -20.25, y + 0.82, zc + 1.85, 0xcfc6b2, m.lisse);
    k.b.obstacle(-20.3, zc - 1.8, -20.3, zc + 1.8, "coiffeuse");
    for (const dz of [-0.9, 0.9]) panneau(c, m.affiches, R.miroirLoge, { x: -20.78, y: y + 1.55, z: zc + dz, ry: Math.PI / 2 }, 1.1, 1.1);
    // perruques sur leurs têtes de bois, fards
    for (const [dz, t] of [[-1.4, 0xd8c8a0], [0.1, 0x5a3a2a], [1.3, 0xe8e4dc]]) {
      if (n === 1 && dz > 1) continue;
      c.tube([-20.55, y + 0.82, zc + dz], [-20.55, y + 1.05, zc + dz], 0.02, PALETTE.bois, m.mat, 4);
      c.poser(BOULE, m.mat, 0xd9c2a6, { x: -20.55, y: y + 1.15, z: zc + dz, e: 0.11 });
      c.poser(BOULE, m.mat, t, { x: -20.58, y: y + 1.2, z: zc + dz, e: [0.15, 0.13, 0.15] });
    }
    for (let i = 0; i < 5; i++) c.boite(0.06, 0.05, 0.06, [0xc8362b, 0xe9dfc6, 0x2a2826][i % 3], { x: -20.5, y: y + 0.85, z: zc - 0.4 + i * 0.12 }, m.lisse);
    // chaise
    c.repere({ x: -19.8, y, z: zc + (n % 2 ? 0.5 : -0.6), ry: Math.PI / 2 + (n === 2 ? 1.2 : 0.2), rz: n === 2 ? 1.4 : 0 }, () => {
      c.boite(0.42, 0.06, 0.42, PALETTE.bois, { y: 0.45 }, m.satin);
      c.boite(0.42, 0.5, 0.05, PALETTE.bois, { y: 0.72, z: 0.2 }, m.satin);
      for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) c.boite(0.04, 0.45, 0.04, PALETTE.bois, { x: dx, y: 0.22, z: dz }, m.satin);
    });
    // portant de costumes le long de la cloison
    const zr = zc + (n === 0 ? 2.25 : -2.25);
    c.tube([-20.6, y + 1.7, zr], [-17.8, y + 1.7, zr], 0.025, COUL.laiton, m.metal, 4);
    for (const x of [-20.6, -17.8]) c.tube([x, y, zr], [x, y + 1.7, zr], 0.025, COUL.laiton, m.metal, 4);
    for (let x = -20.4; x < -17.9; x += 0.26) {
      if (c.hasard() < 0.2 * usure) continue;
      const t = tonsCost[Math.floor(c.hasard() * tonsCost.length)];
      c.boite(0.12, c.entre(0.8, 1.3), 0.5, t, { x, y: y + 1.05, z: zr, rx: c.entre(-0.1, 0.1) }, m.mat, { nuance: 0.08, crasse: false });
      if (c.hasard() < 0.15) c.poser(CONE, m.toile, 0xe8e4dc, { x, y: y + 0.4, z: zr, e: [0.32, 0.25, 0.32] });
    }
    // malle de costumes ouverte, costumes qui débordent
    c.boite(0.9, 0.5, 0.55, 0x5a3a24, { x: -18.0, y: y + 0.25, z: zc + (n === 0 ? -1.4 : 1.4) }, m.satin);
    c.boite(0.9, 0.5, 0.06, 0x5a3a24, { x: -18.0, y: y + 0.75, z: zc + (n === 0 ? -1.7 : 1.7), rx: n === 0 ? 0.3 : -0.3 }, m.satin);
    c.boite(0.8, 0.08, 1.0, tonsCost[n + 2], { x: -18.2, y: y + 0.05, z: zc + (n === 0 ? -0.7 : 0.7), ry: 0.4 }, m.mat);
    jonchee(c, -20.8, zc - 2.3, -17.3, zc + 2.3, 10, [0xe8dfc6, 0xd8cfb6, 0xc8362b], y + 0.01);
    panneau(c, m.affiches, R.partition, { x: -19, y: y + 0.02, z: zc + 0.3, rx: -Math.PI / 2, rz: n }, 0.32, 0.28);
  });
  // Le couloir : tableau de service, affiches de tournée, extincteur
  panneau(c, m.affiches, R.operette, { x: -17 + 0.13, y: 1.55, z: -23.8, ry: Math.PI / 2 }, 0.8, 1.2);
  panneau(c, m.affiches, R.holo, { x: -XC - 0.31, y: 1.55, z: -29.5, ry: -Math.PI / 2 }, 0.8, 1.2);
  c.poser(geoCylindre(0.1, 0.1, 0.55, 8), m.satin, 0xa8433a, { x: -15.5, y: SCENE + 0.28, z: -34.8 });
  debris(c, -17, -35.5, -15.3, -20.5, 20 * usure, undefined, SCENE);
  if (usure > 0.3) lierre(c, -21.22, 0, -27, -Math.PI / 2, 6, 3.8 * usure, Math.round(60 * usure));
}

function atelier(k) {
  const { c, A, m, usure } = k;
  const ext = { ep: 0.4, couleur: COUL.mur, mat: m.enduit, interieur: { couleur: 0xcfc8b6, mat: m.enduit } };
  const H = 7;
  murCoupe(k, [XC, -24], [23, -24], { ...ext, h: H, haut: A, ouvertures: [2, 4.5, 7].map((u) => ({ u, l: 1.4, bas: 3.6, haut: 5.6, type: "vide" })) });
  for (const u of [2, 4.5, 7]) {
    A.pave(XC + u - 0.75, 3.5, -23.85, XC + u + 0.75, 3.6, -23.6, 0xcfc4ac, m.enduit);
    A.pave(XC + u - 0.03, 3.6, -23.85, XC + u + 0.03, 5.6, -23.75, 0x5a5850, m.tole);
    A.pave(XC + u - 0.7, 4.57, -23.85, XC + u + 0.7, 4.63, -23.75, 0x5a5850, m.tole);
  }
  murCoupe(k, [23, -24], [23, ZN], { ...ext, h: H, haut: A, ouvertures: [{ u: 6, l: 3.6, bas: 0, haut: 4.2, type: "vide" }] });
  murCoupe(k, [23, ZN], [XC, ZN], { ...ext, h: H, cut: 3.6, haut: A });
  // Le rideau métallique, à moitié levé
  for (let y = 1.5; y < 4.2; y += 0.18) A.boite(0.06, 0.16, 3.7, 0x8a8a82, { x: 23.25, y, z: -30, rx: (Math.round(y * 10) % 2) * 0.1 }, m.tole, { nuance: 0.04 });
  A.pave(23.2, 4.2, -32, 23.7, 4.8, -28, 0x6a6a64, m.tole);
  toitDeuxPans(A, 19, -30, 12.4, 8.4, H, 1.6, { ry: Math.PI / 2, couleur: 0x8a8a82, mat: m.tole, debord: 0.3 });
  // L'établi, le panneau d'outils, l'étau
  c.pave(16, 0.1, -35.6, 21, 0.95, -34.8, PALETTE.bois, m.mat);
  k.b.obstacle(16, -34.8, 21, -34.8, "établi");
  c.pave(16.2, 1.3, -35.78, 20.8, 2.6, -35.72, 0x9a8a6a, m.mat);
  for (let i = 0; i < 14; i++) c.boite(c.entre(0.05, 0.12), c.entre(0.2, 0.5), 0.04, [0x5a5a58, 0x7a5a3c, 0xa4552f][i % 3], { x: 16.5 + i * 0.3, y: c.entre(1.7, 2.2), z: -35.68 }, m.tole);
  c.boite(0.25, 0.18, 0.2, 0x3a5a6a, { x: 17, y: 1.05, z: -35.2 }, m.tole);
  // Les piles de bois de scène, les tréteaux, les pots de peinture et leurs coulures
  for (let i = 0; i < 9; i++) c.boite(3.6, 0.06, 0.24, i % 3 ? PALETTE.bois : 0xa48a6a, { x: 21.2, y: 0.14 + i * 0.065, z: -32.6 + (i % 3) * 0.26, ry: Math.PI / 2 + c.entre(-0.03, 0.03) }, m.mat, { nuance: 0.06 });
  k.b.obstacle(20.8, -34.5, 20.8, -30.6, "pile de bois");
  for (const z of [-28.6, -26.8]) {
    for (const dx of [-0.35, 0.35]) c.poutre([17.6 + dx, 0.1, z - 0.3], [17.6 + dx * 0.4, 0.85, z], 0.05, PALETTE.bois, m.mat);
    c.boite(0.9, 0.08, 0.12, PALETTE.bois, { x: 17.6, y: 0.86, z }, m.mat);
  }
  c.boite(0.5, 0.05, 3.2, 0xa48a6a, { x: 17.6, y: 0.93, z: -27.7 }, m.mat);
  const peintures = [0xa8433a, 0x2f6f73, 0xc79a3b, 0x4f7a3c, 0xe6e2d8];
  for (let i = 0; i < 8; i++) {
    const x = c.entre(16, 19.5), z = c.entre(-33.8, -31.5);
    c.poser(geoCylindre(0.13, 0.13, 0.22, 7), m.tole, 0x9a9a92, { x, y: 0.21, z });
    c.boite(0.5, 0.005, 0.4, peintures[i % 5], { x: x + 0.2, y: 0.105, z: z + 0.2, ry: c.hasard() * 3 }, m.lisse, { crasse: false });
  }
  // Le châssis en cours de peinture (le palais), contre le mur ; des colonnes de carton-pâte sur un chariot
  c.repere({ x: 15.45, y: 0.1, z: -32.6, ry: Math.PI / 2, rx: -0.08 }, () => {
    panneau(c, m.affiches, R.palais, { y: 1.5, z: 0.05 }, 4.4, 2.2);
    c.boite(4.4, 0.08, 0.08, PALETTE.boisGris, { y: 2.6 }, m.mat);
  });
  c.pave(19.6, 0.1, -27.6, 22.2, 0.4, -25.4, PALETTE.boisSombre, m.mat);
  for (const [x, z, couche] of [[20.3, -26.5, false], [21.4, -26.0, true]]) {
    if (couche) c.poser(geoCylindre(0.32, 0.36, 2.8, 10), m.mat, COUL.ivoire, { x, y: 0.75, z, rx: Math.PI / 2, ry: 0.5 });
    else c.poser(geoCylindre(0.32, 0.36, 2.6, 10), m.mat, COUL.ivoire, { x, y: 1.7, z });
  }
  k.b.obstacle(19.6, -25.4, 22.2, -25.4, "chariot de décors");
  // Rouleaux de toile, sciure, une échelle
  for (let i = 0; i < 3; i++) c.poser(geoCylindre(0.15, 0.15, 2.4, 7), m.mat, 0xe0d8c0, { x: 16.1, y: 0.25 + i * 0.3, z: -27 + i * 0.1, rx: Math.PI / 2 });
  c.poutre([22.4, 0.1, -35.2], [22.6, 4.4, -35.4], 0.06, PALETTE.bois, m.mat);
  c.poutre([21.8, 0.1, -35.2], [22.0, 4.4, -35.4], 0.06, PALETTE.bois, m.mat);
  debris(c, 15.5, -35.5, 22.5, -24.5, 40, [0xd9c8a0, 0xc9b98a, 0xe6dcc2], 0.1);
}

function regie(k) {
  const { c, T, m } = k;
  const x1 = 8.3, z1 = -7.6, z2 = ZS - 0.3;
  const cl = { ep: EPI, couleur: 0x4a4440, mat: m.enduit };
  murCoupe(k, [x1, z2], [x1, z1], { ...cl, h: 3.2, cut: CUTI, haut: T, ouvertures: [{ u: 0.9, l: 0.9, bas: 0, haut: 2.1, type: "vide" }, { u: 3.0, l: 1.4, bas: 1.0, haut: 2.0, type: "fenetre", croisillons: 1, traverses: 1, bris: 0.6 }] });
  murCoupe(k, [XS - 0.3, z1], [x1, z1], { ...cl, h: 3.2, cut: CUTI, haut: T, ouvertures: [{ u: 1.9, l: 2.0, bas: 1.0, haut: 2.0, type: "fenetre", croisillons: 2, traverses: 1, bris: 0.5 }] });
  T.pave(x1, 3.2, z1, XS - 0.3, 3.35, z2, 0x3a3634, m.enduit);
  panneau(T, m.affiches, R.regie, { x: x1 - 0.12, y: 2.6, z: -6.2, ry: -Math.PI / 2 }, 0.8, 0.4);
  vantail(c, m, x1, z2 - 0.45, Math.PI - 0.6, 0.9, 2.0, 0x2a2826);
  // Le jeu d'orgue (console), ses curseurs
  c.pave(8.6, 0.06, z1 + 0.2, 11.4, 0.8, z1 + 0.9, 0x2a2826, m.satin);
  c.boite(2.8, 0.06, 0.6, 0x3a3836, { x: 10, y: 0.86, z: z1 + 0.55, rx: 0.25 }, m.satin);
  for (let i = 0; i < 18; i++) c.boite(0.04, 0.05, 0.12, [0xc8362b, 0xe9dfc6, 0x7fd6d0][i % 3], { x: 8.9 + i * 0.13, y: 0.92, z: z1 + 0.55, rx: 0.25 }, m.lisse, { crasse: false });
  k.b.obstacle(8.6, z1 + 0.9, 11.4, z1 + 0.9, "console");
  // La poursuite, braquée vers la scène
  c.repere({ x: 9.2, y: 0, z: -5.0 }, () => {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      c.tube([Math.cos(a) * 0.35, 0.06, Math.sin(a) * 0.35], [0, 1.1, 0], 0.025, COUL.fonte, m.tole, 4);
    }
    c.repere({ y: 1.3, ry: 2.4, rx: 0.15 }, () => {
      c.poser(geoCylindre(0.16, 0.2, 1.1, 8), m.tole, 0x2a2826, { rx: Math.PI / 2 });
      c.poser(geoCylindre(0.15, 0.15, 0.02, 8), m.lisse, 0xd8e0e0, { z: 0.56, rx: Math.PI / 2 });
    });
  });
  // La petite génératrice (ocre passé), son jerrican, ses câbles ; une chaise
  c.repere({ x: 10.8, y: 0.06, z: -4.2, ry: 0.3 }, () => {
    c.boite(0.75, 0.45, 0.5, 0xb08a42, { y: 0.32 }, m.tole);
    c.boite(0.5, 0.12, 0.34, 0xb08a42, { y: 0.6 }, m.tole);
    for (const [dx, dz] of [[-0.38, -0.25], [0.38, -0.25], [-0.38, 0.25], [0.38, 0.25]]) c.tube([dx, 0, dz], [dx, 0.62, dz], 0.02, 0x2a2826, m.tole, 4);
    c.poser(geoCylindre(0.07, 0.07, 0.05, 6), m.tole, 0x2a2826, { x: 0.15, y: 0.69 });
    c.poser(BOULE, m.flamme, 0xff4030, { x: -0.3, y: 0.5, z: 0.26, e: 0.025 }, { crasse: false, nuance: 0 });
  });
  c.boite(0.35, 0.45, 0.18, 0x5a6a3a, { x: 11.4, y: 0.29, z: -5.2, ry: 0.2 }, m.tole);
  for (let i = 0; i < 2; i++) c.poser(geoCylindre(0.25, 0.25, 0.06, 8), m.tole, 0x1a1a1a, { x: 9.6 + i * 0.5, y: 0.09 + i * 0.06, z: -4.0 });
  c.boite(0.45, 0.06, 0.45, 0x3a3836, { x: 10.0, y: 0.48, z: -6.4 }, m.satin);
  k.b.obstacle(x1, z1, XS, z1, "régie");
}

function abords2(k) {
  const { c, m, usure } = k;
  // Cour de service à l'est : palettes, fûts, un arbre poussé dans l'angle
  for (const [x, z] of [[17.5, -21.5], [18.6, -21.2]]) c.boite(1.2, 0.14, 0.8, PALETTE.boisGris, { x, y: 0.1, z, ry: 0.2 }, m.mat, { nuance: 0.08 });
  for (const [x, z] of [[21.6, -22.6], [22.4, -21.8]]) c.poser(geoCylindre(0.3, 0.3, 0.9, 8), m.tole, 0x6a5a3a, { x, y: 0.45, z });
  arbre(c, 19.5, -19.5, 6, "bouleau");
  arbuste(c, 20, -17, 1.2);
  semerTouffes(c, 12.5, -23.6, 23.5, -1, 70 * usure, PALETTE.herbeSeche, 0.03);
  // À l'ouest : la benne près de l'entrée des artistes
  c.boite(2.2, 1.1, 1.3, 0x4f6a5a, { x: -19.2, y: 0.6, z: -18, ry: 0.1 }, m.tole);
  k.b.obstacle(-20.3, -17.4, -18.1, -17.4, "benne");
  semerTouffes(c, -21.8, -19.6, -12.5, -1, 50 * usure, PALETTE.herbeSeche, 0.03);
  semerTouffes(c, -21.8, -37.2, 23.5, -36.3, 40 * usure, PALETTE.herbeSeche, 0.03);
  if (usure > 0.3) {
    lierre(c, XS + 0.32, 0, -15, Math.PI / 2, 5, 7 * usure, Math.round(60 * usure));
    lierre(c, -XS - 0.32, 0, -10, -Math.PI / 2, 4, 6 * usure, Math.round(40 * usure));
  }
  jonchee(c, -21, -19, 23, -1, 40, [0x9c7a45, 0x7d6143, 0xb08f55], 0.04);
}
