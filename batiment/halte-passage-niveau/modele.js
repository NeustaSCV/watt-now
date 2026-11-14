// Halte · Le passage à niveau (route de la Ville, Book 20 §4 ; Book 01 §2 bis).
//
// En périphérie de la ville, entre les pavillons et les friches, la rue du faubourg traverse la voie ferrée qui relie la
// gare, la zone industrielle et le port (Book 20 §1 ter). Le jour de la Grande Panne, un long train de marchandises s'est
// arrêté en travers du passage à niveau : la locomotive diesel, les conteneurs, le wagon couvert, deux wagons-citernes.
// Il n'est jamais reparti. Pour passer, on traverse le wagon couvert par ses portes coulissantes ouvertes (des
// survivants y campent), on rampe sous une citerne, ou l'on fait le grand détour par la passerelle piétonne rouillée.
//
// La halte fait 200 × 70 m ; la rue la traverse d'ouest (entrée A, côté Carrefour) en est (sortie B, vers le centre-ville).
// Elle est faite de quatre tronçons de 50 × 70 m (ses cartes). Tout est bâti dans le « repère de la halte » (origine au
// centre, +x à l'est, +z au sud), puis chaque tronçon ne garde que ce qui tombe dans sa bande de x et se recentre.
//   1. « faubourg »  x ∈ [−100, −50] : l'entrée du faubourg, deux pavillons (dont un visitable en entier), le square ;
//   2. « epicerie »  x ∈ [−50, 0]    : l'épicerie pillée, le chantier et sa grue, un troisième pavillon, la file d'épaves ;
//   3. « passage »   x ∈ [0, 50]     : le passage à niveau, le train, la maisonnette, le poste d'aiguillage, la passerelle ;
//   4. « depot »     x ∈ [50, 100]   : le dépôt de bus et ses navettes autonomes, les jardins ouvriers, la sortie B.

import * as THREE from "three";
import { Batiment, PALETTE, mur, lierre, touffes, semerTouffes, gravats, debris, jonchee, mousse, arbuste, arbre, flaque } from "../commun/atelier.js";
import {
  M, C, PI, TAU, COUPE, quad, triangle2, panneau, cylY, cylZ, cylX, boule, obstacleRect, murCoupe, coque, cloison, toitTuiles, fen, porteF, vide,
  table, chaise, lit, armoire, etagere, canape, frigo, planTravail, velo, trottinette, nain, tele, carton, caisse, paille, bidon, cuve, brasero,
  poubelle, epave, bus, drone, haie, grillage, muret, palissade, reverbere, massif,
} from "./objets.js";

// ---------- Le plan de la halte (repère de la halte) ----------

const XV = 16; // l'axe de la voie ferrée (nord-sud)
const RW = 3.5; // demi-largeur de la chaussée
const TR = 5.5; // bord extérieur des trottoirs
const CL = 6.2; // la ligne des clôtures des propriétés, de part et d'autre de la rue
const BORD = 34.6; // les bords nord et sud de la halte
const XG1 = 9.5; // le grillage ouest de la voie
const XG2 = 22.5; // le grillage est de la voie
const RT = 0.5; // le dessus des rails, sur le ballast
const F = 0.22; // le plancher du wagon couvert, affaissé sur la chaussée
// Le train, du nord au sud (z)
const LOCO = [-34.8, -23.8];
const PC = [-23, -8.5]; // le wagon porte-conteneurs
const WC = [-7.25, 7.25]; // le wagon couvert, en travers de la rue
const CB = [8.5, 20.5]; // la citerne sous laquelle on rampe
const CC = [21.5, 34.8]; // la seconde citerne
const PASSERELLE = { z: -28, y: 6.0, x1: 8.5, x2: 23.5 };
const CONTENEUR_TOMBE = { x: 5.4, z: 21.2, ry: 0.42 };

const TRONCONS = [
  { id: "faubourg", nom: "1 · L'entrée du faubourg", x: -75 },
  { id: "epicerie", nom: "2 · La rue de l'épicerie", x: -25 },
  { id: "passage", nom: "3 · Le passage à niveau", x: 25 },
  { id: "depot", nom: "4 · Le dépôt et les jardins", x: 75 },
];

function arr(v) {
  return Math.round(v * 10) / 10;
}

// ---------- La fiche ----------

const FOUILLE = [
  // 1. Le faubourg
  { x: -73.5, z: -20, quoi: "garage du pavillon : établi, caisse à outils, scie, clés (outillage)" },
  { x: -75.5, z: -14.5, quoi: "garage : deux vélos, pompe, chambres à air (déplacement, caoutchouc)" },
  { x: -88.6, z: -17, quoi: "salon : l'écran géant (verre, électronique), enceintes « intelligentes », console" },
  { x: -80, z: -16.4, quoi: "cuisine : placards (conserves, sucre, sel), frigo connecté (compresseur, cuivre)" },
  { x: -80.5, z: -20.5, quoi: "chambre : armoire (vêtements, couvertures), boîte à pharmacie de la salle de bains" },
  { x: -82, z: -14.3, quoi: "drone de livraison écrasé sur le toit (batterie, moteurs) : il faut une échelle" },
  { x: -77.3, z: 13.8, quoi: "garage du second pavillon : vélo, tondeuse (essence au fond du réservoir), outils" },
  { x: -82.6, z: 20.2, quoi: "cuisine du second pavillon : cellier (bocaux, conserves, pâtes)" },
  { x: -82, z: -30, quoi: "jardin : trampoline (ressorts, toile), piscine hors-sol (eau croupie, bâche)" },
  { x: -58, z: -6.6, quoi: "abribus : l'affiche, le banc (vis, tôle)" },
  // 2. L'épicerie
  { x: -40.5, z: 12, quoi: "rayons pillés de l'épicerie : quelques conserves roulées sous les gondoles" },
  { x: -35.2, z: 9.7, quoi: "comptoir : caisse enregistreuse (petite électronique), sacs, briquets" },
  { x: -33.8, z: 13, quoi: "vitrines réfrigérées : boissons oubliées au fond, compresseur" },
  { x: -40, z: 19, quoi: "réserve : cartons éventrés (riz, farine humide), congélateur coffre" },
  { x: -43.5, z: -30, quoi: "cabane de chantier : plans, casques, trousse de secours, lit de camp" },
  { x: -37.5, z: -9.6, quoi: "chantier : bétonnière (moteur), sacs de ciment durcis, fers à béton, parpaings" },
  { x: -19.5, z: -15.5, quoi: "troisième pavillon : salon (écran tombé), cuisine (épices, bocaux)" },
  { x: -22, z: 11, quoi: "camionnette WattyDrop : colis non réclamés (au petit bonheur)" },
  { x: -12, z: 12, quoi: "poste électrique de quartier : porte forcée, cuivre des barres" },
  // 3. Le passage à niveau
  { x: 16, z: -3, quoi: "wagon couvert : campement (couvertures, bougies, réchaud), caisses de pièces détachées" },
  { x: 16.2, z: 4.6, quoi: "wagon couvert : caisses clouées (visserie, roulements, courroies), paille" },
  { x: 12, z: -18, quoi: "conteneur des trottinettes : batteries, moteurs-roues, câbles (il en reste par terre)" },
  { x: 12.4, z: -11.2, quoi: "conteneur des nains de jardin : des nains. Beaucoup de nains. (céramique, plâtre)" },
  { x: 3.6, z: 25.4, quoi: "conteneur tombé : télés grand format en cartons (verre, électronique)" },
  { x: 25.8, z: 11.6, quoi: "maisonnette du garde-barrière : cuisine (poêle, conserves, café), tableau des horaires" },
  { x: 30.2, z: 13.4, quoi: "chambre du garde-barrière : couvertures, lampe à pétrole, pétrole" },
  { x: 29, z: 21, quoi: "jardinet potager : poireaux et choux montés en graine (graines), outils de jardin" },
  { x: 26, z: -13.5, quoi: "poste d'aiguillage : leviers, câbles de commande, téléphone de service, registre" },
  { x: 37.5, z: 11.2, quoi: "box de garage ouvert : pneus, bidon d'huile, cartons de déménagement" },
  { x: XV - 6.2, z: 5.2, quoi: "armoire du passage à niveau : la batterie de secours (encore un peu chargée)" },
  // 4. Le dépôt et les jardins
  { x: 61, z: -28.4, quoi: "bureau du dépôt : casiers (vêtements de travail, gants), trousse de secours" },
  { x: 74, z: -18, quoi: "bus n° 2 : sièges (mousse), barres (tubes), extincteur, batteries" },
  { x: 88.5, z: -11, quoi: "navette autonome : batterie, capteurs, écran (électronique)" },
  { x: 86, z: 26.5, quoi: "cabane-atelier des jardins : outils (bêche, scie, serpe), dynamo à pédales, fil de fer" },
  { x: 79, z: 17.2, quoi: "cuves de 1 000 litres : eau de pluie (à filtrer)" },
  { x: 70, z: 26, quoi: "serre-tunnel : semis retournés, graines, ficelle, arrosoirs" },
  { x: 60, z: 30, quoi: "cabane de la parcelle 3 : bidons, engrais, tuyaux d'arrosage" },
];
const ETEINTS = [
  { x: -85.6, z: -17.6, type: "ancien habitant : père de famille en peignoir (salon, devant l'écran géant)" },
  { x: -73.5, z: -16.5, type: "rampant (sous l'établi du garage)" },
  { x: -82.5, z: 16, type: "errant (cuisine du second pavillon)" },
  { x: -58, z: -20, type: "errant (square)" },
  { x: -37.5, z: 11, type: "ancien habitant : l'épicier en blouse (derrière le comptoir)" },
  { x: -42, z: 18.5, type: "rampant (réserve)" },
  { x: -44, z: -27, type: "équipé : ouvrier au casque de chantier (près de la cabane)" },
  { x: -20.5, z: -16, type: "errant (troisième pavillon)" },
  { x: -10.5, z: 1.2, type: "errant (dans la file des voitures)" },
  { x: 12, z: -14.5, type: "rampant (entre la voie et le grillage, parmi les trottinettes)" },
  { x: 19.6, z: 15.2, type: "rampant (sous la citerne, côté est : on le voit en rampant)" },
  { x: 5.6, z: 26.5, type: "errant (autour du conteneur tombé)" },
  { x: 29.8, z: 12.2, type: "ancien habitant : le garde-barrière en gilet orange (maisonnette)" },
  { x: 27.6, z: -14.6, type: "errant (poste d'aiguillage)" },
  { x: 40, z: 13, type: "errant (box de garage)" },
  { x: 74.8, z: -21, type: "ancien habitant : chauffeur en uniforme (bus n° 2, assis au volant)" },
  { x: 61.5, z: -27.5, type: "errant (bureau du dépôt)" },
  { x: 84.5, z: -24, type: "équipé : agent de maintenance au casque" },
  { x: 66, z: 22, type: "errant (jardins)" },
  { x: 87, z: 27.6, type: "rampant (dans la cabane-atelier)" },
  { x: 95, z: 30, type: "putréfié (friche du fond)" },
];
const ENTREES = [
  { x: -100, z: 0, nature: "entrée A de la halte (ouest, depuis le Carrefour)" },
  { x: -85.2, z: -13, nature: "porte d'entrée du premier pavillon" },
  { x: -88, z: -13, nature: "baie vitrée brisée du salon" },
  { x: -74.2, z: -13, nature: "porte de garage relevée (premier pavillon)" },
  { x: -77.3, z: 12, nature: "porte de garage ouverte (second pavillon), puis la cuisine" },
  { x: -39.3, z: 7.5, nature: "porte de l'épicerie, rideau métallique à demi levé" },
  { x: -33, z: 19, nature: "porte de service de l'épicerie (ruelle)" },
  { x: -35.5, z: -6.4, nature: "panneau de palissade arraché (chantier)" },
  { x: -42, z: -28.5, nature: "porte de la cabane de chantier" },
  { x: -16.8, z: -12, nature: "porte du troisième pavillon" },
  { x: XV - 1.45, z: 0, nature: "porte coulissante ouest du wagon couvert" },
  { x: XV + 1.45, z: 0, nature: "porte coulissante est du wagon couvert" },
  { x: 26.4, z: 8.6, nature: "porte de la maisonnette du garde-barrière" },
  { x: 29.4, z: -10.5, nature: "porte du poste d'aiguillage" },
  { x: 7.7, z: -19, nature: "pied de l'escalier ouest de la passerelle" },
  { x: 24.3, z: -19, nature: "pied de l'escalier est de la passerelle" },
  { x: XG1, z: 21, nature: "grillage couché par le conteneur tombé (accès à la voie, côté ouest)" },
  { x: XG2, z: 14.3, nature: "grillage découpé (accès à la voie, côté est)" },
  { x: XG1, z: -14.5, nature: "grillage arraché (accès aux conteneurs)" },
  { x: 68, z: -6.2, nature: "portail du dépôt de bus (coulissant, sorti de son rail)" },
  { x: 60.7, z: 6.2, nature: "portillon des jardins ouvriers" },
  { x: 86, z: 23, nature: "porte de la cabane-atelier" },
  { x: 100, z: 0, nature: "sortie B de la halte (est, vers le centre-ville)" },
];

const dansTroncon = (t) => (p) => p.x >= t.x - 25 && (p.x < t.x + 25 || (t.x === 75 && p.x <= 100));
const local = (t, liste) => liste.map((p) => ({ ...p, x: arr(p.x - t.x), z: arr(p.z) }));

const CARTES = TRONCONS.map((t) => ({
  id: t.id,
  nom: t.nom,
  lot: { l: 50, p: 70 },
  decalage: { x: t.x, z: 0 },
  solPropre: true,
  depart: { x: -23.5, z: 1.6 },
  description: {
    faubourg: "l'entrée A, le panneau du faubourg, deux pavillons (un visitable en entier, un par son garage), le square et l'abribus",
    epicerie: "l'épicerie de quartier pillée, le chantier de la « Résidence » et sa grue, un troisième pavillon, la file de voitures arrêtées",
    passage: "le passage à niveau bloqué par le train : le wagon couvert à traverser, la citerne sous laquelle ramper, la passerelle, la maisonnette, le poste d'aiguillage",
    depot: "le dépôt de bus et ses navettes autonomes, les jardins ouvriers et leurs cabanes, la sortie B",
  }[t.id],
  entrees: local(t, ENTREES.filter(dansTroncon(t))),
  fouille: local(t, FOUILLE.filter(dansTroncon(t))),
  eteints: local(t, ETEINTS.filter(dansTroncon(t))),
}));

export const FICHE = {
  id: "halte-passage-niveau",
  nom: "Halte · Le passage à niveau",
  lieu: "Route de la Ville · périphérie, entre pavillons et friches · halte",
  environnement: "ville",
  anneau: "proche",
  danger: 3,
  halte: true,
  solPropre: true,
  recit:
    "Le train de marchandises « autonome » s'est arrêté pile sur le passage à niveau, le jour où plus rien n'a répondu, et il attend depuis le feu vert d'un algorithme. Les barrières sont baissées pour toujours, le feu rouge clignote encore sur sa batterie, et la sonnerie, elle, n'existait plus que dans une appli. Pour passer, on traverse le wagon couvert où campent des inconnus, on rampe sous la citerne de boisson énergétique, ou l'on fait le tour par la passerelle qui rouille.",
  inspiration: "les passages à niveau des faubourgs français (barrières rouges et blanches, croix de Saint-André, maisonnette du garde-barrière), les trains de fret abandonnés sur les voies, les zones pavillonnaires des années 1980 aux haies de thuyas",
  reperes: [
    "Le train arrêté en travers de la rue : locomotive diesel sous la passerelle, conteneurs, le wagon couvert affaissé sur la chaussée, deux citernes « Watty Boost »",
    "Le goulet principal : le wagon couvert, portes coulissantes ouvertes des deux côtés, campement de survivants (paille, caisses, brasero)",
    "Le passage bas : sous la citerne, entre les bogies, à plat ventre (graffiti « Citerne : à plat ventre »)",
    "Le grand détour : la passerelle piétonne rouillée et ses deux escaliers, au-dessus de la locomotive",
    "Le passage à niveau : demi-barrières rouges et blanches baissées (une cassée), croix de Saint-André, feu rouge qui clignote sur batterie",
    "L'Abondance : « Train autonome sans conducteur — prochain passage : bientôt », la sonnerie « sur l'appli PassageZen+ », les drones WattyDrop écrasés sur les toits",
    "Les conteneurs : trottinettes électriques répandues sur le ballast, nains de jardin alignés en sentinelles, télés grand format dans le conteneur tombé",
    "La maisonnette du garde-barrière (cuisine, chambre, tableau des horaires, jardinet) et le poste d'aiguillage et ses leviers",
    "Les pavillons du faubourg : haies de thuyas, garages (vélos, outils), salon à écran géant (« Votre abonnement a expiré »)",
    "L'épicerie du Passage pillée, le chantier de la « Résidence Les Jardins Connectés » et sa grue figée",
    "Le dépôt Wattbus et ses navettes « Je conduis, vous vivez ! », les jardins ouvriers (cabanes, cuves d'eau, outils : pour les Mécanistes)",
  ],
  lot: { l: 200, p: 70 },
  depart: { x: -97, z: 1.6 },
  goulets: [
    { x: XV, z: 0, nature: "le wagon couvert : on le traverse par ses portes coulissantes ouvertes (passage principal, 2,8 m de large)" },
    { x: XV, z: 14.5, nature: "sous la citerne, entre les bogies : passage bas, à plat ventre (accès par les grillages percés)" },
    { x: XV, z: PASSERELLE.z, nature: "la passerelle piétonne : deux escaliers raides et un tablier rouillé (le grand détour par le nord)" },
  ],
  panneaux: [
    { x: -93, z: -6.9, sens: "est", texte: "Centre-ville · Comptoir de la Gare · 4 km →" },
    { x: -96.5, z: 6.9, sens: "est", texte: "Faubourg des Prises (entrée d'agglomération)" },
    { x: XV - 24, z: 6.1, sens: "est", texte: "Passage à niveau avec barrières (panneau triangulaire)" },
    { x: XV + 42, z: -6.1, sens: "ouest", texte: "Passage à niveau avec barrières (panneau triangulaire)" },
    { x: 95.5, z: 6.9, sens: "ouest", texte: "← Le Carrefour · Comptoir · 5 km" },
  ],
  cartes: CARTES,
};

// ---------- Outils de la halte ----------

/** Le centre d'un objet tombe-t-il dans le tronçon en cours ? */
function ici(ctx, x) {
  return x >= ctx.xa && (x < ctx.xb || (ctx.xb >= 100 && x <= 100.5));
}
/** La part de [x1, x2] qui tombe dans le tronçon, ou null. */
function clipX(ctx, x1, x2) {
  const a = Math.max(x1, ctx.xa);
  const b = Math.min(x2, ctx.xb);
  return b - a > 0.05 ? [a, b] : null;
}
/** Un élément linéaire le long de x (clôture, haie, mur), coupé aux limites du tronçon. */
function leLongX(ctx, x1, x2, f) {
  const r = clipX(ctx, x1, x2);
  if (r) f(r[0], r[1]);
}

/** Une boîte tournée (centre, longueur selon x local, profondeur selon z local) comme obstacle. */
function obstacleTourne(b, x, z, l, p, ry, nature) {
  const c = Math.cos(ry);
  const s = Math.sin(ry);
  const pts = [[-l / 2, -p / 2], [l / 2, -p / 2], [l / 2, p / 2], [-l / 2, p / 2]].map(([u, v]) => [x + u * c + v * s, z - u * s + v * c]);
  for (let i = 0; i < 4; i++) b.obstacle(pts[i][0], pts[i][1], pts[(i + 1) % 4][0], pts[(i + 1) % 4][1], nature);
}

// ---------- Le sol et la rue ----------

