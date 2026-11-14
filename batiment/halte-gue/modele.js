// La halte du Gué-aux-Saules (Book 20 §4 « le gué », route des Marais ; Book 01 §2 bis : les haltes).
//
// Une petite route de campagne descend par l'ouest dans un chemin creux, entre talus raides, ronciers et forêt de berge
// (aulnes, frênes, saules). Elle débouche dans la vallée d'une rivière vive et s'arrête net : le pont suspendu a été
// emporté par une crue. Restent ses deux piles dans le courant (un portique debout, l'autre brisé), ses câbles qui
// pendent, un morceau de tablier couché dans l'eau et les troncs flottés coincés contre les piles. On traverse à gué,
// sur le radier de béton submergé (une fine nappe court dessus, l'eau est profonde de part et d'autre), ou par le bac
// à câble du passeur, un peu en amont. Sur la rive ouest, la guinguette « Chez Lulu », fermée depuis la Grande Panne ;
// sur la rive est, le camping-car embourbé, le lavoir couvert et la station Kayak+ ; plus loin, l'huilerie en ruine
// (à l'ouest) et le cabanon du garde-pêche, où un drone de livraison est resté pendu dans un frêne (à l'est).
//
// Repère de la halte entière : 200 × 70 m, origine au centre, +x à l'est, +z au sud (la rivière coule vers le sud),
// sol visitable à y = 0, rivière à y = −0,6 en amont du radier et −1,5 en aval (solPropre). Tout est bâti dans ce
// repère ; chaque tronçon (50 × 70 m) ne garde que ce qui tombe dans sa bande de x et se recentre. Les pièces continues
// (terrain, route, eau, radier) sont découpées sur la grille globale ou rognées aux bords de la bande : les raccords
// sont exacts.

import * as THREE from "three";
import { Batiment, Chantier, aleatoire, PALETTE, mur as murAtelier, touffes, gravats, debris, jonchee, mousse, lierre, arbuste } from "../commun/atelier.js";
import { R } from "./atlas.js";

// Au gué, un appui de fenêtre à 1 m bloque le passage (on ne passe pas par une fenêtre) : seuil d'obstacle à 0,8 m.
const mur = (c, a, b, spec) => murAtelier(c, a, b, { seuilObstacle: 0.8, ...spec });
import {
  PI, arr, matieres, animer, hache, bruit, interp, panneau, quad, lame, boiteEntre, planche, cylindre, geoCyl, cable, pointsCable,
  BOULE, ROCHE, OCTA, rocher, arbreBerge, roncier, joncs, fougere, bois, chaisePliante, tableBistrot, caisse, tonneau, bidon, corde,
  gaffe, lanterne, barque, rame, feu, balise, recentrer, miroiter,
} from "./outils.js";

// ---------- Les tronçons ----------

const X0 = { chemin: -75, rive: -25, gue: 25, sortie: 75 };

/** Le filtre d'un tronçon : un objet appartient au tronçon qui contient son centre (les bouts de la halte débordent). */
function bande(x0) {
  const xa = x0 - 25;
  const xb = x0 + 25;
  return (x) => (x >= xa || xa <= -100) && (x < xb || xb >= 100);
}
const versTroncon = (liste, id) => liste.filter((o) => bande(X0[id])(o.x)).map((o) => ({ ...o, x: arr(o.x - X0[id]) }));

// ---------- La géographie ----------

const W2 = 11.5; // demi-largeur de la rivière, d'une crête de berge à l'autre
const XC = (z) => 2 + 1.2 * Math.sin(z * 0.08); // l'axe de la rivière (elle ondule à peine)
const Y_AMONT = -0.6; // l'eau calme en amont du radier
const Y_AVAL = -1.5; // l'eau vive en aval
const Y_LIT = -3.2;
const RAD = { z1: -13.5, z2: -9, x1: -11.6, x2: 13.7 }; // le radier submersible
const yEau = (z) => (z < RAD.z1 ? Y_AMONT : Y_AVAL);
const BARRE = { a: [6, -9.2], b: [6.6, -6.0], r: 1.9, r2: 3.3 }; // le banc de galets, accroché au radier
const PILES = [-3, 7]; // les deux piles du pont suspendu (axe z = 0)
const CULEE_O = -9.3;
const CULEE_E = 13.6;
const CABLE_Z = -25; // le câble du bac
// Le radeau du bac : un objet mobile à part (userData.radeau). Il est construit autour de son centre ; ses deux
// accostages sont donnés en x (repère de la halte entière), z = CABLE_Z.
const RADEAU = { x: -7.6, l: 5.8, p: 4.4, accostages: [{ cote: "ouest, à la cale", x: -7.6, embarquement: { x: -12.4, z: -25 } }, { cote: "est, au ponton", x: 6.5, embarquement: { x: 11, z: -25 } }] };

const HL = 2.8; // demi-largeur de la route
const ZR = [[-101, 7], [-85, 6.5], [-65, 4], [-48, 1], [-36, 0], [30, 0], [50, -1], [70, -3], [101, -5]];
const zr = (x) => interp(ZR, x);
// Les limites du fond plat (nord : z négatif). Au-delà, le talus monte, couvert de forêt.
const VN = [[-101, 1.8], [-86, 1.4], [-84, -26], [-65, -26], [-62, -1.2], [-56, -2.6], [-46, -31], [44, -31], [54, -7.5], [66, -7.5], [68, -21.5], [86, -21.5], [88, -8.8], [101, -9.2]];
const VS = [[-101, 11.2], [-72, 10.4], [-69.5, 14], [-59, 14], [-56.5, 8.2], [-47, 33], [44, 33], [54, 4], [101, 0.6]];
const vn = (x) => interp(VN, x);
const vs = (x) => interp(VS, x);

// Les pistes qui descendent au radier, de chaque côté
const PISTE_O = [[-34, -0.6], [-27, -3], [-20, -7], [-15, -10.2], [-11.6, -11.25]];
const PISTE_E = [[13.7, -11.25], [17, -10.4], [22, -7.6], [28, -3.6], [35, -0.8]];

function distSeg(x, z, a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t);
}
function distPoly(x, z, pts) {
  let d = Infinity;
  for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, distSeg(x, z, pts[i], pts[i + 1]));
  return d;
}
const distPiste = (x, z) => Math.min(distPoly(x, z, PISTE_O), distPoly(x, z, PISTE_E));
const dansLeGap = (x) => x > CULEE_O - 0.2 && x < CULEE_E + 0.2;
const distRoute = (x, z) => (dansLeGap(x) ? Infinity : Math.abs(z - zr(x)));
const distBarre = (x, z) => distSeg(x, z, BARRE.a, BARRE.b);

const lisse = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/** La pente de la berge : douce devant la guinguette (plage) et sous le camping-car (vase), raide ailleurs. */
function pente(x, z) {
  if (x < XC(z)) return 1.25 - 0.75 * lisse((z - 12) / 3) * lisse((30 - z) / 3);
  return 1.25 - 0.8 * lisse((z - 7) / 3) * lisse((23 - z) / 3);
}
const vase = (x, z) => x > XC(z) + 7 && x < 26.5 && z > 8.5 && z < 21.5;

/** La hauteur du sol (terrain seul) en (x, z). */
function hauteur(x, z) {
  const t = W2 - Math.abs(x - XC(z));
  if (t > 0) {
    let y = Math.max(Y_LIT + 0.3 * (bruit(x * 0.4, z * 0.4) - 0.5), -t * pente(x, z));
    const d = distBarre(x, z);
    if (d < BARRE.r2) y = Math.max(y, d < BARRE.r ? 0 : -1.6 * Math.pow((d - BARRE.r) / (BARRE.r2 - BARRE.r), 0.8));
    return y;
  }
  const dt = Math.max(vn(x) - z, z - vs(x));
  if (dt <= 0) return 0;
  return Math.min(8.5, dt * 0.95 * (0.8 + 0.4 * bruit(x * 0.13, z * 0.13)));
}

// Les emprises bâties et les lieux dégagés : pas d'arbre, pas de roncier.
// Le gisement de glaise : au milieu de la berge de vase, à découvert (au sud du coin repas du camping-car). Rien ne
// pousse autour ni entre lui et la caméra (sud-est, et en miroir) : voir nature().
const GLAISE = { x: 20.2, z: 19.9 };
const autourDeLaGlaise = (x, z) => x > 13.5 && x < 30 && z > 17.6 && z < 31;

const EMPRISES = [
  [-81.5, -66.5, -25.5, -12.5], // huilerie
  [-66.5, -60.5, 9.5, 14], // épave
  [-28, -10, -31, -17], // cabane du passeur et cale du bac
  [-42, -8, 11, 32], // guinguette
  [-17, 16, -6, 6], // tête de pont et piles
  [15.5, 24, -20, -14.5], // Kayak+
  [23, 33, -31, -21.5], // lavoir
  [15, 27, 11, 19], // camping-car
  [69, 81, -20.5, -13.5], // garde-pêche et casier
  [86, 92, -8, -2], // barricade
  [63, 74, 1, 11], // le frêne au drone et le colis
];
const libre = (x, z, m = 0.5) => !EMPRISES.some(([x1, x2, z1, z2]) => x > x1 - m && x < x2 + m && z > z1 - m && z < z2 + m);

// ---------- Les données de jeu (repère de la halte entière) ----------

const ENTREES = [
  { x: -100, z: 7, nature: "entrée A : la petite route descend de la Campagne dans le chemin creux" },
  { x: -76, z: -14, nature: "porte de l'huilerie en ruine" },
  { x: -68.2, z: -18.4, nature: "brèche du mur est de l'huilerie (salle du pressoir)" },
  { x: -21, z: -27.25, nature: "porte de la cabane du passeur (côté bac)" },
  { x: -12.4, z: -25, nature: "cale du bac : on monte à bord du radeau à câble" },
  { x: -31.6, z: 23, nature: "porte de la buvette Chez Lulu (côté tables)" },
  { x: -11.6, z: -11.25, nature: "tête ouest du radier submersible (le gué)" },
  { x: 13.7, z: -11.25, nature: "tête est du radier" },
  { x: 11, z: -25, nature: "ponton est du bac" },
  { x: 19.6, z: 15.2, nature: "porte latérale du camping-car embourbé" },
  { x: 28, z: -23.6, nature: "le lavoir couvert, ouvert au sud" },
  { x: 72.6, z: -15, nature: "porte du cabanon du garde-pêche" },
  { x: 100, z: -5, nature: "sortie B : la route remonte vers le Moulin du Gué (2 km)" },
];

// Les 6 touffes de joncs cueillables, sur les berges accessibles (pas dans l'eau)
const JONCS = [[-9.4, 14.5], [-9.6, 18.2], [-9.2, 21.6], [-11.6, -19.5], [14.4, -5.2], [16.2, 7.6]];

// Les points d'interaction (repère de la halte entière)
const INTERACTIONS = [{ x: -12.8, z: -22.4, y: 1.98, nature: "la cloche du passeur, à la cale du bac (leurre sonore, ≈ 40 m)" }];

const FOUILLE = [
  // Le chemin creux
  { x: -76.6, z: -19.6, quoi: "meule de l'huilerie : ferrures, pierre à aiguiser" },
  { x: -70, z: -19.5, quoi: "pressoir : vis de bois, chaîne, scourtins (fibres)" },
  { x: -69.2, z: -22.6, quoi: "jarres de l'huilerie : une encore pleine d'huile rance (combustible, lampe)" },
  { x: -79.2, z: -16.6, quoi: "niche des survivants : bougies, allumettes, une conserve" },
  { x: -63.5, z: 11.8, quoi: "épave du fossé : trousse de secours, couverture, cric" },
  { x: -90, z: 2.6, quoi: "lampadaire solaire : petit panneau, batterie, ampoule" },
  // La rive ouest
  { x: -23.2, z: -28.4, quoi: "table du passeur : registre des passages en wotts, boîte à jetons, lanterne" },
  { x: -26.4, z: -26.2, quoi: "étagère du passeur : réchaud, cartouche de gaz, conserves, sel" },
  { x: -26, z: -28.8, quoi: "lit du passeur : couverture de laine, duvet" },
  { x: -21.6, z: -29.1, quoi: "râtelier : cordes, gaffes, avirons, gilet de sauvetage" },
  { x: -31.2, z: 26.5, quoi: "buvette : friteuse (huile figée), paniers, caisse et jetons de bal" },
  { x: -35.5, z: 28.6, quoi: "réserve de la buvette : limonade, sucre, sel, conserves, fûts" },
  { x: -24.3, z: 26.6, quoi: "kiosque à musique : accordéon (toile, métal), pupitres" },
  { x: -12, z: 20, quoi: "barques retournées : rames, écope, corde d'amarrage" },
  { x: -28.2, z: 22.2, quoi: "batterie solaire de la guirlande (et son petit panneau)" },
  // Le gué
  { x: 6.6, z: -7.8, quoi: "feu des survivants sur le banc de galets : marmite, poisson séché, couverture" },
  { x: 21.6, z: 13.6, quoi: "camping-car : duvets, réchaud et bouteille de gaz, conserves" },
  { x: 23.6, z: 14.2, quoi: "soute arrière du camping-car : outils, câbles, jerrican" },
  { x: 28, z: -26.4, quoi: "lavoir : battoirs, savon, seau, draps (tissu)" },
  { x: 19.5, z: -17, quoi: "station Kayak+ : pagaies, gilets, câble antivol (acier)" },
  { x: -11.2, z: -5.2, quoi: "tas de branches (apportées par la crue, tirées sur la berge)" },
  { x: GLAISE.x, z: GLAISE.z, quoi: "gisement de glaise (inépuisable) : la motte entamée et la bêche plantée, au milieu de la berge de vase" },
  ...JONCS.map(([x, z]) => ({ x, z, quoi: "touffe de joncs (cueillable, repousse en 30 min)" })),
  // La sortie
  { x: 73, z: -18.6, quoi: "cabanon du garde-pêche : cannes, hameçons, filets, bottes" },
  { x: 74.6, z: -16, quoi: "congélateur mort du garde-pêche : glacières, sel" },
  { x: 79, z: -17.6, quoi: "casier Point Relais Drone : colis jamais retirés" },
  { x: 67.2, z: 1.7, quoi: "colis tombé du drone : « pièce de pont 1/4800 » (acier), sangles" },
  { x: 69.6, z: 7.6, quoi: "au pied du frêne : hélice, petite batterie tombées du drone" },
];

const ETEINTS = [
  { x: -70, z: 5.2, type: "errant (dans le chemin creux)" },
  { x: -74.2, z: -16.8, type: "errant (dans l'huilerie)" },
  { x: -30.4, z: 26.2, type: "ancien habitant (la serveuse de la guinguette, tablier et plateau)" },
  { x: -21, z: 19, type: "errant (sur la piste de danse)" },
  { x: -18.6, z: -22, type: "errant (entre la cabane et le bac)" },
  { x: -3, z: -14.6, type: "dans l'eau, côté amont : il dérive lentement et bute contre le radier" },
  { x: 16.2, z: 18.4, type: "rampant (dans la vase de la berge)" },
  { x: 19.6, z: 19.2, type: "rampant (sous l'auvent du camping-car, à demi enlisé)" },
  { x: 27, z: -24, type: "errant (au lavoir)" },
  { x: 82, z: -10.6, type: "errant (près du casier)" },
  { x: 73.6, z: -17, type: "ancien habitant (le garde-pêche, en cuissardes)" },
];

const TRONCONS = [
  {
    id: "chemin",
    nom: "Le chemin creux",
    depart: { x: -98, z: 7 },
    description: "la petite route descend entre deux talus de ronces et de forêt ; l'huilerie en ruine dans sa clairière, l'épave du fossé, le lampadaire solaire",
  },
  {
    id: "rive",
    nom: "La rive ouest",
    depart: { x: -47, z: 0.5 },
    description: "la route s'arrête net devant le pont emporté ; la cabane du passeur et la cale du bac, la guinguette Chez Lulu (piste de danse, buvette, kiosque, barques), la passerelle effondrée",
  },
  {
    id: "gue",
    nom: "Le gué",
    depart: { x: 2, z: -11.25 },
    description: "le radier submersible (goulet), le bac à câble (goulet), les piles du pont et le feu des survivants sur le banc de galets ; rive est : Kayak+, lavoir, camping-car embourbé",
  },
  {
    id: "sortie",
    nom: "La remontée",
    depart: { x: 52, z: -1 },
    description: "la route remonte vers l'est dans les bois ; le cabanon du garde-pêche, le casier Point Relais Drone, le drone pendu dans un frêne et la barricade de troncs",
  },
];

export const FICHE = {
  id: "halte-gue",
  nom: "Le Gué-aux-Saules",
  lieu: "Halte · la route du Moulin du Gué · entre l'anneau proche et le moyen",
  environnement: "marais et rivière",
  anneau: "proche → moyen",
  danger: 2,
  halte: true,
  solPropre: true, // la rivière est creusée sous y = 0 : chaque tronçon fournit tout son sol
  recit:
    "Le pont suspendu du Gué-aux-Saules est parti avec la crue du premier hiver ; le panneau promet toujours sa livraison par drone sous trois jours ouvrés. Depuis, on passe à gué sur le radier, les pieds dans une nappe qui court et le vide de chaque côté, ou par le bac du passeur, deux wotts la traversée, jamais de nuit. Chez Lulu, la guirlande clignote encore sur sa batterie solaire au-dessus d'une piste de danse où plus personne ne paie sans contact.",
  inspiration:
    "les gués et radiers submersibles des rivières du Sud-Ouest, les bacs à traille de la Loire et du Rhône, les ponts suspendus du XIXe siècle emportés par les crues, les guinguettes des bords de Marne, les lavoirs couverts des villages, les photos urbex de campings-cars abandonnés et de guinguettes fermées",
  reperes: [
    "La route qui s'arrête net : culées du pont, barrières de chantier, panneau « Pont en reconstruction — livraison prévue par drone »",
    "Le pont suspendu emporté : un portique debout sur sa pile, l'autre brisé, les câbles qui pendent dans le courant, un pan de tablier couché dans l'eau",
    "Le radier submersible (goulet) : une fine nappe qui court sur le béton, les balises rouge et blanc, la chute et ses remous à l'aval, l'eau profonde de chaque côté",
    "Le banc de galets accroché au radier, le feu des survivants à l'abri des troncs flottés 🔥",
    "Le bac à câble (goulet) : radeau sur bidons, câble tendu entre deux poteaux, cloche, tarifs peints « 2 wotts — pas de nuit », borne « Bac connecté : réservez votre traversée »",
    "La cabane du passeur : registre des passages en wotts, cordes, gaffes, réchaud, lit, lanterne",
    "La guinguette « Chez Lulu — Friture » : buvette, piste de danse en bois, kiosque à musique, tables de bistrot, barques de location retournées, guirlande sur batterie solaire qui clignote la nuit",
    "La passerelle piétonne effondrée, son tablier qui plonge dans la rivière",
    "Les kayaks « Kayak+ » cadenassés à une borne morte (« Station hors ligne »)",
    "Le camping-car « Liberté Totale » embourbé dans la vase, son auvent déchiré et ses rampants",
    "Le lavoir couvert de 1887 : bassin, battoirs, filet d'eau de la source",
    "L'huilerie en ruine dans sa clairière : meule debout dans sa cuve, pressoir, jarres, un frêne qui pousse dedans",
    "Le drone de livraison pendu dans un frêne, son colis « pièce de pont 1/4800 » tombé au bord de la route, le casier Point Relais qui annonce encore « Votre pont est en route ! »",
    "La forêt de berge : aulnes, frênes, saules penchés sur l'eau, ronciers, talus raides",
  ],
  lot: { l: 200, p: 70 },
  depart: { x: -98, z: 7 },
  goulets: [
    { x: 1, z: -11.25, nature: "le radier submersible : 4,5 m de béton sous une nappe qui court, l'eau profonde de chaque côté, découvert sur 25 m" },
    { x: -7.6, z: -25, nature: "le bac à câble : un radeau de 6 m qu'on tire le long du câble, une seule traversée à la fois" },
  ],
  panneaux: [
    { x: -95.5, z: 2.6, texte: "← Ton terrain · La Campagne / Le Gué · bac et passage submersible · 3 km" },
    { x: -81, z: 2.2, texte: "LE GUÉ-AUX-SAULES — son bac · sa guinguette · son lavoir" },
    { x: -57.5, z: -1.6, texte: "DÉVIATION — suivre l'appli Itinéraire+ →" },
    { x: -14.6, z: -4.4, texte: "PONT EN RECONSTRUCTION — Livraison prévue par drone" },
    { x: 95.5, z: -8.3, texte: "Le Moulin du Gué · 2 km → / ← Le Gué · Ton terrain" },
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
    interactions: versTroncon(INTERACTIONS, t.id),
  })),
  interactions: INTERACTIONS,
  // Le bac (G5, G6) : objet userData.radeau du tronçon « rive » (repère local au radeau : centre du plancher, au sol).
  bac: {
    troncon: "rive",
    cable: { z: CABLE_Z, x1: -15.8, x2: 17.4 },
    radeau: { longueur: RADEAU.l, largeur: RADEAU.p },
    accostages: RADEAU.accostages,
    note: "le jeu fait glisser userData.radeau le long du câble (position.x), d'un accostage à l'autre. Ses obstacles sont relatifs au radeau : userData.radeau.userData.obstacles (les garde-corps, toujours) et obstaclesTraversee (les chaînes des deux bouts, à fermer pendant la traversée). Le bout de la cale et le bout du ponton sont ouverts : on monte et on descend par les bouts du radeau",
  },
  // La crue (G4) : objet userData.nappeRadier des tronçons « rive » et « gue » ; le jeu monte sa position.y
  nappeRadier: { z1: RAD.z1, z2: RAD.z2, x1: RAD.x1, x2: RAD.x2, y: 0.035, note: "position.y = montée de l'eau au-dessus de la nappe ordinaire (0 au repos)" },
  // Les alentours (R52) : objet « alentours » de chaque tronçon (userData.objets.alentours), sans obstacle
  alentours: {
    nord: 45,
    sud: 45,
    ouest: 45,
    est: 45,
    note: "chaque tronçon porte sa bande nord et sud (45 m) ; le chemin creux le prolongement ouest, la remontée le prolongement est (45 m) : talus boisés et plateau, la rivière en amont et en aval, la route qui continue aux deux bouts",
  },
};

