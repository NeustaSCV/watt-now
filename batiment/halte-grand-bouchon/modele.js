// Halte · Le grand bouchon de la Grande Panne (route de la Ville, Book 01 §2 bis, Book 20 §4).
//
// L'autoroute de l'exode. Quand le réseau est tombé, toute la Ville a voulu partir en même temps, vers l'est, et la
// route s'est figée pour toujours. 200 m d'autoroute à 2 × 3 voies, en déblai entre deux talus : au sud, le sens de
// l'exode (vers l'est), bouché d'un mur à l'autre ; au nord, le sens du retour vers la Ville, presque vide, où quelques
// voitures ont tenté de remonter à contresens par une brèche du terre-plein central.
//
// Ce que la halte raconte, sans un mot, d'ouest en est (4 tronçons de 50 × 70 m) :
// - « entree » : le portique publicitaire (« Partez l'esprit léger : votre voiture pense pour vous »), le panneau à
//   messages variables figé sur « BOUCHON — 3 H », la borne d'appel d'urgence, la voiture autonome de luxe qui
//   recalcule encore son itinéraire, les phares d'une batterie qui s'épuise, le premier mot sur un pare-brise ;
// - « carambolage » : un semi-remorque a traversé le terre-plein et s'est couché en travers ; sa charge de buses en
//   béton a roulé sur les voies vides ; la navette d'évacuation a fait un tête-à-queue contre lui. On passe par la
//   navette : porte avant, l'allée entre les sièges, l'issue de secours arrière (goulet n° 1) ;
// - « pont » : le campement des derniers sous le pont d'autoroute (bâches, matelas, feux, le mur des avis de recherche
//   sur la pile), le camping-car et son auvent, le car de tourisme, et les tombes sur le talus ;
// - « controle » : la tête du bouchon, le point de contrôle sanitaire de la fièvre grise (tentes, barrières, cônes,
//   portique thermique, la « Voie Premium » au tapis rouge), et au-delà… la route vide. Personne n'est passé.
//
// Tout est bâti dans le repère de la halte entière (origine au centre, +x à l'est, +z au sud), puis chaque tronçon ne
// garde que ce qui tombe dans sa bande de x et se recentre sur son lot (voir `recentrer`). Les éléments continus (route,
// murs, talus) sont découpés exactement aux limites des tronçons ; les objets vont dans le tronçon de leur centre.

import * as THREE from "three";
import { mergeGeometries } from "../vendor/BufferGeometryUtils.js";
import { Batiment, PALETTE, MAT, aleatoire, matiere, matiereMonde, matiereTexture, matiereVerre, matiereLueur, dessiner, taches, semerTouffes, touffes, gravats, debris, jonchee, mousse, arbuste, arbre, flaque } from "../commun/atelier.js";

// ---------- Le plan de la halte (repère de la halte entière) ----------

const TRONCONS = [
  { id: "entree", nom: "L'entrée du bouchon", x: -75 },
  { id: "carambolage", nom: "Le carambolage", x: -25 },
  { id: "pont", nom: "Le pont et le campement", x: 25 },
  { id: "controle", nom: "Le contrôle sanitaire", x: 75 },
];

/** Profil en travers (|z|) : terre-plein central (GBA), 3 voies, bande d'arrêt d'urgence, glissière, accotement, mur antibruit, piste, talus. */
const Z = { gba: 0.3, chaussee: 14.5, glissiere: 15.2, mur: 20, piste: 23, haut: 32.5, bord: 35 };
/** Le centre des files (sens est, au sud) : voies 1, 2, 3 et bande d'arrêt d'urgence. */
const RANGS = [2.75, 6.25, 9.75, 13];
const HAUT_TALUS = 5.5;

/** La navette d'évacuation, couchée en travers après son tête-à-queue : l'avant regarde l'ouest. */
const BUS = { x0: -31.5, x1: -19.5, z: 8.6, w: 2.55 };
/** Le semi-remorque couché : arrière de la remorque, sellette, avant du tracteur. */
const SEMI = { a: { x: -24.6, z: 5.7 }, b: { x: -27.0, z: -7.0 }, c: { x: -28.6, z: -13.0 } };
const PONT = { x0: 20, x1: 30, y: 6.2, ep: 0.8 };

/** Les brèches du terre-plein central, les trous des glissières (sud, nord). */
const TROUS_GBA = [[-71.5, -67.5], [-27.2, -24.2], [3, 6.5], [46.5, 50.5], [80, 83.5]];
const TROUS_GLISSIERE_SUD = [[-74, -70], [-28, -22.5], [16, 46], [63, 83]];
const TROUS_GLISSIERE_NORD = [[-31.5, -25.5], [10, 13.5], [19.5, 30.5], [64, 82]];
/** Les travées du mur antibruit sud tombées (on y passe vers les tombes). */
const MUR_SUD_TOMBE = [32, 36, 40];

function arr(v) {
  return Math.round(v * 10) / 10;
}
/** Un nombre pseudo-aléatoire stable pour un entier (le même dans tous les tronçons). */
function hache(n) {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
}
/** [a, b] privé des intervalles `trous`. */
function intervalles(a, b, trous) {
  let res = [[a, b]];
  for (const [t1, t2] of trous) {
    res = res.flatMap(([p, q]) => {
      if (t2 <= p || t1 >= q) return [[p, q]];
      const o = [];
      if (t1 > p) o.push([p, t1]);
      if (t2 < q) o.push([t2, q]);
      return o;
    });
  }
  return res.filter(([p, q]) => q - p > 0.05);
}
/** La hauteur du talus en (x, z) : nulle jusqu'à la piste, puis une pente bosselée jusqu'au haut. */
function hauteurTalus(x, z) {
  const a = Math.abs(z);
  const t = Math.min(1, Math.max(0, (a - Z.piste) / (Z.haut - Z.piste)));
  const base = HAUT_TALUS * t * t * (3 - 2 * t);
  const bosse = 0.45 * Math.sin(x * 0.21 + a * 0.13) + 0.3 * Math.sin(x * 0.07 - a * 0.31 + 1.3) + 0.18 * Math.sin(x * 0.53 + 2.1);
  return base + bosse * Math.sin(Math.PI * t);
}

// ---------- Les véhicules ----------

/** Les gabarits : longueur, largeur, hauteur de caisse, de vitrage, habitacle (de c0 à c1), fuyant avant/arrière, rayon de roue. */
const TYPES = {
  citadine: { l: 3.8, w: 1.68, hb: 0.62, hc: 0.72, c0: -1.6, c1: 0.95, av: 0.6, ar: 0.3, r: 0.3 },
  berline: { l: 4.6, w: 1.8, hb: 0.6, hc: 0.68, c0: -1.55, c1: 1.0, av: 0.75, ar: 0.55, r: 0.32 },
  break: { l: 4.75, w: 1.8, hb: 0.62, hc: 0.74, c0: -2.15, c1: 1.0, av: 0.75, ar: 0.12, r: 0.32 },
  suv: { l: 4.6, w: 1.9, hb: 0.8, hc: 0.78, c0: -2.05, c1: 0.95, av: 0.6, ar: 0.15, r: 0.37 },
  monospace: { l: 4.6, w: 1.86, hb: 0.7, hc: 0.92, c0: -2.1, c1: 1.45, av: 1.05, ar: 0.12, r: 0.33 },
  luxe: { l: 5.0, w: 1.98, hb: 0.56, hc: 0.62, c0: -1.95, c1: 1.15, av: 1.0, ar: 1.05, r: 0.36 },
  fourgon: { l: 5.3, w: 2.0, hb: 0.95, hc: 1.35, c0: -2.6, c1: 1.6, av: 0.55, ar: 0.0, r: 0.36 },
};
const TIRAGE = ["citadine", "berline", "berline", "break", "break", "suv", "suv", "monospace", "monospace", "fourgon", "citadine", "berline"];
/** Des teintes de carrosserie un peu passées (aucune couleur de l'Abondance). */
const TEINTES = [0xb9b2a2, 0x8c949a, 0xd9d6cc, 0x5d6e66, 0x7b4a45, 0x4d5a6e, 0xa3a39b, 0x3e3f40, 0xa8875a, 0x6a7f8f, 0xcfc9b8, 0x6b5f52, 0xe0ddd2, 0x7d8a72];

/** Les zones où le bouchon laisse la place (x1, x2, files concernées) : véhicules à part, feux éteints, campement, contrôle. */
const RESERVE_SUD = [
  [-81.4, -74.6, [1]], // la voiture autonome
  [-59.6, -54.4, [0, 1]], // un ancien feu de camp entre les files
  [-44.6, -37.4, [3]], // l'ambulance
  [-34.5, -16.5, [0, 1, 2, 3]], // le carambolage
  [-8.6, -3.4, [1, 2]], // un ancien feu de camp
  [2.6, 11.4, [2]], // le camping-car
  [14.5, 36.5, [0, 1, 2, 3]], // le campement sous le pont
  [39.4, 52.6, [1]], // le car de tourisme
  [51.6, 60.4, [2]], // le camion de livraison
  [55.5, 61.5, [0]], // les braises des pillards
  [62.6, 101, [0, 1, 2, 3]], // le contrôle sanitaire, et au-delà la route vide
];

function genererBouchon() {
  const A = aleatoire(1789);
  const liste = [];
  RANGS.forEach((zr, k) => {
    let x = -99.2 + A() * 1.5;
    while (x < 100) {
      const type = TIRAGE[Math.floor(A() * TIRAGE.length)];
      const l = TYPES[type].l;
      const res = RESERVE_SUD.find(([a, b, rangs]) => rangs.includes(k) && x + l > a && x < b);
      if (res) {
        x = res[1] + 0.3 + A() * 0.8;
        continue;
      }
      if (x + l > 99.6) break;
      // La bande d'arrêt d'urgence est moins pleine : on y a roulé, mais pas tous.
      if (k === 3 && A() < 0.22) {
        x += 5 + A() * 4;
        continue;
      }
      const v = { x: x + l / 2, z: zr + (A() - 0.5) * 0.7, ry: (A() - 0.5) * 0.16, type, couleur: TEINTES[Math.floor(A() * TEINTES.length)], rv: A(), rv2: A(), rv3: A() };
      const q = A();
      v.charge = q < 0.18 ? "coffre" : q < 0.32 ? "galerie" : q < 0.39 ? "matelas" : q < 0.44 ? "velos" : q < 0.47 ? "cage" : q < 0.52 ? "valises" : null;
      if (type === "fourgon" && (v.charge === "coffre" || v.charge === "matelas")) v.charge = "galerie";
      if (A() < 0.3) v.porte = { cote: A() < 0.5 ? -1 : 1, pos: A() < 0.6 ? "av" : "ar" };
      liste.push(v);
      x += l + 0.55 + A() * 1.5 + (A() < 0.12 ? 2.2 : 0);
    }
  });
  return liste;
}

/** Le sens du retour (nord) : quelques abandonnés vers la Ville, et ceux qui ont remonté à contresens. */
const NORD = [
  { x: -91, z: -9.75, ry: Math.PI + 0.05, type: "berline", couleur: 0x8c949a },
  { x: -47.5, z: -13, ry: Math.PI - 0.1, type: "fourgon", couleur: 0xd9d6cc },
  { x: -42.6, z: -12.4, ry: Math.PI - 0.32, type: "berline", couleur: 0x4d5a6e },
  { x: -63.5, z: -2.7, ry: 0.32, type: "suv", couleur: 0x3e3f40 },
  { x: -55.5, z: -2.9, ry: 0.05, type: "monospace", couleur: 0xa8875a, charge: "galerie" },
  { x: -48.5, z: -6.1, ry: -0.08, type: "berline", couleur: 0x7b4a45, charge: "coffre" },
  { x: -40, z: -2.8, ry: 0.1, type: "break", couleur: 0x6a7f8f, charge: "velos" },
  { x: -39.2, z: -8.6, ry: 0.15, type: "citadine", couleur: 0xcfc9b8 },
  { x: -34.4, z: -14.7, ry: 0.25, type: "suv", couleur: 0x5d6e66 },
  { x: -35.8, z: -10.4, ry: -0.1, type: "berline", couleur: 0xb9b2a2, charge: "matelas" },
  { x: -33.8, z: -5.6, ry: 0.4, type: "citadine", couleur: 0x7d8a72 },
  { x: -34.4, z: -1.9, ry: 0.12, type: "monospace", couleur: 0x8c949a },
  { x: 55, z: -2.8, ry: 0.15, type: "break", couleur: 0xa3a39b, charge: "coffre" },
  { x: 61, z: -3.3, ry: -0.05, type: "suv", couleur: 0x6b5f52 },
  { x: 59.6, z: -9.2, ry: 0.3, type: "citadine", couleur: 0xe0ddd2 },
  { x: 90, z: -9.9, ry: Math.PI + 0.2, type: "break", couleur: 0x4d5a6e },
  { x: 7.5, z: -12.8, ry: Math.PI + 0.05, type: "fourgon", couleur: 0xcfc9b8 },
  { x: -80, z: -12.9, ry: Math.PI - 0.04, type: "citadine", couleur: 0x7b4a45 },
];

/** Les véhicules ordinaires de la halte, avec les mots, les phares et les sièges bébé distribués. */
const VOITURES = (() => {
  const l = genererBouchon();
  const A = aleatoire(404);
  for (const v of NORD) {
    v.rv = A();
    v.rv2 = A();
    v.rv3 = A();
    l.push(v);
  }
  const proche = (x, rang, filtre = () => true) => {
    let m = null;
    for (const v of l) {
      if (Math.abs(v.z - RANGS[rang]) > 0.6 || !filtre(v)) continue;
      if (!m || Math.abs(v.x - x) < Math.abs(m.x - x)) m = v;
    }
    return m;
  };
  const leger = (v) => v.type !== "fourgon";
  Object.assign(proche(-88, 1, leger), { mot: "mot1", charge: "galerie", porte: null });
  Object.assign(proche(-46, 1, leger), { mot: "mot2", porte: null });
  Object.assign(proche(-66, 2, leger), { phares: true, porte: null, rv: 0.99 });
  Object.assign(proche(-70, 0, leger), { siege: true, porte: { cote: 1, pos: "ar" } });
  Object.assign(proche(-13, 2, leger), { siege: true, porte: { cote: 1, pos: "ar" }, charge: "matelas" });
  Object.assign(proche(-93, 2, leger), { charge: "velos" });
  Object.assign(proche(-51, 2, leger), { charge: "cage" });
  Object.assign(proche(58, 1, leger), { mot: "mot2", porte: { cote: 1, pos: "av" } });
  Object.assign(proche(44, 0, leger), { siege: true, porte: { cote: 1, pos: "ar" } });
  return l;
})();

// ---------- Matières ----------

const AL = 1024;
const AH = 1024;
/** L'atlas des enseignes, affiches, écrans et mots (une seule matière pour tous) : [x, y, l, h] en pixels. */
const R = {
  pub: [0, 0, 1024, 256],
  pmv: [0, 256, 512, 96],
  thermo: [0, 352, 256, 32],
  borne: [512, 256, 256, 128],
  ecran: [768, 256, 256, 128],
  mot1: [0, 384, 256, 160],
  mot2: [256, 384, 256, 160],
  mot3: [512, 384, 256, 160],
  carton: [768, 384, 256, 160],
  controle: [0, 544, 512, 192],
  premium: [512, 544, 512, 192],
  versVille: [0, 736, 512, 192],
  versCarrefour: [512, 736, 512, 192],
  evacuation: [0, 928, 256, 96],
  livraison: [256, 928, 512, 96],
  voyages: [768, 928, 256, 96],
  thermoEcran: [256, 352, 256, 32],
};

let MATS = null;
const GEO = {};

function matieres() {
  if (MATS) return MATS;
  const atlas = dessiner("bouchon-atlas", AL, AH, dessinerAtlas, false);
  const asphalte = matiereTexture(dessiner("bouchon-asphalte", 256, 256, dessinerAsphalte), { roughness: 0.95 });
  asphalte.userData.tuile = 6;
  const grillage = new THREE.MeshStandardMaterial({ map: dessiner("bouchon-grillage", 64, 64, dessinerGrillage), vertexColors: true, roughness: 0.6, metalness: 0.4, alphaTest: 0.5, side: THREE.DoubleSide });
  grillage.userData.tuile = 0.5;
  const enseignes = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.8, alphaTest: 0.4, side: THREE.DoubleSide });
  const neon = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 1.0, vertexColors: true, roughness: 0.5 });
  MATS = {
    asphalte,
    beton: matiereMonde("beton"),
    grillage,
    enseignes,
    neon,
    verre: matiereVerre(0xb8ccd2, 0.2),
    lueur: matiereLueur(0xffa850, 0.55),
    mat: matiere(0.95, 0),
    satin: matiere(0.6, 0.05),
    lisse: matiere(0.3, 0.05),
    tole: matiere(0.75, 0.3),
    metal: matiere(0.4, 0.7),
    toile: MAT.toile(),
  };
  return MATS;
}

// ---------- Textures dessinées ----------

function dessinerAsphalte(g) {
  const a = aleatoire(31);
  g.fillStyle = "#c4c3bd";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 6000; i++) {
    g.fillStyle = a() < 0.5 ? `rgba(0,0,0,${0.05 + a() * 0.08})` : `rgba(255,255,255,${0.04 + a() * 0.07})`;
    g.fillRect(a() * 256, a() * 256, 1 + a() * 2, 1 + a() * 2);
  }
  taches(g, a, 9, "rgba(35,33,30,0.22)", 10, 40, 256, 256);
  for (let i = 0; i < 4; i++) {
    g.fillStyle = `rgba(55,53,50,${0.12 + a() * 0.12})`;
    g.fillRect(a() * 220, a() * 220, 20 + a() * 60, 14 + a() * 40);
  }
  g.strokeStyle = "rgba(30,28,25,0.5)";
  g.lineWidth = 1.2;
  for (let i = 0; i < 8; i++) {
    let x = a() * 256;
    let y = a() * 256;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 7; k++) {
      x += (a() - 0.5) * 26;
      y += (a() - 0.5) * 26;
      g.lineTo(x, y);
    }
    g.stroke();
  }
}

function dessinerGrillage(g) {
  g.clearRect(0, 0, 64, 64);
  g.strokeStyle = "#e4e8e8";
  g.lineWidth = 2;
  for (let x = 1; x < 64; x += 8) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, 64);
    g.stroke();
  }
  for (let y = 1; y < 64; y += 16) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(64, y);
    g.stroke();
  }
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
  for (let i = 0; i < 8 * force; i++) {
    const cx = x + a() * l;
    const lg = h * (0.3 + a() * 0.8);
    const d = g.createLinearGradient(0, y, 0, y + lg);
    d.addColorStop(0, `rgba(60,52,40,${0.22 * force})`);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(cx, y, 2 + a() * 6, lg);
  }
  g.restore();
}

const POLICE = '"Arial Black", "Helvetica Neue", Arial, sans-serif';
const MAIN = '"Bradley Hand", "Segoe Print", "Comic Sans MS", cursive';

function texte(g, t, x, y, taille, couleur, { police = "900", famille = POLICE, align = "center", rotation = 0, max } = {}) {
  g.save();
  g.translate(x, y);
  g.rotate(rotation);
  g.font = `${police} ${taille}px ${famille}`;
  g.fillStyle = couleur;
  g.textAlign = align;
  g.textBaseline = "middle";
  g.fillText(t, 0, 0, max);
  g.restore();
}

/** Un afficheur à diodes : le texte, puis une grille noire qui sépare les points. */
function diodes(g, x, y, l, h, pas = 4) {
  g.fillStyle = "rgba(0,0,0,0.8)";
  for (let i = x; i < x + l; i += pas) g.fillRect(i, y, 1, h);
  for (let j = y; j < y + h; j += pas) g.fillRect(x, j, l, 1);
}

