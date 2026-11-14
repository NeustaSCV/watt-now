// La halte du péage (route de la Zone industrielle, Book 20 §4 « le péage »), danger ●●●.
//
// L'autoroute s'élargit en éventail vers une gare de péage de douze voies, sous un grand auvent de béton ondulé, puis se
// resserre et franchit un canal sur un pont. Des pillards, « les Percepteurs », ont fait de la barrière un poste-frontière :
// onze voies bouchées (conteneurs, épaves, sacs de sable), une seule ouverte, en chicane, devant leur guérite. On paie
// pour passer : une conserve, des Wh, des bûches. Leur camp occupe le centre d'exploitation et le garage des
// dépanneuses. Goulet n° 1 : la voie ouverte. Goulet n° 2 : le pont autoroutier et sa passerelle de service.
//
// Technique (comme la centrale thermique) : tout est bâti dans le « repère de la halte » (200 × 70 m, origine au centre,
// +x à l'est, +z au sud), puis chaque tronçon de 50 m ne garde que ce qui tombe dans sa bande de x et se recentre.
// Les éléments continus (sol, chaussée, glissières, grillages, marquages) sont découpés sur une grille fixe : les
// raccords entre tronçons tombent juste. Le hasard des éléments continus vient d'un bruit indexé sur la position
// (`bruit`), pas de l'ordre de construction : deux tronçons voisins voient la même chose à leur frontière.

import * as THREE from "three";
import { Batiment, PALETTE, MAT, matiere, matiereMonde, matiereTexture, matiereVerre, matiereEau, matiereLueur, dessiner, aleatoire, taches, mur, touffes, gravats, debris, jonchee, mousse, arbuste, arbre, flaque } from "../commun/atelier.js";

// ---------- Outils ----------

const lisse = (t) => {
  t = Math.min(1, Math.max(0, t));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;
const arr = (v) => Math.round(v * 10) / 10;

/** Bruit déterministe indexé sur des entiers (position), indépendant de l'ordre de construction. */
function bruit(i, j = 0, k = 0) {
  let h = Math.imul(i | 0, 374761393) ^ Math.imul(j | 0, 668265263) ^ Math.imul((k | 0) + 1013, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const bruitXZ = (x, z, k = 0) => bruit(Math.round(x * 10), Math.round(z * 10), k);
/** Bruit lissé (interpolé sur une grille de `echelle` mètres) : des plaques de couleur, pas un damier. */
function bruitLisse(x, z, k, echelle) {
  const fx = x / echelle;
  const fz = z / echelle;
  const i = Math.floor(fx);
  const j = Math.floor(fz);
  const tx = lisse(fx - i);
  const tz = lisse(fz - j);
  return mix(mix(bruit(i, j, k), bruit(i + 1, j, k), tx), mix(bruit(i, j + 1, k), bruit(i + 1, j + 1, k), tx), tz);
}

// ---------- Le plan de la halte (repère de la halte entière) ----------

/** Bord nord de la chaussée : l'éventail s'ouvre de x = −72 à −40, la gare court jusqu'à x = 2, puis il se referme. */
function zNord(x) {
  if (x < -72) return -6.5;
  if (x < -40) return mix(-6.5, -23, lisse((x + 72) / 32));
  if (x < 2) return -23;
  if (x < 20) return mix(-23, -6.5, lisse((x - 2) / 18));
  return -6.5;
}
function zSud(x) {
  if (x < -72) return 14.5;
  if (x < -40) return mix(14.5, 25.5, lisse((x + 72) / 32));
  if (x < 2) return 25.5;
  if (x < 30) return mix(25.5, 14.5, lisse((x - 2) / 28));
  return 14.5;
}
const AXE = 4; // le terre-plein central

// La gare : voie 1 (large, ouverte, en chicane) au nord, puis onze îlots et onze voies bouchées.
const CAB = -20; // la ligne des cabines
const ILOT = { x0: -34, x1: -6 };
const AUVENT = { x0: -27, x1: -13, z0: -23.8, z1: 26.2 };
const PALISSADE = -18.5;
const ilot = (k) => {
  const z0 = -18.5 + (k - 1) * 4;
  return { z0, z1: z0 + 1.4, zc: z0 + 0.7 };
};
const voie = (n) => (n === 1 ? { z0: -23, z1: -18.5, zc: -20.75 } : { z0: ilot(n - 1).z1, z1: ilot(n - 1).z1 + 2.6, zc: ilot(n - 1).z1 + 1.3 });
/** Le dessous de l'auvent, ondulé : creux sur les îlots (les poteaux), bosses au-dessus des voies. */
const yAuvent = (z) => 6.4 - 0.45 * Math.cos((2 * Math.PI * (z - ilot(1).zc)) / 4);

const BASSIN = { x0: -93, x1: -69, z0: -29.5, z1: -16.5, marge: 3.5, prof: 2.4, eau: -1.75 };
const RAVIN = { x0: 63, x1: 87, berge: 6, prof: 5.6, eau: -4.4 };
const PONT = { x0: 63, x1: 87, zN: -6.8, zS: 14.8, passerelle: -8.4 };
const BAT = { x0: 16, x1: 44, z0: -30.5, z1: -13.5, zm: -21.5, h: 3.4 };
const GAR = { x0: 30, x1: 48, z0: 18.5, z1: 30.5, h: 5 };
const LT = { x0: -47, x1: -35, z0: 26.2, z1: 30.6, h: 3 };
const PARK = { x0: 49, x1: 62, z0: -28, z1: -10 };
const FOURGON = { x: -60.5, z: 21.5, ry: 0.38 };
const TOUR = { x: -13, z: -27.5 };
const CAGE = { x: -6, z: -28.6 };
const DOUANE = { x: -21.7, z: -24.3 };

function dansRectDoux(x, z, r) {
  const d = Math.min(x - r.x0, r.x1 - x, z - r.z0, r.z1 - z);
  return d <= 0 ? 0 : lisse(d / r.marge);
}
function ravin(x) {
  if (x <= RAVIN.x0 || x >= RAVIN.x1) return 0;
  return lisse(Math.min(x - RAVIN.x0, RAVIN.x1 - x) / RAVIN.berge);
}
/** Le relief : talus d'autoroute au nord et au sud (la route est en déblai), bassin de rétention, ravin du canal. */
function hauteur(x, z) {
  let h = 0;
  const a = Math.abs(z);
  if (a > 31) h = 3.4 * lisse((a - 31) / 4) + 0.5 * Math.sin(x * 0.19 + (z > 0 ? 1.3 : 0)) * lisse((a - 31) / 4);
  h -= BASSIN.prof * dansRectDoux(x, z, BASSIN);
  const k = ravin(x);
  if (k > 0) h = h * (1 - k) - RAVIN.prof * k;
  return h;
}

// ---------- Couleurs ----------

const COUL = {
  asphalte: 0x86857f,
  dalle: 0xb8b3a6,
  marquage: 0xe8e4d6,
  beton: 0xbfbaae,
  betonSombre: 0x8e8a80,
  auvent: 0xd6d1c4,
  cabine: 0xd9d3c3,
  cabineBleu: 0x4a6f8c,
  cadre: 0x5c666b,
  glissiere: 0xa5aaa8,
  poteau: 0x7d8580,
  grillage: 0xa6b0a4,
  sac: 0xa5966e,
  sacSombre: 0x8a7d5a,
  jerseyRouge: 0xb24a3c,
  jerseyBlanc: 0xd8d4c8,
  pneu: 0x2b2a28,
  orange: 0xd9762e,
  facade: 0xd8d0bc,
  bleuSociete: 0x3d6688,
  enduitInt: 0xd9d4c6,
  bois: PALETTE.bois,
  boisGris: PALETTE.boisGris,
};
const COUL_AUTO = [0x8e4a3e, 0x4e6a7a, 0xb8b4a8, 0x5d6b4a, 0x37424e, 0xa08a5a, 0x7a7f84, 0x9c6a3a, 0x6b5a78, 0xc2b79a];
const COUL_TOLE = [0x8a6a4a, 0x6f7f86, 0x9a5a3c, 0x7a7a6a, 0x5f6e5c, 0x8c8a7c];
const COUL_BACHE = [0x4f6f8f, 0x6b7f5a, 0x8a8577, 0x5a6e86];

function teinte(hex, vers, t) {
  const a = new THREE.Color(hex);
  a.lerp(new THREE.Color(vers), t);
  return a.getHex();
}

// ---------- Matières et atlas ----------

const AL = 1024;
const AH = 2304;
/** L'atlas des enseignes, panneaux, affiches et graffitis (une seule matière) : [x, y, l, h] en pixels. */
const R = {
  peage: [0, 0, 1024, 160],
  premium: [0, 160, 1024, 256],
  sourire: [0, 416, 512, 128],
  stop: [512, 416, 512, 128],
  tarifs: [0, 544, 512, 384],
  visage: [512, 544, 256, 256],
  ecrans: [768, 544, 256, 256],
  pPremium: [512, 800, 128, 128],
  pCB: [640, 800, 128, 128],
  pSourire: [768, 800, 128, 128],
  pCroix: [896, 800, 128, 128],
  bleuA: [0, 928, 512, 192],
  bleuB: [512, 928, 512, 192],
  pmv: [0, 1120, 512, 128],
  transfonds: [512, 1120, 512, 128],
  billet: [0, 1248, 256, 128],
  grillage: [256, 1248, 256, 128],
  chevrons: [512, 1248, 256, 64],
  bassin: [512, 1312, 256, 64],
  flr: [768, 1248, 256, 128],
  exploitation: [0, 1376, 1024, 128],
  bonneRoute: [0, 1504, 1024, 128],
  graffiti: [0, 1632, 512, 192],
  jours: [512, 1632, 256, 192],
  watty: [768, 1632, 256, 384],
  intervention: [0, 1824, 512, 96],
  filmes: [512, 1824, 256, 96],
  sos: [0, 1920, 256, 128],
  limite: [256, 1920, 128, 128],
  peage1000: [384, 1920, 384, 128],
  livraison: [0, 2048, 1024, 128],
  oeufs: [0, 2176, 512, 128],
  banniere: [512, 2176, 512, 128],
};

let MATS = null;
function matieres() {
  if (MATS) return MATS;
  const atlas = dessiner("peage-atlas", AL, AH, dessinerAtlas, false);
  const asphalte = matiereTexture(dessiner("peage-asphalte", 256, 256, dessinerAsphalte), { roughness: 0.95 });
  asphalte.userData.tuile = 9;
  const enseignes = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.85, alphaTest: 0.5, side: THREE.DoubleSide });
  const neon = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 0.9, vertexColors: true, roughness: 0.5, side: THREE.DoubleSide });
  neon.userData.sansOmbre = true;
  MATS = {
    atlas,
    asphalte,
    enseignes,
    neon,
    beton: matiereMonde("beton"),
    mat: matiere(0.95, 0),
    satin: matiere(0.6, 0.05),
    lisse: matiere(0.3, 0.05),
    tole: matiere(0.75, 0.3),
    metal: matiere(0.4, 0.7),
    toile: MAT.toile(),
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    eau: matiereEau(0x3c4a44, 0.7),
    lueur: matiereLueur(0xffffff, 0.5),
  };
  return MATS;
}

// ---------- Textures dessinées ----------

function grainZone(g, a, x, y, l, h, n, force = 0.06) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = a() < 0.5 ? `rgba(0,0,0,${force})` : `rgba(255,255,255,${force})`;
    g.fillRect(x + a() * l, y + a() * h, 1 + a() * 2.5, 1 + a() * 2.5);
  }
}
function salir(g, a, r, force = 1) {
  const [x, y, l, h] = r;
  g.save();
  g.beginPath();
  g.rect(x, y, l, h);
  g.clip();
  grainZone(g, a, x, y, l, h, (l * h) / 180, 0.05 * force);
  for (let i = 0; i < 4 + (l * h) / 9000; i++) {
    const cx = x + a() * l;
    const cy = y + a() * h;
    const rr = 6 + a() * Math.min(l, h) * 0.3;
    const d = g.createRadialGradient(cx, cy, 0, cx, cy, rr);
    d.addColorStop(0, `rgba(70,60,45,${0.18 * force})`);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
  }
  for (let i = 0; i < l / 30; i++) {
    const cx = x + a() * l;
    const lg = h * (0.2 + a() * 0.6);
    const d = g.createLinearGradient(0, y, 0, y + lg);
    d.addColorStop(0, `rgba(60,50,40,${0.22 * force})`);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(cx, y, 1 + a() * 4, lg);
  }
  g.restore();
}
function fond(g, r, couleur) {
  g.fillStyle = couleur;
  g.fillRect(r[0], r[1], r[2], r[3]);
}
function ecrire(g, s, cx, cy, maxL, taille, couleur, style = "bold", famille = "'Arial Narrow', Arial, Helvetica, sans-serif") {
  g.fillStyle = couleur;
  g.textAlign = "center";
  g.textBaseline = "middle";
  let t = taille;
  do {
    g.font = `${style} ${t}px ${famille}`;
    t -= 2;
  } while (g.measureText(s).width > maxL && t > 8);
  g.fillText(s, cx, cy);
}
/** Lettres peintes à la main au pinceau, un peu de travers, avec des coulures. */
function peindre(g, a, s, cx, cy, maxL, taille, couleur) {
  g.save();
  g.translate(cx, cy);
  g.rotate((a() - 0.5) * 0.06);
  ecrire(g, s, 0, 0, maxL, taille, couleur, "bold", "'Marker Felt', 'Comic Sans MS', 'Chalkboard', cursive");
  g.font = `bold ${taille}px sans-serif`;
  const w = Math.min(maxL, g.measureText(s).width);
  g.fillStyle = couleur;
  for (let i = 0; i < s.length / 2; i++) g.fillRect(-w / 2 + a() * w, taille * 0.3, 2, 6 + a() * taille * 0.5);
  g.restore();
}
function cadre(g, r, couleur, ep = 6, marge = 8) {
  g.strokeStyle = couleur;
  g.lineWidth = ep;
  g.strokeRect(r[0] + marge, r[1] + marge, r[2] - marge * 2, r[3] - marge * 2);
}
function sourireDessin(g, cx, cy, rr, couleur, epaisseur = 6) {
  g.strokeStyle = couleur;
  g.fillStyle = couleur;
  g.lineWidth = epaisseur;
  g.beginPath();
  g.arc(cx, cy, rr, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.arc(cx - rr * 0.35, cy - rr * 0.25, rr * 0.11, 0, Math.PI * 2);
  g.arc(cx + rr * 0.35, cy - rr * 0.25, rr * 0.11, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.arc(cx, cy + rr * 0.05, rr * 0.55, 0.15 * Math.PI, 0.85 * Math.PI);
  g.stroke();
}
function couronne(g, cx, cy, s, couleur) {
  g.fillStyle = couleur;
  g.beginPath();
  g.moveTo(cx - s, cy + s * 0.5);
  g.lineTo(cx - s, cy - s * 0.4);
  g.lineTo(cx - s * 0.5, cy);
  g.lineTo(cx, cy - s * 0.6);
  g.lineTo(cx + s * 0.5, cy);
  g.lineTo(cx + s, cy - s * 0.4);
  g.lineTo(cx + s, cy + s * 0.5);
  g.closePath();
  g.fill();
}
function watty(g, cx, cy, s) {
  // La pile souriante de la Compagnie
  g.fillStyle = "#e9c64a";
  g.fillRect(cx - s * 0.5, cy - s, s, s * 2);
  g.fillStyle = "#5a8f4e";
  g.fillRect(cx - s * 0.5, cy + s * 0.2, s, s * 0.8);
  g.fillStyle = "#c9c4b6";
  g.fillRect(cx - s * 0.18, cy - s * 1.18, s * 0.36, s * 0.2);
  sourireDessin(g, cx, cy - s * 0.4, s * 0.32, "#3a2f20", 4);
  g.fillStyle = "#fff";
  ecrire(g, "+", cx, cy + s * 0.6, s, s * 0.6, "#fff");
}

function dessinerAtlas(g) {
  const a = aleatoire(404);
  g.clearRect(0, 0, AL, AH);

  // PÉAGE : bandeau bleu, lettres blanches
  fond(g, R.peage, "#2f5d8c");
  cadre(g, R.peage, "#e8e4d8", 5, 10);
  ecrire(g, "P É A G E", 512, 82, 900, 118, "#f0ece0");
  salir(g, a, R.peage, 1.2);

  // Télépéage Premium : grand panneau publicitaire, déchiré, tagué
  {
    const [x, y, l, h] = R.premium;
    const d = g.createLinearGradient(x, y, x + l, y + h);
    d.addColorStop(0, "#3a2a5a");
    d.addColorStop(1, "#6a4a7a");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
    couronne(g, x + 110, y + 100, 52, "#d9b450");
    ecrire(g, "TÉLÉPÉAGE PREMIUM", x + 580, y + 70, 760, 74, "#e6c463");
    ecrire(g, "Passez sans vous arrêter, payez sans y penser.", x + 560, y + 140, 800, 38, "#f2ece0", "italic bold");
    ecrire(g, "* Abonnement mensuel reconduit à vie. Résiliable par courrier recommandé, en personne, un mardi.", x + 512, y + 222, 960, 17, "#cfc6d8", "normal");
    salir(g, a, R.premium, 1.4);
    // Coin arraché (transparent : l'alphaTest découpe l'affiche)
    g.clearRect(x + l - 120, y, 120, 50);
    g.clearRect(x + l - 60, y + 50, 60, 40);
    // Tag des pillards
    peindre(g, a, "PAYEZ ICI →", x + 300, y + 190, 360, 44, "rgba(200,40,30,0.85)");
  }

  // Paiement par sourire
  fond(g, R.sourire, "#e3c24a");
  sourireDessin(g, 70, 480, 40, "#2a2418", 7);
  ecrire(g, "PAIEMENT PAR SOURIRE", 300, 470, 390, 42, "#2a2418");
  ecrire(g, "Reconnaissance faciale · sans contact", 300, 512, 380, 18, "#4a3f28", "normal");
  salir(g, a, R.sourire, 1.3);

  // STOP · DOUANE, peint sur une tôle rouillée
  fond(g, R.stop, "#7d5e44");
  for (let i = 0; i < 16; i++) {
    g.fillStyle = i % 2 ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.06)";
    g.fillRect(512 + i * 32, 416, 16, 128);
  }
  peindre(g, a, "STOP · DOUANE", 768, 462, 470, 58, "#e8e0d0");
  peindre(g, a, "on paie ici", 768, 515, 300, 28, "#d9c9a8");
  salir(g, a, R.stop, 1.5);

  // Les tarifs de la douane, peints sur des planches
  {
    const [x, y, l, h] = R.tarifs;
    for (let i = 0; i < 6; i++) {
      const v = 120 + Math.floor(a() * 30);
      g.fillStyle = `rgb(${v},${v - 28},${v - 55})`;
      g.fillRect(x, y + i * 64, l, 62);
      g.fillStyle = "rgba(0,0,0,0.3)";
      g.fillRect(x, y + i * 64 + 62, l, 2);
    }
    peindre(g, a, "DOUANE DU PÉAGE", x + 256, y + 40, 460, 44, "#efe6d2");
    peindre(g, a, "TARIFS", x + 256, y + 92, 300, 34, "#d9b450");
    peindre(g, a, "1 conserve / personne", x + 256, y + 150, 470, 34, "#efe6d2");
    peindre(g, a, "3 Wh / vélo", x + 256, y + 200, 470, 34, "#efe6d2");
    peindre(g, a, "Charbonniers : 2 bûches", x + 256, y + 250, 470, 34, "#efe6d2");
    peindre(g, a, "Charrette : 1 poule", x + 256, y + 300, 470, 34, "#efe6d2");
    peindre(g, a, "Sourire : REFUSÉ", x + 256, y + 350, 470, 32, "#e05a40");
    salir(g, a, R.tarifs, 1.2);
  }

  // Borne : « Votre trajet a été facturé à votre visage »
  {
    const [x, y, l, h] = R.visage;
    fond(g, R.visage, "#10202c");
    g.strokeStyle = "#5fd0ff";
    g.lineWidth = 4;
    for (const [cx, cy, sx, sy] of [[x + 40, y + 30, 1, 1], [x + l - 40, y + 30, -1, 1], [x + 40, y + 130, 1, -1], [x + l - 40, y + 130, -1, -1]]) {
      g.beginPath();
      g.moveTo(cx, cy + sy * 22);
      g.lineTo(cx, cy);
      g.lineTo(cx + sx * 22, cy);
      g.stroke();
    }
    g.beginPath();
    g.ellipse(x + 128, y + 80, 30, 38, 0, 0, Math.PI * 2);
    g.stroke();
    ecrire(g, "Votre trajet a été", x + 128, y + 168, 230, 24, "#bfeaff");
    ecrire(g, "facturé à votre visage.", x + 128, y + 196, 230, 24, "#bfeaff");
    ecrire(g, "Merci de votre fidélité.", x + 128, y + 230, 220, 16, "#6fb0d0", "normal");
  }

  // Le mur d'écrans de vidéosurveillance, mort
  {
    const [x, y] = R.ecrans;
    fond(g, R.ecrans, "#2a2c2e");
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        const px = x + 6 + i * 62;
        const py = y + 6 + j * 62;
        const k = a();
        g.fillStyle = k < 0.12 ? "#26468a" : "#121416";
        g.fillRect(px, py, 56, 56);
        g.fillStyle = "rgba(255,255,255,0.07)";
        g.beginPath();
        g.moveTo(px, py);
        g.lineTo(px + 30, py);
        g.lineTo(px, py + 30);
        g.fill();
        if (k < 0.12) ecrire(g, "PAS DE SIGNAL", px + 28, py + 28, 52, 9, "#cfd8ff");
        if (k > 0.85) {
          g.strokeStyle = "rgba(220,220,220,0.5)";
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(px + 28, py + 28);
          for (let s = 0; s < 6; s++) g.lineTo(px + a() * 56, py + a() * 56);
          g.stroke();
        }
      }
  }

  // Pictogrammes des voies
  fond(g, R.pPremium, "#4a3a6a");
  couronne(g, 576, 860, 36, "#e6c463");
  ecrire(g, "PREMIUM", 576, 905, 110, 18, "#e6c463");
  fond(g, R.pCB, "#2f7a52");
  g.fillStyle = "#e8e4d6";
  g.fillRect(668, 836, 72, 48);
  g.fillStyle = "#2f7a52";
  g.fillRect(668, 846, 72, 9);
  ecrire(g, "CB", 704, 905, 100, 22, "#e8e4d6");
  fond(g, R.pSourire, "#e3c24a");
  sourireDessin(g, 832, 856, 34, "#2a2418", 6);
  ecrire(g, "SOURIRE", 832, 908, 110, 18, "#2a2418");
  fond(g, R.pCroix, "#1a1a1a");
  g.strokeStyle = "#d8352a";
  g.lineWidth = 16;
  g.beginPath();
  g.moveTo(924, 828);
  g.lineTo(996, 900);
  g.moveTo(996, 828);
  g.lineTo(924, 900);
  g.stroke();
  for (const r of [R.pPremium, R.pCB, R.pSourire, R.pCroix]) salir(g, a, r, 1);

  // Panneaux bleus d'autoroute (les extrémités de la halte)
  for (const [r, l1, l2, l3] of [
    [R.bleuA, "Zone industrielle", "Entrepôts  ·  3 km  →", "Péage à 100 m"],
    [R.bleuB, "←  Comptoir des Compteurs", "Ville  ·  4 km", "←  Ton terrain"],
  ]) {
    fond(g, r, "#2a5a9a");
    cadre(g, r, "#eef0f0", 5, 9);
    ecrire(g, l1, r[0] + r[2] / 2, r[1] + 52, r[2] - 50, 44, "#f2f2ee");
    ecrire(g, l2, r[0] + r[2] / 2, r[1] + 106, r[2] - 50, 38, "#f2f2ee");
    g.fillStyle = "#f2f2ee";
    g.fillRect(r[0] + 30, r[1] + 134, r[2] - 60, 2);
    ecrire(g, l3, r[0] + r[2] / 2, r[1] + 160, r[2] - 80, 26, "#dfe6f0");
    salir(g, a, r, 1.1);
  }

  // Panneau à message variable : points ambrés
  {
    const [x, y, l, h] = R.pmv;
    fond(g, R.pmv, "#0b0b0a");
    ecrire(g, "SOURIEZ :", x + l / 2, y + 38, l - 40, 40, "#ffb030", "bold", "monospace");
    ecrire(g, "VOUS ÊTES FACTURÉ", x + l / 2, y + 90, l - 40, 40, "#ffb030", "bold", "monospace");
    g.fillStyle = "#0b0b0a";
    for (let i = 0; i < l; i += 6) g.fillRect(x + i, y, 2, h);
    for (let j = 0; j < h; j += 6) g.fillRect(x, y + j, l, 2);
  }

  // Le fourgon blindé
  fond(g, R.transfonds, "#d6d4cc");
  g.fillStyle = "#24365a";
  g.beginPath();
  g.moveTo(560, 436 + 700);
  g.lineTo(610, 1136);
  g.lineTo(610, 1196);
  g.lineTo(585, 1222);
  g.lineTo(560, 1196);
  g.closePath();
  g.fill();
  ecrire(g, "TRANSFONDS", 820, 1160, 380, 54, "#24365a");
  ecrire(g, "Votre argent, notre passion", 820, 1208, 380, 24, "#5a6a88", "italic bold");
  salir(g, a, R.transfonds, 1.3);

  // Un billet de l'Abondance (cent crédits, inutiles)
  {
    const [x, y, l, h] = R.billet;
    fond(g, R.billet, "#b9c9a0");
    g.strokeStyle = "#5a7050";
    g.lineWidth = 3;
    g.strokeRect(x + 5, y + 5, l - 10, h - 10);
    g.beginPath();
    g.ellipse(x + 180, y + 64, 34, 42, 0, 0, Math.PI * 2);
    g.stroke();
    watty(g, x + 180, y + 72, 22);
    ecrire(g, "100", x + 40, y + 30, 60, 30, "#3a5038");
    ecrire(g, "CENT CRÉDITS", x + 85, y + 72, 130, 18, "#3a5038");
    ecrire(g, "100", x + 40, y + 104, 60, 30, "#3a5038");
  }

  // Grillage (fond transparent : maille en losanges)
  {
    const [x, y, l, h] = R.grillage;
    g.save();
    g.beginPath();
    g.rect(x, y, l, h);
    g.clip();
    g.strokeStyle = "#e8ece6";
    g.lineWidth = 2;
    for (let i = -h; i < l + h; i += 14) {
      g.beginPath();
      g.moveTo(x + i, y);
      g.lineTo(x + i + h, y + h);
      g.moveTo(x + i + h, y);
      g.lineTo(x + i, y + h);
      g.stroke();
    }
    g.lineWidth = 4;
    g.strokeRect(x + 2, y + 2, l - 4, h - 4);
    g.restore();
  }

  // Chevrons jaunes et noirs
  {
    const [x, y, l, h] = R.chevrons;
    fond(g, R.chevrons, "#d9b43a");
    g.save();
    g.beginPath();
    g.rect(x, y, l, h);
    g.clip();
    g.fillStyle = "#1e1c1a";
    for (let i = -h; i < l; i += 40) {
      g.beginPath();
      g.moveTo(x + i, y + h);
      g.lineTo(x + i + 20, y + h);
      g.lineTo(x + i + 20 + h, y);
      g.lineTo(x + i + h, y);
      g.fill();
    }
    g.restore();
    salir(g, a, R.chevrons, 1.2);
  }

  fond(g, R.bassin, "#e8e6de");
  ecrire(g, "BASSIN DE RÉTENTION", 640, 1332, 240, 22, "#2a2a2a");
  ecrire(g, "Baignade interdite", 640, 1358, 220, 18, "#b03028");
  salir(g, a, R.bassin, 1.2);

  // Flèche lumineuse de rabattement (fourgon d'intervention)
  {
    const [x, y, l, h] = R.flr;
    fond(g, R.flr, "#121212");
    g.fillStyle = "#ffb020";
    const pts = [];
    for (let i = 0; i < 9; i++) pts.push([x + 40 + i * 18, y + 64]);
    for (let i = 1; i < 5; i++) pts.push([x + 184 - i * 16, y + 64 - i * 12], [x + 184 - i * 16, y + 64 + i * 12]);
    for (const [px, py] of pts) {
      g.beginPath();
      g.arc(px, py, 6, 0, Math.PI * 2);
      g.fill();
    }
  }

  // Le centre d'exploitation
  fond(g, R.exploitation, "#e2dccb");
  g.fillStyle = "#3d6688";
  g.fillRect(0, 1376, 1024, 14);
  ecrire(g, "CENTRE D'EXPLOITATION", 512, 1428, 900, 50, "#3d6688");
  ecrire(g, "Autoroutes de l'Abondance — Votre confort, notre péage", 512, 1474, 900, 26, "#5a6a78", "italic bold");
  salir(g, a, R.exploitation, 1.3);
  peindre(g, a, "LES PERCEPTEURS", 820, 1440, 300, 36, "rgba(30,30,30,0.8)");

  // Bonne route
  fond(g, R.bonneRoute, "#2f5d8c");
  cadre(g, R.bonneRoute, "#e8e4d8", 4, 10);
  ecrire(g, "BONNE ROUTE  ·  MERCI DE VOTRE FIDÉLITÉ", 512, 1568, 940, 52, "#f0ece0");
  salir(g, a, R.bonneRoute, 1.2);

  // Graffiti des pillards (fond transparent)
  peindre(g, a, "ICI ON PAIE", 256, 1690, 480, 70, "rgba(196,48,36,0.92)");
  peindre(g, a, "LES PERCEPTEURS", 256, 1770, 420, 40, "rgba(24,24,24,0.9)");
  g.strokeStyle = "rgba(240,236,220,0.85)";
  g.lineWidth = 4;
  for (let i = 0; i < 4; i++) {
    for (let k = 0; k < 4; k++) {
      g.beginPath();
      g.moveTo(30 + i * 40 + k * 7, 1792);
      g.lineTo(30 + i * 40 + k * 7, 1818);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(26 + i * 40, 1812);
    g.lineTo(58 + i * 40, 1796);
    g.stroke();
  }

  // Jours sans bouchon
  fond(g, R.jours, "#ecebe4");
  cadre(g, R.jours, "#3d6688", 5, 8);
  ecrire(g, "JOURS SANS", 640, 1680, 220, 30, "#3d6688");
  ecrire(g, "BOUCHON", 640, 1714, 220, 30, "#3d6688");
  ecrire(g, "0", 640, 1774, 120, 70, "#c8362b");
  salir(g, a, R.jours, 1.2);

  // Affiche Watty
  {
    const [x, y, l, h] = R.watty;
    const d = g.createLinearGradient(x, y, x, y + h);
    d.addColorStop(0, "#9fd0e0");
    d.addColorStop(1, "#e9dfc6");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
    watty(g, x + 128, y + 150, 62);
    ecrire(g, "Watty vous souhaite", x + 128, y + 266, 230, 26, "#2f6f73");
    ecrire(g, "bonne route !", x + 128, y + 296, 230, 28, "#2f6f73");
    ecrire(g, "Rechargez-vous à la prochaine aire", x + 128, y + 334, 236, 15, "#4a5a5a", "normal");
    ecrire(g, "(abonnés Premium)", x + 128, y + 354, 236, 14, "#4a5a5a", "normal");
    salir(g, a, R.watty, 1.5);
  }

  // Bandeau des fourgons d'intervention
  fond(g, R.intervention, "#e6e0d2");
  for (let i = 0; i < 12; i++) {
    g.fillStyle = "#d9762e";
    g.beginPath();
    g.moveTo(i * 44, 1920);
    g.lineTo(i * 44 + 22, 1920);
    g.lineTo(i * 44 + 44, 1824);
    g.lineTo(i * 44 + 22, 1824);
    g.fill();
  }
  g.fillStyle = "#e6e0d2";
  g.fillRect(80, 1840, 352, 64);
  ecrire(g, "INTERVENTION", 256, 1864, 330, 34, "#c25a20");
  ecrire(g, "Autoroutes de l'Abondance", 256, 1893, 330, 16, "#5a5a5a", "italic bold");
  salir(g, a, R.intervention, 1.2);

  // Vous êtes filmés
  fond(g, R.filmes, "#f0eee6");
  cadre(g, R.filmes, "#2a5a9a", 4, 5);
  ecrire(g, "VOUS ÊTES FILMÉS", 640, 1854, 230, 26, "#2a5a9a");
  ecrire(g, "Souriez !", 640, 1888, 200, 22, "#2a5a9a", "italic bold");
  salir(g, a, R.filmes, 1.3);

  // Borne d'appel d'urgence
  fond(g, R.sos, "#d9762e");
  ecrire(g, "APPEL D'URGENCE", 128, 1956, 230, 28, "#1e1e1e");
  ecrire(g, "Tapez 1 pour un", 128, 1994, 220, 20, "#1e1e1e", "normal");
  ecrire(g, "conseiller Premium", 128, 2018, 220, 20, "#1e1e1e", "normal");
  salir(g, a, R.sos, 1.2);

  // Limitation 130
  fond(g, R.limite, "#2a5a9a");
  g.fillStyle = "#f2f0ea";
  g.beginPath();
  g.arc(320, 1984, 58, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#c8362b";
  g.lineWidth = 12;
  g.beginPath();
  g.arc(320, 1984, 52, 0, Math.PI * 2);
  g.stroke();
  ecrire(g, "130", 320, 1986, 70, 44, "#1e1e1e");
  g.clearRect(256, 1920, 128, 6);

  // Péage 1000 m
  fond(g, R.peage1000, "#2a5a9a");
  cadre(g, R.peage1000, "#eef0f0", 4, 7);
  ecrire(g, "PÉAGE  1000 m", 576, 1962, 340, 40, "#f2f2ee");
  ecrire(g, "Préparez votre visage", 576, 2008, 340, 26, "#dfe6f0", "italic bold");
  salir(g, a, R.peage1000, 1.1);

  // La remorque du camion : la livraison en dix minutes
  {
    const [x, y, l, h] = R.livraison;
    fond(g, R.livraison, "#e8e4da");
    g.fillStyle = "#c8362b";
    g.fillRect(x, y + h - 26, l, 26);
    ecrire(g, "LIVRÉ AVANT D'Y PENSER", x + 470, y + 50, 760, 58, "#c8362b");
    ecrire(g, "Commandé à 3 h 12, chez vous à 3 h 22. Garanti ou remboursé en crédits.", x + 470, y + 92, 760, 22, "#4a4a48", "italic bold");
    watty(g, x + 930, y + 68, 30);
    salir(g, a, R.livraison, 1.5);
    peindre(g, a, "VIDE", x + 160, y + 80, 200, 50, "rgba(30,30,30,0.85)");
  }
  // Le poulailler des pillards
  fond(g, R.oeufs, "#8a7a5a");
  peindre(g, a, "ŒUFS : 2 Wh", 256, 2218, 460, 54, "#efe6d2");
  peindre(g, a, "pas de crédit", 256, 2270, 300, 28, "#e0b090");
  salir(g, a, R.oeufs, 1.3);
  // La bannière des Percepteurs (un drap peint)
  fond(g, R.banniere, "#d8d0bc");
  peindre(g, a, "PÉAGE DES PERCEPTEURS", 768, 2210, 480, 46, "#8a2a22");
  peindre(g, a, "on paie ou on recule", 768, 2266, 380, 30, "#2a2a28");
  salir(g, a, R.banniere, 1.6);
}

function dessinerAsphalte(g) {
  const a = aleatoire(77);
  g.fillStyle = "#c4c1ba";
  g.fillRect(0, 0, 256, 256);
  grainZone(g, a, 0, 0, 256, 256, 9000, 0.09);
  taches(g, a, 8, "rgba(30,28,24,0.10)", 14, 50, 256, 256);
  taches(g, a, 6, "rgba(255,255,250,0.08)", 14, 50, 256, 256);
  // Fissures en faïençage
  g.strokeStyle = "rgba(30,28,24,0.45)";
  g.lineWidth = 1.2;
  for (let i = 0; i < 9; i++) {
    let x = a() * 256;
    let y = a() * 256;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 7; k++) {
      x += (a() - 0.5) * 30;
      y += (a() - 0.5) * 30;
      g.lineTo(x, y);
    }
    g.stroke();
  }
}

// ---------- Petits outils de pose ----------

/** Un panneau plat dont l'image vient de l'atlas (région `r`), face vers +z local. */
function panneau(c, mat, r, pose, l, h, couleur = 0xffffff) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
  c.poser(g, mat, couleur, pose, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Une boîte tendue entre deux points (longueur selon le segment, section h × ep). */
function barre(c, a, b, h, ep, couleur, mat, options) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  const L = Math.hypot(dx, dz);
  c.boite(Math.hypot(L, dy), h, ep, couleur, { x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, z: (a[2] + b[2]) / 2, ry: -Math.atan2(dz, dx), rz: Math.atan2(dy, L) }, mat, options);
}

/** Un rectangle d'obstacles (quatre segments) tourné de `ry`. */
function obstacleBoite(b, x, z, l, p, ry = 0, nature = "obstacle") {
  const co = Math.cos(ry);
  const si = Math.sin(ry);
  const pts = [[-l / 2, -p / 2], [l / 2, -p / 2], [l / 2, p / 2], [-l / 2, p / 2]].map(([lx, lz]) => [x + lx * co + lz * si, z - lx * si + lz * co]);
  for (let i = 0; i < 4; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % 4];
    b.obstacle(p1[0], p1[1], p2[0], p2[1], nature);
  }
}

