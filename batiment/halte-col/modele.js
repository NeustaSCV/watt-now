// La halte du col du Grand-Vent (Book 20 §4 « le col », route de la Montagne ; Book 01 §2 bis : les haltes).
//
// Une route de col qui monte en lacets serrés par l'ouest, entre murs de soutènement et parapets de pierre, passe sous
// une galerie paravalanche à demi effondrée, franchit le sommet (1 784 m) devant le chalet-buvette, puis redescend à
// l'est le long de glissières tordues, sous les sièges figés du télésiège. Au nord, la paroi rocheuse ; au sud, le ravin
// qui plonge sous y = 0 vers les sapins (solPropre). La neige résiduelle tient à l'ombre, en plaques et en congères.
//
// Repère de la halte entière : 200 × 70 m, origine au centre, +x à l'est, +z au sud, sol visitable à y = 0. Tout est
// bâti dans ce repère, puis chaque tronçon (50 × 70 m) ne garde que ce qui tombe dans sa bande de x et se recentre.
// Les pièces continues (route, murs, terrain) sont découpées par morceaux d'un mètre attribués au tronçon qui contient
// leur milieu, et le terrain est une grille alignée sur le repère global : les raccords sont exacts.
//
// On visite : l'abri de berger (lacets), la maison des cantonniers et le dépôt de sel (galerie), la galerie elle-même,
// le chalet-buvette (salle, cuisine, réserve, terrasse) et la chapelle (sommet), la machinerie du télésiège, la file
// « Fast Lane Premium » et le parking des randonneurs (descente). Toits et hauts de façades s'effacent en couches.

import * as THREE from "three";
import { Batiment, aleatoire, PALETTE, matiere, matiereMonde, matiereVerre, matiereLueur, MAT, mur, touffes, gravats, debris, jonchee, raiDeLumiere, dessiner } from "../commun/atelier.js";

// ---------- Les tronçons ----------

const X0 = { lacets: -75, galerie: -25, sommet: 25, descente: 75 };

/** Le filtre d'un tronçon : un objet appartient au tronçon qui contient son centre (les bouts de la halte débordent). */
function bande(x0) {
  const xa = x0 - 25;
  const xb = x0 + 25;
  return (x) => (x >= xa || xa <= -100) && (x < xb || xb >= 100);
}

const arr = (v) => Math.round(v * 100) / 100;
const versTroncon = (liste, id) => liste.filter((o) => bande(X0[id])(o.x)).map((o) => ({ ...o, x: arr(o.x - X0[id]) }));

// Les données de jeu, dans le repère de la halte entière (elles sont recentrées par tronçon plus bas).
const ENTREES = [
  { x: -100, z: 16, nature: "entrée A : la route monte de la vallée, premier lacet" },
  { x: -78, z: -20.7, nature: "porte basse de l'abri de berger" },
  { x: -43.5, z: 8, nature: "porte de la maison des cantonniers (côté route)" },
  { x: -34, z: 4, nature: "grand portail ouvert du dépôt de sel et d'engins" },
  { x: -26, z: -2, nature: "bouche ouest de la galerie paravalanche" },
  { x: -2, z: -2, nature: "bouche est de la galerie paravalanche" },
  { x: 10, z: -9, nature: "porte de la salle du chalet-buvette, depuis la terrasse" },
  { x: 26, z: -12.5, nature: "porte de service de la cuisine (pignon est)" },
  { x: 24, z: -20, nature: "porte de la réserve, à l'arrière (nord)" },
  { x: 38, z: -14, nature: "porte de la chapelle du col" },
  { x: 62.5, z: -21, nature: "porte de la machinerie du télésiège" },
  { x: 86.5, z: -14.2, nature: "porte latérale du camping-car" },
  { x: 100, z: 8, nature: "sortie B : la route redescend vers le barrage" },
];

const FOUILLE = [
  // Les lacets
  { x: -79.5, z: -23.6, quoi: "abri de berger : paillasse, couvertures de laine, boîte en fer (allumettes, bougies)" },
  { x: -76.3, z: -24.3, quoi: "étagère du berger : moules à fromage, seau, sel, corde" },
  { x: -75.2, z: -18.4, quoi: "sacs de charbon de bois laissés par les Charbonniers (charbon, monnaie d'échange)" },
  { x: -81.5, z: -18.6, quoi: "réserve de bois sec sous la bâche" },
  { x: -73.5, z: 7.3, quoi: "oratoire du lacet : bougies, ex-voto de laiton" },
  { x: -66, z: -21, quoi: "grand cairn : boîte de randonneur (barres, carte, couverture de survie)" },
  // La galerie
  { x: -46.2, z: 13.6, quoi: "maison des cantonniers : lits superposés (duvets), casier (gants, bonnets, lampe frontale)" },
  { x: -43.5, z: 11.4, quoi: "table des cantonniers : carte des routes, radio de chantier, thermos" },
  { x: -40.9, z: 9.2, quoi: "poêle à bois et sa caisse de bûches" },
  { x: -34.5, z: 8.5, quoi: "chasse-neige : fond de gazole, batterie, courroies, lame d'acier" },
  { x: -31.6, z: 11.6, quoi: "tas de sel de déneigement (sel : conserves, salaisons)" },
  { x: -30.7, z: 6.2, quoi: "chaînes à neige pendues au mur (chaîne, métal)" },
  { x: -37.6, z: 11.8, quoi: "pelles, pioche et établi du dépôt (outils)" },
  { x: -21.5, z: -3.4, quoi: "épave sous la galerie : gilets, trousse de secours, roue de secours" },
  { x: -5, z: -5.4, quoi: "niche d'appel d'urgence : batterie du néon de secours, extincteur" },
  // Le sommet
  { x: 15.4, z: -17.5, quoi: "comptoir de la buvette : bouteilles (génépi, sirop), tireuse, caisse enregistreuse" },
  { x: 6.6, z: -14, quoi: "présentoir à souvenirs : couteau de poche, cloches, boules à neige, cartes postales" },
  { x: 9.3, z: -18.4, quoi: "poêle de la salle : fonte, bûches, tisonnier" },
  { x: 24.5, z: -10.6, quoi: "cuisine : casseroles, conserves, sel, réchaud" },
  { x: 22, z: -18.5, quoi: "réserve : conserves, sacs de farine, fûts de bière, bougies" },
  { x: 38, z: -22.5, quoi: "chapelle : cierges, nappe d'autel (tissu), petite cloche de bronze" },
  { x: 33.6, z: 10.4, quoi: "longue-vue « Panorama augmenté » : lentilles, petite batterie" },
  { x: 21, z: 3.6, quoi: "borne météo : écran, petit panneau solaire, anémomètre" },
  { x: 43, z: 5.2, quoi: "épave de l'esplanade : couvertures, chaînes, jerrican vide" },
  // La descente
  { x: 57.5, z: -23.4, quoi: "machinerie du télésiège : huile, câbles de cuivre, courroies" },
  { x: 56.3, z: -19.4, quoi: "fûts d'huile et caisse à outils de la machinerie" },
  { x: 86.5, z: -15.5, quoi: "camping-car : duvets, réchaud et bouteille de gaz, conserves" },
  { x: 80.5, z: -20, quoi: "épave du parking : coffre (corde, raquettes à neige)" },
  { x: 77.2, z: -7.8, quoi: "borne de stationnement connectée : batterie, monnayeur" },
];

const ETEINTS = [
  { x: -70, z: 2.4, type: "errant (dans le deuxième lacet)" },
  { x: -82, z: -12, type: "errant (troisième lacet)" },
  { x: -72.5, z: 4.9, type: "gelé (au pied de l'oratoire, raide sous le givre)" },
  { x: -12, z: 0.6, type: "gelé (dans le passage étroit de l'éboulement)" },
  { x: -40.5, z: 2.6, type: "errant (devant le dépôt)" },
  { x: -44.6, z: 13, type: "ancien habitant (un cantonnier en gilet orange délavé)" },
  { x: 12.5, z: -7.4, type: "gelé (sur la terrasse, peau bleutée, givre)" },
  { x: 20, z: -6.8, type: "gelé (assis à une table de la terrasse)" },
  { x: 10.6, z: -16.8, type: "gelé (près du poêle : il se réveille quand on le rallume)" },
  { x: 27.6, z: -15, type: "gelé (contre le pignon est du chalet)" },
  { x: 15, z: 5.8, type: "errant (sur l'esplanade du sommet)" },
  { x: 58.5, z: -21.6, type: "gelé (dans la machinerie)" },
  { x: 67, z: -9.4, type: "gelé (dans la file Fast Lane Premium, toujours en tête)" },
  { x: 90, z: -11, type: "errant (entre les voitures du parking)" },
];

const TRONCONS = [
  {
    id: "lacets",
    nom: "Les lacets",
    depart: { x: -98, z: 16 },
    description: "la route monte en lacets serrés entre murs de soutènement et parapet ; l'oratoire, l'abri de berger et le feu des survivants",
  },
  {
    id: "galerie",
    nom: "La galerie paravalanche",
    depart: { x: -47, z: -6 },
    description: "la maison des cantonniers, le dépôt de sel et son chasse-neige, puis la galerie couverte où l'éboulement ne laisse qu'un couloir de deux mètres (goulet)",
  },
  {
    id: "sommet",
    nom: "Le sommet du col",
    depart: { x: 2, z: -2 },
    description: "le panneau du col (goulet), le chalet-buvette et sa terrasse gardée par les gelés, la chapelle, le belvédère et sa longue-vue connectée",
  },
  {
    id: "descente",
    nom: "La descente",
    depart: { x: 54, z: -2 },
    description: "la gare d'arrivée du télésiège figé (machinerie, file Fast Lane Premium), le parking des randonneurs, les glissières tordues au-dessus du ravin",
  },
];

export const FICHE = {
  id: "halte-col",
  nom: "Le col du Grand-Vent",
  lieu: "Halte · route de la Montagne · entre l'anneau moyen et le lointain",
  environnement: "montagne et forêt",
  anneau: "moyen → lointain",
  danger: 3,
  halte: true,
  solPropre: true, // le ravin plonge sous y = 0, la paroi monte au nord : chaque tronçon fournit tout son sol
  recit:
    "Au col du Grand-Vent, la buvette promettait « chocolat chaud et panorama augmenté », et le télésiège vendait aux pressés de l'Abondance une file sans attente, la Fast Lane Premium. Le dernier hiver a tout figé : des Éteints gelés montent la garde autour du chalet, raides sous le givre, et le moindre feu peut les réveiller. Pour passer, il n'y a que la route, et la route passe par la galerie, là où l'éboulement ne laisse qu'un couloir de deux mètres : tout le monde le sait, ceux qui attendent aussi.",
  inspiration:
    "les cols alpins (Galibier, Iseran, Grand-Saint-Bernard), leurs lacets à murs de pierre sèche et leurs jalons rouge et blanc, les galeries paravalanches du Valais, les buvettes de sommet en madriers, les télésièges abandonnés des stations de moyenne montagne et les photos urbex de remontées mécaniques figées dans la neige",
  reperes: [
    "Les lacets serrés : deux virages en épingle, murs de soutènement, parapet de pierre au-dessus du ravin, jalons à neige rouge et blanc",
    "L'oratoire du lacet sur son talus, la statuette, les bougies (lumignon la nuit)",
    "L'abri de berger en pierre sèche, son toit de lauzes, le feu des survivants et les sacs de charbon des Charbonniers 🔥",
    "La maison des cantonniers et le dépôt de sel : chasse-neige orange abandonné, tas de sel, chaînes à neige, pelles",
    "La galerie paravalanche : piliers côté vide, dalle de béton, éboulement qui a crevé le toit et ne laisse qu'un couloir étroit (goulet)",
    "Le néon de secours sur batterie de la niche d'appel d'urgence (« service réservé aux abonnés »)",
    "Le sommet : panneau « Col du Grand-Vent — 1 784 m », borne, manche à air en lambeaux (goulet)",
    "Le chalet-buvette en madriers : salle au poêle, comptoir, souvenirs et cartes postales, cuisine, réserve, terrasse panoramique, fanions déchirés",
    "La chapelle du col et son clocheton, ses ex-voto",
    "Le belvédère : table d'orientation et longue-vue connectée « Panorama augmenté — insérez 2 Wh »",
    "La borne météo connectée qui annonce « Grand soleil » sous la neige",
    "Le télésiège figé : sièges qui pendent au-dessus de la route, pylône planté dans le ravin, roue motrice, machinerie visitable",
    "La file « Fast Lane Premium », son tapis rouge et ses potelets, à côté de la file standard",
    "Le parking des randonneurs : camping-car, cairns, panneaux de sentier, borne de stationnement connectée",
    "Les glissières tordues et la voiture tombée dans le ravin, entre les sapins",
    "La nuit : le poêle du chalet rallumé, la lanterne des cantonniers, le feu dans l'abri de berger",
  ],
  lot: { l: 200, p: 70 },
  depart: { x: -98, z: 16 },
  goulets: [
    { x: -12, z: -1, nature: "galerie paravalanche : l'éboulement ne laisse qu'un passage de 2 m entre les rochers et les piliers" },
    { x: 15, z: -2, nature: "sommet du col : la route passe entre la terrasse du chalet et l'esplanade, à découvert" },
  ],
  panneaux: [
    { x: -96.5, z: 12.3, texte: "Barrage · Grand Comptoir — par le col, 14 km →" },
    { x: -96.5, z: 12.3, texte: "← Vallée · Ton terrain" },
    { x: 14, z: 4.2, texte: "Col du Grand-Vent — 1 784 m" },
    { x: 96.5, z: 4, texte: "Hameau des Charbonniers · 5 km →" },
    { x: 96.5, z: 4, texte: "← Col du Grand-Vent · Vallée" },
  ],
  cartes: TRONCONS.map((t) => ({
    id: t.id,
    nom: t.nom,
    lot: { l: 50, p: 70 },
    decalage: { x: X0[t.id], z: 0 },
    solPropre: true,
    depart: { x: arr(t.depart.x - X0[t.id]), z: t.depart.z },
    description: t.description,
    entrees: versTroncon(ENTREES, t.id),
    fouille: versTroncon(FOUILLE, t.id),
    eteints: versTroncon(ETEINTS, t.id),
  })),
};

// ---------- Couleurs du lieu (passées, froides) ----------

const ASPHALTE = 0x4f5254;
const ASPHALTE_RAPIECE = 0x3f4244;
const LIGNE = 0xd8d5cb;
const GRAVIER = 0x8d877b;
const ROC = 0x8a867e;
const ROC_SOMBRE = 0x6b6862;
const ROC_CLAIR = 0xa39f96;
const HERBE_ALPE = 0x8b955e;
const HERBE_ROUSSE = 0x9f9165;
const TERRE_ALPE = 0x8f8763;
const AIGUILLES = 0x5c4e3b;
const TALUS = 0x6e7650;
const NEIGE = 0xeef2f6;
const NEIGE_OMBRE = 0xd6dfea;
const SAPIN = 0x2f4b39;
const SAPIN_CLAIR = 0x3d5c43;
const SAPIN_SOMBRE = 0x263d30;
const TRONC = 0x4e3d2e;
const PIERRE = 0x9c968a;
const PIERRE_SECHE = 0x8f877a;
const BETON = 0xa4a5a1;
const BOIS = 0x7a5838; // madriers brunis par le soleil d'altitude
const BOIS_CLAIR = 0x9a7a55;
const BOIS_GRIS = 0x8a8274;
const VOLET = 0x6c8a70;
const ROUGE = 0xa8473c; // rouge passé (jalons, cabines)
const ORANGE = 0xc07440; // l'orange des engins, délavé
const TOLE = 0x7d8689;
const ACIER = 0x6f767a;
const FONTE = 0x37393a;
const BLEU_SIEGE = 0x58758c;
const BARDEAU = 0x6b5c4d;

const HL = 3.25; // demi-largeur de la route

// ---------- Le tracé de la route (repère de la halte) ----------

/** Des points tous les mètres environ, avec leur tangente et leur normale (+n = à droite dans le sens ouest → est). */
const TRACE = (() => {
  const P = [];
  const marques = {};
  const ligne = (x1, z1, x2, z2) => {
    const n = Math.max(1, Math.round(Math.hypot(x2 - x1, z2 - z1)));
    for (let i = 0; i < n; i++) P.push([x1 + ((x2 - x1) * i) / n, z1 + ((z2 - z1) * i) / n]);
  };
  const arc = (cx, cz, r, a0, a1) => {
    const n = Math.max(4, Math.round(Math.abs(a1 - a0) * r * 1.4));
    for (let i = 0; i < n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      P.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]);
    }
  };
  const bezier = (p0, p1, p2, p3) => {
    const bz = (t) => {
      const u = 1 - t;
      return [0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]);
    };
    let L = 0;
    let prec = p0;
    for (let k = 1; k <= 30; k++) {
      const q = bz(k / 30);
      L += Math.hypot(q[0] - prec[0], q[1] - prec[1]);
      prec = q;
    }
    const n = Math.max(2, Math.round(L));
    for (let i = 0; i < n; i++) P.push(bz(i / n));
  };
  ligne(-101, 16, -62, 16);
  marques.virage1 = P.length;
  arc(-62, 9, 7, Math.PI / 2, -Math.PI / 2);
  marques.lacet2 = P.length;
  ligne(-62, 2, -86, 2);
  marques.virage2 = P.length;
  arc(-86, -5, 7, Math.PI / 2, (3 * Math.PI) / 2);
  marques.lacet3 = P.length;
  ligne(-86, -12, -58, -12);
  marques.courbe = P.length;
  bezier([-58, -12], [-50, -12], [-46, -2], [-38, -2]);
  marques.droite = P.length;
  ligne(-38, -2, 55, -2);
  marques.descente = P.length;
  bezier([55, -2], [70, -2], [80, 8], [92, 8]);
  ligne(92, 8, 101, 8);
  P.push([101, 8]);
  const T = P.map(([x, z], i) => {
    const a = P[Math.max(0, i - 1)];
    const b = P[Math.min(P.length - 1, i + 1)];
    let tx = b[0] - a[0];
    let tz = b[1] - a[1];
    const l = Math.hypot(tx, tz) || 1;
    tx /= l;
    tz /= l;
    return { x, z, tx, tz, nx: -tz, nz: tx };
  });
  T.marques = marques;
  return T;
})();
const MQ = TRACE.marques;

/** Le premier indice du tracé, à partir de `de`, dont le x dépasse `x` (sur une portion où x croît). */
function indiceX(x, de = MQ.lacet3) {
  for (let i = de; i < TRACE.length; i++) if (TRACE[i].x >= x) return i;
  return TRACE.length - 1;
}

function distRoute(x, z) {
  let d = Infinity;
  for (const p of TRACE) {
    const dx = p.x - x;
    if (dx > d || -dx > d) continue;
    const e = dx * dx + (p.z - z) * (p.z - z);
    if (e < d * d) d = Math.sqrt(e);
  }
  return d;
}

/** Le morceau i → i+1 du tracé, décalé de `off` du côté `cote` (+1 : à droite, au sud sur les portions vers l'est). */
function morceau(i, cote, off) {
  const p = TRACE[i];
  const q = TRACE[i + 1];
  return [p.x + cote * p.nx * off, p.z + cote * p.nz * off, q.x + cote * q.nx * off, q.z + cote * q.nz * off];
}

// ---------- Le relief : ravin au sud, paroi au nord, talus des lacets ----------