function dessinerAtlas(g) {
  const a = aleatoire(1717);
  g.clearRect(0, 0, AL, AH);

  // La publicité géante du portique : une voiture qui sourit, un conducteur qui dort.
  {
    const [x, y, l, h] = R.pub;
    const d = g.createLinearGradient(0, y, 0, y + h);
    d.addColorStop(0, "#a9cbd3");
    d.addColorStop(1, "#ece2c8");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
    g.fillStyle = "#7d877a";
    g.beginPath();
    g.moveTo(x + 30, y + h);
    g.lineTo(x + 230, y + 120);
    g.lineTo(x + 270, y + 120);
    g.lineTo(x + 440, y + h);
    g.fill();
    g.fillStyle = "#e9dfc6";
    for (let k = 0; k < 4; k++) g.fillRect(x + 246 - k * 6, y + 135 + k * 30, 6 + k * 2, 16);
    // la voiture
    g.fillStyle = "#c8362b";
    g.beginPath();
    g.roundRect(x + 120, y + 150, 260, 62, 26);
    g.fill();
    g.beginPath();
    g.roundRect(x + 175, y + 108, 150, 60, 30);
    g.fill();
    g.fillStyle = "#2f6f73";
    g.beginPath();
    g.roundRect(x + 190, y + 118, 120, 38, 16);
    g.fill();
    g.fillStyle = "#222";
    for (const rx of [x + 180, x + 320]) {
      g.beginPath();
      g.arc(rx, y + 214, 22, 0, 7);
      g.fill();
    }
    // le conducteur endormi, le sourire de la calandre
    g.fillStyle = "#e9dfc6";
    g.beginPath();
    g.arc(x + 230, y + 138, 12, 0, 7);
    g.fill();
    texte(g, "z", x + 258, y + 112, 22, "#2f6f73", { famille: MAIN, police: "700" });
    texte(g, "z", x + 272, y + 96, 16, "#2f6f73", { famille: MAIN, police: "700" });
    g.strokeStyle = "#e9dfc6";
    g.lineWidth = 5;
    g.beginPath();
    g.arc(x + 375, y + 172, 16, 0.3, 1.9);
    g.stroke();
    texte(g, "Partez l'esprit léger", x + 700, y + 78, 66, "#2f6f73", { max: 600 });
    texte(g, "votre voiture pense pour vous", x + 700, y + 148, 42, "#c8362b", { max: 600 });
    texte(g, "SÉRÉNIA · Pilote autonome Premium · 1er mois offert*", x + 700, y + 204, 22, "#3b3a36", { police: "700", max: 600 });
    texte(g, "*sous réserve de connexion au réseau", x + 1010, y + 244, 12, "#3b3a36", { police: "400", align: "right" });
    // l'affiche se décolle par lés
    g.fillStyle = "#cfc8b4";
    for (const [px, pl] of [[x + 470, 70], [x + 860, 120]]) {
      g.beginPath();
      g.moveTo(px, y);
      for (let k = 0; k <= 10; k++) g.lineTo(px + (k % 2 ? 10 : 0) + (pl * k) / 10, y + 30 + a() * 70);
      g.lineTo(px + pl, y);
      g.fill();
    }
    salir(g, a, x, y, l, h, 1.2);
  }

  // Le panneau à messages variables, figé
  {
    const [x, y, l, h] = R.pmv;
    g.fillStyle = "#0e0f10";
    g.fillRect(x, y, l, h);
    texte(g, "BOUCHON — 3 H", x + l / 2, y + 32, 44, "#ffad33", { famille: '"Courier New", monospace', police: "900", max: l - 30 });
    texte(g, "RESTEZ DANS VOS VÉHICULES", x + l / 2, y + 74, 26, "#ffad33", { famille: '"Courier New", monospace', police: "900", max: l - 30 });
    diodes(g, x, y, l, h, 4);
    g.fillStyle = "#0e0f10";
    for (let i = 0; i < 18; i++) g.fillRect(x + a() * l, y + a() * h, 4, 4);
  }
  // L'écran du portique thermique et son afficheur
  {
    const [x, y, l, h] = R.thermo;
    g.fillStyle = "#0b1410";
    g.fillRect(x, y, l, h);
    texte(g, "AVANCEZ  ·  --,- °C", x + l / 2, y + h / 2, 22, "#7dff9a", { famille: '"Courier New", monospace', max: l - 10 });
  }
  {
    const [x, y, l, h] = R.thermoEcran;
    g.fillStyle = "#e9e5da";
    g.fillRect(x, y, l, h);
    texte(g, "PORTIQUE THERMIQUE N° 2", x + l / 2, y + h / 2, 18, "#3b3a36", { max: l - 10 });
  }

  // La borne d'appel d'urgence
  {
    const [x, y, l, h] = R.borne;
    g.fillStyle = "#d9822b";
    g.fillRect(x, y, l, h);
    texte(g, "SOS", x + 48, y + 30, 38, "#fffaf0");
    g.fillStyle = "#9fb59a";
    g.fillRect(x + 16, y + 56, l - 32, 54);
    texte(g, "Votre appel est", x + l / 2, y + 72, 17, "#1d2a1d", { famille: '"Courier New", monospace', max: l - 40 });
    texte(g, "important pour nous", x + l / 2, y + 94, 17, "#1d2a1d", { famille: '"Courier New", monospace', max: l - 40 });
    texte(g, "Assistance Watty+", x + 168, y + 30, 18, "#fffaf0", { police: "700", max: 150 });
    salir(g, a, x, y, l, h, 1);
  }
  // L'écran de la voiture autonome
  {
    const [x, y, l, h] = R.ecran;
    g.fillStyle = "#081a22";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "#63e2ff";
    g.lineWidth = 6;
    g.beginPath();
    g.arc(x + 44, y + h / 2, 22, 0.4, 5.2);
    g.stroke();
    texte(g, "Recalcul de", x + 160, y + 46, 26, "#8eeaff", { police: "700", famille: '"Helvetica Neue", Arial, sans-serif', max: 180 });
    texte(g, "l'itinéraire…", x + 160, y + 84, 26, "#8eeaff", { police: "700", famille: '"Helvetica Neue", Arial, sans-serif', max: 180 });
  }

  // Les mots laissés sur les pare-brise
  const papier = (r, fond, coin) => {
    const [x, y, l, h] = r;
    g.fillStyle = fond;
    g.beginPath();
    g.moveTo(x + 6, y + 8);
    g.lineTo(x + l - 4, y + 4);
    g.lineTo(x + l - 8, y + h - 6);
    g.lineTo(x + 4, y + h - 3);
    g.fill();
    if (coin) {
      g.fillStyle = "rgba(230,225,200,0.85)";
      g.fillRect(x + l / 2 - 30, y, 60, 14);
    }
    salir(g, a, x, y, l, h, 0.6);
  };
  {
    papier(R.mot1, "#f1ece0", true);
    const [x, y] = R.mot1;
    texte(g, "Partis à pied", x + 128, y + 42, 30, "#25356e", { famille: MAIN, police: "700", rotation: -0.04, max: 230 });
    texte(g, "vers le Barrage", x + 128, y + 80, 30, "#25356e", { famille: MAIN, police: "700", rotation: -0.04, max: 230 });
    texte(g, "— Léa et Marc", x + 150, y + 122, 26, "#25356e", { famille: MAIN, police: "700", rotation: -0.03, max: 200 });
  }
  {
    papier(R.mot2, "#b08a5c", false);
    const [x, y] = R.mot2;
    texte(g, "ON REVIENT", x + 128, y + 80, 46, "#1b1a18", { famille: MAIN, police: "900", rotation: 0.05, max: 220 });
  }
  {
    papier(R.mot3, "#ece8dc", true);
    const [x, y] = R.mot3;
    texte(g, "Ne touchez pas,", x + 128, y + 58, 32, "#1b1a18", { famille: MAIN, police: "900", rotation: -0.02, max: 230 });
    texte(g, "c'est à nous", x + 128, y + 104, 32, "#1b1a18", { famille: MAIN, police: "900", rotation: -0.02, max: 230 });
    g.fillStyle = "#1b1a18";
    g.fillRect(R.mot3[0] + 50, R.mot3[1] + 128, 150, 4);
  }
  // Le carton des colis « livraison en 1 heure »
  {
    const [x, y, l, h] = R.carton;
    g.fillStyle = "#b9915f";
    g.fillRect(x, y, l, h);
    g.fillStyle = "rgba(220,200,160,0.7)";
    g.fillRect(x, y + h / 2 - 12, l, 24);
    texte(g, "EXPRESS 1H", x + l / 2, y + 40, 34, "#c8362b", { max: l - 20 });
    texte(g, "livraison en 1 heure", x + l / 2, y + 112, 20, "#2b2620", { police: "700", max: l - 20 });
    g.strokeStyle = "#2b2620";
    g.lineWidth = 3;
    g.beginPath();
    g.arc(x + l / 2, y + 128, 40, 0.4, 2.7);
    g.stroke();
    salir(g, a, x, y, l, h, 0.8);
  }

  // Le panneau du contrôle sanitaire
  {
    const [x, y, l, h] = R.controle;
    g.fillStyle = "#efece4";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#c8362b";
    g.fillRect(x, y, l, 52);
    texte(g, "CONTRÔLE SANITAIRE", x + l / 2, y + 27, 36, "#fffaf0", { max: l - 30 });
    texte(g, "Contrôle de température", x + l / 2 + 30, y + 92, 34, "#22242a", { police: "700", max: l - 110 });
    texte(g, "Fièvre grise · arrêt obligatoire · gardez 2 m", x + l / 2 + 30, y + 140, 20, "#22242a", { police: "700", max: l - 110 });
    // le thermomètre
    g.fillStyle = "#22242a";
    g.fillRect(x + 40, y + 70, 16, 80);
    g.beginPath();
    g.arc(x + 48, y + 158, 18, 0, 7);
    g.fill();
    g.fillStyle = "#c8362b";
    g.fillRect(x + 44, y + 100, 8, 56);
    salir(g, a, x, y, l, h, 1);
  }
  // La voie Premium
  {
    const [x, y, l, h] = R.premium;
    g.fillStyle = "#1e2433";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "#c79a3b";
    g.lineWidth = 6;
    g.strokeRect(x + 10, y + 10, l - 20, h - 20);
    texte(g, "VOIE PREMIUM", x + l / 2, y + 62, 50, "#d9b25a", { max: l - 60 });
    texte(g, "QR Santé+ · passage prioritaire", x + l / 2, y + 116, 26, "#e9dfc6", { police: "700", max: l - 60 });
    texte(g, "Votre santé n'attend pas.", x + l / 2, y + 152, 20, "#e9dfc6", { police: "400", famille: '"Georgia", serif', max: l - 60 });
    salir(g, a, x, y, l, h, 0.8);
  }
  // Les panneaux d'autoroute (bleus) aux deux bouts
  const panneauBleu = (r, l1, l2) => {
    const [x, y, l, h] = r;
    g.fillStyle = "#1f4f8c";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "#f2f2ee";
    g.lineWidth = 7;
    g.beginPath();
    g.roundRect(x + 10, y + 10, l - 20, h - 20, 14);
    g.stroke();
    texte(g, l1, x + l / 2, y + 68, 58, "#f2f2ee", { police: "700", famille: '"Helvetica Neue", Arial, sans-serif', max: l - 50 });
    texte(g, l2, x + l / 2, y + 136, 40, "#f2f2ee", { police: "700", famille: '"Helvetica Neue", Arial, sans-serif', max: l - 50 });
    salir(g, a, x, y, l, h, 0.9);
  };
  panneauBleu(R.versVille, "La Ville", "← 6 km");
  panneauBleu(R.versCarrefour, "Le Carrefour", "Comptoir · 9 km →");
  // La girouette de la navette, et les livrées
  {
    const [x, y, l, h] = R.evacuation;
    g.fillStyle = "#121314";
    g.fillRect(x, y, l, h);
    texte(g, "ÉVACUATION", x + l / 2, y + 36, 34, "#ffad33", { famille: '"Courier New", monospace', max: l - 16 });
    texte(g, "navette n° 7", x + l / 2, y + 72, 20, "#ffad33", { famille: '"Courier New", monospace', max: l - 16 });
  }
  {
    const [x, y, l, h] = R.livraison;
    g.fillStyle = "#e9e5da";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#c79a3b";
    g.fillRect(x, y + h - 18, l, 18);
    texte(g, "EXPRESS 1H", x + 120, y + 40, 40, "#c8362b", { max: 210 });
    texte(g, "livré en 1 heure, ou remboursé", x + 360, y + 40, 22, "#2b2620", { police: "700", max: 260 });
    salir(g, a, x, y, l, h, 1);
  }
  {
    const [x, y, l, h] = R.voyages;
    g.fillStyle = "#e7e1d2";
    g.fillRect(x, y, l, h);
    texte(g, "Voyages Horizon", x + l / 2, y + 36, 30, "#2f6f73", { police: "700", famille: '"Georgia", serif', max: l - 16 });
    texte(g, "Évasion tout compris", x + l / 2, y + 70, 18, "#8a5a2a", { police: "400", famille: '"Georgia", serif', max: l - 16 });
    salir(g, a, x, y, l, h, 0.8);
  }
}

// ---------- Géométries partagées ----------

function geoPrisme(l, h, p, avant, arriere, retrait) {
  const cle = ["pr", l, h, p, avant, arriere, retrait].map((v) => (typeof v === "number" ? v.toFixed(3) : v)).join("|");
  if (GEO[cle]) return GEO[cle];
  const g = new THREE.BoxGeometry(l, h, p);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 0) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setX(i, x > 0 ? x - avant : x + arriere);
      pos.setZ(i, z > 0 ? z - retrait : z + retrait);
    }
  }
  g.computeVertexNormals();
  return (GEO[cle] = g);
}
function geoRoue(r, w = 0.24, n = 8) {
  const cle = `roue|${r}|${w}|${n}`;
  return GEO[cle] ?? (GEO[cle] = new THREE.CylinderGeometry(r, r, w, n).rotateX(Math.PI / 2));
}
function geoCylY(r, h, n = 8) {
  const cle = `cy|${r}|${h}|${n}`;
  return GEO[cle] ?? (GEO[cle] = new THREE.CylinderGeometry(r, r, h, n));
}
function geoCylX(r, h, n = 8) {
  const cle = `cx|${r}|${h}|${n}`;
  return GEO[cle] ?? (GEO[cle] = new THREE.CylinderGeometry(r, r, h, n).rotateZ(Math.PI / 2));
}
function geoDisqueX(r, n = 10) {
  const cle = `dx|${r}|${n}`;
  return GEO[cle] ?? (GEO[cle] = new THREE.CircleGeometry(r, n).rotateY(Math.PI / 2));
}
function geoDome() {
  return GEO.dome ?? (GEO.dome = new THREE.SphereGeometry(1, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2));
}
function geoPierre() {
  return GEO.pierre ?? (GEO.pierre = new THREE.DodecahedronGeometry(1, 0));
}
function geoCone() {
  return GEO.cone ?? (GEO.cone = new THREE.ConeGeometry(0.17, 0.52, 6).translate(0, 0.26, 0));
}
function geoFlamme() {
  return GEO.flamme ?? (GEO.flamme = new THREE.ConeGeometry(0.22, 0.7, 5).translate(0, 0.35, 0));
}
function geoTorseVelo() {
  return GEO.velo ?? (GEO.velo = new THREE.TorusGeometry(0.33, 0.025, 3, 12));
}
/** La tente canadienne : un prisme triangulaire le long de x, posé au sol. */
function geoCanadienne() {
  if (GEO.canadienne) return GEO.canadienne;
  const g = new THREE.CylinderGeometry(1, 1, 2.3, 3, 1).rotateZ(Math.PI / 2).rotateX(-Math.PI / 2).translate(0, 0.5, 0);
  g.scale(1, 1.05, 0.95);
  return (GEO.canadienne = g);
}

/** Un panneau plat dont l'image vient de l'atlas (région `r`), face vers +z local. */
function panneau(c, r, pose, l, h, mat = MATS.enseignes) {
  const g = new THREE.PlaneGeometry(l, h);
  remapUV(g, r);
  c.poser(g, mat, 0xffffff, pose, { crasse: false, nuance: 0 });
  g.dispose();
}
/** Une boîte dont toutes les faces portent la même image de l'atlas (cartons imprimés). */
function boiteImprimee(c, r, l, h, p, couleur, pose) {
  const g = new THREE.BoxGeometry(l, h, p);
  remapUV(g, r);
  c.poser(g, MATS.enseignes, couleur, pose, { crasse: false, nuance: 0.08 });
  g.dispose();
}
function remapUV(g, r) {
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
}

/** Un obstacle rectangulaire (épave, cabine…) : centre, angle, et étendue locale [lx0, lx1] × [lz0, lz1]. */
function rectObstacle(b, x, z, ry, lx0, lx1, lz0, lz1, nature = "épave") {
  const co = Math.cos(ry);
  const si = Math.sin(ry);
  const pts = [[lx0, lz0], [lx1, lz0], [lx1, lz1], [lx0, lz1]].map(([a, d]) => [x + a * co + d * si, z - a * si + d * co]);
  for (let i = 0; i < 4; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % 4];
    b.obstacle(p[0], p[1], q[0], q[1], nature);
  }
}
/** D'un repère local (x, z, ry) vers la halte. */
function versMonde(x, z, ry, lx, lz) {
  return [x + lx * Math.cos(ry) + lz * Math.sin(ry), z - lx * Math.sin(ry) + lz * Math.cos(ry)];
}

function teinteUsee(hex, u, k = 1) {
  const c = new THREE.Color(hex);
  c.lerp(new THREE.Color(0xb3aa94), (0.1 + 0.28 * u) * k);
  return c.getHex();
}

// ---------- Petits objets ----------

function velo(c, x, y, z, ry, couleur = 0x3d5f7a) {
  const M = MATS;
  c.repere({ x, y, z, ry }, () => {
    for (const s of [-0.52, 0.52]) c.poser(geoTorseVelo(), M.satin, 0x252525, { x: s, y: 0.34 }, { crasse: false });
    const pts = { ar: [-0.52, 0.34, 0], av: [0.52, 0.34, 0], pe: [0, 0.32, 0], se: [-0.14, 0.86, 0], di: [0.4, 0.84, 0] };
    for (const [p, q] of [["ar", "pe"], ["ar", "se"], ["pe", "se"], ["pe", "di"], ["se", "di"], ["di", "av"]]) c.poutre(pts[p], pts[q], 0.04, couleur, M.tole, { crasse: false });
    c.boite(0.24, 0.05, 0.1, 0x1e1e1e, { x: -0.16, y: 0.9 }, M.satin);
    c.boite(0.05, 0.04, 0.5, 0x2a2a2a, { x: 0.42, y: 0.96 }, M.metal);
  });
}

function valise(c, x, z, ry, couleur, couchee = false, y = 0) {
  const M = MATS;
  c.repere({ x, y, z, ry }, () => {
    if (couchee) {
      c.boite(0.68, 0.24, 0.46, couleur, { y: 0.12 }, M.satin, { nuance: 0.08 });
      c.boite(0.2, 0.04, 0.04, 0x222222, { x: 0, y: 0.26, z: 0.1 }, M.satin);
    } else {
      c.boite(0.44, 0.66, 0.25, couleur, { y: 0.39 }, M.satin, { nuance: 0.08 });
      c.boite(0.04, 0.3, 0.04, 0x2a2a2a, { y: 0.86 }, M.metal);
      c.boite(0.03, 0.06, 0.03, 0x1e1e1e, { x: -0.18, y: 0.03 }, M.satin);
    }
  });
}

function sac(c, x, z, ry, couleur, y = 0) {
  c.poser(geoPierre(), MATS.toile, couleur, { x, y: y + 0.18, z, ry, e: [0.32, 0.22, 0.22] }, { nuance: 0.1 });
}

function siegeBebe(c, x, y, z, ry, couleur = 0x56657a) {
  const M = MATS;
  c.repere({ x, y, z, ry }, () => {
    c.boite(0.46, 0.12, 0.42, 0x2c2d2f, { y: 0.06 }, M.satin);
    c.boite(0.42, 0.1, 0.38, couleur, { y: 0.17 }, M.satin, { crasse: false });
    c.boite(0.1, 0.55, 0.42, couleur, { x: -0.2, y: 0.42, rz: -0.12 }, M.satin, { crasse: false });
    for (const s of [-1, 1]) c.boite(0.32, 0.3, 0.06, couleur, { x: -0.06, y: 0.33, z: s * 0.2 }, M.satin, { crasse: false });
    c.boite(0.04, 0.04, 0.46, 0xb8a040, { x: 0.05, y: 0.5 }, M.satin, { crasse: false });
  });
}

function cage(c, x, y, z, ry, couleur = 0x8f8c84) {
  const M = MATS;
  c.repere({ x, y, z, ry }, () => {
    c.boite(0.58, 0.04, 0.4, couleur, { y: 0.02 }, M.satin);
    c.boite(0.58, 0.04, 0.4, couleur, { y: 0.4 }, M.satin);
    for (const s of [-1, 1]) c.boite(0.58, 0.36, 0.03, couleur, { y: 0.21, z: s * 0.185 }, M.satin);
    c.boite(0.03, 0.36, 0.4, couleur, { x: -0.275, y: 0.21 }, M.satin);
    // La porte grillagée, ouverte : la cage est vide.
    c.repere({ x: 0.29, y: 0.21, z: -0.19, ry: -1.2 }, () => c.boite(0.02, 0.34, 0.36, 0x9a9ea0, { z: 0.18 }, M.grillage, { crasse: false }));
  });
}

function chaise(c, x, z, ry, couleur = 0x3d5a6e, renversee = false) {
  const M = MATS;
  c.repere({ x, z, ry, rz: renversee ? 1.45 : 0, y: renversee ? 0.25 : 0 }, () => {
    for (const [a, b] of [[-0.22, -0.2], [0.22, -0.2], [-0.22, 0.2], [0.22, 0.2]]) c.boite(0.03, 0.45, 0.03, 0x2b2b2b, { x: a, y: 0.22, z: b }, M.metal);
    c.boite(0.48, 0.04, 0.44, couleur, { y: 0.45 }, M.toile, { crasse: false });
    c.boite(0.04, 0.45, 0.44, couleur, { x: -0.24, y: 0.68, rz: 0.15 }, M.toile, { crasse: false });
  });
}

function table(c, x, z, ry, l = 1.2, p = 0.7, couleur = 0xd8d4c8, h = 0.74) {
  const M = MATS;
  c.repere({ x, z, ry }, () => {
    c.boite(l, 0.04, p, couleur, { y: h }, M.satin);
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.boite(0.04, h, 0.04, 0x6f7375, { x: (a * (l - 0.1)) / 2, y: h / 2, z: (b * (p - 0.1)) / 2 }, M.metal);
  });
}

function litDeCamp(c, x, z, ry, couleur = 0x5d6b4a) {
  const M = MATS;
  c.repere({ x, z, ry }, () => {
    c.boite(1.9, 0.04, 0.66, couleur, { y: 0.42 }, M.toile, { crasse: false });
    for (const s of [-1, 1]) c.boite(1.95, 0.04, 0.04, 0x8b9093, { y: 0.42, z: s * 0.34 }, M.metal);
    for (const a of [-0.85, 0, 0.85]) {
      c.poutre([a - 0.15, 0, -0.32], [a + 0.15, 0.42, 0.32], 0.03, 0x8b9093, M.metal);
      c.poutre([a - 0.15, 0, 0.32], [a + 0.15, 0.42, -0.32], 0.03, 0x8b9093, M.metal);
    }
  });
}

function caisse(c, x, z, ry, l, h, p, couleur = 0x8a7458, y = 0, mat) {
  c.boite(l, h, p, couleur, { x, y: y + h / 2, z, ry }, mat ?? MATS.mat, { nuance: 0.08 });
}

function jerrican(c, x, z, ry, couleur = 0x5c6b3a) {
  c.boite(0.34, 0.46, 0.17, couleur, { x, y: 0.23, z, ry }, MATS.satin, { nuance: 0.06 });
  c.boite(0.12, 0.05, 0.05, couleur, { x, y: 0.48, z, ry }, MATS.satin);
}

function cone(c, x, z, couche = false, ry = 0) {
  const M = MATS;
  if (couche) {
    c.poser(geoCone(), M.satin, 0xd27a35, { x, y: 0.17, z, rz: Math.PI / 2, ry }, { crasse: false, nuance: 0.06 });
  } else {
    c.boite(0.36, 0.03, 0.36, 0x2b2b2b, { x, y: 0.015, z }, M.satin);
    c.poser(geoCone(), M.satin, 0xd27a35, { x, y: 0.03, z }, { crasse: false, nuance: 0.06 });
    c.poser(geoCylY(0.115, 0.07, 6), M.satin, 0xe8e4da, { x, y: 0.3, z }, { crasse: false });
  }
}