/** Pose une géométrie déjà colorée (attribut « color » par sommet) dans le chantier, sans la reteinter. */
function poserBrut(c, positions, couleurs, mat) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(couleurs, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array((positions.length / 3) * 2), 2));
  g.computeVertexNormals();
  let lot = c.lots.get(mat);
  if (!lot) c.lots.set(mat, (lot = []));
  lot.push(g);
}

/** Une géométrie de triangles (positions à plat) posée avec une teinte unique (UV « monde » si la matière est texturée). */
function poserTriangles(c, positions, mat, couleur, options = { crasse: false, nuance: 0 }) {
  if (!positions.length) return;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.computeVertexNormals();
  c.poser(g, mat, couleur, {}, options);
  g.dispose();
}

/** Un carreau de vitre : entier, en éclats ou absent selon l'usure. Repère local : plan xy, épaisseur selon z. */
function carreau(ctx, c, pose, l, h) {
  const r = c.hasard();
  const bris = 0.2 + ctx.u * 0.6;
  if (r > bris) c.boite(l, h, 0.02, 0xffffff, pose, ctx.M.verre, { crasse: false });
  else if (r > bris * 0.45) c.boite(l * 0.45, h * 0.35, 0.02, 0xffffff, { ...pose, y: pose.y - h * 0.32 }, ctx.M.verre, { crasse: false });
}

// ---------- Mobilier roulant : épaves, conteneurs, barricades ----------

function voiture(ctx, x, z, ry, o = {}) {
  const { c, M, u, b } = ctx;
  const coul0 = o.couleur ?? COUL_AUTO[Math.floor(c.hasard() * COUL_AUTO.length)];
  const coul = teinte(coul0, PALETTE.rouille, c.hasard() * u * 0.45);
  const affaisse = c.hasard() < u ? 0.12 : 0;
  const pose = o.retournee ? { x, y: 1.52, z, ry, rx: Math.PI } : { x, y: -affaisse, z, ry, rz: o.penche ?? 0 };
  c.repere(pose, () => {
    c.boite(4.2, 0.6, 1.76, coul, { y: 0.66 }, M.satin);
    c.boite(1.1, 0.12, 1.7, coul, { x: 1.45, y: 1.0, rz: -0.12 }, M.satin);
    // habitacle : vitres sombres, toit
    c.boite(2.2, 0.48, 1.58, 0x2a3134, { x: -0.25, y: 1.2 }, M.lisse);
    c.boite(2.0, 0.08, 1.6, coul, { x: -0.3, y: 1.47 }, M.satin);
    c.boite(0.12, 0.5, 1.6, coul, { x: 0.82, y: 1.2, rz: -0.5 }, M.satin);
    // pare-chocs, phares
    c.boite(0.16, 0.22, 1.8, 0x3a3a38, { x: 2.12, y: 0.48 }, M.mat);
    c.boite(0.16, 0.22, 1.8, 0x3a3a38, { x: -2.12, y: 0.48 }, M.mat);
    c.boite(0.05, 0.12, 0.34, 0xd8d6c8, { x: 2.13, y: 0.72, z: -0.6 }, M.lisse);
    c.boite(0.05, 0.12, 0.34, 0xd8d6c8, { x: 2.13, y: 0.72, z: 0.6 }, M.lisse);
    c.boite(0.05, 0.12, 0.34, 0x8a3028, { x: -2.13, y: 0.76, z: -0.65 }, M.lisse);
    c.boite(0.05, 0.12, 0.34, 0x8a3028, { x: -2.13, y: 0.76, z: 0.65 }, M.lisse);
    // roues (crevées avec l'usure)
    for (const [wx, wz] of [[1.35, -0.8], [1.35, 0.8], [-1.35, -0.8], [-1.35, 0.8]]) {
      const r = affaisse ? 0.28 : 0.34;
      c.tube([wx, r, wz - 0.11], [wx, r, wz + 0.11], r, COUL.pneu, M.mat, 8);
    }
    if (o.portiere) c.boite(1.1, 0.75, 0.06, coul, { x: 0.25, y: 0.85, z: -1.25, ry: 0.85 }, M.satin);
    if (o.coffre) c.boite(0.9, 0.06, 1.6, coul, { x: -2.15, y: 1.45, rz: 1.1 }, M.satin);
  });
  if (!o.sansObstacle) obstacleBoite(b, x, z, 4.3, 1.85, ry, "épave");
}

function conteneur(ctx, x, z, ry, coul, y = 0, obstacle = true) {
  const { c, M, b, u } = ctx;
  const t = teinte(coul, PALETTE.rouille, 0.15 + u * 0.3 * c.hasard());
  c.repere({ x, y, z, ry }, () => {
    c.boite(6.06, 2.59, 2.44, t, { y: 1.295 }, M.tole);
    for (let i = 0; i < 10; i++) {
      const xx = -2.7 + i * 0.6;
      for (const s of [-1, 1]) c.boite(0.22, 2.3, 0.06, t, { x: xx, y: 1.3, z: s * 1.24 }, M.tole, { nuance: 0.03 });
    }
    // portes au bout, barres de fermeture
    for (const zz of [-0.6, -0.2, 0.2, 0.6]) c.boite(0.05, 2.3, 0.05, 0x5a5a56, { x: 3.06, y: 1.3, z: zz }, M.metal);
    c.boite(0.06, 2.4, 0.02, 0x3a3a38, { x: 3.04, y: 1.3 }, M.tole);
  });
  if (obstacle && y < 0.5) obstacleBoite(b, x, z, 6.1, 2.5, ry, "conteneur");
}

/** Un mur de sacs de sable le long d'un segment, en quinconce. */
function sacs(ctx, xa, za, xb, zb, rangs = 3, obstacle = true) {
  const { c, M, b } = ctx;
  const L = Math.hypot(xb - xa, zb - za);
  const ry = -Math.atan2(zb - za, xb - xa);
  const n = Math.max(1, Math.round(L / 0.52));
  for (let r = 0; r < rangs; r++) {
    const dec = r % 2 ? 0.26 : 0;
    for (let i = 0; i < n - (r % 2); i++) {
      const t = (i * 0.52 + 0.26 + dec) / L;
      if (r === rangs - 1 && c.hasard() < 0.15) continue;
      c.boite(0.5, 0.2, 0.34, c.hasard() < 0.5 ? COUL.sac : COUL.sacSombre, { x: xa + (xb - xa) * t, y: 0.1 + r * 0.19, z: za + (zb - za) * t, ry: ry + (c.hasard() - 0.5) * 0.2 }, M.toile, { nuance: 0.08 });
    }
  }
  if (obstacle) b.obstacle(xa, za, xb, zb, "sacs de sable");
}

/** Un séparateur modulaire (« jersey ») le long de x local. */
function jersey(ctx, x, z, ry, coul, obstacle = true) {
  const { c, M, b } = ctx;
  c.repere({ x, y: 0, z, ry }, () => {
    c.boite(2, 0.3, 0.62, coul, { y: 0.15 }, M.satin);
    c.boite(2, 0.55, 0.32, coul, { y: 0.56 }, M.satin);
    c.boite(1.96, 0.06, 0.2, coul, { y: 0.86 }, M.satin);
  });
  if (obstacle) obstacleBoite(b, x, z, 2, 0.62, ry, "séparateur");
}

function pneus(ctx, x, z, n) {
  const { c, M } = ctx;
  for (let i = 0; i < n; i++) {
    const dx = (c.hasard() - 0.5) * 0.12;
    c.tube([x + dx, i * 0.24, z], [x + dx, i * 0.24 + 0.22, z], 0.36, COUL.pneu, M.mat, 8);
  }
}

function cone(ctx, x, z, y = 0, couche = false) {
  const { c, M } = ctx;
  c.boite(0.36, 0.04, 0.36, COUL.orange, { x, y: y + 0.02, z }, M.satin);
  c.poser(GEO.cone, M.satin, COUL.orange, { x, y: y + 0.36, z }, { nuance: 0.08 });
  c.poser(GEO.bande, M.satin, 0xe8e4d8, { x, y: y + 0.42, z }, { crasse: false });
}
const GEO = {
  cone: new THREE.ConeGeometry(0.14, 0.66, 6),
  bande: new THREE.CylinderGeometry(0.075, 0.095, 0.1, 6),
  dome: new THREE.SphereGeometry(1, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2),
  boule: new THREE.IcosahedronGeometry(1, 0),
};

/** Un brasero (fût percé) avec ses flammes. */
function brasero(ctx, x, z) {
  const { c, M } = ctx;
  c.tube([x, 0, z], [x, 0.85, z], 0.3, PALETTE.rouilleSombre, M.tole, 8);
  for (let i = 0; i < 4; i++) c.boite(0.08, 0.05, 0.02, 0xff9a3a, { x: x + Math.cos(i * 1.6) * 0.3, y: 0.45, z: z + Math.sin(i * 1.6) * 0.3, ry: -i * 1.6 }, M.lueur, { crasse: false, nuance: 0 });
  for (let i = 0; i < 4; i++) c.poser(GEO.boule, M.lueur, i % 2 ? 0xff7a20 : 0xffc050, { x: x + (c.hasard() - 0.5) * 0.25, y: 0.95 + i * 0.12, z: z + (c.hasard() - 0.5) * 0.25, e: [0.16 - i * 0.025, 0.24, 0.16 - i * 0.025] }, { crasse: false, nuance: 0 });
}

function lanterne(ctx, x, y, z) {
  const { c, M } = ctx;
  c.boite(0.18, 0.04, 0.18, 0x2a2a28, { x, y, z }, M.metal);
  c.boite(0.14, 0.2, 0.14, 0xffd890, { x, y: y + 0.13, z }, M.lueur, { crasse: false, nuance: 0 });
  c.boite(0.18, 0.04, 0.18, 0x2a2a28, { x, y: y + 0.25, z }, M.metal);
  c.tube([x, y + 0.27, z], [x, y + 0.36, z], 0.04, 0x2a2a28, M.metal, 5);
}

function caisse(ctx, x, z, l = 0.6, h = 0.45, p = 0.4, y = 0, ry = 0, coul = PALETTE.bois) {
  ctx.c.boite(l, h, p, coul, { x, y: y + h / 2, z, ry }, ctx.M.mat, { nuance: 0.08 });
}

function conserves(ctx, x, z, n, y = 0) {
  const { c, M } = ctx;
  const tons = [0xb8452f, 0x2f6f73, 0xc79a3b, 0x8f9a8c];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / 4);
    const k = i % 4;
    c.tube([x + (k % 2) * 0.16 + r * 0.04, y + r * 0.2, z + Math.floor(k / 2) * 0.16], [x + (k % 2) * 0.16 + r * 0.04, y + r * 0.2 + 0.18, z + Math.floor(k / 2) * 0.16], 0.07, tons[i % tons.length], M.metal, 6);
  }
}

// ---------- Le sol : relief, chaussée, marquages ----------

