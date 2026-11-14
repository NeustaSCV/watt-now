// Le moulin à eau et sa minoterie (Book 20 §3.6, « Moulin à eau », Marais et rivière, anneau moyen, danger ●●).
//
// Un moulin de pierre blonde posé sur son bief, sa grande roue à aubes à l'arrêt contre le pignon est ; accolée à
// l'ouest, la minoterie de brique (quatre niveaux, monte-sacs sous l'auvent du pignon) que l'Abondance avait changée en
// « Expérience Farine Authentique ». Autour : le logis du meunier, l'étable et l'atelier du charpentier de moulin, la
// rivière, le pont de pierre à deux arches, les saules. Ce n'est PAS le moulin des Mécanistes (Book 20 §4, qui tourne
// encore) : celui-ci est abandonné, et sa roue est à restaurer (objectif de jeu des Mécanistes ⚙️, Book 01, Book 19 §2.1).
//
// Une seule carte (64 × 54 m), qui fournit son propre sol (`solPropre`) : la rivière et le bief sont creusés sous
// y = 0 (eau à y = −0,6 dans le bief amont, −1,5 dans la rivière) ; tout ce qui se visite reste à y = 0.
//
// Repère : +x à l'est, +z au sud. La rivière coule du nord au sud à l'est du lot (x 17 → 25). Le bief court entre la
// rivière et le moulin (x 9,5 → 13), séparé d'elle par une levée (x 13 → 17) ; il rejoint la rivière au sud (z 4 → 8).
// Le moulin : x −4 → 8, z −11 → 1. La minoterie : x −18 → −4, z −13 → 3. Le logis : x −30 → −21, z −6 → 4.
// Les dépendances (atelier à l'ouest, étable à l'est) : x −24 → −6, z 9 → 16. Le pont : z 15 → 19.
// Les façades sud et est, et les cloisons, sont coupées à hauteur d'allège : le haut des murs, les étages et les toits
// forment des couches qui s'effacent quand le personnage entre.

import * as THREE from "three";
import {
  Batiment, Chantier, PALETTE, matiere, matiereMonde, matiereTexture, matiereVerre, matiereLueur, mur, lierre as lierreA, touffes,
  semerTouffes as semerA, gravats, debris as debrisA, jonchee as joncheeA, arbuste, arbre, raiDeLumiere as raiA, flaque,
  dessiner, taches, aleatoire,
} from "../commun/atelier.js";

// La végétation et le menu désordre coûtent cher en triangles : on les dose.
const lierre = (c, x, y0, z, ry, l, h, n) => lierreA(c, x, y0, z, ry, l, h, Math.round(n * 0.3));
const semerTouffes = (c, x1, z1, x2, z2, n, t, y) => semerA(c, x1, z1, x2, z2, Math.round(n * 0.3), t, y);
const debris = (c, x1, z1, x2, z2, n, t, y) => debrisA(c, x1, z1, x2, z2, Math.round(n * 0.35), t, y);
const jonchee = (c, x1, z1, x2, z2, n, t, y) => joncheeA(c, x1, z1, x2, z2, Math.round(n * 0.6), t, y);
// Un seul matériau de lueur pour tous les rais (l'opacité fait la clé du cache)
const raiDeLumiere = (c, a, b, l) => raiA(c, a, b, l, 0.09);

const PI = Math.PI;

// ---------- La fiche ----------

export const FICHE = {
  id: "moulin",
  nom: "Le moulin à eau",
  lieu: "Moulin à eau · Marais et rivière · moyen",
  environnement: "marais et rivière",
  anneau: "moyen",
  danger: 2,
  solPropre: true,
  recit:
    "Trois siècles durant, la roue a tourné au pas de la rivière. Puis l'Abondance a racheté la minoterie pour en faire une « Expérience Farine Authentique », où des robots moulaient « à l'ancienne » une farine vendue en pain sous plastique, artisanal garanti par algorithme. La roue, elle, attend : il lui manque des aubes, quelques alluchons et un peu de patience, de quoi faire rêver n'importe quel Mécaniste.",
  inspiration:
    "les moulins de Bourgogne et du Perche à l'abandon, les grandes minoteries de brique (les Grands Moulins de Pantin avant leur rénovation), les photographies d'urbex meunier : roues à aubes moussues, engrenages de bois à alluchons, trémies et blutoirs, sacs de farine pétrifiés, poussière dans les rais de lumière",
  reperes: [
    "La grande roue à aubes, bois et fer, à l'arrêt dans son bief : moussue, des aubes manquantes, une branche coincée dans les bras",
    "La vanne motrice fermée qui fuit, la vanne de décharge levée : la chute d'eau et son écume, qu'on enjambe sur une passerelle de planches",
    "La salle des meules : le beffroi de chêne, une paire sous son archure avec sa trémie, l'autre démontée, la meule tournante pendue à sa potence",
    "La salle de la roue : l'arbre qui traverse le mur, le rouet à alluchons dans sa fosse, la lanterne et le gros fer, la courroie qui pend",
    "La minoterie de brique sur quatre niveaux (étages inaccessibles), le monte-sacs et sa poulie sous l'auvent du pignon, l'enseigne peinte « MINOTERIE DU GUÉ »",
    "L'« Expérience Farine Authentique » : pains « artisanaux » sous plastique, borne « Pétrissez virtuellement ! », le robot meunier, « Farine moulue à l'ancienne par des robots »",
    "Le magasin : sacs de farine pétrifiés, bascule, blutoir, goulotte descendue des étages",
    "Le logis du meunier (cuisine à cheminée, chambre), l'étable, l'atelier du charpentier de moulin (alluchons de rechange, rouet en réparation)",
    "Le pont de pierre à deux arches et le brasero des survivants, les saules pleureurs, les roseaux, la cabane à canards vide",
    "Près de la roue, un graffiti : « ELLE TOURNERA ENCORE »",
    "Le parcours : la grande porte fermée à clé, la grosse clé au tableau de l'atelier, le beffroi qui coupe les meules en deux, le couloir du rouet au garde-corps brisé, le jardin clos de murs, la planche sur le bief et le panneau du halage",
  ],
  lot: { l: 64, p: 54 },
  // Le parcours de la 0.8 (conception H1B/L1B validée le 2026-10-10) : on arrive toujours au pont, on part par le halage.
  depart: { x: 28.5, z: 20.5 },
  arrivee: { x: 28.5, z: 20.5, nature: "la route, à l'est du pont de pierre (seule arrivée ; une reconnexion dans le Moulin y ramène)" },
  sorties: [
    { x: 32, z: 17, nature: "la route de l'est, par le pont (on repart par où l'on est venu)" },
    { x: 15, z: -27, nature: "le chemin de halage, au bout de la levée, vers le Gué (sortie seulement, jamais une arrivée)" },
  ],
  entrees: [
    { x: 1, z: 1.3, nature: "grande porte de la salle des meules : fermée à clé (la grosse clé est au tableau de l'atelier) ; elle grince ; reste déverrouillée une fois ouverte" },
    { x: 6, z: 1.3, nature: "porte de la salle de la roue : bouchée par l'éboulis du plancher de l'étage (on voit par-dessus, on ne passe pas)" },
    { x: -9.6, z: 3.3, nature: "porte vitrée brisée de l'« Expérience Farine Authentique » : ouverte (la boutique est un cul-de-sac)" },
    { x: -11, z: -3, nature: "porte entre la boutique et le magasin : condamnée (planches clouées)" },
    { x: -4, z: -9.75, nature: "porte entre le magasin et les meules nord (1,2 m)" },
    { x: 4.2, z: -9.7, nature: "ouverture entre les meules nord et la salle de la roue (1,4 m)" },
    { x: 4.2, z: -1.7, nature: "ouverture entre les meules sud et la salle de la roue (le couloir du rouet)" },
    { x: -15.5, z: -13.3, nature: "porte de derrière du magasin, sur le jardin (porte ordinaire)" },
    { x: 11.25, z: -21, nature: "la planche sur le bief, du jardin à la levée" },
    { x: -20.7, z: 2, nature: "porte du logis du meunier" },
    { x: -5.7, z: 12.5, nature: "grande porte de l'étable" },
    { x: -19.5, z: 8.7, nature: "porte de l'atelier du charpentier" },
  ],
  fouille: [
    { x: -17, z: 9.4, quoi: "LA GROSSE CLÉ DU MOULIN (« GRANDE PORTE »), au tableau à clés de l'atelier : garantie, à place fixe" },
    { x: -10, z: 14.6, quoi: "l'étable : la fourche à foin (une fois), harnais, seau, sel" },
    { x: 2.1, z: -10.2, quoi: "l'établi du rhabilleur (meules nord) : l'ÉTAU (4 jours)" },
    { x: 6, z: -10.3, quoi: "les poutres de chêne de rechange du rouet (salle de la roue, nord) : 2 bûches garanties (24 h)" },
    { x: -15, z: -10.5, quoi: "le magasin : sacs de farine ancienne (en partie pétrifiée), TOILE DE JUTE (24 h)" },
    { x: -7.3, z: -12.0, quoi: "le magasin : les barils à farine cerclés, leurs FEUILLARDS (24 h)" },
    { x: 8.4, z: -16.5, quoi: "le jardin : l'IF penché sur le bief, un bâton d'if (12 h)" },
    { x: 11.3, z: -0.4, quoi: "la roue hydraulique, À RESTAURER (aubes, alluchons, frettes, arbre) : objectif des Mécanistes ⚙️ (plus tard)" },
    { x: 6.4, z: -1.1, quoi: "le rouet, engrenage maître à alluchons de bois, et la lanterne (engrenages)" },
    { x: 2.1, z: -4, quoi: "la paire de meules démontée : meule tournante sur sa potence, marteaux à rhabiller" },
    { x: -2.2, z: -10, quoi: "la meule de rechange dressée contre le mur nord (pierre meulière)" },
    { x: -1.4, z: -3.5, quoi: "la huche à farine sous l'anche : farine ancienne, sacs" },
    { x: 0, z: -2.4, quoi: "la courroie de cuir qui pend de l'arbre de transmission, poulies" },
    { x: -8.5, z: -9, quoi: "la bascule décimale : poids en fonte, fléau" },
    { x: -15, z: -4.4, quoi: "le blutoir : soie de blutage, bois, courroie" },
    { x: -12, z: 0.8, quoi: "la boutique : pains « artisanaux » sous plastique (conservateurs : toujours mous), « farine authentique » en sachets" },
    { x: -6.2, z: -1.4, quoi: "le robot meunier : moteurs, câbles, chapeau de feutre" },
    { x: -26, z: 1.8, quoi: "la cuisine : ustensiles, bocaux, sel, huile" },
    { x: -26.9, z: -4.1, quoi: "la chambre : la malle du meunier (couverture, vêtements, et le CARNET DU MEUNIER : la clé est au tableau de l'atelier, l'étau est monté au moulin)" },
    { x: -22.6, z: 11.8, quoi: "l'atelier : alluchons de rechange, outils du charpentier de moulin (sur l'établi, les trous des vis de l'étau parti)" },
    { x: 19.3, z: 17.6, quoi: "le camp sur le pont : bâche, couverture, ligne de pêche" },
  ],
  // 22 Éteints, dont 9 dormants (conception §2.8). Aucun à moins de 15 m de l'arrivée.
  eteints: [
    { id: "E1", x: 26.2, z: 3.5, type: "rampant (dans les roseaux de la berge est)" },
    { id: "E2", x: -0.8, z: 7.6, type: "errant (la cour, près de la charrette)" },
    { id: "E3", x: -23.2, z: 7.6, type: "errant (la cour, près du puits)" },
    { id: "E4", x: -11.4, z: 13.2, type: "putréfié (dans une stalle de l'étable)" },
    { id: "E5", x: -9.4, z: 14.3, type: "rampant (sous la litière de l'étable)" },
    { id: "E6", x: -20.0, z: 11.2, type: "ancien habitant (le charpentier de moulin, il porte ses outils)", dormant: true },
    { id: "E7", x: -18.6, z: 12.4, type: "errant (l'apprenti, près du rouet en réparation)", dormant: true },
    { id: "E8", x: 0.9, z: -2.0, type: "errant (garçon meunier)", groupe: "les garçons meuniers (la grande porte qui grince les met en marche ensemble)" },
    { id: "E9", x: -0.9, z: -2.2, type: "errant (garçon meunier)", groupe: "les garçons meuniers (la grande porte qui grince les met en marche ensemble)" },
    { id: "E10", x: 1.8, z: -0.6, type: "errant (garçon meunier)", groupe: "les garçons meuniers (la grande porte qui grince les met en marche ensemble)" },
    { id: "E11", x: 6.4, z: -4.3, y: -0.85, type: "rampant (au fond de la fosse du rouet : il ne sort pas, il gémit quand on passe en marchant)" },
    { id: "E12", x: 0.5, z: -9.8, type: "ancien habitant (le meunier, tablier blanc de farine, marteaux à rhabiller)" },
    { id: "E13", x: -1.6, z: -9.6, type: "errant (meules nord)", dormant: true },
    { id: "E14", x: 3.4, z: -9.3, type: "errant (meules nord)", dormant: true },
    { id: "E15", x: -14.6, z: -8.6, type: "errant (magasin, entre les piles de sacs)", dormant: true },
    { id: "E16", x: -13.8, z: -9.9, type: "errant (magasin, entre les piles de sacs)", dormant: true },
    { id: "E17", x: -12.2, z: -10.6, type: "errant (magasin, entre les piles de sacs)", dormant: true },
    { id: "E18", x: -14.4, z: -6.6, type: "errant (magasin, entre les piles de sacs)", dormant: true },
    { id: "E19", x: -11.0, z: -4.0, type: "équipé (le livreur de farine, casque de moto ; près de la porte condamnée)", dormant: true },
    { id: "E20", x: 9.0, z: -18.0, type: "rampant (dans les roseaux du bief, près de l'if)" },
    { id: "E21", x: -12.8, z: -0.6, type: "errant (le vendeur au tablier « Authentique »)" },
    { id: "E22", x: -7.2, z: -1.0, type: "équipé (le technicien des robots, casque de chantier ; près du robot meunier)" },
  ],
  // Les pièces sombres (une lampe y est utile) : la salle de la roue, les meules nord, le magasin.
  piecesSombres: ["salle de la roue", "meules nord", "magasin"],
  // Les objets à part, nommés : creer() les range dans groupe.userData.objets (le jeu les efface quand on les prend, ou
  // quand on ouvre la grande porte : il cache « porteFermee » et montre « porteOuverte », cachée au départ).
  objets: { porteFermee: "grande porte fermée", porteOuverte: "grande porte ouverte", cle: "grosse clé", fourche: "fourche", etau: "étau" },
  // Les bords du lot (à pied) : une haie au nord et à l'ouest, un muret au sud et à l'est ; ouverts sur la rivière,
  // le halage (nord) et la route (est, au pont).
  bords: "haie au nord et à l'ouest, muret de pierre au sud et à l'est ; ouverts sur la rivière, le halage et la route",
};

// ---------- Mesures du lieu ----------

const CUT = 0.9; // coupe des façades côté caméra (hauteur d'allège)
const CUTI = 1.2; // coupe des cloisons intérieures
const RIV = { x1: 17, x2: 25 }; // la rivière
const BIEF = { x1: 9.5, x2: 13 }; // le bief
const Z_VANNE = -7; // la vanne motrice (fermée)
const BRECHE = { z1: -16, z2: -14 }; // la vanne de décharge, dans la levée
const PLANCHE = { z1: -21.6, z2: -20.4 }; // la planche sur le bief (1,2 m), du jardin à la levée
const JONC = { z1: 4, z2: 8 }; // le canal de fuite rejoint la rivière
const Y_HAUT = -0.6; // l'eau du bief, en amont de la vanne
const Y_BAS = -1.5; // l'eau de la rivière et du canal de fuite
const FOND_HAUT = -1.4;
const FOND = -2.3;
const ROUE = { x: 11.25, y: 1.0, z: -3, r: 2.8, l: 1.5 };
const FOSSE = [5.95, -4.75, 6.85, -1.25]; // la fosse du rouet [x1, z1, x2, z2]

const COUL = {
  herbe: 0x8a9a5c,
  herbeSombre: 0x6e8448,
  herbeSeche: 0xa3a466,
  terre: 0xa48b6a,
  terreSombre: 0x6b5640,
  gravier: 0xb3aa94,
  vase: 0x6e6650,
  pierre: 0xcbbc9c, // calcaire blond de Bourgogne
  pierreGrise: 0xa8a090,
  quai: 0xaea594,
  brique: 0xad6a4f,
  briqueSombre: 0x86503c,
  bandeau: 0xd8cdb4,
  enduit: 0xdccfb2,
  tuile: 0x9e6450,
  ardoise: 0x5c646c,
  bois: 0x7a5f45,
  boisGris: 0x8f8676,
  boisSombre: 0x4f3e30,
  boisMouille: 0x5c5040,
  rouille: 0x8a4a2c,
  fer: 0x4a4744,
  jute: 0xb8a27a,
  farine: 0xebe6da,
  farineGrise: 0xc4bdad,
  eau: 0x8aa69a,
  eauBief: 0x7e9670,
  chute: 0xb4c2b4,
  ecume: 0xf4f4ee,
  mousse: 0x5f7a3a,
  roseau: 0x7d8d48,
  roseauSec: 0xb3a46c,
  massette: 0x5a3a22,
  menuiserie: 0x5a6660,
  volet: 0x6f8784,
  plastique: 0xe9dfc6,
  alu: 0x55595c,
  suie: 0x2c2926,
};

// ---------- Matières (créées une fois, partagées) ----------

const AL = 1024;
const AH = 1024;

/** L'atlas des enseignes, affiches, écrans et flammes (deux matières pour tout) : [x, y, l, h] en pixels. */
const R = {
  enseigne: [0, 0, 1024, 128],
  minoterie: [0, 128, 1024, 128],
  robots: [0, 256, 512, 256],
  borne: [512, 256, 256, 256],
  flamme: [768, 256, 128, 256],
  lanterne: [896, 256, 128, 128],
  etiquette: [896, 384, 128, 128],
  sac: [0, 512, 256, 128],
  graffiti: [256, 512, 512, 128],
  offre: [768, 512, 256, 128],
  meunier: [0, 640, 256, 384],
  almanach: [256, 640, 256, 256],
  plaque: [512, 640, 512, 128],
  watty: [512, 768, 256, 256],
  photo: [768, 768, 128, 128],
  halage: [768, 896, 256, 80],
};

let M = null;

function matieres() {
  if (M) return M;
  const planches = matiereTexture(dessiner("moulin-planches", 256, 256, dessinerPlanches), {});
  planches.userData.tuile = 2.4;
  const terrain = matiereTexture(dessiner("moulin-terrain", 256, 256, dessinerTerrain), { roughness: 1 });
  terrain.userData.tuile = 7;
  const eau = new THREE.MeshStandardMaterial({ map: dessiner("moulin-eau", 128, 256, dessinerEau), vertexColors: true, roughness: 0.12, metalness: 0.3, transparent: true, opacity: 0.82, depthWrite: false, side: THREE.DoubleSide });
  eau.userData.sansOmbre = true;
  const ecume = new THREE.MeshStandardMaterial({ map: dessiner("moulin-ecume", 128, 128, dessinerEcume), vertexColors: true, roughness: 0.7, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide });
  ecume.userData.sansOmbre = true;
  const atlas = dessiner("moulin-atlas", AL, AH, dessinerAtlas, false);
  const enseignes = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.85, alphaTest: 0.5, side: THREE.DoubleSide });
  const lumineux = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 1, vertexColors: true, roughness: 0.5, alphaTest: 0.4, side: THREE.DoubleSide });
  lumineux.userData.sansOmbre = true;
  M = {
    mat: matiere(0.95, 0),
    satin: matiere(0.6, 0.05),
    tole: matiere(0.75, 0.3),
    metal: matiere(0.4, 0.7),
    pierre: matiereMonde("pierreTaille"),
    brique: matiereMonde("brique"),
    enduit: matiereMonde("enduit"),
    tuiles: matiereMonde("ardoise"),
    planches,
    terrain,
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    eau,
    ecume,
    lueur: matiereLueur(0xfff0c8, 0.09),
    enseignes,
    lumineux,
  };
  return M;
}

// ---------- Le lieu ----------

export function creer({ usure = 0.7 } = {}) {
  matieres();
  const b = new Batiment(1789, usure);
  // Les couches qui s'effacent : le haut des murs, les étages et les toits de chaque bâtiment ; la roue.
  const T = b.couche("moulin et minoterie", { x: -5, z: -5, l: 26.8, p: 16.8 }, CUT, 19.5);
  // La couche « roue » couvre la roue ET le rouet et sa lanterne (dans la salle de la roue) : ils s'effacent quand ils
  // cachent le personnage, dans le couloir du rouet comme sur le bief.
  const Ro = b.couche("roue", { x: 8.78, z: -3, l: 7.75, p: 6 }, 0, 3.9);
  const L = b.couche("logis du meunier", { x: -25.5, z: -1, l: 10, p: 11 }, CUT, 7.2);
  const D = b.couche("dépendances", { x: -15, z: 12.5, l: 18.9, p: 7.9 }, CUT, 5.6);
  const J = b.couche("mur du jardin", { x: -25, z: -6, l: 14.4, p: 1.0 }, CUT, 2.2);
  const k = { b, c: b.c, T, Ro, L, D, J, usure, bris: 0.2 + 0.7 * usure };

  sols(k);
  eaux(k);
  quais(k);
  pont(k);
  vannes(k);
  roue(k);
  moulin(k);
  salleDesMeules(k);
  salleDeLaRoue(k);
  minoterie(k);
  magasin(k);
  boutique(k);
  logis(k);
  cuisine(k);
  chambre(k);
  dependances(k);
  etable(k);
  atelier(k);
  cour(k);
  jardin(k);
  limites(k);
  abords(k);
  camp(k);

  // La nuit : le feu dans la cheminée du meunier, la lanterne de la salle des meules, le brasero du pont, la borne.
  b.lumiere(-29.1, 0.7, 1.5, 0xff8a3d, 9, 9, "feu dans la cheminée du meunier");
  b.lumiere(0.6, 2.35, -3.0, 0xffd27a, 6, 10, "lanterne de la salle des meules");
  b.lumiere(19.6, 1.3, 17.0, 0xff9a4a, 12, 14, "brasero de survivants sur le pont");
  b.lumiere(-14.0, 1.4, 1.9, 0x9fe0ff, 3, 5, "écran de la borne « Pétrissez virtuellement ! »");

  // L'eau qui coule, l'écume qui respire, les flammes qui dansent.
  const anime = new THREE.Object3D();
  anime.userData.animer = (t) => {
    M.eau.map.offset.y = (t * 0.22) % 1;
    M.ecume.map.offset.y = (t * 0.3) % 1;
    M.ecume.opacity = 0.72 + 0.14 * Math.sin(t * 1.7);
    M.lumineux.emissiveIntensity = 0.95 + 0.22 * Math.sin(t * 13.1) * Math.sin(t * 7.3);
  };
  b.ajouter(anime);
  const groupe = b.construire();
  // Les objets que le jeu efface ou montre (FICHE.objets) : la grande porte fermée, puis ouverte (cachée au départ),
  // la grosse clé du tableau, la fourche de l'étable, l'étau de l'établi du rhabilleur.
  const objets = {};
  for (const [cle, nom] of Object.entries(FICHE.objets)) objets[cle] = groupe.getObjectByName(nom) ?? null;
  if (objets.porteOuverte) objets.porteOuverte.visible = false;
  groupe.userData.objets = objets;
  return groupe;
}

/** Un objet à part, nommé (un seul matériau : un seul appel de dessin) : on le bâtit, puis on l'ajoute au lieu. */
function objetNomme(k, nom, graine, bâtir) {
  const ch = new Chantier(graine);
  bâtir(ch);
  const g = ch.construire();
  g.name = nom;
  k.b.ajouter(g);
  return g;
}

// ---------- Outils de géométrie ----------

function repereMur(a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  return { L: Math.hypot(dx, dz), ry: -Math.atan2(dz, dx), dx, dz };
}

/** [u1, u2] privé des intervalles `trous`. */
function soustraire(u1, u2, trous) {
  let res = [[u1, u2]];
  for (const [t1, t2] of trous) {
    res = res.flatMap(([p, q]) => {
      if (t2 <= p || t1 >= q) return [[p, q]];
      const o = [];
      if (t1 > p) o.push([p, t1]);
      if (t2 < q) o.push([t2, q]);
      return o;
    });
  }
  return res;
}

/** Les ouvertures d'une tranche de mur [p0, p1], ramenées à sa base (une fenêtre coupée devient un vide). */
function tranche(ouvertures, p0, p1) {
  return ouvertures
    .filter((o) => o.haut > p0 + 0.01 && o.bas < p1 - 0.01)
    .map((o) => {
      const entiere = o.bas >= p0 - 1e-6 && o.haut <= p1 + 1e-6;
      return { ...o, type: o.type === "fenetre" && entiere ? "fenetre" : "vide", bas: Math.max(0, o.bas - p0), haut: Math.min(p1 - p0 + 0.5, o.haut - p0) };
    });
}

/**
 * Un mur en bandes de matières (soubassement de pierre, brique…), coupé à `cut` : le dessous reste dans k.c, le
 * dessus va dans la couche `haut`. `cut` = h : tout le mur reste visible. Les obstacles suivent les ouvertures.
 */
function murBandes(k, haut, a, b, spec) {
  const { h, cut = CUT, ep, ouvertures = [], breches = [], bandes, obstacles = true } = spec;
  for (const bd of bandes) {
    for (const [p0, p1, ch] of [[bd.y1, Math.min(bd.y2, cut), k.c], [Math.max(bd.y1, cut), bd.y2, haut]]) {
      if (p1 - p0 < 0.02) continue;
      const dernier = p1 >= h - 1e-6;
      mur(ch, a, b, { y0: p0, h: p1 - p0, ep, couleur: bd.couleur, mat: bd.mat, ouvertures: tranche(ouvertures, p0, p1), breches: dernier ? breches : [], arase: dernier ? spec.arase ?? 0 : 0 });
    }
  }
  if (obstacles) {
    const { L, dx, dz } = repereMur(a, b);
    const trous = ouvertures.filter((o) => o.bas < 0.5 && o.haut > 0.5).map((o) => [o.u - o.l / 2, o.u + o.l / 2]);
    for (const [u1, u2] of soustraire(0, L, trous)) k.b.obstacle(a[0] + (dx * u1) / L, a[1] + (dz * u1) / L, a[0] + (dx * u2) / L, a[1] + (dz * u2) / L);
  }
}

/** Une bande en saillie sur la face extérieure (+z local) d'un mur : bandeau, corniche, soubassement. */
function bande(ch, a, b, ep, y1, y2, s, couleur, mat, deborde = s) {
  const { L, ry } = repereMur(a, b);
  ch.repere({ x: a[0], z: a[1], ry }, () => ch.pave(-deborde, y1, ep / 2 - 0.02, L + deborde, y2, ep / 2 + s, couleur, mat, { nuance: 0.03, crasse: y1 < 1 }));
}

/** Un pignon triangulaire dans le plan d'un mur (de a à b), de y0 à y0 + hauteur. */
function pignon(ch, a, b, y0, hauteur, ep, couleur, mat) {
  const { L, ry } = repereMur(a, b);
  const s = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(L, 0), new THREE.Vector2(L / 2, hauteur)]);
  const g = new THREE.ExtrudeGeometry(s, { depth: ep, bevelEnabled: false }).translate(0, 0, -ep / 2);
  ch.poser(g, mat, couleur, { x: a[0], y: y0, z: a[1], ry }, { nuance: 0.02, crasse: false });
  g.dispose();
}

/**
 * Un toit à deux pans (faîtage selon x local), en lés de tuiles : comme `toitDeuxPans` de l'atelier, mais le faîtage
 * reste dans la matière des tuiles (une matière de moins par couche) et quelques lés sont moussus.
 */
