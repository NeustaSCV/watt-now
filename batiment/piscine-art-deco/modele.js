// La piscine municipale Art déco et ses bains-douches (nouveau lieu, Ville, anneau moyen, danger ●●●).
//
// Une piscine couverte des années 1930 : façade de brique et de béton crème, pilastres à redents, fronton à gradins où
// les lettres « PISCINE · BAINS-DOUCHES » tiennent encore, horloge arrêtée, bas-reliefs de nageuses. Derrière le hall
// carrelé et sa caisse, la grande nef : un bassin de 25 × 12 m vidé, de 1 m à 3,50 m, sous une verrière en berceau dont
// un pan est tombé dans le grand bain. Un arbre y pousse, une flaque verte croupit au fond, et le drone qui remplaçait
// le maître-nageur gît sur le flanc : la piscine était devenue « AquaSmart — Nagez sans vous mouiller ».
//
// Une seule carte (60 × 45 m), sol fourni par le bâtiment (`solPropre`) : le bassin est creusé sous y = 0.
//
// Repère : origine au centre du lot, +x à l'est, +z au sud (la rue est au sud).
// - nef du bassin : x -17 → 17, z -15 → 8,5 ; bassin x -12,5 → 12,5, z -9 → 3 (grand bain à l'ouest) ;
// - hall : x -6 → 6, z 8,5 → 15 ; bains-douches à l'ouest (x -17 → -6), infirmerie et local du chlore à l'est ;
// - salle des machines à l'ouest de la nef (x -28 → -17, z -15 → 3), cheminée au nord ;
// - solarium à l'est (x 17 → 29, z -15 → 8).
// Les façades vues de la caméra (sud et est) sont coupées à hauteur d'allège : le haut des murs, les toits, la verrière
// et le niveau haut des cabines forment des couches qui s'effacent.

import * as THREE from "three";
import {
  Batiment, PALETTE, MAT, matiere, matiereMonde, matiereTexture, matiereVerre, matiereEau, mur, lierre as lierreA, touffes,
  semerTouffes as semerA, gravats, debris as debrisA, jonchee as joncheeA, mousse, arbuste, arbre, raiDeLumiere as raiA,
  dessiner, taches, aleatoire,
} from "../commun/atelier.js";

// La végétation et le petit désordre coûtent cher en triangles : on les dose.
const lierre = (c, x, y0, z, ry, l, h, n) => lierreA(c, x, y0, z, ry, l, h, Math.round(n * 0.4));
const semerTouffes = (c, x1, z1, x2, z2, n, t, y) => semerA(c, x1, z1, x2, z2, Math.round(n * 0.35), t, y);
const debris = (c, x1, z1, x2, z2, n, t, y) => debrisA(c, x1, z1, x2, z2, Math.round(n * 0.35), t, y);
const jonchee = (c, x1, z1, x2, z2, n, t, y) => joncheeA(c, x1, z1, x2, z2, Math.round(n * 0.45), t, y);
// Un seul matériau de lueur pour tous les rais (l'opacité fait la clé du cache)
const rai = (c, a, b, l) => raiA(c, a, b, l, 0.09);

// ---------- La fiche ----------

export const FICHE = {
  id: "piscine-art-deco",
  nom: "La piscine Art déco",
  lieu: "Piscine municipale et bains-douches · Ville · moyen",
  environnement: "ville",
  anneau: "moyen",
  danger: 3,
  recit:
    "Pendant soixante ans, on y a appris à nager et à se laver pour quelques centimes. Puis la piscine est devenue « AquaSmart » : des vagues projetées sur le fond, un bracelet connecté au poignet, un drone à la place du maître-nageur, et plus une goutte d'eau, par souci d'économie. Aujourd'hui, la pluie remplit lentement le grand bain par la verrière crevée, et le drone y veille toujours, sur le flanc.",
  inspiration:
    "la piscine Molitor avant sa rénovation (cabines en coursive, graffitis), la piscine de la Butte-aux-Cailles, les bains municipaux Art déco de Roubaix avant le musée, les piscines abandonnées d'Europe de l'Est ; photos d'urbex : bassin vide aux carrelages fissurés, plongeoir de béton, verrière, mosaïques",
  reperes: [
    "La façade Art déco : brique et béton crème, pilastres à redents, fronton à gradins « PISCINE · BAINS-DOUCHES », horloge arrêtée, bas-reliefs de nageuses, la marquise et l'enseigne AquaSmart posée dessus",
    "Le hall carrelé : la caisse vitrée, les tourniquets (l'un a perdu ses bras : on passe), les casiers à vêtements béants, la borne « Bracelet non détecté » qui luit encore, la mosaïque du poisson au sol",
    "La nef sous la verrière en berceau : vitres manquantes, rais de lumière, un pan de verrière tombé dans le bassin",
    "Le bassin vide de 25 × 12 m : carrelage fissuré, lignes noires, frise de vagues, échelles, escalier du petit bain, la flaque verte du grand bain, les feuilles mortes, l'arbre qui pousse au fond, le drone maître-nageur sur le flanc",
    "Le grand plongeoir de béton à trois plateformes (3 m, 5,3 m, 8 m), son médaillon de mosaïque et la plaque « Plongeon : option premium »",
    "Les cabines sur deux niveaux : portes jaunes ouvertes au rez-de-chaussée (numérotées), coursive et cabines bleues à l'étage (inaccessibles)",
    "Les bains-douches : rangées de cabines de douche carrelées, le guichet aux serviettes, l'enseigne en mosaïque « BAINS-DOUCHES »",
    "La salle des machines : chaudière rallumée par des survivants, filtres à sable, pompes, tuyauteries de cuivre ; la haute cheminée de brique",
    "L'infirmerie du maître-nageur (bouée, perche, trousse), le local du chlore, le solarium et ses transats renversés",
  ],
  lot: { l: 60, p: 45 },
  solPropre: true, // le bassin est creusé sous y = 0 : le lot fournit tout son sol
  depart: { x: 2, z: 19.5 },
  entrees: [
    { x: 0, z: 15.2, nature: "les portes du hall, sous la marquise (un vantail ouvert, un tombé)" },
    { x: -9, z: 15.2, nature: "l'entrée des bains-douches" },
    { x: -22, z: 3.2, nature: "la porte de la salle des machines, dans la cour de l'ouest" },
    { x: 17.2, z: 12, nature: "la porte de service de l'infirmerie, à l'est" },
    { x: 23.2, z: 8.1, nature: "la grille du solarium (de là, les baies de la nef)" },
  ],
  fouille: [
    { x: -11, z: -9.7, quoi: "échelle du grand bain : eau de pluie accumulée au fond (à purifier), seau et corde pour la remonter" },
    { x: -6.6, z: 3.6, quoi: "depuis la margelle, avec la perche de l'infirmerie : repêcher le drone maître-nageur (batterie, moteurs)" },
    { x: 8.6, z: 10.4, quoi: "local du chlore : bidons de chlore et produits de traitement (chimie), cartons de bracelets connectés" },
    { x: -18.2, z: -12.2, quoi: "tuyauteries de la salle des machines : tubes et raccords de cuivre" },
    { x: -22.2, z: -11.2, quoi: "chaudière (rallumée) : grille, porte de foyer, manomètres ; tas de bois des survivants" },
    { x: -18.7, z: -3.4, quoi: "pompes : moteurs (bobinages de cuivre), roulements" },
    { x: -19, z: -8.6, quoi: "filtres à sable : sable propre (filtration de l'eau), vannes" },
    { x: -7.0, z: 12.4, quoi: "guichet des bains-douches : serviettes et peignoirs (tissu), jetons de douche" },
    { x: -10.2, z: 9.8, quoi: "cabines de douche : savon (hygiène, Book 05), pommeaux, carreaux de faïence à desceller" },
    { x: 0, z: -12, quoi: "cabines du rez-de-chaussée : portes et bancs (bois sec), vêtements oubliés" },
    { x: -5.1, z: 11.8, quoi: "casiers à vêtements : sacs de sport, cadenas, une lampe de poche" },
    { x: 3.6, z: 11, quoi: "caisse : rouleaux de tickets, la lanterne, une boîte à outils sous le comptoir" },
    { x: 14.2, z: 11.6, quoi: "infirmerie : trousse de secours, bouée, perche, couverture de survie, bouteille d'oxygène" },
    { x: 26.5, z: -12.6, quoi: "buvette du solarium : bouteilles, sirops, glacière" },
    { x: 15.6, z: 4.6, quoi: "camp des survivants sur la plage : couvertures, réchaud, conserves" },
  ],
  eteints: [
    { x: 6, z: 4.6, type: "errant (sur la plage sud)" },
    { x: -1.6, z: 10.4, type: "errant (coincé contre les tourniquets)" },
    { x: -6, z: -4, type: "errant (tombé dans le grand bain, il tourne en rond au fond)" },
    { x: 9, z: -10.4, type: "ancien habitant (maître-nageur, sifflet au cou)" },
    { x: -5.4, z: -13.8, type: "rampant (dans une cabine du rez-de-chaussée)" },
    { x: -11, z: 11.8, type: "errant (dans le couloir des douches)" },
    { x: -8.2, z: 9.4, type: "putréfié (dans une cabine de douche)" },
    { x: -24.5, z: -4, type: "ancien habitant (agent d'entretien, bidon de chlore)" },
    { x: 23, z: -3, type: "errant (entre les transats du solarium)" },
    { x: -15, z: 19.5, type: "errant (dans la rue)" },
  ],
};

// ---------- Dimensions et couleurs ----------

const CUT = 1.1; // coupe des murs vus de la caméra (hauteur d'allège)
const EP = 0.35; // murs
const N = { x1: -17, x2: 17, z1: -15, z2: 8.5, h: 7 }; // la nef
const B = { x1: -12.5, x2: 12.5, z1: -9, z2: 3 }; // le bassin (intérieur des parois)
const PLAT = { crasse: false, nuance: 0 };

/** La voûte en berceau surbaissé : corde = largeur de la nef, flèche 4,5 m. */
const VOUTE = (() => {
  const corde = N.z2 - N.z1;
  const fleche = 4.5;
  const R = (corde * corde) / 4 / (2 * fleche) + fleche / 2;
  return { R, zc: (N.z1 + N.z2) / 2, yc: N.h + fleche - R, theta: Math.asin(corde / 2 / R) };
})();
const arcY = (z) => VOUTE.yc + Math.sqrt(Math.max(0, VOUTE.R ** 2 - (z - VOUTE.zc) ** 2));

/** Profondeur du bassin en x : 1 m au petit bain (est), 3,5 m au grand bain (ouest), pente entre les deux. */
function profondeur(x) {
  if (x >= 2) return 1;
  if (x <= -5) return 3.5;
  return 1 + ((2 - x) / 7) * 2.5;
}

const COUL = {
  brique: 0xb0714f,
  briqueSombre: 0x8a5440,
  beton: 0xddd3bb,
  betonGris: 0xaaa497,
  margelle: 0xe0d7c2,
  plage: 0xd8d1c0,
  hall: 0xd4c7a8,
  douche: 0xd5d4cc,
  solarium: 0xcbbd9e,
  machines: 0x948e84,
  bassin: 0x9cc6c0,
  bassinFond: 0x8bb7b1,
  ligne: 0x2a2d31,
  faienceHall: 0x9fbfa6,
  faienceBlanche: 0xe6e2d6,
  cadre: 0x55665f,
  acier: 0x4f5c5a,
  rampe: 0x8d969a,
  cabine: 0xdcd2bc,
  porteJaune: 0xc9a55a,
  porteBleue: 0x6890a0,
  bois: 0x8a6b4a,
  cuivre: 0xb4703f,
  chaudiere: 0x3e3b37,
  filtre: 0x6f7f7b,
  terre: 0x8f7a5c,
  herbe: 0x8e9a5c,
  gravier: 0xa69a80,
  trottoir: 0xb4aea2,
  asphalte: 0x5f5d59,
  serviette: 0xe8e2d4,
  drone: 0xe3e0d6,
  aqua: 0x2f6f73,
  bouee: 0xc4583a,
};

// ---------- Matières propres au lieu (créées une fois, partagées) ----------

const AL = 1024;
const AH = 1280;

/** L'atlas des enseignes, mosaïques et plaques (une seule matière pour tout) : [x, y, l, h] en pixels. */
const R = {
  fronton: [0, 0, 1024, 96],
  bains: [0, 96, 512, 128],
  aquasmart: [512, 96, 512, 256],
  horloge: [0, 224, 256, 256],
  poisson: [256, 224, 256, 256],
  nageuses: [512, 352, 512, 256],
  vagues: [0, 480, 512, 128],
  numeros: [0, 608, 512, 192],
  tarifs: [512, 608, 256, 256],
  bracelet: [768, 608, 256, 256],
  douches: [0, 800, 256, 96],
  infirmerie: [256, 800, 256, 96],
  chlore: [0, 896, 256, 128],
  prof350: [256, 896, 128, 128],
  prof100: [384, 896, 128, 128],
  borne: [512, 864, 256, 160],
  flamme: [768, 864, 128, 160],
  plongeon: [896, 864, 128, 160],
  graffiti: [0, 1024, 1024, 256],
};

/** La case du numéro n (1 à 24) dans la planche des numéros de cabines. */
function caseNumero(n) {
  const i = (n - 1) % 24;
  return [R.numeros[0] + (i % 8) * 64, R.numeros[1] + Math.floor(i / 8) * 64, 64, 64];
}

let MATS = null;

function matieres() {
  if (MATS) return MATS;
  const atlas = dessiner("piscine-atlas", AL, AH, dessinerAtlas, false);
  const faience = matiereTexture(dessiner("piscine-faience", 256, 256, dessinerFaience), { roughness: 0.4 });
  faience.userData.tuile = 1;
  const enseignes = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.8, alphaTest: 0.5, side: THREE.DoubleSide });
  const neon = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 1.2, vertexColors: true, roughness: 0.5, alphaTest: 0.5, side: THREE.DoubleSide });
  neon.userData.sansOmbre = true;
  MATS = {
    brique: matiereMonde("brique"),
    beton: matiereMonde("enduit"), // le béton crème des années 1930, lissé et peint
    carrelage: matiereMonde("carrelage"),
    faience,
    enseignes,
    neon,
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    eau: matiereEau(0x3c4a44, 0.7),
    mat: matiere(0.95),
    satin: matiere(0.6, 0.05),
    lisse: matiere(0.3, 0.05),
    tole: MAT.tole(),
    metal: matiere(0.4, 0.7),
    toile: MAT.toile(),
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
    d.addColorStop(0, `rgba(60,52,40,${0.22 * force})`);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(cx, y, 2 + a() * 6, lg);
  }
  g.restore();
}

const POLICE_DECO = `"Futura", "Century Gothic", "Avenir Next", "Trebuchet MS", "Arial Black", sans-serif`;

function texte(g, t, x, y, taille, couleur, police = "700", align = "center", rotation = 0, famille = POLICE_DECO) {
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

/** Remplit une zone de tesselles carrées ; `couleurDe(px, py)` rend la couleur (ou null : rien). */
function tesselles(g, a, x, y, l, h, pas, couleurDe) {
  for (let j = 0; j < h; j += pas) {
    for (let i = 0; i < l; i += pas) {
      const c = couleurDe(x + i + pas / 2, y + j + pas / 2);
      if (!c) continue;
      g.fillStyle = c;
      g.fillRect(x + i + 0.8, y + j + 0.8, pas - 1.6, pas - 1.6);
      if (a() < 0.25) {
        g.fillStyle = a() < 0.5 ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)";
        g.fillRect(x + i + 0.8, y + j + 0.8, pas - 1.6, pas - 1.6);
      }
    }
  }
}

function plaqueEmail(g, a, [x, y, l, h], fond, bord, lignes) {
  g.fillStyle = fond;
  g.fillRect(x + 2, y + 2, l - 4, h - 4);
  g.strokeStyle = bord;
  g.lineWidth = 5;
  g.strokeRect(x + 8, y + 8, l - 16, h - 16);
  for (const [t, dy, taille, coul] of lignes) texte(g, t, x + l / 2, y + h / 2 + dy, taille, coul ?? bord, "800");
  // Éclats d'émail
  for (let i = 0; i < 5; i++) {
    g.fillStyle = "rgba(40,38,34,0.75)";
    g.beginPath();
    g.arc(x + a() * l, y + (a() < 0.5 ? a() * 14 : h - a() * 14), 2 + a() * 5, 0, 7);
    g.fill();
  }
  salir(g, a, x, y, l, h, 0.8);
}

function dessinerFaience(g) {
  const a = aleatoire(1930);
  g.fillStyle = "#b9b6ad";
  g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 32) for (let y = 0; y < 256; y += 32) {
    const r = a();
    if (r < 0.03) {
      g.fillStyle = "#8d887e"; // carreau tombé : le mortier gris
      g.fillRect(x, y, 32, 32);
      continue;
    }
    const v = 238 + Math.floor((a() - 0.5) * 16);
    g.fillStyle = r < 0.08 ? "#d4d0c6" : `rgb(${v},${v},${v - 5})`;
    g.fillRect(x + 1.5, y + 1.5, 29, 29);
    // le reflet de l'émail
    g.fillStyle = "rgba(255,255,255,0.35)";
    g.fillRect(x + 3, y + 3, 10, 2);
  }
  taches(g, a, 14, "rgba(90, 80, 55, 0.22)", 8, 40, 256, 256);
  taches(g, a, 6, "rgba(70, 95, 60, 0.2)", 10, 36, 256, 256);
  g.strokeStyle = "rgba(50,48,44,0.55)";
  g.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    let x = a() * 256;
    let y = a() * 256;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 7; k++) {
      x += (a() - 0.5) * 30;
      y += (a() - 0.3) * 24;
      g.lineTo(x, y);
    }
    g.stroke();
  }
}