function couleurSol(x, y, z, n) {
  const kb = dansRectDoux(x, z, BASSIN);
  const kr = ravin(x);
  if (kr > 0.04) {
    if (y < RAVIN.eau + 0.5) return n < 0.5 ? 0x5a5644 : 0x63604a;
    return n < 0.35 ? 0x8f8a7e : n < 0.65 ? 0x7e796e : n < 0.85 ? 0x6f7a4a : 0x8a8a62;
  }
  if (kb > 0.04) {
    if (y < BASSIN.eau + 0.25) return 0x5c5840;
    return n < 0.4 ? 0x6f7a46 : n < 0.8 ? 0x7a7448 : 0x5d6a3e;
  }
  const a = Math.abs(z);
  if (a > 31.5) return n < 0.3 ? PALETTE.herbeSombre : n < 0.72 ? 0x6d8d4c : n < 0.9 ? 0x89985a : PALETTE.terreSombre;
  // Terre battue du camp des pillards (et du bivouac des voyageurs, de l'autre côté de la palissade)
  if (z < 0 && x > -50 && x < 47 && z < zNord(x) - 0.6) return n < 0.55 ? 0x8f7656 : n < 0.85 ? 0x9c8462 : 0x7f8a52;
  // Cour gravillonnée du garage
  if (z > 0 && x > 26 && x < 50 && z > zSud(x) + 0.5) return n < 0.6 ? 0x8f8a7c : 0x9a9484;
  return n < 0.38 ? PALETTE.herbeSeche : n < 0.78 ? 0x8ea25a : 0xa39a62;
}

function sol(ctx) {
  const { c, X0, X1, M } = ctx;
  const pas = 2;
  const pos = [];
  const col = [];
  const tmp = new THREE.Color();
  const pousser = (t, hex, v) => {
    tmp.setHex(hex);
    tmp.offsetHSL(0, 0, v);
    for (const p of t) {
      pos.push(p[0], p[1], p[2]);
      col.push(tmp.r, tmp.g, tmp.b);
    }
  };
  const P = (x, z) => [x, hauteur(x, z), z];
  for (let x = X0; x < X1 - 1e-6; x += pas)
    for (let z = -35; z < 35 - 1e-6; z += pas) {
      const a = P(x, z);
      const b2 = P(x + pas, z);
      const c2 = P(x + pas, z + pas);
      const d = P(x, z + pas);
      const diag = (Math.round(x / pas) + Math.round(z / pas)) % 2 === 0;
      const tris = diag ? [[a, d, c2], [a, c2, b2]] : [[a, d, b2], [d, c2, b2]];
      tris.forEach((t, k) => {
        const cx = (t[0][0] + t[1][0] + t[2][0]) / 3;
        const cy = (t[0][1] + t[1][1] + t[2][1]) / 3;
        const cz = (t[0][2] + t[1][2] + t[2][2]) / 3;
        const n = Math.min(0.999, Math.max(0, 0.78 * bruitLisse(cx, cz, 1, 7) + 0.22 * bruit(Math.round(x), Math.round(z), k) - 0.0));
        pousser(t, couleurSol(cx, cy, cz, n), (bruit(Math.round(x), Math.round(z), k + 7) - 0.5) * 0.035);
      });
    }
  // Jupes sur le pourtour du tronçon : on ne voit jamais le vide sous le terrain
  const bas = -6.5;
  const terre = 0x6f5a42;
  for (let z = -35; z < 35 - 1e-6; z += pas) {
    for (const [x, s] of [[X0, 1], [X1, -1]]) {
      const A = P(x, z);
      const D = P(x, z + pas);
      const B = [x, bas, z];
      const C = [x, bas, z + pas];
      if (s > 0) pousser([A, B, C], terre, 0), pousser([A, C, D], terre, 0);
      else pousser([A, C, B], terre, 0), pousser([A, D, C], terre, 0);
    }
  }
  for (let x = X0; x < X1 - 1e-6; x += pas) {
    for (const [z, s] of [[-35, 1], [35, -1]]) {
      const A = P(x, z);
      const B = P(x + pas, z);
      const C = [x + pas, bas, z];
      const D = [x, bas, z];
      if (s > 0) pousser([A, B, C], terre, 0), pousser([A, C, D], terre, 0);
      else pousser([A, C, B], terre, 0), pousser([A, D, C], terre, 0);
    }
  }
  poserBrut(c, pos, col, M.mat);

  // L'eau : le bassin de rétention et le canal
  const eau = (x1, z1, x2, z2, y, coul) => {
    const a1 = Math.max(x1, X0);
    const a2 = Math.min(x2, X1);
    if (a2 <= a1) return;
    c.boite(a2 - a1, 0.02, z2 - z1, coul, { x: (a1 + a2) / 2, y, z: (z1 + z2) / 2 }, M.eau, { crasse: false, nuance: 0 });
  };
  eau(BASSIN.x0 + 0.5, BASSIN.z0 + 0.5, BASSIN.x1 - 0.5, BASSIN.z1 - 0.5, BASSIN.eau, 0xc8d8a0);
  eau(RAVIN.x0 + 3, -35, RAVIN.x1 - 3, 35, RAVIN.eau, 0xc0d4c8);
}

/** La chaussée : une bande d'enrobé de zNord à zSud, la dalle de béton de la gare, les bordures. */
function chaussee(ctx) {
  const { c, X0, X1, M, u } = ctx;
  const pos = [];
  const y = 0.03;
  const pas = 2;
  for (let x = X0; x < X1 - 1e-6; x += pas) {
    const xa = x;
    const xb = x + pas;
    const n1 = zNord(xa);
    const n2 = zNord(xb);
    const s1 = zSud(xa);
    const s2 = zSud(xb);
    pos.push(xa, y, n1, xa, y, s1, xb, y, s2, xa, y, n1, xb, y, s2, xb, y, n2);
  }
  poserTriangles(c, pos, M.asphalte, COUL.asphalte);

  // La dalle de béton de la gare (sous les cabines)
  {
    const a1 = Math.max(-37, X0);
    const a2 = Math.min(-3, X1);
    if (a2 > a1) c.pave(a1, 0.03, -23, a2, 0.04, 25.5, COUL.dalle, M.beton, { crasse: false, nuance: 0.01 });
  }
  // Bordures de la gare (nord et sud)
  for (let x = -40; x < 2; x += 3) {
    const xm = x + 1.5;
    if (!ctx.ici(xm)) continue;
    c.pave(x, 0, -23.2, x + 3, 0.16, -23, COUL.beton, M.beton, { crasse: false });
    c.pave(x, 0, 25.5, x + 3, 0.16, 25.7, COUL.beton, M.beton, { crasse: false });
  }
  // Nids-de-poule, flaques, herbes dans les fissures (régulier, par cases de 6 m)
  for (let x = Math.ceil(X0 / 6) * 6; x < X1; x += 6)
    for (let z = -20; z < 25; z += 6) {
      if (z < zNord(x) + 1 || z > zSud(x) - 1) continue;
      const n = bruitXZ(x, z, 3);
      if (x > 63 && x < 87) continue; // pas de flaque sur le tablier
      if (n < 0.07 + u * 0.08) flaque(c, x + n * 20 - 1, z + 1.2, 0.8 + n * 6);
      else if (n > 0.75 - u * 0.25) touffes(c, [[x + (n - 0.5) * 4, z + 1], [x + (n - 0.5) * 4 + 0.5, z + 1.3]]);
    }
}

/** Les marquages au sol : bandes blanches de l'autoroute, lignes des voies de la gare, « PAYEZ » peint par les pillards. */
function marquages(ctx) {
  const { c, M, u, X0, X1 } = ctx;
  const ligne = (xa, za, xb, zb, l = 0.15) => {
    const xm = (xa + xb) / 2;
    if (!ctx.ici(xm)) return;
    if (bruitXZ(xm, za, 5) < u * 0.35) return; // effacé
    barre(c, [xa, 0.04, za], [xb, 0.04, zb], 0.012, l, COUL.marquage, M.satin, { crasse: false, nuance: 0.03 });
  };
  const autoroute = (x) => x < -72 || x > 32;
  // Lignes continues et tirets de l'autoroute
  for (let x = -100; x < 100; x += 3) {
    if (!autoroute(x + 1.5)) continue;
    for (const z of [-4.0, 3.4, 4.6, 11.8]) ligne(x, z, x + 3, z);
  }
  for (let x = -100; x < 100; x += 13) {
    if (!autoroute(x + 1.5)) continue;
    for (const z of [-0.3, 8.1]) ligne(x, z, x + 3, z);
  }
  // Lignes de rive dans l'éventail (elles suivent les bords)
  for (let x = -72; x < 32; x += 2) {
    if (x >= -40 && x < 2) continue;
    ligne(x, zNord(x) + 0.8, x + 2, zNord(x + 2) + 0.8);
    ligne(x, zSud(x) - 0.8, x + 2, zSud(x + 2) - 0.8);
  }
  // Lignes des voies devant et derrière les îlots
  for (let k = 1; k <= 11; k++) {
    const z = ilot(k).zc;
    ligne(-40, z, -34, z, 0.2);
    ligne(-6, z, 2, z, 0.2);
  }
  // « PAYEZ » peint à la main dans la voie 1, et une flèche
  if (ctx.ici(-38)) {
    panneau(c, M.enseignes, R.stop, { x: -38, y: 0.05, z: voie(1).zc, rx: -Math.PI / 2 }, 4.2, 1.05, 0xd8d0c0);
  }
}

// ---------- Les bords : glissières, terre-plein central, grillages ----------

function glissiere(ctx, xa, xb, zf) {
  const { c, M, b, u } = ctx;
  for (let x = xa; x < xb - 1e-6; x += 2) {
    const x2 = Math.min(x + 2, xb);
    const xm = (x + x2) / 2;
    if (!ctx.ici(xm)) continue;
    const z1 = zf(x);
    const z2 = zf(x2);
    const n = bruitXZ(x, z1, 11);
    const tombe = n < u * 0.12;
    c.boite(0.1, 0.75, 0.1, COUL.poteau, { x, y: 0.37, z: z1, rz: tombe ? 0.5 : 0 }, M.tole);
    if (tombe) {
      barre(c, [x, 0.2, z1], [x2, 0.5, z2 + 0.3], 0.3, 0.05, COUL.glissiere, M.metal);
      continue;
    }
    barre(c, [x, 0.6, z1], [x2, 0.6, z2], 0.3, 0.05, teinte(COUL.glissiere, PALETTE.rouille, n * u * 0.5), M.metal);
    b.obstacle(x, z1, x2, z2, "glissière");
  }
}

/** Le terre-plein central : séparateur en béton (GBA), des brèches avec l'usure (pas sur le pont). */
function terrePlein(ctx, xa, xb) {
  const { c, M, b, u } = ctx;
  for (let x = xa; x < xb - 1e-6; x += 4) {
    const xm = x + 2;
    if (!ctx.ici(xm)) continue;
    const surPont = xm > PONT.x0 && xm < PONT.x1;
    if (!surPont && bruitXZ(x, 4, 13) < u * 0.18) {
      gravats(c, xm, AXE, 1.0, 5, [COUL.beton, COUL.betonSombre]);
      continue;
    }
    c.pave(x, 0, AXE - 0.32, x + 4, 0.3, AXE + 0.32, COUL.beton, M.beton, { nuance: 0.02 });
    c.pave(x, 0.3, AXE - 0.14, x + 4, 0.82, AXE + 0.14, COUL.beton, M.beton, { nuance: 0.02 });
    b.obstacle(x, AXE, x + 4, AXE, "séparateur central");
  }
}

/** Un grillage d'autoroute le long d'une ligne brisée régulière (panneaux de 3 m), découpé par tronçon. */
function grillageLigne(ctx, xa, za, xb, zb, h = 2, trous = []) {
  const { c, M, b, u } = ctx;
  const L = Math.hypot(xb - xa, zb - za);
  const n = Math.max(1, Math.round(L / 3));
  const ry = -Math.atan2(zb - za, xb - xa);
  for (let i = 0; i < n; i++) {
    const t1 = i / n;
    const t2 = (i + 1) / n;
    const p1 = [xa + (xb - xa) * t1, za + (zb - za) * t1];
    const p2 = [xa + (xb - xa) * t2, za + (zb - za) * t2];
    const xm = (p1[0] + p2[0]) / 2;
    const zm = (p1[1] + p2[1]) / 2;
    if (!ctx.ici(xm)) continue;
    c.tube([p1[0], 0, p1[1]], [p1[0], h + 0.1, p1[1]], 0.04, COUL.grillage, M.tole, 5);
    if (i === n - 1) c.tube([p2[0], 0, p2[1]], [p2[0], h + 0.1, p2[1]], 0.04, COUL.grillage, M.tole, 5);
    const ouvert = trous.some(([q1, q2]) => xm >= q1 && xm <= q2) || bruitXZ(xm, zm, 17) < u * 0.1;
    if (ouvert) {
      // panneau arraché, couché dans l'herbe
      if (bruitXZ(xm, zm, 18) < 0.5) panneau(c, M.enseignes, R.grillage, { x: xm, y: 0.05, z: zm + 0.8, ry, rx: -Math.PI / 2 + 0.1 }, L / n, h * 0.8, COUL.grillage);
      continue;
    }
    const pench = (bruitXZ(xm, zm, 19) - 0.5) * 0.12 * u;
    panneau(c, M.enseignes, R.grillage, { x: xm, y: h / 2, z: zm, ry, rx: pench }, L / n, h, COUL.grillage);
    b.obstacle(p1[0], p1[1], p2[0], p2[1], "grillage");
  }
}

function bords(ctx) {
  // Glissières métalliques le long de l'autoroute et de l'éventail ouest
  glissiere(ctx, -100, -40, (x) => zNord(x) - 0.7);
  glissiere(ctx, -100, -63, (x) => zSud(x) + 0.7);
  glissiere(ctx, -57, -40, (x) => zSud(x) + 0.7);
  glissiere(ctx, 56, 63, () => -6.9);
  glissiere(ctx, 50, 63, () => 15.2);
  glissiere(ctx, 87, 100, () => -7.2);
  glissiere(ctx, 87, 100, () => 15.2);
  // La glissière que le fourgon a traversée : tordue, au sol
  if (ctx.ici(-60)) {
    const { c, M } = ctx;
    barre(c, [-63, 0.6, zSud(-63) + 0.7], [-60.5, 0.25, zSud(-60.5) + 2.2], 0.3, 0.05, COUL.glissiere, M.metal);
    barre(c, [-57, 0.6, zSud(-57) + 0.7], [-58.6, 0.15, zSud(-58.6) + 1.8], 0.3, 0.05, COUL.glissiere, M.metal);
  }
  terrePlein(ctx, -100, -72);
  terrePlein(ctx, 32, 100);

  // Grillages au pied des talus (le bord de la halte)
  for (const [xa, xb] of [[-100, -47], [-35, 30], [48, 63], [87, 100]]) grillageLigne(ctx, xa, 30.6, xb, 30.6, 2, xa === -100 ? [[-74, -71]] : []);
  for (const [xa, xb] of [[-100, 16], [44, 63], [87, 100]]) grillageLigne(ctx, xa, -30.6, xb, -30.6, 2);
  // Grillages au bord du ravin (on ne descend pas au canal)
  grillageLigne(ctx, RAVIN.x0, -30.6, RAVIN.x0, PONT.passerelle);
  grillageLigne(ctx, RAVIN.x1, -30.6, RAVIN.x1, PONT.passerelle);
  grillageLigne(ctx, RAVIN.x0, PONT.zS + 0.4, RAVIN.x0, 30.6);
  grillageLigne(ctx, RAVIN.x1, PONT.zS + 0.4, RAVIN.x1, 30.6);
  // Le talus est un bord infranchissable
  for (let x = -100; x < 100; x += 10) {
    if (!ctx.ici(x + 5)) continue;
    ctx.b.obstacle(x, -31.2, x + 10, -31.2, "talus");
    ctx.b.obstacle(x, 31.2, x + 10, 31.2, "talus");
  }
}

// ---------- La végétation ----------

function vegetation(ctx) {
  const { c, u, X0, X1 } = ctx;
  // Sur les talus : arbres et buissons, réguliers par cases de 5 m (raccords exacts)
  for (let x = Math.ceil(X0 / 5) * 5; x < X1; x += 5) {
    for (const s of [-1, 1]) {
      const n = bruit(x, s, 21);
      const zz = s * (32.5 + bruit(x, s, 22) * 2.2);
      const xx = x + bruit(x, s, 23) * 4;
      if (ravin(xx) > 0.02) continue;
      const y = hauteur(xx, zz);
      if (n < 0.34) arbre(c, xx, zz, 6 + bruit(x, s, 24) * 4, bruit(x, s, 25) < 0.25 ? "bouleau" : bruit(x, s, 25) > 0.9 ? "mort" : "feuillu", y - 0.1);
      else if (n < 0.8) arbuste(c, xx, zz, 1.2 + bruit(x, s, 26) * 1.2, y - 0.2);
      const zt = s * (30 + bruit(x, s, 27) * 1.2);
      touffes(c, [[x + 1, zt], [x + 2.6, zt + 0.3 * s], [x + 3.8, zt - 0.2 * s]]);
    }
  }
  // Les bas-côtés : herbes folles, buissons qui gagnent avec l'usure
  for (let x = Math.ceil(X0 / 4) * 4; x < X1; x += 4) {
    for (const s of [-1, 1]) {
      const zb = s < 0 ? zNord(x) - 1.5 - bruit(x, s, 31) * 4 : zSud(x) + 1.5 + bruit(x, s, 31) * 4;
      if (Math.abs(zb) > 30 || ravin(x) > 0.02) continue;
      if (s < 0 && x > -50 && x < 47) continue; // le camp est piétiné
      if (s > 0 && x > -48 && x < 49 && zb > 25) continue;
      const n = bruit(x, s, 32);
      if (n < 0.25 + u * 0.3) touffes(c, [[x, zb], [x + 0.6, zb + 0.4], [x + 1.4, zb - 0.3]]);
      if (n > 0.92 - u * 0.1) arbuste(c, x + 1, zb, 0.8 + n * 0.6);
    }
  }
}

// ---------- Tronçon 1 : l'approche ----------

function portique(ctx) {
  const x = -86;
  if (!ctx.ici(x)) return;
  const { c, M, b } = ctx;
  const k = b.couche("portique", { x, z: 4, l: 3, p: 26 }, 5.4, 8.4);
  for (const z of [-8.4, 16.4]) {
    c.tube([x, 0, z], [x, 7.6, z], 0.22, COUL.poteau, M.tole, 8);
    c.boite(0.9, 0.3, 0.9, COUL.beton, { x, y: 0.15, z }, M.beton);
    b.obstacle(x - 0.3, z, x + 0.3, z, "pied de portique");
  }
  // Treillis : deux membrures et des diagonales
  for (const y of [6.0, 7.4]) for (const dx of [-0.35, 0.35]) k.boite(0.08, 0.08, 25, COUL.poteau, { x: x + dx, y, z: 4 }, M.tole);
  for (let z = -8; z < 16; z += 1.4) {
    barre(k, [x - 0.35, 6.0, z], [x - 0.35, 7.4, z + 1.4], 0.05, 0.05, COUL.poteau, M.tole);
    barre(k, [x + 0.35, 6.0, z], [x + 0.35, 7.4, z + 1.4], 0.05, 0.05, COUL.poteau, M.tole);
  }
  // Panneau à message variable (encore alimenté par son petit panneau solaire) et panneau « Péage 1000 m »
  k.boite(0.3, 1.5, 6.4, 0x2a2a28, { x: x + 0.45, y: 6.7, z: -0.5 }, M.tole);
  panneau(k, M.neon, R.pmv, { x: x + 0.61, y: 6.7, z: -0.5, ry: Math.PI / 2 }, 6, 1.4);
  k.boite(0.1, 1.9, 5.6, 0x2a5a9a, { x: x + 0.45, y: 6.7, z: 9.5 }, M.satin);
  panneau(k, M.enseignes, R.peage1000, { x: x + 0.51, y: 6.7, z: 9.5, ry: Math.PI / 2 }, 5.6, 1.86);
  k.boite(1.2, 0.05, 0.8, 0x2a3a5a, { x: x + 0.2, y: 8.0, z: -4.2, rz: 0.5 }, M.lisse);
  ctx.b.lumiere(x + 1.2, 6.7, -0.5, 0xffa630, 3, 9, "panneau à message variable");
}

function bassin(ctx) {
  const { c, M, b, u } = ctx;
  if (!ctx.ici(-81)) return;
  // Grillage autour du bassin, portillon ouvert côté route
  grillageLigne(ctx, -95, -14.5, -82, -14.5, 1.8);
  grillageLigne(ctx, -79, -14.5, -67, -14.5, 1.8);
  grillageLigne(ctx, -95, -30.4, -95, -14.5, 1.8);
  grillageLigne(ctx, -67, -30.4, -67, -14.5, 1.8);
  c.boite(1.5, 1.6, 0.04, COUL.grillage, { x: -80.2, y: 0.85, z: -13.9, ry: 0.9 }, M.tole);
  panneau(c, M.enseignes, R.bassin, { x: -83.5, y: 1.4, z: -14.4 }, 1.6, 0.4);
  // Roseaux et vase
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const x = -81 + Math.cos(a) * (10 + c.hasard() * 1.5);
    const z = -23 + Math.sin(a) * (5 + c.hasard() * 1.2);
    touffes(c, [[x, z, hauteur(x, z)], [x + 0.4, z + 0.3, hauteur(x + 0.4, z + 0.3)]], 0x7a8a4a);
  }
  for (let i = 0; i < 10; i++) {
    const x = -88 + c.hasard() * 15;
    const z = -26 + c.hasard() * 6;
    c.tube([x, BASSIN.eau - 0.3, z], [x + 0.1, BASSIN.eau + 1.4, z], 0.03, 0x8a8a4a, M.mat, 3);
  }
  // Voiture noyée, le nez dans la vase
  c.repere({ x: -74, y: -1.3, z: -21, ry: 2.4, rz: 0.32 }, () => {
    c.boite(4.2, 0.6, 1.76, 0x6a7a74, { y: 0.66 }, M.satin);
    c.boite(2.2, 0.48, 1.58, 0x2a3134, { x: -0.25, y: 1.2 }, M.lisse);
    c.boite(2.0, 0.08, 1.6, 0x6a7a74, { x: -0.3, y: 1.47 }, M.satin);
  });
  // Un vélo rouillé dans les roseaux, un caddie
  c.repere({ x: -82, y: hauteur(-82, -24.5) + 0.05, z: -24.5, ry: 0.4, rz: 1.35 }, () => {
    for (const dx of [-0.5, 0.5]) c.tube([dx, 0.33, -0.03], [dx, 0.33, 0.03], 0.33, PALETTE.rouilleSombre, M.tole, 8);
    barre(c, [-0.5, 0.33, 0], [0.1, 0.75, 0], 0.04, 0.04, PALETTE.rouille, M.tole);
    barre(c, [0.5, 0.33, 0], [0.1, 0.75, 0], 0.04, 0.04, PALETTE.rouille, M.tole);
  });
  mousse(c, -86, BASSIN.eau, -22, 2.5, 6, 0x6f8a4a);
  b.obstacle(-92, -16.8, -70, -16.8, "berge du bassin");
}

/** Le fourgon blindé de transport de fonds, éventré, et ses billets qui volent. */
function fourgonBlinde(ctx) {
  const { x, z, ry } = FOURGON;
  if (!ctx.ici(x)) return;
  const { c, M, b, u } = ctx;
  const gris = 0xbab8ae;
  c.repere({ x, y: 0, z, ry, rz: -0.04 }, () => {
    // caisse blindée
    c.boite(4.0, 2.2, 2.2, gris, { x: -0.7, y: 1.5 }, M.tole);
    c.boite(1.9, 1.5, 2.1, gris, { x: 2.3, y: 1.15 }, M.tole);
    c.boite(1.0, 0.75, 2.0, 0x2a3134, { x: 2.75, y: 1.65, rz: -0.25 }, M.lisse);
    c.boite(6.3, 0.35, 2.2, 0x3a3a38, { x: 0.3, y: 0.5 }, M.mat);
    for (const [wx, wz] of [[2.0, -0.95], [2.0, 0.95], [-1.6, -0.95], [-1.6, 0.95]]) c.tube([wx, 0.42, wz - 0.14], [wx, 0.42, wz + 0.14], 0.42, COUL.pneu, M.mat, 8);
    // le flanc sud ouvert à la disqueuse : la tôle retroussée
    c.boite(1.6, 1.2, 0.05, gris, { x: -0.6, y: 1.9, z: 1.35, rx: -0.9 }, M.tole);
    c.boite(1.5, 1.0, 0.02, 0x1a1a1a, { x: -0.6, y: 1.5, z: 1.105 }, M.mat);
    panneau(c, M.enseignes, R.transfonds, { x: -2.0, y: 1.9, z: 1.111 }, 1.6, 0.4);
    panneau(c, M.enseignes, R.transfonds, { x: -0.7, y: 1.9, z: -1.111, ry: Math.PI }, 2.8, 0.7);
    // portes arrière arrachées, l'une au sol
    c.boite(0.06, 2.0, 1.0, gris, { x: -2.72, y: 1.5, z: -1.35, ry: 1.3 }, M.tole);
    // étagères vides et sacoches
    for (const yy of [0.9, 1.6]) c.boite(3.4, 0.04, 0.5, 0x6a6a64, { x: -0.8, y: yy, z: -0.75 }, M.metal);
    c.boite(0.5, 0.3, 0.35, 0x3a3028, { x: -1.6, y: 0.85, z: 0.3 }, M.satin);
  });
  c.boite(1.0, 0.06, 2.0, gris, { x: x - 3.6, y: 0.05, z: z + 1.6, ry: 0.9 }, M.tole);
  obstacleBoite(b, x, z, 6.4, 2.3, ry, "fourgon blindé");
  // Billets au sol (inutiles) et pièces
  for (let i = 0; i < 40; i++) {
    const a = c.hasard() * Math.PI * 2;
    const r = 1.5 + Math.sqrt(c.hasard()) * 7;
    panneau(c, M.enseignes, R.billet, { x: x + Math.cos(a) * r, y: 0.03 + i * 0.0005, z: z + Math.sin(a) * r * 0.7, rx: -Math.PI / 2, rz: c.hasard() * 6 }, 0.3, 0.15, 0xe8eedf);
  }
  debris(c, x - 2, z - 1, x + 1, z + 2, 12, [0xb59048, 0x9a9a92, 0xc8b070]);
  billetsVolants(ctx, x - 1, z + 1.5, 28);
}

