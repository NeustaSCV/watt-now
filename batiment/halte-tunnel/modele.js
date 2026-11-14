// Halte · Le tunnel (route de la Montagne, Book 20 §4).
//
// Une halte de 200 × 70 m à traverser d'ouest en est, en quatre tronçons de 50 m :
// 1. « montee » : la route de montagne qui grimpe en lacet (on voit la route basse dans le ravin), le péage du tunnel,
//    le PC de sécurité, le chalet des agents, l'aire de chaînage, la tranchée d'accès et le portail ouest ;
// 2. « tunnel-ouest » et 3. « tunnel-est » : l'intérieur du tunnel (104 m, deux voies, voûte en béton) ;
// 4. « tete-est » : le portail est, le barrage des pillards, le pont sur le torrent, le relais des Marmottes.
//
// La lumière est une mécanique du jeu (Book 01, Book 06 §3, Book 18 §2) : ce qui éclaire attire les Éteints. Le tunnel
// est donc NOIR : la couleur de tout ce qui est sous la voûte est assombrie (lumière « cuite » dans les sommets, voir
// outils.js), sauf près des portails, du feu de l'abri, des veilleuses vertes et d'une lampe frontale tombée.
//
// Coupe pour la vue de jeu : la montagne et la moitié sud de la voûte sont des couches qui s'effacent ; restent le sol,
// les piédroits jusqu'à 2,4 m, la moitié nord de la voûte (on voit l'intérieur, comme une maquette coupée) et, partout
// ailleurs, la tranche de la roche à 2,4 m (« dalle de section »).
//
// Tout est bâti dans le repère de la halte entière (origine au centre, +x à l'est, +z au sud), puis chaque tronçon ne
// garde que ce qui tombe dans sa bande de x et se recentre (voir `recentrer`).

import * as THREE from "three";
import { Batiment, Chantier, PALETTE, mur, gravats, debris, jonchee, touffes, mousse, toitDeuxPans, flaque, arbuste } from "../commun/atelier.js";
import { M, T, en, PI, clamp, lisse, arr, panneau, pousser, prisme, cylX, cylY, reglerEclairage } from "./outils.js";
import * as O from "./objets.js";

// ---------- Le plan de la halte ----------

const SECTION = 2.4; // la coupe : hauteur des piédroits permanents et de la tranche de roche
const MR = 58; // la montagne couvre |x| ≤ 58
const TUN = { x0: -52, x1: 52, zi: 5, ep: 0.6, r: 5 }; // voûte : centre à y = 2,4, rayon 5 (clé à 7,4 m)
const NICHES = [-37, -13, 13, 37];
const GALERIE = { x0: -22, x1: -20, z0: -12, z1: -5.6 };
const ABRI = { x0: -28, x1: -12, z0: -20, z1: -12.4 };
const FEU = { x: -15.6, z: -17.2 };
const LAMPE = { x: 35.4, z: -3.1, angle: 0.35 };
const EBOULEMENT = { x0: 25, x1: 33, x: 29 };
const DISTANCES = [-45, -29, -5, 5, 21, 29, 45]; // panneaux « sortie à … m » (veilleuses)
const VEILLEUSES = [...NICHES.map((x) => [x, -5.0]), [-21, -5.0], ...DISTANCES.map((x) => [x, -5.0])];

const TRONCONS = [
  { id: "montee", nom: "1 · La montée et le péage", x0: -100 },
  { id: "tunnel-ouest", nom: "2 · Le tunnel (ouest) et l'abri", x0: -50 },
  { id: "tunnel-est", nom: "3 · Le tunnel (est) et l'éboulement", x0: 0 },
  { id: "tete-est", nom: "4 · La tête est, le barrage et le pont", x0: 50 },
];

// ---------- Le relief ----------

function hash(a, b) {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function bruit(x, z) {
  return Math.sin(x * 0.37 + z * 0.11) * 0.5 + Math.sin(x * 0.13 - z * 0.29 + 1.3) * 0.7 + Math.sin(x * 0.71 + z * 0.53 + 2.1) * 0.25 + Math.sin(-x * 0.23 + z * 0.61) * 0.35;
}

/** L'axe de la route (z) selon x : elle arrive du sud-ouest en lacet, file droit dans le tunnel, s'incurve après le pont. */
export function zRoute(x) {
  if (x < -84) return 8 * (1 - lisse(-100, -84, x));
  if (x > 88) return -4 * lisse(88, 100, x);
  return 0;
}
/** La demi-largeur de la chaussée : 4 m, 7,5 m sur la place du péage. */
function largeur(x) {
  return 4 + 3.5 * lisse(-90, -82, x) * (1 - lisse(-64, -59, x));
}
/** La route basse (l'autre branche du lacet), 7 m plus bas, qui file vers le sud. */
function zBasse(x) {
  return 29.5 + Math.max(0, x + 76) ** 2 * 0.12;
}

function falaiseNord(x, z) {
  const zN = -23.5 + 1.5 * Math.sin(x * 0.21) + Math.sin(x * 0.07 + 1);
  const d = zN - z;
  if (d <= 0) return 0;
  let h = d < 3 ? d * 0.75 : 2.25 + (d - 3) * 2.6;
  h = Math.min(h, 19 + bruit(x * 0.5, z) * 1.5);
  if (d > 1) h += bruit(x, z) * 0.9 * Math.min(1, d / 4);
  return Math.max(0, h);
}

function sudOuest(x, z) {
  const zS = 20.5 + Math.sin(x * 0.3 + 0.5);
  if (z <= zS) return 0;
  const zb = zBasse(x);
  if (Math.abs(z - zb) < 3.8) return -7;
  if (z < zb) {
    const t = clamp((z - zS) / (zb - 3.8 - zS), 0, 1);
    return -7 * Math.pow(t, 0.8) + bruit(x, z) * 0.8 * t * (1 - t) * 4;
  }
  return Math.max(-11, -7 - (z - zb - 3.8) * 0.5);
}

function vallee(x, z) {
  const zS = 19.5 + Math.sin(x * 0.25);
  if (z <= zS) return 0;
  return Math.max(-12, -(z - zS) * 0.8 + bruit(x, z) * 0.6 * clamp((z - zS) / 3, 0, 1));
}

/** Le lit du torrent : en haut (nord) la vasque d'où tombe la cascade, puis la gorge, qui descend vers la vallée. */
function lit(z) {
  return -7 + 12 * (1 - lisse(-27, -25, z)) - Math.max(0, z - 18) * 0.25;
}
const xTorrent = (z) => 81 + 1.4 * Math.sin(z * 0.13 + 0.4);

/** Le terrain hors de la montagne (|x| ≥ 58). */
function exterieur(x, z) {
  let h = falaiseNord(x, z);
  if (h === 0) h = x < 0 ? sudOuest(x, z) : vallee(x, z);
  // La route et ses abords restent à plat
  const w = largeur(x) + 1.6;
  h *= lisse(w, w + 3, Math.abs(z - zRoute(x)));
  if (x > 0) {
    const dx = Math.abs(x - xTorrent(z));
    if (dx < 8) {
      const fond = lit(z);
      h = Math.min(h, fond + lisse(3, 8, dx) * (h - fond) + (dx > 3.5 ? bruit(x * 2, z) * 0.5 : 0));
    }
  }
  // La tranchée d'accès au portail, puis le pied de la montagne
  const e = Math.abs(x) - MR;
  if (e < 6 && Math.abs(z) <= 5.0001) return 0;
  if (e < 4) h += (Math.max(h, SECTION) - h) * (1 - lisse(0, 4, e));
  return h;
}

/** La montagne au-dessus du tunnel (|x| ≤ 58) : une crête de 24 m, qui retombe à 2,4 m à ses bords. */
function montagne(x, z) {
  const e = MR - Math.abs(x);
  const ax = clamp(Math.abs(x) / MR, 0, 1);
  // La crête court au nord du tunnel ; le versant sud descend vers le bord du lot (on voit la pente depuis le sud-est)
  const pz = z < -12 ? 1 - 0.25 * lisse(-12, -35, z) : 1 - 0.8 * lisse(-6, 35, z);
  const cz = 3 + 21 * Math.pow(1 - ax * ax, 0.6) * pz + bruit(x * 0.8, z * 0.8) * 1.3 + Math.max(0, bruit(x * 0.3 + 4, z * 0.4)) * 2.5 * lisse(10, 30, Math.abs(z));
  return Math.max(SECTION + (cz - SECTION) * lisse(0, 6, e), falaiseNord(x, z));
}

function hauteur(x, z) {
  return Math.abs(x) < MR ? montagne(x, z) : exterieur(x, z);
}

// ---------- La lumière cuite (voir outils.js) ----------

function eclairageTunnel(x, z) {
  const ax = Math.abs(x);
  if (ax > 52.7 || z > 5.65 || z < -20.6) return null;
  const sousTerre = z < -7.1;
  if (sousTerre && !(x > ABRI.x0 - 0.5 && x < ABRI.x1 + 0.5)) return null;
  const d = 52 - ax;
  const f = sousTerre ? 0.075 : 0.14 + 0.86 * Math.exp(-Math.max(0, d) / 5);
  const chaud = sousTerre ? 0.95 * Math.pow(Math.max(0, 1 - Math.hypot(x - FEU.x, z - FEU.z) / 8), 1.6) : 0;
  let vert = 0;
  if (!sousTerre) for (const [vx, vz] of VEILLEUSES) {
    const dv = Math.hypot(x - vx, (z - vz) * 1.3);
    if (dv < 2.8) vert = Math.max(vert, (1 - dv / 2.8) * 0.55);
  }
  const dl = Math.hypot(x - LAMPE.x - 1.2, z - LAMPE.z);
  const blanc = dl < 3 ? (1 - dl / 3) * 0.45 : 0;
  return { f, chaud, vert, blanc };
}
reglerEclairage(eclairageTunnel);

// ---------- Les données de jeu (repère de la halte) ----------

const FOUILLE = [
  // 1 · montée
  { x: -72.4, z: -3.6, quoi: "cabine de péage : gilet réfléchissant, lampe torche sans piles, rouleau de tickets" },
  { x: -81.6, z: -15.6, quoi: "PC de sécurité : armoire (talkies-walkies, piles, plan du tunnel)" },
  { x: -75, z: -15.4, quoi: "vestiaire des agents : casiers (parkas, gants, une trousse de secours)" },
  { x: -91.2, z: -13.6, quoi: "cuisine du chalet des agents : conserves, café lyophilisé, réchaud" },
  { x: -96.4, z: -16.5, quoi: "dortoir du chalet : couvertures, duvet" },
  { x: -86.2, z: 15.2, quoi: "camping-car : réserves, bouteille de gaz, jerrican" },
  { x: -95.8, z: 10.6, quoi: "bac à chaînes : chaînes à neige (acier)" },
  // 2 · tunnel ouest
  { x: -37, z: -6.1, quoi: "niche de sécurité : extincteur à poudre, téléphone d'urgence (cuivre, petite électronique)" },
  { x: -44.5, z: -0.2, quoi: "voiture : coffre (sac de voyage, bouteilles)" },
  { x: -24, z: 3.8, quoi: "voiture au coffre ouvert : outils, câbles de démarrage" },
  { x: -9, z: -2.2, quoi: "accélérateur tombé : bobinage de cuivre du moteur (lourd)" },
  { x: -13.6, z: -14.2, quoi: "abri : cuve d'eau (1 000 L, à moitié pleine)" },
  { x: -26.6, z: -19.2, quoi: "abri : couvertures de survie, trousse de secours murale" },
  // 3 · tunnel est
  { x: 8, z: -0.4, quoi: "camion : palettes de packs d'eau et de conserves (presque vidées)" },
  { x: 13, z: -6.1, quoi: "niche de sécurité : téléphone d'urgence (l'extincteur a déjà été pris)" },
  { x: 35.6, z: -3.6, quoi: "lampe frontale (elle marche encore) et sac à dos abandonné" },
  { x: 29.5, z: -0.6, quoi: "éboulement : ferraillage (acier), câbles arrachés à la voûte" },
  { x: 37, z: -6.1, quoi: "niche de sécurité : extincteur, téléphone d'urgence" },
  // 4 · tête est
  { x: 66.2, z: -9.4, quoi: "abri des pillards : bidons, ferraille, outils, un réchaud" },
  { x: 97.6, z: 10.4, quoi: "réserve du relais des Marmottes : génépi, bougies, fromage sous vide" },
  { x: 92, z: 11.5, quoi: "bar du relais : verres, couteaux, torchons" },
  { x: 84.2, z: 6.4, quoi: "voiture suspendue au-dessus du torrent : boîte à gants (risqué)" },
];

const ETEINTS = [
  { x: -90, z: 14, type: "errant (aire de chaînage)" },
  { x: -71.5, z: 5.5, type: "errant (péage)" },
  { x: -72.2, z: -3.2, type: "ancien habitant : agent de péage en gilet, dans sa cabine" },
  { x: -40, z: -3.85, type: "rampant (dans le caniveau nord)" },
  { x: -29, z: 3.2, type: "errant (autour de la voiture incendiée)" },
  { x: -22.6, z: -0.9, type: "errant (entre les voitures)" },
  { x: -10.5, z: 3.85, type: "rampant (dans le caniveau sud)" },
  { x: -12.2, z: -4.4, type: "ancien habitant : agent de sécurité du tunnel (niche 2)" },
  { x: 9, z: -3.6, type: "errant (derrière le camion)" },
  { x: 20, z: -3.85, type: "rampant (dans le caniveau nord, avant l'éboulement)" },
  { x: 28.4, z: 2.4, type: "putréfié (pris dans l'éboulement)" },
  { x: 37.5, z: -1.8, type: "errant (attiré par la lampe frontale)" },
  { x: 44, z: 3.85, type: "rampant (dans le caniveau sud)" },
  { x: 59.5, z: -0.6, type: "équipé : ancien pillard, casque et plastron de palette" },
  { x: 82.5, z: 1.8, type: "errant (sur le pont)" },
  { x: 94.5, z: 12.5, type: "errant (terrasse du relais)" },
];

const ENTREES = [
  { x: -100, z: 8, nature: "entrée A : la route de montagne, depuis le col" },
  { x: -52.6, z: 0, nature: "portail ouest du tunnel" },
  { x: -78.2, z: -10, nature: "porte du PC de sécurité" },
  { x: -91, z: -12, nature: "porte du chalet des agents" },
  { x: -21, z: -5.3, nature: "porte coupe-feu de la galerie d'évacuation (vers l'abri)" },
  { x: -21, z: -12.2, nature: "porte du sas de l'abri pressurisé" },
  { x: 52.6, z: 0, nature: "portail est du tunnel" },
  { x: 93, z: 8, nature: "porte du relais des Marmottes (côté route)" },
  { x: 94.6, z: 15.5, nature: "porte de la terrasse du relais" },
  { x: 100, z: -4, nature: "sortie B : vers le Grand Comptoir du Barrage" },
];

const LUMIERES_NOTE = "8 au plus par tronçon";
void LUMIERES_NOTE;

function vers(dx, liste) {
  return liste.filter((p) => p.x >= dx - 25 && (p.x < dx + 25 || dx + 25 === 100)).map((p) => ({ ...p, x: arr(p.x - dx), z: arr(p.z) }));
}

const DESCRIPTIONS = {
  montee: "la route en lacet, l'aire de chaînage, le péage « par sourire », le PC de sécurité, le chalet des agents, la tranchée et le portail ouest",
  "tunnel-ouest": "le noir : voitures abandonnées, la voiture incendiée, deux niches, la galerie d'évacuation et l'abri pressurisé (feu de survivants), l'accélérateur tombé",
  "tunnel-est": "le camion, l'éboulement qui ne laisse qu'une voie (goulet), la lampe frontale tombée, deux niches, la sortie au bout",
  "tete-est": "le portail est, le barrage des pillards en chicane (goulet), le pont en arc sur le torrent, la cascade, le relais des Marmottes",
};

const CARTES = TRONCONS.map((t) => {
  const dx = t.x0 + 25;
  const depart = t.id === "montee" ? { x: -22, z: 7 } : t.id === "tete-est" ? { x: 17, z: 0 } : { x: -20, z: 1.5 };
  return {
    id: t.id,
    nom: t.nom,
    lot: { l: 50, p: 70 },
    decalage: { x: dx, z: 0 },
    solPropre: true,
    depart,
    description: DESCRIPTIONS[t.id],
    entrees: vers(dx, ENTREES),
    fouille: vers(dx, FOUILLE),
    eteints: vers(dx, ETEINTS),
  };
});

export const FICHE = {
  id: "halte-tunnel",
  nom: "Halte · Le tunnel",
  lieu: "Route de la Montagne · halte entre deux anneaux",
  environnement: "montagne",
  anneau: "moyen → lointain",
  danger: 3,
  halte: true,
  solPropre: true,
  recit:
    "Le tunnel du Mont-Cendre devait « adapter son éclairage à votre humeur » ; depuis la Grande Panne, il n'a plus qu'une humeur, et elle est noire. Cent quatre mètres sans lumière, où chaque lampe qu'on allume appelle tout ce qui rampe dans les caniveaux. Au milieu, derrière une porte coupe-feu, l'abri pressurisé : de l'eau, des couvertures, un feu — le refuge que tout le monde veut, et que quelqu'un garde toujours.",
  inspiration: "les tunnels routiers alpins (Fréjus, Mont-Blanc, Tende) : têtes en béton dans la falaise, niches SOS tous les 25 m, galeries d'évacuation et abris pressurisés, accélérateurs à la voûte ; les routes en lacets et les ponts en arc de la Maurienne",
  reperes: [
    "La coupe du tunnel en vue de jeu : la montagne et la moitié sud de la voûte s'effacent, on voit la voûte nord, les accélérateurs, les câbles",
    "Le noir : de jour, l'intérieur reste sombre ; seule la sortie, au bout, et les veilleuses vertes « SORTIE DE SECOURS » qui clignotent",
    "La galerie d'évacuation et l'abri pressurisé : bancs, couvertures, eau, le feu des survivants (« Fermez la porte : la lumière les attire »)",
    "La voiture incendiée et la suie sur la voûte ; l'accélérateur tombé au sol ; les rampants dans les caniveaux",
    "L'éboulement de la voûte qui ne laisse qu'une voie, contre le mur nord (goulet), juste après le camion bâché",
    "La lampe frontale tombée, qui éclaire encore le sol, sous le graffiti « Ils viennent à la lumière »",
    "Le barrage des pillards à la sortie est : deux voitures en chicane, murs de palettes, barbelés, brasero, guérite",
    "Le pont en arc au-dessus du torrent, la voiture suspendue au parapet, la cascade au nord",
    "L'Abondance : « Tunnel intelligent : éclairage adaptatif selon votre humeur », « Péage du tunnel — paiement par sourire », l'appel d'urgence premium à 2,99 Wh/min, la fondue par abonnement",
    "La route basse du lacet, 7 m plus bas, vue depuis l'aire de chaînage",
  ],
  lot: { l: 200, p: 70 },
  depart: { x: -97, z: 8 },
  goulets: [
    { x: 29, z: -2.9, nature: "l'éboulement : une seule voie praticable, entre la roche et le mur nord (dans le noir)" },
    { x: 59, z: 0, nature: "le barrage des pillards : chicane de deux voitures et de palettes, à la sortie est" },
  ],
  panneaux: [
    { x: -95, z: 0.4, texte: "← Le Col · Hameau des Charbonniers" },
    { x: 96, z: -8.4, texte: "Grand Comptoir du Barrage · 4 km →" },
  ],
  cartes: CARTES,
};

// ---------- Le terrain : un maillage à couleurs par triangle ----------

const ZL = [];
for (let z = -35; z <= 35.001; z += 2.5) ZL.push(arr(z));
const X_FIXES = new Set([-100, -58, -52, -50, 0, 50, 52, 58, 100]);

function sommet(xg, zg) {
  const fx = X_FIXES.has(xg);
  const fz = Math.abs(zg) === 35 || Math.abs(zg) === 5;
  const x = fx ? xg : xg + (hash(xg, zg) - 0.5) * 1.1;
  const z = fz ? zg : zg + (hash(xg + 17.3, zg - 9.1) - 0.5) * 1.3;
  return [x, z];
}

const _col = new THREE.Color();
function couleurSol(h, ny, x, z, r, montagneuse) {
  if (ny < 0.5) return r < 0.45 ? 0x76726a : r < 0.8 ? 0x6a665f : 0x85807a;
  if (ny < 0.78) return r < 0.4 ? 0x9a958a : r < 0.7 ? 0x88847a : 0x7d8752;
  if (x > 0 && h < lit(z) + 0.6) return r < 0.5 ? 0x8f8a7e : 0x7a776e; // galets du torrent
  if (montagneuse && h > 6) return r < 0.5 ? 0x86955a : r < 0.75 ? 0x99a066 : 0x8a867c;
  if (h < -6.3 && h > -7.6 && x < 0) return 0x8a867c; // bord de la route basse
  return r < 0.5 ? 0x8a9a5c : r < 0.78 ? 0x9aa266 : 0x7f8c52;
}

/**
 * Le relief d'une bande de x : `garder(cx, cz)` dit quelles cellules on pose et dans quel chantier (ou null).
 * `jupes` : bords verticaux (pour fermer le maillage) [{ cote, y }].
 */
function relief(xa, xb, garder) {
  const lots = new Map(); // chantier → { pos, col }
  const ajouter = (c, P, r, montagneuse) => {
    let l = lots.get(c);
    if (!l) lots.set(c, (l = { pos: [], col: [] }));
    const [a, b, d] = P;
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const n = Math.hypot(nx, ny, nz) || 1;
    const h = (a[1] + b[1] + d[1]) / 3;
    const cx = (a[0] + b[0] + d[0]) / 3;
    const cz = (a[2] + b[2] + d[2]) / 3;
    _col.setHex(couleurSol(h, ny / n, cx, cz, r, montagneuse)).offsetHSL(0, 0, (hash(cx * 3.1, cz * 1.7) - 0.5) * 0.04);
    for (const p of [a, b, d]) {
      l.pos.push(...p);
      l.col.push(_col.r, _col.g, _col.b);
    }
  };
  for (let xg = xa; xg < xb - 0.01; xg += 2) {
    for (let j = 0; j < ZL.length - 1; j++) {
      const cx = xg + 1;
      const cz = (ZL[j] + ZL[j + 1]) / 2;
      const c = garder(cx, cz);
      if (!c) continue;
      const mont = Math.abs(cx) < MR;
      const P = [[xg, ZL[j]], [xg + 2, ZL[j]], [xg + 2, ZL[j + 1]], [xg, ZL[j + 1]]].map(([x, z]) => {
        const [jx, jz] = sommet(arr(x), z);
        // Les sommets de la frontière de la montagne prennent la formule de leur côté (elles s'y rejoignent)
        const h = mont ? montagne(jx, jz) : exterieur(jx, jz);
        return [jx, h, jz];
      });
      const r1 = hash(cx * 1.3, cz * 2.1);
      const r2 = hash(cx * 2.3, cz * 0.7);
      // Triangles (sens : normale vers le haut, +z vers le bas de la grille)
      if ((Math.round(xg / 2) + j) % 2) {
        ajouter(c, [P[0], P[3], P[1]], r1, mont);
        ajouter(c, [P[1], P[3], P[2]], r2, mont);
      } else {
        ajouter(c, [P[0], P[3], P[2]], r1, mont);
        ajouter(c, [P[0], P[2], P[1]], r2, mont);
      }
    }
  }
  for (const [c, l] of lots) pousser(c, M.mat(), l.pos, l.col);
}

/** Une jupe : bande verticale le long d'une polyligne de sommets [x, yHaut, z], jusqu'à `yBas`, tournée vers `dir` [dx, dz]. */
function jupe(c, pts, yBas, dir, couleur = 0x5e5a54) {
  const pos = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (a[1] <= yBas + 0.01 && b[1] <= yBas + 0.01) continue;
    const A = [a[0], Math.max(a[1], yBas), a[2]];
    const B = [b[0], Math.max(b[1], yBas), b[2]];
    const A0 = [a[0], yBas, a[2]];
    const B0 = [b[0], yBas, b[2]];
    // Normale de (A0, B0, B) : on retourne si elle ne regarde pas vers `dir`
    const ux = B0[0] - A0[0], uz = B0[2] - A0[2];
    const nx = -uz, nz = ux; // pour un quad vertical (A0, B0, B, A)
    const bon = nx * dir[0] + nz * dir[1] > 0;
    const tri = bon ? [A0, B0, B, A0, B, A] : [A0, B, B0, A0, A, B];
    for (const p of tri) pos.push(...p);
  }
  _col.setHex(couleur);
  const col = [];
  for (let i = 0; i < pos.length / 3; i++) col.push(_col.r * (0.9 + 0.1 * ((i / 6) % 2)), _col.g, _col.b);
  pousser(c, M.mat(), pos, col);
}

