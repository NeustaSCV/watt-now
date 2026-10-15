// La halte de la corniche (Book 20 §4 « la corniche », route du Littoral ; Book 01 §2 bis : les haltes).
//
// Une route en balcon taillée dans la falaise de porphyre rouge, d'ouest en est, à quinze mètres au-dessus de la mer.
// Au nord, la paroi monte ; au sud, la falaise plonge vers l'eau (y = −15), l'écume et les rochers (solPropre). Deux
// goulets : le tunnel du Cap Rouge, creusé dans un éperon (voûte brute, rocher qui s'efface), et l'éboulement où la
// moitié de la chaussée est partie à la mer : il ne reste qu'un ruban contre la paroi.
//
// Repère de la halte entière : 200 × 70 m, origine au centre, +x à l'est, +z au sud, sol visitable à y = 0. Tout est
// bâti dans ce repère, puis chaque tronçon (50 × 70 m) ne garde que ce qui tombe dans sa bande de x et se recentre.
// Les pièces continues (route, murets, glissières, terrain) sont découpées par petits morceaux attribués au tronçon qui
// contient leur milieu, et le terrain est une grille alignée sur le repère global : les raccords sont exacts.
//
// On visite : la station-essence à une pompe et l'abri du cantonnier (la montée), le tunnel et sa barricade, le
// belvédère et son kiosque à glaces (le tunnel), l'hôtel-restaurant « Le Panoramique » (chambres, hall et bar, cuisine,
// salle à manger vitrée, terrasse en encorbellement à moitié tombée) et la villa des années 1970 (le Panoramique), le
// ruban de l'éboulement, le palier de la crique et le cabanon du pêcheur (l'éboulement). Toits et hauts de façades
// s'effacent en couches.

import * as THREE from "three";
import { Batiment, Chantier, aleatoire, PALETTE, matiere, matiereMonde, matiereVerre, matiereEau, matiereLueur, MAT, mur, touffes, gravats, debris, jonchee, flaque, raiDeLumiere, dessiner } from "../commun/atelier.js";

// ---------- Les tronçons ----------

const X0 = { montee: -75, tunnel: -25, panoramique: 25, eboulement: 75 };

/** Le filtre d'un tronçon : un objet appartient au tronçon qui contient son centre (les bouts de la halte débordent). */
function bande(x0) {
  const xa = x0 - 25;
  const xb = x0 + 25;
  return (x) => (x >= xa || xa <= -100) && (x < xb || xb >= 100);
}

const arr = (v) => Math.round(v * 100) / 100;
const versTroncon = (liste, id) => liste.filter((o) => bande(X0[id])(o.x)).map((o) => ({ ...o, x: arr(o.x - X0[id]) }));

// Les données de jeu, dans le repère de la halte entière (recentrées par tronçon plus bas).
const ENTREES = [
  { x: -100, z: 3.9, nature: "entrée A : la corniche arrive de la station balnéaire et du Comptoir du Port" },
  { x: -84.19, z: -8.7, nature: "porte de la boutique de la station-essence" },
  { x: -59.8, z: -6.4, nature: "porte de l'abri du cantonnier" },
  { x: -48, z: 0, nature: "bouche ouest du tunnel du Cap Rouge" },
  { x: -30, z: 0, nature: "bouche est du tunnel, devant la barricade" },
  { x: -25, z: 0.45, nature: "la porte de la barricade des pillards : le passage de 2 m, ouvert quand on a payé à la caisse" },
  { x: -6.29, z: 6.7, nature: "porte du kiosque à glaces du belvédère (côté mer)" },
  { x: 5, z: 5.3, nature: "porte de la chambre 1 du Panoramique" },
  { x: 8, z: 5.3, nature: "porte de la chambre 2" },
  { x: 11, z: 5.3, nature: "porte de la chambre 3" },
  { x: 17, z: 5.3, nature: "grande porte du hall et du bar du Panoramique" },
  { x: 30.2, z: 8.5, nature: "porte de service de la cuisine (pignon est)" },
  { x: 9.69, z: 19.2, nature: "porte-fenêtre de la salle à manger, côté terrasse" },
  { x: 14.56, z: 19.2, nature: "porte-fenêtre de la salle à manger, côté terrasse" },
  { x: 39.91, z: -11.8, nature: "porte de la villa Les Mouettes" },
  { x: 36.5, z: -11.8, nature: "baie coulissante brisée du séjour de la villa" },
  { x: 88.1, z: 8.3, nature: "porte du cabanon du pêcheur, sur le palier de la crique" },
  { x: 100, z: 1.5, nature: "sortie B : la corniche continue vers le cap du phare et le port de pêche" },
];

const FOUILLE = [
  // La montée
  { x: -83.5, z: -12.4, quoi: "boutique de la station : bidons d'huile, cartes routières, briquets, ampoules de rechange" },
  { x: -82.2, z: -10.6, quoi: "comptoir de la station : caisse enregistreuse, porte-clés, chewing-gums durcis, piles" },
  { x: -78, z: -4.6, quoi: "la pompe connectée : fond de cuve (essence éventée), tuyau, petite batterie de l'écran" },
  { x: -80.9, z: -7.6, quoi: "fût d'huile et pneus à côté de la station : fond d'huile, chambre à air" },
  { x: -77.6, z: -9.0, quoi: "le pin d'Alep tombé sur l'aire de la station : le tas de bois personnel (on le débite : 10 bûches)" },
  { x: -61.3, z: -9.2, quoi: "abri du cantonnier : pelle, pioche, corde, gants, bougies" },
  { x: -58.3, z: -9.3, quoi: "sacs de sable et de sel de déneigement (sel : conserves, salaisons)" },
  { x: -69.4, z: 6, quoi: "la voiture coincée dans le pin, sous le muret arraché : couverture polaire, trousse de secours, valise (on y descend à la corde)" },
  // Le tunnel
  { x: -40, z: 2.2, quoi: "épave dans le tunnel : roue de secours, triangle, gilet, bouteille d'eau" },
  { x: -21.2, z: -3.2, quoi: "camp des pillards, derrière la barricade : couvertures polaires, réchaud, cordages, boîtes de conserve vides (et une pleine)" },
  { x: -13, z: 10, quoi: "table d'orientation : plaque de laiton (métal)" },
  { x: -13, z: 13.4, quoi: "lanterne solaire du belvédère : petite cellule solaire, accu, diode" },
  { x: -6.1, z: 5.4, quoi: "kiosque à glaces : congélateur (bac en inox), sirops, cornets, gobelets, parasol" },
  { x: -16, z: 14.6, quoi: "longue-vue à pièces : lentilles, petit mécanisme de laiton" },
  // Le Panoramique
  { x: 5.6, z: 9.0, quoi: "chambre 1 : literie (draps, oreillers), couverture polaire du lit" },
  { x: 4.6, z: 7.6, quoi: "chambre 1 : lavabo et trousse de toilette (fil dentaire, savon)" },
  { x: 8.6, z: 8.2, quoi: "chambre 2 : armoire (serviettes, couvertures polaires), valise oubliée" },
  { x: 7.6, z: 7.6, quoi: "chambre 2 : lavabo et trousse de toilette (fil dentaire, rasoir)" },
  { x: 11.6, z: 9.0, quoi: "chambre 3 : literie, couverture polaire, rideaux, lampe de chevet" },
  { x: 10.6, z: 7.6, quoi: "chambre 3 : lavabo et trousse de toilette (fil dentaire, coton)" },
  { x: 19.6, z: 8.6, quoi: "le bar : bouteilles (pastis, liqueurs), sirops, verres, tireuse" },
  { x: 14.2, z: 8.4, quoi: "la réception : clés, registre, tiroir-caisse, trousse de secours" },
  { x: 25.5, z: 8.4, quoi: "la cuisine : piano de cuisson, casseroles, couteaux, sel, huile d'olive" },
  { x: 23.2, z: 10.9, quoi: "étagères de la cuisine : conserves (sardines, tomates), farine, sucre" },
  { x: 29, z: 10.6, quoi: "chambre froide : bocaux, fûts, bâche isolante" },
  { x: 8, z: 12, quoi: "buffet de la salle : nappes, couverts d'argent, bougies" },
  { x: 10.5, z: 21.6, quoi: "feu des survivants sur la terrasse : couvertures polaires, marmite, bâche, cordages" },
  { x: 37.5, z: -16.5, quoi: "séjour de la villa : bar roulant (alcools), tourne-disque, couverture polaire, livres" },
  { x: 44.5, z: -20.4, quoi: "cuisine de la villa : conserves, café, bouteille de gaz, ustensiles" },
  { x: 44.2, z: -14.6, quoi: "chambre de la villa : draps, vêtements, pharmacie de voyage (médicaments)" },
  { x: 8, z: -8.4, quoi: "épave du parking : coffre (bâche, glacière, câbles de démarrage)" },
  // L'éboulement
  { x: 87, z: 8.6, quoi: "cabanon du pêcheur : filets, cordages, lignes, hameçons, nasses" },
  { x: 90.8, z: 5.6, quoi: "palier de la crique : bouée, gaffe, bidon d'eau de pluie" },
  { x: 81, z: -1.4, quoi: "épave au sortir de l'éboulement : couverture polaire, cric, trousse de secours" },
  { x: 55, z: -4.6, quoi: "borne Corniche+ : batterie, écran, petit panneau solaire" },
  // Le vrac de pierres (C3) : les blocs tombés au pied de la paroi, aux deux bouts de l'éboulement, et les murets écroulés
  { x: 59.8, z: -4.3, quoi: "vrac de pierres : blocs tombés de la paroi au pied de l'éboulement (pierres à bâtir, à ramasser)" },
  { x: 77.0, z: -4.3, quoi: "vrac de pierres : blocs tombés de la paroi au sortir de l'éboulement (pierres à bâtir, à ramasser)" },
  { x: -88.7, z: 7.2, quoi: "vrac de pierres : le muret écroulé à l'entrée de la corniche (pierres taillées du parapet)" },
  { x: -67.5, z: 5.2, quoi: "vrac de pierres : le muret arraché par la voiture (pierres du parapet)" },
  { x: -55.2, z: 4.4, quoi: "vrac de pierres : le muret écroulé avant le tunnel (pierres taillées du parapet)" },
  { x: -0.7, z: 3.9, quoi: "vrac de pierres : le muret écroulé au coin du belvédère (pierres taillées du parapet)" },
];

const ETEINTS = [
  { x: -90, z: 1.6, type: "errant (sur la route, à l'entrée de la corniche)" },
  { x: -83, z: -10.8, type: "ancien habitant (le pompiste, casquette et blouse)" },
  { x: -60, z: -8.2, type: "errant (devant l'abri du cantonnier)" },
  { x: -41, z: -2.2, type: "rampant (dans le noir du tunnel, sous l'épave)" },
  { x: -35, z: 1.6, type: "errant (dans le tunnel)" },
  { x: -15, z: 9, type: "errant (sur le belvédère, face à la mer)" },
  { x: 12, z: 15.5, type: "ancien habitant (le serveur, veste blanche, plateau)" },
  { x: 25, z: 9.8, type: "putréfié (dans la cuisine, près de la chambre froide)" },
  { x: 8.4, z: 9, type: "errant (dans la chambre 2)" },
  { x: 38, z: -18, type: "ancien habitant (la vacancière en peignoir, dans le séjour de la villa)" },
  { x: 68, z: -3.6, type: "errant (sur le ruban de l'éboulement : il faut le passer)" },
  { x: 89, z: 6.8, type: "rampant (sur le palier de la crique)" },
  { x: 95, z: 0.6, type: "errant (à la sortie de la corniche)" },
];

// Les pièces et les portes, pour la vision par pièce (T6) : boîtes centrées { x, z, l, p } (l en x, p en z) ; `dehors`
// est la pièce par défaut. Les largeurs sont celles mesurées entre les morceaux d'obstacle (1,2 m au moins).
const PIECES = {
  boutique: { nom: "la boutique de la station", sombre: false, boites: [{ x: -84, z: -11, l: 5, p: 4 }] },
  abri: { nom: "l'abri du cantonnier", sombre: true, boites: [{ x: -60, z: -8.5, l: 4.8, p: 3.4 }] },
  tunnel: { nom: "le tunnel du Cap Rouge", sombre: true, boites: [{ x: -39, z: 0, l: 18, p: 6.9 }] },
  kiosque: { nom: "le kiosque à glaces", sombre: false, boites: [{ x: -6.1, z: 5.4, l: 2.6, p: 2.2 }] },
  chambre1: { nom: "la chambre 1 du Panoramique", sombre: false, boites: [{ x: 5.5, z: 8.5, l: 3, p: 6 }] },
  chambre2: { nom: "la chambre 2 du Panoramique", sombre: false, boites: [{ x: 8.5, z: 8.5, l: 3, p: 6 }] },
  chambre3: { nom: "la chambre 3 du Panoramique", sombre: false, boites: [{ x: 11.5, z: 8.5, l: 3, p: 6 }] },
  hall: { nom: "le hall et le bar du Panoramique", sombre: false, boites: [{ x: 17, z: 8.5, l: 8, p: 6 }] },
  cuisine: { nom: "la cuisine du Panoramique", sombre: true, boites: [{ x: 25.5, z: 8.5, l: 9, p: 6 }] },
  salle: { nom: "la salle à manger vitrée", sombre: false, boites: [{ x: 17, z: 15.25, l: 26, p: 7.5 }] },
  sejour_villa: { nom: "le séjour de la villa Les Mouettes", sombre: false, boites: [{ x: 37.5, z: -17, l: 7, p: 10 }] },
  cuisine_villa: { nom: "la cuisine de la villa", sombre: false, boites: [{ x: 44, z: -19.5, l: 6, p: 5 }] },
  chambre_villa: { nom: "la chambre de la villa", sombre: false, boites: [{ x: 44, z: -14.5, l: 6, p: 5 }] },
  cabanon: { nom: "le cabanon du pêcheur", sombre: true, boites: [{ x: 86.2, z: 8.1, l: 3.2, p: 2.4 }] },
};

const PORTES = [
  { id: "station_boutique", x: -84.19, z: -9, largeur: 1.54, axe: "x", entre: ["dehors", "boutique"] },
  { id: "abri", x: -59.8, z: -6.8, largeur: 1.2, axe: "x", entre: ["dehors", "abri"] },
  { id: "tunnel_ouest", x: -48, z: 0, largeur: 6.55, axe: "z", entre: ["dehors", "tunnel"] },
  { id: "tunnel_est", x: -30, z: 0, largeur: 6.55, axe: "z", entre: ["tunnel", "dehors"] },
  { id: "kiosque", x: -6.29, z: 6.5, largeur: 1.49, axe: "x", entre: ["dehors", "kiosque"] },
  { id: "chambre1", x: 5, z: 5.5, largeur: 1.2, axe: "x", entre: ["dehors", "chambre1"] },
  { id: "chambre2", x: 8, z: 5.5, largeur: 1.6, axe: "x", entre: ["dehors", "chambre2"] },
  { id: "chambre3", x: 11, z: 5.5, largeur: 1.2, axe: "x", entre: ["dehors", "chambre3"] },
  { id: "hall", x: 17, z: 5.5, largeur: 2, axe: "x", entre: ["dehors", "hall"] },
  { id: "cuisine_service", x: 30, z: 8.5, largeur: 1.2, axe: "z", entre: ["dehors", "cuisine"] },
  { id: "hall_cuisine", x: 21, z: 9.7, largeur: 1.2, axe: "z", entre: ["hall", "cuisine"] },
  { id: "hall_salle", x: 16.8, z: 11.5, largeur: 1.6, axe: "x", entre: ["hall", "salle"] },
  { id: "cuisine_salle", x: 25.4, z: 11.5, largeur: 1.2, axe: "x", entre: ["cuisine", "salle"] },
  { id: "salle_terrasse_ouest", x: 9.69, z: 19, largeur: 1.62, axe: "x", entre: ["salle", "dehors"] },
  { id: "salle_terrasse_est", x: 14.56, z: 19, largeur: 1.62, axe: "x", entre: ["salle", "dehors"] },
  { id: "villa_baie", x: 36.75, z: -12, largeur: 3.15, axe: "x", entre: ["dehors", "sejour_villa"] },
  { id: "villa_porte", x: 39.91, z: -12, largeur: 1.58, axe: "x", entre: ["dehors", "sejour_villa"] },
  { id: "villa_cuisine", x: 41, z: -19.4, largeur: 1.2, axe: "z", entre: ["sejour_villa", "cuisine_villa"] },
  { id: "villa_chambre", x: 41, z: -14.6, largeur: 1.2, axe: "z", entre: ["sejour_villa", "chambre_villa"] },
  { id: "cabanon", x: 87.8, z: 8.3, largeur: 1.2, axe: "z", entre: ["dehors", "cabanon"] },
];

/** Les pièces d'un tronçon (une pièce va au tronçon qui contient le centre de sa première boîte), recentrées. */
function piecesTroncon(id) {
  const P = {};
  for (const [cle, p] of Object.entries(PIECES)) {
    if (!bande(X0[id])(p.boites[0].x)) continue;
    P[cle] = { ...p, boites: p.boites.map((q) => ({ ...q, x: arr(q.x - X0[id]) })) };
  }
  return P;
}

// Les objets nommés (T2, T3) : creer() les range dans groupe.userData.objets (ceux du tronçon construit). Le jeu montre,
// cache ou efface ; rien n'est animé. État de départ : `pin_entier`, `barricade_fermee` et `caisse_peage` visibles,
// `pin_debite` et `barricade_ouverte` cachés.
const OBJETS = {
  pin_entier: "le pin d'Alep tombé en travers de l'aire de la station, entier (le tas de bois personnel ; tronçon « montee », visible au départ)",
  pin_debite: "le même pin débité : souche, rondelles de tronc, branches élaguées, sciure (tronçon « montee », caché au départ)",
  caisse_peage: "la caisse du péage, au pied de la barricade du tunnel, côté ouest (tronçon « tunnel », visible)",
  barricade_fermee: "la porte de planches et de tôle qui ferme le passage de 2 m de la barricade (tronçon « tunnel », visible au départ)",
  barricade_ouverte: "la même porte, rabattue contre les sacs de sable : le passage est libre (tronçon « tunnel », cachée au départ)",
  panneau_sortie_ouest: "le panneau de sortie ouest et sa lanterne (tronçon « montee », visible)",
  panneau_sortie_est: "le panneau de sortie est et sa lanterne (tronçon « eboulement », visible)",
  alentours: "le décor au-delà du lot (R52) : la montagne au nord, le fond marin et la mer au sud ; aux deux bouts, la route qui continue et tourne derrière l'éperon (dans chaque tronçon, visible, sans obstacle)",
};

const TRONCONS = [
  {
    id: "montee",
    nom: "La montée",
    depart: { x: -98, z: 4 },
    description: "la corniche s'accroche à la falaise : la station-essence à une pompe, le panneau des selfie-points, l'abri du cantonnier, la glissière arrachée et la voiture coincée dans un pin",
  },
  {
    id: "tunnel",
    nom: "Le tunnel du Cap Rouge",
    depart: { x: -49.5, z: 1 },
    description: "le tunnel taillé dans l'éperon (goulet), sa barricade de pillards à la bouche est, puis le belvédère, sa table d'orientation, ses pins parasols et son kiosque à glaces",
  },
  {
    id: "panoramique",
    nom: "Le Panoramique",
    depart: { x: 1, z: 1 },
    description: "l'hôtel-restaurant des années 1960 accroché à la falaise (chambres, bar, cuisine, salle vitrée, terrasse à moitié tombée) et la villa des années 1970 dans son creux de rocher",
  },
  {
    id: "eboulement",
    nom: "L'éboulement",
    depart: { x: 52, z: -1 },
    description: "la moitié de la chaussée est partie à la mer : un ruban contre la paroi (goulet), l'épave sur les rochers, puis le palier de la crique et le cabanon du pêcheur",
  },
];

export const FICHE = {
  id: "halte-corniche",
  nom: "La corniche du Cap Rouge",
  lieu: "Halte · route du Littoral · entre l'anneau moyen et le lointain",
  environnement: "littoral (falaise sur la mer)",
  anneau: "moyen → lointain",
  danger: 3,
  halte: true,
  solPropre: true, // la falaise plonge sous y = 0 vers la mer, la paroi monte au nord : chaque tronçon fournit son sol
  recit:
    "La corniche du Cap Rouge était « certifiée 5 étoiles » : un selfie-point tous les deux cents mètres, et au Panoramique, rebaptisé Infinity Sunset Experience, un coucher de soleil premium sur abonnement. Le soleil se couche toujours, gratuitement, sur des bornes mortes et des glissières arrachées. Pour aller vers le cap, il n'y a que la route : le tunnel, où des pillards font payer le passage dans une caisse au pied de leur barricade, puis l'éboulement, où il ne reste qu'un ruban de bitume entre la paroi et quinze mètres de vide.",
  inspiration:
    "la corniche de l'Esterel et ses roches rouges, la route des Calanques, les corniches de la Côte d'Azur et de la côte amalfitaine, les hôtels-restaurants de bord de route des années 1960 aux salles vitrées sur la mer, les villas balnéaires des années 1970 et les photos urbex d'hôtels abandonnés en surplomb",
  reperes: [
    "La route en balcon : murets de pierre, glissières, la mer turquoise quinze mètres plus bas, l'écume au pied des rochers rouges",
    "Le grand panneau « Corniche panoramique : vue certifiée 5 étoiles, selfie-points tous les 200 m » et les bornes à selfie mortes le long de la route",
    "La station-essence à une pompe, sa pompe connectée « paiement par appli » qui luit encore la nuit, sa boutique et l'affiche de Watty",
    "La glissière arrachée et la voiture coincée dans un pin d'Alep, à flanc de falaise",
    "Le tunnel du Cap Rouge (goulet) : voûte brute, épave, et la barricade des pillards à la bouche est : une épave en travers, un mur de sacs de sable, la porte de planches et de tôle (le passage de 2 m) et la caisse du péage à son pied",
    "Le pin d'Alep tombé de la paroi en travers de l'aire de la station : le tas de bois du voyageur, qu'on débite (le tronc coupé en rondelles reste ensuite)",
    "Le vrac de pierres : les blocs tombés de la paroi aux deux bouts de l'éboulement et les murets écroulés du parapet",
    "Le belvédère : table d'orientation, bancs, longue-vue, lanterne solaire, pins parasols et kiosque à glaces",
    "Le Panoramique : chambres sur la route, hall et bar au juke-box, cuisine, salle à manger vitrée sur la mer, « Sunset Booth » premium",
    "L'enseigne « Infinity Sunset Experience » posée par-dessus la vieille enseigne « Le Panoramique », qui dépasse encore",
    "La terrasse en encorbellement : une moitié tient sur ses consoles, l'autre pend dans le vide ; le feu des survivants la nuit 🔥",
    "La villa Les Mouettes (années 1970) dans son creux de rocher : séjour au canapé rond, cuisine orange, écran domotique « Maison Sereine » qui luit encore",
    "L'éboulement (goulet) : la moitié de la chaussée partie à la mer, un ruban de 2,5 m entre la corde fixée à la paroi et la rubalise des passeurs au bord du vide, la borne « Corniche+ assistance 24/7 »",
    "L'épave sur les rochers, tout en bas, et l'escalier de pierre qui descend vers la crique (effondré sous le palier)",
    "Pins parasols, pins d'Alep tordus par le vent, agaves en fleur, figuiers de Barbarie, lauriers-roses et genêts",
    "Aux deux bouts, les panneaux de sortie et leur lanterne ; la route continue, puis tourne derrière un éperon de porphyre ; à l'est, le cap plonge dans la mer",
    "La montagne au-dessus de la corniche et la mer jusqu'à l'horizon : claire sur les hauts-fonds de la crique, sombre au large",
  ],
  lot: { l: 200, p: 70 },
  depart: { x: -98, z: 4 },
  goulets: [
    { x: -39, z: 0, nature: "tunnel du Cap Rouge : 18 m sous le rocher, puis la barricade des pillards à la bouche est (x = −25) : un passage de 2 m fermé par une porte, qui s'ouvre quand on a payé à la caisse (le péage)" },
    { x: 68, z: -3.6, nature: "éboulement : il ne reste qu'un ruban de 2,5 m entre la paroi et le vide, de x = 61 à x = 74 (mesuré entre les obstacles)" },
  ],
  // Les panneaux de sortie (R0-1) : 2,6 × 1,13 m (bas à 1,3 m), tournés vers la caméra sud-est (ry = π/4), la lanterne
  // au-dessus (0,45 m devant, à 2,85 m : x −96,18 z −0,15 à l'ouest, x 96,82 z −2,93 à l'est) ; objets panneau_sortie_*.
  panneaux: [
    { x: -96.5, z: -0.47, texte: "← Ton terrain · 3 km · Phare du cap, par le tunnel →", sortie: "ouest" },
    { x: -68, z: -5.4, texte: "Corniche panoramique : vue certifiée 5 étoiles, selfie-points tous les 200 m" },
    { x: 96.5, z: -3.25, texte: "Phare du cap · 2 km → · ← La corniche, ton terrain", sortie: "est" },
  ],
  // La mer (R0-3) : une seule matière pour le lot et les alentours, au niveau y = −15. On ne marche pas dans l'eau ici.
  mer: {
    peuProfonde: "eau claire et turquoise là où il y a moins de 1,6 m d'eau : les hauts-fonds devant la plage de la crique (sous le palier, x de 80 à 100) et quelques pieds de rochers",
    profonde: "eau sombre partout ailleurs (plus de 2,8 m d'eau : le pied de la falaise et le large) ; une ligne de brisants marque la limite, et l'écume le pied de la falaise",
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
    pieces: piecesTroncon(t.id),
    portes: versTroncon(PORTES, t.id),
  })),
  objets: OBJETS,
};

// ---------- Couleurs du lieu (méditerranéennes, passées au sel et au soleil) ----------

const ASPHALTE = 0x55565a;
const ASPHALTE_RAPIECE = 0x45464a;
const LIGNE = 0xdedad0;
const GRAVIER = 0xa59b88;
const ROC = 0xa2654a; // le porphyre rouge
const ROC_SOMBRE = 0x7c4a39;
const ROC_CLAIR = 0xbd8a69;
const CALCAIRE = 0xb8ab95;
const ROC_MOUILLE = 0x5a4038;
const TERRE = 0xb39a72;
const HERBE_SECHE = 0xa8a066;
const GARRIGUE = 0x8b8c56;
const GARRIGUE_SOMBRE = 0x6c7748;
const SABLE = 0xd9c7a0;
const FOND = 0x8f8468;
const MER = 0x2e7380;
const PIERRE = 0xc4b393; // pierre blonde des murets
const PIERRE_CHAPERON = 0xd2c4a8;
const ENDUIT = 0xe9e3d5;
const ENDUIT_ROSE = 0xe6cdb6;
const BLEU_60 = 0x6f9aa8; // le bleu des années 1960, passé
const CANARD = 0x3f7a7c;
const ORANGE_70 = 0xc0703a;
const BRUN_70 = 0x6b4a32;
const ALU = 0xa2a7a8;
const ACIER = 0x7d8487;
const FONTE = 0x37393a;
const BOIS = 0x8a6a48;
const BOIS_GRIS = 0x948a7a;
const TUILE = 0xb2654a;
const INOX = 0xb4b9bb;
const NAPPE = 0xe8e4da;
// Les couvertures polaires (T8) : couleurs vives, synthétiques, à peine passées
const POLAIRES = [0xd8467e, 0x2f8fd0, 0x8cc63e, 0xf07a2a, 0x7a52c8, 0x2fb8a8];

const HL = 3.0; // demi-largeur de la chaussée
const MER_Y = -15; // le niveau de la mer
const TX1 = -48; // le tunnel du Cap Rouge (bouches ouest et est)
const TX2 = -30;

// ---------- Outils de relief ----------

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

const lisse = (a, b, v) => Math.min(1, Math.max(0, (v - a) / (b - a)));

// L'axe de la route (z) : une longue courbe qui suit la côte, droite dans le tunnel.
const ZC = [[-101, 4], [-82, 3.5], [-62, 0.6], [-50, 0], [-28, 0], [-14, -1], [4, -1.4], [30, -1.2], [52, -1.5], [80, -1.5], [101, 1.5]];
const zc = (x) => interp(ZC, x);
const pente = (x) => (zc(x + 0.5) - zc(x - 0.5));

// Le bord de la falaise (z) : étroit le long de la route, l'éperon du tunnel, le belvédère, la corniche de l'hôtel,
// l'éboulement qui a mangé la moitié de la chaussée, le palier de la crique.
const ZR = [[-101, 8.8], [-88, 8.6], [-78, 7.6], [-66, 6.4], [-52, 5.6], [-48.5, 9], [-29.5, 9], [-27, 6.2], [-23, 7.6], [-20.5, 16.2], [-5.5, 16.2], [-3, 7], [0, 4.8], [2, 5.2], [3.4, 20.6], [31.4, 20.6], [33, 5.6], [45, 5], [56, 4.6], [59, 1.2], [61, -2.6], [74, -2.6], [76.5, 1.4], [79, 4.4], [82.5, 4.6], [84.4, 10.2], [93.2, 10.2], [95.2, 5.2], [101, 6]];
// Le pied de la paroi (z) : le creux de la station, celui de l'abri, le tunnel, le parking de l'hôtel, le creux de la villa.
const ZN = [[-101, -5], [-90, -5.2], [-88, -14], [-73.5, -14], [-71.5, -5], [-65, -5], [-63.6, -11], [-56, -11], [-54.5, -4.8], [-50, -4.4], [-48.5, -3.45], [-29.5, -3.45], [-28, -5], [-4, -5.6], [-1.5, -11.5], [21, -11.5], [23, -5.8], [30, -5.6], [32, -24.5], [49.5, -24.5], [51.5, -5.8], [101, -5.6]];

const enTunnel = (x) => x > TX1 - 0.5 && x < TX2 + 0.5;
const zoneNette = (x) => enTunnel(x) || (x > -21 && x < -5) || (x > 3 && x < 32) || (x > 84 && x < 93.5);
const zrBrut = (x) => interp(ZR, x) + (zoneNette(x) ? 0 : (x > 60 && x < 75 ? 1.2 : 0.6) * (bruit(x * 0.35, 7.5) - 0.5));
// Le ruban de l'éboulement (C4) : de x = 61 à x = 74, le bord du vide suit la paroi à 2,5 m juste entre les obstacles
// (paroi à zn + 0,35, vide à zr − 0,25) ; il s'évase aux deux bouts.
const RUBAN = 2.5;
const poidsRuban = (x) => lisse(59.6, 61, x) * (1 - lisse(74, 75.6, x));
const zr = (x) => {
  const w = poidsRuban(x);
  const z = zrBrut(x);
  return w > 0 ? z + (zn(x) + 0.6 + RUBAN - z) * w : z;
};
const zn = (x) => interp(ZN, x) + (enTunnel(x) ? 0 : 1.2 * (bruit(x * 0.25, 3.5) - 0.5));
/** La crique : la falaise s'adoucit en pente raide vers une petite plage. */
const crique = (x) => lisse(78, 83, x) * (1 - lisse(95, 99, x));

function distRoute(x, z) {
  const p = pente(x);
  return Math.abs(z - zc(x)) / Math.sqrt(1 + p * p);
}