/** Des billets qui volent au vent autour du fourgon (un seul maillage, animé). */
function billetsVolants(ctx, cx, cz, n) {
  const M = ctx.M;
  const [px, py, pw, ph] = R.billet;
  const u0 = px / AL;
  const u1 = (px + pw) / AL;
  const v1 = 1 - py / AH;
  const v0 = 1 - (py + ph) / AH;
  const pos = new Float32Array(n * 18);
  const uv = new Float32Array(n * 12);
  const col = new Float32Array(n * 18).fill(0.95);
  const a = aleatoire(99);
  const billets = [];
  for (let i = 0; i < n; i++) {
    billets.push({ r: 1 + a() * 6, a0: a() * 6.28, v: 0.15 + a() * 0.35, y: 0.3 + a() * 2.2, amp: 0.3 + a() * 0.8, ph: a() * 6.28, rot: 1 + a() * 3 });
    uv.set([u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1], i * 12);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const coins = [[-0.15, -0.075], [0.15, -0.075], [0.15, 0.075], [-0.15, -0.075], [0.15, 0.075], [-0.15, 0.075]];
  let decal = null;
  let premier = null;
  const maj = (t) => {
    for (let i = 0; i < n; i++) {
      const q = billets[i];
      const ang = q.a0 + t * q.v;
      const bx = cx + Math.cos(ang) * q.r + Math.sin(t * 0.3 + q.ph) * 0.6;
      const bz = cz + Math.sin(ang) * q.r * 0.6;
      const by = q.y + Math.sin(t * 0.9 + q.ph) * q.amp;
      const t1 = t * q.rot + q.ph;
      const ax = [Math.cos(t1), Math.sin(t1 * 0.7) * 0.5, Math.sin(t1)];
      const ay = [-Math.sin(t1) * 0.4, Math.cos(t1 * 0.5), Math.cos(t1) * 0.4];
      for (let k = 0; k < 6; k++) {
        const [lx, ly] = coins[k];
        const o = (i * 6 + k) * 3;
        pos[o] = bx + ax[0] * lx + ay[0] * ly + (decal ? decal[0] : 0);
        pos[o + 1] = by + ax[1] * lx + ay[1] * ly;
        pos[o + 2] = bz + ax[2] * lx + ay[2] * ly + (decal ? decal[1] : 0);
      }
    }
  };
  maj(0);
  premier = [pos[0], pos[2]];
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, M.enseignes);
  m.frustumCulled = false;
  m.castShadow = false;
  m.userData.animer = (t) => {
    // Le tronçon a été recentré (translation de la géométrie) : on retrouve le décalage une fois pour toutes.
    if (!decal) decal = [geo.attributes.position.array[0] - premier[0], geo.attributes.position.array[2] - premier[1]];
    maj(t);
    geo.attributes.position.needsUpdate = true;
  };
  ctx.b.ajouter(m);
}

function borneSOS(ctx, x, z) {
  if (!ctx.ici(x)) return;
  const { c, M } = ctx;
  c.boite(0.45, 1.3, 0.35, COUL.orange, { x, y: 0.65, z }, M.satin);
  c.boite(0.5, 0.1, 0.4, COUL.orange, { x, y: 1.35, z }, M.satin);
  panneau(c, M.enseignes, R.sos, { x, y: 0.95, z: z + 0.18 }, 0.42, 0.21);
  c.boite(0.12, 0.08, 0.02, 0xff5a30, { x, y: 1.2, z: z + 0.18 }, M.lueur, { crasse: false });
  c.boite(0.6, 0.02, 0.4, 0x2a3a5a, { x, y: 1.75, z, rx: 0.4 }, M.lisse);
  c.tube([x, 1.4, z], [x, 1.75, z], 0.02, 0x5a5a56, M.metal, 4);
  ctx.b.lumiere(x, 1.3, z + 0.4, 0xff6a3a, 1.2, 4, "borne d'appel d'urgence (voyant sur batterie)");
}

/** La file du dernier jour : les voitures arrêtées devant le péage, jamais reparties. */
function fileVoitures(ctx) {
  const liste = [
    [-90, 7.6, 0.03, {}],
    [-74, 1.2, 0.05, {}],
    [-70, 8.1, -0.1, { portiere: true }],
    [-66, 1.6, 0.2, { coffre: true }],
    [-62.5, 11, 0.06, {}],
    [-58, -4.5, 0.12, {}],
    [-54, 6.4, -0.15, { portiere: true }],
    [-50.5, 15.5, 0.08, {}],
    [-47.5, -11, 0.26, {}],
    [-44, 2.2, 0, { coffre: true }],
    [-41, 19.5, 0.1, {}],
    [-38.5, 9.5, -0.05, {}],
    [-37, -6.5, 0.1, { portiere: true }],
    [-36.5, 13.8, 0.03, {}],
  ];
  for (const [x, z, ry, o] of liste) if (ctx.ici(x)) voiture(ctx, x, z, ry, o);
}

function panneauxExtremites(ctx) {
  const { c, M, b } = ctx;
  for (const [x, z, r, ry] of [[-96, 17.6, R.bleuA, -0.45], [95, -10.5, R.bleuB, -0.35]]) {
    if (!ctx.ici(x)) continue;
    for (const dz of [-1.6, 1.6]) {
      const px = x + Math.sin(ry) * dz;
      const pz = z + Math.cos(ry) * dz;
      c.tube([px, 0, pz], [px, 3.9, pz], 0.07, COUL.poteau, M.tole, 6);
    }
    c.boite(4.3, 1.65, 0.06, 0x2a5a9a, { x, y: 3.1, z, ry: ry + Math.PI / 2 - Math.PI / 2 }, M.satin);
    panneau(c, M.enseignes, r, { x: x + Math.sin(ry) * 0.04, y: 3.1, z: z + Math.cos(ry) * 0.04, ry }, 4.3, 1.62);
    b.obstacle(x - 0.2, z, x + 0.2, z, "panneau");
  }
}

// ---------- Tronçon 2 : la gare de péage ----------

function ilots(ctx) {
  const { c, M, b, u } = ctx;
  if (!ctx.ici(CAB)) return;
  for (let k = 1; k <= 11; k++) {
    const il = ilot(k);
    // L'îlot en béton, bordures et nez à chevrons
    c.pave(ILOT.x0, 0, il.z0, ILOT.x1, 0.16, il.z1, COUL.beton, M.beton, { nuance: 0.02 });
    for (const [x, ry] of [[ILOT.x0 - 0.01, -Math.PI / 2], [ILOT.x1 + 0.01, Math.PI / 2]]) panneau(c, M.enseignes, R.chevrons, { x, y: 0.09, z: il.zc, ry }, 1.4, 0.14);
    for (const x of [ILOT.x0 + 0.4, ILOT.x1 - 0.4]) {
      c.tube([x, 0.16, il.zc], [x, 1.0, il.zc], 0.09, 0xd9b43a, M.satin, 6);
      c.boite(0.2, 0.12, 0.2, 0x1e1c1a, { x, y: 0.85, z: il.zc }, M.satin);
    }
    // Les poteaux de l'auvent
    for (const x of [-25.2, -14.8]) {
      c.tube([x, 0.16, il.zc], [x, yAuvent(il.zc) + 0.05, il.zc], 0.26, COUL.beton, M.beton, 8);
      b.obstacle(x - 0.26, il.zc, x + 0.26, il.zc, "poteau");
    }
    if (k === 1) guerite(ctx);
    else cabine(ctx, k);
    // La borne de tickets (ou de cartes), côté voie sud
    const zb = il.z1 - 0.3;
    if (k === 6) borneVisage(ctx, -23.4, zb);
    else if (k > 1) {
      c.boite(0.5, 1.25, 0.42, k % 3 === 0 ? 0x4a3a6a : 0x5c666b, { x: -23.4, y: 0.16 + 0.62, z: zb }, M.satin);
      c.boite(0.4, 0.3, 0.05, 0x1e2428, { x: -23.4, y: 1.15, z: zb + 0.22, rx: -0.3 }, M.lisse);
      c.boite(0.16, 0.03, 0.05, 0xd8d6c8, { x: -23.4, y: 0.8, z: zb + 0.22 }, M.metal);
      if (k % 4 === 2) jonchee(c, -24.5, il.z1 + 0.2, -22, il.z1 + 1.4, 8, [0xe8e4d6, 0xd8d2c0, 0xc9c0a8]); // tickets
    }
    // La barrière levante
    if (k > 1) barriere(ctx, -17.2, il.z1, 2.5, k);
    // Sur les îlots, les herbes gagnent
    if (bruit(k, 1, 41) < u) touffes(c, [[ILOT.x0 + 3 + k, il.zc, 0.16], [ILOT.x1 - 4, il.zc + 0.2, 0.16], [-10 - k * 0.3, il.zc, 0.16]]);
  }
  // La barrière de la voie 1 (celle des pillards), baissée
  barriere(ctx, -17.2, ilot(1).z0, -4.4, 1);
}

function barriere(ctx, x, z0, longueur, k) {
  const { c, M, b, u } = ctx;
  c.boite(0.34, 1.05, 0.34, 0xd9d3c3, { x, y: 0.16 + 0.52, z: z0 + Math.sign(longueur) * 0.25 }, M.satin);
  const etat = k === 1 ? "baissee" : bruit(k, 2, 43) < u * 0.6 ? (bruit(k, 3, 43) < 0.5 ? "cassee" : "levee") : "baissee";
  const s = Math.sign(longueur);
  const L = Math.abs(longueur);
  const z1 = z0 + s * 0.25;
  if (etat === "cassee") {
    barre(c, [x + 0.3, 0.06, z1 + s * 0.6], [x + 0.9, 0.12, z1 + s * 2.2], 0.09, 0.09, 0xe8e2d4, M.satin);
    return;
  }
  const n = 6;
  for (let i = 0; i < n; i++) {
    const t1 = i / n;
    const t2 = (i + 1) / n;
    const fin = etat === "levee" ? [x, 1.0 + L * 0.95, z1 + s * L * 0.3] : [x, 1.0, z1 + s * L];
    const p1 = [x + (fin[0] - x) * t1, 1.0 + (fin[1] - 1.0) * t1, z1 + (fin[2] - z1) * t1];
    const p2 = [x + (fin[0] - x) * t2, 1.0 + (fin[1] - 1.0) * t2, z1 + (fin[2] - z1) * t2];
    barre(c, p1, p2, 0.09, 0.09, i % 2 ? 0xe8e2d4 : PALETTE.abondanceRouge, M.satin, { crasse: false });
  }
  if (k === 1) b.obstacle(x, z1, x, z1 + s * L, "barrière des pillards (levée quand on a payé)");
}

function cabine(ctx, k) {
  const { c, M, b, u } = ctx;
  const il = ilot(k);
  const x0 = CAB - 1.8;
  const x1 = CAB + 1.8;
  const z0 = il.zc - 0.6;
  const z1 = il.zc + 0.6;
  const y0 = 0.16;
  c.pave(x0, y0, z0, x1, y0 + 0.85, z1, COUL.cabine, M.satin);
  c.pave(x0 - 0.02, y0 + 0.85, z0 - 0.02, x1 + 0.02, y0 + 0.92, z1 + 0.02, COUL.cabineBleu, M.satin);
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1], [CAB, z1], [CAB, z0]]) c.pave(x - 0.05, y0 + 0.92, z - 0.05, x + 0.05, 2.45, z + 0.05, COUL.cadre, M.metal);
  // vitres
  for (const z of [z0, z1]) for (const xm of [CAB - 0.9, CAB + 0.9]) carreau(ctx, c, { x: xm, y: 1.7, z }, 1.7, 1.45);
  for (const x of [x0, x1]) carreau(ctx, c, { x, y: 1.7, z: il.zc, ry: Math.PI / 2 }, 1.1, 1.45);
  // toit, auvent du guichet, feu de voie
  c.pave(x0 - 0.2, 2.45, z0 - 0.25, x1 + 0.2, 2.68, z1 + 0.25, COUL.cabineBleu, M.satin);
  c.boite(0.36, 0.22, 0.22, 0x1e1e1c, { x: x0 + 0.2, y: 2.8, z: z1 }, M.satin);
  c.boite(0.1, 0.1, 0.02, k % 4 === 1 ? 0x3aa060 : 0xa83028, { x: x0 + 0.2, y: 2.8, z: z1 + 0.12 }, M.lisse, { crasse: false });
  // guichet, tablette, tiroir-caisse et intérieur
  c.pave(CAB - 0.6, 1.1, z1, CAB + 0.6, 1.16, z1 + 0.28, 0x8a8a84, M.metal);
  c.pave(CAB - 0.8, y0, z0 + 0.1, CAB + 0.8, 1.05, z0 + 0.5, 0x6a6a64, M.satin);
  c.boite(0.35, 0.25, 0.3, 0x2a2c2e, { x: CAB + 0.3, y: 1.18, z: z0 + 0.3 }, M.lisse);
  c.tube([CAB - 0.2, y0, il.zc + 0.1], [CAB - 0.2, 0.75, il.zc + 0.1], 0.03, 0x4a4a48, M.metal, 4);
  c.boite(0.36, 0.06, 0.36, 0x2a2a28, { x: CAB - 0.2, y: 0.78, z: il.zc + 0.1 }, M.satin);
  // porte côté est, entrouverte
  c.boite(0.04, 2.0, 0.9, COUL.cabine, { x: x1 + 0.35, y: y0 + 1.0, z: il.zc + 0.2, ry: 0.7 }, M.satin);
  // pièces de monnaie par terre, tickets
  if (bruit(k, 4, 45) < 0.6) debris(c, CAB - 1, il.zc - 0.4, CAB + 1, il.zc + 0.4, 6, [0xb59048, 0x9a9a92], y0);
  obstacleBoite(b, CAB, il.zc, 3.6, 1.25, 0, "cabine de péage");
}

/** La guérite des pillards : la cabine de l'îlot 1, blindée de tôles, entourée de sacs, un brasero devant. */
function guerite(ctx) {
  const { c, M, b } = ctx;
  const il = ilot(1);
  const x0 = CAB - 1.8;
  const x1 = CAB + 1.8;
  const z0 = il.zc - 0.6;
  const z1 = il.zc + 0.6;
  const y0 = 0.16;
  c.pave(x0, y0, z0, x1, y0 + 0.85, z1, COUL.cabine, M.satin);
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) c.pave(x - 0.05, y0 + 0.85, z - 0.05, x + 0.05, 2.45, z + 0.05, COUL.cadre, M.metal);
  // tôles rivetées sur les vitres, une meurtrière côté voie 1
  const tole = (pose, l, h, k) => c.boite(l, h, 0.04, COUL_TOLE[k % COUL_TOLE.length], pose, M.tole, { nuance: 0.06 });
  tole({ x: CAB - 0.9, y: 1.7, z: z0 - 0.04, rz: 0.03 }, 1.8, 1.5, 0);
  tole({ x: CAB + 0.9, y: 1.85, z: z0 - 0.04, rz: -0.04 }, 1.8, 1.2, 1);
  tole({ x: CAB, y: 1.6, z: z1 + 0.04 }, 3.6, 1.4, 2);
  tole({ x: x0 - 0.04, y: 1.7, z: il.zc, ry: Math.PI / 2 }, 1.2, 1.5, 3);
  carreau(ctx, c, { x: CAB + 0.9, y: 2.3, z: z0 - 0.02 }, 1.6, 0.25);
  c.pave(x0 - 0.3, 2.45, z0 - 0.4, x1 + 0.3, 2.66, z1 + 0.3, COUL.cabineBleu, M.satin);
  // le toit chargé : sacs, pneus, un drapeau de chiffons
  for (let i = 0; i < 6; i++) c.boite(0.5, 0.2, 0.34, COUL.sac, { x: x0 + 0.4 + i * 0.55, y: 2.78, z: z0 - 0.15, ry: (c.hasard() - 0.5) * 0.3 }, M.toile, { nuance: 0.08 });
  c.tube([x1 - 0.2, 2.66, il.zc], [x1 - 0.2, 5.0, il.zc], 0.04, 0x5a4a3a, M.mat, 5);
  c.boite(1.0, 0.6, 0.02, 0x8a3a2e, { x: x1 + 0.3, y: 4.6, z: il.zc, ry: 0.2, rz: -0.08 }, M.toile, { crasse: false });
  // sacs de sable devant la face nord (le guichet des pillards), une planche-comptoir
  sacs(ctx, x0 - 0.6, z0 - 0.6, CAB - 0.4, z0 - 0.6, 4, false);
  c.boite(1.1, 0.06, 0.45, PALETTE.boisGris, { x: CAB + 0.5, y: 1.1, z: z0 - 0.3 }, M.mat);
  panneau(c, M.enseignes, R.stop, { x: CAB - 1.1, y: 1.1, z: z0 - 0.82 }, 1.6, 0.4);
  panneau(c, M.enseignes, R.graffiti, { x: CAB, y: 1.55, z: z1 + 0.07 }, 2.4, 0.9);
  // le brasero, une chaise, des bouteilles
  brasero(ctx, CAB - 2.6, z0 - 0.9);
  c.boite(0.45, 0.06, 0.45, 0x5a6a5a, { x: CAB + 2.3, y: 0.45, z: z0 - 0.7 }, M.satin);
  c.boite(0.45, 0.45, 0.06, 0x5a6a5a, { x: CAB + 2.3, y: 0.7, z: z0 - 0.45 }, M.satin);
  for (let i = 0; i < 3; i++) c.tube([CAB + 2.9 + i * 0.12, 0, z0 - 0.4], [CAB + 2.9 + i * 0.12, 0.3, z0 - 0.4], 0.04, 0x3a5a3a, M.lisse, 5);
  obstacleBoite(b, CAB, il.zc, 3.6, 1.3, 0, "guérite des pillards");
  ctx.b.lumiere(CAB - 2.6, 1.2, z0 - 0.9, 0xff8a3a, 6, 11, "brasero de la guérite");
}

function borneVisage(ctx, x, z) {
  const { c, M } = ctx;
  c.boite(0.6, 1.9, 0.5, 0xe6e2d8, { x, y: 0.16 + 0.95, z }, M.satin);
  c.boite(0.64, 0.12, 0.54, 0x3a3a3c, { x, y: 2.15, z }, M.satin);
  panneau(c, M.neon, R.visage, { x, y: 1.45, z: z + 0.26 }, 0.5, 0.5);
  c.tube([x, 2.2, z], [x, 2.7, z], 0.05, 0x3a3a3c, M.metal, 5);
  c.boite(0.26, 0.2, 0.3, 0x2a2a2c, { x, y: 2.75, z: z + 0.05 }, M.satin);
  c.boite(0.1, 0.1, 0.02, 0x9fe0ff, { x, y: 2.75, z: z + 0.21 }, M.lueur, { crasse: false });
  ctx.b.lumiere(x, 1.5, z + 0.8, 0x7fd4ff, 1.4, 5, "borne « facturé à votre visage », sur batterie");
}

/** L'auvent ondulé, en couche (il s'efface quand on passe dessous), et ses enseignes. */
function auvent(ctx) {
  if (!ctx.ici(CAB)) return;
  const { b, M, u, c } = ctx;
  const { x0, x1, z0, z1 } = AUVENT;
  const k = b.couche("auvent", { x: (x0 + x1) / 2, z: (z0 + z1) / 2, l: x1 - x0 + 0.6, p: z1 - z0 + 0.6 }, 5.4, 8.6);
  const pos = [];
  const quad = (A, B, C, D) => pos.push(...A, ...B, ...C, ...A, ...C, ...D);
  const ep = 0.4;
  const pz = 0.5;
  const nz = Math.round((z1 - z0) / pz);
  const nx = 4;
  const trou = (i, j) => bruit(i, Math.floor(j / 3), 51) < u * 0.09;
  for (let j = 0; j < nz; j++) {
    const za = z0 + j * pz;
    const zb = za + pz;
    const ya = yAuvent(za);
    const yb = yAuvent(zb);
    for (let i = 0; i < nx; i++) {
      const xa = x0 + (i * (x1 - x0)) / nx;
      const xb = x0 + ((i + 1) * (x1 - x0)) / nx;
      if (trou(i, j)) {
        // le béton est tombé : il reste les fers, et les morceaux sont sur la chaussée
        if (j % 3 === 0) {
          for (let t = 0; t < 3; t++) barre(k, [xa, ya + 0.2, za + t * 0.5], [xb, ya + 0.15 - t * 0.1, za + t * 0.5 + 0.2], 0.03, 0.03, PALETTE.rouilleSombre, M.tole);
          gravats(c, (xa + xb) / 2, za + 0.7, 1.4, 9, [COUL.auvent, COUL.beton, COUL.betonSombre], 0.03);
        }
        continue;
      }
      quad([xa, ya + ep, za], [xa, yb + ep, zb], [xb, yb + ep, zb], [xb, ya + ep, za]);
      quad([xa, ya, za], [xb, ya, za], [xb, yb, zb], [xa, yb, zb]);
    }
    // les rives, plus hautes (bandeau)
    for (const [x, s] of [[x0, -1], [x1, 1]]) {
      const A = [x, ya - 0.5, za];
      const B = [x, ya + ep + 0.15, za];
      const C = [x, yb + ep + 0.15, zb];
      const D = [x, yb - 0.5, zb];
      if (s > 0) quad(A, B, C, D);
      else quad(A, D, C, B);
      const xi = x - s * 0.25;
      const Ai = [xi, ya - 0.5, za];
      const Di = [xi, yb - 0.5, zb];
      // dessous du bandeau
      if (s > 0) quad(Ai, A, D, Di);
      else quad(Ai, Di, D, A);
    }
  }
  // les deux bouts
  for (const [z, s] of [[z0, -1], [z1, 1]]) {
    const y = yAuvent(z);
    const A = [x0, y - 0.5, z];
    const B = [x1, y - 0.5, z];
    const C = [x1, y + ep + 0.15, z];
    const D = [x0, y + ep + 0.15, z];
    if (s > 0) quad(A, B, C, D);
    else quad(A, D, C, B);
  }
  poserTriangles(k, pos, M.beton, COUL.auvent);
  // Enseignes : « PÉAGE » des deux côtés, pictogrammes des voies sous la rive est, « Bonne route » à l'ouest
  const yMax = 6.85 + ep + 0.15;
  for (const [x, ry, r] of [[x1 + 0.12, Math.PI / 2, R.peage], [x0 - 0.12, -Math.PI / 2, R.peage]]) {
    k.boite(0.12, 1.5, 9.4, 0x2a3a4a, { x: x - Math.sign(ry) * 0.06, y: yMax + 0.6, z: 1 }, M.tole);
    panneau(k, M.enseignes, r, { x: x + Math.sign(ry) * 0.01, y: yMax + 0.6, z: 1, ry }, 9.2, 1.44);
  }
  k.boite(0.1, 0.8, 13, 0x2a3a4a, { x: x0 - 0.1, y: yMax + 0.6, z: 14 }, M.tole);
  panneau(k, M.enseignes, R.bonneRoute, { x: x0 - 0.16, y: yMax + 0.6, z: 14, ry: -Math.PI / 2 }, 12.8, 0.78);
  const pictos = { 1: R.stop, 2: R.pPremium, 3: R.pPremium, 4: R.pCB, 5: R.pCroix, 6: R.pCB, 9: R.pCroix, 10: R.pCB, 11: R.pPremium, 12: R.pCroix };
  for (let n = 1; n <= 12; n++) {
    const v = voie(n);
    const y = yAuvent(v.zc) - 0.65;
    if (n === 7 || n === 8) continue;
    const r = pictos[n];
    const l = n === 1 ? 2.6 : 1.1;
    const h = n === 1 ? 0.65 : 1.1;
    if (n > 1 && bruit(n, 5, 53) < u * 0.25) continue; // tombé
    k.tube([x1 + 0.1, y + h / 2, v.zc], [x1 + 0.1, y + h / 2 + 0.6, v.zc], 0.02, 0x3a3a38, M.tole, 4);
    panneau(k, M.enseignes, r, { x: x1 + 0.12, y, z: v.zc, ry: Math.PI / 2 }, l, h);
  }
  // « Paiement par sourire » au-dessus des voies 7 et 8
  {
    const z = ilot(7).zc;
    const y = yAuvent(z) - 0.75;
    panneau(k, M.enseignes, R.sourire, { x: x1 + 0.12, y, z, ry: Math.PI / 2 }, 4.2, 1.05);
    panneau(k, M.enseignes, R.sourire, { x: x0 - 0.12, y, z, ry: -Math.PI / 2 }, 4.2, 1.05);
  }
  // Lampes mortes sous l'auvent (des globes, de vieux néons)
  for (let n = 2; n <= 12; n += 2) k.boite(1.2, 0.08, 0.2, 0xd8d6cc, { x: CAB, y: yAuvent(voie(n).zc) - 0.05, z: voie(n).zc }, M.satin, { crasse: false });
}