// ---------- Couleurs du lieu (passées, vertes) ----------

const C = {
  asphalte: 0x5d5f5c,
  rapiece: 0x4a4c4b,
  accotement: 0x8b8468,
  gravier: 0xa49c88,
  beton: 0xa7a49b,
  betonSombre: 0x86837b,
  betonMouille: 0x8a8f86,
  pierre: 0xc9b896,
  pierreGrise: 0x9e978a,
  bois: 0x7a5a3c,
  boisGris: 0x8c8270,
  boisClair: 0x9a7a55,
  planchesCabane: 0xa89478,
  creme: 0xd9cfb2,
  vertGuinguette: 0x6f8b76,
  rougePasse: 0x9a5544,
  acier: 0x6f767a,
  rouille: PALETTE.rouille,
  fonte: 0x3a3a38,
  tole: 0x8a9092,
};

// ---------- Le terrain ----------

/** La teinte et la matière d'un triangle du terrain. */
function classe(x, y, z, ny) {
  const b = bruit(x * 0.17 + 3, z * 0.17);
  const b2 = bruit(x * 0.55, z * 0.55 + 9);
  const t = W2 - Math.abs(x - XC(z));
  if (y < -0.04) {
    const ye = yEau(z);
    if (y < ye - 0.4) return [b2 > 0.5 ? 0x4f5240 : 0x5a5845, 0];
    if (distBarre(x, z) < BARRE.r2 + 0.4) return [0xa9a292, 1];
    if (vase(x, z)) return [b2 > 0.5 ? 0x4f4234 : 0x5a4a3a, 0];
    if (b > 0.55) return [0xa29b8b, 1];
    return [b2 > 0.5 ? 0x75684f : 0x6a5d47, 0];
  }
  if (y > 0.3) {
    if (ny < 0.7) return [b2 > 0.5 ? 0x7a6448 : 0x6d5a40, 0];
    if (y > 4.5) return [b > 0.5 ? 0x4c5e34 : 0x56693a, 0];
    return [b > 0.55 ? 0x4f6236 : b2 > 0.6 ? 0x6b6a40 : 0x5d6e3c, 0];
  }
  if (t > -0.5 && distBarre(x, z) < BARRE.r + 0.4) return [0xc2bba9, 1];
  if (distRoute(x, z) < HL + 0.8) return [C.accotement, 0];
  if (distPiste(x, z) < 2.3) return [C.gravier, 1];
  if (vase(x, z)) return [0x5b4b3a, 0];
  if (t > -1.7 && t < 0.5) return [b2 > 0.5 ? 0xb3a585 : 0x9d9473, 0];
  // Terre battue autour des lieux fréquentés
  if ((x > -42 && x < -27 && z > 11 && z < 22) || (x > -28 && x < -18 && z > -31 && z < -23) || (x > 23 && x < 33 && z > -24 && z < -20)) return [b2 > 0.5 ? 0x9a8763 : 0x8c7a58, 0];
  if (b > 0.66) return [0x9aa45e, 0];
  if (b < 0.3) return [0x5f7f45, 0];
  return [b2 > 0.7 ? 0x86a356 : 0x7c9a50, 0];
}

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
      const x = x1 + i * PAS;
      const z = -35 + j * PAS;
      V.push([x, hauteur(x, z), z]);
    }
  }
  const classes = new Map();
  const ajouter = (cle, ...pts) => {
    let t = classes.get(cle);
    if (!t) classes.set(cle, (t = []));
    for (const p of pts) t.push(p[0], p[1], p[2]);
  };
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const tri = (a, b2, c2) => {
    va.set(b2[0] - a[0], b2[1] - a[1], b2[2] - a[2]);
    vb.set(c2[0] - a[0], c2[1] - a[1], c2[2] - a[2]);
    const n = va.cross(vb).normalize();
    const [coul, mk] = classe((a[0] + b2[0] + c2[0]) / 3, (a[1] + b2[1] + c2[1]) / 3, (a[2] + b2[2] + c2[2]) / 3, n.y);
    ajouter(coul + "|" + mk, a, b2, c2);
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
  // Les tranches du lot : une coupe de terre jusqu'à y = −4,5
  const tranche = (p, q) => {
    const a2 = [p[0], -4.5, p[2]];
    const b3 = [q[0], -4.5, q[2]];
    ajouter("4867383|0", p, a2, q, q, a2, b3, p, q, a2, q, b3, a2);
  };
  for (let i = 0; i < nx; i++) {
    tranche(V[i], V[i + 1]);
    tranche(V[nz * (nx + 1) + i], V[nz * (nx + 1) + i + 1]);
  }
  if (xa <= -100 || xb >= 100) {
    const col = xa <= -100 ? 0 : nx;
    for (let j = 0; j < nz; j++) tranche(V[j * (nx + 1) + col], V[(j + 1) * (nx + 1) + col]);
  }
  for (const [cle, pos] of classes) {
    const [coul, mk] = cle.split("|").map(Number);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    c.poser(g, mk ? M.galets : M.terrain, coul, {}, { crasse: false, nuance: 0 });
    g.dispose();
  }
}

// ---------- L'eau ----------

function rogner(ctx, x) {
  const a = ctx.xa <= -100 ? -1e9 : ctx.xa;
  const b = ctx.xb >= 100 ? 1e9 : ctx.xb;
  return Math.min(b, Math.max(a, x));
}

/** Une bande de rivière de z1 à z2, au niveau y, de demi-largeur w autour de l'axe ; UV dans le sens du courant. */
function nappeRiviere(ctx, mat, z1, z2, y, w, T, couleur, pas = 1) {
  for (let z = z1; z < z2 - 1e-6; z += pas) {
    const zb = Math.min(z2, z + pas);
    const P = [
      [rogner(ctx, XC(z) - w), y, z],
      [rogner(ctx, XC(zb) - w), y, zb],
      [rogner(ctx, XC(zb) + w), y, zb],
      [rogner(ctx, XC(z) + w), y, z],
    ];
    if (P[3][0] - P[0][0] < 0.01 && P[2][0] - P[1][0] < 0.01) continue;
    quad(ctx.c, mat, P, P.map(([x, , zz]) => [x / T, -zz / T]), couleur);
  }
}

/** Une plaque d'écume ou d'eau à plat, rectangle tourné (centre, longueur le long du courant, largeur). */
function plaque(ctx, mat, x, z, l, p, y, ry, couleur, T = 2) {
  if (!ctx.ici(x)) return;
  const cs = Math.cos(ry);
  const sn = Math.sin(ry);
  const pt = (u, v) => [x + u * cs + v * sn, y, z - u * sn + v * cs];
  const P = [pt(-p / 2, -l / 2), pt(-p / 2, l / 2), pt(p / 2, l / 2), pt(p / 2, -l / 2)];
  quad(ctx.c, mat, P, P.map(([xx, , zz]) => [xx / T, -zz / T]), couleur);
}

function eaux(ctx) {
  const { c, M, u } = ctx;
  // La rivière : calme et sombre en amont du radier, vive en aval
  nappeRiviere(ctx, M.eau, -35, RAD.z1, Y_AMONT, 11.3, 6, 0x6f8c7a);
  nappeRiviere(ctx, M.eau, RAD.z2, 35, Y_AVAL, 10.7, 3, 0x84a092);
  // La fine nappe qui court sur le radier : un objet à part (userData.nappeRadier), que la crue fait monter
  const n = new Chantier(5151);
  nappeRiviere({ ...ctx, c: n }, M.film, RAD.z1, RAD.z2, 0.035, 11.6, 1.4, 0xd2e2da, 0.5);
  if (!n.vide) {
    const g = n.construire();
    g.name = "nappeRadier";
    ctx.b.ajouter(g);
  }
  // La chute à l'aval du radier (le banc de galets l'interrompt)
  const xo = XC(RAD.z2) - 11.1;
  const xe = XC(RAD.z2) + 11.1;
  for (const [xa, xb] of [[xo, 3.2], [9.1, xe]]) {
    for (let x = xa; x < xb - 1e-6; x += 1) {
      const x2 = Math.min(xb, x + 1);
      if (!ctx.ici((x + x2) / 2)) continue;
      lame(c, M.eau, [x, RAD.z2], [x2, RAD.z2], 0.03, Y_AVAL + 0.02, [0, 0.6], 0xdce8e2, 1.2);
      // L'écume au pied de la chute, les remous
      quad(c, M.ecume, [[x, Y_AVAL + 0.04, RAD.z2 + 0.4], [x, Y_AVAL + 0.04, RAD.z2 + 2.2], [x2, Y_AVAL + 0.04, RAD.z2 + 2.2], [x2, Y_AVAL + 0.04, RAD.z2 + 0.4]], [[x / 2, -(RAD.z2 + 0.4) / 2], [x / 2, -(RAD.z2 + 2.2) / 2], [x2 / 2, -(RAD.z2 + 2.2) / 2], [x2 / 2, -(RAD.z2 + 0.4) / 2]], 0xffffff);
    }
  }
  // Le bourrelet d'écume où l'eau calme lèche le radier, en amont
  for (let x = XC(RAD.z1) - 11; x < XC(RAD.z1) + 11; x += 1) {
    if (!ctx.ici(x + 0.5)) continue;
    quad(c, M.ecume, [[x, Y_AMONT + 0.03, RAD.z1 - 0.9], [x, Y_AMONT + 0.03, RAD.z1], [x + 1, Y_AMONT + 0.03, RAD.z1], [x + 1, Y_AMONT + 0.03, RAD.z1 - 0.9]], [[x / 2, 0], [x / 2, 0.45], [(x + 1) / 2, 0.45], [(x + 1) / 2, 0]], 0xe8efe9);
  }
  // Des remous sur le radier même, et les traînées en aval
  const A = aleatoire(907);
  for (let k = 0; k < 16; k++) {
    const x = XC(-11) - 10 + A() * 21;
    if (x > 3.8 && x < 8.6) continue;
    plaque(ctx, M.ecume, x, RAD.z1 + 0.6 + A() * 3.4, 0.9 + A() * 1.4, 0.3 + A() * 0.4, 0.05, (A() - 0.5) * 0.3, 0xffffff, 1.5);
  }
  for (let k = 0; k < 26; k++) {
    const z = RAD.z2 + 2.2 + A() * 9;
    const x = XC(z) - 9 + A() * 18;
    if (distBarre(x, z) < BARRE.r2 + 0.3) continue;
    plaque(ctx, M.ecume, x, z, 1.5 + A() * 3, 0.25 + A() * 0.5, Y_AVAL + 0.03, (A() - 0.5) * 0.25, 0xf2f6f2, 2);
  }
  // Le sillage des piles et des rochers du courant
  for (const px of PILES) {
    for (const s of [-1, 1]) plaque(ctx, M.ecume, px + s * 0.9, 6.2, 5.5, 0.6, Y_AVAL + 0.03, s * 0.18, 0xffffff, 2);
    if (px === PILES[0]) plaque(ctx, M.ecume, px, -4.6, 1.2, 1.8, Y_AVAL + 0.03, 0, 0xffffff, 1.5);
  }
  for (let k = 0; k < 14; k++) {
    const z = 6 + A() * 28;
    const cote = A() < 0.5 ? -1 : 1;
    const x = XC(z) + cote * (5 + A() * 4.5);
    if (!ctx.ici(x) || vase(x, z)) continue;
    rocher(c, x, z, 0.5 + A() * 0.6, Y_AVAL - 0.35, A() < 0.5 ? 0x7d786c : 0x6b675e);
    plaque(ctx, M.ecume, x, z + 1.2, 2.2, 1, Y_AVAL + 0.03, 0, 0xffffff, 2);
  }
  // Des galets affleurants et des herbes d'eau sur les berges en pente douce
  for (let k = 0; k < 40 * (0.6 + u * 0.4); k++) {
    const z = -34 + A() * 68;
    const x = XC(z) + (A() < 0.5 ? -1 : 1) * (W2 - 0.6 - A() * 2.2);
    if (!ctx.ici(x)) continue;
    const y = hauteur(x, z);
    if (y < yEau(z) - 0.1) continue;
    if (A() < 0.5) rocher(c, x, z, 0.15 + A() * 0.25, y - 0.05, 0xa29b8b);
    else joncs(c, x, z, y - 0.05, 0.9 + A() * 0.6);
  }
}

// ---------- La route et les pistes ----------

function rubanX(ctx, x1, x2, o1, o2, y, couleur, mat, garder = () => true) {
  const pos = [];
  for (let x = x1; x < x2 - 1e-6; x = Math.floor(x + 1e-6) + 1) {
    const xb = Math.min(x2, Math.floor(x + 1e-6) + 1);
    if (!ctx.ici((x + xb) / 2) || !garder(x)) continue;
    const A = [x, y, zr(x) + o1];
    const B = [x, y, zr(x) + o2];
    const Cc = [xb, y, zr(xb) + o1];
    const D = [xb, y, zr(xb) + o2];
    pos.push(...A, ...B, ...Cc, ...Cc, ...B, ...D);
  }
  if (!pos.length) return;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  ctx.c.poser(g, mat, couleur, {}, { crasse: false, nuance: 0 });
  g.dispose();
}

function rubanPoly(ctx, pts, demi, y, couleur, mat) {
  const pos = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[i + 1];
    const L = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.round(L));
    const nx = -(bz - az) / L;
    const nz = (bx - ax) / L;
    for (let k = 0; k < n; k++) {
      const t1 = k / n;
      const t2 = (k + 1) / n;
      const p = [ax + (bx - ax) * t1, az + (bz - az) * t1];
      const q = [ax + (bx - ax) * t2, az + (bz - az) * t2];
      if (!ctx.ici((p[0] + q[0]) / 2)) continue;
      const P = [[p[0] - nx * demi, y, p[1] - nz * demi], [p[0] + nx * demi, y, p[1] + nz * demi], [q[0] + nx * demi, y, q[1] + nz * demi], [q[0] - nx * demi, y, q[1] - nz * demi]];
      // Normale vers le haut quel que soit le sens
      const ux = P[1][0] - P[0][0], uz = P[1][2] - P[0][2], vx = P[2][0] - P[0][0], vz = P[2][2] - P[0][2];
      if (uz * vx - ux * vz > 0) pos.push(...P[0], ...P[1], ...P[2], ...P[0], ...P[2], ...P[3]);
      else pos.push(...P[0], ...P[2], ...P[1], ...P[0], ...P[3], ...P[2]);
    }
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
  for (const [x1, x2] of [[-100, CULEE_O], [CULEE_E, 100]]) {
    rubanX(ctx, x1, x2, -HL, HL, 0.03, C.asphalte, M.terrain);
    // Les rives de l'asphalte s'effritent : une bordure plus claire, rongée
    rubanX(ctx, x1, x2, -HL - 0.25, -HL, 0.025, 0x77766a, M.terrain, (x) => hache(Math.round(x), 3) > 0.25 * u);
    rubanX(ctx, x1, x2, HL, HL + 0.25, 0.025, 0x77766a, M.terrain, (x) => hache(Math.round(x), 4) > 0.25 * u);
    // L'herbe gagne le milieu de la chaussée, comme sur les petites routes qu'on n'entretient plus
    rubanX(ctx, x1, x2, -0.25, 0.25, 0.034, 0x6f8448, M.terrain, (x) => hache(Math.round(x), 5) < 0.55 * u);
  }
  // Rapiéçages, fissures, feuilles
  const A = aleatoire(431 + Math.round(ctx.x0));
  for (let k = 0; k < 22; k++) {
    const x = ctx.xa + A() * 50;
    if (!ctx.ici(x) || dansLeGap(x) || x < -100 || x > 100) continue;
    const z = zr(x) + (A() - 0.5) * 4.4;
    c.boite(0.6 + A() * 2, 0.01, 0.4 + A() * 1.1, A() < 0.7 ? 0x535553 : 0x6c6d68, { x, y: 0.037, z, ry: (A() - 0.5) * 0.4 }, M.terrain, { crasse: false, nuance: 0.04 });
  }
  const pts = [];
  for (let k = 0; k < 60 * u; k++) {
    const x = ctx.xa + A() * 50;
    if (!ctx.ici(x) || dansLeGap(x) || x < -100 || x > 100) continue;
    pts.push([x, zr(x) + (A() < 0.5 ? -1 : 1) * (HL - 0.2 - A() * 0.4), 0.03]);
  }
  touffes(c, pts, PALETTE.herbeSeche);
  // Les pistes de gravier qui descendent au radier
  rubanPoly(ctx, PISTE_O, 1.8, 0.022, C.gravier, M.galets);
  rubanPoly(ctx, PISTE_E, 1.8, 0.022, C.gravier, M.galets);
  for (const P of [PISTE_O, PISTE_E]) {
    for (let i = 0; i < P.length - 1; i++) {
      const [ax, az] = P[i];
      const [bx, bz] = P[i + 1];
      const m = [(ax + bx) / 2, (az + bz) / 2];
      if (!ctx.ici(m[0])) continue;
      // Les ornières, et l'herbe entre elles
      boiteEntre(c, ax, az, bx, bz, 0.026, 0.01, 0.5, 0x7c9a50, M.terrain, { crasse: false });
    }
  }
}

// ---------- Les bords : talus, berges, et les obstacles pour le jeu ----------

function bords(ctx) {
  const { b, xa, xb } = ctx;
  const x1 = Math.max(-100, xa);
  const x2 = Math.min(100, xb);
  const dansRiviere = (x, z) => Math.abs(x - XC(z)) < W2 + 0.3;
  // Le pied des talus (là où le sol monte de plus d'un mètre). Près de la rivière, le segment est rogné sur la ligne de
  // la berge (R52) : le talus rejoint l'obstacle de la berge, sans passage entre les deux vers le bord du lot.
  const berge = (z, xRef) => XC(z) + Math.sign(xRef - XC(z)) * (W2 - 0.2);
  const talus = (xA, zA, xB, zB) => {
    const a = dansRiviere(xA, zA);
    const bb = dansRiviere(xB, zB);
    if (a && bb) return;
    if (a) xA = berge(zA, xB);
    if (bb) xB = berge(zB, xA);
    if (xB - xA > 0.05) b.obstacle(xA, zA, xB, zB, "talus boisé");
  };
  for (let x = x1; x < x2 - 0.01; x += 2) {
    const xn = x + 2;
    talus(x, vn(x) - 1.2, xn, vn(xn) - 1.2);
    talus(x, vs(x) + 1.2, xn, vs(xn) + 1.2);
  }
  if (xa <= -100) {
    b.obstacle(-100, vn(-100) - 1.2, -100, zr(-100) - HL - 0.3, "talus (bout de la halte)");
    b.obstacle(-100, zr(-100) + HL + 0.3, -100, vs(-100) + 1.2, "talus (bout de la halte)");
  }
  if (xb >= 100) {
    b.obstacle(100, vn(100) - 1.2, 100, zr(100) - HL - 0.3, "talus (bout de la halte)");
    b.obstacle(100, zr(100) + HL + 0.3, 100, vs(100) + 1.2, "talus (bout de la halte)");
  }
  // Les berges : on ne descend pas à l'eau, sauf par le radier, la cale du bac et les pontons
  const breches = {
    ouest: [[RAD.z1, RAD.z2], [-26.6, -23.4], [22.6, 24.2]],
    est: [[RAD.z1, RAD.z2], [-26, -24]],
  };
  for (const [cote, s] of [["ouest", -1], ["est", 1]]) {
    for (let z = -35; z < 35 - 0.01; z += 1) {
      const zb = z + 1;
      const zm = (z + zb) / 2;
      if (breches[cote].some(([a, bb]) => zm > a && zm < bb)) continue;
      const xA = XC(z) + s * (W2 - 0.2);
      const xB = XC(zb) + s * (W2 - 0.2);
      if (!ctx.ici((xA + xB) / 2)) continue;
      b.obstacle(xA, z, xB, zb, "berge (eau profonde)");
    }
  }
  // Le radier : ses deux bords tombent dans l'eau profonde
  for (let x = Math.floor(RAD.x1); x < RAD.x2; x += 1) {
    const xm = x + 0.5;
    if (!ctx.ici(xm)) continue;
    b.obstacle(x, RAD.z1, x + 1, RAD.z1, "bord amont du radier");
    if (xm < 4 || xm > 8.2) b.obstacle(x, RAD.z2, x + 1, RAD.z2, "bord aval du radier (chute)");
  }
  // Le pourtour du banc de galets
  const [ax, az] = BARRE.a;
  const [bx, bz] = BARRE.b;
  const r = BARRE.r + 0.1;
  const tour = [[ax - r, RAD.z2 + 0.05]];
  for (let k = 0; k <= 8; k++) {
    const a = PI + (k / 8) * PI;
    tour.push([bx + Math.cos(a) * r, bz - Math.sin(a) * r]);
  }
  tour.push([ax + r, RAD.z2 + 0.05]);
  for (let i = 0; i < tour.length - 1; i++) {
    if (ctx.ici((tour[i][0] + tour[i + 1][0]) / 2)) b.obstacle(tour[i][0], tour[i][1], tour[i + 1][0], tour[i + 1][1], "bord du banc de galets");
  }
}

// ---------- La végétation ----------

