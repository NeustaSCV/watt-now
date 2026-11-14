// Les alentours de la station-service (halte du niveau 1) : R52, « un lieu ne s'arrête jamais net ».
//
// La station n'est pas un modèle de la banque : le jeu la dessine lui-même (client/src/rendu/halte.ts). Ce module ne
// fournit que le décor AUTOUR de son lot, sur 60 m (et un talus qui plonge jusqu'à 90 m pour que la vue d'ensemble ne
// montre jamais le bord) : le sous-bois (litière de feuilles, mousse, houppiers vus d'en haut, quelques sapins, troncs
// morts), la route de la Campagne qui continue aux deux bouts avec ses accotements et ses glissières, et le chemin de
// la Coopérative qui s'enfonce au nord-ouest.
//
// Repère : CELUI DU JEU pour la halte (pas le centre du lot comme les autres modèles de la banque) : origine au coin
// nord-ouest du lot, +x à l'est (0 → 200), +z au sud (0 → 70), sol à y = 0. Le groupe s'ajoute tel quel à côté de
// creerHalte(), sans décalage. Rien ne recouvre le lot ; rien n'est un obstacle (tout est hors du lot).
//
// Raccords avec ce que dessine déjà halte.ts (lus dans le code, lecture seule) :
// - son sol déborde de 30 m à l'ouest et à l'est (x −30 → 230) et de 25 m au nord et au sud (z −25 → 95), à y = 0 :
//   notre sol passe dessous (y ≈ −0,06 près du lot) et ne se voit qu'au-delà ;
// - sa route s'arrête à x = −20 et x = 220 (y = 0,02) : la nôtre part exactement de là, à la même hauteur ;
// - sa forêt va jusqu'à z ≈ −17 au nord, z ≈ 88 au sud, x ≈ −26 et 226 aux bouts : nos arbres commencent à peu près là ;
// - son chemin de la Coopérative s'arrête à z = −16 : le nôtre le prolonge sur le même tracé.
//
// Rendu de la banque : lisse à facettes (flatShading), couleur par sommet, deux matières, donc deux appels de dessin.

import * as THREE from "three";

// ---------- Ce que le jeu dit du lot (commun/src/lieux.ts, lecture seule) ----------

/** Le lot de la halte (HALTE), la route (ROUTE), le chemin de la Coopérative (CHEMIN_COOP_HALTE). */
const LOT = { l: 200, p: 70 };
const ROUTE = { z: 35, demiLargeur: 3.5 };
const COOP = { x: 72, demiLargeur: 1.8, lisiere: 9 };

/** Jusqu'où va le décor autour du lot (m), et le talus qui plonge au-delà pour cacher le bord. */
const LOIN = 60;
const TALUS = 90;

export const FICHE = {
  id: "alentours-station",
  nom: "Les alentours de la station-service",
  lieu: "Halte du niveau 1, entre le terrain et le Carrefour (route de la Campagne)",
  environnement: "forêt de plaine, route de campagne",
  danger: 1,
  recit:
    "Autour de la station « Abondance », la forêt a repris ses droits : de la mousse sur la litière, des troncs couchés " +
    "depuis la Grande Panne, et la route qui file sous les arbres entre deux glissières que personne ne repeindra. " +
    "On disait « la route de la Campagne » comme on dit « la sortie de secours ».",
  inspiration: "Les nationales forestières des Landes et du Morvan, vues d'avion.",
  reperes: [
    "la route qui continue aux deux bouts, ses accotements de gravier, sa ligne effacée",
    "les glissières (quelques lisses tombées ou tordues avec l'usure)",
    "le sous-bois : litière de feuilles, plaques de mousse, houppiers vus d'en haut, quelques sapins",
    "les troncs morts couchés",
    "le chemin de la Coopérative qui s'enfonce vers le nord-ouest",
    "le talus qui plonge au-delà de 60 m : la vue d'ensemble ne montre plus le bord",
  ],
  /** Le lot de la station tel que le jeu le dessine (rien de ce module n'y entre). */
  station: {
    source: ".claude-travail/integration-0-10/code/commun/src/lieux.ts (HALTE, ROUTE, CHEMIN_COOP_HALTE, ZONE_STATION, SORTIES_STATION) et client/src/rendu/halte.ts",
    lot: { l: LOT.l, p: LOT.p },
    repere: "origine au coin nord-ouest du lot ; +x à l'est de 0 à 200, +z au sud de 0 à 70 ; sol à y = 0",
    route: { z: ROUTE.z, demiLargeur: ROUTE.demiLargeur, axe: "x (ouest → est)" },
    praticable: { xMin: 0.5, xMax: 199.5, zMin: 9, zMax: 59 },
    sorties: [
      { vers: "comptoir", bout: "ouest", x: 2, z: ROUTE.z, arrivee: { x: 4.5, z: ROUTE.z } },
      { vers: "terrain", bout: "est", x: 198, z: ROUTE.z, arrivee: { x: 195.5, z: ROUTE.z } },
      { vers: "cooperative", bout: "nord", x: COOP.x, z: 10.5, arrivee: { x: COOP.x, z: 12.5 } },
    ],
  },
  /** Pour la visionneuse : le lot de la station, figuré par une boîte grise sur la page d'essai. */
  lot: { l: LOT.l, p: LOT.p },
  solPropre: true,
  alentours: { jusqua: LOIN, talus: TALUS, triangles: "5 633 (usure 0,1) à 5 646 (usure 1)", appels: 2 },
};