/** La barricade : onze voies bouchées sur la ligne des cabines. */
function barricade(ctx) {
  if (!ctx.ici(CAB)) return;
  const { c, M, b } = ctx;
  const bloc = {
    2: () => conteneur(ctx, -22.6, voie(2).zc, 0, 0x8a4a3a),
    3: () => voiture(ctx, -21.5, voie(3).zc, 0.08, { portiere: true }),
    4: () => {
      sacs(ctx, CAB + 0.2, voie(4).z0 + 0.1, CAB + 0.2, voie(4).z1 - 0.1, 5);
      pneus(ctx, CAB - 1, voie(4).zc, 4);
    },
    5: () => voiture(ctx, -21.8, voie(5).zc, -0.1, { retournee: true }),
    6: () => conteneur(ctx, -22.6, voie(6).zc, 0, 0x3f6a7a),
    7: () => {
      for (let i = 0; i < 4; i++) pneus(ctx, CAB - 0.4, voie(7).z0 + 0.4 + i * 0.6, 3 + (i % 2));
      sacs(ctx, CAB + 0.7, voie(7).z0 + 0.1, CAB + 0.7, voie(7).z1 - 0.1, 3);
    },
    8: () => voiture(ctx, -21.6, voie(8).zc, -0.06, { coffre: true }),
    9: () => conteneur(ctx, -22.6, voie(9).zc, 0, 0x5f7a52),
    10: () => {
      jersey(ctx, CAB, voie(10).zc - 0.5, Math.PI / 2, COUL.jerseyRouge);
      jersey(ctx, CAB + 0.8, voie(10).zc + 0.4, Math.PI / 2, COUL.jerseyBlanc);
      jersey(ctx, CAB - 0.8, voie(10).zc + 0.4, Math.PI / 2, COUL.jerseyRouge);
    },
    11: () => voiture(ctx, -21.4, voie(11).zc, 0.05, {}),
    12: () => {
      conteneur(ctx, -22.6, voie(12).zc, 0, 0x8c6a3a);
      conteneur(ctx, -22.3, voie(12).zc - 0.1, 0.04, 0x4e6a8a, 2.59, false);
    },
  };
  for (let n = 2; n <= 12; n++) {
    bloc[n]();
    const v = voie(n);
    b.obstacle(CAB, v.z0, CAB, v.z1, "barricade");
  }
  // Barbelés tendus au-dessus des épaves
  for (let n = 2; n <= 12; n++) {
    const v = voie(n);
    for (const y of [1.6, 1.9]) barre(c, [CAB - 0.5, y, v.z0], [CAB - 0.5, y + 0.05, v.z1], 0.015, 0.015, 0x5a5a56, M.metal);
  }
}

/** La chicane de la voie 1 : séparateurs et sacs de sable en quinconce avant la guérite. */
function chicane(ctx) {
  if (!ctx.ici(-28)) return;
  const v = voie(1);
  // mur A (depuis le nord), mur B (depuis l'îlot), mur C (depuis le nord)
  jersey(ctx, -31.4, v.z0 + 1.1, Math.PI / 2, COUL.jerseyRouge);
  sacs(ctx, -31.4, v.z0 + 2.1, -31.4, v.z0 + 2.9, 4);
  jersey(ctx, -27.6, v.z1 - 1.1, Math.PI / 2, COUL.jerseyBlanc);
  sacs(ctx, -27.6, v.z1 - 2.1, -27.6, v.z1 - 2.9, 4);
  jersey(ctx, -24.2, v.z0 + 1.1, Math.PI / 2, COUL.jerseyRouge);
  sacs(ctx, -24.2, v.z0 + 2.1, -24.2, v.z0 + 2.7, 3);
  // un îlot prolongé de sacs pour fermer le flanc sud de la chicane (on ne coupe pas par l'îlot 1)
  sacs(ctx, -34, ilot(1).z0 + 0.3, -26, ilot(1).z0 + 0.3, 2);
  for (const x of [-35, -33.5]) cone(ctx, x, v.zc - 0.8);
  cone(ctx, -29.5, v.zc + 1.2);
}

function douane(ctx) {
  const { x, z } = DOUANE;
  if (!ctx.ici(x)) return;
  const { c, M, b } = ctx;
  // La table sur tréteaux
  c.boite(2.4, 0.06, 0.8, PALETTE.boisGris, { x, y: 0.82, z }, M.mat);
  for (const dx of [-0.9, 0.9]) {
    barre(c, [x + dx, 0, z - 0.35], [x + dx, 0.8, z], 0.06, 0.06, PALETTE.bois, M.mat);
    barre(c, [x + dx, 0, z + 0.35], [x + dx, 0.8, z], 0.06, 0.06, PALETTE.bois, M.mat);
  }
  // La balance (une vieille balance de commerce), la caisse, des conserves, un cahier
  c.boite(0.4, 0.12, 0.3, 0xc9c4b6, { x: x - 0.7, y: 0.91, z }, M.satin);
  c.tube([x - 0.7, 0.97, z], [x - 0.7, 1.25, z], 0.03, 0x8a8a84, M.metal, 5);
  c.tube([x - 0.7, 1.25, z], [x - 0.7, 1.28, z], 0.18, 0xb8b4aa, M.metal, 8);
  c.boite(0.2, 0.2, 0.06, 0xe8e4d6, { x: x - 0.7, y: 1.1, z: z + 0.12 }, M.lisse);
  c.boite(0.45, 0.2, 0.32, 0x5a6a5a, { x: x + 0.2, y: 0.95, z: z - 0.1 }, M.metal);
  conserves(ctx, x + 0.6, z - 0.2, 7, 0.85);
  c.boite(0.3, 0.02, 0.22, 0x8a3a2e, { x: x - 0.15, y: 0.86, z: z + 0.2, ry: 0.3 }, M.mat);
  // Le panneau des tarifs, sur deux poteaux, face à la voie
  for (const dx of [-1.15, 1.15]) c.boite(0.1, 2.4, 0.1, PALETTE.boisSombre, { x: x + dx, y: 1.2, z: z - 0.75 }, M.mat);
  c.boite(2.2, 1.65, 0.05, PALETTE.bois, { x, y: 1.7, z: z - 0.78 }, M.mat);
  panneau(c, M.enseignes, R.tarifs, { x, y: 1.7, z: z - 0.75 }, 2.2, 1.65);
  // Un tabouret, des bûches payées, un vélo confisqué
  c.tube([x + 0.3, 0, z - 0.4], [x + 0.3, 0.5, z - 0.4], 0.17, PALETTE.boisGris, M.mat, 6);
  for (let i = 0; i < 5; i++) c.tube([x + 1.5, 0.1 + (i % 2) * 0.18, z - 0.4 + i * 0.12], [x + 2.1, 0.1 + (i % 2) * 0.18, z - 0.4 + i * 0.12], 0.08, PALETTE.bois, M.mat, 5);
  c.repere({ x: x - 2.3, y: 0, z: z - 0.4, ry: 0.2, rz: 0.08 }, () => {
    for (const dx of [-0.5, 0.5]) c.tube([dx, 0.33, -0.03], [dx, 0.33, 0.03], 0.33, 0x2a2a28, M.mat, 8);
    barre(c, [-0.5, 0.33, 0], [0.1, 0.8, 0], 0.04, 0.04, 0x3f6a7a, M.metal);
    barre(c, [0.5, 0.33, 0], [0.1, 0.8, 0], 0.04, 0.04, 0x3f6a7a, M.metal);
    barre(c, [0.1, 0.8, 0], [0.45, 0.95, 0], 0.04, 0.04, 0x3f6a7a, M.metal);
  });
  lanterne(ctx, x - 1.05, 0.85, z + 0.1);
  obstacleBoite(b, x, z - 0.2, 2.5, 1.1, 0, "table de la douane");
}

function palissades(ctx) {
  const x = PALISSADE;
  if (!ctx.ici(x)) return;
  const { c, M, b } = ctx;
  const panneauxTole = (za, zb) => {
    for (let z = za; z < zb - 0.01; z += 1.1) {
      const k = Math.floor(bruitXZ(x, z, 61) * COUL_TOLE.length);
      const h = 2.2 + bruitXZ(x, z, 62) * 0.5;
      c.boite(0.05, h, 1.15, COUL_TOLE[k], { x: x + (bruitXZ(x, z, 63) - 0.5) * 0.1, y: h / 2, z: z + 0.55, rx: (bruitXZ(x, z, 64) - 0.5) * 0.05 }, M.tole, { nuance: 0.05 });
    }
    for (let z = za; z <= zb; z += 2.2) c.boite(0.12, 2.6, 0.12, PALETTE.boisSombre, { x: x + 0.1, y: 1.3, z }, M.mat);
    c.boite(0.08, 0.1, zb - za, PALETTE.boisSombre, { x: x + 0.1, y: 1.9, z: (za + zb) / 2 }, M.mat);
    b.obstacle(x, za, x, zb, "palissade des pillards");
  };
  panneauxTole(-30.6, -23.2);
  panneauxTole(25.7, 30.6);
  // Trophées absurdes cloués côté camp (est) : panneaux routiers, enseignes volées
  panneau(c, M.enseignes, R.filmes, { x: x + 0.12, y: 1.9, z: -28.7, ry: Math.PI / 2, rz: 0.06 }, 1.5, 0.56);
  panneau(c, M.enseignes, R.limite, { x: x + 0.12, y: 1.6, z: -26.6, ry: Math.PI / 2 }, 0.8, 0.8);
  panneau(c, M.enseignes, R.watty, { x: x + 0.12, y: 1.3, z: 28.2, ry: Math.PI / 2, rz: -0.04 }, 0.9, 1.35);
  panneau(c, M.enseignes, R.graffiti, { x: x - 0.06, y: 1.3, z: -27, ry: -Math.PI / 2 }, 3, 1.1);
  for (const z of [-24.6, -24.0]) cone(ctx, x + 0.6, z);
}

function tourDeGuet(ctx) {
  const { x, z } = TOUR;
  if (!ctx.ici(x)) return;
  const { c, M, b } = ctx;
  const k = b.couche("tour-de-guet", { x, z, l: 3.2, p: 3.2 }, 3.4, 8.2);
  const L = 1.1;
  const coul = 0x8f8a7e;
  for (const [dx, dz] of [[-L, -L], [L, -L], [L, L], [-L, L]]) {
    c.tube([x + dx, 0, z + dz], [x + dx, 3.6, z + dz], 0.045, coul, M.metal, 5);
    k.tube([x + dx, 3.6, z + dz], [x + dx, 7.4, z + dz], 0.045, coul, M.metal, 5);
    c.boite(0.25, 0.08, 0.25, PALETTE.boisGris, { x: x + dx, y: 0.04, z: z + dz }, M.mat);
  }
  for (const y of [1.2, 2.4, 3.6, 4.8, 6.0]) {
    const ch = y < 3.6 ? c : k;
    for (const [a, d] of [[[-L, -L], [L, -L]], [[L, -L], [L, L]], [[L, L], [-L, L]], [[-L, L], [-L, -L]]]) barre(ch, [x + a[0], y, z + a[1]], [x + d[0], y, z + d[1]], 0.04, 0.04, coul, M.metal);
  }
  for (const [y1, y2] of [[0, 1.2], [1.2, 2.4], [2.4, 3.6]]) barre(c, [x - L, y1, z + L], [x + L, y2, z + L], 0.04, 0.04, coul, M.metal);
  for (const [y1, y2] of [[3.6, 4.8], [4.8, 6.0]]) barre(k, [x - L, y1, z + L], [x + L, y2, z + L], 0.04, 0.04, coul, M.metal);
  // L'échelle
  for (let y = 0.3; y < 6; y += 0.3) (y < 3.6 ? c : k).boite(0.04, 0.04, 0.5, coul, { x: x + L + 0.05, y, z: z - 0.4 }, M.metal);
  // La plate-forme, les bâches, le toit en tôle
  k.boite(2.6, 0.08, 2.6, PALETTE.boisGris, { x, y: 6.04, z }, M.mat);
  k.boite(2.6, 1.1, 0.03, COUL_BACHE[0], { x, y: 6.6, z: z - L - 0.1, rx: 0.04 }, M.toile, { crasse: false, nuance: 0.06 });
  k.boite(0.03, 1.1, 2.6, COUL_BACHE[1], { x: x - L - 0.1, y: 6.6, z, rz: -0.05 }, M.toile, { crasse: false, nuance: 0.06 });
  k.boite(2.6, 0.8, 0.03, COUL_BACHE[3], { x, y: 6.45, z: z + L + 0.1 }, M.toile, { crasse: false, nuance: 0.06 });
  k.boite(3.0, 0.06, 3.0, COUL_TOLE[1], { x, y: 7.5, z, rz: 0.1 }, M.tole);
  // Le projecteur de chantier, tourné vers la route (sur batterie)
  k.boite(0.5, 0.4, 0.3, 0x2a2a28, { x: x - 0.4, y: 6.9, z: z + L + 0.25, rx: 0.5 }, M.tole);
  k.boite(0.4, 0.3, 0.04, 0xeef4ff, { x: x - 0.4, y: 6.92, z: z + L + 0.42, rx: 0.5 }, M.lueur, { crasse: false, nuance: 0 });
  k.boite(0.5, 0.35, 0.35, 0x3a4a3a, { x: x + 0.6, y: 6.25, z: z + 0.6 }, M.satin);
  // Au pied : le totem de cônes (trophées), une pile de panneaux, des bidons
  for (let i = 0; i < 5; i++) {
    c.poser(GEO.cone, M.satin, COUL.orange, { x: x + 2.2, y: 0.33 + i * 0.32, z: z + 0.4, rz: (i % 2 ? 0.08 : -0.06) }, { nuance: 0.08 });
    c.poser(GEO.bande, M.satin, 0xe8e4d8, { x: x + 2.2, y: 0.4 + i * 0.32, z: z + 0.4 }, { crasse: false });
  }
  panneau(c, M.enseignes, R.limite, { x: x + 2.2, y: 2.2, z: z + 0.42 }, 0.6, 0.6);
  c.tube([x - 2, 0, z + 0.8], [x - 2, 0.9, z + 0.8], 0.3, 0x3f6a7a, M.tole, 8);
  c.tube([x - 2.5, 0, z + 1.4], [x - 2.5, 0.9, z + 1.4], 0.3, 0x8a4a3a, M.tole, 8);
  obstacleBoite(b, x, z, 2.4, 2.4, 0, "tour de guet");
  ctx.b.lumiere(x - 3, 6.2, z + 8, 0xe4eeff, 16, 34, "projecteur de chantier de la tour de guet (vers la route)");
}

function cage(ctx) {
  const { x, z } = CAGE;
  if (!ctx.ici(x)) return;
  const { c, M, b } = ctx;
  const L = 1.1;
  const coul = 0x6a6a64;
  c.boite(2.4, 0.08, 2.4, 0x5a5a56, { x, y: 0.04, z }, M.tole);
  for (const [dx, dz] of [[-L, -L], [L, -L], [L, L], [-L, L]]) c.boite(0.08, 2.1, 0.08, coul, { x: x + dx, y: 1.05, z: z + dz }, M.metal);
  for (let i = 1; i < 10; i++) {
    const t = -L + (i * 2 * L) / 10;
    c.boite(0.03, 2.0, 0.03, coul, { x: x + t, y: 1.05, z: z - L }, M.metal);
    c.boite(0.03, 2.0, 0.03, coul, { x: x - L, y: 1.05, z: z + t }, M.metal);
    c.boite(0.03, 2.0, 0.03, coul, { x: x + L, y: 1.05, z: z + t }, M.metal);
    if (i < 4) c.boite(0.03, 2.0, 0.03, coul, { x: x + t, y: 1.05, z: z + L }, M.metal);
  }
  // la porte, entrouverte, et le toit en grille
  c.repere({ x: x - 0.25, y: 0, z: z + L, ry: -0.4 }, () => {
    for (let i = 0; i < 6; i++) c.boite(0.03, 2.0, 0.03, coul, { x: i * 0.24, y: 1.05 }, M.metal);
    for (const y of [0.1, 1.0, 2.0]) c.boite(1.3, 0.04, 0.04, coul, { x: 0.6, y }, M.metal);
  });
  for (let i = 0; i < 6; i++) c.boite(2.3, 0.03, 0.03, coul, { x, y: 2.1, z: z - L + i * 0.44 }, M.metal);
  // dedans : de la paille, une gamelle, une chaîne
  jonchee(c, x - 0.9, z - 0.9, x + 0.9, z + 0.9, 16, [0xc9b06a, 0xb8a058, 0xa89048], 0.1);
  c.tube([x + 0.5, 0.08, z - 0.5], [x + 0.5, 0.14, z - 0.5], 0.14, 0x8a8a84, M.metal, 6);
  barre(c, [x - L, 0.6, z - 0.3], [x - 0.2, 0.1, z + 0.2], 0.04, 0.04, 0x4a4a46, M.metal);
  panneau(c, M.enseignes, R.filmes, { x, y: 2.35, z: z + L + 0.03 }, 1.0, 0.38);
  obstacleBoite(b, x, z, 2.3, 2.3, 0, "cage");
}

/** Le bivouac des voyageurs qui attendent leur tour, côté ouest de la palissade, et le grand panneau Premium. */
function bivouac(ctx) {
  const { c, M, b } = ctx;
  const x = -43;
  const z = -27;
  if (ctx.ici(x)) {
    brasero(ctx, x, z);
    for (const [dx, dz] of [[-1, 0.8], [1.1, 0.6]]) caisse(ctx, x + dx, z + dz, 0.6, 0.4, 0.4, 0, 0.3);
    // un auvent de bâche sur deux perches
    c.tube([x - 2.5, 0, z - 1.6], [x - 2.5, 2.0, z - 1.6], 0.04, PALETTE.boisGris, M.mat, 5);
    c.tube([x + 0.5, 0, z - 1.6], [x + 0.5, 2.0, z - 1.6], 0.04, PALETTE.boisGris, M.mat, 5);
    c.boite(3.4, 0.03, 2.2, COUL_BACHE[2], { x: x - 1, y: 1.65, z: z - 2.3, rx: 0.45 }, M.toile, { crasse: false, nuance: 0.05 });
    c.boite(1.8, 0.1, 0.8, 0x6a5a48, { x: x - 1.5, y: 0.05, z: z - 2.4 }, M.toile, { crasse: false });
    // une charrette à bras chargée
    c.repere({ x: x + 3.4, y: 0, z: z - 0.6, ry: 0.5, rx: 0.05 }, () => {
      c.boite(1.6, 0.08, 1.0, PALETTE.boisGris, { y: 0.6 }, M.mat);
      for (const s of [-1, 1]) c.boite(1.6, 0.3, 0.05, PALETTE.boisGris, { y: 0.78, z: s * 0.5 }, M.mat);
      for (const s of [-1, 1]) c.tube([0, 0.4, s * 0.58], [0, 0.4, s * 0.66], 0.4, PALETTE.boisSombre, M.mat, 8);
      for (const s of [-1, 1]) barre(c, [0.8, 0.62, s * 0.4], [1.9, 0.45, s * 0.4], 0.05, 0.05, PALETTE.bois, M.mat);
      c.boite(0.8, 0.4, 0.6, 0xa5966e, { x: -0.2, y: 0.85 }, M.toile, { nuance: 0.08 });
    });
    obstacleBoite(b, x + 3.4, z - 0.6, 1.8, 1.2, 0.5, "charrette");
    ctx.b.lumiere(x, 1.2, z, 0xff9a4a, 4, 9, "brasero des voyageurs qui attendent");
    // la « file d'attente » : des cônes en rang, posés par les pillards
    for (let i = 0; i < 6; i++) cone(ctx, -40 + i * 2.6, -23.8);
  }
  // Le grand panneau « Télépéage Premium »
  const xp = -33;
  if (ctx.ici(xp)) {
    const zp = -28.6;
    for (const dx of [-3, 3]) {
      c.boite(0.25, 4.6, 0.25, COUL.poteau, { x: xp + dx, y: 2.3, z: zp }, M.tole);
      b.obstacle(xp + dx - 0.2, zp, xp + dx + 0.2, zp, "poteau");
    }
    c.boite(8.4, 2.7, 0.15, 0x3a3a3c, { x: xp, y: 4.0, z: zp - 0.08 }, M.tole);
    panneau(c, M.enseignes, R.premium, { x: xp, y: 4.0, z: zp + 0.01 }, 8.2, 2.05);
    c.boite(8.4, 0.08, 0.6, COUL.poteau, { x: xp, y: 2.6, z: zp + 0.3 }, M.metal);
  }
}

function localTechnique(ctx) {
  const { x0, x1, z0, z1, h } = LT;
  const xm = (x0 + x1) / 2;
  if (!ctx.ici(xm)) return;
  const { c, M, b, u } = ctx;
  const haut = b.couche("toit-local-technique", { x: xm, z: (z0 + z1) / 2, l: x1 - x0 + 0.6, p: z1 - z0 + 0.6 }, 1.1, h + 0.5);
  const spec = { h, ep: 0.25, couleur: COUL.beton, mat: M.beton };
  murCoupe(ctx, haut, [x0, z0], [x1, z0], { ...spec, ouvertures: [{ u: 3, l: 1.2, bas: 0, haut: 2.2, type: "vide" }, { u: 8.5, l: 1.4, bas: 1.1, haut: 2.3, type: "fenetre", bris: 0.8, cadre: 0x5c666b }] }, h, false);
  murCoupe(ctx, haut, [x0, z1], [x1, z1], spec, 1.1);
  murCoupe(ctx, haut, [x0, z0], [x0, z1], spec, h);
  murCoupe(ctx, haut, [x1, z0], [x1, z1], { ...spec, ouvertures: [{ u: 2.2, l: 1.1, bas: 0, haut: 2.2, type: "vide" }] }, 1.1);
  c.pave(x0, 0, z0, x1, 0.04, z1, 0x9a968c, M.lisse, { crasse: false });
  haut.pave(x0 - 0.2, h, z0 - 0.2, x1 + 0.2, h + 0.25, z1 + 0.2, COUL.betonSombre, M.beton);
  haut.pave(x0 - 0.2, h + 0.25, z0 - 0.2, x1 + 0.2, h + 0.45, z0, COUL.beton, M.beton);
  // Les porte vers la gare (une tôle arrachée), le pictogramme « danger électrique »
  c.boite(1.1, 2.1, 0.05, 0x5c666b, { x: x0 + 3.6, y: 1.05, z: z0 - 0.5, ry: 0.9 }, M.tole);
  // Armoires électriques, rack de batteries d'onduleur, tourets de câble
  for (let i = 0; i < 4; i++) c.boite(0.8, 2.0, 0.5, 0xa8aca6, { x: x0 + 5 + i * 0.85, y: 1.0, z: z1 - 0.45 }, M.satin);
  c.boite(0.8, 2.0, 0.05, 0xa8aca6, { x: x0 + 5.4, y: 1.0, z: z1 - 0.95, ry: 0.8 }, M.satin);
  for (let r = 0; r < 3; r++) {
    c.boite(2.2, 0.05, 0.6, 0x5a5a56, { x: x0 + 1.6, y: 0.3 + r * 0.6, z: z1 - 0.5 }, M.metal);
    for (let i = 0; i < 6; i++) c.boite(0.3, 0.26, 0.45, 0x2a2c2e, { x: x0 + 0.7 + i * 0.36, y: 0.46 + r * 0.6, z: z1 - 0.5 }, M.satin);
  }
  for (const [dx, dz] of [[9.3, 1.6], [10.4, 2.4]]) c.tube([x0 + dx, 0.6, z0 + dz - 0.3], [x0 + dx, 0.6, z0 + dz + 0.3], 0.6, PALETTE.bois, M.mat, 8);
  barre(c, [x0 + 9.3, 0.05, z0 + 2.2], [x0 + 6.5, 0.05, z0 + 2.9], 0.06, 0.06, 0x2a2a28, M.mat);
  barre(c, [x0 + 7.2, 1.9, z1 - 0.3], [x0 + 6.4, 0.05, z0 + 1.4], 0.05, 0.05, 0x2a2a28, M.mat);
  debris(c, x0 + 0.5, z0 + 0.5, x1 - 0.5, z1 - 0.5, 14);
  if (u > 0.5) gravats(c, x1 - 1.3, z0 + 1.3, 0.9, 6);
}