const PLACES = (() => {
  const A = aleatoire(2203);
  const arbres = [];
  const ronces = [];
  const fougeres = [];
  const dansRiviere = (x, z, m = 0) => Math.abs(x - XC(z)) < W2 + m;
  // Les talus : forêt dense ; au sud de la route, les arbres restent bas près du chemin (on doit voir le joueur)
  for (let k = 0; k < 2600; k++) {
    const x = -100 + A() * 200;
    const z = -35 + A() * 70;
    const n = vn(x);
    const s = vs(x);
    const dn = n - z;
    const ds = z - s;
    if (dn < 0.6 && ds < 0.6) continue;
    if (dansRiviere(x, z, 0.8)) continue;
    if (A() > 0.22 || !libre(x, z, 0.3)) continue;
    const r = A();
    if (dn > 0) {
      const essence = r < 0.45 ? "aulne" : r < 0.85 ? "frene" : "jeune";
      arbres.push({ x, z, h: 7 + A() * 6 + Math.min(3, dn / 3), essence });
    } else {
      const hmax = 1.8 + ds * 0.55;
      const essence = r < 0.35 ? "frene" : r < 0.7 ? "aulne" : "jeune";
      arbres.push({ x, z, h: Math.min(hmax, 5 + A() * 7), essence });
    }
  }
  // Les saules et les aulnes de la ripisylve, penchés sur l'eau
  for (let k = 0; k < 120; k++) {
    const z = -34 + A() * 68;
    const cote = A() < 0.5 ? -1 : 1;
    const x = XC(z) + cote * (W2 + 0.6 + A() * 2.6);
    if (!libre(x, z, 1.5)) continue;
    if (z > -6 && z < 6) continue; // la tête de pont reste dégagée
    if (z > RAD.z1 - 3 && z < RAD.z2 + 2) continue; // le radier aussi
    if (cote > 0 && z > 7 && z < 23) continue; // la vase du camping-car
    if (Math.abs(z - CABLE_Z) < 3.5 || Math.abs(z - 31.2) < 2.5) continue;
    const essence = A() < 0.6 ? "saule" : "aulne";
    arbres.push({ x, z, h: essence === "saule" ? 6 + A() * 3 : 8 + A() * 4, essence, vers: [-cote, 0] });
  }
  // Quelques bosquets dans le fond de vallée, à l'écart de la route
  for (let k = 0; k < 160; k++) {
    const x = -46 + A() * 90;
    const z = -30 + A() * 62;
    if (dansRiviere(x, z, 3.5) || !libre(x, z, 4) || Math.abs(z - zr(x)) < 7 || distPiste(x, z) < 4) continue;
    if (A() > 0.4) continue;
    arbres.push({ x, z, h: 4.5 + A() * 4, essence: A() < 0.5 ? "frene" : "jeune" });
  }
  // Les platanes de la guinguette
  for (const [x, z, h] of [[-38.5, 13], [-32, 11.8], [-40.6, 19.5]].map(([x, z]) => [x, z, 11])) arbres.push({ x, z, h, essence: "frene", platane: true });
  // Les ronciers : au pied des talus, au bord de la route, dans la clairière de l'huilerie
  for (let k = 0; k < 700; k++) {
    const x = -100 + A() * 200;
    const pied = A() < 0.5 ? vn(x) + (A() - 0.7) * 2.5 : vs(x) + (A() - 0.3) * 2.5;
    const z = pied;
    if (dansRiviere(x, z, 0.5) || !libre(x, z, 0.8) || Math.abs(z - zr(x)) < HL + 0.8 || distPiste(x, z) < 2.4) continue;
    if (A() > 0.42) continue;
    ronces.push({ x, z, s: 0.7 + A() * 0.8 });
  }
  for (let k = 0; k < 40; k++) {
    const x = -84 + A() * 20;
    const z = -26 + A() * 13;
    if (x > -81 && x < -67 && z > -25 && z < -13) continue;
    ronces.push({ x, z, s: 0.6 + A() * 0.7 });
  }
  // Les fougères du sous-bois
  for (let k = 0; k < 900; k++) {
    const x = -100 + A() * 200;
    const z = -35 + A() * 70;
    if (dansRiviere(x, z, 0.5)) continue;
    const d = Math.max(vn(x) - z, z - vs(x));
    if (d < 0.8 || A() > 0.35) continue;
    fougeres.push({ x, z });
  }
  return { arbres, ronces, fougeres };
})();

function nature(ctx) {
  const { c, u } = ctx;
  for (const a of PLACES.arbres) {
    if (!ctx.ici(a.x) || autourDeLaGlaise(a.x, a.z)) continue;
    arbreBerge(c, a.x, a.z, a.h, hauteur(a.x, a.z), a.essence, a.vers ?? [0, 0]);
  }
  for (const r of PLACES.ronces) {
    if (!ctx.ici(r.x) || autourDeLaGlaise(r.x, r.z)) continue;
    roncier(c, r.x, r.z, r.s * (0.8 + u * 0.3), hauteur(r.x, r.z) - 0.05);
  }
  for (const f of PLACES.fougeres) {
    if (!ctx.ici(f.x)) continue;
    fougere(c, f.x, f.z, hauteur(f.x, f.z) - 0.05, 0.5 + hache(Math.round(f.x * 10), Math.round(f.z * 10)) * 0.4);
  }
  // Les herbes hautes et les joncs du fond de vallée, plus nombreux avec l'usure
  const A = aleatoire(ctx.x0 * 7 + 99);
  const pts = [];
  for (let k = 0; k < 120 + 120 * u; k++) {
    const x = ctx.xa + A() * 50;
    const z = -32 + A() * 64;
    if (!ctx.ici(x) || x < -100 || x > 100) continue;
    if (hauteur(x, z) !== 0 || !libre(x, z, 0.3) || distRoute(x, z) < HL + 0.2 || distPiste(x, z) < 1.9) continue;
    if (Math.abs(x - XC(z)) < W2 + 1.2 && A() < 0.6) joncs(c, x, z, 0, 1 + A() * 0.4);
    else pts.push([x, z, 0]);
  }
  touffes(c, pts, PALETTE.herbeSeche);
}

// ---------- Les alentours (R52) : la vallée continue au-delà du lot ----------
//
// Vu de haut, le lot ne doit plus flotter sur le ciel. Chaque tronçon porte sa bande nord et sa bande sud (45 m) ; le
// chemin creux porte en plus le prolongement ouest, la remontée le prolongement est (45 m). On y voit le relief de la
// vallée (les talus boisés, le plateau), la rivière qui vient du nord et repart au sud, la route qui continue aux deux
// bouts. Très léger : un relief à couleur par triangle (matière du terrain), l'eau du lot, des silhouettes d'arbres
// (une boule, un fût) ; trois appels de dessin, aucun obstacle. Tout est dans le groupe nommé « alentours ».

const LOIN = 45;
// Les rangées du relief au-delà du bord nord ou sud : serrées près du lot (raccord), lâches au loin.
const RANGS = [0, 2.5, 5, 7.5, 10, 15, 20, 25, 32.5, 40, LOIN];

/** Le relief des alentours : celui du lot, qui s'ouvre peu à peu en une vallée qui suit la rivière. */
function hauteurAlentours(x, z) {
  const h0 = hauteur(x, z);
  const d = Math.abs(z) - 35;
  if (d <= 0) return h0;
  const t = W2 - Math.abs(x - XC(z));
  if (t > 0) return h0; // le lit de la rivière
  const e = -t; // la distance à la berge
  const hv = Math.min(8.5, 1.5 + e * 0.45) * (0.85 + 0.3 * bruit(x * 0.13, z * 0.13));
  return h0 + (hv - h0) * lisse(d / 22);
}

// Le fût d'un arbre lointain : un prisme à trois pans, sans fond (6 triangles)
const FUT_LOIN = new THREE.CylinderGeometry(0.6, 1, 1, 3, 1, true).translate(0, 0.5, 0);
const TONS_LOIN = [0x3d5e34, 0x47693a, 0x355330, 0x5f8540, 0x6f9448, 0x4f7a3e];

function alentours(ctx) {
  const { x0, xa, xb } = ctx;
  const ouest = xa <= -100;
  const est = xb >= 100;
  const a = new Chantier(7700 + Math.round(x0));
  // La grille : x tous les 2,5 m au droit du lot, tous les 5 m au-delà des bouts ; z serré près des bords
  const xs = [];
  if (ouest) for (let x = xa - LOIN; x < xa; x += 5) xs.push(x);
  for (let x = xa; x < xb - 1e-6; x += 2.5) xs.push(x);
  xs.push(xb);
  if (est) for (let x = xb + 5; x <= xb + LOIN + 1e-6; x += 5) xs.push(x);
  const zs = [...RANGS.slice(1).reverse().map((d) => -35 - d), -35];
  if (ouest || est) for (let z = -32.5; z < 35 - 1e-6; z += 2.5) zs.push(z);
  zs.push(...RANGS.map((d) => 35 + d));
  const dansLeLot = (x, z) => x > Math.max(-100, xa) && x < Math.min(100, xb) && Math.abs(z) < 35;
  const loin = (x, z) => Math.max(Math.abs(z) - 35, x < -100 ? -100 - x : x > 100 ? x - 100 : 0, 0);
  const V = zs.map((z) => xs.map((x) => [x, hauteurAlentours(x, z), z]));
  // Les triangles, rangés par teinte (comme le terrain du lot) ; le sous-bois s'assombrit avec la distance
  const classes = new Map();
  const ajouter = (cle, ...pts) => {
    let t = classes.get(cle);
    if (!t) classes.set(cle, (t = []));
    for (const p of pts) t.push(p[0], p[1], p[2]);
  };
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const tri = (p, q, r) => {
    va.set(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
    vb.set(r[0] - p[0], r[1] - p[1], r[2] - p[2]);
    const ny = va.cross(vb).normalize().y;
    const cx = (p[0] + q[0] + r[0]) / 3;
    const cy = (p[1] + q[1] + r[1]) / 3;
    const cz = (p[2] + q[2] + r[2]) / 3;
    let [coul] = classe(cx, cy, cz, ny);
    // La berge, plus grossière qu'au lot : de la terre (pas la grève claire, qui ferait de grands triangles pâles)
    const db = Math.abs(Math.abs(cx - XC(cz)) - W2);
    if (db < 2.5 && cy > -0.6) coul = cy > 1.5 ? 0x6d5a40 : 0x75684f;
    // Hors du lot, l'accotement en dents de scie ferait tache : de l'herbe (la route a sa propre bordure)
    if (coul === C.accotement) coul = 0x7c9a50;
    const f = Math.round(lisse(loin(cx, cz) / LOIN) * 3);
    if (f && cy > 0.3) coul = new THREE.Color(coul).multiplyScalar(1 - 0.09 * f).getHex();
    ajouter(coul, p, q, r);
  };
  for (let j = 0; j < zs.length - 1; j++) {
    for (let i = 0; i < xs.length - 1; i++) {
      if (dansLeLot((xs[i] + xs[i + 1]) / 2, (zs[j] + zs[j + 1]) / 2)) continue;
      const v00 = V[j][i];
      const v10 = V[j][i + 1];
      const v01 = V[j + 1][i];
      const v11 = V[j + 1][i + 1];
      if ((i + j) % 2) {
        tri(v00, v01, v10);
        tri(v10, v01, v11);
      } else {
        tri(v00, v01, v11);
        tri(v00, v11, v10);
      }
    }
  }
  // Le pourtour extérieur : une coupe de terre, comme les tranches du lot
  const coupe = (p, q) => {
    const p2 = [p[0], -6, p[2]];
    const q2 = [q[0], -6, q[2]];
    ajouter(0x4a4537, p, p2, q, q, p2, q2, p, q, p2, q, q2, p2);
  };
  const nz = zs.length - 1;
  const nx = xs.length - 1;
  for (let i = 0; i < nx; i++) {
    coupe(V[0][i], V[0][i + 1]);
    coupe(V[nz][i], V[nz][i + 1]);
  }
  if (ouest) for (let j = 0; j < nz; j++) coupe(V[j][0], V[j + 1][0]);
  if (est) for (let j = 0; j < nz; j++) coupe(V[j][nx], V[j + 1][nx]);
  // La route qui continue hors du lot, aux deux bouts : l'asphalte, sa bordure rongée, l'herbe au milieu
  const route = (x1, x2) => {
    for (let x = x1; x < x2 - 1e-6; x += 5) {
      const xe = Math.min(x2, x + 5);
      const z1 = zr(x);
      const z2 = zr(xe);
      const bande = (o1, o2, y, coul) => ajouter(coul, [x, y, z1 + o1], [x, y, z1 + o2], [xe, y, z2 + o1], [xe, y, z2 + o1], [x, y, z1 + o2], [xe, y, z2 + o2]);
      bande(-HL, HL, 0.03, C.asphalte);
      bande(-HL - 0.25, -HL, 0.025, 0x77766a);
      bande(HL, HL + 0.25, 0.025, 0x77766a);
      if (hache(Math.round(x), 5) < 0.6) bande(-0.25, 0.25, 0.034, 0x6f8448);
    }
  };
  if (ouest) route(xa - LOIN, -100);
  if (est) route(100, xb + LOIN);
  for (const [coul, pos] of classes) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    a.poser(g, ctx.M.terrain, coul, {}, { crasse: false, nuance: 0 });
    g.dispose();
  }
  // La rivière qui vient du nord et repart au sud : la même eau que dans le lot
  const ca = { ...ctx, c: a };
  nappeRiviere(ca, ctx.M.eau, -35 - LOIN, -35, Y_AMONT, 11.3, 6, 0x6f8c7a, 5);
  nappeRiviere(ca, ctx.M.eau, 35, 35 + LOIN, Y_AVAL, 10.7, 3, 0x84a092, 5);
  // Des silhouettes d'arbres : denses près des bords (elles prolongent la forêt des talus), plus rares au loin
  const A = aleatoire(9100 + Math.round(x0));
  const x1 = xs[0];
  const x2 = xs[xs.length - 1];
  const n = Math.round(((x2 - x1) * 2 * LOIN + (ouest || est ? LOIN * 70 : 0)) / (ouest || est ? 80 : 35));
  for (let k = 0; k < n; k++) {
    const x = x1 + A() * (x2 - x1);
    const z = (A() < 0.5 ? -1 : 1) * (A() * (35 + LOIN));
    const d = loin(x, z);
    if (dansLeLot(x, z) || d < 0.5 || d > LOIN - 2) continue;
    if (A() > 0.3 + 0.7 * (1 - d / LOIN)) continue;
    if (Math.abs(x - XC(z)) < W2 + 1.5 || distRoute(x, z) < HL + 2.5) continue;
    const y = hauteurAlentours(x, z);
    if (y < 0.6) continue;
    const h = 8 + A() * 6;
    const s = h * (0.2 + A() * 0.06);
    const r = 0.12 + h * 0.02;
    a.poser(FUT_LOIN, ctx.M.mat, 0x4c4236, { x, y: y - 0.3, z, ry: A() * 3, e: [r, h * 0.5 + 0.3, r] }, { crasse: false, nuance: 0.05 });
    a.poser(BOULE, ctx.M.mat, TONS_LOIN[Math.floor(A() * TONS_LOIN.length)], { x, y: y + h * 0.66, z, ry: A() * 3, e: [s, s * 1.35, s] }, { crasse: false, nuance: 0.08 });
  }
  if (a.vide) return;
  const g = a.construire();
  g.name = "alentours";
  g.userData.nom = "alentours";
  g.traverse((o) => {
    if (o.isMesh) o.castShadow = false;
  });
  ctx.b.ajouter(g);
}

// ---------- Les murs à deux étages (bas dans le principal, haut dans une couche) ----------

function murDouble(ctx, k, a, bb, spec) {
  const { h, ep = 0.18, coupe = 1.05, couleur, mat, ouvertures = [], interieur = null, breches = [] } = spec;
  mur(ctx.c, a, bb, { h: coupe, ep, couleur, mat, interieur, batiment: ctx.b, ouvertures: ouvertures.map((o) => ({ ...o, type: o.type === "porte" ? "porte" : "vide" })) });
  mur(k ?? ctx.c, a, bb, {
    h: h - coupe,
    y0: coupe,
    ep,
    couleur,
    mat,
    interieur,
    breches,
    ouvertures: ouvertures.map((o) => ({ ...o, vantail: undefined, bas: Math.max(0, o.bas - coupe), haut: o.haut - coupe })),
  });
}

/**
 * Les quatre murs d'un rectangle [x1, x2] × [z1, z2] (z1 au nord), faces extérieures dehors. Le sud et l'est sont
 * coupés à hauteur d'allège (le haut dans la couche k) ; le nord et l'ouest montent entiers.
 */
function quatreMurs(ctx, k, [x1, z1, x2, z2], spec, ouv = {}) {
  const { h } = spec;
  // Les murs qui regardent la caméra (sud-est) sont coupés à hauteur d'allège. Pour le gué retourné (miroir), le mur
  // ouest deviendra le mur est : c'est lui qu'on coupe.
  const coupeOuest = !!ctx.miroir;
  mur(ctx.c, [x2, z1], [x1, z1], { ...spec, batiment: ctx.b, ouvertures: ouv.n ?? [] });
  if (coupeOuest) murDouble(ctx, k, [x1, z1], [x1, z2], { ...spec, h, ouvertures: ouv.o ?? [] });
  else mur(ctx.c, [x1, z1], [x1, z2], { ...spec, batiment: ctx.b, ouvertures: ouv.o ?? [] });
  murDouble(ctx, k, [x1, z2], [x2, z2], { ...spec, h, ouvertures: ouv.s ?? [] });
  if (coupeOuest) mur(ctx.c, [x2, z2], [x2, z1], { ...spec, batiment: ctx.b, ouvertures: ouv.e ?? [] });
  else murDouble(ctx, k, [x2, z2], [x2, z1], { ...spec, h, ouvertures: ouv.e ?? [] });
}

/** Un toit à un pan de tôle ondulée, du haut (yN, au nord) au bas (yS, au sud), en lés de 0,6 m. */
function toitTole(k, M, x1, z1, x2, z2, yN, yS, couleur, trous = []) {
  const deb = 0.35;
  for (let x = x1 - deb; x < x2 + deb - 0.01; x += 0.62) {
    const xm = x + 0.31;
    if (trous.some(([a, b]) => xm > a && xm < b)) continue;
    const sombre = Math.round((x - x1) / 0.62) % 2 ? 0 : 0.06;
    const coul = new THREE.Color(couleur).offsetHSL(0, 0, -sombre).getHex();
    planche(k, [xm, yN + 0.1, z1 - deb], [xm, yS - 0.02, z2 + deb], 0.64, 0.05, coul, M.tole, [1, 0, 0], { nuance: 0.05, crasse: false });
  }
}

/** Un pignon triangulaire dans le plan x = cste (base de largeur W en z, centrée en zc). */
function pignonX(c, mat, couleur, x, zc, W, y0, hf, ep = 0.18) {
  const s = new THREE.Shape();
  s.moveTo(-W / 2, 0);
  s.lineTo(W / 2, 0);
  s.lineTo(0, hf);
  s.lineTo(-W / 2, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: ep, bevelEnabled: false });
  c.poser(g, mat, couleur, { x: x - ep / 2, y: y0, z: zc, ry: PI / 2 }, { crasse: false, nuance: 0.02 });
  g.dispose();
}

// ---------- Le pont suspendu emporté ----------

