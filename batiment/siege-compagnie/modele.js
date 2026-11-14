// Le siège de la Compagnie d'électricité (Book 20 §3.3, lieu spécial, Ville, lointain, danger ●●●●).
//
// Un siège social des années 1970 : une tour de bureaux de sept étages à mur-rideau bronze, posée sur un hall de
// marbre à double hauteur, ses ailerons de béton brut aux angles et « LA COMPAGNIE » en lettres sur la couronne.
// Devant, le parvis sur dalle, la fontaine et la statue géante de Watty, tombée face au ciel, les deux chaussures
// rouges restées sur le socle. À l'ouest, la cafétéria d'entreprise ; à l'est, l'aile technique : la salle du
// dispatching et son mur synoptique du réseau régional (quelques voyants clignotent encore sur batterie), les archives
// et leurs rayonnages roulants (les plans du réseau), la salle des batteries de secours (le trésor des Voltaïques),
// et le bureau du directeur, qui voulait voir le mur depuis son fauteuil.
// Les Voltaïques sont les anciens techniciens de la maison, les Compteurs viennent de ses bureaux (Book 15 §2.4, §3).
//
// Deux cartes (≤ 60 000 triangles, ≤ 40 appels de dessin chacune), bâties dans le même « repère du site » S
// (+x à l'est, +z au sud), puis recentrées sur leur lot :
// - « parvis » : le parvis et la statue, le hall, la cafétéria (x -32 → 13, z -14 → 36) ;
// - « dispatching » : le hall, le dispatching, les archives, les batteries, le bureau du directeur (x -14 → 46,
//   z -20 → 14).
// La tour est visible sur les deux cartes. On ne visite que le rez-de-chaussée : la mezzanine, les étages, la couronne
// et les toits sont des couches qui s'effacent. Les façades côté caméra (sud, est) sont coupées à hauteur d'allège.
//
// La salle des batteries était au sous-sol dans les plans d'origine : le jeu n'a qu'un niveau, on l'a « remontée » au
// rez-de-chaussée, derrière un rideau métallique de livraison.

import * as THREE from "three";
import {
  Batiment, PALETTE, MAT, matiere, matiereMonde, matiereTexture, matiereVerre, matiereEau, TEX, mur, lierre as lierreA, touffes,
  semerTouffes as semerA, gravats, debris as debrisA, jonchee as joncheeA, mousse, arbuste, arbre, raiDeLumiere as raiA, dessiner,
  taches, aleatoire,
} from "../commun/atelier.js";

// La végétation et le petit désordre coûtent cher en triangles : on les dose.
const lierre = (c, x, y0, z, ry, l, h, n) => lierreA(c, x, y0, z, ry, l, h, Math.round(n * 0.4));
const semerTouffes = (c, x1, z1, x2, z2, n, t, y) => semerA(c, x1, z1, x2, z2, Math.round(n * 0.45), t, y);
const debris = (c, x1, z1, x2, z2, n, t, y) => debrisA(c, x1, z1, x2, z2, Math.round(n * 0.6), t, y);
const jonchee = (c, x1, z1, x2, z2, n, t, y) => joncheeA(c, x1, z1, x2, z2, Math.round(n * 0.6), t, y);
// Un seul matériau de lueur pour tous les rais de lumière
const raiDeLumiere = (c, a, b, l) => raiA(c, a, b, l, 0.09);

// ---------- Le plan du site (repère S) ----------

const CUT = 0.9; // coupe des façades côté caméra (allège)
const CUTI = 1.2; // coupe des cloisons intérieures
const EP = 0.3; // murs
const EPI = 0.18; // cloisons
const HALL = { x0: -12, x1: 12, z0: -9, z1: 6, h: 9, mezz: 4.5, zMezz: -4.5 };
const TOUR = { x0: -12, x1: 12, z0: -9, z1: 3, y0: 9, niveaux: 7, hn: 3.4 };
const Y_COURONNE = TOUR.y0 + TOUR.niveaux * TOUR.hn; // 32,8
const CAFET = { x0: -28, x1: -12, z0: -9, z1: 4, h: 4.2 };
const AILE = { x0: 12, x1: 42, z0: -14, z1: 6, h: 5 };
const FONTAINE = { x: -2, z: 21, r: 6 };
const ETAGE_BRULE = 4;
const ETAGE_JUNGLE = 2;

const CENTRES = { parvis: { x: -9.5, z: 11 }, dispatching: { x: 16, z: -3 } };
const LOTS = { parvis: { l: 45, p: 50 }, dispatching: { l: 60, p: 34 } };

function arr(v) {
  return Math.round(v * 10) / 10;
}
function vers(id, points) {
  const o = CENTRES[id];
  return points.map((p) => ({ ...p, x: arr(p.x - o.x), z: arr(p.z - o.z) }));
}

// ---------- La fiche ----------

export const FICHE = {
  id: "siege-compagnie",
  nom: "Le siège de la Compagnie",
  lieu: "Siège de la Compagnie d'électricité · Ville · lointain (lieu spécial)",
  environnement: "ville",
  anneau: "lointain",
  danger: 4,
  recit:
    "Sept étages de verre bronze pour une seule promesse : « La Compagnie pense à tout. Ne pensez plus à rien. » Tout le monde a obéi, sauf les techniciens du sous-sol, qui sont devenus les Voltaïques, et les comptables, qui sont devenus les Compteurs. Watty est tombé de son socle face au ciel, en laissant ses chaussures ; au fond de l'aile technique, le mur du réseau régional clignote encore la nuit, pour personne.",
  inspiration:
    "Les sièges sociaux brutalistes et corporate des années 1970 (tour sur dalle, hall de marbre à double hauteur, mezzanines, murs-rideaux bronze, ailerons de béton brut), les centres de dispatching électrique et leurs murs synoptiques à voyants, les bureaux abandonnés de l'urbex (papiers partout, stores de travers, plantes vertes devenues jungle)",
  reperes: [
    "La tour : mur-rideau bronze dont des panneaux sont tombés, un étage noirci par l'incendie, un étage où les ficus sont devenus jungle et débordent des fenêtres, la bâche « La Compagnie pense à tout » qui pend",
    "La couronne : « LA COMPAGNIE » en lettres (le P pend de travers), le grand logo à l'éclair sur la face est, l'antenne",
    "Le parvis sur dalle : la fontaine croupie et la statue géante de Watty renversée, face au ciel ; ses chaussures rouges sont restées sur le socle",
    "Le hall de marbre noir et blanc à double hauteur : escalators figés vers la mezzanine, le grand logo, l'accueil en arc, les portiques, la vitrine des trophées « Meilleur taux d'abonnement », la borne « Votre consommation est exemplaire ! » qui luit encore",
    "Le campement des Voltaïques sous la mezzanine : lampe blanc froid sur batterie, duvets, câbles",
    "La cafétéria d'entreprise : self, plateaux, machine à café connectée, ficus devenu arbre",
    "La salle du dispatching : le mur synoptique du réseau régional (annoté à la craie par les Voltaïques), les pupitres en arc, les fauteuils renversés, le faux plancher soulevé ; la nuit, quelques voyants clignotent",
    "Les archives : rayonnages roulants à volants, cartons, meubles à plans, les plans du réseau (précieux)",
    "La salle des batteries de secours : armoires de batteries, onduleurs, l'établi des Voltaïques derrière le rideau métallique",
    "Le bureau du directeur : moquette, maquette de la centrale sous verre, portrait, trophées, vue sur le mur synoptique",
  ],
  cartes: [
    {
      id: "parvis",
      nom: "Le parvis et le hall",
      lot: LOTS.parvis,
      depart: vers("parvis", [{ x: -10, z: 33 }])[0],
      description: "le parvis et la statue de Watty, le hall de marbre, la cafétéria d'entreprise",
      entrees: vers("parvis", [
        { x: -10, z: 35.5, nature: "le parvis, depuis la rue" },
        { x: 3.75, z: 6, nature: "la porte vitrée du hall, brisée (à côté du tambour figé)" },
        { x: -5.25, z: 6, nature: "un panneau du mur-rideau tombé, à gauche du tambour" },
        { x: -16, z: 4, nature: "la porte de la terrasse de la cafétéria" },
        { x: 12, z: -5, nature: "la double porte « DISPATCHING », à l'est du hall (vers la carte « le dispatching et les archives »)" },
        { x: 4, z: -9, nature: "la porte de service du hall, au nord" },
        { x: -26, z: -9, nature: "la porte de service de la cuisine, au nord" },
      ]),
      fouille: vers("parvis", [
        { x: 0, z: -0.6, quoi: "comptoir d'accueil : badges, trousseau de clés étiquetées (dont « ARCHIVES »), registres, lampe de bureau" },
        { x: 5.2, z: 4.4, quoi: "borne « Votre consommation est exemplaire ! » : batterie encore chargée, écran, carte électronique" },
        { x: 11.4, z: 1.5, quoi: "vitrine des trophées : coupes en laiton (métal), plaques gravées" },
        { x: 9.5, z: -7.2, quoi: "campement des Voltaïques : rouleau de câble, ampoules, une batterie à moitié pleine (on la remarque, on la laisse ?)" },
        { x: -8, z: 4.1, quoi: "machinerie des escalators, sous la plaque de visite : chaîne, moteur, huile" },
        { x: -21, z: -7.6, quoi: "self de la cafétéria : conserves, sucre, café lyophilisé, couverts, plateaux" },
        { x: -14.8, z: -7.8, quoi: "machine à café connectée : capsules, pompe, écran (« Mise à jour en cours : 3 % »)" },
        { x: 7.2, z: 20.8, quoi: "camionnette d'intervention de la Compagnie : caisse à outils, câble, échelle, batterie de démarrage" },
        { x: 0.6, z: 26.8, quoi: "la prise de Watty : trois mètres de vrai câble de cuivre dans la résine" },
      ]),
      eteints: vers("parvis", [
        { x: -6, z: 16, type: "errant (autour de la fontaine)" },
        { x: 4, z: 28, type: "errant (près de la tête de Watty)" },
        { x: -18, z: 24, type: "errant (parvis)" },
        { x: -24, z: 10, type: "errant (terrasse de la cafétéria)" },
        { x: 8, z: 14.5, type: "errant (sous les mâts)" },
        { x: 1, z: 18.6, type: "rampant (dans l'eau verte du bassin)" },
        { x: -10.4, z: 2.6, type: "rampant (au pied de l'escalator)" },
        { x: -20, z: -2.5, type: "putréfié (entre les tables de la cafétéria)" },
        { x: 0.5, z: -2.2, type: "ancien habitant (hôtesse d'accueil, foulard aux couleurs de la Compagnie)" },
        { x: 6.5, z: -1.6, type: "ancien habitant (cadre en costume, badge autour du cou, coincé dans un portique)" },
        { x: -24, z: -7.6, type: "ancien habitant (cuisinier de la cafétéria, toque)" },
        { x: -3, z: 9, type: "équipé (agent de sécurité, casque et matraque)" },
      ]),
    },
    {
      id: "dispatching",
      nom: "Le dispatching et les archives",
      lot: LOTS.dispatching,
      depart: vers("dispatching", [{ x: 2, z: 11 }])[0],
      description: "le hall, la salle du dispatching et son mur synoptique, les archives, la salle des batteries, le bureau du directeur",
      entrees: vers("dispatching", [
        { x: 3.75, z: 6, nature: "la porte vitrée du hall, brisée (vers la carte « le parvis et le hall »)" },
        { x: 12, z: -5, nature: "la double porte « DISPATCHING », du hall à la salle" },
        { x: 25, z: 6, nature: "la porte de service de l'aile technique, sous le néon « ISSUE DE SECOURS »" },
        { x: 42, z: 0, nature: "le rideau métallique de la salle des batteries, à demi levé (passage des Voltaïques)" },
        { x: 38, z: -14, nature: "l'issue de secours des archives, au nord" },
        { x: 4, z: -9, nature: "la porte de service du hall, au nord" },
      ]),
      fouille: vers("dispatching", [
        { x: 20, z: -3.6, quoi: "pupitre du chef de salle : relais, voyants, fusibles, petite électronique, carnet de consignes" },
        { x: 15.8, z: -8.4, quoi: "pupitres : écrans cathodiques, claviers, câbles en nappe" },
        { x: 20, z: -13, quoi: "mur synoptique : voyants et lampes de rechange dans les tiroirs du socle" },
        { x: 34.5, z: -7, quoi: "rayonnages roulants : cartons d'archives (papier), classeurs « Abonnés »" },
        { x: 31, z: -5.6, quoi: "meubles à plans : les plans du réseau régional (précieux : les Voltaïques les échangent cher)" },
        { x: 39.5, z: -6.4, quoi: "table à dessin : le plan des postes de la Ville, déroulé, annoté au crayon" },
        { x: 32.5, z: -2.5, quoi: "armoires de batteries de secours : des batteries encore pleines (lourdes ; le trésor des Voltaïques)" },
        { x: 38, z: -4.2, quoi: "onduleurs : cuivre, condensateurs, ventilateurs" },
        { x: 40.6, z: 3.4, quoi: "établi des Voltaïques : pinces, multimètre, fer à souder, fil" },
        { x: 17, z: 2.2, quoi: "bureau du directeur : clé du coffre, stylo plume, bouteille de cognac, carte du réseau encadrée" },
        { x: 14.2, z: 4.4, quoi: "maquette de la centrale sous verre : petit moteur de démonstration, ampoules" },
        { x: 21.4, z: 4.6, quoi: "coffre-fort du directeur (fermé : clé du bureau ou pied-de-biche) : wotts d'avant, en liasse" },
      ]),
      eteints: vers("dispatching", [
        { x: 17.2, z: -5.6, type: "ancien habitant (opérateur du dispatching, casque-micro)" },
        { x: 23.4, z: -6.3, type: "ancien habitant (opératrice, assise devant son pupitre)" },
        { x: 20, z: -12, type: "errant (devant le mur synoptique)" },
        { x: 26, z: -3, type: "errant (dispatching)" },
        { x: 33, z: -9.5, type: "rampant (entre deux rayonnages roulants)" },
        { x: 37.5, z: -12.5, type: "rampant (sous les cartons tombés)" },
        { x: 40, z: -8, type: "putréfié (archives)" },
        { x: 34, z: 3, type: "errant (entre les armoires de batteries)" },
        { x: 36, z: -0.6, type: "équipé (technicien en combinaison anti-acide, visière)" },
        { x: 17, z: 3.4, type: "ancien habitant (le directeur, costume trois-pièces, toujours dans son fauteuil)" },
        { x: -4, z: 2, type: "errant (hall)" },
        { x: 25, z: 2, type: "errant (couloir de service)" },
      ]),
    },
  ],
};


// ---------- Couleurs ----------

const COUL = {
  beton: 0xc2bfb6,
  betonClair: 0xd6d3ca,
  betonSombre: 0x96938b,
  bronze: 0x4a4036, // menuiseries anodisées
  allege: 0x5e5850, // panneaux d'allège du mur-rideau
  verreBronze: 0xb8a078,
  marbreNoir: 0x2b2a29,
  marbreBlanc: 0xe2ded4,
  inox: 0xb9bcb8,
  laiton: 0xb59048,
  watty: 0xd2bd45,
  wattyCape: 0x3b2a1e,
  rougeWatty: 0xb8392e,
  gant: 0xe4ded0,
  canard: 0x3f6f73,
  beige: 0xcdc4ae, // plastique beige des écrans et claviers
  gris: 0x8b8d8a,
  grisFonce: 0x55575a,
  tole: 0x7d8580,
  moquette: 0x8a5a3c,
  bois: 0x6e4a32,
  cuir: 0x4a2c22,
  carton: 0xb4976a,
  papier: 0xe6e1d2,
  asphalte: 0x77756f,
  dalle: 0xc9c3b4,
  suie: 0x252321,
  vert: 0x4f7a3c,
};

// ---------- Matières propres au lieu (créées une fois, partagées) ----------

const AL = 1024;
const AH = 2048;

/** L'atlas des enseignes, affiches, écrans et décalcomanies (une seule matière) : [x, y, l, h] en pixels. */
const R = {
  synoptique: [0, 0, 1024, 292],
  logo: [0, 292, 320, 320],
  couronne: [320, 292, 704, 128],
  titreHall: [320, 420, 704, 96],
  plaqueWatty: [320, 516, 352, 96],
  horloge: [672, 516, 352, 96],
  affiche: [0, 612, 256, 384],
  borne: [256, 612, 256, 384],
  trophee: [512, 612, 256, 96],
  issue: [768, 612, 256, 96],
  portrait: [512, 708, 256, 288],
  menu: [768, 708, 256, 288],
  visage: [0, 996, 256, 256],
  eclair: [256, 996, 128, 256],
  archives: [384, 996, 320, 96],
  batteries: [384, 1092, 320, 96],
  dispatching: [704, 996, 320, 96],
  graffiti: [704, 1092, 320, 160],
  plan: [0, 1252, 384, 256],
  camion: [384, 1252, 640, 128],
  cafe: [384, 1380, 256, 128],
  premium: [640, 1380, 384, 128],
  banniere: [0, 1508, 256, 512],
  lettreP: [256, 1508, 128, 128],
  borneRecharge: [384, 1508, 256, 384],
  notes: [640, 1508, 384, 256],
};

let MATS = null;

function matieres() {
  if (MATS) return MATS;
  const atlas = dessiner("siege-atlas", AL, AH, dessinerAtlas, false);
  const enseignes = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.8, alphaTest: 0.5, side: THREE.DoubleSide });
  const neon = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 1.1, vertexColors: true, roughness: 0.5, alphaTest: 0.5, side: THREE.DoubleSide });
  neon.userData.sansOmbre = true;
  const tex = (cle, l, h, f, tuile, options) => {
    const m = matiereTexture(dessiner(cle, l, h, f), options);
    m.userData.tuile = tuile;
    return m;
  };
  // Marbre noir et blanc en carreaux de 1 m (le damier de l'atelier, à plus grande échelle)
  const damier = matiereTexture(TEX.damier(), { roughness: 0.3 });
  damier.userData.tuile = 4;
  MATS = {
    beton: matiereMonde("beton"),
    enduit: matiereMonde("enduit"),
    carrelage: matiereMonde("carrelage"),
    damier,
    dalle: tex("siege-dalle", 256, 256, dessinerDalle, 6, { roughness: 0.95 }),
    moquette: tex("siege-moquette", 128, 128, dessinerMoquette, 2, { roughness: 1 }),
    plancher: tex("siege-plancher", 256, 256, dessinerPlancher, 2.4, { roughness: 0.7 }),
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    eau: matiereEau(0x7d9a62, 0.85),
    enseignes,
    neon,
    mat: matiere(0.95),
    satin: matiere(0.6, 0.05),
    lisse: matiere(0.3, 0.05),
    tole: MAT.tole(),
    metal: matiere(0.4, 0.7),
  };
  return MATS;
}

// ---------- Textures dessinées ----------

function salir(g, a, x, y, l, h, force = 1) {
  g.save();
  g.beginPath();
  g.rect(x, y, l, h);
  g.clip();
  for (let i = 0; i < (l * h) / 220; i++) {
    g.fillStyle = a() < 0.5 ? `rgba(0,0,0,${0.05 * force})` : `rgba(255,255,255,${0.05 * force})`;
    g.fillRect(x + a() * l, y + a() * h, 1 + a() * 3, 1 + a() * 3);
  }
  for (let i = 0; i < 6 * force; i++) {
    const cx = x + a() * l;
    const lg = h * (0.3 + a() * 0.8);
    const d = g.createLinearGradient(0, y, 0, y + lg);
    d.addColorStop(0, `rgba(60,52,40,${0.2 * force})`);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(cx, y, 2 + a() * 6, lg);
  }
  g.restore();
}

function texte(g, t, x, y, taille, couleur, police = "900", align = "center", rotation = 0, famille = '"Arial Black", "Helvetica Neue", Arial, sans-serif') {
  g.save();
  g.translate(x, y);
  g.rotate(rotation);
  g.font = `${police} ${taille}px ${famille}`;
  g.fillStyle = couleur;
  g.textAlign = align;
  g.textBaseline = "middle";
  g.fillText(t, 0, 0);
  g.restore();
}

/** Une écriture à la main (feutre, craie, bombe). */
function main(g, t, x, y, taille, couleur, rotation = 0, align = "center") {
  texte(g, t, x, y, taille, couleur, "700", align, rotation, '"Marker Felt", "Comic Sans MS", "Chalkboard SE", cursive');
}

/** L'éclair de la Compagnie, centré en (cx, cy), de hauteur h. */
function eclair(g, cx, cy, h, couleur) {
  const s = h / 100;
  g.fillStyle = couleur;
  g.beginPath();
  g.moveTo(cx + 10 * s, cy - 50 * s);
  g.lineTo(cx - 22 * s, cy + 6 * s);
  g.lineTo(cx - 2 * s, cy + 6 * s);
  g.lineTo(cx - 12 * s, cy + 50 * s);
  g.lineTo(cx + 24 * s, cy - 10 * s);
  g.lineTo(cx + 4 * s, cy - 10 * s);
  g.lineTo(cx + 16 * s, cy - 50 * s);
  g.closePath();
  g.fill();
}

/** Le logo de la Compagnie : un disque rouge, l'éclair crème, un anneau canard. */
function logo(g, cx, cy, r) {
  g.fillStyle = "#2f6f73";
  g.beginPath();
  g.arc(cx, cy, r, 0, 7);
  g.fill();
  g.fillStyle = "#e9dfc6";
  g.beginPath();
  g.arc(cx, cy, r * 0.86, 0, 7);
  g.fill();
  g.fillStyle = "#c8362b";
  g.beginPath();
  g.arc(cx, cy, r * 0.76, 0, 7);
  g.fill();
  eclair(g, cx, cy, r * 1.25, "#e9dfc6");
}

/** Watty en petit : une pile jaune qui sourit (Book 18 §6.1). */
function petitWatty(g, cx, cy, h, clin = true) {
  const l = h * 0.48;
  g.fillStyle = "#3b2a1e";
  g.fillRect(cx - l * 0.18, cy - h / 2 - h * 0.07, l * 0.36, h * 0.08);
  g.fillRect(cx - l / 2, cy - h / 2, l, h * 0.16);
  g.fillStyle = "#d8c43a";
  g.fillRect(cx - l / 2, cy - h / 2 + h * 0.16, l, h * 0.84);
  g.fillStyle = "rgba(255,255,255,0.25)";
  g.fillRect(cx - l / 2 + l * 0.12, cy - h / 2 + h * 0.18, l * 0.12, h * 0.78);
  // les yeux (un clin d'œil) et le sourire
  g.fillStyle = "#2a2018";
  g.beginPath();
  g.ellipse(cx - l * 0.18, cy - h * 0.12, l * 0.07, h * 0.05, 0, 0, 7);
  g.fill();
  g.strokeStyle = "#2a2018";
  g.lineWidth = Math.max(2, h * 0.025);
  g.beginPath();
  if (clin) g.arc(cx + l * 0.18, cy - h * 0.1, l * 0.08, Math.PI * 1.1, Math.PI * 1.9);
  else g.ellipse(cx + l * 0.18, cy - h * 0.12, l * 0.07, h * 0.05, 0, 0, 7);
  g.stroke();
  g.beginPath();
  g.arc(cx, cy - h * 0.02, l * 0.26, 0.25, Math.PI - 0.25);
  g.stroke();
  eclair(g, cx, cy + h * 0.24, h * 0.3, "#c8362b");
  // les chaussures rouges
  g.fillStyle = "#c8362b";
  g.fillRect(cx - l * 0.5, cy + h / 2, l * 0.42, h * 0.07);
  g.fillRect(cx + l * 0.08, cy + h / 2, l * 0.42, h * 0.07);
}