// ---------- Une voiture ----------

/**
 * Une épave de voiture (repère local : avant vers +x). Spécification : x, z, ry (et y, rx, rz), type, couleur, rv/rv2/rv3
 * (tirages : vitres, pneus, rouille), charge (coffre, galerie, matelas, velos, cage, valises), porte {cote, pos}, mot
 * (région de l'atlas), siege (siège bébé vide posé au sol), phares (ils clignotent encore), ecran (l'écran autonome),
 * brulee, portesArriere (fourgon). Renvoie les points des phares (repère de la halte).
 */
function voiture(ctx, v, c = ctx.c, obst = true) {
  const { b, u } = ctx;
  const M = MATS;
  const T = TYPES[v.type];
  const coul = v.brulee ? 0x4a3a31 : teinteUsee(v.couleur, u);
  const casse = v.brulee || (v.rv ?? 0.5) < 0.1 + 0.45 * u;
  const plat = v.brulee || (v.rv2 ?? 0.5) < 0.2 + 0.5 * u;
  const yb0 = 0.27 - (plat ? 0.06 : 0);
  const yb1 = yb0 + T.hb;
  const vitre = casse ? 0x4d483f : 0x27323a;
  const matCaisse = v.brulee ? M.tole : M.satin;
  const lc = T.c1 - T.c0;
  const lt = lc - T.av - T.ar;
  const fourgon = v.type === "fourgon";
  const yt = yb1 + T.hc + (fourgon ? 0.06 : 0.05);
  const xr = fourgon ? (T.c0 + T.c1 - T.av) / 2 : T.c0 + T.ar + lt / 2;
  c.repere({ x: v.x, y: v.y ?? 0, z: v.z, ry: v.ry, rx: v.rx ?? 0, rz: v.rz ?? 0 }, () => {
    // La caisse, l'habitacle vitré (sombre), le pavillon
    c.poser(geoPrisme(T.l, T.hb, T.w, 0.12, 0.08, 0.04), matCaisse, coul, { y: (yb0 + yb1) / 2 });
    if (fourgon) {
      const xc = T.c1 - 1.25;
      c.boite(xc - T.c0, T.hc + 0.05, T.w - 0.04, coul, { x: (T.c0 + xc) / 2, y: yb1 + (T.hc + 0.05) / 2 }, matCaisse);
      c.poser(geoPrisme(1.25, T.hc, T.w - 0.1, T.av, 0, 0.08), M.lisse, vitre, { x: xc + 0.625, y: yb1 + T.hc / 2 }, { crasse: false });
      c.boite(1.25 - T.av + 0.02, 0.05, T.w - 0.26, coul, { x: xc + (1.25 - T.av) / 2, y: yb1 + T.hc + 0.015 }, matCaisse, { crasse: false });
    } else {
      c.poser(geoPrisme(lc, T.hc, T.w - 0.1, T.av, T.ar, 0.14), M.lisse, vitre, { x: (T.c0 + T.c1) / 2, y: yb1 + T.hc / 2 }, { crasse: false });
      c.boite(lt + 0.04, 0.05, T.w - 0.34, coul, { x: xr, y: yb1 + T.hc + 0.015 }, matCaisse, { crasse: false });
    }
    // Les montants (la caisse entre les vitres) et les rétroviseurs : l'habitacle se lit comme des vitres
    if (!fourgon) {
      const ytop = yb1 + T.hc;
      const zb = T.w / 2 - 0.05;
      const zh = T.w / 2 - 0.05 - 0.14;
      for (const s of [-1, 1]) {
        const xb = (T.c0 + T.c1) / 2 - 0.05;
        const xt = T.c0 + T.ar + lt * 0.48;
        c.poutre([xb, yb1, s * zb], [xt, ytop, s * zh], 0.08, coul, matCaisse, { crasse: false });
        c.poutre([T.c0 + 0.04, yb1, s * zb], [T.c0 + T.ar + 0.02, ytop, s * zh], 0.1, coul, matCaisse, { crasse: false });
        c.poutre([T.c1 - 0.04, yb1, s * zb], [T.c1 - T.av + 0.02, ytop, s * zh], 0.07, coul, matCaisse, { crasse: false });
        c.boite(0.12, 0.1, 0.16, coul, { x: T.c1 - 0.15, y: yb1 + 0.12, z: s * (T.w / 2 + 0.06) }, matCaisse, { crasse: false });
      }
    }
    // Pare-chocs, phares, feux
    c.boite(0.14, 0.24, T.w - 0.04, 0x38393a, { x: T.l / 2 - 0.02, y: yb0 + 0.12 }, M.satin);
    c.boite(0.14, 0.24, T.w - 0.04, 0x38393a, { x: -T.l / 2 + 0.02, y: yb0 + 0.12 }, M.satin);
    for (const s of [-1, 1]) {
      c.boite(0.05, 0.12, 0.34, casse ? 0x8d8a80 : 0xe8e2c8, { x: T.l / 2 - 0.06, y: yb1 - 0.15, z: s * (T.w / 2 - 0.28) }, M.lisse, { crasse: false });
      c.boite(0.05, 0.12, 0.3, 0x86392f, { x: -T.l / 2 + 0.05, y: yb1 - 0.13, z: s * (T.w / 2 - 0.25) }, M.lisse, { crasse: false });
    }
    // Les roues (à plat : la caisse s'est affaissée)
    const wx = T.l / 2 - 0.82;
    const wz = T.w / 2 - 0.13;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      c.poser(geoRoue(T.r), M.satin, v.brulee ? 0x3a3530 : 0x262626, { x: sx * wx, y: plat ? T.r * 0.84 : T.r, z: sz * wz, e: [1, plat ? 0.86 : 1, 1] }, { crasse: false });
      if (!v.brulee) c.poser(geoRoue(T.r * 0.55, 0.26, 6), M.metal, 0x9a9ea0, { x: sx * wx, y: plat ? T.r * 0.84 : T.r, z: sz * wz }, { crasse: false });
    }
    // La rouille qui mange les bas de caisse
    if ((v.rv3 ?? 0.5) < 0.15 + 0.4 * u || v.brulee) {
      for (const s of [-1, 1]) c.boite(T.l * 0.4, 0.16, 0.02, PALETTE.rouille, { x: -T.l * 0.12, y: yb0 + 0.12, z: s * (T.w / 2 + 0.006) }, M.tole, { nuance: 0.1 });
    }
    // Une portière ouverte
    if (v.porte) {
      const { cote, pos } = v.porte;
      const xh = pos === "av" ? T.c1 - 0.1 : (T.c0 + T.c1) / 2 - 0.05;
      const ld = pos === "av" ? 1.05 : 0.95;
      c.repere({ x: xh, y: yb0, z: cote * (T.w / 2), ry: cote * 1.0 }, () => {
        c.boite(ld, T.hb, 0.06, coul, { x: -ld / 2, y: T.hb / 2 }, matCaisse);
        if (!casse) c.boite(ld * 0.85, T.hc * 0.72, 0.03, vitre, { x: -ld * 0.52, y: T.hb + T.hc * 0.37 }, M.lisse, { crasse: false });
      });
      if (v.siege) siegeBebe(c, xh - ld * 0.6, 0, cote * (T.w / 2 + 0.95), cote * 0.6 + Math.PI / 2);
    }
    // Les portes arrière d'un fourgon, grandes ouvertes
    if (v.portesArriere) {
      for (const s of [-1, 1]) {
        c.repere({ x: -T.l / 2, y: yb0, z: s * (T.w / 2 - 0.02), ry: s * 1.89 }, () => {
          c.boite(0.05, T.hb + T.hc - 0.1, T.w / 2 - 0.04, coul, { y: (T.hb + T.hc - 0.1) / 2, z: (-s * (T.w / 2 - 0.04)) / 2 }, matCaisse);
        });
      }
      c.boite(0.05, T.hb + T.hc - 0.2, T.w - 0.2, 0x1e2022, { x: -T.l / 2 + 0.06, y: yb0 + (T.hb + T.hc) / 2 }, M.mat);
    }
    // Le chargement : tout ce qu'on a voulu emporter
    if (v.charge === "coffre") {
      c.poser(geoPrisme(1.7, 0.38, 0.84, 0.32, 0.22, 0.08), M.satin, (v.rv3 ?? 0.5) < 0.5 ? 0x2f3133 : 0xd5d3cb, { x: xr - 0.1, y: yt + 0.22 });
      for (const s of [-1, 1]) c.boite(0.05, 0.05, T.w - 0.3, 0x2b2b2b, { x: xr + s * 0.6, y: yt + 0.02 }, M.metal);
    } else if (v.charge === "galerie" || v.charge === "valises") {
      if (v.charge === "galerie") {
        for (const s of [-1, 1]) c.boite(0.05, 0.06, T.w - 0.26, 0x2b2b2b, { x: xr + s * 0.65, y: yt + 0.03 }, M.metal);
        for (const s of [-1, 1]) c.boite(1.5, 0.05, 0.05, 0x2b2b2b, { x: xr, y: yt + 0.08, z: s * (T.w / 2 - 0.2) }, M.metal);
      }
      const tons = [0x4a5a7a, 0x7a3b33, 0x2e2e30, 0xb59a6a, 0x5c6e52, 0x8a6f9a];
      const n = v.charge === "galerie" ? 4 : 2;
      for (let i = 0; i < n; i++) {
        const k = Math.floor((v.rv3 ?? 0.3) * 97 + i * 13) % tons.length;
        c.boite(0.62, 0.24, 0.42, tons[k], { x: xr - 0.5 + (i % 2) * 0.68, y: yt + 0.12 + (i > 1 ? 0.24 : 0), z: (i % 2 ? 0.2 : -0.22), ry: (i - 1.5) * 0.12 }, M.satin, { nuance: 0.06 });
      }
      if (v.charge === "galerie") {
        c.poser(geoPrisme(1.2, 0.4, 0.9, 0.12, 0.12, 0.12), M.toile, 0x3c5d8c, { x: xr + 0.15, y: yt + 0.68 }, { crasse: false });
        for (const s of [-0.35, 0.35]) c.boite(0.03, 0.03, T.w - 0.2, 0xc7a254, { x: xr + s, y: yt + 0.9 }, M.mat, { crasse: false });
      }
    } else if (v.charge === "matelas") {
      c.boite(1.95, 0.2, 1.35, 0xd8d1bf, { x: xr, y: yt + 0.11, rz: 0.03 }, M.toile, { crasse: false });
      c.boite(1.9, 0.02, 0.06, 0x8a9fb5, { x: xr, y: yt + 0.22, z: 0.4 }, M.toile, { crasse: false });
      for (const s of [-0.5, 0.5]) c.boite(0.04, 0.26, T.w - 0.05, 0xc7a254, { x: xr + s, y: yt + 0.1 }, M.mat, { crasse: false });
    } else if (v.charge === "velos") {
      c.boite(0.1, 0.1, 0.9, 0x2b2b2b, { x: -T.l / 2 - 0.2, y: 0.55 }, M.metal);
      velo(c, -T.l / 2 - 0.3, 0.32, 0, Math.PI / 2, 0x3d5f7a);
      velo(c, -T.l / 2 - 0.5, 0.32, 0.05, Math.PI / 2 + 0.06, 0x8a4a3a);
    } else if (v.charge === "cage") {
      cage(c, xr, yt, 0, 0.1);
    }
    // Le mot sur le pare-brise
    if (v.mot && !fourgon) {
      const phi = Math.atan2(T.av, T.hc);
      c.repere({ x: T.c1 - T.av / 2 + 0.02, y: yb1 + T.hc * 0.5, z: 0.25, rz: phi }, () => panneau(c, R[v.mot], { ry: Math.PI / 2, x: 0.012 }, 0.62, 0.39));
    }
    // La voiture autonome : barre lumineuse, lidar, et l'écran qui recalcule encore
    if (v.type === "luxe") {
      c.boite(0.04, 0.05, T.w - 0.3, 0xe8f4ff, { x: T.l / 2 - 0.06, y: yb1 - 0.07 }, M.lisse, { crasse: false });
      c.poser(geoCylY(0.13, 0.12, 8), M.satin, 0x1e1f22, { x: xr + 0.3, y: yt + 0.06 }, { crasse: false });
      if (v.ecran) {
        const phi = Math.atan2(T.av, T.hc);
        c.repere({ x: T.c1 - T.av / 2 + 0.02, y: yb1 + T.hc * 0.48, z: -0.1, rz: phi }, () => panneau(c, R.ecran, { ry: Math.PI / 2, x: 0.012 }, 0.7, 0.35, M.neon));
      }
    }
  });
  if (obst && !v.y) c.poser(geoCylY(1, 0.01, 7), MATS.mat, 0x3a3834, { x: v.x - 0.4 * Math.cos(v.ry), y: 0.012, z: v.z + 0.4 * Math.sin(v.ry), e: [T.l * 0.42, 1, T.w * 0.5], ry: v.ry }, { crasse: false, nuance: 0.05 });
  if (obst) rectObstacle(b, v.x, v.z, v.ry, -T.l / 2, T.l / 2, -T.w / 2, T.w / 2);
  if (v.phares) {
    return [-1, 1].map((s) => {
      const [px, pz] = versMonde(v.x, v.z, v.ry, T.l / 2 + 0.02, s * (T.w / 2 - 0.28));
      return [px, yb1 - 0.15, pz];
    });
  }
  return null;
}

