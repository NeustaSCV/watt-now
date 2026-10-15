// Halte : la route du pont (route du Littoral, Book 20 §4 ; Book 01 §2 bis : les haltes).
//
// Près de l'estuaire, la rivière qui descend du barrage (Book 20 §1 ter) s'élargit vers la mer, au sud. La route du
// Littoral la franchit sur le pont de l'estuaire, un pont suspendu de 1934 : deux pylônes de béton Art déco et leurs
// portiques, deux câbles porteurs, des suspentes, un tablier raidi par deux poutres latérales en treillis. À marée
// basse, l'eau est huit mètres sous le tablier (y = −8), entre des quais de pierre hauts comme des falaises et des
// bancs de vase. Une nuit de tempête, la moitié sud du tablier a lâché sur vingt mètres : elle pend en V jusque dans
// l'eau. Il ne reste qu'une voie le long du garde-corps nord, et au milieu un trou que des survivants ont couvert de
// planches (goulet n° 1). Au pylône ouest, d'autres survivants ont fermé le portique d'une chicane de voitures, avec un
// poste de guet sur la pile (goulet n° 2).
//
// Repère de la halte entière : 200 × 70 m, origine au centre, +x à l'est, +z au sud (vers la mer). Le tablier et les
// quais visitables sont à y = 0. Tout est bâti dans ce repère, puis chaque tronçon (50 × 70 m) ne garde que ce qui
// tombe dans sa bande de x et se recentre (`recentrer`). Les pièces longues (tablier, treillis, câbles, eau, fond,
// route) sont découpées par panneaux ou par morceaux attribués au tronçon qui contient leur milieu : raccords exacts.
//
// Tronçons, d'ouest en est :
//   bourg   (−100 … −50) la rive ouest : maison du pontier et péage ancien, bar-épicerie, quai, carrelet ;
//   pylone  ( −50 …   0) le pylône ouest barricadé (chicane, poste de guet sur la pile), le début du tablier ;
//   breche  (   0 …  50) la brèche : le tablier qui pend, les planches, la voiture suspendue, le drone, le pylône est ;
//   marins  (  50 … 100) la rive est : chapelle des marins, cale et péniche échouée, hangar à bateaux, dunes.

import * as THREE from "three";
import { Batiment, Chantier, PALETTE, aleatoire, mur, gravats, debris, jonchee, raiDeLumiere, toitDeuxPans, mousse, touffes } from "../commun/atelier.js";
import { C, R, TEXTES_SORTIE, chiffre, matieres, panneau, boiteAtlas, boiteEntre, planche, cylindre, pilier, dalle, obstacleBoite, BOULE, CAILLOU, oyats, semerOyats, dune, fientes, couluresBlanches, bitte, glene, bouee, barbeles, caisse, casier, filet, filetPendu, barque, voiture, camionnette, chaise, table, etagere, tonneau, sacs, palette } from "./objets.js";

// ---------- Les tronçons ----------

const X0 = { bourg: -75, pylone: -25, breche: 25, marins: 75 };

/** Le filtre d'un tronçon : un objet appartient au tronçon qui contient son centre (les bouts de la halte débordent). */
function bande(x0) {
  const xa = x0 - 25;
  const xb = x0 + 25;
  return (x) => (x >= xa || xa <= -100) && (x < xb || xb >= 100);
}

const arr = (v) => Math.round(v * 100) / 100;
const versTroncon = (liste, id) => liste.filter((o) => bande(X0[id])(o.x)).map((o) => ({ ...o, x: arr(o.x - X0[id]) }));

// ---------- Le plan ----------

const Y_EAU = -8; // marée basse
const Y_HAUTE = -5.7; // marée haute : l'eau couvre les bancs, elle s'arrête au haut de la laisse verte des quais
const ZERO_ECHELLE = Y_EAU - 0.5; // le zéro de l'échelle de marée (marée basse : 0,5 ; marée haute : 2,8)
// La cale basse du quai sud-ouest (tronçon « bourg ») : une cale pavée et envasée, au ras de l'eau, 0,5 m sous le quai.
// On y fouille à marée basse ; à marée haute, une nappe la recouvre. On y descend du quai par deux marches basses.
const Y_CALE = -0.5;
const CALE = { x1: -58, x2: -51, z1: 14.6, z2: 34.4 };
const ACCES = { x: -58, z1: 16.0, z2: 18.0 }; // l'accès, dans le bord du quai (2 m) : le haut du mur, puis une marche
const RETOUR = { x: -59.2, z: 17.0 }; // en haut de l'accès, sur le quai : là où le jeu remet un joueur quand la mer monte
const GRILLE = { x: -44.6, z1: 1.75, z2: 3.55 }; // la porte de la chicane, entre ses deux poteaux
// La caisse du péage (H-1, décision du porteur V2-04) : devant la porte, côté terrain (à l'ouest de la chicane, là où
// l'on arrive), au pied des sacs de sable, sous le panneau « DANS LA CAISSE ↓ » ; enchaînée au poteau sud de la porte.
const CAISSE = { x: -45.12, z: 4.45 };
const ANGLE_PORTE = 1.62; // la porte ouverte, rabattue vers l'est contre les sacs
const Y_FOND = -9.6;
const Y_VASE = -7.82;
const HL = 3.5; // demi-largeur de la chaussée
const ZTR = 5.4; // bord des trottoirs, à terre
const XP = 37.5; // les pylônes, en ±XP
const ZL = 7.1; // l'axe des jambes des pylônes
const ZT = 5.8; // l'axe des poutres en treillis
const ET = 0.36; // leur épaisseur
const ZB = ZT - ET / 2; // le bord intérieur du tablier (garde-corps)
const HT = 2.2; // hauteur des poutres en treillis
const YS = 14.3; // le câble sur la selle du pylône
const YM = 3.4; // le câble au milieu de la travée
const XA = 55.5; // le câble entre dans le massif d'ancrage
const YA = 2.4;
const PAN = 2.5; // le pas des panneaux du tablier (les tronçons tombent sur un multiple)
const COL = { x1: -5, x2: 15, zb: -1.8 }; // l'effondrement : la moitié sud du tablier pend entre x1 et x2
const TROU = { x1: 2.5, x2: 7.5, zp: -4.0 }; // le trou de la voie nord, couvert de planches (z de −5,5 à zp)
const PERCEE = { x1: -37.5, x2: -35 }; // le panneau du treillis sud découpé au chalumeau, vers le poste de guet
const ANGLE_DALLE = Math.asin(0.86); // les dalles qui pendent descendent jusque dans l'eau
const FORME = { x1: 64, x2: 78, z1: 19, z2: 27, y: -1.3 }; // la forme de radoub au sommet de la cale
const PENICHE = { x1: 64.5, x2: 77.0, z1: 20.6, z2: 25.4 };
const PASSERELLE = { x1: PENICHE.x1 + 0.2, x2: PENICHE.x1 + 1.55 }; // la passerelle : 1,35 m entre ses bords (T4)

/** La hauteur du câble porteur en x (parabole dans la travée centrale, droite qui fléchit vers les ancrages). */
function cableY(x) {
  const ax = Math.abs(x);
  if (ax <= XP) return YM + (YS - YM) * (ax / XP) ** 2;
  const t = Math.min(1, (ax - XP) / (XA - XP));
  return YS + (YA - YS) * t - 0.7 * Math.sin(Math.PI * t);
}

/** Le câble se rapproche du tablier au milieu de la travée (il passe au-dessus du treillis). */
function cableZ(x) {
  const ax = Math.abs(x);
  if (ax <= XP) return 5.9 + (ZL - 5.9) * (ax / XP) ** 2;
  return ZL;
}

// ---------- Les données de jeu (repère de la halte) ----------

const ENTREES = [
  { x: -100, z: 0, nature: "entrée A : la route du Littoral arrive du bourg (vers le terrain)" },
  { x: -74, z: -6.6, nature: "porte de la maison du pontier (cuisine), sur la route" },
  { x: -86, z: 6.4, nature: "porte du bar-épicerie « Au Rendez-vous des Pêcheurs », côté route" },
  { x: -79.9, z: 9.2, nature: "porte de la terrasse du bar, côté quai" },
  { x: -58, z: -27, nature: "ponton du carrelet, depuis le quai nord" },
  { x: -50, z: 0, nature: "tête du pont : le tablier commence au-dessus du quai" },
  { x: -44.6, z: 2.65, nature: "la porte du péage, dans la chicane (1,8 m entre ses poteaux ; fermée au départ : objet « chicane_fermee »)" },
  { x: -35.7, z: 5.8, nature: "percée dans le treillis sud (1,45 m entre le pied du pylône et le treillis) : vers la pile, le poste de guet et la réserve des guetteurs (1,4 m entre le pied du pylône et la cabane)" },
  { x: -34.8, z: 8.2, nature: "porte du poste de guet (1,5 m)" },
  { x: -58, z: 17.0, nature: "accès à la cale basse (2 m, deux marches basses) : à marée basse seulement" },
  { x: 2.3, z: -4.7, nature: "les planches au-dessus du trou (un à la fois)" },
  { x: 50, z: 0, nature: "tête du pont, rive est" },
  { x: 67, z: -9.4, nature: "porte de la chapelle des marins" },
  { x: 65.2, z: 19.2, nature: "passerelle de la péniche échouée dans la forme" },
  { x: 81, z: 21.5, nature: "grandes portes du hangar à bateaux, face à la cale" },
  { x: 88, z: 29, nature: "porte de service du hangar (sud)" },
  { x: 100, z: 0, nature: "sortie B : la route du Littoral file vers le Grand Hôtel des Flots" },
];

const FOUILLE = [
  // Le bourg
  { x: -68.8, z: -9.6, quoi: "bureau du pontier : registre des passages (1934-…), tampon, caisse du péage (pièces, jetons)" },
  { x: -67, z: -7.4, quoi: "guichet du péage : rouleaux de tickets, lampe de poche à dynamo, trousseau du pont" },
  { x: -75.6, z: -8.3, quoi: "cuisine du pontier : conserves, sel, café, réchaud à pétrole" },
  { x: -72, z: -14.2, quoi: "réserve du pontier : bidons de pétrole, bougies, cordages, bâches goudronnées" },
  { x: -88, z: 10.9, quoi: "comptoir du bar : bouteilles (cidre, rhum, sirop), sucre, tabac" },
  { x: -82.6, z: 9.5, quoi: "rayons de l'épicerie : conserves de sardines, sel, allumettes, appâts, fil dentaire" },
  { x: -86.5, z: 14.3, quoi: "réserve du bar : fûts, sacs de sel, filets de pommes de terre germées" },
  { x: -66, z: 27, quoi: "casiers et caisses à poissons du quai : cordages, flotteurs, couteaux à poisson" },
  { x: -54.4, z: 10.6, quoi: "grue de quai : câble d'acier, poulie, crochet" },
  { x: -52.8, z: 8.7, quoi: "tas de ferraille au pied de la grue : barres, lames de ressort, une jante (vrac)" },
  { x: -63.6, z: 31.4, quoi: "pierres du parapet de quai éboulé (vrac)" },
  { x: -60.2, z: -5.4, quoi: "armoire technique du portique « connecté » : câbles de cuivre arrachés, résistances (vrac)" },
  // Le banc de vase du quai (y = −7,82), par l'escalier : visibles et fouillables à marée basse seulement
  { x: -54.4, z: 19.0, y: Y_CALE, maree: "basse", quoi: "à marée basse : débroussailleuse échouée sur la cale (tube d'aluminium, petit moteur)" },
  { x: -54.3, z: 22.8, y: Y_CALE, maree: "basse", quoi: "à marée basse : caddie échoué dans la vase de la cale (tubes, roulettes)" },
  { x: -54.6, z: 24.7, y: Y_CALE, maree: "basse", quoi: "à marée basse : trottinette d'enfant (tube d'aluminium)" },
  { x: -54.3, z: 27.0, y: Y_CALE, maree: "basse", quoi: "à marée basse : la mobylette couchée dans la vase (la bobine d'allumage, chaîne, câbles)" },
  { x: -54.0, z: 30.3, y: Y_CALE, maree: "basse", quoi: "à marée basse : trottinette d'enfant (tube d'aluminium)" },
  { x: -54.5, z: 32.5, y: Y_CALE, maree: "basse", quoi: "à marée basse : caddie échoué dans la vase de la cale (tubes, roulettes)" },
  { x: -53, z: -27, quoi: "carrelet : grand filet carré, treuil, seau, lampe frontale" },
  { x: -70, z: 20, quoi: "barque retournée sur le quai : avirons, écope, ancre" },
  { x: -65.8, z: -4.6, quoi: "borne « Pont Express » : batterie, monnayeur, écran" },
  { x: -84, z: -24, quoi: "dériveur échoué dans les dunes : voile (bâche), cordages, poulies" },
  // Le pylône barricadé
  { x: CAISSE.x, z: CAISSE.z, quoi: "la caisse du péage, devant la porte, côté terrain : on y dépose son dû (objet « caisse_peage »)" },
  { x: -40, z: 8.8, quoi: "réserve des guetteurs, sur la pile : conserves de péage, couvertures polaires, fûts d'eau" },
  { x: -44.5, z: -3.2, quoi: "voiture de la chicane : coffre (bâche, cric, trousse de secours)" },
  { x: -30.5, z: 3.2, quoi: "voiture de la chicane : boîte à gants, siège-auto, glacière" },
  { x: -19, z: 1.9, quoi: "voiture brûlée : ferraille, ressorts, jantes" },
  { x: -10.5, z: -2.6, quoi: "voiture aux portes ouvertes : valises (vêtements), sac de voyage, thermos" },
  // La brèche
  { x: 9.3, z: -2.9, quoi: "voiture suspendue : sac sur la banquette arrière, à portée de main… au-dessus du vide" },
  { x: 22, z: -2.4, quoi: "voiture de la voie nord : couverture polaire, lampe de poche, carte routière" },
  { x: 30.5, z: 2.6, quoi: "camionnette de livraison : colis (chargeurs, gadgets, une bouilloire connectée, des chaussettes)" },
  { x: 27.2, z: 4.4, quoi: "colis tombé du drone, éventré sur le tablier" },
  // La rive des marins
  { x: 67, z: -20.4, quoi: "chapelle : cierges, nappe d'autel (tissu), ex-voto de laiton" },
  { x: 64, z: -15, quoi: "chapelle : maquettes de bateaux ex-voto (bois, cordelette, toile)" },
  { x: 67.7, z: 22.3, quoi: "péniche : salon (coussins, plaids polaires, livres de bord), cuisine (conserves, réchaud à gaz)" },
  { x: 74.2, z: 23, quoi: "timonerie de la péniche : jumelles, carte de l'estuaire, corne de brume" },
  { x: 85, z: 18, quoi: "hangar : barques, avirons, filets, flotteurs" },
  { x: 92.6, z: 27.7, quoi: "établi du hangar : le moteur hors-bord (la bobine d'allumage), outils, goudron" },
  { x: 94.25, z: 27.1, quoi: "bidon d'huile, au pied de l'établi (vrac)" },
  { x: 61.5, z: 31.4, quoi: "pierres du parapet de quai éboulé (vrac)" },
  { x: 90, z: 15.6, quoi: "hangar : cordages, gilets de sauvetage, bâches" },
  { x: 79.6, z: 23, quoi: "treuil de la cale : câble, manivelle, engrenages" },
  { x: 62, z: 9.5, quoi: "bouée connectée du quai : petite batterie, balise" },
];

const ETEINTS = [
  { x: -88.2, z: 12, type: "ancien habitant (le patron du bar, tablier bleu, derrière son comptoir)" },
  { x: -69.5, z: -12.8, type: "rampant (sous la table de la réserve du pontier)" },
  { x: -64, z: 25, type: "errant (sur le quai, entre les casiers)" },
  { x: -53.8, z: 20.4, y: Y_CALE, maree: "basse", type: "Noyé (enlisé dans la vase, près du caddie)" },
  { x: -55.1, z: 25.9, y: Y_CALE, maree: "basse", type: "Noyé (couché dans la vase, au milieu de la cale)" },
  { x: -53.6, z: 33.3, y: Y_CALE, maree: "basse", type: "Noyé (au bout de la cale, contre la clôture)" },
  { x: -78, z: -26, type: "errant (dans les oyats, derrière la ganivelle)" },
  { x: -43, z: 3.0, type: "équipé (casque de chantier et gilet de sauvetage, derrière la porte du péage)" },
  { x: -47.5, z: -0.6, type: "errant (devant la chicane, adossé aux sacs de sable)" },
  { x: -39.6, z: 9.6, type: "errant (sur la pile, au pied du poste de guet)" },
  { x: -15, z: -3.4, type: "rampant (entre les voitures du tablier)" },
  { x: 1.6, z: -2.6, type: "rampant (remonté de la dalle qui pend, accroché au bord de la brèche)" },
  { x: 11.5, z: -3.6, type: "errant (au bord du vide, il regarde la voiture suspendue)" },
  { x: -3.5, z: -4.6, type: "errant (à l'entrée des planches, côté ouest)" },
  { x: 26, z: 2.2, type: "errant (contre la camionnette de livraison)" },
  { x: 33, z: -4, type: "putréfié (gonflé d'eau de mer, au pied du pylône est)" },
  { x: 66.5, z: -14.5, type: "ancien habitant (le sacristain, ciré jaune délavé, entre les bancs)" },
  { x: 88, z: 21, type: "équipé (gilet de sauvetage orange et gaffe, dans le hangar)" },
  { x: 71.5, z: 23.4, type: "putréfié (dans la cuisine de la péniche)" },
  { x: 84, z: -26, type: "errant (dans les dunes)" },
];

const TRONCONS = [
  { id: "bourg", nom: "Le bourg du pont", depart: { x: -98, z: 1.6 }, description: "la rive ouest : maison du pontier et son péage de 1934, bar-épicerie « Au Rendez-vous des Pêcheurs », quai de pierre, carrelet, portique « Pont connecté »" },
  { id: "pylone", nom: "Le pylône barricadé", depart: { x: -48, z: -1.5 }, description: "le tablier au-dessus de l'eau ; le portique du pylône ouest fermé par une chicane de voitures (goulet) ; le poste de guet et son feu sur la pile" },
  { id: "breche", nom: "La brèche", depart: { x: 0.6, z: -4.4 }, description: "la moitié sud du tablier pend dans l'eau : une seule voie de planches le long du garde-corps nord (goulet), la voiture suspendue, le drone livreur pris dans les câbles, le pylône est" },
  { id: "marins", nom: "La rive des marins", depart: { x: 52, z: -1.5 }, description: "la chapelle des marins et ses ex-voto, la cale et la péniche échouée qu'on visite, le hangar à bateaux, les dunes à oyats" },
];

export const FICHE = {
  id: "halte-route-pont",
  nom: "La route du pont",
  lieu: "Halte · route du Littoral · le pont de l'estuaire",
  environnement: "littoral (estuaire)",
  anneau: "proche → moyen",
  danger: 3,
  halte: true,
  solPropre: true, // l'estuaire est huit mètres sous le tablier : chaque tronçon fournit tout son sol, eau et vase comprises
  recit:
    "Le pont de l'estuaire avait été inauguré en 1934 ; l'Abondance l'avait rendu « connecté », avec un péage sans arrêt qui optimisait votre passage en temps réel. Une nuit de tempête, la moitié sud du tablier a lâché et pend dans la vase : il ne reste qu'une voie le long du garde-corps nord, et quatre planches au-dessus du vide. Au pylône ouest, des survivants ont fermé le portique d'une chicane de voitures et réclament douze wotts par tête, à déposer dans une caisse au pied de leur guet : on paie, on ruse ou on force, mais on passe un par un. En bas, la marée découvre deux fois par jour des bancs de vase où dorment des caddies, des trottinettes et quelques Noyés.",
  inspiration:
    "les ponts suspendus des années 1930 et leurs pylônes de béton à gradins (Lézardrieux, l'ancien pont de Térénez, Tancarville pour l'échelle), les quais de pierre à marée basse et les carrelets de l'estuaire de la Gironde, les chapelles de marins et leurs maquettes ex-voto, les péniches de plaisance hâlées sur une cale, et les photos urbex de ponts coupés dont le tablier pend dans le fleuve",
  reperes: [
    "Le pont suspendu de 1934 : pylônes de béton Art déco à nervures et couronnement à gradins, portiques, plaque « M·CM·XXXIV », câbles porteurs, suspentes, poutres latérales en treillis vert-de-gris rongées par la rouille marine",
    "La brèche : la moitié sud du tablier pend en V jusque dans l'eau, poutre en treillis comprise ; suspentes cassées qui pendent du câble sud",
    "Goulet n° 1 : la voie unique le long du garde-corps nord, et les planches posées au-dessus du trou (« UN À LA FOIS ! »), huit mètres au-dessus de l'eau",
    "La voiture suspendue au-dessus du vide, retenue par son pare-chocs arrière (feux de détresse la nuit)",
    "Goulet n° 2 : le portique du pylône ouest fermé par une chicane de voitures, sacs de sable et barbelés ; la porte du péage en tôle ondulée (fermée ou ouverte), son panneau « PÉAGE 12 WOTTS / TÊTE » ; la caisse du péage devant la porte, côté terrain, enchaînée au poteau ; le poste de guet sur la pile, son feu, le drapeau de chiffon de la vigie, la réserve des guetteurs",
    "Le portique « Pont connecté — votre passage est optimisé en temps réel », qui clignote encore, et la borne « Pont Express sans arrêt » à côté du vieux guichet de 1934",
    "Le drone livreur pris dans les suspentes, son colis « Livré en 7 min — garanti » éventré sur le tablier",
    "La maison du pontier : guichet du péage, tarif de 1934 (piéton 0 f 10), registre des passages, cuisine, réserve ; sa bougie la nuit",
    "Le bar-épicerie « Au Rendez-vous des Pêcheurs », sa terrasse face au quai, l'ardoise « Wi-Fi des marées offert (aux abonnés Premium) »",
    "La marée : à marée basse, les bancs de vase découverts, et la cale basse pavée et envasée du quai sud-ouest où sont échoués les caddies, les trottinettes d'enfant, la mobylette et la débroussailleuse ; à marée haute, l'eau monte de 2,3 m, couvre les bancs, et une nappe noie la cale",
    "L'échelle de marée émaillée sur le quai, sous le tablier : des « E » noirs et rouges, un chiffre par mètre (0,5 à marée basse, 2,8 à marée haute), et le tableau « Marées en direct sur l'appli »",
    "Le vrac : la ferraille au pied de la grue (barres, lames de ressort), les câbles de cuivre arrachés à l'armoire du portique « connecté », le bidon d'huile du hangar, les pierres des parapets éboulés",
    "Le carrelet sur ses pilotis et son grand filet carré au-dessus de l'eau",
    "La chapelle des marins : maquettes de bateaux suspendues, ex-voto peints, bougie la nuit",
    "La cale, son treuil, et la péniche « Ma Liberté » échouée dans la forme : on la visite (salon, cuisine, timonerie)",
    "Le hangar de la Société des canotiers : barques sur tréteaux, filets, avirons, le moteur hors-bord serré sur l'établi",
    "Le vent : oyats couchés, drapeaux en lambeaux, manche à air ; plus une mouette, mais leurs fientes partout",
    "Les bords (R52) : la ganivelle de châtaignier et les dunes aux deux bouts et au sud des terre-pleins, la ganivelle du nord qui file au-delà ; la route qui continue vers le bourg à l'ouest et vers l'hôtel à l'est",
    "Les deux panneaux de sortie, tournés vers le sud-est, une lanterne au-dessus qui luit la nuit",
    "Les alentours : l'estuaire qui remonte au nord entre ses quais, et au sud l'embouchure entre deux jetées, la plage, l'eau claire sur le sable, la ligne des brisants, la mer sombre au large",
  ],
  lot: { l: 200, p: 70 },
  depart: { x: -98, z: 1.6 },
  goulets: [
    { x: 5, z: -4.75, nature: "la brèche : une seule voie de planches au-dessus du vide, le long du garde-corps nord ; on passe un par un, huit mètres au-dessus de l'eau" },
    { x: -44.6, z: 2.65, nature: "le péage du pylône ouest : la porte de la chicane (1,8 m), fermée tant qu'on n'a pas payé, sous l'œil du poste de guet de la pile, la caisse devant elle côté terrain ; puis le passage nord de la seconde voiture (x = −30,7)" },
  ],
  panneaux: [
    { x: -95, z: -6.6, texte: TEXTES_SORTIE.ouest, sortie: "ouest", nom: "panneau_sortie_ouest", lanterne: { x: -94.65, y: 2.66, z: -6.25 } },
    { x: -61.6, z: 0, texte: "PONT CONNECTÉ — votre passage est optimisé en temps réel" },
    { x: -65.8, z: -4.6, texte: "PONT EXPRESS — sans arrêt" },
    { x: -44.6, z: 2.65, texte: "PÉAGE · 12 WOTTS / TÊTE · DANS LA CAISSE ↓" },
    { x: 61.6, z: 0, texte: "FIN DU PONT CONNECTÉ — merci d'avoir été optimisé" },
    { x: 95, z: 6.6, texte: TEXTES_SORTIE.est, sortie: "est", nom: "panneau_sortie_est", lanterne: { x: 95.35, y: 2.66, z: 6.95 } },
  ],
  // Les objets à part, nommés (T2, T3) : creer() les range dans groupe.userData.objets. État de départ : maree_basse,
  // chicane_fermee et caisse_peage visibles ; maree_haute et chicane_ouverte cachés. Chaque tronçon a ses propres
  // maree_basse et maree_haute (même nom partout) ; la chicane et la caisse sont au tronçon « pylone ».
  objets: {
    maree_basse: "les bancs de vase découverts et ce qu'ils portent (caddies, trottinettes, mobylette, débroussailleuse, pneus, barque coulée), et l'écume des brisants de basse mer au sud",
    maree_haute: "l'eau de la marée haute, 2,3 m plus haut (y = −5,7), qui couvre les bancs, dans le lot et dans les alentours (l'estuaire, la mer, les brisants de pleine mer)",
    chicane_fermee: "la porte du péage fermée, en travers de la chicane",
    chicane_ouverte: "la porte du péage ouverte, rabattue contre les sacs",
    caisse_peage: "la caisse du péage, devant la porte côté terrain, où l'on dépose son dû",
    panneau_sortie_ouest: "le panneau de sortie ouest (vers le terrain, et vers l'hôtel par le pont), sa lanterne",
    panneau_sortie_est: "le panneau de sortie est (vers le Grand Hôtel des Flots), sa lanterne",
    alentours: "le décor au-delà du lot (R52) : sol, dunes, l'estuaire et ses quais au nord, l'embouchure et la mer au sud, la route qui continue",
  },
  // La mer (R0-3) : une seule matière (celle de l'eau du lot), teintée par sommet selon la profondeur.
  mer: {
    peuProfonde: "turquoise clair : le long des quais et des bancs de vase dans l'estuaire, et au sud (z > 35, alentours) sur la plage de part et d'autre des jetées, de la laisse de basse mer (z ≈ 70) jusqu'aux brisants (z ≈ 80) ; à marée haute, de z ≈ 62 à z ≈ 66",
    profonde: "vert-bleu sombre : le chenal au milieu de l'estuaire (|x| < 50 environ), l'embouchure entre les jetées et le large au-delà des brisants",
    brisants: "une ligne d'écume blanche à z ≈ 80 (marée basse) ou z ≈ 66 (marée haute) pour |x| > 58, qui s'arrondit en barre devant l'embouchure (z ≈ 94 au milieu)",
    niveau: { basse: Y_EAU, haute: Y_HAUTE },
    note: "personne ne marche dans l'eau ici : elle est huit mètres sous le quai ; les alentours ne portent aucun obstacle",
  },
  // La marée (S-20) : deux états. Les obstacles qui ne valent qu'à un état sont à part, dans le groupe du tronçon :
  // userData.obstaclesChicane (la porte fermée), userData.obstaclesMareeHaute (la tête de l'escalier fermée par l'eau).
  maree: {
    basse: { y: Y_EAU, echelle: 0.5 },
    haute: { y: Y_HAUTE, echelle: 2.8 },
    echelle: { x: -49.37, z: 9.6, zero: ZERO_ECHELLE, nature: "échelle de marée émaillée, sur le mur de quai, face à l'est (un chiffre par mètre)" },
    cale: { y: Y_CALE, x1: CALE.x1, x2: CALE.x2, z1: CALE.z1, z2: CALE.z2, acces: { x: ACCES.x, z1: ACCES.z1, z2: ACCES.z2 }, note: "la cale basse du quai sud-ouest (tronçon « bourg ») : pavée et envasée, 0,5 m sous le quai, à plat ; on y descend par deux marches basses (l'accès fait 2 m) ; ses bords côté eau sont des obstacles ; on y fouille et on y croise des Noyés à marée basse seulement. À marée haute, une nappe locale la recouvre (dans maree_haute) et l'accès est fermé (obstaclesMareeHaute)" },
    retour: { x: RETOUR.x, z: RETOUR.z },
  },
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
    ...(t.id === "bourg" ? { retourMaree: { x: arr(RETOUR.x - X0.bourg), z: RETOUR.z } } : {}),
    objets: [
      "maree_basse",
      "maree_haute",
      ...(t.id === "pylone" ? ["chicane_fermee", "chicane_ouverte", "caisse_peage"] : []),
      ...(t.id === "bourg" ? ["panneau_sortie_ouest"] : []),
      ...(t.id === "marins" ? ["panneau_sortie_est"] : []),
      "alentours",
    ],
  })),
};

// ---------- Outils propres à la halte ----------

/**
 * Un objet à part, nommé (le jeu le montre, le cache ou l'efface) : on le bâtit dans son propre chantier, d'une seule
 * matière de préférence (un appel de dessin), puis on l'ajoute au tronçon.
 */
function objetNomme(ctx, nom, graine, batir) {
  const ch = new Chantier(graine);
  batir(ch);
  const g = ch.construire();
  g.name = nom;
  g.userData.nom = nom;
  ctx.b.ajouter(g);
  ctx.objets[nom] = g;
  return g;
}

/** Un obstacle le long de x (à z constant), coupé à la bande du tronçon. */
function segX(ctx, x1, x2, z, nature) {
  const a = Math.max(Math.min(x1, x2), ctx.xa);
  const b = Math.min(Math.max(x1, x2), ctx.xb);
  if (b - a > 0.01) ctx.b.obstacle(a, z, b, z, nature);
}

/** Un obstacle le long de z (à x constant), s'il tombe dans le tronçon. */
function segZ(ctx, x, z1, z2, nature) {
  if (ctx.ici(x)) ctx.b.obstacle(x, z1, x, z2, nature);
}

