// La Galerie de l'Abondance, le centre commercial (Book 20 §3.3 : Ville, lointain, danger ●●●●).
//
// Le temple de l'Âge de l'Abondance : une longue allée nord-sud sous une verrière en berceau, un atrium où la fontaine
// est devenue un étang (eau verte, nénuphars, carpes koï évadées d'on ne sait où), des escalators figés qui montent vers
// une galerie supérieure inaccessible, une passerelle tombée en travers. De part et d'autre, les boutiques : rideaux de
// fer levés, baissés, tordus ou arrachés, vitrines brisées, mannequins renversés. Au nord, le supermarché « Plus-Plus »
// et son quai de livraison ; au sud, le parking géant, ses voitures autonomes restées en file, ses caddies, et
// l'enseigne sur pylône à qui il manque des lettres.
//
// Deux cartes (budget : ≤ 60 000 triangles, ≤ 40 appels de dessin chacune) :
// - « parking » : le parking, le parvis, la marquise, la façade et l'entrée (barricadée par des survivants) ;
// - « galerie » : l'allée centrale, l'atrium, les boutiques, le food court, le supermarché, la réserve et le quai.
// Tout est bâti dans le repère du site (G), puis recentré sur le lot de la carte.
//
// Repère G : +x à l'est, +z au sud. Le bâtiment va de x = -20 à 20 et de z = -28 (quai, nord) à z = 22 (façade sud).
// L'allée : x de -5 à 5 ; l'atrium : x de -11 à 11, z de -4 à 10 ; le supermarché : z de -28 à -16.
// Les murs qui regardent la caméra (façades sud et est, cloisons) sont coupés à hauteur d'allège : le haut, les toits,
// la verrière et la galerie supérieure forment des couches qui s'effacent.

import * as THREE from "three";
import {
  Batiment, Chantier, PALETTE, MAT, matiere, matiereMonde, matiereTexture, matiereVerre, matiereEau, mur, lierre as lierreA, touffes,
  semerTouffes as semerA, gravats, debris as debrisA, jonchee as joncheeA, mousse, arbuste, arbre, raiDeLumiere as raiA, dessiner,
  taches, aleatoire,
} from "../commun/atelier.js";

// La végétation et le petit désordre coûtent cher en triangles : on les dose.
const lierre = (c, x, y0, z, ry, l, h, n) => lierreA(c, x, y0, z, ry, l, h, Math.round(n * 0.3));
const semerTouffes = (c, x1, z1, x2, z2, n, t, y) => semerA(c, x1, z1, x2, z2, Math.round(n * 0.4), t, y);
const debris = (c, x1, z1, x2, z2, n, t, y) => debrisA(c, x1, z1, x2, z2, Math.round(n * 0.4), t, y);
const jonchee = (c, x1, z1, x2, z2, n, t, y) => joncheeA(c, x1, z1, x2, z2, Math.round(n * 0.4), t, y);
// Un seul matériau de lueur pour tous les rais de lumière (l'opacité fait la clé du cache)
const raiDeLumiere = (c, a, b, l) => raiA(c, a, b, l, 0.09);

const PI = Math.PI;

// ---------- Les cartes ----------

/** Centre de chaque carte dans le repère G (l'origine d'une carte est le centre de son lot). */
const CENTRES = { parking: { x: 0, z: 42 }, galerie: { x: 0, z: -5 } };
const LOTS = { parking: { l: 72, p: 48 }, galerie: { l: 48, p: 62 } };

/** Convertit des points du repère G vers le repère d'une carte. */
function versCarte(id, points) {
  const o = CENTRES[id];
  return points.map((p) => ({ ...p, x: Math.round((p.x - o.x) * 10) / 10, z: Math.round((p.z - o.z) * 10) / 10 }));
}

export const FICHE = {
  id: "galerie-abondance",
  nom: "La Galerie de l'Abondance",
  lieu: "Galerie de l'Abondance (centre commercial) · Ville · lointain",
  environnement: "ville",
  anneau: "lointain",
  danger: 4,
  recit:
    "On y venait le dimanche acheter des choses qui achetaient les autres choses à notre place. Depuis la Grande Panne, les carpes de l'aquarium du food court ont trouvé la fontaine, les voitures autonomes attendent toujours leur tour sur le parking, et la caisse automatique signale un article inattendu dans la zone d'ensachage. Au sommet du pylône, l'enseigne promet encore « L'ABONDANCE » : il lui manque deux lettres, et à la galerie, tout le reste.",
  inspiration:
    "les « dead malls » américains (Rolling Acres, Dixie Square, Randall Park), le New World Mall de Bangkok et les poissons de son atrium inondé, les photographies d'urbex de centres commerciaux : verrières en berceau, fontaines asséchées, escalators figés, palmiers en pot morts, rideaux de fer tordus, faux plafonds effondrés",
  reperes: [
    "La grande allée sous la verrière en berceau : vitres manquantes, rais de lumière, feuilles mortes, mousse sous les trous",
    "L'atrium : la fontaine devenue étang (eau verte, nénuphars, carpes koï orange qui tournent), la Corne d'Abondance dorée",
    "Les escalators figés vers la galerie supérieure inaccessible, la passerelle effondrée en travers de l'atrium",
    "L'écran publicitaire de l'atrium qui boucle encore sur son panneau solaire : Watty, « SOLDES −90 % »",
    "Les rideaux de fer : levé (Jouets Bavards), arraché (Tout-Connecté), coincé à mi-hauteur (Mode Jetable), forcé (Pharma-Express), baissé (Gadgets : on entre par la vitrine brisée)",
    "Tout-Connecté : télés de 85 pouces, enceintes « intelligentes », présentoir de brosses à dents connectées",
    "Gadgets de l'Abondance : grille-pain à reconnaissance faciale, balances connectées, pyramide de coffrets « Kit de survie premium »",
    "Le food court : tables vissées, comptoirs Burger Instantané, Sushi-Drone et Crêpes 3D, le feu des survivants dans un demi-fût",
    "Le supermarché Plus-Plus : rayons pillés, gondole renversée, caisses automatiques (« Article inattendu dans la zone d'ensachage »), la pyramide légendaire de 96 rouleaux",
    "Le parking : lignes effacées, caddies, la file de voitures autonomes, lampadaires tordus (un seul, solaire, marche encore), herbe dans les fissures",
    "Le pylône « GA_ERIE DE L'AB_NDANCE », la marquise et ses lettres tombées, la barricade de caddies devant l'entrée, le panneau Watty géant sur le toit",
  ],
  cartes: [
    {
      id: "parking",
      nom: "Le parking et l'entrée",
      lot: LOTS.parking,
      depart: versCarte("parking", [{ x: 6, z: 60 }])[0],
      description: "le parking géant, la file de voitures autonomes, le pylône, le parvis, la marquise et l'entrée barricadée",
      entrees: versCarte("parking", [
        { x: 2, z: 65, nature: "l'entrée du parking, au sud (la barrière levée pour toujours)" },
        { x: 35, z: 40, nature: "la bretelle d'accès, à l'est" },
        { x: -35, z: 45, nature: "la haie tombée, à l'ouest" },
        { x: 0, z: 22.6, nature: "la porte principale : le passage laissé dans la barricade de caddies (vers la carte « la galerie »)" },
        { x: 24, z: 19, nature: "le chemin de service le long de la façade est (vers le quai, carte « la galerie »)" },
      ]),
      fouille: versCarte("parking", [
        { x: -21.5, z: 28.5, quoi: "voiture autonome de tête de file : batterie de traction (énorme, presque vide), câbles, gilet de sécurité" },
        { x: -4, z: 28.3, quoi: "voiture autonome accidentée : trousse de secours, lidar du toit (électronique), sièges (mousse)" },
        { x: 14.5, z: 49.5, quoi: "abri à caddies : caddies emboîtés (fil d'acier), un sac de courses oublié (conserves)" },
        { x: 12, z: 47, quoi: "lampadaire solaire qui marche encore : panneau solaire, batterie, LED (à démonter, prudemment)" },
        { x: -9, z: 25, quoi: "totem publicitaire : écran, carte électronique, panneau solaire" },
        { x: 18.5, z: 23.5, quoi: "consignes de retrait automatiques : colis jamais retirés (vêtements, gadgets, une brosse à dents connectée)" },
        { x: 0, z: 24, quoi: "barricade de caddies : palettes, sangles, chaînes" },
        { x: -27, z: 53.5, quoi: "voiture autonome garée de travers : siège bébé, couverture, coffre plein de sacs (vêtements synthétiques)" },
        { x: 29, z: 57, quoi: "pied du pylône : armoire électrique (cuivre, disjoncteurs)" },
        { x: 6.5, z: 40, quoi: "drone de livraison écrasé : petits moteurs, hélices, batterie" },
      ]),
      eteints: versCarte("parking", [
        { x: -12, z: 38, type: "errant (entre les voitures)" },
        { x: 6, z: 44, type: "errant (pousse un caddie vide)" },
        { x: 20, z: 34, type: "errant" },
        { x: -26, z: 50, type: "errant (sur le parking)" },
        { x: 30, z: 45, type: "errant (au pied du pylône)" },
        { x: -17.5, z: 29.6, type: "rampant (sous une voiture de la file)" },
        { x: 8.5, z: 56, type: "rampant (dans les herbes de l'îlot)" },
        { x: 15, z: 48.5, type: "putréfié (pris dans l'abri à caddies)" },
        { x: -3, z: 29.6, type: "ancien habitant (agent de sécurité, lampe torche)" },
        { x: 4, z: 25.2, type: "équipé (casque de moto, devant la barricade)" },
        { x: -8, z: 30, type: "ancien habitant (client, sac « Plus-Plus » à la main)" },
        { x: 24, z: 26, type: "errant (le long de la façade est)" },
        { x: -30, z: 34, type: "errant (assis dans une voiture autonome, la porte ouverte)" },
      ]),
    },
    {
      id: "galerie",
      nom: "L'allée, l'atrium et les boutiques",
      lot: LOTS.galerie,
      depart: versCarte("galerie", [{ x: 0, z: 19 }])[0],
      description: "l'allée sous la verrière, l'atrium et son étang, huit boutiques, le food court, les toilettes, le supermarché, la réserve et le quai de livraison",
      entrees: versCarte("galerie", [
        { x: 0, z: 22.6, nature: "la porte principale, au sud (vers la carte « le parking »)" },
        { x: 20, z: 16, nature: "la sortie de secours de Jouets Bavards (porte battante, façade est)" },
        { x: 20, z: 1, nature: "la sortie de secours du food court (façade est)" },
        { x: 14, z: -28, nature: "la porte du quai de livraison, au nord (rideau à demi levé)" },
        { x: -20, z: -17.8, nature: "la porte de service du supermarché, à l'ouest (arrachée)" },
        { x: 5, z: -6.3, nature: "la vitrine brisée de Gadgets de l'Abondance (le rideau de la porte est baissé)" },
      ]),
      fouille: versCarte("galerie", [
        { x: -18.6, z: 16, quoi: "Tout-Connecté, mur d'écrans : télés de 85 pouces (LED, cuivre, plastique ; 45 kg chacune)" },
        { x: -12, z: 18, quoi: "Tout-Connecté, tables d'exposition : enceintes « intelligentes », téléphones, chargeurs, piles" },
        { x: -8.5, z: 12, quoi: "Tout-Connecté, présentoir : brosses à dents connectées (mini-batteries, petits moteurs)" },
        { x: -15, z: -14, quoi: "Mode Jetable, cabines d'essayage : vêtements synthétiques, une veste presque chaude" },
        { x: -10, z: -8, quoi: "Mode Jetable, portants : vêtements synthétiques, cintres, ceintures" },
        { x: -18.8, z: 6.5, quoi: "Pharma-Express, derrière le comptoir : quelques antalgiques, pansements, une boîte d'antibiotiques oubliée" },
        { x: -14, z: 8.5, quoi: "Pharma-Express, rayons renversés : crèmes solaires « indice 100 », vitamines, alcool" },
        { x: -15.5, z: -2, quoi: "toilettes : savon, rouleaux, miroir (signaux), tuyaux de cuivre" },
        { x: 15.5, z: -2.6, quoi: "food court, comptoirs : ustensiles, friteuse (huile), sachets de sel et de sucre" },
        { x: 14.5, z: 4.5, quoi: "camp des survivants : couvertures, casserole, briquet presque vide, carnet" },
        { x: 13, z: 18, quoi: "Jouets Bavards : piles, petits moteurs, haut-parleurs de jouets qui parlent, peluches (rembourrage)" },
        { x: 13.5, z: -12, quoi: "Gadgets de l'Abondance : grille-pain à reconnaissance faciale (résistance, ressorts), balances connectées (piles, verre)" },
        { x: 9, z: -14, quoi: "pyramide de coffrets « Kit de survie premium » : couteau en plastique doré, bougie parfumée (presque rien, un trophée)" },
        { x: -12, z: -26.5, quoi: "supermarché, la pyramide de 96 rouleaux (légendaire) : 96 allume-feu" },
        { x: -4, z: -22, quoi: "supermarché, rayons : quelques conserves cabossées, sel, pâtes, eau en bouteille" },
        { x: 2, z: -18, quoi: "caisses automatiques : monnaie inutile, écrans, petits haut-parleurs, rouleaux de tickets" },
        { x: 14, z: -25, quoi: "réserve : palettes, cartons de marchandises, transpalette, film étirable" },
        { x: 14, z: -32.5, quoi: "camion de livraison autonome : batterie, caisse de colis, sangles" },
      ]),
      eteints: versCarte("galerie", [
        { x: 1.5, z: 15, type: "errant (dans l'allée)" },
        { x: -2, z: -10, type: "errant (dans l'allée)" },
        { x: -3.5, z: 6, type: "errant (au bord de l'étang)" },
        { x: 4.5, z: 0, type: "rampant (au pied de l'escalator)" },
        { x: -14, z: 15, type: "ancien habitant (vendeur, badge « Demandez-moi ! »)" },
        { x: -13, z: -10, type: "ancien habitant (immobile parmi les mannequins)" },
        { x: -16, z: 6, type: "rampant (sous les rayons renversés de la pharmacie)" },
        { x: -17.5, z: -1.5, type: "putréfié (dans une cabine des toilettes)" },
        { x: 17, z: 7, type: "putréfié (food court, assis à une table vissée)" },
        { x: 12, z: 14, type: "errant (Jouets Bavards)" },
        { x: 15, z: -8, type: "errant (Gadgets de l'Abondance)" },
        { x: -9, z: -22, type: "errant (supermarché)" },
        { x: 6, z: -24, type: "errant (supermarché)" },
        { x: -17, z: -25, type: "gelé (devant les congélateurs, qui ne le sont plus)" },
        { x: 16, z: -26, type: "équipé (gilet de manutentionnaire, casque, dans la réserve)" },
      ]),
    },
  ],
};

// ---------- Mesures ----------

const XO = -20; // façade ouest
const XE = 20; // façade est
const ZSUD = 22; // façade sud (entrée)
const ZNORD = -28; // façade nord (quai)
const XA = 11; // bords de l'atrium (x = ±11)
const ZA1 = -4; // nord de l'atrium
const ZA2 = 10; // sud de l'atrium
const ZS = -16; // front du supermarché
const HB = 5.0; // toit des boutiques
const PARAPET = 5.8;
const HS = 6.2; // toit du supermarché
const NAISSANCE = 8.0; // naissance du berceau
const RAYON = 5.0; // demi-largeur de l'allée
const HA = 9.2; // haut des murs de l'atrium
const MEZZ = 4.6; // la galerie supérieure (inaccessible)
const CUT = 1.0; // coupe des façades côté caméra
const CUTI = 1.2; // coupe des cloisons intérieures
const EP = 0.35;
const EPI = 0.2;
const XP = 8.2; // bord intérieur des coursives de l'étage
const ZPASS = -1.2; // bord sud de la passerelle

const COUL = {
  dallage: 0xe2d9c6,
  dallageSombre: 0xb7ab94,
  dallageSuper: 0xcfd0c8,
  dallageFood: 0xd6b597,
  creme: 0xe3d9c2,
  facade: 0xd6ccb6,
  granit: 0x5e5a56,
  alu: 0x9aa1a4,
  chrome: 0xc9cdd0,
  rideau: 0xb0b2ae,
  toit: 0x8e8b84,
  tole: 0x8d969a,
  rouge: 0xb24a3a,
  ocre: 0xc49a45,
  canard: 0x3f7676,
  asphalte: 0x8c8982,
  trottoir: 0xbdb8ad,
  ligne: 0xe2dfd2,
  jaune: 0xd8b84a,
  bois: 0x9a7a52,
  carton: 0xb08f5f,
  palmeMorte: 0x8f7a55,
  ecorce: 0x7d6a50,
  noir: 0x26282a,
  plastiqueBlanc: 0xe5e2da,
  // Les boutiques (teintes passées)
  tc: 0x9fb4be,
  mode: 0xd7b5bb,
  pharma: 0xc4d9c9,
  wc: 0xb9cdca,
  jouets: 0xe0cc8a,
  gadgets: 0xc4b8d4,
  superMur: 0xd5d6cc,
  food: 0xdfc29a,
};

// ---------- Matières propres au lieu (créées une fois, partagées) ----------

const AL = 1024;
const AH = 2048;

/** L'atlas des enseignes, affiches, écrans et grillages (une seule matière pour tous) : [x, y, l, h] en pixels. */
const R = {
  titre: [0, 0, 1024, 160],
  toutConnecte: [0, 160, 512, 128],
  modeJetable: [512, 160, 512, 128],
  plusPlus: [0, 288, 512, 128],
  burger: [512, 288, 512, 128],
  pharma: [0, 416, 512, 128],
  jouets: [512, 416, 512, 128],
  gadgets: [0, 544, 512, 128],
  sushi: [512, 544, 256, 128],
  crepes: [768, 544, 256, 128],
  watty: [0, 672, 768, 384],
  kit: [768, 672, 256, 384],
  ecran1: [0, 1056, 320, 192],
  ecran2: [320, 1056, 320, 192],
  ecran3: [640, 1056, 320, 192],
  caisse: [0, 1248, 256, 128],
  toilettes: [256, 1248, 256, 128],
  sortie: [512, 1248, 256, 128],
  tvMaj: [768, 1248, 256, 128],
  rideau: [0, 1376, 256, 256],
  graffiti: [256, 1376, 512, 128],
  graffiti2: [256, 1504, 512, 128],
  soldes: [768, 1376, 256, 256],
  pylone: [0, 1632, 1024, 256],
  plan: [0, 1888, 256, 160],
  rayon: [256, 1888, 256, 160],
  grillage: [512, 1888, 256, 160],
  lettreL: [768, 1888, 128, 128],
  lettreO: [896, 1888, 128, 128],
};

let MATS = null;

function matieres() {
  if (MATS) return MATS;
  const atlas = dessiner("galerie-atlas", AL, AH, dessinerAtlas, false);
  const dallage = matiereTexture(dessiner("galerie-dallage", 256, 256, dessinerDallage), { roughness: 0.55 });
  dallage.userData.tuile = 2.4;
  const asphalte = matiereTexture(dessiner("galerie-asphalte", 256, 256, dessinerAsphalte), { roughness: 0.95 });
  asphalte.userData.tuile = 4;
  const enseignes = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.8, alphaTest: 0.5, side: THREE.DoubleSide });
  const neon = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 1.1, vertexColors: true, roughness: 0.5, alphaTest: 0.5, side: THREE.DoubleSide });
  neon.userData.sansOmbre = true;
  MATS = {
    atlas,
    dallage,
    asphalte,
    enduit: matiereMonde("enduit"),
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    eau: matiereEau(0x4a6a3a, 0.86),
    enseignes,
    neon,
    mat: matiere(0.95),
    satin: matiere(0.6, 0.05),
    tole: matiere(0.75, 0.3),
    metal: matiere(0.4, 0.7),
    toile: MAT.toile(),
  };
  return MATS;
}

// ---------- Textures dessinées ----------

const POLICE = '"Arial Black", "Helvetica Neue", Arial, sans-serif';