/** Les postes du réseau régional sur le mur synoptique (u, v dans [0, 1] de la zone de la carte). */
const POSTES = [
  { n: "BARRAGE", u: 0.42, v: 0.26, debout: true },
  { n: "LES MONTS", u: 0.2, v: 0.3 },
  { n: "COL", u: 0.07, v: 0.48 },
  { n: "CENTRALE", u: 0.6, v: 0.64, debout: true },
  { n: "VILLE-NORD", u: 0.78, v: 0.3 },
  { n: "VILLE-CENTRE", u: 0.88, v: 0.5 },
  { n: "ZONE IND.", u: 0.7, v: 0.86 },
  { n: "VALLÉE", u: 0.32, v: 0.62 },
  { n: "BOURG", u: 0.18, v: 0.82 },
  { n: "LITTORAL", u: 0.05, v: 0.86 },
  { n: "SIÈGE", u: 0.93, v: 0.76, debout: true },
  { n: "POSTE 7", u: 0.53, v: 0.44 },
];
const LIGNES = [
  [0, 1, 0], [0, 11, 0], [11, 3, 0], [3, 6, 0], [0, 4, 0], [4, 5, 1], [5, 10, 1], [3, 10, 1], [1, 2, 1], [1, 7, 1], [7, 3, 1],
  [7, 8, 2], [8, 9, 2], [2, 9, 2], [11, 4, 2], [6, 10, 2],
];
/** Zone de la carte dans la région du synoptique (en pixels de la région). */
const ZONE_SYN = { x: 24, y: 46, l: 976, h: 228 };

function dessinerSynoptique(g, a) {
  const [x, y, l, h] = R.synoptique;
  // Le panneau : une mosaïque de petits carreaux vert-de-gris
  g.fillStyle = "#3a4642";
  g.fillRect(x, y, l, h);
  for (let i = 0; i < l; i += 12) for (let j = 34; j < h; j += 12) {
    const v = 58 + Math.floor((a() - 0.5) * 8);
    g.fillStyle = `rgb(${v - 4},${v + 8},${v + 2})`;
    g.fillRect(x + i + 0.5, y + j + 0.5, 11, 11);
  }
  // Le bandeau du titre
  g.fillStyle = "#1f2624";
  g.fillRect(x, y, l, 34);
  texte(g, "RÉSEAU RÉGIONAL · CONDUITE EN TEMPS RÉEL", x + l / 2, y + 18, 22, "#d9d3c0", "800");
  logo(g, x + 30, y + 17, 13);
  logo(g, x + l - 30, y + 17, 13);
  // Les lignes (tracé orthogonal, comme sur les vrais tableaux) : 400 kV rouge, 225 kV vert, 63 kV bleu
  const tons = ["#c8503d", "#5fa463", "#5f8fc4"];
  const px = (p) => x + ZONE_SYN.x + p.u * ZONE_SYN.l;
  const py = (p) => y + ZONE_SYN.y + p.v * ZONE_SYN.h;
  g.lineCap = "square";
  for (const [i, j, n] of LIGNES) {
    const p = POSTES[i];
    const q = POSTES[j];
    g.strokeStyle = tons[n];
    g.lineWidth = 6 - n * 1.5;
    g.beginPath();
    g.moveTo(px(p), py(p));
    g.lineTo(px(q), py(p));
    g.lineTo(px(q), py(q));
    g.stroke();
    // Un disjoncteur au milieu : carré blanc (fermé) ou vide (ouvert)
    const mx = (px(p) + px(q)) / 2;
    g.fillStyle = a() < 0.6 ? "#1f2624" : "#e6e1d2";
    g.fillRect(mx - 5, py(p) - 5, 10, 10);
    g.strokeStyle = "#e6e1d2";
    g.lineWidth = 1.5;
    g.strokeRect(mx - 5, py(p) - 5, 10, 10);
  }
  // Les postes : un carré, son nom
  for (const p of POSTES) {
    g.fillStyle = "#e6e1d2";
    g.fillRect(px(p) - 9, py(p) - 9, 18, 18);
    g.fillStyle = "#1f2624";
    g.fillRect(px(p) - 5, py(p) - 5, 10, 10);
    texte(g, p.n, px(p), py(p) + 19, 12, "#e6e1d2", "800");
  }
  // Le lac du barrage, la centrale
  g.fillStyle = "rgba(95,143,196,0.55)";
  g.beginPath();
  g.ellipse(px(POSTES[0]) - 40, py(POSTES[0]) - 22, 46, 14, 0.1, 0, 7);
  g.fill();
  // Des carreaux tombés (trous noirs), une tache d'eau
  for (let i = 0; i < 26; i++) {
    g.fillStyle = "#151918";
    g.fillRect(x + Math.floor(a() * 85) * 12, y + 34 + Math.floor(a() * 21) * 12, 12, 12);
  }
  taches(g, a, 4, "rgba(30,28,22,0.35)", 20, 60, l, h);
  // La craie des Voltaïques : postes encore debout entourés, lignes barrées, un décompte
  g.strokeStyle = "rgba(240,238,228,0.85)";
  g.lineWidth = 3;
  for (const p of POSTES.filter((q) => q.debout)) {
    g.beginPath();
    g.ellipse(px(p), py(p) + 4, 40, 26, -0.1, 0, Math.PI * 1.9);
    g.stroke();
  }
  for (const i of [2, 5, 8, 9]) {
    const p = POSTES[i];
    g.beginPath();
    g.moveTo(px(p) - 12, py(p) - 12);
    g.lineTo(px(p) + 12, py(p) + 12);
    g.moveTo(px(p) + 12, py(p) - 12);
    g.lineTo(px(p) - 12, py(p) + 12);
    g.stroke();
  }
  main(g, "ENCORE DEBOUT", px(POSTES[0]) + 70, py(POSTES[0]) - 28, 20, "rgba(240,238,228,0.9)", -0.06);
  main(g, "9 postes HS — V.", x + 150, y + 262, 22, "rgba(240,238,228,0.85)", -0.03);
  main(g, "on répare →", px(POSTES[3]) - 110, py(POSTES[3]) + 34, 20, "rgba(240,238,228,0.85)", 0.04);
}

function dessinerAtlas(g) {
  const a = aleatoire(1974);
  g.clearRect(0, 0, AL, AH);

  dessinerSynoptique(g, a);

  // Le logo (disque), sur fond transparent
  {
    const [x, y, l] = R.logo;
    logo(g, x + l / 2, y + l / 2, l / 2 - 6);
    salir(g, a, x + 30, y + 30, l - 60, l - 60, 0.8);
  }
  // « LA COMPAGNIE » en lettres de la couronne (le P est tombé : il est dessiné à part)
  {
    const [x, y, l, h] = R.couronne;
    const lettres = "LA COMPAGNIE";
    const pas = l / lettres.length;
    for (let i = 0; i < lettres.length; i++) {
      if (lettres[i] === " " || i === 6) continue;
      texte(g, lettres[i], x + pas * (i + 0.5), y + h / 2 + 4, 108, i === 10 ? "#cfc6b0" : "#e6dfcc");
    }
    // La trace du P tombé
    texte(g, "P", x + pas * 6.5, y + h / 2 + 4, 108, "rgba(60,50,40,0.25)");
    salir(g, a, x, y, l, h, 0.8);
  }
  // La lettre P, seule
  {
    const [x, y, l, h] = R.lettreP;
    texte(g, "P", x + l / 2, y + h / 2 + 4, 108, "#e6dfcc");
  }
  // « COMPAGNIE D'ÉLECTRICITÉ » en lettres de laiton (hall)
  {
    const [x, y, l, h] = R.titreHall;
    texte(g, "COMPAGNIE D'ÉLECTRICITÉ", x + l / 2, y + h / 2, 50, "#c9a65a");
    taches(g, a, 6, "rgba(60,80,60,0.35)", 6, 20, l, h);
  }
  // La plaque du socle de Watty
  {
    const [x, y, l, h] = R.plaqueWatty;
    g.fillStyle = "#a9884a";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "#5e4a26";
    g.lineWidth = 4;
    g.strokeRect(x + 6, y + 6, l - 12, h - 12);
    texte(g, "WATTY", x + l / 2, y + 34, 34, "#3a2c18");
    texte(g, "Toujours plein, jamais à plat !", x + l / 2, y + 68, 20, "#3a2c18", "800");
    taches(g, a, 8, "rgba(60,120,100,0.45)", 6, 22, l, h);
  }
  // L'horloge numérique du dispatching, arrêtée
  {
    const [x, y, l, h] = R.horloge;
    g.fillStyle = "#161616";
    g.fillRect(x, y, l, h);
    texte(g, "88:88:88", x + l / 2, y + h / 2 + 2, 62, "rgba(200,60,40,0.18)", "700", "center", 0, '"Courier New", monospace');
    texte(g, "00:00:00", x + l / 2, y + h / 2 + 2, 62, "rgba(220,70,45,0.55)", "700", "center", 0, '"Courier New", monospace');
  }
  // L'affiche « La Compagnie pense à tout. Ne pensez plus à rien. », corrigée au feutre
  {
    const [x, y, l, h] = R.affiche;
    g.fillStyle = "#e9dfc6";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#c8362b";
    g.fillRect(x, y, l, 70);
    texte(g, "LA COMPAGNIE", x + l / 2, y + 36, 30, "#e9dfc6");
    petitWatty(g, x + l / 2, y + 160, 140);
    texte(g, "La Compagnie", x + l / 2, y + 268, 25, "#2f2a24", "900");
    texte(g, "pense à tout.", x + l / 2, y + 296, 25, "#2f2a24", "900");
    texte(g, "Ne pensez plus à rien.", x + l / 2, y + 334, 19, "#c8362b", "900");
    // « à rien » barré, « réfléchis, toi »
    g.strokeStyle = "#1f2a44";
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(x + 150, y + 336);
    g.lineTo(x + 232, y + 328);
    g.stroke();
    main(g, "réfléchis, toi", x + l / 2 + 8, y + 364, 24, "#1f2a44", -0.05);
    salir(g, a, x, y, l, h, 1.4);
  }
  // L'écran de la borne : « Votre consommation est exemplaire ! »
  {
    const [x, y, l, h] = R.borne;
    const d = g.createLinearGradient(0, y, 0, y + h);
    d.addColorStop(0, "#16384a");
    d.addColorStop(1, "#0d2230");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
    logo(g, x + l / 2, y + 40, 24);
    // La jauge : tout est au vert
    g.lineWidth = 16;
    const cx = x + l / 2;
    const cy = y + 170;
    for (const [a0, a1, c] of [[Math.PI, Math.PI * 1.33, "#e05a3a"], [Math.PI * 1.33, Math.PI * 1.66, "#e0b040"], [Math.PI * 1.66, Math.PI * 2, "#4fc46a"]]) {
      g.strokeStyle = c;
      g.beginPath();
      g.arc(cx, cy, 70, a0, a1);
      g.stroke();
    }
    g.strokeStyle = "#f2f2e8";
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(cx + 58, cy - 26);
    g.stroke();
    texte(g, "Votre consommation", cx, y + 220, 21, "#eaf6ff", "800");
    texte(g, "est exemplaire !", cx, y + 248, 25, "#7ff09a", "900");
    texte(g, "+ 2 400 % ce mois-ci · Bravo !", cx, y + 282, 13, "#9cc7dd", "700");
    texte(g, "Touchez l'écran pour consommer plus", cx, y + 352, 12, "#9cc7dd", "600");
    // Une fêlure
    g.strokeStyle = "rgba(230,240,255,0.5)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x + 40, y + h);
    g.lineTo(x + 70, y + 300);
    g.lineTo(x + 60, y + 250);
    g.lineTo(x + 110, y + 190);
    g.stroke();
  }
  // Les plaques des trophées
  {
    const [x, y, l, h] = R.trophee;
    g.fillStyle = "#b8954e";
    g.fillRect(x, y, l, h);
    texte(g, "MEILLEUR TAUX", x + l / 2, y + 26, 26, "#3a2c18");
    texte(g, "D'ABONNEMENT", x + l / 2, y + 54, 26, "#3a2c18");
    texte(g, "Région Nord · trois années de suite", x + l / 2, y + 80, 13, "#4a3a20", "700");
    salir(g, a, x, y, l, h, 0.7);
  }
  // ISSUE DE SECOURS (néon vert)
  {
    const [x, y, l, h] = R.issue;
    g.fillStyle = "#1f8a4c";
    g.fillRect(x, y, l, h);
    texte(g, "ISSUE DE", x + l * 0.6, y + 30, 30, "#effff4");
    texte(g, "SECOURS", x + l * 0.6, y + 66, 30, "#effff4");
    g.fillStyle = "#effff4";
    g.beginPath();
    g.arc(x + 40, y + 24, 9, 0, 7);
    g.fill();
    g.strokeStyle = "#effff4";
    g.lineWidth = 8;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x + 38, y + 38);
    g.lineTo(x + 32, y + 62);
    g.lineTo(x + 18, y + 80);
    g.moveTo(x + 32, y + 62);
    g.lineTo(x + 50, y + 76);
    g.moveTo(x + 22, y + 46);
    g.lineTo(x + 38, y + 38);
    g.lineTo(x + 54, y + 50);
    g.stroke();
  }
  // Le portrait du directeur : cadre doré, silhouette en costume, épinglette Watty
  {
    const [x, y, l, h] = R.portrait;
    g.fillStyle = "#8a6a2c";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#b8963e";
    g.fillRect(x + 8, y + 8, l - 16, h - 16);
    const d = g.createRadialGradient(x + l / 2, y + 110, 10, x + l / 2, y + 140, 160);
    d.addColorStop(0, "#5a4a3a");
    d.addColorStop(1, "#231c16");
    g.fillStyle = d;
    g.fillRect(x + 20, y + 20, l - 40, h - 40);
    // le buste
    g.fillStyle = "#1f1f24";
    g.beginPath();
    g.moveTo(x + 40, y + h - 20);
    g.quadraticCurveTo(x + l / 2, y + 150, x + l - 40, y + h - 20);
    g.fill();
    g.fillStyle = "#e6e1d2";
    g.beginPath();
    g.moveTo(x + l / 2 - 16, y + 176);
    g.lineTo(x + l / 2, y + 222);
    g.lineTo(x + l / 2 + 16, y + 176);
    g.fill();
    g.fillStyle = "#8a2a24";
    g.fillRect(x + l / 2 - 5, y + 182, 10, 40);
    // la tête, peinte à grands traits, sans visage précis
    g.fillStyle = "#c79a7a";
    g.beginPath();
    g.ellipse(x + l / 2, y + 120, 36, 46, 0, 0, 7);
    g.fill();
    g.fillStyle = "#6a6a6a";
    g.beginPath();
    g.ellipse(x + l / 2, y + 88, 38, 18, 0, Math.PI, 0);
    g.fill();
    // l'épinglette Watty au revers
    g.fillStyle = "#d8c43a";
    g.fillRect(x + 82, y + 206, 9, 16);
    // le cartel
    g.fillStyle = "#b8963e";
    g.fillRect(x + 70, y + h - 30, l - 140, 16);
    texte(g, "LE DIRECTEUR GÉNÉRAL", x + l / 2, y + h - 22, 9, "#3a2c18", "800");
    // un coin du tableau déchiré
    g.clearRect(x + l - 60, y + h - 70, 42, 50);
    salir(g, a, x, y, l, h, 1);
  }
  // Le menu de la cafétéria (ardoise)
  {
    const [x, y, l, h] = R.menu;
    g.fillStyle = "#6e4a32";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#2a2e2b";
    g.fillRect(x + 10, y + 10, l - 20, h - 20);
    main(g, "MENU DU JOUR", x + l / 2, y + 40, 28, "#ece8dc");
    main(g, "Entrée livrée", x + l / 2, y + 90, 20, "#ece8dc");
    main(g, "Plat livré", x + l / 2, y + 122, 20, "#ece8dc");
    main(g, "Dessert livré", x + l / 2, y + 154, 20, "#ece8dc");
    main(g, "Café connecté", x + l / 2, y + 186, 20, "#e8c86a");
    main(g, "Rien ne manque !", x + l / 2, y + 236, 22, "#e88a6a", -0.04);
    salir(g, a, x, y, l, h, 1);
  }
  // Le visage de Watty (statue) : clin d'œil, grand sourire, fond transparent
  {
    const [x, y, l, h] = R.visage;
    g.fillStyle = "#2a2018";
    g.beginPath();
    g.ellipse(x + 80, y + 100, 22, 34, 0, 0, 7);
    g.fill();
    g.fillStyle = "#f2efe4";
    g.beginPath();
    g.ellipse(x + 86, y + 88, 7, 10, 0, 0, 7);
    g.fill();
    g.strokeStyle = "#2a2018";
    g.lineWidth = 12;
    g.lineCap = "round";
    g.beginPath();
    g.arc(x + 176, y + 110, 26, Math.PI * 1.1, Math.PI * 1.9);
    g.stroke();
    g.beginPath();
    g.arc(x + 128, y + 128, 76, 0.3, Math.PI - 0.3);
    g.stroke();
    g.fillStyle = "rgba(200,90,70,0.6)";
    g.beginPath();
    g.ellipse(x + 46, y + 160, 18, 11, 0, 0, 7);
    g.ellipse(x + 210, y + 160, 18, 11, 0, 0, 7);
    g.fill();
  }
  // L'éclair rouge du ventre
  {
    const [x, y, l, h] = R.eclair;
    eclair(g, x + l / 2, y + h / 2, h * 0.95, "#c0392e");
  }
  // Panneaux de porte
  const plaque = (r, t1, t2, fond, encre, accent) => {
    const [x, y, l, h] = r;
    g.fillStyle = fond;
    g.fillRect(x, y, l, h);
    texte(g, t1, x + l / 2, y + h * 0.38, 36, encre);
    texte(g, t2, x + l / 2, y + h * 0.76, 17, accent, "800");
    salir(g, a, x, y, l, h, 1);
  };
  plaque(R.archives, "ARCHIVES", "PLANS DU RÉSEAU · ACCÈS SUR BADGE", "#2f5f6b", "#f0ebdc", "#c9e0e2");
  plaque(R.batteries, "BATTERIES", "DANGER · ACIDE · NE PAS FUMER", "#d4b53e", "#24221f", "#9b3b35");
  plaque(R.dispatching, "DISPATCHING", "ACCÈS RÉGLEMENTÉ · SILENCE", "#2f4f5d", "#ece6d6", "#c9c1ac");
  // Le graffiti des Voltaïques
  {
    const [x, y, l, h] = R.graffiti;
    eclair(g, x + 50, y + 70, 110, "rgba(240,236,220,0.92)");
    main(g, "VOLTAÏQUES", x + 190, y + 54, 46, "rgba(240,236,220,0.92)", -0.06);
    main(g, "on répare, nous", x + 196, y + 112, 30, "rgba(240,236,220,0.85)", -0.04);
  }
  // Un plan du réseau (calque bleu)
  {
    const [x, y, l, h] = R.plan;
    g.fillStyle = "#2c4f7e";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "rgba(220,235,255,0.25)";
    g.lineWidth = 1;
    for (let i = 0; i < l; i += 16) {
      g.beginPath();
      g.moveTo(x + i, y);
      g.lineTo(x + i, y + h);
      g.stroke();
    }
    for (let j = 0; j < h; j += 16) {
      g.beginPath();
      g.moveTo(x, y + j);
      g.lineTo(x + l, y + j);
      g.stroke();
    }
    g.strokeStyle = "#e6f0ff";
    g.lineWidth = 3;
    for (let i = 0; i < 9; i++) {
      g.beginPath();
      let px = x + 20 + a() * (l - 40);
      let py = y + 20 + a() * (h - 80);
      g.moveTo(px, py);
      for (let k = 0; k < 3; k++) {
        if (k % 2) py = y + 20 + a() * (h - 80);
        else px = x + 20 + a() * (l - 40);
        g.lineTo(px, py);
      }
      g.stroke();
      g.strokeRect(px - 6, py - 6, 12, 12);
    }
    g.fillStyle = "#e6f0ff";
    g.fillRect(x + l - 150, y + h - 54, 140, 44);
    texte(g, "PLAN DU RÉSEAU", x + l - 80, y + h - 40, 14, "#2c4f7e", "900");
    texte(g, "Feuille 12 · Ville", x + l - 80, y + h - 22, 11, "#2c4f7e", "700");
    main(g, "poste HS ?", x + 120, y + 60, 18, "#ffd27a", -0.1);
  }
  // Le flanc de la camionnette : « COMPAGNIE · INTERVENTION 24 h / 24 »
  {
    const [x, y, l, h] = R.camion;
    g.fillStyle = "#dcd8cc";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#c8362b";
    g.fillRect(x, y + h - 30, l, 18);
    logo(g, x + 64, y + 54, 40);
    texte(g, "LA COMPAGNIE", x + 360, y + 38, 44, "#2f6f73");
    texte(g, "INTERVENTION 24 h / 24 · ON PENSE À TOUT", x + 360, y + 80, 18, "#c8362b", "900");
    salir(g, a, x, y, l, h, 1.8);
  }
  // L'écran de la machine à café connectée
  {
    const [x, y, l, h] = R.cafe;
    g.fillStyle = "#1a2a30";
    g.fillRect(x, y, l, h);
    texte(g, "CAFÉ CONNECTÉ", x + l / 2, y + 28, 20, "#bfe6ff");
    texte(g, "Mise à jour en cours…", x + l / 2, y + 62, 16, "#e8f6ff", "700");
    g.fillStyle = "#33505a";
    g.fillRect(x + 24, y + 84, l - 48, 14);
    g.fillStyle = "#7ff09a";
    g.fillRect(x + 24, y + 84, (l - 48) * 0.03, 14);
    texte(g, "3 %", x + l / 2, y + 114, 14, "#9cc7dd", "700");
  }
  // « ESPACE ABONNÉS PREMIUM » (la mezzanine)
  {
    const [x, y, l, h] = R.premium;
    g.fillStyle = "#c8362b";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#e9dfc6";
    g.fillRect(x + 6, y + 6, l - 12, 4);
    g.fillRect(x + 6, y + h - 10, l - 12, 4);
    texte(g, "ESPACE ABONNÉS", x + l / 2, y + 48, 40, "#e9dfc6");
    texte(g, "PREMIUM · ON S'OCCUPE DE TOUT", x + l / 2, y + 92, 19, "#f2d8a8", "800");
    salir(g, a, x, y, l, h, 1.2);
  }
  // La bâche de la tour : rouge, Watty géant, déchirée en bas
  {
    const [x, y, l, h] = R.banniere;
    g.fillStyle = "#b9402f";
    g.fillRect(x, y, l, h);
    texte(g, "LA COMPAGNIE", x + l / 2, y + 46, 32, "#e9dfc6");
    texte(g, "PENSE", x + l / 2, y + 92, 40, "#e9dfc6");
    texte(g, "À TOUT.", x + l / 2, y + 136, 40, "#e9dfc6");
    g.fillStyle = "#e9dfc6";
    g.beginPath();
    g.arc(x + l / 2, y + 268, 92, 0, 7);
    g.fill();
    petitWatty(g, x + l / 2, y + 268, 150);
    texte(g, "Ne pensez plus", x + l / 2, y + 400, 26, "#e9dfc6");
    texte(g, "à rien.", x + l / 2, y + 432, 26, "#e9dfc6");
    // Déchirures : le bas part en lambeaux
    for (let i = 0; i < 9; i++) {
      const lx = x + i * 30 + a() * 10;
      const lg = 20 + a() * 90;
      g.clearRect(lx, y + h - lg, 14 + a() * 10, lg);
    }
    g.clearRect(x + 170, y + 330, 40, 50);
    salir(g, a, x, y, l, h, 1.8);
  }
  // La borne de recharge « Watty Express »
  {
    const [x, y, l, h] = R.borneRecharge;
    g.fillStyle = "#e6e1d2";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, l, 80);
    texte(g, "WATTY", x + l / 2, y + 30, 34, "#e9dfc6");
    texte(g, "EXPRESS", x + l / 2, y + 62, 22, "#e0b040");
    g.fillStyle = "#1a2226";
    g.fillRect(x + 40, y + 110, l - 80, 100);
    texte(g, "HORS SERVICE", x + l / 2, y + 160, 18, "rgba(230,90,60,0.6)", "800");
    petitWatty(g, x + l / 2, y + 290, 110, false);
    texte(g, "Rechargez sans réfléchir", x + l / 2, y + 366, 14, "#2f2a24", "800");
    salir(g, a, x, y, l, h, 1.6);
  }
  // Le tableau des notes de service (couloir)
  {
    const [x, y, l, h] = R.notes;
    g.fillStyle = "#a8865a";
    g.fillRect(x, y, l, h);
    const notes = [["NOTE DE SERVICE", "Le réseau est stable."], ["RAPPEL", "Ne pas réfléchir"], ["Pointage", "obligatoire"], ["ASTREINTE", "équipe 3"], ["", "Watty vous remercie"]];
    notes.forEach(([t1, t2], i) => {
      const nx = x + 16 + (i % 3) * 122;
      const ny = y + 16 + Math.floor(i / 3) * 118;
      g.save();
      g.translate(nx + 50, ny + 48);
      g.rotate((a() - 0.5) * 0.15);
      g.fillStyle = i === 4 ? "#e9dfc6" : "#f2efe4";
      g.fillRect(-50, -46, 104, 96);
      g.restore();
      texte(g, t1, nx + 52, ny + 26, 11, "#2f2a24", "900");
      texte(g, t2, nx + 52, ny + 50, 10, "#4a4238", "700");
      g.fillStyle = "#c8362b";
      g.beginPath();
      g.arc(nx + 52, ny + 6, 5, 0, 7);
      g.fill();
    });
    main(g, "on n'a plus de courant, on a des idées", x + l / 2, y + h - 24, 18, "#1f2a44", -0.03);
    salir(g, a, x, y, l, h, 1.2);
  }
}