function hache(i, j) {
  let h = Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Bruit de valeur lissé, dans [0, 1]. */
function bruit(x, z) {
  const i = Math.floor(x);
  const j = Math.floor(z);
  const fx = x - i;
  const fz = z - j;
  const sx = fx * fx * (3 - 2 * fx);
  const sz = fz * fz * (3 - 2 * fz);
  const a = hache(i, j) + (hache(i + 1, j) - hache(i, j)) * sx;
  const b = hache(i, j + 1) + (hache(i + 1, j + 1) - hache(i, j + 1)) * sx;
  return a + (b - a) * sz;
}

function interp(table, x) {
  if (x <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    if (x <= table[i][0]) {
      const [x0, y0] = table[i - 1];
      const [x1, y1] = table[i];
      const t = (x - x0) / (x1 - x0);
      return y0 + (y1 - y0) * t * t * (3 - 2 * t);
    }
  }
  return table[table.length - 1][1];
}

// Le bord du ravin (z), d'ouest en est : large au pied des lacets et au dépôt, serré sous la galerie, le belvédère
// avance au-dessus du vide au sommet, puis le ravin s'écarte en suivant la descente.
const ZR = [[-101, 21.5], [-53, 21.5], [-45, 21], [-31, 20.5], [-27, 4.6], [-1, 4.6], [5, 9], [25.5, 9.2], [26, 11.9], [36, 11.9], [36.5, 9.4], [55, 10], [70, 12.5], [101, 16]];
// Le pied de la paroi (z) : le replat du berger, la galerie collée au rocher, le grand replat du sommet.
const ZN = [[-101, -27], [-52, -27], [-44, -19], [-33, -14], [-28, -6.6], [-1, -6.6], [5, -26], [101, -27]];

const enGalerie = (x) => x > -29 && x < -0.5;
const zr = (x) => interp(ZR, x) + (enGalerie(x) || (x > 24 && x < 38) ? 0 : 0.7 * (bruit(x * 0.3, 7.5) - 0.5));
const zn = (x) => interp(ZN, x) + (enGalerie(x) ? 0 : 1.6 * (bruit(x * 0.22, 3.5) - 0.5));

/** Le talus entre les lacets (à l'ouest de x = −50) : il monte doucement derrière les murs de soutènement. */
function banc(x, z, d) {
  if (x > -50.5 || z < -8.9 || z > 12.9) return 0;
  const f = Math.min(1, Math.max(0, (-50.5 - x) / 2.5));
  return f * Math.min(2.7, Math.max(0, (d - 4.3) * 1.05)) * (0.8 + 0.4 * bruit(x * 0.4, z * 0.4));
}

function hauteur(x, z, d = distRoute(x, z)) {
  if (d < 4.3) return 0;
  const r = zr(x);
  const n = zn(x);
  let h = 0;
  if (z > r) {
    const e = z - r;
    h = -2.6 * Math.min(1, e / 0.9) - 14.5 * (1 - Math.exp(-e / 4.2)) - 1.8 * bruit(x * 0.31, z * 0.31) * Math.min(1, e / 3);
  } else if (z < n) {
    const e = n - z;
    h = 3 * Math.min(1, e / 0.7) + 19 * (1 - Math.exp(-e / 4.5)) + 3.2 * (bruit(x * 0.27 + 40, z * 0.27) - 0.3) * Math.min(1, e / 2);
  }
  return h + banc(x, z, d);
}

// Les emprises bâties : ni neige au sol, ni herbe, ni rocher.
const EMPRISES = [
  [-81.2, -74.8, -25.8, -17.2], // abri de berger et son feu
  [-47.6, -39.4, 7.4, 15.6], // maison des cantonniers
  [-38.6, -29.4, 3.4, 14.6], // dépôt de sel
  [-26.6, -1.4, -6.8, 2.6], // galerie
  [5.4, 26.6, -20.6, -5.4], // chalet et terrasse
  [33.4, 42.6, -24.6, -13.4], // chapelle
  [25.6, 36.4, 1.8, 12], // belvédère
  [55, 73.6, -25.6, -6], // gare du télésiège
  [82.4, 90.6, -17.4, -13.4], // camping-car
];
const libre = (x, z, m = 0.3) => !EMPRISES.some(([x1, x2, z1, z2]) => x > x1 - m && x < x2 + m && z > z1 - m && z < z2 + m);

// ---------- Matières ----------

const AL = 1024;
const AH = 1024;
const R = {
  col: [0, 0, 512, 192],
  buvette: [0, 192, 512, 96],
  galerie: [0, 288, 512, 64],
  meteo: [512, 0, 256, 256],
  panorama: [768, 0, 256, 128],
  sos: [768, 128, 128, 128],
  chaines: [896, 128, 128, 128],
  fastlane: [512, 256, 256, 128],
  standard: [768, 256, 256, 128],
  watty: [0, 352, 256, 320],
  postales: [256, 352, 256, 160],
  menu: [256, 512, 256, 160],
  dirOuest: [512, 384, 512, 128],
  dirEst: [512, 512, 512, 128],
  charbon: [512, 640, 256, 128],
  rando: [768, 640, 256, 64],
  lacet1: [768, 704, 128, 64],
  lacet2: [896, 704, 128, 64],
  parking: [0, 672, 256, 128],
  orientation: [256, 672, 256, 256],
  exvoto: [512, 768, 256, 128],
  sentier: [768, 768, 256, 256],
  cantonnier: [0, 800, 256, 96],
  borne: [0, 896, 128, 128],
  telesiege: [128, 896, 128, 128],
  ecranPupitre: [512, 896, 256, 128],
};

let MATS = null;

function matieres() {
  if (MATS) return MATS;
  const atlas = dessiner("col-atlas", AL, AH, dessinerAtlas, false);
  MATS = {
    mat: matiere(0.95, 0),
    satine: matiere(0.6, 0.05),
    lisse: matiere(0.3, 0.05),
    tole: matiere(0.75, 0.3),
    metal: matiere(0.4, 0.7),
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    lueur: matiereLueur(0xfff0c8, 0.16),
    pierre: matiereMonde("pierreTaille"),
    beton: matiereMonde("beton"),
    toile: MAT.toile(),
    panneaux: new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.8, side: THREE.DoubleSide }),
  };
  return MATS;
}

// ---------- Outils ----------

/** Un panneau plat dont l'image vient de l'atlas (région `r`), face vers +z local. */
function panneau(c, M, r, pose, l, h) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
  c.poser(g, M.panneaux, 0xffffff, pose, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Une boîte posée entre deux points au sol (x1, z1) → (x2, z2), du niveau y sur une hauteur h. */
function boiteEntre(c, x1, z1, x2, z2, y, h, ep, couleur, mat, options = {}, rallonge = 0.04) {
  const L = Math.hypot(x2 - x1, z2 - z1) + rallonge;
  c.boite(L, h, ep, couleur, { x: (x1 + x2) / 2, y: y + h / 2, z: (z1 + z2) / 2, ry: -Math.atan2(z2 - z1, x2 - x1) }, mat, options);
}

/** Une planche de a à b (points 3D), de largeur `larg` dans le plan qui contient `haut`, d'épaisseur `ep`. */
function planche(c, a, bb, larg, ep, couleur, mat, haut = [0, 1, 0], options = {}) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...bb);
  const d = B.clone().sub(A);
  const L = d.length();
  d.normalize();
  const z = new THREE.Vector3().crossVectors(d, new THREE.Vector3(...haut));
  if (z.lengthSq() < 1e-6) z.set(0, 0, 1);
  z.normalize();
  const y = new THREE.Vector3().crossVectors(z, d).normalize();
  const e = new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().makeBasis(d, y, z));
  c.boite(L, larg, ep, couleur, { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2, z: (A.z + B.z) / 2, rx: e.x, ry: e.y, rz: e.z }, mat, options);
}

function cylindre(c, mat, couleur, x, y, z, rh, rb, h, cotes = 8, pose = {}, options = {}) {
  const g = new THREE.CylinderGeometry(rh, rb, h, cotes);
  c.poser(g, mat, couleur, { x, y: y + h / 2, z, ...pose }, options);
  g.dispose();
}

/** Un pignon triangulaire dans le plan z = cste, base de largeur `W` centrée en cx, de hauteur `hf`. */
function pignonZ(c, mat, couleur, cx, z, W, y0, hf, ep = 0.3) {
  const s = new THREE.Shape();
  s.moveTo(-W / 2, 0);
  s.lineTo(W / 2, 0);
  s.lineTo(0, hf);
  s.lineTo(-W / 2, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: ep, bevelEnabled: false });
  c.poser(g, mat, couleur, { x: cx, y: y0, z: z - ep / 2 }, { crasse: false, nuance: 0.02 });
  g.dispose();
}

const ROCHE = new THREE.DodecahedronGeometry(1, 0);
const BOULE = new THREE.IcosahedronGeometry(1, 0);
const CONE = new THREE.ConeGeometry(1, 1, 7);
const GLACON = new THREE.ConeGeometry(1, 1, 4);

function rocher(c, M, x, z, s, y = 0, ton = ROC) {
  c.poser(ROCHE, M.mat, ton, { x, y: y + s * 0.25, z, rx: c.entre(-0.4, 0.4), ry: c.hasard() * 3, rz: c.entre(-0.4, 0.4), e: [s * c.entre(1, 1.5), s * c.entre(0.55, 0.9), s * c.entre(0.9, 1.3)] }, { nuance: 0.12 });
}

/** Une plaque de neige résiduelle : un polygone irrégulier posé à plat. */
function plaqueNeige(c, M, x, z, r, y = 0.03, ton = NEIGE) {
  const pts = [];
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * c.entre(0.55, 1.15);
    pts.push(new THREE.Vector2(Math.cos(a) * rr * 1.3, Math.sin(a) * rr));
  }
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts)).rotateX(-Math.PI / 2);
  c.poser(g, M.lisse, ton, { x, y, z, ry: c.hasard() * 3 }, { crasse: false, nuance: 0.03 });
  g.dispose();
}

/** Une congère : un bourrelet de neige soufflée, allongé dans la direction `ry`. */
function congere(c, M, x, z, l, h, ry = 0, y = 0) {
  c.poser(BOULE, M.lisse, NEIGE, { x, y: y - h * 0.15, z, ry, e: [l / 2, h, h * 1.3] }, { crasse: false, nuance: 0.03 });
}

/** Un sapin : tronc et trois étages de cônes à facettes, parfois chargés de neige. */
function sapin(c, M, x, z, h, y = 0, neige = false, mort = false) {
  c.tube([x, y - 0.4, z], [x, y + h * 0.4, z], 0.06 + h * 0.022, mort ? 0x6d6458 : TRONC, M.mat, 5);
  if (mort) {
    c.tube([x, y + h * 0.4, z], [x + c.entre(-0.2, 0.2), y + h * 0.95, z], 0.05 + h * 0.012, 0x6d6458, M.mat, 4);
    for (let k = 0; k < 4; k++) {
      const yy = y + h * (0.35 + k * 0.15);
      const a = c.hasard() * 6.3;
      const lg = h * 0.18 * (1 - k * 0.18);
      c.tube([x, yy, z], [x + Math.cos(a) * lg, yy - 0.2, z + Math.sin(a) * lg], 0.035, 0x6d6458, M.mat, 3);
    }
    return;
  }
  const tons = [SAPIN, SAPIN_CLAIR, SAPIN_SOMBRE];
  for (let k = 0; k < 3; k++) {
    const r = h * 0.25 * (1 - k * 0.27);
    const hh = h * (0.44 - k * 0.04);
    const yy = y + h * 0.2 + k * h * 0.26 + hh / 2;
    c.poser(CONE, M.mat, tons[(k + Math.floor(c.hasard() * 3)) % 3], { x, y: yy, z, ry: c.hasard() * 3, e: [r, hh, r] }, { nuance: 0.07, crasse: false });
    if (neige) c.poser(CONE, M.mat, NEIGE, { x, y: yy + hh * 0.16, z, ry: c.hasard() * 3, e: [r * 0.72, hh * 0.72, r * 0.72] }, { nuance: 0.03, crasse: false });
  }
}

/** Un cairn : des pierres plates empilées, de plus en plus petites. */
function cairn(c, M, x, z, h = 1.1, y = 0) {
  let yy = y;
  const n = 5 + Math.floor(c.hasard() * 3);
  for (let i = 0; i < n; i++) {
    const s = 0.42 * (1 - i / (n + 1.5));
    const hs = (h / n) * 0.55;
    c.poser(ROCHE, M.mat, i % 2 ? PIERRE_SECHE : ROC_CLAIR, { x: x + c.entre(-0.04, 0.04), y: yy + hs, z: z + c.entre(-0.04, 0.04), ry: c.hasard() * 3, e: [s, hs, s * 0.9] }, { nuance: 0.1 });
    yy += hs * 1.7;
  }
}

/** Un jalon à neige : un piquet rayé rouge et blanc, au bord de la route. */
function jalon(c, M, x, z, penche = 0) {
  c.repere({ x, y: 0, z, rz: penche, rx: penche * 0.5 }, () => {
    for (let k = 0; k < 4; k++) c.boite(0.07, 0.48, 0.07, k % 2 ? 0xe4e0d6 : ROUGE, { y: 0.24 + k * 0.48 }, M.satine, { crasse: k === 0, nuance: 0.05 });
  });
}

/** Une épave de voiture (repère : centre au sol, avant vers +x). */
function voiture(c, M, x, y, z, ry, couleur, opts = {}) {
  const { rx = 0, rz = 0, roues = 4, vitres = true, capot = false } = opts;
  c.repere({ x, y, z, ry, rx, rz }, () => {
    c.boite(4.0, 0.62, 1.72, couleur, { y: 0.62 }, M.satine, { nuance: 0.05 });
    c.boite(2.1, 0.6, 1.56, couleur, { x: -0.25, y: 1.22 }, M.satine, { nuance: 0.05 });
    if (vitres) {
      c.boite(2.12, 0.42, 1.5, 0x2c3a40, { x: -0.25, y: 1.2 }, M.verre, { crasse: false });
    }
    c.boite(0.08, 0.2, 1.4, 0x9a9c98, { x: 2.0, y: 0.5 }, M.metal);
    c.boite(0.08, 0.2, 1.4, 0x9a9c98, { x: -2.0, y: 0.5 }, M.metal);
    if (capot) c.boite(1.2, 0.05, 1.6, couleur, { x: 1.55, y: 1.15, z: 0.1, rz: 0.9 }, M.satine);
    const places = [[1.3, 0.8], [1.3, -0.8], [-1.3, 0.8], [-1.3, -0.8]];
    for (let i = 0; i < roues; i++) {
      const [px, pz] = places[i];
      const g = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 8);
      c.poser(g, M.mat, 0x2a2a2a, { x: px, y: 0.34, z: pz, rx: Math.PI / 2 }, { crasse: false });
      g.dispose();
    }
  });
}

function chaise(c, M, x, z, ry, renversee = false, couleur = BOIS) {
  c.repere({ x, y: 0, z, ry, rx: renversee ? Math.PI / 2 - 0.1 : 0 }, () => {
    const y0 = renversee ? 0.2 : 0;
    c.boite(0.44, 0.05, 0.44, couleur, { y: y0 + 0.46 }, M.mat);
    for (const [px, pz] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) c.boite(0.04, 0.46, 0.04, couleur, { x: px, y: y0 + 0.23, z: pz }, M.mat);
    c.boite(0.44, 0.48, 0.04, couleur, { y: y0 + 0.72, z: -0.2 }, M.mat);
  });
}

function table(c, M, x, z, l, p, ry = 0, couleur = BOIS_CLAIR, h = 0.76) {
  c.repere({ x, y: 0, z, ry }, () => {
    c.boite(l, 0.06, p, couleur, { y: h - 0.03 }, M.mat);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) c.boite(0.07, h - 0.06, 0.07, couleur, { x: sx * (l / 2 - 0.1), y: (h - 0.06) / 2, z: sz * (p / 2 - 0.1) }, M.mat);
  });
}

/** Une étagère contre un mur (face vers +z local), chargée d'objets. */
function etagere(c, M, x, z, ry, l, h, tons, plein = 0.7) {
  c.repere({ x, y: 0, z, ry }, () => {
    for (const s of [-1, 1]) c.boite(0.05, h, 0.4, BOIS_GRIS, { x: s * (l / 2), y: h / 2 }, M.mat);
    const n = Math.max(2, Math.round(h / 0.45));
    for (let k = 0; k < n; k++) {
      const y = 0.12 + (k * (h - 0.2)) / (n - 1);
      c.boite(l, 0.03, 0.4, BOIS_GRIS, { y }, M.mat);
      if (k === n - 1) continue;
      for (let xx = -l / 2 + 0.15; xx < l / 2 - 0.1; xx += 0.2) {
        if (c.hasard() > plein) continue;
        const hh = c.entre(0.12, 0.28);
        c.boite(0.14, hh, 0.16, tons[Math.floor(c.hasard() * tons.length)], { x: xx, y: y + 0.015 + hh / 2, z: c.entre(-0.05, 0.05), ry: c.entre(-0.3, 0.3) }, M.satine, { crasse: false, nuance: 0.1 });
      }
    }
  });
}

/**
 * Un mur en deux parties : le bas (jusqu'à `coupe`, dans le chantier principal, obstacle pour le jeu) et le haut,
 * dans la couche `k` qui s'efface (façades sud et est) ou dans le principal (k = null).
 */
function murDouble(ctx, k, a, bb, spec) {
  const { h, ep = 0.3, coupe = 1.05, bas, haut = bas, ouvertures = [], interieur = null, breches = [] } = spec;
  mur(ctx.c, a, bb, { h: coupe, ep, couleur: bas.couleur, mat: bas.mat, interieur, batiment: ctx.b, ouvertures: ouvertures.map((o) => ({ ...o, type: o.type === "porte" ? "porte" : "vide" })) });
  mur(k ?? ctx.c, a, bb, {
    h: h - coupe,
    y0: coupe,
    ep,
    couleur: haut.couleur,
    mat: haut.mat,
    interieur,
    breches,
    ouvertures: ouvertures.map((o) => ({ ...o, vantail: undefined, bas: Math.max(0, o.bas - coupe), haut: o.haut - coupe })),
  });
}

/**
 * Un toit à deux pans, faîtage selon z (pignons au sud et au nord), dans la couche `k`. `trou` : {z1, z2, cote} un
 * pan percé (les chevrons restent). Neige sur les pans à l'ombre, glaçons au bord des égouts.
 */
function toitPignon(k, M, spec) {
  const { cx, z1, z2, W, y0, hf, deb = 0.7, couleur = BARDEAU, mat = M.mat, neige = 0.7, trou = null, glacons = true } = spec;
  const pas = 1.5;
  const n = Math.max(2, Math.round((z2 - z1) / pas));
  const dz = (z2 - z1) / n;
  for (const s of [-1, 1]) {
    const ye = y0 - (deb * hf) / W;
    for (let i = 0; i < n; i++) {
      const za = z1 + i * dz;
      const zm = za + dz / 2;
      const perce = trou && trou.cote === s && zm > trou.z1 && zm < trou.z2;
      if (perce) {
        // Les chevrons, à nu
        for (let zz = za + 0.3; zz < za + dz; zz += 0.6) planche(k, [cx, y0 + hf - 0.15, zz], [cx + s * W, y0 - 0.05, zz], 0.12, 0.1, PALETTE.boisSombre, M.mat, [0, 0, 1]);
        continue;
      }
      planche(k, [cx, y0 + hf + 0.05, zm], [cx + s * (W + deb), ye + 0.05, zm], dz + 0.02, 0.16, couleur, mat, [0, 0, 1], { nuance: 0.05, crasse: false });
      if (neige > 0 && k.hasard() < neige) {
        const t0 = k.entre(0, 0.18);
        const t1 = k.entre(0.72, 0.98);
        const yA = y0 + hf + 0.17 - (y0 + hf - ye) * t0;
        const yB = y0 + hf + 0.17 - (y0 + hf - ye) * t1;
        planche(k, [cx + s * (W + deb) * t0, yA, zm], [cx + s * (W + deb) * t1, yB, zm], dz + 0.03, 0.1, NEIGE, M.lisse, [0, 0, 1], { crasse: false, nuance: 0.03 });
      }
    }
    // La planche de rive et les glaçons au bord de l'égout
    if (glacons) {
      for (let zz = z1 + 0.3; zz < z2; zz += k.entre(0.35, 0.9)) {
        const l = k.entre(0.15, 0.6);
        k.poser(GLACON, M.lisse, 0xdfe8f0, { x: cx + s * (W + deb - 0.05), y: ye - l / 2, z: zz, rx: Math.PI, e: [0.05, l, 0.05] }, { crasse: false, nuance: 0.03 });
      }
    }
  }
  // Le faîtage
  k.boite(0.3, 0.2, z2 - z1 + 0.1, couleur, { x: cx, y: y0 + hf + 0.12, z: (z1 + z2) / 2 }, mat, { crasse: false });
}

// ---------- Le terrain ----------

function terrain(ctx) {
  const { c, M, xa, xb } = ctx;
  const PAS = 1.25;
  const x1 = Math.max(-100, xa);
  const x2 = Math.min(100, xb);
  const nx = Math.round((x2 - x1) / PAS);
  const nz = Math.round(70 / PAS);
  const V = [];
  for (let j = 0; j <= nz; j++) {
    for (let i = 0; i <= nx; i++) {
      let x = x1 + i * PAS;
      let z = -35 + j * PAS;
      const gi = Math.round((x + 100) / PAS);
      // Un léger désordre des sommets (déterministe : les tronçons voisins tombent d'accord sur leur bord commun)
      if (!enGalerie(x)) {
        if (i > 0 && i < nx) x += (hache(gi, j + 7) - 0.5) * 0.55;
        if (j > 0 && j < nz) z += (hache(gi + 3, j) - 0.5) * 0.55;
      }
      const d = distRoute(x, z);
      V.push([x, hauteur(x, z, d), z, d]);
    }
  }
  const classes = new Map();
  const ajouter = (coul, a, b2, c2) => {
    let t = classes.get(coul);
    if (!t) classes.set(coul, (t = []));
    t.push(...a.slice(0, 3), ...b2.slice(0, 3), ...c2.slice(0, 3));
  };
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const tri = (a, b2, c2) => {
    va.set(b2[0] - a[0], b2[1] - a[1], b2[2] - a[2]);
    vb.set(c2[0] - a[0], c2[1] - a[1], c2[2] - a[2]);
    const n = va.cross(vb).normalize();
    const x = (a[0] + b2[0] + c2[0]) / 3;
    const y = (a[1] + b2[1] + c2[1]) / 3;
    const z = (a[2] + b2[2] + c2[2]) / 3;
    const d = Math.min(a[3], b2[3], c2[3]);
    ajouter(classe(x, y, z, n.y, d), a, b2, c2);
  };
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const v00 = V[j * (nx + 1) + i];
      const v10 = V[j * (nx + 1) + i + 1];
      const v01 = V[(j + 1) * (nx + 1) + i];
      const v11 = V[(j + 1) * (nx + 1) + i + 1];
      if ((i + j) % 2) {
        tri(v00, v01, v10);
        tri(v10, v01, v11);
      } else {
        tri(v00, v01, v11);
        tri(v00, v11, v10);
      }
    }
  }
  // Les tranches du lot (sud, nord, et les bouts de la halte) : une coupe de roche jusqu'à y = −22
  const tranche = (p, q) => {
    const a = [p[0], p[1], p[2]];
    const b2 = [q[0], q[1], q[2]];
    const a2 = [p[0], -22, p[2]];
    const b3 = [q[0], -22, q[2]];
    for (const [u, v, w] of [[a, a2, b2], [b2, a2, b3], [a, b2, a2], [b2, b3, a2]]) {
      let t = classes.get(0x4f4a43);
      if (!t) classes.set(0x4f4a43, (t = []));
      t.push(...u, ...v, ...w);
    }
  };
  for (let i = 0; i < nx; i++) {
    tranche(V[i], V[i + 1]);
    tranche(V[nz * (nx + 1) + i], V[nz * (nx + 1) + i + 1]);
  }
  if (xa <= -100 || xb >= 100) {
    const col = xa <= -100 ? 0 : nx;
    for (let j = 0; j < nz; j++) tranche(V[j * (nx + 1) + col], V[(j + 1) * (nx + 1) + col]);
  }
  for (const [coul, pos] of classes) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    c.poser(g, M.mat, coul, {}, { crasse: false, nuance: 0 });
    g.dispose();
  }
}

/** La teinte d'un triangle du terrain : accotement, pelouse alpine, rocher, névé, aiguilles du sous-bois. */
function classe(x, y, z, ny, d) {
  const b = bruit(x * 0.18, z * 0.18);
  const b2 = bruit(x * 0.5 + 9, z * 0.5);
  if (Math.abs(y) < 0.06 && ny > 0.97) {
    if (d < 4.45) return GRAVIER;
    // Neige résiduelle à l'ombre de la paroi, et quelques plaques ailleurs
    if (z - zn(x) < 3.2 && b2 > 0.5) return NEIGE_OMBRE;
    return b > 0.62 ? HERBE_ROUSSE : b < 0.28 ? TERRE_ALPE : HERBE_ALPE;
  }
  if (y > 0) {
    if (y > 9 && ny > 0.62 && b2 > 0.35) return NEIGE;
    if (ny < 0.6) return b2 > 0.5 ? ROC : ROC_SOMBRE;
    if (y < 3.2 && x < -50) return b > 0.5 ? TALUS : HERBE_ALPE;
    return b2 > 0.55 ? ROC_CLAIR : TALUS;
  }
  if (ny < 0.5) return b2 > 0.5 ? ROC_SOMBRE : ROC;
  if (y > -3.5) return ny < 0.75 ? ROC : TALUS;
  return b > 0.5 ? AIGUILLES : 0x56603f;
}