function ligneZ(x, h) {
  return ZL.map((z) => {
    const [jx, jz] = sommet(x, z);
    return [jx, h(jx, jz), jz];
  });
}
function ligneX(xa, xb, z, h) {
  const p = [];
  for (let x = xa; x <= xb + 0.01; x += 2) {
    const [jx, jz] = sommet(arr(x), z);
    p.push([jx, h(jx, jz), jz]);
  }
  return p;
}

// ---------- Le chantier d'un tronçon ----------

class Troncon {
  constructor(def, usure) {
    this.def = def;
    this.x0 = def.x0;
    this.x1 = def.x0 + 50;
    this.u = usure;
    this.b = new Batiment(4410 + Math.round(def.x0), usure);
    this.c = this.b.c;
    const xm = def.x0 + 25;
    // Les couches de la montagne (la moitié sud de la voûte va dans « sud »)
    const xa = Math.max(this.x0, -MR);
    const xb = Math.min(this.x1, MR);
    this.montagneuse = xb > xa;
    if (this.montagneuse) {
      const l = xb - xa;
      this.sud = this.b.couche("montagne-sud", { x: (xa + xb) / 2, z: 15, l, p: 40 }, SECTION, 26);
      this.nord = this.b.couche("montagne-nord", { x: (xa + xb) / 2, z: -20, l, p: 30 }, SECTION, 26);
    }
    this.xm = xm;
    // Les veilleuses qui clignotent : un maillage à part, animé
    this.clignote = new Chantier(77);
  }
  ici(x) {
    return x >= this.x0 && x < this.x1;
  }
}

// ---------- Sol, tranche de roche, jupes ----------

const CREUX = [
  { x0: -58, x1: -52, z0: -5.5, z1: 5.5 }, // tranchée ouest (murs en aile compris)
  { x0: -52, x1: 52, z0: -5.6, z1: 5.6 }, // le tunnel et ses piédroits
  { x0: 52, x1: 58, z0: -5.5, z1: 5.5 }, // tranchée est
  ...NICHES.map((n) => ({ x0: n - 1.3, x1: n + 1.3, z0: -7.0, z1: -5.6 })),
  { x0: GALERIE.x0 - 0.4, x1: GALERIE.x1 + 0.4, z0: GALERIE.z0, z1: GALERIE.z1 },
  { x0: ABRI.x0 - 0.4, x1: ABRI.x1 + 0.4, z0: ABRI.z0 - 0.4, z1: ABRI.z1 + 0.4 },
];

function solEtRoche(k) {
  const { c } = k;
  // Le relief permanent (hors montagne) et celui de la montagne (couches)
  relief(k.x0, k.x1, (cx, cz) => {
    if (Math.abs(cx) > MR) return c;
    if (Math.abs(cx) > 52 && Math.abs(cz) < 5) return null; // la tranchée : pas de montagne au-dessus
    return cz < -5 ? k.nord : k.sud;
  });
  // Jupes du sol permanent : bords du lot, bords du tronçon, et contre la montagne (jusqu'à la tranche)
  const ext = (x, z) => exterieur(x, z);
  const xa = k.x0 < -MR ? k.x0 : null;
  if (k.x0 < -MR) {
    const xe = Math.min(k.x1, -MR);
    jupe(c, ligneX(k.x0, xe, -35, ext), -14, [0, -1]);
    jupe(c, ligneX(k.x0, xe, 35, ext), -14, [0, 1]);
    jupe(c, ligneZ(k.x0, ext), -14, [-1, 0]);
    jupe(c, ligneZ(-MR, ext).filter((p) => Math.abs(p[2]) >= 5), SECTION, [1, 0], 0x6a665f);
  }
  if (k.x1 > MR) {
    const xs = Math.max(k.x0, MR);
    jupe(c, ligneX(xs, k.x1, -35, ext), -14, [0, -1]);
    jupe(c, ligneX(xs, k.x1, 35, ext), -14, [0, 1]);
    jupe(c, ligneZ(k.x1, ext), -14, [1, 0]);
    jupe(c, ligneZ(MR, ext).filter((p) => Math.abs(p[2]) >= 5), SECTION, [-1, 0], 0x6a665f);
  }
  void xa;
  if (k.montagneuse) {
    const xa2 = Math.max(k.x0, -MR);
    const xb2 = Math.min(k.x1, MR);
    const mo = (x, z) => montagne(x, z);
    // Bords sud et nord du lot
    jupe(k.sud, ligneX(xa2, xb2, 35, mo), SECTION, [0, 1], 0x6a665f);
    jupe(k.nord, ligneX(xa2, xb2, -35, mo), SECTION, [0, -1], 0x6a665f);
    // La tranche nord, face au tunnel (visible quand la couche sud s'efface) : la roche coupée
    const tranche = ligneX(Math.max(xa2, -52), Math.min(xb2, 52), -5, mo);
    jupe(k.nord, tranche, SECTION, [0, 1], 0x57534d);
    // Bords du tronçon dans la montagne (on voit la coupe quand le voisin s'efface)
    for (const [x, d] of [[xa2, -1], [xb2, 1]]) {
      if (Math.abs(x) >= MR) continue;
      const l = ligneZ(x, mo);
      jupe(k.sud, l.filter((p) => p[2] >= -5), SECTION, [d, 0], 0x5e5a54);
      jupe(k.nord, l.filter((p) => p[2] <= -5), SECTION, [d, 0], 0x5e5a54);
    }
    // La tranche de roche à 2,4 m : tout ce qui n'est pas creusé
    const carves = CREUX.filter((q) => q.x1 > xa2 && q.x0 < xb2).map((q) => ({ ...q, x0: Math.max(q.x0, xa2), x1: Math.min(q.x1, xb2) }));
    const xs = [...new Set([xa2, xb2, ...carves.flatMap((q) => [q.x0, q.x1])])].sort((p, q) => p - q);
    for (let i = 0; i < xs.length - 1; i++) {
      const u0 = xs[i];
      const u1 = xs[i + 1];
      if (u1 - u0 < 0.01) continue;
      const um = (u0 + u1) / 2;
      const trous = carves.filter((q) => q.x0 <= um && q.x1 >= um).map((q) => [q.z0, q.z1]).sort((p, q) => p[0] - q[0]);
      let z = -35;
      const dalle = (za, zb) => {
        if (zb - za < 0.01) return;
        c.pave(u0, -14, za, u1, SECTION, zb, 0x66625a, M.mat(), { crasse: false, nuance: 0.02 });
      };
      for (const [z0, z1] of trous) {
        if (z0 > z) dalle(z, z0);
        z = Math.max(z, z1);
      }
      if (z < 35) dalle(z, 35);
    }
    // Quelques blocs et fissures sur la tranche (lisibilité de la coupe)
    for (let i = 0; i < 18; i++) {
      const x = c.entre(xa2 + 1, xb2 - 1);
      const z = c.hasard() < 0.5 ? c.entre(-34, -8) : c.entre(7.5, 34);
      if (CREUX.some((q) => x > q.x0 - 0.8 && x < q.x1 + 0.8 && z > q.z0 - 0.8 && z < q.z1 + 0.8)) continue;
      c.boite(c.entre(1.5, 4), 0.03, c.entre(0.08, 0.15), 0x2f2d2a, { x, y: SECTION + 0.01, z, ry: c.hasard() * 3 }, M.mat(), { crasse: false });
    }
  }
}