function sol(ctx) {
  const { c, u, xa, xb } = ctx;
  // Le terrain : herbe et terre (texture « monde », continue d'un tronçon à l'autre)
  c.pave(xa, -0.4, -35, xb, 0, 35, C.herbe, M.herbe(), { crasse: false, nuance: 0 });
  // La chaussée
  c.pave(xa, 0, -RW, xb, 0.03, RW, C.bitume, M.bitume(), { crasse: false, nuance: 0 });
  // Les trottoirs et leurs bordures
  for (const s of [-1, 1]) {
    c.pave(xa, 0, s > 0 ? RW : -TR, xb, 0.12, s > 0 ? TR : -RW, C.trottoir, M.beton(), { crasse: false, nuance: 0 });
    c.pave(xa, 0, s > 0 ? RW - 0.02 : -RW - 0.16, xb, 0.15, s > 0 ? RW + 0.16 : -RW + 0.02, C.bordure, M.mat(), { crasse: false, nuance: 0 });
  }
  // La ligne médiane, effacée par endroits, et les lignes d'effet des feux
  for (let x = -99; x < 100; x += 6) {
    if (x > 6 && x < 25) continue;
    if (!ici(ctx, x + 1.5) || c.hasard() < 0.15 + 0.3 * u) continue;
    c.pave(x, 0.03, -0.06, x + 3, 0.034, 0.06, C.marquage, M.mat(), { crasse: false });
  }
  if (ici(ctx, XV)) {
    c.pave(XV - 7.6, 0.03, 0.1, XV - 7.3, 0.034, RW - 0.2, C.marquage, M.mat(), { crasse: false });
    c.pave(XV + 7.3, 0.03, -RW + 0.2, XV + 7.6, 0.034, -0.1, C.marquage, M.mat(), { crasse: false });
  }
  // Le passage piéton devant l'épicerie
  if (ici(ctx, -38)) for (let z = -3; z <= 3; z += 1) c.pave(-39.2, 0.03, z - 0.25, -36.8, 0.034, z + 0.25, C.marquage, M.mat(), { crasse: false });
  // Le temps : herbes dans les joints des bordures et les fissures, flaques, feuilles
  const n = Math.round(14 + 30 * u);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const x = c.entre(xa + 0.5, xb - 0.5);
    if (x > XV - 2.5 && x < XV + 2.5) continue;
    const s = c.hasard() < 0.5 ? -1 : 1;
    pts.push([x, s * (RW + c.entre(-0.1, 0.25)), 0.03]);
    if (c.hasard() < u) pts.push([x + c.entre(-1, 1), c.entre(-RW + 0.4, RW - 0.4), 0.03]);
  }
  touffes(c, pts, PALETTE.herbeSeche);
  for (let i = 0; i < 2 + Math.round(3 * u); i++) {
    const x = c.entre(xa + 2, xb - 2);
    if (Math.abs(x - XV) > 4) flaque(c, x, c.entre(-RW + 0.6, RW - 0.6), c.entre(0.5, 1.3), 0.04);
  }
  jonchee(c, xa, -TR, xb, TR, Math.round(30 + 40 * u), undefined, 0.045);
  debris(c, xa, -RW, xb, RW, Math.round(10 + 20 * u), [0x8a8680, 0x6a6864, 0xb0aca4], 0.03);
}

/** Les bords de la halte : murs de fond de jardin, haies, grillages, palissades (nord et sud), et les deux extrémités. */
function bords(ctx) {
  const { c, b } = ctx;
  const murFond = (x1, x2, z, couleur = 0xb4ada0, h = 2.1) =>
    leLongX(ctx, x1, x2, (a, bb) => {
      mur(c, [a, z], [bb, z], { h, ep: 0.22, couleur, mat: M.beton(), batiment: b, arase: 0.1 });
      c.pave(a, h, z - 0.15, bb, h + 0.06, z + 0.15, 0xc9c2b4, M.mat());
      lierre(c, (a + bb) / 2, 0, z + 0.13, 0, (bb - a) * 0.6, 1.6, Math.round((bb - a) * 2));
    });
  // Le nord
  murFond(-100, -66, -BORD);
  leLongX(ctx, -66, -48, (a, bb) => haie(ctx, a, -BORD, bb, -BORD, 2.4));
  murFond(-28, XG1, -BORD, 0xa8a094);
  leLongX(ctx, XG2, 52, (a, bb) => grillage(ctx, a, -BORD, bb, -BORD, 1.8));
  murFond(52, 100, -BORD, 0x9a6a54, 2.6);
  // Le sud
  murFond(-100, -66, BORD);
  leLongX(ctx, -66, -48, (a, bb) => haie(ctx, a, BORD, bb, BORD, 2.4));
  murFond(-48, -28, BORD, 0xa8a094);
  leLongX(ctx, -28, XG1, (a, bb) => haie(ctx, a, BORD, bb, BORD, 2.6));
  leLongX(ctx, XG2, 100, (a, bb) => grillage(ctx, a, BORD, bb, BORD, 1.8));
  // Les deux extrémités : la rue seule continue
  if (ici(ctx, -99.6)) {
    mur(c, [-99.6, -BORD], [-99.6, -CL], { h: 2.1, ep: 0.22, couleur: 0xb4ada0, mat: M.beton(), batiment: b });
    mur(c, [-99.6, CL], [-99.6, BORD], { h: 2.1, ep: 0.22, couleur: 0xb4ada0, mat: M.beton(), batiment: b });
  }
  if (ici(ctx, 99.6)) {
    grillage(ctx, 99.6, -BORD, 99.6, -CL, 1.8);
    grillage(ctx, 99.6, CL, 99.6, BORD, 1.8);
  }
}

/** Les réverbères éteints, des deux côtés de la rue, en quinconce. */
function reverberes(ctx) {
  let i = 0;
  for (let x = -92; x < 100; x += 21) {
    i++;
    if (x > 2 && x < 30) continue;
    const z = i % 2 ? -TR + 0.35 : TR - 0.35;
    if (!ici(ctx, x)) continue;
    reverbere(ctx.c, x, z, z < 0 ? 0 : PI, ctx.c.hasard() < 0.2 * ctx.u ? 0.08 : 0);
    ctx.b.obstacle(x - 0.15, z, x + 0.15, z, "réverbère");
  }
}

// ---------- Les panneaux routiers ----------

/** Un panneau sur deux poteaux (direction, entrée d'agglomération). */
function panneauRoutier(ctx, region, x, z, l, h, y, ry, deuxPoteaux = true) {
  const { c } = ctx;
  c.repere({ x, z, ry }, () => {
    const pots = deuxPoteaux ? [-l * 0.35, l * 0.35] : [0];
    for (const px of pots) c.boite(0.08, y + h / 2, 0.08, 0x8a8c88, { x: px, y: (y + h / 2) / 2, z: -0.06 }, M.metal());
    c.boite(l + 0.04, h + 0.04, 0.03, 0x9a9c98, { y, z: -0.03 }, M.metal());
    panneau(c, region, 0, y, 0.0, l, h);
  });
}

function panneaux(ctx) {
  if (ici(ctx, -96)) {
    panneauRoutier(ctx, "entree", -96.5, 6.9, 2.1, 0.6, 1.9, -0.64);
    panneauRoutier(ctx, "dirEst", -93, -6.9, 2.4, 0.52, 2.2, -0.3, false);
  }
  if (ici(ctx, 95)) panneauRoutier(ctx, "dirOuest", 95.5, 6.9, 2.4, 0.52, 2.2, 0.5, false);
  // Les panneaux triangulaires annonçant le passage à niveau
  if (ici(ctx, XV - 24)) panneauRoutier(ctx, "triangle", XV - 24, 6.1, 1.0, 0.92, 2.1, -0.9, false);
  if (ici(ctx, XV + 42)) panneauRoutier(ctx, "triangle", XV + 42, -6.1, 1.0, 0.92, 2.1, 0.9, false);
}

// ---------- 1. Le faubourg ----------

/** Le premier pavillon, visitable en entier : séjour à écran géant, cuisine, chambre, garage. */
function pavillon1(ctx) {
  if (!ici(ctx, -83)) return;
  const { b, c, u } = ctx;
  const bris = 0.35 + 0.55 * u;
  const H = 2.6;
  const k = coque(ctx, {
    x0: -90, x1: -77, z0: -22, z1: -13, h: H, nom: "pavillon 1", couleur: C.crepi, angle: 0xd2c6ae, boite: { x: -80.75, z: -17.5, l: 19.3, p: 9.8 },
    ouv: {
      s: [fen(-88, 2.4, { bas: 0.05, haut: 2.2, croisillons: 2, traverses: 1, bris: 0.95, cadre: C.alu }), porteF(-85.2, 1.0, { couleurPorte: 0x8a4a3a, angle: 1.4 }), fen(-80.5, 1.4, { bris, volet: "pendu", couleurVolet: C.volet })],
      e: [vide(-15.2, 0.9)],
      n: [fen(-80.5, 1.2, { bris, volet: "ouvert", couleurVolet: C.volet }), fen(-87, 1.2, { bris })],
      o: [fen(-21, 1.0, { bris })],
    },
    breches: u > 0.6 ? { n: [{ u: 9.5, l: 2.5, profondeur: 1.2 }] } : {},
  });
  cloison(ctx, k, [-84, -22], [-84, -13], H, [2.5, 6.8]);
  cloison(ctx, k, [-84, -17.2], [-77, -17.2], H, [4.5]);
  // Les sols
  c.pave(-90, 0, -22, -84, 0.04, -13, 0xb89a74, M.parquet(), { crasse: false });
  c.pave(-84, 0, -17.2, -77, 0.04, -13, 0xd8d4c8, M.carrelage(), { crasse: false });
  c.pave(-84, 0, -22, -77, 0.04, -17.2, 0xa88a68, M.parquet(), { crasse: false });
  // Le toit et le drone écrasé
  const trous = u > 0.45 ? [{ u: -3, v: 1, l: 2.4, p: 0.5 }] : [];
  toitTuiles(k, { x0: -90, x1: -77, z0: -22, z1: -13, h: H, hf: 2.0, trous });
  const pente = Math.atan2(2.0, 4.5);
  k.repere({ x: -82, y: H + 2.0 * (1 - 3 / 4.5) + 0.05, z: -14.5, rx: pente }, () => drone(k, 0, 0, 0, 0.6, 0.15, true, M.mat()));
  k.boite(0.5, 1.2, 0.5, 0xb8a894, { x: -86, y: H + 1.9, z: -19 }, M.enduit()); // la cheminée
  // --- Le séjour : l'écran géant sur son pied, le canapé d'angle, la console ---
  c.repere({ x: -89.2, z: -17, ry: PI / 2 }, () => {
    c.boite(2.4, 0.45, 0.45, 0x2a2a2c, { y: 0.225 }, M.satin());
    c.boite(3.1, 1.78, 0.08, 0x18191a, { y: 1.45 }, M.lisse(), { crasse: false });
    panneau(c, "ecran", 0, 1.45, 0.045, 2.96, 1.66);
    for (const s of [-1, 1]) c.boite(0.25, 1.1, 0.25, 0x2a2a2c, { x: s * 1.85, y: 0.55 }, M.satin());
    c.boite(0.35, 0.06, 0.25, 0x1a1a1a, { x: 0.5, y: 0.48 }, M.lisse());
  });
  b.lumiere(-88.6, 1.4, -17, 0x8fc4e0, 2.2, 5, "l'écran géant en veille (« Votre abonnement a expiré »)");
  canape(c, -86, -17.6, -PI / 2, 2.6, 0x6a6e7a, true);
  table(c, -87.6, -16.8, 1.0, 0.6, 0x3a3a3c, 0.2, 0.4);
  c.boite(2.2, 0.01, 1.6, 0x8a5a4a, { x: -87.4, y: 0.045, z: -16.6 }, M.mat(), { crasse: false });
  for (let i = 0; i < 4; i++) c.boite(0.4, 0.15, 0.4, [0xc79a3b, 0x8a5a4a, 0x6a7a8a][i % 3], { x: -88 + c.entre(-1, 1), y: 0.12, z: -15 + c.entre(-1, 1), ry: c.hasard() * 3, rz: 0.2 }, M.mat());
  cylY(c, -89.4, -13.6, 0.04, 0.5, 0.2, 0.16, 0xc9b8a0, M.satin(), 6);
  c.tube([-89.4, 0.5, -13.6], [-89.3, 1.2, -13.5], 0.03, 0x6a5a3a, M.mat(), 4);
  // --- La cuisine ---
  planTravail(c, -80.4, -16.8, 0, 3.4);
  frigo(c, -77.7, -16.6, 0, true, true);
  table(c, -81.4, -14.5, 1.2, 0.8, 0xd8d2c4);
  chaise(c, -82.2, -14.5, PI / 2, 0xd8d2c4);
  chaise(c, -80.4, -14.2, -PI / 2, 0xd8d2c4, true);
  jonchee(c, -84, -17, -77, -13, 10, [0xe9dfc6, 0xc8362b, 0xd9cfb4], 0.05);
  // --- La chambre ---
  lit(c, -80.2, -19.8, 0, 2.0, 1.6);
  armoire(c, -83.5, -19.6, PI / 2, 1.4, 0.6, 2.0, C.bois, true);
  c.boite(0.45, 0.5, 0.4, C.bois, { x: -78, y: 0.25, z: -21.3 }, M.satin());
  c.boite(0.7, 0.25, 0.45, 0x5a4a6a, { x: -82, y: 0.17, z: -21.2, ry: 0.4 }, M.mat()); // la valise ouverte
  // --- Le garage (porte sectionnelle relevée) ---
  const kg = k;
  const og = { h: 2.5, ep: 0.22, couleur: C.crepi, mat: M.enduit() };
  murCoupe(ctx, kg, [-77, -13], [-71.5, -13], { ...og, ouvertures: [{ u: 2.75, l: 3.0, bas: 0, haut: 2.15, type: "vide" }] });
  murCoupe(ctx, kg, [-71.5, -13], [-71.5, -21], { ...og, ouvertures: [fen(0, 0.8, { u: 4, bris })] });
  murCoupe(ctx, kg, [-71.5, -21], [-77, -21], og);
  kg.pave(-77.1, 2.5, -21.2, -71.3, 2.62, -12.8, 0x6a6e70, M.mat());
  kg.pave(-75.7, 1.65, -13.1, -72.8, 2.1, -12.9, 0xd8d4cc, M.mat()); // la porte relevée, coincée
  c.pave(-77, 0, -21, -71.5, 0.04, -13, 0xb0aca0, M.beton(), { crasse: false });
  velo(c, -75.8, -14.6, 0.2, 0x3a6a8a);
  velo(c, -76.2, -16, -0.1, 0xb8332a, true);
  // l'établi et le panneau à outils (côté est)
  c.repere({ x: -72.1, z: -18.5, ry: -PI / 2 }, () => {
    c.boite(2.2, 0.08, 0.7, C.bois, { y: 0.9 }, M.mat());
    for (const s of [-1, 1]) c.boite(0.08, 0.9, 0.6, C.boisSombre, { x: s, y: 0.45 }, M.mat());
    c.boite(2.2, 0.85, 0.03, 0xc9b88a, { y: 1.45, z: -0.32 }, M.mat()); // le panneau perforé (sous la coupe : visible)
    for (let i = 0; i < 7; i++) c.boite(0.05, 0.25 + (i % 3) * 0.1, 0.04, [0x8a8c88, 0xb8332a, 0x3a3a3a][i % 3], { x: -0.9 + i * 0.3, y: 1.4, z: -0.28, rz: (i % 2) * 0.3 }, M.metal());
    c.boite(0.5, 0.25, 0.25, 0xb8332a, { x: 0.6, y: 1.07 }, M.satin()); // la caisse à outils
    c.boite(0.25, 0.2, 0.15, 0x6a6a68, { x: -0.7, y: 1.03 }, M.metal()); // l'étau
  });
  etagere(c, -76.4, -20.4, 0, 1.6, 1.8, 0.45, 0x8a8c88, 4, M.tole());
  for (let i = 0; i < 6; i++) bidon(c, -77 + i * 0.25, -20.4, [0xb8332a, 0x3a6a9a, 0xc79a3b][i % 3], 0.13 + Math.floor(i / 3) * 0.55);
  for (let i = 0; i < 3; i++) cylY(c, -72.3, -14.2, 0.04 + i * 0.22, 0.24 + i * 0.22, 0.32, 0.32, 0x1c1c1c, M.mat(), 10);
  c.boite(0.5, 0.35, 0.8, 0x5a7a3a, { x: -73.5, y: 0.25, z: -14.6, ry: 0.3 }, M.satin()); // la tondeuse
  // --- Le jardin de devant : muret, portillon, allée, voiture dans l'allée ---
  leLongX(ctx, -95, -86.6, (a, bb) => muret(ctx, a, -CL, bb, -CL));
  muret(ctx, -85.6, -CL, -76.6, -CL);
  muret(ctx, -71.8, -CL, -66, -CL);
  c.pave(-86.4, 0, -13, -85.4, 0.03, -CL, 0xb8b0a0, M.beton(), { crasse: false });
  c.pave(-76.4, 0, -13, -72, 0.03, -CL, 0xa8a49a, M.beton(), { crasse: false });
  epave(c, -74.2, -9.4, PI / 2 + 0.05, 0x8a9aa6, "break", u);
  obstacleTourne(b, -74.2, -9.4, 4.4, 1.8, PI / 2 + 0.05, "épave");
  massif(c, -94, -12, -88, -7, 4, 0.9);
  semerTouffes(c, -95, -12.8, -66, -6.5, Math.round(20 + 30 * u), C.herbeSeche);
  // une lampe solaire de jardin qui s'allume encore
  cylY(c, -86.8, -9, 0, 0.45, 0.025, 0.025, 0x3a3a3a, M.metal(), 4);
  boule(c, -86.8, 0.5, -9, 0.07, 0xfff2c0, M.lisse());
  b.lumiere(-86.8, 0.6, -9, 0xfff0c0, 1.2, 3.5, "lampe solaire de jardin qui s'allume encore");
  // --- Les haies latérales et le jardin de derrière ---
  haie(ctx, -95, -CL, -95, -BORD);
  haie(ctx, -66, -CL - 0.2, -66, -BORD, 2.4);
  // le trampoline rouillé
  const g = new THREE.TorusGeometry(1.7, 0.05, 4, 16).rotateX(PI / 2);
  c.poser(g, M.tole(), C.rouille, { x: -82, y: 0.9, z: -29.5 });
  g.dispose();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    c.tube([-82 + Math.cos(a) * 1.7, 0, -29.5 + Math.sin(a) * 1.7], [-82 + Math.cos(a) * 1.7, 0.9, -29.5 + Math.sin(a) * 1.7], 0.03, C.rouilleSombre, M.tole(), 4);
  }
  cylY(c, -82, -29.5, 0.78, 0.8, 1.5, 1.5, 0x2a2a2a, M.mat(), 12);
  // la piscine hors-sol croupie
  cylY(c, -72, -28.5, 0, 1.0, 2.0, 2.0, 0x5a8aa0, M.satin(), 14, true);
  cylY(c, -72, -28.5, 0.1, 0.6, 1.95, 1.95, 0x4a5a3e, M.eau(), 14);
  obstacleRect(b, -74, -30.5, -70, -26.5, "piscine hors-sol");
  // le salon de jardin renversé, l'herbe haute
  table(c, -77, -25, 1.0, 1.0, 0xe0dcd0, 0, 0.72, true);
  chaise(c, -78.4, -24.4, 0.5, 0xe0dcd0, true);
  semerTouffes(c, -94, -34, -67, -23, Math.round(25 + 40 * u), C.herbeSeche);
  arbre(c, -92, -31, 6, "feuillu");
  massif(c, -70, -24, -67, -33, 3, 1.2);
  // L'Éteint du salon et le lierre sur le pignon
  lierre(c, -77.1, 0, -16, PI / 2, 3, 1.8 + u, Math.round(10 + 20 * u));
  debris(c, -90, -22, -77, -13, Math.round(8 + 14 * u), undefined, 0.05);
  obstacleRect(b, -89.6, -17.4 - 1.2, -88.8, -17.4 + 1.6, "meuble télé");
}