// ---------- Outils ----------

/** Un tirage reproductible (mulberry32). */
function tirage(graine) {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Un bruit de valeur lissé, de 0 à 1. */
function bruit(graine) {
  const h = (i, j) => {
    let n = Math.imul(i, 374761393) + Math.imul(j, 668265263) + graine * 1442695;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  };
  const l = (t) => t * t * (3 - 2 * t);
  return (x, z) => {
    const i = Math.floor(x);
    const j = Math.floor(z);
    const u = l(x - i);
    const v = l(z - j);
    const a = h(i, j) + (h(i + 1, j) - h(i, j)) * u;
    const b = h(i, j + 1) + (h(i + 1, j + 1) - h(i, j + 1)) * u;
    return a + (b - a) * v;
  };
}

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

/** Le tracé de la route hors du lot : droite jusqu'à 30 m du bout, puis elle tourne doucement sous les arbres. */
function zRoute(x) {
  if (x < -30) return ROUTE.z - ((-30 - x) ** 2) / 260; // vers le Carrefour, elle remonte au nord-ouest
  if (x > LOT.l + 30) return ROUTE.z + ((x - LOT.l - 30) ** 2) / 260; // vers le terrain, elle descend au sud-est
  return ROUTE.z;
}

/** Le chemin de la Coopérative (même tracé que xCheminCoop de halte.ts) : il tourne vers le nord-ouest sous les arbres. */
function xCoop(z) {
  return COOP.x - (z < COOP.lisiere ? ((COOP.lisiere - z) ** 2) / 60 : 0);
}

/** Distance d'un point au lot (0 dedans). */
function horsLot(x, z) {
  const dx = Math.max(0 - x, 0, x - LOT.l);
  const dz = Math.max(0 - z, 0, z - LOT.p);
  return Math.hypot(dx, dz);
}

/** Distance « carrée » au lot (le plus grand des écarts en x et en z) : la bande de 60 m est un rectangle. */
function ecartLot(x, z) {
  return Math.max(0 - x, 0, x - LOT.l, 0 - z, z - LOT.p);
}

/** Est-on dans l'emprise de ce que le jeu dessine déjà (son sol déborde de 30 m en x et de 25 m en z) ? */
function sousLeSolDuJeu(x, z) {
  return x > -30 && x < LOT.l + 30 && z > -25 && z < LOT.p + 25;
}

/** Un maillage en construction : positions, couleurs, index. */
class Maillage {
  constructor() {
    this.p = [];
    this.c = [];
    this.i = [];
  }
  sommet(x, y, z, couleur) {
    this.p.push(x, y, z);
    this.c.push(couleur.r, couleur.g, couleur.b);
    return this.p.length / 3 - 1;
  }
  tri(a, b, c) {
    this.i.push(a, b, c);
  }
  quad(a, b, c, d) {
    this.i.push(a, b, c, a, c, d);
  }
  /** Ajoute une géométrie three (déjà placée), teinte unie légèrement nuancée. */
  ajouter(geo, couleur, nuance = 0, aleat = Math.random, dessous = -0.9) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const pos = g.attributes.position;
    const c = new THREE.Color();
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const d = new THREE.Vector3();
    for (let k = 0; k < pos.count; k += 3) {
      // Les faces tournées vers le sol ne se voient jamais d'en haut : on les laisse tomber.
      a.fromBufferAttribute(pos, k);
      b.fromBufferAttribute(pos, k + 1).sub(a);
      d.fromBufferAttribute(pos, k + 2).sub(a);
      if (b.cross(d).normalize().y < dessous) continue;
      c.copy(couleur).offsetHSL(0, 0, (aleat() - 0.5) * nuance);
      const base = this.p.length / 3;
      for (let v = 0; v < 3; v++) {
        this.p.push(pos.getX(k + v), pos.getY(k + v), pos.getZ(k + v));
        this.c.push(c.r, c.g, c.b);
      }
      this.i.push(base, base + 1, base + 2);
    }
    if (g !== geo) g.dispose();
    geo.dispose();
  }
  geometrie() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.c, 3));
    g.setIndex(this.i);
    g.computeVertexNormals();
    return g;
  }
}