function toit(ch, x, z, l, p, y0, hf, spec = {}) {
  const { couleur = COUL.tuile, debord = 0.35, trous = [], ry = 0, moussu = 0.15 } = spec;
  const demi = p / 2 + debord;
  const pente = Math.atan2(hf, p / 2);
  const rampant = Math.hypot(demi, hf * (demi / (p / 2)));
  const lg = l + debord * 2;
  const nb = Math.max(2, Math.round(lg / 1.2));
  const vert = new THREE.Color(COUL.mousse);
  const teinte = (base) => (ch.hasard() < moussu ? new THREE.Color(base).lerp(vert, ch.entre(0.3, 0.6)).getHex() : base);
  ch.repere({ x, y: y0, z, ry }, () => {
    for (const s of [-1, 1]) {
      for (let i = 0; i < nb; i++) {
        const u = -lg / 2 + (i + 0.5) * (lg / nb);
        const troue = trous.find((t) => Math.sign(t.v) === s && Math.abs(u - t.u) < t.l / 2);
        for (const [v1, v2] of [[0, 0.5], [0.5, 1]]) {
          if (troue && v1 >= 1 - (troue.p ?? 1) - 1e-6) continue;
          const vm = (v1 + v2) / 2;
          const yy = hf - hf * (demi / (p / 2)) * vm;
          const zz = s * demi * vm;
          ch.boite(lg / nb + 0.01, 0.08, rampant * (v2 - v1) + 0.02, teinte(couleur), { x: u, y: yy, z: zz, rx: s * pente }, M.tuiles, { nuance: 0.035, crasse: false });
        }
      }
      for (const t of trous.filter((q) => Math.sign(q.v) === s)) {
        for (let u = t.u - t.l / 2 + 0.3; u < t.u + t.l / 2; u += 0.6) {
          if (ch.hasard() < 0.25) continue;
          ch.poutre([u, hf - 0.1, 0], [u, -0.05, s * (p / 2)], 0.1, COUL.boisSombre, M.mat);
        }
      }
    }
    // Faîtières, un ton plus sombre
    ch.boite(lg, 0.16, 0.28, new THREE.Color(couleur).multiplyScalar(0.8).getHex(), { y: hf + 0.03 }, M.tuiles, { crasse: false, nuance: 0 });
  });
}

/** Un panneau plat dont l'image vient de l'atlas (région `r`), face vers +z local. */
function panneau(ch, mat, r, pose, l, h) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
  ch.poser(g, mat, 0xffffff, pose, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Un quadrilatère libre (4 points [x, y, z] et leurs UV [u, v]). */
function quad(ch, mat, P, UV, couleur = 0xffffff) {
  const pos = [];
  const uv = [];
  for (const i of [0, 1, 2, 0, 2, 3]) {
    pos.push(...P[i]);
    uv.push(...UV[i]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  ch.poser(g, mat, couleur, {}, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Une nappe d'eau (ou d'écume) horizontale ; ses UV suivent le courant (`sens` : « z » vers le sud, « x » vers l'est). */
function nappe(ch, mat, x1, z1, x2, z2, y, sens, couleur, T = 3) {
  const P = [[x1, y, z1], [x1, y, z2], [x2, y, z2], [x2, y, z1]];
  quad(ch, mat, P, P.map(([x, , z]) => (sens === "x" ? [z / T, -x / T] : [x / T, -z / T])), couleur);
}

/** Une lame d'eau qui tombe : du bord (y1) au pied (y2), le long d'un segment horizontal. */
function lame(ch, mat, a, b, y1, y2, avance, couleur, T = 3) {
  // a, b : [x, z] du bord ; avance : [dx, dz] du pied par rapport au bord
  const P = [[a[0], y1, a[1]], [b[0], y1, b[1]], [b[0] + avance[0], y2, b[1] + avance[1]], [a[0] + avance[0], y2, a[1] + avance[1]]];
  quad(ch, mat, P, P.map(([x, y, z]) => [(x + z) / T, y / T]), couleur);
}

/** Un rectangle découpé de trous rectangulaires : la liste des rectangles pleins [x1, z1, x2, z2]. */
function decouper([x1, z1, x2, z2], trous) {
  const xs = [...new Set([x1, x2, ...trous.flatMap((t) => [t[0], t[2]]).filter((v) => v > x1 && v < x2)])].sort((p, q) => p - q);
  const zs = [...new Set([z1, z2, ...trous.flatMap((t) => [t[1], t[3]]).filter((v) => v > z1 && v < z2)])].sort((p, q) => p - q);
  const res = [];
  for (let i = 0; i < zs.length - 1; i++) {
    let debut = null;
    for (let j = 0; j < xs.length; j++) {
      const libre = j < xs.length - 1 && !trous.some((t) => xs[j] >= t[0] - 1e-6 && xs[j + 1] <= t[2] + 1e-6 && zs[i] >= t[1] - 1e-6 && zs[i + 1] <= t[3] + 1e-6);
      if (libre && debut === null) debut = j;
      if (!libre && debut !== null) {
        res.push([xs[debut], zs[i], xs[j], zs[i + 1]]);
        debut = null;
      }
    }
  }
  return res;
}

/** Une plaque irrégulière à plat (herbe plus sombre, terre, farine répandue). */
function plaque(ch, x, z, rayon, couleur, y = 0.004, mat = M.terrain) {
  const pts = [];
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2;
    const r = rayon * ch.entre(0.55, 1.1);
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts)).rotateX(-PI / 2);
  ch.poser(g, mat, couleur, { x, y, z, ry: ch.hasard() * 3 }, { crasse: false, nuance: 0.03 });
  g.dispose();
}

const GEO = new Map();
function geoCyl(r1, r2, h, n, ouvert = false) {
  const cle = `${r1}|${r2}|${h}|${n}|${ouvert}`;
  if (!GEO.has(cle)) GEO.set(cle, new THREE.CylinderGeometry(r1, r2, h, n, 1, ouvert));
  return GEO.get(cle);
}
const BOULE = new THREE.IcosahedronGeometry(1, 0);
const TIGE = new THREE.ConeGeometry(0.035, 1, 3).translate(0, 0.5, 0);
const MASSETTE = new THREE.CylinderGeometry(0.045, 0.045, 0.24, 3);
/** Un rameau de saule : cône effilé, pointe en bas, d'un mètre (on l'étire), suspendu par le haut. */
const RAMEAU = new THREE.ConeGeometry(0.2, 1, 3).rotateX(PI).translate(0, -0.5, 0);

/** Un cylindre vertical posé sur y (bas), centré en (x, z). */
function cylindre(ch, mat, couleur, x, y, z, r, h, n = 10, opts = {}) {
  ch.poser(geoCyl(r, r, h, n), mat, couleur, { x, y: y + h / 2, z }, opts);
}

/** Un vantail de porte en planches, pivotant sur sa charnière (x, z) ; `ry` : direction du mur ; `angle` : ouverture. */
function vantail(ch, x, z, ry, l, h, angle, couleur = COUL.boisGris, mat = M.planches, y0 = 0.03) {
  ch.repere({ x, y: y0, z, ry: ry + angle }, () => {
    ch.boite(l, h, 0.06, couleur, { x: l / 2, y: h / 2 }, mat, { nuance: 0.05 });
    for (const yy of [0.18, 0.82]) ch.boite(l - 0.08, 0.13, 0.04, couleur, { x: l / 2, y: h * yy, z: 0.05 }, mat, { nuance: 0.08 });
    const d = Math.hypot(l - 0.2, h * 0.64);
    ch.boite(0.12, d, 0.04, couleur, { x: l / 2, y: h / 2, z: 0.05, rz: Math.atan2(l - 0.2, h * 0.64) }, mat, { nuance: 0.08 });
  });
}

/** Une touffe de roseaux (tiges fines, quelques massettes brunes). */
function roseaux(ch, x, z, y, h = 2) {
  const n = 4;
  for (let i = 0; i < n; i++) {
    const hh = h * ch.entre(0.65, 1.15);
    const sec = ch.hasard() < 0.3;
    ch.repere({ x: x + ch.entre(-0.18, 0.18), y, z: z + ch.entre(-0.18, 0.18), rx: ch.entre(-0.14, 0.14), rz: ch.entre(-0.14, 0.14) }, () => {
      ch.poser(TIGE, M.mat, sec ? COUL.roseauSec : COUL.roseau, { e: [1, hh, 1] }, { crasse: false, nuance: 0.08 });
      if (i === 0) ch.poser(MASSETTE, M.mat, COUL.massette, { y: hh * 0.82 }, { crasse: false, nuance: 0.05 });
    });
  }
}

/** Un saule pleureur : tronc court et noueux, un dôme de feuillage, et le rideau de rameaux qui retombe jusqu'à l'eau. */
function saule(ch, x, z, h = 8, y = 0, penche = [0, 0], basRameaux = 0.4) {
  const tronc = 0x5f5444;
  const tete = [x + penche[0], y + h * 0.36, z + penche[1]];
  ch.tube([x, y - 0.3, z], tete, 0.4, tronc, M.mat, 7);
  ch.poser(BOULE, M.mat, tronc, { x: tete[0], y: tete[1], z: tete[2], e: [0.55, 0.4, 0.55] }, { nuance: 0.05 });
  const tons = [0x8aa34f, 0x9cb35c, 0x7f9a48, 0xa8b866, 0x93ab55];
  const R = h * 0.42;
  const yd = y + h * 0.78; // le haut du dôme
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * PI * 2 + ch.hasard();
    ch.tube(tete, [tete[0] + Math.cos(a) * R * 0.45, yd - 0.3, tete[2] + Math.sin(a) * R * 0.45], 0.14, tronc, M.mat, 5);
  }
  // Le dôme : quelques gros bouquets aplatis
  ch.poser(BOULE, M.mat, tons[0], { x: tete[0], y: yd, z: tete[2], ry: ch.hasard() * 3, e: [R * 0.6, h * 0.1, R * 0.6] }, { crasse: false, nuance: 0.05 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * PI * 2 + ch.hasard() * 0.5;
    ch.poser(BOULE, M.mat, tons[(i + 1) % tons.length], { x: tete[0] + Math.cos(a) * R * 0.62, y: yd - h * 0.06, z: tete[2] + Math.sin(a) * R * 0.62, rx: ch.hasard() * 3, ry: ch.hasard() * 3, e: [R * 0.34, h * 0.08, R * 0.34] }, { crasse: false, nuance: 0.06 });
  }
  // Le rideau : des rameaux effilés (pointe en bas) sur le pourtour du dôme
  const n = 80;
  for (let i = 0; i < n; i++) {
    const a = ch.hasard() * PI * 2;
    const t = ch.entre(0.35, 1.02);
    const rr = R * t;
    const top = yd - h * 0.05 - (t - 0.7) * h * 0.18;
    const bas = y + basRameaux + ch.entre(0, 2.2) + (1 - t) * 1.6;
    const lg = Math.max(0.8, top - bas);
    const px = tete[0] + Math.cos(a) * rr;
    const pz = tete[2] + Math.sin(a) * rr;
    ch.poser(RAMEAU, M.mat, tons[Math.floor(ch.hasard() * tons.length)], { x: px, y: top, z: pz, ry: -a + ch.entre(-0.4, 0.4), rz: -0.06 - 0.1 * t, e: [ch.entre(0.7, 1.3), lg, ch.entre(0.5, 0.9)] }, { crasse: false, nuance: 0.08 });
  }
}

// ---------- Le sol du lot : prairie, cour, chemins ----------

function sols(k) {
  const { c, usure } = k;
  const herbe = (x1, z1, x2, z2, trous = []) => {
    for (const [a1, b1, a2, b2] of decouper([x1, z1, x2, z2], trous)) c.pave(a1, -0.25, b1, a2, 0, b2, COUL.herbe, M.terrain, { crasse: false, nuance: 0.02 });
  };
  herbe(-32, -27, BIEF.x1, 27, [FOSSE]);
  herbe(BIEF.x2, -27, RIV.x1, BRECHE.z1);
  herbe(BIEF.x2, BRECHE.z2, RIV.x1, JONC.z1);
  herbe(BIEF.x1, JONC.z2, RIV.x1, 27);
  herbe(RIV.x2, -27, 32, 27);
  // Le socle du lot (une tranche de terre, comme une maquette)
  const terre = COUL.terreSombre;
  const socle = (x1, z1, x2, z2, haut) => c.pave(x1, -2.7, z1, x2, haut, z2, terre, M.mat, { crasse: false, nuance: 0.02 });
  for (const [z1, z2] of [[-27.15, -27], [27, 27.15]]) {
    socle(-32, z1, BIEF.x1, z2, -0.25);
    socle(BIEF.x1, z1, BIEF.x2, z2, z1 < 0 ? FOND_HAUT - 0.1 : -0.25);
    socle(BIEF.x2, z1, RIV.x1, z2, -0.25);
    socle(RIV.x1, z1, RIV.x2, z2, FOND - 0.1);
    socle(RIV.x2, z1, 32, z2, -0.25);
  }
  socle(-32.15, -27.15, -32, 27.15, -0.25);
  socle(32, -27.15, 32.15, 27.15, -0.25);

  // La prairie : des plaques plus sombres, plus sèches
  for (let i = 0; i < 34; i++) {
    const x = c.entre(-31, 31);
    const z = c.entre(-26, 26);
    if ((x > BIEF.x1 - 0.5 && x < BIEF.x2 + 0.5 && z < JONC.z2) || (x > RIV.x1 - 0.5 && x < RIV.x2 + 0.5)) continue;
    plaque(c, x, z, c.entre(1.2, 3.2), c.hasard() < 0.5 ? COUL.herbeSombre : COUL.herbeSeche);
  }
  // La cour en terre battue, les chemins
  const chemin = (x1, z1, x2, z2, couleur = COUL.terre, y = 0.012) => c.pave(x1, 0, z1, x2, y, z2, couleur, M.terrain, { crasse: false, nuance: 0.02 });
  chemin(-21, 1, BIEF.x1 - 0.2, 9);
  chemin(-6, 9, 5, 15.4);
  chemin(1, 15.4, 15.6, 18.6, COUL.gravier, 0.014);
  chemin(26.4, 15.4, 32, 18.6, COUL.gravier, 0.014);
  chemin(13.8, -27, 16.2, JONC.z1, COUL.gravier, 0.014); // le chemin de halage sur la levée
  for (let i = 0; i < 10; i++) plaque(c, c.entre(-19, 8), c.entre(2, 14), c.entre(0.8, 1.8), c.hasard() < 0.5 ? COUL.herbeSombre : COUL.terreSombre, 0.016);
  // Ornières de la route
  for (const dz of [-0.6, 0.6]) c.pave(1, 0, 17 + dz - 0.15, 15.5, 0.018, 17 + dz + 0.15, COUL.terreSombre, M.terrain, { crasse: false });
  // Le parvis de l'« Expérience » : pavés de béton gris clair, en dalles
  c.pave(-18.5, 0, 3.2, -3.6, 0.03, 4.9, 0xbab6ac, M.pierre, { crasse: false, nuance: 0 });
  // Herbes folles partout, plus nombreuses avec le temps
  semerTouffes(c, -31, -26, 8, -14, Math.round(70 * usure + 20), COUL.herbeSeche);
  semerTouffes(c, -31, 17, 8, 26, Math.round(60 * usure + 20), COUL.herbeSeche);
  semerTouffes(c, RIV.x2 + 0.5, -26, 31.5, 26, Math.round(40 * usure + 10), COUL.herbeSeche);
  semerTouffes(c, -20, 2, 8, 9, Math.round(40 * usure), COUL.herbeSeche, 0.012);
  semerTouffes(c, BIEF.x1 + 0.2, JONC.z2 + 0.5, RIV.x1 - 0.3, 26, Math.round(20 * usure + 6), COUL.herbeSeche);
}

// ---------- L'eau : bief, canal de fuite, rivière, chutes, écume ----------

function eaux(k) {
  const { c } = k;
  // Les fonds de vase
  c.pave(BIEF.x1, FOND_HAUT - 0.1, -27, BIEF.x2, FOND_HAUT, Z_VANNE, COUL.vase, M.mat, { crasse: false, nuance: 0 });
  c.pave(BIEF.x1, FOND - 0.1, Z_VANNE, BIEF.x2, FOND, JONC.z2, COUL.vase, M.mat, { crasse: false, nuance: 0 });
  c.pave(BIEF.x2, FOND - 0.1, JONC.z1, RIV.x1, FOND, JONC.z2, COUL.vase, M.mat, { crasse: false, nuance: 0 });
  c.pave(RIV.x1, FOND - 0.1, -27, RIV.x2, FOND, 27, COUL.vase, M.mat, { crasse: false, nuance: 0 });
  // Galets et grosses pierres au fond, quelques-unes affleurent
  for (let i = 0; i < 5; i++) gravats(c, c.entre(RIV.x1 + 0.8, RIV.x2 - 0.8), c.entre(-26, 26), c.entre(0.5, 1.1), 4, [0x8a8578, 0x6e6a60, 0x9a9384], FOND);
  for (const [x, z, s] of [[19.2, -21, 0.9], [23.4, -4, 0.7], [18.4, 9.5, 0.8], [22.6, 24, 1.0]]) c.poser(BOULE, M.mat, 0x7e7a6e, { x, y: FOND + s * 0.75, z, rx: c.hasard(), ry: c.hasard() * 3, e: [s * 1.3, s * 0.95, s] }, { nuance: 0.05 });
  // Les herbes d'eau sous la surface (sombres, couchées par le courant)
  for (let i = 0; i < 26; i++) {
    const x = c.entre(RIV.x1 + 0.4, RIV.x2 - 0.4);
    c.boite(c.entre(0.08, 0.16), 0.03, c.entre(0.8, 1.8), 0x3d5230, { x, y: FOND + 0.4, z: c.entre(-26, 26), ry: c.entre(-0.2, 0.2), rx: 0.3 }, M.mat, { crasse: false, nuance: 0.1 });
  }

  // Les nappes : bief amont (haut, presque dormant), bief aval et canal de fuite, rivière
  nappe(c, M.eau, BIEF.x1 + 0.3, -27, BIEF.x2 - 0.3, Z_VANNE, Y_HAUT, "z", COUL.eauBief, 6);
  nappe(c, M.eau, BIEF.x1 + 0.3, Z_VANNE, BIEF.x2 - 0.3, JONC.z1 + 0.3, Y_BAS, "z", COUL.eau);
  nappe(c, M.eau, BIEF.x1 + 0.3, JONC.z1 + 0.3, RIV.x1 + 0.3, JONC.z2 - 0.3, Y_BAS, "x", COUL.eau);
  nappe(c, M.eau, RIV.x1 + 0.3, -27, RIV.x2 - 0.3, 27, Y_BAS, "z", COUL.eau);
  // La vanne de décharge est levée : l'eau du bief file sur le seuil et tombe dans la rivière
  nappe(c, M.eau, BIEF.x2 - 0.3, BRECHE.z1 + 0.2, RIV.x1 + 0.05, BRECHE.z2 - 0.2, -0.64, "x", 0x6a7a5c, 2);
  lame(c, M.eau, [RIV.x1 + 0.05, BRECHE.z1 + 0.2], [RIV.x1 + 0.05, BRECHE.z2 - 0.2], -0.64, Y_BAS - 0.02, [0.45, 0], COUL.chute, 1.5);
  lame(c, M.eau, [RIV.x1 + 0.1, BRECHE.z1 + 0.35], [RIV.x1 + 0.1, BRECHE.z2 - 0.35], -0.66, Y_BAS - 0.02, [0.3, 0], 0xd4ddd2, 1.2);
  // La vanne motrice, fermée, fuit par le bas : un filet d'eau
  lame(c, M.eau, [10.7, Z_VANNE + 0.08], [11.8, Z_VANNE + 0.08], Y_HAUT - 0.15, Y_BAS - 0.02, [0, 0.3], COUL.chute, 1.5);

  // L'écume : des plaques irrégulières, plus denses au pied des chutes
  const ecume = (x, z, r, y, sx = 1, sz = 1) => {
    const pts = [];
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2;
      const rr = r * c.entre(0.55, 1.1);
      pts.push(new THREE.Vector2(Math.cos(a) * rr * sx, Math.sin(a) * rr * sz));
    }
    const g = new THREE.ShapeGeometry(new THREE.Shape(pts)).rotateX(-PI / 2).translate(x, y + 0.02, z);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) g.attributes.uv.setXY(i, pos.getX(i) / 2, -pos.getZ(i) / 2);
    c.poser(g, M.ecume, COUL.ecume, {}, { crasse: false, nuance: 0 });
    g.dispose();
  };
  for (let i = 0; i < 5; i++) ecume(RIV.x1 + 0.9 + i * 0.5, (BRECHE.z1 + BRECHE.z2) / 2 + c.entre(-0.6, 0.6), 1.3 - i * 0.15, Y_BAS + i * 0.002, 1.2, 1.4);
  ecume(RIV.x1 + 3.4, -14.2, 1.1, Y_BAS, 0.8, 2.2);
  ecume(15.2, (BRECHE.z1 + BRECHE.z2) / 2, 0.75, -0.64, 1.6, 0.9);
  ecume(11.2, Z_VANNE + 0.7, 0.7, Y_BAS, 1, 1);
  ecume(11.1, Z_VANNE + 1.8, 0.5, Y_BAS + 0.002, 1, 1.6);
  ecume(11.3, -0.6, 0.7, Y_BAS, 1.2, 1.2);
  ecume(RIV.x1 + 0.5, (JONC.z1 + JONC.z2) / 2, 1.1, Y_BAS, 1.1, 1.3);
  for (const z of [14.6, 19.4]) ecume(21, z, 0.6, Y_BAS, 1.1, 0.8);
  ecume(21, 21.2, 0.7, Y_BAS + 0.002, 0.9, 2.0);
  for (let i = 0; i < 7; i++) {
    const z = c.entre(-26, 25);
    if (z > 13 && z < 21) continue;
    ecume(c.hasard() < 0.5 ? RIV.x1 + 0.6 : RIV.x2 - 0.6, z, 0.4, Y_BAS, 0.6, 2.5);
  }
}

// ---------- Les quais de pierre et leurs margelles ----------

function quais(k) {
  const { c, b } = k;
  const quai = (x1, z1, x2, z2, y1, y2 = 0.02) => c.pave(x1, y1, z1, x2, y2, z2, COUL.quai, M.pierre, { nuance: 0.03 });
  const ligneEau = (x1, z1, x2, z2, y) => c.pave(x1, y - 0.2, z1, x2, y + 0.25, z2, 0x56603e, M.pierre, { crasse: false, nuance: 0.04 });
  const margelle = (x1, z1, x2, z2) => c.pave(x1, -0.04, z1, x2, 0.1, z2, 0xbdb4a2, M.pierre, { nuance: 0.03 });
  // Le bief, rive ouest (côté moulin)
  quai(BIEF.x1, -27, BIEF.x1 + 0.3, Z_VANNE, FOND_HAUT);
  quai(BIEF.x1, Z_VANNE, BIEF.x1 + 0.3, JONC.z2, FOND);
  ligneEau(BIEF.x1 + 0.3, -27, BIEF.x1 + 0.31, Z_VANNE, Y_HAUT);
  ligneEau(BIEF.x1 + 0.3, Z_VANNE, BIEF.x1 + 0.31, JONC.z1, Y_BAS);
  margelle(BIEF.x1 - 0.15, -27, BIEF.x1 + 0.35, JONC.z2);
  // Le bief, rive est (la levée), percée de la brèche de décharge
  for (const [z1, z2, y] of [[-27, BRECHE.z1, FOND_HAUT], [BRECHE.z2, Z_VANNE, FOND_HAUT], [Z_VANNE, JONC.z1, FOND]]) {
    quai(BIEF.x2 - 0.3, z1, BIEF.x2, z2, y);
    margelle(BIEF.x2 - 0.35, z1, BIEF.x2 + 0.15, z2);
    ligneEau(BIEF.x2 - 0.31, z1, BIEF.x2 - 0.3, Math.min(z2, JONC.z1), y === FOND ? Y_BAS : Y_HAUT);
  }
  // La brèche : le seuil de pierre, ses joues, le massif qui tombe dans la rivière
  c.pave(BIEF.x2 - 0.3, FOND, BRECHE.z1, RIV.x1 + 0.05, -0.78, BRECHE.z2, 0x8f8a7c, M.pierre, { nuance: 0.02 });
  for (const [z1, z2] of [[BRECHE.z1 - 0.25, BRECHE.z1], [BRECHE.z2, BRECHE.z2 + 0.25]]) {
    quai(BIEF.x2 - 0.3, z1, RIV.x1 + 0.3, z2, -0.8);
    margelle(BIEF.x2 - 0.3, z1 - 0.1, RIV.x1 + 0.3, z2 + 0.1);
  }
  // Le canal de fuite
  quai(BIEF.x2, JONC.z1, RIV.x1, JONC.z1 + 0.3, FOND);
  margelle(BIEF.x2 - 0.35, JONC.z1 - 0.15, RIV.x1 + 0.35, JONC.z1 + 0.35);
  quai(BIEF.x1, JONC.z2 - 0.3, RIV.x1, JONC.z2, FOND);
  margelle(BIEF.x1 - 0.15, JONC.z2 - 0.35, RIV.x1 + 0.35, JONC.z2 + 0.15);
  ligneEau(BIEF.x2, JONC.z1 + 0.3, RIV.x1, JONC.z1 + 0.31, Y_BAS);
  // La rivière, rive ouest (sous le pont, la culée prend le relais)
  for (const [z1, z2] of [[-27, BRECHE.z1 - 0.25], [BRECHE.z2 + 0.25, JONC.z1], [JONC.z2, 15], [19, 27]]) {
    quai(RIV.x1, z1, RIV.x1 + 0.3, z2, FOND);
    margelle(RIV.x1 - 0.15, z1, RIV.x1 + 0.35, z2);
    ligneEau(RIV.x1 + 0.3, z1, RIV.x1 + 0.31, z2, Y_BAS);
  }
  quai(RIV.x1, 15, RIV.x1 + 0.3, 19, FOND, -0.3);
  // La rivière, rive est
  for (const [z1, z2] of [[-27, 15], [19, 27]]) {
    quai(RIV.x2 - 0.3, z1, RIV.x2, z2, FOND);
    margelle(RIV.x2 - 0.35, z1, RIV.x2 + 0.15, z2);
    ligneEau(RIV.x2 - 0.31, z1, RIV.x2 - 0.3, z2, Y_BAS);
  }
  quai(RIV.x2 - 0.3, 15, RIV.x2, 19, FOND, -0.3);
  // Un escalier de quai qui descend à l'eau (lavoir d'autrefois), rive ouest
  for (let i = 0; i < 6; i++) c.pave(RIV.x1 + 0.3, -0.25 - i * 0.25, 10.2 + i * 0.3, RIV.x1 + 1.2, -i * 0.25, 12.6, COUL.quai, M.pierre, { nuance: 0.04 });
  c.pave(RIV.x1 + 0.3, Y_BAS - 0.2, 10.2, RIV.x1 + 1.3, Y_BAS + 0.02, 12.6, 0x9a9282, M.pierre, { nuance: 0.03 });

  // Les bords d'eau : on ne passe pas (pour le jeu)
  const bord = (x1, z1, x2, z2) => b.obstacle(x1, z1, x2, z2, "berge");
  // La planche sur le bief (z −21,45 → −20,55) relie le jardin à la levée : les berges s'ouvrent là
  bord(BIEF.x1, -27, BIEF.x1, PLANCHE.z1);
  bord(BIEF.x1, PLANCHE.z2, BIEF.x1, JONC.z2);
  bord(BIEF.x2, -27, BIEF.x2, PLANCHE.z1);
  bord(BIEF.x2, PLANCHE.z2, BIEF.x2, BRECHE.z1);
  bord(BIEF.x2, BRECHE.z2, BIEF.x2, JONC.z1);
  for (const z of [BRECHE.z1, BRECHE.z2]) {
    bord(BIEF.x2, z, 14.4, z);
    bord(15.6, z, RIV.x1, z);
  }
  bord(BIEF.x2, JONC.z1, RIV.x1, JONC.z1);
  bord(BIEF.x1, JONC.z2, RIV.x1, JONC.z2);
  bord(RIV.x1, -27, RIV.x1, BRECHE.z1);
  bord(RIV.x1, BRECHE.z2, RIV.x1, JONC.z1);
  bord(RIV.x1, JONC.z2, RIV.x1, 15);
  bord(RIV.x1, 19, RIV.x1, 27);
  bord(RIV.x2, -27, RIV.x2, 15);
  bord(RIV.x2, 19, RIV.x2, 27);
}

// ---------- Le pont de pierre à deux arches ----------

function pont(k) {
  const { c, b, usure } = k;
  const z1 = 15;
  const z2 = 19;
  const pierre = 0xb8ad96;
  // Le corps du pont : un massif percé de deux arches surbaissées
  const forme = new THREE.Shape([new THREE.Vector2(RIV.x1, -2.45), new THREE.Vector2(RIV.x2, -2.45), new THREE.Vector2(RIV.x2, -0.32), new THREE.Vector2(RIV.x1, -0.32)]);
  const arches = [[17.25, 20.6], [21.4, 24.75]];
  for (const [x1, x2] of arches) {
    const cx = (x1 + x2) / 2;
    const demi = (x2 - x1) / 2;
    const fleche = 0.95;
    const R = (demi * demi + fleche * fleche) / (2 * fleche);
    const cy = -0.55 - R;
    const a0 = Math.atan2(Y_BAS - cy, demi);
    const trou = new THREE.Path();
    trou.moveTo(x1, -2.38);
    trou.lineTo(x2, -2.38);
    trou.lineTo(x2, Y_BAS);
    trou.absarc(cx, cy, R, a0, PI - a0, false);
    trou.lineTo(x1, -2.38);
    forme.holes.push(trou);
    // Les claveaux, plus clairs, sur les deux têtes de l'arche
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = a0 + ((i + 0.5) / n) * (PI - 2 * a0);
      for (const z of [z1 - 0.06, z2 + 0.06]) {
        c.boite(0.26, 0.5, 0.14, i === 4 ? 0xcfc4ac : 0xc4b9a2, { x: cx + Math.cos(a) * (R + 0.22), y: cy + Math.sin(a) * (R + 0.22), z, rz: a - PI / 2 }, M.pierre, { nuance: 0.05 });
      }
    }
  }
  const g = new THREE.ExtrudeGeometry(forme, { depth: z2 - z1, bevelEnabled: false, curveSegments: 8 }).translate(0, 0, z1);
  c.poser(g, M.pierre, pierre, {}, { nuance: 0, crasse: false });
  g.dispose();
  // Les avant-becs de la pile, en amont et en aval
  for (const z of [z1, z2]) {
    c.boite(1.05, 2.0, 1.05, pierre, { x: 21, y: -1.35, z, ry: PI / 4 }, M.pierre, { nuance: 0.03 });
    c.poser(geoCyl(0.02, 0.76, 0.7, 4), M.pierre, 0xa69c86, { x: 21, y: -0.0, z, ry: 0 }, { nuance: 0.03 });
  }
  // Le tablier, les parapets et leurs couvertines
  c.pave(15.5, -0.34, z1, 26.5, 0.08, z2, 0xb2a892, M.pierre, { nuance: 0.02, crasse: false });
  c.pave(15.5, 0.08, z1 + 0.6, 26.5, 0.1, z2 - 0.6, COUL.gravier, M.terrain, { crasse: false });
  for (const [za, zb] of [[z1, z1 + 0.42], [z2 - 0.42, z2]]) {
    c.pave(15.6, 0.08, za, 26.4, 0.92, zb, pierre, M.pierre, { nuance: 0.03 });
    c.pave(15.5, 0.92, za - 0.07, 26.5, 1.06, zb + 0.07, 0xcbc1aa, M.pierre, { nuance: 0.02 });
    for (const x of [15.6, 26.4]) c.pave(x - 0.35, 0, za - 0.1, x + 0.35, 1.25, zb + 0.1, pierre, M.pierre, { nuance: 0.03 });
    b.obstacle(15.3, (za + zb) / 2, 26.7, (za + zb) / 2, "parapet");
  }
  // Une pierre de parapet tombée dans la rivière
  if (usure > 0.4) {
    c.pave(22.8, 0.08, z2 - 0.42, 23.9, 0.55, z2, pierre, M.pierre, { nuance: 0.03 });
    c.boite(1.0, 0.4, 0.5, pierre, { x: 23.4, y: FOND + 0.3, z: z2 + 1.4, ry: 0.4, rz: 0.3 }, M.pierre);
  }
  // Mousse et lierre sur les têtes et les avant-becs
  lierre(c, 18.5, -1.6, z2 + 0.1, 0, 2.2, 1.5, Math.round(30 * usure));
  lierre(c, 24.2, -1.6, z1 - 0.1, PI, 1.6, 1.4, Math.round(20 * usure));
  semerTouffes(c, 16, z1 + 0.5, 26, z2 - 0.5, Math.round(16 * usure), COUL.herbeSeche, 0.1);
}