function hache(i, j) {
  let h = (i * 374761393 + j * 668265263) ^ 0x5bd1e995;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** La teinte d'un membre du treillis : peinture vert-de-gris, ou rouille marine (plus avec l'usure). */
function teinteFer(u, i, j) {
  const r = hache(i, j);
  if (r < 0.1 + 0.3 * u) return r < 0.1 ? C.rouille : C.rouilleClaire;
  return r > 0.9 ? 0x6f7c74 : C.peintureTreillis;
}

/** Un mur double : le bas (jusqu'à `coupe`) reste, le haut va dans la couche `k` (vue en coupe). */
function murDouble(ctx, k, a, bb, spec) {
  const { h, ep = 0.3, coupe = 1.05, bas, haut = bas, ouvertures = [], interieur = null, breches = [], seuil } = spec;
  mur(ctx.c, a, bb, { h: coupe, ep, couleur: bas.couleur, mat: bas.mat, interieur, batiment: ctx.b, seuilObstacle: seuil, ouvertures: ouvertures.map((o) => ({ ...o, type: o.type === "porte" ? "porte" : "vide" })) });
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
 * Un panneau de sortie (R52, R0-1) : grande tôle émaillée sur deux poteaux, tournée vers la caméra (sud-est), la vraie
 * destination peinte en grosses lettres, et une lanterne au-dessus, au bout d'une potence, qui luit la nuit et l'éclaire.
 * C'est un objet nommé « panneau_sortie_<cote> » à deux matières : l'atlas (la face, et tout le reste sur sa case
 * blanche, teinté par sommet) et la lueur (le verre de la lanterne). Sa lumière est notée dans `lumieres`.
 */
function panneauSortie(ctx, cote, r, x, z) {
  const { M, b } = ctx;
  const RY = Math.PI / 4; // la face regarde le sud-est
  const L = 3.8; // 1024 × 240 px dans l'atlas
  const H = 0.9;
  const Y = 1.75; // le milieu de la face
  const haut = Y + H / 2;
  const yV = 2.66; // le milieu du verre de la lanterne
  const av = 0.5; // la lanterne pend devant la face
  const fer = 0x2e2c2a;
  objetNomme(ctx, `panneau_sortie_${cote}`, cote === "ouest" ? 3311 : 3312, (k) => {
    const A = M.atlas;
    k.repere({ x, y: 0, z, ry: RY }, () => {
      // Les deux poteaux de fer galvanisé, leurs pieds bétonnés
      for (const s of [-1, 1]) {
        boiteAtlas(k, A, 0.1, haut + 0.08, 0.1, 0x7d878b, { x: s * (L / 2 - 0.4), y: (haut + 0.08) / 2, z: -0.08 });
        boiteAtlas(k, A, 0.34, 0.12, 0.34, 0xa8a296, { x: s * (L / 2 - 0.4), y: 0.06, z: -0.08 });
      }
      // La tôle (cadre et dos), les deux faces peintes (lisibles des deux côtés)
      boiteAtlas(k, A, L + 0.12, H + 0.12, 0.04, 0xcfcbc0, { y: Y });
      panneau(k, A, r, { y: Y, z: 0.03 }, L, H);
      panneau(k, A, r, { y: Y, z: -0.03, ry: Math.PI }, L, H);
      // Des fientes sur la tranche haute
      for (let i = 0; i < 5; i++) boiteAtlas(k, A, 0.08 + hache(i, 91) * 0.1, 0.015, 0.06, C.fiente, { x: (hache(i, 92) - 0.5) * L, y: haut + 0.07, z: 0 });
      // La potence : une tige au milieu du panneau, un bras vers l'avant, sa jambe de force
      boiteAtlas(k, A, 0.05, yV + 0.3 - haut + 0.1, 0.05, fer, { y: haut - 0.1 + (yV + 0.3 - haut + 0.1) / 2, z: -0.05 });
      boiteAtlas(k, A, 0.04, 0.04, av + 0.1, fer, { y: yV + 0.28, z: av / 2 - 0.02 });
      boiteAtlas(k, A, 0.025, 0.025, Math.hypot(av * 0.6, 0.22), fer, { y: yV + 0.17, z: av * 0.3, rx: Math.atan2(0.22, av * 0.6) });
      // La lanterne : crochet, chapeau, cadre, socle (le fer), et le verre qui luit (la lueur)
      k.repere({ x: 0, y: yV, z: av }, () => {
        boiteAtlas(k, A, 0.015, 0.07, 0.015, fer, { y: 0.25 });
        boiteAtlas(k, A, 0.2, 0.06, 0.2, fer, { y: 0.17, ry: Math.PI / 4 });
        boiteAtlas(k, A, 0.17, 0.03, 0.17, fer, { y: 0.11 });
        boiteAtlas(k, A, 0.16, 0.035, 0.16, fer, { y: -0.1 });
        for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) boiteAtlas(k, A, 0.02, 0.19, 0.02, fer, { x: sx * 0.07, z: sz * 0.07 });
        k.boite(0.13, 0.17, 0.13, 0xffd890, {}, M.lueur, { crasse: false, nuance: 0 });
        k.boite(0.08, 0.12, 0.08, 0xffe6b0, {}, M.lueur, { crasse: false, nuance: 0 });
        k.boite(0.05, 0.08, 0.05, 0xfff2d0, {}, M.lueur, { crasse: false, nuance: 0 });
      });
    });
  });
  b.lumiere(arr(x + Math.sin(RY) * av), yV, arr(z + Math.cos(RY) * av), 0xffcf8a, 6, 5, "lanterne du panneau de sortie");
}

/**
 * Une ganivelle (lattes de châtaignier, deux fils de fer) le long d'un segment quelconque, sans découpe au tronçon :
 * pour les bords du lot (R52) et ses prolongements au-delà. `obstacle` : on y bute (sur la limite du lot).
 */
function ganivelleSeg(ctx, x1, z1, x2, z2, { obstacle = true, ensable = 0.3, graine = 77, pas = 0.16 } = {}) {
  const { c, M } = ctx;
  const L = Math.hypot(x2 - x1, z2 - z1);
  const dx = (x2 - x1) / L;
  const dz = (z2 - z1) / L;
  const ry = -Math.atan2(z2 - z1, x2 - x1);
  const pied = ensable * 0.25;
  let k = 0;
  for (let u = 0.1; u < L; u += pas, k++) {
    const x = x1 + dx * u;
    const z = z1 + dz * u;
    if (k % Math.round(2.4 / pas) === 0) c.boite(0.08, 1.25, 0.08, 0x7a6e5e, { x, y: 0.625 - pied, z, ry }, M.mat, { nuance: 0.08 });
    if (hache(k, graine) < 0.1) continue; // une latte arrachée
    const couchee = hache(k, graine + 1) < 0.08;
    const h = 1.1 - ensable * hache(k, graine + 2);
    c.boite(0.05, h, 0.03, C.boisGris, { x: x - dz * (hache(k, graine + 3) - 0.5) * 0.06, y: h / 2 - pied, z: z + dx * (hache(k, graine + 3) - 0.5) * 0.06, ry, rx: couchee ? 0.6 : (hache(k, graine + 4) - 0.5) * 0.12 }, M.mat, { nuance: 0.1, crasse: false });
  }
  for (const y of [0.3, 0.85]) c.boite(L, 0.015, 0.015, 0x6a625a, { x: (x1 + x2) / 2, y: y - pied, z: (z1 + z2) / 2, ry }, M.metal, { crasse: false });
  if (obstacle) ctx.b.obstacle(x1, z1, x2, z2, "ganivelle et dunes");
}

/**
 * Les bords d'un bout du lot (R52, H-2) : la ganivelle sur la limite de part et d'autre de la route (qui reste
 * ouverte), la ganivelle du sud du terre-plein (à la place de la clôture du port), les dunes posées dessus (elles
 * débordent d'un mètre au plus sur ce qu'on foule), le sable qui mord les pavés, la ganivelle du nord prolongée au-delà.
 */
function bordsDuBout(ctx, sx) {
  const { c, M } = ctx;
  const xl = sx * 99.7; // la limite (la zone du jeu s'arrête à 99,5)
  const zFin = sx < 0 ? 23.5 : 34.6; // à l'ouest, les maisons du bourg ferment le reste
  const gr = sx < 0 ? 11 : 21;
  ganivelleSeg(ctx, xl, -30.5, xl, -ZTR - 0.2, { graine: gr });
  ganivelleSeg(ctx, xl, ZTR + 0.2, xl, zFin, { graine: gr + 1 });
  // Le sud du terre-plein, du quai au bout du lot
  const [s1, s2] = sx < 0 ? [-80, -58.4] : [58.4, 100];
  ganivelleSeg(ctx, s1, 34.6, s2, 34.6, { graine: gr + 2, ensable: 0.45 });
  // La ganivelle du nord prolongée d'une vingtaine de mètres au-delà du bout (décor : hors du lot)
  ganivelleSeg(ctx, sx * 121, -30.5, sx * 100, -30.5, { obstacle: false, graine: gr + 3, ensable: 0.5, pas: 0.3 });
  // Les dunes sur la limite, côté dehors
  const A = aleatoire(sx < 0 ? 3301 : 3307);
  for (let z = -27.5; z < zFin + 3; z += 5 + A() * 2.5) {
    if (z > -ZTR - 3.5 && z < ZTR + 3.5) continue;
    const l = 5 + A() * 4;
    const p = 4 + A() * 3;
    dune(c, M, xl + sx * (l / 2 - 0.9), z, l, p, 0.7 + A() * 0.6, 2);
  }
  for (let x = s1 + 2; x < s2 - 1; x += 6 + A() * 3) {
    const l = 5 + A() * 3;
    const p = 4 + A() * 2;
    dune(c, M, x, 34.6 + p / 2 - 0.9, l, p, 0.6 + A() * 0.6, 2);
    // Le sable que le vent pousse sur les pavés, contre la ganivelle
    c.boite(l * 0.8, 0.04, 0.7 + A() * 0.5, C.sableClair, { x, y: 0.035, z: 34.1, ry: (A() - 0.5) * 0.15 }, M.sol, { crasse: false, nuance: 0.03 });
  }
  semerOyats(c, M, Math.min(xl, xl + sx * 4), -30, Math.max(xl, xl + sx * 4), zFin, 18);
  semerOyats(c, M, s1, 34.8, s2, 37, Math.round((s2 - s1) / 3));
}

/** Un réverbère de bord de mer en fonte (éteint), un peu penché par le vent. */
function reverbere(ctx, x, z, penche = 0) {
  const { c, M } = ctx;
  c.repere({ x, y: 0, z, rz: penche }, () => {
    cylindre(c, M.tole, 0x3f4a4a, 0, 0, 0, 0.16, 0.22, 0.6, 8);
    cylindre(c, M.tole, 0x3f4a4a, 0, 0.6, 0, 0.06, 0.08, 3.4, 6);
    c.boite(0.7, 0.06, 0.06, 0x3f4a4a, { x: 0.3, y: 3.9 }, M.tole);
    cylindre(c, M.verre, 0xd8d8c8, 0.62, 3.55, 0, 0.16, 0.12, 0.32, 6);
    cylindre(c, M.tole, 0x3f4a4a, 0.62, 3.86, 0, 0.04, 0.22, 0.14, 6);
    fientes(c, M, 0.45, -0.15, 0.8, 0.15, 4.0, 2);
  });
}

/** Une ganivelle (clôture de châtaignier contre le sable), en partie couchée. */
function ganivelle(ctx, x1, x2, z, ensable = 0.3) {
  const { c, M } = ctx;
  const a = Math.max(x1, ctx.xa);
  const b = Math.min(x2, ctx.xb);
  if (b - a < 0.2) return;
  for (let x = a + 0.1; x < b; x += 0.16) {
    const i = Math.round(x * 10);
    if (hache(i, 77) < 0.12) continue;
    const couchee = hache(i, 78) < 0.15;
    const h = 1.1 - ensable * hache(i, 79);
    c.boite(0.05, h, 0.03, C.boisGris, { x, y: h / 2, z: z + (hache(i, 80) - 0.5) * 0.06, rx: couchee ? 0.7 : (hache(i, 81) - 0.5) * 0.12 }, M.mat, { nuance: 0.1, crasse: false });
  }
  for (const y of [0.3, 0.85]) c.boite(b - a, 0.015, 0.015, 0x6a625a, { x: (a + b) / 2, y, z }, M.metal, { crasse: false });
  ctx.b.obstacle(a, z, b, z, "ganivelle et dunes");
}

// ---------- Le sol : terre-pleins, quais, fond, eau, vase ----------

// Les lignes de quai (le bord de la terre ferme), à l'ouest et à l'est.
const QUAI_O = [[-58, -35], [-58, -20], [-50, -20], [-50, 14], [-58, 14], [-58, 35]];
const QUAI_E = [[58, -35], [58, -20], [50, -20], [50, 14], [58, 14], [58, FORME.z1]];
const QUAI_E2 = [[58, FORME.z2], [58, 35]];
// Le ponton du carrelet et la tête de l'escalier de quai traversent le bord du quai
// (H-4) La tête du pont : le tablier s'appuie sur le quai en x = ± 50 ; le bord du quai s'ouvre sur sa largeur (entre les
// garde-corps), et son couronnement de granit aussi (plus de marche de 16 cm en travers de la chaussée).
const PASSAGES = [
  { x: -58, z1: -27.55, z2: -26.45 },
  { x: ACCES.x, z1: ACCES.z1, z2: ACCES.z2, coupe: true },
  { x: -50, z1: -ZB, z2: ZB, coupe: true },
  { x: 50, z1: -ZB, z2: ZB, coupe: true },
];

function sols(ctx) {
  const { c, M, xa, xb } = ctx;
  // Les terre-pleins (le sable gris du bord de mer, recouvert ensuite de pavés et d'enrobé)
  if (xa <= -100) dalle(c, M.sol, C.sol, [[-100, -35], ...QUAI_O, [-100, 35]]);
  if (xb >= 100) dalle(c, M.sol, C.sol, [[100, -35], [58, -35], [58, -20], [50, -20], [50, 14], [58, 14], [58, FORME.z1], [FORME.x2, FORME.z1], [FORME.x2, FORME.z2], [58, FORME.z2], [58, 35], [100, 35]]);

  // Le fond de l'estuaire et l'eau (le courant descend vers la mer, au sud). L'eau est teintée par sommet selon la
  // profondeur (R0-3) : claire le long des quais et des bancs, sombre dans le chenal ; la même matière que la mer des
  // alentours, qui la prolonge au nord et au sud (plus de tranches de maquette au bord du lot).
  const x1 = Math.max(xa, -62);
  const x2 = Math.min(xb, 62);
  if (x2 > x1) {
    c.pave(x1, Y_FOND - 0.3, -35, x2, Y_FOND, 35, 0x6a6658, M.sol, { crasse: false, nuance: 0 });
    nappe(c, M.eau, x1, x2, -35, 35, 2.5, 5, Y_EAU);
    // La marée haute (objet « maree_haute », caché au départ) : la même eau, 2,3 m plus haut, sur les bancs de vase
    nappe(ctx.haute, M.eau, x1, x2, -35, 35, 2.5, 5, Y_HAUTE);
  }
  quais(ctx);
  vasieres(ctx);
}

// ---------- L'eau teintée, le sol des alentours (R0-2, R0-3) ----------

const EAU = { clair: 0x93d4c4, moyen: 0x6f9c96, sombre: 0x3a5d68, ecume: 0xf2f5f0 };

/** Un mélange de deux teintes (0xRRGGBB), t de 0 à 1. */
function melange(a, b, t) {
  const r = ((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * t;
  const g = ((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * t;
  const bl = (a & 255) + ((b & 255) - (a & 255)) * t;
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(bl);
}
const lisser = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** Un bruit doux et reproductible (pour varier les teintes du sol et de l'eau). */
function bruit(x, z, pas = 9) {
  const i = Math.floor(x / pas);
  const j = Math.floor(z / pas);
  const fx = lisser(0, 1, x / pas - i);
  const fz = lisser(0, 1, z / pas - j);
  const h = (a, b) => hache(a + 9000, b + 9000);
  return (h(i, j) * (1 - fx) + h(i + 1, j) * fx) * (1 - fz) + (h(i, j + 1) * (1 - fx) + h(i + 1, j + 1) * fx) * fz;
}

/**
 * Le sol naturel hors du lot (y) : plat au nord et aux bouts ; au sud, une bande de dunes jusqu'à z = 44, puis la plage
 * qui descend jusqu'à la laisse de basse mer (y = −8 à z = 70), puis le fond qui s'enfonce doucement sous la mer.
 */
function solNaturel(x, z) {
  if (z <= 44) return 0;
  if (z <= 70) return -(z - 44) * (8 / 26);
  return -8 - Math.min(24, z - 70) * 0.125;
}

/** La profondeur de l'eau au niveau `niveau` : le chenal entre les quais (plus profond au milieu), la mer ailleurs. */
function profondeur(x, z, niveau) {
  const ax = Math.abs(x);
  if (ax < 58) {
    const berge = ax <= 50.5 && z >= -20 && z <= 14 ? 50 : 58;
    const d = berge - ax + Math.max(0, z - 74) * 0.6;
    return 0.35 + d * 0.32 + (niveau - Y_EAU);
  }
  return niveau - solNaturel(x, z);
}

/** La teinte de l'eau : turquoise clair où elle est peu profonde, vert-bleu sombre où elle est profonde. */
function teinteEau(x, z, niveau) {
  const p = profondeur(x, z, niveau);
  const t = lisser(0.2, 3.2, p);
  const base = t < 0.5 ? melange(EAU.clair, EAU.moyen, t * 2) : melange(EAU.moyen, EAU.sombre, (t - 0.5) * 2);
  return melange(base, 0xffffff, (bruit(x, z, 7) - 0.5) * 0.08);
}

/**
 * Pose une géométrie teintée sommet par sommet (`teinte(x, y, z)`) dans un chantier : le chantier de l'atelier teinte
 * une pièce d'une seule couleur, on fournit donc nous-mêmes l'attribut de couleur (même format : position, normale,
 * UV, couleur ; non indexé). `uv(x, y, z)` : les coordonnées de texture (UV « monde »). Repère courant ignoré (racine).
 */
function poserTeinte(c, mat, geo, teinte, uv) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.computeVertexNormals();
  const pos = g.attributes.position;
  const uvs = new Float32Array(pos.count * 2);
  const col = new Float32Array(pos.count * 3);
  const cc = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const [u, v] = uv(x, y, z);
    uvs[i * 2] = u;
    uvs[i * 2 + 1] = v;
    cc.setHex(teinte(x, y, z));
    col[i * 3] = cc.r;
    col[i * 3 + 1] = cc.g;
    col[i * 3 + 2] = cc.b;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  let lot = c.lots.get(mat);
  if (!lot) c.lots.set(mat, (lot = []));
  lot.push(g);
  if (g !== geo) geo.dispose();
}

/** Une grille horizontale de x1 à x2, z1 à z2 (pas en x, en z), à la hauteur `y(x, z)`, face vers le haut. */
function grille(x1, x2, z1, z2, px, pz, y) {
  const nx = Math.max(1, Math.ceil((x2 - x1) / px - 1e-6));
  const nz = Math.max(1, Math.ceil((z2 - z1) / pz - 1e-6));
  const pos = [];
  const P = (i, j) => {
    const x = x1 + ((x2 - x1) * i) / nx;
    const z = z1 + ((z2 - z1) * j) / nz;
    return [x, y(x, z), z];
  };
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const a = P(i, j), b = P(i + 1, j), d = P(i, j + 1), e = P(i + 1, j + 1);
      pos.push(...a, ...d, ...b, ...b, ...d, ...e);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

/** Une nappe d'eau au niveau `niveau`, teintée selon la profondeur (UV : les filets du courant, comme l'eau du lot). */
function nappe(c, mat, x1, x2, z1, z2, px, pz, niveau) {
  if (x2 - x1 < 0.01 || z2 - z1 < 0.01) return;
  poserTeinte(c, mat, grille(x1, x2, z1, z2, px, pz, () => niveau), (x, y, z) => teinteEau(x, z, niveau), (x, y, z) => [x / 9, z / 16]);
}

/** Les murs de quai : pierre de taille, couronnement, laisse de marée verte, échelles, anneaux. */
function quais(ctx) {
  const { c, M } = ctx;
  const ligne = (pts, cote) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i];
      const [bx, bz] = pts[i + 1];
      const mx = (ax + bx) / 2;
      // Le mur avance de 0,6 m côté eau ; sa normale vers l'eau dépend du sens de parcours
      const L = Math.hypot(bx - ax, bz - az);
      const nx = ((bz - az) / L) * cote;
      const nz = (-(bx - ax) / L) * cote;
      const cx = mx + nx * 0.3;
      if (!ctx.ici(cx)) continue;
      const cz = (az + bz) / 2 + nz * 0.3;
      const ry = -Math.atan2(bz - az, bx - ax);
      c.boite(L + 0.6, -0.05 - Y_FOND + 0.4, 0.6, C.quai, { x: cx, y: (Y_FOND - 0.4 - 0.05) / 2, z: cz, ry }, M.pierre, { crasse: false, nuance: 0.02 });
      // La laisse de marée : algues vertes et brunes au pied, jusqu'à 3 m au-dessus de l'eau
      c.boite(L + 0.62, 2.8, 0.62, C.algues, { x: cx + nx * 0.02, y: Y_EAU + 1.0, z: cz + nz * 0.02, ry }, M.mat, { crasse: false, nuance: 0.05 });
      c.boite(L + 0.63, 0.9, 0.63, C.alguesBrunes, { x: cx + nx * 0.03, y: Y_EAU + 2.15, z: cz + nz * 0.03, ry }, M.mat, { crasse: false, nuance: 0.05 });
      // Le couronnement en granit
      const passage = PASSAGES.find((p) => ax === bx && Math.abs(ax - p.x) < 0.01 && p.z1 > Math.min(az, bz) && p.z2 < Math.max(az, bz));
      // Le couronnement en granit (coupé à l'accès de la cale basse et à la tête du pont)
      if (passage?.coupe) {
        const za = Math.min(az, bz);
        const zb2 = Math.max(az, bz);
        for (const [q1, q2] of [[za - 0.35, passage.z1], [passage.z2, zb2 + 0.35]]) c.pave(cx + nx * 0.05 - 0.4, -0.06, q1, cx + nx * 0.05 + 0.4, 0.18, q2, C.quaiSombre, M.pierre, { crasse: false, nuance: 0.03 });
      } else c.boite(L + 0.7, 0.24, 0.8, C.quaiSombre, { x: cx + nx * 0.05, y: 0.06, z: cz + nz * 0.05, ry }, M.pierre, { crasse: false, nuance: 0.03 });
      const nat = "bord du quai : huit mètres de vide jusqu'à la vase";
      if (passage) {
        const s1 = az < bz ? 1 : -1;
        ctx.b.obstacle(ax, az, ax, s1 > 0 ? passage.z1 : passage.z2, nat);
        ctx.b.obstacle(ax, s1 > 0 ? passage.z2 : passage.z1, bx, bz, nat);
      } else ctx.b.obstacle(ax, az, bx, bz, nat);
      // Les anneaux d'amarrage et les échelles de fer
      for (let u = 3; u < L - 1; u += 7) {
        const px = ax + ((bx - ax) * u) / L + nx * 0.62;
        const pz = az + ((bz - az) * u) / L + nz * 0.62;
        if (px > CALE.x1 - 0.1 && px < CALE.x2 && pz > CALE.z1 && pz < CALE.z2) continue; // contre la cale basse
        c.repere({ x: px, y: -0.5, z: pz, ry }, () => c.boite(0.5, 0.06, 0.06, 0x5a4a3c, { y: -0.2, rx: 0.4 }, M.metal));
        if (hache(Math.round(px), Math.round(pz)) < 0.35) {
          c.repere({ x: px, y: 0, z: pz, ry }, () => {
            for (const s of [-0.25, 0.25]) c.boite(0.05, 8.2, 0.05, 0x4a3a30, { x: s, y: -4.0, z: 0.06 }, M.metal);
            for (let y = -0.4; y > -8; y -= 0.35) c.boite(0.5, 0.04, 0.04, 0x5a4434, { y, z: 0.08 }, M.metal);
          });
        }
      }
    }
  };
  ligne(QUAI_O, 1);
  ligne(QUAI_E, -1);
  ligne(QUAI_E2, -1);
}

/** Toutes les clés d'un jeu de matières renvoient à une seule : un objet nommé tient alors en un appel de dessin. */
function uneMatiere(M, mat) {
  return Object.fromEntries(Object.keys(M).map((k) => [k, mat]));
}

/**
 * Les bancs de vase découverts à marée basse, et ce que la marée y a laissé : tout cela forme l'objet « maree_basse »
 * de chaque tronçon (une seule matière, satinée : la vase mouillée luit). Les enrochements et les pieux restent : à
 * marée haute, on les voit sous l'eau ou qui en sortent. Le banc du quai sud-ouest est le seul où l'on descend (par
 * l'escalier de quai) : ses bords côté eau sont des obstacles, et c'est là qu'on fouille.
 */
function vasieres(ctx) {
  const { c, M } = ctx;
  const A = aleatoire(77);
  const MS = uneMatiere(M, M.satine);
  const v = { ...ctx, c: ctx.basse, M: MS };
  // Une bande de vase le long d'un mur (x = xm), de z1 à z2, qui s'étend de `l1` à `l2` vers l'eau (sens `s`).
  const bandeVase = (xm, z1, z2, s, l1, l2) => {
    const pts = [];
    const n = Math.max(4, Math.round((z2 - z1) / 2.5));
    for (let i = 0; i <= n; i++) pts.push([xm + s * 0.6, z1 + ((z2 - z1) * i) / n]);
    for (let i = n; i >= 0; i--) pts.push([xm + s * (l1 + (l2 - l1) * A()), z1 + ((z2 - z1) * i) / n + (A() - 0.5) * 1.5]);
    return pts;
  };
  let graine = 0;
  const banc = (pts, couleur = C.vase) => {
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    graine++;
    if (!ctx.ici(cx)) return null;
    dalle(ctx.basse, M.satine, couleur, pts, Y_VASE, { nuance: 0.02 });
    // Les rides que le courant laisse dans la vase (en travers du courant, qui descend vers le sud), les flaques
    // luisantes, les traînées d'algues
    const xs = pts.map((p) => p[0]);
    const zs = pts.map((p) => p[1]);
    const [x1, x2, z1, z2] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
    const n = Math.round(((x2 - x1) * (z2 - z1)) / 5);
    for (let i = 0; i < n; i++) {
      const x = x1 + (x2 - x1) * hache(i, 500 + graine);
      const z = z1 + (z2 - z1) * hache(i, 600 + graine);
      if (!dedans(pts, x, z)) continue;
      const r = hache(i, 700 + graine);
      if (r < 0.62) ctx.basse.boite(0.8 + r * 2.2, 0.05, 0.1, 0x8e8270, { x, y: Y_VASE + 0.015, z, ry: (r - 0.3) * 0.4 }, M.satine, { crasse: false, nuance: 0.05 });
      else if (r < 0.85) ctx.basse.boite(0.7 + r * 1.2, 0.012, 0.5 + r * 0.8, 0x5d6662, { x, y: Y_VASE + 0.008, z, ry: r * 7 }, M.satine, { crasse: false, nuance: 0.04 });
      else ctx.basse.boite(0.5 + r, 0.03, 0.25, C.algues, { x, y: Y_VASE + 0.015, z, ry: r * 9 }, M.satine, { crasse: false, nuance: 0.06 });
    }
    return pts;
  };
  banc(bandeVase(-58, -34.8, -20.4, 1, 3, 6.5));
  banc(bandeVase(-50, -19.6, 13.6, 1, 2.5, 5.5));
  bandeVase(-58, 14.4, 34.8, 1, 5, 7.5); // (l'ancien banc du quai, devenu la cale basse : on garde le tirage)
  banc(bandeVase(58, -34.8, -20.4, -1, 3, 6));
  banc(bandeVase(50, -19.6, 13.6, -1, 2, 4.5));
  banc(bandeVase(58, 27.4, 34.8, -1, 4, 7));
  // Le banc de vase du milieu, sous la travée ouest, et celui de l'aval
  const ilot = (cx, cz, rx, rz, n = 12) => {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = 0.7 + 0.3 * A();
      pts.push([cx + Math.cos(a) * rx * r, cz + Math.sin(a) * rz * r]);
    }
    return pts;
  };
  banc(ilot(-36, 23, 9, 9.5), C.vaseClaire);
  banc(ilot(20, 27, 12, 6.5), C.vaseClaire);
  banc(ilot(-20, -28, 8, 5));

  if (ctx.ici(-54.5)) caleBasse(ctx, v);

  // L'échelle de marée, sur le mur de quai sous le tablier (face à l'est, vers la caméra)
  if (ctx.ici(-49.37)) echelleDeMaree(ctx, -49.37, 9.6);

  // Les enrochements au pied des quais nord (blocs de granit tombés)
  const blocs = (x1, x2, z1, z2, n) => {
    for (let i = 0; i < n; i++) {
      const x = x1 + (x2 - x1) * A();
      const z = z1 + (z2 - z1) * A();
      const s = 0.5 + A() * 0.9;
      if (!ctx.ici(x)) continue;
      c.poser(CAILLOU, M.pierre, A() < 0.5 ? C.quai : C.quaiSombre, { x, y: Y_VASE + s * 0.25, z, rx: A() * 3, ry: A() * 3, e: [s * 1.3, s * 0.8, s] }, { nuance: 0.05 });
      if (A() < 0.5) c.poser(BOULE, M.mat, C.algues, { x, y: Y_VASE + 0.05, z, e: [s * 1.2, 0.18, s * 1.1] }, { crasse: false });
    }
  };
  blocs(-57.4, -55, -34, -21, 14);
  blocs(-49.4, -47.5, -19, -6, 10);
  blocs(55, 57.4, -34, -21, 14);
  blocs(47.5, 49.4, -19, -6, 10);

  // Les pieux de l'ancien ponton, le long de la cale basse, côté eau
  for (let i = 0; i < 9; i++) {
    if (hache(i, 0) < 0.2 || !ctx.ici(-50.4)) continue;
    const h = 7.6 + hache(i, 3) * 1.6;
    c.boite(0.28, h, 0.28, 0x4a3e32, { x: -50.4, y: Y_VASE + h / 2 - 0.2, z: 18 + i * 1.9, rz: (hache(i, 4) - 0.5) * 0.06 }, M.mat, { nuance: 0.08 });
  }
  if (ctx.ici(-36)) {
    barque(ctx.basse, MS, -34, Y_VASE - 0.25, 21, 2.3, 0x6a5040, { rz: 0.35, avirons: false });
    trottinette(v, -39, 26, 1.2, 1.4);
    pneu(v, -31.5, 25.5, 0.4);
  }
  if (ctx.ici(48)) {
    trottinette(v, 47.6, -9, 0.2, 1.2);
    caddie(v, 47.8, 4.5, 2.2);
  }
  if (ctx.ici(20)) {
    for (let i = 0; i < 6; i++) ctx.basse.poser(CAILLOU, M.satine, 0x8a8478, { x: 14 + i * 2.2, y: Y_VASE + 0.1, z: 26 + (i % 3), rx: i, ry: i * 2, e: [0.5, 0.25, 0.4] });
    caddie(v, 24.5, 27.5, 0.6);
  }
  if (ctx.ici(54)) {
    trottinette(v, 54.2, -27.5, 2.6, -0.8);
    caddie(v, 54.6, 31.2, 1.7);
    pneu(v, 53.2, 29.4, 0.2);
  }
}

/**
 * La cale basse du quai sud-ouest : un massif de pierre au ras de l'eau, 0,5 m sous le quai, pavé et envasé. On y
 * descend du quai par l'accès (le haut du mur, puis une marche). La vase et ce que la marée y a laissé sont dans
 * « maree_basse » ; à marée haute, une nappe la recouvre (« maree_haute ») et le jeu ferme l'accès.
 */
function caleBasse(ctx, v) {
  const { c, M, b } = ctx;
  const { x1, x2, z1, z2 } = CALE;
  const xm = x1 + 0.6; // la cale s'appuie contre la face du mur de quai
  // Le massif, ses laisses de marée côté chenal, le pavage, la bordure de granit
  c.pave(xm, Y_FOND - 0.4, z1, x2, Y_CALE - 0.12, z2, C.quai, M.pierre, { crasse: false, nuance: 0.02 });
  c.pave(xm, Y_EAU - 0.2, z1 - 0.02, x2 + 0.03, Y_EAU + 2.6, z2 + 0.03, C.algues, M.mat, { crasse: false, nuance: 0.04 });
  c.pave(xm, -1.7, z1 - 0.02, x2 + 0.03, -0.75, z2 + 0.03, C.alguesBrunes, M.mat, { crasse: false, nuance: 0.04 });
  c.pave(xm, Y_CALE - 0.12, z1, x2 - 0.35, Y_CALE, z2, C.paves, M.paves, { crasse: false, nuance: 0 });
  c.pave(x2 - 0.35, Y_CALE - 0.16, z1, x2 + 0.05, Y_CALE + 0.06, z2, C.quaiSombre, M.pierre, { crasse: false, nuance: 0.03 });
  // La marche de l'accès (y = −0,25), entre le haut du mur (−0,05) et la cale (−0,5)
  c.pave(xm, Y_CALE, ACCES.z1, xm + 0.7, -0.25, ACCES.z2, C.quaiSombre, M.pierre, { crasse: false, nuance: 0.03 });
  for (const z of [ACCES.z1, ACCES.z2]) c.boite(0.06, 0.9, 0.06, 0x3a3c3c, { x: x1 - 0.5, y: 0.45, z }, M.metal);
  // Les bittes et les anneaux de la bordure, une bouée abandonnée
  for (const z of [20.5, 28.5]) bitte(c, M, x2 - 0.25, z, Y_CALE + 0.06, z === 28.5);
  for (const z of [17.5, 24.5, 31.5]) c.repere({ x: x2 + 0.06, y: Y_CALE - 0.35, z }, () => c.boite(0.06, 0.06, 0.5, 0x5a4a3c, { rx: 0.4 }, M.metal));
  // La clôture du port, au bout de la cale (bord du lot)
  for (let x = xm + 0.1; x < x2; x += 1.6) c.boite(0.08, 1.8, 0.08, 0x6a6c6a, { x, y: Y_CALE + 0.9, z: z2 - 0.15 }, M.metal);
  c.boite(x2 - xm - 0.2, 1.5, 0.02, 0x8a8c88, { x: (xm + x2) / 2, y: Y_CALE + 0.95, z: z2 - 0.15 }, M.metal, { crasse: false });
  // Les obstacles : le bord côté chenal, la clôture du bout
  b.obstacle(x2, 14.0, x2, z2 - 0.15, "bord de la cale basse : le chenal, huit mètres plus bas");
  b.obstacle(x1, z2 - 0.15, x2, z2 - 0.15, "clôture du port, au bout de la cale (bord du lot)");
  // (H-4) Le bout nord de la cale : le mur du quai (sa crête, 0,7 m plus haut), qu'on ne prend pas pour un chemin
  b.obstacle(x1, z1, x2, z1, "mur du quai, au bout de la cale");
  // À marée haute : la nappe qui noie la cale, l'écume sur la bordure, et l'accès fermé
  const yn = Y_CALE + 0.2;
  ctx.haute.pave(xm, yn - 0.02, z1, x2 + 0.08, yn, z2 - 0.2, C.eauEstuaire, M.eau, { crasse: false, nuance: 0 });
  for (let k = 0; k < 22; k++) ctx.haute.boite(0.12 + hache(k, 811) * 0.2, 0.015, 0.5 + hache(k, 812) * 1.1, 0xd6e0da, { x: x2 - 0.15 - hache(k, 813) * 0.5, y: yn + 0.01, z: z1 + 0.6 + k * 0.88, ry: (hache(k, 814) - 0.5) * 0.4 }, M.eau, { crasse: false, nuance: 0.03 });
  ctx.obstaclesMareeHaute.push({ x1: ACCES.x, z1: ACCES.z1, x2: ACCES.x, z2: ACCES.z2, nature: "marée haute : la mer recouvre la cale basse" });

  // La vase sur les pavés (maree_basse) : des plaques, des rides, des flaques, des algues
  const vy = Y_CALE + 0.012;
  for (let k = 0; k < 7; k++) {
    const cx = xm + 1.2 + hache(k, 821) * (x2 - xm - 2.4);
    const cz = z1 + 1.5 + k * 2.75 + (hache(k, 822) - 0.5);
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const r = 0.65 + 0.35 * hache(k * 10 + i, 823);
      pts.push([cx + Math.cos(a) * 2.6 * r, cz + Math.sin(a) * 1.9 * r]);
    }
    const ptsC = pts.map(([x, z]) => [Math.min(x2 - 0.4, Math.max(xm + 0.05, x)), Math.min(z2 - 0.3, Math.max(z1 + 0.05, z))]);
    dalle(ctx.basse, M.satine, k % 2 ? C.vase : 0x6d6352, ptsC, vy + k * 0.001, { nuance: 0.02 });
  }
  for (let i = 0; i < 40; i++) {
    const x = xm + 0.4 + (x2 - xm - 0.9) * hache(i, 831);
    const z = z1 + 0.5 + (z2 - z1 - 1) * hache(i, 832);
    const r = hache(i, 833);
    if (r < 0.55) ctx.basse.boite(0.8 + r * 2, 0.04, 0.1, 0x8e8270, { x, y: vy + 0.015, z, ry: (r - 0.3) * 0.4 }, M.satine, { crasse: false, nuance: 0.05 });
    else if (r < 0.85) ctx.basse.boite(0.7 + r, 0.012, 0.5 + r * 0.8, 0x5d6662, { x, y: vy + 0.01, z, ry: r * 7 }, M.satine, { crasse: false, nuance: 0.04 });
    else ctx.basse.boite(0.5 + r, 0.03, 0.25, C.algues, { x, y: vy + 0.015, z, ry: r * 9 }, M.satine, { crasse: false, nuance: 0.06 });
  }
  // Ce que la marée y a laissé (on y fouille) : la débroussailleuse, les caddies, les trottinettes d'enfant, la
  // mobylette (la bobine), des pneus
  const w = { ...v, ysol: vy };
  debroussailleuse(w, -54.4, 19.0, 0.25);
  caddie(w, -54.3, 22.8, 0.9);
  trottinetteEnfant(w, -54.6, 24.7, 0.4, 0xc8708f);
  mobylette(w, -54.3, 27.0, 1.45);
  trottinetteEnfant(w, -54.0, 30.3, 2.1, 0x8fb05a);
  caddie(w, -54.5, 32.5, 2.6);
  for (const [x, z, r] of [[-55.6, 21.0, 0.3], [-52.6, 26.0, 1.1], [-55.4, 29.0, 0.6], [-52.8, 33.6, 1.9]]) pneu(w, x, z, r);
}