// ---------- Les teintes ----------

const T = {
  litiere: new THREE.Color(0x6e5a3a),
  litiereClaire: new THREE.Color(0x8a7048),
  mousse: new THREE.Color(0x56702f),
  mousseClaire: new THREE.Color(0x6f8a3c),
  ombre: new THREE.Color(0x2f4428),
  // Le sous-bois sombre de halte.ts au bord de son sol (0x3f5432 mêlé d'herbe) : on s'y raccorde.
  raccord: new THREE.Color(0x45592f),
  gravier: new THREE.Color(0x9a907a),
  asphalte: new THREE.Color(0x56575b),
  ligne: new THREE.Color(0xd9d2b8),
  terre: new THREE.Color(0x9c7a55),
  herbeSeche: new THREE.Color(0x9aa65e),
  feuillage: new THREE.Color(0x5d8a46),
  feuillageSombre: new THREE.Color(0x3f6b3a),
  feuillageClair: new THREE.Color(0x7da150),
  sapin: new THREE.Color(0x35553a),
  tronc: new THREE.Color(0x7a5a3c),
  boisMort: new THREE.Color(0x8a8274),
  acier: new THREE.Color(0xa3a8aa),
  rouille: new THREE.Color(0x8a5a3a),
};

// ---------- Le sol : litière, mousse, accotements, talus ----------

function creerSol(m, usure, n, aleat) {
  // Une grille de 10 m (les bords du lot tombent sur ses lignes), plus deux rangs pour le talus.
  const xs = [-TALUS];
  for (let x = -LOIN; x <= LOT.l + LOIN; x += 10) xs.push(x);
  xs.push(LOT.l + TALUS);
  const zs = [-TALUS];
  for (let z = -LOIN; z <= LOT.p + LOIN; z += 10) zs.push(z);
  zs.push(LOT.p + TALUS);
  const c = new THREE.Color();
  const idx = [];
  for (let j = 0; j < zs.length; j++) {
    idx.push([]);
    for (let i = 0; i < xs.length; i++) {
      const x = xs[i];
      const z = zs[j];
      const d = horsLot(x, z);
      const dRoute = Math.abs(z - zRoute(x)) - ROUTE.demiLargeur;
      // Le relief : plat près du lot et le long de la route, de douces ondulations ensuite, le talus au-delà de 60 m.
      const loin = clamp((d - 30) / 25);
      const pres = clamp((dRoute - 4) / 12);
      let y = -0.06 + (n(x / 23, z / 23) - 0.5) * 1.4 * loin * pres;
      if (ecartLot(x, z) > LOIN + 1) y = -7 - n(x / 9, z / 9) * 2;
      // La couleur : litière et mousse en taches, l'ombre des houppiers, raccord sombre au bord du sol du jeu.
      const a = n(x / 17 + 40, z / 17 + 40);
      const b = n(x / 7 + 90, z / 7 + 90);
      c.copy(T.litiere).lerp(T.litiereClaire, clamp(b - 0.45) * 1.2);
      c.lerp(T.mousse, clamp((a - 0.3) * 2) * (0.65 + usure * 0.3));
      c.lerp(T.ombre, clamp((n(x / 11 + 7, z / 11 + 7) - 0.45) * 1.6) * 0.7);
      c.lerp(T.raccord, clamp(1 - (d - 25) / 15) * 0.7);
      // L'accotement de gravier, puis l'herbe sèche du fossé.
      if (dRoute < 6) c.lerp(T.herbeSeche, clamp(1 - (dRoute - 2) / 4) * 0.55);
      if (dRoute < 2) c.lerp(T.gravier, clamp(1 - dRoute / 2) * 0.8);
      // Sur le talus, le sous-bois sombre de la forêt qui continue.
      if (ecartLot(x, z) > LOIN + 1) c.copy(T.feuillageSombre).lerp(T.ombre, 0.6).offsetHSL(0, 0, -0.03);
      c.offsetHSL(0, 0, (aleat() - 0.5) * 0.05);
      idx[j].push(m.sommet(x, y, z, c));
    }
  }
  for (let j = 0; j < zs.length - 1; j++) {
    for (let i = 0; i < xs.length - 1; i++) {
      // Rien sur le lot : la case est sautée si elle est dedans.
      const cx = (xs[i] + xs[i + 1]) / 2;
      const cz = (zs[j] + zs[j + 1]) / 2;
      if (cx > 0 && cx < LOT.l && cz > 0 && cz < LOT.p) continue;
      // Ni sous le sol que le jeu dessine déjà autour (x −30 → 230, z −25 → 95) : on ne le verrait pas.
      if (xs[i] >= -30 && xs[i + 1] <= LOT.l + 30 && zs[j] >= -25 && zs[j + 1] <= LOT.p + 25) continue;
      m.quad(idx[j][i], idx[j + 1][i], idx[j + 1][i + 1], idx[j][i + 1]);
    }
  }
}