// ---------- La route (dehors) ----------

function route(k, xa, xb) {
  const { c } = k;
  for (let x = xa; x < xb - 0.01; x += 2) {
    const xc = x + 1;
    if (!k.ici(xc)) continue;
    const z1 = zRoute(x);
    const z2 = zRoute(x + 2);
    const zc = (z1 + z2) / 2;
    const ry = -Math.atan2(z2 - z1, 2);
    const L = Math.hypot(2, z2 - z1) + 0.04;
    const w = largeur(xc);
    c.repere({ x: xc, z: zc, ry }, () => {
      c.boite(L, 0.33, w * 2, 0x5a5955, { y: -0.135 }, M.mat(), { crasse: false, nuance: 0.03 });
      // Bas-côtés de gravier
      for (const s of [-1, 1]) c.boite(L, 0.04, 1.4, 0x9a958a, { y: 0.01, z: s * (w + 0.7) }, M.mat(), { crasse: false, nuance: 0.05 });
      // Marquage : rives continues, axe en tirets
      for (const s of [-1, 1]) c.boite(L, 0.012, 0.13, 0xd8d4c8, { y: 0.036, z: s * (w - 0.3) }, M.mat(), { crasse: false, nuance: 0.04 });
      if (Math.round(x / 2) % 3 === 0 && w < 5) c.boite(1.6, 0.012, 0.13, 0xd8d4c8, { y: 0.036 }, M.mat(), { crasse: false });
    });
    // Fissures et herbes dans l'enrobé
    if (c.hasard() < 0.3 + k.u * 0.4) touffes(c, [[xc + c.entre(-1, 1), zc + (c.hasard() < 0.5 ? -1 : 1) * c.entre(w - 1, w + 1.2), 0.02]]);
  }
}

// ---------- Le tunnel ----------

/** Un segment de voûte (arc), dans le chantier donné. `nord` : moitié nord (φ de 0 à 90°), sinon moitié sud. */
function arcVoute(c, xa, xb, nord, couleurDe) {
  const n = 6;
  const R = TUN.r + 0.25;
  for (let i = 0; i < n; i++) {
    const p1 = (i / n) * (PI / 2);
    const p2 = ((i + 1) / n) * (PI / 2);
    const pm = (p1 + p2) / 2;
    const corde = 2 * R * Math.sin((p2 - p1) / 2) + 0.06;
    const s = nord ? -1 : 1;
    const z = s * R * Math.cos(pm);
    const y = SECTION + R * Math.sin(pm);
    const rx = nord ? pm - PI / 2 : PI / 2 - pm;
    c.boite(xb - xa + 0.01, 0.5, corde, couleurDe(pm, z, y), { x: (xa + xb) / 2, y, z, rx }, M.beton(), { crasse: false, nuance: 0.02 });
  }
}

function tunnel(k) {
  const { c } = k;
  for (let xa = TUN.x0; xa < TUN.x1; xa += 2) {
    const xm = xa + 1;
    if (!k.ici(xm)) continue;
    const xb = xa + 2;
    const t = (h, z = 0) => T(h, xm, z);
    // Chaussée, caniveaux, trottoirs
    c.pave(xa, -0.4, -3.6, xb, 0, 3.6, t(0x4a4947), M.mat(), { crasse: false, nuance: 0.03 });
    for (const s of [-1, 1]) {
      c.pave(xa, -0.4, s > 0 ? 3.6 : -4.1, xb, -0.26, s > 0 ? 4.1 : -3.6, t(0x262624, s * 4), M.mat(), { crasse: false, nuance: 0.03 });
      c.pave(xa, -0.4, s > 0 ? 4.1 : -5, xb, 0.15, s > 0 ? 5 : -4.1, t(0x8a867d, s * 4.5), M.mat(), { crasse: false, nuance: 0.03 });
      c.pave(xa, 0, s > 0 ? 3.39 : -3.51, xb, 0.012, s > 0 ? 3.51 : -3.39, t(0xc9c5b8, s * 3.5), M.mat(), { crasse: false });
    }
    if (Math.round(xa / 2) % 3 === 0) c.pave(xa + 0.2, 0, -0.06, xb - 0.2, 0.012, 0.06, t(0xc9c5b8), M.mat(), { crasse: false });
    // Les piédroits : bande claire en bas (peinture de tunnel), béton au-dessus
    const niche = NICHES.includes(xm);
    const porte = xm === -21;
    const eboule = xm > EBOULEMENT.x0 && xm < EBOULEMENT.x1;
    if (!eboule) c.pave(xa, -0.4, 5, xb, SECTION + 0.02, 5.6, t(0xb6b1a6, 5), M.beton(), { crasse: true, nuance: 0.02 });
    else if (xm < EBOULEMENT.x + 2) c.pave(xa, -0.4, 5, xb, 1.1, 5.6, t(0xa6a196, 5), M.beton(), { crasse: true }); // mur cassé sous l'éboulement
    if (!niche && !porte) {
      c.pave(xa, -0.4, -5.6, xb, SECTION + 0.02, -5, t(0xb6b1a6, -5), M.beton(), { crasse: true, nuance: 0.02 });
      c.pave(xa, 0.15, -5.02, xb, 1.6, -5, t(0xd2cdc0, -5), M.mat(), { crasse: false, nuance: 0.01 });
      // Catadioptres et coulures de calcite
      if (Math.round(xa / 2) % 5 === 0) c.boite(0.1, 0.1, 0.02, t(0xd8b23a, -5), { x: xm, y: 1.0, z: -4.99 }, M.lisse(), { crasse: false });
      if (c.hasard() < 0.25 + k.u * 0.3) c.boite(c.entre(0.05, 0.12), c.entre(0.6, 2.0), 0.01, t(0xe8e4d8, -5), { x: xm + c.entre(-0.8, 0.8), y: SECTION - 0.6, z: -4.985 }, M.mat(), { crasse: false });
    }
    // La moitié nord de la voûte (permanente) et la moitié sud (couche)
    const suie = Math.max(0, 1 - Math.abs(xm + 31) / 7);
    const couleurVoute = (pm, z, y) => {
      _col.setHex(T(0xa9a59c, xm, z));
      if (suie > 0) {
        const s = suie * (0.4 + 0.6 * (pm / (PI / 2)));
        _col.lerp(new THREE.Color(0x0b0a09), s);
      }
      return _col.getHex();
    };
    arcVoute(c, xa, xb, true, couleurVoute);
    if (k.sud && !(xm > EBOULEMENT.x0 + 1 && xm < EBOULEMENT.x1 - 1)) arcVoute(k.sud, xa, xb, false, couleurVoute);
    // Chemin de câbles sur la voûte nord, et les luminaires morts du « tunnel intelligent »
    c.boite(2.02, 0.07, 0.42, t(0x6a6e70, -4.5), { x: xm, y: 3.25, z: -4.55 }, M.tole());
    c.boite(2.02, 0.09, 0.3, t(0x1d1e1f, -4.5), { x: xm, y: 3.32, z: -4.55 }, M.mat());
    if (Math.round(xa / 2) % 2 === 0) {
      const phi = PI / 3;
      const pend = c.hasard() < 0.15 + k.u * 0.15;
      const z = -TUN.r * Math.cos(phi) + 0.12;
      const y = SECTION + TUN.r * Math.sin(phi) - 0.12;
      c.boite(1.3, 0.12, 0.3, t(0xcfcac0, z), { x: xm, y: pend ? y - 1.4 : y, z, rx: pend ? 0 : phi - PI / 2, rz: pend ? 0.6 : 0 }, M.lisse(), { crasse: false });
      if (pend) c.boite(0.02, 1.3, 0.02, t(0x1d1e1f, z), { x: xm - 0.4, y: y - 0.7, z }, M.mat(), { crasse: false });
    }
    // Les flaques d'infiltration
    if (c.hasard() < k.u * 0.35) flaque(c, xm + c.entre(-0.6, 0.6), c.entre(-3, 3), c.entre(0.4, 1.1), 0.012);
    // Feuilles et papiers près des portails
    if (Math.abs(xm) > 42) jonchee(c, xa, -4.8, xb, 4.8, Math.round(3 + k.u * 6), [T(0x9c7a45, xm, 0), T(0x7d6143, xm, 0), T(0xb08f55, xm, 0)], 0.012);
    else if (c.hasard() < 0.4) debris(c, xa, -3.5, xb, 3.5, 2, [T(0x8a867c, xm, 0), T(0x6a665e, xm, 0)]);
    // Le jour qui entre par les portails : nappes de lueur sur le sol et le mur nord
    const d = 52 - Math.abs(xm);
    if (d < 14) {
      const v = Math.exp(-d / 4.2);
      _col.setRGB(0.16 * v, 0.15 * v, 0.13 * v);
      const lu = _col.getHex();
      c.boite(2, 0.01, 9.6, lu, { x: xm, y: 0.03 }, M.lueur(), { crasse: false, nuance: 0 });
      c.boite(2, 4.4, 0.01, lu, { x: xm, y: 2.3, z: -4.96 }, M.lueur(), { crasse: false, nuance: 0 });
    }
    // Obstacles : les deux piédroits (ouverts aux niches et à la porte)
    if (!eboule) k.b.obstacle(xa, 5, xb, 5, "piédroit sud");
    if (!niche && !porte) k.b.obstacle(xa, -5, xb, -5, "piédroit nord");
  }

  // Les niches de sécurité (2 m de large, 1 m de fond) : béton, téléphone, extincteur, panneaux, veilleuse
  for (const n of NICHES) {
    if (!k.ici(n)) continue;
    en(n, -6, () => {
      c.pave(n - 1.3, -0.4, -7.0, n + 1.3, SECTION + 0.02, -6.6, T(0xb6b1a6), M.beton());
      for (const s of [-1, 1]) c.pave(s < 0 ? n - 1.3 : n + 1, -0.4, -6.6, s < 0 ? n - 1 : n + 1.3, SECTION + 0.02, -5.6, T(0xb6b1a6), M.beton());
      c.pave(n - 1, -0.4, -6.6, n + 1, 0.15, -5.6, T(0x8a867d), M.mat(), { crasse: false });
      O.equipementNiche(c, n, -6.6, n === 13);
      // Le linteau de la niche dans la voûte nord : un bandeau orange (repère SOS)
      c.boite(2.6, 0.35, 0.05, T(0xc8702a), { x: n, y: 2.62, z: -4.98 }, M.satin(), { crasse: false });
    });
    veilleuse(k, n, 2.95, "sortie", 0.9, 0.34);
    k.b.obstacle(n - 1, -5.6, n - 1, -6.6, "niche");
    k.b.obstacle(n - 1, -6.6, n + 1, -6.6, "niche");
    k.b.obstacle(n + 1, -6.6, n + 1, -5.6, "niche");
  }
  // Les panneaux « sortie à … m », bas sur le mur nord, sur batterie
  for (const x of DISTANCES) {
    if (!k.ici(x)) continue;
    panneau(c, "distance", x, 1.2, -4.97, 0.9, 0.23);
    veilleuse(k, x, 1.2, null, 0.9, 0.23);
  }
}

/** Une veilleuse verte sur batterie : un panneau (atlas) et sa lueur qui clignote (maillage animé à part). */
function veilleuse(k, x, y, region, l, h) {
  if (region) panneau(k.c, region, x, y, -4.97, l, h);
  const cl = k.clignote;
  cl.boite(l * 1.02, h * 1.04, 0.01, 0x6aff9a, { x, y, z: -4.955 }, matiereClignote(), { crasse: false, nuance: 0 });
  // Le halo : trois plaques de plus en plus grandes et pâles (sur le mur, puis sur le trottoir)
  for (const [k2, c2] of [[1.6, 0x0a3018], [2.4, 0x061e0f], [3.4, 0x031208]]) cl.boite(l * k2, h * k2 * 1.6, 0.01, c2, { x, y, z: -4.95 + k2 * 0.002 }, matiereClignote(), { crasse: false, nuance: 0 });
  for (const [k2, c2] of [[1.2, 0x041a0c], [2.0, 0x020e06]]) cl.boite(l * k2 * 1.6, 0.01, 0.6 * k2, c2, { x, y: 0.16 + k2 * 0.001, z: -4.75 + 0.3 * k2 }, matiereClignote(), { crasse: false, nuance: 0 });
}

let _clignote = null;
function matiereClignote() {
  if (!_clignote) {
    _clignote = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    _clignote.userData.sansOmbre = true;
    _clignote.userData.lueur = true;
  }
  return _clignote;
}

// ---------- Les têtes du tunnel : portails, tranchées, murs en aile ----------