// ---------- La route ----------

/** Un ruban le long du tracé (offsets o1 → o2), à la hauteur y, morceau par morceau (filtre par milieu). */
function ruban(ctx, i0, i1, o1, o2, y, couleur, mat, garder = () => true) {
  const pos = [];
  for (let i = i0; i < Math.min(i1, TRACE.length - 1); i++) {
    const p = TRACE[i];
    const q = TRACE[i + 1];
    if (!ctx.ici((p.x + q.x) / 2) || !garder(i)) continue;
    const A = [p.x + p.nx * o1, y, p.z + p.nz * o1];
    const B = [p.x + p.nx * o2, y, p.z + p.nz * o2];
    const C = [q.x + q.nx * o1, y, q.z + q.nz * o1];
    const D = [q.x + q.nx * o2, y, q.z + q.nz * o2];
    // Normale vers le haut quel que soit le sens : on teste le produit vectoriel
    const ux = B[0] - A[0], uz = B[2] - A[2], vx = C[0] - A[0], vz = C[2] - A[2];
    const haut = uz * vx - ux * vz > 0;
    if (haut) pos.push(...A, ...B, ...C, ...C, ...B, ...D);
    else pos.push(...A, ...C, ...B, ...C, ...D, ...B);
  }
  if (!pos.length) return;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  ctx.c.poser(g, mat, couleur, {}, { crasse: false, nuance: 0 });
  g.dispose();
}

function route(ctx) {
  const { c, M, u } = ctx;
  const N = TRACE.length;
  ruban(ctx, 0, N, -HL, HL, 0.03, ASPHALTE, M.mat);
  // Lignes de rive continues, axe en tirets (effacés par endroits)
  ruban(ctx, 0, N, -HL + 0.25, -HL + 0.4, 0.045, LIGNE, M.mat, (i) => hache(i, 1) > 0.12);
  ruban(ctx, 0, N, HL - 0.4, HL - 0.25, 0.045, LIGNE, M.mat, (i) => hache(i, 2) > 0.12);
  ruban(ctx, 0, N, -0.07, 0.07, 0.045, LIGNE, M.mat, (i) => i % 4 < 2 && hache(i, 3) > 0.25);
  // Rapiéçages et nids-de-poule
  const A = aleatoire(431);
  for (let k = 0; k < 70; k++) {
    const i = Math.floor(A() * (N - 1));
    const p = TRACE[i];
    const off = (A() - 0.5) * 4.6;
    const x = p.x + p.nx * off;
    const z = p.z + p.nz * off;
    const l = 0.6 + A() * 2.2;
    const pp = 0.4 + A() * 1.2;
    const ry = -Math.atan2(p.tz, p.tx) + (A() - 0.5) * 0.3;
    if (!ctx.ici(x)) continue;
    c.boite(l, 0.01, pp, A() < 0.7 ? ASPHALTE_RAPIECE : 0x5c5e5e, { x, y: 0.04, z, ry }, M.mat, { crasse: false, nuance: 0.04 });
  }
  // Des cailloux tombés de la paroi, plus nombreux avec l'usure
  const B = aleatoire(77);
  for (let k = 0; k < 120 * u; k++) {
    const i = Math.floor(B() * (N - 1));
    const p = TRACE[i];
    const off = -HL + B() * 2 * HL;
    const x = p.x + p.nx * off;
    if (!ctx.ici(x)) continue;
    const s = 0.08 + B() * B() * 0.4;
    c.poser(ROCHE, M.mat, B() < 0.5 ? ROC : ROC_CLAIR, { x, y: s * 0.3, z: p.z + p.nz * off, ry: B() * 3, e: [s * 1.3, s * 0.6, s] }, { nuance: 0.1 });
  }
  // Les jalons à neige des deux côtés, tous les 11 m environ (pas sous la galerie, pas contre les murs)
  for (let i = 2; i < N - 1; i += 11) {
    for (const cote of [-1, 1]) {
      const p = TRACE[i];
      const x = p.x + p.nx * cote * 3.75;
      const z = p.z + p.nz * cote * 3.75;
      if (!ctx.ici(x) || (x > -27 && x < -1)) continue;
      if (hache(i, cote + 5) < 0.2) continue;
      jalon(c, M, x, z, hache(i, cote + 9) < 0.25 * u ? 0.35 : (hache(i, 11) - 0.5) * 0.1);
    }
  }
}

// ---------- Les bords : murs de soutènement, parapets, glissières, et le relief noté pour le jeu ----------

/** Un mur de pierre le long du tracé : morceau par morceau, attribué par milieu. */
function murRoute(ctx, i0, i1, cote, off, spec) {
  const { c, b, M, u } = ctx;
  const { h, ep = 0.5, couleur = PIERRE, chaperon = true, nature = "mur", casse = 0.06 } = spec;
  for (let i = i0; i < Math.min(i1, TRACE.length - 1); i++) {
    const [x1, z1, x2, z2] = morceau(i, cote, off);
    const xm = (x1 + x2) / 2;
    const zm = (z1 + z2) / 2;
    if (!ctx.ici(xm)) continue;
    const brise = hache(i, cote * 13 + 1) < casse * u;
    const hh = brise ? h * 0.35 : h * (0.96 + hache(i, 4) * 0.08);
    boiteEntre(c, x1, z1, x2, z2, 0, hh, ep, couleur, M.pierre, { nuance: 0.03 }, 0.06);
    if (chaperon && !brise) boiteEntre(c, x1, z1, x2, z2, hh, 0.12, ep + 0.12, 0xb1aba0, M.pierre, { nuance: 0.03, crasse: false }, 0.06);
    if (brise) gravats(c, xm + (x2 - x1) * 0.2, zm, 0.8, 5, [PIERRE, ROC, ROC_CLAIR]);
    if (hh > 0.9) b.obstacle(x1, z1, x2, z2, nature);
    else if (!brise) b.obstacle(x1, z1, x2, z2, nature + " (bas)");
    // Une congère au pied, du côté de la route (le vent rabat la neige contre le mur)
    if (hache(i, 21) < 0.16) {
      const p = TRACE[i];
      congere(c, M, xm - cote * p.nx * 0.45, zm - cote * p.nz * 0.45, 1.4 + hache(i, 22) * 1.6, 0.3, -Math.atan2(z2 - z1, x2 - x1));
    }
  }
}

/** Une glissière de sécurité le long du tracé : lisse en W sur poteaux, tordue par endroits, arrachée en `trou`. */
function glissiere(ctx, i0, i1, cote, off, trou) {
  const { c, b, M, u } = ctx;
  for (let i = i0; i < Math.min(i1, TRACE.length - 1); i++) {
    let [x1, z1, x2, z2] = morceau(i, cote, off);
    const xm = (x1 + x2) / 2;
    if (!ctx.ici(xm)) continue;
    const p = TRACE[i];
    const dedans = trou && xm > trou[0] && xm < trou[1];
    if (dedans) {
      // La lisse arrachée pend au-dessus du vide, pliée vers le ravin
      if (xm < trou[0] + 1.2 || xm > trou[1] - 1.2) {
        const s = xm < (trou[0] + trou[1]) / 2 ? 1 : -1;
        const ox = cote * p.nx;
        const oz = cote * p.nz;
        planche(c, [x1, 0.62, z1], [x1 + ox * 1.6 + s * 0.6, -0.6, z1 + oz * 1.6], 0.32, 0.05, ACIER, M.tole, [p.tx, 0, p.tz]);
      }
      continue;
    }
    const tordu = hache(i, 31) < 0.18 * u;
    const dec = tordu ? (hache(i, 32) - 0.3) * 0.5 : 0;
    x1 += cote * p.nx * dec;
    z1 += cote * p.nz * dec;
    boiteEntre(c, x1, z1, x2, z2, 0.48 + (tordu ? -0.12 : 0), 0.3, 0.07, hache(i, 33) < 0.3 * u ? 0x8a6f5a : ACIER, M.tole, { nuance: 0.05 }, 0.06);
    if (i % 2 === 0) c.boite(0.1, 0.78, 0.1, ACIER, { x: x1 + cote * p.nx * 0.08, y: 0.39, z: z1 + cote * p.nz * 0.08, rz: tordu ? 0.2 : 0 }, M.tole);
    b.obstacle(x1, z1, x2, z2, "glissière");
  }
}

/** Un muret de pierre le long d'une polyligne [[x, z], …] (bord du ravin, belvédère). */
function muretLigne(ctx, pts, h, nature = "parapet") {
  const { c, b, M, u } = ctx;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, z1] = pts[i];
    const [x2, z2] = pts[i + 1];
    if (!ctx.ici((x1 + x2) / 2)) continue;
    const brise = hache(Math.round(x1 * 3), 41) < 0.05 * u;
    const hh = brise ? h * 0.4 : h;
    boiteEntre(c, x1, z1, x2, z2, 0, hh, 0.45, PIERRE, M.pierre, { nuance: 0.03 }, 0.06);
    if (!brise) boiteEntre(c, x1, z1, x2, z2, hh, 0.1, 0.56, 0xb1aba0, M.pierre, { crasse: false, nuance: 0.03 }, 0.06);
    b.obstacle(x1, z1, x2, z2, nature);
  }
}

function bords(ctx) {
  const N = TRACE.length;
  // Les lacets : soutènement du côté du talus, parapet du côté du ravin
  murRoute(ctx, 0, MQ.virage2 + 2, -1, 4.0, { h: 1.3, nature: "mur de soutènement" });
  murRoute(ctx, MQ.lacet2 - 2, indiceX(-57), 1, 4.0, { h: 1.3, nature: "mur de soutènement" });
  murRoute(ctx, 0, MQ.lacet2, 1, 4.0, { h: 0.78, nature: "parapet au-dessus du ravin", casse: 0.12 });
  // Avant la galerie, le parapet reprend là où le ravin revient vers la route
  murRoute(ctx, indiceX(-30.5, MQ.droite - 10), indiceX(-26.4, MQ.droite - 10), 1, 4.0, { h: 0.8, nature: "parapet" });
  // Après la galerie, le parapet suit la route jusqu'à l'esplanade du sommet
  murRoute(ctx, indiceX(-1.6, MQ.droite), indiceX(5, MQ.droite), 1, 4.0, { h: 0.8, nature: "parapet" });
  // Le sommet : un muret le long du bord du ravin, qui fait le tour du belvédère
  const pts = [];
  for (let x = 5; x <= 57; x += x > 24 && x < 38 ? 0.5 : 1) pts.push([x, zr(x) - 0.9]);
  muretLigne(ctx, pts, 0.85);
  // La descente : glissières tordues, arrachées là où la voiture est passée
  glissiere(ctx, indiceX(54, MQ.descente - 5), N, 1, 4.2, [81.5, 86.5]);
  // Le relief, pour le jeu : bord du ravin et pied de la paroi
  const { b, xa, xb } = ctx;
  const x1 = Math.max(-100, xa);
  const x2 = Math.min(100, xb);
  for (let x = x1; x < x2 - 0.01; x += 2) {
    b.obstacle(arr(x), arr(zr(x) - 0.3), arr(x + 2), arr(zr(x + 2) - 0.3), "bord du ravin");
    b.obstacle(arr(x), arr(zn(x) + 0.3), arr(x + 2), arr(zn(x + 2) + 0.3), "paroi rocheuse");
  }
  if (xa <= -100) {
    b.obstacle(-100, zn(-100), -100, 12.4, "talus (bout de la halte)");
    b.obstacle(-100, 19.6, -100, zr(-100), "ravin (bout de la halte)");
  }
  if (xb >= 100) {
    b.obstacle(100, zn(100), 100, 4.4, "talus (bout de la halte)");
    b.obstacle(100, 11.6, 100, zr(100), "ravin (bout de la halte)");
  }
}

// ---------- La végétation, les rochers, la neige ----------

/** Les places des sapins et des rochers (tirées une fois pour toute la halte, puis filtrées par tronçon). */
const PLACES = (() => {
  const A = aleatoire(1784);
  const sapins = [];
  const rochers = [];
  const neiges = [];
  // Le ravin : une forêt de sapins en contrebas, plus dense au fond
  for (let k = 0; k < 520; k++) {
    const x = -100 + A() * 200;
    const z = -35 + A() * 70;
    const r = zr(x);
    if (z < r + 0.8) continue;
    if (Math.abs(x - 66) < 3 && Math.abs(z - 24.5) < 3) continue; // le pied du pylône
    if (Math.abs(x - 84.5) < 3 && Math.abs(z - 19.5) < 3) continue; // la voiture
    const e = z - r;
    if (A() > 0.35 + Math.min(0.6, e / 12)) continue;
    sapins.push({ x, z, h: 6 + A() * 7 + Math.min(4, e / 3), neige: A() < 0.3, mort: A() < 0.08 });
  }
  // Quelques sapins rabougris sur les talus des lacets et sur les vires de la paroi
  for (let k = 0; k < 90; k++) {
    const x = -100 + A() * 200;
    const z = -35 + A() * 30;
    const n = zn(x);
    if (z > n - 2.5) continue;
    if (A() < 0.5) continue;
    sapins.push({ x, z, h: 3 + A() * 4, neige: A() < 0.6, mort: A() < 0.15 });
  }
  for (let k = 0; k < 40; k++) {
    const x = -99 + A() * 47;
    const z = -8 + A() * 20;
    if (distRoute(x, z) < 6.2) continue;
    sapins.push({ x, z, h: 3.5 + A() * 4, neige: A() < 0.4, mort: A() < 0.1 });
  }
  // Les blocs au pied de la paroi, et quelques-uns au bord du ravin
  for (let k = 0; k < 150; k++) {
    const x = -100 + A() * 200;
    const z = zn(x) + (A() - 0.35) * 3.2;
    if (!libre(x, z, 0.8) || distRoute(x, z) < 4.8) continue;
    rochers.push({ x, z, s: 0.4 + A() * A() * 1.6 });
  }
  for (let k = 0; k < 50; k++) {
    const x = -100 + A() * 200;
    const z = zr(x) + 1 + A() * 10;
    rochers.push({ x, z, s: 0.6 + A() * 1.5, bas: true });
  }
  // Les plaques de neige résiduelle (à l'ombre de la paroi surtout)
  for (let k = 0; k < 260; k++) {
    const x = -100 + A() * 200;
    const n = zn(x);
    const z = A() < 0.6 ? n + A() * 7 : -30 + A() * 50;
    if (z > zr(x) - 0.5 || !libre(x, z, 0.5) || distRoute(x, z) < 3.4) continue;
    neiges.push({ x, z, r: 0.5 + A() * 1.6 });
  }
  return { sapins, rochers, neiges };
})();

function nature(ctx) {
  const { c, M, u } = ctx;
  for (const s of PLACES.sapins) {
    if (!ctx.ici(s.x)) continue;
    sapin(c, M, s.x, s.z, s.h, hauteur(s.x, s.z) - 0.1, s.neige, s.mort);
  }
  for (const r of PLACES.rochers) {
    if (!ctx.ici(r.x)) continue;
    rocher(c, M, r.x, r.z, r.s, hauteur(r.x, r.z) - r.s * 0.3, c.hasard() < 0.4 ? ROC_CLAIR : ROC);
  }
  for (const n of PLACES.neiges) {
    if (!ctx.ici(n.x)) continue;
    plaqueNeige(c, M, n.x, n.z, n.r, 0.03 + hauteur(n.x, n.z), c.hasard() < 0.5 ? NEIGE : NEIGE_OMBRE);
  }
  // Des touffes d'herbe sèche sur les replats, plus nombreuses avec l'usure
  const A = aleatoire(ctx.x0 * 7 + 99);
  const pts = [];
  for (let k = 0; k < 70 + 60 * u; k++) {
    const x = ctx.xa + A() * 50;
    const z = -30 + A() * 50;
    if (!ctx.ici(x) || x < -100 || x > 100) continue;
    if (z < zn(x) + 0.5 || z > zr(x) - 0.5 || !libre(x, z, 0.3)) continue;
    const d = distRoute(x, z);
    if (d < 3.6) continue;
    pts.push([x, z, hauteur(x, z, d)]);
  }
  touffes(c, pts, PALETTE.herbeSeche);
}

// ---------- Les lacets : panneaux, oratoire, abri de berger ----------

/** Un panneau routier en bois sur deux poteaux, lisible des deux côtés. */
function panneauRoute(c, M, r, x, z, ry, l = 2.6, h = 0.65, y = 1.45) {
  c.repere({ x, y: 0, z, ry }, () => {
    for (const s of [-1, 1]) c.boite(0.12, y + h / 2 + 0.1, 0.12, PALETTE.boisSombre, { x: s * (l / 2 - 0.3), y: (y + h / 2 + 0.1) / 2 }, M.mat);
    c.boite(l + 0.1, h + 0.1, 0.06, BOIS, { y }, M.mat);
    panneau(c, M, r, { y, z: 0.035 }, l, h);
    panneau(c, M, r, { y, z: -0.035, ry: Math.PI }, l, h);
  });
}

function lacets(ctx) {
  const { c, b, M, u } = ctx;
  // Les panneaux de l'entrée A : la destination, et le chemin du retour
  if (ctx.ici(-96.5)) {
    panneauRoute(c, M, R.dirOuest, -96.5, 12.35, 0.15, 3.2, 0.8, 1.55);
    c.repere({ x: -92, y: 0, z: 12.4 }, () => {
      c.boite(0.08, 2.2, 0.08, 0x8d969a, { y: 1.1 }, M.metal);
      cylindre(c, M.satine, 0xffffff, 0, 1.95, 0.05, 0.36, 0.36, 0.04, 12, { rx: Math.PI / 2 });
      panneau(c, M, R.chaines, { y: 1.97, z: 0.08 }, 0.7, 0.7);
    });
  }
  // Les plaques des virages
  if (ctx.ici(-51)) {
    c.boite(0.08, 1.6, 0.08, 0x8d969a, { x: -50.6, y: 0.8, z: 9 }, M.metal);
    panneau(c, M, R.lacet1, { x: -50.55, y: 1.45, z: 9, ry: Math.PI / 2 }, 0.9, 0.45);
  }
  if (ctx.ici(-97.6)) {
    c.boite(0.08, 1.6, 0.08, 0x8d969a, { x: -97.6, y: 0.8, z: -5 }, M.metal);
    panneau(c, M, R.lacet2, { x: -97.55, y: 1.45, z: -5, ry: Math.PI / 2 }, 0.9, 0.45);
  }
  // L'oratoire, sur son talus entre les deux premiers lacets
  if (ctx.ici(-73.6)) {
    const ox = -73.6;
    const oz = 9;
    const oy = hauteur(ox, oz) - 0.15;
    c.repere({ x: ox, y: oy, z: oz, ry: 0.25 }, () => {
      c.boite(1.1, 0.4, 1.1, PIERRE_SECHE, { y: 0.2 }, M.pierre);
      c.boite(0.8, 1.5, 0.8, PIERRE, { y: 1.15 }, M.pierre);
      c.boite(0.5, 0.6, 0.12, 0x3b3833, { y: 1.35, z: 0.36 }, M.mat, { crasse: false });
      // La statuette, les bougies, les fleurs séchées
      cylindre(c, M.lisse, 0xe2ddd0, 0, 1.08, 0.38, 0.06, 0.09, 0.42, 6);
      c.poser(BOULE, M.lisse, 0xe2ddd0, { y: 1.55, z: 0.38, e: 0.07 }, { crasse: false });
      for (const dx of [-0.18, 0.17]) cylindre(c, M.lisse, 0xe8e0c8, dx, 1.06, 0.42, 0.025, 0.025, 0.1 + Math.abs(dx) * 0.3, 5);
      c.boite(0.12, 0.25, 0.12, 0x8f7a5a, { x: 0.3, y: 1.2, z: 0.46, rz: 0.3 }, M.mat);
      // Le petit toit à deux pans
      for (const s of [-1, 1]) c.boite(0.62, 0.07, 1.05, 0x5f5a54, { x: s * 0.27, y: 2.08, rz: -s * 0.55 }, M.mat);
      c.boite(0.08, 0.3, 0.08, FONTE, { y: 2.35 }, M.metal);
      c.boite(0.26, 0.06, 0.06, FONTE, { y: 2.42 }, M.metal);
    });
    congere(c, M, ox - 0.7, oz - 0.6, 1.4, 0.3, 0.25, oy + 0.3);
    b.lumiere(ox + 0.1, oy + 1.25, oz + 0.45, 0xffb860, 1.6, 4, "lumignon de l'oratoire");
  }
  // Les cairns du replat du berger
  if (ctx.ici(-75)) {
    for (const [x, z, h] of [[-66, -21, 1.4], [-70.5, -26, 0.9], [-88, -24.5, 1.1], [-92, -20, 0.8], [-61, -25.5, 1.0]]) cairn(c, M, x, z, h);
  }
  abriBerger(ctx);
}