function hauteur(x, z) {
  const d = distRoute(x, z);
  const r = zr(x);
  if (d < HL + 0.35 && z <= r) return 0;
  const n = zn(x);
  // L'éperon du tunnel : son dessus est coupé à hauteur d'allège (le reste du rocher est une couche qui s'efface)
  if (enTunnel(x) && z > zc(x) && z < r) return 1.2;
  if (z >= n && z <= r) return 0;
  if (z > r) {
    const e = z - r;
    const k = crique(x);
    let h = -(2.4 * Math.min(1, e / 0.5) + 15.6 * (1 - Math.exp(-e / 2.1))) - 1.6 * bruit(x * 0.4, z * 0.4) * Math.min(1, e / 2);
    if (k > 0) {
      // Une pente de rochers puis la plage de la crique, juste au-dessus de l'eau
      let hc = -14.4 * (1 - Math.exp(-e / 3.3)) - 0.8 * bruit(x * 0.5, z * 0.5) * Math.min(1, e / 3);
      if (e > 7) hc = Math.max(hc, -14.55 - Math.max(0, e - 11.5) * 0.45);
      h = h * (1 - k) + hc * k;
    }
    return Math.max(h, -20);
  }
  const e = n - z;
  return 2.2 * Math.min(1, e / 0.5) + 17 * (1 - Math.exp(-e / 5)) + 3 * (bruit(x * 0.27 + 40, z * 0.27) - 0.3) * Math.min(1, e / 2);
}

// Les emprises bâties : ni rocher, ni arbre, ni touffe.
const EMPRISES = [
  [-87, -73, -14, -2], // station-essence
  [-63, -56.8, -11, -5.8], // abri du cantonnier
  [-71, -65, -6.5, -4.2], // panneau des selfie-points
  [-21, -4.5, 3, 16], // belvédère
  [3.8, 31, 4.6, 25], // hôtel et terrasse
  [-1, 21, -11.5, -4.6], // parking de l'hôtel
  [33, 49, -23, -6], // villa et sa terrasse
  [83.5, 94, 3.4, 10.5], // palier de la crique
];
const libre = (x, z, m = 0.3) => !EMPRISES.some(([x1, x2, z1, z2]) => x > x1 - m && x < x2 + m && z > z1 - m && z < z2 + m);

// ---------- Matières ----------

const AL = 1024;
const AH = 1024;
const R = {
  corniche: [0, 0, 512, 192],
  panoramique: [0, 192, 512, 96],
  infinity: [0, 288, 512, 96],
  totem: [512, 256, 192, 320],
  selfie: [704, 256, 160, 160],
  pompe: [864, 256, 160, 160],
  orientation: [704, 416, 320, 320],
  watty: [0, 384, 256, 320],
  menu: [256, 384, 256, 160],
  station: [256, 544, 256, 96],
  cantonnier: [256, 640, 256, 64],
  tunnel: [0, 704, 512, 64],
  barricade: [512, 576, 192, 128],
  crique: [512, 736, 256, 96],
  eboulement: [768, 736, 256, 96],
  villa: [0, 768, 256, 64],
  domotique: [256, 768, 128, 128],
  sunset: [384, 768, 128, 128],
  glaces: [0, 832, 256, 96],
  travaux: [512, 832, 256, 96],
  parking: [768, 832, 256, 96],
  corniche_plus: [0, 928, 256, 96],
  chambre: [256, 896, 256, 64],
};

let MATS = null;

function matieres() {
  if (MATS) return MATS;
  const atlas = dessiner("corniche-atlas", AL, AH, dessinerAtlas, false);
  const ecume = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.9, transparent: true, opacity: 0.75, depthWrite: false });
  ecume.userData.sansOmbre = true;
  MATS = {
    mat: matiere(0.95, 0),
    satine: matiere(0.6, 0.05),
    lisse: matiere(0.3, 0.05),
    tole: matiere(0.75, 0.3),
    metal: matiere(0.4, 0.7),
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    lueur: matiereLueur(0xfff0c8, 0.16),
    pierre: matiereMonde("pierreTaille"),
    enduit: matiereMonde("enduit"),
    carrelage: matiereMonde("carrelage"),
    toile: MAT.toile(),
    // La mer : une seule matière (teinte blanche) ; la couleur de chaque nappe dit sa profondeur (R0-3)
    mer: matiereEau(0xffffff, 0.84),
    ecume,
    panneaux: new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.8, side: THREE.DoubleSide }),
    sorties: new THREE.MeshStandardMaterial({ map: dessiner("corniche-sorties", SL, SL, dessinerSorties, false), vertexColors: true, roughness: 0.75, metalness: 0.1 }),
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

const ROCHE = new THREE.DodecahedronGeometry(1, 0);
const BOULE = new THREE.IcosahedronGeometry(1, 0);
const FEUILLE = new THREE.ConeGeometry(1, 1, 4);
const ANNEAU = new THREE.TorusGeometry(1, 0.1, 3, 12);

function rocher(c, M, x, z, s, y = 0, ton = ROC) {
  c.poser(ROCHE, M.mat, ton, { x, y: y + s * 0.25, z, rx: c.entre(-0.4, 0.4), ry: c.hasard() * 3, rz: c.entre(-0.4, 0.4), e: [s * c.entre(1, 1.5), s * c.entre(0.55, 0.9), s * c.entre(0.9, 1.3)] }, { nuance: 0.12 });
}

/** Une épave de voiture des années 1960-70 (repère : centre au sol, avant vers +x). */
function voiture(c, M, x, y, z, ry, couleur, opts = {}) {
  const { rx = 0, rz = 0, roues = 4, vitres = true, capot = false, porte = false } = opts;
  c.repere({ x, y, z, ry, rx, rz }, () => {
    c.boite(3.9, 0.6, 1.66, couleur, { y: 0.6 }, M.satine, { nuance: 0.05 });
    c.boite(1.9, 0.56, 1.5, couleur, { x: -0.3, y: 1.18 }, M.satine, { nuance: 0.05 });
    if (vitres) c.boite(1.92, 0.4, 1.44, 0x2c3a40, { x: -0.3, y: 1.16 }, M.verre, { crasse: false });
    c.boite(0.08, 0.18, 1.5, INOX, { x: 1.98, y: 0.5 }, M.metal);
    c.boite(0.08, 0.18, 1.5, INOX, { x: -1.98, y: 0.5 }, M.metal);
    for (const s of [-1, 1]) c.poser(BOULE, M.lisse, 0xe8e2c8, { x: 1.95, y: 0.72, z: s * 0.55, e: 0.11 }, { crasse: false });
    if (capot) c.boite(1.1, 0.05, 1.55, couleur, { x: 1.5, y: 1.1, z: 0.1, rz: 0.9 }, M.satine);
    if (porte) c.boite(1.0, 0.85, 0.05, couleur, { x: 0.2, y: 0.85, z: 1.25, ry: -0.9 }, M.satine);
    const places = [[1.25, 0.78], [1.25, -0.78], [-1.25, 0.78], [-1.25, -0.78]];
    for (let i = 0; i < roues; i++) {
      const [px, pz] = places[i];
      cylindre(c, M.mat, 0x2a2a2a, px, 0.17, pz, 0.32, 0.32, 0.22, 8, { rx: Math.PI / 2, y: 0.32 }, { crasse: false });
    }
  });
}

function chaise(c, M, x, z, ry, renversee = false, couleur = BOIS, y = 0) {
  c.repere({ x, y, z, ry, rx: renversee ? Math.PI / 2 - 0.1 : 0 }, () => {
    const y0 = renversee ? 0.2 : 0;
    c.boite(0.44, 0.05, 0.44, couleur, { y: y0 + 0.46 }, M.satine);
    for (const [px, pz] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) c.boite(0.035, 0.46, 0.035, ALU, { x: px, y: y0 + 0.23, z: pz }, M.metal);
    c.boite(0.44, 0.42, 0.04, couleur, { y: y0 + 0.72, z: -0.2 }, M.satine);
  });
}

function tableRonde(c, M, x, z, r = 0.55, nappe = false) {
  cylindre(c, M.metal, FONTE, x, 0, z, 0.25, 0.3, 0.05, 8);
  cylindre(c, M.metal, FONTE, x, 0.05, z, 0.04, 0.04, 0.68, 5);
  cylindre(c, nappe ? M.toile : M.lisse, nappe ? NAPPE : 0xd8d2c4, x, 0.72, z, r, r, 0.04, 10);
  if (nappe) cylindre(c, M.toile, NAPPE, x, 0.42, z, r + 0.02, r + 0.06, 0.32, 10, {}, { crasse: false, nuance: 0.03 });
}

/** Une étagère contre un mur (face vers +z local), chargée d'objets. */
function etagere(c, M, x, z, ry, l, h, tons, plein = 0.7, couleur = BOIS_GRIS) {
  c.repere({ x, y: 0, z, ry }, () => {
    for (const s of [-1, 1]) c.boite(0.05, h, 0.38, couleur, { x: s * (l / 2), y: h / 2 }, M.mat);
    const n = Math.max(2, Math.round(h / 0.45));
    for (let k = 0; k < n; k++) {
      const y = 0.12 + (k * (h - 0.2)) / (n - 1);
      c.boite(l, 0.03, 0.38, couleur, { y }, M.mat);
      if (k === n - 1) continue;
      for (let xx = -l / 2 + 0.15; xx < l / 2 - 0.1; xx += 0.2) {
        if (c.hasard() > plein) continue;
        const hh = c.entre(0.12, 0.28);
        c.boite(0.13, hh, 0.15, tons[Math.floor(c.hasard() * tons.length)], { x: xx, y: y + 0.015 + hh / 2, z: c.entre(-0.05, 0.05), ry: c.entre(-0.3, 0.3) }, M.satine, { crasse: false, nuance: 0.1 });
      }
    }
  });
}

/** Un lit (tête vers −z local). */
function lit(c, M, x, z, ry, l = 1.4, couvre = 0xb8954a, defait = false) {
  c.repere({ x, y: 0, z, ry }, () => {
    c.boite(l, 0.35, 2.0, BOIS, { y: 0.18 }, M.mat);
    c.boite(l + 0.06, 0.9, 0.08, BOIS, { y: 0.45, z: -1.0 }, M.mat);
    c.boite(l - 0.06, 0.2, 1.9, 0xe2dccd, { y: 0.45 }, M.toile);
    c.boite(l - 0.3, 0.12, 0.38, 0xeee8da, { y: 0.6, z: -0.72 }, M.toile);
    if (defait) c.boite(l * 0.8, 0.08, 1.2, couvre, { x: 0.2, y: 0.58, z: 0.4, ry: 0.4 }, M.toile, { nuance: 0.06 });
    else c.boite(l + 0.04, 0.06, 1.4, couvre, { y: 0.58, z: 0.28 }, M.toile, { nuance: 0.06 });
  });
}

/**
 * Un mur en deux parties : le bas (jusqu'à `coupe`, dans le chantier principal, obstacle pour le jeu) et le haut,
 * dans la couche `k` qui s'efface (façades sud et est).
 */
function murDouble(ctx, k, a, bb, spec) {
  const { h, ep = 0.3, coupe = 1.05, bas, haut = bas, ouvertures = [], breches = [] } = spec;
  mur(ctx.c, a, bb, { h: coupe, ep, couleur: bas.couleur, mat: bas.mat, batiment: ctx.b, ouvertures: ouvertures.map((o) => ({ ...o, type: o.type === "porte" ? "porte" : "vide" })) });
  mur(k ?? ctx.c, a, bb, {
    h: h - coupe,
    y0: coupe,
    ep,
    couleur: haut.couleur,
    mat: haut.mat,
    breches,
    ouvertures: ouvertures.map((o) => ({ ...o, vantail: undefined, bas: Math.max(0, o.bas - coupe), haut: o.haut - coupe })),
  });
}

// ---------- Le terrain : paroi au nord, route en balcon, falaise et mer au sud ----------

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
      if (!enTunnel(x)) {
        if (i > 0 && i < nx) x += (hache(gi, j + 7) - 0.5) * 0.5;
        if (j > 0 && j < nz) z += (hache(gi + 3, j) - 0.5) * 0.5;
      }
      V.push([x, hauteur(x, z), z, distRoute(x, z)]);
    }
  }
  const classes = new Map();
  const ajouter = (coul, ...pts) => {
    let t = classes.get(coul);
    if (!t) classes.set(coul, (t = []));
    for (const p of pts) t.push(p[0], p[1], p[2]);
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
    ajouter(classe(x, y, z, n.y, Math.min(a[3], b2[3], c2[3])), a, b2, c2);
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
  // Les tranches du lot : une coupe de roche jusqu'à y = −21
  const tranche = (p, q) => {
    const a = [p[0], p[1], p[2]];
    const b2 = [q[0], q[1], q[2]];
    const a2 = [p[0], -21, p[2]];
    const b3 = [q[0], -21, q[2]];
    ajouter(0x5a4038, a, a2, b2, b2, a2, b3, a, b2, a2, b2, b3, a2);
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
  // La mer : claire où elle est peu profonde, sombre au large (la même matière que celle des alentours)
  nappe(c, M, x1, x2, -35, 35);
}

/** La teinte d'un triangle du terrain : accotement, garrigue, porphyre, rocher mouillé, plage, fond marin. */
function classe(x, y, z, ny, d) {
  const b = bruit(x * 0.18, z * 0.18);
  const b2 = bruit(x * 0.5 + 9, z * 0.5);
  if (Math.abs(y) < 0.06 && ny > 0.97) {
    if (d < HL + 0.6) return GRAVIER;
    return b > 0.62 ? HERBE_SECHE : b < 0.3 ? TERRE : GARRIGUE;
  }
  if (enTunnel(x) && y > 1 && y < 1.4) return b2 > 0.5 ? ROC_SOMBRE : ROC;
  if (y > 0) {
    if (ny < 0.55) return b2 > 0.55 ? ROC : b2 < 0.25 ? CALCAIRE : ROC_SOMBRE;
    if (y < 4) return b > 0.5 ? GARRIGUE : TERRE;
    return b2 > 0.6 ? ROC_CLAIR : b2 < 0.3 ? GARRIGUE_SOMBRE : GARRIGUE;
  }
  if (y < MER_Y - 0.7) return b2 > 0.6 ? 0x5e5848 : FOND;
  if (y < MER_Y + 1.1) {
    if (crique(x) > 0.5 && ny > 0.9) return SABLE;
    return ROC_MOUILLE;
  }
  if (crique(x) > 0.5 && ny > 0.8 && y < -13) return SABLE;
  if (ny < 0.5) return b2 > 0.5 ? ROC_SOMBRE : ROC;
  if (y > -2.5) return b > 0.5 ? GARRIGUE : ROC_CLAIR;
  return b2 > 0.4 ? ROC : GARRIGUE_SOMBRE;
}

// ---------- La route ----------

/** Les points de l'axe, tous les mètres, avec leur normale (+n vers le sud). */
const TRACE = (() => {
  const T = [];
  for (let x = -101; x <= 101; x++) {
    const p = pente(x);
    const l = Math.sqrt(1 + p * p);
    T.push({ x, z: zc(x), tx: 1 / l, tz: p / l, nx: -p / l, nz: 1 / l });
  }
  return T;
})();

/** La largeur de chaussée qui reste côté mer (l'éboulement l'a mangée). */
const bordMer = (x) => Math.min(HL, zr(x) - zc(x) - 0.2);

/** Un ruban le long de l'axe, entre les décalages o1(i) et o2(i), à la hauteur y, morceau par morceau. */
function ruban(ctx, o1, o2, y, couleur, mat, garder = () => true) {
  const pos = [];
  for (let i = 0; i < TRACE.length - 1; i++) {
    const p = TRACE[i];
    const q = TRACE[i + 1];
    if (!ctx.ici((p.x + q.x) / 2) || !garder(i)) continue;
    const a1 = o1(p.x);
    const a2 = o2(p.x);
    const b1 = o1(q.x);
    const b2 = o2(q.x);
    if (a2 - a1 < 0.04 && b2 - b1 < 0.04) continue;
    const A = [p.x + p.nx * a1, y, p.z + p.nz * a1];
    const B = [p.x + p.nx * Math.max(a1, a2), y, p.z + p.nz * Math.max(a1, a2)];
    const C = [q.x + q.nx * b1, y, q.z + q.nz * b1];
    const D = [q.x + q.nx * Math.max(b1, b2), y, q.z + q.nz * Math.max(b1, b2)];
    pos.push(...A, ...B, ...C, ...C, ...B, ...D);
  }
  if (!pos.length) return;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  // Normales vers le haut quel que soit le sens d'enroulement
  const n = g.attributes.normal;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  ctx.c.poser(g, mat, couleur, {}, { crasse: false, nuance: 0 });
  g.dispose();
}

function route(ctx) {
  const { c, M, u } = ctx;
  const cst = (v) => () => v;
  ruban(ctx, cst(-HL), bordMer, 0.03, ASPHALTE, M.mat);
  // Lignes de rive et axe en tirets, effacés par endroits
  ruban(ctx, cst(-HL + 0.25), cst(-HL + 0.4), 0.045, LIGNE, M.mat, (i) => hache(i, 1) > 0.15);
  ruban(ctx, (x) => Math.min(HL - 0.4, bordMer(x) - 0.4), (x) => Math.min(HL - 0.25, bordMer(x) - 0.25), 0.045, LIGNE, M.mat, (i) => hache(i, 2) > 0.15 && bordMer(TRACE[i].x) > HL - 0.1);
  ruban(ctx, cst(-0.07), (x) => Math.min(0.07, bordMer(x) - 0.3), 0.045, LIGNE, M.mat, (i) => i % 4 < 2 && hache(i, 3) > 0.25);
  // Sur le ruban de l'éboulement, le trait orange que les passeurs ont peint à la bombe, à un pas du vide
  ruban(ctx, (x) => bordMer(x) - 0.62, (x) => bordMer(x) - 0.48, 0.047, 0xe0903a, M.mat, (i) => TRACE[i].x >= 60 && TRACE[i].x < 75 && hache(i, 4) > 0.08);
  // Rapiéçages, fissures et nids-de-poule
  const A = aleatoire(431);
  for (let k = 0; k < 80; k++) {
    const i = Math.floor(A() * (TRACE.length - 1));
    const p = TRACE[i];
    const off = (A() - 0.5) * 5.2;
    const x = p.x + p.nx * off;
    const z = p.z + p.nz * off;
    const l = 0.6 + A() * 2.2;
    const pp = 0.4 + A() * 1.2;
    const coul = A() < 0.7 ? ASPHALTE_RAPIECE : 0x606164;
    if (!ctx.ici(x) || off > bordMer(p.x) - 0.6) continue;
    c.boite(l, 0.01, pp, coul, { x, y: 0.04, z, ry: A() * 0.3 }, M.mat, { crasse: false, nuance: 0.04 });
  }
  // Les cailloux tombés de la paroi et les aiguilles de pin, plus nombreux avec l'usure
  const B = aleatoire(77);
  for (let k = 0; k < 140 * u; k++) {
    const i = Math.floor(B() * (TRACE.length - 1));
    const p = TRACE[i];
    const off = -HL + B() * 2 * HL;
    const x = p.x + p.nx * off;
    const s = 0.08 + B() * B() * 0.4;
    const ton = B() < 0.6 ? ROC : ROC_CLAIR;
    if (!ctx.ici(x) || off > bordMer(p.x) - 0.3) continue;
    c.poser(ROCHE, M.mat, ton, { x, y: s * 0.3, z: p.z + p.nz * off, ry: B() * 3, e: [s * 1.3, s * 0.6, s] }, { nuance: 0.1 });
  }
}

// ---------- Les bords : murets, balustrades, glissières, soutènements ----------

/** Le genre de bord côté mer selon l'endroit. */
function typeBord(x, z) {
  if (x < -72.5) return "muret";
  if (x < -66) return "arrache"; // la voiture est passée par là
  if (x < TX1 - 0.5) return "muret";
  if (x < TX2 + 0.5) return null; // l'éperon du tunnel
  if (x < -21.5) return "muret";
  if (x < -4.4) return "balustrade";
  if (x < 3.2) return "muret";
  if (x < 31.6) return z > 19.4 ? null : "muret";
  if (x < 59.6) return "glissiere";
  if (x < 75.6) return "vide";
  if (x < 83.6) return "glissiere";
  if (x > 90.3 && x < 91.7 && z > 9) return null; // le portillon de l'escalier de la crique
  if (x < 94) return "balustrade";
  return "glissiere";
}

/** Les segments du bord côté mer, découpés une fois pour toute la halte (les raccords tombent juste). */
const SEGMENTS_SUD = (() => {
  const S = [];
  let A = [-100, zr(-100) - 0.55];
  for (let x = -99.75; x <= 100.001; x += 0.25) {
    const B = [x, zr(x) - 0.55];
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    if (L >= 1.0 || x > 99.9) {
      const xm = (A[0] + B[0]) / 2;
      const zm = (A[1] + B[1]) / 2;
      S.push({ a: A, b: B, xm, zm, type: typeBord(xm, zm), n: S.length });
      A = B;
    }
  }
  return S;
})();

// Les murets écroulés du parapet (C3, le vrac de pierres) : leurs pierres ont roulé sur l'accotement
const MURETS_ECROULES = [[-89.8, -87.6], [-56.5, -54], [-1.8, 0.4]];
const ecroule = (x) => MURETS_ECROULES.some(([a, bb]) => x > a && x < bb);

function bords(ctx) {
  const { c, b, M, u } = ctx;
  for (const s of SEGMENTS_SUD) {
    if (!ctx.ici(s.xm) || !s.type) continue;
    const [x1, z1] = s.a;
    const [x2, z2] = s.b;
    const i = s.n;
    if ((s.type === "muret" || s.type === "arrache") && ecroule(s.xm)) {
      // Il ne reste que le pied du muret ; les pierres taillées gisent devant, quelques-unes sont parties dans le vide
      boiteEntre(c, x1, z1, x2, z2, 0, 0.2 + hache(i, 42) * 0.18, 0.45, PIERRE, M.pierre, { nuance: 0.04 }, 0.06);
      for (let k = 0; k < 5; k++) {
        const t = hache(i * 5 + k, 46);
        const px = x1 + (x2 - x1) * t + (hache(i * 5 + k, 47) - 0.5) * 0.4;
        const pz = z1 + (z2 - z1) * t - 0.5 - hache(i * 5 + k, 48) * 1.1;
        c.boite(0.42, 0.24, 0.3, k % 3 ? PIERRE : PIERRE_CHAPERON, { x: px, y: 0.1, z: pz, rx: (hache(k, i) - 0.5) * 0.5, ry: hache(i, k + 50) * 3, rz: (hache(i, k + 51) - 0.5) * 0.5 }, M.pierre, { nuance: 0.05 });
      }
      gravats(c, s.xm, s.zm - 0.7, 0.8, 6, [PIERRE, PIERRE_CHAPERON, ROC]);
      c.boite(0.4, 0.22, 0.3, PIERRE, { x: s.xm, y: hauteur(s.xm, s.zm + 1.6) + 0.1, z: s.zm + 1.6, rx: 0.5, ry: i }, M.pierre);
      b.obstacle(x1, z1, x2, z2, "muret écroulé au-dessus de la falaise");
    } else if (s.type === "muret" || s.type === "arrache") {
      const arrache = s.type === "arrache";
      const brise = arrache || hache(i, 41) < 0.06 * u;
      const hh = arrache ? 0.18 + hache(i, 42) * 0.25 : brise ? 0.35 : 0.72 + hache(i, 43) * 0.06;
      boiteEntre(c, x1, z1, x2, z2, 0, hh, 0.45, PIERRE, M.pierre, { nuance: 0.03 }, 0.06);
      if (!brise) boiteEntre(c, x1, z1, x2, z2, hh, 0.1, 0.56, PIERRE_CHAPERON, M.pierre, { nuance: 0.03, crasse: false }, 0.06);
      if (brise && hache(i, 44) < 0.6) gravats(c, s.xm, s.zm + 0.6, 0.7, 5, [PIERRE, PIERRE_CHAPERON, ROC]);
      b.obstacle(x1, z1, x2, z2, arrache ? "muret arraché (bord de falaise)" : "muret au-dessus de la falaise");
    } else if (s.type === "balustrade") {
      // Pilastres de pierre, balustres tournés, main courante ; des balustres manquent avec l'usure
      boiteEntre(c, x1, z1, x2, z2, 0, 0.16, 0.42, PIERRE, M.pierre, { nuance: 0.03 }, 0.06);
      boiteEntre(c, x1, z1, x2, z2, 0.86, 0.12, 0.4, PIERRE_CHAPERON, M.pierre, { nuance: 0.03, crasse: false }, 0.06);
      const L = Math.hypot(x2 - x1, z2 - z1);
      const n = Math.max(1, Math.round(L / 0.3));
      for (let k = 0; k < n; k++) {
        if (hache(i * 7 + k, 45) < 0.12 * u) continue;
        const t = (k + 0.5) / n;
        cylindre(c, M.pierre, PIERRE_CHAPERON, x1 + (x2 - x1) * t, 0.16, z1 + (z2 - z1) * t, 0.06, 0.08, 0.7, 6, {}, { nuance: 0.03 });
      }
      if (i % 2 === 0) c.boite(0.34, 1.05, 0.34, PIERRE, { x: x1, y: 0.52, z: z1 }, M.pierre);
      b.obstacle(x1, z1, x2, z2, "balustrade au-dessus de la mer");
    } else if (s.type === "glissiere") {
      const tordu = hache(i, 31) < 0.2 * u;
      const dec = tordu ? (hache(i, 32) - 0.3) * 0.5 : 0;
      boiteEntre(c, x1, z1 + dec, x2, z2, 0.46 + (tordu ? -0.12 : 0), 0.3, 0.07, hache(i, 33) < 0.35 * u ? 0x8a6f5a : ACIER, M.tole, { nuance: 0.05 }, 0.06);
      if (i % 2 === 0) c.boite(0.1, 0.76, 0.1, ACIER, { x: x1, y: 0.38, z: z1 + 0.08, rz: tordu ? 0.2 : 0 }, M.tole);
      b.obstacle(x1, z1, x2, z2, "glissière au-dessus de la falaise");
    }
  }
  // Le pied de la paroi : un mur de soutènement là où la paroi serre la route, et la paroi notée pour le jeu
  const { xa, xb } = ctx;
  const x1 = Math.max(-100, xa);
  const x2 = Math.min(100, xb);
  for (let x = Math.ceil(x1); x < x2 - 0.01; x += 1) {
    const xm = x + 0.5;
    const serre = zc(xm) - HL - zn(xm) < 2.6 && !enTunnel(xm) && !(xm > 59 && xm < 77);
    if (serre) {
      const h = 1.6 + bruit(xm * 0.3, 1) * 0.6;
      boiteEntre(c, x, zn(x) + 0.12, x + 1, zn(x + 1) + 0.12, 0, h, 0.6, 0xb8a68a, M.pierre, { nuance: 0.03 }, 0.06);
      if (hache(x + 200, 5) < 0.25) c.boite(0.12, 0.12, 0.2, 0x3a3430, { x: xm, y: 0.35, z: zn(xm) + 0.4 }, M.mat, { crasse: false }); // barbacane
    }
    if (x % 2 === 0) b.obstacle(arr(x), arr(zn(x) + 0.35), arr(x + 2), arr(zn(x + 2) + 0.35), enTunnel(xm) ? "paroi du tunnel" : "paroi rocheuse");
  }
  // Le bord de la falaise, pour le jeu (sauf sous la terrasse du Panoramique, qui a ses propres garde-corps)
  for (let x = Math.ceil(x1); x < x2 - 0.01; x += 2) {
    if (x + 1 > 4.4 && x + 1 < 17.8) continue;
    const nature = x > 59 && x < 76 ? "chaussée effondrée (vide)" : enTunnel(x + 1) ? "rocher de l'éperon" : "bord de la falaise";
    b.obstacle(arr(x), arr(zr(x) - 0.25), arr(x + 2), arr(zr(x + 2) - 0.25), nature);
  }
  if (xa <= -100) {
    b.obstacle(-100, zn(-100), -100, zc(-100) - HL - 0.3, "paroi (bout de la halte)");
    b.obstacle(-100, zc(-100) + HL + 0.3, -100, zr(-100), "falaise (bout de la halte)");
  }
  if (xb >= 100) {
    b.obstacle(100, zn(100), 100, zc(100) - HL - 0.3, "paroi (bout de la halte)");
    b.obstacle(100, zc(100) + HL + 0.3, 100, zr(100), "falaise (bout de la halte)");
  }
}

// ---------- La végétation méditerranéenne ----------

const VERTS_PIN = [0x3f5e34, 0x4d6b3a, 0x587543];
const VERTS_ALEP = [0x6f8a4c, 0x5f7a42, 0x809a58];

/** Un pin parasol : fût nu qui se penche, grandes branches, houppier plat en ombrelle (`couronne` : son chantier, une couche qui s'efface si besoin). */
function pinParasol(c, M, x, z, h, y = 0, dir = 0.6, penche = 0.12, couronne = c) {
  const dx = Math.cos(dir) * penche * h;
  const dz = Math.sin(dir) * penche * h;
  const r = 0.14 + h * 0.014;
  const mi = [x + dx * 0.45, y + h * 0.5, z + dz * 0.45];
  const haut = [x + dx, y + h * 0.78, z + dz];
  c.tube([x, y - 0.3, z], mi, r, 0x6e5444, M.mat, 6);
  c.tube(mi, haut, r * 0.8, 0x6e5444, M.mat, 6);
  const R0 = h * 0.36;
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + c.hasard();
    const bout = [haut[0] + Math.cos(a) * R0 * 0.55, y + h * 0.9, haut[2] + Math.sin(a) * R0 * 0.55];
    couronne.tube(haut, bout, r * 0.45, 0x6e5444, M.mat, 4);
  }
  const n = 7;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + c.hasard() * 0.5;
    const rr = k === 0 ? 0 : R0 * c.entre(0.45, 0.75);
    const s = R0 * c.entre(0.42, 0.6);
    couronne.poser(BOULE, M.mat, VERTS_PIN[k % 3], { x: haut[0] + Math.cos(a) * rr, y: y + h * c.entre(0.93, 1.0), z: haut[2] + Math.sin(a) * rr, ry: c.hasard() * 3, e: [s, s * 0.3, s] }, { nuance: 0.07, crasse: false });
  }
}

/** Un pin d'Alep : tronc tordu par le vent, couché vers la mer, touffes claires et éparses. */
function pinAlep(c, M, x, z, h, y = 0, dir = Math.PI / 2, force = 0.5) {
  let p = [x, y - 0.3, z];
  const r = 0.09 + h * 0.016;
  const pts = [];
  for (let k = 1; k <= 3; k++) {
    const t = k / 3;
    const q = [x + Math.cos(dir) * force * h * t * t + c.entre(-0.3, 0.3), y + h * 0.75 * t, z + Math.sin(dir) * force * h * t * t + c.entre(-0.3, 0.3)];
    c.tube(p, q, r * (1.1 - t * 0.45), 0x6e5e4e, M.mat, 5);
    pts.push(q);
    p = q;
  }
  const n = 4 + Math.floor(c.hasard() * 2);
  for (let k = 0; k < n; k++) {
    const base = pts[1 + (k % 2)];
    const a = c.hasard() * Math.PI * 2;
    const lg = h * c.entre(0.18, 0.32);
    const bout = [base[0] + Math.cos(a) * lg + Math.cos(dir) * lg * 0.5, base[1] + h * c.entre(0.05, 0.22), base[2] + Math.sin(a) * lg + Math.sin(dir) * lg * 0.5];
    c.tube(base, bout, r * 0.35, 0x6e5e4e, M.mat, 3);
    const s = h * c.entre(0.12, 0.18);
    c.poser(BOULE, M.mat, VERTS_ALEP[k % 3], { x: bout[0], y: bout[1] + s * 0.2, z: bout[2], ry: c.hasard() * 3, e: [s * 1.3, s * 0.6, s * 1.1] }, { nuance: 0.08, crasse: false });
  }
}