// ---------- Les vannes ----------

function vannes(k) {
  const { c, b } = k;
  const montant = (x1, z1, x2, z2, y1) => c.pave(x1, y1, z1, x2, 1.75, z2, COUL.pierre, M.pierre, { nuance: 0.03 });
  const cremaillere = (x, z, y1, y2) => c.pave(x - 0.05, y1, z - 0.03, x + 0.05, y2, z + 0.03, COUL.rouille, M.tole, { crasse: false });
  // Le volant de manœuvre (un anneau à rayons)
  const volant = (x, y, z, ry) => {
    c.repere({ x, y, z, ry }, () => {
      c.poser(new THREE.TorusGeometry(0.34, 0.035, 4, 10), M.tole, COUL.fer, {}, { crasse: false });
      for (let i = 0; i < 3; i++) c.boite(0.66, 0.04, 0.04, COUL.fer, { rz: (i * PI) / 3 }, M.tole, { crasse: false });
    });
  };
  // --- La vanne motrice, en travers du bief (fermée : la roue ne reçoit plus d'eau) ---
  const zv = Z_VANNE;
  montant(BIEF.x1, zv - 0.35, BIEF.x1 + 0.5, zv + 0.35, FOND_HAUT);
  montant(BIEF.x2 - 0.5, zv - 0.35, BIEF.x2, zv + 0.35, FOND_HAUT);
  c.pave(BIEF.x1, 1.75, zv - 0.2, BIEF.x2, 2.0, zv + 0.2, COUL.boisSombre, M.mat, { nuance: 0.03 });
  c.pave(BIEF.x1 + 0.5, FOND, zv - 0.12, BIEF.x2 - 0.5, FOND_HAUT, zv + 0.12, COUL.quai, M.pierre);
  for (let i = 0; i < 4; i++) c.pave(BIEF.x1 + 0.5, FOND_HAUT + i * 0.26, zv - 0.05, BIEF.x2 - 0.5, FOND_HAUT + (i + 1) * 0.26 - 0.02, zv + 0.05, i === 3 ? COUL.boisGris : COUL.boisMouille, M.planches, { nuance: 0.05 });
  cremaillere(10.7, zv, FOND_HAUT + 0.9, 2.7);
  cremaillere(11.8, zv, FOND_HAUT + 0.9, 2.7);
  c.pave(11.1, 2.0, zv - 0.12, 11.4, 2.25, zv + 0.12, COUL.fer, M.tole);
  volant(11.25, 2.5, zv, 0);
  panneau(c, M.enseignes, R.plaque, { x: BIEF.x1 + 0.25, y: 1.05, z: zv + 0.36 }, 0.72, 0.18);
  // --- La vanne de décharge, dans la levée (levée : l'eau s'échappe vers la rivière) ---
  const xv = BIEF.x2 + 0.15;
  montant(xv - 0.25, BRECHE.z1 - 0.45, xv + 0.25, BRECHE.z1 + 0.05, -0.8);
  montant(xv - 0.25, BRECHE.z2 - 0.05, xv + 0.25, BRECHE.z2 + 0.45, -0.8);
  c.pave(xv - 0.18, 1.75, BRECHE.z1 - 0.45, xv + 0.18, 2.0, BRECHE.z2 + 0.45, COUL.boisSombre, M.mat);
  for (let i = 0; i < 4; i++) c.pave(xv - 0.05, 0.45 + i * 0.26, BRECHE.z1 + 0.05, xv + 0.05, 0.69 + i * 0.26, BRECHE.z2 - 0.05, COUL.boisMouille, M.planches, { nuance: 0.05 });
  cremaillere(xv, BRECHE.z1 + 0.5, 0.45, 2.75);
  cremaillere(xv, BRECHE.z2 - 0.5, 0.45, 2.75);
  volant(xv, 2.45, (BRECHE.z1 + BRECHE.z2) / 2, PI / 2);
  // La passerelle de planches qui enjambe la brèche, ses garde-corps
  for (let i = 0; i < 6; i++) c.pave(14.4, 0.02, BRECHE.z1 - 0.3 + i * 0.44, 15.6, 0.09, BRECHE.z1 - 0.3 + i * 0.44 + 0.4, i === 3 ? COUL.boisSombre : COUL.boisGris, M.planches, { nuance: 0.06 });
  for (const x of [14.45, 15.55]) {
    for (const z of [BRECHE.z1 - 0.2, BRECHE.z2 + 0.2]) c.pave(x - 0.05, 0, z - 0.05, x + 0.05, 1.0, z + 0.05, COUL.boisGris, M.mat);
    c.pave(x - 0.04, 0.95, BRECHE.z1 - 0.2, x + 0.04, 1.03, BRECHE.z2 + 0.2, COUL.boisGris, M.mat);
    b.obstacle(x, BRECHE.z1 - 0.2, x, BRECHE.z2 + 0.2, "garde-corps");
  }
}

// ---------- La roue à aubes (couche à part : elle s'efface si elle cache le personnage) ----------

function roue(k) {
  const { c, Ro, usure } = k;
  const { x, y, z, r, l } = ROUE;
  const boisSec = 0x7d6c56;
  // L'arbre de la roue : du rouet (dans la salle de la roue) jusqu'au palier de la levée
  Ro.tube([6.1, y, z], [13.5, y, z], 0.2, 0x5a4a38, M.mat, 8);
  for (const xx of [7.1, 9.0, 13.2]) Ro.tube([xx - 0.06, y, z], [xx + 0.06, y, z], 0.235, COUL.rouille, M.tole, 8);
  // Le moyeu, ses frettes
  Ro.tube([x - l / 2 - 0.15, y, z], [x + l / 2 + 0.15, y, z], 0.48, COUL.boisSombre, M.mat, 8);
  for (const xx of [x - l / 2 - 0.1, x + l / 2 + 0.1]) Ro.tube([xx - 0.05, y, z], [xx + 0.05, y, z], 0.5, COUL.rouille, M.tole, 8);
  // Les deux couronnes et leurs bras
  const n = 16;
  const seg = 2 * r * Math.sin(PI / n) + 0.06;
  for (const sx of [x - l / 2, x + l / 2]) {
    for (let i = 0; i < n; i++) {
      const a = ((i + 0.5) / n) * PI * 2;
      const bas = Math.cos(a) < -0.2;
      Ro.repere({ x: sx, y, z, rx: a }, () => {
        Ro.boite(0.15, 0.36, seg, bas ? COUL.boisMouille : boisSec, { y: r - 0.18 }, M.mat, { nuance: 0.06, crasse: false });
        Ro.boite(0.17, 0.04, seg, COUL.rouille, { y: r + 0.01 }, M.tole, { crasse: false, nuance: 0.05 });
      });
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * PI * 2 + 0.2;
      if (sx > x && i === 3 && usure > 0.5) continue; // un bras cassé
      Ro.repere({ x: sx, y, z, rx: a }, () => Ro.boite(0.16, r - 0.55, 0.2, Math.cos(a) < -0.3 ? COUL.boisMouille : boisSec, { y: (r - 0.55) / 2 + 0.45 }, M.mat, { nuance: 0.05, crasse: false }));
    }
  }
  // Les aubes : 24 planches, quelques-unes manquantes, une qui pend ; mousse et algues sur celles d'en bas
  const na = 24;
  for (let i = 0; i < na; i++) {
    const a = (i / na) * PI * 2;
    const p = Ro.hasard();
    if (p < 0.1 + usure * 0.2) continue;
    const ybas = Math.cos(a);
    const couleur = ybas < -0.25 ? new THREE.Color(COUL.boisMouille).lerp(new THREE.Color(COUL.mousse), 0.5).getHex() : ybas < 0.3 ? COUL.boisMouille : 0x847562;
    Ro.repere({ x, y, z, rx: a }, () => {
      if (p > 0.93) Ro.boite(l - 0.1, 0.72, 0.05, couleur, { y: r - 0.25, z: 0.25, rx: 0.8, rz: 0.15 }, M.mat, { crasse: false, nuance: 0.05 });
      else {
        Ro.boite(l + 0.04, 0.72, 0.05, couleur, { y: r - 0.08 }, M.mat, { crasse: false, nuance: 0.06 });
        // des algues qui pendent des aubes basses
        if (ybas < -0.5 && Ro.hasard() < 0.6) Ro.boite(0.08, 0.5, 0.02, 0x4a6332, { x: Ro.entre(-0.6, 0.6), y: r + 0.25, z: 0.04 }, M.mat, { crasse: false });
      }
    });
  }
  // La mousse sur le moyeu et le bas des couronnes
  for (let i = 0; i < 10; i++) {
    const a = PI + Ro.entre(-1.2, 1.2);
    Ro.poser(BOULE, M.mat, COUL.mousse, { x: x + Ro.entre(-l / 2, l / 2), y: y + Math.cos(a) * r * Ro.entre(0.9, 1.02), z: z + Math.sin(a) * r * Ro.entre(0.9, 1.02), e: [0.25, 0.12, 0.25] }, { crasse: false, nuance: 0.08 });
  }
  // Une branche apportée par une crue, coincée dans les bras
  Ro.tube([x - 1.2, y - 1.5, z - 1.9], [x + 0.9, y + 0.9, z + 0.6], 0.07, 0x6a5a48, M.mat, 5);
  Ro.tube([x + 0.1, y - 0.3, z - 0.6], [x + 0.6, y - 0.9, z + 0.4], 0.04, 0x6a5a48, M.mat, 4);
  // Le palier de pierre sur la levée, son coussinet de bois
  c.pave(BIEF.x2 - 0.05, 0, z - 0.6, BIEF.x2 + 0.75, 0.75, z + 0.6, COUL.pierre, M.pierre, { nuance: 0.03 });
  c.pave(BIEF.x2, 0.75, z - 0.35, BIEF.x2 + 0.7, 0.85, z + 0.35, COUL.boisSombre, M.mat);
  k.b.obstacle(BIEF.x2, z - 0.6, BIEF.x2 + 0.75, z - 0.6, "palier");
  k.b.obstacle(BIEF.x2, z + 0.6, BIEF.x2 + 0.75, z + 0.6, "palier");
  // L'arbre barre le passage entre le moulin et le bief
  k.b.obstacle(8.3, z, BIEF.x1, z, "arbre de la roue");
}

// ---------- Le moulin de pierre : murs, étage, toit ----------

const FEN_M = () => ({ croisillons: 1, traverses: 2, cadre: 0x8a8274, appui: true, couleurAppui: 0xd6cab0, volet: "pendu", couleurVolet: COUL.volet });

function moulin(k) {
  const { c, T, usure } = k;
  const pierre = [{ y1: 0, y2: 3.6, mat: M.pierre, couleur: COUL.pierre }];
  const fen = { ...FEN_M(), bris: k.bris, verre: M.verre };
  // Rez-de-chaussée (sol à 0) : la façade sud et le pignon est sont coupés à hauteur d'allège
  murBandes(k, T, [-4, 1], [8, 1], {
    h: 3.6, ep: 0.6, bandes: pierre,
    ouvertures: [
      { u: 5, l: 1.8, bas: 0, haut: 2.6, type: "vide" },
      { u: 1.5, l: 0.9, bas: 1.0, haut: 2.3, type: "fenetre", ...fen },
      { u: 10, l: 1.2, bas: 0, haut: 2.3, type: "vide" },
    ],
  });
  murBandes(k, T, [8, 1], [8, -11], {
    h: 3.6, ep: 0.6, bandes: pierre,
    ouvertures: [
      { u: 4, l: 0.8, bas: 0.55, haut: 1.45, type: "vide" },
      { u: 9.5, l: 0.9, bas: 1.1, haut: 2.3, type: "fenetre", ...fen, volet: "ouvert" },
    ],
  });
  murBandes(k, T, [8, -11], [-4, -11], { h: 3.6, cut: 3.6, ep: 0.6, bandes: pierre, ouvertures: [{ u: 8, l: 0.8, bas: 1.3, haut: 2.4, type: "fenetre", ...fen, volet: null }] });
  // Linteaux de pierre au-dessus des portes, seuils
  for (const [x1, x2] of [[0.0, 2.0], [5.3, 6.7]]) {
    T.pave(x1 - 0.15, x1 < 1 ? 2.6 : 2.3, 0.68, x2 + 0.15, (x1 < 1 ? 2.6 : 2.3) + 0.35, 1.33, 0xd8cdb2, M.pierre, { nuance: 0.03 });
    c.pave(x1, 0, 0.7, x2, 0.07, 1.6, 0xb0a690, M.pierre, { nuance: 0.03 });
  }
  // La grande porte, à deux battants, FERMÉE À CLÉ (la grosse clé est au tableau de l'atelier) : le bas des battants
  // reste visible, le haut s'efface avec la façade. Ferrures, grosse serrure, heurtoir.
  // Deux couches nommées, que le jeu échange à l'ouverture : « grande porte fermée » et « grande porte ouverte » (cachée
  // au départ). Elles s'effacent comme la façade quand elles cachent le personnage. Un seul matériau chacune.
  const PF = k.b.couche("grande porte fermée", { x: 1, z: 1.05, l: 2.0, p: 0.4 }, 0, 2.7);
  for (const [x1, x2] of [[0.1, 0.98], [1.02, 1.9]]) {
    PF.pave(x1, 0.03, 0.94, x2, 2.58, 1.06, COUL.boisGris, M.planches, { nuance: 0.04 });
    for (const y of [0.46, 2.06]) PF.pave(x1 + 0.04, y - 0.06, 1.06, x2 - 0.04, y + 0.06, 1.1, COUL.boisSombre, M.planches, { nuance: 0.06 });
    for (const y of [0.5, 2.1]) PF.pave(x1 < 1 ? x1 : x2 - 0.55, y - 0.04, 1.1, x1 < 1 ? x1 + 0.55 : x2, y + 0.04, 1.12, COUL.fer, M.planches, { crasse: false, nuance: 0 });
  }
  PF.pave(0.86, 1.02, 1.08, 1.14, 1.3, 1.16, COUL.fer, M.planches, { crasse: false, nuance: 0 }); // la serrure
  PF.pave(0.97, 1.08, 1.16, 1.03, 1.18, 1.17, 0x101010, M.planches, { crasse: false, nuance: 0 }); // le trou de la serrure
  PF.poser(new THREE.TorusGeometry(0.09, 0.018, 4, 10), M.planches, COUL.fer, { x: 1.35, y: 1.55, z: 1.13 }, { crasse: false, nuance: 0 });
  const PO = k.b.couche("grande porte ouverte", { x: 1, z: 1.6, l: 3.6, p: 1.6 }, 0, 2.7);
  vantail(PO, 0.1, 1.33, 0, 0.88, 2.55, -1.75, COUL.boisGris);
  vantail(PO, 1.9, 1.33, PI, 0.88, 2.55, 1.6, COUL.boisGris);
  k.b.obstacle(0.1, 1.0, 1.9, 1.0, "grande porte (fermée à clé ; reste ouverte une fois déverrouillée)");
  // La porte de la roue, BOUCHÉE par l'éboulis du plancher de l'étage : on voit par-dessus, on ne passe pas
  c.boite(1.15, 0.07, 2.2, COUL.boisGris, { x: 6.2, y: 0.05, z: 2.6, ry: 0.15 }, M.planches, { nuance: 0.05 });
  gravats(c, 6.0, 0.9, 1.0, 16, [COUL.pierre, 0xb0a690, COUL.boisSombre], 0.05);
  for (const [a, b2] of [[[5.3, 0.2, 1.5], [6.8, 1.9, 0.5]], [[6.7, 0.15, 1.4], [5.4, 1.5, 0.4]], [[5.6, 0.1, 0.2], [6.5, 0.9, 1.6]]]) c.poutre(a, b2, 0.16, COUL.boisSombre, M.mat);
  for (let i = 0; i < 4; i++) c.boite(c.entre(0.8, 1.3), 0.05, 0.22, COUL.boisGris, { x: 6.0 + c.entre(-0.4, 0.4), y: 0.35 + i * 0.22, z: 0.95 + c.entre(-0.3, 0.3), ry: c.hasard() * 3, rz: c.entre(-0.5, 0.5) }, M.planches, { nuance: 0.06 });
  k.b.obstacle(5.4, 1.0, 6.6, 1.0, "porte bouchée (éboulis du plancher de l'étage)");

  // L'étage (inaccessible) et le pignon est
  const fenE = { ...fen, bas: 0.7, haut: 2.1, l: 0.9, type: "fenetre" };
  mur(T, [-4, 1], [8, 1], { y0: 3.6, h: 3.0, ep: 0.6, couleur: COUL.pierre, mat: M.pierre, ouvertures: [{ ...fenE, u: 2.5 }, { ...fenE, u: 6 }, { ...fenE, u: 9.5, volet: "ouvert" }] });
  mur(T, [8, 1], [8, -11], { y0: 3.6, h: 3.0, ep: 0.6, couleur: COUL.pierre, mat: M.pierre, ouvertures: [{ ...fenE, u: 6 }], breches: usure > 0.6 ? [{ u: 10.5, l: 2.2, profondeur: 1.0 * usure }] : [] });
  mur(T, [8, -11], [-4, -11], { y0: 3.6, h: 3.0, ep: 0.6, couleur: COUL.pierre, mat: M.pierre, ouvertures: [{ ...fenE, u: 4, volet: null }, { ...fenE, u: 9, volet: null }] });
  T.pave(-3.8, 3.5, -10.7, 7.7, 3.7, 0.7, COUL.boisSombre, M.mat, { crasse: false, nuance: 0 });
  pignon(T, [8, 1.3], [8, -11.3], 6.6, 4.05, 0.6, COUL.pierre, M.pierre);
  // L'oculus du pignon
  T.poser(geoCyl(0.5, 0.5, 0.1, 10), M.pierre, 0xddd2b8, { x: 8.32, y: 8.4, z: -5, rz: PI / 2 }, { crasse: false });
  T.poser(geoCyl(0.34, 0.34, 0.12, 10), M.mat, 0x2a2622, { x: 8.34, y: 8.4, z: -5, rz: PI / 2 }, { crasse: false });
  // Chaînes d'angle (pierres plus claires, en harpe)
  for (const [cx, cz, sz] of [[8, 1, 1], [8, -11, -1]]) {
    for (let i = 0; i < 12; i++) {
      const y1 = i * 0.55;
      const ch = y1 + 0.55 <= CUT ? c : T;
      if (i % 2 === 0) ch.pave(cx - 0.85, y1, cz - sz * 0.28, cx + 0.34, y1 + 0.52, cz + sz * 0.34, 0xd6cbb0, M.pierre, { nuance: 0.04 });
      else ch.pave(cx - 0.28, y1, cz - sz * 0.85, cx + 0.34, y1 + 0.52, cz + sz * 0.34, 0xd6cbb0, M.pierre, { nuance: 0.04 });
    }
  }
  // La génoise sous l'égout, sud et nord
  for (const [z1, z2] of [[0.95, 1.4], [-11.4, -10.95]]) {
    T.pave(-4, 6.42, z1, 8.4, 6.6, z2, COUL.tuile, M.tuiles, { crasse: false, nuance: 0.02 });
    T.pave(-4, 6.25, z1 + (z1 > 0 ? -0.05 : 0.15), 8.35, 6.42, z2 - (z1 > 0 ? 0.15 : -0.05), 0xd8ccb0, M.pierre, { crasse: false });
  }
  // Le toit de tuiles plates, percé avec le temps
  toit(T, 2, -5, 12, 12, 6.6, 4.0, { couleur: COUL.tuile, debord: 0.45, trous: usure > 0.35 ? [{ u: 1.5, v: 1, l: 2.6, p: 0.4 + usure * 0.35 }, { u: -3.5, v: -1, l: 1.4, p: 0.5 }] : [], moussu: 0.12 + usure * 0.2 });
  // Une descente d'eau au coin sud-est, cassée
  T.tube([8.45, 2.5, 1.45], [8.45, 6.5, 1.45], 0.06, PALETTE.zinc, M.mat, 6);
  T.tube([8.45, 2.5, 1.45], [8.8, 1.7, 1.9], 0.06, PALETTE.zinc, M.mat, 6);
  // Le graffiti des survivants, près de la roue
  panneau(T, M.enseignes, R.graffiti, { x: 8.32, y: 1.95, z: -0.85, ry: PI / 2 }, 3.0, 0.75);
  // Le lierre qui monte sur le pignon et la façade
  lierre(T, 8.31, 0.9, -8.5, PI / 2, 3, 4.5, Math.round(80 * usure));
  lierre(T, -2.6, 0.9, 1.31, 0, 2.2, 3.5, Math.round(50 * usure));
  lierre(c, 8.31, 0, -9.5, PI / 2, 2.5, 0.8, Math.round(25 * usure));
  // Une meule usée dressée contre la façade, mangée d'herbes
  c.poser(geoCyl(0.72, 0.72, 0.28, 14), M.pierre, 0xb5ad9c, { x: -2.8, y: 0.68, z: 1.52, rx: PI / 2 - 0.18 }, { nuance: 0.03 });
  touffes(c, [[-3.3, 1.9], [-2.2, 1.95], [-2.9, 2.1]], COUL.herbeSeche);
}

// ---------- La salle des meules ----------