function abriBerger(ctx) {
  if (!ctx.ici(-78)) return;
  const { c, b, M, u } = ctx;
  const X1 = -80.8;
  const X2 = -75.2;
  const Z1 = -25.4;
  const Z2 = -20.8;
  const H = 2.55;
  const k = b.couche("abri du berger", { x: -78, z: -23.1, l: 6.6, p: 5.6 }, 1.05, 3.7);
  const pierre = { couleur: PIERRE_SECHE, mat: M.pierre };
  // Pierre sèche : murs épais, une porte basse au sud, une fenestrelle à l'est
  murDouble(ctx, k, [X1, Z2], [X2, Z2], { h: H, ep: 0.6, bas: pierre, ouvertures: [{ u: 2.8, l: 0.95, bas: 0, haut: 2.12, type: "porte" }] });
  murDouble(ctx, k, [X2, Z2], [X2, Z1], { h: H, ep: 0.6, bas: pierre, ouvertures: [{ u: 2.3, l: 0.5, bas: 1.3, haut: 1.8, type: "vide" }] });
  mur(c, [X2, Z1], [X1, Z1], { h: H, ep: 0.6, couleur: PIERRE_SECHE, mat: M.pierre, batiment: b });
  mur(c, [X1, Z1], [X1, Z2], { h: H, ep: 0.6, couleur: PIERRE_SECHE, mat: M.pierre, batiment: b });
  // Le linteau de bois de la porte
  k.boite(1.4, 0.18, 0.62, PALETTE.boisSombre, { x: -78, y: 2.12 - 1.05 + 1.05 + 0.09, z: Z2 }, M.mat);
  // Le toit de lauzes, très plat, chargé de pierres
  for (const s of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const xx = X1 - 0.4 + (i + 0.5) * ((X2 - X1 + 0.8) / 6);
      planche(k, [xx, H + 0.75, -23.1], [xx, H - 0.05, -23.1 + s * 2.9], (X2 - X1 + 0.8) / 6 + 0.05, 0.14, i % 2 ? 0x6f6a62 : 0x7b766d, M.mat, [1, 0, 0], { nuance: 0.08, crasse: false });
    }
  }
  k.boite(X2 - X1 + 0.9, 0.16, 0.5, 0x6a655d, { x: -78, y: H + 0.82, z: -23.1 }, M.mat);
  for (let i = 0; i < 5; i++) k.poser(ROCHE, M.mat, ROC, { x: k.entre(X1, X2), y: H + 0.6, z: k.entre(-24.5, -21.8), e: [0.25, 0.14, 0.2] }, { crasse: false });
  for (let i = 0; i < 4; i++) k.boite(k.entre(0.8, 1.6), 0.06, k.entre(0.6, 1.1), NEIGE, { x: k.entre(X1, X2), y: H + 0.5, z: k.entre(-25, -23.4), rx: -0.25 }, M.lisse, { crasse: false });
  // Dedans : la paillasse, les couvertures, l'étagère du berger, le seau
  c.boite(1.9, 0.25, 0.9, 0xb49f6a, { x: -79.4, y: 0.13, z: -24.4 }, M.mat);
  c.boite(1.2, 0.08, 0.8, 0x7a4a3a, { x: -79.6, y: 0.29, z: -24.35, ry: 0.15 }, M.toile);
  c.boite(0.8, 0.07, 0.7, 0x5b6a7a, { x: -78.9, y: 0.32, z: -24.2, ry: -0.3 }, M.toile);
  etagere(c, M, -76.2, -24.75, 0, 1.2, 1.3, [0xd9d1bb, 0x8a7a5a, 0x6f5a3a, 0xa5a59d], 0.6);
  cylindre(c, M.tole, 0x8a8f90, -76.1, 0, -22.6, 0.2, 0.17, 0.32, 8);
  c.boite(0.5, 0.42, 0.4, BOIS_GRIS, { x: -80.2, y: 0.21, z: -21.6 }, M.mat);
  jonchee(c, X1 + 0.4, Z1 + 0.4, X2 - 0.4, Z2 - 0.4, 14, [0xb49f6a, 0x9c8a5a, 0x7d6143]);
  // Dehors : le feu des survivants à l'abri d'un muret, les bûches pour s'asseoir, les sacs des Charbonniers
  const fx = -77.4;
  const fz = -18.3;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    c.poser(ROCHE, M.mat, ROC_SOMBRE, { x: fx + Math.cos(a) * 0.55, y: 0.08, z: fz + Math.sin(a) * 0.55, ry: a, e: [0.17, 0.12, 0.14] }, { crasse: false });
  }
  for (let i = 0; i < 4; i++) c.tube([fx + Math.cos(i * 1.6) * 0.35, 0.05, fz + Math.sin(i * 1.6) * 0.35], [fx, 0.4, fz], 0.05, 0x3a2b20, M.mat, 5);
  c.poser(BOULE, M.mat, 0x2a2420, { x: fx, y: 0.05, z: fz, e: [0.35, 0.06, 0.35] }, { crasse: false });
  // Le trépied et la marmite
  for (let i = 0; i < 3; i++) c.tube([fx + Math.cos(i * 2.1) * 0.7, 0, fz + Math.sin(i * 2.1) * 0.7], [fx, 1.3, fz], 0.025, FONTE, M.metal, 4);
  cylindre(c, M.metal, FONTE, fx, 0.55, fz, 0.2, 0.16, 0.28, 8);
  for (const [x, z, ry] of [[-79, -17.9, 0.3], [-76.2, -17.2, -0.6]]) c.tube([x - Math.cos(ry) * 0.6, 0.2, z + Math.sin(ry) * 0.6], [x + Math.cos(ry) * 0.6, 0.2, z - Math.sin(ry) * 0.6], 0.2, 0x6a5440, M.mat, 7);
  // Le muret coupe-vent, en arc au nord-ouest du feu
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * 0.95 + i * 0.22;
    const x = fx + Math.cos(a) * 2.1;
    const z = fz + Math.sin(a) * 1.6;
    c.boite(0.8, 0.75, 0.45, PIERRE_SECHE, { x, y: 0.37, z, ry: -a + Math.PI / 2 }, M.pierre);
  }
  for (const [x, z, ry] of [[-75.4, -18.6, 0.3], [-75.1, -19.1, 1.1], [-75.8, -19.3, 2.2]]) c.boite(0.55, 0.62, 0.36, 0x2b2927, { x, y: 0.31, z, ry }, M.toile, { nuance: 0.05 });
  // La planche peinte des Charbonniers
  c.repere({ x: -74.6, y: 0, z: -19.8, ry: -0.5 }, () => {
    c.boite(0.08, 1.4, 0.08, PALETTE.boisSombre, { y: 0.7 }, M.mat);
    panneau(c, M, R.charbon, { y: 1.15, z: 0.05 }, 1.2, 0.6);
  });
  // Le bois sec sous la bâche
  for (let i = 0; i < 9; i++) c.tube([-82.2, 0.12 + Math.floor(i / 3) * 0.2, -19 + (i % 3) * 0.22], [-80.8, 0.12 + Math.floor(i / 3) * 0.2, -19 + (i % 3) * 0.22], 0.1, 0x7a5a3c, M.mat, 5);
  c.boite(1.7, 0.04, 1.0, 0x4f6a5a, { x: -81.5, y: 0.72, z: -18.8, rz: 0.12 }, M.toile);
  b.lumiere(fx, 0.6, fz, 0xff8a3d, 12, 11, "feu des survivants devant l'abri de berger");
  b.lumiere(-78, 1.2, -22.6, 0xffa050, 2, 4, "braises dans l'abri");
}

// ---------- La galerie : maison des cantonniers, dépôt de sel, galerie paravalanche ----------

function cantonniers(ctx) {
  if (!ctx.ici(-43.5)) return;
  const { c, b, M, u } = ctx;
  const X1 = -47.2;
  const X2 = -39.8;
  const Z1 = 8;
  const Z2 = 15.2;
  const H = 3.0;
  const k = b.couche("maison des cantonniers", { x: -43.5, z: 11.6, l: 8.6, p: 8.4 }, 1.05, 4.6);
  const enduit = { couleur: 0xcfc4ad, mat: M.pierre };
  const fen = (u0) => ({ u: u0, l: 1.0, bas: 1.15, haut: 2.25, type: "fenetre", bris: 0.3 + 0.6 * u, volet: "ouvert", couleurVolet: 0xa06e3c });
  // Nord (côté route, la porte), est, sud, ouest
  mur(c, [X2, Z1], [X1, Z1], { h: H, ep: 0.4, couleur: 0xcfc4ad, mat: M.pierre, batiment: b, ouvertures: [{ u: 3.7, l: 1.0, bas: 0, haut: 2.15, type: "porte", vantail: "entrouvert", couleurPorte: 0x7a5236 }, fen(6)] });
  murDouble(ctx, k, [X2, Z2], [X2, Z1], { h: H, ep: 0.4, bas: enduit, ouvertures: [fen(3.6)] });
  murDouble(ctx, k, [X1, Z2], [X2, Z2], { h: H, ep: 0.4, bas: enduit, ouvertures: [fen(2.2), fen(5.4)] });
  mur(c, [X1, Z1], [X1, Z2], { h: H, ep: 0.4, couleur: 0xcfc4ad, mat: M.pierre, batiment: b });
  // La plaque au-dessus de la porte
  panneau(c, M, R.cantonnier, { x: -43.5, y: 2.55, z: Z1 - 0.22, ry: Math.PI }, 1.6, 0.6);
  // Le toit à un pan, en tôle ondulée, qui descend vers le sud ; un trou avec l'usure
  for (let i = 0; i < 6; i++) {
    const x = X1 - 0.4 + (i + 0.5) * ((X2 - X1 + 0.8) / 6);
    if (u > 0.6 && i === 4) {
      k.boite(0.1, 0.1, 8.6, PALETTE.boisSombre, { x, y: H + 0.6, z: 11.6, rx: -0.14 }, M.mat);
      continue;
    }
    k.boite((X2 - X1 + 0.8) / 6 + 0.02, 0.06, 8.8, i % 2 ? TOLE : 0x8a7766, { x, y: H + 0.7, z: 11.6, rx: -0.14 }, M.tole, { nuance: 0.05, crasse: false });
    if (k.hasard() < 0.7) k.boite((X2 - X1 + 0.8) / 6 - 0.1, 0.08, k.entre(2.5, 6), NEIGE, { x, y: H + 0.78, z: k.entre(9.5, 12.5), rx: -0.14 }, M.lisse, { crasse: false });
  }
  if (u > 0.6) raiDeLumiere(c, [-40.6, 3.7, 11.6], [-41, 0.05, 11.2], 1.0);
  // Dedans : deux lits superposés, la table et la carte des routes, le poêle et sa lanterne, le casier
  for (const z of [10.0, 13.6]) {
    c.repere({ x: -46.3, y: 0, z }, () => {
      for (const [dx, dz] of [[-0.45, -0.9], [0.45, -0.9], [-0.45, 0.9], [0.45, 0.9]]) c.boite(0.06, 1.8, 0.06, 0x5f6f7a, { x: dx, y: 0.9, z: dz }, M.tole);
      for (const y of [0.4, 1.35]) {
        c.boite(0.9, 0.05, 1.9, 0x5f6f7a, { y }, M.tole);
        c.boite(0.82, 0.14, 1.85, 0x6c7a52, { y: y + 0.1 }, M.toile);
      }
      c.boite(0.7, 0.1, 0.9, 0x8a4a3a, { y: 0.58, z: 0.3, ry: 0.2 }, M.toile);
    });
  }
  table(c, M, -43.4, 11.6, 1.6, 0.9, 0.1, BOIS_CLAIR);
  c.boite(0.9, 0.01, 0.6, 0xd8cfb4, { x: -43.4, y: 0.775, z: 11.6, ry: 0.3 }, M.mat, { crasse: false });
  c.boite(0.3, 0.2, 0.18, 0x3b3f3a, { x: -42.9, y: 0.86, z: 11.4 }, M.satine);
  cylindre(c, M.metal, 0x8e9a9c, -43.9, 0.76, 11.8, 0.05, 0.05, 0.28, 6);
  chaise(c, M, -44.5, 11.8, Math.PI / 2);
  chaise(c, M, -42.3, 12.2, -1.2, u > 0.5);
  // Le poêle à bois et son tuyau
  c.boite(0.6, 0.75, 0.5, FONTE, { x: -40.9, y: 0.45, z: 9.0 }, M.metal);
  c.tube([-40.9, 0.85, 9.0], [-40.9, 3.0, 9.0], 0.08, FONTE, M.metal, 6);
  c.boite(0.6, 0.35, 0.4, BOIS_GRIS, { x: -40.9, y: 0.18, z: 9.8 }, M.mat);
  // La lanterne pendue au-dessus de la table
  c.tube([-43.4, 3.0, 11.6], [-43.4, 2.2, 11.6], 0.01, FONTE, M.metal, 3);
  cylindre(c, M.metal, 0xb08a48, -43.4, 1.95, 11.6, 0.09, 0.11, 0.25, 6);
  // Le casier, les gilets orange au portemanteau, les bottes
  c.boite(0.5, 1.8, 0.45, 0x6f7a6e, { x: -40.3, y: 0.9, z: 14.4 }, M.tole);
  for (let i = 0; i < 3; i++) c.boite(0.45, 0.7, 0.08, i === 1 ? 0x7a6a5a : ORANGE, { x: -42.8 + i * 0.5, y: 1.4, z: 14.92, rz: (i - 1) * 0.06 }, M.toile);
  for (let i = 0; i < 2; i++) c.boite(0.12, 0.35, 0.28, 0x2c2c2a, { x: -42.6 + i * 0.25, y: 0.18, z: 14.6 }, M.satine);
  debris(c, X1 + 0.5, Z1 + 0.5, X2 - 0.5, Z2 - 0.5, 10 * u);
  b.lumiere(-43.4, 1.9, 11.6, 0xffc070, 4, 8, "lanterne des cantonniers");
}

function depot(ctx) {
  if (!ctx.ici(-34)) return;
  const { c, b, M, u } = ctx;
  const X1 = -38.2;
  const X2 = -29.8;
  const Z1 = 4.0;
  const Z2 = 14.2;
  const H = 4.4;
  const k = b.couche("dépôt de sel", { x: -34, z: 9.1, l: 9.4, p: 11 }, 1.05, 5.6);
  // La charpente métallique : poteaux aux angles et au milieu
  for (const x of [X1, -34, X2]) for (const z of [Z1, 9.1, Z2]) {
    if (x === -34 && z === 9.1) continue;
    const enCouche = z === Z2 || x === X2;
    c.boite(0.2, enCouche ? 1.05 : H, 0.2, 0x5f6669, { x, y: (enCouche ? 1.05 : H) / 2, z }, M.tole);
    if (enCouche) k.boite(0.2, H - 1.05, 0.2, 0x5f6669, { x, y: 1.05 + (H - 1.05) / 2, z }, M.tole);
  }
  // Bardage de tôle : au sud et à l'est (coupés), à l'ouest (plein) ; le nord est ouvert sur la route
  const tole = { couleur: 0x8b8578, mat: M.tole };
  murDouble(ctx, k, [X1, Z2], [X2, Z2], { h: H, ep: 0.08, bas: tole, breches: u > 0.5 ? [{ u: 6.5, l: 2.2, profondeur: 1.6 }] : [] });
  murDouble(ctx, k, [X2, Z2], [X2, Z1], { h: H, ep: 0.08, bas: tole, ouvertures: [{ u: 7.5, l: 1.2, bas: 2.4, haut: 3.2, type: "vide" }] });
  mur(c, [X1, Z1], [X1, Z2], { h: H, ep: 0.08, couleur: 0x8b8578, mat: M.tole, batiment: b });
  // Les ondes de la tôle (lignes verticales sombres) sur l'ouest
  for (let z = Z1 + 0.3; z < Z2; z += 0.6) c.boite(0.02, H - 0.1, 0.05, 0x6f6a60, { x: X1 - 0.05, y: H / 2, z }, M.tole, { crasse: false });
  // Le toit à un pan, tôle ondulée rouillée, neige dessus
  for (let i = 0; i < 7; i++) {
    const z = Z1 - 0.5 + (i + 0.5) * ((Z2 - Z1 + 1) / 7);
    if (u > 0.75 && i === 3) continue;
    k.boite(X2 - X1 + 0.8, 0.06, (Z2 - Z1 + 1) / 7 + 0.02, i % 3 === 1 ? 0x8a6a52 : TOLE, { x: -34, y: H + 0.25, z, rz: 0.06 }, M.tole, { nuance: 0.05, crasse: false });
    if (k.hasard() < 0.6) k.boite(k.entre(3, 7), 0.08, (Z2 - Z1 + 1) / 7 - 0.1, NEIGE, { x: -34 + k.entre(-1, 1), y: H + 0.34, z, rz: 0.06 }, M.lisse, { crasse: false });
  }
  // Le chasse-neige : cabine orange délavée, grande lame biaise tournée vers la route
  c.repere({ x: -34.6, y: 0, z: 8.6, ry: Math.PI / 2 }, () => {
    const roue = (x, z) => {
      const g = new THREE.CylinderGeometry(0.56, 0.56, 0.4, 10);
      c.poser(g, M.mat, 0x252525, { x, y: 0.56, z, rx: Math.PI / 2 }, { crasse: false });
      g.dispose();
    };
    for (const x of [-1.6, 1.4]) for (const z of [-0.95, 0.95]) roue(x, z);
    c.boite(4.6, 0.35, 1.7, 0x3a3a38, { y: 0.85 }, M.tole);
    c.boite(1.6, 1.7, 2.1, ORANGE, { x: 1.3, y: 1.9 }, M.satine, { nuance: 0.05 });
    c.boite(1.0, 0.7, 2.12, 0x2c3a40, { x: 1.62, y: 2.25 }, M.verre, { crasse: false });
    c.boite(2.8, 0.9, 2.0, ORANGE, { x: -1.0, y: 1.45 }, M.satine, { nuance: 0.05 });
    // La saleuse : une trémie à l'arrière
    c.boite(1.6, 0.9, 1.8, 0x8a8f85, { x: -1.4, y: 2.35 }, M.tole);
    c.boite(0.2, 0.3, 0.2, ORANGE, { x: 1.5, y: 2.9 }, M.satine);
    c.boite(0.25, 0.12, 0.25, ORANGE, { x: 1.5, y: 3.1 }, M.lueur, { crasse: false });
    // La lame
    c.repere({ x: 3.2, y: 0.75, z: 0, ry: 0.35 }, () => {
      c.boite(0.12, 1.1, 3.2, ORANGE, { rz: 0.15 }, M.satine, { nuance: 0.04 });
      for (let i = -1; i <= 1; i++) c.boite(0.13, 0.25, 0.5, 0x2a2a28, { y: -0.35, z: i * 1.05, rz: 0.15 }, M.satine);
    });
    c.tube([2.3, 0.9, -0.4], [3.1, 0.8, -0.3], 0.08, 0x3a3a38, M.metal, 5);
    c.tube([2.3, 0.9, 0.4], [3.1, 0.8, 0.3], 0.08, 0x3a3a38, M.metal, 5);
  });
  // Le tas de sel dans sa stalle de planches
  c.poser(CONE, M.mat, 0xd9d6cd, { x: -31.6, y: 0.75, z: 11.8, e: [1.7, 1.5, 1.6], ry: 0.3 }, { crasse: false, nuance: 0.03 });
  c.boite(0.08, 1.2, 3.4, BOIS_GRIS, { x: -33.6, y: 0.6, z: 12.4 }, M.mat);
  c.boite(3.6, 1.2, 0.08, BOIS_GRIS, { x: -31.8, y: 0.6, z: 10.3 }, M.mat);
  for (let i = 0; i < 4; i++) c.boite(0.6, 0.25, 0.4, 0xd8d2bc, { x: -36.8 + (i % 2) * 0.65, y: 0.13 + Math.floor(i / 2) * 0.25, z: 13.3 }, M.toile);
  // Les chaînes à neige pendues aux crochets du mur est
  for (let i = 0; i < 3; i++) {
    const z = 5.2 + i * 0.9;
    c.repere({ x: X2 - 0.12, y: 1.25, z }, () => {
      for (const dz of [-0.28, 0.28]) c.boite(0.03, 1.0, 0.03, 0x4a4a48, { z: dz }, M.metal);
      for (let j = 0; j < 5; j++) c.boite(0.03, 0.03, 0.56, 0x4a4a48, { y: -0.45 + j * 0.22, rx: 0.3 }, M.metal);
      c.boite(0.06, 0.06, 0.1, 0x4a4a48, { y: 0.55 }, M.metal);
    });
  }
  // Les pelles et la pioche contre le mur ouest, l'établi
  for (let i = 0; i < 4; i++) {
    const z = 10.6 + i * 0.4;
    c.tube([X1 + 0.2, 0.25, z], [X1 + 0.5, 1.6, z + 0.05], 0.025, BOIS_CLAIR, M.mat, 4);
    c.boite(0.04, 0.38, 0.3, i === 2 ? ORANGE : ACIER, { x: X1 + 0.18, y: 0.2, z, rz: 0.25 }, M.tole);
  }
  c.boite(0.8, 0.06, 2.0, BOIS_GRIS, { x: X1 + 0.6, y: 0.9, z: 6.4 }, M.mat);
  for (const z of [5.6, 7.2]) c.boite(0.06, 0.88, 0.06, BOIS_GRIS, { x: X1 + 0.6, y: 0.44, z }, M.mat);
  // Le bac à sel jaune, au bord de la route
  c.boite(1.1, 0.7, 0.7, 0xb59a3a, { x: -44.2, y: 0.35, z: 2.1, ry: 0.1 }, M.satine);
  c.boite(1.15, 0.08, 0.75, 0xa48a32, { x: -44.2, y: 0.74, z: 1.95, ry: 0.1, rx: -0.4 }, M.satine);
  gravats(c, -31, 4.6, 1.0, 6 + 8 * u, [TOLE, ROC, 0xd9d6cd]);
  b.lumiere(-33.6, 2.6, 7.6, 0xffa25a, 3, 6, "brasero de fortune dans le dépôt");
  c.boite(0.5, 0.45, 0.5, FONTE, { x: -33.6, y: 0.23, z: 7.6 }, M.metal);
  for (let i = 0; i < 3; i++) c.tube([-33.75 + i * 0.15, 0.45, 7.5], [-33.6, 0.65, 7.7], 0.04, 0x3a2b20, M.mat, 4);
}