/** Le point (x, z) est-il dans le polygone `pts` ? */
function dedans(pts, x, z) {
  let d = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i];
    const [xj, zj] = pts[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) d = !d;
  }
  return d;
}

/** La vase remuée autour des épaves : flaques plus sombres, traces. */
function vaseRemuee(v, x1, z1, x2, z2) {
  for (let i = 0; i < 14; i++) {
    const x = x1 + (x2 - x1) * hache(i, 401);
    const z = z1 + (z2 - z1) * hache(i, 402);
    v.c.boite(0.6 + hache(i, 403) * 1.4, 0.02, 0.4 + hache(i, 404) * 0.9, i % 3 ? 0x6e6656 : 0x7d8a84, { x, y: (v.ysol ?? Y_VASE) + 0.01, z, ry: hache(i, 405) * 3 }, v.M.mat, { crasse: false, nuance: 0.04 });
  }
}

/** Un pneu à moitié enfoncé dans la vase. */
function pneu(v, x, z, r) {
  cylindre(v.c, v.M.mat, 0x2a2a2a, x, (v.ysol ?? Y_VASE) - 0.12, z, 0.36, 0.36, 0.24, 8, { rx: r * 0.4, rz: 0.2 });
}

/** Une trottinette d'enfant (aluminium, couleur vive passée), couchée dans la vase. */
function trottinetteEnfant(v, x, z, ry, couleur) {
  const { c, M } = v;
  c.repere({ x, y: (v.ysol ?? Y_VASE) + 0.05, z, ry, rx: Math.PI / 2 - 0.2 }, () => {
    c.boite(0.62, 0.04, 0.13, couleur, { y: 0.07 }, M.satine);
    c.boite(0.035, 0.68, 0.035, 0xb8bcbc, { x: 0.3, y: 0.42, rz: -0.18 }, M.metal);
    c.boite(0.035, 0.035, 0.42, couleur, { x: 0.37, y: 0.76 }, M.satine);
    for (const s of [-1, 1]) c.boite(0.06, 0.06, 0.07, 0x2a2a2a, { x: 0.37, y: 0.76, z: s * 0.22 }, M.mat);
    for (const s of [-0.28, 0.32]) cylindre(c, M.mat, 0xe6e2da, s, 0.04, 0, 0.06, 0.06, 0.035, 8, { rx: Math.PI / 2 });
  });
}

/** La mobylette échouée, couchée sur le flanc dans la vase : cadre, réservoir, selle, moteur, roues à rayons. */
function mobylette(v, x, z, ry) {
  const { c, M } = v;
  c.repere({ x, y: (v.ysol ?? Y_VASE) + 0.18, z, ry, rx: Math.PI / 2 - 0.12 }, () => {
    const bleu = 0x4f7f94;
    for (const s of [-0.62, 0.62]) {
      cylindre(c, M.mat, 0x2a2a2a, s, -0.05, 0, 0.3, 0.3, 0.07, 10, { rx: Math.PI / 2 });
      cylindre(c, M.metal, 0x9a9c98, s, -0.06, 0, 0.12, 0.12, 0.09, 6, { rx: Math.PI / 2 });
    }
    planche(c, [-0.1, 0.32, 0], [0.5, 0.62, 0], 0.08, 0.07, bleu, M.satine);
    planche(c, [-0.1, 0.32, 0], [-0.62, 0.0, 0], 0.06, 0.06, bleu, M.satine);
    planche(c, [0.5, 0.62, 0], [0.62, 0.0, 0], 0.05, 0.05, 0x9a9c98, M.metal);
    c.boite(0.36, 0.2, 0.2, bleu, { x: 0.22, y: 0.5, rz: -0.35 }, M.satine);
    c.boite(0.34, 0.07, 0.18, 0x3a2e28, { x: -0.3, y: 0.62 }, M.mat);
    c.boite(0.05, 0.3, 0.05, 0x3a3a3a, { x: -0.3, y: 0.45 }, M.metal);
    c.boite(0.28, 0.24, 0.2, 0x6a6c68, { x: 0.02, y: 0.12 }, M.metal);
    planche(c, [0.0, 0.05, 0.06], [-0.6, 0.18, 0.12], 0.06, 0.06, 0x5a4a3c, M.metal);
    c.boite(0.05, 0.05, 0.6, 0x3a3a3a, { x: 0.52, y: 0.74 }, M.metal);
    c.boite(0.24, 0.05, 0.16, 0x8a5a30, { x: -0.55, y: 0.38 }, M.metal);
  });
}

/** La débroussailleuse : le long tube d'aluminium, le moteur au bout, le guidon, la lame ronde. */
function debroussailleuse(v, x, z, ry) {
  const { c, M } = v;
  c.repere({ x, y: (v.ysol ?? Y_VASE) + 0.08, z, ry, rz: 0.08 }, () => {
    c.boite(1.55, 0.045, 0.045, 0xb8bcbc, { x: 0, y: 0.12 }, M.metal);
    c.boite(0.3, 0.24, 0.24, 0xd8662e, { x: -0.86, y: 0.14 }, M.satine);
    c.boite(0.16, 0.12, 0.18, 0x3a3a3a, { x: -0.86, y: 0.3 }, M.mat);
    c.boite(0.05, 0.05, 0.6, 0x2a2a2a, { x: -0.25, y: 0.2 }, M.mat);
    cylindre(c, M.metal, 0x8a8c88, 0.82, 0.02, 0, 0.17, 0.17, 0.015, 10);
    c.boite(0.12, 0.08, 0.2, 0xd8662e, { x: 0.74, y: 0.07 }, M.satine);
  });
}

/** Une trottinette électrique en libre-service, échouée (couchée) dans la vase. */
function trottinette(v, x, z, ry, rz) {
  const { c, M } = v;
  c.repere({ x, y: (v.ysol ?? Y_VASE) + 0.12, z, ry, rx: Math.PI / 2 - 0.15, rz: rz * 0.1 }, () => {
    c.boite(1.0, 0.06, 0.18, 0x3a9a8a, { y: 0.1 }, M.satine);
    c.boite(0.05, 1.0, 0.05, 0x3a9a8a, { x: 0.48, y: 0.6, rz: -0.12 }, M.satine);
    c.boite(0.05, 0.05, 0.45, 0x2a2a2a, { x: 0.54, y: 1.1 }, M.metal);
    for (const s of [-0.45, 0.45]) cylindre(c, M.mat, 0x222222, s, 0.1, 0, 0.1, 0.1, 0.05, 8, { rx: Math.PI / 2 });
  });
}

/** Un caddie de supermarché, à moitié enfoncé. */
function caddie(v, x, z, ry) {
  const { c, M } = v;
  c.repere({ x, y: (v.ysol ?? Y_VASE) - 0.15, z, ry, rz: 0.25 }, () => {
    c.boite(0.9, 0.04, 0.55, 0x9a9c98, { y: 0.35 }, M.metal);
    for (const s of [-1, 1]) c.boite(0.9, 0.5, 0.03, 0x9a9c98, { y: 0.6, z: s * 0.28 }, M.metal);
    c.boite(0.03, 0.5, 0.56, 0x9a9c98, { x: 0.45, y: 0.6 }, M.metal);
    c.boite(0.03, 0.06, 0.6, 0xb8352a, { x: -0.55, y: 0.95 }, M.metal);
    for (const s of [-1, 1]) c.boite(0.03, 0.03, 0.56, 0x9a9c98, { x: s * 0.2, y: 0.85 }, M.metal);
    for (const s of [-1, 1]) c.boite(0.6, 0.03, 0.03, 0x9a9c98, { x: 0, y: 0.85, z: s * 0.12 }, M.metal);
    for (const [px, pz] of [[0.38, 0.22], [0.38, -0.22], [-0.38, 0.22], [-0.38, -0.22]]) c.boite(0.08, 0.12, 0.04, 0x2a2a2a, { x: px, y: 0.1, z: pz }, M.mat);
  });
}

// ---------- La route, à terre ----------

function routes(ctx) {
  const { c, M, xa, xb } = ctx;
  for (const [r1, r2] of [[-100, -50], [50, 100]]) {
    const a = Math.max(r1, xa);
    const b = Math.min(r2, xb);
    if (b - a < 0.1) continue;
    c.pave(a, -0.06, -HL, b, 0.025, HL, C.asphalte, M.asphalte, { crasse: false, nuance: 0 });
    for (const s of [-1, 1]) {
      c.pave(a, -0.06, s > 0 ? HL : -ZTR, b, 0.07, s > 0 ? ZTR : -HL, C.trottoir, M.paves, { crasse: false, nuance: 0 });
      c.pave(a, -0.06, s > 0 ? HL : -HL - 0.18, b, 0.1, s > 0 ? HL + 0.18 : -HL, 0xb9b4a8, M.beton, { crasse: false, nuance: 0 });
    }
  }
  marquages(ctx, -100, 100);
}

/** Les lignes blanches (effacées par endroits), sur la route et sur le tablier. */
function marquages(ctx, x1, x2) {
  const { c, M } = ctx;
  for (let x = x1; x < x2; x += 4) {
    const xm = x + 1.25;
    if (!ctx.ici(xm)) continue;
    if (xm > COL.x1 - 0.5 && xm < COL.x2 + 0.5) continue;
    const i = Math.round(x);
    if (hache(i, 5) > 0.2) c.boite(2.3, 0.01, 0.13, C.ligne, { x: xm, y: 0.03, z: 0 }, M.mat, { crasse: false, nuance: 0.05 });
    for (const s of [-1, 1]) if (hache(i, 6 + s) > 0.15) c.boite(4.02, 0.01, 0.12, C.ligne, { x: x + 2, y: 0.03, z: s * (HL - 0.25) }, M.mat, { crasse: false, nuance: 0.05 });
  }
}

// ---------- Le tablier ----------

function tablier(ctx) {
  const { c, M, u, b } = ctx;
  for (let i = 0; i < 40; i++) {
    const x1 = -50 + i * PAN;
    const x2 = x1 + PAN;
    const xc = (x1 + x2) / 2;
    if (!ctx.ici(xc)) continue;
    const enCol = xc > COL.x1 && xc < COL.x2;
    const enTrou = xc > TROU.x1 && xc < TROU.x2;
    const zSud = enCol ? COL.zb : ZB;
    if (!enTrou) {
      // La dalle de béton, l'enrobé, les trottoirs
      c.pave(x1, -0.42, -ZB, x2, -0.02, zSud, C.betonSombre, M.beton, { crasse: false, nuance: 0.02 });
      c.pave(x1, -0.03, -HL, x2, 0.02, Math.min(HL, zSud), C.asphalte, M.asphalte, { crasse: false, nuance: 0.02 });
      c.pave(x1, -0.03, -ZB, x2, 0.07, -HL, C.trottoir, M.beton, { crasse: false, nuance: 0.03 });
      if (!enCol) c.pave(x1, -0.03, HL, x2, 0.07, ZB, C.trottoir, M.beton, { crasse: false, nuance: 0.03 });
      // Dessous : la pièce de pont (entretoise) et les longerons
      c.pave(x1, -1.3, -ZB, x1 + 0.3, -0.42, zSud, teinteFer(u, i, 11), M.tole, { crasse: false });
      for (const zl of [-4.2, -1.4, 1.4, 4.2]) {
        if (zl > zSud) continue;
        c.pave(x1, -0.95, zl - 0.12, x2, -0.42, zl + 0.12, teinteFer(u, i, 12 + zl), M.tole, { crasse: false });
      }
      // Le bord cassé de la brèche : blocs de béton qui débordent, fers à béton tordus vers le bas
      if (enCol) {
        for (let k = 0; k < 3; k++) {
          const xx = x1 + 0.4 + k * 0.8 + hache(i, k) * 0.3;
          const lg = 0.3 + hache(i, k + 5) * 0.6;
          c.boite(0.7, 0.36, lg, C.betonSombre, { x: xx, y: -0.22, z: COL.zb + lg / 2 - 0.05, rx: 0.15 + hache(i, k + 9) * 0.3, ry: (hache(i, k + 2) - 0.5) * 0.3 }, M.beton, { crasse: false });
        }
        for (let k = 0; k < 6; k++) {
          const xx = x1 + 0.2 + k * 0.4;
          const lg = 0.5 + hache(i, k + 20) * 0.9;
          planche(c, [xx, -0.2, COL.zb], [xx + (hache(i, k + 30) - 0.5) * 0.3, -0.2 - lg * 0.8, COL.zb + lg * 0.6], 0.025, 0.025, 0x5a4434, M.metal);
        }
      }
    } else {
      // Le trou : il ne reste que le longeron nord (fer en I), quelques moignons d'entretoise
      c.pave(x1, -0.62, -4.32, x2, -0.5, -4.08, C.rouille, M.tole, { crasse: false });
      c.pave(x1, -0.5, -4.23, x2, -0.12, -4.17, C.rouille, M.tole, { crasse: false });
      c.pave(x1, -0.12, -4.32, x2, -0.03, -4.08, C.rouilleClaire, M.tole, { crasse: false });
      c.boite(0.25, 0.7, 0.15, C.rouille, { x: x1 + 0.2, y: -0.75, z: -4.9, rx: 0.5 }, M.tole, { crasse: false });
    }
    // Les deux poutres latérales en treillis (la sud a disparu dans la brèche)
    for (const s of [-1, 1]) {
      if (s === 1 && enCol) continue;
      const zc = s * ZT;
      const perce = s === 1 && xc > PERCEE.x1 && xc < PERCEE.x2;
      if (!perce) c.pave(x1, -0.9, zc - ET / 2, x2, 0.3, zc + ET / 2, teinteFer(u, i, s + 40), M.tole, { crasse: false });
      c.pave(x1, HT - 0.26, zc - ET / 2, x2, HT, zc + ET / 2, teinteFer(u, i, s + 41), M.tole, { crasse: false });
      c.boite(0.22, HT - 0.3, ET * 0.8, teinteFer(u, i, s + 42), { x: x1 + 0.11, y: 0.3 + (HT - 0.56) / 2, z: zc }, M.tole, { crasse: false });
      if (!perce) {
        const montant = i % 2 === 0;
        c.poutre([x1 + 0.15, montant ? 0.3 : HT - 0.26, zc], [x2 - 0.05, montant ? HT - 0.26 : 0.3, zc], 0.15, teinteFer(u, i, s + 43), M.tole);
      } else {
        // La découpe au chalumeau : des moignons, le haut est resté
        c.boite(0.15, 0.5, 0.15, C.rouille, { x: x2 - 0.2, y: 0.55, z: zc, rz: 0.4 }, M.tole);
      }
      if (i === 39) c.boite(0.22, HT - 0.3, ET * 0.8, teinteFer(u, i, s + 44), { x: x2 - 0.11, y: 0.3 + (HT - 0.56) / 2, z: zc }, M.tole, { crasse: false });
      // Les rivets et goussets (une plaque à chaque nœud) ; les fientes sur la membrure haute
      c.boite(0.5, 0.5, ET + 0.04, teinteFer(u, i, s + 45), { x: x1 + 0.11, y: HT - 0.4, z: zc }, M.tole, { crasse: false });
      fientes(c, M, x1, zc - 0.15, x2, zc + 0.15, HT, 1 + Math.floor(hache(i, s + 46) * 3));
    }
  }
  // Les garde-corps comme obstacles (le vide de chaque côté)
  segX(ctx, -50, 50, -ZB, "garde-corps nord : le vide au-dessus de l'estuaire");
  for (const [a, bb] of [[-50, PERCEE.x1], [PERCEE.x2, COL.x1], [COL.x2, 50]]) segX(ctx, a, bb, ZB, "garde-corps sud : le vide au-dessus de l'estuaire");
  // La brèche : le bord cassé, le trou et les planches
  segX(ctx, COL.x1, TROU.x1, COL.zb, "bord de la brèche : le tablier a lâché");
  segX(ctx, TROU.x2, COL.x2, COL.zb, "bord de la brèche : le tablier a lâché");
  segZ(ctx, COL.x1, COL.zb, ZB, "bord de la brèche");
  segZ(ctx, COL.x2, COL.zb, ZB, "bord de la brèche");
  segX(ctx, TROU.x1, TROU.x2, TROU.zp, "bord des planches : le trou");
  segZ(ctx, TROU.x1, TROU.zp, COL.zb, "bord du trou");
  segZ(ctx, TROU.x2, TROU.zp, COL.zb, "bord du trou");
  // Les culées : l'about du tablier, posé sur le quai
  for (const s of [-1, 1]) {
    if (!ctx.ici(s * 49.9)) continue;
    c.pave(s * 50 - 0.2, -1.5, -ZB - 0.4, s * 50 + 0.2, -0.4, ZB + 0.4, C.quaiSombre, M.pierre, { crasse: false });
    void b;
  }
}

/** Les deux dalles du tablier sud qui pendent en V jusque dans l'eau, avec leur poutre en treillis. */
function dallesQuiPendent(ctx) {
  const { c, M, u } = ctx;
  const L = 10.2;
  for (const [xh, dir] of [[COL.x1, 1], [COL.x2, -1]]) {
    const centre = xh + dir * L * 0.5 * Math.cos(ANGLE_DALLE);
    if (!ctx.ici(centre)) continue;
    c.repere({ x: xh, y: 0, z: 0, rz: -dir * ANGLE_DALLE, rx: dir * 0.05 }, () => {
      const xs = (a, bb) => [Math.min(dir * a, dir * bb), Math.max(dir * a, dir * bb)];
      const [a0, a1] = xs(0, L);
      c.pave(a0, -0.42, COL.zb + 0.15, a1, -0.02, ZB, C.betonSombre, M.beton, { crasse: false });
      c.pave(a0, -0.03, COL.zb + 0.15, a1, 0.02, HL, C.asphalte, M.asphalte, { crasse: false });
      c.pave(a0, -0.03, HL, a1, 0.07, ZB, C.trottoir, M.beton, { crasse: false });
      // Les fissures de l'enrobé et la ligne de rive
      for (let k = 0; k < 4; k++) c.boite(0.06, 0.012, 2 + hache(k, 3) * 3, 0x3a3936, { x: dir * (1.5 + k * 2.3), y: 0.025, z: 1 + hache(k, 4) * 2, ry: (hache(k, 5) - 0.5) * 0.6 }, M.mat, { crasse: false });
      c.boite(L - 0.4, 0.01, 0.12, C.ligne, { x: dir * L * 0.5, y: 0.03, z: HL - 0.25 }, M.mat, { crasse: false });
      // Dessous : entretoises
      for (let k = 0; k < 4; k++) c.pave(dir * k * PAN, -1.3, COL.zb + 0.15, dir * k * PAN + dir * 0.3, -0.42, ZB, teinteFer(u, k, 60), M.tole, { crasse: false });
      // La poutre sud, tordue, qui a suivi la dalle
      const zc = ZT;
      for (let k = 0; k < 4; k++) {
        const p1 = dir * k * PAN;
        const p2 = dir * (k + 1) * PAN;
        const tord = (hache(k, dir + 70) - 0.5) * 0.12;
        c.repere({ x: 0, y: 0, z: 0, ry: tord }, () => {
          c.pave(Math.min(p1, p2), -0.9, zc - ET / 2, Math.max(p1, p2), 0.3, zc + ET / 2, teinteFer(u, k, 61), M.tole, { crasse: false });
          if (k !== 2) c.pave(Math.min(p1, p2), HT - 0.26, zc - ET / 2, Math.max(p1, p2), HT, zc + ET / 2, teinteFer(u, k, 62), M.tole, { crasse: false });
          c.boite(0.22, HT - 0.3, ET * 0.8, teinteFer(u, k, 63), { x: p1 + dir * 0.11, y: 0.3 + (HT - 0.56) / 2, z: zc }, M.tole, { crasse: false });
          c.poutre([p1, 0.3, zc], [p2, k === 2 ? HT * 0.6 : HT - 0.26, zc], 0.15, teinteFer(u, k, 64), M.tole);
        });
      }
      // Le bord nord de la dalle, déchiqueté, et les fers à béton
      for (let k = 0; k < 12; k++) {
        const xx = dir * (0.4 + k * 0.82);
        c.boite(0.6, 0.38, 0.3 + hache(k, 71) * 0.4, C.betonSombre, { x: xx, y: -0.22, z: COL.zb + 0.1, rx: -0.3 + hache(k, 72) * 0.5 }, M.beton, { crasse: false });
        planche(c, [xx, -0.2, COL.zb + 0.1], [xx + 0.2, -0.3 - hache(k, 73) * 0.6, COL.zb - 0.4 - hache(k, 74) * 0.5], 0.025, 0.025, 0x5a4434, M.metal);
      }
      // La voiture qui a glissé jusqu'en bas de la dalle ouest, le nez dans l'eau
      if (dir === 1) voiture(c, M, 7.3, 0.02, 2.0, 0.08, 0x7a8a96, { roues: 3, rouille: 0.8, portes: true });
      // Les gravats restés sur la dalle
      gravats(c, dir * 3.2, 0.5, 1.0, 6, [C.betonSombre, C.beton, C.asphalteSombre], 0.02);
    });
    // L'écume là où la dalle entre dans l'eau
    const ux = xh + dir * (8 / Math.tan(ANGLE_DALLE));
    for (let k = 0; k < 14; k++) {
      const z = COL.zb + 0.3 + (k / 14) * (ZB - COL.zb);
      c.boite(0.5 + hache(k, 90) * 1.2, 0.02, 0.4 + hache(k, 91) * 0.6, 0xe8ece6, { x: ux + dir * (hache(k, 92) - 0.3) * 1.4, y: Y_EAU + 0.03, z, ry: hache(k, 93) * 3 }, M.lisse, { crasse: false, nuance: 0.04 });
    }
  }
  // Les blocs tombés dans l'eau, au fond du V
  if (ctx.ici(5)) {
    for (let k = 0; k < 9; k++) {
      const s = 0.4 + hache(k, 95) * 0.6;
      c.poser(CAILLOU, M.mat, 0x8f8a80, { x: 1.5 + k * 0.9, y: Y_EAU - 0.1 + hache(k, 96) * 0.4, z: -0.8 + hache(k, 97) * 5, rx: k, ry: k * 1.7, e: [s * 1.4, s * 0.7, s] }, { nuance: 0.05 });
    }
    // Un morceau de la poutre sud, tombé à plat dans l'eau
    c.boite(5, 0.4, ET, C.rouille, { x: 5, y: Y_EAU + 0.05, z: 3.6, ry: 0.4, rz: 0.06 }, M.tole);
  }
}