function dessinerAtlas(g) {
  const a = aleatoire(1934);
  g.clearRect(0, 0, AL, AH);

  // Le fronton : lettres de bronze en relief (fond transparent), un « U » qui pend de travers
  {
    const [x, y, l, h] = R.fronton;
    const t = "PISCINE · BAINS-DOUCHES";
    g.font = `800 80px ${POLICE_DECO}`;
    const largeurs = [...t].map((ch) => g.measureText(ch).width + 6);
    const total = largeurs.reduce((s, v) => s + v, 0);
    const k = Math.min(1, (l - 30) / total);
    let cx = x + (l - total * k) / 2;
    [...t].forEach((ch, i) => {
      const w = largeurs[i] * k;
      const pend = ch === "U";
      g.save();
      g.translate(cx + w / 2, y + h / 2 + (pend ? 10 : 0));
      g.rotate(pend ? 0.42 : 0);
      g.scale(k, 1);
      g.font = `800 80px ${POLICE_DECO}`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.lineWidth = 6;
      g.strokeStyle = "#4e4130";
      g.strokeText(ch, 0, 0);
      g.fillStyle = i % 5 === 2 ? "#a88f58" : "#bfa468";
      g.fillText(ch, 0, 0);
      g.restore();
      cx += w;
    });
  }

  // BAINS-DOUCHES : mosaïque bleue, lettres d'or
  {
    const [x, y, l, h] = R.bains;
    tesselles(g, a, x, y, l, h, 8, () => ["#2f5f7a", "#386b86", "#2a5670", "#3f7690"][Math.floor(a() * 4)]);
    g.fillStyle = "#c9a64a";
    g.fillRect(x, y, l, 6);
    g.fillRect(x, y + h - 6, l, 6);
    g.save();
    g.font = `800 62px ${POLICE_DECO}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineWidth = 5;
    g.strokeStyle = "#e9dfc6";
    g.strokeText("BAINS-DOUCHES", x + l / 2, y + 52);
    g.fillStyle = "#c9a64a";
    g.fillText("BAINS-DOUCHES", x + l / 2, y + 52);
    g.restore();
    texte(g, "HOMMES  ·  DAMES", x + l / 2, y + 102, 22, "#e9dfc6", "700");
    // le mortier de la mosaïque, par-dessus
    g.fillStyle = "rgba(30,40,45,0.25)";
    for (let i = 0; i < l; i += 8) g.fillRect(x + i, y, 1, h);
    for (let j = 0; j < h; j += 8) g.fillRect(x, y + j, l, 1);
    salir(g, a, x, y, l, h, 1);
  }

  // AquaSmart : l'enseigne plastique de l'Abondance
  {
    const [x, y, l, h] = R.aquasmart;
    const d = g.createLinearGradient(0, y, 0, y + h);
    d.addColorStop(0, "#f1ece0");
    d.addColorStop(1, "#d9d6cc");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y + h - 46, l, 46);
    // le logo : trois vagues
    g.strokeStyle = "#2f6f73";
    g.lineWidth = 9;
    g.lineCap = "round";
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      for (let i = 0; i <= 40; i++) {
        const px = x + 30 + i * 2.2;
        const py = y + 70 + k * 26 + Math.sin(i / 6) * 9;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.stroke();
    }
    texte(g, "AquaSmart", x + 290, y + 92, 66, "#2f6f73", "800", "center", 0, `"Avenir Next", "Helvetica Neue", Arial, sans-serif`);
    texte(g, "™", x + 450, y + 70, 22, "#2f6f73", "700");
    texte(g, "Nagez sans vous mouiller", x + 290, y + 158, 30, "#c8362b", "italic 600", "center", 0, `"Avenir Next", "Helvetica Neue", Arial, sans-serif`);
    texte(g, "BRACELET CONNECTÉ OBLIGATOIRE · VAGUES VIRTUELLES 4K", x + l / 2, y + h - 23, 21, "#e9f2ef", "700", "center", 0, `"Avenir Next", "Helvetica Neue", Arial, sans-serif`);
    // délavé, une fente dans le plastique
    salir(g, a, x, y, l, h, 1.6);
    g.strokeStyle = "rgba(40,36,30,0.6)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x + 380, y);
    g.lineTo(x + 360, y + 60);
    g.lineTo(x + 395, y + 120);
    g.stroke();
  }

  // L'horloge : cadran crème, chiffres Art déco, arrêtée à 7 h 40 (l'heure de l'ouverture)
  {
    const [x, y, l] = R.horloge;
    const cx = x + l / 2;
    const cy = y + l / 2;
    g.fillStyle = "#6e5a3a";
    g.beginPath();
    g.arc(cx, cy, l / 2 - 2, 0, 7);
    g.fill();
    g.fillStyle = "#e3d9c0";
    g.beginPath();
    g.arc(cx, cy, l / 2 - 16, 0, 7);
    g.fill();
    g.fillStyle = "#3a332a";
    for (let i = 0; i < 12; i++) {
      const t = (i / 12) * Math.PI * 2;
      if (i % 3 === 0) {
        texte(g, ["XII", "III", "VI", "IX"][i / 3], cx + Math.sin(t) * 84, cy - Math.cos(t) * 84, 26, "#3a332a", "800");
      } else {
        g.save();
        g.translate(cx + Math.sin(t) * 88, cy - Math.cos(t) * 88);
        g.rotate(t);
        g.fillRect(-4, -12, 8, 24);
        g.restore();
      }
    }
    const aiguille = (ang, lg, ep) => {
      g.save();
      g.translate(cx, cy);
      g.rotate(ang);
      g.fillStyle = "#2a251f";
      g.beginPath();
      g.moveTo(-ep, 10);
      g.lineTo(0, -lg);
      g.lineTo(ep, 10);
      g.fill();
      g.restore();
    };
    aiguille(((7 + 40 / 60) / 12) * Math.PI * 2, 50, 7);
    aiguille((40 / 60) * Math.PI * 2, 78, 5);
    // verre brisé
    g.strokeStyle = "rgba(255,255,255,0.55)";
    g.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.moveTo(cx + 30, cy - 40);
      g.lineTo(cx + 30 + Math.cos(i) * 90, cy - 40 + Math.sin(i * 1.7) * 90);
      g.stroke();
    }
    salir(g, a, x + 20, y + 20, l - 40, l - 40, 1);
  }

  // Le médaillon du poisson : mosaïque ronde
  {
    const [x, y, l] = R.poisson;
    const cx = x + l / 2;
    const cy = y + l / 2;
    const corps = new Path2D();
    corps.ellipse(cx + 12, cy, 66, 34, 0, 0, Math.PI * 2);
    const queue = new Path2D();
    queue.moveTo(cx - 50, cy);
    queue.lineTo(cx - 92, cy - 38);
    queue.lineTo(cx - 84, cy);
    queue.lineTo(cx - 92, cy + 38);
    queue.closePath();
    const nageoire = new Path2D();
    nageoire.moveTo(cx - 6, cy - 30);
    nageoire.lineTo(cx + 26, cy - 58);
    nageoire.lineTo(cx + 34, cy - 30);
    nageoire.closePath();
    tesselles(g, a, x, y, l, l, 8, (px, py) => {
      const r = Math.hypot(px - cx, py - cy);
      if (r > l / 2 - 2) return null;
      if (r > l / 2 - 18) return a() < 0.5 ? "#c9a64a" : "#24455a";
      if (Math.hypot(px - (cx + 50), py - (cy - 8)) < 7) return "#1e2a30";
      if (g.isPointInPath(corps, px, py) || g.isPointInPath(queue, px, py) || g.isPointInPath(nageoire, px, py)) {
        return ["#c98a3c", "#d29a48", "#b8743a", "#dcae5c"][Math.floor(a() * 4)];
      }
      // l'eau : bandes ondulées
      const onde = Math.sin((px - x) / 18 + Math.floor((py - y) / 24)) > 0.6;
      return onde ? "#8cc0c8" : ["#3f7f9a", "#4a8aa3", "#36728c", "#5596ab"][Math.floor(a() * 4)];
    });
    // des tesselles tombées
    for (let i = 0; i < 18; i++) {
      g.fillStyle = "#9c968a";
      g.fillRect(x + 30 + Math.floor(a() * 24) * 8, y + 30 + Math.floor(a() * 24) * 8, 7, 7);
    }
  }

  // Les nageuses : bas-relief de pierre (le relief est peint : lumière en haut à gauche)
  {
    const [x, y, l, h] = R.nageuses;
    g.fillStyle = "#b3a382";
    g.fillRect(x, y, l, h);
    // éventail de rayons Art déco
    g.strokeStyle = "rgba(255,248,225,0.22)";
    g.lineWidth = 6;
    for (let i = 0; i < 11; i++) {
      const t = Math.PI + (i / 10) * Math.PI;
      g.beginPath();
      g.moveTo(x + l / 2, y + h - 40);
      g.lineTo(x + l / 2 + Math.cos(t) * 300, y + h - 40 + Math.sin(t) * 300);
      g.stroke();
    }
    const nageuse = (ox, oy, ang, miroir) => {
      const trace = () => {
        g.beginPath();
        g.ellipse(0, 0, 70, 15, 0, 0, Math.PI * 2); // le corps tendu
        g.moveTo(70, -6);
        g.lineTo(135, -16);
        g.lineTo(135, -6);
        g.lineTo(70, 8); // les bras joints
        g.moveTo(-60, -6);
        g.lineTo(-128, -24);
        g.lineTo(-124, -12);
        g.lineTo(-60, 10); // les jambes
        g.moveTo(92, 0);
        g.arc(84, 0, 15, 0, Math.PI * 2); // la tête
      };
      for (const [dx, dy, coul] of [[6, 7, "#5f5644"], [-3, -3, "#f6efdc"], [0, 0, "#e4d9bc"]]) {
        g.save();
        g.translate(ox + dx, oy + dy);
        g.rotate(ang);
        if (miroir) g.scale(-1, 1);
        g.fillStyle = coul;
        trace();
        g.fill();
        g.restore();
      }
    };
    nageuse(x + 160, y + 110, 0.45, false);
    nageuse(x + 350, y + 120, -0.45, true);
    // les vagues stylisées en bas
    for (let k = 0; k < 2; k++) {
      for (const [dy, coul] of [[4, "#8f8166"], [0, "#e9dfc6"]]) {
        g.strokeStyle = coul;
        g.lineWidth = 7;
        g.beginPath();
        for (let i = 0; i <= 64; i++) {
          const px = x + i * 8;
          const py = y + h - 46 + k * 22 + dy + Math.sin(i / 2.5 + k) * 8;
          if (i === 0) g.moveTo(px, py);
          else g.lineTo(px, py);
        }
        g.stroke();
      }
    }
    // cadre à redents
    g.strokeStyle = "#8f8166";
    g.lineWidth = 8;
    g.strokeRect(x + 6, y + 6, l - 12, h - 12);
    g.strokeStyle = "#efe6cf";
    g.lineWidth = 3;
    g.strokeRect(x + 16, y + 16, l - 32, h - 32);
    salir(g, a, x, y, l, h, 1.8);
    taches(g, a, 6, "rgba(60, 80, 50, 0.25)", 10, 30, l, h);
  }

  // La frise de vagues (mosaïque répétable)
  {
    const [x, y, l, h] = R.vagues;
    tesselles(g, a, x, y, l, h, 8, (px, py) => {
      const u = px - x;
      const v = py - y;
      if (v < 12 || v > h - 12) return "#24455a";
      const yw = 70 + 24 * Math.sin((u / 128) * Math.PI * 2);
      const boucle = Math.hypot(((u + 32) % 128) - 64, v - 52) < 16;
      if (boucle && v < yw) return "#e8e0c8";
      if (v > yw) return v > yw + 18 ? "#2f5f7a" : "#4f8aa0";
      if (v > yw - 8) return "#e8e0c8";
      return ["#d8cfb6", "#e0d8c0", "#cfc6ad"][Math.floor(a() * 3)];
    });
  }

  // Les numéros des cabines : plaques émaillées 1 à 24
  for (let n = 1; n <= 24; n++) {
    const [x, y, l, h] = caseNumero(n);
    g.fillStyle = "#e9e4d6";
    g.fillRect(x + 3, y + 3, l - 6, h - 6);
    g.strokeStyle = "#2f5f7a";
    g.lineWidth = 4;
    g.strokeRect(x + 7, y + 7, l - 14, h - 14);
    texte(g, String(n), x + l / 2, y + h / 2 + 1, 30, "#2f5f7a", "800");
    if (a() < 0.4) {
      g.fillStyle = "rgba(40,38,34,0.7)";
      g.beginPath();
      g.arc(x + 8 + a() * 48, y + 8 + a() * 48, 3 + a() * 4, 0, 7);
      g.fill();
    }
  }

  // Les tarifs : plaque émaillée, et l'autocollant de l'Abondance par-dessus
  {
    const [x, y, l, h] = R.tarifs;
    plaqueEmail(g, a, R.tarifs, "#24364a", "#e6dcc2", [
      ["TARIFS", -84, 30],
      ["Bain ........ 0,50 F", -40, 19],
      ["Douche ...... 0,30 F", -14, 19],
      ["Cabine ...... 0,20 F", 12, 19],
      ["Serviette ... 0,10 F", 38, 19],
    ]);
    g.save();
    g.translate(x + l / 2 + 10, y + h - 50);
    g.rotate(-0.12);
    g.fillStyle = "#c8362b";
    g.fillRect(-110, -26, 220, 52);
    texte(g, "AquaSmart", 0, -9, 22, "#f2ead6", "800");
    texte(g, "39,90 Wh / mois", 0, 13, 17, "#f2ead6", "700");
    g.restore();
  }

  // L'affiche du bracelet, avec Watty
  {
    const [x, y, l, h] = R.bracelet;
    g.fillStyle = "#e9dfc6";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, l, 40);
    texte(g, "AquaSmart", x + l / 2, y + 21, 24, "#f2ead6", "800");
    texte(g, "BRACELET", x + l / 2, y + 66, 30, "#c8362b", "800");
    texte(g, "CONNECTÉ", x + l / 2, y + 98, 30, "#c8362b", "800");
    texte(g, "OBLIGATOIRE", x + l / 2, y + 130, 26, "#3b2a1e", "800");
    // Watty, la pile souriante
    const wx = x + l / 2;
    const wy = y + 190;
    g.fillStyle = "#c79a3b";
    g.fillRect(wx - 26, wy - 34, 52, 70);
    g.fillRect(wx - 10, wy - 42, 20, 8);
    g.fillStyle = "#3b2a1e";
    g.beginPath();
    g.arc(wx - 10, wy - 10, 4, 0, 7);
    g.arc(wx + 10, wy - 10, 4, 0, 7);
    g.fill();
    g.strokeStyle = "#3b2a1e";
    g.lineWidth = 3;
    g.beginPath();
    g.arc(wx, wy + 4, 12, 0.2, Math.PI - 0.2);
    g.stroke();
    texte(g, "Toujours plein, jamais à plat !", x + l / 2, y + h - 14, 15, "#3b2a1e", "italic 600");
    g.fillStyle = "rgba(233,223,198,0.35)";
    g.fillRect(x, y, l, h);
    salir(g, a, x, y, l, h, 1.4);
  }

  plaqueEmail(g, a, R.douches, "#e9e4d6", "#2f5f7a", [["DOUCHES", 2, 40]]);
  plaqueEmail(g, a, R.infirmerie, "#e9e4d6", "#2f5f7a", [["INFIRMERIE", 2, 30]]);
  {
    const [x, y, l, h] = R.infirmerie;
    g.fillStyle = "#c8362b";
    g.fillRect(x + 18, y + h / 2 - 5, 22, 10);
    g.fillRect(x + 24, y + h / 2 - 11, 10, 22);
  }
  plaqueEmail(g, a, R.chlore, "#d4b53e", "#24221f", [["DANGER", -22, 38], ["CHLORE", 24, 34]]);
  plaqueEmail(g, a, R.prof350, "#e6e0cf", "#24221f", [["3,50 m", 0, 30]]);
  plaqueEmail(g, a, R.prof100, "#e6e0cf", "#24221f", [["1,00 m", 0, 30]]);
  plaqueEmail(g, a, R.plongeon, "#e6e0cf", "#24364a", [["PLONGEON", -36, 20], ["option", 0, 20, "#c8362b"], ["PREMIUM", 30, 22, "#c8362b"]]);

  // L'écran de la borne (servi par la matière lumineuse)
  {
    const [x, y, l, h] = R.borne;
    g.fillStyle = "#0e1a22";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "#7fe0d8";
    g.lineWidth = 6;
    g.beginPath();
    g.arc(x + l / 2, y + 48, 24, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = "#c8362b";
    g.fillRect(x + l / 2 - 4, y + 34, 8, 18);
    g.fillRect(x + l / 2 - 4, y + 56, 8, 7);
    texte(g, "BRACELET", x + l / 2, y + 100, 28, "#7fe0d8", "800", "center", 0, `"Avenir Next", Arial, sans-serif`);
    texte(g, "NON DÉTECTÉ", x + l / 2, y + 132, 24, "#7fe0d8", "700", "center", 0, `"Avenir Next", Arial, sans-serif`);
  }

  // La flamme (feu de camp, foyer de la chaudière) : fond transparent
  {
    const [x, y, l, h] = R.flamme;
    const cx = x + l / 2;
    const pied = y + h - 6;
    for (const [s, coul] of [[1, "#d2541e"], [0.75, "#f08a2a"], [0.48, "#ffd27a"]]) {
      g.fillStyle = coul;
      g.beginPath();
      g.moveTo(cx - 48 * s, pied);
      g.quadraticCurveTo(cx - 56 * s, pied - 70 * s, cx - 8 * s, pied - 140 * s);
      g.quadraticCurveTo(cx + 2 * s, pied - 90 * s, cx + 18 * s, pied - 120 * s);
      g.quadraticCurveTo(cx + 60 * s, pied - 60 * s, cx + 48 * s, pied);
      g.closePath();
      g.fill();
    }
  }

  // Les graffitis (fond transparent : ils se posent sur la faïence)
  {
    const [x, y, l, h] = R.graffiti;
    const tag = (t, px, py, taille, fond, contour, rot) => {
      g.save();
      g.translate(x + px, y + py);
      g.rotate(rot);
      g.font = `900 ${taille}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.lineJoin = "round";
      g.lineWidth = taille * 0.22;
      g.strokeStyle = contour;
      g.strokeText(t, 0, 0);
      g.fillStyle = fond;
      g.fillText(t, 0, 0);
      g.lineWidth = 3;
      g.strokeStyle = "rgba(255,255,255,0.75)";
      g.strokeText(t, -3, -3);
      g.restore();
      // coulures
      g.fillStyle = fond;
      for (let i = 0; i < 6; i++) g.fillRect(x + px + (a() - 0.5) * taille * t.length * 0.5, y + py + taille * 0.35, 4, 10 + a() * 40);
    };
    tag("AQUA DUMB", 250, 110, 108, "#c77b8f", "#2a2422", -0.06);
    tag("PLOUF", 640, 90, 96, "#4f9a94", "#1f2a2a", 0.08);
    tag("WATT NOW ?", 820, 190, 58, "#c9a040", "#2a2422", -0.04);
    tag("NO SIGNAL", 470, 205, 48, "#e6e0cf", "#2a2422", 0.03);
    g.strokeStyle = "#2a2422";
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(x + 40, y + 220);
    g.bezierCurveTo(x + 90, y + 160, x + 120, y + 250, x + 180, y + 200);
    g.stroke();
  }
}

// ---------- Outils de construction ----------

const GEO = {};
function geoCylindre(r, h, cotes) {
  const cle = `cyl|${r}|${h}|${cotes}`;
  if (!GEO[cle]) GEO[cle] = new THREE.CylinderGeometry(r, r, h, cotes);
  return GEO[cle];
}

