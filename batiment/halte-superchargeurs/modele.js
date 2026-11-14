// Halte · Les Superchargeurs Watty (voie rapide de la Ville vers la Zone industrielle, Book 20 §4).
//
// L'envers électrique de la station-service de la Campagne (code/client/src/rendu/halte.ts) : le grand hub de recharge
// rapide de la Compagnie, ultra-moderne la veille de la Grande Panne, devenu un cimetière de voitures électriques. Une
// ombrière photovoltaïque en arc couvre 24 bornes ; devant chacune, une voiture morte, encore branchée ; derrière, la
// file d'attente figée qui s'étire jusqu'à la bretelle. Pour les Voltaïques, c'est la caverne d'Ali Baba : cuivre des
// câbles, batteries, onduleurs, panneaux solaires.
//
// Format halte (CONSIGNE-HALTES.md) : 200 × 70 m, quatre tronçons de 50 × 70 m d'ouest en est. Tout est bâti dans le
// « repère de la halte » (origine au centre, +x à l'est, +z au sud) ; chaque tronçon ne garde que ce qui tombe dans sa
// bande de x et se recentre (voir `recentrer`). Les éléments longs sont coupés exactement aux limites des tronçons.
//
// Plan en travers (z, du nord au sud) :
//   −35 … −31   merlon antibruit végétalisé nord, grillage au pied
//   −30,4 … −21,5  chaussée nord (vers la Ville) et sa bande d'arrêt
//   −21,5 … −19,5  terre-plein central, glissière en béton
//   −19,5 … −10,4  chaussée sud (vers la Zone industrielle) et sa bande d'arrêt
//   −10 / −9,8  glissière et grillage entre la voie rapide et le hub (|x| ≤ 77)
//   0,4 … 7,6   l'allée du hub (le chemin du joueur), sortie de la bretelle à l'ouest, retour à l'est
//   −6,4 … 14,4 l'ombrière et ses deux rangées de 12 bornes (x de −46,4 à −8)
//   30 … 35     merlon sud, grillage au pied
//
// Goulets : (1) la file d'attente figée à l'entrée de la bretelle, coupée par les barrières « File optimisée par IA »,
// où il ne reste qu'un couloir ; (2) le transformateur haute tension effondré en travers de la sortie est, qu'on
// contourne en traversant le local technique (le camp des Voltaïques).

import * as THREE from "three";
import { Batiment, PALETTE, aleatoire, mur, touffes, semerTouffes, gravats, debris, jonchee, arbuste, arbre, mousse } from "../commun/atelier.js";
import { R, AL, AH, matieres } from "./atlas.js";
import { PI, arr, lisse, hash, panneau, versMonde, rect, cylY, tronc, ruban, bande, profilX, quad, grillage, glissiere, voiture, teinte, borne, cone, potelet, trottinette, velo, fauteuilOeuf, etagere, GEO } from "./objets.js";

// ---------- Le plan (repère de la halte) ----------

const Z = { bauN: -30.4, tpcN: -21.5, gba: -20.5, tpcS: -19.5, bauS: -10.4, glis: -10.0, gril: -9.8, merlonN: -31.0, merlonS: 30.0 };
const XG = 77; // glissière et grillage du hub : |x| ≤ 77
const ALLEE = { z: 4, d: 3.6, xFin: 54 };
const BRET = { xDebut: 88, z: -11.2 };
const OMB = { x0: -46.4, x1: -8, z0: -6.4, z1: 14.4, zc: 4, hb: 4.6, hc: 7.6 };
const COTES = Array.from({ length: 7 }, (_, i) => -46.4 + 6.4 * i); // les arcs de l'ombrière
const BAIES = Array.from({ length: 12 }, (_, i) => -44.8 + 3.2 * i); // une borne par baie et par rangée
const BORNE_NORD = -5.2;
const BORNE_SUD = 13.2;
const MARCHE = 9; // la dernière borne qui marche : rangée nord, baie 9 (x = −16)
const BARRIERE = { x: -71.5 };
const BASSINS = [
  { x0: -91.5, x1: -69.5, z0: 11.5, z1: 27, clo: { x0: -93, x1: -68, z0: 10, z1: Z.merlonS - 0.2 } },
  { x0: 83, x1: 97, z0: 13.5, z1: 27, clo: { x0: 81.5, x1: 98.5, z0: 12, z1: Z.merlonS - 0.2 } },
];
const LG = { x0: 8, x1: 32, z0: 12, z1: 25, h: 3.6 }; // le Watty Lounge
const LT = { x0: 64, x1: 77, z0: 4.5, z1: 13.5, h: 3.2 }; // le local technique
const PO = { x0: 65, x1: 75, z0: 18, z1: 25, h: 3.4 }; // le poste de transformation
const COUR = { x0: 62, x1: 77, z0: LT.z1, z1: Z.merlonS - 0.2 }; // la cour clôturée du poste
const TRANSFO = { x: 69 }; // la ligne du transformateur effondré
const PORTIQUE = { x: 30 }; // le portique à messages tombé sur la voie rapide
const CAMION = { x: 13, z: -7.4 };
const TOTEM = { x: -60, z: 10.5 };
const JEUX = { x0: -45, x1: -30, z0: 17.5, z1: 28.5 };
const GLISSE = { x0: -58, x1: -50.5, z0: 13, z1: 21 };
const CAMP = { x0: 37, x1: 49.5, z0: 11, z1: 27.5 };

/** Le centre de la bretelle (ou de l'allée) et sa demi-largeur, en fonction de x (entrée et sortie symétriques). */
function bretelle(x) {
  const ax = Math.abs(x);
  if (ax <= ALLEE.xFin) return { z: ALLEE.z, d: ALLEE.d };
  const s = lisse((BRET.xDebut - ax) / (BRET.xDebut - ALLEE.xFin));
  return { z: BRET.z + (ALLEE.z - BRET.z) * s, d: 2 + (ALLEE.d - 2) * s };
}
const zR = (x) => bretelle(x).z;
const pente = (x) => -Math.atan2(zR(x + 0.5) - zR(x - 0.5), 1);
const yArc = (z) => OMB.hb + (OMB.hc - OMB.hb) * (1 - ((z - OMB.zc) / ((OMB.z1 - OMB.z0) / 2)) ** 2);

const TRONCONS = [
  { id: "file", nom: "1 · La bretelle et la file figée", x: -75 },
  { id: "ombriere", nom: "2 · L'ombrière aux 24 bornes", x: -25 },
  { id: "lounge", nom: "3 · Le Watty Lounge", x: 25 },
  { id: "transfo", nom: "4 · Le transformateur et la sortie", x: 75 },
];

// ---------- La fiche ----------

const FOUILLE = [
  // 1 · la file
  { x: -77, z: -2.4, quoi: "voitures de la file : boîtes à gants, sacs de voyage, bouteilles d'eau, chargeurs (cuivre)" },
  { x: -66, z: 3.6, quoi: "voiture à la portière ouverte : trousse de secours, couverture de survie, batterie 12 V" },
  { x: -60, z: 9.6, quoi: "pied du totem : coffret électrique (câbles, disjoncteurs), petite batterie solaire de l'écran (elle luit : risqué)" },
  { x: -54.5, z: 15.5, quoi: "station Watty Glisse : batteries lithium de trottinettes (la plupart déjà prises), roues, câbles" },
  { x: -80, z: 19, quoi: "bassin d'orage : la voiture tombée dedans, coffre sous l'eau (on patauge)" },
  { x: -90, z: -7.6, quoi: "îlot de la bretelle : amortisseur de choc (ferraille), cônes" },
  // 2 · l'ombrière
  { x: -16, z: -4.4, quoi: "la dernière borne qui marche : câble de cuivre intact, électronique — et sa lueur bleue qui se voit de loin" },
  { x: -29.6, z: -4.6, quoi: "bornes aux câbles encore branchés : câbles de cuivre de forte section (lourds)" },
  { x: -38, z: 12.6, quoi: "panneaux solaires tombés de l'ombrière (certains intacts) et leurs connecteurs" },
  { x: -8.4, z: -5.2, quoi: "coffret d'onduleurs au pied d'un poteau de l'ombrière" },
  { x: -21, z: 15.9, quoi: "souffleur de la mascotte gonflable : petit moteur électrique, câble" },
  { x: -25.6, z: 10.3, quoi: "voitures branchées : boîtes à gants, sièges enfant, batteries 12 V" },
  { x: -37, z: 23, quoi: "aire Watty Kids : peluche Watty, cordes des balançoires, ressorts" },
  // 3 · le lounge
  { x: 10.2, z: -3.4, quoi: "camion Watty Rescue renversé : modules de batterie de dépannage (certains brûlés), câbles, outillage" },
  { x: 19, z: 13.4, quoi: "bar à smoothies : fruits lyophilisés, sucre, blenders, bougies" },
  { x: 29, z: 13.6, quoi: "boutique Watty : batteries externes, lampes à dynamo, piles, t-shirts, peluches" },
  { x: 10.4, z: 15, quoi: "toilettes autonettoyantes : savon, papier, électronique des capsules" },
  { x: 22.6, z: 23.4, quoi: "coin consoles : consoles, manettes, écrans (petite électronique)" },
  { x: 14.6, z: 22.6, quoi: "le camp des survivants autour du feu : couvertures, réchaud, conserves (on y est rarement seul)" },
  { x: 30, z: -18, quoi: "carambolage sous le portique à messages : ferraille, câbles, diodes" },
  { x: 43, z: 18.6, quoi: "le campement de la file : tente, réchaud, jerricans d'eau, linge" },
  // 4 · le transformateur
  { x: 58.5, z: 1.6, quoi: "voitures bloquées devant le transformateur : coffres" },
  { x: 69.6, z: -2.6, quoi: "le transformateur effondré : cuivre (très lourd), huile, isolateurs en porcelaine" },
  { x: 66.6, z: 11.2, quoi: "poste de contrôle (le camp des Voltaïques) : bobines de cuivre dénudé, outils, lampe à LED" },
  { x: 71.5, z: 6.2, quoi: "armoires de batteries de stockage : modules lithium, le trésor des Voltaïques (une armoire a brûlé)" },
  { x: 75.6, z: 5.3, quoi: "onduleurs muraux : électronique de puissance, câbles" },
  { x: 70, z: 21.6, quoi: "poste de transformation : bobinages de cuivre, barres de cuivre des cellules, isolateurs" },
];

const ETEINTS = [
  { x: -74.5, z: -2.0, type: "ancien habitant : conducteur encore ceinturé dans sa voiture de la file" },
  { x: -67.5, z: 6.2, type: "errant entre les voitures de la file" },
  { x: -86, z: 19, type: "putréfié, dans l'eau du bassin d'orage" },
  { x: -53.5, z: 18.4, type: "errant (station de trottinettes)" },
  { x: -29.6, z: -2.4, type: "ancien habitant : conducteur ceinturé, toujours branché à la borne" },
  { x: -19.2, z: 10.3, type: "ancien habitant : conductrice ceinturée (voiture branchée)" },
  { x: -40, z: 4.0, type: "errant dans l'allée de l'ombrière" },
  { x: -15.4, z: -3.0, type: "errant attiré par la lueur bleue de la dernière borne" },
  { x: -34, z: 24.4, type: "rampant sous le toboggan Watty" },
  { x: 12.4, z: 20.4, type: "ancien client du lounge, dans un fauteuil-œuf" },
  { x: 24, z: 22.4, type: "ancien client (coin consoles), casque sur les oreilles" },
  { x: 28.4, z: 21, type: "vendeur en polo Watty (accueil de la boutique)" },
  { x: 16.4, z: -2.6, type: "équipé : dépanneur Watty Rescue, casque et gilet" },
  { x: 44, z: 24.2, type: "errant (campement de la file)" },
  { x: 58.4, z: 3.2, type: "errant (voitures bloquées devant le transformateur)" },
  { x: 71.5, z: 9.4, type: "ancien technicien de la Compagnie (salle des batteries)" },
  { x: 70.2, z: 22.4, type: "rampant dans le poste de transformation" },
  { x: 90, z: -16, type: "errant (voie rapide)" },
];

const ENTREES = [
  { x: -100, z: -16, nature: "entrée A : la voie rapide, depuis la Ville" },
  { x: BARRIERE.x, z: arr(zR(BARRIERE.x)), nature: "le couloir dans la file, entre les barrières (goulet)" },
  { x: LG.x1, z: 18.5, nature: "portes coulissantes du Watty Lounge (est)" },
  { x: 20, z: LG.z0, nature: "porte de service du lounge (nord)" },
  { x: LT.x0, z: 9, nature: "porte ouest du local technique" },
  { x: LT.x1, z: 9, nature: "porte est du local technique (on ressort après le transformateur)" },
  { x: PO.x0, z: 21.5, nature: "porte du poste de transformation" },
  { x: COUR.x0, z: 22, nature: "portail de la cour du poste (ouest)" },
  { x: 100, z: -11, nature: "sortie B : vers la Zone industrielle" },
];

const DESCRIPTIONS = {
  file: "la voie rapide figée, la bretelle, la file d'attente qui déborde sur l'herbe et les barrières « File optimisée par IA » (goulet), le totem « 3 427 jours », le bassin d'orage, la station de trottinettes",
  ombriere: "l'ombrière photovoltaïque en arc, les 24 bornes et leurs voitures mortes encore branchées, la dernière borne qui marche (lueur bleue), la mascotte gonflable affalée, l'aire de jeux Watty Kids",
  lounge: "le Watty Lounge vitré (fauteuils-œufs, bar à smoothies, écran géant, consoles, boutique, toilettes autonettoyantes, feu des survivants), le camion Watty Rescue renversé, le portique tombé sur la voie rapide, le campement de la file",
  transfo: "le transformateur effondré en travers de la sortie (goulet), le local technique à traverser (camp des Voltaïques, armoires de batteries, onduleurs), le poste de transformation, le second bassin d'orage, le retour sur la voie rapide",
};
const DEPARTS = { file: { x: -96, z: -11 }, ombriere: { x: -49, z: 4 }, lounge: { x: 1, z: 4 }, transfo: { x: 51, z: 4 } };