function salleDesMeules(k) {
  const { c, b, usure } = k;
  const chene = 0x6a5038;
  // Le sol : grandes dalles, autour de la fosse du rouet
  for (const [x1, z1, x2, z2] of decouper([-3.75, -10.7, 7.7, 0.7], [FOSSE])) c.pave(x1, 0, z1, x2, 0.05, z2, 0xb7ad9b, M.pierre, { crasse: false, nuance: 0.01 });
  // La poussière de farine, en plaques claires
  for (let i = 0; i < 9; i++) plaque(c, c.entre(-3, 3.8), c.entre(-10, 0), c.entre(0.4, 1.1), COUL.farine, 0.056, M.mat);

  // --- Le beffroi : plancher de chêne sur gros poteaux ---
  const bx1 = -3.2;
  const bx2 = 3.4;
  const bz1 = -8.8;
  const bz2 = -4.2;
  const yb = 1.2;
  for (const x of [-3.05, 0.15, 3.25]) for (const z of [-8.65, -4.35]) c.pave(x - 0.15, 0, z - 0.15, x + 0.15, yb - 0.1, z + 0.15, chene, M.mat, { nuance: 0.04 });
  for (const z of [-8.65, -4.35]) c.pave(bx1, yb - 0.32, z - 0.17, bx2, yb - 0.08, z + 0.17, chene, M.mat, { nuance: 0.03 });
  c.pave(bx1, yb - 0.1, bz1, bx2, yb, bz2, 0x7a6048, M.planches, { nuance: 0.02 });
  // Sous le plancher : les gros fers et leurs petites lanternes
  for (const xm of [-1.4, 2.1]) {
    c.tube([xm, 0.05, -6.5], [xm, yb - 0.1, -6.5], 0.07, COUL.fer, M.tole, 6);
    lanterne(c, xm + 0.4, 0.35, -6.5, 0.22, 0.3);
  }
  b.obstacle(bx1, bz1, bx2, bz1, "beffroi");
  b.obstacle(bx1, bz2, bx2, bz2, "beffroi");
  b.obstacle(bx1, bz1, bx1, bz2, "beffroi");
  b.obstacle(bx2, bz1, bx2, bz2, "beffroi");
  // L'escalier de meunier qui monte au beffroi : condamné (il ferme le passage à l'est du beffroi)
  for (let i = 0; i < 4; i++) c.pave(bx2, 0.05 + i * 0.29, -5.7, bx2 + 0.7 - i * 0.17, 0.05 + (i + 1) * 0.29, -4.9, chene, M.planches, { nuance: 0.05 });
  c.boite(1.0, 0.06, 0.18, COUL.boisGris, { x: bx2 + 0.4, y: 0.75, z: -5.75, rz: 0.4 }, M.planches, { nuance: 0.05 });
  // Le beffroi coupe la salle en meules sud et meules nord : la vue et le son passent dessous, pas les corps
  b.obstacle(bx2, -5.7, 4.2, -5.7, "escalier du beffroi (condamné)");
  b.obstacle(bx2, -4.9, 4.2, -4.9, "escalier du beffroi (condamné)");
  b.obstacle(-3.78, -6.5, bx1, -6.5, "beffroi (claire-voie : la vue passe, pas les corps)");

  // --- Paire de l'ouest : sous son archure, trémie et anche ---
  const xa = -1.4;
  const za = -6.5;
  c.poser(geoCyl(0.86, 0.86, 0.55, 8), M.mat, 0x7c6248, { x: xa, y: yb + 0.275, z: za, ry: PI / 8 }, { nuance: 0.03 });
  c.poser(geoCyl(0.88, 0.88, 0.05, 8), M.mat, 0x5f4a36, { x: xa, y: yb + 0.56, z: za, ry: PI / 8 }, { crasse: false });
  // Le trémion (le support de la trémie), la trémie en pyramide renversée, l'auget, le babillard
  for (const [dx, dz] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]]) c.pave(xa + dx - 0.05, yb + 0.58, za + dz - 0.05, xa + dx + 0.05, yb + 1.25, za + dz + 0.05, chene, M.mat);
  c.pave(xa - 0.5, yb + 1.15, za - 0.5, xa + 0.5, yb + 1.25, za + 0.5, chene, M.mat, { crasse: false });
  c.poser(geoCyl(0.68, 0.14, 0.8, 4), M.planches, 0x8a6e52, { x: xa, y: yb + 1.55, z: za, ry: PI / 4 }, { crasse: false });
  c.boite(0.22, 0.07, 0.65, chene, { x: xa, y: yb + 0.95, z: za + 0.15, rx: -0.25 }, M.mat, { crasse: false });
  c.poutre([xa + 0.2, yb + 0.6, za + 0.2], [xa + 0.05, yb + 1.0, za + 0.4], 0.04, chene, M.mat);
  // L'anche, de l'archure jusqu'à la huche, au pied du beffroi
  c.poutre([xa, yb + 0.25, za + 0.8], [xa, 0.95, -3.85], 0.2, 0x7c6248, M.mat);
  c.pave(xa - 0.55, 0.05, -3.95, xa + 0.55, 0.8, -3.2, 0x8a6e52, M.planches, { nuance: 0.03 });
  c.pave(xa - 0.5, 0.75, -3.9, xa + 0.5, 0.8, -3.25, COUL.farineGrise, M.mat, { crasse: false });
  c.boite(1.15, 0.05, 0.75, 0x7a6048, { x: xa, y: 1.05, z: -3.7, rx: -0.9 }, M.planches, { crasse: false }); // couvercle levé
  b.obstacle(xa - 0.55, -3.95, xa + 0.55, -3.95, "huche");

  // --- Paire de l'est : archure démontée, la meule tournante pendue à sa potence ---
  const xb = 2.1;
  c.poser(geoCyl(0.72, 0.72, 0.3, 14), M.pierre, 0xc2baa8, { x: xb, y: yb + 0.15, z: za }, { nuance: 0.02 });
  c.poser(geoCyl(0.14, 0.14, 0.02, 8), M.mat, 0x2c2926, { x: xb, y: yb + 0.31, z: za }, { crasse: false });
  // Les rayons de rhabillage (sillons) sur la gisante
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * PI * 2;
    c.boite(0.5, 0.012, 0.04, 0x8f887a, { x: xb + Math.cos(a) * 0.42, y: yb + 0.305, z: za + Math.sin(a) * 0.42, ry: -a + 0.35 }, M.mat, { crasse: false });
  }
  // La potence : poteau, bras, vis, l'arceau de fer qui tient la tournante, inclinée
  c.pave(xb + 0.9, yb, -8.6, xb + 1.15, 3.45, -8.35, chene, M.mat);
  c.pave(xb - 0.05, 3.15, -8.55, xb + 0.2, 3.35, za + 0.05, chene, M.mat);
  c.poutre([xb + 1.0, 2.2, -8.4], [xb + 0.1, 3.15, -7.6], 0.1, chene, M.mat);
  c.tube([xb, 3.15, za], [xb, 2.45, za], 0.04, COUL.fer, M.tole, 6);
  c.repere({ x: xb, y: 2.1, z: za, rx: 0.32 }, () => {
    c.poser(geoCyl(0.68, 0.68, 0.28, 14), M.pierre, 0xbdb5a2, {}, { nuance: 0.02 });
    for (const s of [-1, 1]) c.pave(s * 0.72 - 0.04, -0.1, -0.04, s * 0.72 + 0.04, 0.4, 0.04, COUL.rouille, M.tole, { crasse: false });
    c.pave(-0.76, 0.36, -0.04, 0.76, 0.42, 0.04, COUL.rouille, M.tole, { crasse: false });
  });
  // L'archure démontée, en douves, posée contre la façade sud ; un sac sous l'anche
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * PI * 2;
    c.boite(0.62, 0.55, 0.06, 0x7c6248, { x: 3.3 + Math.cos(a) * 0.7, y: 0.3, z: -0.1 + Math.sin(a) * 0.5, ry: -a + PI / 2, rx: 0.1 }, M.mat, { nuance: 0.05 });
  }
  c.poutre([xb, yb + 0.1, za + 0.75], [xb, 0.9, -3.85], 0.18, 0x7c6248, M.mat);
  sac(c, xb, 0.05, -3.55, 0, false);
  // Les marteaux à rhabiller sur un billot
  c.pave(3.5, 0.05, -2.7, 3.95, 0.6, -2.25, chene, M.mat);
  for (let i = 0; i < 2; i++) {
    c.boite(0.08, 0.06, 0.45, chene, { x: 3.62 + i * 0.2, y: 0.64, z: -2.45, ry: 0.3 * i }, M.mat, { crasse: false });
    c.boite(0.22, 0.07, 0.06, 0x6a6560, { x: 3.62 + i * 0.2, y: 0.66, z: -2.25, ry: 0.3 * i }, M.metal, { crasse: false });
  }

  // La meule de rechange, dressée contre le mur nord
  c.poser(geoCyl(0.7, 0.7, 0.28, 14), M.pierre, 0xc9c1ae, { x: -2.2, y: 0.69, z: -10.42, rx: PI / 2 + 0.12 }, { nuance: 0.02 });
  b.obstacle(-2.95, -10.2, -1.45, -10.2, "meule");
  // L'échelle de meunier vers l'étage, tombée le long du mur nord (barreaux cassés) : l'étage est inaccessible
  for (const z of [-10.6, -10.1]) c.poutre([-1.15, 0.07, z], [0.95, 0.12, z + 0.02], 0.08, chene, M.mat);
  for (let i = 0; i < 7; i++) {
    if (i > 3 && c.hasard() < 0.4 + usure * 0.3) continue;
    c.boite(0.08, 0.06, 0.5, chene, { x: -0.95 + i * 0.3, y: 0.1, z: -10.35 }, M.mat);
  }

  // --- Les meules nord : l'établi du rhabilleur contre le mur nord, son ÉTAU (monté de l'atelier) ---
  c.pave(1.2, 0.82, -10.68, 3.0, 0.95, -10.12, chene, M.planches);
  for (const x of [1.3, 2.9]) for (const z of [-10.6, -10.2]) c.pave(x - 0.06, 0.05, z - 0.06, x + 0.06, 0.82, z + 0.06, 0x5a4230, M.mat);
  c.pave(1.25, 0.3, -10.62, 2.95, 0.35, -10.18, chene, M.planches);
  // L'étau : un objet à part (« étau »), que le jeu efface quand on le prend
  objetNomme(k, "étau", 77, (e) => {
    e.pave(2.45, 0.95, -10.35, 2.85, 1.05, -10.12, COUL.fer, M.tole); // la semelle
    e.pave(2.5, 1.05, -10.3, 2.62, 1.3, -10.12, COUL.fer, M.tole); // le mors fixe
    e.pave(2.68, 1.05, -10.3, 2.8, 1.3, -10.12, COUL.fer, M.tole); // le mors mobile
    e.tube([2.65, 1.2, -10.05], [2.65, 1.2, -9.75], 0.025, COUL.fer, M.tole, 5); // la vis
    e.tube([2.5, 1.2, -9.75], [2.8, 1.2, -9.75], 0.018, COUL.fer, M.tole, 4); // la barre
  });
  // Les marteaux et les pics à rhabiller, la règle à rhabiller, la pierre à aiguiser
  for (let i = 0; i < 3; i++) {
    c.boite(0.06, 0.05, 0.4, chene, { x: 1.45 + i * 0.22, y: 0.98, z: -10.4, ry: 0.2 * i }, M.mat, { crasse: false });
    c.boite(0.2, 0.06, 0.06, 0x6a6560, { x: 1.45 + i * 0.22, y: 1.0, z: -10.22, ry: 0.2 * i }, M.metal, { crasse: false });
  }
  c.boite(0.9, 0.03, 0.08, 0x8a6e52, { x: 2.0, y: 0.97, z: -10.55 }, M.mat, { crasse: false });
  c.boite(0.22, 0.08, 0.1, 0x9a948a, { x: 2.3, y: 0.99, z: -10.5, ry: 0.4 }, M.pierre, { crasse: false });
  b.obstacle(1.2, -10.12, 3.0, -10.12, "établi du rhabilleur");
  // Sacs et diable
  for (const [x, z, ry] of [[-3.3, -2.4, 0.2], [-3.2, -1.4, -0.1], [-2.6, -1.9, 1.4]]) sac(c, x, 0.05, z, ry, c.hasard() < 0.4);
  diable(c, -0.2, -1.2, 0.6);
  // La poutre maîtresse, l'arbre de transmission sous le plafond : poulies et courroie qui pend
  c.pave(-3.7, 3.25, -3.25, 4.15, 3.5, -2.75, chene, M.mat);
  c.tube([-3.7, 3.05, -3.0], [5.62, 3.05, -3.0], 0.07, COUL.fer, M.tole, 6);
  for (const xp of [-1.4, 2.1]) c.poser(geoCyl(0.36, 0.36, 0.22, 10), M.mat, 0x6a5038, { x: xp, y: 3.05, z: -3.0, rz: PI / 2 }, { crasse: false });
  c.boite(0.16, 2.0, 0.02, 0x3a2e24, { x: -1.4, y: 1.95, z: -2.63, rz: 0.12 }, M.mat, { crasse: false });
  c.boite(0.16, 0.9, 0.02, 0x3a2e24, { x: -1.25, y: 0.5, z: -2.5, rz: 0.9, rx: 0.3 }, M.mat, { crasse: false });
  c.boite(0.16, 0.012, 1.4, 0x3a2e24, { x: -1.0, y: 0.06, z: -1.9, ry: 0.3 }, M.mat, { crasse: false });
  // La lanterne accrochée à l'arbre (allumée la nuit)
  c.tube([0.6, 3.0, -3.0], [0.6, 2.6, -3.0], 0.01, COUL.fer, M.tole, 3);
  c.pave(0.48, 2.12, -3.12, 0.72, 2.16, -2.88, COUL.fer, M.tole, { crasse: false });
  c.pave(0.48, 2.54, -3.12, 0.72, 2.6, -2.88, COUL.fer, M.tole, { crasse: false });
  for (const [dx, dz] of [[-0.11, -0.11], [0.11, -0.11], [-0.11, 0.11], [0.11, 0.11]]) c.pave(0.6 + dx - 0.012, 2.15, -3 + dz - 0.012, 0.6 + dx + 0.012, 2.56, -3 + dz + 0.012, COUL.fer, M.tole, { crasse: false });
  for (const ry of [0, PI / 2]) panneau(c, M.lumineux, R.lanterne, { x: 0.6, y: 2.35, z: -3.0, ry }, 0.2, 0.3);
  // Le soleil par la fenêtre sud, la poussière qui danse
  raiDeLumiere(c, [-2.5, 2.0, 1.0], [-1.6, 0.06, -1.4], 1.0);
  if (usure > 0.35) raiDeLumiere(c, [3.5, 3.6, -6.5], [3.0, 1.25, -6.3], 1.6);
  debris(c, -3.6, -10.5, 4, 0.5, Math.round(40 * usure), [COUL.farine, COUL.pierre, 0xd9d2c0], 0.05);
  jonchee(c, -3.6, -2.5, 4, 0.6, Math.round(30 * usure), undefined, 0.06);
}

/** Une lanterne d'engrenage (deux plateaux et des fuseaux), axe vertical. */
function lanterne(ch, x, y, z, r = 0.34, h = 0.5) {
  for (const yy of [y, y + h]) ch.poser(geoCyl(r + 0.08, r + 0.08, 0.07, 10), M.mat, COUL.boisSombre, { x, y: yy, z }, { crasse: false });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * PI * 2;
    ch.tube([x + Math.cos(a) * r, y, z + Math.sin(a) * r], [x + Math.cos(a) * r, y + h, z + Math.sin(a) * r], 0.032, 0x8a6e52, M.mat, 4);
  }
}

/** Un sac de jute (ou de farine pétrifiée), couché. */
function sac(ch, x, y, z, ry, petrifie, debout = false) {
  const coul = petrifie ? COUL.farineGrise : COUL.jute;
  if (debout) {
    ch.boite(0.48, 0.8, 0.36, coul, { x, y: y + 0.4, z, ry, rz: ch.entre(-0.08, 0.08) }, M.mat, { nuance: 0.06 });
    ch.boite(0.2, 0.14, 0.18, coul, { x, y: y + 0.86, z, ry }, M.mat, { nuance: 0.06 });
  } else {
    ch.boite(0.55, 0.3, 0.85, coul, { x, y: y + 0.15, z, ry, rz: ch.entre(-0.08, 0.08) }, M.mat, { nuance: 0.06 });
  }
}

/** Le diable à sacs (deux roues, deux brancards). */
function diable(ch, x, z, ry) {
  ch.repere({ x, y: 0, z, ry }, () => {
    for (const s of [-1, 1]) {
      ch.poutre([s * 0.22, 0.2, 0], [s * 0.22, 1.2, -0.55], 0.05, COUL.boisSombre, M.mat);
      ch.poser(geoCyl(0.2, 0.2, 0.06, 8), M.tole, COUL.fer, { x: s * 0.3, y: 0.2, z: 0.02, rz: PI / 2 }, { crasse: false });
    }
    ch.boite(0.5, 0.04, 0.3, COUL.fer, { y: 0.05, z: 0.15 }, M.tole);
  });
}

// ---------- La salle de la roue ----------

function salleDeLaRoue(k) {
  const { c, T, Ro, b, usure } = k;
  // La cloison de planches entre les deux salles (coupée)
  murBandes(k, T, [4.2, 0.7], [4.2, -10.7], { h: 3.6, cut: CUTI, ep: 0.12, bandes: [{ y1: 0, y2: 3.6, mat: M.planches, couleur: COUL.boisGris }], ouvertures: [{ u: 2.4, l: 1.5, bas: 0, haut: 2.3, type: "vide" }, { u: 10.4, l: 1.4, bas: 0, haut: 2.2, type: "vide" }] });
  for (const z of [0.6, -1.7 + 0.8, -1.7 - 0.8, -5.5, -8.9, -10.6]) c.pave(4.1, 0, z - 0.1, 4.3, CUTI + 0.15, z + 0.1, COUL.boisSombre, M.mat);
  // La fosse du rouet : parois sombres, eau croupie au fond, garde-corps
  const [fx1, fz1, fx2, fz2] = FOSSE;
  c.pave(fx1, -0.95, fz1, fx2, -0.85, fz2, 0x2e2a24, M.mat, { crasse: false });
  c.pave(fx1, -0.95, fz1, fx1 + 0.08, 0.04, fz2, 0x5a544a, M.pierre);
  c.pave(fx2 - 0.08, -0.95, fz1, fx2, 0.04, fz2, 0x5a544a, M.pierre);
  c.pave(fx1, -0.95, fz1, fx2, 0.04, fz1 + 0.08, 0x5a544a, M.pierre);
  c.pave(fx1, -0.95, fz2 - 0.08, fx2, 0.04, fz2, 0x5a544a, M.pierre);
  flaque(c, (fx1 + fx2) / 2, (fz1 + fz2) / 2, 0.45, -0.84);
  for (const [x, z] of [[fx1 - 0.1, fz1 - 0.1], [fx1 - 0.1, fz2 + 0.1], [fx2 + 0.1, fz1 - 0.1], [fx2 + 0.1, fz2 + 0.1]]) c.pave(x - 0.05, 0, z - 0.05, x + 0.05, 1.0, z + 0.05, COUL.boisGris, M.mat);
  // La lisse ouest est brisée sur 1 m (z −3,5 → −2,5) : un bout pend dans la fosse, l'autre est tombé au fond
  c.pave(fx1 - 0.14, 0.95, fz1 - 0.12, fx1 - 0.06, 1.02, -3.5, COUL.boisGris, M.mat);
  c.pave(fx1 - 0.14, 0.95, -2.5, fx1 - 0.06, 1.02, fz2 + 0.12, COUL.boisGris, M.mat);
  for (const z of [-3.5, -2.5]) c.pave(fx1 - 0.15, 0, z - 0.05, fx1 - 0.05, 1.0, z + 0.05, COUL.boisGris, M.mat);
  c.boite(0.07, 0.07, 0.55, COUL.boisGris, { x: fx1 + 0.05, y: 0.75, z: -3.25, rx: 0.9 }, M.mat);
  c.boite(0.07, 0.07, 0.5, COUL.boisGris, { x: fx1 + 0.35, y: -0.8, z: -2.9, ry: 0.6 }, M.mat);
  c.pave(fx1 - 0.14, 0.95, fz2 + 0.06, fx2 + 0.14, 1.02, fz2 + 0.14, COUL.boisGris, M.mat);
  c.pave(fx1 - 0.14, 0.95, fz1 - 0.14, fx2 + 0.14, 1.02, fz1 - 0.06, COUL.boisGris, M.mat);
  b.obstacle(fx1 - 0.1, fz1 - 0.1, fx1 - 0.1, -3.5, "fosse du rouet");
  b.obstacle(fx1 - 0.1, -3.5, fx1 - 0.1, -2.5, "fosse du rouet : garde-corps brisé (on y repousse un Éteint)");
  b.obstacle(fx1 - 0.1, -2.5, fx1 - 0.1, fz2 + 0.1, "fosse du rouet");
  b.obstacle(fx1 - 0.1, fz2 + 0.1, fx2 + 0.1, fz2 + 0.1, "fosse du rouet");
  b.obstacle(fx1 - 0.1, fz1 - 0.1, fx2 + 0.1, fz1 - 0.1, "fosse du rouet");
  // Côté est (vers le palier de l'arbre) : une lisse, coupée au passage de l'arbre, et l'obstacle
  c.pave(fx2 + 0.06, 0.95, fz1 - 0.12, fx2 + 0.14, 1.02, ROUE.z - 0.3, COUL.boisGris, M.mat);
  c.pave(fx2 + 0.06, 0.95, ROUE.z + 0.3, fx2 + 0.14, 1.02, fz2 + 0.12, COUL.boisGris, M.mat);
  b.obstacle(fx2 + 0.1, fz1 - 0.1, fx2 + 0.1, fz2 + 0.1, "fosse du rouet");
  // Le rouet : l'engrenage maître, jante de chêne, bras en croix, alluchons sur sa face ouest (quelques-uns manquent)
  const { y, z } = ROUE;
  const xr = 6.4;
  const r = 1.6;
  const n = 14;
  // (dans la couche « roue » : il s'efface quand il cache le personnage dans le couloir du rouet)
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * PI * 2;
    Ro.repere({ x: xr, y, z, rx: a }, () => Ro.boite(0.26, 0.3, 2 * r * Math.sin(PI / n) + 0.04, 0x765a40, { y: r - 0.15 }, M.mat, { nuance: 0.05, crasse: false }));
  }
  for (let i = 0; i < 4; i++) Ro.repere({ x: xr, y, z, rx: (i * PI) / 4 }, () => Ro.boite(0.2, 2 * r - 0.25, 0.22, COUL.boisSombre, {}, M.mat, { crasse: false }));
  Ro.tube([xr - 0.3, y, z], [xr + 0.3, y, z], 0.32, COUL.boisSombre, M.mat, 8);
  for (let i = 0; i < 36; i++) {
    if (Ro.hasard() < 0.1 + usure * 0.12) continue;
    const a = (i / 36) * PI * 2;
    Ro.repere({ x: xr, y, z, rx: a }, () => Ro.boite(0.22, 0.12, 0.1, 0x9a7e5c, { x: -0.24, y: r - 0.14 }, M.mat, { crasse: false, nuance: 0.06 }));
  }
  // Des alluchons tombés au fond de la fosse et sur le sol
  for (let i = 0; i < 5; i++) c.boite(0.1, 0.1, 0.24, 0x9a7e5c, { x: c.entre(fx1 + 0.2, fx2 + 0.8), y: i < 3 ? -0.8 : 0.1, z: c.entre(fz1 + 0.3, fz2 - 0.3), ry: c.hasard() * 3, rx: c.hasard() }, M.mat, { crasse: false });
  // Le palier de l'arbre, contre le mur
  c.pave(7.0, 0, z - 0.35, 7.65, 0.78, z + 0.35, COUL.pierre, M.pierre);
  c.pave(7.05, 0.78, z - 0.25, 7.6, 0.86, z + 0.25, COUL.boisSombre, M.mat);
  // Le palier est un bloc : ses quatre côtés
  b.obstacle(7.0, z - 0.35, 7.0, z + 0.35, "palier de l'arbre");
  b.obstacle(7.0, z - 0.35, 7.7, z - 0.35, "palier de l'arbre");
  b.obstacle(7.0, z + 0.35, 7.7, z + 0.35, "palier de l'arbre");
  // La lanterne et le gros fer (arbre vertical), la couronne sous le plafond
  const xl = 5.62;
  // (dans la couche « roue », comme le rouet)
  Ro.tube([xl, 0.05, z], [xl, 3.55, z], 0.11, COUL.boisSombre, M.mat, 6);
  Ro.poser(geoCyl(0.2, 0.2, 0.08, 6), M.tole, COUL.fer, { x: xl, y: 0.06, z }, { crasse: false });
  lanterne(Ro, xl, 2.2, z, 0.34, 0.5);
  Ro.poser(geoCyl(0.85, 0.85, 0.14, 12), M.mat, 0x765a40, { x: xl, y: 3.0, z }, { crasse: false });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * PI * 2;
    Ro.boite(0.08, 0.16, 0.12, 0x9a7e5c, { x: xl + Math.cos(a) * 0.75, y: 3.15, z: z + Math.sin(a) * 0.75, ry: -a }, M.mat, { crasse: false });
  }
  // Le levier de la vanne, des chaînes, un seau
  c.poutre([7.4, 0.05, -8.8], [7.5, 2.4, -8.6], 0.1, COUL.boisGris, M.mat);
  for (let i = 0; i < 6; i++) c.boite(0.06, 0.03, 0.14, COUL.fer, { x: 6.2 + i * 0.12, y: 0.07, z: -9.6 + Math.sin(i) * 0.1, ry: i }, M.tole, { crasse: false });
  cylindre(c, M.tole, COUL.rouille, 7.25, 0.05, -9.5, 0.18, 0.32, 8);
  // Les poutres de chêne de rechange du rouet, calées contre le mur nord (2 bûches garanties)
  for (let i = 0; i < 5; i++) {
    const r = Math.floor(i / 3);
    c.pave(4.55 + (i % 2) * 0.15, 0.05 + r * 0.24, -10.62 + (i % 3) * 0.17 + r * 0.08, 7.35 - (i % 2) * 0.2, 0.28 + r * 0.24, -10.45 + (i % 3) * 0.17 + r * 0.08, i % 2 ? 0x8a6a4a : 0x7a5c40, M.planches, { nuance: 0.06 });
  }
  c.poutre([7.4, 0.05, -10.3], [7.55, 1.9, -10.6], 0.2, 0x7a5c40, M.mat); // une poutre dressée dans l'angle
  b.obstacle(4.5, -10.08, 7.45, -10.08, "poutres de rechange");
  // L'eau entrée par le trou de l'arbre : flaque et mousse au pied du mur
  flaque(c, 7.2, -2.0, 0.8, 0.06);
  raiDeLumiere(c, [8.0, 1.0, -3.0], [6.0, 0.1, -2.6], 0.5);
  if (usure > 0.6) raiDeLumiere(c, [7.0, 3.6, -9.0], [6.4, 0.06, -8.4], 1.3);
  debris(c, 4.4, -10.5, 7.6, 0.5, Math.round(26 * usure), undefined, 0.05);
  gravats(c, 7.1, -7.6, 0.7, Math.round(4 + 8 * usure), [COUL.pierre, 0xb0a690], 0.05);
}

// ---------- La minoterie de brique : murs, étages, pignons, monte-sacs, enseignes ----------

const FEN_N = () => ({ croisillons: 1, traverses: 3, cadre: COUL.menuiserie, appui: true, couleurAppui: COUL.bandeau });