function pont(ctx) {
  const { c, b, M, u } = ctx;
  const ici = (x) => ctx.ici(x);
  // Les culées : la route s'arrête au ras du vide
  for (const [x1, x2, s] of [[CULEE_O - 2, CULEE_O, 1], [CULEE_E, CULEE_E + 2, -1]]) {
    const xm = (x1 + x2) / 2;
    if (!ici(xm)) continue;
    c.pave(x1, Y_LIT, -3.7, x2, 0, 3.7, C.beton, M.mat, { nuance: 0.03, crasse: false });
    c.pave(x1 - 0.05, -2.4, -3.75, x2 + 0.05, -1.1, 3.75, 0x6f7a5a, M.mat, { crasse: false, nuance: 0.05 }); // la ligne de mousse des crues
    // Les murs en aile, le long de la berge
    for (const sz of [-1, 1]) boiteEntre(c, s > 0 ? x2 - 0.4 : x1 + 0.4, sz * 3.7, s > 0 ? x2 - 1.2 : x1 + 1.2, sz * 7.2, Y_LIT, 3.2, 0.6, C.betonSombre, M.mat, { nuance: 0.03 });
    // Les bouts de parapet de pierre et de garde-corps tordus
    for (const sz of [-1, 1]) {
      const [pa, pb] = s > 0 ? [x1 - 0.8, x2] : [x1, x2 + 0.8];
      c.pave(pa, 0, sz * 3.5 - 0.25, pb, 0.85, sz * 3.5 + 0.25, C.pierre, M.pierre, { nuance: 0.03 });
      c.boite(1.2, 0.06, 0.06, C.acier, { x: s > 0 ? x2 + 0.5 : x1 - 0.5, y: 0.7, z: sz * 3.4, rz: s * -0.6, ry: sz * 0.3 }, M.tole);
      b.obstacle(pa, sz * 3.5, pb, sz * 3.5, "parapet de la culée");
    }
    // Le bout de tablier qui dépasse encore, ferraillé
    const bord = s > 0 ? x2 : x1;
    c.pave(Math.min(bord, bord + s * 1.4), -0.45, -3.2, Math.max(bord, bord + s * 1.4), 0, 3.2, C.beton, M.mat, { nuance: 0.03, crasse: false });
    for (let z = -3; z <= 3; z += 0.45) {
      if (hache(Math.round(z * 10), s + 7) < 0.3) continue;
      c.poutre([bord + s * 1.3, -0.25, z], [bord + s * (1.7 + hache(Math.round(z * 10), 3) * 0.6), -0.25 - hache(Math.round(z * 10), 9) * 0.5, z + 0.1], 0.03, C.rouille, M.tole);
    }
  }
  // Les massifs d'ancrage des câbles, derrière les culées
  for (const [x, s] of [[-15.2, 1], [18.8, -1]]) {
    if (!ici(x)) continue;
    for (const sz of [-1, 1]) {
      c.pave(x - 1, 0, sz * 3.4 - 0.7 * (sz > 0 ? 0 : 1), x + 1, 1.3, sz * 3.4 + 0.7 * (sz > 0 ? 1 : 0), C.pierreGrise, M.pierre, { nuance: 0.03 });
      c.boite(0.5, 0.5, 0.5, C.fonte, { x: x + s * 0.9, y: 1.1, z: sz * 3.75 }, M.metal);
      b.obstacle(x - 1, sz * 3.4, x + 1, sz * 3.4, "massif d'ancrage");
    }
  }
  // Les piles et leurs portiques
  const Y_PORTIQUE = 8;
  for (const [i, px] of PILES.entries()) {
    if (!ici(px)) continue;
    // La pile : maçonnerie à avant-becs, du lit jusqu'au-dessus de l'eau
    c.pave(px - 0.9, Y_LIT, -3.4, px + 0.9, 0.4, 3.4, C.pierre, M.pierre, { nuance: 0.03 });
    for (const sz of [-1, 1]) c.boite(1.27, 3.6, 1.27, C.pierre, { x: px, y: Y_LIT + 1.8, z: sz * 3.4, ry: PI / 4 }, M.pierre, { nuance: 0.03 });
    c.pave(px - 1.0, 0.4, -3.55, px + 1.0, 0.6, 3.55, 0xb9aa8a, M.pierre, { crasse: false });
    c.pave(px - 0.95, Y_AVAL - 0.3, -3.5, px + 0.95, Y_AVAL + 0.5, 3.5, 0x55603e, M.mat, { crasse: false, nuance: 0.05 }); // mousse au fil de l'eau
    // Le portique : deux colonnes et leur linteau ; celui de l'est est brisé
    const intact = i === 0;
    for (const sz of [-1, 1]) {
      const haut = intact ? Y_PORTIQUE : sz < 0 ? 3.6 : 2.2;
      c.pave(px - 0.55, 0.6, sz * 3.1 - 0.55, px + 0.55, haut, sz * 3.1 + 0.55, C.pierre, M.pierre, { nuance: 0.03 });
      if (!intact) {
        gravats(c, px + 0.3 * sz, sz * 3.1, 0.9, 6, [C.pierre, 0xb9aa8a, PALETTE.pierre], 0.6);
        c.boite(0.9, 0.5, 0.8, C.pierre, { x: px + 0.2, y: haut + 0.1, z: sz * 3.1, rz: 0.3, ry: 0.4 }, M.pierre);
      } else {
        c.pave(px - 0.65, haut - 0.25, sz * 3.1 - 0.65, px + 0.65, haut, sz * 3.1 + 0.65, 0xb9aa8a, M.pierre, { crasse: false });
        c.boite(0.5, 0.35, 0.7, C.fonte, { x: px, y: haut + 0.15, z: sz * 3.1 }, M.metal); // la selle du câble
      }
    }
    if (intact) {
      c.pave(px - 0.5, Y_PORTIQUE - 1.6, -2.6, px + 0.5, Y_PORTIQUE - 0.5, 2.6, C.pierre, M.pierre, { nuance: 0.03 });
      c.pave(px - 0.52, Y_PORTIQUE - 1.35, -0.8, px + 0.52, Y_PORTIQUE - 0.75, 0.8, 0xe9e3d2, M.mat, { crasse: false }); // le cartouche « 1872 »
    } else {
      // Les morceaux du linteau dans l'eau, au pied de la pile
      for (let k = 0; k < 3; k++) c.boite(1.0, 0.7, 1.3, C.pierre, { x: px + 1.6 + k * 0.7, y: Y_AVAL - 0.1, z: -1.6 + k * 1.5, rx: k, ry: k * 0.7 }, M.pierre);
    }
  }
  // Les câbles porteurs : de l'ancrage ouest au portique debout, puis ils pendent dans le courant
  const yT = Y_PORTIQUE + 0.3;
  for (const sz of [-1, 1]) {
    const z = sz * 3.1;
    cable(c, M.metal, 0x4a4e50, [-15.2, 1.3, sz * 3.75], [PILES[0], yT, z], 1.2, 0.07, 12, ici);
    cable(c, M.metal, 0x4a4e50, [PILES[0], yT, z], [PILES[0] + 5.5, Y_AVAL - 0.2, z + sz * 0.8], 0.6, 0.07, 8, ici);
    // Côté est : ils pendent du portique brisé jusqu'à l'ancrage, mous, presque au sol
    cable(c, M.metal, 0x4a4e50, [PILES[1], 2.2, z], [18.8, 1.3, sz * 3.75], 2.4, 0.07, 10, ici);
    // Les suspentes qui pendent encore sous le câble ouest
    for (let k = 1; k < 8; k++) {
      const x = -15.2 + (k / 8) * (PILES[0] + 15.2);
      if (x < CULEE_O + 0.5 || !ici(x)) continue;
      const t = k / 8;
      const y = 1.3 + (yT - 1.3) * t - 1.2 * 4 * t * (1 - t);
      const bas = hache(k, sz + 3) < 0.4 ? -0.4 : y - 1.5 - hache(k, sz) * 2;
      c.tube([x, y, z], [x + 0.1, Math.max(bas, Y_AMONT), z + 0.05], 0.02, 0x4a4e50, M.metal, 3, { crasse: false });
    }
  }
  // Le tablier : un pan couché de la pile ouest jusque dans l'eau, avec son garde-corps de fer
  if (ici(0.5)) {
    c.repere({ x: 0.6, y: -0.75, z: 0.3, rz: -0.22, rx: 0.12 }, () => {
      c.pave(-3.4, -0.2, -3.1, 3.4, 0.15, 3.1, C.boisGris, M.planches, { nuance: 0.04 });
      for (const sz of [-1, 1]) {
        c.pave(-3.5, -0.55, sz * 3.1 - 0.1, 3.5, 0.0, sz * 3.1 + 0.1, C.acier, M.tole);
        c.pave(-3.4, 1.0, sz * 3.15 - 0.03, 3.3, 1.06, sz * 3.15 + 0.03, C.acier, M.tole);
        for (let x = -3.2; x < 3.3; x += 0.5) c.pave(x - 0.02, 0.15, sz * 3.15 - 0.02, x + 0.02, 1.0, sz * 3.15 + 0.02, C.acier, M.tole, { crasse: false });
      }
      // Des planches manquantes laissent voir les longerons
      for (let x = -3; x < 3; x += 0.9) if (hache(Math.round(x * 10), 77) < 0.3 * u) c.pave(x, 0.15, -2, x + 0.4, 0.17, 1.2, 0x4a3e30, M.mat, { crasse: false });
    });
  }
  // Un autre morceau, plus loin, échoué sur le flanc
  if (ici(10)) c.boite(4.2, 0.35, 2.2, C.boisGris, { x: 10.2, y: Y_AVAL - 0.05, z: 6.5, rz: 0.15, rx: 0.4, ry: 0.5 }, M.planches);
  // Les troncs flottés coincés contre les piles et contre le radier (côté amont)
  const tr = [
    [[-6.2, Y_AVAL + 0.1, -4.6], [0.4, Y_AVAL + 0.25, -3.9], 0.35],
    [[-4.6, Y_AVAL + 0.25, -4.2], [-1.2, Y_AVAL + 0.5, -5.4], 0.24],
    [[-2.4, Y_AVAL + 0.3, -4.1], [-3.2, Y_AVAL + 0.9, -6.4], 0.2],
    [[4.4, 0.22, -4.7], [9.0, -0.4, -4.1], 0.3],
    [[-8.6, Y_AMONT + 0.05, -14.1], [-2.6, Y_AMONT + 0.1, -14.0], 0.3],
    [[-5.2, Y_AMONT + 0.12, -14.25], [0.2, Y_AMONT + 0.25, -14.5], 0.22],
  ];
  for (const [a, bb, r] of tr) if (ici((a[0] + bb[0]) / 2)) bois(c, a, bb, r);
  // Le tas de branches, tiré de l'eau et posé sur la berge ouest, à portée de main
  if (ici(-11.2)) {
    const A = aleatoire(1103);
    for (let k = 0; k < 9; k++) {
      const a = A() * PI;
      const lg = 1.4 + A() * 1.4;
      const [cx, cz] = [-11.2 + (A() - 0.5) * 0.8, -5.2 + (A() - 0.5) * 0.6];
      const y = 0.08 + Math.floor(k / 3) * 0.12;
      bois(c, [cx - Math.cos(a) * lg / 2, y, cz - Math.sin(a) * lg / 2], [cx + Math.cos(a) * lg / 2, y + 0.05, cz + Math.sin(a) * lg / 2], 0.05 + A() * 0.05, A() < 0.5 ? 0x8f8676 : 0x7a6a56);
    }
  }
  // Des branchages pris dans les troncs
  for (let k = 0; k < 10; k++) {
    const x = -7 + k * 0.9;
    if (!ici(x)) continue;
    c.tube([x, Y_AMONT + 0.05, -14.1], [x + 0.6, Y_AMONT + 0.5, -14.6 - (k % 3) * 0.2], 0.04, 0x6a5e4c, M.mat, 3, { crasse: false });
  }
  // Les barrières de chantier et le grand panneau, sur la rive ouest
  if (ici(-12)) {
    for (let k = 0; k < 4; k++) {
      const z = -2.7 + k * 1.8;
      const tombe = hache(k, 21) < 0.35 * u;
      c.repere({ x: -11.9 + (tombe ? 0.6 : 0), y: tombe ? 0.08 : 0, z, rz: tombe ? -PI / 2 + 0.1 : 0, ry: (hache(k, 4) - 0.5) * 0.3 }, () => {
        for (const sz of [-0.75, 0.75]) c.boite(0.05, 1.0, 0.05, C.acier, { y: 0.5, z: sz }, M.tole);
        for (let i = 0; i < 4; i++) c.boite(0.05, 0.22, 0.3, i % 2 ? 0xe9e3d2 : 0xb5402f, { y: 0.78, z: -0.6 + i * 0.4 }, M.satin, { crasse: false });
        c.boite(0.04, 0.04, 1.5, C.acier, { y: 0.3 }, M.tole);
      });
    }
    b.obstacle(-11.9, -3.6, -11.9, 3.6, "barrières de chantier (le pont n'est plus là)");
  }
  if (ici(-14.6)) {
    const px = -14.6;
    const pz = -4.4;
    for (const dx of [-1.4, 1.4]) c.boite(0.12, 2.6, 0.12, C.acier, { x: px + dx * Math.cos(0.45), y: 1.3, z: pz - dx * Math.sin(0.45) }, M.tole);
    panneau(c, R.pont, { x: px + 0.03, y: 2.1, z: pz + 0.08, ry: 0.45 }, 3.2, 1.6);
    c.boite(3.3, 1.7, 0.05, 0x8a8f90, { x: px, y: 2.1, z: pz, ry: 0.45 }, M.tole);
  }
}

// ---------- Le radier et le banc de galets ----------

function radier(ctx) {
  const { c, b, M, u, lum } = ctx;
  // La dalle : on la rogne au bord des tronçons (elle traverse la rivière)
  const x1 = rogner(ctx, RAD.x1);
  const x2 = rogner(ctx, RAD.x2);
  if (x2 - x1 > 0.01) {
    c.pave(x1, Y_LIT, RAD.z1, x2, -0.02, RAD.z2, C.betonSombre, M.mat, { nuance: 0.02 });
    c.pave(x1, -0.02, RAD.z1, x2, 0, RAD.z2, C.betonMouille, M.lisse, { crasse: false, nuance: 0 });
    // Le parement aval, verdi par l'eau qui tombe ; les algues
    c.pave(x1, Y_AVAL - 0.3, RAD.z2 - 0.02, x2, -0.25, RAD.z2 + 0.03, 0x4f6a3e, M.mat, { crasse: false, nuance: 0.05 });
  }
  const A = aleatoire(5150);
  for (let k = 0; k < 24; k++) {
    const x = RAD.x1 + 1 + A() * (RAD.x2 - RAD.x1 - 2);
    const z = RAD.z1 + 0.3 + A() * 4;
    if (!ctx.ici(x)) continue;
    c.boite(0.6 + A() * 1.5, 0.008, 0.3 + A() * 0.6, A() < 0.5 ? 0x5a6b40 : 0x6e7a4a, { x, y: 0.004, z, ry: (A() - 0.5) * 0.6 }, M.lisse, { crasse: false, nuance: 0.05 });
  }
  // Les balises blanc et rouge, de chaque côté
  for (let x = RAD.x1 + 0.8; x < RAD.x2; x += 2.5) {
    if (!ctx.ici(x)) continue;
    for (const z of [RAD.z1 + 0.15, RAD.z2 - 0.15]) {
      if (z > RAD.z1 + 1 && x > 3.6 && x < 8.6) continue;
      const k = Math.round(x * 3 + z);
      if (hache(k, 1) < 0.18 * u) continue; // arrachée
      balise(c, x, z, hache(k, 2) < 0.3 * u ? (hache(k, 3) - 0.5) * 0.9 : 0);
    }
  }
  // L'échelle de crue et les panneaux « Passage submersible » aux deux têtes
  if (ctx.ici(-11.2)) {
    c.boite(0.14, 3.4, 0.14, C.acier, { x: -11.2, y: 0.3, z: RAD.z1 - 0.25 }, M.tole);
    panneau(c, R.echelle, { x: -11.2, y: 0.6, z: RAD.z1 - 0.17 }, 0.25, 2.6);
  }
  for (const [x, z, ry] of [[-13.8, -7.6, 0.45], [16.4, -14.8, 0.7]]) {
    if (!ctx.ici(x)) continue;
    c.boite(0.08, 2.2, 0.08, C.acier, { x, y: 1.1, z }, M.tole);
    panneau(c, R.crue, { x: x + 0.04 * Math.sin(ry), y: 1.85, z: z + 0.04 * Math.cos(ry), ry }, 1.3, 0.65);
    c.boite(1.34, 0.69, 0.03, 0x8a8f90, { x, y: 1.85, z, ry }, M.tole);
  }
  // Le banc de galets : bois flotté, le feu des survivants à l'abri, leurs affaires
  if (ctx.ici(6.4)) {
    const [fx, fz] = [6.3, -7.4];
    feu(c, fx, 0, fz, 1);
    lum.push(() => b.lumiere(fx, 0.6, fz, 0xff8a3d, 10, 13, "feu des survivants sur le banc de galets"));
    // La marmite sur son trépied
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * PI * 2;
      c.tube([fx + Math.cos(a) * 0.55, 0, fz + Math.sin(a) * 0.55], [fx, 1.05, fz], 0.025, C.fonte, M.metal, 4);
    }
    cylindre(c, M.metal, 0x2e2e2c, fx, 0.55, fz, 0.2, 0.17, 0.25, 8);
    // Les grands troncs flottés, en abri contre le vent et les regards
    bois(c, [4.4, 0.3, -9.0], [5.1, 0.35, -5.2], 0.32, 0x9a9180);
    bois(c, [7.9, 0.28, -8.6], [8.4, 0.4, -5.6], 0.28, 0x8f8676);
    bois(c, [5.0, 0.2, -5.0], [8.2, 0.4, -4.6], 0.25, 0xa29a8a);
    // Les couchages, la bâche, le poisson qui sèche
    c.boite(0.8, 0.12, 1.9, 0x5a6a7a, { x: 5.3, y: 0.06, z: -6.8, ry: 0.1 }, M.toile, { nuance: 0.05 });
    c.boite(0.8, 0.12, 1.9, 0x7a5a4a, { x: 7.4, y: 0.06, z: -6.6, ry: -0.1 }, M.toile, { nuance: 0.05 });
    planche(c, [4.5, 1.3, -8.9], [5.4, 0.05, -8.2], 1.8, 0.02, 0x4f6a5a, M.toile, [0, 0, 1]);
    c.tube([7.6, 0, -8.8], [7.6, 1.5, -8.8], 0.03, C.boisGris, M.mat, 4);
    c.tube([8.3, 0, -7.8], [8.3, 1.5, -7.8], 0.03, C.boisGris, M.mat, 4);
    c.tube([7.6, 1.45, -8.8], [8.3, 1.45, -7.8], 0.015, 0xb9a679, M.mat, 3);
    for (let k = 0; k < 4; k++) c.boite(0.06, 0.28, 0.12, 0x9a8a6a, { x: 7.7 + k * 0.17, y: 1.25, z: -8.65 + k * 0.25 }, M.satin, { crasse: false });
    caisse(c, 7.6, 0, -6.0, 0.5, 0.3);
    bidon(c, 5.6, 0, -5.6, 0x5a6a4a, 0.4);
    // Des galets plus gros sur le banc
    for (let k = 0; k < 18; k++) {
      const t = A();
      const x = BARRE.a[0] + (BARRE.b[0] - BARRE.a[0]) * t + (A() - 0.5) * 3.2;
      const z = BARRE.a[1] + (BARRE.b[1] - BARRE.a[1]) * t + (A() - 0.5) * 2;
      if (Math.hypot(x - fx, z - fz) < 1) continue;
      rocher(c, x, z, 0.1 + A() * 0.22, -0.04, A() < 0.5 ? 0xb2ab9b : 0x958f82);
    }
  }
  // Un kayak orange échappé de sa station, coincé contre le radier côté amont
  if (ctx.ici(-1.2)) c.poser(new THREE.SphereGeometry(1, 7, 3), M.satin, 0xd0773a, { x: -1.2, y: Y_AMONT + 0.08, z: RAD.z1 - 0.55, ry: 0.12, rz: 0.15, e: [1.9, 0.2, 0.33] }, { nuance: 0.04 });
}

// ---------- Le bac à câble ----------