function galerie(ctx) {
  if (!ctx.ici(-14)) return;
  const { c, b, M, u } = ctx;
  const GX1 = -26;
  const GX2 = -2;
  const ZB = -6.2; // axe du mur du fond, contre la paroi
  const ZP = 1.95; // axe des piliers, côté vide
  const Y = 5.2;
  const k = b.couche("toit de la galerie", { x: -14, z: -2.4, l: 25.5, p: 10.6 }, 4.4, 9.5);
  // Le mur du fond, béton de décoffrage contre le rocher
  mur(c, [GX2, ZB], [GX1, ZB], { h: Y, ep: 0.6, couleur: BETON, mat: M.beton, batiment: b });
  c.boite(GX2 - GX1, 0.2, 0.5, 0x7c7870, { x: -14, y: 0.1, z: ZB + 0.55 }, M.beton); // le caniveau
  // Les luminaires morts le long du mur, quelques-uns pendent
  for (let x = GX1 + 2; x < GX2; x += 4) {
    const pendu = hache(Math.round(x), 51) < 0.35 * u;
    c.boite(1.0, 0.18, 0.22, 0x9aa0a0, { x, y: pendu ? 3.6 : 4.55, z: ZB + 0.45, rz: pendu ? 0.6 : 0 }, M.tole);
    if (!pendu) c.boite(0.9, 0.04, 0.14, 0xcfd8d4, { x, y: 4.45, z: ZB + 0.45 }, M.lisse, { crasse: false });
  }
  // Les catadioptres (balises) au pied du mur
  for (let x = GX1 + 1; x < GX2; x += 3) c.boite(0.1, 0.8, 0.12, 0xe2ddd2, { x, y: 0.4, z: ZB + 0.38 }, M.satine);
  // Les piliers côté vide, avec leur jambe de force
  for (let x = GX1; x <= GX2 + 0.01; x += 4) {
    c.boite(0.6, Y, 0.8, BETON, { x, y: Y / 2, z: ZP }, M.beton, { nuance: 0.03 });
    planche(c, [x, Y - 1.4, ZP - 0.3], [x, Y - 0.1, ZP - 1.6], 0.55, 0.5, BETON, M.beton, [1, 0, 0]);
    b.obstacle(x - 0.3, ZP, x + 0.3, ZP, "pilier de la galerie");
  }
  // Le chasse-roue, entre les piliers
  c.boite(GX2 - GX1, 0.35, 0.4, 0x9d998f, { x: -14, y: 0.17, z: ZP - 0.5 }, M.beton);
  // La dalle de couverture, crevée par l'éboulement au milieu
  const trou = [-15.5, -10.5];
  for (let x = GX1 - 0.6; x < GX2 + 0.6; x += 2) {
    const xm = x + 1;
    const perce = xm > trou[0] && xm < trou[1];
    if (perce) {
      // Il reste la moitié côté vide, fissurée
      k.boite(2.02, 0.6, 3.6, BETON, { x: xm, y: Y + 0.3, z: 0.6 }, M.mat, { nuance: 0.03 });
      continue;
    }
    k.boite(2.02, 0.6, 10.3, BETON, { x: xm, y: Y + 0.3, z: -2.65 }, M.mat, { nuance: 0.03 });
  }
  // La poutre de rive côté vide, les têtes de galerie aux deux bouts
  k.boite(GX2 - GX1 + 1.2, 0.9, 0.5, 0x9d998f, { x: -14, y: Y - 0.15, z: ZP + 0.4 }, M.beton);
  for (const [x, s] of [[GX1 - 0.6, -1], [GX2 + 0.6, 1]]) {
    k.boite(0.5, 1.1, 10.6, BETON, { x, y: Y + 0.55, z: -2.6 }, M.beton);
    panneau(k, M, R.galerie, { x: x + s * 0.27, y: Y + 0.5, z: -1.8, ry: (s * Math.PI) / 2 }, 4.4, 0.55);
  }
  // Sur le toit : les pierres tombées, la neige, un jeune sapin
  for (let i = 0; i < 14; i++) {
    const x = k.entre(GX1, GX2);
    if (x > trou[0] - 0.5 && x < trou[1] + 0.5) continue;
    k.poser(ROCHE, M.mat, k.hasard() < 0.5 ? ROC : ROC_CLAIR, { x, y: Y + 0.75, z: k.entre(-7, -1), ry: k.hasard() * 3, e: [k.entre(0.3, 0.9), k.entre(0.2, 0.4), k.entre(0.3, 0.8)] }, { crasse: false });
  }
  for (let i = 0; i < 8; i++) k.boite(k.entre(2, 4), 0.12, k.entre(1.5, 3.5), NEIGE, { x: k.entre(GX1 + 1, GX2 - 1), y: Y + 0.65, z: k.entre(-6.5, 0.5) }, M.lisse, { crasse: false });
  // Les glaçons sous la poutre de rive
  for (let x = GX1; x < GX2; x += k.entre(0.4, 1.2)) {
    const l = k.entre(0.2, 0.9);
    k.poser(GLACON, M.lisse, 0xdfe8f0, { x, y: Y - 0.6 - l / 2, z: ZP + 0.62, rx: Math.PI, e: [0.06, l, 0.06] }, { crasse: false });
  }
  // L'éboulement : de gros blocs entrés par le toit crevé, appuyés contre le mur du fond ; un couloir de 2 m reste
  // libre contre les piliers. Une moitié de dalle pend dans le vide.
  const A = aleatoire(99);
  for (let i = 0; i < 34; i++) {
    const t = A();
    const x = -16.6 + A() * 8.6;
    const zmax = -0.6 - 1.4 * Math.abs(x + 12.3) / 4.3;
    const z = -6 + A() * (zmax + 6);
    const haut = 0.5 + (1 - (z + 6) / 6) * 2.6;
    const s = 0.5 + t * 1.0;
    c.poser(ROCHE, M.mat, A() < 0.5 ? ROC : A() < 0.5 ? ROC_CLAIR : ROC_SOMBRE, { x, y: A() * haut, z, rx: A() * 3, ry: A() * 3, e: [s * 1.2, s * 0.8, s] }, { nuance: 0.1 });
  }
  gravats(c, -12.5, -1.0, 2.2, 18 + 14 * u, [ROC, ROC_CLAIR, BETON]);
  planche(c, [-14.8, 5.0, -6.0], [-11.6, 1.2, -3.2], 2.2, 0.55, BETON, M.beton, [1, 0, 0]);
  for (let i = 0; i < 4; i++) c.tube([-14 + i * 0.6, 4.8, -5.8], [-13.6 + i * 0.7, 3.4 + i * 0.2, -4.6], 0.02, 0x6a4a36, M.metal, 3); // les fers à béton
  for (const [x1, z1, x2, z2] of [[-16.8, ZB + 0.3, -16, -1.8], [-16, -1.8, -13.6, -0.4], [-13.6, -0.4, -10.6, -0.5], [-10.6, -0.5, -8.2, -2], [-8.2, -2, -7.6, ZB + 0.3]]) b.obstacle(x1, z1, x2, z2, "éboulement");
  raiDeLumiere(c, [-13, 5.6, -4], [-12.6, 0.05, -2.4], 2.4);
  // L'épave sous la galerie, un couvert
  voiture(c, M, -21.6, 0, -3.5, 0.08, 0x7d8a6e, { roues: 3, rz: 0.03 });
  b.obstacle(-23.6, -4.4, -19.6, -4.2, "épave");
  b.obstacle(-23.6, -2.6, -19.6, -2.4, "épave");
  // La niche d'appel d'urgence et le néon de secours sur batterie
  c.boite(1.4, 2.4, 0.3, 0xa29e95, { x: -5, y: 1.4, z: ZB + 0.42 }, M.beton);
  c.boite(0.9, 1.6, 0.05, ORANGE, { x: -5, y: 1.2, z: ZB + 0.6 }, M.satine);
  panneau(c, M, R.sos, { x: -5, y: 2.25, z: ZB + 0.63 }, 0.55, 0.55);
  c.boite(0.6, 0.1, 0.1, 0xd8f0e0, { x: -5, y: 2.75, z: ZB + 0.6 }, M.lueur, { crasse: false });
  c.boite(0.35, 0.25, 0.22, 0x2f3a33, { x: -5.6, y: 0.13, z: ZB + 0.55 }, M.satine);
  cylindre(c, M.satine, 0xa53a30, -4.4, 0, ZB + 0.55, 0.09, 0.09, 0.5, 6);
  b.lumiere(-5, 2.7, ZB + 1.2, 0xbff5d0, 3.5, 9, "néon de secours sur batterie, dans la niche d'appel d'urgence");
  // La neige soufflée aux deux bouches
  congere(c, M, GX1 + 0.6, -0.4, 4, 0.5, 0.1);
  congere(c, M, GX2 - 0.8, -4.4, 3, 0.4, -0.2);
  plaqueNeige(c, M, GX2 + 1.5, -3.4, 1.5);
  // Le panneau « chaussée glissante » et la plaque de hauteur limitée à l'entrée ouest
  c.repere({ x: GX1 - 1.4, y: 0, z: 2.5 }, () => {
    c.boite(0.08, 2.1, 0.08, 0x8d969a, { y: 1.05 }, M.metal);
    c.boite(0.6, 0.6, 0.04, 0xe8e2d4, { y: 2.1, z: 0.05, rz: Math.PI / 4 }, M.satine);
  });
}

// ---------- Le sommet : panneau du col, chalet-buvette, chapelle, belvédère ----------

function sommet(ctx) {
  const { c, b, M, u } = ctx;
  // Le panneau du col, lisible des deux côtés, et la borne
  if (ctx.ici(14)) {
    c.repere({ x: 14, y: 0, z: 4.2, ry: 0.12 }, () => {
      for (const s of [-1, 1]) c.boite(0.16, 3.0, 0.16, 0x5a4130, { x: s * 1.9, y: 1.5 }, M.mat);
      c.boite(4.3, 1.65, 0.1, 0x5a4130, { y: 2.2 }, M.mat);
      panneau(c, M, R.col, { y: 2.2, z: 0.06 }, 4.1, 1.5);
      panneau(c, M, R.col, { y: 2.2, z: -0.06, ry: Math.PI }, 4.1, 1.5);
      // Des autocollants de passage et des fanions noués aux poteaux
      for (let i = 0; i < 4; i++) c.boite(0.04, 0.25, 0.14, [ROUGE, 0x4f7a9a, 0xc79a3b, 0xe4e0d6][i], { x: 1.98, y: 2.4 - i * 0.3, z: 0.1 + i * 0.02, ry: 0.4, rz: 0.2 }, M.toile, { crasse: false });
    });
    congere(c, M, 14.3, 3.4, 4.5, 0.35, 0.1);
  }
  if (ctx.ici(17.6)) {
    c.repere({ x: 17.6, y: 0, z: 3.8 }, () => {
      c.boite(0.6, 0.15, 0.6, PIERRE, { y: 0.07 }, M.pierre);
      cylindre(c, M.pierre, 0xc9c2b2, 0, 0.1, 0, 0.22, 0.26, 1.0, 8);
      c.poser(BOULE, M.pierre, 0xc9c2b2, { y: 1.1, e: [0.22, 0.12, 0.22] }, { crasse: false });
      panneau(c, M, R.borne, { y: 0.75, z: 0.25 }, 0.3, 0.3);
    });
  }
  // La borne météo connectée qui annonce « Grand soleil » sous la neige
  if (ctx.ici(21)) {
    c.repere({ x: 21, y: 0, z: 3.6, ry: -0.15 }, () => {
      c.boite(0.5, 0.2, 0.4, BETON, { y: 0.1 }, M.beton);
      c.boite(0.35, 2.2, 0.25, 0xd8d6cf, { y: 1.2 }, M.lisse);
      c.boite(0.75, 0.95, 0.12, 0x2f3438, { y: 1.75, z: 0.1 }, M.lisse);
      panneau(c, M, R.meteo, { y: 1.75, z: 0.165 }, 0.66, 0.86);
      c.boite(0.6, 0.04, 0.4, 0x2a3446, { y: 2.45, rx: -0.4 }, M.lisse); // le petit panneau solaire
      c.tube([0, 2.3, 0], [0, 2.9, 0], 0.025, ACIER, M.metal, 4);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        c.tube([0, 2.9, 0], [Math.cos(a) * 0.22, 2.9, Math.sin(a) * 0.22], 0.012, ACIER, M.metal, 3);
        c.poser(BOULE, M.metal, ACIER, { x: Math.cos(a) * 0.22, y: 2.9, z: Math.sin(a) * 0.22, e: 0.05 });
      }
      c.boite(0.5, 0.3, 0.05, NEIGE, { y: 2.32, z: 0.05 }, M.lisse, { crasse: false });
    });
    b.lumiere(21.1, 1.75, 4.3, 0xcfe6ff, 1.6, 4, "écran de la borne météo (« Grand soleil »)");
  }
  // La manche à air en lambeaux, au bord du ravin
  if (ctx.ici(7)) {
    c.tube([7, 0, 7.2], [7, 6.2, 7.2], 0.06, 0x9aa0a0, M.metal, 6);
    c.tube([7, 6.2, 7.2], [7.6, 6.15, 7.2], 0.02, 0x9aa0a0, M.metal, 4);
    for (let i = 0; i < 4; i++) {
      const r = 0.36 - i * 0.07;
      const g = new THREE.CylinderGeometry(r - 0.035, r, 0.5, 8, 1, true);
      c.poser(g, M.toile, i % 2 ? 0xe2ddd2 : 0xc7643f, { x: 7.85 + i * 0.47, y: 6.05 - i * 0.12, z: 7.2 + i * 0.12, rz: Math.PI / 2 + 0.25, ry: -0.25 }, { crasse: false, nuance: 0.05 });
      g.dispose();
    }
    for (let i = 0; i < 3; i++) c.boite(0.5, 0.02, 0.06, 0xc7643f, { x: 9.8 + i * 0.1, y: 5.55 - i * 0.18, z: 7.7 + i * 0.12, rz: -0.6 - i * 0.2 }, M.toile, { crasse: false });
  }
  // Le belvédère : dallage, table d'orientation, longue-vue connectée, banc
  if (ctx.ici(31)) {
    c.boite(10.2, 0.05, 9.4, 0xa49e92, { x: 31, y: 0.025, z: 7.2 }, M.pierre, { crasse: false });
    c.repere({ x: 30.5, y: 0, z: 7.6 }, () => {
      c.boite(0.8, 0.9, 0.8, PIERRE, { y: 0.45 }, M.pierre);
      c.boite(1.05, 0.08, 1.05, 0xb1aba0, { y: 0.94 }, M.pierre);
      panneau(c, M, R.orientation, { y: 1.04, rx: -Math.PI / 2 + 0.25 }, 0.95, 0.95);
    });
    c.repere({ x: 33.6, y: 0, z: 10.4, ry: 0.15 }, () => {
      cylindre(c, M.metal, 0x8e9599, 0, 0, 0, 0.12, 0.18, 1.15, 8);
      c.boite(0.45, 0.4, 0.5, 0x2f6f73, { y: 1.3 }, M.satine);
      c.tube([0, 1.38, -0.1], [0, 1.52, 0.75], 0.11, 0x2f6f73, M.satine, 8);
      c.tube([0, 1.38, -0.1], [0, 1.33, -0.4], 0.07, 0x222222, M.lisse, 6);
      panneau(c, M, R.panorama, { y: 0.8, z: -0.19, ry: Math.PI }, 0.6, 0.3);
      panneau(c, M, R.panorama, { x: 0.231, y: 1.3, ry: Math.PI / 2 }, 0.48, 0.24);
    });
    // Le banc, tourné vers le vide
    c.repere({ x: 28.2, y: 0, z: 9.6 }, () => {
      c.boite(1.8, 0.06, 0.45, BOIS_GRIS, { y: 0.45 }, M.mat);
      c.boite(1.8, 0.4, 0.05, BOIS_GRIS, { y: 0.7, z: -0.22, rx: -0.15 }, M.mat);
      for (const s of [-1, 1]) c.boite(0.08, 0.45, 0.45, FONTE, { x: s * 0.75, y: 0.22 }, M.metal);
    });
    congere(c, M, 30.5, 11.2, 5, 0.35, 0.05);
  }
  // L'épave abandonnée sur l'esplanade : un couvert face à la terrasse
  if (ctx.ici(43)) {
    voiture(c, M, 43, 0, 5.2, 0.5, 0x9a5a4a, { roues: 2, rz: -0.05, capot: true });
    b.obstacle(41.4, 4.2, 44.6, 6.2, "épave");
    plaqueNeige(c, M, 44.5, 6.5, 1.2);
  }
  chalet(ctx);
  chapelle(ctx);
}