/** Les phares d'une batterie qui s'épuise : ils clignotent, faiblement (un seul appel de dessin, animé). */
function pharesClignotants(ctx, points, ry) {
  const geos = [];
  for (const [x, y, z] of points) {
    geos.push(new THREE.BoxGeometry(0.06, 0.13, 0.36).rotateY(ry).translate(x + 0.01, y, z));
    // le halo au sol, devant
    const h = new THREE.CircleGeometry(1.1, 10).rotateX(-Math.PI / 2).scale(1.6, 1, 0.8).rotateY(ry);
    h.translate(x + 1.6 * Math.cos(ry), 0.03, z - 1.6 * Math.sin(ry));
    geos.push(h);
  }
  const geo = mergeGeometries(geos.map((g) => g.toNonIndexed()), false);
  const mat = new THREE.MeshBasicMaterial({ color: 0xfff0b8, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  mat.userData.sansOmbre = true;
  const m = new THREE.Mesh(geo, mat);
  m.renderOrder = 3;
  m.userData.animer = (t) => {
    const allume = Math.sin(t * 2.4) > 0.35 ? 1 : 0;
    mat.opacity = 0.05 + allume * (0.32 + 0.12 * Math.sin(t * 0.37));
  };
  ctx.b.ajouter(m);
  ctx.b.lumiere(points[0][0] + 1.2, 0.8, (points[0][2] + points[1][2]) / 2, 0xfff0c0, 2, 7, "phares d'une voiture : la batterie s'épuise, ils clignotent encore");
}

// ---------- Le sol, la route, les murs, les talus (continus, découpés à la bande du tronçon) ----------

function route(ctx) {
  const { b, c, u, x0, x1 } = ctx;
  const M = MATS;
  // L'enrobé : le sens de l'exode, plus sombre (huile, suie), le sens du retour, plus lessivé
  c.pave(x0, -0.06, Z.gba, x1, 0.01, Z.chaussee, 0xa9a8a3, M.asphalte, { crasse: false, nuance: 0 });
  c.pave(x0, -0.06, -Z.chaussee, x1, 0.01, -Z.gba, 0xb4b2ab, M.asphalte, { crasse: false, nuance: 0 });
  c.pave(x0, -0.06, -Z.gba, x1, 0.005, Z.gba, 0x8d8a82, M.mat, { crasse: false, nuance: 0 });
  // Le marquage, passé : lignes continues de rive et de bord, pointillés entre les voies
  const blanc = 0xcfcbbd;
  for (const s of [-1, 1]) {
    for (const zz of [1.0, 11.5]) c.pave(x0, 0.01, s * zz - 0.08, x1, 0.016, s * zz + 0.08, blanc, M.mat, { crasse: false, nuance: 0.02 });
    for (const zz of [4.5, 8.0]) {
      for (let k = Math.ceil(x0 / 13); k * 13 < x1; k++) {
        if (hache(k * 7 + zz * 3 + s) < 0.25 * u) continue; // effacé
        c.pave(k * 13, 0.01, s * zz - 0.07, k * 13 + 3, 0.016, s * zz + 0.07, blanc, M.mat, { crasse: false, nuance: 0.03 });
      }
    }
  }
  // Accotements en herbe sèche, entre glissière et mur ; piste en terre derrière le mur
  for (const s of [-1, 1]) {
    const [za, zb] = s > 0 ? [Z.chaussee, Z.mur] : [-Z.mur, -Z.chaussee];
    c.pave(x0, -0.06, za, x1, 0.008, zb, 0x97a062, M.mat, { crasse: false, nuance: 0 });
    const [zc, zd] = s > 0 ? [Z.mur, Z.piste] : [-Z.piste, -Z.mur];
    c.pave(x0, -0.06, zc, x1, 0.008, zd, 0x8d8670, M.mat, { crasse: false, nuance: 0 });
    b.obstacle(x0, s * Z.piste, x1, s * Z.piste, "talus");
  }
  // Le terre-plein central (GBA) : béton profilé, ses brèches
  for (const [a, bb] of intervalles(x0, x1, TROUS_GBA)) {
    c.pave(a, 0, -0.3, bb, 0.25, 0.3, 0xb4afa3, M.beton, { nuance: 0.02 });
    c.pave(a, 0.25, -0.13, bb, 0.82, 0.13, 0xbdb8ac, M.beton, { nuance: 0.02 });
    b.obstacle(a, 0, bb, 0, "terre-plein central");
  }
  for (const [t1, t2] of TROUS_GBA) {
    if (t2 <= x0 || t1 >= x1) continue;
    gravats(c, t1 + 0.3, 0.8, 0.9, 6, [0xb4afa3, 0x9a958a, 0x7c7870]);
    gravats(c, t2 - 0.3, -0.8, 0.8, 5, [0xb4afa3, 0x9a958a, 0x7c7870]);
  }
  // Les glissières : lisses en acier sur poteaux, avec leurs trous
  for (const s of [-1, 1]) {
    const trous = s > 0 ? TROUS_GLISSIERE_SUD : TROUS_GLISSIERE_NORD;
    for (const [a, bb] of intervalles(x0, x1, trous)) {
      c.pave(a, 0.48, s * Z.glissiere - 0.04, bb, 0.78, s * Z.glissiere + 0.04, 0x9ea4a4, M.metal, { nuance: 0.02, crasse: false });
      for (let k = Math.ceil((a - 2) / 4); k * 4 + 2 <= bb; k++) {
        const px = k * 4 + 2;
        if (px < a) continue;
        c.boite(0.1, 0.75, 0.12, 0x7f8486, { x: px, y: 0.37, z: s * (Z.glissiere + 0.08) }, M.tole);
      }
      b.obstacle(a, s * Z.glissiere, bb, s * Z.glissiere, "glissière");
    }
  }
}

function murs(ctx) {
  const { b, c, u, x0, x1 } = ctx;
  const M = MATS;
  for (let xa = Math.ceil(x0 / 4) * 4; xa < x1; xa += 4) {
    const xb = xa + 4;
    if (xb > 19.5 && xa < 30.5) continue; // les culées du pont
    const h = hache(xa);
    // Nord : panneaux de béton gris, poteaux en H
    {
      const z = -Z.mur;
      c.boite(0.22, 4.25, 0.22, 0x6b6f70, { x: xa, y: 2.12, z }, M.tole);
      if (h < 0.1 * u) {
        c.pave(xa + 0.1, 0, z - 0.13, xb - 0.1, 1.6 + h * 8, z + 0.13, 0xc6c2b8, M.mat, { nuance: 0.03 });
        gravats(c, xa + 2, z + 1.2, 1.2, 7, [0xb5b0a5, 0x9a958a]);
      } else {
        c.pave(xa + 0.1, 0, z - 0.13, xb - 0.1, 4, z + 0.13, 0xc6c2b8, M.mat, { nuance: 0.03 });
        if (hache(xa + 3) < 0.25) c.pave(xa + 0.6, 1.1, z + 0.13, xa + 2.4 + hache(xa + 5) * 1.2, 2.2, z + 0.14, [0x6f8a9a, 0x9a6a5a, 0x7a7a5a][Math.floor(hache(xa + 9) * 3)], M.mat, { crasse: false });
      }
      b.obstacle(xa, z, xb, z, "mur antibruit");
    }
    // Sud : socle de béton et panneaux transparents (on voit l'autoroute depuis le talus), des vitres tombées
    {
      const z = Z.mur;
      const tombe = MUR_SUD_TOMBE.includes(xa);
      c.boite(0.22, tombe ? 2.6 : 4.0, 0.22, 0x6b6f70, { x: xa, y: tombe ? 1.2 : 2, z, rz: tombe ? (h - 0.5) * 0.6 : 0, rx: tombe ? 0.25 : 0 }, M.tole);
      if (tombe) {
        gravats(c, xa + 2, z - 0.2, 1.1, 6, [0xb5b0a5, 0x9a958a]);
        debris(c, xa, z - 1.5, xb, z + 1, 10, [0xc9d6da, 0xb8c6ca]);
        continue;
      }
      c.pave(xa + 0.1, 0, z - 0.15, xb - 0.1, 0.6, z + 0.15, 0xb5b0a5, M.beton, { nuance: 0.03 });
      if (h > 0.15 + 0.3 * u) c.pave(xa + 0.12, 0.6, z - 0.03, xb - 0.12, 3.6, z + 0.03, 0xffffff, M.verre, { crasse: false, nuance: 0 });
      else if (h > 0.08) c.pave(xa + 0.12, 0.6, z - 0.03, xb - 0.12, 1.5 + h * 6, z + 0.03, 0xffffff, M.verre, { crasse: false, nuance: 0 });
      else debris(c, xa, z - 1.2, xb, z - 0.2, 6, [0xc9d6da, 0xb8c6ca]);
      c.pave(xa + 0.1, 3.6, z - 0.06, xb - 0.1, 3.72, z + 0.06, 0x7f8486, M.tole);
      b.obstacle(xa, z, xb, z, "mur antibruit");
    }
  }
  // Le pied des murs : l'herbe gagne
  semerTouffes(c, x0, -Z.mur + 0.3, x1, -Z.mur + 1.2, Math.round(6 + 10 * u), PALETTE.herbeSeche);
  semerTouffes(c, x0, Z.mur - 1.2, x1, Z.mur - 0.3, Math.round(6 + 10 * u), PALETTE.herbeSeche);
}

function talus(ctx) {
  const { c, x0, x1 } = ctx;
  const M = MATS;
  const nx = Math.max(2, Math.round((x1 - x0) / 2.5));
  const zs = [Z.piste, 25, 27, 29, 31, Z.haut, Z.bord];
  for (const s of [-1, 1]) {
    for (const [j0, j1, teinte] of [[0, 3, 0x9aa463], [3, 6, 0x7f9a55]]) {
      const pos = [];
      for (let i = 0; i < nx; i++) {
        const xa = x0 + ((x1 - x0) * i) / nx;
        const xb = x0 + ((x1 - x0) * (i + 1)) / nx;
        for (let j = j0; j < j1; j++) {
          const za = s * zs[j];
          const zb = s * zs[j + 1];
          const A = [xa, hauteurTalus(xa, za), za];
          const B = [xa, hauteurTalus(xa, zb), zb];
          const C = [xb, hauteurTalus(xb, za), za];
          const D = [xb, hauteurTalus(xb, zb), zb];
          if (s > 0) pos.push(...A, ...B, ...C, ...C, ...B, ...D);
          else pos.push(...A, ...C, ...B, ...C, ...D, ...B);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.computeVertexNormals();
      c.poser(g, M.mat, teinte, {}, { nuance: 0.02 });
      g.dispose();
    }
    // La tranche du talus, au bord du lot
    c.pave(x0, -1.2, s > 0 ? Z.bord - 0.05 : -Z.bord, x1, HAUT_TALUS, s > 0 ? Z.bord : -Z.bord + 0.05, 0x7d6143, M.mat, { crasse: false, nuance: 0 });
  }
  // Les bouts de la halte : la coupe de la route et des talus
  for (const xe of [-100, 100]) {
    if (xe < x0 - 0.01 || xe > x1 + 0.01) continue;
    c.pave(xe - 0.03, -1.2, -Z.piste, xe + 0.03, 0, Z.piste, 0x6f5a40, M.mat, { crasse: false, nuance: 0 });
    for (const s of [-1, 1]) {
      const pos = [];
      for (let j = 0; j < zs.length - 1; j++) {
        const za = s * zs[j];
        const zb = s * zs[j + 1];
        const ya = hauteurTalus(xe, za);
        const yb = hauteurTalus(xe, zb);
        pos.push(xe, -1.2, za, xe, -1.2, zb, xe, yb, zb, xe, -1.2, za, xe, yb, zb, xe, ya, za);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.computeVertexNormals();
      c.poser(g, M.toile, 0x7d6143, {}, { crasse: false, nuance: 0 });
      g.dispose();
    }
  }
}

/** Les arbres et les buissons des talus (une liste stable pour toute la halte). */
const ARBRES = (() => {
  const A = aleatoire(77);
  const l = [];
  for (const s of [-1, 1]) {
    for (let x = -98 + A() * 3; x < 98; x += 4.5 + A() * 5) {
      if (x > 17 && x < 33) continue;
      // Au sud (côté caméra), les arbres restent en haut du talus et plus bas : ils ne doivent pas cacher la route.
      const az = s > 0 ? 31 + A() * 3.4 : 26.5 + A() * 8;
      const q = A();
      const h = s > 0 ? 4 + A() * 2.5 : 5 + A() * 4.5;
      l.push({ x, z: s * Math.min(34.3, az), h, essence: q < 0.22 ? "bouleau" : q < 0.3 ? "mort" : "feuillu", buisson: A() < (s > 0 ? 0.5 : 0.35) });
    }
  }
  return l;
})();

function vegetation(ctx) {
  const { c, u, x0, x1 } = ctx;
  for (const a of ARBRES) {
    if (a.x < x0 || a.x >= x1) continue;
    const y = hauteurTalus(a.x, a.z);
    if (a.buisson) arbuste(c, a.x, a.z, 1.2 + (a.h - 5) * 0.2, y - 0.2);
    else arbre(c, a.x, a.z, a.h, a.essence, y - 0.1);
  }
  // L'herbe dans les fissures : beaucoup sur le sens vide, un peu entre les voitures, une ligne le long du terre-plein
  semerTouffes(c, x0, -Z.chaussee + 0.5, x1, -1, Math.round(10 + 34 * u), PALETTE.herbeSeche);
  semerTouffes(c, x0, 1.2, x1, Z.chaussee - 0.3, Math.round(5 + 14 * u), PALETTE.herbeSeche);
  semerTouffes(c, x0, -0.55, x1, -0.35, Math.round(4 + 10 * u), PALETTE.herbe);
  semerTouffes(c, x0, 0.35, x1, 0.55, Math.round(4 + 10 * u), PALETTE.herbe);
  semerTouffes(c, x0, 15.6, x1, 19.5, Math.round(6 + 12 * u), PALETTE.herbe);
  semerTouffes(c, x0, -19.5, x1, -15.6, Math.round(6 + 12 * u), PALETTE.herbe);
  // De jeunes arbres ont pris racine dans le terre-plein et sur le sens vide
  if (u > 0.45) {
    const n = Math.round((u - 0.45) * 8);
    for (let i = 0; i < n; i++) {
      const x = x0 + hache(x0 * 3 + i * 17) * (x1 - x0);
      const z = -2 - hache(x0 + i * 29) * 11;
      arbuste(c, x, z, 0.5 + hache(i + x0) * 0.5);
    }
  }
  // Feuilles mortes et papiers
  jonchee(c, x0, -Z.chaussee, x1, -1, Math.round(20 + 30 * u));
  jonchee(c, x0, 1, x1, Z.chaussee, Math.round(14 + 20 * u), [0x9c7a45, 0xd9d4c4, 0xb08f55, 0xe8e2d0]);
}

// ---------- Les véhicules à part ----------

function voitureAutonome(ctx) {
  const v = { x: -78, z: 6.25, ry: 0.03, type: "luxe", couleur: 0xe8e6e0, rv: 0.99, rv2: 0.99, rv3: 0.99, ecran: true };
  voiture(ctx, v);
  ctx.b.lumiere(-75, 1.3, 6.1, 0x6fdcff, 1.6, 5, "écran de la voiture autonome : « Recalcul de l'itinéraire… »");
}

function ambulance(ctx) {
  const { c } = ctx;
  const M = MATS;
  const x = -41;
  const z = 13.1;
  const ry = 0.05;
  voiture(ctx, { x, z, ry, type: "fourgon", couleur: 0xe8e6de, rv: 0.6, rv2: 0.95, rv3: 0.95, portesArriere: true });
  const T = TYPES.fourgon;
  c.repere({ x, z, ry }, () => {
    for (const s of [-1, 1]) {
      c.boite(T.l * 0.7, 0.22, 0.02, 0x2f6f73, { x: -0.5, y: 0.95, z: s * (T.w / 2 + 0.01) }, M.satin, { crasse: false });
      c.boite(0.36, 0.1, 0.02, 0xb8413a, { x: -1.3, y: 1.75, z: s * (T.w / 2 + 0.03) }, M.satin, { crasse: false });
      c.boite(0.1, 0.36, 0.02, 0xb8413a, { x: -1.3, y: 1.75, z: s * (T.w / 2 + 0.03) }, M.satin, { crasse: false });
    }
    for (const s of [-1, 1]) c.boite(0.22, 0.14, 0.32, 0x3d5f9a, { x: 1.0, y: 2.66, z: s * 0.6 }, M.lisse, { crasse: false });
    // Le brancard sorti, abandonné derrière, sa couverture orange
    c.repere({ x: -T.l / 2 - 1.5, z: 0.3, ry: 0.4 }, () => {
      c.boite(1.9, 0.05, 0.56, 0x9da3a6, { y: 0.62 }, M.metal);
      c.boite(1.7, 0.1, 0.5, 0xd27a35, { y: 0.69 }, M.toile, { crasse: false });
      for (const [a, d] of [[-0.8, -0.22], [0.8, -0.22], [-0.8, 0.22], [0.8, 0.22]]) c.boite(0.04, 0.6, 0.04, 0x9da3a6, { x: a, y: 0.3, z: d }, M.metal);
    });
  });
  ctx.b.obstacle(x - T.l / 2 - 2.5, z - 0.4, x - T.l / 2 - 0.6, z + 0.9, "brancard");
}

function depanneuse(ctx) {
  const { b, c, u } = ctx;
  const M = MATS;
  const x = -12.5;
  const z = -6.4;
  const ry = Math.PI + 0.06;
  const coul = teinteUsee(0xd8b04a, u, 1.4);
  c.repere({ x, z, ry }, () => {
    // Le châssis, la cabine (à l'avant, vers l'ouest), le plateau incliné
    c.pave(-3.6, 0.35, -0.9, 3.4, 0.75, 0.9, 0x2e2f30, M.tole);
    c.poser(geoPrisme(1.9, 1.7, 2.3, 0.25, 0, 0.08), M.satin, coul, { x: 2.5, y: 1.55 });
    c.boite(0.05, 0.75, 2.0, 0x27323a, { x: 3.33, y: 1.85 }, M.lisse, { crasse: false });
    c.boite(0.25, 0.16, 1.6, 0xd27a35, { x: 2.4, y: 2.47 }, M.lisse, { crasse: false });
    for (const [wx, s] of [[2.3, -1], [2.3, 1], [-1.6, -1], [-1.6, 1], [-2.7, -1], [-2.7, 1]]) c.poser(geoRoue(0.48, 0.32), M.satin, 0x262626, { x: wx, y: 0.42, z: s * 1.0, e: [1, 0.88, 1] }, { crasse: false });
    c.repere({ x: -0.9, y: 1.05, rz: -0.08 }, () => {
      c.pave(-3.2, -0.08, -1.15, 2.0, 0.08, 1.15, 0x6f7375, M.tole);
      for (const s of [-1, 1]) c.pave(-3.2, 0.08, s * 1.15 - 0.05, 2.0, 0.22, s * 1.15 + 0.05, 0x55595b, M.tole);
    });
    // La voiture qu'elle n'a jamais livrée
    voiture(ctx, { x: -1.0, y: 1.2, z: 0, ry: Math.PI, rz: 0.08, type: "berline", couleur: 0x7b4a45, rv: 0.2, rv2: 0.1, rv3: 0.2 }, c, false);
    // Le bras de levage replié
    c.poutre([-3.4, 0.8, 0], [-3.9, 2.0, 0], 0.18, coul, M.tole);
    c.poutre([-3.9, 2.0, 0], [-4.2, 1.2, 0], 0.08, 0x3a3a3a, M.metal);
  });
  rectObstacle(b, x, z, ry, -4.3, 3.4, -1.2, 1.2);
}

function campingCar(ctx) {
  const { b, c, u } = ctx;
  const M = MATS;
  const x = 7;
  const z = 9.75;
  const ry = 0.03;
  const blanc = teinteUsee(0xe6e2d6, u);
  c.repere({ x, z, ry }, () => {
    // Cabine d'utilitaire à l'avant, cellule à l'arrière, capucine au-dessus de la cabine
    c.poser(geoPrisme(1.7, 1.1, 2.1, 0.5, 0, 0.06), M.satin, blanc, { x: 2.65, y: 1.2 });
    c.boite(1.5, 0.75, 2.12, blanc, { x: 2.55, y: 0.55 }, M.satin);
    c.poser(geoPrisme(1.4, 0.55, 2.0, 0.4, 0, 0.05), M.lisse, 0x27323a, { x: 2.75, y: 1.45 }, { crasse: false });
    c.pave(-3.5, 0.45, -1.15, 1.8, 3.0, 1.15, blanc, M.satin);
    c.pave(1.8, 2.25, -1.15, 3.0, 3.0, 1.15, blanc, M.satin);
    c.pave(-3.5, 0.95, -1.16, 1.8, 1.08, 1.16, 0x7a8a8c, M.satin, { crasse: false });
    // Fenêtres, porte ouverte au sud (sous l'auvent)
    for (const [a, bb] of [[-3.0, -2.0], [-0.6, 0.6]]) for (const s of [-1, 1]) c.pave(a, 1.5, s * 1.16 - 0.01, bb, 2.2, s * 1.16 + 0.01, 0x2d3438, M.lisse, { crasse: false });
    c.pave(-1.7, 0.5, 1.15, -1.0, 2.4, 1.17, 0x1d1f20, M.mat);
    c.repere({ x: -1.7, y: 0.5, z: 1.17, ry: 1.3 }, () => c.boite(0.68, 1.9, 0.04, blanc, { x: 0.34, y: 0.95 }, M.satin));
    for (const [wx, s] of [[2.4, -1], [2.4, 1], [-1.9, -1], [-1.9, 1]]) c.poser(geoRoue(0.36), M.satin, 0x262626, { x: wx, y: 0.32, z: s * 1.05, e: [1, 0.86, 1] }, { crasse: false });
    // Le toit : panneau solaire, lanterneau, échelle arrière
    c.pave(-2.8, 3.0, -0.8, -1.2, 3.05, 0.6, 0x26303a, M.lisse, { crasse: false });
    c.pave(0, 3.0, -0.35, 0.7, 3.15, 0.35, 0xcfcac0, M.satin);
    for (const s of [-1, 1]) c.poutre([-3.55, 0.6, s * 0.25], [-3.55, 3.0, s * 0.25], 0.04, 0x8b9093, M.metal);
    // L'auvent déroulé, deux jambes, la table, les chaises : ils ont attendu ici
    c.pave(-3.2, 2.6, 1.15, 1.2, 2.72, 1.32, 0x7f8486, M.tole);
    const dechire = u > 0.75;
    c.boite(4.4, 0.03, 2.3, 0x4f7f78, { x: -1.0, y: 2.48, z: 2.3, rx: 0.1, e: [1, 1, dechire ? 0.7 : 1] }, M.toile, { crasse: false });
    if (dechire) c.boite(1.6, 0.9, 0.02, 0x4f7f78, { x: 0.3, y: 2.0, z: 3.2, rx: 0.3 }, M.toile, { crasse: false });
    for (const xa of [-3.1, 1.1]) c.poutre([xa, 0, 3.4], [xa, 2.45, 3.4], 0.04, 0x8b9093, M.metal);
    table(c, -1.0, 2.6, 0.1, 1.0, 0.6);
    chaise(c, -1.9, 2.7, 0.1, 0x3d5a6e);
    chaise(c, -0.1, 2.5, Math.PI + 0.3, 0x6e4a3d, u > 0.6);
    c.boite(0.5, 0.04, 0.3, 0x2e2e2e, { x: 0.4, y: 0.6, z: 3.0 }, M.metal);
    for (const s of [-1, 1]) c.boite(0.03, 0.6, 0.03, 0x2e2e2e, { x: 0.4 + s * 0.2, y: 0.3, z: 3.0 }, M.metal);
    velo(c, -3.75, 0.3, -0.3, Math.PI / 2, 0x5a7a5a);
    velo(c, -3.95, 0.3, 0.25, Math.PI / 2 + 0.08, 0x9a8a4a);
    jerrican(c, -2.8, 2.0, 0.4);
    cage(c, 0.9, 0, 1.8, 0.6);
  });
  rectObstacle(b, x, z, ry, -4.1, 3.6, -1.2, 1.2);
}

function autocar(ctx) {
  const { b, c, u } = ctx;
  const M = MATS;
  const x = 46;
  const z = 6.25;
  const ry = -0.04;
  const l = 12;
  const w = 2.55;
  const coul = teinteUsee(0xe7e1d2, u);
  c.repere({ x, z, ry }, () => {
    c.pave(-l / 2, 0.38, -w / 2, l / 2, 1.42, w / 2, coul, M.satin);
    c.poser(geoPrisme(l, 1.6, w, 0.35, 0.1, 0.06), M.lisse, 0x2a3236, { y: 2.22 }, { crasse: false });
    c.pave(-l / 2 + 0.1, 3.0, -w / 2 + 0.06, l / 2 - 0.4, 3.32, w / 2 - 0.06, coul, M.satin, { crasse: false });
    // Livrée et rideaux tirés derrière les vitres
    for (const s of [-1, 1]) {
      c.pave(-l / 2, 1.3, s * (w / 2) - 0.01, l / 2, 1.44, s * (w / 2) + 0.01, 0x2f6f73, M.satin, { crasse: false });
      for (let k = 0; k < 9; k++) c.pave(-l / 2 + 0.8 + k * 1.25, 1.5, s * (w / 2 - 0.08) - 0.01, -l / 2 + 1.25 + k * 1.25, 2.85, s * (w / 2 - 0.08) + 0.01, 0x9a8a6a, M.toile, { crasse: false });
    }
    panneau(c, R.voyages, { x: -1.5, y: 0.9, z: w / 2 + 0.012 }, 2.2, 0.82);
    // La soute ouverte au sud : les portes relevées, les valises par terre
    c.pave(-4.4, 0.42, w / 2 - 0.4, -0.4, 1.22, w / 2 + 0.005, 0x1b1c1d, M.mat);
    for (const xa of [-3.4, -1.4]) c.boite(1.9, 0.04, 0.8, coul, { x: xa, y: 1.42, z: w / 2 + 0.4, rx: 0.15 }, M.satin);
    const tons = [0x4a5a7a, 0x7a3b33, 0x2e2e30, 0xb59a6a, 0x5c6e52, 0x8a6f9a, 0x6a6f74];
    for (let i = 0; i < 6; i++) valise(c, -4.2 + i * 0.7, w / 2 + 1.0 + (i % 2) * 0.6, i * 0.7, tons[i], i % 3 === 0);
    // La porte avant ouverte, les roues
    c.pave(l / 2 - 1.4, 0.4, w / 2 - 0.02, l / 2 - 0.5, 2.8, w / 2 + 0.01, 0x15171a, M.mat);
    for (const wx of [l / 2 - 2.2, -l / 2 + 3.2, -l / 2 + 2.0]) for (const s of [-1, 1]) c.poser(geoRoue(0.5, 0.3), M.satin, 0x262626, { x: wx, y: 0.44, z: s * (w / 2 - 0.12), e: [1, 0.88, 1] }, { crasse: false });
    c.boite(0.12, 0.3, w - 0.1, 0x38393a, { x: l / 2 + 0.04, y: 0.55 }, M.satin);
  });
  rectObstacle(b, x, z, ry, -l / 2, l / 2, -w / 2, w / 2);
}

function camionLivraison(ctx) {
  const { b, c, u } = ctx;
  const M = MATS;
  const x = 56;
  const z = 9.75;
  const ry = 0.06;
  const blanc = teinteUsee(0xe9e5da, u);
  c.repere({ x, z, ry }, () => {
    c.pave(-3.7, 0.4, -0.9, 3.7, 0.85, 0.9, 0x2e2f30, M.tole);
    c.poser(geoPrisme(1.9, 1.75, 2.3, 0.35, 0, 0.08), M.satin, blanc, { x: 2.75, y: 1.6 });
    c.boite(0.05, 0.75, 2.0, 0x27323a, { x: 3.53, y: 1.92 }, M.lisse, { crasse: false });
    for (const [wx, s] of [[2.6, -1], [2.6, 1], [-2.2, -1], [-2.2, 1]]) c.poser(geoRoue(0.45, 0.3), M.satin, 0x262626, { x: wx, y: 0.4, z: s * 1.0, e: [1, 0.88, 1] }, { crasse: false });
    // La caisse : plancher, toit, face nord et avant entières ; flanc sud arraché, portes arrière ouvertes
    c.pave(-3.75, 0.85, -1.2, 1.7, 1.0, 1.2, 0x5a5c5e, M.tole);
    c.pave(-3.75, 3.4, -1.2, 1.7, 3.5, 1.2, blanc, M.satin);
    c.pave(-3.75, 1.0, -1.2, 1.7, 3.4, -1.14, blanc, M.satin);
    c.pave(1.62, 1.0, -1.2, 1.7, 3.4, 1.2, blanc, M.satin);
    c.pave(-3.75, 2.9, 1.14, 1.7, 3.4, 1.2, blanc, M.satin);
    for (const [a, bb] of [[1.2, 1.7], [-3.75, -3.3]]) c.pave(a, 1.0, 1.14, bb, 2.9, 1.2, blanc, M.satin);
    panneau(c, R.livraison, { x: -1.0, y: 3.15, z: -1.21, ry: Math.PI }, 4.8, 0.5);
    // Le flanc arraché, plié vers le sol, avec la livrée
    c.repere({ x: -1.0, y: 2.9, z: 1.2, rx: 1.25 }, () => {
      c.boite(4.2, 0.03, 2.6, blanc, { z: 1.3 }, M.satin);
      panneau(c, R.livraison, { y: 0.02, z: 1.3, rx: -Math.PI / 2 }, 4.0, 0.75);
    });
    c.repere({ x: -3.75, y: 1.0, z: -1.15, ry: -1.75 }, () => c.boite(0.04, 2.35, 1.15, blanc, { y: 1.18, z: 0.58 }, M.satin));
    c.boite(1.2, 0.04, 2.3, blanc, { x: -5.0, y: 0.03, z: 0.4, ry: 0.3 }, M.satin);
    // Ce qui reste dedans
    for (let i = 0; i < 9; i++) {
      const s = 0.4 + hache(i * 3) * 0.3;
      boiteImprimee(c, R.carton, s, s * 0.8, s, 0xffffff, { x: -3.2 + (i % 5) * 0.9, y: 1.0 + s * 0.4 + (i > 4 ? 0.7 : 0), z: -0.6 + hache(i) * 0.6, ry: hache(i * 7) });
    }
  });
  // Les colis éventrés au sol, les calages, et quelques Watty en peluche (les « cadeaux de bienvenue »)
  for (let i = 0; i < 14; i++) {
    const s = 0.35 + hache(i * 5 + 1) * 0.35;
    const px = x - 3.5 + hache(i * 11) * 6;
    const pz = z + 1.9 + hache(i * 13) * 2.4;
    boiteImprimee(c, R.carton, s, s * 0.75, s * 0.9, i % 4 ? 0xffffff : 0xd8d0c0, { x: px, y: s * 0.37, z: pz, ry: hache(i * 3) * 3, rz: i % 5 === 0 ? 1.4 : 0 });
  }
  debris(c, x - 4, z + 1.6, x + 2, z + 4.6, 30, [0xf2f0ea, 0xe8e6e0, 0xd9d6cc]);
  for (let i = 0; i < 4; i++) {
    const px = x - 2 + i * 1.3;
    const pz = z + 4.4 + hache(i) * 0.8;
    c.poser(geoCylY(0.11, 0.26, 7), M.satin, 0xd9b84a, { x: px, y: 0.11, z: pz, rz: Math.PI / 2, ry: i }, { crasse: false });
  }
  rectObstacle(b, x, z, ry, -3.8, 3.7, -1.25, 1.25);
}

// ---------- Le carambolage (goulet n° 1) ----------

function navette(ctx) {
  const { b, c, u } = ctx;
  const M = MATS;
  const { x0, x1, z, w } = BUS;
  const xm = (x0 + x1) / 2;
  const hw = w / 2;
  const coul = teinteUsee(0xdcd7c8, u);
  const canard = 0x2f6f73;
  const toit = b.couche("toit de la navette", { x: xm, z, l: x1 - x0 + 0.4, p: w + 0.4 }, 2.2, 3.8);
  const yw0 = 0.95;
  const yw1 = 2.3;
  const yt = 2.95;
  const zn = z - hw;
  const zs = z + hw;
  const porte = [x0 + 0.6, x0 + 1.7];
  const issue = [z - 0.5, z + 0.5];
  // Le plancher bas, les flancs sous les vitres
  c.pave(x0 + 0.08, 0, zn + 0.08, x1 - 0.08, 0.06, zs - 0.08, 0x45474a, M.satin);
  for (const [a, bb] of [[x0, porte[0]], [porte[1], x1]]) {
    c.pave(a, 0.06, zn, bb, yw0, zn + 0.08, coul, M.satin);
    c.pave(a, yw0 - 0.24, zn - 0.01, bb, yw0 - 0.06, zn, canard, M.satin, { crasse: false });
  }
  c.pave(x0, 0.06, zs - 0.08, x1, yw0, zs, coul, M.satin);
  c.pave(x0, yw0 - 0.24, zs, x1, yw0 - 0.06, zs + 0.01, canard, M.satin, { crasse: false });
  c.pave(x0, 0.06, zn - 0.01, x1, 0.32, zs + 0.01, 0x38393a, M.satin);
  // La bande vitrée : montants, vitres entières, cassées ou cartonnées par ceux qui y ont dormi
  const nb = 8;
  for (let i = 0; i <= nb; i++) {
    const px = x0 + 0.1 + (i * (x1 - x0 - 0.2)) / nb;
    for (const [za, zb] of [[zn, zn + 0.08], [zs - 0.08, zs]]) {
      if (za < z && px > porte[0] - 0.1 && px < porte[1] + 0.1) continue;
      c.pave(px - 0.07, yw0, za, px + 0.07, yw1, zb, coul, M.satin);
    }
    if (i === nb) break;
    const pa = px + 0.07;
    const pb = x0 + 0.1 + ((i + 1) * (x1 - x0 - 0.2)) / nb - 0.07;
    for (const [s, zv] of [[-1, zn + 0.04], [1, zs - 0.04]]) {
      if (s < 0 && pb > porte[0] && pa < porte[1]) continue;
      const r = hache(i * 5 + s * 3);
      if (r > 0.25 + 0.4 * u) c.pave(pa, yw0, zv - 0.015, pb, yw1, zv + 0.015, 0xffffff, M.verre, { crasse: false, nuance: 0 });
      else if (r < 0.2) c.pave(pa, yw0 + 0.05, zv - 0.03, pb, yw1 - 0.1, zv + 0.03, 0xa88a62, M.mat, { nuance: 0.08 });
    }
  }
  // L'avant (à l'ouest) : pare-brise étoilé, la girouette figée sur « ÉVACUATION »
  c.pave(x0 - 0.08, 0.06, zn, x0, yw0, zs, coul, M.satin);
  c.pave(x0 - 0.16, 0.25, zn - 0.02, x0 - 0.06, 0.5, zs + 0.02, 0x38393a, M.satin);
  c.pave(x0 - 0.05, yw0, zn + 0.1, x0 - 0.03, 2.55, z + 0.3, 0xffffff, M.verre, { crasse: false, nuance: 0 });
  for (const s of [-1, 1]) c.pave(x0 - 0.08, yw0, s > 0 ? zs - 0.12 : zn, x0, yw1, s > 0 ? zs : zn + 0.12, coul, M.satin);
  // L'arrière (à l'est) : l'issue de secours, porte grande ouverte
  c.pave(x1, 0.06, zn, x1 + 0.08, 2.1, issue[0], coul, M.satin);
  c.pave(x1, 0.06, issue[1], x1 + 0.08, 2.1, zs, coul, M.satin);
  c.pave(x1, 2.1, zn, x1 + 0.08, yw1, zs, coul, M.satin);
  c.repere({ x: x1 + 0.06, y: 0.06, z: issue[1], ry: -1.35 }, () => {
    c.boite(0.05, 2.0, 1.0, coul, { y: 1.0, z: -0.5 }, M.satin);
    c.boite(0.02, 0.18, 0.6, 0xc8362b, { x: 0.035, y: 1.6, z: -0.5 }, M.satin, { crasse: false });
  });
  caisse(c, x1 + 0.6, z, 0.2, 0.6, 0.3, 0.5, 0x7a6a50);
  // Les roues (crevées) et les passages de roues
  for (const wx of [x0 + 2.3, x1 - 3.0]) for (const zz of [zn + 0.15, zs - 0.15]) c.poser(geoRoue(0.5, 0.32, 10), M.satin, 0x262626, { x: wx, y: 0.36, z: zz, e: [1, 0.8, 1] }, { crasse: false });
  // Dedans : les sièges de part et d'autre de l'allée, le poste du chauffeur, les affaires des passagers
  const bleu = 0x4c5a78;
  for (let xs = x0 + 2.2; xs < x1 - 0.6; xs += 0.85) {
    for (const s of [-1, 1]) {
      const r = hache(xs * 13 + s);
      if (r < 0.08) continue;
      const zc = z + s * 0.75;
      const pench = r > 0.9 ? 0.4 : 0;
      c.boite(0.46, 0.12, 0.76, bleu, { x: xs, y: 0.46, z: zc }, M.satin, { nuance: 0.06 });
      c.boite(0.1, 0.62, 0.76, bleu, { x: xs + 0.22, y: 0.8, z: zc, rz: -0.12 - pench }, M.satin, { nuance: 0.06 });
      c.boite(0.3, 0.4, 0.1, 0x55595b, { x: xs, y: 0.2, z: z + s * 1.05 }, M.metal);
      if (r > 0.55 && r < 0.75) sac(c, xs - 0.05, zc, r * 9, [0x6a4a3a, 0x3a4a5a, 0x5a6a3a][Math.floor(r * 30) % 3], 0.52);
      if (r > 0.3 && r < 0.42) c.boite(0.5, 0.06, 0.7, [0x8a5a4a, 0x6a7a8a, 0xa8935a][Math.floor(r * 40) % 3], { x: xs, y: 0.55, z: zc, ry: 0.2 }, M.toile, { crasse: false, nuance: 0.1 });
    }
  }
  c.boite(0.5, 0.12, 0.55, 0x2e2e30, { x: x0 + 0.95, y: 0.5, z: z + 0.65 }, M.satin);
  c.boite(0.1, 0.65, 0.55, 0x2e2e30, { x: x0 + 1.2, y: 0.85, z: z + 0.65 }, M.satin);
  c.boite(0.6, 0.85, 1.1, 0x3a3c3e, { x: x0 + 0.35, y: 0.45, z: z + 0.55 }, M.satin);
  c.poser(geoCylY(0.22, 0.04, 10), M.satin, 0x1e1e1e, { x: x0 + 0.6, y: 1.05, z: z + 0.65, rz: 1.1 }, { crasse: false });
  c.boite(1.9, 0.12, 0.62, 0x5a6a3a, { x: x1 - 1.4, y: 0.12, z: z - 0.05, ry: 0.05 }, M.toile, { crasse: false });
  for (let i = 0; i < 4; i++) c.poser(geoCylY(0.04, 0.26, 6), M.lisse, 0xcfe0e8, { x: x0 + 3 + i * 1.9, y: 0.19, z: z + (i % 2 ? 0.2 : -0.15) }, { crasse: false });
  // La lampe de camping à piles, sur le dernier siège
  c.boite(0.12, 0.2, 0.12, 0xdde6ee, { x: x1 - 0.8, y: 0.62, z: z + 0.75 }, M.lisse, { crasse: false });
  b.lumiere(x1 - 0.8, 1.1, z + 0.4, 0xe2ecff, 2.2, 6, "lampe de camping à piles, au fond de la navette");
  // Le haut de caisse, le toit, et ce qu'on y a monté : matelas, échelle remontée, lanterne (un poste de guet)
  for (const [za, zb] of [[zn, zn + 0.08], [zs - 0.08, zs]]) toit.pave(x0, yw1, za, x1, yt, zb, coul, M.satin);
  toit.pave(x0 - 0.08, yw1, zn, x0, yt, zs, coul, M.satin);
  toit.pave(x1, yw1, zn, x1 + 0.08, yt, zs, coul, M.satin);
  panneau(toit, R.evacuation, { x: x0 - 0.1, y: 2.62, z, ry: -Math.PI / 2 }, 1.6, 0.6);
  panneau(toit, R.evacuation, { x: xm, y: 2.62, z: zs + 0.012 }, 1.5, 0.56);
  panneau(toit, R.evacuation, { x: xm, y: 2.62, z: zn - 0.012, ry: Math.PI }, 1.5, 0.56);
  toit.pave(x0 - 0.02, yt, zn - 0.02, x1 + 0.02, yt + 0.12, zs + 0.02, coul, M.satin);
  toit.pave(x1 - 3.2, yt + 0.12, z - 0.7, x1 - 1.4, yt + 0.42, z + 0.7, 0xb8b4aa, M.tole);
  toit.boite(1.9, 0.18, 1.2, 0xc9c0a8, { x: xm - 1.2, y: yt + 0.21, z: z + 0.1, ry: 0.1 }, M.toile, { crasse: false });
  toit.boite(1.6, 0.06, 0.9, 0x7a5a4a, { x: xm - 1.4, y: yt + 0.32, z: z + 0.15, ry: 0.25 }, M.toile, { crasse: false });
  for (const s of [-1, 1]) toit.boite(3.4, 0.06, 0.06, 0x8b9093, { x: xm + 2.2, y: yt + 0.16, z: z + s * 0.22, ry: 0.06 }, M.metal);
  for (let k = 0; k < 9; k++) toit.boite(0.05, 0.05, 0.5, 0x8b9093, { x: xm + 0.7 + k * 0.35, y: yt + 0.16, z: z + 0.09 * (k / 9) }, M.metal);
  chaise(toit, xm - 3.6, z - 0.2, 0.6, 0x6e4a3d);
  toit.boite(0.18, 0.28, 0.18, 0x2e2e2e, { x: xm - 3.0, y: yt + 0.26, z: z + 0.6 }, M.metal);
  toit.boite(0.12, 0.18, 0.12, 0xffe2a0, { x: xm - 3.0, y: yt + 0.24, z: z + 0.6 }, M.lueur, { crasse: false, nuance: 0 });
  b.lumiere(xm - 3.0, yt + 0.6, z + 0.6, 0xffc46b, 5, 12, "lanterne sur le toit de la navette (poste de guet)");
  // Les obstacles : on n'entre que par la porte avant et l'issue de secours
  b.obstacle(x0, zn, porte[0], zn, "navette");
  b.obstacle(porte[1], zn, x1, zn, "navette");
  b.obstacle(x0, zs, x1, zs, "navette");
  b.obstacle(x0, zn, x0, zs, "navette");
  b.obstacle(x1, zn, x1, issue[0], "navette");
  b.obstacle(x1, issue[1], x1, zs, "navette");
  b.obstacle(porte[1] + 0.2, z - 0.36, x1 - 0.4, z - 0.36, "sièges");
  b.obstacle(x0 + 1.5, z + 0.36, x1 - 0.4, z + 0.36, "sièges");
}

function semi(ctx) {
  const { b, c, u } = ctx;
  const M = MATS;
  const { a: A, b: B, c: C } = SEMI;
  // La remorque plateau, couchée sur le flanc : le plateau est debout, son dessous (châssis, roues) regarde l'est
  {
    const dx = B.x - A.x;
    const dz = B.z - A.z;
    const l = Math.hypot(dx, dz);
    const ry = -Math.atan2(dz, dx);
    const xm = (A.x + B.x) / 2;
    const zm = (A.z + B.z) / 2;
    c.repere({ x: xm, z: zm, ry }, () => {
      c.pave(-l / 2, 0, -0.12, l / 2, 2.5, 0.12, 0x5f6062, M.tole);
      c.pave(-l / 2 + 0.1, 0.05, -0.17, l / 2 - 0.1, 2.45, -0.12, 0x8a7d66, M.mat, { nuance: 0.03 });
      for (const y of [0.75, 1.75]) c.pave(-l / 2 + 0.3, y - 0.15, 0.12, l / 2 - 0.3, y + 0.15, 0.55, 0x3a3b3c, M.tole);
      for (let xx = -l / 2 + 1; xx < l / 2 - 0.5; xx += 1.2) c.pave(xx - 0.06, 0.4, 0.12, xx + 0.06, 2.1, 0.45, 0x3a3b3c, M.tole);
      for (const xa of [-l / 2 + 1.2, -l / 2 + 2.5, -l / 2 + 3.8]) {
        c.pave(xa - 0.08, 0.2, 0.55, xa + 0.08, 2.3, 0.75, 0x2e2e2e, M.tole);
        for (const yw of [0.32, 2.18]) c.poser(geoCylY(0.5, 0.3, 10), M.satin, 0x262626, { x: xa, y: yw, z: 1.05 }, { crasse: false });
      }
      // les béquilles, tendues dans le vide ; les feux arrière ; une sangle qui pend
      for (const y of [0.6, 1.9]) c.pave(l / 2 - 2.8, y - 0.06, 0.55, l / 2 - 2.65, y + 0.06, 1.5, 0x5a5c5e, M.tole);
      c.pave(-l / 2 - 0.05, 0.3, -0.1, -l / 2, 2.2, 0.4, 0x86392f, M.lisse, { crasse: false });
      c.boite(0.05, 2.4, 0.04, 0xd27a35, { x: 1.5, y: 1.2, z: -0.3, rz: 0.2 }, M.toile, { crasse: false });
      // une buse encore arrimée, au ras du plateau
      c.repere({ x: 2.4, y: 0, z: -1.0 }, () => buse(c, 0, 0, 0, 0));
      c.boite(0.04, 0.04, 1.8, 0x55595b, { x: 2.4, y: 1.62, z: -0.9 }, M.metal);
    });
    rectObstacle(b, xm, zm, ry, -l / 2, l / 2, -1.85, 1.6, "remorque couchée");
  }
  // Le tracteur, couché lui aussi, en portefeuille ; sa cabine bleue au nord
  {
    const dx = C.x - B.x;
    const dz = C.z - B.z;
    const l = Math.hypot(dx, dz);
    const ry = -Math.atan2(dz, dx);
    const xm = (B.x + C.x) / 2;
    const zm = (B.z + C.z) / 2;
    const bleu = teinteUsee(0x3f5f80, u);
    c.repere({ x: xm, z: zm, ry }, () => {
      for (const y of [0.7, 1.8]) c.pave(-l / 2, y - 0.17, 0, l / 2 - 0.3, y + 0.17, 0.5, 0x2e2f30, M.tole);
      c.poser(geoCylX(0.32, 1.4, 8), M.metal, 0x9aa0a2, { x: -0.6, y: 0.55, z: 0.75 }, { crasse: false });
      c.poser(geoCylY(0.6, 0.12, 10), M.tole, 0x2e2e2e, { x: -l / 2 + 0.9, y: 1.25, z: 0.56, rx: Math.PI / 2 }, { crasse: false });
      for (const xa of [l / 2 - 1.3, -l / 2 + 1.0]) {
        c.pave(xa - 0.08, 0.2, 0.5, xa + 0.08, 2.3, 0.7, 0x2e2e2e, M.tole);
        for (const yw of [0.3, 2.2]) c.poser(geoCylY(0.52, 0.32, 10), M.satin, 0x262626, { x: xa, y: yw, z: 1.0 }, { crasse: false });
      }
      // la cabine sur le côté : son toit regarde l'ouest
      c.pave(l / 2 - 2.3, 0, -2.9, l / 2, 2.45, -0.05, bleu, M.satin);
      c.pave(l / 2, 0.2, -2.55, l / 2 + 0.03, 2.25, -1.25, 0x2a3238, M.lisse, { crasse: false });
      c.pave(l / 2, 0.4, -1.1, l / 2 + 0.06, 2.05, -0.25, 0x3a3b3c, M.tole);
      c.pave(l / 2 - 1.9, 2.45, -2.6, l / 2 - 0.6, 2.47, -1.5, 0x2a3238, M.lisse, { crasse: false });
      c.pave(l / 2 - 2.0, 0.2, -3.4, l / 2 - 0.4, 2.25, -2.9, bleu, M.satin);
      c.pave(l / 2 + 0.02, 0.1, -0.3, l / 2 + 0.2, 2.35, 0.1, 0x38393a, M.satin);
    });
    rectObstacle(b, xm, zm, ry, -l / 2, l / 2 + 0.2, -3.4, 1.55, "tracteur couché");
  }
  // La charge, les buses de béton, a roulé sur le sens vide
  const buses = [[-29.7, -15.3, 0.35, 0], [-27.2, -17.2, 1.25, 0], [-31.0, -18.2, -0.4, 0], [-30.3, -16.9, 0.1, 1.45], [-26.3, -14.6, 0.8, 0], [-23.5, -16.4, 0.2, 0]];
  for (const [x, z, ry, y] of buses) {
    buse(c, x, y, z, ry);
    if (y === 0) rectObstacle(b, x, z, ry, -1.25, 1.25, -0.82, 0.82, "buse de béton");
  }
  // La GBA éventrée par la remorque
  gravats(c, -25.8, 0.9, 1.4, 12, [0xb4afa3, 0x9a958a, 0x7c7870]);
  gravats(c, -25.4, -1.0, 1.2, 9, [0xb4afa3, 0x9a958a, 0x7c7870]);
  c.boite(1.6, 0.6, 0.3, 0xbdb8ac, { x: -26.3, y: 0.25, z: 1.6, ry: 0.7, rz: 0.4 }, M.beton);
  // Les traces de pneus, l'huile
  for (let i = 0; i < 4; i++) c.boite(9, 0.005, 0.25, 0x2e2c2a, { x: -21 + i * 0.4, y: 0.015, z: -9 + i * 0.6, ry: -0.75 - i * 0.03 }, M.mat, { crasse: false });
  flaque(c, -23.8, -2.5, 1.6);
}

function buse(c, x, y, z, ry) {
  c.repere({ x, y: y + 0.8, z, ry }, () => {
    c.poser(geoCylX(0.8, 2.4, 10), MATS.beton, 0xb3ae9f, {}, { nuance: 0.04 });
    for (const s of [-1, 1]) c.poser(geoDisqueX(0.62, 10), MATS.mat, 0x2d2b28, { x: s * 1.205, ry: s > 0 ? 0 : Math.PI }, { crasse: false });
  });
}

function carambolage(ctx) {
  const { b, c, u } = ctx;
  navette(ctx);
  semi(ctx);
  // Entre la remorque et la navette : une berline encastrée
  voiture(ctx, { x: -22.0, z: 6.45, ry: 0.18, type: "berline", couleur: 0x6a7f8f, rv: 0.1, rv2: 0.1, rv3: 0.1 });
  // Au sud de la navette : la pile (une voiture sur deux autres), la carcasse brûlée par-dessus la glissière
  voiture(ctx, { x: -26.3, z: 11.35, ry: 0.32, type: "berline", couleur: 0x8c949a, rv: 0.1, rv2: 0.1, rv3: 0.1 });
  voiture(ctx, { x: -23.8, z: 13.3, ry: -0.42, type: "suv", couleur: 0x5d6e66, rv: 0.1, rv2: 0.1, rv3: 0.6 });
  voiture(ctx, { x: -25.0, y: 1.35, z: 12.3, ry: 1.25, rz: 0.18, rx: 0.08, type: "citadine", couleur: 0xa8875a, rv: 0.1, rv2: 0.1, rv3: 0.1 }, c, false);
  voiture(ctx, { x: -25.7, z: 17.4, ry: 1.38, type: "berline", couleur: 0x4a3a31, brulee: true });
  c.boite(3.2, 0.32, 0.08, 0x8a8f90, { x: -24.0, y: 0.5, z: 15.6, ry: 0.5, rz: 0.25 }, MATS.metal);
  c.boite(2.6, 0.32, 0.08, 0x8a8f90, { x: -27.6, y: 0.4, z: 15.3, ry: -0.35, rz: -0.3 }, MATS.metal);
  for (let i = 0; i < 5; i++) c.poser(geoCylY(0.38, 0.24, 8), MATS.satin, 0x232323, { x: -24.0 + (i % 2) * 0.3, y: 0.12 + i * 0.24, z: 18.6, ry: i }, { crasse: false });
  gravats(c, -25.4, 16.2, 1.0, 8, [0x2a2522, 0x4a3a31, 0x6a5a4a]);
  // Les contresens qui ont buté dans les buses, les débris de verre
  debris(c, -36, -16, -30, -4, 30, [0xc9d6da, 0x8a9a9e, 0x38393a]);
  debris(c, -33, 3, -20, 15, 30, [0xc9d6da, 0x8a9a9e, 0x38393a]);
  // Le barrage, pour le jeu : on ne passe que par la navette
  b.obstacle(-28.6, -Z.mur, -30.6, -17.2, "carambolage");
  b.obstacle(-30.6, -17.2, -29.7, -14.4, "carambolage");
  b.obstacle(-29.7, -14.4, -28.9, -12.6, "carambolage");
  b.obstacle(-24.4, 5.7, -24.4, BUS.z - BUS.w / 2, "carambolage");
  b.obstacle(-24.6, BUS.z + BUS.w / 2, -25.3, 15.2, "carambolage");
  b.obstacle(-25.3, 15.2, -25.9, Z.mur, "carambolage");
  semerTouffes(c, -34, -18, -20, -12, Math.round(6 + 10 * u), PALETTE.herbeSeche);
}

// ---------- Portiques, panneaux, borne ----------

function portiquePub(ctx) {
  const { b, c } = ctx;
  const M = MATS;
  const x = -86;
  const k = b.couche("portique publicitaire", { x, z: 0, l: 3, p: 37 }, 6.2, 15.5);
  const acier = 0x7f8486;
  for (const s of [-1, 1]) {
    const zp = s * 17.6;
    c.pave(x - 1, 0, zp - 1, x + 1, 0.5, zp + 1, 0xa9a59c, M.beton);
    for (const [dx, dz] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]]) c.tube([x + dx, 0.5, zp + dz], [x + dx * 0.6, 8.2, zp + dz * 0.6], 0.09, acier, M.tole, 6);
    for (let y = 1.2; y < 7.6; y += 1.6) {
      c.poutre([x - 0.5, y, zp - 0.5], [x + 0.5, y + 0.8, zp - 0.5], 0.05, acier, M.tole);
      c.poutre([x - 0.5, y, zp + 0.5], [x + 0.5, y + 0.8, zp + 0.5], 0.05, acier, M.tole);
      c.poutre([x + 0.5, y + 0.8, zp - 0.5], [x + 0.5, y + 1.6, zp + 0.5], 0.05, acier, M.tole);
    }
    rectObstacle(b, x, zp, 0, -1, 1, -1, 1, "pied de portique");
  }
  // La poutre treillis, la passerelle d'entretien, le panneau (deux faces), ses projecteurs morts
  for (const y of [7.8, 8.6]) for (const dx of [-0.35, 0.35]) k.pave(x + dx - 0.06, y - 0.06, -18.2, x + dx + 0.06, y + 0.06, 18.2, acier, M.tole);
  for (let zz = -18; zz < 18; zz += 1.5) {
    k.poutre([x - 0.35, 7.8, zz], [x - 0.35, 8.6, zz + 0.75], 0.05, acier, M.tole);
    k.poutre([x + 0.35, 7.8, zz + 0.75], [x + 0.35, 8.6, zz + 1.5], 0.05, acier, M.tole);
  }
  k.pave(x - 0.9, 8.6, -13.2, x + 0.9, 8.68, 13.2, 0x55595b, M.grillage);
  k.pave(x - 0.15, 8.7, -13.2, x + 0.15, 15.3, 13.2, 0x4a4d50, M.tole);
  panneau(k, R.pub, { x: x + 0.17, y: 11.95, ry: Math.PI / 2 }, 26, 6.5);
  panneau(k, R.pub, { x: x - 0.17, y: 11.95, ry: -Math.PI / 2 }, 26, 6.5);
  for (let zz = -11; zz <= 11; zz += 5.5) {
    for (const s of [-1, 1]) {
      k.poutre([x + s * 0.3, 8.7, zz], [x + s * 1.3, 9.2, zz], 0.05, acier, M.tole);
      k.boite(0.3, 0.2, 0.45, 0x3a3c3e, { x: x + s * 1.35, y: 9.15, z: zz, rz: s * 0.6 }, M.tole);
    }
  }
}

function portiquePMV(ctx) {
  const { b, c } = ctx;
  const M = MATS;
  const x = -62;
  const k = b.couche("portique à messages", { x, z: 0, l: 2.4, p: 35 }, 5.0, 8.8);
  const acier = 0x8a8f90;
  for (const s of [-1, 1]) {
    const zp = s * 17;
    c.pave(x - 0.7, 0, zp - 0.7, x + 0.7, 0.45, zp + 0.7, 0xa9a59c, M.beton);
    for (const dx of [-0.35, 0.35]) c.tube([x + dx, 0.45, zp], [x + dx, 7.9, zp], 0.13, acier, M.tole, 6);
    for (let y = 1; y < 7.4; y += 1.3) c.poutre([x - 0.35, y, zp], [x + 0.35, y + 0.65, zp], 0.06, acier, M.tole);
    rectObstacle(b, x, zp, 0, -0.7, 0.7, -0.7, 0.7, "pied de portique");
  }
  for (const y of [7.1, 7.9]) for (const dx of [-0.32, 0.32]) k.pave(x + dx - 0.06, y - 0.06, -17.2, x + dx + 0.06, y + 0.06, 17.2, acier, M.tole);
  for (let zz = -17; zz < 17; zz += 1.6) {
    k.poutre([x - 0.32, 7.1, zz], [x - 0.32, 7.9, zz + 0.8], 0.05, acier, M.tole);
    k.poutre([x + 0.32, 7.1, zz + 0.8], [x + 0.32, 7.9, zz + 1.6], 0.05, acier, M.tole);
  }
  // Les deux panneaux : celui du sens de l'exode regarde l'ouest, celui du retour regarde l'est
  for (const [z0, z1, face] of [[2.5, 11, -1], [-11, -2.5, 1]]) {
    k.pave(x - 0.35, 5.35, z0, x + 0.35, 7.0, z1, 0x2e3133, M.tole);
    panneau(k, R.pmv, { x: x + face * 0.36, y: 6.15, z: (z0 + z1) / 2, ry: (face * Math.PI) / 2 }, 7.6, 1.42, M.neon);
  }
  // Le petit panneau solaire qui le fait tenir
  k.boite(1.4, 0.05, 1.0, 0x26303a, { x: x + 0.3, y: 8.3, z: -6.5, rz: -0.5 }, M.lisse, { crasse: false });
  b.lumiere(x + 1.5, 6.0, -6.75, 0xffa640, 3.5, 11, "panneau à messages variables, figé sur « BOUCHON — 3 H »");
}

function borneSOS(ctx) {
  const { b, c } = ctx;
  const M = MATS;
  const x = -72;
  const z = 16.0;
  const ry = (3 * Math.PI) / 4;
  c.repere({ x, z, ry }, () => {
    c.boite(0.6, 0.15, 0.45, 0xa9a59c, { y: 0.07 }, M.beton);
    c.boite(0.46, 1.45, 0.32, 0xd27a35, { y: 0.87 }, M.satin);
    c.boite(0.52, 0.1, 0.38, 0xb8652a, { y: 1.62 }, M.satin);
    panneau(c, R.borne, { y: 1.2, z: 0.165 }, 0.44, 0.22);
    c.boite(0.12, 0.2, 0.08, 0x1e1e1e, { x: 0.12, y: 0.82, z: 0.18 }, M.satin);
    c.boite(0.5, 0.03, 0.4, 0x26303a, { y: 1.85, rx: -0.4 }, M.lisse, { crasse: false });
    c.boite(0.04, 0.2, 0.04, 0x55595b, { y: 1.72 }, M.metal);
  });
  rectObstacle(b, x, z, ry, -0.3, 0.3, -0.25, 0.25, "borne d'appel d'urgence");
}

function panneauRoute(ctx, x, z, r, ry) {
  const { b, c } = ctx;
  const M = MATS;
  c.repere({ x, z, ry }, () => {
    for (const s of [-1, 1]) c.boite(0.1, 3.6, 0.1, 0x8a8f90, { x: s * 1.3, y: 1.8 }, M.metal);
    c.boite(3.4, 1.3, 0.06, 0x7f8486, { y: 2.95 }, M.tole);
    panneau(c, r, { y: 2.95, z: 0.035 }, 3.3, 1.24);
  });
  rectObstacle(b, x, z, ry, -1.4, 1.4, -0.1, 0.1, "panneau");
}

// ---------- Les traces : feux éteints, affaires abandonnées ----------

function feu(ctx, x, z, vif) {
  const { b, c } = ctx;
  const M = MATS;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    c.poser(geoPierre(), M.mat, 0x8a857b, { x: x + Math.cos(a) * 0.62, y: 0.08, z: z + Math.sin(a) * 0.62, e: [0.2, 0.14, 0.18], ry: i }, { nuance: 0.1 });
  }
  c.poser(geoCylY(0.52, 0.03, 9), M.mat, vif ? 0x2e2a26 : 0x6f6b66, { x, y: 0.015, z }, { crasse: false });
  for (let i = 0; i < 3; i++) {
    const a = i * 2.1;
    c.tube([x + Math.cos(a) * 0.45, 0.05, z + Math.sin(a) * 0.45], [x - Math.cos(a) * 0.1, 0.22, z - Math.sin(a) * 0.1], 0.06, 0x2a2622, M.mat, 5);
  }
  if (vif) {
    for (let i = 0; i < 3; i++) c.poser(geoFlamme(), M.lueur, [0xffb060, 0xff8a3c, 0xffd080][i], { x: x + (i - 1) * 0.12, y: 0.12, z: z + (i % 2) * 0.1, e: [1, 0.8 + i * 0.25, 1], ry: i }, { crasse: false, nuance: 0 });
    b.lumiere(x, 0.9, z, 0xff9a48, 9, 13, "feu de survivants");
  }
}

/** Quelques affaires semées au bord des files : ceux qui sont partis à pied n'ont pas tout pu porter. */
function abandons(ctx) {
  const { c, x0, x1 } = ctx;
  const tons = [0x4a5a7a, 0x7a3b33, 0x2e2e30, 0xb59a6a, 0x5c6e52, 0x8a6f9a, 0x6a6f74, 0x9a7a4a];
  for (let i = 0; i < 9; i++) {
    const x = x0 + 2 + hache(x0 + i * 7.3) * (x1 - x0 - 4);
    if (x > -34 && x < -17) continue;
    const zc = [4.5, 8.0, 11.4, 15.9, 17.5][Math.floor(hache(x0 * 0.3 + i * 3.1) * 5)];
    const z = zc + (hache(i * 2.7 + x0) - 0.5) * 0.4;
    const k = hache(i * 5.1 + x0);
    if (k < 0.45) valise(c, x, z, k * 9, tons[i % tons.length], k < 0.2);
    else if (k < 0.75) sac(c, x, z, k * 7, tons[(i + 3) % tons.length]);
    else jerrican(c, x, z, k * 5, k < 0.85 ? 0x5c6b3a : 0x9a3a2e);
  }
}

// ---------- Le pont, le campement, les tombes ----------

function pont(ctx) {
  const { b, c, u } = ctx;
  const M = MATS;
  const { x0, x1, y, ep } = PONT;
  const k = b.couche("tablier du pont", { x: 25, z: 0, l: 11, p: 70 }, 4.6, 8.6);
  const gris = 0xb7b1a3;
  // Les piles sur le terre-plein, le chevêtre, les culées
  for (const xc of [22, 28]) {
    c.poser(geoCylY(0.6, 5.4, 10), M.beton, 0xb3ad9f, { x: xc, y: 2.7, z: 0 });
    rectObstacle(b, xc, 0, 0, -0.62, 0.62, -0.62, 0.62, "pile du pont");
  }
  k.pave(20.6, 5.4, -0.75, 29.4, y, 0.75, 0xb0aa9c, M.beton);
  c.pave(19.6, 0, -Z.mur - 1.4, 30.4, y, -Z.mur, 0xaba597, M.beton);
  c.pave(19.6, 0, Z.mur, 30.4, 1.6, Z.mur + 1.4, 0xaba597, M.beton);
  k.pave(19.6, 1.6, Z.mur, 30.4, y, Z.mur + 1.4, 0xaba597, M.beton);
  for (const s of [-1, 1]) b.obstacle(19.5, s * Z.mur, 30.5, s * Z.mur, "culée du pont");
  // Le tablier, ses poutres, ses corniches, ses garde-corps
  k.pave(x0, y, -Z.bord, x1, y + ep, Z.bord, gris, M.beton);
  for (const xg of [21.2, 23.7, 26.3, 28.8]) k.pave(xg - 0.25, y - 0.6, -34, xg + 0.25, y, 34, 0xa9a395, M.beton);
  for (const xe of [x0, x1]) k.pave(xe - 0.15, y - 0.1, -Z.bord, xe + 0.15, y + ep + 0.12, Z.bord, 0xc9c3b5, M.beton);
  for (const xe of [x0 + 0.25, x1 - 0.25]) {
    k.pave(xe - 0.15, y + ep, -Z.bord, xe + 0.15, y + ep + 0.5, Z.bord, 0xbdb7a9, M.beton);
    k.pave(xe - 0.04, y + ep + 1.0, -Z.bord, xe + 0.04, y + ep + 1.08, Z.bord, 0x7c8285, M.metal);
    for (let zz = -34; zz <= 34; zz += 2.5) k.boite(0.05, 0.5, 0.05, 0x7c8285, { x: xe, y: y + ep + 0.75, z: zz }, M.metal);
  }
  k.pave(x0 + 0.4, y + ep, -Z.bord, x1 - 0.4, y + ep + 0.03, Z.bord, 0x8a8984, M.asphalte, { crasse: false });
  for (const zz of [-12, 12]) {
    k.boite(0.14, 5, 0.14, 0x7c8285, { x: x0 + 0.5, y: y + ep + 2.5, z: zz }, M.metal);
    k.boite(1.2, 0.12, 0.3, 0x55595b, { x: x0 + 1.0, y: y + ep + 5.0, z: zz }, M.metal);
  }
  // Une voiture restée sur le pont, portière ouverte : on regardait le bouchon d'en haut
  voiture(ctx, { x: 24.2, y: y + ep + 0.03, z: -9, ry: Math.PI / 2 + 0.25, type: "break", couleur: 0x7d8a72, rv: 0.4, rv2: 0.3, rv3: 0.5, porte: { cote: 1, pos: "av" } }, k, false);
  // Le drap pendu au parapet, côté est : son message a été lavé par la pluie
  k.boite(0.03, 2.6, 4.0, 0xe6e0d0, { x: x1 + 0.2, y: y - 0.6, z: 5.5, rx: 0.03 }, M.toile, { crasse: false });
  k.boite(0.035, 0.5, 2.2, 0xb39a8a, { x: x1 + 0.21, y: y - 0.2, z: 5.2 }, M.toile, { crasse: false });
  k.boite(0.035, 0.35, 1.6, 0xb39a8a, { x: x1 + 0.21, y: y - 0.95, z: 5.8 }, M.toile, { crasse: false });
  // Les coulures sous le tablier : l'eau de pluie goutte en ligne sur la route
  for (let zz = -12; zz <= 12; zz += 3) flaque(c, x1 + 0.4, zz + hache(zz) * 1.5, 0.5 + hache(zz + 1) * 0.4);
  semerTouffes(c, 19.6, -Z.mur + 0.2, 30.4, -Z.mur + 1.0, Math.round(4 + 8 * u), PALETTE.herbe);
}

function campement(ctx) {
  const { b, c, u } = ctx;
  const M = MATS;
  // Deux voitures poussées en biais : le coupe-vent du campement
  voiture(ctx, { x: 17.4, z: 11.4, ry: 0.65, type: "break", couleur: 0x6a7f8f, rv: 0.6, rv2: 0.4, rv3: 0.5, mot: "mot3", charge: "galerie" });
  voiture(ctx, { x: 34.4, z: 4.0, ry: -0.5, type: "berline", couleur: 0x8c949a, rv: 0.2, rv2: 0.2, rv3: 0.2 });
  voiture(ctx, { x: 33.8, z: 12.9, ry: -0.2, type: "suv", couleur: 0x3e3f40, rv: 0.3, rv2: 0.2, rv3: 0.7, porte: { cote: -1, pos: "ar" } });
  // La grande bâche tendue de la pile aux piquets
  const abri = b.couche("bâche du campement", { x: 25, z: 3.2, l: 6.6, p: 5.4 }, 0.6, 2.6);
  bache(abri, [22.2, 2.5, 0.65], [27.8, 2.5, 0.65], [28.2, 0.5, 5.8], [21.8, 0.5, 5.8], 0x3c5d8c);
  for (const [px, pz] of [[21.8, 5.8], [28.2, 5.8]]) c.poutre([px, 0, pz], [px, 0.55, pz], 0.05, 0x8a7458, M.mat);
  bache(c, [29.2, 1.9, 11.0], [33.0, 1.6, 10.2], [33.6, 0.3, 13.0], [29.4, 0.3, 13.8], 0x8a7a4a);
  // Sous la bâche : matelas, duvets, oreillers
  const tons = [0xd8d1bf, 0xc9c0a8, 0xb8b0a0];
  for (let i = 0; i < 4; i++) {
    const x = 22.6 + i * 1.35;
    c.boite(1.25, 0.16, 1.9, tons[i % 3], { x, y: 0.08, z: 3.4, ry: (hache(i) - 0.5) * 0.2 }, M.toile, { crasse: false });
    c.boite(0.9, 0.06, 1.3, [0x5a6a8a, 0x8a5a4a, 0x6a7a5a, 0x7a6a8a][i], { x, y: 0.19, z: 3.6, ry: (hache(i + 3) - 0.5) * 0.4 }, M.toile, { crasse: false });
    c.boite(0.5, 0.1, 0.3, 0xe6e0d0, { x, y: 0.2, z: 2.65 }, M.toile, { crasse: false });
  }
  // Les tentes : un dôme, une canadienne
  c.poser(geoDome(), M.toile, 0x6f8a5a, { x: 23.2, y: 0, z: 11.6, e: [1.35, 1.05, 1.35] }, { crasse: false });
  c.pave(22.7, 0, 12.9, 23.7, 0.9, 12.95, 0x2a2a28, M.mat);
  c.poser(geoCanadienne(), M.toile, 0xa8743a, { x: 27.6, y: 0, z: 12.6, e: [1, 1.1, 1.1] }, { crasse: false });
  rectObstacle(b, 23.2, 11.6, 0, -1.35, 1.35, -1.35, 1.35, "tente");
  rectObstacle(b, 27.6, 12.6, 0, -1.2, 1.2, -1.0, 1.0, "tente");
  // Les feux (on y cuisine encore) et le foyer
  feu(ctx, 25.0, 7.2, true);
  feu(ctx, 31.6, 8.6, true);
  c.poutre([24.4, 0, 6.7], [25.0, 1.2, 7.2], 0.04, 0x3a3a3a, M.metal);
  c.poutre([25.6, 0, 6.7], [25.0, 1.2, 7.2], 0.04, 0x3a3a3a, M.metal);
  c.poutre([25.0, 0, 7.9], [25.0, 1.2, 7.2], 0.04, 0x3a3a3a, M.metal);
  c.poser(geoCylY(0.2, 0.26, 8), M.metal, 0x55595b, { x: 25.0, y: 0.7, z: 7.2 }, { crasse: false });
  // La table, les chaises, la cuisine
  table(c, 27.6, 8.0, 0.1, 1.4, 0.8, 0x8a7458);
  chaise(c, 26.6, 8.9, 0.6, 0x3d5a6e);
  chaise(c, 28.7, 8.9, 2.4, 0x6e4a3d);
  chaise(c, 29.8, 7.2, -1.2, 0x5a6a3a, u > 0.7);
  for (let i = 0; i < 4; i++) c.poser(geoCylY(0.12, 0.2, 7), M.metal, 0x8a8f90, { x: 27.1 + i * 0.3, y: 0.86, z: 7.9 }, { crasse: false });
  for (let i = 0; i < 3; i++) jerrican(c, 30.3 + i * 0.4, 5.0, 0.1 * i, i === 1 ? 0x3a5a8a : 0x5c6b3a);
  // Le bûcher : du bois de palettes et de glissière
  for (let i = 0; i < 6; i++) c.boite(1.2, 0.1, 0.12, 0x8a7458, { x: 31.0, y: 0.06 + i * 0.11, z: 2.4 + (i % 3) * 0.14, ry: (i % 2) * 0.1 }, M.mat, { nuance: 0.1 });
  // Le collecteur d'eau sous la ligne de gouttes du tablier
  c.poser(geoCylY(0.32, 0.9, 10), M.satin, 0x3a5a8a, { x: 30.5, y: 0.45, z: 1.6 }, {});
  bache(c, [29.9, 1.6, 1.0], [31.1, 1.6, 1.0], [30.7, 0.95, 1.6], [30.3, 0.95, 1.6], 0x3c5d8c);
  rectObstacle(b, 30.5, 1.6, 0, -0.35, 0.35, -0.35, 0.35, "fût");
  // Le fil à linge entre les piles
  c.boite(5.5, 0.02, 0.02, 0xd8d4c8, { x: 25, y: 1.95, z: -0.65 }, M.mat, { crasse: false });
  const linge = [0x8a5a4a, 0xd8d4c8, 0x5a6a8a, 0x6a7a5a, 0xc9b86a, 0x7a6a8a];
  for (let i = 0; i < 7; i++) c.boite(0.4 + hache(i) * 0.3, 0.5 + hache(i + 1) * 0.4, 0.02, linge[i % linge.length], { x: 22.8 + i * 0.7, y: 1.6, z: -0.65 }, M.toile, { crasse: false });
  // Le mur des avis de recherche, sur la pile ouest : des dizaines de feuilles, de photos, de mots
  for (let i = 0; i < 26; i++) {
    const a = -0.4 + (i % 9) * 0.2;
    const yy = 1.0 + Math.floor(i / 9) * 0.38 + hache(i) * 0.1;
    const papierCoul = [0xece8dc, 0xe6d68a, 0xd9d4c4, 0xb8c0c8, 0xf2efe6][Math.floor(hache(i * 3) * 5)];
    c.boite(0.02, 0.28, 0.2, papierCoul, { x: 22 + Math.cos(a) * 0.615, y: yy, z: Math.sin(a) * 0.615, ry: -a, rz: (hache(i * 7) - 0.5) * 0.3 }, M.mat, { crasse: false, nuance: 0.05 });
  }
  for (let i = 0; i < 12; i++) {
    const a = 1.1 + (i % 6) * 0.17;
    c.boite(0.02, 0.24, 0.18, [0xece8dc, 0xd9d4c4, 0xe6d68a][i % 3], { x: 28 + Math.cos(a) * 0.615, y: 1.2 + Math.floor(i / 6) * 0.35, z: Math.sin(a) * 0.615, ry: -a }, M.mat, { crasse: false });
  }
  // Ce qu'il faut pour vivre : caddie, vélo, livres, une cage vide, un siège bébé vide
  c.repere({ x: 20.3, z: 6.8, ry: 0.5 }, () => {
    c.pave(-0.45, 0.25, -0.28, 0.45, 0.85, 0.28, 0xa0a6a8, M.grillage, { crasse: false });
    for (const [a, d] of [[-0.4, -0.25], [0.4, -0.25], [-0.4, 0.25], [0.4, 0.25]]) c.poser(geoCylY(0.06, 0.04, 6), M.satin, 0x2a2a2a, { x: a, y: 0.06, z: d, rx: Math.PI / 2 }, { crasse: false });
    c.boite(0.04, 0.04, 0.6, 0xa0a6a8, { x: -0.5, y: 0.95 }, M.metal);
    for (let i = 0; i < 3; i++) c.boite(0.5, 0.25, 0.3, [0x8a6f9a, 0xb59a6a, 0x4a5a7a][i], { x: -0.1 + i * 0.1, y: 0.95 + i * 0.1, z: 0, ry: i * 0.4 }, M.satin);
  });
  velo(c, 28.6, 0, -1.0, 0.1, 0x7a3a3a);
  for (let i = 0; i < 5; i++) c.boite(0.22, 0.04 + hache(i) * 0.03, 0.3, [0x8a3a2e, 0x2f4f6f, 0x5a6a3a, 0xb59a6a, 0x3a3a3a][i], { x: 27.3, y: 0.79 + i * 0.045, z: 8.2, ry: hache(i + 4) }, M.satin, { crasse: false });
  cage(c, 19.6, 0, 9.0, 0.8);
  siegeBebe(c, 21.2, 0, 9.6, 2.4);
  gravats(c, 33.5, 7.2, 0.5, 4, [0x2a2622, 0x6f6b66]);
  jonchee(c, 19, 1, 34, 14, 30, [0xd9d4c4, 0x9c7a45, 0xe8e2d0, 0xb08f55]);
  rectObstacle(b, 20.3, 6.8, 0.5, -0.5, 0.5, -0.3, 0.3, "caddie");
}

/** Une bâche (quadrilatère) tendue entre quatre points. */
function bache(c, a, b2, c2, d, couleur) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([...a, ...d, ...b2, ...b2, ...d, ...c2], 3));
  g.computeVertexNormals();
  c.poser(g, MATS.toile, couleur, {}, { crasse: false, nuance: 0.04 });
  g.dispose();
}