function texte(g, t, x, y, taille, couleur, poids = "900", align = "center", rotation = 0, largeurMax) {
  g.save();
  g.translate(x, y);
  g.rotate(rotation);
  g.font = `${poids} ${taille}px ${POLICE}`;
  g.fillStyle = couleur;
  g.textAlign = align;
  g.textBaseline = "middle";
  if (largeurMax) g.fillText(t, 0, 0, largeurMax);
  else g.fillText(t, 0, 0);
  g.restore();
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

/** Grain, coulures et taches, limités à un rectangle. */
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

/** Watty, la pile souriante : clin d'œil, éclair rouge sur le ventre, une prise à la main, chaussures rouges. */
function dessinerWatty(g, cx, cy, s) {
  const w = s * 0.56;
  const h = s;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const encre = "#1f2526";
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = encre;
  for (const sx of [-1, 1]) {
    g.lineWidth = s * 0.06;
    g.beginPath();
    g.moveTo(cx + sx * w * 0.22, y + h - 2);
    g.lineTo(cx + sx * w * 0.3, y + h + s * 0.2);
    g.stroke();
    g.fillStyle = "#c8362b";
    g.beginPath();
    g.ellipse(cx + sx * w * 0.38, y + h + s * 0.23, s * 0.11, s * 0.055, 0, 0, PI * 2);
    g.fill();
    g.lineWidth = s * 0.02;
    g.stroke();
  }
  // Le bras du salut, la main à la prise
  g.lineWidth = s * 0.06;
  g.beginPath();
  g.moveTo(x + 2, y + h * 0.5);
  g.quadraticCurveTo(x - s * 0.2, y + h * 0.45, x - s * 0.22, y + h * 0.2);
  g.stroke();
  g.fillStyle = "#f2ead6";
  g.beginPath();
  g.arc(x - s * 0.22, y + h * 0.17, s * 0.065, 0, PI * 2);
  g.fill();
  g.lineWidth = s * 0.02;
  g.stroke();
  g.lineWidth = s * 0.06;
  g.beginPath();
  g.moveTo(x + w - 2, y + h * 0.55);
  g.quadraticCurveTo(x + w + s * 0.15, y + h * 0.62, x + w + s * 0.2, y + h * 0.5);
  g.stroke();
  const px = x + w + s * 0.2;
  const py = y + h * 0.47;
  g.fillStyle = "#c79a3b";
  g.fillRect(px - s * 0.045, py - s * 0.21, s * 0.025, s * 0.09);
  g.fillRect(px + s * 0.02, py - s * 0.21, s * 0.025, s * 0.09);
  g.fillStyle = "#e9dfc6";
  g.fillRect(px - s * 0.07, py - s * 0.13, s * 0.14, s * 0.15);
  g.lineWidth = s * 0.02;
  g.strokeRect(px - s * 0.07, py - s * 0.13, s * 0.14, s * 0.15);
  // Le corps
  rectArrondi(g, x, y, w, h, s * 0.1);
  g.fillStyle = "#2f6f73";
  g.fill();
  g.save();
  rectArrondi(g, x, y, w, h, s * 0.1);
  g.clip();
  g.fillStyle = "#e9dfc6";
  g.fillRect(x, y, w, h * 0.2);
  g.fillStyle = encre;
  g.fillRect(x, y + h * 0.2 - s * 0.012, w, s * 0.024);
  g.fillStyle = "rgba(255,255,255,0.16)";
  g.fillRect(x + w * 0.1, y + h * 0.26, w * 0.1, h * 0.64);
  g.restore();
  rectArrondi(g, x, y, w, h, s * 0.1);
  g.lineWidth = s * 0.035;
  g.stroke();
  g.fillStyle = "#c79a3b";
  g.fillRect(cx - w * 0.17, y - s * 0.08, w * 0.34, s * 0.09);
  g.lineWidth = s * 0.022;
  g.strokeRect(cx - w * 0.17, y - s * 0.08, w * 0.34, s * 0.09);
  texte(g, "+", cx, y + h * 0.1, s * 0.15, "#c8362b");
  // Le clin d'œil
  const ey = y + h * 0.34;
  g.fillStyle = "#f6f0e0";
  g.beginPath();
  g.ellipse(cx - w * 0.2, ey, s * 0.06, s * 0.075, 0, 0, PI * 2);
  g.fill();
  g.lineWidth = s * 0.018;
  g.stroke();
  g.fillStyle = encre;
  g.beginPath();
  g.arc(cx - w * 0.18, ey + s * 0.012, s * 0.03, 0, PI * 2);
  g.fill();
  g.lineWidth = s * 0.03;
  g.beginPath();
  g.arc(cx + w * 0.2, ey + s * 0.03, s * 0.055, PI * 1.1, PI * 1.9);
  g.stroke();
  g.lineWidth = s * 0.035;
  g.beginPath();
  g.arc(cx, y + h * 0.42, w * 0.27, PI * 0.15, PI * 0.85);
  g.stroke();
  // L'éclair
  const bx = cx;
  const by = y + h * 0.72;
  const e = s * 0.17;
  g.fillStyle = "#c8362b";
  g.beginPath();
  g.moveTo(bx + e * 0.2, by - e);
  g.lineTo(bx - e * 0.45, by + e * 0.12);
  g.lineTo(bx - e * 0.02, by + e * 0.12);
  g.lineTo(bx - e * 0.22, by + e);
  g.lineTo(bx + e * 0.45, by - e * 0.15);
  g.lineTo(bx + e * 0.03, by - e * 0.15);
  g.closePath();
  g.fill();
  g.lineWidth = s * 0.018;
  g.stroke();
  g.restore();
}

/** Une enseigne de boutique : fond, liseré, nom, slogan. */
function enseigne(g, a, r, fond, couleur, nom, slogan, couleurSlogan, liseré) {
  const [x, y, l, h] = r;
  g.fillStyle = fond;
  g.fillRect(x, y, l, h);
  if (liseré) {
    g.fillStyle = liseré;
    g.fillRect(x, y + h - 16, l, 10);
  }
  texte(g, nom, x + l / 2, y + h * (slogan ? 0.4 : 0.5), slogan ? 58 : 64, couleur, "900", "center", 0, l - 30);
  if (slogan) texte(g, slogan, x + l / 2, y + h * 0.78, 22, couleurSlogan ?? couleur, "800", "center", 0, l - 40);
  salir(g, a, x, y, l, h, 1.3);
}

function dessinerAtlas(g) {
  const a = aleatoire(2031);
  g.clearRect(0, 0, AL, AH);

  // Le titre de la façade : lettres rouges sur fond transparent, le L et le O sont tombés, le N pend de travers
  {
    const [x, y, l, h] = R.titre;
    const t = "GALERIE DE L'ABONDANCE";
    g.font = `900 112px ${POLICE}`;
    const total = g.measureText(t).width;
    const ech = Math.min(1, (l - 30) / total);
    let cx = x + (l - total * ech) / 2;
    for (let i = 0; i < t.length; i++) {
      const ch = t[i];
      g.font = `900 112px ${POLICE}`;
      const w = g.measureText(ch).width * ech;
      const mid = cx + w / 2;
      if (i === 2 || i === 15) {
        // la trace de la lettre tombée, et ses deux pattes de fixation
        g.fillStyle = "#4a4440";
        g.fillRect(mid - 14, y + h / 2 - 6, 6, 12);
        g.fillRect(mid + 8, y + h / 2 - 6, 6, 12);
      } else if (i === 17) {
        texte(g, ch, mid + 4, y + h / 2 + 18, 112 * ech + 8, "#b5463a", "900", "center", 0.42);
      } else if (ch !== " ") {
        // contour crème, cœur rouge passé
        g.save();
        g.font = `900 ${112 * ech + 8}px ${POLICE}`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.lineWidth = 9;
        g.strokeStyle = "#e9dfc6";
        g.strokeText(ch, mid, y + h / 2);
        g.fillStyle = i % 5 === 3 ? "#a8473b" : "#bb4a3a";
        g.fillText(ch, mid, y + h / 2);
        g.restore();
      }
      cx += w;
    }
    // des coulures de rouille sous les lettres
    g.save();
    g.globalCompositeOperation = "source-atop";
    salir(g, a, x, y, l, h, 1.6);
    g.restore();
  }

  enseigne(g, a, R.toutConnecte, "#1f3a48", "#bfe6ff", "TOUT-CONNECTÉ", "Votre maison pense pour vous", "#7fb7d0", "#4fb0d8");
  enseigne(g, a, R.modeJetable, "#e9dfc6", "#c0466e", "MODE JETABLE", "Portez-le une fois !", "#6a5060", "#c0466e");
  enseigne(g, a, R.plusPlus, "#c8362b", "#f3ead6", "PLUS-PLUS", "SUPERMARCHÉ · TOUJOURS PLUS", "#ffd9a0", "#e9b84a");
  enseigne(g, a, R.burger, "#d8a03a", "#3a1f14", "BURGER INSTANTANÉ", "Prêt avant d'avoir faim", "#5a3020", "#c8362b");
  // Pharma-Express : croix verte
  {
    const [x, y, l, h] = R.pharma;
    g.fillStyle = "#e6ebe3";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#3f9a5f";
    g.fillRect(x + 30, y + 46, 76, 28);
    g.fillRect(x + 54, y + 22, 28, 76);
    texte(g, "PHARMA-EXPRESS", x + 300, y + 52, 46, "#2f6a49", "900", "center", 0, 360);
    texte(g, "Votre ordonnance en 1 clic", x + 300, y + 96, 20, "#4f7a63", "800");
    salir(g, a, x, y, l, h, 1.4);
  }
  // Jouets Bavards : lettres de toutes les couleurs
  {
    const [x, y, l, h] = R.jouets;
    g.fillStyle = "#f0e2b0";
    g.fillRect(x, y, l, h);
    const t = "JOUETS BAVARDS";
    const tons = ["#c8362b", "#2f6f73", "#d8a03a", "#6a4f8a", "#3f8f5a"];
    g.font = `900 52px ${POLICE}`;
    let cx = x + (l - g.measureText(t).width) / 2;
    for (let i = 0; i < t.length; i++) {
      const w = g.measureText(t[i]).width;
      texte(g, t[i], cx + w / 2, y + 52 + (i % 2 ? -5 : 5), 52, tons[i % tons.length], "900", "center", (i % 3 - 1) * 0.12);
      cx += w;
    }
    texte(g, "Ils parlent. Ils ne s'arrêtent jamais.", x + l / 2, y + 102, 20, "#6a5a3a", "800");
    salir(g, a, x, y, l, h, 1.3);
  }
  enseigne(g, a, R.gadgets, "#2a2440", "#e9c86a", "GADGETS DE L'ABONDANCE", "Vous n'en aviez pas besoin. Maintenant, si.", "#c4b8d4", "#c79a3b");
  // Sushi-Drone et Crêpes 3D
  {
    const [x, y, l, h] = R.sushi;
    g.fillStyle = "#e9e4da";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#c8362b";
    g.beginPath();
    g.arc(x + 40, y + 64, 26, 0, PI * 2);
    g.fill();
    texte(g, "SUSHI", x + 150, y + 46, 40, "#1f2526");
    texte(g, "-DRONE", x + 150, y + 88, 34, "#c8362b");
    salir(g, a, x, y, l, h, 1.3);
  }
  {
    const [x, y, l, h] = R.crepes;
    g.fillStyle = "#6a4f8a";
    g.fillRect(x, y, l, h);
    texte(g, "CRÊPES", x + l / 2, y + 46, 44, "#f3ead6");
    texte(g, "IMPRIMÉES EN 3D", x + l / 2, y + 92, 20, "#e9c86a", "800");
    salir(g, a, x, y, l, h, 1.3);
  }
  // Le panneau géant de Watty (toit) : « Watty vous recharge ! », corrigé à la bombe
  {
    const [x, y, l, h] = R.watty;
    g.fillStyle = "#e9dfc6";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#c8362b";
    g.fillRect(x, y, l, 70);
    texte(g, "WATTY VOUS RECHARGE !", x + l / 2, y + 36, 46, "#f3ead6");
    dessinerWatty(g, x + 150, y + 200, 170);
    texte(g, "Toujours plein,", x + 500, y + 140, 50, "#2f6f73");
    texte(g, "jamais à plat !", x + 500, y + 200, 50, "#2f6f73");
    texte(g, "Rechargez-vous à la Galerie de l'Abondance", x + 500, y + 258, 22, "#3a2f28", "800");
    texte(g, "Bornes Watty à tous les niveaux · 1er kWh offert*", x + 500, y + 288, 16, "#6e6152", "700");
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y + h - 26, l, 26);
    // La correction des survivants
    texte(g, "WATTY MENT !", x + 520, y + 335, 46, "rgba(25,24,22,0.88)", "900", "center", -0.06);
    g.strokeStyle = "rgba(25,24,22,0.85)";
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(x + 330, y + 205);
    g.lineTo(x + 680, y + 190);
    g.stroke();
    // déchiré en haut à droite
    g.clearRect(x + 640, y, 128, 60);
    g.clearRect(x + 700, y + 60, 68, 50);
    salir(g, a, x, y, l, h, 1.8);
  }
  // Coffret « Kit de survie premium » (affiche)
  {
    const [x, y, l, h] = R.kit;
    g.fillStyle = "#1e1c1a";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "#c79a3b";
    g.lineWidth = 6;
    g.strokeRect(x + 12, y + 12, l - 24, h - 24);
    texte(g, "KIT DE SURVIE", x + l / 2, y + 60, 28, "#e9c86a");
    texte(g, "PREMIUM", x + l / 2, y + 96, 34, "#e9c86a");
    // le couteau doré, la bougie, le livret
    g.fillStyle = "#c79a3b";
    g.fillRect(x + 50, y + 150, 120, 14);
    g.beginPath();
    g.moveTo(x + 170, y + 150);
    g.lineTo(x + 210, y + 157);
    g.lineTo(x + 170, y + 164);
    g.fill();
    g.fillStyle = "#d9c7e6";
    g.fillRect(x + 70, y + 190, 50, 64);
    g.fillStyle = "#ffcf6a";
    g.beginPath();
    g.ellipse(x + 95, y + 182, 6, 12, 0, 0, PI * 2);
    g.fill();
    g.fillStyle = "#e9dfc6";
    g.fillRect(x + 140, y + 196, 56, 58);
    texte(g, "Méditer", x + 168, y + 216, 12, "#3a2f28", "800");
    texte(g, "sans réseau", x + 168, y + 234, 10, "#3a2f28", "700");
    texte(g, "Couteau plaqué or · Bougie", x + l / 2, y + 290, 13, "#c4b8a0", "700");
    texte(g, "« Lavande des abris »", x + l / 2, y + 310, 13, "#c4b8a0", "700");
    texte(g, "999,99", x + l / 2, y + 348, 34, "#c8362b");
    salir(g, a, x, y, l, h, 1);
  }
  // Les trois images de l'écran publicitaire qui boucle encore
  {
    // 1. Watty
    let [x, y, l, h] = R.ecran1;
    let d = g.createLinearGradient(x, y, x + l, y + h);
    d.addColorStop(0, "#1d6f8f");
    d.addColorStop(1, "#7a2a8f");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
    dessinerWatty(g, x + 70, y + 86, 92);
    texte(g, "Toujours plein,", x + 215, y + 64, 30, "#fff3c0");
    texte(g, "jamais à plat !", x + 215, y + 102, 30, "#fff3c0");
    texte(g, "Bornes Watty · Niveau 2", x + 215, y + 150, 16, "#bfe6ff", "800");
    // 2. Soldes
    [x, y, l, h] = R.ecran2;
    g.fillStyle = "#e0245a";
    g.fillRect(x, y, l, h);
    texte(g, "SOLDES", x + l / 2, y + 52, 58, "#fff6a0");
    texte(g, "−90 %", x + l / 2, y + 112, 64, "#ffffff");
    texte(g, "TOUT DOIT DISPARAÎTRE", x + l / 2, y + 164, 22, "#ffd6e4");
    // 3. Ouvert 24 h/24
    [x, y, l, h] = R.ecran3;
    d = g.createLinearGradient(x, y, x, y + h);
    d.addColorStop(0, "#2a9a6a");
    d.addColorStop(1, "#1b4a7a");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
    texte(g, "OUVERT", x + l / 2, y + 48, 48, "#ffffff");
    texte(g, "24 h/24 · 365 j/an", x + l / 2, y + 98, 30, "#c9ffe6");
    texte(g, "Vous nous manquez !", x + l / 2, y + 150, 24, "#ffe9a8", "800");
    // le bandeau des pixels morts, sur les trois images
    for (const r of [R.ecran1, R.ecran2, R.ecran3]) {
      g.fillStyle = "rgba(0,0,0,0.55)";
      g.fillRect(r[0] + 230, r[1], 10, r[3]);
      g.fillStyle = "rgba(255,255,255,0.25)";
      g.fillRect(r[0], r[1] + 120, r[2], 3);
    }
  }
  // Caisse automatique : « Article inattendu dans la zone d'ensachage »
  {
    const [x, y, l, h] = R.caisse;
    g.fillStyle = "#123342";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#d8a03a";
    g.fillRect(x, y, l, 30);
    texte(g, "ATTENTION", x + l / 2, y + 16, 22, "#1f2526");
    texte(g, "Article inattendu dans", x + l / 2, y + 56, 19, "#e8f6ff", "800");
    texte(g, "la zone d'ensachage.", x + l / 2, y + 80, 19, "#e8f6ff", "800");
    texte(g, "Un employé arrive.", x + l / 2, y + 108, 16, "#9cc7dd", "700");
  }
  // Toilettes connectées
  {
    const [x, y, l, h] = R.toilettes;
    g.fillStyle = "#2f5f6b";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#f0ebdc";
    for (const [px, robe] of [[40, false], [90, true]]) {
      g.beginPath();
      g.arc(x + px, y + 30, 11, 0, PI * 2);
      g.fill();
      if (robe) {
        g.beginPath();
        g.moveTo(x + px, y + 44);
        g.lineTo(x + px + 18, y + 90);
        g.lineTo(x + px - 18, y + 90);
        g.fill();
      } else g.fillRect(x + px - 11, y + 44, 22, 46);
      g.fillRect(x + px - 8, y + 88, 6, 26);
      g.fillRect(x + px + 2, y + 88, 6, 26);
    }
    texte(g, "TOILETTES", x + 186, y + 40, 22, "#f0ebdc", "900", "center", 0, 130);
    texte(g, "connectées", x + 186, y + 64, 16, "#c9e0e0", "800");
    texte(g, "Veuillez vous", x + 186, y + 92, 13, "#f0ebdc", "700");
    texte(g, "identifier", x + 186, y + 108, 13, "#f0ebdc", "700");
    salir(g, a, x, y, l, h, 1.2);
  }
  // SORTIE : néon vert de secours
  {
    const [x, y, l, h] = R.sortie;
    g.fillStyle = "#1f8a4c";
    g.fillRect(x, y, l, h);
    texte(g, "SORTIE", x + l * 0.6, y + h / 2, 52, "#effff4");
    g.strokeStyle = "#effff4";
    g.fillStyle = "#effff4";
    g.lineWidth = 9;
    g.lineCap = "round";
    const bx = x + 36;
    const by = y + 40;
    g.beginPath();
    g.arc(bx + 6, by - 8, 8, 0, 7);
    g.fill();
    g.beginPath();
    g.moveTo(bx + 2, by + 6);
    g.lineTo(bx - 4, by + 34);
    g.lineTo(bx - 18, by + 54);
    g.moveTo(bx - 4, by + 34);
    g.lineTo(bx + 14, by + 50);
    g.lineTo(bx + 10, by + 66);
    g.moveTo(bx - 14, by + 14);
    g.lineTo(bx + 2, by + 6);
    g.lineTo(bx + 18, by + 22);
    g.stroke();
  }
  // L'écran d'une télé : « Mise à jour requise »
  {
    const [x, y, l, h] = R.tvMaj;
    g.fillStyle = "#101418";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#1f4f8f";
    g.fillRect(x + 20, y + 20, l - 40, h - 40);
    texte(g, "Mise à jour requise", x + l / 2, y + 52, 20, "#ffffff", "800");
    g.fillStyle = "#e9e9e9";
    g.fillRect(x + 50, y + 78, 156, 10);
    g.fillStyle = "#6fd06f";
    g.fillRect(x + 50, y + 78, 4, 10);
    texte(g, "2 %", x + l / 2, y + 98, 14, "#c9d9ff", "700");
    // fêlure
    g.strokeStyle = "rgba(230,240,255,0.6)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x + 200, y);
    g.lineTo(x + 170, y + 50);
    g.lineTo(x + 190, y + 80);
    g.lineTo(x + 150, y + 128);
    g.moveTo(x + 170, y + 50);
    g.lineTo(x + 256, y + 70);
    g.stroke();
  }
  // Rideau de fer : lames ondulées, rouille, tags
  {
    const [x, y, l, h] = R.rideau;
    g.fillStyle = "#b7b8b2";
    g.fillRect(x, y, l, h);
    for (let yy = 0; yy < h; yy += 12) {
      const d = g.createLinearGradient(0, y + yy, 0, y + yy + 12);
      d.addColorStop(0, "rgba(255,255,255,0.35)");
      d.addColorStop(0.5, "rgba(0,0,0,0.05)");
      d.addColorStop(1, "rgba(0,0,0,0.3)");
      g.fillStyle = d;
      g.fillRect(x, y + yy, l, 12);
    }
    taches(g, a, 0, "rgba(0,0,0,0)", 1, 2, 1, 1);
    g.save();
    g.beginPath();
    g.rect(x, y, l, h);
    g.clip();
    for (let i = 0; i < 14; i++) {
      const cx = x + a() * l;
      const cy = y + a() * h;
      const r = 6 + a() * 22;
      const d = g.createRadialGradient(cx, cy, 0, cx, cy, r);
      d.addColorStop(0, "rgba(140,70,35,0.55)");
      d.addColorStop(1, "rgba(140,70,35,0)");
      g.fillStyle = d;
      g.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    g.restore();
    texte(g, "PILLÉ", x + 120, y + 120, 54, "rgba(30,29,27,0.85)", "900", "center", -0.1);
    texte(g, "zZz", x + 200, y + 200, 30, "rgba(160,40,40,0.8)", "900", "center", 0.1);
    salir(g, a, x, y, l, h, 1.2);
  }
  // Graffitis des survivants
  {
    const [x, y, l, h] = R.graffiti;
    texte(g, "NE PAS RÉVEILLER", x + l / 2, y + 44, 50, "rgba(30,29,27,0.9)", "900", "center", -0.04, l - 20);
    texte(g, "LES CLIENTS", x + l / 2 + 20, y + 98, 52, "rgba(30,29,27,0.9)", "900", "center", -0.03);
  }
  {
    const [x, y, l, h] = R.graffiti2;
    texte(g, "TOUT A DISPARU", x + l / 2, y + 50, 52, "rgba(150,40,40,0.9)", "900", "center", 0.03, l - 20);
    texte(g, "(sauf les soldes)", x + l / 2, y + 100, 30, "rgba(30,29,27,0.85)", "800", "center", 0.02);
  }
  // Affiche « SOLDES −90 % »
  {
    const [x, y, l, h] = R.soldes;
    g.fillStyle = "#e9dfc6";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#c8362b";
    g.fillRect(x, y, l, 120);
    texte(g, "SOLDES", x + l / 2, y + 44, 54, "#f3ead6");
    texte(g, "−90 %", x + l / 2, y + 96, 44, "#ffe28a");
    texte(g, "TOUT DOIT", x + l / 2, y + 160, 34, "#3a2f28");
    texte(g, "DISPARAÎTRE", x + l / 2, y + 200, 30, "#3a2f28");
    g.clearRect(x + 180, y + 210, 76, 46);
    salir(g, a, x, y, l, h, 1.6);
  }
  // Le pylône : fond rouge, lettres crème (il en manque), bandeau des boutiques
  {
    const [x, y, l, h] = R.pylone;
    g.fillStyle = "#b8473a";
    g.fillRect(x, y, l, 168);
    g.fillStyle = "#e9dfc6";
    g.fillRect(x, y + 168, l, 88);
    const t = "GALERIE DE L'ABONDANCE";
    g.font = `900 84px ${POLICE}`;
    const total = g.measureText(t).width;
    const ech = Math.min(1, (l - 40) / total);
    let cx = x + (l - total * ech) / 2;
    for (let i = 0; i < t.length; i++) {
      g.font = `900 84px ${POLICE}`;
      const w = g.measureText(t[i]).width * ech;
      if (i !== 2 && i !== 15) texte(g, t[i], cx + w / 2, y + 66, 84 * ech + 6, i === 9 ? "#d9c9a6" : "#f3ead6", "900", "center", i === 9 ? 0.2 : 0);
      cx += w;
    }
    texte(g, "142 BOUTIQUES · PARKING GRATUIT · OUVERT 24 h/24", x + l / 2, y + 140, 26, "#ffd9a0", "800");
    const noms = ["TOUT-CONNECTÉ", "MODE JETABLE", "PLUS-PLUS", "JOUETS BAVARDS", "PHARMA-EXPRESS"];
    const tons = ["#1f3a48", "#c0466e", "#c8362b", "#d8a03a", "#2f6a49"];
    noms.forEach((n, i) => texte(g, n, x + 104 + i * 204, y + 212, 26, tons[i], "900", "center", 0, 190));
    salir(g, a, x, y, l, h, 2);
  }
  // Plan du centre : « Vous êtes ici »
  {
    const [x, y, l, h] = R.plan;
    g.fillStyle = "#2f4f5d";
    g.fillRect(x, y, l, h);
    texte(g, "PLAN DU CENTRE", x + l / 2, y + 18, 18, "#f0ebdc");
    const cases = [[20, 40, 60, 40, "#9fb4be"], [20, 84, 60, 50, "#d7b5bb"], [176, 40, 60, 40, "#e0cc8a"], [176, 84, 60, 50, "#c4b8d4"], [86, 34, 84, 26, "#cfd0c8"]];
    for (const [px, py, pl, ph, t] of cases) {
      g.fillStyle = t;
      g.fillRect(x + px, y + py, pl, ph);
    }
    g.fillStyle = "#e2d9c6";
    g.fillRect(x + 86, y + 62, 84, 90);
    g.fillStyle = "#4a6a3a";
    g.beginPath();
    g.arc(x + 128, y + 100, 16, 0, PI * 2);
    g.fill();
    g.fillStyle = "#c8362b";
    g.beginPath();
    g.arc(x + 128, y + 140, 7, 0, PI * 2);
    g.fill();
    texte(g, "Vous êtes ici", x + 128, y + 152, 11, "#c8362b", "800");
    salir(g, a, x, y, l, h, 1.4);
  }
  // Rayon de produits (faces de gondoles) : boîtes colorées, des trous partout
  {
    const [x, y, l, h] = R.rayon;
    g.fillStyle = "#cfd0c8";
    g.fillRect(x, y, l, h);
    const tons = ["#c8362b", "#e0b040", "#2f6f73", "#e9dfc6", "#6a4f8a", "#3f8f5a", "#d97b4a"];
    for (let r = 0; r < 4; r++) {
      g.fillStyle = "#8a8d8a";
      g.fillRect(x, y + 36 + r * 40, l, 4);
      let px = x + 4;
      while (px < x + l - 10) {
        const w = 10 + a() * 18;
        if (a() < 0.55) {
          px += w + 2;
          continue;
        }
        const hh = 14 + a() * 18;
        g.fillStyle = tons[Math.floor(a() * tons.length)];
        g.fillRect(px, y + 36 + r * 40 - hh, w, hh);
        px += w + 2;
      }
    }
    salir(g, a, x, y, l, h, 1);
  }
  // Grillage de caddie : fils d'acier, fond transparent
  {
    const [x, y, l, h] = R.grillage;
    g.strokeStyle = "#c9cdd0";
    g.lineWidth = 3;
    for (let k = 0; k <= l; k += 16) {
      g.beginPath();
      g.moveTo(x + k, y);
      g.lineTo(x + k, y + h);
      g.stroke();
    }
    for (let k = 0; k <= h; k += 16) {
      g.beginPath();
      g.moveTo(x, y + k);
      g.lineTo(x + l, y + k);
      g.stroke();
    }
    g.lineWidth = 6;
    g.strokeRect(x + 3, y + 3, l - 6, h - 6);
  }
  // Les lettres tombées (L et O)
  for (const [r, ch] of [[R.lettreL, "L"], [R.lettreO, "O"]]) {
    const [x, y, l, h] = r;
    g.save();
    g.font = `900 120px ${POLICE}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineWidth = 9;
    g.strokeStyle = "#e9dfc6";
    g.strokeText(ch, x + l / 2, y + h / 2 + 4);
    g.fillStyle = "#b5463a";
    g.fillText(ch, x + l / 2, y + h / 2 + 4);
    g.restore();
  }
}

/** Dallage de grès poli : dalles de 60 cm, joints, reflets, salissures. Tuile de 2,4 m. */
function dessinerDallage(g) {
  const a = aleatoire(77);
  g.fillStyle = "#a9a49a";
  g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 4; x++) for (let y = 0; y < 4; y++) {
    const v = 232 + Math.floor((a() - 0.5) * 16);
    g.fillStyle = (x + y) % 2 ? `rgb(${v},${v - 3},${v - 9})` : `rgb(${v - 10},${v - 13},${v - 18})`;
    g.fillRect(x * 64 + 1.5, y * 64 + 1.5, 61, 61);
    g.fillStyle = "rgba(255,255,255,0.12)";
    g.fillRect(x * 64 + 6, y * 64 + 6, 20, 3);
  }
  taches(g, a, 12, "rgba(80, 70, 50, 0.18)", 8, 34, 256, 256);
  g.strokeStyle = "rgba(60,55,50,0.35)";
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

/** Asphalte fatigué : grain, plaques reprises, fissures en réseau, taches d'huile. Tuile de 4 m. */
function dessinerAsphalte(g) {
  const a = aleatoire(57);
  g.fillStyle = "#c9c6bf";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5000; i++) {
    const v = 150 + Math.floor(a() * 90);
    g.fillStyle = `rgba(${v},${v},${v - 6},0.35)`;
    g.fillRect(a() * 256, a() * 256, 1 + a() * 2, 1 + a() * 2);
  }
  g.fillStyle = "rgba(60,58,52,0.16)";
  g.fillRect(30, 140, 130, 80);
  taches(g, a, 7, "rgba(30, 28, 24, 0.25)", 8, 26, 256, 256);
  taches(g, a, 6, "rgba(90, 110, 60, 0.22)", 10, 30, 256, 256);
  g.strokeStyle = "rgba(40,38,34,0.55)";
  g.lineWidth = 1.5;
  for (let i = 0; i < 10; i++) {
    let x = a() * 256;
    let y = a() * 256;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 7; k++) {
      x += (a() - 0.5) * 50;
      y += (a() - 0.5) * 50;
      g.lineTo(x, y);
    }
    g.stroke();
  }
}

// ---------- Outils géométriques ----------

const GEO = {};
function geoCylindre(r, h, cotes) {
  const cle = `cyl|${r}|${h}|${cotes}`;
  if (!GEO[cle]) GEO[cle] = new THREE.CylinderGeometry(r, r, h, cotes);
  return GEO[cle];
}
function geoBoule(r, detail = 0) {
  const cle = `ico|${r}|${detail}`;
  if (!GEO[cle]) GEO[cle] = new THREE.IcosahedronGeometry(r, detail);
  return GEO[cle];
}

/** Un panneau plat dont l'image vient de l'atlas (région `r`, éventuellement une sous-partie verticale [v1, v2] de 0 en bas à 1 en haut), face vers +z local. */
function panneau(c, mat, r, pose, l, h, v1 = 0, v2 = 1) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i);
    const v = v1 + uv.getY(i) * (v2 - v1);
    uv.setXY(i, (px + u * pw) / AL, 1 - (py + (1 - v) * ph) / AH);
  }
  c.poser(g, mat, 0xffffff, pose, { crasse: false, nuance: 0 });
  g.dispose();
}

function repereMur(a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  return { L: Math.hypot(dx, dz), ry: -Math.atan2(dz, dx), dx, dz };
}

/** [u1, u2] privé des intervalles `trous`. */
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

/** Les ouvertures d'un mur ramenées à la tranche [p0, p1] (toutes deviennent des vides). */
function tranche(ouvertures, p0, p1) {
  return ouvertures
    .filter((o) => o.haut > p0 + 0.01 && o.bas < p1 - 0.01)
    .map((o) => ({ ...o, type: "vide", bas: Math.max(0, o.bas - p0), haut: Math.min(p1 - p0 + 0.5, o.haut - p0) }));
}

/**
 * Un mur coupé : le bas (0 → `cut`) reste toujours visible, le haut (`cut` → h) va dans la couche `T`.
 * Les obstacles (pour le jeu) suivent les ouvertures « passantes » (par défaut : celles qui descendent au sol).
 */
function murCoupe(k, T, a, b, spec) {
  const { h, cut = CUT, ouvertures = [], breches = [], obstacles = true, ...reste } = spec;
  if (cut > 0) mur(k.c, a, b, { ...reste, h: Math.min(cut, h), ouvertures: tranche(ouvertures, 0, cut) });
  if (h > cut) mur(cut > 0 ? T : k.c, a, b, { ...reste, y0: cut, h: h - cut, ouvertures: tranche(ouvertures, cut, h), breches });
  if (obstacles) {
    const { L, dx, dz } = repereMur(a, b);
    const trous = ouvertures.filter((o) => o.passage ?? (o.bas < 0.5 && o.haut > 0.5)).map((o) => [o.u - o.l / 2, o.u + o.l / 2]);
    for (const [u1, u2] of soustraire(0, L, trous)) k.b.obstacle(a[0] + (dx * u1) / L, a[1] + (dz * u1) / L, a[0] + (dx * u2) / L, a[1] + (dz * u2) / L);
  }
}

/** Des bandes horizontales en saillie sur la face extérieure (+z local) d'un mur : [{ y1, y2, s, couleur, mat, ch, trous }]. */
function bandes(a, b, ep, liste) {
  const { L, ry } = repereMur(a, b);
  for (const bd of liste) {
    const d = bd.deborde ?? bd.s;
    bd.ch.repere({ x: a[0], z: a[1], ry }, () => {
      for (const [u1, u2] of soustraire(-d, L + d, bd.trous ?? [])) bd.ch.pave(u1, bd.y1, ep / 2 - 0.02, u2, bd.y2, ep / 2 + bd.s, bd.couleur, bd.mat, { nuance: 0.03, crasse: bd.y1 < 1 });
    });
  }
}

/** Un carreau de verre (repère local : x, y, plan z), entier, en éclats aux coins, ou disparu. */
function carreau(ch, verre, x0, y0, l, h, bris, z = 0) {
  const r = ch.hasard();
  if (r > bris) {
    ch.boite(l - 0.04, h - 0.04, 0.012, 0xffffff, { x: x0 + l / 2, y: y0 + h / 2, z }, verre, { crasse: false });
  } else if (r > bris * 0.4) {
    const coins = [[x0, y0, 1, 1], [x0 + l, y0 + h, -1, -1], [x0 + l, y0, -1, 1], [x0, y0 + h, 1, -1]];
    for (let k = 0; k < 2; k++) {
      const [cx, cy, sx, sy] = coins[Math.floor(ch.hasard() * 4)];
      const p = [cx, cy, z, cx + sx * l * ch.entre(0.25, 0.7), cy, z, cx, cy + sy * h * ch.entre(0.25, 0.7), z];
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
      g.computeVertexNormals();
      ch.poser(g, verre, 0xffffff, {}, { crasse: false, nuance: 0 });
    }
  }
}

/**
 * Un vitrage (dans le repère du mur a→b : u le long, y en haut, +z dehors) de u1 à u2, de y1 à y2 : montants en alu
 * tous les `pas` mètres, traverses aux hauteurs `traverses`. Ce qui est sous `cut` va dans `bas`, le reste dans `haut`.
 */
function vitrage(k, bas, haut, a, b, u1, u2, y1, y2, o = {}) {
  const { ry } = repereMur(a, b);
  const cut = o.cut ?? CUT;
  const n = Math.max(1, Math.round((u2 - u1) / (o.pas ?? 2)));
  const lc = (u2 - u1) / n;
  const bris = o.bris ?? k.bris;
  const z = o.z ?? 0;
  const ys = [y1, ...(o.traverses ?? []), y2];
  if (cut > y1 && cut < y2 && !ys.some((v) => Math.abs(v - cut) < 0.05)) ys.push(cut);
  ys.sort((p, q) => p - q);
  const cadre = o.cadre ?? COUL.alu;
  const ch = (yb) => (yb <= cut + 1e-6 ? bas : haut);
  for (const c of new Set([bas, haut])) {
    c.repere({ x: a[0], z: a[1], ry }, () => {
      for (let j = 0; j < ys.length - 1; j++) {
        if (ch(ys[j + 1]) !== c) continue;
        for (let i = 0; i < n; i++) carreau(c, k.m.verre, u1 + i * lc, ys[j], lc, ys[j + 1] - ys[j], bris, z);
        // les montants de cette rangée
        for (let i = 0; i <= n; i++) c.pave(u1 + i * lc - 0.04, ys[j], z - 0.05, u1 + i * lc + 0.04, ys[j + 1], z + 0.05, cadre, k.m.metal, { nuance: 0.02, crasse: false });
        // la traverse du haut de la rangée
        c.pave(u1, ys[j + 1] - 0.04, z - 0.05, u2, ys[j + 1] + 0.04, z + 0.05, cadre, k.m.metal, { nuance: 0.02, crasse: false });
        if (j === 0) c.pave(u1, ys[0], z - 0.06, u2, ys[0] + 0.08, z + 0.06, cadre, k.m.metal, { nuance: 0.02, crasse: false });
      }
    });
  }
}

/**
 * Un rideau de fer (repère du mur a→b, posé sur la face `cote` : +1 dehors, -1 dedans) devant l'ouverture centrée en u,
 * de largeur l, de hauteur `ht`. États : « leve », « baisse », « mi » (coincé à 2,1 m), « force » (coin tordu),
 * « arrache » (pend d'un côté, une lame au sol).
 */
function rideauDeFer(k, T, a, b, u, l, ht, etat, cote = 1) {
  const { ry } = repereMur(a, b);
  const m = k.m;
  const z = cote * (EPI / 2 + 0.08);
  const c = k.c;
  // le coffre en haut, les deux coulisses
  T.repere({ x: a[0], z: a[1], ry }, () => {
    T.boite(l + 0.3, 0.42, 0.34, COUL.rideau, { x: u, y: ht + 0.21, z: cote * (EPI / 2 + 0.17) }, m.tole, { crasse: false });
  });
  for (const ch of [c, T]) {
    ch.repere({ x: a[0], z: a[1], ry }, () => {
      const [y1, y2] = ch === c ? [0, CUTI] : [CUTI, ht];
      for (const s of [-1, 1]) ch.pave(u + s * (l / 2) - 0.05, y1, z - 0.06, u + s * (l / 2) + 0.05, y2, z + 0.06, 0x7d817f, m.tole, { nuance: 0.03 });
    });
  }
  const tablier = (ch, y1, y2, x1 = u - l / 2, x2 = u + l / 2) => {
    ch.repere({ x: a[0], z: a[1], ry }, () => {
      panneau(ch, m.enseignes, R.rideau, { x: (x1 + x2) / 2, y: (y1 + y2) / 2, z }, x2 - x1, y2 - y1, y1 / ht, y2 / ht);
      ch.boite(x2 - x1, 0.06, 0.08, 0x6a6e6c, { x: (x1 + x2) / 2, y: y1 + 0.03, z }, m.tole, { crasse: false });
    });
  };
  if (etat === "leve") {
    T.repere({ x: a[0], z: a[1], ry }, () => T.boite(l, 0.08, 0.1, 0x6a6e6c, { x: u, y: ht - 0.04, z }, m.tole));
  } else if (etat === "baisse") {
    tablier(c, 0, CUTI);
    tablier(T, CUTI, ht);
  } else if (etat === "mi") {
    tablier(T, 2.15, ht);
  } else if (etat === "force") {
    // baissé, mais le coin droit a été replié au pied-de-biche : on se glisse dessous
    tablier(c, 0, CUTI, u - l / 2, u + l * 0.05);
    tablier(T, CUTI, ht);
    c.repere({ x: a[0], z: a[1], ry }, () => {
      c.repere({ x: u + l * 0.27, y: CUTI, z, rx: -cote * 1.05 }, () => panneau(c, m.enseignes, R.rideau, { y: -CUTI / 2 }, l * 0.45, CUTI, 0, CUTI / ht));
      tablier(c, 0.9, CUTI, u + l * 0.05, u + l * 0.5);
    });
  } else if (etat === "arrache") {
    // le tablier a été arraché d'un côté : il pend en travers ; une moitié gît au sol
    c.repere({ x: a[0], z: a[1], ry }, () => {
      c.repere({ x: u - l / 2, y: ht, z: z + cote * 0.05, rz: 0.62, ry: cote * 0.18 }, () => panneau(c, m.enseignes, R.rideau, { x: l * 0.32, y: -1.1 }, l * 0.66, 2.2, 0.3, 1));
      c.repere({ x: u + 0.3, y: 0.14, z: z + cote * 1.3, rx: -PI / 2 + 0.12, rz: 0.25 }, () => panneau(c, m.enseignes, R.rideau, {}, l * 0.6, 1.9, 0, 0.6));
    });
  }
}

/**
 * Une devanture de boutique sur le mur a→b (+z local = l'allée) : piliers, allège, vitrines (vitrées ou brisées),
 * portes à rideau de fer, bandeau et enseigne en haut, enseigne drapeau au-dessus de l'allée.
 * `baies` : [{ u1, u2, type: « vitrine » | « porte », rideau, passage }].
 */
function devanture(k, T, a, b, spec) {
  const { baies, enseigneR, couleur, drapeau = true, h = HB, mannequins = 0, brisVitrine } = spec;
  const m = k.m;
  const { L, ry } = repereMur(a, b);
  const HT = 3.3;
  const ouvertures = baies.map((q) => ({ u: (q.u1 + q.u2) / 2, l: q.u2 - q.u1, bas: q.type === "vitrine" ? 0.45 : 0, haut: HT, type: "vide", passage: q.passage ?? (q.type === "porte" && q.rideau !== "baisse") }));
  murCoupe(k, T, a, b, { h, cut: CUTI, ep: EPI + 0.1, couleur, mat: m.enduit, ouvertures });
  for (const q of baies) {
    if (q.type === "vitrine") {
      vitrage(k, k.c, T, a, b, q.u1, q.u2, 0.45, HT, { cut: CUTI, pas: 1.6, traverses: [2.6], bris: q.bris ?? brisVitrine ?? k.bris, z: 0.06 });
      // l'allège de la vitrine, en granit
      if (!q.passage) k.c.repere({ x: a[0], z: a[1], ry }, () => k.c.pave(q.u1, 0, -0.18, q.u2, 0.45, 0.2, COUL.granit, m.satin, { nuance: 0.02 }));
    } else rideauDeFer(k, T, a, b, (q.u1 + q.u2) / 2, q.u2 - q.u1, HT, q.rideau ?? "leve", 1);
  }
  // Le bandeau (au-dessus des baies) : corniche, enseigne
  T.repere({ x: a[0], z: a[1], ry }, () => {
    T.pave(-0.05, HT + 0.42, 0, L + 0.05, HT + 0.52, 0.32, COUL.creme, m.enduit, { nuance: 0.02, crasse: false });
    T.pave(-0.05, h - 0.18, 0, L + 0.05, h, 0.38, COUL.ocre, m.satin, { nuance: 0.02, crasse: false });
    if (enseigneR) {
      const le = Math.min(L - 1.2, 5.6);
      T.boite(le + 0.2, 0.92, 0.12, 0x2a2826, { x: L / 2, y: HT + 1.0, z: 0.2 }, m.satin, { crasse: false });
      panneau(T, m.enseignes, enseigneR, { x: L / 2, y: HT + 1.0, z: 0.27 }, le, le / 4);
    }
  });
  // L'enseigne drapeau, perpendiculaire, au-dessus de l'allée (lisible de loin)
  if (drapeau && enseigneR) {
    k.c.repere({ x: a[0], z: a[1], ry }, () => {
      const u = drapeau === true ? 0.9 : drapeau;
      k.c.boite(0.06, 0.06, 1.5, COUL.chrome, { x: u, y: 3.25, z: 0.85 }, m.metal);
      k.c.boite(0.08, 0.66, 1.36, 0x2a2826, { x: u, y: 2.86, z: 0.92 }, m.satin, { crasse: false });
      panneau(k.c, m.enseignes, enseigneR, { x: u + 0.045, y: 2.86, z: 0.92, ry: PI / 2 }, 1.3, 0.33);
      panneau(k.c, m.enseignes, enseigneR, { x: u - 0.045, y: 2.86, z: 0.92, ry: -PI / 2 }, 1.3, 0.33);
    });
  }
  // Des mannequins en vitrine (debout ou renversés)
  if (mannequins) {
    const v = baies.filter((q) => q.type === "vitrine");
    let n = 0;
    for (const q of v) {
      for (let u = q.u1 + 0.7; u < q.u2 - 0.4 && n < mannequins; u += 1.4, n++) {
        const t = repereVersMonde(a, b, u, -0.7);
        mannequin(k, k.c, t[0], t[1], ry + PI / 2 + k.c.entre(-0.4, 0.4), n % 3 === 1 ? "tombe" : n % 3 === 2 ? "sansTete" : "debout", [0xc0466e, 0x6fb3a8, 0xe0b040][n % 3]);
      }
    }
  }
}

/** Un point (u le long du mur a→b, w vers l'extérieur +z local) en coordonnées du monde. */
function repereVersMonde(a, b, u, w) {
  const { L, dx, dz, ry } = repereMur(a, b);
  return [a[0] + (dx * u) / L + Math.sin(ry) * w, a[1] + (dz * u) / L + Math.cos(ry) * w];
}

/** Ce point est-il dans le lot de la carte ? */
function dansLot(k, x, z, marge = 0) {
  const o = CENTRES[k.id];
  const lot = LOTS[k.id];
  return Math.abs(x - o.x) <= lot.l / 2 + marge && Math.abs(z - o.z) <= lot.p / 2 + marge;
}

// ---------- Le mobilier et les vestiges ----------

/** Un mannequin (debout sur son socle, renversé au sol, ou sans tête), avec un haut synthétique de couleur. */
function mannequin(k, ch, x, z, ry, pose = "debout", habit = null) {
  const m = k.m;
  const blanc = 0xe4dfd4;
  const corps = () => {
    for (const s of [-1, 1]) ch.boite(0.11, 0.86, 0.13, blanc, { x: s * 0.09, y: 0.45 }, m.satin, { crasse: false });
    ch.boite(0.36, 0.58, 0.22, habit ?? blanc, { y: 1.17 }, habit ? m.toile : m.satin, { crasse: false });
    ch.boite(0.3, 0.16, 0.2, blanc, { y: 0.86 }, m.satin, { crasse: false });
    for (const s of [-1, 1]) ch.boite(0.08, 0.62, 0.09, blanc, { x: s * 0.23, y: 1.12, rz: s * 0.14 }, m.satin, { crasse: false });
    if (pose !== "sansTete") ch.poser(geoBoule(0.12, 0), m.satin, blanc, { y: 1.64, e: [1, 1.22, 1] }, { crasse: false });
  };
  if (pose === "tombe") ch.repere({ x, z, ry }, () => ch.repere({ y: 0.12, rz: PI / 2 }, corps));
  else
    ch.repere({ x, z, ry }, () => {
      corps();
      ch.poser(geoCylindre(0.2, 0.04, 8), m.metal, COUL.chrome, { y: 0.02 });
      if (pose === "sansTete") ch.poser(geoBoule(0.12, 0), m.satin, blanc, { x: 0.5, y: 0.1, z: 0.3, e: [1, 1.22, 1] });
    });
}

/** Un palmier en pot, mort (ou presque) : bac, tronc courbé, palmes sèches qui pendent, palmes tombées. */
function palmier(k, ch, x, z, h = 4, mort = true) {
  const m = k.m;
  ch.boite(1.3, 0.75, 1.3, 0xd8d0c0, { x, y: 0.375, z }, m.satin);
  ch.boite(1.36, 0.08, 1.36, 0xc4baa6, { x, y: 0.76, z }, m.satin);
  ch.boite(1.16, 0.02, 1.16, PALETTE.terreSombre, { x, y: 0.8, z }, m.mat);
  const p0 = [x, 0.78, z];
  const p1 = [x + ch.entre(-0.2, 0.2), 0.78 + h * 0.45, z + ch.entre(-0.2, 0.2)];
  const p2 = [p1[0] + ch.entre(-0.35, 0.35), 0.78 + h, p1[2] + ch.entre(-0.35, 0.35)];
  ch.tube(p0, p1, 0.14, COUL.ecorce, m.mat, 6);
  ch.tube(p1, p2, 0.11, COUL.ecorce, m.mat, 6);
  const tons = mort ? [0x7d6b4c, 0x6a5c44, 0x958160] : [0x6d8f45, PALETTE.feuillage, 0x8a9a55];
  // les palmes : deux tronçons (le premier monte, le second retombe), de plus en plus pendantes vers le bas du bouquet
  const n = 9;
  ch.poser(geoBoule(0.2, 0), m.mat, COUL.ecorce, { x: p2[0], y: p2[1], z: p2[2] });
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * PI * 2 + ch.hasard() * 0.4;
    const r1 = (mort ? 0.1 : 0.35) - ch.hasard() * 0.3;
    const r2 = r1 - (mort ? 0.9 + ch.hasard() * 0.6 : 0.5 + ch.hasard() * 0.3);
    const l1 = 0.9;
    const l2 = ch.entre(0.9, 1.4);
    const t = tons[i % 3];
    ch.repere({ x: p2[0], y: p2[1], z: p2[2], ry: ang }, () => {
      ch.boite(l1, 0.03, 0.3, t, { x: Math.cos(r1) * l1 * 0.5, y: Math.sin(r1) * l1 * 0.5, rz: r1, rx: 0.25 }, m.mat, { nuance: 0.1, crasse: false });
      const ex = Math.cos(r1) * l1;
      const ey = Math.sin(r1) * l1;
      ch.boite(l2, 0.03, 0.26, t, { x: ex + Math.cos(r2) * l2 * 0.5, y: ey + Math.sin(r2) * l2 * 0.5, rz: r2, rx: -0.25 }, m.mat, { nuance: 0.1, crasse: false });
    });
  }
  if (mort) {
    for (let i = 0; i < 7; i++) {
      const ang = (i / 7) * PI * 2 + 0.3;
      ch.repere({ x: p2[0], y: p2[1] - 0.15, z: p2[2], ry: ang }, () => ch.boite(1.3, 0.03, 0.24, i % 2 ? 0x6e5f48 : 0x857254, { x: 0.18, y: -0.6, rz: -1.35 }, m.mat, { nuance: 0.1, crasse: false }));
    }
  }
  if (mort) for (let i = 0; i < 2; i++) ch.boite(1.8, 0.03, 0.4, tons[i], { x: x + ch.entre(-1.6, 1.6), y: 0.03, z: z + ch.entre(-1.6, 1.6), ry: ch.hasard() * 3 }, m.mat, { crasse: false });
}

/** Un banc de galerie : assise de lattes, dossier, pieds en fonte. */
function banc(k, ch, x, z, ry, L = 2) {
  const m = k.m;
  ch.repere({ x, z, ry }, () => {
    ch.boite(L, 0.06, 0.5, COUL.bois, { y: 0.45 }, m.mat, { nuance: 0.06 });
    ch.boite(L, 0.4, 0.05, COUL.bois, { y: 0.75, z: -0.24, rx: -0.12 }, m.mat, { nuance: 0.06 });
    for (const s of [-1, 1]) ch.boite(0.07, 0.45, 0.5, 0x3a3c3c, { x: s * (L / 2 - 0.15), y: 0.22 }, m.tole);
  });
}

/** Une table vissée de food court : plateau rond sur pied, quatre tabourets fixés sur des bras. */
function tableVissee(k, ch, x, z, ry, plateau = 0xd8a03a) {
  const m = k.m;
  ch.tube([x, 0, z], [x, 0.72, z], 0.05, COUL.chrome, m.metal, 6);
  ch.poser(geoCylindre(0.45, 0.04, 8), m.satin, plateau, { x, y: 0.74, z });
  for (let i = 0; i < 4; i++) {
    const an = ry + (i * PI) / 2;
    const sx = x + Math.cos(an) * 0.78;
    const sz = z + Math.sin(an) * 0.78;
    ch.poutre([x, 0.12, z], [sx, 0.12, sz], 0.05, COUL.chrome, m.metal);
    ch.tube([sx, 0.12, sz], [sx, 0.44, sz], 0.03, COUL.chrome, m.metal, 5);
    ch.poser(geoCylindre(0.19, 0.06, 6), m.satin, i % 2 ? COUL.rouge : 0xe9dfc6, { x: sx, y: 0.46, z: sz });
  }
}

/** Un caddie : panier en grillage (atlas), poignée rouge, châssis, roulettes. `renverse` : couché sur le flanc. */
function caddie(k, ch, x, z, ry, renverse = false) {
  const m = k.m;
  ch.repere({ x, z, ry }, () => ch.repere(renverse ? { y: 0.32, rx: PI / 2 - 0.1 } : {}, () => {
    panneau(ch, m.enseignes, R.grillage, { y: 0.74, z: 0.28 }, 0.9, 0.42);
    panneau(ch, m.enseignes, R.grillage, { y: 0.74, z: -0.28 }, 0.9, 0.42);
    panneau(ch, m.enseignes, R.grillage, { x: 0.45, y: 0.74, ry: PI / 2 }, 0.56, 0.42);
    panneau(ch, m.enseignes, R.grillage, { x: -0.45, y: 0.74, ry: PI / 2 }, 0.56, 0.42);
    panneau(ch, m.enseignes, R.grillage, { y: 0.53, rx: -PI / 2 }, 0.9, 0.56);
    ch.boite(0.05, 0.05, 0.6, COUL.rouge, { x: -0.6, y: 1.0 }, m.satin);
    for (const s of [-1, 1]) {
      ch.poutre([-0.6, 1.0, s * 0.26], [-0.45, 0.55, s * 0.26], 0.025, COUL.chrome, m.metal);
      ch.poutre([-0.45, 0.12, s * 0.22], [0.42, 0.12, s * 0.17], 0.03, COUL.chrome, m.metal);
      ch.poutre([-0.45, 0.12, s * 0.22], [-0.45, 0.53, s * 0.26], 0.025, COUL.chrome, m.metal);
      for (const xx of [-0.42, 0.4]) ch.boite(0.1, 0.1, 0.04, COUL.noir, { x: xx, y: 0.05, z: s * 0.2 }, m.satin);
    }
  }));
}

/** Une voiture autonome (« la capsule ») : caisse arrondie, habitacle tout vitré, lidar sur le toit, sans volant. */
function voiture(k, ch, x, z, ry, teinte, o = {}) {
  const m = k.m;
  ch.repere({ x, y: o.affaisse ? -0.08 : 0, z, ry, rz: o.penche ?? 0 }, () => {
    ch.boite(4.3, 0.62, 1.86, teinte, { y: 0.66 }, m.satin, { nuance: 0.03 });
    ch.boite(0.9, 0.32, 1.82, teinte, { x: 1.86, y: 1.0, rz: -0.38 }, m.satin, { nuance: 0.03 });
    ch.boite(0.7, 0.32, 1.82, teinte, { x: -1.96, y: 1.0, rz: 0.42 }, m.satin, { nuance: 0.03 });
    ch.boite(2.9, 0.72, 1.7, 0xffffff, { x: -0.1, y: 1.33 }, m.verre, { crasse: false });
    ch.boite(2.62, 0.08, 1.7, teinte, { x: -0.16, y: 1.72 }, m.satin);
    for (const sx of [-1.5, 0, 1.3]) for (const sz of [-0.83, 0.83]) ch.boite(0.09, 0.72, 0.06, teinte, { x: sx, y: 1.33, z: sz }, m.satin);
    ch.poser(geoCylindre(0.17, 0.22, 8), m.satin, 0x2a2c2e, { x: 0.2, y: 1.86 });
    ch.boite(0.05, 0.08, 1.5, 0xe8e4d0, { x: 2.16, y: 0.86 }, m.satin, { crasse: false });
    ch.boite(0.05, 0.08, 1.5, 0x9b3b35, { x: -2.16, y: 0.86 }, m.satin, { crasse: false });
    ch.boite(4.36, 0.12, 1.9, 0x3a3c3c, { y: 0.4 }, m.satin);
    for (const [wx, wz] of [[1.35, 0.86], [1.35, -0.86], [-1.35, 0.86], [-1.35, -0.86]]) ch.poser(geoCylindre(0.34, 0.24, 8), m.mat, 0x252423, { x: wx, y: 0.34, z: wz, rx: PI / 2 });
    if (o.porte) ch.repere({ x: 0.9, y: 0.75, z: 0.95, ry: -0.9 }, () => ch.boite(1.4, 1.1, 0.06, teinte, { x: -0.7, y: 0.2 }, m.satin));
    if (o.mousse) mousse(ch, 1.6, 1.15, 0, 0.5, 4);
  });
}

/** Une gondole de magasin : socle, dos, tablettes des deux côtés, quelques produits restés là. `renverse` : couchée. */
function gondole(k, ch, x, z, L, ry, o = {}) {
  const m = k.m;
  const h = o.h ?? 1.8;
  const plein = o.plein ?? 0.15;
  const tons = o.tons ?? [0xc8362b, 0xe0b040, 0x2f6f73, 0xe9dfc6, 0x6a4f8a, 0x3f8f5a];
  ch.repere({ x, z, ry }, () => ch.repere(o.renverse ? { y: 0.47, rx: PI / 2 - 0.08 } : {}, () => {
    ch.boite(L, 0.12, 0.9, 0x6a6d70, { y: 0.06 }, m.tole);
    ch.boite(L, h, 0.05, o.dos ?? 0xb9bcb8, { y: h / 2 }, m.tole);
    for (const s of [-1, 1]) {
      for (const y of [0.2, 0.6, 1.0, 1.4]) {
        if (y > h - 0.2) continue;
        ch.boite(L, 0.03, 0.4, 0xc9ccc8, { y, z: s * 0.23 }, m.tole, { crasse: false });
        for (let u = -L / 2 + 0.15; u < L / 2 - 0.1; u += 0.26) {
          if (ch.hasard() > plein) continue;
          const hh = ch.entre(0.14, 0.3);
          ch.boite(ch.entre(0.14, 0.24), hh, ch.entre(0.14, 0.24), tons[Math.floor(ch.hasard() * tons.length)], { x: u, y: y + 0.015 + hh / 2, z: s * ch.entre(0.15, 0.3), ry: ch.entre(-0.3, 0.3) }, m.satin, { crasse: false, nuance: 0.08 });
        }
      }
      if (o.affiche) panneau(ch, m.enseignes, R.rayon, { y: h - 0.22, z: s * 0.03, ry: s > 0 ? 0 : PI }, L * 0.9, 0.36);
    }
    for (const s of [-1, 1]) ch.boite(0.04, h, 0.9, o.joue ?? 0x9a9e9c, { x: s * L / 2, y: h / 2 }, m.tole);
  }));
}

/** Des produits et des cartons éparpillés au sol (le pillage). */
function eparpiller(k, ch, x1, z1, x2, z2, n, tons) {
  for (let i = 0; i < n; i++) {
    const s = ch.entre(0.12, 0.32);
    ch.boite(s, s * ch.entre(0.4, 1.1), s * ch.entre(0.6, 1), tons[Math.floor(ch.hasard() * tons.length)], { x: ch.entre(x1, x2), y: s * 0.2, z: ch.entre(z1, z2), ry: ch.hasard() * 3, rz: ch.entre(-0.4, 0.4) }, k.m.satin, { crasse: false, nuance: 0.08 });
  }
}

/** Une télé plate de 85 pouces (1,9 × 1,1 m) : écran noir, ou l'écran de l'atlas (`ecran`). */
function tele(k, ch, x, y, z, ry, o = {}) {
  const m = k.m;
  ch.repere({ x, y, z, ry }, () => ch.repere({ rx: o.rx ?? 0, rz: o.rz ?? 0 }, () => {
    ch.boite(1.92, 1.12, 0.06, 0x1a1c1f, {}, m.satin, { crasse: false });
    if (o.ecran) panneau(ch, m.enseignes, o.ecran, { z: 0.035 }, 1.8, 0.98);
    else ch.boite(1.8, 1.0, 0.01, 0x0f1418, { z: 0.032 }, m.metal, { crasse: false });
    if (o.pied) ch.boite(0.5, 0.04, 0.25, 0x2a2c2e, { y: -0.6 }, m.satin);
  }));
}

/** Un comptoir de boutique (caisse) : caisson, plateau, un terminal. */
function comptoir(k, ch, x, z, L, ry, teinte) {
  const m = k.m;
  ch.repere({ x, z, ry }, () => {
    ch.boite(L, 1.0, 0.7, teinte, { y: 0.5 }, m.satin);
    ch.boite(L + 0.1, 0.05, 0.8, 0xe9e4da, { y: 1.02 }, m.satin, { crasse: false });
    ch.boite(0.36, 0.28, 0.06, 0x1a1c1f, { x: L * 0.25, y: 1.2, rx: -0.3 }, m.satin);
  });
}

/** Un cylindre posé (bidon, pot, rouleau). */
function cylindre(ch, mat, x, y, z, r, h, couleur, cotes = 8) {
  ch.poser(geoCylindre(r, h, cotes), mat, couleur, { x, y: y + h / 2, z });
}

// ---------- Le bâtiment ----------

export function creer({ usure = 0.7, carte } = {}) {
  const id = carte === "galerie" ? "galerie" : "parking";
  const b = new Batiment(2031, usure);
  const m = matieres();
  const k = { b, c: b.c, m, usure, id, galerie: id === "galerie", parking: id === "parking", bris: 0.3 + 0.6 * usure, T: {} };

  if (k.galerie) {
    k.T.ouest = b.couche("bloc ouest", { x: -12.5, z: 3, l: 15.4, p: 38.6 }, CUT, PARAPET + 0.5);
    k.T.est = b.couche("bloc est", { x: 12.5, z: 3, l: 15.4, p: 38.6 }, CUT, PARAPET + 0.5);
    k.T.nord = b.couche("supermarché", { x: 0, z: -22, l: 40.6, p: 12.6 }, CUTI, HS + 0.8);
    k.T.verriere = b.couche("verrière et galerie haute", { x: 0, z: 3, l: 22.6, p: 38.6 }, MEZZ - 0.2, NAISSANCE + RAYON + 0.5);
  } else {
    const t = b.couche("le centre commercial", { x: 0, z: -3, l: 40.6, p: 50.6 }, CUT, NAISSANCE + RAYON + 0.5);
    k.T.ouest = k.T.est = k.T.nord = k.T.verriere = t;
    k.T.pylone = b.couche("pylône", { x: 31, z: 57, l: 9, p: 3 }, 4.5, 15);
  }
  k.T.marquise = b.couche("marquise", { x: 0, z: 24.6, l: 17.4, p: 5.8 }, 3.9, 7.2);
  // Chaque couche duplique ses matières (un appel de dessin chacune) : on les ramène à quatre au plus.
  const blocs = new Map([[m.satin, m.tole], [m.metal, m.tole], [m.mat, m.enduit], [m.toile, m.enduit]]);
  for (const t of new Set([k.T.ouest, k.T.est, k.T.nord, k.T.pylone, k.T.marquise])) if (t) restreindre(t, blocs);
  if (k.galerie) restreindre(k.T.verriere, new Map([[m.satin, m.enduit], [m.tole, m.metal], [m.mat, m.enduit], [m.toile, m.enduit]]));

  sols(k);
  facadeSud(k);
  mursExterieurs(k);
  toits(k);
  verriere(k);
  marquise(k);
  barricade(k);
  ecranAnime(k);
  if (k.galerie) {
    interieur(k);
    allee(k);
    atrium(k);
    toutConnecte(k);
    modeJetable(k);
    pharmacie(k);
    toilettes(k);
    foodCourt(k);
    jouetsBavards(k);
    gadgets(k);
    supermarche(k);
    reserveEtQuai(k);
  } else {
    entreeVueDuParking(k);
    parking(k);
    pylone(k);
  }

  // Le néon SORTIE grésille sur sa batterie.
  const anime = new THREE.Object3D();
  let prochain = 0;
  let etat = 1;
  anime.userData.animer = (t) => {
    if (t > prochain) {
      etat = Math.random() < 0.82 ? 1 : 0.15 + Math.random() * 0.4;
      prochain = t + (etat < 1 ? 0.04 + Math.random() * 0.12 : 0.3 + Math.random() * 2.5);
    }
    m.neon.emissiveIntensity = 1.1 * etat;
  };
  b.ajouter(anime);

  if (k.galerie) {
    b.lumiere(15, 0.6, 4.2, 0xff9a4a, 8, 11, "feu de survivants dans un demi-fût (food court)");
    b.lumiere(-1.2, 1.3, -18.3, 0xffd27a, 5, 9, "lanterne posée sur une caisse automatique");
    b.lumiere(0, 3.6, 21.4, 0x6dffa8, 5, 9, "néon SORTIE de secours (batterie)");
    b.lumiere(-8.0, 3.1, 7.0, 0xd27aff, 5, 10, "écran publicitaire de l'atrium (panneau solaire sur la verrière), lueur changeante");
  } else {
    b.lumiere(-9, 3.2, 25.6, 0xd27aff, 6, 10, "totem publicitaire qui boucle encore (panneau solaire)");
    b.lumiere(12, 7.4, 47, 0xe8f0ff, 7, 14, "le seul lampadaire solaire qui marche encore");
    b.lumiere(0, 3.6, 22.6, 0x6dffa8, 4, 8, "néon SORTIE au-dessus de l'entrée (batterie)");
  }

  // Recentrer sur le lot de la carte : la géométrie et les données de jeu.
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

/** Dans ce chantier, chaque matière de la table est remplacée par une autre (moins d'appels de dessin). */
function restreindre(ch, table) {
  const poser = ch.poser.bind(ch);
  ch.poser = (geo, mat, couleur, pose, options) => poser(geo, table.get(mat) ?? mat, couleur, pose, options);
}

/** Une salissure au sol (terre, suie, eau séchée) : des disques aplatis. */
function salissure(c, x, z, r, ton = 0x8a7f6a) {
  mousse(c, x, 0.045, z, r, 3, ton);
}

/** Une flaque (même eau que l'étang : une seule matière). */
function flaque(c, x, z, rayon, y = 0.015) {
  const pts = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * PI * 2;
    const r = rayon * c.entre(0.6, 1.1);
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts)).rotateX(-PI / 2);
  c.poser(g, matieres().eau, 0x9ab0a0, { x, y, z }, { crasse: false, nuance: 0 });
  g.dispose();
}

// ---------- Sols ----------

function sols(k) {
  const { c, m } = k;
  const o = CENTRES[k.id];
  const lot = LOTS[k.id];
  // L'asphalte sur tout le lot
  c.pave(o.x - lot.l / 2, -0.02, o.z - lot.p / 2, o.x + lot.l / 2, 0.01, o.z + lot.p / 2, COUL.asphalte, m.asphalte, { crasse: false, nuance: 0 });
  // Le parvis (trottoir de béton) le long de la façade sud
  c.pave(-26, 0, ZSUD, 26, 0.08, ZSUD + 4, COUL.trottoir, m.asphalte, { crasse: false, nuance: 0 });
  // Le dallage de la galerie
  const z1 = k.galerie ? ZNORD : Math.max(ZNORD, o.z - lot.p / 2 - 2);
  c.pave(XO, 0, z1, XE, 0.05, ZSUD, COUL.dallage, m.dallage, { crasse: false, nuance: 0 });
  if (k.galerie) {
    c.pave(XO, 0, ZNORD, XE, 0.056, ZS, COUL.dallageSuper, m.dallage, { crasse: false, nuance: 0 });
    c.pave(XA, 0, ZA1, XE, 0.056, ZA2, COUL.dallageFood, m.dallage, { crasse: false, nuance: 0 });
    c.pave(XO, 0, ZA1, -XA, 0.056, 3, COUL.wc, m.dallage, { crasse: false, nuance: 0 });
    // La bande sombre au milieu de l'allée, et l'anneau autour de l'étang
    c.pave(-1.2, 0, ZS, 1.2, 0.056, -1, COUL.dallageSombre, m.dallage, { crasse: false, nuance: 0 });
    c.pave(-1.2, 0, 7, 1.2, 0.056, ZSUD, COUL.dallageSombre, m.dallage, { crasse: false, nuance: 0 });
    c.pave(-5, 0, -1, 5, 0.056, 7, COUL.dallageSombre, m.dallage, { crasse: false, nuance: 0 });
    // Le quai, au nord : une dalle de béton
    c.pave(6, 0, ZNORD - 8, 22, 0.06, ZNORD, COUL.trottoir, m.asphalte, { crasse: false, nuance: 0 });
  }
}

// ---------- La façade sud (l'entrée) ----------

function facadeSud(k) {
  const { c, m, usure } = k;
  const T = k.T;
  const cadreVitrine = (a, bb, u1, u2, ch) => vitrage(k, c, ch, a, bb, u1, u2, 0.5, 3.4, { pas: 1.7, traverses: [2.7], cut: CUT, z: 0.08 });
  for (const [x1, x2, ch, nom, cote] of [[XO, -RAYON, T.ouest, R.toutConnecte, -1], [RAYON, XE, T.est, R.jouets, 1]]) {
    const a = [x1, ZSUD];
    const bb = [x2, ZSUD];
    const ouv = [
      { u: 4, l: 5, bas: 0.5, haut: 3.4, type: "vide" },
      { u: 11, l: 5, bas: 0.5, haut: 3.4, type: "vide" },
    ];
    murCoupe(k, ch, a, bb, { h: PARAPET, couleur: COUL.facade, mat: m.enduit, ep: EP, ouvertures: ouv });
    cadreVitrine(a, bb, 1.5, 6.5, ch);
    cadreVitrine(a, bb, 8.5, 13.5, ch);
    bandes(a, bb, EP, [
      { y1: 0, y2: 0.5, s: 0.06, couleur: COUL.granit, mat: m.satin, ch: c, trous: [[1.5, 6.5], [8.5, 13.5]] },
      { y1: 3.4, y2: 3.6, s: 0.25, couleur: COUL.creme, mat: m.enduit, ch },
      { y1: 5.2, y2: 5.45, s: 0.12, couleur: COUL.rouge, mat: m.satin, ch },
      { y1: 5.55, y2: PARAPET, s: 0.3, couleur: COUL.creme, mat: m.enduit, ch },
    ]);
    // L'enseigne de la boutique, et un pilastre tous les 7 m
    panneau(ch, m.enseignes, nom, { x: (x1 + x2) / 2, y: 4.4, z: ZSUD + EP / 2 + 0.03 }, 5.6, 1.4);
    for (const x of [x1 + 0.35, (x1 + x2) / 2, x2 - 0.35]) {
      ch.pave(x - 0.35, CUT, ZSUD + 0.1, x + 0.35, PARAPET, ZSUD + 0.4, COUL.creme, m.enduit, { nuance: 0.02 });
      c.pave(x - 0.35, 0, ZSUD + 0.1, x + 0.35, CUT, ZSUD + 0.4, COUL.granit, m.satin, { nuance: 0.02 });
    }
    // Des affiches de soldes collées en vitrine
    panneau(c, m.enseignes, R.soldes, { x: x1 + 4.6, y: 0.95, z: ZSUD + 0.12 }, 0.8, 0.8);
    if (cote > 0) panneau(ch, m.enseignes, R.soldes, { x: x1 + 10, y: 2.4, z: ZSUD + 0.12 }, 1.0, 1.0);
  }
  // Le portail d'entrée : deux grands piliers, le mur-rideau vitré, l'éventail de la verrière
  const V = T.verriere;
  for (const s of [-1, 1]) {
    const x = s * (RAYON + 0.1);
    c.pave(x - 0.6, 0, ZSUD - 0.4, x + 0.6, CUT, ZSUD + 0.6, COUL.granit, m.satin, { nuance: 0.02 });
    V.pave(x - 0.6, CUT, ZSUD - 0.4, x + 0.6, NAISSANCE + 0.6, ZSUD + 0.6, COUL.creme, m.enduit, { nuance: 0.02 });
    V.pave(x - 0.7, NAISSANCE + 0.6, ZSUD - 0.5, x + 0.7, NAISSANCE + 0.9, ZSUD + 0.7, COUL.ocre, m.satin, { crasse: false });
  }
  const a = [-RAYON + 0.5, ZSUD];
  const bb = [RAYON - 0.5, ZSUD];
  // les portes coulissantes (on passe au milieu), puis le grand vitrage
  vitrage(k, c, V, a, bb, 0, 1.5, 0, 3.2, { pas: 1.5, bris: 0.6 });
  vitrage(k, c, V, a, bb, 7.5, 9, 0, 3.2, { pas: 1.5, bris: 0.6 });
  vitrage(k, c, V, a, bb, 0, 9, 3.2, NAISSANCE, { pas: 1.5, traverses: [5.6], cut: 3.2 });
  c.pave(-1.5, 0, ZSUD - 0.08, 1.5, 0.04, ZSUD + 0.08, COUL.alu, m.metal);
  // une porte coulissante tombée à plat devant l'entrée
  c.boite(1.5, 0.05, 2.6, COUL.alu, { x: 2.2, y: 0.04, z: ZSUD + 1.7, ry: 0.3 }, m.metal);
  for (const [x1, x2] of [[-RAYON - 0.6, -3], [3, RAYON + 0.6]]) k.b.obstacle(x1, ZSUD, x2, ZSUD, "portail vitré");
  // L'éventail vitré au-dessus (demi-cercle de la verrière)
  eventail(k, V, ZSUD + 0.05, 1);
  // Le néon SORTIE (au-dessus des portes, à l'intérieur et à l'extérieur)
  c.boite(0.9, 0.36, 0.08, 0x2a2826, { x: 0, y: 3.55, z: ZSUD - 0.25 }, m.satin);
  panneau(c, m.neon, R.sortie, { x: 0, y: 3.55, z: ZSUD - 0.3, ry: PI }, 0.8, 0.4);
  panneau(c, m.neon, R.sortie, { x: 0, y: 3.55, z: ZSUD - 0.2 }, 0.8, 0.4);
  // Le panneau Watty géant, sur le toit du bloc ouest
  {
    const ch = T.ouest;
    const x = -12.5;
    const z = ZSUD - 3;
    for (const s of [-1, 1]) {
      ch.pave(x + s * 3 - 0.12, HB, z - 0.12, x + s * 3 + 0.12, 10.4, z + 0.12, COUL.tole, m.tole);
      ch.poutre([x + s * 3, HB, z - 2], [x + s * 3, 9.6, z], 0.14, COUL.tole, m.tole);
    }
    ch.poutre([x - 3, 7, z], [x + 3, 9.5, z], 0.1, COUL.tole, m.tole);
    ch.boite(8.3, 4.3, 0.12, 0x2a2826, { x, y: 8.3, z: z - 0.05 }, m.satin);
    panneau(ch, m.enseignes, R.watty, { x, y: 8.3, z: z + 0.03 }, 8, 4);
    // la passerelle d'entretien et ses projecteurs éteints
    ch.boite(8.4, 0.06, 0.8, COUL.tole, { x, y: 6.05, z: z + 0.45 }, m.tole);
    for (const s of [-2.5, 0, 2.5]) ch.poutre([x + s, 6.1, z + 0.8], [x + s, 6.6, z + 1.4], 0.08, COUL.noir, m.tole);
  }
  // Du lierre et de la mousse au pied de la façade
  if (dansLot(k, 0, ZSUD)) {
    lierre(c, -19.6, 0, ZSUD + 0.2, 0, 3, 3 + 2 * usure, Math.round(30 + 40 * usure));
    lierre(c, 18.8, 0, ZSUD + 0.2, 0, 2.5, 2.5 + 2 * usure, Math.round(20 + 30 * usure));
    semerTouffes(c, -20, ZSUD + 0.2, 20, ZSUD + 0.8, Math.round(20 + 40 * usure));
  }
}

/** L'éventail vitré qui ferme le berceau (demi-cercle), en z, côté `s` (+1 : façade sud, -1 : nord). */
function eventail(k, V, z, s) {
  const m = k.m;
  const n = 8;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * PI;
    pts.push([Math.cos(t) * RAYON, NAISSANCE + Math.sin(t) * RAYON]);
  }
  for (let i = 0; i < n; i++) {
    // un secteur vitré (triangle), parfois cassé
    if (V.hasard() < k.bris * 0.5) continue;
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([0, NAISSANCE, z, x1, y1, z, x2, y2, z], 3));
    g.computeVertexNormals();
    V.poser(g, m.verre, 0xffffff, {}, { crasse: false, nuance: 0 });
  }
  for (let i = 0; i < n; i++) V.poutre([pts[i][0], pts[i][1], z], [pts[i + 1][0], pts[i + 1][1], z], 0.2, COUL.tole, m.metal);
  for (let i = 1; i < n; i++) V.poutre([0, NAISSANCE, z], [pts[i][0], pts[i][1], z], 0.08, COUL.tole, m.metal);
  V.poutre([-RAYON, NAISSANCE, z], [RAYON, NAISSANCE, z], 0.22, COUL.tole, m.metal);
  // le demi-cercle de la rosace au centre
  V.poser(geoCylindre(0.7, 0.12, 8), m.metal, COUL.ocre, { y: NAISSANCE, z, rx: PI / 2 });
}

// ---------- Les murs extérieurs ----------

function mursExterieurs(k) {
  const { c, m, usure } = k;
  const T = k.T;
  const facade = { couleur: COUL.facade, mat: m.enduit, ep: EP };
  // Façade est (regarde la caméra) : coupée à l'allège ; deux sorties de secours, les consignes, une fresque
  {
    const a = [XE, ZSUD];
    const bb = [XE, ZNORD];
    // u = ZSUD - z
    const ouv = [
      { u: ZSUD - 16, l: 1.6, bas: 0, haut: 2.3, type: "vide" },
      { u: ZSUD - 1, l: 1.6, bas: 0, haut: 2.3, type: "vide" },
    ];
    // la partie des boutiques, puis celle du supermarché (plus haute)
    murCoupe(k, T.est, a, [XE, ZS], { h: PARAPET, ...facade, ouvertures: ouv, breches: [{ u: 26, l: 4, profondeur: 1.2 * usure }] });
    const ouvN = [{ u: 14 - 8, l: 1.6, bas: 0, haut: 2.3, type: "vide", passage: false }];
    murCoupe(k, T.nord, [XE, ZS], bb, { h: HS + 0.5, ...facade, ouvertures: ouvN });
    bandes(a, bb, EP, [
      { y1: 0, y2: 0.45, s: 0.06, couleur: COUL.granit, mat: m.satin, ch: c, trous: [[5.2, 6.8], [22.2, 23.8]] },
      { y1: 3.0, y2: 3.25, s: 0.12, couleur: COUL.rouge, mat: m.satin, ch: T.est },
    ]);
    T.est.pave(XE + 0.1, PARAPET - 0.3, ZS, XE + 0.45, PARAPET, ZSUD, COUL.creme, m.enduit, { crasse: false });
    T.nord.pave(XE + 0.1, HS + 0.2, ZNORD, XE + 0.45, HS + 0.5, ZS, COUL.creme, m.enduit, { crasse: false });
    // les portes de secours : une battante entrouverte, une arrachée ; leur néon
    for (const [z, ang] of [[16, 1.0], [1, null]]) {
      if (ang !== null) c.repere({ x: XE + EP / 2, z: z + 0.8, ry: PI / 2 + ang }, () => c.boite(1.5, 2.2, 0.05, 0x7a8a8a, { x: 0.75, y: 1.1 }, m.tole));
      else c.boite(1.5, 0.05, 2.2, 0x7a8a8a, { x: XE + 1.4, y: 0.04, z: z + 0.3, ry: 0.4 }, m.tole);
      c.boite(0.06, 0.3, 0.7, 0x2a2826, { x: XE + EP / 2 + 0.03, y: 2.6, z }, m.satin);
      panneau(c, m.neon, R.sortie, { x: XE + EP / 2 + 0.07, y: 2.6, z, ry: PI / 2 }, 0.6, 0.3);
    }
    // les consignes de retrait automatiques (colis jamais retirés)
    consignes(k, XE + EP / 2, 19.6);
    // la fresque « SOLDES » délavée et les graffitis
    panneau(T.est, m.enseignes, R.soldes, { x: XE + EP / 2 + 0.02, y: 3.4, z: 7.5, ry: PI / 2 }, 3.2, 3.2);
    panneau(c, m.enseignes, R.graffiti2, { x: XE + EP / 2 + 0.02, y: 0.6, z: -8, ry: PI / 2 }, 3.6, 0.9);
    if (dansLot(k, XE + 2, 0)) {
      lierre(c, XE + 0.2, 0, -12, PI / 2, 4, 3 + 2 * usure, Math.round(30 + 40 * usure));
      lierre(T.est, XE + 0.2, 1, 9.5, PI / 2, 2, 3, Math.round(20 * usure));
      semerTouffes(c, XE + 0.2, ZNORD, XE + 1, ZSUD, Math.round(30 + 50 * usure));
    }
  }
  // Façade ouest (dos à la caméra) : pleine hauteur dans le chantier visible
  {
    const a = [XO, ZNORD];
    const bb = [XO, ZSUD];
    mur(c, a, [XO, ZS], { h: HS + 0.5, ...facade, batiment: k.b, ouvertures: [{ u: 10.2, l: 1.6, bas: 0, haut: 2.3, type: "vide" }] });
    mur(c, [XO, ZS], bb, { h: PARAPET, ...facade, batiment: k.b, breches: [{ u: 10, l: 5, profondeur: 1.5 * usure }] });
    if (k.galerie) c.repere({ x: XO - EP / 2, z: ZNORD + 10.2, ry: -PI / 2 }, () => c.boite(1.5, 2.2, 0.05, 0x7a8a8a, { x: 0.2, y: 0.03, z: 1.3, rx: -PI / 2 }, m.tole));
    if (dansLot(k, XO - 2, 0)) {
      lierre(c, XO - 0.2, 0, 4, -PI / 2, 8, 4 + 1.5 * usure, Math.round(50 + 60 * usure));
      lierre(c, XO - 0.2, 0, -20, -PI / 2, 5, 5, Math.round(30 + 40 * usure));
      semerTouffes(c, XO - 1.5, ZNORD, XO - 0.2, ZSUD, Math.round(30 + 50 * usure));
      arbuste(c, XO - 2, 12, 1.6);
      arbuste(c, XO - 2.5, -6, 1.3);
    }
  }
  // Façade nord (dos à la caméra) : le quai de livraison
  {
    const a = [XE, ZNORD];
    const bb = [XO, ZNORD];
    // u depuis x = 20 vers l'ouest : la porte du quai en x = 14 (u = 6)
    mur(c, a, bb, { h: HS + 0.5, ...facade, batiment: k.b, ouvertures: [{ u: 6, l: 3.2, bas: 0, haut: 3.6, type: "vide" }, { u: 12, l: 1.4, bas: 0, haut: 2.3, type: "vide" }] });
    // les auvents des quais
    c.pave(10, 4.1, ZNORD - 2.6, 18, 4.3, ZNORD, COUL.tole, m.tole);
    for (const x of [10.3, 17.7]) c.poutre([x, 4.1, ZNORD - 2.4], [x, 5.4, ZNORD - 0.2], 0.1, COUL.tole, m.tole);
    // le rideau de la porte du quai, à demi levé
    c.boite(3.4, 0.45, 0.35, COUL.rideau, { x: 14, y: 3.85, z: ZNORD - EP / 2 - 0.18 }, m.tole);
    c.repere({ x: 14, z: ZNORD - EP / 2 - 0.06, ry: PI }, () => panneau(c, m.enseignes, R.rideau, { y: 2.8 }, 3.2, 1.6, 0.55, 1));
  }
}

/** Les consignes de retrait (casiers de colis automatiques), plaquées contre la façade est, en z0. */
function consignes(k, x, z0) {
  const { c, m } = k;
  c.boite(0.6, 2.2, 3.2, COUL.canard, { x: x + 0.3, y: 1.1, z: z0 }, m.satin);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const ouvert = c.hasard() < 0.35;
    const zz = z0 - 1.2 + i * 0.8;
    const yy = 0.4 + j * 0.48;
    if (ouvert) c.repere({ x: x + 0.62, y: yy, z: zz - 0.36, ry: 1.3 }, () => c.boite(0.7, 0.42, 0.03, 0xd8d6cc, { x: 0.35 }, m.satin));
    else c.boite(0.03, 0.42, 0.72, 0xd8d6cc, { x: x + 0.61, y: yy, z: zz }, m.satin, { crasse: false });
  }
  c.boite(0.04, 0.3, 0.5, 0x123342, { x: x + 0.62, y: 2.0, z: z0 }, m.satin);
  eparpiller(k, c, x + 0.8, z0 - 1.5, x + 2.4, z0 + 1.5, 7, [COUL.carton, 0xc4a070, 0xe9dfc6]);
}

// ---------- Les toits ----------

function toits(k) {
  const { m, usure } = k;
  const T = k.T;
  // Les toits-terrasses des deux blocs de boutiques (entre l'allée et les façades)
  for (const [s, ch] of [[-1, T.ouest], [1, T.est]]) {
    const x1 = s < 0 ? XO : RAYON;
    const x2 = s < 0 ? -RAYON : XE;
    // la dalle (sauf au-dessus de l'atrium), avec un trou au-dessus d'une boutique : le toit a cédé
    const trou = s < 0 ? [-17, -13, 12, 16] : [14, 18, -12, -8];
    const [t1, t2, t3, t4] = trou;
    const xa = s < 0 ? [x1, -XA] : [XA, x2];
    const dalles = s < 0
      ? [[x1, x2, ZS, ZA1], [xa[0], xa[1], ZA1, ZA2], [x1, x2, ZA2, t3], [x1, x2, t4, ZSUD], [x1, t1, t3, t4], [t2, x2, t3, t4]]
      : [[x1, x2, ZA2, ZSUD], [xa[0], xa[1], ZA1, ZA2], [x1, x2, ZS, t3], [x1, x2, t4, ZA1], [x1, t1, t3, t4], [t2, x2, t3, t4]];
    for (const [a1, a2, b1, b2] of dalles) ch.pave(a1, HB, b1, a2, HB + 0.25, b2, 0x9a958a, m.enduit, { crasse: false, nuance: 0.02 });
    // l'acrotère côté allée (pas sur l'atrium)
    for (const [z1, z2] of [[ZS, ZA1], [ZA2, ZSUD]]) ch.pave(s < 0 ? -RAYON - 0.3 : RAYON, HB, z1, s < 0 ? -RAYON : RAYON + 0.3, PARAPET, z2, COUL.creme, m.enduit, { crasse: false });
    // sous le trou : le jour entre, les gravats sont tombés dans la boutique
    if (k.galerie) {
      raiDeLumiere(k.c, [(t1 + t2) / 2, HB, (t3 + t4) / 2], [(t1 + t2) / 2 - 1.6, 0.06, (t3 + t4) / 2 + 1.6], 2.6);
      gravats(k.c, (t1 + t2) / 2 - 0.8, (t3 + t4) / 2 + 0.6, 1.4, Math.round(8 + 10 * usure), [COUL.toit, COUL.creme, PALETTE.pierre]);
      mousse(k.c, (t1 + t2) / 2 - 1.2, 0.06, (t3 + t4) / 2 + 1.2, 1.2, 3);
    }
    // les blocs de climatisation, une gaine, des lanterneaux (bulles de plexiglas, certaines crevées)
    for (const z of [16, -10]) {
      const x = s * 15;
      ch.boite(2.2, 1.2, 1.4, 0xb9bcb8, { x, y: HB + 0.85, z }, m.tole);
      ch.poser(geoCylindre(0.45, 0.08, 10), m.tole, 0x4a4c4c, { x: x - 0.5, y: HB + 1.5, z });
      ch.poser(geoCylindre(0.45, 0.08, 10), m.tole, 0x4a4c4c, { x: x + 0.5, y: HB + 1.5, z });
      ch.boite(0.6, 0.6, 5, 0xa9aca8, { x: x - s * 2, y: HB + 0.6, z: z + 2.6 }, m.tole);
    }
    for (const [x, z] of [[s * 8.5, 19], [s * 15.5, 4], [s * 8.5, -12]]) {
      ch.boite(1.6, 0.35, 1.6, 0xb0aca2, { x, y: HB + 0.42, z }, m.tole);
      if (ch.hasard() > 0.35 * usure + 0.2) ch.poser(geoBoule(0.8, 0), m.satin, 0xd9e2e0, { x, y: HB + 0.6, z, e: [1, 0.4, 1] });
    }
    // flaques et mousse sur la terrasse, une touffe de bouleaux
    mousse(ch, s * 15, HB + 0.25, 8, 2.4, Math.round(3 + 5 * usure));
    mousse(ch, s * 16, HB + 0.25, -4, 2, Math.round(2 + 4 * usure));
    if (usure > 0.4) arbre(ch, s * 18.5, -1.5, 3.5, "bouleau", HB + 0.25);
    if (usure > 0.6) arbuste(ch, s * 7, 13, 1.2, HB + 0.25);
    mousse(ch, s * 9, HB + 0.25, -6, 1.8, Math.round(2 + 4 * usure));
    mousse(ch, s * 17, HB + 0.25, 19, 1.6, Math.round(2 + 4 * usure));
    // les panneaux solaires de l'Abondance (« Toit vert Watty ») : une rangée, des panneaux tombés ou volés
    for (let i = 0; i < 6; i++) {
      const z = (s < 0 ? -14.5 : 11.5) + i * 1.5;
      if (ch.hasard() < 0.3 * usure) continue;
      ch.boite(2.6, 0.05, 1.2, 0x23314f, { x: s * 12, y: HB + 0.65, z, rx: 0, rz: s * 0.35 }, m.tole);
      ch.boite(0.08, 0.55, 0.08, COUL.tole, { x: s * 12.8, y: HB + 0.5, z }, m.tole);
    }
    // l'effondrement : poutres qui pendent au bord du trou
    const [a1, a2, b1, b2] = trou;
    for (let x = a1 + 0.5; x < a2; x += 1.2) ch.poutre([x, HB, b1], [x + 0.3, HB - 1.6 * usure - 0.2, b1 + 1.2], 0.12, PALETTE.rouille, m.tole);
  }
  // Le toit du supermarché (plus haut), avec un grand lanterneau en dents de scie
  {
    const ch = T.nord;
    ch.pave(XO, HS, ZNORD, XE, HS + 0.25, ZS, 0x9a958a, m.enduit, { crasse: false, nuance: 0.02 });
    ch.pave(XO, HS, ZS - 0.3, XE, HS + 0.6, ZS, COUL.creme, m.enduit, { crasse: false });
    for (const x of [-14, -8, 8, 14]) {
      ch.boite(2.4, 1.0, 1.6, 0xb9bcb8, { x, y: HS + 0.75, z: -25 }, m.tole);
      ch.poser(geoCylindre(0.5, 0.08, 10), m.tole, 0x4a4c4c, { x, y: HS + 1.3, z: -25 });
    }
    ch.boite(36, 0.5, 0.5, 0xa9aca8, { x: 0, y: HS + 0.5, z: -27 }, m.tole);
    mousse(ch, -10, HS + 0.25, -21, 3, Math.round(3 + 5 * usure));
    // l'enseigne PLUS-PLUS sur l'acrotère, au-dessus du bloc ouest (lisible du parking)
    ch.boite(8.4, 1.9, 0.2, 0x2a2826, { x: -12.5, y: HS + 1.5, z: ZS - 0.1 }, m.satin);
    panneau(ch, m.enseignes, R.plusPlus, { x: -12.5, y: HS + 1.5, z: ZS + 0.02 }, 8, 2);
    for (const x of [-15.5, -9.5]) ch.poutre([x, HS + 0.25, ZS - 1.5], [x, HS + 2.2, ZS - 0.2], 0.1, COUL.tole, m.tole);
  }
}

// ---------- La verrière en berceau, l'atrium haut ----------

function verriere(k) {
  const { c, m, usure } = k;
  const V = k.T.verriere;
  const nSeg = 8;
  const arc = [];
  for (let i = 0; i <= nSeg; i++) {
    const t = (i / nSeg) * PI;
    arc.push([Math.cos(t) * RAYON, NAISSANCE + Math.sin(t) * RAYON]);
  }
  // Les murs hauts de l'allée (au-dessus des boutiques), percés de fenêtres hautes
  for (const s of [-1, 1]) {
    const x = s * RAYON;
    for (const [z1, z2] of [[ZA2, ZSUD], [ZS, ZA1]]) {
      const a = s < 0 ? [x, z2] : [x, z1];
      const bb = s < 0 ? [x, z1] : [x, z2];
      const L = z2 - z1;
      const ouv = [];
      for (let u = 1.9; u < L - 1; u += 3.8) ouv.push({ u, l: 2.2, bas: 0.5, haut: 2.3, type: "fenetre", croisillons: 1, traverses: 1, cadre: COUL.tole, matCadre: m.tole, bris: k.bris, verre: m.verre, appui: false });
      mur(V, a, bb, { y0: HB, h: NAISSANCE - HB, ep: 0.3, couleur: COUL.creme, mat: m.enduit, ouvertures: ouv });
    }
    // La poutre de rive du berceau (sur toute la longueur)
    V.pave(x - 0.25, NAISSANCE - 0.3, ZS, x + 0.25, NAISSANCE, ZSUD, COUL.tole, m.metal, { crasse: false });
  }
  // Les fermes en arc, une tous les 3,8 m ; les pannes ; les vitres (il en manque)
  const zs = [];
  for (let z = ZSUD; z >= ZS - 0.01; z -= 3.8) zs.push(z);
  if (zs[zs.length - 1] > ZS + 0.5) zs.push(ZS);
  for (const z of zs) {
    for (let i = 0; i < nSeg; i++) V.poutre([arc[i][0], arc[i][1], z], [arc[i + 1][0], arc[i + 1][1], z], 0.18, COUL.tole, m.metal);
    // le tirant et ses suspentes
    V.poutre([-RAYON, NAISSANCE, z], [RAYON, NAISSANCE, z], 0.06, COUL.tole, m.metal);
    V.poutre([0, NAISSANCE, z], [0, NAISSANCE + RAYON, z], 0.04, COUL.tole, m.metal);
  }
  for (let i = 0; i <= nSeg; i++) V.poutre([arc[i][0], arc[i][1], ZS], [arc[i][0], arc[i][1], ZSUD], 0.1, COUL.tole, m.metal);
  // le lanterneau du faîtage
  V.pave(-0.4, NAISSANCE + RAYON, ZS, 0.4, NAISSANCE + RAYON + 0.3, ZSUD, COUL.tole, m.metal, { crasse: false });
  const trous = [];
  for (let j = 0; j < zs.length - 1; j++) {
    const za = zs[j];
    const zb = zs[j + 1];
    for (let i = 0; i < nSeg; i++) {
      const [x1, y1] = arc[i];
      const [x2, y2] = arc[i + 1];
      const r = V.hasard();
      if (r < 0.12 + 0.5 * usure) {
        trous.push([(x1 + x2) / 2, (y1 + y2) / 2, (za + zb) / 2]);
        continue;
      }
      const ang = Math.atan2(y2 - y1, x2 - x1);
      V.boite(Math.hypot(x2 - x1, y2 - y1) - 0.06, 0.02, za - zb - 0.08, 0xffffff, { x: (x1 + x2) / 2, y: (y1 + y2) / 2, z: (za + zb) / 2, rz: ang }, m.verre, { crasse: false });
    }
  }
  // Le panneau solaire bricolé qui alimente l'écran de l'atrium
  V.boite(1.6, 0.06, 1.0, 0x1d2a44, { x: 2.2, y: NAISSANCE + RAYON - 0.35, z: 3, rz: -0.35 }, m.metal);
  V.poutre([2.2, NAISSANCE + RAYON - 0.35, 3], [0.6, MEZZ + 0.3, -0.6], 0.03, COUL.noir, m.satin);
  // Les rais de lumière par les vitres manquantes (quelques-uns, les plus spectaculaires)
  if (k.galerie || k.parking) {
    const choix = trous.filter((t) => Math.abs(t[0]) < 4).filter((_, i) => i % 3 === 0).slice(0, 7);
    for (const [x, y, z] of choix) {
      if (!dansLot(k, x, z)) continue;
      raiDeLumiere(c, [x, y, z], [x - 2.4, 0.06, z + 2.4], 1.6);
      if (usure > 0.3) {
        mousse(c, x - 2.4, 0.05, z + 2.4, 0.9, 3);
        flaque(c, x - 2.2, z + 2.2, 0.8, 0.065);
      }
    }
  }
  // L'éventail nord (au-dessus de l'entrée du supermarché)
  eventail(k, V, ZS - 0.05, -1);
  V.pave(-RAYON, HS, ZS - 0.15, RAYON, NAISSANCE, ZS + 0.15, COUL.creme, m.enduit, { crasse: false });

  // L'atrium haut : murs à x = ±11 et en z = -4 / 10 (des vitrines d'étage, mortes), coursives, passerelle, verrières en appentis
  for (const s of [-1, 1]) {
    const x = s * XA;
    // les murs de l'étage, au-dessus des boutiques du bas
    // (une bande de fenêtres hautes sous la corniche, une corniche ocre, des pilastres)
    const fenHautes = (L) => {
      const o = [];
      for (let u = 1.2; u < L - 0.8; u += 2.3) o.push({ u, l: 1.5, bas: HA - HB - 1.9, haut: HA - HB - 0.5, type: "fenetre", croisillons: 1, traverses: 1, cadre: COUL.tole, matCadre: m.metal, bris: k.bris, verre: m.verre, appui: false });
      return o;
    };
    mur(V, s < 0 ? [x, ZA1] : [x, ZA2], s < 0 ? [x, ZA2] : [x, ZA1], { y0: HB, h: HA - HB, ep: 0.3, couleur: COUL.creme, mat: m.enduit, ouvertures: fenHautes(ZA2 - ZA1) });
    mur(V, s < 0 ? [-RAYON, ZA2] : [XA, ZA2], s < 0 ? [-XA, ZA2] : [RAYON, ZA2], { y0: HB, h: HA - HB, ep: 0.3, couleur: COUL.creme, mat: m.enduit, ouvertures: fenHautes(XA - RAYON) });
    mur(V, s < 0 ? [-XA, ZA1] : [RAYON, ZA1], s < 0 ? [-RAYON, ZA1] : [XA, ZA1], { y0: HB, h: HA - HB, ep: 0.3, couleur: COUL.creme, mat: m.enduit });
    V.pave(Math.min(x, s * RAYON) - 0.2, HA - 0.1, ZA1 - 0.25, Math.max(x, s * RAYON) + 0.2, HA + 0.25, ZA1 + 0.25, COUL.ocre, m.enduit, { crasse: false });
    V.pave(Math.min(x, s * RAYON) - 0.2, HA - 0.1, ZA2 - 0.25, Math.max(x, s * RAYON) + 0.2, HA + 0.25, ZA2 + 0.25, COUL.ocre, m.enduit, { crasse: false });
    V.pave(x - 0.3, HA - 0.1, ZA1, x + 0.3, HA + 0.25, ZA2, COUL.ocre, m.enduit, { crasse: false });
    for (const z of [ZA1, 3, ZA2]) V.pave(x - 0.28, HB, z - 0.3, x + 0.28, HA, z + 0.3, COUL.creme, m.enduit, { nuance: 0.03 });
    // les vitrines de l'étage, face à l'atrium (sombres, rideaux baissés)
    for (let z = ZA1 + 1.5; z < ZA2 - 1; z += 4.6) {
      V.boite(0.05, 2.6, 3.6, 0x1a2228, { x: x - s * 0.18, y: MEZZ + 0.4 + 1.3, z: z + 1.8 }, m.satin);
      if (V.hasard() < 0.5) panneau(V, m.enseignes, R.rideau, { x: x - s * 0.22, y: MEZZ + 0.4 + 1.3, z: z + 1.8, ry: -s * PI / 2 }, 3.4, 2.5);
      V.boite(0.12, 0.6, 3.8, 0x2a2826, { x: x - s * 0.2, y: MEZZ + 3.4, z: z + 1.8 }, m.satin);
    }
    // les vitrines de l'étage sur la face sud du mur nord (z = -4), vues de la caméra
    V.pave(s < 0 ? -XA + 0.4 : RAYON + 0.4, MEZZ + 0.4, ZA1 + 0.15, s < 0 ? -RAYON - 0.4 : XA - 0.4, MEZZ + 3.0, ZA1 + 0.17, 0x1a2228, m.satin, { crasse: false });
    vitrage(k, V, V, s < 0 ? [-XA, ZA1 + 0.16] : [RAYON, ZA1 + 0.16], s < 0 ? [-RAYON, ZA1 + 0.16] : [XA, ZA1 + 0.16], 0.4, 5.6, MEZZ + 0.4, MEZZ + 3.0, { pas: 1.6, bris: k.bris, cut: 0 });
    V.boite(4.4, 0.6, 0.1, 0x2a2826, { x: s * 8, y: MEZZ + 3.5, z: ZA1 + 0.25 }, m.satin);
    panneau(V, m.enseignes, s < 0 ? R.graffiti : R.soldes, { x: s * 8, y: MEZZ + 3.5, z: ZA1 + 0.31 }, s < 0 ? 2.4 : 0.6, 0.6);
    // la coursive (dalle, nez de dalle, garde-corps vitré et main courante)
    V.pave(Math.min(x, s * XP), MEZZ, ZA1, Math.max(x, s * XP), MEZZ + 0.4, ZA2, COUL.creme, m.enduit, { nuance: 0.02 });
    V.pave(s * XP - 0.06, MEZZ - 0.05, ZA1, s * XP + 0.06, MEZZ + 0.45, ZA2, COUL.ocre, m.satin, { crasse: false });
    for (let z = ZA1 + 0.1; z < ZA2 - 0.5; z += 1.4) {
      if (V.hasard() < k.bris * 0.6) continue;
      V.boite(0.02, 0.9, 1.3, 0xffffff, { x: s * XP, y: MEZZ + 0.9, z: z + 0.7 }, m.verre, { crasse: false });
    }
    V.pave(s * XP - 0.05, MEZZ + 1.32, ZA1, s * XP + 0.05, MEZZ + 1.4, ZA2, COUL.chrome, m.metal, { crasse: false });
    // la verrière en appentis au-dessus des coursives
    const ang = Math.atan2(HA - NAISSANCE, XA - RAYON);
    const lg = Math.hypot(HA - NAISSANCE, XA - RAYON);
    for (let z = ZA1; z < ZA2 - 0.1; z += 2) {
      V.boite(lg, 0.1, 0.1, COUL.tole, { x: s * (RAYON + XA) / 2, y: (HA + NAISSANCE) / 2 + 0.1, z, rz: s * ang }, m.metal);
      if (V.hasard() < 0.15 + 0.4 * usure) continue;
      V.boite(lg - 0.1, 0.02, 1.92, 0xffffff, { x: s * (RAYON + XA) / 2, y: (HA + NAISSANCE) / 2 + 0.12, z: z + 1, rz: s * ang }, m.verre, { crasse: false });
    }
    // la poutre qui porte le berceau au-dessus de l'atrium, et les colonnes
    if (k.galerie) {
      for (const z of [ZA1, 3, ZA2]) c.tube([s * RAYON, 0, z], [s * RAYON, NAISSANCE - 0.3, z], 0.26, COUL.creme, m.satin, 8);
      for (const z of [ZA1, 3, ZA2]) c.boite(0.7, 0.3, 0.7, COUL.ocre, { x: s * RAYON, y: 0.15, z }, m.satin);
    }
  }
  // La passerelle (au nord de l'atrium) : la travée du milieu s'est effondrée en travers
  {
    const effondree = usure >= 0.45;
    const z1 = ZA1;
    const z2 = ZPASS;
    for (const [x1, x2] of effondree ? [[-XP, -3], [3.6, XP]] : [[-XP, XP]]) {
      V.pave(x1, MEZZ, z1, x2, MEZZ + 0.4, z2, COUL.creme, m.enduit, { nuance: 0.02 });
      V.pave(x1, MEZZ - 0.05, z2 - 0.06, x2, MEZZ + 0.45, z2 + 0.06, COUL.ocre, m.satin, { crasse: false });
      for (let x = x1 + 0.1; x < x2 - 0.5; x += 1.4) {
        if (V.hasard() < k.bris * 0.6) continue;
        V.boite(1.3, 0.9, 0.02, 0xffffff, { x: x + 0.7, y: MEZZ + 0.9, z: z2 }, m.verre, { crasse: false });
      }
      V.pave(x1, MEZZ + 1.32, z2 - 0.05, x2, MEZZ + 1.4, z2 + 0.05, COUL.chrome, m.metal, { crasse: false });
    }
    if (effondree && k.galerie) {
      // la travée tombée : accrochée à l'ouest, posée au sol à l'est, parmi les gravats
      const L = 6.6;
      const ang = Math.asin((MEZZ + 0.2) / L);
      c.repere({ x: -3, y: MEZZ + 0.2, z: (z1 + z2) / 2, rz: -ang }, () => {
        c.boite(L, 0.4, z2 - z1, COUL.creme, { x: L / 2, y: -0.2 }, m.enduit, { nuance: 0.02 });
        c.boite(L, 0.08, 0.08, COUL.chrome, { x: L / 2, y: 1.3, z: z2 - (z1 + z2) / 2 }, m.metal);
        for (let x = 0.5; x < L; x += 1.6) c.poutre([x, 0, z2 - (z1 + z2) / 2], [x + 0.3, 1.3, z2 - (z1 + z2) / 2], 0.05, COUL.chrome, m.metal);
      });
      gravats(c, 1.6, -2.6, 1.5, Math.round(10 + 10 * usure), [COUL.creme, PALETTE.pierre, COUL.ocre]);
      debris(c, -4, -4, 5, 0, Math.round(20 + 20 * usure));
      for (let i = 0; i < 6; i++) carreau(c, m.verre, c.entre(-3, 4), 0.06, 0.6, 0.4, 0.95, c.entre(-3.6, -0.5));
      k.b.obstacle(-0.5, -2.6, 2.4, -2.6, "passerelle effondrée");
    }
  }
}

// ---------- La marquise de l'entrée, les lettres tombées ----------

function marquise(k) {
  const { c, m, usure } = k;
  const M = k.T.marquise;
  const z1 = ZSUD;
  const z2 = ZSUD + 5.2;
  const penche = usure > 0.55;
  // la dalle : la moitié est s'est décrochée d'un pilier et pend
  M.pave(-8.5, 4.0, z1, penche ? 3 : 8.5, 4.35, z2, COUL.tole, m.tole, { nuance: 0.02 });
  M.pave(-8.6, 4.0, z2 - 0.05, penche ? 3 : 8.6, 4.5, z2 + 0.1, COUL.rouge, m.satin, { crasse: false });
  if (penche) {
    M.repere({ x: 3, y: 4.17, z: (z1 + z2) / 2, rz: -0.16, rx: 0.05 }, () => {
      M.boite(5.5, 0.35, z2 - z1, COUL.tole, { x: 2.75 }, m.tole);
      M.boite(5.6, 0.5, 0.15, COUL.rouge, { x: 2.75, y: 0.07, z: (z2 - z1) / 2 }, m.satin);
    });
  }
  // les spots éteints sous la dalle
  for (let x = -7; x < 3; x += 2.5) for (const z of [z1 + 1.5, z1 + 3.8]) M.poser(geoCylindre(0.12, 0.06, 6), m.metal, 0xdedad0, { x, y: 3.97, z });
  // les poteaux (l'un tordu)
  for (const x of [-8, -3.5, 3.5, 8]) {
    if (x === 8 && penche) {
      c.tube([x, 0, z2 - 0.4], [x - 0.2, 1.4, z2 - 0.3], 0.13, COUL.chrome, m.metal, 8);
      c.tube([x - 0.2, 1.4, z2 - 0.3], [x + 1.4, 0.2, z2 + 0.8], 0.13, COUL.chrome, m.metal, 8);
      continue;
    }
    c.tube([x, 0, z2 - 0.4], [x, CUT + 2.9, z2 - 0.4], 0.13, COUL.chrome, m.metal, 8);
  }
  // Le titre en lettres géantes sur la marquise : GA_ERIE DE L'AB_NDANCE
  M.boite(16.4, 0.12, 0.12, COUL.tole, { x: 0, y: 4.45, z: z2 - 0.5 }, m.tole);
  M.boite(16.4, 0.08, 0.08, COUL.tole, { x: 0, y: 6.4, z: z2 - 0.6 }, m.tole);
  panneau(M, m.enseignes, R.titre, { x: 0, y: 5.6, z: z2 - 0.45 }, 16, 2.5);
  // Les lettres tombées : le L sur le parvis, le O contre un poteau
  panneau(c, m.enseignes, R.lettreL, { x: -6.4, y: 0.06, z: z2 + 1.2, rx: -PI / 2, rz: 0.4 }, 1.3, 1.3);
  panneau(c, m.enseignes, R.lettreO, { x: 3.0, y: 0.6, z: z2 + 0.2, rx: -0.35, ry: 0.3 }, 1.3, 1.3);
}

/** La barricade des survivants devant l'entrée : caddies sanglés, palettes, un passage au milieu. */
function barricade(k) {
  const { c, m } = k;
  const z = ZSUD + 1.6;
  for (const [x1, x2] of [[-5.5, -0.9], [1.1, 5.5]]) {
    for (let x = x1 + 0.5; x < x2; x += 1.0) caddie(k, c, x, z + c.entre(-0.2, 0.2), PI / 2 + c.entre(-0.3, 0.3), c.hasard() < 0.25);
    c.boite(x2 - x1, 1.0, 0.12, COUL.bois, { x: (x1 + x2) / 2, y: 0.6, z: z - 0.5, rz: c.entre(-0.05, 0.05) }, m.mat, { nuance: 0.08 });
    c.boite(x2 - x1, 0.05, 0.05, COUL.jaune, { x: (x1 + x2) / 2, y: 0.8, z: z + 0.32 }, m.toile);
    k.b.obstacle(x1, z, x2, z, "barricade de caddies");
  }
  // deux palettes debout, un panneau peint
  for (const x of [-6.4, 6.4]) c.boite(1.2, 1.0, 0.15, COUL.bois, { x, y: 0.5, z: z - 0.2, ry: x > 0 ? 0.3 : -0.3 }, m.mat, { nuance: 0.1 });
  panneau(c, m.enseignes, R.graffiti, { x: -3.2, y: 0.62, z: z - 0.42 }, 2.6, 0.65);
}

/** L'écran publicitaire qui boucle encore sur son panneau solaire : un totem, trois images, un clignement de temps en temps. */
function ecranAnime(k) {
  const { c, m } = k;
  // dans l'atrium (face au sud-est), ou sur le parvis (face au sud)
  const [x, z, ry] = k.galerie ? [-8.6, 6.4, PI / 4] : [-9, ZSUD + 3.0, 0];
  const [y, l, h] = [3.1, 2.6, 1.56];
  c.repere({ x, z, ry }, () => {
    c.boite(0.4, y + 1.0, 0.4, 0x2a2c2e, { y: (y + 1.0) / 2, z: -0.25 }, m.satin);
    c.boite(2.8, 1.76, 0.24, 0x1a1c1f, { y, z: -0.14 }, m.satin);
    c.boite(1.0, 0.25, 0.6, 0x3a3c3c, { y: 0.12, z: -0.25 }, m.satin);
    if (k.parking) {
      c.boite(1.8, 0.05, 1.1, 0x1d2a44, { y: y + 1.25, z: -0.3, rx: -0.5 }, m.metal);
      c.poutre([0, y + 0.88, -0.25], [0, y + 1.2, -0.3], 0.05, COUL.noir, m.satin);
    } else c.poutre([0, y + 0.88, -0.25], [0.4, NAISSANCE - 0.5, -2], 0.03, COUL.noir, m.satin);
  });
  k.b.obstacle(x - 0.3, z, x + 0.3, z, "totem publicitaire");
  const tex = m.atlas.clone();
  tex.needsUpdate = true;
  tex.repeat.set(R.ecran1[2] / AL, R.ecran1[3] / AH);
  const oy = 1 - (R.ecran1[1] + R.ecran1[3]) / AH;
  tex.offset.set(R.ecran1[0] / AL, oy);
  const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  mat.userData.sansOmbre = true;
  const ecran = new THREE.Mesh(new THREE.PlaneGeometry(l, h), mat);
  ecran.position.set(x, y, z);
  ecran.rotation.y = ry;
  const cadres = [R.ecran1, R.ecran2, R.ecran3];
  let glitch = 0;
  ecran.userData.animer = (t) => {
    const i = Math.floor(t / 3.2) % 3;
    tex.offset.x = cadres[i][0] / AL;
    // de temps en temps, l'image saute
    if (Math.random() < 0.004) glitch = t + 0.15;
    const v = t < glitch ? 0.35 : 1;
    mat.color.setRGB(v, v, v);
  };
  const g = new THREE.Group();
  g.add(ecran);
  k.b.ajouter(g);
}

// ---------- Depuis le parking : le seuil de l'entrée ----------

function entreeVueDuParking(k) {
  const { c, m, usure } = k;
  // Le sas d'entrée (seul l'avant de l'allée est dans le lot) : dallage, débris, un palmier mort
  palmier(k, c, 0, 18.8, 3.8, true);
  debris(c, -4.5, 18.5, 4.5, 21.8, Math.round(20 + 20 * usure));
  jonchee(c, -4.5, 18.5, 4.5, 21.8, Math.round(30 + 30 * usure));
  // l'avant des deux boutiques d'angle (vu par les vitrines de la façade)
  for (const s of [-1, 1]) {
    tele(k, c, s * 16, 1.2, ZSUD - 1.2, 0, { pied: true });
    if (s < 0) tele(k, c, -9, 1.2, ZSUD - 1.2, 0, { ecran: R.tvMaj, pied: true });
    else {
      c.poser(geoBoule(0.55, 1), m.toile, 0xb08a5a, { x: 9, y: 0.55, z: ZSUD - 1.4 });
      c.poser(geoBoule(0.38, 1), m.toile, 0xb08a5a, { x: 9, y: 1.35, z: ZSUD - 1.4 });
    }
  }
}

// ---------- Le parking ----------

function parking(k) {
  const { c, m, usure } = k;
  const b = k.b;
  // La voie de dépose (devant la marquise) : passage piéton
  for (let x = -3; x <= 3; x += 0.9) if (c.hasard() > 0.25 * usure) c.boite(0.5, 0.012, 4.2, COUL.ligne, { x, y: 0.015, z: 28.6 }, m.satin, { crasse: false });
  // Les lignes de stationnement (effacées par endroits) ; les rangées : z 31-36, 41-46 / 46-51, 57-62
  const rangees = [[31, 36], [41, 46], [46, 51], [57, 62]];
  for (const [za, zb] of rangees) {
    for (let x = -34; x <= 34; x += 2.6) {
      if (c.hasard() < 0.25 + 0.4 * usure) continue;
      c.boite(0.12, 0.012, zb - za, COUL.ligne, { x, y: 0.015, z: (za + zb) / 2 }, m.satin, { crasse: false });
    }
  }
  for (const z of [36, 41, 51, 57]) for (let x = -34; x < 34; x += 6) if (c.hasard() > 0.35 + 0.3 * usure) c.boite(5.5, 0.012, 0.12, COUL.ligne, { x: x + 3, y: 0.015, z }, m.satin, { crasse: false });
  // Les flèches au sol, à demi effacées
  for (const [x, z, ry] of [[-14, 38.5, 0], [10, 38.5, 0], [-6, 54, PI], [20, 54, PI]]) {
    c.repere({ x, y: 0.015, z, ry }, () => {
      c.boite(2.2, 0.012, 0.3, COUL.ligne, {}, m.satin, { crasse: false });
      c.boite(0.8, 0.012, 0.25, COUL.ligne, { x: 1.0, z: 0.25, ry: 0.7 }, m.satin, { crasse: false });
      c.boite(0.8, 0.012, 0.25, COUL.ligne, { x: 1.0, z: -0.25, ry: -0.7 }, m.satin, { crasse: false });
    });
  }
  // Les îlots plantés (bordures, arbres devenus sauvages) et les lampadaires
  for (const [x1, x2] of [[-34, -26], [-4, 4], [22, 34]]) {
    c.pave(x1, 0, 45.4, x2, 0.15, 46.6, 0xb0aba0, m.asphalte, { nuance: 0.02 });
    c.pave(x1 + 0.2, 0.15, 45.6, x2 - 0.2, 0.17, 46.4, PALETTE.terreSombre, m.mat, { crasse: false });
    semerTouffes(c, x1, 45, x2, 47, Math.round(14 + 20 * usure), PALETTE.herbe);
    arbre(c, (x1 + x2) / 2 + c.entre(-1.5, 1.5), 46, 6 + 2 * usure, "feuillu");
    arbuste(c, x1 + 1.5, 46, 1.2);
    b.obstacle(x1, 46, x2, 46, "îlot planté");
  }
  // Les lampadaires : l'un tordu, l'un couché sur les places, l'un (solaire) qui marche encore
  for (const [x, z, etat] of [[-22, 46, "couche"], [-8, 46, "droit"], [12, 46, "solaire"], [26.5, 46, "tordu"], [-30, 30.5, "droit"], [22, 30.5, "droit"]]) lampadaire(k, x, z, etat);
  // La file des voitures autonomes, sur la voie de dépose, en route vers une sortie qu'elles n'atteindront jamais
  const tons = [0xe2ddd0, 0x8fb0b4, 0xd2c08a, 0xe2ddd0, 0xb7a6c4, 0xc9cdd0, 0x8fb0b4];
  for (let i = 0; i < 7; i++) {
    const x = -27 + i * 5.2;
    const accident = i === 4;
    voiture(k, c, x, 28.4 + (accident ? 0.3 : 0), accident ? 0.18 : c.entre(-0.03, 0.03), tons[i], { porte: i === 0 || i === 3, mousse: usure > 0.5 && i % 2 === 0, affaisse: i === 2 });
    b.obstacle(x - 2.2, 28.4, x + 2.2, 28.4, "voiture autonome");
  }
  // la voiture accidentée a embouti celle de devant : débris de verre
  debris(c, -6.5, 27, -4.5, 30, 10, [0xcfd8d8, 0x9aa1a4, 0xe2ddd0]);
  // Quelques voitures garées (de travers), une envahie par les herbes
  for (const [x, z, ry, t] of [[-27, 53.5, PI / 2 + 0.2, 0xd2c08a], [-14.8, 33.5, PI / 2, 0xe2ddd0], [5.6, 59.5, -PI / 2 + 0.1, 0xb7a6c4], [18, 43.5, PI / 2 - 0.25, 0x8fb0b4], [30, 33.5, PI / 2, 0xc9cdd0], [-32.4, 48.9, -PI / 2, 0x8fb0b4], [-6.6, 43.4, PI / 2 + 0.08, 0xe2ddd0], [23.4, 59.6, -PI / 2, 0xd2c08a], [-29.8, 43.0, PI / 2, 0xb7a6c4]]) {
    voiture(k, c, x, z, ry, t, { mousse: usure > 0.4, affaisse: c.hasard() < 0.5 });
    b.obstacle(x - Math.cos(ry) * 2.2, z + Math.sin(ry) * 2.2, x + Math.cos(ry) * 2.2, z - Math.sin(ry) * 2.2, "voiture autonome");
    semerTouffes(c, x - 2, z - 2, x + 2, z + 2, Math.round(8 + 12 * usure), PALETTE.herbe);
  }
  // L'abri à caddies (dans l'îlot central est), les caddies emboîtés
  {
    const x1 = 11.5;
    const x2 = 18;
    const z = 49.5;
    for (const x of [x1, x2]) for (const zz of [z - 0.9, z + 0.9]) c.tube([x, 0, zz], [x, 2.3, zz], 0.05, COUL.tole, m.metal, 6);
    c.pave(x1 - 0.2, 2.3, z - 1.1, x2 + 0.2, 2.4, z + 1.1, COUL.canard, m.tole);
    for (const zz of [z - 0.9, z + 0.9]) c.pave(x1, 0.9, zz - 0.03, x2, 0.95, zz + 0.03, COUL.tole, m.metal);
    for (let x = x1 + 0.6; x < x2 - 0.3; x += 0.42) caddie(k, c, x, z, 0);
    b.obstacle(x1, z - 0.9, x2, z - 0.9, "abri à caddies");
    b.obstacle(x1, z + 0.9, x2, z + 0.9, "abri à caddies");
  }
  // Les caddies abandonnés, un peu partout (deux couchés)
  for (const [x, z, r] of [[-20, 38.4, false], [-11.5, 43, true], [-2, 39.5, false], [3.5, 55, false], [8, 37, false], [16, 55.5, true], [24, 39, false], [-31, 56, false], [27.5, 60.5, false], [-17, 59, false], [9.5, 31.7, false]]) caddie(k, c, x, z, c.hasard() * 6, r);
  // Le drone de livraison écrasé
  c.repere({ x: 6.5, y: 0.15, z: 40, ry: 0.6, rz: 0.25 }, () => {
    c.boite(0.6, 0.25, 0.6, 0xe5e2da, {}, m.satin);
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      c.poutre([0, 0, 0], [sx * 0.6, 0.05, sz * 0.6], 0.05, 0x3a3c3c, m.satin);
      c.poser(geoCylindre(0.25, 0.02, 8), m.satin, 0x3a3c3c, { x: sx * 0.6, y: 0.1, z: sz * 0.6 });
    }
    c.boite(0.4, 0.3, 0.3, COUL.carton, { x: 0.6, y: -0.05, z: 0.5, ry: 0.4 }, m.mat);
  });
  // L'herbe dans les fissures, des flaques, des feuilles mortes
  semerTouffes(c, -34, 30, 34, 64, Math.round(80 + 120 * usure));
  for (const [x, z, r] of [[-18, 40, 1.4], [4, 50, 2.0], [22, 58, 1.2], [-6, 61, 1.6], [14, 34, 1.0]]) flaque(c, x, z, r * (0.6 + usure * 0.5), 0.02);
  jonchee(c, -34, 40, 34, 52, Math.round(30 + 50 * usure));
  for (const [x, z] of [[-30, 40], [-10, 62], [8, 44], [30, 52]]) mousse(c, x, 0.01, z, 1.8, Math.round(2 + 3 * usure));
  // La haie le long de l'ouest, tombée par endroits
  for (let z = 30; z < 64; z += 3.2) if (c.hasard() > 0.3) arbuste(c, -35, z, 1.4 + c.hasard() * 0.6);
  // La barrière d'entrée du parking, levée pour toujours
  c.boite(0.4, 1.1, 0.4, COUL.jaune, { x: -1.5, y: 0.55, z: 64 }, m.satin);
  c.repere({ x: -1.5, y: 1.0, z: 64, rz: 1.35 }, () => c.boite(4.0, 0.1, 0.1, 0xe9dfc6, { x: 2 }, m.satin));
}

/** Un lampadaire de parking à double crosse. États : « droit », « tordu », « couche », « solaire » (il marche). */
function lampadaire(k, x, z, etat) {
  const { c, m } = k;
  const h = 8;
  if (etat === "couche") {
    c.boite(0.6, 0.3, 0.6, COUL.tole, { x, y: 0.15, z }, m.tole);
    c.tube([x, 0.3, z], [x + 0.4, 0.5, z], 0.1, COUL.tole, m.tole, 6);
    c.tube([x + 0.4, 0.25, z], [x + 8, 0.25, z + 2.5], 0.1, COUL.tole, m.tole, 6);
    c.boite(1.0, 0.25, 0.5, 0x3a3c3c, { x: x + 8.4, y: 0.2, z: z + 2.6, ry: -0.3 }, m.satin);
    debris(c, x + 7, z + 1.5, x + 9.5, z + 3.5, 8, [0xcfd8d8, 0x9aa1a4]);
    return;
  }
  c.boite(0.6, 0.4, 0.6, 0xb0aba0, { x, y: 0.2, z }, m.satin);
  const top = etat === "tordu" ? [x + 1.4, h - 0.6, z + 0.8] : [x, h, z];
  if (etat === "tordu") {
    c.tube([x, 0.4, z], [x + 0.15, 4, z + 0.1], 0.1, COUL.tole, m.tole, 6);
    c.tube([x + 0.15, 4, z + 0.1], top, 0.09, COUL.tole, m.tole, 6);
  } else c.tube([x, 0.4, z], top, 0.1, COUL.tole, m.tole, 6);
  for (const s of [-1, 1]) {
    c.poutre(top, [top[0] + s * 1.3, top[1] + 0.25, top[2]], 0.08, COUL.tole, m.tole);
    c.boite(0.8, 0.18, 0.35, 0x3a3c3c, { x: top[0] + s * 1.6, y: top[1] + 0.2, z: top[2] }, m.satin);
    c.boite(0.6, 0.02, 0.25, etat === "solaire" ? 0xfff6dc : 0x8a8d8a, { x: top[0] + s * 1.6, y: top[1] + 0.1, z: top[2] }, etat === "solaire" ? m.neon : m.satin);
  }
  if (etat === "solaire") {
    c.boite(1.3, 0.05, 0.8, 0x1d2a44, { x: top[0], y: top[1] + 0.7, z: top[2], rx: -0.4 }, m.metal);
    c.tube([top[0], top[1], top[2]], [top[0], top[1] + 0.68, top[2]], 0.05, COUL.tole, m.tole, 6);
    c.boite(0.3, 0.5, 0.2, 0xb9bcb8, { x, y: 2.2, z: z + 0.15 }, m.tole);
  }
}

/** Le pylône de l'enseigne : « GA_ERIE DE L'AB_NDANCE », bandeau des boutiques, échelle, Watty en haut. */
function pylone(k) {
  const { c, m, usure } = k;
  const P = k.T.pylone;
  const x = 31;
  const z = 57;
  c.pave(x - 3.6, 0, z - 1, x + 3.6, 0.5, z + 1, 0xb0aba0, m.satin, { nuance: 0.02 });
  for (const s of [-1, 1]) {
    c.pave(x + s * 2.6 - 0.35, 0.5, z - 0.35, x + s * 2.6 + 0.35, 4.5, z + 0.35, COUL.rouge, m.satin, { nuance: 0.03 });
    P.pave(x + s * 2.6 - 0.35, 4.5, z - 0.35, x + s * 2.6 + 0.35, 13.6, z + 0.35, COUL.rouge, m.satin, { nuance: 0.03 });
  }
  // le grand panneau et le bandeau des boutiques, des deux faces
  P.boite(8, 3.0, 0.5, COUL.rouge, { x, y: 11.6, z }, m.satin);
  P.boite(7.4, 1.4, 0.4, 0xe9dfc6, { x, y: 9.3, z }, m.satin);
  for (const s of [-1, 1]) {
    panneau(P, m.enseignes, R.pylone, { x, y: 11.6, z: z + s * 0.27, ry: s > 0 ? 0 : PI }, 7.8, 2.0, 0.34, 1);
    panneau(P, m.enseignes, R.pylone, { x, y: 9.3, z: z + s * 0.22, ry: s > 0 ? 0 : PI }, 7.2, 1.2, 0, 0.34);
  }
  P.boite(8.4, 0.25, 0.7, COUL.ocre, { x, y: 13.2, z }, m.satin);
  // l'échelle à crinoline, l'armoire électrique au pied
  for (let y = 0.6; y < 13; y += 0.4) P.boite(0.5, 0.04, 0.04, COUL.tole, { x: x + 3.2, y, z: z + 0.5 }, m.metal);
  for (const s of [-1, 1]) P.pave(x + 3.2 + s * 0.25 - 0.02, 0.5, z + 0.48, x + 3.2 + s * 0.25 + 0.02, 13, z + 0.52, COUL.tole, m.metal);
  c.boite(0.8, 1.4, 0.5, 0x8a9a8a, { x: x - 1, y: 1.2, z: z + 0.9 }, m.tole);
  // un pan du panneau a lâché et pend
  P.repere({ x: x + 3.9, y: 10.2, z: z + 0.3, rz: 0.5 + 0.3 * usure }, () => P.boite(1.2, 1.6, 0.05, COUL.rouge, { y: -0.8 }, m.satin));
  lierre(c, x - 2.6, 0.5, z + 0.4, 0, 1, 3 + 3 * usure, Math.round(20 + 30 * usure));
  k.b.obstacle(x - 3.6, z, x + 3.6, z, "socle du pylône");
}

// ---------- L'intérieur : cloisons et devantures ----------

function interieur(k) {
  const { c, m, usure } = k;
  const { ouest: O, est: E, nord: N } = k.T;
  const cloison = (T, a, bb, couleur, ouvertures = []) => murCoupe(k, T, a, bb, { h: HB, cut: CUTI, ep: EPI, couleur, mat: m.enduit, ouvertures });
  // Bloc ouest
  cloison(O, [-RAYON, ZA2], [XO, ZA2], COUL.tc);
  cloison(O, [XO, 3], [-XA, 3], COUL.pharma);
  cloison(O, [XO, ZA1], [-RAYON, ZA1], COUL.mode);
  cloison(O, [XO, ZS], [-RAYON, ZS], COUL.mode);
  // Bloc est
  cloison(E, [XE, ZA2], [RAYON, ZA2], COUL.jouets);
  cloison(E, [RAYON, ZA1], [XE, ZA1], COUL.food);
  cloison(E, [RAYON, ZS], [XE, ZS], COUL.gadgets);
  // Le retour du bloc ouest sur l'atrium (x = -5 → -11, en z = 10 et -4) : déjà dans les cloisons ; le front de l'atrium à l'ouest
  devanture(k, O, [-XA, ZA2], [-XA, 3], {
    baies: [{ u1: 0.6, u2: 3.6, type: "porte", rideau: "force" }, { u1: 4, u2: 6.6, type: "vitrine", bris: 0.9 }],
    enseigneR: R.pharma,
    couleur: COUL.pharma,
    drapeau: 3.8,
  });
  devanture(k, O, [-XA, 3], [-XA, ZA1], {
    baies: [{ u1: 2.2, u2: 4.0, type: "porte", rideau: "leve" }],
    enseigneR: R.toilettes,
    couleur: COUL.wc,
    drapeau: false,
  });
  // Le food court : ouvert sur l'atrium (un pilier, la poutre)
  c.tube([XA, 0, 3], [XA, HB, 3], 0.25, COUL.creme, m.satin, 8);
  E.pave(XA - 0.2, 3.8, ZA1, XA + 0.2, HB, ZA2, COUL.creme, m.enduit, { nuance: 0.02 });
  E.boite(0.1, 0.8, 5.2, 0x2a2826, { x: XA - 0.25, y: 4.3, z: 3 }, m.satin);
  panneau(E, m.enseignes, R.burger, { x: XA - 0.31, y: 4.3, z: 3, ry: -PI / 2 }, 3.0, 0.75);
  // Le supermarché : son front sur l'allée (portes coulissantes brisées)
  {
    const a = [-RAYON, ZS];
    const bb = [RAYON, ZS];
    vitrage(k, c, N, a, bb, 0, 3, 0, 3.4, { pas: 1.5, cut: CUTI });
    vitrage(k, c, N, a, bb, 7, 10, 0, 3.4, { pas: 1.5, cut: CUTI });
    N.pave(-RAYON, 3.4, ZS - 0.15, RAYON, HS, ZS + 0.15, COUL.creme, m.enduit, { nuance: 0.02 });
    N.boite(6.4, 1.3, 0.12, 0x2a2826, { x: 0, y: 4.3, z: ZS + 0.2 }, m.satin);
    panneau(N, m.enseignes, R.plusPlus, { x: 0, y: 4.3, z: ZS + 0.27 }, 4.8, 1.2);
    k.b.obstacle(-RAYON, ZS, -2, ZS, "vitrage");
    k.b.obstacle(2, ZS, RAYON, ZS, "vitrage");
  }
  // Les faux plafonds tombés dans les boutiques (dalles au sol, câbles et dalles qui pendent)
  for (const [x1, z1, x2, z2] of [[-19, 11, -6, 21], [-19, -15, -6, -5], [6, 11, 19, 21], [6, -15, 19, -5], [-19, 4, -12, 9]]) {
    for (let i = 0; i < Math.round(2 + 5 * usure); i++) c.boite(0.6, 0.02, 0.6, 0xd2ccbe, { x: c.entre(x1, x2), y: 0.06 + c.hasard() * 0.05, z: c.entre(z1, z2), ry: c.hasard() * 3, rx: c.entre(-0.15, 0.15) }, m.mat, { crasse: false, nuance: 0.05 });
    for (let i = 0; i < 3; i++) {
      const x = c.entre(x1, x2);
      const z = c.entre(z1, z2);
      c.boite(0.6, 0.02, 0.6, 0xe6e2d8, { x, y: c.entre(2.6, 3.3), z, rx: c.entre(0.6, 1.2), ry: c.hasard() * 3 }, m.mat, { crasse: false });
      c.poutre([x + 0.2, HB - 0.3, z], [x + 0.25, 2.6, z + 0.2], 0.02, COUL.noir, m.satin);
    }
  }
}

// ---------- L'allée centrale ----------

function allee(k) {
  const { c, m, usure } = k;
  const { ouest: O, est: E } = k.T;
  // Les devantures sur l'allée
  devanture(k, O, [-RAYON, ZSUD], [-RAYON, ZA2], {
    baies: [{ u1: 0.8, u2: 4.6, type: "vitrine" }, { u1: 5.2, u2: 9.0, type: "porte", rideau: "arrache" }, { u1: 9.6, u2: 11.4, type: "vitrine", bris: 1 }],
    enseigneR: R.toutConnecte,
    couleur: COUL.tc,
  });
  devanture(k, O, [-RAYON, ZA1], [-RAYON, ZS], {
    baies: [{ u1: 0.6, u2: 4.2, type: "vitrine" }, { u1: 4.8, u2: 8.2, type: "porte", rideau: "mi" }, { u1: 8.8, u2: 11.4, type: "vitrine" }],
    enseigneR: R.modeJetable,
    couleur: COUL.mode,
    mannequins: 4,
  });
  devanture(k, E, [RAYON, ZA2], [RAYON, ZSUD], {
    baies: [{ u1: 0.6, u2: 3.4, type: "vitrine" }, { u1: 4.0, u2: 8.6, type: "porte", rideau: "leve" }, { u1: 9.2, u2: 11.4, type: "vitrine" }],
    enseigneR: R.jouets,
    couleur: COUL.jouets,
    drapeau: 11,
  });
  devanture(k, E, [RAYON, ZS], [RAYON, ZA1], {
    baies: [{ u1: 0.6, u2: 3.4, type: "vitrine" }, { u1: 4.0, u2: 7.4, type: "porte", rideau: "baisse" }, { u1: 8.0, u2: 11.4, type: "vitrine", bris: 1, passage: true }],
    enseigneR: R.gadgets,
    couleur: COUL.gadgets,
    drapeau: 11,
  });
  // Le mobilier de l'allée : palmiers morts, bancs, plan du centre, fauteuils massants, kiosque, robot d'accueil
  for (const z of [17.5, -9.5]) {
    palmier(k, c, 0, z, 3.6 + c.hasard(), true);
    banc(k, c, -1.9, z, PI / 2);
    banc(k, c, 1.9, z, -PI / 2);
    k.b.obstacle(-0.65, z, 0.65, z, "bac à palmier");
  }
  // le plan « Vous êtes ici »
  c.boite(1.0, 1.9, 0.25, 0x2a2c2e, { x: 2.6, y: 0.95, z: 20.4 }, m.satin);
  panneau(c, m.enseignes, R.plan, { x: 2.6, y: 1.3, z: 20.54 }, 0.9, 0.56);
  // deux fauteuils massants connectés (« 2 Wh la minute »)
  for (const z of [12.5, 13.6]) {
    c.repere({ x: -3.6, z, ry: PI / 2 }, () => {
      c.boite(0.8, 0.5, 0.8, 0x2a2826, { y: 0.25 }, m.satin);
      c.boite(0.8, 0.9, 0.2, 0x2a2826, { y: 0.9, z: -0.32, rx: -0.25 }, m.satin);
      for (const s of [-1, 1]) c.boite(0.16, 0.3, 0.75, 0x3a3634, { x: s * 0.36, y: 0.62 }, m.satin);
      c.boite(0.3, 0.2, 0.04, 0x123342, { x: 0.25, y: 0.8, z: 0.36 }, m.satin);
    });
  }
  // le kiosque « Coques & Câbles » au milieu de l'allée nord
  {
    const x = 1.8;
    const z = -13;
    c.boite(1.6, 1.0, 2.4, 0xe9dfc6, { x, y: 0.5, z }, m.satin);
    c.boite(1.7, 0.05, 2.5, COUL.ocre, { x, y: 1.02, z }, m.satin);
    for (const s of [-1, 1]) c.tube([x + s * 0.7, 1.05, z - 1.1], [x + s * 0.7, 2.3, z - 1.1], 0.03, COUL.chrome, m.metal, 5);
    c.boite(1.7, 0.4, 0.06, COUL.canard, { x, y: 2.3, z: z - 1.1 }, m.satin);
    eparpiller(k, c, x - 1.5, z - 1.5, x + 1.5, z + 1.5, 12, [0x1f2526, 0xe5e2da, 0xc0466e, 0x6fb3a8]);
    k.b.obstacle(x - 0.8, z - 1.2, x - 0.8, z + 1.2, "kiosque");
    k.b.obstacle(x + 0.8, z - 1.2, x + 0.8, z + 1.2, "kiosque");
  }
  // le robot d'accueil, tombé face contre terre
  c.repere({ x: -2.2, y: 0.32, z: -5.5, ry: 0.8, rz: PI / 2 - 0.1 }, () => {
    c.poser(new THREE.CylinderGeometry(0.22, 0.32, 1.1, 8), m.satin, 0xe5e2da, { y: 0.55 });
    c.poser(geoBoule(0.26, 1), m.satin, 0xe5e2da, { y: 1.3 });
    c.boite(0.3, 0.18, 0.04, 0x123342, { y: 1.32, z: 0.24 }, m.satin);
    c.boite(0.32, 0.22, 0.03, 0x123342, { y: 0.8, z: 0.28 }, m.satin);
  });
  // Les feuilles mortes, la mousse, les herbes entre les dalles (la verrière laisse tout entrer)
  jonchee(c, -4.8, ZS, 4.8, ZSUD, Math.round(60 + 80 * usure));
  semerTouffes(c, -4.8, ZS, 4.8, ZSUD, Math.round(30 + 50 * usure));
  debris(c, -4.8, ZS, 4.8, ZSUD, Math.round(20 + 30 * usure), [0xcfd8d8, 0xe6e2d8, PALETTE.pierre]);
  mousse(c, -3, 0.06, 16, 1.6, Math.round(2 + 4 * usure));
  for (const [x, z, r] of [[2, 19, 1.4], [-2.5, 9.5, 1.2], [3, -6, 1.6], [-3.5, -14, 1.3], [0.5, 12, 1.0]]) salissure(c, x, z, r * (0.6 + usure * 0.6));
  mousse(c, 3, 0.06, -12, 1.4, Math.round(2 + 4 * usure));
  if (usure > 0.5) arbuste(c, 4.1, 20.5, 1.1);
  // Une vitre de la verrière tombée en éclats dans l'allée
  for (let i = 0; i < 5; i++) carreau(c, m.verre, c.entre(-2, 2), 0.06, 0.7, 0.5, 0.95, c.entre(14, 15));
  // Un tag sur le rideau de Mode Jetable
  panneau(c, m.enseignes, R.graffiti2, { x: -RAYON + 0.12, y: 0.75, z: -7, ry: PI / 2 }, 2.4, 0.6);
}

// ---------- L'atrium : l'étang, la Corne d'Abondance, les escalators ----------

function atrium(k) {
  const { c, m, usure } = k;
  const V = k.T.verriere;
  const cx = 0;
  const cz = 3;
  const Rb = 3.3;
  // Le bassin octogonal : margelle de marbre, eau verte
  for (let i = 0; i < 8; i++) {
    const t = (i * PI) / 4;
    const ap = Rb * Math.cos(PI / 8) + 0.2;
    const side = 2 * (ap / Math.cos(PI / 8)) * Math.sin(PI / 8);
    c.boite(side + 0.16, 0.5, 0.4, PALETTE.marbre, { x: cx + Math.cos(t) * ap, y: 0.25, z: cz + Math.sin(t) * ap, ry: -t - PI / 2 }, m.satin, { nuance: 0.03 });
  }
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const t = (i * PI) / 4 + PI / 8;
    pts.push(new THREE.Vector2(Math.cos(t) * Rb, Math.sin(t) * Rb));
  }
  const geo = new THREE.ShapeGeometry(new THREE.Shape(pts)).rotateX(-PI / 2);
  c.poser(geo, m.eau, 0xffffff, { x: cx, y: 0.38, z: cz }, { crasse: false, nuance: 0 });
  c.poser(geo, m.mat, 0x2c3a28, { x: cx, y: 0.08, z: cz }, { crasse: false, nuance: 0 });
  // les obstacles : la margelle
  for (let i = 0; i < 8; i++) {
    const t1 = (i * PI) / 4 + PI / 8;
    const t2 = ((i + 1) * PI) / 4 + PI / 8;
    const r = Rb + 0.2;
    k.b.obstacle(cx + Math.cos(t1) * r, cz + Math.sin(t1) * r, cx + Math.cos(t2) * r, cz + Math.sin(t2) * r, "margelle de l'étang");
  }
  // La Corne d'Abondance dorée, sur sa vasque sèche : il en dégringole des téléphones dorés
  c.poser(geoCylindre(0.6, 1.2, 8), m.satin, PALETTE.marbre, { x: cx, y: 0.6, z: cz });
  c.poser(new THREE.CylinderGeometry(1.4, 0.7, 0.35, 10), m.satin, PALETTE.marbre, { x: cx, y: 1.35, z: cz });
  mousse(c, cx, 1.5, cz, 0.9, 3);
  c.repere({ x: cx, y: 1.55, z: cz, ry: 0.6 }, () => {
    c.poser(new THREE.ConeGeometry(0.62, 2.0, 8, 1, true), m.metal, PALETTE.dore, { x: -0.3, y: 0.9, rz: -1.05 });
    c.poser(new THREE.ConeGeometry(0.28, 1.1, 7), m.metal, PALETTE.dore, { x: -1.3, y: 1.75, rz: 0.4 });
    c.poser(new THREE.TorusGeometry(0.62, 0.06, 4, 10), m.metal, PALETTE.dore, { x: 0.55, y: 0.4, ry: PI / 2, rx: 0.5 });
    for (let i = 0; i < 6; i++) c.boite(0.16, 0.3, 0.03, PALETTE.dore, { x: 0.8 + i * 0.2, y: 0.3 - i * 0.12, z: c.entre(-0.4, 0.4), rx: c.hasard() * 2, rz: c.hasard() * 2 }, m.metal);
  });
  // Les nénuphars, les roseaux, une fleur rose
  for (let i = 0; i < 14; i++) {
    const a = c.hasard() * PI * 2;
    const r = c.entre(1.2, Rb - 0.4);
    c.poser(geoCylindre(c.entre(0.2, 0.36), 0.015, 7), m.mat, i % 3 ? 0x5f8a3e : 0x7a9a45, { x: cx + Math.cos(a) * r, y: 0.39, z: cz + Math.sin(a) * r, ry: c.hasard() * 3 }, { crasse: false });
    if (i % 5 === 0) c.poser(geoBoule(0.08, 0), m.mat, 0xe9a0b8, { x: cx + Math.cos(a) * r, y: 0.45, z: cz + Math.sin(a) * r }, { crasse: false });
  }
  touffes(c, [[cx - 2.4, cz - 1.6, 0.38], [cx - 2.0, cz - 2.1, 0.38], [cx + 2.5, cz + 1.4, 0.38], [cx + 2.2, cz + 1.9, 0.38], [cx + 1.0, cz - 2.6, 0.38]], PALETTE.herbe);
  // Les carpes koï : un maillage à part, qui tourne lentement
  {
    const ck = new Chantier(77);
    const tons = [0xe8752a, 0xf09038, 0xe9e2d4, 0xd8562a, 0xf0a040, 0xe8752a, 0xe9e2d4];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * PI * 2 + ck.hasard() * 0.5;
      const r = ck.entre(1.4, Rb - 0.5);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const cap = a + PI / 2 + ck.entre(-0.3, 0.3);
      ck.repere({ x, y: 0.4, z, ry: -cap }, () => {
        ck.poser(geoBoule(0.1, 0), matiere(0.6, 0.05), tons[i % tons.length], { e: [2.4, 0.55, 1] }, { crasse: false });
        ck.poser(geoBoule(0.06, 0), matiere(0.6, 0.05), i % 2 ? 0xe9e2d4 : 0xd8562a, { x: 0.06, y: 0.03, e: [1.4, 0.5, 1] }, { crasse: false });
        ck.boite(0.12, 0.02, 0.14, tons[i % tons.length], { x: -0.28, ry: 0.2 }, matiere(0.6, 0.05), { crasse: false });
      });
    }
    const koi = ck.construire();
    koi.position.set(cx, 0, cz);
    koi.userData.animer = (t) => {
      koi.rotation.y = -t * 0.09;
    };
    const g = new THREE.Group();
    g.add(koi);
    k.b.ajouter(g);
  }
  // Les palmiers morts autour du bassin, des bancs
  for (const [x, z] of [[-3.8, 8.6], [3.8, 8.6]]) {
    palmier(k, c, x, z, 4 + c.hasard(), true);
    k.b.obstacle(x - 0.65, z, x + 0.65, z, "bac à palmier");
  }
  banc(k, c, -4, -0.2, PI / 2 + 0.2);
  banc(k, c, 3.4, 8.9, PI);
  // un bouleau a poussé dans un bac, sous un trou de la verrière
  if (usure > 0.35) {
    c.boite(1.3, 0.75, 1.3, 0xd8d0c0, { x: -9.6, y: 0.375, z: 8.6 }, m.satin);
    arbre(c, -9.6, 8.6, 4.2, "bouleau", 0.75);
  }
  // Les escalators figés : montent vers le nord jusqu'à la passerelle (la travée haute est dans la couche)
  for (const s of [-1, 1]) escalator(k, s * 6.5, 9.0, ZPASS + 0.1, MEZZ + 0.4);
  // Des flaques sous les trous, des feuilles
  flaque(c, -7.5, 1.5, 1.2, 0.065);
  for (const [x, z, r] of [[-6, 9, 1.4], [6.5, -2.5, 1.2], [-9.5, -2.5, 1.0], [9.5, 9.2, 1.1]]) salissure(c, x, z, r * (0.6 + usure * 0.6));
  flaque(c, 8, 6, 0.9, 0.065);
  jonchee(c, -11, ZA1, 11, ZA2, Math.round(30 + 50 * usure));
  semerTouffes(c, -10.5, ZA1, 10.5, ZA2, Math.round(16 + 30 * usure));
  // Le graffiti sur le pilier de l'atrium
  panneau(c, m.enseignes, R.graffiti, { x: -XA + 0.15, y: 0.9, z: 1.2, ry: PI / 2 }, 2.2, 0.55);
}

/** Un escalator figé qui monte vers le nord (−z) de zBas (au sol) à zHaut (à hTop) ; le haut va dans la couche. */
function escalator(k, xc, zBas, zHaut, hTop) {
  const { c, m } = k;
  const V = k.T.verriere;
  const L = zBas - zHaut;
  const ang = Math.atan2(hTop, L);
  const yAt = (z) => (hTop * (zBas - z)) / L;
  const limite = 2.3;
  const zLim = zBas - (limite / hTop) * L;
  const ch = (y) => (y < limite ? c : V);
  // palier bas
  c.boite(1.3, 0.06, 1.2, COUL.alu, { x: xc, y: 0.06, z: zBas + 0.6 }, m.metal);
  V.boite(1.3, 0.06, 1.2, COUL.alu, { x: xc, y: hTop + 0.03, z: zHaut - 0.6 }, m.metal);
  // le carter (sous les marches) et les balustrades, en deux tronçons
  for (const [za, zb] of [[zBas, zLim], [zLim, zHaut]]) {
    const ya = yAt(za);
    const yb = yAt(zb);
    const lg = Math.hypot(za - zb, yb - ya);
    const t = ch((ya + yb) / 2);
    const pose = { x: xc, y: (ya + yb) / 2 - 0.35, z: (za + zb) / 2, rx: ang };
    t.boite(1.6, 0.6, lg, COUL.creme, pose, m.enduit, { nuance: 0.02 });
    for (const s of [-1, 1]) {
      t.boite(0.02, 0.85, lg, 0xffffff, { x: xc + s * 0.62, y: (ya + yb) / 2 + 0.5, z: (za + zb) / 2, rx: ang }, m.verre, { crasse: false });
      t.boite(0.1, 0.08, lg, 0x1f2124, { x: xc + s * 0.62, y: (ya + yb) / 2 + 0.95, z: (za + zb) / 2, rx: ang }, m.satin);
      t.boite(0.12, 0.2, lg, COUL.alu, { x: xc + s * 0.62, y: (ya + yb) / 2 + 0.06, z: (za + zb) / 2, rx: ang }, m.metal);
    }
  }
  // les marches
  for (let z = zBas - 0.2; z > zHaut + 0.1; z -= 0.42) {
    const y = yAt(z);
    ch(y).boite(1.05, 0.2, 0.4, 0x6a6e70, { x: xc, y: y - 0.02, z }, m.metal, { crasse: false });
  }
  // les obstacles : les deux flancs au sol, une barrière au pied (un panneau « HORS SERVICE » de fortune)
  k.b.obstacle(xc - 0.8, zBas + 0.2, xc - 0.8, zHaut, "escalator");
  k.b.obstacle(xc + 0.8, zBas + 0.2, xc + 0.8, zHaut, "escalator");
  k.b.obstacle(xc - 0.8, zBas + 0.2, xc + 0.8, zBas + 0.2, "escalator (bloqué)");
  c.boite(1.4, 0.9, 0.12, COUL.bois, { x: xc, y: 0.75, z: zBas + 0.1, rz: 0.08 }, m.mat, { nuance: 0.08 });
  c.boite(0.6, 0.2, 0.02, COUL.rouge, { x: xc, y: 0.85, z: zBas + 0.17 }, m.satin);
}

// ---------- Les boutiques ----------

function toutConnecte(k) {
  const { c, m, usure } = k;
  // Le mur d'écrans (le fond, à l'ouest) : télés de 85 pouces, certaines tombées
  for (let i = 0; i < 5; i++) {
    const z = 12 + i * 2.1;
    if (i === 2) tele(k, c, XO + 0.25, 1.9, z, PI / 2, { ecran: R.tvMaj });
    else if (i === 3) tele(k, c, XO + 1.0, 0.1, z + 0.2, PI / 2 + 0.3, { rx: -PI / 2 });
    else tele(k, c, XO + 0.25, 1.9, z, PI / 2);
    c.boite(0.4, 0.06, 1.8, 0xd8d6cc, { x: XO + 0.35, y: 0.8, z }, m.satin);
  }
  c.boite(0.5, 0.5, 10, 0x2a2c2e, { x: XO + 0.4, y: 0.25, z: 16 }, m.satin);
  // Les tables d'exposition : enceintes « intelligentes », téléphones (presque tout est pillé)
  for (const [x, z] of [[-14, 18.5], [-14, 14], [-10, 16.2]]) {
    c.boite(2.4, 0.85, 1.1, 0xe9e4da, { x, y: 0.425, z }, m.satin);
    c.boite(2.5, 0.04, 1.2, COUL.tc, { x, y: 0.87, z }, m.satin);
    for (let i = 0; i < 4; i++) {
      if (c.hasard() < 0.4) continue;
      cylindre(c, m.satin, x - 0.9 + i * 0.6, 0.89, z + c.entre(-0.3, 0.3), 0.08, 0.2, i % 2 ? 0x2a2c2e : 0xe5e2da, 8);
    }
    k.b.obstacle(x - 1.2, z, x + 1.2, z, "table d'exposition");
  }
  // une table renversée
  c.boite(2.4, 0.85, 1.1, 0xe9e4da, { x: -10.5, y: 0.55, z: 20.5, rx: PI / 2, ry: 0.3 }, m.satin);
  // Le présentoir des brosses à dents connectées (« Mise à jour en cours »)
  c.boite(1.6, 2.0, 0.3, 0xe5e2da, { x: -8.5, y: 1.0, z: 11.0 }, m.satin);
  for (let i = 0; i < 12; i++) {
    if (c.hasard() < 0.5) continue;
    c.boite(0.04, 0.22, 0.04, i % 2 ? 0x6fb3a8 : 0xe5e2da, { x: -9.1 + (i % 6) * 0.24, y: 0.9 + Math.floor(i / 6) * 0.5, z: 11.2 }, m.satin, { crasse: false });
  }
  // La caisse, des cartons de télés éventrés
  comptoir(k, c, -7, 20.6, 2.4, 0, COUL.tc);
  for (const [x, z, r] of [[-17.5, 20.5, 0.2], [-16.5, 11.2, 1.2], [-12, 11.5, 0.5]]) c.boite(2.1, 1.3, 0.25, COUL.carton, { x, y: 0.65, z, ry: r, rz: 0.1 }, m.mat, { nuance: 0.08 });
  eparpiller(k, c, -19, 11, -6, 21, Math.round(14 + 14 * usure), [COUL.carton, 0x2a2c2e, 0xe5e2da, 0x6fb3a8]);
  // une affiche Watty collée au mur nord
  panneau(c, m.enseignes, R.soldes, { x: -13, y: 2.6, z: ZA2 - 0.12, ry: PI }, 1.4, 1.4);
}

function modeJetable(k) {
  const { c, m, usure } = k;
  const tons = [0xe06aa0, 0x6fd0c8, 0xe8d050, 0xb07ae0, 0xf08a5a, 0x7ab0e8, 0xe9e2d4];
  // Les portants (vêtements synthétiques aux couleurs criardes, passées), un renversé
  const portant = (x, z, ry, renverse = false) => {
    c.repere({ x, z, ry }, () => c.repere(renverse ? { y: 0.2, rz: PI / 2 - 0.15 } : {}, () => {
      c.boite(1.6, 0.04, 0.04, COUL.chrome, { y: 1.45 }, m.metal);
      for (const s of [-1, 1]) {
        c.boite(0.04, 1.45, 0.04, COUL.chrome, { x: s * 0.8, y: 0.72 }, m.metal);
        c.boite(0.04, 0.04, 0.6, COUL.chrome, { x: s * 0.8, y: 0.02 }, m.metal);
      }
      for (let u = -0.7; u < 0.7; u += 0.17) {
        if (c.hasard() < 0.3) continue;
        c.boite(0.05, c.entre(0.6, 0.95), 0.48, tons[Math.floor(c.hasard() * tons.length)], { x: u, y: 1.0, rz: c.entre(-0.08, 0.08) }, m.toile, { crasse: false, nuance: 0.1 });
      }
    }));
  };
  portant(-14, -6.5, 0);
  portant(-10.5, -6.5, 0);
  portant(-14, -9.5, 0.1);
  portant(-10, -10.5, 0.5, true);
  portant(-8, -13.5, PI / 2);
  // Les présentoirs muraux (au fond, à l'ouest)
  for (let z = -13.2; z < -5; z += 2) {
    c.boite(0.3, 2.2, 1.9, 0xd8d0c8, { x: XO + 0.3, y: 1.1, z: z + 1 }, m.satin);
    for (let y = 0.5; y < 2; y += 0.7) for (let i = 0; i < 4; i++) if (c.hasard() < 0.45) c.boite(0.32, 0.12, 0.38, tons[Math.floor(c.hasard() * tons.length)], { x: XO + 0.5, y, z: z + 0.3 + i * 0.45 }, m.toile, { crasse: false });
  }
  // Les cabines d'essayage (contre le mur nord), rideaux arrachés
  for (let i = 0; i < 3; i++) {
    const x = -18.4 + i * 1.6;
    c.boite(0.06, 2.2, 1.5, 0xe9e4da, { x: x - 0.8, y: 1.1, z: ZS + 0.85 }, m.satin);
    c.boite(1.5, 0.05, 0.05, COUL.chrome, { x, y: 2.15, z: ZS + 1.6 }, m.metal);
    if (i !== 1) c.boite(c.entre(0.5, 1.4), 1.9, 0.02, 0x7a2630, { x: x - 0.2, y: 1.15, z: ZS + 1.6, rz: c.entre(-0.05, 0.05) }, m.toile, { crasse: false });
    else c.boite(1.2, 0.05, 0.6, 0x7a2630, { x, y: 0.05, z: ZS + 2.0, ry: 0.4 }, m.toile, { crasse: false });
    c.boite(1.0, 0.04, 0.3, 0xd8d0c8, { x, y: 0.45, z: ZS + 0.3 }, m.satin);
  }
  c.boite(0.06, 2.2, 1.5, 0xe9e4da, { x: -18.4 + 3 * 1.6 - 0.8, y: 1.1, z: ZS + 0.85 }, m.satin);
  c.boite(0.04, 1.4, 0.7, 0x8fa0aa, { x: -14.5 + 0.1, y: 1.3, z: ZS + 0.05 }, m.metal);
  // Les mannequins renversés au milieu du magasin, la caisse, les piles de vêtements au sol
  mannequin(k, c, -16.5, -12, 0.4, "tombe", tons[0]);
  mannequin(k, c, -12.5, -12.8, 2.0, "debout", tons[1]);
  mannequin(k, c, -11.2, -12.4, 1.2, "sansTete", tons[3]);
  mannequin(k, c, -7.5, -6, -1.4, "tombe", tons[2]);
  comptoir(k, c, -16, -5.0, 2.6, PI, COUL.mode);
  for (let i = 0; i < Math.round(10 + 12 * usure); i++) c.boite(c.entre(0.4, 0.8), 0.06, c.entre(0.3, 0.6), tons[Math.floor(c.hasard() * tons.length)], { x: c.entre(-19, -6), y: 0.08, z: c.entre(-15, -5), ry: c.hasard() * 3, rx: c.entre(-0.1, 0.1) }, m.toile, { crasse: false, nuance: 0.1 });
  // l'affiche de la boutique (au mur sud) : « Portez-le une fois ! »
  panneau(c, m.enseignes, R.modeJetable, { x: -13, y: 2.6, z: ZA1 - 0.12, ry: PI }, 3.2, 0.8);
}

function pharmacie(k) {
  const { c, m, usure } = k;
  // Le comptoir en L, les étagères du fond (pillées), l'armoire derrière le comptoir
  c.boite(0.7, 1.0, 4.0, COUL.pharma, { x: -17.2, y: 0.5, z: 6.5 }, m.satin);
  c.boite(0.8, 0.05, 4.1, 0xe9e4da, { x: -17.2, y: 1.02, z: 6.5 }, m.satin, { crasse: false });
  k.b.obstacle(-17.2, 4.5, -17.2, 8.5, "comptoir");
  for (let z = 3.8; z < 9.5; z += 1.9) {
    c.boite(0.4, 2.3, 1.8, 0xe5e2da, { x: XO + 0.3, y: 1.15, z: z + 0.9 }, m.satin);
    for (let y = 0.4; y < 2.2; y += 0.45) {
      c.boite(0.42, 0.03, 1.8, 0xd8d6cc, { x: XO + 0.32, y, z: z + 0.9 }, m.satin, { crasse: false });
      if (c.hasard() < 0.25) c.boite(0.2, 0.15, 0.3, [0x3f9a5f, 0xe9dfc6, 0xc8362b][Math.floor(c.hasard() * 3)], { x: XO + 0.4, y: y + 0.09, z: z + c.entre(0.3, 1.5) }, m.satin, { crasse: false });
    }
  }
  // Les rayons de parapharmacie renversés
  gondole(k, c, -14, 5.2, 2.6, PI / 2 + 0.3, { renverse: true, h: 1.5, plein: 0.1, tons: [0xe9dfc6, 0x3f9a5f, 0x6fb3a8], dos: COUL.pharma });
  gondole(k, c, -13, 8.0, 2.6, PI / 2, { h: 1.5, plein: 0.08, tons: [0xe9dfc6, 0x3f9a5f, 0x6fb3a8], dos: COUL.pharma });
  k.b.obstacle(-13, 6.7, -13, 9.3, "rayon");
  eparpiller(k, c, -16.5, 3.5, -11.5, 9.5, Math.round(16 + 16 * usure), [0xe9dfc6, 0x3f9a5f, 0xffffff, 0x6fb3a8]);
  // la balance de pharmacie connectée et sa borne
  c.boite(0.5, 0.06, 0.5, 0xe5e2da, { x: -12.2, y: 0.04, z: 4.0 }, m.satin);
  c.boite(0.3, 1.4, 0.2, 0xe5e2da, { x: -12.2, y: 0.7, z: 3.7 }, m.satin);
  c.boite(0.28, 0.2, 0.03, 0x123342, { x: -12.2, y: 1.3, z: 3.82 }, m.satin);
}

function toilettes(k) {
  const { c, m } = k;
  // Les lavabos contre la cloison nord, le miroir brisé, les cabines contre le mur ouest (une porte arrachée)
  c.boite(4.2, 0.85, 0.55, 0xe9e4da, { x: -14.4, y: 0.43, z: 2.55 }, m.satin);
  for (let i = 0; i < 3; i++) c.poser(geoCylindre(0.18, 0.08, 8), m.satin, 0xf0eee8, { x: -15.8 + i * 1.4, y: 0.9, z: 2.55 });
  c.boite(3.6, 1.0, 0.03, 0x8fa0aa, { x: -14.4, y: 1.7, z: 2.86 }, m.metal);
  k.b.obstacle(-16.5, 2.3, -12.3, 2.3, "lavabos");
  for (let i = 0; i < 4; i++) {
    const z = -3.2 + i * 1.5;
    c.boite(1.6, 2.0, 0.05, COUL.wc, { x: XO + 1.0, y: 1.05, z: z - 0.75 }, m.satin);
    c.poser(geoCylindre(0.2, 0.42, 8), m.satin, 0xf0eee8, { x: XO + 0.45, y: 0.21, z });
    if (i === 2) c.boite(0.05, 1.8, 0.7, 0x7a8a8a, { x: XO + 2.4, y: 0.05, z: z + 0.6, rz: PI / 2 }, m.satin);
    else c.repere({ x: XO + 1.8, z: z - 0.7, ry: i === 1 ? 0.9 : 0.2 }, () => c.boite(0.05, 1.8, 1.4, 0x7a8a8a, { y: 1.0, z: 0.7 }, m.satin));
  }
  c.boite(1.6, 2.0, 0.05, COUL.wc, { x: XO + 1.0, y: 1.05, z: 2.05 }, m.satin);
  // la borne « Toilettes connectées — Veuillez vous identifier », au mur sud
  c.boite(0.5, 1.4, 0.3, 0xe5e2da, { x: -13, y: 0.7, z: ZA1 + 0.35 }, m.satin);
  panneau(c, m.enseignes, R.toilettes, { x: -13, y: 1.15, z: ZA1 + 0.51 }, 0.46, 0.23);
}

function foodCourt(k) {
  const { c, m, usure } = k;
  // Les trois comptoirs contre le mur nord (face au sud : lisibles)
  const stands = [[11.6, 14.4, R.burger, 0xd8a03a], [14.6, 17.2, R.sushi, 0xe9e4da], [17.4, 19.8, R.crepes, 0x6a4f8a]];
  for (const [x1, x2, r, t] of stands) {
    const x = (x1 + x2) / 2;
    c.boite(x2 - x1, 1.0, 0.8, t, { x, y: 0.5, z: ZA1 + 1.4 }, m.satin);
    c.boite(x2 - x1 + 0.05, 0.05, 0.9, 0xc9ccc8, { x, y: 1.02, z: ZA1 + 1.4 }, m.metal, { crasse: false });
    // la cuisine derrière : friteuse, plaque, hotte
    c.boite(0.8, 0.95, 0.6, COUL.alu, { x: x - 0.5, y: 0.47, z: ZA1 + 0.45 }, m.metal);
    c.boite(0.7, 0.9, 0.6, COUL.alu, { x: x + 0.6, y: 0.45, z: ZA1 + 0.45 }, m.metal);
    // l'enseigne, sur un caisson, et les menus lumineux (éteints)
    c.boite(x2 - x1 - 0.2, 0.75, 0.15, 0x2a2826, { x, y: 2.75, z: ZA1 + 0.9 }, m.satin);
    panneau(c, m.enseignes, r, { x, y: 2.75, z: ZA1 + 0.98 }, x2 - x1 - 0.35, (x2 - x1 - 0.35) / (r[2] / r[3]));
    c.boite(x2 - x1 - 0.4, 0.5, 0.06, 0x1a1c1f, { x, y: 2.0, z: ZA1 + 0.3 }, m.satin);
    c.boite(0.05, 2.6, 1.4, 0xe9e4da, { x: x2, y: 1.3, z: ZA1 + 0.7 }, m.satin);
  }
  k.b.obstacle(11.6, ZA1 + 1.8, 19.8, ZA1 + 1.8, "comptoirs du food court");
  // l'aquarium du sushi, brisé : c'est de là que viennent les koï
  c.boite(1.6, 0.8, 0.5, 0x1a1c1f, { x: 15.9, y: 1.45, z: ZA1 + 1.5 }, m.satin);
  for (let i = 0; i < 4; i++) carreau(c, m.verre, c.entre(14.5, 17), 0.06, 0.5, 0.4, 0.95, c.entre(ZA1 + 2.0, ZA1 + 2.8));
  // Les tables vissées (et dans l'atrium), un plateau-repas oublié
  for (const [x, z] of [[13, 1.2], [16.2, 1.2], [12.6, 4.4], [13.2, 8.2], [16.6, 8.2], [9.2, 2.2], [9.2, 6.6]]) {
    tableVissee(k, c, x, z, 0.3, [0xd8a03a, 0xc8362b, 0x2f6f73][Math.floor(c.hasard() * 3)]);
    k.b.obstacle(x - 0.45, z, x + 0.45, z, "table vissée");
  }
  c.boite(0.45, 0.03, 0.32, COUL.rouge, { x: 13.1, y: 0.78, z: 1.25, ry: 0.4 }, m.satin);
  // Le camp des survivants : le feu dans un demi-fût, les couvertures, la bâche, la marmite
  {
    const x = 15;
    const z = 4.2;
    c.poser(new THREE.CylinderGeometry(0.42, 0.42, 0.5, 10, 1, true), m.tole, PALETTE.rouille, { x, y: 0.25, z });
    c.poser(geoCylindre(0.42, 0.04, 10), m.tole, PALETTE.rouilleSombre, { x, y: 0.05, z });
    for (let i = 0; i < 5; i++) c.boite(0.6, 0.08, 0.08, 0x3a2a1c, { x: x + c.entre(-0.15, 0.15), y: 0.45, z: z + c.entre(-0.15, 0.15), ry: c.hasard() * 3 }, m.mat);
    c.poser(new THREE.ConeGeometry(0.28, 0.6, 5), m.neon, 0xffffff, { x, y: 0.75, z }, { crasse: false });
    c.poutre([x - 0.6, 1.1, z], [x + 0.6, 1.1, z], 0.03, COUL.noir, m.metal);
    cylindre(c, m.metal, x + 0.15, 0.75, z, 0.18, 0.22, 0x5a5c5e, 8);
    for (const [cx, cz, r, t] of [[17.4, 3.2, 0.3, 0x6a5040], [17.6, 5.6, -0.2, 0x5a6a50], [12.4, 6.2, 1.4, 0x7a4040]]) {
      c.boite(1.9, 0.08, 0.9, t, { x: cx, y: 0.05, z: cz, ry: r }, m.toile, { crasse: false, nuance: 0.08 });
      c.boite(0.5, 0.15, 0.3, 0xe9dfc6, { x: cx + Math.cos(r) * 0.75, y: 0.12, z: cz - Math.sin(r) * 0.75, ry: r }, m.toile, { crasse: false });
    }
    // la bâche tendue entre deux tables, en appentis
    c.boite(3.0, 0.02, 2.2, 0x4f6f8f, { x: 17.5, y: 1.3, z: 4.4, rz: 0.35 }, m.toile, { crasse: false });
    c.poutre([16.2, 0, 3.4], [16.2, 1.8, 3.4], 0.04, COUL.bois, m.mat);
    c.poutre([16.2, 0, 5.4], [16.2, 1.8, 5.4], 0.04, COUL.bois, m.mat);
    eparpiller(k, c, 13.5, 2.5, 16.5, 6, 8, [COUL.carton, 0xd8a03a, 0x5a5c5e]);
    k.b.obstacle(x - 0.42, z, x + 0.42, z, "feu");
  }
  jonchee(c, XA, ZA1 + 2, XE, ZA2, Math.round(20 + 30 * usure), [0xd8a03a, 0xe9dfc6, 0xc8362b, 0x9c7a45]);
  // Le menu géant du mur est (Burger Instantané) et l'horloge arrêtée
  panneau(c, m.enseignes, R.graffiti, { x: XE - 0.2, y: 0.8, z: 6, ry: -PI / 2 }, 2.8, 0.7);
}

function jouetsBavards(k) {
  const { c, m, usure } = k;
  const tons = [0xc8362b, 0xe0b040, 0x2f6f73, 0x6a4f8a, 0x3f8f5a, 0xe06aa0, 0x6fb3a8];
  // Les rayons de boîtes colorées
  for (const [x, z, ry, ren] of [[12, 13.5, 0, false], [12, 17.5, 0, false], [16.5, 17.5, 0.35, true]]) {
    gondole(k, c, x, z, 4.4, ry, { plein: 0.3, tons, affiche: true, renverse: ren, dos: COUL.jouets });
    if (!ren) k.b.obstacle(x - 2.2, z, x + 2.2, z, "rayon");
  }
  // Le grand ours en peluche, assis contre le mur (et il a perdu un œil)
  {
    const x = 18.6;
    const z = 12.2;
    c.poser(geoBoule(0.85, 1), m.toile, 0xb08a5a, { x, y: 0.8, z });
    c.poser(geoBoule(0.55, 1), m.toile, 0xb08a5a, { x: x - 0.1, y: 1.9, z });
    for (const s of [-1, 1]) {
      c.poser(geoBoule(0.2, 0), m.toile, 0xb08a5a, { x: x - 0.05, y: 2.35, z: z + s * 0.38 });
      c.poser(geoBoule(0.3, 0), m.toile, 0xb08a5a, { x: x - 0.55, y: 0.3, z: z + s * 0.5, e: [1.4, 0.8, 1] });
      c.poser(geoBoule(0.26, 0), m.toile, 0xb08a5a, { x: x - 0.3, y: 1.1, z: z + s * 0.85 });
    }
    c.poser(geoBoule(0.06, 0), m.satin, 0x1a1a1a, { x: x - 0.6, y: 2.0, z: z - 0.18 });
    c.poser(geoBoule(0.14, 0), m.toile, 0xd8c09a, { x: x - 0.6, y: 1.8, z });
    k.b.obstacle(x - 1, z - 1, x - 1, z + 1, "ours géant");
  }
  // Le petit manège à pièces (une voiture de course), les robots-jouets, une poupée qui parle
  c.repere({ x: 8, z: 20.5, ry: -0.4 }, () => {
    c.boite(1.6, 0.35, 0.8, 0x6a6d70, { y: 0.17 }, m.tole);
    c.boite(1.2, 0.45, 0.6, COUL.rouge, { y: 0.55 }, m.satin);
    c.boite(0.5, 0.35, 0.55, COUL.rouge, { x: -0.25, y: 0.9 }, m.satin);
    for (const [wx, wz] of [[0.45, 0.32], [0.45, -0.32], [-0.45, 0.32], [-0.45, -0.32]]) c.poser(geoCylindre(0.16, 0.1, 8), m.mat, 0x1f1f1f, { x: wx, y: 0.45, z: wz, rx: PI / 2 });
    c.boite(0.25, 0.4, 0.25, 0xe0b040, { x: 0.9, y: 0.55 }, m.satin);
  });
  for (let i = 0; i < 5; i++) {
    const x = c.entre(7, 19);
    const z = c.entre(11, 21);
    c.repere({ x, z, ry: c.hasard() * 3, rz: c.hasard() < 0.5 ? PI / 2 : 0, y: 0.08 }, () => {
      c.boite(0.22, 0.3, 0.16, tons[i % tons.length], { y: 0.25 }, m.satin);
      c.boite(0.16, 0.14, 0.14, 0xc9cdd0, { y: 0.47 }, m.metal);
      for (const s of [-1, 1]) c.boite(0.06, 0.2, 0.06, 0xc9cdd0, { x: s * 0.15, y: 0.25 }, m.metal);
    });
  }
  eparpiller(k, c, 7, 11, 19, 21, Math.round(18 + 16 * usure), tons);
  comptoir(k, c, 8.2, 11.4, 2.2, PI, COUL.jouets);
  // une montagne de balles colorées échappées d'une piscine à balles
  for (let i = 0; i < 16; i++) c.poser(geoBoule(0.08, 0), m.satin, tons[i % tons.length], { x: 17 + c.entre(-1.5, 1.5), y: 0.08, z: 20 + c.entre(-1.2, 1.2) }, { crasse: false });
  c.boite(2.2, 0.4, 1.6, 0x6fb3a8, { x: 17.6, y: 0.2, z: 20.4 }, m.satin);
}

function gadgets(k) {
  const { c, m, usure } = k;
  // Les îlots : grille-pain à reconnaissance faciale, balances connectées, « fourchettes intelligentes »
  for (const [x, z, quoi] of [[10, -7.5, "grillepain"], [14, -7.5, "balance"], [10, -11.5, "balance"], [14, -11.5, "grillepain"]]) {
    c.boite(2.6, 0.9, 1.4, 0x2a2440, { x, y: 0.45, z }, m.satin);
    c.boite(2.7, 0.04, 1.5, 0xc79a3b, { x, y: 0.92, z }, m.metal);
    for (let i = 0; i < 4; i++) {
      if (c.hasard() < 0.3) continue;
      const xx = x - 0.9 + i * 0.6;
      if (quoi === "grillepain") {
        c.boite(0.36, 0.24, 0.2, 0xd8d6cc, { x: xx, y: 1.06, z }, m.metal);
        c.boite(0.06, 0.06, 0.02, 0x1a1c1f, { x: xx, y: 1.1, z: z + 0.11 }, m.satin);
      } else {
        c.boite(0.4, 0.03, 0.4, 0xe5e2da, { x: xx, y: 0.96, z, ry: 0.2 }, m.satin);
        c.boite(0.12, 0.01, 0.06, 0x123342, { x: xx, y: 0.98, z: z + 0.1 }, m.satin);
      }
    }
    k.b.obstacle(x - 1.3, z, x + 1.3, z, "îlot d'exposition");
  }
  // La pyramide des coffrets « Kit de survie premium » (dorés, intacts : personne n'en a voulu)
  {
    const x = 9;
    const z = -14;
    for (let n = 4, y = 0; n > 0; n--, y += 0.3) {
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) c.boite(0.4, 0.28, 0.3, (i + j) % 2 ? 0x1e1c1a : 0xc79a3b, { x: x + (i - (n - 1) / 2) * 0.42, y: y + 0.14, z: z + (j - (n - 1) / 2) * 0.32 }, m.satin, { nuance: 0.03 });
    }
    c.boite(0.6, 0.9, 0.05, 0x1e1c1a, { x, y: 1.6, z: z - 0.4 }, m.satin);
    panneau(c, m.enseignes, R.kit, { x, y: 1.6, z: z - 0.37 }, 0.55, 0.82);
  }
  // Les étagères murales (presque vides), la caisse, l'affiche
  for (let z = -15; z < -5; z += 2.5) {
    c.boite(0.35, 2.2, 2.3, 0x3a3450, { x: XE - 0.3, y: 1.1, z: z + 1.2 }, m.satin);
    for (let y = 0.5; y < 2.1; y += 0.55) if (c.hasard() < 0.5) c.boite(0.3, 0.25, 0.4, [0xd8d6cc, 0xc79a3b, 0xe5e2da][Math.floor(c.hasard() * 3)], { x: XE - 0.45, y: y + 0.12, z: z + c.entre(0.4, 2) }, m.satin);
  }
  comptoir(k, c, 17, -5.2, 2.6, PI, COUL.gadgets);
  eparpiller(k, c, 7, -15, 19, -5, Math.round(14 + 14 * usure), [0xd8d6cc, 0xc79a3b, COUL.carton, 0x2a2440]);
  // Les éclats de la vitrine brisée, à l'intérieur
  for (let i = 0; i < 4; i++) carreau(c, m.verre, c.entre(6, 7.5), 0.06, 0.6, 0.4, 0.95, c.entre(-15, -12));
}

function supermarche(k) {
  const { c, m, usure } = k;
  // Les caisses automatiques en rang, face à l'allée, et la lanterne des survivants
  for (let i = 0; i < 4; i++) {
    const x = -3.6 + i * 2.4;
    const z = -18.2;
    c.boite(0.9, 0.9, 0.7, 0xe5e2da, { x, y: 0.45, z }, m.satin);
    c.boite(0.5, 0.35, 0.05, 0x1a1c1f, { x: x - 0.1, y: 1.25, z: z + 0.2, rx: -0.3 }, m.satin);
    if (i % 2 === 0) panneau(c, m.enseignes, R.caisse, { x: x - 0.1, y: 1.25, z: z + 0.23, rx: -0.3 }, 0.46, 0.23);
    c.boite(0.9, 0.04, 0.5, 0xc9ccc8, { x: x + 0.65, y: 0.8, z }, m.metal);
    c.tube([x + 0.4, 0.9, z - 0.3], [x + 0.4, 1.8, z - 0.3], 0.025, COUL.chrome, m.metal, 5);
    c.boite(0.16, 0.16, 0.16, i === 2 ? 0x6fd06f : COUL.rouge, { x: x + 0.4, y: 1.88, z: z - 0.3 }, m.satin);
    k.b.obstacle(x - 0.45, z, x + 0.45, z, "caisse automatique");
  }
  // la lanterne posée sur une caisse
  cylindre(c, m.metal, -1.2, 0.9, -18.3, 0.1, 0.25, 0x3a3c3c, 6);
  c.poser(geoCylindre(0.08, 0.16, 6), m.neon, 0xffffff, { x: -1.2, y: 1.23, z: -18.3 }, { crasse: false });
  // Les gondoles (nord-sud), pillées ; une renversée en travers
  const tons = [0xc8362b, 0xe0b040, 0x2f6f73, 0xe9dfc6, 0x3f8f5a, 0xd97b4a];
  for (const [x, ren] of [[-16, false], [-12.5, false], [-9, true], [-5.5, false], [5.5, false]]) {
    gondole(k, c, ren ? x + 0.8 : x, -23.2, 6.4, PI / 2 + (ren ? 0.18 : 0), { plein: 0.12, tons, affiche: !ren, renverse: ren });
    if (!ren) k.b.obstacle(x, -26.4, x, -20, "gondole");
    else eparpiller(k, c, x - 1, -26.5, x + 2.5, -20, 18, tons);
  }
  // Les congélateurs bahuts contre le mur ouest (couvercles vitrés, certains ouverts)
  for (let z = -27; z < -19; z += 2.2) {
    c.boite(1.0, 0.85, 2.0, 0xe5e2da, { x: XO + 0.7, y: 0.42, z: z + 1 }, m.satin);
    if (c.hasard() < 0.5) carreau(c, m.verre, -1, -0.9, 2.0, 1.0, 0, 0);
    c.boite(0.95, 0.02, 1.95, 0xffffff, { x: XO + 0.7, y: 0.86, z: z + 1 }, m.verre, { crasse: false });
  }
  k.b.obstacle(XO + 1.2, -27, XO + 1.2, -19, "congélateurs");
  // La pyramide légendaire de 96 rouleaux (intacte, sur sa palette)
  {
    const x = -14.25;
    const z = -27.0;
    c.boite(1.3, 0.14, 1.0, COUL.bois, { x, y: 0.07, z }, m.mat);
    let n = 0;
    const r = 0.055;
    for (const [nx, nz, y] of [[6, 4, 0.14], [5, 3, 0.25], [4, 3, 0.36], [3, 2, 0.47], [2, 2, 0.58], [2, 1, 0.69]]) {
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
        if (n >= 96) break;
        cylindre(c, m.mat, x + (i - (nx - 1) / 2) * 0.12, y, z + (j - (nz - 1) / 2) * 0.12, r, 0.11, 0xf2efe8, 6);
        n++;
      }
    }
  }
  // Les caddies dans les allées, un renversé
  caddie(k, c, -2, -22, 0.5);
  caddie(k, c, 2.5, -25, 2.2, true);
  caddie(k, c, -14.3, -19.5, 1.2);
  caddie(k, c, 7.3, -19.6, -0.4);
  // Les présentoirs de fruits et légumes (vides), le rayon frais (au mur nord), les cartons
  for (const x of [-2, 2]) {
    c.boite(2.4, 0.8, 1.4, COUL.bois, { x, y: 0.4, z: -24.5 }, m.mat);
    c.boite(2.3, 0.1, 1.3, 0x7a5a3c, { x, y: 0.85, z: -24.5, rx: 0.15 }, m.mat);
    k.b.obstacle(x - 1.2, -24.5, x + 1.2, -24.5, "étal");
  }
  eparpiller(k, c, -3, -26, 3, -23, 8, [0x7a5a3c, 0x5f7a3a, 0x9c7a45]);
  c.boite(14, 2.0, 0.8, 0xe5e2da, { x: -1, y: 1.0, z: ZNORD + 0.6 }, m.satin);
  c.boite(13.8, 1.4, 0.02, 0xffffff, { x: -1, y: 1.2, z: ZNORD + 1.01 }, m.verre, { crasse: false });
  k.b.obstacle(-8, ZNORD + 1, 6, ZNORD + 1, "rayon frais");
  eparpiller(k, c, -19, -27, 7, -17, Math.round(20 + 20 * usure), [...tons, COUL.carton]);
  // L'enseigne PLUS-PLUS dans le magasin (suspendue)
  c.boite(4.2, 1.1, 0.08, COUL.rouge, { x: -10, y: 3.4, z: -21 }, m.satin);
  panneau(c, m.enseignes, R.plusPlus, { x: -10, y: 3.4, z: -20.95 }, 4, 1.0);
  for (const s of [-1, 1]) c.poutre([-10 + s * 1.8, 3.95, -21], [-10 + s * 1.8, HS, -21], 0.02, COUL.noir, m.satin);
  // Des flaques sous le toit qui fuit, un faux plafond tombé
  flaque(c, -6, -21, 1.3, 0.065);
  flaque(c, 12, -18, 0.9, 0.065);
  for (let i = 0; i < Math.round(3 + 5 * usure); i++) c.boite(0.6, 0.02, 0.6, 0xd2ccbe, { x: c.entre(-19, 7), y: 0.07, z: c.entre(-27, -17), ry: c.hasard() * 3 }, m.mat, { crasse: false });
}

function reserveEtQuai(k) {
  const { c, m, usure } = k;
  const N = k.T.nord;
  // Les cloisons de la réserve (x 8 → 20, z -28 → -21), porte battante « RÉSERVÉ AU PERSONNEL »
  murCoupe(k, N, [8, -21], [8, ZNORD], { h: HS, cut: CUTI, ep: EPI, couleur: COUL.superMur, mat: m.enduit });
  murCoupe(k, N, [XE, -21], [8, -21], { h: HS, cut: CUTI, ep: EPI, couleur: COUL.superMur, mat: m.enduit, ouvertures: [{ u: 4.5, l: 2.2, bas: 0, haut: 2.6, type: "vide" }] });
  c.repere({ x: 15.5, z: -21, ry: 0.9 }, () => c.boite(1.1, 2.2, 0.05, 0x7a8a8a, { x: 0.55, y: 1.1 }, m.tole));
  // Les racks à palettes, les palettes, les cartons, le transpalette
  for (const x of [8.6, 17.2]) {
    for (const z of [-27.4, -23]) {
      c.pave(x - 0.05, 0, z - 0.05, x + 0.05, 3.2, z + 0.05, 0x3f6f9a, m.tole);
      c.pave(x + 2.4 - 0.05, 0, z - 0.05, x + 2.4 + 0.05, 3.2, z + 0.05, 0x3f6f9a, m.tole);
    }
    for (const y of [1.2, 2.4]) for (const z of [-27.4, -23]) c.pave(x, y, z - 0.05, x + 2.4, y + 0.1, z + 0.05, 0xd8862a, m.tole);
    for (const y of [0, 1.3]) {
      c.boite(2.2, 0.14, 4, COUL.bois, { x: x + 1.2, y: y + 0.07, z: -25.2 }, m.mat, { nuance: 0.08 });
      if (c.hasard() < 0.6) c.boite(2.0, 0.8, 3.6, COUL.carton, { x: x + 1.2, y: y + 0.55, z: -25.2 }, m.mat, { nuance: 0.08 });
    }
    k.b.obstacle(x, -27.4, x, -23, "rack");
  }
  c.repere({ x: 14, z: -23.6, ry: 0.5 }, () => {
    c.boite(0.6, 0.15, 1.2, 0xd8b84a, { y: 0.1 }, m.tole);
    c.tube([0, 0.1, -0.6], [0, 1.1, -0.75], 0.03, 0x2a2c2e, m.tole, 5);
  });
  eparpiller(k, c, 8.5, -27.5, 19.5, -21.5, Math.round(10 + 12 * usure), [COUL.carton, 0xc4a070]);
  // Le quai : le camion de livraison autonome reculé contre la porte, les drones écrasés, la benne
  {
    const x = 14;
    const z1 = ZNORD - 1.2;
    const z2 = ZNORD - 8.0;
    c.boite(2.5, 3.0, z1 - z2, 0xe5e2da, { x, y: 1.95, z: (z1 + z2) / 2 }, m.satin);
    c.boite(2.52, 0.4, z1 - z2 + 0.02, COUL.rouge, { x, y: 2.5, z: (z1 + z2) / 2 }, m.satin);
    c.boite(2.5, 0.3, z1 - z2, 0x3a3c3c, { x, y: 0.45, z: (z1 + z2) / 2 }, m.satin);
    for (const z of [z2 + 1.0, z2 + 2.0, z1 - 1.2]) for (const s of [-1, 1]) c.poser(geoCylindre(0.45, 0.3, 8), m.mat, 0x252423, { x: x + s * 1.1, y: 0.45, z, rx: PI / 2, rz: PI / 2 });
    // les portes arrière ouvertes, quelques colis
    c.repere({ x: x - 1.25, z: z1, ry: -1.2 }, () => c.boite(1.2, 2.8, 0.05, 0xe5e2da, { x: 0.6, y: 1.9 }, m.satin));
    eparpiller(k, c, x - 2, z1, x + 2, ZNORD - 0.4, 8, [COUL.carton, 0xc4a070]);
    k.b.obstacle(x - 1.25, z1, x - 1.25, z2, "camion");
    k.b.obstacle(x + 1.25, z1, x + 1.25, z2, "camion");
  }
  // la benne, les palettes empilées, les drones de livraison tombés comme des mouches
  c.boite(2.0, 1.4, 1.6, 0x3f6f4f, { x: 8, y: 0.7, z: ZNORD - 3 }, m.tole);
  c.boite(2.1, 0.1, 1.7, 0x2f5f3f, { x: 8, y: 1.6, z: ZNORD - 3.6, rx: -0.9 }, m.tole);
  k.b.obstacle(7, ZNORD - 3, 9, ZNORD - 3, "benne");
  for (let i = 0; i < 4; i++) c.boite(1.2, 0.14, 1.0, COUL.bois, { x: 19, y: 0.07 + i * 0.15, z: ZNORD - 3, ry: i * 0.1 }, m.mat, { nuance: 0.08 });
  for (const [x, z] of [[10.5, ZNORD - 6], [18, ZNORD - 6.5], [4, ZNORD - 2]]) {
    c.repere({ x, y: 0.12, z, ry: c.hasard() * 3, rz: 0.3 }, () => {
      c.boite(0.5, 0.2, 0.5, 0xe5e2da, {}, m.satin);
      for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) c.poutre([0, 0, 0], [sx * 0.5, 0.05, sz * 0.5], 0.04, 0x3a3c3c, m.satin);
    });
  }
  semerTouffes(c, -24, ZNORD - 8, 24, ZNORD - 0.3, Math.round(30 + 50 * usure));
  arbre(c, -14, ZNORD - 4.5, 5.5 + usure * 2, "feuillu");
  arbuste(c, -6, ZNORD - 3, 1.5);
  jonchee(c, -24, ZNORD - 8, 24, ZNORD, Math.round(20 + 30 * usure));
}