/** Une agave : rosette de feuilles épaisses et pointues ; parfois sa hampe florale, sèche, comme un candélabre. */
function agave(c, M, x, z, s = 1, y = 0, hampe = false) {
  const n = 10;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + c.hasard() * 0.3;
    const incl = k % 2 ? 0.75 : 0.45;
    const L = s * c.entre(0.75, 1.0) * (k % 2 ? 0.85 : 1);
    c.repere({ x, y, z, ry: -a }, () => {
      c.poser(FEUILLE, M.satine, k % 3 === 0 ? 0x8fa58c : k % 3 === 1 ? 0x7c9a8c : 0x6d8a7c, { x: Math.sin(incl) * L * 0.5, y: Math.cos(incl) * L * 0.5, rz: -incl, e: [0.11 * s, L, 0.05 * s] }, { nuance: 0.05, crasse: false });
    });
  }
  if (hampe) {
    const H = s * 4;
    c.tube([x, y, z], [x + 0.2, y + H, z + 0.1], 0.05 * s, 0x8f7a58, M.mat, 4);
    for (let k = 0; k < 5; k++) {
      const yy = y + H * (0.55 + k * 0.09);
      const a = k * 2.1;
      const lg = 0.5 * s * (1 - k * 0.12);
      c.tube([x + 0.2 * (yy - y) / H, yy, z + 0.1 * (yy - y) / H], [x + Math.cos(a) * lg, yy + 0.25, z + Math.sin(a) * lg], 0.025, 0x8f7a58, M.mat, 3);
      c.poser(BOULE, M.mat, 0x9a8a50, { x: x + Math.cos(a) * lg, y: yy + 0.3, z: z + Math.sin(a) * lg, e: [0.16 * s, 0.1 * s, 0.16 * s] }, { crasse: false, nuance: 0.1 });
    }
  }
}

/** Un figuier de Barbarie : raquettes empilées en éventail, figues orangées sur les bords. */
function figuier(c, M, x, z, s = 1, y = 0) {
  const pad = (px, py, pz, ry, rz, k) => {
    c.poser(BOULE, M.satine, k % 2 ? 0x7f9d55 : 0x6d8b49, { x: px, y: py, z: pz, ry, rz, e: [0.3 * s, 0.4 * s, 0.07 * s] }, { nuance: 0.06, crasse: false });
    if (c.hasard() < 0.5) c.poser(BOULE, M.mat, 0xc8643a, { x: px + Math.cos(ry) * 0.1 * s, y: py + 0.42 * s, z: pz - Math.sin(ry) * 0.1 * s, e: 0.06 * s }, { crasse: false, nuance: 0.1 });
  };
  for (let k = 0; k < 3; k++) {
    const ry = k * 1.1 + c.hasard();
    const bx = x + c.entre(-0.3, 0.3) * s;
    const bz = z + c.entre(-0.3, 0.3) * s;
    pad(bx, y + 0.35 * s, bz, ry, 0, k);
    for (let j = 0; j < 2; j++) {
      const rz = (j ? 1 : -1) * c.entre(0.3, 0.6);
      pad(bx + Math.cos(ry) * Math.sin(rz) * -0.45 * s, y + 0.95 * s, bz - Math.sin(ry) * Math.sin(rz) * -0.45 * s, ry, rz, k + j);
      if (c.hasard() < 0.5) pad(bx + Math.cos(ry) * Math.sin(rz) * -0.9 * s, y + 1.5 * s, bz - Math.sin(ry) * Math.sin(rz) * -0.9 * s, ry, rz * 0.6, k + j + 1);
    }
  }
}

/** Un laurier-rose ou un genêt : touffe de feuillage piquée de fleurs. */
function buisson(c, M, x, z, s = 1, y = 0, fleur = 0xe08aa0, tons = [0x4f6a3e, 0x5d7845, 0x46603a]) {
  const n = 5;
  for (let k = 0; k < n; k++) {
    const t = s * c.entre(0.35, 0.55);
    c.poser(BOULE, M.mat, tons[k % tons.length], { x: x + c.entre(-0.5, 0.5) * s, y: y + t * 0.9 + c.hasard() * s * 0.5, z: z + c.entre(-0.5, 0.5) * s, ry: c.hasard() * 3, e: [t, t * 1.25, t] }, { nuance: 0.08, crasse: false });
  }
  for (let k = 0; k < 9; k++) {
    const a = c.hasard() * 6.3;
    const r = c.entre(0.3, 0.7) * s;
    c.poser(BOULE, M.mat, fleur, { x: x + Math.cos(a) * r, y: y + c.entre(0.6, 1.5) * s, z: z + Math.sin(a) * r, e: 0.09 * s }, { crasse: false, nuance: 0.08 });
  }
}
const laurier = (c, M, x, z, s, y) => buisson(c, M, x, z, s, y, c.hasard() < 0.7 ? 0xd98a9c : 0xeee4dc);
const genet = (c, M, x, z, s, y) => buisson(c, M, x, z, s * 0.8, y, 0xd8b83a, [0x6a7a3c, 0x5f6e36, 0x76863f]);

/** Les places des plantes et des rochers (tirées une fois pour toute la halte, puis filtrées par tronçon). */
const PLACES = (() => {
  const A = aleatoire(1962);
  const P = { alep: [], agaves: [], figuiers: [], genets: [], rochers: [], rochersMer: [], faces: [] };
  // Pins d'Alep : sur les vires de la paroi, et au bord de la falaise, couchés vers la mer
  for (let k = 0; k < 120; k++) {
    const x = -100 + A() * 200;
    const z = -35 + A() * 30;
    if (z > zn(x) - 2) continue;
    if (A() < 0.45) continue;
    P.alep.push({ x, z, h: 4 + A() * 4, dir: Math.PI / 2 + (A() - 0.5) * 0.8, force: 0.25 + A() * 0.3 });
  }
  for (let k = 0; k < 60; k++) {
    const x = -100 + A() * 200;
    const z = zr(x) - 1.2 - A() * 1.5;
    if (!libre(x, z, 1) || distRoute(x, z) < HL + 1.3 || enTunnel(x) || (x > 58 && x < 77)) continue;
    if (A() < 0.55) continue;
    P.alep.push({ x, z, h: 4.5 + A() * 3.5, dir: Math.PI / 2 + (A() - 0.5) * 0.5, force: 0.5 + A() * 0.4 });
  }
  // Agaves, figuiers, genêts sur les replats et les pentes
  for (let k = 0; k < 220; k++) {
    const x = -100 + A() * 200;
    const z = -35 + A() * 45;
    const h = hauteur(x, z);
    if (!libre(x, z, 0.8) || distRoute(x, z) < HL + 0.9) continue;
    if (h < -3 || (z > zr(x) - 0.8 && z < zr(x) + 0.5)) continue;
    const r = A();
    if (r < 0.32) P.agaves.push({ x, z, s: 0.7 + A() * 0.6, hampe: A() < 0.18 });
    else if (r < 0.45) P.figuiers.push({ x, z, s: 0.8 + A() * 0.5 });
    else if (h > 1) P.genets.push({ x, z, s: 0.8 + A() * 0.6 });
  }
  // Blocs au pied de la paroi
  for (let k = 0; k < 130; k++) {
    const x = -100 + A() * 200;
    const z = zn(x) + (A() - 0.4) * 2.6;
    if (!libre(x, z, 0.8) || distRoute(x, z) < HL + 0.7 || enTunnel(x)) continue;
    P.rochers.push({ x, z, s: 0.35 + A() * A() * 1.4 });
  }
  // Rochers plantés dans la face de la falaise (ils cassent la grille du terrain)
  for (let k = 0; k < 170; k++) {
    const x = -100 + A() * 200;
    const z = zr(x) + 0.6 + A() * 3.2;
    P.faces.push({ x, z, s: 0.6 + A() * 1.2 });
  }
  // Rochers dans l'eau, au pied de la falaise : l'écume les entoure
  for (let k = 0; k < 120; k++) {
    const x = -100 + A() * 200;
    const z = zr(x) + 3 + A() * (A() < 0.8 ? 5 : 14);
    P.rochersMer.push({ x, z, s: 0.7 + A() * A() * 2.2 });
  }
  return P;
})();

function nature(ctx) {
  const { c, M, u } = ctx;
  for (const p of PLACES.alep) {
    if (!ctx.ici(p.x)) continue;
    // C-3 : rien de haut au bord de la falaise entre la bouche du tunnel et le belvédère, qui cacherait la barricade
    if (p.x > -30 && p.x < -17 && p.z > 0) continue;
    pinAlep(c, M, p.x, p.z, p.h, hauteur(p.x, p.z) - 0.1, p.dir, p.force);
  }
  for (const p of PLACES.agaves) if (ctx.ici(p.x)) agave(c, M, p.x, p.z, p.s, hauteur(p.x, p.z), p.hampe);
  for (const p of PLACES.figuiers) if (ctx.ici(p.x)) figuier(c, M, p.x, p.z, p.s, hauteur(p.x, p.z));
  for (const p of PLACES.genets) if (ctx.ici(p.x)) genet(c, M, p.x, p.z, p.s, hauteur(p.x, p.z));
  for (const r of PLACES.rochers) if (ctx.ici(r.x)) rocher(c, M, r.x, r.z, r.s, hauteur(r.x, r.z) - r.s * 0.3, c.hasard() < 0.4 ? ROC_CLAIR : ROC);
  for (const r of PLACES.faces) {
    if (!ctx.ici(r.x)) continue;
    const y = hauteur(r.x, r.z);
    if (y > -0.8) continue;
    rocher(c, M, r.x, r.z, r.s, y - r.s * 0.4, c.hasard() < 0.5 ? ROC_SOMBRE : ROC);
  }
  for (const r of PLACES.rochersMer) {
    if (!ctx.ici(r.x)) continue;
    const y = Math.min(hauteur(r.x, r.z), MER_Y - 0.4);
    rocher(c, M, r.x, r.z, r.s, y - r.s * 0.2, c.hasard() < 0.5 ? ROC_MOUILLE : ROC_SOMBRE);
  }
  // Des touffes d'herbe sèche sur les replats et au pied des murets, plus nombreuses avec l'usure
  const A = aleatoire(ctx.x0 * 7 + 99);
  const pts = [];
  for (let k = 0; k < 90 + 70 * u; k++) {
    const x = ctx.xa + A() * 50;
    const z = -20 + A() * 42;
    if (!ctx.ici(x) || x < -100 || x > 100) continue;
    if (z < zn(x) + 0.3 || z > zr(x) - 0.3 || !libre(x, z, 0.3)) continue;
    if (distRoute(x, z) < HL + 0.15 && A() > 0.25 * u) continue;
    if (enTunnel(x)) continue;
    pts.push([x, z, 0]);
  }
  touffes(c, pts, PALETTE.herbeSeche);
}

/** L'écume : un chantier à part, animé (la houle monte et descend au pied des rochers). */
function ecume(ctx) {
  const { b, M } = ctx;
  const e = new Chantier(ctx.x0 * 3 + 5);
  const yE = MER_Y + 0.03;
  // Aux bouts, l'écume longe aussi le pied des éperons des alentours
  const x1 = ctx.xa <= -100 ? -150 : ctx.xa;
  const x2 = ctx.xb >= 100 ? 150 : ctx.xb;
  // Le long du pied de la falaise : là où le terrain passe sous l'eau
  for (let x = x1 + 0.6; x < x2; x += 1.3) {
    let z = zrA(x) + 0.5;
    while (z < 45 && hauteurA(x, z) > MER_Y + 0.05) z += 0.25;
    if (z >= 45) continue;
    e.boite(e.entre(1.2, 2.2), 0.04, e.entre(0.35, 0.8), 0xffffff, { x, y: yE, z: z + 0.25, ry: e.entre(-0.35, 0.35) }, M.ecume, { crasse: false, nuance: 0.05 });
    if (e.hasard() < 0.5) e.boite(e.entre(0.6, 1.4), 0.04, e.entre(0.2, 0.4), 0xffffff, { x: x + e.entre(-0.4, 0.4), y: yE, z: z + e.entre(1.0, 2.0), ry: e.entre(-0.4, 0.4) }, M.ecume, { crasse: false, nuance: 0.05 });
  }
  // Autour des rochers dans l'eau
  for (const r of PLACES.rochersMer) {
    if (!ctx.ici(r.x)) continue;
    const n = r.s > 1.6 ? 6 : 3;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + e.hasard();
      e.boite(e.entre(0.5, 1.0) * Math.min(r.s, 1.4), 0.04, e.entre(0.15, 0.35), 0xffffff, { x: r.x + Math.cos(a) * r.s * 1.2, y: yE + 0.005, z: r.z + Math.sin(a) * r.s, ry: -a + Math.PI / 2 }, M.ecume, { crasse: false, nuance: 0.05 });
    }
  }
  // La ligne de brisants (R0-3) : là où l'eau peu profonde (claire) rencontre l'eau profonde
  const PAS_B = 2.5;
  const nature = new Map();
  const eau = (i, j) => {
    const cle = i * 1000 + j;
    if (!nature.has(cle)) nature.set(cle, caseEau(i * PAS_B, j * PAS_B, PAS_B));
    return nature.get(cle);
  };
  for (let i = Math.round(x1 / PAS_B); i < Math.round(x2 / PAS_B); i++) {
    for (let j = -8; j < 20; j++) {
      if (eau(i, j) !== EAU_CLAIRE) continue;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const v = eau(i + di, j + dj);
        if (v !== EAU_MOYENNE && v !== EAU_PROFONDE) continue;
        const cx = (i + 0.5 + di * 0.5) * PAS_B;
        const cz = (j + 0.5 + dj * 0.5) * PAS_B;
        e.boite(PAS_B * e.entre(0.8, 1.1), 0.04, e.entre(0.3, 0.55), 0xffffff, { x: cx, y: yE + 0.008, z: cz, ry: (dj ? 0 : Math.PI / 2) + e.entre(-0.2, 0.2) }, M.ecume, { crasse: false, nuance: 0.05 });
      }
    }
  }
  // Les vagues : de longues crêtes blanches qui arrivent du large
  for (let i = 0; i < 12; i++) {
    const x = e.entre(x1 + 2, x2 - 2);
    const z = e.entre(Math.max(zrA(x) + 9, 18), 55);
    e.boite(e.entre(3, 7), 0.05, 0.22, 0xf4f6f4, { x, y: yE + 0.01, z, ry: e.entre(-0.12, 0.12) }, M.ecume, { crasse: false, nuance: 0 });
  }
  if (e.vide) return;
  const g = e.construire();
  g.name = "écume";
  g.userData.animer = (t) => {
    g.position.y = Math.sin(t * 0.9) * 0.07;
    g.position.z = Math.sin(t * 0.45) * 0.2;
    M.ecume.opacity = 0.55 + 0.3 * (0.5 + 0.5 * Math.sin(t * 0.9 + 1));
  };
  b.ajouter(g);
}

// ---------- Les alentours (R52, 0.10) : la montagne au-dessus, la falaise et la mer en contrebas, les deux bouts ----------
//
// Le relief continue au-delà du lot, en version légère (grille de 2,5 m, facettes) : au nord la montagne monte encore
// de trente mètres, au sud le fond marin s'en va sous la mer jusqu'à l'horizon. Aux deux bouts (60 m de plus), la route
// continue avec son muret, puis un éperon de porphyre se lève entre elle et la mer et la cache : elle tourne derrière
// la roche. À l'est, le cap plonge dans la mer (c'est la route du phare). Les coutures avec le lot reprennent ses
// sommets exacts (même grille, même désordre) : aucune fente. Tout cela va dans le groupe `alentours`, sans obstacle.

// Les tables prolongées (identiques à celles du lot entre −101 et 101)
const ZC_A = [[-170, -48], [-146, -21], [-139, -12.5], [-131, -5.5], [-122, -0.5], [-112, 2.6], ...ZC, [112, 0], [122, -3.5], [131, -9.5], [139, -17], [146, -26], [170, -56]];
const ZN_A = [[-170, -56], [-146, -29], [-139, -20], [-131, -12.5], [-122, -7.5], [-112, -5.8], ...ZN, [112, -6.5], [122, -10], [131, -16], [139, -24], [146, -33], [170, -64]];
const ZR_A = [[-170, 26], [-152, 24], [-138, 21], [-124, 16], [-112, 11], ...ZR, [112, 9], [124, 14], [138, 19], [152, 22], [170, 24]];
/** Où la route tourne derrière la roche (|x|) : au-delà, la roche se referme sur elle. */
const X_FIN = 138;
/** Les bouts des alentours : à l'ouest le bloc s'arrête (sa tranche regarde à l'opposé de la caméra) ; à l'est le cap plonge. */
const X_BOUT = 167.5;
const Z_NORD = -95;
const Z_SUD = 300;

const dedansX = (x) => Math.abs(x) <= 101;
const zcA = (x) => (dedansX(x) ? zc(x) : interp(ZC_A, x));
const znA = (x) => (dedansX(x) ? zn(x) : interp(ZN_A, x) + 1.2 * (bruit(x * 0.25, 3.5) - 0.5));
const zrA = (x) => (dedansX(x) ? zr(x) : interp(ZR_A, x) + 0.6 * (bruit(x * 0.35, 7.5) - 0.5));
const penteA = (x) => zcA(x + 0.5) - zcA(x - 0.5);

function distRouteA(x, z) {
  const p = penteA(x);
  return Math.abs(z - zcA(x)) / Math.sqrt(1 + p * p);
}

/** La montagne au-dessus du lot : elle continue de monter au nord, avec ses crêtes. */
function montagne(x, z) {
  const s = Z_NORD < z && z < -35 ? -35 - z : z <= Z_NORD ? -35 - Z_NORD : 0;
  if (s <= 0) return 0;
  const pente = s < 20 ? 0.0125 * s * s : 5 + 0.5 * (s - 20);
  return pente + lisse(0, 20, s) * 9 * (bruit(x * 0.045 + 5, z * 0.05 + 2) - 0.35) + lisse(4, 14, s) * 2.5 * (bruit(x * 0.2, z * 0.2) - 0.5);
}

/** La hauteur partout : celle du lot dedans, prolongée dehors (montagne, fond marin, bouts, éperons, cap). */
function hauteurA(x, z) {
  if (Math.abs(x) <= 100 && z >= -35 && z <= 35) return hauteur(x, z);
  const u = Math.abs(x);
  const fin = u > 100 ? lisse(X_FIN - 4, X_FIN + 6, u) : 0;
  const d = distRouteA(x, z);
  const r = zrA(x);
  const n = znA(x);
  if (fin <= 0 && d < HL + 0.35 && z <= r && z > n - 1) return 0;
  let h;
  if (z >= n && z <= r) h = 0;
  else if (z > r) {
    const e = z - r;
    const k = crique(x);
    h = -(2.4 * Math.min(1, e / 0.5) + 15.6 * (1 - Math.exp(-e / 2.1))) - 1.6 * bruit(x * 0.4, z * 0.4) * Math.min(1, e / 2);
    if (k > 0) {
      let hc = -14.4 * (1 - Math.exp(-e / 3.3)) - 0.8 * bruit(x * 0.5, z * 0.5) * Math.min(1, e / 3);
      if (e > 7) hc = Math.max(hc, -14.55 - Math.max(0, e - 11.5) * 0.45);
      h = h * (1 - k) + hc * k;
    }
    // Au-delà du lot, le fond descend vers le large (la plage de la crique ne file pas sous la mer)
    const g = lisse(35, 55, z);
    h = Math.max(h * (1 - g) - 19.6 * g, -20);
  } else {
    const e = n - z;
    h = 2.2 * Math.min(1, e / 0.5) + 17 * (1 - Math.exp(-e / 5)) + 3 * (bruit(x * 0.27 + 40, z * 0.27) - 0.3) * Math.min(1, e / 2);
    h += montagne(x, z);
  }
  if (u > 100) {
    // L'éperon : entre la route et le bord de la falaise, le porphyre se lève et cache la route qui tourne
    const w = lisse(108, 128, u);
    if (w > 0 && z > zcA(x) && z < r + 7) {
      const k = lisse(HL + 0.8, HL + 6, d) * (1 - lisse(r + 1, r + 7, z));
      const H = (5 + 10 * lisse(116, 140, u)) * (0.7 + 0.6 * bruit(x * 0.22, z * 0.22)) + 2.5 * (bruit(x * 0.6 + 3, z * 0.6) - 0.5);
      h = Math.max(h, w * k * H);
    }
    // La roche se referme sur la route, au-delà du virage
    if (fin > 0 && z > n - 3 && z < r + 7) {
      const k = 1 - lisse(r + 1, r + 7, z);
      h = Math.max(h, fin * k * (12 + 5 * bruit(x * 0.3 + 9, z * 0.3)));
    }
  }
  // À l'est, le cap plonge dans la mer (la route du phare passe derrière)
  if (x > 0) {
    const f = lisse(150, X_BOUT - 2, x);
    h = h * (1 - f) - 21 * f;
  }
  return h;
}

// ---------- La mer : une seule matière, plus claire où l'eau est peu profonde, plus sombre au large ----------

const EAU_CLAIRE = 0x67bdb2; // peu profonde (jusqu'aux genoux)
const EAU_MOYENNE = 0x3f8d96;
const EAU_PROFONDE = 0x2b6b7b; // le large
const PEU_PROFOND = 1.6; // m d'eau
const PROFOND = 2.8;

/** La nature de l'eau d'une case de `pas` m (coin x, z) : null si tout est terre, sinon claire, moyenne ou profonde. */
function caseEau(x, z, pas) {
  const hs = [hauteurA(x, z), hauteurA(x + pas, z), hauteurA(x, z + pas), hauteurA(x + pas, z + pas)];
  const hc = hauteurA(x + pas / 2, z + pas / 2);
  if (Math.min(hc, ...hs) > MER_Y + 0.3) return null;
  const p = MER_Y - hc;
  return p < PEU_PROFOND ? EAU_CLAIRE : p < PROFOND ? EAU_MOYENNE : EAU_PROFONDE;
}

const PLAN_EAU = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

/** Une nappe d'eau sur un rectangle : des cases de `pas` m, regroupées par bandes de même teinte. */
function nappe(c, M, x1, x2, z1, z2, pas = 2.5) {
  const nx = Math.round((x2 - x1) / pas);
  const nz = Math.round((z2 - z1) / pas);
  for (let j = 0; j < nz; j++) {
    const z = z1 + j * pas;
    let debut = 0;
    let prec = caseEau(x1, z, pas);
    for (let i = 1; i <= nx; i++) {
      const t = i < nx ? caseEau(x1 + i * pas, z, pas) : undefined;
      if (t === prec) continue;
      if (prec) c.poser(PLAN_EAU, M.mer, prec, { x: x1 + ((debut + i) / 2) * pas, y: MER_Y, z: z + pas / 2, e: [(i - debut) * pas, 1, pas] }, { crasse: false, nuance: 0 });
      debut = i;
      prec = t;
    }
  }
}

/** Un grand rectangle de mer du large, et le fond dessous. */
function large(c, M, x1, z1, x2, z2, fond = true) {
  c.poser(PLAN_EAU, M.mer, EAU_PROFONDE, { x: (x1 + x2) / 2, y: MER_Y, z: (z1 + z2) / 2, e: [x2 - x1, 1, z2 - z1] }, { crasse: false, nuance: 0 });
  if (fond) c.poser(PLAN_EAU, M.mat, FOND, { x: (x1 + x2) / 2, y: -20.3, z: (z1 + z2) / 2, e: [x2 - x1, 1, z2 - z1] }, { crasse: false, nuance: 0 });
}

// ---------- Le relief des alentours ----------

/** Un sommet du lot, exactement (la grille de terrain() : pas de 1,25 m, désordre déterministe). */
function sommetLot(gi, j) {
  let x = -100 + gi * 1.25;
  let z = -35 + j * 1.25;
  if (!enTunnel(x)) {
    if (gi % 40 !== 0) x += (hache(gi, j + 7) - 0.5) * 0.5;
    if (j > 0 && j < 56) z += (hache(gi + 3, j) - 0.5) * 0.5;
  }
  return [x, hauteur(x, z), z, distRoute(x, z)];
}

const sommetA = (x, z) => [x, hauteurA(x, z), z, distRouteA(x, z)];