/** Les planches posées par les survivants au-dessus du trou, la voiture suspendue. */
function planches(ctx) {
  const { c, M, b } = ctx;
  if (!ctx.ici(5)) return;
  // Six planches de 26 cm côte à côte : 1,6 m de planches, du treillis nord (z = −5,6) au bord du trou (z = −4,0)
  const tons = [0x8f7a5c, 0x7d6a4e, 0x9a8466, 0x6f5e46, 0x8a7a62, 0x857258];
  for (let k = 0; k < 6; k++) {
    const z = -5.6 + k * 0.27 + 0.13;
    const l = 5.6 + hache(k, 1) * 0.5;
    c.boite(l, 0.05, 0.26, tons[k], { x: 5 + (hache(k, 2) - 0.5) * 0.3, y: 0.045, z, ry: (hache(k, 3) - 0.5) * 0.02 }, M.mat, { nuance: 0.06 });
  }
  // Les traverses clouées, et une corde de main courante nouée aux montants du treillis
  for (const x of [3.4, 5, 6.6]) c.boite(0.12, 0.04, 1.5, 0x6a5a44, { x, y: 0.09, z: -4.72 }, M.mat);
  for (let x = 2.5; x < 7.6; x += 0.5) {
    const y = 1.2 - 0.18 * Math.sin(((x - 2.5) / 5) * Math.PI);
    c.boite(0.52, 0.03, 0.03, 0xb8a27a, { x: x + 0.25, y, z: -ZB + 0.08 }, M.mat, { crasse: false });
  }
  // Le panneau des survivants, cloué sur le treillis (face au sud, vers ceux qui arrivent)
  panneau(c, M.atlas, R.unALaFois, { x: 1.6, y: 1.25, z: -ZB + 0.06 }, 1.3, 0.33);
  panneau(c, M.atlas, R.unALaFois, { x: 8.4, y: 1.25, z: -ZB + 0.06 }, 1.3, 0.33);
  // La voiture suspendue au-dessus du vide, retenue par son pare-chocs arrière accroché aux fers du bord
  c.repere({ x: TROU.x2 + 0.15, y: 0.12, z: -2.85, ry: Math.PI, rz: -1.22 }, () => {
    voiture(c, M, 2.08, -0.5, 0, 0, 0x9a6a4a, { roues: 4, rouille: 0.7, coffre: true });
  });
  for (let k = 0; k < 4; k++) planche(c, [TROU.x2, -0.1, -3.4 + k * 0.3], [TROU.x2 - 0.4, 0.05, -3.4 + k * 0.3 + 0.1], 0.03, 0.03, 0x5a4434, M.metal);
  b.lumiere(6.4, -1.6, -2.9, 0xffa040, 1.4, 5, "feux de détresse de la voiture suspendue : la batterie tient encore");
}

// ---------- La suspension : câbles porteurs, suspentes, pylônes, ancrages ----------

function suspension(ctx) {
  const { c, M, u } = ctx;
  for (const s of [-1, 1]) {
    // Le câble porteur, morceau par morceau
    const pas = 1.5;
    for (let x = -XA; x < XA - 1e-6; x += pas) {
      const x2 = Math.min(XA, x + pas);
      const xm = (x + x2) / 2;
      if (!ctx.ici(xm)) continue;
      c.tube([x, cableY(x), s * cableZ(x)], [x2, cableY(x2), s * cableZ(x2)], 0.2, C.cable, M.tole, 6, { crasse: false });
      if (hache(Math.round(x * 2), s + 3) < 0.25) fientes(c, M, xm - 0.4, s * cableZ(xm) - 0.1, xm + 0.4, s * cableZ(xm) + 0.1, cableY(xm) + 0.18, 1);
    }
    // Les suspentes, tous les 2,5 m
    for (let k = -22; k <= 22; k++) {
      const x = k * PAN;
      const ax = Math.abs(x);
      if (!ctx.ici(x)) continue;
      const travee = ax < XP - 1;
      const rive = ax > XP + 1 && ax <= 50 && cableY(x) - HT > 0.6;
      if (!travee && !rive) continue;
      const yc = cableY(x);
      const zc = s * cableZ(x);
      c.boite(0.3, 0.3, 0.3, 0x3c3e3e, { x, y: yc, z: zc }, M.tole);
      if (s === 1 && x > COL.x1 && x < COL.x2) {
        // Cassées : elles pendent du câble, plus ou moins longues, un peu de travers
        const lg = 1.5 + hache(k, 50) * 3.2;
        planche(c, [x, yc, zc], [x + (hache(k, 51) - 0.5) * 0.8, yc - lg, zc + (hache(k, 52) - 0.5) * 0.6], 0.07, 0.07, 0x4a4a48, M.metal);
        continue;
      }
      if (s === -1 && x > TROU.x1 && x < TROU.x2) {
        // Au-dessus du trou, la suspente tient seule le treillis nord : tendue, et l'une a été doublée d'une corde
        planche(c, [x, yc, zc], [x, HT, s * ZT], 0.07, 0.07, 0x4a4a48, M.metal);
        planche(c, [x + 0.12, yc - 0.5, zc], [x + 0.12, HT, s * ZT], 0.04, 0.04, 0xb8a27a, M.mat);
        continue;
      }
      planche(c, [x, yc, zc], [x, HT, s * ZT], 0.07, 0.07, 0x4a4a48, M.metal);
      c.boite(0.16, 0.22, 0.16, teinteFer(u, k, s + 53), { x, y: HT + 0.1, z: s * ZT }, M.tole);
    }
  }
  pylone(ctx, -XP);
  pylone(ctx, XP);
  ancrages(ctx);
}

/** Un pylône de béton Art déco sur sa pile de pierre : jambes à nervures, portique, traverse haute, couronnement à gradins. */
function pylone(ctx, xp) {
  if (!ctx.ici(xp)) return;
  const { c, b, M, u } = ctx;
  const ouest = xp < 0;
  const k = b.couche(ouest ? "pylône ouest" : "pylône est", { x: xp, z: 0, l: 4.2, p: 17 }, 4.0, YS + 0.6);
  const BET = C.beton;
  const BET2 = C.betonSombre;
  // ---- La pile, dans l'eau : avant-becs, laisse de marée, plateformes à y = 0 de part et d'autre du tablier
  const X1 = xp - 5;
  const X2 = xp + 5;
  c.pave(X1, Y_FOND - 0.8, -10.5, X2, -1.4, 10.5, C.quai, M.pierre, { crasse: false });
  for (const s of [-1, 1]) {
    const g = new THREE.CylinderGeometry(5.77, 5.77, 7, 3);
    c.poser(g, M.pierre, C.quai, { x: xp, y: Y_FOND - 0.8 + 3.5, z: s * (10.5 + 1.3), ry: s > 0 ? 0 : Math.PI, e: [1, 1, 0.45] }, { crasse: false });
    g.dispose();
    const ch = new THREE.CylinderGeometry(0.1, 5.77, 1.4, 3);
    c.poser(ch, M.pierre, C.quaiSombre, { x: xp, y: Y_FOND - 0.8 + 7 + 0.7, z: s * (10.5 + 1.3), ry: s > 0 ? 0 : Math.PI, e: [1, 1, 0.45] }, { crasse: false });
    ch.dispose();
    // La plateforme : maçonnerie, corniche, dalle de béton au niveau du tablier
    c.pave(X1, -1.4, s > 0 ? ZT + ET / 2 : -10.5, X2, -0.3, s > 0 ? 10.5 : -ZT - ET / 2, C.quai, M.pierre, { crasse: false });
    c.pave(X1 - 0.2, -0.55, s > 0 ? ZT + ET / 2 : -10.7, X2 + 0.2, -0.25, s > 0 ? 10.7 : -ZT - ET / 2, C.quaiSombre, M.pierre, { crasse: false });
    c.pave(X1, -0.3, s > 0 ? ZT + ET / 2 : -10.5, X2, 0.02, s > 0 ? 10.5 : -ZT - ET / 2, C.beton, M.beton, { crasse: false });
    // Le garde-corps de la plateforme : potelets et lisses, des manques
    const bord = [[X1, s * 10.4], [X2, s * 10.4]];
    for (let x = X1 + 0.2; x <= X2; x += 1.25) {
      if (hache(Math.round(x * 4), s + 1) < 0.15 + 0.2 * u) continue;
      c.boite(0.07, 1.05, 0.07, 0x4a4c4a, { x, y: 0.53, z: s * 10.4, rz: (hache(Math.round(x * 4), s + 2) - 0.5) * 0.25 }, M.metal);
    }
    c.boite(10, 0.05, 0.05, 0x4a4c4a, { x: xp, y: 1.02, z: s * 10.4 }, M.metal);
    for (const xx of [X1 + 0.05, X2 - 0.05]) c.boite(0.05, 0.05, 10.5 - ZT - 0.2, 0x4a4c4a, { x: xx, y: 1.02, z: s * (ZT + (10.5 - ZT) / 2) }, M.metal);
    b.obstacle(bord[0][0], bord[0][1], bord[1][0], bord[1][1], "garde-corps de la pile : le vide");
    b.obstacle(X1, s * ZB, X1, s * 10.4, "bord de la pile : le vide");
    b.obstacle(X2, s * ZB, X2, s * 10.4, "bord de la pile : le vide");
    fientes(c, M, X1, s > 0 ? 6.2 : -10.4, X2, s > 0 ? 10.4 : -6.2, 0.02, 10);
  }
  // La laisse de marée autour de la pile
  c.pave(X1 - 0.03, Y_EAU - 0.2, -10.53, X2 + 0.03, Y_EAU + 2.6, 10.53, C.algues, M.mat, { crasse: false });
  // ---- Les jambes
  for (const s of [-1, 1]) {
    const z = s * ZL;
    c.pave(xp - 1.05, 0, z - 0.95, xp + 1.05, 1.0, z + 0.95, BET2, M.beton, { crasse: false });
    c.pave(xp - 0.9, 1.0, z - 0.85, xp + 0.9, 1.35, z + 0.85, BET, M.beton, { crasse: false });
    ctx.b.obstacle(xp - 1.05, z - 0.95, xp + 1.05, z - 0.95, "pied du pylône");
    ctx.b.obstacle(xp + 1.05, z - 0.95, xp + 1.05, z + 0.95, "pied du pylône");
    ctx.b.obstacle(xp + 1.05, z + 0.95, xp - 1.05, z + 0.95, "pied du pylône");
    ctx.b.obstacle(xp - 1.05, z + 0.95, xp - 1.05, z - 0.95, "pied du pylône");
    // Le fût : bas (toujours visible), haut (couche)
    for (const [ch, y1, y2] of [[c, 1.35, 4.0], [k, 4.0, 12.6]]) {
      ch.pave(xp - 0.75, y1, z - 0.75, xp + 0.75, y2, z + 0.75, BET, M.beton, { crasse: false, nuance: 0.02 });
      // Les nervures verticales sur les quatre faces
      for (const d of [-0.36, 0.36]) {
        ch.pave(xp + d - 0.1, y1, z + 0.75, xp + d + 0.1, y2 - 0.2, z + 0.83, BET2, M.beton, { crasse: false });
        ch.pave(xp + d - 0.1, y1, z - 0.83, xp + d + 0.1, y2 - 0.2, z - 0.75, BET2, M.beton, { crasse: false });
        ch.pave(xp + 0.75, y1, z + d - 0.1, xp + 0.83, y2 - 0.2, z + d + 0.1, BET2, M.beton, { crasse: false });
        ch.pave(xp - 0.83, y1, z + d - 0.1, xp - 0.75, y2 - 0.2, z + d + 0.1, BET2, M.beton, { crasse: false });
      }
    }
    // La lanterne de bronze sur la face côté route (éteinte depuis longtemps)
    c.repere({ x: xp + 0.85, y: 3.0, z: z - s * 0.2 }, () => {
      c.boite(0.35, 0.08, 0.08, 0x5a4a30, { x: 0.15 }, M.metal);
      cylindre(c, M.verre, 0xd8d0b0, 0.32, -0.35, 0, 0.14, 0.1, 0.4, 6);
      cylindre(c, M.metal, 0x5a4a30, 0.32, 0.05, 0, 0.03, 0.17, 0.14, 6);
    });
    // Le couronnement à gradins et la selle du câble
    k.pave(xp - 0.95, 12.6, z - 0.95, xp + 0.95, 13.1, z + 0.95, BET, M.beton, { crasse: false });
    k.pave(xp - 0.8, 13.1, z - 0.8, xp + 0.8, 13.5, z + 0.8, BET2, M.beton, { crasse: false });
    k.pave(xp - 0.6, 13.5, z - 0.6, xp + 0.6, 13.9, z + 0.6, BET, M.beton, { crasse: false });
    k.pave(xp - 0.55, 13.9, z - 0.38, xp + 0.55, 14.35, z + 0.38, 0x4a4c4a, M.tole, { crasse: false });
    fientes(k, M, xp - 0.95, z - 0.95, xp + 0.95, z + 0.95, 13.1, 6);
    fientes(k, M, xp - 0.8, z - 0.8, xp + 0.8, z + 0.8, 13.5, 4);
    couluresBlanches(k, M, xp, 12.6, z + 0.84, 0, 1.2, 5, 2.2);
    couluresBlanches(k, M, xp + 0.84, 12.6, z, Math.PI / 2, 1.2, 4, 2.2);
    // Les coulures de rouille sous la selle
    for (let j = 0; j < 3; j++) k.boite(0.08, 1.6 + j * 0.5, 0.02, C.rouilleClaire, { x: xp - 0.3 + j * 0.3, y: 12.4 - j * 0.25, z: z + 0.84 }, M.mat, { crasse: false });
  }
  // ---- Le portique : traverse basse à fronton à gradins, goussets, plaque ; traverse haute ajourée
  k.pave(xp - 0.6, 5.4, -ZL + 0.75, xp + 0.6, 6.6, ZL - 0.75, BET, M.beton, { crasse: false });
  for (const s of [-1, 1]) {
    k.boite(1.2, 1.3, 1.3, BET, { x: xp, y: 5.4, z: s * (ZL - 1.2), rx: Math.PI / 4 }, M.beton, { crasse: false });
  }
  let larg = 6.2;
  for (let j = 0; j < 3; j++) {
    k.pave(xp - 0.5 + j * 0.05, 6.6 + j * 0.35, -larg / 2, xp + 0.5 - j * 0.05, 6.95 + j * 0.35, larg / 2, j % 2 ? BET2 : BET, M.beton, { crasse: false });
    larg -= 1.8;
  }
  for (const s of [-1, 1]) {
    panneau(k, M.atlas, R.plaque1934, { x: xp + s * 0.61, y: 6.0, z: 0, ry: s * Math.PI / 2 }, 3.4, 1.0);
  }
  // Les cannelures sous la traverse
  for (let j = -2; j <= 2; j++) k.pave(xp - 0.62, 5.6, j * 1.6 - 0.1, xp + 0.62, 6.4, j * 1.6 + 0.1, BET2, M.beton, { crasse: false });
  k.pave(xp - 0.5, 11.0, -ZL + 0.75, xp + 0.5, 12.0, ZL - 0.75, BET, M.beton, { crasse: false });
  for (let j = -1; j <= 1; j++) for (const s of [-1, 1]) k.pave(xp + s * 0.5 - 0.02, 11.2, j * 3.2 - 1.0, xp + s * 0.5 + 0.02, 11.8, j * 3.2 + 1.0, 0x5c5a54, M.mat, { crasse: false });
  fientes(k, M, xp - 0.5, -ZL + 0.8, xp + 0.5, ZL - 0.8, 12.0, 14);
  fientes(k, M, xp - 0.5, -2, xp + 0.5, 2, 7.65, 6);
  // Les traces de rouille et d'eau au pied des jambes, sur le tablier
  for (const s of [-1, 1]) c.boite(1.8, 0.01, 0.8, C.rouille, { x: xp, y: 0.075, z: s * (ZB - 0.5) }, M.mat, { crasse: false });
}

/** Les massifs d'ancrage des câbles, sur les quais, et les pilastres d'entrée du pont. */
function ancrages(ctx) {
  const { c, M } = ctx;
  for (const sx of [-1, 1]) {
    const xm = sx * 56.5;
    if (!ctx.ici(xm)) continue;
    for (const s of [-1, 1]) {
      const z1 = s > 0 ? ZTR + 0.3 : -ZTR - 3.2;
      const z2 = z1 + 2.9;
      c.pave(xm - 2.5, 0, z1, xm + 2.5, 1.5, z2, C.beton, M.beton, { crasse: false });
      c.pave(sx > 0 ? xm - 2.5 : xm, 1.5, z1 + 0.2, sx > 0 ? xm : xm + 2.5, 2.6, z2 - 0.2, C.betonSombre, M.beton, { crasse: false });
      c.pave(xm - 2.6, 1.42, z1 - 0.1, xm + 2.6, 1.55, z2 + 0.1, C.beton, M.beton, { crasse: false });
      // Les gradins Art déco côté route
      for (let j = 0; j < 3; j++) c.pave(xm - 2.5 + j * 0.15, 0, s > 0 ? z1 - 0.12 * (j + 1) : z2, xm + 2.5 - j * 0.15, 1.2 - j * 0.35, s > 0 ? z1 : z2 + 0.12 * (j + 1), C.betonSombre, M.beton, { crasse: false });
      obstacleBoite(ctx.b, xm, (z1 + z2) / 2, 5.0, 2.9, 0, "massif d'ancrage du câble");
      fientes(c, M, xm - 2.5, z1, xm + 2.5, z2, 1.55, 8);
      // Le pilastre d'entrée, sa lanterne morte
      const xpil = sx * 51.4;
      pilier(c, M.beton, C.beton, xpil, 0, s * 6.1, 1.1, 0.8, 3.4, { crasse: true });
      c.pave(xpil - 0.6, 3.4, s * 6.1 - 0.6, xpil + 0.6, 3.6, s * 6.1 + 0.6, C.betonSombre, M.beton, { crasse: false });
      cylindre(c, M.verre, 0xd8d0b0, xpil, 3.6, s * 6.1, 0.22, 0.18, 0.5, 6);
      cylindre(c, M.metal, 0x5a4a30, xpil, 4.1, s * 6.1, 0.05, 0.28, 0.2, 6);
      fientes(c, M, xpil - 0.6, s * 6.1 - 0.6, xpil + 0.6, s * 6.1 + 0.6, 3.6, 4);
    }
    // La limite de charge de 1934, sur le premier montant du treillis
    panneau(c, M.atlas, R.limite, { x: sx * 49.0, y: 2.7, z: -ZB + 0.05 }, 0.6, 0.6);
    panneau(c, M.atlas, R.limite, { x: sx * 49.0, y: 2.7, z: ZB - 0.05, ry: Math.PI }, 0.6, 0.6);
  }
}

// ---------- Ce qui est animé : l'eau, le vent, les écrans ----------

function animations(ctx) {
  const { M, b } = ctx;
  const anime = new THREE.Object3D();
  anime.userData.animer = (t) => {
    M.eau.map.offset.y = -((t * 0.03) % 1);
    M.eau.map.offset.x = 0.02 * Math.sin(t * 0.4);
    // L'écran du pont connecté : il tient, puis décroche, puis revient
    const a = Math.sin(t * 5.3) * Math.sin(t * 1.7);
    M.lumineux.emissiveIntensity = a > 0.55 ? 0.15 : 0.85 + 0.15 * Math.sin(t * 23);
  };
  anime.userData.mobile = true;
  b.ajouter(anime);
}

/** Une étoffe qui claque au vent (drapeau, manche à air) : un maillage à part, pivot sur son mât. */
function etoffe(ctx, x, y, z, geo, couleur, base, ampleur = 0.35) {
  const mat = new THREE.MeshStandardMaterial({ color: couleur, roughness: 0.95, side: THREE.DoubleSide, flatShading: true });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.y = base;
  m.castShadow = true;
  m.userData.mobile = true;
  const phase = x * 0.37;
  m.userData.animer = (t) => {
    m.rotation.y = base + ampleur * Math.sin(t * 2.6 + phase) * Math.sin(t * 0.7 + phase);
    m.rotation.z = -0.05 + 0.06 * Math.sin(t * 4.1 + phase);
  };
  ctx.b.ajouter(m);
}

// ---------- Le bourg, rive ouest ----------

function bourg(ctx) {
  const { c, b, M, u } = ctx;
  if (!ctx.ici(-75)) return;
  // Le quai pavé et le parvis du bar
  c.pave(-80, -0.04, ZTR, -58.3, 0.03, 35, C.paves, M.paves, { crasse: false, nuance: 0 });
  c.pave(-58.3, -0.04, ZTR, -50.3, 0.03, 13.7, C.paves, M.paves, { crasse: false, nuance: 0 });
  c.pave(-100, -0.04, ZTR, -80, 0.025, 6.5, C.paves, M.paves, { crasse: false, nuance: 0 });
  // Côté nord : un trottoir élargi devant la maison du pontier
  c.pave(-79, -0.04, -6.6, -60, 0.03, -ZTR, C.paves, M.paves, { crasse: false, nuance: 0 });

  // Le panneau de sortie ouest (vers le terrain ; vers l'hôtel par le pont), sa lanterne ; les bords du bout ouest
  panneauSortie(ctx, "ouest", R.sortieOuest, -95, -6.6);
  bordsDuBout(ctx, -1);
  reverbere(ctx, -90, -5.9, 0.03);
  reverbere(ctx, -70, 5.9, -0.06);
  reverbere(ctx, -56, 12.8, 0.08);

  portiqueConnecte(ctx, -61.6, R.pontConnecte);
  cablesCuivre(ctx, -60.2, -6.1);
  borneExpress(ctx);
  maisonPontier(ctx);
  bar(ctx);
  quaiOuest(ctx);
  carrelet(ctx);
  maisonsDuBourg(ctx);
  dunesNord(ctx, -100, -58);
  // Les lumières de la rive ouest
  b.lumiere(-73.8, 1.15, -8.5, 0xffc46a, 6, 9, "bougie dans un bocal, sur la table de la cuisine du pontier");
  b.lumiere(-88.6, 1.35, 11.0, 0xffb060, 3, 7, "bougies dans des bocaux, sur le comptoir du bar");
  b.lumiere(-60.8, 6.8, 0, 0x8fd0ff, 2.2, 9, "écran « Pont connecté » qui luit encore par à-coups");
  void u;
}

/** Le portique au-dessus de la route : l'écran double face du pont connecté, ses caméras. */
function portiqueConnecte(ctx, x, r) {
  const { c, M } = ctx;
  c.repere({ x, y: 0, z: 0 }, () => {
    for (const s of [-1, 1]) {
      cylindre(c, M.metal, 0x8a9294, 0, 0, s * 5.0, 0.16, 0.2, 6.6, 8);
      c.boite(0.6, 0.3, 0.6, 0x8a9294, { y: 0.15, z: s * 5.0 }, M.metal);
    }
    c.boite(0.5, 0.5, 10.6, 0x8a9294, { y: 6.3 }, M.metal);
    c.boite(0.35, 1.9, 6.8, 0x2a2e30, { y: 7.5 }, M.tole);
    panneau(c, M.lumineux, r, { x: 0.18, y: 7.5, ry: Math.PI / 2 }, 6.5, 1.62);
    panneau(c, M.lumineux, r, { x: -0.18, y: 7.5, ry: -Math.PI / 2 }, 6.5, 1.62);
    for (const z of [-2.5, 2.5]) {
      c.boite(0.5, 0.25, 0.25, 0x2a2e30, { x: 0.2, y: 5.95, z }, M.lisse);
      cylindre(c, M.verre, 0x223038, 0.47, 5.95, z, 0.08, 0.08, 0.06, 6, { rz: Math.PI / 2 });
    }
    fientes(c, M, -0.2, -5.2, 0.2, 5.2, 6.55, 8);
    fientes(c, M, -0.17, -3.4, 0.17, 3.4, 8.45, 6);
    couluresBlanches(c, M, 0.19, 8.45, 0, Math.PI / 2, 6, 4, 0.8);
  });
  ctx.b.obstacle(x - 0.3, -5.3, x + 0.3, -5.3, "poteau du portique");
  ctx.b.obstacle(x - 0.3, 5.3, x + 0.3, 5.3, "poteau du portique");
}

/** La borne de télépéage « Pont Express sans arrêt », sa barrière arrachée. */
function borneExpress(ctx) {
  const { c, M, b } = ctx;
  c.repere({ x: -65.8, y: 0, z: -4.7 }, () => {
    c.boite(1.0, 0.18, 0.7, 0xb3ada2, { y: 0.09 }, M.beton);
    c.boite(0.6, 1.7, 0.45, 0xd9d6cc, { y: 1.0 }, M.satine);
    c.boite(0.62, 0.18, 0.47, 0x12324a, { y: 1.9 }, M.satine);
    panneau(c, M.lumineux, R.pontExpress, { y: 1.15, z: 0.23 }, 0.56, 0.56);
    c.boite(0.25, 0.05, 0.14, 0x1e1e1e, { y: 0.75, z: 0.25 }, M.lisse);
    // Le bras de la barrière, arraché, en travers de la chaussée
    c.boite(0.35, 1.0, 0.35, 0xd9d6cc, { x: 0.8, y: 0.5 }, M.satine);
    c.boite(4.2, 0.1, 0.1, 0xe4e2da, { x: 2.0, y: 0.06, z: 1.9, ry: -0.35 }, M.satine);
    for (let i = 0; i < 4; i++) c.boite(0.4, 0.105, 0.105, 0xb8352a, { x: 0.8 + i * 0.95, y: 0.06, z: 1.5 + i * 0.32, ry: -0.35 }, M.satine);
  });
  obstacleBoite(b, -65.8, -4.7, 1.0, 0.7, 0, "borne de télépéage");
}

/** La maison du pontier (1934) : guichet du péage sur la route, bureau, cuisine, réserve ; l'étage dans une couche. */
function maisonPontier(ctx) {
  const { c, b, M, u } = ctx;
  const X1 = -77;
  const X2 = -66;
  const Z1 = -15;
  const Z2 = -6.6;
  const H = 3.0;
  const k = b.couche("maison du pontier", { x: (X1 + X2) / 2, z: (Z1 + Z2) / 2, l: X2 - X1 + 0.8, p: Z2 - Z1 + 0.8 }, 1.05, 8.6);
  const enduit = { couleur: C.enduit, mat: M.enduit };
  const int = { couleur: 0xd9cfb6, mat: M.mat };
  const bris = 0.3 + 0.6 * u;
  const fen = (uu, l = 1.2) => ({ u: uu, l, bas: 1.0, haut: 2.3, type: "fenetre", bris, croisillons: 1, traverses: 2, cadre: 0xe6e2d8, volet: hache(Math.round(uu * 10), 3) < 0.5 ? "ouvert" : "pendu", couleurVolet: C.volet });
  // Façade sud, sur la route : la porte (cuisine), le guichet du péage (bureau)
  murDouble(ctx, k, [X1, Z2], [X2, Z2], { h: H, bas: enduit, interieur: int, ouvertures: [{ u: 3, l: 1.0, bas: 0, haut: 2.15, type: "porte", vantail: "entrouvert", couleurPorte: 0x3f5f6e, angle: 1.3 }, fen(5.6, 1.0), { u: 8.6, l: 1.7, bas: 0.95, haut: 2.15, type: "fenetre", bris: 0.8, croisillons: 2, traverses: 1, cadre: 0x3f5f6e }] });
  murDouble(ctx, k, [X2, Z2], [X2, Z1], { h: H, bas: enduit, interieur: int, ouvertures: [fen(3.0), fen(6.4)] });
  murDouble(ctx, k, [X2, Z1], [X1, Z1], { h: H, bas: enduit, interieur: int, ouvertures: [fen(3.5, 0.9), { u: 8.4, l: 0.95, bas: 0, haut: 2.1, type: "porte", vantail: "tombe" }] });
  murDouble(ctx, k, [X1, Z1], [X1, Z2], { h: H, bas: enduit, interieur: int, ouvertures: [fen(5.2)] });
  // Les cloisons : réserve au nord, cuisine à l'ouest, bureau à l'est
  murDouble(ctx, k, [X1, -11], [X2, -11], { h: H, ep: 0.14, bas: int, ouvertures: [{ u: 3.5, l: 0.9, bas: 0, haut: 2.1, type: "vide" }, { u: 9.0, l: 0.9, bas: 0, haut: 2.1, type: "vide" }] });
  murDouble(ctx, k, [-70.5, -11], [-70.5, Z2], { h: H, ep: 0.14, bas: int, ouvertures: [{ u: 2.2, l: 0.9, bas: 0, haut: 2.1, type: "vide" }] });
  // Sols
  c.pave(X1 + 0.1, 0, Z1 + 0.1, X2 - 0.1, 0.03, Z2 - 0.1, 0xb8ad94, M.pierre, { crasse: false, nuance: 0 });
  // Le soubassement de brique et la plaque peinte du péage au-dessus du guichet
  c.pave(X1 - 0.18, 0, Z2 - 0.05, X2 + 0.18, 0.5, Z2 + 0.2, PALETTE.brique, M.mat, { crasse: false, nuance: 0.03 });
  panneau(k, M.atlas, R.peage, { x: -67.4, y: 2.62, z: Z2 + 0.17 }, 2.1, 0.4);
  panneau(c, M.atlas, R.tarifs, { x: -66.6, y: 1.2, z: Z2 + 0.17 }, 0.6, 0.6);
  panneau(k, M.atlas, R.pontier, { x: -74, y: 2.45, z: Z2 + 0.17 }, 1.4, 0.35);
  // La tablette du guichet, dehors, et le comptoir dedans
  c.boite(1.9, 0.06, 0.4, 0xcfc8b8, { x: -67.4, y: 0.95, z: Z2 + 0.3 }, M.pierre);
  c.boite(1.9, 0.95, 0.5, C.bois, { x: -67.4, y: 0.475, z: Z2 - 0.45 }, M.mat);
  // L'étage (couche) : bandeau de brique, fenêtres, toit de tuiles
  k.pave(X1 - 0.12, H, Z1 - 0.12, X2 + 0.12, H + 0.25, Z2 + 0.12, PALETTE.brique, M.mat, { crasse: false });
  for (const [a, bb, ouv] of [[[X1, Z2], [X2, Z2], [fen(2.5), fen(5.5), fen(8.5)]], [[X2, Z2], [X2, Z1], [fen(4.2)]], [[X2, Z1], [X1, Z1], [fen(5.5)]], [[X1, Z1], [X1, Z2], [fen(4.2)]]]) {
    mur(k, a, bb, { h: 2.6, y0: H + 0.25, couleur: C.enduit, mat: M.enduit, ouvertures: ouv.map((o) => ({ ...o, bas: 0.8, haut: 2.0 })) });
  }
  toitDeuxPans(k, (X1 + X2) / 2, (Z1 + Z2) / 2, X2 - X1, Z2 - Z1, H + 2.85, 2.6, { couleur: C.tuile, mat: M.tuiles, debord: 0.45, trous: u > 0.5 ? [{ u: 2.5, v: 1, l: 2.4, p: 0.6 }] : [] });
  k.pave(-69.2, H + 2.85, -12.3, -68.4, H + 5.4, -11.5, PALETTE.brique, M.mat, { crasse: false });
  fientes(k, M, X1, Z1, X2, Z2, H + 4.2, 14);
  // La marquise au-dessus de la porte
  k.pave(-74.8, 2.45, Z2, -73.2, 2.55, Z2 + 0.9, 0x4a4c4a, M.tole, { crasse: false });
  // Le bureau : table, registre ouvert, chaise, coffre, armoire, horloge
  table(c, M, -68.8, -9.6, 1.4, 0.8, 0, C.bois);
  panneau(c, M.atlas, R.registre, { x: -68.8, y: 0.8, z: -9.6, rx: -Math.PI / 2 }, 0.62, 0.32);
  chaise(c, M, -68.8, -8.8, Math.PI);
  c.boite(0.7, 1.0, 0.6, 0x3a3c3a, { x: -66.6, y: 0.5, z: -10.4 }, M.tole);
  c.boite(0.9, 1.9, 0.45, C.bois, { x: -69.9, y: 0.95, z: -10.5 }, M.mat);
  cylindre(c, M.lisse, 0xe6e2d8, -67.2, 2.2, -10.82, 0.18, 0.18, 0.04, 10, { rx: Math.PI / 2 });
  // La cuisine : cuisinière à bois, table, vaisselier, évier ; la bougie dans son bocal, sur la table
  c.boite(1.0, 0.85, 0.6, 0x2e2c2b, { x: -76.2, y: 0.43, z: -10.4 }, M.tole);
  c.boite(0.15, 2.2, 0.15, 0x2e2c2b, { x: -76.5, y: 1.95, z: -10.6 }, M.tole);
  table(c, M, -73.6, -8.6, 1.2, 0.8, 0.1, 0xa08a66);
  chaise(c, M, -73.6, -9.3, 0.2, u > 0.5);
  chaise(c, M, -72.9, -8.0, -1.6);
  etagere(c, M, -72, -10.7, 0, 1.3, 1.8, [0xd8d2c4, 0x7a8a96, 0xb8a27a, 0x9a6a4a], 0.5);
  c.boite(0.9, 0.85, 0.55, 0xd8d4c8, { x: -76.3, y: 0.43, z: -7.3 }, M.lisse);
  cylindre(c, M.verre, 0xffe8b0, -73.8, 0.79, -8.5, 0.07, 0.07, 0.15, 6);
  cylindre(c, M.lisse, 0xf0e6c8, -73.8, 0.79, -8.5, 0.035, 0.035, 0.09, 5);
  cylindre(c, M.lisse, 0xf0e6c8, -73.3, 0.79, -8.8, 0.03, 0.03, 0.05, 5);
  // La réserve : rayonnages, bidons ronds de pétrole, cordages, bâches, un vélo ; la table où se cache le rampant
  etagere(c, M, -75, -14.6, 0, 2.6, 2.0, [0xc9a050, 0x7a8a96, 0x8a3a30, 0xd8d2c4, 0x5f7a3a], 0.6);
  for (let i = 0; i < 4; i++) cylindre(c, M.tole, 0x6a6a5a, -72.6 + i * 0.38, 0, -14.45, 0.15, 0.15, 0.42, 8);
  glene(c, M, -71, -13.4);
  table(c, M, -69.4, -12.9, 1.5, 0.8, 0.05, C.boisGris);
  c.boite(1.6, 0.15, 1.0, 0x4a4c40, { x: -67.2, y: 0.08, z: -13.8, ry: 0.2 }, M.toile);
  c.repere({ x: -67.3, y: 0, z: -12.2, ry: 0.3 }, () => {
    for (const s of [-0.55, 0.55]) cylindre(c, M.mat, 0x2a2a2a, s, 0.35, 0, 0.33, 0.33, 0.04, 10, { rx: Math.PI / 2 });
    c.boite(1.1, 0.05, 0.04, 0x2f4f6a, { y: 0.6 }, M.metal);
    c.boite(0.05, 0.6, 0.04, 0x2f4f6a, { x: 0.3, y: 0.45, rz: 0.3 }, M.metal);
  });
  debris(c, X1 + 0.3, Z1 + 0.3, X2 - 0.3, Z2 - 0.3, Math.round(14 * u));
  jonchee(c, X1 + 0.3, Z1 + 0.3, X2 - 0.3, Z2 - 0.3, Math.round(16 * u), [0xe6dcc4, 0xd8d0b8, 0x9c7a45]);
  touffes(c, [[X1 - 0.3, Z2 + 0.4], [X2 + 0.3, -10], [X1 - 0.2, -12]], C.oyatSec);
}