function tete(k, s) {
  // s = −1 : ouest ; +1 : est
  const { c } = k;
  const xf = s * 52; // le nu de la façade
  if (!k.ici(xf + s * 0.3)) return;
  const couche = k.sud;
  // La façade : des bandes verticales, de l'arc (ou du sol) jusqu'au relief de la montagne
  const HF = 10; // le haut de la façade (la roche reprend au-dessus)
  for (let z = -6.5; z < 6.49; z += 0.25) {
    const zm = z + 0.125;
    const zp = Math.min(Math.abs(z), Math.abs(z + 0.25)); // le bord le plus proche de l'axe : l'arc reste net
    const yArc = Math.abs(zm) < 5 ? SECTION + Math.sqrt(Math.max(0, 25 - zp * zp)) : 0;
    const xa = s < 0 ? xf - 0.6 : xf;
    const xb = s < 0 ? xf : xf + 0.6;
    couche.pave(xa, yArc > 0 ? yArc : -0.4, z, xb, HF, z + 0.25, 0xb3aea3, M.beton(), { crasse: false, nuance: 0.01 });
  }
  // Au-dessus, la roche coupée net (le bord de la montagne)
  jupe(couche, ligneZ(xf, (x, z) => montagne(x, z)).filter((p) => Math.abs(p[2]) <= 5), HF - 0.3, [s, 0], 0x6a665f);
  // L'arc souligné, la casquette, le nom du tunnel
  for (let i = 0; i < 12; i++) {
    const a1 = (i / 12) * PI;
    const a2 = ((i + 1) / 12) * PI;
    const am = (a1 + a2) / 2;
    const R = 5.2;
    couche.boite(0.3, 0.4, 2 * R * Math.sin((a2 - a1) / 2) + 0.05, 0xc9c4b8, { x: xf + s * 0.75, y: SECTION + R * Math.sin(am), z: R * Math.cos(am), rx: PI / 2 - am }, M.beton(), { crasse: false });
  }
  couche.boite(1.4, 0.4, 14, 0xc9c4b8, { x: xf + s * 0.4, y: HF, z: 0 }, M.beton(), { crasse: false });
  panneau(couche, "nom", xf + s * 0.64, 8.65, 0, 6.2, 1.16, s * PI / 2);
  // Coulures noires sous la casquette
  for (let i = 0; i < 9; i++) {
    const z = c.entre(-6.2, 6.2);
    if (Math.abs(z) < 3.4) continue; // pas sur la plaque
    const h = c.entre(1, 2.4);
    couche.boite(0.02, h, c.entre(0.05, 0.16), 0x6a665e, { x: xf + s * 0.61, y: HF - 0.2 - h / 2, z }, M.mat(), { crasse: false });
  }
  // Les murs en aile, le long de la tranchée : partie basse permanente, partie haute dans la couche
  const x1 = s * 63;
  for (let x = Math.min(x1, xf); x < Math.max(x1, xf) - 0.01; x += 1) {
    const xa = x;
    const xb = x + 1;
    const top = (xx) => (Math.abs(xx) < MR ? montagne(xx, 5.25) : Math.max(0.55, exterieur(xx, 5.6) + 0.35));
    for (const sz of [-1, 1]) {
      const za = sz < 0 ? -5.5 : 5;
      const zb = sz < 0 ? -5 : 5.5;
      const ya = top(xa) + 0.05;
      const yb = top(xb) + 0.05;
      const ici = sz < 0 ? c : couche;
      prisme(c, M.beton(), 0xb0aba0, xa, xb, za, zb, -0.3, Math.min(ya, SECTION), Math.min(yb, SECTION));
      if (Math.max(ya, yb) > SECTION + 0.05) prisme(ici, M.beton(), 0xb0aba0, xa, xb, za, zb, SECTION, Math.max(ya, SECTION), Math.max(yb, SECTION));
    }
    k.b.obstacle(xa, -5, xb, -5, "mur en aile");
    k.b.obstacle(xa, 5, xb, 5, "mur en aile");
  }
  // Mousse et lierre au pied des murs en aile
  for (let i = 0; i < 6 + k.u * 8; i++) mousse(c, s * c.entre(53, 62), 0.0, (c.hasard() < 0.5 ? -1 : 1) * 4.6, 0.5, 3);
}

// ---------- L'abri pressurisé et sa galerie ----------

/** Un mur droit selon x ou z, découpé en morceaux pour que la lumière cuite varie (le feu). */
function murTeinte(k, a, b, h, ep, couleur, ouvertures = [], mat = M.beton(), interieur = null) {
  const { c } = k;
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const L = Math.hypot(dx, dz);
  const n = Math.max(1, Math.round(L / 1));
  const ux = dx / L, uz = dz / L;
  const nx = -uz * ep / 2, nz = ux * ep / 2;
  let debutObs = null;
  for (let i = 0; i < n; i++) {
    const u1 = (i * L) / n;
    const u2 = ((i + 1) * L) / n;
    const um = (u1 + u2) / 2;
    const x = a[0] + ux * um;
    const z = a[1] + uz * um;
    const o = ouvertures.find((q) => Math.abs(um - q.u) < q.l / 2);
    const pose = (y1, y2) => {
      const p1 = [a[0] + ux * u1, a[1] + uz * u1];
      const p2 = [a[0] + ux * u2, a[1] + uz * u2];
      c.pave(Math.min(p1[0], p2[0]) - Math.abs(nx), y1, Math.min(p1[1], p2[1]) - Math.abs(nz), Math.max(p1[0], p2[0]) + Math.abs(nx), y2, Math.max(p1[1], p2[1]) + Math.abs(nz), T(couleur, x, z), mat, { nuance: 0.02 });
      if (interieur && y1 < 1.5) {
        const ix = x - interieur.cote[0] * 0.0;
        void ix;
      }
    };
    if (!o) pose(-0.4, h);
    else if (o.haut < h) pose(o.haut, h);
    const plein = !o;
    if (plein && debutObs === null) debutObs = u1;
    if ((!plein || i === n - 1) && debutObs !== null) {
      const fin = plein ? u2 : u1;
      k.b.obstacle(a[0] + ux * debutObs, a[1] + uz * debutObs, a[0] + ux * fin, a[1] + uz * fin, "mur");
      debutObs = null;
    }
  }
}

function abri(k) {
  const { c } = k;
  if (!k.ici(-20)) return;
  const G = GALERIE;
  const A = ABRI;
  // La porte coupe-feu dans le piédroit nord : chambranle en béton, vantail d'acier vert entrouvert
  en(-21, -5.3, () => {
    c.pave(-22, -0.4, -5.6, -21.6, SECTION + 0.02, -5, T(0xb6b1a6), M.beton());
    c.pave(-20.4, -0.4, -5.6, -20, SECTION + 0.02, -5, T(0xb6b1a6), M.beton());
    c.pave(-21.6, 2.1, -5.6, -20.4, SECTION + 0.02, -5, T(0xb6b1a6), M.beton());
    c.pave(-21.62, 0, -5.02, -20.38, 2.12, -4.99, T(0x2f5a3c), M.tole(), { crasse: false }); // cadre peint
    c.repere({ x: -21.55, y: 0.02, z: -5.45, ry: 1.1 }, () => {
      c.boite(1.12, 2.06, 0.08, T(0x3f7a4c), { x: 0.56, y: 1.03 }, M.tole());
      c.boite(0.5, 0.04, 0.05, T(0xc9c4b8), { x: 0.85, y: 1.05, z: 0.06 }, M.metal()); // barre anti-panique
    });
    panneau(c, "grafAbri", -18.2, 1.0, -4.97, 2.6, 0.65);
  });
  veilleuse(k, -21, 2.78, "sortie", 1.2, 0.45);
  k.b.obstacle(-22, -5, -21.6, -5, "chambranle");
  k.b.obstacle(-20.4, -5, -20, -5, "chambranle");
  // La galerie : 2 m de large, 6,4 m de long, béton peint
  en(-21, -9, () => {
    c.pave(G.x0, -0.4, G.z0 - 0.4, G.x1, 0.0, G.z1, T(0x8f8b82), M.mat(), { crasse: false });
    c.pave(G.x0 - 0.02, 0.1, G.z0, G.x0, 0.14, G.z1, T(0x3fbf6a), M.mat(), { crasse: false }); // bande de guidage au sol
  });
  murTeinte(k, [G.x0 - 0.2, G.z1], [G.x0 - 0.2, G.z0], SECTION + 0.02, 0.4, 0xc4bfb2);
  murTeinte(k, [G.x1 + 0.2, G.z1], [G.x1 + 0.2, G.z0], SECTION + 0.02, 0.4, 0xc4bfb2);
  // Un dévidoir d'incendie dans la galerie, une pancarte
  en(-21, -8, () => {
    c.boite(0.12, 0.7, 0.7, T(0xb33a2c), { x: G.x1 - 0.06, y: 1.3, z: -8.2 }, M.satin());
    cylX(c, M.satin(), T(0xc8362b), G.x1 - 0.32, G.x1 - 0.12, 1.3, -8.2, 0.28, 10);
  });
  panneau(c, "abri", G.x0 + 0.03, 1.6, -9.6, 1.6, 0.8, PI / 2);

  // L'abri : 16 × 7,6 m, murs peints en crème jusqu'à la tranche
  en(-20, -16, () => c.pave(A.x0, -0.4, A.z0, A.x1, 0.0, A.z1, T(0x8a8478), M.mat(), { crasse: false }));
  // Le sol de l'abri, en dalles : quelques nuances, teintées par le feu
  for (let x = A.x0; x < A.x1 - 0.01; x += 2) for (let z = A.z0; z < A.z1 - 0.01; z += 1.9) {
    if (c.hasard() < 0.5) c.boite(1.96, 0.01, 1.86, T(c.hasard() < 0.5 ? 0x9a9488 : 0x857f74, x + 1, z + 0.95), { x: x + 1, y: 0.006, z: z + 0.95 }, M.mat(), { crasse: false });
  }
  const crem = 0xd8d0bc;
  murTeinte(k, [A.x0 - 0.2, A.z0 - 0.2], [A.x1 + 0.2, A.z0 - 0.2], SECTION + 0.02, 0.4, crem); // nord
  murTeinte(k, [A.x0 - 0.2, A.z0], [A.x0 - 0.2, A.z1], SECTION + 0.02, 0.4, crem); // ouest
  murTeinte(k, [A.x1 + 0.2, A.z0], [A.x1 + 0.2, A.z1], SECTION + 0.02, 0.4, crem); // est
  murTeinte(k, [A.x0 - 0.4, A.z1 + 0.2], [A.x1 + 0.4, A.z1 + 0.2], SECTION + 0.02, 0.4, crem, [{ u: -21 - (A.x0 - 0.4), l: 1.2, haut: 2.1 }]); // sud, porte du sas
  // Plinthe verte peinte, tout autour (lisibilité de la pièce)
  for (const [x1, z1, x2, z2] of [[A.x0, A.z0 + 0.01, A.x1, A.z0 + 0.03], [A.x0 + 0.01, A.z0, A.x0 + 0.03, A.z1]]) en((x1 + x2) / 2, (z1 + z2) / 2, () => c.pave(x1, 0, z1, x2, 0.9, z2, T(0x5f8a6a), M.mat(), { crasse: false }));
  // La porte du sas : vantail gris, grand ouvert vers l'intérieur
  en(-21, -12.6, () => {
    c.repere({ x: -21.6, y: 0, z: -12.4, ry: -1.35 }, () => c.boite(1.15, 2.06, 0.1, T(0x6a7072), { x: 0.58, y: 1.03 }, M.tole()));
    c.boite(0.6, 0.6, 0.06, T(0x9aa0a2), { x: -19.6, y: 1.5, z: -12.0 }, M.metal()); // manomètre de surpression
    cylX(c, M.metal(), T(0xe8e4d8), -19.62, -19.58, 1.5, -11.96, 0.16, 10);
  });

  // Les bancs, le long des murs nord et ouest
  O.banc(c, -21.5, -19.55, 0, 11);
  O.banc(c, -27.55, -16.2, PI / 2, 6.4);
  // Les couvertures : pliées sur les bancs, dépliées au sol autour du feu
  const tons = [0x7a2f2a, 0x4a5a7a, 0x8a7a4a, 0x5a6a4a, 0x9a8a7a];
  for (let i = 0; i < 9; i++) O.couverture(c, -26.5 + i * 1.25, 0.48, -19.5, c.entre(-0.2, 0.2), tons[i % 5], true);
  for (let i = 0; i < 3; i++) O.couverture(c, -27.5, 0.56 + i * 0.08, -13.4, 0.1 * i, tons[(i + 2) % 5], true);
  O.couverture(c, -18.6, 0, -16.6, 0.5, 0x4a5a7a, false);
  O.couverture(c, -15.2, 0, -14.4, -0.3, 0x7a2f2a, false);
  O.couverture(c, -13.2, 0, -18.6, 1.4, 0x8a7a4a, false);
  // Un sac de couchage, un oreiller de sac
  en(-18.4, -18.4, () => {
    c.boite(1.9, 0.12, 0.7, T(0x3a5a6a), { x: -18.4, y: 0.06, z: -18.4, ry: 0.2 }, M.mat(), { crasse: false });
    c.boite(0.5, 0.18, 0.4, T(0x6a6a5a), { x: -19.3, y: 0.09, z: -18.6, ry: 0.2 }, M.mat(), { crasse: false });
  });
  // L'eau : cuve de 1 000 L en cage, packs, jerricans
  en(-13.4, -14, () => {
    c.boite(1.0, 1.1, 1.2, T(0xd8d4c8), { x: -13.4, y: 0.7, z: -14.2 }, M.lisse());
    for (const [dx, dz] of [[-0.52, -0.62], [0.52, -0.62], [-0.52, 0.62], [0.52, 0.62]]) c.boite(0.04, 1.3, 0.04, T(0x8a8e90), { x: -13.4 + dx, y: 0.65, z: -14.2 + dz }, M.metal());
    for (let y = 0.3; y < 1.4; y += 0.5) c.boite(1.08, 0.03, 1.28, T(0x8a8e90), { x: -13.4, y, z: -14.2 }, M.metal(), { crasse: false });
    c.boite(1.1, 0.12, 1.3, T(0x5a5e60), { x: -13.4, y: 0.06, z: -14.2 }, M.tole());
    cylX(c, M.satin(), T(0x2a2c2d), -12.9, -12.75, 0.35, -14.2, 0.06, 6);
  });
  // L'étagère des réserves (packs d'eau), contre le mur est
  en(-12.5, -17.4, () => {
    for (const y of [0, 0.6, 1.2]) c.boite(0.5, 0.04, 2.0, T(0x8a8e90), { x: -12.35, y: y + 0.3, z: -17.6 }, M.metal());
    for (const dz of [-0.95, 0.95]) for (const dx of [-0.22, 0.22]) c.boite(0.04, 1.6, 0.04, T(0x6a6e70), { x: -12.35 + dx, y: 0.8, z: -17.6 + dz }, M.metal());
    for (let i = 0; i < 7; i++) if (c.hasard() < 0.7) O.packEau(c, -12.35, 0.32 + (i % 3) * 0.6, -18.3 + Math.floor(i / 3) * 0.6);
  });
  O.jerrican(c, -14.2, -12.9, 0.3, 0x4f6f3a);
  O.jerrican(c, -14.7, -12.95, -0.2, 0x8a3a2a);
  // L'armoire de secours, au mur nord
  en(-15, -19.8, () => {
    c.boite(0.8, 0.9, 0.3, T(0xe8e4d8), { x: -14.4, y: 1.5, z: -19.82 }, M.satin());
    c.boite(0.16, 0.5, 0.02, T(0x3fa05a), { x: -14.4, y: 1.5, z: -19.66 }, M.satin(), { crasse: false });
    c.boite(0.5, 0.16, 0.02, T(0x3fa05a), { x: -14.4, y: 1.5, z: -19.66 }, M.satin(), { crasse: false });
  });
  // La table pliante : radio, cartes, une bougie éteinte
  en(-24.6, -15.4, () => {
    c.boite(1.6, 0.04, 0.8, T(0xc9c4b8), { x: -24.6, y: 0.74, z: -15.4, ry: 0.15 }, M.satin());
    for (const [dx, dz] of [[-0.7, -0.3], [0.7, -0.3], [-0.7, 0.3], [0.7, 0.3]]) c.boite(0.03, 0.72, 0.03, T(0x6a6e70), { x: -24.6 + dx, y: 0.36, z: -15.4 + dz }, M.metal());
    c.boite(0.36, 0.2, 0.14, T(0x2a2c2d), { x: -24.3, y: 0.86, z: -15.5 }, M.satin());
    c.boite(0.6, 0.01, 0.45, T(0xe8e2cc), { x: -24.9, y: 0.765, z: -15.3, ry: 0.4 }, M.mat(), { crasse: false });
    for (const sx of [-1, 1]) c.boite(0.4, 0.45, 0.4, T(0x6a5a4a), { x: -24.6 + sx * 0.4, y: 0.22, z: -14.6 }, M.mat());
  });
  // Le feu des survivants, sous la grille de ventilation (le tuyau monte dans la roche)
  O.feuDeCamp(c, FEU.x, FEU.z);
  en(FEU.x, FEU.z - 1, () => {
    c.boite(1.2, 0.5, 0.6, T(0x6a6e70), { x: FEU.x, y: 2.1, z: A.z0 + 0.32 }, M.tole());
    c.boite(1.0, 0.36, 0.02, T(0x1a1b1c), { x: FEU.x, y: 2.1, z: A.z0 + 0.63 }, M.metal());
  });
  // Les graffitis : la consigne, les jours comptés, la pancarte de l'abri
  panneau(c, "grafPorte", -21.5, 1.95, A.z0 + 0.03, 6.4, 0.68);
  panneau(c, "traits", -25.8, 1.25, A.z0 + 0.03, 1.5, 0.84);
  panneau(c, "abri", -17.6, 1.7, A.z0 + 0.03, 1.5, 0.75);
  // Bois de chauffe empilé, des boîtes de conserve vides
  en(-13.2, -19.4, () => {
    for (let i = 0; i < 10; i++) c.boite(0.8, 0.13, 0.13, T(0x6a4a30), { x: -12.9 + c.entre(-0.3, 0.3), y: 0.08 + Math.floor(i / 3) * 0.13, z: -19.4 + (i % 3) * 0.14, ry: c.entre(-0.1, 0.1) }, M.mat(), { nuance: 0.1 });
  });
  for (let i = 0; i < 7; i++) en(-17, -15.8, () => cylY(c, M.metal(), T(0xb8bcbe, -17 + i * 0.2, -16), -16.8 + c.entre(-1, 1), -15.6 + c.entre(-0.8, 0.8), 0, 0.11, 0.04, 0.04, 6));
  k.b.lumiere(FEU.x, 0.6, FEU.z, 0xff8a3a, 9, 9, "feu de survivants (abri pressurisé)");
}