/** Le relief en facettes : triangles classés par teinte (une matière, un appel). */
function facettes() {
  const classes = new Map();
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const tri = (a, b2, c2) => {
    va.set(b2[0] - a[0], b2[1] - a[1], b2[2] - a[2]);
    vb.set(c2[0] - a[0], c2[1] - a[1], c2[2] - a[2]);
    const n = va.cross(vb);
    const L = n.length();
    if (L < 1e-6) return;
    n.divideScalar(L);
    if (n.y < 0) {
      n.negate();
      [b2, c2] = [c2, b2];
    }
    const coul = classe((a[0] + b2[0] + c2[0]) / 3, (a[1] + b2[1] + c2[1]) / 3, (a[2] + b2[2] + c2[2]) / 3, n.y, Math.min(a[3], b2[3], c2[3]));
    let t = classes.get(coul);
    if (!t) classes.set(coul, (t = []));
    for (const p of [a, b2, c2]) t.push(p[0], p[1], p[2]);
  };
  /** Une grille de sommets (lignes × colonnes). */
  const grille = (V) => {
    for (let j = 0; j < V.length - 1; j++) {
      for (let i = 0; i < V[j].length - 1; i++) {
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
  };
  /** Une couture entre deux lignes de sommets triées le long de l'axe k (0 : x, 2 : z). */
  const couture = (P, Q, k) => {
    let i = 0;
    let j = 0;
    while (i < P.length - 1 || j < Q.length - 1) {
      if (j >= Q.length - 1 || (i < P.length - 1 && P[i + 1][k] <= Q[j + 1][k])) {
        tri(P[i], P[i + 1], Q[j]);
        i++;
      } else {
        tri(P[i], Q[j + 1], Q[j]);
        j++;
      }
    }
  };
  const poser = (c, mat) => {
    for (const [coul, pos] of classes) {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.computeVertexNormals();
      c.poser(g, mat, coul, {}, { crasse: false, nuance: 0 });
      g.dispose();
    }
  };
  return { tri, grille, couture, poser };
}

const PAS_A = 2.5;
const RANGS_NORD = [-37.5, -40, -43, -47, -52, -58, -65, -73, -83, Z_NORD];
const RANGS_SUD = [37.5, 40, 44, 50, 62, Z_SUD];
// Aux bouts, des rangs qui suivent la route : au nord depuis son bord, au sud depuis son bord
const DEC_NORD = [0, 1.5, 3.2, 4.4, 5.4, 6.6, 8, 10, 13, 17, 22, 29, 38, 50, 66];
const DEC_SUD = [0, 0.6, 1.5, 2.8, 4.5, 6.5, 9, 12, 16, 21, 27, 35, 47, 66];

function rangsBout(x) {
  const z0 = zcA(x);
  const p = penteA(x);
  const k = Math.sqrt(1 + p * p); // la route tourne : ses bords s'écartent en z
  const zs = [Z_NORD];
  for (let i = DEC_NORD.length - 1; i >= 0; i--) zs.push(Math.max(Z_NORD + 0.5, z0 - (HL + 0.35) * k - DEC_NORD[i]));
  zs.push(z0);
  for (const o of DEC_SUD) zs.push(z0 + (HL + 0.35) * k + o);
  zs.push(Z_SUD);
  for (let k = 1; k < zs.length; k++) zs[k] = Math.max(zs[k], zs[k - 1] + 0.05);
  return zs;
}

/** Le ruban d'une route prolongée (de |x| = 101 à la fin), entre les décalages o1 et o2 de l'axe, à la hauteur y. */
function rubanBout(c, mat, s, o1, o2, y, couleur, garder = () => true) {
  const pos = [];
  for (let k = 0, u = 101; u < X_FIN; u += 1, k++) {
    if (!garder(k)) continue;
    const pts = [u, u + 1].map((v) => {
      const x = s * v;
      const p = penteA(x);
      const l = Math.sqrt(1 + p * p);
      return { x, z: zcA(x), nx: -p / l, nz: 1 / l };
    });
    const [p, q] = s > 0 ? pts : [pts[1], pts[0]];
    pos.push(p.x + p.nx * o1, y, p.z + p.nz * o1, p.x + p.nx * o2, y, p.z + p.nz * o2, q.x + q.nx * o1, y, q.z + q.nz * o1);
    pos.push(q.x + q.nx * o1, y, q.z + q.nz * o1, p.x + p.nx * o2, y, p.z + p.nz * o2, q.x + q.nx * o2, y, q.z + q.nz * o2);
  }
  if (!pos.length) return;
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  const n = g.attributes.normal;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  c.poser(g, mat, couleur, {}, { crasse: false, nuance: 0 });
  g.dispose();
}

function alentours(ctx) {
  const { M, xa, xb } = ctx;
  const a = new Chantier(ctx.x0 * 11 + 3);
  const F = facettes();
  const x1 = Math.max(-100, xa);
  const x2 = Math.min(100, xb);
  const g1 = Math.round((x1 + 100) / 1.25);
  const g2 = Math.round((x2 + 100) / 1.25);
  const colonnes = [];
  for (let x = x1; x <= x2 + 0.01; x += PAS_A) colonnes.push(x);

  // La montagne au nord, cousue au bord nord du lot
  const nord = [...RANGS_NORD].reverse().map((z) => colonnes.map((x) => sommetA(x, z)));
  F.grille(nord);
  const bordNord = [];
  for (let gi = g1; gi <= g2; gi++) bordNord.push(sommetLot(gi, 0));
  F.couture(bordNord, nord[nord.length - 1], 0);
  // Le fond marin au sud, cousu au bord sud du lot
  const sud = RANGS_SUD.map((z) => colonnes.map((x) => sommetA(x, z)));
  F.grille(sud);
  const bordSud = [];
  for (let gi = g1; gi <= g2; gi++) bordSud.push(sommetLot(gi, 56));
  F.couture(bordSud, sud[0], 0);
  // La mer au sud du lot
  nappe(a, M, x1, x2, 35, 60);
  large(a, M, x1, 60, x2, Z_SUD, false);

  // Les bouts : la route continue, l'éperon la cache, la montagne et le cap
  for (const s of [-1, 1]) {
    if (!(s < 0 ? xa <= -100 : xb >= 100)) continue;
    const xs = [];
    for (let u = 100 + PAS_A; u <= X_BOUT + 0.01; u += PAS_A) xs.push(s * u);
    const V = xs.map((x) => rangsBout(x).map((z) => sommetA(x, z)));
    // Lignes = rangs, colonnes = x (du lot vers le dehors)
    const L = V[0].map((_, j) => V.map((col) => col[j]));
    F.grille(L);
    // La couture avec le lot et ses deux bandes, le long de x = ±100
    const xl = s * 100;
    const P = [
      ...[...RANGS_NORD].reverse().map((z) => sommetA(xl, z)),
      ...Array.from({ length: 57 }, (_, j) => sommetLot(s < 0 ? 0 : 160, j)),
      ...RANGS_SUD.map((z) => sommetA(xl, z)),
    ];
    F.couture(P, V[0], 2);
    // La route prolongée : l'asphalte, ses lignes, le muret de pierre tant que la falaise borde la route
    rubanBout(a, M.mat, s, -HL, HL, 0.03, ASPHALTE);
    rubanBout(a, M.mat, s, -HL + 0.25, -HL + 0.4, 0.045, LIGNE, (k) => hache(k, 11) > 0.15);
    rubanBout(a, M.mat, s, HL - 0.4, HL - 0.25, 0.045, LIGNE, (k) => hache(k, 12) > 0.15);
    rubanBout(a, M.mat, s, -0.07, 0.07, 0.045, LIGNE, (k) => k % 4 < 2 && hache(k, 13) > 0.25);
    for (let u = 100; u < 120; u += 1) {
      const xm = s * (u + 0.5);
      const zm = zrA(xm) - 0.55;
      if (hauteurA(xm, zm) > 0.15 || hauteurA(xm, zm + 0.5) > 0.4) continue;
      const xA = s * u;
      const xB = s * (u + 1);
      const brise = hache(u, 41 + s) < 0.07;
      const h = brise ? 0.35 : 0.72 + hache(u, 43) * 0.06;
      boiteEntre(a, xA, zrA(xA) - 0.55, xB, zrA(xB) - 0.55, 0, h, 0.45, PIERRE, M.pierre, { nuance: 0.03 }, 0.06);
      if (!brise) boiteEntre(a, xA, zrA(xA) - 0.55, xB, zrA(xB) - 0.55, h, 0.1, 0.56, PIERRE_CHAPERON, M.pierre, { nuance: 0.03, crasse: false }, 0.06);
    }
    // Quelques pins d'Alep sur l'éperon et la montagne, couchés vers la mer
    const A = aleatoire(s > 0 ? 7171 : 7272);
    for (let k = 0; k < 3; k++) {
      const x = s * (104 + A() * 44);
      const z = k < 2 ? zcA(x) + HL + 3 + A() * 10 : znA(x) - 3 - A() * 30;
      const y = hauteurA(x, z);
      if (y < 0.5 || distRouteA(x, z) < HL + 2) continue;
      pinAlep(a, M, x, z, 4 + A() * 3, y - 0.2, Math.PI / 2 + (A() - 0.5) * 0.8, 0.3 + A() * 0.3);
    }
    // La mer aux bouts : près de la côte en cases, au large en grands rectangles
    const xi = s < 0 ? -X_BOUT : 100;
    const xe = s < 0 ? -100 : X_BOUT;
    nappe(a, M, xi, xe, s < 0 ? 0 : Z_NORD, 60);
    if (s < 0) {
      large(a, M, -X_BOUT, 60, -100, Z_SUD, false);
      large(a, M, -450, 30, -X_BOUT, Z_SUD);
    } else {
      large(a, M, 100, 60, X_BOUT, Z_SUD, false);
      large(a, M, X_BOUT, Z_NORD - 40, 450, Z_SUD);
    }
  }
  // Quelques pins sur la montagne, au-dessus du lot
  const B = aleatoire(ctx.x0 * 13 + 5);
  for (let k = 0; k < 2; k++) {
    const x = x1 + 4 + B() * (x2 - x1 - 8);
    const z = -40 - B() * 25;
    pinAlep(a, M, x, z, 4 + B() * 3, hauteurA(x, z) - 0.2, Math.PI / 2 + (B() - 0.5) * 0.8, 0.3 + B() * 0.2);
  }
  F.poser(a, M.mat);
  const g = a.construire();
  g.name = "alentours";
  g.userData.nom = "alentours";
  for (const m of g.children) m.castShadow = false;
  ctx.b.ajouter(g);
  ctx.objets.alentours = g;
}

// ---------- Les panneaux de sortie (R0-1) : grands, tournés vers la caméra, une lanterne au-dessus ----------

const SL = 1024;
const RS = { ouest: [0, 0, 1024, 448], est: [0, 448, 1024, 448], alu: [0, 896, 256, 128], fer: [256, 896, 256, 128], dos: [512, 896, 256, 128] };
const SORTIES = {
  ouest: {
    x: -96.5,
    lignes: ["← Ton terrain · 3 km", "Phare du cap, par le tunnel →"],
    texte: "← Ton terrain · 3 km · Phare du cap, par le tunnel →",
    sortie: "ouest (entrée A) : la corniche repart vers ton terrain",
  },
  est: {
    x: 96.5,
    lignes: ["Phare du cap · 2 km →", "← La corniche, ton terrain"],
    texte: "Phare du cap · 2 km → · ← La corniche, ton terrain",
    sortie: "est (sortie B) : la corniche continue vers le phare du cap",
  },
};
/** Le panneau : sur l'accotement nord, à 1,4 m de l'axe de la ligne de rive, tourné vers la caméra sud-est. */
const zSortie = (x) => arr(zc(x) - HL - 1.4);
const RY_SORTIE = Math.PI / 4;
/** La lanterne : 0,45 m devant le panneau, au-dessus de son bord haut (repère du panneau). */
const LANTERNE = { y: 2.85, avant: 0.45 };

function dessinerSorties(g) {
  g.fillStyle = "#6a6c6c";
  g.fillRect(0, 0, SL, SL);
  const a = aleatoire(97);
  for (const cote of ["ouest", "est"]) {
    region(g, RS[cote], (l, h) => {
      g.fillStyle = "#f1ede2";
      g.fillRect(0, 0, l, h);
      g.strokeStyle = "#1e1d1b";
      g.lineWidth = 16;
      g.strokeRect(22, 22, l - 44, h - 44);
      const [l1, l2] = SORTIES[cote].lignes;
      texte(g, l1, l / 2, h * 0.32, 136, "#1e1d1b", { max: l - 80 });
      texte(g, l2, l / 2, h * 0.7, 124, "#1e1d1b", { max: l - 80 });
      salir(g, a, l, h, 7, 0.1);
    });
  }
  for (const [r, coul] of [[RS.alu, "#a2a7a8"], [RS.fer, "#2c2a28"], [RS.dos, "#8c9091"]]) {
    g.fillStyle = coul;
    g.fillRect(r[0], r[1], r[2], r[3]);
  }
}

/** Les UV d'une géométrie : toute sur une pastille unie de la texture des sorties, sauf la face avant d'une boîte. */
function uvSorties(geo, pastille, avant = null) {
  const uv = geo.attributes.uv;
  const cx = (pastille[0] + pastille[2] / 2) / SL;
  const cy = 1 - (pastille[1] + pastille[3] / 2) / SL;
  for (let i = 0; i < uv.count; i++) {
    if (avant && Math.floor(i / 4) === 4) {
      const [px, py, pw, ph] = avant;
      uv.setXY(i, (px + uv.getX(i) * pw) / SL, 1 - (py + (1 - uv.getY(i)) * ph) / SL);
    } else uv.setXY(i, cx, cy);
  }
  return geo;
}

/** Une barre de fer d'un point à un autre (repère courant), de section e × e. */
function barre(ch, a, bb, e) {
  const A = new THREE.Vector3(...a);
  const d = new THREE.Vector3(...bb).sub(A);
  const L = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  const r = new THREE.Euler().setFromQuaternion(q);
  const geo = uvSorties(new THREE.BoxGeometry(e, L, e), RS.fer);
  ch.poser(geo, MATS.sorties, 0xffffff, { x: A.x + d.x / 2, y: A.y + d.y / 2, z: A.z + d.z / 2, rx: r.x, ry: r.y, rz: r.z }, { crasse: false, nuance: 0 });
  geo.dispose();
}

function panneauSortie(ctx, cote) {
  const P = SORTIES[cote];
  if (!ctx.ici(P.x)) return;
  const { M, b } = ctx;
  const z = zSortie(P.x);
  const L = 2.6;
  const H = 1.13;
  const yB = 1.86; // le milieu du panneau (de 1,3 à 2,4 m)
  const poser = (ch, geo, pose) => {
    ch.poser(geo, M.sorties, 0xffffff, pose, { crasse: false, nuance: 0 });
    geo.dispose();
  };
  objetNomme(ctx, `panneau_sortie_${cote}`, cote === "ouest" ? 951 : 952, (ch) =>
    ch.repere({ x: P.x, y: 0, z, ry: RY_SORTIE }, () => {
      // Les deux poteaux ; celui de droite monte plus haut et porte la potence
      for (const sx of [-1, 1]) {
        const h = sx > 0 ? 3.2 : 2.5;
        poser(ch, uvSorties(new THREE.BoxGeometry(0.09, h, 0.09), RS.alu), { x: sx * 1.05, y: h / 2, z: -0.07 });
      }
      // Le panneau, son dos galvanisé et ses deux raidisseurs
      poser(ch, uvSorties(new THREE.BoxGeometry(L, H, 0.05), RS.dos, RS[cote]), { y: yB });
      for (const y of [yB - 0.34, yB + 0.34]) poser(ch, uvSorties(new THREE.BoxGeometry(L - 0.2, 0.06, 0.04), RS.alu), { y, z: -0.045 });
      // La potence : un bras de fer du haut du poteau jusqu'au-dessus du milieu du panneau, devant, et sa jambe de force
      barre(ch, [1.05, 3.13, -0.07], [0, 3.13, LANTERNE.avant], 0.04);
      barre(ch, [1.05, 2.66, -0.07], [0.5, 3.13, LANTERNE.avant / 2 - 0.02], 0.03);
      // La lanterne pendue : crochet, chapeau, cadre, socle, et le verre qui luit la nuit
      ch.repere({ x: 0, y: LANTERNE.y, z: LANTERNE.avant }, () => {
        poser(ch, uvSorties(new THREE.BoxGeometry(0.02, 0.14, 0.02), RS.fer), { y: 0.2 });
        poser(ch, uvSorties(new THREE.ConeGeometry(0.15, 0.12, 4).rotateY(Math.PI / 4), RS.fer), { y: 0.17 });
        poser(ch, uvSorties(new THREE.BoxGeometry(0.2, 0.03, 0.2), RS.fer), { y: 0.11 });
        poser(ch, uvSorties(new THREE.BoxGeometry(0.18, 0.04, 0.18), RS.fer), { y: -0.12 });
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) poser(ch, uvSorties(new THREE.BoxGeometry(0.02, 0.22, 0.02), RS.fer), { x: sx * 0.08, z: sz * 0.08 });
        for (const e of [0.15, 0.12, 0.08]) ch.boite(e, e * 1.3, e, 0xffe2a0, {}, M.lueur, { crasse: false, nuance: 0 });
      });
    }),
  );
  const xl = P.x + Math.sin(RY_SORTIE) * LANTERNE.avant;
  const zl = z + Math.cos(RY_SORTIE) * LANTERNE.avant;
  b.lumiere(arr(xl), LANTERNE.y, arr(zl), 0xffcf8a, 4, 6, "lanterne du panneau de sortie");
}

// ---------- Petits objets de la route ----------

/** Une borne à selfie morte : fût blanc, écran éteint, anneau de lumière ; certaines sont couchées. */
function borneSelfie(c, M, x, z, ry = 0, tombee = false) {
  c.repere({ x, y: tombee ? 0.28 : 0, z, ry, rx: tombee ? -1.45 : 0 }, () => {
    cylindre(c, M.lisse, 0xd8d4ca, 0, 0, 0, 0.24, 0.28, 0.12, 8);
    c.boite(0.16, 1.45, 0.16, 0xe6e2da, { y: 0.84 }, M.lisse);
    c.boite(0.62, 0.86, 0.14, 0xe6e2da, { y: 1.85 }, M.lisse);
    panneau(c, M, R.selfie, { y: 1.95, z: 0.075 }, 0.5, 0.5);
    for (let i = 0; i < 3; i++) c.boite(0.3, 0.02, 0.01, 0x8a8f90, { y: 1.58 + i * 0.05, z: 0.075 }, M.metal, { crasse: false });
    c.poser(ANNEAU, M.lisse, 0xf0eee8, { y: 2.48, z: 0.02, e: [0.2, 0.2, 0.2] }, { crasse: false });
    c.boite(0.05, 0.05, 0.05, 0x1f2326, { y: 2.48, z: 0.06 }, M.lisse, { crasse: false });
  });
}

const SELFIES = [
  { x: -92, tombee: false },
  { x: -63.5, tombee: false },
  { x: -10.4, z: 14.7, tombee: false },
  { x: 33.5, z: 3.6, tombee: false },
  { x: 52, tombee: true },
  { x: 79.5, tombee: false },
];

function routeObjets(ctx) {
  const { c, M, b, u } = ctx;
  // Les panneaux de sortie des deux bouts (R0-1) : la vraie destination, une lanterne au-dessus
  panneauSortie(ctx, "ouest");
  panneauSortie(ctx, "est");
  for (const s of SELFIES) {
    if (!ctx.ici(s.x)) continue;
    const z = s.z ?? zc(s.x) + HL + 0.95;
    borneSelfie(c, M, s.x, z, (hache(Math.round(s.x), 3) - 0.5) * 0.4, s.tombee || hache(Math.round(s.x), 4) < 0.25 * u);
  }
}

// ---------- La montée : station-essence, panneau des selfie-points, abri du cantonnier, voiture dans le pin ----------

function station(ctx) {
  if (!ctx.ici(-80)) return;
  const { c, b, M, u } = ctx;
  const X1 = -86.5;
  const X2 = -81.5;
  const Z1 = -13;
  const Z2 = -9;
  const H = 2.9;
  // L'aire en béton lavé, fissurée, envahie
  c.boite(15.6, 0.03, 12.4, 0xb9b09e, { x: -80, y: 0.015, z: -7.4 }, M.mat, { crasse: false, nuance: 0 });
  for (let i = 0; i < 9; i++) c.boite(c.entre(1.5, 4), 0.005, 0.05, 0x77705f, { x: c.entre(-87, -73), y: 0.035, z: c.entre(-12.5, -2), ry: c.hasard() * 3 }, M.mat, { crasse: false });
  const k = b.couche("boutique de la station", { x: -84, z: -11, l: 6.6, p: 5.8 }, 1.05, 4.2);
  const enduit = { couleur: ENDUIT, mat: M.enduit };
  murDouble(ctx, k, [X1, Z2], [X2, Z2], { h: H, ep: 0.25, bas: enduit, ouvertures: [{ u: 2.3077, l: 1.4, bas: 0, haut: 2.15, type: "porte" }, { u: 4.05, l: 1.3, bas: 1.05, haut: 2.15, type: "fenetre", bris: 0.4 + 0.5 * u, croisillons: 1 }] });
  murDouble(ctx, k, [X2, Z2], [X2, Z1], { h: H, ep: 0.25, bas: enduit, ouvertures: [{ u: 2, l: 1.4, bas: 1.05, haut: 2.15, type: "fenetre", bris: 0.3 + 0.6 * u }] });
  mur(c, [X2, Z1], [X1, Z1], { h: H, ep: 0.25, couleur: ENDUIT, mat: M.enduit, batiment: b });
  mur(c, [X1, Z1], [X1, Z2], { h: H, ep: 0.25, couleur: ENDUIT, mat: M.enduit, batiment: b });
  // Le soubassement bleu canard, le toit-terrasse et son bandeau à enseigne
  c.boite(5.3, 0.5, 0.04, CANARD, { x: -84, y: 0.25, z: Z2 + 0.15 }, M.satine);
  k.pave(X1 - 0.5, H, Z1 - 0.4, X2 + 0.5, H + 0.2, Z2 + 0.9, ENDUIT, M.enduit, { crasse: false });
  k.boite(X2 - X1 + 1.0, 0.5, 0.08, CANARD, { x: -84, y: H + 0.1, z: Z2 + 0.92 }, M.satine);
  panneau(k, M, R.station, { x: -84, y: H + 0.1, z: Z2 + 0.97 }, 4.6, 0.44);
  // Dedans : comptoir et caisse, étagères d'huiles, présentoir de cartes, frigo, Watty au mur
  c.boite(0.6, 1.0, 2.2, CANARD, { x: -82.3, y: 0.5, z: -11.3 }, M.satine);
  c.boite(0.7, 0.04, 2.3, 0xd8d2c4, { x: -82.3, y: 1.02, z: -11.3 }, M.lisse);
  c.boite(0.4, 0.28, 0.35, 0x5a5e60, { x: -82.3, y: 1.18, z: -10.6, ry: 0.2 }, M.metal);
  etagere(c, M, -84.8, -12.65, 0, 2.6, 1.8, [0xa8553e, 0x3f7a7c, 0xc79a3b, 0x6f6f6f, 0xd8d0b8], 0.75);
  c.boite(0.7, 1.8, 0.6, 0xd8d6cf, { x: -86, y: 0.9, z: -10.4 }, M.lisse);
  c.boite(0.04, 1.4, 0.5, 0x2c3a40, { x: -85.64, y: 1.0, z: -10.4 }, M.verre, { crasse: false });
  cylindre(c, M.metal, ACIER, -85.6, 0, -9.6, 0.03, 0.03, 1.5, 4);
  for (let i = 0; i < 4; i++) c.boite(0.36, 0.5, 0.02, [0xc79a3b, 0x3f7a7c, 0xa8553e, 0xe0d8c0][i], { x: -85.6 + Math.cos(i * 1.57) * 0.2, y: 1.15, z: -9.6 + Math.sin(i * 1.57) * 0.2, ry: i * 1.57 }, M.mat, { crasse: false });
  panneau(c, M, R.watty, { x: -83.4, y: 1.55, z: Z1 + 0.14 }, 0.8, 1.0);
  debris(c, X1 + 0.4, Z1 + 0.4, X2 - 0.4, Z2 - 0.4, 6 + 10 * u, [0xd8d0b8, 0xa8553e, 0xc79a3b]);
  // L'îlot et la pompe unique, sous son auvent
  c.boite(3.4, 0.18, 1.2, 0xbab2a2, { x: -78, y: 0.09, z: -3.4 }, M.mat);
  for (const x of [-80.4, -75.6]) {
    c.boite(0.22, 3.9, 0.22, ENDUIT, { x, y: 1.95, z: -3.4 }, M.lisse);
    c.boite(0.26, 0.6, 0.26, 0xc0503c, { x, y: 0.5, z: -3.4 }, M.satine);
  }
  b.obstacle(-79.7, -3.4, -76.3, -3.4, "îlot de la pompe");
  c.repere({ x: -78, y: 0.18, z: -3.4 }, () => {
    c.boite(0.72, 1.55, 0.46, 0xb8644e, { y: 0.78 }, M.satine, { nuance: 0.04 });
    c.boite(0.74, 0.12, 0.48, 0xd8d2c4, { y: 1.6 }, M.lisse);
    c.poser(BOULE, M.lisse, 0xeee6cf, { y: 1.88, e: [0.22, 0.24, 0.12] }, { crasse: false });
    panneau(c, M, R.pompe, { y: 1.2, z: 0.235 }, 0.4, 0.4);
    c.boite(0.36, 0.3, 0.12, 0x2b2f33, { x: 0.44, y: 1.15, z: 0.1 }, M.lisse); // le boîtier « connecté », vissé après coup
    c.tube([-0.37, 1.1, 0.1], [-0.6, 0.4, 0.5], 0.035, 0x1f1f1f, M.mat, 4);
    c.tube([-0.6, 0.4, 0.5], [-0.42, 0.02, 0.9], 0.035, 0x1f1f1f, M.mat, 4);
    c.boite(0.08, 0.1, 0.28, 0x2a2a2a, { x: -0.42, y: 0.05, z: 1.05, ry: 0.3 }, M.satine);
  });
  b.lumiere(-78, 1.4, -2.9, 0x7fd0ff, 2.2, 5, "écran de la pompe connectée, « paiement par appli » (il luit encore)");
  const ka = b.couche("auvent de la pompe", { x: -78, z: -3.4, l: 6.6, p: 4.4 }, 3.6, 4.8);
  ka.boite(6.4, 0.2, 4.2, ENDUIT, { x: -78, y: 4.0, z: -3.4 }, M.enduit, { crasse: false });
  ka.boite(6.5, 0.42, 0.08, CANARD, { x: -78, y: 3.98, z: -1.27 }, M.satine);
  ka.boite(0.08, 0.42, 4.3, CANARD, { x: -74.77, y: 3.98, z: -3.4 }, M.satine);
  if (u > 0.5) ka.boite(1.6, 0.06, 1.0, ENDUIT, { x: -76.6, y: 3.0, z: -2.4, rz: 0.8, rx: 0.3 }, M.enduit); // une plaque pend
  // L'épave à la pompe (un couvert), le fût d'huile et les pneus (le pin tombé a pris la place du fond de l'aire)
  voiture(c, M, -73.8, 0, -1.6, 0.12, 0x9db0a8, { roues: 3, rz: 0.04, capot: true });
  b.obstacle(-75.8, -2.6, -71.8, -2.1, "épave");
  b.obstacle(-75.8, -0.9, -71.8, -0.6, "épave");
  cylindre(c, M.tole, 0x6f7f6a, -80.95, 0, -8.35, 0.3, 0.3, 0.88, 8);
  for (let i = 0; i < 3; i++) cylindre(c, M.mat, 0x2a2a2a, -80.15, i * 0.22, -8.1, 0.36, 0.36, 0.2, 10);
  b.obstacle(-81.25, -8.35, -79.8, -8.1, "fût et pneus");
  // Un pin parasol au fond de l'aire, des lauriers-roses le long du mur
  pinParasol(c, M, -87.6, -2.6, 9, 0, 0.4, 0.1);
  laurier(c, M, -80.3, -12.6, 1.1, 0);
  laurier(c, M, -78.8, -12.8, 0.9, 0);
  agave(c, M, -86.8, -1.4, 0.9, 0, true);
}

function panneauCorniche(ctx) {
  if (!ctx.ici(-68)) return;
  const { c, M } = ctx;
  const z = -5.0;
  for (const x of [-71, -65]) {
    c.boite(0.25, 5.6, 0.3, 0x6a6e70, { x, y: 2.5, z: z - 0.2 }, M.tole);
    c.boite(0.6, 0.4, 0.6, 0xb8ad98, { x, y: 0.2, z: z - 0.2 }, M.mat);
  }
  c.boite(7.4, 3.0, 0.12, 0x6a6e70, { x: -68, y: 3.8, z: z - 0.08 }, M.tole);
  panneau(c, M, R.corniche, { x: -68, y: 3.8, z: z }, 7.2, 2.8);
  // La passerelle d'entretien et les projecteurs morts
  c.boite(7.4, 0.06, 0.6, 0x6a6e70, { x: -68, y: 2.2, z: z + 0.25 }, M.tole);
  for (const x of [-70.4, -68, -65.6]) {
    c.tube([x, 5.25, z - 0.05], [x, 5.5, z + 0.7], 0.03, 0x4a4e50, M.metal, 4);
    c.boite(0.3, 0.16, 0.22, 0x4a4e50, { x, y: 5.45, z: z + 0.78, rx: 0.6 }, M.metal);
  }
}

function abriCantonnier(ctx) {
  if (!ctx.ici(-60)) return;
  const { c, b, M, u } = ctx;
  const X1 = -62.4;
  const X2 = -57.6;
  const Z1 = -10.2;
  const Z2 = -6.8;
  const H = 2.6;
  const k = b.couche("abri du cantonnier", { x: -60, z: -8.5, l: 6, p: 4.8 }, 1.05, 4);
  const pierre = { couleur: 0xc0ab8a, mat: M.pierre };
  murDouble(ctx, k, [X1, Z2], [X2, Z2], { h: H, ep: 0.45, bas: pierre, ouvertures: [{ u: 2.6, l: 1.3, bas: 0, haut: 2.1, type: "porte" }] });
  murDouble(ctx, k, [X2, Z2], [X2, Z1], { h: H, ep: 0.45, bas: pierre, ouvertures: [{ u: 1.7, l: 0.6, bas: 1.2, haut: 1.8, type: "vide" }] });
  mur(c, [X2, Z1], [X1, Z1], { h: H, ep: 0.45, couleur: 0xc0ab8a, mat: M.pierre, batiment: b });
  mur(c, [X1, Z1], [X1, Z2], { h: H, ep: 0.45, couleur: 0xc0ab8a, mat: M.pierre, batiment: b });
  k.boite(1.3, 0.16, 0.47, BOIS, { x: -59.8, y: 2.18, z: Z2 }, M.mat);
  panneau(k, M, R.cantonnier, { x: -59.8, y: 2.42, z: Z2 + 0.24 }, 1.5, 0.37);
  // Le toit de tuiles canal, un seul pan vers le sud, quelques tuiles glissées
  const n = 8;
  for (let i = 0; i < n; i++) {
    const x = X1 - 0.35 + (i + 0.5) * ((X2 - X1 + 0.7) / n);
    if (u > 0.7 && i === 5) continue;
    planche(k, [x, H + 0.55, Z1 - 0.35], [x, H - 0.1, Z2 + 0.45], (X2 - X1 + 0.7) / n + 0.02, 0.12, i % 3 === 1 ? 0xa45a42 : TUILE, M.mat, [1, 0, 0], { nuance: 0.06, crasse: false });
    k.tube([x - 0.25, H + 0.62, Z1 - 0.35], [x - 0.25, H - 0.03, Z2 + 0.45], 0.07, 0xb87055, M.mat, 4);
  }
  if (u > 0.7) raiDeLumiere(c, [-58.3, 3.1, -8.4], [-58.6, 0.05, -8.1], 0.7);
  // Dedans : râtelier d'outils, sacs, cônes, panneaux de chantier, table et bougie dans un bocal
  c.boite(0.06, 1.2, 2.2, BOIS_GRIS, { x: X1 + 0.26, y: 1.3, z: -8.5 }, M.mat);
  for (let i = 0; i < 5; i++) {
    const z = -9.4 + i * 0.45;
    c.tube([X1 + 0.32, 0.3, z], [X1 + 0.32, 1.9, z], 0.025, BOIS, M.mat, 4);
    c.boite(0.04, 0.32, 0.24, ACIER, { x: X1 + 0.33, y: i % 2 ? 1.95 : 0.22, z }, M.tole);
  }
  for (let i = 0; i < 5; i++) c.boite(0.55, 0.28, 0.38, i % 2 ? 0xc8bc9a : 0xd8d0b4, { x: -58.4 + (i % 3) * 0.2, y: 0.14 + Math.floor(i / 3) * 0.28, z: -9.5 + (i % 2) * 0.4, ry: i * 0.3 }, M.toile, { nuance: 0.05 });
  c.boite(1.0, 0.05, 0.6, BOIS, { x: -60.2, y: 0.78, z: -9.5 }, M.mat);
  for (const [dx, dz] of [[-0.42, -0.25], [0.42, -0.25], [-0.42, 0.25], [0.42, 0.25]]) c.boite(0.05, 0.76, 0.05, BOIS, { x: -60.2 + dx, y: 0.38, z: -9.5 + dz }, M.mat);
  cylindre(c, M.verre, 0xffffff, -60.4, 0.8, -9.5, 0.08, 0.08, 0.18, 6);
  cylindre(c, M.lisse, 0xeee6cf, -60.4, 0.8, -9.5, 0.035, 0.035, 0.1, 5);
  c.boite(0.6, 0.6, 0.03, 0xe8e2d4, { x: -61.4, y: 0.4, z: Z1 + 0.28, rx: -0.15 }, M.satine);
  b.lumiere(-60.4, 1.1, -9.4, 0xffc070, 2.5, 6, "bougie dans un bocal, sur la table de l'abri du cantonnier");
  // Dehors : cônes, plots, un banc, un pin d'Alep au-dessus
  for (const [x, z, t] of [[-57, -6, 0], [-56.6, -6.6, 1.5], [-63, -6.1, 0]]) {
    c.repere({ x, y: 0, z, rx: t, ry: t }, () => {
      cylindre(c, M.satine, 0xc8643a, 0, 0, 0, 0.03, 0.18, 0.55, 6);
      c.boite(0.36, 0.04, 0.36, 0x2a2a2a, { y: 0.02 }, M.satine);
    });
  }
  c.boite(1.6, 0.06, 0.36, BOIS, { x: -63.6, y: 0.45, z: -7.6, ry: 1.5 }, M.mat);
  for (const dz of [-0.6, 0.6]) c.boite(0.3, 0.45, 0.3, 0xc0ab8a, { x: -63.6, y: 0.22, z: -7.6 + dz }, M.pierre);
}

function voitureDansLePin(ctx) {
  if (!ctx.ici(-69.5)) return;
  const { c, M } = ctx;
  // Les traces de pneus qui filent vers le muret arraché
  for (const s of [-0.7, 0.7]) boiteEntre(c, -77, 1.4 + s * 0.6, -70.5, 4.3 + s * 0.6, 0.035, 0.012, 0.26, 0x3a3a3c, M.mat, { crasse: false });
  const z0 = zr(-69.8);
  pinAlep(c, M, -69.8, z0 + 0.5, 6.5, hauteur(-69.8, z0 + 0.5) - 0.2, Math.PI / 2 - 0.2, 0.55);
  voiture(c, M, -69.3, -3.4, z0 + 1.9, -Math.PI / 2, 0xc9a86a, { rz: -0.75, rx: 0.25, roues: 3, capot: true, porte: true });
  // Une valise tombée de la galerie de toit, coincée dans les branches
  c.boite(0.7, 0.45, 0.25, 0x7a4a3a, { x: -68.4, y: -1.6, z: z0 + 2.6, rz: 0.5 }, M.satine);
}

// ---------- Le tunnel du Cap Rouge et sa barricade ----------

const R_VOUTE = 3.5;
const Y_NAISSANCE = 2.6;

function tunnel(ctx) {
  if (!ctx.ici((TX1 + TX2) / 2)) return;
  const { c, b, M, u } = ctx;
  const A = aleatoire(1931);
  const k = b.couche("rocher du tunnel", { x: (TX1 + TX2) / 2, z: 2.6, l: TX2 - TX1 + 3, p: 16.5 }, 1.2, 10.5);
  const tons = [ROC_SOMBRE, 0x6a463a, ROC, 0x5f4a40];
  // Les parois brutes : au nord jusqu'à la naissance de la voûte, au sud coupée à hauteur d'allège (le reste s'efface)
  for (let x = TX1 + 0.4; x < TX2; x += 1.4) {
    const t = tons[Math.floor(A() * tons.length)];
    c.boite(1.5, Y_NAISSANCE + 0.2, 0.6, t, { x, y: (Y_NAISSANCE + 0.2) / 2, z: -3.75 - A() * 0.12, ry: (A() - 0.5) * 0.12 }, M.mat, { nuance: 0.05 });
    c.boite(1.5, 1.2, 0.6, t, { x, y: 0.6, z: 3.75 + A() * 0.12, ry: (A() - 0.5) * 0.12 }, M.mat, { nuance: 0.05 });
    k.boite(1.5, Y_NAISSANCE - 1.2 + 0.2, 0.6, t, { x, y: 1.2 + (Y_NAISSANCE - 1.2 + 0.2) / 2, z: 3.75 + A() * 0.12, ry: (A() - 0.5) * 0.12 }, M.mat, { nuance: 0.05 });
  }
  b.obstacle(TX1, 3.45, TX2, 3.45, "paroi du tunnel");
  // La voûte brute : des anneaux de segments de rocher, chacun un peu de travers
  const nSeg = 9;
  for (let x = TX1 + 0.6; x < TX2 - 0.2; x += 1.2) {
    let prec = null;
    for (let s = 0; s <= nSeg; s++) {
      const a = (s / nSeg) * Math.PI;
      const r = R_VOUTE + 0.25 + A() * 0.35;
      const p = [x + (A() - 0.5) * 0.2, Y_NAISSANCE + Math.sin(a) * r, Math.cos(a) * r];
      if (prec) planche(k, prec, p, 1.3, 0.7, tons[Math.floor(A() * tons.length)], M.mat, [1, 0, 0], { nuance: 0.05, crasse: false });
      prec = p;
    }
  }
  // Les têtes du tunnel : un anneau de voussoirs clairs et un mur de tête jusqu'au rocher
  for (const [xp, s] of [[TX1, -1], [TX2, 1]]) {
    let prec = null;
    for (let i = 0; i <= 11; i++) {
      const a = (i / 11) * Math.PI;
      const p = [xp + s * 0.1, Y_NAISSANCE + Math.sin(a) * 3.95, Math.cos(a) * 3.95];
      if (prec) planche(k, prec, p, 0.9, 0.75, i % 2 ? PIERRE : PIERRE_CHAPERON, M.pierre, [1, 0, 0], { crasse: false, nuance: 0.04 });
      prec = p;
    }
    for (let z = -4.1; z < 4.3; z += 0.6) {
      const ya = Y_NAISSANCE + Math.sqrt(Math.max(0, 4.2 * 4.2 - Math.min(16, (z + 0.3) * (z + 0.3))));
      const y0 = Math.abs(z + 0.3) > 4 ? 1.2 : ya;
      k.boite(0.9, 6.9 - y0, 0.62, z > 0 ? ROC : ROC_SOMBRE, { x: xp + s * 0.05, y: (y0 + 6.9) / 2, z: z + 0.3 }, M.mat, { nuance: 0.06, crasse: false });
    }
    // Le pied des têtes, côté sud (la partie basse reste visible)
    c.boite(0.9, 1.2, 1.2, PIERRE, { x: xp + s * 0.1, y: 0.6, z: 4.2 }, M.pierre);
  }
  panneau(k, M, R.tunnel, { x: TX2 + 0.62, y: 7.25, z: 0, ry: Math.PI / 2 }, 4.4, 0.55);
  panneau(k, M, R.tunnel, { x: TX1 - 0.62, y: 7.25, z: 0, ry: -Math.PI / 2 }, 4.4, 0.55);
  // Le rocher de l'éperon : un massif au-dessus de la voûte et au sud, hérissé de blocs, couronné de pins et d'agaves
  k.boite(TX2 - TX1 + 0.6, 7.6 - 1.2, 5.6, ROC, { x: (TX1 + TX2) / 2, y: (1.2 + 7.6) / 2, z: 6.6 }, M.mat, { nuance: 0.04, crasse: false });
  k.boite(TX2 - TX1 + 0.6, 1.6, 8.4, ROC_SOMBRE, { x: (TX1 + TX2) / 2, y: 7.0, z: -0.4 }, M.mat, { nuance: 0.04, crasse: false });
  for (let i = 0; i < 46; i++) {
    const x = TX1 - 0.6 + A() * (TX2 - TX1 + 1.2);
    const z = -5 + A() * 14.5;
    const s = 1.2 + A() * 2.2;
    const y = z > 8 ? 2 + A() * 4 : 6.4 + A() * 1.8 - Math.max(0, z - 5) * 0.5;
    k.poser(ROCHE, M.mat, [ROC, ROC_CLAIR, ROC_SOMBRE, CALCAIRE][Math.floor(A() * 4)], { x, y, z, rx: A() * 3, ry: A() * 3, e: [s * 1.3, s * 0.75, s] }, { nuance: 0.1, crasse: false });
  }
  // Des blocs plaqués sur les faces sud et est du massif, pour casser ses grands pans
  for (let i = 0; i < 26; i++) {
    const x = TX1 + A() * (TX2 - TX1);
    const s = 0.9 + A() * 1.4;
    k.poser(ROCHE, M.mat, [ROC, ROC_SOMBRE, ROC_CLAIR][i % 3], { x, y: 1.6 + A() * 5.4, z: 9.3 + A() * 0.4, rx: A() * 3, ry: A() * 3, e: [s * 1.2, s, s * 0.6] }, { nuance: 0.1, crasse: false });
  }
  for (let i = 0; i < 8; i++) {
    const s = 0.9 + A() * 1.0;
    k.poser(ROCHE, M.mat, [ROC, ROC_SOMBRE][i % 2], { x: TX2 + 0.3, y: 2 + A() * 4.5, z: 4.6 + A() * 4.6, rx: A() * 3, ry: A() * 3, e: [s * 0.6, s, s * 1.1] }, { nuance: 0.1, crasse: false });
  }
  for (const [x, z, h] of [[-44, 5, 5.5], [-36, 7.5, 4.5], [-32, 1, 6]]) pinAlep(k, M, x, z, h, 7.4, Math.PI / 2 - 0.3, 0.45);
  for (const [x, z] of [[-46.5, 7.4], [-41, 2], [-38.5, 6.2], [-33.4, 8.4], [-30.6, 5]]) agave(k, M, x, z, 0.9, 7.6, A() < 0.4);
  for (const [x, z] of [[-42.5, -2.4], [-35, -3.4]]) genet(k, M, x, z, 1, 7.7);
  // Dans le tunnel : luminaires morts, câbles qui pendent, l'épave, une flaque, des gravats
  for (let x = TX1 + 2; x < TX2 - 1; x += 4) {
    const pendu = hache(Math.round(x), 51) < 0.4 * u;
    k.boite(0.9, 0.16, 0.24, 0x8a8f90, { x, y: pendu ? 3.2 : 4.6, z: -2.6, rx: 0.6, rz: pendu ? 0.5 : 0 }, M.tole);
    if (pendu) k.tube([x - 0.4, 4.8, -2.7], [x, 3.3, -2.6], 0.015, 0x1f1f1f, M.metal, 3);
  }
  voiture(c, M, -40, 0, 1.6, Math.PI - 0.06, 0x6a7f99, { roues: 2, rz: 0.06, vitres: u < 0.6 });
  b.obstacle(-42, 0.7, -38, 0.8, "épave");
  b.obstacle(-42, 2.4, -38, 2.5, "épave");
  flaque(c, -36, -1.2, 1.6, 0.04);
  gravats(c, -45.8, -2.6, 1.1, 8 + 10 * u, [ROC, ROC_SOMBRE, ROC_CLAIR]);
  gravats(c, -33, 2.8, 0.8, 6 + 6 * u, [ROC, ROC_SOMBRE]);
  debris(c, TX1 + 1, -2.8, TX2 - 1, 2.8, 14 * u, [0x8a8f90, ROC, 0x3a3a3a]);

  barricade(ctx);
}

// ---------- La barricade des pillards et le péage (C2) ----------

/** Un objet à part, nommé (une seule matière : un seul appel de dessin), rangé dans ctx.objets. */
function objetNomme(ctx, nom, graine, batir, visible = true) {
  const ch = new Chantier(graine);
  batir(ch);
  const g = ch.construire();
  g.name = nom;
  g.userData.nom = nom;
  g.visible = visible;
  ctx.b.ajouter(g);
  ctx.objets[nom] = g;
  return g;
}

const XB = -24.55; // la ligne de la porte de la barricade
const ZB1 = -0.62; // le montant côté épave
const ZB2 = 1.5; // le montant côté sacs de sable (les gonds)

/** La porte de la barricade, dans le repère de ses gonds : 2,1 m de long vers +x local, face ouest vers −z local. */
function portePeage(ch, M) {
  const L = ZB2 - ZB1;
  // Les traverses et l'écharpe
  ch.boite(L - 0.1, 0.12, 0.06, BOIS, { x: L / 2, y: 0.38, z: 0.05 }, M.mat);
  ch.boite(L - 0.1, 0.12, 0.06, BOIS, { x: L / 2, y: 1.5, z: 0.05 }, M.mat);
  planche(ch, [0.15, 0.42, 0.05], [L - 0.12, 1.46, 0.05], 0.12, 0.06, BOIS, M.mat, [0, 0, 1]);
  // Les planches verticales, de longueurs inégales
  const n = 8;
  for (let i = 0; i < n; i++) {
    const h = 1.62 + hache(i, 71) * 0.32;
    ch.boite(L / n - 0.025, h, 0.035, i % 3 === 1 ? 0xa59a88 : BOIS_GRIS, { x: (i + 0.5) * (L / n), y: 0.1 + h / 2, z: 0 }, M.mat, { nuance: 0.08 });
    ch.boite(0.05, 0.12, 0.05, BOIS_GRIS, { x: (i + 0.5) * (L / n), y: 0.1 + h + 0.04, z: 0, rz: 0.78 }, M.mat); // la pointe
  }
  // La tôle ondulée rouillée côté ouest, et la croix rouge peinte dessus
  for (let k = 0; k < 7; k++) ch.boite(0.15, 1.0, 0.025, k % 2 ? 0x8a6f5a : 0x7d5f4c, { x: 0.45 + k * 0.14, y: 0.95, z: -0.04 - (k % 2) * 0.02 }, M.mat, { nuance: 0.05 });
  for (const s of [-1, 1]) ch.boite(1.15, 0.09, 0.01, 0xb02a20, { x: 0.87, y: 0.95, z: -0.07, rz: s * 0.72 }, M.mat, { crasse: false });
  // Le barbelé en couronne sur le dessus
  for (let i = 0; i < 6; i++) ch.poser(ANNEAU, M.mat, 0x5a5048, { x: 0.2 + i * 0.34, y: 2.02, rx: 0.3 * (i % 2), e: [0.17, 0.17, 0.17] }, { crasse: false, nuance: 0.05 });
  ch.tube([0.05, 1.98, 0], [L - 0.05, 2.0, 0], 0.012, 0x4a4440, M.mat, 3);
  // La chaîne et le cadenas, côté épave ; les gonds de récupération
  for (let i = 0; i < 4; i++) ch.boite(0.07, 0.04, 0.03, FONTE, { x: L - 0.02, y: 1.05 - i * 0.06, z: -0.06, rz: i % 2 ? 0 : 1.57 }, M.mat, { crasse: false });
  ch.boite(0.09, 0.11, 0.04, 0xc79a3b, { x: L - 0.02, y: 0.8, z: -0.07 }, M.mat, { crasse: false });
  for (const y of [0.38, 1.5]) ch.boite(0.14, 0.06, 0.1, FONTE, { x: 0.02, y, z: 0.02 }, M.mat, { crasse: false });
}

/** La caisse du péage : une caisse de bois cerclée de fer, couvercle entrebâillé, bande rouge peinte, cadenas ouvert. */
function caissePeage(ch, M, x, z, ry) {
  ch.repere({ x, y: 0, z, ry }, () => {
    for (let k = 0; k < 4; k++) ch.boite(0.96, 0.13, 0.6, k % 2 ? 0x9a7650 : 0xa8845a, { y: 0.07 + k * 0.135 }, M.mat, { nuance: 0.05 });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) ch.boite(0.06, 0.56, 0.06, FONTE, { x: sx * 0.47, y: 0.28, z: sz * 0.29 }, M.mat, { crasse: false });
    ch.boite(0.97, 0.1, 0.61, 0xb02a20, { y: 0.36 }, M.mat, { crasse: false, nuance: 0.03 });
    // Le couvercle entrebâillé : on y dépose
    ch.repere({ y: 0.56, z: -0.3, rx: -0.32 }, () => {
      ch.boite(1.0, 0.05, 0.62, 0x8a6a48, { z: 0.31 }, M.mat);
      ch.boite(1.0, 0.03, 0.06, FONTE, { y: 0.03, z: 0.6 }, M.mat, { crasse: false });
    });
    // Les poignées de corde et le cadenas ouvert qui pend
    for (const s of [-1, 1]) ch.tube([s * 0.5, 0.42, -0.12], [s * 0.5, 0.42, 0.12], 0.025, 0xc8b48a, M.mat, 4);
    ch.boite(0.08, 0.1, 0.04, 0xc79a3b, { y: 0.44, z: 0.32 }, M.mat, { crasse: false });
    ch.poser(ANNEAU, M.mat, 0x8a8f90, { y: 0.52, z: 0.32, e: [0.04, 0.04, 0.04] }, { crasse: false });
    // Ce qu'on y a déjà laissé, qui dépasse
    ch.boite(0.22, 0.1, 0.16, 0xc0503c, { x: -0.2, y: 0.6, z: 0.05, ry: 0.4 }, M.mat, { crasse: false });
    cylindre(ch, M.mat, 0xa8a8a0, 0.18, 0.55, -0.02, 0.05, 0.05, 0.12, 6);
  });
}