/** Le bar-épicerie « Au Rendez-vous des Pêcheurs », sa terrasse face au quai. */
function bar(ctx) {
  const { c, b, M, u } = ctx;
  const X1 = -92;
  const X2 = -80;
  const Z1 = 6.5;
  const Z2 = 15.5;
  const H = 3.2;
  const k = b.couche("bar des pêcheurs", { x: (X1 + X2) / 2, z: (Z1 + Z2) / 2, l: X2 - X1 + 0.8, p: Z2 - Z1 + 0.8 }, 1.05, 9.2);
  const enduit = { couleur: C.enduitBleu, mat: M.enduit };
  const int = { couleur: 0xe0d2b0, mat: M.mat };
  const bris = 0.4 + 0.5 * u;
  const vitrine = (uu, l) => ({ u: uu, l, bas: 0.6, haut: 2.5, type: "fenetre", bris, croisillons: 2, traverses: 1, cadre: 0x2c4c5c });
  // Façade nord (la route) : la porte, deux vitrines
  murDouble(ctx, k, [X2, Z1], [X1, Z1], { h: H, bas: enduit, interieur: int, ouvertures: [vitrine(2.6, 2.6), { u: 6, l: 1.4, bas: 0, haut: 2.3, type: "porte", vantail: "entrouvert", couleurPorte: 0x2c4c5c, angle: 1.6 }, vitrine(9.4, 2.6)] });
  // Façade est (le quai) : la porte de la terrasse, une fenêtre
  murDouble(ctx, k, [X2, Z2], [X2, Z1], { h: H, bas: enduit, interieur: int, ouvertures: [{ u: 2.4, l: 1.4, bas: 0.9, haut: 2.3, type: "fenetre", bris, croisillons: 1, traverses: 2, cadre: 0x2c4c5c }, { u: 6.3, l: 1.1, bas: 0, haut: 2.3, type: "porte", vantail: "entrouvert", couleurPorte: 0x2c4c5c, angle: 1.0 }] });
  murDouble(ctx, k, [X1, Z2], [X2, Z2], { h: H, bas: enduit, interieur: int, ouvertures: [{ u: 4.5, l: 1.0, bas: 0, haut: 2.1, type: "porte", vantail: "tombe" }, { u: 8.6, l: 1.0, bas: 1.2, haut: 2.2, type: "fenetre", bris, croisillons: 0, traverses: 1 }] });
  murDouble(ctx, k, [X1, Z1], [X1, Z2], { h: H, bas: enduit, interieur: int });
  // La cloison de la réserve
  murDouble(ctx, k, [X1, 12.5], [X2, 12.5], { h: H, ep: 0.14, bas: int, ouvertures: [{ u: 7.6, l: 1.0, bas: 0, haut: 2.1, type: "vide" }] });
  c.pave(X1 + 0.1, 0, Z1 + 0.1, X2 - 0.1, 0.03, Z2 - 0.1, 0xc8a878, M.pierre, { crasse: false, nuance: 0 });
  // L'étage, le toit, l'enseigne
  k.pave(X1 - 0.12, H, Z1 - 0.12, X2 + 0.12, H + 0.2, Z2 + 0.12, 0xe6e2d8, M.mat, { crasse: false });
  const fenH = (uu) => ({ u: uu, l: 1.0, bas: 0.7, haut: 1.9, type: "fenetre", bris, croisillons: 1, traverses: 2, volet: "ouvert", couleurVolet: C.volet });
  for (const [a, bb, ouv] of [[[X2, Z1], [X1, Z1], [fenH(3), fenH(9)]], [[X2, Z2], [X2, Z1], [fenH(4.5)]], [[X1, Z2], [X2, Z2], [fenH(3), fenH(9)]], [[X1, Z1], [X1, Z2], []]]) {
    mur(k, a, bb, { h: 2.4, y0: H + 0.2, couleur: C.enduitBleu, mat: M.enduit, ouvertures: ouv });
  }
  toitDeuxPans(k, (X1 + X2) / 2, (Z1 + Z2) / 2, X2 - X1, Z2 - Z1, H + 2.6, 2.4, { couleur: 0x7a5a50, mat: M.tuiles, debord: 0.4, trous: u > 0.6 ? [{ u: -3, v: 1, l: 2.4, p: 0.5 }] : [] });
  fientes(k, M, X1, Z1, X2, Z2, H + 3.9, 16);
  panneau(k, M.atlas, R.bar, { x: -86, y: 2.75, z: Z1 - 0.17, ry: Math.PI }, 4.4, 1.1);
  panneau(k, M.atlas, R.bar, { x: X2 + 0.17, y: 4.3, z: 11, ry: Math.PI / 2 }, 4.4, 1.1);
  // Le store de la terrasse, déchiré, et sa terrasse : tables, chaises, l'ardoise
  k.repere({ x: X2 + 1.2, y: 2.6, z: 9.5 }, () => {
    for (let i = 0; i < 6; i++) {
      if (hache(i, 9) < 0.35 * u) continue;
      k.boite(2.4, 0.03, 0.7, i % 2 ? 0x2f6f73 : 0xe9dfc6, { y: -0.4 + 0.0, z: -1.75 + i * 0.7, rz: -0.32 }, M.mat, { crasse: false });
    }
  });
  c.pave(X2, 0, Z1, X2 + 5.5, 0.04, Z2, 0xa49276, M.mat, { crasse: false, nuance: 0.02 });
  for (const [x, z, renv] of [[-78, 8.2, false], [-76.2, 11.5, true], [-78.2, 13.6, false]]) {
    c.repere({ x, y: 0, z }, () => {
      cylindre(c, M.metal, 0x5a5a56, 0, 0, 0, 0.04, 0.2, 0.72, 6);
      cylindre(c, M.lisse, 0xd8d4c8, 0, 0.72, 0, 0.36, 0.36, 0.04, 10);
    });
    chaise(c, M, x + 0.6, z + 0.2, -1.4, renv, 0x5a7a86);
    chaise(c, M, x - 0.6, z - 0.2, 1.6, hache(Math.round(x), Math.round(z)) < u * 0.6, 0x5a7a86);
  }
  c.repere({ x: -77.2, y: 0, z: 6.9, ry: 0.4 }, () => {
    for (const s of [-1, 1]) c.boite(0.05, 1.1, 0.05, 0x8a6a44, { x: s * 0.3, y: 0.55, rx: s * 0.2 }, M.mat);
    panneau(c, M.atlas, R.ardoise, { y: 0.85, z: 0.06, rx: -0.2 }, 0.75, 0.47);
  });
  // Dedans : le comptoir en zinc, l'étagère à bouteilles, les tables, la gondole de l'épicerie
  c.pave(-91.7, 0, 10.6, -86.4, 1.05, 11.2, 0x6a4a34, M.mat, { crasse: true });
  c.pave(-91.75, 1.05, 10.55, -86.35, 1.1, 11.25, 0xa8aca8, M.metal, { crasse: false });
  etagere(c, M, -89, 12.2, Math.PI, 4.6, 2.0, [0x3f6a3a, 0x8a3a30, 0xc9a050, 0x2f4f6a, 0xd8d2c4], 0.45);
  panneau(c, M.atlas, R.watty, { x: X1 + 0.17, y: 1.7, z: 8.6, ry: Math.PI / 2 }, 0.8, 1.0);
  for (let i = 0; i < 6; i++) cylindre(c, M.verre, i % 2 ? 0x3f6a3a : 0x8a5a30, -91.2 + i * 0.6, 1.1, 10.9, 0.04, 0.05, 0.3, 6);
  for (const [x, z] of [[-89.5, 8.3], [-86.2, 8.6]]) {
    table(c, M, x, z, 0.75, 0.75, 0.3, 0x8a6a44, 0.74);
    chaise(c, M, x + 0.55, z, -1.5, false, 0x8a6a44);
    chaise(c, M, x - 0.5, z + 0.2, 1.8, hache(Math.round(x), 4) < u, 0x8a6a44);
  }
  etagere(c, M, -82.6, 9.5, -Math.PI / 2, 3.2, 1.7, [0xc9a050, 0x7a8a96, 0x8a3a30, 0x3f6a3a, 0xd8d2c4], 0.4);
  etagere(c, M, -83.6, 12.2, Math.PI, 2.4, 1.6, [0xc9a050, 0x7a8a96, 0xd8d2c4], 0.35);
  bouee(c, M, { x: X1 + 0.12, y: 2.2, z: 11, ry: Math.PI / 2 }, 0xd06a3a);
  filet(c, M, -84.6, 7.4, 1.6, 1.2, 0x5a6a7a);
  // Les bougies dans des bocaux, sur le comptoir
  for (const [dx, dz] of [[0, 0], [0.25, 0.1]]) {
    cylindre(c, M.verre, 0xffe0a0, -88.6 + dx, 1.1, 11.0 + dz, 0.06, 0.06, 0.13, 6);
    cylindre(c, M.lisse, 0xf0e6c8, -88.6 + dx, 1.1, 11.0 + dz, 0.03, 0.03, 0.07, 5);
  }
  // La réserve : fûts, sacs de sel, caisses, congélateur « Glaces »
  for (let i = 0; i < 3; i++) tonneau(c, M, -91 + i * 0.75, 14.6, i === 2, 0x5a4a40);
  for (let i = 0; i < 4; i++) c.boite(0.7, 0.32, 0.45, 0xe0dcd0, { x: -87.6 + (i % 2) * 0.75, y: 0.16 + Math.floor(i / 2) * 0.3, z: 14.9 }, M.toile);
  caisse(c, M, -85.2, 14.7, 0.8, 0.6, 0.6, 0.2);
  c.boite(1.4, 0.9, 0.7, 0xe6e2da, { x: -82.4, y: 0.45, z: 14.8 }, M.lisse);
  debris(c, X1 + 0.3, Z1 + 0.3, X2 - 0.3, Z2 - 0.3, Math.round(12 * u), [0xd9d2c0, 0x6a8a5a, 0x8a5a30]);
}

/** Le quai de la rive ouest : bittes, grue, casiers, filets à sécher, barque retournée, escalier vers la vase, échelle de marée. */
function quaiOuest(ctx) {
  const { c, M, b, u } = ctx;
  for (const z of [19.6, 23, 29, 33.5]) bitte(c, M, -58.9, z, 0.03, z === 23);
  for (const x of [-56.5, -52.5]) bitte(c, M, x, 13.1, 0.03, x === -52.5);
  for (const z of [-15, -6, 8]) bitte(c, M, -50.9, z, 0.03);
  // La grue de quai, rouillée, sa flèche au-dessus de l'eau
  c.repere({ x: -54.4, y: 0, z: 10.4 }, () => {
    c.boite(1.6, 0.4, 1.6, C.rouille, { y: 0.2 }, M.tole);
    cylindre(c, M.tole, C.rouilleClaire, 0, 0.4, 0, 0.32, 0.4, 3.0, 8);
    c.boite(1.2, 1.0, 1.0, C.rouille, { y: 3.8 }, M.tole);
    planche(c, [0, 3.8, 0], [5.6, 7.6, 2.4], 0.3, 0.3, C.rouilleClaire, M.tole);
    planche(c, [5.6, 7.6, 2.4], [5.6, 2.6, 2.4], 0.025, 0.025, 0x3a3a38, M.metal);
    c.boite(0.3, 0.4, 0.15, 0x3a3a38, { x: 5.6, y: 2.4, z: 2.4 }, M.metal);
    fientes(c, M, -0.5, -0.5, 0.5, 0.5, 4.3, 5);
  });
  obstacleBoite(b, -54.4, 10.4, 1.6, 1.6, 0, "grue de quai");
  // Les casiers, caisses à poissons, filets
  for (let i = 0; i < 7; i++) casier(c, M, -66 + (i % 4) * 0.9, 26.2 + Math.floor(i / 4) * 0.7, (i % 3) * 0.2);
  for (let i = 0; i < 3; i++) casier(c, M, -65.5 + i * 0.85, 26.5, 0.1, 0.62);
  for (let i = 0; i < 6; i++) caisse(c, M, -62.5 + (i % 3) * 0.62, 28.4 + Math.floor(i / 3) * 0.45, 0.55, 0.28, 0.4, 0.1 * i, i % 2 ? 0x5a7a86 : 0x8a7a62, (i % 2) * 0.28);
  filetPendu(c, M, -72, 30.5, 3.2, 1.9, 0, 0x5f7a6a);
  filetPendu(c, M, -67.5, 31.6, 2.6, 1.8, 0.1, 0x8a6a4a);
  filet(c, M, -62, 22, 2.2, 1.6, 0x4a6a7a);
  glene(c, M, -60.6, 19.6, 0, 0.45);
  glene(c, M, -60.3, 24.6, 0, 0.35, 0x5a6a7a);
  barque(c, M, -70, 0.05, 20, 0.3, 0x6a8a7a, { retournee: true });
  obstacleBoite(b, -70, 20, 4.2, 1.5, 0.3, "barque retournée");
  barque(c, M, -74, 0.25, 25, 1.4, 0x8a5a40, { avirons: false });
  for (const s of [-1, 1]) c.boite(1.4, 0.25, 0.2, C.boisGris, { x: -74 + s * 1.2 * Math.sin(1.4), y: 0.12, z: 25 + s * 1.2 * Math.cos(1.4) * 0.2 }, M.mat);
  // Le tableau « Marées » sur le quai (l'échelle de marée elle-même est sur le mur, au tronçon « pylone »)
  panneau(c, M.atlas, R.marees, { x: -51.4, y: 1.2, z: 11.2, ry: Math.PI / 2 }, 0.75, 0.5);
  c.boite(0.08, 1.5, 0.08, 0x8a9294, { x: -51.45, y: 0.75, z: 11.6 }, M.metal);
  // Le vrac du quai : la ferraille au pied de la grue (barres, lames de ressort), les pierres du parapet éboulé
  ferraille(ctx, -52.8, 8.7);
  pierresEboulees(ctx, -63.6, 31.4, 0.4);
  // La manche à air du quai (elle claque au vent)
  c.boite(0.08, 5.2, 0.08, 0xd9d6cc, { x: -62, y: 2.6, z: 33.6 }, M.metal);
  const manche = new THREE.CylinderGeometry(0.28, 0.12, 1.6, 8, 1, true).rotateZ(Math.PI / 2).translate(0.85, 0, 0);
  etoffe(ctx, -62, 5.0, 33.6, manche, 0xc8705a, -0.4, 0.5);
  // (Le bord sud du quai : la ganivelle et les dunes, voir bordsDuBout.)
  fientes(c, M, -80, 6, -59, 34, 0.04, Math.round(30 + 30 * u));
  touffes(c, [[-79.4, 33.8], [-75, 34], [-62.6, 33.9], [-58.6, 21], [-58.7, 30]], C.oyatSec);
}

/**
 * L'échelle de marée émaillée, scellée sur le mur de quai (face à l'est) : des « E » noirs et rouges tous les
 * 50 cm, un chiffre à chaque mètre. Son zéro est 0,5 m sous la marée basse : à marée basse l'eau lit 0,5, à marée haute
 * 2,8 (le jeu lit la marée sur cette échelle).
 */
function echelleDeMaree(ctx, x, z) {
  const { c, M } = ctx;
  const L = 0.62;
  c.pave(x - 0.02, ZERO_ECHELLE - 0.12, z - L / 2 - 0.04, x + 0.03, -0.4, z + L / 2 + 0.04, 0x3a3c3c, M.metal, { crasse: false, nuance: 0 });
  c.pave(x + 0.03, ZERO_ECHELLE - 0.1, z - L / 2, x + 0.05, -0.42, z + L / 2, 0xeae6da, M.lisse, { crasse: false, nuance: 0 });
  for (let k = 0; k < 16; k++) {
    const yb = ZERO_ECHELLE + k * 0.5;
    const m = Math.floor(k / 2);
    const coul = m % 2 ? 0xb8352a : 0x1e1e1e;
    const cote = k % 2 ? 1 : -1;
    const zo = z + cote * (L / 2 - 0.035);
    c.pave(x + 0.05, yb, zo - 0.035, x + 0.065, yb + 0.5, zo + 0.035, coul, M.lisse, { crasse: false, nuance: 0 });
    for (const dy of [0, 0.2, 0.4]) {
      const za = zo;
      const zb2 = z + cote * 0.02;
      c.pave(x + 0.05, yb + dy, Math.min(za, zb2), x + 0.065, yb + dy + 0.1, Math.max(za, zb2), coul, M.lisse, { crasse: false, nuance: 0 });
    }
    if (k % 2 === 0) panneau(c, M.atlas, chiffre(m), { x: x + 0.066, y: yb + 0.27, z: z - cote * 0.15, ry: Math.PI / 2 }, 0.24, 0.33);
  }
  // Les coulures de rouille des scellements, la laisse verte qui mord le bas
  for (let k = 0; k < 4; k++) c.boite(0.012, 0.6 + k * 0.2, 0.03, C.rouilleClaire, { x: x + 0.068, y: -0.9 - k * 2.1, z: z + (k % 2 ? 0.27 : -0.27) }, M.mat, { crasse: false });
  c.pave(x + 0.04, ZERO_ECHELLE - 0.1, z - L / 2 - 0.02, x + 0.07, Y_EAU + 0.35, z + L / 2 + 0.02, C.algues, M.mat, { crasse: false, nuance: 0.05 });
}

/** Le tas de ferraille au pied de la grue de quai : barres, lames de ressort, une jante, un bout de chaîne. */
function ferraille(ctx, x, z) {
  const { c, M, b } = ctx;
  c.repere({ x, y: 0.03, z, ry: 0.3 }, () => {
    // Les barres d'acier, en vrac (rondes et carrées)
    for (let i = 0; i < 9; i++) {
      const l = 1.6 + hache(i, 301) * 1.4;
      const y = 0.04 + Math.floor(i / 3) * 0.07;
      c.boite(l, 0.05, 0.05, hache(i, 302) < 0.5 ? C.rouille : C.rouilleClaire, { x: (hache(i, 303) - 0.5) * 0.5, y, z: -0.35 + (i % 3) * 0.3 + hache(i, 304) * 0.1, ry: (hache(i, 305) - 0.5) * 0.5, rz: (hache(i, 306) - 0.5) * 0.12 }, M.metal, { crasse: false });
    }
    // Deux paquets de lames de ressort (camion), un peu cintrées
    for (const [px, pz, r] of [[0.3, 0.55, 0.4], [-0.5, 0.75, -0.2]]) {
      c.repere({ x: px, y: 0.18, z: pz, ry: r }, () => {
        for (let k = 0; k < 5; k++) {
          const l = 1.1 - k * 0.16;
          for (const s of [-1, 1]) c.boite(l / 2, 0.025, 0.08, 0x4a4440, { x: (s * l) / 4, y: k * 0.028 + 0.02, rz: s * 0.1 }, M.metal, { crasse: false, nuance: 0.05 });
        }
        c.boite(0.06, 0.18, 0.1, 0x3a3634, { y: 0.07 }, M.metal);
      });
    }
    // Une jante, un bout de chaîne, une tôle pliée
    cylindre(c, M.metal, 0x5a4a3c, -0.7, 0.0, -0.1, 0.32, 0.32, 0.18, 8, { rx: 0.25 });
    for (let k = 0; k < 7; k++) c.boite(0.09, 0.025, 0.05, 0x4a3a30, { x: 0.6 + k * 0.08, y: 0.02, z: -0.55 + Math.sin(k) * 0.08, ry: k % 2 ? 0.6 : -0.4 }, M.metal, { crasse: false });
    c.boite(0.9, 0.03, 0.6, C.rouille, { x: -0.15, y: 0.26, z: 0.1, rz: 0.35, ry: 0.4 }, M.tole);
  });
  obstacleBoite(b, x, z, 2.2, 1.6, 0.3, "tas de ferraille");
}

/** Les pierres du parapet de quai éboulé : blocs de granit tombés sur le quai, éclats. */
function pierresEboulees(ctx, x, z, ry) {
  const { c, M, b } = ctx;
  c.repere({ x, y: 0, z, ry }, () => {
    for (let i = 0; i < 9; i++) {
      const l = 0.5 + hache(i, 311) * 0.4;
      const h = 0.28 + hache(i, 312) * 0.15;
      const y = i < 6 ? h / 2 : 0.3 + h / 2;
      c.boite(l, h, 0.35 + hache(i, 313) * 0.15, hache(i, 314) < 0.5 ? C.quai : C.quaiSombre, { x: -0.9 + (i % 6) * 0.38 + (i >= 6 ? 0.2 : 0), y, z: (hache(i, 315) - 0.5) * 0.7, ry: (hache(i, 316) - 0.5) * 0.6, rz: (hache(i, 317) - 0.5) * 0.2 }, M.pierre, { nuance: 0.04 });
    }
    for (let i = 0; i < 8; i++) c.poser(CAILLOU, M.pierre, C.quai, { x: -1.2 + hache(i, 318) * 2.6, y: 0.05, z: -0.6 + hache(i, 319) * 1.2, rx: i, ry: i * 1.3, e: [0.14, 0.09, 0.12] }, { nuance: 0.05 });
  });
  obstacleBoite(b, x, z, 2.6, 1.1, ry, "pierres du parapet éboulé");
}

/** Les câbles de cuivre arrachés au pied du portique « connecté » : l'armoire technique ouverte, des couronnes de câble. */
function cablesCuivre(ctx, x, z) {
  const { c, M, b } = ctx;
  c.repere({ x, y: 0, z }, () => {
    c.boite(0.8, 1.3, 0.45, 0x9aa09e, { y: 0.65 }, M.satine);
    c.boite(0.76, 0.06, 0.4, 0x6a706e, { y: 1.33 }, M.satine);
    c.boite(0.04, 1.2, 0.74, 0x9aa09e, { x: 0.78, y: 0.66, z: 0.42, ry: 0.5 }, M.satine);
    c.boite(0.7, 1.1, 0.02, 0x2a2e30, { y: 0.66, z: 0.23 }, M.lisse);
    // Les câbles qui pendent de l'armoire, et les couronnes de cuivre roulées par terre
    for (let k = 0; k < 5; k++) planche(c, [-0.25 + k * 0.12, 0.9, 0.24], [-0.4 + k * 0.2, 0.05, 0.65 + hache(k, 321) * 0.3], 0.03, 0.03, k % 2 ? 0xb87333 : 0x2a2a2a, M.metal);
  });
  const anneau = new THREE.TorusGeometry(0.28, 0.06, 4, 10);
  for (const [dx, dz, e] of [[0.9, 0.7, 1], [0.3, 1.1, 0.8], [-0.6, 0.9, 1.1]]) {
    for (let k = 0; k < 2; k++) c.poser(anneau, M.metal, 0xb87333, { x: x + dx, y: 0.05 + k * 0.1, z: z + dz, rx: Math.PI / 2, e: [e * (1 - k * 0.15), e * (1 - k * 0.15), 1] }, { crasse: false, nuance: 0.05 });
  }
  anneau.dispose();
  obstacleBoite(b, x, z, 0.8, 0.45, 0, "armoire technique du portique");
}

/** Le carrelet : une cabane sur pilotis au bout d'un ponton, et son grand filet carré au-dessus de l'eau. */
function carrelet(ctx) {
  const { c, M, b, u } = ctx;
  const Z = -27;
  // Le ponton (planches à y = 0), ses pilotis jusqu'à la vase. (H-4) La cabane est close : ses fenêtres ont un appui
  // qui arrête (seuil de 0,8 m), on ne passe que par la porte.
  for (let x = -58; x < -54.4; x += 0.22) c.boite(0.2, 0.05, 1.2, hache(Math.round(x * 10), 7) < 0.1 ? 0x5a4a3a : C.boisGris, { x: x + 0.1, y: -0.02, z: Z }, M.mat, { nuance: 0.06 });
  for (const x of [-57, -55.2]) for (const s of [-1, 1]) c.boite(0.16, 8, 0.16, 0x4a3e32, { x, y: -4.05, z: Z + s * 0.55 }, M.mat);
  for (const s of [-1, 1]) c.boite(3.6, 0.05, 0.05, C.boisGris, { x: -56.2, y: 0.95, z: Z + s * 0.6 }, M.mat);
  b.obstacle(-58, Z - 0.6, -54.5, Z - 0.6, "ponton du carrelet");
  b.obstacle(-58, Z + 0.6, -54.5, Z + 0.6, "ponton du carrelet");
  // La cabane (plancher à y = 0), bardée de planches grises, toit de tôle
  const X1 = -54.5;
  const X2 = -51;
  const k = b.couche("cabane du carrelet", { x: (X1 + X2) / 2, z: Z, l: 4, p: 4 }, 1.05, 3.6);
  c.pave(X1, -0.08, Z - 1.7, X2, 0.0, Z + 1.7, C.boisGris, M.mat, { crasse: false });
  for (const [x, z] of [[X1 + 0.2, Z - 1.5], [X2 - 0.2, Z - 1.5], [X1 + 0.2, Z + 1.5], [X2 - 0.2, Z + 1.5]]) c.boite(0.2, 8, 0.2, 0x4a3e32, { x, y: -4.05, z }, M.mat);
  const bois = { couleur: C.boisGris, mat: M.mat };
  murDouble(ctx, k, [X1, Z - 1.7], [X1, Z + 1.7], { h: 2.4, ep: 0.1, bas: bois, seuil: 0.8, ouvertures: [{ u: 1.7, l: 1.55, bas: 0, haut: 2.0, type: "porte", vantail: "entrouvert", couleurPorte: 0x5d8a96, angle: 1.4 }] }); // la porte : 1,9 m entre les morceaux de mur (T4)
  murDouble(ctx, k, [X1, Z + 1.7], [X2, Z + 1.7], { h: 2.4, ep: 0.1, bas: bois, seuil: 0.8, ouvertures: [{ u: 1.75, l: 1.0, bas: 1.0, haut: 1.8, type: "vide" }] });
  murDouble(ctx, k, [X2, Z + 1.7], [X2, Z - 1.7], { h: 2.4, ep: 0.1, bas: bois, seuil: 0.8, ouvertures: [{ u: 1.7, l: 1.6, bas: 0.95, haut: 1.9, type: "vide" }] });
  murDouble(ctx, k, [X2, Z - 1.7], [X1, Z - 1.7], { h: 2.4, ep: 0.1, bas: bois, seuil: 0.8 });
  k.boite(4.2, 0.06, 4.0, C.tole, { x: (X1 + X2) / 2, y: 2.6, z: Z, rx: 0.12 }, M.tole, { crasse: false });
  fientes(k, M, X1, Z - 1.8, X2, Z + 1.8, 2.66, 10);
  // Le treuil et le banc dedans ; la grande flèche et son filet carré
  cylindre(c, M.mat, C.bois, -52, 0.5, Z - 1.0, 0.18, 0.18, 0.9, 8, { rx: Math.PI / 2, y: 0.8 });
  c.boite(1.6, 0.45, 0.4, C.boisGris, { x: -53.4, y: 0.23, z: Z - 1.3 }, M.mat);
  c.boite(0.3, 0.3, 0.3, 0x8a7a62, { x: -52.3, y: 0.15, z: Z + 1.2 }, M.mat);
  planche(c, [X2, 1.0, Z], [-43.5, 3.6, Z], 0.18, 0.18, C.bois, M.mat);
  planche(c, [-43.5, 3.6, Z], [-43.5, -2.4, Z], 0.02, 0.02, 0x3a3a38, M.metal);
  const yf = -2.6 + (u > 0.6 ? -0.8 : 0);
  c.repere({ x: -43.5, y: yf, z: Z, rz: 0.06 }, () => {
    for (const s of [-1, 1]) {
      c.poutre([-3, 0, s * 3], [3, 0, s * 3], 0.07, C.bois, M.mat);
      c.poutre([s * 3, 0, -3], [s * 3, 0, 3], 0.07, C.bois, M.mat);
      c.poutre([0, 0.1, 0], [s * 3, 0, s * 3], 0.05, C.bois, M.mat);
      c.poutre([0, 0.1, 0], [s * 3, 0, -s * 3], 0.05, C.bois, M.mat);
    }
    for (let i = -2; i <= 2; i++) {
      c.boite(6, 0.015, 0.015, 0x6f7d6a, { y: -0.25 + 0.2 * Math.cos((i / 3) * 1.5), z: i * 1.2 }, M.mat, { crasse: false });
      c.boite(0.015, 0.015, 6, 0x6f7d6a, { y: -0.25 + 0.2 * Math.cos((i / 3) * 1.5), x: i * 1.2 }, M.mat, { crasse: false });
    }
  });
  fientes(c, M, -50, Z - 0.1, -44, Z + 0.1, 3.3, 3);
}