// ---------- La route qui continue, sa ligne effacée ----------

function creerRoute(m, usure, n, aleat) {
  const c = new THREE.Color();
  // De x = −20 (là où s'arrête la route du jeu) jusqu'à 60 m, puis elle plonge avec le talus ; de même à l'est.
  for (const [x0, x1] of [[-20, -TALUS], [LOT.l + 20, LOT.l + TALUS]]) {
    const pas = 5;
    const nb = Math.round(Math.abs(x1 - x0) / pas);
    const rangs = [];
    for (let k = 0; k <= nb; k++) {
      const x = x0 + ((x1 - x0) * k) / nb;
      const zc = zRoute(x);
      const d = Math.abs(x - (x < 0 ? 0 : LOT.l));
      // Sur le talus, elle plonge avec le sol (un peu au-dessus de lui).
      const y = 0.02 - 7 * clamp((d - LOIN) / (TALUS - LOIN)) + (d > LOIN ? 0.08 : 0);
      const rang = [];
      for (const u of [-1, -0.5, 0.5, 1]) {
        c.copy(T.asphalte).offsetHSL(0, 0, (n(x / 6 + 9, u * 3) - 0.5) * 0.08 + (Math.abs(u) === 1 ? 0.03 : 0));
        // Avec l'usure, la mousse et les feuilles gagnent les bords.
        if (Math.abs(u) === 1) c.lerp(T.litiere, usure * 0.35 * n(x / 4, u));
        if (d > LOIN + 1) c.lerp(T.ombre, 0.7);
        rang.push(m.sommet(x, y, zc + u * ROUTE.demiLargeur, c));
      }
      rangs.push(rang);
    }
    for (let k = 0; k < nb; k++) {
      const [a, b] = x1 < x0 ? [rangs[k + 1], rangs[k]] : [rangs[k], rangs[k + 1]];
      for (let u = 0; u < 3; u++) m.quad(a[u], a[u + 1], b[u + 1], b[u]);
    }
    // La ligne médiane en tirets, effacée par endroits (comme dans le lot : 3 m tous les 7 m).
    const signe = Math.sign(x1 - x0);
    for (let d = 3; d < LOIN - 3; d += 7) {
      if (aleat() < 0.25 + usure * 0.2) continue;
      const xa = x0 + signe * d;
      const xb = xa + signe * 3;
      c.copy(T.ligne).offsetHSL(0, 0, (aleat() - 0.5) * 0.06);
      const s = [
        m.sommet(xa, 0.03, zRoute(xa) - 0.07, c),
        m.sommet(xa, 0.03, zRoute(xa) + 0.07, c),
        m.sommet(xb, 0.03, zRoute(xb) + 0.07, c),
        m.sommet(xb, 0.03, zRoute(xb) - 0.07, c),
      ];
      if (signe > 0) m.quad(s[0], s[1], s[2], s[3]);
      else m.quad(s[3], s[2], s[1], s[0]);
    }
  }
}