/** Un panneau plat dont l'image vient de l'atlas (région `r`), face vers +z local. */
function panneau(c, mat, r, pose, l, h) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
  c.poser(g, mat, 0xffffff, pose, PLAT);
  g.dispose();
}

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
 * Un mur coupé : le bas (0 → CUT) reste toujours visible et porte les obstacles, le haut va dans la couche `T`.
 * `dado` : le soubassement carrelé de la face intérieure (bas seulement).
 */
function murCoupe(k, T, a, b, spec) {
  const { h, ouvertures = [], breches = [], dado = null, ...reste } = spec;
  mur(k.c, a, b, { ...reste, h: CUT, ouvertures: tranche(ouvertures, 0, CUT), batiment: k.b, interieur: dado });
  mur(T, a, b, { ...reste, y0: CUT, h: h - CUT, ouvertures: tranche(ouvertures, CUT, h), breches });
}

/** Des bandes horizontales en saillie sur la face extérieure (+z local) d'un mur : [{ y1, y2, s, couleur, mat, ch, trous }]. */
function bandes(a, b, ep, liste) {
  const { L, ry } = repereMur(a, b);
  for (const bd of liste) {
    const d = bd.deborde ?? bd.s;
    bd.ch.repere({ x: a[0], z: a[1], ry }, () => {
      for (const [u1, u2] of soustraire(-d, L + d, bd.trous ?? [])) bd.ch.pave(u1, bd.y1, ep / 2 - 0.02, u2, bd.y2, ep / 2 + bd.s, bd.couleur, bd.mat, { nuance: 0.02, crasse: bd.y1 < 1 });
    });
  }
}

/** Un pilastre à redents (trois épaisseurs étagées), posé contre une face (repère : +z local = dehors). */
function pilastre(k, T, x, z, ry, h) {
  const { c, m } = k;
  const etages = [[0.95, 0.16, 0], [0.62, 0.3, 0.45], [0.3, 0.44, 0.95]];
  for (const [ch, y1, y2f] of [[c, 0, () => CUT], [T, CUT, (e) => h + e]]) {
    ch.repere({ x, z, ry }, () => {
      for (const [l, d, plus] of etages) ch.pave(-l / 2, y1, 0, l / 2, y2f(plus), d, COUL.beton, m.beton, { nuance: 0.02, crasse: y1 < 1 });
    });
  }
}

/** Un vantail de porte charnière en (x, z), tourné de `ry` (fermé : le long de +x local). */
function vantail(c, x, z, ry, l, h, couleur, mat, vitre = null) {
  c.repere({ x, y: 0.03, z, ry }, () => {
    if (vitre) {
      c.pave(0, 0, -0.03, 0.08, h, 0.03, couleur, mat);
      c.pave(l - 0.08, 0, -0.03, l, h, 0.03, couleur, mat);
      c.pave(0, 0, -0.03, l, 0.25, 0.03, couleur, mat);
      c.pave(0, h - 0.1, -0.03, l, h, 0.03, couleur, mat);
      if (vitre !== "cassee") c.boite(l - 0.16, h - 0.35, 0.01, 0xffffff, { x: l / 2, y: (h + 0.15) / 2 }, k0.m.verre, PLAT);
    } else {
      c.pave(0, 0, -0.025, l, h, 0.025, couleur, mat, { nuance: 0.05 });
      c.pave(0.12, h * 0.55, 0.02, l - 0.12, h * 0.9, 0.035, couleur, mat, { nuance: 0.08 });
    }
  });
}
// Le contexte courant (pour les vitres des vantaux)
let k0 = null;

/** Une fenêtre condamnée par des planches (cadre sans verre), dans la couche `ch`, sur la face +z du mur a → b. */
function fenetreCondamnee(ch, a, b, u, bas, haut, l, ep, planches = 3) {
  const { ry } = repereMur(a, b);
  const mat = matiere(0.95);
  ch.repere({ x: a[0], z: a[1], ry }, () => {
    ch.pave(u - l / 2, bas, -0.05, u - l / 2 + 0.08, haut, 0.05, COUL.cadre, mat);
    ch.pave(u + l / 2 - 0.08, bas, -0.05, u + l / 2, haut, 0.05, COUL.cadre, mat);
    ch.pave(u - l / 2, haut - 0.08, -0.05, u + l / 2, haut, 0.05, COUL.cadre, mat);
    ch.pave(u - l / 2 - 0.08, bas - 0.07, -0.02, u + l / 2 + 0.08, bas, ep / 2 + 0.08, COUL.beton, mat);
    for (let i = 0; i < planches; i++) {
      if (ch.hasard() < 0.15) continue;
      ch.boite(l + 0.25, 0.2, 0.035, PALETTE.boisGris, { x: u, y: bas + (haut - bas) * (0.2 + (0.6 * i) / Math.max(1, planches - 1)), z: ep / 2 + 0.03, rz: ch.entre(-0.18, 0.18) }, mat, { nuance: 0.1 });
    }
  });
}

/** Un rectangle d'obstacles (meuble, machine). */
function rect(k, x1, z1, x2, z2, nature = "meuble") {
  k.b.obstacle(x1, z1, x2, z1, nature);
  k.b.obstacle(x2, z1, x2, z2, nature);
  k.b.obstacle(x2, z2, x1, z2, nature);
  k.b.obstacle(x1, z2, x1, z1, nature);
}

// ---------- Le bâtiment ----------

export function creer({ usure = 0.7 } = {}) {
  const b = new Batiment(1934, usure);
  const m = matieres();
  const k = { b, c: b.c, m, usure, bris: 0.25 + 0.65 * usure };
  k0 = k;
  // Les couches qui s'effacent : chacune porte le haut des murs qui la cachent vue du sud-est.
  k.N = b.couche("nef : verrière, coursive, hauts de murs", { x: 0, z: (N.z1 + N.z2) / 2, l: 34.7, p: 24.2 }, CUT, 11.8);
  k.H = b.couche("hall et fronton", { x: 0, z: 11.9, l: 12.4, p: 7.2 }, CUT, 12.5);
  k.BD = b.couche("bains-douches", { x: -11.5, z: 11.85, l: 11.4, p: 7 }, CUT, 5.2);
  k.INF = b.couche("infirmerie", { x: 11.5, z: 11.85, l: 11.4, p: 7 }, CUT, 5.2);
  k.MA = b.couche("salle des machines", { x: -22.5, z: -6, l: 11.4, p: 18.4 }, CUT, 6.2);

  sols(k);
  bassin(k);
  nef(k);
  cabinesNef(k);
  verriere(k);
  plongeoir(k);
  hall(k);
  bainsDouches(k);
  infirmerie(k);
  machines(k);
  solarium(k);
  rue(k);
  camp(k);

  // La flamme et la borne vacillent (une seule matière lumineuse)
  const anime = new THREE.Object3D();
  anime.userData.animer = (t) => {
    m.neon.emissiveIntensity = 1.05 + 0.18 * Math.sin(t * 9.1) + 0.12 * Math.sin(t * 23.7);
  };
  b.ajouter(anime);

  // La nuit : feu de survivants sur la plage, lanterne à la caisse, chaudière rallumée, borne qui luit encore.
  b.lumiere(15.4, 0.6, 4.2, 0xff8a3d, 14, 12, "feu de survivants sur la plage");
  b.lumiere(4.2, 1.5, 10.6, 0xffd27a, 5, 8, "lanterne sur le comptoir de la caisse");
  b.lumiere(-22, 0.9, -12.4, 0xff7a30, 8, 9, "lueur de la chaudière rallumée");
  b.lumiere(-3.4, 1.3, 12.9, 0x7fe0d8, 2.5, 4, "écran de la borne AquaSmart");

  return b.construire();
}

// ---------- Sols (solPropre : tout le lot, troué du bassin) ----------

function sols(k) {
  const { c, m, usure } = k;
  const Y = -0.5;
  const hx1 = B.x1 - 0.3;
  const hx2 = B.x2 + 0.3;
  const hz1 = B.z1 - 0.3;
  const hz2 = B.z2 + 0.3;
  const socle = (x1, z1, x2, z2) => c.pave(x1, Y, z1, x2, 0, z2, COUL.terre, m.mat, PLAT);
  socle(-30, -22.5, 30, hz1);
  socle(-30, hz2, 30, 22.5);
  socle(-30, hz1, hx1, hz2);
  socle(hx2, hz1, 30, hz2);
  const F = 0.03;
  // Les plages de la nef (carrelage), autour du trou du bassin
  const plage = (x1, z1, x2, z2) => c.pave(x1, 0, z1, x2, F, z2, COUL.plage, m.carrelage, PLAT);
  plage(N.x1, N.z1, N.x2, hz1);
  plage(N.x1, hz2, N.x2, N.z2);
  plage(N.x1, hz1, hx1, hz2);
  plage(hx2, hz1, N.x2, hz2);
  // La margelle de pierre (un nez qui déborde sur le vide) et la grille de la goulotte
  const marg = (x1, z1, x2, z2) => c.pave(x1, 0, z1, x2, 0.07, z2, COUL.margelle, m.beton, { nuance: 0.02, crasse: false });
  marg(B.x1 - 0.5, B.z1 - 0.5, B.x2 + 0.5, B.z1 + 0.05);
  marg(B.x1 - 0.5, B.z2 - 0.05, B.x2 + 0.5, B.z2 + 0.5);
  marg(B.x1 - 0.5, B.z1 + 0.05, B.x1 + 0.05, B.z2 - 0.05);
  marg(B.x2 - 0.05, B.z1 + 0.05, B.x2 + 0.5, B.z2 - 0.05);
  for (const [x1, z1, x2, z2] of [[B.x1 - 0.9, B.z1 - 0.75, B.x2 + 0.9, B.z1 - 0.6], [B.x1 - 0.9, B.z2 + 0.6, B.x2 + 0.9, B.z2 + 0.75], [B.x1 - 0.75, B.z1 - 0.6, B.x1 - 0.6, B.z2 + 0.6], [B.x2 + 0.6, B.z1 - 0.6, B.x2 + 0.75, B.z2 + 0.6]]) {
    c.pave(x1, F, z1, x2, F + 0.008, z2, 0x4a4c4a, m.tole, PLAT);
  }
  // Les pièces
  c.pave(-6, 0, N.z2, 6, F, 15, COUL.hall, m.carrelage, PLAT);
  c.pave(N.x1, 0, N.z2, -6, F, 15, COUL.douche, m.carrelage, PLAT);
  c.pave(6, 0, N.z2, N.x2, F, 15, COUL.douche, m.carrelage, PLAT);
  c.pave(-28, 0, N.z1, N.x1, F, 3, COUL.machines, m.beton, PLAT);
  c.pave(N.x2, 0, -15.2, 29.2, F, 8.2, COUL.solarium, m.carrelage, PLAT);
  // L'herbe et la terre battue autour
  const herbe = (x1, z1, x2, z2, coul = COUL.herbe) => c.pave(x1, 0, z1, x2, 0.015, z2, coul, m.mat, PLAT);
  herbe(-30, -22.5, 30, -15.2);
  herbe(-30, -15.2, -28, 3);
  herbe(29.2, -15.2, 30, 8.2);
  herbe(N.x2, 8.2, 30, 15, 0x93995e);
  herbe(-30, 3, N.x1, 15, COUL.gravier);
  // Le trottoir, la bordure, la chaussée
  c.pave(-30, 0, 15, 30, 0.05, 17.55, COUL.trottoir, m.carrelage, PLAT);
  c.pave(-30, 0, 17.55, 30, 0.1, 17.75, COUL.betonGris, m.beton, { nuance: 0.02 });
  c.pave(-30, 0, 17.75, 30, 0.02, 22.5, COUL.asphalte, m.mat, PLAT);
  for (let x = -28; x < 30; x += 4.5) c.pave(x, 0.02, 20.05, x + 2.2, 0.025, 20.2, 0xcfc9b8, m.mat, PLAT);
  // Fissures de l'asphalte, herbes dans les joints, feuilles
  for (let i = 0; i < 9; i++) c.boite(c.entre(1, 3), 0.01, 0.06, 0x3c3a37, { x: c.entre(-28, 28), y: 0.025, z: c.entre(18.2, 22), ry: c.entre(-0.6, 0.6) }, m.mat, PLAT);
  semerTouffes(c, -30, 17.6, 30, 22.4, Math.round(40 * usure), PALETTE.herbeSeche, 0.02);
  semerTouffes(c, -30, 15.1, 30, 17.5, Math.round(30 * usure), PALETTE.herbeSeche, 0.05);
  semerTouffes(c, -30, -22.4, 30, -15.4, Math.round(70 * usure), PALETTE.herbe, 0.015);
  jonchee(c, -30, 15.1, 30, 17.5, Math.round(60 * usure), undefined, 0.06);
  // Dans les joints des plages
  const pts = [];
  for (let i = 0; i < 40 * usure; i++) {
    const cote = Math.floor(c.hasard() * 4);
    if (cote === 0) pts.push([c.entre(-16, 16), c.entre(B.z2 + 0.6, 5.6), F]);
    else if (cote === 1) pts.push([c.entre(-16, 16), c.entre(-11, B.z1 - 0.6), F]);
    else if (cote === 2) pts.push([c.entre(-16.5, B.x1 - 0.7), c.entre(-9, 3), F]);
    else pts.push([c.entre(B.x2 + 0.7, 16.5), c.entre(-9, 3), F]);
  }
  touffes(c, pts, PALETTE.herbeSeche);
}

// ---------- Le bassin ----------

function bassin(k) {
  const { c, m, usure } = k;
  const { x1, x2, z1, z2 } = B;
  const fond = -3.65;
  const zc = (z1 + z2) / 2;
  // Les parois carrelées
  c.pave(x1 - 0.3, fond, z1 - 0.3, x2 + 0.3, 0, z1, COUL.bassin, m.faience, PLAT);
  c.pave(x1 - 0.3, fond, z2, x2 + 0.3, 0, z2 + 0.3, COUL.bassin, m.faience, PLAT);
  c.pave(x1 - 0.3, fond, z1, x1, 0, z2, COUL.bassin, m.faience, PLAT);
  c.pave(x2, -1.2, z1, x2 + 0.3, 0, z2, COUL.bassin, m.faience, PLAT);
  // Le fond : grand bain, pente, petit bain
  c.pave(x1, fond, z1, -5, -3.5, z2, 0x6f9893, m.faience, PLAT);
  const pente = Math.atan2(2.5, 7);
  const Lp = Math.hypot(7, 2.5);
  c.boite(Lp + 0.05, 0.12, z2 - z1, 0x7da8a2, { x: -1.5, y: -2.25 - 0.06 / Math.cos(pente), z: zc, rz: pente }, m.faience, PLAT);
  c.pave(2, -1.15, z1, x2, -1, z2, COUL.bassinFond, m.faience, PLAT);
  // La trace de l'ancienne ligne d'eau, puis la frise de vagues en mosaïque sous la margelle
  const ligneEau = 0x6f8f80;
  c.pave(x1, -0.62, z1, x2, -0.5, z1 + 0.012, ligneEau, m.mat, PLAT);
  c.pave(x1, -0.62, z1 + 0.012, x1 + 0.012, -0.5, z2, ligneEau, m.mat, PLAT);
  const pasF = 1.12;
  for (let x = x1; x < x2 - 0.1; x += pasF) {
    if (c.hasard() < 0.12 * usure) continue;
    panneau(c, m.enseignes, R.vagues, { x: x + pasF / 2, y: -0.24, z: z1 + 0.015 }, pasF, 0.28);
  }
  for (let z = z1; z < z2 - 0.1; z += pasF) {
    if (c.hasard() < 0.12 * usure) continue;
    panneau(c, m.enseignes, R.vagues, { x: x1 + 0.015, y: -0.24, z: z + pasF / 2, ry: Math.PI / 2 }, pasF, 0.28);
  }
  // Les lignes noires du fond, avec leur T au bout
  for (let i = 1; i <= 5; i++) {
    const z = z1 + i * 2;
    c.pave(x1 + 1.5, -3.5, z - 0.12, -5, -3.49, z + 0.12, COUL.ligne, m.lisse, PLAT);
    c.boite(Lp, 0.012, 0.24, COUL.ligne, { x: -1.5, y: -2.25 + 0.006, z, rz: pente }, m.lisse, PLAT);
    c.pave(2, -1, z - 0.12, x2 - 1.5, -0.99, z + 0.12, COUL.ligne, m.lisse, PLAT);
    c.pave(x1 + 1.5, -3.5, z - 0.6, x1 + 1.74, -3.49, z + 0.6, COUL.ligne, m.lisse, PLAT);
    c.pave(x2 - 1.74, -1, z - 0.6, x2 - 1.5, -0.99, z + 0.6, COUL.ligne, m.lisse, PLAT);
    // la cible sur la paroi ouest
    c.pave(x1, -3.5, z - 0.12, x1 + 0.012, -0.7, z + 0.12, COUL.ligne, m.lisse, PLAT);
    c.pave(x1, -1.2, z - 0.45, x1 + 0.012, -0.96, z + 0.45, COUL.ligne, m.lisse, PLAT);
  }
  // Des carreaux tombés : taches de mortier gris sur les parois et le fond
  for (let i = 0; i < 26 * usure; i++) {
    const x = c.entre(x1 + 0.5, x2 - 0.5);
    const yb = -profondeur(x);
    c.pave(x - 0.2, c.entre(yb + 0.2, -0.8), z1, x + c.entre(0, 0.5), c.entre(-0.8, -0.3), z1 + 0.014, 0x8d887e, m.mat, PLAT);
  }
  debris(c, x1 + 0.3, z1 + 0.2, -5.2, z2 - 0.2, Math.round(50 * usure), [COUL.bassin, 0xe6e2d6, 0x8d887e], -3.5);
  debris(c, 2.2, z1 + 0.2, x2 - 0.3, z2 - 0.2, Math.round(35 * usure), [COUL.bassin, 0xe6e2d6, 0x8d887e], -1);

  // Les échelles
  for (const [x, zb, s] of [[-11, z1, 1], [-11, z2, -1], [7, z1, 1], [7, z2, -1]]) echelle(k, x, zb, s);
  // L'escalier du petit bain, contre la paroi est
  for (let i = 0; i < 3; i++) {
    const xa = x2 - 0.45 * (i + 1);
    c.pave(xa, -1, -1.6, x2, -0.25 * (i + 1) + 0.0, 1.6, COUL.bassin, m.faience, { nuance: 0.02, crasse: false });
    c.pave(xa, -0.25 * (i + 1) - 0.02, -1.6, xa + 0.06, -0.25 * (i + 1) + 0.005, 1.6, COUL.ligne, m.lisse, PLAT);
  }
  for (const z of [-1.7, 1.7]) {
    c.tube([x2 + 0.3, 0.07, z], [x2 + 0.1, 0.95, z], 0.03, COUL.rampe, m.metal, 6);
    c.tube([x2 + 0.1, 0.95, z], [x2 - 1.2, -0.05, z], 0.03, COUL.rampe, m.metal, 6);
    c.tube([x2 - 1.2, -0.05, z], [x2 - 1.3, -0.95, z], 0.03, COUL.rampe, m.metal, 6);
  }
  // Les plaques de profondeur, sur la margelle
  for (const z of [z1 - 0.25, z2 + 0.25]) {
    panneau(c, m.enseignes, R.prof350, { x: x1 + 1.2, y: 0.075, z, rx: -Math.PI / 2 }, 0.42, 0.42);
    panneau(c, m.enseignes, R.prof100, { x: x2 - 1.2, y: 0.075, z, rx: -Math.PI / 2 }, 0.42, 0.42);
  }

  // Le grand bain : la vase, la flaque verte (eau de pluie), les feuilles mortes
  for (let i = 0; i < 7; i++) c.boite(c.entre(1, 2.6), 0.02, c.entre(0.8, 2), 0x5f5a45, { x: c.entre(x1 + 1, -5.5), y: -3.49, z: c.entre(z1 + 1, z2 - 1), ry: c.hasard() * 3 }, m.mat, { nuance: 0.1, crasse: false });
  flaqueVerte(k, -8.8, -2.6, 2.4 + usure * 1.4, -3.47);
  flaqueVerte(k, -5.8, 1.4, 0.9 + usure * 0.6, -3.47);
  for (let i = 0; i < 30 + 50 * usure; i++) {
    const s = c.entre(0.06, 0.2);
    c.boite(s, 0.008, s, [0x7a9a3a, 0x9c7a45, 0x5f7a3a][i % 3], { x: c.entre(-11.2, -6.6), y: -3.458, z: c.entre(-4.6, -0.6), ry: c.hasard() * 3 }, m.mat, { nuance: 0.1, crasse: false });
  }
  jonchee(c, x1 + 0.2, z1 + 0.2, -5.2, z2 - 0.2, Math.round(160 * usure), undefined, -3.485);
  jonchee(c, 2.2, z1 + 0.2, x2 - 0.2, z2 - 0.2, Math.round(110 * usure), undefined, -0.985);
  // Feuilles poussées dans l'angle des plages
  jonchee(c, x1 - 4, z1 - 3.5, x1 - 0.6, z1 - 0.6, Math.round(60 * usure), undefined, 0.035);

  // L'arbre qui pousse au fond du grand bain, soulevant le carrelage
  gravats(c, -9.8, -6.9, 1.4, Math.round(8 + 12 * usure), [0x6f5a3a, COUL.bassin, 0xe6e2d6, PALETTE.terre], -3.5);
  arbre(c, -9.8, -6.9, 6.5 + 4.5 * usure, "feuillu", -3.5);
  arbuste(c, -11.6, -1.5, 0.7 + usure * 0.5, -3.5, [0x5d7a40, 0x6f8a45, 0x4f6a3a]);
  touffes(c, Array.from({ length: Math.round(16 * usure) + 4 }, () => [c.entre(x1 + 0.2, -5.4), c.hasard() < 0.5 ? c.entre(z1 + 0.1, z1 + 0.6) : c.entre(z2 - 0.6, z2 - 0.1), -3.5]), 0x7f8f4a);
  mousse(c, -7.8, -3.5, 0.8, 1.6, Math.round(6 * usure) + 2);

  // Le drone maître-nageur, sur le flanc près de la flaque
  drone(k, -6.6, -1.4);
  // Graffitis sur la paroi nord du grand bain
  panneau(c, m.enseignes, R.graffiti, { x: -8.4, y: -2.25, z: z1 + 0.02 }, 7.2, 1.8);

  // Les obstacles : on ne descend pas dans le bassin (1 à 3,5 m de vide)
  const nat = "bassin vide (1 à 3,50 m)";
  k.b.obstacle(x1, z1, x2, z1, nat);
  k.b.obstacle(x2, z1, x2, z2, nat);
  k.b.obstacle(x2, z2, x1, z2, nat);
  k.b.obstacle(x1, z2, x1, z1, nat);
}