/** Les maisons fermées du bourg (bord sud du lot), volets clos : elles bordent la halte. */
function maisonsDuBourg(ctx) {
  const { c, b, M, u } = ctx;
  const k = b.couche("maisons du bourg", { x: -90, z: 28.5, l: 21, p: 11 }, 1.05, 9);
  const maison = (X1, Z1, X2, Z2, H, couleur, volet, tuile) => {
    const enduit = { couleur, mat: M.enduit };
    for (const [a, bb] of [[[X1, Z1], [X2, Z1]], [[X2, Z1], [X2, Z2]], [[X2, Z2], [X1, Z2]], [[X1, Z2], [X1, Z1]]]) murDouble(ctx, k, a, bb, { h: H, bas: enduit });
    // Portes et fenêtres closes (planches et volets plaqués sur la façade nord, vers la route)
    const L = X2 - X1;
    c.boite(1.0, 2.1, 0.06, 0x5a4a3a, { x: X1 + L * 0.3, y: 1.05, z: Z1 - 0.18 }, M.mat);
    for (let i = 0; i < 4; i++) c.boite(1.1, 0.14, 0.04, C.boisGris, { x: X1 + L * 0.3, y: 0.5 + i * 0.45, z: Z1 - 0.23, rz: (hache(i, X1) - 0.5) * 0.3 }, M.mat);
    for (const [xx, yy] of [[X1 + L * 0.72, 1.6], [X1 + L * 0.3, 4.5], [X1 + L * 0.72, 4.5]]) {
      const ch = yy > 2 ? k : c;
      for (const s of [-1, 1]) ch.boite(0.55, 1.3, 0.05, volet, { x: xx + s * 0.29, y: yy, z: Z1 - 0.18 }, M.mat, { nuance: 0.06 });
    }
    for (const xx of [X1 + L * 0.3, X1 + L * 0.72]) for (const s of [-1, 1]) k.boite(0.55, 1.3, 0.05, volet, { x: xx + s * 0.29, y: 4.5, z: Z2 + 0.18 }, M.mat, { nuance: 0.06 });
    toitDeuxPans(k, (X1 + X2) / 2, (Z1 + Z2) / 2, X2 - X1, Z2 - Z1, H, 2.6, { couleur: tuile, mat: M.tuiles, debord: 0.4, trous: u > 0.75 ? [{ u: 1, v: -1, l: 2, p: 0.5 }] : [] });
    fientes(k, M, X1, Z1, X2, Z2, H + 1.4, 10);
  };
  maison(-99.6, 23.5, -90.4, 33.5, 6.0, 0xd8cdb2, C.volet, C.tuile);
  maison(-89.4, 24.5, -80.6, 33.5, 5.6, 0xe2dccb, C.voletVert, 0x8a5e4a);
  // Le muret du jardin entre les maisons et le bar
  mur(c, [-90.4, 23.6], [-89.4, 24.6], { h: 1.4, ep: 0.35, couleur: C.quai, mat: M.pierre, batiment: b });
  mur(c, [-92, 15.5], [-92, 23.5], { h: 1.4, ep: 0.35, couleur: C.quai, mat: M.pierre, batiment: b });
  b.obstacle(-100, 23.5, -99.6, 23.5, "maisons du bourg");
  b.obstacle(-80.6, 24.5, -80, 34.6, "maisons du bourg");
  c.pave(-92, 0, 15.5, -80, 0.04, 24.4, 0x8f9a6a, M.mat, { crasse: false, nuance: 0.03 });
  touffes(c, [[-91, 17], [-86, 20], [-83, 22.5], [-88, 23.5], [-81, 18]], PALETTE.herbeSeche);
  barque(c, M, -86, 0.3, 19.5, -0.2, 0x5a7a86, { rz: 0.15, avirons: false });
}

/** Les dunes du nord, leurs oyats, la ganivelle qui ferme la halte, l'épave d'un dériveur. */
function dunesNord(ctx, x1, x2) {
  const { c, M } = ctx;
  const ouest = x1 < 0;
  const A = aleatoire(ouest ? 501 : 502);
  for (let i = 0; i < 9; i++) {
    const x = x1 + 3 + A() * (x2 - x1 - 6);
    const z = -33 + A() * 9;
    if (!ouest && x < 76 && z > -28) continue;
    dune(c, M, x, z, 6 + A() * 8, 4 + A() * 5, 0.8 + A() * 1.2, 10);
  }
  semerOyats(c, M, x1 + 1, -34.5, x2 - 1, ouest ? -17 : -23.5, 70);
  if (!ouest) semerOyats(c, M, 73, -23.5, x2 - 1, -15, 30);
  c.pave(x1, -0.03, -35, x2, 0.01, -16, C.sableClair, M.sol, { crasse: false, nuance: 0 });
  ganivelle(ctx, x1, x2, -30.5);
  if (ouest) {
    barque(c, M, -84, 0.2, -24, 2.6, 0xd8d4c8, { rz: 0.4, avirons: false, l: 4.6, w: 1.7 });
    c.boite(0.1, 5, 0.1, 0xd8d4c8, { x: -83.4, y: 1.2, z: -22.6, rz: 1.2, rx: 0.3 }, M.lisse);
    c.boite(2.6, 0.02, 1.8, 0xd9d2c0, { x: -85.8, y: 0.15, z: -22.5, ry: 0.4, rz: 0.1 }, M.toile);
  }
}

// ---------- Le pylône barricadé (tronçon 2) ----------

function barricade(ctx) {
  const { c, M, b, u } = ctx;
  if (!ctx.ici(-37)) return;
  // La chicane : voiture + sacs de sable à l'ouest, avec la porte du péage (au sud) ; voiture + palettes à l'est
  // (passage au nord). La porte est un objet nommé dans ses deux états : « chicane_fermee » (visible) et
  // « chicane_ouverte » (cachée) ; les obstacles de la porte fermée sont à part (userData.obstaclesChicane).
  const G = GRILLE;
  voiture(c, M, -44.5, 0.07, -3.2, Math.PI / 2 + 0.06, 0x7d6a5a, { roues: 2, rouille: 0.9 });
  obstacleBoite(b, -44.5, -3.2, 4.2, 1.8, Math.PI / 2 + 0.06, "chicane : voiture en travers");
  sacs(c, M, -44.6, -1.1, -44.6, 1.6, 3);
  barbeles(c, M, -44.6, -1.0, -44.6, 1.5, 0.95);
  b.obstacle(-44.6, -1.15, -44.6, G.z1, "chicane : sacs de sable et barbelés");
  // Au sud de la porte : sacs, pneus et barbelés jusqu'au treillis
  sacs(c, M, -44.6, G.z2 + 0.1, -44.6, ZB - 0.05, 4);
  barbeles(c, M, -44.6, G.z2 + 0.15, -44.6, ZB - 0.1, 1.15);
  for (let i = 0; i < 3; i++) cylindre(c, M.mat, 0x262626, -46.25, i * 0.22, 5.1, 0.36, 0.36, 0.22, 8);
  b.obstacle(-44.6, G.z2, -44.6, ZB, "chicane : sacs de sable et barbelés");
  // Les deux poteaux de la porte (madriers), le panneau du péage et la baladeuse de chantier à batterie
  for (const zp of [G.z1, G.z2]) c.boite(0.14, zp === G.z1 ? 2.4 : 2.1, 0.14, C.boisGris, { x: G.x, y: zp === G.z1 ? 1.2 : 1.05, z: zp }, M.mat);
  c.boite(0.1, 0.1, G.z2 - G.z1 + 0.14, C.boisGris, { x: G.x, y: 2.15, z: (G.z1 + G.z2) / 2 }, M.mat);
  // Côté terrain, le panneau est planté dans les sacs, juste au-dessus de la caisse (« DANS LA CAISSE ↓ »)
  panneau(c, M.atlas, R.barricade, { x: G.x - 0.23, y: 1.6, z: CAISSE.z, ry: -Math.PI / 2 }, 1.2, 0.6);
  c.boite(1.3, 0.66, 0.03, C.boisGris, { x: G.x - 0.2, y: 1.6, z: CAISSE.z, ry: Math.PI / 2 }, M.mat);
  for (const s of [-1, 1]) c.boite(0.06, 1.95, 0.06, C.boisGris, { x: G.x - 0.16, y: 0.97, z: CAISSE.z + s * 0.5, rz: s * 0.03 }, M.mat);
  panneau(c, M.atlas, R.barricade, { x: G.x + 0.06, y: 2.6, z: (G.z1 + G.z2) / 2, ry: Math.PI / 2 }, 1.2, 0.6);
  c.boite(0.03, 0.66, 1.26, C.boisGris, { x: G.x + 0.03, y: 2.6, z: (G.z1 + G.z2) / 2 }, M.mat); // le dos du panneau (planches)
  for (const s of [-1, 1]) c.boite(0.06, 0.75, 0.06, C.boisGris, { x: G.x, y: 2.5, z: (G.z1 + G.z2) / 2 + s * 0.5 }, M.mat);
  c.boite(0.16, 0.2, 0.1, 0xd8b030, { x: G.x + 0.12, y: 2.0, z: G.z1 }, M.satine);
  c.boite(0.02, 0.12, 0.08, 0xfff0c0, { x: G.x + 0.21, y: 2.0, z: G.z1 }, M.lisse);
  b.lumiere(G.x + 0.3, 2.0, G.z1, 0xffc070, 3, 7, "baladeuse de chantier à batterie, au poteau de la porte du péage");
  // La porte fermée : un cadre de tubes et trois panneaux de tôle ondulée, des barbelés tressés dessus
  const porte = (k, ouverte) => {
    const L = G.z2 - G.z1 - 0.16;
    k.repere({ x: G.x, y: 0, z: G.z1 + 0.08, ry: ouverte ? ANGLE_PORTE : 0 }, () => {
      // (repère : la porte s'étend vers +z local, pivot sur le poteau nord)
      for (const zz of [0.02, L - 0.02]) k.boite(0.06, 1.9, 0.06, 0x5a5c58, { y: 1.0, z: zz }, M.tole);
      for (const yy of [0.12, 1.0, 1.92]) k.boite(0.06, 0.06, L, 0x5a5c58, { y: yy, z: L / 2 }, M.tole);
      k.poutre([0, 0.15, 0.05], [0, 1.9, L - 0.05], 0.05, 0x5a5c58, M.tole);
      for (let i = 0; i < 3; i++) {
        const t = [C.tole, 0x8a7a6a, C.rouilleClaire][i];
        k.boite(0.03, 1.75, L / 3 + 0.02, t, { x: 0.05, y: 1.0, z: (i + 0.5) * (L / 3), rx: (i - 1) * 0.015 }, M.tole, { nuance: 0.05 });
        for (let j = 0; j < 4; j++) k.boite(0.035, 1.75, 0.03, t, { x: 0.065, y: 1.0, z: (i + 0.15 + j * 0.23) * (L / 3) }, M.tole);
      }
      for (let i = 0; i < 6; i++) k.boite(0.02, 0.02, L / 5, 0x6a625a, { y: 2.0 + (i % 2) * 0.07, z: (i + 0.5) * (L / 6), rx: (i % 2 ? 0.5 : -0.5) }, M.tole, { crasse: false });
      // Le cadenas et la chaîne
      k.boite(0.08, 0.1, 0.04, 0x8a7a4a, { x: 0.1, y: 1.0, z: L - 0.08 }, M.tole);
    });
  };
  // La caisse du péage (H-1) : devant la porte, côté terrain, là où l'on arrive ; un coffre de bois cerclé, une fente
  // dans le couvercle, un cadenas, « PÉAGE » peint à la main, une chaîne jusqu'au poteau sud de la porte. On y dépose son
  // dû sous l'œil du poste de guet (objet nommé « caisse_peage »).
  const RYC = -Math.PI / 2 + 0.08; // la face (+z local) regarde l'ouest
  objetNomme(ctx, "caisse_peage", 3303, (k) => {
    k.repere({ x: CAISSE.x, y: 0.07, z: CAISSE.z, ry: RYC }, () => {
      k.boite(0.8, 0.5, 0.5, 0x6a5038, { y: 0.25 }, M.mat, { nuance: 0.05 });
      k.boite(0.84, 0.07, 0.54, 0x5a4430, { y: 0.53 }, M.mat);
      for (const s of [-0.3, 0.3]) k.boite(0.05, 0.52, 0.53, 0x2e2c2a, { x: s, y: 0.27 }, M.mat, { crasse: false });
      k.boite(0.3, 0.02, 0.04, 0x141414, { y: 0.575 }, M.mat, { crasse: false });
      // Le cadenas et « PÉAGE » peint à la main (des traits blancs), sur la face qui regarde l'ouest (on arrive par là)
      k.boite(0.08, 0.1, 0.04, 0xb89a4a, { y: 0.4, z: 0.27 }, M.mat, { crasse: false });
      for (let i = 0; i < 5; i++) k.boite(0.06, 0.12, 0.01, 0xe8e2d0, { x: -0.18 + i * 0.09, y: 0.27, z: 0.255 }, M.mat, { crasse: false });
    });
    // La chaîne, du flanc de la caisse au poteau sud de la porte
    const [ax, az, bx, bz] = [CAISSE.x + 0.1, CAISSE.z - 0.42, G.x - 0.06, G.z2 + 0.05];
    for (let i = 0; i < 9; i++) {
      const t = (i + 0.5) / 9;
      k.boite(0.09, 0.03, 0.05, 0x3a3836, { x: ax + (bx - ax) * t, y: 0.12 + t * 0.35 - Math.sin(t * Math.PI) * 0.08, z: az + (bz - az) * t, ry: -Math.atan2(bz - az, bx - ax) + (i % 2 ? 0.5 : -0.5) }, M.mat, { crasse: false });
    }
  });
  obstacleBoite(b, CAISSE.x, CAISSE.z, 0.84, 0.54, RYC, "caisse du péage");
  const fermee = objetNomme(ctx, "chicane_fermee", 3301, (k) => porte(k, false));
  const ouverte = objetNomme(ctx, "chicane_ouverte", 3302, (k) => porte(k, true));
  const obsFermee = [{ x1: G.x, z1: G.z1, x2: G.x, z2: G.z2, nature: "porte du péage fermée" }];
  fermee.userData.obstacles = obsFermee;
  ctx.obstaclesChicane.push(...obsFermee);
  // La porte ouverte se rabat contre la chicane, vers l'est : le passage garde 1,5 m entre elle et le poteau sud
  const Lp = G.z2 - G.z1 - 0.16;
  ouverte.userData.obstacles = [{ x1: G.x + 0.1, z1: G.z1 + 0.1, x2: arr(G.x + Math.sin(ANGLE_PORTE) * Lp), z2: arr(G.z1 + 0.08 + Math.cos(ANGLE_PORTE) * Lp), nature: "porte du péage ouverte, rabattue" }];
  ouverte.visible = false;
  voiture(c, M, -30.5, 0.07, 3.2, -Math.PI / 2 - 0.1, 0x5f6e7a, { roues: 3, rouille: 0.7, portes: true });
  obstacleBoite(b, -30.5, 3.2, 4.2, 1.8, -Math.PI / 2 - 0.1, "chicane : voiture en travers");
  for (let i = 0; i < 3; i++) palette(c, M, -30.6, -1.0 + i * 0.95, Math.PI / 2, true, 0.62);
  c.boite(0.04, 1.8, 2.8, C.tole, { x: -30.9, y: 0.9, z: -0.1, rx: 0.04 }, M.tole);
  barbeles(c, M, -30.7, -1.4, -30.7, 1.0, 1.4);
  b.obstacle(-30.7, -1.5, -30.7, 1.2, "chicane : palettes et tôles");
  sacs(c, M, -29.8, -5.3, -29.8, -4.5, 2);
  // Les pneus, les plots, les douilles de conserves vides (le péage des guetteurs)
  for (let i = 0; i < 3; i++) cylindre(c, M.mat, 0x262626, -42.6 + i * 0.1, i * 0.22, -1.6, 0.36, 0.36, 0.22, 8);
  for (let i = 0; i < 18; i++) cylindre(c, M.metal, 0xb8b4a8, -38.5 + hache(i, 1) * 3, 0.05, -2 + hache(i, 2) * 4, 0.04, 0.04, 0.1, 6, { rz: Math.PI / 2, ry: hache(i, 3) * 3 });
  debris(c, -46, -5.4, -28, 5.4, Math.round(16 * u), [C.betonSombre, 0x8a8478, C.rouille]);
  jonchee(c, -46, -5.4, -28, 5.4, Math.round(20 * u), [0xd9d2c0, 0x9c7a45, 0x7d6143]);
}

/** Le poste de guet des survivants, sur la plateforme sud de la pile ouest : cabane, vigie, brasero, drapeau. */
function posteDeGuet(ctx) {
  const { c, M, b, u } = ctx;
  if (!ctx.ici(-34)) return;
  // (H-3) La cabane est à 1,4 m du pied du pylône (elle en était à 0,6 m) : on passe entre les deux vers la réserve des
  // guetteurs, à l'ouest de la plateforme.
  const X1 = -35.05;
  const X2 = -32.75;
  const Z1 = 8.2;
  const Z2 = 10.3;
  const k = b.couche("poste de guet", { x: (X1 + X2) / 2, z: (Z1 + Z2) / 2, l: X2 - X1 + 0.6, p: Z2 - Z1 + 0.6 }, 1.1, 5.4);
  // Les poteaux, le bas en planches et tôles (une porte au nord), la vigie à 2,6 m
  for (const [x, z] of [[X1, Z1], [X2, Z1], [X1, Z2], [X2, Z2]]) {
    c.boite(0.14, 1.1, 0.14, C.bois, { x, y: 0.55, z }, M.mat);
    k.boite(0.14, 3.6, 0.14, C.bois, { x, y: 2.9, z }, M.mat);
  }
  const bois = { couleur: C.boisGris, mat: M.mat };
  const tole = { couleur: C.tole, mat: M.tole };
  // La porte, au nord-ouest (1,53 m : les colonnes de 0,383 m de 0,383 à 1,917 sont ouvertes)
  murDouble(ctx, k, [X1, Z1], [X2, Z1], { h: 2.5, ep: 0.06, coupe: 1.1, bas: bois, haut: tole, ouvertures: [{ u: 1.05, l: 1.5, bas: 0, haut: 2.0, type: "vide" }] });
  murDouble(ctx, k, [X2, Z1], [X2, Z2], { h: 2.5, ep: 0.06, coupe: 1.1, bas: tole, haut: bois });
  murDouble(ctx, k, [X2, Z2], [X1, Z2], { h: 2.5, ep: 0.06, coupe: 1.1, bas: bois, ouvertures: [{ u: 1.5, l: 1.0, bas: 1.2, haut: 1.9, type: "vide" }] });
  murDouble(ctx, k, [X1, Z2], [X1, Z1], { h: 2.5, ep: 0.06, coupe: 1.1, bas: tole });
  k.pave(X1 - 0.3, 2.5, Z1 - 0.3, X2 + 0.3, 2.62, Z2 + 0.3, C.boisGris, M.mat, { crasse: false });
  // La vigie : parapet de sacs, brasero, chaise, la bâche tendue au-dessus
  k.repere({ x: 0, y: 2.62, z: 0 }, () => {
    for (const [a1, a2, b1, b2] of [[X1 - 0.2, Z2 + 0.2, X2 + 0.2, Z2 + 0.2], [X2 + 0.2, Z1 - 0.2, X2 + 0.2, Z2 + 0.2], [X1 - 0.2, Z1 - 0.2, X1 - 0.2, Z2 + 0.2]]) sacs(k, M, a1, a2, b1, b2, 2);
  });
  cylindre(k, M.tole, 0x3a3634, -33.9, 2.62, 9.3, 0.38, 0.3, 0.5, 8);
  for (let i = 0; i < 4; i++) {
    const g = new THREE.ConeGeometry(0.12 + hache(i, 5) * 0.1, 0.5 + hache(i, 6) * 0.4, 5);
    k.poser(g, M.lueur, 0xff9a40, { x: -33.9 + (hache(i, 7) - 0.5) * 0.3, y: 3.35 + hache(i, 8) * 0.15, z: 9.3 + (hache(i, 9) - 0.5) * 0.3 }, { crasse: false, nuance: 0 });
    g.dispose();
  }
  chaise(k, M, -33.25, 8.75, 2.5);
  for (const [x, z, y] of [[X1 - 0.3, Z1 - 0.3, 4.4], [X2 + 0.3, Z1 - 0.3, 4.4], [X1 - 0.3, Z2 + 0.3, 3.9], [X2 + 0.3, Z2 + 0.3, 3.9]]) {
    k.boite(0.08, y - 2.62, 0.08, C.bois, { x, y: 2.62 + (y - 2.62) / 2, z }, M.mat);
  }
  k.boite(3.8, 0.04, 3.0, 0x5a6a4a, { x: (X1 + X2) / 2, y: 4.18, z: (Z1 + Z2) / 2, rx: 0.17 }, M.toile, { crasse: false });
  // L'échelle de la vigie (côté nord) ; le mât et le drapeau de chiffon
  for (const s of [-1, 1]) planche(c, [-32.98 + s * 0.22, 0, 7.9], [-32.98 + s * 0.22, 2.7, 8.15], 0.07, 0.07, C.bois, M.mat);
  for (let i = 1; i < 8; i++) c.boite(0.44, 0.04, 0.04, C.bois, { x: -32.98, y: i * 0.34, z: 7.9 + i * 0.03 }, M.mat);
  k.boite(0.07, 3.0, 0.07, C.boisGris, { x: X2 + 0.3, y: 5.9, z: Z1 - 0.3 }, M.mat);
  const drap = new THREE.PlaneGeometry(1.2, 0.7, 3, 1).translate(0.6, -0.35, 0);
  etoffe(ctx, X2 + 0.3, 7.35, Z1 - 0.3, drap, 0xb06a40, 0.3, 0.45);
  // Dedans : le matelas et sa couverture polaire (rose fluo, synthétique), la réserve de conserves (le péage)
  c.boite(1.8, 0.15, 0.8, 0x7a6a5a, { x: -33.85, y: 0.08, z: 9.8 }, M.toile);
  c.boite(1.3, 0.05, 0.86, 0xe0508a, { x: -33.55, y: 0.18, z: 9.8, ry: 0.08 }, M.toile, { crasse: false });
  c.boite(0.5, 0.12, 0.7, 0x38b8c8, { x: -34.45, y: 0.2, z: 9.75, ry: -0.2 }, M.toile, { crasse: false });
  for (let i = 0; i < 12; i++) cylindre(c, M.metal, i % 3 ? 0xb8b4a8 : 0xc8a050, -34.85 + (i % 4) * 0.13, 0.02 + Math.floor(i / 4) * 0.12, 8.5, 0.05, 0.05, 0.11, 6);
  b.obstacle(X1, Z1, X1 + 0.38, Z1, "cabane du poste de guet");
  b.obstacle(X1 + 1.92, Z1, X2, Z1, "cabane du poste de guet");
  b.obstacle(X2, Z1, X2, Z2, "cabane du poste de guet");
  b.obstacle(X1, Z1, X1, Z2, "cabane du poste de guet");
  // La réserve à l'ouest de la plateforme : fûts d'eau, caisses sous une bâche
  for (let i = 0; i < 3; i++) tonneau(c, M, -41.6 + i * 0.75, 9.6, false, 0x3f6a7a);
  caisse(c, M, -40.2, 8.6, 1.0, 0.7, 0.7, 0.1);
  caisse(c, M, -40.4, 8.65, 0.8, 0.5, 0.6, -0.2, 0x8a7a62, 0.7);
  c.boite(1.6, 0.04, 1.4, 0x4a5a3a, { x: -40.2, y: 1.25, z: 8.7, rz: 0.1 }, M.toile);
  sacs(c, M, -42.3, 6.4, -42.3, 8.0, 2);
  b.lumiere(-33.9, 3.4, 9.3, 0xff8a3d, 12, 16, "feu de brasero du poste de guet, sur la pile du pylône");
  void u;
}

/** Les voitures restées sur le tablier ouest. */
function voituresOuest(ctx) {
  const { c, M, b } = ctx;
  if (ctx.ici(-19)) {
    voiture(c, M, -19, 0.07, 1.9, 0.15, 0x5a4a40, { brulee: true, roues: 2 });
    obstacleBoite(b, -19, 1.9, 4.2, 1.8, 0.15, "voiture brûlée");
    gravats(c, -16.8, 2.6, 0.6, 5, [0x2a2622, 0x4a3c34, C.rouille], 0.05);
  }
  if (ctx.ici(-10.5)) {
    voiture(c, M, -10.5, 0.07, -2.6, -0.25, 0x8a9a7a, { portes: true, coffre: true, rouille: 0.6 });
    obstacleBoite(b, -10.5, -2.6, 4.2, 1.8, -0.25, "voiture abandonnée");
    caisse(c, M, -12.8, -1.0, 0.8, 0.5, 0.35, 0.6, 0x3a5a7a);
    caisse(c, M, -13.4, -0.2, 0.6, 0.4, 0.3, 1.4, 0x8a3a30);
    jonchee(c, -14, -2, -11, 0.5, 12, [0xd9d2c0, 0x5a7a86, 0xc9a050]);
  }
}

// ---------- La brèche (tronçon 3) ----------

function breche(ctx) {
  const { c, M, b } = ctx;
  if (ctx.ici(22)) {
    voiture(c, M, 22, 0.07, -2.4, 0.12, 0x6a7a8a, { rouille: 0.7, portes: true });
    obstacleBoite(b, 22, -2.4, 4.2, 1.8, 0.12, "voiture de la voie nord");
  }
  if (ctx.ici(30.5)) {
    camionnette(c, M, 30.5, 0.07, 2.6, Math.PI + 0.12);
    obstacleBoite(b, 30.5, 2.6, 5.2, 2.0, Math.PI + 0.12, "camionnette de livraison");
    for (let i = 0; i < 9; i++) caisse(c, M, 25.5 + hache(i, 1) * 3, 1 + hache(i, 2) * 3.8, 0.3 + hache(i, 3) * 0.3, 0.25 + hache(i, 4) * 0.2, 0.3 + hache(i, 5) * 0.2, hache(i, 6) * 3, 0xc9a878);
    // Le colis tombé du drone, éventré : une bouilloire connectée, des chaussettes
    panneau(c, M.atlas, R.drone, { x: 27.2, y: 0.12, z: 4.4, rx: -Math.PI / 2, rz: 0.4 }, 0.5, 0.5);
    cylindre(c, M.lisse, 0xe6e2da, 27.6, 0.07, 4.1, 0.1, 0.12, 0.24, 8);
    for (let i = 0; i < 3; i++) c.boite(0.25, 0.02, 0.1, [0xc8362b, 0x2f6f73, 0xc79a3b][i], { x: 26.8 + i * 0.2, y: 0.08, z: 4.7 + i * 0.1, ry: i }, M.toile);
  }
  if (ctx.ici(27.5)) drone(ctx);
  if (ctx.ici(25)) debris(c, 16, -5.4, 36, 5.4, 14, [C.betonSombre, 0x8a8478, C.rouille]);
}