function chalet(ctx) {
  if (!ctx.ici(16)) return;
  const { c, b, M, u } = ctx;
  const X1 = 6;
  const X2 = 26;
  const Z1 = -20;
  const Z2 = -9;
  const H = 3.2;
  const k = b.couche("chalet-buvette", { x: 16, z: -13.6, l: 22.8, p: 14.2 }, 1.05, 9.2);
  const pierre = { couleur: 0x9a9284, mat: M.pierre };
  const bois = { couleur: BOIS, mat: M.mat };
  const fen = (u0, l = 1.5) => ({ u: u0, l, bas: 1.15, haut: 2.5, type: "fenetre", bris: 0.3 + 0.6 * u, croisillons: 1, traverses: 2, cadre: 0xe6e0d0, volet: u > 0.85 && u0 > 10 ? "pendu" : "ouvert", couleurVolet: VOLET });
  const murChalet = (a, bb, ouvertures, coupe) => {
    // Soubassement de pierre jusqu'à 1,05 m, madriers au-dessus (dans la couche pour le sud et l'est)
    mur(c, a, bb, { h: 1.05, ep: 0.4, couleur: pierre.couleur, mat: pierre.mat, batiment: b, interieur: { couleur: 0x8f7a5c, mat: M.mat }, ouvertures: ouvertures.map((o) => ({ ...o, type: o.type === "porte" ? "porte" : "vide" })) });
    mur(coupe ? k : c, a, bb, { h: H - 1.05, y0: 1.05, ep: 0.32, couleur: bois.couleur, mat: bois.mat, interieur: { couleur: 0x9a7f5c, mat: M.mat }, ouvertures: ouvertures.map((o) => ({ ...o, vantail: undefined, bas: Math.max(0, o.bas - 1.05), haut: o.haut - 1.05 })) });
  };
  murChalet([X1, Z2], [X2, Z2], [{ u: 4, l: 1.4, bas: 0, haut: 2.3, type: "porte", vantail: "entrouvert", couleurPorte: 0x6a4a30 }, fen(7.2, 2.2), fen(10.6, 2.2), fen(15.5), fen(18)], true);
  murChalet([X2, Z2], [X2, Z1], [{ u: 3.5, l: 1.1, bas: 0, haut: 2.2, type: "porte", vantail: "tombe" }, fen(7.6)], true);
  murChalet([X2, Z1], [X1, Z1], [{ u: 2, l: 1.1, bas: 0, haut: 2.2, type: "porte", vantail: "entrouvert", angle: 0.4 }, fen(9, 1.1)], false);
  murChalet([X1, Z1], [X1, Z2], [fen(4.5), fen(8.2)], false);
  // Les madriers croisés qui dépassent aux angles
  for (const [x, z, sx, sz, enCouche] of [[X1, Z1, -1, -1, false], [X2, Z1, 1, -1, true], [X1, Z2, -1, 1, true], [X2, Z2, 1, 1, true]]) {
    for (let y = 1.15; y < H; y += 0.28) {
      const cible = enCouche ? k : c;
      cible.boite(0.62, 0.2, 0.18, BOIS_CLAIR, { x: x + sx * 0.1, y, z: z + sz * 0.1 }, M.mat, { nuance: 0.06 });
      cible.boite(0.18, 0.2, 0.62, BOIS_CLAIR, { x: x + sx * 0.1, y: y + 0.12, z: z + sz * 0.1 }, M.mat, { nuance: 0.06 });
    }
  }
  // Les cloisons : la salle à l'ouest, la cuisine (sud-est) et la réserve (nord-est)
  mur(c, [18, Z2], [18, Z1], { h: H, ep: 0.15, couleur: 0x9a7f5c, mat: M.mat, batiment: b, ouvertures: [{ u: 2.6, l: 1.0, bas: 0, haut: 2.15, type: "porte" }] });
  mur(c, [X2, -15], [18, -15], { h: H, ep: 0.15, couleur: 0x9a7f5c, mat: M.mat, batiment: b, ouvertures: [{ u: 4, l: 1.0, bas: 0, haut: 2.15, type: "porte", vantail: "entrouvert", angle: 1.4 }] });
  // Les planchers
  c.boite(11.6, 0.04, 10.6, 0x7d6448, { x: 12, y: 0.02, z: -14.5 }, M.mat, { crasse: false });
  c.boite(7.7, 0.04, 5.6, 0xb8b2a4, { x: 22, y: 0.02, z: -12 }, M.mat, { crasse: false });
  c.boite(7.7, 0.04, 4.8, 0x6f6658, { x: 22, y: 0.02, z: -17.5 }, M.mat, { crasse: false });
  for (let z = -19.6; z < -9.4; z += 0.5) c.boite(11.6, 0.005, 0.02, 0x5a4636, { x: 12, y: 0.045, z }, M.mat, { crasse: false });

  // --- La salle : poêle, comptoir, tables, souvenirs ---
  // Le poêle de fonte, son tuyau, la caisse à bois
  c.repere({ x: 9.3, y: 0, z: -18.6 }, () => {
    for (const [dx, dz] of [[-0.3, -0.22], [0.3, -0.22], [-0.3, 0.22], [0.3, 0.22]]) c.boite(0.06, 0.2, 0.06, FONTE, { x: dx, y: 0.1, z: dz }, M.metal);
    c.boite(0.75, 0.75, 0.55, FONTE, { y: 0.57 }, M.metal);
    c.boite(0.8, 0.05, 0.6, 0x2a2b2b, { y: 0.97 }, M.metal);
    c.boite(0.3, 0.25, 0.02, 0x1f1f1f, { y: 0.55, z: 0.28 }, M.metal);
    c.boite(0.22, 0.12, 0.03, 0xff9a40, { y: 0.52, z: 0.285 }, M.lueur, { crasse: false });
    c.tube([0, 0.97, 0], [0, 2.4, 0], 0.08, FONTE, M.metal, 6);
    c.tube([0, 2.4, 0], [0, 2.6, -0.95], 0.08, FONTE, M.metal, 6);
  });
  c.boite(0.9, 0.5, 0.5, BOIS_GRIS, { x: 10.6, y: 0.25, z: -19.4 }, M.mat);
  for (let i = 0; i < 5; i++) c.tube([10.2 + i * 0.18, 0.55, -19.6], [10.25 + i * 0.18, 0.6, -19.2], 0.07, 0x7a5a3c, M.mat, 5);
  // Le comptoir en L, les tabourets, les bouteilles derrière
  c.boite(0.6, 1.08, 6.2, 0x6a4a30, { x: 15.4, y: 0.54, z: -16.3 }, M.mat);
  c.boite(0.8, 0.06, 6.4, 0x8a6a48, { x: 15.4, y: 1.11, z: -16.3 }, M.satine);
  c.boite(2.4, 1.08, 0.6, 0x6a4a30, { x: 16.6, y: 0.54, z: -13.5 }, M.mat);
  c.boite(2.6, 0.06, 0.8, 0x8a6a48, { x: 16.6, y: 1.11, z: -13.5 }, M.satine);
  for (const z of [-18.8, -17.4, -16, -14.6]) {
    const tombe = hache(Math.round(z * 3), 61) < 0.4 * u;
    c.repere({ x: 14.6, y: 0, z, rx: tombe ? Math.PI / 2 - 0.1 : 0 }, () => {
      cylindre(c, M.metal, 0x8e9599, 0, tombe ? 0.2 : 0, 0, 0.03, 0.03, 0.72, 5);
      cylindre(c, M.satine, 0x7a3a30, 0, tombe ? 0.92 : 0.72, 0, 0.19, 0.19, 0.06, 8);
    });
  }
  c.repere({ x: 15.6, y: 1.14, z: -18.4 }, () => {
    c.boite(0.35, 0.3, 0.35, 0x3a3a38, { y: 0.15 }, M.satine); // la caisse
    c.boite(0.2, 0.12, 0.05, 0x5a7a6a, { y: 0.35, z: 0.1, rx: -0.3 }, M.lisse);
  });
  for (let i = 0; i < 3; i++) c.tube([15.5, 1.14, -16.5 + i * 0.18], [15.5, 1.5, -16.5 + i * 0.18], 0.03, 0xc0c4c4, M.metal, 5); // la tireuse
  etagere(c, M, 17.65, -17.2, -Math.PI / 2, 3.2, 2.1, [0x3a5a3a, 0x7a3a2a, 0xd8c890, 0x2f4f6f, 0x8a6a3a], 0.55);
  // Les tables et les bancs, une chaise renversée
  for (const [x, z, renv] of [[8.6, -11.4, false], [11.8, -11.4, false], [8.6, -14.6, false], [11.8, -16.2, true]]) {
    if (renv) {
      c.repere({ x, y: 0, z, rz: Math.PI / 2 - 0.05 }, () => table(c, M, 0.38, 0, 1.6, 0.85, 0, BOIS_CLAIR));
      continue;
    }
    table(c, M, x, z, 1.6, 0.85, 0, BOIS_CLAIR);
    for (const s of [-1, 1]) c.boite(1.5, 0.06, 0.3, BOIS, { x, y: 0.45, z: z + s * 0.68 }, M.mat);
    for (const s of [-1, 1]) for (const t of [-1, 1]) c.boite(0.06, 0.45, 0.25, BOIS, { x: x + t * 0.6, y: 0.22, z: z + s * 0.68 }, M.mat);
    c.boite(0.25, 0.01, 0.2, 0xe4e0d6, { x: x + 0.3, y: 0.77, z: z + 0.1, ry: 0.4 }, M.mat, { crasse: false });
    cylindre(c, M.lisse, 0xd8d2c4, x - 0.3, 0.76, z - 0.15, 0.05, 0.04, 0.1, 6);
  }
  chaise(c, M, 13.4, -12.2, -0.4, true);
  // Le présentoir de souvenirs contre le mur ouest : cloches, chalets miniatures, boules à neige
  etagere(c, M, 6.42, -14, Math.PI / 2, 2.6, 1.7, [0xb59048, 0xd8d0c0, 0x9a4a3a, 0x6f8fa8, 0x7a5a3c], 0.75);
  for (let i = 0; i < 5; i++) c.poser(BOULE, M.lisse, 0xd8e6ef, { x: 6.6, y: 1.32, z: -15.1 + i * 0.5, e: 0.08 }, { crasse: false });
  // Le tourniquet de cartes postales
  c.repere({ x: 13.6, y: 0, z: -10.2, ry: 0.4 }, () => {
    c.tube([0, 0, 0], [0, 1.7, 0], 0.03, 0x8e9599, M.metal, 5);
    c.boite(0.42, 0.9, 0.42, 0x8e9599, { y: 1.15 }, M.metal);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      panneau(c, M, R.postales, { x: Math.sin(a) * 0.22, y: 1.15, z: Math.cos(a) * 0.22, ry: a }, 0.42, 0.86);
    }
  });
  for (let i = 0; i < 6; i++) c.boite(0.15, 0.005, 0.1, [0x6f9fc8, 0xe4e0d6, 0x8fb58a][i % 3], { x: 13 + c.entre(-0.8, 0.8), y: 0.05, z: -10.6 + c.entre(-0.5, 0.5), ry: c.hasard() * 3 }, M.mat, { crasse: false });
  // Le trophée de bois de cerf et l'affiche de Watty
  c.repere({ x: 11, y: 2.4, z: Z1 + 0.25 }, () => {
    c.boite(0.4, 0.5, 0.06, 0x6a4a30, {}, M.mat);
    for (const s of [-1, 1]) {
      c.tube([s * 0.08, 0.1, 0.05], [s * 0.45, 0.55, 0.1], 0.025, 0xd8cfb8, M.mat, 4);
      c.tube([s * 0.3, 0.35, 0.08], [s * 0.25, 0.65, 0.1], 0.02, 0xd8cfb8, M.mat, 4);
    }
  });
  panneau(c, M, R.watty, { x: 6.42, y: 1.9, z: -11.2, ry: Math.PI / 2 }, 0.8, 1.0);

  // --- La cuisine ---
  c.boite(1.6, 0.9, 0.7, 0x8e9599, { x: 24.6, y: 0.45, z: -14.2 }, M.metal);
  c.boite(1.6, 0.04, 0.7, 0x2a2b2b, { x: 24.6, y: 0.92, z: -14.2 }, M.metal);
  cylindre(c, M.metal, 0x9aa0a0, 24.2, 0.94, -14.3, 0.18, 0.16, 0.22, 8);
  cylindre(c, M.metal, 0x9aa0a0, 25, 0.94, -14.1, 0.14, 0.14, 0.12, 8);
  c.boite(3.2, 0.9, 0.6, 0xb8b2a4, { x: 21.8, y: 0.45, z: -9.62 }, M.lisse);
  c.boite(0.6, 0.15, 0.45, 0x9aa0a0, { x: 22.6, y: 0.86, z: -9.62 }, M.metal);
  c.repere({ x: 19.0, y: 0, z: -14.3, ry: 0 }, () => {
    c.boite(0.7, 1.8, 0.65, 0xd8d6cf, { y: 0.9 }, M.lisse);
    c.boite(0.05, 1.6, 0.65, 0xd8d6cf, { x: 0.6, y: 0.9, z: 0.3, ry: 1.1 }, M.lisse); // la porte ouverte
  });
  table(c, M, 21.6, -12.4, 1.4, 0.8, 0.2, BOIS_GRIS);
  for (let i = 0; i < 4; i++) cylindre(c, M.metal, 0x9aa0a0, 21.2 + i * 0.25, 0.79, -12.4 + (i % 2) * 0.2, 0.1, 0.09, 0.1, 6);
  for (let i = 0; i < 5; i++) c.boite(0.04, 0.3, 0.25, 0x9aa0a0, { x: 25.8, y: 1.7, z: -10.4 - i * 0.45 }, M.metal); // casseroles pendues
  // --- La réserve ---
  etagere(c, M, 22, -19.6, 0, 3.4, 2.0, [0xb59048, 0x8a3a2a, 0x6f8a5a, 0xd8d0c0, 0x5a6a7a], 0.85);
  etagere(c, M, 25.6, -17.6, -Math.PI / 2, 2.6, 2.0, [0xb59048, 0x8a3a2a, 0xd8d0c0], 0.7);
  for (const [x, z] of [[19, -19], [19.7, -19.2], [19.3, -18.3]]) cylindre(c, M.tole, 0x8a8f90, x, 0, z, 0.3, 0.3, 0.6, 10);
  for (let i = 0; i < 4; i++) c.boite(0.55, 0.3, 0.4, 0xd8cfb4, { x: 20.6 + (i % 2) * 0.6, y: 0.15 + Math.floor(i / 2) * 0.3, z: -16, ry: c.entre(-0.2, 0.2) }, M.toile);
  debris(c, X1 + 0.5, Z1 + 0.5, X2 - 0.5, Z2 - 0.5, 18 * u);
  jonchee(c, X1 + 0.5, Z1 + 0.5, 17.5, Z2 - 0.5, 8 + 10 * u, [0xd8d0c0, 0xb8a888, 0x8a7a5a]);

  // --- La terrasse panoramique ---
  c.boite(20.4, 0.06, 3.5, 0x8a7458, { x: 16, y: 0.03, z: -7.3 }, M.mat, { crasse: false });
  for (let x = 6.1; x < 26; x += 0.32) c.boite(0.02, 0.005, 3.5, 0x6a5a44, { x, y: 0.062, z: -7.3 }, M.mat, { crasse: false });
  // Le garde-corps de la terrasse (ouvert devant la porte et au bout est)
  for (let x = 6; x <= 26.01; x += 2) {
    if ((x > 9 && x < 12) || x > 23.5) continue;
    c.boite(0.12, 1.0, 0.12, BOIS_CLAIR, { x, y: 0.5, z: -5.6 }, M.mat);
    if (x + 2 <= 26 && !(x + 2 > 9 && x + 2 < 12) && x + 2 < 23.5) {
      c.boite(2, 0.08, 0.06, BOIS_CLAIR, { x: x + 1, y: 0.95, z: -5.6 }, M.mat);
      for (let t = 0.25; t < 2; t += 0.25) c.boite(0.08, 0.8, 0.03, BOIS, { x: x + t, y: 0.5, z: -5.6 }, M.mat);
    }
  }
  // Les poteaux qui portent l'avancée du toit, et la guirlande de fanions déchirés
  for (const x of [6.2, 25.8]) c.boite(0.2, 3.25, 0.2, BOIS, { x, y: 1.62, z: -5.85 }, M.mat);
  for (let i = 0; i < 28; i++) {
    if (hache(i, 71) < 0.3 * u) continue;
    const t = (i + 0.5) / 28;
    const x = 6.4 + t * 19.2;
    const y = 2.95 - Math.sin(t * Math.PI) * 0.55;
    const dechire = hache(i, 72) < 0.4;
    c.poser(GLACON, M.toile, [ROUGE, 0xc79a3b, 0x4f7a9a, 0xe4e0d6, 0x5f8a5a][i % 5], { x, y: y - 0.16, z: -5.9, rx: Math.PI, rz: (hache(i, 73) - 0.5) * 0.4, e: [0.16, dechire ? 0.16 : 0.32, 0.01] }, { crasse: false, nuance: 0.06 });
  }
  // Tables, chaises, transats, parasols troués
  for (const [x, z, renv] of [[13.6, -7.4, false], [17.6, -7.3, false], [21.4, -7.6, true]]) {
    table(c, M, x, z, 0.9, 0.9, 0.2, 0xd8d2c4);
    chaise(c, M, x - 0.7, z + 0.1, Math.PI / 2 + 0.3, renv, 0xd8d2c4);
    chaise(c, M, x + 0.75, z - 0.2, -Math.PI / 2, false, 0xd8d2c4);
    if (!renv) {
      c.tube([x, 0, z], [x, 2.3, z], 0.03, 0x9aa0a0, M.metal, 4);
      const g = new THREE.ConeGeometry(1.2, 0.5, 8, 1, true);
      c.poser(g, M.toile, hache(Math.round(x), 74) < 0.5 ? 0xb85a48 : 0xd8c890, { x, y: 2.25, z, rz: (hache(Math.round(x), 75) - 0.5) * 0.3 }, { crasse: false, nuance: 0.05 });
      g.dispose();
    } else {
      c.tube([x + 0.4, 0.1, z + 0.6], [x + 2.4, 0.15, z + 0.9], 0.03, 0x9aa0a0, M.metal, 4);
    }
  }
  for (const x of [7.6, 8.8]) {
    c.repere({ x, y: 0, z: -6.9, ry: 0.15 }, () => {
      c.boite(0.6, 0.05, 1.3, 0x8a8a7a, { y: 0.35, rx: -0.25 }, M.metal);
      c.boite(0.55, 0.04, 1.2, 0x4f7a9a, { y: 0.4, rx: -0.25 }, M.toile);
    });
  }
  // Le menu à la craie, sur son chevalet devant la porte
  c.repere({ x: 11.2, y: 0, z: -6.3, ry: -0.3 }, () => {
    for (const s of [-1, 1]) c.boite(0.05, 1.3, 0.05, BOIS, { x: s * 0.33, y: 0.62, rx: 0.15 }, M.mat);
    c.boite(0.7, 0.9, 0.03, 0x2b2b29, { y: 0.85, z: 0.06, rx: 0.15 }, M.mat);
    panneau(c, M, R.menu, { y: 0.85, z: 0.085, rx: 0.15 }, 0.64, 0.84);
  });
  // La neige : congères contre le pignon nord et à l'angle ouest, plaques sur la terrasse
  for (let i = 0; i < 5; i++) congere(c, M, X1 + 2 + i * 4, Z1 - 0.6, 3.5, 0.45, 0.05 * i);
  congere(c, M, X1 - 0.7, -14, 4, 0.45, Math.PI / 2);
  plaqueNeige(c, M, 7.5, -8.1, 0.8, 0.07);
  plaqueNeige(c, M, 24.3, -6.5, 0.7, 0.07);

  // --- Ce qui s'efface : madriers hauts, pignons, balcon, toit ---
  const W = (X2 - X1) / 2;
  const hf = 4.2;
  pignonZ(k, M.mat, BOIS, 16, Z2, X2 - X1, H, hf, 0.3);
  pignonZ(k, M.mat, BOIS, 16, Z1, X2 - X1, H, hf, 0.3);
  // La fenêtre du pignon sud (chambre du gardien) et la petite porte-fenêtre sur le balcon
  k.boite(1.6, 1.3, 0.1, 0xe6e0d0, { x: 16, y: H + 1.6, z: Z2 + 0.2 }, M.mat);
  k.boite(1.4, 1.1, 0.12, 0x2c3a40, { x: 16, y: H + 1.6, z: Z2 + 0.22 }, M.verre, { crasse: false });
  // Le balcon et son enseigne
  k.boite(14, 0.14, 1.4, BOIS, { x: 16, y: H + 0.08, z: Z2 + 0.7 }, M.mat);
  for (let x = 9.2; x <= 22.8; x += 0.26) k.boite(0.14, 0.9, 0.04, BOIS_CLAIR, { x, y: H + 0.6, z: Z2 + 1.38 }, M.mat, { nuance: 0.06 });
  k.boite(14, 0.1, 0.12, BOIS, { x: 16, y: H + 1.08, z: Z2 + 1.38 }, M.mat);
  panneau(k, M, R.buvette, { x: 16, y: H + 0.6, z: Z2 + 1.43 }, 7, 1.3);
  for (const x of [9.6, 22.4]) planche(k, [x, H - 0.7, Z2 + 0.15], [x, H, Z2 + 1.3], 0.16, 0.16, BOIS, M.mat, [1, 0, 0]);
  // Le toit à deux pans de bardeaux, très débordant au sud (au-dessus de la terrasse)
  toitPignon(k, M, { cx: 16, z1: Z1 - 1.2, z2: -5.4, W, y0: H, hf, deb: 0.9, couleur: BARDEAU, neige: 0.75, trou: u > 0.55 ? { z1: -18, z2: -15, cote: -1 } : null });
  // La cheminée du poêle, qui sort du pan ouest
  k.boite(0.5, 1.6, 0.5, PIERRE, { x: 9.3, y: H + 2.6, z: -19.5 }, M.mat);
  if (u > 0.55) raiDeLumiere(c, [13, 6.5, -16.5], [11.5, 0.05, -15.8], 1.8);

  b.lumiere(9.3, 0.8, -18.1, 0xff8a3d, 10, 11, "le poêle de la salle, rallumé (la chaleur réveille les gelés)");
}

function chapelle(ctx) {
  if (!ctx.ici(38)) return;
  const { c, b, M, u } = ctx;
  const X1 = 34;
  const X2 = 42;
  const Z1 = -24;
  const Z2 = -14;
  const H = 4.0;
  const k = b.couche("chapelle", { x: 38, z: -19, l: 9.4, p: 11.4 }, 1.05, 9.8);
  const pierre = { couleur: 0xa9a294, mat: M.pierre };
  const etroite = (u0) => ({ u: u0, l: 0.6, bas: 1.6, haut: 3.1, type: "fenetre", bris: 0.4 + 0.5 * u, croisillons: 0, traverses: 3, cadre: 0x8a8274 });
  murDouble(ctx, k, [X1, Z2], [X2, Z2], { h: H, ep: 0.6, bas: pierre, ouvertures: [{ u: 4, l: 1.5, bas: 0, haut: 2.7, type: "porte", vantail: "entrouvert", couleurPorte: 0x6a4a30, angle: 0.8 }] });
  murDouble(ctx, k, [X2, Z2], [X2, Z1], { h: H, ep: 0.6, bas: pierre, ouvertures: [etroite(3), etroite(7)] });
  mur(c, [X2, Z1], [X1, Z1], { h: H, ep: 0.6, couleur: pierre.couleur, mat: M.pierre, batiment: b });
  mur(c, [X1, Z1], [X1, Z2], { h: H, ep: 0.6, couleur: pierre.couleur, mat: M.pierre, batiment: b, ouvertures: [etroite(3), etroite(7)] });
  c.boite(7.2, 0.04, 9.2, 0x8f8a80, { x: 38, y: 0.02, z: -19 }, M.pierre, { crasse: false });
  // Les pignons, le clocheton et sa cloche, l'oculus
  pignonZ(k, M.pierre, pierre.couleur, 38, Z2, X2 - X1 + 0.6, H, 3.2, 0.6);
  pignonZ(k, M.pierre, pierre.couleur, 38, Z1, X2 - X1 + 0.6, H, 3.2, 0.6);
  k.repere({ x: 38, y: H + 3.0, z: Z2 }, () => {
    for (const s of [-1, 1]) k.boite(0.35, 1.5, 0.55, pierre.couleur, { x: s * 0.55, y: 0.75 }, M.pierre);
    k.boite(1.5, 0.3, 0.6, pierre.couleur, { y: 1.65 }, M.pierre);
    k.boite(1.1, 0.12, 0.7, 0x5f5a54, { y: 1.85 }, M.mat);
    cylindre(k, M.metal, 0x8a7040, 0, 0.55, 0, 0.12, 0.26, 0.45, 8);
    k.boite(0.06, 0.5, 0.06, FONTE, { y: 2.2 }, M.metal);
    k.boite(0.3, 0.06, 0.06, FONTE, { y: 2.3 }, M.metal);
  });
  cylindre(k, M.mat, 0x8a8274, 38, H + 1.2, Z2 + 0.32, 0.45, 0.45, 0.06, 10, { rx: Math.PI / 2 });
  cylindre(k, M.verre, 0x3a5560, 38, H + 1.2, Z2 + 0.36, 0.38, 0.38, 0.04, 10, { rx: Math.PI / 2 });
  // Le toit de lauzes, neige et glaçons ; un trou avec l'usure, d'où tombe un rai
  toitPignon(k, M, { cx: 38, z1: Z1 - 0.5, z2: Z2 + 0.5, W: (X2 - X1) / 2 + 0.3, y0: H, hf: 3.2, deb: 0.5, couleur: 0x5c5853, neige: 0.6, trou: u > 0.45 ? { z1: -21, z2: -18.5, cote: 1 } : null });
  if (u > 0.45) raiDeLumiere(c, [40, 6.4, -19.6], [39.2, 0.05, -19.4], 1.4);
  // Dedans : bancs, autel, statue, cierges, ex-voto
  for (let i = 0; i < 4; i++) {
    for (const s of [-1, 1]) {
      const z = -16.2 - i * 1.3;
      const renv = hache(i * 2 + s, 81) < 0.25 * u;
      c.repere({ x: 38 + s * 1.7, y: 0, z, ry: renv ? 0.5 : 0 }, () => {
        c.boite(2.2, 0.06, 0.35, BOIS, { y: 0.45 }, M.mat);
        c.boite(2.2, 0.45, 0.05, BOIS, { y: 0.75, z: 0.18 }, M.mat);
        for (const t of [-1, 1]) c.boite(0.06, 0.45, 0.35, BOIS, { x: t * 1.0, y: 0.22 }, M.mat);
      });
    }
  }
  c.boite(2.0, 1.0, 0.8, 0xc9c2b2, { x: 38, y: 0.5, z: -22.9 }, M.pierre);
  c.boite(2.1, 0.02, 0.85, 0xe4e0d6, { x: 38, y: 1.01, z: -22.9 }, M.toile, { crasse: false });
  for (let i = 0; i < 5; i++) cylindre(c, M.lisse, 0xe8e0c8, 37.3 + i * 0.35, 1.02, -22.8, 0.03, 0.03, 0.15 + (i % 3) * 0.08, 5);
  cylindre(c, M.lisse, 0xd8d2c4, 38, 0, -23.55, 0.2, 0.25, 1.2, 8);
  cylindre(c, M.lisse, 0xd8d2c4, 38, 1.2, -23.55, 0.12, 0.18, 0.8, 8);
  c.poser(BOULE, M.lisse, 0xd8d2c4, { x: 38, y: 2.15, z: -23.55, e: 0.16 }, { crasse: false });
  for (let i = 0; i < 3; i++) panneau(c, M, R.exvoto, { x: X1 + 0.32, y: 1.6 + (i % 2) * 0.4, z: -16.8 - i * 2.4, ry: Math.PI / 2 }, 0.5, 0.25);
  debris(c, X1 + 0.5, Z1 + 0.5, X2 - 0.5, Z2 - 0.5, 10 * u);
  // La croix de bois sur son rocher, à côté
  rocher(c, M, 43.6, -16, 0.8, 0, ROC_CLAIR);
  c.boite(0.12, 2.0, 0.12, 0x5a4130, { x: 43.6, y: 1.4, z: -16 }, M.mat);
  c.boite(0.8, 0.12, 0.12, 0x5a4130, { x: 43.6, y: 2.0, z: -16 }, M.mat);
  for (let i = 0; i < 3; i++) congere(c, M, X1 + 1.5 + i * 2.6, Z1 - 0.6, 3, 0.4);
  b.lumiere(38, 1.25, -22.7, 0xffc070, 2.5, 6, "cierges de la chapelle");
}

// ---------- La descente : gare du télésiège, file Fast Lane, parking, voiture au ravin ----------

/** La hauteur du câble du télésiège en z (de la roue motrice au pylône, puis vers la vallée). */
function cableY(z) {
  if (z < 24.5) {
    const t = (z + 16) / 40.5;
    return 6.15 + (7.25 - 6.15) * t - Math.sin(t * Math.PI) * 0.45;
  }
  return 7.25 - (z - 24.5) * 0.2;
}