// ---------- Le chemin de la Coopérative, au nord ----------

function creerCheminCoop(m, aleat) {
  // Le jeu le dessine jusqu'à z = −16 ; on le prolonge jusqu'à 60 m au nord du lot (deux ornières, herbe au milieu).
  const c = new THREE.Color();
  const zDebut = -16;
  const zFin = -LOIN + 2;
  const nb = 14;
  const largeur = COOP.demiLargeur * 2;
  const rangs = [];
  for (let k = 0; k <= nb; k++) {
    const z = zDebut + ((zFin - zDebut) * k) / nb;
    const x = xCoop(z);
    const rang = [];
    for (let u = 0; u < 5; u++) {
      c.copy(T.terre).lerp(T.herbeSeche, u === 2 ? 0.6 : u === 0 || u === 4 ? 0.5 : 0.08);
      c.lerp(T.litiere, (k / nb) * 0.35).offsetHSL(0, 0, (aleat() - 0.5) * 0.06);
      rang.push(m.sommet(x + (u / 4 - 0.5) * largeur, 0.025, z, c));
    }
    rangs.push(rang);
  }
  for (let k = 0; k < nb; k++) for (let u = 0; u < 4; u++) m.quad(rangs[k][u], rangs[k][u + 1], rangs[k + 1][u + 1], rangs[k + 1][u]);
}

// ---------- Les glissières ----------

function creerGlissieres(m, usure, aleat) {
  // Une lisse sur des poteaux tous les 4 m, des deux côtés de la route, de 2 m à 50 m au-delà de la fin de la route du jeu.
  const poteau = () => new THREE.BoxGeometry(0.12, 0.75, 0.12);
  for (const [x0, signe] of [[-22, -1], [LOT.l + 22, 1]]) {
    for (const cote of [-1, 1]) {
      const ecart = ROUTE.demiLargeur + 0.9;
      let tombee = false;
      for (let d = 0; d < 36; d += 4) {
        const xa = x0 + signe * d;
        const xb = xa + signe * 4;
        const za = zRoute(xa) + cote * ecart;
        const zb = zRoute(xb) + cote * ecart;
        // Le poteau, parfois penché.
        const penche = aleat() < 0.15 + usure * 0.25 ? (aleat() - 0.5) * 0.5 : 0;
        const p = poteau().translate(0, 0.375, 0).rotateX(penche * cote).translate(xa, 0, za);
        m.ajouter(p, T.acier.clone().lerp(T.rouille, aleat() * usure * 0.5), 0.04, aleat);
        // La lisse : une bande d'acier galvanisé, tombée ou tordue par endroits avec l'usure.
        const r = aleat();
        if (r < usure * 0.12) {
          tombee = true;
          continue; // une lisse manque
        }
        const longueur = Math.hypot(xb - xa, zb - za);
        const angle = Math.atan2(zb - za, xb - xa);
        const lisse = new THREE.BoxGeometry(longueur, 0.3, 0.05);
        const couchee = r < usure * 0.22 || (tombee && r < 0.5);
        tombee = false;
        if (couchee) lisse.rotateX(1.25 * cote).translate(0, 0.12, cote * 0.2);
        else lisse.translate(0, 0.6, cote * 0.08);
        lisse.rotateY(-angle).translate((xa + xb) / 2, 0, (za + zb) / 2);
        m.ajouter(lisse, T.acier.clone().lerp(T.rouille, aleat() * usure * 0.6), 0.05, aleat);
      }
    }
  }
}

// ---------- Les arbres : des houppiers vus d'en haut, quelques sapins, des troncs morts ----------