/** Une flaque d'eau de pluie verdâtre, irrégulière (même matière d'eau que l'atelier, teintée par les sommets). */
function flaqueVerte(k, x, z, rayon, y) {
  const { c, m } = k;
  const pts = [];
  const n = 11;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = rayon * c.entre(0.65, 1.1);
    pts.push(new THREE.Vector2(Math.cos(a) * r * 1.3, Math.sin(a) * r));
  }
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts)).rotateX(-Math.PI / 2);
  c.poser(g, m.eau, 0xa8d29a, { x, y, z }, PLAT);
  g.dispose();
}

/** Une échelle de bassin : deux mains courantes cintrées, des barreaux le long de la paroi. `s` : +1 paroi nord. */
function echelle(k, x, zb, s) {
  const { c, m } = k;
  const p = profondeur(x);
  for (const dx of [-0.28, 0.28]) {
    c.tube([x + dx, 0.07, zb - s * 0.45], [x + dx, 0.85, zb - s * 0.25], 0.028, COUL.rampe, m.metal, 6);
    c.tube([x + dx, 0.85, zb - s * 0.25], [x + dx, 0.75, zb + s * 0.12], 0.028, COUL.rampe, m.metal, 6);
    c.tube([x + dx, 0.75, zb + s * 0.12], [x + dx, -Math.min(p, 2.6), zb + s * 0.12], 0.028, COUL.rampe, m.metal, 6);
  }
  for (let y = -0.3; y > -Math.min(p, 2.6) + 0.1; y -= 0.3) {
    if (c.hasard() < 0.1 * k.usure) continue;
    c.boite(0.52, 0.035, 0.12, c.hasard() < 0.3 ? PALETTE.rouille : COUL.rampe, { x, y, z: zb + s * 0.08 }, m.metal, PLAT);
  }
}

/** Le drone maître-nageur d'AquaSmart, tombé sur le flanc au fond du grand bain. */
function drone(k, x, z) {
  const { c, m } = k;
  c.repere({ x, y: -3.5 + 0.38, z, ry: 0.6, rz: 1.05 }, () => {
    c.boite(0.7, 0.26, 0.7, COUL.drone, {}, m.satin, { crasse: false });
    c.boite(0.5, 0.06, 0.3, COUL.aqua, { y: 0.15 }, m.satin, PLAT);
    c.boite(0.16, 0.12, 0.08, 0x1e2124, { y: -0.08, z: 0.36 }, m.lisse, PLAT);
    for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      c.poutre([dx * 0.25, 0.05, dz * 0.25], [dx * 0.62, 0.08, dz * 0.62], 0.05, COUL.drone, m.satin);
      c.poser(geoCylindre(0.3, 0.025, 10), m.satin, 0x2a2d30, { x: dx * 0.62, y: 0.12, z: dz * 0.62, rx: dx > 0 && dz > 0 ? 0.6 : 0 }, PLAT);
    }
  });
  // la bouée qu'il portait, et des feuilles par-dessus
  c.poser(new THREE.TorusGeometry(0.3, 0.08, 5, 10), m.satin, COUL.bouee, { x: x + 1.1, y: -3.44, z: z + 0.5, rx: Math.PI / 2 }, { nuance: 0.03, crasse: false });
  jonchee(c, x - 0.6, z - 0.6, x + 0.6, z + 0.6, 14, undefined, -3.1);
}

// ---------- La nef : murs, baies, enseigne ----------

function nef(k) {
  const { c, m, usure } = k;
  const T = k.N;
  const brique = { couleur: COUL.brique, mat: m.brique, ep: EP };
  const fen = (u, l, bas, haut, extra = {}) => ({ u, l, bas, haut, type: "fenetre", croisillons: 2, traverses: 2, appui: false, cadre: COUL.cadre, matCadre: m.mat, bris: k.bris, ...extra });

  // Mur nord (le fond) : entier, toujours visible ; fenêtres hautes au-dessus des cabines
  const aN = [N.x2, N.z1];
  const bN = [N.x1, N.z1];
  mur(c, aN, bN, { ...brique, h: N.h, batiment: k.b, ouvertures: [5, 10, 24, 29].map((u) => fen(u, 2.2, 5.3, 6.5)), breches: usure > 0.6 ? [{ u: 26.5, l: 3, profondeur: 1.2 * usure }] : [] });
  bandes(aN, bN, EP, [
    { y1: 0, y2: 0.5, s: 0.05, couleur: COUL.betonGris, mat: m.beton, ch: c },
    { y1: 6.65, y2: 7.05, s: 0.3, couleur: COUL.beton, mat: m.beton, ch: c },
  ]);
  // L'enseigne AquaSmart, plaquée sur le fond au-dessus de la coursive
  panneau(c, m.enseignes, R.aquasmart, { x: 0, y: 6.05, z: N.z1 + EP / 2 + 0.02, rz: -0.03 }, 3.6, 1.8);
  c.poutre([-1.6, 6.9, N.z1 + 0.2], [-1.4, 5.2, N.z1 + 0.3], 0.03, COUL.acier, m.tole);

  // Mur sud (vers le hall et les ailes) : coupé ; fenêtres hautes au-dessus des toits des ailes
  const aS = [N.x1, N.z2];
  const bS = [N.x2, N.z2];
  murCoupe(k, T, aS, bS, {
    ...brique,
    h: N.h,
    ouvertures: [
      { u: 1.2, l: 1.2, bas: 0, haut: 2.3, type: "vide" },
      { u: 17, l: 3.0, bas: 0, haut: 3.0, type: "vide" },
      { u: 32.8, l: 1.2, bas: 0, haut: 2.3, type: "vide" },
      ...[3, 6.5, 10, 24, 27.5, 31].map((u) => fen(u, 1.8, 5.0, 6.3)),
    ],
  });
  bandes(aS, bS, EP, [{ y1: 6.65, y2: 7.05, s: 0.3, couleur: COUL.beton, mat: m.beton, ch: T }]);
  // Les vantaux des portes de la nef
  vantail(c, -1.5, N.z2 - 0.2, -2.0, 1.48, 2.9, COUL.cadre, m.tole, "cassee");
  vantail(c, 1.5, N.z2 - 0.2, Math.PI + 1.7, 1.48, 2.9, COUL.cadre, m.tole, "entiere");
  vantail(c, -16.4, N.z2 - 0.18, -1.3, 1.1, 2.2, COUL.porteJaune, m.satin);

  // Mur est (vers le solarium) : coupé, trois grandes baies
  const aE = [N.x2, N.z2];
  const bE = [N.x2, N.z1];
  const baies = [5, 11.75, 18.5];
  murCoupe(k, T, aE, bE, { ...brique, h: N.h, ouvertures: baies.map((u) => ({ u, l: 2.8, bas: 0, haut: 4.9, type: "vide" })), breches: usure > 0.5 ? [{ u: 15, l: 2.4, profondeur: 1.3 * usure }] : [] });
  bandes(aE, bE, EP, [
    { y1: 0, y2: 0.5, s: 0.05, couleur: COUL.betonGris, mat: m.beton, ch: c, trous: baies.map((u) => [u - 1.4, u + 1.4]) },
    { y1: 5.2, y2: 5.45, s: 0.08, couleur: COUL.beton, mat: m.beton, ch: T },
    { y1: 6.65, y2: 7.05, s: 0.3, couleur: COUL.beton, mat: m.beton, ch: T },
  ]);
  for (const z of [7.2, 0.1, -6.6, -13.4]) pilastre(k, T, N.x2 + EP / 2, z, Math.PI / 2, 7.05);
  for (const u of baies) baieVitree(k, N.x2, N.z2 - u, 2.8, 4.9);
  lierre(T, N.x2 + EP / 2 + 0.02, 0, -9.5, Math.PI / 2, 4, 5.5, Math.round(80 * usure));
  lierre(c, N.x2 + EP / 2 + 0.02, 0, -1.5, Math.PI / 2, 2.5, 1.0, Math.round(40 * usure));

  // Mur ouest (vers la salle des machines) : coupé, son haut va avec la salle des machines
  const aO = [N.x1, N.z1];
  const bO = [N.x1, N.z2];
  murCoupe(k, k.MA, aO, bO, { ...brique, h: N.h, ouvertures: [{ u: 8, l: 1.3, bas: 0, haut: 2.3, type: "vide" }] });
  vantail(c, N.x1 + 0.2, -7.65, Math.PI / 2 - 1.2, 1.25, 2.25, COUL.cadre, m.tole);

  // Les rais de lumière par les vitres manquantes, sur les plages
  rai(c, [6, 10.5, -11], [3.8, 0.05, -9.8], 1.6);
  rai(c, [10.5, 10.3, 5], [8.6, 0.05, 4.6], 1.4);
  // Gravats et débris de verre sur les plages
  gravats(c, 14, -10, 1, Math.round(6 + 10 * usure), [COUL.brique, COUL.beton, PALETTE.pierre], 0.03);
  debris(c, -16, -11, 16, 5.5, Math.round(80 * usure), [0x9fb7bc, COUL.plage, 0xc7d5d6], 0.03);
}

/** Une grande baie vitrée dans le mur est (couche de la nef) : montants, traverses, vitres hautes, portes basses. */
function baieVitree(k, x, zc, l, h) {
  const T = k.N;
  const { m } = k;
  const mat = m.tole;
  const z1 = zc - l / 2;
  const n = 3;
  for (let i = 0; i <= n; i++) T.pave(x - 0.05, CUT, z1 + (l * i) / n - 0.04, x + 0.05, h, z1 + (l * i) / n + 0.04, COUL.cadre, mat);
  for (const y of [2.4, 3.65, h - 0.08]) T.pave(x - 0.05, y, z1, x + 0.05, y + 0.08, z1 + l, COUL.cadre, mat);
  for (let i = 0; i < n; i++) {
    for (const [ya, yb] of [[2.48, 3.65], [3.73, h - 0.08]]) {
      if (T.hasard() < k.bris * 0.8) continue;
      T.boite(0.01, yb - ya - 0.04, l / n - 0.1, 0xffffff, { x, y: (ya + yb) / 2, z: z1 + (l * (i + 0.5)) / n }, m.verre, PLAT);
    }
  }
}

// ---------- Les cabines ----------

/**
 * Une rangée de `n` cabines de x1 à x2, fond en zF, devant (portes) en zD, posée à y0 sur une hauteur h.
 * `ch` : le chantier ; `num` : premier numéro (ou null) ; `obstacles` : au rez-de-chaussée seulement.
 */
function cabines(k, ch, x1, x2, zF, zD, y0, h, n, couleurPorte, mat, num = null, obstacles = false) {
  const { m, usure } = k;
  const w = (x2 - x1) / n;
  const s = Math.sign(zD - zF);
  const lp = Math.min(0.8, w - 0.4);
  for (let i = 0; i <= n; i++) {
    const xa = x1 + i * w;
    ch.pave(xa - 0.03, y0 + 0.12, zF, xa + 0.03, y0 + h, zD, COUL.cabine, mat, { nuance: 0.03 });
    if (obstacles) k.b.obstacle(xa, zF, xa, zD, "cloison de cabine");
  }
  for (let i = 0; i < n; i++) {
    const xa = x1 + i * w;
    const xb = xa + w;
    const xp = xb - lp - 0.04; // la charnière
    ch.pave(xa, y0 + 0.12, zD - 0.03, xp, y0 + h, zD + 0.03, COUL.cabine, mat, { nuance: 0.03 });
    if (h > 2.2) ch.pave(xp, y0 + 2.12, zD - 0.03, xb, y0 + h, zD + 0.03, COUL.cabine, mat, { nuance: 0.03 });
    if (obstacles) k.b.obstacle(xa, zD, xp, zD, "cabine");
    // la porte : ouverte, fermée, tombée ou disparue
    const r = ch.hasard();
    if (r < 0.12 + 0.1 * usure) {
      // disparue (brûlée par des survivants)
    } else if (r < 0.26 + 0.12 * usure) {
      ch.boite(lp, 0.04, 1.95, couleurPorte, { x: xp + lp / 2 + ch.entre(-0.2, 0.2), y: y0 + 0.05, z: zD + s * 1.1, ry: ch.entre(-0.4, 0.4) }, mat, { nuance: 0.06 });
    } else {
      const ang = r < 0.75 ? ch.entre(0.7, 1.6) : 0;
      ch.repere({ x: xp, y: y0 + 0.15, z: zD + s * 0.03, ry: -s * ang }, () => {
        ch.pave(0, 0, -0.02, lp, 1.95, 0.02, couleurPorte, mat, { nuance: 0.06 });
        ch.pave(0.1, 1.5, 0.015 * s, lp - 0.1, 1.85, 0.03 * s, 0x6a5a48, mat, { nuance: 0.05 });
      });
      if (obstacles && ang === 0) k.b.obstacle(xp, zD, xb, zD, "porte de cabine fermée");
    }
    // le banc, une serviette oubliée
    ch.pave(xa + 0.1, y0 + 0.42, zF + s * 0.05, xb - 0.1, y0 + 0.47, zF + s * 0.42, COUL.bois, mat, { nuance: 0.06 });
    if (ch.hasard() < 0.25) ch.boite(0.4, 0.7, 0.03, [COUL.serviette, 0x9fb8c4, 0xb59a7a][i % 3], { x: xa + 0.08, y: y0 + 1.25, z: zF + s * 0.8, ry: Math.PI / 2, rz: 0.1 }, ch === k.c ? m.toile : mat, { nuance: 0.06, crasse: false });
    if (num !== null) panneau(ch, m.enseignes, caseNumero(num + i), { x: (xa + xp) / 2, y: y0 + 1.75, z: zD + s * 0.045, ry: s > 0 ? 0 : Math.PI }, 0.22, 0.22);
  }
}