/** Le second pavillon, côté sud : on y entre par le garage ouvert, la cuisine se visite, la pièce de l'ouest est murée. */
function pavillon2(ctx) {
  if (!ici(ctx, -83)) return;
  const { b, c, u } = ctx;
  const bris = 0.3 + 0.6 * u;
  const H = 2.6;
  const k = coque(ctx, {
    x0: -90, x1: -80, z0: 12, z1: 21, h: H, nom: "pavillon 2", couleur: C.crepiRose, angle: 0xc8ae9c, boite: { x: -82.25, z: 16.5, l: 16.3, p: 9.8 },
    ouv: {
      n: [fen(-82.5, 1.2, { bris: 0.2 }), fen(-88, 1.2, { bris: 0.1 })],
      e: [vide(15, 0.9)],
      s: [fen(-83, 1.2, { bris, volet: "pendu", couleurVolet: 0x8a7a5a }), fen(-88, 1.0, { bris: 0.2 })],
    },
  });
  // la porte d'entrée (fermée, à clé) et les volets roulants baissés sur la rue
  c.pave(-86.3, 0, 11.86, -85.3, 2.1, 11.9, 0x6a5a48, M.satin());
  for (const x of [-82.5, -88]) k.pave(x - 0.62, COUPE, 11.82, x + 0.62, 2.1, 11.86, 0xb8b4a8, M.mat());
  cloison(ctx, k, [-85, 12], [-85, 21], H, [4.5]);
  // la porte de la pièce ouest, condamnée par des planches
  for (let i = 0; i < 4; i++) c.boite(0.05, 0.16, 1.1, C.boisGris, { x: -84.9, y: 0.35 + i * 0.45, z: 16.5, rx: c.entre(-0.15, 0.15) }, M.mat());
  c.pave(-85, 0, 12, -80, 0.04, 21, 0xd0ccc0, M.carrelage(), { crasse: false });
  c.pave(-90, 0, 12, -85, 0.04, 21, 0xa88a68, M.parquet(), { crasse: false });
  toitTuiles(k, { x0: -90, x1: -80, z0: 12, z1: 21, h: H, hf: 1.9, couleur: C.tuileBrune, pignon: C.crepiRose, trous: u > 0.7 ? [{ u: 2, v: -1, l: 2, p: 0.5 }] : [] });
  const pente = Math.atan2(1.9, 4.5);
  k.repere({ x: -86.5, y: H + 1.9 * (1 - 2.5 / 4.5) + 0.05, z: 19, rx: pente }, () => drone(k, 0, 0, 0, -0.8, -0.25, true, M.mat()));
  // La cuisine et le cellier
  planTravail(c, -82.6, 20.55, PI, 3.6, 0xd8c8a8);
  table(c, -82.8, 15.4, 1.1, 0.8, C.bois);
  chaise(c, -83.6, 15.4, PI / 2);
  chaise(c, -82, 16.3, PI, C.bois, true);
  frigo(c, -80.7, 13.2, -PI / 2, false);
  etagere(c, -84.6, 18.6, PI / 2, 1.4, 1.9, 0.4, C.boisGris, 5);
  for (let i = 0; i < 9; i++) cylY(c, -84.6, 18 + (i % 3) * 0.4, 0.15 + Math.floor(i / 3) * 0.44, 0.33 + Math.floor(i / 3) * 0.44, 0.07, 0.07, [0xc8362b, 0xc79a3b, 0xe9dfc6][i % 3], M.lisse(), 6);
  // Le garage ouvert sur la rue
  const kg = k;
  const og = { h: 2.5, ep: 0.22, couleur: C.crepiRose, mat: M.enduit() };
  murCoupe(ctx, kg, [-74.5, 12], [-80, 12], { ...og, ouvertures: [{ u: 2.75, l: 3.0, bas: 0, haut: 2.15, type: "vide" }] });
  murCoupe(ctx, kg, [-74.5, 20], [-74.5, 12], og);
  murCoupe(ctx, kg, [-80, 20], [-74.5, 20], { ...og, ouvertures: [fen(0, 0.8, { u: 2.75, bris })] });
  kg.pave(-80.1, 2.5, 11.8, -74.3, 2.62, 20.2, 0x6a6e70, M.mat());
  c.pave(-80, 0, 12, -74.5, 0.04, 20, 0xb0aca0, M.beton(), { crasse: false });
  velo(c, -76, 17.8, PI + 0.1, 0x5a7a3a);
  velo(c, -75.4, 15.5, 1.2, 0xc79a3b, true);
  c.repere({ x: -78.5, z: 19.4 }, () => {
    c.boite(2.2, 0.08, 0.7, C.bois, { y: 0.9 }, M.mat());
    for (const s of [-1, 1]) c.boite(0.08, 0.9, 0.6, C.boisSombre, { x: s, y: 0.45 }, M.mat());
    for (let i = 0; i < 5; i++) c.boite(0.06, 0.3, 0.05, [0x8a8c88, 0xb8332a][i % 2], { x: -0.8 + i * 0.4, y: 1.0, z: 0.1, rz: 1.4 }, M.metal());
  });
  c.boite(0.5, 0.35, 0.8, 0xb8332a, { x: -78.8, y: 0.25, z: 13.5, ry: -0.5 }, M.satin()); // la tondeuse
  bidon(c, -79.4, 14.4, 0xb8332a, 0, false, 0.4);
  // Le devant : haie de thuyas, portillon, allée, voiture
  haie(ctx, -95, CL, -87.4, CL);
  muret(ctx, -86.4, CL, -80, CL, C.crepiRose);
  haie(ctx, -74.4, CL, -66, CL, 2.1);
  c.pave(-87.2, 0, CL, -86.6, 0.03, 12, 0xb8b0a0, M.beton(), { crasse: false });
  c.pave(-79.7, 0, CL, -74.8, 0.03, 12, 0xa8a49a, M.beton(), { crasse: false });
  epave(c, -77.2, 9.1, -PI / 2 + 0.08, 0x6a3a34, "citadine", u);
  obstacleTourne(b, -77.2, 9.1, 3.6, 1.8, -PI / 2 + 0.08, "épave");
  drone(c, -90.5, 0.02, 8.8, 1.2, 0.4);
  haie(ctx, -95, CL + 0.2, -95, BORD);
  haie(ctx, -66, CL + 0.2, -66, BORD, 2.4);
  semerTouffes(c, -94, 6.6, -66, 34, Math.round(30 + 40 * u), C.herbeSeche);
  arbre(c, -70, 28, 7, "feuillu");
  arbre(c, -91, 27, 5, u > 0.6 ? "mort" : "feuillu");
  massif(c, -94, 22, -90, 33, 3, 1.1);
  lierre(c, -80.1, 0, 18, PI / 2, 3, 1.6 + u, Math.round(10 + 14 * u));
}

/** Le square : bancs, jeux d'enfants rouillés, l'abribus et son affiche. */
function square(ctx) {
  if (!ici(ctx, -58)) return;
  const { b, c, u } = ctx;
  // l'abribus (côté nord) : toit de verre, banc, affiche WattyDrop
  c.repere({ x: -58, z: -CL + 0.1 }, () => {
    for (const s of [-1, 1]) c.boite(0.08, 2.4, 0.08, 0x4a524e, { x: s * 1.6, y: 1.2, z: -0.6 }, M.tole());
    c.boite(3.4, 0.06, 1.5, 0x4a524e, { y: 2.42, z: 0.0 }, M.tole());
    if (u < 0.6) c.boite(3.2, 0.02, 1.3, 0xffffff, { y: 2.46 }, M.verre(), { crasse: false });
    c.boite(3.2, 1.9, 0.03, 0xffffff, { y: 1.2, z: -0.65 }, M.verre(), { crasse: false });
    c.boite(2.4, 0.06, 0.4, 0x8a8c88, { y: 0.5, z: -0.35 }, M.metal());
    c.boite(1.3, 1.9, 0.12, 0x3a3e3c, { x: 1.0, y: 1.25, z: -0.75 }, M.tole());
    panneau(c, "pub", 1.0, 1.3, -0.68, 1.1, 0.74);
  });
  b.obstacle(-59.6, -CL - 0.5, -56.4, -CL - 0.5, "abribus");
  // les bancs, le jeu à ressort, la balançoire
  for (const [x, z, r] of [[-61, -14, 0.1], [-54, -22, -0.3]]) {
    c.repere({ x, z, ry: r }, () => {
      c.boite(1.8, 0.06, 0.45, C.boisGris, { y: 0.45 }, M.mat());
      c.boite(1.8, 0.4, 0.05, C.boisGris, { y: 0.75, z: -0.22 }, M.mat());
      for (const s of [-1, 1]) c.boite(0.06, 0.45, 0.4, 0x3a3e3c, { x: s * 0.8, y: 0.22 }, M.tole());
    });
  }
  c.repere({ x: -57, z: -17 }, () => {
    c.tube([0, 0, 0], [0, 0.45, 0], 0.08, 0x8a8c88, M.metal(), 6);
    c.boite(0.9, 0.35, 0.35, 0xc79a3b, { y: 0.65, rz: 0.15 }, M.satin());
    boule(c, 0.4, 0.95, 0, 0.18, 0xc79a3b, M.satin());
  });
  c.repere({ x: -60.5, z: -26 }, () => {
    for (const s of [-1, 1]) {
      c.poutre([s * 1.5, 0, -0.8], [s * 1.5, 2.3, 0], 0.07, C.rouille, M.tole());
      c.poutre([s * 1.5, 0, 0.8], [s * 1.5, 2.3, 0], 0.07, C.rouille, M.tole());
    }
    c.poutre([-1.5, 2.3, 0], [1.5, 2.3, 0], 0.08, C.rouille, M.tole());
    c.tube([-0.4, 2.3, 0], [-0.4, 0.5, 0.1], 0.01, 0x6a6a68, M.metal(), 3);
    c.tube([0.2, 2.3, 0], [0.2, 0.5, 0.1], 0.01, 0x6a6a68, M.metal(), 3);
    c.boite(0.7, 0.04, 0.25, 0x2a2a2a, { x: -0.1, y: 0.5, z: 0.1 }, M.mat());
  });
  arbre(c, -63, -30, 8, "feuillu");
  arbre(c, -52, -12, 6.5, u > 0.5 ? "mort" : "bouleau");
  arbre(c, -52.5, -29, 7, "bouleau");
  semerTouffes(c, -65, -34, -49, -7, Math.round(30 + 40 * u), C.herbeSeche);
  jonchee(c, -65, -34, -49, -7, Math.round(30 + 20 * u));
  // La partie sud : la camionnette WattyDrop a fini dans la haie
  epave(c, -60, 10.5, 0.6, 0xe0dcd0, "utilitaire", u);
  panneau(c, "wattydrop", -60 + Math.sin(0.6) * 0.89, 1.3, 10.5 + Math.cos(0.6) * 0.89, 1.6, 0.4, 0.6);
  obstacleTourne(b, -60, 10.5, 5, 1.8, 0.6, "épave");
  for (let i = 0; i < 6; i++) carton(c, -57.5 + c.entre(-1.5, 1.5), 0, 12.5 + c.entre(-1, 1.5), c.hasard() * 3, 0.5, 0.35, 0.4);
  massif(c, -64, 16, -50, 33, 7, 1.3);
  arbre(c, -55, 26, 7.5, "feuillu");
  semerTouffes(c, -65, 7, -49, 34, Math.round(30 + 40 * u), C.herbeSeche);
  // Les épaves de la rue
  epave(c, -80, -1.9, PI + 0.25, 0x3a4a5a, "berline", u);
  obstacleTourne(b, -80, -1.9, 4.4, 1.8, PI + 0.25, "épave");
  epave(c, -63, 2.0, -0.12, 0x9a8a5a, "break", u);
  obstacleTourne(b, -63, 2.0, 4.4, 1.8, -0.12, "épave");
  poubelle(c, -70.6, -5.0, 0.2, 0x4a6a4a, true);
  poubelle(c, -69.8, 5.0, 0, 0xc79a3b);
}

// ---------- 2. La rue de l'épicerie ----------

/** L'épicerie du Passage : vitrines brisées, rideau métallique à demi levé, gondoles pillées, réserve, cour. */
function epicerie(ctx) {
  if (!ici(ctx, -39.5)) return;
  const { b, c, u } = ctx;
  const H = 3.6;
  const k = coque(ctx, {
    x0: -46, x1: -33, z0: 7.5, z1: 21, h: H, nom: "épicerie", couleur: 0xd8cdb4, angle: 0xc8bca0, hautCouche: H + 1.2,
    ouv: {
      n: [fen(-43, 3.4, { bas: 0.55, haut: 2.6, croisillons: 2, traverses: 1, bris: 0.95, cadre: 0x2f5a3c }), vide(-39.3, 1.8, 2.5), fen(-35.6, 3.0, { bas: 0.55, haut: 2.6, croisillons: 2, traverses: 1, bris: 0.8, cadre: 0x2f5a3c })],
      e: [fen(12, 1.2, { bris: 0.9, bas: 1.4, haut: 2.4 }), porteF(19, 1.0, { couleurPorte: 0x5a6a5a, angle: 1.6 })],
      s: [porteF(-40, 1.0, { vantail: "tombe" })],
    },
  });
  cloison(ctx, k, [-46, 16], [-33, 16], H, [11]);
  c.pave(-46, 0, 7.5, -33, 0.04, 21, 0xd0ccc4, M.carrelage(), { crasse: false });
  // le toit-terrasse, l'acrotère, le drone, l'enseigne
  k.pave(-46.3, H, 7.2, -32.7, H + 0.25, 21.3, 0x8a8a84, M.enduit());
  k.pave(-46.3, H + 0.25, 7.2, -32.7, H + 0.7, 7.45, 0xd8cdb4, M.enduit());
  k.pave(-46.3, H + 0.25, 7.2, -46.05, H + 0.7, 21.3, 0xd8cdb4, M.enduit());
  k.pave(-32.95, H + 0.25, 7.2, -32.7, H + 0.7, 21.3, 0xd8cdb4, M.enduit());
  k.pave(-46.3, H + 0.25, 21.05, -32.7, H + 0.7, 21.3, 0xd8cdb4, M.enduit());
  drone(k, -37, H + 0.27, 14, 0.4, 0.1, true, M.mat());
  c.boite(5.8, 0.06, 1.1, 0x2f5a3c, { x: -39.5, y: 2.85, z: 6.95, rx: -0.35 }, M.mat()); // le store déchiré
  k.pave(-45.6, 2.75, 7.25, -33.4, 3.45, 7.33, 0x2f5a3c, M.mat());
  panneau(k, "epicerie", -39.5, 3.1, 7.2, 5.6, 0.68, PI); // dans la couche : on ne la voit pas à l'envers par le mur effacé
  // l'enseigne en drapeau à l'angle (lisible depuis la rue des deux côtés) et la réclame peinte du pignon est
  c.boite(0.06, 0.06, 1.0, 0x2a2a2a, { x: -33.6, y: 3.0, z: 7.0 }, M.metal());
  c.boite(1.5, 0.5, 0.04, 0x2f5a3c, { x: -33.6, y: 2.55, z: 6.7, ry: PI / 2 }, M.mat());
  panneau(c, "epicerie", -33.62 + 0.03, 2.55, 6.7, 1.4, 0.36, PI / 2);
  panneau(c, "epicerie", -33.62 - 0.03, 2.55, 6.7, 1.4, 0.36, -PI / 2);
  panneau(c, "epicerie", -32.85, 1.75, 9.6, 3.2, 0.74, PI / 2);
  // vitrophanies et rideau métallique
  panneau(k, "drone12", -36.6, 1.9, 7.2, 1.0, 0.33, PI);
  panneau(k, "ouvert", -42.2, 1.9, 7.2, 1.0, 0.33, PI);
  c.pave(-40.25, 1.7, 7.15, -38.35, 2.5, 7.3, 0xa8aaa4, M.tole()); // le rideau relevé de travers
  c.boite(1.9, 0.3, 0.3, 0x8a8c88, { x: -39.3, y: 2.65, z: 7.25 }, M.tole());
  // les gondoles pillées
  for (const x of [-43.6, -41, -38.4]) {
    etagere(c, x, 12.2, PI / 2, 4.6, 1.6, 0.7, 0xd8d6d0, 4, M.satin());
    for (let i = 0; i < 6; i++) if (c.hasard() < 0.5) cylY(c, x + c.entre(-0.25, 0.25), c.entre(10.2, 14.2), 0.17 + Math.floor(c.hasard() * 3) * 0.48, 0.3 + Math.floor(c.hasard() * 3) * 0.48, 0.05, 0.05, [0xc8362b, 0xc79a3b, 0x2f6f73][i % 3], M.lisse(), 6);
    b.obstacle(x, 9.9, x, 14.5, "gondole");
  }
  // le comptoir et la caisse
  c.pave(-36.6, 0, 9.2, -34, 1.0, 10.1, 0x8a6a48, M.satin());
  c.pave(-36.7, 1.0, 9.1, -33.9, 1.05, 10.2, 0xb0a890, M.lisse());
  c.boite(0.45, 0.25, 0.4, 0x2a2a2a, { x: -35.2, y: 1.18, z: 9.65, ry: 0.3 }, M.lisse());
  c.boite(0.12, 0.2, 0.08, 0x2a2a2a, { x: -34.5, y: 1.15, z: 9.5 }, M.lisse());
  b.obstacle(-36.6, 9.65, -34, 9.65, "comptoir");
  // les vitrines réfrigérées, le néon de secours
  for (let i = 0; i < 4; i++) {
    c.boite(0.8, 2.1, 1.2, 0xd8d6d0, { x: -33.6, y: 1.05, z: 9.8 + i * 1.3 }, M.satin());
    c.boite(0.02, 1.6, 1.0, 0xffffff, { x: -34.02, y: 1.1, z: 9.8 + i * 1.3 }, M.verre(), { crasse: false });
  }
  c.boite(0.5, 0.18, 0.05, 0x5fd08a, { x: -36, y: 2.35, z: 15.85 }, M.lisse(), { crasse: false });
  b.lumiere(-36, 2.2, 15.4, 0x7fe0a0, 2, 6, "néon de secours sur batterie (« Sortie »)");
  // le caddie renversé, les paquets éventrés
  c.repere({ x: -42, z: 9, ry: 0.8, rz: PI / 2 - 0.1, y: 0.4 }, () => {
    c.boite(0.9, 0.6, 0.55, 0x9a9c98, { y: 0.0 }, M.grillage());
    c.boite(0.9, 0.04, 0.55, 0x8a8c88, { y: -0.35 }, M.metal());
  });
  jonchee(c, -45.5, 8, -33.5, 15.5, Math.round(40 + 40 * u), [0xc8362b, 0xc79a3b, 0xe9dfc6, 0x2f6f73, 0x9c7a45], 0.05);
  // la réserve
  for (const x of [-45.2, -43.4]) etagere(c, x, 18.5, PI / 2, 4, 2.2, 0.8, 0x8a8c88, 4, M.tole());
  for (let i = 0; i < 8; i++) carton(c, c.entre(-44.5, -36), 0.04, c.entre(16.6, 20.4), c.hasard() * 3, 0.6, 0.4, 0.45);
  c.boite(1.6, 0.85, 0.75, 0xe0ded8, { x: -37.5, y: 0.43, z: 20.4 }, M.lisse()); // le congélateur coffre
  // la cour : palettes, bacs, poubelles ; la ruelle
  for (let i = 0; i < 3; i++) c.boite(1.2, 0.14, 0.8, C.boisGris, { x: -44 + i * 0.1, y: 0.07 + i * 0.15, z: 23, ry: i * 0.1 }, M.mat());
  poubelle(c, -36, 22.5, 0.3, 0x4a6a4a);
  poubelle(c, -35, 22.7, -0.2, 0xc79a3b, true);
  mur(c, [-46, 26], [-30, 26], { h: 1.9, ep: 0.2, couleur: 0xb4ada0, mat: M.beton(), batiment: b });
  mur(c, [-46, 21], [-46, 26], { h: 1.9, ep: 0.2, couleur: 0xb4ada0, mat: M.beton(), batiment: b });
  muret(ctx, -48, CL, -46.2, CL, 0xd8cdb4);
  haie(ctx, -48, CL + 0.3, -48, BORD, 2.4);
  semerTouffes(c, -47, 21.5, -30, 34, Math.round(20 + 30 * u), C.herbeSeche);
  arbre(c, -40, 30, 7, "feuillu");
  massif(c, -47, 27, -30, 34, 5, 1.2);
  lierre(c, -46.1, 0, 14, -PI / 2, 5, 2.5 + u, Math.round(16 + 20 * u));
}

/** Le parking de l'épicerie, la camionnette, les colonnes à verre, le poste électrique de quartier. */
function parking(ctx) {
  if (!ici(ctx, -20)) return;
  const { b, c, u } = ctx;
  c.pave(-31, 0, CL, -8, 0.025, 16.5, C.bitume, M.bitume(), { crasse: false });
  for (let x = -29; x < -10; x += 2.6) c.pave(x, 0.025, 11, x + 0.1, 0.03, 16, C.marquage, M.mat(), { crasse: false });
  epave(c, -22, 11, 0.3, 0xe0dcd0, "utilitaire", u);
  panneau(c, "wattydrop", -22 + Math.sin(0.3) * 0.89, 1.3, 11 + Math.cos(0.3) * 0.89, 1.6, 0.4, 0.3);
  obstacleTourne(b, -22, 11, 5, 1.8, 0.3, "camionnette");
  for (let i = 0; i < 7; i++) carton(c, -20 + c.entre(-1.5, 2), 0.02, 13.4 + c.entre(-0.6, 1.4), c.hasard() * 3, 0.45, 0.32, 0.38);
  epave(c, -15.5, 13.5, PI / 2 - 0.2, 0x5a6a4a, "citadine", u);
  obstacleTourne(b, -15.5, 13.5, 3.6, 1.8, PI / 2 - 0.2, "épave");
  // les caddies, les colonnes à verre
  for (const [x, z, r] of [[-27, 9, 0.4], [-26, 14.5, 2.1]]) {
    c.repere({ x, z, ry: r }, () => {
      c.boite(0.9, 0.6, 0.55, 0x9a9c98, { y: 0.7 }, M.grillage());
      c.boite(0.9, 0.04, 0.55, 0x8a8c88, { y: 0.4 }, M.metal());
      for (const sx of [-0.4, 0.4]) cylZ(c, sx, 0.08, 0, 0.07, 0.5, 0x2a2a2a, M.mat(), 6);
    });
  }
  for (let i = 0; i < 2; i++) {
    c.repere({ x: -29.6 + i * 1.6, z: 18 }, () => {
      cylY(c, 0, 0, 0, 1.6, 0.65, 0.6, [0x5a7a3a, 0xc79a3b][i], M.satin(), 8);
      boule(c, 0, 1.62, 0, 0.55, [0x5a7a3a, 0xc79a3b][i], M.satin(), [1, 0.3, 1]);
    });
  }
  // Le poste électrique de quartier (porte forcée : du cuivre pour les Voltaïques)
  c.repere({ x: -12, z: 12 }, () => {
    c.boite(3.2, 2.5, 2.4, 0xc0bcb2, { y: 1.25 }, M.beton());
    c.boite(3.5, 0.15, 2.7, 0x9a968e, { y: 2.55 }, M.beton());
    c.boite(1.0, 2.0, 0.05, 0x5a6a62, { x: 0.6, y: 1.0, z: -1.4, ry: -1.2 }, M.tole());
    c.boite(0.9, 1.9, 0.02, 0x1c1c1c, { x: 0.6, y: 0.97, z: -1.2 }, M.mat());
  });
  obstacleRect(b, -13.6, 10.8, -10.4, 13.2, "poste électrique");
  haie(ctx, -31, 16.8, -8, 16.8, 2.0);
  grillage(ctx, -8, CL, -8, BORD, 1.6);
  semerTouffes(c, -30, 17.5, -8.5, 34, Math.round(25 + 40 * u), C.herbeSeche);
  arbre(c, -24, 26, 8, "feuillu");
  arbre(c, -14, 30, 6, "bouleau");
  massif(c, -30, 20, -10, 33, 6, 1.4);
  semerTouffes(c, -31, CL, -8, 16.5, Math.round(15 + 25 * u), C.herbeSeche, 0.025);
}