function tombes(ctx) {
  const { b, c, u } = ctx;
  const M = MATS;
  const z = 21.6;
  for (let i = 0; i < 7; i++) {
    const x = 33.2 + i * 1.6 + (hache(i * 3) - 0.5) * 0.3;
    const recente = i >= 5;
    c.poser(geoDome(), M.mat, recente ? 0x8a6c4c : 0x8f8a5e, { x, y: 0, z, e: [0.62, 0.2, 1.0] }, { nuance: 0.05 });
    // La croix de bois, au pied du talus (côté sud)
    const pench = (hache(i * 5) - 0.5) * 0.2 + (u > 0.8 && i === 2 ? 0.35 : 0);
    c.repere({ x, z: z + 1.05, rz: pench }, () => {
      c.boite(0.1, 1.2, 0.08, 0xc2b69c, { y: 0.6 }, M.mat, { nuance: 0.08, crasse: false });
      c.boite(0.6, 0.09, 0.08, 0xc2b69c, { y: 0.88 }, M.mat, { nuance: 0.08, crasse: false });
    });
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      c.poser(geoPierre(), M.mat, 0x9a958a, { x: x + Math.cos(a) * 0.5, y: 0.05, z: z + Math.sin(a) * 1.0, e: 0.09, ry: k }, { nuance: 0.1 });
    }
    if (i === 1) c.boite(0.08, 0.02, 0.15, 0x1e1e1e, { x, y: 0.21, z: z - 0.2 }, M.lisse);
    if (i === 3) c.poser(geoDome(), M.satin, 0x5a6a3a, { x, y: 0.19, z: z + 0.1, e: [0.14, 0.08, 0.14] });
    if (i === 4 || i === 6) {
      for (let k = 0; k < 4; k++) c.poser(geoPierre(), M.mat, [0x8a6a8a, 0xb59a5a, 0x9a5a4a][k % 3], { x: x + (k - 1.5) * 0.06, y: 0.21, z: z - 0.4 + k * 0.03, e: 0.05 }, { crasse: false });
    }
  }
  // Une croix plus haut sur le talus, seule
  const yt = hauteurTalus(46, 25.4);
  c.repere({ x: 46, y: yt - 0.1, z: 25.4, rz: 0.1 }, () => {
    c.boite(0.08, 1.1, 0.06, PALETTE.boisGris, { y: 0.55 }, M.mat);
    c.boite(0.5, 0.07, 0.06, PALETTE.boisGris, { y: 0.82 }, M.mat);
  });
  // La bougie dans son bocal, sur la tombe la plus récente
  c.poser(geoCylY(0.07, 0.14, 7), M.verre, 0xffffff, { x: 42.8, y: 0.26, z: z - 0.1 }, { crasse: false });
  c.poser(geoCylY(0.04, 0.1, 6), M.lueur, 0xffd890, { x: 42.8, y: 0.25, z: z - 0.1 }, { crasse: false, nuance: 0 });
  b.lumiere(42.8, 0.7, z - 0.3, 0xffcf7a, 2.2, 6, "bougie sur la tombe la plus récente");
  semerTouffes(c, 32, 20.3, 45, 22.9, Math.round(8 + 10 * u), PALETTE.herbe);
}