const dansTroncon = (t) => (p) => p.x >= t.x - 25 && (p.x < t.x + 25 || (t.x === 75 && p.x <= 100));
const versTroncon = (t, liste) => liste.filter(dansTroncon(t)).map((p) => ({ ...p, x: arr(p.x - t.x), z: arr(p.z) }));

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
  id: "halte-superchargeurs",
  nom: "Halte · Les Superchargeurs Watty",
  lieu: "Halte · voie rapide de la Ville vers la Zone industrielle",
  environnement: "zone industrielle",
  anneau: "moyen",
  danger: 3,
  halte: true,
  solPropre: true,
  recit:
    "Le hub promettait « 0 % d'attente grâce à l'IA » : le jour de la Grande Panne, tout le monde est venu recharger en même temps, et l'IA a calculé avec beaucoup de calme un temps d'attente de 3 427 jours. Les conducteurs ont attendu, ceinturés, branchés à des bornes qui ne rendaient plus rien ; certains attendent encore. Aujourd'hui, les Voltaïques viennent y couper le cuivre des câbles et vider les armoires de batteries, et tout le monde lorgne la dernière borne qui luit, bleue, sur ses derniers panneaux solaires.",
  inspiration:
    "les grands hubs de recharge rapide des autoroutes (ombrières photovoltaïques, rangées de bornes, salons d'attente vitrés), les parkings de voitures électriques invendues, les photos d'autoroutes figées après une évacuation",
  reperes: [
    "L'ombrière en arc : arcs blancs sur poteaux en V, panneaux solaires (certains tombés sur les voitures, cassés ou volés : on voit le ciel à travers)",
    "Les 24 bornes « Watty Supercharge » et leurs voitures mortes encore branchées ; écrans fendus « Votre abonnement ne permet pas la recharge à cette heure »",
    "Les câbles coupés par les pillards de cuivre : un moignon noir, un éclat orange à la coupure",
    "La dernière borne qui marche (rangée nord, baie 10) : écran bleu « Recharge en cours · 1 % · fin : 3 427 j », la lueur bleue de nuit",
    "La file d'attente figée qui déborde sur l'herbe jusqu'à la bretelle, et les barrières « File optimisée par IA » où il ne reste qu'un couloir (goulet 1)",
    "Le totem et son écran ambré « Temps d'attente estimé : 3 427 jours »",
    "Watty, la mascotte gonflable géante, dégonflée et affalée sur l'ombrière, un bras qui pend",
    "Le Watty Lounge vitré : fauteuils-œufs, bar à smoothies (Détox Lithium, 15 Wh), écran géant marqué, consoles, boutique, toilettes « autonettoyantes », le feu des survivants sous la verrière cassée",
    "Le transformateur effondré en travers de la sortie (goulet 2) : on traverse le local technique, camp des Voltaïques (lampe blanc froid, cuivre dénudé, armoires de batteries dont une brûlée)",
    "Le camion Watty Rescue renversé, livrée vers le ciel, ses batteries répandues",
    "Le portique à messages tombé en travers de la voie rapide, sur un carambolage brûlé : c'est ce qui ferme la voie rapide",
    "L'aire de jeux Watty Kids, la station de trottinettes Watty Glisse sans batteries, le campement de ceux qui ont attendu des jours",
  ],
  lot: { l: 200, p: 70 },
  depart: DEPARTS.file,
  goulets: [
    { x: BARRIERE.x, z: arr(zR(BARRIERE.x)), nature: "la file d'attente figée à l'entrée de la bretelle : barrières « File optimisée par IA » de la glissière au bassin d'orage, un seul couloir de 1,5 m entre les voitures" },
    { x: TRANSFO.x, z: -2, nature: "le transformateur haute tension effondré en travers de la sortie, de la glissière au local technique : on passe en traversant le local (portes ouest et est)" },
  ],
  panneaux: [
    { x: -96, z: -6, texte: "Voie rapide · ← Ville · Comptoir · 6 km" },
    { x: -84, z: -4.4, texte: "Watty Supercharge · Hub de recharge · 500 m" },
    { x: 95, z: -6, texte: "Zone industrielle → · Centrale · Aciérie · 9 km" },
  ],
  cartes: CARTES,
};

// ---------- Couleurs ----------

const C = {
  herbe: 0x7d9a55,
  herbeSeche: 0x9aa262,
  merlon: 0x6f8a4c,
  asphalte: 0x56585a,
  allee: 0x606264,
  parking: 0x5a5c5f,
  blanc: 0xdedbd2,
  vert: 0x55866a,
  betonClair: 0xc9c5bb,
  beton: 0xb3afa5,
  blancStructure: 0xeceae4,
  acier: 0x8d9497,
  rouille: PALETTE.rouille,
  suie: 0x2a2724,
  jaune: 0xe2bd48,
  rouge: 0xb8382e,
  marine: 0x1f3a62,
};

// ---------- Petits outils ----------

/** Un quadrilatère texturé par une région de l'atlas : P = [bas-gauche, bas-droit, haut-droit, haut-gauche]. */
function quadAtlas(c, mat, r, P, couleur = 0xffffff) {
  const [px, py, pw, ph] = r;
  const uvc = [[0, 1], [1, 1], [1, 0], [0, 0]];
  const pos = [];
  const uv = [];
  for (const k of [0, 1, 2, 0, 2, 3]) {
    pos.push(...P[k]);
    uv.push((px + uvc[k][0] * pw) / AL, 1 - (py + uvc[k][1] * ph) / AH);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  c.poser(g, mat, couleur, {}, { crasse: false, nuance: 0.03 });
  g.dispose();
}

/** Une flaque d'eau de pluie (disque irrégulier), avec la matière d'eau de la halte. */
function flaque(ctx, x, z, rayon, y = 0.035) {
  const { c, M } = ctx;
  const pts = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * PI * 2;
    const r = rayon * (0.6 + 0.5 * hash(x + i, z));
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts)).rotateX(-PI / 2);
  c.poser(g, M.eau, 0xa8b4b0, { x, y, z }, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Une flamme (feu de survivants, brasero) : cônes additifs orangés. */
function flammes(ctx, x, y, z, taille = 1) {
  const { c, M } = ctx;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * PI * 2;
    const s = taille * (0.22 + 0.1 * hash(x + i, z));
    c.poser(GEO.CONE, M.lueur, i % 2 ? 0xff9a3a : 0xffcf6a, { x: x + Math.cos(a) * 0.12 * taille, y: y + s * 1.4, z: z + Math.sin(a) * 0.12 * taille, e: [s, s * 2.8, s] }, { crasse: false, nuance: 0 });
  }
}

/** Un halo au sol (lumière qui tombe) : un disque additif. */
function halo(ctx, x, z, r, couleur, y = 0.05) {
  const g = new THREE.CircleGeometry(r, 12).rotateX(-PI / 2);
  ctx.c.poser(g, ctx.M.lueur, couleur, { x, y, z }, { crasse: false, nuance: 0 });
  g.dispose();
}

/**
 * Un mur coupé à hauteur d'allège (façades sud et est, cloisons) : la bande basse reste (et fait obstacle), le haut va
 * dans la couche `k` qui s'efface. `ouvertures` en hauteurs absolues, comme pour `mur()`.
 */
function murCoupe(ctx, k, a, b, spec) {
  const hb = 1.15;
  const ouv = spec.ouvertures ?? [];
  mur(ctx.c, a, b, { ...spec, h: hb, ouvertures: ouv.map((o) => ({ ...o, type: o.type === "fenetre" ? "vide" : o.type })), batiment: ctx.b });
  mur(k, a, b, {
    ...spec,
    h: spec.h - hb,
    y0: hb,
    batiment: null,
    ouvertures: ouv.map((o) => ({ ...o, bas: o.bas - hb, haut: o.haut - hb, vantail: undefined })),
  });
}

/** Un rideau de verre (façade vitrée du lounge) de `a` à `b` : meneaux, vitres entières ou brisées, portes. */
function vitrage(ctx, a, b, o = {}) {
  const { c, M, u } = ctx;
  const h = o.h ?? LG.h;
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const L = Math.hypot(dx, dz);
  const n = Math.max(1, Math.round(L / 1.6));
  const pas = L / n;
  const ry = -Math.atan2(dz, dx);
  const pt = (s) => [a[0] + (dx * s) / L, a[1] + (dz * s) / L];
  let debut = null;
  const fermer = (fin) => {
    if (debut === null) return;
    const [x1, z1] = pt(debut);
    const [x2, z2] = pt(fin);
    ctx.b.obstacle(x1, z1, x2, z2, "baie vitrée");
    debut = null;
  };
  c.repere({ x: a[0], z: a[1], ry }, () => {
    c.boite(L, 0.14, 0.3, 0xb8bcbe, { x: L / 2, y: 0.07 }, M.metal);
    c.boite(L, 0.22, 0.3, 0xdcdedc, { x: L / 2, y: h - 0.11 }, M.metal);
    for (let i = 0; i <= n; i++) c.boite(0.08, h, 0.14, 0xb8bcbe, { x: i * pas, y: h / 2 }, M.metal);
  });
  for (let i = 0; i < n; i++) {
    const s = (i + 0.5) * pas;
    const [xm, zm] = pt(s);
    const porte = (o.portes ?? []).some((p) => Math.abs(s - p) < pas * 0.6);
    const brisee = (o.brisees ?? []).includes(i) || (!porte && hash(xm, zm) < 0.1 + 0.3 * u);
    if (porte) {
      // une porte coulissante, restée ouverte à moitié (l'autre panneau est tombé)
      c.boite(pas * 0.5, h - 0.4, 0.04, 0xffffff, { x: xm + Math.cos(ry) * pas * 0.35, y: (h - 0.4) / 2 + 0.14, z: zm - Math.sin(ry) * pas * 0.35, ry }, M.verre, { crasse: false });
      c.boite(pas * 0.5, 0.05, h - 0.5, 0xffffff, { x: xm, y: 0.12, z: zm + Math.cos(ry) * 1.4, ry }, M.verre, { crasse: false });
      fermer(i * pas);
      continue;
    }
    if (brisee) {
      // vitre tombée : éclats au sol, un morceau resté en haut (on peut passer)
      c.boite(pas - 0.1, 0.5, 0.02, 0xffffff, { x: xm, y: h - 0.5, z: zm, ry }, M.verre, { crasse: false });
      debris(c, xm - 0.8, zm - 0.9, xm + 0.8, zm + 0.9, 8, [0xcfe0e4, 0xa8c0c8, 0xe8f0f0]);
      fermer(i * pas);
      continue;
    }
    c.boite(pas - 0.1, h - 0.36, 0.02, 0xffffff, { x: xm, y: h / 2, z: zm, ry }, M.verre, { crasse: false });
    if (debut === null) debut = i * pas;
  }
  fermer(L);
}

// ---------- Listes globales (indépendantes du tronçon) ----------

/** Le bouchon de la voie rapide : des voitures mortes sur les quatre voies (les deux sens). */
const BOUCHON = (() => {
  const a = aleatoire(7701);
  const l = [];
  for (let x = -97; x < 98; x += 4.5 + a() * 8) {
    if (Math.abs(x - PORTIQUE.x) < 7) continue;
    const voie = Math.floor(a() * 4);
    const z = [-26.7, -23.3, -17.7, -14.3][voie];
    const sens = voie < 2 ? PI : 0;
    l.push({ x, z: z + (a() - 0.5) * 0.6, ry: sens + (a() - 0.5) * 0.3, type: ["berline", "suv", "citadine"][Math.floor(a() * 3)], couleur: teinte(Math.floor(a() * 12)), ouverte: a() < 0.35, brulee: a() < 0.07 });
  }
  return l;
})();

/**
 * La file d'attente figée : des lignes de voitures parallèles à la bretelle, décalées de part et d'autre d'un couloir
 * de 1,5 m (le chemin). Elle déborde sur l'herbe à l'entrée (x < −62), puis continue sur deux lignes dans l'allée.
 */
const FILE = (() => {
  const a = aleatoire(3427);
  const l = [];
  for (let k = -6; k <= 7; k++) {
    if (k === 0) continue;
    const o = Math.sign(k) * (1.67 + (Math.abs(k) - 1) * 1.95);
    const xFin = Math.abs(k) === 1 ? 2 : -60;
    for (let x = -99 + (Math.abs(k) % 2) * 2.4; x < xFin; x += 4.85 + a() * 0.15) {
      const xc = x + (a() - 0.5) * 0.2;
      const z = zR(xc) + o;
      const r = a();
      if (Math.abs(k) > 1 && (xc < -84 || z < -8.8 || z > 9.0)) continue;
      if (Math.abs(xc - BARRIERE.x) < 2.5) continue;
      if (xc > -50 && r < 0.4) continue; // dans l'allée, des trous : on circule
      if (Math.abs(k) === 1 && xc < -84 && r < 0.3) continue;
      l.push({ x: xc, z, ry: pente(xc) + (a() - 0.5) * 0.05, type: ["berline", "suv", "citadine", "berline"][Math.floor(a() * 4)], couleur: teinte(Math.floor(a() * 12)), ouverte: a() < 0.18 });
    }
  }
  return l;
})();

/** Les arbres et arbustes des merlons (listes stables). */
const VEGETAL = (() => {
  const a = aleatoire(5150);
  const l = [];
  for (const [zA, zB, y] of [[-34.6, -33.4, 4.0], [32.6, 34.6, 4.0]]) {
    for (let x = -99; x < 100; x += 3 + a() * 3.5) {
      const r = a();
      // au sud (côté caméra), des arbustes seulement : les arbres cacheraient le hub
      l.push({ x, z: zA + a() * (zB - zA), y, sorte: r < 0.35 && zA < 0 ? "arbre" : "arbuste", h: 4.5 + a() * 3.5, essence: a() < 0.3 ? "bouleau" : "feuillu", t: 0.9 + a() * 0.8 });
    }
  }
  return l;
})();

// ---------- Le sol, la voie rapide, la bretelle ----------

function bassin(ctx, bs) {
  const { c, M, u } = ctx;
  const P = 2.4; // talus du bassin
  const H = -2.2;
  const xa = bs.x0 + P, xb = bs.x1 - P, za = bs.z0 + P, zb = bs.z1 - P;
  const talus = 0x6f8248;
  quad(c, M.terrain, talus, [[bs.x0, 0, bs.z0], [xa, H, za], [xb, H, za], [bs.x1, 0, bs.z0]]);
  quad(c, M.terrain, talus, [[bs.x1, 0, bs.z1], [xb, H, zb], [xa, H, zb], [bs.x0, 0, bs.z1]]);
  quad(c, M.terrain, talus, [[bs.x0, 0, bs.z1], [xa, H, zb], [xa, H, za], [bs.x0, 0, bs.z0]]);
  quad(c, M.terrain, talus, [[bs.x1, 0, bs.z0], [xb, H, za], [xb, H, zb], [bs.x1, 0, bs.z1]]);
  c.pave(xa, H - 0.2, za, xb, H, zb, 0x857a5e, M.terrain, { crasse: false, nuance: 0 });
  // L'eau croupie, les roseaux, l'exutoire en béton
  const ye = H + 0.7;
  const t = 0.7 / 2.2;
  const g = new THREE.PlaneGeometry(xb - xa + 2 * P * t, zb - za + 2 * P * t).rotateX(-PI / 2);
  c.poser(g, M.eau, 0xb8c8b0, { x: (bs.x0 + bs.x1) / 2, y: ye, z: (bs.z0 + bs.z1) / 2 }, { crasse: false, nuance: 0 });
  g.dispose();
  for (let i = 0; i < 26 + 30 * u; i++) {
    const bordN = c.hasard() < 0.5;
    const x = c.entre(xa - 0.6, xb + 0.6);
    const z = bordN ? c.entre(za - 1.0, za + 0.2) : c.entre(zb - 0.2, zb + 1.0);
    touffes(c, [[x, z, ye - 0.05]], 0x8a9a52);
  }
  c.pave(bs.x0 - 0.2, -0.9, (bs.z0 + bs.z1) / 2 - 0.9, bs.x0 + 1.2, 0.1, (bs.z0 + bs.z1) / 2 + 0.9, C.beton, M.mat);
  c.boite(0.9, 0.9, 0.08, 0x2a2826, { x: bs.x0 + 0.5, y: -0.45, z: (bs.z0 + bs.z1) / 2 + 0.92 }, M.mat);
  // La clôture du bassin (sauf côté merlon : le grillage du merlon la ferme)
  const k = bs.clo;
  grillage(ctx, [k.x0, k.z0], [k.x1, k.z0], { nature: "clôture du bassin d'orage", penche: 0 });
  grillage(ctx, [k.x0, k.z1], [k.x0, k.z0], { nature: "clôture du bassin d'orage", penche: 0 });
  grillage(ctx, [k.x1, k.z0], [k.x1, k.z1], { nature: "clôture du bassin d'orage", penche: 0 });
}