/** Le drone livreur pris dans les suspentes sud, son voyant qui clignote. */
function drone(ctx) {
  const { c, M, b } = ctx;
  const x = 27.6;
  const y = 6.4;
  const z = 6.15;
  c.repere({ x, y, z, rz: 0.5, rx: -0.3 }, () => {
    c.boite(0.5, 0.14, 0.5, 0xe6e2da, {}, M.satine);
    for (const [a, bb] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      planche(c, [0, 0, 0], [a * 0.45, 0.02, bb * 0.45], 0.04, 0.04, 0x2a2a2a, M.metal);
      cylindre(c, M.lisse, 0x3a3a3a, a * 0.45, 0.04, bb * 0.45, 0.2, 0.2, 0.015, 8);
    }
    c.boite(0.16, 0.08, 0.16, 0x1a1a1a, { y: -0.1 }, M.lisse);
  });
  // Le colis qui pend encore à sa ficelle, la ficelle emmêlée à la suspente
  planche(c, [x, y - 0.1, z], [x + 0.1, y - 1.3, z + 0.05], 0.012, 0.012, 0xb8a27a, M.mat);
  c.boite(0.4, 0.3, 0.32, 0xc9a878, { x: x + 0.1, y: y - 1.45, z: z + 0.05, ry: 0.3 }, M.mat);
  panneau(c, M.atlas, R.drone, { x: x + 0.12, y: y - 1.45, z: z + 0.22, ry: 0.3 }, 0.3, 0.28);
  for (let i = 0; i < 4; i++) planche(c, [27.5, y + 0.6 - i * 0.3, 6.3], [x + (hache(i, 1) - 0.5) * 0.5, y + (hache(i, 2) - 0.5) * 0.3, z + 0.1], 0.012, 0.012, 0xb8a27a, M.mat);
  // Le voyant rouge : un maillage à part, qui clignote
  const mat = new THREE.MeshBasicMaterial({ color: 0xff3a22 });
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.09), mat);
  led.position.set(x + 0.12, y - 0.04, z + 0.2);
  led.userData.mobile = true;
  led.userData.animer = (t) => mat.color.setHex(t % 1.6 < 0.2 ? 0xff3a22 : 0x3a0d0a);
  b.ajouter(led);
  b.lumiere(x, y - 0.2, z + 0.4, 0xff4030, 1.2, 4, "voyant du drone livreur pris dans les câbles (« Livré en 7 min »)");
}

// ---------- La rive des marins (tronçon 4) ----------

function marins(ctx) {
  const { c, M, b, u } = ctx;
  if (!ctx.ici(75)) return;
  // Les sols : quai pavé autour de la cale, terre-plein, parvis de la chapelle
  c.pave(50.3, -0.04, ZTR, 58.3, 0.03, 13.7, C.paves, M.paves, { crasse: false, nuance: 0 });
  c.pave(58.3, -0.04, ZTR, 100, 0.03, FORME.z1 - 0.45, C.paves, M.paves, { crasse: false, nuance: 0 });
  c.pave(FORME.x2, -0.04, FORME.z1, 100, 0.03, 35, C.paves, M.paves, { crasse: false, nuance: 0 });
  c.pave(58.3, -0.04, FORME.z2, FORME.x2, 0.03, 35, C.paves, M.paves, { crasse: false, nuance: 0 });
  c.pave(60, -0.04, -9.4, 76, 0.03, -ZTR, C.paves, M.paves, { crasse: false, nuance: 0 });
  portiqueConnecte(ctx, 61.6, R.finConnecte);
  panneauSortie(ctx, "est", R.sortieEst, 95, 6.6);
  bordsDuBout(ctx, 1);
  reverbere(ctx, 70, 5.9, -0.05);
  reverbere(ctx, 90, -5.9, 0.04);
  for (const z of [-15, -6, 8]) bitte(c, M, 50.9, z, 0.03, z === 8);
  for (const x of [52.5, 56.5]) bitte(c, M, x, 13.1, 0.03);
  for (const z of [30, 33.5]) bitte(c, M, 58.9, z, 0.03);
  pierresEboulees(ctx, 61.5, 31.4, -0.3);
  chapelle(ctx);
  cale(ctx);
  peniche(ctx);
  hangar(ctx);
  dunesNord(ctx, 58, 100);
  // Le calvaire des marins : croix de fer sur un socle, une ancre au pied
  c.repere({ x: 77.5, y: 0, z: -11.5 }, () => {
    c.boite(1.4, 0.5, 1.4, C.quai, { y: 0.25 }, M.pierre);
    c.boite(0.9, 0.6, 0.9, C.quai, { y: 0.8 }, M.pierre);
    c.boite(0.14, 3.2, 0.14, 0x3a3c3c, { y: 2.7 }, M.metal);
    c.boite(1.2, 0.12, 0.12, 0x3a3c3c, { y: 3.6 }, M.metal);
    c.boite(0.1, 1.2, 0.1, 0x4a3a30, { x: 0.9, y: 0.6, rz: 0.35 }, M.metal);
    c.boite(0.9, 0.1, 0.1, 0x4a3a30, { x: 0.7, y: 1.0, rz: 0.35 }, M.metal);
    fientes(c, M, -0.45, -0.45, 0.45, 0.45, 1.1, 4);
  });
  obstacleBoite(b, 77.5, -11.5, 1.4, 1.4, 0, "calvaire des marins");
  // La bouée connectée du quai (l'Abondance), rouillée sur son poteau
  c.boite(0.1, 1.6, 0.1, 0x8a9294, { x: 62, y: 0.8, z: 9.5 }, M.metal);
  bouee(c, M, { x: 62, y: 1.3, z: 9.6 }, 0xd8a040);
  panneau(c, M.atlas, R.bouee, { x: 62, y: 1.85, z: 9.58 }, 0.6, 0.3);
  // Le quai : casiers, filets, une barque sur sa remorque
  for (let i = 0; i < 5; i++) casier(c, M, 60 + i * 0.9, 16.6, i * 0.2);
  filet(c, M, 66, 15.8, 2.4, 1.6, 0x8a6a4a);
  barque(c, M, 88, 0.55, 9.5, 0.1, 0xc8b89a, { avirons: false });
  for (const s of [-1, 1]) cylindre(c, M.mat, 0x262626, 88 + s * 0.1, 0.3, 9.5 + s * 0.85, 0.3, 0.3, 0.18, 8, { rx: Math.PI / 2, y: 0.3 });
  c.boite(3.6, 0.1, 0.1, 0x6a6c6a, { x: 88, y: 0.35, z: 9.5 }, M.metal);
  obstacleBoite(b, 88, 9.5, 4.2, 1.7, 0.1, "barque sur sa remorque");
  // (Le bord sud : la ganivelle et les dunes, voir bordsDuBout.)
  fientes(c, M, 51, 6, 99, 34, 0.04, Math.round(30 + 30 * u));
  // Les lumières de la rive est
  b.lumiere(67, 1.25, -20.3, 0xffc070, 3, 7, "bougie sur l'autel de la chapelle des marins");
  b.lumiere(70, 2.75, 23, 0xcfe8ff, 1.6, 6, "lampe solaire de jardin sur le toit de la péniche : elle se recharge encore");
}

/** La chapelle des marins : nef de pierre, clocheton, maquettes de bateaux ex-voto suspendues, bougie. */
function chapelle(ctx) {
  const { c, b, M, u } = ctx;
  const X1 = 63;
  const X2 = 71;
  const Z1 = -22;
  const Z2 = -9.6;
  const H = 4.2;
  const k = b.couche("chapelle des marins", { x: 67, z: (Z1 + Z2) / 2, l: X2 - X1 + 0.8, p: Z2 - Z1 + 1.6 }, 1.05, 11);
  const pierre = { couleur: 0xc2b9a4, mat: M.pierre };
  const int = { couleur: 0xe2dccb, mat: M.mat };
  const lancette = (uu) => ({ u: uu, l: 0.7, bas: 1.4, haut: 3.4, type: "fenetre", bris: 0.3 + 0.6 * u, croisillons: 0, traverses: 3, cadre: 0x8a8274 });
  murDouble(ctx, k, [X1, Z2], [X2, Z2], { h: H, ep: 0.6, bas: pierre, interieur: int, ouvertures: [{ u: 4, l: 1.5, bas: 0, haut: 2.9, type: "porte", vantail: "entrouvert", couleurPorte: 0x2f4f6a, angle: 0.9 }] });
  murDouble(ctx, k, [X2, Z2], [X2, Z1], { h: H, ep: 0.6, bas: pierre, interieur: int, ouvertures: [lancette(3), lancette(6.2), lancette(9.4)] });
  murDouble(ctx, k, [X2, Z1], [X1, Z1], { h: H, ep: 0.6, bas: pierre, interieur: int });
  murDouble(ctx, k, [X1, Z1], [X1, Z2], { h: H, ep: 0.6, bas: pierre, interieur: int, ouvertures: [lancette(3), lancette(6.2), lancette(9.4)] });
  c.pave(X1 + 0.3, 0, Z1 + 0.3, X2 - 0.3, 0.03, Z2 - 0.3, 0xa8a090, M.pierre, { crasse: false });
  // Le pignon de façade, l'oculus, le clocheton ; la plaque
  const pignon = (z) => {
    const s = new THREE.Shape();
    s.moveTo(-4.3, 0);
    s.lineTo(4.3, 0);
    s.lineTo(0, 3.2);
    s.lineTo(-4.3, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.6, bevelEnabled: false });
    k.poser(g, M.pierre, 0xc2b9a4, { x: 67, y: H, z: z - 0.3 }, { crasse: false, nuance: 0.02 });
    g.dispose();
  };
  pignon(Z2);
  pignon(Z1);
  cylindre(k, M.pierre, 0xa8a090, 67, H + 1.2, Z2 + 0.32, 0.55, 0.55, 0.08, 12, { rx: Math.PI / 2 });
  cylindre(k, M.verre, 0x3a5560, 67, H + 1.2, Z2 + 0.37, 0.45, 0.45, 0.04, 12, { rx: Math.PI / 2 });
  k.repere({ x: 67, y: H + 3.0, z: Z2 }, () => {
    for (const s of [-1, 1]) k.boite(0.35, 1.6, 0.55, 0xc2b9a4, { x: s * 0.55, y: 0.8 }, M.pierre);
    k.boite(1.5, 0.3, 0.6, 0xc2b9a4, { y: 1.75 }, M.pierre);
    k.boite(1.1, 0.12, 0.7, 0x5f5a54, { y: 1.95 }, M.mat);
    // Le clocheton est vide : la cloche est partie, il reste le joug
    k.boite(0.9, 0.08, 0.08, 0x4a3a30, { y: 1.42 }, M.metal);
    k.boite(0.06, 0.7, 0.06, 0x3a3c3c, { y: 2.35 }, M.metal);
    // La girouette en forme de bateau
    k.boite(0.5, 0.12, 0.03, 0x3a3c3c, { y: 2.65 }, M.metal);
    fientes(k, M, -0.75, -0.3, 0.75, 0.3, 1.91, 6);
  });
  panneau(c, M.atlas, R.chapelle, { x: 67, y: 3.3, z: Z2 + 0.31 }, 3.6, 0.45);
  toitDeuxPans(k, 67, (Z1 + Z2) / 2, Z2 - Z1, X2 - X1, H, 3.2, { ry: Math.PI / 2, couleur: 0x5c6068, debord: 0.5, trous: u > 0.45 ? [{ u: 1.5, v: 1, l: 2.4, p: 0.6 }] : [] });
  fientes(k, M, X1, Z1, X2, Z2, H + 2.1, 12);
  if (u > 0.45) raiDeLumiere(c, [65.6, 6.2, -14.5], [65.8, 0.05, -14.6], 1.3);
  // Le porche : un auvent sur deux colonnettes
  k.pave(65.6, 3.0, Z2, 68.4, 3.15, Z2 + 1.4, 0x5c6068, M.tole, { crasse: false });
  for (const s of [-1, 1]) c.boite(0.16, 3.0, 0.16, 0xc2b9a4, { x: 67 + s * 1.25, y: 1.5, z: Z2 + 1.25 }, M.pierre);
  // Les entraits (visibles en coupe) et les maquettes de bateaux qui y pendent
  for (const z of [-19, -15.8, -12.6]) c.pave(X1 + 0.3, 4.0, z - 0.12, X2 - 0.3, 4.22, z + 0.12, C.bois, M.mat, { crasse: false });
  for (const [x, z, ry, coul] of [[65.6, -19, 0.2, 0x2f4f6a], [68.4, -15.8, -0.3, 0x7a3a2c], [66.4, -12.6, 0.1, 0x3f5a54]]) {
    c.boite(0.02, 0.6, 0.02, 0xb8a27a, { x, y: 3.7, z }, M.mat);
    barque(c, M, x, 3.12, z, ry, coul, { l: 1.1, w: 0.32, h: 0.18, avirons: false });
    c.boite(0.03, 0.9, 0.03, C.bois, { x, y: 3.7, z }, M.mat);
    c.boite(0.02, 0.55, 0.4, 0xe0d6bc, { x: x + 0.05, y: 3.75, z: z + 0.05, ry }, M.toile, { crasse: false });
  }
  // Les bancs, l'autel, Notre-Dame des Flots, les ex-voto peints et les plaques de marbre
  for (let i = 0; i < 4; i++) {
    for (const s of [-1, 1]) {
      const z = -12 - i * 1.4;
      const renv = hache(i * 2 + s, 81) < 0.3 * u;
      c.repere({ x: 67 + s * 1.85, y: 0, z, ry: renv ? 0.45 : 0 }, () => {
        c.boite(2.3, 0.06, 0.36, C.bois, { y: 0.45 }, M.mat);
        c.boite(2.3, 0.45, 0.05, C.bois, { y: 0.75, z: 0.18 }, M.mat);
        for (const t of [-1, 1]) c.boite(0.06, 0.45, 0.36, C.bois, { x: t * 1.05, y: 0.22 }, M.mat);
      });
    }
  }
  c.boite(2.0, 1.0, 0.8, 0xd8d0be, { x: 67, y: 0.5, z: -20.6 }, M.pierre);
  c.boite(2.1, 0.02, 0.85, 0xe8e4d8, { x: 67, y: 1.01, z: -20.6 }, M.toile, { crasse: false });
  for (let i = 0; i < 5; i++) cylindre(c, M.lisse, 0xe8e0c8, 66.3 + i * 0.35, 1.02, -20.5, 0.03, 0.03, 0.12 + (i % 3) * 0.06, 5);
  cylindre(c, M.lisse, 0xe0dcd2, 67, 0, -21.35, 0.2, 0.25, 1.2, 8);
  cylindre(c, M.lisse, 0xe0dcd2, 67, 1.2, -21.35, 0.12, 0.18, 0.8, 8);
  c.poser(BOULE, M.lisse, 0xe0dcd2, { x: 67, y: 2.15, z: -21.35, e: 0.16 }, { crasse: false });
  c.boite(0.5, 0.06, 0.04, 0x2f4f6a, { x: 67, y: 1.75, z: -21.15 }, M.lisse);
  panneau(c, M.atlas, R.exvoto1, { x: X1 + 0.31, y: 2.0, z: -14.2, ry: Math.PI / 2 }, 1.0, 0.5);
  panneau(c, M.atlas, R.exvoto2, { x: X1 + 0.31, y: 2.0, z: -17.6, ry: Math.PI / 2 }, 0.9, 0.45);
  panneau(c, M.atlas, R.exvoto1, { x: X2 - 0.31, y: 2.1, z: -16, ry: -Math.PI / 2 }, 0.9, 0.45);
  for (let i = 0; i < 8; i++) c.boite(0.02, 0.22, 0.34, 0xece8de, { x: X1 + 0.31, y: 1.3 + (i % 2) * 0.3, z: -19.6 + Math.floor(i / 2) * 0.45 }, M.lisse);
  for (let i = 0; i < 3; i++) bouee(c, M, { x: X2 - 0.36, y: 1.4, z: -12.8 - i * 1.0, ry: Math.PI / 2, e: 0.6 }, 0xd8d4c8);
  debris(c, X1 + 0.6, Z1 + 0.6, X2 - 0.6, Z2 - 0.6, Math.round(10 * u));
  touffes(c, [[X1 - 0.4, -12], [X1 - 0.5, -18], [X2 + 0.4, -20]], C.oyatSec);
}

/** La cale de halage : la forme où la péniche est échouée, la rampe vers l'eau, les rails, le treuil. */
function cale(ctx) {
  const { c, M, b } = ctx;
  const { x1, x2, z1, z2, y } = FORME;
  // Les murs de la forme et sa tête ; le fond plat
  c.pave(58, Y_FOND - 0.4, z1, x2, 0.14, z1 + 0.45, C.quai, M.pierre, { crasse: false });
  c.pave(58, Y_FOND - 0.4, z2 - 0.45, x2, 0.14, z2, C.quai, M.pierre, { crasse: false });
  c.pave(x2 - 0.45, y - 0.3, z1, x2, 0.14, z2, C.quai, M.pierre, { crasse: false });
  c.pave(x1, y - 0.3, z1 + 0.45, x2 - 0.45, y, z2 - 0.45, C.quaiSombre, M.pierre, { crasse: false });
  // La rampe qui descend vers l'eau, ses rails, ses murets
  const yR = (x) => y + ((x - x1) / (50.5 - x1)) * (-8.8 - y);
  planche(c, [x1, y - 0.25, 23], [50.5, -8.8 - 0.25, 23], z2 - z1 - 0.9, 0.5, C.quaiSombre, M.pierre, [0, 0, 1]);
  for (const zr of [22, 24]) planche(c, [x2 - 0.5, y + 0.06, zr], [x1, y + 0.06, zr], 0.1, 0.08, 0x5a4a3c, M.metal, [0, 1, 0]);
  for (const zr of [22, 24]) planche(c, [x1, y + 0.06, zr], [50.6, -8.8 + 0.06, zr], 0.1, 0.08, 0x5a4a3c, M.metal, [0, 0, 1]);
  for (const zm of [z1 + 0.25, z2 - 0.25]) planche(c, [58, yR(58) + 0.4, zm], [50.5, -8.8 + 0.4, zm], 1.4, 0.5, C.quai, M.pierre, [0, 1, 0]);
  c.boite(4, 0.5, 6, C.algues, { x: 52, y: -8.2, z: 23, rz: 0.48 }, M.mat, { crasse: false });
  // Les obstacles : les bords de la forme (sauf la passerelle de la péniche)
  b.obstacle(58, z1, PENICHE.x1 + 0.2, z1, "bord de la cale");
  b.obstacle(PASSERELLE.x2, z1, x2, z1, "bord de la cale");
  b.obstacle(58, z2, x2, z2, "bord de la cale");
  b.obstacle(x2, z1, x2, z2, "tête de la cale");
  // (H-4) Les deux côtés de la passerelle : la forme, 1,3 m plus bas, qui s'ouvre sur l'eau par la rampe
  for (const xp of [PASSERELLE.x1, PASSERELLE.x2]) b.obstacle(xp, z1, xp, PENICHE.z1, "bord de la passerelle : la forme, en contrebas");
  // Le treuil de halage, son câble jusqu'à l'étrave
  c.repere({ x: 79.6, y: 0, z: 23 }, () => {
    for (const s of [-1, 1]) c.boite(0.2, 1.2, 0.2, 0x3a3c3c, { y: 0.6, z: s * 0.7 }, M.tole);
    cylindre(c, M.tole, C.rouille, 0, 0.9, 0, 0.3, 0.3, 1.3, 8, { rx: Math.PI / 2, y: 0.9 });
    c.boite(0.05, 0.5, 0.05, 0x3a3c3c, { x: 0.3, y: 0.8, z: 0.85, rz: 0.6 }, M.metal);
    c.boite(1.4, 0.2, 1.8, 0x5a5a56, { y: 0.1 }, M.beton);
  });
  planche(c, [79.3, 0.9, 23], [77.4, 0.6, 23], 0.03, 0.03, 0x3a3a38, M.metal);
  obstacleBoite(b, 79.6, 23, 1.4, 1.8, 0, "treuil de la cale");
  // La passerelle (planches à plat) du quai à la péniche
  // (T4) 1,35 m : cinq planches, et de chaque côté un garde-corps de deux poteaux et une lisse
  const lp = PASSERELLE.x2 - PASSERELLE.x1;
  for (let k = 0; k < 5; k++) c.boite(lp / 5 - 0.02, 0.05, 1.8, C.boisGris, { x: PASSERELLE.x1 + (k + 0.5) * (lp / 5), y: 0.03, z: z1 + 0.75 }, M.mat, { nuance: 0.06 });
  for (const xp of [PASSERELLE.x1, PASSERELLE.x2]) {
    for (const zp of [z1 + 0.2, PENICHE.z1 - 0.1]) c.boite(0.04, 0.9, 0.04, C.bois, { x: xp, y: 0.45, z: zp }, M.mat);
    c.boite(0.04, 0.04, PENICHE.z1 - z1 - 0.2, C.bois, { x: xp, y: 0.9, z: (z1 + 0.2 + PENICHE.z1 - 0.1) / 2 }, M.mat);
  }
}

/** La péniche de plaisance « Ma Liberté », échouée dans la forme : on la visite (plancher à y = 0). */
function peniche(ctx) {
  const { c, M, b, u } = ctx;
  const { x1: X1, x2: X2, z1: Z1, z2: Z2 } = PENICHE;
  const yb = FORME.y; // le bas de la coque repose sur le fond de la forme
  const k = b.couche("péniche", { x: (X1 + X2) / 2, z: (Z1 + Z2) / 2, l: X2 - X1 + 1.6, p: Z2 - Z1 + 0.6 }, 1.0, 3.6);
  // La coque : fond, bordés (antifouling rouge, coque vert sombre, liston blanc), tableau, étrave pointue
  c.pave(X1, yb, Z1, X2 - 1.4, yb + 0.2, Z2, C.antifouling, M.tole, { crasse: false });
  for (const [z1, z2] of [[Z1, Z1 + 0.25], [Z2 - 0.25, Z2]]) {
    const nord = z1 === Z1;
    const tranches = nord ? [[X1, PASSERELLE.x1], [PASSERELLE.x2, X2 - 1.4]] : [[X1, X2 - 1.4]];
    c.pave(X1, yb, z1, X2 - 1.4, -0.6, z2, C.antifouling, M.tole, { crasse: false });
    for (const [a, bb] of [[X1, X2 - 1.4]]) c.pave(a, -0.6, z1, bb, 0.0, z2, C.coque, M.satine, { crasse: false });
    for (const [a, bb] of tranches) {
      c.pave(a, 0, z1, bb, 0.75, z2, C.coque, M.satine, { crasse: false });
      c.pave(a, 0.75, z1 - 0.02, bb, 0.95, z2 + 0.02, C.blanc, M.satine, { crasse: false });
    }
  }
  c.pave(X1 - 0.05, yb, Z1, X1 + 0.2, 0.95, Z2, C.coque, M.satine, { crasse: false });
  panneau(c, M.atlas, R.peniche, { x: X1 - 0.07, y: 0.35, z: (Z1 + Z2) / 2, ry: -Math.PI / 2 }, 1.8, 0.45);
  panneau(c, M.atlas, R.peniche, { x: X2 - 3.2, y: 0.4, z: Z2 + 0.02 }, 1.8, 0.45);
  // L'étrave : deux bordés obliques qui se rejoignent
  for (const s of [-1, 1]) {
    const za = s > 0 ? Z2 - 0.12 : Z1 + 0.12;
    boiteEntre(c, X2 - 1.4, za, X2 + 0.45, (Z1 + Z2) / 2, yb, -0.6 - yb, 0.25, C.antifouling, M.tole, { crasse: false });
    boiteEntre(c, X2 - 1.4, za, X2 + 0.45, (Z1 + Z2) / 2, -0.6, 1.35, 0.25, C.coque, M.satine, { crasse: false });
    boiteEntre(c, X2 - 1.4, za, X2 + 0.45, (Z1 + Z2) / 2, 0.75, 0.2, 0.27, C.blanc, M.satine, { crasse: false });
    b.obstacle(X2 - 1.4, za, X2 + 0.45, (Z1 + Z2) / 2, "bordé de la péniche");
  }
  c.pave(X2 - 1.45, 0, Z1 + 0.25, X2 - 0.2, 0.04, Z2 - 0.25, C.boisClair, M.mat, { crasse: false });
  // Les cales de bois sous la coque (elle s'est échouée de travers, puis on l'a calée)
  for (const x of [X1 + 1.5, X1 + 5, X1 + 8.5, X1 + 11]) for (const s of [-1, 1]) planche(c, [x, yb, s > 0 ? Z2 + 0.9 : Z1 - 0.9], [x, -0.5, s > 0 ? Z2 : Z1], 0.2, 0.2, C.bois, M.mat);
  // Le plancher (y = 0)
  c.pave(X1 + 0.2, -0.04, Z1 + 0.25, X2 - 1.4, 0.03, Z2 - 0.25, C.boisClair, M.mat, { crasse: false, nuance: 0.02 });
  b.obstacle(X1, Z1, X1 + 0.2, Z1, "bordé de la péniche");
  b.obstacle(PASSERELLE.x2, Z1, X2 - 1.4, Z1, "bordé de la péniche");
  b.obstacle(X1, Z2, X2 - 1.4, Z2, "bordé de la péniche");
  b.obstacle(X1, Z1, X1, Z2, "tableau arrière de la péniche");
  // Le rouf (salon et cuisine) et la timonerie : bas des cloisons visible, le haut et le toit en couche
  const RX1 = 66.2;
  const RX2 = 72.8;
  const TX2 = 75.2;
  const rouf = { couleur: 0xe4e0d4, mat: M.satine };
  const zi1 = Z1 + 0.25;
  const zi2 = Z2 - 0.25;
  const hublots = (n, L) => Array.from({ length: n }, (_, i) => ({ u: ((i + 0.5) * L) / n, l: 0.5, bas: 1.3, haut: 1.75, type: "fenetre", bris: 0.3 + 0.5 * u, croisillons: 0, traverses: 1, cadre: 0xb8a27a, appui: false }));
  murDouble(ctx, k, [RX1, zi1], [RX1, zi2], { h: 2.2, ep: 0.12, bas: rouf, ouvertures: [{ u: 1.17, l: 1.3, bas: 0, haut: 1.95, type: "porte", vantail: "entrouvert", couleurPorte: 0x8a6a44, angle: 1.4 }] }); // 1,56 m (T4)
  for (const [a, bb] of [[[RX1, zi1], [RX2, zi1]], [[RX2, zi2], [RX1, zi2]]]) mur(k, a, bb, { h: 1.25, y0: 0.95, ep: 0.12, couleur: 0xe4e0d4, mat: M.satine, ouvertures: hublots(5, RX2 - RX1).map((o) => ({ ...o, bas: o.bas - 0.95, haut: o.haut - 0.95 })) });
  murDouble(ctx, k, [69.6, zi1], [69.6, zi2], { h: 2.2, ep: 0.08, bas: { couleur: 0xa08a66, mat: M.mat }, ouvertures: [{ u: 2.35, l: 1.3, bas: 0, haut: 1.9, type: "vide" }] }); // 1,56 m
  murDouble(ctx, k, [RX2, zi1], [RX2, zi2], { h: 2.2, ep: 0.1, bas: { couleur: 0xa08a66, mat: M.mat }, ouvertures: [{ u: 2.35, l: 1.3, bas: 0, haut: 1.9, type: "vide" }] }); // 1,56 m
  for (const [a, bb] of [[[RX2, zi1], [TX2, zi1]], [[TX2, zi2], [RX2, zi2]]]) mur(k, a, bb, { h: 1.75, y0: 0.95, ep: 0.1, couleur: 0xe4e0d4, mat: M.satine, ouvertures: [{ u: (TX2 - RX2) / 2, l: 1.6, bas: 0.35, haut: 1.5, type: "fenetre", bris: 0.5 + 0.4 * u, croisillons: 1, traverses: 1, cadre: 0xb8a27a }] });
  murDouble(ctx, k, [TX2, zi1], [TX2, zi2], { h: 2.7, ep: 0.1, bas: rouf, ouvertures: [{ u: 2.85, l: 2.1, bas: 1.15, haut: 2.3, type: "fenetre", bris: 0.6, croisillons: 2, traverses: 1, cadre: 0xb8a27a }, { u: 0.78, l: 1.3, bas: 0, haut: 1.9, type: "porte", vantail: "tombe" }] }); // la porte : 1,56 m
  k.pave(RX1 - 0.1, 2.2, zi1 - 0.1, RX2 + 0.05, 2.32, zi2 + 0.1, 0xd8d4c8, M.satine, { crasse: false });
  k.pave(RX2, 2.7, zi1 - 0.15, TX2 + 0.15, 2.82, zi2 + 0.15, 0xd8d4c8, M.satine, { crasse: false });
  // Sur le toit : jardinières mortes, vélo, lampe solaire de jardin, fientes
  for (let i = 0; i < 4; i++) {
    k.boite(0.8, 0.25, 0.3, 0x8a5a40, { x: 66.8 + i * 1.7, y: 2.45, z: zi2 - 0.3 }, M.mat);
    for (let j = 0; j < 3; j++) k.boite(0.03, 0.35, 0.03, 0x6a5a3a, { x: 66.6 + i * 1.7 + j * 0.2, y: 2.7, z: zi2 - 0.3, rz: (j - 1) * 0.4 }, M.mat);
  }
  k.repere({ x: 69.5, y: 2.32, z: 22.3, rx: -Math.PI / 2 + 0.05 }, () => {
    for (const s of [-0.5, 0.5]) cylindre(k, M.mat, 0x2a2a2a, s, 0.03, 0, 0.32, 0.32, 0.04, 10, { rx: Math.PI / 2 });
    k.boite(1.0, 0.04, 0.04, 0x8a3a30, { y: 0.35 }, M.metal);
  });
  cylindre(k, M.mat, 0x2a2a2a, 70, 2.32, 23, 0.03, 0.03, 0.4, 6);
  cylindre(k, M.verre, 0xdfefff, 70, 2.72, 23, 0.08, 0.06, 0.12, 6);
  fientes(k, M, RX1, zi1, TX2, zi2, 2.33, 12);
  // Le salon : banquette en U, table, coussins délavés ; la cuisine : plan de travail, réchaud, placards
  c.pave(66.4, 0, zi1 + 0.05, 67.0, 0.45, zi2 - 0.05, 0x5a7a86, M.toile);
  c.pave(66.4, 0, zi1 + 0.05, 68.8, 0.45, zi1 + 0.6, 0x5a7a86, M.toile);
  c.pave(66.4, 0.45, zi1 + 0.05, 66.6, 0.95, zi2 - 0.05, 0x5a7a86, M.toile);
  table(c, M, 67.8, 22.2, 1.2, 0.7, 0, 0x9a7a55, 0.7);
  for (let i = 0; i < 3; i++) c.boite(0.4, 0.12, 0.35, [0xc8705a, 0xd8c890, 0x5a7a86][i], { x: 66.8 + i * 0.6, y: 0.52, z: 21.3, ry: i * 0.4 }, M.toile);
  etagere(c, M, 68.4, zi2 - 0.2, Math.PI, 1.4, 1.4, [0x8a3a30, 0x2f4f6a, 0xd8d2c4, 0xc9a050], 0.6);
  c.pave(69.8, 0, zi1 + 0.05, 72.6, 0.9, zi1 + 0.65, 0xd8d4c8, M.lisse);
  c.pave(69.78, 0.9, zi1 + 0.03, 72.62, 0.95, zi1 + 0.67, 0x9a7a55, M.mat);
  cylindre(c, M.metal, 0x3a3a3a, 70.8, 0.95, 21.3, 0.12, 0.12, 0.05, 8);
  cylindre(c, M.metal, 0x8a3a30, 71.8, 0, zi2 - 0.35, 0.18, 0.18, 0.55, 8);
  c.pave(69.8, 1.4, zi1 + 0.05, 72.6, 2.0, zi1 + 0.4, 0x9a7a55, M.mat);
  // La timonerie : la barre à roue, la console, la couchette
  c.repere({ x: 74.8, y: 0, z: 23 }, () => {
    c.boite(0.4, 1.0, 1.4, 0x6a4a34, { y: 0.5 }, M.mat);
    const roue = new THREE.TorusGeometry(0.32, 0.03, 4, 12);
    c.poser(roue, M.mat, 0x8a6a44, { x: -0.25, y: 1.25, ry: Math.PI / 2, rx: 0.3 }, { crasse: false });
    roue.dispose();
    for (let i = 0; i < 4; i++) c.boite(0.02, 0.7, 0.04, 0x8a6a44, { x: -0.25, y: 1.25, rx: (i * Math.PI) / 4 }, M.mat);
  });
  c.pave(73.0, 0, 24.3, 74.2, 0.5, zi2 - 0.05, 0x7a6a5a, M.toile);
  // L'arrière : chaise longue, une ancre, un pare-battage ; la proue : guindeau, jardinière
  c.repere({ x: 65.3, y: 0, z: 24.2, ry: 0.4 }, () => {
    c.boite(1.5, 0.05, 0.55, 0x2f6f73, { y: 0.35, rz: 0.15 }, M.toile);
    c.boite(0.6, 0.05, 0.55, 0x2f6f73, { x: -0.85, y: 0.6, rz: 1.0 }, M.toile);
  });
  cylindre(c, M.tole, 0x3a3a38, 76.0, 0, 23, 0.25, 0.25, 0.35, 8);
  for (let i = 0; i < 3; i++) cylindre(c, M.satine, 0xe4e0d4, X1 + 1.5 + i * 3.5, -0.2, Z2 + 0.18, 0.13, 0.13, 0.6, 8);
  debris(c, X1 + 0.4, zi1 + 0.1, X2 - 1.6, zi2 - 0.1, Math.round(10 * u), [0xd9d2c0, 0x9a7a55, 0x5a7a86]);
}