function barricade(ctx) {
  const { c, b, M, u } = ctx;
  // L'épave en travers, du pied de la paroi jusqu'au montant nord de la porte
  voiture(c, M, -25.25, 0, -2.62, Math.PI / 2 + 0.1, 0x8a5a4a, { roues: 2, rz: 0.08, vitres: false, porte: true });
  b.obstacle(-25.46, -4.95, -25.05, ZB1, "épave de la barricade");
  // Des pneus et des tôles bouchent l'espace entre l'épave et la paroi
  for (const [x, z, n] of [[-25.7, -4.95, 3], [-24.95, -5.05, 2]]) for (let i = 0; i < n; i++) cylindre(c, M.mat, 0x2a2a2a, x, i * 0.22, z, 0.36, 0.36, 0.2, 10);
  planche(c, [-26.0, 0.05, -4.2], [-26.1, 1.5, -4.6], 1.0, 0.03, 0x7d8689, M.tole, [1, 0, 0]);
  // Les deux montants et la traverse haute, d'où pend la planche du péage (lisible depuis le tunnel)
  for (const z of [ZB1, ZB2]) {
    c.boite(0.16, 2.75, 0.16, BOIS, { x: XB, y: 1.37, z }, M.mat);
    c.boite(0.3, 0.3, 0.3, 0xc2b48c, { x: XB, y: 0.15, z }, M.toile, { nuance: 0.06 });
  }
  c.boite(0.14, 0.14, ZB2 - ZB1 + 0.5, BOIS, { x: XB, y: 2.72, z: (ZB1 + ZB2) / 2 }, M.mat);
  for (const z of [ZB1 + 0.5, ZB2 - 0.5]) c.tube([XB, 2.68, z], [XB - 0.02, 2.3, z], 0.012, 0x6a5440, M.mat, 3);
  c.boite(0.04, 0.8, 1.34, BOIS_GRIS, { x: XB - 0.04, y: 2.0, z: (ZB1 + ZB2) / 2 }, M.mat);
  panneau(c, M, R.barricade, { x: XB - 0.07, y: 2.0, z: (ZB1 + ZB2) / 2, ry: -Math.PI / 2 }, 1.28, 0.76);
  // Le mur de sacs de sable, des gonds de la porte jusqu'au muret de la falaise
  const zf = zr(-25) - 0.45;
  for (let r = 0; r < 4; r++) {
    const xs = r < 2 ? [-25.22, -24.84] : r < 3 ? [-25.03] : [-25.03];
    for (const x of xs) {
      for (let z = ZB2 + 0.36 + (r % 2) * 0.3; z < zf - 0.25; z += 0.6) {
        if (r === 3 && hache(Math.round(z * 10), 5) < 0.45) continue;
        c.boite(0.6, 0.27, 0.38, hache(Math.round(z * 10), r) < 0.3 ? 0xb4a67e : 0xc2b48c, { x: x + (hache(Math.round(z * 10), r + 9) - 0.5) * 0.05, y: 0.14 + r * 0.26, z, ry: Math.PI / 2 + (hache(Math.round(z * 10), r + 3) - 0.5) * 0.25 }, M.toile, { nuance: 0.06 });
      }
    }
  }
  b.obstacle(-25.03, ZB2, -25.03, zf + 0.3, "sacs de sable de la barricade");
  // Des palettes dressées et un fût contre les sacs, côté falaise
  planche(c, [-24.6, 0.05, 5.0], [-24.5, 1.2, 5.3], 1.2, 0.12, 0x9a8a6a, M.mat, [1, 0, 0]);
  cylindre(c, M.tole, 0x3f6a7a, -24.3, 0, 4.1, 0.29, 0.29, 0.88, 8);
  // Le poste de guet derrière les sacs : palettes sur deux fûts, une chaise, un parasol de plage, le porte-voix
  for (const z of [3.0, 4.0]) cylindre(c, M.tole, z > 3.5 ? 0x8a3a30 : 0x3f6a7a, -23.5, 0, z, 0.29, 0.29, 0.88, 8);
  for (let i = 0; i < 2; i++) c.boite(1.2, 0.12, 1.4, 0x9a8a6a, { x: -23.5, y: 0.94 + i * 0.13, z: 3.5, ry: i * 0.1 }, M.mat, { nuance: 0.05 });
  chaise(c, M, -23.6, 3.4, -Math.PI / 2, false, 0xe8e2d4, 1.2);
  c.tube([-23.1, 1.2, 4.0], [-23.2, 3.3, 3.9], 0.025, ALU, M.metal, 4);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    planche(c, [-23.2, 3.35, 3.9], [-23.2 + Math.cos(a) * 1.0, 2.95, 3.9 + Math.sin(a) * 1.0], 0.75, 0.015, i % 2 ? 0xe8e2d4 : 0x3f8ab0, M.toile, [0, 1, 0], { crasse: false });
  }
  c.poser(FEUILLE, M.satine, 0xd8d0b8, { x: -23.9, y: 1.32, z: 3.0, rz: Math.PI / 2, e: [0.12, 0.3, 0.12] }, { crasse: false });
  b.obstacle(-24.0, 2.7, -22.9, 4.3, "poste de guet des pillards");
  // La caisse du péage, au pied de la barricade, côté ouest (on y dépose ce qu'on donne)
  objetNomme(ctx, "caisse_peage", 731, (ch) => caissePeage(ch, M, -25.78, 2.35, Math.PI / 2 + 0.06));
  b.obstacle(-25.78, 1.85, -25.78, 2.85, "caisse du péage");
  // La porte : fermée au départ (ses obstacles à part), ou rabattue contre les sacs de sable, côté est
  objetNomme(ctx, "barricade_fermee", 733, (ch) => ch.repere({ x: XB, y: 0, z: ZB2, ry: Math.PI / 2 }, () => portePeage(ch, M)));
  objetNomme(ctx, "barricade_ouverte", 733, (ch) => ch.repere({ x: XB + 0.12, y: 0, z: ZB2 + 0.1, ry: -0.1 }, () => portePeage(ch, M)), false);
  ctx.obstaclesBarricade.push({ x1: XB, z1: ZB1 - 0.08, x2: XB, z2: ZB2 + 0.08, nature: "porte de la barricade, fermée (le péage)" });

  // Le camp des pillards, derrière la barricade : bâche tendue contre la paroi, couvertures polaires, brasero, conserves
  const cx = -21.0;
  const cz = -3.9;
  cylindre(c, M.tole, 0x5f4a3a, cx, 0, cz, 0.3, 0.28, 0.8, 8);
  c.poser(BOULE, M.mat, 0x2a2420, { x: cx, y: 0.78, z: cz, e: [0.26, 0.06, 0.26] }, { crasse: false });
  for (let i = 0; i < 3; i++) c.tube([cx + Math.cos(i * 2) * 0.2, 0.75, cz + Math.sin(i * 2) * 0.2], [cx, 1.05, cz], 0.04, 0x3a2b20, M.mat, 4);
  b.lumiere(cx, 1.1, cz, 0xff8a3d, 9, 10, "brasero des pillards, derrière la barricade du tunnel");
  planche(c, [-24.0, 2.2, -5.0], [-18.2, 2.2, -5.0], 0.06, 0.06, BOIS, M.mat);
  planche(c, [-24.0, 2.15, -5.0], [-24.0, 1.0, -3.4], 0.04, 0.04, BOIS, M.mat);
  planche(c, [-18.2, 2.15, -5.0], [-18.2, 1.0, -3.4], 0.04, 0.04, BOIS, M.mat);
  planche(c, [-21.1, 2.2, -5.0], [-21.1, 1.0, -3.4], 5.8, 0.03, 0x4f6a5a, M.toile, [1, 0, 0]);
  c.boite(1.8, 0.1, 0.9, POLAIRES[4], { x: -22.8, y: 0.06, z: -4.3, ry: 0.1 }, M.toile);
  c.boite(1.6, 0.1, 0.8, POLAIRES[0], { x: -19.3, y: 0.06, z: -4.2, ry: -0.2 }, M.toile);
  for (let i = 0; i < 7; i++) cylindre(c, M.metal, i % 3 ? 0xa8a8a0 : 0xc0503c, -22.0 + i * 0.22, 0, -3.35 + (i % 2) * 0.15, 0.05, 0.05, 0.11, 6);
  for (const [x, z, ry] of [[-22.2, -3.2, 0.3], [-19.6, -3.3, -0.5]]) c.tube([x - Math.cos(ry) * 0.5, 0.2, z + Math.sin(ry) * 0.5], [x + Math.cos(ry) * 0.5, 0.2, z - Math.sin(ry) * 0.5], 0.18, 0x6a5440, M.mat, 6);
  debris(c, -24, -3.6, -18.5, -1.8, 6 + 8 * u, [0xa8a8a0, 0xc0503c, 0xd8d0b8]);
}

// ---------- Le belvédère et son kiosque à glaces ----------

function banc(c, M, x, z, ry) {
  c.repere({ x, y: 0, z, ry }, () => {
    for (const s of [-0.75, 0.75]) {
      c.boite(0.06, 0.42, 0.5, FONTE, { x: s, y: 0.21 }, M.metal);
      c.boite(0.06, 0.45, 0.06, FONTE, { x: s, y: 0.62, z: -0.24, rx: -0.2 }, M.metal);
    }
    for (let i = 0; i < 3; i++) c.boite(1.8, 0.04, 0.12, BOIS, { y: 0.44, z: -0.18 + i * 0.16 }, M.mat, { nuance: 0.06 });
    for (let i = 0; i < 2; i++) c.boite(1.8, 0.11, 0.035, BOIS, { y: 0.66 + i * 0.16, z: -0.28 - i * 0.035, rx: -0.2 }, M.mat, { nuance: 0.06 });
  });
}

function belvedere(ctx) {
  const { c, b, M, u } = ctx;
  if (ctx.ici(-12.8)) {
    // Le dallage de pierre blonde, avec ses joints d'herbe
    c.boite(15.0, 0.04, 13.2, 0xc9bda5, { x: -12.9, y: 0.02, z: 9.0 }, M.pierre, { crasse: false, nuance: 0 });
    for (let x = -20; x < -5.8; x += 1.5) c.boite(0.05, 0.005, 13, 0x8a8c5a, { x, y: 0.045, z: 9 }, M.mat, { crasse: false });
    for (let z = 3.2; z < 15.4; z += 1.5) c.boite(14.8, 0.005, 0.05, 0x8a8c5a, { x: -12.9, y: 0.045, z }, M.mat, { crasse: false });
    // La table d'orientation
    c.repere({ x: -13, y: 0, z: 10 }, () => {
      cylindre(c, M.pierre, PIERRE, 0, 0, 0, 0.62, 0.7, 0.18, 8);
      cylindre(c, M.pierre, PIERRE, 0, 0.18, 0, 0.45, 0.5, 0.8, 8);
      cylindre(c, M.metal, PALETTE.laiton, 0, 0.98, 0, 0.62, 0.62, 0.05, 12, { rx: -0.2 });
      panneau(c, M, R.orientation, { y: 1.06, z: 0.01, rx: -Math.PI / 2 - 0.2 }, 1.1, 1.1);
    });
    b.obstacle(-13.6, 10, -12.4, 10, "table d'orientation");
    banc(c, M, -17.4, 12.6, 0);
    banc(c, M, -8.6, 12.6, 0);
    b.obstacle(-18.3, 12.5, -16.5, 12.5, "banc");
    b.obstacle(-9.5, 12.5, -7.7, 12.5, "banc");
    // Le réverbère de fonte et la lanterne solaire de jardin qu'on y a pendue (sa petite cellule la recharge encore)
    c.repere({ x: -13, y: 0, z: 13.7 }, () => {
      cylindre(c, M.metal, FONTE, 0, 0, 0, 0.16, 0.22, 0.5, 8);
      c.tube([0, 0.4, 0], [0, 3.4, 0], 0.06, FONTE, M.metal, 6);
      c.tube([0, 3.3, 0], [0.7, 3.5, 0], 0.035, FONTE, M.metal, 4);
      c.boite(0.3, 0.4, 0.3, 0x2c3a40, { x: 0, y: 3.6 }, M.verre, { crasse: false });
      c.tube([0.7, 3.5, 0], [0.7, 3.0, 0], 0.012, FONTE, M.metal, 3);
      cylindre(c, M.lisse, 0xe8e6e0, 0.7, 2.66, 0, 0.09, 0.09, 0.06, 8);
      c.boite(0.12, 0.16, 0.12, 0xffe8b0, { x: 0.7, y: 2.8 }, M.lueur, { crasse: false });
      cylindre(c, M.lisse, 0xe8e6e0, 0.7, 2.88, 0, 0.1, 0.1, 0.05, 8);
      c.boite(0.13, 0.01, 0.13, 0x1f2a3a, { x: 0.7, y: 2.935 }, M.lisse, { crasse: false });
    });
    b.lumiere(-12.3, 2.85, 13.7, 0xffb860, 3.5, 9, "lanterne solaire de jardin pendue au réverbère du belvédère (elle se recharge encore le jour)");
    // La longue-vue à pièces
    c.repere({ x: -16, y: 0, z: 14.7, ry: 0.2 }, () => {
      c.tube([0, 0, 0], [0, 1.15, 0], 0.07, 0x6f8a76, M.tole, 6);
      c.boite(0.26, 0.3, 0.22, 0x6f8a76, { y: 1.25 }, M.tole);
      c.tube([0, 1.35, -0.35], [0, 1.45, 0.45], 0.09, 0x6f8a76, M.tole, 6);
      for (const s of [-1, 1]) c.boite(0.04, 0.04, 0.2, FONTE, { x: s * 0.16, y: 1.3, z: -0.25 }, M.metal);
    });
    // Pins parasols et agaves en pots de pierre ; lauriers-roses le long de la balustrade
    // Le grand pin parasol (C-3) : au coin est du belvédère, penché vers la mer, pour ne plus cacher la barricade du
    // tunnel à la caméra sud-est ; sa couronne est une couche qui s'efface quand on passe dessous ou derrière.
    const [px, pz, ph, pd, pp] = [-7.4, 14.4, 9.5, 1.45, 0.16];
    const hx = px + Math.cos(pd) * pp * ph;
    const hz = pz + Math.sin(pd) * pp * ph;
    const kp = b.couche("couronne du pin parasol du belvédère", { x: arr(hx), z: arr(hz), l: 8.4, p: 8.4 }, ph * 0.78, ph + 0.6);
    pinParasol(c, M, px, pz, ph, 0, pd, pp, kp);
    c.boite(1.4, 0.12, 1.4, PIERRE, { x: px, y: 0.06, z: pz }, M.pierre);
    agave(c, M, -19.2, 14.0, 0.8, 0);
    for (const [x, z] of [[-20, 11], [-11, 3.4], [-15, 3.4]]) {
      cylindre(c, M.pierre, 0xc9a27e, x, 0, z, 0.45, 0.35, 0.6, 8);
      agave(c, M, x, z, 0.75, 0.6);
    }
    for (const [x, z] of [[-19.6, 14.6], [-11.6, 15.1], [-20.1, 7.6]]) laurier(c, M, x, z, 1.1, 0);
    jonchee(c, -20, 3, -6, 15, 30 + 30 * u, [0x9c7a45, 0x7d6143, 0xb08f55]);
  }
  // Le kiosque à glaces : guichet sur la route, porte côté mer, store rayé en lambeaux
  if (ctx.ici(-6.1)) {
    const X1 = -7.4;
    const X2 = -4.8;
    const Z1 = 4.3;
    const Z2 = 6.5;
    const H = 2.45;
    const k = b.couche("kiosque à glaces", { x: -6.1, z: 5.4, l: 3.6, p: 3.4 }, 1.05, 3.4);
    const rose = { couleur: ENDUIT_ROSE, mat: M.enduit };
    mur(c, [X2, Z1], [X1, Z1], { h: H, ep: 0.15, couleur: ENDUIT_ROSE, mat: M.enduit, batiment: b, ouvertures: [{ u: 1.3, l: 1.6, bas: 1.0, haut: 2.0, type: "vide" }] });
    mur(c, [X1, Z1], [X1, Z2], { h: H, ep: 0.15, couleur: ENDUIT_ROSE, mat: M.enduit, batiment: b });
    murDouble(ctx, k, [X1, Z2], [X2, Z2], { h: H, ep: 0.15, bas: rose, ouvertures: [{ u: 1.115, l: 1.5, bas: 0, haut: 2.1, type: "porte" }] });
    murDouble(ctx, k, [X2, Z2], [X2, Z1], { h: H, ep: 0.15, bas: rose });
    c.boite(1.7, 0.06, 0.4, 0xd8d2c4, { x: -6.1, y: 1.0, z: Z1 - 0.12 }, M.lisse);
    k.pave(X1 - 0.3, H, Z1 - 0.3, X2 + 0.3, H + 0.15, Z2 + 0.3, 0xe8e2d4, M.enduit, { crasse: false });
    panneau(k, M, R.glaces, { x: -6.1, y: H + 0.4, z: Z2 + 0.32 }, 2.6, 0.62);
    k.boite(2.7, 0.66, 0.06, 0xe8e2d4, { x: -6.1, y: H + 0.4, z: Z2 + 0.28 }, M.satine);
    // Le store rayé au-dessus du guichet, déchiré
    for (let i = 0; i < 6; i++) {
      if (u > 0.6 && i === 4) continue;
      const lg = i === 2 && u > 0.4 ? 0.5 : 1.1;
      planche(c, [X1 + 0.3 + i * 0.36, 2.3, Z1 - 0.05], [X1 + 0.3 + i * 0.36, 2.3 - lg * 0.45, Z1 - 0.05 - lg * 0.9], 0.36, 0.02, i % 2 ? 0xe8e2d4 : 0x7fb0a8, M.toile, [1, 0, 0], { crasse: false });
    }
    // Dedans : le bac congélateur, le distributeur de cornets, les sirops
    c.boite(0.6, 0.85, 1.2, INOX, { x: -6.95, y: 0.43, z: 5.65 }, M.metal);
    c.boite(0.5, 0.04, 1.1, 0x9aa0a0, { x: -6.95, y: 0.87, z: 5.65 }, M.verre, { crasse: false });
    cylindre(c, M.lisse, 0xd8d0b8, -5.2, 1.0, 4.6, 0.06, 0.06, 0.5, 6);
    for (let i = 0; i < 5; i++) cylindre(c, M.lisse, [0xc0503c, 0x7fb0a8, 0xc79a3b, 0x9a6ab0, 0x6fa058][i], -7.15, 1.03, 4.6 + i * 0.13, 0.04, 0.04, 0.26, 5);
    // Le parasol replié et les chaises empilées dehors
    c.tube([-3.9, 0, 7.4], [-4.1, 2.2, 7.3], 0.03, ALU, M.metal, 4);
    cylindre(c, M.toile, 0x7fb0a8, -4.08, 1.0, 7.3, 0.06, 0.18, 1.2, 6);
    for (let i = 0; i < 3; i++) chaise(c, M, -3.9, 5.2, 0.2, false, 0xe8e2d4, i * 0.08);
  }
}

// ---------- Le Panoramique : l'hôtel-restaurant des années 1960 accroché à la falaise ----------

/** Une façade vitrée (mur-rideau des années 1960) de a à b : allège basse, montants d'aluminium, carreaux à moitié brisés. */
function vitrage(ctx, a, bb, H, portes, bris) {
  const { c, b, M } = ctx;
  const dx = bb[0] - a[0];
  const dz = bb[1] - a[1];
  const L = Math.hypot(dx, dz);
  const ux = dx / L;
  const uz = dz / L;
  const ry = -Math.atan2(dz, dx);
  const n = Math.max(1, Math.round(L / 1.6));
  const lb = L / n;
  const P = (t) => [a[0] + ux * t, a[1] + uz * t];
  for (let i = 0; i < n; i++) {
    const t0 = i * lb;
    const t1 = t0 + lb;
    const [xm, zm] = P(t0 + lb / 2);
    const porte = portes.some((p) => Math.abs(p - (Math.abs(ux) > 0.5 ? xm : zm)) < lb / 2);
    const [x0, z0] = P(t0);
    const [x1, z1] = P(t1);
    if (!porte) {
      c.boite(lb + 0.01, 0.45, 0.26, ENDUIT, { x: xm, y: 0.225, z: zm, ry }, M.enduit);
      b.obstacle(x0, z0, x1, z1, "baie vitrée de la salle");
    } else {
      c.boite(lb - 0.1, 0.03, 0.26, ALU, { x: xm, y: 0.015, z: zm, ry }, M.metal);
    }
    c.boite(0.09, H, 0.14, ALU, { x: x0, y: H / 2, z: z0, ry }, M.metal);
    c.boite(lb, 0.07, 0.12, ALU, { x: xm, y: 2.5, z: zm, ry }, M.metal);
    const yb = porte ? 0.05 : 0.45;
    if (c.hasard() > bris) c.boite(lb - 0.1, 2.5 - yb - 0.06, 0.012, 0xffffff, { x: xm, y: (yb + 2.5) / 2, z: zm, ry }, M.verre, { crasse: false });
    else if (c.hasard() < 0.6) planche(c, [x0 + ux * 0.1, 2.44, z0 + uz * 0.1], [x0 + ux * lb * 0.45, 1.6, z0 + uz * lb * 0.45], 0.4, 0.012, 0xffffff, M.verre, [0, 0, 1], { crasse: false });
    if (c.hasard() > bris * 0.6) c.boite(lb - 0.1, 0.42, 0.012, 0xffffff, { x: xm, y: 2.77, z: zm, ry }, M.verre, { crasse: false });
  }
  const [xe, ze] = P(L);
  c.boite(0.09, H, 0.14, ALU, { x: xe, y: H / 2, z: ze, ry }, M.metal);
  c.boite(L, 0.22, 0.28, ENDUIT, { x: (a[0] + bb[0]) / 2, y: H - 0.11, z: (a[1] + bb[1]) / 2, ry }, M.enduit, { crasse: false });
}

