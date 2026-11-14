// L'usine chimique (Zone industrielle, lointain, danger ●●●●●).
//
// Inspiration : les combinats chimiques abandonnés d'Europe de l'Est, l'atmosphère de la zone de Prypiat (sans le
// nucléaire), les raffineries et leurs colonnes de distillation, les photos urbex de salles de contrôle et de
// laboratoires aux paillasses carrelées, les flaques aux couleurs suspectes. Ici, pas de turbines ni de haut fourneau
// (voir la centrale et l'aciérie) : des cuves, des tuyaux, des laboratoires, et le danger qu'on ne voit pas.
//
// L'usine CLARTEX fabriquait le « Nettoyant Universel Tout-en-Un Parfum Grand Air » et les capsules de lessive
// connectées LessiConnect (« votre lessive commande votre lessive »). Sur la cuve qui fuit : « Chimie verte, avenir
// propre ».
//
// Deux cartes partagent le même plan (« repère du site » : origine au centre du site, +x à l'est, +z au sud). Chaque
// carte construit ce qu'elle voit, en détail ou en silhouette, puis tout est recentré sur son lot (voir `recentrer`) :
// - « installations » : le parc à cuves, les colonnes de distillation, les sphères, la torchère, le rack de tuyauteries,
//   les bassins de décantation, le magasin des produits et le poste de garde ;
// - « ateliers » : le bâtiment administratif des années 60 (vestiaires de décontamination, laboratoire de contrôle,
//   salle de contrôle) et l'atelier de conditionnement.
//
// Données de jeu en plus du contrat : `zones` [{ x, z, rayon, nature }] dans chaque carte, les zones contaminées
// (flaques acides, boues, émanations) que le jeu peut utiliser.

import * as THREE from "three";
import { Batiment, PALETTE, MAT, matiere, matiereMonde, matiereTexture, matiereLueur, matiereEau, matiereVerre, mur, lierre, touffes, gravats, debris, jonchee, mousse, arbuste, arbre } from "../commun/atelier.js";
import { ATLAS, texAtlas, texBardage, texDalle, texBeton } from "./textures.js";

const TAU = Math.PI * 2;
const PI = Math.PI;
const CUT = 1.1; // coupe des murs côté caméra et des cloisons (au-dessus : couche qui s'efface)

// ---------- Le plan du site (repère « site ») ----------

const ORIGINES = { installations: { x: -28, z: 0 }, ateliers: { x: 38, z: 2 } };
const MAGASIN = { x0: -20, x1: -4, z0: 2, z1: 14, h: 5.2 };
const GARDE = { x0: -9, x1: -2, z0: 24, z1: 30, h: 2.9 };
const ADMIN = { x0: 12, x1: 46, z0: 8, z1: 20, h: 3.6, h2: 7.4 };
const ATELIER = { x0: 48, x1: 64, z0: -14, z1: 14, h: 6.5 };
const RACK = { x0: -66, x1: 48, z0: -10, z1: -6, y1: 5, y2: 7 };
const CUVETTE = { x0: -69, x1: -43, z0: -35, z1: -14 };
const CUVES = [
  { id: "t101", x: -62.5, z: -29, r: 4.3, h: 9.5, couleur: 0x8f9c94, escalier: 0.6 },
  { id: "t102", x: -50, z: -29, r: 4.3, h: 9.5, couleur: 0xbdb8a8, escalier: 2.2 },
  { id: "t103", x: -62.5, z: -19.6, r: 3.4, h: 7.5, couleur: 0x7f8f84 },
  { id: "t104", x: -50.5, z: -19.8, r: 3.6, h: 8, couleur: 0xcfc9b6, fuite: true },
];
const COLONNES = [
  { x: -31, z: -20, r: 1.7, h: 32, couleur: 0xc4c6bc },
  { x: -24, z: -24.5, r: 1.25, h: 26, couleur: 0xa8a294 },
  { x: -37.5, z: -27, r: 2.1, h: 21, couleur: 0xcfc8b6 },
];
const STRUCTURE = { x0: -29, x1: -23, z0: -17.5, z1: -12.5, niveaux: [4.5, 9, 13.5] };
const SPHERES = [
  { x: -61, z: 1.5, r: 5.2 },
  { x: -48.5, z: 2.5, r: 5.2 },
];
const TORCHERE = { x: -6, z: -27, h: 38 };
const BASSINS = [
  { x: -58, z: 23, l: 13, p: 9, teinte: 0x6f9a2a, fond: 0x2a3a14, ecume: 0xc9d69a, nom: "n° 1" },
  { x: -43, z: 22, l: 11, p: 8.5, teinte: 0xc5782e, fond: 0x5a3018, ecume: 0x6a4a2a, nom: "n° 2" },
  { x: -30, z: 26.5, l: 8.5, p: 6.5, teinte: 0xdcd8c8, fond: 0x9a968a, ecume: 0xf2efe4, nom: "n° 3" },
];

function arr(v) {
  return Math.round(v * 10) / 10;
}
function vers(carte, liste) {
  const o = ORIGINES[carte];
  return liste.map((p) => ({ ...p, x: arr(p.x - o.x), z: arr(p.z - o.z) }));
}

// ---------- La fiche ----------

const FOUILLE = [
  // Les installations
  { x: -17, z: 4.5, quoi: "magasin : fûts de soude caustique (base forte : savon, dérouillage électrolytique) — gants indispensables" },
  { x: -9, z: 5.2, quoi: "magasin : bidons d'acide sulfurique (électrolyte des batteries, décapage du métal) — corrosif" },
  { x: -16.5, z: 10.5, quoi: "magasin : sacs de cristaux de soude et de chaux (lessive, neutralisation des acides)" },
  { x: -6.2, z: 11.8, quoi: "magasin : cubitainers, fûts vides, film plastique (contenants, étanchéité)" },
  { x: -5.5, z: 26.2, quoi: "poste de garde : registre, trousseau de clés (dont celle de l'armoire forte du laboratoire)" },
  { x: -7.8, z: 25, quoi: "camp de survivants : lampe-tempête, couverture, conserves entamées" },
  { x: -42, z: -12.4, quoi: "douche de sécurité : rince-œil, flexible, robinetterie en laiton" },
  { x: -52, z: -17, quoi: "cuvette de rétention : fût de solvant intact (dégraissage, nettoyage des contacts ; inflammable)" },
  { x: -13.5, z: -7.6, quoi: "tuyau tombé du rack : tube d'inox, brides, vannes en laiton" },
  { x: -26, z: -14, quoi: "pompes sous la structure des colonnes : moteurs électriques (cuivre), roulements" },
  { x: -46.5, z: 16.4, quoi: "bord du bassin n° 2 : fût de soude à demi enfoui (prudence : boues corrosives)" },
  { x: -4.5, z: -24.5, quoi: "pied de la torchère : haubans d'acier, câble, manilles" },
  { x: -56, z: 7.6, quoi: "pied des sphères : manomètres, soupapes en laiton" },
  // Les ateliers
  { x: 24.5, z: 9.3, quoi: "laboratoire : verrerie (ballons, réfrigérant, béchers : de quoi monter un alambic de précision)" },
  { x: 26.5, z: 13.8, quoi: "paillasse centrale : flacons étiquetés (acides, bases, indicateurs colorés, alcool)" },
  { x: 21, z: 17.4, quoi: "armoire forte des produits dangereux (fermée : la clé du poste de garde ou un pied-de-biche)" },
  { x: 29.5, z: 19, quoi: "paillasse sous les fenêtres : balance, thermomètres, papier pH" },
  { x: 13.4, z: 16.5, quoi: "vestiaire côté sale : combinaisons étanches, gants, bottes" },
  { x: 12.7, z: 18.6, quoi: "vestiaire : masques à gaz et cartouches filtrantes (certaines encore scellées)" },
  { x: 15, z: 8.8, quoi: "casiers côté propre : savon, serviettes, effets personnels" },
  { x: 37, z: 9.6, quoi: "salle de contrôle : classeurs des procédés (un manuel de chimie industrielle)" },
  { x: 42.5, z: 11.3, quoi: "pupitres : relais, voyants, petite électronique" },
  { x: 45.3, z: 9.5, quoi: "armoire de l'alarme : batterie de secours (encore un peu chargée)" },
  { x: 53.5, z: 2.6, quoi: "chaîne d'embouteillage : moteur électrique du convoyeur, bouchons, bidons vides" },
  { x: 60.5, z: -8, quoi: "palettes de Nettoyant Universel (savon liquide dilué : hygiène)" },
  { x: 57.5, z: 10.4, quoi: "capsules LessiConnect renversées (lessive, et une puce par capsule)" },
  { x: 61.5, z: -11.5, quoi: "chariot élévateur renversé : batterie de traction, huile hydraulique" },
  { x: 24, z: 3.6, quoi: "camion-citerne : vanne de vidange, fond de soude (prudence)" },
];
const ETEINTS = [
  // Les installations
  { x: -55, z: -24, type: "putréfié (au fond de la cuvette de rétention, dans la flaque)" },
  { x: -66, z: -16, type: "putréfié (cuvette de rétention, derrière la cuve T-103)" },
  { x: -30, z: -16.5, type: "ancien habitant : opérateur en combinaison jaune, masque sur le visage (pied des colonnes)" },
  { x: -22, z: -8, type: "rampant (sous le rack, entre les tuyaux tombés)" },
  { x: -45, z: -7.5, type: "errant (sous le rack)" },
  { x: -54.5, z: 7, type: "errant (entre les sphères)" },
  { x: -49.5, z: 15.5, type: "putréfié (bord du bassin n° 2)" },
  { x: -35.5, z: 28.5, type: "putréfié (dans la boue blanche du bassin n° 3)" },
  { x: -12.5, z: 8, type: "ancien habitant : magasinier en tablier anti-acide (magasin)" },
  { x: -9, z: -19, type: "errant (pied de la torchère)" },
  { x: -66, z: 28, type: "rampant (dans les fougères, au bord du bassin n° 1)" },
  { x: 4, z: 20, type: "errant (allée de l'entrée)" },
  { x: -26, z: 9, type: "équipé : pompier en tenue d'intervention chimique (résiste aux lames)" },
  // Les ateliers
  { x: 26, z: 16, type: "ancien habitant : laborantine en blouse (laboratoire)" },
  { x: 16, z: 12, type: "équipé : combinaison étanche et masque à gaz (vestiaires)" },
  { x: 39, z: 13.5, type: "ancien habitant : opérateur de quart (salle de contrôle)" },
  { x: 43.5, z: 12.2, type: "putréfié (affalé sur le pupitre)" },
  { x: 54.5, z: -4, type: "putréfié (contre la chaîne d'embouteillage)" },
  { x: 61, z: 5, type: "rampant (sous les palettes de bidons)" },
  { x: 56, z: -12, type: "errant (fond de l'atelier)" },
  { x: 31.5, z: 0.5, type: "putréfié (dans la cabine du camion-citerne)" },
  { x: 20, z: 24, type: "errant (pelouse devant le bâtiment)" },
  { x: 44, z: -6, type: "errant (sous le rack)" },
];
const ENTREES = [
  { x: 4.5, z: 34, nature: "portail principal (barrière levante cassée, portail coulissant ouvert)" },
  { x: -40, z: 34, nature: "trou dans le grillage, côté bassins" },
  { x: -71, z: -2, nature: "clôture ouest affaissée (côté sphères)" },
  { x: -12, z: 14.2, nature: "rideau métallique du magasin, à demi levé" },
  { x: -3.8, z: 9, nature: "porte est du magasin" },
  { x: -1.8, z: 28.6, nature: "porte du poste de garde" },
  { x: 14, z: 20.2, nature: "entrée du vestiaire, côté sale" },
  { x: 33.5, z: 20.2, nature: "entrée principale du bâtiment administratif (sous la marquise)" },
  { x: 46.2, z: 18, nature: "porte est de la salle de contrôle" },
  { x: 56, z: 14.2, nature: "rideau métallique de l'atelier, à demi levé" },
  { x: 47.8, z: 4, nature: "porte ouest de l'atelier (côté cour)" },
  { x: 64.2, z: -6, nature: "quai de chargement de l'atelier" },
];
const ZONES = [
  { x: -58, z: 23, rayon: 8, nature: "bassin n° 1 : liquide acide vert, faiblement luminescent (brûlures ; ne pas boire, ne pas traverser)" },
  { x: -43, z: 22, rayon: 7, nature: "bassin n° 2 : boues orange de métaux dissous (corrosif)" },
  { x: -30, z: 26.5, rayon: 5.5, nature: "bassin n° 3 : lait de chaux et de soude (base forte : brûle la peau)" },
  { x: -48.6, z: -15.4, rayon: 2.5, nature: "flaque acide sous la cuve T-104 qui fuit" },
  { x: -56, z: -24.5, rayon: 8, nature: "émanations dans la cuvette de rétention (l'air pique : masque à gaz)" },
  { x: -13.5, z: -7.2, rayon: 3, nature: "fuite du tuyau tombé du rack (solvant : vapeurs, inflammable)" },
  { x: -10.5, z: 7.2, rayon: 2, nature: "fût de soude renversé dans le magasin (base forte)" },
  { x: -36, z: 7.5, rayon: 2.5, nature: "fûts renversés, taches suspectes" },
  { x: 26, z: 11.2, rayon: 2.5, nature: "laboratoire : flacons brisés (vapeurs d'acide)" },
  { x: 21, z: 17.4, rayon: 1.5, nature: "armoire forte : émanations à l'ouverture" },
  { x: 55.5, z: -3, rayon: 2.5, nature: "chaîne d'embouteillage : flaque de nettoyant concentré (glissant, irritant)" },
  { x: 22.6, z: 3.2, rayon: 2.5, nature: "camion-citerne : écoulement de soude" },
];

const CARTES = [
  {
    id: "installations",
    nom: "Les installations et les bassins",
    lot: { l: 88, p: 72 },
    depart: { x: 32.5, z: 31 },
    description: "le parc à cuves, les colonnes de distillation, les sphères, la torchère et le rack de tuyauteries ; les bassins de décantation ; le magasin des produits et le poste de garde",
  },
  {
    id: "ateliers",
    nom: "Le laboratoire, la salle de contrôle et les ateliers",
    lot: { l: 64, p: 52 },
    depart: { x: -4.5, z: 23.5 },
    description: "le bâtiment administratif des années 60 (vestiaires de décontamination, laboratoire de contrôle, salle de contrôle), l'atelier de conditionnement et la cour du camion-citerne",
  },
];
const dans = (k) => (p) => {
  const o = ORIGINES[k.id];
  return Math.abs(p.x - o.x) <= k.lot.l / 2 && Math.abs(p.z - o.z) <= k.lot.p / 2;
};
for (const k of CARTES) {
  k.fouille = vers(k.id, FOUILLE.filter(dans(k)));
  k.eteints = vers(k.id, ETEINTS.filter(dans(k)));
  k.entrees = vers(k.id, ENTREES.filter(dans(k)));
  k.zones = vers(k.id, ZONES.filter(dans(k)));
}

export const FICHE = {
  id: "usine-chimique",
  nom: "L'usine chimique",
  lieu: "Usine chimique · Zone industrielle · lointain",
  environnement: "zone industrielle",
  anneau: "lointain",
  danger: 5,
  recit:
    "CLARTEX promettait une « chimie verte, pour un avenir propre » et fabriquait, jour et nuit, le Nettoyant Universel Tout-en-Un Parfum Grand Air et des capsules de lessive qui commandaient elles-mêmes la lessive. Quand le courant s'est arrêté, les cuves ont continué à fuir sans demander l'avis de personne. Autour, la forêt a tout repris, sauf les bassins : là, même les ronces n'osent pas.",
  inspiration: "les combinats chimiques abandonnés d'Europe de l'Est, l'ambiance de la zone de Prypiat (sans le nucléaire), les raffineries et leurs colonnes de distillation, les salles de contrôle et les laboratoires carrelés photographiés par les urbexeurs",
  reperes: [
    "La forêt de colonnes de distillation (21 à 32 m), avec leurs plates-formes et leurs échelles à crinoline, la structure métallique dont l'escalier du bas s'est effondré",
    "Le rack de tuyauteries de 114 m, sa lyre de dilatation, le tuyau tombé qui fuit encore",
    "Le parc à cuves dans sa cuvette de rétention, les escaliers en colimaçon, la cuve T-104 qui fuit sous la banderole « Chimie verte, avenir propre »",
    "Les deux sphères de stockage sur leurs pieds, la torchère éteinte haubanée et sa balise rouge qui clignote encore",
    "Les trois bassins de décantation : vert acide (qui luit la nuit), orange, laiteux ; rien n'y pousse, alors que tout autour la végétation déborde",
    "Le magasin des produits : rayonnages de fûts de soude, bidons d'acide, sacs éventrés, un fût renversé",
    "Le poste de garde et son camp de survivants, la barrière cassée, « Présentez votre badge connecté »",
    "Le bâtiment administratif des années 60 : vestiaires de décontamination (combinaisons pendues, masques, douche de passage), laboratoire de contrôle (paillasses carrelées, hottes, verrerie, armoire forte), salle de contrôle (synoptique, pupitres, alarme figée), et dans le hall la borne d'accueil connectée qui luit encore (« Bienvenue ! Votre badge a expiré. »)",
    "L'atelier de conditionnement en sheds : la chaîne d'embouteillage, les palettes de Nettoyant Universel, les capsules LessiConnect « votre lessive commande votre lessive »",
    "Les losanges de danger, la « ZONE ATEX », la manche à air déchirée, la douche de sécurité",
  ],
  lot: CARTES[0].lot,
  depart: CARTES[0].depart,
  cartes: CARTES,
};

// ---------- Couleurs ----------