function bac(ctx) {
  const { c, b, M, u, lum } = ctx;
  const Z = CABLE_Z;
  // Les poteaux du câble, haubanés
  for (const [x, s] of [[-15.8, -1], [17.4, 1]]) {
    if (!ctx.ici(x)) continue;
    c.tube([x, -0.3, Z], [x, 6.0, Z], 0.2, C.boisGris, M.mat, 6);
    c.boite(0.5, 0.25, 0.5, C.fonte, { x, y: 5.6, z: Z }, M.metal);
    for (const sz of [-1, 1]) {
      c.tube([x, 5.5, Z], [x + s * 4, 0, Z + sz * 2.5], 0.025, 0x4a4e50, M.metal, 3, { crasse: false });
      c.boite(0.4, 0.3, 0.4, C.beton, { x: x + s * 4, y: 0.1, z: Z + sz * 2.5 }, M.mat);
    }
    b.obstacle(x - 0.25, Z, x + 0.25, Z, "poteau du bac");
  }
  if (ctx.ici(-15.8)) panneau(c, R.plaqueBac, { x: -15.8 + 0.24, y: 2.2, z: Z + 0.12, ry: 0.6 }, 1.0, 0.5);
  // Le câble tendu d'une rive à l'autre
  cable(c, M.metal, 0x3e4244, [-15.8, 5.6, Z], [17.4, 5.6, Z], 0.7, 0.035, 16, (x) => ctx.ici(x));
  // La cale de béton (rive ouest) et le ponton de la rive est
  if (ctx.ici(-12.4)) {
    c.pave(-14.6, -1.2, Z - 1.6, -10.3, 0.02, Z + 1.6, C.beton, M.mat, { nuance: 0.03 });
    c.pave(-10.6, -1.2, Z - 1.6, -10.3, 0.06, Z + 1.6, C.betonSombre, M.mat);
    for (const sz of [-1, 1]) c.boite(0.2, 0.25, 0.2, C.fonte, { x: -10.9, y: 0.12, z: Z + sz * 1.4 }, M.metal);
    b.obstacle(-14.6, Z - 1.6, -10.3, Z - 1.6, "bord de la cale");
    b.obstacle(-14.6, Z + 1.6, -10.3, Z + 1.6, "bord de la cale");
  }
  if (ctx.ici(11)) {
    c.pave(9.4, -0.12, Z - 1, 12.8, 0, Z + 1, C.boisGris, M.planches, { nuance: 0.04 });
    for (const [x, z] of [[9.6, Z - 0.9], [9.6, Z + 0.9], [11.4, Z - 0.9], [11.4, Z + 0.9]]) c.tube([x, -2.5, z], [x, 0.5, z], 0.12, 0x5a4a3a, M.mat, 6);
    b.obstacle(9.4, Z - 1, 12.6, Z - 1, "bord du ponton");
    b.obstacle(9.4, Z + 1, 12.6, Z + 1, "bord du ponton");
    // Le bout du ponton reste ouvert : c'est là qu'on monte sur le radeau et qu'on en descend
  }
  // Le radeau, accosté à la cale : plancher sur bidons, garde-corps, treuil, poulies sur le câble.
  // C'est un objet à part, « radeau » (userData.radeau), bâti autour de son centre : le jeu le fait glisser le long du
  // câble (G5, G6). Ses obstacles sont relatifs au radeau, dans son userData.
  if (ctx.ici(RADEAU.x)) {
    const r = new Chantier(4411);
    const obstacles = [];
    const obstacle = (x1, z1, x2, z2, nature) => obstacles.push({ x1: arr(x1 - RADEAU.x), z1: arr(z1 - Z), x2: arr(x2 - RADEAU.x), z2: arr(z2 - Z), nature });
    const [x1, x2] = [-10.5, -4.7];
    r.pave(x1, -0.14, Z - 2.2, x2, 0, Z + 2.2, 0x8a7a62, M.planches, { nuance: 0.04 });
    r.pave(x1, -0.3, Z - 2.25, x2, -0.14, Z - 2.0, C.boisSombre ?? 0x5a4130, M.mat);
    r.pave(x1, -0.3, Z + 2.0, x2, -0.14, Z + 2.25, 0x5a4130, M.mat);
    for (let k = 0; k < 4; k++) {
      for (const sz of [-1.3, 0, 1.3]) {
        if (sz === 0 && k % 2) continue;
        r.poser(geoCyl(0.36, 0.36, 1.25, 8), M.satin, k % 2 ? 0x2f5f8a : 0x3d6a8c, { x: x1 + 0.75 + k * 1.45, y: Y_AMONT + 0.05, z: Z + sz, rz: PI / 2 }, { nuance: 0.05 });
      }
    }
    for (const sz of [-1, 1]) {
      const z = Z + sz * 2.1;
      for (let x = x1 + 0.3; x <= x2 - 0.2; x += 1.4) r.boite(0.08, 1.0, 0.08, 0x6a5a48, { x, y: 0.5, z }, M.mat);
      r.boite(x2 - x1 - 0.3, 0.07, 0.07, 0x8a7458, { x: (x1 + x2) / 2, y: 0.98, z }, M.mat);
      r.boite(x2 - x1 - 0.3, 0.05, 0.05, 0x8a7458, { x: (x1 + x2) / 2, y: 0.55, z }, M.mat);
      obstacle(x1, z, x2, z, "garde-corps du bac");
    }
    // Aux deux bouts : une rampe rabattue et une chaîne décrochée qui pend à son poteau. On monte et on descend par
    // les deux bouts ; pendant la traversée, le jeu ferme les chaînes (obstaclesTraversee).
    const obstaclesTraversee = [];
    for (const [xb, s] of [[x1, -1], [x2, 1]]) {
      r.boite(0.9, 0.08, 3.2, 0x7a6a52, { x: xb + s * 0.35, y: 0.02, z: Z, rz: -s * 0.03 }, M.planches);
      r.boite(0.1, 1.0, 0.1, 0x6a5a48, { x: xb - s * 0.05, y: 0.5, z: Z - 1.75 }, M.mat);
      for (let k = 0; k < 5; k++) r.boite(0.06, 0.06, 0.32, 0x4a4a46, { x: xb - s * 0.12, y: 0.9 - k * 0.18, z: Z - 1.7, rx: PI / 2 + (k % 2) * 0.3 }, M.metal, { crasse: false });
      obstaclesTraversee.push({ x1: arr(xb - RADEAU.x), z1: arr(-2.2), x2: arr(xb - RADEAU.x), z2: arr(2.2), nature: `chaîne du bac, bout ${s < 0 ? "ouest" : "est"} (fermée pendant la traversée)` });
    }
    // Les deux mâts à poulies, reliés au câble par la traille
    for (const x of [x1 + 0.8, x2 - 0.8]) {
      r.tube([x, 0, Z - 1.9], [x, 2.4, Z - 1.9], 0.07, C.boisGris, M.mat, 5);
      r.tube([x, 2.4, Z - 1.9], [x + (x < -7 ? -0.6 : 0.6), 5.4, Z], 0.018, 0xb9a679, M.mat, 3, { crasse: false });
      r.boite(0.2, 0.3, 0.12, C.fonte, { x: x + (x < -7 ? -0.6 : 0.6), y: 5.45, z: Z }, M.metal);
    }
    // Le treuil à manivelle
    r.repere({ x: -7.6, y: 0, z: Z - 1.4 }, () => {
      for (const dx of [-0.4, 0.4]) r.boite(0.1, 0.9, 0.5, 0x6a5a48, { x: dx, y: 0.45 }, M.mat);
      r.poser(geoCyl(0.22, 0.22, 0.75, 8), M.mat, 0x8a7458, { y: 0.75, rz: PI / 2 });
      r.boite(0.05, 0.4, 0.05, C.fonte, { x: 0.48, y: 0.6, rz: 0.4 }, M.metal);
    });
    corde(r, -9.6, 0.05, Z + 1.3, false, 0xb9a679);
    gaffe(r, [-9.9, 0.1, Z + 1.85], [-5.6, 0.25, Z + 1.7]);
    bidon(r, -5.3, 0, Z + 1.3, 0x8a3a2a, 0.3);
    const g = r.construire();
    g.traverse((o) => o.geometry && o.geometry.translate(-RADEAU.x, 0, -Z));
    g.position.set(RADEAU.x, 0, Z);
    g.name = "radeau";
    g.userData.deplacer = true; // recentrer() déplace l'objet, pas ses sommets
    g.userData.obstacles = obstacles;
    g.userData.obstaclesTraversee = obstaclesTraversee;
    g.userData.accostages = RADEAU.accostages;
    b.ajouter(g);
  }
  // La cloche pour appeler le passeur, la borne « Bac connecté », les tarifs peints
  if (ctx.ici(-13.2)) {
    c.tube([-13.2, 0, -22.4], [-13.2, 2.3, -22.4], 0.06, C.boisGris, M.mat, 5);
    c.boite(0.6, 0.06, 0.06, C.boisGris, { x: -13.0, y: 2.25, z: -22.4 }, M.mat);
    c.poser(geoCyl(0.07, 0.16, 0.26, 8), M.metal, 0xb59048, { x: -12.8, y: 1.98, z: -22.4 });
  }
  if (ctx.ici(-15)) {
    c.repere({ x: -15, y: 0, z: -21.8, ry: 0.55 }, () => {
      c.boite(0.62, 1.55, 0.32, 0xd9d4c8, { y: 0.78 }, M.satin);
      c.boite(0.66, 0.08, 0.36, 0x2f6f73, { y: 1.58 }, M.satin);
      panneau(c, R.bac, { y: 1.12, z: 0.165 }, 0.5, 0.5, M.lumineux);
      c.boite(0.5, 0.05, 0.1, 0x2b2b29, { y: 0.62, z: 0.17 }, M.lisse);
    });
    lum.push(() => ctx.b.lumiere(-14.6, 1.2, -21.2, 0x8ff0e0, 2.5, 4, "écran de la borne « Bac connecté » (il luit encore)"));
    b.obstacle(-15.3, -22, -14.7, -21.6, "borne");
  }
  if (ctx.ici(-16.4)) {
    for (const dx of [-0.6, 0.6]) c.boite(0.08, 1.6, 0.08, C.boisGris, { x: -16.4 + dx * Math.cos(0.5), y: 0.8, z: -27.9 - dx * Math.sin(0.5) }, M.mat);
    panneau(c, R.tarifs, { x: -16.38, y: 1.25, z: -27.86, ry: 0.5 }, 1.4, 0.7);
  }
}

// ---------- La cabane du passeur ----------

function cabane(ctx) {
  const { c, b, M, u, lum } = ctx;
  if (!ctx.ici(-24)) return;
  const [x1, z1, x2, z2] = [-27, -29.5, -21, -25];
  const k = b.couche("cabane du passeur", { x: -23.6, z: -27.25, l: 7.6, p: 5.6 }, 1.05, 3.6);
  const spec = { h: 2.6, ep: 0.12, couleur: C.planchesCabane, mat: M.planches, interieur: { couleur: 0x9a8a72, mat: M.planches } };
  quatreMurs(ctx, k, [x1, z1, x2, z2], spec, {
    s: [{ u: 3.6, l: 1.0, bas: 1.0, haut: 1.9, type: "fenetre", croisillons: 1, bris: 0.3 + 0.4 * u, volet: "ouvert", couleurVolet: 0x6a7f6a }],
    e: [{ u: 2.25, l: 1.2, bas: 0, haut: 2.1, type: "porte", vantail: "entrouvert", angle: 1.3, couleurPorte: 0x6a5440 }],
    o: [{ u: 2.4, l: 0.7, bas: 1.1, haut: 1.8, type: "fenetre", croisillons: 0, bris: 0.6 }],
  });
  // Le plancher, posé à même le sol
  c.pave(x1 + 0.06, 0, z1 + 0.06, x2 - 0.06, 0.03, z2 - 0.06, 0x8a7458, M.planches, { crasse: false });
  // Le toit de tôle, un pan vers le sud, et l'auvent du porche à l'est
  toitTole(k, M, x1 - 0.1, z1, x2 + 0.1, z2, 3.0, 2.66, 0x8a8478, u > 0.6 ? [[-25.4, -24.6]] : []);
  for (const z of [z1, z2]) k.pave(x1, 2.6, z - 0.06, x2, 2.6 + (z === z1 ? 0.4 : 0.02), z + 0.06, C.planchesCabane, M.planches);
  toitTole(k, M, x2 + 0.1, z1 + 0.5, x2 + 1.7, z2 - 0.4, 2.5, 2.3, 0x7d7a70);
  // Le porche : plancher, poteaux, banc, nasse, bouée
  c.pave(x2, 0, z1 + 0.5, x2 + 1.6, 0.05, z2 - 0.4, 0x7a6a52, M.planches, { crasse: false });
  for (const z of [z1 + 0.6, z2 - 0.5]) c.boite(0.1, 2.35, 0.1, C.boisGris, { x: x2 + 1.55, y: 1.17, z }, M.mat);
  c.boite(0.35, 0.06, 1.4, 0x8a7458, { x: x2 + 1.2, y: 0.45, z: -28.2 }, M.planches);
  for (const z of [-28.8, -27.6]) c.boite(0.3, 0.45, 0.06, 0x6a5a48, { x: x2 + 1.2, y: 0.22, z }, M.mat);
  c.poser(geoCyl(0.25, 0.3, 0.9, 8, true), M.mat, 0x8a7a5a, { x: x2 + 0.6, y: 0.3, z: -25.9, rz: PI / 2 }, { crasse: false });
  c.poser(new THREE.TorusGeometry(0.3, 0.09, 4, 10), M.satin, 0xd8603a, { x: x2 + 0.1, y: 1.6, z: -28.9, ry: PI / 2 }, { crasse: false });
  // L'intérieur : lit, table au registre, étagère au réchaud, râtelier, carte
  c.pave(-26.9, 0, -29.4, -25.0, 0.42, -28.4, 0x6a5440, M.mat);
  c.pave(-26.85, 0.42, -29.35, -25.05, 0.56, -28.45, 0xb8ab90, M.toile);
  c.boite(1.5, 0.08, 0.9, 0x7a4a3a, { x: -25.8, y: 0.6, z: -28.85, ry: 0.06, rz: 0.03 }, M.toile, { nuance: 0.05 });
  c.boite(0.45, 0.14, 0.32, 0xe0dccb, { x: -26.55, y: 0.63, z: -28.9 }, M.toile);
  c.repere({ x: -23.2, y: 0, z: -28.4 }, () => {
    c.boite(1.2, 0.05, 0.8, 0x8a6a48, { y: 0.76 }, M.planches);
    for (const [px, pz] of [[-0.52, -0.33], [0.52, -0.33], [-0.52, 0.33], [0.52, 0.33]]) c.boite(0.06, 0.74, 0.06, 0x6a5040, { x: px, y: 0.37, z: pz }, M.mat);
    panneau(c, R.registre, { x: -0.1, y: 0.795, z: 0.05, rx: -PI / 2, rz: 0.15 }, 0.5, 0.25);
    c.boite(0.2, 0.06, 0.14, 0x6a5a3a, { x: 0.38, y: 0.81, z: -0.2 }, M.metal); // la boîte à jetons
  });
  lanterne(c, -22.75, 0.79, -28.6);
  lum.push(() => b.lumiere(-22.8, 1.3, -28.4, 0xffc070, 7, 9, "lanterne de la cabane du passeur"));
  chaisePliante(c, -23.2, -27.6, PI, false, 0x7a6a52);
  c.repere({ x: -26.55, y: 0, z: -26.4 }, () => {
    for (const y of [0.5, 1.1, 1.7]) c.boite(0.38, 0.04, 1.4, 0x7a6450, { y }, M.planches);
    for (const dz of [-0.68, 0.68]) c.boite(0.36, 1.75, 0.04, 0x6a5440, { y: 0.87, z: dz }, M.mat);
    // Le réchaud et sa cartouche, les conserves, le sel
    c.boite(0.3, 0.12, 0.3, 0x3a3a38, { y: 1.18, z: -0.35 }, M.metal);
    cylindre(c, M.satin, 0x2f5f8a, 0, 1.12, 0.05, 0.08, 0.08, 0.2, 8);
    for (let i = 0; i < 5; i++) cylindre(c, M.metal, [0xb9a679, 0x9a5544, 0x8a9a7a][i % 3], -0.05, 1.72, -0.5 + i * 0.22, 0.05, 0.05, 0.11, 6);
    for (let i = 0; i < 3; i++) c.boite(0.2, 0.25, 0.14, 0xe0d8c0, { x: 0, y: 0.645, z: -0.4 + i * 0.35 }, M.toile);
  });
  // Le râtelier : gaffes, avirons, cordes lovées, gilet ; la carte punaisée
  for (let i = 0; i < 3; i++) gaffe(c, [-22.0 - i * 0.3, 0.05, -29.25], [-22.2 - i * 0.3, 2.3, -29.3]);
  rame(c, [-23.6, 0.05, -29.3], [-23.5, 2.1, -29.32]);
  corde(c, -24.6, 1.6, -29.35, true, 0xb9a679);
  corde(c, -25.2, 1.45, -29.35, true, 0x8a7a5a);
  c.boite(0.45, 0.6, 0.12, 0xd8603a, { x: -21.9, y: 1.5, z: -25.2 }, M.toile);
  panneau(c, R.carte, { x: -24.0, y: 1.6, z: -29.37 }, 0.55, 0.55);
  // Dehors : le tas de bois, le filet qui sèche, une barque retournée
  for (let i = 0; i < 9; i++) c.poser(geoCyl(0.12, 0.12, 0.9, 6), M.mat, 0x8a6a48, { x: -27.4, y: 0.12 + Math.floor(i / 3) * 0.23, z: -28.6 + (i % 3) * 0.25 + (Math.floor(i / 3) % 2) * 0.12, rx: PI / 2 }, { nuance: 0.08 });
  for (const x of [-20.2, -17.6]) c.tube([x, 0, -30.2], [x, 1.9, -30.2], 0.05, C.boisGris, M.mat, 4);
  planche(c, [-20.2, 1.1, -30.2], [-17.6, 1.1, -30.2], 1.6, 0.02, 0x9a9070, M.toile, [0, 1, 0]);
  c.repere({ x: -18.9, y: 1.1, z: -30.16 }, () => {
    for (let i = 0; i < 6; i++) c.boite(0.02, 1.5, 0.02, 0x6a6450, { x: -1.2 + i * 0.5, y: 0 }, M.mat, { crasse: false });
  });
  // La barque, à l'écart du coin de la cabane : on passe à l'aise entre les deux (0.9) ; son obstacle épouse la coque
  barque(c, -17.8, 0.5, -23.6, 0.3, 0x6f8b76, { retournee: true, rz: 0.04 });
  const coque = [[-19.8, -23.63], [-16.17, -24.75], [-15.8, -23.57], [-19.43, -22.45]];
  for (let i = 0; i < 4; i++) b.obstacle(...coque[i], ...coque[(i + 1) % 4], "barque retournée");
  semer(ctx, -28, -31, -18, -23, 14);
}

/** Des touffes et quelques débris, en rectangle (usure). */
function semer(ctx, x1, z1, x2, z2, n) {
  const { c, u } = ctx;
  const pts = [];
  for (let i = 0; i < n * (0.5 + u); i++) pts.push([c.entre(x1, x2), c.entre(z1, z2), 0]);
  touffes(c, pts, PALETTE.herbeSeche);
}

// ---------- La guinguette « Chez Lulu » ----------