function transat(c, M, x, z, ry, couleur = 0xd8b04a) {
  c.repere({ x, y: 0, z, ry }, () => {
    planche(c, [-0.8, 0.3, 0], [0.4, 0.3, 0], 0.6, 0.04, couleur, M.toile, [0, 1, 0]);
    planche(c, [0.4, 0.3, 0], [0.95, 0.85, 0], 0.6, 0.04, couleur, M.toile, [0, 1, 0]);
    for (const s of [-0.3, 0.3]) {
      c.tube([-0.8, 0, s], [-0.8, 0.3, s], 0.02, ALU, M.metal, 3);
      c.tube([0.4, 0, s], [0.4, 0.3, s], 0.02, ALU, M.metal, 3);
    }
  });
}

function palmierEnPot(c, M, x, z, s = 1) {
  cylindre(c, M.pierre, 0xc9a27e, x, 0, z, 0.32 * s, 0.24 * s, 0.55 * s, 8);
  c.tube([x, 0.5 * s, z], [x + 0.1, 1.6 * s, z], 0.05 * s, 0x7a6448, M.mat, 4);
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    const sec = k % 3 === 0;
    c.repere({ x: x + 0.1, y: 1.6 * s, z, ry: -a }, () => {
      c.poser(FEUILLE, M.mat, sec ? 0x9a8a58 : 0x6d8a4a, { x: 0.45 * s, y: sec ? -0.2 : 0.05, rz: sec ? -2.2 : -1.25, e: [0.09 * s, 0.95 * s, 0.03 * s] }, { crasse: false, nuance: 0.08 });
    });
  }
}

function panoramique(ctx) {
  if (!ctx.ici(17)) return;
  const { c, b, M, u } = ctx;
  const X1 = 4;
  const X2 = 30;
  const Z1 = 5.5;
  const ZM = 11.5;
  const Z2 = 19;
  const H = 3.2;
  const enduit = { couleur: ENDUIT, mat: M.enduit };
  // Le parvis côté route : enrobé fatigué, cases de stationnement
  c.boite(28, 0.03, 3.6, 0x66676a, { x: 17, y: 0.015, z: 3.7 }, M.mat, { crasse: false, nuance: 0 });
  for (let x = 2.5; x < 31; x += 2.6) c.boite(0.08, 0.005, 2.4, 0xd8d4c8, { x, y: 0.035, z: 3.9 }, M.mat, { crasse: false });
  // Les sols : tomettes des chambres et du hall, carrelage de la cuisine et de la salle
  c.boite(9, 0.03, 6, 0xb88a6a, { x: 8.5, y: 0.015, z: 8.5 }, M.mat, { crasse: false, nuance: 0 });
  c.boite(8, 0.03, 6, 0xc49a74, { x: 17, y: 0.015, z: 8.5 }, M.mat, { crasse: false, nuance: 0 });
  c.boite(9, 0.03, 6, 0xd8d8d0, { x: 25.5, y: 0.016, z: 8.5 }, M.carrelage, { crasse: false, nuance: 0 });
  c.boite(26, 0.03, 7.5, 0xe0d6c2, { x: 17, y: 0.016, z: 15.25 }, M.carrelage, { crasse: false, nuance: 0 });

  // Les murs : façade nord sur la route (portes des chambres, grande porte du hall), pignons, refends
  const portesChambre = [25, 22, 19].map((uu, i) => ({ u: uu, l: 1.3, bas: 0, haut: 2.15, type: "porte", vantail: i === 1 && u > 0.5 ? "tombe" : "entrouvert", couleurPorte: BLEU_60, angle: 0.6 + i * 0.4 }));
  const fenChambre = [23.75, 20.75, 17.75].map((uu, i) => ({ u: uu, l: 0.9, bas: 1.1, haut: 2.1, type: "fenetre", bris: 0.3 + 0.6 * u, volet: i === 2 ? "pendu" : "ouvert", couleurVolet: BLEU_60 }));
  mur(c, [X2, Z1], [X1, Z1], {
    h: H, ep: 0.3, couleur: ENDUIT, mat: M.enduit, batiment: b,
    ouvertures: [
      ...portesChambre, ...fenChambre,
      { u: 13, l: 1.8, bas: 0, haut: 2.3, type: "porte" },
      { u: 15, l: 1.2, bas: 1.0, haut: 2.3, type: "fenetre", bris: 0.5 + 0.5 * u },
      { u: 10.2, l: 1.0, bas: 1.0, haut: 2.3, type: "fenetre", bris: 0.5 + 0.5 * u },
      { u: 6.5, l: 1.0, bas: 1.2, haut: 2.1, type: "fenetre", bris: 0.4 + 0.5 * u },
      { u: 2.5, l: 1.0, bas: 1.2, haut: 2.1, type: "fenetre", bris: 0.4 + 0.5 * u },
    ],
  });
  mur(c, [X1, Z1], [X1, Z2], { h: H, ep: 0.3, couleur: ENDUIT, mat: M.enduit, batiment: b, ouvertures: [{ u: 3, l: 0.8, bas: 1.1, haut: 2.0, type: "fenetre", bris: 0.6 }, { u: 10, l: 1.6, bas: 0.9, haut: 2.4, type: "fenetre", bris: 0.4 + 0.5 * u, traverses: 2 }] });
  mur(c, [X2, ZM], [X2, Z1], { h: H, ep: 0.3, couleur: ENDUIT, mat: M.enduit, batiment: b, ouvertures: [{ u: 3, l: 1.3, bas: 0, haut: 2.15, type: "porte", vantail: "entrouvert", couleurPorte: 0x8a8f90, angle: 1.3 }] });
  for (const x of [7, 10]) mur(c, [x, Z1], [x, ZM], { h: H, ep: 0.16, couleur: 0xe2d6c0, mat: M.enduit, batiment: b });
  mur(c, [13, Z1], [13, ZM], { h: H, ep: 0.16, couleur: 0xe2d6c0, mat: M.enduit, batiment: b, breches: u > 0.5 ? [{ u: 4.2, l: 1.6, profondeur: 1.4 }] : [] });
  mur(c, [21, Z1], [21, ZM], { h: H, ep: 0.16, couleur: 0xe2d6c0, mat: M.enduit, batiment: b, ouvertures: [{ u: 4.1, l: 1.3, bas: 0, haut: 2.15, type: "porte" }] });
  mur(c, [X1, ZM], [X2, ZM], { h: H, ep: 0.2, couleur: 0xe2d6c0, mat: M.enduit, batiment: b, ouvertures: [{ u: 13, l: 1.6, bas: 0, haut: 2.3, type: "porte" }, { u: 19, l: 1.2, bas: 1.0, haut: 1.6, type: "vide" }, { u: 21.5, l: 1.3, bas: 0, haut: 2.15, type: "porte", vantail: "entrouvert", couleurPorte: BLEU_60, angle: 1.4 }] });
  c.boite(26.6, 0.4, 0.04, BLEU_60, { x: 17, y: 0.2, z: Z1 - 0.17 }, M.satine); // le soubassement bleu
  // La salle à manger : vitrée sur la mer au sud et à l'est
  vitrage(ctx, [X1, Z2], [X2, Z2], H, [9, 15], 0.15 + 0.7 * u);
  vitrage(ctx, [X2, ZM], [X2, Z2], H, [], 0.3 + 0.6 * u);
  panneau(c, M, R.chambre, { x: 8, y: 2.65, z: Z1 - 0.16, ry: Math.PI }, 2.4, 0.6);

  // Le toit-terrasse débordant, son bandeau, et l'enseigne : « Infinity Sunset Experience » posée sur « Le Panoramique »
  const k = b.couche("toit du Panoramique", { x: 17, z: 12.7, l: 28, p: 16.6 }, 2.9, 6.4);
  for (let x = 3.2; x < 30.79; x += 2.3) {
    const l = Math.min(2.3, 30.8 - x);
    const xm = x + l / 2;
    const troue = u > 0.55 && xm > 21 && xm < 27;
    const z2 = troue ? 13.4 : 20.4;
    k.pave(x, H, 4.9, x + l, H + 0.22, z2, ENDUIT, M.enduit, { crasse: false, nuance: 0.02 });
    if (troue) {
      k.boite(l, 0.22, 2.2, ENDUIT, { x: xm - 0.3, y: H - 0.9, z: 14.4, rx: 0.7 }, M.enduit, { crasse: false }); // un pan de dalle qui pend
    }
  }
  k.boite(27.7, 0.26, 0.06, BLEU_60, { x: 17, y: H + 0.11, z: 20.43 }, M.satine);
  k.boite(0.06, 0.26, 15.6, BLEU_60, { x: 30.83, y: H + 0.11, z: 12.65 }, M.satine);
  for (const x of [8.6, 19.4]) k.tube([x, H + 0.2, 19.4], [x, 6.0, 19.4], 0.06, ALU, M.metal, 5);
  k.boite(11.2, 0.08, 0.08, ALU, { x: 14, y: 5.85, z: 19.4 }, M.metal);
  panneau(k, M, R.panoramique, { x: 14, y: 4.75, z: 19.5 }, 11, 2.06);
  panneau(k, M, R.infinity, { x: 12.2, y: 4.8, z: 19.56, rz: 0.03 }, 7.6, 1.42);
  // Sur le toit : l'acrotère, le réservoir d'eau, les blocs de climatisation « Infinity », l'antenne, la mousse
  for (const [x1, z1, x2, z2] of [[3.2, 4.9, 30.8, 4.9], [3.2, 4.9, 3.2, 20.4], [30.8, 4.9, 30.8, 13.4]]) boiteEntre(k, x1, z1, x2, z2, H + 0.2, 0.35, 0.18, ENDUIT, M.enduit, { crasse: false });
  cylindre(k, M.tole, 0x8a8f90, 6.4, H + 0.2, 7.2, 0.8, 0.8, 1.5, 10);
  k.boite(0.1, 0.9, 0.1, 0x6a6e70, { x: 6.4, y: H + 2.1, z: 7.2 }, M.tole);
  for (const [x, z] of [[11, 6.6], [13.2, 6.6], [27.2, 7.4]]) {
    k.boite(1.1, 0.8, 0.7, 0xd8d6cf, { x, y: H + 0.6, z }, M.tole);
    cylindre(k, M.tole, 0x3a3a38, x, H + 0.6, z + 0.36, 0.28, 0.28, 0.02, 10, { rx: Math.PI / 2, y: H + 0.6 });
  }
  k.tube([17.6, H + 0.2, 6.2], [17.6, H + 3.2, 6.2], 0.03, ACIER, M.metal, 4);
  for (let i = 0; i < 4; i++) k.boite(1.2 - i * 0.2, 0.03, 0.03, ACIER, { x: 17.6, y: H + 2.2 + i * 0.3, z: 6.2, ry: 0.4 }, M.metal);
  for (let i = 0; i < 10; i++) k.boite(k.entre(1, 3), 0.02, k.entre(0.8, 2.2), k.hasard() < 0.5 ? 0x8a8c5a : 0xb8ad98, { x: k.entre(4, 30), y: H + 0.23, z: k.entre(5.5, 12.8), ry: k.hasard() * 3 }, M.mat, { crasse: false });
  if (u > 0.55) {
    raiDeLumiere(c, [24, 3.6, 16.8], [23.4, 0.05, 16.2], 2.4, 0.16);
    gravats(c, 24, 16.4, 1.6, 14 + 10 * u, [ENDUIT, 0xd8d8d0, 0xc9a27e]);
  }

  // Le hall : réception, casier à clés, juke-box ; le bar et son étagère de bouteilles
  c.boite(0.6, 1.05, 2.6, 0x8a6a48, { x: 14.3, y: 0.52, z: 8.4 }, M.satine);
  c.boite(0.72, 0.05, 2.7, 0xd8d2c4, { x: 14.3, y: 1.07, z: 8.4 }, M.lisse);
  c.boite(0.06, 0.9, 1.2, BOIS, { x: 13.13, y: 1.7, z: 8.4 }, M.mat);
  for (let i = 0; i < 12; i++) c.boite(0.03, 0.08, 0.04, PALETTE.laiton, { x: 13.18, y: 1.4 + Math.floor(i / 4) * 0.25, z: 7.95 + (i % 4) * 0.3 }, M.metal, { crasse: false });
  c.repere({ x: 14.5, y: 0, z: 11.0, ry: Math.PI }, () => {
    c.boite(0.9, 1.25, 0.6, 0xd8b04a, { y: 0.62 }, M.satine);
    cylindre(c, M.verre, 0xffffff, 0, 1.25, 0, 0.45, 0.45, 0.6, 8, { rx: Math.PI / 2, y: 1.25, z: 0 });
    c.boite(0.7, 0.3, 0.05, 0xc0503c, { y: 0.45, z: 0.31 }, M.lisse);
  });
  panneau(c, M, R.menu, { x: 16.2, y: 1.6, z: ZM - 0.11, ry: Math.PI }, 1.0, 0.62);
  c.boite(0.55, 1.05, 3.8, BLEU_60, { x: 19.3, y: 0.52, z: 8.7 }, M.satine);
  c.boite(0.7, 0.05, 3.9, 0xd8d2c4, { x: 19.3, y: 1.07, z: 8.7 }, M.lisse);
  etagere(c, M, 20.66, 7.9, -Math.PI / 2, 2.0, 2.1, [0x5f7a42, 0x8a5a3a, 0xc79a3b, 0x3a3a38, 0xd8d0b8], 0.55 + 0.3 * (1 - u));
  for (let i = 0; i < 3; i++) {
    const tombe = i === 1 && u > 0.4;
    c.repere({ x: 18.6, y: 0, z: 7.4 + i * 1.2, rx: tombe ? 1.5 : 0, y: tombe ? 0.25 : 0 }, () => {
      cylindre(c, M.metal, INOX, 0, 0, 0, 0.03, 0.03, 0.7, 4);
      cylindre(c, M.satine, 0xc0503c, 0, 0.7, 0, 0.2, 0.2, 0.08, 8);
    });
  }
  cylindre(c, M.lisse, 0xeee6cf, 19.2, 1.1, 9.8, 0.04, 0.04, 0.12, 5);
  b.lumiere(19.2, 1.3, 9.8, 0xffc070, 1.8, 5, "bougie sur le comptoir du bar");
  b.obstacle(19.3, 6.8, 19.3, 10.6, "comptoir du bar");
  b.obstacle(14.3, 7.1, 14.3, 9.7, "comptoir de la réception");

  // Les trois chambres, sur la route
  const couvres = [POLAIRES[1], POLAIRES[2], POLAIRES[4]]; // des couvertures polaires sur les lits
  [5.5, 8.5, 11.5].forEach((cx, i) => {
    lit(c, M, cx + 0.15, 10.4, Math.PI, 1.4, couvres[i], u > 0.5 && i !== 1);
    c.boite(0.45, 0.5, 0.4, BOIS, { x: cx - 1.0, y: 0.25, z: 11.05 }, M.mat);
    cylindre(c, M.lisse, 0xe8dcc0, cx - 1.0, 0.5, 11.05, 0.1, 0.14, 0.3, 6);
    c.boite(1.0, 2.0, 0.55, BOIS, { x: cx + 1.15, y: 1.0, z: 7.0, ry: Math.PI / 2 }, M.mat);
    c.boite(1.5, 0.01, 1.0, [0x8a4a3a, 0x4f6a7a, 0x7a6a3a][i], { x: cx - 0.2, y: 0.035, z: 8.4, ry: 0.1 }, M.toile, { crasse: false });
    if (i === 1) c.boite(0.6, 0.4, 0.25, 0x7a4a3a, { x: cx - 0.6, y: 0.2, z: 7.2, ry: 0.4 }, M.satine);
    debris(c, cx - 1.3, 5.8, cx + 1.3, 11.2, 4 * u);
    // Le lavabo contre le mur ouest, son miroir piqué, la tablette et la trousse de toilette (le fil dentaire)
    c.repere({ x: cx - 1.2, y: 0, z: 7.7, ry: Math.PI / 2 }, () => {
      c.boite(0.16, 0.7, 0.16, 0xeeeae0, { y: 0.35, z: -0.05 }, M.lisse);
      c.boite(0.52, 0.16, 0.38, 0xf2efe6, { y: 0.8 }, M.lisse);
      c.boite(0.4, 0.04, 0.26, 0xb8c4c6, { y: 0.87, z: 0.02 }, M.metal, { crasse: false });
      c.boite(0.46, 0.04, 0.12, 0xeeeae0, { y: 1.12, z: -0.13 }, M.lisse);
      c.boite(0.44, 0.52, 0.02, i === 1 ? 0x8a9496 : 0xc8d4d6, { y: 1.48, z: -0.18 }, M.lisse, { crasse: false });
      cylindre(c, M.verre, 0xffffff, -0.14, 1.14, -0.13, 0.03, 0.03, 0.09, 5);
      c.boite(0.2, 0.08, 0.09, [0x5a8a8a, 0x8a4a5a, 0x4a5a7a][i], { x: 0.1, y: 1.18, z: -0.12, ry: 0.2 }, M.toile);
    });
  });

  // La cuisine : piano, hotte, plans de travail en inox, évier, étagères, chambre froide
  c.boite(2.2, 0.9, 1.0, INOX, { x: 25.5, y: 0.45, z: 8.6 }, M.metal);
  c.boite(2.2, 0.03, 1.0, 0x2a2a2a, { x: 25.5, y: 0.915, z: 8.6 }, M.satine);
  for (const [dx, dz, r] of [[-0.6, -0.2, 0.22], [0.4, 0.2, 0.18], [0.7, -0.25, 0.15]]) cylindre(c, M.metal, 0x9a9c98, 25.5 + dx, 0.93, 8.6 + dz, r, r * 0.9, 0.25, 8);
  c.boite(2.4, 0.5, 1.3, INOX, { x: 25.5, y: 2.55, z: 8.6 }, M.metal);
  c.tube([25.5, 2.8, 8.6], [25.5, H, 8.6], 0.15, INOX, M.metal, 6);
  c.boite(8, 0.9, 0.62, INOX, { x: 25.5, y: 0.45, z: 6.0 }, M.metal);
  c.boite(0.8, 0.12, 0.45, 0x8a8f90, { x: 28.2, y: 0.86, z: 6.0 }, M.metal, { crasse: false });
  etagere(c, M, 23.2, ZM - 0.32, Math.PI, 2.4, 1.9, [0xc0503c, 0xd8d0b8, 0x3f7a7c, 0xc79a3b, 0x8a8f90], 0.45 + 0.4 * (1 - u));
  c.boite(1.8, 2.4, 1.6, INOX, { x: 28.9, y: 1.2, z: 10.5 }, M.metal);
  c.boite(0.9, 2.0, 0.06, 0xd8d8d0, { x: 28.4, y: 1.0, z: 9.68, ry: u > 0.5 ? -0.8 : 0 }, M.satine);
  b.obstacle(24.4, 8.6, 26.6, 8.6, "piano de cuisson");
  b.obstacle(28, 9.7, 29.8, 9.7, "chambre froide");
  debris(c, 21.4, 6.4, 29.6, 11.2, 10 * u, [0xd8d8d0, 0x9a9c98, 0xc0503c]);

  // La salle à manger : tables rondes, nappes, chaises renversées, buffet, le « Sunset Booth »
  for (const x of [6.4, 9.8, 13.2, 16.6, 20, 23.4, 26.8]) {
    for (const z of [14.1, 17.1]) {
      const sousTrou = u > 0.55 && x > 21 && x < 27 && z > 15;
      if (sousTrou) continue;
      tableRonde(c, M, x, z, 0.55, hache(Math.round(x * 10), Math.round(z)) < 0.6);
      for (let j = 0; j < 3; j++) {
        if (hache(Math.round(x * 10) + j, Math.round(z) + 3) < 0.25) continue;
        const a = j * 2.1 + x;
        const renv = hache(Math.round(x * 10) + j, 9) < 0.45 * u;
        chaise(c, M, x + Math.cos(a) * 0.85, z + Math.sin(a) * 0.85, -a - Math.PI / 2, renv, j % 2 ? 0xc0503c : 0xe8e2d4);
      }
    }
  }
  c.boite(3.0, 0.9, 0.5, 0x8a6a48, { x: 8, y: 0.45, z: 11.9 }, M.satine);
  c.boite(3.1, 0.04, 0.55, 0xd8d2c4, { x: 8, y: 0.92, z: 11.9 }, M.lisse);
  b.obstacle(6.5, 11.9, 9.5, 11.9, "buffet");
  c.repere({ x: 28.6, y: 0, z: 12.6, ry: -0.5 }, () => {
    c.boite(1.0, 2.1, 0.9, 0x2b2f33, { y: 1.05 }, M.lisse);
    panneau(c, M, R.sunset, { y: 1.45, z: 0.46 }, 0.8, 0.8);
    c.poser(ANNEAU, M.lisse, 0xf0eee8, { y: 2.3, z: 0.3, e: [0.3, 0.3, 0.3] }, { crasse: false });
  });
  palmierEnPot(c, M, 4.9, 18.2, 1.1);
  palmierEnPot(c, M, 15.4, 12.4, 0.9);
  jonchee(c, 4.5, 12, 29.5, 18.6, 25 * u, [0xe8e2d4, 0xd8d0b8, 0x9c7a45]);
  debris(c, 4.5, 12, 29.5, 18.6, 12 * u, [0xe0e8ea, ENDUIT]);

  // Le totem de la route : la vieille enseigne et l'autocollant « Infinity » par-dessus
  c.repere({ x: 2.4, y: 0, z: 3.6, ry: Math.PI / 4 }, () => {
    c.boite(0.7, 0.3, 0.5, 0xb8ad98, { y: 0.15 }, M.mat);
    c.boite(0.3, 5.2, 0.3, BLEU_60, { y: 2.6 }, M.satine);
    c.boite(1.62, 2.66, 0.14, 0xe8e2d4, { y: 3.7 }, M.satine);
    panneau(c, M, R.totem, { y: 3.7, z: 0.075 }, 1.5, 2.5);
    panneau(c, M, R.totem, { y: 3.7, z: -0.075, ry: Math.PI }, 1.5, 2.5);
  });
  // Des lauriers-roses et des agaves au pied de la façade
  laurier(c, M, 3.4, 6.6, 1.2, 0);
  laurier(c, M, 30.9, 7.5, 1.0, 0);
  agave(c, M, 3.2, 17.5, 1.0, 0, true);
  agave(c, M, 31.1, 13.5, 0.9, 0);
  figuier(c, M, 31.2, 17.8, 1.0, 0);
}

function terrasse(ctx) {
  if (!ctx.ici(17)) return;
  const { c, b, M, u } = ctx;
  const TOM = 0xc9a27e;
  // La partie qui tient : dalle de tomettes sur ses consoles de béton
  c.boite(13.0, 0.3, 5.0, TOM, { x: 11.1, y: -0.13, z: 21.5 }, M.mat, { nuance: 0.02 });
  for (let x = 5.2; x < 17.6; x += 1.0) c.boite(0.03, 0.005, 4.9, 0xa8805e, { x, y: 0.025, z: 21.5 }, M.mat, { crasse: false });
  for (const x of [5.0, 8.1, 11.2, 14.3, 17.3]) {
    c.boite(0.3, 0.38, 5.0, ENDUIT, { x, y: -0.47, z: 21.5 }, M.enduit);
    planche(c, [x, -3.6, 20.4], [x, -0.6, 23.4], 0.3, 0.35, ENDUIT, M.enduit, [1, 0, 0]);
  }
  // Le garde-corps tubulaire blanc, un peu tordu
  const gc = [[4.7, 19.2], [4.7, 23.85], [17.5, 23.85]];
  for (let s = 0; s < gc.length - 1; s++) {
    const [xa, za] = gc[s];
    const [xb, zb] = gc[s + 1];
    const L = Math.hypot(xb - xa, zb - za);
    const n = Math.round(L / 1.3);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = xa + (xb - xa) * t;
      const z = za + (zb - za) * t;
      const tordu = s === 1 && i > 5 && i < 8 && u > 0.4;
      c.tube([x, 0, z], [x, 1.0, z + (tordu ? 0.4 : 0)], 0.03, ENDUIT, M.metal, 4);
    }
    for (const y of [1.0, 0.55]) boiteEntre(c, xa, za, xb, zb, y - 0.03, 0.05, 0.05, ENDUIT, M.metal, { crasse: false });
    b.obstacle(xa, za, xb, zb, "garde-corps de la terrasse (vide dessous)");
  }
  b.obstacle(17.6, 19.2, 17.6, 23.85, "terrasse effondrée (vide)");
  // La partie tombée : un moignon contre la façade, deux pans qui pendent, les consoles cassées, un morceau en bas
  c.boite(12.4, 0.3, 0.8, TOM, { x: 23.8, y: -0.13, z: 19.4 }, M.mat);
  b.obstacle(17.6, 19.8, 30.2, 19.8, "terrasse effondrée (vide)");
  planche(c, [18.0, -0.1, 19.85], [19.4, -4.9, 22.4], 3.2, 0.3, TOM, M.mat, [1, 0, 0]);
  planche(c, [22.6, -0.15, 19.85], [24.4, -2.9, 23.2], 4.4, 0.3, TOM, M.mat, [1, 0, 0]);
  for (const x of [20.4, 23.5, 26.6, 29.6]) planche(c, [x, -3.6, 20.4], [x + 0.2, -1.6, 21.6], 0.3, 0.35, ENDUIT, M.enduit, [1, 0, 0]);
  for (let i = 0; i < 4; i++) c.tube([18.2 + i * 1.2, 0.0, 19.9], [18.6 + i * 1.3, -1.4 - i * 0.3, 20.6 + i * 0.2], 0.015, 0x6a4a36, M.metal, 3);
  planche(c, [17.6, 0.9, 23.85], [19.6, -2.6, 24.6], 0.05, 0.05, ENDUIT, M.metal);
  const yb = hauteur(24, 25.5);
  c.boite(4.2, 0.3, 3.0, TOM, { x: 24, y: yb + 0.6, z: 25.5, rx: 0.3, rz: 0.25 }, M.mat);
  gravats(c, 22, 25, 2.4, 14, [TOM, ENDUIT, ROC], yb);
  // Le feu des survivants : un fût découpé, des chaises de jardin, un pare-vent de bâche, des couvertures polaires
  const fx = 10.5;
  const fz = 21.6;
  cylindre(c, M.tole, 0x5f4a3a, fx, 0, fz, 0.32, 0.3, 0.7, 8);
  c.poser(BOULE, M.mat, 0x2a2420, { x: fx, y: 0.68, z: fz, e: [0.28, 0.06, 0.28] }, { crasse: false });
  c.boite(0.8, 0.03, 0.8, FONTE, { x: fx, y: 0.75, z: fz }, M.metal);
  cylindre(c, M.metal, FONTE, fx + 0.1, 0.77, fz, 0.18, 0.15, 0.25, 8);
  for (let i = 0; i < 4; i++) chaise(c, M, fx + Math.cos(i * 1.6 + 0.4) * 1.3, fz + Math.sin(i * 1.6 + 0.4) * 1.1, -(i * 1.6 + 0.4) + Math.PI / 2, false, 0xe8e2d4);
  for (const x of [6.0, 8.6]) c.tube([x, 0, 20.1], [x, 1.7, 20.1], 0.03, BOIS, M.mat, 4);
  planche(c, [6.0, 1.65, 20.1], [8.6, 1.65, 20.1], 1.6, 0.02, 0x4f6a5a, M.toile, [0, 0, 1]);
  c.boite(1.6, 0.1, 0.9, POLAIRES[0], { x: 7.2, y: 0.07, z: 20.8, ry: 0.1 }, M.toile);
  c.boite(1.4, 0.1, 0.8, POLAIRES[3], { x: 12.6, y: 0.07, z: 22.9, ry: -0.3 }, M.toile);
  b.lumiere(fx, 1.0, fz, 0xff8a3d, 12, 12, "feu des survivants sur la terrasse du Panoramique");
  // Les transats délavés, le parasol nu
  transat(c, M, 15.6, 22.9, -0.3);
  transat(c, M, 5.8, 23.1, 0.2, 0x7fb0a8);
  c.tube([13.8, 0, 23.0], [13.9, 2.3, 23.0], 0.03, ALU, M.metal, 4);
  for (let i = 0; i < 6; i++) c.tube([13.9, 2.3, 23.0], [13.9 + Math.cos(i) * 1.1, 1.85, 23.0 + Math.sin(i) * 1.1], 0.012, ALU, M.metal, 3);
}

function parkingHotel(ctx) {
  if (!ctx.ici(10)) return;
  const { c, b, M, u } = ctx;
  c.boite(21, 0.03, 6.2, 0xaaa290, { x: 10, y: 0.015, z: -8.2 }, M.mat, { crasse: false, nuance: 0 });
  for (let x = 1; x < 20; x += 2.8) c.boite(0.08, 0.005, 3.4, 0xd8d4c8, { x, y: 0.035, z: -8.8 }, M.mat, { crasse: false });
  voiture(c, M, 8, 0, -8.4, Math.PI / 2 + 0.06, 0x6a7f99, { roues: 4, capot: false, porte: true });
  voiture(c, M, 14.2, 0, -8.6, Math.PI / 2 - 0.1, 0xd8d0b8, { roues: 3, capot: true, rz: 0.05 });
  b.obstacle(7.2, -10.4, 7.2, -6.4, "épave");
  b.obstacle(8.8, -10.4, 8.8, -6.4, "épave");
  b.obstacle(13.4, -10.6, 13.4, -6.6, "épave");
  b.obstacle(15.0, -10.6, 15.0, -6.6, "épave");
  c.repere({ x: 2.6, y: 0, z: -10.6 }, () => {
    c.boite(0.08, 2.2, 0.08, ALU, { y: 1.1 }, M.metal);
    panneau(c, M, R.parking, { y: 1.9, z: 0.05 }, 1.3, 0.5);
  });
  pinParasol(c, M, 18.6, -9.6, 11, 0, 1.0, 0.14);
  pinParasol(c, M, -0.2, -9.2, 9, 0, 0.3, 0.1);
  for (const x of [4.5, 11.2, 16.8]) laurier(c, M, x, -11.0, 1.0, 0);
  agave(c, M, 20.4, -6, 1.0, 0, true);
}

// ---------- La villa Les Mouettes (années 1970), dans son creux de rocher ----------