function minoterie(k) {
  const { c, T, usure } = k;
  const ep = 0.45;
  const fen = { ...FEN_N(), bris: k.bris, verre: M.verre, type: "fenetre" };
  const bandes = (h) => [{ y1: 0, y2: 0.9, mat: M.pierre, couleur: COUL.pierreGrise }, { y1: 0.9, y2: h, mat: M.brique, couleur: COUL.brique }];
  const RDC = 4.0;
  // Rez-de-chaussée : soubassement de pierre, brique au-dessus
  murBandes(k, T, [-18, 3], [-4, 3], {
    h: RDC, ep, bandes: bandes(RDC),
    ouvertures: [
      { u: 3.5, l: 4.0, bas: 0.5, haut: 3.2, type: "vide" },
      { u: 8.4, l: 1.6, bas: 0, haut: 2.7, type: "vide" },
      { u: 12, l: 1.2, bas: 1.0, haut: 3.0, ...fen },
    ],
  });
  murBandes(k, T, [-4, 3], [-4, -13], { h: RDC, ep, bandes: bandes(RDC), ouvertures: [{ u: 1, l: 0.8, bas: 1.2, haut: 2.8, ...fen }, { u: 12.75, l: 1.2, bas: 0, haut: 2.4, type: "vide" }] });
  murBandes(k, T, [-4, -13], [-18, -13], { h: RDC, cut: RDC, ep, bandes: bandes(RDC), ouvertures: [{ u: 7, l: 1.2, bas: 1.2, haut: 3.0, ...fen }, { u: 11.5, l: 1.3, bas: 0, haut: 2.5, type: "vide" }] });
  murBandes(k, T, [-18, -13], [-18, 3], { h: RDC, cut: RDC, ep, bandes: bandes(RDC), ouvertures: [{ u: 3.5, l: 1.2, bas: 1.0, haut: 3.0, ...fen }, { u: 8, l: 1.2, bas: 1.0, haut: 3.0, ...fen }, { u: 13, l: 1.2, bas: 1.0, haut: 3.0, ...fen }] });
  // La cloison entre la boutique et le magasin
  murBandes(k, T, [-18, -3], [-4, -3], { h: RDC, cut: CUTI, ep: 0.3, bandes: [{ y1: 0, y2: RDC, mat: M.brique, couleur: 0xb8866a }], ouvertures: [{ u: 7, l: 1.6, bas: 0, haut: 2.5, type: "vide" }] });
  // La porte entre la boutique et le magasin est CONDAMNÉE : planches clouées en travers, des deux côtés
  for (let i = 0; i < 5; i++) {
    const x = -11.75 + i * 0.32;
    c.pave(x, 0.03, -3.08, x + 0.3, CUTI, -2.92, i % 2 ? COUL.boisGris : 0x9a8e7a, M.planches, { nuance: 0.06 });
    T.pave(x, CUTI, -3.08, x + 0.3, 2.5, -2.92, i % 2 ? COUL.boisGris : 0x9a8e7a, M.planches, { nuance: 0.06 });
  }
  for (const [y, rz] of [[0.6, 0.35], [1.75, -0.35]]) for (const z of [-3.12, -2.88]) (y < CUTI ? c : T).boite(1.9, 0.14, 0.04, COUL.boisSombre, { x: -11, y, z, rz }, M.planches, { nuance: 0.05 });
  k.b.obstacle(-11.8, -3, -10.2, -3, "porte condamnée (boutique – magasin)");
  // Couronnement du soubassement
  for (const [a, b, ch] of [[[-18, 3], [-4, 3], c], [[-4, 3], [-4, -13], c], [[-4, -13], [-18, -13], c], [[-18, -13], [-18, 3], c]]) bande(ch, a, b, ep, 0.82, 0.92, 0.05, COUL.bandeau, M.pierre, 0.05);
  // Le seuil de la porte de derrière, sa porte entrebâillée
  vantail(T, -14.85, -13.25, PI, 1.25, 2.45, -0.5, COUL.menuiserie);

  // Les trois étages (inaccessibles)
  for (let i = 0; i < 3; i++) {
    const y0 = RDC + i * 3.2;
    const haut = i === 2;
    const fe = (u, plus = {}) => ({ ...fen, u, l: 1.2, bas: 0.8, haut: 2.6, ...plus });
    mur(T, [-18, 3], [-4, 3], { y0, h: 3.2, ep, couleur: COUL.brique, mat: M.brique, ouvertures: [fe(2.5), { u: 7, l: 1.4, bas: 0.25, haut: 2.75, type: "vide" }, fe(11.5)] });
    mur(T, [-4, 3], [-4, -13], { y0, h: 3.2, ep, couleur: COUL.brique, mat: M.brique, ouvertures: [fe(1, { l: 0.8 })] });
    mur(T, [-4, -13], [-18, -13], { y0, h: 3.2, ep, couleur: COUL.brique, mat: M.brique, ouvertures: [fe(3.5), fe(7), fe(10.5)] });
    mur(T, [-18, -13], [-18, 3], { y0, h: 3.2, ep, couleur: COUL.brique, mat: M.brique, ouvertures: [fe(2.5), fe(6.3), fe(9.7), fe(13.5)], breches: haut && usure > 0.5 ? [{ u: 8, l: 3, profondeur: 1.4 * usure }] : [] });
    T.pave(-17.8, y0 - 0.1, -12.8, -4.2, y0 + 0.1, 2.8, COUL.boisSombre, M.mat, { crasse: false, nuance: 0 });
    // Les portes de chargement du pignon sud, l'une battante, l'autre de travers
    if (i === 0) vantail(T, -10.3, 3.25, PI, 1.35, 2.45, 1.9, COUL.menuiserie, M.planches, y0 + 0.27);
    if (i === 1) T.boite(1.35, 2.4, 0.06, COUL.menuiserie, { x: -11.2, y: y0 + 1.4, z: 3.35, rz: 0.12, rx: 0.12 }, M.planches, { nuance: 0.05 });
    // Linteaux en arc surbaissé (une brique plus claire)
    for (const u of [2.5, 7, 11.5]) T.pave(-18 + u - 0.8, y0 + 2.62, 3.15, -18 + u + 0.8, y0 + 2.92, 3.28, 0xc78a6c, M.brique, { nuance: 0.03, crasse: false });
  }
  T.pave(-17.8, 13.5, -12.8, -4.2, 13.7, 2.8, COUL.boisSombre, M.mat, { crasse: false, nuance: 0 });
  // Bandeaux de pierre aux planchers, corniche à l'égout, chaînes d'angle de brique sombre
  const faces = [[[-18, 3], [-4, 3]], [[-4, 3], [-4, -13]], [[-4, -13], [-18, -13]], [[-18, -13], [-18, 3]]];
  for (const [a, b] of faces) {
    for (const y of [RDC, RDC + 3.2, RDC + 6.4]) bande(T, a, b, ep, y - 0.12, y + 0.12, 0.06, COUL.bandeau, M.pierre, 0.06);
    bande(T, a, b, ep, 13.25, 13.45, 0.12, COUL.bandeau, M.pierre, 0.12);
    bande(T, a, b, ep, 13.45, 13.7, 0.26, COUL.bandeau, M.pierre, 0.26);
  }
  for (const [x, z] of [[-18, 3], [-4, 3], [-4, -13], [-18, -13]]) T.pave(x - 0.33, CUT, z - 0.33, x + 0.33, 13.25, z + 0.33, COUL.briqueSombre, M.brique, { nuance: 0.02, crasse: false });
  // Les pignons sud et nord, leurs rampants de pierre
  pignon(T, [-18, 3], [-4, 3], 13.7, 5.5, ep, COUL.brique, M.brique);
  pignon(T, [-4, -13], [-18, -13], 13.7, 5.5, ep, COUL.brique, M.brique);
  for (const z of [3.05, -13.05]) {
    for (const s of [-1, 1]) T.poutre([-11 + s * 7.25, 13.6, z], [-11, 19.35, z], 0.34, COUL.bandeau, M.pierre);
  }
  // L'oculus du pignon nord
  T.poser(geoCyl(0.55, 0.55, 0.1, 10), M.pierre, COUL.bandeau, { x: -11, y: 15.6, z: -13.26, rx: PI / 2 }, { crasse: false });
  T.poser(geoCyl(0.38, 0.38, 0.12, 10), M.mat, 0x2a2622, { x: -11, y: 15.6, z: -13.28, rx: PI / 2 }, { crasse: false });
  // Le toit d'ardoise (faîtage nord-sud)
  toit(T, -11, -5, 16, 14, 13.7, 5.5, { ry: PI / 2, couleur: COUL.ardoise, debord: 0.4, trous: usure > 0.4 ? [{ u: -3, v: -1, l: 3.6, p: 0.45 + 0.3 * usure }, { u: 4.2, v: 1, l: 1.8, p: 0.35 }] : [], moussu: 0.1 + usure * 0.15 });

  // --- Le monte-sacs : la porte haute du pignon, l'auvent, la potence, la poulie, la corde et son sac ---
  T.pave(-11.75, 14.0, 3.1, -10.25, 16.15, 3.32, 0xd8cdb4, M.pierre, { crasse: false });
  T.pave(-11.6, 14.08, 3.2, -10.4, 16.05, 3.35, 0x2a2622, M.mat, { crasse: false });
  vantail(T, -10.4, 3.35, PI, 1.15, 1.95, 1.4, COUL.menuiserie, M.planches, 14.08);
  toit(T, -11, 4.05, 2.1, 2.3, 16.55, 0.9, { ry: PI / 2, couleur: COUL.ardoise, debord: 0.1, moussu: 0.2 });
  for (const s of [-1, 1]) {
    T.poutre([-11 + s * 1.05, 16.55, 5.0], [-11 + s * 1.05, 16.55, 3.2], 0.12, COUL.boisSombre, M.mat);
    T.poutre([-11 + s * 1.05, 15.6, 3.25], [-11 + s * 1.05, 16.5, 4.6], 0.1, COUL.boisSombre, M.mat);
  }
  T.pave(-11.12, 16.18, 3.2, -10.88, 16.42, 4.95, COUL.boisSombre, M.mat);
  T.poser(geoCyl(0.24, 0.24, 0.12, 10), M.mat, COUL.fer, { x: -11, y: 16.0, z: 4.75, rz: PI / 2 }, { crasse: false });
  T.pave(-11.04, 15.9, 4.7, -10.96, 16.2, 4.8, COUL.fer, M.mat);
  T.boite(0.035, 16.0 - 6.2, 0.035, 0xb09a72, { x: -11, y: (16.0 + 6.2) / 2, z: 4.99 }, M.mat, { crasse: false });
  T.boite(0.035, 16.0 - 9.5, 0.035, 0xb09a72, { x: -11.1, y: (16.0 + 9.5) / 2, z: 4.51, rz: 0.01 }, M.mat, { crasse: false });
  T.boite(0.5, 0.82, 0.38, COUL.jute, { x: -11, y: 5.75, z: 4.99, rz: 0.08 }, M.mat, { nuance: 0.05 });
  T.boite(0.06, 0.2, 0.06, COUL.fer, { x: -11, y: 6.25, z: 4.99 }, M.mat);

  // --- L'enseigne peinte d'autrefois, au-dessus du toit du moulin (côté est) ---
  panneau(T, M.enseignes, R.minoterie, { x: -3.76, y: 11.65, z: -5, ry: PI / 2 }, 9.6, 1.2);
  // Descentes d'eau en zinc
  for (const [x, z] of [[-3.55, 3.4], [-18.45, 3.4]]) {
    T.tube([x, 1.0, z], [x, 13.4, z], 0.07, PALETTE.zinc, M.mat, 6);
    T.pave(x - 0.12, 13.3, z - 0.15, x + 0.12, 13.45, z + 0.12, PALETTE.zinc, M.mat);
  }
  // Un buddleia qui pousse dans la corniche, du lierre au pied de la façade ouest
  arbuste(T, -17.2, 3.4, 0.9, 13.75, [0x6f8f4a, 0x8a6f9a, 0x5d7a40]);
  lierre(T, -18.25, CUT, -6, -PI / 2, 5, 5, Math.round(90 * usure));
  lierre(c, -18.25, 0, -9, -PI / 2, 3, 0.85, Math.round(30 * usure));

  // --- La devanture de l'« Expérience Farine Authentique » (l'Abondance plaquée sur la brique) ---
  const alu = COUL.alu;
  T.pave(-17.6, 3.25, 3.2, -7.8, 3.95, 3.5, COUL.plastique, M.mat, { crasse: false, nuance: 0 });
  T.pave(-17.6, 3.2, 3.2, -7.8, 3.25, 3.52, PALETTE.abondanceRouge, M.mat, { crasse: false });
  panneau(T, M.enseignes, R.enseigne, { x: -12.7, y: 3.6, z: 3.52 }, 6.6, 0.82);
  // La vitrine : montants d'alu, un grand verre intact, l'autre tombé en éclats
  for (const x of [-16.5, -14.5, -12.5]) T.pave(x - 0.05, 0.5, 2.95, x + 0.05, 3.2, 3.08, alu, M.mat, { crasse: false });
  T.pave(-16.5, 3.12, 2.95, -12.5, 3.2, 3.08, alu, M.mat, { crasse: false });
  c.pave(-16.5, 0.45, 2.95, -12.5, 0.55, 3.08, alu, M.mat, { crasse: false });
  T.pave(-16.45, 0.55, 3.0, -14.55, 3.12, 3.02, 0xffffff, M.verre, { crasse: false, nuance: 0 });
  for (let i = 0; i < 2; i++) T.boite(c.entre(0.3, 0.7), c.entre(0.3, 0.6), 0.02, 0xffffff, { x: -13.5 + c.entre(-0.7, 0.7), y: 2.9 - i * 0.2, z: 3.01, rz: c.hasard() * 3 }, M.verre, { crasse: false });
  for (let i = 0; i < 16; i++) c.boite(c.entre(0.1, 0.35), 0.01, c.entre(0.1, 0.3), 0xbfd3d6, { x: c.entre(-14.4, -12.6), y: 0.04, z: c.entre(2.4, 4.6), ry: c.hasard() * 3 }, M.verre, { crasse: false, nuance: 0 });
  // La porte vitrée : son cadre, le vantail tombé sur le parvis
  for (const x of [-10.4, -8.8]) T.pave(x - 0.05, 0, 2.95, x + 0.05, 2.7, 3.1, alu, M.mat, { crasse: false });
  c.repere({ x: -9.2, y: 0.08, z: 4.3, ry: 0.35 }, () => {
    c.boite(1.4, 0.05, 2.4, alu, {}, M.mat, { crasse: false });
    c.boite(1.25, 0.06, 2.2, 0xffffff, { y: 0.02 }, M.verre, { crasse: false, nuance: 0 });
  });
  // Les jardinières de blé en plastique, le chevalet « OFFRE TERROIR »
  for (const x of [-17.4, -5.0]) {
    c.pave(x - 0.45, 0.03, 3.4, x + 0.45, 0.6, 3.9, 0x3e3f40, M.satin);
    for (let i = 0; i < 7; i++) c.poser(TIGE, M.satin, 0xc9a94e, { x: x + c.entre(-0.35, 0.35), y: 0.55, z: 3.65 + c.entre(-0.15, 0.15), rx: c.entre(-0.3, 0.3), rz: c.entre(-0.3, 0.3), e: [1.6, c.entre(0.7, 1.1), 1.6] }, { crasse: false, nuance: 0.05 });
  }
  c.repere({ x: -7.2, y: 0, z: 4.25, ry: -0.4 }, () => {
    for (const s of [-1, 1]) {
      c.boite(0.62, 0.95, 0.04, 0x5a4636, { y: 0.48, z: s * 0.17, rx: s * 0.22 }, M.mat);
      panneau(c, M.enseignes, R.offre, { y: 0.55, z: s * 0.2, rx: s * 0.22, ry: s > 0 ? 0 : PI }, 0.56, 0.28);
    }
  });
}

// ---------- Le magasin à grains et à farine ----------

function magasin(k) {
  const { c, b, usure } = k;
  c.pave(-17.78, 0, -12.78, -4.22, 0.05, -3.15, 0x9a8264, M.planches, { crasse: false, nuance: 0 });
  // Les piles de sacs, certains pétrifiés, d'autres crevés
  pileSacs(c, -16.9, -11.4, 0, 2, 2, 4, 0.35 + usure * 0.2); // reculée contre le mur ouest : la porte de derrière est libre
  pileSacs(c, -16.5, -7.4, 0, 2, 2, 3, 0.4);
  pileSacs(c, -13.6, -12.0, PI / 2, 2, 2, 2, 0.5);
  pileSacs(c, -5.6, -5.0, 0.1, 1, 2, 2, 0.6);
  b.obstacle(-17.6, -9.9, -16.2, -9.9, "sacs");
  b.obstacle(-16.2, -12.7, -16.2, -9.9, "sacs");
  b.obstacle(-15.6, -6.2, -15.6, -8.6, "sacs");
  // Sacs crevés : la farine répandue, durcie en croûte grise
  for (const [x, z] of [[-14.2, -9.4], [-9.6, -11.8], [-6.5, -7.2]]) {
    sac(c, x, 0.05, z, c.hasard() * 3, true);
    plaque(c, x + 0.4, z + 0.3, 0.9, COUL.farine, 0.058, M.mat);
    c.poser(BOULE, M.mat, COUL.farineGrise, { x: x + 0.3, y: 0.08, z: z + 0.2, e: [0.45, 0.12, 0.35], ry: c.hasard() * 3 }, { crasse: false });
  }
  // La bascule décimale : plateau, colonne, fléau, poids
  c.repere({ x: -8.5, y: 0.05, z: -9.2, ry: 0.2 }, () => {
    c.boite(1.0, 0.14, 0.8, 0x5a5650, { y: 0.07 }, M.tole);
    c.boite(1.0, 0.03, 0.8, 0x7a6048, { y: 0.15 }, M.planches);
    c.boite(0.16, 1.25, 0.16, 0x4a4744, { x: 0, y: 0.75, z: -0.42 }, M.tole);
    c.boite(0.9, 0.06, 0.06, 0x4a4744, { x: 0.25, y: 1.32, z: -0.42, rz: -0.06 }, M.tole);
    c.boite(0.1, 0.14, 0.1, 0x4a4744, { x: 0.62, y: 1.24, z: -0.42 }, M.metal);
    for (let i = 0; i < 4; i++) c.poser(geoCyl(0.07 - i * 0.012, 0.08 - i * 0.012, 0.09, 8), M.metal, 0x55524c, { x: -0.3 + i * 0.13, y: 0.2, z: 0.25 }, { crasse: false });
  });
  b.obstacle(-9.0, -9.6, -8.0, -9.6, "bascule");
  // Le blutoir : tambour hexagonal dans sa caisse ouverte, sur pieds ; sa courroie monte vers l'étage
  const xb1 = -16.8;
  const xb2 = -13.2;
  const zb = -4.6;
  for (const x of [xb1, xb2]) for (const z of [zb - 0.55, zb + 0.55]) c.pave(x - 0.07, 0.05, z - 0.07, x + 0.07, 1.85, z + 0.07, 0x6a5038, M.mat);
  for (const y of [0.55, 1.8]) for (const z of [zb - 0.55, zb + 0.55]) c.pave(xb1, y, z - 0.06, xb2, y + 0.1, z + 0.06, 0x6a5038, M.mat);
  c.poser(geoCyl(0.48, 0.48, 3.3, 6), M.mat, 0xd0c6b0, { x: (xb1 + xb2) / 2, y: 1.2, z: zb, rz: PI / 2 - 0.05 }, { nuance: 0.02 });
  c.poser(geoCyl(0.5, 0.5, 0.06, 6), M.mat, 0x6a5038, { x: xb1 + 0.2, y: 1.21, z: zb, rz: PI / 2 }, { crasse: false });
  c.poser(geoCyl(0.5, 0.5, 0.06, 6), M.mat, 0x6a5038, { x: xb2 - 0.2, y: 1.19, z: zb, rz: PI / 2 }, { crasse: false });
  c.poser(geoCyl(0.3, 0.3, 0.14, 10), M.mat, 0x5a4636, { x: xb2 + 0.15, y: 1.2, z: zb, rz: PI / 2 }, { crasse: false });
  c.boite(0.03, 4.0 - 1.4, 0.14, 0x3a2e24, { x: xb2 + 0.2, y: (4.0 + 1.4) / 2, z: zb - 0.28 }, M.mat, { crasse: false });
  c.pave(xb1 + 0.3, 0.05, zb - 0.4, xb1 + 1.3, 0.55, zb + 0.4, 0x7a6048, M.planches);
  b.obstacle(xb1 - 0.1, zb - 0.62, xb2 + 0.1, zb - 0.62, "blutoir");
  b.obstacle(xb1 - 0.1, zb + 0.62, xb2 + 0.1, zb + 0.62, "blutoir");
  // La goulotte qui descend des étages, sa huche
  c.poutre([-5.6, 4.0, -9.2], [-5.6, 1.05, -10.6], 0.32, 0x7a6048, M.mat);
  c.pave(-6.2, 0.05, -11.6, -5.0, 0.85, -10.4, 0x8a6e52, M.planches);
  c.pave(-6.15, 0.8, -11.55, -5.05, 0.84, -10.45, COUL.farineGrise, M.mat, { crasse: false });
  // Les barils à farine cerclés de fer (les feuillards), contre le mur nord
  for (const [x, z, ry] of [[-7.95, -12.2, 0.3], [-7.05, -12.3, 1.1], [-7.5, -11.5, 2.0]]) {
    c.poser(geoCyl(0.3, 0.3, 0.86, 10), M.planches, 0x8a6a4a, { x, y: 0.48, z, ry }, { nuance: 0.05 });
    c.poser(geoCyl(0.27, 0.27, 0.02, 10), M.mat, 0x6a5038, { x, y: 0.92, z, ry }, { crasse: false });
    for (const y of [0.18, 0.48, 0.78]) c.poser(geoCyl(0.315, 0.315, 0.05, 10), M.tole, COUL.rouille, { x, y: y + 0.05, z, ry }, { crasse: false });
  }
  c.poser(geoCyl(0.3, 0.3, 0.86, 10), M.planches, 0x7a5c40, { x: -8.7, y: 0.32, z: -11.3, rz: PI / 2, ry: 0.4 }, { nuance: 0.05 }); // un baril couché
  c.poser(new THREE.TorusGeometry(0.32, 0.025, 3, 12), M.tole, COUL.rouille, { x: -8.3, y: 0.03, z: -10.6, rx: PI / 2 }, { crasse: false }); // un feuillard tombé
  b.obstacle(-8.35, -11.15, -6.65, -11.15, "barils à farine cerclés");
  b.obstacle(-8.35, -12.75, -8.35, -11.15, "barils à farine cerclés");
  b.obstacle(-6.65, -12.75, -6.65, -11.15, "barils à farine cerclés");
  // La chaîne du monte-sacs qui pend de la trappe du plafond, son crochet, un sac au sol
  c.boite(0.04, 3.2, 0.04, COUL.fer, { x: -11, y: 2.4, z: -8.5 }, M.tole, { crasse: false });
  c.boite(0.12, 0.2, 0.04, COUL.fer, { x: -11, y: 0.72, z: -8.5 }, M.tole, { crasse: false });
  c.pave(-11.7, 3.95, -9.2, -10.3, 4.0, -7.8, 0x2a2622, M.mat, { crasse: false });
  sac(c, -10.7, 0.05, -8.1, 0.6, false, true);
  // Un balai, une pelle à grain, un tamis
  c.poutre([-4.6, 0.05, -12.3], [-4.45, 1.5, -12.6], 0.04, COUL.boisGris, M.mat);
  c.boite(0.3, 0.06, 0.4, 0x7a6048, { x: -9.0, y: 0.08, z: -5.2, ry: 0.4 }, M.mat);
  c.poser(geoCyl(0.32, 0.32, 0.1, 10), M.mat, 0x9a8264, { x: -12.4, y: 0.1, z: -11.2, rx: 0.2 }, { crasse: false });
  // Les rais de lumière par les fenêtres ouest, la poussière
  raiDeLumiere(c, [-17.8, 2.5, -9.5], [-15.6, 0.06, -9.0], 1.1);
  raiDeLumiere(c, [-17.8, 2.5, -5.0], [-15.2, 0.06, -4.2], 1.1);
  raiDeLumiere(c, [-11, 3.9, -12.8], [-10.8, 0.06, -11.0], 1.0);
  debris(c, -17.5, -12.5, -4.5, -3.5, Math.round(40 * usure), [COUL.farine, COUL.farineGrise, COUL.brique], 0.05);
  gravats(c, -17.2, -3.8, 0.8, Math.round(4 + 6 * usure), [COUL.brique, COUL.briqueSombre, COUL.farineGrise], 0.05);
}

/** Une pile de sacs (nx × nz, en rangs), les rangs du haut entamés. */
function pileSacs(ch, x, z, ry, nx, nz, rangs, petrifie) {
  ch.repere({ x, y: 0.05, z, ry }, () => {
    for (let r = 0; r < rangs; r++) {
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < nz; j++) {
          if (r > 0 && ch.hasard() < 0.08 + r * 0.1) continue;
          const coul = ch.hasard() < petrifie ? COUL.farineGrise : COUL.jute;
          ch.boite(0.56, 0.28, 0.86, coul, { x: (i - (nx - 1) / 2) * 0.62 + (r % 2 ? 0.1 : 0), y: 0.14 + r * 0.27, z: (j - (nz - 1) / 2) * 0.92, ry: ch.entre(-0.08, 0.08), rz: ch.entre(-0.05, 0.05) }, M.mat, { nuance: 0.05 });
        }
      }
    }
    // L'étiquette au pochoir sur le sac du dessus de la face sud
    panneau(ch, M.enseignes, R.sac, { x: 0, y: 0.15, z: ((nz - 1) / 2) * 0.92 + 0.44 }, 0.5, 0.25);
  });
}

// ---------- L'« Expérience Farine Authentique » ----------