/** Le chantier de la « Résidence Les Jardins Connectés » : palissade, dalle, murs de parpaings, grue figée, cabane. */
function chantier(ctx) {
  if (!ici(ctx, -38)) return;
  const { b, c, u } = ctx;
  palissade(ctx, -48, -6.4, -36.6, -6.4, 2.2, [["residence", 4, 2.4, 1.2], ["pub", 8.6, 1.8, 1.2]]);
  palissade(ctx, -34.4, -6.4, -28, -6.4, 2.2, [["residence", 3.2, 2.4, 1.2]]);
  c.boite(1.2, 2.2, 0.03, 0xb8a888, { x: -35.2, y: 0.08, z: -5.2, rx: -PI / 2 + 0.05, ry: 0.2 }, M.mat()); // le panneau arraché, à plat
  palissade(ctx, -48, -6.4, -48, -BORD, 2.2);
  palissade(ctx, -28, -6.4, -28, -BORD, 2.2);
  // la lampe de chantier qui clignote encore
  c.boite(0.25, 0.25, 0.12, 0xd08a2a, { x: -37, y: 2.35, z: -6.3 }, M.lisse());
  b.lumiere(-37, 2.4, -6.0, 0xffa030, 2.2, 5, "lampe de chantier solaire, orange, qui clignote encore");
  // le sol de chantier, la dalle
  c.pave(-47.8, 0, -34.4, -28.2, 0.02, -6.6, C.terre, M.mat(), { crasse: false, nuance: 0.03 });
  c.pave(-45, 0, -24, -33, 0.08, -12, 0xb8b4aa, M.beton(), { crasse: false });
  // les murs de parpaings, montés à différentes hauteurs ; les fers en attente
  const parpaing = { ep: 0.2, couleur: 0xa8a49a, mat: M.beton(), batiment: b, arase: 0.15 };
  mur(c, [-45, -24], [-33, -24], { ...parpaing, h: 2.4, ouvertures: [{ u: 3, l: 1.2, bas: 0.9, haut: 2.1, type: "vide" }, { u: 8, l: 1.2, bas: 0.9, haut: 2.1, type: "vide" }], breches: [{ u: 11, l: 2, profondeur: 1.2 }] });
  mur(c, [-45, -12], [-45, -24], { ...parpaing, h: 1.6, ouvertures: [{ u: 6, l: 1, bas: 0, haut: 2.1, type: "vide" }] });
  mur(c, [-33, -24], [-33, -17], { ...parpaing, h: 1.1 });
  mur(c, [-45, -12], [-40, -12], { ...parpaing, h: 0.6 });
  for (let x = -45; x <= -33; x += 1.5) for (const z of [-24, -12]) if (c.hasard() < 0.6) c.tube([x, 0.5, z], [x + c.entre(-0.1, 0.1), z === -24 ? 3.2 : 1.5, z], 0.012, C.rouille, M.tole(), 3);
  // l'échafaudage le long du mur nord
  for (let x = -44.5; x <= -33.5; x += 2.5) for (const z of [-24.6, -25.6]) c.tube([x, 0, z], [x, 3.6, z], 0.025, 0x8a8c88, M.metal(), 4);
  for (const y of [1.8, 3.4]) {
    for (const z of [-24.6, -25.6]) c.tube([-44.5, y, z], [-34.5, y, z], 0.025, 0x8a8c88, M.metal(), 4);
    c.pave(-44.5, y, -25.6, -34.5, y + 0.05, -24.6, C.boisGris, M.mat());
  }
  // la bétonnière, les palettes de parpaings, les sacs de ciment
  c.repere({ x: -37.5, z: -9.6, ry: 0.5 }, () => {
    for (const sx of [-0.5, 0.5]) c.poutre([sx, 0, 0], [0, 1.1, 0], 0.06, 0xc79a3b, M.tole());
    const g = new THREE.CylinderGeometry(0.35, 0.55, 1.0, 8, 1, true);
    c.poser(g, M.tole(), 0xc79a3b, { y: 1.2, rz: 0.8 });
    g.dispose();
    cylZ(c, 0, 0.25, 0.5, 0.25, 0.1, 0x1c1c1c, M.mat(), 8);
  });
  for (const [x, z] of [[-31, -10], [-31, -12], [-41, -28]]) {
    c.boite(1.2, 0.12, 1.0, C.boisGris, { x, y: 0.06, z }, M.mat());
    c.boite(1.2, 0.6, 1.0, 0xa8a49a, { x, y: 0.42, z }, M.beton());
  }
  for (let i = 0; i < 5; i++) c.boite(0.45, 0.14, 0.7, 0xc8c0b0, { x: -30.5 + c.entre(-0.3, 0.3), y: 0.07 + i * 0.14, z: -15, ry: c.entre(-0.2, 0.2) }, M.mat());
  gravats(c, -38, -18, 1.5, Math.round(6 + 10 * u), [0xa8a49a, 0xb8b4aa, 0x8a8680]);
  // la cabane de chantier (bungalow métallique), visitable
  const k = coque(ctx, {
    x0: -46.6, x1: -40.4, z0: -31.6, z1: -28.4, h: 2.5, nom: "cabane de chantier", couleur: 0xe0dcd0, mat: M.ondule(), ep: 0.12,
    interieur: { couleur: 0xd8d4c8, mat: M.mat(), crasse: false },
    ouv: { s: [porteF(-42, 0.9, { couleurPorte: 0xe0dcd0 }), fen(-45, 1.2, { bris: 0.7, cadre: 0x8a8c88 })], e: [fen(-30, 0.8, { bris: 0.5 })] },
  });
  k.pave(-46.8, 2.5, -31.8, -40.2, 2.7, -28.2, 0xd8d4c8, M.ondule());
  c.pave(-46.6, 0, -31.6, -40.4, 0.06, -28.4, 0x8a8478, M.mat(), { crasse: false });
  table(c, -44.6, -30.4, 1.6, 0.8, 0xd8d4c8);
  c.boite(1.2, 0.01, 0.6, 0xc8d8e8, { x: -44.6, y: 0.79, z: -30.4, ry: 0.1 }, M.mat()); // les plans
  for (let i = 0; i < 3; i++) boule(c, -45.6 + i * 0.4, 0.84, -30.9, 0.13, 0xd8b83a, M.satin(), [1, 0.6, 1]); // les casques
  c.boite(0.7, 0.3, 1.8, 0x5a6a4a, { x: -41.3, y: 0.3, z: -30, ry: 0 }, M.mat()); // le lit de camp
  chaise(c, -43.5, -29.6, PI);
  // la grue à tour, figée, flèche vers l'ouest
  grue(ctx, -30.6, -29.5, u);
  semerTouffes(c, -47.5, -34, -28.5, -7, Math.round(20 + 35 * u), C.herbeSeche, 0.02);
  debris(c, -47, -33, -29, -7, Math.round(15 + 20 * u), [0xa8a49a, 0xb8b4aa, 0x8a8680], 0.02);
}

/** La grue à tour : mât en treillis, flèche, contre-flèche et son lest, cabine, crochet qui pend. */
function grue(ctx, x, z, u) {
  const { b, c } = ctx;
  const H = 21;
  const s = 0.75; // demi-côté du mât
  const coul = 0xc79a3b;
  c.pave(x - 1.6, 0, z - 1.6, x + 1.6, 0.6, z + 1.6, 0x9a968e, M.beton());
  for (let y = 0.6; y < H; y += 1.5) {
    for (const [dx, dz] of [[-s, -s], [s, -s], [s, s], [-s, s]]) c.pave(x + dx - 0.06, y, z + dz - 0.06, x + dx + 0.06, y + 1.5, z + dz + 0.06, coul, M.tole(), { crasse: false });
    const cotes = [[[-s, -s], [s, -s]], [[s, -s], [s, s]], [[s, s], [-s, s]], [[-s, s], [-s, -s]]];
    for (const [[x1, z1], [x2, z2]] of cotes) c.poutre([x + x1, y, z + z1], [x + x2, y + 1.5, z + z2], 0.05, coul, M.tole(), { crasse: false });
  }
  // la cabine, la pivot, la flèche (vers l'ouest) et la contre-flèche (vers l'est)
  c.pave(x - 1, H, z - 1, x + 1, H + 0.5, z + 1, 0x8a8c88, M.tole());
  c.pave(x + 0.2, H - 1.8, z + 0.8, x + 1.6, H, z + 2.2, 0xe0dcd0, M.satin());
  c.pave(x + 0.25, H - 1.3, z + 2.21, x + 1.55, H - 0.4, z + 2.23, 0x2a3236, M.lisse());
  const L = 17;
  for (const zz of [z - 0.5, z + 0.5]) c.pave(x - L, H + 0.5, zz - 0.06, x + 1, H + 0.62, zz + 0.06, coul, M.tole(), { crasse: false });
  c.pave(x - L, H + 1.6, z - 0.06, x + 1, H + 1.72, z + 0.06, coul, M.tole(), { crasse: false });
  for (let xx = x - L; xx < x; xx += 1.6) {
    c.poutre([xx, H + 0.55, z - 0.5], [xx + 0.8, H + 1.66, z], 0.04, coul, M.tole(), { crasse: false });
    c.poutre([xx + 0.8, H + 1.66, z], [xx + 1.6, H + 0.55, z + 0.5], 0.04, coul, M.tole(), { crasse: false });
  }
  c.pave(x, H + 0.5, z - 0.6, x + 8, H + 0.7, z + 0.6, coul, M.tole(), { crasse: false });
  c.pave(x + 6, H - 0.8, z - 0.8, x + 8, H + 0.5, z + 0.8, 0x9a968e, M.beton());
  c.poutre([x, H + 4.2, z], [x - L * 0.6, H + 1.7, z], 0.05, 0x5a5a58, M.metal());
  c.poutre([x, H + 4.2, z], [x + 7, H + 0.7, z], 0.05, 0x5a5a58, M.metal());
  c.pave(x - 0.3, H + 0.5, z - 0.3, x + 0.3, H + 4.3, z + 0.3, coul, M.tole());
  // le chariot et le crochet qui pend, une palette accrochée
  const xc = x - 11;
  c.pave(xc - 0.5, H + 0.3, z - 0.6, xc + 0.5, H + 0.5, z + 0.6, 0x5a5a58, M.tole());
  c.tube([xc, H + 0.3, z], [xc + 0.3, 6.5, z + 0.2], 0.015, 0x3a3a3a, M.metal(), 3);
  c.pave(xc + 0.1, 6.0, z - 0.1, xc + 0.5, 6.5, z + 0.5, 0xc79a3b, M.tole());
  c.boite(1.2, 0.5, 1.0, 0xa8a49a, { x: xc + 0.3, y: 5.4, z: z + 0.2, rz: 0.05 }, M.beton());
  obstacleRect(b, x - 1.6, z - 1.6, x + 1.6, z + 1.6, "pied de grue");
}

/** Le troisième pavillon (côté nord) : séjour à l'écran tombé, cuisine. */
function pavillon3(ctx) {
  if (!ici(ctx, -19)) return;
  const { b, c, u } = ctx;
  const bris = 0.4 + 0.5 * u;
  const H = 2.6;
  const k = coque(ctx, {
    x0: -24, x1: -14, z0: -20, z1: -12, h: H, nom: "pavillon 3", couleur: C.crepiJaune, angle: 0xc8b088,
    ouv: {
      s: [fen(-21.5, 2.2, { bas: 0.05, haut: 2.2, croisillons: 2, traverses: 1, bris: 0.9, cadre: C.alu }), porteF(-16.8, 1.0, { couleurPorte: 0x3a5a6a, vantail: "tombe" })],
      e: [fen(-16, 1.0, { bris, volet: "ouvert", couleurVolet: 0x6a7a5a })],
      n: [fen(-21, 1.2, { bris }), fen(-16, 1.0, { bris })],
      o: [fen(-16, 1.0, { bris })],
    },
    breches: u > 0.55 ? { e: [{ u: 6.5, l: 2, profondeur: 1.0 }] } : {},
  });
  cloison(ctx, k, [-18.5, -20], [-18.5, -12], H, [5]);
  c.pave(-24, 0, -20, -18.5, 0.04, -12, 0xb09474, M.parquet(), { crasse: false });
  c.pave(-18.5, 0, -20, -14, 0.04, -12, 0xd4d0c4, M.carrelage(), { crasse: false });
  toitTuiles(k, { x0: -24, x1: -14, z0: -20, z1: -12, h: H, hf: 1.8, couleur: C.tuile, pignon: C.crepiJaune, trous: u > 0.35 ? [{ u: -2, v: 1, l: 2.6, p: 0.7 }] : [] });
  // l'écran géant arraché de son support, face contre terre ; le canapé, la console
  c.boite(2.6, 0.08, 1.5, 0x18191a, { x: -22, y: 0.1, z: -17.6, ry: 0.15, rz: 0.04 }, M.lisse());
  c.boite(0.4, 0.3, 0.12, 0x2a2a2a, { x: -23.8, y: 1.6, z: -17.6 }, M.metal());
  canape(c, -21, -14.2, PI, 2.2, 0x8a5a4a);
  table(c, -21, -15.6, 0.9, 0.5, 0x6a5a48, 0.3, 0.4);
  // la cuisine
  planTravail(c, -16.2, -19.5, 0, 3.4, 0xd8d0b8);
  frigo(c, -14.6, -14.5, -PI / 2, true);
  table(c, -16.5, -15, 1.0, 0.8);
  chaise(c, -17.3, -15, PI / 2, C.bois, true);
  jonchee(c, -24, -20, -14, -12, 12, [0xe9dfc6, 0x9c7a45, 0xc8362b], 0.05);
  // le jardin, le muret, les haies
  leLongX(ctx, -28, -17.6, (a, bb) => muret(ctx, a, -CL, bb, -CL, C.crepiJaune));
  muret(ctx, -16.4, -CL, -8, -CL, C.crepiJaune);
  c.pave(-17.4, 0, -12, -16.4, 0.03, -CL, 0xb8b0a0, M.beton(), { crasse: false });
  haie(ctx, -8, -CL - 0.2, -8, -BORD, 2.2);
  semerTouffes(c, -27.5, -34, -8.5, -6.6, Math.round(25 + 35 * u), C.herbeSeche);
  arbre(c, -12, -27, 7, "feuillu");
  arbre(c, -25, -30, 6, u > 0.5 ? "mort" : "feuillu");
  massif(c, -27, -11, -24.5, -7, 2, 1);
  lierre(c, -14.1, 0, -14, PI / 2, 3, 2 + u, Math.round(10 + 16 * u));
  // la niche et la tondeuse-robot perdue dans l'herbe
  c.repere({ x: -10.5, z: -16, ry: -0.6 }, () => {
    c.boite(0.9, 0.7, 1.1, 0x9a7a5a, { y: 0.35 }, M.mat());
    c.boite(1.0, 0.06, 0.7, 0x6a4a3a, { y: 0.85, z: 0.28, rx: 0.6 }, M.mat());
    c.boite(1.0, 0.06, 0.7, 0x6a4a3a, { y: 0.85, z: -0.28, rx: -0.6 }, M.mat());
  });
  c.boite(0.55, 0.22, 0.65, 0x5a7a5a, { x: -12.5, y: 0.12, z: -9, ry: 0.7 }, M.satin());
}

/** La friche avant la voie, côté nord-ouest : herbes hautes, un arbre mort, l'affiche du train autonome. */
function abordsOuest(ctx) {
  const { b, c, u } = ctx;
  // l'affiche du train autonome, sur deux poteaux, face à la rue
  if (ici(ctx, XV - 9)) c.repere({ x: XV - 9, z: -CL - 0.2 }, () => {
    for (const s of [-1, 1]) c.boite(0.1, 2.6, 0.1, 0x6a6c68, { x: s * 1.6, y: 1.3, z: -0.05 }, M.metal());
    c.boite(3.9, 1.12, 0.06, 0x3a3c3a, { y: 2.05, z: -0.06 }, M.tole());
    panneau(c, "autonome", 0, 2.05, -0.02, 3.6, 1.0);
  });
  if (ici(ctx, XV - 9)) b.obstacle(XV - 10.6, -CL - 0.3, XV - 7.4, -CL - 0.3, "affiche");
  // la file d'épaves arrêtées devant la barrière (voie sud, vers l'est)
  for (const [x, coul, type, r] of [[-11.2, 0x7a8a6a, "berline", 0.04], [-4.4, 0x9a3a32, "citadine", -0.05], [2.4, 0x4a5a7a, "break", 0.02]]) {
    if (!ici(ctx, x)) continue;
    epave(c, x, 1.8, r, coul, type, u);
    obstacleTourne(b, x, 1.8, type === "citadine" ? 3.6 : 4.4, 1.8, r, "épave");
  }
  if (ici(ctx, 2)) {
    arbre(c, 3.5, -12, 6.5, "mort");
    semerTouffes(c, 0.5, -24, 7, -6.6, Math.round(20 + 30 * u), C.herbeSeche);
    massif(c, 1, -33, 6, -25, 3, 1.4);
    semerTouffes(c, 0.5, 6.6, 9, 34, Math.round(20 + 30 * u), C.herbeSeche);
    massif(c, 0.5, 29, 3, 34, 3, 1.2);
  }
  if (ici(ctx, -4)) {
    semerTouffes(c, -7.5, -34, -0.5, -6.6, Math.round(20 + 25 * u), C.herbeSeche);
    massif(c, -7, -33, -1, -26, 4, 1.4);
  }
}

// ---------- 3. Le passage à niveau ----------

/** La voie : ballast, traverses, rails ; dans la rue, rails noyés et platelage ; le gravier entre les grillages. */
function voie(ctx) {
  if (!ici(ctx, XV)) return;
  const { c, u } = ctx;
  for (const [z1, z2] of [[-35, -TR], [TR, 35]]) {
    c.pave(XG1, 0, z1, XG2, 0.02, z2, C.gravier, M.mat(), { crasse: false, nuance: 0.02 });
    c.pave(XV - 2.3, 0, z1, XV + 2.3, 0.13, z2, C.ballast, M.mat(), { crasse: false, nuance: 0.03 });
    c.pave(XV - 1.7, 0, z1, XV + 1.7, 0.26, z2, C.ballast, M.mat(), { crasse: false, nuance: 0.03 });
    for (let z = z1 + 0.3; z < z2; z += 0.62) c.boite(2.4, 0.13, 0.24, C.traverse, { x: XV, y: 0.31, z }, M.mat(), { nuance: 0.08 });
    for (const dx of [-0.72, 0.72]) {
      c.pave(XV + dx - 0.07, 0.37, z1, XV + dx + 0.07, 0.4, z2, C.rail, M.tole(), { crasse: false });
      c.pave(XV + dx - 0.035, 0.4, z1, XV + dx + 0.035, RT, z2, C.rail, M.metal(), { crasse: false });
    }
    semerTouffes(c, XG1 + 0.3, z1, XV - 2.2, z2, Math.round(15 + 30 * u), C.herbeSeche, 0.02);
    semerTouffes(c, XV + 2.2, z1, XG2 - 0.3, z2, Math.round(15 + 30 * u), C.herbeSeche, 0.02);
    semerTouffes(c, XV - 1.5, z1, XV + 1.5, z2, Math.round(6 + 20 * u), C.herbeSeche, 0.3);
  }
  // Dans la rue : rails noyés, platelage de caoutchouc
  for (const dx of [-0.72, 0.72]) c.pave(XV + dx - 0.04, 0, -TR, XV + dx + 0.04, 0.05, TR, C.rail, M.metal(), { crasse: false });
  for (const [x1, x2] of [[XV - 1.9, XV - 0.78], [XV - 0.66, XV + 0.66], [XV + 0.78, XV + 1.9]]) c.pave(x1, 0.03, -RW, x2, 0.045, RW, 0x3a3836, M.mat(), { crasse: false });
  for (let z = -RW + 1.2; z < RW; z += 1.2) c.pave(XV - 1.9, 0.045, z - 0.02, XV + 1.9, 0.05, z + 0.02, 0x2a2826, M.mat(), { crasse: false });
}