function guinguette(ctx) {
  const { c, b, M, u, lum } = ctx;
  if (!ctx.ici(-28)) return;
  // La buvette : bar et cuisine à l'est, réserve à l'ouest
  const [x1, z1, x2, z2] = [-37, 23, -29, 30.5];
  const k = b.couche("buvette Chez Lulu", { x: -33, z: 26.75, l: 9.4, p: 9 }, 1.05, 4.6);
  const spec = { h: 2.8, ep: 0.14, couleur: C.creme, mat: M.planches, interieur: { couleur: 0xd8cfb4, mat: M.planches } };
  quatreMurs(ctx, k, [x1, z1, x2, z2], spec, {
    n: [{ u: 2.6, l: 1.2, bas: 0, haut: 2.15, type: "porte", vantail: "entrouvert", angle: 1.6, couleurPorte: C.vertGuinguette }, { u: 6.0, l: 1.2, bas: 1.0, haut: 2.0, type: "fenetre", bris: 0.5 }],
    e: [{ u: 3.75, l: 4.2, bas: 1.05, haut: 2.35, type: "vide" }],
    s: [{ u: 2.2, l: 1.1, bas: 1.0, haut: 2.0, type: "fenetre", bris: 0.3 + 0.5 * u, volet: u > 0.5 ? "pendu" : "ouvert", couleurVolet: C.vertGuinguette }, { u: 6, l: 1.1, bas: 1.0, haut: 2.0, type: "fenetre", bris: 0.6, volet: "ouvert", couleurVolet: C.vertGuinguette }],
    o: [{ u: 3.75, l: 1.0, bas: 1.0, haut: 1.9, type: "fenetre", bris: 0.4 }],
  });
  // La cloison entre le bar et la réserve, avec son passage
  mur(c, [-33, 23.1], [-33, 30.4], { h: 2.8, ep: 0.1, couleur: 0xd8cfb4, mat: M.planches, batiment: b, ouvertures: [{ u: 5.88, l: 1.2, bas: 0, haut: 2.1, type: "porte" }] });
  // Les sols : carrelage du bar, planches de la réserve
  c.pave(-33, 0, 23.07, -29.07, 0.03, 30.43, 0xcfc6ae, M.planches, { crasse: false });
  c.pave(-36.93, 0, 23.07, -33, 0.03, 30.43, 0x9a8466, M.planches, { crasse: false });
  // Le toit de tôle rouge passé à deux pans, les pignons
  for (const [zA, zB] of [[22.5, 26.75], [31.0, 26.75]]) {
    for (let x = x1 - 0.4; x < x2 + 0.4 - 0.01; x += 0.62) planche(k, [x + 0.31, 2.75, zA], [x + 0.31, 3.95, zB], 0.64, 0.05, (Math.round((x - x1) / 0.62) % 2 ? C.rougePasse : 0x8a4c3e), M.tole, [1, 0, 0], { crasse: false, nuance: 0.05 });
  }
  for (const x of [x1, x2]) pignonX(k, M.planches, C.creme, x, 26.75, 7.5, 2.8, 1.12, 0.14);
  // Le store rayé au-dessus du comptoir, déchiré
  for (let i = 0; i < 8; i++) {
    if (hache(i, 61) < 0.25 * u) continue;
    planche(c, [-28.95, 2.5, 24.7 + i * 0.52], [-27.6, 2.05 - (hache(i, 62) < 0.3 * u ? 0.5 : 0), 24.7 + i * 0.52], 0.5, 0.02, i % 2 ? 0xe9dfc6 : 0xb5503f, M.toile, [0, 0, 1], { crasse: false });
  }
  // L'enseigne peinte, au-dessus du store
  c.boite(0.08, 0.9, 4.4, 0x4a3a2a, { x: -28.88, y: 3.05, z: 26.75 }, M.mat);
  panneau(c, R.lulu, { x: -28.82, y: 3.05, z: 26.75, ry: PI / 2 }, 4.2, 1.05);
  panneau(c, R.bal, { x: -28.9, y: 0.95, z: 29.6, ry: PI / 2 }, 0.75, 0.75);
  panneau(c, R.qr, { x: -28.9, y: 0.75, z: 24.4, ry: PI / 2 }, 0.25, 0.25);
  // Le comptoir, la tireuse, la caisse, la friteuse, le frigo, les étagères
  c.pave(-29.9, 0, 24.0, -29.15, 1.05, 29.6, C.vertGuinguette, M.planches);
  c.pave(-30.0, 1.05, 23.9, -28.9, 1.12, 29.7, 0x8a6a48, M.satin);
  c.boite(0.25, 0.4, 0.14, 0xb59048, { x: -29.6, y: 1.32, z: 25.2 }, M.metal);
  c.boite(0.4, 0.3, 0.35, 0x3a3a38, { x: -29.6, y: 1.27, z: 28.6 }, M.satin);
  c.boite(0.3, 0.16, 0.3, 0x2f6f73, { x: -29.6, y: 1.2, z: 27.4 }, M.lisse); // le terminal sans contact
  c.repere({ x: -31.2, y: 0, z: 30.0 }, () => {
    c.boite(1.2, 0.9, 0.6, 0xb8bcbc, { y: 0.45 }, M.metal);
    c.boite(0.5, 0.06, 0.4, 0xc79a3b, { x: -0.25, y: 0.86 }, M.lisse); // l'huile figée de la friteuse
    c.boite(0.4, 0.15, 0.3, 0x8a8f90, { x: 0.3, y: 0.95 }, M.metal);
  });
  c.repere({ x: -32.5, y: 0, z: 23.6 }, () => {
    c.boite(0.8, 1.85, 0.7, 0xd9d4c8, { y: 0.93 }, M.satin);
    c.boite(0.05, 0.6, 0.05, 0x8a8f90, { x: 0.3, y: 1.2, z: 0.36 }, M.metal);
  });
  for (const y of [1.4, 1.9]) c.boite(0.25, 0.04, 2.2, 0x8a6a48, { x: -32.85, y, z: 26.6 }, M.planches);
  for (let i = 0; i < 9; i++) {
    if (hache(i, 70) < 0.35 * u) continue;
    cylindre(c, M.verre, [0x4a6a4a, 0x7a4a2a, 0x9aa8a0][i % 3], -32.85, i < 5 ? 1.42 : 1.92, 25.7 + (i % 5) * 0.42, 0.04, 0.045, 0.3, 6);
  }
  panneau(c, R.watty, { x: -32.94, y: 1.6, z: 24.2, ry: PI / 2 }, 0.7, 0.7);
  panneau(c, R.menu, { x: -29.98 + 0.9, y: 2.05, z: 30.36, ry: PI }, 0.9, 0.56);
  // La réserve : casiers de limonade, fûts, chaises empilées
  for (let i = 0; i < 6; i++) caisse(c, -36.4 + (i % 3) * 0.55, Math.floor(i / 3) * 0.35, 29.8, 0.5, 0, i % 2 ? 0x9a7a52 : 0x6f8b76);
  tonneau(c, -35.0, 0, 29.8, 0x7a5a3c);
  tonneau(c, -34.2, 0, 29.7, 0x8a6a48);
  tonneau(c, -36.2, 0, 24.2, 0x7a5a3c, true);
  chaisePliante(c, -34.2, 24.1, 0, false, C.vertGuinguette);
  for (let i = 0; i < 3; i++) c.boite(0.45, 0.03, 0.42, C.vertGuinguette, { x: -35.5, y: 0.45 + i * 0.08, z: 24.5, ry: i * 0.1 }, M.tole);
  c.boite(0.4, 0.5, 0.3, 0xe0d8c0, { x: -36.5, y: 0.25, z: 26 }, M.toile);
  c.boite(0.4, 0.5, 0.3, 0xe0d8c0, { x: -36.5, y: 0.25, z: 26.5 }, M.toile);
  debris(c, -36.8, 23.3, -29.3, 30.2, 12 + 20 * u);
  // La piste de danse : planches, plinthe, poteaux de la guirlande
  const [p1, q1, p2, q2] = [-26, 13.5, -16, 23.5];
  c.pave(p1, 0, q1, p2, 0.05, q2, 0xa08a6a, M.planches, { crasse: false });
  for (let x = p1 + 0.5; x < p2; x += 1.3) {
    if (hache(Math.round(x * 3), 81) > 0.32 * u) continue;
    c.pave(x, 0.045, q1 + 1 + hache(Math.round(x), 82) * 6, x + 0.16, 0.052, q1 + 3 + hache(Math.round(x), 83) * 6, 0x3a2e24, M.mat, { crasse: false });
  }
  for (const [ax, az, bx, bz] of [[p1, q1, p2, q1], [p1, q2, p2, q2], [p1, q1, p1, q2], [p2, q1, p2, q2]]) boiteEntre(c, ax, az, bx, bz, 0, 0.12, 0.12, 0x6a5440, M.mat);
  jonchee(c, p1, q1, p2, q2, 40 + 50 * u, undefined, 0.06);
  const poteaux = [[p1, q1], [-21, q1], [p2, q1], [p2, 18.5], [p2, q2], [-21, q2], [p1, q2], [p1, 18.5], [-28.6, 22.4], [-28.6, 14]];
  for (const [x, z] of poteaux) {
    c.tube([x, 0, z], [x, 3.2, z], 0.06, C.boisGris, M.mat, 5);
    b.obstacle(x - 0.1, z, x + 0.1, z, "poteau");
  }
  // La guirlande : des fils qui pendent d'un poteau à l'autre, des ampoules de couleur
  const COULEURS = [0xff5a5a, 0xffd25a, 0x7fe07f, 0x6fb0ff, 0xff7fd0, 0xffa040];
  const fils = [[0, 2], [6, 4], [0, 6], [2, 4], [0, 4], [2, 6], [1, 5], [7, 3], [8, 4], [9, 0], [8, 9]];
  let n = 0;
  for (const [i, j] of fils) {
    const [ax, az] = poteaux[i];
    const [bx, bz] = poteaux[j];
    const L = Math.hypot(bx - ax, bz - az);
    const pts = pointsCable([ax, 3.1, az], [bx, 3.1, bz], 0.5, Math.max(4, Math.round(L / 0.7)));
    cable(c, M.mat, 0x2b2b29, [ax, 3.1, az], [bx, 3.1, bz], 0.5, 0.012, 6);
    for (let q = 1; q < pts.length - 1; q++) {
      const casse = hache(n, 91) < 0.15 * u;
      const [x, y, z] = pts[q];
      c.poser(OCTA, casse ? M.lisse : M.guirlande, casse ? 0x4a4a46 : COULEURS[n % COULEURS.length], { x, y: y - 0.1, z, e: [0.07, 0.1, 0.07] }, { crasse: false, nuance: 0 });
      n++;
    }
  }
  lum.push(() => {
    b.lumiere(-21, 2.6, 15.6, 0xff6fa8, 4, 9, "guirlande de la guinguette (batterie solaire, intermittente)");
    b.lumiere(-21, 2.6, 21.6, 0x7fc0ff, 4, 9, "guirlande de la guinguette (batterie solaire, intermittente)");
    b.lumiere(-27.2, 2.6, 18.5, 0xffd25a, 4, 9, "guirlande de la guinguette (batterie solaire, intermittente)");
  });
  // Le petit panneau solaire et sa batterie, au pied du poteau du bar
  c.tube([-27.8, 0, 21.2], [-27.8, 2.4, 21.2], 0.05, C.acier, M.tole, 5);
  c.boite(0.9, 0.04, 0.6, 0x1f3550, { x: -27.8, y: 2.45, z: 21.2, rx: 0.5 }, M.lisse);
  c.boite(0.35, 0.3, 0.25, 0x3a3a38, { x: -27.8, y: 0.15, z: 21.5 }, M.satin);
  // Le kiosque à musique : estrade, poteaux, toile, l'accordéon abandonné
  const [kx1, kz1, kx2, kz2] = [-26, 25, -22.6, 28.4];
  c.pave(kx1, 0, kz1, kx2, 0.4, kz2, 0x8a7458, M.planches);
  for (const [x, z] of [[kx1, kz1], [kx2, kz1], [kx1, kz2], [kx2, kz2]]) c.boite(0.1, 2.6, 0.1, 0xe9e3d2, { x, y: 1.7, z }, M.satin);
  for (const [ax, az, bx, bz] of [[kx1, kz1, kx2, kz1], [kx2, kz1, kx2, kz2], [kx1, kz1, kx1, kz2]]) {
    boiteEntre(c, ax, az, bx, bz, 0.4, 0.05, 0.05, 0xe9e3d2, M.satin);
    boiteEntre(c, ax, az, bx, bz, 1.25, 0.05, 0.05, 0xe9e3d2, M.satin);
  }
  c.poser(new THREE.ConeGeometry(2.7, 0.9, 8), M.toile, 0xb5503f, { x: -24.3, y: 3.2, z: 26.7, ry: PI / 8 }, { crasse: false });
  c.poser(new THREE.ConeGeometry(0.9, 0.5, 8), M.toile, 0xe9dfc6, { x: -24.3, y: 3.75, z: 26.7, ry: PI / 8 }, { crasse: false });
  c.boite(0.45, 0.3, 0.3, 0x7a2630, { x: -24.6, y: 0.55, z: 26.4, rz: 0.4 }, M.satin);
  for (const x of [-25.2, -23.4]) {
    c.tube([x, 0.4, 27.6], [x, 1.5, 27.6], 0.015, 0x3a3a38, M.metal, 3);
    c.boite(0.4, 0.3, 0.02, 0x3a3a38, { x, y: 1.55, z: 27.6, rx: -0.3 }, M.metal);
  }
  b.obstacle(kx1, kz1, kx2, kz1, "estrade du kiosque");
  b.obstacle(kx2, kz1, kx2, kz2, "estrade du kiosque");
  b.obstacle(kx1, kz1, kx1, kz2, "estrade du kiosque");
  // Les tables de bistrot et les chaises sous les platanes ; l'ardoise sur son chevalet
  const A = aleatoire(77);
  for (let i = 0; i < 7; i++) {
    const x = -39.5 + (i % 4) * 3.2 + A() * 0.6;
    const z = 13.2 + Math.floor(i / 4) * 4 + A() * 0.8;
    const renversee = A() < 0.2 * u;
    tableBistrot(c, x, z, C.vertGuinguette, renversee);
    for (let j = 0; j < 2; j++) chaisePliante(c, x + (j ? 0.65 : -0.65), z + A() * 0.3, j ? -PI / 2 + A() : PI / 2 - A(), A() < 0.3 * u, C.vertGuinguette);
  }
  c.repere({ x: -27.2, y: 0, z: 12.6, ry: 0.4 }, () => {
    for (const dx of [-0.35, 0.35]) c.boite(0.05, 1.5, 0.05, 0x6a5440, { x: dx, y: 0.72, z: 0.1, rx: -0.12 }, M.mat);
    c.boite(0.05, 1.5, 0.05, 0x6a5440, { y: 0.72, z: -0.25, rx: 0.3 }, M.mat);
    panneau(c, R.ardoise, { y: 1.05, z: 0.18, rx: -0.12 }, 0.95, 0.48);
  });
  // Les barques de location retournées sur leurs tréteaux, au bord de l'eau ; une coulée
  const tons = [0x5a7f9a, 0x6f8b76, 0xd9cfb2, 0xa8574a];
  for (let i = 0; i < 4; i++) {
    const z = 14.6 + i * 3.1;
    const x = -11.8 + (i % 2) * 0.4;
    if (i !== 2) for (const dz of [-1.0, 1.0]) c.boite(1.1, 0.5, 0.08, 0x6a5a48, { x, y: 0.25, z: z + dz }, M.mat);
    barque(c, x, i === 2 ? 0.5 : 1.0, z, PI / 2 + (hache(i, 5) - 0.5) * 0.2, tons[i], { retournee: true, rz: i === 2 ? 0.08 : 0 });
    b.obstacle(x - 0.7, z - 1.8, x - 0.7, z + 1.8, "barques retournées");
  }
  rame(c, [-13.4, 0.05, 16.5], [-12.2, 0.08, 19.2]);
  barque(c, -5.6, Y_AVAL - 0.45, 26.2, 0.4, 0x5a7f9a, { rx: 0.25, rz: -0.3 });
  // Le ponton d'embarquement
  c.pave(-9, -0.12, 22.6, -3.6, 0, 24.2, 0x8a7a62, M.planches, { nuance: 0.04 });
  for (const x of [-8.6, -6.2, -3.8]) for (const z of [22.7, 24.1]) c.tube([x, -2.6, z], [x, 0.45, z], 0.1, 0x5a4a3a, M.mat, 6);
  b.obstacle(-9, 22.6, -3.6, 22.6, "bord du ponton");
  b.obstacle(-9, 24.2, -3.6, 24.2, "bord du ponton");
  b.obstacle(-3.6, 22.6, -3.6, 24.2, "bout du ponton");
  // Les galets peints qui bordaient l'allée, les lampions tombés
  for (let i = 0; i < 14; i++) rocher(c, -27.5 + i * 0.85, 12.6 - (i % 2) * 0.1, 0.16, -0.02, i % 3 ? 0xe9e3d2 : 0xb5503f);
  for (let i = 0; i < 5; i++) c.poser(BOULE, M.toile, [0xc8362b, 0xe8b04a, 0x2f6f73][i % 3], { x: -24 + i * 1.7, y: 0.18, z: 14.5 + (i % 3) * 3, e: [0.2, 0.18, 0.2] }, { crasse: false });
  semer(ctx, -42, 11, -27, 22, 30);
}

// ---------- La passerelle piétonne effondrée ----------

function passerelle(ctx) {
  const { c, M, u } = ctx;
  const Z = 31.2;
  const ici = (x) => ctx.ici(x);
  // Les deux pylônes en A, rivetés ; celui de l'est est plié vers la rivière
  for (const [x, plie] of [[-10.2, 0], [15.4, -0.35]]) {
    if (!ici(x)) continue;
    for (const sz of [-1, 1]) {
      c.poutre([x, 0, Z + sz * 1.1], [x + Math.sin(plie) * 4.6, 4.6 * Math.cos(plie), Z + sz * 0.3], 0.16, 0x4f6a6a, M.tole);
    }
    c.boite(0.25, 0.25, 0.9, 0x4f6a6a, { x: x + Math.sin(plie) * 4.6, y: 4.6 * Math.cos(plie), z: Z, rz: -plie }, M.tole);
    c.pave(x - 0.6, -0.4, Z - 1.5, x + 0.6, 0.15, Z + 1.5, C.beton, M.mat);
  }
  // Le câble rompu : il pend du pylône ouest dans la rivière
  for (const sz of [-1, 1]) {
    cable(c, M.metal, 0x3e4244, [-10.2, 4.6, Z + sz * 0.3], [-1, Y_AVAL - 0.3, Z + sz * 0.9], -0.6, 0.04, 8, ici);
    cable(c, M.metal, 0x3e4244, [15.4 - 1.6, 4.3, Z + sz * 0.3], [9, Y_AVAL - 0.2, Z + sz * 0.8], -0.4, 0.04, 6, ici);
  }
  // Le tablier ouest plonge dans l'eau ; l'est est couché sur la berge, dans le courant
  const tablier = (a, bb) => {
    const xm = (a[0] + bb[0]) / 2;
    if (!ici(xm)) return;
    planche(c, a, bb, 1.6, 0.06, 0x8a7a62, M.planches, [0, 0, 1]);
    for (const sz of [-1, 1]) {
      const d = [bb[0] - a[0], bb[1] - a[1], bb[2] - a[2]];
      const o = (p) => [p[0], p[1] + 1.0, p[2] + sz * 0.8];
      planche(c, o(a), o(bb), 0.05, 0.05, 0x4f6a6a, M.tole, [0, 0, 1]);
      const L = Math.hypot(...d);
      for (let t = 0; t <= 1.001; t += 0.6 / L) {
        const p = [a[0] + d[0] * t, a[1] + d[1] * t, a[2] + d[2] * t + sz * 0.8];
        c.boite(0.04, 1.0, 0.04, 0x4f6a6a, { x: p[0], y: p[1] + 0.5, z: p[2] }, M.tole, { crasse: false });
      }
    }
  };
  tablier([-10.2, 0.05, Z], [-6.0, -0.9, Z + 0.2]);
  tablier([-6.0, -0.9, Z + 0.2], [-2.2, Y_AVAL - 0.6, Z + 0.6]);
  tablier([4.5, Y_AVAL - 0.4, Z - 0.4], [9.2, Y_AVAL + 0.1, Z - 0.1]);
  tablier([9.2, Y_AVAL + 0.1, Z - 0.1], [14.8, 0.02, Z]);
  if (ici(-1)) plaque(ctx, M.ecume, -2.0, Z + 1.6, 2.4, 1.6, Y_AVAL + 0.03, 0, 0xffffff, 2);
  if (ici(4)) plaque(ctx, M.ecume, 4.6, Z + 0.8, 2, 1.2, Y_AVAL + 0.03, 0.3, 0xffffff, 2);
  // Baignade interdite
  if (ici(-11.4)) {
    c.boite(0.08, 2.1, 0.08, C.acier, { x: -11.4, y: 1.05, z: 28.4 }, M.tole);
    panneau(c, R.baignade, { x: -11.38, y: 1.65, z: 28.45, ry: 0.5 }, 0.9, 0.6);
  }
}

// ---------- Kayak+ ----------

function kayaks(ctx) {
  const { c, b, M, u } = ctx;
  if (!ctx.ici(19.5)) return;
  const [x0, z0] = [19.5, -17.2];
  // Le râtelier à deux étages
  for (const dx of [-2, -0.7, 0.7, 2]) {
    c.boite(0.08, 1.5, 0.08, 0x8a8f90, { x: x0 + dx, y: 0.75, z: z0 - 0.7 }, M.metal);
    c.boite(0.08, 1.5, 0.08, 0x8a8f90, { x: x0 + dx, y: 0.75, z: z0 + 0.7 }, M.metal);
    for (const y of [0.55, 1.2]) c.boite(0.06, 0.06, 1.5, 0x8a8f90, { x: x0 + dx, y, z: z0 }, M.metal);
  }
  const tons = [0xd0773a, 0xd8b03a, 0x2f8a8a, 0xd0773a, 0xa8574a];
  const KAYAK = new THREE.SphereGeometry(1, 7, 3);
  for (let i = 0; i < 5; i++) {
    if (i === 4 && u > 0.5) continue;
    const y = i < 3 ? 0.68 : 1.33;
    const z = z0 - 0.45 + (i % 3) * 0.45;
    c.poser(KAYAK, M.satin, tons[i], { x: x0, y, z, e: [2.3, 0.16, 0.3], rx: (hache(i, 4) - 0.5) * 0.2 }, { nuance: 0.05 });
  }
  c.poser(KAYAK, M.satin, 0xd8b03a, { x: x0 + 0.4, y: 0.16, z: z0 + 1.6, ry: 0.3, rz: 0.1, e: [2.3, 0.16, 0.3] }, { nuance: 0.05 });
  KAYAK.dispose();
  // Le câble antivol qui les tient tous, cadenassé à la borne
  c.tube([x0 - 2.1, 0.75, z0 + 0.1], [x0 + 2.4, 0.75, z0 + 0.2], 0.02, 0x2b2b29, M.metal, 3, { crasse: false });
  c.tube([x0 + 2.4, 0.75, z0 + 0.2], [x0 + 3.2, 0.9, z0 + 1.6], 0.02, 0x2b2b29, M.metal, 3, { crasse: false });
  c.boite(0.1, 0.12, 0.06, 0xb59048, { x: x0 + 3.2, y: 0.88, z: z0 + 1.66 }, M.metal);
  // La borne morte et son totem
  c.repere({ x: x0 + 3.3, y: 0, z: z0 + 1.9, ry: 0.4 }, () => {
    c.boite(0.5, 1.4, 0.3, 0xe9e3d2, { y: 0.7 }, M.satin);
    panneau(c, R.stationMorte, { y: 1.05, z: 0.155 }, 0.4, 0.27);
    c.boite(0.6, 2.4, 0.1, 0x2f6f73, { x: -0.7, y: 1.2 }, M.satin);
    panneau(c, R.kayak, { x: -0.7, y: 2.05, z: 0.055 }, 0.58, 0.29);
  });
  // Les pagaies et les gilets jetés
  for (let i = 0; i < 3; i++) c.tube([x0 - 2.6 + i * 0.3, 0.05, z0 - 1.6], [x0 - 2.5 + i * 0.4, 1.6, z0 - 1.0], 0.025, 0xd8d4c8, M.satin, 4);
  c.boite(0.5, 0.12, 0.45, 0xd8603a, { x: x0 - 1.2, y: 0.06, z: z0 + 1.4, ry: 0.5 }, M.toile);
  b.obstacle(x0 - 2.1, z0 - 0.7, x0 + 2.1, z0 - 0.7, "râtelier à kayaks");
  b.obstacle(x0 - 2.1, z0 + 0.7, x0 + 2.1, z0 + 0.7, "râtelier à kayaks");
}

// ---------- Le lavoir couvert ----------

function lavoir(ctx) {
  const { c, b, M, u } = ctx;
  if (!ctx.ici(28)) return;
  const [x1, z1, x2, z2] = [24, -30, 32, -23.6];
  const k = b.couche("lavoir", { x: 28, z: -26.8, l: 9.4, p: 8 }, 2.0, 4.4);
  // Trois murs de pierre, ouvert au sud sur deux poteaux de bois
  const spec = { h: 2.3, ep: 0.5, couleur: C.pierre, mat: M.pierre, batiment: b };
  mur(c, [x2, z1], [x1, z1], spec);
  mur(c, [x1, z1], [x1, z2], { ...spec, breches: u > 0.6 ? [{ u: 4.8, l: 1.6, profondeur: 1.0 }] : [] });
  mur(c, [x2, z2], [x2, z1], { ...spec, ouvertures: [{ u: 1.6, l: 1.0, bas: 0, haut: 2.0, type: "vide" }] });
  for (const x of [x1 + 0.25, 28, x2 - 0.25]) c.boite(0.22, 2.3, 0.22, 0x7a6450, { x, y: 1.15, z: z2 - 0.1 }, M.mat);
  c.boite(8.4, 0.25, 0.25, 0x6a5440, { x: 28, y: 2.38, z: z2 - 0.1 }, M.mat);
  // Le toit de tuiles à deux pans (faîtage est-ouest), ses chevrons sous les trous
  for (const [zA, zB] of [[z1 - 0.5, -26.8], [z2 + 0.6, -26.8]]) {
    for (let x = x1 - 0.4; x < x2 + 0.4 - 0.01; x += 0.9) {
      const xm = x + 0.45;
      if (u > 0.5 && zA > -26 && xm > 26.4 && xm < 28.4) {
        planche(k, [xm, 2.45, zA], [xm, 3.6, zB], 0.1, 0.1, 0x5a4130, M.mat, [1, 0, 0]);
        continue;
      }
      planche(k, [xm, 2.4, zA], [xm, 3.65, zB], 0.92, 0.08, Math.round(x) % 2 ? 0xa8644a : 0x9a5a44, M.tuiles, [1, 0, 0], { crasse: false, nuance: 0.05 });
    }
  }
  k.boite(9.0, 0.16, 0.26, 0x8a4c3e, { x: 28, y: 3.68, z: -26.8 }, M.tuiles, { crasse: false });
  for (const x of [x1, x2]) pignonX(k, M.pierre, C.pierre, x, -26.8, 6.4, 2.3, 1.25, 0.5);
  // Le bassin : margelle, battoirs inclinés, eau verte et immobile
  const [bx1, bz1, bx2, bz2] = [25.4, -27.8, 30.6, -25.0];
  for (const [ax, az, cx, cz] of [[bx1, bz1, bx2, bz1], [bx1, bz2, bx2, bz2], [bx1, bz1, bx1, bz2], [bx2, bz1, bx2, bz2]]) {
    boiteEntre(c, ax, az, cx, cz, 0, 0.42, 0.36, 0xb7aa8c, M.pierre, { nuance: 0.03 }, 0.36);
    b.obstacle(ax, az, cx, cz, "margelle du lavoir");
  }
  for (let i = 0; i < 6; i++) {
    const x = bx1 + 0.6 + i * 0.86;
    c.boite(0.78, 0.08, 0.6, 0xc9bca0, { x, y: 0.42, z: bz2 + 0.05, rx: -0.35 }, M.pierre, { crasse: false });
  }
  c.pave(bx1 + 0.18, 0.05, bz1 + 0.18, bx2 - 0.18, 0.06, bz2 - 0.18, 0x3a4a3a, M.mat, { crasse: false });
  quad(c, M.eau, [[bx1 + 0.18, 0.33, bz1 + 0.18], [bx1 + 0.18, 0.33, bz2 - 0.18], [bx2 - 0.18, 0.33, bz2 - 0.18], [bx2 - 0.18, 0.33, bz1 + 0.18]], [[0, 0], [0, 1], [2, 1], [2, 0]], 0x6f8a62);
  mousse(c, 27, 0.34, -26.6, 0.9, 5, 0x5f7a3a);
  // La source : une tête de pierre et son filet d'eau
  c.boite(0.7, 0.9, 0.3, 0xb7aa8c, { x: 28, y: 1.0, z: z1 + 0.4 }, M.pierre);
  c.tube([28, 0.95, z1 + 0.55], [28, 0.95, z1 + 0.9], 0.04, 0x5a6a5a, M.metal, 5);
  lame(c, M.eau, [27.94, z1 + 0.9], [28.06, z1 + 0.9], 0.95, 0.33, [0, 0.15], 0xe0ece6, 0.5);
  c.pave(27.6, 0, z1 + 0.5, 28.4, 0.35, bz1, 0xb7aa8c, M.pierre); // la rigole d'arrivée
  // La rigole de trop-plein qui file à la rivière
  for (let x = 24.4; x > 13.2; x -= 1) c.pave(x - 1, -0.2, -24.9, x, 0.06, -24.3, 0x9e978a, M.pierre, { crasse: false, nuance: 0.04 });
  quad(c, M.eau, [[13.2, 0.05, -24.8], [13.2, 0.05, -24.4], [25.4, 0.05, -24.4], [25.4, 0.05, -24.8]], [[13.2, 0], [13.2, 0.2], [25.4, 0.2], [25.4, 0]], 0x9fb4a8);
  // Le linge oublié, les battoirs de bois, le seau
  for (const x of [32.6, 36.2]) c.tube([x, 0, -22.4], [x, 1.9, -22.4], 0.04, C.boisGris, M.mat, 4);
  for (let i = 0; i < 3; i++) {
    if (hache(i, 51) < 0.3 * u) continue;
    c.boite(0.9, 1.2 - i * 0.15, 0.02, [0xe0dccb, 0xc9b8a0, 0xb8c4c8][i], { x: 33.2 + i * 1.05, y: 1.25 - (0.6 - i * 0.07), z: -22.4, rz: (hache(i, 52) - 0.5) * 0.2 }, M.toile, { crasse: false });
  }
  c.tube([32.6, 1.85, -22.4], [36.2, 1.85, -22.4], 0.01, 0xb9a679, M.mat, 3, { crasse: false });
  for (let i = 0; i < 3; i++) c.boite(0.22, 0.04, 0.45, 0x9a7a55, { x: 26 + i * 1.5, y: 0.52, z: bz2 + 0.1, rx: -0.4, ry: 0.2 * i }, M.planches);
  cylindre(c, M.tole, 0x8a9092, 31.2, 0, -24.4, 0.18, 0.15, 0.32, 8);
  panneau(c, R.lavoir, { x: x2 + 0.26, y: 1.5, z: -27.6, ry: PI / 2 }, 1.6, 0.4);
  lierre(c, x2 + 0.26, 0, -28.8, PI / 2, 2.2, 2.0, 30 + 40 * u);
  semer(ctx, 23, -24, 34, -21, 10);
}