function boutique(k) {
  const { c, b, usure } = k;
  // Le sol en vinyle « parquet ancien »
  c.pave(-17.78, 0, -2.85, -4.22, 0.06, 2.78, 0xb39066, M.planches, { crasse: false, nuance: 0 });
  // La gondole double, ses pains « artisanaux » sous plastique
  const gx1 = -16.4;
  const gx2 = -12.6;
  const gz = -0.4;
  c.pave(gx1, 0.06, gz - 0.42, gx2, 0.2, gz + 0.42, 0x6a5038, M.satin);
  c.pave(gx1, 0.2, gz - 0.04, gx2, 1.65, gz + 0.04, 0x8a6a4a, M.satin);
  for (const s of [-1, 1]) {
    for (let r = 0; r < 3; r++) {
      const y = 0.45 + r * 0.45;
      c.pave(gx1, y - 0.03, gz + s * 0.04, gx2, y, gz + s * 0.42, 0x8a6a4a, M.satin, { crasse: false });
      for (let i = 0; i < 9; i++) {
        if (c.hasard() < 0.25 + usure * 0.35) continue;
        const x = gx1 + 0.25 + i * 0.4;
        c.boite(0.32, 0.12, 0.2, COUL.plastique, { x, y: y + 0.06, z: gz + s * 0.24, ry: c.entre(-0.15, 0.15) }, M.satin, { nuance: 0.04, crasse: false });
        if (i % 3 === 0) panneau(c, M.enseignes, R.etiquette, { x, y: y + 0.07, z: gz + s * 0.345, ry: s > 0 ? 0 : PI }, 0.14, 0.1);
      }
    }
  }
  b.obstacle(gx1, gz, gx2, gz, "gondole");
  // Les pains tombés, piétinés ; des paniers à provisions
  for (let i = 0; i < 12; i++) c.boite(0.32, 0.11, 0.2, COUL.plastique, { x: c.entre(-17, -11), y: 0.12, z: c.entre(-2.4, 2.2), ry: c.hasard() * 3, rz: c.entre(-0.3, 0.3) }, M.satin, { crasse: false });
  for (const [x, z] of [[-11.8, 1.6], [-15.2, -2.1]]) c.boite(0.45, 0.25, 0.32, PALETTE.abondanceRouge, { x, y: 0.19, z, ry: c.hasard() * 3, rz: 0.4 }, M.satin, { crasse: false });
  // Le comptoir « à l'ancienne » (bardage imitation bois), le terminal de paiement mort
  c.pave(-7.6, 0.06, 0.4, -5.0, 1.0, 1.05, 0x9a7a52, M.planches, { nuance: 0.02 });
  c.pave(-7.7, 1.0, 0.3, -4.9, 1.06, 1.12, 0x3a3836, M.satin, { crasse: false });
  c.boite(0.18, 0.06, 0.26, 0x2a2a2c, { x: -6.2, y: 1.1, z: 0.7, rx: -0.4 }, M.satin, { crasse: false });
  c.boite(0.6, 0.3, 0.4, 0x8a6a4a, { x: -5.6, y: 1.21, z: 0.7 }, M.mat);
  b.obstacle(-7.6, 0.4, -5.0, 0.4, "comptoir");
  // Le robot meunier : bras industriel sur socle, pince serrée sur un petit sac, affaissé ; son chapeau de feutre au sol
  c.repere({ x: -6.3, y: 0.06, z: -1.75, ry: -0.6 }, () => {
    c.poser(geoCyl(0.32, 0.4, 0.5, 10), M.metal, 0xd8d6d0, { y: 0.25 }, { crasse: false });
    c.poser(geoCyl(0.22, 0.22, 0.25, 10), M.metal, PALETTE.abondanceOcre, { y: 0.62 }, { crasse: false });
    c.poutre([0, 0.7, 0], [0.35, 1.55, 0.1], 0.2, 0xd8d6d0, M.metal);
    c.poser(BOULE, M.metal, PALETTE.abondanceOcre, { x: 0.35, y: 1.55, z: 0.1, e: 0.15 }, { crasse: false });
    c.poutre([0.35, 1.55, 0.1], [0.95, 0.75, 0.35], 0.15, 0xd8d6d0, M.metal);
    c.boite(0.12, 0.18, 0.2, 0x4a4744, { x: 1.0, y: 0.65, z: 0.38, rz: 0.4 }, M.metal);
    c.boite(0.25, 0.3, 0.18, COUL.jute, { x: 1.05, y: 0.42, z: 0.4, rz: 0.2 }, M.mat);
  });
  c.poser(geoCyl(0.28, 0.28, 0.03, 10), M.mat, 0x3a3230, { x: -5.4, y: 0.08, z: -2.2, rx: 0.2 }, { crasse: false });
  c.poser(geoCyl(0.15, 0.17, 0.16, 10), M.mat, 0x3a3230, { x: -5.4, y: 0.17, z: -2.2, rx: 0.2 }, { crasse: false });
  // Une fausse meule en polystyrène, écornée, pour le décor
  c.poser(geoCyl(0.6, 0.6, 0.25, 12), M.satin, 0xd9d4c8, { x: -8.3, y: 0.2, z: -2.2, rx: 0.15 }, { crasse: false });
  // La borne « Pétrissez virtuellement ! » (son écran luit encore, sur batterie), l'autocollant Watty
  c.repere({ x: -14.0, y: 0.06, z: 1.9, ry: 0.55 }, () => {
    c.boite(0.5, 1.05, 0.36, 0xeeeae2, { y: 0.52 }, M.satin);
    c.boite(0.62, 0.5, 0.1, 0x2a2a2c, { y: 1.28, z: 0.06, rx: -0.35 }, M.satin, { crasse: false });
    panneau(c, M.lumineux, R.borne, { y: 1.28, z: 0.115, rx: -0.35 }, 0.52, 0.42);
    panneau(c, M.enseignes, R.watty, { x: 0.255, y: 0.6, ry: PI / 2 }, 0.26, 0.26);
  });
  // Le carton de « Maître Farinier », souriant, un peu plié
  c.repere({ x: -16.9, y: 0.06, z: 2.1, ry: 0.5 }, () => {
    panneau(c, M.enseignes, R.meunier, { y: 0.95, rx: -0.08 }, 1.2, 1.8);
    c.boite(0.04, 0.9, 0.04, 0x9a8a6a, { y: 0.45, z: -0.25, rx: 0.5 }, M.mat);
  });
  // Le panneau « Farine moulue à l'ancienne par des robots », sur le mur ouest
  panneau(c, M.enseignes, R.robots, { x: -17.76, y: 2.3, z: -1.0, ry: PI / 2 }, 2.6, 1.3);
  // Le tonneau de blé en plastique, près de la porte
  cylindre(c, M.mat, 0x7a5a3c, -10.9, 0.06, 2.3, 0.3, 0.55, 10);
  for (let i = 0; i < 9; i++) c.poser(TIGE, M.satin, 0xc9a94e, { x: -10.9 + c.entre(-0.2, 0.2), y: 0.6, z: 2.3 + c.entre(-0.2, 0.2), rx: c.entre(-0.3, 0.3), rz: c.entre(-0.3, 0.3), e: [1.5, c.entre(0.7, 1.0), 1.5] }, { crasse: false, nuance: 0.05 });
  // Les étagères contre la cloison : sachets de « farine authentique »
  c.pave(-9.2, 0.06, -2.85, -5.2, 1.8, -2.55, 0x8a6a4a, M.satin);
  for (let r = 0; r < 3; r++) {
    for (let i = 0; i < 8; i++) {
      if (c.hasard() < 0.3 + usure * 0.3) continue;
      c.boite(0.2, 0.3, 0.12, i % 3 ? COUL.plastique : 0xd9c9a0, { x: -9.0 + i * 0.5, y: 0.45 + r * 0.5, z: -2.45, ry: c.entre(-0.2, 0.2) }, M.satin, { crasse: false });
    }
  }
  b.obstacle(-9.2, -2.55, -5.2, -2.55, "étagère");
  // La lumière du jour par la vitrine, la poussière
  raiDeLumiere(c, [-14.5, 3.0, 3.0], [-14.0, 0.07, 1.0], 2.2);
  debris(c, -17.5, -2.7, -4.5, 2.6, Math.round(26 * usure), [COUL.plastique, COUL.farine, 0xbfd3d6], 0.06);
  jonchee(c, -14, 1.5, -8, 2.7, Math.round(30 * usure), undefined, 0.07);
}

// ---------- Le logis du meunier ----------

function logis(k) {
  const { c, L, usure } = k;
  const enduit = [{ y1: 0, y2: 2.9, mat: M.enduit, couleur: COUL.enduit }];
  const fen = { croisillons: 1, traverses: 3, cadre: 0xd9d2c0, appui: true, couleurAppui: 0xcfc4aa, bris: k.bris, verre: M.verre, couleurVolet: COUL.volet, type: "fenetre" };
  murBandes(k, L, [-21, 4], [-21, -6], { h: 2.9, ep: 0.5, bandes: enduit, ouvertures: [{ u: 2, l: 1.0, bas: 0, haut: 2.2, type: "vide" }, { u: 7.5, l: 0.9, bas: 0.95, haut: 2.15, ...fen, volet: "ouvert" }] });
  murBandes(k, L, [-30, 4], [-21, 4], { h: 2.9, ep: 0.5, bandes: enduit, ouvertures: [{ u: 2.5, l: 0.9, bas: 0.95, haut: 2.15, ...fen, volet: "pendu" }, { u: 6.5, l: 0.9, bas: 0.95, haut: 2.15, ...fen, volet: "ouvert" }] });
  murBandes(k, L, [-30, -6], [-30, 4], { h: 2.9, cut: 2.9, ep: 0.5, bandes: enduit });
  murBandes(k, L, [-21, -6], [-30, -6], { h: 2.9, cut: 2.9, ep: 0.5, bandes: enduit, ouvertures: [{ u: 4.5, l: 0.8, bas: 1.15, haut: 2.05, ...fen }] });
  murBandes(k, L, [-30, -1], [-21, -1], { h: 2.9, cut: CUTI, ep: 0.15, bandes: [{ y1: 0, y2: 2.9, mat: M.enduit, couleur: 0xe0d6be }], ouvertures: [{ u: 4, l: 1.2, bas: 0, haut: 2.1, type: "vide" }] });
  // Linteau de bois de la porte, la porte entrouverte, le seuil
  L.pave(-21.3, 2.2, 1.4, -20.7, 2.4, 2.6, COUL.boisSombre, M.mat);
  vantail(L, -21.0, 1.5, -PI / 2, 0.95, 2.15, -1.3, 0x6f7f74);
  c.pave(-20.75, 0, 1.4, -20.2, 0.08, 2.6, 0xb0a690, M.pierre);
  // Encadrements de pierre des fenêtres (enduit plus clair)
  for (const [x, z, ry] of [[-27.5, 4.27, 0], [-23.5, 4.27, 0], [-20.73, -3.5, PI / 2]]) {
    L.repere({ x, y: 0, z, ry }, () => {
      L.pave(-0.6, 0.85, -0.02, -0.45, 2.3, 0.04, 0xece4d0, M.enduit, { crasse: false });
      L.pave(0.45, 0.85, -0.02, 0.6, 2.3, 0.04, 0xece4d0, M.enduit, { crasse: false });
      L.pave(-0.6, 2.15, -0.02, 0.6, 2.3, 0.05, 0xece4d0, M.enduit, { crasse: false });
    });
  }
  // Le grenier, les pignons, le toit de tuiles
  L.pave(-29.75, 2.8, -5.75, -21.25, 2.95, 3.75, COUL.boisSombre, M.mat, { crasse: false });
  pignon(L, [-21, 4.25], [-21, -6.25], 2.9, 3.0, 0.5, COUL.enduit, M.enduit);
  pignon(L, [-30, -6.25], [-30, 4.25], 2.9, 3.0, 0.5, COUL.enduit, M.enduit);
  L.pave(-20.78, 3.6, -1.45, -20.7, 4.45, -0.55, 0x2a2622, M.mat, { crasse: false });
  L.pave(-20.8, 3.55, -1.55, -20.68, 3.62, -0.45, 0xece4d0, M.enduit, { crasse: false });
  toit(L, -25.5, -1, 9, 10, 2.9, 3.0, { couleur: COUL.tuile, debord: 0.4, trous: usure > 0.3 ? [{ u: -1.2, v: -1, l: 2.4, p: 0.4 + 0.3 * usure }] : [], moussu: 0.15 + 0.2 * usure });
  // La cheminée sur le pignon ouest
  L.pave(-30.95, 0, 0.75, -30.2, 7.0, 2.25, 0xd2c6aa, M.enduit, { nuance: 0.02 });
  L.pave(-31.05, 7.0, 0.65, -30.1, 7.18, 2.35, 0xbab09a, M.enduit, { crasse: false });
  L.pave(-30.85, 7.18, 1.25, -30.3, 7.4, 1.75, COUL.tuile, M.tuiles, { crasse: false });
  // Le lierre et la rose grimpante, le banc, le tas de bois, la bicyclette
  lierre(L, -23.2, CUT, 4.28, 0, 2.2, 2.6, Math.round(60 * usure));
  lierre(c, -24.2, 0, 4.28, 0, 2.4, 0.85, Math.round(30 * usure));
  c.pave(-20.6, 0, 2.9, -20.2, 0.45, 3.9, COUL.boisGris, M.mat);
  for (let r = 0; r < 4; r++) {
    for (let i = 0; i < 7; i++) c.tube([-20.65 + c.entre(-0.05, 0.05), 0.12 + r * 0.22, -5.4 + i * 0.5 + (r % 2) * 0.2], [-20.0 + c.entre(-0.05, 0.05), 0.12 + r * 0.22, -5.4 + i * 0.5 + (r % 2) * 0.2], 0.1, i % 2 ? 0x8a6a48 : 0x7a5c40, M.mat, 5);
  }
  k.b.obstacle(-20.7, -5.6, -20.7, -1.9, "tas de bois");
  c.repere({ x: -20.45, y: 0, z: 0.2, ry: PI / 2, rz: 0.25 }, () => {
    for (const s of [-0.5, 0.5]) c.poser(new THREE.TorusGeometry(0.33, 0.025, 3, 12), M.tole, 0x3a3a3a, { x: s, y: 0.34 }, { crasse: false });
    c.poutre([-0.5, 0.34, 0], [0.1, 0.75, 0], 0.04, 0x5a6a5c, M.tole);
    c.poutre([0.1, 0.75, 0], [0.5, 0.34, 0], 0.04, 0x5a6a5c, M.tole);
    c.poutre([-0.2, 0.34, 0], [0.1, 0.75, 0], 0.04, 0x5a6a5c, M.tole);
  });
}

// ---------- La cuisine ----------

function cuisine(k) {
  const { c, b, usure } = k;
  // Le sol de tomettes
  c.pave(-29.75, 0, -0.93, -21.25, 0.05, 3.75, 0xb87a5a, M.brique, { crasse: false, nuance: 0 });
  // La cheminée : âtre, jambages, manteau, hotte, contrecœur noirci
  c.pave(-29.75, 0, 0.4, -28.8, 0.1, 2.6, 0xb0a690, M.pierre);
  c.pave(-29.75, 0.1, 0.4, -29.1, 1.25, 0.7, 0xc8bca0, M.pierre);
  c.pave(-29.75, 0.1, 2.3, -29.1, 1.25, 2.6, 0xc8bca0, M.pierre);
  c.pave(-29.76, 0.1, 0.7, -29.7, 1.25, 2.3, COUL.suie, M.mat, { crasse: false });
  c.pave(-29.75, 1.25, 0.25, -28.95, 1.5, 2.75, COUL.boisSombre, M.mat);
  c.pave(-29.75, 1.5, 0.45, -29.25, 2.88, 2.55, 0xd6ccb4, M.enduit);
  c.pave(-29.25, 1.5, 0.7, -29.24, 1.9, 2.3, COUL.suie, M.mat, { crasse: false });
  // Le feu : chenets, bûches, braises, flammes ; la crémaillère et le chaudron
  for (const z of [1.1, 1.9]) c.pave(-29.5, 0.1, z - 0.03, -29.0, 0.32, z + 0.03, COUL.fer, M.tole);
  for (let i = 0; i < 3; i++) c.tube([-29.6, 0.3 + i * 0.05, 1.1 + i * 0.25], [-29.0, 0.28, 1.5 + i * 0.15], 0.07, 0x5a4636, M.mat, 5);
  for (let i = 0; i < 6; i++) c.boite(0.12, 0.05, 0.1, 0xd0602a, { x: -29.35 + c.entre(-0.2, 0.2), y: 0.13, z: 1.5 + c.entre(-0.35, 0.35), ry: c.hasard() * 3 }, M.mat, { crasse: false, nuance: 0.1 });
  for (const ry of [PI / 2 + 0.3, PI / 2 - 0.5, 0]) panneau(c, M.lumineux, R.flamme, { x: -29.35, y: 0.62, z: 1.5, ry }, 0.42, 0.75);
  c.boite(0.03, 0.9, 0.03, COUL.fer, { x: -29.45, y: 1.0, z: 1.55 }, M.tole);
  c.poser(geoCyl(0.22, 0.17, 0.3, 8), M.tole, 0x2c2a28, { x: -29.4, y: 0.78, z: 1.55 }, { crasse: false });
  // La table de ferme, ses bancs (l'un renversé), bols, bouteille, bougie
  c.pave(-27.0, 0.72, 1.35, -25.0, 0.8, 2.25, 0x7a5c40, M.planches);
  for (const x of [-26.85, -25.15]) for (const z of [1.45, 2.15]) c.pave(x - 0.05, 0.05, z - 0.05, x + 0.05, 0.72, z + 0.05, 0x6a4e36, M.mat);
  c.pave(-26.9, 0.42, 0.75, -25.1, 0.47, 1.05, 0x7a5c40, M.planches);
  for (const x of [-26.7, -25.3]) c.pave(x - 0.05, 0.05, 0.8, x + 0.05, 0.42, 1.0, 0x6a4e36, M.mat);
  c.boite(1.8, 0.05, 0.3, 0x7a5c40, { x: -26.0, y: 0.17, z: 2.85, rx: PI / 2 + 0.1 }, M.planches);
  for (const [x, z] of [[-26.4, 1.6], [-25.6, 1.9], [-25.4, 1.5]]) cylindre(c, M.satin, 0xd8d0be, x, 0.8, z, 0.08, 0.06, 8, { crasse: false });
  c.tube([-26.0, 0.8, 2.0], [-26.0, 1.08, 2.0], 0.04, 0x2f4a30, M.satin, 6);
  cylindre(c, M.mat, 0xe9e2d0, -25.8, 0.8, 1.75, 0.025, 0.08, 6, { crasse: false });
  b.obstacle(-27.0, 1.35, -25.0, 1.35, "table");
  b.obstacle(-27.0, 2.25, -25.0, 2.25, "table");
  // Le buffet contre la cloison, ses assiettes ; une chaise renversée
  c.pave(-23.9, 0.05, -0.9, -22.5, 1.0, -0.4, 0x6a4e36, M.planches);
  c.pave(-23.85, 1.0, -0.85, -22.55, 2.0, -0.7, 0x6a4e36, M.planches);
  for (let i = 0; i < 4; i++) c.poser(geoCyl(0.11, 0.11, 0.02, 10), M.satin, 0xe2dccb, { x: -23.6 + i * 0.3, y: 1.42, z: -0.66, rx: PI / 2 - 0.15 }, { crasse: false });
  b.obstacle(-23.9, -0.4, -22.5, -0.4, "buffet");
  chaise(c, -24.6, 1.0, 0.8, true);
  // L'évier de pierre sous la fenêtre, sa pompe à bras
  c.pave(-24.1, 0.78, 3.15, -22.9, 0.93, 3.72, 0xb8ae9a, M.pierre);
  for (const x of [-24.0, -23.0]) c.pave(x - 0.06, 0.05, 3.3, x + 0.06, 0.78, 3.6, 0xb8ae9a, M.pierre);
  c.tube([-23.1, 0.93, 3.55], [-23.1, 1.4, 3.55], 0.05, 0x3a4a3c, M.tole, 6);
  c.poutre([-23.1, 1.4, 3.55], [-23.35, 1.55, 3.4], 0.03, 0x3a4a3c, M.tole);
  // L'étagère à bocaux, l'almanach
  c.pave(-29.75, 1.45, 2.9, -29.45, 1.5, 3.7, 0x7a5c40, M.mat);
  for (let i = 0; i < 4; i++) cylindre(c, M.verre, 0xd9e2c8, -29.6, 1.5, 3.0 + i * 0.2, 0.06, 0.16, 6, { crasse: false });
  panneau(c, M.enseignes, R.almanach, { x: -29.74, y: 1.75, z: -0.35, ry: PI / 2 }, 0.42, 0.42);
  // Feuilles mortes entrées par la porte, suie
  jonchee(c, -22.5, 0.5, -21.3, 3.5, Math.round(30 * usure), undefined, 0.06);
  debris(c, -29.5, -0.8, -21.5, 3.6, Math.round(24 * usure), undefined, 0.05);
  raiDeLumiere(c, [-23.5, 2.0, 4.0], [-23.8, 0.06, 2.2], 0.9);
}

/** Une chaise paillée. */
function chaise(ch, x, z, ry, renversee) {
  ch.repere({ x, y: renversee ? 0.27 : 0.05, z, ry, rx: renversee ? -PI / 2 : 0 }, () => {
    ch.boite(0.42, 0.05, 0.42, 0xc2a868, { y: 0.45 }, M.mat);
    for (const [a, d] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) ch.boite(0.04, 0.45, 0.04, 0x6a4e36, { x: a, y: 0.22, z: d }, M.mat);
    for (const a of [-0.18, 0.18]) ch.boite(0.04, 0.5, 0.04, 0x6a4e36, { x: a, y: 0.72, z: -0.18 }, M.mat);
    ch.boite(0.4, 0.06, 0.03, 0x6a4e36, { y: 0.88, z: -0.18 }, M.mat);
  });
}

// ---------- La chambre ----------

function chambre(k) {
  const { c, b, usure } = k;
  c.pave(-29.75, 0, -5.75, -21.25, 0.05, -1.07, 0x9c7a55, M.planches, { crasse: false, nuance: 0 });
  // Le lit de bois, le matelas affaissé, l'édredon passé
  c.pave(-29.7, 0.05, -4.95, -27.6, 0.48, -3.45, 0x6a4e36, M.planches);
  c.pave(-29.75, 0.05, -5.0, -29.6, 1.25, -3.4, 0x5a4230, M.mat);
  c.pave(-27.65, 0.05, -5.0, -27.55, 0.8, -3.4, 0x5a4230, M.mat);
  c.boite(2.0, 0.2, 1.4, 0xc9bfa6, { x: -28.65, y: 0.56, z: -4.2, rz: 0.05 }, M.mat, { nuance: 0.03 });
  c.boite(1.4, 0.12, 1.5, 0x9a5a48, { x: -28.2, y: 0.7, z: -4.15, rz: -0.06, ry: 0.1 }, M.mat, { nuance: 0.04 });
  c.boite(0.6, 0.15, 0.9, 0x9a5a48, { x: -27.4, y: 0.3, z: -3.3, rz: -0.9, ry: 0.3 }, M.mat, { nuance: 0.04 });
  c.boite(0.5, 0.14, 0.35, 0xe0d8c4, { x: -29.3, y: 0.72, z: -4.2 }, M.mat);
  b.obstacle(-29.7, -3.45, -27.6, -3.45, "lit");
  b.obstacle(-27.6, -4.95, -27.6, -3.45, "lit");
  // L'armoire normande, une porte ouverte ; la table de nuit, la bougie
  c.pave(-27.0, 0.05, -5.75, -25.6, 2.25, -5.15, 0x6a4e36, M.planches);
  c.pave(-27.05, 2.25, -5.8, -25.55, 2.38, -5.1, 0x5a4230, M.mat);
  c.boite(0.68, 2.0, 0.05, 0x6a4e36, { x: -25.9 + 0.3, y: 1.1, z: -4.88, ry: -1.2 }, M.planches);
  for (let i = 0; i < 3; i++) c.boite(0.5, 0.06, 0.4, [0xd8cfb8, 0x6a6a74, 0x8a5a48][i], { x: -26.5, y: 0.35 + i * 0.5, z: -5.45 }, M.mat, { crasse: false });
  b.obstacle(-27.0, -5.15, -25.6, -5.15, "armoire");
  c.pave(-29.7, 0.05, -3.3, -29.25, 0.6, -2.85, 0x6a4e36, M.planches);
  cylindre(c, M.mat, 0xe9e2d0, -29.45, 0.6, -3.05, 0.025, 0.1, 6, { crasse: false });
  // La malle du meunier, au pied du lit
  c.pave(-27.4, 0.05, -4.6, -26.55, 0.55, -3.75, 0x5a4230, M.planches);
  for (const x of [-27.2, -26.75]) c.pave(x - 0.03, 0.05, -4.62, x + 0.03, 0.56, -3.73, COUL.fer, M.tole, { crasse: false });
  chaise(c, -23.0, -4.8, 2.4, false);
  // La photo encadrée, le rai de lumière par la fenêtre nord
  panneau(c, M.enseignes, R.photo, { x: -29.74, y: 1.65, z: -2.2, ry: PI / 2 }, 0.32, 0.32);
  raiDeLumiere(c, [-25.5, 2.0, -6.0], [-25.0, 0.06, -4.0], 0.8);
  debris(c, -29.5, -5.6, -21.5, -1.2, Math.round(20 * usure), undefined, 0.05);
  if (usure > 0.5) gravats(c, -24.0, -3.0, 0.9, Math.round(6 + 8 * usure), [0xd6ccb4, COUL.tuile, COUL.boisSombre], 0.05);
}

// ---------- Les dépendances : atelier et étable sous un même toit ----------

function dependances(k) {
  const { c, D, usure } = k;
  const pierre = [{ y1: 0, y2: 3.0, mat: M.pierre, couleur: COUL.pierreGrise }];
  murBandes(k, D, [-6, 9], [-24, 9], { h: 3.0, cut: 3.0, ep: 0.45, bandes: pierre, ouvertures: [{ u: 4, l: 1.4, bas: 0, haut: 2.4, type: "vide" }, { u: 13.5, l: 1.4, bas: 0, haut: 2.4, type: "vide" }, { u: 16.5, l: 0.9, bas: 1.3, haut: 2.2, type: "vide" }] });
  murBandes(k, D, [-24, 16], [-6, 16], { h: 3.0, ep: 0.45, bandes: pierre, ouvertures: [{ u: 4, l: 1.0, bas: 1.0, haut: 2.2, type: "vide" }, { u: 12, l: 0.6, bas: 1.6, haut: 2.2, type: "vide" }, { u: 16, l: 0.6, bas: 1.6, haut: 2.2, type: "vide" }], breches: usure > 0.5 ? [{ u: 8.5, l: 2.4, profondeur: 1.3 * usure }] : [] });
  murBandes(k, D, [-6, 16], [-6, 9], { h: 3.0, ep: 0.45, bandes: pierre, ouvertures: [{ u: 3.5, l: 2.4, bas: 0, haut: 2.6, type: "vide" }] });
  murBandes(k, D, [-24, 9], [-24, 16], { h: 3.0, cut: 3.0, ep: 0.45, bandes: pierre });
  murBandes(k, D, [-15, 16], [-15, 9], { h: 3.0, cut: CUTI, ep: 0.4, bandes: [{ y1: 0, y2: 3.0, mat: M.pierre, couleur: 0xb2aa9a }], ouvertures: [{ u: 5.5, l: 1.2, bas: 0, haut: 2.2, type: "vide" }] });
  // Les portes : celles de la cour (ouvertes), le grand portail de l'étable (un battant arraché)
  vantail(c, -9.3, 8.77, PI, 1.35, 2.35, -1.2, COUL.boisGris);
  vantail(c, -18.8, 8.77, PI, 1.35, 2.35, -0.6, 0x6f7f74);
  vantail(D, -5.78, 13.7, PI / 2, 1.18, 2.55, -1.4, COUL.boisGris);
  c.boite(1.15, 0.07, 2.5, COUL.boisGris, { x: -4.6, y: 0.05, z: 11.6, ry: 0.25 }, M.planches, { nuance: 0.05 });
  // Les linteaux de bois, les barreaux des jours de l'étable, un contrevent pendu à l'atelier
  for (const [x1, x2, z] of [[-10.8, -9.2, 9], [-20.3, -18.7, 9]]) c.pave(x1, 2.4, z - 0.25, x2, 2.6, z + 0.25, COUL.boisSombre, M.mat);
  D.pave(-6.25, 2.6, 11.2, -5.75, 2.82, 13.8, COUL.boisSombre, M.mat);
  for (const x of [-12, -8]) for (const dx of [-0.15, 0, 0.15]) D.pave(x + dx - 0.015, 1.6, 15.98, x + dx + 0.015, 2.2, 16.02, COUL.fer, M.mat, { crasse: false });
  D.boite(0.55, 1.1, 0.04, 0x6f7f74, { x: -19.25, y: 1.4, z: 16.3, ry: 0.5, rz: 0.4 }, M.mat, { nuance: 0.05 });
  // Le fenil, les pignons, le toit
  D.pave(-23.8, 2.9, 9.2, -6.2, 3.05, 15.8, COUL.boisSombre, M.mat, { crasse: false });
  pignon(D, [-6, 16.25], [-6, 8.75], 3.0, 2.4, 0.45, COUL.pierreGrise, M.pierre);
  pignon(D, [-24, 8.75], [-24, 16.25], 3.0, 2.4, 0.45, COUL.pierreGrise, M.pierre);
  D.pave(-5.78, 3.3, 11.9, -5.72, 4.6, 13.1, 0x2a2622, M.mat, { crasse: false });
  D.boite(1.1, 1.2, 0.05, COUL.boisGris, { x: -5.5, y: 3.95, z: 13.3, ry: -PI / 2 - 1.1 }, M.mat, { nuance: 0.05 });
  for (let i = 0; i < 6; i++) D.boite(D.entre(0.3, 0.7), 0.04, D.entre(0.1, 0.25), 0xc9b46a, { x: -5.6, y: 3.3 + D.entre(-0.05, 0.05), z: 12.5 + D.entre(-0.6, 0.6), ry: D.hasard() * 3, rz: D.entre(-0.6, 0.6) }, M.mat, { crasse: false });
  toit(D, -15, 12.5, 18, 7, 3.0, 2.4, { couleur: COUL.tuile, debord: 0.4, trous: usure > 0.3 ? [{ u: 6.2, v: 1, l: 3.0, p: 0.4 + 0.35 * usure }] : [], moussu: 0.2 + 0.2 * usure });
  // Lierre, herbes, le pied des murs
  lierre(D, -15, CUT, 16.25, 0, 5, 2.2, Math.round(70 * usure));
  lierre(c, -21.5, 0, 16.25, 0, 3, 0.85, Math.round(25 * usure));
  if (usure > 0.5) gravats(c, -15.5, 16.8, 1.2, Math.round(8 + 10 * usure), [COUL.pierreGrise, COUL.tuile, COUL.boisSombre], 0);
}