/** Les grillages le long de la voie, leurs brèches, et les retours le long des trottoirs. */
function grillagesVoie(ctx) {
  if (!ici(ctx, XV)) return;
  const t = (z1, z2, za, zb) => [(za - z1) / (z2 - z1), (zb - z1) / (z2 - z1)];
  grillage(ctx, XG1, -BORD, XG1, -CL + 0.6, 1.8, 0x5a6a5a, [t(-BORD, -CL + 0.6, -16, -13)], "grillage de la voie");
  grillage(ctx, XG2, -BORD, XG2, -CL + 0.6, 1.8, 0x5a6a5a, [], "grillage de la voie");
  grillage(ctx, XG1, CL - 0.6, XG1, BORD, 1.8, 0x5a6a5a, [t(CL - 0.6, BORD, 16.2, 25.8)], "grillage de la voie");
  grillage(ctx, XG2, CL - 0.6, XG2, BORD, 1.8, 0x5a6a5a, [t(CL - 0.6, BORD, 12.8, 15.8)], "grillage de la voie");
  for (const s of [-1, 1]) {
    grillage(ctx, XG1, s * (CL - 0.6), XV - 1.5, s * (CL - 0.6), 1.8, 0x5a6a5a, [], "grillage de la voie");
    grillage(ctx, XV + 1.5, s * (CL - 0.6), XG2, s * (CL - 0.6), 1.8, 0x5a6a5a, [], "grillage de la voie");
  }
  // les graffitis des survivants, sur des tôles accrochées au grillage
  const { c } = ctx;
  c.boite(2.0, 0.5, 0.03, 0x6a6c68, { x: XG1 - 0.05, y: 1.05, z: 15.2, ry: PI / 2 }, M.tole());
  panneau(ctx.c, "graffiti2", XG1 - 0.08, 1.05, 15.2, 2.0, 0.34, -PI / 2);
  // le grillage ouest est couché sous le conteneur tombé : des poteaux tordus
  for (let z = 17; z < 25.5; z += 2.5) c.boite(0.07, 1.8, 0.07, 0x5a6a5a, { x: XG1 - 0.6, y: 0.1, z, rz: PI / 2 - 0.2 }, M.tole());
}

/** Un bogie de wagon : châssis, deux essieux, quatre roues sur les rails (axe de la voie selon z). */
function bogie(c, x, z, yR = RT, ry = 0, rz = 0, k = c) {
  c.repere({ x, y: yR, z, ry, rz }, () => {
    c.pave(-1.1, 0.35, -1.25, 1.1, 0.75, 1.25, C.chassis, M.tole());
    for (const dz of [-0.9, 0.9]) {
      cylX(c, 0, 0.42, dz, 0.07, 1.7, 0x3a3836, M.metal(), 6);
      for (const dx of [-0.72, 0.72]) cylX(c, dx, 0.42, dz, 0.42, 0.12, 0x2a2826, M.tole(), 10);
    }
    for (const dx of [-1.15, 1.15]) c.pave(dx - 0.05, 0.25, -1.0, dx + 0.05, 0.8, 1.0, 0x3a3836, M.tole());
  });
}

/** Les tampons et l'attelage au bout d'un wagon (côté `s` = −1 nord, +1 sud), à la hauteur `y`. */
function tampons(c, z, s, y = 1.25) {
  for (const dx of [-0.88, 0.88]) {
    c.tube([XV + dx, y, z], [XV + dx, y, z + s * 0.42], 0.09, C.chassis, M.tole(), 6);
    cylZ(c, XV + dx, y, z + s * 0.45, 0.2, 0.05, 0x5a5a58, M.metal(), 8);
  }
  c.tube([XV, y - 0.05, z], [XV, y - 0.05, z + s * 0.5], 0.05, C.chassis, M.tole(), 4);
}

/** La locomotive diesel de manœuvre, cabine décentrée, capot long, sous la passerelle. */
function locomotive(ctx) {
  const { b, c, u } = ctx;
  const [z0, z1] = LOCO;
  const k = c; // pas de couche : on n'y entre pas
  for (const zb of [z0 + 2.4, z1 - 2.4]) bogie(c, XV, zb);
  c.pave(XV - 1.45, RT + 0.85, z0, XV + 1.45, RT + 1.2, z1, C.chassis, M.tole());
  // le capot long (côté nord), la cabine (côté sud), le capot court
  const col = 0x4f6a7a;
  const zc0 = z1 - 4.6;
  const zc1 = z1 - 1.8;
  c.pave(XV - 1.05, RT + 1.2, z0 + 0.4, XV + 1.05, 1.9, zc0, col, M.satin());
  k.pave(XV - 1.05, 1.9, z0 + 0.4, XV + 1.05, 3.5, zc0, col, M.satin());
  k.pave(XV - 1.06, 2.4, z0 + 0.4, XV + 1.06, 2.6, zc0, 0xd8c890, M.satin());
  for (let z = z0 + 1; z < zc0 - 0.5; z += 1.3) for (const s of [-1, 1]) k.pave(XV + s * 1.06 - 0.02, 2.75, z, XV + s * 1.06 + 0.02, 3.3, z + 0.9, 0x3a4a54, M.tole()); // les grilles
  k.pave(XV - 0.9, 3.5, z0 + 0.6, XV + 0.9, 3.6, zc0 - 0.2, 0x5a5a58, M.tole());
  cylY(k, XV, z0 + 2.5, 3.5, 4.1, 0.16, 0.16, 0x2a2a2a, M.tole(), 6); // l'échappement
  c.pave(XV - 1.45, RT + 1.2, zc0, XV + 1.45, 1.9, zc1, col, M.satin());
  k.pave(XV - 1.45, 1.9, zc0, XV + 1.45, 4.2, zc1, col, M.satin());
  k.pave(XV - 1.5, 4.2, zc0 - 0.1, XV + 1.5, 4.35, zc1 + 0.1, 0x5a5a58, M.tole());
  for (const s of [-1, 1]) k.pave(XV + s * 1.46 - 0.02, 2.9, zc0 + 0.3, XV + s * 1.46 + 0.02, 3.8, zc1 - 0.3, 0x1e2422, M.lisse());
  k.pave(XV - 1.2, 2.9, zc1 + 0.01, XV + 1.2, 3.8, zc1 + 0.03, 0x1e2422, M.lisse());
  c.pave(XV - 1.0, RT + 1.2, zc1, XV + 1.0, 2.6, z1 - 0.3, col, M.satin());
  for (const z of [z0 + 0.1, z1 - 0.1]) for (const dx of [-0.6, 0.6]) cylY(c, XV + dx, z, 1.7, 1.85, 0.1, 0.1, 0xd8d0b0, M.lisse(), 6);
  // les garde-corps de la coursive, la rouille, le lierre
  for (const s of [-1, 1]) c.pave(XV + s * 1.4 - 0.02, 1.7, z0 + 0.3, XV + s * 1.4 + 0.02, 1.74, zc0, 0xc79a3b, M.tole());
  tampons(c, z0, -1);
  tampons(c, z1, 1);
  lierre(c, XV + 1.08, 1.2, (z0 + zc0) / 2, PI / 2, zc0 - z0 - 1, 1.6 + u, Math.round(16 + 20 * u));
  for (let i = 0; i < 4; i++) mousse(k, XV + c.entre(-0.6, 0.6), 3.6, c.entre(z0 + 1, zc0 - 1), 0.4, 2, 0x5a7a3a);
  obstacleRect(b, XV - 1.5, z0, XV + 1.5, z1, "locomotive");
}

/** Le wagon porte-conteneurs : deux conteneurs de 20 pieds, l'un plein de trottinettes, l'autre de nains de jardin. */
function porteConteneurs(ctx) {
  const { b, c, u } = ctx;
  const [z0, z1] = PC;
  for (const zb of [z0 + 2.2, z1 - 2.2]) bogie(c, XV, zb);
  c.pave(XV - 1.3, RT + 0.85, z0, XV + 1.3, RT + 1.15, z1, C.chassis, M.tole());
  for (let z = z0 + 0.5; z < z1; z += 1.4) c.pave(XV - 1.32, RT + 0.85, z - 0.06, XV + 1.32, RT + 1.15, z + 0.06, 0x3a3836, M.tole());
  tampons(c, z0, -1);
  tampons(c, z1, 1);
  const y0 = RT + 1.15;
  // Le conteneur des trottinettes : portes latérales grandes ouvertes côté ouest
  conteneur(ctx, -22.6, -16.4, y0, 0x3d6f70, { ouest: true });
  for (let i = 0; i < 14; i++) trottinette(c, c.entre(10.4, 14.2), c.entre(-22.5, -15.5), c.hasard() * TAU, [0x3d8a7a, 0xc79a3b, 0xb8332a][i % 3], true, 0.06);
  for (let i = 0; i < 6; i++) trottinette(c, XV + c.entre(-0.9, 0.2), c.entre(-22, -17), c.hasard() * 0.5 + PI / 2, 0x3d8a7a, true, y0 + 0.05 + (i % 3) * 0.14);
  // Le conteneur des nains : le toit arraché, des nains partout
  conteneur(ctx, -15.4, -9.0, y0, 0xb08a3e, { toitOuvert: u > 0.25 });
  for (let i = 0; i < 18; i++) nain(c, XV + c.entre(-0.9, 0.9), c.entre(-15, -9.5), c.hasard() * TAU, c.hasard() < 0.4, y0 + 0.05, 1.2);
  for (let i = 0; i < 10; i++) nain(c, c.entre(10.2, 13.8), c.entre(-14.8, -9), c.hasard() * TAU, c.hasard() < 0.6, 0.03, 1.2);
  // les nains alignés en sentinelles par les survivants, le long du grillage, face à la rue
  for (let i = 0; i < 7; i++) nain(c, XG1 + 0.5 + (i % 2) * 0.3, -7.5 - i * 0.65, 0, false, 0.02, 1.25);
  obstacleRect(b, XV - 1.35, z0, XV + 1.35, z1, "wagon porte-conteneurs");
}

/**
 * Un conteneur de 20 pieds posé sur un wagon (axe selon z, de za à zb), en tôle ondulée.
 * `ouest` : portes latérales ouvertes côté ouest ; `toitOuvert` : le toit arraché.
 */
function conteneur(ctx, za, zb, y0, couleur, { ouest = false, toitOuvert = false } = {}) {
  const { b, c } = ctx;
  const H = 2.6;
  const l = 2.44;
  const x0 = XV - l / 2;
  const x1 = XV + l / 2;
  const k = c; // pas de couche : on n'y entre pas
  // le plancher, les longerons, les montants d'angle
  c.pave(x0, y0, za, x1, y0 + 0.15, zb, 0x5a4a3a, M.mat());
  for (const [x, z] of [[x0, za], [x1, za], [x0, zb], [x1, zb]]) c.pave(x - 0.08, y0, z - 0.08, x + 0.08, y0 + H, z + 0.08, couleur, M.tole());
  // les parois : bas toujours visible, haut dans la couche
  for (const [zz, ext] of [[za, -1], [zb, 1]]) {
    c.pave(x0, y0, zz - 0.03, x1, y0 + 1.0, zz + 0.03, couleur, M.ondule());
    k.pave(x0, y0 + 1.0, zz - 0.03, x1, y0 + H, zz + 0.03, couleur, M.ondule());
  }
  if (!ouest) {
    c.pave(x0 - 0.03, y0, za, x0 + 0.03, y0 + 1.0, zb, couleur, M.ondule());
    k.pave(x0 - 0.03, y0 + 1.0, za, x0 + 0.03, y0 + H, zb, couleur, M.ondule());
  } else {
    // deux grands vantaux ouverts, rabattus contre le flanc
    for (const [zc, s] of [[za + 0.1, -1], [zb - 0.1, 1]]) {
      c.repere({ x: x0 - 0.05, y: y0, z: zc, ry: s * 1.4 }, () => {
        c.pave(-0.03, 0.05, s > 0 ? -2.9 : 0, 0.03, H - 0.1, s > 0 ? 0 : 2.9, couleur, M.ondule());
      });
    }
  }
  c.pave(x1 - 0.03, y0, za, x1 + 0.03, y0 + 1.0, zb, couleur, M.ondule());
  k.pave(x1 - 0.03, y0 + 1.0, za, x1 + 0.03, y0 + H, zb, couleur, M.ondule());
  panneau(k, "fret", x1 + 0.05, y0 + 2.0, (za + zb) / 2, 3.6, 0.6, PI / 2);
  // le toit
  if (!toitOuvert) k.pave(x0, y0 + H - 0.05, za, x1, y0 + H + 0.05, zb, couleur, M.tole());
  else {
    k.pave(x0, y0 + H - 0.05, za, x1, y0 + H + 0.05, za + 1.5, couleur, M.tole());
    k.boite(2.6, 0.05, 2.0, couleur, { x: XV - 1.8, y: y0 + H - 0.5, z: zb - 1.4, rz: 1.1 }, M.tole()); // la tôle rabattue
  }
}

/** Le wagon couvert, sorti de ses bogies et affaissé sur la chaussée : on le traverse par ses portes coulissantes. */
function wagonCouvert(ctx) {
  const { b, c, u } = ctx;
  const [z0, z1] = WC;
  const x0 = XV - 1.45;
  const x1 = XV + 1.45;
  const H = 2.75;
  const col = 0x7a4634;
  const k = b.couche("wagon couvert", { x: XV, z: 0, l: 3.4, p: z1 - z0 + 0.4 }, F + COUPE, F + H + 0.5);
  // le châssis écrasé sur la chaussée, le plancher
  c.pave(x0 - 0.05, 0, z0, x1 + 0.05, F, z1, C.chassis, M.tole());
  c.pave(x0 + 0.05, F, z0 + 0.05, x1 - 0.05, F + 0.04, z1 - 0.05, 0x8a7458, M.mat(), { crasse: false });
  // les parois : portes coulissantes de 2,8 m au milieu des deux flancs
  const spec = { h: H, ep: 0.08, couleur: col, mat: M.tole(), y0: F, interieur: { couleur: 0x8a6a50, mat: M.mat(), crasse: false } };
  const porte = [{ u: z1, l: 2.8, bas: 0, haut: 2.5, type: "vide" }];
  murCoupe(ctx, k, [x0, z0], [x0, z1], { ...spec, ouvertures: [{ ...porte[0], u: -z0 }] });
  murCoupe(ctx, k, [x1, z1], [x1, z0], { ...spec, ouvertures: [{ ...porte[0], u: z1 }] });
  murCoupe(ctx, k, [x1, z0], [x0, z0], spec);
  murCoupe(ctx, k, [x0, z1], [x1, z1], spec);
  // les raidisseurs extérieurs
  for (let z = z0 + 0.6; z < z1; z += 1.25) {
    if (Math.abs(z) < 1.6) continue;
    for (const [x, s] of [[x0, -1], [x1, 1]]) {
      c.pave(x + s * 0.04, F, z - 0.06, x + s * 0.1, F + COUPE, z + 0.06, 0x5a3426, M.tole());
      k.pave(x + s * 0.04, F + COUPE, z - 0.06, x + s * 0.1, F + H, z + 0.06, 0x5a3426, M.tole());
    }
  }
  // les portes coulissantes, repoussées sur leurs rails (ouest vers le sud, est vers le nord)
  for (const [x, s, za] of [[x0 - 0.13, -1, 1.45], [x1 + 0.13, 1, -4.35]]) {
    c.pave(x - 0.03, F + 0.05, za, x + 0.03, F + COUPE, za + 2.9, 0x6a3a2c, M.tole());
    k.pave(x - 0.03, F + COUPE, za, x + 0.03, F + 2.55, za + 2.9, 0x6a3a2c, M.tole());
    k.pave(x - 0.06, F + 2.6, -4.6, x + 0.06, F + 2.68, 4.6, 0x3a3836, M.tole()); // le rail haut
  }
  // le toit bombé, une tôle arrachée au-dessus du brasero (la fumée sort par là)
  for (const [dx, rz, l] of [[0, 0, 1.4], [-1.0, 0.32, 0.9], [1.0, -0.32, 0.9]]) {
    if (dx === 0) {
      k.boite(1.4, 0.06, z1 + 2.6, 0x5a5650, { x: XV, y: F + H + 0.22, z: (z1 - 2.6) / 2 }, M.tole());
      k.boite(1.4, 0.06, 3.05, 0x5a5650, { x: XV, y: F + H + 0.22, z: z0 + 1.525 }, M.tole());
    } else k.boite(l, 0.06, z1 - z0 + 0.1, 0x5a5650, { x: XV + dx, y: F + H + 0.05, z: (z0 + z1) / 2, rz }, M.tole());
  }
  panneau(c, "fret", x1 + 0.12, F + 2.3, -5, 3.0, 0.5, PI / 2);
  panneau(c, "graffiti1", x1 + 0.12, F + 0.55, 3.6, 2.8, 0.45, PI / 2);
  panneau(c, "graffiti1", x0 - 0.12, F + 0.55, -3.6, 2.8, 0.45, -PI / 2);
  // les bogies : l'un est resté sur les rails, l'autre a été arraché et gît sur la chaussée
  bogie(c, XV + 3.3, -3.0, -0.12, 0.45, 0.1);
  obstacleTourne(b, XV + 3.3, -3.0, 2.4, 2.6, 0.45, "bogie arraché");
  // les marches de palettes devant les portes
  for (const [x, s] of [[x0 - 0.6, -1], [x1 + 0.6, 1]]) {
    c.boite(1.0, 0.12, 2.4, C.boisGris, { x, y: 0.06, z: 0 }, M.mat(), { nuance: 0.06 });
    for (let z = -1.1; z <= 1.1; z += 0.55) c.boite(0.95, 0.03, 0.1, C.boisGris, { x, y: 0.13, z }, M.mat());
  }
  // --- L'intérieur : le campement (moitié nord), les caisses (moitié sud) ---
  const y = F + 0.04;
  brasero(ctx, XV + 0.3, -3.4, y, "feu de survivants dans le wagon couvert");
  for (const [z, r] of [[-5.6, 0.1], [-6.5, -0.05]]) paille(c, XV - 0.75, y, z, PI / 2 + r);
  paille(c, XV + 0.8, y, -6.2, PI / 2);
  paille(c, XV + 0.8, y + 0.45, -6.3, PI / 2 + 0.1);
  c.boite(1.0, 0.06, 1.8, 0x7a5a3a, { x: XV - 0.7, y: y + 0.03, z: -2.8, ry: 0.05 }, M.mat(), { nuance: 0.1 }); // couvertures
  c.boite(0.9, 0.05, 1.7, 0x5a6a7a, { x: XV - 0.75, y: y + 0.07, z: -3.0, ry: -0.1 }, M.mat(), { nuance: 0.1 });
  caisse(c, XV + 1.0, y, -2.3, 0.2, 0.6);
  for (let q = 0; q < 5; q++) cylY(c, XV + 0.9 + q * 0.09, -2.1, y + 0.48, y + 0.6, 0.04, 0.04, [0xc8362b, 0xb0b0a0, 0xc79a3b][q % 3], M.metal(), 6);
  c.boite(0.2, 0.3, 0.2, 0x3a4a3a, { x: XV - 1.1, y: y + 0.15, z: -4.4 }, M.satin()); // le sac à dos
  c.tube([XV - 1.35, 1.9, -6.8], [XV + 1.35, 1.9, -1.8], 0.01, 0xd8d0b8, M.mat(), 3); // la corde à linge
  for (const [x, z, s, r] of [[XV - 0.8, 3.0, 0.8, 0], [XV - 0.7, 3.9, 0.7, 0.3], [XV + 0.85, 4.6, 0.8, 0.1], [XV - 0.8, 5.5, 0.8, -0.1], [XV - 0.75, 5.5, 0.6, 0.4]]) caisse(c, x, z === 5.5 && s === 0.6 ? y + 0.64 : y, z, r, s);
  caisse(c, XV + 0.85, y, 6.2, 0, 0.75);
  paille(c, XV + 0.7, y, 2.6, PI / 2 - 0.2);
  jonchee(c, x0 + 0.1, z0 + 0.2, x1 - 0.1, z1 - 0.2, Math.round(20 + 20 * u), [0xc9b06a, 0xb59a58, 0x9c7a45], y + 0.01);
  lierre(c, x1 + 0.05, F, 5.6, PI / 2, 2.5, 1.3 + u, Math.round(8 + 12 * u));
  // le bout d'une barrière arrachée, coincé sous le wagon
  for (let i = 0; i < 3; i++) c.boite(0.5, 0.1, 0.12, i % 2 ? C.blanc : C.rouge, { x: XV - 1.9 - i * 0.5, y: 0.08, z: 6.4 + i * 0.12, ry: -0.2 }, M.satin());
}