function villa(ctx) {
  if (!ctx.ici(40.5)) return;
  const { c, b, M, u } = ctx;
  const X1 = 34;
  const X2 = 47;
  const Z1 = -22;
  const Z2 = -12;
  const H = 2.9;
  const blanc = { couleur: 0xeae4d6, mat: M.enduit };
  const k = b.couche("villa Les Mouettes", { x: 40.5, z: -15.6, l: 15.8, p: 14.2 }, 1.05, 4.2);
  // Les sols : carrelage clair au séjour et à la cuisine, moquette à la chambre
  c.boite(13, 0.03, 10, 0xe4dccb, { x: 40.5, y: 0.016, z: -17 }, M.carrelage, { crasse: false, nuance: 0 });
  c.boite(6, 0.035, 5, 0x9a7a5a, { x: 44, y: 0.02, z: -14.5 }, M.toile, { crasse: false, nuance: 0 });
  murDouble(ctx, k, [X1, Z2], [X2, Z2], {
    h: H, ep: 0.25, bas: blanc,
    ouvertures: [
      { u: 2.75, l: 3.5, bas: 0, haut: 2.3, type: "vide" },
      { u: 5.909, l: 1.4, bas: 0, haut: 2.15, type: "porte" },
      { u: 10, l: 1.6, bas: 1.05, haut: 2.1, type: "fenetre", bris: 0.4 + 0.5 * u, cadre: BRUN_70, croisillons: 1 },
    ],
  });
  murDouble(ctx, k, [X2, Z2], [X2, Z1], { h: H, ep: 0.25, bas: blanc, ouvertures: [{ u: 2.5, l: 1.2, bas: 1.05, haut: 2.0, type: "fenetre", bris: 0.5, cadre: BRUN_70 }, { u: 7.5, l: 1.2, bas: 1.05, haut: 2.0, type: "fenetre", bris: 0.5, cadre: BRUN_70 }] });
  mur(c, [X2, Z1], [X1, Z1], { h: H, ep: 0.25, couleur: 0xeae4d6, mat: M.enduit, batiment: b });
  mur(c, [X1, Z1], [X1, Z2], { h: H, ep: 0.35, couleur: 0xb8a688, mat: M.pierre, batiment: b, ouvertures: [{ u: 5, l: 1.4, bas: 1.05, haut: 2.1, type: "fenetre", bris: 0.5, cadre: BRUN_70 }] });
  mur(c, [41, Z1], [41, Z2], { h: H, ep: 0.14, couleur: 0xe8dcc4, mat: M.enduit, batiment: b, ouvertures: [{ u: 2.5, l: 1.3, bas: 0, haut: 2.1, type: "porte" }, { u: 7.5, l: 1.3, bas: 0, haut: 2.1, type: "porte", vantail: "entrouvert", couleurPorte: BRUN_70 }] });
  mur(c, [41, -17], [X2, -17], { h: H, ep: 0.14, couleur: 0xe8dcc4, mat: M.enduit, batiment: b });
  // La baie coulissante du séjour : un vantail poussé, l'autre en miettes ; le pilier de pierre entre baie et porte
  c.boite(3.5, 0.06, 0.12, BRUN_70, { x: 36.75, y: 2.3, z: Z2 }, M.satine);
  c.boite(1.7, 2.2, 0.03, 0xffffff, { x: 35.75, y: 1.12, z: Z2 - 0.06 }, M.verre, { crasse: false });
  c.boite(1.75, 2.24, 0.06, BRUN_70, { x: 35.75, y: 1.12, z: Z2 - 0.1 }, M.satine, { crasse: false });
  c.boite(1.6, 2.1, 0.02, 0x2c3a40, { x: 35.75, y: 1.12, z: Z2 - 0.12 }, M.verre, { crasse: false });
  debris(c, 36, Z2 + 0.2, 38.6, Z2 + 1.6, 12, [0xd8e4e6, 0xc8d4d6]);
  c.boite(0.5, 2.9, 0.4, 0xb8a688, { x: 38.8, y: 1.45, z: Z2 + 0.05 }, M.pierre);
  // Le toit plat aux grands débords, le bandeau de bois brun, la pergola sur la terrasse
  k.pave(X1 - 0.8, H, Z1 - 0.6, X2 + 0.8, H + 0.2, Z2 + 1.6, 0xeae4d6, M.enduit, { crasse: false });
  k.boite(X2 - X1 + 1.7, 0.36, 0.08, BRUN_70, { x: 40.5, y: H + 0.1, z: Z2 + 1.64 }, M.mat);
  k.boite(0.08, 0.36, Z2 - Z1 + 2.3, BRUN_70, { x: X2 + 0.84, y: H + 0.1, z: -16.5 }, M.mat);
  for (let x = 34.4; x < 47; x += 2.0) k.boite(0.12, 0.18, 2.8, BRUN_70, { x, y: H - 0.1, z: -9.0 }, M.mat);
  k.boite(13.2, 0.18, 0.14, BRUN_70, { x: 40.5, y: H - 0.1, z: -7.6 }, M.mat);
  for (const x of [34.4, 40.4, 46.4]) c.boite(0.14, H - 0.2, 0.14, BRUN_70, { x, y: (H - 0.2) / 2, z: -7.6 }, M.mat);
  if (u > 0.6) for (let i = 0; i < 3; i++) k.boite(1.8, 0.04, 1.4, 0x6f7a48, { x: 36 + i * 4, y: H + 0.22, z: -18 + i * 2 }, M.mat, { crasse: false });
  // L'écran domotique « Maison Sereine » qui luit encore, à côté de la porte
  c.boite(0.4, 0.4, 0.04, 0x2b2f33, { x: 41.2, y: 1.5, z: Z2 + 0.15 }, M.lisse);
  panneau(c, M, R.domotique, { x: 41.2, y: 1.5, z: Z2 + 0.175 }, 0.34, 0.34);
  b.lumiere(41.2, 1.5, Z2 + 0.6, 0x8ff0c0, 1.8, 4, "écran domotique « Maison Sereine » qui luit encore (« alarme active »)");

  // Le séjour : canapé rond orange, tapis à poils longs, table basse de verre, lampe boule, bar roulant, chaîne hi-fi
  c.boite(4.2, 0.03, 3.2, 0xc8a060, { x: 37.4, y: 0.045, z: -17.4 }, M.toile, { crasse: false });
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * (1.08 + (i / 5) * 0.84);
    const x = 37.4 + Math.cos(a) * 1.7;
    const z = -17.4 + Math.sin(a) * 1.3;
    c.boite(0.75, 0.4, 0.8, ORANGE_70, { x, y: 0.2, z, ry: -a - Math.PI / 2 }, M.toile, { nuance: 0.04 });
    c.boite(0.75, 0.45, 0.2, ORANGE_70, { x: x + Math.cos(a) * 0.35, y: 0.6, z: z + Math.sin(a) * 0.35, ry: -a - Math.PI / 2 }, M.toile, { nuance: 0.04 });
  }
  cylindre(c, M.verre, 0xffffff, 37.4, 0.38, -17.0, 0.5, 0.5, 0.03, 10);
  cylindre(c, M.metal, INOX, 37.4, 0, -17.0, 0.04, 0.04, 0.38, 4);
  c.tube([34.8, 0, -20.8], [34.8, 1.5, -20.8], 0.025, INOX, M.metal, 4);
  c.poser(BOULE, M.lisse, 0xf0e8d0, { x: 34.8, y: 1.65, z: -20.8, e: 0.26 }, { crasse: false });
  c.boite(0.6, 0.8, 0.4, INOX, { x: 39.9, y: 0.4, z: -21.2 }, M.metal);
  for (let i = 0; i < 4; i++) cylindre(c, M.verre, [0x5f7a42, 0x8a5a3a, 0xc79a3b, 0x3a3a38][i], 39.7 + i * 0.13, 0.82, -21.2, 0.035, 0.035, 0.26, 5);
  c.boite(0.5, 0.7, 1.8, BRUN_70, { x: 34.45, y: 0.35, z: -14.8 }, M.satine);
  c.boite(0.4, 0.08, 0.4, 0x2a2a2a, { x: 34.45, y: 0.74, z: -14.6 }, M.satine);
  etagere(c, M, 37.6, Z1 + 0.33, 0, 2.6, 1.8, [0xc0703a, 0xd8d0b8, 0x3f7a7c, 0x8a5a3a, 0xc79a3b], 0.6, BRUN_70);
  c.boite(1.4, 0.9, 0.05, 0xc0703a, { x: 34.2, y: 1.7, z: -18.6, ry: Math.PI / 2 }, M.satine); // le tableau abstrait
  // La cuisine orange
  c.boite(5.4, 0.9, 0.6, ORANGE_70, { x: 44, y: 0.45, z: Z1 + 0.42 }, M.satine);
  c.boite(5.5, 0.04, 0.64, 0xeae4d6, { x: 44, y: 0.92, z: Z1 + 0.42 }, M.lisse);
  c.boite(5.4, 0.7, 0.35, ORANGE_70, { x: 44, y: 1.95, z: Z1 + 0.3 }, M.satine);
  c.boite(0.7, 1.6, 0.65, 0xeee6cf, { x: 46.4, y: 0.8, z: -18.4 }, M.lisse);
  c.boite(1.1, 0.04, 0.8, 0xeae4d6, { x: 43.4, y: 0.74, z: -18.8 }, M.lisse);
  cylindre(c, M.metal, INOX, 43.4, 0, -18.8, 0.04, 0.04, 0.72, 4);
  chaise(c, M, 42.6, -18.8, Math.PI / 2, false, ORANGE_70);
  chaise(c, M, 44.2, -18.6, -Math.PI / 2, u > 0.5, ORANGE_70);
  cylindre(c, M.satine, 0x3f7a7c, 41.6, 0, -21.3, 0.15, 0.15, 0.55, 8);
  // La chambre : lit bas, armoire laquée, coiffeuse, valise ouverte
  lit(c, M, 45.9, -14.6, -Math.PI / 2, 1.6, POLAIRES[5], u > 0.5);
  c.boite(0.6, 2.0, 1.2, 0xe8dcc4, { x: 41.45, y: 1.0, z: -16.0 }, M.satine);
  c.boite(1.0, 0.75, 0.45, BRUN_70, { x: 43.4, y: 0.38, z: -16.6 }, M.satine);
  c.boite(0.6, 0.7, 0.03, 0xc8d4d6, { x: 43.4, y: 1.3, z: -16.83 }, M.lisse);
  c.boite(0.7, 0.2, 0.45, 0x5a8a8a, { x: 43.0, y: 0.1, z: -13.2, ry: 0.3 }, M.satine);
  debris(c, X1 + 0.4, Z1 + 0.4, X2 - 0.4, Z2 - 0.4, 12 * u);

  // La terrasse en opus incertum, les bains de soleil orange, le parasol, le muret et sa plaque
  c.boite(13.4, 0.04, 5.0, 0xd2c2a2, { x: 40.5, y: 0.02, z: -9.4 }, M.pierre, { crasse: false });
  for (let i = 0; i < 16; i++) c.boite(c.entre(0.5, 1.1), 0.005, c.entre(0.4, 0.9), c.hasard() < 0.5 ? 0xb8a688 : 0xc8b898, { x: c.entre(34.5, 46.5), y: 0.045, z: c.entre(-11.6, -7.2), ry: c.hasard() * 3 }, M.mat, { crasse: false });
  transat(c, M, 36.2, -9.4, Math.PI / 2 + 0.1, ORANGE_70);
  transat(c, M, 38.0, -9.6, Math.PI / 2 - 0.2, ORANGE_70);
  c.tube([42.4, 0, -9.4], [42.5, 2.2, -9.4], 0.035, 0xe8e2d4, M.metal, 4);
  cylindre(c, M.toile, 0xd88a4a, 42.5, 1.9, -9.4, 0.1, 1.2, 0.45, 8, {}, { crasse: false, nuance: 0.05 });
  cylindre(c, M.lisse, 0xe8e2d4, 42.4, 0.7, -9.4, 0.45, 0.45, 0.04, 10);
  for (let x = 33.2; x < 45.6; x += 1) {
    const brise = hache(Math.round(x * 3), 61) < 0.12 * u;
    boiteEntre(c, x, -6.6, Math.min(45.6, x + 1), -6.6, 0, brise ? 0.3 : 0.75, 0.35, 0xb8a688, M.pierre, { nuance: 0.03 }, 0.04);
  }
  b.obstacle(33.2, -6.6, 45.6, -6.6, "muret de la villa");
  c.boite(0.5, 1.3, 0.5, 0xb8a688, { x: 45.8, y: 0.65, z: -6.6 }, M.pierre);
  panneau(c, M, R.villa, { x: 45.8, y: 1.0, z: -6.34 }, 0.48, 0.12);
  for (const [x, z] of [[33.8, -8], [46.9, -11.2], [33.8, -11.5]]) laurier(c, M, x, z, 1.1, 0);
  palmierEnPot(c, M, 46.6, -8.2, 1.2);
  agave(c, M, 44.6, -7.4, 0.9, 0);
  figuier(c, M, 48.4, -9.6, 1.1, 0);
  pinParasol(c, M, 48.6, -19.4, 10, 0, 2.6, 0.15);
}

// ---------- L'éboulement, la crique et la sortie ----------

function eboulement(ctx) {
  const { c, b, M, u } = ctx;
  if (ctx.ici(67.5)) {
    const A = aleatoire(2024);
    // Des pans de chaussée basculés dans le vide, avec leur bout de ligne blanche
    for (let x = 61; x < 74.4; x += 2.2 + A() * 1.6) {
      const z0 = zr(x) + 0.05;
      const chute = 1.2 + A() * 4.5;
      const larg = 0.9 + A() * 1.4;
      const a = [x, -0.12 - A() * 0.6, z0];
      const bb = [x + (A() - 0.5) * 1.6, -chute, z0 + 0.6 + A() * 1.8];
      const haut = [1, (A() - 0.5) * 0.6, (A() - 0.5) * 0.9];
      planche(c, a, bb, larg, 0.26, A() < 0.3 ? ASPHALTE_RAPIECE : ASPHALTE, M.mat, haut);
      if (A() < 0.4) planche(c, [a[0], a[1] + 0.14, a[2]], [bb[0], bb[1] + 0.14, bb[2]], 0.12, 0.02, LIGNE, M.mat, haut, { crasse: false });
      // Des éclats plus petits, accrochés plus bas
      for (let j = 0; j < 2; j++) {
        const y = -2 - A() * 6;
        const zz = z0 + 0.6 + A() * 2.2;
        c.boite(0.4 + A() * 0.7, 0.18, 0.3 + A() * 0.5, ASPHALTE, { x: x + (A() - 0.5) * 2, y: Math.max(y, hauteur(x, zz) + 0.1), z: zz, rx: A() * 2, ry: A() * 3, rz: A() }, M.mat);
      }
    }
    // Le bord cassé du bitume, des fissures qui courent vers la paroi
    for (let x = 60.2; x < 75; x += 0.7) c.boite(0.8, 0.08, 0.35, 0x3f4044, { x, y: 0.0, z: zr(x) - 0.1, ry: (A() - 0.5) * 0.6 }, M.mat, { crasse: false });
    for (let i = 0; i < 7; i++) {
      const x = 61 + A() * 13;
      boiteEntre(c, x, zr(x) - 0.2, x + (A() - 0.5) * 1.5, zr(x) - 1.2 - A(), 0.04, 0.01, 0.05, 0x2c2c2e, M.mat, { crasse: false });
    }
    // Les glissières arrachées qui pendent au-dessus du vide, aux deux bouts
    planche(c, [59.4, 0.6, zr(59.4) - 0.55], [61.6, -3.6, zr(61) + 1.2], 0.3, 0.06, ACIER, M.tole, [1, 0, 0]);
    planche(c, [75.8, 0.6, zr(75.8) - 0.55], [74.2, -2.8, zr(74.5) + 1.0], 0.3, 0.06, 0x8a6f5a, M.tole, [1, 0, 0]);
    // Les blocs tombés de la paroi, serrés contre elle, et les gravats sur la pente
    for (const [x, s] of [[62.6, 0.42], [66.2, 0.36], [70.6, 0.45], [73.2, 0.38]]) rocher(c, M, x, zn(x) - 0.1, s, 0, ROC_CLAIR);
    // La rubalise des passeurs au bord du vide : piquets rouges et blancs, ruban tendu (déchiré par endroits)
    let pq = null;
    for (let x = 60.4; x <= 74.81; x += 1.8) {
      const p = [x, zr(x) - 0.3];
      c.boite(0.06, 1.05, 0.06, 0xe8e2d4, { x: p[0], y: 0.52, z: p[1] }, M.satine);
      for (const y of [0.25, 0.75]) c.boite(0.065, 0.16, 0.065, 0xc0392b, { x: p[0], y, z: p[1] }, M.satine, { crasse: false });
      if (pq) {
        const dechire = hache(Math.round(x * 10), 62) < 0.25 * u;
        const nb = 4;
        for (let k = 0; k < nb; k++) {
          if (dechire && k === 2) break;
          const t0 = k / nb;
          const t1 = (k + 1) / nb;
          boiteEntre(c, pq[0] + (p[0] - pq[0]) * t0, pq[1] + (p[1] - pq[1]) * t0, pq[0] + (p[0] - pq[0]) * t1, pq[1] + (p[1] - pq[1]) * t1, 0.86 - Math.sin(Math.PI * (t0 + t1) / 2) * 0.06, 0.08, 0.012, k % 2 ? 0xf2efe6 : 0xc0392b, M.satine, { crasse: false, nuance: 0 }, 0);
        }
        if (dechire) planche(c, [pq[0] + (p[0] - pq[0]) * 0.5, 0.84, pq[1] + (p[1] - pq[1]) * 0.5], [pq[0] + (p[0] - pq[0]) * 0.55, 0.2, pq[1] + (p[1] - pq[1]) * 0.55 + 0.3], 0.08, 0.012, 0xc0392b, M.satine, [1, 0, 0], { crasse: false });
      }
      pq = p;
    }
    for (let i = 0; i < 18; i++) {
      const x = 60 + A() * 16;
      const z = zr(x) + 0.5 + A() * 3;
      rocher(c, M, x, z, 0.4 + A() * 0.9, hauteur(x, z) - 0.2, A() < 0.5 ? ROC : ASPHALTE);
    }
    // La main courante de corde que les passeurs ont fixée à la paroi
    let prec = null;
    for (let x = 59; x <= 76.01; x += 2.8) {
      const p = [x, 1.05, zn(x) + 0.32];
      c.boite(0.06, 0.18, 0.3, FONTE, { x, y: 1.05, z: zn(x) + 0.2 }, M.metal);
      if (prec) {
        const m = [(prec[0] + x) / 2, 0.85, (prec[2] + p[2]) / 2 + 0.05];
        c.tube(prec, m, 0.02, 0xc8b48a, M.mat, 3);
        c.tube(m, p, 0.02, 0xc8b48a, M.mat, 3);
      }
      prec = p;
    }
    // L'épave tout en bas, sur les rochers, et les morceaux de route à la mer
    voiture(c, M, 67.2, MER_Y + 1.9, 1.9, 0.5, 0x8a9aa8, { rx: Math.PI, rz: 0.15, roues: 3, vitres: false });
    for (const [x, z, s] of [[64, 2.6, 1.6], [69.6, 2.2, 1.8], [66.4, 3.6, 1.2], [71.6, 3.4, 1.4], [62.4, 1.6, 1.3]]) rocher(c, M, x, z, s, MER_Y - 0.6, ROC_SOMBRE);
    for (const [x, z, r] of [[62.8, 3.2, 0.4], [72.4, 2.4, -0.3]]) c.boite(2.6, 0.28, 1.8, ASPHALTE, { x, y: MER_Y + 0.4, z, rx: r, rz: 0.3 }, M.mat);
  }
  // Les panneaux des passeurs et de l'Abondance, aux deux bouts
  if (ctx.ici(57)) {
    c.repere({ x: 57.4, y: 0, z: zn(57.4) + 0.6, ry: 0.1 }, () => {
      c.boite(0.1, 1.8, 0.1, BOIS, { y: 0.9 }, M.mat);
      c.boite(1.5, 0.6, 0.04, BOIS_GRIS, { y: 1.5, z: -0.03 }, M.mat);
      panneau(c, M, R.eboulement, { y: 1.5 }, 1.45, 0.55);
    });
    // La borne « Corniche+ assistance 24/7 »
    c.repere({ x: 55, y: 0, z: zn(55) + 0.75 }, () => {
      c.boite(0.45, 0.2, 0.35, 0xb8ad98, { y: 0.1 }, M.mat);
      c.boite(0.35, 1.9, 0.28, 0xe6e2da, { y: 1.05 }, M.lisse);
      c.boite(0.66, 0.32, 0.08, 0x2b2f33, { y: 1.6, z: 0.15 }, M.lisse);
      panneau(c, M, R.corniche_plus, { y: 1.6, z: 0.195 }, 0.62, 0.24);
      c.boite(0.7, 0.04, 0.45, 0x2a3446, { y: 2.1, rx: -0.4 }, M.lisse);
    });
    b.lumiere(55, 1.6, zn(55) + 1.3, 0x8fd0ff, 1.8, 4, "écran de la borne « Corniche+ » (il luit encore)");
  }
  if (ctx.ici(78)) {
    c.repere({ x: 78.2, y: 0, z: zc(78.2) + HL + 1.0, ry: -0.2 }, () => {
      for (const s of [-0.6, 0.6]) c.boite(0.08, 1.6, 0.08, ALU, { x: s, y: 0.8 }, M.metal);
      c.boite(1.62, 0.64, 0.04, 0xd8d6cf, { y: 1.3, z: -0.03 }, M.satine);
      panneau(c, M, R.travaux, { y: 1.3 }, 1.56, 0.58);
    });
    // Les plots de chantier rouge et blanc, renversés
    for (const [x, z, r] of [[58.2, 1.0, 0], [58.9, 1.4, 1.4], [76.6, -1.0, 0.6], [77.4, 0.2, 0]]) {
      c.repere({ x, y: r ? 0.3 : 0, z, rx: r ? 1.5 : 0, ry: r }, () => {
        c.boite(0.4, 0.8, 0.2, 0xe8e2d4, { y: 0.4 }, M.satine);
        c.boite(0.41, 0.2, 0.21, 0xc0503c, { y: 0.5 }, M.satine);
        c.boite(0.41, 0.15, 0.21, 0xc0503c, { y: 0.15 }, M.satine);
      });
    }
    // L'épave au sortir de l'éboulement (un couvert)
    voiture(c, M, 81.4, 0, -3.1, 0.12, 0x8a9a7a, { roues: 3, capot: true, rz: 0.04 });
    b.obstacle(79.4, -3.8, 83.4, -3.4, "épave");
    b.obstacle(79.4, -2.3, 83.4, -2.0, "épave");
  }
}

function palierCrique(ctx) {
  if (!ctx.ici(88)) return;
  const { c, b, M, u } = ctx;
  // Le palier dallé
  c.boite(9.6, 0.04, 6.4, 0xc9bda5, { x: 88.8, y: 0.02, z: 6.6 }, M.pierre, { crasse: false });
  // Le cabanon du pêcheur : planches grises, toit de tôle, filets et nasses
  const X1 = 84.6;
  const X2 = 87.8;
  const Z1 = 6.9;
  const Z2 = 9.3;
  const H = 2.4;
  const k = b.couche("cabanon du pêcheur", { x: 86.2, z: 8.1, l: 4.4, p: 3.6 }, 1.05, 3.4);
  const bois = { couleur: BOIS_GRIS, mat: M.mat };
  murDouble(ctx, k, [X1, Z2], [X2, Z2], { h: H, ep: 0.1, bas: bois, ouvertures: [{ u: 1.6, l: 0.7, bas: 1.2, haut: 1.8, type: "vide" }] });
  murDouble(ctx, k, [X2, Z2], [X2, Z1], { h: H, ep: 0.1, bas: bois, ouvertures: [{ u: 1.0, l: 1.3, bas: 0, haut: 2.05, type: "porte" }] });
  mur(c, [X2, Z1], [X1, Z1], { h: H, ep: 0.1, couleur: BOIS_GRIS, mat: M.mat, batiment: b });
  mur(c, [X1, Z1], [X1, Z2], { h: H, ep: 0.1, couleur: BOIS_GRIS, mat: M.mat, batiment: b });
  for (let x = X1 + 0.15; x < X2; x += 0.3) c.boite(0.02, 1.0, 0.03, 0x6f675a, { x, y: 0.5, z: Z2 + 0.06 }, M.mat, { crasse: false });
  for (let i = 0; i < 5; i++) {
    const x = X1 - 0.25 + (i + 0.5) * ((X2 - X1 + 0.5) / 5);
    if (u > 0.7 && i === 3) continue;
    planche(k, [x, H + 0.35, Z1 - 0.3], [x, H - 0.1, Z2 + 0.35], (X2 - X1 + 0.5) / 5 + 0.02, 0.05, i % 2 ? 0x8a6a52 : 0x7d8689, M.tole, [1, 0, 0], { crasse: false, nuance: 0.05 });
  }
  c.boite(1.6, 0.25, 0.9, 0x3f6a4a, { x: 85.6, y: 0.13, z: 7.6 }, M.toile, { nuance: 0.08 });
  c.boite(0.9, 0.9, 0.04, 0x3f6a4a, { x: 85.2, y: 1.4, z: Z1 + 0.08 }, M.toile, { nuance: 0.08 });
  for (let i = 0; i < 3; i++) cylindre(c, M.mat, 0x8a6a48, 87.1, i * 0.42, 7.4, 0.25, 0.3, 0.4, 7);
  for (let i = 0; i < 3; i++) c.tube([X1 + 0.12, 0.1, 8.0 + i * 0.25], [X1 + 0.12, 2.2, 8.2 + i * 0.25], 0.015, BOIS, M.mat, 3);
  c.boite(0.6, 0.35, 0.4, 0x7a8a8a, { x: 86.6, y: 0.18, z: 8.8 }, M.tole);
  cylindre(c, M.verre, 0xffffff, 86.6, 0.36, 8.8, 0.08, 0.08, 0.18, 6);
  cylindre(c, M.lisse, 0xeee6cf, 86.6, 0.36, 8.8, 0.035, 0.035, 0.1, 5);
  b.lumiere(86.6, 0.7, 8.8, 0xffc070, 2.4, 6, "bougie dans un bocal, sur la caisse du cabanon du pêcheur");
  // Le portillon « Infinity Members Only » et le lecteur de badge mort
  for (const x of [90.3, 91.7]) c.boite(0.36, 1.3, 0.36, PIERRE, { x, y: 0.65, z: 9.65 }, M.pierre);
  c.repere({ x: 90.45, y: 0, z: 9.7, ry: u > 0.5 ? -1.2 : -0.3 }, () => {
    for (let i = 0; i < 6; i++) c.boite(0.03, 0.95, 0.03, FONTE, { x: 0.12 + i * 0.2, y: 0.55 }, M.metal);
    c.boite(1.15, 0.04, 0.04, FONTE, { x: 0.6, y: 1.0 }, M.metal);
    c.boite(1.15, 0.04, 0.04, FONTE, { x: 0.6, y: 0.15 }, M.metal);
    panneau(c, M, R.crique, { x: 0.6, y: 0.6, z: 0.03 }, 1.0, 0.38);
    panneau(c, M, R.crique, { x: 0.6, y: 0.6, z: -0.03, ry: Math.PI }, 1.0, 0.38);
  });
  c.boite(0.14, 0.2, 0.06, 0x2b2f33, { x: 91.7, y: 1.1, z: 9.45 }, M.lisse);
  b.obstacle(90.3, 9.65, 91.7, 9.65, "escalier de la crique, effondré plus bas : on ne descend pas");
  c.poser(ANNEAU, M.satine, 0xc8643a, { x: 93.4, y: 0.75, z: 9.45, e: [0.32, 0.32, 0.5] }, { crasse: false });
  // L'escalier de pierre qui descend vers la crique, en lacets, effondré sous le palier
  const P = [[91, 10.2], [91, 12.0], [85.2, 12.9], [84.6, 14.5], [91.6, 16.1], [92.4, 18.6]];
  const Y = P.map(([x, z], i) => (i === 0 ? 0 : hauteur(x, z) + 0.35));
  for (let s = 0; s < P.length - 1; s++) {
    const [xa, za] = P[s];
    const [xb, zb] = P[s + 1];
    const L = Math.hypot(xb - xa, zb - za);
    const n = Math.max(2, Math.ceil(Math.abs(Y[s] - Y[s + 1]) / 0.2));
    const ry = -Math.atan2(zb - za, xb - xa);
    for (let i = 0; i < n; i++) {
      if (s === 0 && i > 3) continue; // le premier volée est partie
      if (s === 1 && i > n * 0.35 && i < n * 0.55) continue; // une brèche plus bas
      const t = (i + 0.5) / n;
      const x = xa + (xb - xa) * t;
      const z = za + (zb - za) * t;
      const y = Y[s] + (Y[s + 1] - Y[s]) * ((i + 1) / n);
      const fond = Math.min(hauteur(x, z), y) - 1.2;
      c.boite(L / n + 0.03, y - fond, 1.25, i % 2 ? PIERRE : 0xb8a688, { x, y: (y + fond) / 2, z, ry }, M.pierre, { nuance: 0.03 });
    }
    // Le garde-corps de fer, tordu par endroits
    if (s > 0) {
      const ox = Math.sin(-ry) * 0.6;
      const oz = Math.cos(-ry) * 0.6;
      c.tube([xa + ox, Y[s] + 0.9, za + oz], [xb + ox, Y[s + 1] + 0.9, zb + oz], 0.025, 0x6a4a36, M.metal, 4);
    }
  }
  gravats(c, 91.2, 12.6, 1.4, 12, [PIERRE, 0xb8a688, ROC], hauteur(91.2, 12.6));
  // La plage : la barque échouée, le bois flotté, le parasol du « Beach Club »
  const yp = hauteur(88.4, 19.6);
  c.repere({ x: 88.4, y: yp + 0.05, z: 19.6, ry: 0.5, rz: 0.25 }, () => {
    c.boite(3.6, 0.5, 1.2, 0x6f9aa8, { y: 0.3 }, M.satine, { nuance: 0.05 });
    c.boite(3.4, 0.08, 1.0, 0x8a6a48, { y: 0.52 }, M.mat);
    c.boite(0.8, 0.45, 0.9, 0x6f9aa8, { x: 1.9, y: 0.36, rz: 0.4 }, M.satine);
    for (const x of [-0.6, 0.5]) c.boite(0.25, 0.06, 1.0, 0x8a6a48, { x, y: 0.62 }, M.mat);
  });
  for (const [x, z, a] of [[85.6, 18.2, 0.4], [90.6, 20.8, -0.3], [94.2, 18.4, 1.1]]) c.tube([x - Math.cos(a), hauteur(x, z) + 0.12, z + Math.sin(a)], [x + Math.cos(a), hauteur(x, z) + 0.12, z - Math.sin(a)], 0.1, 0xb8a888, M.mat, 5);
  const yq = hauteur(86.8, 17.4);
  c.tube([86.8, yq, 17.4], [87.4, yq + 2.0, 17.6], 0.03, ALU, M.metal, 4);
  cylindre(c, M.toile, 0x7fb0a8, 87.4, yq + 1.7, 17.6, 0.08, 1.1, 0.4, 8, { rz: 0.3 }, { crasse: false });
}

// ---------- Le pin d'Alep tombé sur l'aire de la station : le tas de bois personnel (C1) ----------

// Le pied (galette de racines arrachée au pied de la paroi) et la pointe, couchée vers la pompe
const PIN_R = [-80.2, -13.6];
const PIN_T = [-74.4, -7.4];