function etable(k) {
  const { c, b, usure } = k;
  c.pave(-14.8, 0, 9.22, -6.22, 0.03, 15.78, 0x8a7458, M.terrain, { crasse: false, nuance: 0 });
  // L'auge de pierre et le râtelier le long du mur sud
  c.pave(-14.6, 0.03, 15.05, -6.45, 0.72, 15.76, COUL.pierreGrise, M.pierre);
  c.pave(-14.5, 0.62, 15.15, -6.55, 0.73, 15.66, 0x5a4e3a, M.mat, { crasse: false });
  c.pave(-14.6, 2.0, 15.6, -6.45, 2.08, 15.72, COUL.boisSombre, M.mat);
  c.pave(-14.6, 1.0, 15.1, -6.45, 1.08, 15.22, COUL.boisSombre, M.mat);
  for (let i = 0; i < 22; i++) {
    if (c.hasard() < 0.15 * usure) continue;
    const x = -14.4 + i * 0.37;
    c.poutre([x, 1.04, 15.16], [x, 2.04, 15.66], 0.04, COUL.boisGris, M.mat);
  }
  // Les stalles : bat-flancs de planches (l'un tombé), poteaux
  for (const [x, tombe] of [[-12.6, false], [-10.4, usure > 0.5], [-8.3, false]]) {
    if (tombe) c.boite(0.06, 1.25, 2.0, COUL.boisGris, { x: x + 0.5, y: 0.08, z: 14.0, rz: PI / 2, ry: 0.2 }, M.planches, { nuance: 0.05 });
    else c.pave(x - 0.03, 0.03, 13.0, x + 0.03, 1.3, 15.05, COUL.boisGris, M.planches, { nuance: 0.05 });
    c.pave(x - 0.07, 0.03, 12.9, x + 0.07, 1.55, 13.04, COUL.boisSombre, M.mat);
    if (!tombe) b.obstacle(x, 13.0, x, 15.05, "stalle");
  }
  b.obstacle(-14.6, 15.05, -6.45, 15.05, "auge");
  // Litière, foin, bottes, bidon, seau, fourche, harnais, roue de charrette
  jonchee(c, -14.6, 12.5, -6.5, 15.0, Math.round(90 * usure + 30), [0xc9b46a, 0xb09a58, 0xa08a4a, 0x8a7a48], 0.04);
  for (let i = 0; i < 5; i++) c.poser(BOULE, M.mat, i % 2 ? 0xc9b46a : 0xb8a45c, { x: -14.0 + c.entre(-0.5, 0.5), y: 0.25, z: 10.2 + c.entre(-0.6, 0.6), e: [c.entre(0.5, 0.8), c.entre(0.25, 0.45), c.entre(0.5, 0.8)], ry: c.hasard() * 3 }, { crasse: false, nuance: 0.05 });
  for (const [x, z, ry] of [[-13.6, 11.6, 0.2], [-13.1, 12.3, 1.5]]) c.boite(0.9, 0.45, 0.45, 0xc4ae62, { x, y: 0.26, z, ry }, M.mat, { nuance: 0.05 });
  cylindre(c, M.metal, 0x9aa0a2, -7.0, 0.03, 9.8, 0.17, 0.55, 8);
  c.poser(geoCyl(0.18, 0.15, 0.3, 8), M.tole, 0x6a6560, { x: -7.6, y: 0.18, z: 10.3, rz: PI / 2 - 0.2 }, { crasse: false });
  // La fourche à foin, dressée contre le mur : un objet à part (« fourche »), que le jeu efface quand on la prend
  objetNomme(k, "fourche", 79, (e) => {
    e.poutre([-6.5, 0.03, 10.6], [-6.45, 1.6, 10.2], 0.035, COUL.boisGris, M.tole);
    for (let i = 0; i < 4; i++) e.boite(0.02, 0.32, 0.02, COUL.fer, { x: -6.5 + (i - 1.5) * 0.06, y: 1.7, z: 10.15 }, M.tole, { crasse: false });
  });
  for (const x of [-12.5, -11.8]) c.poser(new THREE.TorusGeometry(0.28, 0.04, 3, 10), M.mat, 0x3a2e24, { x, y: 1.9, z: 9.27 }, { crasse: false });
  c.poser(new THREE.TorusGeometry(0.62, 0.06, 4, 14), M.mat, 0x6a5038, { x: -14.7, y: 0.66, z: 12.0, ry: PI / 2, rz: 0.15 }, { crasse: false });
  for (let i = 0; i < 6; i++) c.repere({ x: -14.7, y: 0.66, z: 12.0, ry: PI / 2, rz: 0.15 }, () => c.boite(1.2, 0.05, 0.05, 0x6a5038, { rz: (i * PI) / 6 }, M.mat, { crasse: false }));
  // Le jour par la brèche et par les jours à barreaux
  raiDeLumiere(c, [-12, 2.0, 16.0], [-11.6, 0.05, 14.4], 0.6);
  if (usure > 0.5) raiDeLumiere(c, [-15.5, 3.0, 16.2], [-15.0, 0.05, 14.4], 1.6);
  flaque(c, -7.5, 12.2, 0.7, 0.04);
}

function atelier(k) {
  const { c, b, usure } = k;
  c.pave(-23.78, 0, 9.22, -15.2, 0.03, 15.78, 0x8f7a60, M.terrain, { crasse: false, nuance: 0 });
  const chene = 0x7a5c40;
  // L'établi contre le mur ouest : plateau épais, étau, outils ; dessous, la caisse d'alluchons de rechange
  c.pave(-23.75, 0.82, 10.3, -22.9, 0.95, 13.4, chene, M.planches);
  for (const z of [10.45, 13.25]) for (const x of [-23.6, -23.05]) c.pave(x - 0.06, 0.03, z - 0.06, x + 0.06, 0.82, z + 0.06, 0x5a4230, M.mat);
  c.pave(-23.7, 0.3, 10.4, -22.95, 0.35, 13.3, chene, M.planches);
  // L'étau n'y est plus (le meunier l'a monté au moulin) : il reste la trace claire de sa semelle et les trous de ses vis
  c.pave(-23.15, 0.95, 12.55, -22.85, 0.952, 12.95, 0xa0805c, M.mat, { crasse: false });
  for (const z of [12.62, 12.88]) c.poser(geoCyl(0.025, 0.025, 0.01, 6), M.mat, 0x1e1a16, { x: -23.0, y: 0.955, z }, { crasse: false });
  c.pave(-23.55, 0.35, 11.0, -23.0, 0.68, 11.9, 0x8a6e52, M.planches);
  for (let i = 0; i < 26; i++) {
    const surEtabli = i > 16;
    c.boite(0.07, 0.07, 0.26, 0xb09070, { x: surEtabli ? c.entre(-23.5, -23.1) : c.entre(-23.45, -23.1), y: surEtabli ? 0.99 : c.entre(0.7, 0.78), z: surEtabli ? c.entre(10.6, 12.2) : c.entre(11.1, 11.8), ry: c.hasard() * 3, rx: surEtabli ? 0 : c.entre(-0.4, 0.4) }, M.mat, { crasse: false, nuance: 0.08 });
  }
  b.obstacle(-22.9, 10.3, -22.9, 13.4, "établi");
  // Le panneau à outils : scies, maillets, tarières, gouges
  c.pave(-23.76, 1.15, 10.5, -23.72, 2.3, 13.2, 0x8a7458, M.planches, { crasse: false });
  for (let i = 0; i < 3; i++) c.boite(0.02, 0.32, 0.75, 0xb8bcbc, { x: -23.69, y: 1.85, z: 10.9 + i * 0.85, rx: 0.1 }, M.metal, { crasse: false });
  for (let i = 0; i < 4; i++) c.tube([-23.68, 1.3, 10.8 + i * 0.6], [-23.68, 1.75, 10.85 + i * 0.6], 0.025, i % 2 ? COUL.fer : chene, M.mat, 4);
  for (let i = 0; i < 3; i++) c.boite(0.12, 0.12, 0.22, chene, { x: -23.6, y: 1.25, z: 12.5 + i * 0.25 }, M.mat, { crasse: false });
  // Le rouet de rechange en réparation, sur ses tréteaux : jante en segments, bras, quelques alluchons plantés
  const xg = -19.6;
  const zg = 13.4;
  for (const dx of [-1.1, 1.1]) {
    c.poutre([xg + dx, 0.03, zg - 0.6], [xg + dx, 0.75, zg], 0.07, chene, M.mat);
    c.poutre([xg + dx, 0.03, zg + 0.6], [xg + dx, 0.75, zg], 0.07, chene, M.mat);
    c.pave(xg + dx - 0.08, 0.72, zg - 0.6, xg + dx + 0.08, 0.82, zg + 0.6, chene, M.mat);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 12) * PI * 2 + 0.3;
    c.boite(0.62, 0.22, 0.24, 0x8a6a4a, { x: xg + Math.cos(a) * 1.2, y: 0.94, z: zg + Math.sin(a) * 0.95, ry: -a + PI / 2 }, M.mat, { nuance: 0.05 });
    if (i % 2 === 0) for (let j = 0; j < 2; j++) c.boite(0.07, 0.24, 0.07, 0xb09070, { x: xg + Math.cos(a + j * 0.1) * 1.2, y: 1.16, z: zg + Math.sin(a + j * 0.1) * 0.95 }, M.mat, { crasse: false });
  }
  c.boite(2.2, 0.16, 0.2, chene, { x: xg, y: 0.92, z: zg, ry: 0.4 }, M.mat);
  b.obstacle(xg - 1.3, zg - 0.65, xg + 1.3, zg - 0.65, "tréteaux");
  // Le bois de charpente est parti au moulin (les poutres de rechange du rouet) : il reste des cales et de la sciure
  for (let i = 0; i < 3; i++) c.boite(0.5, 0.12, 0.14, 0x8a6a4a, { x: -22.5 + i * 2.2, y: 0.09, z: 15.4, ry: 0.1 * i }, M.planches, { nuance: 0.06 });
  // Le tableau à clés, à côté de la porte : une planche à clous, de petites clés, et LA GROSSE CLÉ DU MOULIN (« GRANDE PORTE »)
  c.pave(-17.45, 1.2, 9.23, -16.55, 1.78, 9.27, 0x8a6e52, M.planches, { crasse: false });
  for (let i = 0; i < 5; i++) {
    const x = -17.33 + i * 0.16;
    c.pave(x - 0.01, 1.62, 9.27, x + 0.01, 1.64, 9.31, COUL.fer, M.tole, { crasse: false }); // les clous
    if (i === 3) continue; // la grosse clé pend au quatrième clou
    if (i !== 1) c.boite(0.02, 0.09, 0.012, 0x8a8478, { x, y: 1.55, z: 9.3 }, M.metal, { crasse: false });
  }
  // La grosse clé : un objet à part (« grosse clé »), que le jeu efface quand on la décroche
  objetNomme(k, "grosse clé", 78, (e) => {
    e.poser(new THREE.TorusGeometry(0.04, 0.012, 4, 8), M.metal, 0x6a6058, { x: -16.85, y: 1.58, z: 9.31 }, { crasse: false });
    e.boite(0.025, 0.16, 0.02, 0x6a6058, { x: -16.85, y: 1.46, z: 9.31 }, M.metal, { crasse: false });
    e.boite(0.05, 0.04, 0.02, 0x6a6058, { x: -16.83, y: 1.39, z: 9.31 }, M.metal, { crasse: false });
    e.boite(0.09, 0.055, 0.012, 0xc8b48c, { x: -16.74, y: 1.52, z: 9.32, rz: 0.2 }, M.metal, { crasse: false }); // l'étiquette de bois
  });
  // La meule à aiguiser, le billot et sa hache
  c.poser(geoCyl(0.42, 0.42, 0.12, 12), M.pierre, 0xb0a898, { x: -16.6, y: 0.8, z: 10.3, rz: PI / 2 }, { crasse: false });
  c.pave(-16.95, 0.03, 10.0, -16.25, 0.45, 10.6, chene, M.mat);
  c.poutre([-16.4, 0.8, 10.3], [-16.0, 0.6, 10.3], 0.04, COUL.fer, M.tole);
  cylindre(c, M.mat, 0x6a5038, -17.8, 0.03, 11.6, 0.3, 0.55, 8);
  c.poutre([-17.8, 0.58, 11.6], [-17.5, 1.1, 11.9], 0.04, chene, M.mat);
  c.boite(0.05, 0.16, 0.22, 0x8a8e90, { x: -17.8, y: 0.62, z: 11.55, rx: 0.5 }, M.metal, { crasse: false });
  // Copeaux, sciure, le jour par la fenêtre sud
  jonchee(c, -23.5, 9.5, -15.6, 15.0, Math.round(70 * usure + 30), [0xd9c49a, 0xc9b080, 0xb89a6a, 0xe2d2aa], 0.04);
  raiDeLumiere(c, [-20, 2.0, 16.0], [-20.3, 0.05, 14.0], 0.9);
  debris(c, -23.5, 9.5, -15.6, 15.0, Math.round(16 * usure), undefined, 0.03);
}

// ---------- La cour : puits, charrette, meules, potager ----------

function cour(k) {
  const { c, b, usure } = k;
  // Le puits : margelle ronde, deux montants, treuil, petit toit, seau
  const xp = -24.5;
  const zp = 6.6;
  c.poser(geoCyl(0.85, 0.9, 0.85, 12), M.pierre, COUL.pierreGrise, { x: xp, y: 0.42, z: zp }, { nuance: 0.03 });
  c.poser(geoCyl(0.62, 0.62, 0.02, 12), M.mat, 0x1e1c1a, { x: xp, y: 0.86, z: zp }, { crasse: false });
  for (const s of [-1, 1]) c.pave(xp + s * 0.8 - 0.07, 0.85, zp - 0.07, xp + s * 0.8 + 0.07, 2.2, zp + 0.07, COUL.boisGris, M.mat);
  c.tube([xp - 0.85, 1.6, zp], [xp + 1.0, 1.6, zp], 0.08, COUL.boisSombre, M.mat, 6);
  c.poutre([xp + 1.0, 1.6, zp], [xp + 1.0, 1.35, zp + 0.3], 0.03, COUL.fer, M.tole);
  for (const s of [-1, 1]) c.boite(2.0, 0.05, 0.8, COUL.tuile, { x: xp, y: 2.42, z: zp + s * 0.34, rx: s * 0.55 }, M.mat, { crasse: false, nuance: 0.05 });
  c.boite(0.02, 0.5, 0.02, 0xb09a72, { x: xp, y: 1.35, z: zp }, M.mat, { crasse: false });
  c.poser(geoCyl(0.16, 0.13, 0.26, 8), M.tole, 0x6a6560, { x: xp + 1.3, y: 0.13, z: zp + 0.6 }, { crasse: false });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * PI * 2;
    const a2 = ((i + 1) / 8) * PI * 2;
    b.obstacle(xp + Math.cos(a) * 0.9, zp + Math.sin(a) * 0.9, xp + Math.cos(a2) * 0.9, zp + Math.sin(a2) * 0.9, "puits");
  }
  // La charrette renversée sur le côté, une roue partie
  c.repere({ x: -1.5, y: 0, z: 6.4, ry: 0.6 }, () => {
    c.repere({ y: 0.55, rz: 0.35 }, () => {
      c.boite(2.4, 0.08, 1.3, COUL.boisGris, { y: 0.3 }, M.planches, { nuance: 0.05 });
      for (const s of [-1, 1]) c.boite(2.4, 0.45, 0.06, COUL.boisGris, { y: 0.55, z: s * 0.65 }, M.planches, { nuance: 0.05 });
      c.boite(0.06, 0.45, 1.3, COUL.boisGris, { x: -1.2, y: 0.55 }, M.planches);
      for (const s of [-1, 1]) c.poutre([1.2, 0.25, s * 0.45], [3.2, 0.0, s * 0.35], 0.08, COUL.boisSombre, M.mat);
      c.poser(new THREE.TorusGeometry(0.62, 0.06, 4, 14), M.mat, COUL.boisSombre, { x: -0.2, y: 0.15, z: -0.85 }, { crasse: false });
    });
    c.poser(new THREE.TorusGeometry(0.62, 0.06, 4, 14), M.mat, COUL.boisSombre, { x: 0.4, y: 0.07, z: 1.6, rx: PI / 2 }, { crasse: false });
    for (let i = 0; i < 3; i++) c.boite(1.2, 0.05, 0.05, COUL.boisSombre, { x: 0.4, y: 0.07, z: 1.6, ry: (i * PI) / 3 }, M.mat, { crasse: false });
  });
  b.obstacle(-2.6, 5.6, -0.4, 7.2, "charrette");
  // Une meule couchée dans la cour, devenue table des survivants ; deux autres le long de la minoterie, derrière
  c.poser(geoCyl(0.75, 0.75, 0.3, 14), M.pierre, 0xbab2a0, { x: 2.8, y: 0.15, z: 5.6 }, { nuance: 0.03 });
  c.poser(geoCyl(0.12, 0.12, 0.02, 8), M.mat, 0x2c2926, { x: 2.8, y: 0.31, z: 5.6 }, { crasse: false });
  for (const [x, z, ry] of [[-8.5, -14.0, 0], [-7.0, -14.1, 0.2]]) c.poser(geoCyl(0.72, 0.72, 0.28, 14), M.pierre, 0xb5ad9c, { x, y: 0.68, z, rx: PI / 2 + 0.15, ry }, { nuance: 0.03 });
  for (let i = 0; i < 3; i++) c.poser(geoCyl(0.7, 0.7, 0.28, 14), M.pierre, 0xaaa290, { x: -2.0, y: 0.14 + i * 0.29, z: -15.5, ry: i }, { nuance: 0.03 });
  // Le potager du meunier, retourné à la friche, et son épouvantail
  for (let i = 0; i < 4; i++) {
    const x1 = -29.5 + i * 2.2;
    c.pave(x1, 0, -14, x1 + 1.6, 0.22, -8.5, 0x7a6048, M.planches, { nuance: 0.05 });
    c.pave(x1 + 0.1, 0.22, -13.9, x1 + 1.5, 0.24, -8.6, 0x6b5640, M.terrain, { crasse: false });
    semerTouffes(c, x1 + 0.2, -13.8, x1 + 1.4, -8.7, Math.round(14 * usure + 6), COUL.herbe, 0.24);
  }
  c.repere({ x: -26.5, y: 0, z: -15.4, ry: 0.4 }, () => {
    c.poutre([0, 0, 0], [0.05, 2.1, 0], 0.07, COUL.boisGris, M.mat);
    c.poutre([-0.75, 1.6, 0], [0.75, 1.55, 0], 0.06, COUL.boisGris, M.mat);
    c.boite(0.7, 0.75, 0.3, 0x5a5a6a, { y: 1.3, rz: 0.05 }, M.mat, { nuance: 0.05 });
    c.boite(0.5, 0.65, 0.2, 0x5a5a6a, { x: -0.55, y: 1.35, rz: 0.4 }, M.mat);
    c.poser(BOULE, M.mat, 0xc9b46a, { y: 1.95, e: 0.2 }, { crasse: false });
    c.poser(geoCyl(0.32, 0.32, 0.04, 8), M.mat, 0x3a3230, { y: 2.15, rz: 0.15 }, { crasse: false });
    c.poser(geoCyl(0.17, 0.19, 0.18, 8), M.mat, 0x3a3230, { y: 2.25, rz: 0.15 }, { crasse: false });
  });
  // Herbes et gravats dans la cour
  gravats(c, -18.8, 4.5, 0.9, Math.round(4 + 6 * usure), [COUL.brique, COUL.briqueSombre, COUL.bandeau], 0.03);
  if (usure > 0.4) gravats(c, -18.8, -8, 1.4, Math.round(10 * usure), [COUL.brique, COUL.briqueSombre], 0);
  jonchee(c, -20, 2, 8, 9, Math.round(60 * usure), undefined, 0.02);
}

// ---------- Le jardin du meunier : clos de murs, l'if, la planche sur le bief, le chemin de halage ----------

function jardin(k) {
  const { c, J, b, usure } = k;
  // Le mur de clôture (2 m, pierre et chaperon de tuiles) : il ferme le jardin à l'ouest du logis et dans la ruelle
  const pierre = [{ y1: 0, y2: 2.0, mat: M.pierre, couleur: COUL.pierreGrise }];
  for (const [x1, x2] of [[-32, -30.25], [-20.75, -18.22]]) {
    murBandes(k, J, [x1, -6], [x2, -6], { h: 2.0, ep: 0.4, bandes: pierre });
    J.pave(x1 - 0.05, 2.0, -6.28, x2 + 0.05, 2.1, -5.72, 0xb8ad96, M.pierre, { crasse: false });
    for (const s of [-1, 1]) J.boite(x2 - x1 + 0.1, 0.05, 0.4, COUL.tuile, { x: (x1 + x2) / 2, y: 2.16, z: -6 + s * 0.15, rx: s * 0.5 }, M.pierre, { crasse: false, nuance: 0.05 });
  }
  lierre(c, -19.5, 0, -5.78, 0, 2.2, 0.85, Math.round(30 * usure));
  lierre(c, -19.5, CUT, -5.78, 0, 2.0, 1.1, Math.round(30 * usure));

  // L'if, penché sur le bief : tronc rouge brun, ramure sombre et dense, quelques baies
  c.tube([8.3, 0, -16.5], [8.8, 1.3, -16.55], 0.2, 0x7a4a36, M.mat, 7);
  c.tube([8.8, 1.3, -16.55], [9.6, 2.3, -16.7], 0.15, 0x7a4a36, M.mat, 6);
  c.tube([8.8, 1.3, -16.55], [8.6, 2.6, -16.0], 0.11, 0x7a4a36, M.mat, 5);
  for (const [dx, dy, dz, s] of [[1.0, 2.4, -0.1, 1.0], [0.4, 2.8, 0.3, 0.9], [1.6, 2.0, -0.3, 0.8], [0.9, 3.2, -0.4, 0.75], [0.1, 2.2, -0.5, 0.7], [1.4, 2.9, 0.4, 0.7]]) {
    c.poser(BOULE, M.mat, [0x2f4a2e, 0x3a5a36, 0x28402a][Math.floor(c.hasard() * 3)], { x: 8.3 + dx, y: dy, z: -16.5 + dz, rx: c.hasard() * 3, ry: c.hasard() * 3, e: [s, s * 0.8, s] }, { crasse: false, nuance: 0.06 });
  }
  for (let i = 0; i < 8; i++) c.boite(0.05, 0.05, 0.05, 0xa8322a, { x: 8.3 + c.entre(0.2, 1.8), y: c.entre(1.7, 2.6), z: -16.5 + c.entre(-0.9, 0.9) }, M.satin, { crasse: false });
  b.obstacle(8.1, -16.7, 8.5, -16.3, "if");

  // La planche sur le bief : trois madriers posés d'une margelle à l'autre (1,2 m), un piquet et une corde de chaque côté
  const { z1, z2 } = PLANCHE;
  for (const [za, zb] of [[z1 + 0.02, z1 + 0.4], [z1 + 0.41, z1 + 0.79], [z1 + 0.8, z2 - 0.02]]) c.pave(BIEF.x1 - 0.3, 0.1, za, BIEF.x2 + 0.3, 0.18, zb, COUL.boisGris, M.planches, { nuance: 0.06 });
  c.pave(BIEF.x1 + 1.5, 0.18, z1, BIEF.x1 + 1.7, 0.21, z2, COUL.boisSombre, M.planches); // une traverse clouée
  for (const x of [BIEF.x1 - 0.35, BIEF.x2 + 0.35]) for (const z of [z1 - 0.08, z2 + 0.08]) c.pave(x - 0.05, 0, z - 0.05, x + 0.05, 1.0, z + 0.05, COUL.boisGris, M.mat);
  for (const z of [z1 - 0.08, z2 + 0.08]) c.boite(BIEF.x2 - BIEF.x1 + 0.7, 0.025, 0.025, 0xb09a72, { x: (BIEF.x1 + BIEF.x2) / 2, y: 0.8, z }, M.mat, { crasse: false });
  b.obstacle(BIEF.x1, z1, BIEF.x2, z1, "bord de la planche (le bief)");
  b.obstacle(BIEF.x1, z2, BIEF.x2, z2, "bord de la planche (le bief)");

  // Le panneau du chemin de halage, au bout de la levée : la sortie se voit
  c.repere({ x: 15.0, y: 0, z: -24.6 }, () => {
    c.pave(-0.06, 0, -0.06, 0.06, 2.1, 0.06, COUL.boisGris, M.mat);
    c.pave(-0.85, 1.45, -0.05, 0.85, 2.0, 0.0, 0xd8ccb0, M.planches, { crasse: false });
    panneau(c, M.enseignes, R.halage, { x: 0, y: 1.72, z: 0.01 }, 1.65, 0.52);
  });
  // Les traces du halage : un chemin d'herbe rase sur la levée
  c.pave(13.6, 0.0, -27, 16.4, 0.012, -15.8, 0xa49a7a, M.terrain, { crasse: false });
}

// ---------- Les bords du lot : on y bute, il faut les voir ----------

function limites(k) {
  const { c, b } = k;
  const A = aleatoire(4242);
  // Une haie bocagère (nord, ouest) : derrière le joueur vu de la caméra, elle peut être haute
  const haie = (x1, z1, x2, z2) => {
    const L = Math.hypot(x2 - x1, z2 - z1);
    const n = Math.max(1, Math.round(L / 1.6));
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const x = x1 + (x2 - x1) * t;
      const z = z1 + (z2 - z1) * t;
      const h = 1.3 + A() * 0.6;
      const lx = x1 === x2 ? 1.0 : L / n + 0.2;
      const lz = x1 === x2 ? L / n + 0.2 : 1.0;
      c.boite(lx, h, lz, [COUL.herbeSombre, 0x557a40, 0x4f6e3a][i % 3], { x, y: h / 2, z, ry: (A() - 0.5) * 0.08 }, M.mat, { nuance: 0.07 });
    }
    b.obstacle(x1, z1, x2, z2, "limite du lot (haie)");
  };
  // Un muret de pierres sèches (sud, est) : du côté de la caméra, il reste bas
  const muret = (x1, z1, x2, z2) => {
    const L = Math.hypot(x2 - x1, z2 - z1);
    const n = Math.max(1, Math.round(L / 1.2));
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const x = x1 + (x2 - x1) * t;
      const z = z1 + (z2 - z1) * t;
      const h = 0.55 + A() * 0.15;
      const lx = x1 === x2 ? 0.5 : L / n + 0.02;
      const lz = x1 === x2 ? L / n + 0.02 : 0.5;
      c.boite(lx, h, lz, A() < 0.5 ? COUL.pierreGrise : 0x9c958a, { x, y: h / 2, z }, M.pierre, { nuance: 0.05 });
    }
    const pts = [];
    for (let i = 0; i < L / 7; i++) {
      const t = A();
      pts.push([x1 + (x2 - x1) * t + (x1 === x2 ? (A() - 0.5) * 0.8 : 0), z1 + (z2 - z1) * t + (z1 === z2 ? (A() - 0.5) * 0.8 : 0)]);
    }
    touffes(c, pts, COUL.herbeSeche);
    b.obstacle(x1, z1, x2, z2, "limite du lot (muret)");
  };
  haie(-31.5, -26.5, 9, -26.5); // nord, jusqu'au bief (le halage reste ouvert)
  haie(25.5, -26.5, 31.5, -26.5); // nord, au-delà de la rivière
  haie(-31.5, -26.5, -31.5, -6.7); // ouest, jusqu'au mur du jardin
  haie(-31.5, -5.2, -31.5, 26.5); // ouest, au sud du mur du jardin
  muret(31.5, -26.5, 31.5, 13.3); // est, jusqu'à la route
  muret(-31.5, 26.5, 16.5, 26.5); // sud, jusqu'à la rivière
  muret(25.5, 26.5, 31.5, 26.5); // sud, au-delà de la rivière
}

// ---------- Les abords : saules, roseaux, nénuphars, la cabane à canards, le grand panneau ----------