// ---------- Le contrôle sanitaire (goulet n° 2) ----------

function heras(c, b, xa, za, xb, zb, mat) {
  // Clôture de chantier : panneaux de 3,5 m, cadre en tube, grillage, pieds en béton
  const L = Math.hypot(xb - xa, zb - za);
  const n = Math.max(1, Math.round(L / 3.5));
  const ry = -Math.atan2(zb - za, xb - xa);
  for (let i = 0; i < n; i++) {
    const t0 = i / n;
    const t1 = (i + 1) / n;
    const px = xa + (xb - xa) * (t0 + t1) * 0.5;
    const pz = za + (zb - za) * (t0 + t1) * 0.5;
    const l = L / n;
    const penche = hache(px * 3 + pz) > 0.85 ? 0.18 : 0;
    c.repere({ x: px, z: pz, ry, rx: penche }, () => {
      c.boite(l - 0.1, 1.9, 0.02, 0xa8aeb0, { y: 1.05 }, MATS.grillage, { crasse: false, nuance: 0 });
      for (const s of [-1, 1]) c.boite(0.04, 2.0, 0.04, 0x9aa0a2, { x: (s * (l - 0.1)) / 2, y: 1.05 }, MATS.metal);
      for (const y of [0.08, 2.03]) c.boite(l - 0.1, 0.04, 0.04, 0x9aa0a2, { y }, MATS.metal);
    });
    for (const s of [-1, 1]) {
      const fx = xa + (xb - xa) * (s < 0 ? t0 : t1);
      const fz = za + (zb - za) * (s < 0 ? t0 : t1);
      c.boite(0.6, 0.14, 0.22, 0x8a8a84, { x: fx, y: 0.07, z: fz, ry }, MATS.beton);
    }
  }
  b.obstacle(xa, za, xb, zb, "clôture");
}