// ---------- Le contenu du tunnel ----------

function contenuTunnelOuest(k) {
  const { c } = k;
  if (k.ici(-44.5)) O.voiture(c, -44.5, -1.8, 0.05, 0x6a7a8a, { porte: true });
  // La voiture incendiée : carcasse, sol brûlé, débris fondus
  if (k.ici(-31)) {
    O.voiture(c, -31, 1.6, 0.15, 0, { brule: true });
    for (let i = 0; i < 9; i++) c.boite(c.entre(1, 2.4), 0.012, c.entre(0.8, 2), 0x0d0c0b, { x: -31 + c.entre(-3, 3), y: 0.014 + i * 0.001, z: 1.4 + c.entre(-2.2, 2.2), ry: c.hasard() * 3 }, M.mat(), { crasse: false });
    debris(c, -35, -1, -27, 4.4, 26, [0x1a1816, 0x2c2622, 0x3a2a22]);
    c.boite(1.4, 0.02, 2.6, 0x0b0a09, { x: -31, y: 1.3, z: -4.99 }, M.mat(), { crasse: false });
  }
  if (k.ici(-24)) O.voiture(c, -24, 2.0, -0.2, 0xb8b2a0, { coffre: true });
  if (k.ici(-6)) O.voiture(c, -6.2, 2.3, 0.4, 0x7a2f2a, { capot: true, pneusCreves: true });
  // Les accélérateurs : la paire de l'ouest, et celui qui est tombé
  if (k.ici(-43)) {
    O.ventilateur(c, -43, 5.55, -2.6);
    if (k.sud) O.ventilateur(k.sud, -43, 5.55, 2.6);
  }
  if (k.ici(-9)) {
    O.ventilateur(c, -9, 0.6, -1.6, { tombe: true, ry: 0.32, rz: 0.08 });
    if (k.sud) O.ventilateur(k.sud, -9, 5.55, 2.6);
    // Les attaches arrachées et les câbles qui pendent de la voûte
    en(-9, -2.6, () => {
      for (const dx of [-1.3, 0.7]) c.boite(0.03, c.entre(2.2, 3.4), 0.03, T(0x1d1e1f), { x: -9 + dx, y: 5.2, z: -2.7, rz: c.entre(-0.2, 0.2) }, M.mat(), { crasse: false });
      c.boite(0.6, 0.08, 0.8, T(0x55595a), { x: -8.2, y: 0.05, z: -0.4, ry: 0.6 }, M.tole());
    });
    gravats(c, -10.5, -3.2, 1.2, 10, [T(0x8a867c, -10, -3), T(0x6a665e, -10, -3)]);
  }
  if (k.ici(-38)) gravats(c, -38.5, 3.2, 0.7, 5, [T(0x8a867c, -38, 3), T(0x6a665e, -38, 3)]);
  // Valises et sacs abandonnés sur le trottoir nord (une fuite à pied)
  en(-27, -4.4, () => {
    c.boite(0.5, 0.7, 0.25, T(0x3a4a6a), { x: -26.4, y: 0.5, z: -4.5, rz: 1.4 }, M.satin());
    c.boite(0.45, 0.3, 0.3, T(0x6a3a2a), { x: -27.5, y: 0.3, z: -4.6, ry: 0.4 }, M.mat());
  });
  for (const x of [-35, -16]) if (k.ici(x)) O.sacADos(c, x, -4.4, c.hasard() * 3, 0x4a3a2a);
  // Le graffiti de la galerie et un « ALLUMEZ VOS FEUX » rouillé tombé
  if (k.ici(-47)) en(-47, 4, () => panneau(c, "allumez", -47.4, 0.06, 4.2, 1.6, 0.6, 0.2, -PI / 2));
}

function contenuTunnelEst(k) {
  const { c } = k;
  // Le camion bâché, dans la voie nord (la bâche s'efface)
  if (k.ici(10)) {
    const bache = k.b.couche("bache-camion", { x: 9, z: -1.9, l: 12, p: 3 }, 1.8, 3.9);
    O.camion(c, bache, 10.4, -1.95, 0.03, {});
    k.b.obstacle(3, -3.2, 17.6, -3.0, "camion");
    k.b.obstacle(3, -0.7, 17.6, -0.5, "camion");
  }
  // L'éboulement : la voûte sud s'est effondrée, la roche a coulé jusqu'au milieu de la chaussée
  if (k.ici(EBOULEMENT.x)) eboulement(k);
  // La lampe frontale tombée, le sac, le pied-de-biche ; au-dessus, le graffiti
  if (k.ici(LAMPE.x)) {
    O.lampeFrontale(c, LAMPE.x, LAMPE.z, LAMPE.angle);
    O.sacADos(c, LAMPE.x - 0.9, LAMPE.z - 0.9, 0.7, 0x5a6a3a);
    en(LAMPE.x, LAMPE.z, () => c.boite(0.75, 0.03, 0.03, T(0x6a6e70), { x: LAMPE.x - 0.4, y: 0.02, z: LAMPE.z + 0.6, ry: 1.1 }, M.metal()));
    panneau(c, "grafLumiere", 36, 1.75, -4.965, 5.4, 0.8);
    k.b.lumiere(LAMPE.x + 0.1, 0.25, LAMPE.z, 0xe6f0ff, 3.5, 6, "lampe frontale tombée (le faisceau au sol)");
  }
  if (k.ici(41.5)) O.voiture(c, 41.5, 2.1, -0.12, 0x3a5a4a, { porte: true });
  if (k.ici(47)) O.voiture(c, 47, -2.2, 0.22, 0xa8a49a, { coffre: true, pneusCreves: true });
  if (k.ici(23)) {
    O.ventilateur(c, 23, 5.55, -2.6);
    if (k.sud) O.ventilateur(k.sud, 23, 5.55, 2.6);
  }
  if (k.ici(43)) {
    O.ventilateur(c, 43, 5.55, -2.6);
    if (k.sud) O.ventilateur(k.sud, 43, 5.55, 2.6);
  }
  // Une moto couchée, une chaussure, des papiers
  en(2.5, 3.6, () => {
    c.boite(1.9, 0.35, 0.3, T(0x2a2c2e), { x: 2.5, y: 0.2, z: 3.4, ry: 0.4 }, M.satin());
    for (const dx of [-0.75, 0.75]) c.poser(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8), M.mat(), T(0x1a1a1a), { x: 2.5 + dx * Math.cos(0.4), y: 0.06, z: 3.4 - dx * Math.sin(0.4) });
  });
}

function eboulement(k) {
  const { c } = k;
  const E = EBOULEMENT;
  const t = (h, x, z) => T(h, x, z);
  // Le cône de roche et de béton : du mur sud (haut) au milieu de la chaussée (bas)
  for (let i = 0; i < 70; i++) {
    const x = c.entre(E.x0 - 0.5, E.x1 + 0.5);
    const zmax = 5 - 5.6 * Math.max(0, 1 - Math.abs(x - E.x) / 4.6);
    const z = c.entre(Math.max(-0.6, zmax), 5.2);
    const h = Math.max(0.2, (z - zmax + 0.5) * 0.55) * (1 - Math.abs(x - E.x) / 6);
    const s = c.entre(0.3, 0.9) * (0.6 + h * 0.3);
    c.poser(O.CAILLOU, M.mat(), t(c.hasard() < 0.6 ? 0x7a766e : 0x5e5a54, x, z), { x, y: h * c.entre(0.4, 1), z, rx: c.hasard() * 3, ry: c.hasard() * 3, e: [s * 1.6, s * 1.2, s * 1.4] }, { nuance: 0.08 });
  }
  // Les morceaux de voûte : des voussoirs de béton, plantés en biais, et leur ferraillage tordu
  for (let i = 0; i < 9; i++) {
    const x = E.x + c.entre(-3.6, 3.6);
    const z = c.entre(1.4, 4.4);
    c.boite(c.entre(1.4, 2.4), 0.5, c.entre(1.2, 2.0), t(0xa9a59c, x, z), { x, y: c.entre(0.7, 1.9), z, rx: c.entre(-0.8, 0.8), ry: c.hasard() * 3, rz: c.entre(-0.6, 0.6) }, M.beton());
    for (let j = 0; j < 3; j++) c.boite(0.025, c.entre(0.8, 1.6), 0.025, t(0x6a3a22, x, z), { x: x + c.entre(-0.6, 0.6), y: 1.6 + c.entre(0, 0.6), z: z + c.entre(-0.4, 0.4), rx: c.entre(-0.9, 0.9), rz: c.entre(-0.9, 0.9) }, M.tole(), { crasse: false });
  }
  // La voiture écrasée dessous (il n'en dépasse que l'arrière)
  c.repere({ x: E.x + 2.6, z: 1.6, e: [1, 0.55, 1] }, () => O.voiture(c, 0, 0, 0.3, 0x4a6a8a, { pneusCreves: true }));
  // La poussière fine autour, et les gravats qui ont roulé dans la voie nord
  debris(c, E.x0 - 2, -2.4, E.x1 + 2, 1, 40, [t(0x8a867c, E.x, -1), t(0x6a665e, E.x, -1), t(0x9a958a, E.x, -1)]);
  gravats(c, E.x - 1.5, -1.2, 0.7, 6, [t(0x7a766e, E.x, -1), t(0x5e5a54, E.x, -1)]);
  // Obstacle : le pied de l'éboulement (il reste le trottoir nord et la voie nord)
  const pts = [[E.x0 - 0.8, 5], [E.x0 + 0.6, 1.8], [E.x - 1.2, -0.4], [E.x + 1.4, -0.6], [E.x1 - 0.4, 1.6], [E.x1 + 0.8, 5]];
  for (let i = 0; i < pts.length - 1; i++) k.b.obstacle(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], "éboulement");
  // La roche visible dans le trou de la voûte sud (couche)
  if (k.sud) for (let i = 0; i < 14; i++) k.sud.poser(O.CAILLOU, M.mat(), 0x6a665f, { x: E.x + c.entre(-3.5, 3.5), y: c.entre(4, 7.5), z: c.entre(2.5, 5.5), rx: c.hasard() * 3, ry: c.hasard() * 3, e: c.entre(1.2, 2.4) }, { nuance: 0.08 });
}

// ---------- Tronçon 1 : la montée, le péage, le PC, le chalet des agents, l'aire de chaînage ----------