/** Les mâts d'éclairage de la gare, morts. */
function mats(ctx) {
  const { c, M, b } = ctx;
  for (const [x, z] of [[-44, -24.2], [-44, 26.6], [-2, -24.4], [5, 27]]) {
    if (!ctx.ici(x)) continue;
    c.tube([x, 0, z], [x, 13, z], 0.16, COUL.poteau, M.tole, 6);
    c.boite(0.6, 0.4, 0.6, COUL.beton, { x, y: 0.2, z }, M.beton);
    for (const s of [-1, 1]) {
      barre(c, [x, 12.6, z], [x + s * 1.4, 13.1, z], 0.08, 0.08, COUL.poteau, M.tole);
      c.boite(0.7, 0.18, 0.35, 0x5a5e60, { x: x + s * 1.6, y: 13.05, z }, M.tole);
    }
    b.obstacle(x - 0.3, z, x + 0.3, z, "mât");
  }
}

// ---------- Tronçon 3 : le camp des pillards ----------

/**
 * Un mur coupé à hauteur d'allège : le bas (jusqu'à `coupe`) reste toujours visible, le haut va dans la couche `haut`.
 * Si `coupe` vaut la hauteur du mur, il est entier et toujours visible.
 */
function murCoupe(ctx, haut, a, b2, spec, coupe) {
  const ouv = spec.ouvertures ?? [];
  if (coupe >= spec.h) {
    mur(ctx.c, a, b2, { ...spec, batiment: ctx.b });
    return;
  }
  mur(ctx.c, a, b2, { ...spec, h: coupe, ouvertures: ouv.map((o) => ({ ...o, type: "vide", bas: Math.min(o.bas, coupe) })), breches: [], batiment: ctx.b });
  mur(haut, a, b2, { ...spec, h: spec.h - coupe, y0: coupe, ouvertures: ouv.map((o) => ({ ...o, bas: Math.max(0, o.bas - coupe), haut: o.haut - coupe })), batiment: null });
}

function exploitation(ctx) {
  const { x0, x1, z0, z1, zm, h } = BAT;
  const xm = (x0 + x1) / 2;
  if (!ctx.ici(xm)) return;
  const { c, M, b, u } = ctx;
  const haut = b.couche("toit-exploitation", { x: xm, z: (z0 + z1) / 2, l: x1 - x0 + 0.8, p: z1 - z0 + 0.8 }, 1.1, h + 1.2);
  const ext = { h, ep: 0.3, couleur: COUL.facade, mat: M.beton };
  const cloison = { h, ep: 0.15, couleur: COUL.enduitInt, mat: M.mat };
  const fen = (uu, l = 1.6) => ({ u: uu, l, bas: 1.1, haut: 2.5, type: "fenetre", bris: 0.3 + u * 0.6, cadre: 0x5c666b, croisillons: 1 });
  const porte = (uu, l = 1.0) => ({ u: uu, l, bas: 0, haut: 2.2, type: "vide" });
  // Façades : sud et est coupées à hauteur d'allège, nord et ouest entières
  murCoupe(ctx, haut, [x0, z1], [x1, z1], { ...ext, ouvertures: [fen(3), fen(9), porte(16, 1.8), fen(23)] }, 1.1);
  murCoupe(ctx, haut, [x1, z0], [x1, z1], { ...ext, ouvertures: [fen(4.5, 1.4), porte(13.5, 1.1)] }, 1.1);
  murCoupe(ctx, haut, [x0, z0], [x1, z0], { ...ext, ouvertures: [{ u: 13, l: 1.2, bas: 1.8, haut: 2.6, type: "fenetre", bris: 0.7 }, { u: 19, l: 1.2, bas: 1.8, haut: 2.6, type: "fenetre", bris: 0.7 }, { u: 25, l: 1.2, bas: 1.8, haut: 2.6, type: "fenetre", bris: 0.7 }] }, h);
  murCoupe(ctx, haut, [x0, z0], [x0, z1], { ...ext, ouvertures: [{ u: 4.5, l: 1.2, bas: 1.8, haut: 2.6, type: "fenetre", bris: 0.7 }] }, h);
  // Cloisons (coupées à 1,2 m)
  murCoupe(ctx, haut, [x0, zm], [x1, zm], { ...cloison, ouvertures: [porte(5), porte(16), porte(24)] }, 1.2);
  murCoupe(ctx, haut, [30, zm], [30, z1], { ...cloison, ouvertures: [porte(4)] }, 1.2);
  murCoupe(ctx, haut, [34, zm], [34, z1], { ...cloison, ouvertures: [porte(4)] }, 1.2);
  murCoupe(ctx, haut, [26, z0], [26, zm], { ...cloison, ouvertures: [porte(6)] }, 1.2);
  // Sols des pièces (une matière, des teintes)
  c.pave(x0, 0, zm, 30, 0.04, z1, 0x8f9688, M.lisse, { crasse: false });
  c.pave(30, 0, zm, 34, 0.04, z1, 0xa89a80, M.lisse, { crasse: false });
  c.pave(34, 0, zm, x1, 0.04, z1, 0xb3a58a, M.lisse, { crasse: false });
  c.pave(x0, 0, z0, 26, 0.04, zm, 0x86928c, M.lisse, { crasse: false });
  c.pave(26, 0, z0, x1, 0.04, zm, 0x8a7a62, M.mat, { crasse: false });
  // Dalles du faux plafond tombées partout
  for (let i = 0; i < 14; i++) c.boite(0.6, 0.02, 0.6, 0xd8d4c8, { x: c.entre(x0 + 1, x1 - 1), y: 0.05 + c.hasard() * 0.04, z: c.entre(z0 + 1, z1 - 1), ry: c.hasard() * 3, rx: (c.hasard() - 0.5) * 0.1 }, M.mat, { crasse: false });
  // Le toit-terrasse, l'acrotère, la bande bleue, l'enseigne, les climatiseurs et l'antenne
  haut.pave(x0 - 0.15, h, z0 - 0.15, x1 + 0.15, h + 0.3, z1 + 0.15, COUL.betonSombre, M.beton);
  for (const [a1, a2, a3, a4] of [[x0 - 0.15, z0 - 0.15, x1 + 0.15, z0 + 0.1], [x0 - 0.15, z1 - 0.1, x1 + 0.15, z1 + 0.15], [x0 - 0.15, z0, x0 + 0.1, z1], [x1 - 0.1, z0, x1 + 0.15, z1]]) haut.pave(a1, h + 0.3, a2, a3, h + 0.8, a4, COUL.facade, M.beton);
  haut.pave(x0 - 0.17, h - 0.5, z1 + 0.15, x1 + 0.17, h - 0.15, z1 + 0.19, COUL.bleuSociete, M.satin);
  haut.pave(x1 + 0.15, h - 0.5, z0 - 0.17, x1 + 0.19, h - 0.15, z1 + 0.17, COUL.bleuSociete, M.satin);
  panneau(haut, M.enseignes, R.exploitation, { x: 24.5, y: h + 0.15, z: z1 + 0.22 }, 9, 1.12);
  for (const [cx, cz] of [[20, -26], [23, -26], [38, -18]]) {
    haut.boite(1.4, 0.9, 1.0, 0xc9c6bc, { x: cx, y: h + 0.75, z: cz }, M.tole);
    haut.tube([cx, h + 1.21, cz], [cx, h + 1.25, cz], 0.38, 0x3a3a38, M.tole, 8);
  }
  haut.tube([41, h + 0.3, -28], [41, h + 5.5, -28], 0.06, 0x8a8a84, M.metal, 5);
  for (const y of [h + 3, h + 4.5]) haut.boite(0.5, 0.25, 0.25, 0xd8d6cc, { x: 41.3, y, z: -27.8, ry: 0.6, rx: 0.3 }, M.satin);
  haut.poser(GEO.dome, M.satin, 0xd8d6cc, { x: 37, y: h + 1.1, z: -28.2, rx: -1.0, e: [0.6, 0.25, 0.6] });
  if (u > 0.4) haut.boite(2.6, 0.05, 1.8, 0x5a6a5a, { x: 33, y: h + 0.4, z: -24, ry: 0.2 }, M.toile, { crasse: false });
  // Fenêtres condamnées par des tôles (les pillards se barricadent)
  for (const xx of [x0 + 9, x0 + 23]) haut.boite(1.7, 1.5, 0.04, COUL_TOLE[Math.floor(xx) % 5], { x: xx, y: 1.85, z: z1 + 0.2, rz: 0.03 }, M.tole);
  // Le seuil : une porte à double battant, l'un arraché
  c.boite(0.9, 2.1, 0.05, 0x5c666b, { x: x0 + 15.4, y: 1.05, z: z1 + 0.7, ry: -1.0 }, M.tole);

  // --- Salle de contrôle (x 16 → 30, sud) : le mur d'écrans morts, le pupitre en arc
  c.boite(0.25, 2.6, 7.4, 0x2a2c2e, { x: x0 + 0.3, y: 1.6, z: (zm + z1) / 2 }, M.satin);
  panneau(c, M.enseignes, R.ecrans, { x: x0 + 0.44, y: 1.7, z: (zm + z1) / 2 - 1.8, ry: Math.PI / 2 }, 3.5, 2.2);
  panneau(c, M.enseignes, R.ecrans, { x: x0 + 0.44, y: 1.7, z: (zm + z1) / 2 + 1.8, ry: Math.PI / 2, rz: 0.01 }, 3.5, 2.2);
  for (let i = 0; i < 5; i++) {
    const ang = -0.6 + i * 0.3;
    const px = x0 + 5.4 - Math.cos(ang) * 2.6;
    const pz = (zm + z1) / 2 + Math.sin(ang) * 3.0;
    c.boite(0.8, 0.78, 1.25, 0x8a8e8a, { x: px, y: 0.4, z: pz, ry: -ang }, M.satin);
    c.boite(0.9, 0.05, 1.3, 0x4a4e50, { x: px - 0.05, y: 0.8, z: pz, ry: -ang }, M.satin);
    c.boite(0.08, 0.45, 0.6, 0x1e2022, { x: px - 0.25, y: 1.05, z: pz, ry: -ang, rz: -0.15 }, M.lisse);
    if (i % 2) {
      c.tube([px + 0.9, 0, pz], [px + 0.9, 0.45, pz], 0.04, 0x3a3a38, M.metal, 4);
      c.boite(0.5, 0.08, 0.5, 0x2a3a5a, { x: px + 0.9, y: 0.48, z: pz }, M.satin);
    }
  }
  panneau(c, M.enseignes, R.jours, { x: 29.8, y: 0.72, z: -15, ry: -Math.PI / 2 }, 0.9, 0.67);
  c.boite(1.4, 0.04, 0.9, 0xe8e4d6, { x: 27, y: 0.03, z: -19, ry: 0.4 }, M.mat, { crasse: false });
  jonchee(c, 20, -21, 29, -14, 20, [0xe8e4d6, 0xd8d2c0, 0xc9c0a8, 0x9a9a92]);
  // armoires de classement, chaises renversées, l'imprimante
  for (let i = 0; i < 3; i++) c.boite(0.5, 1.1, 0.6, 0x9aa09a, { x: 29.5, y: 0.55, z: -20.6 + i * 0.55 }, M.tole, { nuance: 0.04 });
  c.boite(0.5, 0.05, 0.6, 0x9aa09a, { x: 28.9, y: 0.05, z: -18.8, ry: 0.4 }, M.tole);
  for (const [cx, cz, r] of [[24.5, -15.2, 1.3], [26.2, -19.4, 0.4]]) {
    c.boite(0.5, 0.08, 0.5, 0x2a3a5a, { x: cx, y: 0.25, z: cz, rz: r }, M.satin);
    c.boite(0.5, 0.5, 0.08, 0x2a3a5a, { x: cx + 0.2, y: 0.35, z: cz - 0.2, rz: r }, M.satin);
  }
  c.boite(1.6, 0.75, 0.7, 0xb8b4a8, { x: 25, y: 0.37, z: -14.3 }, M.satin);
  c.boite(0.5, 0.25, 0.4, 0xd8d6cc, { x: 25.3, y: 0.87, z: -14.3 }, M.satin);

  // --- Hall (x 30 → 34) : le comptoir d'accueil, les trophées
  c.boite(2.6, 1.05, 0.6, 0x3d6688, { x: 32, y: 0.52, z: -19.8 }, M.satin);
  c.boite(2.7, 0.06, 0.7, 0xd8d2c0, { x: 32, y: 1.07, z: -19.8 }, M.satin);
  panneau(c, M.enseignes, R.watty, { x: x0 + 0.17, y: 1.6, z: -23.2, ry: Math.PI / 2 }, 0.8, 1.2);
  for (let i = 0; i < 3; i++) cone(ctx, 33.3, -15 - i * 0.5);

  // --- Cuisine des pillards (x 34 → 44, sud)
  c.pave(34.2, 0, zm + 0.2, 42, 0.9, zm + 0.85, 0xd8d2c0, M.satin);
  c.pave(34.2, 0.9, zm + 0.15, 42, 0.95, zm + 0.9, 0x8a8a84, M.metal);
  c.boite(0.6, 0.12, 0.45, 0x6a6a64, { x: 36, y: 0.92, z: zm + 0.5 }, M.metal);
  c.boite(0.9, 0.85, 0.6, 0x3a3a38, { x: 40.5, y: 0.43, z: -20.8 }, M.metal);
  c.tube([40.5, 0.86, -20.8], [40.5, 1.1, -20.8], 0.18, 0x5a5a56, M.metal, 7);
  c.boite(0.16, 0.06, 0.16, 0xff8a40, { x: 40.5, y: 0.88, z: -20.4 }, M.lueur, { crasse: false });
  c.tube([42.6, 0, -20.7], [42.6, 0.6, -20.7], 0.15, 0x3f7a8a, M.metal, 8); // bouteille de gaz
  // la table, les conserves de la douane
  c.boite(1.8, 0.05, 0.9, PALETTE.boisGris, { x: 38.5, y: 0.78, z: -16.5 }, M.mat);
  for (const [dx, dz] of [[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]]) c.boite(0.05, 0.76, 0.05, PALETTE.boisSombre, { x: 38.5 + dx, y: 0.38, z: -16.5 + dz }, M.mat);
  conserves(ctx, 37.8, -16.8, 6, 0.8);
  // l'étagère des conserves (le butin de la douane, rangé)
  c.boite(0.45, 1.1, 2.4, 0x6a6a64, { x: 43.5, y: 0.55, z: -19.6 }, M.tole);
  for (const y of [0.3, 0.75]) conserves(ctx, 43.3, -20.6, 8, y);
  for (const y of [0.3, 0.75]) conserves(ctx, 43.3, -19.4, 6, y);
  conserves(ctx, 42.2, -14.4, 16, 0);
  caisse(ctx, 43.2, -15.2, 0.7, 0.5, 0.5);
  caisse(ctx, 43.1, -15.3, 0.6, 0.4, 0.45, 0.5, 0.3);

  // --- Vestiaires (x 16 → 26, nord) : casiers, bancs, uniformes fluo
  for (let i = 0; i < 9; i++) {
    const ouvert = bruit(i, 7, 71) < 0.45;
    c.boite(0.6, 1.9, 0.5, 0x7a8a8e, { x: x0 + 1.2 + i * 0.65, y: 0.95, z: z0 + 0.45 }, M.tole, { nuance: 0.04 });
    if (ouvert) c.boite(0.55, 1.8, 0.03, 0x7a8a8e, { x: x0 + 1.2 + i * 0.65 + 0.35, y: 0.95, z: z0 + 0.95, ry: -1.1 }, M.tole);
  }
  for (const z of [-27, -24.5]) {
    c.boite(4.5, 0.06, 0.4, PALETTE.bois, { x: 21, y: 0.45, z }, M.mat);
    for (const dx of [-2, 2]) c.boite(0.06, 0.42, 0.35, 0x5a5a56, { x: 21 + dx, y: 0.22, z }, M.metal);
  }
  for (let i = 0; i < 4; i++) c.boite(0.55, 0.75, 0.04, i % 2 ? 0xd9a43a : 0xd9762e, { x: x0 + 0.4, y: 1.4, z: -28.5 + i * 0.7, ry: Math.PI / 2 + (i - 1.5) * 0.15 }, M.toile, { crasse: false });
  c.boite(0.6, 0.05, 0.4, 0xd9762e, { x: 23, y: 0.05, z: -23, ry: 0.7 }, M.toile, { crasse: false });

  // --- Dortoir (x 26 → 44, nord) : matelas au sol, couvertures, la lanterne
  const matelas = [[28.2, -28.9, 0], [30.6, -28.9, 0.05], [33, -28.9, -0.04], [35.6, -28.6, 0.2], [39, -29, 0], [41.6, -28.8, -0.1], [42.6, -25.2, 1.57], [29.5, -24.2, 0.1]];
  matelas.forEach(([mx, mz, ry], i) => {
    c.boite(1.3, 0.02, 2.3, [0x7a3a32, 0x5a4a6a, 0x6a5a3a][i % 3], { x: mx, y: 0.05, z: mz, ry: ry + 0.1 }, M.toile, { crasse: false, nuance: 0.08 });
    c.boite(0.9, 0.18, 1.95, 0xd8ccaa, { x: mx, y: 0.1, z: mz, ry }, M.toile, { nuance: 0.06 });
    c.boite(0.85, 0.07, 1.2, COUL_BACHE[i % 4], { x: mx + 0.02, y: 0.22, z: mz + 0.3, ry: ry + 0.05 }, M.toile, { crasse: false, nuance: 0.08 });
    c.boite(0.5, 0.12, 0.3, 0xe8e2d4, { x: mx, y: 0.24, z: mz - 0.7, ry }, M.toile, { crasse: false });
  });
  caisse(ctx, 36.6, -26.6, 0.6, 0.45, 0.45);
  // le poêle à bois et son tuyau qui sort par une fenêtre haute
  c.tube([32, 0.04, -27.6], [32, 0.8, -27.6], 0.3, 0x2a2a28, M.tole, 8);
  c.tube([32, 0.8, -27.6], [32, 2.2, -27.6], 0.07, 0x3a3a38, M.tole, 6);
  barre(c, [32, 2.2, -27.6], [32, 2.2, -30.6], 0.12, 0.12, 0x3a3a38, M.tole);
  for (let i = 0; i < 6; i++) c.tube([30.4, 0.08 + (i % 3) * 0.16, -28.4 + Math.floor(i / 3) * 0.2], [31.0, 0.08 + (i % 3) * 0.16, -28.4 + Math.floor(i / 3) * 0.2], 0.07, PALETTE.bois, M.mat, 5);
  // les sacs du butin
  for (let i = 0; i < 5; i++) c.boite(0.6, 0.45, 0.45, COUL.sac, { x: 43 - (i % 2) * 0.5, y: 0.23 + Math.floor(i / 2) * 0.35, z: -22.5 - (i % 3) * 0.55, ry: i * 0.4 }, M.toile, { nuance: 0.1 });
  lanterne(ctx, 36.6, 0.45, -26.6);
  c.boite(1.4, 0.05, 0.8, PALETTE.boisGris, { x: 33.5, y: 0.5, z: -25.4 }, M.mat);
  for (const [dx, dz] of [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]]) c.boite(0.05, 0.48, 0.05, PALETTE.boisSombre, { x: 33.5 + dx, y: 0.24, z: -25.4 + dz }, M.mat);
  for (let i = 0; i < 6; i++) c.boite(0.06, 0.01, 0.09, 0xe8e4d6, { x: 33.1 + i * 0.15, y: 0.53, z: -25.4 + (i % 2) * 0.1, ry: i }, M.mat, { crasse: false });
  panneau(c, M.enseignes, R.graffiti, { x: 35, y: 1.9, z: z0 + 0.17 }, 3.0, 1.12);
  jonchee(c, 27, -30, 43.5, -22, 18, [0x9c7a45, 0x7d6143, 0xe8e4d6, 0x6a6a64]);
  // Les lumières des pillards
  ctx.b.lumiere(36.6, 0.95, -26.6, 0xffc46a, 4, 9, "lanterne du dortoir");
  ctx.b.lumiere(40.5, 1.2, -20.4, 0xff9050, 2, 6, "réchaud de la cuisine");
  if (u > 0.6) gravats(c, 17.2, -29.3, 0.9, 7, [COUL.facade, COUL.betonSombre]);
}

/** Devant le centre d'exploitation : le parvis du camp (charrettes, fûts, un salon de sièges d'auto). */
function parvisCamp(ctx) {
  const { c, M, b } = ctx;
  if (ctx.ici(10)) {
    // Un salon de banquettes arrachées aux voitures, autour d'un fût
    for (const [x, z, ry] of [[8.5, -27, 0.3], [11.6, -27.6, -0.4], [10, -24.6, 3.1]]) {
      c.boite(1.3, 0.4, 0.55, 0x4a4a52, { x, y: 0.2, z, ry }, M.satin);
      c.boite(1.3, 0.55, 0.15, 0x4a4a52, { x: x - Math.sin(ry) * 0.25, y: 0.6, z: z - Math.cos(ry) * 0.25, ry, rx: -0.15 }, M.satin);
    }
    c.tube([10, 0, -26.4], [10, 0.85, -26.4], 0.3, 0x3f6a7a, M.tole, 8);
    for (let i = 0; i < 4; i++) c.tube([4 + i * 0.7, 0, -30], [4 + i * 0.7, 0.9, -30], 0.3, i % 2 ? 0x8a4a3a : 0x5f6e5c, M.tole, 8);
    // Un fil à linge, des cônes trophées
    c.tube([2, 0, -29.6], [2, 2, -29.6], 0.04, PALETTE.boisGris, M.mat, 5);
    c.tube([14.5, 0, -29.6], [14.5, 2, -29.6], 0.04, PALETTE.boisGris, M.mat, 5);
    barre(c, [2, 1.95, -29.6], [14.5, 1.85, -29.6], 0.015, 0.015, 0x8a8a84, M.metal);
    for (let i = 0; i < 5; i++) c.boite(0.6, 0.8, 0.02, i % 2 ? 0xd9762e : COUL_BACHE[i % 4], { x: 3.5 + i * 2.2, y: 1.45, z: -29.6, rz: (i % 3 - 1) * 0.06 }, M.toile, { crasse: false });
    obstacleBoite(b, 6, -30, 3, 0.7, 0, "fûts");
  }
  if (ctx.ici(28)) {
    // Charrettes des pillards garées devant la porte
    for (const [x, z, ry] of [[26, -10.8, 0.2], [29.5, -10.5, -0.3]]) {
      c.repere({ x, y: 0, z, ry }, () => {
        c.boite(1.8, 0.08, 1.1, PALETTE.boisGris, { y: 0.62 }, M.mat);
        for (const s of [-1, 1]) c.boite(1.8, 0.35, 0.05, PALETTE.boisGris, { y: 0.82, z: s * 0.55 }, M.mat);
        for (const s of [-1, 1]) c.tube([0, 0.42, s * 0.62], [0, 0.42, s * 0.7], 0.42, PALETTE.boisSombre, M.mat, 8);
        for (const s of [-1, 1]) barre(c, [0.9, 0.64, s * 0.42], [2.0, 0.42, s * 0.42], 0.05, 0.05, PALETTE.bois, M.mat);
      });
      obstacleBoite(b, x, z, 2.0, 1.3, ry, "charrette");
    }
    conserves(ctx, 26.2, -10.9, 5, 0.66);
    c.boite(0.8, 0.4, 0.6, COUL.sac, { x: 29.3, y: 0.85, z: -10.5 }, M.toile, { nuance: 0.08 });
  }
}