function barriere(c, b, xa, za, xb, zb) {
  // Barrière de police (Vauban), basse, en acier galvanisé
  const L = Math.hypot(xb - xa, zb - za);
  const ry = -Math.atan2(zb - za, xb - xa);
  c.repere({ x: (xa + xb) / 2, z: (za + zb) / 2, ry }, () => {
    for (const y of [0.25, 1.05]) c.boite(L, 0.04, 0.04, 0xa8aeb0, { y }, MATS.metal);
    for (let u = -L / 2 + 0.1; u <= L / 2 - 0.05; u += 0.13) c.boite(0.02, 0.8, 0.02, 0xa8aeb0, { x: u, y: 0.65 }, MATS.metal);
    for (const s of [-1, 1]) {
      c.boite(0.04, 1.1, 0.04, 0x9aa0a2, { x: (s * L) / 2, y: 0.55 }, MATS.metal);
      c.boite(0.04, 0.04, 0.6, 0x9aa0a2, { x: (s * L) / 2, y: 0.05 }, MATS.metal);
    }
  });
  b.obstacle(xa, za, xb, zb, "barrière");
}

function blocBeton(c, b, x, z, ry, l = 2) {
  c.repere({ x, z, ry }, () => {
    c.pave(-l / 2, 0, -0.3, l / 2, 0.25, 0.3, 0xb4afa3, MATS.beton);
    c.pave(-l / 2, 0.25, -0.13, l / 2, 0.82, 0.13, 0xbdb8ac, MATS.beton);
    c.pave(-l / 2 + 0.2, 0.5, 0.13, -l / 2 + 0.7, 0.66, 0.135, 0xd27a35, MATS.mat, { crasse: false });
  });
  rectObstacle(b, x, z, ry, -l / 2, l / 2, -0.3, 0.3, "bloc béton");
}

/** Une tente sanitaire à armature, toit à deux pans (couche) ; faces sud et est coupées à hauteur d'allège. */
function tente(ctx, x0, z0, x1, z1, { nom, couleur = 0xdedad0, portes = [] }) {
  const { b, c, u } = ctx;
  const M = MATS;
  const h = 2.2;
  const hf = 3.3;
  const zm = (z0 + z1) / 2;
  const allege = 1.1;
  const k = b.couche(nom, { x: (x0 + x1) / 2, z: zm, l: x1 - x0 + 0.4, p: z1 - z0 + 0.4 }, allege, hf + 0.3);
  const toile = teinteUsee(couleur, u, 0.8);
  // Les murs : nord/ouest en entier, sud/est jusqu'à l'allège (le haut part avec le toit)
  const cote = (nomCote, a, bb, fixe, horizontal) => {
    const trous = portes.filter((p) => p.cote === nomCote).map((p) => [p.u - p.l / 2, p.u + p.l / 2]);
    const coupe = nomCote === "s" || nomCote === "e";
    for (const [p, q] of intervalles(a, bb, trous)) {
      const box = (ch, y1, y2) => (horizontal ? ch.pave(p, y1, fixe - 0.02, q, y2, fixe + 0.02, toile, M.toile, { nuance: 0.03 }) : ch.pave(fixe - 0.02, y1, p, fixe + 0.02, y2, q, toile, M.toile, { nuance: 0.03 }));
      box(c, 0, coupe ? allege : h);
      if (coupe) box(k, allege, h);
      if (horizontal) b.obstacle(p, fixe, q, fixe, "tente");
      else b.obstacle(fixe, p, fixe, q, "tente");
    }
    // au-dessus des portes, la toile continue
    for (const [p, q] of trous) {
      if (horizontal) k.pave(p, 2.1, fixe - 0.02, q, h, fixe + 0.02, toile, M.toile);
      else k.pave(fixe - 0.02, 2.1, p, fixe + 0.02, h, q, toile, M.toile);
    }
  };
  cote("n", x0, x1, z0, true);
  cote("s", x0, x1, z1, true);
  cote("o", z0, z1, x0, false);
  cote("e", z0, z1, x1, false);
  // L'armature
  for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / Math.round((x1 - x0) / 2.5)) {
    for (const z of [z0, z1]) c.boite(0.06, h, 0.06, 0x9aa0a2, { x, y: h / 2, z }, M.metal);
    k.poutre([x, h, z0], [x, hf, zm], 0.05, 0x9aa0a2, M.metal);
    k.poutre([x, h, z1], [x, hf, zm], 0.05, 0x9aa0a2, M.metal);
  }
  // Le toit, deux pans (quelques lés arrachés à l'usure forte), les pignons
  const demi = (z1 - z0) / 2;
  const pente = Math.atan2(hf - h, demi);
  const ramp = Math.hypot(demi, hf - h) + 0.15;
  const nl = Math.round((x1 - x0) / 2);
  for (let i = 0; i < nl; i++) {
    const xa = x0 + ((x1 - x0) * i) / nl;
    const xb = x0 + ((x1 - x0) * (i + 1)) / nl;
    for (const s of [-1, 1]) {
      if (u > 0.75 && hache(xa * 3 + s + z0) < (u - 0.75) * 1.6) continue;
      k.boite(xb - xa + 0.02, 0.03, ramp, toile, { x: (xa + xb) / 2, y: (h + hf) / 2, z: zm + (s * demi) / 2, rx: s * pente }, M.toile, { crasse: false, nuance: 0.04 });
    }
  }
  for (const x of [x0, x1]) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([x, h, z0, x, h, z1, x, hf, zm], 3));
    g.computeVertexNormals();
    k.poser(g, M.toile, toile, {}, { crasse: false });
    g.dispose();
  }
  // La croix rouge sur le toit sud
  k.boite(1.2, 0.04, 0.35, 0xb8413a, { x: (x0 + x1) / 2, y: (h + hf) / 2 + 0.03, z: zm + demi / 2, rx: pente }, M.toile, { crasse: false });
  k.boite(0.35, 0.04, 1.0, 0xb8413a, { x: (x0 + x1) / 2, y: (h + hf) / 2 + 0.03, z: zm + demi / 2, rx: pente }, M.toile, { crasse: false });
  return k;
}

function controle(ctx) {
  const { b, c, u } = ctx;
  const M = MATS;
  const X = 66;
  // La ligne de barrage, du mur nord au mur sud (sauf la file de contrôle, la voie Premium et la tente de triage)
  heras(c, b, X, -Z.mur, X, -11.5, M);
  heras(c, b, X, -11.5, X, -0.35, M);
  heras(c, b, X, 0.35, X, 4.55, M);
  blocBeton(c, b, X, 8.05, Math.PI / 2, 0.6);
  heras(c, b, X, 11.4, X, 14.2, M);
  heras(c, b, X, 16.2, X, Z.mur, M);
  // La file de contrôle : couloir de barrières, chicane, portique thermique, barrière levée
  barriere(c, b, 60, 4.6, 64, 4.6);
  barriere(c, b, 64, 4.6, 68, 4.6);
  barriere(c, b, 68, 4.6, 72, 4.6);
  barriere(c, b, 60, 7.8, 64, 7.8);
  barriere(c, b, 64, 7.8, 68, 7.8);
  barriere(c, b, 68, 7.8, 72, 7.8);
  barriere(c, b, X, 4.6, X, 6.6);
  barriere(c, b, 68.6, 5.8, 68.6, 7.8);
  // Le portique thermique (deux faces : on entre, on sort)
  {
    const xp = 71;
    for (const zp of [4.45, 7.95]) c.boite(0.35, 2.5, 0.3, 0xe6e2d8, { x: xp, y: 1.25, z: zp }, M.satin);
    c.boite(0.4, 0.4, 3.9, 0xe6e2d8, { x: xp, y: 2.7, z: 6.2 }, M.satin);
    for (const s of [-1, 1]) {
      panneau(c, R.thermo, { x: xp + s * 0.205, y: 2.75, z: 6.2, ry: (s * Math.PI) / 2 }, 2.4, 0.3, M.neon);
      panneau(c, R.thermoEcran, { x: xp + s * 0.205, y: 2.25, z: 4.45, ry: (s * Math.PI) / 2 }, 0.3, 0.04);
    }
    c.poser(geoDome(), M.lisse, 0x1e2022, { x: xp - 0.2, y: 2.5, z: 6.2, rx: Math.PI, e: [0.12, 0.1, 0.12] }, { crasse: false });
    b.lumiere(xp + 0.8, 2.6, 6.2, 0x7dff9a, 1.6, 5, "afficheur du portique thermique (« AVANCEZ · --,- °C »)");
    // la table de l'agent sous son barnum, thermomètres, boîtes de masques
    table(c, 72.3, 3.0, 0.05, 1.6, 0.7, 0xe6e2d8);
    chaise(c, 72.4, 2.2, -Math.PI / 2, 0x3d5a6e, u > 0.8);
    for (let i = 0; i < 4; i++) c.boite(0.25, 0.12, 0.18, [0x8ab4c8, 0xe6e2d8, 0x8ab4c8, 0x9ac89a][i], { x: 71.8 + i * 0.32, y: 0.82, z: 3.0, ry: i * 0.2 }, M.satin, { crasse: false });
    c.boite(0.18, 0.05, 0.05, 0xe6e2d8, { x: 72.9, y: 0.79, z: 3.2 }, M.lisse);
    const barnum = b.couche("barnum du contrôle", { x: 72.3, z: 2.9, l: 3.2, p: 3.2 }, 2.2, 3.1);
    for (const [a, d] of [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]]) c.boite(0.05, 2.4, 0.05, 0x9aa0a2, { x: 72.3 + a, y: 1.2, z: 2.9 + d }, M.metal);
    barnum.poser(geoPrisme(3.1, 0.6, 3.1, 1.4, 1.4, 1.4), M.toile, teinteUsee(0xdedad0, u), { x: 72.3, y: 2.7, z: 2.9 }, { crasse: false });
  }
  // La barrière levée (son bras cassé pend)
  c.boite(0.25, 1.0, 0.25, 0xe6e2d8, { x: 74, y: 0.5, z: 4.3 }, M.satin);
  c.boite(0.08, 0.08, 3.2, 0xe6e2d8, { x: 74, y: 1.2, z: 5.6, rx: -0.9 }, M.satin);
  for (let i = 0; i < 3; i++) c.boite(0.085, 0.085, 0.3, 0xb8413a, { x: 74, y: 1.4 + i * 0.6, z: 4.9 + i * 0.5, rx: -0.9 }, M.satin, { crasse: false });
  // La voie Premium : tapis rouge, poteaux et cordons de velours, son propre portique doré. Vide.
  {
    c.pave(60.5, 0.01, 8.5, 75, 0.03, 11.2, 0x8a2a2e, M.toile, { crasse: false, nuance: 0.02 });
    for (const zp of [8.35, 11.35]) {
      for (let xp = 61; xp <= 74; xp += 1.6) {
        c.poser(geoCylY(0.035, 0.95, 6), M.metal, 0xb8963e, { x: xp, y: 0.47, z: zp }, { crasse: false });
        c.poser(geoCylY(0.16, 0.04, 8), M.metal, 0xb8963e, { x: xp, y: 0.02, z: zp }, { crasse: false });
        if (xp + 1.6 <= 74.01 && hache(xp * 3 + zp) > 0.2 * u) c.boite(1.55, 0.05, 0.05, 0x7a2630, { x: xp + 0.8, y: 0.8, z: zp, rz: 0.05 }, M.toile, { crasse: false });
      }
      b.obstacle(61, zp, 74, zp, "cordon de velours");
    }
    for (const zp of [8.3, 11.4]) c.boite(0.3, 2.6, 0.3, 0xb8963e, { x: 71, y: 1.3, z: zp }, M.metal);
    c.boite(0.35, 0.9, 3.5, 0x1e2433, { x: 71, y: 3.0, z: 9.85 }, M.satin);
    panneau(c, R.premium, { x: 71.18, y: 3.0, z: 9.85, ry: Math.PI / 2 }, 2.4, 0.9);
    panneau(c, R.premium, { x: 70.82, y: 3.0, z: 9.85, ry: -Math.PI / 2 }, 2.4, 0.9);
    c.boite(0.6, 1.05, 1.2, 0x1e2433, { x: 69.5, y: 0.52, z: 10.6 }, M.satin);
    c.boite(0.65, 0.05, 1.25, 0xb8963e, { x: 69.5, y: 1.07, z: 10.6 }, M.metal);
  }
  // La tente de triage (au sud) : on entre à l'ouest, on ressort à l'est
  {
    tente(ctx, 67, 12.2, 77, 18.4, { nom: "tente de triage", portes: [{ cote: "o", u: 15.2, l: 1.8 }, { cote: "e", u: 15.2, l: 1.8 }] });
    for (let i = 0; i < 3; i++) litDeCamp(c, 69.2 + i * 2.6, 17.3, 0, [0x5d6b4a, 0x6a6a5a, 0x5d6b4a][i]);
    table(c, 69, 13.2, 0, 1.6, 0.7, 0xe6e2d8);
    table(c, 73.5, 13.2, 0, 1.6, 0.7, 0xe6e2d8);
    for (let i = 0; i < 6; i++) c.boite(0.3, 0.16, 0.22, [0x8ab4c8, 0xe6e2d8, 0x9ac89a][i % 3], { x: 68.5 + (i % 3) * 0.4 + (i > 2 ? 4.5 : 0), y: 0.84, z: 13.2, ry: i * 0.3 }, M.satin, { crasse: false });
    caisse(c, 75.8, 13.0, 0, 0.8, 0.6, 0.6, 0xe6e2d8, 0, M.satin);
    c.boite(0.02, 0.2, 0.06, 0xb8413a, { x: 75.39, y: 0.35, z: 13.0 }, M.satin, { crasse: false });
    c.boite(0.6, 1.4, 0.6, 0xe6e2d8, { x: 76.4, y: 0.7, z: 16.6 }, M.satin);
    for (const xp of [70.5, 73.1]) {
      c.poser(geoCylY(0.02, 1.8, 5), M.metal, 0x9aa0a2, { x: xp, y: 0.9, z: 16.4 }, { crasse: false });
      c.poser(geoCylY(0.25, 0.03, 6), M.metal, 0x9aa0a2, { x: xp, y: 0.02, z: 16.4 }, { crasse: false });
      c.boite(0.12, 0.2, 0.04, 0xd8e4e8, { x: xp + 0.1, y: 1.6, z: 16.4 }, M.lisse, { crasse: false });
    }
    chaise(c, 69.4, 14.1, 1.4, 0x3d5a6e);
    chaise(c, 74.0, 14.2, -1.6, 0x3d5a6e, true);
    c.boite(0.14, 0.24, 0.14, 0xdde6ee, { x: 73.6, y: 0.86, z: 13.3 }, M.lisse, { crasse: false });
    b.lumiere(73.6, 1.4, 14.2, 0xe2ecff, 3, 8, "lampe de secours sur batterie, dans la tente de triage");
    debris(c, 67.5, 13.6, 76.5, 17.8, 26, [0xf2f0ea, 0x8ab4c8, 0xe6e2d8]);
  }
  // La tente de quarantaine (au nord), derrière le barrage : on n'y entre que de l'est, par la brèche du terre-plein
  {
    tente(ctx, 67, -15, 79, -8, { nom: "tente de quarantaine", couleur: 0xd8d8cc, portes: [{ cote: "s", u: 77.4, l: 1.8 }] });
    for (let i = 0; i < 4; i++) for (const zr of [-14, -9.4]) litDeCamp(c, 68.8 + i * 2.7, zr, 0, 0x6a6a5a);
    for (let i = 0; i < 3; i++) c.boite(0.02, 1.8, 1.6, 0xc8ccc0, { x: 70.15 + i * 2.7, y: 1.0, z: -13.7 }, M.toile, { crasse: false });
    table(c, 77.4, -11.2, Math.PI / 2, 1.4, 0.7, 0xe6e2d8);
    c.boite(0.5, 0.35, 0.05, 0x1e2022, { x: 77.4, y: 0.95, z: -11.6 }, M.lisse);
    caisse(c, 78.2, -13.8, 0.2, 0.7, 0.5, 0.5, 0x5a6a3a);
    caisse(c, 78.2, -13.2, -0.1, 0.7, 0.5, 0.5, 0x5a6a3a, 0.5);
  }
  // Le mirador (poste de guet du barrage) : l'échelle est par terre
  {
    const xm = 64.5;
    const zm = -3.4;
    const k = b.couche("mirador", { x: xm, z: zm, l: 2.6, p: 2.6 }, 2.4, 6.2);
    for (const [a, d] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      c.tube([xm + a, 0, zm + d], [xm + a * 0.95, 2.4, zm + d * 0.95], 0.06, 0x9aa0a2, M.metal, 6);
      k.tube([xm + a * 0.95, 2.4, zm + d * 0.95], [xm + a * 0.9, 5.6, zm + d * 0.9], 0.06, 0x9aa0a2, M.metal, 6);
    }
    for (const s of [-1, 1]) {
      c.poutre([xm - 1, 0.2, zm + s], [xm + 1, 2.3, zm + s], 0.04, 0x9aa0a2, M.metal);
      c.poutre([xm + s, 0.2, zm - 1], [xm + s, 2.3, zm + 1], 0.04, 0x9aa0a2, M.metal);
    }
    k.pave(xm - 1.1, 4.0, zm - 1.1, xm + 1.1, 4.1, zm + 1.1, 0x8a7458, M.mat);
    for (const s of [-1, 1]) {
      k.pave(xm - 1.1, 4.1, zm + s * 1.05 - 0.03, xm + 1.1, 5.0, zm + s * 1.05 + 0.03, 0x5a6a3a, M.toile);
      k.pave(xm + s * 1.05 - 0.03, 4.1, zm - 1.1, xm + s * 1.05 + 0.03, 5.0, zm + 1.1, 0x5a6a3a, M.toile);
    }
    k.boite(2.6, 0.04, 2.6, 0x5a6a3a, { x: xm, y: 5.65, z: zm, rx: 0.12 }, M.toile, { crasse: false });
    c.repere({ x: xm + 2.2, z: zm + 0.4, ry: 0.3 }, () => {
      for (const s of [-1, 1]) c.boite(4.2, 0.06, 0.05, 0x9aa0a2, { y: 0.03, z: s * 0.22 }, M.metal);
      for (let i = 0; i < 12; i++) c.boite(0.04, 0.04, 0.44, 0x9aa0a2, { x: -1.95 + i * 0.35, y: 0.03 }, M.metal);
    });
    rectObstacle(b, xm, zm, 0, -1.05, 1.05, -1.05, 1.05, "mirador");
  }
  // La tour d'éclairage de chantier, morte, penchée
  {
    const xt = 62.5;
    const zt = 17.6;
    c.boite(2.6, 1.1, 1.2, teinteUsee(0xc9a43a, u), { x: xt, y: 0.85, z: zt }, M.satin);
    for (const s of [-1, 1]) c.poser(geoRoue(0.32), M.satin, 0x262626, { x: xt - 0.4, y: 0.3, z: zt + s * 0.65 }, { crasse: false });
    c.repere({ x: xt + 0.8, y: 1.4, z: zt, rz: 0.3, rx: -0.12 }, () => {
      c.boite(0.16, 6, 0.16, 0x8a8f90, { y: 3 }, M.tole);
      c.boite(1.6, 0.12, 0.12, 0x55595b, { y: 6 }, M.metal);
      for (let i = 0; i < 4; i++) c.boite(0.36, 0.3, 0.2, 0x3a3c3e, { x: -0.6 + i * 0.4, y: 6.25 }, M.tole);
    });
    rectObstacle(b, xt, zt, 0, -1.3, 1.3, -0.6, 0.6, "tour d'éclairage");
  }
  // Le panneau d'approche, des deux côtés
  c.repere({ x: 59, z: 17.4, ry: 0.35 }, () => {
    for (const s of [-1, 1]) c.boite(0.1, 3.2, 0.1, 0x8a8f90, { x: s * 1.3, y: 1.6 }, M.metal);
    c.boite(2.9, 1.15, 0.06, 0xd8d4c8, { y: 2.65 }, M.tole);
    panneau(c, R.controle, { y: 2.65, z: 0.035 }, 2.8, 1.05);
    panneau(c, R.controle, { y: 2.65, z: -0.035, ry: Math.PI }, 2.8, 1.05);
  });
  rectObstacle(b, 59, 17.4, 0.35, -1.4, 1.4, -0.1, 0.1, "panneau");
  // Les cônes, alignés puis renversés ; les masques et les gants qui traînent
  for (let i = 0; i < 26; i++) {
    const zz = i % 2 ? 4.4 : 8.05;
    const xx = 50 + Math.floor(i / 2) * 1.0 + (hache(i) - 0.5) * 0.3;
    if (xx > 59.5) continue;
    const tombe = hache(i * 7) < 0.25 + 0.35 * u;
    cone(c, xx + (tombe ? 0.4 : 0), zz + (tombe ? (hache(i * 3) - 0.5) * 1.2 : 0), tombe, hache(i * 9) * 3);
  }
  for (let i = 0; i < 9; i++) cone(c, 64 + hache(i * 5) * 12, -1.6 - hache(i * 7) * 9, hache(i) < 0.6, hache(i * 2) * 3);
  debris(c, 58, 1, 80, 14, 40, [0xf2f0ea, 0x8ab4c8, 0xe6e2d8, 0x6a8ab4]);
  // La tête du bouchon : la voiture coincée dans la chicane, portière ouverte
  voiture(ctx, { x: 61.6, z: 6.2, ry: 0.06, type: "citadine", couleur: 0xa3a39b, rv: 0.4, rv2: 0.5, rv3: 0.5, porte: { cote: -1, pos: "av" } });
  // Au-delà : la route vide. Une chaussure, un sac, l'herbe.
  sac(c, 86.5, 5.2, 0.4, 0x4a5a7a);
  c.boite(0.28, 0.1, 0.11, 0x3a2e26, { x: 90.4, y: 0.05, z: 7.1, ry: 0.8 }, M.satin);
  semerTouffes(c, 80, 1.2, 100, 14.2, Math.round(10 + 24 * u), PALETTE.herbeSeche);
  if (u > 0.4) for (let i = 0; i < 4; i++) arbuste(c, 84 + i * 4.3, 2 + hache(i * 3) * 11, 0.5 + hache(i) * 0.5);
}