function montee(k) {
  const { c, b, u } = k;
  route(k, -100, -52);
  // La route basse du lacet (7 m plus bas, vers le sud)
  for (let x = -100; x < -66; x += 2) {
    const z1 = zBasse(x);
    const z2 = zBasse(x + 2);
    if ((z1 + z2) / 2 > 34) continue;
    const ry = -Math.atan2(z2 - z1, 2);
    c.repere({ x: x + 1, y: -7, z: (z1 + z2) / 2, ry }, () => {
      c.boite(Math.hypot(2, z2 - z1) + 0.04, 0.3, 6.6, 0x5c5b57, { y: -0.12 }, M.mat(), { crasse: false, nuance: 0.03 });
      c.boite(Math.hypot(2, z2 - z1), 0.012, 0.12, 0xd8d4c8, { y: 0.035, z: -2.9 }, M.mat(), { crasse: false });
      if (Math.round(x / 2) % 3 === 0) c.boite(1.6, 0.012, 0.12, 0xd8d4c8, { y: 0.035 }, M.mat(), { crasse: false });
    });
  }
  O.glissiere(c, [[-100, 26.2], [-90, 26.2], [-80, 26.6], [-74, 27.6], [-70, 29.6]], -7);
  O.voiture(c, -84, 30.8, PI + 0.06, 0x8a8478, { pneusCreves: true });
  // La glissière du haut, au bord du ravin (ouverte devant l'aire de chaînage)
  const bord = [];
  for (let x = -100; x <= -60; x += 4) bord.push([x, Math.min(20.2 + Math.sin(x * 0.3 + 0.5), 19.8)]);
  O.glissiere(c, bord, 0);
  for (let i = 0; i < bord.length - 1; i++) b.obstacle(bord[i][0], bord[i][1] + 0.3, bord[i + 1][0], bord[i + 1][1] + 0.3, "ravin (glissière)");

  // L'aire de chaînage : enrobé, places peintes, panneaux, bac à chaînes
  c.pave(-98, -0.3, 8, -80, 0.025, 19.5, 0x5e5d59, M.mat(), { crasse: false, nuance: 0.03 });
  for (let x = -97; x <= -81; x += 3.2) c.boite(0.12, 0.012, 4.8, 0xd8d4c8, { x, y: 0.031, z: 16.8 }, M.mat(), { crasse: false });
  c.boite(16, 0.012, 0.12, 0xd8d4c8, { x: -89, y: 0.031, z: 14.4 }, M.mat(), { crasse: false });
  for (const x of [-97, -82]) c.boite(0.1, 2.6, 0.1, 0x7a7f80, { x, y: 1.3, z: 9.4 }, M.tole());
  // (le panneau « Aire de chaînage » entre deux poteaux, face au sud)
  panneau(c, "aire", -89.5, 2.2, 9.45, 4.8, 1.2);
  c.boite(15.2, 0.08, 0.08, 0x7a7f80, { x: -89.5, y: 2.86, z: 9.4 }, M.tole());
  c.boite(0.09, 2.4, 0.09, 0x7a7f80, { x: -80.2, y: 1.2, z: 9.0 }, M.tole());
  panneau(c, "chaines", -80.2, 2.1, 9.06, 0.8, 0.8);
  en(-95.8, 10.6, () => {
    c.boite(1.3, 0.9, 0.8, 0x4a6a4a, { x: -95.8, y: 0.45, z: 10.6 }, M.tole());
    c.repere({ x: -95.8, y: 0.9, z: 10.2 }, () => c.boite(1.3, 0.04, 0.8, 0x4a6a4a, { y: 0.3, z: -0.1, rx: -1.1 }, M.tole()));
  });
  // Chaînes à neige au sol (anneaux)
  for (let i = 0; i < 6; i++) c.poser(new THREE.TorusGeometry(0.32, 0.03, 3, 10), M.metal(), 0x8a8e90, { x: -94 + c.entre(-1.5, 1.5), y: 0.04, z: 12 + c.entre(-1, 1), rx: PI / 2 + c.entre(-0.2, 0.2) }, { crasse: false });
  O.voiture(c, -93, 13.2, 0.08, 0x9a8a6a, { porte: true, coffre: true });
  // Le camping-car, porte ouverte
  en(-86.2, 15.6, () => {
    c.repere({ x: -86.2, z: 15.6, ry: 0.05 }, () => {
      c.boite(6.4, 2.6, 2.3, 0xe2ddd0, { y: 1.75 }, M.satin(), { nuance: 0.02 });
      c.boite(1.4, 0.7, 2.3, 0xe2ddd0, { x: 2.3, y: 3.3, rz: -0.1 }, M.satin());
      c.boite(6.42, 0.18, 2.32, 0x4a7a8a, { y: 1.2 }, M.satin(), { crasse: false });
      c.boite(0.05, 0.8, 2.0, 0xffffff, { x: 3.21, y: 2.0 }, M.verre(), { crasse: false });
      for (const sx of [-2.0, 0.4]) c.boite(1.0, 0.6, 0.04, 0xffffff, { x: sx, y: 2.2, z: 1.16 }, M.verre(), { crasse: false });
      c.boite(6.3, 0.3, 2.3, 0x2c2e30, { y: 0.48 }, M.mat());
      for (const [wx, wz] of [[2.2, 1.05], [2.2, -1.05], [-1.8, 1.05], [-1.8, -1.05]]) c.poser(new THREE.CylinderGeometry(0.38, 0.38, 0.26, 8), M.mat(), 0x242322, { x: wx, y: 0.3, z: wz, rx: PI / 2 });
      c.repere({ x: -0.6, y: 0.5, z: 1.16, ry: -1.3 }, () => c.boite(0.7, 1.9, 0.05, 0xe2ddd0, { x: -0.35, y: 1.0 }, M.satin()));
      c.boite(1.4, 0.06, 2.3, 0x3a5a6a, { x: -1.2, y: 3.08 }, M.lisse()); // panneau solaire (mort)
    });
  });
  b.obstacle(-89.4, 14.4, -83, 14.8, "camping-car");
  b.obstacle(-89.4, 16.8, -83, 17.1, "camping-car");

  // Le péage : îlots, cabines, barrières, la borne « paiement par sourire », l'auvent (couche)
  for (const s of [-1, 1]) {
    O.cabinePeage(c, -72, s * 3.6, u);
    O.barriere(c, -68.9, s * 3.6, s * PI / 2, s < 0 ? "cassee" : "levee");
    // La borne : un fût de tôle, l'écran souriant (face au sud)
    en(-74.6, s * 3.6, () => {
      c.boite(0.6, 1.7, 0.42, 0xd8d2c4, { x: -74.6, y: 1.03, z: s * 3.6 + 0.3 }, M.satin());
      c.boite(0.62, 0.12, 0.44, 0xc79a3b, { x: -74.6, y: 1.9, z: s * 3.6 + 0.3 }, M.satin());
      panneau(c, "sourire", -74.6, 1.3, s * 3.6 + 0.515, 0.55, 0.55);
    });
    b.obstacle(-75.5, s * 3.6 - 0.7, -68.5, s * 3.6 - 0.7, "îlot de péage");
    b.obstacle(-75.5, s * 3.6 + 0.7, -68.5, s * 3.6 + 0.7, "îlot de péage");
  }
  k.b.lumiere(-74.6, 1.3, 4.6, 0xe8c547, 2.2, 4, "écran de la borne « paiement par sourire » (il luit encore)");
  const auvent = b.couche("auvent-peage", { x: -72, z: 0, l: 11, p: 17 }, 4.8, 6.4);
  auvent.pave(-77.5, 5.2, -8.4, -66.5, 5.75, 8.4, 0xe2ddd0, M.tole(), { crasse: false, nuance: 0.02 });
  auvent.pave(-77.6, 5.0, 8.3, -66.4, 5.9, 8.45, 0x2f6f73, M.tole(), { crasse: false });
  auvent.pave(-77.6, 5.0, -8.45, -66.4, 5.9, -8.3, 0x2f6f73, M.tole(), { crasse: false });
  panneau(auvent, "peage", -72, 5.45, 8.48, 9.6, 1.0);
  // Les poteaux de l'auvent, sur les îlots
  for (const s of [-1, 1]) for (const x of [-75.2, -68.8]) cylY(c, M.tole(), 0xc9c4b8, x, s * 3.6, 0.18, 5.2, 0.16, 0.16, 8);
  // Un pan de l'auvent arraché, tombé sur la place
  if (u > 0.4) c.boite(3.2, 0.06, 2.4, 0xe2ddd0, { x: -64.8, y: 0.3, z: 5.6, rz: 0.12, ry: 0.4 }, M.tole());

  // Le grand panneau de l'Abondance, sur deux poteaux, au nord de la route
  for (const x of [-66.6, -62.6]) c.boite(0.14, 3.4, 0.14, 0x6a6e70, { x, y: 1.7, z: -7.6 }, M.tole());
  c.boite(4.5, 1.8, 0.1, 0x3a3d3e, { x: -64.6, y: 2.6, z: -7.62 }, M.tole());
  panneau(c, "intelligent", -64.6, 2.6, -7.55, 4.4, 1.65);
  // Le portique : feux d'affectation (croix rouges éteintes), gabarit 4,3 m
  const XP = -59.5;
  for (const sz of [-6.1, 6.1]) c.boite(0.25, 6.0, 0.25, 0x6a6e70, { x: XP, y: 3.0, z: sz }, M.tole());
  c.boite(0.5, 0.5, 12.6, 0x6a6e70, { x: XP, y: 5.85, z: 0 }, M.tole());
  for (const sz of [-1.9, 1.9]) {
    c.boite(0.3, 0.75, 0.9, 0x2a2c2d, { x: XP - 0.25, y: 5.2, z: sz }, M.satin());
    panneau(c, sz < 0 ? "feuRouge" : "feuVert", XP - 0.41, 5.2, sz, 0.8, 0.46, -PI / 2);
  }
  panneau(c, "hauteur", XP - 0.28, 5.85, 4.6, 0.8, 0.8, -PI / 2);
  panneau(c, "hauteur", XP + 0.28, 5.85, -4.6, 0.8, 0.8, PI / 2);

  // Le PC de sécurité
  pcSecurite(k);
  // Le chalet des agents
  chaletAgents(k);
  // Le panneau de direction (à l'entrée A)
  panneauRoute(c, -95, 0.4, "dirOuest");
  // Le lampadaire mort du parking et un cône
  cylY(c, M.tole(), 0x6a6e70, -81, 18.9, 0, 6, 0.08, 0.06, 6);
  c.boite(1.2, 0.12, 0.3, 0x6a6e70, { x: -81.5, y: 6, z: 18.9 }, M.tole());
  // La nature : rochers au pied des falaises, sapins sur les hauteurs et dans le ravin
  nature(k, -100, -50);
  // Le portail ouest et sa tranchée
  tete(k, -1);
  // Les lumières de nuit : la borne (plus haut), la lanterne du chalet ; le reste est dans le noir
}

function panneauRoute(c, x, z, region) {
  for (const dx of [-1.2, 1.2]) c.boite(0.1, 2.6, 0.1, 0x7a7f80, { x: x + dx, y: 1.3, z }, M.tole());
  c.boite(3.6, 1.06, 0.05, 0x8a8e90, { x, y: 2.1, z: z - 0.03 }, M.tole());
  panneau(c, region, x, 2.1, z + 0.005, 3.6, 1.05);
}

function pcSecurite(k) {
  const { c, b, u } = k;
  const X0 = -84, X1 = -72, Z0 = -17, Z1 = -10, H = 3.0;
  c.pave(X0, -0.2, Z0, X1, 0.04, Z1, 0x9a968c, M.mat(), { crasse: false });
  const bris = 0.3 + u * 0.6;
  const spec = { h: H, ep: 0.3, couleur: 0xd8d2c4, mat: M.beton(), batiment: b, interieur: { couleur: 0xe2ddd0, mat: M.mat() } };
  // (sens des murs : l'extérieur est à droite en marchant, voir mur() : +z local = dehors)
  mur(c, [X0, Z1], [X1, Z1], { ...spec, ouvertures: [{ u: 2.6, l: 3.2, bas: 0.9, haut: 2.4, type: "fenetre", bris, cadre: 0x6a6e70, croisillons: 2 }, { u: 5.8, l: 1.1, bas: 0, haut: 2.15, type: "porte", vantail: "entrouvert", couleurPorte: 0x6a7a8a }, { u: 9.6, l: 2.0, bas: 0.9, haut: 2.4, type: "fenetre", bris, cadre: 0x6a6e70, croisillons: 1 }] });
  mur(c, [X1, Z0], [X0, Z0], { ...spec });
  mur(c, [X0, Z0], [X0, Z1], { ...spec, ouvertures: [{ u: 3.5, l: 1.6, bas: 1.0, haut: 2.3, type: "fenetre", bris, cadre: 0x6a6e70 }] });
  mur(c, [X1, Z1], [X1, Z0], { ...spec, ouvertures: [{ u: 3.5, l: 1.4, bas: 1.0, haut: 2.3, type: "fenetre", bris, cadre: 0x6a6e70 }] });
  // La cloison : salle de contrôle (ouest) et vestiaire (est)
  mur(c, [-77, Z0], [-77, Z1], { h: H, ep: 0.15, couleur: 0xe2ddd0, batiment: b, ouvertures: [{ u: 4.8, l: 0.9, bas: 0, haut: 2.1, type: "porte" }] });
  panneau(c, "pc", -80.4, 2.72, Z1 + 0.17, 1.8, 0.5);
  // Le pupitre de contrôle et le mur d'écrans (au nord, face au sud)
  c.boite(5.2, 0.85, 0.9, 0x5a6064, { x: -81, y: 0.43, z: -15.9 }, M.satin());
  c.boite(5.3, 0.05, 1.0, 0xd8d2c4, { x: -81, y: 0.88, z: -15.9 }, M.satin());
  c.boite(3.4, 1.6, 0.1, 0x24282a, { x: -81, y: 1.9, z: -16.75 }, M.satin());
  panneau(c, "ecrans", -81, 1.9, -16.69, 3.2, 1.5);
  for (const dx of [-1.8, 0, 1.6]) {
    c.boite(0.5, 0.06, 0.5, 0x2a2c2e, { x: -81 + dx, y: 0.5, z: -14.9 }, M.satin());
    c.boite(0.5, 0.55, 0.06, 0x2a2c2e, { x: -81 + dx, y: 0.85, z: -14.62, rx: 0.15 }, M.satin());
    cylY(c, M.metal(), 0x6a6e70, -81 + dx, -14.9, 0, 0.47, 0.03, 0.03, 5);
  }
  c.boite(0.5, 0.06, 0.5, 0x2a2c2e, { x: -79, y: 0.25, z: -13, rx: 1.4, ry: 0.6 }, M.satin()); // fauteuil renversé
  // L'armoire, le plan du tunnel au mur ouest
  c.boite(0.5, 1.9, 1.0, 0x8a8e90, { x: -83.55, y: 0.95, z: -15.6 }, M.tole());
  c.boite(0.02, 1.0, 1.8, 0xe8e2cc, { x: -83.83, y: 1.7, z: -12.6 }, M.mat(), { crasse: false });
  c.boite(0.02, 0.1, 1.6, 0x2a2c2d, { x: -83.82, y: 1.7, z: -12.6 }, M.mat(), { crasse: false });
  debris(c, -83.5, -16.5, -77.5, -10.5, 18, [0xe8e2cc, 0xd8d2c4, 0x9a968c]);
  // Le vestiaire : casiers, banc, lit de camp, machine à café « connectée »
  for (let i = 0; i < 4; i++) {
    const ouvert = i === 1 || i === 3;
    c.boite(0.6, 1.9, 0.5, 0x5a7a8a, { x: -76.1 + i * 0.62, y: 0.95, z: -16.5 }, M.tole(), { nuance: 0.05 });
    if (ouvert) c.repere({ x: -76.4 + i * 0.62, y: 0.95, z: -16.24, ry: -1.4 }, () => c.boite(0.58, 1.8, 0.03, 0x5a7a8a, { x: 0.29 }, M.tole()));
  }
  O.banc(c, -75, -14.8, 0, 2.4);
  c.boite(0.8, 0.35, 1.9, 0x4a5a3a, { x: -72.9, y: 0.3, z: -12.4 }, M.mat());
  c.boite(0.4, 0.6, 0.4, 0x2a2c2e, { x: -72.6, y: 1.2, z: -16.6 }, M.satin());
  // Le toit plat (couche) : dalle, acrotère, antenne, climatiseur
  const toit = b.couche("toit-pc", { x: (X0 + X1) / 2, z: (Z0 + Z1) / 2, l: X1 - X0, p: Z1 - Z0 }, H, H + 2.2);
  toit.pave(X0 - 0.2, H, Z0 - 0.2, X1 + 0.2, H + 0.3, Z1 + 0.2, 0xc9c4b8, M.beton(), { crasse: false });
  for (const [x1, z1, x2, z2] of [[X0 - 0.2, Z0 - 0.2, X1 + 0.2, Z0 + 0.05], [X0 - 0.2, Z1 - 0.05, X1 + 0.2, Z1 + 0.2], [X0 - 0.2, Z0, X0 + 0.05, Z1], [X1 - 0.05, Z0, X1 + 0.2, Z1]]) toit.pave(x1, H + 0.3, z1, x2, H + 0.65, z2, 0xd8d2c4, M.beton(), { crasse: false });
  toit.boite(1.2, 0.8, 0.8, 0x9aa0a2, { x: -74, y: H + 0.7, z: -15 }, M.tole());
  toit.tube([-82, H + 0.3, -16], [-82, H + 5.5, -16], 0.05, 0x6a6e70, M.tole(), 5);
  toit.boite(0.6, 0.06, 0.06, 0x6a6e70, { x: -82, y: H + 5, z: -16 }, M.tole());
  if (u > 0.3) mousse(toit, -79, H + 0.31, -12, 2, 6);
  k.b.lumiere(-81, 1.9, -16.2, 0x9fd6e0, 1.6, 4, "l'écran « humeur du tunnel », sur batterie");
}