/** Dalle de parvis : grandes dalles de béton lavé de 1,5 m, joints herbus, plaques tachées. Tuile de 6 m. */
function dessinerDalle(g) {
  const a = aleatoire(70);
  g.fillStyle = "#6f6a5e";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const v = 214 + Math.floor((a() - 0.5) * 26);
    g.fillStyle = `rgb(${v},${v - 3},${v - 10})`;
    g.fillRect(i * 64 + 1.5, j * 64 + 1.5, 61, 61);
    // le gravillon lavé
    for (let k = 0; k < 120; k++) {
      const w = 150 + Math.floor(a() * 80);
      g.fillStyle = `rgba(${w},${w - 6},${w - 14},0.5)`;
      g.fillRect(i * 64 + 2 + a() * 60, j * 64 + 2 + a() * 60, 1.5, 1.5);
    }
  }
  // l'herbe dans les joints
  g.fillStyle = "rgba(96,124,62,0.55)";
  for (let k = 0; k < 40; k++) {
    const h = a() < 0.5;
    const p = Math.floor(a() * 4) * 64;
    const q = a() * 256;
    if (h) g.fillRect(q, p - 1.5, 6 + a() * 14, 3);
    else g.fillRect(p - 1.5, q, 3, 6 + a() * 14);
  }
  taches(g, a, 10, "rgba(60,55,45,0.2)", 10, 36, 256, 256);
  taches(g, a, 5, "rgba(90,110,60,0.22)", 8, 26, 256, 256);
}

/** Moquette des années 1970 : motif géométrique brun et orange, usée, tachée. Tuile de 2 m. */
function dessinerMoquette(g) {
  const a = aleatoire(71);
  g.fillStyle = "#b07a50";
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const x = i * 32 + 16;
    const y = j * 32 + 16;
    g.strokeStyle = "rgba(90,50,30,0.55)";
    g.lineWidth = 3;
    g.beginPath();
    g.arc(x, y, 11, 0, 7);
    g.stroke();
    g.fillStyle = "rgba(220,160,80,0.45)";
    g.beginPath();
    g.arc(x, y, 5, 0, 7);
    g.fill();
  }
  for (let k = 0; k < 2500; k++) {
    g.fillStyle = a() < 0.5 ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.05)";
    g.fillRect(a() * 128, a() * 128, 1, 1);
  }
  taches(g, a, 7, "rgba(50,35,25,0.3)", 6, 22, 128, 128);
}

/** Faux plancher technique : dalles de 60 cm, une perforée, joints sombres. Tuile de 2,4 m. */
function dessinerPlancher(g) {
  const a = aleatoire(72);
  g.fillStyle = "#55534e";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const v = 196 + Math.floor((a() - 0.5) * 20);
    g.fillStyle = `rgb(${v},${v},${v - 6})`;
    g.fillRect(i * 64 + 2, j * 64 + 2, 60, 60);
    if ((i + j * 3) % 7 === 2) {
      g.fillStyle = "rgba(40,40,40,0.5)";
      for (let p = 0; p < 6; p++) for (let q = 0; q < 6; q++) g.fillRect(i * 64 + 8 + p * 9, j * 64 + 8 + q * 9, 4, 4);
    }
  }
  taches(g, a, 8, "rgba(60,55,45,0.22)", 8, 30, 256, 256);
}

// ---------- Outils géométriques ----------

const GEO = {};
const PLAN = new THREE.PlaneGeometry(1, 1);

function geoCylindre(r, h, cotes, r2 = r) {
  const cle = `cyl|${r}|${r2}|${h}|${cotes}`;
  if (!GEO[cle]) GEO[cle] = new THREE.CylinderGeometry(r2, r, h, cotes);
  return GEO[cle];
}
function geoBoule(r, detail = 0) {
  const cle = `ico|${r}|${detail}`;
  if (!GEO[cle]) GEO[cle] = new THREE.IcosahedronGeometry(r, detail);
  return GEO[cle];
}

/** Un panneau plat dont l'image vient de l'atlas (région `r`), face vers +z local. */
function panneau(c, mat, r, pose, l, h) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
  c.poser(g, mat, 0xffffff, pose, { crasse: false, nuance: 0 });
  g.dispose();
}

function repereMur(a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const L = Math.hypot(dx, dz);
  const ry = -Math.atan2(dz, dx);
  // Un point (u le long du mur, w vers l'extérieur) en coordonnées du site
  const P = (u, w = 0) => [a[0] + (dx / L) * u + Math.sin(ry) * w, a[1] + (dz / L) * u + Math.cos(ry) * w];
  return { L, ry, dx, dz, P };
}

/** Une boîte dans le repère d'un mur : de u1 à u2, de y1 à y2, de w1 à w2 (w > 0 vers l'extérieur). */
function boiteMur(ch, rm, u1, u2, y1, y2, w1, w2, couleur, mat, options = {}) {
  const [x, z] = rm.P((u1 + u2) / 2, (w1 + w2) / 2);
  ch.boite(Math.abs(u2 - u1), Math.abs(y2 - y1), Math.abs(w2 - w1), couleur, { x, y: (y1 + y2) / 2, z, ry: rm.ry }, mat, options);
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
  return res.filter(([p, q]) => q - p > 0.03);
}

/** Les ouvertures d'un mur ramenées à la tranche [p0, p1] (une fenêtre coupée devient un vide). */
function tranche(ouvertures, p0, p1) {
  return ouvertures
    .filter((o) => o.haut > p0 + 0.01 && o.bas < p1 - 0.01)
    .map((o) => {
      const entiere = o.bas >= p0 - 1e-6 && o.haut <= p1 + 1e-6;
      return { ...o, type: o.type === "fenetre" && entiere ? "fenetre" : "vide", bas: Math.max(0, o.bas - p0), haut: Math.min(p1 - p0 + 0.5, o.haut - p0) };
    });
}

/**
 * Un mur coupé : le bas (0 → `cut`) reste toujours visible, le haut (`cut` → h) va dans la couche `sup`.
 * `cut: 0` : tout le mur reste visible (murs du fond, côté opposé à la caméra).
 */
function murCoupe(k, a, b, spec) {
  const { h, cut = CUT, sup = k.T, ouvertures = [], breches = [], obstacles = true, ...reste } = spec;
  if (cut > 0) mur(k.c, a, b, { ...reste, h: cut, ouvertures: tranche(ouvertures, 0, cut) });
  if (h > cut) mur(cut > 0 ? sup : k.c, a, b, { ...reste, y0: cut, h: h - cut, ouvertures: tranche(ouvertures, cut, h), breches });
  if (obstacles) {
    const { L, dx, dz } = repereMur(a, b);
    const trous = ouvertures.filter((o) => o.bas < 0.5 && o.haut > 0.5).map((o) => [o.u - o.l / 2, o.u + o.l / 2]);
    for (const [u1, u2] of soustraire(0, L, trous)) k.b.obstacle(a[0] + (dx * u1) / L, a[1] + (dz * u1) / L, a[0] + (dx * u2) / L, a[1] + (dz * u2) / L, spec.nature ?? "mur");
  }
}

/** Pose une pièce verticale (y1 → y2) dans le chantier du bas ou du haut selon la coupe, coupée en deux s'il le faut. */
function coupeV(bas, sup, cut, y1, y2, f) {
  if (y2 <= cut + 1e-6) f(bas, y1, y2);
  else if (y1 >= cut - 1e-6) f(sup, y1, y2);
  else {
    f(bas, y1, cut);
    f(sup, cut, y2);
  }
}

/**
 * Un mur-rideau (menuiseries bronze, grandes vitres) de `a` à `b`, de 0 à `h`, une trame tous les `pas` mètres.
 * `traverses` : hauteurs des traverses ; `portes` : [{ u, l, haut }] (pas de vitre en dessous de `haut`, passage
 * libre) ; `bris` : part des vitres cassées. Le bas jusqu'à `cut` reste visible, le haut va dans `sup`.
 */
function murRideau(k, a, b, spec) {
  const { h, pas = 1.5, cut = CUT, sup = k.T, portes = [], traverses = [], bris = k.bris, obstacles = true, tombees = [] } = spec;
  const bas = k.c;
  const m = k.m;
  const rm = repereMur(a, b);
  const n = Math.max(1, Math.round(rm.L / pas));
  const du = rm.L / n;
  const dansPorte = (u, y = 0) => portes.find((p) => Math.abs(u - p.u) < p.l / 2 - 0.02 && y < p.haut - 0.02);
  const lignes = [0, ...traverses.filter((t) => t > 0 && t < h), h];
  // Le socle de la façade (seuil de granit sombre)
  for (const [u1, u2] of soustraire(-0.1, rm.L + 0.1, portes.map((p) => [p.u - p.l / 2, p.u + p.l / 2]))) boiteMur(bas, rm, u1, u2, 0, 0.14, -0.14, 0.18, COUL.marbreNoir, m.lisse);
  // Les montants
  for (let i = 0; i <= n; i++) {
    const u = i * du;
    if (portes.some((p) => Math.abs(u - p.u) < p.l / 2 - 0.05)) {
      const p = dansPorte(u);
      coupeV(bas, sup, cut, p ? p.haut : 0, h, (ch, y1, y2) => boiteMur(ch, rm, u - 0.045, u + 0.045, y1, y2, -0.11, 0.11, COUL.bronze, m.tole));
      continue;
    }
    coupeV(bas, sup, cut, 0, h, (ch, y1, y2) => boiteMur(ch, rm, u - 0.045, u + 0.045, y1, y2, -0.11, 0.11, COUL.bronze, m.tole));
  }
  // Les traverses et les vitres
  for (let i = 0; i < n; i++) {
    const u1 = i * du;
    const u2 = u1 + du;
    const uc = (u1 + u2) / 2;
    for (let j = 0; j < lignes.length; j++) {
      const y = lignes[j];
      if (j === 0 && dansPorte(uc)) continue;
      const ch = y < cut ? bas : sup;
      boiteMur(ch, rm, u1, u2, y - 0.04, y + 0.04, -0.08, 0.08, COUL.bronze, m.tole);
    }
    for (let j = 0; j < lignes.length - 1; j++) {
      const y1 = lignes[j];
      const y2 = lignes[j + 1];
      if (dansPorte(uc, y1)) continue;
      if (tombees.includes(i) && j === 0) continue;
      const r = k.c.hasard();
      if (r < bris * 0.5) continue; // vitre tombée
      if (r < bris * 0.62 && y1 > cut) {
        // Une vitre qui pend, tenue par un coin
        const [x, z] = rm.P(uc, 0.18);
        sup.poser(PLAN, m.verre, COUL.verreBronze, { x, y: (y1 + y2) / 2 - 0.3, z, ry: rm.ry, rx: 0.35, rz: 0.2, e: [du - 0.12, y2 - y1 - 0.1, 1] }, { crasse: false, nuance: 0 });
        continue;
      }
      coupeV(bas, sup, cut, y1 + 0.04, y2 - 0.04, (ch, ya, yb) => {
        const [x, z] = rm.P(uc, 0);
        ch.poser(PLAN, m.verre, COUL.verreBronze, { x, y: (ya + yb) / 2, z, ry: rm.ry, e: [du - 0.09, yb - ya, 1] }, { crasse: false, nuance: 0.02 });
      });
    }
  }
  if (obstacles) {
    for (const [u1, u2] of soustraire(0, rm.L, portes.map((p) => [p.u - p.l / 2, p.u + p.l / 2]))) {
      const [x1, z1] = rm.P(u1);
      const [x2, z2] = rm.P(u2);
      k.b.obstacle(x1, z1, x2, z2, "vitrage");
    }
  }
  return rm;
}

// ---------- Le bâtiment ----------

export function creer({ usure = 0.7, carte } = {}) {
  const id = carte === "dispatching" ? "dispatching" : "parvis";
  const b = new Batiment(1974, usure);
  const m = matieres();
  // La couche du hall et de la tour : hauts des murs du hall, mezzanine, étages, couronne (tout ce qui s'efface quand on
  // entre dans le hall ou qu'on passe derrière la tour).
  const T = b.couche("tour", { x: 0, z: -1.5, l: 24.6, p: 15.6 }, CUT, Y_COURONNE + 9);
  const A = b.couche("auvent", { x: 0, z: 4, l: 12.4, p: 13 }, 4.3, 5.0);
  const k = { b, c: b.c, T, A, m, usure, id, parvis: id === "parvis", disp: id === "dispatching", bris: 0.2 + 0.6 * usure };
  if (k.parvis) k.K = b.couche("cafeteria", { x: (CAFET.x0 + CAFET.x1) / 2, z: (CAFET.z0 + CAFET.z1) / 2, l: 16.6, p: 13.6 }, CUT, CAFET.h + 1.2);
  if (k.disp) k.W = b.couche("aile", { x: (AILE.x0 + AILE.x1) / 2, z: (AILE.z0 + AILE.z1) / 2, l: 30.6, p: 20.6 }, CUT, AILE.h + 1.6);

  sols(k);
  hallMurs(k);
  tour(k);
  auvent(k);
  hallInterieur(k);
  if (k.parvis) {
    cafeteria(k);
    parvis(k);
  } else {
    aile(k);
    dispatching(k);
    archives(k);
    batteries(k);
    couloir(k);
    directeur(k);
    abordsAile(k);
  }
  arriere(k);

  // Le néon de secours grésille sur sa batterie ; l'écran de la borne luit, imperturbable.
  const anime = new THREE.Object3D();
  let prochain = 0;
  let etat = 1;
  anime.userData.animer = (t) => {
    if (t > prochain) {
      etat = Math.random() < 0.85 ? 1 : 0.15 + Math.random() * 0.4;
      prochain = t + (etat < 1 ? 0.04 + Math.random() * 0.12 : 0.4 + Math.random() * 3);
    }
    m.neon.emissiveIntensity = 1.1 * etat;
  };
  b.ajouter(anime);
  if (k.disp) b.ajouter(voyants());

  // Les lumières de la nuit
  b.lumiere(9.6, 1.7, -6.6, 0xe4f0ff, 7, 10, "lampe des Voltaïques sur batterie (blanc froid), campement du hall");
  b.lumiere(4, 2.75, -8.6, 0x6dffa8, 4, 8, "néon ISSUE DE SECOURS (batterie)");
  b.lumiere(5.2, 1.3, 4.1, 0x9fd4ff, 3, 5, "écran de la borne « Votre consommation est exemplaire ! »");
  if (k.parvis) {
    b.lumiere(-14.8, 1.3, -7.6, 0x8fc8ff, 2, 4, "écran de la machine à café connectée");
  } else {
    b.lumiere(20, 3.2, -12.6, 0xff6a48, 4, 11, "voyants du mur synoptique (batterie)");
    b.lumiere(39.8, 1.8, 1.6, 0xe4f0ff, 8, 12, "lampe des Voltaïques sur batterie (blanc froid), salle des batteries");
    b.lumiere(25, 2.75, 5.6, 0x6dffa8, 4, 8, "néon ISSUE DE SECOURS (batterie), couloir de service");
  }

  // Recentrer sur le lot de la carte : la géométrie, et les données de jeu.
  const o = CENTRES[id];
  const groupe = b.construire();
  for (const enfant of groupe.children) enfant.position.set(-o.x, 0, -o.z);
  for (const t of groupe.userData.toits) {
    t.boite = { ...t.boite, x: t.boite.x - o.x, z: t.boite.z - o.z };
    if (t.horsDe) t.horsDe = { ...t.horsDe, x: t.horsDe.x - o.x, z: t.horsDe.z - o.z };
  }
  for (const s of groupe.userData.obstacles) {
    s.x1 = Math.round((s.x1 - o.x) * 100) / 100;
    s.x2 = Math.round((s.x2 - o.x) * 100) / 100;
    s.z1 = Math.round((s.z1 - o.z) * 100) / 100;
    s.z2 = Math.round((s.z2 - o.z) * 100) / 100;
  }
  for (const l of groupe.userData.lumieres) {
    l.x -= o.x;
    l.z -= o.z;
  }
  return groupe;
}

/** Ce point est-il dans le lot de la carte ? (pour ne pas poser ce qui déborde) */
function dansLot(k, x, z, marge = 0) {
  const o = CENTRES[k.id];
  const lot = LOTS[k.id];
  return Math.abs(x - o.x) <= lot.l / 2 + marge && Math.abs(z - o.z) <= lot.p / 2 + marge;
}

// ---------- Sols ----------

function sols(k) {
  const { c, m } = k;
  const o = CENTRES[k.id];
  const lot = LOTS[k.id];
  const X0 = o.x - lot.l / 2;
  const X1 = o.x + lot.l / 2;
  const Z0 = o.z - lot.p / 2;
  const Z1 = o.z + lot.p / 2;
  const sol = (x1, z1, x2, z2, couleur, mat, y = 0.05) => {
    x1 = Math.max(x1, X0);
    x2 = Math.min(x2, X1);
    z1 = Math.max(z1, Z0);
    z2 = Math.min(z2, Z1);
    if (x2 - x1 < 0.05 || z2 - z1 < 0.05) return;
    c.pave(x1, 0, z1, x2, y, z2, couleur, mat, { crasse: false, nuance: 0 });
  };
  // Le hall : marbre noir et blanc
  sol(HALL.x0, HALL.z0, HALL.x1, HALL.z1, 0xf0ece4, m.damier, 0.06);
  // Le parvis sur dalle, devant tout le siège
  sol(X0, HALL.z1, X1, 34, COUL.dalle, m.dalle, 0.04);
  // La rue, au sud
  sol(X0, 34, X1, Z1, COUL.asphalte, m.beton, 0.02);
  // Derrière : la cour de service
  sol(X0, Z0, X1, HALL.z0, 0x8f8a80, m.beton, 0.03);
  if (k.parvis) {
    sol(CAFET.x0, CAFET.z0, CAFET.x1, CAFET.z1, 0xd8d0bc, m.carrelage, 0.06);
    sol(X0, CAFET.z0, CAFET.x0, CAFET.z1, 0x8f8a80, m.beton, 0.03);
    sol(CAFET.x0, CAFET.z1, CAFET.x1, HALL.z1, COUL.dalle, m.dalle, 0.04);
    sol(HALL.x1, Z0, X1, HALL.z1, 0x8f8a80, m.beton, 0.03);
  } else {
    sol(HALL.x0 - 2, HALL.z0, HALL.x0, HALL.z1, 0x8f8a80, m.beton, 0.03);
    sol(AILE.x1, AILE.z0, X1, AILE.z1, 0x8f8a80, m.beton, 0.03);
    // Dispatching : faux plancher ; archives, batteries, couloir : sol plastique ; directeur : moquette
    sol(12, -14, 28, -1, 0xd2d0c8, m.plancher, 0.06);
    sol(28, -14, 42, -5, 0xc8c2b0, m.carrelage, 0.06);
    sol(28, -5, 42, 6, 0xa9aba4, m.carrelage, 0.06);
    sol(22, -1, 28, 6, 0xc8c2b0, m.carrelage, 0.06);
    sol(12, -1, 22, 6, COUL.moquette, m.moquette, 0.07);
  }
}

// ---------- Le hall : murs et façades ----------

/** Fenêtre à menuiserie bronze (atelier `fenetre`). */
const OPT_FEN = () => ({ croisillons: 1, traverses: 1, appui: false, cadre: COUL.bronze, matCadre: MAT.tole() });