/** Peut-on poser un arbre ici ? Hors du lot, hors de l'emprise de la forêt du jeu, hors de la route et du chemin. */
function placeLibre(x, z, marge, loin = LOIN + 2) {
  if (ecartLot(x, z) > loin) return false;
  // La forêt du jeu (halte.ts) occupe déjà x −26 → 226, z −17 → 88 : on commence juste après.
  if (x > -24 && x < LOT.l + 24 && z > -15 && z < LOT.p + 16) return false;
  if (Math.abs(z - zRoute(x)) < ROUTE.demiLargeur + 2.5 + marge) return false;
  if (z < 0 && Math.abs(x - xCoop(z)) < COOP.demiLargeur + 1.5 + marge) return false;
  return true;
}

function creerArbres(m, usure, aleat) {
  const tons = [T.feuillage, T.feuillageSombre, T.feuillageClair, T.feuillageSombre];
  const places = [];
  const libre = (x, z, r) => places.every((p) => Math.hypot(p.x - x, p.z - z) > (p.r + r) * 0.62);
  const teinteFeuillage = () => tons[Math.floor(aleat() * tons.length)].clone().offsetHSL(0, 0, (aleat() - 0.5) * 0.05);
  const tirer = () => [-LOIN - 4 + aleat() * (LOT.l + 2 * LOIN + 8), -LOIN - 4 + aleat() * (LOT.p + 2 * LOIN + 8)];
  // Au loin (plus de 22 m du lot), la canopée : de grands houppiers en masse (un icosaèdre aplati, sans tronc, posé
  // presque au sol), serrés, qui couvrent la litière et cachent le talus. Tirés d'abord, pour avoir la place.
  let n = 0;
  for (let essai = 0; essai < 20000 && n < 210; essai++) {
    const x = -LOIN - 14 + aleat() * (LOT.l + 2 * LOIN + 28);
    const z = -LOIN - 14 + aleat() * (LOT.p + 2 * LOIN + 28);
    const d = horsLot(x, z);
    if (d < 22) continue;
    const r = 5.5 + clamp((d - 22) / 40) * 3 + aleat() * 2.5;
    if (!placeLibre(x, z, r * 0.85, LOIN + 12) || !libre(x, z, r * 0.8)) continue;
    places.push({ x, z, r: r * 0.8 });
    n++;
    // Sur le talus, la masse descend avec lui.
    const y = -7 * clamp((ecartLot(x, z) - LOIN) / (TALUS - LOIN));
    const masse = new THREE.IcosahedronGeometry(r, 0)
      .scale(1, 0.5 + aleat() * 0.15, 1)
      .rotateY(aleat() * 6.28)
      .translate(x, y + r * 0.4 + aleat() * 1.5, z);
    m.ajouter(masse, teinteFeuillage(), 0.06, aleat, -0.5);
  }
  // En lisière (près du lot et de la route), des feuillus entiers : un houppier sur un tronc à 5 pans, sans fond,
  // comme les arbres du jeu (un peu plus grands).
  let f = 0;
  for (let essai = 0; essai < 6000 && f < 28; essai++) {
    const [x, z] = tirer();
    const d = horsLot(x, z);
    if (d > 30) continue;
    const r = 1.8 + aleat() * 1.4;
    if (!placeLibre(x, z, r * 0.4) || !libre(x, z, r)) continue;
    places.push({ x, z, r });
    f++;
    const h = r * (1.7 + aleat() * 0.4);
    m.ajouter(new THREE.CylinderGeometry(r * 0.09, r * 0.13, h * 0.55, 5, 1, true).translate(x, h * 0.27, z), T.tronc, 0.06, aleat);
    const houppier = new THREE.IcosahedronGeometry(r, 0)
      .scale(1, 0.85 + aleat() * 0.2, 1)
      .rotateY(aleat() * 6.28)
      .translate(x, h * 0.55 + r * 0.6, z);
    m.ajouter(houppier, teinteFeuillage(), 0.04, aleat);
  }
  // Les sapins, en petits bouquets : deux cônes à 6 pans, pour la silhouette.
  let s = 0;
  for (let essai = 0; essai < 3000 && s < 30; essai++) {
    const x = -LOIN - 4 + aleat() * (LOT.l + 2 * LOIN + 8);
    const z = -LOIN - 4 + aleat() * (LOT.p + 2 * LOIN + 8);
    const r = 1.3 + aleat() * 0.9;
    if (!placeLibre(x, z, r) || !libre(x, z, r)) continue;
    places.push({ x, z, r });
    s++;
    const h = r * (3.4 + aleat() * 0.8);
    const teinte = T.sapin.clone().offsetHSL(0, 0, (aleat() - 0.5) * 0.06);
    m.ajouter(new THREE.ConeGeometry(r, h * 0.62, 6, 1, true).translate(x, h * 0.5, z), teinte, 0.03, aleat);
    m.ajouter(new THREE.ConeGeometry(r * 0.7, h * 0.45, 6, 1, true).translate(x, h * 0.8, z), teinte.clone().offsetHSL(0, 0, 0.03), 0.03, aleat);
  }
  // Les troncs morts couchés dans la mousse, et leur souche ; plus nombreux avec l'usure. Près de la route surtout,
  // là où on les voit (et où la tempête les a laissés).
  const nbMorts = 6 + Math.round(usure * 8);
  let k = 0;
  for (let essai = 0; essai < 2000 && k < nbMorts; essai++) {
    const x = -LOIN + aleat() * (LOT.l + 2 * LOIN);
    const z = -LOIN + aleat() * (LOT.p + 2 * LOIN);
    const d = horsLot(x, z);
    if (d < 4 || d > 45 || sousLeSolDuJeu(x, z)) continue;
    if (Math.abs(z - zRoute(x)) < ROUTE.demiLargeur + 2.5) continue;
    if (z < 0 && Math.abs(x - xCoop(z)) < COOP.demiLargeur + 2) continue;
    k++;
    const longueur = 4 + aleat() * 5;
    const rayon = 0.22 + aleat() * 0.18;
    const angle = aleat() * Math.PI;
    const teinte = T.boisMort.clone().lerp(T.mousse, aleat() * 0.45);
    m.ajouter(
      new THREE.CylinderGeometry(rayon * 0.8, rayon, longueur, 5, 1, true).rotateZ(Math.PI / 2).rotateY(angle).translate(x, rayon * 0.8, z),
      teinte,
      0.05,
      aleat,
    );
    // La souche, à un bout, avec ses racines arrachées (une pyramide basse).
    const bx = x + Math.cos(angle) * longueur * 0.5;
    const bz = z - Math.sin(angle) * longueur * 0.5;
    m.ajouter(new THREE.ConeGeometry(rayon * 2.4, rayon * 2.2, 5, 1, true).rotateZ(Math.PI / 2).rotateY(angle).translate(bx, rayon * 1.1, bz), T.terre.clone().lerp(T.boisMort, 0.5), 0.06, aleat);
  }
}