function sol(ctx) {
  const { c, M, x0, x1, u } = ctx;
  // Le terrain, troué par les bassins d'orage
  const bs = BASSINS.find((q) => q.x0 < x1 && q.x1 > x0);
  if (!bs) c.pave(x0, -0.3, -35, x1, 0, 35, C.herbe, M.terrain, { crasse: false, nuance: 0 });
  else {
    c.pave(x0, -0.3, -35, x1, 0, bs.z0, C.herbe, M.terrain, { crasse: false, nuance: 0 });
    c.pave(x0, -0.3, bs.z1, x1, 0, 35, C.herbe, M.terrain, { crasse: false, nuance: 0 });
    c.pave(x0, -0.3, bs.z0, bs.x0, 0, bs.z1, C.herbe, M.terrain, { crasse: false, nuance: 0 });
    c.pave(bs.x1, -0.3, bs.z0, x1, 0, bs.z1, C.herbe, M.terrain, { crasse: false, nuance: 0 });
    bassin(ctx, bs);
  }
  // Les merlons antibruit (terre végétalisée)
  profilX(c, M.terrain, C.merlon, x0, x1, [[Z.merlonN, 0], [-33.3, 3.7], [-34.2, 4.0], [-35, 4.0]], [-33, 0]);
  profilX(c, M.terrain, C.merlon, x0, x1, [[Z.merlonS, 0], [32.3, 3.7], [33.2, 4.0], [35, 4.0]], [33, 0]);
  // La voie rapide : deux chaussées et leurs bandes d'arrêt
  c.pave(x0, 0, Z.bauN, x1, 0.02, Z.tpcN, C.asphalte, M.asphalte, { crasse: false, nuance: 0 });
  c.pave(x0, 0, Z.tpcS, x1, 0.02, Z.bauS, C.asphalte, M.asphalte, { crasse: false, nuance: 0 });
  c.pave(x0, 0, Z.merlonN, x1, 0.012, Z.bauN, 0x9b927e, M.terrain, { crasse: false, nuance: 0 });
  for (const z of [-28.4, -21.65, -19.35, -12.6]) c.pave(x0, 0.02, z - 0.11, x1, 0.026, z + 0.11, C.blanc, M.mat, { crasse: false, nuance: 0 });
  for (let k = -100; k < 100; k += 13) {
    const xm = k + 1.5;
    if (xm < x0 || xm >= x1) continue;
    for (const z of [-25, -16]) c.pave(k, 0.02, z - 0.08, k + 3, 0.026, z + 0.08, C.blanc, M.mat, { crasse: false, nuance: 0 });
  }
  // La bretelle et l'allée du hub
  ruban(c, M.asphalte, C.allee, x0, x1, zR, (x) => bretelle(x).d, 0.03, 1);
  bande(c, x0, x1, (x) => zR(x) - bretelle(x).d + 0.25, 0.14, 0.006, 0.03, C.blanc, M.mat, 2);
  bande(c, x0, x1, (x) => zR(x) + bretelle(x).d - 0.25, 0.14, 0.006, 0.03, C.blanc, M.mat, 2);
  // Flèches et marquage « IA » dans l'allée (tous les 24 m)
  for (let x = -96; x <= 96; x += 24) {
    if (!ctx.dans(x)) continue;
    const z = zR(x);
    c.boite(2.2, 0.006, 0.16, C.blanc, { x, y: 0.036, z, ry: pente(x) }, M.mat, { crasse: false });
    for (const s of [-1, 1]) c.boite(0.8, 0.006, 0.16, C.blanc, { x: x + 0.85, y: 0.036, z: z + s * 0.25, ry: pente(x) + s * 0.6 }, M.mat, { crasse: false });
  }
  // L'îlot de séparation (entrée et sortie) : hachures blanches
  for (const sx of [-1, 1]) {
    for (let ax = 79; ax < 88; ax += 1.2) {
      const x = sx * ax;
      if (!ctx.dans(x)) continue;
      const zb = zR(x) - bretelle(x).d;
      if (zb - Z.bauS < 0.5) continue;
      c.boite(0.25, 0.006, (zb - Z.bauS) * 1.05, C.blanc, { x, y: 0.03, z: (zb + Z.bauS) / 2, ry: sx * 0.6 }, M.mat, { crasse: false });
    }
  }
  // Les herbes qui percent : terre-plein, bas-côtés, fissures
  const n = Math.round(12 + 40 * u);
  semerTouffes(c, x0, Z.tpcN + 0.2, x1, Z.tpcS - 0.2, n, C.herbeSeche);
  semerTouffes(c, x0, Z.merlonN + 0.2, x1, Z.bauN, Math.round(n * 0.5), C.herbeSeche);
  semerTouffes(c, x0, Z.bauS + 0.2, x1, -8.5, Math.round(n * 0.6), C.herbeSeche, 0.02);
  semerTouffes(c, x0, 27, x1, Z.merlonS, Math.round(n * 0.8), C.herbe);
  for (let i = 0; i < 8 * u; i++) {
    const x = c.entre(x0 + 1, x1 - 1);
    flaque(ctx, x, c.entre(-30, -11), c.entre(0.6, 1.6), 0.026);
  }
  for (let i = 0; i < 4 * u; i++) {
    const x = c.entre(x0 + 2, x1 - 2);
    flaque(ctx, x, zR(x) + c.entre(-1.5, 1.5), c.entre(0.5, 1.3));
  }
}

function bords(ctx) {
  const { c, M, x0, x1, b, dans } = ctx;
  // Grillages au pied des merlons (toute la longueur)
  grillage(ctx, [-100, Z.merlonN + 0.2], [100, Z.merlonN + 0.2], { nature: "grillage du merlon", penche: 0 });
  grillage(ctx, [-100, Z.merlonS - 0.2], [100, Z.merlonS - 0.2], { nature: "grillage du merlon", penche: 0 });
  // La glissière en béton du terre-plein (ouverte sous le portique tombé)
  const gba = [[Z.gba - 0.32, 0], [Z.gba - 0.24, 0.24], [Z.gba - 0.09, 0.82], [Z.gba + 0.09, 0.82], [Z.gba + 0.24, 0.24], [Z.gba + 0.32, 0]];
  const trou = [PORTIQUE.x - 4, PORTIQUE.x + 3];
  for (const [xa, xb] of [[x0, Math.min(x1, trou[0])], [Math.max(x0, trou[1]), x1]]) {
    if (xb - xa < 0.05) continue;
    profilX(c, M.mat, C.betonClair, xa, xb, gba, [Z.gba, 0.3]);
    b.obstacle(xa, Z.gba, xb, Z.gba, "glissière en béton");
  }
  // Entre la voie rapide et le hub : glissière et grillage serrés (on ne passe pas)
  glissiere(ctx, -XG, XG, Z.glis);
  grillage(ctx, [-XG, Z.gril], [XG, Z.gril], { nature: "grillage du hub", penche: 0 });
  // L'amortisseur de choc au nez de chaque îlot
  for (const sx of [-1, 1]) {
    const x = sx * 79;
    if (!dans(x)) continue;
    c.repere({ x, z: -10.2, ry: sx < 0 ? -0.35 : 0.35 + PI }, () => {
      for (let i = 0; i < 4; i++) c.boite(0.5, 0.8, 0.9, i % 2 ? 0x2a2a2a : 0xd8b030, { x: -i * 0.52, y: 0.42 }, M.satin);
    });
    rect(b, x - sx * 0.8, -10.2, 2.2, 1.0, 0, "amortisseur de choc");
    cone(ctx, x + sx * 1.2, -9.0, true);
    cone(ctx, x + sx * 2.4, -8.6);
  }
}

function vegetation(ctx) {
  const { c, dans, u, x0, x1 } = ctx;
  for (const v of VEGETAL) {
    if (!dans(v.x)) continue;
    if (v.sorte === "arbre") arbre(c, v.x, v.z, v.h, u > 0.9 && hash(v.x) < 0.15 ? "mort" : v.essence, v.y);
    else arbuste(c, v.x, v.z, v.t, v.y);
  }
  // Le versant des merlons : touffes et petits arbustes
  for (let x = x0 + 1.5; x < x1; x += 4.2) {
    arbuste(c, x + c.entre(-1, 1), -32.3, c.entre(0.6, 1.0), 1.9, [0x5d7a46, 0x4f6f3a, 0x6f8f4a]);
    arbuste(c, x + c.entre(-1, 1), 31.5, c.entre(0.6, 1.0), 1.9, [0x5d7a46, 0x4f6f3a, 0x6f8f4a]);
  }
  // Ronces au pied des grillages, d'autant plus que l'usure est forte
  for (let i = 0; i < 6 + 10 * u; i++) {
    const x = c.entre(x0 + 1, x1 - 1);
    arbuste(c, x, c.hasard() < 0.5 ? -8.9 : 29.0, c.entre(0.4, 0.8), 0, [0x5a7040, 0x6a7a42, 0x4f6235]);
  }
}

function epaves(ctx) {
  const { dans } = ctx;
  for (const v of BOUCHON) if (dans(v.x)) voiture(ctx, v.x, v.z, v.ry, v);
  for (const v of FILE) if (dans(v.x)) voiture(ctx, v.x, v.z, v.ry, { ...v, port: -1 });
}

// ---------- Signalisation, éclairage ----------

function panneauRoute(ctx, x, z, ry, r, l, h, y = 1.9) {
  const { c, M } = ctx;
  c.repere({ x, z, ry }, () => {
    for (const s of [-1, 1]) c.boite(0.12, y + h, 0.12, C.acier, { x: s * l * 0.32, y: (y + h) / 2 }, M.metal);
    c.boite(l + 0.08, h + 0.08, 0.06, 0xd8d6cf, { y: y + h / 2, z: -0.05 }, M.tole);
    panneau(c, M.enseignes, r, { y: y + h / 2, z: -0.01 }, l, h);
  });
  ctx.b.obstacle(...versMonde(x, z, ry, -l * 0.32, 0), ...versMonde(x, z, ry, l * 0.32, 0), "panneau");
}

/** Un lampadaire à LED (mât fin, tête plate) ; certains penchent. */
function lampadaire(ctx, x, z, penche = 0) {
  const { c, M } = ctx;
  c.repere({ x, z, rz: penche }, () => {
    c.tube([0, 0, 0], [0, 7.5, 0], 0.08, 0xc8ccce, M.metal, 6);
    c.tube([0, 7.4, 0], [0, 7.6, -1.6], 0.05, 0xc8ccce, M.metal, 5);
    c.boite(0.36, 0.08, 0.9, 0x5a6064, { y: 7.62, z: -1.9 }, M.tole);
    c.boite(0.3, 0.02, 0.8, 0xd8e4ea, { y: 7.57, z: -1.9 }, M.lisse);
    c.boite(0.42, 0.06, 0.32, 0x2a3a4a, { y: 7.7, z: -0.6, rx: -0.3 }, M.lisse); // son petit panneau solaire
  });
}

function signalisation(ctx) {
  const { dans, u } = ctx;
  if (dans(-96)) panneauRoute(ctx, -96, -6, 0.3, R.panOuest, 3.4, 1.5, 1.9);
  if (dans(-84)) panneauRoute(ctx, -84, -4.4, 0.3, R.panHub, 3.0, 1.5, 1.6);
  if (dans(95)) panneauRoute(ctx, 95, -6, 0.3, R.panEst, 3.4, 1.5, 1.9);
  for (const x of [-90, -54, 0, 30, 52, 84]) {
    if (!dans(x)) continue;
    const b = bretelle(x);
    lampadaire(ctx, x, b.z + b.d + 1.2, (hash(x) - 0.5) * 0.3 * Math.min(1, u * 1.4));
  }
}

// ---------- 1 · La file, le totem, le bassin, les trottinettes ----------

/** Les barrières « File optimisée par IA » (goulet 1) : de la glissière au bassin, un couloir au milieu. */
function barrieres(ctx) {
  const { c, M, b, dans, u } = ctx;
  const x = BARRIERE.x;
  if (!dans(x)) return;
  const zc = zR(x);
  const morceaux = [[Z.gril + 0.05, zc - 0.75], [zc + 0.75, BASSINS[0].clo.z0]];
  for (const [za, zb] of morceaux) {
    // barrières mobiles de chantier, grillagées, sur plots de béton
    const n = Math.max(1, Math.round((zb - za) / 3.4));
    const pas = (zb - za) / n;
    for (let i = 0; i < n; i++) {
      const zm = za + (i + 0.5) * pas;
      const penche = hash(x, zm) < 0.25 * u ? 0.12 : 0;
      panneau(c, M.enseignes, R.grillage, { x: x + penche, y: 1.0, z: zm, ry: PI / 2, rz: penche }, pas - 0.1, 1.9, 0xd4d8d4);
      for (const s of [-1, 1]) c.boite(0.6, 0.14, 0.24, C.betonClair, { x, y: 0.07, z: zm + (s * pas) / 2 - s * 0.15 }, M.mat);
    }
    b.obstacle(x, za, x, zb, "barrières de la file d'attente");
  }
  // Le panneau « File optimisée par IA », de part et d'autre du couloir
  for (const s of [-1, 1]) {
    const z = zc + s * 1.0;
    c.boite(0.08, 2.2, 0.08, C.acier, { x: x + 0.1, y: 1.1, z }, M.metal);
    panneau(c, M.enseignes, R.file, { x: x + 0.15, y: 2.1, z, ry: 0.35 }, 1.7, 0.42);
  }
  // Potelets à sangle tendus en travers des bas-côtés (la file « intelligente » pour voitures)
  for (const [z0, z1] of [[-8.6, zc - 2.2], [zc + 2.2, 8.6]]) {
    let prec = null;
    for (let z = z0; z <= z1 + 0.01; z += 2.1) {
      const tombe = hash(x - 3, z) < 0.3 * u;
      const p = potelet(ctx, x - 3.2, z, tombe);
      if (p && prec) c.boite(0.02, 0.06, Math.hypot(p[2] - prec[2], 0), 0x2f6fb0, { x: p[0], y: 0.92, z: (p[2] + prec[2]) / 2 }, M.toile, { crasse: false });
      prec = p;
    }
  }
  for (let i = 0; i < 6; i++) cone(ctx, x + c.entre(-4, 4), zc + c.entre(-3, 3) + (i % 2 ? 3.5 : -3.5), c.hasard() < 0.5);
  // La pancarte en carton scotchée à la barrière, et une autre posée contre une roue
  panneau(c, M.enseignes, R.pancarte, { x: x + 0.06, y: 1.25, z: zc - 2.4, ry: PI / 2 + 0.05, rz: 0.08 }, 1.0, 0.5);
  panneau(c, M.enseignes, R.pancarte, { x: x - 6.2, y: 0.32, z: zc + 2.7, ry: 0.4, rx: -0.3 }, 0.9, 0.45);
}