function hallMurs(k) {
  const { c, T, m, usure } = k;
  const H = HALL.h;
  const beton = { couleur: COUL.beton, mat: m.beton, ep: EP };
  // Façade sud : le grand mur-rideau, le tambour figé au milieu, la porte vitrée brisée, un panneau tombé
  murRideau(k, [HALL.x0, HALL.z1], [HALL.x1, HALL.z1], {
    h: H,
    traverses: [2.7, 5.2, 7.2],
    portes: [{ u: 12, l: 3.0, haut: 2.7 }, { u: 15.75, l: 1.5, haut: 2.7 }, { u: 6.75, l: 1.5, haut: 2.7 }],
  });
  tambour(k, 0, HALL.z1);
  // La porte vitrée brisée (x = 3,75) : un vantail ouvert, l'autre au sol
  c.repere({ x: 3.75 + 0.7, z: HALL.z1 + 0.05, ry: 1.2 }, () => {
    c.boite(0.7, 2.55, 0.04, COUL.bronze, { x: -0.35, y: 1.3 }, m.tole);
  });
  c.boite(1.4, 0.04, 0.7, COUL.bronze, { x: 3.5, y: 0.08, z: HALL.z1 + 1.3, ry: 0.4 }, m.tole);
  debris(c, 2.6, HALL.z1 - 0.6, 5.2, HALL.z1 + 2.4, 30, [0x9fb3b0, 0x7d9290, 0xc9d6d2]);
  // Le panneau tombé (x = -5,25) : la vitre en miettes, le cadre tordu sur le parvis
  c.boite(1.5, 0.06, 2.6, COUL.bronze, { x: -5.6, y: 0.1, z: HALL.z1 + 1.8, ry: -0.25, rz: 0.05 }, m.tole);
  debris(c, -6.6, HALL.z1 - 0.8, -3.8, HALL.z1 + 3.4, 34, [0x9fb3b0, 0x7d9290, 0xc9d6d2]);

  // Mur est (x = 12) : béton brut ; la double porte « DISPATCHING »
  const porteDisp = { u: 11, l: 2.2, bas: 0, haut: 2.5, type: "vide" };
  murCoupe(k, [HALL.x1, HALL.z1], [HALL.x1, HALL.z0], { ...beton, h: H, cut: CUTI, ouvertures: [porteDisp] });
  panneau(c, m.enseignes, R.dispatching, { x: HALL.x1 - 0.17, y: 2.85, z: -5, ry: -Math.PI / 2 }, 1.6, 0.48);
  if (k.parvis) {
    // Vers l'autre carte : la porte barricadée par les Voltaïques (on passe en écartant les planches)
    for (let i = 0; i < 4; i++) c.boite(0.05, 0.16, 2.7, PALETTE.boisGris, { x: HALL.x1 + 0.22, y: 0.4 + i * 0.55, z: -5, rx: (i % 2 ? 1 : -1) * 0.1 }, m.mat, { nuance: 0.08 });
  }
  // Mur ouest (x = -12) : le passage vers la cafétéria
  const porteCafet = { u: 5, l: 3.4, bas: 0, haut: 2.7, type: "vide" };
  murCoupe(k, [HALL.x0, HALL.z0], [HALL.x0, HALL.z1], { ...beton, h: H, cut: k.parvis ? CUTI : 0, ouvertures: [porteCafet] });
  if (k.disp) {
    // La cafétéria est hors de cette carte : le passage est barricadé de tables
    for (let i = 0; i < 3; i++) c.boite(1.6, 0.06, 0.9, 0xc9c1ac, { x: HALL.x0 - 0.5, y: 0.5 + i * 0.6, z: -4 + (i - 1) * 0.5, rx: 1.2, ry: 0.2 * i }, m.satin);
  }
  // Mur nord (z = -9) : plein (côté opposé à la caméra), porte de service
  murCoupe(k, [HALL.x1, HALL.z0], [HALL.x0, HALL.z0], { ...beton, h: H, cut: 0, ouvertures: [{ u: 8, l: 1.6, bas: 0, haut: 2.4, type: "vide" }] });
  // La porte de service : un battant entrouvert, le néon ISSUE DE SECOURS au-dessus
  c.repere({ x: 4.8, z: HALL.z0 + 0.17, ry: Math.PI + 0.6 }, () => c.boite(1.5, 2.35, 0.05, 0x6f6a5c, { x: 0.75, y: 1.18 }, m.tole));
  c.boite(0.9, 0.3, 0.12, 0xdedad0, { x: 4, y: 2.75, z: HALL.z0 + 0.22 }, m.satin);
  panneau(c, m.neon, R.issue, { x: 4, y: 2.75, z: HALL.z0 + 0.29 }, 0.8, 0.3);
  // Les plaques de béton brut de l'intérieur : joints creux tous les 3 m (nord)
  for (let x = -9; x <= 9; x += 3) c.boite(0.04, H - 0.2, 0.03, COUL.betonSombre, { x, y: H / 2, z: HALL.z0 + 0.16 }, m.beton);

  // Le dessus de la travée avant (z 3 → 6) : toit-terrasse au pied de la tour
  T.pave(HALL.x0 - 0.1, H, TOUR.z1, HALL.x1 + 0.1, H + 0.35, HALL.z1 + 0.15, COUL.betonClair, m.beton, { crasse: false });
  T.pave(HALL.x0 - 0.1, H + 0.35, HALL.z1 - 0.1, HALL.x1 + 0.1, H + 1.0, HALL.z1 + 0.15, COUL.beton, m.beton, { crasse: false });
  mousse(T, -6, H + 0.35, 4.6, 1.4, Math.round(3 + 5 * usure));
  touffes(T, [[-9, 4.2, H + 0.35], [7, 5.3, H + 0.35], [2, 3.6, H + 0.35]], PALETTE.herbeSeche);
  // Bandeau de béton au-dessus du mur-rideau, côté sud et côté est (le haut du hall)
  T.pave(HALL.x0 - 0.15, H - 0.6, HALL.z1 - 0.05, HALL.x1 + 0.15, H, HALL.z1 + 0.2, COUL.beton, m.beton, { nuance: 0.02 });
  // Les vitres tombées de la tour ont crevé le toit de la travée avant à l'est
  gravats(T, 8.5, 4.6, 1.2, 6, [0x9fb3b0, COUL.bronze, COUL.beton], H + 0.35);
}

/** Le tambour de la porte tournante (figé), centré sur (x, z) de la façade. */
function tambour(k, x, z) {
  const { c, T, m } = k;
  const r = 1.45;
  // Le plateau et le chapeau
  c.poser(geoCylindre(r, 0.06, 16), m.lisse, COUL.marbreNoir, { x, y: 0.09, z });
  T.poser(geoCylindre(r + 0.05, 0.35, 16), m.tole, COUL.bronze, { x, y: 2.88, z });
  // Les quatre vantaux en croix, arrêtés de biais ; l'un est brisé
  for (let i = 0; i < 4; i++) {
    const a = 0.4 + (i * Math.PI) / 2;
    c.repere({ x, z, ry: a }, () => {
      c.boite(r - 0.1, 2.6, 0.06, COUL.bronze, { x: (r - 0.1) / 2, y: 1.4 }, m.tole);
      if (i !== 2) c.poser(PLAN, m.verre, COUL.verreBronze, { x: (r - 0.1) / 2, y: 1.45, z: 0.04, e: [r - 0.3, 2.2, 1] }, { crasse: false, nuance: 0 });
    });
  }
  c.poser(geoCylindre(0.12, 2.7, 8), m.tole, COUL.bronze, { x, y: 1.4, z });
  // Les parois courbes du tambour (des facettes de verre, deux côtés)
  for (const s of [-1, 1]) {
    for (let j = 0; j < 4; j++) {
      const a0 = s > 0 ? -0.9 + j * 0.45 : Math.PI - 0.9 + j * 0.45;
      const xa = x + Math.cos(a0 + 0.225) * r;
      const za = z + Math.sin(a0 + 0.225) * r;
      if (k.c.hasard() < k.bris * 0.6) continue;
      c.poser(PLAN, m.verre, COUL.verreBronze, { x: xa, y: 1.45, z: za, ry: -(a0 + 0.225) + Math.PI / 2, e: [0.66, 2.6, 1] }, { crasse: false, nuance: 0 });
    }
  }
  k.b.obstacle(x - r, z - 0.2, x - r * 0.3, z + r, "tambour figé");
  k.b.obstacle(x - r * 0.3, z + r, x + r, z + 0.2, "tambour figé");
  k.b.obstacle(x - r, z - 0.2, x + r, z - 0.2, "tambour figé");
}

// ---------- La tour (couche) ----------

function tour(k) {
  const { T, m, usure } = k;
  const { x0, x1, z0, z1, y0, niveaux, hn } = TOUR;
  const rng = aleatoire(42);
  // Les planchers et le noyau (on les devine par les vitres)
  for (let f = 0; f <= niveaux; f++) {
    const y = y0 + f * hn;
    const brule = f === ETAGE_BRULE || f === ETAGE_BRULE + 1;
    T.pave(x0 + 0.1, y - 0.3, z0 + 0.1, x1 - 0.1, y, z1 - 0.1, brule ? 0x2e2b28 : 0xd8d4c8, m.beton, { crasse: false, nuance: 0.02 });
  }
  T.pave(-4, y0, -6.5, 4, Y_COURONNE, -1, 0x3e3c39, m.mat, { crasse: false, nuance: 0 });
  // Des cloisons et des bureaux devinés derrière les vitres sud et est
  for (let f = 0; f < niveaux; f++) {
    const y = y0 + f * hn;
    if (f === ETAGE_BRULE) continue;
    for (let i = 0; i < 4; i++) {
      const bx = -10 + i * 6 + rng() * 2;
      T.pave(bx, y, z1 - 1.8, bx + 1.6, y + 0.75, z1 - 1.0, 0xbab3a2, m.satin, { crasse: false });
      if (rng() < 0.6) T.pave(bx + 0.4, y + 0.75, z1 - 1.6, bx + 0.9, y + 1.2, z1 - 1.2, COUL.beige, m.satin, { crasse: false });
    }
    T.pave(x1 - 1.9, y, -6, x1 - 1.1, y + 0.75, -2.5, 0xbab3a2, m.satin, { crasse: false });
  }
  // L'étage noirci : des poutres tombées, le faux plafond qui pend, tout est noir
  {
    const y = y0 + ETAGE_BRULE * hn;
    for (let i = 0; i < 9; i++) {
      const bx = x0 + 1.5 + rng() * (x1 - x0 - 3);
      T.poutre([bx, y + hn - 0.35, z1 - 0.6 - rng() * 3], [bx + (rng() - 0.5) * 1.5, y + 0.1 + rng() * 1.2, z1 - 1.5 - rng() * 4], 0.12, COUL.suie, m.mat);
    }
    for (let i = 0; i < 7; i++) T.boite(0.6, 0.03, 1.2, 0x3a3632, { x: x0 + 2 + rng() * 20, y: y + hn - 0.7 - rng() * 0.8, z: z1 - 1 - rng() * 3, rx: rng() - 0.5, rz: (rng() - 0.5) * 0.8 }, m.mat);
    T.pave(x0 + 0.2, y, z1 - 6, x1 - 0.2, y + 0.25, z1 - 0.3, COUL.suie, m.mat, { crasse: false, nuance: 0.05 });
  }
  // L'étage jungle : les ficus des open spaces ont crevé le plafond et débordent par les vitres tombées
  {
    const y = y0 + ETAGE_JUNGLE * hn;
    const tons = [PALETTE.feuillage, PALETTE.feuillageSombre, PALETTE.feuillageClair, 0x6f9a4a];
    const n = Math.round(14 + 18 * usure);
    for (let i = 0; i < n; i++) {
      const s = 0.6 + rng() * 0.9;
      const surFaceEst = rng() < 0.35;
      const x = surFaceEst ? x1 - 2 + rng() * 2.8 : x0 + 1 + rng() * (x1 - x0 - 2);
      const z = surFaceEst ? z0 + 1 + rng() * (z1 - z0 - 2) : z1 - 2 + rng() * 2.8;
      T.poser(geoBoule(1), m.mat, tons[i % 4], { x, y: y + 0.6 + rng() * (hn - 0.6), z, rx: rng() * 3, ry: rng() * 3, e: s }, { nuance: 0.08, crasse: false });
    }
    // Les lianes qui pendent le long de la façade
    for (let i = 0; i < Math.round(6 + 8 * usure); i++) {
      const surFaceEst = i % 3 === 0;
      const lg = 2 + rng() * 6;
      const x = surFaceEst ? x1 + 0.2 : x0 + 1.5 + rng() * (x1 - x0 - 3);
      const z = surFaceEst ? z0 + 1 + rng() * (z1 - z0 - 2) : z1 + 0.2;
      T.boite(0.08, lg, 0.08, i % 2 ? PALETTE.feuillageSombre : 0x5a7a3a, { x, y: y + 0.3 - lg / 2, z }, m.mat, { crasse: false, nuance: 0.1 });
      T.poser(geoBoule(0.3), m.mat, PALETTE.feuillage, { x, y: y + 0.3 - lg, z, e: [1, 1.6, 1] }, { crasse: false });
    }
  }
  // Les quatre façades
  facadeTour(k, [x0, z1], [x1, z1], 1.5, rng);
  facadeTour(k, [x1, z1], [x1, z0], 1.5, rng);
  facadeTour(k, [x1, z0], [x0, z0], 3, rng);
  facadeTour(k, [x0, z0], [x0, z1], 3, rng);
  // Les ailerons de béton brut aux quatre angles, du hall à la couronne
  for (const [x, z, ybas] of [[x0, z0, 0], [x1, z0, 0], [x0, z1, HALL.h], [x1, z1, HALL.h]]) {
    T.pave(x - 0.65, Math.max(ybas, CUT), z - 0.65, x + 0.65, Y_COURONNE + 1.4, z + 0.65, COUL.beton, m.beton, { nuance: 0.02 });
  }
  // La couronne : un bandeau de béton, l'acrotère
  T.pave(x0 - 0.3, Y_COURONNE, z0 - 0.3, x1 + 0.3, Y_COURONNE + 1.4, z0 + 0.1, COUL.beton, m.beton);
  T.pave(x0 - 0.3, Y_COURONNE, z1 - 0.1, x1 + 0.3, Y_COURONNE + 1.4, z1 + 0.3, COUL.beton, m.beton);
  T.pave(x0 - 0.3, Y_COURONNE, z0 - 0.3, x0 + 0.1, Y_COURONNE + 1.4, z1 + 0.3, COUL.beton, m.beton);
  T.pave(x1 - 0.1, Y_COURONNE, z0 - 0.3, x1 + 0.3, Y_COURONNE + 1.4, z1 + 0.3, COUL.beton, m.beton);
  T.pave(x0, Y_COURONNE, z0, x1, Y_COURONNE + 0.2, z1, 0x7a766e, m.beton, { crasse: false });
  // Sur le toit : la salle des machines des ascenseurs, une antenne, des caissons de ventilation
  const yt = Y_COURONNE + 0.2;
  T.pave(-5, yt, -7, 5, yt + 3, -2, COUL.betonClair, m.beton);
  T.pave(-4.6, yt + 3, -6.6, 4.6, yt + 3.2, -2.4, COUL.betonSombre, m.beton, { crasse: false });
  for (const [x, z] of [[-9, -6], [-8, 0.5], [8, -1]]) T.pave(x - 0.9, yt, z - 0.7, x + 0.9, yt + 1.3, z + 0.7, COUL.tole, m.tole);
  T.tube([8, yt, -6.5], [8, yt + 9, -6.5], 0.09, 0x8d8f8a, m.tole, 5);
  for (let i = 1; i <= 3; i++) T.tube([8 - 0.7, yt + i * 2.4, -6.5], [8 + 0.7, yt + i * 2.4, -6.5], 0.03, 0x8d8f8a, m.tole, 4);
  T.tube([8, yt + 9, -6.5], [8.6, yt + 8.2, -6.3], 0.04, 0x8d8f8a, m.tole, 4);
  mousse(T, -2, yt, 0, 2.2, Math.round(3 + 6 * usure));
  touffes(T, [[-10.5, 1.5, yt], [10.5, -7.5, yt], [0, 1.8, yt], [-6, -8, yt]], PALETTE.herbeSeche);
  // « LA COMPAGNIE » : les lettres sur leur charpente, au sud ; le P pend de travers
  const yl = Y_COURONNE + 1.4;
  for (const x of [-7.5, -2.5, 2.5, 7.5]) {
    T.tube([x, yl, z1 - 0.2], [x, yl + 2.8, z1 - 0.2], 0.05, 0x5a5a56, m.tole, 4);
    T.tube([x, yl, z1 - 1.4], [x, yl + 2.6, z1 - 0.2], 0.04, 0x5a5a56, m.tole, 4);
  }
  T.tube([-8, yl + 0.4, z1 - 0.2], [8, yl + 0.4, z1 - 0.2], 0.04, 0x5a5a56, m.tole, 4);
  T.tube([-8, yl + 2.4, z1 - 0.2], [8, yl + 2.4, z1 - 0.2], 0.04, 0x5a5a56, m.tole, 4);
  panneau(T, m.enseignes, R.couronne, { x: 0, y: yl + 1.45, z: z1 - 0.12 }, 16.5, 3.0);
  panneau(T, m.enseignes, R.lettreP, { x: 16.5 * (6.5 / 12 - 0.5) + 0.3, y: yl + 0.5, z: z1 + 0.05, rz: -0.9, rx: 0.1 }, 2.6, 2.6);
  // Le grand logo sur la face est de la couronne
  T.poser(geoCylindre(2.3, 0.2, 20), m.tole, 0x5a5a56, { x: x1 + 0.4, y: Y_COURONNE - 1.2, z: -3, rz: Math.PI / 2 });
  panneau(T, m.enseignes, R.logo, { x: x1 + 0.52, y: Y_COURONNE - 1.2, z: -3, ry: Math.PI / 2 }, 4.4, 4.4);
  // La bâche « La Compagnie pense à tout » : pend sur trois étages, au sud-ouest
  T.tube([-9.2, y0 + 8.5, z1 + 0.3], [-5.2, y0 + 8.5, z1 + 0.3], 0.04, 0x5a5a56, m.tole, 4);
  panneau(T, m.enseignes, R.banniere, { x: -7.2, y: y0 + 8.5 - 3.6, z: z1 + 0.32, rz: 0.03 }, 3.6, 7.2);
}

/**
 * Une façade de la tour (de `a` à `b`) : montants bronze sur toute la hauteur, par étage un nez de dalle, une allège
 * sombre et une bande de vitres (tombées, pendantes, stores de travers). L'étage brûlé n'a plus de vitres.
 */
function facadeTour(k, a, b, pas, rng) {
  const { T, m, usure } = k;
  const rm = repereMur(a, b);
  const n = Math.round(rm.L / pas);
  const du = rm.L / n;
  const { y0, niveaux, hn } = TOUR;
  const camera = pas < 2; // façades sud et est : plus de détail
  // Les montants, d'un seul tenant
  for (let i = 1; i < n; i++) boiteMur(T, rm, i * du - 0.05, i * du + 0.05, y0, Y_COURONNE, -0.05, 0.22, COUL.bronze, m.tole);
  for (let f = 0; f < niveaux; f++) {
    const y = y0 + f * hn;
    const brule = f === ETAGE_BRULE;
    const noirci = f === ETAGE_BRULE + 1;
    const jungle = f === ETAGE_JUNGLE;
    // Nez de dalle (béton) et allège
    boiteMur(T, rm, -0.1, rm.L + 0.1, y - 0.3, y + 0.1, -0.1, 0.18, brule || noirci ? 0x5a5550 : COUL.betonClair, m.beton, { crasse: false, nuance: 0.02 });
    boiteMur(T, rm, 0, rm.L, y + 0.1, y + 1.0, -0.06, 0.06, brule || noirci ? COUL.suie : COUL.allege, m.lisse, { crasse: false, nuance: 0.03 });
    // Les vitres
    for (let i = 0; i < n; i++) {
      const uc = (i + 0.5) * du;
      if (brule) {
        // Les traînées de suie montent de chaque baie vers l'étage du dessus
        if (rng() < 0.7) boiteMur(T, rm, uc - 0.4 - rng() * 0.2, uc + 0.4 + rng() * 0.2, y + hn - 0.3, y + hn + 1.0 + rng() * 1.6, 0.07, 0.08, COUL.suie, m.mat, { crasse: false, nuance: 0.1 });
        continue;
      }
      const r = rng();
      const manque = jungle ? 0.5 : 0.08 + 0.22 * usure;
      if (r < manque) continue;
      const [x, z] = rm.P(uc, 0.02);
      if (r < manque + 0.03 && camera) {
        // Une vitre qui pend dehors, tenue par un coin
        T.poser(PLAN, m.verre, COUL.verreBronze, { x, y: y + 1.5, z, ry: rm.ry, rx: 0.5, rz: 0.25, e: [du - 0.1, 2.0, 1] }, { crasse: false, nuance: 0 });
        continue;
      }
      T.poser(PLAN, m.verre, COUL.verreBronze, { x, y: y + 1.0 + (hn - 1.3) / 2 + 0.15, z, ry: rm.ry, e: [du - 0.1, hn - 1.3, 1] }, { crasse: false, nuance: 0.03 });
      // Un store vénitien derrière, baissé à moitié, parfois de travers
      if (camera && rng() < 0.22) {
        const [sx, sz] = rm.P(uc, -0.18);
        const hs = 0.5 + rng() * 1.3;
        T.boite(du - 0.2, hs, 0.03, 0xd8d2c0, { x: sx, y: y + hn - 0.3 - hs / 2, z: sz, ry: rm.ry, rz: rng() < 0.4 ? (rng() - 0.5) * 0.4 : 0 }, m.mat, { crasse: false, nuance: 0.05 });
      }
    }
  }
}

// ---------- L'auvent de l'entrée ----------

function auvent(k) {
  const { c, A, m } = k;
  // Une dalle de béton mince sur deux poteaux ronds, devant le tambour
  A.pave(-6, 4.5, HALL.z1, 6, 4.8, 10.2, COUL.betonClair, m.beton);
  A.pave(-6, 4.3, 10.0, 6, 4.8, 10.2, COUL.beton, m.beton);
  for (const x of [-5.5, 5.5]) {
    c.poser(geoCylindre(0.18, 4.5, 10), m.lisse, COUL.marbreNoir, { x, y: 2.25, z: 9.7 });
    k.b.obstacle(x - 0.2, 9.7, x + 0.2, 9.7, "poteau");
  }
  // Des stalactites de calcite et une coulure d'eau sous l'auvent
  for (let i = 0; i < 5; i++) A.boite(0.04, 0.2 + k.c.hasard() * 0.3, 0.04, 0xe6e2d8, { x: -5 + i * 2.3, y: 4.25, z: 8 + k.c.hasard() * 2 }, m.mat, { crasse: false });
}

// ---------- Le hall : mezzanine, escalators, accueil, logo (les deux cartes) ----------

/** Une flaque (eau de pluie), avec la matière de l'eau du lieu (une seule matière pour toutes). */
function flaque(k, ch, x, z, rayon, y = 0.075) {
  const pts = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const r = rayon * k.c.entre(0.6, 1.1);
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts)).rotateX(-Math.PI / 2);
  ch.poser(g, k.m.eau, 0x9aa49c, { x, y, z }, { crasse: false, nuance: 0 });
  g.dispose();
}

