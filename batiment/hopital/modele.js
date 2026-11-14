// L'hôpital pavillonnaire (Book 20 §3.3, « Hôpital », Ville, lointain, danger ●●●●●).
//
// Un pavillon de soins des années 1930 : brique et bandeaux de béton blanc, fenêtres en bandes, un corps central à
// trois niveaux coiffé d'un fronton où l'horloge s'est arrêtée à 4 h 12, deux ailes basses sous l'ardoise. Devant,
// l'auvent des URGENCES (le G est tombé), et ce qui reste de la Grande Panne et de la fièvre grise : tentes de triage,
// sacs de sable, barrières, panneaux QUARANTAINE, une ambulance aux pneus à plat. À l'ouest, une galerie à arcades
// mène à la chapelle. Le bout de l'aile est s'est effondré : l'étage est tombé dans la salle du dessous.
//
// Deux cartes (budget : ≤ 60 000 triangles, ≤ 40 appels de dessin chacune) :
// - « cour » : la cour, l'entrée des urgences, le hall d'accueil, la galerie et la chapelle ;
// - « soins » : l'aile des soins (couloir carrelé, salle des malades, chambre, pharmacie, bloc opératoire, salle
//   effondrée), avec le hall d'où l'on arrive.
// Les deux cartes partagent le même pavillon, aux mêmes coordonnées « hôpital » (G) ; chacune est recentrée sur son lot.
//
// Repère G : +x à l'est, +z au sud. Pavillon de x = -24 à 24, z = -6 à 6 ; corps central de x = -6 à 6, avancé
// jusqu'à z = 8,5. Les façades sud et est (côté caméra) sont coupées à hauteur d'allège : le haut des murs du
// rez-de-chaussée, les étages et les toits forment une couche qui s'efface quand le personnage entre.

import * as THREE from "three";
import {
  Batiment, PALETTE, MAT, matiere, matiereMonde, matiereTexture, matiereVerre, mur, lierre as lierreA, touffes, semerTouffes as semerA, gravats,
  debris as debrisA, jonchee as joncheeA, mousse, arbuste, arbre, raiDeLumiere as raiA, flaque, dessiner, taches, aleatoire, toitDeuxPans,
} from "../commun/atelier.js";

// La végétation et le petit désordre coûtent cher en triangles (une feuille de lierre = 20 triangles) : on les dose.
const lierre = (c, x, y0, z, ry, l, h, n) => lierreA(c, x, y0, z, ry, l, h, Math.round(n * 0.36));
const semerTouffes = (c, x1, z1, x2, z2, n, t, y) => semerA(c, x1, z1, x2, z2, Math.round(n * 0.45), t, y);
const debris = (c, x1, z1, x2, z2, n, t, y) => debrisA(c, x1, z1, x2, z2, Math.round(n * 0.6), t, y);
const jonchee = (c, x1, z1, x2, z2, n, t, y) => joncheeA(c, x1, z1, x2, z2, Math.round(n * 0.55), t, y);
// Un seul matériau de lueur pour tous les rais de lumière (l'opacité fait la clé du cache)
const raiDeLumiere = (c, a, b, l) => raiA(c, a, b, l, 0.09);

// ---------- Les cartes ----------

/** Centre de chaque carte dans le repère G (l'origine d'une carte est le centre de son lot). */
const CENTRES = { cour: { x: -2, z: 10 }, soins: { x: 0, z: -1 } };

/** Convertit des points du repère G vers le repère d'une carte. */
function versCarte(id, points) {
  const o = CENTRES[id];
  return points.map((p) => ({ ...p, x: Math.round((p.x - o.x) * 10) / 10, z: Math.round((p.z - o.z) * 10) / 10 }));
}

export const FICHE = {
  id: "hopital",
  nom: "L'hôpital pavillonnaire",
  lieu: "Hôpital · Ville · lointain",
  environnement: "ville",
  anneau: "lointain",
  danger: 5,
  recit:
    "On y a soigné la ville pendant un siècle, puis on y a regroupé les malades de la fièvre grise derrière des sacs de sable. Les tentes de triage sont restées dressées, l'horloge s'est arrêtée à 4 h 12, et la borne d'accueil vous demande toujours de sourire pour votre diagnostic. Sur les cartes des survivants, quelqu'un a entouré l'hôpital et écrit « NON. » : la pharmacie, elle, n'a jamais été vidée.",
  inspiration:
    "Beelitz-Heilstätten, les hôpitaux pavillonnaires français des années 1930 (brique et bandeaux de béton blanc), les sanatoriums abandonnés, les photographies d'urbex hospitalier : couloirs carrelés vert d'eau, lits à roulettes rouillés, fauteuils roulants, lampe scialytique, chapelle d'hôpital",
  reperes: [
    "La silhouette : corps central à trois niveaux, fronton à l'horloge arrêtée (4 h 12), ailes basses sous l'ardoise, bandeaux de béton blanc sur la brique",
    "L'auvent des URGENCES en béton, le G tombé, l'ambulance rouillée aux pneus à plat",
    "Les tentes de triage de la fièvre grise, une affaissée ; sacs de sable, barrières, panneaux QUARANTAINE, brancards abandonnés",
    "Le bout de l'aile est : l'étage effondré dans la salle du dessous, la dalle qui pend, un bouleau qui pousse dans les gravats",
    "La galerie à arcades qui mène à la chapelle (rosace brisée, clocheton, bancs renversés)",
    "Le hall : guichet d'accueil, chaises en rangs, panneaux de direction, borne « Diagnostic IA — Veuillez sourire » qui luit encore la nuit, distributeur de « vitamines connectées »",
    "Le couloir carrelé vert d'eau : lits à roulettes, fauteuils roulants, néon SORTIE qui grésille sur sa batterie",
    "La pharmacie : étagères renversées, armoire à médicaments grillagée (le trésor) ; le bloc opératoire et sa lampe scialytique",
    "L'escalier effondré du hall : les étages sont visibles mais inaccessibles",
  ],
  cartes: [
    {
      id: "cour",
      nom: "La cour et l'entrée des urgences",
      lot: { l: 68, p: 52 },
      depart: versCarte("cour", [{ x: 8, z: 33 }])[0],
      description: "la cour de triage, l'auvent des urgences, le hall d'accueil, la galerie et la chapelle",
      entrees: versCarte("cour", [
        { x: 8, z: 35, nature: "le portail de l'hôpital (un vantail arraché)" },
        { x: 29, z: 35, nature: "la clôture tombée, au sud-est" },
        { x: 0, z: 8.5, nature: "la porte des urgences, sous l'auvent (vers le hall)" },
        { x: 6, z: -4.6, nature: "le couloir de l'aile est, barricadé de lits (vers la carte « l'aile des soins »)" },
        { x: -6, z: -4.6, nature: "le couloir de l'aile ouest, barricadé (vers la carte « l'aile des soins »)" },
        { x: -15.5, z: 29, nature: "la porte latérale de la chapelle" },
        { x: 0, z: -6, nature: "la porte de service, au nord du hall" },
      ]),
      fouille: versCarte("cour", [
        { x: 15.5, z: 19.5, quoi: "tente de triage : caisses de matériel de soin (bandages, compresses, attelles, alcool), une lampe torche tombée" },
        { x: 8.5, z: 13.5, quoi: "ambulance : trousse de secours, brancard, bouteille d'oxygène vide, gyrophare (électronique)" },
        { x: 3.6, z: -1.6, quoi: "guichet d'accueil : registres, trousseau de clés étiquetées (dont « PHARMACIE »), boîte de gants" },
        { x: 4.6, z: 7.6, quoi: "distributeur de « vitamines connectées » : gélules périmées, écran et carte électronique à démonter" },
        { x: -3.8, z: 7.6, quoi: "borne « Diagnostic IA » : batterie encore chargée, composants électroniques" },
        { x: -12, z: 21, quoi: "poste de contrôle militaire : caisse de munitions vide, rations, gilet, radio muette" },
        { x: -19.5, z: 26, quoi: "chapelle : cierges, troncs d'offrandes, nappe d'autel (tissu)" },
        { x: 21, z: 23.5, quoi: "tente affaissée : lits de camp (toile, tubes), couvertures" },
      ]),
      eteints: versCarte("cour", [
        { x: 4, z: 18, type: "errant" },
        { x: -6, z: 15, type: "errant" },
        { x: 13, z: 27, type: "errant" },
        { x: 24, z: 14, type: "errant" },
        { x: -2, z: 29, type: "errant" },
        { x: 9.5, z: 11.6, type: "rampant (sous l'ambulance)" },
        { x: 19.5, z: 25, type: "rampant (dans les herbes, sous la tente affaissée)" },
        { x: -9, z: 26, type: "rampant (herbes hautes près du poste de contrôle)" },
        { x: 15, z: 18.5, type: "putréfié (dans la tente de triage)" },
        { x: 17, z: 20.5, type: "putréfié (dans la tente de triage)" },
        { x: 1.5, z: 1.5, type: "ancien habitant (infirmière, trousse à croix rouge)" },
        { x: 6.5, z: 14, type: "ancien habitant (ambulancier)" },
        { x: -13, z: 20, type: "ancien habitant (soldat, masque à gaz)" },
        { x: -19.5, z: 14, type: "errant (dans la galerie)" },
        { x: -18.5, z: 30, type: "errant (à genoux devant l'autel)" },
        { x: -3, z: 4, type: "errant (assis dans les chaises du hall)" },
        { x: 22, z: 9, type: "errant (sur les gravats de l'aile effondrée)" },
      ]),
    },
    {
      id: "soins",
      nom: "L'aile des soins",
      lot: { l: 56, p: 26 },
      depart: versCarte("soins", [{ x: 0, z: 4.5 }])[0],
      description: "le hall, le couloir carrelé, la salle des malades, la pharmacie, le bloc opératoire, la salle effondrée",
      entrees: versCarte("soins", [
        { x: 0, z: 8.5, nature: "la porte des urgences (vers la carte « la cour »)" },
        { x: 0, z: -6, nature: "la porte de service, au nord du hall" },
        { x: 24, z: 1.5, nature: "la brèche de la salle effondrée, à l'est (on escalade les gravats)" },
        { x: -19.5, z: 6, nature: "la porte de la galerie (vers la chapelle, carte « la cour »)" },
      ]),
      fouille: versCarte("soins", [
        { x: 8.5, z: 4.9, quoi: "armoire à médicaments grillagée : antibiotiques, antalgiques, seringues (fermée : clé du guichet ou pied-de-biche)" },
        { x: 6.9, z: -1.5, quoi: "réfrigérateur de la pharmacie : vaccins antitétaniques (à garder au froid)" },
        { x: 9.2, z: 0.6, quoi: "étagères renversées : compresses, bandes, alcool, flacons éparpillés" },
        { x: 13.4, z: 2.2, quoi: "chariot d'instruments du bloc : scalpels, pinces, fil de suture" },
        { x: 16.5, z: -1.4, quoi: "armoire du bloc : champs stériles, gants, masques" },
        { x: -2.2, z: -4.5, quoi: "chariot de soins de l'infirmière, dans le couloir" },
        { x: -10.5, z: 4.6, quoi: "chambre : tables de chevet, effets personnels" },
        { x: -21, z: -1.5, quoi: "salle des malades : couvertures, oreillers, bassin" },
        { x: 21.5, z: 4.5, quoi: "sous les gravats : un chariot de soins écrasé" },
      ]),
      eteints: versCarte("soins", [
        { x: -15, z: -4.6, type: "errant (dans le couloir)" },
        { x: 14, z: -4.4, type: "errant (dans le couloir)" },
        { x: 20.5, z: -4.8, type: "errant (au fond du couloir)" },
        { x: -9, z: -4.9, type: "rampant (sous un lit du couloir)" },
        { x: -17, z: 2.8, type: "rampant (sous un lit de la salle des malades)" },
        { x: 9.5, z: 2.5, type: "ancien habitant (infirmière, trousse à croix rouge)" },
        { x: 14.5, z: 1, type: "putréfié (près de la table d'opération)" },
        { x: -20.5, z: 0.5, type: "errant (salle des malades)" },
        { x: -14.5, z: 4.5, type: "errant (salle des malades)" },
        { x: -22.5, z: 4, type: "putréfié (salle des malades)" },
        { x: -8.5, z: 1.5, type: "errant (dans la chambre)" },
        { x: 21, z: 1.5, type: "errant (pris dans les gravats)" },
        { x: 22.5, z: -0.5, type: "rampant (sous la dalle tombée)" },
        { x: 3, z: -4, type: "ancien habitant (médecin, stéthoscope)" },
      ]),
    },
  ],
};

// ---------- Mesures du pavillon ----------

const RDC = 3.5; // hauteur du rez-de-chaussée
const E1 = 6.8; // haut du premier étage
const E2 = 10.1; // haut du deuxième étage (corps central)
const CUT = 0.9; // coupe des façades côté caméra (hauteur d'allège)
const CUTI = 1.2; // coupe des cloisons intérieures
const EP = 0.4; // murs extérieurs
const EPI = 0.2; // cloisons
const ZC = 8.5; // façade avancée du corps central
const ZK = -3.2; // mur sud du couloir

const COUL = {
  brique: 0xa0624b,
  betonBlanc: 0xddd8cb,
  betonGris: 0xa39f94,
  faience: 0xa3c7b8,
  peinture: 0xd5d6c2,
  sol: 0xd8d0bb,
  solBloc: 0xaecabe,
  cadre: 0x56625e,
  fer: 0xc8c6b8,
  roulette: 0x2c2a28,
  matelas: 0xbeb79f,
  draps: 0xd6d3c6,
  kaki: 0x7a7b57,
  toileBlanche: 0xc9c5b5,
  sable: 0xb9a37c,
  ambulance: 0xd6d2c4,
  rougePasse: 0xb0473b,
  canard: 0x4f7c7c,
  zinc: PALETTE.zinc,
  asphalte: 0x8f8c84,
};

// ---------- Matières propres au lieu (créées une fois, partagées) ----------

const AL = 1024;
const AH = 1536;

/** L'atlas des enseignes, affiches et pictogrammes (une seule matière pour tous) : [x, y, l, h] en pixels. */
const R = {
  urgences: [0, 0, 1024, 128],
  quarantaine: [0, 128, 512, 128],
  sortie: [512, 128, 256, 128],
  croix: [768, 128, 128, 128],
  horloge: [896, 128, 128, 128],
  ambulance: [0, 256, 512, 128],
  pharmacie: [512, 256, 512, 128],
  bloc: [0, 384, 512, 128],
  accueil: [512, 384, 512, 128],
  ia: [0, 512, 384, 256],
  directions: [384, 512, 384, 256],
  non: [768, 512, 256, 256],
  vitamines: [0, 768, 256, 384],
  affiche: [256, 768, 256, 384],
  graffiti: [512, 768, 512, 192],
  titre: [512, 960, 512, 192],
  grille: [0, 1152, 512, 384],
  rosace: [512, 1152, 256, 256],
  danger: [768, 1152, 256, 256],
  lettreG: [768, 1408, 128, 128],
};

let MATS = null;