// ---------- La création ----------

/**
 * Le décor autour du lot de la station, dans le repère du lot du jeu (coin nord-ouest, +x est, +z sud).
 * @param {{ usure?: number }} options usure de 0,1 à 1 : glissières tombées, troncs morts, mousse, ligne effacée.
 * @returns {THREE.Group} un groupe nommé « alentours » (2 maillages, 2 appels de dessin), sans obstacles.
 */
export function creer({ usure = 0.7 } = {}) {
  usure = clamp(usure, 0.1, 1);
  const aleat = tirage(9071);
  const n = bruit(9073);

  // Le sol (et ce qui est posé à plat dessus) : il reçoit les ombres, n'en porte pas.
  const plat = new Maillage();
  creerSol(plat, usure, n, aleat);
  creerRoute(plat, usure, n, aleat);
  creerCheminCoop(plat, aleat);

  // Les volumes : arbres, troncs morts, glissières.
  const volumes = new Maillage();
  creerGlissieres(volumes, usure, aleat);
  creerArbres(volumes, usure, aleat);

  const sol = new THREE.Mesh(plat.geometrie(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, flatShading: true }));
  sol.name = "alentours_sol";
  sol.receiveShadow = true;
  const decor = new THREE.Mesh(volumes.geometrie(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, flatShading: true }));
  decor.name = "alentours_volumes";
  decor.castShadow = true;
  decor.receiveShadow = true;

  const groupe = new THREE.Group();
  groupe.name = "alentours";
  groupe.userData.nom = "alentours";
  groupe.add(sol, decor);
  groupe.userData.objets = { alentours: groupe };
  groupe.userData.obstacles = [];
  groupe.userData.lumieres = [];
  groupe.userData.toits = [];
  return groupe;
}