// ---------- Le camping-car embourbé ----------

function campingCar(ctx) {
  const { c, b, M, u, lum } = ctx;
  if (!ctx.ici(20.8)) return;
  const [cx, cz] = [20.8, 14.0];
  const L = 7.2;
  const P = 2.35;
  const H = 3.0;
  const k = b.couche("camping-car", { x: cx, z: cz + 1, l: 8, p: 5 }, 1.05, 3.4);
  const BLANC = 0xe3ddcf;
  const coupe = 1.05;
  // Le sol de la caisse au ras de la vase (les roues sont enlisées jusqu'aux moyeux)
  const pose = { x: cx, y: 0, z: cz, rz: 0.03 };
  c.repere(pose, () => k.repere(pose, () => {
    const x1 = -L / 2 + 1.6; // l'arrière de la cabine
    const x2 = L / 2;
    const z1 = -P / 2;
    const z2 = P / 2;
    c.pave(x1, 0, z1, x2, 0.08, z2, 0x8a8478, M.satin, { crasse: false });
    // La caisse : parois en morceaux (fenêtres, porte), le bas dans le principal, le haut dans la couche
    const paroi = (ch, ax, az, bx, bz, y1, y2, ouv = []) => {
      // Une paroi le long de x (az = bz) ou de z (ax = bx), découpée autour des ouvertures [u1, u2, bas, haut]
      const long = ax !== bx;
      const lg = long ? bx - ax : bz - az;
      const coupes = [0, ...ouv.flatMap((o) => [o[0], o[1]]), lg].sort((p, q) => p - q);
      for (let i = 0; i < coupes.length - 1; i++) {
        const u1 = coupes[i];
        const u2 = coupes[i + 1];
        const o = ouv.find((q) => q[0] <= u1 + 1e-6 && q[1] >= u2 - 1e-6);
        const tranches = o ? [[y1, Math.max(y1, Math.min(y2, o[2]))], [Math.min(y2, Math.max(y1, o[3])), y2]] : [[y1, y2]];
        for (const [ya, yb] of tranches) {
          if (yb - ya < 0.02) continue;
          if (long) ch.pave(ax + u1, ya, az - 0.04, ax + u2, yb, az + 0.04, BLANC, M.satin, { nuance: 0.02 });
          else ch.pave(ax - 0.04, ya, az + u1, ax + 0.04, yb, az + u2, BLANC, M.satin, { nuance: 0.02 });
        }
        if (o && o[4] && ch === k) {
          // Le vitrage teinté (une vitre sur deux a éclaté)
          if (hache(Math.round(u1 * 10), 13) > 0.4 * u) {
            if (long) ch.pave(ax + u1, Math.max(y1, o[2]), az - 0.01, ax + u2, Math.min(y2, o[3]), az + 0.01, 0x3a4a50, M.verre, { crasse: false });
            else ch.pave(ax - 0.01, Math.max(y1, o[2]), az + u1, ax + 0.01, Math.min(y2, o[3]), az + u2, 0x3a4a50, M.verre, { crasse: false });
          }
        }
      }
    };
    const ouvSud = [[0.4, 1.2, 0, 2.05, false], [2.0, 3.2, 1.25, 1.95, true], [4.0, 5.2, 1.25, 1.95, true]];
    const ouvNord = [[0.5, 1.7, 1.25, 1.95, true], [3.4, 4.6, 1.25, 1.95, true]];
    // Sud (face caméra) : porte et deux baies
    paroi(c, x1, z2, x2, z2, 0, coupe, ouvSud);
    paroi(k, x1, z2, x2, z2, coupe, H, ouvSud);
    paroi(c, x1, z1, x2, z1, 0, H, ouvNord);
    paroi(c, x2, z1, x2, z2, 0, coupe, [[0.7, 1.65, 1.3, 1.9, true]]);
    paroi(k, x2, z1, x2, z2, coupe, H, [[0.7, 1.65, 1.3, 1.9, true]]);
    k.pave(x1 - 0.1, H, z1 - 0.06, x2 + 0.05, H + 0.1, z2 + 0.06, BLANC, M.satin, { crasse: false });
    k.pave(x2 - 1.4, H + 0.1, -0.4, x2 - 0.6, H + 0.25, 0.4, 0xd9d4c8, M.satin); // le lanterneau
    k.pave(x1 + 0.6, H + 0.1, -0.7, x1 + 1.8, H + 0.14, 0.7, 0x1f3550, M.lisse); // le petit panneau solaire
    // La frise « Liberté Totale » sur le flanc sud, la soute arrière
    panneau(c, R.liberte, { x: (x1 + x2) / 2 + 0.6, y: 0.75, z: z2 + 0.05 }, 3.6, 0.45);
    // La cabine : capot plongeant vers la rivière, pare-brise, capucine au-dessus
    const xc = -L / 2;
    c.pave(xc, 0, z1 + 0.05, xc + 0.9, 1.05, z2 - 0.05, BLANC, M.satin);
    c.pave(xc + 0.9, 0, z1, x1, coupe, z2, BLANC, M.satin);
    k.pave(xc + 0.9, coupe, z1, x1, 2.15, z1 + 0.06, BLANC, M.satin);
    k.pave(xc + 0.9, coupe, z2 - 0.06, x1, 2.15, z2, BLANC, M.satin);
    k.boite(0.08, 1.0, P - 0.1, 0x2c3a40, { x: xc + 0.95, y: 1.6, rz: -0.35 }, M.verre, { crasse: false });
    k.pave(xc + 0.55, 2.15, z1, x1 + 0.3, H, z2, BLANC, M.satin);
    c.pave(xc - 0.05, 0.25, z1 + 0.2, xc + 0.02, 0.55, z2 - 0.2, 0x8a8f90, M.metal);
    for (const sz of [-0.8, 0.8]) c.boite(0.04, 0.16, 0.3, 0xe8e6df, { x: xc - 0.01, y: 0.75, z: sz }, M.lisse, { crasse: false });
    // Les roues enlisées : on ne voit plus que le haut des pneus
    for (const [px, pz] of [[xc + 0.8, z1 - 0.02], [xc + 0.8, z2 + 0.02], [x2 - 1.3, z1 - 0.02], [x2 - 1.3, z2 + 0.02]]) {
      c.poser(geoCyl(0.38, 0.38, 0.24, 8), M.mat, 0x2a2a2a, { x: px, y: 0.02, z: pz, rx: PI / 2 }, { crasse: false });
    }
    // La boue qui remonte sur la carrosserie
    c.pave(xc - 0.06, 0, z1 - 0.06, x2 + 0.06, 0.35, z2 + 0.06, 0x5a4a3a, M.lisse, { crasse: false, nuance: 0.05 });
    // L'intérieur : dinette, kitchenette, lit, placard
    c.repere({ x: x1 + 0.9, y: 0.08 }, () => {
      c.boite(0.9, 0.05, 0.7, 0xb8a888, { y: 0.72, z: -0.6 }, M.satin);
      c.boite(0.06, 0.66, 0.06, 0x8a8f90, { y: 0.36, z: -0.6 }, M.metal);
      for (const dx of [-0.65, 0.65]) c.boite(0.45, 0.45, 0.8, 0x6a7a8a, { x: dx, y: 0.23, z: -0.68 }, M.toile);
    });
    c.pave(x1 + 2.6, 0.08, z1 + 0.06, x1 + 4.0, 0.95, z1 + 0.66, 0xd9d4c8, M.satin);
    c.boite(0.4, 0.03, 0.34, 0x8a8f90, { x: x1 + 3.0, y: 0.97, z: z1 + 0.36 }, M.metal);
    c.boite(0.4, 0.06, 0.34, 0x3a3a38, { x: x1 + 3.6, y: 0.98, z: z1 + 0.36 }, M.metal);
    c.pave(x2 - 1.4, 0.08, z1 + 0.06, x2 - 0.06, 0.6, z2 - 0.06, 0x8a8478, M.satin);
    c.pave(x2 - 1.38, 0.6, z1 + 0.1, x2 - 0.1, 0.75, z2 - 0.1, 0x7a8aa0, M.toile);
    c.boite(0.6, 0.12, 0.9, 0x9a5544, { x: x2 - 0.7, y: 0.8, z: 0.2, ry: 0.4 }, M.toile, { nuance: 0.06 });
    c.pave(x2 - 2.3, 0.08, z2 - 0.66, x2 - 1.5, 2.0, z2 - 0.06, 0xb8a888, M.satin);
    debris(c, x1 + 0.2, z1 + 0.2, x2 - 1.5, z2 - 0.2, 8 + 10 * u, [0xe0d8c0, 0x9a8a6a, 0x6a7a8a], 0.08);
  }));
  // Les parois de la caisse arrêtent le joueur (sauf la porte)
  const xA = cx - L / 2;
  const xB = cx + L / 2;
  b.obstacle(xA, cz - P / 2, xB, cz - P / 2, "paroi du camping-car");
  b.obstacle(xB, cz - P / 2, xB, cz + P / 2, "paroi du camping-car");
  b.obstacle(xA, cz - P / 2, xA, cz + P / 2, "cabine du camping-car");
  b.obstacle(xA, cz + P / 2, xA + 1.6 + 0.4, cz + P / 2, "paroi du camping-car");
  b.obstacle(xA + 1.6 + 1.2, cz + P / 2, xB, cz + P / 2, "paroi du camping-car");
  // L'auvent déchiré, dans la couche (il couvre le coin repas)
  k.pave(cx - 1.4, 2.62, cz + P / 2, cx + 2.6, 2.7, cz + P / 2 + 0.12, 0x8a8f90, M.metal);
  for (let i = 0; i < 7; i++) {
    if (hache(i, 41) < 0.3 * u) continue;
    planche(k, [cx - 1.3 + i * 0.57, 2.62, cz + P / 2 + 0.1], [cx - 1.3 + i * 0.57, 2.25 - (hache(i, 42) < 0.4 * u ? 0.6 : 0), cz + P / 2 + 2.2], 0.55, 0.02, i % 2 ? 0xd8c48a : 0x5a7f8a, M.toile, [1, 0, 0]);
  }
  for (const x of [cx - 1.3, cx + 2.5]) c.tube([x, 0, cz + P / 2 + 2.2], [x, 2.25, cz + P / 2 + 2.2], 0.03, 0x8a8f90, M.metal, 4);
  // Le coin repas dehors : table pliante, chaises, barbecue, bouteille de gaz, lampe solaire
  c.boite(1.0, 0.04, 0.6, 0xd9d4c8, { x: cx + 0.8, y: 0.72, z: cz + P / 2 + 1.4 }, M.satin);
  for (const dx of [-0.42, 0.42]) c.boite(0.04, 0.7, 0.5, 0x8a8f90, { x: cx + 0.8 + dx, y: 0.36, z: cz + P / 2 + 1.4 }, M.metal);
  chaisePliante(c, cx - 0.2, cz + P / 2 + 1.5, PI / 2, false, 0x2f5f8a);
  chaisePliante(c, cx + 1.9, cz + P / 2 + 1.9, -PI / 2 + 0.3, u > 0.5, 0x2f5f8a);
  cylindre(c, M.metal, 0x2e2e2c, cx + 3.4, 0, cz + P / 2 + 0.9, 0.3, 0.22, 0.75, 8);
  cylindre(c, M.satin, 0x2f5f8a, cx + 3.2, 0, cz + P / 2 + 0.3, 0.15, 0.15, 0.5, 8);
  c.boite(0.12, 0.2, 0.12, 0xe9e3d2, { x: cx + 1.1, y: 0.84, z: cz + P / 2 + 1.5 }, M.satin);
  c.boite(0.1, 0.06, 0.1, 0xfff0c0, { x: cx + 1.1, y: 0.97, z: cz + P / 2 + 1.5 }, M.flammes, { crasse: false });
  lum.push(() => b.lumiere(cx + 1.1, 1.0, cz + P / 2 + 1.5, 0xfff0c0, 2.5, 5, "lampe solaire de camping, sur la table de l'auvent"));
  // La vase : des plaques luisantes, des traces de roues jusqu'à la berge
  const A = aleatoire(2025);
  for (let i = 0; i < 16; i++) {
    const x = 14.8 + A() * 11;
    const z = 9 + A() * 12;
    c.boite(1 + A() * 2.4, 0.02, 0.7 + A() * 1.6, A() < 0.5 ? 0x4a3c2e : 0x5c4b3a, { x, y: 0.012, z, ry: A() * 3 }, M.lisse, { crasse: false, nuance: 0.04 });
  }
  for (const dz of [-0.85, 0.85]) for (let x = 25; x < 35; x += 1.6) c.boite(1.4, 0.015, 0.4, 0x4f4234, { x, y: 0.02, z: cz + dz + (x - 25) * -0.9, ry: 0.72 }, M.lisse, { crasse: false });
}

// ---------- L'huilerie en ruine ----------

function huilerie(ctx) {
  const { c, b, M, u, lum } = ctx;
  if (!ctx.ici(-74)) return;
  const [x1, z1, x2, z2] = [-80, -24, -68, -14];
  const spec = { ep: 0.6, couleur: C.pierre, mat: M.pierre, batiment: b, arase: 0.4 };
  // Le nord et l'ouest tiennent debout (pignon ouest), le sud et l'est sont ruinés
  mur(c, [x2, z1], [x1, z1], { ...spec, h: 5.2, breches: [{ u: 3, l: 3, profondeur: 2.4 }, { u: 9.5, l: 2.4, profondeur: 1.4 }], ouvertures: [{ u: 7.4, l: 1.0, bas: 2.4, haut: 3.6, type: "vide" }] });
  mur(c, [x1, z1], [x1, z2], { ...spec, h: 5.2, ouvertures: [{ u: 3.2, l: 0.9, bas: 1.5, haut: 2.8, type: "vide" }] });
  pignonX(c, M.pierre, C.pierre, x1, -19, 10.4, 5.2, 2.6 - u * 1.4, 0.6);
  mur(c, [x1, z2], [x2, z2], { ...spec, h: 2.6, breches: [{ u: 8, l: 3.4, profondeur: 1.9 }, { u: 11.2, l: 1.4, profondeur: 1.2 }], ouvertures: [{ u: 4, l: 1.4, bas: 0, haut: 2.3, type: "porte" }, { u: 1.6, l: 1.0, bas: 1.0, haut: 2.2, type: "vide" }] });
  mur(c, [x2, z2], [x2, z1], { ...spec, h: 3.0, breches: [{ u: 4.4, l: 2.6, profondeur: 2.6 }] });
  // La cloison de la salle du pressoir
  mur(c, [-72, z1 + 0.3], [-72, z2 - 0.3], { ep: 0.45, couleur: 0xb9aa8a, mat: M.pierre, batiment: b, h: 3.2, arase: 0.5, ouvertures: [{ u: 5, l: 1.2, bas: 0, haut: 2.2, type: "vide" }], breches: [{ u: 1.5, l: 2, profondeur: 1.6 }] });
  // La plaque peinte au-dessus de la porte
  panneau(c, R.huilerie, { x: -76, y: 2.48, z: z2 + 0.31 }, 1.8, 0.42);
  // Le sol de dalles soulevées, la terre, les gravats ; les poutres du toit tombées
  c.pave(x1 + 0.3, 0, z1 + 0.3, x2 - 0.3, 0.02, z2 - 0.3, 0x9a8f78, M.pierre, { crasse: false });
  gravats(c, -69.5, -15.6, 1.4, 10 + 10 * u, [C.pierre, 0xb9aa8a, PALETTE.pierre]);
  gravats(c, -77.6, -23.2, 1.2, 8 + 8 * u, [C.pierre, 0xb9aa8a, PALETTE.pierre]);
  gravats(c, -68, -19, 1.6, 10, [C.pierre, 0xb9aa8a]);
  debris(c, x1 + 0.5, z1 + 0.5, x2 - 0.5, z2 - 0.5, 20 + 25 * u, [C.pierre, 0xb9aa8a, 0x8a6a48]);
  jonchee(c, x1 + 0.5, z1 + 0.5, x2 - 0.5, z2 - 0.5, 50);
  planche(c, [-79.5, 4.6, -23.5], [-75, 0.1, -21.5], 0.25, 0.25, 0x5a4130, M.mat, [0, 0, 1]);
  planche(c, [-71, 2.9, -23.6], [-73.5, 0.15, -15.5], 0.22, 0.22, 0x5a4130, M.mat, [1, 0, 0]);
  c.boite(5.5, 0.22, 0.22, 0x4a3a2a, { x: -75, y: 0.12, z: -15.2, ry: 0.15 }, M.mat);
  // La meule debout dans sa cuve de pierre, son arbre et son manège
  const [mx, mz] = [-76.6, -19.6];
  cylindre(c, M.pierre, 0xb7aa8c, mx, 0, mz, 1.8, 1.85, 0.7, 14);
  cylindre(c, M.pierre, 0x8f8574, mx, 0.7, mz, 1.5, 1.5, 0.02, 14);
  cylindre(c, M.mat, 0x4a3a2a, mx, 0.2, mz, 0.12, 0.14, 2.6, 6);
  c.poser(geoCyl(0.85, 0.85, 0.42, 14), M.pierre, 0xcfc4a8, { x: mx + 0.75, y: 1.55, z: mz, rx: PI / 2, ry: 0.2 }, { nuance: 0.03 });
  c.tube([mx, 1.55, mz], [mx + 2.7, 1.5, mz + 0.5], 0.08, 0x5a4130, M.mat, 5);
  c.tube([mx, 2.6, mz], [mx - 0.4, 3.6, mz + 2], 0.07, 0x5a4130, M.mat, 5);
  // La salle du pressoir : maie de pierre, jumelles, vis, scourtins, jarres
  c.repere({ x: -70, y: 0, z: -19.5 }, () => {
    c.pave(-1.1, 0, -1.1, 1.1, 0.55, 1.1, 0xb7aa8c, M.pierre);
    c.boite(0.25, 0.1, 0.4, 0xb7aa8c, { x: 1.2, y: 0.45 }, M.pierre);
    for (const dz of [-0.9, 0.9]) c.boite(0.35, 3.0, 0.35, 0x5a4130, { y: 1.5, z: dz }, M.mat);
    c.boite(0.45, 0.4, 2.3, 0x5a4130, { y: 2.85 }, M.mat);
    c.poser(geoCyl(0.14, 0.14, 2.0, 8), M.mat, 0x7a5a3c, { y: 1.8 });
    for (let i = 0; i < 7; i++) cylindre(c, M.mat, 0x9a7a52, 0, 0.55 + i * 0.07, 0, 0.75, 0.75, 0.06, 10, {}, { nuance: 0.06 });
  });
  for (let i = 0; i < 5; i++) {
    const x = -69.2 + (i % 2) * 0.9;
    const z = -23 + Math.floor(i / 2) * 0.85;
    const casse = i === 3;
    if (casse) {
      c.poser(geoCyl(0.35, 0.28, 0.9, 8), M.mat, 0xa8644a, { x, y: 0.3, z, rz: PI / 2 - 0.1, ry: 0.6 });
      debris(c, x - 0.6, z - 0.4, x + 0.6, z + 0.4, 6, [0xa8644a, 0x8a5440]);
    } else {
      cylindre(c, M.mat, 0xa8644a, x, 0, z, 0.24, 0.26, 0.25, 8);
      cylindre(c, M.mat, 0xa8644a, x, 0.25, z, 0.3, 0.38, 0.55, 8);
      cylindre(c, M.mat, 0xa8644a, x, 0.8, z, 0.18, 0.3, 0.2, 8);
    }
  }
  // La niche des survivants : bougies, une boîte de conserve, des fleurs séchées
  c.pave(-79.7, 0.75, -17.2, -79.2, 0.8, -15.9, 0xb9aa8a, M.pierre);
  for (let i = 0; i < 5; i++) {
    const z = -17.0 + i * 0.26;
    cylindre(c, M.satin, 0xe9e3d2, -79.45, 0.8, z, 0.03, 0.03, 0.12 + (i % 3) * 0.05, 6);
    c.poser(OCTA, M.flammes, 0xffc070, { x: -79.45, y: 0.95 + (i % 3) * 0.05, z, e: [0.02, 0.045, 0.02] }, { crasse: false });
  }
  lum.push(() => b.lumiere(-79.1, 0.95, -16.5, 0xffb85a, 4, 7, "bougies de la niche des survivants, dans l'huilerie"));
  // Le frêne qui a poussé dans la salle, le lierre, les ronces
  arbreBerge(c, -74.4, -22.2, 9, 0, "frene");
  lierre(c, -73, 0, z2 + 0.31, 0, 5, 2.4, 50 + 60 * u);
  lierre(c, x2 + 0.31, 0, -21, PI / 2, 4, 2.6, 40 + 40 * u);
  lierre(c, x1 - 0.31, 0, -19, -PI / 2, 6, 4.6, 60 + 50 * u);
  for (const [x, z] of [[-78.5, -15.2], [-71.4, -22.6], [-68.8, -15.4]]) roncier(c, x, z, 0.7 + u * 0.3);
  // Une vieille meule appuyée contre le mur, dehors ; le noyer de la clairière
  c.poser(geoCyl(0.75, 0.75, 0.3, 12), M.pierre, 0xcfc4a8, { x: -66.9, y: 0.74, z: -19.2, rz: PI / 2 - 0.2 }, { nuance: 0.03 });
  arbreBerge(c, -65.6, -24.4, 10, 0, "aulne");
  semer(ctx, -82, -26, -64, -12, 30);
  for (let i = 0; i < 25 * u; i++) touffes(c, [[c.entre(x1 + 0.5, x2 - 0.5), c.entre(z1 + 0.5, z2 - 0.5), 0.02]], PALETTE.herbe);
}