function chaletAgents(k) {
  const { c, b, u } = k;
  const X0 = -98, X1 = -88, Z0 = -19.5, Z1 = -12, H = 2.9;
  c.pave(X0 - 0.3, -0.3, Z0 - 0.3, X1 + 0.3, 0.05, Z1 + 0.3, 0x8a7a64, M.mat(), { crasse: false });
  // Soubassement de pierre et murs de planches
  const bris = 0.3 + u * 0.6;
  const spec = { h: H, ep: 0.32, couleur: 0x7a5a3c, mat: M.mat(), batiment: b, interieur: { couleur: 0x9a7a54, mat: M.mat() } };
  mur(c, [X0, Z1], [X1, Z1], { ...spec, ouvertures: [{ u: 2, l: 1.1, bas: 0.9, haut: 2.0, type: "fenetre", bris, cadre: 0xe2ddd0, volet: "ouvert", couleurVolet: 0x8a3a2a }, { u: 7, l: 1.0, bas: 0, haut: 2.1, type: "porte", vantail: "entrouvert", couleurPorte: 0x5a3a24 }, { u: 9, l: 1.0, bas: 0.9, haut: 2.0, type: "fenetre", bris, cadre: 0xe2ddd0, volet: "pendu", couleurVolet: 0x8a3a2a }] });
  mur(c, [X1, Z0], [X0, Z0], { ...spec });
  mur(c, [X0, Z0], [X0, Z1], { ...spec, ouvertures: [{ u: 3.7, l: 1.0, bas: 0.9, haut: 2.0, type: "fenetre", bris, cadre: 0xe2ddd0 }] });
  mur(c, [X1, Z1], [X1, Z0], { ...spec, ouvertures: [{ u: 3, l: 1.0, bas: 0.9, haut: 2.0, type: "fenetre", bris, cadre: 0xe2ddd0, volet: "ouvert", couleurVolet: 0x8a3a2a }] });
  mur(c, [-94, Z0], [-94, Z1], { h: H, ep: 0.15, couleur: 0x9a7a54, batiment: b, ouvertures: [{ u: 5.6, l: 0.9, bas: 0, haut: 2.05, type: "porte" }] });
  // Les planches (lignes) et le soubassement de pierre, côtés sud et est
  for (let y = 1.0; y < H; y += 0.32) {
    c.boite(X1 - X0 + 0.36, 0.035, 0.04, 0x5a4130, { x: (X0 + X1) / 2, y, z: Z1 + 0.18 }, M.mat(), { crasse: false });
    c.boite(0.04, 0.035, Z1 - Z0 + 0.36, 0x5a4130, { x: X1 + 0.18, y, z: (Z0 + Z1) / 2 }, M.mat(), { crasse: false });
  }
  c.boite(X1 - X0 + 0.4, 0.8, 0.06, 0x8f8a80, { x: (X0 + X1) / 2, y: 0.4, z: Z1 + 0.19 }, M.mat(), { nuance: 0.04 });
  c.boite(0.06, 0.8, Z1 - Z0 + 0.4, 0x8f8a80, { x: X1 + 0.19, y: 0.4, z: (Z0 + Z1) / 2 }, M.mat(), { nuance: 0.04 });
  // Les skis croisés et la luge au mur, le banc dehors, le bois empilé
  for (const s of [-1, 1]) c.boite(0.08, 1.8, 0.03, s < 0 ? 0xc8362b : 0x2f6f73, { x: -93.4, y: 1.6, z: Z1 + 0.22, rz: s * 0.3 }, M.satin());
  O.banc(c, -92.2, Z1 + 0.6, PI, 2.0);
  for (let i = 0; i < 24; i++) c.boite(0.45, 0.16, 0.16, 0x6a4a30, { x: X1 + 0.5, y: 0.1 + Math.floor(i / 6) * 0.17, z: -18.8 + (i % 6) * 0.17 + c.entre(-0.02, 0.02), ry: PI / 2 }, M.mat(), { nuance: 0.12 });
  // Dortoir (ouest) : lits superposés ; cuisine (est) : table, poêle, étagères
  for (const z of [-18.6, -16.2]) {
    for (const y of [0.4, 1.5]) {
      c.boite(1.95, 0.12, 0.9, 0x7a5a3c, { x: -96.4, y, z }, M.mat());
      c.boite(1.85, 0.12, 0.8, [0x6a7a5a, 0x7a6a5a, 0x5a6a7a][Math.floor(c.hasard() * 3)], { x: -96.4, y: y + 0.12, z }, M.mat(), { crasse: false });
    }
    for (const dx of [-0.95, 0.95]) for (const dz of [-0.42, 0.42]) c.boite(0.07, 1.9, 0.07, 0x5a4130, { x: -96.4 + dx, y: 0.95, z: z + dz }, M.mat());
  }
  O.couverture(c, -95.4, 0, -14.2, 0.4, 0x7a2f2a, false);
  O.tableBancs(c, -91.2, -15.2, 0, u > 0.6);
  c.boite(0.6, 0.8, 0.6, 0x2c2a28, { x: -88.7, y: 0.4, z: -18.6 }, M.metal());
  c.tube([-88.7, 0.8, -18.6], [-88.7, 2.9, -18.6], 0.07, 0x2c2a28, M.metal(), 6);
  for (const y of [1.2, 1.7]) c.boite(1.6, 0.04, 0.35, 0x7a5a3c, { x: -91.6, y, z: -19.1 }, M.mat());
  for (let i = 0; i < 5; i++) cylY(c, M.metal(), [0xb8bcbe, 0xc8362b, 0xd8b23a][i % 3], -92.2 + i * 0.3, -19.1, 1.22, 1.38, 0.05, 0.05, 6);
  panneau(c, "watty", -90.4, 1.7, Z0 + 0.18, 1.2, 0.68);
  // Le toit à deux pans (couche), pierres posées dessus
  const toit = b.couche("toit-chalet", { x: (X0 + X1) / 2, z: (Z0 + Z1) / 2, l: X1 - X0, p: Z1 - Z0 }, H, H + 2.6);
  toitDeuxPans(toit, (X0 + X1) / 2, (Z0 + Z1) / 2, X1 - X0, Z1 - Z0, H, 1.9, { couleur: 0x6a5a4a, mat: M.mat(), debord: 0.8, charpente: 0x5a4130, trous: u > 0.5 ? [{ u: -2, v: 1, l: 2.4, p: 0.5 }] : [] });
  for (let i = 0; i < 8; i++) toit.poser(O.CAILLOU, M.mat(), 0x8a857c, { x: c.entre(X0, X1), y: H + 1.0 + c.entre(0, 0.4), z: (Z0 + Z1) / 2 + (c.hasard() < 0.5 ? -1 : 1) * c.entre(1.4, 2.6), e: c.entre(0.3, 0.5) });
  toit.boite(0.6, 1.2, 0.6, 0x8f8a80, { x: -89.5, y: H + 2.0, z: -17 }, M.mat());
  k.b.lumiere(-91.2, 1.4, -15.4, 0xffc070, 4, 7, "lanterne à huile du chalet (des survivants passent la nuit ici)");
}

// ---------- Tronçon 4 : la tête est, le barrage des pillards, le pont, le relais des Marmottes ----------

function teteEst(k) {
  const { c, b, u } = k;
  tete(k, 1);
  route(k, 52, 71);
  route(k, 91, 100);
  barrage(k);
  pont(k);
  torrent(k);
  relais(k);
  panneauRoute(c, 96, -8.4, "dirEst");
  // « Allumez vos feux » (et la réponse à la bombe), pour qui entre par l'est
  c.boite(0.1, 2.5, 0.1, 0x7a7f80, { x: 64.2, y: 1.25, z: 6.4 }, M.tole());
  panneau(c, "allumez", 64.26, 2.2, 6.4, 1.6, 0.6, PI / 2);
  // Glissières le long de la route (au sud, la vallée)
  O.glissiere(c, [[64, 6.2], [71, 6.2]], 0);
  nature(k, 50, 100);
  void u;
}

function barrage(k) {
  const { c, b } = k;
  // Deux voitures en travers, en chicane
  O.voiture(c, 56.6, -2.5, PI / 2 - 0.22, 0x6a5a4a, { pneusCreves: true });
  O.voiture(c, 61.6, 2.5, PI / 2 + 0.18, 0x5a6a7a, { pneusCreves: true, porte: true });
  // Murs de palettes entre les voitures et les murs en aile
  O.murPalettes(c, 56.5, 4.2, PI / 2, 1, 1);
  O.murPalettes(c, 61.4, -4.3, PI / 2, 1, 2);
  O.murPalettes(c, 58.8, -4.65, 0, 2, 1);
  // Pneus, fûts, barbelés
  O.pneus(c, 55.2, 4.6, 4);
  O.pneus(c, 63.2, -4.6, 3);
  O.fut(c, 57.8, 4.6, 0x3f5a6a);
  O.fut(c, 63.3, 4.4, 0x8a3a2a, true);
  O.barbeles(c, 57.4, 0.2, 57.4, 4.0);
  O.barbeles(c, 60.6, -4.0, 60.6, -0.3);
  // La pancarte des pillards, face à la route
  for (const dx of [-0.6, 0.6]) c.boite(0.08, 1.9, 0.08, 0x5a4130, { x: 58.6 + dx, y: 0.95, z: -4.2 }, M.mat());
  panneau(c, "pillards", 58.6, 1.4, -4.12, 1.6, 0.54);
  // Le brasero des pillards
  O.brasero(c, 63.6, 3.4);
  k.b.lumiere(63.6, 1.0, 3.4, 0xff8a3a, 7, 9, "brasero du barrage des pillards");
  // La guérite de guet (palettes et tôle, non praticable) et l'abri sous bâche
  en(65.6, -8, () => {
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.boite(0.12, 3.0, 0.12, 0x6a5a48, { x: 65.6 + dx, y: 1.5, z: -8 + dz }, M.mat());
    c.boite(2.3, 0.12, 2.3, 0x8f7552, { x: 65.6, y: 2.0, z: -8 }, M.mat());
    c.boite(2.3, 1.0, 0.05, 0x7f6a58, { x: 65.6, y: 2.55, z: -6.9, rz: 0.03 }, M.tole());
    c.boite(2.6, 0.06, 2.6, 0x5e6a4e, { x: 65.6, y: 3.1, z: -8, rz: 0.08 }, M.tole());
    // L'échelle (retirée : on ne monte pas)
    c.boite(0.4, 0.06, 2.6, 0x6a5a48, { x: 67.4, y: 0.1, z: -7.2, ry: 0.3 }, M.mat());
  });
  en(66.4, -10.4, () => {
    c.boite(4.0, 0.04, 2.6, 0x4a5a6a, { x: 66.6, y: 1.5, z: -10.2, rx: 0.35 }, M.mat(), { crasse: false });
    c.boite(1.9, 0.15, 0.9, 0x6a6a5a, { x: 65.8, y: 0.08, z: -10.6 }, M.mat());
    for (let i = 0; i < 3; i++) O.jerrican(c, 67.4 + i * 0.4, -10.8, 0.2 * i, [0x4f6f3a, 0x8a3a2a, 0x3f5a6a][i]);
    c.boite(0.6, 0.4, 0.4, 0x6a5a48, { x: 68.4, y: 0.2, z: -10, ry: 0.4 }, M.mat());
  });
  // Obstacles : les deux voitures et les palettes (la chicane)
  b.obstacle(56.1, -4.6, 57.1, -0.4, "voiture du barrage");
  b.obstacle(61.1, 0.4, 62.1, 4.6, "voiture du barrage");
  b.obstacle(56.4, 4.3, 56.4, 5.0, "palettes");
  b.obstacle(61.4, -5.0, 61.4, -4.3, "palettes");
  b.obstacle(57.4, 0.2, 57.4, 4.0, "barbelés");
  b.obstacle(60.6, -4.0, 60.6, -0.3, "barbelés");
}

function pont(k) {
  const { c, b, u } = k;
  const X0 = 71, X1 = 91;
  // Culées
  c.pave(69.5, -4, -5.4, 73.5, 0.0, 5.4, 0xa9a59c, M.beton());
  c.pave(88.5, -4, -5.4, 92.5, 0.0, 5.4, 0xa9a59c, M.beton());
  // Tablier, chaussée, parapets
  for (let x = X0; x < X1 - 0.01; x += 2) {
    const xm = x + 1;
    c.pave(x, -0.9, -4.6, x + 2, -0.3, 4.6, 0xb3aea3, M.beton(), { crasse: false });
    c.pave(x, -0.3, -3.8, x + 2, 0.025, 3.8, 0x5a5955, M.mat(), { crasse: false, nuance: 0.03 });
    for (const s of [-1, 1]) {
      c.pave(x, -0.3, s < 0 ? -4.6 : 3.8, x + 2, 0.15, s < 0 ? -3.8 : 4.6, 0x9a968c, M.mat(), { crasse: false });
      const casse = s > 0 && xm > 82.5 && xm < 86;
      if (!casse) c.pave(x, 0.15, s < 0 ? -4.9 : 4.3, x + 2, 1.0, s < 0 ? -4.3 : 4.9, 0xc4bfb2, M.beton(), { nuance: 0.02 });
      c.pave(x, -0.95, s < 0 ? -4.95 : 4.6, x + 2, -0.3, s < 0 ? -4.6 : 4.95, 0xc9c4b8, M.beton(), { crasse: false }); // corniche
    }
    c.boite(1.5, 0.012, 0.12, 0xd8d4c8, { x: xm, y: 0.036 }, M.mat(), { crasse: false });
  }
  // Les deux arcs sous le tablier, et les montants
  const xc = 81.5, demi = 5.2, fl = 4.2, y0 = -5.4;
  for (const sz of [-3.2, 3.2]) {
    for (let i = 0; i < 10; i++) {
      const t1 = -1 + (i / 10) * 2;
      const t2 = -1 + ((i + 1) / 10) * 2;
      const p1 = [xc + t1 * demi, y0 + fl * (1 - t1 * t1), sz];
      const p2 = [xc + t2 * demi, y0 + fl * (1 - t2 * t2), sz];
      c.poutre(p1, p2, 0.85, 0xb3aea3, M.beton());
    }
    for (let x = 75; x <= 88; x += 2) {
      const t = (x - xc) / demi;
      if (Math.abs(t) > 0.98) continue;
      const ya = y0 + fl * (1 - t * t);
      if (-0.9 - ya > 0.2) c.pave(x - 0.2, ya, sz - 0.3, x + 0.2, -0.9, sz + 0.3, 0xa9a59c, M.beton(), { crasse: false });
    }
  }
  // La voiture qui a crevé le parapet sud : suspendue, le nez au-dessus du vide
  O.voiture(c, 84.2, 5.4, -0.25, 0xc8a23a, { rx: 0.0, rz: -0.32, y: -0.2, porte: true });
  gravats(c, 84.4, 4.4, 0.8, 6, [0xc4bfb2, 0xa9a59c]);
  // Obstacles : parapets (et le vide à la place du parapet cassé)
  b.obstacle(X0, -4.6, X1, -4.6, "parapet du pont");
  b.obstacle(X0, 4.6, X1, 4.6, "parapet du pont (cassé : le vide)");
  // Les rebords de la gorge, hors du pont
  for (const s of [-1, 1]) {
    const pts = [];
    for (let z = -26; z <= 35; z += 3) if (Math.abs(z) > 5) pts.push([xTorrent(z) + s * 7.5, z]);
    for (let i = 0; i < pts.length - 1; i++) if (Math.sign(pts[i][1]) === Math.sign(pts[i + 1][1])) b.obstacle(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], "gorge du torrent");
  }
  void u;
}