function cabinesNef(k) {
  const { c, m, usure } = k;
  const T = k.N;
  const zF = N.z1 + EP / 2;
  // Rangée nord, rez-de-chaussée (visitable) : portes jaunes numérotées
  cabines(k, c, -14, 16.5, zF, -12.5, 0, 2.3, 23, COUL.porteJaune, m.satin, 1, true);
  // La coursive et les cabines du haut (couche de la nef : inaccessibles)
  const yC = 2.45;
  T.pave(-14.2, yC, zF, 16.6, yC + 0.2, -11.3, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
  T.pave(-14.2, yC - 0.1, -11.45, 16.6, yC + 0.25, -11.25, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
  cabines(k, T, -14, 16.5, zF, -12.5, yC + 0.2, 2.15, 23, COUL.porteBleue, m.mat);
  T.pave(-14.2, 4.95, zF, 16.6, 5.1, -12.35, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
  // Le garde-corps de la coursive : poteaux, main courante, lisses
  const yG = yC + 0.2;
  for (let x = -14; x <= 16.6; x += 1.27) T.boite(0.05, 1.0, 0.05, COUL.acier, { x, y: yG + 0.5, z: -11.35 }, m.tole);
  const tronçons = usure > 0.4 ? [[-14, 3.2], [5.2, 16.6]] : [[-14, 16.6]];
  for (const [xa, xb] of tronçons) {
    T.pave(xa, yG + 0.98, -11.39, xb, yG + 1.04, -11.31, COUL.acier, m.tole);
    for (const yy of [0.3, 0.55]) T.pave(xa, yG + yy, -11.37, xb, yG + yy + 0.03, -11.33, COUL.acier, m.tole);
  }
  if (usure > 0.4) T.poutre([3.2, yG + 1.0, -11.35], [4.4, yG - 1.2, -11.0], 0.05, COUL.acier, m.tole);
  // Les poteaux qui portent la coursive (au sol, visibles)
  for (let x = -13.4; x < 16.6; x += 3.75) {
    c.pave(x - 0.15, 0, -11.5, x + 0.15, yC, -11.2, COUL.beton, m.beton, { nuance: 0.02 });
    rect(k, x - 0.15, -11.5, x + 0.15, -11.2, "poteau");
  }
  // Les projecteurs des « vagues virtuelles », accrochés au garde-corps, braqués sur le fond
  for (const x of [-7, 1, 9]) {
    T.repere({ x, y: yG + 1.2, z: -11.1, rx: 0.7 }, () => {
      T.boite(0.45, 0.32, 0.6, 0xe6e3da, {}, m.mat);
      T.boite(0.22, 0.22, 0.05, 0x1e2124, { z: 0.31 }, m.tole);
    });
  }
  // L'escalier de la coursive, contre le mur est : le haut s'est effondré
  const marches = 12;
  for (let i = 0; i < marches; i++) {
    const y = (i + 1) * (yC / marches);
    const z = -6 - (i + 0.5) * (5.3 / marches);
    if (i >= 6 && i <= 8 + (usure > 0.6 ? 1 : 0)) continue;
    (y < CUT ? c : T).pave(15.6, y - 0.18, z - 0.24, 16.82, y, z + 0.24, COUL.beton, m.beton, { nuance: 0.03 });
  }
  gravats(c, 16.1, -8.6, 0.9, 10, [COUL.beton, COUL.betonGris, COUL.brique], 0.03);
  k.b.obstacle(15.6, -6, 15.6, -11.3, "escalier effondré");
  k.b.obstacle(15.6, -6, 16.82, -6, "escalier effondré");
  // Rangées sud (un seul niveau), de part et d'autre du passage du hall
  const zFs = N.z2 - EP / 2;
  cabines(k, c, -14.5, -3.2, zFs, 6, 0, 2.3, 9, COUL.porteJaune, m.satin, null, true);
  cabines(k, c, 3.2, 14.5, zFs, 6, 0, 2.3, 9, COUL.porteJaune, m.satin, null, true);
  for (const [xa, xb] of [[-14.6, -3.1], [3.1, 14.6]]) T.pave(xa, 2.35, 5.9, xb, 2.5, zFs, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
  // La plaque de l'infirmerie, au bout des cabines sud
  panneau(c, m.enseignes, R.infirmerie, { x: 14.54, y: 1.75, z: 7.2, ry: Math.PI / 2 }, 0.9, 0.34);
  panneau(c, m.enseignes, R.douches, { x: -14.54, y: 1.75, z: 7.2, ry: -Math.PI / 2 }, 0.9, 0.34);
}

// ---------- La verrière en berceau ----------

function verriere(k) {
  const { c, m, usure } = k;
  const T = k.N;
  const { R: Rv, zc, yc, theta } = VOUTE;
  const NS = 12;
  const nbBaies = 10;
  const pasX = (N.x2 - N.x1) / nbBaies;
  const nd = (s) => {
    const p = -theta + (2 * theta * s) / NS;
    return { p, z: zc + Rv * Math.sin(p), y: yc + Rv * Math.cos(p) };
  };
  // Le trou : un pan tombé dans le bassin
  const baiesTrou = usure > 0.6 ? [3, 4, 5] : usure > 0.25 ? [4, 5] : [];
  const segTrou = (s) => s >= 3 && s <= 6;
  const dansTrou = (bi, s) => baiesTrou.includes(bi) && segTrou(s);
  const acier = COUL.acier;
  // Les arcs
  for (let i = 0; i <= nbBaies; i++) {
    const x = N.x1 + i * pasX;
    for (let s = 0; s < NS; s++) {
      const casse = baiesTrou.includes(i) && baiesTrou.includes(i - 1) && segTrou(s);
      if (casse) continue;
      const a = nd(s);
      const b = nd(s + 1);
      T.poutre([x, a.y, a.z], [x, b.y, b.z], 0.16, acier, m.tole);
    }
    // les tirants qui tiennent l'écartement
    if (i % 2 === 0 && i > 0 && i < nbBaies && !baiesTrou.includes(i)) T.poutre([x, N.h - 0.1, N.z1], [x, N.h - 0.1, N.z2], 0.05, acier, m.tole);
  }
  // Les pannes et les vitres
  const pManque = 0.08 + 0.42 * usure;
  for (let bi = 0; bi < nbBaies; bi++) {
    const xa = N.x1 + bi * pasX;
    const xm = xa + pasX / 2;
    for (let s = 0; s <= NS; s++) {
      if (dansTrou(bi, s) && dansTrou(bi, s - 1)) continue;
      const a = nd(s);
      T.boite(pasX, 0.1, 0.1, acier, { x: xm, y: a.y + 0.02, z: a.z, rx: a.p }, m.tole);
    }
    for (let s = 0; s < NS; s++) {
      if (dansTrou(bi, s)) continue;
      if (T.hasard() < pManque) continue;
      const pm = -theta + (2 * theta * (s + 0.5)) / NS;
      const r2 = Rv + 0.06;
      const lg = 2 * Rv * Math.sin(theta / NS) - 0.08;
      T.boite(pasX - 0.12, 0.02, lg, T.hasard() < 0.25 ? 0xd9e4e2 : 0xffffff, { x: xm, y: yc + r2 * Math.cos(pm), z: zc + r2 * Math.sin(pm), rx: pm }, m.verre, PLAT);
    }
  }
  // Des bouts d'arc tordus qui pendent au bord du trou
  if (baiesTrou.length) {
    for (const i of [baiesTrou[0], baiesTrou[baiesTrou.length - 1] + 1]) {
      const x = N.x1 + i * pasX;
      for (const s of [3, 7]) {
        const a = nd(s);
        T.poutre([x, a.y, a.z], [x + c.entre(-0.6, 0.6), a.y - c.entre(1.2, 2.4), a.z + (s === 3 ? 0.8 : -0.8)], 0.12, acier, m.tole);
      }
    }
    // Le pan tombé : arcs pliés couchés dans le bassin, vitres en miettes
    const xT = N.x1 + (baiesTrou[0] + baiesTrou.length / 2) * pasX;
    for (let j = 0; j < 3; j++) {
      const x = xT - 2.4 + j * 2.2;
      const yb = -profondeur(x);
      c.poutre([x, yb + 0.1, -7.2 + j * 0.6], [x + 0.6, yb + 1.6, -3.4 + j * 0.4], 0.14, PALETTE.rouille, m.tole);
      c.poutre([x + 0.6, yb + 1.6, -3.4 + j * 0.4], [x + 1.0, 0.15, B.z1 + 0.02], 0.14, PALETTE.rouille, m.tole);
    }
    for (let j = 0; j < 7; j++) {
      const x = xT + c.entre(-3.5, 3.5);
      c.boite(c.entre(0.8, 1.6), 0.02, c.entre(0.6, 1.2), 0xd9e4e2, { x, y: -profondeur(x) + 0.08, z: c.entre(-7.5, -1), ry: c.hasard() * 3, rz: c.entre(-0.3, 0.3) }, m.verre, PLAT);
    }
    debris(c, xT - 4, -8.5, xT + 4, 0, 60, [0xc7d5d6, 0x9fb7bc, 0xe6eeee], -profondeur(xT));
    gravats(c, xT + 0.6, -4.5, 1.6, Math.round(10 + 14 * usure), [COUL.bassin, PALETTE.rouille, 0xc7d5d6, COUL.beton], -profondeur(xT + 0.6));
    // La lumière qui tombe par le trou
    rai(c, [xT - 1.5, 11.2, -4.8], [xT - 3.4, -2.6, -2.2], 3.4);
    rai(c, [xT + 2.2, 11.0, -3], [xT + 0.6, -1.6, -0.6], 2.4);
  }
  // Les pignons : à l'est, une lunette vitrée ; à l'ouest, plein (brique)
  const bandeL = 0.8;
  for (const [x, lunette] of [[N.x2, true], [N.x1, false]]) {
    for (let z = N.z1; z < N.z2 - 0.01; z += bandeL) {
      const zb = Math.min(z + bandeL, N.z2);
      const haut = arcY((z + zb) / 2) + 0.1;
      const central = lunette && Math.abs((z + zb) / 2 - zc) < 6.6;
      if (!central) {
        T.pave(x - EP / 2, N.h, z, x + EP / 2, haut, zb, COUL.brique, m.brique, { nuance: 0.02, crasse: false });
        continue;
      }
      T.pave(x - EP / 2, N.h, z, x + EP / 2, N.h + 0.5, zb, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
      T.pave(x - EP / 2, haut - 0.7, z, x + EP / 2, haut, zb, COUL.brique, m.brique, { nuance: 0.02, crasse: false });
      T.pave(x - 0.04, N.h + 0.5, z - 0.03, x + 0.04, haut - 0.7, z + 0.03, COUL.cadre, m.tole);
      if (T.hasard() > k.bris * 0.7) T.boite(0.01, haut - 0.7 - N.h - 0.5, bandeL - 0.08, 0xffffff, { x, y: (N.h + 0.5 + haut - 0.7) / 2, z: (z + zb) / 2 }, m.verre, PLAT);
    }
    // l'imposte de la lunette : une traverse
    if (lunette) T.pave(x - 0.04, 9.2, zc - 6.6, x + 0.04, 9.3, zc + 6.6, COUL.cadre, m.tole);
  }
  // Le faîtage : un lanterneau d'aération sur toute la longueur
  T.pave(N.x1, arcY(zc) + 0.05, zc - 0.5, N.x2, arcY(zc) + 0.45, zc + 0.5, COUL.acier, m.tole);
}

// ---------- Le grand plongeoir ----------

function plongeoir(k) {
  const { c, m } = k;
  const zc = -3.25;
  const xe = -15.0; // la face est du fût
  // Le fût à redents
  c.pave(-16.8, 0, zc - 0.95, -14.85, 3.0, zc + 0.95, COUL.beton, m.beton, { nuance: 0.02 });
  c.pave(-16.7, 3.0, zc - 0.8, -15.0, 5.3, zc + 0.8, COUL.beton, m.beton, { nuance: 0.02 });
  c.pave(-16.6, 5.3, zc - 0.65, -15.15, 8.0, zc + 0.65, COUL.beton, m.beton, { nuance: 0.02 });
  for (const s of [-1, 1]) {
    c.pave(-16.5, 0, zc + s * 0.95, -15.4, 6.2, zc + s * 1.12, COUL.beton, m.beton, { nuance: 0.03 });
    c.pave(-16.35, 0, zc + s * 1.12, -15.6, 4.2, zc + s * 1.26, COUL.beton, m.beton, { nuance: 0.03 });
  }
  // Les trois plateformes en porte-à-faux, chacune avec sa console
  const plates = [[3.0, -12.0], [5.3, -11.1], [8.0, -9.8]];
  for (const [y, xb] of plates) {
    c.pave(xe - 0.2, y - 0.24, zc - 0.9, xb, y, zc + 0.9, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
    c.pave(xb - 0.05, y - 0.02, zc - 0.85, xb, y + 0.01, zc + 0.85, 0x6f8f80, m.lisse, PLAT);
    // la console sous le plateau
    const lg = Math.hypot(xb + 0.4 - xe, 1.3);
    c.boite(lg, 0.3, 0.6, COUL.beton, { x: (xe + xb + 0.4) / 2, y: y - 0.85, z: zc, rz: Math.atan2(1.3, xb + 0.4 - xe) }, m.beton, { nuance: 0.02, crasse: false });
    // les garde-corps (on ne passe que par le bout)
    for (const s of [-1, 1]) {
      const zr = zc + s * 0.85;
      for (let x = xe; x <= xb - 1.1; x += 0.9) c.tube([x, y, zr], [x, y + 1.0, zr], 0.025, COUL.rampe, m.metal, 5);
      c.tube([xe, y + 1.0, zr], [xb - 1.1, y + 1.0, zr], 0.03, COUL.rampe, m.metal, 5);
      c.tube([xb - 1.1, y + 1.0, zr], [xb - 0.6, y + 0.1, zr], 0.03, COUL.rampe, m.metal, 5);
    }
  }
  // L'échelle de service sur la face nord du fût
  for (const dx of [-0.3, 0.3]) c.tube([-15.9 + dx, 0, zc - 1.3], [-15.9 + dx, 8.0, zc - 1.3], 0.03, COUL.rampe, m.metal, 5);
  for (let y = 0.3; y < 8; y += 0.32) c.boite(0.6, 0.03, 0.03, COUL.rampe, { x: -15.9, y, z: zc - 1.3 }, m.metal, PLAT);
  // La chaîne et la plaque de l'option premium, le médaillon du poisson
  panneau(c, m.enseignes, R.plongeon, { x: -15.9, y: 1.55, z: zc + 1.27 }, 0.48, 0.6);
  panneau(c, m.enseignes, R.poisson, { x: xe + 0.16, y: 1.55, z: zc, ry: Math.PI / 2 }, 1.5, 1.5);
  c.tube([-16.2, 1.0, zc - 1.25], [-15.6, 0.7, zc - 1.25], 0.02, 0x4a4a46, m.metal, 4);
  rect(k, -16.85, zc - 1.3, -14.85, zc + 1.3, "plongeoir");
}

// ---------- Le hall ----------

function hall(k) {
  const { c, m, usure } = k;
  const T = k.H;
  const brique = { couleur: COUL.brique, mat: m.brique, ep: EP };
  const dado = { couleur: COUL.faienceHall, mat: m.faience };
  const fz = 15 + EP / 2;
  // La façade
  const aF = [-6, 15];
  const bF = [6, 15];
  murCoupe(k, T, aF, bF, {
    ...brique,
    h: 6.2,
    dado,
    ouvertures: [
      { u: 6, l: 3.4, bas: 0, haut: 3.2, type: "vide" },
      { u: 1.75, l: 1.5, bas: CUT, haut: 3.0, type: "fenetre", croisillons: 2, traverses: 3, appui: true, cadre: COUL.cadre, matCadre: m.mat, bris: k.bris },
      { u: 10.25, l: 1.5, bas: CUT, haut: 3.0, type: "fenetre", croisillons: 2, traverses: 3, appui: true, cadre: COUL.cadre, matCadre: m.mat, bris: k.bris },
    ],
  });
  bandes(aF, bF, EP, [
    { y1: 0, y2: 0.6, s: 0.06, couleur: COUL.betonGris, mat: m.beton, ch: c, trous: [[4.3, 7.7]] },
    { y1: 3.25, y2: 3.45, s: 0.08, couleur: COUL.beton, mat: m.beton, ch: T },
  ]);
  // Murs est (vers le local du chlore) et ouest (vers les bains-douches)
  murCoupe(k, T, [6, 15], [6, N.z2], { ...brique, h: 6.2, dado, ouvertures: [{ u: 1.5, l: 1.0, bas: 0, haut: 2.2, type: "vide" }] });
  murCoupe(k, k.BD, [-6, N.z2], [-6, 15], { ...brique, h: 6.2, dado, ouvertures: [{ u: 0.9, l: 1.0, bas: 0, haut: 2.2, type: "vide" }] });
  vantail(c, 5.83, 13.0, Math.PI / 2 + 1.3, 0.95, 2.15, COUL.porteBleue, m.satin);
  // Le toit-terrasse, crevé
  const trou = usure > 0.35 ? { x1: -3.4, x2: -0.8, z1: 9.6, z2: 11.8 } : null;
  const toit = (x1, z1, x2, z2) => T.pave(x1, 6.2, z1, x2, 6.45, z2, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
  if (trou) {
    toit(-6.2, N.z2, trou.x1, 15.2);
    toit(trou.x2, N.z2, 6.2, 15.2);
    toit(trou.x1, N.z2, trou.x2, trou.z1);
    toit(trou.x1, trou.z2, trou.x2, 15.2);
    gravats(c, -2.1, 10.7, 1.1, Math.round(8 + 10 * usure), [COUL.beton, COUL.betonGris, PALETTE.pierre], 0.03);
    rai(c, [-2.1, 6.4, 10.7], [-3.2, 0.05, 12.2], 2.0);
    for (let i = 0; i < 5; i++) T.poutre([c.entre(trou.x1, trou.x2), 6.25, trou.z1], [c.entre(trou.x1, trou.x2), c.entre(5.2, 5.8), trou.z1 + c.entre(0.2, 0.6)], 0.03, PALETTE.rouille, m.mat);
  } else toit(-6.2, N.z2, 6.2, 15.2);
  mousse(T, 3, 6.45, 11, 1.8, Math.round(8 * usure));
  semerTouffes(T, -6, N.z2, 6, 15, Math.round(20 * usure), PALETTE.herbeSeche, 6.45);

  // Le fronton à gradins, les lettres, l'horloge
  T.pave(-6.3, 6.2, 14.75, 6.3, 7.7, fz + 0.22, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
  T.pave(-6.45, 7.62, 14.7, 6.45, 7.78, fz + 0.32, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
  T.pave(-4.3, 7.7, 14.8, 4.3, 8.9, fz + 0.16, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
  T.pave(-2.5, 8.9, 14.85, 2.5, 10.2, fz + 0.12, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
  T.pave(-1.1, 10.2, 14.9, 1.1, 10.9, fz + 0.08, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
  for (const s of [-1, 1]) {
    for (const [x, y1, y2] of [[3.6, 7.7, 9.4], [1.8, 8.9, 10.7]]) T.pave(s * x - 0.18, y1, fz, s * x + 0.18, y2, fz + 0.3, COUL.beton, m.beton, { nuance: 0.03, crasse: false });
  }
  panneau(T, m.enseignes, R.fronton, { x: 0, y: 6.95, z: fz + 0.24 }, 10.8, 1.01);
  panneau(T, m.enseignes, R.horloge, { x: 0, y: 9.55, z: fz + 0.14 }, 1.22, 1.22);
  // L'antenne de l'Abondance plantée sur le fronton
  T.tube([0, 10.9, 15], [0, 12.4, 15], 0.04, COUL.acier, m.mat, 5);
  T.boite(0.5, 0.5, 0.06, 0xe6e3da, { x: 0.2, y: 12.1, z: 15.1, ry: 0.5, rx: -0.3 }, m.mat);
  // Les pilastres à redents
  // (les pilastres du milieu s'arrêtent sous le bandeau des lettres et reprennent au-dessus en pinacles)
  for (const [x, h] of [[-6.05, 7.7], [-2.45, 5.25], [2.45, 5.25], [6.05, 7.7]]) pilastre(k, T, x, fz, 0, h);
  for (const x of [-2.45, 2.45]) {
    T.pave(x - 0.31, 7.78, fz, x + 0.31, 9.4, fz + 0.36, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
    T.pave(x - 0.15, 7.78, fz, x + 0.15, 10.0, fz + 0.48, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
  }
  // Les bas-reliefs des nageuses et leurs cadres
  for (const s of [-1, 1]) {
    panneau(T, m.enseignes, R.nageuses, { x: s * 4.25, y: 4.55, z: fz + 0.04 }, 2.9, 1.45);
    T.pave(s * 4.25 - 1.55, 5.28, fz - 0.02, s * 4.25 + 1.55, 5.42, fz + 0.12, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
  }
  // La marquise et l'enseigne AquaSmart posée dessus
  T.pave(-2.9, 3.35, fz, 2.9, 3.55, 16.9, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
  T.pave(-2.95, 3.28, 16.82, 2.95, 3.62, 16.95, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
  for (const s of [-1, 1]) T.poutre([s * 2.6, 5.6, fz + 0.05], [s * 2.6, 3.55, 16.7], 0.04, COUL.acier, m.mat);
  panneau(T, m.enseignes, R.aquasmart, { x: 0.1, y: 4.25, z: 16.45, rz: 0.05 }, 2.5, 1.25);
  for (const x of [-1.0, 1.1]) T.pave(x - 0.03, 3.55, 16.4, x + 0.03, 3.8, 16.44, COUL.acier, m.mat);
  // Les portes du hall : châssis et imposte (couche), vantaux (au sol)
  for (const x of [-1.7, -0.57, 0.57, 1.7]) T.pave(x - 0.05, CUT, 15.0, x + 0.05, 3.2, 15.12, COUL.cadre, m.mat);
  T.pave(-1.7, 2.55, 15.0, 1.7, 2.65, 15.12, COUL.cadre, m.mat);
  if (usure < 0.8) T.boite(3.3, 0.5, 0.01, 0xffffff, { x: 0, y: 2.9, z: 15.06 }, m.verre, PLAT);
  vantail(c, -1.7, 15.2, -1.25, 1.1, 2.5, COUL.cadre, m.tole, "cassee");
  c.boite(1.1, 0.05, 2.45, COUL.cadre, { x: -0.1, y: 0.06, z: 13.9, ry: 0.2 }, m.tole);
  vantail(c, 0.6, 15.08, 0, 1.1, 2.5, COUL.cadre, m.tole, usure > 0.5 ? "cassee" : "entiere");
  c.pave(-3, 0, fz, 3, 0.06, 16.9, COUL.betonGris, m.beton, { nuance: 0.02 });
  lierre(T, -5.4, 0, fz + 0.05, 0, 1.6, 5.5, Math.round(70 * usure));
  lierre(c, 5.6, 0, fz + 0.05, 0, 1.2, 1.1, Math.round(30 * usure));

  // --- L'intérieur ---
  // La mosaïque du poisson au sol, au milieu du hall
  panneau(c, m.enseignes, R.poisson, { x: 0, y: 0.035, z: 12.6, rx: -Math.PI / 2 }, 2.6, 2.6);
  // La caisse : comptoir, vitres, caisse enregistreuse, lanterne
  const xc1 = 2.6;
  const xc2 = 5.8;
  const zc1 = 9.4;
  const zc2 = 12.2;
  c.pave(xc1, 0, zc1, xc1 + 0.3, 1.1, zc2, COUL.bois, m.satin, { nuance: 0.03 });
  c.pave(xc1, 0, zc2 - 0.3, xc2 - 1.0, 1.1, zc2, COUL.bois, m.satin, { nuance: 0.03 });
  c.pave(xc1 - 0.1, 1.1, zc1 - 0.05, xc1 + 0.4, 1.16, zc2 + 0.05, PALETTE.marbre, m.lisse, { crasse: false });
  c.pave(xc1, 1.1, zc2 - 0.35, xc2 - 1.0, 1.16, zc2 + 0.05, PALETTE.marbre, m.lisse, { crasse: false });
  for (const z of [zc1, zc1 + 1.4, zc2]) c.pave(xc1 + 0.1, 1.16, z - 0.03, xc1 + 0.16, 2.3, z + 0.03, COUL.cadre, m.tole);
  c.pave(xc1 + 0.1, 2.25, zc1, xc1 + 0.16, 2.31, zc2, COUL.cadre, m.tole);
  if (usure < 0.7) c.boite(0.01, 1.0, 1.3, 0xffffff, { x: xc1 + 0.13, y: 1.7, z: zc1 + 0.7 }, m.verre, PLAT);
  c.boite(0.01, 1.0, 1.3, 0xffffff, { x: xc1 + 0.13, y: 1.7, z: zc1 + 2.1, rz: 0.04 }, m.verre, PLAT);
  c.pave(xc1 + 0.6, 0, zc1 + 0.2, xc2 - 0.1, 0.8, zc1 + 0.8, COUL.bois, m.satin, { nuance: 0.03 });
  c.pave(4.0, 1.16, 11.3, 4.45, 1.42, 11.75, 0x3a3836, m.tole);
  c.boite(0.35, 0.06, 0.3, 0x3a3836, { x: 4.2, y: 1.2, z: 12.0, rx: 0.2 }, m.tole);
  c.tube([4.3, 1.16, 10.5], [4.3, 1.42, 10.5], 0.1, 0x6a5a48, m.metal, 6);
  c.poser(geoCylindre(0.07, 0.14, 6), m.lisse, 0xffd27a, { x: 4.3, y: 1.5, z: 10.5 }, PLAT);
  c.boite(0.4, 0.45, 0.4, 0x5a4130, { x: 4.9, y: 0.25, z: 10.8, ry: 0.4 }, m.satin);
  panneau(c, m.enseignes, R.tarifs, { x: 3.9, y: 0.62, z: zc2 + 0.02 }, 0.9, 0.9);
  rect(k, xc1, zc1, xc2, zc2, "comptoir de la caisse");
  // Les tourniquets, la barrière (le tourniquet du milieu a perdu ses bras)
  const zt = 11.4;
  for (const [x, bras] of [[-1.9, true], [-0.6, false], [0.7, true]]) {
    c.pave(x - 0.14, 0, zt - 0.3, x + 0.14, 0.95, zt + 0.3, 0x9aa0a2, m.metal, { nuance: 0.03 });
    if (bras) for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.3;
      c.poutre([x + 0.16, 0.9, zt], [x + 0.16 + 0.5 * Math.abs(Math.cos(a)) + 0.1, 0.9 + 0.45 * Math.sin(a), zt + 0.5 * Math.cos(a)], 0.035, 0x9aa0a2, m.metal);
    }
  }
  c.poutre([-0.3, 0.05, 12.3], [0.2, 0.06, 12.6], 0.035, 0x9aa0a2, m.metal);
  for (const [xa, xb] of [[-5.6, -2.05], [1.4, 2.6]]) {
    for (let x = xa; x <= xb + 0.01; x += (xb - xa) / Math.max(1, Math.round((xb - xa) / 1.2))) c.tube([x, 0, zt], [x, 1.0, zt], 0.03, 0x9aa0a2, m.metal, 5);
    c.tube([xa, 1.0, zt], [xb, 1.0, zt], 0.03, 0x9aa0a2, m.metal, 5);
    c.tube([xa, 0.55, zt], [xb, 0.55, zt], 0.025, 0x9aa0a2, m.metal, 5);
    k.b.obstacle(xa, zt, xb, zt, "barrière");
  }
  k.b.obstacle(-2.05, zt, -1.0, zt, "tourniquet");
  k.b.obstacle(0.4, zt, 1.4, zt, "tourniquet");
  // Les casiers à vêtements, contre le mur ouest
  const xcas = -5.83;
  for (let i = 0; i < 10; i++) {
    const z = 9.9 + i * 0.5;
    c.pave(xcas, 0, z, xcas + 0.5, 1.9, z + 0.48, 0x6f8f7a, m.tole, { nuance: 0.04 });
    for (const [y1, y2] of [[0.1, 0.92], [0.98, 1.8]]) {
      const r = c.hasard();
      if (r < 0.25) continue; // porte arrachée
      const ouverte = r < 0.7;
      c.repere({ x: xcas + 0.51, y: y1, z: z + 0.02, ry: ouverte ? -c.entre(0.9, 1.9) : 0 }, () => {
        c.pave(0, 0, 0, 0.03, y2 - y1, 0.44, 0x7d9c86, m.tole, { nuance: 0.05 });
      });
    }
    if (c.hasard() < 0.3) c.boite(0.4, 0.3, 0.25, [0x2f3a4c, 0x7a2630, 0x5b6b3a][i % 3], { x: xcas + 0.9, y: 0.15, z: z + 0.2, ry: c.hasard() * 3 }, m.toile, { nuance: 0.05 });
  }
  k.b.obstacle(xcas + 0.5, 9.9, xcas + 0.5, 14.9, "casiers");
  // La borne AquaSmart (son écran luit encore) et les bracelets jetés par terre
  c.pave(-3.6, 0, 12.75, -3.2, 1.05, 13.05, 0xe6e3da, m.satin, { nuance: 0.02 });
  c.boite(0.5, 0.36, 0.08, 0xe6e3da, { x: -3.4, y: 1.2, z: 13.02, rx: -0.35 }, m.satin);
  panneau(c, m.neon, R.borne, { x: -3.4, y: 1.21, z: 13.07, rx: -0.35 }, 0.42, 0.26);
  for (let i = 0; i < 9; i++) c.poser(new THREE.TorusGeometry(0.045, 0.012, 3, 7), m.satin, [COUL.aqua, 0xe6e3da, 0x2a2d30][i % 3], { x: c.entre(-4.6, -2.2), y: 0.04, z: c.entre(12.3, 14), rx: Math.PI / 2 }, PLAT);
  // Le chevalet « bracelet obligatoire »
  c.repere({ x: 1.8, y: 0, z: 13.6, ry: -0.3 }, () => {
    panneau(c, m.enseignes, R.bracelet, { y: 0.65, z: 0.15, rx: -0.2 }, 0.7, 0.7);
    for (const s of [-1, 1]) c.poutre([s * 0.36, 0, 0.32], [s * 0.36, 1.0, 0.1], 0.03, COUL.acier, m.tole);
    c.poutre([0.36, 0, -0.15], [0.36, 1.0, 0.1], 0.03, COUL.acier, m.tole);
  });
  // Un banc, une plante morte, les feuilles
  c.pave(-2.6, 0.42, 14.2, -0.6, 0.48, 14.6, COUL.bois, m.satin, { nuance: 0.04 });
  for (const x of [-2.4, -0.8]) c.pave(x - 0.04, 0, 14.25, x + 0.04, 0.42, 14.55, COUL.acier, m.tole);
  c.tube([4.8, 0, 14.3], [4.8, 0.6, 14.3], 0.25, 0x6f5a48, m.mat, 7);
  for (let i = 0; i < 4; i++) c.poutre([4.8, 0.6, 14.3], [4.8 + c.entre(-0.6, 0.6), c.entre(1.2, 1.8), 14.3 + c.entre(-0.6, 0.3)], 0.03, 0x6a5a48, m.mat);
  jonchee(c, -5.5, 12.6, 5.5, 14.9, Math.round(80 * usure), undefined, 0.035);
  debris(c, -5.5, 9, 2.4, 14.8, Math.round(40 * usure), [COUL.beton, COUL.faienceHall, 0xd9d2c0], 0.03);
}

// ---------- Les bains-douches ----------

function bainsDouches(k) {
  const { c, m, usure } = k;
  const T = k.BD;
  const brique = { couleur: COUL.brique, mat: m.brique, ep: EP };
  const dado = { couleur: COUL.faienceBlanche, mat: m.faience };
  const aS = [N.x1, 15];
  const bS = [-6, 15];
  murCoupe(k, T, aS, bS, {
    ...brique,
    h: 4.5,
    dado,
    ouvertures: [
      { u: 2, l: 1.2, bas: CUT, haut: 2.7, type: "vide" },
      { u: 5, l: 1.2, bas: CUT, haut: 2.7, type: "vide" },
      { u: 8, l: 1.6, bas: 0, haut: 2.5, type: "vide" },
    ],
  });
  for (const u of [2, 5]) fenetreCondamnee(T, aS, bS, u, CUT, 2.7, 1.2, EP);
  bandes(aS, bS, EP, [
    { y1: 0, y2: 0.55, s: 0.05, couleur: COUL.betonGris, mat: m.beton, ch: c, trous: [[7.2, 8.8]] },
    { y1: 4.15, y2: 4.5, s: 0.18, couleur: COUL.beton, mat: m.beton, ch: T },
  ]);
  // Mur ouest, sur la cour
  const aO = [N.x1, N.z2];
  const bO = [N.x1, 15];
  murCoupe(k, T, aO, bO, { ...brique, h: 4.5, dado, ouvertures: [{ u: 3.2, l: 1.2, bas: CUT, haut: 2.7, type: "vide" }] });
  fenetreCondamnee(T, aO, bO, 3.2, CUT, 2.7, 1.2, EP);
  bandes(aO, bO, EP, [{ y1: 4.15, y2: 4.5, s: 0.18, couleur: COUL.beton, mat: m.beton, ch: T }]);
  // L'enseigne en mosaïque au-dessus de l'entrée, et sa petite marquise
  panneau(T, m.enseignes, R.bains, { x: -9, y: 3.35, z: 15 + EP / 2 + 0.03 }, 3.2, 0.8);
  T.pave(-10.3, 2.55, 15.1, -7.7, 2.7, 16.0, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
  vantail(c, -9.8, 15.12, -1.0, 0.8, 2.4, COUL.cadre, m.tole);
  // Le toit
  const trou = usure > 0.5;
  if (trou) {
    T.pave(N.x1 - 0.1, 4.5, N.z2, -6, 4.7, 10.8, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
    T.pave(N.x1 - 0.1, 4.5, 12.6, -6, 4.7, 15.1, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
    T.pave(N.x1 - 0.1, 4.5, 10.8, -14, 4.7, 12.6, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
    T.pave(-11.6, 4.5, 10.8, -6, 4.7, 12.6, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
    rai(c, [-12.8, 4.6, 11.7], [-13.6, 0.05, 12.5], 1.6);
    gravats(c, -12.8, 11.8, 0.8, 8, [COUL.beton, PALETTE.pierre], 0.03);
  } else T.pave(N.x1 - 0.1, 4.5, N.z2, -6, 4.7, 15.1, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
  mousse(T, -14, 4.7, 13, 1.6, Math.round(7 * usure));
  // Les cabines de douche : rangée nord (portes au sud) et rangée sud (portes au nord)
  douches(k, -14.9, -6.4, N.z2 - EP / 2, 10.6, 7);
  douches(k, -16.6, -11.4, 15 - EP / 2, 12.9, 4);
  // Le guichet : comptoir, serviettes et peignoirs
  c.pave(-7.4, 0, 11.6, -7.1, 1.05, 13.8, COUL.bois, m.satin, { nuance: 0.03 });
  c.pave(-7.5, 1.05, 11.55, -7.0, 1.1, 13.85, PALETTE.marbre, m.lisse, { crasse: false });
  rect(k, -7.4, 11.6, -7.1, 13.8, "guichet");
  c.pave(-6.25, 0, 11.6, -5.95, 1.8, 13.8, COUL.bois, m.satin, { nuance: 0.03 });
  for (let i = 0; i < 6; i++) c.boite(0.35, 0.12, 0.45, i % 2 ? COUL.serviette : 0xd9d0bc, { x: -6.45, y: 0.5 + (i % 3) * 0.5, z: 11.9 + Math.floor(i / 3) * 1.2, ry: c.entre(-0.1, 0.1) }, m.toile, { nuance: 0.04, crasse: false });
  for (let i = 0; i < 3; i++) c.boite(0.05, 1.1, 0.5, 0x9fb8c4, { x: -6.6, y: 1.0, z: 12.0 + i * 0.6, rz: 0.05 }, m.toile, { nuance: 0.04, crasse: false });
  c.boite(1.0, 0.06, 0.7, COUL.serviette, { x: -8.4, y: 0.04, z: 12.4, ry: 0.5 }, m.toile, { nuance: 0.05, crasse: false });
  // La plaque DOUCHES suspendue au-dessus du couloir (couche)
  panneau(T, m.enseignes, R.douches, { x: -11, y: 2.55, z: 11.75 }, 0.9, 0.34);
  for (const x of [-11.35, -10.65]) T.pave(x - 0.01, 2.72, 11.74, x + 0.01, 4.5, 11.76, COUL.acier, m.mat);
  jonchee(c, -16.5, 10.7, -7.6, 12.8, Math.round(50 * usure), undefined, 0.035);
  debris(c, -16.5, 10.7, -7.6, 12.8, Math.round(30 * usure), [COUL.faienceBlanche, 0xd9d2c0, PALETTE.pierre], 0.03);
  lierre(T, -16.95 - EP / 2, 0, 13.5, -Math.PI / 2, 2, 4, Math.round(60 * usure));
}

/** Une rangée de cabines de douche carrelées (cloisons de 2 m), de x1 à x2, fond en zF, devant en zD. */
function douches(k, x1, x2, zF, zD, n) {
  const { c, m, usure } = k;
  const w = (x2 - x1) / n;
  const s = Math.sign(zD - zF);
  const lp = 0.7;
  for (let i = 0; i <= n; i++) {
    const x = x1 + i * w;
    c.pave(x - 0.05, 0, zF, x + 0.05, 2.0, zD, COUL.faienceBlanche, m.faience, { nuance: 0.02 });
    k.b.obstacle(x, zF, x, zD, "cloison de douche");
  }
  for (let i = 0; i < n; i++) {
    const xa = x1 + i * w;
    const xb = xa + w;
    const xp = xb - lp - 0.06;
    c.pave(xa, 0, zD - 0.05, xp, 2.0, zD + 0.05, COUL.faienceBlanche, m.faience, { nuance: 0.02 });
    k.b.obstacle(xa, zD, xp, zD, "cloison de douche");
    // la porte battante, ou rien
    const r = c.hasard();
    if (r > 0.25 + 0.2 * usure) {
      c.repere({ x: xp, y: 0.25, z: zD + s * 0.05, ry: -s * c.entre(0.3, 1.5) }, () => c.pave(0, 0, -0.02, lp, 1.55, 0.02, 0x7d9c86, m.satin, { nuance: 0.06 }));
    }
    // le pommeau, la tuyauterie de cuivre, le caillebotis, le savon
    const xm = (xa + xb) / 2;
    c.tube([xm, 0.9, zF + s * 0.05], [xm, 2.05, zF + s * 0.05], 0.025, COUL.cuivre, m.metal, 5);
    c.tube([xm, 2.05, zF + s * 0.05], [xm, 2.05, zF + s * 0.35], 0.025, COUL.cuivre, m.metal, 5);
    c.poser(geoCylindre(0.09, 0.05, 7), m.metal, 0x9aa0a2, { x: xm, y: 2.0, z: zF + s * 0.38 }, PLAT);
    c.poser(geoCylindre(0.05, 0.06, 6), m.metal, 0x9aa0a2, { x: xm + 0.2, y: 1.1, z: zF + s * 0.07, rx: Math.PI / 2 }, PLAT);
    if (c.hasard() < 0.7) for (let j = 0; j < 4; j++) c.pave(xa + 0.15, 0.03, zF + s * (0.25 + j * 0.25), xb - 0.15, 0.07, zF + s * (0.4 + j * 0.25), COUL.bois, m.mat, { nuance: 0.08, crasse: false });
    if (c.hasard() < 0.5) c.boite(0.1, 0.04, 0.07, [0xe9dfc6, 0xd9b8b0, 0xc9d4b0][i % 3], { x: xa + 0.2, y: 0.95, z: zF + s * 0.1 }, m.satin, PLAT);
  }
}

// ---------- L'infirmerie et le local du chlore ----------

function infirmerie(k) {
  const { c, m, usure } = k;
  const T = k.INF;
  const brique = { couleur: COUL.brique, mat: m.brique, ep: EP };
  const dado = { couleur: COUL.faienceBlanche, mat: m.faience };
  const aS = [6, 15];
  const bS = [N.x2, 15];
  murCoupe(k, T, aS, bS, { ...brique, h: 4.5, dado, ouvertures: [{ u: 2.8, l: 1.4, bas: CUT, haut: 2.7, type: "vide" }, { u: 8.2, l: 1.4, bas: CUT, haut: 2.7, type: "vide" }] });
  for (const u of [2.8, 8.2]) fenetreCondamnee(T, aS, bS, u, CUT, 2.7, 1.4, EP, u > 5 ? 2 : 3);
  bandes(aS, bS, EP, [
    { y1: 0, y2: 0.55, s: 0.05, couleur: COUL.betonGris, mat: m.beton, ch: c },
    { y1: 4.15, y2: 4.5, s: 0.18, couleur: COUL.beton, mat: m.beton, ch: T },
  ]);
  const aE = [N.x2, 15];
  const bE = [N.x2, N.z2];
  murCoupe(k, T, aE, bE, { ...brique, h: 4.5, dado, ouvertures: [{ u: 3, l: 1.2, bas: 0, haut: 2.3, type: "vide" }] });
  bandes(aE, bE, EP, [
    { y1: 0, y2: 0.55, s: 0.05, couleur: COUL.betonGris, mat: m.beton, ch: c, trous: [[2.4, 3.6]] },
    { y1: 4.15, y2: 4.5, s: 0.18, couleur: COUL.beton, mat: m.beton, ch: T },
  ]);
  vantail(c, N.x2 + 0.18, 12.6, Math.PI / 2 + 1.6, 1.15, 2.25, COUL.porteBleue, m.satin);
  // La cloison entre le local du chlore (ouest) et l'infirmerie (est)
  murCoupe(k, T, [11.5, 15], [11.5, N.z2], { couleur: COUL.cabine, mat: m.brique, ep: 0.2, h: 4.5, dado, ouvertures: [{ u: 3.5, l: 1.0, bas: 0, haut: 2.2, type: "vide" }] });
  // Le toit
  T.pave(6, 4.5, N.z2, N.x2 + 0.1, 4.7, 15.1, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
  mousse(T, 13, 4.7, 11, 1.8, Math.round(8 * usure));
  semerTouffes(T, 6, N.z2, 17, 15, Math.round(16 * usure), PALETTE.herbeSeche, 4.7);
  lierre(T, N.x2 + EP / 2 + 0.02, 0, 9.8, Math.PI / 2, 2, 4.2, Math.round(60 * usure));

  // --- Le local du chlore et d'AquaSmart ---
  const bidons = [[6.6, 9.1], [7.2, 9.1], [6.6, 9.7], [7.8, 9.15], [9.3, 9.1]];
  bidons.forEach(([x, z], i) => {
    c.poser(geoCylindre(0.28, 0.9, 9), m.satin, i % 2 ? 0x3f6f9a : 0xe2ddd0, { x, y: 0.45, z }, { nuance: 0.04 });
    c.poser(geoCylindre(0.1, 0.05, 6), m.satin, 0x2a2d30, { x: x + 0.1, y: 0.92, z }, PLAT);
  });
  c.repere({ x: 8.4, y: 0.28, z: 9.6, rz: Math.PI / 2, ry: 0.3 }, () => c.poser(geoCylindre(0.28, 0.9, 9), m.satin, 0x3f6f9a, {}, { nuance: 0.04 }));
  panneau(c, m.enseignes, R.chlore, { x: 7.2, y: 1.15, z: 9.43 }, 0.6, 0.3);
  rect(k, 6.3, 8.8, 9.7, 10.0, "bidons de chlore");
  // Étagère de produits, sacs de chlore, armoire de serveurs AquaSmart
  c.pave(10.9, 0, 9.0, 11.3, 2.0, 12.2, COUL.acier, m.tole, { nuance: 0.03 });
  for (const y of [0.5, 1.0, 1.5]) for (let i = 0; i < 5; i++) if (c.hasard() > 0.35) c.boite(0.18, 0.3, 0.18, [0xe2ddd0, 0x3f6f9a, 0xd4b53e][i % 3], { x: 10.8, y: y + 0.17, z: 9.3 + i * 0.6 }, m.satin, PLAT);
  rect(k, 10.9, 9.0, 11.3, 12.2, "étagère");
  for (let i = 0; i < 4; i++) c.boite(0.7, 0.2, 0.45, 0xe6e0cf, { x: 7.0 + i * 0.4, y: 0.1 + (i % 2) * 0.2, z: 13.9, ry: c.entre(-0.3, 0.3) }, m.toile, { nuance: 0.05 });
  c.pave(9.4, 0, 14.2, 10.2, 1.9, 14.8, 0x24282b, m.satin, { nuance: 0.02 });
  for (let j = 0; j < 5; j++) c.pave(9.5, 0.3 + j * 0.3, 14.18, 9.6, 0.34 + j * 0.3, 14.2, 0x3f6f50, m.lisse, PLAT);
  for (let i = 0; i < 3; i++) c.boite(0.5, 0.3, 0.4, 0xb08f55, { x: 8.2 + i * 0.3, y: 0.15 + i * 0.3, z: 12.6, ry: c.entre(-0.4, 0.4) }, m.mat, { nuance: 0.05 });

  // --- L'infirmerie du maître-nageur ---
  // Le lit d'examen, sa bouée, la perche couchée
  c.pave(12.3, 0.7, 13.6, 14.3, 0.78, 14.4, COUL.rampe, m.metal, { crasse: false });
  for (const [x, z] of [[12.4, 13.7], [14.2, 13.7], [12.4, 14.3], [14.2, 14.3]]) c.pave(x - 0.03, 0, z - 0.03, x + 0.03, 0.7, z + 0.03, COUL.rampe, m.metal);
  c.pave(12.35, 0.78, 13.62, 14.25, 0.9, 14.38, 0x9fb0a8, m.toile, { nuance: 0.03 });
  rect(k, 12.3, 13.6, 14.3, 14.4, "lit d'examen");
  c.poser(new THREE.TorusGeometry(0.32, 0.09, 5, 12), m.satin, COUL.bouee, { x: 14.55, y: 0.45, z: 14.52, rx: 0.12 }, { nuance: 0.02, crasse: false });
  c.tube([12.0, 0.06, 9.1], [16.4, 0.06, 9.4], 0.025, 0xd4cfc0, m.metal, 5);
  c.boite(0.45, 0.05, 0.32, 0xd4cfc0, { x: 16.5, y: 0.06, z: 9.4 }, m.metal);
  // L'armoire à pharmacie vitrée (une porte ouverte), le bureau, la trousse
  c.pave(16.2, 0, 10.0, 16.75, 1.9, 11.4, 0xe6e2d8, m.satin, { nuance: 0.02 });
  c.repere({ x: 16.18, y: 0.9, z: 10.05, ry: 1.2 }, () => c.pave(0, 0, -0.02, 0.68, 0.95, 0.02, 0xe6e2d8, m.satin));
  for (let i = 0; i < 6; i++) if (c.hasard() > 0.4) c.boite(0.08, 0.14, 0.08, [0xe2ddd0, 0x8a6a3a, 0x6a8a9a][i % 3], { x: 16.4, y: 1.05 + (i % 2) * 0.35, z: 10.25 + Math.floor(i / 2) * 0.4 }, m.lisse, PLAT);
  rect(k, 16.2, 10.0, 16.75, 11.4, "armoire à pharmacie");
  c.pave(12.0, 0.74, 9.0, 13.6, 0.79, 9.8, COUL.bois, m.satin, { nuance: 0.03 });
  for (const [x, z] of [[12.05, 9.05], [13.55, 9.05], [12.05, 9.75], [13.55, 9.75]]) c.pave(x - 0.03, 0, z - 0.03, x + 0.03, 0.74, z + 0.03, COUL.bois, m.satin);
  c.boite(0.4, 0.18, 0.26, 0xe6e2d8, { x: 12.6, y: 0.88, z: 9.4, ry: 0.3 }, m.satin);
  c.boite(0.12, 0.12, 0.02, 0xc8362b, { x: 12.66, y: 0.9, z: 9.54, ry: 0.3 }, m.satin, PLAT);
  c.tube([15.4, 0.06, 9.1], [15.4, 0.95, 9.1], 0.11, 0x3f6f50, m.metal, 7);
  // Le brancard par terre, la chaise du maître-nageur renversée
  c.pave(13.0, 0.04, 11.4, 15.0, 0.1, 12.0, 0xd4cfc0, m.toile, { nuance: 0.04 });
  for (const z of [11.38, 12.02]) c.tube([12.6, 0.07, z], [15.4, 0.07, z], 0.025, COUL.rampe, m.metal, 5);
  jonchee(c, 11.8, 9, 16.6, 14.8, Math.round(40 * usure), undefined, 0.035);
}

// ---------- La salle des machines ----------

function machines(k) {
  const { c, m, usure } = k;
  const T = k.MA;
  const brique = { couleur: COUL.brique, mat: m.brique, ep: EP };
  // Murs nord et ouest (le fond) : entiers
  mur(c, [N.x1, N.z1], [-28, N.z1], { ...brique, h: 5.5, batiment: k.b, ouvertures: [{ u: 5, l: 1.4, bas: 2.4, haut: 4.2, type: "fenetre", croisillons: 2, traverses: 2, appui: false, cadre: COUL.cadre, matCadre: m.mat, bris: k.bris }] });
  mur(c, [-28, N.z1], [-28, 3], { ...brique, h: 5.5, batiment: k.b, ouvertures: [4, 10, 15].map((u) => ({ u, l: 1.4, bas: 2.4, haut: 4.2, type: "fenetre", croisillons: 2, traverses: 2, appui: false, cadre: COUL.cadre, matCadre: m.mat, bris: k.bris })) });
  bandes([N.x1, N.z1], [-28, N.z1], EP, [{ y1: 5.2, y2: 5.5, s: 0.15, couleur: COUL.beton, mat: m.beton, ch: c }]);
  // Mur sud (sur la cour) : coupé
  const aS = [-28, 3];
  const bS = [N.x1, 3];
  murCoupe(k, T, aS, bS, { ...brique, h: 5.5, ouvertures: [{ u: 2.5, l: 1.4, bas: CUT, haut: 3.4, type: "vide" }, { u: 6, l: 1.6, bas: 0, haut: 2.5, type: "vide" }, { u: 9, l: 1.4, bas: CUT, haut: 3.4, type: "vide" }] });
  for (const u of [2.5, 9]) fenetreCondamnee(T, aS, bS, u, CUT, 3.4, 1.4, EP, 2);
  bandes(aS, bS, EP, [
    { y1: 0, y2: 0.55, s: 0.05, couleur: COUL.betonGris, mat: m.beton, ch: c, trous: [[5.2, 6.8]] },
    { y1: 5.2, y2: 5.5, s: 0.15, couleur: COUL.beton, mat: m.beton, ch: T },
  ]);
  vantail(c, -22.8, 3.2, -1.1, 1.5, 2.4, COUL.cadre, m.tole);
  // Le toit, et son lanterneau crevé
  T.pave(-28.1, 5.5, N.z1, N.x1, 5.7, -9, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
  T.pave(-28.1, 5.5, -6, N.x1, 5.7, 3.1, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
  T.pave(-28.1, 5.5, -9, -24, 5.7, -6, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
  T.pave(-20.5, 5.5, -9, N.x1, 5.7, -6, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
  for (const x of [-24, -20.5]) T.pave(x - 0.08, 5.7, -9, x + 0.08, 6.1, -6, COUL.cadre, m.mat);
  for (let x = -23.6; x < -20.6; x += 0.7) T.pave(x - 0.03, 6.05, -9, x + 0.03, 6.12, -6, COUL.cadre, m.mat);
  rai(c, [-22.2, 5.8, -7.5], [-23.4, 0.05, -6.2], 2.4);
  mousse(T, -25, 5.7, 0, 1.8, Math.round(8 * usure));

  // La chaudière, rallumée par des survivants
  const zb = -12.6;
  c.pave(-27.3, 0, zb - 1.05, -22.6, 0.6, zb + 1.05, COUL.briqueSombre, m.brique, { nuance: 0.03 });
  c.poser(geoCylindre(1.0, 4.4, 12), m.tole, COUL.chaudiere, { x: -24.9, y: 1.6, z: zb, rz: Math.PI / 2 }, { nuance: 0.02 });
  for (const x of [-26.6, -24.9, -23.2]) c.poser(geoCylindre(1.05, 0.12, 12), m.tole, 0x2e2c29, { x, y: 1.6, z: zb, rz: Math.PI / 2 }, PLAT);
  c.pave(-22.75, 0.6, zb - 0.9, -22.55, 2.6, zb + 0.9, 0x2e2c29, m.tole);
  c.pave(-22.55, 0.9, zb - 0.35, -22.5, 1.5, zb + 0.35, 0x1a1816, m.mat, PLAT);
  panneau(c, m.neon, R.flamme, { x: -22.49, y: 1.15, z: zb, ry: Math.PI / 2 }, 0.5, 0.6);
  c.repere({ x: -22.5, y: 0.9, z: zb + 0.35, ry: 1.9 }, () => c.pave(0, 0, -0.03, 0.7, 0.6, 0.03, 0x2e2c29, m.tole));
  c.poser(geoCylindre(0.14, 0.05, 10), m.lisse, 0xe6e2d8, { x: -22.5, y: 2.2, z: zb - 0.5, rz: Math.PI / 2 }, PLAT);
  rect(k, -27.3, zb - 1.05, -22.5, zb + 1.05, "chaudière");
  // Le conduit de fumée vers la cheminée
  c.tube([-25.6, 2.5, zb], [-25.6, 4.7, zb], 0.25, 0x3a3734, m.tole, 8);
  c.tube([-25.6, 4.7, zb], [-25.6, 4.7, -17.2], 0.25, 0x3a3734, m.tole, 8);
  // Le tas de bois des survivants
  for (let i = 0; i < 10; i++) c.tube([-25.5 + c.entre(-0.6, 0.6), 0.12 + Math.floor(i / 4) * 0.2, -9.6 + (i % 4) * 0.22], [-24.1 + c.entre(-0.3, 0.3), 0.12 + Math.floor(i / 4) * 0.2, -9.5 + (i % 4) * 0.22], 0.09, PALETTE.bois, m.mat, 5);
  // Les filtres à sable
  for (const z of [-12.6, -9.4]) {
    c.poser(geoCylindre(0.85, 2.1, 10), m.tole, COUL.filtre, { x: -19.6, y: 1.05, z }, { nuance: 0.03 });
    c.poser(new THREE.SphereGeometry(0.85, 10, 3, 0, Math.PI * 2, 0, Math.PI / 2), m.tole, COUL.filtre, { x: -19.6, y: 2.1, z }, { nuance: 0.03, crasse: false });
    c.poser(geoCylindre(0.2, 0.15, 8), m.metal, 0x8d969a, { x: -19.6, y: 2.95, z }, PLAT);
    c.pave(-18.8, 0.9, z - 0.25, -18.7, 1.4, z + 0.25, 0x8d969a, m.metal);
    rect(k, -20.45, z - 0.85, -18.75, z + 0.85, "filtre à sable");
  }
  // Les pompes et leurs moteurs
  for (const z of [-4.6, -2.4]) {
    c.pave(-20.4, 0, z - 0.45, -18.6, 0.3, z + 0.45, COUL.betonGris, m.beton, { nuance: 0.02 });
    c.poser(geoCylindre(0.3, 0.9, 10), m.tole, 0x3f6f9a, { x: -19.9, y: 0.62, z, rz: Math.PI / 2 }, { nuance: 0.03 });
    c.poser(geoCylindre(0.36, 0.3, 10), m.tole, 0x5a5650, { x: -19.1, y: 0.62, z, rz: Math.PI / 2 }, { nuance: 0.03 });
    c.tube([-18.95, 0.62, z], [-17.2, 0.62, z], 0.1, COUL.cuivre, m.metal, 6);
    rect(k, -20.4, z - 0.45, -18.6, z + 0.45, "pompe");
  }
  // Les tuyauteries de cuivre (des tronçons ont déjà été démontés)
  const tuyaux = [
    [[-22.5, 2.3, -14.5], [-17.3, 2.3, -14.5]],
    [[-17.3, 2.3, -14.5], [-17.3, 2.3, -1.5]],
    [[-19.6, 3.0, -12.6], [-19.6, 3.4, -12.6]],
    [[-19.6, 3.4, -12.6], [-19.6, 3.4, -9.4]],
    [[-19.6, 3.0, -9.4], [-19.6, 3.4, -9.4]],
    [[-19.6, 3.4, -11], [-17.3, 3.4, -11]],
    [[-22.4, 1.9, -11.6], [-21.0, 1.9, -11.6]],
    [[-21.0, 1.9, -11.6], [-20.4, 1.9, -12.0]],
  ];
  tuyaux.forEach(([a, b], i) => {
    if (i > 0 && c.hasard() < 0.18 * usure) return;
    c.tube(a, b, 0.07, i % 3 === 0 ? COUL.cuivre : i % 3 === 1 ? 0x8f6a45 : PALETTE.cuivreVert, m.metal, 6);
  });
  for (const z of [-14.5, -8, -3]) c.poser(geoCylindre(0.15, 0.06, 8), m.tole, 0xa4552f, { x: -17.3, y: 2.45, z }, PLAT);
  // L'établi, des bidons, l'armoire électrique « pilotage IA des pompes »
  c.pave(-27.8, 0.85, -7.8, -27.1, 0.92, -4.8, COUL.bois, m.satin, { nuance: 0.03 });
  for (const z of [-7.7, -4.9]) c.pave(-27.75, 0, z - 0.04, -27.15, 0.85, z + 0.04, COUL.bois, m.satin);
  c.boite(0.5, 0.2, 0.3, 0xa4552f, { x: -27.4, y: 1.02, z: -6.8, ry: 0.4 }, m.tole);
  c.tube([-27.5, 0.95, -5.8], [-27.2, 0.95, -5.2], 0.03, 0x6a5a48, m.mat, 5);
  rect(k, -27.8, -7.8, -27.1, -4.8, "établi");
  c.pave(-27.83, 0.5, -2.5, -27.5, 2.1, -1.2, 0x9aa0a2, m.tole, { nuance: 0.03 });
  c.pave(-27.5, 1.4, -2.2, -27.48, 1.75, -1.6, 0x1e2124, m.lisse, PLAT);
  for (const [x, z] of [[-26.8, 1.8], [-26.2, 2.2], [-25.6, 1.9]]) c.poser(geoCylindre(0.28, 0.9, 9), m.satin, 0xe2ddd0, { x, y: 0.45, z }, { nuance: 0.04 });
  rect(k, -27.1, 1.5, -25.3, 2.5, "bidons");
  debris(c, -27.5, -14.5, -17.5, 2.5, Math.round(50 * usure), [COUL.brique, PALETTE.pierre, 0x6a6560], 0.03);
  // La cheminée de brique, au nord
  const cx = -25;
  const cz = -17.4;
  c.pave(cx - 1.1, 0, cz - 1.1, cx + 1.1, 1.2, cz + 1.1, COUL.betonGris, m.beton, { nuance: 0.02 });
  const hCh = 17;
  for (let i = 0; i < 4; i++) {
    const y1 = 1.2 + (i * (hCh - 1.2)) / 4;
    const y2 = 1.2 + ((i + 1) * (hCh - 1.2)) / 4;
    const r = 0.95 - i * 0.1;
    c.pave(cx - r, y1, cz - r, cx + r, y2, cz + r, COUL.brique, m.brique, { nuance: 0.02, crasse: i === 0 });
  }
  for (const y of [6, 11.5, hCh - 0.6]) c.pave(cx - 0.85, y, cz - 0.85, cx + 0.85, y + 0.3, cz + 0.85, COUL.beton, m.beton, { nuance: 0.02, crasse: false });
  c.pave(cx - 0.6, hCh, cz - 0.6, cx + 0.2, hCh + 0.6, cz + 0.6, COUL.briqueSombre, m.brique, { nuance: 0.04, crasse: false });
  c.tube([cx + 0.7, hCh, cz + 0.7], [cx + 0.7, hCh + 1.6, cz + 0.7], 0.02, COUL.acier, m.metal, 4);
  rect(k, cx - 1.1, cz - 1.1, cx + 1.1, cz + 1.1, "cheminée");
  lierre(c, cx - 0.98, 0, cz, -Math.PI / 2, 1.6, 5, Math.round(60 * usure));
  // La cour de l'ouest : tas de charbon, brouette
  gravats(c, -27, 6, 1.4, 16, [0x2c2926, 0x3a3734, 0x24211f], 0.015);
  c.repere({ x: -23.5, y: 0, z: 7.5, ry: 0.7 }, () => {
    c.boite(0.7, 0.35, 1.1, PALETTE.rouille, { y: 0.55, rx: 0.15 }, m.tole);
    c.poser(geoCylindre(0.22, 0.08, 8), m.mat, 0x2a2826, { y: 0.22, z: 0.6, rz: Math.PI / 2 }, PLAT);
  });
  semerTouffes(c, -30, 3.2, -17.2, 14.8, Math.round(40 * usure), PALETTE.herbeSeche, 0.015);
  arbuste(c, -28.8, 12.5, 1.6, 0);
}

// ---------- Le solarium ----------

function solarium(k) {
  const { c, m, usure } = k;
  const x1 = N.x2;
  const x2 = 29;
  const z1 = -15;
  const z2 = 8;
  // Le muret Art déco, à fentes, et sa grille
  const muret = { h: 1.1, ep: 0.25, couleur: COUL.beton, mat: m.beton, batiment: k.b };
  mur(c, [x1, z1], [x2, z1], { ...muret, breches: usure > 0.5 ? [{ u: 8, l: 2, profondeur: 0.8 }] : [] });
  mur(c, [x2, z1], [x2, z2], { ...muret, ouvertures: [3, 7, 11, 15, 19].map((u) => ({ u, l: 1.4, bas: 0.45, haut: 0.8, type: "vide" })) });
  mur(c, [x2, z2], [x1, z2], { ...muret, ouvertures: [{ u: 5.8, l: 2.4, bas: 0, haut: 1.2, type: "vide" }] });
  for (const [a, b] of [[[x1, z1], [x2, z1]], [[x2, z1], [x2, z2]], [[x2, z2], [x1, z2]]]) {
    const dz = b[1] - a[1];
    if (dz === 0) c.pave(Math.min(a[0], b[0]), 1.1, a[1] - 0.18, Math.max(a[0], b[0]), 1.18, a[1] + 0.18, COUL.margelle, m.beton, { nuance: 0.02, crasse: false });
    else c.pave(a[0] - 0.18, 1.1, Math.min(a[1], b[1]), a[0] + 0.18, 1.18, Math.max(a[1], b[1]), COUL.margelle, m.beton, { nuance: 0.02, crasse: false });
  }
  // La grille, un battant ouvert
  c.repere({ x: 22.0, y: 0, z: z2, ry: 1.2 }, () => {
    for (let i = 0; i < 7; i++) c.pave(i * 0.18, 0.05, -0.02, i * 0.18 + 0.03, 1.4, 0.02, COUL.acier, m.tole);
    for (const y of [0.15, 1.3]) c.pave(0, y, -0.02, 1.2, y + 0.05, 0.02, COUL.acier, m.tole);
  });
  // Les transats, rangés puis renversés
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < 5; i++) {
      const x = 19.6 + i * 1.9;
      const z = -11.2 + r * 5.2;
      const etat = c.hasard();
      transat(k, x + c.entre(-0.2, 0.2), z + c.entre(-0.3, 0.3), c.entre(-0.25, 0.25) + (etat < 0.2 ? 1.2 : 0), etat < 0.3 + 0.2 * usure);
    }
  }
  // Les parasols : deux debout, un couché
  for (const [x, z, couche] of [[21.4, -8.6, false], [26, -8.6, false], [24.5, 1.5, true]]) {
    if (couche) {
      c.tube([x - 1.2, 0.08, z], [x + 1.1, 0.12, z + 0.5], 0.035, 0xd8d0c0, m.satin, 5);
      c.poser(new THREE.ConeGeometry(1.3, 0.5, 8), m.toile, 0x7fa3a0, { x: x + 1.4, y: 0.7, z: z + 0.6, rz: 1.35 }, { nuance: 0.04, crasse: false });
    } else {
      c.tube([x, 0, z], [x, 2.3, z], 0.035, 0xd8d0c0, m.satin, 5);
      c.poser(new THREE.ConeGeometry(1.4, 0.5, 8), m.toile, x < 24 ? 0x7fa3a0 : 0xd8c49a, { x, y: 2.45, z }, { nuance: 0.04, crasse: false });
    }
  }
  // La buvette contre le muret nord
  c.pave(25.2, 0, -14.6, 28.7, 1.05, -13.9, COUL.porteBleue, m.satin, { nuance: 0.03 });
  c.pave(25.1, 1.05, -14.65, 28.8, 1.12, -13.8, PALETTE.marbre, m.lisse, { crasse: false });
  for (let i = 0; i < 6; i++) if (c.hasard() > 0.35) c.boite(0.08, 0.28, 0.08, [0x23402c, 0x6a3a2a, 0x8aa0a8][i % 3], { x: 25.5 + i * 0.5, y: 1.26, z: -14.3 }, m.lisse, PLAT);
  c.boite(0.6, 0.4, 0.4, 0x3f6f9a, { x: 26.3, y: 0.2, z: -13.3, ry: 0.4 }, m.satin);
  c.boite(3.8, 0.03, 1.8, 0xd8c49a, { x: 27, y: 2.1, z: -13.6, rx: 0.25, rz: 0.06 }, m.toile, { nuance: 0.04, crasse: false });
  for (const x of [25.2, 28.7]) c.tube([x, 0, -13.0], [x, 1.95, -13.0], 0.03, COUL.acier, m.tole, 5);
  rect(k, 25.2, -14.6, 28.7, -13.9, "buvette");
  // Les bacs à plantes envahis, un arbre qui a crevé le sien
  for (const [x, z] of [[18.2, -14.2], [28.1, -4], [18.2, 7.1]]) {
    c.pave(x - 0.6, 0, z - 0.6, x + 0.6, 0.6, z + 0.6, COUL.betonGris, m.beton, { nuance: 0.03 });
    arbuste(c, x, z, 0.8 + 0.6 * usure, 0.55);
    rect(k, x - 0.6, z - 0.6, x + 0.6, z + 0.6, "bac à plantes");
  }
  c.pave(26.9, 0, 4.4, 28.3, 0.6, 5.8, COUL.betonGris, m.beton, { nuance: 0.03 });
  gravats(c, 27.6, 5.1, 0.7, 6, [COUL.betonGris, PALETTE.terre], 0.3);
  arbre(c, 27.6, 5.1, 5.5 + 2.5 * usure, "feuillu", 0.5);
  rect(k, 26.9, 4.4, 28.3, 5.8, "arbre");
  // Herbe dans les joints, feuilles, mousse
  semerTouffes(c, x1 + 0.3, z1 + 0.3, x2 - 0.3, z2 - 0.3, Math.round(80 * usure), PALETTE.herbeSeche, 0.03);
  jonchee(c, x1 + 0.3, z1 + 0.3, x2 - 0.3, z2 - 0.3, Math.round(90 * usure), undefined, 0.035);
  mousse(c, 21, 0.03, -2, 2, Math.round(6 * usure) + 1);
  // La cour de l'est, entre le solarium et la rue
  arbuste(c, 28.5, 12, 1.4, 0);
  arbuste(c, 19.6, 10.2, 1.0, 0);
  semerTouffes(c, x1, 8.3, 30, 14.8, Math.round(50 * usure), PALETTE.herbe, 0.015);
}

function transat(k, x, z, ry, renverse) {
  const { c, m } = k;
  c.repere({ x, y: renverse ? 0.52 : 0.03, z, ry, rz: renverse ? Math.PI * 0.94 : 0 }, () => {
    c.boite(0.62, 0.05, 1.8, PALETTE.boisGris, { y: 0.32 }, m.mat, { nuance: 0.05 });
    c.boite(0.62, 0.05, 0.75, PALETTE.boisGris, { y: 0.56, z: -0.82, rx: 0.9 }, m.mat, { nuance: 0.05 });
    for (const [a, d] of [[-0.27, -0.75], [0.27, -0.75], [-0.27, 0.75], [0.27, 0.75]]) c.boite(0.05, 0.3, 0.05, PALETTE.boisGris, { x: a, y: 0.15, z: d }, m.mat);
    c.boite(0.55, 0.06, 1.1, c.hasard() < 0.5 ? 0xc9b48a : 0x9fb8b0, { y: 0.37, z: 0.2 }, m.toile, { nuance: 0.06 });
  });
}

// ---------- La rue ----------

function rue(k) {
  const { c, m, usure } = k;
  // Les réverbères Art déco
  for (const x of [-8, 9]) {
    c.tube([x, 0.05, 17.15], [x, 4.2, 17.15], 0.07, 0x3a4440, m.tole, 6);
    c.pave(x - 0.18, 0.05, 16.97, x + 0.18, 0.8, 17.33, 0x3a4440, m.tole);
    c.tube([x, 4.2, 17.15], [x, 4.2, 17.9], 0.04, 0x3a4440, m.tole, 5);
    c.poser(new THREE.SphereGeometry(0.22, 7, 4), m.lisse, 0xd9d4c4, { x, y: 4.0, z: 17.9 }, PLAT);
    rect(k, x - 0.18, 16.97, x + 0.18, 17.33, "réverbère");
  }
  // Les platanes du trottoir
  for (const [x, h] of [[-21, 8], [23, 7.5]]) {
    c.pave(x - 0.7, 0.05, 16.1, x + 0.7, 0.07, 17.5, 0x3a3734, m.tole, PLAT);
    arbre(c, x, 16.8, h, "feuillu", 0.05);
    rect(k, x - 0.25, 16.55, x + 0.25, 17.05, "arbre");
  }
  // Une voiture abandonnée, rouillée, pneus à plat
  c.repere({ x: 12.5, y: -0.05, z: 20.2, ry: 0.05, rz: 0.03 }, () => {
    c.boite(4.0, 0.75, 1.75, 0x7d8a86, { y: 0.6 }, m.tole, { nuance: 0.03 });
    c.boite(2.2, 0.6, 1.6, 0x7d8a86, { x: -0.3, y: 1.25 }, m.tole, { nuance: 0.03 });
    c.boite(2.0, 0.45, 1.62, 0x2a3236, { x: -0.3, y: 1.27 }, m.verre, PLAT);
    for (let i = 0; i < 6; i++) c.boite(c.entre(0.3, 0.8), 0.02, c.entre(0.2, 0.5), PALETTE.rouille, { x: c.entre(-1.8, 1.8), y: 0.98, z: c.entre(-0.7, 0.7) }, m.mat, PLAT);
    for (const [x, z] of [[-1.3, -0.85], [-1.3, 0.85], [1.3, -0.85], [1.3, 0.85]]) c.poser(geoCylindre(0.33, 0.24, 8), m.mat, 0x1e1e1e, { x, y: 0.25, z, rx: Math.PI / 2 }, PLAT);
  });
  rect(k, 10.5, 19.3, 14.5, 21.1, "voiture");
  // Une bouche d'incendie, un banc, des papiers
  c.tube([-4.5, 0.05, 17.2], [-4.5, 0.75, 17.2], 0.12, 0x8a3a2e, m.tole, 7);
  c.pave(-14, 0.42, 15.5, -12, 0.48, 15.9, COUL.bois, m.satin, { nuance: 0.04 });
  for (const x of [-13.8, -12.2]) c.pave(x - 0.04, 0.05, 15.55, x + 0.04, 0.42, 15.85, COUL.acier, m.tole);
  debris(c, -28, 15.2, 28, 22, Math.round(40 * usure), [0xe6e0cf, 0xd9d2c0, 0x9c968a], 0.05);
}

// ---------- Le camp des survivants, sur la plage ----------

function camp(k) {
  const { c, m } = k;
  const x = 15.4;
  const z = 4.2;
  // Le cercle de pierres, les bûches, la flamme
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    c.boite(0.22, 0.16, 0.18, PALETTE.pierre, { x: x + Math.cos(a) * 0.5, y: 0.1, z: z + Math.sin(a) * 0.5, ry: a }, m.mat, { nuance: 0.1 });
  }
  for (let i = 0; i < 4; i++) c.tube([x - 0.35 * Math.cos(i), 0.08, z - 0.35 * Math.sin(i)], [x + 0.25 * Math.cos(i), 0.25, z + 0.25 * Math.sin(i)], 0.06, 0x3a2a1e, m.mat, 5);
  for (const ry of [0.4, 0.4 + Math.PI / 2]) panneau(c, m.neon, R.flamme, { x, y: 0.5, z, ry }, 0.65, 0.8);
  // La marmite sur son trépied
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    c.poutre([x + Math.cos(a) * 0.6, 0.03, z + Math.sin(a) * 0.6], [x, 1.2, z], 0.03, 0x3a3734, m.metal);
  }
  c.poser(geoCylindre(0.18, 0.22, 8), m.metal, 0x3a3734, { x, y: 0.85, z }, PLAT);
  // Couchages, caisses, une bâche tendue
  c.boite(0.8, 0.12, 1.9, 0x6b6a4a, { x: x - 1.6, y: 0.09, z: z - 0.1, ry: 0.1 }, m.toile, { nuance: 0.05 });
  c.boite(0.8, 0.12, 1.9, 0x5f6f7a, { x: x + 1.0, y: 0.09, z: z - 1.2, ry: 1.4 }, m.toile, { nuance: 0.05 });
  c.boite(0.6, 0.45, 0.45, 0x8a6b4a, { x: x + 1.2, y: 0.25, z: z + 1.1, ry: 0.3 }, m.mat, { nuance: 0.05 });
  c.boite(0.5, 0.35, 0.4, 0x8a6b4a, { x: x + 1.25, y: 0.65, z: z + 1.1, ry: 0.5 }, m.mat, { nuance: 0.05 });
  for (const [px, pz] of [[x - 2.3, z - 1.2], [x - 2.3, z + 1.0]]) c.tube([px, 0.03, pz], [px, 1.7, pz], 0.03, PALETTE.boisGris, m.mat, 5);
  c.boite(0.03, 2.2, 1.6, 0x5f6f4a, { x: x - 1.85, y: 1.2, z: z - 0.1, rz: -0.5 }, m.toile, { nuance: 0.05, crasse: false });
  // Le haut fauteuil du maître-nageur, et la station de recharge du drone posée dessus
  const fx = 13.7;
  const fz = -2.4;
  for (const [dx, dz] of [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]]) c.poutre([fx + dx * 1.5, 0.03, fz + dz * 1.5], [fx + dx, 2.0, fz + dz], 0.06, 0xe6e2d8, m.satin);
  c.pave(fx - 0.4, 2.0, fz - 0.4, fx + 0.4, 2.08, fz + 0.4, 0xe6e2d8, m.satin);
  c.pave(fx + 0.32, 2.08, fz - 0.4, fx + 0.4, 2.7, fz + 0.4, 0xe6e2d8, m.satin);
  c.pave(fx - 0.3, 2.08, fz - 0.3, fx + 0.2, 2.2, fz + 0.3, COUL.aqua, m.satin);
  for (let y = 0.4; y < 2; y += 0.4) c.boite(0.05, 0.04, 0.9, 0xe6e2d8, { x: fx + 0.35 + (2 - y) * 0.13, y, z: fz }, m.satin);
  rect(k, fx - 0.55, fz - 0.55, fx + 0.55, fz + 0.55, "chaise du maître-nageur");
}