function totem(ctx) {
  const { c, M, b, dans } = ctx;
  if (!dans(TOTEM.x)) return;
  const { x, z } = TOTEM;
  const ry = 0.55;
  c.repere({ x, z, ry }, () => {
    c.boite(2.4, 0.5, 1.4, C.betonClair, { y: 0.25 }, M.mat);
    c.boite(1.9, 9.4, 0.7, C.marine, { y: 5.0 }, M.satin);
    c.boite(2.0, 0.3, 0.8, 0xd8d6d0, { y: 9.85 }, M.satin);
    c.boite(1.94, 0.18, 0.74, 0x3fc4e2, { y: 9.6 }, M.lisse);
    panneau(c, M.enseignes, R.totem, { y: 6.4, z: 0.36 }, 1.7, 3.96);
    panneau(c, M.ecran, R.attente, { y: 3.2, z: 0.36 }, 1.7, 0.85);
    panneau(c, M.enseignes, R.totem, { y: 6.4, z: -0.36, ry: PI }, 1.7, 3.96);
    // le petit panneau solaire bricolé qui fait encore vivre l'écran, et sa batterie au pied
    c.boite(1.2, 0.04, 0.8, 0x24344a, { y: 10.2, z: 0.2, rx: 0.5 }, M.lisse);
    c.boite(0.5, 0.4, 0.35, 0x3a3e40, { x: 0.7, y: 0.7, z: 0.6 }, M.tole);
  });
  rect(b, x, z, 2.4, 1.4, ry, "totem");
  halo(ctx, x + 0.6, z + 1.0, 2.4, 0x3a2408);
  ctx.b.lumiere(x + 0.4, 3.2, z + 0.9, 0xffa040, 2.5, 9, "écran ambré du totem « 3 427 jours » (batterie solaire)");
}

function panneauIA(ctx) {
  const { c, M, b, dans } = ctx;
  const x = -57;
  const z = -8.2;
  if (!dans(x)) return;
  c.repere({ x, z, ry: 0.15 }, () => {
    for (const s of [-1, 1]) c.boite(0.25, 5.2, 0.25, 0x7a8286, { x: s * 2.2, y: 2.6 }, M.tole);
    c.boite(6.3, 3.3, 0.2, 0x3a3e42, { y: 3.9, z: -0.12 }, M.tole);
    panneau(c, M.enseignes, R.ia, { y: 3.9, z: 0.0 }, 6.1, 3.06);
    c.boite(6.3, 0.1, 0.5, 0x7a8286, { y: 2.2, z: 0.2 }, M.metal);
  });
  rect(b, x, z, 4.6, 0.4, 0.15, "panneau publicitaire");
}

function stationGlisse(ctx) {
  const { c, M, b, dans, u } = ctx;
  if (!dans((GLISSE.x0 + GLISSE.x1) / 2)) return;
  const { x0, x1, z0, z1 } = GLISSE;
  c.pave(x0, 0, z0, x1, 0.05, z1, C.betonClair, M.mat, { crasse: false, nuance: 0 });
  // Le rack de recharge (bornes basses) et ses trottinettes
  const zr = z0 + 1.2;
  c.pave(x0 + 0.5, 0.05, zr - 0.2, x1 - 0.5, 0.4, zr + 0.2, 0x2a9a7a, M.satin);
  for (let i = 0; i < 9; i++) {
    const x = x0 + 1.0 + i * 0.7;
    c.boite(0.12, 0.9, 0.18, 0xd8d6d0, { x, y: 0.5, z: zr }, M.satin);
    const r = hash(x, zr);
    if (r < 0.55) trottinette(ctx, x, zr + 0.6, -PI / 2, r < 0.25 * u + 0.1);
  }
  b.obstacle(x0 + 0.5, zr, x1 - 0.5, zr, "rack de trottinettes");
  // Les vélos électriques (batteries arrachées) et l'arceau
  const zv = z0 + 4.5;
  c.pave(x0 + 0.5, 0.05, zv - 0.05, x1 - 0.5, 0.95, zv + 0.05, 0x8d9497, M.metal);
  for (let i = 0; i < 6; i++) {
    const x = x0 + 1.2 + i * 1.05;
    if (hash(x, zv) < 0.75) velo(ctx, x, zv + 0.45, -PI / 2 + (hash(x) - 0.5) * 0.2, hash(zv, x) < 0.35 * u);
  }
  b.obstacle(x0 + 0.5, zv, x1 - 0.5, zv, "arceau à vélos");
  // Des trottinettes jetées dans l'herbe, le panneau
  for (let i = 0; i < 4; i++) trottinette(ctx, c.entre(x0 - 1, x1 + 1), c.entre(z1 - 1, z1 + 3), c.hasard() * 6, true);
  c.repere({ x: x1 - 0.4, z: z0 + 0.4, ry: 0.5 }, () => {
    c.boite(0.1, 2.6, 0.1, C.acier, { y: 1.3 }, M.metal);
    panneau(c, M.enseignes, R.glisse, { y: 2.2, z: 0.06 }, 1.6, 0.8);
  });
}

function bassinEtVoiture(ctx) {
  const { dans } = ctx;
  // La voiture qui a glissé dans le bassin d'orage, le nez dans l'eau
  if (dans(-80)) voiture(ctx, -80, 19, 0.4, { couleur: teinte(4), rz: -0.35, y: -1.15, type: "berline", nature: "épave dans le bassin" });
}

// ---------- 2 · L'ombrière et ses bornes ----------

function ombriere(ctx) {
  const { c, M, b, u, x0, x1 } = ctx;
  if (!(x0 < OMB.x1 + 1 && x1 > OMB.x0 - 1)) return;
  const k = b.couche("ombriere", { x: (OMB.x0 + OMB.x1) / 2, z: OMB.zc, l: OMB.x1 - OMB.x0, p: OMB.z1 - OMB.z0 }, OMB.hb - 0.6, OMB.hc + 2.5);
  const blanc = C.blancStructure;
  // Le sol du parking (sous l'ombrière, hors de l'allée) : places peintes en vert, lignes blanches
  for (const [za, zb] of [[OMB.z0 - 0.2, ALLEE.z - ALLEE.d], [ALLEE.z + ALLEE.d, OMB.z1 + 0.2]]) {
    c.pave(OMB.x0 - 1.6, 0, za, OMB.x1 + 1.6, 0.028, zb, C.parking, M.asphalte, { crasse: false, nuance: 0 });
  }
  const vert = new THREE.Color(C.vert).lerp(new THREE.Color(0x7a7a70), 0.3 * u).getHex();
  for (let i = 0; i <= 12; i++) {
    const x = OMB.x0 + 3.2 * i;
    c.pave(x - 0.06, 0.028, -6.3, x + 0.06, 0.033, -0.5, C.blanc, M.mat, { crasse: false, nuance: 0 });
    c.pave(x - 0.06, 0.028, 8.5, x + 0.06, 0.033, 14.3, C.blanc, M.mat, { crasse: false, nuance: 0 });
    if (i < 12) {
      c.pave(x + 0.2, 0.028, -4.9, x + 3.0, 0.031, -0.7, vert, M.mat, { crasse: false, nuance: 0.03 });
      c.pave(x + 0.2, 0.028, 8.7, x + 3.0, 0.031, 12.9, vert, M.mat, { crasse: false, nuance: 0.03 });
    }
  }
  // Les poteaux en V (bas permanents, haut dans la couche) et les arcs
  for (const xr of COTES) {
    for (const [zp, zbord, sens] of [[OMB.z0 + 0.6, OMB.z0, 1], [OMB.z1 - 0.6, OMB.z1, -1]]) {
      cylY(c, M.satin, blanc, xr, zp, 0, 3.5, 0.26, 0.2, 8);
      c.boite(0.8, 0.2, 0.8, C.betonClair, { x: xr, y: 0.1, z: zp }, M.mat);
      rect(b, xr, zp, 0.6, 0.6, 0, "poteau de l'ombrière");
      k.poutre([xr, 3.4, zp], [xr, yArc(zbord) + 0.05, zbord], 0.24, blanc, M.satin);
      k.poutre([xr, 3.4, zp], [xr, yArc(zp + sens * 2.6), zp + sens * 2.6], 0.22, blanc, M.satin);
    }
    for (let j = 0; j < 12; j++) {
      const za = OMB.z0 + ((OMB.z1 - OMB.z0) * j) / 12;
      const zb = OMB.z0 + ((OMB.z1 - OMB.z0) * (j + 1)) / 12;
      k.poutre([xr, yArc(za) + 0.12, za], [xr, yArc(zb) + 0.12, zb], 0.34, blanc, M.satin);
    }
  }
  // Les panneaux solaires, sur l'arc : présents, cassés, volés (trou dans le ciel), tombés au sol
  const NS = 8;
  const baieMarche = Math.floor((BAIES[MARCHE] - OMB.x0) / 6.4);
  for (let i = 0; i < COTES.length - 1; i++) {
    const xa = COTES[i];
    const xm = xa + 3.2;
    for (let j = 0; j <= NS; j++) {
      const zj = OMB.z0 + ((OMB.z1 - OMB.z0) * j) / NS;
      k.boite(6.3, 0.1, 0.12, 0xd2d4d2, { x: xm, y: yArc(zj) + 0.3, z: zj }, M.tole);
    }
    for (let j = 0; j < NS; j++) {
      const za = OMB.z0 + ((OMB.z1 - OMB.z0) * j) / NS + 0.04;
      const zb = OMB.z0 + ((OMB.z1 - OMB.z0) * (j + 1)) / NS - 0.04;
      const ya = yArc(za) + 0.38;
      const yb = yArc(zb) + 0.38;
      for (let p = 0; p < 4; p++) {
        const pa = xa + p * 1.6 + 0.05;
        const pb = pa + 1.5;
        const r = hash(pa * 1.7, za * 2.3);
        const protege = i === baieMarche && j < 3; // au-dessus de la dernière borne : tout est là
        const vole = !protege && r < 0.05 + 0.22 * u;
        const tombe = !protege && !vole && r < 0.09 + 0.3 * u;
        if (vole) continue;
        if (tombe) {
          // tombé au sol, ou sur une voiture
          const zs = za + (hash(pa, 3) - 0.5) * 2;
          const sur = Math.abs(zs + 2.3) < 2.2 || Math.abs(zs - 10.3) < 2.2;
          const yy = sur ? 1.45 : 0.08;
          c.repere({ x: pa + 0.75 + (hash(pa, 7) - 0.5), y: yy, z: zs, ry: (hash(pa, 9) - 0.5) * 1.2, rx: -PI / 2 + (hash(za, 5) - 0.5) * 0.5, rz: (hash(pa, 11) - 0.5) * 0.3 }, () => {
            panneau(c, M.enseignes, R.solaireCasse, {}, 1.5, 1.0);
          });
          continue;
        }
        const casse = hash(pa * 3.1, za) < 0.12 + 0.2 * u;
        quadAtlas(k, M.enseignes, casse ? R.solaireCasse : R.solaire, [[pa, ya, za], [pb, ya, za], [pb, yb, zb], [pa, yb, zb]]);
      }
    }
    // Rives : chéneau au nord et au sud
    for (const [zr, s] of [[OMB.z0, -1], [OMB.z1, 1]]) k.boite(6.4, 0.36, 0.26, blanc, { x: xm, y: OMB.hb + 0.12, z: zr + s * 0.1 }, M.satin);
  }
  // Les enseignes : fronton sud, slogan, grand logo sur le pignon est (vers la caméra)
  panneau(k, M.enseignes, R.fronton, { x: -36.8, y: OMB.hb - 0.15, z: OMB.z1 + 0.24 }, 4.4, 1.1);
  panneau(k, M.enseignes, R.slogan, { x: -17.6, y: OMB.hb - 0.15, z: OMB.z1 + 0.24 }, 4.4, 1.1);
  k.boite(0.2, 2.4, 8.4, 0x3a3e42, { x: OMB.x1 + 0.2, y: OMB.hc + 1.2, z: OMB.zc }, M.tole);
  panneau(k, M.enseignes, R.fronton, { x: OMB.x1 + 0.32, y: OMB.hc + 1.2, z: OMB.zc, ry: PI / 2 }, 8.2, 2.05);
  // Le tableau des tarifs, au pied du dernier poteau
  c.repere({ x: -6.6, z: -3.2, ry: 0.5 }, () => {
    c.boite(0.1, 2.5, 0.1, C.acier, { x: -0.7, y: 1.25 }, M.metal);
    c.boite(0.1, 2.5, 0.1, C.acier, { x: 0.7, y: 1.25 }, M.metal);
    panneau(c, M.enseignes, R.tarifs, { y: 1.9, z: 0.06 }, 1.8, 0.72);
  });
  // Le coffret d'onduleurs au pied d'un poteau, ouvert
  c.boite(0.9, 1.3, 0.4, 0xc8ccc8, { x: -8.4, y: 0.85, z: -5.2 }, M.tole);
  c.boite(0.9, 1.3, 0.05, 0xc8ccc8, { x: -7.7, y: 0.85, z: -4.7, ry: -1.2 }, M.tole);
  mascotte(ctx, k);
}

/** Watty, la mascotte gonflable géante, dégonflée et affalée sur l'ombrière ; un bras pend au bord. */
function mascotte(ctx, k) {
  const { c, M } = ctx;
  const jaune = 0xd8b440;
  // Le corps : des boudins jaunes aplatis qui épousent l'arc
  for (let i = 0; i < 9; i++) {
    const x = -31 + i * 1.1;
    const z = 2.2 + Math.sin(i * 1.3) * 0.8;
    k.poser(GEO.BOULE, M.satin, i < 2 ? C.rouge : jaune, { x, y: yArc(z) + 0.65, z, rx: 0.2, ry: i * 0.7, e: [1.3, 0.45, 2.4] }, { crasse: false, nuance: 0.05 });
  }
  for (let i = 0; i < 5; i++) {
    const z = 4.5 + i * 0.9;
    k.poser(GEO.BOULE, M.satin, jaune, { x: -25.5 + Math.sin(i) * 0.6, y: yArc(z) + 0.55, z, ry: i, e: [1.8, 0.4, 1.1] }, { crasse: false, nuance: 0.05 });
  }
  // La borne « + » de la pile (le bouton argenté), écrasée
  k.poser(GEO.BOULE, M.metal, 0xb8bcbe, { x: -32.2, y: yArc(2) + 0.7, z: 2, e: [0.6, 0.3, 0.6] }, { crasse: false });
  // Le visage, tourné vers le ciel (et vers la caméra)
  k.repere({ x: -26.4, y: yArc(5.6) + 0.95, z: 5.6, rx: -PI / 2 + 0.5, ry: 0.25 }, () => panneau(k, M.enseignes, R.wattyFace, {}, 2.6, 2.6));
  // Le bras qui pend par-dessus le chéneau sud
  const bras = [[-24.6, yArc(9) + 0.45, 9], [-24.4, yArc(11.5) + 0.45, 11.5], [-24.3, OMB.hb + 0.5, 14.3], [-24.3, OMB.hb - 0.6, 14.85], [-24.4, OMB.hb - 1.6, 14.9]];
  for (let i = 0; i < bras.length - 1; i++) k.poutre(bras[i], bras[i + 1], 0.75, jaune, M.satin);
  k.poser(GEO.BOULE, M.satin, 0xeceae4, { x: -24.4, y: OMB.hb - 2.0, z: 14.9, e: [0.45, 0.4, 0.45] }, { crasse: false });
  // Les haubans d'origine, et le souffleur au sol relié par sa manche
  for (const [ax, az] of [[-31, 0.4], [-22, 6.6]]) k.tube([ax, yArc(az) + 0.5, az], [ax + 1.5, yArc(az - 2) + 0.2, az - 2], 0.02, 0x8a8a84, M.tole, 4);
  c.boite(0.9, 0.6, 0.7, 0x3a5a8a, { x: -21, y: 0.3, z: 15.9 }, M.tole);
  c.tube([-21, 0.5, 15.9], [-23.5, 1.5, 15.2], 0.18, jaune, M.satin, 6);
  rect(ctx.b, -21, 15.9, 0.9, 0.7, 0, "souffleur");
}