/** Un wagon-citerne : châssis, citerne couchée, dôme, passerelle, échelles ; on peut ramper dessous entre les bogies. */
function citerne(ctx, [z0, z1], couleur, ramper) {
  const { b, c, u } = ctx;
  // la citerne où l'on rampe a sa moitié haute dans une couche (on voit le rampant dessous) ; l'autre, non
  const k = ramper ? b.couche("citerne " + z0, { x: XV, z: (z0 + z1) / 2, l: 3.4, p: z1 - z0 + 0.4 }, 2.0, 4.5) : c;
  const zb0 = z0 + 1.7;
  const zb1 = z1 - 1.7;
  bogie(c, XV, zb0);
  bogie(c, XV, zb1);
  const yc = RT + 0.85;
  c.pave(XV - 1.0, yc, z0, XV + 1.0, yc + 0.22, z1, C.chassis, M.tole());
  for (const s of [-1, 1]) c.pave(XV + s * 1.3 - 0.08, yc + 0.05, z0, XV + s * 1.3 + 0.08, yc + 0.22, z1, C.chassis, M.tole());
  tampons(c, z0, -1);
  tampons(c, z1, 1);
  // la citerne : la moitié basse visible, la moitié haute dans la couche
  const R = 1.4;
  const yt = yc + 0.22 + R - 0.15;
  const L = z1 - z0 - 0.9;
  const g1 = new THREE.CylinderGeometry(R, R, L, 14, 1, true, -PI / 2, PI);
  c.poser(g1, M.tole(), couleur, { x: XV, y: yt, z: (z0 + z1) / 2, rx: PI / 2 });
  g1.dispose();
  const g2 = new THREE.CylinderGeometry(R, R, L, 14, 1, true, PI / 2, PI);
  k.poser(g2, M.tole(), couleur, { x: XV, y: yt, z: (z0 + z1) / 2, rx: PI / 2 });
  g2.dispose();
  for (const s of [-1, 1]) {
    const g = new THREE.SphereGeometry(R, 14, 5, 0, TAU, 0, PI / 2);
    k.poser(g, M.tole(), couleur, { x: XV, y: yt, z: (z0 + z1) / 2 + s * (L / 2), rx: s * PI / 2, e: [1, 0.3, 1] });
    g.dispose();
  }
  // le dôme, la passerelle du haut, les échelles, la bande peinte, la plaque orange
  cylY(k, XV, (z0 + z1) / 2, yt + R - 0.1, yt + R + 0.35, 0.45, 0.4, couleur, M.tole(), 10);
  k.pave(XV - 0.5, yt + R + 0.05, (z0 + z1) / 2 - 1.2, XV + 0.5, yt + R + 0.1, (z0 + z1) / 2 + 1.2, 0x3a3836, M.tole());
  for (const s of [-1, 1]) {
    c.pave(XV + s * 1.3 - 0.03, yc + 0.2, (z0 + z1) / 2 - 0.25, XV + s * 1.3 + 0.03, yt + 0.5, (z0 + z1) / 2 - 0.2, 0x3a3836, M.tole());
    c.pave(XV + s * 1.3 - 0.03, yc + 0.2, (z0 + z1) / 2 + 0.2, XV + s * 1.3 + 0.03, yt + 0.5, (z0 + z1) / 2 + 0.25, 0x3a3836, M.tole());
  }
  panneau(c, "boost", XV + R + 0.02, yt - 0.25, (z0 + z1) / 2 + 2.2, 4.4, 0.72, PI / 2);
  panneau(c, "boost", XV - R - 0.02, yt - 0.25, (z0 + z1) / 2 - 2.2, 4.4, 0.72, -PI / 2);
  panneau(c, "danger", XV + 1.36, yc + 0.6, z0 + 1.0, 0.4, 0.32, PI / 2);
  // la rouille, la flaque collante sous la vanne de vidange (qui fuit)
  for (let i = 0; i < 4; i++) c.boite(0.8, 0.02, 0.6, C.rouille, { x: XV + 1.15, y: yt - 0.6 + i * 0.1, z: z0 + 2 + i * 2.2, rz: 1.2 }, M.mat());
  cylY(c, XV, (z0 + z1) / 2 + 1.0, yc - 0.3, yc, 0.08, 0.08, 0x3a3836, M.metal(), 6);
  flaque(c, XV + 0.4, (z0 + z1) / 2 + 1.2, 1.1, 0.27);
  // Les obstacles : les bogies et les bouts bloquent ; entre les bogies, on passe en rampant
  for (const zb of [zb0, zb1]) obstacleRect(b, XV - 1.45, zb - 1.3, XV + 1.45, zb + 1.3, "bogie de citerne");
  b.obstacle(XV - 1.45, z0, XV + 1.45, z0, "citerne");
  b.obstacle(XV - 1.45, z1, XV + 1.45, z1, "citerne");
  for (const s of [-1, 1]) {
    b.obstacle(XV + s * 1.45, z0, XV + s * 1.45, zb0 - 1.3, "citerne");
    b.obstacle(XV + s * 1.45, zb1 + 1.3, XV + s * 1.45, z1, "citerne");
    if (ramper) b.obstacle(XV + s * 1.45, zb0 + 1.3, XV + s * 1.45, zb1 - 1.3, "passage bas : ramper sous la citerne");
    else b.obstacle(XV + s * 1.45, zb0 + 1.3, XV + s * 1.45, zb1 - 1.3, "citerne");
  }
  if (ramper) {
    // les traces de passage : le ballast creusé, un carton à plat pour ramper
    c.boite(1.1, 0.02, 3.5, 0xb08a5a, { x: XV - 0.1, y: 0.28, z: (z0 + z1) / 2 - 0.4, ry: 0.15 }, M.mat());
    c.boite(1.0, 0.02, 0.8, 0x6a5a4a, { x: XV + 2.2, y: 0.03, z: (z0 + z1) / 2, ry: 0.4 }, M.mat());
  }
}

/** Les attelages entre les wagons : on ne passe pas (obstacles). */
function attelages(ctx) {
  const { b } = ctx;
  for (const z of [LOCO[1], PC[1], WC[1], CB[1]]) b.obstacle(XV - 1.5, z + 0.35, XV + 1.5, z + 0.35, "attelage");
}

/** Le conteneur tombé du train : couché sur le flanc, il a écrasé le grillage ; ses portes ont cédé sur des télés. */
function conteneurTombe(ctx) {
  const { b, c, u } = ctx;
  const { x, z, ry } = CONTENEUR_TOMBE;
  const col = 0x8a3a2e;
  const L = 6.06;
  c.repere({ x, z, ry, rx: 0, y: 0 }, () => {
    // couché : la hauteur (2,6 m) devient la largeur au sol, la largeur (2,44 m) devient la hauteur
    c.pave(-1.3, 0, -L / 2, 1.3, 0.05, L / 2, col, M.ondule());
    c.pave(-1.3, 2.39, -L / 2, 1.3, 2.44, L / 2, col, M.ondule());
    c.pave(-1.3, 0, -L / 2, -1.25, 2.44, L / 2, col, M.ondule());
    c.pave(1.25, 0, -L / 2, 1.3, 2.44, L / 2, col, M.ondule());
    c.pave(-1.3, 0, -L / 2 - 0.03, 1.3, 2.44, -L / 2 + 0.03, col, M.ondule());
    for (const [xx, yy] of [[-1.3, 0], [1.3, 0], [-1.3, 2.44], [1.3, 2.44]]) c.pave(xx - 0.08, yy - 0.08, -L / 2 - 0.08, xx + 0.08, yy + 0.08, L / 2 + 0.08, col, M.tole());
    // les portes (au sud) arrachées : un vantail au sol, l'autre pend
    c.boite(1.25, 0.05, 2.3, col, { x: -0.7, y: 0.03, z: L / 2 + 1.25, ry: 0.2 }, M.ondule());
    c.boite(0.05, 2.3, 1.25, col, { x: 1.2, y: 1.2, z: L / 2 + 0.55, ry: -0.9 }, M.ondule());
    panneau(c, "fret", 0, 2.46, 0, 3.6, 0.6, 0, -PI / 2);
    // les télés en cartons, répandues
    for (let i = 0; i < 6; i++) carton(c, c.entre(-0.9, 0.9), 0.05, c.entre(-2.4, 2.2), c.entre(-0.1, 0.1), 1.3, 0.18 + c.hasard() * 0.1, 0.85, 0x9a7a5a);
    for (let i = 0; i < 4; i++) carton(c, c.entre(-1.4, 1.6), 0, L / 2 + c.entre(0.4, 3.0), c.hasard() * 3, 1.3, 0.2, 0.85, 0xb08a5a);
    tele(c, 0.6, 0.02, L / 2 + 2.6, 0.4, -PI / 2 + 0.05, 1.4, 0.82);
    tele(c, -1.0, 0.3, L / 2 + 0.8, -0.2, -0.3, 1.2, 0.72);
  });
  obstacleTourne(b, x, z, 2.6, L, ry, "conteneur tombé");
  // le sillon qu'il a creusé, les gravats
  gravats(c, x + 2.6, z - 3.4, 1.2, Math.round(4 + 6 * u), [C.ballast, 0xa09a8e, C.terre]);
  debris(c, x - 2, z - 4, x + 4, z + 6, Math.round(8 + 10 * u), [C.ballast, 0x9a7a5a], 0.02);
}

/** Le passage à niveau : demi-barrières, mâts à croix de Saint-André, feux, sonnerie, armoires, l'appli. */
function passageNiveau(ctx) {
  const { b, c, u } = ctx;
  // Les deux demi-barrières : ouest (voie sud, vers l'est), est (voie nord, vers l'ouest)
  for (const [xp, zp, s, cassee] of [[XV - 6, 4.55, -1, false], [XV + 6, -4.55, 1, u > 0.45]]) {
    // l'armoire de la barrière et son contrepoids
    c.pave(xp - 0.35, 0.12, zp - 0.3, xp + 0.35, 1.2, zp + 0.3, 0x9a9c94, M.tole());
    c.pave(xp - 0.08, 1.0, zp - 0.1, xp + 0.08, 1.15, zp + 0.1, 0x3a3836, M.metal());
    c.boite(0.25, 0.4, 0.5, 0x3a3836, { x: xp, y: 1.05, z: zp - s * 0.55 }, M.tole());
    // la lisse rayée rouge et blanc
    const lg = cassee ? 1.3 : 4.2;
    for (let i = 0; i < Math.round(lg / 0.5); i++) {
      const zz = zp + s * (0.25 + i * 0.5);
      c.pave(xp - 0.05, 1.04, Math.min(zz, zz + s * 0.5), xp + 0.05, 1.16, Math.max(zz, zz + s * 0.5), i % 2 ? C.blanc : C.rouge, M.satin(), { crasse: false });
    }
    if (cassee) {
      // le reste de la lisse, cassé, sur la chaussée
      for (let i = 0; i < 6; i++) c.boite(0.5, 0.1, 0.12, i % 2 ? C.blanc : C.rouge, { x: xp + 1.2 + i * 0.45 * Math.cos(0.5), y: 0.08, z: zp + s * 1.8 + i * 0.45 * Math.sin(0.5), ry: -0.5 }, M.satin());
    } else {
      // le pendant (la petite herse sous la lisse)
      for (let i = 0; i < 6; i++) c.pave(xp - 0.015, 0.55, zp + s * (0.7 + i * 0.55) - 0.015, xp + 0.015, 1.04, zp + s * (0.7 + i * 0.55) + 0.015, C.blanc, M.metal());
      c.pave(xp - 0.02, 0.55, Math.min(zp + s * 0.7, zp + s * 3.45), xp + 0.02, 0.58, Math.max(zp + s * 0.7, zp + s * 3.45), C.blanc, M.metal());
      b.obstacle(xp, zp, xp, zp + s * 4.4, "demi-barrière baissée");
    }
  }
  // Les mâts : croix de Saint-André, feu rouge, sonnerie
  for (const [xm, zm, ry, vivant] of [[XV - 6.6, 4.95, -PI / 2, true], [XV + 6.6, -4.95, PI / 2, false]]) {
    cylY(c, xm, zm, 0.12, 3.9, 0.07, 0.06, 0xd8d4c8, M.satin(), 6);
    for (let i = 0; i < 4; i++) c.pave(xm - 0.075, 0.6 + i * 0.7, zm - 0.075, xm + 0.075, 0.9 + i * 0.7, zm + 0.075, C.rouge, M.satin(), { crasse: false });
    panneau(c, "croix", xm, 3.3, zm, 1.35, 1.35, ry);
    c.repere({ x: xm, y: 2.35, z: zm, ry }, () => {
      c.boite(0.62, 0.62, 0.05, 0x1c1c1c, { z: 0.08 }, M.satin());
      cylZ(c, 0, 0, 0.14, 0.16, 0.08, vivant ? 0xd8301e : 0x5a2a24, M.lisse(), 10);
      c.boite(0.36, 0.04, 0.22, 0x1c1c1c, { y: 0.2, z: 0.2, rx: 0.3 }, M.satin());
    });
    // la sonnerie (une cloche muette), coiffant le mât
    const g = new THREE.SphereGeometry(0.2, 8, 4, 0, TAU, 0, PI / 2);
    c.poser(g, M.metal(), 0x8a8c88, { x: xm, y: 3.95, z: zm });
    g.dispose();
    // l'armoire de commande, porte ouverte, la batterie de secours
    c.pave(xm - 0.35, 0.12, zm - 0.25 + (zm > 0 ? 0.55 : -0.85), xm + 0.35, 1.5, zm + 0.25 + (zm > 0 ? 0.55 : -0.85), 0x9a9c94, M.tole());
    b.obstacle(xm - 0.1, zm, xm + 0.1, zm, "mât du passage à niveau");
  }
  // la batterie de secours, sortie de l'armoire, câblée sur le feu qui clignote encore
  c.boite(0.35, 0.25, 0.2, 0x2a2a2a, { x: XV - 6.2, y: 0.25, z: 5.2, ry: 0.3 }, M.satin());
  c.boite(0.36, 0.04, 0.21, 0xc79a3b, { x: XV - 6.2, y: 0.39, z: 5.2, ry: 0.3 }, M.satin());
  c.tube([XV - 6.2, 0.4, 5.2], [XV - 6.55, 2.2, 4.95], 0.012, 0xb8332a, M.mat(), 3);
  b.lumiere(XV - 6.85, 2.4, 4.95, 0xff2a1a, 5, 9, "feu clignotant du passage à niveau, sur batterie (rouge, intermittent)");
  // le feu qui clignote : une boule rouge allumée par intermittence
  const feu = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 6), new THREE.MeshBasicMaterial({ color: 0xff3a22 }));
  feu.position.set(XV - 6.8, 2.35, 4.95);
  feu.userData.animer = (t) => {
    feu.visible = Math.floor((t ?? 0) * 1.6) % 2 === 0;
  };
  b.ajouter(feu);
  // la plaque de l'appli vissée sur le mât est
  c.boite(1.86, 0.36, 0.03, 0x3a3c3a, { x: XV + 6.6, y: 1.7, z: -4.8 }, M.tole());
  panneau(c, "appli", XV + 6.6, 1.7, -4.78, 1.8, 0.3);
  // les caniveaux à câbles vers le poste d'aiguillage
  for (let z = -6.6; z > -10; z -= 1) c.pave(XV + 6.3, 0, z - 0.48, XV + 6.7, 0.1, z + 0.48, 0xa8a49a, M.beton());
}

/** La passerelle piétonne rouillée : deux escaliers raides, un tablier en treillis au-dessus de la locomotive. */
function passerelle(ctx) {
  const { b, c, u } = ctx;
  const { z, y, x1, x2 } = PASSERELLE;
  const za = z - 0.9;
  const zb = z + 0.9;
  const col = 0x8a4a32;
  const k = b.couche("passerelle", { x: (x1 + x2) / 2, z, l: x2 - x1 + 1, p: 2.4 }, y - 0.3, y + 1.6);
  // les piles
  for (const x of [x1, x2]) for (const zz of [za, zb]) c.pave(x - 0.12, 0, zz - 0.12, x + 0.12, y, zz + 0.12, col, M.tole());
  for (const x of [x1, x2]) c.poutre([x, 0.3, za], [x, y - 0.3, zb], 0.06, col, M.tole());
  // le tablier
  const trou = u > 0.6 ? [14.5, 16.3] : null;
  for (let x = x1; x < x2 - 0.01; x += 0.75) {
    if (trou && x > trou[0] && x < trou[1]) continue;
    k.pave(x, y - 0.06, za, x + 0.75, y, zb, 0x6a5a50, M.tole());
  }
  for (const zz of [za, zb]) {
    k.pave(x1, y - 0.35, zz - 0.07, x2, y - 0.06, zz + 0.07, col, M.tole());
    k.pave(x1, y + 1.15, zz - 0.06, x2, y + 1.25, zz + 0.06, col, M.tole());
    for (let x = x1; x < x2; x += 1.5) {
      k.pave(x - 0.04, y - 0.06, zz - 0.04, x + 0.04, y + 1.15, zz + 0.04, col, M.tole());
      k.poutre([x, y, zz], [x + 1.5, y + 1.15, zz], 0.05, col, M.tole());
    }
    k.boite(x2 - x1, 1.0, 0.01, 0x8a8c80, { x: (x1 + x2) / 2, y: y + 0.6, z: zz }, M.grillage(), { crasse: false, nuance: 0 });
  }
  // les deux escaliers (le long de z, vers la rue), à crémaillères, marches de caillebotis, rampes
  for (const [xa, xb] of [[x1 - 1.6, x1], [x2, x2 + 1.6]]) {
    const xs = (xa + xb) / 2;
    const zt = zb; // en haut, au bord du palier
    const zp = -19; // en bas, côté rue
    const n = Math.round(y / 0.19);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const yy = y * (1 - t);
      const zz = zt + (zp - zt) * t;
      c.pave(xa + 0.08, yy - 0.04, zz - 0.13, xb - 0.08, yy, zz + 0.13, 0x6a5a50, M.tole());
    }
    // le palier en haut
    c.pave(xa, y - 0.06, za, xb, y, zb, 0x6a5a50, M.tole());
    for (const x of [xa, xb]) {
      c.poutre([x, y, zt], [x, 0, zp], 0.1, col, M.tole());
      c.poutre([x, y + 1.0, zt], [x, 1.0, zp], 0.045, col, M.tole());
      c.pave(x - 0.08, 0, zt + (zp - zt) * 0.5 - 0.08, x + 0.08, y * 0.5, zt + (zp - zt) * 0.5 + 0.08, col, M.tole());
      b.obstacle(x, zt, x, zp + 1.0, "escalier de la passerelle");
    }
    c.pave(xa, y - 0.06, za - 0.2, xb, y + 1.1, za - 0.15, col, M.tole());
  }
  // la rouille en coulures, le lierre qui monte sur une pile
  lierre(c, x1, 0, zb + 0.13, 0, 0.6, 3 + 2 * u, Math.round(8 + 12 * u));
}

/** La maisonnette du garde-barrière : cuisine (tableau des horaires), chambre, jardinet potager. */
function maisonnette(ctx) {
  const { b, c, u } = ctx;
  const bris = 0.3 + 0.5 * u;
  const H = 2.7;
  const k = coque(ctx, {
    x0: 24, x1: 32, z0: 8.6, z1: 15.4, h: H, nom: "maisonnette", couleur: C.crepiJaune, angle: 0xa86a4c,
    ouv: {
      n: [porteF(26.4, 0.95, { couleurPorte: 0x4a6a5a }), fen(30, 1.0, { bris, volet: "ouvert", couleurVolet: 0x5a7a6a })],
      o: [fen(12, 1.0, { bris: 0.2, volet: "ouvert", couleurVolet: 0x5a7a6a })],
      e: [fen(12.5, 1.0, { bris, volet: "pendu", couleurVolet: 0x5a7a6a })],
      s: [porteF(30.6, 0.9, { couleurPorte: 0x4a6a5a, angle: 0.7 }), fen(25.8, 0.9, { bris })],
    },
  });
  cloison(ctx, k, [28.2, 8.6], [28.2, 15.4], H, [3.6]);
  c.pave(24, 0, 8.6, 32, 0.04, 15.4, 0xb0806a, M.carrelage(), { crasse: false });
  toitTuiles(k, { x0: 24, x1: 32, z0: 8.6, z1: 15.4, h: H, hf: 1.7, couleur: C.tuile, pignon: C.crepiJaune, trous: u > 0.75 ? [{ u: 2, v: -1, l: 1.6, p: 0.5 }] : [] });
  k.boite(0.5, 1.0, 0.5, 0xa86a4c, { x: 25.2, y: H + 1.4, z: 12 }, M.enduit());
  // la plaque émaillée du passage, la marquise au-dessus de la porte
  c.boite(0.6, 0.3, 0.03, 0x2f4a6a, { x: 25.2, y: 0.6, z: 8.45 }, M.lisse());
  k.boite(1.4, 0.06, 0.8, 0x5a5a58, { x: 26.4, y: 2.45, z: 8.2, rx: -0.2 }, M.mat());
  // --- La cuisine du garde : poêle, table et lampe, buffet, tableau des horaires, manivelle de barrière ---
  c.repere({ x: 24.6, z: 14.6 }, () => {
    c.boite(0.6, 0.75, 0.5, 0x2a2a2a, { y: 0.38 }, M.tole());
    c.boite(0.62, 0.04, 0.52, 0x3a3a3a, { y: 0.77 }, M.metal());
  });
  c.tube([24.6, 0.8, 14.6], [24.6, 2.4, 14.6], 0.07, 0x2a2a2a, M.tole(), 6);
  table(c, 26, 11.8, 1.2, 0.8, 0x8a6a48);
  chaise(c, 26, 12.6, PI, 0x6a5a48);
  chaise(c, 25.0, 11.8, PI / 2, 0x6a5a48);
  cylY(c, 26.2, 11.7, 0.79, 0.95, 0.07, 0.05, 0xb59048, M.metal(), 6);
  cylY(c, 26.2, 11.7, 0.95, 1.12, 0.06, 0.05, 0xfff0c0, M.lisse(), 6);
  b.lumiere(26.2, 1.3, 11.7, 0xffd27a, 5, 9, "lampe à pétrole dans la maisonnette du garde-barrière");
  c.repere({ x: 25.6, z: 9.0 }, () => {
    c.boite(1.5, 0.85, 0.45, 0x7a5a3c, { y: 0.43 }, M.satin());
    c.boite(0.95, 0.7, 0.04, 0x6a4a30, { y: 1.22, z: -0.12, rx: 0.12 }, M.mat());
    panneau(c, "horaires", 0, 1.22, -0.09, 0.85, 0.64, 0, 0.12);
  });
  c.repere({ x: 24.35, z: 11 }, () => {
    c.boite(0.3, 0.5, 0.4, 0x5a6a5a, { y: 1.0 }, M.tole());
    c.poutre([0.2, 1.0, 0], [0.35, 0.8, 0.15], 0.03, 0x3a3a3a, M.metal());
  });
  // --- La chambre ---
  lit(c, 30.6, 10.0, PI, 1.9, 1.3, 0xbab09a);
  armoire(c, 31.4, 13.5, -PI / 2, 1.1, 0.55, 1.9, 0x7a5a3c);
  chaise(c, 29, 14.6, 0.4, 0x6a5a48);
  c.boite(0.4, 0.5, 0.4, 0x7a5a3c, { x: 29, y: 0.25, z: 9.2 }, M.satin());
  jonchee(c, 24.2, 8.8, 31.8, 15.2, 12, [0xe9dfc6, 0x9c7a45], 0.05);
  lierre(c, 32.1, 0, 12, PI / 2, 4, 1.6 + 1.2 * u, Math.round(14 + 16 * u));
  // --- Le jardinet potager ---
  const bord = [[24, 16.4], [34, 16.4], [34, 25.4], [24, 25.4]];
  for (let i = 0; i < 4; i++) {
    if (i === 0) continue; // côté maison : on y entre par la porte de derrière
    const [xa, za] = bord[i];
    const [xb, zb] = bord[(i + 1) % 4];
    piquets(ctx, xa, za, xb, zb);
  }
  piquets(ctx, 24, 16.4, 29.8, 16.4);
  piquets(ctx, 31.4, 16.4, 34, 16.4);
  c.pave(24, 0, 16.4, 34, 0.02, 25.4, C.terreSombre, M.mat(), { crasse: false, nuance: 0.05 });
  for (const [x, z] of [[25.5, 18.5], [25.5, 22.5], [28.5, 18.5], [28.5, 22.5]]) {
    c.pave(x - 0.7, 0, z - 1.4, x + 0.7, 0.22, z + 1.4, C.boisGris, M.mat());
    c.pave(x - 0.65, 0.2, z - 1.35, x + 0.65, 0.24, z + 1.35, C.terre, M.mat(), { crasse: false });
    for (let i = 0; i < 6; i++) boule(c, x + c.entre(-0.45, 0.45), 0.33 + c.hasard() * 0.15, z + c.entre(-1.1, 1.1), 0.12 + c.hasard() * 0.12, [0x5a8a3a, 0x7aa04a, 0x8aa060][i % 3], M.mat(), [1, 1.2 + u, 1]);
  }
  for (let i = 0; i < 4; i++) c.tube([31.5 + (i % 2) * 0.8, 0, 18 + Math.floor(i / 2) * 1.5], [31.6 + (i % 2) * 0.8, 1.6, 18.1 + Math.floor(i / 2) * 1.5], 0.02, C.boisGris, M.mat(), 3);
  cylY(c, 33.2, 24.6, 0, 0.9, 0.35, 0.35, 0x3a6a8a, M.satin(), 8); // le récupérateur d'eau
  c.repere({ x: 31.5, z: 23.4, ry: 0.6 }, () => {
    c.boite(0.6, 0.25, 0.9, 0x5a7a5a, { y: 0.45 }, M.tole());
    cylX(c, 0, 0.2, 0.55, 0.18, 0.08, 0x1c1c1c, M.mat(), 8);
    c.poutre([0, 0.5, -0.4], [0, 0.6, -1.0], 0.04, C.bois, M.mat());
  });
  semerTouffes(c, 24.5, 16.6, 33.6, 25.2, Math.round(10 + 25 * u), C.herbeSeche, 0.02);
}