function abords(k) {
  const { c, usure } = k;
  // Les saules pleureurs
  saule(c, 29.2, -15.5, 8.5, 0, [-1.4, 0.2], 0.2);
  saule(c, 27.2, -21.5, 7.5, 0, [-0.6, -0.2], 0.3); // sur la berge est : la levée et le halage restent dégagés
  saule(c, 12.6, 23.4, 8, 0, [0.8, 0.4], 0.3);
  // Un noyer derrière le logis, un arbre mort, des buissons
  arbre(c, -27.5, -21.5, 9, "feuillu");
  arbre(c, -2.5, 23, 6.5, "mort");
  for (const [x, z, s] of [[-30.5, -25.5, 1.4], [-20, -25.8, 1.2], [3, -25.5, 1.5], [-30.8, 12, 1.2], [-30.6, 22, 1.6], [-14, 25.5, 1.3], [5.5, 25.6, 1.2], [30.5, -25, 1.4], [30.8, 4, 1.2], [30.6, 25, 1.3], [-8.5, -25.8, 1.0]]) arbuste(c, x, z, s);
  // Les roseaux : au pied des quais, dans l'eau ; sur les berges du bief
  for (let i = 0; i < 20; i++) {
    const z = c.entre(-26.5, 26.5);
    if (z > 14 && z < 20) continue;
    roseaux(c, RIV.x1 + c.entre(0.5, 1.1), z, Y_BAS, c.entre(2.0, 2.6));
  }
  for (let i = 0; i < 22; i++) {
    const z = c.entre(-26.5, 26.5);
    if (z > 14 && z < 20) continue;
    roseaux(c, RIV.x2 - c.entre(0.5, 1.1), z, Y_BAS, c.entre(2.0, 2.7));
  }
  for (let i = 0; i < 16; i++) roseaux(c, c.hasard() < 0.5 ? BIEF.x1 + c.entre(0.45, 0.8) : BIEF.x2 - c.entre(0.45, 0.8), c.entre(-26.5, -9), Y_HAUT, c.entre(1.4, 1.9));
  for (let i = 0; i < 9; i++) roseaux(c, c.entre(RIV.x2 + 0.5, 27.5), c.entre(-26, 26), 0, c.entre(1.0, 1.5));
  // Les nénuphars sur l'eau calme du bief amont
  for (let i = 0; i < 16; i++) {
    const x = c.entre(BIEF.x1 + 0.6, BIEF.x2 - 0.6);
    const z = c.entre(-26.5, -9);
    c.poser(geoCyl(0.26, 0.26, 0.02, 7), M.mat, i % 3 ? 0x4f7a3a : 0x5f8a44, { x, y: Y_HAUT + 0.02, z, ry: c.hasard() * 3 }, { crasse: false, nuance: 0.06 });
    if (i % 5 === 0) c.boite(0.1, 0.08, 0.1, 0xf2eee2, { x: x + 0.1, y: Y_HAUT + 0.07, z, ry: 0.7 }, M.mat, { crasse: false });
  }
  // La cabane à canards sur pilotis, au milieu de la rivière : vide
  const xc = 21.4;
  const zc = -8.5;
  for (const [dx, dz] of [[-0.5, -0.4], [0.5, -0.4], [-0.5, 0.4], [0.5, 0.4]]) c.tube([xc + dx, FOND, zc + dz], [xc + dx, -0.6, zc + dz], 0.06, COUL.boisMouille, M.mat, 5);
  c.pave(xc - 0.7, -0.62, zc - 0.55, xc + 0.7, -0.54, zc + 0.55, COUL.boisGris, M.planches);
  c.pave(xc - 0.5, -0.54, zc - 0.38, xc + 0.5, 0.06, zc + 0.38, 0x8a7a62, M.planches, { nuance: 0.04 });
  c.pave(xc - 0.18, -0.54, zc + 0.37, xc + 0.18, -0.2, zc + 0.39, 0x1e1c1a, M.mat, { crasse: false });
  for (const s of [-1, 1]) c.boite(1.2, 0.04, 0.55, COUL.tuile, { x: xc, y: 0.2, z: zc + s * 0.22, rx: s * 0.6 }, M.mat, { crasse: false, nuance: 0.05 });
  c.boite(0.3, 0.03, 1.4, COUL.boisGris, { x: xc + 0.1, y: -1.1, z: zc + 1.2, rx: 0.42 }, M.planches);
  // Le seul canard du lieu : un appelant en plastique, coincé dans les roseaux
  c.repere({ x: 24.0, y: Y_BAS, z: -3.4, ry: 0.8 }, () => {
    c.poser(BOULE, M.satin, 0x8a7a5a, { y: 0.06, e: [0.22, 0.1, 0.13] }, { crasse: false });
    c.poser(BOULE, M.satin, 0x2f5a3a, { x: 0.18, y: 0.17, e: 0.07 }, { crasse: false });
    c.boite(0.07, 0.025, 0.04, 0xc79a3b, { x: 0.27, y: 0.16 }, M.satin, { crasse: false });
  });
  roseaux(c, 24.2, -3.0, Y_BAS, 2.3);
  // Le grand panneau de l'Expérience, sur la route de l'est
  c.repere({ x: 29.6, y: 0, z: 13.2, ry: -0.5 }, () => {
    for (const s of [-1, 1]) c.pave(s * 1.4 - 0.07, 0, -0.07, s * 1.4 + 0.07, 2.6, 0.07, COUL.alu, M.tole);
    c.pave(-1.75, 2.0, -0.04, 1.75, 2.75, 0.02, COUL.plastique, M.mat, { crasse: false });
    panneau(c, M.enseignes, R.enseigne, { y: 2.38, z: 0.03, rz: usure > 0.5 ? -0.04 : 0 }, 3.4, 0.43);
  });
  // Du lierre sur les murs de quai, des herbes au bord de l'eau
  semerTouffes(c, BIEF.x2 + 0.3, -26, RIV.x1 - 0.3, 3.5, Math.round(30 * usure + 10), COUL.herbe);
}

// ---------- Le camp des survivants, sur le pont ----------

function camp(k) {
  const { c, usure } = k;
  const y = 0.1;
  // Le brasero : un fût percé, ses flammes, des bûches
  c.poser(geoCyl(0.32, 0.3, 0.7, 10), M.tole, COUL.rouille, { x: 19.6, y: y + 0.35, z: 17.0 }, { nuance: 0.05 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * PI * 2;
    c.boite(0.08, 0.1, 0.02, 0xffa04a, { x: 19.6 + Math.cos(a) * 0.31, y: y + 0.4, z: 17.0 + Math.sin(a) * 0.31, ry: -a + PI / 2 }, M.mat, { crasse: false });
  }
  for (const ry of [0, PI / 3, -PI / 3]) panneau(c, M.lumineux, R.flamme, { x: 19.6, y: y + 1.05, z: 17.0, ry }, 0.5, 0.8);
  for (let i = 0; i < 5; i++) c.tube([18.4 + i * 0.12, y + 0.06, 17.9], [18.4 + i * 0.12, y + 0.06, 18.45], 0.06, 0x6a5038, M.mat, 5);
  // La bâche tendue contre le parapet, la couverture, les caisses
  c.boite(2.4, 0.03, 1.6, 0x4f6a5a, { x: 22.4, y: y + 0.9, z: 15.95, rx: 0.65 }, M.mat, { nuance: 0.04 });
  for (const x of [21.3, 23.5]) c.poutre([x, y, 16.7], [x, y + 1.0, 16.5], 0.04, COUL.boisGris, M.mat);
  c.boite(1.9, 0.12, 0.7, 0x7a5a48, { x: 22.4, y: y + 0.06, z: 16.0 }, M.mat, { nuance: 0.05 });
  c.pave(24.2, y, 17.9, 24.8, y + 0.45, 18.5, 0x8a7458, M.planches);
  c.pave(24.25, y + 0.45, 17.95, 24.75, y + 0.85, 18.45, 0x7a6448, M.planches);
  cylindre(c, M.tole, 0x5a6a5c, 23.6, y, 18.3, 0.12, 0.3, 8);
  // La canne à pêche posée sur le parapet, sa ligne dans la rivière
  c.poutre([20.8, 1.1, 18.8], [21.6, 2.4, 20.4], 0.03, 0x6a5038, M.mat);
  c.boite(0.008, 3.9, 0.008, 0xd8d8d0, { x: 21.65, y: 0.45, z: 20.5, rx: 0.05 }, M.mat, { crasse: false });
  // Le chemin de planches mouillées, des feuilles
  jonchee(c, 16, 15.6, 26, 18.4, Math.round(30 * usure + 10), undefined, 0.11);
}

// ---------- Textures dessinées ----------

function dessinerPlanches(g) {
  const a = aleatoire(47);
  g.fillStyle = "#cbbba2";
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) {
    let x = -a() * 80;
    while (x < 256) {
      const l = 90 + a() * 120;
      const v = 205 + Math.floor((a() - 0.5) * 40);
      g.fillStyle = `rgb(${v},${v - 10},${v - 24})`;
      g.fillRect(x + 1, y + 1, l - 2, 30);
      g.strokeStyle = "rgba(70,55,40,0.18)";
      for (let k = 0; k < 4; k++) {
        g.beginPath();
        g.moveTo(x, y + 5 + k * 6 + a() * 3);
        g.lineTo(x + l, y + 5 + k * 6 + a() * 3);
        g.stroke();
      }
      g.fillStyle = "rgba(40,30,20,0.6)";
      g.fillRect(x + 4, y + 14, 2, 2);
      g.fillRect(x + l - 6, y + 14, 2, 2);
      x += l;
    }
    g.fillStyle = "rgba(40,30,20,0.55)";
    g.fillRect(0, y, 256, 1.5);
  }
  taches(g, a, 10, "rgba(60,45,30,0.22)", 10, 40, 256, 256);
}

function dessinerTerrain(g) {
  const a = aleatoire(53);
  g.fillStyle = "#dcd8c8";
  g.fillRect(0, 0, 256, 256);
  taches(g, a, 26, "rgba(70,80,50,0.16)", 14, 46, 256, 256);
  taches(g, a, 18, "rgba(255,250,230,0.16)", 10, 36, 256, 256);
  for (let i = 0; i < 2600; i++) {
    const x = a() * 256;
    const y = a() * 256;
    g.fillStyle = a() < 0.55 ? `rgba(50,60,30,${0.08 + a() * 0.1})` : `rgba(255,255,235,${0.06 + a() * 0.08})`;
    g.fillRect(x, y, 1, 2 + a() * 3);
  }
}

function dessinerEau(g) {
  const a = aleatoire(61);
  g.fillStyle = "#c6d0ca";
  g.fillRect(0, 0, 128, 256);
  // Des filets étirés dans le sens du courant (v), raccordés en haut et en bas
  for (let i = 0; i < 150; i++) {
    const x = a() * 128;
    const y = a() * 256;
    const lg = 12 + a() * 46;
    g.fillStyle = a() < 0.55 ? `rgba(255,255,255,${0.18 + a() * 0.22})` : `rgba(20,40,30,${0.12 + a() * 0.14})`;
    const l = 1 + a() * 2.5;
    g.fillRect(x, y, l, lg);
    if (y + lg > 256) g.fillRect(x, y - 256, l, lg);
  }
  taches(g, a, 10, "rgba(255,255,255,0.12)", 10, 30, 128, 256);
}

function dessinerEcume(g) {
  const a = aleatoire(67);
  g.clearRect(0, 0, 128, 128);
  for (let i = 0; i < 150; i++) {
    const x = a() * 128;
    const y = a() * 128;
    const r = 1 + a() * 4.5;
    g.fillStyle = `rgba(255,255,255,${0.35 + a() * 0.5})`;
    for (const [dx, dy] of [[0, 0], [128, 0], [-128, 0], [0, 128], [0, -128]]) {
      g.beginPath();
      g.ellipse(x + dx, y + dy, r, r * (1.2 + a()), 0, 0, PI * 2);
      g.fill();
    }
  }
}

function texte(g, t, x, y, police, couleur, max, align = "center") {
  g.font = police;
  g.fillStyle = couleur;
  g.textAlign = align;
  g.textBaseline = "middle";
  g.fillText(t, x, y, max);
}

function salir(g, a, x, y, l, h, force = 1) {
  g.save();
  g.beginPath();
  g.rect(x, y, l, h);
  g.clip();
  g.translate(x, y);
  for (let i = 0; i < (l * h) / 260; i++) {
    g.fillStyle = a() < 0.5 ? `rgba(0,0,0,${0.05 * force})` : `rgba(255,255,255,${0.05 * force})`;
    g.fillRect(a() * l, a() * h, 1 + a() * 3, 1 + a() * 3);
  }
  taches(g, a, Math.round(4 * force), "rgba(90,70,45,0.22)", 8, Math.min(l, h) * 0.4, l, h);
  g.restore();
}

/** Ronge une région de l'atlas (peinture écaillée) : petites lacunes transparentes. */
function ronger(g, a, x, y, l, h, n) {
  g.save();
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < n; i++) {
    g.beginPath();
    g.ellipse(x + a() * l, y + a() * h, 2 + a() * 9, 1 + a() * 5, a() * 3, 0, PI * 2);
    g.fill();
  }
  g.restore();
}

function engrenage(g, cx, cy, r, dents, couleur) {
  g.fillStyle = couleur;
  g.beginPath();
  for (let i = 0; i < dents * 2; i++) {
    const a0 = (i / (dents * 2)) * PI * 2;
    const rr = i % 2 ? r : r * 1.22;
    g.lineTo(cx + Math.cos(a0) * rr, cy + Math.sin(a0) * rr);
    g.lineTo(cx + Math.cos(a0 + PI / dents) * rr, cy + Math.sin(a0 + PI / dents) * rr);
  }
  g.closePath();
  g.fill();
  g.save();
  g.globalCompositeOperation = "destination-out";
  g.beginPath();
  g.arc(cx, cy, r * 0.45, 0, PI * 2);
  g.fill();
  g.restore();
}

function dessinerAtlas(g) {
  const a = aleatoire(1789);
  g.clearRect(0, 0, AL, AH);
  // L'enseigne de l'Expérience : crème, filets rouges, épis
  {
    const [x, y, l, h] = R.enseigne;
    g.fillStyle = "#ece2c8";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#c8362b";
    g.fillRect(x, y + 6, l, 8);
    g.fillRect(x, y + h - 14, l, 8);
    texte(g, "EXPÉRIENCE FARINE AUTHENTIQUE", x + l / 2, y + h / 2 + 2, "900 58px sans-serif", "#b8342a", l - 190);
    for (const cx of [x + 52, x + l - 52]) {
      g.fillStyle = "#c79a3b";
      for (let i = 0; i < 6; i++) {
        g.beginPath();
        g.ellipse(cx + (i % 2 ? 9 : -9), y + 34 + i * 11, 8, 5, i % 2 ? -0.6 : 0.6, 0, PI * 2);
        g.fill();
      }
      g.fillRect(cx - 2, y + 40, 4, 64);
    }
    g.fillStyle = "rgba(236,226,200,0.45)";
    g.fillRect(x + 610, y + 20, 120, 90);
    salir(g, a, x, y, l, h, 1.6);
  }
  // L'enseigne peinte sur la brique, écaillée
  {
    const [x, y, l, h] = R.minoterie;
    texte(g, "MINOTERIE DU GUÉ", x + l / 2, y + 48, "bold 76px serif", "#ece4cc", l - 40);
    texte(g, "FARINES · SONS · ISSUES", x + l / 2, y + 104, "bold 32px serif", "#ece4cc", l - 200);
    ronger(g, a, x, y, l, h, 420);
  }
  // Le panneau « Farine moulue à l'ancienne par des robots »
  {
    const [x, y, l, h] = R.robots;
    g.fillStyle = "#f2ecdc";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, l, 44);
    texte(g, "NOTRE SAVOIR-FAIRE", x + l / 2, y + 23, "bold 26px sans-serif", "#f2ecdc", l - 40);
    texte(g, "FARINE MOULUE À L'ANCIENNE", x + 300, y + 88, "bold 25px sans-serif", "#3b2a1e", 400);
    texte(g, "PAR DES ROBOTS", x + 300, y + 132, "900 42px sans-serif", "#c8362b", 380);
    texte(g, "Tradition garantie par algorithme", x + 300, y + 178, "italic 19px sans-serif", "#5a4a3a", 390);
    // Le robot moustachu, son chapeau, sa meule
    g.fillStyle = "#9aa4aa";
    g.fillRect(x + 40, y + 100, 60, 52);
    g.fillRect(x + 50, y + 152, 40, 60);
    g.fillStyle = "#3b2a1e";
    g.fillRect(x + 32, y + 88, 76, 12);
    g.fillRect(x + 48, y + 66, 44, 24);
    g.fillStyle = "#1e2a30";
    g.fillRect(x + 52, y + 112, 10, 10);
    g.fillRect(x + 78, y + 112, 10, 10);
    g.fillStyle = "#3b2a1e";
    g.beginPath();
    g.ellipse(x + 60, y + 136, 14, 6, 0.3, 0, PI * 2);
    g.ellipse(x + 80, y + 136, 14, 6, -0.3, 0, PI * 2);
    g.fill();
    engrenage(g, x + 140, y + 200, 22, 10, "#c79a3b");
    g.fillStyle = "#c8362b";
    g.fillRect(x, y + h - 20, l, 20);
    salir(g, a, x, y, l, h, 1.4);
  }
  // L'écran de la borne
  {
    const [x, y, l, h] = R.borne;
    g.fillStyle = "#0e1a22";
    g.fillRect(x, y, l, h);
    const d = g.createRadialGradient(x + l / 2, y + h / 2, 10, x + l / 2, y + h / 2, l * 0.7);
    d.addColorStop(0, "rgba(80,160,200,0.35)");
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
    texte(g, "PÉTRISSEZ", x + l / 2, y + 52, "900 36px sans-serif", "#bfe8ff", l - 20);
    texte(g, "VIRTUELLEMENT !", x + l / 2, y + 92, "900 28px sans-serif", "#bfe8ff", l - 20);
    g.strokeStyle = "#9fd8ff";
    g.lineWidth = 5;
    g.beginPath();
    g.arc(x + l / 2, y + 160, 34, 0, PI * 2);
    g.stroke();
    g.fillStyle = "#9fd8ff";
    g.fillRect(x + l / 2 - 6, y + 138, 12, 36);
    texte(g, "touchez l'écran", x + l / 2, y + 222, "18px sans-serif", "#7fb8d8", l - 20);
  }
  // La flamme (feux, brasero)
  {
    const [x, y, l, h] = R.flamme;
    for (const [s, coul] of [[1, "#e8562a"], [0.75, "#f59a35"], [0.48, "#ffe08a"]]) {
      g.fillStyle = coul;
      g.beginPath();
      g.moveTo(x + l / 2, y + h * (1 - 0.95 * s) + 4);
      g.bezierCurveTo(x + l / 2 + l * 0.5 * s, y + h * 0.55, x + l / 2 + l * 0.45 * s, y + h - 6, x + l / 2, y + h - 4);
      g.bezierCurveTo(x + l / 2 - l * 0.45 * s, y + h - 6, x + l / 2 - l * 0.5 * s, y + h * 0.6, x + l / 2, y + h * (1 - 0.95 * s) + 4);
      g.fill();
    }
  }
  // La lueur de la lanterne
  {
    const [x, y, l, h] = R.lanterne;
    const d = g.createRadialGradient(x + l / 2, y + h / 2, 4, x + l / 2, y + h / 2, l / 2);
    d.addColorStop(0, "rgba(255,250,220,1)");
    d.addColorStop(0.5, "rgba(255,200,110,0.9)");
    d.addColorStop(1, "rgba(255,160,60,0)");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
  }
  // L'étiquette des pains
  {
    const [x, y, l, h] = R.etiquette;
    g.fillStyle = "#c8362b";
    g.fillRect(x, y + 16, l, h - 32);
    texte(g, "PAIN", x + l / 2, y + 42, "900 26px sans-serif", "#f2ecdc", l - 8);
    texte(g, "ARTISANAL*", x + l / 2, y + 68, "bold 16px sans-serif", "#f2ecdc", l - 8);
    texte(g, "*industriel", x + l / 2, y + 92, "italic 12px sans-serif", "#f2d0c0", l - 8);
  }
  // Le pochoir des sacs
  {
    const [x, y, l, h] = R.sac;
    g.fillStyle = "#b8a27a";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "rgba(80,60,40,0.25)";
    for (let i = 0; i < l; i += 4) {
      g.beginPath();
      g.moveTo(x + i, y);
      g.lineTo(x + i, y + h);
      g.stroke();
    }
    g.strokeStyle = "#3a4656";
    g.lineWidth = 4;
    g.beginPath();
    g.arc(x + 40, y + h / 2, 26, 0, PI * 2);
    g.stroke();
    texte(g, "FARINE DE BLÉ", x + 150, y + 48, "bold 24px serif", "#3a4656", 160);
    texte(g, "50 KG", x + 150, y + 86, "bold 30px serif", "#3a4656", 160);
    salir(g, a, x, y, l, h, 1.2);
  }
  // Le graffiti des survivants
  {
    const [x, y, l, h] = R.graffiti;
    engrenage(g, x + 54, y + h / 2, 30, 8, "#d8a83a");
    texte(g, "ELLE TOURNERA ENCORE", x + 290, y + h / 2, "900 46px sans-serif", "#f0ece2", l - 120);
    g.fillStyle = "#f0ece2";
    for (let i = 0; i < 9; i++) g.fillRect(x + 120 + a() * 360, y + h / 2 + 16, 3, 10 + a() * 26);
  }
  // Le chevalet « OFFRE TERROIR »
  {
    const [x, y, l, h] = R.offre;
    g.fillStyle = "#2c3a30";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "#8a6a48";
    g.lineWidth = 8;
    g.strokeRect(x + 4, y + 4, l - 8, h - 8);
    texte(g, "OFFRE TERROIR", x + l / 2, y + 44, "bold 30px sans-serif", "#ece8dc", l - 30);
    texte(g, "-30 %", x + l / 2, y + 88, "900 38px sans-serif", "#e6c84a", l - 30);
  }
  // Le carton « Maître Farinier »
  {
    const [x, y, l, h] = R.meunier;
    const cx = x + l / 2;
    g.fillStyle = "#c9ccce";
    g.fillRect(cx - 52, y + 130, 104, 160);
    g.fillRect(cx - 80, y + 140, 28, 100);
    g.fillRect(cx + 52, y + 140, 28, 100);
    g.fillRect(cx - 40, y + 290, 30, 70);
    g.fillRect(cx + 10, y + 290, 30, 70);
    g.fillStyle = "#f2ecdc";
    g.fillRect(cx - 50, y + 170, 100, 110);
    g.fillStyle = "#d8dadc";
    g.fillRect(cx - 44, y + 52, 88, 78);
    g.fillStyle = "#3b2a1e";
    g.fillRect(cx - 60, y + 40, 120, 14);
    g.fillRect(cx - 38, y + 6, 76, 36);
    g.fillStyle = "#1e2a30";
    g.beginPath();
    g.arc(cx - 18, y + 80, 7, 0, PI * 2);
    g.arc(cx + 18, y + 80, 7, 0, PI * 2);
    g.fill();
    g.fillStyle = "#3b2a1e";
    g.beginPath();
    g.ellipse(cx - 16, y + 104, 18, 7, 0.35, 0, PI * 2);
    g.ellipse(cx + 16, y + 104, 18, 7, -0.35, 0, PI * 2);
    g.fill();
    g.strokeStyle = "#c8362b";
    g.lineWidth = 4;
    g.beginPath();
    g.arc(cx, y + 108, 16, 0.2, PI - 0.2);
    g.stroke();
    g.fillStyle = "#c79a3b";
    g.beginPath();
    g.ellipse(cx + 70, y + 236, 30, 16, -0.4, 0, PI * 2);
    g.fill();
    g.fillStyle = "#c8362b";
    g.fillRect(x + 10, y + 362, l - 20, 20);
    texte(g, "MAÎTRE FARINIER", cx, y + 372, "bold 16px sans-serif", "#f2ecdc", l - 30);
    salir(g, a, x, y, l, h, 0.8);
  }
  // L'almanach de la cuisine
  {
    const [x, y, l, h] = R.almanach;
    g.fillStyle = "#efe6cf";
    g.fillRect(x, y, l, h);
    texte(g, "ALMANACH", x + l / 2, y + 26, "bold 26px serif", "#a8433a", l - 20);
    g.fillStyle = "#8fa6b8";
    g.fillRect(x + 28, y + 48, l - 56, 80);
    g.fillStyle = "#7a6a52";
    g.fillRect(x + 90, y + 82, 60, 46);
    g.beginPath();
    g.moveTo(x + 84, y + 84);
    g.lineTo(x + 120, y + 58);
    g.lineTo(x + 156, y + 84);
    g.fill();
    g.strokeStyle = "#5a4636";
    g.lineWidth = 3;
    g.beginPath();
    g.arc(x + 168, y + 110, 20, 0, PI * 2);
    g.stroke();
    g.fillStyle = "rgba(60,50,40,0.5)";
    for (let i = 0; i < 5; i++) for (let j = 0; j < 7; j++) g.fillRect(x + 30 + j * 28, y + 146 + i * 20, 18, 10);
    salir(g, a, x, y, l, h, 1.6);
  }
  // La plaque émaillée de la vanne
  {
    const [x, y, l, h] = R.plaque;
    g.fillStyle = "#2f4f7f";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "#e9e4d6";
    g.lineWidth = 6;
    g.strokeRect(x + 8, y + 8, l - 16, h - 16);
    texte(g, "PRISE D'EAU", x + l / 2, y + 46, "bold 40px sans-serif", "#e9e4d6", l - 40);
    texte(g, "DÉFENSE DE MANŒUVRER", x + l / 2, y + 90, "bold 26px sans-serif", "#e9e4d6", l - 40);
    ronger(g, a, x, y, l, h, 30);
  }
  // L'autocollant Watty, la pile souriante
  {
    const [x, y, l, h] = R.watty;
    const cx = x + l / 2;
    g.fillStyle = "#f2ecdc";
    g.beginPath();
    g.arc(cx, y + h / 2, 120, 0, PI * 2);
    g.fill();
    g.fillStyle = "#3f8f5a";
    g.fillRect(cx - 44, y + 60, 88, 130);
    g.fillRect(cx - 18, y + 46, 36, 16);
    g.fillStyle = "#e6c84a";
    g.fillRect(cx - 44, y + 60, 88, 44);
    g.fillStyle = "#1e2a30";
    g.beginPath();
    g.arc(cx - 16, y + 120, 7, 0, PI * 2);
    g.arc(cx + 16, y + 120, 7, 0, PI * 2);
    g.fill();
    g.strokeStyle = "#1e2a30";
    g.lineWidth = 5;
    g.beginPath();
    g.arc(cx, y + 140, 18, 0.2, PI - 0.2);
    g.stroke();
    texte(g, "Toujours plein,", cx, y + 210, "bold 20px sans-serif", "#2f6f73", 200);
    texte(g, "jamais à plat !", cx, y + 234, "bold 20px sans-serif", "#2f6f73", 200);
  }
  // La photo de mariage du meunier, sépia
  {
    const [x, y, l, h] = R.photo;
    g.fillStyle = "#4a3a2a";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#c8b48c";
    g.fillRect(x + 12, y + 12, l - 24, h - 24);
    g.fillStyle = "#5a4630";
    g.beginPath();
    g.arc(x + 50, y + 50, 12, 0, PI * 2);
    g.arc(x + 78, y + 46, 12, 0, PI * 2);
    g.fill();
    g.fillRect(x + 38, y + 62, 24, 40);
    g.fillStyle = "#efe6cf";
    g.fillRect(x + 66, y + 58, 26, 44);
    salir(g, a, x, y, l, h, 1);
  }
  {
    // Le panneau du chemin de halage (bois peint, lettres blanches délavées)
    const [x, y, l, h] = R.halage;
    g.fillStyle = "#4a5a48";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "#e8e2d0";
    g.lineWidth = 3;
    g.strokeRect(x + 5, y + 5, l - 10, h - 10);
    texte(g, "CHEMIN DE HALAGE", x + l / 2, y + 32, "bold 24px serif", "#ece6d4", l - 24);
    texte(g, "Le Gué · 2 km ↑", x + l / 2, y + 62, "italic 22px serif", "#ece6d4", l - 24);
    salir(g, a, x, y, l, h, 1);
  }
}