/** Le hangar à bateaux de la Société des canotiers : bardage de planches, toit de tôle, barques sur tréteaux. */
function hangar(ctx) {
  const { c, b, M, u } = ctx;
  const X1 = 81;
  const X2 = 95;
  const Z1 = 14;
  const Z2 = 29;
  const H = 4.2;
  const k = b.couche("hangar à bateaux", { x: (X1 + X2) / 2, z: (Z1 + Z2) / 2, l: X2 - X1 + 0.8, p: Z2 - Z1 + 0.8 }, 1.05, 7.2);
  const planches = { couleur: 0x8a8070, mat: M.mat };
  const haut = { couleur: 0x7f7666, mat: M.mat };
  murDouble(ctx, k, [X1, Z2], [X1, Z1], { h: H, ep: 0.15, bas: planches, haut, ouvertures: [{ u: 7.5, l: 4.6, bas: 0, haut: 3.6, type: "vide" }] });
  murDouble(ctx, k, [X1, Z1], [X2, Z1], { h: H, ep: 0.15, bas: planches, haut, ouvertures: [{ u: 4, l: 1.4, bas: 1.2, haut: 2.2, type: "fenetre", bris: 0.7, croisillons: 2, traverses: 1, cadre: 0x5d8a96 }, { u: 10, l: 1.4, bas: 1.2, haut: 2.2, type: "fenetre", bris: 0.5, croisillons: 2, traverses: 1, cadre: 0x5d8a96 }] });
  murDouble(ctx, k, [X2, Z1], [X2, Z2], { h: H, ep: 0.15, bas: planches, haut, breches: u > 0.5 ? [{ u: 9, l: 2.4, profondeur: 1.6 }] : [] });
  murDouble(ctx, k, [X2, Z2], [X1, Z2], { h: H, ep: 0.15, bas: planches, haut, ouvertures: [{ u: 7, l: 1.0, bas: 0, haut: 2.1, type: "porte", vantail: "entrouvert", couleurPorte: 0x5d8a96, angle: 1.2 }, { u: 11.5, l: 1.4, bas: 1.2, haut: 2.2, type: "fenetre", bris: 0.6, croisillons: 2, traverses: 1, cadre: 0x5d8a96 }] });
  // Les couvre-joints verticaux du bardage (sur les faces sud et est, vues de la caméra)
  for (let x = X1 + 0.6; x < X2; x += 0.9) c.boite(0.07, 1.05, 0.04, 0x6f6658, { x, y: 0.53, z: Z2 + 0.09 }, M.mat);
  for (let x = X1 + 0.6; x < X2; x += 0.9) k.boite(0.07, H - 1.05, 0.04, 0x6f6658, { x, y: 1.05 + (H - 1.05) / 2, z: Z2 + 0.09 }, M.mat);
  // Les grandes portes : un vantail ouvert contre le mur, l'autre tombé
  c.boite(0.08, 3.4, 2.2, 0x5d8a96, { x: X1 - 1.0, y: 1.7, z: 17.4, ry: 1.2 }, M.mat, { nuance: 0.05 });
  c.boite(2.3, 0.08, 3.4, 0x5d8a96, { x: X1 - 1.6, y: 0.06, z: 22.4, ry: 0.2 }, M.mat, { nuance: 0.05 });
  // Le toit de tôle ondulée, l'enseigne sur le pignon ouest
  toitDeuxPans(k, (X1 + X2) / 2, (Z1 + Z2) / 2, X2 - X1, Z2 - Z1, H, 2.2, { couleur: C.tole, mat: M.tole, debord: 0.4, trous: u > 0.4 ? [{ u: 2, v: 1, l: 3, p: 0.7 }, { u: -4, v: -1, l: 2, p: 0.5 }] : [] });
  const pg = new THREE.Shape();
  pg.moveTo(-7.5, 0);
  pg.lineTo(7.5, 0);
  pg.lineTo(0, 2.2);
  pg.lineTo(-7.5, 0);
  for (const x of [X1, X2]) {
    const g = new THREE.ExtrudeGeometry(pg, { depth: 0.15, bevelEnabled: false });
    k.poser(g, M.mat, 0x7f7666, { x: x - 0.075, y: H, z: (Z1 + Z2) / 2, ry: Math.PI / 2 }, { crasse: false });
    g.dispose();
  }
  panneau(k, M.atlas, R.hangar, { x: X1 - 0.1, y: H + 0.55, z: (Z1 + Z2) / 2, ry: -Math.PI / 2 }, 5.6, 0.7);
  panneau(k, M.atlas, R.hangar, { x: (X1 + X2) / 2, y: 3.3, z: Z2 + 0.1 }, 5.6, 0.7);
  fientes(k, M, X1, Z1, X2, Z2, H + 1.2, 18);
  if (u > 0.4) raiDeLumiere(c, [89, 6.2, 23.2], [88.6, 0.05, 23.4], 1.6);
  c.pave(X1 + 0.1, 0, Z1 + 0.1, X2 - 0.1, 0.05, Z2 - 0.1, 0x8a8478, M.beton, { crasse: false });
  // Les barques sur leurs tréteaux, une yole renversée, un canot au mur
  for (const [x, z, ry, coul] of [[85.5, 18, 0.05, 0x3f6a7a], [85.6, 24.4, -0.05, 0x7a3a2c], [91.2, 21.2, 0.1, 0xd8d4c8]]) {
    for (const s of [-1, 1]) {
      c.boite(0.1, 0.8, 1.2, C.bois, { x: x + s * 1.3, y: 0.4, z, ry }, M.mat);
      c.boite(0.12, 0.08, 1.4, C.bois, { x: x + s * 1.3, y: 0.82, z, ry }, M.mat);
    }
    barque(c, M, x, 0.86, z, ry, coul, { retournee: coul === 0xd8d4c8 });
    obstacleBoite(b, x, z, 4.4, 1.6, ry, "barque sur tréteaux");
  }
  barque(c, M, 94.6, 2.4, 21, Math.PI / 2, 0x6a8a7a, { rz: Math.PI / 2, l: 3.6, w: 1.0, h: 0.4, avirons: false });
  // L'établi, le moteur hors-bord, les avirons, les filets, les bouées, les gilets
  c.pave(91, 0, Z2 - 0.85, 94.6, 0.9, Z2 - 0.2, C.bois, M.mat);
  c.pave(90.95, 0.9, Z2 - 0.9, 94.65, 0.96, Z2 - 0.15, C.boisClair, M.mat);
  // Le moteur hors-bord, serré sur le chant de l'établi : capot, bras, arbre qui descend devant, embase et hélice
  c.repere({ x: 92.6, y: 0.96, z: Z2 - 0.9, ry: Math.PI }, () => {
    c.boite(0.16, 0.22, 0.12, 0x3a3a3a, { y: -0.02, z: -0.06 }, M.metal);
    for (const s of [-0.05, 0.05]) c.boite(0.03, 0.12, 0.02, 0x8a8c88, { x: s, y: 0.1, z: -0.14 }, M.metal);
    c.boite(0.36, 0.3, 0.46, 0xd8d6cc, { y: 0.22, z: 0.12 }, M.satine);
    c.boite(0.32, 0.12, 0.42, 0xd8d6cc, { y: 0.42, z: 0.12 }, M.satine);
    c.boite(0.37, 0.06, 0.47, 0x2f6f73, { y: 0.14, z: 0.12 }, M.satine);
    c.boite(0.03, 0.08, 0.38, 0x1e1e1e, { x: 0.18, y: 0.3, z: 0.12 }, M.lisse);
    c.boite(0.05, 0.05, 0.5, 0x1e1e1e, { y: 0.2, z: -0.38, rx: 0.2 }, M.mat);
    c.boite(0.11, 0.85, 0.13, 0x4a4c4a, { y: -0.48, z: 0.08 }, M.metal);
    c.boite(0.12, 0.22, 0.32, 0x4a4c4a, { y: -0.95, z: 0.1 }, M.metal);
    c.boite(0.26, 0.02, 0.36, 0x5a5c58, { y: -0.83, z: 0.12 }, M.metal);
    for (let i = 0; i < 3; i++) c.boite(0.03, 0.18, 0.06, 0x8a7a4a, { y: -0.97, z: -0.08, rz: (i * Math.PI * 2) / 3 }, M.metal);
  });
  // Le bidon d'huile (vingt litres, rond, bouchon jaune) et sa flaque
  cylindre(c, M.satine, 0x2f4a3a, 94.25, 0, 27.55, 0.22, 0.22, 0.58, 10);
  cylindre(c, M.satine, 0xc8a030, 94.25, 0.58, 27.55, 0.05, 0.05, 0.05, 6, { x: 94.33 });
  c.boite(0.45, 0.06, 0.2, 0xd8b030, { x: 94.25, y: 0.32, z: 27.33 }, M.satine, { crasse: false });
  c.boite(0.9, 0.006, 0.6, 0x1e1c18, { x: 93.9, y: 0.053, z: 27.4, ry: 0.4 }, M.lisse, { crasse: false });
  for (let i = 0; i < 8; i++) c.boite(0.06, 2.6, 0.12, C.boisClair, { x: X1 + 0.35 + i * 0.16, y: 1.3, z: Z1 + 0.35, rz: 0.08 }, M.mat);
  filet(c, M, 88.4, 15.6, 2.4, 1.4, 0x4a6a7a);
  filet(c, M, 93.8, 17, 1.6, 1.6, 0x8a6a4a);
  for (let i = 0; i < 6; i++) c.poser(BOULE, M.satine, i % 2 ? 0xd06a3a : 0xe4e0d4, { x: 89.4 + (i % 3) * 0.45, y: 0.22 + Math.floor(i / 3) * 0.38, z: 15.0, e: 0.22 }, { crasse: false });
  for (let i = 0; i < 4; i++) c.boite(0.45, 0.6, 0.12, 0xd07a3a, { x: 90.4 + i * 0.55, y: 1.7, z: Z1 + 0.15 }, M.toile);
  glene(c, M, 89, 27.6, 0, 0.5);
  glene(c, M, 90.2, 27.8, 0, 0.4, 0x5a6a7a);
  for (let i = 0; i < 2; i++) tonneau(c, M, 94.2, 15.2 + i * 0.7, false, 0x2a2622);
  debris(c, X1 + 0.4, Z1 + 0.4, X2 - 0.4, Z2 - 0.4, Math.round(12 * u), [0x9a8466, 0x6f6658, 0xd9d2c0]);
  jonchee(c, X1 + 0.4, Z1 + 0.4, X2 - 0.4, Z2 - 0.4, Math.round(10 * u), [0x9a8466, 0xc9b48a]);
}

// ---------- Les alentours (R52, R0-2, R0-3) ----------

const ALENT = { nord: -85, sud: 100, bout: 150 }; // jusqu'où va le décor au-delà du lot (50 à 65 m)
const JETEE = 74; // les quais de l'estuaire se prolongent en jetées jusque-là, au sud

/** La teinte du sol des alentours : le sable des dunes, le gris du terre-plein près du lot, la plage mouillée. */
function teinteSol(x, y, z) {
  const n = bruit(x, z, 11);
  let t = melange(C.sableClair, C.sable, n);
  if (n > 0.62) t = melange(t, 0xb2ad86, (n - 0.62) * 1.6); // les prés d'oyats, gris-vert
  // Près des bouts du lot, le terre-plein gris du lot se prolonge (le raccord ne se voit pas)
  const ax = Math.abs(x);
  if (ax > 99 && z > -16 && z < 35) t = melange(C.sol, t, lisser(100, 118, ax));
  // La plage : sable sec, puis mouillé sous la laisse de haute mer, puis la vase sous l'eau
  if (y < -0.4) t = melange(t, 0xc9bb98, lisser(-0.4, -3, y));
  if (y < Y_HAUTE + 0.6) t = melange(t, 0x9f9175, lisser(Y_HAUTE + 0.6, Y_HAUTE - 0.8, y));
  if (y < Y_EAU + 0.2) t = melange(t, 0x7d725e, lisser(Y_EAU + 0.2, Y_EAU - 1.2, y));
  return t;
}

/**
 * Le décor au-delà du lot, très léger, dans un chantier à part (le groupe « alentours ») et dans deux matières du lot
 * seulement : le sol (sable, terre-plein, route, quais, dunes et oyats, quelques maisons du bourg) et l'eau (la même que
 * l'estuaire du lot). Chaque tronçon porte sa bande nord et sud ; le bourg et la rive des marins, en plus, le
 * prolongement à l'ouest et à l'est. Aucun obstacle : on ne va pas là.
 */
function alentours(ctx) {
  const { M, xa, xb } = ctx;
  const a = new Chantier(4400 + Math.round(ctx.x0));
  const h = ctx.haute;
  const MS = uneMatiere(M, M.sol);
  const S = M.sol;
  const X1 = xa <= -100 ? -ALENT.bout : xa;
  const X2 = xb >= 100 ? ALENT.bout : xb;
  const tuile = S.userData.tuile;
  const uvSol = (x, y, z) => [x / tuile, z / tuile];
  const sol = (x1, x2, z1, z2, pas = 6) => {
    if (x2 - x1 < 0.01) return;
    poserTeinte(a, S, grille(x1, x2, z1, z2, pas, pas, solNaturel), teinteSol, uvSol);
  };
  // Les morceaux de terre (|x| ≥ 58) et d'estuaire (|x| < 58) de la bande du tronçon
  const coupe = (lo, hi) => [Math.max(X1, lo), Math.min(X2, hi)];
  const terres = [coupe(-ALENT.bout, -58), coupe(58, ALENT.bout)].filter(([p, q]) => q - p > 0.01);
  const [e1, e2] = coupe(-58, 58);
  const estuaire = e2 - e1 > 0.01;

  // ---- La terre : au nord, les dunes ; au sud, les dunes puis la plage ; aux bouts, le terre-plein qui continue
  for (const [p, q] of terres) {
    sol(p, q, ALENT.nord, -35);
    sol(p, q, 35, ALENT.sud);
    const [b1, b2] = [Math.max(p, -ALENT.bout), Math.min(q, -100)];
    if (b2 - b1 > 0.01) sol(b1, b2, -35, 35);
    const [c1, c2] = [Math.max(p, 100), Math.min(q, ALENT.bout)];
    if (c2 - c1 > 0.01) sol(c1, c2, -35, 35);
    // La mer, au sud, de part et d'autre de l'embouchure (sous la plage, le sable la cache) ; à marée haute aussi
    nappe(a, M.eau, p, q, 60, ALENT.sud, 5, 4, Y_EAU);
    nappe(h, M.eau, p, q, 56, ALENT.sud, 5, 4, Y_HAUTE);
  }

  // ---- L'estuaire : l'eau, le fond, les quais qui continuent au nord et deviennent des jetées au sud
  if (estuaire) {
    for (const [z1, z2] of [[ALENT.nord, -35], [35, ALENT.sud]]) {
      a.pave(e1, Y_FOND - 0.3, z1, e2, Y_FOND, z2, 0x6a6658, S, { crasse: false, nuance: 0 });
      nappe(a, M.eau, e1, e2, z1, z2, 2.5, 5, Y_EAU);
      nappe(h, M.eau, e1, e2, z1, z2, 2.5, 5, Y_HAUTE);
    }
    for (const sx of [-1, 1]) {
      const xm = sx * 57.7;
      if (xm < X1 || xm > X2) continue;
      for (const [z1, z2] of [[ALENT.nord, -35], [35, JETEE]]) {
        a.pave(xm - 0.3, Y_FOND - 0.4, z1, xm + 0.3, -0.05, z2, C.quai, S, { crasse: false, nuance: 0.02 });
        a.pave(xm - 0.31, Y_EAU - 0.2, z1, xm + 0.31, Y_EAU + 2.6, z2, C.algues, S, { crasse: false, nuance: 0.03 });
        a.pave(xm - 0.4, -0.06, z1, xm + 0.4, 0.18, z2, C.quaiSombre, S, { crasse: false, nuance: 0.02 });
      }
      // Le musoir de la jetée, et son feu éteint (une tourelle blanche et rouge)
      a.pave(xm - 1.2, Y_FOND - 0.4, JETEE - 1.6, xm + 1.2, 0.3, JETEE + 0.8, C.quai, S, { crasse: false, nuance: 0.02 });
      a.pave(xm - 1.21, Y_EAU - 0.2, JETEE - 1.61, xm + 1.21, Y_EAU + 2.6, JETEE + 0.81, C.algues, S, { crasse: false, nuance: 0.03 });
      cylindre(a, S, sx < 0 ? 0xb8463a : 0x4f8a5a, xm, 0.3, JETEE - 0.4, 0.45, 0.55, 3.2, 8);
      cylindre(a, S, 0xe8e4da, xm, 3.5, JETEE - 0.4, 0.3, 0.35, 0.6, 8);
      // Des bancs de vase le long des quais, au nord (découverts à marée basse)
      for (let i = 0; i < 3; i++) {
        const zc = -45 - i * 13 - hache(i, sx + 40) * 4;
        const l = 2.5 + hache(i, sx + 41) * 3;
        const p = 4 + hache(i, sx + 42) * 3;
        const pts = [];
        for (let j = 0; j < 9; j++) {
          const t = (j / 8) * Math.PI;
          pts.push([xm - sx * (0.3 + Math.sin(t) * l * (0.7 + 0.3 * hache(i * 9 + j, sx + 44))), zc - Math.cos(t) * p]);
        }
        dalle(a, S, i % 2 ? C.vase : C.vaseClaire, pts, Y_VASE, { nuance: 0.02 });
      }
    }
  }

  // ---- La route du Littoral qui continue aux deux bouts, à demi ensablée
  for (const [r1, r2] of [[Math.max(X1, -ALENT.bout), Math.min(X2, -100)], [Math.max(X1, 100), Math.min(X2, ALENT.bout)]]) {
    if (r2 - r1 < 0.01) continue;
    a.pave(r1, -0.06, -HL, r2, 0.025, HL, C.asphalte, S, { crasse: false, nuance: 0 });
    for (const sz of [-1, 1]) a.pave(r1, -0.06, sz > 0 ? HL : -ZTR, r2, 0.07, sz > 0 ? ZTR : -HL, C.trottoir, S, { crasse: false, nuance: 0 });
    for (let x = r1 + 1; x < r2 - 2; x += 4) if (hache(Math.round(x), 61) > 0.3) a.boite(2.3, 0.01, 0.13, C.ligne, { x: x + 1.2, y: 0.035, z: 0 }, S, { crasse: false });
    // Le sable qui mord la chaussée, de plus en plus loin du lot
    for (let i = 0; i < 9; i++) {
      const x = r1 + (r2 - r1) * hache(i, Math.round(r1) + 62);
      const loin = Math.abs(x) - 100;
      const l = 2 + hache(i, 63) * 5 + loin * 0.08;
      a.boite(l, 0.04, 1.5 + hache(i, 64) * 3, C.sableClair, { x, y: 0.04, z: (hache(i, 65) - 0.5) * 9, ry: (hache(i, 66) - 0.5) * 0.5 }, S, { crasse: false, nuance: 0.03 });
    }
  }

  // ---- Les dunes et les oyats (tout dans la matière du sol)
  const A = aleatoire(4500 + Math.round(ctx.x0));
  const dunes = (x1, x2, z1, z2, n, hmax = 1.6) => {
    for (let i = 0; i < n; i++) {
      const x = x1 + A() * (x2 - x1);
      const z = z1 + A() * (z2 - z1);
      if (x < X1 || x > X2 || Math.abs(x) < 61 || (Math.abs(x) < 100.5 && z > -35.5 && z < 35.5)) continue;
      if (Math.abs(z) < 9 && Math.abs(x) > 100) continue; // la route
      dune(a, MS, x, z, 6 + A() * 9, 4 + A() * 6, 0.7 + A() * hmax, A() < 0.3 ? 1 : 0);
    }
  };
  dunes(X1, X2, -80, -37, Math.round((X2 - X1) / 8));
  dunes(X1, X2, 37, 43, Math.round((X2 - X1) / 10), 1.1);
  if (X1 < -100) dunes(-148, -102, -34, 34, 9);
  if (X2 > 100) dunes(102, 148, -34, 34, 9);
  for (const [p, q] of terres) {
    semerOyats(a, MS, p, -84, q, -36, Math.round((q - p) / 7));
    semerOyats(a, MS, p, 36, q, 43, Math.round((q - p) / 10));
  }

  // ---- Le bourg qui continue à l'ouest : quelques maisons basses le long de la route, volets clos
  if (X1 < -100) {
    for (const [x, z, l, p, hh, coul, toit] of [
      [-112, -14, 9, 7, 5.2, 0xd8cdb2, C.tuile],
      [-126, -13, 8, 6.5, 4.6, 0xe2dccb, 0x8a5e4a],
      [-140, -15, 10, 8, 5.6, 0xc9d2cf, C.tuile],
      [-118, 14, 8, 7, 4.8, 0xe2dccb, 0x8a5e4a],
      [-134, 15, 11, 8, 5.4, 0xd8cdb2, C.tuile],
    ]) {
      a.boite(l, hh, p, coul, { x, y: hh / 2, z }, S, { nuance: 0.03 });
      const pg = new THREE.Shape();
      pg.moveTo(-p / 2 - 0.4, 0);
      pg.lineTo(p / 2 + 0.4, 0);
      pg.lineTo(0, p * 0.42);
      pg.lineTo(-p / 2 - 0.4, 0);
      const g = new THREE.ExtrudeGeometry(pg, { depth: l + 0.6, bevelEnabled: false });
      a.poser(g, S, toit, { x: x - (l + 0.6) / 2, y: hh, z, ry: Math.PI / 2 }, { crasse: false, nuance: 0.03 });
      g.dispose();
      for (const s of [-1, 1]) a.boite(0.6, 1.2, 0.06, C.volet, { x: x + s * l * 0.25, y: 1.6, z: z + Math.sign(-z) * (p / 2 + 0.03) }, S, { crasse: false });
    }
  }
  // À l'est, vers l'hôtel : une cabine de plage abandonnée, des poteaux télégraphiques
  if (X2 > 100) {
    for (let i = 0; i < 4; i++) {
      const x = 106 + i * 12;
      a.boite(0.22, 7, 0.22, 0x6a5a48, { x, y: 3.5, z: -8.5, rz: (hache(i, 70) - 0.5) * 0.08 }, S, { nuance: 0.05 });
      a.boite(1.6, 0.14, 0.14, 0x6a5a48, { x, y: 6.6, z: -8.5 }, S);
    }
    a.boite(2.2, 2.4, 2.2, 0xe6e2da, { x: 128, y: 1.2, z: 30, ry: 0.2 }, S, { nuance: 0.03 });
    for (let k = 0; k < 4; k++) a.boite(0.3, 2.42, 2.22, k % 2 ? 0x4f8aa0 : 0xe6e2da, { x: 128 - 0.9 + k * 0.55, y: 1.21, z: 30, ry: 0.2 }, S, { crasse: false });
  }

  // ---- Les brisants : une ligne d'écume entre l'eau claire et l'eau sombre ; devant l'embouchure, la barre (des
  // plaques d'écume à plat, deux triangles chacune)
  const PLAQUE = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const brisants = (ch0, mat, niveau, zLigne, graine) => {
    const ch = { boite: (l, hh, p, coul, pose, mat, opt) => ch0.poser(PLAQUE, mat, coul, { ...pose, e: [l, 1, p] }, opt) };
    for (let x = X1; x < X2; x += 2.2) {
      const ax = Math.abs(x);
      const z0 = ax >= 58 ? zLigne : zLigne + (58 - ax) * 0.28;
      for (let k = 0; k < 2; k++) {
        const r = hache(Math.round(x * 3) + k * 7, graine);
        if (r < 0.15) continue;
        const l = 2.4 + r * 3;
        ch.boite(l, 0.02, 0.35 + r * 0.6 - k * 0.15, EAU.ecume, { x: x + r, y: niveau + 0.03 + k * 0.005, z: z0 + (bruit(x, graine, 13) - 0.5) * 3 + k * (1.6 + r), ry: (r - 0.5) * 0.25 }, mat, { crasse: false, nuance: 0.03 });
      }
      // L'écume du bord, à la laisse (là où le sable entre dans l'eau)
      if (ax >= 60 && hache(Math.round(x * 2), graine + 1) > 0.3) {
        const zb = 44 + (Y_EAU === niveau ? 26 : (-niveau) * (26 / 8));
        ch.boite(1.4 + hache(Math.round(x), graine + 2) * 2, 0.02, 0.3, EAU.ecume, { x: x + 1, y: niveau + 0.04, z: zb + 0.4, ry: (hache(Math.round(x), graine + 3) - 0.5) * 0.3 }, mat, { crasse: false, nuance: 0.03 });
      }
    }
  };
  // (à marée basse, l'écume va avec les bancs découverts, dans « maree_basse » : elle disparaît quand la mer monte)
  brisants(ctx.basse, M.satine, Y_EAU, 79.6, 801);
  brisants(h, M.eau, Y_HAUTE, 66.4, 802);
  PLAQUE.dispose();

  const g = a.construire();
  g.name = "alentours";
  g.userData.nom = "alentours";
  ctx.b.ajouter(g);
  ctx.objets.alentours = g;
}

// ---------- La halte : un tronçon à la fois ----------

/** Recentre un tronçon sur son lot : la géométrie fondue est translatée, les objets animés sont déplacés. */
function recentrer(groupe, x0) {
  const vues = new Set();
  for (const enfant of groupe.children) {
    if (enfant.userData.mobile) {
      enfant.position.x -= x0;
      continue;
    }
    enfant.traverse((obj) => {
      if (obj.geometry && !vues.has(obj.geometry)) {
        vues.add(obj.geometry);
        obj.geometry.translate(-x0, 0, 0);
      }
    });
  }
  const ud = groupe.userData;
  for (const t of ud.toits) {
    t.boite = { ...t.boite, x: arr(t.boite.x - x0) };
    if (t.horsDe) t.horsDe = { ...t.horsDe, x: t.horsDe.x - x0 };
  }
  ud.obstacles = ud.obstacles.map((s) => ({ ...s, x1: arr(s.x1 - x0), x2: arr(s.x2 - x0) }));
  ud.lumieres = ud.lumieres.map((l) => ({ ...l, x: arr(l.x - x0) }));
  return groupe;
}

export function creer({ usure = 0.7, carte = "bourg" } = {}) {
  const def = FICHE.cartes.find((k) => k.id === carte) ?? FICHE.cartes[0];
  const x0 = def.decalage.x;
  const b = new Batiment(1934 + Math.round(x0), usure);
  const ctx = { b, c: b.c, M: matieres(), u: usure, x0, xa: x0 - 25, xb: x0 + 25, ici: bande(x0) };
  // La marée : deux chantiers à part, qui deviennent les objets « maree_basse » et « maree_haute » du tronçon
  ctx.basse = new Chantier(7701 + Math.round(x0));
  ctx.haute = new Chantier(7702 + Math.round(x0));
  ctx.objets = {};
  ctx.obstaclesChicane = [];
  ctx.obstaclesMareeHaute = [];
  sols(ctx);
  routes(ctx);
  tablier(ctx);
  dallesQuiPendent(ctx);
  planches(ctx);
  suspension(ctx);
  bourg(ctx);
  barricade(ctx);
  posteDeGuet(ctx);
  voituresOuest(ctx);
  breche(ctx);
  marins(ctx);
  alentours(ctx);
  animations(ctx);
  // Les deux états de la marée (marée basse visible, marée haute cachée)
  for (const [nom, ch] of [["maree_basse", ctx.basse], ["maree_haute", ctx.haute]]) {
    if (ch.vide) continue;
    const g = ch.construire();
    g.name = nom;
    g.userData.nom = nom;
    b.ajouter(g);
    ctx.objets[nom] = g;
  }
  if (ctx.objets.maree_haute) {
    ctx.objets.maree_haute.visible = false;
    ctx.objets.maree_haute.userData.obstacles = ctx.obstaclesMareeHaute;
  }
  const groupe = recentrer(b.construire(), x0);
  // Les données à part, recentrées comme le reste
  const decale = (liste) => liste.map((o) => ({ ...o, x1: arr(o.x1 - x0), x2: arr(o.x2 - x0) }));
  for (const o of Object.values(ctx.objets)) if (o.userData.obstacles) o.userData.obstacles = decale(o.userData.obstacles);
  groupe.userData.objets = ctx.objets;
  groupe.userData.obstaclesChicane = decale(ctx.obstaclesChicane);
  groupe.userData.obstaclesMareeHaute = decale(ctx.obstaclesMareeHaute);
  return groupe;
}