function garage(ctx) {
  const { x0, x1, z0, z1, h } = GAR;
  const xm = (x0 + x1) / 2;
  if (!ctx.ici(xm)) return;
  const { c, M, b, u } = ctx;
  const haut = b.couche("toit-garage", { x: xm, z: (z0 + z1) / 2, l: x1 - x0 + 0.8, p: z1 - z0 + 0.8 }, 1.1, h + 1.6);
  const bardage = { h, ep: 0.2, couleur: 0x8a9aa0, mat: M.tole };
  // Façade nord (vers la route) : deux baies, l'une ouverte, l'autre à demi fermée
  murCoupe(ctx, haut, [x0, z0], [x1, z0], { ...bardage, ouvertures: [{ u: 5.5, l: 5, bas: 0, haut: 4.2, type: "vide" }, { u: 12.5, l: 5, bas: 0, haut: 4.2, type: "vide" }] }, h);
  murCoupe(ctx, haut, [x0, z0], [x0, z1], bardage, h);
  murCoupe(ctx, haut, [x0, z1], [x1, z1], bardage, 1.1);
  murCoupe(ctx, haut, [x1, z0], [x1, z1], { ...bardage, ouvertures: [{ u: 9, l: 1.0, bas: 0, haut: 2.2, type: "vide" }] }, 1.1);
  // Les rideaux métalliques : enroulé en haut (baie A), descendu à 1 m du sol (baie B)
  c.tube([x0 + 3, 4.4, z0 - 0.25], [x0 + 8, 4.4, z0 - 0.25], 0.3, 0x7a7e7a, M.tole, 8);
  c.tube([x0 + 10, 4.4, z0 - 0.25], [x0 + 15, 4.4, z0 - 0.25], 0.3, 0x7a7e7a, M.tole, 8);
  c.boite(5, 3.1, 0.05, 0x9aa0a0, { x: x0 + 12.5, y: 2.65, z: z0 - 0.15 }, M.tole);
  for (let y = 1.2; y < 4.2; y += 0.25) c.boite(5, 0.03, 0.07, 0x7a7e7a, { x: x0 + 12.5, y, z: z0 - 0.17 }, M.tole);
  b.obstacle(x0 + 10, z0, x0 + 15, z0, "rideau métallique à demi baissé");
  // Toit à un pan (couche)
  haut.repere({ x: xm, y: h + 0.5, z: (z0 + z1) / 2, rx: -0.07 }, () => {
    for (let i = 0; i < 9; i++) {
      const xx = -9 + i * 2 + 1;
      if (bruit(i, 9, 81) < u * 0.25) continue;
      haut.boite(2.02, 0.06, z1 - z0 + 0.8, 0x8f969a, { x: xx }, M.tole, { nuance: 0.04 });
    }
    for (let i = 0; i < 5; i++) haut.boite(0.12, 0.3, z1 - z0, 0x5c666b, { x: -8 + i * 4, y: -0.2 }, M.tole);
  });
  haut.pave(x0, h, z0 - 0.1, x1, h + 1.0, z0 + 0.1, 0x8a9aa0, M.tole);
  panneau(haut, M.enseignes, R.intervention, { x: xm, y: h + 0.5, z: z0 - 0.13, ry: Math.PI }, 6, 1.1);
  panneau(haut, M.enseignes, R.intervention, { x: x1 + 0.13, y: 3.4, z: (z0 + z1) / 2, ry: Math.PI / 2 }, 5, 0.94);
  c.pave(x0, 0, z0, x1, 0.04, z1, 0x8f8c84, M.beton, { crasse: false });
  // La dépanneuse (baie A), plateau incliné, le nez dehors
  c.repere({ x: x0 + 5.5, y: 0, z: 23.5, ry: Math.PI / 2 }, () => {
    c.boite(2.0, 1.4, 2.3, 0xd9a43a, { x: 2.6, y: 1.35 }, M.satin);
    c.boite(0.05, 0.7, 2.0, 0x2a3134, { x: 3.62, y: 1.6, rz: 0.1 }, M.lisse);
    c.boite(2.0, 0.45, 2.3, 0xd9a43a, { x: 2.6, y: 0.75 }, M.satin);
    c.boite(7.2, 0.35, 1.0, 0x3a3a38, { x: -0.6, y: 0.55 }, M.mat);
    c.boite(5.0, 0.12, 2.3, 0x6a6a64, { x: -1.1, y: 1.15, rz: 0.08 }, M.tole);
    c.boite(0.5, 1.2, 2.0, 0x5a5e60, { x: 1.4, y: 1.4 }, M.tole);
    for (const [wx, wz] of [[2.6, -1.0], [2.6, 1.0], [-2.2, -1.0], [-2.2, 1.0], [-3.3, -1.0], [-3.3, 1.0]]) c.tube([wx, 0.48, wz - 0.16], [wx, 0.48, wz + 0.16], 0.48, COUL.pneu, M.mat, 8);
    c.boite(0.2, 0.18, 1.4, 0xd9762e, { x: 2.5, y: 2.12 }, M.lisse);
    panneau(c, M.enseignes, R.intervention, { x: 2.6, y: 1.35, z: 1.16 }, 1.8, 0.34);
  });
  obstacleBoite(b, x0 + 5.5, 24.1, 7.4, 2.4, Math.PI / 2, "dépanneuse");
  // L'atelier : établi, pneus, chaînes, poste à souder, plaques de tôle pour les barricades
  c.boite(0.8, 0.9, 3.6, PALETTE.bois, { x: x0 + 0.6, y: 0.45, z: 25.5 }, M.mat);
  c.boite(0.05, 1.4, 3.6, 0x6a6a64, { x: x0 + 0.15, y: 1.8, z: 25.5 }, M.tole);
  for (let i = 0; i < 6; i++) c.boite(0.04, 0.3, 0.04, 0x3a3a38, { x: x0 + 0.2, y: 1.9, z: 24 + i * 0.5, rx: 0.2 }, M.metal);
  pneus(ctx, x1 - 1.2, 28.8, 5);
  pneus(ctx, x1 - 2.1, 29.2, 3);
  pneus(ctx, x1 - 1.0, 27.6, 2);
  for (let i = 0; i < 4; i++) c.boite(2.4, 0.04, 1.2, COUL_TOLE[i], { x: x0 + 12.5, y: 0.05 + i * 0.05, z: 27, ry: i * 0.1 }, M.tole);
  c.boite(0.6, 0.8, 0.5, 0x3f6a7a, { x: x0 + 9.5, y: 0.4, z: 29.6 }, M.satin);
  for (let i = 0; i < 3; i++) c.boite(0.35, 0.45, 0.2, 0x8a3a2e, { x: x0 + 15.5 + i * 0.4, y: 0.23, z: 29.8 }, M.satin);
  barre(c, [x0 + 8, 0.03, 21], [x0 + 10.5, 0.03, 22.4], 0.08, 0.12, 0x5a5a56, M.metal);
  debris(c, x0 + 1, z0 + 1, x1 - 1, z1 - 1, 12, [0x5a5a56, 0x9a9a92, PALETTE.rouille]);
  c.boite(0.2, 0.15, 0.6, 0xffe0a0, { x: xm - 1, y: 3.8, z: 24 }, M.lueur, { crasse: false });
  ctx.b.lumiere(xm - 1, 3.5, 24, 0xffe0a0, 3, 10, "baladeuse de l'atelier (batterie de dépanneuse)");
}

function voituresPoussees(ctx) {
  const liste = [
    [6, 24, 0.5, { portiere: true }],
    [12.5, 22.8, 0.35, {}],
    [20, 19.4, 0.1, { coffre: true }],
    [-4, 5, 0.6, {}],
    [8, -2, -0.3, {}],
  ];
  for (const [x, z, ry, o] of liste) if (ctx.ici(x)) voiture(ctx, x, z, ry, o);
}

// ---------- Tronçon 4 : le pont ----------

function parkingIntervention(ctx) {
  const { x0, x1, z0, z1 } = PARK;
  const xm = (x0 + x1) / 2;
  if (!ctx.ici(xm)) return;
  const { c, M, b, u } = ctx;
  c.pave(x0, 0, z0, x1, 0.05, z1, COUL.asphalte, M.asphalte, { crasse: false, nuance: 0 });
  // le portail, ouvert, et son panneau
  c.boite(0.15, 1.8, 0.15, COUL.poteau, { x: 52, y: 0.9, z: -9.2 }, M.tole);
  c.boite(0.15, 1.8, 0.15, COUL.poteau, { x: 58, y: 0.9, z: -9.2 }, M.tole);
  c.repere({ x: 52.1, y: 0, z: -9.2, ry: 1.2 }, () => {
    for (let i = 0; i < 8; i++) c.boite(0.04, 1.6, 0.04, COUL.grillage, { x: 0.2 + i * 0.35, y: 0.9 }, M.tole);
    for (const y of [0.15, 1.65]) c.boite(2.9, 0.06, 0.06, COUL.grillage, { x: 1.45, y }, M.tole);
  });
  grillageLigne(ctx, 49, -9.2, 52, -9.2, 1.8);
  grillageLigne(ctx, 58, -9.2, 63, -9.2, 1.8);
  grillageLigne(ctx, 49, -30.6, 49, -9.2, 1.8);
  panneau(c, M.enseignes, R.intervention, { x: 55, y: 2.0, z: -9.15 }, 3.0, 0.56);
  for (const x of [52, 58]) c.tube([x, 1.8, -9.2], [x, 2.3, -9.2], 0.03, COUL.poteau, M.tole, 4);
  barre(c, [52, 2.3, -9.2], [58, 2.3, -9.2], 0.04, 0.04, COUL.poteau, M.tole);
  // Trois fourgons d'intervention orange et blancs, en épi
  const fourgons = [[51.8, -15.8, 1.45, true], [55.2, -16.2, 1.5, false], [58.4, -16.6, 1.62, false]];
  fourgons.forEach(([x, z, ry, flr], i) => {
    c.repere({ x, y: 0, z, ry }, () => {
      c.boite(4.6, 1.9, 1.95, 0xe6e0d2, { x: -0.3, y: 1.35 }, M.satin);
      c.boite(1.0, 1.3, 1.95, 0xe6e0d2, { x: 2.4, y: 1.05 }, M.satin);
      c.boite(0.05, 0.6, 1.8, 0x2a3134, { x: 2.92, y: 1.45, rz: 0.2 }, M.lisse);
      c.boite(6.0, 0.25, 1.95, 0x3a3a38, { x: 0.1, y: 0.42 }, M.mat);
      panneau(c, M.enseignes, R.intervention, { x: -0.3, y: 1.15, z: 0.985 }, 4.4, 0.62);
      panneau(c, M.enseignes, R.intervention, { x: -0.3, y: 1.15, z: -0.985, ry: Math.PI }, 4.4, 0.62);
      c.boite(1.4, 0.16, 0.3, 0x3a3a38, { x: 1.4, y: 2.38 }, M.satin);
      c.boite(0.25, 0.14, 0.25, 0xe0802a, { x: 1.4, y: 2.52 }, M.lisse);
      for (const [wx, wz] of [[1.9, -0.85], [1.9, 0.85], [-1.8, -0.85], [-1.8, 0.85]]) c.tube([wx, 0.36, wz - 0.12], [wx, 0.36, wz + 0.12], 0.36, COUL.pneu, M.mat, 8);
      if (flr) {
        c.boite(0.1, 1.2, 1.7, 0x2a2a28, { x: -2.7, y: 2.9 }, M.tole);
        panneau(c, M.neon, R.flr, { x: -2.76, y: 2.9, ry: -Math.PI / 2 }, 1.6, 0.8);
        c.boite(0.08, 0.6, 0.08, 0x3a3a38, { x: -2.6, y: 2.2 }, M.metal);
      }
    });
    obstacleBoite(b, x, z, 6.1, 2.0, ry, "fourgon d'intervention");
  });
  // le gyrophare qui tourne encore, sur batterie
  c.boite(0.26, 0.16, 0.26, 0xffa020, { x: 51.8 + 0.05, y: 2.56, z: -15.8 - 1.4 }, M.lueur, { crasse: false });
  ctx.b.lumiere(51.85, 2.8, -17.2, 0xff9a20, 3, 9, "gyrophare d'un fourgon d'intervention, sur batterie");
  // L'abri à sel (dôme) et ses sacs
  c.poser(GEO.dome, M.tole, 0x8f969a, { x: 56.5, y: 0, z: -25.2, e: [4.2, 3.2, 3.6] });
  c.pave(54.6, 0, -22, 58.4, 2.4, -21.4, 0x3a3a38, M.mat, { crasse: false });
  for (let i = 0; i < 7; i++) c.boite(0.6, 0.25, 0.4, 0xe8e6de, { x: 54 + i * 0.7, y: 0.13 + (i % 2) * 0.2, z: -20.8, ry: (i % 3) * 0.2 }, M.toile, { nuance: 0.05 });
  mousse(c, 56.5, 0, -20.4, 1.2, 4, 0xe8e6de);
  obstacleBoite(b, 56.5, -25.2, 8, 7, 0, "abri à sel");
  for (let i = 0; i < 4; i++) cone(ctx, 60.6, -12 - i * 0.5, 0);
  for (let i = 0; i < 3; i++) cone(ctx, 60.6 + 0.02, -12 - 0.25, 0.3 + i * 0.3);
  if (u > 0.5) touffes(c, [[50.5, -26], [61, -27], [53, -11.5]]);
}

function pont(ctx) {
  const { c, M, b, u } = ctx;
  const { x0, x1, zN, zS, passerelle } = PONT;
  // Le tablier, découpé par tronçon (il est tout entier dans le tronçon « pont »)
  if (!ctx.ici(75)) return;
  c.pave(x0, -1.3, zN, x1, 0, zS, COUL.beton, M.beton, { crasse: false });
  // corniches
  for (const z of [zN, zS]) c.pave(x0, -0.8, z - 0.25, x1, 0.1, z + 0.25, COUL.betonSombre, M.beton, { crasse: false });
  // poutres sous le tablier et la pile centrale (voile)
  for (const z of [-4, 1, 6, 11]) c.pave(x0 + 1, -2.1, z - 0.4, x1 - 1, -1.3, z + 0.4, COUL.betonSombre, M.beton);
  c.pave(74.4, -6.2, -5.5, 75.6, -2.1, 13.5, COUL.beton, M.beton);
  c.pave(74.2, -2.4, -5.8, 75.8, -2.1, 13.8, COUL.betonSombre, M.beton);
  // culées
  for (const x of [x0, x1]) c.pave(x - 0.6, -3, zN - 0.3, x + 0.6, 0, zS + 0.3, COUL.betonSombre, M.beton);
  // Parapets en béton + garde-corps (le sud cassé là où une voiture est passée au travers)
  const parapet = (z, casse = null) => {
    for (let x = x0; x < x1 - 0.01; x += 3) {
      const xa = x;
      const xb = Math.min(x + 3, x1);
      if (casse && xb > casse[0] && xa < casse[1]) {
        gravats(c, (xa + xb) / 2, z - Math.sign(z) * 0.6, 0.6, 4, [COUL.beton, COUL.betonSombre]);
        continue;
      }
      c.pave(xa, 0, z - 0.2, xb, 0.75, z + 0.2, COUL.beton, M.beton, { nuance: 0.02 });
      c.pave(xa, 1.1, z - 0.04, xb, 1.16, z + 0.04, 0x8a9090, M.metal);
      c.boite(0.06, 0.4, 0.06, 0x8a9090, { x: xa + 0.1, y: 0.95, z }, M.metal);
      b.obstacle(xa, z, xb, z, "parapet du pont");
    }
  };
  parapet(zN + 0.2);
  parapet(zS - 0.2, [77, 80]);
  // La voiture en équilibre au-dessus du canal
  c.repere({ x: 78.5, y: 0.25, z: zS + 0.2, ry: -1.35, rx: 0.32 }, () => {
    c.boite(4.2, 0.6, 1.76, 0x8e4a3e, { y: 0.66 }, M.satin);
    c.boite(2.2, 0.48, 1.58, 0x2a3134, { x: -0.25, y: 1.2 }, M.lisse);
    c.boite(2.0, 0.08, 1.6, 0x8e4a3e, { x: -0.3, y: 1.47 }, M.satin);
    for (const [wx, wz] of [[1.35, -0.8], [1.35, 0.8], [-1.35, -0.8], [-1.35, 0.8]]) c.tube([wx, 0.34, wz - 0.11], [wx, 0.34, wz + 0.11], 0.34, COUL.pneu, M.mat, 8);
  });
  b.obstacle(77, zS - 0.4, 80, zS - 0.4, "vide (parapet arraché)");
  // La passerelle de service : caillebotis, consoles, garde-corps extérieur
  c.pave(x0 - 1, -0.06, passerelle, x1 + 1, 0.02, zN, 0x7a7e7a, M.metal, { crasse: false });
  for (let x = x0; x <= x1; x += 3) {
    barre(c, [x, -1.3, zN], [x, -0.06, passerelle + 0.05], 0.12, 0.12, 0x5c666b, M.tole);
    c.boite(0.06, 1.1, 0.06, 0x7a7e7a, { x, y: 0.55, z: passerelle + 0.05 }, M.metal);
  }
  for (const y of [0.5, 1.05]) c.pave(x0 - 1, y, passerelle + 0.02, x1 + 1, y + 0.05, passerelle + 0.08, 0x7a7e7a, M.metal);
  b.obstacle(x0 - 1, passerelle, x1 + 1, passerelle, "garde-corps de la passerelle");
  // armoire de câbles, une lanterne laissée par des voyageurs
  c.boite(0.6, 1.2, 0.35, 0x8a9a8e, { x: 70, y: 0.62, z: zN - 0.35 }, M.tole);
  lanterne(ctx, 80, 0.02, -7.7);
  ctx.b.lumiere(80, 0.5, -7.7, 0xffcf7a, 2.5, 7, "lanterne laissée sur la passerelle");
  // Portillons aux deux bouts
  for (const x of [x0 - 1, x1 + 1]) {
    c.boite(0.1, 1.4, 0.1, COUL.poteau, { x, y: 0.7, z: passerelle }, M.tole);
    c.boite(0.04, 1.2, 1.2, COUL.grillage, { x: x + (x < 75 ? -0.5 : 0.5), y: 0.7, z: passerelle - 0.4, ry: x < 75 ? 0.9 : -0.9 }, M.tole);
  }
  // Épaves sur le pont (couverts), sacs de sable abandonnés côté est
  voiture(ctx, 68.5, 7.8, 0.12, {});
  voiture(ctx, 73.5, -1.8, -0.2, { portiere: true });
  voiture(ctx, 82, 10.6, 0.5, { coffre: true });
  sacs(ctx, 84.5, -4.5, 84.5, -1.0, 3);
  sacs(ctx, 85.5, 6.5, 85.5, 10.5, 2);
  // Débris flottants dans le canal, roseaux au pied des berges
  for (let i = 0; i < 6; i++) c.boite(c.entre(0.5, 1.4), 0.08, c.entre(0.3, 0.8), [PALETTE.boisGris, 0x5a5a56, 0x8a3a2e][i % 3], { x: c.entre(70, 80), y: RAVIN.eau + 0.02, z: c.entre(-30, 30), ry: c.hasard() * 3 }, M.mat, { crasse: false });
  for (const x of [68.4, 81.6])
    for (let z = -32; z < 33; z += 4) {
      if (z > -9 && z < 16) continue;
      touffes(c, [[x + c.entre(-0.4, 0.4), z, RAVIN.eau + 0.1], [x + c.entre(-0.4, 0.4), z + 1.3, RAVIN.eau + 0.1]], 0x7a8a4a);
    }
}


// ---------- Ce que le dernier jour a laissé sur la route ----------

/** Valises, pneus, traces de freinage, papiers et éclats sur la chaussée (régulier par cases de 7 m). */
function encombrement(ctx) {
  const { c, M, u, X0, X1 } = ctx;
  const tons = [0x2f4a6a, 0x8a3a2e, 0x3a3a38, 0x6a5a78, 0xa08a5a];
  for (let x = Math.ceil(X0 / 7) * 7; x < X1; x += 7)
    for (let z = -21; z < 25; z += 7) {
      const xx = x + bruit(x, z, 92) * 5;
      const zz = z + bruit(x, z, 91) * 5;
      if (!ctx.ici(xx)) continue;
      if (zz < zNord(xx) + 0.8 || zz > zSud(xx) - 0.8) continue;
      if (xx > -35 && xx < -5) continue; // la gare a son propre désordre
      if (Math.abs(zz - AXE) < 0.8 && (xx < -72 || xx > 32)) continue;
      const n = bruit(x, z, 93);
      const ry = bruit(x, z, 94) * 6;
      if (n < 0.13) {
        // une valise tombée, ouverte, des vêtements autour
        const t = tons[Math.floor(bruit(x, z, 95) * tons.length)];
        c.boite(0.72, 0.22, 0.48, t, { x: xx, y: 0.14, z: zz, ry }, M.satin);
        c.boite(0.72, 0.06, 0.48, t, { x: xx + Math.cos(ry) * 0.1, y: 0.42, z: zz - Math.sin(ry) * 0.1, ry, rx: 1.2 }, M.satin);
        jonchee(c, xx - 1, zz - 1, xx + 1, zz + 1, 6, [0xd8d2c0, 0x8a3a2e, 0x4e6a7a, 0xc9b06a], 0.04);
      } else if (n < 0.2) {
        c.tube([xx, 0.03, zz], [xx, 0.27, zz], 0.36, COUL.pneu, M.mat, 8);
      } else if (n < 0.34) {
        jonchee(c, xx - 1.5, zz - 1.2, xx + 1.5, zz + 1.2, 10, [0x9c7a45, 0x7d6143, 0xe8e4d6, 0xb08f55], 0.04);
      } else if (n < 0.42) {
        for (const d of [-0.75, 0.75]) barre(c, [xx - 3, 0.037, zz + d], [xx + 3, 0.037, zz + d + 0.3], 0.008, 0.22, 0x46443f, M.mat, { crasse: false, nuance: 0.02 });
      } else if (n < 0.48) {
        debris(c, xx - 0.8, zz - 0.8, xx + 0.8, zz + 0.8, 8, [0x5a7078, 0x9a9a92, 0x3a4a50], 0.03);
      } else if (n < 0.5 + u * 0.1) {
        gravats(c, xx, zz, 0.7, 5, [0x6a6864, 0x86857f], 0.02);
      }
    }
}