function matieres() {
  if (MATS) return MATS;
  const atlas = dessiner("hopital-atlas", AL, AH, dessinerAtlas, false);
  const faience = matiereTexture(dessiner("hopital-faience", 256, 256, dessinerFaience), { roughness: 0.45 });
  faience.userData.tuile = 1;
  const asphalte = matiereTexture(dessiner("hopital-asphalte", 256, 256, dessinerAsphalte), { roughness: 0.95 });
  asphalte.userData.tuile = 4;
  const enseignes = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.85, alphaTest: 0.5, side: THREE.DoubleSide });
  const neon = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 1.1, vertexColors: true, roughness: 0.5, alphaTest: 0.5, side: THREE.DoubleSide });
  neon.userData.sansOmbre = true;
  MATS = {
    brique: matiereMonde("brique"),
    beton: matiereMonde("beton"),
    enduit: matiereMonde("enduit"),
    carrelage: matiereMonde("carrelage"),
    ardoise: matiereMonde("ardoise"),
    faience,
    asphalte,
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    enseignes,
    neon,
    tole: MAT.tole(),
    mat: matiere(0.95),
    satin: matiere(0.6, 0.05),
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

function texte(g, t, x, y, taille, couleur, police = "900", align = "center", rotation = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(rotation);
  g.font = `${police} ${taille}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  g.fillStyle = couleur;
  g.textAlign = align;
  g.textBaseline = "middle";
  g.fillText(t, 0, 0);
  g.restore();
}

function croixRouge(g, cx, cy, s, rouge = "#c8362b") {
  g.fillStyle = rouge;
  g.fillRect(cx - s * 0.18, cy - s * 0.5, s * 0.36, s);
  g.fillRect(cx - s * 0.5, cy - s * 0.18, s, s * 0.36);
}

function dessinerAtlas(g) {
  const a = aleatoire(1931);
  g.clearRect(0, 0, AL, AH);

  // URGENCES : lettres rouges passées sur béton, le G est tombé (il reste sa trace), un E pend de travers
  {
    const [x, y, l, h] = R.urgences;
    g.fillStyle = "#d9d4c7";
    g.fillRect(x, y, l, h);
    const lettres = "URGENCES";
    const pas = l / (lettres.length + 0.6);
    for (let i = 0; i < lettres.length; i++) {
      const cx = x + pas * (i + 0.8);
      if (i === 2) texte(g, "G", cx, y + h / 2, 104, "rgba(60,50,40,0.13)");
      else if (i === 6) texte(g, "E", cx + 6, y + h / 2 + 14, 104, "#a8433a", "900", "center", 0.38);
      else texte(g, lettres[i], cx, y + h / 2, 104, i === 4 ? "#9b4a40" : "#a8433a");
    }
    salir(g, a, x, y, l, h, 1.4);
  }
  // QUARANTAINE : bandes jaunes et noires, pochoir
  {
    const [x, y, l, h] = R.quarantaine;
    g.fillStyle = "#d4b53e";
    g.fillRect(x, y, l, h);
    g.save();
    g.beginPath();
    g.rect(x, y, l, h);
    g.clip();
    g.fillStyle = "#2a2826";
    for (let k = -h; k < l; k += 48) {
      for (const yy of [y, y + h - 22]) {
        g.beginPath();
        g.moveTo(x + k, yy + 22);
        g.lineTo(x + k + 22, yy);
        g.lineTo(x + k + 44, yy);
        g.lineTo(x + k + 22, yy + 22);
        g.fill();
      }
    }
    g.restore();
    texte(g, "QUARANTAINE", x + l / 2, y + h / 2 + 2, 62, "#24221f");
    salir(g, a, x, y, l, h, 1.2);
  }
  // SORTIE : néon vert, bonhomme qui court
  {
    const [x, y, l, h] = R.sortie;
    g.fillStyle = "#1f8a4c";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#e9fff1";
    g.fillRect(x + 6, y + 6, l - 12, 4);
    texte(g, "SORTIE", x + l * 0.6, y + h / 2, 52, "#effff4");
    g.strokeStyle = "#effff4";
    g.lineWidth = 9;
    g.lineCap = "round";
    const bx = x + 36;
    const by = y + 40;
    g.beginPath();
    g.arc(bx + 6, by - 8, 8, 0, 7);
    g.fillStyle = "#effff4";
    g.fill();
    g.beginPath();
    g.moveTo(bx + 2, by + 6);
    g.lineTo(bx - 4, by + 34);
    g.lineTo(bx - 18, by + 54);
    g.moveTo(bx - 4, by + 34);
    g.lineTo(bx + 14, by + 50);
    g.lineTo(bx + 10, by + 66);
    g.moveTo(bx - 14, by + 14);
    g.lineTo(bx + 2, by + 6);
    g.lineTo(bx + 18, by + 22);
    g.stroke();
  }
  // Croix rouge sur fond blanc
  {
    const [x, y, l, h] = R.croix;
    g.fillStyle = "#e6e2d6";
    g.fillRect(x, y, l, h);
    croixRouge(g, x + l / 2, y + h / 2, l * 0.78);
    salir(g, a, x, y, l, h, 1);
  }
  // L'horloge : cadran crème, aiguilles arrêtées à 4 h 12
  {
    const [x, y, l, h] = R.horloge;
    const cx = x + l / 2;
    const cy = y + h / 2;
    g.fillStyle = "#e7dfc8";
    g.beginPath();
    g.arc(cx, cy, l / 2 - 2, 0, 7);
    g.fill();
    g.strokeStyle = "#3a352e";
    g.lineWidth = 4;
    g.stroke();
    for (let i = 0; i < 12; i++) {
      const t = (i / 12) * Math.PI * 2;
      g.lineWidth = i % 3 ? 3 : 6;
      g.beginPath();
      g.moveTo(cx + Math.sin(t) * 48, cy - Math.cos(t) * 48);
      g.lineTo(cx + Math.sin(t) * 58, cy - Math.cos(t) * 58);
      g.stroke();
    }
    const aig = (ang, lg, ep) => {
      g.lineWidth = ep;
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.sin(ang) * lg, cy - Math.cos(ang) * lg);
      g.stroke();
    };
    aig(((4 + 12 / 60) / 12) * Math.PI * 2, 30, 7);
    aig((12 / 60) * Math.PI * 2, 46, 4);
    taches(g, a, 5, "rgba(80,70,50,0.25)", 6, 24, l, h);
    salir(g, a, x, y, l, h, 1.3);
  }
  // AMBULANCE (écrit à l'envers pour le capot ? non : sur les flancs)
  {
    const [x, y, l, h] = R.ambulance;
    g.fillStyle = "#d8d4c6";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#b0473b";
    g.fillRect(x, y + h - 30, l, 22);
    croixRouge(g, x + 52, y + 50, 64, "#b8362c");
    texte(g, "AMBULANCE", x + 290, y + 50, 50, "#a8433a");
    salir(g, a, x, y, l, h, 1.6);
  }
  // PHARMACIE : croix verte
  {
    const [x, y, l, h] = R.pharmacie;
    g.fillStyle = "#e3dfd2";
    g.fillRect(x, y, l, h);
    croixRouge(g, x + 64, y + h / 2, 84, "#3f8f5a");
    texte(g, "PHARMACIE", x + 300, y + h / 2, 64, "#2f5d47");
    salir(g, a, x, y, l, h, 1.2);
  }
  // BLOC OPÉRATOIRE
  {
    const [x, y, l, h] = R.bloc;
    g.fillStyle = "#e3dfd2";
    g.fillRect(x, y, l, h);
    texte(g, "BLOC OPÉRATOIRE", x + l / 2, y + 44, 50, "#2f4f5d");
    g.fillStyle = "#b0473b";
    g.fillRect(x + 20, y + 78, l - 40, 34);
    texte(g, "ACCÈS INTERDIT", x + l / 2, y + 96, 26, "#f1ece0");
    salir(g, a, x, y, l, h, 1.2);
  }
  // ACCUEIL — ADMISSIONS
  {
    const [x, y, l, h] = R.accueil;
    g.fillStyle = "#2f4f5d";
    g.fillRect(x, y, l, h);
    texte(g, "ACCUEIL", x + l / 2, y + 48, 62, "#ece6d6");
    texte(g, "ADMISSIONS · URGENCES", x + l / 2, y + 100, 26, "#c9c1ac", "700");
    salir(g, a, x, y, l, h, 1);
  }
  // La borne « Diagnostic IA — Veuillez sourire »
  {
    const [x, y, l, h] = R.ia;
    g.fillStyle = "#123342";
    g.fillRect(x, y, l, h);
    const d = g.createRadialGradient(x + l / 2, y + h / 2, 10, x + l / 2, y + h / 2, l * 0.6);
    d.addColorStop(0, "rgba(120,200,255,0.35)");
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
    texte(g, "DIAGNOSTIC IA", x + l / 2, y + 40, 38, "#bfe6ff");
    g.strokeStyle = "#ffe9a8";
    g.lineWidth = 7;
    g.beginPath();
    g.arc(x + l / 2, y + 124, 46, 0, 7);
    g.stroke();
    g.fillStyle = "#ffe9a8";
    g.fillRect(x + l / 2 - 22, y + 104, 9, 14);
    g.fillRect(x + l / 2 + 13, y + 104, 9, 14);
    g.beginPath();
    g.arc(x + l / 2, y + 128, 26, 0.2, Math.PI - 0.2);
    g.stroke();
    texte(g, "Veuillez sourire", x + l / 2, y + 202, 34, "#e8f6ff", "700");
    texte(g, "pour votre diagnostic", x + l / 2, y + 234, 20, "#9cc7dd", "600");
    // l'écran est fêlé
    g.strokeStyle = "rgba(230,240,255,0.55)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x + 300, y);
    g.lineTo(x + 268, y + 70);
    g.lineTo(x + 292, y + 120);
    g.lineTo(x + 250, y + 256);
    g.moveTo(x + 268, y + 70);
    g.lineTo(x + 384, y + 96);
    g.stroke();
  }
  // Panneau de directions (bleu canard, flèches)
  {
    const [x, y, l, h] = R.directions;
    g.fillStyle = "#2f5f6b";
    g.fillRect(x, y, l, h);
    const lignes = [["←", "Médecine · Salle commune"], ["→", "Pharmacie · Bloc opératoire"], ["↑", "Consultations (1er étage)"], ["←", "Chapelle · Galerie"]];
    lignes.forEach(([f, t], i) => {
      texte(g, f, x + 32, y + 34 + i * 62, 40, "#f0ebdc", "900");
      texte(g, t, x + 64, y + 36 + i * 62, 25, "#f0ebdc", "700", "left");
      g.fillStyle = "rgba(240,235,220,0.35)";
      g.fillRect(x + 12, y + 66 + i * 62, l - 24, 2);
    });
    // « Consultations » rayé au marqueur
    g.strokeStyle = "#1c1b19";
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(x + 60, y + 160);
    g.lineTo(x + 360, y + 150);
    g.stroke();
    salir(g, a, x, y, l, h, 1.3);
  }
  // « NON. » entouré à la bombe (comme sur la carte des survivants)
  {
    const [x, y, l, h] = R.non;
    texte(g, "NON.", x + l / 2, y + h / 2 + 4, 92, "rgba(25,24,22,0.92)", "900", "center", -0.08);
    g.strokeStyle = "rgba(25,24,22,0.9)";
    g.lineWidth = 9;
    g.beginPath();
    g.ellipse(x + l / 2, y + h / 2, l * 0.44, h * 0.3, -0.12, 0.3, Math.PI * 2.05);
    g.stroke();
  }
  // Distributeur de « vitamines connectées » : façade rouge de l'Abondance, rangées de gélules colorées
  {
    const [x, y, l, h] = R.vitamines;
    g.fillStyle = "#c8362b";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#e9dfc6";
    g.fillRect(x, y, l, 64);
    texte(g, "VITAMINES", x + l / 2, y + 22, 34, "#c8362b");
    texte(g, "CONNECTÉES", x + l / 2, y + 48, 22, "#2f6f73", "800");
    g.fillStyle = "#222a2c";
    g.fillRect(x + 14, y + 76, 160, 250);
    const tons = ["#e0b040", "#6fb3a8", "#e9dfc6", "#d97b4a", "#9fc46a"];
    for (let r = 0; r < 5; r++) for (let k = 0; k < 4; k++) {
      if (a() < 0.4) continue;
      g.fillStyle = tons[(r + k) % tons.length];
      g.beginPath();
      g.ellipse(x + 34 + k * 40, y + 104 + r * 48, 12, 7, 0.3, 0, 7);
      g.fill();
    }
    g.fillStyle = "#e9dfc6";
    g.fillRect(x + 186, y + 90, 56, 34);
    texte(g, "1 clic", x + 214, y + 107, 14, "#c8362b", "800");
    g.fillStyle = "#1a1a1a";
    g.fillRect(x + 190, y + 150, 48, 70);
    g.fillRect(x + 30, y + 340, 196, 26);
    salir(g, a, x, y, l, h, 1.4);
  }
  // Affiche de l'Abondance : « Santé+ Premium »
  {
    const [x, y, l, h] = R.affiche;
    g.fillStyle = "#e9dfc6";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#c8362b";
    g.fillRect(x, y, l, 92);
    texte(g, "SANTÉ+", x + l / 2, y + 38, 54, "#e9dfc6");
    texte(g, "PREMIUM", x + l / 2, y + 76, 26, "#e9dfc6", "800");
    g.fillStyle = "#2f6f73";
    g.beginPath();
    g.arc(x + l / 2, y + 180, 58, 0, 7);
    g.fill();
    g.fillStyle = "#e9dfc6";
    g.beginPath();
    g.arc(x + l / 2, y + 180, 38, 0.15, Math.PI - 0.15);
    g.fill();
    texte(g, "Guérissez plus vite,", x + l / 2, y + 274, 21, "#3a2f28", "800");
    texte(g, "payez plus tard.", x + l / 2, y + 302, 21, "#3a2f28", "800");
    texte(g, "Abonnement mensuel · sans engagement*", x + l / 2, y + 344, 11, "#6e6152", "600");
    // déchirée en bas à droite
    g.clearRect(x + 170, y + 318, 86, 66);
    g.clearRect(x + 200, y + 290, 56, 30);
    salir(g, a, x, y, l, h, 1.5);
  }
  // Graffiti à la bombe : « ILS SONT DEDANS »
  {
    const [x, y, l, h] = R.graffiti;
    texte(g, "ILS SONT", x + l / 2 - 20, y + 58, 64, "rgba(30,29,27,0.9)", "900", "center", -0.05);
    texte(g, "DEDANS", x + l / 2 + 10, y + 136, 78, "rgba(30,29,27,0.9)", "900", "center", -0.04);
    g.fillStyle = "rgba(30,29,27,0.7)";
    for (let i = 0; i < 6; i++) g.fillRect(x + 80 + a() * 360, y + 160, 3, 14 + a() * 18);
  }
  // Titre gravé au-dessus de l'entrée
  {
    const [x, y, l, h] = R.titre;
    texte(g, "HÔPITAL", x + l / 2, y + 66, 92, "rgba(70,64,56,0.95)");
    texte(g, "PAVILLON DES SOINS · 1931", x + l / 2, y + 146, 30, "rgba(70,64,56,0.9)", "800");
  }
  // Grille de clôture : barreaux à pointe, deux lisses (fond transparent)
  {
    const [x, y, l, h] = R.grille;
    g.fillStyle = "#2c2c29";
    g.fillRect(x, y + 40, l, 12);
    g.fillRect(x, y + h - 60, l, 12);
    for (let k = 10; k < l; k += 32) {
      g.fillRect(x + k, y + 30, 8, h - 30);
      g.beginPath();
      g.moveTo(x + k - 5, y + 32);
      g.lineTo(x + k + 4, y + 6);
      g.lineTo(x + k + 13, y + 32);
      g.fill();
    }
    g.fillStyle = "rgba(140,70,40,0.6)";
    for (let i = 0; i < 40; i++) g.fillRect(x + a() * l, y + 30 + a() * (h - 40), 6, 10 + a() * 20);
  }
  // Rosace de la chapelle : vitrail en éventail, des secteurs manquants
  {
    const [x, y, l, h] = R.rosace;
    const cx = x + l / 2;
    const cy = y + h / 2;
    const tons = ["#3f5f8f", "#c79a3b", "#9b3b35", "#4f7f55", "#6a4f8a"];
    for (let i = 0; i < 12; i++) {
      if (a() < 0.3) continue;
      g.fillStyle = tons[i % tons.length];
      g.beginPath();
      g.moveTo(cx, cy);
      g.arc(cx, cy, l / 2 - 6, (i / 12) * Math.PI * 2, ((i + 1) / 12) * Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = "#2a2824";
    g.lineWidth = 6;
    for (let i = 0; i < 12; i++) {
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos((i / 12) * Math.PI * 2) * (l / 2 - 6), cy + Math.sin((i / 12) * Math.PI * 2) * (l / 2 - 6));
      g.stroke();
    }
    g.beginPath();
    g.arc(cx, cy, 34, 0, 7);
    g.fillStyle = "#c79a3b";
    g.fill();
    g.stroke();
  }
  // Danger : « FIÈVRE GRISE — ZONE CONTAMINÉE »
  {
    const [x, y, l, h] = R.danger;
    g.fillStyle = "#e3dccb";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#d4b53e";
    g.beginPath();
    g.moveTo(x + l / 2, y + 14);
    g.lineTo(x + l / 2 + 64, y + 124);
    g.lineTo(x + l / 2 - 64, y + 124);
    g.fill();
    texte(g, "!", x + l / 2, y + 88, 70, "#24221f");
    texte(g, "FIÈVRE GRISE", x + l / 2, y + 160, 30, "#24221f");
    texte(g, "ZONE CONTAMINÉE", x + l / 2, y + 196, 22, "#24221f", "800");
    texte(g, "NE PAS ENTRER", x + l / 2, y + 228, 22, "#9b3b35", "800");
    salir(g, a, x, y, l, h, 1.5);
  }
  dessinerLettreG(g);
}

/** La lettre G tombée de l'enseigne (dessinée seule, fond transparent). */
function dessinerLettreG(g) {
  const [x, y, l, h] = R.lettreG;
  texte(g, "G", x + l / 2, y + h / 2 + 4, 120, "#a8433a");
}

/** Asphalte fatigué : grain, plaques reprises, fissures en réseau, taches d'huile. Tuile de 4 m. */
function dessinerAsphalte(g) {
  const a = aleatoire(57);
  g.fillStyle = "#c9c6bf";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5000; i++) {
    const v = 150 + Math.floor(a() * 90);
    g.fillStyle = `rgba(${v},${v},${v - 6},0.35)`;
    g.fillRect(a() * 256, a() * 256, 1 + a() * 2, 1 + a() * 2);
  }
  g.fillStyle = "rgba(60,58,52,0.18)";
  g.fillRect(40, 150, 120, 70);
  taches(g, a, 6, "rgba(30, 28, 24, 0.25)", 8, 26, 256, 256);
  taches(g, a, 6, "rgba(90, 110, 60, 0.22)", 10, 30, 256, 256);
  g.strokeStyle = "rgba(40,38,34,0.55)";
  g.lineWidth = 1.5;
  for (let i = 0; i < 9; i++) {
    let x = a() * 256;
    let y = a() * 256;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 7; k++) {
      x += (a() - 0.5) * 50;
      y += (a() - 0.5) * 50;
      g.lineTo(x, y);
    }
    g.stroke();
  }
}

/** Faïence murale vert d'eau : petits carreaux de 12,5 cm, joints, carreaux manquants, coulures. Tuile de 1 m. */
function dessinerFaience(g) {
  const a = aleatoire(31);
  g.fillStyle = "#8f938c";
  g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 32) for (let y = 0; y < 256; y += 32) {
    const v = 238 + Math.floor((a() - 0.5) * 16);
    const manque = a() < 0.04;
    g.fillStyle = manque ? "#9c9586" : `rgb(${v},${v},${v - 3})`;
    g.fillRect(x + 1.5, y + 1.5, 29, 29);
    if (!manque) {
      g.fillStyle = "rgba(255,255,255,0.25)";
      g.fillRect(x + 4, y + 4, 10, 3);
    }
  }
  taches(g, a, 8, "rgba(70, 64, 48, 0.2)", 8, 34, 256, 256);
  for (let i = 0; i < 14; i++) {
    const x = a() * 256;
    const lg = 60 + a() * 140;
    const d = g.createLinearGradient(0, 0, 0, lg);
    d.addColorStop(0, "rgba(60,54,40,0.25)");
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(x, 0, 2 + a() * 4, lg);
  }
}

// ---------- Outils géométriques ----------

const GEO = {};

/** Un prisme triangulaire (pignon, fronton de tente) : base `l` centrée en x, sommet à `h`, épaisseur `ep` en z. */
function geoTriangle(l, h, ep) {
  const cle = `tri|${l}|${h}|${ep}`;
  if (!GEO[cle]) {
    const s = new THREE.Shape([new THREE.Vector2(-l / 2, 0), new THREE.Vector2(l / 2, 0), new THREE.Vector2(0, h)]);
    GEO[cle] = new THREE.ExtrudeGeometry(s, { depth: ep, bevelEnabled: false }).translate(0, 0, -ep / 2);
  }
  return GEO[cle];
}

/** Un panneau d'arcade : mur de `l` × `h` percé d'un arc en plein cintre (ouverture `ouv`, naissance à `hn`). */
function geoArcade(l, h, ouv, hn, ep) {
  const cle = `arc|${l}|${h}|${ouv}|${hn}|${ep}`;
  if (!GEO[cle]) {
    const s = new THREE.Shape();
    s.moveTo(-l / 2, 0);
    s.lineTo(-ouv / 2, 0);
    s.lineTo(-ouv / 2, hn);
    s.absarc(0, hn, ouv / 2, Math.PI, 0, true);
    s.lineTo(ouv / 2, 0);
    s.lineTo(l / 2, 0);
    s.lineTo(l / 2, h);
    s.lineTo(-l / 2, h);
    s.lineTo(-l / 2, 0);
    GEO[cle] = new THREE.ExtrudeGeometry(s, { depth: ep, bevelEnabled: false, curveSegments: 7 }).translate(0, 0, -ep / 2);
  }
  return GEO[cle];
}

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
  c.poser(g, mat, 0xffffff, pose, { crasse: false, nuance: 0 });
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
 * Un mur coupé : le bas (0 → `cut`) reste toujours visible, le haut (`cut` → h) va dans la couche qui s'efface.
 * `breches` s'appliquent au haut. Les obstacles (pour le jeu) suivent les ouvertures qui descendent au sol.
 */
function murCoupe(k, a, b, spec) {
  const { h, cut = CUT, ouvertures = [], breches = [], obstacles = true, ...reste } = spec;
  if (cut > 0) mur(k.c, a, b, { ...reste, h: cut, ouvertures: tranche(ouvertures, 0, cut) });
  if (h > cut) mur(cut > 0 ? k.T : k.c, a, b, { ...reste, y0: cut, h: h - cut, ouvertures: tranche(ouvertures, cut, h), breches });
  if (obstacles) {
    const { L, dx, dz } = repereMur(a, b);
    const trous = ouvertures.filter((o) => o.bas < 0.5 && o.haut > 0.5).map((o) => [o.u - o.l / 2, o.u + o.l / 2]);
    for (const [u1, u2] of soustraire(0, L, trous)) k.b.obstacle(a[0] + (dx * u1) / L, a[1] + (dz * u1) / L, a[0] + (dx * u2) / L, a[1] + (dz * u2) / L);
  }
}

/**
 * Un revêtement intérieur (faïence, peinture) plaqué sur la face d'un mur (`cote` -1 : face locale -z, +1 : face +z),
 * en bandes horizontales [{ y1, y2, mat, couleur }], coupé à `cut` entre le chantier visible et la couche.
 */
function doublage(k, a, b, ep, spec) {
  const { cut = CUT, ouvertures = [], bandes, cote = -1, retrait = 0 } = spec;
  const { ry, L, dx, dz } = repereMur(a, b);
  const nx = Math.sin(ry);
  const nz = Math.cos(ry);
  const s = cote * (ep / 2 + 0.012);
  const ux = dx / L;
  const uz = dz / L;
  const a2 = [a[0] + nx * s + ux * retrait, a[1] + nz * s + uz * retrait];
  const b2 = [b[0] + nx * s - ux * retrait, b[1] + nz * s - uz * retrait];
  const ouv = ouvertures.map((o) => ({ ...o, u: o.u - retrait }));
  for (const bd of bandes) {
    for (const [p0, p1, ch] of [[bd.y1, Math.min(bd.y2, cut), k.c], [Math.max(bd.y1, cut), bd.y2, k.T]]) {
      if (p1 - p0 < 0.02) continue;
      mur(ch, a2, b2, { y0: p0, h: p1 - p0, ep: 0.02, couleur: bd.couleur, mat: bd.mat, ouvertures: tranche(ouv, p0, p1).map((o) => ({ ...o, type: "vide" })) });
    }
  }
}

/** Des bandes horizontales en saillie sur la face extérieure (+z local) d'un mur : [{ y1, y2, s, couleur, mat, ch, trous, deborde }]. */
function bandes(a, b, ep, liste) {
  const { L, ry } = repereMur(a, b);
  for (const bd of liste) {
    const d = bd.deborde ?? bd.s;
    bd.ch.repere({ x: a[0], z: a[1], ry }, () => {
      for (const [u1, u2] of soustraire(-d, L + d, bd.trous ?? [])) bd.ch.pave(u1, bd.y1, ep / 2 - 0.02, u2, bd.y2, ep / 2 + bd.s, bd.couleur, bd.mat, { nuance: 0.03, crasse: bd.y1 < 1 });
    });
  }
}

/** Une descente d'eau en zinc (dans le repère du mur, à `u`), du chéneau jusqu'au sol, avec son dauphin. */
function descente(ch, a, b, ep, u, haut, cassee = false) {
  const { ry } = repereMur(a, b);
  const m = matieres();
  ch.repere({ x: a[0], z: a[1], ry }, () => {
    const z = ep / 2 + 0.14;
    const bas = cassee ? haut * 0.45 : 0.15;
    ch.tube([u, bas, z], [u, haut, z], 0.055, COUL.zinc, m.tole, 6);
    ch.boite(0.24, 0.14, 0.3, COUL.zinc, { x: u, y: haut + 0.05, z: z - 0.05 }, m.tole);
    for (let y = bas + 0.4; y < haut; y += 1.6) ch.boite(0.03, 0.03, 0.16, 0x4a4a46, { x: u, y, z: z - 0.08 }, m.tole);
    if (cassee) ch.tube([u, bas, z], [u + 0.5, bas - 0.9, z + 0.4], 0.055, COUL.zinc, m.tole, 6);
  });
}

// ---------- Le bâtiment ----------

export function creer({ usure = 0.7, carte } = {}) {
  const id = carte === "soins" ? "soins" : "cour";
  const b = new Batiment(1931, usure);
  const m = matieres();
  // La couche du pavillon : haut des murs du rez-de-chaussée, étages, toits (tout ce qui s'efface quand on entre).
  // Sa boîte s'arrête au nu des ailes : longer la façade ne fait pas disparaître le bâtiment.
  const T = b.couche("pavillon", { x: 0, z: 0.2, l: 48.8, p: 12.8 }, CUT, 12.8);
  // L'auvent des urgences
  const A = b.couche("auvent", { x: 0, z: 10.8, l: 10.6, p: 4.8 }, 3.0, 3.8);
  const k = { b, c: b.c, T, A, m, usure, id, cour: id === "cour", soins: id === "soins", bris: 0.25 + 0.65 * usure };
  if (k.cour) k.G = b.couche("galerie", { x: -19.5, z: 20, l: 9, p: 28 }, CUTI, 9.5);

  sols(k);
  facades(k);
  etages(k);
  toits(k);
  interieurCommun(k);
  hall(k);
  effondrement(k);
  auvent(k);
  if (k.soins) {
    aileDesSoins(k);
    pharmacie(k);
    bloc(k);
  } else {
    ailesFermees(k);
  }
  if (k.cour) {
    cour(k);
    galerieEtChapelle(k);
  } else {
    abordsSoins(k);
  }
  arriere(k);

  // Le néon SORTIE grésille sur sa batterie ; la borne IA luit, imperturbable.
  const anime = new THREE.Object3D();
  let prochain = 0;
  let etat = 1;
  anime.userData.animer = (t) => {
    if (t > prochain) {
      etat = Math.random() < 0.82 ? 1 : 0.15 + Math.random() * 0.4;
      prochain = t + (etat < 1 ? 0.04 + Math.random() * 0.12 : 0.3 + Math.random() * 2.5);
    }
    m.neon.emissiveIntensity = 1.1 * etat;
  };
  b.ajouter(anime);

  if (k.cour) {
    b.lumiere(0, 2.9, 7.6, 0x6dffa8, 5, 9, "néon SORTIE (batterie)");
    b.lumiere(15.6, 0.25, 19.6, 0xdfeaff, 6, 8, "lampe torche tombée");
    b.lumiere(-3.8, 1.4, 7.2, 0x8fc8ff, 3, 5, "écran de la borne IA");
    b.lumiere(-19.5, 1.0, 32.5, 0xffb060, 3, 6, "veilleuse de l'autel (bougie électrique)");
  } else {
    b.lumiere(-23, 2.7, -4.6, 0x6dffa8, 5, 9, "néon SORTIE (batterie)");
    b.lumiere(5.2, 2.7, -4.6, 0x6dffa8, 4, 8, "néon SORTIE (batterie)");
    b.lumiere(9.4, 0.25, 2.2, 0xdfeaff, 6, 8, "lampe torche tombée");
    b.lumiere(-3.8, 1.4, 7.2, 0x8fc8ff, 3, 5, "écran de la borne IA");
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

/** Ce chantier est-il dans le lot de la carte ? (pour ne pas poser ce qui déborde) */
function dansLot(k, x, z, marge = 0) {
  const o = CENTRES[k.id];
  const lot = FICHE.cartes.find((q) => q.id === k.id).lot;
  return Math.abs(x - o.x) <= lot.l / 2 + marge && Math.abs(z - o.z) <= lot.p / 2 + marge;
}

// ---------- Sols ----------

function sols(k) {
  const { c, m } = k;
  // Le carrelage du rez-de-chaussée
  c.pave(-24, 0, -6, 24, 0.06, 6, COUL.sol, m.carrelage, { crasse: false, nuance: 0 });
  c.pave(-6, 0, 6, 6, 0.06, ZC, COUL.sol, m.carrelage, { crasse: false, nuance: 0 });
  // Le soubassement du pavillon (socle de béton qui dépasse un peu)
  c.pave(-24.3, 0, -6.3, 24.3, 0.05, 6.3, COUL.betonGris, m.beton, { crasse: false, nuance: 0 });
  // Le perron des urgences : deux marches et une rampe pour les brancards
  c.pave(-3.2, 0, ZC, 3.2, 0.12, ZC + 0.8, COUL.betonGris, m.beton, { nuance: 0.02 });
  c.pave(3.2, 0, ZC, 5, 0.06, ZC + 0.8, COUL.betonGris, m.beton, { nuance: 0.02 });
}

// ---------- Les façades ----------

const OPT_FEN = () => ({ croisillons: 2, traverses: 3, appui: false, cadre: COUL.cadre, matCadre: MAT.tole() });

function facades(k) {
  const { c, T, m, usure } = k;
  const brique = { couleur: COUL.brique, mat: m.brique, ep: EP };
  const fen = (u, extra = {}) => ({ u, l: 2.2, bas: 0.95, haut: 2.9, type: "fenetre", ...OPT_FEN(), bris: k.bris, ...extra });
  const fenE = (u, extra = {}) => ({ u, l: 2.2, bas: 0.85, haut: 2.6, type: "fenetre", ...OPT_FEN(), bris: k.bris, ...extra });

  // Les bandeaux d'une façade de deux niveaux (aile) : soubassement, appuis, linteaux, corniche.
  const bandeauxAile = (a, bb, trousBas, trousHaut = [], corniche = true) => {
    bandes(a, bb, EP, [
      { y1: 0, y2: 0.62, s: 0.05, couleur: COUL.betonGris, mat: m.beton, ch: c, trous: trousBas },
      { y1: 0.84, y2: 0.95, s: 0.09, couleur: COUL.betonBlanc, mat: m.beton, ch: c, trous: trousBas },
      { y1: 2.9, y2: 3.75, s: 0.06, couleur: COUL.betonBlanc, mat: m.beton, ch: T },
      { y1: 4.26, y2: 4.36, s: 0.09, couleur: COUL.betonBlanc, mat: m.beton, ch: T, trous: trousHaut },
      { y1: 6.1, y2: 6.8, s: 0.06, couleur: COUL.betonBlanc, mat: m.beton, ch: T, trous: trousHaut },
      ...(corniche ? [{ y1: 6.8, y2: 7.02, s: 0.38, couleur: COUL.betonBlanc, mat: m.beton, ch: T, trous: trousHaut }] : []),
    ]);
  };

  // Aile ouest, façade sud (x -24 → -6) : la deuxième travée est la porte de la galerie
  {
    const a = [-24, 6];
    const bb = [-6, 6];
    const rdc = [];
    for (let i = 0; i < 6; i++) rdc.push(i === 1 ? { u: 4.5, l: 1.9, bas: 0, haut: 2.6, type: "vide" } : fen(1.5 + 3 * i));
    murCoupe(k, a, bb, { ...brique, h: RDC, ouvertures: rdc });
    mur(T, a, bb, { ...brique, y0: RDC, h: E1 - RDC, ouvertures: [0, 1, 2, 3, 4, 5].map((i) => fenE(1.5 + 3 * i)) });
    bandeauxAile(a, bb, [[3.55, 5.45]]);
    descente(T, a, bb, EP, 0.25, 6.9);
    descente(T, a, bb, EP, 17.6, 6.9, usure > 0.5);
    battants(c, -19.5, 6 + EP / 2, 0, 1.9, 2.6, k.cour ? "barricade" : "ouverts");
  }
  // Aile est, façade sud (x 6 → 24) : les deux dernières travées sont sous l'effondrement
  {
    const a = [6, 6];
    const bb = [24, 6];
    const rdc = [0, 1, 2, 3, 4, 5].map((i) => fen(1.5 + 3 * i, i >= 4 ? { bris: 1 } : {}));
    murCoupe(k, a, bb, { ...brique, h: RDC, ouvertures: rdc, breches: [{ u: 16.5, l: 4, profondeur: 1.2 * usure }] });
    const bre = [{ u: 15.4, l: 7.5, profondeur: 3.25 }];
    mur(T, a, bb, { ...brique, y0: RDC, h: E1 - RDC, ouvertures: [0, 1, 2, 3].map((i) => fenE(1.5 + 3 * i)), breches: bre, arase: 0.1 });
    bandeauxAile(a, bb, [], [[11.8, 18.5]]);
    bandes(a, bb, EP, [{ y1: 2.9, y2: 3.75, s: 0.06, couleur: COUL.betonBlanc, mat: m.beton, ch: T, trous: [[14.6, 18.4]] }]);
    descente(T, a, bb, EP, 0.25, 6.9, true);
  }
  // Corps central, façade sud (x -6 → 6, z = 8,5) : la grande porte des urgences, la cage d'escalier vitrée
  {
    const a = [-6, ZC];
    const bb = [6, ZC];
    const rdc = [fen(2, { l: 2.4 }), { u: 6, l: 2.8, bas: 0, haut: 2.8, type: "vide" }, fen(10, { l: 2.4 })];
    murCoupe(k, a, bb, { ...brique, h: RDC, ouvertures: rdc });
    for (const [y0, hh] of [[RDC, E1 - RDC], [E1, E2 - E1]]) {
      mur(T, a, bb, { ...brique, y0, h: hh, ouvertures: [fenE(2, { l: 2.4 }), { u: 6, l: 1.5, bas: 0.25, haut: 3.05, type: "fenetre", ...OPT_FEN(), traverses: 4, croisillons: 1, bris: k.bris }, fenE(10, { l: 2.4 })] });
    }
    bandes(a, bb, EP, [
      { y1: 0, y2: 0.62, s: 0.05, couleur: COUL.betonGris, mat: m.beton, ch: c, trous: [[4.6, 7.4]] },
      { y1: 0.84, y2: 0.95, s: 0.09, couleur: COUL.betonBlanc, mat: m.beton, ch: c, trous: [[4.6, 7.4]] },
      { y1: 2.9, y2: 3.75, s: 0.07, couleur: COUL.betonBlanc, mat: m.beton, ch: T },
      { y1: 4.26, y2: 4.36, s: 0.09, couleur: COUL.betonBlanc, mat: m.beton, ch: T, trous: [[5.1, 6.9]] },
      { y1: 6.1, y2: 7.05, s: 0.07, couleur: COUL.betonBlanc, mat: m.beton, ch: T, trous: [[5.1, 6.9]] },
      { y1: 7.56, y2: 7.66, s: 0.09, couleur: COUL.betonBlanc, mat: m.beton, ch: T, trous: [[5.1, 6.9]] },
      { y1: 9.4, y2: 10.1, s: 0.07, couleur: COUL.betonBlanc, mat: m.beton, ch: T },
      { y1: 10.1, y2: 10.32, s: 0.4, couleur: COUL.betonBlanc, mat: m.beton, ch: T },
    ]);
    // Pilastres de béton blanc : aux angles et autour de la cage d'escalier (la travée verticale)
    for (const x of [-6, -1.05, 1.05, 6]) {
      const l = Math.abs(x) > 5 ? 0.7 : 0.5;
      T.pave(x - l / 2, 0.9, ZC + 0.1, x + l / 2, 10.1, ZC + 0.32, COUL.betonBlanc, m.beton, { nuance: 0.02 });
      c.pave(x - l / 2, 0, ZC + 0.1, x + l / 2, 0.9, ZC + 0.32, COUL.betonGris, m.beton, { nuance: 0.02 });
    }
    // Le titre gravé au-dessus de la porte
    panneau(T, m.enseignes, R.titre, { x: 0, y: 3.32, z: ZC + 0.29 }, 2.0, 0.75);
    // Les battants des urgences : l'un ouvert, l'autre arraché
    battants(c, 0, ZC + EP / 2, 0, 2.8, 2.8, "urgences");
  }
  // Retours du corps central (x = ±6, z 6 → 8,5), sur trois niveaux
  for (const [a, bb] of [[[-6, 6], [-6, ZC]], [[6, ZC], [6, 6]]]) {
    murCoupe(k, a, bb, { ...brique, h: RDC, ouvertures: [] });
    mur(T, a, bb, { ...brique, y0: RDC, h: E2 - RDC, ouvertures: [{ u: 1.25, l: 0.8, bas: 1, haut: 2.6, type: "fenetre", ...OPT_FEN(), croisillons: 0, traverses: 2, bris: k.bris }] });
    bandes(a, bb, EP, [
      { y1: 0, y2: 0.62, s: 0.05, couleur: COUL.betonGris, mat: m.beton, ch: c },
      { y1: 2.9, y2: 3.75, s: 0.06, couleur: COUL.betonBlanc, mat: m.beton, ch: T },
      { y1: 6.1, y2: 7.05, s: 0.06, couleur: COUL.betonBlanc, mat: m.beton, ch: T },
      { y1: 9.4, y2: 10.32, s: 0.06, couleur: COUL.betonBlanc, mat: m.beton, ch: T },
    ]);
  }
  // Corps central au-dessus des ailes : les murs est et ouest du dernier étage, vus par-dessus les toits
  for (const [a, bb] of [[[-6, -6], [-6, 6]], [[6, 6], [6, -6]]]) {
    mur(T, a, bb, { ...brique, y0: E1, h: E2 - E1, ouvertures: [0, 1, 2, 3].map((i) => fenE(1.5 + 3 * i, { l: 1.6 })) });
    bandes(a, bb, EP, [{ y1: 9.4, y2: 10.32, s: 0.06, couleur: COUL.betonBlanc, mat: m.beton, ch: T }]);
  }

  // Façade nord (x 24 → -24) : fenêtres du couloir, porte de service ; mur plein (côté opposé à la caméra)
  {
    const a = [24, -6];
    const bb = [-24, -6];
    const ouv = [];
    const ouvE = [];
    for (let i = 0; i < 16; i++) {
      const u = 1.5 + 3 * i;
      const x = 24 - u;
      if (Math.abs(x) < 6) continue;
      ouv.push({ u, l: 1.8, bas: 1.0, haut: 2.8, type: "fenetre", ...OPT_FEN(), croisillons: 1, traverses: 2, bris: k.bris });
      if (!(x > 17)) ouvE.push({ u, l: 1.8, bas: 0.85, haut: 2.6, type: "fenetre", ...OPT_FEN(), croisillons: 1, traverses: 2, bris: k.bris });
    }
    ouv.push({ u: 24, l: 1.4, bas: 0, haut: 2.3, type: "vide" });
    ouv.push({ u: 21, l: 1.4, bas: 1.0, haut: 2.8, type: "fenetre", ...OPT_FEN(), croisillons: 1, traverses: 2, bris: k.bris });
    ouv.push({ u: 27, l: 1.4, bas: 1.0, haut: 2.8, type: "fenetre", ...OPT_FEN(), croisillons: 1, traverses: 2, bris: k.bris });
    murCoupe(k, a, bb, { ...brique, h: RDC, cut: 0, ouvertures: ouv });
    mur(T, a, bb, { ...brique, y0: RDC, h: E1 - RDC, ouvertures: ouvE, breches: [{ u: 3, l: 6, profondeur: 3.2 }] });
    mur(T, [6, -6], [-6, -6], { ...brique, y0: E1, h: E2 - E1, ouvertures: [1.5, 4.5, 7.5, 10.5].map((u) => ({ u, l: 1.8, bas: 0.85, haut: 2.6, type: "fenetre", ...OPT_FEN(), croisillons: 1, traverses: 2, bris: k.bris })) });
    bandes(a, bb, EP, [
      { y1: 0, y2: 0.62, s: 0.05, couleur: COUL.betonGris, mat: m.beton, ch: c, trous: [[23.3, 24.7]] },
      { y1: 2.9, y2: 3.75, s: 0.06, couleur: COUL.betonBlanc, mat: m.beton, ch: T },
      { y1: 6.1, y2: 6.8, s: 0.06, couleur: COUL.betonBlanc, mat: m.beton, ch: T, trous: [[0, 6.5]] },
      { y1: 6.8, y2: 7.02, s: 0.38, couleur: COUL.betonBlanc, mat: m.beton, ch: T, trous: [[0, 6.5]] },
    ]);
    bandes([6, -6], [-6, -6], EP, [{ y1: 9.4, y2: 10.32, s: 0.06, couleur: COUL.betonBlanc, mat: m.beton, ch: T }]);
    battants(c, 0, -6 - EP / 2, Math.PI, 1.4, 2.3, "service");
  }
  // Pignon ouest (z -6 → 6) : mur plein, lierre
  {
    const a = [-24, -6];
    const bb = [-24, 6];
    const ouv = [{ u: 1.4, l: 1.4, bas: 1.0, haut: 2.8 }, { u: 6, l: 2.2, bas: 0.95, haut: 2.9 }, { u: 9.6, l: 2.2, bas: 0.95, haut: 2.9 }].map((o) => ({ ...o, type: "fenetre", ...OPT_FEN(), bris: k.bris }));
    murCoupe(k, a, bb, { ...brique, h: RDC, cut: 0, ouvertures: ouv });
    mur(T, a, bb, { ...brique, y0: RDC, h: E1 - RDC, ouvertures: [{ u: 6, l: 2.2, bas: 0.85, haut: 2.6, type: "fenetre", ...OPT_FEN(), bris: k.bris }] });
    T.poser(geoTriangle(12.8, 2.7, EP), m.brique, COUL.brique, { x: -24, y: 7.0, z: 0, ry: Math.PI / 2 }, { nuance: 0.02, crasse: false });
    bandeauxAile(a, bb, []);
    if (k.cour || dansLot(k, -24, 0)) {
      lierre(c, -24.3, 0, 2, -Math.PI / 2, 6, 5.5, Math.round(70 + 90 * usure));
      lierre(T, -24.3, 3.5, -2.5, -Math.PI / 2, 4, 5, Math.round(30 + 40 * usure));
    }
  }
  // Pignon est (z 6 → -6) : la salle effondrée ; une brèche au rez-de-chaussée, l'étage ouvert
  {
    const a = [24, 6];
    const bb = [24, -6];
    const ouv = [
      { u: 1.9, l: 2.2, bas: 0.95, haut: 2.9, type: "fenetre", ...OPT_FEN(), bris: 1 },
      { u: 5.6, l: 2.6, bas: 0, haut: 2.7, type: "vide" },
      { u: 10.6, l: 1.4, bas: 1.0, haut: 2.8, type: "fenetre", ...OPT_FEN(), croisillons: 1, traverses: 2, bris: k.bris },
    ];
    murCoupe(k, a, bb, { ...brique, h: RDC, ouvertures: ouv, breches: [{ u: 5.4, l: 5, profondeur: 1.6 }, { u: 2, l: 3, profondeur: 1.0 }] });
    mur(T, a, bb, { ...brique, y0: RDC, h: E1 - RDC, ouvertures: [{ u: 10.4, l: 1.4, bas: 0.85, haut: 2.6, type: "fenetre", ...OPT_FEN(), croisillons: 1, traverses: 2, bris: k.bris }], breches: [{ u: 4.5, l: 9.5, profondeur: 3.3 }] });
    bandes(a, bb, EP, [
      { y1: 0, y2: 0.62, s: 0.05, couleur: COUL.betonGris, mat: m.beton, ch: c, trous: [[4.3, 6.9]] },
      { y1: 0.84, y2: 0.95, s: 0.09, couleur: COUL.betonBlanc, mat: m.beton, ch: c, trous: [[4.3, 6.9]] },
      { y1: 2.9, y2: 3.75, s: 0.06, couleur: COUL.betonBlanc, mat: m.beton, ch: T, trous: [[0.5, 8.3]] },
    ]);
  }
}

/** Une porte à deux battants (dans le repère monde : centre x, face z, orientation ry) : ouverts, arrachés, barricadés. */
function battants(c, x, z, ry, l, h, etat) {
  const m = matieres();
  c.repere({ x, z, ry }, () => {
    const lv = l / 2 - 0.04;
    const vantail = (sx, ang, tombe = false) => {
      if (tombe) {
        c.repere({ x: sx * 0.6, y: 0.08, z: 1.6, ry: 0.4 * sx, rx: -Math.PI / 2 + 0.06 }, () => {
          c.boite(lv, h - 0.05, 0.05, 0x8d9a92, { y: 0 }, m.satin);
          c.boite(lv * 0.6, h * 0.25, 0.06, 0x2a3236, { y: h * 0.15 }, m.verre);
        });
        return;
      }
      c.repere({ x: sx * (l / 2 - 0.02), y: 0, z: 0.02, ry: -sx * ang }, () => {
        c.boite(lv, h - 0.05, 0.05, 0x8d9a92, { x: (-sx * lv) / 2, y: (h - 0.05) / 2 }, m.satin, { nuance: 0.05 });
        c.boite(0.36, 0.36, 0.06, 0x2a3236, { x: (-sx * lv) / 2, y: h * 0.62 }, m.verre);
        c.boite(lv - 0.1, 0.2, 0.06, 0x6f6a5c, { x: (-sx * lv) / 2, y: 0.3 }, m.tole);
      });
    };
    if (etat === "urgences") {
      vantail(-1, 1.3);
      vantail(1, 0, true);
    } else if (etat === "service") {
      vantail(-1, 0.25);
      vantail(1, 0.05);
    } else if (etat === "ouverts") {
      vantail(-1, 1.45);
      vantail(1, 1.2);
    } else if (etat === "barricade") {
      vantail(-1, 0.02);
      vantail(1, 0.02);
      for (let i = 0; i < 4; i++) c.boite(l + 0.5, 0.18, 0.04, PALETTE.boisGris, { y: 0.5 + i * 0.55, z: 0.08, rz: (i % 2 ? 1 : -1) * 0.12 }, m.mat, { nuance: 0.08 });
    }
  });
}

// ---------- Étages (couche) : dalles, intérieur sombre, toit-terrasse du corps central ----------

function etages(k) {
  const { T, m } = k;
  const dalle = (x1, z1, x2, z2, y) => T.pave(x1, y, z1, x2, y + 0.28, z2, COUL.betonGris, m.beton, { nuance: 0.02, crasse: false });
  // Plafond du rez-de-chaussée (trou au-dessus de la salle effondrée)
  dalle(-24, -6, 18, 6, RDC);
  dalle(18, -6, 24, ZK, RDC);
  dalle(-6, 6, 6, ZC, RDC);
  // Plafond du 1er étage et toit-terrasse du corps central
  dalle(-6, -6, 6, ZC, E1);
  dalle(-6.2, -6.2, 6.2, ZC + 0.2, E2);
  // L'acrotère du toit-terrasse, et le fronton à l'horloge
  const y = E2 + 0.28;
  for (const [x1, z1, x2, z2] of [[-6.2, -6.2, 6.2, -5.95], [-6.2, ZC - 0.05, 6.2, ZC + 0.2], [-6.2, -6.2, -5.95, ZC + 0.2], [5.95, -6.2, 6.2, ZC + 0.2]]) T.pave(x1, y, z1, x2, y + 0.65, z2, COUL.betonBlanc, m.beton, { nuance: 0.02, crasse: false });
  // Fronton à redans (art déco) : trois gradins de béton blanc, l'horloge au centre
  T.pave(-3.6, y, ZC - 0.1, 3.6, y + 1.5, ZC + 0.22, COUL.betonBlanc, m.beton, { crasse: false });
  T.pave(-2.4, y + 1.5, ZC - 0.1, 2.4, y + 2.25, ZC + 0.22, COUL.betonBlanc, m.beton, { crasse: false });
  T.pave(-1.1, y + 2.25, ZC - 0.1, 1.1, y + 2.65, ZC + 0.22, COUL.betonBlanc, m.beton, { crasse: false });
  T.poser(geoCylindre(0.92, 0.16, 16), m.beton, COUL.betonGris, { x: 0, y: y + 1.35, z: ZC + 0.27, rx: Math.PI / 2 }, { crasse: false });
  panneau(T, m.enseignes, R.horloge, { x: 0, y: y + 1.35, z: ZC + 0.36 }, 1.6, 1.6);
  // Le mât de drapeau, nu
  T.tube([4.6, y, ZC - 0.6], [4.6, y + 4.2, ZC - 0.6], 0.04, 0x8d8f8a, m.tole, 5);
  // Sur le toit-terrasse : une cheminée de ventilation, la cage de l'ascenseur, une antenne tombée
  T.pave(-4.5, y, -4.5, -2.3, y + 1.8, -2.5, COUL.brique, m.brique, { crasse: false });
  T.pave(1.5, y, -5, 4.5, y + 2.2, -2.2, COUL.betonBlanc, m.beton, { crasse: false });
  T.poutre([0.5, y + 0.1, 2], [2.8, y + 0.4, 5.5], 0.06, 0x7a7c78, m.tole);
  mousse(T, -1.5, y, 1.5, 2.2, Math.round(4 + 6 * k.usure));
  touffes(T, [[-5.5, 7.5, y], [5.3, -5.4, y], [-0.5, 3, y], [2, 6, y]], PALETTE.herbeSeche);
  // L'intérieur des étages : quelques cloisons sombres, vues par les fenêtres
  for (const x of [-18, -12, 11, 15]) T.pave(x - 0.1, RDC + 0.28, ZK, x + 0.1, E1, 6, COUL.peinture, m.enduit, { nuance: 0.06 });
  T.pave(-24, RDC + 0.28, ZK - 0.1, 17, E1, ZK + 0.1, COUL.peinture, m.enduit, { nuance: 0.06 });
  for (const yy of [RDC + 0.28, E1 + 0.28]) T.pave(-5.8, yy, -2.2, 5.8, yy + 3, -2, COUL.peinture, m.enduit, { nuance: 0.06 });
}

// ---------- Toits d'ardoise des ailes ----------

function toits(k) {
  const { T, m, usure } = k;
  const y0 = 7.02;
  // Aile ouest : quelques ardoises manquantes
  toitDeuxPans(T, -15, 0, 18, 12, y0, 2.6, { debord: 0.35, trous: usure > 0.4 ? [{ u: 3, v: 1, l: 1.6, p: 0.45 }] : [] });
  // Aile est : intacte jusqu'à x = 17,5, puis effondrée (chevrons à nu)
  toitDeuxPans(T, 11.75, 0, 11.5, 12, y0, 2.6, { debord: 0.35, trous: [{ u: 4.6, v: 1, l: 2.2, p: 0.6 }, { u: 4.6, v: -1, l: 1.2, p: 0.35 }] });
  // La charpente du bout effondré : chevrons cassés, panne faîtière qui pend
  const rng = aleatoire(77);
  for (let x = 18.2; x < 24; x += 0.62) {
    if (rng() < 0.35) continue;
    for (const s of [-1, 1]) {
      if (rng() < 0.4) continue;
      const casse = rng();
      const fin = s * (6 * (0.35 + casse * 0.65));
      T.poutre([x, y0 + 2.6 - 0.1, 0], [x + (rng() - 0.5) * 0.4, y0 + 2.6 - 2.6 * Math.abs(fin) / 6 - rng() * 0.5, fin], 0.1, PALETTE.boisSombre, m.mat);
    }
  }
  T.poutre([17.6, y0 + 2.5, 0], [22, y0 + 0.4, 0.4], 0.18, PALETTE.boisSombre, m.mat);
  T.poutre([17.6, y0 + 1.2, 3], [23.6, 4.2, 3.4], 0.16, PALETTE.boisSombre, m.mat);
  // Mousse et lichens sur les ardoises
  mousse(T, -19, y0 + 1.2, 3, 1.6, Math.round(3 + 6 * usure));
  mousse(T, 8, y0 + 1.1, -3, 1.4, Math.round(3 + 5 * usure));
  // Souches de cheminée en brique
  for (const [x, z] of [[-20, -1.8], [-10, -1.8], [9, -1.8]]) {
    T.pave(x - 0.45, y0 + 1.2, z - 0.3, x + 0.45, y0 + 3.6, z + 0.3, COUL.brique, m.brique, { crasse: false });
    T.pave(x - 0.55, y0 + 3.6, z - 0.4, x + 0.55, y0 + 3.75, z + 0.4, COUL.betonBlanc, m.beton, { crasse: false });
  }
}

// ---------- Cloisons et revêtements communs aux deux cartes ----------

function interieurCommun(k) {
  const { c, m } = k;
  const cloison = { ep: EPI, couleur: COUL.peinture, mat: m.enduit, cut: CUTI };
  const portes = {
    ouest: [{ u: 5.5, l: 1.9, bas: 0, haut: 2.3 }, { u: 14.5, l: 1.4, bas: 0, haut: 2.3 }],
    est: [{ u: 2.5, l: 1.2, bas: 0, haut: 2.2 }, { u: 8.5, l: 1.9, bas: 0, haut: 2.3 }, { u: 15, l: 1.5, bas: 0, haut: 2.3 }],
  };
  // Le mur sud du couloir (z = -3,2), portes des salles
  murCoupe(k, [-24, ZK], [-6, ZK], { ...cloison, h: RDC, ouvertures: portes.ouest.map((o) => ({ ...o, type: "vide" })) });
  murCoupe(k, [6, ZK], [24, ZK], { ...cloison, h: RDC, ouvertures: portes.est.map((o) => ({ ...o, type: "vide" })) });
  // Les cloisons entre salles
  murCoupe(k, [-13, ZK], [-13, 6], { ...cloison, h: RDC, ouvertures: [] });
  murCoupe(k, [11, ZK], [11, 6], { ...cloison, h: RDC, ouvertures: [] });
  murCoupe(k, [18, ZK], [18, 6], { ...cloison, h: RDC, ouvertures: [{ u: 5, l: 1.2, bas: 0, haut: 2.2, type: "vide" }], breches: [{ u: 7, l: 4, profondeur: 2 }] });
  // Les murs du hall (x = ±6) : un passage à double porte vers chaque couloir
  murCoupe(k, [-6, -6], [-6, 6], { ...cloison, ep: EP, h: RDC, ouvertures: [{ u: 1.4, l: 2.2, bas: 0, haut: 2.5, type: "vide" }] });
  murCoupe(k, [6, 6], [6, -6], { ...cloison, ep: EP, h: RDC, ouvertures: [{ u: 10.6, l: 2.2, bas: 0, haut: 2.5, type: "vide" }] });

  // Le couloir : faïence vert d'eau jusqu'à 1,6 m, peinture au-dessus, des deux côtés
  const peint = [{ y1: 0, y2: 1.6, mat: m.faience, couleur: COUL.faience }, { y1: 1.6, y2: RDC, mat: m.enduit, couleur: COUL.peinture }];
  for (const [a, bb, ouv] of [[[-24, ZK], [-6, ZK], portes.ouest], [[6, ZK], [24, ZK], portes.est]]) {
    doublage(k, a, bb, EPI, { cut: CUTI, ouvertures: ouv, bandes: peint, cote: -1 });
  }
  // côté nord du couloir (face intérieure du mur nord, face +z en partant de l'ouest)
  const fenN = [];
  for (let i = 0; i < 16; i++) {
    const x = -24 + 1.5 + 3 * i;
    if (Math.abs(x) < 6) continue;
    fenN.push({ u: x + 24, l: 1.8, bas: 1.0, haut: 2.8 });
  }
  doublage(k, [-24, -6], [-6, -6], EP, { cut: RDC, ouvertures: fenN, bandes: peint, cote: 1, retrait: 0.2 });
  doublage(k, [6, -6], [24, -6], EP, { cut: RDC, ouvertures: fenN.map((o) => ({ ...o, u: o.u - 30 })), bandes: peint, cote: 1, retrait: 0.2 });
  // Main courante le long du couloir
  for (const [x1, x2] of [[-23.6, -6.3], [6.3, 23.6]]) {
    c.tube([x1, 0.9, ZK - 0.17], [x2, 0.9, ZK - 0.17], 0.03, 0x8a8f7e, m.tole, 5);
    c.tube([x1, 0.9, -5.75], [x2, 0.9, -5.75], 0.03, 0x8a8f7e, m.tole, 5);
  }
  // Le hall : peinture pâle, soubassement de faïence
  const hallPeint = [{ y1: 0, y2: 1.2, mat: m.faience, couleur: 0xb9cfc2 }, { y1: 1.2, y2: RDC, mat: m.enduit, couleur: 0xd9d5c2 }];
  doublage(k, [-6, ZC], [6, ZC], EP, { cut: CUT, ouvertures: [{ u: 2, l: 2.4, bas: 0.95, haut: 2.9 }, { u: 6, l: 2.8, bas: 0, haut: 2.8 }, { u: 10, l: 2.4, bas: 0.95, haut: 2.9 }], bandes: hallPeint, cote: -1, retrait: 0.2 });
}

// ---------- Le hall d'accueil (les deux cartes) ----------

function hall(k) {
  const { c, T, m, usure } = k;
  // Le guichet : comptoir en L, hygiaphone, enseigne ACCUEIL
  c.pave(1.6, 0, -2.4, 5.8, 1.05, -1.8, 0x8e8a7a, m.satin, { nuance: 0.03 });
  c.pave(1.5, 1.05, -2.5, 5.8, 1.12, -1.7, 0xc9c3b0, m.satin);
  c.pave(1.6, 0, -1.8, 2.2, 1.05, 0.2, 0x8e8a7a, m.satin, { nuance: 0.03 });
  c.pave(1.5, 1.05, -1.8, 2.3, 1.12, 0.3, 0xc9c3b0, m.satin);
  for (const x of [2.4, 3.6, 4.8]) c.boite(1.0, 0.9, 0.02, 0xffffff, { x: x + 0.3, y: 1.6, z: -2.12 }, m.verre);
  c.pave(1.6, 2.05, -2.16, 5.8, 2.12, -2.08, COUL.cadre, m.tole);
  panneau(c, m.enseignes, R.accueil, { x: 3.7, y: 2.55, z: -2.0 }, 2.4, 0.6);
  k.b.obstacle(1.6, -2.1, 5.8, -2.1, "comptoir");
  k.b.obstacle(1.9, -1.8, 1.9, 0.2, "comptoir");
  // derrière : casiers à dossiers, une chaise de bureau renversée, des papiers
  c.pave(3.0, 0, -5.75, 5.6, 1.9, -5.3, 0x7c8579, m.tole, { nuance: 0.03 });
  for (let i = 0; i < 6; i++) c.boite(0.3, 0.24, 0.32, 0xd6cfb6, { x: 3.2 + (i % 4) * 0.62, y: 0.4 + Math.floor(i / 4) * 0.7, z: -5.2, ry: c.entre(-0.4, 0.4) }, m.mat);
  chaiseBureau(c, 4.2, -3.6, 1.2, true);
  jonchee(c, 1.8, -5.5, 5.6, -2.6, Math.round(20 + 40 * usure), [0xe6e1d2, 0xd8d0bb, 0xcfc8b4, 0xb9b2a0], 0.07);

  // Les chaises en rangs de la salle d'attente (assises bleu canard, l'Abondance en fin de course)
  for (let r = 0; r < 4; r++) {
    for (const x of [-3.4, 0.6]) {
      if (r === 2 && x > 0) continue;
      rangChaises(c, x, 1.6 + r * 1.35, 0, 5, c.hasard() < usure * 0.3);
    }
  }
  rangChaises(c, 1.4, 4.2, 0, 3, true, { rz: Math.PI / 2 - 0.1, y: 0.25, ry: 0.5 });
  // L'escalier du hall, effondré à mi-hauteur : les étages sont inaccessibles
  escalierEffondre(k);
  // Panneau de direction suspendu, une chaîne lâchée
  c.repere({ x: 0, y: 2.75, z: -3.2, rz: 0.22 }, () => {
    c.boite(2.0, 0.92, 0.05, 0x2f5f6b, {}, m.satin);
    panneau(c, m.enseignes, R.directions, { z: 0.03 }, 1.9, 0.86);
    panneau(c, m.enseignes, R.directions, { z: -0.03, ry: Math.PI }, 1.9, 0.86);
    c.boite(0.02, 0.6, 0.02, 0x55524c, { x: -0.9, y: 0.75 }, m.tole);
  });
  c.boite(0.02, 0.55, 0.02, 0x55524c, { x: 1.05, y: 2.95, z: -3.2, rz: 0.4 }, m.tole);
  // Néon SORTIE au-dessus de la porte des urgences (côté hall)
  c.boite(0.62, 0.32, 0.1, 0xe8e8e0, { x: 0, y: 3.05, z: ZC - 0.3 }, m.satin);
  panneau(c, m.neon, R.sortie, { x: 0, y: 3.05, z: ZC - 0.36, ry: Math.PI }, 0.58, 0.29);
  // La borne « Diagnostic IA — Veuillez sourire » et le distributeur de vitamines connectées
  c.repere({ x: -3.8, z: 7.7, ry: Math.PI + 0.25 }, () => {
    c.boite(0.62, 0.12, 0.5, 0xe9dfc6, { y: 0.06 }, m.satin);
    c.boite(0.36, 1.1, 0.3, 0xe9dfc6, { y: 0.6 }, m.satin);
    c.boite(0.66, 0.5, 0.1, 0xe9dfc6, { y: 1.45, rx: -0.25 }, m.satin);
    panneau(c, m.neon, R.ia, { y: 1.45, z: 0.055, rx: -0.25 }, 0.58, 0.39);
    c.boite(0.5, 0.1, 0.08, 0xc8362b, { y: 1.78, rx: -0.25, z: -0.02 }, m.satin);
  });
  c.repere({ x: 4.7, z: 7.75, ry: Math.PI }, () => {
    c.boite(0.95, 1.9, 0.8, 0xc8362b, { y: 0.95 }, m.satin, { nuance: 0.02 });
    panneau(c, m.enseignes, R.vitamines, { y: 1.0, z: 0.405 }, 0.9, 1.35);
    c.boite(0.7, 0.9, 0.02, 0xffffff, { x: -0.08, y: 1.15, z: 0.42 }, m.verre);
  });
  k.b.obstacle(4.2, 7.3, 5.2, 7.3, "distributeur");
  // Affiches de l'Abondance sur les murs du hall
  panneau(c, m.enseignes, R.affiche, { x: -5.78, y: 1.9, z: 3.5, ry: Math.PI / 2 }, 0.75, 1.1);
  panneau(c, m.enseignes, R.affiche, { x: 5.78, y: 1.9, z: 2.5, ry: -Math.PI / 2, rz: 0.08 }, 0.75, 1.1);
  panneau(c, m.enseignes, R.graffiti, { x: -5.78, y: 1.7, z: -0.8, ry: Math.PI / 2 }, 2.2, 0.82);
  // Un brancard abandonné au milieu du hall, une plante en pot morte, des feuilles mortes entrées par la porte
  brancard(c, -1.2, 6.2, 0.4, true);
  c.tube([-5.3, 0, 7.6], [-5.3, 0.5, 7.6], 0.25, 0x8a6a4c, m.mat, 7);
  arbre(c, -5.3, 7.6, 1.5, "mort", 0.5);
  jonchee(c, -2.5, 4.5, 3.5, ZC - 0.3, Math.round(20 + 60 * usure), undefined, 0.07);
  debris(c, -5.5, -5.5, 5.5, 7.5, Math.round(25 * usure), undefined, 0.06);
  // Les luminaires tombés : un tube fluorescent pendu à un fil
  c.boite(1.3, 0.08, 0.2, 0xdedbd0, { x: -2.5, y: 2.6, z: -0.5, rz: 0.55 }, m.satin);
  c.boite(0.01, 0.9, 0.01, 0x333333, { x: -2.0, y: 3.05, z: -0.5 }, m.tole);
  // Rai de lumière par la porte des urgences (de jour)
  raiDeLumiere(c, [0, 2.6, ZC + 1.5], [0.3, 0.06, 4.8], 2.2, 0.08);
}

function escalierEffondre(k) {
  const { c, m } = k;
  // Volée le long du mur ouest du hall, montant vers le nord (de z = 3 à z = -1)
  const x1 = -5.8;
  const x2 = -4.4;
  const n = 20;
  for (let i = 0; i < n; i++) {
    const y = (i + 1) * 0.175;
    const z = 3 - i * 0.2;
    if (i > 9) break;
    const casse = i === 9;
    c.pave(x1, 0, z - 0.2, x2, y, z, COUL.betonGris, m.beton, { nuance: 0.02 });
    c.pave(x1, y, z - 0.22, x2 + 0.02, y + 0.03, z + 0.02, 0xbab3a2, m.satin, { nuance: 0.02 });
    if (casse) c.boite(1.4, 0.18, 0.5, COUL.betonGris, { x: (x1 + x2) / 2 + 0.3, y: 1.0, z: z - 0.6, rx: 0.9, rz: -0.25 }, m.beton);
  }
  // La rampe arrachée
  c.tube([x2, 1.0, 3], [x2, 1.9, 1.2], 0.03, 0x6b4b34, m.mat, 5);
  c.tube([x2, 1.9, 1.2], [x2 + 0.6, 1.1, 0.5], 0.03, 0x6b4b34, m.mat, 5);
  for (let z = 2.8; z > 1.2; z -= 0.4) c.boite(0.02, 0.9, 0.02, 0x3e3a34, { x: x2, y: 1.0 + (3 - z) * 0.5, z }, m.tole);
  // Gravats de la volée supérieure, et la barrière de planches « DANGER »
  gravats(c, -5, -0.4, 1.6, Math.round(14 + 10 * k.usure), [COUL.betonGris, PALETTE.pierre, 0xbab3a2]);
  for (const y of [0.5, 1.0]) c.boite(1.8, 0.14, 0.04, PALETTE.boisGris, { x: -5.1, y, z: 3.4, rz: y > 0.7 ? 0.06 : -0.04 }, m.mat, { nuance: 0.06 });
  panneau(c, m.enseignes, R.danger, { x: -5.1, y: 1.45, z: 3.43, rz: 0.06 }, 0.55, 0.55);
  k.b.obstacle(-5.8, 3.4, -4.4, 3.4, "barrière");
}

// ---------- Mobilier hospitalier ----------

/** Un lit d'hôpital à roulettes (repère : long selon x). `etat` : « fait », « nu », « renverse ». */
function lit(c, x, z, ry = 0, etat = "fait") {
  const m = matieres();
  const pose = etat === "renverse" ? { x, y: 0.47, z, ry, rx: Math.PI / 2 - 0.05 } : { x, z, ry };
  const fer = c.hasard() < 0.4 ? 0xb8a690 : COUL.fer;
  c.repere(pose, () => {
    for (const sx of [-0.95, 0.95]) {
      for (const sz of [-0.42, 0.42]) {
        c.boite(0.04, 0.5, 0.04, fer, { x: sx, y: 0.32, z: sz }, m.tole);
        c.boite(0.1, 0.1, 0.05, COUL.roulette, { x: sx, y: 0.05, z: sz }, m.tole);
      }
      c.boite(0.04, 0.5, 0.88, fer, { x: sx, y: 0.85, z: 0 }, m.tole);
    }
    for (const sz of [-0.42, 0.42]) c.boite(1.94, 0.06, 0.04, fer, { y: 0.5, z: sz }, m.tole);
    if (etat !== "nu") {
      c.boite(1.84, 0.14, 0.82, COUL.matelas, { y: 0.6 }, m.mat, { nuance: 0.06 });
      if (etat === "fait") c.boite(1.2, 0.05, 0.86, COUL.draps, { x: 0.3, y: 0.69, rz: 0.02 }, m.mat, { nuance: 0.05, crasse: false });
    } else {
      for (let i = -0.8; i <= 0.8; i += 0.2) c.boite(0.02, 0.02, 0.84, 0x6a5e52, { x: i, y: 0.52 }, m.tole);
    }
  });
}

/** Un fauteuil roulant (face vers +x local). */
function fauteuilRoulant(c, x, z, ry = 0, renverse = false) {
  const m = matieres();
  c.repere(renverse ? { x, z, ry, y: 0.3, rz: Math.PI / 2 } : { x, z, ry }, () => {
    for (const s of [-1, 1]) {
      c.poser(geoCylindre(0.3, 0.035, 12), m.tole, 0x3b3a36, { x: -0.05, y: 0.3, z: s * 0.29, rx: Math.PI / 2 });
      c.boite(0.06, 0.06, 0.03, COUL.roulette, { x: 0.38, y: 0.05, z: s * 0.22 });
      c.boite(0.5, 0.03, 0.03, 0x9fa29a, { x: 0.1, y: 0.5, z: s * 0.22 }, m.metal);
      c.boite(0.03, 0.55, 0.03, 0x9fa29a, { x: -0.18, y: 0.78, z: s * 0.22, rz: -0.1 }, m.metal);
      c.boite(0.03, 0.42, 0.03, 0x9fa29a, { x: 0.36, y: 0.28, z: s * 0.18, rz: 0.3 }, m.metal);
    }
    c.boite(0.44, 0.05, 0.44, 0x3d4a52, { x: 0.08, y: 0.5 }, m.satin);
    c.boite(0.05, 0.42, 0.44, 0x3d4a52, { x: -0.18, y: 0.78, rz: -0.1 }, m.satin);
    c.boite(0.16, 0.02, 0.36, 0x6b6e68, { x: 0.46, y: 0.12 }, m.tole);
  });
}

/** Un brancard (civière de toile sur deux hampes), posé au sol ou sur tréteaux. */
function brancard(c, x, z, ry = 0, auSol = true) {
  const m = matieres();
  const y = auSol ? 0.06 : 0.7;
  c.repere({ x, z, ry }, () => {
    for (const s of [-0.3, 0.3]) c.boite(2.2, 0.05, 0.05, 0x7a6a50, { y, z: s }, m.mat);
    c.boite(1.8, 0.02, 0.58, COUL.kaki, { y: y + 0.01 }, m.toile, { nuance: 0.06 });
    if (!auSol) for (const sx of [-0.8, 0.8]) for (const s of [-0.3, 0.3]) c.boite(0.04, 0.7, 0.04, 0x7a7c70, { x: sx, y: 0.35, z: s, rz: sx > 0 ? 0.12 : -0.12 }, m.tole);
  });
}

/** Un rang de `n` chaises soudées sur une poutre (face +z local). */
function rangChaises(c, x, z, ry, n, trous = false, pose = null) {
  const m = matieres();
  c.repere(pose ? { x, z, ...pose } : { x, z, ry }, () => {
    const l = n * 0.55;
    c.boite(l, 0.06, 0.06, 0x5e625c, { x: l / 2, y: 0.36 }, m.tole);
    for (const px of [0.2, l - 0.2]) c.boite(0.05, 0.36, 0.4, 0x5e625c, { x: px, y: 0.18 }, m.tole);
    for (let i = 0; i < n; i++) {
      if (trous && c.hasard() < 0.3) continue;
      const cx = i * 0.55 + 0.275;
      c.boite(0.48, 0.05, 0.44, COUL.canard, { x: cx, y: 0.45 }, m.satin, { nuance: 0.06 });
      c.boite(0.48, 0.42, 0.05, COUL.canard, { x: cx, y: 0.72, z: -0.22, rx: -0.12 }, m.satin, { nuance: 0.06 });
    }
  });
}

function chaiseBureau(c, x, z, ry, renverse) {
  const m = matieres();
  c.repere(renverse ? { x, z, ry, y: 0.25, rx: Math.PI / 2 - 0.2 } : { x, z, ry }, () => {
    c.boite(0.5, 0.06, 0.5, 0x3a3836, { y: 0.48 }, m.satin);
    c.boite(0.5, 0.5, 0.06, 0x3a3836, { y: 0.8, z: -0.24 }, m.satin);
    c.boite(0.05, 0.45, 0.05, 0x555555, { y: 0.24 }, m.metal);
    c.boite(0.6, 0.04, 0.06, 0x555555, { y: 0.03 }, m.metal);
    c.boite(0.06, 0.04, 0.6, 0x555555, { y: 0.03 }, m.metal);
  });
}

/** Un chariot de soins à tiroirs (ou chariot d'instruments si `instruments`). */
function chariot(c, x, z, ry, instruments = false, renverse = false) {
  const m = matieres();
  c.repere(renverse ? { x, z, ry, y: 0.3, rz: Math.PI / 2 } : { x, z, ry }, () => {
    if (instruments) {
      for (const y of [0.35, 0.9]) c.boite(0.8, 0.03, 0.5, 0xb9bcb6, { y }, m.metal);
      for (const sx of [-0.38, 0.38]) for (const sz of [-0.23, 0.23]) c.boite(0.03, 0.9, 0.03, 0xb9bcb6, { x: sx, y: 0.45, z: sz }, m.metal);
      c.boite(0.5, 0.03, 0.32, 0xd0d3cc, { y: 0.93 }, m.metal);
      for (let i = 0; i < 5; i++) c.boite(0.16, 0.01, 0.02, 0xd8dbd6, { x: -0.2 + i * 0.1, y: 0.95, z: c.entre(-0.1, 0.1), ry: c.entre(-0.3, 0.3) }, m.metal);
    } else {
      c.boite(0.7, 0.85, 0.5, 0x9cb8ad, { y: 0.5 }, m.satin, { nuance: 0.05 });
      for (let i = 0; i < 4; i++) c.boite(0.6, 0.16, 0.02, 0xc9d8d0, { y: 0.25 + i * 0.2, z: 0.26 }, m.satin);
      c.boite(0.74, 0.03, 0.54, 0xd6d8d0, { y: 0.94 }, m.satin);
      c.boite(0.04, 0.04, 0.5, 0x8a8d86, { x: 0.42, y: 0.85 }, m.metal);
    }
    for (const sx of [-0.3, 0.3]) for (const sz of [-0.2, 0.2]) c.boite(0.07, 0.07, 0.04, COUL.roulette, { x: sx, y: 0.04, z: sz }, m.tole);
  });
}

/** Une potence à perfusion, debout ou tombée. */
function perfusion(c, x, z, tombee = false) {
  const m = matieres();
  c.repere(tombee ? { x, z, y: 0.05, rz: Math.PI / 2 - 0.05, ry: c.entre(0, 3) } : { x, z }, () => {
    c.tube([0, 0.05, 0], [0, 1.9, 0], 0.015, 0xb9bcb6, m.metal, 5);
    c.boite(0.5, 0.03, 0.04, 0x8a8d86, { y: 0.05 }, m.metal);
    c.boite(0.04, 0.03, 0.5, 0x8a8d86, { y: 0.05 }, m.metal);
    c.boite(0.3, 0.02, 0.02, 0xb9bcb6, { y: 1.88 }, m.metal);
    c.boite(0.1, 0.18, 0.04, 0xd8dcd0, { x: 0.12, y: 1.72 }, m.satin);
  });
}

// ---------- L'aile des soins (carte « soins ») ----------

function aileDesSoins(k) {
  const { c, m, usure, b } = k;
  // Le couloir : lits poussés contre les murs, fauteuils roulants, un brancard, des papiers
  lit(c, -21, -5.3, 0, "fait");
  lit(c, -16.5, -5.3, 0.05, "nu");
  lit(c, -10.8, -4.0, 0.35, "fait");
  lit(c, -8, -5.35, 0, "nu");
  lit(c, 13.0, -5.3, Math.PI, "fait");
  lit(c, 19.5, -4.4, -0.6, "renverse");
  fauteuilRoulant(c, -13.6, -4.4, 2.3);
  fauteuilRoulant(c, 8.4, -5.3, -0.3);
  fauteuilRoulant(c, 16.2, -3.8, 0.8, true);
  brancard(c, -19, -3.85, 0.04, false);
  chariot(c, -2.2, -4.5, 0.3);
  perfusion(c, -6.8, -5.5);
  perfusion(c, 10.2, -4.2, true);
  jonchee(c, -23.5, -5.8, -6.5, -3.5, Math.round(30 + 60 * usure), [0xe6e1d2, 0xd8d0bb, 0xcfc8b4, 0xa89e88], 0.07);
  jonchee(c, 6.5, -5.8, 23.5, -3.5, Math.round(30 + 60 * usure), [0xe6e1d2, 0xd8d0bb, 0xcfc8b4, 0xa89e88], 0.07);
  debris(c, -23.5, -5.8, 23.5, -3.5, Math.round(50 * usure), [0xb9cfc2, 0xd5d6c2, 0xc8c4b5], 0.06);
  flaque(c, -11, -4.8, 0.9, 0.075);
  flaque(c, 21, -4.6, 1.2, 0.075);
  // Plafonniers tombés, néons SORTIE au bout du couloir
  for (const x of [-18, -9, 9, 18]) c.boite(1.2, 0.07, 0.18, 0xdedbd0, { x, y: c.hasard() < 0.5 ? 3.3 : 2.7, z: -4.6, rz: c.entre(-0.5, 0.5) }, m.satin);
  for (const [x, ry] of [[-23.75, Math.PI / 2], [6.25, Math.PI / 2]]) {
    c.boite(0.1, 0.32, 0.62, 0xe8e8e0, { x: x - 0.02, y: 2.75, z: -4.6 }, m.satin);
    panneau(c, m.neon, R.sortie, { x: x + 0.04, y: 2.75, z: -4.6, ry }, 0.58, 0.29);
  }
  // Enseignes au-dessus des portes
  panneau(c, m.enseignes, R.pharmacie, { x: 8.5, y: 2.6, z: ZK - 0.16, ry: Math.PI }, 1.4, 0.35);
  panneau(c, m.enseignes, R.bloc, { x: 14.5, y: 2.65, z: ZK - 0.16, ry: Math.PI }, 1.4, 0.35);
  panneau(c, m.enseignes, R.graffiti, { x: 21, y: 1.7, z: ZK - 0.16, ry: Math.PI }, 1.8, 0.68);
  panneau(c, m.enseignes, R.quarantaine, { x: -18.5, y: 2.55, z: ZK - 0.16, ry: Math.PI }, 1.6, 0.4);
  // Portes battantes du bloc (hublots), porte de la salle commune décrochée
  battants(c, 14.5, ZK - EPI / 2, Math.PI, 1.9, 2.3, "service");
  battants(c, -18.5, ZK - EPI / 2, Math.PI, 1.9, 2.3, "ouverts");

  // La salle des malades (x -24 → -13) : deux rangées de lits, rideaux de séparation sur rails
  for (let i = 0; i < 4; i++) {
    const x = -22.4 + i * 2.6;
    const desordre = c.hasard() < 0.25 * usure;
    lit(c, x, -1.9, Math.PI / 2 + (desordre ? 0.4 : 0), c.hasard() < 0.3 ? "nu" : "fait");
    if (i !== 2) lit(c, x, 4.4, Math.PI / 2 + c.entre(-0.1, 0.1), i === 3 && usure > 0.5 ? "renverse" : "fait");
    c.boite(0.45, 0.75, 0.4, 0xc6c9bf, { x: x + 1.2, y: 0.38, z: -2.7 }, m.satin);
  }
  fauteuilRoulant(c, -16.6, 2.2, -1.2);
  perfusion(c, -21.2, 0.5);
  perfusion(c, -15.3, 1.1, true);
  for (const x of [-23.2, -20.6, -18]) c.boite(0.02, 1.7, 1.4, 0xc9cbb8, { x, y: 1.25, z: 3.9, rz: c.entre(-0.05, 0.05) }, m.toile, { nuance: 0.08 });
  c.boite(10.5, 0.03, 0.03, 0x8a8d86, { x: -18.5, y: 2.2, z: 3.2 }, m.metal);
  panneau(c, m.enseignes, R.affiche, { x: -13.1, y: 1.8, z: 1, ry: -Math.PI / 2 }, 0.7, 1.0);
  jonchee(c, -23.5, -3, -13.3, 5.6, Math.round(20 + 30 * usure), undefined, 0.07);
  arbuste(c, -21, 5.3, 0.7 + usure * 0.5);
  semerTouffes(c, -23.5, 4.8, -16, 5.7, Math.round(10 * usure), PALETTE.herbeSeche, 0.06);
  raiDeLumiere(c, [-15.5, 3.2, 7.5], [-15, 0.07, 2.5], 1.8, 0.07);

  // La chambre (x -13 → -6) : deux lits, chevets, une chaise, un fauteuil
  lit(c, -10.6, 3.6, Math.PI / 2, "fait");
  lit(c, -7.8, 3.6, Math.PI / 2 + 0.3, "nu");
  c.boite(0.45, 0.75, 0.4, 0xc6c9bf, { x: -12.1, y: 0.38, z: 4.9 }, m.satin);
  c.boite(0.45, 0.75, 0.4, 0xc6c9bf, { x: -9.2, y: 0.38, z: 4.9, ry: 0.3 }, m.satin);
  fauteuilRoulant(c, -8.4, -0.8, 0.6);
  chaiseBureau(c, -11.2, -1.4, 0.4, false);
  c.boite(0.02, 2.0, 2.4, 0xc9cbb8, { x: -9.3, y: 1.1, z: 2.7, rz: 0.03 }, m.toile, { nuance: 0.08 });
  jonchee(c, -12.8, -3, -6.3, 5.6, Math.round(15 + 25 * usure), undefined, 0.07);
}

// ---------- La pharmacie : étagères renversées, armoire grillagée (le trésor) ----------

function pharmacie(k) {
  const { c, m, usure } = k;
  // L'armoire à médicaments grillagée, contre le mur sud (intacte : on n'a pas réussi à l'ouvrir)
  c.repere({ x: 8.5, z: 5.45, ry: Math.PI }, () => {
    c.boite(2.4, 2.2, 0.6, 0x9aa6a0, { y: 1.1 }, m.tole, { nuance: 0.03 });
    for (let y = 0.35; y < 2.1; y += 0.42) {
      c.boite(2.2, 0.03, 0.5, 0x8d9993, { y }, m.tole);
      for (let i = 0; i < 8; i++) {
        if (c.hasard() < 0.15) continue;
        const ton = [0xe6e2d6, 0xd9e3ea, 0xe8d9b0, 0xcfe0cf, 0xe6e2d6][Math.floor(c.hasard() * 5)];
        c.boite(0.18, c.entre(0.12, 0.3), 0.22, ton, { x: -0.95 + i * 0.27, y: y + 0.12, z: 0.05 }, m.satin, { nuance: 0.04, crasse: false });
      }
    }
    // la grille : barreaux et traverses, un cadenas
    for (let x = -1.15; x <= 1.16; x += 0.16) c.boite(0.02, 2.1, 0.02, 0x4a4c48, { x, y: 1.1, z: 0.32 }, m.metal);
    for (const y of [0.1, 0.75, 1.4, 2.1]) c.boite(2.36, 0.04, 0.03, 0x4a4c48, { y, z: 0.32 }, m.metal);
    c.boite(0.1, 0.13, 0.05, 0xb59048, { y: 1.1, z: 0.36 }, m.metal);
    // marques de pied-de-biche : la tôle est tordue en bas
    c.boite(0.5, 0.04, 0.08, 0x4a4c48, { x: 0.8, y: 0.25, z: 0.4, rz: 0.4 }, m.metal);
    panneau(c, m.enseignes, R.croix, { y: 2.42, z: 0.31 }, 0.36, 0.36);
  });
  k.b.obstacle(7.3, 5.15, 9.7, 5.15, "armoire");
  // Les étagères renversées, leur contenu répandu
  for (const [x, z, ry] of [[9.5, 0.4, 0.2], [7.5, 2.6, -0.5]]) {
    c.repere({ x, z, ry, y: 0.22, rx: Math.PI / 2 - 0.15 }, () => {
      for (const sx of [-0.9, 0.9]) c.boite(0.04, 2.0, 0.4, 0x8d9993, { x: sx, y: 0 }, m.tole);
      for (let yy = -0.9; yy <= 0.95; yy += 0.45) c.boite(1.8, 0.03, 0.4, 0x9aa6a0, { y: yy }, m.tole);
    });
  }
  c.repere({ x: 10.3, z: 3.4, ry: -0.2 }, () => {
    for (const sx of [-0.9, 0.9]) c.boite(0.04, 2.0, 0.4, 0x8d9993, { x: sx, y: 1.0 }, m.tole);
    for (let yy = 0.2; yy <= 2.0; yy += 0.45) c.boite(1.8, 0.03, 0.4, 0x9aa6a0, { y: yy }, m.tole);
  });
  // Boîtes, flacons et blisters par terre
  for (let i = 0; i < Math.round(40 + 50 * usure); i++) {
    const ton = [0xe6e2d6, 0xd9e3ea, 0xe8d9b0, 0xcfe0cf, 0xc8362b, 0x8fb0c8][Math.floor(c.hasard() * 6)];
    const s = c.entre(0.08, 0.22);
    c.boite(s, s * 0.5, s * 0.7, ton, { x: c.entre(6.4, 10.7), y: 0.08 + s * 0.25, z: c.entre(-2.9, 4.6), ry: c.hasard() * 3, rz: c.entre(-0.3, 0.3) }, m.satin, { nuance: 0.04, crasse: false });
  }
  // Le réfrigérateur à vaccins (porte ouverte, éteint), le comptoir de délivrance
  c.repere({ x: 6.6, z: -1.6, ry: Math.PI / 2 }, () => {
    c.boite(0.7, 1.6, 0.65, 0xd9dbd3, { y: 0.8 }, m.satin);
    c.boite(0.68, 1.5, 0.05, 0xd9dbd3, { x: 0.55, y: 0.82, z: 0.55, ry: -1.2 }, m.satin);
  });
  c.pave(9.6, 0, -2.95, 10.8, 1.0, -0.6, 0xbfc4bb, m.satin, { nuance: 0.03 });
  chariot(c, 7.6, -0.6, 1.0, false, true);
  // La lampe torche tombée (elle éclaire encore, la nuit)
  c.tube([9.3, 0.08, 2.2], [9.6, 0.08, 2.35], 0.045, 0x2b2b2b, m.tole, 6);
  // Une croix verte de pharmacie tombée de la façade, posée à l'envers
  panneau(c, m.enseignes, R.pharmacie, { x: 8.0, y: 0.06, z: 4.0, rx: -Math.PI / 2, rz: 2.6 }, 1.2, 0.3);
}

// ---------- Le bloc opératoire ----------

function bloc(k) {
  const { c, m, usure } = k;
  // Sol vert, faïence sur toute la hauteur
  c.pave(11.1, 0.06, -3.1, 17.9, 0.07, 5.8, COUL.solBloc, m.carrelage, { crasse: false, nuance: 0 });
  const toutFaience = [{ y1: 0, y2: RDC, mat: m.faience, couleur: 0xa9cfc0 }];
  doublage(k, [11, ZK], [11, 6], EPI, { cut: CUTI, bandes: toutFaience, cote: 1, retrait: 0.1 });
  doublage(k, [18, ZK], [18, 6], EPI, { cut: CUTI, bandes: toutFaience, cote: -1, retrait: 0.1, ouvertures: [{ u: 5, l: 1.2, bas: 0, haut: 2.2 }] });
  doublage(k, [11, ZK], [18, ZK], EPI, { cut: CUTI, bandes: toutFaience, cote: 1, retrait: 0.1, ouvertures: [{ u: 3.5, l: 1.9, bas: 0, haut: 2.3 }] });
  // La table d'opération
  c.repere({ x: 14.6, z: 1.4, ry: 0.1 }, () => {
    c.boite(0.7, 0.08, 0.6, 0x7d827c, { y: 0.04 }, m.metal);
    c.boite(0.3, 0.7, 0.3, 0x9da29b, { y: 0.45 }, m.metal);
    c.boite(2.0, 0.12, 0.6, 0x4f6670, { y: 0.88 }, m.satin);
    c.boite(0.5, 0.1, 0.6, 0x4f6670, { x: 1.2, y: 0.8, rz: -0.3 }, m.satin);
    c.boite(0.04, 0.03, 0.9, 0x9da29b, { x: -0.3, y: 0.9 }, m.metal);
  });
  // La lampe scialytique : coupole principale et satellite, sur leurs bras articulés
  c.tube([14.6, RDC, 1.2], [14.6, 2.9, 1.2], 0.05, 0xc9cbc4, m.metal, 6);
  c.tube([14.6, 2.9, 1.2], [15.4, 2.55, 1.4], 0.04, 0xc9cbc4, m.metal, 6);
  c.poser(new THREE.CylinderGeometry(0.62, 0.42, 0.24, 12), m.satin, 0xe6e6de, { x: 15.4, y: 2.4, z: 1.4, rx: 0.15 });
  c.poser(new THREE.CylinderGeometry(0.5, 0.5, 0.02, 12), m.satin, 0xd8e6ea, { x: 15.4, y: 2.27, z: 1.38, rx: 0.15 }, { crasse: false });
  c.tube([14.6, 2.9, 1.2], [13.9, 2.2, 0.6], 0.035, 0xc9cbc4, m.metal, 6);
  c.poser(new THREE.CylinderGeometry(0.38, 0.26, 0.18, 10), m.satin, 0xe6e6de, { x: 13.8, y: 2.05, z: 0.5, rx: 0.6, rz: -0.3 });
  // Chariot d'instruments, appareil d'anesthésie, scialytique d'appoint tombé, seau, armoire
  chariot(c, 13.4, 2.6, 0.3, true);
  c.repere({ x: 16.6, z: 0.2, ry: -0.4 }, () => {
    c.boite(0.6, 1.1, 0.5, 0x7f9aa0, { y: 0.6 }, m.satin);
    c.boite(0.5, 0.3, 0.3, 0x3a4246, { y: 1.3 }, m.satin);
    c.tube([0.25, 1.1, 0], [0.25, 1.7, 0], 0.08, 0x3f6f9f, m.tole, 6);
    c.tube([0, 1.0, 0.25], [-0.6, 0.06, 1.0], 0.025, 0x2a2a2a, m.tole, 4);
  });
  c.pave(16.2, 0, -3.0, 17.85, 2.1, -2.4, 0xd5d8d0, m.satin, { nuance: 0.03 });
  c.boite(1.5, 1.9, 0.04, 0xffffff, { x: 17.0, y: 1.1, z: -2.37 }, m.verre);
  perfusion(c, 13.2, 0.3);
  c.tube([12, 0, 4.7], [12, 0.4, 4.7], 0.16, 0x9da29b, m.metal, 7);
  // Le plafond a lâché par endroits : plaques de plâtre au sol, câbles qui pendent
  debris(c, 11.3, -2.9, 17.7, 5.6, Math.round(20 + 30 * usure), [0xd9d6c8, 0xb9cfc2, 0xcfcbbd], 0.07);
  for (const [x, z] of [[12.2, -1], [16.8, 3.6]]) c.tube([x, RDC, z], [x + 0.2, 2.2, z + 0.1], 0.012, 0x222222, m.tole, 3);
  flaque(c, 12.6, 4.4, 0.8, 0.08);
}

// ---------- La salle effondrée (bout de l'aile est, les deux cartes) ----------

function effondrement(k) {
  const { c, T, m, usure } = k;
  // La dalle de l'étage, tombée en biais dans la salle, armatures à nu
  c.repere({ x: 21, y: 1.75, z: 1.5, rz: -0.52, rx: 0.08 }, () => {
    c.boite(6.3, 0.26, 5.6, COUL.betonGris, {}, m.beton, { nuance: 0.03 });
    c.boite(6.3, 0.02, 5.6, 0xc9c6b8, { y: 0.14 }, m.carrelage);
    for (let z = -2.6; z <= 2.6; z += 0.5) c.tube([3.1, 0, z], [3.6 + c.hasard() * 0.5, -0.2 - c.hasard() * 0.4, z + 0.1], 0.015, PALETTE.rouille, m.tole, 3);
  });
  // Un lit de l'étage, tombé avec la dalle
  lit(c, 22.4, 3.6, 0.9, "renverse");
  // Les gravats : un cône dans la salle, un autre qui déborde par la brèche dans la cour
  const tons = [COUL.brique, 0x8a5240, PALETTE.pierre, COUL.betonGris, 0xd5d6c2];
  gravats(c, 22.3, -1.2, 2.2, Math.round(18 + 22 * usure), tons);
  gravats(c, 19.5, 4.5, 1.5, Math.round(8 + 10 * usure), tons);
  gravats(c, 25.2, 1.6, 1.8, Math.round(12 + 14 * usure), tons);
  gravats(c, 21.5, 7.4, 2.0, Math.round(14 + 16 * usure), tons);
  debris(c, 18.3, -3, 23.7, 5.7, Math.round(25 + 30 * usure), tons, 0.06);
  // Des blocs de mur entiers, des briques
  for (let i = 0; i < 6; i++) c.boite(c.entre(0.6, 1.4), c.entre(0.3, 0.5), c.entre(0.3, 0.5), COUL.brique, { x: c.entre(20, 26), y: 0.2, z: c.entre(5.5, 9.5), ry: c.hasard() * 3, rz: c.entre(-0.3, 0.3) }, m.brique);
  // Un bouleau a poussé dans la salle, à travers le trou du plafond
  arbre(c, 23, 4.6, 3.5 + 2.5 * usure, "bouleau", 0.06);
  semerTouffes(c, 18.5, -2.5, 23.5, 5.5, Math.round(16 + 30 * usure), PALETTE.herbe, 0.06);
  mousse(c, 21.5, 0.06, 2.5, 1.6, Math.round(3 + 5 * usure));
  // Le rai de soleil par le toit ouvert
  raiDeLumiere(c, [21, 6.5, 0.5], [21.5, 0.1, 1], 2.2);
  // L'ombre de l'étage : un morceau de plancher qui pend encore du côté du couloir
  T.repere({ x: 19.5, y: 3.2, z: -2.4, rx: 0.5 }, () => T.boite(3, 0.22, 1.6, COUL.betonGris, {}, m.beton));
}

// ---------- L'auvent des URGENCES (couche à part) ----------

function auvent(k) {
  const { A, c, m } = k;
  const z1 = ZC + 0.2;
  const z2 = 13.2;
  // Dalle en porte-à-faux, bandeau d'enseigne, deux poteaux ronds côté cour
  A.pave(-5.2, 3.15, z1, 5.2, 3.45, z2, COUL.betonBlanc, m.beton, { crasse: false });
  A.pave(-5.3, 2.85, z2 - 0.1, 5.3, 3.62, z2 + 0.05, COUL.betonBlanc, m.beton, { crasse: false });
  A.pave(-5.3, 2.85, z1, -5.2, 3.62, z2, COUL.betonBlanc, m.beton, { crasse: false });
  A.pave(5.2, 2.85, z1, 5.3, 3.62, z2, COUL.betonBlanc, m.beton, { crasse: false });
  panneau(A, m.enseignes, R.urgences, { x: 0, y: 3.24, z: z2 + 0.06 }, 6.6, 0.72);
  for (const x of [-4.6, 4.6]) {
    c.poser(geoCylindre(0.17, 3.15, 8), m.beton, COUL.betonBlanc, { x, y: 1.575, z: z2 - 0.5 });
    k.b.obstacle(x - 0.17, z2 - 0.5, x + 0.17, z2 - 0.5, "poteau");
  }
  // Le G, tombé dans les herbes, et le E qui pend (dessiné sur l'enseigne)
  panneau(c, m.enseignes, R.lettreG, { x: -1.7, y: 0.07, z: z2 + 0.9, rx: -Math.PI / 2, rz: 0.7 }, 0.7, 0.7);
  // Mousse et feuilles sur la dalle
  mousse(A, 1.5, 3.45, 11, 1.4, 4);
  jonchee(A, -5, z1, 5, z2, 30, undefined, 3.46);
  // Descente d'eau cassée, coulures de rouille
  c.tube([5.05, 0.2, z2 - 0.2], [5.05, 1.6, z2 - 0.2], 0.05, COUL.zinc, m.tole, 6);
  // Le néon SORTIE côté cour, au-dessus de la porte
  c.boite(0.62, 0.32, 0.1, 0xe8e8e0, { x: 0, y: 2.95, z: ZC + 0.36 }, m.satin);
  panneau(c, m.neon, R.sortie, { x: 0, y: 2.95, z: ZC + 0.42 }, 0.58, 0.29);
}

// ---------- Les ailes vues de la cour (carte « cour ») : intérieur dépouillé, passages barricadés ----------

function ailesFermees(k) {
  const { c, m, usure } = k;
  // Les barricades de lits au bout du hall (vers l'aile des soins : l'autre carte)
  for (const s of [-1, 1]) {
    const x = s * 6.9;
    lit(c, x, -4.6, Math.PI / 2, "nu");
    lit(c, x + s * 0.4, -4.4, Math.PI / 2 + 0.2, "renverse");
    lit(c, x - s * 0.1, -4.7, Math.PI / 2 - 0.15, "nu");
    c.repere({ x, y: 1.3, z: -4.6, ry: Math.PI / 2 }, () => {
      for (let i = 0; i < 3; i++) c.boite(2.4, 0.18, 0.05, PALETTE.boisGris, { y: i * 0.45 - 0.3, rz: (i - 1) * 0.1 }, m.mat, { nuance: 0.08 });
    });
    k.b.obstacle(x, -5.8, x, -3.4, "barricade");
  }
  panneau(c, m.enseignes, R.quarantaine, { x: -6.25, y: 2.0, z: -4.6, ry: Math.PI / 2 }, 1.6, 0.4);
  panneau(c, m.enseignes, R.danger, { x: 6.25, y: 2.0, z: -4.6, ry: -Math.PI / 2 }, 0.7, 0.7);
  // Ce qu'on devine par les fenêtres : quelques lits, des rideaux, la pharmacie dévastée
  for (let i = 0; i < 4; i++) lit(c, -22.4 + i * 2.6, 4.4, Math.PI / 2, i === 2 ? "renverse" : "fait");
  lit(c, -10.6, 3.6, Math.PI / 2, "fait");
  for (const x of [-23.2, -20.6, -18]) c.boite(0.02, 1.7, 1.4, 0xc9cbb8, { x, y: 1.25, z: 3.9 }, m.toile, { nuance: 0.08 });
  c.repere({ x: 8.5, z: 3.0, ry: 0.2, y: 0.22, rx: Math.PI / 2 - 0.15 }, () => {
    for (const sx of [-0.9, 0.9]) c.boite(0.04, 2.0, 0.4, 0x8d9993, { x: sx }, m.tole);
    for (let yy = -0.9; yy <= 0.95; yy += 0.45) c.boite(1.8, 0.03, 0.4, 0x9aa6a0, { y: yy }, m.tole);
  });
  c.poser(new THREE.CylinderGeometry(0.62, 0.42, 0.24, 10), m.satin, 0xe6e6de, { x: 15.2, y: 2.4, z: 2.4, rx: 0.15 });
  c.tube([15.2, RDC, 2.2], [15.2, 2.5, 2.4], 0.05, 0xc9cbc4, m.metal, 6);
  c.pave(11.1, 0.06, -3.1, 17.9, 0.07, 5.8, COUL.solBloc, m.carrelage, { crasse: false, nuance: 0 });
  debris(c, -23.5, -3, 17.5, 5.7, Math.round(30 * usure), [0xd9d6c8, 0xb9cfc2, 0xcfcbbd], 0.06);
}

// ---------- La cour : triage de la fièvre grise, végétation, clôture ----------

function cour(k) {
  const { c, m, usure, b } = k;
  // L'asphalte de la cour et l'allée des ambulances (fissurés, l'herbe y a pris)
  c.pave(-36, -0.01, 6.3, 32, 0.03, 34.5, 0x8d9a5c, m.mat, { crasse: false, nuance: 0 });
  c.pave(-16, 0.0, 6.3, 28, 0.045, 30, COUL.asphalte, m.asphalte, { crasse: false, nuance: 0 });
  c.pave(4.5, 0.0, 30, 11.5, 0.045, 34.6, COUL.asphalte, m.asphalte, { crasse: false, nuance: 0 });
  c.pave(-22, 0.0, 6.3, -17, 0.05, 24, 0xb1ab9c, m.beton, { crasse: false, nuance: 0 });
  // Marquage au sol effacé (bande jaune de l'emplacement des ambulances)
  for (const x of [4.5, 11.5]) c.pave(x - 0.06, 0.045, 13.6, x + 0.06, 0.05, 19, 0xc9b25a, m.mat, { crasse: false, nuance: 0.05 });
  // L'herbe gagne : plaques de prairie sur l'asphalte, touffes dans les fissures
  const rng = aleatoire(404);
  for (let i = 0; i < Math.round(10 + 22 * usure); i++) {
    const x = -15 + rng() * 42;
    const z = 9 + rng() * 21;
    plaqueHerbe(c, x, z, 1 + rng() * 2.2, rng() < 0.5 ? 0x8d9a5c : 0x7f9150, 0.05, rng);
  }
  semerTouffes(c, -16, 7, 28, 30, Math.round(40 + 90 * usure), PALETTE.herbeSeche, 0.04);
  semerTouffes(c, -35, 7, -24, 34, Math.round(20 + 40 * usure), PALETTE.herbe, 0.02);
  semerTouffes(c, 26, 7, 31.5, 34, Math.round(20 + 40 * usure), PALETTE.herbe, 0.02);
  // Massifs devant la façade, laissés à eux-mêmes
  for (const x of [-21, -15, -9, 9, 13]) arbuste(c, x, 7.1, 0.9 + c.hasard() * 0.7);
  jonchee(c, -16, 6.5, 28, 30, Math.round(40 + 80 * usure), undefined, 0.055);
  flaque(c, 1.5, 17, 1.6, 0.055);
  flaque(c, -8, 12, 1.0, 0.055);

  // Les arbres de la cour d'honneur : un grand tilleul, un arbre mort, un bouleau près de la chapelle
  arbre(c, 29.5, 28, 10, "feuillu");
  arbre(c, -30, 14, 8.5, "feuillu");
  arbre(c, 28, 12, 7, "mort");
  arbre(c, -29, 18, 7.5, "bouleau");

  // Les tentes de triage
  tente(c, 15.5, 19.5, 0.05, 6, 4.4, "debout", COUL.kaki);
  tente(c, 21.5, 23.5, -0.2, 5, 4, "affaissee", COUL.toileBlanche);
  tente(c, 9.5, 24.5, Math.PI / 2 + 0.1, 5, 4, "dechiree", COUL.kaki);
  b.obstacle(12.5, 17.3, 18.5, 17.6, "tente");
  b.obstacle(12.5, 21.7, 18.5, 21.9, "tente");
  // Intérieur de la tente de triage : lits de camp, caisses, la lampe torche
  for (let i = 0; i < 3; i++) litDeCamp(c, 13.6 + i * 1.6, 20.6, Math.PI / 2 + c.entre(-0.1, 0.1));
  for (let i = 0; i < 3; i++) c.boite(0.7, 0.45, 0.5, 0x6b6a4c, { x: 14 + i * 0.9, y: 0.23, z: 18.3, ry: c.entre(-0.2, 0.2) }, m.mat);
  c.tube([15.6, 0.06, 19.6], [15.9, 0.06, 19.75], 0.045, 0x2b2b2b, m.tole, 6);
  perfusion(c, 17.6, 18.6, true);
  // Brancards abandonnés, une table de triage
  brancard(c, 12.8, 15.2, 0.5, true);
  brancard(c, 18.8, 16.8, -0.3, false);
  brancard(c, 3.2, 21, 1.4, true);
  c.pave(6.2, 0.8, 19.5, 7.8, 0.85, 20.3, 0x7a7c70, m.tole);
  for (const [x, z] of [[6.3, 19.6], [7.7, 19.6], [6.3, 20.2], [7.7, 20.2]]) c.pave(x - 0.02, 0, z - 0.02, x + 0.02, 0.8, z + 0.02, 0x7a7c70, m.tole);
  for (let i = 0; i < 10; i++) c.boite(0.2, 0.01, 0.28, 0xe6e1d2, { x: c.entre(5, 9), y: 0.06, z: c.entre(18.5, 21.5), ry: c.hasard() * 3 }, m.mat, { crasse: false });

  // Le poste de contrôle militaire : sacs de sable en arc, barrières, panneau QUARANTAINE
  sacs(c, b, [[-15, 18], [-12.5, 16.8], [-10, 17.2], [-8.5, 19]], 3);
  sacs(c, b, [[-3, 27], [2.5, 27.5]], 2);
  sacs(c, b, [[12.5, 28.5], [16, 29.5]], 2);
  for (const [x, z, ry, tombee] of [[-7, 23, 0.1, false], [-4.6, 23.2, 0.05, false], [-2.2, 23.3, 0, true], [0.5, 23.2, -0.05, false], [13.5, 26.5, 0.4, false], [17.5, 27.8, 0.3, true], [24, 18, 1.4, false]]) barriere(c, b, x, z, ry, tombee);
  panneau(c, m.enseignes, R.quarantaine, { x: -4.6, y: 0.85, z: 23.28, ry: 0.05 }, 1.6, 0.4);
  panneau(c, m.enseignes, R.quarantaine, { x: 0.5, y: 0.85, z: 23.26, ry: -0.05 }, 1.6, 0.4);
  // Le panneau « Fièvre grise — zone contaminée » planté à l'entrée de la cour
  c.boite(0.08, 1.6, 0.08, 0x6b5a46, { x: 4, y: 0.8, z: 31 }, m.mat);
  c.boite(0.08, 1.6, 0.08, 0x6b5a46, { x: 5.2, y: 0.8, z: 31 }, m.mat);
  panneau(c, m.enseignes, R.danger, { x: 4.6, y: 1.55, z: 31.06, rz: 0.08 }, 1.0, 1.0);
  // Caisses de l'armée et un groupe électrogène mort
  for (let i = 0; i < 4; i++) c.boite(0.9, 0.5, 0.6, 0x5f6347, { x: -12.2 + (i % 2) * 1.0, y: 0.25 + Math.floor(i / 2) * 0.5, z: 20.8, ry: c.entre(-0.1, 0.1) }, m.mat);
  c.repere({ x: -16.5, z: 22, ry: 0.3 }, () => {
    c.boite(2.0, 1.1, 1.0, 0x5f6347, { y: 0.65 }, m.tole);
    c.boite(2.2, 0.15, 1.1, 0x3f4134, { y: 0.07 }, m.tole);
    c.boite(0.3, 0.3, 0.3, 0x2a2a28, { x: 0.8, y: 1.3 }, m.tole);
  });
  b.obstacle(-17.5, 21.6, -15.5, 22.4, "groupe électrogène");
  // « NON. » à la bombe sur une plaque de contreplaqué appuyée aux sacs
  c.repere({ x: -13.6, y: 1.05, z: 16.95, ry: 0.4, rx: -0.12 }, () => {
    c.boite(1.4, 1.5, 0.05, 0x9c8f74, {}, m.mat, { nuance: 0.06 });
    panneau(c, m.enseignes, R.non, { z: 0.03 }, 1.3, 1.3);
  });

  // L'ambulance aux pneus à plat, sous l'auvent, portes arrière ouvertes
  ambulance(c, b, 8.4, 12.4, -0.12 + Math.PI);

  // La clôture : muret de brique, grille, portail dont un vantail est arraché
  const zc = 35;
  for (const [x1, x2] of [[-36, 5.4], [10.6, 28]]) {
    c.pave(x1, 0, zc - 0.2, x2, 0.6, zc + 0.2, COUL.brique, m.brique, { nuance: 0.02 });
    c.pave(x1, 0.6, zc - 0.25, x2, 0.68, zc + 0.25, COUL.betonBlanc, m.beton, { nuance: 0.02 });
    for (let x = x1; x < x2 - 0.5; x += 2.5) {
      if (c.hasard() < 0.08 * usure) continue;
      panneau(c, m.enseignes, R.grille, { x: x + 1.25, y: 1.33, z: zc }, 2.5, 1.3);
    }
    b.obstacle(x1, zc, x2, zc, "clôture");
  }
  for (const x of [5, 11]) {
    c.pave(x - 0.4, 0, zc - 0.4, x + 0.4, 2.4, zc + 0.4, COUL.brique, m.brique);
    c.pave(x - 0.5, 2.4, zc - 0.5, x + 0.5, 2.55, zc + 0.5, COUL.betonBlanc, m.beton);
  }
  panneau(c, m.enseignes, R.grille, { x: 7.0, y: 1.0, z: zc - 0.6, ry: -1.2 }, 2.5, 1.6);
  panneau(c, m.enseignes, R.grille, { x: 9.6, y: 0.08, z: zc + 1.6, rx: -Math.PI / 2, rz: 0.3 }, 2.5, 1.6);
  // La clôture est tombée au sud-est
  for (let i = 0; i < 3; i++) panneau(c, m.enseignes, R.grille, { x: 29.5 + i * 0.6, y: 0.1 + i * 0.05, z: zc + 0.5 - i * 0.8, rx: -Math.PI / 2 + 0.1, rz: 0.2 * i }, 2.5, 1.3);
  semerTouffes(c, -36, zc - 1.5, 28, zc + 0.8, Math.round(30 + 50 * usure), PALETTE.herbe, 0);
  lierre(c, -20, 0, zc + 0.22, 0, 6, 1.4, Math.round(30 + 40 * usure));
  lierre(c, 18, 0, zc + 0.22, 0, 5, 1.4, Math.round(20 + 30 * usure));

  // Lierre sur la façade (la brique accroche) et le graffiti « ILS SONT DEDANS »
  lierre(c, -12.2, 0, 6.24, 0, 3.4, 3.2, Math.round(40 + 70 * usure));
  lierre(k.T, -12.2, 3.4, 6.3, 0, 3, 3.5, Math.round(20 + 50 * usure));
  lierre(c, 23.2, 0, 6.24, 0, 1.6, 2.8, Math.round(20 + 40 * usure));
  panneau(k.T, m.enseignes, R.graffiti, { x: 16.5, y: 1.55, z: 6.24 }, 2.3, 0.86);
  panneau(c, m.enseignes, R.non, { x: 19.5, y: 0.55, z: 6.23 }, 0.9, 0.9);
}

/** Une plaque d'herbe au contour irrégulier, à plat sur le sol. */
function plaqueHerbe(c, x, z, r, couleur, y, rng) {
  const pts = [];
  const n = 8;
  const ax = 0.6 + rng() * 0.8;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const rr = r * (0.55 + rng() * 0.6);
    pts.push(new THREE.Vector2(Math.cos(t) * rr * (1 + ax), Math.sin(t) * rr));
  }
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts)).rotateX(-Math.PI / 2);
  c.poser(g, matieres().mat, couleur, { x, y, z, ry: rng() * 3 }, { crasse: false, nuance: 0.05 });
  g.dispose();
}

/** Une tente militaire (murs droits, toit à deux pans) ; `etat` : « debout », « affaissee », « dechiree ». */
function tente(c, x, z, ry, l, p, etat, toile) {
  const m = matieres();
  const hm = 1.5;
  const hf = 1.2;
  c.repere({ x, z, ry }, () => {
    const affaissee = etat === "affaissee";
    const h = affaissee ? 0.6 : hm;
    const f = affaissee ? 0.45 : hf;
    // murs
    for (const s of [-1, 1]) {
      c.boite(l, h, 0.03, toile, { y: h / 2, z: (s * p) / 2, rx: affaissee ? s * 0.3 : 0 }, m.toile, { nuance: 0.05 });
    }
    c.boite(0.03, h, p, toile, { x: -l / 2, y: h / 2 }, m.toile, { nuance: 0.05 });
    // pignon d'entrée ouvert : deux pans, l'un relevé
    c.boite(0.03, h, p * 0.3, toile, { x: l / 2, y: h / 2, z: -p * 0.35 }, m.toile, { nuance: 0.05 });
    c.boite(0.03, h * 0.4, p * 0.3, toile, { x: l / 2, y: h * 0.8, z: p * 0.35 }, m.toile, { nuance: 0.05 });
    for (const sx of [-1, 1]) c.poser(geoTriangle(p, f, 0.03), m.toile, toile, { x: (sx * l) / 2, y: h, ry: Math.PI / 2 }, { nuance: 0.05 });
    // toit
    const pente = Math.atan2(f, p / 2);
    const lr = Math.hypot(p / 2, f) + 0.15;
    for (const s of [-1, 1]) {
      if (etat === "dechiree" && s === 1) {
        // un pan arraché : la moitié pend, l'armature apparaît
        c.boite(l * 0.45, 0.03, lr, toile, { x: -l * 0.27, y: h + f / 2, z: (s * p) / 4, rx: s * pente }, m.toile, { nuance: 0.05 });
        c.boite(l * 0.4, 0.03, lr * 0.8, toile, { x: l * 0.25, y: h * 0.6, z: (s * p) / 2 + 0.2, rx: s * 1.3 }, m.toile, { nuance: 0.05 });
        for (const ax of [0, l / 4, l / 2 - 0.1]) c.poutre([ax, h + f, 0], [ax, h, (s * p) / 2], 0.04, 0x5f5f55, m.tole);
        continue;
      }
      const creux = affaissee ? -0.25 : 0;
      c.boite(l + 0.2, 0.03, lr, toile, { y: h + f / 2 + creux, z: (s * p) / 4, rx: s * pente + (affaissee ? s * 0.15 : 0) }, m.toile, { nuance: 0.05 });
    }
    // poteaux et faîtière
    if (!affaissee) {
      c.poutre([-l / 2, 0, 0], [-l / 2, h + f, 0], 0.05, 0x5f5f55, m.tole);
      c.poutre([l / 2, 0, 0], [l / 2, h + f, 0], 0.05, 0x5f5f55, m.tole);
      c.poutre([-l / 2, h + f, 0], [l / 2, h + f, 0], 0.05, 0x5f5f55, m.tole);
    }
    // croix rouge sur le toit et le pignon
    if (etat !== "dechiree") {
      panneau(c, m.enseignes, R.croix, { y: h + f / 2 + 0.03 + (affaissee ? -0.25 : 0), z: p / 4 + 0.02, rx: -Math.PI / 2 + pente + (affaissee ? 0.15 : 0) }, 1.0, 1.0);
      panneau(c, m.enseignes, R.croix, { x: -l / 2 - 0.03, y: h * 0.6 + 0.2, ry: -Math.PI / 2 }, 0.7, 0.7);
    }
    // haubans et piquets
    for (const sx of [-l / 2 + 0.3, l / 2 - 0.3]) for (const s of [-1, 1]) c.poutre([sx, h, (s * p) / 2], [sx, 0, s * (p / 2 + 1.0)], 0.015, 0xbcb39a, m.mat);
  });
}

function litDeCamp(c, x, z, ry) {
  const m = matieres();
  c.repere({ x, z, ry }, () => {
    for (const s of [-0.32, 0.32]) c.boite(1.9, 0.04, 0.04, 0x5f6347, { y: 0.4, z: s }, m.tole);
    c.boite(1.8, 0.02, 0.62, COUL.kaki, { y: 0.41 }, m.toile, { nuance: 0.06 });
    for (const sx of [-0.85, 0.85]) c.boite(0.04, 0.42, 0.66, 0x5f6347, { x: sx, y: 0.2, rx: 0.4 }, m.tole);
    if (c.hasard() < 0.6) c.boite(1.2, 0.08, 0.6, 0x6e6a58, { x: 0.2, y: 0.47, ry: 0.1 }, m.mat, { nuance: 0.08 });
  });
}

/** Un mur de sacs de sable le long d'une polyligne, `rangs` assises. */
function sacs(c, b, pts, rangs) {
  const m = matieres();
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, z1] = pts[i];
    const [x2, z2] = pts[i + 1];
    const L = Math.hypot(x2 - x1, z2 - z1);
    const ry = -Math.atan2(z2 - z1, x2 - x1);
    const n = Math.floor(L / 0.62);
    for (let r = 0; r < rangs; r++) {
      for (let j = 0; j < n; j++) {
        if (r === rangs - 1 && c.hasard() < 0.25) continue;
        const t = (j + 0.5 + (r % 2) * 0.5) / (n + 0.5);
        c.boite(0.6, 0.24, 0.38, c.hasard() < 0.5 ? COUL.sable : 0xa89272, { x: x1 + (x2 - x1) * t, y: 0.12 + r * 0.23, z: z1 + (z2 - z1) * t, ry: ry + c.entre(-0.12, 0.12), rz: c.entre(-0.05, 0.05) }, m.mat, { nuance: 0.05 });
      }
    }
    b.obstacle(x1, z1, x2, z2, "sacs de sable");
  }
}

/** Une barrière de foule en métal (2 m), debout ou renversée. */
function barriere(c, b, x, z, ry, tombee) {
  const m = matieres();
  c.repere(tombee ? { x, z, ry, y: 0.08, rx: -Math.PI / 2 + 0.05 } : { x, z, ry }, () => {
    const g = 0x8c8f88;
    for (const sx of [-1, 1]) c.boite(0.04, 1.05, 0.04, g, { x: sx, y: 0.6 }, m.tole);
    for (const y of [0.15, 1.1]) c.boite(2.0, 0.04, 0.04, g, { y }, m.tole);
    for (let i = -0.85; i <= 0.86; i += 0.17) c.boite(0.02, 0.95, 0.02, g, { x: i, y: 0.62 }, m.tole);
    if (!tombee) for (const sx of [-1, 1]) c.boite(0.05, 0.03, 0.6, g, { x: sx, y: 0.02 }, m.tole);
  });
  if (!tombee) b.obstacle(x - Math.cos(ry), z + Math.sin(ry), x + Math.cos(ry), z - Math.sin(ry), "barrière");
}

/** L'ambulance : fourgon blanc passé, bande rouge, croix, pneus à plat, portes arrière ouvertes (avant vers +x local). */
function ambulance(c, b, x, z, ry) {
  const m = matieres();
  c.repere({ x, z, ry, rz: 0.02, y: -0.08 }, () => {
    const blanc = COUL.ambulance;
    // châssis et roues à plat
    c.boite(5.4, 0.3, 1.8, 0x2c2b29, { y: 0.5 }, m.tole);
    for (const sx of [-1.7, 1.75]) for (const s of [-1, 1]) {
      c.poser(geoCylindre(0.38, 0.26, 10), m.satin, 0x252423, { x: sx, y: 0.32, z: s * 0.85, rx: Math.PI / 2, e: [1, 1, 0.8] });
      c.poser(geoCylindre(0.2, 0.27, 8), m.metal, 0x8a8c86, { x: sx, y: 0.34, z: s * 0.85, rx: Math.PI / 2 });
    }
    // cellule sanitaire et cabine
    c.boite(3.6, 2.0, 2.0, blanc, { x: -0.9, y: 1.65 }, m.satin, { nuance: 0.02 });
    c.boite(1.6, 1.35, 1.95, blanc, { x: 1.7, y: 1.33 }, m.satin, { nuance: 0.02 });
    c.boite(0.7, 0.6, 1.9, blanc, { x: 2.75, y: 0.95 }, m.satin);
    c.boite(0.05, 0.62, 1.7, 0xffffff, { x: 2.38, y: 1.7, rz: 0.35 }, m.verre);
    for (const s of [-1, 1]) c.boite(0.8, 0.5, 0.05, 0xffffff, { x: 1.7, y: 1.72, z: s * 0.98 }, m.verre);
    c.boite(0.2, 0.25, 1.95, 0x3a3836, { x: 3.12, y: 0.75 }, m.tole);
    // bande rouge, croix et inscriptions, gyrophare
    for (const s of [-1, 1]) {
      c.boite(5.0, 0.22, 0.02, COUL.rougePasse, { x: 0.3, y: 1.15, z: s * 1.005 }, m.satin);
      panneau(c, m.enseignes, R.ambulance, { x: -0.9, y: 1.95, z: s * 1.02, ry: s > 0 ? 0 : Math.PI }, 2.8, 0.7);
    }
    panneau(c, m.enseignes, R.croix, { x: -0.9, y: 2.66, rx: -Math.PI / 2 }, 1.2, 1.2);
    c.boite(0.3, 0.16, 1.2, 0x5a7f9a, { x: 0.8, y: 2.1 }, m.satin);
    // rouille au bas de caisse
    for (let i = 0; i < 7; i++) c.boite(c.entre(0.3, 0.9), c.entre(0.1, 0.35), 0.02, PALETTE.rouille, { x: c.entre(-2.5, 2.3), y: c.entre(0.75, 0.95), z: (c.hasard() < 0.5 ? -1 : 1) * 1.01 }, m.tole, { nuance: 0.1 });
    // portes arrière ouvertes, brancard à moitié sorti
    for (const s of [-1, 1]) c.repere({ x: -2.7, y: 1.6, z: s * 0.98, ry: s * 1.7 }, () => c.boite(0.05, 1.85, 0.95, blanc, { z: -s * 0.47 }, m.satin));
    brancard(c, -2.6, 0, 0.1, false);
  });
  // L'emprise au sol : un rectangle orienté
  const coins = [[-2.7, -1], [3.1, -1], [3.1, 1], [-2.7, 1]].map(([u, v]) => [x + u * Math.cos(ry) + v * Math.sin(ry), z - u * Math.sin(ry) + v * Math.cos(ry)]);
  for (let i = 0; i < 4; i++) b.obstacle(coins[i][0], coins[i][1], coins[(i + 1) % 4][0], coins[(i + 1) % 4][1], "ambulance");
}

// ---------- La galerie à arcades et la chapelle (carte « cour ») ----------

function galerieEtChapelle(k) {
  const { c, G, m, usure, b } = k;
  const x0 = -19.5;
  const z1 = 6.2;
  const z2 = 24;
  const n = 6;
  const pas = (z2 - z1) / n;
  // Les arcades (couche « galerie »), plinthes des piles toujours visibles
  for (const s of [-1, 1]) {
    for (let i = 0; i < n; i++) {
      const zc = z1 + (i + 0.5) * pas;
      const tombe = s === 1 && i === 3 && usure > 0.45;
      if (!tombe) G.poser(geoArcade(pas, 3.6, pas - 0.6, 2.0, 0.35), m.beton, COUL.betonBlanc, { x: x0 + s * 1.6, y: 0, z: zc, ry: Math.PI / 2 }, { nuance: 0.02 });
      else gravats(c, x0 + 2.4, zc, 1.4, 14, [COUL.betonBlanc, COUL.betonGris, PALETTE.pierre]);
    }
    for (let i = 0; i <= n; i++) {
      const z = z1 + i * pas;
      c.pave(x0 + s * 1.6 - 0.25, 0, z - 0.3, x0 + s * 1.6 + 0.25, CUTI, z + 0.3, COUL.betonBlanc, m.beton, { nuance: 0.02 });
      b.obstacle(x0 + s * 1.6, z - 0.3, x0 + s * 1.6, z + 0.3, "pile");
    }
  }
  // Toit plat de la galerie, avec son chéneau ; un pan s'est effondré
  G.pave(x0 - 1.95, 3.6, z1, x0 + 1.95, 3.85, z1 + pas * 3, COUL.betonBlanc, m.beton, { crasse: false });
  G.pave(x0 - 1.95, 3.6, z1 + pas * 4, x0 + 1.95, 3.85, z2, COUL.betonBlanc, m.beton, { crasse: false });
  G.repere({ x: x0 + 0.2, y: 2.2, z: z1 + pas * 3.5, rx: 0.5, rz: 0.2 }, () => G.boite(3.6, 0.25, pas, COUL.betonBlanc, {}, m.beton));
  mousse(G, x0, 3.85, z1 + 4, 1.5, 4);
  mousse(G, x0, 3.85, z2 - 3, 1.5, 4);
  touffes(G, [[x0 - 1.5, z1 + 2, 3.85], [x0 + 1.4, z2 - 1, 3.85], [x0, z1 + 7, 3.85]], PALETTE.herbeSeche);
  // Sol de la galerie, fauteuil roulant et feuilles mortes
  fauteuilRoulant(c, x0 + 0.4, 12.5, 1.9);
  lit(c, x0 - 0.6, 18.5, Math.PI / 2 + 0.2, "nu");
  jonchee(c, x0 - 1.4, z1, x0 + 1.4, z2, Math.round(30 + 50 * usure), undefined, 0.06);
  lierre(c, x0 - 1.6, 0, 9, -Math.PI / 2, 4, 3, Math.round(30 + 40 * usure));
  lierre(G, x0 + 1.79, 0, 20, Math.PI / 2, 4, 3.5, Math.round(40 + 50 * usure));

  // La chapelle (x -23,5 → -15,5 ; z 24 → 34) : brique, lancettes, rosace au pignon sud, clocheton
  const xa = -23.5;
  const xb = -15.5;
  const za = 24;
  const zb = 34;
  const hc = 5.6;
  const brique = { couleur: 0x9a5c46, mat: m.brique, ep: 0.45, cut: CUTI };
  const lancette = (u) => ({ u, l: 0.9, bas: 1.6, haut: 4.4, type: "fenetre", croisillons: 1, traverses: 4, appui: false, cadre: 0x3e3c38, matCadre: m.tole, bris: k.bris });
  // Rien n'est plus beau qu'un mur nord avec la porte de la galerie
  const murs = [
    [[xb, za], [xa, za], [{ u: 4, l: 1.8, bas: 0, haut: 3.0, type: "vide" }]],
    [[xa, za], [xa, zb], [2.5, 5, 7.5].map(lancette)],
    [[xb, zb], [xb, za], [lancette(2.2), { u: 5, l: 1.5, bas: 0, haut: 2.8, type: "vide" }, lancette(7.8)]],
    [[xa, zb], [xb, zb], []],
  ];
  for (const [a, bb, ouv] of murs) {
    murCoupe({ b, c, T: G }, a, bb, { ...brique, h: hc, ouvertures: ouv });
    bandes(a, bb, 0.45, [
      { y1: 0, y2: 0.6, s: 0.05, couleur: COUL.betonGris, mat: m.beton, ch: c, trous: ouv.filter((o) => o.bas < 0.5).map((o) => [o.u - o.l / 2, o.u + o.l / 2]) },
      { y1: hc - 0.3, y2: hc, s: 0.12, couleur: COUL.betonBlanc, mat: m.beton, ch: G },
    ]);
  }
  // Arcs brisés au-dessus des lancettes
  for (const [x, z] of [[xa - 0.24, 26.5], [xa - 0.24, 29], [xa - 0.24, 31.5], [xb + 0.24, 26.2], [xb + 0.24, 31.8]]) G.poser(geoTriangle(1.1, 0.6, 0.12), m.beton, COUL.betonBlanc, { x, y: 4.4, z, ry: Math.PI / 2 });
  // Les pignons et la rosace
  for (const z of [za, zb]) G.poser(geoTriangle(8.9, 3.4, 0.45), m.brique, 0x9a5c46, { x: -19.5, y: hc, z }, { nuance: 0.02, crasse: false });
  G.poser(geoCylindre(1.15, 0.2, 14), m.beton, COUL.betonBlanc, { x: -19.5, y: hc + 1.2, z: zb + 0.2, rx: Math.PI / 2 });
  panneau(G, m.enseignes, R.rosace, { x: -19.5, y: hc + 1.2, z: zb + 0.31 }, 1.9, 1.9);
  // La porte latérale (côté cour) : fronton de béton, un vantail ouvert, l'autre tombé dans l'herbe
  G.poser(geoTriangle(2.0, 0.8, 0.2), m.beton, COUL.betonBlanc, { x: xb + 0.3, y: 2.8, z: 29, ry: Math.PI / 2 });
  c.repere({ x: xb + 0.25, z: 29.7, ry: Math.PI / 2 + 1.2 }, () => c.boite(0.72, 2.75, 0.08, PALETTE.boisSombre, { x: -0.36, y: 1.38 }, m.mat, { nuance: 0.05 }));
  c.boite(2.7, 0.08, 0.72, PALETTE.boisSombre, { x: xb + 1.6, y: 0.05, z: 28.5, ry: 0.3 }, m.mat);
  // Le toit d'ardoise (faîtage nord-sud) et le clocheton sur le pignon sud
  toitDeuxPans(G, -19.5, 29, 10, 8.9, hc, 3.4, { ry: Math.PI / 2, debord: 0.3, trous: usure > 0.5 ? [{ u: -1.5, v: -1, l: 1.8, p: 0.5 }] : [] });
  G.repere({ x: -19.5, y: hc + 3.3, z: zb - 0.2 }, () => {
    for (const sx of [-0.45, 0.45]) G.boite(0.2, 1.4, 0.4, COUL.betonBlanc, { x: sx, y: 0.7 }, m.beton);
    G.boite(1.2, 0.2, 0.5, COUL.betonBlanc, { y: 1.5 }, m.beton);
    G.poser(geoTriangle(1.3, 0.6, 0.5), m.ardoise, PALETTE.ardoise, { y: 1.6 });
    G.poser(new THREE.CylinderGeometry(0.12, 0.3, 0.45, 8), m.metal, 0x6f8a6a, { y: 0.9 });
    G.boite(0.06, 0.7, 0.06, 0x3a3836, { y: 2.45 }, m.tole);
    G.boite(0.4, 0.06, 0.06, 0x3a3836, { y: 2.6 }, m.tole);
  });
  // L'intérieur : bancs (certains renversés), autel, croix, veilleuse
  c.pave(xa, 0, za, xb, 0.08, zb, 0xb9ab92, m.carrelage, { crasse: false, nuance: 0 });
  for (let r = 0; r < 5; r++) {
    for (const s of [-1, 1]) {
      const renverse = c.hasard() < 0.25 * usure + 0.05;
      c.repere(renverse ? { x: -19.5 + s * 1.9, z: 25.6 + r * 1.3, y: 0.25, rx: Math.PI / 2 - 0.1, ry: c.entre(-0.4, 0.4) } : { x: -19.5 + s * 1.9, z: 25.6 + r * 1.3, ry: c.entre(-0.06, 0.06) }, () => {
        c.boite(2.6, 0.06, 0.4, PALETTE.bois, { y: 0.46 }, m.mat);
        c.boite(2.6, 0.5, 0.05, PALETTE.bois, { y: 0.8, z: -0.2 }, m.mat);
        for (const sx of [-1.2, 1.2]) c.boite(0.06, 0.9, 0.45, PALETTE.boisSombre, { x: sx, y: 0.45 }, m.mat);
      });
    }
  }
  c.pave(-21, 0.08, 32.4, -18, 1.0, 33.2, 0xd8d0bc, m.beton);
  c.boite(3.2, 0.03, 0.9, 0xe0dccf, { x: -19.5, y: 1.02, z: 32.8 }, m.toile);
  c.boite(0.12, 1.8, 0.08, PALETTE.boisSombre, { x: -19.5, y: 3.2, z: zb - 0.3 }, m.mat);
  c.boite(0.9, 0.12, 0.08, PALETTE.boisSombre, { x: -19.5, y: 3.6, z: zb - 0.3 }, m.mat);
  c.boite(0.08, 0.18, 0.08, 0xffd9a0, { x: -19.5, y: 1.13, z: 32.6 }, m.satin);
  jonchee(c, xa + 0.3, za + 0.3, xb - 0.3, zb - 0.3, Math.round(20 + 40 * usure), undefined, 0.09);
  raiDeLumiere(c, [-15.5, 4.2, 29], [-18.5, 0.1, 29.5], 0.9, 0.09);
  // Abords de la chapelle
  semerTouffes(c, xa - 3, za, xb + 3, zb + 1.5, Math.round(20 + 40 * usure), PALETTE.herbe, 0);
  lierre(c, xb + 0.25, 0, 32, Math.PI / 2, 3, 3.5, Math.round(30 + 50 * usure));
  arbuste(c, -24.5, 33.5, 1.4);
  arbuste(c, -14.5, 25, 1.1);
}

// ---------- Abords de la carte « soins » (bande de cour au sud, cour de service au nord) ----------

function abordsSoins(k) {
  const { c, m, usure } = k;
  c.pave(-28, -0.01, 6.3, 28, 0.03, 12, 0x8d9a5c, m.mat, { crasse: false, nuance: 0 });
  c.pave(-16, 0, 6.3, 28, 0.045, 12, COUL.asphalte, m.asphalte, { crasse: false, nuance: 0 });
  c.pave(-21, 0, 6.3, -18, 0.05, 12, 0xb1ab9c, m.beton, { crasse: false, nuance: 0 });
  semerTouffes(c, -27, 6.5, 27, 11.8, Math.round(30 + 60 * usure), PALETTE.herbeSeche, 0.04);
  for (const x of [-15, -9, 9, 13]) arbuste(c, x, 7.1, 0.9 + c.hasard() * 0.7);
  jonchee(c, -16, 6.5, 27, 11.8, Math.round(30 + 50 * usure), undefined, 0.055);
  lierre(c, -12.2, 0, 6.24, 0, 3.4, 3.2, Math.round(40 + 70 * usure));
  panneau(c, m.enseignes, R.non, { x: 19.5, y: 0.55, z: 6.23 }, 0.9, 0.9);
  // L'amorce de la galerie (on la devine)
  for (const s of [-1, 1]) for (const z of [6.2, 9.2]) c.pave(-19.5 + s * 1.6 - 0.25, 0, z - 0.3, -19.5 + s * 1.6 + 0.25, CUTI, z + 0.3, COUL.betonBlanc, m.beton);
  for (const x of [-4.6, 4.6]) c.pave(x - 0.5, 0, 10.5, x + 0.5, 0.1, 12, COUL.betonGris, m.beton);
}

// ---------- L'arrière (nord) : cour de service ----------

function arriere(k) {
  const { c, m, usure } = k;
  const zmin = k.cour ? -16 : -13;
  c.pave(-24, -0.01, zmin, 24, 0.03, -6.3, 0x8f9363, m.mat, { crasse: false, nuance: 0 });
  c.pave(-3, 0, zmin, 3, 0.045, -6.3, COUL.asphalte, m.asphalte, { crasse: false, nuance: 0 });
  // Conteneurs à déchets de soins (jaunes, couvercle ouvert), bouteilles d'oxygène, palettes
  for (let i = 0; i < 3; i++) {
    c.repere({ x: 4.5 + i * 1.3, z: -8, ry: c.entre(-0.2, 0.2) }, () => {
      c.boite(1.0, 1.1, 0.9, 0xc9a93e, { y: 0.55 }, m.satin, { nuance: 0.04 });
      c.boite(1.0, 0.06, 0.9, 0xb89a38, { y: 1.3, z: -0.45, rx: i === 1 ? -1.2 : -0.1 }, m.satin);
    });
  }
  for (let i = 0; i < 5; i++) c.tube([-4 + i * 0.35, 0, -7.2], [-4 + i * 0.35 + (i === 3 ? 0.9 : 0), i === 3 ? 0.2 : 1.4, -7.2 + (i === 3 ? 0.6 : 0)], 0.11, i % 2 ? 0x3c6e5a : 0xd9d9d0, m.tole, 7);
  for (let i = 0; i < 3; i++) c.boite(1.2, 0.14, 1.0, PALETTE.boisGris, { x: -9, y: 0.07 + i * 0.15, z: -8.5, ry: i * 0.15 }, m.mat);
  semerTouffes(c, -23.5, zmin + 0.5, 23.5, -6.5, Math.round(40 + 70 * usure), PALETTE.herbe, 0.02);
  lierre(c, -16, 0, -6.24, Math.PI, 4, 3.4, Math.round(40 + 60 * usure));
  if (k.cour) {
    arbre(c, -14, -11, 8, "feuillu");
    arbre(c, 15, -12, 7.5, "feuillu");
  } else {
    arbre(c, -14, -10.5, 7, "feuillu");
  }
}