function bornes(ctx) {
  const { dans, u } = ctx;
  BAIES.forEach((x, i) => {
    if (!dans(x)) return;
    for (const rangee of ["nord", "sud"]) {
      const nord = rangee === "nord";
      const marche = nord && i === MARCHE;
      const zb = nord ? BORNE_NORD : BORNE_SUD;
      const zv = nord ? -2.32 : 10.32;
      const r = hash(x * 1.3, zb);
      const type = r < 0.25 ? "suv" : r < 0.4 ? "citadine" : "berline";
      // la voiture garée en marche arrière, l'arrière (et sa trappe) contre la borne
      const prise = voiture(ctx, x + (hash(x, 1) - 0.5) * 0.2, zv + (type === "citadine" ? (nord ? -0.35 : 0.35) : 0), nord ? -PI / 2 : PI / 2, { type, couleur: teinte(i * 5 + (nord ? 0 : 3)), port: 1, ouverte: hash(x, zb * 3) < 0.15 });
      const etat = marche ? "branche" : r > 0.55 + 0.25 * u ? "branche" : hash(zb, x) < 0.3 ? "arrache" : "coupe";
      borne(ctx, x, zb, nord ? 0 : PI, { marche, etat, prise });
      if (marche) {
        halo(ctx, x, zb + 1.2, 2.2, 0x0a3a5a);
        halo(ctx, x, zb + 0.6, 1.1, 0x1a5a8a, 0.06);
        ctx.b.lumiere(x, 1.5, zb + 0.6, 0x5fd0ff, 6, 14, "la dernière borne qui marche (lueur bleue, sur les derniers panneaux solaires)");
      }
    }
  });
}

function aireDeJeux(ctx) {
  const { c, M, b, dans, u } = ctx;
  if (!dans((JEUX.x0 + JEUX.x1) / 2)) return;
  const { x0, x1, z0, z1 } = JEUX;
  // Le sol souple, en dalles de couleur passée
  const tons = [0xa85a4a, 0x4a7aa0, 0x7aa04a, 0xc8a04a];
  for (let x = x0; x < x1 - 0.01; x += 2.5) for (let z = z0; z < z1 - 0.01; z += 2.75) {
    c.pave(x + 0.02, 0, z + 0.02, Math.min(x1, x + 2.5) - 0.02, 0.06, Math.min(z1, z + 2.75) - 0.02, tons[(Math.round(x / 2.5) + Math.round(z / 2.75)) & 3], M.mat, { crasse: false, nuance: 0.05 });
  }
  // La clôture basse (portillon à l'est)
  for (const [a, bb] of [[[x0, z0], [x1, z0]], [[x0, z1], [x0, z0]], [[x1, z0], [x1, z0 + 4]], [[x1, z0 + 5.6], [x1, z1]]]) {
    const L = Math.hypot(bb[0] - a[0], bb[1] - a[1]);
    const ry = -Math.atan2(bb[1] - a[1], bb[0] - a[0]);
    c.repere({ x: a[0], z: a[1], ry }, () => {
      c.boite(L, 0.06, 0.06, 0xc8a83a, { x: L / 2, y: 0.85 }, M.tole);
      c.boite(L, 0.06, 0.06, 0xc8a83a, { x: L / 2, y: 0.35 }, M.tole);
      for (let s = 0; s <= L; s += 1.5) c.boite(0.07, 0.9, 0.07, 0x3fa0c0, { x: s, y: 0.45 }, M.tole);
    });
    b.obstacle(a[0], a[1], bb[0], bb[1], "clôture de l'aire de jeux");
  }
  // Le toboggan Watty : une pile géante, plateforme, glissière
  const tx = -40;
  const tz = 23;
  cylY(c, M.satin, 0xd8b440, tx, tz, 0, 3.2, 1.3, 1.3, 10);
  cylY(c, M.satin, C.rouge, tx, tz, 3.2, 3.9, 1.3, 1.3, 10);
  cylY(c, M.metal, 0xb8bcbe, tx, tz, 3.9, 4.3, 0.45, 0.45, 8);
  panneau(c, M.enseignes, R.wattyFace, { x: tx + 0.6, y: 2.0, z: tz + 1.17, ry: 0.45 }, 1.3, 1.3);
  c.boite(1.2, 0.08, 3.6, 0x3fa0c0, { x: tx + 0.4, y: 1.55, z: tz - 2.7, rx: 0.78 }, M.satin);
  for (const s of [-1, 1]) c.boite(0.06, 0.25, 3.6, 0x3fa0c0, { x: tx + 0.4 + s * 0.6, y: 1.7, z: tz - 2.7, rx: 0.78 }, M.satin);
  c.boite(0.8, 2.4, 0.15, 0xc8a83a, { x: tx - 1.6, y: 1.2, z: tz, rz: -0.25 }, M.tole); // l'échelle
  rect(b, tx, tz, 2.6, 2.6, 0, "toboggan");
  // Les balançoires (une assise pend par une seule chaîne)
  const bx = -34.5;
  const bz = 21;
  for (const s of [-1, 1]) {
    c.tube([bx - 2, 0, bz + s * 0.8], [bx - 2, 2.6, bz], 0.06, 0xc83a2a, M.tole, 6);
    c.tube([bx + 2, 0, bz + s * 0.8], [bx + 2, 2.6, bz], 0.06, 0xc83a2a, M.tole, 6);
  }
  c.tube([bx - 2, 2.6, bz], [bx + 2, 2.6, bz], 0.06, 0xc83a2a, M.tole, 6);
  for (const [dx, cassee] of [[-0.9, false], [0.9, u > 0.4]]) {
    c.boite(0.02, 2.0, 0.02, 0x8a8a84, { x: bx + dx - 0.2, y: 1.6, z: bz }, M.metal);
    if (!cassee) {
      c.boite(0.02, 2.0, 0.02, 0x8a8a84, { x: bx + dx + 0.2, y: 1.6, z: bz }, M.metal);
      c.boite(0.5, 0.05, 0.22, 0x2a2a2a, { x: bx + dx, y: 0.6, z: bz }, M.mat);
    } else c.boite(0.5, 0.05, 0.22, 0x2a2a2a, { x: bx + dx - 0.1, y: 0.5, z: bz, rz: 1.3 }, M.mat);
  }
  b.obstacle(bx - 2, bz - 0.8, bx - 2, bz + 0.8, "balançoire");
  b.obstacle(bx + 2, bz - 0.8, bx + 2, bz + 0.8, "balançoire");
  // Deux petites piles à ressort
  for (const [px, pz, rz] of [[-36, 26.2, 0], [-33, 26.6, u > 0.6 ? 1.2 : 0.2]]) {
    c.repere({ x: px, z: pz, rz }, () => {
      cylY(c, M.metal, 0x8a8a84, 0, 0, 0, 0.5, 0.12, 0.12, 6);
      cylY(c, M.satin, 0xd8b440, 0, 0, 0.5, 1.2, 0.3, 0.3, 8);
      cylY(c, M.satin, C.rouge, 0, 0, 1.2, 1.4, 0.3, 0.3, 8);
    });
  }
  // Le banc des parents, la peluche oubliée, le panneau
  c.boite(1.8, 0.08, 0.45, PALETTE.bois, { x: -43.5, y: 0.45, z: 19, ry: 0.1 }, M.mat);
  c.boite(1.8, 0.45, 0.06, PALETTE.bois, { x: -43.5, y: 0.75, z: 18.8, ry: 0.1 }, M.mat);
  c.boite(0.25, 0.32, 0.2, 0xd8b440, { x: -37.2, y: 0.2, z: 22.6, rz: 0.8 }, M.mat);
  c.repere({ x: x1 + 0.3, z: z0 + 4.8, ry: PI / 2 - 0.2 }, () => {
    for (const s of [-1, 1]) c.boite(0.08, 2.4, 0.08, C.acier, { x: s * 1.3, y: 1.2 }, M.metal);
    panneau(c, M.enseignes, R.kids, { y: 2.0, z: 0.06 }, 2.6, 1.04);
  });
  semerTouffes(c, x0, z0, x1, z1, Math.round(10 + 20 * u), C.herbeSeche, 0.06);
}

// ---------- 3 · Le Watty Lounge, le camion, le portique, le campement ----------