const C = {
  beton: 0xb3aea3,
  betonSombre: 0x8a867c,
  enduit: 0xd8d2c2,
  acier: 0x5f6e66,
  acierGris: 0x6f736e,
  jaune: 0xb59c4e,
  vert: 0x5f7f6a,
  bleu: 0x5a7288,
  alu: 0xbfc2bb,
  rouille: PALETTE.rouille,
  rouilleSombre: PALETTE.rouilleSombre,
  suie: 0x2e2b28,
  grille: 0x3d403e,
  orange: 0xc0763a,
  bardage: 0xb4bfb3,
  emaille: 0x5f8a86,
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
  beton: () =>
    une("beton", () => {
      const m = matiereTexture(texBeton(), { roughness: 0.95 });
      m.userData.tuile = 4;
      return m;
    }),
  carrelage: () => matiereMonde("carrelage"),
  verre: () => matiereVerre(PALETTE.verreSombre, 0.4),
  eau: () => matiereEau(0xffffff, 0.86),
  lueur: () => matiereLueur(0xffffff, 0.2),
  toile: () => MAT.toile(),
  bardage: () =>
    une("bardage", () => {
      const m = matiereTexture(texBardage(), { roughness: 0.8, metalness: 0.2 });
      m.userData.tuile = 4;
      return m;
    }),
  dalle: () =>
    une("dalle", () => {
      const m = matiereTexture(texDalle(), { roughness: 0.95 });
      m.userData.tuile = 6;
      return m;
    }),
  atlas: () =>
    une("atlas", () => {
      const m = new THREE.MeshStandardMaterial({ map: texAtlas(), vertexColors: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      m.userData.sansOmbre = true;
      return m;
    }),
};

// ---------- Petits outils de géométrie ----------

/** Un panneau peint de l'atlas, posé à plat (le plan regarde +z, tourné de `ry`). */
function panneau(c, region, x, y, z, l, h, ry = 0, rx = 0, rz = 0) {
  const [px, py, pw, ph] = ATLAS[region];
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / 1024, 1 - (py + (1 - uv.getY(i)) * ph) / 1024);
  c.poser(g, M.atlas(), 0xffffff, { x, y, z, ry, rx, rz }, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Un panneau sur poteau(x) : `bas` = hauteur du bas du panneau. */
function pancarte(c, region, x, z, l, h, ry = 0, bas = 1.0, penche = 0) {
  c.repere({ x, z, ry, rz: penche }, () => {
    const pieds = l > 1.1 ? [-l / 2 + 0.12, l / 2 - 0.12] : [0];
    for (const px of pieds) c.boite(0.07, bas + h, 0.07, 0x6d716c, { x: px, y: (bas + h) / 2, z: -0.06 }, M.tole());
    c.boite(l + 0.06, h + 0.06, 0.03, 0x8d918c, { y: bas + h / 2, z: -0.025 }, M.tole());
    panneau(c, region, 0, bas + h / 2, 0.0, l, h);
  });
}

/** Un rai de lumière (soleil par un trou du toit, une fenêtre) : prisme additif, teinte chaude atténuée. */
function rai(c, depuis, vers, largeur, _opacite, _couleur, teinte = 0x3a3428) {
  const a = new THREE.Vector3(...depuis);
  const b = new THREE.Vector3(...vers);
  const d = new THREE.Vector3().subVectors(b, a);
  const g = new THREE.CylinderGeometry(largeur * 0.5, largeur * 0.62, d.length(), 4, 1, true);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  const e = new THREE.Euler().setFromQuaternion(q);
  c.poser(g, M.lueur(), teinte, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2, rx: e.x, ry: e.y + Math.PI / 4, rz: e.z }, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Un triangle visible des deux côtés. */
function triangle2(c, mat, couleur, p) {
  const pos = [...p[0], ...p[1], ...p[2], ...p[0], ...p[2], ...p[1]];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  c.poser(g, mat, couleur, {}, { crasse: false, nuance: 0.03 });
  g.dispose();
}

/** Un cylindre couché le long de x. */
function cylX(c, x1, x2, y, z, r, couleur, mat, cotes = 12) {
  const g = new THREE.CylinderGeometry(r, r, Math.abs(x2 - x1), cotes, 1, false);
  c.poser(g, mat, couleur, { x: (x1 + x2) / 2, y, z, rz: PI / 2 });
  g.dispose();
}

/** Un cylindre couché le long de z. */
function cylZ(c, z1, z2, y, x, r, couleur, mat, cotes = 12) {
  const g = new THREE.CylinderGeometry(r, r, Math.abs(z2 - z1), cotes, 1, false);
  c.poser(g, mat, couleur, { x, y, z: (z1 + z2) / 2, rx: PI / 2 });
  g.dispose();
}

/** Un cylindre debout (r1 en bas, r2 en haut). */
function cylY(c, x, z, y1, y2, r1, r2, couleur, mat, cotes = 8, ouvert = false) {
  const g = new THREE.CylinderGeometry(r2, r1, y2 - y1, cotes, 1, ouvert);
  c.poser(g, mat, couleur, { x, y: (y1 + y2) / 2, z });
  g.dispose();
}

/** Un anneau (cerclage, garde-corps circulaire) : cylindre ouvert, fin. */
function anneau(c, x, z, y, r, h, couleur, mat = M.tole(), cotes = 12) {
  const g = new THREE.CylinderGeometry(r, r, h, cotes, 1, true);
  c.poser(g, mat, couleur, { x, y, z }, { crasse: false });
  g.dispose();
}

/** Une calotte (dôme) posée en y. */
function dome(c, x, z, y, r, hauteur, couleur, mat, cotes = 12) {
  const g = new THREE.SphereGeometry(r, cotes, 3, 0, TAU, 0, PI / 2);
  c.poser(g, mat, couleur, { x, y, z, e: [1, hauteur / r, 1] });
  g.dispose();
}

/** Un tuyau qui suit une ligne brisée, avec des coudes et des brides. */
function tuyau(c, pts, r, couleur, mat = M.tole(), cotes = 8, brides = true) {
  for (let i = 0; i < pts.length - 1; i++) {
    c.tube(pts[i], pts[i + 1], r, couleur, mat, cotes);
    const a = new THREE.Vector3(...pts[i]);
    const b = new THREE.Vector3(...pts[i + 1]);
    const d = b.clone().sub(a).normalize();
    if (brides && b.distanceTo(a) > 1.6) {
      const p = a.clone().addScaledVector(d, 0.4);
      c.tube(p.toArray(), p.clone().addScaledVector(d, 0.08).toArray(), r * 1.35, couleur, mat, cotes);
    }
    if (i > 0) {
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

/** Un poteau en I, de y0 à y1. */
function poteauI(c, x, z, y0, y1, s, couleur, ry = 0, mat = M.tole()) {
  c.repere({ x, z, ry }, () => {
    const h = y1 - y0;
    const ym = (y0 + y1) / 2;
    c.boite(s * 0.14, h, s, couleur, { y: ym }, mat);
    c.boite(s * 0.75, h, s * 0.1, couleur, { y: ym, z: s / 2 }, mat);
    c.boite(s * 0.75, h, s * 0.1, couleur, { y: ym, z: -s / 2 }, mat);
  });
}

/** Un garde-corps le long d'une ligne brisée [[x, z], …] posé à y0. */
function gardeCorps(c, pts, y0, couleur = C.jaune, h = 1.1, pas = 1.6) {
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

/** Un escalier métallique droit qui monte selon +x local (repère x, z, ry), de y0 à y1, de largeur l. */
function escalier(c, x, z, ry, y0, y1, l, couleur = C.acier) {
  const n = Math.round((y1 - y0) / 0.22);
  const g = 0.26;
  const L = n * g;
  const mat = M.tole();
  c.repere({ x, z, ry }, () => {
    for (const s of [-1, 1]) {
      c.poutre([0, y0, (s * l) / 2], [L, y1, (s * l) / 2], 0.12, couleur, mat);
      c.poutre([0, y0 + 0.95, (s * l) / 2], [L, y1 + 0.95, (s * l) / 2], 0.05, C.jaune, mat);
    }
    for (let k = 1; k <= n; k += 1) c.boite(0.24, 0.035, l - 0.1, C.grille, { x: k * g - 0.12, y: y0 + ((y1 - y0) * k) / n - 0.02 }, mat, { nuance: 0.03 });
  });
}

/** Une échelle verticale (repère : +z local s'écarte du support), avec ou sans crinoline. */
function echelleV(c, x, z, y1, y2, ry, couleur, crinoline = true, pas = 0.9) {
  c.repere({ x, z, ry }, () => {
    for (const s of [-0.22, 0.22]) c.boite(0.05, y2 - y1, 0.05, couleur, { x: s, y: (y1 + y2) / 2 }, M.tole());
    for (let y = y1 + 0.3; y < y2; y += pas) c.boite(0.44, 0.035, 0.035, couleur, { y }, M.tole(), { crasse: false });
    if (crinoline)
      for (let y = Math.max(y1 + 0.5, 2.8); y < y2 - 0.4; y += 2.4) {
        const g = new THREE.CylinderGeometry(0.38, 0.38, 0.05, 7, 1, true);
        c.poser(g, M.tole(), couleur, { y, z: 0.38 }, { crasse: false });
        g.dispose();
      }
  });
}

/** Un fût de 200 L, debout ou couché ; une étiquette de l'atlas si `etiquette`. */
function fut(c, x, z, couleur, { couche = false, ry = 0, y = 0, etiquette = null, rx = 0 } = {}) {
  const g = new THREE.CylinderGeometry(0.29, 0.29, 0.88, 8);
  if (couche) c.poser(g, M.tole(), couleur, { x, y: y + 0.29, z, rz: PI / 2, ry });
  else c.poser(g, M.tole(), couleur, { x, y: y + 0.44, z, rx, ry });
  g.dispose();
  if (!couche) {
    anneau(c, x, z, y + 0.3, 0.3, 0.04, couleur, M.tole(), 8);
    anneau(c, x, z, y + 0.6, 0.3, 0.04, couleur, M.tole(), 8);
    if (etiquette) panneau(c, etiquette, x + Math.sin(ry) * 0.3, y + 0.46, z + Math.cos(ry) * 0.3, 0.32, 0.16, ry);
  }
}

/** Un bidon de 20 L (jerrican). */
function bidon(c, x, y, z, couleur, ry = 0) {
  c.boite(0.3, 0.38, 0.2, couleur, { x, y: y + 0.19, z, ry }, M.mat(), { nuance: 0.08, crasse: false });
  c.boite(0.06, 0.06, 0.06, 0x3f4a44, { x: x + Math.cos(ry) * 0.08, y: y + 0.41, z: z - Math.sin(ry) * 0.08, ry }, M.mat(), { crasse: false });
}

/** Une palette en bois. */
function palette(c, x, z, ry = 0, y = 0, couleur = PALETTE.boisGris) {
  c.repere({ x, y, z, ry }, () => {
    c.boite(1.2, 0.03, 1.0, couleur, { y: 0.13 }, M.mat(), { nuance: 0.06 });
    for (const dz of [-0.45, 0, 0.45]) c.boite(1.2, 0.1, 0.1, couleur, { y: 0.06, z: dz }, M.mat(), { nuance: 0.06 });
  });
}

/** Une tache au sol : plaques aplaties, irrégulières. */
function tache(c, x, z, rayon, couleur, n = 5, y = 0.02) {
  mousse(c, x, y - 0.02, z, rayon, n, couleur);
}

/** Une plaque de sol irrégulière (terre morte, croûte) : un polygone plat. */
function plaque(c, x, z, rx, rz, couleur, y = 0.012, mat = M.mat()) {
  const pts = [];
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const k = c.entre(0.78, 1.08);
    pts.push(new THREE.Vector2(Math.cos(a) * rx * k, Math.sin(a) * rz * k));
  }
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts)).rotateX(-PI / 2);
  c.poser(g, mat, couleur, { x, y, z }, { crasse: false, nuance: 0.03 });
  g.dispose();
}

/** Une flaque colorée (eau suspecte) : disque irrégulier sur la matière d'eau, teinté. */
function flaqueTeintee(c, x, z, rayon, couleur, y = 0.025) {
  const pts = [];
  const n = 10;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const r = rayon * c.entre(0.6, 1.1);
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts)).rotateX(-PI / 2);
  c.poser(g, M.eau(), couleur, { x, y, z }, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Des coulures de rouille sur un cylindre debout (bandes fines plaquées). */
function coulures(c, x, z, r, y1, y2, n, couleur = 0x8a4a2a, mat = M.tole()) {
  for (let i = 0; i < n; i++) {
    const an = c.hasard() * TAU;
    const lg = c.entre(0.6, Math.max(0.8, (y2 - y1) * 0.55));
    const y = y2 - c.entre(0.1, (y2 - y1) * 0.35) - lg / 2;
    c.boite(c.entre(0.06, 0.22), lg, 0.02, couleur, { x: x + Math.sin(an) * (r + 0.01), y: Math.max(y1 + lg / 2, y), z: z + Math.cos(an) * (r + 0.01), ry: an }, mat, { crasse: false, nuance: 0.12 });
  }
}

/**
 * Un mur coupé : le bas (jusqu'à `cut`) dans le chantier toujours visible, avec les obstacles ; le haut dans le
 * chantier `haut` (une couche qui s'efface, ou le même chantier pour un mur plein). `matBas`/`couleurBas` : socle.
 */
function murCoupe(ctx, haut, a, bb, spec, cut = CUT) {
  const { b, c } = ctx;
  const ouv = spec.ouvertures ?? [];
  const bas = ouv.filter((o) => o.bas < cut - 0.02).map((o) => ({ ...o, type: "vide", haut: Math.min(o.haut, cut) }));
  mur(c, a, bb, { ...spec, mat: spec.matBas ?? spec.mat, couleur: spec.couleurBas ?? spec.couleur, h: cut, ouvertures: bas, batiment: b, breches: [], arase: 0 });
  const hauts = ouv.filter((o) => o.haut > cut + 0.02).map((o) => ({ ...o, bas: Math.max(0, o.bas - cut), haut: o.haut - cut }));
  mur(haut, a, bb, { ...spec, y0: cut, h: spec.h - cut, ouvertures: hauts, batiment: null });
}

/** Une porte battante en tôle, ouverte d'un angle (charnière en (x, z), le battant part selon +x tourné de ry). */
function battant(c, x, z, ry, l, h, couleur = 0x5f7a73) {
  c.repere({ x, z, ry }, () => c.boite(l, h, 0.05, couleur, { x: l / 2, y: h / 2 + 0.02 }, M.tole()));
}

// ---------- Le sol du site ----------

function libre(x, z, marge = 0) {
  for (const B of [MAGASIN, GARDE, ADMIN, ATELIER]) if (x > B.x0 - marge && x < B.x1 + marge && z > B.z0 - marge && z < B.z1 + marge) return false;
  for (const B of BASSINS) if (Math.abs(x - B.x) < B.l / 2 + 0.6 + marge && Math.abs(z - B.z) < B.p / 2 + 0.6 + marge) return false;
  return true;
}
function zoneMorte(x, z) {
  for (const B of BASSINS) {
    const R = Math.max(B.l, B.p) / 2 + 4.5;
    if (Math.hypot((x - B.x) / R, (z - B.z) / (R * 0.85)) < 1) return true;
  }
  return false;
}
function dansCuvette(x, z, m = 0) {
  return x > CUVETTE.x0 - m && x < CUVETTE.x1 + m && z > CUVETTE.z0 - m && z < CUVETTE.z1 + m;
}

function sol(ctx, x1, z1, x2, z2) {
  const { c, u } = ctx;
  const zones = [
    [-70, -36, 67, 0],
    [-70, 0, -24, 10],
    [-24, 0, 10, 34],
    [44, 0, 67, 16],
    [31, 20, 36, 28],
  ];
  const pas = 6;
  const pts = [];
  for (let x = -72; x < 70; x += pas)
    for (let z = -36; z < 36; z += pas) {
      const cx = x + pas / 2;
      const cz = z + pas / 2;
      if (cx < x1 - 3 || cx > x2 + 3 || cz < z1 - 3 || cz > z2 + 3) continue;
      if (!zones.some(([a1, b1, a2, b2]) => cx > a1 && cx < a2 && cz > b1 && cz < b2)) continue;
      const xa = Math.max(x, x1 - 3);
      const xb = Math.min(x + pas, x2 + 3);
      const za = Math.max(z, z1 - 3);
      const zb = Math.min(z + pas, z2 + 3);
      const route = (cx > 0 && cx < 9 && cz > -4) || (cz > -5 && cz < 0);
      if (!route && c.hasard() < 0.08 + 0.16 * u) {
        pts.push([cx + c.entre(-2, 2), cz + c.entre(-2, 2)]);
        continue; // dalle disparue : l'herbe a repris
      }
      c.pave(xa + 0.04, -0.02, za + 0.04, xb - 0.04, 0.04, zb - 0.04, route ? 0x8b8880 : c.hasard() < 0.2 ? 0x96928a : 0xa6a298, M.dalle(), { nuance: 0.05, crasse: false });
      if (c.hasard() < 0.2 + 0.35 * u) pts.push(c.hasard() < 0.5 ? [xa + 0.05, za + c.entre(0, pas)] : [xa + c.entre(0, pas), za + 0.05]);
    }
  touffes(c, pts.filter((p) => libre(p[0], p[1], 0.3)));
}

// ---------- La clôture ----------

function cloture(ctx, x1, z1, x2, z2) {
  const { b, c, u } = ctx;
  const travee = (xa, za, xb, zb, trou) => {
    const mx = (xa + xb) / 2;
    const mz = (za + zb) / 2;
    if (mx < x1 - 1 || mx > x2 + 1 || mz < z1 - 1 || mz > z2 + 1) return;
    const penche = c.entre(-0.06, 0.06);
    c.boite(0.12, 2.3, 0.12, 0xb8b2a4, { x: xa, y: 1.15, z: za, rz: penche, rx: penche * 0.5 }, M.beton(), { nuance: 0.04 });
    c.boite(0.1, 0.06, 0.5, 0xb8b2a4, { x: xa, y: 2.3, z: za + (xb === xa ? 0 : -0.18), rx: xb === xa ? 0 : 0.6, ry: xb === xa ? PI / 2 : 0 }, M.beton());
    if (trou || c.hasard() < 0.04 + 0.1 * u) {
      // Le panneau est tombé, couché dans l'herbe
      if (c.hasard() < 0.7) {
        const g = new THREE.PlaneGeometry(3, 2);
        const [px, py, pw, ph] = ATLAS.grillage;
        const uv = g.attributes.uv;
        for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / 1024, 1 - (py + (1 - uv.getY(i)) * ph) / 1024);
        c.poser(g, M.atlas(), 0xffffff, { x: mx + (xb === xa ? 1 : 0), y: 0.08, z: mz + (xb === xa ? 0 : 1.1), rx: -PI / 2 + 0.06, rz: xb === xa ? PI / 2 : 0 }, { crasse: false, nuance: 0 });
        g.dispose();
      }
      return;
    }
    const ry = Math.atan2(-(zb - za), xb - xa);
    panneau(c, "grillage", mx, 1.12, mz, 3.0, 2.0, ry, 0, penche * 0.4);
    c.poutre([xa, 2.18, za], [xb, 2.18, zb], 0.025, 0x5a5650, M.tole());
    c.poutre([xa, 2.38, za], [xb, 2.38, zb], 0.02, 0x5a5650, M.tole());
    b.obstacle(xa, za, xb, zb, "grillage");
  };
  for (let x = -70; x < 16; x += 3) {
    if (x >= -1 && x < 9) continue;
    travee(x, 34, x + 3, 34, Math.abs(x + 40) < 1.6);
  }
  for (let x = 9; x < 66; x += 3) travee(x, 34, x + 3, 34, false);
  for (let z = -35; z < 34; z += 3) travee(-71, z, -71, z + 3, Math.abs(z + 2) < 1.6 || Math.abs(z + 5) < 1.6);
}

// ---------- Le poste de garde et l'entrée ----------

function posteDeGarde(ctx) {
  const { b, c, u } = ctx;
  const G = GARDE;
  const k = b.couche("poste de garde : toit et hauts de murs", { x: (G.x0 + G.x1) / 2, z: (G.z0 + G.z1) / 2, l: G.x1 - G.x0 + 1.2, p: G.z1 - G.z0 + 1.2 }, CUT, 4.6);
  c.pave(G.x0 + 0.12, -0.02, G.z0 + 0.12, G.x1 - 0.12, 0.07, G.z1 - 0.12, 0x9c978b, M.mat(), { crasse: false });
  const sp = { h: G.h, ep: 0.25, couleur: 0xe0dac9, mat: M.mat(), interieur: { couleur: 0xcfd6c6, mat: M.mat() } };
  const fen = (uu, l) => ({ u: uu, l, bas: 1.2, haut: 2.5, type: "fenetre", croisillons: 2, traverses: 1, bris: 0.3 + 0.6 * u, verre: M.verre(), cadre: 0x56625e });
  murCoupe(ctx, k, [G.x0, G.z1], [G.x1, G.z1], { ...sp, ouvertures: [fen(3.6, 4.8)] });
  murCoupe(ctx, k, [G.x1, G.z1], [G.x1, G.z0], { ...sp, ouvertures: [{ u: 1.4, l: 1.0, bas: 0, haut: 2.15, type: "vide" }, fen(4.1, 2.2)] });
  murCoupe(ctx, c, [G.x1, G.z0], [G.x0, G.z0], { ...sp, ouvertures: [fen(3.5, 3)] });
  murCoupe(ctx, c, [G.x0, G.z0], [G.x0, G.z1], { ...sp, ouvertures: [] });
  battant(c, G.x1 + 0.1, 29.1, -2.2, 0.95, 2.1);
  // Le toit plat débordant, la frise et l'enseigne
  k.pave(G.x0 - 0.5, G.h, G.z0 - 0.5, G.x1 + 0.5, G.h + 0.22, G.z1 + 0.5, 0xc9c3b4, M.beton());
  k.pave(G.x0 - 0.55, G.h + 0.22, G.z1 + 0.35, G.x1 + 0.55, G.h + 0.5, G.z1 + 0.55, C.emaille, M.tole());
  k.pave(G.x1 + 0.35, G.h + 0.22, G.z0 - 0.55, G.x1 + 0.55, G.h + 0.5, G.z1 + 0.55, C.emaille, M.tole());
  for (const x of [-7.4, -3.6]) k.poutre([x, G.h + 0.2, 28.8], [x, G.h + 1.25, 28.8], 0.08, C.acier, M.tole());
  panneau(k, "logo", -5.5, G.h + 0.95, 28.86, 3.2, 0.8);
  mousse(k, -7, G.h + 0.22, 26, 1.5, 6);

  // Dedans : le bureau des gardiens, les écrans de surveillance morts, le tableau des clés
  c.pave(-8.7, 0, 29.1, -4.4, 0.76, 29.75, 0x6f6a5c, M.mat());
  for (const x of [-8, -7.1, -6.2]) {
    c.boite(0.45, 0.4, 0.4, 0x3f4440, { x, y: 0.98, z: 29.45, ry: c.entre(-0.1, 0.1) }, M.mat());
    c.boite(0.36, 0.28, 0.02, 0x1e2426, { x, y: 0.98, z: 29.24 }, M.mat(), { crasse: false });
  }
  c.repere({ x: -6.8, z: 28.4, ry: 0.5 }, () => {
    c.boite(0.5, 0.08, 0.5, 0x4a4a46, { y: 0.48 }, M.mat());
    c.boite(0.46, 0.55, 0.07, 0x4a4a46, { y: 0.8, z: -0.24 }, M.mat());
    c.poutre([0, 0.05, 0], [0, 0.45, 0], 0.05, 0x3d4a52, M.metal());
  });
  c.pave(G.x0 + 0.14, 1.3, 26.2, G.x0 + 0.24, 2.0, 27.2, 0x6a5a48, M.mat());
  for (let i = 0; i < 6; i++) c.boite(0.03, 0.09, 0.04, PALETTE.laiton, { x: G.x0 + 0.27, y: 1.85 - Math.floor(i / 3) * 0.3, z: 26.4 + (i % 3) * 0.3 }, M.metal(), { crasse: false });
  // Le camp des survivants : matelas, couverture, caisses, conserves, la lanterne
  c.boite(0.9, 0.16, 1.9, 0x7a6f5a, { x: -8.3, y: 0.15, z: 25.4, ry: 0.05 }, M.mat());
  c.boite(0.8, 0.06, 1.3, 0x5a6e4a, { x: -8.25, y: 0.26, z: 25.65, ry: 0.1 }, M.toile(), { crasse: false });
  c.boite(0.5, 0.45, 0.4, PALETTE.bois, { x: -6.9, y: 0.23, z: 24.6, ry: 0.3 }, M.mat());
  c.boite(0.45, 0.4, 0.4, PALETTE.boisSombre, { x: -6.3, y: 0.2, z: 25.1, ry: -0.2 }, M.mat());
  for (let i = 0; i < 5; i++) cylY(c, -5.5 + c.entre(-0.4, 0.4), 24.7 + c.entre(-0.3, 0.3), 0.07, 0.19, 0.05, 0.05, i % 2 ? 0xb8b4a8 : 0x8a4a3a, M.metal(), 6);
  // La lanterne, posée sur la caisse
  cylY(c, -6.9, 24.6, 0.45, 0.52, 0.1, 0.1, 0x3a3d3a, M.tole(), 6);
  cylY(c, -6.9, 24.6, 0.52, 0.72, 0.07, 0.07, 0xffd48a, M.verre(), 6);
  cylY(c, -6.9, 24.6, 0.72, 0.78, 0.09, 0.05, 0x3a3d3a, M.tole(), 6);
  b.lumiere(-6.9, 0.9, 24.6, 0xffc06a, 6, 10, "lampe-tempête des survivants (poste de garde)");
  jonchee(c, G.x0 + 0.3, G.z0 + 0.3, G.x1 - 0.3, G.z1 - 0.3, 18, [0xe8e2d2, 0xd9d2c0, 0x9c7a45], 0.08);
  obstacleRect(b, -8.7, 29.1, -4.4, 29.75, "bureau");

  // La barrière levante cassée, le lecteur de badge, le portail coulissant poussé
  c.boite(0.35, 1.0, 0.35, 0xd8d2c2, { x: 0.4, y: 0.5, z: 32.4 }, M.tole());
  c.boite(0.5, 0.25, 0.3, 0x6f736e, { x: 0.4, y: 1.1, z: 32.4 }, M.tole());
  for (let i = 0; i < 8; i++) {
    const x = 1.2 + i * 0.7;
    c.boite(0.7, 0.09, 0.09, i % 2 ? 0xe2ddd0 : 0xb0463a, { x, y: 0.12 + (i < 2 ? 0.3 - i * 0.15 : 0), z: 32.7 + i * 0.12, ry: -0.17, rz: i < 2 ? -0.35 : 0 }, M.tole(), { crasse: false });
  }
  pancarte(c, "badge", -0.6, 32.9, 1.3, 0.65, 0, 0.9);
  c.boite(0.2, 0.3, 0.1, 0x2f3436, { x: -0.6, y: 1.1, z: 32.75 }, M.mat());
  // Le portail coulissant, ouvert, couché de travers sur son rail
  c.repere({ x: 12, z: 34.6, ry: 0.05, rz: 0.08 }, () => {
    c.boite(6.2, 0.1, 0.1, C.acierGris, { y: 0.15 }, M.tole());
    c.boite(6.2, 0.1, 0.1, C.acierGris, { y: 2.05 }, M.tole());
    for (const x of [-3.05, 0, 3.05]) c.boite(0.1, 2.0, 0.1, C.acierGris, { x, y: 1.1 }, M.tole());
    panneau(c, "grillage", -1.5, 1.1, 0, 3, 1.85);
    panneau(c, "grillage", 1.5, 1.1, 0, 3, 1.85);
  });
  b.obstacle(9, 34.6, 15, 34.6, "portail");
}

// ---------- Le magasin des produits ----------

function magasin(ctx, niveau) {
  const { b, c, u } = ctx;
  const B = MAGASIN;
  const fin = niveau === "fin";
  const k = fin ? b.couche("magasin des produits : toit et hauts de murs", { x: (B.x0 + B.x1) / 2, z: (B.z0 + B.z1) / 2, l: B.x1 - B.x0 + 1, p: B.z1 - B.z0 + 1 }, CUT, 6.5) : c;
  const sp = { h: B.h, ep: 0.3, couleur: C.bardage, mat: M.bardage(), couleurBas: C.beton, matBas: M.beton() };
  const fh = (uu, l) => ({ u: uu, l, bas: 3.9, haut: 4.7, type: "fenetre", croisillons: 2, traverses: 1, bris: 0.4 + 0.5 * u, verre: M.verre(), cadre: 0x56625e, appui: false });
  murCoupe(ctx, k, [B.x0, B.z1], [B.x1, B.z1], { ...sp, ouvertures: [{ u: 8, l: 4.2, bas: 0, haut: 3.9, type: "vide" }, fh(3, 3), fh(13, 3)] });
  murCoupe(ctx, k, [B.x1, B.z1], [B.x1, B.z0], { ...sp, ouvertures: [{ u: 5, l: 1.1, bas: 0, haut: 2.2, type: "vide" }, fh(9.5, 2.5)] });
  murCoupe(ctx, c, [B.x1, B.z0], [B.x0, B.z0], { ...sp, ouvertures: [fh(4, 3), fh(12, 3)] });
  murCoupe(ctx, c, [B.x0, B.z0], [B.x0, B.z1], { ...sp, ouvertures: [], breches: [{ u: 9, l: 3, profondeur: 1.5 * u }] });
  c.pave(B.x0 + 0.15, -0.02, B.z0 + 0.15, B.x1 - 0.15, 0.06, B.z1 - 0.15, 0x9a968c, M.dalle(), { crasse: false });
  // Le rideau métallique à demi levé : lames tordues, tambour en haut
  for (let y = 2.3; y < 3.9; y += 0.16) k.boite(4.1, 0.14, 0.05, 0x8a8f88, { x: -12, y, z: B.z1 + 0.1, rx: y < 2.5 ? 0.3 : 0 }, M.tole(), { nuance: 0.05 });
  cylX(k, -14.2, -9.8, 4.15, B.z1 + 0.25, 0.3, 0x6f736e, M.tole(), 8);
  battant(c, B.x1 + 0.12, 8.45, -1.0, 1.05, 2.1, 0x6a7a74);
  // Le toit en bac acier, percé
  const trous = new Set(["-15|6", "-9|10", "-13|12"]);
  for (let x = B.x0; x < B.x1 - 0.1; x += 2)
    for (let z = B.z0; z < B.z1 - 0.1; z += 2) {
      const cle = `${x + 1}|${z + 1}`;
      if (trous.has(cle) || (c.hasard() < 0.15 * u && x > B.x0)) {
        if (fin) rai(c, [x + 1.2, B.h + 0.2, z + 0.6], [x + 0.4, 0.05, z + 2.2], 1.6, 0.2, 0xffffff);
        continue;
      }
      k.pave(x - 0.02, B.h + 0.05 + (z - B.z0) * 0.03, z - 0.02, x + 2.02, B.h + 0.17 + (z - B.z0) * 0.03, z + 2.02, 0xb8bcb4, M.bardage(), { nuance: 0.05, crasse: false });
    }
  for (const x of [-16, -12, -8]) k.pave(x - 0.12, B.h - 0.3, B.z0, x + 0.12, B.h + 0.05, B.z1, C.acier, M.tole());
  mousse(k, -6, B.h + 0.3, 4, 1.4, 6);
  if (!fin) return;

  // Les rayonnages le long du mur nord : fûts de soude, sacs en haut
  const z0 = B.z0 + 0.35;
  const z1 = z0 + 1.1;
  for (let x = -19.5; x <= -8.1; x += 2.85) {
    for (const z of [z0, z1]) c.poutre([x, 0, z], [x, 3.4, z], 0.08, 0xb0683a, M.tole());
  }
  for (const y of [1.5, 2.9]) for (const z of [z0, z1]) c.pave(-19.5, y - 0.06, z - 0.04, -8.1, y + 0.06, z + 0.04, 0x4f6f8f, M.tole());
  for (let i = 0; i < 4; i++) {
    const xa = -19.5 + i * 2.85;
    for (const y of [0, 1.56]) {
      if (c.hasard() < 0.15) continue;
      palette(c, xa + 1.42, (z0 + z1) / 2, 0, y);
      for (let j = 0; j < 4; j++) {
        if (c.hasard() < 0.15) continue;
        fut(c, xa + 0.75 + (j % 2) * 1.3, z0 + 0.3 + Math.floor(j / 2) * 0.5, j % 3 ? 0x3f6f9a : 0x2f5a80, { y: y + 0.15, etiquette: j === 2 ? "etSoude" : null });
      }
    }
    for (let j = 0; j < 5; j++) c.boite(0.6, 0.16, 0.42, 0xd8d2c0, { x: xa + 0.5 + j * 0.45, y: 3.05 + (j % 2) * 0.16, z: (z0 + z1) / 2 + c.entre(-0.2, 0.2), ry: c.entre(-0.3, 0.3) }, M.mat(), { nuance: 0.06, crasse: false });
  }
  obstacleRect(b, -19.6, z0 - 0.1, -8, z1 + 0.1, "rayonnages");
  // Le fût renversé et sa tache de soude
  fut(c, -10.4, 7.2, 0x3f6f9a, { couche: true, ry: 0.6 });
  tache(c, -10.8, 7.4, 1.4, 0xe2ddcc, 6);
  tache(c, -10.4, 7.0, 0.9, 0xb8a68a, 4);
  // Les bidons d'acide sur leurs palettes
  for (const [px, pz] of [[-9.5, 5.2], [-7.9, 5.4]]) {
    palette(c, px, pz, 0.1);
    for (let i = 0; i < 9; i++) bidon(c, px - 0.38 + (i % 3) * 0.38, 0.15, pz - 0.3 + Math.floor(i / 3) * 0.3, c.hasard() < 0.7 ? 0xe2dccb : 0xc9b98a, 0.1);
  }
  panneau(c, "etAcide", -9.5, 0.75, 5.53, 0.5, 0.25);
  // Deux cubitainers dans leur cage
  for (const [px, pz] of [[-6.2, 11.2], [-6.3, 12.6]]) {
    palette(c, px, pz, 0, 0, 0x6f736e);
    c.boite(1.0, 1.0, 1.1, 0xe6e4da, { x: px, y: 0.68, z: pz }, M.mat(), { nuance: 0.03 });
    for (const [dx, dz] of [[-0.52, -0.57], [0.52, -0.57], [-0.52, 0.57], [0.52, 0.57]]) c.poutre([px + dx, 0.15, pz + dz], [px + dx, 1.25, pz + dz], 0.035, 0x8d9490, M.metal());
    for (const y of [0.6, 1.2]) {
      c.poutre([px - 0.52, y, pz - 0.57], [px + 0.52, y, pz - 0.57], 0.03, 0x8d9490, M.metal());
      c.poutre([px - 0.52, y, pz + 0.57], [px + 0.52, y, pz + 0.57], 0.03, 0x8d9490, M.metal());
      c.poutre([px - 0.52, y, pz - 0.57], [px - 0.52, y, pz + 0.57], 0.03, 0x8d9490, M.metal());
    }
  }
  obstacleRect(b, -6.8, 10.5, -5.6, 13.3, "cubitainers");
  // Les sacs éventrés, la poudre blanche répandue
  for (let i = 0; i < 9; i++) c.boite(0.62, 0.16, 0.42, 0xe0dacb, { x: -16.8 + c.entre(-0.8, 0.8), y: 0.1 + (i % 3) * 0.15, z: 10.6 + c.entre(-0.7, 0.7), ry: c.hasard() * 3, rz: c.entre(-0.2, 0.2) }, M.mat(), { nuance: 0.05 });
  tache(c, -16.2, 11.3, 1.3, 0xefebe0, 6);
  // Le transpalette, le bureau du magasinier
  c.repere({ x: -13, z: 9.2, ry: 0.4 }, () => {
    for (const s of [-0.28, 0.28]) c.boite(0.16, 0.08, 1.15, 0xb0683a, { x: s, y: 0.06 }, M.tole());
    c.boite(0.7, 0.3, 0.25, 0xb0683a, { y: 0.2, z: -0.65 }, M.tole());
    c.poutre([0, 0.3, -0.7], [0, 1.2, -1.0], 0.05, 0x3a3d3a, M.tole());
  });
  c.pave(-19.7, 0, 12.2, -18.2, 0.75, 13.6, 0x6f6a5c, M.mat());
  c.boite(0.3, 0.02, 0.4, 0xe8e2d2, { x: -19, y: 0.77, z: 12.9, ry: 0.3 }, M.mat(), { crasse: false });
  // Les losanges au mur nord, au-dessus des rayonnages ; le masque obligatoire sur le mur ouest
  panneau(c, "corrosif", -12.3, 4.25, B.z0 + 0.17, 0.7, 0.7);
  panneau(c, "flamme", -11.4, 4.25, B.z0 + 0.17, 0.7, 0.7);
  panneau(c, "masque", B.x0 + 0.17, 2.2, 8, 0.9, 0.9, PI / 2);
  debris(c, B.x0 + 0.5, B.z0 + 1.6, B.x1 - 0.5, B.z1 - 0.5, 30, [0xd8d2c4, 0x9a968c, 0x6f6a60]);
  if (u > 0.4) gravats(c, B.x0 + 1.2, 9, 1.2, 10, [C.beton, 0x9aa09a, C.rouille]);
  // Le lierre sur le mur ouest
  lierre(c, B.x0 - 0.17, 0, 6, -PI / 2, 4, 3.4, 40);
}

// ---------- Le parc à cuves ----------

function parcACuves(ctx) {
  const { b, c, u } = ctx;
  const V = CUVETTE;
  const k = b.couche("parc à cuves : hauts des cuves, escaliers", { x: (V.x0 + V.x1) / 2, z: (V.z0 + V.z1) / 2, l: V.x1 - V.x0, p: V.z1 - V.z0 }, 2.4, 12);
  // La cuvette de rétention : muret de 1,2 m, un passage au sud-est
  const m = { h: 1.2, ep: 0.3, couleur: 0xa8a398, mat: M.beton(), batiment: b };
  mur(c, [V.x0, V.z1], [V.x1, V.z1], { ...m, ouvertures: [{ u: 22.3, l: 1.6, bas: 0, haut: 1.3, type: "vide" }] });
  mur(c, [V.x1, V.z1], [V.x1, V.z0], m);
  mur(c, [V.x1, V.z0], [V.x0, V.z0], m);
  mur(c, [V.x0, V.z0], [V.x0, V.z1], m);
  panneau(c, "corrosif", -60, 0.62, V.z1 + 0.16, 0.8, 0.8);
  panneau(c, "tete", -59.1, 0.62, V.z1 + 0.16, 0.8, 0.8);
  panneau(c, "nature", -52, 0.62, V.z1 + 0.16, 0.8, 0.8);
  pancarte(c, "atex", -44.6, -13.4, 1.6, 0.8, 0, 1.0);
  pancarte(c, "carton", -47.2, -13.5, 0.9, 0.45, 0.15, 0.7, 0.08);
  // Les taches au fond de la cuvette
  tache(c, -56, -24.5, 3.5, 0x7a6a4a, 7);
  tache(c, -60, -15.8, 1.6, 0xd9d4c4, 5);
  plaque(c, -56, -24, 9, 7, 0x8a8576, 0.045);

  for (const T of CUVES) {
    const { x, z, r, h, couleur } = T;
    cylY(c, x, z, 0, 0.3, r + 0.35, r + 0.3, C.betonSombre, M.beton(), 16);
    cylY(c, x, z, 0.3, 2.4, r, r, couleur, M.tole(), 16);
    cylY(k, x, z, 2.4, h, r, r, couleur, M.tole(), 16, true);
    for (let y = 2.0; y < h; y += 2.2) anneau(y < 2.4 ? c : k, x, z, y, r + 0.02, 0.06, couleur - 0x0f0f0f, M.tole(), 16);
    // Le toit conique, la rambarde du toit, l'évent
    const g = new THREE.ConeGeometry(r + 0.12, 1.1, 16);
    k.poser(g, M.tole(), couleur - 0x080808, { x, y: h + 0.55, z });
    g.dispose();
    anneau(k, x, z, h + 1.0, r - 0.2, 0.05, C.jaune, M.tole(), 12);
    cylY(k, x + 0.8, z - 0.6, h + 0.6, h + 1.5, 0.15, 0.15, C.acierGris, M.tole(), 6);
    coulures(k, x, z, r, 2.4, h, 8, 0x8a4a2a);
    coulures(c, x, z, r, 0.3, 2.4, 3, 0x7a5a3a);
    // Le trou d'homme au pied
    c.boite(0.8, 0.8, 0.12, couleur - 0x101010, { x: x + Math.sin(2.4) * r, y: 0.9, z: z + Math.cos(2.4) * r, ry: 2.4 }, M.tole());
    obstacleRect(b, x - r * 0.9, z - r * 0.9, x + r * 0.9, z + r * 0.9, "cuve");
    // L'escalier en colimaçon (le bas reste au sol, le haut s'efface)
    if (T.escalier !== undefined) {
      const n = Math.round(h / 0.25);
      let prec = null;
      for (let i = 1; i <= n; i++) {
        const an = T.escalier + (i / n) * PI * 1.35;
        const y = i * 0.25;
        const ch = y < 2.4 ? c : k;
        ch.boite(0.28, 0.04, 0.85, C.grille, { x: x + Math.sin(an) * (r + 0.5), y, z: z + Math.cos(an) * (r + 0.5), ry: an }, M.tole(), { crasse: false });
        const p = [x + Math.sin(an) * (r + 0.95), y + 1.0, z + Math.cos(an) * (r + 0.95)];
        if (prec && i % 2 === 0) {
          ch.poutre(prec, p, 0.045, C.jaune, M.tole());
          ch.poutre([p[0], y, p[2]], p, 0.04, C.jaune, M.tole());
        }
        if (i % 2 === 0) prec = p;
      }
    }
  }
  // Les pochoirs, sur des plaques déportées (la cuve est ronde)
  for (const [id, region] of [["t101", "t101"], ["t102", "t102"], ["t103", "t103"]]) {
    const T = CUVES.find((q) => q.id === id);
    const zp = T.z + T.r + 0.18;
    k.boite(2.9, 0.62, 0.04, 0xd8d4c6, { x: T.x, y: 4.0, z: zp - 0.03 }, M.tole());
    for (const dx of [-1.1, 1.1]) k.boite(0.06, 0.06, 0.4, C.acierGris, { x: T.x + dx, y: 4.0, z: zp - 0.22 }, M.tole());
    panneau(k, region, T.x, 4.0, zp, 2.8, 0.52);
  }
  // La cuve qui fuit, et sa banderole « Chimie verte, avenir propre »
  {
    const T = CUVES.find((q) => q.fuite);
    const zp = T.z + T.r + 0.25;
    for (const dx of [-1.7, 1.7]) {
      k.poutre([T.x + dx, 3.6, zp - 0.3], [T.x + dx, 3.6, zp], 0.06, C.acierGris, M.tole());
      k.poutre([T.x + dx, 5.4, zp - 0.3], [T.x + dx, 5.4, zp], 0.06, C.acierGris, M.tole());
    }
    k.boite(3.5, 0.92, 0.03, 0xc9d6b4, { x: T.x, y: 4.5, z: zp - 0.03, rz: 0.04 }, M.tole());
    panneau(k, "chimieVerte", T.x, 4.5, zp, 3.4, 0.85, 0, 0, 0.04);
    // La fuite : bride corrodée, coulée verte, flaque acide
    const an = 0.5;
    const fx = T.x + Math.sin(an) * (T.r + 0.02);
    const fz = T.z + Math.cos(an) * (T.r + 0.02);
    c.tube([fx - Math.sin(an) * 0.2, 1.6, fz - Math.cos(an) * 0.2], [fx + Math.sin(an) * 0.4, 1.6, fz + Math.cos(an) * 0.4], 0.12, C.rouille, M.tole(), 6);
    c.boite(0.25, 1.6, 0.02, 0x9aae3a, { x: fx + Math.sin(an) * 0.03, y: 0.8, z: fz + Math.cos(an) * 0.03, ry: an }, M.tole(), { crasse: false });
    k.boite(0.18, 2.5, 0.02, 0x7f8f3a, { x: T.x + Math.sin(0.2) * (T.r + 0.02), y: 3.6, z: T.z + Math.cos(0.2) * (T.r + 0.02), ry: 0.2 }, M.tole(), { crasse: false });
    flaqueTeintee(c, -48.6, -15.4, 1.9, 0xa8cf4a, 0.05);
    tache(c, -48.2, -15.6, 2.6, 0x8a8a4a, 6);
  }
  // Un fût de solvant intact, un autre renversé
  fut(c, -52, -16.6, 0x8a2f2a, { etiquette: "etSolvant", ry: 0.2 });
  fut(c, -53.4, -16.3, 0x5a5a52, { couche: true, ry: 1.1 });
  // Les conduites vers le rack (par-dessus le muret)
  for (const [x, z, r, coul] of [[-50, -24.7, 0.2, 0x8d9490], [-62.5, -24.7, 0.18, C.vert], [-48, -16.2, 0.16, C.rouille]]) {
    tuyau(c, [[x, 2.4, z], [x, 2.4, -12.4], [x, RACK.y1 + 0.3, -12.4], [x, RACK.y1 + 0.3, RACK.z0 + 0.4]], r, coul, M.tole(), 6);
    c.poutre([x, 0, -13.2], [x, 2.3, -13.2], 0.15, C.acier, M.tole());
  }
  // Les arbustes qui poussent dans la cuvette
  arbuste(c, -67.5, -33.5, 1.2);
  arbuste(c, -44.5, -33.6, 1.0);
  arbuste(c, -56.3, -34, 0.8, 0, [0x7d8a50, 0x6f7a48, 0x8a9258]);
}

// ---------- Les colonnes de distillation et leur structure ----------

function colonnes(ctx, niveau) {
  const { b, c, u } = ctx;
  const fin = niveau === "fin";
  const k = fin ? b.couche("colonnes de distillation et structure", { x: -31, z: -21, l: 19, p: 19 }, 3, 34) : c;
  for (const [i, Q] of COLONNES.entries()) {
    const { x, z, r, h, couleur } = Q;
    cylY(c, x, z, 0, 0.5, r + 0.75, r + 0.65, C.betonSombre, M.beton(), 8);
    cylY(c, x, z, 0.5, 3, r * 1.05, r, couleur - 0x101010, M.tole(), 12);
    cylY(k, x, z, 3, h, r, r, couleur, M.bardage(), 12, true);
    dome(k, x, z, h, r, r * 0.55, couleur, M.tole(), 12);
    if (!fin) {
      for (let y = 9; y < h - 2; y += 7) cylY(k, x, z, y, y + 0.1, r + 1.1, r + 1.1, C.grille, M.tole(), 10);
      continue;
    }
    c.boite(0.9, 1.2, 0.2, 0x2a2c2a, { x: x + Math.sin(0.8) * r, y: 1.2, z: z + Math.cos(0.8) * r, ry: 0.8 }, M.mat());
    obstacleRect(b, x - r - 0.5, z - r - 0.5, x + r + 0.5, z + r + 0.5, "colonne");
    for (let y = 5; y < h - 1; y += 5.2) anneau(k, x, z, y, r + 0.03, 0.08, couleur - 0x1a1a1a, M.tole(), 12);
    // Les plates-formes et leurs garde-corps circulaires
    for (let y = 8 + i * 1.3; y < h - 2; y += 7) {
      cylY(k, x, z, y, y + 0.08, r + 1.1, r + 1.1, C.grille, M.tole(), 12);
      anneau(k, x, z, y + 1.05, r + 1.1, 0.05, C.jaune, M.tole(), 12);
      anneau(k, x, z, y + 0.55, r + 1.1, 0.04, C.jaune, M.tole(), 12);
      for (let q = 0; q < 6; q++) {
        const an = (q / 6) * TAU + 0.3;
        k.poutre([x + Math.sin(an) * (r + 1.1), y, z + Math.cos(an) * (r + 1.1)], [x + Math.sin(an) * (r + 1.1), y + 1.05, z + Math.cos(an) * (r + 1.1)], 0.045, C.jaune, M.tole());
      }
      // Une plate-forme pend, arrachée
      if (i === 0 && y > 20) k.boite(1.6, 0.06, 0.9, C.grille, { x: x + r + 1.2, y: y - 0.8, z, rz: -0.8 }, M.tole());
    }
    // L'échelle à crinoline, du haut de la jupe au sommet
    const an = 0.75 + i * 0.4;
    echelleV(k, x + Math.sin(an) * (r + 0.25), z + Math.cos(an) * (r + 0.25), 3.2, h, an, C.jaune);
    // Les piquages, le tuyau de vapeur qui redescend vers le condenseur
    for (let q = 0; q < 4; q++) {
      const a2 = c.hasard() * TAU;
      const y = 5 + c.hasard() * (h - 8);
      k.tube([x + Math.sin(a2) * r, y, z + Math.cos(a2) * r], [x + Math.sin(a2) * (r + 0.6), y, z + Math.cos(a2) * (r + 0.6)], 0.12, C.acierGris, M.tole(), 6);
      k.tube([x + Math.sin(a2) * (r + 0.5), y, z + Math.cos(a2) * (r + 0.5)], [x + Math.sin(a2) * (r + 0.6), y, z + Math.cos(a2) * (r + 0.6)], 0.2, C.acierGris, M.tole(), 6);
    }
    const yt = h + r * 0.55;
    tuyau(k, [[x, yt, z], [x, yt + 0.8, z], [x + r + 0.5, yt + 0.8, z], [x + r + 0.5, 16, z], [-26, 16, -15]], 0.22, C.alu, M.tole(), 8);
    coulures(k, x, z, r, 4, h, 6, 0x8a5a3a);
  }
  // Les colonnes sur la ligne d'horizon de l'autre carte : la balise de la torchère suffit, pas de structure
  if (!fin) return;

  // La structure métallique à trois niveaux : poteaux, planchers en caillebotis, contreventements, escaliers
  const S = STRUCTURE;
  const xs = [S.x0, (S.x0 + S.x1) / 2, S.x1];
  for (const x of xs)
    for (const z of [S.z0, S.z1]) {
      poteauI(c, x, z, 0, 3, 0.3, C.acier);
      poteauI(k, x, z, 3, 14.2, 0.3, C.acier);
      b.obstacle(x - 0.2, z, x + 0.2, z, "poteau");
    }
  for (const y of S.niveaux) {
    k.pave(S.x0, y - 0.05, S.z0, S.x1, y + 0.02, S.z1, C.grille, M.tole());
    for (const z of [S.z0, S.z1]) k.pave(S.x0, y - 0.3, z - 0.1, S.x1, y - 0.05, z + 0.1, C.acier, M.tole());
    gardeCorps(k, [[S.x0, S.z1], [S.x1, S.z1], [S.x1, S.z0]], y + 0.02, C.jaune);
  }
  for (let j = 0; j < S.niveaux.length; j++) {
    const ya = j ? S.niveaux[j - 1] : 3;
    const yb = S.niveaux[j];
    k.poutre([S.x0, ya, S.z0], [(S.x0 + S.x1) / 2, yb, S.z0], 0.12, C.acier, M.tole());
    k.poutre([S.x1, ya, S.z0], [(S.x0 + S.x1) / 2, yb, S.z0], 0.12, C.acier, M.tole());
    k.poutre([S.x0, ya, S.z0], [S.x0, yb, S.z1], 0.12, C.acier, M.tole());
  }
  escalier(k, S.x0 + 0.6, S.z1 - 0.7, 0, S.niveaux[0], S.niveaux[1], 0.9);
  escalier(k, S.x0 + 0.6, S.z0 + 0.7, 0, S.niveaux[1], S.niveaux[2], 0.9);
  // La volée du bas s'est effondrée : on ne monte plus (elle gît au sol)
  c.repere({ x: S.x1 + 1.6, z: S.z1 + 1.2, ry: 0.5 }, () => {
    for (const s of [-1, 1]) c.poutre([0, 0.12, s * 0.45], [4.4, 0.25, s * 0.45], 0.12, C.acier, M.tole());
    for (let q = 1; q < 16; q += 1) c.boite(0.24, 0.035, 0.8, C.grille, { x: q * 0.27, y: 0.2, rz: 0.04 }, M.tole());
  });
  // Le condenseur, le ballon de reflux, les pompes au sol
  cylX(k, S.x0 + 0.3, S.x1 - 0.3, 14.4 + 0.7, -15, 0.7, C.alu, M.tole(), 10);
  for (const x of [S.x0 + 1, S.x1 - 1]) k.pave(x - 0.2, 13.5, -15.5, x + 0.2, 14.5, -14.5, C.acier, M.tole());
  cylX(k, -28, -25, 9.6, -14, 0.5, 0x8d9490, M.tole(), 10);
  for (const [px, pz] of [[-27, -14.2], [-24.8, -14.2]]) {
    c.pave(px - 0.6, 0, pz - 0.35, px + 0.6, 0.3, pz + 0.35, C.betonSombre, M.beton());
    cylX(c, px - 0.5, px + 0.05, 0.6, pz, 0.24, 0x4f6f8f, M.tole(), 8);
    cylX(c, px + 0.05, px + 0.55, 0.6, pz, 0.28, 0x5f7f6a, M.tole(), 8);
    c.tube([px - 0.3, 0.6, pz], [px - 0.3, 3, pz], 0.1, C.acierGris, M.tole(), 6);
    k.tube([px - 0.3, 3, pz], [px - 0.3, 9.3, pz], 0.1, C.acierGris, M.tole(), 6);
    obstacleRect(b, px - 0.6, pz - 0.35, px + 0.6, pz + 0.35, "pompe");
  }
  // Le tuyau de pied vers le rack
  tuyau(c, [[-25, 0.6, -14.2], [-23, 0.6, -14.2], [-23, 3, -14.2]], 0.12, C.vert, M.tole(), 6);
  tuyau(k, [[-23, 3, -14.2], [-23, RACK.y1 + 0.3, -14.2], [-23, RACK.y1 + 0.3, RACK.z0 + 0.4]], 0.12, C.vert, M.tole(), 6);
  gravats(c, S.x1 + 2, S.z1 + 2, 1.0, 10, [C.grille, C.rouille, C.acier]);
  pancarte(c, "atex", -33.6, -16.6, 1.5, 0.75, 0.3, 1.0);
}

// ---------- Les sphères de stockage ----------

function spheres(ctx, niveau) {
  const { b, c, u } = ctx;
  const fin = niveau === "fin";
  const k = fin ? b.couche("sphères de stockage", { x: -54.7, z: 2, l: 26, p: 13 }, 2.4, 14) : c;
  for (const [i, S] of SPHERES.entries()) {
    const yc = 2.6 + S.r;
    const g = new THREE.SphereGeometry(S.r, fin ? 16 : 10, fin ? 10 : 6);
    k.poser(g, M.tole(), 0xd6d2c6, { x: S.x, y: yc, z: S.z });
    g.dispose();
    anneau(k, S.x, S.z, yc, S.r + 0.04, 0.35, 0xc2bdb0, M.tole(), 16);
    for (let q = 0; q < 8; q++) {
      const an = (q / 8) * TAU + PI / 8;
      const lx = S.x + Math.sin(an) * S.r * 0.98;
      const lz = S.z + Math.cos(an) * S.r * 0.98;
      c.tube([lx, 0, lz], [lx, 2.4, lz], 0.25, 0xb8b2a4, M.tole(), 6);
      k.tube([lx, 2.4, lz], [lx, yc, lz], 0.25, 0xb8b2a4, M.tole(), 6);
      c.pave(lx - 0.45, 0, lz - 0.45, lx + 0.45, 0.35, lz + 0.45, C.betonSombre, M.beton());
      if (!fin) continue;
      const an2 = an + TAU / 8;
      const mx = S.x + Math.sin(an2) * S.r * 0.98;
      const mz = S.z + Math.cos(an2) * S.r * 0.98;
      k.poutre([lx, 2.6, lz], [mx, 6.4, mz], 0.06, 0x9a958a, M.tole());
      k.poutre([mx, 2.6, mz], [lx, 6.4, lz], 0.06, 0x9a958a, M.tole());
      b.obstacle(lx - 0.3, lz, lx + 0.3, lz, "pied de sphère");
    }
    if (!fin) continue;
    // Les taches de rouille sur la coque
    for (let q = 0; q < 6; q++) {
      const th = c.hasard() * TAU;
      const ph = c.entre(0.3, 2.2);
      const n = new THREE.Vector3(Math.sin(ph) * Math.sin(th), Math.cos(ph), Math.sin(ph) * Math.cos(th));
      const qn = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
      const e = new THREE.Euler().setFromQuaternion(qn);
      const s = c.entre(0.25, 0.6);
      const geo = new THREE.IcosahedronGeometry(1, 0);
      k.poser(geo, M.tole(), q % 3 ? 0xb08a64 : 0x9a7050, { x: S.x + n.x * S.r, y: yc + n.y * S.r, z: S.z + n.z * S.r, rx: e.x, ry: e.y, rz: e.z, e: [s, 0.05, s * 1.4] }, { crasse: false });
      geo.dispose();
    }
    // L'échelle : droite jusqu'à l'équateur, puis courbe jusqu'au sommet
    const an = 2.3 + i * 0.5;
    const d = [Math.sin(an), Math.cos(an)];
    echelleV(c, S.x + d[0] * (S.r + 0.3), S.z + d[1] * (S.r + 0.3), 0, 2.4, an, C.jaune, false);
    echelleV(k, S.x + d[0] * (S.r + 0.3), S.z + d[1] * (S.r + 0.3), 2.4, yc, an, C.jaune, true);
    const t = [-d[1], d[0]];
    let prec = null;
    for (let q = 0; q <= 8; q++) {
      const th = (q / 8) * 1.35;
      const rr = S.r + 0.3;
      const P = [S.x + d[0] * Math.cos(th) * rr, yc + Math.sin(th) * rr, S.z + d[1] * Math.cos(th) * rr];
      if (prec) for (const s of [-0.22, 0.22]) k.poutre([prec[0] + t[0] * s, prec[1], prec[2] + t[1] * s], [P[0] + t[0] * s, P[1], P[2] + t[1] * s], 0.05, C.jaune, M.tole());
      k.poutre([P[0] - t[0] * 0.22, P[1], P[2] - t[1] * 0.22], [P[0] + t[0] * 0.22, P[1], P[2] + t[1] * 0.22], 0.035, C.jaune, M.tole());
      prec = P;
    }
    // La plate-forme du sommet et ses soupapes
    cylY(k, S.x, S.z, yc + S.r - 0.05, yc + S.r + 0.05, 1.3, 1.3, C.grille, M.tole(), 10);
    anneau(k, S.x, S.z, yc + S.r + 1.0, 1.3, 0.05, C.jaune, M.tole(), 10);
    for (const dx of [-0.4, 0.4]) cylY(k, S.x + dx, S.z, yc + S.r, yc + S.r + 0.7, 0.12, 0.1, PALETTE.laiton, M.metal(), 6);
    // La conduite de soutirage, vers le rack
    tuyau(c, [[S.x, 2.6, S.z], [S.x, 0.5, S.z], [S.x, 0.5, S.z - 5.6], [S.x, 0.5, -5.4]], 0.18, C.jaune, M.tole(), 6);
    tuyau(c, [[S.x, 0.5, -5.4], [S.x, RACK.y1 + 0.3, -5.4], [S.x, RACK.y1 + 0.3, RACK.z1 - 0.4]], 0.18, C.jaune, M.tole(), 6, false);
    cylY(c, S.x + 0.6, S.z, 0.5, 1.4, 0.12, 0.12, C.acierGris, M.tole(), 6);
    c.boite(0.3, 0.3, 0.06, 0xe8e4d6, { x: S.x + 0.6, y: 1.5, z: S.z + 0.12 }, M.mat());
  }
}

// ---------- La torchère ----------

function torchere(ctx, niveau) {
  const { b, c } = ctx;
  const T = TORCHERE;
  const fin = niveau === "fin";
  cylY(c, T.x, T.z, 0, 0.4, 1.4, 1.3, C.betonSombre, M.beton(), 8);
  cylY(c, T.x, T.z, 0.4, T.h, 0.5, 0.38, 0x9a958a, M.tole(), 8, true);
  for (let y = 6; y < T.h; y += 6) anneau(c, T.x, T.z, y, 0.46 - y * 0.002, 0.15, 0x8a5a3a, M.tole(), 8);
  cylY(c, T.x, T.z, T.h, T.h + 1.8, 0.45, 0.6, C.suie, M.tole(), 8, true);
  anneau(c, T.x, T.z, T.h + 1.5, 0.75, 0.6, 0x3a3532, M.tole(), 8);
  // La balise d'obstacle aérien : sur sa petite batterie solaire, elle clignote encore
  ctx.voyants.push([T.x + 0.55, T.h - 0.3, T.z + 0.2, 0.12]);
  b.lumiere(T.x + 0.55, T.h - 0.3, T.z + 0.2, 0xff3a2a, 4, 22, "balise rouge de la torchère (clignote, batterie solaire)");
  if (!fin) return;
  cylY(c, T.x, T.z, T.h - 1.6, T.h - 1.52, 1.4, 1.4, C.grille, M.tole(), 10);
  anneau(c, T.x, T.z, T.h - 0.55, 1.4, 0.05, C.jaune, M.tole(), 10);
  c.boite(0.5, 0.35, 0.1, 0x2f3436, { x: T.x + 1.2, y: T.h - 1.1, z: T.z + 0.3, rx: -0.6 }, M.mat());
  echelleV(c, T.x, T.z + 0.75, 0.4, T.h - 1.5, 0, C.jaune, true, 1.0);
  c.tube([T.x + 0.45, 0.4, T.z - 0.2], [T.x + 0.4, T.h + 1.2, T.z - 0.2], 0.05, PALETTE.laiton, M.tole(), 5);
  // Les haubans
  for (let q = 0; q < 3; q++) {
    const an = (q / 3) * TAU + 0.5;
    const ax = T.x + Math.sin(an) * 15;
    const az = T.z + Math.cos(an) * 15;
    c.pave(ax - 0.5, 0, az - 0.5, ax + 0.5, 0.5, az + 0.5, C.betonSombre, M.beton());
    for (const y of [12, 26]) c.poutre([T.x, y, T.z], [ax, 0.45, az], 0.03, 0x4a4844, M.metal());
  }
  // Le ballon de purge au pied
  cylX(c, T.x + 1.6, T.x + 5.6, 1.3, T.z + 1.5, 0.9, 0x8f948e, M.tole(), 10);
  for (const x of [T.x + 2.2, T.x + 5]) c.pave(x - 0.2, 0, T.z + 0.8, x + 0.2, 0.7, T.z + 2.2, C.betonSombre, M.beton());
  obstacleRect(b, T.x + 1.6, T.z + 0.6, T.x + 5.6, T.z + 2.4, "ballon de purge");
  tuyau(c, [[T.x + 1.6, 1.3, T.z + 1.5], [T.x + 0.6, 1.3, T.z + 1.5], [T.x + 0.4, 1.3, T.z + 0.6]], 0.2, 0x8f948e, M.tole(), 6);
  tache(c, T.x + 0.4, T.z + 1.2, 1.8, 0x2e2b28, 6);
  pancarte(c, "flamme", T.x + 2, T.z + 4, 0.8, 0.8, 0.2, 1.0);
}

// ---------- Le rack de tuyauteries ----------

const TUYAUX = [
  { y: RACK.y1, z: -9.4, r: 0.32, c: C.vert },
  { y: RACK.y1, z: -8.6, r: 0.22, c: C.jaune },
  { y: RACK.y1, z: -7.8, r: 0.42, c: C.alu },
  { y: RACK.y1, z: -7.05, r: 0.18, c: C.bleu, casse: true },
  { y: RACK.y1, z: -6.5, r: 0.15, c: C.rouille },
  { y: RACK.y2, z: -9.2, r: 0.25, c: 0x8d9490 },
  { y: RACK.y2, z: -8.2, r: 0.3, c: 0xa4552f },
  { y: RACK.y2, z: -7.0, r: 0.2, c: C.vert },
];
const CASSURE = [-16, -10];

function rack(ctx, xa, xb, tronçons) {
  const { b, c } = ctx;
  const R = RACK;
  const pas = (xb - xa) / tronçons;
  const couches = [];
  for (let i = 0; i < tronçons; i++) {
    const a = xa + i * pas;
    couches.push({ a, b: a + pas, k: b.couche(`rack de tuyauteries (${i + 1}/${tronçons})`, { x: a + pas / 2, z: (R.z0 + R.z1) / 2, l: pas, p: R.z1 - R.z0 + 1 }, 4.6, 11) });
  }
  const couche = (x) => couches.find((q) => x >= q.a - 0.01 && x <= q.b + 0.01)?.k ?? couches[couches.length - 1].k;
  // Les portiques
  for (let x = R.x0; x <= R.x1 + 0.01; x += 6) {
    if (x < xa - 0.1 || x > xb + 0.1) continue;
    const k = couche(x);
    for (const z of [R.z0, R.z1]) {
      poteauI(c, x, z, 0, R.y2 + 0.3, 0.3, C.acier, PI / 2);
      c.pave(x - 0.3, 0, z - 0.3, x + 0.3, 0.25, z + 0.3, C.betonSombre, M.beton());
      b.obstacle(x - 0.25, z, x + 0.25, z, "poteau du rack");
    }
    for (const y of [R.y1, R.y2]) k.pave(x - 0.15, y - 0.3, R.z0 - 0.2, x + 0.15, y, R.z1 + 0.2, C.acier, M.tole());
    k.poutre([x, R.y1, R.z0], [x, R.y1 + 1.0, R.z0 + 1.0], 0.08, C.acier, M.tole());
  }
  // Les longerons et les tuyaux, tronçon par tronçon
  for (const { a, b: bb, k } of couches) {
    const x1 = Math.max(a, R.x0);
    const x2 = Math.min(bb, R.x1);
    if (x2 <= x1) continue;
    for (const y of [R.y1, R.y2]) for (const z of [R.z0, R.z1]) k.pave(x1, y - 0.25, z - 0.1, x2, y - 0.05, z + 0.1, C.acier, M.tole());
    for (const T of TUYAUX) {
      const morceaux = T.casse && CASSURE[0] < x2 && CASSURE[1] > x1 ? [[x1, Math.max(x1, CASSURE[0])], [Math.min(x2, CASSURE[1]), x2]] : [[x1, x2]];
      for (const [m1, m2] of morceaux) {
        if (m2 - m1 < 0.2) continue;
        cylX(k, m1, m2, T.y + T.r, T.z, T.r, T.c, M.tole(), T.r > 0.3 ? 10 : 8);
        for (let x = Math.ceil(m1 / 12) * 12; x < m2; x += 12) cylX(k, x - 0.05, x + 0.05, T.y + T.r, T.z, T.r * 1.3, T.c, M.tole(), 8);
      }
    }
    // Le chemin de câbles
    k.pave(x1, R.y2 + 0.4, R.z1 - 0.7, x2, R.y2 + 0.5, R.z1 - 0.1, C.acierGris, M.tole());
    k.pave(x1, R.y2 + 0.5, R.z1 - 0.6, x2, R.y2 + 0.62, R.z1 - 0.2, 0x2a2c2a, M.mat());
  }
  // La lyre de dilatation (au-dessus de tout)
  if (xa < -36 && xb > -32) {
    const k = couche(-34);
    tuyau(k, [[-38, R.y2 + 0.3, -8.2], [-38, R.y2 + 3.4, -8.2], [-34, R.y2 + 3.4, -8.2], [-34, R.y2 + 0.3, -8.2]], 0.3, 0xa4552f, M.tole(), 8, false);
  }
  // Le tuyau tombé : il pend du rack jusqu'au sol, et fuit encore
  if (xa < CASSURE[0] && xb > CASSURE[1]) {
    const T = TUYAUX.find((q) => q.casse);
    c.tube([CASSURE[0], T.y + T.r, T.z], [CASSURE[1] - 0.6, 0.22, T.z - 0.5], T.r, T.c, M.tole(), 8);
    c.tube([CASSURE[1] - 0.6, 0.18, T.z - 0.5], [CASSURE[1] + 1.4, 0.18, T.z - 1.2], T.r, T.c, M.tole(), 8);
    cylX(c, CASSURE[0] + 0.1, CASSURE[0] + 0.25, T.y + T.r, T.z, T.r * 1.35, T.c, M.tole(), 8);
    flaqueTeintee(c, -13.5, -7.4, 1.6, 0x6a8a9a);
    tache(c, -13.2, -7.2, 2.4, 0x4a4a3a, 6);
  }
}

// ---------- Les bassins de décantation ----------

function bassins(ctx) {
  const { b, c, u } = ctx;
  // La terre grasse de la lisière (tout pousse ici), puis la terre morte autour de chaque bassin
  plaque(c, -46, 24, 26, 11, 0x5f7f3e, 0.006);
  plaque(c, -66, 4, 6, 26, 0x5f7f3e, 0.006);
  for (const [i, B] of BASSINS.entries()) {
    const R = Math.max(B.l, B.p) / 2 + 4.5;
    plaque(c, B.x, B.z, R, R * 0.85, 0x8c8676, 0.015);
    plaque(c, B.x + 0.8, B.z - 0.5, R * 0.72, R * 0.6, i === 1 ? 0x9a7656 : 0xb3ae9c, 0.022);
    tache(c, B.x, B.z, R * 0.95, i === 1 ? 0xa86a3a : 0xd8d4c4, 7);
    const x0 = B.x - B.l / 2;
    const x1 = B.x + B.l / 2;
    const z0 = B.z - B.p / 2;
    const z1 = B.z + B.p / 2;
    const e = 0.45;
    const h = 0.75;
    for (const [a1, b1, a2, b2] of [[x0 - e, z0 - e, x1 + e, z0], [x0 - e, z1, x1 + e, z1 + e], [x0 - e, z0, x0, z1], [x1, z0, x1 + e, z1]]) c.pave(a1, 0, b1, a2, h, b2, 0xa29d90, M.beton(), { nuance: 0.03 });
    // Le liseré du niveau du liquide, la croûte sur le muret
    c.pave(x0 - e - 0.01, h - 0.02, z1 + e - 0.06, x1 + e + 0.01, h + 0.01, z1 + e + 0.01, B.teinte, M.mat(), { crasse: false });
    obstacleRect(b, x0 - e / 2, z0 - e / 2, x1 + e / 2, z1 + e / 2, "bassin");
    c.pave(x0, 0.02, z0, x1, 0.06, z1, B.fond, M.mat(), { crasse: false });
    c.pave(x0, 0.5, z0, x1, 0.53, z1, B.teinte, M.eau(), { crasse: false, nuance: 0 });
    for (let q = 0; q < 6 + i * 2; q++) c.boite(c.entre(0.4, 1.5), 0.03, c.entre(0.3, 1.0), B.ecume, { x: c.entre(x0 + 0.6, x1 - 0.6), y: 0.54, z: c.entre(z0 + 0.6, z1 - 0.6), ry: c.hasard() * 3 }, M.mat(), { crasse: false, nuance: 0.06 });
    // La conduite d'arrivée, rouillée, qui crache au-dessus du bassin
    const xp = B.x - B.l * 0.25;
    tuyau(c, [[xp, 1.4, z0 - 5], [xp, 1.4, z0 + 0.3], [xp, 1.0, z0 + 0.8]], 0.2, C.rouille, M.tole(), 6);
    for (const zz of [z0 - 4, z0 - 2]) c.pave(xp - 0.2, 0, zz - 0.15, xp + 0.2, 1.2, zz + 0.15, C.betonSombre, M.beton());
    c.boite(0.3, 0.6, 0.02, B.teinte, { x: xp, y: 0.45, z: z0 + 0.02 }, M.mat(), { crasse: false });
    // Le garde-corps rouillé, dont il manque des travées
    const cotes = [[[x0 - 0.2, z1 + 0.2], [x1 + 0.2, z1 + 0.2]], [[x1 + 0.2, z1 + 0.2], [x1 + 0.2, z0 - 0.2]], [[x1 + 0.2, z0 - 0.2], [x0 - 0.2, z0 - 0.2]], [[x0 - 0.2, z0 - 0.2], [x0 - 0.2, z1 + 0.2]]];
    for (const [[ax, az], [bx, bz]] of cotes) {
      const L = Math.hypot(bx - ax, bz - az);
      const n = Math.max(1, Math.round(L / 3));
      for (let q = 0; q < n; q++) {
        if (c.hasard() < 0.2 + 0.3 * u) continue;
        const t1 = q / n;
        const t2 = (q + 1) / n;
        gardeCorps(c, [[ax + (bx - ax) * t1, az + (bz - az) * t1], [ax + (bx - ax) * t2, az + (bz - az) * t2]], h, 0x8a6a4a, 0.9, 3.2);
      }
    }
    // Les arbres morts, la terre où rien ne pousse
    for (let q = 0; q < 2; q++) {
      const an = c.hasard() * TAU;
      const d = R * c.entre(0.75, 0.92);
      arbre(c, B.x + Math.cos(an) * d, B.z + Math.sin(an) * d * 0.85, c.entre(3.5, 5.5), "mort");
    }
    const seches = [];
    for (let q = 0; q < 10; q++) {
      const an = c.hasard() * TAU;
      const d = R * c.entre(0.75, 1.0);
      seches.push([B.x + Math.cos(an) * d, B.z + Math.sin(an) * d * 0.85]);
    }
    touffes(c, seches, 0xa69f86);
  }
  // Le bassin n° 1 luit la nuit : un voile additif vert au ras du liquide
  {
    const B = BASSINS[0];
    c.pave(B.x - B.l / 2 + 0.1, 0.55, B.z - B.p / 2 + 0.1, B.x + B.l / 2 - 0.1, 0.56, B.z + B.p / 2 - 0.1, 0x123d0c, M.lueur(), { crasse: false, nuance: 0 });
    b.lumiere(B.x, 1.2, B.z, 0x8dff5a, 5, 16, "lueur verdâtre du bassin n° 1");
    panneau(c, "graffiti", B.x + 2.5, 0.38, B.z + B.p / 2 + 0.46, 1.5, 0.75);
  }
  {
    const B = BASSINS[1];
    pancarte(c, "baignade", B.x + 2.6, B.z + B.p / 2 + 1.3, 1.6, 0.8, -0.1, 0.9, 0.06);
    fut(c, B.x - 2.2, B.z + 1.2, 0x3f6f9a, { y: 0.1, rx: 0.6, ry: 0.4 });
    fut(c, -46.5, 16.4, 0x3f6f9a, { y: -0.4, rx: 0.35, ry: 1.2, etiquette: "etSoude" });
  }
  {
    const B = BASSINS[2];
    pancarte(c, "tete", B.x - 3, B.z + B.p / 2 + 1.1, 0.75, 0.75, 0.2, 1.0);
    pancarte(c, "nature", B.x - 2.1, B.z + B.p / 2 + 1.25, 0.75, 0.75, 0.25, 1.0, -0.15);
  }
}

// ---------- Les vestiges épars : fûts renversés, taches, douche de sécurité, manche à air ----------

function doucheSecurite(c, x, z, ry) {
  const vert = 0x4f8f5a;
  c.repere({ x, z, ry }, () => {
    c.boite(0.6, 0.1, 0.6, 0x7a7f78, { y: 0.05 }, M.tole());
    c.tube([0, 0, 0], [0, 2.45, 0], 0.05, vert, M.tole(), 6);
    c.tube([0, 2.4, 0], [0, 2.4, 0.55], 0.04, vert, M.tole(), 6);
    cylY(c, 0, 0.55, 2.22, 2.36, 0.2, 0.06, vert, M.tole(), 8);
    c.poutre([0, 2.2, 0.35], [0, 1.55, 0.35], 0.02, vert, M.tole());
    c.poutre([-0.1, 1.55, 0.35], [0.1, 1.55, 0.35], 0.03, vert, M.tole());
    c.tube([0, 1.0, 0], [0, 1.0, 0.38], 0.035, vert, M.tole(), 6);
    cylY(c, 0, 0.42, 0.98, 1.08, 0.08, 0.17, vert, M.tole(), 8, true);
    c.boite(0.34, 0.34, 0.02, vert, { y: 2.0, z: 0.06 }, M.tole());
    c.boite(0.22, 0.06, 0.01, 0xe6e2d8, { y: 2.0, z: 0.075 }, M.mat(), { crasse: false });
    c.boite(0.06, 0.22, 0.01, 0xe6e2d8, { y: 2.0, z: 0.075 }, M.mat(), { crasse: false });
  });
}

function mancheAAir(c, x, z, h = 8) {
  c.tube([x, 0, z], [x, h, z], 0.06, 0xb9bdb6, M.tole(), 6);
  c.pave(x - 0.3, 0, z - 0.3, x + 0.3, 0.3, z + 0.3, C.betonSombre, M.beton());
  c.repere({ x, y: h - 0.2, z, ry: 0.7 }, () => {
    const d = [Math.cos(-0.75), Math.sin(-0.75)];
    const rz = Math.atan2(-d[0], d[1]);
    const g0 = new THREE.CylinderGeometry(0.32, 0.32, 0.05, 8, 1, true);
    c.poser(g0, M.tole(), 0xb9bdb6, { x: 0.05, rz }, { crasse: false });
    g0.dispose();
    const rayon = (k) => 0.32 - k * 0.04;
    for (let q = 0; q < 4; q++) {
      const g = new THREE.CylinderGeometry(rayon(q + 1), rayon(q), 0.48, 8, 1, true);
      const t = 0.27 + q * 0.48;
      c.poser(g, M.toile(), q % 2 ? 0xe6e2d8 : 0xd0783a, { x: 0.05 + d[0] * t, y: d[1] * t, rz }, { crasse: false, nuance: 0.05 });
      g.dispose();
    }
    // Le dernier anneau est parti : il reste des lambeaux
    for (let q = 0; q < 3; q++) c.boite(0.06, 0.55, 0.01, 0xd0783a, { x: 0.05 + d[0] * 2.1 + c.entre(-0.1, 0.1), y: d[1] * 2.1 - 0.3, z: c.entre(-0.12, 0.12), rz: c.entre(-0.3, 0.3) }, M.toile(), { crasse: false });
  });
}

function vestiges(ctx, carte) {
  const { b, c } = ctx;
  mancheAAir(c, 8, -3.2, 8.5);
  if (carte === "installations") {
    doucheSecurite(c, -42, -12.6, PI);
    pancarte(c, "masque", -40.8, -12.6, 0.7, 0.7, 0, 1.2);
    // Les fûts renversés et les taches au bord du chemin
    const futs = [[-36, 7.5, 0x3f6f9a, true, 0.3], [-35.2, 8.4, 0xc9a33a, false, 0], [-37, 6.6, 0x2f3436, true, 1.4], [-36.6, 8.8, 0x8a2f2a, false, 0], [-26.5, 5, 0x3f6f9a, true, 2.2], [3, 8.8, 0xc9a33a, true, 0.9], [2.4, 10, 0x3f6f9a, false, 0]];
    for (const [x, z, coul, couche, ry] of futs) fut(c, x, z, coul, { couche, ry, etiquette: !couche && coul === 0xc9a33a ? "etSolvant" : null });
    tache(c, -36.2, 7.3, 2.0, 0xb07a3a, 7);
    tache(c, -37.5, 6.2, 1.2, 0x5a6a3a, 5);
    tache(c, -26.2, 5.4, 1.1, 0xd8d4c4, 4);
    tache(c, 2.8, 9.4, 1.3, 0x7a6a4a, 5);
    tache(c, -20, -3, 1.6, 0x4a4a3a, 5);
    pancarte(c, "atex", -22.4, -4.6, 1.4, 0.7, 0.1, 1.0, 0.1);
    pancarte(c, "tete", -36, -4.6, 0.75, 0.75, 0, 1.2);
    // Les combinaisons abandonnées au pied du rack : une, pendue à un portique
    c.boite(0.5, 0.06, 1.5, 0xc9a83a, { x: -30.2, y: 0.05, z: -4.8, ry: 0.4 }, M.mat(), { crasse: false });
    combinaison(c, -42, -6.3, 0, 3.6);
  } else {
    doucheSecurite(c, 46.4, -2.6, PI / 2);
    pancarte(c, "atex", 46.6, -5.4, 1.4, 0.7, PI / 2, 1.0);
    fut(c, 46.8, 6, 0x3f6f9a, { couche: true, ry: 0.4 });
    tache(c, 46.4, 6.6, 1.2, 0xd8d4c4, 4);
  }
}

/** Une combinaison de protection pendue (jaune délavé, capuche, bras ballants). */
function combinaison(c, x, z, ry, yAccroche) {
  const j = 0xc9a83a;
  c.repere({ x, z, ry }, () => {
    const y0 = yAccroche;
    c.poutre([0, y0, 0], [0, y0 - 0.25, 0], 0.015, 0x3a3a36, M.metal());
    c.boite(0.42, 0.62, 0.22, j, { y: y0 - 0.6 }, M.toile(), { crasse: false, nuance: 0.05 });
    c.boite(0.26, 0.26, 0.24, j, { y: y0 - 0.2 }, M.toile(), { crasse: false });
    c.boite(0.16, 0.1, 0.02, 0x2a3236, { y: y0 - 0.22, z: 0.12 }, M.mat(), { crasse: false });
    for (const s of [-1, 1]) {
      c.boite(0.13, 0.62, 0.15, j, { x: s * 0.29, y: y0 - 0.62, rz: s * 0.08 }, M.toile(), { crasse: false });
      c.boite(0.16, 0.74, 0.18, j, { x: s * 0.11, y: y0 - 1.26 }, M.toile(), { crasse: false });
      c.boite(0.16, 0.2, 0.22, 0x3a3d3a, { x: s * 0.11, y: y0 - 1.7, z: 0.02 }, M.mat(), { crasse: false });
    }
  });
}

/** Un masque à gaz accroché (deux cartouches). */
function masqueGaz(c, x, y, z, ry) {
  c.repere({ x, y, z, ry }, () => {
    c.boite(0.2, 0.24, 0.12, 0x2f3230, {}, M.mat(), { crasse: false });
    for (const s of [-1, 1]) {
      const g = new THREE.CylinderGeometry(0.05, 0.05, 0.07, 6);
      c.poser(g, M.mat(), 0x6f6a5a, { x: s * 0.1, y: -0.1, z: 0.07, rx: PI / 2 }, { crasse: false });
      g.dispose();
      c.boite(0.05, 0.05, 0.02, 0x7a8a8a, { x: s * 0.05, y: 0.04, z: 0.065 }, M.verre(), { crasse: false });
    }
  });
}

// ---------- Le bâtiment administratif (années 60) ----------

function administratif(ctx, niveau) {
  const { b, c, u } = ctx;
  const A = ADMIN;
  if (niveau === "fond") {
    // Silhouette : le volume, les bandeaux de fenêtres, le toit
    c.pave(A.x0, 0, A.z0, A.x1, A.h2, A.z1, 0xd2ccbc, M.mat());
    for (const y of [1.2, 4.6]) c.pave(A.x0 - 0.02, y, A.z1 - 0.1, A.x1 + 0.02, y + 1.8, A.z1 + 0.02, 0x2f3a3e, M.mat());
    c.pave(A.x0 - 0.2, A.h2, A.z0 - 0.2, A.x1 + 0.2, A.h2 + 0.5, A.z1 + 0.2, 0xc9c3b4, M.mat());
    return;
  }
  const k = b.couche("bâtiment administratif : étage, toit, hauts de murs", { x: (A.x0 + A.x1) / 2, z: 15.3, l: A.x1 - A.x0 + 1, p: 15.4 }, CUT, 11);
  const sp = { h: A.h, ep: 0.3, couleur: 0xe0dac9, mat: M.mat(), interieur: { couleur: 0xd6d0c0, mat: M.mat() } };
  const bris = 0.25 + 0.6 * u;
  const fen = (uu, l = 3.0, bas = 1.2, haut = 3.0) => ({ u: uu, l, bas, haut, type: "fenetre", croisillons: 1, traverses: 1, bris, verre: M.verre(), cadre: 0x4a5652 });
  // Le rez-de-chaussée : sud et est coupés, nord et ouest pleins
  murCoupe(ctx, k, [A.x0, A.z1], [A.x1, A.z1], { ...sp, ouvertures: [{ u: 2, l: 1.1, bas: 0, haut: 2.2, type: "vide" }, fen(5.5, 2.4, 2.0, 2.9), fen(11), fen(14.5), fen(18), { u: 21.5, l: 1.8, bas: 0, haut: 2.4, type: "vide" }, fen(25.5), fen(29), fen(32.5)] });
  murCoupe(ctx, k, [A.x1, A.z1], [A.x1, A.z0], { ...sp, ouvertures: [{ u: 2, l: 1.1, bas: 0, haut: 2.2, type: "vide" }, fen(6), fen(9.6, 2.6)] });
  murCoupe(ctx, c, [A.x1, A.z0], [A.x0, A.z0], { ...sp, interieur: { couleur: 0xd8ddd6, mat: M.carrelage() }, ouvertures: [fen(12.5, 1.2)] });
  murCoupe(ctx, c, [A.x0, A.z0], [A.x0, A.z1], { ...sp, ouvertures: [fen(3, 1.4, 2.0, 2.9)] });
  // Les cloisons (coupées à hauteur d'allège)
  const cl = { h: A.h, ep: 0.15, couleur: 0xd6d1c3, mat: M.mat() };
  murCoupe(ctx, k, [20, A.z0], [20, A.z1], { ...cl, ouvertures: [{ u: 3, l: 1.0, bas: 0, haut: 2.15, type: "vide" }] });
  murCoupe(ctx, k, [32, A.z0], [32, A.z1], { ...cl, ouvertures: [{ u: 9, l: 1.0, bas: 0, haut: 2.15, type: "vide" }] });
  murCoupe(ctx, k, [35, A.z0], [35, A.z1], { ...cl, ouvertures: [{ u: 9, l: 1.0, bas: 0, haut: 2.15, type: "vide" }] });
  murCoupe(ctx, k, [A.x0, 14], [20, 14], { ...cl, ouvertures: [{ u: 5.5, l: 2, bas: 0, haut: 2.2, type: "vide" }] });
  // Les portes : battants tombés ou ouverts
  battant(c, 13.45, A.z1 + 0.15, -1.2, 1.05, 2.1, 0x5f7a73);
  c.boite(0.9, 0.05, 2.1, 0x8a8f88, { x: 33.9, y: 0.08, z: A.z1 + 1.3, ry: 0.15 }, M.tole());
  battant(c, 32.6, A.z1 + 0.15, -0.6, 0.9, 2.3, 0x8a8f88);
  battant(c, A.x1 + 0.15, 18.55, 2.5, 1.0, 2.1, 0x5f7a73);
  // Les sols
  c.pave(A.x0 + 0.15, -0.02, A.z0 + 0.15, 19.93, 0.07, A.z1 - 0.15, 0xb9cfc8, M.carrelage(), { crasse: false });
  c.pave(20.07, -0.02, A.z0 + 0.15, 31.93, 0.07, A.z1 - 0.15, 0xe2e0d8, M.carrelage(), { crasse: false });
  c.pave(32.07, -0.02, A.z0 + 0.15, 34.93, 0.07, A.z1 - 0.15, 0xaaa496, M.mat(), { crasse: false });
  c.pave(35.07, -0.02, A.z0 + 0.15, A.x1 - 0.15, 0.07, A.z1 - 0.15, 0x8b917f, M.mat(), { crasse: false });

  // La façade sud des années 60 : poteaux saillants, allèges émaillées bleu-vert
  for (let x = A.x0 + 0.1; x <= A.x1 - 0.05; x += 3.5) {
    c.pave(x - 0.15, 0, A.z1, x + 0.15, CUT, A.z1 + 0.32, 0xcfc9b9, M.mat());
    k.pave(x - 0.15, CUT, A.z1, x + 0.15, A.h2 + 0.5, A.z1 + 0.32, 0xcfc9b9, M.mat());
  }
  for (const uu of [11, 14.5, 18, 25.5, 29, 32.5]) c.pave(A.x0 + uu - 1.5, 0.25, A.z1 + 0.15, A.x0 + uu + 1.5, CUT - 0.05, A.z1 + 0.19, C.emaille, M.tole(), { crasse: true });
  // La marquise de l'entrée
  k.pave(31.2, 3.0, A.z1, 35.8, 3.18, A.z1 + 2.6, 0xd2ccbc, M.mat());
  for (const x of [31.4, 35.6]) c.poutre([x, 0, A.z1 + 2.4], [x, 3.0, A.z1 + 2.4], 0.1, 0x4a5652, M.tole());

  // L'étage (inaccessible) : plancher, murs à bandeau de fenêtres, stores déchirés
  k.pave(A.x0, A.h - 0.05, A.z0, A.x1, A.h + 0.2, A.z1, 0xbab4a6, M.mat());
  const up = { y0: A.h, h: A.h2 - A.h, ep: 0.3, couleur: 0xe0dac9, mat: M.mat() };
  const fe = (uu, l = 3.0) => ({ u: uu, l, bas: 1.0, haut: 3.0, type: "fenetre", croisillons: 1, traverses: 1, bris, verre: M.verre(), cadre: 0x4a5652 });
  const bande = (L) => {
    const r = [];
    for (let uu = 1.85; uu < L - 1; uu += 3.5) r.push(fe(uu));
    return r;
  };
  mur(k, [A.x0, A.z1], [A.x1, A.z1], { ...up, ouvertures: bande(34), breches: u > 0.6 ? [{ u: 26, l: 4, profondeur: 1.2 }] : [] });
  mur(k, [A.x1, A.z1], [A.x1, A.z0], { ...up, ouvertures: bande(12) });
  mur(k, [A.x1, A.z0], [A.x0, A.z0], { ...up, ouvertures: bande(34) });
  mur(k, [A.x0, A.z0], [A.x0, A.z1], { ...up, ouvertures: bande(12) });
  for (let x = A.x0 + 1.85; x < A.x1 - 1; x += 3.5) {
    k.pave(x - 1.5, A.h + 0.25, A.z1 + 0.15, x + 1.5, A.h + 0.95, A.z1 + 0.19, C.emaille, M.tole());
    if (c.hasard() < 0.4) k.boite(2.8, c.entre(0.6, 1.5), 0.02, 0xd9d2bc, { x, y: A.h + 2.5, z: A.z1 - 0.3, rz: c.entre(-0.08, 0.08) }, M.mat(), { crasse: false });
  }
  // Le toit-terrasse, l'acrotère, l'enseigne, la manche à air… et l'antenne « connectée »
  k.pave(A.x0 - 0.2, A.h2, A.z0 - 0.2, A.x1 + 0.2, A.h2 + 0.25, A.z1 + 0.2, 0x9c998f, M.mat());
  for (const [a1, b1, a2, b2] of [[A.x0 - 0.2, A.z1 - 0.1, A.x1 + 0.2, A.z1 + 0.32], [A.x0 - 0.2, A.z0 - 0.2, A.x1 + 0.2, A.z0 + 0.1], [A.x0 - 0.2, A.z0, A.x0 + 0.1, A.z1], [A.x1 - 0.1, A.z0, A.x1 + 0.2, A.z1]]) k.pave(a1, A.h2 + 0.25, b1, a2, A.h2 + 0.75, b2, 0xcfc9b9, M.mat());
  for (const x of [22, 30, 38]) k.poutre([x, A.h2 + 0.2, A.z1 - 0.6], [x, A.h2 + 2.6, A.z1 - 0.6], 0.12, C.acier, M.tole());
  k.pave(21, A.h2 + 0.75, A.z1 - 0.66, 39, A.h2 + 2.65, A.z1 - 0.6, 0x6f6a60, M.tole());
  panneau(k, "logo", 30, A.h2 + 1.7, A.z1 - 0.57, 7.6, 1.9);
  k.pave(14, A.h2 + 0.25, 9, 17, A.h2 + 2.2, 11.5, 0xb7b3a8, M.tole());
  k.pave(40, A.h2 + 0.25, 10, 43, A.h2 + 1.3, 12, 0xa8a49a, M.tole());
  k.tube([44, A.h2 + 0.25, 10], [44, A.h2 + 5.2, 10], 0.05, 0x8b8f8c, M.tole(), 5);
  {
    const g = new THREE.CylinderGeometry(0.7, 0.08, 0.35, 10, 1, true);
    k.poser(g, M.tole(), 0xd2cdc0, { x: 43.6, y: A.h2 + 1.6, z: 13.5, rx: 0.9, ry: -0.5 });
    g.dispose();
  }
  for (const [x, z, r] of [[25, 12, 2.2], [36, 15, 1.6], [16, 17, 1.4]]) mousse(k, x, A.h2 + 0.25, z, r, 7);

  // --- Les vestiaires de décontamination ---
  // Côté sale (sud) : combinaisons pendues, masques à gaz, banc, bac à combinaisons usées
  c.pave(A.x0 + 0.17, 2.0, 14.6, A.x0 + 0.27, 2.06, 19.6, C.acierGris, M.tole());
  for (const [z, ry] of [[15.2, 0.2], [16.3, -0.1], [17.4, 0.1]]) combinaison(c, A.x0 + 0.5, z, PI / 2 + ry, 2.0);
  for (const z of [18.4, 18.8, 19.2]) masqueGaz(c, A.x0 + 0.27, 1.55, z, PI / 2);
  for (const z of [18.6, 19.0]) masqueGaz(c, A.x0 + 0.27, 1.2, z, PI / 2);
  panneau(c, "vestiaire", A.x0 + 0.17, 2.6, 17, 1.6, 0.8, PI / 2);
  c.pave(15, 0.4, 15.6, 15.4, 0.46, 18.6, PALETTE.bois, M.mat());
  for (const z of [15.8, 18.4]) c.pave(15.05, 0, z - 0.05, 15.35, 0.4, z + 0.05, C.acierGris, M.tole());
  cylY(c, 18.8, 18.9, 0, 0.8, 0.32, 0.36, 0xc9a33a, M.tole(), 8, true);
  c.boite(0.5, 0.3, 0.4, 0xc9a83a, { x: 18.8, y: 0.85, z: 18.9, rx: 0.4 }, M.toile(), { crasse: false });
  c.boite(0.6, 0.05, 1.3, 0xc9a83a, { x: 17.4, y: 0.1, z: 16.5, ry: 0.6 }, M.mat(), { crasse: false });
  // La douche de passage, carrelée, trois pommeaux
  for (const x of [16.4, 18.6]) c.pave(x - 0.06, 0, 13.0, x + 0.06, 2.2, 15.0, 0xc8dad4, M.carrelage());
  c.pave(16.5, 0.07, 13.1, 18.5, 0.09, 14.9, 0xb9cfc8, M.carrelage(), { crasse: false });
  for (const z of [13.4, 14, 14.6]) {
    c.tube([16.45, 2.1, z], [16.8, 2.1, z], 0.025, 0xb9bdb6, M.metal(), 5);
    cylY(c, 16.85, z, 2.0, 2.08, 0.1, 0.05, 0xb9bdb6, M.metal(), 6);
  }
  c.boite(0.25, 0.02, 0.25, 0x3a3d3a, { x: 17.5, y: 0.1, z: 14 }, M.metal(), { crasse: false });
  // Côté propre (nord) : les casiers, dont quelques portes ouvertes, un banc
  for (let i = 0; i < 12; i++) {
    const x = 12.6 + i * 0.55;
    c.pave(x - 0.26, 0, A.z0 + 0.17, x + 0.26, 1.9, A.z0 + 0.62, i % 2 ? 0x7f8f84 : 0x748478, M.tole());
    if (c.hasard() < 0.35) battant(c, x - 0.25, A.z0 + 0.64, -c.entre(0.6, 1.7), 0.5, 1.75, 0x7f8f84);
  }
  b.obstacle(12.3, A.z0 + 0.62, 19.2, A.z0 + 0.62, "casiers");
  c.pave(14, 0.4, 11, 18, 0.46, 11.4, PALETTE.bois, M.mat());
  jonchee(c, 12.5, 8.8, 19.8, 13.8, 14, [0xe8e2d2, 0xc9a83a, 0x6f6a5a], 0.08);

  // --- Le laboratoire de contrôle ---
  // Les paillasses carrelées du mur nord et les trois hottes
  c.pave(20.15, 0, A.z0 + 0.17, 31.85, 0.86, A.z0 + 0.95, 0x5d7a6e, M.tole());
  c.pave(20.12, 0.86, A.z0 + 0.15, 31.88, 0.93, A.z0 + 1.0, 0xe8e6de, M.carrelage(), { crasse: false });
  b.obstacle(20.15, A.z0 + 1, 31.85, A.z0 + 1, "paillasse");
  for (const x of [21.8, 24.8, 30.2]) {
    c.pave(x - 0.85, 0.93, A.z0 + 0.17, x + 0.85, 2.45, A.z0 + 0.25, 0xd8d4c8, M.tole());
    for (const s of [-1, 1]) c.pave(x + s * 0.85 - 0.04, 0.93, A.z0 + 0.17, x + s * 0.85 + 0.04, 2.45, A.z0 + 0.95, 0xd8d4c8, M.tole());
    c.pave(x - 0.85, 2.05, A.z0 + 0.17, x + 0.85, 2.45, A.z0 + 0.95, 0xd8d4c8, M.tole());
    const ouvert = c.entre(0.5, 1.1);
    c.boite(1.62, 0.7, 0.02, 0xffffff, { x, y: 0.93 + ouvert + 0.35, z: A.z0 + 0.95 }, M.verre(), { crasse: false });
    c.tube([x, 2.45, A.z0 + 0.55], [x, A.h, A.z0 + 0.55], 0.16, 0xb9bdb6, M.tole(), 8);
  }
  panneau(c, "ph", 27.5, 1.9, A.z0 + 0.18, 1.6, 0.8);
  // La verrerie : ballons, béchers, erlenmeyers, un réfrigérant de distillation sous la hotte du milieu
  const verres = (x0, x1, y, z0, z1, n) => {
    for (let i = 0; i < n; i++) {
      const x = c.entre(x0, x1);
      const z = c.entre(z0, z1);
      const t = c.hasard();
      if (t < 0.3) {
        const g = new THREE.SphereGeometry(0.08, 6, 4);
        c.poser(g, M.verre(), 0xffffff, { x, y: y + 0.08, z }, { crasse: false, nuance: 0 });
        g.dispose();
        cylY(c, x, z, y + 0.14, y + 0.26, 0.022, 0.022, 0xffffff, M.verre(), 5, true);
      } else if (t < 0.6) {
        cylY(c, x, z, y, y + 0.18, 0.08, 0.025, 0xffffff, M.verre(), 6, true);
      } else {
        cylY(c, x, z, y, y + 0.14, 0.055, 0.055, 0xffffff, M.verre(), 6, true);
      }
      if (c.hasard() < 0.45) cylY(c, x, z, y + 0.005, y + 0.05, 0.05, 0.045, [0x8fc23a, 0xc5782e, 0x3f6fb0, 0xc8362b][Math.floor(c.hasard() * 4)], M.mat(), 6);
    }
  };
  verres(20.5, 31.5, 0.93, A.z0 + 0.4, A.z0 + 0.9, 16);
  c.poutre([24.4, 1.55, A.z0 + 0.6], [25.3, 1.15, A.z0 + 0.6], 0.035, 0xffffff, M.verre());
  c.poutre([24.4, 0.93, A.z0 + 0.5], [24.4, 1.8, A.z0 + 0.5], 0.02, 0x6f736e, M.metal());
  // L'îlot central : paillasse carrelée, étagère à réactifs, évier
  c.pave(23, 0, 13.0, 29.5, 0.86, 14.6, 0x5d7a6e, M.tole());
  c.pave(22.95, 0.86, 12.95, 29.55, 0.93, 14.65, 0xe8e6de, M.carrelage(), { crasse: false });
  obstacleRect(b, 23, 13, 29.5, 14.6, "paillasse centrale");
  for (const x of [23.3, 26.2, 29.2]) c.pave(x - 0.03, 0.93, 13.77, x + 0.03, 1.95, 13.83, 0x8d9490, M.metal());
  for (const y of [1.35, 1.9]) c.pave(23.2, y - 0.02, 13.6, 29.3, y + 0.02, 14.0, 0xd8d4c8, M.tole());
  for (let i = 0; i < 26; i++) {
    const y = i % 2 ? 1.37 : 1.92;
    const x = 23.4 + (i / 26) * 5.7 + c.entre(-0.05, 0.05);
    if (c.hasard() < 0.15) continue;
    const hf = c.entre(0.14, 0.24);
    const teinte = [0x7a4a22, 0x7a4a22, 0xe6e2d8, 0x3f5f8a, 0x2f5a3a][Math.floor(c.hasard() * 5)];
    cylY(c, x, 13.8 + c.entre(-0.08, 0.08), y, y + hf, 0.05, 0.05, teinte, M.mat(), 6);
    c.boite(0.06, 0.05, 0.002, 0xefeadc, { x, y: y + hf * 0.5, z: 14.0 - 0.14 + c.entre(-0.08, 0.08) + 0.055 }, M.mat(), { crasse: false, nuance: 0 });
  }
  verres(23.3, 29, 0.93, 13.1, 13.5, 8);
  c.pave(28.6, 0.8, 14.05, 29.35, 0.95, 14.5, 0x6a6e6a, M.metal());
  c.tube([28.98, 0.93, 14.5], [28.98, 1.3, 14.5], 0.02, 0xb9bdb6, M.metal(), 5);
  c.tube([28.98, 1.3, 14.5], [28.98, 1.25, 14.2], 0.02, 0xb9bdb6, M.metal(), 5);
  // L'armoire forte des produits dangereux : jaune, losange flamme, cadenas
  c.pave(20.12, 0, 16.5, 20.75, 1.95, 18.5, 0xc9a33a, M.tole());
  c.pave(20.75, 0.05, 17.48, 20.78, 1.9, 17.52, 0x5a4a2a, M.tole());
  panneau(c, "flamme", 20.8, 1.45, 17.0, 0.5, 0.5, PI / 2);
  panneau(c, "corrosif", 20.8, 1.45, 18.0, 0.5, 0.5, PI / 2);
  c.boite(0.04, 0.12, 0.08, PALETTE.laiton, { x: 20.82, y: 1.0, z: 17.5 }, M.metal(), { crasse: false });
  obstacleRect(b, 20.12, 16.5, 20.75, 18.5, "armoire forte");
  // La paillasse sous les fenêtres : balance, pH-mètre
  c.pave(23.5, 0, A.z1 - 0.95, 31.5, 0.86, A.z1 - 0.17, 0x5d7a6e, M.tole());
  c.pave(23.45, 0.86, A.z1 - 1.0, 31.55, 0.93, A.z1 - 0.15, 0xe8e6de, M.carrelage(), { crasse: false });
  b.obstacle(23.5, A.z1 - 1, 31.5, A.z1 - 1, "paillasse");
  c.boite(0.4, 0.15, 0.35, 0xd8d4c8, { x: 29.5, y: 1.0, z: 19.4 }, M.tole());
  c.boite(0.25, 0.25, 0.25, 0xffffff, { x: 29.5, y: 1.2, z: 19.4 }, M.verre(), { crasse: false });
  c.boite(0.3, 0.12, 0.2, 0x3f4440, { x: 27.6, y: 1.0, z: 19.4 }, M.mat());
  verres(24, 31, 0.93, A.z1 - 0.8, A.z1 - 0.35, 8);
  // Les flacons brisés au sol, la flaque, les rais du soleil par les fenêtres
  debris(c, 24.5, 10.5, 28, 12.5, 26, [0xd8e6e2, 0xbfd0cc, 0x7a4a22]);
  flaqueTeintee(c, 26, 11.4, 0.9, 0xc5c87a, 0.09);
  for (const x of [25.5, 29.5]) rai(c, [x + 1.4, 3.4, A.z1 + 2.2], [x, 0.08, 15.4], 1.6, 0.2, 0xffffff);
  c.repere({ x: 25, z: 15.6, ry: 1.2 }, () => {
    c.boite(0.42, 0.06, 0.42, 0x4a5652, { y: 0.2, rz: 1.4 }, M.mat());
    c.poutre([0, 0.2, 0], [0, 0.6, 0.4], 0.04, 0x8d9490, M.metal());
  });

  // --- Le hall ---
  panneau(c, "lessive", 33.5, 2.0, A.z0 + 0.18, 2.4, 1.2);
  c.pave(32.4, 0, 12.6, 34.6, 1.05, 13.2, 0x8a7a64, M.mat());
  c.boite(0.5, 1.4, 0.4, 0xe6e2d8, { x: 34.2, y: 0.7, z: 18.4, rz: 0.12 }, M.tole());
  c.boite(0.36, 0.5, 0.02, 0x4a7a9a, { x: 34.25, y: 1.15, z: 18.61, rz: 0.12 }, M.mat(), { crasse: false });
  // La borne d'accueil connectée luit encore, sur sa batterie : « Bienvenue ! Votre badge a expiré. »
  b.lumiere(34.2, 1.3, 18.1, 0x7ab8ff, 1.2, 4, "écran de la borne d'accueil connectée (« Bienvenue ! Votre badge a expiré. »)");
  jonchee(c, 32.3, 9, 34.8, 19.6, 14, [0xe8e2d2, 0xd9d2c0, 0x9c7a45], 0.08);

  // --- La salle de contrôle ---
  c.pave(36.0, 0.5, A.z0 + 0.17, 45.1, 3.3, A.z0 + 0.3, 0x3d5048, M.tole());
  panneau(c, "synoptique", 40.55, 1.92, A.z0 + 0.31, 7.4, 2.75);
  for (let i = 0; i < 7; i++) {
    const x = 37.5 + i * 1.02;
    c.pave(x - 0.5, 0, 11.1, x + 0.5, 0.78, 11.9, 0x5a6a62, M.tole());
    c.pave(x - 0.5, 0.78, 11.1, x + 0.5, 1.3, 11.3, 0x4f5e56, M.tole());
    c.boite(0.36, 0.28, 0.02, 0x1e2426, { x: x - 0.18, y: 1.08, z: 11.31 }, M.mat(), { crasse: false });
    panneau(c, "pupitre", x, 0.88, 11.62, 0.96, 0.5, 0, -PI / 2 + 0.45);
  }
  b.obstacle(37, 11.1, 44.6, 11.1, "pupitres");
  b.obstacle(37, 11.9, 44.6, 11.9, "pupitres");
  // L'alarme figée : un voyant clignote encore sur le pupitre du milieu, le gyrophare s'est arrêté
  ctx.voyants.push([40.6, 0.98, 11.75, 0.05]);
  b.lumiere(40.6, 1.3, 12, 0xff3a2a, 3, 7, "voyant d'alarme rouge du pupitre (clignote encore)");
  cylY(c, 45.3, A.z0 + 0.4, 3.0, 3.3, 0.12, 0.1, 0xc8362b, M.mat(), 8);
  c.pave(45.15, 2.9, A.z0 + 0.17, 45.45, 3.0, A.z0 + 0.6, 0x3a3d3a, M.tole());
  // Les fauteuils, dont un renversé
  for (const [x, z, tombe] of [[38.3, 12.8, false], [40.8, 13.1, false], [43.3, 12.6, true]]) {
    c.repere({ x, z, ry: c.entre(-0.8, 0.8) }, () => {
      if (tombe) {
        c.boite(0.5, 0.5, 0.08, 0x6a5a48, { y: 0.27 }, M.mat());
        c.boite(0.5, 0.08, 0.5, 0x6a5a48, { y: 0.27, z: 0.3 }, M.mat());
        return;
      }
      c.boite(0.6, 0.04, 0.08, 0x3d4a52, { y: 0.06 }, M.metal());
      c.boite(0.08, 0.04, 0.6, 0x3d4a52, { y: 0.06 }, M.metal());
      c.poutre([0, 0.06, 0], [0, 0.45, 0], 0.05, 0x3d4a52, M.metal());
      c.boite(0.5, 0.08, 0.5, 0x6a5a48, { y: 0.48 }, M.mat());
      c.boite(0.46, 0.55, 0.07, 0x6a5a48, { y: 0.8, z: 0.24, rx: 0.12 }, M.mat());
    });
  }
  // L'étagère des classeurs, l'armoire de l'alarme et sa batterie
  c.pave(35.25, 0, 9.0, 35.65, 2.1, 12.2, C.acierGris, M.tole());
  const tons = [0xb08a45, 0x3f6f70, 0xd9cfb6, 0x6d716c, 0x8a4a3a];
  for (const y of [0.1, 0.65, 1.2, 1.75]) for (let z = 9.15; z < 12.1; z += c.entre(0.08, 0.13)) if (c.hasard() > 0.2) c.boite(0.27, 0.31, 0.07, tons[Math.floor(c.hasard() * tons.length)], { x: 35.6, y: y + 0.18, z }, M.mat(), { nuance: 0.08, crasse: false });
  obstacleRect(b, 35.25, 9, 35.65, 12.2, "étagère");
  c.pave(44.9, 0, 9.0, 45.83, 1.9, 10.2, 0x7a7f7a, M.tole());
  battant(c, 44.9, 10.2, 2.2, 1.1, 1.8, 0x7a7f7a);
  for (let j = 0; j < 3; j++) c.boite(0.35, 0.28, 0.5, 0x2f3436, { x: 45.4, y: 0.3 + j * 0.55, z: 9.6 }, M.mat());
  obstacleRect(b, 44.9, 9, 45.83, 10.2, "armoire de l'alarme");
  jonchee(c, 36, 12, 45.5, 19.5, 40, [0xe8e2d2, 0xd9d2c0, 0xc9c0aa], 0.08);
  for (const [x, z] of [[38.1, 11.5], [42.2, 11.6]]) cylY(c, x, z, 0.78, 0.88, 0.04, 0.045, 0xe6e2d8, M.mat(), 6);

  // Dehors : le lierre sur les murs nord et ouest, les gravats
  lierre(c, A.x0 - 0.17, 0, 12.5, -PI / 2, 5, 3.2, 50);
  lierre(c, 26, 0, A.z0 - 0.17, PI, 6, 3.2, 50);
  if (u > 0.5) gravats(c, 38.2, A.z1 + 1.3, 1.1, 10, [C.beton, 0xd2ccbc, C.emaille]);
}

// ---------- L'atelier de conditionnement ----------

function atelier(ctx, niveau) {
  const { b, c, u } = ctx;
  const A = ATELIER;
  if (niveau === "fond") {
    c.pave(A.x0, 0, A.z0, A.x1, A.h, A.z1, C.bardage, M.bardage());
    for (let i = 0; i < 4; i++) {
      const zn = A.z0 + i * 7;
      triangle2(c, M.bardage(), C.bardage, [[A.x0, A.h, zn], [A.x0, A.h + 2.2, zn], [A.x0, A.h, zn + 7]]);
      c.boite(A.x1 - A.x0, 0.08, 7.34, 0x8d928c, { x: (A.x0 + A.x1) / 2, y: A.h + 1.1, z: zn + 3.5, rx: 0.3045 }, M.bardage());
    }
    return;
  }
  const k = b.couche("atelier de conditionnement : sheds et hauts de murs", { x: (A.x0 + A.x1) / 2, z: (A.z0 + A.z1) / 2, l: A.x1 - A.x0 + 1, p: A.z1 - A.z0 + 1 }, CUT, 10);
  const sp = { h: A.h, ep: 0.3, couleur: C.bardage, mat: M.bardage(), couleurBas: C.beton, matBas: M.beton() };
  const fh = (uu, l) => ({ u: uu, l, bas: 3.6, haut: 4.6, type: "fenetre", croisillons: Math.round(l), traverses: 1, bris: 0.4 + 0.5 * u, verre: M.verre(), cadre: 0x56625e, appui: false });
  murCoupe(ctx, k, [A.x0, A.z1], [A.x1, A.z1], { ...sp, ouvertures: [{ u: 8, l: 5, bas: 0, haut: 4.6, type: "vide" }, fh(2.6, 3), fh(13.4, 3)] });
  murCoupe(ctx, k, [A.x1, A.z1], [A.x1, A.z0], { ...sp, ouvertures: [{ u: 20, l: 3.6, bas: 0, haut: 4.0, type: "vide" }, fh(6, 6), fh(13, 4), fh(25, 3)] });
  murCoupe(ctx, c, [A.x1, A.z0], [A.x0, A.z0], { ...sp, ouvertures: [fh(4, 4), fh(12, 4)] });
  murCoupe(ctx, c, [A.x0, A.z0], [A.x0, A.z1], { ...sp, ouvertures: [{ u: 6, l: 4.4, bas: 4.8, haut: 7, type: "vide" }, { u: 18, l: 1.2, bas: 0, haut: 2.2, type: "vide" }, fh(11.5, 4), fh(24, 4)] });
  c.pave(A.x0 + 0.15, -0.02, A.z0 + 0.15, A.x1 - 0.15, 0.06, A.z1 - 0.15, 0xa09c92, M.dalle(), { crasse: false });
  // Les lignes jaunes des allées
  for (const x of [51.6, 54.4]) c.pave(x - 0.05, 0.06, A.z0 + 1, x + 0.05, 0.07, A.z1 - 1, 0xc9a83a, M.mat(), { crasse: false });
  battant(c, A.x0 - 0.12, 4.6, PI - 0.9, 1.15, 2.1, 0x6a7a74);
  // Le rideau sud à demi levé, le quai est ouvert
  for (let y = 2.5; y < 4.6; y += 0.16) k.boite(5, 0.14, 0.05, 0x8a8f88, { x: 56, y, z: A.z1 + 0.1, rx: y < 2.7 ? 0.35 : 0 }, M.tole(), { nuance: 0.05 });
  cylX(k, 53.4, 58.6, 4.9, A.z1 + 0.25, 0.32, 0x6f736e, M.tole(), 8);
  cylZ(k, -7.9, -4.1, 4.3, A.x1 + 0.25, 0.32, 0x6f736e, M.tole(), 8);
  c.pave(A.x1 + 0.15, 0, -8.2, A.x1 + 2.6, 1.1, -3.8, C.betonSombre, M.beton());
  obstacleRect(b, A.x1 + 0.15, -8.2, A.x1 + 2.6, -3.8, "quai");
  // Les sheds : pans de bardage vers le sud, vitrages au nord (inaccessibles, ils s'effacent)
  const zs = [0, 1, 2, 3].map((i) => A.z0 + i * 7);
  for (const [i, zn] of zs.entries()) {
    for (const x of [A.x0, A.x1]) triangle2(k, M.bardage(), C.bardage, [[x, A.h, zn], [x, A.h + 2.2, zn], [x, A.h, zn + 7]]);
    k.pave(A.x0, A.h - 0.35, zn - 0.12, A.x1, A.h + 0.05, zn + 0.12, C.acier, M.tole());
    k.pave(A.x0 - 0.1, A.h + 2.1, zn - 0.08, A.x1 + 0.1, A.h + 2.3, zn + 0.25, 0x4f5550, M.tole());
    k.boite(A.x1 - A.x0, 2.1, 0.03, 0xffffff, { x: (A.x0 + A.x1) / 2, y: A.h + 1.1, z: zn }, M.verre(), { crasse: false });
    for (let x = A.x0 + 1; x < A.x1; x += 1.6) k.pave(x - 0.03, A.h, zn - 0.04, x + 0.03, A.h + 2.2, zn + 0.04, 0x4a5652, M.tole());
    for (let j = 0; j < 8; j++) {
      const x = A.x0 + 1 + j * 2;
      if ((i === 1 && j === 3) || (i === 2 && j === 6) || c.hasard() < 0.08 * u) {
        rai(c, [x + 1.2, A.h + 0.8, zn + 3.6], [x - 0.4, 0.07, zn + 5.2], 1.7, 0.2, 0xffffff);
        continue;
      }
      k.boite(2.02, 0.08, 7.34, 0x8d928c, { x, y: A.h + 1.1, z: zn + 3.5, rx: 0.3045 }, M.bardage(), { crasse: false });
    }
  }
  for (let x = A.x0 + 4; x < A.x1; x += 4) for (const zn of zs) k.poutre([x, A.h - 0.3, zn], [x, A.h + 2.1, zn + 0.1], 0.1, C.acier, M.tole());
  mousse(k, 58, A.h + 1.2, 1, 1.6, 6);
  // Les tuyaux du rack entrent par le mur ouest et descendent vers la tireuse
  tuyau(k, [[A.x0, RACK.y1 + 0.35, -8.6], [52.6, RACK.y1 + 0.35, -8.6], [52.6, 3.2, -8.6], [53, 2.6, -6.6]], 0.2, C.jaune, M.tole(), 6);
  tuyau(k, [[A.x0, RACK.y1 + 0.45, -7.8], [50, RACK.y1 + 0.45, -7.8], [50, RACK.y1 + 0.45, -10.6], [50, 4.3, -11.4]], 0.3, C.alu, M.tole(), 8);

  // --- La chaîne d'embouteillage ---
  const X = 53;
  c.pave(X - 0.32, 0.82, -11, X + 0.32, 0.9, 9, 0x2f3230, M.mat());
  for (const s of [-1, 1]) c.pave(X + s * 0.34 - 0.03, 0.82, -11, X + s * 0.34 + 0.03, 1.0, 9, 0xb9bdb6, M.metal());
  for (let z = -10.5; z < 9; z += 2) for (const s of [-1, 1]) c.pave(X + s * 0.3 - 0.03, 0, z - 0.03, X + s * 0.3 + 0.03, 0.82, z + 0.03, 0x8d9490, M.metal());
  b.obstacle(X - 0.35, -11, X - 0.35, 9, "convoyeur");
  b.obstacle(X + 0.35, -11, X + 0.35, 9, "convoyeur");
  const bouteille = (x, y, z, couche = false) => {
    if (couche) {
      const g = new THREE.CylinderGeometry(0.07, 0.07, 0.28, 6);
      c.poser(g, M.mat(), 0x6f9a5a, { x, y: y + 0.07, z, rz: PI / 2, ry: c.hasard() * 3 }, { crasse: false });
      g.dispose();
      return;
    }
    cylY(c, x, z, y, y + 0.26, 0.07, 0.07, 0x6f9a5a, M.mat(), 6);
    cylY(c, x, z, y + 0.26, y + 0.32, 0.03, 0.03, 0xe6e2d8, M.mat(), 5);
  };
  for (let z = -10.6; z < 8.6; z += 0.5) if (c.hasard() > 0.3) bouteille(X + c.entre(-0.1, 0.1), 0.9, z, c.hasard() < 0.15);
  for (let i = 0; i < 12; i++) bouteille(X + c.entre(-2, 2.5), 0.06, c.entre(-9, 8), true);
  // La tireuse rotative
  c.pave(X - 0.9, 0, -7, X + 0.9, 0.9, -5.2, 0xb9bdb6, M.metal());
  cylY(c, X, -6.1, 0.9, 1.1, 0.85, 0.85, 0xb9bdb6, M.metal(), 12);
  cylY(c, X, -6.1, 1.1, 2.1, 0.12, 0.12, 0x8d9490, M.metal(), 6);
  cylY(c, X, -6.1, 2.1, 2.6, 0.5, 0.55, 0xb9bdb6, M.metal(), 10);
  for (let q = 0; q < 10; q++) {
    const an = (q / 10) * TAU;
    c.tube([X + Math.cos(an) * 0.45, 2.1, -6.1 + Math.sin(an) * 0.45], [X + Math.cos(an) * 0.7, 1.25, -6.1 + Math.sin(an) * 0.7], 0.02, 0x8d9490, M.metal(), 4);
  }
  for (const [dx, dz, l, ry] of [[-1.0, 0, 1.8, PI / 2], [1.0, 0, 1.8, PI / 2], [0, -1.0, 2.0, 0]]) c.boite(l, 1.2, 0.02, 0xffffff, { x: X + dx, y: 1.5, z: -6.1 + dz, ry }, M.verre(), { crasse: false });
  obstacleRect(b, X - 1, -7.1, X + 1, -5.1, "tireuse");
  // La boucheuse, l'étiqueteuse, le tunnel de rétraction, l'armoire de commande
  c.pave(X - 0.7, 0, -1.6, X + 0.7, 1.4, -0.4, 0x5f7f6a, M.tole());
  c.pave(X - 0.2, 1.4, -1.2, X + 0.2, 2.0, -0.8, 0x5f7f6a, M.tole());
  c.pave(X + 0.4, 0, 2.2, X + 1.3, 1.5, 3.6, 0xd8d4c8, M.tole());
  cylY(c, X + 0.85, 2.9, 1.5, 1.75, 0.3, 0.3, 0x8fbf5a, M.mat(), 10);
  c.pave(X - 0.7, 0.5, 6.6, X + 0.7, 1.7, 8.4, 0x6f736e, M.tole());
  for (let i = 0; i < 5; i++) c.boite(0.22, 0.6, 0.01, 0x1e1e1c, { x: X - 0.44 + i * 0.22, y: 1.2, z: 6.58 }, M.toile(), { crasse: false });
  obstacleRect(b, X - 0.7, -1.6, X + 1.3, 3.6, "machines");
  c.pave(50.6, 0, -3.6, 51.4, 1.9, -2.4, 0x8d918c, M.tole());
  c.boite(0.02, 0.5, 0.6, 0x2f3436, { x: 51.41, y: 1.3, z: -3 }, M.mat(), { crasse: false });
  c.boite(0.04, 0.12, 0.12, 0xc8362b, { x: 51.43, y: 1.0, z: -3 }, M.mat(), { crasse: false });
  // La flaque de nettoyant concentré
  flaqueTeintee(c, 55.5, -3, 1.5, 0x5f7f3f, 0.08);
  tache(c, 55.8, -2.8, 2.0, 0x8fa86a, 5);

  // --- Les bidons empilés, les palettes de Nettoyant Universel, le chariot renversé ---
  for (const [px, pz, couches] of [[61.5, -1.5, 3], [61.5, 0.4, 2], [61.5, 2.3, 3], [59.6, 2.3, 1]]) {
    palette(c, px, pz, 0);
    for (let n = 0; n < couches; n++) for (let i = 0; i < 12; i++) bidon(c, px - 0.42 + (i % 4) * 0.28, 0.15 + n * 0.42, pz - 0.33 + Math.floor(i / 4) * 0.33, n % 2 ? 0x8fbf5a : 0xe6e4da, 0);
    obstacleRect(b, px - 0.6, pz - 0.5, px + 0.6, pz + 0.5, "palette");
  }
  for (const [px, pz, hh, tombe] of [[60.5, -8, 1.6, false], [62, -8, 1.2, false], [60.5, -6.2, 1.4, false], [58.5, -10.5, 0.9, true]]) {
    palette(c, px, pz, tombe ? 0.4 : 0);
    if (tombe) {
      for (let i = 0; i < 7; i++) c.boite(0.5, 0.35, 0.4, 0xc9b48a, { x: px + c.entre(-1, 1.2), y: 0.18 + (i > 4 ? 0.35 : 0), z: pz + c.entre(-0.8, 0.8), ry: c.hasard() * 3, rz: c.entre(-0.3, 0.3) }, M.mat(), { nuance: 0.05 });
      continue;
    }
    c.boite(1.16, hh, 0.96, 0xc9b48a, { x: px, y: 0.15 + hh / 2, z: pz }, M.mat(), { nuance: 0.03 });
    c.boite(1.18, hh * 0.85, 0.98, 0xe8eef0, { x: px, y: 0.15 + hh * 0.45, z: pz }, M.verre(), { crasse: false });
    panneau(c, "etGrandAir", px, 0.15 + hh * 0.6, pz + 0.5, 0.6, 0.3);
    obstacleRect(b, px - 0.6, pz - 0.5, px + 0.6, pz + 0.5, "palette");
  }
  // Le chariot élévateur, couché sur le flanc
  c.repere({ x: 61.5, z: -11.6, ry: 0.3 }, () => {
    c.boite(1.2, 2.3, 1.1, 0xc9a33a, { x: 0, y: 0.55, z: 0, rz: PI / 2 }, M.tole());
    c.boite(0.12, 2.6, 0.9, 0x3a3d3a, { x: 0.3, y: 0.2, z: 1.3, rx: PI / 2 }, M.tole());
    for (const s of [-0.3, 0.3]) c.boite(0.1, 0.04, 1.1, 0x3a3d3a, { x: s, y: 0.06, z: 2.2 }, M.tole());
    c.poutre([-0.5, 1.15, -0.6], [0.5, 1.15, 0.5], 0.06, 0x3a3d3a, M.tole());
    for (const [dx, dz] of [[-0.5, -0.7], [-0.5, 0.7]]) {
      const g = new THREE.CylinderGeometry(0.32, 0.32, 0.25, 8);
      c.poser(g, M.mat(), 0x262626, { x: dx, y: 1.1, z: dz });
      g.dispose();
    }
  });
  obstacleRect(b, 60.4, -12.8, 62.6, -9.6, "chariot élévateur");
  // Les capsules LessiConnect : la trémie, la cascade de capsules, le distributeur « connecté »
  c.pave(56.9, 0, 10.1, 58.1, 1.2, 11.3, 0xb9bdb6, M.metal());
  cylY(c, 57.5, 10.7, 1.2, 1.9, 0.3, 0.75, 0xb9bdb6, M.metal(), 8, true);
  for (let i = 0; i < 46; i++) {
    const an = c.hasard() * TAU;
    const d = Math.sqrt(c.hasard()) * 1.6;
    const g = new THREE.IcosahedronGeometry(0.06, 0);
    c.poser(g, M.mat(), [0x3f7fbf, 0xd9a03a, 0xe8eef0][i % 3], { x: 57.2 + Math.cos(an) * d, y: 0.08, z: 9.6 + Math.sin(an) * d * 0.7, e: [1.2, 0.7, 1] }, { crasse: false, nuance: 0.05 });
    g.dispose();
  }
  obstacleRect(b, 56.9, 10.1, 58.1, 11.3, "trémie");
  c.pave(58.5, 0, 12.9, 59.3, 1.5, 13.7, 0xe6e2d8, M.tole());
  c.boite(0.5, 0.35, 0.02, 0x1e2426, { x: 58.9, y: 1.15, z: 12.88 }, M.mat(), { crasse: false });
  ctx.led = [58.9, 0.75, 12.86];
  b.lumiere(58.9, 1.0, 12.4, 0x4aa8ff, 1.6, 5, "voyant bleu du distributeur LessiConnect (« commande en attente »)");
  // Le rayonnage du mur nord : cartons, bidons, palettes vides
  {
    const z0 = A.z0 + 0.3;
    const z1 = z0 + 1.0;
    for (let x = 54.5; x <= 63.6; x += 3) for (const z of [z0, z1]) c.poutre([x, 0, z], [x, 3.6, z], 0.08, 0xb0683a, M.tole());
    for (const y of [1.6, 3.1]) for (const z of [z0, z1]) c.pave(54.5, y - 0.06, z - 0.04, 63.5, y + 0.06, z + 0.04, 0x4f6f8f, M.tole());
    for (let i = 0; i < 3; i++)
      for (const y of [0, 1.66]) {
        const xm = 56 + i * 3;
        if (c.hasard() < 0.2) continue;
        palette(c, xm, (z0 + z1) / 2, 0, y);
        const hh = c.entre(0.6, 1.2);
        c.boite(1.1, hh, 0.9, 0xc9b48a, { x: xm, y: y + 0.15 + hh / 2, z: (z0 + z1) / 2 }, M.mat(), { nuance: 0.05 });
      }
    obstacleRect(b, 54.5, z0 - 0.1, 63.5, z1 + 0.1, "rayonnage");
    for (let i = 0; i < 6; i++) palette(c, 62.9, 6.2, 0.05 * i, i * 0.14);
  }
  // Les cuves de mélange, leur agitateur, la passerelle (inaccessible) qui les dessert
  for (const [x, z] of [[50, -11.4], [50, -4.6]]) {
    cylY(c, x, z, 0, 3.4, 0.9, 0.9, 0xd8d4c8, M.tole(), 12);
    dome(c, x, z, 3.4, 0.9, 0.35, 0xc9c6bc, M.tole(), 12);
    cylY(c, x, z, 3.7, 4.2, 0.25, 0.25, 0x5f7f6a, M.tole(), 8);
    for (const a2 of [0.8, 2.4, 4.0, 5.6]) c.poutre([x + Math.cos(a2) * 0.85, 0, z + Math.sin(a2) * 0.85], [x + Math.cos(a2) * 0.85, 0.6, z + Math.sin(a2) * 0.85], 0.08, C.acier, M.tole());
    coulures(c, x, z, 0.9, 0.6, 3.4, 4, 0x6f8a4a);
    obstacleRect(b, x - 0.95, z - 0.95, x + 0.95, z + 0.95, "cuve de mélange");
  }
  k.pave(48.3, 4.0, -12.6, 51.6, 4.06, -3.4, C.grille, M.tole());
  gardeCorps(k, [[51.6, -12.6], [51.6, -3.4]], 4.06, C.jaune);
  // Les réclames
  panneau(c, "nettoyant", 56, 3.2, A.z0 + 0.17, 5, 2.5);
  panneau(c, "lessive", A.x0 + 0.17, 2.6, -1.2, 3.6, 1.8, PI / 2);
  jonchee(c, A.x0 + 0.5, A.z0 + 0.5, A.x1 - 0.5, A.z1 - 0.5, 30, [0xc9b48a, 0xe8e2d2, 0x8fbf5a], 0.07);
  debris(c, A.x0 + 1, A.z0 + 1, A.x1 - 1, A.z1 - 1, 20, [0x9aa09a, 0xd8d2c4, 0x6f6a60]);
  if (u > 0.5) gravats(c, 51, 10.5, 1.0, 8, [0x9aa09a, C.rouille, C.beton]);
  lierre(c, A.x0 - 0.17, 0, -3, -PI / 2, 5, 4, 40);
}

// ---------- La cour : le camion-citerne, l'épave, le totem ----------

function cour(ctx) {
  const { b, c, u } = ctx;
  // Le camion-citerne, cabine à l'est
  const x = 27;
  const z = 2.4;
  c.pave(x - 5, 0.55, z - 0.85, x + 4.4, 0.85, z + 0.85, 0x3a3a36, M.tole());
  c.pave(x + 2.4, 0.85, z - 1.15, x + 4.6, 2.9, z + 1.15, 0x6f8a86, M.tole());
  c.pave(x + 4.55, 1.9, z - 1.0, x + 4.63, 2.7, z + 1.0, 0x2a3236, M.verre(), { crasse: false });
  for (const s of [-1, 1]) c.pave(x + 3.4, 1.9, z + s * 1.15 - 0.02, x + 4.4, 2.6, z + s * 1.15 + 0.02, 0x2a3236, M.verre(), { crasse: false });
  c.pave(x + 4.5, 0.6, z - 1.15, x + 4.7, 1.0, z + 1.15, 0x8d9490, M.metal());
  cylX(c, x - 4.8, x + 2.2, 2.05, z, 1.15, 0xc9c6bc, M.tole(), 12);
  for (const xx of [x - 4.8, x + 2.2]) {
    const g = new THREE.SphereGeometry(1.15, 12, 4, 0, TAU, 0, PI / 2);
    c.poser(g, M.tole(), 0xc0bdb2, { x: xx, y: 2.05, z, rz: xx < x ? PI / 2 : -PI / 2, e: [1, 0.25, 1] });
    g.dispose();
  }
  for (const xx of [x - 3, x - 0.6, x + 1.6]) {
    const g = new THREE.CylinderGeometry(1.19, 1.19, 0.12, 12, 1, true);
    c.poser(g, M.tole(), 0x9a958a, { x: xx, y: 2.05, z, rz: PI / 2 }, { crasse: false });
    g.dispose();
  }
  c.pave(x - 4.4, 3.2, z - 0.3, x + 1.8, 3.25, z + 0.3, C.grille, M.tole());
  for (const xx of [x - 3, x - 0.4]) cylY(c, xx, z, 3.1, 3.35, 0.3, 0.3, 0x9a958a, M.tole(), 8);
  for (const xx of [x - 4, x - 2.8, x + 3.4])
    for (const s of [-1, 1]) {
      const g = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 8);
      c.poser(g, M.mat(), 0x262626, { x: xx, y: xx > x ? 0.5 : 0.42, z: z + s * 1.0, rx: PI / 2 + (xx < x - 3 ? 0.15 : 0) });
      g.dispose();
    }
  for (let i = 0; i < 6; i++) {
    const xx = x - 4.5 + c.hasard() * 6.5;
    c.boite(c.entre(0.08, 0.2), c.entre(0.4, 1.0), 0.02, 0x8a4a2a, { x: xx, y: 1.6, z: z + 1.16 }, M.tole(), { crasse: false, nuance: 0.12 });
  }
  tuyau(c, [[x - 5.0, 1.0, z], [x - 5.6, 0.6, z + 0.4]], 0.08, C.acierGris, M.tole(), 6);
  flaqueTeintee(c, x - 4.4, z + 0.8, 1.8, 0xe6e2d4, 0.03);
  tache(c, x - 4.6, z + 1.0, 2.4, 0xd8d4c4, 6);
  obstacleRect(b, x - 5.1, z - 1.2, x + 4.7, z + 1.2, "camion-citerne");
  // L'épave d'une voiture de service, sur cales
  c.repere({ x: 17.5, z: 3.4, ry: 0.25 }, () => {
    c.boite(4, 0.7, 1.7, 0x5f7a8e, { y: 0.65 }, M.tole());
    c.boite(2.2, 0.6, 1.5, 0x5f7a8e, { x: -0.3, y: 1.3 }, M.tole());
    c.boite(2.1, 0.45, 1.52, 0x2a3236, { x: -0.3, y: 1.32 }, M.verre(), { crasse: false });
    for (const dx of [-1.3, 1.3]) for (const s of [-0.6, 0.6]) c.boite(0.3, 0.3, 0.3, 0x8a867c, { x: dx, y: 0.15, z: s }, M.beton());
  });
  obstacleRect(b, 15.4, 2.2, 19.6, 4.6, "épave");
  // Le totem de l'usine, le mât du drapeau déchiré
  c.pave(9.3, 0, 24.6, 10.1, 2.4, 25.4, 0xc9c3b4, M.beton());
  panneau(c, "logo", 9.7, 2.0, 25.42, 3.0, 0.75);
  c.pave(8.2, 2.4, 24.6, 11.2, 2.5, 25.4, 0xc9c3b4, M.beton());
  c.pave(8.3, 1.6, 24.95, 11.1, 2.4, 25.05, 0xd8d2c2, M.beton());
  c.tube([24, 0, 25.5], [24, 9, 25.5], 0.06, 0xb9bdb6, M.tole(), 6);
  c.boite(1.3, 0.8, 0.01, 0xd8d0b8, { x: 24.7, y: 8.4, z: 25.5, rz: -0.25 }, M.toile(), { crasse: false });
  c.boite(0.5, 0.25, 0.01, 0xd8d0b8, { x: 25.6, y: 7.9, z: 25.5, rz: -0.6 }, M.toile(), { crasse: false });
  // L'allée vers l'entrée et la pelouse en friche
  for (let z = 20.6; z < 28; z += 1.2) c.pave(32.2, -0.02, z, 34.8, 0.04, z + 1.1, 0xb0aba0, M.dalle(), { crasse: false, nuance: 0.06 });
}

// ---------- La végétation ----------

const ARBRES = [
  [-70, -30, 9], [-69, -8, 10], [-69, 17, 8], [-69.5, 31, 10], [-35, -35, 8], [-12, -35, 7],
  [10, -34, 8], [25, -33, 9], [40, -34, 8], [58, -33, 9], [68, -30, 8], [-14, -18, 7, "bouleau"], [2, -16, 6, "bouleau"],
  [8, -26, 7], [14, -12, 6, "bouleau"], [68, -18, 9], [69, -4, 8], [68, 10, 9], [67, 22, 8], [-67, 33, 8], [-48, 33.5, 9], [-36, 33, 7],
  [-20, 32, 8], [-14, 24, 9], [-16, 29, 7, "bouleau"], [7, 27.5, 8], [52, 26.5, 7, "bouleau"], [66, 26, 9], [67, 17, 7],
  [-1, 18, 6, "bouleau"], [39, -18, 7], [30, -22, 8, "bouleau"], [18, -20, 7], [-62, 12.5, 6, "bouleau"],
];

function vegetation(ctx, x1, z1, x2, z2) {
  const { c, u } = ctx;
  const dedans = (x, z) => x > x1 - 2 && x < x2 + 2 && z > z1 - 2 && z < z2 + 2;
  for (const [x, z, h, essence] of ARBRES) {
    if (!dedans(x, z) || zoneMorte(x, z) || !libre(x, z, 3.5)) continue;
    arbre(c, x, z, h * (0.75 + 0.4 * u), essence ?? (c.hasard() < 0.35 ? "bouleau" : "feuillu"));
    if (c.hasard() < 0.4) arbuste(c, x + c.entre(-2, 2), z + c.entre(-2, 2), c.entre(0.9, 1.6));
  }
  // La lisière luxuriante : buissons serrés autour des bassins (mais pas dedans) et le long des clôtures
  const buissons = [];
  for (let i = 0; i < 32; i++) {
    let x, z;
    const t = c.hasard();
    if (t < 0.45) {
      const B = BASSINS[Math.floor(c.hasard() * 3)];
      const R = Math.max(B.l, B.p) / 2 + 4.5;
      const an = c.hasard() * TAU;
      const d = R * c.entre(1.05, 1.5);
      x = B.x + Math.cos(an) * d;
      z = B.z + Math.sin(an) * d * 0.85;
    } else if (t < 0.7) {
      x = c.entre(-70, 16);
      z = c.entre(31, 33.5);
    } else if (t < 0.85) {
      x = c.entre(-70, -67);
      z = c.entre(-34, 30);
    } else {
      x = c.entre(-10, 66);
      z = c.entre(-35, -31);
    }
    if (!dedans(x, z) || zoneMorte(x, z) || !libre(x, z, 0.8) || dansCuvette(x, z, 0.5)) continue;
    buissons.push([x, z]);
  }
  for (const [x, z] of buissons) arbuste(c, x, z, c.entre(0.8, 1.7) * (0.8 + 0.4 * u));
  // Les fougères et les herbes hautes (vert vif) partout où le sol vit ; rien dans les zones mortes
  const pts = [];
  for (let i = 0; i < 50 + 50 * u; i++) {
    const x = c.entre(x1, x2);
    const z = c.entre(z1, z2);
    if (zoneMorte(x, z) || !libre(x, z, 0.4) || dansCuvette(x, z, 0.3)) continue;
    if (Math.abs(x - 4.5) < 4 && z > -4) continue;
    pts.push([x, z]);
  }
  touffes(c, pts, PALETTE.herbe);
}

// ---------- Les voyants qui clignotent encore ----------

function voyants(ctx) {
  const { b } = ctx;
  if (ctx.voyants.length) {
    const pos = [];
    for (const [x, y, z, r] of ctx.voyants) {
      const g = new THREE.IcosahedronGeometry(r, 0);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) pos.push(p.getX(i) + x, p.getY(i) + y, p.getZ(i) + z);
      g.dispose();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    const mat = new THREE.MeshBasicMaterial({ color: 0xff2a1a });
    const m = new THREE.Mesh(geo, mat);
    m.userData.animer = (t) => mat.color.setRGB(Math.sin(t * 3.2) > 0.1 ? 1 : 0.12, 0.08, 0.05);
    b.ajouter(m);
  }
  if (ctx.led) {
    const g = new THREE.BoxGeometry(0.06, 0.06, 0.02);
    g.translate(...ctx.led);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x4aa8ff }));
    m.userData.animer = (t) => m.material.color.setRGB(0.29, 0.66, Math.sin(t * 1.2) > 0 ? 1 : 0.5);
    b.ajouter(m);
  }
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

export function creer({ usure = 0.7, carte = "installations" } = {}) {
  const def = CARTES.find((k) => k.id === carte) ?? CARTES[0];
  const o = ORIGINES[def.id];
  const b = new Batiment(1964, usure);
  const ctx = { b, c: b.c, u: usure, voyants: [], led: null };
  const lot = [o.x - def.lot.l / 2, o.z - def.lot.p / 2, o.x + def.lot.l / 2, o.z + def.lot.p / 2];

  // Les étapes de construction (le compte de triangles de chacune sert au réglage du budget)
  const etapes = def.id === "installations"
    ? [
        ["sol", () => sol(ctx, ...lot)],
        ["parc à cuves", () => parcACuves(ctx)],
        ["colonnes", () => colonnes(ctx, "fin")],
        ["sphères", () => spheres(ctx, "fin")],
        ["torchère", () => torchere(ctx, "fin")],
        ["rack", () => rack(ctx, RACK.x0, 20, 4)],
        ["bassins", () => bassins(ctx)],
        ["magasin", () => magasin(ctx, "fin")],
        ["poste de garde", () => posteDeGarde(ctx)],
        ["administratif", () => administratif(ctx, "fond")],
        ["vestiges", () => vestiges(ctx, "installations")],
        ["clôture", () => cloture(ctx, ...lot)],
        ["végétation", () => vegetation(ctx, ...lot)],
      ]
    : [
        ["sol", () => sol(ctx, ...lot)],
        ["lointain", () => {
          colonnes(ctx, "fond");
          spheres(ctx, "fond");
          torchere(ctx, "fond");
          magasin(ctx, "fond");
        }],
        ["rack", () => rack(ctx, 0, RACK.x1, 2)],
        ["administratif", () => administratif(ctx, "fin")],
        ["atelier", () => atelier(ctx, "fin")],
        ["cour", () => cour(ctx)],
        ["vestiges", () => vestiges(ctx, "ateliers")],
        ["végétation", () => vegetation(ctx, ...lot)],
      ];
  const compte = () => {
    let n = 0;
    for (const ch of [b.c, ...b.couches.map((q) => q.c)]) for (const geos of ch.lots.values()) for (const g of geos) n += g.attributes.position.count / 3;
    return n;
  };
  const bilan = {};
  for (const [nom, f] of etapes) {
    const avant = compte();
    f();
    bilan[nom] = Math.round(compte() - avant);
  }
  voyants(ctx);
  const groupe = recentrer(b.construire(), o, def.lot);
  groupe.userData.bilan = bilan;
  return groupe;
}