/** Une petite clôture de piquets (jardinet). */
function piquets(ctx, xa, za, xb, zb) {
  const { b, c } = ctx;
  const L = Math.hypot(xb - xa, zb - za);
  const n = Math.round(L / 0.18);
  for (let i = 0; i <= n; i++) {
    if (c.hasard() < 0.08) continue;
    const t = i / n;
    c.boite(0.07, 0.95, 0.03, 0xd8d0b8, { x: xa + (xb - xa) * t, y: 0.47, z: za + (zb - za) * t, ry: -Math.atan2(zb - za, xb - xa), rz: c.hasard() < 0.08 ? 0.25 : 0 }, M.mat(), { nuance: 0.06 });
  }
  for (const y of [0.3, 0.75]) c.poutre([xa, y, za], [xb, y, zb], 0.04, 0xc8c0a8, M.mat());
  b.obstacle(xa, za, xb, zb, "clôture du jardinet");
}

/** Le poste d'aiguillage : socle de brique, grandes vitres, rangée de leviers, pupitre. */
function posteAiguillage(ctx) {
  const { b, c, u } = ctx;
  const H = 3.0;
  const bris = 0.4 + 0.5 * u;
  const verriere = (pos, l) => fen(pos, l, { bas: COUPE, haut: 2.6, croisillons: 3, traverses: 2, bris, cadre: 0x4a5a52 });
  const k = coque(ctx, {
    x0: 25, x1: 30.6, z0: -17, z1: -10.5, h: H, nom: "poste d'aiguillage", couleur: 0xa8604a, mat: M.brique(), angle: 0x8a4a38, hautCouche: H + 1.5,
    interieur: { couleur: 0xe0d8c0, mat: M.brique(), crasse: false },
    ouv: { s: [verriere(26.6, 2.4), porteF(29.4, 0.95, { couleurPorte: 0x4a5a52 })], o: [verriere(-13.75, 5.2)], n: [verriere(27.8, 4.2)], e: [verriere(-14.6, 2.6)] },
  });
  c.pave(25, 0, -17, 30.6, 0.04, -10.5, 0xa89a8a, M.carrelage(), { crasse: false });
  // le toit plat à large débord
  k.pave(24.4, H, -17.6, 31.2, H + 0.3, -9.9, 0x5a5a58, M.mat());
  k.pave(24.4, H + 0.3, -17.6, 31.2, H + 0.42, -17.45, 0x4a4a48, M.mat());
  // la rangée de leviers face à la voie (rouge, bleu, jaune, noir), leur bâti
  c.pave(25.3, 0, -16.4, 25.9, 0.5, -11.3, 0x3a3e3c, M.tole());
  const cols = [0xb8332a, 0xb8332a, 0x3a5a8a, 0xc79a3b, 0x1c1c1c, 0xb8332a, 0x3a5a8a, 0x1c1c1c, 0xc79a3b, 0xb8332a];
  for (let i = 0; i < 10; i++) {
    const z = -16.1 + i * 0.5;
    const tire = c.hasard() < 0.4;
    c.poutre([25.6, 0.5, z], [25.6 + (tire ? 0.5 : -0.2), 1.45, z], 0.05, cols[i], M.satin());
    c.boite(0.12, 0.04, 0.06, 0xd8d4c8, { x: 25.6 + (tire ? 0.42 : -0.15), y: 1.3, z }, M.lisse());
  }
  // le pupitre, le téléphone, le registre, la chaise, le poêle
  c.pave(27.3, 0, -16.7, 30.3, 0.95, -16.0, 0x6a5a48, M.satin());
  c.boite(3.0, 0.5, 0.06, 0x2a3a34, { x: 28.8, y: 1.3, z: -16.6, rx: -0.3 }, M.lisse()); // le tableau de contrôle
  for (let i = 0; i < 8; i++) boule(c, 27.6 + i * 0.35, 1.3, -16.54, 0.03, i === 5 ? 0xff4030 : 0x5a6a5a, M.lisse());
  b.lumiere(29.4, 1.5, -16.2, 0xff5040, 1.2, 3, "voyant rouge du tableau de contrôle, sur pile");
  c.boite(0.25, 0.1, 0.18, 0x1c1c1c, { x: 30, y: 1.0, z: -16.3 }, M.lisse());
  c.boite(0.35, 0.05, 0.25, 0x6a3a2a, { x: 28, y: 0.98, z: -16.3, ry: 0.2 }, M.mat());
  chaise(c, 28.5, -15.2, PI + 0.3, 0x4a5a52);
  cylY(c, 30, -11.2, 0.04, 0.8, 0.25, 0.25, 0x2a2a2a, M.tole(), 8);
  // les tringles qui partent vers la voie, le long du mur
  for (let i = 0; i < 4; i++) c.tube([25, 0.2 + i * 0.05, -15 + i * 0.6], [XG2 + 0.3, 0.12, -9 + i * 0.3], 0.02, 0x6a5a50, M.metal(), 3);
  lierre(c, 30.7, 0, -14, PI / 2, 4, 1.4 + u, Math.round(12 + 14 * u));
  semerTouffes(c, 23, -24, 33, -7, Math.round(15 + 25 * u), C.herbeSeche);
}

/** Les box de garage en bande (côté sud-est), l'un ouvert. */
function boxGarages(ctx) {
  const { b, c, u } = ctx;
  const z0 = 9;
  const z1 = 15;
  const k = b.couche("box de garage", { x: 42, z: 12, l: 12.6, p: 6.6 }, COUPE, 3.2);
  const spec = { h: 2.5, ep: 0.2, couleur: 0xb8b2a6, mat: M.beton() };
  murCoupe(ctx, k, [36, z1], [48, z1], spec);
  murCoupe(ctx, k, [48, z1], [48, z0], spec);
  murCoupe(ctx, k, [36, z0], [36, z1], spec);
  for (const x of [39, 42, 45]) murCoupe(ctx, k, [x, z0], [x, z1], { ...spec, ep: 0.15 });
  // les portes basculantes : 1 ouverte, 2 fermée, 3 forcée à moitié, 4 fermée et cabossée
  const portes = [["ouverte", 0x6a8a9a], ["fermee", 0x9a6a4a], ["moitie", 0x6a8a9a], ["fermee", 0x7a7a5a]];
  portes.forEach(([etat, coul], i) => {
    const xa = 36 + i * 3 + 0.1;
    const xb = xa + 2.8;
    k.pave(xa - 0.1, 2.1, z0 - 0.1, xb + 0.1, 2.5, z0 + 0.1, 0xb8b2a6, M.beton());
    if (etat === "ouverte") k.pave(xa, 2.0, z0, xb, 2.08, z0 + 2.0, coul, M.tole());
    else if (etat === "moitie") {
      k.pave(xa, COUPE, z0 - 0.05, xb, 2.1, z0 + 0.05, coul, M.tole());
      k.boite(xb - xa, 0.05, 1.2, coul, { x: (xa + xb) / 2, y: 1.6, z: z0 + 0.6, rx: 0.3 }, M.tole());
      b.obstacle(xa, z0, xb, z0, "porte de box à demi levée (on se baisse)");
    } else {
      c.pave(xa, 0, z0 - 0.05, xb, COUPE, z0 + 0.05, coul, M.tole());
      k.pave(xa, COUPE, z0 - 0.05, xb, 2.1, z0 + 0.05, coul, M.tole());
      b.obstacle(xa, z0, xb, z0, "porte de box fermée");
    }
  });
  k.pave(35.8, 2.5, z0 - 0.3, 48.2, 2.65, z1 + 0.2, 0x8a8a84, M.beton());
  c.pave(36, 0, z0, 48, 0.04, z1, 0xa8a49a, M.beton(), { crasse: false });
  // le box ouvert : pneus, bidon d'huile, cartons, un vieux vélo
  for (let i = 0; i < 4; i++) cylY(c, 37, 14.2, 0.04 + i * 0.22, 0.24 + i * 0.22, 0.32, 0.32, 0x1c1c1c, M.mat(), 10);
  bidon(c, 38.4, 14.4, 0x3a5a3a, 0.04, true);
  for (let i = 0; i < 5; i++) carton(c, 37 + c.entre(0, 1.6), 0.04 + Math.floor(i / 3) * 0.4, 11 + c.entre(0, 1.6), c.hasard() * 0.5, 0.6, 0.4, 0.45);
  velo(c, 37.4, 10.2, 0.2, 0x8a3a3a, true, 0.04);
  c.pave(36, 0, CL, 48, 0.025, z0, 0xa09a90, M.beton(), { crasse: false });
  semerTouffes(c, 36, CL, 48, z0, Math.round(15 + 25 * u), C.herbeSeche, 0.025);
  lierre(c, 48.1, 0, 12, PI / 2, 5, 1.8 + u, Math.round(12 + 16 * u));
}

/** Les abords est du passage : la palissade, le panneau 4 × 3, la friche ; au sud, les haies. */
function abordsEst(ctx) {
  const { b, c, u } = ctx;
  // le panneau 4 × 3 de l'Abondance, face à la rue
  c.repere({ x: 40, z: -8.6 }, () => {
    for (const s of [-1, 1]) c.boite(0.18, 5.6, 0.18, 0x4a4c4a, { x: s * 1.5, y: 2.8, z: -0.2 }, M.tole());
    c.boite(4.8, 3.2, 0.12, 0x3a3c3a, { y: 4.0, z: -0.12 }, M.tole());
    panneau(c, "pub", 0, 4.0, -0.04, 4.5, 3.0);
    c.boite(4.8, 0.06, 0.6, 0x4a4c4a, { y: 2.35, z: 0.1 }, M.tole());
  });
  b.obstacle(38.4, -8.8, 41.6, -8.8, "panneau publicitaire");
  // la friche nord-est, bordée d'un grillage fatigué
  grillage(ctx, 33, -CL, 50, -CL, 1.5, 0x5a6a5a, [[0.55, 0.68]]);
  grillage(ctx, 33, -CL, 33, -BORD, 1.5);
  c.pave(33.2, 0, -34.4, 50, 0.015, -6.4, C.friche, M.herbe(), { crasse: false, nuance: 0 });
  semerTouffes(c, 33.5, -34, 49.5, -7, Math.round(40 + 50 * u), C.herbeSeche, 0.015);
  arbre(c, 44, -26, 7, "bouleau");
  arbre(c, 37, -31, 6, "bouleau");
  arbre(c, 47, -15, 5, u > 0.4 ? "mort" : "bouleau");
  massif(c, 34, -33, 49, -20, 6, 1.5);
  epave(c, 42, -19, 0.9, 0x5a4a3a, "berline", 1);
  obstacleTourne(b, 42, -19, 4.4, 1.8, 0.9, "épave brûlée");
  gravats(c, 36, -22, 1.4, Math.round(5 + 8 * u));
  // côté sud-est : la haie, entre les box et la voie
  haie(ctx, 34.5, 25.8, 34.5, BORD, 2.2);
  haie(ctx, 22.8, 25.8, 34.5, 25.8, 1.8);
  grillage(ctx, 22.8, CL, 33.6, CL, 1.4, 0x5a6a5a, [[0.15, 0.35], [0.58, 0.8]]);
  grillage(ctx, 34.5, CL, 34.5, 25.8, 1.4);
  semerTouffes(c, 35, 16, 49.5, 34, Math.round(25 + 35 * u), C.herbeSeche);
  massif(c, 35.5, 18, 49, 33, 6, 1.4);
  arbre(c, 42, 27, 8, "feuillu");
  grillage(ctx, 48.6, CL, 48.6, BORD, 1.6);
  // le nord-ouest de la voie : la rue des pavillons s'arrête au grillage
  grillage(ctx, 7.6, -CL, XG1 - 0.1, -CL, 1.4);
  semerTouffes(c, XG2 + 0.4, -34, 32.5, -18, Math.round(20 + 30 * u), C.herbeSeche);
  massif(c, 31, -34, 33, -22, 3, 1.3);
  arbre(c, 30.5, -27, 6, "feuillu");
}

// ---------- 4. Le dépôt et les jardins ----------

/** Le dépôt Wattbus : hangar à portiques, bus, navette autonome, bureau, cour. */
function depot(ctx) {
  if (!ici(ctx, 76)) return;
  const { b, c, u } = ctx;
  const X0 = 58;
  const X1 = 94;
  const Z0 = -31;
  const Z1 = -14;
  const HT = 6.4;
  const k = b.couche("toiture du dépôt", { x: (X0 + X1) / 2, z: (Z0 + Z1) / 2, l: X1 - X0 + 1, p: Z1 - Z0 + 1.6 }, COUPE, HT + 2);
  // la cour en bitume, le sol du dépôt
  c.pave(52.5, 0, -14, 99.4, 0.025, -CL, C.bitume, M.bitume(), { crasse: false });
  c.pave(X0, 0, Z0, X1, 0.03, Z1, 0x9a968e, M.beton(), { crasse: false });
  for (let x = 64; x < X1; x += 7) c.pave(x - 0.06, 0.03, -29, x + 0.06, 0.035, -15, 0xc8b84a, M.mat(), { crasse: false });
  // les murs : brique en bas, bardage en haut (couche)
  const brique = { h: 2.2, ep: 0.25, couleur: 0x9a5a44, mat: M.brique() };
  murCoupe(ctx, k, [X1, Z0], [X0, Z0], { ...brique, ouvertures: [] });
  murCoupe(ctx, k, [X0, Z0], [X0, Z1], { ...brique, ouvertures: [{ type: "porte", u: 11, l: 1.0, bas: 0, haut: 2.1, vantail: "entrouvert", couleurPorte: 0x4a5a52 }] });
  murCoupe(ctx, k, [X1, Z1], [X1, Z0], { ...brique, ouvertures: [{ type: "vide", u: 4, l: 4.2, bas: 0, haut: 4.2 }] });
  for (const [a, bb] of [[[X1, Z0], [X0, Z0]], [[X0, Z0], [X0, Z1]], [[X1, Z1], [X1, Z0]]]) {
    const L = Math.hypot(bb[0] - a[0], bb[1] - a[1]);
    const ry = -Math.atan2(bb[1] - a[1], bb[0] - a[0]);
    k.repere({ x: (a[0] + bb[0]) / 2, z: (a[1] + bb[1]) / 2, ry }, () => {
      const trouEst = a[0] === X1 && bb[0] === X1;
      if (trouEst) {
        // le grand portail de l'atelier (de u = 1,9 à 6,1 m, jusqu'à 4,2 m de haut)
        k.boite(1.9, HT - 2.2, 0.08, 0x8a9a96, { x: -L / 2 + 0.95, y: 2.2 + (HT - 2.2) / 2 }, M.ondule());
        k.boite(4.2, HT - 4.2, 0.08, 0x8a9a96, { x: -L / 2 + 4, y: 4.2 + (HT - 4.2) / 2 }, M.ondule());
        k.boite(L - 6.1, HT - 2.2, 0.08, 0x8a9a96, { x: 3.05, y: 2.2 + (HT - 2.2) / 2 }, M.ondule());
      } else k.boite(L, HT - 2.2, 0.08, 0x8a9a96, { y: 2.2 + (HT - 2.2) / 2 }, M.ondule());
    });
  }
  // les portiques, la façade sud ouverte (travées), la poutre de rive et l'enseigne
  for (let x = X0; x <= X1 + 0.01; x += 6) {
    for (const z of [Z0, Z1]) c.pave(x - 0.15, 0, z - 0.15, x + 0.15, HT, z + 0.15, 0x4a5a5e, M.tole());
    k.poutre([x, HT, Z0], [x, HT + 1.4, (Z0 + Z1) / 2], 0.25, 0x4a5a5e, M.tole());
    k.poutre([x, HT, Z1], [x, HT + 1.4, (Z0 + Z1) / 2], 0.25, 0x4a5a5e, M.tole());
    b.obstacle(x - 0.15, Z1, x + 0.15, Z1, "poteau du dépôt");
  }
  k.pave(X0, HT - 0.9, Z1 - 0.2, X1, HT, Z1 + 0.2, 0xd8d2c0, M.tole());
  panneau(k, "depot", (X0 + X1) / 2, HT - 0.45, Z1 + 0.22, 7.2, 0.8);
  // deux rideaux métalliques à moitié baissés
  for (const x of [X0 + 3, X1 - 9]) k.pave(x - 2.8, 3.6, Z1 - 0.05, x + 2.8, HT - 0.9, Z1 + 0.05, 0xa8aaa4, M.ondule());
  // la toiture à deux pans en bac acier, deux plaques translucides, des trous
  const hf = 1.4;
  const demi = (Z1 - Z0) / 2 + 0.4;
  const pente = Math.atan2(hf, (Z1 - Z0) / 2);
  const ramp = Math.hypot(demi, hf * (demi / ((Z1 - Z0) / 2)));
  for (const s of [-1, 1]) {
    for (let x = X0 - 0.4; x < X1 + 0.4; x += 3) {
      if (u > 0.4 && s > 0 && (x > 75 && x < 81)) continue;
      const translucide = (x > 66 && x < 69) || (x > 84 && x < 87);
      k.boite(3.02, 0.06, ramp, translucide ? 0xffffff : 0x8a9496, { x: x + 1.5, y: HT + hf / 2 - 0.03, z: (Z0 + Z1) / 2 + s * demi / 2, rx: s * pente }, translucide ? M.verre() : M.ondule());
    }
  }
  // les bus (avant au sud), la navette autonome à demi sortie
  bus(c, 67, -22.6, -PI / 2, 0xd8d2c0, 0x2f6f73, u);
  bus(c, 74, -22.2, -PI / 2, 0xd8d2c0, 0x2f6f73, u);
  bus(c, 81, -23.0, -PI / 2, 0xc8c4b4, 0xc79a3b, u, "navette");
  for (const x of [67, 74, 81]) obstacleRect(b, x - 1.3, -28.6, x + 1.3, -16.6, "bus");
  navette(ctx, 88.5, -10.6, -PI / 2 + 0.35);
  // l'atelier : établi, pont élévateur, pneus ; le bureau (casiers, bureau)
  c.repere({ x: 92.6, z: -27 }, () => {
    c.boite(0.7, 0.9, 3, 0x5a6a62, { y: 0.45 }, M.tole());
    for (let i = 0; i < 6; i++) cylY(c, -0.9, -2.6 + (i % 3) * 0.7, 0.03 + Math.floor(i / 3) * 0.25, 0.28 + Math.floor(i / 3) * 0.25, 0.5, 0.5, 0x1c1c1c, M.mat(), 10);
  });
  const kb = k;
  const cl = { h: 2.6, ep: 0.15, couleur: 0xd8d4c8, mat: M.brique(), interieur: null };
  murCoupe(ctx, kb, [64.6, -25], [64.6, -31], { ...cl, ouvertures: [{ type: "porte", u: 2.4, l: 0.95, bas: 0, haut: 2.1, vantail: "entrouvert", couleurPorte: 0x6a7a7a }] });
  murCoupe(ctx, kb, [58, -25], [64.6, -25], { ...cl, ouvertures: [fen(0, 1.6, { u: 3.3, bris: 0.6, bas: 0.9, haut: 2.1 })] });
  kb.pave(58, 2.6, -31, 64.6, 2.7, -25, 0xc8c4b8, M.tole());
  c.pave(58.1, 0.03, -30.9, 64.5, 0.05, -25.1, 0x8a7a6a, M.parquet(), { crasse: false });
  table(c, 61, -28, 1.6, 0.8, 0x8a8c88);
  chaise(c, 61, -28.8, 0.3, 0x3a4a5a);
  c.boite(0.5, 0.35, 0.4, 0x1c1c1c, { x: 61.3, y: 0.95, z: -28.1 }, M.lisse());
  for (let i = 0; i < 5; i++) c.boite(0.5, 1.9, 0.5, 0x6a7a8a, { x: 58.5, y: 0.95, z: -30.4 + i * 0.52 }, M.tole());
  c.boite(0.03, 1.9, 0.5, 0x6a7a8a, { x: 59.1, y: 0.95, z: -28.3, ry: 1 }, M.tole());
  jonchee(c, 58.2, -30.8, 64.4, -25.2, 14, [0xe9dfc6, 0xd9cfb4], 0.05);
  jonchee(c, X0, Z0, X1, Z1, Math.round(20 + 30 * u), undefined, 0.035);
  flaque(c, 77.5, -21, 1.6, 0.035);
  flaque(c, 70.5, -15.5, 1.0, 0.035);
  lierre(c, X1 + 0.15, 0, -20, PI / 2, 5, 3 + 2 * u, Math.round(18 + 20 * u));
  // la clôture de la cour, le portail sorti de son rail, l'enseigne au-dessus de l'entrée
  grillage(ctx, 52, -CL, 64, -CL, 1.9);
  grillage(ctx, 72, -CL, 99.6, -CL, 1.9);
  grillage(ctx, 52, -CL, 52, -BORD, 1.9);
  c.repere({ x: 69, z: -6.9, ry: 0.12 }, () => {
    c.boite(7.6, 1.8, 0.05, 0x9aa49a, { y: 1.05, z: 0 }, M.grillage());
    c.boite(7.6, 0.08, 0.08, 0x5a6a5a, { y: 1.95 }, M.tole());
    c.boite(7.6, 0.08, 0.08, 0x5a6a5a, { y: 0.15 }, M.tole());
  });
  for (const x of [63.8, 72.2]) c.boite(0.16, 4.6, 0.16, 0x4a5a5e, { x, y: 2.3, z: -CL }, M.tole());
  c.boite(8.6, 0.9, 0.08, 0x3a3c3a, { x: 68, y: 4.3, z: -CL - 0.05 }, M.tole());
  panneau(c, "depot", 68, 4.3, -CL + 0.0, 8.2, 0.82);
  semerTouffes(c, 52.5, -13.5, 99, -6.6, Math.round(20 + 40 * u), C.herbeSeche, 0.025);
  semerTouffes(c, 52.5, -34, 99, -31.5, Math.round(15 + 20 * u), C.herbeSeche);
  arbre(c, 96.5, -24, 7, "bouleau");
  arbre(c, 54.5, -24, 6, "bouleau");
}