// ---------- Les objets à part, par position ----------

const SPECIAUX = [
  { x: -95, f: (ctx) => panneauRoute(ctx, -95, 17.6, R.versVille, 0.35) },
  { x: -86, f: portiquePub },
  { x: -78, f: voitureAutonome },
  { x: -72, f: borneSOS },
  { x: -62, f: portiquePMV },
  { x: -57, f: (ctx) => feu(ctx, -57, 4.5, false) },
  { x: -41, f: ambulance },
  { x: -25, f: carambolage },
  { x: -12.5, f: depanneuse },
  { x: -6, f: (ctx) => feu(ctx, -6, 8.0, false) },
  { x: 7, f: campingCar },
  { x: 25, f: pont },
  { x: 26, f: campement },
  { x: 38, f: tombes },
  { x: 46, f: autocar },
  { x: 56, f: camionLivraison },
  { x: 58.5, f: (ctx) => feu(ctx, 58.5, 1.9, false) },
  { x: 70, f: controle },
  { x: 95, f: (ctx) => panneauRoute(ctx, 95, 17.6, R.versCarrefour, 0.35) },
];

// ---------- La fiche ----------

const FOUILLE = [
  // L'entrée du bouchon
  { x: -88, z: 7.7, quoi: "voiture de Léa et Marc : galerie (bâche, sangles, cordes), coffre (couvertures, conserves)" },
  { x: -78, z: 7.6, quoi: "voiture autonome : câble de recharge (cuivre), trousse de secours « Premium », eau minérale" },
  { x: -72, z: 15.4, quoi: "borne d'appel d'urgence : batterie et petit panneau solaire (électronique)" },
  { x: -93, z: 11.6, quoi: "vélos sur le porte-vélos : chambres à air, câbles de frein, chaîne" },
  { x: -66, z: 8.0, quoi: "la voiture aux phares : batterie de voiture (lourde, encore un peu chargée)" },
  { x: -57.5, z: 5.3, quoi: "ancien feu de camp : charbon de bois, casserole cabossée" },
  { x: -55.5, z: -1.6, quoi: "monospace à contresens : galerie de valises (vêtements, médicaments personnels)" },
  // Le carambolage
  { x: -41, z: 11.8, quoi: "ambulance : pansements, couverture de survie, attelles, bouteille d'oxygène vide" },
  { x: -24.5, z: 8.6, quoi: "navette d'évacuation : sacs des passagers (vêtements, papiers, brosses à dents)" },
  { x: -26.5, z: 2.5, quoi: "remorque couchée : chaînes et sangles d'arrimage (acier)" },
  { x: -14.5, z: -4.6, quoi: "dépanneuse : treuil, câble d'acier, cric, clés, sangles" },
  { x: -35.8, z: -9.0, quoi: "voiture au matelas : matelas, duvets, réchaud à gaz" },
  { x: -13, z: 11.3, quoi: "coffre d'une famille : couches, lait en poudre périmé, jouets de bain (rien d'autre)" },
  // Le pont et le campement
  { x: 25.5, z: 3.0, quoi: "campement : couvertures, duvets, casseroles, briquet" },
  { x: 31.0, z: 2.4, quoi: "réserve de bois du campement (bois de palettes)" },
  { x: 30.5, z: 1.6, quoi: "collecteur d'eau de pluie : eau (à faire bouillir)" },
  { x: 7, z: 12.0, quoi: "camping-car : réchaud, bouteille de gaz, bâche, réserve d'eau" },
  { x: 43, z: 8.4, quoi: "soute du car : valises (vêtements, trousses de toilette, chargeurs)" },
  { x: 17.4, z: 12.8, quoi: "la voiture « c'est à nous » : galerie bâchée (outils, cordes) — quelqu'un la surveille peut-être" },
  // Le contrôle sanitaire
  { x: 56, z: 12.4, quoi: "colis éventrés : piles, chargeurs, gadgets de l'Abondance (petite électronique)" },
  { x: 72.3, z: 3.0, quoi: "table de l'agent : thermomètres frontaux, boîtes de masques, gants" },
  { x: 75.8, z: 13.0, quoi: "tente de triage : caisse de pharmacie (antipyrétiques, désinfectant, compresses)" },
  { x: 77.4, z: -11.2, quoi: "tente de quarantaine : lits de camp (toile, tubes d'aluminium), couvertures" },
  { x: 78.2, z: -13.5, quoi: "caisses de rations de la quarantaine (quelques boîtes)" },
  { x: 62.5, z: 17.6, quoi: "tour d'éclairage : groupe électrogène (carburant au fond du réservoir, cuivre)" },
];

const ETEINTS = [
  { x: -84.5, z: 6.3, type: "ancien habitant : conducteur toujours ceinturé, il bouge quand on passe" },
  { x: -77.6, z: 6.25, type: "ancien habitant : le propriétaire de la voiture autonome, enfermé (les portières électriques ne s'ouvrent plus)" },
  { x: -66, z: 4.5, type: "errant (entre les files)" },
  { x: -58, z: -8, type: "errant (sur les voies vides)" },
  { x: -60.5, z: 13.6, type: "rampant (sous une voiture de la bande d'arrêt d'urgence)" },
  { x: -39.5, z: 15.0, type: "ancien habitant : ambulancier (gilet réfléchissant, sacoche de soins)" },
  { x: -30.8, z: 9.2, type: "ancien habitant : chauffeur de la navette, ceinturé à son poste" },
  { x: -27.6, z: -1.6, type: "rampant (coincé sous la remorque couchée)" },
  { x: -36.2, z: -12.4, type: "équipé : motard au casque intégral (contresens)" },
  { x: -15, z: 4.5, type: "errant" },
  { x: -8, z: -12, type: "errant (sens vide)" },
  { x: 11.5, z: 6.25, type: "ancien habitant : conducteur ceinturé, il bouge quand on passe" },
  { x: 8.5, z: 12.6, type: "ancien habitant : campeur, sous l'auvent" },
  { x: 27, z: 10, type: "errant (attiré par les feux du campement)" },
  { x: 40.5, z: 22.2, type: "errant (près des tombes)" },
  { x: 44, z: 3.6, type: "putréfié (entre le car et les voitures)" },
  { x: 57.6, z: 12.4, type: "errant (dans les colis)" },
  { x: 61.6, z: 6.2, type: "ancien habitant : conducteur en tête de file, ceinturé" },
  { x: 72.2, z: 11.0, type: "équipé : agent sanitaire (visière, combinaison)" },
  { x: 72.5, z: -10.6, type: "ancien habitant : patient de la quarantaine" },
  { x: 65.6, z: -1.6, type: "errant (au pied du mirador)" },
  { x: 88, z: 6, type: "errant (sur la route vide, après le contrôle)" },
];

const ENTREES = [
  { x: -100, z: 4.5, nature: "entrée A : l'autoroute vient de la Ville (ouest), entre les files" },
  { x: -100, z: -6, nature: "entrée A : le sens du retour, presque vide" },
  { x: -30.3, z: 7.3, nature: "porte avant de la navette d'évacuation (côté nord)" },
  { x: -19.5, z: 8.6, nature: "issue de secours arrière de la navette (côté est)" },
  { x: 38, z: 20, nature: "travées tombées du mur antibruit : vers les tombes" },
  { x: 67, z: 15.2, nature: "porte ouest de la tente de triage" },
  { x: 77, z: 15.2, nature: "porte est de la tente de triage" },
  { x: 77.4, z: -8, nature: "porte de la tente de quarantaine (par la brèche du terre-plein, x ≈ 82)" },
  { x: 100, z: 4.5, nature: "sortie B : la route vide vers le Carrefour (est)" },
];

const CARTES = TRONCONS.map((t) => {
  const dans = (p) => p.x >= t.x - 25 && (p.x < t.x + 25 || (t.x + 25 >= 100 && p.x <= 100));
  const local = (l) => l.filter(dans).map((p) => ({ ...p, x: arr(p.x - t.x), z: arr(p.z) }));
  const description = {
    entree: "le portique publicitaire, le panneau à messages figé, la voiture autonome, la borne d'appel d'urgence ; la brèche du terre-plein par où sont partis les contresens",
    carambolage: "le semi-remorque couché en travers, les buses de béton, la pile de voitures ; on passe par la navette d'évacuation (goulet n° 1). L'ambulance, la dépanneuse",
    pont: "le campement des derniers sous le pont (feux, bâches, matelas, le mur des avis de recherche), le camping-car, le car de tourisme, les tombes sur le talus",
    controle: "la tête du bouchon et le contrôle sanitaire de la fièvre grise (goulet n° 2) : file de contrôle, voie Premium, tentes de triage et de quarantaine, mirador. Au-delà, la route vide",
  }[t.id];
  return {
    id: t.id,
    nom: t.nom,
    lot: { l: 50, p: 70 },
    decalage: { x: t.x, z: 0 },
    depart: { x: -23, z: 4.5 },
    solPropre: true,
    description,
    entrees: local(ENTREES),
    fouille: local(FOUILLE),
    eteints: local(ETEINTS),
  };
});

export const FICHE = {
  id: "halte-grand-bouchon",
  nom: "Halte · Le grand bouchon",
  lieu: "Autoroute de l'exode · route de la Ville · halte",
  environnement: "ville",
  anneau: "moyen",
  danger: 4,
  halte: true,
  solPropre: true,
  recit:
    "Le jour où le réseau est tombé, toute la Ville a voulu partir en même temps, et l'autoroute s'est figée pour toujours. Le panneau annonçait « BOUCHON — 3 H » : on a attendu des jours, on a fait du feu entre les voitures, on a enterré les siens sur le talus, puis on a laissé un mot sur le pare-brise et on est parti à pied. Les voitures, elles, pensaient pour nous : l'une d'elles recalcule encore l'itinéraire.",
  inspiration:
    "les embouteillages d'évacuation (ouragans, exodes), les autoroutes figées des récits post-apocalyptiques (The Walking Dead, La Route), les points de contrôle sanitaires des épidémies, les aires et portiques d'autoroute français",
  reperes: [
    "Le sens de l'exode bouché d'un mur à l'autre, le sens du retour presque vide ; les contresens passés par la brèche du terre-plein",
    "Le portique géant : « Partez l'esprit léger : votre voiture pense pour vous » (1er mois offert, sous réserve de connexion au réseau)",
    "Le panneau à messages variables, sur son petit panneau solaire, figé sur « BOUCHON — 3 H · RESTEZ DANS VOS VÉHICULES »",
    "La voiture autonome de luxe dont l'écran affiche encore « Recalcul de l'itinéraire… » ; la borne d'urgence : « Votre appel est important pour nous »",
    "Les mots sur les pare-brise : « Partis à pied vers le Barrage — Léa et Marc », « On revient », « Ne touchez pas, c'est à nous »",
    "Valises sur les toits, galeries chargées, matelas ficelés, vélos, cages vides, sièges bébé vides posés au sol près des portières ouvertes",
    "Le carambolage : le semi couché en travers du terre-plein, ses buses de béton sur le sens vide, la pile de voitures, la carcasse brûlée",
    "Goulet n° 1 : la navette d'évacuation (« ÉVACUATION · navette n° 7 »), porte avant, allée entre les sièges, issue de secours arrière ; sur le toit, un poste de guet et sa lanterne",
    "Le campement sous le pont : bâches, matelas, deux feux, le fil à linge, le mur des avis de recherche sur la pile, un drap délavé pendu au parapet",
    "Les tombes au pied du talus, croix de bois, une bougie dans un bocal ; une croix seule plus haut",
    "Le camping-car et son auvent, le car « Voyages Horizon » à la soute ouverte, la dépanneuse et sa voiture jamais livrée, l'ambulance et son brancard",
    "Le camion « EXPRESS 1H — livré en 1 heure, ou remboursé », éventré, ses colis et ses Watty en peluche",
    "Goulet n° 2 : le contrôle sanitaire de la fièvre grise, file de contrôle, portique thermique (« AVANCEZ · --,- °C »), la Voie Premium au tapis rouge (QR Santé+), tentes, mirador",
    "Après le contrôle : la route vide. Personne n'est passé.",
  ],
  lot: { l: 200, p: 70 },
  depart: { x: -97, z: 4.5 },
  goulets: [
    { x: -25.5, z: 8.6, nature: "le carambolage : on traverse la navette d'évacuation (porte avant → issue de secours arrière)" },
    { x: 69, z: 6.2, nature: "le contrôle sanitaire : la file de contrôle et sa chicane, la voie Premium, ou la tente de triage" },
  ],
  panneaux: [
    { x: -95, z: 17.6, texte: "La Ville ← 6 km" },
    { x: 95, z: 17.6, texte: "Le Carrefour · Comptoir 9 km →" },
  ],
  cartes: CARTES,
};

// ---------- Construction ----------

/** Ramène un tronçon bâti dans le repère de la halte sur son propre lot (géométries, couches, obstacles, lumières). */
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
  const dedans = (x, z) => Math.abs(x) <= lot.l / 2 + 0.5 && Math.abs(z) <= lot.p / 2 + 0.5;
  ud.obstacles = ud.obstacles
    .map((s) => ({ ...s, x1: Math.round((s.x1 - o.x) * 100) / 100, z1: Math.round((s.z1 - o.z) * 100) / 100, x2: Math.round((s.x2 - o.x) * 100) / 100, z2: Math.round((s.z2 - o.z) * 100) / 100 }))
    .filter((s) => dedans(s.x1, s.z1) || dedans(s.x2, s.z2));
  ud.lumieres = ud.lumieres.map((l) => ({ ...l, x: arr(l.x - o.x), z: arr(l.z - o.z) })).filter((l) => dedans(l.x, l.z));
  return groupe;
}

export function creer({ usure = 0.7, carte = "entree" } = {}) {
  const def = CARTES.find((k) => k.id === carte) ?? CARTES[0];
  const o = def.decalage;
  matieres();
  const b = new Batiment(4507 + CARTES.indexOf(def) * 13, usure);
  const x0 = o.x - 25;
  const x1 = o.x + 25;
  const dans = (x) => x >= x0 && (x < x1 || (x1 >= 100 && x <= 100));
  const ctx = { b, c: b.c, u: usure, x0, x1, dans };

  route(ctx);
  murs(ctx);
  talus(ctx);
  for (const v of VOITURES) {
    if (!dans(v.x)) continue;
    const phares = voiture(ctx, v);
    if (phares) pharesClignotants(ctx, phares, v.ry);
  }
  for (const s of SPECIAUX) if (dans(s.x)) s.f(ctx);
  abandons(ctx);
  vegetation(ctx);
  return recentrer(b.construire(), o, def.lot);
}