/** Un semi-remorque de livraison, arrêté sur la voie de gauche, la remorque béante. */
function semiRemorque(ctx, x, z, ry) {
  if (!ctx.ici(x)) return;
  const { c, M, b } = ctx;
  c.repere({ x, y: 0, z, ry }, () => {
    // tracteur
    c.boite(2.2, 2.2, 2.4, 0x5a6e86, { x: 5.9, y: 1.7 }, M.satin);
    c.boite(0.06, 0.9, 2.1, 0x2a3134, { x: 7.02, y: 2.2 }, M.lisse);
    c.boite(1.2, 0.5, 2.4, 0x5a6e86, { x: 6.4, y: 3.05 }, M.satin);
    c.boite(3.4, 0.4, 1.1, 0x2a2a28, { x: 5.0, y: 0.7 }, M.mat);
    c.boite(0.15, 0.5, 2.4, 0x6a6a64, { x: 7.05, y: 0.9 }, M.metal);
    // remorque
    c.boite(11.6, 2.8, 2.5, 0xe0dccf, { x: -1.6, y: 2.55 }, M.tole);
    c.boite(11.6, 0.3, 1.2, 0x2a2a28, { x: -1.6, y: 1.0 }, M.mat);
    panneau(c, M.enseignes, R.livraison, { x: -1.6, y: 2.55, z: 1.26 }, 11, 1.38);
    panneau(c, M.enseignes, R.livraison, { x: -1.6, y: 2.55, z: -1.26, ry: Math.PI }, 11, 1.38);
    // portes arrière ouvertes, des cartons vides tombés
    c.boite(0.05, 2.6, 1.2, 0xd8d4c8, { x: -7.7, y: 2.5, z: 1.9, ry: 1.3 }, M.tole);
    c.boite(0.05, 2.6, 1.2, 0xd8d4c8, { x: -7.7, y: 2.5, z: -1.9, ry: -1.3 }, M.tole);
    c.boite(0.04, 2.6, 2.4, 0x2a2826, { x: -7.38, y: 2.55 }, M.mat);
    for (const [wx, s] of [[5.8, 1], [3.6, 1], [-4.6, 1], [-6.0, 1]]) for (const wz of [-1.0, 1.0]) c.tube([wx, 0.5, wz - 0.2 * s], [wx, 0.5, wz + 0.2 * s], 0.5, COUL.pneu, M.mat, 8);
  });
  for (let i = 0; i < 5; i++) caisse(ctx, x - 8.8 - c.hasard() * 2, z + (c.hasard() - 0.5) * 2.5, 0.6, 0.45, 0.5, 0, c.hasard() * 3, 0xb89a6a);
  obstacleBoite(b, x - 0.2, z, 15, 2.6, ry, "semi-remorque");
}

// ---------- Le camp, en plus : tentes, poulailler, potager, butin ----------

function tente(ctx, x, z, ry, coul) {
  const { c, M, b } = ctx;
  c.repere({ x, y: 0, z, ry }, () => {
    for (const s of [-1, 1]) c.boite(2.6, 0.03, 1.55, coul, { y: 0.66, z: s * 0.55, rx: s * 0.78 }, M.toile, { crasse: false, nuance: 0.05 });
    c.tube([-1.3, 0, 0], [-1.3, 1.25, 0], 0.03, PALETTE.boisGris, M.mat, 4);
    c.tube([1.3, 0, 0], [1.3, 1.25, 0], 0.03, PALETTE.boisGris, M.mat, 4);
    c.boite(1.6, 0.12, 1.2, 0x6a5a48, { x: -1.9, y: 0.06 }, M.toile, { crasse: false });
  });
  obstacleBoite(b, x, z, 2.7, 2.2, ry, "tente");
}

function campEnPlus(ctx) {
  const { c, M, b, u } = ctx;
  // Côté gare (x < 0) : vélos confisqués appuyés à la palissade, tente du guetteur
  if (ctx.ici(-16)) {
    for (let i = 0; i < 4; i++) {
      c.repere({ x: -17.6, y: 0, z: -29.6 + i * 0.75, ry: Math.PI / 2, rz: 0.25 }, () => {
        for (const dx of [-0.5, 0.5]) c.tube([dx, 0.33, -0.03], [dx, 0.33, 0.03], 0.33, 0x2a2a28, M.mat, 8);
        barre(c, [-0.5, 0.33, 0], [0.1, 0.8, 0], 0.04, 0.04, [0x3f6a7a, 0x8a3a2e, 0x5d6b4a, 0xd9a43a][i], M.metal);
        barre(c, [0.5, 0.33, 0], [0.1, 0.8, 0], 0.04, 0.04, [0x3f6a7a, 0x8a3a2e, 0x5d6b4a, 0xd9a43a][i], M.metal);
      });
    }
    b.obstacle(-17.3, -30, -17.3, -27, "vélos confisqués");
    tente(ctx, -9.5, -24.8, 0.15, COUL_BACHE[0]);
    // la bannière des Percepteurs tendue entre la palissade et le mât d'éclairage
    panneau(c, M.enseignes, R.banniere, { x: -10, y: 3.3, z: -24.0, rz: 0.03 }, 5.2, 1.3);
    c.tube([-12.8, 0, -24], [-12.8, 4.2, -24], 0.05, PALETTE.boisGris, M.mat, 5);
    c.tube([-7.2, 0, -24], [-7.2, 4.2, -24], 0.05, PALETTE.boisGris, M.mat, 5);
  }
  if (!ctx.ici(8)) return;
  // Tentes et palettes à l'ouest du centre d'exploitation
  tente(ctx, 2.6, -26.8, -0.2, COUL_BACHE[1]);
  tente(ctx, 5.4, -23.6, 0.4, COUL_BACHE[3]);
  for (let i = 0; i < 4; i++) {
    c.repere({ x: 14.6, y: 0, z: -30 + i * 1.25, ry: Math.PI / 2, rz: 0.05 }, () => {
      for (let k = 0; k < 5; k++) c.boite(1.2, 0.1, 0.02, PALETTE.boisGris, { y: 0.1 + k * 0.22, z: 0.02 }, M.mat, { nuance: 0.1 });
      for (const dx of [-0.5, 0, 0.5]) c.boite(0.1, 1.0, 0.08, PALETTE.bois, { x: dx, y: 0.5 }, M.mat);
    });
  }
  // Le poulailler (on y paie en œufs aussi)
  const px = 12.2;
  const pz = -19.6;
  c.pave(px - 1.2, 0, pz - 0.9, px + 1.2, 1.3, pz + 0.9, PALETTE.boisGris, M.mat);
  c.boite(2.8, 0.06, 2.2, COUL_TOLE[2], { x: px, y: 1.45, z: pz, rx: 0.15 }, M.tole);
  panneau(c, M.enseignes, R.oeufs, { x: px, y: 0.95, z: pz + 0.92 }, 1.6, 0.4);
  // l'enclos grillagé, les poules
  for (const [a1, a2] of [[[px - 1.2, pz + 0.9], [px - 1.2, pz + 3.2]], [[px - 1.2, pz + 3.2], [px + 2.4, pz + 3.2]], [[px + 2.4, pz + 3.2], [px + 2.4, pz - 0.9]], [[px + 2.4, pz - 0.9], [px + 1.2, pz - 0.9]]]) {
    const L = Math.hypot(a2[0] - a1[0], a2[1] - a1[1]);
    panneau(c, M.enseignes, R.grillage, { x: (a1[0] + a2[0]) / 2, y: 0.5, z: (a1[1] + a2[1]) / 2, ry: -Math.atan2(a2[1] - a1[1], a2[0] - a1[0]) }, L, 1.0, COUL.grillage);
    b.obstacle(a1[0], a1[1], a2[0], a2[1], "poulailler");
  }
  b.obstacle(px - 1.2, pz - 0.9, px + 1.2, pz - 0.9, "poulailler");
  for (let i = 0; i < 5; i++) {
    const hx = px - 0.6 + c.hasard() * 2.6;
    const hz = pz + 1.2 + c.hasard() * 1.8;
    const ry = c.hasard() * 6;
    const t = i % 3 ? 0xe8e2d4 : 0x9a5a3a;
    c.boite(0.3, 0.22, 0.18, t, { x: hx, y: 0.2, z: hz, ry }, M.mat, { crasse: false });
    c.boite(0.1, 0.12, 0.1, t, { x: hx + Math.cos(ry) * 0.17, y: 0.36, z: hz - Math.sin(ry) * 0.17, ry }, M.mat, { crasse: false });
    c.boite(0.04, 0.05, 0.04, 0xc8362b, { x: hx + Math.cos(ry) * 0.17, y: 0.44, z: hz - Math.sin(ry) * 0.17, ry }, M.mat, { crasse: false });
  }
  jonchee(c, px - 1, pz + 1, px + 2.2, pz + 3, 10, [0xc9b06a, 0xb8a058], 0.02);
  // Le potager en pneus (les pillards aussi doivent manger)
  for (let i = 0; i < 6; i++) {
    const gx = 6.5 + (i % 3) * 1.3;
    const gz = -29.2 + Math.floor(i / 3) * 1.3;
    c.tube([gx, 0, gz], [gx, 0.3, gz], 0.5, COUL.pneu, M.mat, 8);
    c.boite(0.7, 0.04, 0.7, 0x5a4632, { x: gx, y: 0.31, z: gz, ry: 0.78 }, M.mat, { crasse: false });
    if (bruit(i, 3, 97) > u * 0.5) arbuste(c, gx, gz, 0.45, 0.25, [0x6f9a46, 0x5d8a3e, 0x8aa65a]);
  }
}

// ---------- Le canal, en plus ----------

function canalEnPlus(ctx) {
  if (!ctx.ici(75)) return;
  const { c, M, u } = ctx;
  // La péniche coulée, au sud du pont : la proue hors de l'eau
  c.repere({ x: 75.8, y: RAVIN.eau - 0.3, z: 25, ry: 0.06, rx: -0.07, rz: 0.08 }, () => {
    c.boite(3.6, 1.4, 15, 0x3a4a52, { y: 0.4 }, M.tole);
    c.boite(3.7, 0.15, 15.1, 0x8a3a2e, { y: 1.12 }, M.tole);
    c.boite(3.0, 0.1, 9, 0x5a5048, { y: 1.1, z: 1.5 }, M.mat);
    c.boite(2.6, 1.6, 3.0, 0xd8d2c0, { y: 1.9, z: -5.2 }, M.satin);
    c.boite(2.8, 0.12, 3.3, 0x3a4a52, { y: 2.75, z: -5.2 }, M.tole);
    for (const zz of [-5.8, -4.6]) c.boite(0.04, 0.6, 0.8, 0x2a3134, { x: 1.31, y: 2.1, z: zz }, M.lisse);
    c.tube([0, 2.8, -5.8], [0, 3.6, -5.8], 0.12, 0x2a2a28, M.tole, 6);
    for (let i = 0; i < 4; i++) c.tube([1.85, 1.0, -6 + i * 3.5], [1.95, 1.0, -6 + i * 3.5], 0.3, COUL.pneu, M.mat, 8);
  });
  // Enrochements au pied des berges
  for (const x of [67.4, 82.6])
    for (let z = -33; z < 34; z += 5) {
      if (z > -10 && z < 17) continue;
      gravats(c, x + (bruit(Math.round(x), z, 99) - 0.5), z + 1, 1.3, 5, [0x8f8a7e, 0x7e796e, 0xa09a8c], RAVIN.eau - 0.2);
    }
  // Échelle de berge, bouée
  for (let y = -4.2; y < 0; y += 0.35) c.boite(0.5, 0.04, 0.04, 0x6a6a64, { x: 64.6 - (y + 4.2) * 0.2, y, z: 20 }, M.metal);
  c.tube([64.0, -1.5, 22.5], [64.0, -1.4, 22.5], 0.3, 0xd9762e, M.satin, 8);
  // Lampadaires morts du pont
  for (const [x, z] of [[66, PONT.zS - 0.1], [76, PONT.zS - 0.1], [70, PONT.zN + 0.1], [81, PONT.zN + 0.1]]) {
    const s = z > 0 ? -1 : 1;
    c.tube([x, 0.75, z], [x, 8, z], 0.09, COUL.poteau, M.tole, 6);
    barre(c, [x, 8, z], [x, 8.4, z + s * 1.6], 0.07, 0.07, COUL.poteau, M.tole);
    c.boite(0.35, 0.15, 0.7, 0x5a5e60, { x, y: 8.35, z: z + s * 1.9 }, M.tole);
  }
  if (u > 0.5) mousse(c, 69, RAVIN.eau, -20, 2, 6, 0x6f8a4a);
}

// ---------- La fiche ----------

const TRONCONS = [
  { id: "approche", nom: "1 · L'approche", x: -75, description: "l'autoroute s'élargit vers le péage : la file du dernier jour, le fourgon blindé éventré, le bassin de rétention, le portique « Souriez »" },
  { id: "gare", nom: "2 · La gare de péage", x: -25, description: "le grand auvent ondulé, onze voies bouchées, la chicane et la guérite des pillards (goulet n° 1), la douane, la tour de guet, la cage, le local technique" },
  { id: "camp", nom: "3 · Le camp des Percepteurs", x: 25, description: "la sortie du péage : le centre d'exploitation (salle de contrôle, vestiaires, cuisine, dortoir) et le garage des dépanneuses, tenus par les pillards" },
  { id: "pont", nom: "4 · Le pont", x: 75, description: "le pont autoroutier sur le canal et sa passerelle de service (goulet n° 2), le centre d'intervention et son abri à sel" },
];

const FOUILLE = [
  { x: -60.5, z: 22.4, quoi: "fourgon blindé éventré : sacoche de convoyeur (bon sac), casque, gilet pare-lames" },
  { x: -57, z: 24, quoi: "liasses de billets et rouleaux de pièces, inutiles (au mieux, de quoi allumer un feu)" },
  { x: -82, z: -24.5, quoi: "bassin : un vélo rouillé dans la vase (ferraille, chaîne, roues)" },
  { x: -73.5, z: -19.6, quoi: "voiture noyée au bord du bassin : batterie, câbles de démarrage" },
  { x: -66, z: 1.6, quoi: "coffre d'une voiture de la file : couverture, bidon d'eau, trousse de secours entamée" },
  { x: -91, z: -9.4, quoi: "borne d'appel d'urgence : câble, petit haut-parleur, cellule solaire fêlée" },
  { x: -42, z: 29, quoi: "local technique : batteries d'onduleur (lourdes, encore un peu chargées)" },
  { x: -37.5, z: 28.4, quoi: "local technique : tourets de câble, disjoncteurs (cuivre)" },
  { x: -20, z: ilot(4).zc, quoi: "cabine de péage : tiroir-caisse plein de pièces (inutiles), rouleaux de tickets" },
  { x: -20, z: ilot(7).zc, quoi: "cabine de péage : uniforme et gilet du péagiste, thermos, lampe torche" },
  { x: -20, z: ilot(10).zc, quoi: "cabine de péage : terminal de paiement (petite électronique), trousseau de clés" },
  { x: -23.4, z: ilot(6).z1, quoi: "borne « facturé à votre visage » : caméra, carte électronique, petite batterie" },
  { x: DOUANE.x, z: DOUANE.z, quoi: "table de la douane : la caisse des pillards (conserves, bûches, piles) — seulement s'ils sont absents" },
  { x: 17.5, z: -17.5, quoi: "salle de contrôle : écrans morts, cartes électroniques, câbles (Voltaïques)" },
  { x: 20, z: -29.6, quoi: "vestiaires : uniformes fluo, chaussures de sécurité, gants" },
  { x: 42.2, z: -14.4, quoi: "cuisine des pillards : les conserves de la douane, un réchaud, des gamelles" },
  { x: 35.6, z: -28.6, quoi: "dortoir : couvertures, sacs de couchage" },
  { x: 30.8, z: 25.5, quoi: "garage : établi (outils, clés, cric), chaînes et sangles de remorquage" },
  { x: 35.5, z: 23.5, quoi: "dépanneuse : batterie, câble de treuil (acier), ressorts" },
  { x: 46.8, z: 28.8, quoi: "pile de pneus et jerricans vides" },
  { x: 51.8, z: -13.2, quoi: "fourgon d'intervention : cônes, triangle, gilets, lampe à éclats (sur batterie)" },
  { x: 56.5, z: -20.8, quoi: "abri à sel : sacs de sel de déneigement (conserver la viande)" },
  { x: 58.4, z: -14, quoi: "fourgon d'intervention : caisse à outils, pelle, balai, corde" },
  { x: 70, z: -7.6, quoi: "passerelle de service : armoire de câbles (cuivre)" },
  { x: 82, z: 10.6, quoi: "épave sur le pont : coffre (un sac, des vêtements)" },
];
const ETEINTS = [
  { x: -62.5, z: 24.6, type: "ancien habitant : convoyeur de fonds en gilet, assis contre le fourgon" },
  { x: -80, z: -21, type: "putréfié (dans les roseaux du bassin)" },
  { x: -70, z: 4.8, type: "errant (entre les voitures de la file)" },
  { x: -93, z: 23, type: "rampant (sous les buissons du bas-côté)" },
  { x: -39, z: 28.6, type: "ancien habitant : technicien du péage en combinaison (local technique)" },
  { x: -28, z: voie(9).zc, type: "errant (coincé entre deux voies bouchées)" },
  { x: -30, z: 24, type: "rampant (sous une voiture de la file)" },
  { x: CAGE.x, z: CAGE.z, type: "équipé : un Éteint en cage, gardé comme sonnette par les pillards" },
  { x: -9, z: 12, type: "errant (sous l'auvent, côté sortie)" },
  { x: 22.5, z: -17, type: "ancien habitant : opérateur du centre d'exploitation, casque-micro sur la tête" },
  { x: 21, z: -26.4, type: "rampant (sous les bancs des vestiaires)" },
  { x: 44.5, z: 27, type: "errant (au fond du garage)" },
  { x: 59.5, z: -19, type: "ancien habitant : agent d'intervention en combinaison orange" },
  { x: 74.5, z: 5.5, type: "errant (sur le pont, entre les épaves)" },
  { x: 94, z: 22, type: "rampant (au pied du talus, côté sortie)" },
];
const ENTREES = [
  { x: -100, z: 4, nature: "entrée A : l'autoroute, depuis la ville et le Comptoir des Compteurs" },
  { x: -80.5, z: -14.5, nature: "portillon du bassin de rétention (grillage ouvert)" },
  { x: -60, z: 17.8, nature: "brèche de la glissière (le fourgon est passé au travers)" },
  { x: -44, z: 30.6, nature: "le local technique, par la gare (porte arrachée)" },
  { x: CAB, z: voie(1).zc, nature: "la voie ouverte, devant la guérite des pillards (on paie ici)" },
  { x: 32, z: -13.5, nature: "porte du centre d'exploitation (un battant arraché)" },
  { x: 44, z: -17, nature: "porte de service de la cuisine" },
  { x: 35.5, z: 18.5, nature: "baie ouverte du garage des dépanneuses" },
  { x: 55, z: -9.2, nature: "portail ouvert du centre d'intervention" },
  { x: 62, z: -7.6, nature: "passerelle de service du pont (portillon ouvert)" },
  { x: 100, z: 4, nature: "sortie B : l'autoroute vers la Zone industrielle" },
];
const PILLARDS = [
  { x: CAB - 0.4, z: -19.6, role: "le douanier, dans la guérite" },
  { x: DOUANE.x, z: DOUANE.z - 1.0, role: "le percepteur, derrière la table de la douane" },
  { x: -29.5, z: -22, role: "un garde dans la chicane" },
  { x: TOUR.x, z: TOUR.z, role: "le guetteur, en haut de la tour (projecteur)" },
  { x: 30, z: -11.5, role: "le chef, devant le centre d'exploitation" },
  { x: 38, z: -25, role: "au repos, dans le dortoir" },
  { x: 36, z: 21, role: "le mécanicien, au garage" },
];
const LUMIERES_NOTE = "Au plus 4 lumières par tronçon : brasero et projecteur à la gare, lanterne et réchaud au camp, gyrophare et lanterne au pont.";

const CARTES = TRONCONS.map((t) => {
  const dans = (p) => p.x >= t.x - 25 && (p.x < t.x + 25 || (t.x === 75 && p.x <= 100));
  const local = (liste) => liste.filter(dans).map((p) => ({ ...p, x: arr(p.x - t.x), z: arr(p.z) }));
  const departs = { approche: { x: -97, z: 4 }, gare: { x: -48, z: -10 }, camp: { x: 2, z: -12 }, pont: { x: 52, z: 4 } };
  const d = departs[t.id];
  return {
    id: t.id,
    nom: t.nom,
    lot: { l: 50, p: 70 },
    decalage: { x: t.x, z: 0 },
    depart: { x: arr(d.x - t.x), z: d.z },
    description: t.description,
    solPropre: true,
    entrees: local(ENTREES),
    fouille: local(FOUILLE),
    eteints: local(ETEINTS),
    pillards: local(PILLARDS),
  };
});

export const FICHE = {
  id: "halte-peage",
  nom: "Halte · Le péage",
  lieu: "Halte · route de la Zone industrielle · entre le proche et le moyen",
  environnement: "zone industrielle (autoroute)",
  anneau: "moyen",
  danger: 3,
  halte: true,
  solPropre: true,
  recit:
    "Pendant quarante ans, la barrière a fait payer le passage à des gens qui ne savaient même plus qu'ils payaient : le télépéage débitait leur compte, puis leur visage. Les Percepteurs n'ont rien inventé, ils ont seulement remplacé l'abonnement par une conserve. Une seule voie est ouverte ; on y passe en souriant, mais le sourire, ici, est refusé.",
  inspiration: "les grandes barrières de péage d'autoroute françaises et leurs auvents en voiles de béton ; les postes-frontières improvisés des films post-apocalyptiques ; la satire des services « sans contact »",
  reperes: [
    "L'éventail : l'autoroute à 2 × 2 voies s'ouvre en douze voies sous le grand auvent de béton ondulé, puis se referme vers le pont",
    "Onze voies bouchées (conteneurs, épaves, voiture retournée, sacs de sable, jerseys, barbelés) : il ne reste que la voie 1, en chicane",
    "La guérite des Percepteurs : une cabine blindée de tôles, sacs de sable, drapeau de chiffons, brasero ; la barrière baissée",
    "La table de la douane : balance, caisse, conserves, et les tarifs peints (« 1 conserve / personne · 3 Wh / vélo · Charbonniers : 2 bûches · Sourire : REFUSÉ »)",
    "La tour de guet en échafaudage bâché, son projecteur de chantier, le totem de cônes ; la cage et son Éteint",
    "L'Abondance : « Télépéage Premium — passez sans vous arrêter, payez sans y penser », les voies « Paiement par sourire », la borne « Votre trajet a été facturé à votre visage », le portique « SOURIEZ : VOUS ÊTES FACTURÉ »",
    "Le fourgon blindé éventré et ses billets qui volent au vent : cent crédits, inutiles",
    "Le centre d'exploitation devenu camp : mur d'écrans morts, « Jours sans bouchon : 0 », vestiaires fluo, cuisine des conserves, dortoir à la lanterne",
    "Le garage des dépanneuses, le centre d'intervention et son abri à sel, le pont sur le canal avec sa passerelle de service et sa voiture en équilibre",
  ],
  lot: { l: 200, p: 70 },
  depart: { x: -96, z: 4 },
  cartes: CARTES,
  goulets: [
    { x: CAB, z: voie(1).zc, nature: "la voie ouverte du péage : chicane de séparateurs, guérite des pillards, barrière ; on paie ou on force" },
    { x: 75, z: 4, nature: "le pont autoroutier sur le canal et sa passerelle de service (deux chemins parallèles, séparés par le parapet)" },
  ],
  panneaux: [
    { x: -96, z: 17.6, texte: "Zone industrielle · Entrepôts · 3 km → (Péage à 100 m)" },
    { x: 95, z: -10.5, texte: "← Comptoir des Compteurs · Ville · 4 km (← Ton terrain)" },
  ],
  pillards: PILLARDS,
  notes: LUMIERES_NOTE,
};

// ---------- Construction ----------

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

export function creer({ usure = 0.7, carte = "approche" } = {}) {
  const def = CARTES.find((k) => k.id === carte) ?? CARTES[0];
  const X0 = def.decalage.x - 25;
  const X1 = def.decalage.x + 25;
  const b = new Batiment(4100 + CARTES.indexOf(def) * 31, usure);
  const ctx = { b, c: b.c, u: usure, M: matieres(), X0, X1, ici: (x) => x >= X0 && (x < X1 || (X1 >= 100 && x <= X1)) };

  sol(ctx);
  chaussee(ctx);
  marquages(ctx);
  bords(ctx);
  vegetation(ctx);
  panneauxExtremites(ctx);
  // 1 · L'approche
  portique(ctx);
  bassin(ctx);
  fourgonBlinde(ctx);
  borneSOS(ctx, -91, -9.6);
  fileVoitures(ctx);
  semiRemorque(ctx, -80, -2.1, 0.02);
  encombrement(ctx);
  // 2 · La gare
  ilots(ctx);
  auvent(ctx);
  barricade(ctx);
  chicane(ctx);
  douane(ctx);
  palissades(ctx);
  tourDeGuet(ctx);
  cage(ctx);
  bivouac(ctx);
  localTechnique(ctx);
  mats(ctx);
  // 3 · Le camp
  exploitation(ctx);
  parvisCamp(ctx);
  garage(ctx);
  voituresPoussees(ctx);
  campEnPlus(ctx);
  // 4 · Le pont
  parkingIntervention(ctx);
  pont(ctx);
  canalEnPlus(ctx);

  const groupe = b.construire();
  return recentrer(groupe, { x: def.decalage.x, z: 0 }, def.lot);
}