function pinTombe(ctx) {
  if (!ctx.ici(PIN_R[0])) return;
  const { c, b, M } = ctx;
  const L = Math.hypot(PIN_T[0] - PIN_R[0], PIN_T[1] - PIN_R[1]);
  const d = [(PIN_T[0] - PIN_R[0]) / L, (PIN_T[1] - PIN_R[1]) / L];
  const n = [-d[1], d[0]];
  // Un point du tronc couché : t le long, o de côté, à la hauteur y
  const P = (t, o = 0, y = 0) => [PIN_R[0] + d[0] * t + n[0] * o, y, PIN_R[1] + d[1] * t + n[1] * o];
  const ECORCE = 0x6e5e4e;
  const AUBIER = 0xd8c49a;
  const SEC = [0x8a8456, 0x7e7a50, 0x948c60];

  // Le pied, commun aux deux états : la galette de racines dressée, la terre arrachée, le bout de tronc scié net
  c.tube(P(-0.25, 0, 0.78), P(0.2, 0, 0.78), 1.15, 0x7a5e44, M.mat, 9, { nuance: 0.05 });
  c.tube(P(-0.27, 0, 0.78), P(-0.2, 0, 0.78), 0.95, 0x5e4836, M.mat, 9, { crasse: false });
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2 + 0.3;
    const r = 0.95 + hache(k, 81) * 0.25;
    const p = P(-0.1, Math.cos(a) * r, 0.78 + Math.sin(a) * r);
    const q = P(-0.5 - hache(k, 82) * 0.6, Math.cos(a) * (r + 0.4), Math.max(0.05, 0.78 + Math.sin(a) * (r + 0.5)));
    c.tube(p, q, 0.035 + hache(k, 83) * 0.04, 0x5a4636, M.mat, 4);
  }
  for (let k = 0; k < 4; k++) c.poser(ROCHE, M.mat, k % 2 ? ROC : CALCAIRE, { x: P(0.15, (k - 1.5) * 0.5)[0], y: 0.3 + k * 0.35, z: P(0.15, (k - 1.5) * 0.5)[2], e: 0.16 + hache(k, 84) * 0.1 }, { nuance: 0.1 });
  c.boite(2.2, 0.04, 1.4, 0x4f3d30, { x: P(-0.8)[0], y: 0.02, z: P(-0.8)[2], ry: -Math.atan2(d[1], d[0]) }, M.mat, { crasse: false });
  c.tube(P(0.15, 0, 0.8), P(1.3, 0.05, 0.6), 0.27, ECORCE, M.mat, 7);
  c.tube(P(1.3, 0.05, 0.6), P(1.33, 0.05, 0.6), 0.255, AUBIER, M.mat, 7, { crasse: false });
  b.obstacle(...[P(0, -1.15), P(0, 1.15)].flatMap((p) => [p[0], p[2]]), "souche du pin tombé (galette de racines)");

  // Le pin entier (visible au départ) : le tronc qui se tord un peu, les branches cassées, les touffes encore vertes
  objetNomme(ctx, "pin_entier", 911, (ch) => {
    const T = [[1.3, 0.05, 0.6, 0.26], [3.2, 0.3, 0.5, 0.22], [5.1, 0.38, 0.42, 0.17], [6.9, 0.2, 0.36, 0.13], [L, -0.15, 0.3, 0.08]];
    for (let i = 0; i < T.length - 1; i++) ch.tube(P(T[i][0], T[i][1], T[i][2]), P(T[i + 1][0], T[i + 1][1], T[i + 1][2]), T[i][3], ECORCE, M.mat, 6, { nuance: 0.04 });
    for (let k = 0; k < 11; k++) {
      const t = 3.0 + (k / 10) * (L - 3.4);
      const cote = k % 2 ? 1 : -1;
      const lg = 1.0 + hache(k, 91) * 1.3 - (t / L) * 0.4;
      const o = 0.3 * (1 - Math.abs(t - 5) / 5);
      const base = P(t, o, 0.45);
      const ecrase = hache(k, 92) < 0.35;
      const bout = P(t + lg * 0.45, o + cote * lg, ecrase ? 0.12 : 0.6 + hache(k, 93) * 1.3);
      ch.tube(base, bout, 0.045 + (1 - t / L) * 0.04, ECORCE, M.mat, 4);
      for (let j = 0; j < 2; j++) {
        const s = 0.38 + hache(k * 3 + j, 94) * 0.3;
        const q = j ? bout : [(base[0] + bout[0]) / 2, (base[1] + bout[1]) / 2 + 0.25, (base[2] + bout[2]) / 2];
        ch.poser(BOULE, M.mat, hache(k, 95 + j) < 0.3 ? SEC[k % 3] : VERTS_ALEP[(k + j) % 3], { x: q[0], y: Math.max(q[1] + s * 0.15, s * 0.45), z: q[2], ry: k, e: [s * 1.3, s * 0.6, s * 1.1] }, { nuance: 0.08, crasse: false });
      }
    }
    // La tête, aplatie au sol
    for (let j = 0; j < 4; j++) {
      const s = 0.45 + hache(j, 96) * 0.25;
      const q = P(L - 0.3 + j * 0.25, (j - 1.5) * 0.6, 0.4);
      ch.poser(BOULE, M.mat, VERTS_ALEP[j % 3], { x: q[0], y: s * 0.45, z: q[2], ry: j * 2, e: [s * 1.3, s * 0.6, s * 1.1] }, { nuance: 0.08, crasse: false });
    }
    // Des aiguilles et des pommes de pin tombées tout autour
    for (let k = 0; k < 14; k++) {
      const q = P(2 + hache(k, 97) * (L - 1.5), (hache(k, 98) - 0.5) * 3.4, 0);
      ch.poser(BOULE, M.mat, 0x8a6a48, { x: q[0], y: 0.05, z: q[2], e: [0.06, 0.08, 0.06] }, { crasse: false });
    }
  });
  const ob = (a, bb, nature) => ctx.obstaclesPin.push({ x1: arr(a[0]), z1: arr(a[2]), x2: arr(bb[0]), z2: arr(bb[2]), nature });
  ob(P(1.3, 0.05), P(L, -0.15), "tronc du pin tombé");
  ob(P(5.8, -1.6), P(5.8, 1.7), "branches du pin tombé");
  ob(P(L - 0.2, -1.4), P(L - 0.2, 1.4), "tête du pin tombé");

  // Le pin débité (caché au départ) : rondelles de tronc, la tête trop fine laissée là, les branches élaguées en tas, la sciure
  objetNomme(ctx, "pin_debite", 913, (ch) => {
    const rondelle = (p, axe, r, l, couche = true) => {
      const a = couche ? [p[0] - axe[0] * l / 2, r + 0.01, p[2] - axe[1] * l / 2] : [p[0], 0, p[2]];
      const q = couche ? [p[0] + axe[0] * l / 2, r + 0.01, p[2] + axe[1] * l / 2] : [p[0], l, p[2]];
      ch.tube(a, q, r, ECORCE, M.mat, 7, { nuance: 0.05 });
      const e = couche ? [axe[0] * 0.012, 0, axe[1] * 0.012] : [0, 0.012, 0];
      ch.tube([q[0] - e[0], q[1] - e[1], q[2] - e[2]], [q[0] + e[0], q[1] + e[1], q[2] + e[2]], r * 0.94, AUBIER, M.mat, 7, { crasse: false, nuance: 0.04 });
      if (couche) ch.tube([a[0] - e[0], a[1], a[2] - e[2]], [a[0] + e[0], a[1], a[2] + e[2]], r * 0.94, AUBIER, M.mat, 7, { crasse: false, nuance: 0.04 });
    };
    // Les rondelles restées en ligne (sciées, à peine déplacées), puis celles qui ont roulé
    for (const [t, o, r] of [[1.62, 0.05, 0.25], [2.12, 0.1, 0.24], [3.5, 0.3, 0.21]]) rondelle(P(t, o), d, r, 0.42);
    for (const [t, o, r, a] of [[2.9, 1.0, 0.23, 1.2], [4.3, -0.9, 0.2, 0.4], [4.9, 1.3, 0.19, 2.1]]) rondelle(P(t, o), [Math.cos(a), Math.sin(a)], r, 0.42);
    rondelle(P(2.6, -1.0), d, 0.25, 0.45, false); // le billot debout
    // La tête du pin, trop fine pour le feu, laissée en travers avec ses dernières branches
    ch.tube(P(5.9, 0.3, 0.32), P(L, -0.15, 0.25), 0.11, ECORCE, M.mat, 6);
    ch.tube(P(5.9, 0.3, 0.32), P(5.92, 0.3, 0.32), 0.105, AUBIER, M.mat, 6, { crasse: false });
    for (let j = 0; j < 4; j++) {
      const s = 0.6 + hache(j, 101) * 0.3;
      const q = P(L - 0.6 + j * 0.3, (j - 1.5) * 0.55, 0.35);
      ch.poser(BOULE, M.mat, j % 2 ? SEC[j % 3] : VERTS_ALEP[j % 3], { x: q[0], y: s * 0.42, z: q[2], ry: j * 2, e: [s * 1.3, s * 0.55, s * 1.1] }, { nuance: 0.08, crasse: false });
    }
    // Les branches élaguées, en tas le long de l'aire, aux aiguilles qui roussissent
    for (let k = 0; k < 9; k++) {
      const t = 3.3 + hache(k, 102) * 2.4;
      const a = P(t, -1.9 - hache(k, 103) * 0.4, 0.1 + (k % 3) * 0.12);
      const bb = P(t + 1.4 + hache(k, 104), -1.6 - hache(k, 105) * 0.9, 0.15 + (k % 3) * 0.12);
      ch.tube(a, bb, 0.04, ECORCE, M.mat, 4);
      if (k % 2 === 0) ch.poser(BOULE, M.mat, SEC[k % 3], { x: bb[0], y: 0.3 + (k % 3) * 0.1, z: bb[2], ry: k, e: [0.6, 0.3, 0.5] }, { nuance: 0.08, crasse: false });
    }
    // La sciure sous les traits de scie
    for (const t of [1.4, 1.9, 2.4, 3.3, 5.9]) {
      const q = P(t, (hache(Math.round(t * 10), 106) - 0.5) * 0.4, 0);
      ch.boite(0.7, 0.012, 0.5, 0xd8c49a, { x: q[0], y: 0.02, z: q[2], ry: t * 1.7 }, M.mat, { crasse: false, nuance: 0.05 });
    }
  }, false);
}

// ---------- Le vrac de pierres (C3) : blocs tombés au pied de la paroi, aux deux bouts de l'éboulement ----------

function tasDePierres(c, M, x, z, graine) {
  const A = aleatoire(graine);
  const z0 = zn(x);
  for (let k = 0; k < 16; k++) {
    const r = A() * 1.4;
    const a = A() * Math.PI;
    const px = x + Math.cos(a) * r * 1.3;
    const pz = z0 + 0.15 + Math.sin(a) * r * 0.8;
    const s = (k < 3 ? 0.42 : 0.14 + A() * 0.22) * (1 - r * 0.2);
    const ton = [PIERRE, ROC_CLAIR, ROC, CALCAIRE][Math.floor(A() * 4)];
    c.poser(ROCHE, M.mat, ton, { x: px, y: s * 0.35 + (r < 0.5 ? 0.15 : 0), z: pz, rx: A() * 3, ry: A() * 3, rz: A() * 3, e: [s * (1 + A() * 0.4), s * (0.6 + A() * 0.3), s * (0.9 + A() * 0.3)] }, { nuance: 0.1 });
  }
  gravats(c, x, z0 + 0.6, 1.0, 10, [PIERRE, ROC_CLAIR, ROC]);
  // La cicatrice claire dans la paroi, d'où les blocs sont partis
  c.poser(ROCHE, M.mat, ROC_CLAIR, { x, y: 3.2, z: z0 - 1.6, rx: 0.4, ry: 1, e: [1.4, 1.1, 0.5] }, { nuance: 0.05, crasse: false });
}

function vracDePierres(ctx) {
  const { c, M } = ctx;
  if (ctx.ici(59.8)) tasDePierres(c, M, 59.8, 0, 4401);
  if (ctx.ici(77.0)) tasDePierres(c, M, 77.0, 0, 4402);
}

function sortie(ctx) {
  if (!ctx.ici(97)) return;
  const { c, M } = ctx;
  pinParasol(c, M, 97.4, -5.2, 10.5, 0, 0.6, 0.13);
  agave(c, M, 95.4, zc(95.4) + HL + 1.2, 1.0, 0, true);
  laurier(c, M, 99, zc(99) + HL + 1.4, 1.0, 0);
}

// ---------- L'atlas des enseignes, affiches et écrans ----------

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

function etoiles(g, x, y, n, r, couleur = "#e8b84a") {
  g.fillStyle = couleur;
  for (let k = 0; k < n; k++) {
    const cx = x + k * r * 2.4;
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.45 : r;
      g.lineTo(cx + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.closePath();
    g.fill();
  }
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

/** Un écran mort ou mourant : fond sombre, reflets, fêlure. */
function ecran(g, a, l, h, fond = "#101a22") {
  g.fillStyle = fond;
  g.fillRect(0, 0, l, h);
  const d = g.createLinearGradient(0, 0, l, h);
  d.addColorStop(0, "rgba(255,255,255,0.08)");
  d.addColorStop(0.5, "rgba(255,255,255,0)");
  g.fillStyle = d;
  g.fillRect(0, 0, l, h);
}

function felure(g, a, l, h) {
  g.strokeStyle = "rgba(220,230,235,0.5)";
  g.lineWidth = 1.5;
  const cx = l * (0.3 + a() * 0.4);
  const cy = h * (0.3 + a() * 0.4);
  for (let i = 0; i < 6; i++) {
    g.beginPath();
    g.moveTo(cx, cy);
    let x = cx;
    let y = cy;
    const ang = a() * 6.3;
    for (let k = 0; k < 4; k++) {
      x += Math.cos(ang + (a() - 0.5)) * l * 0.12;
      y += Math.sin(ang + (a() - 0.5)) * h * 0.12;
      g.lineTo(x, y);
    }
    g.stroke();
  }
}

function dessinerAtlas(g) {
  const a = aleatoire(1962);
  g.fillStyle = "#777";
  g.fillRect(0, 0, AL, AH);
  const serif = "Georgia, 'Times New Roman', serif";
  const script = "'Snell Roundhand', 'Brush Script MT', 'Segoe Script', cursive";

  // Le grand panneau de la corniche
  region(g, R.corniche, (l, h) => {
    const d = g.createLinearGradient(0, 0, 0, h);
    d.addColorStop(0, "#f2b45a");
    d.addColorStop(0.55, "#e8786a");
    d.addColorStop(1, "#3f7a8c");
    g.fillStyle = d;
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#f8e2a0";
    g.beginPath();
    g.arc(410, 120, 42, Math.PI, 0);
    g.fill();
    g.fillStyle = "#2e6070";
    g.fillRect(0, 120, l, h - 120);
    g.fillStyle = "#7a3a30";
    g.beginPath();
    g.moveTo(0, 192);
    g.lineTo(0, 92);
    g.lineTo(70, 110);
    g.lineTo(150, 150);
    g.lineTo(200, 192);
    g.fill();
    texte(g, "CORNICHE PANORAMIQUE", 300, 34, 38, "#ffffff", { max: 400 });
    etoiles(g, 200, 72, 5, 13);
    texte(g, "VUE CERTIFIÉE 5 ÉTOILES", 330, 106, 22, "#fff4dc", { max: 340 });
    texte(g, "Selfie-points tous les 200 m", 330, 146, 24, "#ffffff", { police: "italic bold", max: 340 });
    watty(g, 66, 150, 52);
    texte(g, "Corniche+", 450, 176, 16, "#f8e2a0", { max: 110 });
    salir(g, a, l, h, 14, 0.22);
    g.fillStyle = "rgba(230,225,210,0.85)";
    g.beginPath();
    g.moveTo(l, 0);
    g.lineTo(l - 70, 0);
    g.lineTo(l, 40);
    g.fill();
  });
  // L'ancienne enseigne de l'hôtel
  region(g, R.panoramique, (l, h) => {
    g.fillStyle = "#efe6cf";
    g.fillRect(0, 0, l, h);
    g.strokeStyle = "#5d8a9a";
    g.lineWidth = 5;
    g.strokeRect(5, 5, l - 10, h - 10);
    texte(g, "Le Panoramique", l / 2, 44, 58, "#b0473a", { police: "italic bold", fonte: script, max: l - 40 });
    texte(g, "HÔTEL · RESTAURANT · BAR", l / 2, 80, 16, "#3f6a7a", { max: l - 60 });
    salir(g, a, l, h, 10, 0.25);
  });
  // L'enseigne « Infinity » posée par-dessus, qui se décolle
  region(g, R.infinity, (l, h) => {
    const d = g.createLinearGradient(0, 0, l, 0);
    d.addColorStop(0, "#4a2a5a");
    d.addColorStop(0.6, "#b4486a");
    d.addColorStop(1, "#e8904a");
    g.fillStyle = d;
    g.fillRect(0, 0, l, h);
    texte(g, "∞", 46, h / 2, 64, "#ffe6c0", { police: "" });
    texte(g, "INFINITY", 260, 34, 40, "#ffffff", { max: 360 });
    texte(g, "SUNSET EXPERIENCE", 260, 70, 26, "#ffe6c0", { max: 360 });
    salir(g, a, l, h, 8, 0.2);
    g.fillStyle = "#efe6cf";
    g.beginPath();
    g.moveTo(l, h);
    g.lineTo(l - 90, h);
    g.lineTo(l, h - 60);
    g.fill();
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.beginPath();
    g.moveTo(l - 90, h);
    g.lineTo(l, h - 60);
    g.lineTo(l - 8, h - 50);
    g.fill();
  });
  // Le totem de l'hôtel
  region(g, R.totem, (l, h) => {
    g.fillStyle = "#e8e0c8";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#5d8a9a";
    g.fillRect(0, 0, l, 70);
    texte(g, "Le", l / 2, 22, 24, "#fff4dc", { police: "italic", fonte: script });
    texte(g, "PANORAMIQUE", l / 2, 52, 24, "#ffffff", { max: l - 16 });
    texte(g, "Hôtel ★★", l / 2, 98, 22, "#3f6a7a");
    texte(g, "Bar · Restaurant", l / 2, 128, 20, "#3f6a7a");
    texte(g, "Chambres vue mer", l / 2, 156, 18, "#3f6a7a");
    texte(g, "Bouillabaisse", l / 2, 186, 18, "#b0473a", { police: "italic" });
    g.save();
    g.translate(l / 2, 250);
    g.rotate(-0.18);
    const d = g.createLinearGradient(-100, 0, 100, 0);
    d.addColorStop(0, "#4a2a5a");
    d.addColorStop(1, "#e8904a");
    g.fillStyle = d;
    g.fillRect(-110, -38, 220, 76);
    texte(g, "INFINITY SUNSET", 0, -14, 20, "#ffffff", { max: 190 });
    texte(g, "rooftop · spa · selfie deck", 0, 14, 14, "#ffe6c0", { max: 190 });
    g.restore();
    salir(g, a, l, h, 12, 0.25);
  });
  // L'écran de la borne à selfie
  region(g, R.selfie, (l, h) => {
    ecran(g, a, l, h);
    texte(g, "SELFIE-POINT", l / 2, 28, 20, "#5a6a72");
    etoiles(g, 34, 54, 5, 8, "#4a5258");
    g.strokeStyle = "#3a464e";
    g.lineWidth = 4;
    g.strokeRect(50, 74, 60, 42);
    g.beginPath();
    g.arc(80, 95, 12, 0, 7);
    g.stroke();
    texte(g, "Souriez ! 2 Wh", l / 2, 136, 16, "#4a5258");
    felure(g, a, l, h);
  });
  // L'écran de la pompe connectée (il luit encore)
  region(g, R.pompe, (l, h) => {
    ecran(g, a, l, h, "#0c2430");
    texte(g, "WATTY PAY", l / 2, 30, 22, "#7fd0ff");
    texte(g, "Paiement", l / 2, 66, 18, "#bfeaff");
    texte(g, "par appli", l / 2, 88, 18, "#bfeaff");
    texte(g, "réseau indisponible", l / 2, 128, 13, "#ff9a7a");
  });
  // La table d'orientation : rose des vents gravée dans le laiton
  region(g, R.orientation, (l, h) => {
    g.fillStyle = "#7a7468";
    g.fillRect(0, 0, l, h);
    const cx = l / 2;
    const cy = h / 2;
    const d = g.createRadialGradient(cx, cy, 10, cx, cy, 150);
    d.addColorStop(0, "#e2c27a");
    d.addColorStop(1, "#a07a3a");
    g.fillStyle = d;
    g.beginPath();
    g.arc(cx, cy, 150, 0, 7);
    g.fill();
    g.strokeStyle = "#5a4020";
    g.lineWidth = 2;
    for (let i = 0; i < 16; i++) {
      const an = (i / 16) * Math.PI * 2;
      g.beginPath();
      g.moveTo(cx + Math.cos(an) * 30, cy + Math.sin(an) * 30);
      g.lineTo(cx + Math.cos(an) * (i % 4 ? 110 : 145), cy + Math.sin(an) * (i % 4 ? 110 : 145));
      g.stroke();
    }
    g.fillStyle = "#5a4020";
    g.beginPath();
    g.moveTo(cx, cy - 60);
    g.lineTo(cx + 12, cy);
    g.lineTo(cx, cy + 60);
    g.lineTo(cx - 12, cy);
    g.fill();
    const lieux = [["Cap du Phare 4 km", -0.3], ["Îles d'Or 18 km", 0.9], ["Comptoir du Port 9 km", 2.9], ["Mont Rouge 612 m", 4.3], ["Le large", 1.6]];
    for (const [t, an] of lieux) {
      g.save();
      g.translate(cx + Math.cos(an) * 95, cy + Math.sin(an) * 95);
      g.rotate(an + Math.PI / 2);
      texte(g, t, 0, 0, 13, "#3a2810", { fonte: serif });
      g.restore();
    }
    texte(g, "N", cx, cy - 132, 20, "#3a2810", { fonte: serif });
    texte(g, "Touring-Club · 1958", cx, cy + 40, 12, "#3a2810", { fonte: serif, police: "italic" });
    salir(g, a, l, h, 10, 0.25);
  });
  // L'affiche de Watty dans la boutique de la station
  region(g, R.watty, (l, h) => {
    g.fillStyle = "#2f6f73";
    g.fillRect(0, 0, l, h);
    watty(g, l / 2, 130, 150);
    texte(g, "FAITES LE PLEIN", l / 2, 236, 24, "#e9dfc6");
    texte(g, "Toujours plein,", l / 2, 268, 20, "#c79a3b", { police: "italic bold" });
    texte(g, "jamais à plat !", l / 2, 292, 20, "#c79a3b", { police: "italic bold" });
    salir(g, a, l, h, 12, 0.3);
  });
  // L'ardoise du menu
  region(g, R.menu, (l, h) => {
    g.fillStyle = "#2a2e2a";
    g.fillRect(0, 0, l, h);
    g.strokeStyle = "#8a6a48";
    g.lineWidth = 8;
    g.strokeRect(0, 0, l, h);
    texte(g, "Menu du jour", l / 2, 24, 22, "#efe6cf", { police: "italic", fonte: script });
    texte(g, "Soupe de poissons", l / 2, 56, 16, "#efe6cf", { police: "" });
    texte(g, "Loup grillé au fenouil", l / 2, 78, 16, "#efe6cf", { police: "" });
    texte(g, "Tarte aux figues", l / 2, 100, 16, "#efe6cf", { police: "" });
    g.fillStyle = "#e8b84a";
    g.save();
    g.translate(196, 132);
    g.rotate(0.12);
    g.fillRect(-56, -18, 112, 36);
    texte(g, "Infinity Brunch", 0, -6, 12, "#4a2a5a");
    texte(g, "49 crédits", 0, 9, 12, "#4a2a5a");
    g.restore();
  });
  // Le bandeau de la station
  region(g, R.station, (l, h) => {
    g.fillStyle = "#3f7a7c";
    g.fillRect(0, 0, l, h);
    texte(g, "STATION · CARBURANT", l / 2, 40, 28, "#efe6cf", { max: l - 20 });
    texte(g, "Lavage · Vidange · Cartes", l / 2, 74, 16, "#d8c890");
    salir(g, a, l, h, 8, 0.25);
  });
  region(g, R.cantonnier, (l, h) => {
    g.fillStyle = "#e4e0d6";
    g.fillRect(0, 0, l, h);
    g.strokeStyle = "#2b2b29";
    g.lineWidth = 3;
    g.strokeRect(4, 4, l - 8, h - 8);
    texte(g, "PONTS ET CHAUSSÉES", l / 2, 22, 18, "#2b2b29");
    texte(g, "Abri du cantonnier", l / 2, 44, 16, "#2b2b29", { police: "italic" });
  });
  region(g, R.tunnel, (l, h) => {
    g.fillStyle = "#e6e2d8";
    g.fillRect(0, 0, l, h);
    texte(g, "TUNNEL DU CAP ROUGE · 18 m · hauteur 4,30 m", l / 2, h / 2, 26, "#2b2b29", { max: l - 20 });
    salir(g, a, l, h, 10, 0.3);
  });
  // La planche des pillards
  region(g, R.barricade, (l, h) => {
    g.fillStyle = "#8a7a62";
    g.fillRect(0, 0, l, h);
    for (let y = 0; y < h; y += 32) {
      g.fillStyle = "rgba(0,0,0,0.15)";
      g.fillRect(0, y, l, 2);
    }
    texte(g, "PÉAGE", l / 2, 30, 34, "#b02a20", { fonte: "Impact, 'Arial Black', sans-serif", police: "" });
    texte(g, "DÉPOSE DANS", l / 2, 64, 22, "#b02a20", { fonte: "Impact, 'Arial Black', sans-serif", police: "" });
    texte(g, "LA CAISSE ↓", l / 2, 92, 22, "#b02a20", { fonte: "Impact, 'Arial Black', sans-serif", police: "" });
    texte(g, "sinon demi-tour", l / 2, 118, 14, "#2a2420", { police: "italic" });
  });
  region(g, R.crique, (l, h) => {
    g.fillStyle = "#f2efe6";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#4a2a5a";
    g.fillRect(0, 0, l, 34);
    texte(g, "CRIQUE PRIVÉE", l / 2, 18, 22, "#ffe6c0");
    texte(g, "Infinity Members Only", l / 2, 54, 18, "#4a2a5a", { police: "italic bold" });
    texte(g, "accès par badge", l / 2, 78, 15, "#4a2a5a");
    salir(g, a, l, h, 8, 0.25);
  });
  region(g, R.eboulement, (l, h) => {
    g.fillStyle = "#9a8a6e";
    g.fillRect(0, 0, l, h);
    texte(g, "ROUTE EFFONDRÉE", l / 2, 30, 26, "#f2efe6", { fonte: "Impact, 'Arial Black', sans-serif", police: "" });
    texte(g, "un à la fois · tenez la corde", l / 2, 66, 17, "#2a2420", { police: "italic bold" });
  });
  region(g, R.villa, (l, h) => {
    g.fillStyle = "#f2efe6";
    g.fillRect(0, 0, l, h);
    g.strokeStyle = "#3a6a9a";
    g.lineWidth = 3;
    g.strokeRect(5, 5, l - 10, h - 10);
    texte(g, "Villa Les Mouettes", l / 2, h / 2, 26, "#3a6a9a", { police: "italic", fonte: serif });
  });
  region(g, R.domotique, (l, h) => {
    ecran(g, a, l, h, "#0a1a14");
    texte(g, "MAISON", l / 2, 26, 18, "#8ff0c0");
    texte(g, "SERENE", l / 2, 46, 18, "#8ff0c0");
    texte(g, "alarme active", l / 2, 78, 13, "#ffb08a");
    texte(g, "Bienvenue !", l / 2, 104, 13, "#bff5d8");
  });
  region(g, R.sunset, (l, h) => {
    const d = g.createLinearGradient(0, 0, 0, h);
    d.addColorStop(0, "#3a2440");
    d.addColorStop(1, "#7a3a40");
    g.fillStyle = d;
    g.fillRect(0, 0, l, h);
    texte(g, "SUNSET", l / 2, 24, 20, "#ffe6c0");
    texte(g, "BOOTH", l / 2, 46, 20, "#ffe6c0");
    texte(g, "coucher de soleil", l / 2, 76, 12, "#ffffff");
    texte(g, "premium", l / 2, 92, 12, "#ffffff");
    texte(g, "abonnement requis", l / 2, 114, 11, "#e8904a");
    felure(g, a, l, h);
  });
  region(g, R.glaces, (l, h) => {
    g.fillStyle = "#f2e6dc";
    g.fillRect(0, 0, l, h);
    for (let x = 0; x < l; x += 32) {
      g.fillStyle = "#7fb0a8";
      g.fillRect(x, 0, 16, 14);
      g.fillRect(x, h - 14, 16, 14);
    }
    texte(g, "GLACES · GRANITÉS", l / 2, 40, 26, "#b0473a", { max: l - 20 });
    texte(g, "Chichis · Beignets", l / 2, 66, 17, "#3f6a7a", { police: "italic" });
    salir(g, a, l, h, 8, 0.2);
  });
  region(g, R.travaux, (l, h) => {
    g.fillStyle = "#e8c440";
    g.fillRect(0, 0, l, h);
    texte(g, "CONFORTEMENT DE LA CORNICHE", l / 2, 24, 17, "#1f1f1f", { max: l - 16 });
    texte(g, "financé par Corniche+", l / 2, 52, 17, "#1f1f1f", { police: "italic bold" });
    texte(g, "fin des travaux : bientôt", l / 2, 76, 14, "#1f1f1f");
    salir(g, a, l, h, 10, 0.3);
  });
  region(g, R.parking, (l, h) => {
    g.fillStyle = "#2a4a8a";
    g.fillRect(0, 0, l, h);
    texte(g, "P", 40, h / 2, 64, "#ffffff");
    texte(g, "RÉSERVÉ", 160, 30, 22, "#ffffff");
    texte(g, "clients Infinity", 160, 56, 16, "#ffe6c0", { police: "italic" });
    texte(g, "voiturier premium", 160, 78, 14, "#ffffff");
  });
  region(g, R.corniche_plus, (l, h) => {
    ecran(g, a, l, h, "#0c1c2a");
    texte(g, "CORNICHE+ · assistance 24/7", l / 2, 22, 17, "#8fd0ff", { max: l - 12 });
    texte(g, "Éboulement signalé", l / 2, 50, 15, "#ffb08a");
    texte(g, "Abonnez-vous pour être secouru", l / 2, 74, 13, "#bfeaff", { max: l - 12 });
  });
  region(g, R.chambre, (l, h) => {
    g.fillStyle = "#efe6cf";
    g.fillRect(0, 0, l, h);
    texte(g, "CHAMBRES · vue mer*", l / 2, 24, 20, "#3f6a7a");
    texte(g, "*selon forfait Infinity", l / 2, 48, 13, "#b0473a", { police: "italic" });
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

export function creer({ usure = 0.7, carte = "montee" } = {}) {
  const def = FICHE.cartes.find((k) => k.id === carte) ?? FICHE.cartes[0];
  const x0 = def.decalage.x;
  const b = new Batiment(1962 + Math.round(x0), usure);
  const ctx = { b, c: b.c, M: matieres(), u: usure, x0, xa: x0 - 25, xb: x0 + 25, ici: bande(x0), objets: {}, obstaclesBarricade: [], obstaclesPin: [] };
  terrain(ctx);
  route(ctx);
  bords(ctx);
  nature(ctx);
  ecume(ctx);
  routeObjets(ctx);
  station(ctx);
  panneauCorniche(ctx);
  abriCantonnier(ctx);
  voitureDansLePin(ctx);
  tunnel(ctx);
  belvedere(ctx);
  panoramique(ctx);
  terrasse(ctx);
  parkingHotel(ctx);
  villa(ctx);
  eboulement(ctx);
  palierCrique(ctx);
  pinTombe(ctx);
  vracDePierres(ctx);
  sortie(ctx);
  alentours(ctx);
  const groupe = recentrer(b.construire(), x0);
  // Les objets nommés du tronçon (FICHE.objets) et les obstacles qui n'existent que dans un état : la porte fermée de
  // la barricade (à retirer quand on a payé), le pin entier (à retirer quand on l'a débité). Tout est déjà recentré.
  groupe.userData.objets = ctx.objets;
  const deplacer = (liste) => liste.map((s) => ({ ...s, x1: arr(s.x1 - x0), z1: arr(s.z1), x2: arr(s.x2 - x0), z2: arr(s.z2) }));
  groupe.userData.obstaclesBarricade = deplacer(ctx.obstaclesBarricade);
  groupe.userData.obstaclesPin = deplacer(ctx.obstaclesPin);
  return groupe;
}