/** Un siège quadriplace pendu au câble en (x, z), vu de profil (face au sud). */
function siege(c, M, x, z, couleur, bulle = false, balance = 0) {
  const yc = cableY(z);
  c.repere({ x, y: yc, z, rx: balance }, () => {
    c.boite(0.25, 0.22, 0.35, FONTE, { y: -0.05 }, M.metal); // la pince
    c.tube([0, -0.1, 0], [0, -2.0, 0], 0.045, ACIER, M.metal, 5);
    c.tube([0, -2.0, 0], [0, -2.2, 0.35], 0.04, ACIER, M.metal, 5);
    c.boite(2.0, 0.08, 0.06, ACIER, { y: -2.0 }, M.metal);
    c.boite(1.9, 0.1, 0.5, couleur, { y: -2.55, z: 0.25 }, M.satine, { crasse: false });
    c.boite(1.9, 0.55, 0.08, couleur, { y: -2.25, z: 0.0 }, M.satine, { crasse: false });
    for (const s of [-1, 1]) c.tube([s * 0.95, -2.0, 0], [s * 0.95, -2.55, 0.45], 0.03, ACIER, M.metal, 4);
    // Le garde-corps relevé et le repose-pieds
    c.tube([-0.9, -1.85, 0.5], [0.9, -1.85, 0.5], 0.025, ACIER, M.metal, 4);
    c.boite(1.6, 0.05, 0.2, ACIER, { y: -3.0, z: 0.6 }, M.metal);
    if (bulle) {
      const g = new THREE.CylinderGeometry(0.9, 0.9, 2.0, 8, 1, true, -Math.PI / 2, Math.PI);
      c.poser(g, M.verre, 0xd88a40, { y: -2.0, z: 0.2, rz: Math.PI / 2, rx: -0.5 }, { crasse: false });
      g.dispose();
      c.boite(0.9, 0.25, 0.03, 0xc79a3b, { y: -1.45, z: 0.55, rx: -0.4 }, M.satine, { crasse: false });
    }
    c.boite(1.7, 0.06, 0.4, NEIGE, { y: -2.47, z: 0.25 }, M.lisse, { crasse: false });
  });
}

function telesiege(ctx) {
  const { c, b, M, u } = ctx;
  if (ctx.ici(64)) {
    // Le quai de béton de la gare
    c.boite(18.4, 0.05, 16.6, 0x9a9a94, { x: 64.3, y: 0.025, z: -16.6 }, M.mat, { crasse: false });
    for (let x = 56; x < 73; x += 2.5) c.boite(0.04, 0.005, 16.4, 0x7f7f7a, { x, y: 0.053, z: -16.6 }, M.mat, { crasse: false });
    machinerie(ctx);
    // La charpente de la gare et la roue motrice
    for (const x of [63.2, 68.8]) for (const z of [-19.6, -12.4]) c.boite(0.35, 6.6, 0.35, 0x5f6a70, { x, y: 3.3, z }, M.tole);
    for (const x of [63.2, 68.8]) c.boite(0.4, 0.5, 7.6, 0x5f6a70, { x, y: 6.75, z: -16 }, M.tole);
    for (const z of [-19.6, -12.4]) c.boite(6.0, 0.5, 0.4, 0x5f6a70, { x: 66, y: 6.75, z }, M.tole);
    for (const s of [-1, 1]) c.tube([63.2, 0.3, -16 + s * 3.6], [63.2, 5.6, -16], 0.08, 0x5f6a70, M.tole, 4);
    const roue = new THREE.TorusGeometry(2.6, 0.13, 4, 22).rotateX(Math.PI / 2);
    c.poser(roue, M.metal, 0x8a9094, { x: 66, y: 6.1, z: -16 }, { crasse: false });
    roue.dispose();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      c.tube([66, 6.1, -16], [66 + Math.cos(a) * 2.55, 6.1, -16 + Math.sin(a) * 2.55], 0.06, 0x7a8286, M.metal, 4);
    }
    cylindre(c, M.metal, 0x5a6266, 66, 5.8, -16, 0.4, 0.4, 0.9, 8);
    c.boite(1.6, 0.9, 1.4, 0x5a6a72, { x: 66, y: 6.95, z: -16 }, M.tole);
    // Les sièges garés sous la gare, en attente d'un départ qui ne vient pas
    for (let i = 0; i < 3; i++) {
      c.repere({ x: 63.6, y: 0, z: -18.8 + i * 1.3 }, () => {
        c.boite(1.9, 0.1, 0.5, BLEU_SIEGE, { y: 0.55, ry: Math.PI / 2 }, M.satine);
        c.boite(1.9, 0.5, 0.08, BLEU_SIEGE, { x: -0.22, y: 0.85, ry: Math.PI / 2 }, M.satine);
      });
    }
    // L'auvent de la gare (il s'efface), la neige dessus, l'enseigne
    const k = b.couche("auvent du télésiège", { x: 66, z: -16, l: 11.4, p: 11 }, 3.0, 9);
    k.boite(11.2, 0.25, 10.6, TOLE, { x: 66, y: 7.65, z: -16, rx: 0.05 }, M.tole, { crasse: false });
    k.boite(11.4, 0.6, 0.12, 0xc07440, { x: 66, y: 7.4, z: -10.66 }, M.satine);
    panneau(k, M, R.telesiege, { x: 66, y: 7.4, z: -10.58 }, 0.55, 0.55);
    for (let i = 0; i < 5; i++) k.boite(k.entre(2, 5), 0.12, k.entre(2, 5), NEIGE, { x: 66 + k.entre(-3.5, 3.5), y: 7.85, z: -16 + k.entre(-3.5, 3.5) }, M.lisse, { crasse: false });
    for (let x = 60.6; x < 71.4; x += k.entre(0.4, 1)) {
      const l = k.entre(0.2, 0.7);
      k.poser(GLACON, M.lisse, 0xdfe8f0, { x, y: 7.1 - l / 2, z: -10.7, rx: Math.PI, e: [0.05, l, 0.05] }, { crasse: false });
    }
    // Le câble : deux brins qui partent de la roue vers le sud, au-dessus de la route et du ravin
    for (const x of [63.4, 68.6]) {
      let prec = [x, cableY(-16), -16];
      for (let z = -12; z <= 36; z += 4) {
        const p = [x, cableY(z), z];
        c.tube(prec, p, 0.035, 0x3a3c3e, M.metal, 4);
        prec = p;
      }
    }
    // Les sièges figés : l'un au-dessus de la route, d'autres au-dessus du vide ; des bulles « Fast Lane »
    siege(c, M, 63.4, -7.6, BLEU_SIEGE, false, 0.05);
    siege(c, M, 63.4, 1.2, BLEU_SIEGE, true, -0.08);
    siege(c, M, 63.4, 10.5, BLEU_SIEGE, false, 0.1);
    siege(c, M, 63.4, 19.5, BLEU_SIEGE, true, 0);
    siege(c, M, 63.4, 31, BLEU_SIEGE, false, 0);
    siege(c, M, 68.6, -3.6, BLEU_SIEGE, false, -0.04);
    siege(c, M, 68.6, 5.6, BLEU_SIEGE, false, 0.12);
    siege(c, M, 68.6, 15, BLEU_SIEGE, true, 0);
    siege(c, M, 68.6, 28.5, BLEU_SIEGE, false, 0.05);
    // Un siège décroché, tombé sur la route (un couvert)
    c.repere({ x: 72.2, y: 0, z: 0.8, ry: 0.6, rz: 0.15 }, () => {
      c.boite(1.9, 0.1, 0.5, BLEU_SIEGE, { y: 0.3 }, M.satine);
      c.boite(1.9, 0.55, 0.08, BLEU_SIEGE, { y: 0.6, z: -0.25, rx: -0.3 }, M.satine);
      c.tube([0, 0.3, -0.2], [0.3, 0.2, -2.1], 0.045, ACIER, M.metal, 5);
    });
    b.obstacle(71.4, 0.3, 73, 1.4, "siège tombé");
    // Le pylône planté dans le ravin
    const yp = hauteur(66, 24.5);
    c.tube([66, yp - 0.5, 24.5], [66, 7.0, 24.5], 0.4, 0x6a7276, M.tole, 8);
    c.boite(1.8, 0.4, 1.8, BETON, { x: 66, y: yp, z: 24.5 }, M.beton);
    c.boite(6.4, 0.35, 0.5, 0x6a7276, { x: 66, y: 7.0, z: 24.5 }, M.tole);
    for (const x of [63.4, 68.6]) {
      c.boite(0.25, 0.35, 1.6, 0x4a4f52, { x, y: 7.1, z: 24.5 }, M.metal);
      for (const dz of [-0.55, 0, 0.55]) cylindre(c, M.metal, 0x8a9094, x, 7.1, 24.5 + dz, 0.15, 0.15, 0.08, 8, { rz: Math.PI / 2 });
    }
    for (let y = yp + 1; y < 6.5; y += 1.3) c.boite(0.6, 0.06, 0.06, 0x6a7276, { x: 66.35, y, z: 24.5 }, M.tole); // l'échelle
    for (let i = 0; i < 4; i++) c.boite(k.entre(0.8, 1.6), 0.1, 0.4, NEIGE, { x: 66 + (i - 1.5) * 1.5, y: 7.2, z: 24.5 }, M.lisse, { crasse: false });
    // La file standard et la file Fast Lane Premium
    fastLane(ctx);
  }
}

function machinerie(ctx) {
  const { c, b, M, u } = ctx;
  const X1 = 55.5;
  const X2 = 62.5;
  const Z1 = -25.4;
  const Z2 = -18.4;
  const H = 3.4;
  const k = b.couche("machinerie du télésiège", { x: 59, z: -21.9, l: 7.8, p: 7.8 }, 1.05, 4.5);
  const beton = { couleur: 0xb2ada2, mat: M.beton };
  murDouble(ctx, k, [X1, Z2], [X2, Z2], { h: H, ep: 0.3, bas: beton, ouvertures: [{ u: 3.5, l: 1.8, bas: 1.15, haut: 2.5, type: "fenetre", bris: 0.4 + 0.5 * u, croisillons: 2, traverses: 1, cadre: 0x6a7276 }] });
  murDouble(ctx, k, [X2, Z2], [X2, Z1], { h: H, ep: 0.3, bas: beton, ouvertures: [{ u: 2.6, l: 1.1, bas: 0, haut: 2.2, type: "porte", vantail: "entrouvert", couleurPorte: 0x6a7276, angle: 1.3 }] });
  mur(c, [X2, Z1], [X1, Z1], { h: H, ep: 0.3, couleur: beton.couleur, mat: M.beton, batiment: b });
  mur(c, [X1, Z1], [X1, Z2], { h: H, ep: 0.3, couleur: beton.couleur, mat: M.beton, batiment: b });
  // Le toit plat, l'antenne, la neige
  k.boite(7.6, 0.25, 7.6, 0x8a867e, { x: 59, y: H + 0.12, z: -21.9 }, M.mat);
  for (let i = 0; i < 4; i++) k.boite(k.entre(2, 4), 0.1, k.entre(2, 4), NEIGE, { x: 59 + k.entre(-2, 2), y: H + 0.3, z: -21.9 + k.entre(-2, 2) }, M.lisse, { crasse: false });
  k.tube([56.3, H + 0.2, -24.6], [56.3, H + 2.6, -24.6], 0.03, ACIER, M.metal, 4);
  // Dedans : le moteur, le réducteur, l'armoire électrique, le pupitre dont l'écran luit encore
  c.boite(3.6, 0.3, 1.4, 0x5a5f62, { x: 58.4, y: 0.15, z: -23.6 }, M.tole);
  cylindre(c, M.tole, 0x3f6a7a, 57.3, 0.95, -23.6, 0.6, 0.6, 1.8, 10, { rz: Math.PI / 2, y: 0.95 });
  c.boite(1.2, 1.1, 1.0, 0x5a6a72, { x: 59.4, y: 0.85, z: -23.6 }, M.tole);
  cylindre(c, M.metal, 0x8a9094, 60.3, 0.9, -23.6, 0.55, 0.55, 0.15, 12, { rz: Math.PI / 2, y: 0.9 });
  c.boite(0.6, 2.0, 1.4, 0x8a9094, { x: 55.95, y: 1.0, z: -21.6 }, M.tole);
  c.boite(0.02, 1.8, 0.65, 0x9aa0a4, { x: 56.27, y: 1.0, z: -21.25 }, M.tole);
  c.repere({ x: 60.9, y: 0, z: -19.2, ry: Math.PI }, () => {
    c.boite(1.6, 0.9, 0.7, 0x6a7276, { y: 0.45 }, M.tole);
    c.boite(1.6, 0.06, 0.8, 0x4a4f52, { y: 0.95, rx: 0.3 }, M.tole);
    panneau(c, M, R.ecranPupitre, { y: 1.05, z: 0.05, rx: -Math.PI / 2 + 0.35 }, 0.7, 0.35);
    for (let i = 0; i < 6; i++) c.boite(0.06, 0.04, 0.06, [ROUGE, 0x5f8a5a, 0xc79a3b][i % 3], { x: 0.4 + (i % 3) * 0.12, y: 1.0, z: -0.1 + Math.floor(i / 3) * 0.12 }, M.satine, { crasse: false });
  });
  chaise(c, M, 60.9, -20.2, Math.PI, u > 0.5, 0x4a4f52);
  for (const [x, z] of [[56.2, -19.2], [56.9, -19.3]]) cylindre(c, M.tole, x < 56.5 ? 0x7a3a30 : 0x3f5a6a, x, 0, z, 0.3, 0.3, 0.9, 10);
  c.boite(0.6, 0.3, 0.3, ROUGE, { x: 58.2, y: 0.15, z: -19.0 }, M.tole);
  debris(c, X1 + 0.4, Z1 + 0.4, X2 - 0.4, Z2 - 0.4, 10 * u, [0x4a4a48, 0x8a8a80, 0xb2ada2]);
  b.lumiere(60.9, 1.3, -19.6, 0xffc070, 2.2, 5, "l'écran du pupitre (« Fast Lane Premium · 0 min »)");
}

function fastLane(ctx) {
  const { c, b, M, u } = ctx;
  // Le portique : deux files côte à côte, la standard (à l'ouest) et la premium (tapis rouge, potelets)
  const Z = -8.2;
  for (const x of [62.9, 65.7, 68.5]) c.boite(0.16, 2.9, 0.16, 0x5f6a70, { x, y: 1.45, z: Z }, M.tole);
  c.boite(5.9, 0.2, 0.2, 0x5f6a70, { x: 65.7, y: 2.9, z: Z }, M.tole);
  panneau(c, M, R.standard, { x: 64.3, y: 3.35, z: Z + 0.02 }, 2.6, 0.6);
  c.boite(2.7, 0.7, 0.08, 0x3a3c3e, { x: 64.3, y: 3.35, z: Z - 0.06 }, M.tole);
  panneau(c, M, R.fastlane, { x: 67.1, y: 3.4, z: Z + 0.02 }, 2.7, 0.75);
  c.boite(2.8, 0.85, 0.08, 0xc79a3b, { x: 67.1, y: 3.4, z: Z - 0.06 }, M.satine);
  // Les barrières des files
  for (const x of [62.9, 65.7, 68.5]) c.boite(0.05, 0.9, 2.8, 0x8e9599, { x, y: 0.45, z: Z - 1.6 }, M.metal);
  c.boite(2.6, 0.02, 4.0, 0x9a3a32, { x: 67.1, y: 0.04, z: Z - 0.8 }, M.mat, { crasse: false }); // le tapis rouge
  for (let i = 0; i < 4; i++) {
    const x = i < 2 ? 66.1 : 68.1;
    const z = Z + 1.2 - (i % 2) * 1.6;
    cylindre(c, M.metal, 0xb59048, x, 0, z, 0.04, 0.12, 0.95, 6);
  }
  c.tube([66.1, 0.85, Z + 1.2], [68.1, 0.75, Z + 1.2], 0.03, 0x9a3a32, M.toile, 4);
  // Les tourniquets
  for (const x of [64.3, 67.1]) {
    c.boite(0.3, 1.0, 0.5, 0x8e9599, { x: x - 0.7, y: 0.5, z: Z - 1.4 }, M.metal);
    for (let i = 0; i < 3; i++) c.tube([x - 0.55, 0.9, Z - 1.4], [x - 0.55 + Math.cos(i * 2.1) * 0.5, 0.9 + Math.sin(i * 2.1) * 0.3, Z - 1.4], 0.02, 0xc0c4c4, M.metal, 4);
  }
  plaqueNeige(c, M, 64.2, -6.6, 0.9);
  b.lumiere(67.1, 3.1, Z + 0.6, 0xffc87a, 1.8, 5, "l'enseigne Fast Lane Premium, qui luit encore sur sa batterie");
  b.obstacle(62.9, Z - 3, 62.9, Z, "barrière de file");
  b.obstacle(68.5, Z - 3, 68.5, Z, "barrière de file");
}

function parking(ctx) {
  const { c, b, M, u } = ctx;
  if (ctx.ici(86)) {
    c.boite(21.4, 0.03, 17.6, 0x9a9488, { x: 86.8, y: 0.015, z: -15.4 }, M.mat, { crasse: false });
    for (let x = 77; x < 97; x += 2.6) if (hache(Math.round(x), 91) > 0.25) c.boite(0.1, 0.01, 4.6, 0xd8d5cb, { x, y: 0.035, z: -21.6 }, M.mat, { crasse: false });
    // Le camping-car : cellule crème, bande passée, lanterneau, porte entrouverte côté sud
    c.repere({ x: 86.5, y: 0, z: -15.4 }, () => {
      for (const [x, z] of [[-2.2, -1.0], [-2.2, 1.0], [2.0, -1.0], [2.0, 1.0]]) {
        const g = new THREE.CylinderGeometry(0.38, 0.38, 0.26, 8);
        c.poser(g, M.mat, 0x252525, { x, y: 0.38, z, rx: Math.PI / 2 }, { crasse: false });
        g.dispose();
      }
      c.boite(7.0, 2.4, 2.3, 0xe2ddd0, { y: 1.75 }, M.satine, { nuance: 0.03 });
      c.boite(1.2, 1.3, 2.2, 0xe2ddd0, { x: 3.9, y: 1.15 }, M.satine);
      c.boite(0.05, 0.75, 2.0, 0x2c3a40, { x: 4.5, y: 1.4, rz: -0.2 }, M.verre, { crasse: false });
      c.boite(1.8, 0.75, 0.05, 0x2c3a40, { x: 3.5, y: 2.6, z: 0 }, M.verre, { crasse: false });
      c.boite(7.02, 0.3, 2.32, 0x6f8fa8, { y: 1.3 }, M.satine, { crasse: false });
      for (const x of [-2.2, 1.0]) c.boite(1.0, 0.6, 2.34, 0x2c3a40, { x, y: 2.2 }, M.verre, { crasse: false });
      c.boite(0.8, 2.0, 0.05, 0xd8d2c4, { x: -0.4, y: 1.5, z: 1.5, ry: 0.9 }, M.satine); // la porte ouverte
      c.boite(0.8, 0.2, 0.8, 0xd8d2c4, { x: -1.5, y: 3.05 }, M.satine);
      c.boite(5, 0.1, 1.8, NEIGE, { x: -0.3, y: 3.0 }, M.lisse, { crasse: false });
      c.boite(0.1, 1.2, 1.6, 0x4a4f52, { x: -3.6, y: 1.6 }, M.metal); // le porte-vélos vide
    });
    b.obstacle(83, -16.6, 90, -16.6, "camping-car");
    b.obstacle(83, -14.2, 85.6, -14.2, "camping-car");
    b.obstacle(87.4, -14.2, 90, -14.2, "camping-car");
    b.lumiere(86.3, 1.6, -15.4, 0xffc070, 2.5, 6, "lampe-tempête dans le camping-car");
    voiture(c, M, 80.5, 0, -20.4, 1.35, 0x6a7a8a, { roues: 2, rz: 0.04, capot: true });
    b.obstacle(80, -22.4, 81, -18.4, "épave");
    // La table de pique-nique renversée, la poubelle
    c.repere({ x: 93.2, y: 0, z: -20.5, ry: 0.3 }, () => {
      c.boite(2.0, 0.06, 0.8, BOIS_GRIS, { y: 0.75 }, M.mat);
      for (const s of [-1, 1]) c.boite(2.0, 0.05, 0.3, BOIS_GRIS, { y: 0.45, z: s * 0.7 }, M.mat);
      for (const s of [-1, 1]) c.boite(0.08, 0.75, 1.6, BOIS_GRIS, { x: s * 0.8, y: 0.37 }, M.mat);
    });
    c.repere({ x: 95.6, y: 0, z: -12.6, rz: Math.PI / 2 - 0.05 }, () => cylindre(c, M.tole, 0x5f7a5a, 0, -0.3, 0, 0.3, 0.27, 0.9, 8));
    jonchee(c, 95.6, -13.6, 97.4, -11.6, 10, [0xd8d0c0, 0x8a7a5a, 0x6f8fa8]);
  }
  // La borne de stationnement connectée
  if (ctx.ici(77.2)) {
    c.repere({ x: 77.2, y: 0, z: -7.6, ry: -0.2 }, () => {
      c.boite(0.4, 1.5, 0.3, 0x5a6a72, { y: 0.75 }, M.tole);
      panneau(c, M, R.parking, { y: 1.2, z: 0.16 }, 0.38, 0.19);
      c.boite(0.45, 0.06, 0.35, NEIGE, { y: 1.53 }, M.lisse, { crasse: false });
    });
    // Le panneau d'information du sentier, sous son petit toit
    c.repere({ x: 79.6, y: 0, z: -8.3, ry: 0.05 }, () => {
      for (const s of [-1, 1]) c.boite(0.12, 2.4, 0.12, PALETTE.boisSombre, { x: s * 0.9, y: 1.2 }, M.mat);
      c.boite(1.8, 1.2, 0.06, BOIS, { y: 1.45 }, M.mat);
      panneau(c, M, R.sentier, { y: 1.45, z: 0.035 }, 1.7, 1.1);
      for (const s of [-1, 1]) c.boite(1.1, 0.06, 0.6, BARDEAU, { x: s * 0.5, y: 2.45, rz: -s * 0.35 }, M.mat);
    });
  }
  // Le poteau de balisage du sentier, et les cairns qui montent vers la paroi
  if (ctx.ici(96.4)) {
    c.boite(0.12, 2.6, 0.12, PALETTE.boisSombre, { x: 96.4, y: 1.3, z: -9.2 }, M.mat);
    for (let i = 0; i < 3; i++) panneau(c, M, R.rando, { x: 96.4 + (i === 1 ? -0.4 : 0.4), y: 2.3 - i * 0.32, z: -9.12, ry: i === 1 ? Math.PI : 0 }, 0.9, 0.25);
    for (const [x, z, h] of [[92.5, -25, 1.0], [95.5, -26.2, 1.3], [98.5, -24, 0.9]]) cairn(c, M, x, z, h, Math.max(0, hauteur(x, z)));
  }
  // Le panneau routier de la sortie B
  if (ctx.ici(96.5)) panneauRoute(c, M, R.dirEst, 96.5, 4.0, -0.25, 3.2, 0.8, 1.55);
  // La voiture tombée dans le ravin, sur le toit contre les sapins
  if (ctx.ici(84.5)) {
    const y = hauteur(84.5, 19.5);
    voiture(c, M, 84.5, y + 1.55, 19.5, 1.9, 0x8a6a4a, { rz: Math.PI - 0.35, rx: 0.2, roues: 3 });
    gravats(c, 84, 16.5, 1.4, 8, [ROC, ROC_CLAIR, 0x8a6a4a], hauteur(84, 16.5));
    // Les traces de pneus qui vont vers le trou de la glissière
    for (let i = 0; i < 5; i++) {
      const t = i / 5;
      c.boite(1.4, 0.005, 0.25, 0x2f3133, { x: 79 + t * 6.5, y: 0.05, z: 4.6 + t * 4.4, ry: -0.6 }, M.mat, { crasse: false });
    }
  }
}