function hallInterieur(k) {
  const { c, T, m, usure } = k;
  const zM = HALL.zMezz;
  const yM = HALL.mezz;

  // La mezzanine (couche) : dalle, nez de dalle en marbre noir, garde-corps de verre, l'enseigne « Abonnés Premium »
  T.pave(HALL.x0, yM, HALL.z0, HALL.x1, yM + 0.35, zM, COUL.betonClair, m.beton, { crasse: false });
  T.pave(HALL.x0, yM - 0.25, zM - 0.05, HALL.x1, yM + 0.45, zM + 0.06, COUL.marbreNoir, m.lisse, { crasse: false });
  for (const [xa, xb] of [[HALL.x0, -9.5], [-6.5, HALL.x1]]) {
    for (let x = xa; x < xb - 0.1; x += 1.5) {
      const xe = Math.min(xb, x + 1.5);
      if (k.c.hasard() > k.bris * 0.4) T.poser(PLAN, m.verre, 0x9fb3b0, { x: (x + xe) / 2, y: yM + 0.9, z: zM, e: [xe - x - 0.06, 0.9, 1] }, { crasse: false, nuance: 0 });
      T.boite(0.05, 1.0, 0.05, COUL.inox, { x, y: yM + 0.95, z: zM }, m.metal);
    }
    T.tube([xa, yM + 1.45, zM], [xb, yM + 1.45, zM], 0.035, COUL.inox, m.metal, 5);
  }
  panneau(T, m.enseignes, R.premium, { x: 4.5, y: yM + 0.95, z: zM + 0.1, rz: -0.04 }, 3.0, 1.0);
  // Sur la mezzanine : canapés de l'espace premium, un ficus tombé, des bureaux
  for (const x of [-3, 1]) {
    T.pave(x, yM + 0.35, -8.6, x + 2.2, yM + 0.8, -7.8, COUL.cuir, m.satin);
    T.pave(x, yM + 0.8, -8.75, x + 2.2, yM + 1.3, -8.5, COUL.cuir, m.satin);
  }
  T.tube([7.5, yM + 0.6, -7.5], [10.8, yM + 0.9, -5.6], 0.12, 0x6a5040, m.mat, 5);
  for (let i = 0; i < 5; i++) T.poser(geoBoule(0.6), m.mat, i % 2 ? PALETTE.feuillage : PALETTE.feuillageSombre, { x: 10 + k.c.entre(0, 1.5), y: yM + 1 + k.c.entre(0, 0.8), z: -5.8 + k.c.entre(-0.8, 0.6), rx: i, e: [1, 0.7, 1] }, { crasse: false });
  T.pave(7, yM + 0.35, -8.2, 8, yM + 0.9, -7.4, 0x9e8a6c, m.satin);

  // Les colonnes rondes, gainées de marbre noir (bas : toujours visible ; haut : dans la couche)
  for (const [x, z] of [[-4, zM], [4, zM], [10, zM], [-3.5, 1.5], [3.5, 1.5]]) {
    c.poser(geoCylindre(0.5, yM, 12), m.lisse, COUL.marbreNoir, { x, y: yM / 2, z });
    c.poser(geoCylindre(0.56, 0.12, 12), m.metal, COUL.laiton, { x, y: 0.06, z });
    T.poser(geoCylindre(0.5, HALL.h - yM, 12), m.lisse, COUL.marbreNoir, { x, y: yM + (HALL.h - yM) / 2, z });
    k.b.obstacle(x - 0.5, z, x + 0.5, z, "colonne");
    k.b.obstacle(x, z - 0.5, x, z + 0.5, "colonne");
  }

  // Le grand logo et le nom, au-dessus de la mezzanine (mur nord, toujours visible)
  c.poser(geoCylindre(1.85, 0.14, 24), m.metal, COUL.laiton, { x: 0, y: 7.15, z: HALL.z0 + 0.22, rx: Math.PI / 2 });
  panneau(c, m.enseignes, R.logo, { x: 0, y: 7.15, z: HALL.z0 + 0.3 }, 3.5, 3.5);
  panneau(c, m.enseignes, R.titreHall, { x: 0, y: 5.25, z: HALL.z0 + 0.18 }, 7.6, 1.04);
  // Sous la mezzanine : trois portes d'ascenseur (une forcée, la gaine noire), les voyants d'étage
  for (const x of [-2.6, 0, 2.6]) {
    const force = x === 2.6;
    c.pave(x - 0.75, 0, HALL.z0 + 0.15, x + 0.75, 2.5, HALL.z0 + 0.2, COUL.inox, m.metal);
    if (force) {
      c.pave(x - 0.55, 0.06, HALL.z0 + 0.2, x + 0.55, 2.3, HALL.z0 + 0.22, 0x141414, m.mat, { crasse: false });
      c.boite(0.55, 2.2, 0.04, COUL.inox, { x: x - 0.75, y: 1.15, z: HALL.z0 + 0.32, ry: 0.15 }, m.metal);
      c.boite(0.55, 2.2, 0.04, COUL.inox, { x: x + 0.78, y: 1.15, z: HALL.z0 + 0.32, ry: -0.2 }, m.metal);
    } else {
      c.pave(x - 0.55, 0.06, HALL.z0 + 0.2, x - 0.01, 2.3, HALL.z0 + 0.25, 0xc9ccc8, m.metal);
      c.pave(x + 0.01, 0.06, HALL.z0 + 0.2, x + 0.55, 2.3, HALL.z0 + 0.25, 0xc9ccc8, m.metal);
    }
    c.pave(x - 0.4, 2.6, HALL.z0 + 0.15, x + 0.4, 2.78, HALL.z0 + 0.2, 0x1a1a1a, m.lisse);
  }
  // L'accueil : comptoir en arc, dessus de marbre blanc, bandeau de laiton
  {
    const cx = 0;
    const cz = -2.6;
    const r = 2.6;
    const pts = [];
    for (let i = 0; i <= 7; i++) {
      const a = (20 + (i * 140) / 7) * (Math.PI / 180);
      pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
    }
    for (let i = 0; i < 7; i++) {
      const [x1, z1] = pts[i];
      const [x2, z2] = pts[i + 1];
      const ry = -Math.atan2(z2 - z1, x2 - x1);
      const l = Math.hypot(x2 - x1, z2 - z1) + 0.04;
      const xm = (x1 + x2) / 2;
      const zm = (z1 + z2) / 2;
      c.boite(l, 1.1, 0.5, 0x3a3533, { x: xm, y: 0.55, z: zm, ry }, m.satin);
      c.boite(l + 0.04, 0.06, 0.72, COUL.marbreBlanc, { x: xm, y: 1.13, z: zm - 0.06 * Math.sin(-ry), ry }, m.lisse);
      c.boite(l, 0.07, 0.02, COUL.laiton, { x: xm + Math.sin(ry) * 0.26, y: 0.9, z: zm + Math.cos(ry) * 0.26, ry }, m.metal);
      k.b.obstacle(x1, z1, x2, z2, "comptoir");
    }
    // Derrière le comptoir : l'écran, le téléphone, les registres, la lampe, la chaise renversée
    c.boite(0.42, 0.38, 0.4, COUL.beige, { x: -0.8, y: 1.35, z: -1.6, ry: 0.3 }, m.satin);
    c.boite(0.34, 0.26, 0.02, 0x1e2224, { x: -0.74, y: 1.37, z: -1.39, ry: 0.3 }, m.lisse);
    c.boite(0.22, 0.08, 0.18, 0x2a2a2a, { x: 0.6, y: 1.2, z: -1.2 }, m.satin);
    c.boite(0.32, 0.05, 0.42, 0x7a2630, { x: 1.2, y: 1.19, z: -1.4, ry: 0.4 }, m.mat);
    c.tube([1.8, 1.16, -1.6], [1.9, 1.6, -1.5], 0.02, COUL.laiton, m.metal, 4);
    chaiseBureau(c, k, 0.4, -2.6, 2.2, true);
    jonchee(c, -1.5, -2.6, 2.5, -1, 18, [COUL.papier, 0xd6d0be, 0xf0ece0]);
  }
  // Les portiques de contrôle d'accès (inox et verre), un volet arraché
  for (let i = 0; i < 5; i++) {
    const x = 5.2 + i * 1.35;
    c.pave(x - 0.14, 0, -2.7, x + 0.14, 1.0, -1.3, COUL.inox, m.metal);
    c.pave(x - 0.12, 1.0, -2.65, x + 0.12, 1.04, -1.35, 0x1e2224, m.lisse);
    if (i < 4 && i !== 1) c.poser(PLAN, m.verre, 0xb8c8c4, { x: x + 0.38, y: 0.75, z: -2.0, ry: Math.PI / 2 + 0.6, e: [0.5, 0.5, 1] }, { crasse: false, nuance: 0 });
    k.b.obstacle(x, -2.7, x, -1.3, "portique");
  }
  c.poser(PLAN, m.verre, 0xb8c8c4, { x: 6.9, y: 0.08, z: -0.6, rx: -Math.PI / 2, ry: 0.4, e: [0.5, 0.5, 1] }, { crasse: false });
  // La vitrine des trophées « Meilleur taux d'abonnement » (mur est)
  {
    const x0 = 11.0;
    const x1 = HALL.x1 - EP / 2 - 0.02;
    c.pave(x0, 0, 0.2, x1, 0.8, 2.8, COUL.bois, m.satin);
    c.pave(x0, 2.0, 0.2, x1, 2.12, 2.8, COUL.bois, m.satin);
    c.pave(x0 + 0.05, 1.35, 0.25, x1, 1.37, 2.75, 0xb8c8c4, m.lisse);
    if (k.c.hasard() > k.bris * 0.7) c.poser(PLAN, m.verre, 0xb8c8c4, { x: x0, y: 1.4, z: 1.5, ry: Math.PI / 2, e: [2.6, 1.2, 1] }, { crasse: false, nuance: 0 });
    for (const [y, z] of [[0.8, 0.6], [0.8, 1.5], [0.8, 2.3], [1.37, 0.9], [1.37, 2.0]]) {
      c.poser(geoCylindre(0.07, 0.04, 8), m.metal, COUL.laiton, { x: (x0 + x1) / 2, y: y + 0.02, z });
      c.poser(geoCylindre(0.03, 0.2, 6), m.metal, COUL.laiton, { x: (x0 + x1) / 2, y: y + 0.13, z });
      c.poser(geoCylindre(0.06, 0.2, 10, 0.13), m.metal, COUL.laiton, { x: (x0 + x1) / 2, y: y + 0.33, z });
    }
    panneau(c, m.enseignes, R.trophee, { x: x0 - 0.01, y: 0.5, z: 1.5, ry: -Math.PI / 2 }, 1.1, 0.41);
    // Une coupe tombée par terre
    c.poser(geoCylindre(0.06, 0.2, 10, 0.13), m.metal, COUL.laiton, { x: 10.3, y: 0.15, z: 2.6, rz: Math.PI / 2, ry: 0.7 });
    k.b.obstacle(x0, 0.2, x0, 2.8, "vitrine");
  }
  // La borne « Votre consommation est exemplaire ! » (son écran luit encore)
  c.pave(4.95, 0, 4.25, 5.45, 0.95, 4.6, 0xe6e2d8, m.satin);
  c.boite(0.62, 0.9, 0.12, 0xe6e2d8, { x: 5.2, y: 1.3, z: 4.45, rx: -0.2 }, m.satin);
  panneau(c, m.neon, R.borne, { x: 5.2, y: 1.31, z: 4.52, rx: -0.2 }, 0.5, 0.75);
  k.b.obstacle(4.95, 4.4, 5.45, 4.4, "borne");
  // L'attente : deux canapés de cuir, une table basse, des magazines
  for (const [x, z, ry] of [[7.2, 2.6, 0], [8.9, 4.2, -Math.PI / 2]]) {
    c.repere({ x, z, ry }, () => {
      c.pave(-1.0, 0, -0.4, 1.0, 0.42, 0.4, COUL.cuir, m.satin);
      c.pave(-1.0, 0.42, -0.4, 1.0, 0.85, -0.22, COUL.cuir, m.satin);
      c.pave(-1.15, 0, -0.4, -1.0, 0.62, 0.4, COUL.cuir, m.satin);
      c.pave(1.0, 0, -0.4, 1.15, 0.62, 0.4, COUL.cuir, m.satin);
    });
  }
  c.pave(7.0, 0, 3.4, 8.0, 0.4, 4.2, COUL.marbreBlanc, m.lisse);
  jonchee(c, 6.8, 3.2, 8.4, 4.4, 5, [0xc8362b, 0x2f6f73, COUL.papier]);
  // L'affiche « La Compagnie pense à tout » (mur ouest, près de la cafétéria)
  panneau(c, m.enseignes, R.affiche, { x: HALL.x0 + EP / 2 + 0.02, y: 1.75, z: 2.4, ry: Math.PI / 2 }, 0.8, 1.2);

  // Le campement des Voltaïques, sous la mezzanine : duvets, caisse, lampe sur batterie, câbles
  {
    c.boite(0.8, 0.22, 2.0, 0x3f6f73, { x: 8.4, y: 0.17, z: -7.6, ry: 0.1 }, m.mat, { nuance: 0.05 });
    c.boite(0.8, 0.22, 2.0, 0xa4552f, { x: 10.8, y: 0.17, z: -7.4, ry: -0.08 }, m.mat, { nuance: 0.05 });
    c.boite(0.5, 0.3, 0.35, 0x8a8274, { x: 8.5, y: 0.22, z: -8.55 }, m.mat);
    c.pave(9.2, 0, -8.7, 10.0, 0.5, -8.1, PALETTE.boisGris, m.mat);
    lampeVoltaique(k, c, 9.6, -6.6);
    c.tube([9.65, 0.08, -6.5], [9.0, 0.08, -5.0], 0.02, 0x1a1a1a, m.satin, 4);
    c.tube([9.0, 0.08, -5.0], [6.5, 0.08, -4.8], 0.02, 0x1a1a1a, m.satin, 4);
    c.poser(geoCylindre(0.3, 0.25, 10), m.mat, 0xc0582c, { x: 11.3, y: 0.18, z: -5.6, rz: Math.PI / 2 });
    panneau(c, m.enseignes, R.graffiti, { x: 9.6, y: 2.4, z: HALL.z0 + 0.17 }, 2.4, 1.2);
  }
  // Le lustre des années 1970 (anneaux de laiton) tombé sur le marbre
  for (let i = 0; i < 10; i++) {
    if (i === 3 || i === 7) continue;
    const a0 = (i / 10) * Math.PI * 2;
    const a1 = ((i + 1) / 10) * Math.PI * 2;
    c.tube([-0.5 + Math.cos(a0) * 1.6, 0.12 + Math.sin(a0) * 0.18, 3.0 + Math.sin(a0) * 1.6], [-0.5 + Math.cos(a1) * 1.6, 0.12 + Math.sin(a1) * 0.18, 3.0 + Math.sin(a1) * 1.6], 0.06, COUL.laiton, m.metal, 5);
  }
  debris(c, -2, 2, 1.2, 4.2, 14, [0xe9e4d6, 0xc9c1ac, COUL.laiton]);
  // Le grand ficus, devenu arbre, a soulevé le marbre
  const FX = -10.75;
  const FZ = -0.6;
  c.poser(geoCylindre(1.0, 0.7, 10), m.lisse, COUL.marbreNoir, { x: FX, y: 0.35, z: FZ });
  arbre(c, FX, FZ, 7.5 + usure, "feuillu", 0.5);
  for (let i = 0; i < 5; i++) c.boite(1.0, 0.06, 1.0, i % 2 ? COUL.marbreBlanc : COUL.marbreNoir, { x: FX + k.c.entre(-1.8, 1.8), y: 0.12, z: FZ + k.c.entre(-2, 1.3), rx: k.c.entre(-0.2, 0.2), rz: k.c.entre(-0.2, 0.2), ry: k.c.entre(-0.3, 0.3) }, m.lisse);
  k.b.obstacle(FX - 1, FZ, FX + 1, FZ, "bac du ficus");
  // Les escalators figés vers la mezzanine
  escalators(k, -8, 3.6, zM, yM);

  // Papiers, plafonniers tombés, flaques, rais de lumière
  jonchee(c, -11, -8.5, 11.5, 5.5, Math.round(60 + 80 * usure), [COUL.papier, 0xd6d0be, 0xf0ece0, 0xc9c1ac]);
  debris(c, -11, -8.5, 11, 5.5, Math.round(16 + 30 * usure));
  for (let i = 0; i < 4; i++) c.boite(1.2, 0.05, 0.3, 0xe6e2d8, { x: k.c.entre(-10, 10), y: 0.1, z: k.c.entre(-8.4, -5), ry: k.c.hasard() * 3, rz: 0.1 }, m.satin);
  flaque(k, c, -6, 4.8, 1.2);
  flaque(k, c, 2.5, -6.5, 0.9);
  raiDeLumiere(c, [-3, 8.6, 6.4], [-5.5, 0.07, 1.6], 1.3);
  raiDeLumiere(c, [6, 8.6, 6.4], [3.5, 0.07, 1.4], 1.1);
}

/** Une lampe des Voltaïques sur trépied, branchée sur une batterie (blanc froid). */
function lampeVoltaique(k, c, x, z) {
  const m = k.m;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    c.poutre([x + Math.cos(a) * 0.45, 0.05, z + Math.sin(a) * 0.45], [x, 1.55, z], 0.03, 0x2a2a2a, m.tole);
  }
  c.boite(0.3, 0.22, 0.14, 0x2a2a2a, { x, y: 1.66, z, rx: 0.3 }, m.tole);
  c.boite(0.26, 0.18, 0.02, 0xf4fbff, { x, y: 1.66, z: z + 0.08, rx: 0.3 }, m.lisse, { crasse: false });
  c.pave(x - 0.55, 0, z + 0.2, x - 0.2, 0.24, z + 0.42, 0x262626, m.satin);
  c.boite(0.05, 0.04, 0.05, 0xc8362b, { x: x - 0.48, y: 0.26, z: z + 0.3 }, m.satin);
  c.tube([x - 0.3, 0.24, z + 0.3], [x, 1.5, z], 0.012, 0x1a1a1a, m.satin, 3);
}

/** Une chaise de bureau à roulettes (renversée ou non). */
function chaiseBureau(c, k, x, z, ry, renverse = false) {
  const m = k.m;
  c.repere({ x, z, ry, rz: renverse ? 1.45 : 0, y: renverse ? 0.3 : 0 }, () => {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      c.boite(0.34, 0.04, 0.05, 0x2a2a2a, { x: Math.cos(a) * 0.17, y: 0.08, z: Math.sin(a) * 0.17, ry: -a }, m.satin);
    }
    c.boite(0.05, 0.36, 0.05, 0x2a2a2a, { y: 0.28 }, m.metal);
    c.boite(0.48, 0.09, 0.46, 0x3a3a40, { y: 0.48 }, m.satin);
    c.boite(0.44, 0.5, 0.07, 0x3a3a40, { y: 0.8, z: -0.22, rx: -0.1 }, m.satin);
  });
}

/** Deux escalators côte à côte (axe x = `x`), du sol en z = `zBas` jusqu'à la mezzanine en (z = `zHaut`, y = `yHaut`). */
function escalators(k, x, zBas, zHaut, yHaut) {
  const { c, T, m } = k;
  const run = zBas - zHaut;
  const L = Math.hypot(run, yHaut);
  const pente = Math.atan2(yHaut, run);
  const P = (t) => [zBas - run * t, yHaut * t];
  const ch = (y) => (y < 2.4 ? c : T);
  // Le caisson sous les marches (en deux moitiés, la haute dans la couche)
  for (const [t0, t1] of [[0, 0.5], [0.5, 1]]) {
    const [za, ya] = P(t0);
    const [zb, yb] = P(t1);
    const ct = t0 === 0 ? c : T;
    ct.boite(2.8, 0.9, (L / 2) + 0.02, 0x3a3a3a, { x, y: (ya + yb) / 2 - 0.5, z: (za + zb) / 2, rx: pente }, m.tole);
    for (const dx of [-1.32, 0, 1.32]) {
      ct.boite(0.03, 0.85, L / 2, 0xb8c8c4, { x: x + dx, y: (ya + yb) / 2 + 0.5, z: (za + zb) / 2, rx: pente }, m.verre, { crasse: false, nuance: 0 });
      ct.boite(0.08, 0.08, L / 2 + 0.02, 0x161616, { x: x + dx, y: (ya + yb) / 2 + 0.95, z: (za + zb) / 2, rx: pente }, m.satin);
    }
  }
  // Les marches (en dents de scie), figées
  const n = 22;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const [z, y] = P(t);
    for (const dx of [-0.66, 0.66]) ch(y).boite(1.1, 0.2, run / n + 0.02, 0x6a6a68, { x: x + dx, y: y + 0.0, z }, m.tole, { crasse: false });
  }
  // Les paliers de départ, la barrière « hors service »
  c.pave(x - 1.4, 0, zBas, x + 1.4, 0.08, zBas + 0.9, 0x8d8f8a, m.metal);
  for (const dx of [-1.3, 1.3]) c.tube([x + dx, 0, zBas + 1.1], [x + dx, 1.0, zBas + 1.1], 0.03, COUL.inox, m.metal, 5);
  c.boite(2.6, 0.08, 0.02, 0xc8362b, { x, y: 0.9, z: zBas + 1.1, rz: 0.05 }, m.satin);
  c.boite(2.4, 0.08, 0.02, 0xe6e2d8, { x, y: 0.82, z: zBas + 1.1, rz: 0.08 }, m.satin);
  k.b.obstacle(x - 1.45, zBas + 1.1, x + 1.45, zBas + 1.1, "escalator");
  k.b.obstacle(x - 1.45, zHaut, x - 1.45, zBas + 1.1, "escalator");
  k.b.obstacle(x + 1.45, zHaut, x + 1.45, zBas + 1.1, "escalator");
}

// ---------- La cafétéria d'entreprise (carte « parvis ») ----------

/** Une table ronde de cafétéria et ses chaises (`etat` : « mise », « renversee »). */
function tableCafet(k, x, z, etat) {
  const { c, m } = k;
  if (etat === "renversee") {
    c.poser(geoCylindre(0.6, 0.04, 12), m.satin, 0xe6e2d8, { x, y: 0.6, z: z + 0.1, rx: Math.PI / 2 - 0.1 });
    c.tube([x, 0.6, z + 0.12], [x, 0.6, z - 0.6], 0.04, COUL.inox, m.metal, 5);
  } else {
    c.poser(geoCylindre(0.6, 0.04, 12), m.satin, 0xe6e2d8, { x, y: 0.74, z });
    c.tube([x, 0.05, z], [x, 0.72, z], 0.04, COUL.inox, m.metal, 5);
    c.poser(geoCylindre(0.3, 0.03, 8), m.metal, COUL.inox, { x, y: 0.02, z });
    // Un plateau, une assiette, un gobelet
    c.boite(0.45, 0.02, 0.32, 0x8a6a4a, { x: x + 0.1, y: 0.77, z, ry: k.c.hasard() }, m.satin);
    c.poser(geoCylindre(0.1, 0.02, 10), m.lisse, 0xf0ece4, { x: x + 0.12, y: 0.79, z });
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.3;
    const cx = x + Math.cos(a) * 0.85;
    const cz = z + Math.sin(a) * 0.85;
    const tombee = k.c.hasard() < 0.25 + 0.3 * k.usure;
    c.repere({ x: cx, z: cz, ry: -a + Math.PI / 2 + (tombee ? k.c.entre(-1, 1) : 0), rx: tombee ? -1.4 : 0, y: tombee ? 0.22 : 0 }, () => {
      c.boite(0.42, 0.04, 0.42, COUL.canard, { y: 0.45 }, m.satin);
      c.boite(0.42, 0.4, 0.04, COUL.canard, { y: 0.68, z: 0.2 }, m.satin);
      for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) c.boite(0.025, 0.45, 0.025, COUL.inox, { x: dx, y: 0.22, z: dz }, m.metal);
    });
  }
}