/** La navette autonome (minibus sans poste de conduite), son écran « Hors service » qui luit encore. */
function navette(ctx, x, z, ry) {
  const { b, c } = ctx;
  c.repere({ x, z, ry }, () => {
    c.boite(5, 0.9, 2.2, 0xe0dcd0, { y: 0.85 }, M.satin());
    c.boite(4.6, 1.2, 2.15, 0x2a3236, { y: 1.9 }, M.lisse(), { crasse: false });
    for (const sx of [-2.3, 2.3]) c.boite(0.4, 1.3, 2.2, 0xe0dcd0, { x: sx, y: 1.85 }, M.satin());
    c.boite(5, 0.3, 2.2, 0xe0dcd0, { y: 2.65 }, M.satin());
    c.boite(1.2, 0.2, 0.8, 0x3a3e40, { x: 0.6, y: 2.88 }, M.tole()); // le lidar
    cylY(c, 0.6, 0, 2.98, 3.15, 0.18, 0.18, 0x1c1c1c, M.lisse(), 8);
    for (const sx of [-1.7, 1.7]) for (const sz of [-1, 1]) cylZ(c, sx, 0.38, sz * 0.95, 0.38, 0.28, 0x1c1c1c, M.mat(), 10);
    panneau(c, "navette", -0.2, 0.85, 1.12, 4.2, 0.66);
    c.boite(0.05, 0.4, 1.2, 0x5fb8d0, { x: 2.52, y: 2.3 }, M.lisse(), { crasse: false });
  });
  const c0 = Math.cos(ry);
  const s0 = Math.sin(ry);
  b.lumiere(x + 2.6 * c0, 2.3, z - 2.6 * s0, 0x8fd0e0, 2.2, 5, "écran « Hors service » de la navette autonome, qui luit encore");
  obstacleTourne(b, x, z, 5, 2.2, ry, "navette autonome");
}

/** Les jardins ouvriers : grillage, allées, parcelles, cabanes, cuves d'eau, serre-tunnel, la cabane-atelier. */
function jardins(ctx) {
  if (!ici(ctx, 75)) return;
  const { b, c, u } = ctx;
  // le grillage sur la rue, le portillon, le panneau
  grillage(ctx, 50.4, CL, 60, CL, 1.7, 0x4a6a4a);
  grillage(ctx, 61.4, CL, 99.6, CL, 1.7, 0x4a6a4a, [[0.7, 0.74]]);
  grillage(ctx, 50.4, CL, 50.4, BORD, 1.7, 0x4a6a4a);
  c.boite(1.2, 1.3, 0.04, 0x9aa49a, { x: 60.2, y: 0.75, z: CL + 0.6, ry: -1.1 }, M.grillage());
  c.repere({ x: 63.2, z: CL + 0.3, ry: PI / 2 - 0.5 }, () => {
    for (const s of [-1, 1]) c.boite(0.1, 2.0, 0.1, C.boisSombre, { x: s * 1.1, y: 1.0, z: -0.05 }, M.mat());
    panneau(c, "jardins", 0, 1.55, 0, 2.3, 0.67);
    c.boite(2.4, 0.75, 0.04, 0x6a5a40, { y: 1.55, z: -0.03 }, M.mat());
  });
  // les allées de gravier
  c.pave(60, 0, CL, 61.4, 0.02, 15, C.gravier, M.mat(), { crasse: false });
  c.pave(51, 0, 13.6, 97, 0.02, 15, C.gravier, M.mat(), { crasse: false });
  c.pave(75.3, 0, 15, 76.7, 0.02, 33.5, C.gravier, M.mat(), { crasse: false });
  // les parcelles : terre, rangs de légumes montés, tuteurs, bordures de planches
  const parcelles = [
    [52, 7, 59.5, 13], [62, 7, 74, 13], [77, 7, 90, 13],
    [52, 15.5, 62, 24], [63, 15.5, 74.8, 22], [77.2, 15.5, 84, 22],
    [52, 25, 60, 33.5], [62, 23, 74.8, 33.5], [77.2, 30, 83, 33.5],
  ];
  parcelles.forEach(([x1, z1, x2, z2], i) => {
    c.pave(x1, 0, z1, x2, 0.03, z2, i % 3 === 1 ? C.terre : C.terreSombre, M.mat(), { crasse: false, nuance: 0.06 });
    const friche = (i * 7) % 5 < 2 + u * 2;
    for (let z = z1 + 0.8; z < z2 - 0.5; z += 1.1) {
      if (friche) semerTouffes(c, x1 + 0.3, z - 0.3, x2 - 0.3, z + 0.3, 3, C.herbeSeche, 0.03);
      else for (let x = x1 + 0.6; x < x2 - 0.4; x += 1.4) boule(c, x + c.entre(-0.2, 0.2), 0.18, z, 0.18 + c.hasard() * 0.12, [0x5a8a3a, 0x7aa04a, 0x8a9a4a][(i + Math.round(x)) % 3], M.mat(), [1, 0.9 + u, 1]);
    }
    for (const [xa, xb, za, zb] of [[x1, x2, z1, z1], [x1, x2, z2, z2], [x1, x1, z1, z2], [x2, x2, z1, z2]]) c.pave(xa - 0.04, 0, za - 0.04, xb + 0.04, 0.18, zb + 0.04, C.boisGris, M.mat());
    if (i % 2 === 0) {
      // un tipi de tuteurs à haricots
      const cx = (x1 + x2) / 2 + 1.5;
      const cz = (z1 + z2) / 2;
      for (let q = 0; q < 4; q++) {
        const a = (q / 4) * TAU;
        c.tube([cx + Math.cos(a) * 0.5, 0, cz + Math.sin(a) * 0.5], [cx, 2.0, cz], 0.02, C.boisGris, M.mat(), 3);
      }
    }
  });
  // le piquet du « potager connecté » de la parcelle 12
  c.boite(0.05, 0.9, 0.05, 0x8a8c88, { x: 66, y: 0.45, z: 18 }, M.metal());
  panneau(c, "capteur", 66, 0.95, 18.03, 0.9, 0.22);
  // les cabanes des parcelles
  cabane(ctx, 57, 30.2, 2.4, 2.0, 0.1, 0x7a8a6a);
  cabane(ctx, 72.5, 10.2, 2.2, 1.8, -0.05, 0x8a6a4a);
  cabane(ctx, 80.5, 31.4, 2.4, 2.0, 0.05, 0x6a7a8a);
  // la serre-tunnel aux bâches déchirées
  c.repere({ x: 69, z: 27.5 }, () => {
    for (let x = -3; x <= 3; x += 1) {
      const g = new THREE.TorusGeometry(1.4, 0.025, 3, 10, PI);
      c.poser(g, M.metal(), 0x9a9c98, { x, y: 0, rx: 0, ry: PI / 2 });
      g.dispose();
    }
    const g = new THREE.CylinderGeometry(1.4, 1.4, u > 0.5 ? 4 : 6, 10, 1, true, 0, PI);
    c.poser(g, M.verre(), 0xe8eee8, { x: u > 0.5 ? -1 : 0, rz: PI / 2, ry: 0 });
    g.dispose();
    for (let i = 0; i < 4; i++) c.boite(0.6, 0.3, 0.4, 0x6a4a3a, { x: -2 + i * 1.2, y: 0.15, z: 0.4 }, M.mat());
  });
  b.obstacle(66, 26.1, 72, 26.1, "serre-tunnel");
  b.obstacle(66, 28.9, 72, 28.9, "serre-tunnel");
  // les cuves de 1 000 litres, le compost, l'épouvantail, le drone tombé dans les choux
  cuve(ctx.c, 79, 17.2, 0.1, 0.4);
  cuve(ctx.c, 80.4, 17.2, -0.05, 0.7);
  obstacleRect(b, 78.3, 16.6, 81.1, 17.8, "cuves d'eau");
  for (let i = 0; i < 2; i++) {
    c.repere({ x: 53.5 + i * 1.4, z: 22.6 }, () => {
      for (const s of [-1, 1]) c.boite(1.2, 0.9, 0.06, C.boisGris, { y: 0.45, z: s * 0.6 }, M.mat());
      c.boite(0.06, 0.9, 1.2, C.boisGris, { x: -0.6, y: 0.45 }, M.mat());
      c.boite(1.1, 0.6, 1.1, 0x5a4a3a, { y: 0.3 }, M.mat());
    });
  }
  c.repere({ x: 56, z: 18.5 }, () => {
    c.boite(0.08, 1.9, 0.08, C.boisGris, { y: 0.95 }, M.mat());
    c.boite(1.4, 0.08, 0.08, C.boisGris, { y: 1.45 }, M.mat());
    c.boite(0.7, 0.8, 0.3, 0x6a5a8a, { y: 1.25 }, M.mat());
    boule(c, 0, 1.85, 0, 0.2, 0xd8c890, M.mat());
    c.boite(0.5, 0.06, 0.5, 0xb59048, { y: 2.06 }, M.mat());
  });
  drone(c, 70, 0.05, 11, 2.2, 0.5);
  // la cabane-atelier, visitable : établi, outils, dynamo à pédales, lanterne
  const k = coque(ctx, {
    x0: 83, x1: 89, z0: 23, z1: 29, h: 2.4, nom: "cabane-atelier", couleur: 0x8a7a5a, mat: M.mat(), ep: 0.1,
    interieur: { couleur: 0x7a6a4a, mat: M.mat(), crasse: false },
    ouv: { n: [porteF(86, 0.9, { couleurPorte: 0x6a7a5a, angle: 1.5 }), fen(84.2, 0.8, { bris: 0.5, cadre: 0x6a5a40 })], e: [fen(26, 1.0, { bris: 0.7, cadre: 0x6a5a40 })], s: [fen(87.5, 1.0, { bris: 0.4, cadre: 0x6a5a40 })] },
  });
  // le bardage de planches (lames verticales)
  for (let x = 83.2; x < 89; x += 0.6) for (const z of [23 - 0.07, 29 + 0.07]) c.pave(x - 0.02, 0, z - 0.02, x + 0.02, COUPE, z + 0.02, 0x6a5a40, M.mat());
  k.repere({ x: 86, y: 2.4, z: 26 }, () => {
    k.boite(6.8, 0.08, 7.0, 0x8a9496, { y: 0.35, rx: -0.1 }, M.ondule());
  });
  c.pave(83, 0, 23, 89, 0.04, 29, 0x7a6a50, M.mat(), { crasse: false });
  c.repere({ x: 88.4, z: 26, ry: -PI / 2 }, () => {
    c.boite(3.2, 0.08, 0.8, C.bois, { y: 0.9 }, M.mat());
    for (const s of [-1, 1]) c.boite(0.08, 0.9, 0.7, C.boisSombre, { x: s * 1.4, y: 0.45 }, M.mat());
    for (let i = 0; i < 9; i++) c.boite(0.05, 0.4 + (i % 3) * 0.15, 0.04, [0x8a8c88, 0x6a4a30, 0xb8332a][i % 3], { x: -1.4 + i * 0.35, y: 1.3, z: -0.35, rz: (i % 2) * 0.2 }, M.metal());
    c.boite(0.3, 0.2, 0.2, 0x6a6a68, { x: 1.0, y: 1.04 }, M.metal());
  });
  // la dynamo à pédales : un vieux vélo sur son support, une batterie, des fils
  velo(c, 84.5, 27.6, 0, 0x3a5a7a, false, 0.25);
  c.boite(1.2, 0.25, 0.4, 0x4a4a48, { x: 84.5, y: 0.12, z: 27.6 }, M.tole());
  c.boite(0.35, 0.25, 0.2, 0x1c1c1c, { x: 83.6, y: 0.17, z: 28.4 }, M.satin());
  c.tube([84.9, 0.4, 27.6], [83.6, 0.3, 28.4], 0.01, 0xb8332a, M.mat(), 3);
  for (let i = 0; i < 4; i++) bidon(c, 83.5 + i * 0.4, 23.5, [0x3a6a9a, 0xb8332a][i % 2], 0.04);
  etagere(c, 83.4, 25.3, PI / 2, 1.6, 1.8, 0.35, C.boisGris, 4, M.mat());
  for (let i = 0; i < 8; i++) cylY(c, 83.4, 24.7 + (i % 4) * 0.35, 0.14 + Math.floor(i / 4) * 0.55, 0.32 + Math.floor(i / 4) * 0.55, 0.06, 0.06, 0xd8e0d0, M.verre(), 6);
  c.repere({ x: 86.2, z: 25.4 }, () => {
    c.boite(0.12, 0.25, 0.12, 0x2a2a2a, { y: 1.0 }, M.tole());
    c.boite(0.08, 0.14, 0.08, 0xffd27a, { y: 1.0 }, M.lisse());
  });
  table(c, 86.2, 25.4, 0.8, 0.6, C.boisGris, 0, 0.85);
  b.lumiere(86.2, 1.4, 25.4, 0xffc070, 4, 8, "lanterne dans la cabane-atelier des jardins");
  // la friche du fond, à l'est : herbes hautes, bouleaux, gravats
  c.pave(91, 0, 15.2, 99.4, 0.015, 34.4, C.friche, M.herbe(), { crasse: false, nuance: 0 });
  semerTouffes(c, 91, 15.5, 99.3, 34.3, Math.round(40 + 50 * u), C.herbeSeche, 0.015);
  semerTouffes(c, 51, 6.6, 99, 34, Math.round(20 + 40 * u), C.herbeSeche, 0.03);
  arbre(c, 95, 20, 7.5, "bouleau");
  arbre(c, 97.5, 28, 6.5, "bouleau");
  arbre(c, 92.5, 31.5, 5.5, u > 0.5 ? "mort" : "bouleau");
  arbre(c, 66, 33, 6, "feuillu");
  massif(c, 91.5, 16, 99, 33, 6, 1.5);
  gravats(c, 94, 25, 1.3, Math.round(5 + 8 * u));
}

/** Une petite cabane de jardin en planches, toit de tôle à une pente, porte entrouverte. Obstacle. */
function cabane(ctx, x, z, l, p, ry, couleur) {
  const { b, c } = ctx;
  c.repere({ x, z, ry }, () => {
    c.boite(l, 2.0, p, couleur, { y: 1.0 }, M.mat(), { nuance: 0.05 });
    for (let xx = -l / 2 + 0.15; xx < l / 2; xx += 0.3) c.boite(0.03, 2.0, 0.03, 0x5a4a3a, { x: xx, y: 1.0, z: p / 2 + 0.01 }, M.mat());
    c.boite(l + 0.4, 0.06, p + 0.5, 0x8a9496, { y: 2.15, rx: 0.12 }, M.ondule());
    c.boite(0.8, 1.8, 0.04, couleur, { x: -0.1 + 0.35, y: 0.9, z: p / 2 + 0.35, ry: -0.9 }, M.mat());
    c.boite(0.7, 1.75, 0.02, 0x1c1c1a, { x: -0.1, y: 0.9, z: p / 2 + 0.005 }, M.mat());
  });
  obstacleTourne(b, x, z, l, p, ry, "cabane de jardin");
}

// ---------- Le contrat : creer({ usure, carte }) ----------

/** Recentre ce qui a été bâti dans le repère de la halte sur le centre du tronçon. */
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
  const dedans = (x, z) => Math.abs(x) <= lot.l / 2 + 1 && Math.abs(z) <= lot.p / 2 + 1;
  ud.obstacles = ud.obstacles.map((s) => ({ ...s, x1: arr(s.x1 - dx), x2: arr(s.x2 - dx) })).filter((s) => dedans(s.x1, s.z1) || dedans(s.x2, s.z2));
  ud.lumieres = ud.lumieres.map((l) => ({ ...l, x: arr(l.x - dx) })).filter((l) => dedans(l.x, l.z));
  return groupe;
}

export function creer({ usure = 0.7, carte = "faubourg" } = {}) {
  const t = TRONCONS.find((k) => k.id === carte) ?? TRONCONS[0];
  const idx = TRONCONS.indexOf(t);
  const b = new Batiment(4100 + idx * 13, usure);
  const ctx = { b, c: b.c, u: usure, xa: t.x - 25, xb: t.x + 25 };

  sol(ctx);
  bords(ctx);
  reverberes(ctx);
  panneaux(ctx);
  if (t.id === "faubourg") {
    pavillon1(ctx);
    pavillon2(ctx);
    square(ctx);
  } else if (t.id === "epicerie") {
    epicerie(ctx);
    parking(ctx);
    chantier(ctx);
    pavillon3(ctx);
    abordsOuest(ctx);
  } else if (t.id === "passage") {
    abordsOuest(ctx);
    voie(ctx);
    grillagesVoie(ctx);
    locomotive(ctx);
    porteConteneurs(ctx);
    wagonCouvert(ctx);
    citerne(ctx, CB, 0xb0aaa0, true);
    citerne(ctx, CC, 0x8a8a84, false);
    attelages(ctx);
    conteneurTombe(ctx);
    passageNiveau(ctx);
    passerelle(ctx);
    maisonnette(ctx);
    posteAiguillage(ctx);
    boxGarages(ctx);
    abordsEst(ctx);
  } else {
    depot(ctx);
    jardins(ctx);
  }
  return recentrer(b.construire(), t.x, { l: 50, p: 70 });
}