function lounge(ctx) {
  const { c, M, b, u, dans } = ctx;
  if (!dans((LG.x0 + LG.x1) / 2)) return;
  const { x0, x1, z0, z1, h } = LG;
  const blanc = 0xe6e4de;
  const bris = 0.3 + 0.6 * u;
  // Le parvis, les allées vers l'allée du hub, la terrasse est
  c.pave(x0 - 2, 0, ALLEE.z + ALLEE.d + 0.2, x1 + 5, 0.04, z1 + 2.2, C.betonClair, M.mat, { crasse: false, nuance: 0 });
  c.pave(x0, 0.04, z0, x1, 0.07, z1, 0xdcd8ce, M.lisse, { crasse: false, nuance: 0 });
  for (let x = x0 + 2; x < x1; x += 2) c.boite(0.03, 0.004, z1 - z0, 0xc8c4ba, { x, y: 0.072, z: (z0 + z1) / 2 }, M.mat, { crasse: false });
  // Mur nord (bardage blanc, porte de service) et mur ouest (aveugle : l'écran géant est derrière)
  const spec = { h, ep: 0.3, couleur: blanc, mat: M.satin, batiment: b, interieur: { couleur: 0xd2cec4, mat: M.mat } };
  mur(c, [x1, z0], [x0, z0], { ...spec, ouvertures: [{ u: x1 - 20, l: 1.2, bas: 0, haut: 2.2, type: "porte", vantail: "entrouvert", couleurPorte: 0x6a7a88 }, { u: x1 - 26, l: 2.8, bas: 1.3, haut: 2.9, type: "fenetre", bris, cadre: 0x9aa1a3, croisillons: 1, traverses: 1 }, { u: x1 - 10.5, l: 2.8, bas: 1.3, haut: 2.9, type: "fenetre", bris, cadre: 0x9aa1a3, croisillons: 1, traverses: 1 }] });
  mur(c, [x0, z0], [x0, z1], { ...spec, ouvertures: [] });
  // Façades sud et est : rideaux de verre (porte coulissante à l'est)
  vitrage(ctx, [x0, z1], [x1, z1], { brisees: [6] });
  vitrage(ctx, [x1, z1], [x1, z0], { portes: [z1 - 18.5] });
  // Les toilettes autonettoyantes (bloc fermé, deux capsules)
  mur(c, [13, 18], [13, z0], { h: 2.8, ep: 0.18, couleur: 0xe8eef0, mat: M.lisse, batiment: b, ouvertures: [{ u: 3, l: 1.0, bas: 0, haut: 2.15, type: "porte", vantail: "entrouvert", couleurPorte: 0xc8d0d4 }] });
  mur(c, [x0, 18], [13, 18], { h: 2.8, ep: 0.18, couleur: 0xe8eef0, mat: M.lisse, batiment: b });
  panneau(c, M.enseignes, R.wc, { x: 13.11, y: 2.35, z: 16.2, ry: PI / 2 }, 0.75, 0.75);
  for (const zc of [13.6, 16.4]) {
    tronc(c, M.lisse, 0xeef2f2, { x: 9.6, z: zc }, 2.0, 2.2, 1.6, 1.8, 0, 2.5);
    c.boite(0.05, 2.0, 0.9, 0x3fc4e2, { x: 10.62, y: 1.1, z: zc }, M.lisse);
    rect(b, 9.6, zc, 2.0, 2.2, 0, "capsule de toilettes");
  }
  // Le bar à smoothies : comptoir, arrière-bar, blenders, menu
  c.pave(15, 0, 14.3, 23.4, 1.1, 15.0, 0x7ac25a, M.satin);
  c.pave(14.9, 1.1, 14.2, 23.5, 1.16, 15.1, 0xeceae4, M.lisse);
  c.pave(15, 0, z0 + 0.15, 23.4, 0.95, z0 + 0.8, 0xd8d4ca, M.satin);
  for (let i = 0; i < 6; i++) {
    const x = 15.6 + i * 1.3;
    if (hash(x, 1) < 0.3 * u) continue;
    cylY(c, M.verre, 0xffffff, x, z0 + 0.5, 0.95, 1.4, 0.1, 0.13, 6, { crasse: false });
    c.boite(0.22, 0.14, 0.22, 0x2a2c2e, { x, y: 1.02, z: z0 + 0.5 }, M.satin);
  }
  panneau(c, M.enseignes, R.smoothie, { x: 19.2, y: 2.35, z: z0 + 0.17 }, 2.4, 1.8);
  for (let i = 0; i < 5; i++) {
    const x = 15.8 + i * 1.6;
    const tombe = hash(x, 2) < 0.4 * u;
    c.repere({ x, z: 15.6, rz: tombe ? 1.4 : 0, y: tombe ? 0.25 : 0 }, () => {
      cylY(c, M.metal, 0xb8bcbe, 0, 0, 0, 0.75, 0.04, 0.04, 6);
      cylY(c, M.satin, 0xeceae4, 0, 0, 0.75, 0.85, 0.22, 0.22, 8);
    });
  }
  b.obstacle(15, 14.3, 23.4, 14.3, "comptoir du bar");
  b.obstacle(15, 15.0, 23.4, 15.0, "comptoir du bar");
  // Bougies sur le comptoir (les survivants)
  for (const dx of [0, 0.25, 0.5]) {
    c.boite(0.06, 0.16, 0.06, 0xeee6d0, { x: 18.6 + dx, y: 1.24, z: 14.6 }, M.mat, { crasse: false });
    c.poser(GEO.CONE, M.lueur, 0xffcf6a, { x: 18.6 + dx, y: 1.38, z: 14.6, e: [0.03, 0.09, 0.03] }, { crasse: false, nuance: 0 });
  }
  ctx.b.lumiere(18.85, 1.5, 14.7, 0xffb060, 1.5, 5, "bougies sur le comptoir du bar à smoothies");
  // Le salon : fauteuils-œufs autour de tables basses, l'écran géant, le feu des survivants
  c.boite(0.3, 3.0, 5.8, 0x1a1c1e, { x: x0 + 0.3, y: 1.9, z: 21.5 }, M.lisse);
  panneau(c, M.enseignes, R.ecranGeant, { x: x0 + 0.46, y: 1.9, z: 21.5, ry: PI / 2 }, 5.5, 2.75);
  const coussins = [0x3fa0c0, 0xc8622a, 0x7ac25a, 0xd8b440, 0x3fa0c0, 0xc8622a];
  [[10, 19.6, 0.3], [11.6, 23.6, -0.5], [17.2, 19.4, 2.6], [18.2, 23.4, 3.6], [9.8, 21.6, 0], [15.6, 24.2, -1.6]].forEach(([x, z, ry], i) => {
    const renverse = hash(x, z) < 0.35 * u;
    fauteuilOeuf(ctx, x, z, ry, coussins[i], renverse);
    rect(b, x, z, 1.0, 1.0, 0, "fauteuil-œuf");
  });
  for (const [x, z] of [[12, 21.4], [17.4, 21.6]]) {
    cylY(c, M.lisse, 0xeceae4, x, z, 0.0, 0.42, 0.5, 0.5, 10);
  }
  // Le feu : un bac à plantes en métal devenu brasero, sous la verrière brisée ; duvets autour
  const fx = 14.6;
  const fz = 21.4;
  cylY(c, M.tole, 0x4a4440, fx, fz, 0, 0.55, 0.55, 0.45, 8);
  for (let i = 0; i < 4; i++) c.boite(0.9, 0.1, 0.1, 0x5a4130, { x: fx, y: 0.6, z: fz, ry: i * 0.8 }, M.mat);
  flammes(ctx, fx, 0.55, fz, 1.2);
  halo(ctx, fx, fz, 3.4, 0x3a1a06, 0.08);
  for (const [x, z, ry, col] of [[12.8, 19.6, 0.4, 0x4a6a8a], [16.4, 23.4, 1.2, 0x8a4a3a], [12.6, 23.2, -0.5, 0x5a7a4a]]) c.boite(1.9, 0.12, 0.75, col, { x, y: 0.14, z, ry }, M.mat, { nuance: 0.06 });
  c.boite(0.3, 0.25, 0.3, 0x6a6a64, { x: fx + 0.9, y: 0.2, z: fz - 0.6 }, M.metal); // la marmite
  ctx.b.lumiere(fx, 0.9, fz, 0xff8a3a, 6, 12, "feu des survivants dans le salon du lounge");
  // Le coin consoles : meuble bas, deux écrans, sièges baquets, manettes au sol
  c.pave(20.5, 0.07, 24.0, 25.0, 0.6, 24.6, 0x2a2c2e, M.satin);
  for (const x of [21.6, 23.9]) c.boite(1.6, 0.95, 0.06, 0x101214, { x, y: 1.1, z: 24.4, rx: hash(x) < 0.4 * u ? 0.6 : 0 }, M.lisse);
  for (const [x, z, ry] of [[21.4, 22.4, 0.2], [23.0, 22.2, -0.1], [24.4, 22.6, -0.4]]) {
    c.repere({ x, z, ry }, () => {
      c.boite(0.6, 0.35, 0.6, 0x8a2a24, { y: 0.25 }, M.satin);
      c.boite(0.6, 0.8, 0.15, 0x2a2a2a, { y: 0.7, z: 0.3 }, M.satin);
    });
  }
  for (let i = 0; i < 4; i++) c.boite(0.16, 0.04, 0.1, 0x2a2a2e, { x: c.entre(20.6, 25), y: 0.09, z: c.entre(21.6, 23.6), ry: c.hasard() * 3 }, M.satin, { crasse: false });
  rect(b, 22.75, 24.3, 4.5, 0.6, 0, "meuble des consoles");
  // La boutique Watty (cloisons, étagères, peluches par terre)
  mur(c, [26, 18], [26, z0], { h: 2.9, ep: 0.16, couleur: 0xe8e4da, mat: M.satin, batiment: b, ouvertures: [{ u: 3.5, l: 1.4, bas: 0, haut: 2.3, type: "vide" }] });
  mur(c, [26, 18], [x1, 18], { h: 2.9, ep: 0.16, couleur: 0xe8e4da, mat: M.satin, batiment: b, ouvertures: [{ u: 3, l: 1.6, bas: 0, haut: 2.3, type: "vide" }] });
  panneau(c, M.enseignes, R.boutique, { x: 29, y: 2.65, z: 18.1 }, 1.8, 0.9);
  const produits = [0xd8b440, 0x3fc4e2, 0xeceae4, 0xc8362b, 0x1f3a62];
  etagere(ctx, 29, z0 + 0.5, 0, 4.2, produits, 0.45 + 0.4 * u);
  etagere(ctx, 26.4, 15, -PI / 2, 2.6, produits, 0.45 + 0.4 * u);
  b.obstacle(26.9, z0 + 0.3, 31.1, z0 + 0.3, "étagère");
  c.pave(29.6, 0.07, 15.4, 31.6, 1.0, 16.0, 0x1f3a62, M.satin);
  b.obstacle(29.6, 15.7, 31.6, 15.7, "caisse de la boutique");
  for (let i = 0; i < 7; i++) c.boite(0.24, 0.32, 0.18, i % 3 ? 0xd8b440 : C.rouge, { x: c.entre(27, 31), y: 0.16, z: c.entre(13.6, 17.4), rz: c.entre(0.6, 1.5), ry: c.hasard() * 3 }, M.mat);
  // L'accueil : comptoir arrondi, le concierge-robot Watty couché
  cylY(c, M.lisse, 0xeceae4, 28.6, 21.8, 0.07, 1.05, 0.9, 0.9, 10);
  c.repere({ x: 29.8, z: 23.6, ry: 0.6, rz: PI / 2, y: 0.32 }, () => {
    cylY(c, M.lisse, 0xeceae4, 0, 0, 0, 1.1, 0.3, 0.26, 8);
    c.poser(GEO.BOULE, M.lisse, 0xeceae4, { y: 1.35, e: 0.3 });
    c.boite(0.3, 0.18, 0.06, 0x1a2a3a, { y: 1.35, z: 0.27 }, M.lisse);
  });
  rect(b, 28.6, 21.8, 1.8, 1.8, 0, "comptoir d'accueil");
  // Terrasse est : tables hautes, un parasol couché
  for (const [x, z] of [[34, 21], [34.2, 23.8]]) {
    cylY(c, M.metal, 0xb8bcbe, x, z, 0, 1.05, 0.05, 0.05, 6);
    cylY(c, M.lisse, 0xeceae4, x, z, 1.05, 1.1, 0.4, 0.4, 10);
  }
  c.repere({ x: 35, z: 16.4, rz: 1.45, y: 0.3 }, () => {
    cylY(c, M.metal, 0xb8bcbe, 0, 0, 0, 2.2, 0.04, 0.04, 5);
    c.poser(GEO.CONE, M.toile, 0x3fc4e2, { y: 2.3, e: [1.3, 0.5, 1.3] }, { crasse: false });
  });
  debris(c, x0 + 0.5, z0 + 0.5, x1 - 0.5, z1 - 0.5, Math.round(10 + 25 * u), [0xd8d4ca, 0x9aa8b0, 0xc8c4ba], 0.07);
  jonchee(c, x0, z0, x1, z1, Math.round(20 * u), undefined, 0.075);
  // Le toit (couche) : dalle blanche à grand débord, verrière cassée au-dessus du feu, panneaux, enseignes
  const k = b.couche("toit-lounge", { x: (x0 + x1) / 2, z: (z0 + z1) / 2, l: x1 - x0 + 1.6, p: z1 - z0 + 1.6 }, h - 0.3, h + 2.4);
  const d = 0.9;
  const trou = { x0: 13, x1: 16.6, z0: 19.6, z1: 23.2 };
  const dalles = [[x0 - d, z0 - d, x1 + d, trou.z0], [x0 - d, trou.z1, x1 + d, z1 + d], [x0 - d, trou.z0, trou.x0, trou.z1], [trou.x1, trou.z0, x1 + d, trou.z1]];
  for (const [a1, b1, a2, b2] of dalles) k.pave(a1, h, b1, a2, h + 0.35, b2, 0xeceae4, M.mat, { crasse: false, nuance: 0.01 });
  for (let x = trou.x0; x <= trou.x1 + 0.01; x += 0.9) k.boite(0.08, 0.1, trou.z1 - trou.z0, 0x9aa1a3, { x, y: h + 0.4, z: (trou.z0 + trou.z1) / 2 }, M.tole);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 6; j++) {
    const px = 19 + j * 2;
    const pz = 14 + i * 2;
    if (hash(px, pz) < 0.2 + 0.3 * u) continue;
    quadAtlas(k, M.enseignes, R.solaire, [[px, h + 0.45, pz + 1.6], [px + 1.8, h + 0.45, pz + 1.6], [px + 1.8, h + 0.9, pz], [px, h + 0.9, pz]]);
  }
  k.boite(2.2, 1.0, 1.4, 0xc8ccc8, { x: 29, y: h + 0.85, z: 22 }, M.tole);
  // L'enseigne : sur la rive sud et sur la rive est (vers la caméra)
  k.boite(7.4, 0.12, 0.12, 0x9aa1a3, { x: 20, y: h + 0.4, z: z1 + 0.6 }, M.tole);
  panneau(k, M.enseignes, R.lounge, { x: 20, y: h + 1.2, z: z1 + 0.65 }, 7.0, 1.75);
  panneau(k, M.enseignes, R.lounge, { x: x1 + 0.65, y: h + 1.05, z: 18.5, ry: PI / 2 }, 5.6, 1.4);
  // L'auvent de l'entrée est
  k.pave(x1, h - 0.4, 16.6, x1 + 2.6, h - 0.25, 20.4, 0xeceae4, M.mat, { crasse: false });
}

function camionRescue(ctx) {
  const { c, M, b, dans, u } = ctx;
  if (!dans(CAMION.x)) return;
  const { x, z } = CAMION;
  // Couché sur le flanc : le côté gauche (sa livrée) regarde le ciel
  c.repere({ x, y: 1.2, z, rx: PI / 2 }, () => {
    c.boite(5.6, 2.9, 2.4, 0xe8e4da, { x: -1.0, y: 2.35 }, M.satin); // la caisse
    c.boite(1.9, 2.3, 2.3, 0xc8362b, { x: 2.85, y: 1.95 }, M.satin); // la cabine
    c.boite(0.1, 1.0, 2.1, 0xffffff, { x: 3.81, y: 2.4 }, M.verre, { crasse: false });
    c.boite(7.6, 0.35, 2.0, 0x2a2c2e, { x: -0.1, y: 0.7 }, M.tole);
    for (const xr of [-2.7, -1.5, 2.6]) for (const s of [-1, 1]) c.poser(GEO.ROUE, M.mat, 0x222222, { x: xr, y: 0.5, z: s * 1.05, rx: PI / 2, e: [1.45, 1.4, 1.45] }, { crasse: false });
    panneau(c, M.enseignes, R.rescue, { x: -1.0, y: 2.35, z: -1.21, ry: PI }, 5.4, 1.35);
    panneau(c, M.enseignes, R.rescue, { x: -1.0, y: 2.35, z: 1.21 }, 5.4, 1.35);
    // la porte arrière arrachée
    c.boite(0.08, 2.6, 1.15, 0xe8e4da, { x: -3.95, y: 2.3, z: 1.7, ry: 0.9 }, M.satin);
  });
  rect(b, x - 0.1, z + 1.6, 7.7, 3.4, 0, "camion Watty Rescue renversé");
  // Les modules de batterie répandus par la porte arrière (certains brûlés), les câbles
  for (let i = 0; i < 9; i++) {
    const mx = x - 5.3 + c.entre(-1.6, 1.2);
    const mz = z + 1.2 + c.entre(-0.6, 3.8);
    const brule = c.hasard() < 0.3 + 0.2 * u;
    c.boite(0.8, 0.35, 0.55, brule ? 0x2e2a28 : 0x4a5258, { x: mx, y: 0.18, z: mz, ry: c.hasard() * 3, rz: c.entre(-0.2, 0.2) }, M.tole);
    if (!brule) c.boite(0.81, 0.06, 0.1, 0x3fc4e2, { x: mx, y: 0.3, z: mz }, M.lisse, { crasse: false });
  }
  c.pave(x - 7, 0.031, z + 0.5, x - 4, 0.034, z + 4.4, C.suie, M.mat, { crasse: false });
  for (let i = 0; i < 3; i++) c.tube([x - 4.2, 0.4, z + 1.2 + i * 0.5], [x - 6.2 - i * 0.6, 0.05, z + 2.6 + i * 0.4], 0.035, 0x1c1d1e, M.mat, 5);
  // Le panneau « Rechargez votre voiture, rechargez votre vie » derrière le camion
  c.repere({ x: 25, z: -8.4, ry: 0.1 }, () => {
    for (const s of [-1, 1]) c.boite(0.2, 4.4, 0.2, 0x7a8286, { x: s * 2.3, y: 2.2 }, M.tole);
    c.boite(6.4, 1.7, 0.16, 0x3a3e42, { y: 3.7, z: -0.1 }, M.tole);
    panneau(c, M.enseignes, R.slogan, { y: 3.7, z: 0.0 }, 6.2, 1.55);
  });
  rect(b, 25, -8.4, 4.8, 0.3, 0.1, "panneau publicitaire");
}

function portiqueTombe(ctx) {
  const { c, M, b, dans, u } = ctx;
  const x = PORTIQUE.x;
  if (!dans(x)) return;
  // Le portique à messages, plié, couché en travers des quatre voies sur un carambolage brûlé
  c.tube([x - 2.2, 0, Z.merlonN + 0.6], [x - 1.8, 4.2, Z.merlonN + 1.2], 0.25, C.acier, M.tole, 8);
  c.tube([x + 2.4, 0, -10.8], [x + 2.6, 1.0, -11.6], 0.25, C.acier, M.tole, 8);
  const A = [x - 1.8, 3.9, Z.merlonN + 1.4];
  const B = [x + 2.4, 0.6, -11.8];
  for (const dy of [0, 0.8]) for (const dz of [-0.4, 0.4]) c.poutre([A[0], A[1] + dy, A[2] + dz], [B[0], B[1] + dy, B[2] + dz], 0.12, 0x9aa1a3, M.tole);
  for (let t = 0.05; t < 1; t += 0.06) {
    const p = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t];
    c.boite(0.08, 0.95, 0.08, 0x9aa1a3, { x: p[0], y: p[1] + 0.4, z: p[2], rz: 0.6 }, M.tole);
  }
  c.repere({ x: x + 0.6, y: 1.9, z: -20.5, ry: -1.4, rx: 0.5 }, () => {
    c.boite(6.0, 1.6, 0.45, 0x1a1c1e, {}, M.tole);
    c.boite(5.6, 1.3, 0.02, 0x2a2a28, { z: 0.24 }, M.lisse);
  });
  // Le carambolage : voitures brûlées, empilées
  voiture(ctx, x - 1.5, -25.5, 0.6, { brulee: true, type: "suv" });
  voiture(ctx, x + 1.0, -23.0, -0.4, { brulee: true });
  voiture(ctx, x - 0.4, -24.3, 1.2, { brulee: true, y: 1.15, rz: 0.25, sansObstacle: true });
  voiture(ctx, x + 1.8, -16.5, 2.2, { brulee: true, type: "citadine" });
  voiture(ctx, x - 1.2, -14.0, -0.3, { couleur: teinte(7), rz: -0.15 });
  voiture(ctx, x + 2.6, -18.8, 1.6, { brulee: true, rx: PI, y: 1.55, sansObstacle: true });
  c.pave(x - 6, 0.021, -29, x + 6, 0.024, -12, C.suie, M.mat, { crasse: false, nuance: 0 });
  gravats(c, x + 0.5, -20.5, 1.6, 10, [C.betonClair, 0x8a8680, 0x3a3634]);
  debris(c, x - 5, -29, x + 5, -11, Math.round(20 + 20 * u), [0x3a3634, 0x9aa1a3, 0xcfe0e4]);
  // Infranchissable : de la glissière du merlon à celle du hub
  b.obstacle(x, Z.merlonN + 0.2, x, Z.glis, "portique à messages tombé sur un carambolage brûlé");
}