function cafeteria(k) {
  const { c, K, m, usure } = k;
  const { x0, x1, z0, z1, h } = CAFET;
  const beton = { couleur: COUL.beton, mat: m.beton, ep: EP };
  // Façade sud vitrée (la terrasse), coupée à hauteur d'allège
  murRideau(k, [x0, z1], [x1, z1], { h, pas: 2, sup: K, traverses: [2.6], portes: [{ u: 12, l: 1.8, haut: 2.5 }] });
  K.pave(x0 - 0.15, h - 0.5, z1 - 0.05, x1, h + 0.5, z1 + 0.2, COUL.beton, m.beton);
  // Mur ouest (fond) : jours hauts ; mur nord : porte de la cuisine
  mur(c, [x0, z0], [x0, z1], { ...beton, h, ouvertures: [3, 6.5, 10].map((u) => ({ u, l: 1.8, bas: 2.3, haut: 3.6, type: "fenetre", ...OPT_FEN(), bris: k.bris })) });
  k.b.obstacle(x0, z0, x0, z1);
  murCoupe(k, [x1, z0], [x0, z0], { ...beton, h, cut: 0, ouvertures: [{ u: 14, l: 1.2, bas: 0, haut: 2.2, type: "vide" }] });
  // Le toit (couche) : percé au-dessus du ficus, gravillons, caissons de ventilation
  const trou = { x0: -27.6, x1: -24.4, z0: -7, z1: -3.6 };
  const dalle = (xa, za, xb, zb) => K.pave(xa, h, za, xb, h + 0.3, zb, COUL.betonSombre, m.beton, { crasse: false, nuance: 0.02 });
  dalle(x0 - 0.15, z0 - 0.15, x1, trou.z0);
  dalle(x0 - 0.15, trou.z1, x1, z1 + 0.15);
  dalle(x0 - 0.15, trou.z0, trou.x0, trou.z1);
  dalle(trou.x1, trou.z0, x1, trou.z1);
  K.pave(x0 - 0.15, h + 0.3, z0 - 0.15, x1, h + 0.75, z0 + 0.1, COUL.beton, m.beton);
  K.pave(x0 - 0.15, h + 0.3, z0 - 0.15, x0 + 0.1, h + 0.75, z1 + 0.15, COUL.beton, m.beton);
  for (const [x, z] of [[-17, -6], [-20.5, 1]]) K.pave(x - 1, h + 0.3, z - 0.7, x + 1, h + 1.4, z + 0.7, COUL.tole, m.tole);
  mousse(K, -20, h + 0.3, -2, 2, Math.round(3 + 5 * usure));
  touffes(K, [[-14, 3, h + 0.3], [-27, 2.5, h + 0.3], [-23, -8, h + 0.3]], PALETTE.herbeSeche);
  // Le self : comptoir inox, glissière à plateaux, vitre pare-haleine, le menu à l'ardoise
  c.pave(-26.5, 0, -8.4, -16, 0.9, -7.5, COUL.inox, m.metal);
  c.pave(-26.5, 0.9, -8.4, -16, 0.95, -7.5, 0xd8dbd6, m.metal);
  c.tube([-26.5, 0.82, -7.3], [-16, 0.82, -7.3], 0.025, COUL.inox, m.metal, 4);
  for (let x = -26; x < -16; x += 2.5) if (k.c.hasard() > k.bris * 0.6) c.poser(PLAN, m.verre, 0xb8c8c4, { x: x + 1.2, y: 1.3, z: -7.7, rx: 0.3, e: [2.3, 0.6, 1] }, { crasse: false, nuance: 0 });
  for (let i = 0; i < 6; i++) c.boite(0.45, 0.02, 0.32, 0x8a6a4a, { x: -25.8 + i * 0.05, y: 0.97 + i * 0.025, z: -7.95 }, m.satin);
  panneau(c, m.enseignes, R.menu, { x: -21, y: 2.3, z: z0 + EP / 2 + 0.02 }, 1.2, 1.35);
  k.b.obstacle(-26.5, -7.5, -16, -7.5, "comptoir");
  // La machine à café connectée (écran : « Mise à jour en cours… 3 % »)
  c.pave(-15.2, 0, -8.6, -14.4, 1.8, -8.0, 0x2a2e30, m.satin);
  panneau(c, m.neon, R.cafe, { x: -14.8, y: 1.35, z: -7.99 }, 0.5, 0.25);
  // Les tables
  const etats = ["mise", "renversee", "mise", "mise", "renversee", "mise"];
  let i = 0;
  for (const z of [-4, 0.6]) for (const x of [-25.2, -21.7, -18.2]) tableCafet(k, x, z, etats[i++]);
  tableCafet(k, -14.8, -1.2, "mise");
  // Le ficus devenu arbre, qui sort par le trou du toit
  c.poser(geoCylindre(0.7, 0.6, 10), m.beton, COUL.beton, { x: -26, y: 0.3, z: -5.3 });
  arbre(c, -26, -5.3, 7 + usure * 1.5, "feuillu", 0.5);
  k.b.obstacle(-26.7, -5.3, -25.3, -5.3, "bac du ficus");
  gravats(c, -25, -3.4, 1.2, 8, [COUL.betonSombre, COUL.beton, 0x8a8274]);
  raiDeLumiere(c, [-26, 4.4, -5.3], [-25.4, 0.07, -3.9], 2.2);
  flaque(k, c, -24.5, -4.2, 1.3);
  // Papiers, gobelets, plateaux
  jonchee(c, x0 + 0.5, z0 + 1.5, x1 - 0.5, z1 - 0.5, Math.round(30 + 40 * usure), [COUL.papier, 0xd6d0be, 0x8a6a4a]);
  debris(c, x0 + 0.5, z0 + 1, x1 - 0.5, z1 - 0.5, Math.round(10 + 20 * usure));
  // La terrasse : tables, parasol déchiré
  for (const [x, z] of [[-24, 6.4], [-19, 7]]) {
    c.poser(geoCylindre(0.5, 0.04, 10), m.satin, 0xd8d2c0, { x, y: 0.72, z });
    c.tube([x, 0.05, z], [x, 2.3, z], 0.035, COUL.inox, m.metal, 5);
    c.poser(new THREE.ConeGeometry(1.4, 0.5, 8, 1, true), m.mat, 0xc8362b, { x, y: 2.4, z, rz: 0.12 }, { nuance: 0.1, crasse: false });
  }
  c.boite(0.42, 0.04, 0.42, COUL.canard, { x: -23, y: 0.2, z: 7.3, rx: 1.3 }, m.satin);
  // Le lierre sur le mur ouest, aveugle
  lierre(c, x0 - 0.18, 0, -2, -Math.PI / 2, 7, 4, Math.round(60 + 80 * usure));
}

// ---------- Le parvis, la fontaine, Watty (carte « parvis ») ----------

/** Un panneau courbe (portion de cylindre) qui reçoit une image de l'atlas : face vers +z local. */
function panneauCourbe(c, mat, r, pose, rayon, h, angle) {
  const g = new THREE.CylinderGeometry(rayon, rayon, h, 8, 1, true, -angle / 2, angle);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
  c.poser(g, mat, 0xffffff, pose, { crasse: false, nuance: 0 });
  g.dispose();
}

/** La statue de Watty, tombée : la pile géante couchée en travers du bassin, face au ciel. Renvoie la position de la prise. */
function statueWatty(k) {
  const { c, m } = k;
  const F = FONTAINE;
  const d = new THREE.Vector3(0.848, 0, 0.53).normalize();
  const pieds = [F.x + d.x * 1.7, F.z + d.z * 1.7];
  const theta = -Math.atan2(d.z, d.x);
  const roulis = -1.2;
  // Le repère de la statue : axe de la pile selon +y local, le visage vers +z local
  const M = new THREE.Matrix4()
    .makeTranslation(pieds[0], 1.32, pieds[1])
    .multiply(new THREE.Matrix4().makeRotationY(theta))
    .multiply(new THREE.Matrix4().makeRotationZ(-Math.PI / 2))
    .multiply(new THREE.Matrix4().makeRotationY(roulis));
  const monde = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(M);
  const prise = monde(2.9, 2.2, 0.9);
  c.repere({ x: pieds[0], y: 1.32, z: pieds[1], ry: theta }, () =>
    c.repere({ rz: -Math.PI / 2 }, () =>
      c.repere({ ry: roulis }, () => {
        c.poser(geoCylindre(1.34, 0.4, 16), m.satin, COUL.wattyCape, { y: 0.2 });
        c.poser(geoCylindre(1.3, 5.0, 16), m.satin, COUL.watty, { y: 2.9 });
        c.poser(geoCylindre(1.35, 0.65, 16), m.satin, COUL.wattyCape, { y: 5.72 });
        c.poser(geoCylindre(0.45, 0.4, 10), m.metal, 0xb9bcb8, { y: 6.25 });
        panneauCourbe(c, m.enseignes, R.visage, { y: 4.1 }, 1.315, 1.9, 1.6);
        panneauCourbe(c, m.enseignes, R.eclair, { y: 2.1 }, 1.315, 1.8, 0.75);
        // Un éclat : la résine a sauté, on voit le creux
        c.boite(0.7, 0.5, 0.3, 0x2a2622, { x: 0.95, y: 1.4, z: 0.85, ry: 0.8 }, m.mat, { crasse: false });
        // Le bras du haut : le pouce levé vers le ciel
        c.tube([-1.2, 3.6, 0], [-2.2, 4.4, 0.6], 0.22, COUL.watty, m.satin, 7);
        c.poser(geoBoule(0.42), m.satin, COUL.gant, { x: -2.35, y: 4.55, z: 0.7, e: [1, 1.2, 0.9] });
        c.boite(0.18, 0.45, 0.18, COUL.gant, { x: -2.5, y: 4.95, z: 0.75, rz: 0.4 }, m.satin);
        // Le bras du bas : il tient toujours la prise
        c.tube([1.2, 3.4, 0], [2.4, 2.6, 0.6], 0.22, COUL.watty, m.satin, 7);
        c.poser(geoBoule(0.42), m.satin, COUL.gant, { x: 2.55, y: 2.45, z: 0.75, e: [1, 1.2, 0.9] });
        c.boite(0.5, 0.36, 0.36, 0xe6e2d8, { x: 2.95, y: 2.2, z: 0.95 }, m.satin);
        for (const dz of [-0.08, 0.08]) c.boite(0.25, 0.05, 0.05, COUL.laiton, { x: 3.3, y: 2.2, z: 0.95 + dz }, m.metal);
        // Les moignons des jambes, cassées aux chevilles
        for (const dx of [-0.5, 0.5]) {
          c.tube([dx, 0, 0], [dx, -0.55, 0.1], 0.26, COUL.wattyCape, m.satin, 7);
          c.poser(geoBoule(0.3), m.mat, 0x8a7a50, { x: dx, y: -0.6, z: 0.1, e: [1, 0.5, 1] });
        }
      })));
  // Le câble de la prise, qui serpente sur la dalle
  const pts = [[prise.x, 0.9, prise.z], [prise.x + 0.5, 0.64, prise.z + 0.6], [prise.x + 0.9, 0.62, prise.z + 1.1], [prise.x + 1.6, 0.08, prise.z + 1.8], [prise.x + 3.2, 0.08, prise.z + 1.6], [prise.x + 4.2, 0.08, prise.z + 2.8]];
  for (let i = 0; i < pts.length - 1; i++) c.tube(pts[i], pts[i + 1], 0.07, 0x262626, m.satin, 5);
  // La mousse et les fientes sur la pile
  for (let i = 0; i < 4; i++) {
    const p = monde(k.c.entre(-0.3, 0.3), 1 + i * 1.3, 0.2);
    mousse(c, p.x, Math.max(p.y + 0.95, 0.5), p.z, 0.5, 3);
  }
  // Obstacles : la pile couchée (un rectangle)
  const a = monde(0, -0.3, 0);
  const b = monde(0, 6.5, 0);
  const nx = -d.z * 1.3;
  const nz = d.x * 1.3;
  k.b.obstacle(a.x + nx, a.z + nz, b.x + nx, b.z + nz, "statue de Watty");
  k.b.obstacle(a.x - nx, a.z - nz, b.x - nx, b.z - nz, "statue de Watty");
  k.b.obstacle(b.x + nx, b.z + nz, b.x - nx, b.z - nz, "statue de Watty");
  return prise;
}