// ---------- Le chemin creux : panneaux, épave, lampadaire ----------

/** Un panneau routier sur deux poteaux, tourné vers le sud-est. */
function panneauRoute(c, M, r, x, z, ry, l, h, y) {
  for (const dx of [-l / 2 + 0.15, l / 2 - 0.15]) c.boite(0.08, y + h / 2, 0.08, C.acier, { x: x + dx * Math.cos(ry), y: (y + h / 2) / 2, z: z - dx * Math.sin(ry) }, M.tole);
  c.boite(l + 0.06, h + 0.06, 0.04, 0x8a8f90, { x, y, z, ry }, M.tole);
  panneau(c, r, { x: x + 0.025 * Math.sin(ry), y, z: z + 0.025 * Math.cos(ry), ry }, l, h);
}

function chemin(ctx) {
  const { c, b, M, u, lum } = ctx;
  if (ctx.ici(-95.5)) panneauRoute(c, M, R.dirOuest, -95.5, 2.6, 0.55, 2.6, 0.5, 1.7);
  if (ctx.ici(-81)) panneauRoute(c, M, R.gue, -81, 2.2, 0.5, 2.2, 0.66, 1.6);
  if (ctx.ici(-57.5)) panneauRoute(c, M, R.deviation, -57.5, -1.6, 0.6, 1.4, 0.7, 1.4);
  if (ctx.ici(95.5)) panneauRoute(c, M, R.dirEst, 95.5, -8.3, 0.5, 2.6, 0.5, 1.7);
  // Le lampadaire solaire de l'Abondance : il s'allume encore « sur détection de présence »
  if (ctx.ici(-90)) {
    c.tube([-90, 0, 2.6], [-90, 4.2, 2.6], 0.07, 0x8a8f90, M.metal, 6);
    c.tube([-90, 4.2, 2.6], [-89.4, 4.4, 3.2], 0.05, 0x8a8f90, M.metal, 5);
    c.boite(0.5, 0.1, 0.25, 0x6a7072, { x: -89.3, y: 4.35, z: 3.3, ry: -0.8 }, M.metal);
    c.boite(0.36, 0.03, 0.16, 0xeef4ff, { x: -89.3, y: 4.29, z: 3.3, ry: -0.8 }, M.flammes, { crasse: false });
    c.boite(1.1, 0.05, 0.7, 0x1f3550, { x: -90, y: 4.6, z: 2.6, rx: -0.45 }, M.lisse);
    lum.push(() => b.lumiere(-89.3, 4.1, 3.3, 0xdfe8ff, 3, 9, "lampadaire solaire « à détection de présence » (il s'allume au passage)"));
  }
  // L'épave du fossé : une petite voiture rouillée, le nez dans les ronces
  if (ctx.ici(-63.5)) {
    c.repere({ x: -63.5, y: 0, z: 11.8, ry: 0.5, rz: 0.08, rx: -0.06 }, () => {
      c.boite(3.8, 0.6, 1.65, 0x7a6a5a, { y: 0.55 }, M.tole, { nuance: 0.06 });
      c.boite(2.0, 0.55, 1.5, 0x7a6a5a, { x: -0.2, y: 1.12 }, M.tole, { nuance: 0.06 });
      c.boite(2.02, 0.4, 1.46, 0x2c3a40, { x: -0.2, y: 1.1 }, M.verre, { crasse: false });
      c.boite(1.2, 0.05, 1.5, 0x6a4a3a, { x: 1.5, y: 1.05, z: 0.1, rz: 0.7 }, M.tole);
      c.boite(0.05, 0.55, 0.9, 0x7a6a5a, { x: 0.2, y: 0.85, z: 1.25, ry: 0.9 }, M.tole);
      for (const [px, pz] of [[1.2, 0.8], [1.2, -0.8], [-1.2, 0.8], [-1.2, -0.8]]) c.poser(geoCyl(0.32, 0.32, 0.22, 8), M.mat, 0x2a2a2a, { x: px, y: 0.25, z: pz, rx: PI / 2 }, { crasse: false });
      for (let i = 0; i < 40 * u; i++) c.poser(BOULE, M.mat, i % 2 ? 0x4f7a3c : 0x3f6b3a, { x: c.entre(-2, 2), y: c.entre(0.3, 1.4), z: c.entre(-0.85, 0.85) * (c.hasard() < 0.5 ? 1 : -1), e: 0.12 }, { crasse: false });
    });
    b.obstacle(-65.3, 10.6, -61.7, 13.0, "épave");
    rouilleSol(c, -63.5, 11.8);
  }
}

function rouilleSol(c, x, z) {
  c.boite(4.2, 0.01, 2.2, 0x6e4a32, { x, y: 0.008, z, ry: 0.5 }, matieres().mat, { crasse: false });
}

// ---------- La remontée : garde-pêche, casier, drone, barricade ----------

function sortie(ctx) {
  const { c, b, M, u, lum } = ctx;
  // Le cabanon du garde-pêche
  if (ctx.ici(72.75)) {
    const [x1, z1, x2, z2] = [70, -19.5, 75.5, -15];
    const k = b.couche("cabanon du garde-pêche", { x: 72.75, z: -17.25, l: 6.4, p: 5.4 }, 1.05, 3.6);
    const spec = { h: 2.5, ep: 0.12, couleur: 0x5f735f, mat: M.planches, interieur: { couleur: 0x8a8068, mat: M.planches } };
    quatreMurs(ctx, k, [x1, z1, x2, z2], spec, {
      s: [{ u: 2.6, l: 0.9, bas: 0, haut: 2.1, type: "porte", vantail: "tombe" }],
      e: [{ u: 2.25, l: 1.0, bas: 1.0, haut: 1.8, type: "fenetre", bris: 0.5 + 0.4 * u }],
    });
    c.pave(x1 + 0.06, 0, z1 + 0.06, x2 - 0.06, 0.03, z2 - 0.06, 0x7a6a52, M.planches, { crasse: false });
    toitTole(k, M, x1, z1, x2, z2, 2.95, 2.5, 0x7d847a);
    for (const z of [z1, z2]) k.pave(x1, 2.5, z - 0.06, x2, 2.5 + (z === z1 ? 0.45 : 0.02), z + 0.06, 0x5f735f, M.planches);
    panneau(c, R.garde, { x: 71.0, y: 1.6, z: z2 + 0.08 }, 1.2, 0.45);
    // Le bureau, les cannes, les filets, les cuissardes, le congélateur mort
    c.pave(70.1, 0, -19.4, 71.9, 0.78, -18.7, 0x8a6a48, M.planches);
    panneau(c, R.carte, { x: 71.0, y: 1.5, z: -19.37 }, 0.6, 0.6);
    for (let i = 0; i < 5; i++) c.tube([72.4 + i * 0.25, 0.05, -19.35], [72.5 + i * 0.3, 2.3, -19.3], 0.012, 0x3a3a38, M.metal, 3, { crasse: false });
    c.pave(74.2, 0, -16.6, 75.4, 0.9, -15.3, 0xd9d4c8, M.satin);
    c.boite(0.5, 0.9, 0.12, 0x3a4a3a, { x: 70.25, y: 0.9, z: -16.2, ry: PI / 2 }, M.satin);
    c.boite(0.6, 0.5, 0.05, 0x8a8a7a, { x: 74.6, y: 1.6, z: -19.36 }, M.toile);
    tonneau(c, 75, 0, -18.8, 0x4a4a46);
    corde(c, 73.4, 0.06, -18.5, false, 0x8a7a5a);
  }
  // Le casier « Point Relais Drone » : son écran luit encore
  if (ctx.ici(79)) {
    c.repere({ x: 79, y: 0, z: -18.2 }, () => {
      c.boite(2.6, 2.1, 0.7, 0x6f8a8c, { y: 1.05 }, M.satin);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
        if (i === 1 && j === 1) continue;
        const ouvert = hache(i * 3 + j, 7) < 0.3 * u;
        c.boite(0.5, 0.5, 0.03, ouvert ? 0x2a2e2e : 0x86a2a4, { x: -0.95 + i * 0.63, y: 0.45 + j * 0.6, z: 0.36 }, M.satin, { crasse: false });
        if (ouvert) c.boite(0.5, 0.5, 0.03, 0x86a2a4, { x: -0.95 + i * 0.63 + 0.25, y: 0.45 + j * 0.6, z: 0.6, ry: -1.2 }, M.satin);
      }
      c.boite(0.56, 0.42, 0.04, 0x1a1f22, { x: -0.32, y: 1.05, z: 0.36 }, M.lisse);
      panneau(c, R.relais, { x: -0.32, y: 1.05, z: 0.385 }, 0.5, 0.32, M.lumineux);
      c.boite(2.7, 0.12, 0.8, 0x2f6f73, { y: 2.16 }, M.satin);
    });
    lum.push(() => b.lumiere(78.7, 1.2, -17.3, 0x9fe0ff, 2.5, 5, "écran du casier Point Relais Drone (« Votre pont est en route ! »)"));
    b.obstacle(77.7, -17.85, 80.3, -17.85, "casier");
  }
  // Le drone de livraison pendu dans un frêne du talus, son colis tombé au bord de la route
  if (ctx.ici(69)) {
    const [ax, az] = [69.2, 8.6];
    const y0 = hauteur(ax, az);
    arbreBerge(c, ax, az, 13, y0, "frene");
    // Une branche basse tendue vers la route : le drone y pend par sa sangle, sous le houppier
    const yD = y0 + 5.2;
    const [dx, dz] = [ax - 0.5, az - 4.6];
    c.tube([ax, y0 + 5.5, az], [dx, yD + 2.4, dz], 0.1, 0x7a7466, M.mat, 4);
    c.tube([dx, yD + 2.4, dz], [dx - 0.3, yD + 2.9, dz - 0.8], 0.05, 0x7a7466, M.mat, 4);
    c.poser(BOULE, M.mat, 0x6f9448, { x: dx - 0.3, y: yD + 3.0, z: dz - 0.6, e: [1.2, 0.7, 1.1] }, { crasse: false });
    c.tube([dx, yD + 2.4, dz], [dx, yD + 0.15, dz], 0.015, 0xc79a3b, M.mat, 3, { crasse: false });
    c.repere({ x: dx, y: yD, z: dz, rz: 0.5, rx: -0.3 }, () => {
      c.boite(0.8, 0.32, 0.8, 0x2f6f73, {}, M.satin);
      for (const [dx, dz] of [[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75], [0.75, 0.75]]) {
        c.boite(1.0, 0.06, 0.08, 0x2b2b29, { x: dx / 2, z: dz / 2, ry: Math.atan2(dz, -dx) }, M.satin);
        cylindre(c, M.satin, 0xd9d4c8, dx, 0.05, dz, 0.42, 0.42, 0.02, 10);
      }
      c.boite(0.12, 0.08, 0.12, 0xff3020, { y: -0.2 }, M.flammes, { crasse: false });
      c.tube([0, -0.15, 0], [0.2, -1.8, 0.4], 0.015, 0xc79a3b, M.mat, 3, { crasse: false });
    });
    lum.push(() => b.lumiere(dx, yD - 0.3, dz, 0xff3020, 1.5, 4, "voyant rouge du drone pendu dans le frêne (il clignote encore)"));
    // Le colis et la « pièce de pont » dans le fossé
    c.repere({ x: 67.2, y: 0, z: 1.7, ry: 0.4, rz: 0.06 }, () => {
      c.boite(0.95, 0.62, 0.62, 0xc9a874, { y: 0.31 }, M.mat);
      panneau(c, R.colis, { y: 0.63, rx: -PI / 2 }, 0.8, 0.4);
      panneau(c, R.colis, { y: 0.31, z: 0.315 }, 0.8, 0.4);
    });
    c.repere({ x: 64.6, y: 0.2, z: 2.4, ry: -0.2, rz: 0.08 }, () => {
      c.boite(3.2, 0.06, 0.4, 0xc79a3b, { y: 0.0 }, M.tole);
      c.boite(3.2, 0.06, 0.4, 0xc79a3b, { y: 0.4 }, M.tole);
      c.boite(3.2, 0.4, 0.06, 0xc79a3b, { y: 0.2 }, M.tole);
    });
    for (let i = 0; i < 3; i++) c.boite(0.42, 0.02, 0.05, 0xd9d4c8, { x: 69.2 + i * 0.5, y: hauteur(69.6, 7.2) + 0.02, z: 7.2 + i * 0.3, ry: i }, M.satin);
  }
  // La barricade de troncs : elle ne laisse qu'un passage sur la moitié sud de la route
  if (ctx.ici(89)) {
    const z0 = zr(89);
    for (let i = 0; i < 4; i++) {
      const y = i < 2 ? 0.3 : 0.75;
      bois(c, [88.2 + (i % 2) * 0.6, y, z0 - HL - 1.6], [89.0 + (i % 2) * 0.5, y + 0.05, z0 + 0.1 - i * 0.1], 0.3, 0x7a6a56);
    }
    for (let i = 0; i < 6; i++) c.tube([87.8 + (i % 2) * 2.2, 0, z0 - 3.8 + i * 0.75], [87.2 + (i % 2) * 3.4, 1.4, z0 - 3.8 + i * 0.75], 0.06, 0x8a7a62, M.mat, 4);
    b.obstacle(88.6, z0 - HL - 1.8, 88.6, z0 + 0.2, "barricade de troncs");
    caisse(c, 87, 0, z0 + 2.2, 0.6, 0.3);
  }
}

// ---------- La glaise et les joncs (B6, B7) ----------

function glaiseEtJoncs(ctx) {
  const { c, M } = ctx;
  // Le gisement de glaise, sur la berge de vase sous le camping-car : une motte entamée à la bêche, des mottes
  // découpées, des traces de pas et de bêche
  const [gx, gz] = [GLAISE.x, GLAISE.z];
  if (ctx.ici(gx)) {
    c.poser(BOULE, M.mat, 0x8f8068, { x: gx, y: 0.05, z: gz, ry: 0.4, e: [1.15, 0.38, 0.85] }, { nuance: 0.04 });
    c.boite(0.75, 0.32, 0.05, 0xa89a7c, { x: gx + 0.45, y: 0.17, z: gz + 0.35, ry: 0.4, rx: -0.25 }, M.mat, { crasse: false }); // la face fraîchement coupée
    for (const [dx, dz, ry] of [[0.9, 0.9, 0.2], [1.2, 0.5, 1.1], [0.6, 1.25, 2.0]]) c.boite(0.26, 0.16, 0.18, 0x9c8e70, { x: gx + dx, y: 0.08, z: gz + dz, ry }, M.mat, { nuance: 0.05 });
    // La bêche plantée dans la motte
    c.tube([gx - 0.2, 0.25, gz + 0.1], [gx - 0.05, 1.25, gz - 0.05], 0.025, 0x7a5a3c, M.mat, 5);
    c.boite(0.2, 0.26, 0.02, 0x6a6560, { x: gx - 0.21, y: 0.2, z: gz + 0.11, rz: 0.15 }, M.metal, { crasse: false });
    c.boite(0.16, 0.03, 0.03, 0x7a5a3c, { x: gx - 0.05, y: 1.26, z: gz - 0.05 }, M.mat, { crasse: false });
    for (let i = 0; i < 6; i++) c.boite(0.28, 0.012, 0.13, 0x3f3428, { x: gx - 1.2 + i * 0.42, y: 0.015, z: gz + 1.4 + (i % 2) * 0.3, ry: 0.3 + (i % 2) * 0.4 }, M.lisse, { crasse: false });
  }
  // Les 6 touffes de joncs cueillables, un peu plus fournies et plus vertes que les autres
  for (const [x, z] of JONCS) {
    if (!ctx.ici(x)) continue;
    const y = Math.max(-0.4, hauteur(x, z));
    joncs(c, x, z, y, 1.3, 0x5f8a3a);
    joncs(c, x + 0.22, z + 0.15, y, 1.1, 0x5f8a3a);
  }
}

// ---------- La construction d'un tronçon ----------

/**
 * Construit un tronçon. `miroir: true` : le gué retourné de gauche à droite (le terrain à l'est, comme sur la carte du
 * jeu) ; les données sont alors celles de FICHE_MIROIR, et les textes des enseignes se lisent à l'endroit.
 */
export function creer({ usure = 0.7, carte = "chemin", miroir = false } = {}) {
  const def = FICHE.cartes.find((k) => k.id === carte) ?? FICHE.cartes[0];
  const x0 = def.decalage.x;
  const b = new Batiment(2203 + Math.round(x0), usure);
  const lum = [];
  const ctx = { b, c: b.c, M: matieres(), u: usure, x0, xa: x0 - 25, xb: x0 + 25, ici: bande(x0), lum, miroir };
  terrain(ctx);
  eaux(ctx);
  route(ctx);
  bords(ctx);
  nature(ctx);
  alentours(ctx);
  pont(ctx);
  radier(ctx);
  bac(ctx);
  cabane(ctx);
  guinguette(ctx);
  passerelle(ctx);
  kayaks(ctx);
  lavoir(ctx);
  campingCar(ctx);
  glaiseEtJoncs(ctx);
  huilerie(ctx);
  chemin(ctx);
  sortie(ctx);
  for (const f of lum) f();
  const anime = new THREE.Object3D();
  anime.userData.animer = (t) => animer(t);
  b.ajouter(anime);
  const groupe = recentrer(b.construire(), x0);
  // Les objets que le jeu anime : le radeau du bac (tronçon « rive ») et la nappe du radier (tronçons « rive » et « gue »)
  groupe.userData.radeau = groupe.getObjectByName("radeau") ?? null;
  groupe.userData.nappeRadier = groupe.getObjectByName("nappeRadier") ?? null;
  // Les alentours (R52) : le décor au-delà du lot, que le jeu peut montrer ou cacher
  groupe.userData.objets = { ...(groupe.userData.objets ?? {}), alentours: groupe.getObjectByName("alentours") ?? null };
  return miroir ? miroiter(groupe) : groupe;
}

// ---------- La fiche du gué retourné ----------

/** Retourne les données de la fiche : x → −x (les paires x1/x2 s'échangent), les flèches des textes changent de sens. */
function retournerDonnees(v, cle) {
  if (Array.isArray(v)) return v.map((e) => retournerDonnees(e));
  if (typeof v === "string") return v.replace(/[←→]/g, (f) => (f === "←" ? "→" : "←"));
  if (!v || typeof v !== "object") return v;
  const o = {};
  for (const [k, e] of Object.entries(v)) o[k] = retournerDonnees(e, k);
  if (typeof v.x === "number") o.x = arr(-v.x);
  if (typeof v.x1 === "number" && typeof v.x2 === "number") {
    o.x1 = arr(-v.x2);
    o.x2 = arr(-v.x1);
  }
  return o;
}

/** La fiche du gué retourné (le terrain à l'est) : à utiliser avec creer({ miroir: true }). */
export const FICHE_MIROIR = { ...retournerDonnees(FICHE), miroir: true };