function campement(ctx) {
  const { c, M, b, dans, u } = ctx;
  if (!dans((CAMP.x0 + CAMP.x1) / 2)) return;
  const { x0, x1, z0, z1 } = CAMP;
  c.pave(x0, 0, z0, x1, 0.03, z1, C.parking, M.asphalte, { crasse: false, nuance: 0 });
  for (let x = x0 + 0.2; x < x1; x += 2.6) c.pave(x - 0.05, 0.03, z0 + 0.4, x + 0.05, 0.034, z0 + 5.2, C.blanc, M.mat, { crasse: false });
  c.repere({ x: x0 + 0.4, z: z0 + 0.3, ry: 0.4 }, () => {
    c.boite(0.08, 2.2, 0.08, C.acier, { y: 1.1 }, M.metal);
    panneau(c, M.enseignes, R.file, { y: 1.95, z: 0.06 }, 1.9, 0.48);
  });
  // Les voitures de ceux qui ont attendu des jours
  const v = [[39.5, 13.4, -PI / 2, "suv"], [42.1, 13.4, -PI / 2, "berline"], [47.3, 13.6, -PI / 2, "berline"], [40, 24.6, 0.1, "citadine"], [47.5, 21.6, PI / 2 + 0.2, "suv"]];
  v.forEach(([x, z, ry, type], i) => voiture(ctx, x, z, ry, { type, couleur: teinte(i * 3 + 1), ouverte: i % 2 === 0 }));
  // Une tente contre une voiture, un fil à linge, des chaises, un barbecue de fortune
  c.repere({ x: 43.2, z: 19, ry: 0.3 }, () => {
    const g = new THREE.CylinderGeometry(1.3, 1.3, 2.4, 3, 1, false);
    c.poser(g, M.toile, 0x5a7a4a, { y: 0.65, rz: PI / 2, rx: PI / 2, e: [1, 1, 0.8] }, { crasse: false, nuance: 0.05 });
    g.dispose();
  });
  rect(b, 43.2, 19, 2.6, 2.4, 0.3, "tente");
  c.tube([45.6, 1.7, 23.8], [49, 1.7, 17.2], 0.012, 0xd8d4ca, M.metal, 3);
  for (let i = 0; i < 5; i++) {
    const t = 0.15 + i * 0.17;
    c.boite(0.5, 0.6, 0.02, [0xc83a2a, 0xeceae4, 0x3fa0c0, 0xd8b440, 0x5a7a4a][i], { x: 45.6 + 3.4 * t, y: 1.38, z: 23.8 - 6.6 * t, ry: 1.1 }, M.toile, { crasse: false });
  }
  for (const [x, z, ry] of [[41.6, 20.6, 0.5], [44.6, 21.8, -0.8]]) {
    c.repere({ x, z, ry, rz: hash(x) < 0.4 * u ? 1.3 : 0 }, () => {
      c.boite(0.5, 0.04, 0.45, 0x3a5a8a, { y: 0.4 }, M.toile);
      c.boite(0.5, 0.5, 0.04, 0x3a5a8a, { y: 0.65, z: -0.22 }, M.toile);
    });
  }
  // Le barbecue de jantes (ses braises tiennent encore) et des jerricans
  cylY(c, M.tole, 0x3a3634, 44, 20.4, 0, 0.5, 0.42, 0.42, 8);
  flammes(ctx, 44, 0.45, 20.4, 0.55);
  halo(ctx, 44, 20.4, 1.6, 0x2a1406, 0.04);
  ctx.b.lumiere(44, 0.7, 20.4, 0xff7030, 2, 6, "braises du barbecue du campement");
  for (const [x, z] of [[41, 17.4], [41.4, 17.8]]) c.boite(0.35, 0.45, 0.2, 0x3a6a3a, { x, y: 0.23, z }, M.satin);
}

// ---------- 4 · Le transformateur, le local technique, le poste ----------

function transformateur(ctx) {
  const { c, M, b, dans, u } = ctx;
  if (!dans(TRANSFO.x)) return;
  const x = TRANSFO.x;
  // Le socle et l'enclos (clôture effondrée)
  c.pave(x - 3.8, 0, -9.5, x + 2.6, 0.3, -5.6, C.betonClair, M.mat);
  grillage(ctx, [x - 4.2, -5.3], [x - 4.2, -9.6], { nature: "enclos du transformateur", barbele: true });
  panneau(c, M.enseignes, R.ht, { x: x - 4.15, y: 1.3, z: -6.4, ry: -PI / 2 }, 0.6, 0.5);
  for (let i = 0; i < 3; i++) panneau(c, M.enseignes, R.grillage, { x: x - 2.5 + i * 2.2, y: 0.08, z: -4.4 + i * 0.6, ry: 0.3 * i, rx: -PI / 2 + 0.08 }, 2.6, 1.9, 0xc4c8c4);
  // La cuve du transformateur, couchée en travers de la voie : ailettes, isolateurs, conservateur d'huile
  c.repere({ x: x + 0.3, y: 1.55, z: -3.0, rx: PI / 2 - 0.1, ry: 0.12 }, () => {
    c.boite(3.4, 5.2, 3.0, 0x6f7a72, {}, M.tole);
    c.boite(3.6, 0.25, 3.2, 0x5f6a62, { y: 2.6 }, M.tole);
    // les batteries de radiateurs, de part et d'autre
    for (const s of [-1, 1]) {
      for (let i = -6; i <= 6; i++) c.boite(0.9, 4.2, 0.08, 0x66716a, { x: s * 2.2, z: i * 0.22 }, M.tole);
      c.boite(0.12, 0.2, 2.9, 0x5f6a62, { x: s * 1.75, y: 1.9 }, M.tole);
      c.boite(0.12, 0.2, 2.9, 0x5f6a62, { x: s * 1.75, y: -1.9 }, M.tole);
    }
    // les traversées haute tension (porcelaine brune), couchées vers le sud
    for (const s of [-1, 0, 1]) {
      for (let k = 0; k < 7; k++) cylY(c, M.lisse, 0x8a5a3a, s * 0.95, 0.6, 2.7 + k * 0.32, 2.96 + k * 0.32, 0.24 - k * 0.015, 0.24 - k * 0.015, 8);
      c.boite(0.08, 0.08, 0.08, 0xc87a3a, { x: s * 0.95, y: 5.0, z: 0.6 }, M.metal);
    }
    for (const s of [-1, 1]) cylY(c, M.lisse, 0x8a5a3a, s * 0.8, -0.9, 2.7, 3.6, 0.14, 0.12, 8);
    c.boite(1.0, 0.7, 0.05, 0xd8d4c8, { x: 1.0, y: 0.6, z: 1.53 }, M.tole); // la plaque signalétique
  });
  c.repere({ x: x - 1.6, y: 0.62, z: 1.8, ry: 0.4 }, () => {
    const g = new THREE.CylinderGeometry(0.62, 0.62, 3.2, 10);
    c.poser(g, M.tole, 0x6f7a72, { rz: PI / 2 });
    g.dispose();
  });
  // Le portique d'arrivée haute tension, tombé jusqu'au mur du local technique, ses câbles
  const A = [x - 1.5, 0.5, -1];
  const B = [x + 0.8, 0.6, LT.z0 - 0.3];
  for (const dx of [-0.35, 0.35]) for (const dy of [0, 0.6]) c.poutre([A[0] + dx, A[1] + dy, A[2]], [B[0] + dx, B[1] + dy, B[2]], 0.1, 0x9aa1a3, M.tole);
  for (let t = 0.1; t < 1; t += 0.14) c.boite(0.8, 0.07, 0.07, 0x9aa1a3, { x: A[0] + (B[0] - A[0]) * t, y: 0.8, z: A[2] + (B[2] - A[2]) * t, rz: 0.6 }, M.tole);
  for (let i = 0; i < 3; i++) c.tube([x - 3 + i, 0.05, -9.5 + i * 0.3], [x - 1.4 + i * 0.7, 1.5, -3.5], 0.03, 0x2a2c2e, M.metal, 4);
  for (let i = 0; i < 3; i++) c.tube([x + 0.4, 0.8, 3.0], [x + 4 + i * 1.5, 0.04, 1.2 - i * 1.8], 0.03, 0x2a2c2e, M.metal, 4);
  flaque(ctx, x + 1.4, -1.4, 2.2, 0.035);
  c.pave(x - 1, 0.031, -4.2, x + 3.4, 0.033, 0.4, 0x24221e, M.mat, { crasse: false }); // l'huile répandue
  gravats(c, x - 0.6, 3.2, 1.0, 7, [C.betonClair, 0x8a8680]);
  panneau(c, M.enseignes, R.ht, { x: x + 1.6, y: 0.25, z: 0.5, rx: -PI / 2 + 0.2, ry: 0.4 }, 0.6, 0.5);
  // Infranchissable : de la glissière au mur du local technique
  b.obstacle(x, Z.gril, x, LT.z0, "transformateur haute tension effondré (on passe par le local technique)");
  if (u > 0.5) arbuste(c, x - 3, -7.4, 0.8, 0.3, [0x5a7040, 0x6a7a42, 0x4f6235]);
}

function localTechnique(ctx) {
  const { c, M, b, u, dans } = ctx;
  if (!dans((LT.x0 + LT.x1) / 2)) return;
  const { x0, x1, z0, z1, h } = LT;
  const k = b.couche("local-technique", { x: (x0 + x1) / 2, z: (z0 + z1) / 2, l: x1 - x0, p: z1 - z0 }, 1.15, h + 1.0);
  const gris = 0xbcb8ae;
  c.pave(x0, 0, z0, x1, 0.06, z1, 0x9a968e, M.mat, { crasse: false, nuance: 0 });
  const spec = { h, ep: 0.3, couleur: gris, mat: M.mat, interieur: { couleur: 0xd4d2cc, mat: M.mat } };
  // Nord et ouest : murs pleins (permanents) ; sud et est : coupés à l'allège (vue de la caméra)
  mur(c, [x1, z0], [x0, z0], { ...spec, batiment: b, ouvertures: [{ u: 4, l: 1.6, bas: 2.2, haut: 2.8, type: "fenetre", bris: 0.8, cadre: 0x8a9094, croisillons: 2, traverses: 1 }] });
  mur(c, [x0, z0], [x0, z1], { ...spec, batiment: b, ouvertures: [{ u: 9 - z0, l: 1.1, bas: 0, haut: 2.2, type: "porte", vantail: "entrouvert", couleurPorte: 0x5a6a70, angle: 1.6 }] });
  murCoupe(ctx, k, [x0, z1], [x1, z1], { ...spec, ouvertures: [{ u: 3, l: 1.5, bas: 1.6, haut: 2.6, type: "fenetre" }, { u: 10, l: 1.5, bas: 1.6, haut: 2.6, type: "fenetre" }] });
  murCoupe(ctx, k, [x1, z1], [x1, z0], { ...spec, ouvertures: [{ u: z1 - 9, l: 1.1, bas: 0, haut: 2.2, type: "porte", vantail: "entrouvert", couleurPorte: 0x5a6a70, angle: -1.4 }] });
  // Les cloisons (coupées elles aussi)
  murCoupe(ctx, k, [69, z1], [69, z0], { h, ep: 0.2, couleur: 0xd4d2cc, mat: M.mat, ouvertures: [{ u: z1 - 11.2, l: 1.1, bas: 0, haut: 2.2, type: "vide" }] });
  murCoupe(ctx, k, [74, z1], [74, z0], { h, ep: 0.2, couleur: 0xd4d2cc, mat: M.mat, ouvertures: [{ u: z1 - 7, l: 1.1, bas: 0, haut: 2.2, type: "vide" }] });
  // Le graffiti des Voltaïques sur la façade est, sous l'allège (vers la caméra)
  panneau(c, M.enseignes, R.graffiti, { x: x1 + 0.17, y: 0.62, z: 6.6, ry: PI / 2 }, 3.4, 0.85);
  panneau(c, M.enseignes, R.ht, { x: x1 + 0.17, y: 0.6, z: 11.6, ry: PI / 2 }, 0.6, 0.5);
  // Salle A : le poste de contrôle devenu camp des Voltaïques
  c.pave(64.4, 0.06, z0 + 0.2, 68.6, 0.85, z0 + 0.9, 0x8a9094, M.tole);
  for (const x of [65.2, 66.6, 68]) c.boite(0.6, 0.42, 0.05, 0x101214, { x, y: 1.1, z: z0 + 0.6, rx: -0.15 }, M.lisse);
  c.boite(3.6, 1.2, 0.05, 0x14181c, { x: 66.5, y: 2.2, z: z0 + 0.17 }, M.lisse);
  b.obstacle(64.4, z0 + 0.9, 68.6, z0 + 0.9, "pupitre");
  c.pave(65.2, 0.06, 9.8, 67.8, 0.92, 11.2, 0x7a5a3c, M.mat); // l'établi
  rect(b, 66.5, 10.5, 2.6, 1.4, 0, "établi");
  for (let i = 0; i < 4; i++) c.poser(GEO.TORE, M.metal, 0xc87a3a, { x: 65.6 + i * 0.6, y: 0.96, z: 10.4 + (i % 2) * 0.3, rx: PI / 2, e: [0.7, 0.7, 2.5] }, { crasse: false });
  for (let i = 0; i < 8; i++) c.boite(c.entre(0.4, 1.2), 0.03, 0.03, i % 2 ? 0xc87a3a : 0x1c1d1e, { x: c.entre(64.6, 68.4), y: 0.08, z: c.entre(6.5, 12.8), ry: c.hasard() * 3 }, M.metal, { crasse: false });
  // La lampe blanc froid des Voltaïques, posée sur une batterie
  c.boite(0.5, 0.4, 0.3, 0x3a4a5a, { x: 67.6, y: 1.12, z: 10.1 }, M.tole);
  c.tube([67.6, 1.3, 10.1], [67.4, 2.0, 10.0], 0.02, 0x2a2c2e, M.metal, 4);
  c.boite(0.28, 0.08, 0.16, 0xeef6ff, { x: 67.4, y: 2.05, z: 10.0 }, M.lisse);
  c.poser(GEO.CONE, M.lueur, 0x1e262c, { x: 67.4, y: 1.5, z: 10.0, e: [0.6, 1.0, 0.6], rx: PI }, { crasse: false, nuance: 0 });
  ctx.b.lumiere(67.4, 2.0, 10.0, 0xdff0ff, 5, 10, "lampe blanc froid des Voltaïques (local technique)");
  c.boite(1.9, 0.12, 0.8, 0x4a5a3a, { x: 65.4, y: 0.12, z: 12.6 }, M.mat); // le couchage
  for (const [x, z] of [[68.2, 12.6], [68.2, 7.6]]) c.boite(0.6, 0.5, 0.45, 0x5a6a3a, { x, y: 0.31, z }, M.tole);
  // Salle B : les armoires de batteries de stockage (une a brûlé : suie, coulures)
  for (const [zr, ry] of [[z0 + 0.65, 0], [z1 - 0.65, PI]]) {
    for (let i = 0; i < 4; i++) {
      const x = 69.75 + i * 1.12;
      const brulee = zr < 8 && i === 2;
      const ouverte = !brulee && hash(x, zr) < 0.35 + 0.3 * u;
      c.repere({ x, z: zr, ry }, () => {
        c.boite(1.05, 2.2, 0.75, brulee ? 0x2c2926 : 0xd4d6d4, { y: 1.16 }, M.tole);
        if (!brulee) panneau(c, M.enseignes, R.armoire, { y: 1.7, z: 0.38 }, 0.98, 0.5);
        if (ouverte) {
          c.boite(1.0, 2.1, 0.04, 0xd4d6d4, { x: 0.7, y: 1.16, z: 0.75, ry: -1.2 }, M.tole);
          for (let j = 0; j < 4; j++) if (hash(x, j) < 0.5) c.boite(0.85, 0.3, 0.6, 0x4a5258, { y: 0.4 + j * 0.45 }, M.tole);
        }
      });
      if (brulee) {
        // la suie qui lèche le mur et le plafond
        c.pave(x - 0.9, 0.5, z0 + 0.16, x + 0.9, h - 0.05, z0 + 0.18, C.suie, M.mat, { crasse: false });
        k.pave(x - 1.6, h - 0.06, z0 + 0.15, x + 1.6, h - 0.04, z0 + 2.6, C.suie, M.mat, { crasse: false });
        for (let j = 0; j < 4; j++) c.boite(0.08, c.entre(0.5, 1.1), 0.02, 0x1a1816, { x: x + c.entre(-0.8, 0.8), y: 0.5, z: z0 + 0.2 }, M.mat, { crasse: false });
        c.pave(x - 1, 0.061, z0 + 1, x + 1.2, 0.064, z0 + 2.4, 0x2a2724, M.mat, { crasse: false });
      }
    }
    b.obstacle(69.2, zr, 73.8, zr, "armoires de batteries");
  }
  for (let i = 0; i < 5; i++) c.boite(0.85, 0.3, 0.6, 0x4a5258, { x: c.entre(70, 73), y: 0.21 + (i > 2 ? 0.3 : 0), z: c.entre(8, 10), ry: c.hasard() * 0.4 }, M.tole);
  c.boite(0.05, 0.05, 0.05, 0xff3a3a, { x: 72.0, y: 1.95, z: z0 + 1.04 }, M.lisse, { crasse: false });
  ctx.b.lumiere(72, 1.9, z0 + 1.2, 0xff3030, 0.8, 3, "voyant rouge d'une armoire de batteries encore vivante");
  // Salle C : les onduleurs muraux, les chemins de câbles (vides)
  for (const x of [74.8, 75.9]) {
    c.boite(0.9, 1.3, 0.35, 0xc8ccc8, { x, y: 1.4, z: z0 + 0.35 }, M.tole);
    for (let j = 0; j < 5; j++) c.boite(0.8, 0.03, 0.05, 0x9aa1a3, { x, y: 1.0 + j * 0.2, z: z0 + 0.54 }, M.tole);
  }
  b.obstacle(74.3, z0 + 0.6, 76.5, z0 + 0.6, "onduleurs");
  k.boite(0.4, 0.08, z1 - z0 - 0.6, 0x8a9094, { x: 75.5, y: h - 0.4, z: (z0 + z1) / 2 }, M.tole);
  debris(c, x0 + 0.4, z0 + 0.4, x1 - 0.4, z1 - 0.4, Math.round(10 + 15 * u), [0xc8c4ba, 0x8a8680, 0xd8d4ca], 0.06);
  // Le toit plat (couche), ses acrotères
  k.pave(x0 - 0.2, h, z0 - 0.2, x1 + 0.2, h + 0.3, z1 + 0.2, 0xa8a49a, M.mat, { crasse: false });
  k.pave(x0 - 0.2, h + 0.3, z1 - 0.05, x1 + 0.2, h + 0.7, z1 + 0.2, gris, M.mat);
  k.pave(x1 - 0.05, h + 0.3, z0 - 0.2, x1 + 0.2, h + 0.7, z1 + 0.2, gris, M.mat);
  k.boite(1.6, 0.9, 1.2, 0xc8ccc8, { x: 66, y: h + 0.75, z: 7 }, M.tole);
}