function torrent(k) {
  const { c } = k;
  // L'eau : des bandes qui suivent le lit, en marches (les rapides)
  const pos = [];
  const col = [];
  const eau = new THREE.Color(0x5f8a8a);
  const ecume = new THREE.Color(0xd8e4e0);
  for (let z = -35; z < 35 - 0.01; z += 2.5) {
    const za = z, zb = z + 2.5;
    const y = Math.max(lit(za), lit(zb)) + 0.45;
    const xa1 = xTorrent(za) - 3.3, xa2 = xTorrent(za) + 3.3;
    const xb1 = xTorrent(zb) - 3.3, xb2 = xTorrent(zb) + 3.3;
    const tri = [[xa1, y, za], [xb1, y, zb], [xb2, y, zb], [xa1, y, za], [xb2, y, zb], [xa2, y, za]];
    for (const p of tri) {
      pos.push(...p);
      const k2 = hash(z, p[0]) < 0.2 ? ecume : eau;
      col.push(k2.r, k2.g, k2.b);
    }
  }
  pousser(c, M.eau(), pos, col);
  // La cascade, qui tombe de la vasque haute dans la gorge
  const zc = -26.2;
  const xc = xTorrent(zc);
  for (let i = 0; i < 5; i++) {
    const w = 1.1 - i * 0.12;
    c.boite(w, 12.2, 0.15, i % 2 ? 0xe8f0f0 : 0xb8d0d4, { x: xc - 2 + i * 1.0, y: -0.8, z: zc + i * 0.03 }, M.eau(), { crasse: false, nuance: 0.05 });
  }
  // Écume et rochers dans le lit
  for (let i = 0; i < 26; i++) {
    const z = c.entre(-25, 34);
    const x = xTorrent(z) + c.entre(-3, 3);
    const y = lit(z);
    O.rocher(c, x, z, c.entre(0.4, 1.0), y, c.hasard() < 0.5 ? 0x7a766e : 0x8f8a80);
    c.boite(c.entre(0.8, 1.6), 0.04, c.entre(0.5, 1), 0xe8f0ee, { x: x + 0.6, y: y + 0.5, z: z + 0.3, ry: c.hasard() * 3 }, M.mat(), { crasse: false });
  }
  for (let i = 0; i < 6; i++) c.boite(c.entre(1.5, 3), 0.05, c.entre(1, 2), 0xf0f4f2, { x: xc + c.entre(-2.5, 2.5), y: -6.5, z: zc + c.entre(0.5, 2.5) }, M.mat(), { crasse: false });
}

function relais(k) {
  const { c, b, u } = k;
  const X0 = 89.6, X1 = 99.2, Z0 = 8, Z1 = 15.5, H = 3.0;
  c.pave(X0 - 0.3, -0.25, Z0 - 0.3, X1 + 0.3, 0.05, Z1 + 0.3, 0x8a8070, M.mat(), { crasse: false });
  const bris = 0.3 + u * 0.6;
  const spec = { h: H, ep: 0.4, couleur: 0x9a948a, mat: M.mat(), batiment: b, interieur: { couleur: 0xc9b896, mat: M.mat() } };
  // Façade nord (route) : la porte ; sud (terrasse) : porte-fenêtre et fenêtres ; est : fenêtres
  mur(c, [X1, Z0], [X0, Z0], { ...spec, ouvertures: [{ u: 6.2, l: 1.1, bas: 0, haut: 2.15, type: "porte", vantail: "tombe", couleurPorte: 0x5a3a24 }] });
  mur(c, [X0, Z1], [X1, Z1], { ...spec, ouvertures: [{ u: 1.6, l: 1.0, bas: 0.9, haut: 2.1, type: "fenetre", bris, cadre: 0xe2ddd0, volet: "ouvert", couleurVolet: 0x5a7a4a }, { u: 5.0, l: 1.2, bas: 0, haut: 2.15, type: "porte", vantail: "entrouvert", couleurPorte: 0x5a3a24 }, { u: 7.6, l: 1.4, bas: 0.9, haut: 2.1, type: "fenetre", bris, cadre: 0xe2ddd0, volet: "pendu", couleurVolet: 0x5a7a4a }] });
  mur(c, [X0, Z0], [X0, Z1], { ...spec, ouvertures: [{ u: 3.7, l: 1.0, bas: 0.9, haut: 2.1, type: "fenetre", bris, cadre: 0xe2ddd0 }] });
  mur(c, [X1, Z1], [X1, Z0], { ...spec, ouvertures: [{ u: 2.4, l: 1.0, bas: 0.9, haut: 2.1, type: "fenetre", bris, cadre: 0xe2ddd0 }, { u: 5.6, l: 1.0, bas: 0.9, haut: 2.1, type: "fenetre", bris, cadre: 0xe2ddd0 }] });
  mur(c, [96.4, Z0], [96.4, Z1], { h: H, ep: 0.2, couleur: 0xc9b896, batiment: b, ouvertures: [{ u: 2.0, l: 0.9, bas: 0, haut: 2.05, type: "porte" }] });
  // Bardage de bois en haut des façades sud et est (le pignon est en bois)
  for (let y = 2.2; y < H; y += 0.26) {
    c.boite(X1 - X0 + 0.5, 0.2, 0.05, 0x7a5a3c, { x: (X0 + X1) / 2, y, z: Z1 + 0.22 }, M.mat(), { crasse: false, nuance: 0.05 });
    c.boite(0.05, 0.2, Z1 - Z0 + 0.5, 0x7a5a3c, { x: X1 + 0.22, y, z: (Z0 + Z1) / 2 }, M.mat(), { crasse: false, nuance: 0.05 });
  }
  panneau(c, "chalet", 94.4, 2.55, Z1 + 0.26, 3.8, 0.95);
  // Salle : bar, tables, cheminée, l'ardoise
  c.boite(0.6, 1.05, 3.6, 0x6a4a30, { x: 94.9, y: 0.52, z: 12.6 }, M.mat());
  c.boite(0.75, 0.06, 3.7, 0x8a6a48, { x: 94.85, y: 1.07, z: 12.6 }, M.mat());
  for (let i = 0; i < 6; i++) cylY(c, M.verre(), 0xffffff, 94.9, 11.2 + i * 0.5, 1.1, 1.25, 0.04, 0.05, 6);
  O.tableBancs(c, 91.6, 10.6, PI / 2);
  O.tableBancs(c, 92.4, 13.6, 0.2, u > 0.5);
  c.pave(90.0, 0, Z0 + 0.2, 91.6, 1.3, Z0 + 0.8, 0x8f8a80, M.mat());
  c.pave(90.3, 0.05, Z0 + 0.5, 91.3, 0.8, Z0 + 0.85, 0x1a1816, M.mat(), { crasse: false });
  panneau(c, "menu", 90.8, 2.0, Z0 + 0.22, 1.0, 0.88);
  panneau(c, "watty", 89.82, 1.7, 13.6, 1.1, 0.62, PI / 2);
  // Réserve : étagères, tonneaux, cagettes
  for (const y of [0.4, 1.0, 1.6]) c.boite(2.4, 0.04, 0.45, 0x7a5a3c, { x: 97.8, y, z: Z0 + 0.45 }, M.mat());
  for (let i = 0; i < 9; i++) if (c.hasard() < 0.6) c.boite(0.2, 0.25, 0.2, [0x6a8a5a, 0xc8a23a, 0x8a3a2a][i % 3], { x: 96.9 + (i % 3) * 0.8, y: 0.55 + Math.floor(i / 3) * 0.6, z: Z0 + 0.45 }, M.satin());
  for (const [x, z] of [[98.4, 14.6], [97.6, 14.8]]) cylY(c, M.mat(), 0x6a4a30, x, z, 0, 0.9, 0.32, 0.36, 8);
  O.jerrican(c, 97.2, 12.6, 0.4, 0x8a3a2a);
  // La terrasse et sa balustrade, la longue-vue « panorama connecté »
  c.pave(X0, -0.2, Z1 + 0.3, X1, 0.05, 18.6, 0x8a6a48, M.mat(), { crasse: false });
  for (let x = X0 + 0.2; x < X1; x += 0.6) c.boite(0.05, 0.012, 3.0, 0x6a4a30, { x, y: 0.056, z: 17.0 }, M.mat(), { crasse: false });
  for (let x = X0; x <= X1 + 0.01; x += 1.6) c.boite(0.1, 1.0, 0.1, 0x6a4a30, { x, y: 0.5, z: 18.5 }, M.mat());
  c.boite(X1 - X0, 0.08, 0.1, 0x6a4a30, { x: (X0 + X1) / 2, y: 1.0, z: 18.5 }, M.mat());
  b.obstacle(X0, 18.5, X1, 18.5, "balustrade de la terrasse (la vallée en contrebas)");
  en(97.6, 17.6, () => {
    cylY(c, M.metal(), 0x5a6a5a, 97.6, 17.8, 0, 1.1, 0.06, 0.06, 6);
    cylX(c, M.metal(), 0x5a6a5a, 97.3, 97.9, 1.25, 17.8, 0.12, 8);
  });
  // Le toit (couche) : pignon au sud, grand débord, tôle verte rapiécée
  const toit = b.couche("toit-relais", { x: (X0 + X1) / 2, z: (Z0 + Z1) / 2, l: X1 - X0, p: Z1 - Z0 }, H, H + 3.2);
  toitDeuxPans(toit, (X0 + X1) / 2, (Z0 + Z1) / 2, Z1 - Z0, X1 - X0, H, 2.3, { couleur: 0x5a6a5a, mat: M.tole(), debord: 0.9, charpente: 0x5a4130, ry: PI / 2, trous: u > 0.6 ? [{ u: 1.5, v: -1, l: 2.0, p: 0.6 }] : [] });
  toit.boite(0.7, 1.4, 0.7, 0x8f8a80, { x: 90.8, y: H + 2.2, z: Z0 + 0.5 }, M.mat());
  k.b.lumiere(91.4, 1.2, 10.4, 0xffb060, 3, 6, "bougie sur une table du relais");
}

// ---------- La nature (dehors) ----------

function nature(k, xa, xb) {
  const { c, u } = k;
  // Rochers au pied de la falaise nord, éboulis
  for (let i = 0; i < 26; i++) {
    const x = c.entre(xa + 1, xb - 1);
    if (Math.abs(x) < MR + 2 || !k.ici(x)) continue;
    const zN = -23.5 + 1.5 * Math.sin(x * 0.21) + Math.sin(x * 0.07 + 1);
    const z = zN + c.entre(-1.5, 2.2);
    if (x > 72 && x < 91) continue;
    O.rocher(c, x, z, c.entre(0.3, 1.2), hauteur(x, z) - 0.2, c.hasard() < 0.5 ? 0x8a857c : 0x9a958a);
  }
  // Sapins : en haut de la falaise nord, et dans le ravin / la vallée au sud
  for (let i = 0; i < 46; i++) {
    const x = c.entre(xa + 1, xb - 1);
    if (Math.abs(x) < MR + 1 || !k.ici(x)) continue;
    const nordique = c.hasard() < 0.5;
    const z = nordique ? c.entre(-34, -27) : c.entre(23, 34.5);
    const h = hauteur(x, z);
    if (nordique && h < 8) continue;
    if (x > 70 && x < 92 && Math.abs(x - xTorrent(z)) < 8) continue;
    if (!nordique && x < -60 && Math.abs(z - zBasse(x)) < 4.5) continue;
    O.sapin(c, x, z, c.entre(5, 9), h - 0.2);
  }
  // Touffes d'herbe le long des glissières et des bords
  for (let i = 0; i < 40 + u * 40; i++) {
    const x = c.entre(xa, xb);
    if (Math.abs(x) < MR || !k.ici(x)) continue;
    const z = c.entre(-22, 20);
    if (Math.abs(z - zRoute(x)) < largeur(x) + 0.5) continue;
    const h = hauteur(x, z);
    if (Math.abs(h) > 0.3) continue;
    touffes(c, [[x, z, h]], PALETTE.herbeSeche);
  }
  // Quelques arbustes sur les replats
  for (let i = 0; i < 10; i++) {
    const x = c.entre(xa + 2, xb - 2);
    if (Math.abs(x) < MR + 3 || !k.ici(x)) continue;
    const z = c.hasard() < 0.5 ? c.entre(-21, -19) : c.entre(18, 20);
    if (x > 88 && z > 0) continue;
    if (x < -79 && x > -99 && z > 7) continue;
    arbuste(c, x, z, c.entre(0.6, 1.1), 0, [0x4f6f3a, 0x5d7a46, 0x3f5a30]);
  }
  // Sur la montagne : quelques sapins accrochés (dans les couches)
  if (k.montagneuse) {
    const xa2 = Math.max(k.x0, -MR) + 1;
    const xb2 = Math.min(k.x1, MR) - 1;
    for (let i = 0; i < 16; i++) {
      const x = c.entre(xa2, xb2);
      const z = c.entre(-33, 33);
      if (Math.abs(z) < 9) continue;
      const ch = z < -5 ? k.nord : k.sud;
      O.sapin(ch, x, z, c.entre(5, 8), montagne(x, z) - 0.3);
    }
  }
}

// ---------- Le contrat ----------

/** Recentre tout ce qui a été bâti dans le repère de la halte sur le centre du tronçon. */
function recentrer(groupe, dx, lot) {
  const vues = new Set();
  groupe.traverse((obj) => {
    if (obj.geometry && !vues.has(obj.geometry)) {
      vues.add(obj.geometry);
      obj.geometry.translate(-dx, 0, 0);
    }
  });
  const ud = groupe.userData;
  for (const t of ud.toits) {
    t.boite = { ...t.boite, x: arr(t.boite.x - dx) };
    if (t.horsDe) t.horsDe = { ...t.horsDe, x: t.horsDe.x - dx };
  }
  const dedans = (x, z) => Math.abs(x) <= lot.l / 2 + 0.5 && Math.abs(z) <= lot.p / 2 + 0.5;
  ud.obstacles = ud.obstacles.map((s) => ({ ...s, x1: arr(s.x1 - dx), x2: arr(s.x2 - dx) })).filter((s) => dedans(s.x1, s.z1) || dedans(s.x2, s.z2));
  ud.lumieres = ud.lumieres.map((l) => ({ ...l, x: arr(l.x - dx) })).filter((l) => dedans(l.x, l.z)).slice(0, 8);
  return groupe;
}

export function creer({ usure = 0.7, carte = "montee" } = {}) {
  const def = TRONCONS.find((t) => t.id === carte) ?? TRONCONS[0];
  const k = new Troncon(def, usure);
  solEtRoche(k);
  if (def.id === "montee") {
    montee(k);
    tunnel(k);
  } else if (def.id === "tunnel-ouest") {
    tunnel(k);
    abri(k);
    contenuTunnelOuest(k);
    for (const n of NICHES) if (k.ici(n)) k.b.lumiere(n, 2.95, -4.7, 0x3fdf7a, 1.6, 4, "veilleuse verte « sortie de secours » (niche)");
    k.b.lumiere(-21, 2.78, -4.7, 0x3fdf7a, 2, 5, "veilleuse verte au-dessus de la porte coupe-feu");
  } else if (def.id === "tunnel-est") {
    tunnel(k);
    contenuTunnelEst(k);
    for (const n of NICHES) if (k.ici(n)) k.b.lumiere(n, 2.95, -4.7, 0x3fdf7a, 1.6, 4, "veilleuse verte « sortie de secours » (niche)");
  } else {
    tunnel(k);
    teteEst(k);
  }
  // Les veilleuses qui clignotent (sur batterie, à intervalles)
  if (!k.clignote.vide) {
    const g = k.clignote.construire();
    const mat = matiereClignote();
    g.userData.animer = (t) => {
      const p = t % 2.6;
      mat.opacity = p < 1.5 ? 1 : p < 1.7 ? 0.1 : p < 1.9 ? 0.85 : 0.1;
    };
    k.b.ajouter(g);
  }
  const groupe = k.b.construire();
  // Les panneaux des couches : dessinés après le béton de leur couche (ils n'écrivent pas la profondeur en fondu)
  for (const t of groupe.children) if (t.name) t.traverse((o) => {
    if (o.isMesh && o.material.map && o.material.map.image?.width === 1024) o.renderOrder = 3;
  });
  return recentrer(groupe, def.x0 + 25, { l: 50, p: 70 });
}

void PALETTE;
void Chantier;