// ---------- L'atlas des enseignes et affiches ----------

function texte(g, t, x, y, taille, couleur, { police = "bold", fonte = "'Avenir Next Condensed', 'Futura', sans-serif", align = "center", max } = {}) {
  g.font = `${police} ${taille}px ${fonte}`;
  g.fillStyle = couleur;
  g.textAlign = align;
  g.textBaseline = "middle";
  g.fillText(t, x, y, max);
}

function salir(g, a, l, h, n = 8, force = 0.18) {
  for (let i = 0; i < n; i++) {
    const x = a() * l;
    const y = a() * h;
    const r = 6 + a() * 26;
    const d = g.createRadialGradient(x, y, 0, x, y, r);
    d.addColorStop(0, `rgba(60, 50, 40, ${force})`);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

function region(g, r, trace) {
  const [x, y, l, h] = r;
  g.save();
  g.translate(x, y);
  g.beginPath();
  g.rect(0, 0, l, h);
  g.clip();
  trace(l, h);
  g.restore();
}

function soleil(g, x, y, r, couleur = "#f2c14a") {
  g.fillStyle = couleur;
  g.beginPath();
  g.arc(x, y, r, 0, 7);
  g.fill();
  g.strokeStyle = couleur;
  g.lineWidth = r * 0.18;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.beginPath();
    g.moveTo(x + Math.cos(a) * r * 1.3, y + Math.sin(a) * r * 1.3);
    g.lineTo(x + Math.cos(a) * r * 1.75, y + Math.sin(a) * r * 1.75);
    g.stroke();
  }
}

function eclair(g, x, y, s, couleur) {
  g.fillStyle = couleur;
  g.beginPath();
  g.moveTo(x + 0.1 * s, y - 0.5 * s);
  g.lineTo(x - 0.3 * s, y + 0.08 * s);
  g.lineTo(x, y + 0.08 * s);
  g.lineTo(x - 0.12 * s, y + 0.5 * s);
  g.lineTo(x + 0.3 * s, y - 0.1 * s);
  g.lineTo(x, y - 0.1 * s);
  g.closePath();
  g.fill();
}

/** Watty, la pile souriante de la Compagnie. */
function watty(g, x, y, s) {
  g.fillStyle = "#c79a3b";
  g.fillRect(x - s * 0.3, y - s * 0.5, s * 0.6, s);
  g.fillStyle = "#8a8f90";
  g.fillRect(x - s * 0.12, y - s * 0.62, s * 0.24, s * 0.12);
  g.fillStyle = "#2b2b29";
  g.beginPath();
  g.arc(x - s * 0.1, y - s * 0.15, s * 0.05, 0, 7);
  g.arc(x + s * 0.1, y - s * 0.15, s * 0.05, 0, 7);
  g.fill();
  g.strokeStyle = "#2b2b29";
  g.lineWidth = s * 0.05;
  g.beginPath();
  g.arc(x, y, s * 0.15, 0.2, Math.PI - 0.2);
  g.stroke();
}

function dessinerAtlas(g) {
  const a = aleatoire(1784);
  g.fillStyle = "#777";
  g.fillRect(0, 0, AL, AH);
  // Le panneau du col
  region(g, R.col, (l, h) => {
    g.fillStyle = "#5b3f2c";
    g.fillRect(0, 0, l, h);
    g.strokeStyle = "#efe6d2";
    g.lineWidth = 6;
    g.strokeRect(10, 10, l - 20, h - 20);
    g.fillStyle = "#efe6d2";
    g.beginPath();
    g.moveTo(40, 150);
    g.lineTo(80, 70);
    g.lineTo(100, 100);
    g.lineTo(120, 60);
    g.lineTo(160, 150);
    g.closePath();
    g.fill();
    g.fillStyle = "#5b3f2c";
    g.beginPath();
    g.moveTo(80, 70);
    g.lineTo(72, 88);
    g.lineTo(88, 86);
    g.closePath();
    g.fill();
    texte(g, "COL DU", 330, 52, 34, "#efe6d2");
    texte(g, "GRAND-VENT", 330, 100, 58, "#efe6d2", { max: 320 });
    texte(g, "Altitude 1 784 m", 330, 150, 30, "#efe6d2", { police: "italic" });
    salir(g, a, l, h, 10, 0.25);
  });
  region(g, R.buvette, (l, h) => {
    g.fillStyle = "#7a5636";
    g.fillRect(0, 0, l, h);
    for (let y = 0; y < h; y += 12) {
      g.fillStyle = `rgba(0,0,0,${0.05 + a() * 0.08})`;
      g.fillRect(0, y, l, 2);
    }
    texte(g, "BUVETTE DU GRAND-VENT", l / 2, 40, 44, "#f0e2c0", { max: l - 30 });
    texte(g, "chocolat chaud · génépi · panorama augmenté", l / 2, 76, 22, "#e8d6b0", { police: "italic", fonte: "Georgia, serif" });
    salir(g, a, l, h, 8);
  });
  region(g, R.galerie, (l, h) => {
    g.fillStyle = "#d8d4c8";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#2b2b29";
    g.fillRect(0, 0, l, 6);
    g.fillRect(0, h - 6, l, 6);
    texte(g, "GALERIE DES COMBES · 312 m", l / 2, h / 2, 36, "#2b2b29");
    salir(g, a, l, h, 10, 0.3);
  });
  // L'écran de la borne météo
  region(g, R.meteo, (l, h) => {
    const d = g.createLinearGradient(0, 0, 0, h);
    d.addColorStop(0, "#3f8fd0");
    d.addColorStop(1, "#8fd0f0");
    g.fillStyle = d;
    g.fillRect(0, 0, l, h);
    soleil(g, l / 2, 80, 34);
    texte(g, "GRAND SOLEIL", l / 2, 150, 30, "#ffffff");
    texte(g, "22 °C", l / 2, 188, 34, "#ffffff");
    texte(g, "Risque de neige : 0 %", l / 2, 226, 18, "#eef6ff", { police: "" });
    g.fillStyle = "rgba(255,255,255,0.25)";
    for (let i = 0; i < 4; i++) g.fillRect(20 + a() * 200, a() * h, 2, 30 + a() * 60);
  });
  region(g, R.panorama, (l, h) => {
    g.fillStyle = "#2f6f73";
    g.fillRect(0, 0, l, h);
    texte(g, "PANORAMA AUGMENTÉ", l / 2 + 20, 34, 24, "#e9dfc6", { max: l - 70 });
    texte(g, "insérez 2 Wh", l / 2 + 20, 72, 30, "#c79a3b");
    texte(g, "vue garantie sans nuage*", l / 2 + 20, 104, 15, "#e9dfc6", { police: "italic" });
    watty(g, 34, 66, 56);
  });
  region(g, R.sos, (l, h) => {
    g.fillStyle = "#e9dfc6";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#c8362b";
    g.fillRect(0, 0, l, 50);
    texte(g, "SOS", l / 2, 27, 38, "#ffffff");
    texte(g, "Appel d'urgence", l / 2, 70, 15, "#2b2b29");
    texte(g, "réservé aux", l / 2, 92, 15, "#2b2b29", { police: "" });
    texte(g, "abonnés Sérénité+", l / 2, 112, 15, "#2b2b29", { police: "" });
  });
  region(g, R.chaines, (l, h) => {
    g.fillStyle = "#cfcfcf";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#2a5d9a";
    g.beginPath();
    g.arc(l / 2, h / 2, 60, 0, 7);
    g.fill();
    g.strokeStyle = "#ffffff";
    g.lineWidth = 5;
    g.beginPath();
    g.arc(l / 2, h / 2, 30, 0, 7);
    g.stroke();
    for (let i = 0; i < 8; i++) {
      const t = (i / 8) * Math.PI * 2;
      g.beginPath();
      g.moveTo(l / 2 + Math.cos(t) * 30, h / 2 + Math.sin(t) * 30);
      g.lineTo(l / 2 + Math.cos(t + 0.4) * 30, h / 2 + Math.sin(t + 0.4) * 30);
      g.stroke();
    }
  });
  region(g, R.fastlane, (l, h) => {
    const d = g.createLinearGradient(0, 0, l, 0);
    d.addColorStop(0, "#c8362b");
    d.addColorStop(1, "#c79a3b");
    g.fillStyle = d;
    g.fillRect(0, 0, l, h);
    eclair(g, 34, 62, 70, "#fff4c8");
    texte(g, "FAST LANE", 150, 40, 40, "#fff4c8");
    texte(g, "PREMIUM", 150, 78, 30, "#fff4c8");
    texte(g, "attente : 0 min · 3 Wh", 150, 110, 18, "#ffffff", { police: "" });
  });
  region(g, R.standard, (l, h) => {
    g.fillStyle = "#5a6266";
    g.fillRect(0, 0, l, h);
    texte(g, "File standard", l / 2, 44, 32, "#e4e0d6");
    texte(g, "attente estimée : 45 min", l / 2, 88, 20, "#c9c5ba", { police: "" });
    salir(g, a, l, h, 6, 0.3);
  });
  // L'affiche de Watty
  region(g, R.watty, (l, h) => {
    g.fillStyle = "#e9dfc6";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#2f6f73";
    g.fillRect(0, 0, l, 60);
    texte(g, "AU CHAUD AVEC", l / 2, 30, 26, "#e9dfc6");
    watty(g, l / 2, 150, 110);
    g.strokeStyle = "#c8362b";
    g.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(60 + i * 60, 240);
      g.quadraticCurveTo(70 + i * 60, 220, 60 + i * 60, 205);
      g.stroke();
    }
    texte(g, "WATTY", l / 2, 262, 42, "#c8362b");
    texte(g, "Chauffage illimité au chalet", l / 2, 296, 16, "#2b2b29", { police: "italic" });
    salir(g, a, l, h, 10, 0.2);
  });
  region(g, R.postales, (l, h) => {
    g.fillStyle = "#cfcac0";
    g.fillRect(0, 0, l, h);
    const tons = [["#6f9fc8", "#f0f0f0"], ["#8fb58a", "#e8e0c8"], ["#c8a06a", "#f0e8d8"], ["#7a8fa8", "#ffffff"]];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
      const x = 6 + i * 62;
      const y = 6 + j * 76;
      const [c1, c2] = tons[(i + j) % 4];
      g.fillStyle = c1;
      g.fillRect(x, y, 56, 70);
      g.fillStyle = c2;
      g.beginPath();
      g.moveTo(x, y + 50);
      g.lineTo(x + 20, y + 22);
      g.lineTo(x + 32, y + 38);
      g.lineTo(x + 42, y + 26);
      g.lineTo(x + 56, y + 50);
      g.closePath();
      g.fill();
      g.fillStyle = "#3f5a3a";
      g.fillRect(x, y + 50, 56, 20);
    }
  });
  region(g, R.menu, (l, h) => {
    g.fillStyle = "#2b2b29";
    g.fillRect(0, 0, l, h);
    texte(g, "Aujourd'hui", l / 2, 24, 22, "#e8e4da", { fonte: "Georgia, serif", police: "italic" });
    const lignes = ["Chocolat chaud ....... 6 Wh", "Vin chaud .............. 7 Wh", "Tartiflette (app.) ... 14 Wh", "Vue augmentée ........ 2 Wh"];
    lignes.forEach((t, i) => texte(g, t, 12, 58 + i * 24, 15, "#e8e4da", { align: "left", police: "", fonte: "Georgia, serif" }));
    salir(g, a, l, h, 6, 0.3);
  });
  // Les panneaux routiers des deux bouts
  const direction = (r, titre, l1, l2) => region(g, r, (l, h) => {
    g.fillStyle = "#8a6a46";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "rgba(0,0,0,0.12)";
    for (let i = 0; i < 11; i++) g.fillRect(0, i * 12 + 3, l, 1.5);
    texte(g, titre.toUpperCase(), l / 2, 32, 32, "#f2e8d0", { max: l - 30 });
    texte(g, l1, l / 2, 72, 26, "#f2e8d0", { police: "italic", fonte: "Georgia, serif", max: l - 30 });
    texte(g, l2, l / 2, 106, 24, "#f2e8d0", { police: "italic", fonte: "Georgia, serif", max: l - 30 });
    salir(g, a, l, h, 6, 0.2);
  });
  direction(R.dirOuest, "Barrage · Grand Comptoir", "par le col du Grand-Vent, 14 km →", "← Vallée · Ton terrain");
  direction(R.dirEst, "Hameau des Charbonniers", "5 km, à la fumée →", "← Col du Grand-Vent · Vallée");
  region(g, R.charbon, (l, h) => {
    g.fillStyle = "#8a7458";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#c8362b";
    g.beginPath();
    g.moveTo(34, 100);
    g.quadraticCurveTo(10, 60, 34, 24);
    g.quadraticCurveTo(40, 50, 50, 44);
    g.quadraticCurveTo(62, 70, 34, 100);
    g.fill();
    texte(g, "CHARBON", 150, 34, 30, "#1f1d1b");
    texte(g, "contre conserves", 150, 68, 20, "#1f1d1b", { police: "italic" });
    texte(g, "les Charbonniers", 150, 100, 18, "#1f1d1b", { police: "" });
  });
  region(g, R.rando, (l, h) => {
    g.fillStyle = "#e0b83a";
    g.fillRect(0, 0, l, h);
    texte(g, "Lac Noir · 1 h 45 →", l / 2, h / 2, 28, "#2b2b29");
  });
  for (const [r, t] of [[R.lacet1, "LACET 1"], [R.lacet2, "LACET 2"]]) {
    region(g, r, (l, h) => {
      g.fillStyle = "#e4e0d6";
      g.fillRect(0, 0, l, h);
      g.strokeStyle = "#2b2b29";
      g.lineWidth = 4;
      g.strokeRect(4, 4, l - 8, h - 8);
      texte(g, t, l / 2, h / 2, 26, "#2b2b29");
    });
  }
  region(g, R.parking, (l, h) => {
    g.fillStyle = "#1f2a36";
    g.fillRect(0, 0, l, h);
    texte(g, "P", 36, h / 2, 60, "#4f9ad0");
    texte(g, "Stationnement", 150, 34, 22, "#e4e0d6");
    texte(g, "4 Wh / heure", 150, 66, 24, "#c79a3b");
    texte(g, "appli obligatoire", 150, 98, 16, "#c9c5ba", { police: "" });
  });
  region(g, R.orientation, (l, h) => {
    g.fillStyle = "#6f5a3a";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#c9b48a";
    g.beginPath();
    g.arc(l / 2, h / 2, 118, 0, 7);
    g.fill();
    g.strokeStyle = "#5a4630";
    g.lineWidth = 2;
    for (let i = 0; i < 16; i++) {
      const t = (i / 16) * Math.PI * 2;
      g.beginPath();
      g.moveTo(l / 2 + Math.cos(t) * 30, h / 2 + Math.sin(t) * 30);
      g.lineTo(l / 2 + Math.cos(t) * 110, h / 2 + Math.sin(t) * 110);
      g.stroke();
    }
    const noms = ["Pic Rouge 2 410", "Dent du Chat", "Barrage", "Lac Noir", "Grand Sommet 3 012", "Vallée"];
    noms.forEach((n, i) => {
      const t = (i / noms.length) * Math.PI * 2;
      g.save();
      g.translate(l / 2 + Math.cos(t) * 78, h / 2 + Math.sin(t) * 78);
      g.rotate(t + Math.PI / 2);
      texte(g, n, 0, 0, 13, "#2b2015");
      g.restore();
    });
    texte(g, "N", l / 2, h / 2 - 100, 18, "#2b2015");
    g.fillStyle = "#5a4630";
    g.beginPath();
    g.arc(l / 2, h / 2, 14, 0, 7);
    g.fill();
  });
  region(g, R.exvoto, (l, h) => {
    g.fillStyle = "#d8d2c4";
    g.fillRect(0, 0, l, h);
    g.strokeStyle = "#8a8274";
    g.lineWidth = 3;
    g.strokeRect(6, 6, l - 12, h - 12);
    texte(g, "MERCI", l / 2, 44, 34, "#4a4036", { fonte: "Georgia, serif" });
    texte(g, "pour l'hiver 1956", l / 2, 86, 20, "#4a4036", { police: "italic", fonte: "Georgia, serif" });
  });
  region(g, R.sentier, (l, h) => {
    g.fillStyle = "#e8e2d2";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#3f6a3a";
    g.fillRect(0, 0, l, 40);
    texte(g, "SENTIER DU LAC NOIR", l / 2, 21, 22, "#ffffff");
    g.strokeStyle = "#8a7a5a";
    g.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.ellipse(l / 2 + (a() - 0.5) * 40, 140, 30 + i * 16, 18 + i * 12, 0.2, 0, 7);
      g.stroke();
    }
    g.strokeStyle = "#c8362b";
    g.lineWidth = 4;
    g.setLineDash([8, 6]);
    g.beginPath();
    g.moveTo(30, 230);
    g.quadraticCurveTo(120, 180, 140, 120);
    g.quadraticCurveTo(160, 80, 220, 70);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = "#2a5d9a";
    g.beginPath();
    g.ellipse(215, 70, 22, 12, 0, 0, 7);
    g.fill();
    salir(g, a, l, h, 10, 0.25);
  });
  region(g, R.cantonnier, (l, h) => {
    g.fillStyle = "#e4e0d6";
    g.fillRect(0, 0, l, h);
    g.strokeStyle = "#2b2b29";
    g.lineWidth = 4;
    g.strokeRect(5, 5, l - 10, h - 10);
    texte(g, "SERVICE DES ROUTES", l / 2, 34, 22, "#2b2b29");
    texte(g, "Maison cantonnière", l / 2, 66, 20, "#2b2b29", { police: "italic" });
  });
  region(g, R.borne, (l, h) => {
    g.fillStyle = "#cfc8b8";
    g.fillRect(0, 0, l, h);
    texte(g, "1784", l / 2, h / 2 - 10, 38, "#3a352e");
    texte(g, "m", l / 2, h / 2 + 30, 26, "#3a352e");
  });
  region(g, R.telesiege, (l, h) => {
    g.fillStyle = "#c07440";
    g.fillRect(0, 0, l, h);
    g.strokeStyle = "#f2e8d0";
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(10, 40);
    g.lineTo(118, 20);
    g.stroke();
    g.beginPath();
    g.moveTo(64, 30);
    g.lineTo(64, 70);
    g.moveTo(40, 70);
    g.lineTo(88, 70);
    g.moveTo(40, 70);
    g.lineTo(40, 95);
    g.stroke();
    texte(g, "TÉLÉSIÈGE", l / 2, 112, 18, "#f2e8d0");
  });
  region(g, R.ecranPupitre, (l, h) => {
    g.fillStyle = "#101a22";
    g.fillRect(0, 0, l, h);
    eclair(g, 30, 64, 50, "#c79a3b");
    texte(g, "FAST LANE PREMIUM", 150, 36, 22, "#c79a3b");
    texte(g, "0 passager · 0 min", 150, 70, 20, "#7fd0a0", { police: "" });
    texte(g, "abonnement expiré", 150, 102, 18, "#d06a5a", { police: "" });
  });
}

// ---------- La halte : un tronçon à la fois ----------

function recentrer(groupe, x0) {
  const vues = new Set();
  groupe.traverse((obj) => {
    if (obj.geometry && !vues.has(obj.geometry)) {
      vues.add(obj.geometry);
      obj.geometry.translate(-x0, 0, 0);
    }
  });
  const ud = groupe.userData;
  for (const t of ud.toits) {
    t.boite = { ...t.boite, x: arr(t.boite.x - x0) };
    if (t.horsDe) t.horsDe = { ...t.horsDe, x: t.horsDe.x - x0 };
  }
  ud.obstacles = ud.obstacles.map((s) => ({ ...s, x1: arr(s.x1 - x0), x2: arr(s.x2 - x0) }));
  ud.lumieres = ud.lumieres.map((l) => ({ ...l, x: arr(l.x - x0) }));
  return groupe;
}

export function creer({ usure = 0.7, carte = "lacets" } = {}) {
  const def = FICHE.cartes.find((k) => k.id === carte) ?? FICHE.cartes[0];
  const x0 = def.decalage.x;
  const b = new Batiment(1784 + Math.round(x0), usure);
  const ctx = { b, c: b.c, M: matieres(), u: usure, x0, xa: x0 - 25, xb: x0 + 25, ici: bande(x0) };
  terrain(ctx);
  route(ctx);
  bords(ctx);
  nature(ctx);
  lacets(ctx);
  cantonniers(ctx);
  depot(ctx);
  galerie(ctx);
  sommet(ctx);
  telesiege(ctx);
  parking(ctx);
  return recentrer(b.construire(), x0);
}