function posteTransfo(ctx) {
  const { c, M, b, u, dans } = ctx;
  if (!dans((PO.x0 + PO.x1) / 2)) return;
  const { x0, x1, z0, z1, h } = PO;
  // La cour clôturée (portail à l'ouest ; à l'est, la clôture ferme le passage)
  c.pave(COUR.x0, 0, COUR.z0, COUR.x1, 0.04, COUR.z1, 0x9a9282, M.terrain, { crasse: false, nuance: 0 });
  grillage(ctx, [COUR.x0, COUR.z0], [COUR.x0, COUR.z1], { nature: "clôture du poste", barbele: true, trous: [[7, 9.5]], penche: 0 });
  grillage(ctx, [COUR.x1, COUR.z1], [COUR.x1, COUR.z0], { nature: "clôture du poste", barbele: true, penche: 0 });
  grillage(ctx, [COUR.x0, COUR.z0], [LT.x0, COUR.z0], { nature: "clôture du poste", barbele: true, penche: 0 });
  panneau(c, M.enseignes, R.grillage, { x: COUR.x0 - 0.9, y: 0.06, z: 22.2, ry: 0.4, rx: -PI / 2 }, 2.4, 1.9, 0xc4c8c4); // le vantail du portail, à terre
  panneau(c, M.enseignes, R.ht, { x: COUR.x1 + 0.06, y: 1.3, z: 21.5, ry: PI / 2 }, 0.6, 0.5);
  const k = b.couche("toit-poste", { x: (x0 + x1) / 2, z: (z0 + z1) / 2, l: x1 - x0, p: z1 - z0 }, 1.15, h + 1);
  const brique = 0xa06a52;
  const spec = { h, ep: 0.3, couleur: brique, mat: M.mat, interieur: { couleur: 0xd4d0c4, mat: M.mat } };
  mur(c, [x1, z0], [x0, z0], { ...spec, batiment: b });
  mur(c, [x0, z0], [x0, z1], { ...spec, batiment: b, ouvertures: [{ u: 3.5, l: 1.8, bas: 0, haut: 2.4, type: "porte", vantail: "tombe", couleurPorte: 0x5a6a5a }] });
  murCoupe(ctx, k, [x0, z1], [x1, z1], { ...spec });
  murCoupe(ctx, k, [x1, z1], [x1, z0], { ...spec });
  // Les grilles de ventilation (bas de la façade est) et le panneau danger au sud
  for (const z of [19.6, 23.4]) c.boite(0.04, 0.6, 1.2, 0x5a6a5a, { x: x1 + 0.17, y: 0.6, z }, M.tole);
  panneau(c, M.enseignes, R.ht, { x: 70, y: 0.7, z: z1 + 0.17 }, 0.7, 0.58);
  c.pave(x0, 0, z0, x1, 0.06, z1, 0x8a8680, M.mat, { crasse: false, nuance: 0 });
  // Deux transformateurs HT/BT, les cellules (barres de cuivre), la fosse à câbles
  for (const x of [67.4, 72.6]) {
    c.boite(1.7, 1.8, 1.2, 0x6f7a72, { x, y: 0.96, z: 23.6 }, M.tole);
    for (let i = -3; i <= 3; i++) c.boite(0.05, 1.4, 0.4, 0x6a756e, { x: x + i * 0.22, y: 0.9, z: 24.3 }, M.tole);
    for (const s of [-0.5, 0, 0.5]) cylY(c, M.lisse, 0x8a5a3a, x + s, 23.6, 1.86, 2.3, 0.08, 0.06, 6);
    rect(b, x, 23.7, 1.8, 1.6, 0, "transformateur");
  }
  for (let i = 0; i < 6; i++) {
    const x = 66.4 + i * 1.3;
    const pille = hash(x, 4) < 0.4 + 0.3 * u;
    c.boite(1.1, 2.1, 0.8, 0xc8ccc8, { x, y: 1.1, z: z0 + 0.55 }, M.tole);
    if (!pille) for (const dy of [0.5, 0.7, 0.9]) c.boite(0.9, 0.05, 0.05, 0xc87a3a, { x, y: 1.4 + dy, z: z0 + 0.98 }, M.metal);
    else c.boite(1.0, 2.0, 0.04, 0xc8ccc8, { x: x + 0.3, y: 0.3, z: z0 + 1.6, rx: -1.3 }, M.tole);
  }
  b.obstacle(65.8, z0 + 0.95, 73.6, z0 + 0.95, "cellules");
  c.pave(66, 0.061, 20.6, 74, 0.064, 21.2, 0x2a2826, M.mat, { crasse: false });
  // Toit plat (couche)
  k.pave(x0 - 0.3, h, z0 - 0.3, x1 + 0.3, h + 0.35, z1 + 0.3, 0x8a8680, M.mat, { crasse: false });
  mousse(k, 68, h + 0.35, 21, 1.6, 6);
  // Le pylône d'arrivée HT par-dessus le merlon, câbles coupés qui pendent
  c.tube([71, 3.9, 33.5], [71, 13, 33.5], 0.3, C.acier, M.tole, 4);
  c.boite(5, 0.25, 0.25, C.acier, { x: 71, y: 12.6, z: 33.5 }, M.tole);
  for (const dx of [-2, 0, 2]) c.tube([71 + dx, 12.4, 33.5], [70 + dx * 0.6, 3.5, PO.z1 + 2], 0.03, 0x2a2c2e, M.metal, 4);
}

/** Les voitures restées bloquées devant le transformateur, sur la voie de sortie ; le panneau d'au revoir. */
function sortie(ctx) {
  const { c, M, dans } = ctx;
  if (dans(84)) {
    c.repere({ x: 84, z: -1.6, ry: 0.35 }, () => {
      for (const s of [-1, 1]) c.boite(0.12, 3.2, 0.12, C.acier, { x: s * 1.1, y: 1.6 }, M.metal);
      panneau(c, M.enseignes, R.merci, { y: 2.6, z: 0.07 }, 3.0, 1.0);
      c.boite(3.1, 1.08, 0.06, 0x3a3e42, { y: 2.6, z: -0.01 }, M.tole);
    });
    ctx.b.obstacle(...versMonde(84, -1.6, 0.35, -1.1, 0), ...versMonde(84, -1.6, 0.35, 1.1, 0), "panneau");
  }
  for (const [x, o] of [[80.5, 1.6], [91, -1.5]]) if (dans(x)) voiture(ctx, x, zR(x) + o, pente(x) + 0.3, { couleur: teinte(Math.round(x) + 2), ouverte: true });
  for (const [x, o] of [[57.5, 1.67], [62.6, -1.67], [59.2, -1.67]]) {
    if (!dans(x)) continue;
    voiture(ctx, x, zR(x) + o, pente(x), { couleur: teinte(Math.round(x)), type: x > 60 ? "suv" : "berline", ouverte: x < 58 });
  }
}

// ---------- Le contrat ----------

function recentrer(groupe, o) {
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
  const dedans = (x, z) => Math.abs(x) <= 25.5 && Math.abs(z) <= 35.5;
  ud.obstacles = ud.obstacles
    .map((s) => ({ ...s, x1: arr(s.x1 - o.x), z1: arr(s.z1 - o.z), x2: arr(s.x2 - o.x), z2: arr(s.z2 - o.z) }))
    .filter((s) => dedans(s.x1, s.z1) || dedans(s.x2, s.z2));
  ud.lumieres = ud.lumieres.map((l) => ({ ...l, x: arr(l.x - o.x), z: arr(l.z - o.z) })).slice(0, 8);
  return groupe;
}

export function creer({ usure = 0.7, carte = "file" } = {}) {
  const t = TRONCONS.find((q) => q.id === carte) ?? TRONCONS[0];
  const u = Math.max(0.1, Math.min(1, usure));
  const b = new Batiment(3427 + TRONCONS.indexOf(t) * 53, u);
  const x0 = t.x - 25;
  const x1 = t.x + 25;
  const ctx = { b, c: b.c, u, x0, x1, M: matieres(), dans: (x) => x >= x0 && (x < x1 || (x1 === 100 && x <= 100)) };

  sol(ctx);
  bords(ctx);
  vegetation(ctx);
  signalisation(ctx);
  epaves(ctx);
  if (t.id === "file") {
    barrieres(ctx);
    totem(ctx);
    panneauIA(ctx);
    stationGlisse(ctx);
    bassinEtVoiture(ctx);
    // une lanterne de camping posée sur le toit d'une voiture de la file
    ctx.c.boite(0.16, 0.26, 0.16, 0x3a5a3a, { x: -66.4, y: 1.7, z: zR(-66.4) + 1.67 }, ctx.M.tole);
    ctx.c.poser(GEO.BOULE, ctx.M.lueur, 0xffc070, { x: -66.4, y: 1.78, z: zR(-66.4) + 1.67, e: 0.12 }, { crasse: false, nuance: 0 });
    b.lumiere(-66.4, 1.9, zR(-66.4) + 1.67, 0xffc070, 1.5, 5, "lanterne de camping sur le toit d'une voiture de la file");
  } else if (t.id === "ombriere") {
    // « Réservé ! » : un carton coincé sous l'essuie-glace d'une voiture branchée ; une lanterne dans la file de l'allée
    panneau(ctx.c, ctx.M.enseignes, R.pancarte2, { x: BAIES[5] - 0.2, y: 1.2, z: 10.32 - 1.3, rx: -PI / 2 + 0.55, ry: 0.15 }, 0.7, 0.35);
    ctx.c.boite(0.16, 0.26, 0.16, 0x3a5a3a, { x: -33.2, y: 0.13, z: 3.2 }, ctx.M.tole);
    ctx.c.poser(GEO.BOULE, ctx.M.lueur, 0xffc070, { x: -33.2, y: 0.24, z: 3.2, e: 0.12 }, { crasse: false, nuance: 0 });
    halo(ctx, -33.2, 3.2, 1.2, 0x2a1a08, 0.04);
    b.lumiere(-33.2, 0.5, 3.2, 0xffc070, 1.5, 5, "lanterne de camping au milieu de l'allée, près d'un sac de couchage");
    ctx.c.boite(1.9, 0.12, 0.75, 0x6a3a4a, { x: -34.6, y: 0.1, z: 3.6, ry: 0.2 }, ctx.M.mat);
    ombriere(ctx);
    bornes(ctx);
    aireDeJeux(ctx);
  } else if (t.id === "lounge") {
    lounge(ctx);
    camionRescue(ctx);
    portiqueTombe(ctx);
    campement(ctx);
  } else {
    sortie(ctx);
    transformateur(ctx);
    localTechnique(ctx);
    posteTransfo(ctx);
  }
  return recentrer(b.construire(), { x: t.x, z: 0 });
}