function fontaine(k) {
  const { c, m, usure } = k;
  const F = FONTAINE;
  // La margelle : vingt blocs de pierre ; deux ont éclaté sous la tête de Watty
  const n = 20;
  const angleTete = Math.atan2(0.53, 0.848);
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * Math.PI * 2;
    if (Math.abs(((a - angleTete + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.3) continue;
    const x = F.x + Math.cos(a) * F.r;
    const z = F.z + Math.sin(a) * F.r;
    c.boite((Math.PI * 2 * F.r) / n + 0.05, 0.55, 0.5, COUL.betonClair, { x, y: 0.28, z, ry: -a + Math.PI / 2 }, m.beton, { nuance: 0.03 });
  }
  gravats(c, F.x + Math.cos(angleTete) * (F.r + 0.6), F.z + Math.sin(angleTete) * (F.r + 0.6), 1.3, 10, [COUL.betonClair, COUL.beton, 0xd2bd45]);
  // L'eau croupie, verte ; des lentilles d'eau
  const eau = new THREE.CircleGeometry(F.r - 0.2, 20).rotateX(-Math.PI / 2);
  c.poser(eau, m.eau, 0xd8e0c8, { x: F.x, y: 0.36, z: F.z }, { crasse: false, nuance: 0 });
  eau.dispose();
  c.poser(geoCylindre(F.r - 0.2, 0.06, 20), m.mat, 0x3a4434, { x: F.x, y: 0.05, z: F.z }, { crasse: false });
  mousse(c, F.x - 3, 0.36, F.z - 1.5, 1.6, Math.round(4 + 6 * usure), 0x6f8a3a);
  mousse(c, F.x + 1, 0.36, F.z + 3.6, 1.0, Math.round(3 + 4 * usure), 0x6f8a3a);
  // Les jets éteints, en couronne
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    c.tube([F.x + Math.cos(a) * 3.6, 0.05, F.z + Math.sin(a) * 3.6], [F.x + Math.cos(a) * 3.6, 0.55, F.z + Math.sin(a) * 3.6], 0.05, COUL.laiton, m.metal, 5);
  }
  // Le socle octogonal, la plaque, et les chaussures rouges restées debout
  c.poser(geoCylindre(1.35, 2.1, 8), m.lisse, COUL.marbreNoir, { x: F.x, y: 1.05, z: F.z, ry: Math.PI / 8 });
  c.poser(geoCylindre(1.5, 0.15, 8), m.lisse, COUL.marbreNoir, { x: F.x, y: 2.15, z: F.z, ry: Math.PI / 8 });
  panneau(c, m.enseignes, R.plaqueWatty, { x: F.x, y: 1.3, z: F.z + 1.35 * Math.cos(Math.PI / 8) + 0.02 }, 1.0, 0.27);
  for (const [dx, dz, ry] of [[-0.45, 0.05, 0.15], [0.45, -0.05, -0.1]]) {
    c.repere({ x: F.x + dx, y: 2.22, z: F.z + dz, ry }, () => {
      c.boite(0.55, 0.32, 0.95, COUL.rougeWatty, { y: 0.16, z: 0.1 }, m.satin);
      c.poser(geoBoule(0.32), m.satin, COUL.rougeWatty, { y: 0.16, z: 0.55, e: [0.9, 0.55, 0.8] });
      c.boite(0.6, 0.06, 1.0, 0xe6e2d8, { y: 0.03, z: 0.12 }, m.satin);
      c.tube([0, 0.3, 0], [0, 0.9, -0.04], 0.24, COUL.wattyCape, m.satin, 7);
      c.poser(geoBoule(0.28), m.mat, 0x8a7a50, { y: 0.92, e: [1, 0.5, 1] });
    });
  }
  // Obstacles : la margelle (octogone grossier)
  for (let i = 0; i < 10; i++) {
    const a0 = (i / 10) * Math.PI * 2;
    const a1 = ((i + 1) / 10) * Math.PI * 2;
    if (Math.abs(((a0 + 0.31 - angleTete + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.35) continue;
    k.b.obstacle(F.x + Math.cos(a0) * F.r, F.z + Math.sin(a0) * F.r, F.x + Math.cos(a1) * F.r, F.z + Math.sin(a1) * F.r, "margelle");
  }
  return statueWatty(k);
}

/** Un lampadaire des années 1970 : mât, globe opalin (parfois tombé). */
function lampadaire(k, x, z, tombe = false) {
  const { c, m } = k;
  if (tombe) {
    c.tube([x, 0.15, z], [x + 4.2, 0.2, z + 1.2], 0.08, 0x4a4a48, m.tole, 6);
    c.poser(geoBoule(0.3, 1), m.lisse, 0xe6e2d8, { x: x + 4.6, y: 0.3, z: z + 1.4 });
    c.poser(geoCylindre(0.2, 0.4, 8), m.beton, COUL.beton, { x, y: 0.2, z });
    return;
  }
  c.tube([x, 0, z], [x, 4.4, z], 0.08, 0x4a4a48, m.tole, 6);
  c.poser(geoCylindre(0.14, 0.3, 8), m.tole, 0x4a4a48, { x, y: 4.45, z });
  if (k.c.hasard() > 0.35) c.poser(geoBoule(0.32, 1), m.lisse, 0xe6e2d8, { x, y: 4.85, z });
  k.b.obstacle(x - 0.1, z, x + 0.1, z, "lampadaire");
}

/** Un bac de béton hexagonal (arbre ou arbuste) et son banc. */
function bac(k, x, z, quoi) {
  const { c, m, usure } = k;
  c.poser(geoCylindre(1.5, 0.6, 6), m.beton, COUL.betonClair, { x, y: 0.3, z });
  c.poser(geoCylindre(1.35, 0.04, 6), m.mat, PALETTE.terreSombre, { x, y: 0.61, z });
  if (quoi === "arbre") arbre(c, x, z, 6.5 + usure * 2, "feuillu", 0.6);
  else if (quoi === "mort") arbre(c, x, z, 5, "mort", 0.6);
  else arbuste(c, x, z, 1.6 + usure, 0.6);
  c.pave(x - 1.2, 0, z + 1.8, x + 1.2, 0.42, z + 2.3, COUL.betonClair, m.beton);
  c.pave(x - 1.2, 0.42, z + 1.8, x + 1.2, 0.48, z + 2.3, PALETTE.boisGris, m.mat);
  for (const [a, b] of [[[x - 1.5, z - 0.85], [x + 1.5, z - 0.85]], [[x - 1.5, z + 0.85], [x + 1.5, z + 0.85]]]) k.b.obstacle(a[0], a[1], b[0], b[1], "bac");
}

/** La camionnette d'intervention de la Compagnie, pneus à plat. */
function camionnette(k, x, z, ry) {
  const { c, m } = k;
  c.repere({ x, z, ry }, () => {
    c.pave(-2.4, 0.45, -0.95, 1.4, 2.4, 0.95, 0xdcd8cc, m.satin);
    c.pave(1.4, 0.45, -0.95, 2.6, 1.6, 0.95, 0xdcd8cc, m.satin);
    c.boite(0.9, 0.7, 1.8, 0x2a3236, { x: 1.95, y: 1.95, z: 0, rz: -0.35 }, m.verre);
    c.pave(1.45, 1.55, -0.96, 2.1, 2.2, 0.96, 0x2a3236, m.lisse);
    panneau(c, m.enseignes, R.camion, { x: -0.5, y: 1.5, z: 0.96 }, 3.6, 0.72);
    panneau(c, m.enseignes, R.camion, { x: -0.5, y: 1.5, z: -0.96, ry: Math.PI }, 3.6, 0.72);
    c.pave(-2.45, 0.3, -1.0, 2.65, 0.5, 1.0, 0x3a3a3a, m.tole);
    // L'échelle sur la galerie, le gyrophare orange
    c.pave(-2.2, 2.45, -0.5, 1.2, 2.5, -0.3, COUL.inox, m.metal);
    c.pave(-2.2, 2.45, 0.3, 1.2, 2.5, 0.5, COUL.inox, m.metal);
    c.boite(0.3, 0.15, 0.3, 0xd98a2a, { x: 1.2, y: 2.5 }, m.lisse);
    for (const [wx, wz] of [[-1.6, -0.95], [-1.6, 0.95], [1.8, -0.95], [1.8, 0.95]]) c.poser(geoCylindre(0.38, 0.26, 8), m.satin, 0x1e1e1e, { x: wx, y: 0.3, z: wz, rx: Math.PI / 2, e: [1, 1, 0.75] });
    // La porte arrière ouverte, une caisse à outils renversée
    c.boite(0.05, 1.8, 0.9, 0xdcd8cc, { x: -2.85, y: 1.45, z: 1.3, ry: 1.2 }, m.satin);
    c.boite(0.5, 0.25, 0.3, 0xc8362b, { x: -3.2, y: 0.15, z: 0.3, ry: 0.5, rz: 0.3 }, m.tole);
  });
  const P = (u, v) => [x + Math.cos(ry) * u + Math.sin(ry) * v, z - Math.sin(ry) * u + Math.cos(ry) * v];
  const p = [P(-2.5, -1), P(2.7, -1), P(2.7, 1), P(-2.5, 1)];
  for (let i = 0; i < 4; i++) k.b.obstacle(p[i][0], p[i][1], p[(i + 1) % 4][0], p[(i + 1) % 4][1], "camionnette");
}

/** Un abribus : poteaux, toit, vitres, banc, l'affiche « La Compagnie pense à tout ». */
function abribus(k, x, z) {
  const { c, m } = k;
  c.pave(x - 2, 2.4, z - 0.8, x + 2, 2.5, z + 0.7, 0x4a4e4c, m.tole);
  for (const dx of [-1.9, 1.9]) for (const dz of [-0.7, 0.6]) c.tube([x + dx, 0, z + dz], [x + dx, 2.4, z + dz], 0.04, 0x4a4e4c, m.tole, 5);
  c.poser(PLAN, m.verre, 0xb8c8c4, { x: x - 0.6, y: 1.3, z: z - 0.72, e: [2.4, 2.0, 1] }, { crasse: false, nuance: 0 });
  c.pave(x + 0.9, 0.1, z - 0.76, x + 1.85, 2.2, z - 0.68, 0x4a4e4c, m.tole);
  panneau(c, m.enseignes, R.affiche, { x: x + 1.37, y: 1.2, z: z - 0.66 }, 0.86, 1.3);
  c.pave(x - 1.6, 0.42, z - 0.6, x + 0.6, 0.48, z - 0.3, PALETTE.boisGris, m.mat);
  k.b.obstacle(x - 1.9, z - 0.72, x + 1.9, z - 0.72, "abribus");
}

/** Une petite voiture de l'Abondance, pneus à plat, vitres crevées. */
function voiture(k, x, z, ry, teinte) {
  const { c, m } = k;
  c.repere({ x, z, ry }, () => {
    c.pave(-2.0, 0.3, -0.85, 2.0, 0.95, 0.85, teinte, m.satin);
    c.pave(-1.1, 0.95, -0.78, 0.9, 1.5, 0.78, teinte, m.satin);
    c.pave(-1.05, 1.0, -0.8, 0.85, 1.42, 0.8, 0x2a3236, m.verre);
    for (const [wx, wz] of [[-1.3, -0.85], [-1.3, 0.85], [1.3, -0.85], [1.3, 0.85]]) c.poser(geoCylindre(0.33, 0.22, 8), m.satin, 0x1e1e1e, { x: wx, y: 0.26, z: wz, rx: Math.PI / 2, e: [1, 1, 0.7] });
    mousse(c, 0, 1.5, 0, 0.5, 2);
  });
  const P = (u, v) => [x + Math.cos(ry) * u + Math.sin(ry) * v, z - Math.sin(ry) * u + Math.cos(ry) * v];
  const p = [P(-2, -0.9), P(2, -0.9), P(2, 0.9), P(-2, 0.9)];
  for (let i = 0; i < 4; i++) k.b.obstacle(p[i][0], p[i][1], p[(i + 1) % 4][0], p[(i + 1) % 4][1], "voiture");
}

function parvis(k) {
  const { c, m, usure } = k;
  fontaine(k);
  // Les mâts des drapeaux ; un seul drapeau, en loques
  for (const [i, x] of [[0, 7.5], [1, 9.3], [2, 11.1]]) {
    c.poser(geoCylindre(0.25, 0.2, 8), m.beton, COUL.beton, { x, y: 0.1, z: 12.6 });
    c.tube([x, 0, 12.6], [x, 10.5 - i * 0.2, 12.6], 0.06, 0xb9bcb8, m.metal, 6);
    c.poser(geoBoule(0.1), m.metal, COUL.laiton, { x, y: 10.6 - i * 0.2, z: 12.6 });
    k.b.obstacle(x - 0.2, 12.6, x + 0.2, 12.6, "mât");
  }
  c.boite(0.04, 1.4, 1.1, COUL.rougeWatty, { x: 9.3, y: 9.4, z: 13.15, rx: 0.06 }, m.mat, { nuance: 0.1, crasse: false });
  c.boite(0.04, 0.6, 0.5, 0xe9dfc6, { x: 9.3, y: 9.95, z: 13.9, rx: 0.2 }, m.mat, { crasse: false });
  // Les lampadaires
  lampadaire(k, -14, 12);
  lampadaire(k, 5, 14.5);
  lampadaire(k, -14, 27);
  lampadaire(k, 10, 29, true);
  lampadaire(k, -27, 19);
  // Les bacs plantés, les bancs
  bac(k, -21, 13, "arbre");
  bac(k, -26, 27, "arbre");
  bac(k, 7, 31.5, "mort");
  bac(k, -19.5, 22, "arbuste");
  // La camionnette de la Compagnie
  camionnette(k, 9.4, 18.6, 0.35);
  // Le totem de la Compagnie, au bord de la rue
  c.pave(-12.8, 0, 32.2, -11.2, 3.4, 32.7, COUL.beton, m.beton);
  panneau(c, m.enseignes, R.logo, { x: -12, y: 2.5, z: 32.72 }, 1.2, 1.2);
  k.b.obstacle(-12.8, 32.45, -11.2, 32.45, "totem");
  // La borne de recharge « Watty Express » (morte), au bord de la rue
  c.pave(-25.4, 0, 32.6, -24.6, 1.6, 33.0, 0xe6e2d8, m.satin);
  panneau(c, m.enseignes, R.borneRecharge, { x: -25, y: 0.9, z: 33.01 }, 0.7, 1.05);
  c.tube([-24.6, 1.1, 32.8], [-23.6, 0.08, 33.6], 0.04, 0x1e1e1e, m.satin, 4);
  // La bordure du trottoir, des marquages délavés sur la rue
  c.pave(-32, 0, 33.9, 13, 0.16, 34.15, COUL.betonClair, m.beton);
  for (let x = -30; x < 13; x += 5) c.pave(x, 0.02, 35.05, x + 2.6, 0.03, 35.2, 0xd8d4c4, m.mat, { crasse: false });
  // Les éclats de vitres tombées de la tour, au pied de la façade
  debris(c, -11, 6.3, 11, 9.5, Math.round(30 + 40 * usure), [0x9fb3b0, 0x7d9290, 0xc9d6d2]);
  for (let i = 0; i < 3; i++) c.boite(1.5, 0.05, 2.0, COUL.bronze, { x: -9 + i * 7.5 + k.c.entre(-1, 1), y: 0.08, z: 8 + k.c.entre(0, 2), ry: k.c.entre(-0.6, 0.6), rx: k.c.entre(-0.06, 0.06) }, m.tole);
  // L'abribus de la rue, et son affiche de la Compagnie
  abribus(k, -20, 32.6);
  // Deux voitures abandonnées sur la rue
  voiture(k, -4, 35.2, 0.06, 0x6f8b9a);
  voiture(k, 7.5, 35.4, Math.PI + 0.1, 0xb9a77a);
  // Des bouleaux ont poussé dans les joints de la dalle
  arbre(c, -29, 15, 5 + usure * 2.5, "bouleau");
  if (usure > 0.4) arbre(c, 1.5, 31.5, 4 + usure * 2, "bouleau");
  // Les papiers des bureaux, soufflés jusque sur le parvis
  jonchee(c, -12, 6.5, 12, 20, Math.round(20 + 30 * usure), [COUL.papier, 0xd6d0be, 0xf0ece0]);
  // La végétation qui reprend la dalle
  const pts = [];
  for (let i = 0; i < Math.round(36 + 64 * usure); i++) {
    const x = k.c.entre(-31, 12);
    const z = k.c.entre(7, 33.5);
    if (Math.hypot(x - FONTAINE.x, z - FONTAINE.z) < FONTAINE.r + 0.4) continue;
    pts.push([x, z]);
  }
  touffes(c, pts, PALETTE.herbeSeche);
  for (const [x, z, s] of [[-30, 9, 1.2], [-8, 30, 0.9], [4, 10.5, 0.8], [-29, 31, 1.4], [11.5, 24, 1.0]]) arbuste(c, x, z, s * (0.6 + usure));
  jonchee(c, -31, 7, 12, 33, Math.round(30 + 40 * usure));
  flaque(k, c, -9, 15, 1.6, 0.05);
  flaque(k, c, 2, 31, 1.2, 0.05);
}

// ---------- L'aile technique (carte « dispatching ») ----------

function aile(k) {
  const { c, W, m, usure } = k;
  const { x0, x1, z0, z1, h } = AILE;
  const beton = { couleur: COUL.beton, mat: m.beton, ep: EP, sup: W };
  const cloison = { couleur: 0xd6d2c4, mat: m.enduit, ep: EPI, sup: W, cut: CUTI };
  const fen = (u, extra = {}) => ({ u, l: 2.4, bas: 0.95, haut: 2.8, type: "fenetre", ...OPT_FEN(), bris: k.bris, ...extra });
  const jour = (u) => ({ u, l: 1.8, bas: 2.6, haut: 3.6, type: "fenetre", ...OPT_FEN(), bris: k.bris });
  // Façade sud : le bureau du directeur (deux fenêtres), la porte de service, les jours hauts de la salle des batteries
  murCoupe(k, [x0, z1], [x1, z1], { ...beton, h, ouvertures: [fen(2.5), fen(6.5), { u: 13, l: 1.6, bas: 0, haut: 2.4, type: "vide" }, jour(19), jour(23), jour(27)] });
  // Façade est : le rideau métallique à demi levé, les jours des archives
  murCoupe(k, [x1, z1], [x1, z0], { ...beton, h, ouvertures: [{ u: 6, l: 3.4, bas: 0, haut: 3.4, type: "vide" }, jour(15), jour(18.5)] });
  // Le rideau : lames d'acier ondulées, bloqué à 1,3 m du sol, un coin arraché
  for (let y = 1.3; y < 3.4; y += 0.14) c.pave(x1 + 0.12, y, -1.7, x1 + 0.2, y + 0.12, y < 1.6 ? 1.0 : 1.7, 0x7d8580, m.tole, { nuance: 0.03 });
  c.pave(x1 + 0.1, 3.4, -1.85, x1 + 0.5, 3.9, 1.85, 0x6a706c, m.tole);
  panneau(c, m.enseignes, R.batteries, { x: x1 + 0.22, y: 3.0, z: 0, ry: Math.PI / 2 }, 1.6, 0.48);
  // Façade nord (fond) : pleine, l'issue de secours des archives
  murCoupe(k, [x1, z0], [x0, z0], { ...beton, h, cut: 0, ouvertures: [{ u: 4, l: 1.2, bas: 0, haut: 2.2, type: "vide" }] });
  c.repere({ x: 38.6, z: z0 - 0.17, ry: Math.PI - 0.5 }, () => c.boite(1.15, 2.15, 0.05, 0x6f6a5c, { x: 0.58, y: 1.08 }, m.tole));
  // Façade ouest, au nord du hall
  murCoupe(k, [x0, z0], [x0, HALL.z0], { ...beton, h, cut: 0 });
  // Bandeau de béton et acrotère (couche)
  for (const [a, b] of [[[x0, z1], [x1, z1]], [[x1, z1], [x1, z0]]]) {
    const rm = repereMur(a, b);
    boiteMur(W, rm, -0.2, rm.L + 0.2, h - 0.2, h + 0.7, 0.1, 0.32, COUL.betonClair, m.beton);
  }
  // Les cloisons intérieures
  murCoupe(k, [28, z0], [28, z1], { ...cloison, h, ouvertures: [{ u: 7.8, l: 1.4, bas: 0, haut: 2.2, type: "vide" }, { u: 16.5, l: 1.6, bas: 0, haut: 2.2, type: "vide" }] });
  murCoupe(k, [28, -5], [x1, -5], { ...cloison, h, ouvertures: [{ u: 5, l: 1.4, bas: 0, haut: 2.2, type: "vide" }] });
  murCoupe(k, [x0, -1], [28, -1], { ...cloison, h, ouvertures: [{ u: 5.5, l: 5, bas: 1.0, haut: 2.4, type: "fenetre", ...OPT_FEN(), croisillons: 2, bris: k.bris }, { u: 13, l: 1.6, bas: 0, haut: 2.3, type: "vide" }] });
  murCoupe(k, [22, -1], [22, z1], { ...cloison, h, ouvertures: [{ u: 3.5, l: 1.0, bas: 0, haut: 2.2, type: "vide" }] });
  // Les plaques des portes
  panneau(c, m.enseignes, R.archives, { x: 27.88, y: 2.45, z: -6.2, ry: -Math.PI / 2 }, 1.3, 0.39);
  panneau(c, m.enseignes, R.batteries, { x: 27.88, y: 2.45, z: 2.5, ry: -Math.PI / 2 }, 1.3, 0.39);
  // Le toit (couche) : percé au-dessus du dispatching ; le faux plafond pend
  const trou = { x0: 21, x1: 25, z0: -11, z1: -8 };
  const dalle = (xa, za, xb, zb) => W.pave(xa, h, za, xb, h + 0.3, zb, COUL.betonSombre, m.beton, { crasse: false, nuance: 0.02 });
  dalle(x0, z0 - 0.15, x1 + 0.15, trou.z0);
  dalle(x0, trou.z1, x1 + 0.15, z1 + 0.15);
  dalle(x0, trou.z0, trou.x0, trou.z1);
  dalle(trou.x1, trou.z0, x1 + 0.15, trou.z1);
  W.pave(x0, h + 0.3, z0 - 0.15, x1 + 0.15, h + 0.75, z0 + 0.1, COUL.beton, m.beton);
  for (const [x, z] of [[17, -6], [33, 1], [36, -10]]) W.pave(x - 1.1, h + 0.3, z - 0.8, x + 1.1, h + 1.5, z + 0.8, COUL.tole, m.tole);
  for (const [x, z] of [[30, -3], [16, 2]]) W.pave(x - 0.8, h + 0.3, z - 0.8, x + 0.8, h + 0.7, z + 0.8, 0x9fb3b0, m.lisse);
  mousse(W, 27, h + 0.3, -3, 2.5, Math.round(4 + 6 * usure));
  touffes(W, [[14, 5, h + 0.3], [40, -13, h + 0.3], [26, -12, h + 0.3], [39, 4, h + 0.3]], PALETTE.herbeSeche);
  for (let i = 0; i < 6; i++) W.boite(0.6, 0.02, 0.6, 0xe6e2d8, { x: trou.x0 - 0.6 + k.c.hasard() * 5, y: h - 0.6 - k.c.hasard() * 0.8, z: trou.z0 - 0.5 + k.c.hasard() * 4, rx: k.c.entre(-0.8, 0.8), rz: k.c.entre(-0.8, 0.8) }, m.mat);
  raiDeLumiere(c, [23, h, -9.5], [22, 0.07, -8.6], 2.6);
}

/** Un pupitre de conduite : caisson, plan incliné à boutons, deux écrans cathodiques, clavier, téléphone. */
function pupitre(k, x, z, ry, l = 2.4, chef = false) {
  const { c, m } = k;
  c.repere({ x, z, ry }, () => {
    c.pave(-l / 2, 0, -0.45, l / 2, 0.74, 0.45, 0x8f8a7c, m.satin);
    c.pave(-l / 2 - 0.02, 0.74, -0.5, l / 2 + 0.02, 0.78, 0.5, 0x5a5650, m.satin);
    c.boite(l, 0.5, 0.06, 0x5a5650, { y: 0.98, z: -0.38, rx: -0.5 }, m.satin);
    for (let i = 0; i < 6; i++) c.boite(0.06, 0.03, 0.06, [0xc8362b, 0x4fc46a, 0xe0b040, 0xe6e2d8][i % 4], { x: -l / 2 + 0.25 + i * (l - 0.5) / 5, y: 1.0, z: -0.34, rx: -0.5 }, m.lisse);
    for (const dx of chef ? [-0.5, 0.5] : [-0.55, 0.55]) {
      const tombe = !chef && k.c.hasard() < 0.15 + 0.2 * k.usure;
      if (tombe) {
        c.boite(0.46, 0.42, 0.44, COUL.beige, { x: dx, y: 0.2, z: 0.9, rx: 1.5 }, m.satin);
        continue;
      }
      c.boite(0.46, 0.42, 0.44, COUL.beige, { x: dx, y: 1.0, z: -0.12, ry: -dx * 0.2 }, m.satin);
      c.boite(0.36, 0.3, 0.02, 0x1a1e1e, { x: dx, y: 1.02, z: 0.11, ry: -dx * 0.2 }, m.lisse);
    }
    c.boite(0.5, 0.03, 0.18, COUL.beige, { y: 0.8, z: 0.3 }, m.satin);
    c.boite(0.22, 0.08, 0.18, 0x2a2a2a, { x: l / 2 - 0.3, y: 0.82, z: 0.2 }, m.satin);
  });
  const P = (u, v) => [x + Math.cos(ry) * u + Math.sin(ry) * v, z - Math.sin(ry) * u + Math.cos(ry) * v];
  const [a, b] = [P(-l / 2, 0), P(l / 2, 0)];
  k.b.obstacle(a[0], a[1], b[0], b[1], "pupitre");
}

function dispatching(k) {
  const { c, m, usure } = k;
  // Le mur synoptique (mur nord) : cadre d'acier, la carte du réseau, le socle à tiroirs, l'horloge arrêtée
  const zs = AILE.z0 + EP / 2;
  c.pave(12.6, 0, zs, 27.4, 0.7, zs + 0.5, 0x4a4e4c, m.tole);
  c.pave(12.6, 0.7, zs, 27.4, 0.74, zs + 0.55, 0x3a3e3c, m.tole);
  for (let x = 13.4; x < 27; x += 1.6) c.pave(x, 0.12, zs + 0.5, x + 1.3, 0.6, zs + 0.52, 0x5a5e5c, m.tole);
  c.pave(12.7, 0.74, zs, 27.3, 4.85, zs + 0.05, 0x1f2624, m.mat);
  panneau(c, m.enseignes, R.synoptique, { x: 20, y: 2.75, z: zs + 0.08 }, 14, 4.0);
  for (const [xa, xb, ya, yb] of [[12.7, 27.3, 4.75, 4.9], [12.7, 27.3, 0.7, 0.78], [12.7, 12.85, 0.7, 4.9], [27.15, 27.3, 0.7, 4.9]]) c.pave(xa, ya, zs + 0.03, xb, yb, zs + 0.14, 0x2a2e2c, m.tole);
  panneau(c, m.enseignes, R.horloge, { x: 20, y: 4.55, z: zs + 0.15 }, 1.5, 0.4);
  // Un panneau de la carte s'est décroché et pend
  c.boite(1.1, 0.9, 0.05, 0x3a4642, { x: 14.3, y: 1.3, z: zs + 0.4, rx: 0.5, rz: 0.2 }, m.mat);
  // Les pupitres en arc, tournés vers le mur (le centre de l'arc est au pied du mur) ; le pupitre du chef derrière
  const C = { x: 20, z: AILE.z0 };
  const Rarc = 6.6;
  for (const deg of [-50, -25, 0, 25, 50]) {
    const phi = (deg * Math.PI) / 180;
    const px = C.x + Math.sin(phi) * Rarc;
    const pz = C.z + Math.cos(phi) * Rarc;
    pupitre(k, px, pz, phi);
    const renverse = deg === -25 || deg === 50;
    chaiseBureau(c, k, px + Math.sin(phi) * 1.0 + (renverse ? 0.4 : 0), pz + Math.cos(phi) * 1.0, phi + Math.PI + (renverse ? 0.8 : 0.2), renverse);
  }
  pupitre(k, 20, -4.4, 0, 3.0, true);
  chaiseBureau(c, k, 20.3, -3.3, Math.PI + 0.3, false);
  chaiseBureau(c, k, 15.8, -2.6, 2.2, true);
  // Le faux plancher soulevé : des dalles levées, les câbles dessous
  for (const [x, z, rx, rz] of [[14.2, -4.5, 0.4, 0.1], [25.6, -10.4, -0.2, 0.5], [17.4, -1.8, 0.1, -0.3]]) {
    c.pave(x - 0.3, 0.06, z - 0.3, x + 0.3, 0.065, z + 0.3, 0x141414, m.mat, { crasse: false });
    for (let i = 0; i < 3; i++) c.tube([x - 0.28, 0.07, z - 0.15 + i * 0.15], [x + 0.28, 0.07, z - 0.1 + i * 0.12], 0.025, [0xc8362b, 0x3f6f73, 0xe0b040][i], m.satin, 4);
    c.boite(0.6, 0.04, 0.6, 0xd2d0c8, { x: x + 0.45, y: 0.25, z: z + 0.1, rx, rz }, m.satin);
  }
  // Une imprimante à listings, son papier en accordéon déroulé sur le sol
  c.pave(26, 0, -2.6, 27.2, 0.75, -1.7, COUL.beige, m.satin);
  for (let i = 0; i < 7; i++) c.boite(0.4, 0.01, 0.3, COUL.papier, { x: 25.6 - i * 0.28, y: 0.07 + (i % 2) * 0.02, z: -2.0 + i * 0.12, ry: 0.4, rz: (i % 2 ? 0.1 : -0.1) }, m.mat, { crasse: false });
  // Le tableau des consignes, les classeurs, les gobelets
  c.pave(12.2, 0, -12.6, 12.7, 1.9, -9.8, 0x8f8a7c, m.satin);
  for (let i = 0; i < 6; i++) c.boite(0.3, 0.32, 0.06, [0xc8362b, 0x2f6f73, 0xe0b040][i % 3], { x: 12.55, y: 1.35, z: -12.3 + i * 0.12, ry: Math.PI / 2 }, m.satin);
  jonchee(c, 13, -13, 27.5, -1.5, Math.round(40 + 60 * usure), [COUL.papier, 0xd6d0be, 0xf0ece0]);
  debris(c, 20.5, -11.5, 25.5, -7.5, Math.round(10 + 20 * usure));
  gravats(c, 23, -9.5, 1.0, Math.round(4 + 6 * usure), [COUL.betonSombre, 0xe6e2d8, COUL.beton]);
  flaque(k, c, 22.4, -8.8, 1.2);
  if (usure > 0.4) arbuste(c, 23.4, -9.6, 0.8 + usure * 0.5);
}

function archives(k) {
  const { c, m, usure } = k;
  // Les rails au sol
  for (const z of [-12.6, -10.5, -8.4]) c.pave(28.3, 0.06, z - 0.04, 41.7, 0.09, z + 0.04, 0x6a6a68, m.metal);
  // Les rayonnages roulants, serrés, une allée ouverte ; leurs volants face au sud
  const xs = [29.0, 29.95, 30.9, 33.0, 33.95, 34.9, 35.85, 38.1, 39.05, 40.0, 40.95];
  const tons = [COUL.carton, 0xa48a62, 0xc4ab7e, 0xe6e1d2];
  xs.forEach((x, i) => {
    const z1 = -13.4;
    const z2 = -7.6;
    const ry = i === 5 ? 0.06 : 0;
    c.repere({ x, z: (z1 + z2) / 2, ry }, () => {
      const L = z2 - z1;
      c.pave(-0.44, 0.06, -L / 2, 0.44, 0.2, L / 2, 0x6f7a78, m.tole);
      c.pave(-0.44, 0.06, L / 2 - 0.04, 0.44, 2.35, L / 2, 0x3f6f73, m.tole);
      c.pave(-0.44, 0.06, -L / 2, 0.44, 2.35, -L / 2 + 0.04, 0x8f9896, m.tole);
      c.pave(-0.02, 0.2, -L / 2, 0.02, 2.3, L / 2, 0x9aa2a0, m.tole);
      for (const y of [0.75, 1.3, 1.85, 2.35]) c.pave(-0.42, y - 0.02, -L / 2, 0.42, y, L / 2, 0x9aa2a0, m.tole);
      // Le volant (trois branches)
      c.poser(geoCylindre(0.26, 0.04, 10), m.metal, 0x8d8f8a, { y: 1.1, z: L / 2 + 0.08, rx: Math.PI / 2 });
      c.boite(0.04, 0.04, 0.14, 0x1a1a1a, { x: 0.2, y: 1.2, z: L / 2 + 0.14 }, m.satin);
      // Les cartons, de chaque côté (les étagères visibles d'en haut)
      for (const y of [0.2, 0.75, 1.3, 1.85]) {
        for (let zz = -L / 2 + 0.25; zz < L / 2 - 0.3; zz += 0.5) {
          if (k.c.hasard() < 0.18 + 0.2 * usure) continue;
          c.boite(0.38, 0.32, 0.42, tons[Math.floor(k.c.hasard() * 4)], { x: (k.c.hasard() < 0.5 ? -0.21 : 0.21), y: y + 0.17, z: zz }, m.mat, { nuance: 0.06 });
        }
      }
    });
    k.b.obstacle(x, -13.4, x, -7.6, "rayonnage");
  });
  // Les cartons tombés, éventrés ; les papiers partout
  for (let i = 0; i < 9; i++) c.boite(0.38, 0.32, 0.42, tons[i % 4], { x: k.c.entre(31.6, 32.4), y: 0.22, z: k.c.entre(-13, -8), ry: k.c.hasard() * 3, rx: k.c.entre(-0.4, 0.4) }, m.mat, { nuance: 0.08 });
  for (let i = 0; i < 6; i++) c.boite(0.38, 0.32, 0.42, tons[i % 4], { x: k.c.entre(36.6, 37.4), y: 0.22, z: k.c.entre(-13, -9), ry: k.c.hasard() * 3, rz: k.c.entre(-0.4, 0.4) }, m.mat, { nuance: 0.08 });
  jonchee(c, 28.5, -13.5, 41.5, -5.5, Math.round(50 + 70 * usure), [COUL.papier, 0xd6d0be, 0xf0ece0, 0xc8d4e6]);
  // Les meubles à plans, tiroirs ouverts, et les rouleaux de plans
  for (const x of [29.6, 31.0]) {
    c.pave(x - 0.65, 0, -5.85, x + 0.65, 0.95, -5.2, 0x5a6a68, m.tole);
    for (let j = 0; j < 4; j++) {
      const sort = k.c.hasard() < 0.5 ? 0.4 : 0;
      c.pave(x - 0.6, 0.12 + j * 0.2, -5.2, x + 0.6, 0.26 + j * 0.2, -5.15 + sort, 0x6a7a78, m.tole);
      if (sort) c.pave(x - 0.55, 0.26 + j * 0.2, -5.15, x + 0.55, 0.27 + j * 0.2, -4.85, 0xe6e1d2, m.mat, { crasse: false });
    }
  }
  c.poser(geoCylindre(0.3, 0.8, 8), m.tole, 0x5a6a68, { x: 32.6, y: 0.4, z: -5.6 });
  for (let i = 0; i < 6; i++) c.tube([32.5 + (i % 3) * 0.12, 0.3, -5.7 + Math.floor(i / 3) * 0.15], [32.4 + (i % 3) * 0.2, 1.25, -5.6 + Math.floor(i / 3) * 0.2], 0.04, i % 2 ? 0xe6f0ff : 0xd8d0b8, m.mat, 5);
  for (let i = 0; i < 4; i++) c.tube([34 + i * 0.5, 0.1, -6.6 + i * 0.2], [34.6 + i * 0.5, 0.1, -5.6 + i * 0.1], 0.05, 0xe6f0ff, m.mat, 5);
  k.b.obstacle(28.9, -5.85, 32.9, -5.85, "meuble à plans");
  // La table à dessin et le plan du réseau déroulé
  c.repere({ x: 39.6, z: -6.4 }, () => {
    for (const dx of [-0.7, 0.7]) c.boite(0.06, 0.9, 0.06, 0x3a3a3a, { x: dx, y: 0.45 }, m.tole);
    c.boite(1.7, 0.04, 1.1, 0xd8d0b8, { y: 0.95, rx: -0.3 }, m.satin);
    panneau(c, m.enseignes, R.plan, { y: 0.98, z: 0.01, rx: -Math.PI / 2 - 0.3 }, 1.5, 1.0);
  });
  k.b.obstacle(38.8, -6.4, 40.4, -6.4, "table à dessin");
}

/** Une armoire de batteries de secours : bâti d'acier, deux étages d'éléments, bornes rouges et noires. */
function armoireBatteries(k, x, z, l, videe) {
  const { c, m } = k;
  c.pave(x - l / 2, 0.06, z - 0.4, x + l / 2, 0.12, z + 0.4, 0x4a4e4c, m.tole);
  for (const dx of [-l / 2, l / 2]) c.pave(x + dx - 0.04, 0.06, z - 0.4, x + dx + 0.04, 1.75, z + 0.4, 0x4a4e4c, m.tole);
  for (const y of [0.85, 1.75]) c.pave(x - l / 2, y - 0.04, z - 0.4, x + l / 2, y, z + 0.4, 0x4a4e4c, m.tole);
  for (const [y0, plein] of [[0.12, !videe], [0.85, !videe || k.c.hasard() < 0.3]]) {
    if (!plein) continue;
    c.pave(x - l / 2 + 0.06, y0, z - 0.32, x + l / 2 - 0.06, y0 + 0.5, z + 0.32, 0x3a3c3e, m.satin);
    for (let i = 0; i < 4; i++) {
      const bx = x - l / 2 + 0.3 + (i * (l - 0.6)) / 3;
      c.boite(0.07, 0.06, 0.07, i % 2 ? 0xc8362b : 0x1a1a1a, { x: bx, y: y0 + 0.53, z: z - 0.12 }, m.satin);
      c.boite(0.07, 0.06, 0.07, i % 2 ? 0x1a1a1a : 0xc8362b, { x: bx, y: y0 + 0.53, z: z + 0.12 }, m.satin);
    }
    c.boite(l - 0.4, 0.02, 0.05, COUL.laiton, { x, y: y0 + 0.52, z }, m.metal);
  }
  if (videe) main3D(k, x, z);
  k.b.obstacle(x - l / 2, z, x + l / 2, z, "armoire de batteries");
}

/** Une marque à la craie des Voltaïques sur une armoire vidée (une petite plaque blanche). */
function main3D(k, x, z) {
  k.c.boite(0.5, 0.18, 0.01, 0xe6e2d8, { x, y: 1.3, z: z + 0.41, rz: 0.1 }, k.m.mat, { crasse: false });
}

function batteries(k) {
  const { c, m, usure } = k;
  // Deux rangées d'armoires ; certaines vidées par les Voltaïques
  for (const [x, vide] of [[30.3, false], [32.5, true], [34.7, false], [36.9, true]]) armoireBatteries(k, x, -2.6, 2.0, vide);
  for (const [x, vide] of [[30.3, false], [32.5, false], [34.7, true]]) armoireBatteries(k, x, 1.2, 2.0, vide);
  // Les onduleurs, contre la cloison des archives
  for (const x of [35.6, 37.6, 39.6]) {
    c.pave(x - 0.95, 0.06, -4.85, x + 0.95, 2.1, -4.1, 0x6a706c, m.tole);
    c.pave(x - 0.5, 1.4, -4.1, x - 0.1, 1.65, -4.08, 0x1a2226, m.lisse);
    for (let i = 0; i < 3; i++) c.pave(x + 0.1 + i * 0.22, 0.2, -4.1, x + 0.26 + i * 0.22, 1.2, -4.08, 0x4a4e4c, m.tole);
  }
  k.b.obstacle(34.6, -4.1, 40.6, -4.1, "onduleurs");
  // Les chemins de câbles au plafond
  for (const z of [-2.6, 1.2]) c.pave(29, 3.0, z - 0.2, 41.5, 3.06, z + 0.2, 0x8d8f8a, m.metal);
  for (const z of [-2.6, 1.2]) for (let x = 30; x < 41; x += 2.4) c.tube([x, 3.0, z], [x, 1.78, z], 0.03, 0x1a1a1a, m.satin, 3);
  // L'établi des Voltaïques, la lampe, le chariot à batteries, les câbles
  c.pave(39.6, 0, 3.0, 41.7, 0.9, 3.8, PALETTE.boisGris, m.mat);
  c.pave(39.6, 0.9, 3.0, 41.7, 0.95, 3.8, 0x8a7a60, m.mat);
  c.boite(0.35, 0.2, 0.25, 0xe0b040, { x: 40.2, y: 1.05, z: 3.4, ry: 0.3 }, m.satin);
  c.boite(0.5, 0.06, 0.15, 0xc8362b, { x: 41.0, y: 0.98, z: 3.3, ry: -0.4 }, m.satin);
  c.poser(geoCylindre(0.22, 0.2, 10), m.mat, 0xc0582c, { x: 41.2, y: 1.05, z: 3.6, rz: Math.PI / 2 });
  k.b.obstacle(39.6, 3.4, 41.7, 3.4, "établi");
  lampeVoltaique(k, c, 39.8, 1.6);
  c.repere({ x: 38.4, z: 0.4, ry: 0.5 }, () => {
    c.pave(-0.6, 0.25, -0.4, 0.6, 0.3, 0.4, 0x5a5e5c, m.tole);
    for (const [dx, dz] of [[-0.3, -0.18], [0.3, -0.18], [-0.3, 0.18], [0.3, 0.18]]) c.boite(0.45, 0.3, 0.3, 0x2a2c2e, { x: dx, y: 0.45, z: dz }, m.satin);
    c.tube([0.6, 0.3, 0], [1.1, 1.0, 0], 0.025, 0x3a3a3a, m.metal, 4);
    for (const dz of [-0.4, 0.4]) c.poser(geoCylindre(0.14, 0.06, 8), m.satin, 0x1a1a1a, { x: 0.4, y: 0.14, z: dz, rx: Math.PI / 2 });
  });
  for (let i = 0; i < 3; i++) c.tube([38 - i * 1.2, 0.08, 2.4 + i * 0.3], [36.6 - i * 1.2, 0.08, 3.4 - i * 0.2], 0.03, 0x1a1a1a, m.satin, 4);
  panneau(c, m.enseignes, R.graffiti, { x: AILE.x1 - EP / 2 - 0.02, y: 2.3, z: 4.2, ry: -Math.PI / 2 }, 2.4, 1.2);
  panneau(c, m.enseignes, R.batteries, { x: 31, y: 2.4, z: AILE.z1 - EP / 2 - 0.02, ry: Math.PI }, 1.3, 0.39);
  // L'acide renversé (flaques sombres), les débris
  flaque(k, c, 33.6, -0.6, 0.9);
  flaque(k, c, 31.2, 3.6, 0.6);
  debris(c, 29, -4, 41.5, 5.5, Math.round(10 + 20 * usure));
  jonchee(c, 29, -4, 41.5, 5.5, Math.round(10 + 14 * usure), [COUL.papier, 0x8a8274]);
}

function couloir(k) {
  const { c, m, usure } = k;
  // La pointeuse et ses fiches, le tableau des notes de service, les patères
  c.pave(27.6, 1.0, 3.2, 27.82, 1.6, 3.8, COUL.beige, m.satin);
  for (let i = 0; i < 8; i++) c.boite(0.04, 0.22, 0.08, 0xe6e1d2, { x: 27.75, y: 1.75, z: 4.0 + i * 0.12 }, m.mat, { crasse: false });
  panneau(c, m.enseignes, R.notes, { x: 22 + EPI / 2 + 0.02, y: 1.7, z: 0.6, ry: Math.PI / 2 }, 1.4, 0.93);
  for (let i = 0; i < 4; i++) c.boite(0.04, 0.04, 0.2, COUL.inox, { x: 22.2, y: 1.8, z: 4.4 + i * 0.35 }, m.metal);
  c.boite(0.5, 1.1, 0.08, 0x3a4a5a, { x: 22.25, y: 1.2, z: 4.75, rz: 0.04 }, m.mat);
  // L'issue de secours : néon vert au-dessus de la porte
  c.boite(0.9, 0.3, 0.12, 0xdedad0, { x: 25, y: 2.75, z: AILE.z1 - 0.22 }, m.satin);
  panneau(c, m.neon, R.issue, { x: 25, y: 2.75, z: AILE.z1 - 0.29, ry: Math.PI }, 0.8, 0.3);
  // La porte de service, ouverte ; un extincteur couché
  c.repere({ x: 24.2, z: AILE.z1 - 0.17, ry: -1.3 }, () => c.boite(1.5, 2.35, 0.05, 0x6f6a5c, { x: 0.75, y: 1.18 }, m.tole));
  c.boite(0.18, 0.55, 0.18, 0xc8362b, { x: 26.8, y: 0.12, z: 0.4, rx: Math.PI / 2, ry: 0.5 }, m.satin);
  jonchee(c, 22.3, -0.7, 27.7, 5.7, Math.round(10 + 16 * usure), [COUL.papier, 0xd6d0be]);
}

function directeur(k) {
  const { c, m, usure } = k;
  // Le grand bureau de bois face au dispatching, le fauteuil de cuir, les chaises des visiteurs
  c.pave(15.8, 0, 1.75, 18.4, 0.76, 2.85, COUL.bois, m.satin);
  c.pave(15.7, 0.76, 1.65, 18.5, 0.8, 2.95, 0x5a3a26, m.satin);
  c.boite(0.5, 0.02, 0.4, 0x2a5a3a, { x: 17.1, y: 0.82, z: 2.3 }, m.mat);
  c.boite(0.2, 0.3, 0.2, 0x6a4a2a, { x: 16.2, y: 0.95, z: 2.1 }, m.lisse);
  c.boite(0.25, 0.08, 0.2, 0x2a2a2a, { x: 18.1, y: 0.85, z: 2.6 }, m.satin);
  k.b.obstacle(15.7, 2.3, 18.5, 2.3, "bureau");
  c.repere({ x: 17.1, z: 3.5, ry: Math.PI + 0.2 }, () => {
    c.pave(-0.4, 0, -0.38, 0.4, 0.5, 0.38, COUL.cuir, m.satin);
    c.pave(-0.4, 0.5, 0.25, 0.4, 1.35, 0.4, COUL.cuir, m.satin);
    for (const dx of [-0.42, 0.42]) c.pave(dx - 0.06, 0.4, -0.35, dx + 0.06, 0.72, 0.3, COUL.cuir, m.satin);
  });
  for (const [x, ry, r] of [[16.3, 0.2, false], [17.9, -0.3, true]]) {
    c.repere({ x, z: 0.9, ry, rz: r ? 1.4 : 0, y: r ? 0.25 : 0 }, () => {
      c.pave(-0.25, 0.42, -0.25, 0.25, 0.48, 0.25, COUL.cuir, m.satin);
      c.pave(-0.25, 0.48, -0.27, 0.25, 0.95, -0.21, COUL.cuir, m.satin);
      for (const [dx, dz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) c.boite(0.03, 0.42, 0.03, COUL.inox, { x: dx, y: 0.21, z: dz }, m.metal);
    });
  }
  // La maquette de la centrale, sous sa cloche de verre
  c.pave(13.3, 0, 3.8, 15.3, 0.8, 5.2, COUL.bois, m.satin);
  c.pave(13.4, 0.8, 3.9, 15.2, 0.84, 5.1, 0x7a9a5a, m.mat);
  c.pave(13.6, 0.84, 4.2, 14.5, 1.1, 4.7, 0x9a5640, m.mat);
  for (const [x, z] of [[14.8, 4.3], [14.8, 4.8]]) c.poser(geoCylindre(0.2, 0.42, 10, 0.13), m.mat, 0xc9c3b4, { x, y: 1.05, z });
  c.tube([13.8, 0.84, 4.9], [13.8, 1.5, 4.9], 0.04, 0xb0473b, m.mat, 6);
  for (const x of [13.7, 14.2, 14.7]) c.tube([x, 0.84, 5.0], [x, 1.1, 5.0], 0.01, 0x5a5a56, m.metal, 3);
  if (k.c.hasard() > k.bris * 0.8) c.pave(13.35, 0.84, 3.85, 15.25, 1.7, 5.15, 0xb8c8c4, m.verre);
  else debris(c, 13, 3.4, 15.6, 5.6, 14, [0x9fb3b0, 0xc9d6d2]);
  k.b.obstacle(13.3, 3.8, 15.3, 3.8, "maquette");
  // Le portrait du directeur général (mur ouest)
  panneau(c, m.enseignes, R.portrait, { x: AILE.x0 + EP / 2 + 0.03, y: 1.9, z: 2.4, ry: Math.PI / 2 }, 0.95, 1.07);
  // La crédence et les trophées « Meilleur taux d'abonnement »
  c.pave(21.4, 0, 0.0, 21.9, 0.9, 3.4, COUL.bois, m.satin);
  for (const z of [0.4, 1.2, 2.0, 2.8]) {
    c.poser(geoCylindre(0.07, 0.05, 8), m.metal, COUL.laiton, { x: 21.65, y: 0.93, z });
    c.poser(geoCylindre(0.03, 0.18, 6), m.metal, COUL.laiton, { x: 21.65, y: 1.05, z });
    c.poser(geoCylindre(0.06, 0.2, 10, 0.12), m.metal, COUL.laiton, { x: 21.65, y: 1.24, z });
  }
  panneau(c, m.enseignes, R.trophee, { x: 21.38, y: 0.5, z: 1.7, ry: -Math.PI / 2 }, 1.1, 0.41);
  k.b.obstacle(21.4, 0, 21.4, 3.4, "crédence");
  // Le coffre-fort, à côté de la crédence ; le chariot à liqueurs
  c.pave(21.0, 0, 4.2, 21.85, 0.9, 5.0, 0x3a3e3c, m.tole);
  c.poser(geoCylindre(0.12, 0.04, 8), m.metal, 0xb9bcb8, { x: 20.98, y: 0.55, z: 4.6, rz: Math.PI / 2 });
  c.pave(19.5, 0.6, 4.9, 20.4, 0.64, 5.4, COUL.laiton, m.metal);
  c.boite(0.08, 0.28, 0.08, 0x6a3a1a, { x: 19.8, y: 0.78, z: 5.1 }, m.lisse);
  // Le ficus, devenu arbuste géant, dans le coin nord-ouest
  c.poser(geoCylindre(0.45, 0.6, 10), m.lisse, 0x2a2a2a, { x: 12.9, y: 0.3, z: -0.3 });
  arbuste(c, 12.9, -0.3, 1.8 + usure * 0.8, 0.6);
  // Les papiers, la moquette tachée
  jonchee(c, 12.5, -0.6, 21.5, 5.6, Math.round(14 + 20 * usure), [COUL.papier, 0xd6d0be]);
  flaque(k, c, 19.6, 1.0, 0.7, 0.08);
}

function abordsAile(k) {
  const { c, m, usure } = k;
  // Le parvis devant l'aile : bacs, une deuxième camionnette, la végétation
  bac(k, 30, 10.5, "arbre");
  bac(k, 4, 11.5, "arbuste");
  camionnette(k, 37.5, 9.4, -0.25);
  semerTouffes(c, -13, 6.4, 45, 13.8, Math.round(50 + 90 * usure), PALETTE.herbeSeche);
  semerTouffes(c, 42.4, -19, 45.6, 6, Math.round(20 + 30 * usure), PALETTE.herbeSeche);
  debris(c, -11, 6.3, 11, 9.5, Math.round(26 + 30 * usure), [0x9fb3b0, 0x7d9290, 0xc9d6d2]);
  for (const [x, z, s] of [[44, -10, 1.2], [44.5, 9, 1.0], [-12.8, 9, 0.9]]) arbuste(c, x, z, s * (0.6 + usure));
  lierre(c, AILE.x1 + 0.18, 0, -9, Math.PI / 2, 6, 4.5, Math.round(50 + 70 * usure));
  jonchee(c, 12, 6.5, 45, 13.5, Math.round(16 + 20 * usure));
  lampadaire(k, 19, 12.6);
  // Le touret de câble des Voltaïques, devant le rideau
  c.repere({ x: 44.2, z: 2.6, ry: 0.3 }, () => {
    for (const dz of [-0.45, 0.45]) c.poser(geoCylindre(0.9, 0.08, 14), m.mat, PALETTE.boisGris, { y: 0.9, z: dz, rx: Math.PI / 2 });
    c.poser(geoCylindre(0.55, 0.82, 12), m.satin, 0x1e1e1e, { y: 0.9, rx: Math.PI / 2 });
  });
  k.b.obstacle(43.4, 2.6, 45, 2.6, "touret");
}

/** Derrière le siège : la cour de service (les deux cartes, ce qui tombe dans le lot). */
function arriere(k) {
  const { c, m, usure } = k;
  // Une benne, des palettes, le poste de livraison
  if (dansLot(k, 0, -12)) {
    c.pave(-2.5, 0, -12.8, 0.8, 1.4, -11.0, 0x3f6f4a, m.tole);
    c.pave(-2.6, 1.4, -12.9, 0.9, 1.5, -10.9, 0x2f5f3a, m.tole);
    k.b.obstacle(-2.5, -11, 0.8, -11, "benne");
    for (let i = 0; i < 3; i++) c.pave(3 + i * 0.1, i * 0.15, -12.6, 4.2 + i * 0.1, i * 0.15 + 0.13, -11.4, PALETTE.boisGris, m.mat);
  }
  semerTouffes(c, -13, -13.8, 12, -9.4, Math.round(30 + 50 * usure), PALETTE.herbeSeche);
  if (k.disp) {
    semerTouffes(c, 12, -19.8, 45, -14.4, Math.round(30 + 50 * usure), PALETTE.herbeSeche);
    // Le transformateur de l'aile, derrière sa grille
    c.pave(24, 0, -18.5, 27, 2.2, -16.2, 0x6a706c, m.tole);
    for (let x = 23.6; x < 27.6; x += 0.5) c.tube([x, 0, -15.6], [x, 2.2, -15.6], 0.025, 0x4a4e4c, m.metal, 4);
    k.b.obstacle(23.4, -15.6, 27.6, -15.6, "grille");
    arbre(c, 33, -17.5, 6 + usure * 2, "bouleau");
    arbre(c, 4, -17, 5 + usure * 2, "bouleau");
  } else {
    arbre(c, -20, -12, 6 + usure * 2, "bouleau");
    lierre(c, CAFET.x0 + 4, 0, CAFET.z0 - 0.18, Math.PI, 5, 3.5, Math.round(40 + 50 * usure));
  }
}

// ---------- Les voyants du mur synoptique ----------

/**
 * Les voyants qui clignotent encore sur batterie : un seul maillage (un seul appel de dessin), chaque voyant a sa
 * couleur et son rythme (couleur par sommet, mise à jour à chaque image).
 */
function voyants() {
  const rng = aleatoire(9);
  const zs = AILE.z0 + EP / 2 + 0.1;
  const liste = [];
  const enX = (u) => 20 - 7 + ((ZONE_SYN.x + u * ZONE_SYN.l) / R.synoptique[2]) * 14;
  const enY = (v) => 2.75 + 2 - ((ZONE_SYN.y + v * ZONE_SYN.h) / R.synoptique[3]) * 4;
  POSTES.forEach((p, i) => {
    const couleur = p.debout ? [0.35, 1, 0.45] : i % 3 === 0 ? [1, 0.7, 0.2] : [1, 0.22, 0.12];
    liste.push({ x: enX(p.u) + 0.17, y: enY(p.v) + 0.12, couleur, periode: p.debout ? 0 : 0.6 + rng() * 1.6, phase: rng() * 6, eteint: !p.debout && rng() < 0.35 });
  });
  // Quelques voyants le long des lignes
  for (let i = 0; i < 10; i++) {
    const [a, b] = LIGNES[Math.floor(rng() * LIGNES.length)];
    const p = POSTES[a];
    const q = POSTES[b];
    liste.push({ x: enX((p.u + q.u) / 2), y: enY(p.v) - 0.1, couleur: rng() < 0.5 ? [1, 0.22, 0.12] : [1, 0.7, 0.2], periode: rng() < 0.5 ? 0 : 0.3 + rng(), phase: rng() * 6, eteint: rng() < 0.4 });
  }
  const s = 0.055;
  const pos = [];
  for (const v of liste) {
    const { x, y } = v;
    pos.push(x - s, y - s, zs, x + s, y - s, zs, x + s, y + s, zs, x - s, y - s, zs, x + s, y + s, zs, x - s, y + s, zs);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  const couleurs = new Float32Array(pos.length);
  g.setAttribute("color", new THREE.BufferAttribute(couleurs, 3));
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  mat.userData.sansOmbre = true;
  const maillage = new THREE.Mesh(g, mat);
  maillage.castShadow = false;
  maillage.name = "voyants";
  const maj = (t) => {
    liste.forEach((v, i) => {
      let f = 1;
      if (v.eteint) f = 0.12;
      else if (v.periode > 0) f = Math.sin(t * (Math.PI * 2) / v.periode + v.phase) > 0.2 ? 1 : 0.15;
      for (let j = 0; j < 6; j++) {
        couleurs[(i * 6 + j) * 3] = v.couleur[0] * f;
        couleurs[(i * 6 + j) * 3 + 1] = v.couleur[1] * f;
        couleurs[(i * 6 + j) * 3 + 2] = v.couleur[2] * f;
      }
    });
    g.attributes.color.needsUpdate = true;
  };
  maj(0);
  maillage.userData.animer = (t) => maj(t);
  return maillage;
}
