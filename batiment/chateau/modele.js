// Le château abandonné (nouveau lieu proposé : Campagne, moyen/lointain, danger ●●●).
//
// Un château néo-Renaissance de la fin du XIXe siècle, bâti en tuffeau, noirci de coulures : corps de logis à haut
// comble d'ardoise, pavillon central en avant-corps, grand perron à double volée, tours rondes coiffées de cônes, serre
// de fer et de verre accolée à l'aile est. Ses derniers propriétaires l'avaient « connecté » de la cave aux girouettes.
// Ce qu'on vient y voir : la salle de bal à ciel ouvert où pousse un chêne, la charpente nue de l'aile ouest, la tour
// au toit crevé, l'escalier d'honneur effondré à mi-hauteur, le salon au piano renversé où des survivants font du feu
// dans la cheminée monumentale, et le robot-majordome qui attend toujours qu'on le recharge.
//
// Deux cartes (budget : ≤ 60 000 triangles et ≤ 40 appels de dessin par carte) :
// - « parc » : le parc et les façades (fontaine asséchée, statue décapitée, parterres envahis, grille d'honneur) ;
// - « interieur » : le rez-de-chaussée visitable (hall, salle de bal, salon, serre) et les abords immédiats.
//
// Règle de coupe : tout ce qui dépasse 3 m de haut dans le château (haut des murs du rez-de-chaussée, étage, combles,
// tours) appartient à l'une des trois couches qui s'effacent (aile ouest, pavillon central, aile est).

import * as THREE from "three";
import { Batiment, PALETTE, mur, matiere, matiereMonde, matiereTexture, matiereVerre, matiereEau, matiereLueur, dessiner, aleatoire, taches, lierre, touffes, semerTouffes, gravats, debris, jonchee, mousse, arbuste, arbre } from "../commun/atelier.js";

// ---------- La fiche ----------

export const FICHE = {
  id: "chateau",
  nom: "Le château abandonné",
  lieu: "Nouveau lieu · Campagne · moyen/lointain",
  environnement: "campagne",
  anneau: "moyen/lointain",
  danger: 3,
  recit:
    "Le château de Vaulx-Morand avait survécu à deux guerres et à trois héritages. Il n'a pas survécu à sa dernière mise à jour : on l'avait « connecté » de la cave aux girouettes, et quand le réseau est tombé, plus personne ne savait ouvrir une porte à la main. Aujourd'hui un chêne pousse dans la salle de bal, et le majordome attend toujours qu'on le recharge.",
  inspiration:
    "le château Miranda (Celles, Belgique : néo-gothique, toits pointus), le château de Noisy, les châteaux néo-Renaissance de la Loire laissés à l'abandon",
  reperes: [
    "La silhouette : tours rondes à cônes d'ardoise, hautes cheminées, lucarnes à frontons et pinacles, épis de faîtage",
    "La tour sud-ouest au toit crevé : la charpente du cône à nu, les ardoises arrachées",
    "L'aile ouest sans toit : fermes de charpente contre le ciel, cheminée orpheline, murs écrêtés",
    "La salle de bal à ciel ouvert : un chêne pousse dans le parquet, rais de lumière, lustre écrasé au sol",
    "Le hall en damier et l'escalier d'honneur : volée de gauche effondrée à mi-hauteur, marches pendues à droite",
    "Le robot-majordome connecté, couché au pied de l'escalier, nœud papillon rouge, voyant qui clignote encore",
    "Le salon : cheminée monumentale où brûle le feu de survivants, piano à queue renversé, papier peint décollé",
    "La serre de fer et de verre, vitres crevées, un bouleau qui passe à travers la voûte",
    "Le parc : fontaine asséchée où une voiture autonome a fini sa course, statue décapitée, buis envahis",
    "La borne « Château connecté » près du perron : « Mise à jour requise »",
    "La chapelle castrale : bancs renversés, autel aux cierges, vitraux brisés dont les couleurs tombent sur le dallage, cloche de bronze tombée",
    "La maison du gardien, près de la grille : table, poêle, lit, râtelier ; un vrai premier abri",
    "Les communs : écuries en U (stalles, râteliers, sellerie), remise à calèches et sa limousine « autonome » qui croit encore aller au golf",
    "Le pigeonnier rond (boulins, échelle tournante, rai de lumière de la lanterne) et l'orangerie aux grandes baies cintrées, où un citronnier tient encore",
  ],
  cartes: [
    {
      id: "parc",
      nom: "Le parc et les façades",
      lot: { l: 84, p: 84 },
      depart: { x: 0, z: 37 },
      description: "de la grille d'honneur au perron, avec la chapelle et la maison du gardien (visitables) ; le château se visite par la carte « intérieur », les communs par l'allée qui part vers l'est",
      entrees: [
        { x: 0, z: 40, nature: "grille d'honneur (un battant à terre)" },
        { x: 0, z: -11.6, nature: "perron et porte d'honneur (vers l'intérieur)" },
        { x: -17.8, z: -23.7, nature: "brèche de la salle de bal (vers l'intérieur)" },
        { x: 25.9, z: -26.4, nature: "porte de la serre (vers l'intérieur)" },
        { x: 7.3, z: -32.2, nature: "porte de service, côté nord (vers l'intérieur)" },
        { x: 42, z: -10.3, nature: "allée des communs (vers la carte « communs »)" },
        { x: -32, z: 8.3, nature: "porte de la chapelle (entrouverte)" },
        { x: -8.5, z: 34.35, nature: "porte de la maison du gardien" },
      ],
      fouille: [
        { x: 0.8, z: 6.5, quoi: "voiture autonome de luxe dans la fontaine : batterie, câbles, trousse de secours" },
        { x: 7.5, z: -10.6, quoi: "borne « Château connecté » : écran, petite batterie, haut-parleur" },
        { x: 0, z: -11.4, quoi: "niche sous le perron : vieux outils de jardinier, seau, corde" },
        { x: 3.4, z: 32, quoi: "lampadaire tordu : lanterne de laiton, verre" },
        { x: -14, z: 18.2, quoi: "pied de la statue : la tête de marbre (trophée), mousse" },
        { x: -27, z: 30.5, quoi: "arbre abattu : bois mort sec, champignons" },
        { x: -31.1, z: 6.2, quoi: "cloche de bronze tombée du clocheton (bronze, Book 20)" },
        { x: -32, z: -5.4, quoi: "autel de la chapelle : chandeliers de laiton, cierges, nappe" },
        { x: -11.75, z: 35.9, quoi: "buffet du gardien : conserves, allumettes, bougies" },
        { x: -13.4, z: 31.6, quoi: "râtelier du gardien : fourche, pelle, vieux fusil de chasse rouillé (sans munitions)" },
        { x: -9.75, z: 31.8, quoi: "lit du gardien : couverture, oreiller ; poêle et bois sec" },
      ],
      eteints: [
        { x: 4, z: 14, type: "errant" },
        { x: -9, z: 2, type: "errant" },
        { x: -22, z: 29, type: "rampant (dans l'herbe haute, près de l'arbre abattu)" },
        { x: 27, z: -18, type: "ancien habitant (jardinier, sécateur à la ceinture)" },
        { x: 2.5, z: 4.5, type: "putréfié (près de la voiture de la fontaine)" },
        { x: -31, z: -1, type: "ancien habitant (le curé de la paroisse, chapelet à la main)" },
        { x: -6, z: 30, type: "errant (autour de la maison du gardien)" },
      ],
    },
    {
      id: "interieur",
      nom: "L'intérieur",
      lot: { l: 54, p: 38 },
      depart: { x: -2, z: 13 },
      description: "le rez-de-chaussée visitable : hall, salle de bal, salon, serre ; l'étage est inaccessible",
      entrees: [
        { x: -2, z: 8.3, nature: "perron et porte d'honneur (vers le parc)" },
        { x: -19.8, z: -3.7, nature: "brèche de la salle de bal" },
        { x: 23.9, z: -6.4, nature: "porte de la serre" },
        { x: 5.3, z: -12.2, nature: "porte de service, côté nord" },
      ],
      fouille: [
        { x: -1.1, z: -1.7, quoi: "robot-majordome : batterie, servomoteurs, câbles (« Bonsoir, Monsieur. »)" },
        { x: 11.6, z: -0.8, quoi: "piano renversé : cordes d'acier, feutre, bois sec" },
        { x: 8.5, z: -9.4, quoi: "campement de survivants devant la cheminée : conserves, couverture, allumettes" },
        { x: -10.6, z: -1.2, quoi: "lustre tombé : laiton, pampilles de cristal" },
        { x: 14.2, z: -9.3, quoi: "commode du salon : linge, bougies, papiers" },
        { x: 19, z: -8, quoi: "serre : outils de jardinage, sachets de graines, pots" },
        { x: -6.4, z: -5.6, quoi: "portrait tombé : cadre doré (bois sec), toile" },
      ],
      eteints: [
        { x: -0.5, z: 1.5, type: "errant" },
        { x: 6, z: 0, type: "ancien habitant (gouvernante, trousseau de clés)" },
        { x: -15.5, z: -7, type: "errant" },
        { x: -16.5, z: -0.5, type: "rampant (sous les gravats de la salle de bal)" },
        { x: 21, z: -9, type: "putréfié (parmi les plantes de la serre)" },
      ],
    },
    {
      id: "communs",
      nom: "Les communs",
      lot: { l: 70, p: 55 },
      depart: { x: 0, z: 24 },
      description:
        "au bout de l'allée des communs, qui part de la cour d'honneur vers l'est du parc et arrive ici par le sud : cour pavée, écuries en U, remise à calèches, pigeonnier, orangerie ; tous les rez-de-chaussée se visitent, les greniers sont inaccessibles",
      entrees: [
        { x: 0, z: 27.5, nature: "allée des communs (vers le parc)" },
        { x: 0, z: -10.3, nature: "écuries : porte des stalles (ouverte)" },
        { x: -6.5, z: -10.3, nature: "écuries : porte des stalles" },
        { x: -9.8, z: 2.6, nature: "sellerie (porte à terre)" },
        { x: 9.2, z: -6.5, nature: "remise : porte charretière ouverte" },
        { x: 9.2, z: 0.5, nature: "remise : porte charretière arrachée" },
        { x: -14, z: 16.3, nature: "pigeonnier" },
        { x: 19, z: 19.2, nature: "orangerie : porte-fenêtre du midi" },
        { x: 14, z: 10.8, nature: "orangerie : porte de la cour" },
      ],
      fouille: [
        { x: -14.7, z: -1.3, quoi: "coffres de la sellerie : sangles, couvertures de cheval, cirage" },
        { x: -16.2, z: 1.5, quoi: "selles et brides : cuir, boucles, mors d'acier" },
        { x: -4, z: -15.5, quoi: "stalles : foin pourri (litière, paillage), fourche, seaux" },
        { x: 13, z: 0.4, quoi: "limousine « autonome » : batterie, câbles, trousse de secours (« Destination : golf »)" },
        { x: 13.2, z: -5.6, quoi: "calèche : ferrures, lanternes de laiton, velours" },
        { x: 16.2, z: -2, quoi: "établi de la remise : outils, graisse, jerricans (un fond de gazole)" },
        { x: -14, z: 13, quoi: "pigeonnier : fiente (salpêtre, engrais), plumes" },
        { x: 10.7, z: 15.5, quoi: "orangerie : outils du jardinier, pots, sachets de graines" },
        { x: 19, z: 16, quoi: "citronnier vivant : citrons (une fois l'an)" },
        { x: 3.7, z: -4.6, quoi: "pompe à bras : eau (à purifier)" },
        { x: 5, z: 4.8, quoi: "vieux tracteur : batterie, courroies, pièces" },
      ],
      eteints: [
        { x: 2, z: 2, type: "errant (dans la cour)" },
        { x: -3, z: -12.5, type: "ancien habitant (palefrenier, fourche à la main)" },
        { x: -5.6, z: -6.6, type: "rampant (dans l'herbe du tas de fumier)" },
        { x: 12, z: -2, type: "errant (dans la remise)" },
        { x: 24, z: 15, type: "putréfié (dans l'orangerie)" },
      ],
    },
  ],
};

// ---------- Couleurs et constantes ----------

const C = {
  tuffeau: 0xcdbf9f,
  encadrement: 0xdcd1b5,
  socle: 0xa79d87,
  ardoise: 0x4d545c,
  plomb: 0x656c70,
  charpente: 0x5e4a37,
  charpenteGrise: 0x7a6b5b,
  boisPorte: 0x4e3a2b,
  marbre: 0xdbd5c8,
  marbreGris: 0xa7a39b,
  velours: 0x6b2330,
  dore: 0xa88a4a,
  stuc: 0xd9cfb6,
  laque: 0x22201f,
  papierVert: 0xb4c6b1,
  papierRose: 0xdcb9a1,
  plafond: 0xddd5c3,
  parquet: 0xd0ad85,
  gravier: 0xb7aa8d,
  suie: 0x221e1b,
  fer: 0x3b3934,
  ferPeint: 0xc3cbbf,
  terreCuite: 0xa45f43,
  braise: 0xff7a2a,
  brique: 0xa86a52,
  bois: 0x6e5641,
  cuir: 0x6b3f25,
  pave: 0x9d968a,
  bronze: 0x8a6a3a,
  caisse: 0x6f8b76,
};

const Y = 3.0; // la coupe : au-dessus, tout appartient aux couches qui s'effacent
const Y2 = 4.85; // limite entre le haut du rez-de-chaussée et l'étage (pour les murs : une ouverture par colonne)
const EP = 0.6; // épaisseur des murs de pierre
const H_AILE = 8.5; // corniche des ailes
const H_PAV = 9.6; // corniche du pavillon central

const ICO = new THREE.IcosahedronGeometry(1, 0);
const BOULE = new THREE.IcosahedronGeometry(1, 1);
const POINTE = new THREE.ConeGeometry(1, 1, 4);
const BALUSTRE = new THREE.LatheGeometry([[0.065, 0], [0.04, 0.1], [0.085, 0.3], [0.035, 0.52], [0.065, 0.62]].map(([r, y]) => new THREE.Vector2(r, y)), 5);
const VASE = new THREE.LatheGeometry([[0.01, 0], [0.17, 0], [0.09, 0.08], [0.1, 0.18], [0.27, 0.38], [0.31, 0.52], [0.26, 0.56], [0.01, 0.5]].map(([r, y]) => new THREE.Vector2(r, y)), 7);
const VASQUE = new THREE.LatheGeometry([[0.3, 0], [0.5, 0.08], [1.2, 0.3], [1.35, 0.42], [1.28, 0.47], [0.05, 0.38]].map(([r, y]) => new THREE.Vector2(r, y)), 12);

// ---------- Matériaux (partagés : chaque matériau = un appel de dessin, et chaque couche le duplique) ----------

let MATS = null;
function materiaux() {
  if (MATS) return MATS;
  const tuffeau = matiereTexture(texTuffeau());
  tuffeau.userData.tuile = 4;
  const ecran = new THREE.MeshStandardMaterial({ map: texEcrans(), vertexColors: true, roughness: 0.5 });
  MATS = {
    mat: matiere(0.95, 0),
    satine: matiere(0.6, 0.05),
    metal: matiere(0.4, 0.7),
    tole: matiere(0.75, 0.3),
    tuffeau,
    ardoise: matiereMonde("ardoise"),
    damier: matiereMonde("damier"),
    parquet: matiereMonde("parquet"),
    papier: matiereMonde("papierPeint"),
    brique: matiereMonde("brique"),
    pave: matiereMonde("carrelage"),
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    eau: matiereEau(0x3c4a40, 0.8),
    lueur: matiereLueur(0xfff0c8, 0.16),
    ecran,
  };
  return MATS;
}

/** Le tuffeau du château : grandes assises claires, coulures noires qui tombent des corniches, lichen. Tuile de 4 m. */
function texTuffeau() {
  return dessiner("chateau-tuffeau", 256, 256, (g) => {
    const a = aleatoire(41);
    g.fillStyle = "#cfc8b8";
    g.fillRect(0, 0, 256, 256);
    for (let r = 0; r < 8; r++) {
      let x = -a() * 60;
      while (x < 256) {
        const l = 36 + a() * 52;
        const v = 232 + Math.floor((a() - 0.5) * 24);
        g.fillStyle = `rgb(${v},${v - 5},${v - 15})`;
        g.fillRect(x + 1, r * 32 + 1, l - 2, 30);
        x += l;
      }
    }
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = a() < 0.5 ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)";
      g.fillRect(a() * 256, a() * 256, 1 + a() * 2, 1 + a() * 2);
    }
    // Coulures noires : elles partent du haut de la tuile (sous les corniches et les appuis) et s'effilochent.
    // (flou léger : des traînées de suie, pas des planches)
    g.filter = "blur(2px)";
    for (let i = 0; i < 18; i++) {
      const large = i < 6;
      const x = a() * 256;
      const lg = large ? 90 + a() * 140 : 30 + a() * 90;
      const d = g.createLinearGradient(0, 0, 0, lg);
      const f = large ? 0.1 + a() * 0.12 : 0.12 + a() * 0.12;
      d.addColorStop(0, `rgba(36,32,28,${f})`);
      d.addColorStop(1, "rgba(36,32,28,0)");
      g.fillStyle = d;
      g.fillRect(x, 0, large ? 18 + a() * 40 : 3 + a() * 5, lg);
    }
    g.filter = "none";
    taches(g, a, 10, "rgba(60, 55, 45, 0.18)", 18, 60, 256, 256);
    taches(g, a, 7, "rgba(95, 110, 60, 0.22)", 8, 28, 256, 256);
  });
}

/** Les écrans de l'Abondance (encre électronique, figée au dernier message) : la borne et le visage du majordome. */
function texEcrans() {
  return dessiner(
    "chateau-ecrans-3",
    768,
    256,
    (g) => {
      // À gauche : la borne « Château connecté »
      g.fillStyle = "#d8dcd2";
      g.fillRect(0, 0, 256, 256);
      g.fillStyle = "#2f6f73";
      g.fillRect(0, 0, 256, 50);
      g.textAlign = "center";
      g.fillStyle = "#e9dfc6";
      g.font = "bold 23px sans-serif";
      g.fillText("CHÂTEAU", 128, 23);
      g.font = "bold 17px sans-serif";
      g.fillText("CONNECTÉ ✦ VISITE PREMIUM", 128, 43);
      g.fillStyle = "#c8362b";
      g.fillRect(14, 68, 228, 56);
      g.fillStyle = "#fff";
      g.font = "bold 24px sans-serif";
      g.fillText("MISE À JOUR", 128, 93);
      g.fillText("REQUISE", 128, 117);
      g.fillStyle = "#2a2a2a";
      g.font = "16px sans-serif";
      g.fillText("Veuillez patienter…", 128, 152);
      g.strokeStyle = "#2a2a2a";
      g.lineWidth = 2;
      g.strokeRect(28, 168, 200, 18);
      g.fillRect(31, 171, 7, 12);
      g.font = "13px sans-serif";
      g.fillText("3 % — ne pas éteindre le château", 128, 208);
      g.fillText("Merci de votre patience.", 128, 228);
      taches(g, aleatoire(5), 8, "rgba(70, 64, 50, 0.25)", 10, 40, 256, 256);
      // À droite : le visage du robot-majordome
      g.fillStyle = "#121618";
      g.fillRect(256, 0, 256, 256);
      g.strokeStyle = "#8fd0e0";
      g.lineWidth = 9;
      g.lineCap = "round";
      for (const x of [336, 432]) {
        g.beginPath();
        g.arc(x, 104, 26, Math.PI * 0.15, Math.PI * 0.85);
        g.stroke();
      }
      g.fillStyle = "#8fd0e0";
      g.font = "bold 22px sans-serif";
      g.fillText("Bonsoir, Monsieur.", 384, 190);
      g.fillStyle = "#c8362b";
      g.font = "bold 16px sans-serif";
      g.fillText("BATTERIE : 0 %", 384, 222);
      // À droite : le tableau de bord de la limousine « autonome »
      g.fillStyle = "#0e1a22";
      g.fillRect(512, 0, 256, 256);
      g.strokeStyle = "#2f6f73";
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(540, 230);
      g.bezierCurveTo(580, 160, 700, 190, 730, 120);
      g.stroke();
      g.fillStyle = "#c8362b";
      g.beginPath();
      g.arc(730, 120, 9, 0, 7);
      g.fill();
      g.fillStyle = "#e9dfc6";
      g.font = "bold 24px sans-serif";
      g.fillText("DESTINATION :", 640, 42);
      g.font = "bold 34px sans-serif";
      g.fillText("GOLF ⛳", 640, 82);
      g.font = "15px sans-serif";
      g.fillStyle = "#8fd0e0";
      g.fillText("Arrivée estimée : —", 640, 156);
      g.fillText("Recalcul de l'itinéraire…", 640, 178);
    },
    false,
  );
}

// ---------- Le contexte de construction ----------

let K = null; // { b, M, OX, OZ, u, carte, bris, plafond, zO, zC, zE, ob }

/** Les deux chantiers d'une zone (le bas reste, le haut s'efface) : même repère pour les deux. */
function rep(Z, pose, fn) {
  if (Z.b === Z.h) return Z.b.repere(pose, fn);
  Z.b.repere(pose, () => Z.h.repere(pose, fn));
}

/** Le chantier qui reçoit une pièce dont le centre est à la hauteur y. */
function ch(Z, y) {
  return y < Y ? Z.b : Z.h;
}

/** Un pavé coupé à la hauteur Y : le bas dans le chantier permanent, le haut dans la couche. */
function pv(Z, x1, y1, z1, x2, y2, z2, couleur, mat = K.M.mat, opt = undefined) {
  let a = Math.min(y1, y2);
  let b = Math.max(y1, y2);
  if (K.plafond !== undefined) {
    if (a >= K.plafond) return;
    b = Math.min(b, K.plafond);
  }
  if (b - a < 0.005) return;
  if (b <= Y + 1e-4) Z.b.pave(x1, a, z1, x2, b, z2, couleur, mat, opt);
  else if (a >= Y - 1e-4) Z.h.pave(x1, a, z1, x2, b, z2, couleur, mat, opt);
  else {
    Z.b.pave(x1, a, z1, x2, Y, z2, couleur, mat, opt);
    Z.h.pave(x1, Y, z1, x2, b, z2, couleur, mat, opt);
  }
}

/** Un obstacle en coordonnées du château (décalées vers celles de la carte). */
function obs(x1, z1, x2, z2, nature = "mur") {
  K.b.obstacle(x1 + K.OX, z1 + K.OZ, x2 + K.OX, z2 + K.OZ, nature);
}

function obsCercle(x, z, r, n = 10, nature = "mur") {
  for (let i = 0; i < n; i++) {
    const a1 = (i / n) * Math.PI * 2;
    const a2 = ((i + 1) / n) * Math.PI * 2;
    obs(x + Math.cos(a1) * r, z + Math.sin(a1) * r, x + Math.cos(a2) * r, z + Math.sin(a2) * r, nature);
  }
}

function lum(x, y, z, couleur, intensite, portee, nature) {
  K.b.lumiere(x + K.OX, y, z + K.OZ, couleur, intensite, portee, nature);
}

/** Une géométrie de facettes planes (polygones convexes), chacune tournée vers `dehors` ; `double` : visible des deux côtés. */
function facettes(liste) {
  const pos = [];
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
  for (const f of liste) {
    const p = f.pts;
    for (let i = 1; i < p.length - 1; i++) {
      const a = p[0];
      let b = p[i];
      let c = p[i + 1];
      const u = sub(b, a);
      const v = sub(c, a);
      const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      if (n[0] * f.dehors[0] + n[1] * f.dehors[1] + n[2] * f.dehors[2] < 0) [b, c] = [c, b];
      pos.push(...a, ...b, ...c);
      if (f.double) pos.push(...a, ...c, ...b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/** Un rai de lumière (matière partagée). */
function rai(c, depuis, vers, largeur, teinte = 0xffffff) {
  const a = new THREE.Vector3(...depuis);
  const b = new THREE.Vector3(...vers);
  const d = new THREE.Vector3().subVectors(b, a);
  const g = new THREE.CylinderGeometry(largeur * 0.5, largeur * 0.62, d.length(), 4, 1, true);
  const e = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()));
  c.poser(g, K.M.lueur, teinte, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2, rx: e.x, ry: e.y + Math.PI / 4, rz: e.z }, { crasse: false, nuance: 0 });
}

/** Une flaque (matière partagée). */
function flaqueC(c, x, z, rayon) {
  const pts = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const r = rayon * c.entre(0.6, 1.1);
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts)).rotateX(-Math.PI / 2);
  c.poser(g, K.M.eau, 0xffffff, { x, y: 0.035, z }, { crasse: false, nuance: 0 });
}

/** Un panneau d'écran : une part [u0, u1] de la texture des écrans. */
function ecran(c, l, h, u0, u1, pose) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setX(i, u0 + uv.getX(i) * (u1 - u0));
  c.poser(g, K.M.ecran, 0xffffff, pose, { crasse: false, nuance: 0 });
}

// ---------- Murs, fenêtres, portes ----------

/**
 * Un mur du château, de a à b (coordonnées du château), coupé à Y (bas permanent, haut dans la couche de la zone) et
 * encore à Y2 (l'atelier ne perce qu'une ouverture par colonne : on sépare le haut du rez-de-chaussée et l'étage).
 * Le sens de tracé met l'intérieur à droite (côté +z local de notre repère) ; l'extérieur est côté -z local.
 * `ouv` : [{ at (x ou z le long du mur) | u, l, bas, haut, type: fenetre | porte | breche | vide, ... }].
 */
function murZ(Z, a, b, s) {
  const M = K.M;
  const { H, ep = EP, couleur = C.tuffeau, ouv = [], breches = [], interieur = null, interieurHaut = null, exterieur = false, modillons = false } = s;
  const matMur = s.mat ?? M.tuffeau;
  const bandeau = s.bandeau ?? H > 7;
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const L = Math.hypot(dx, dz);
  const ry = -Math.atan2(dz, dx);
  const uDe = (o) => o.u ?? (Math.abs(dz) < 1e-6 ? Math.abs(o.at - a[0]) : Math.abs(o.at - a[1]));
  const os = ouv.map((o) => ({ ...o, u: uDe(o) }));
  const br = breches.map((q) => ({ u: uDe(q), l: q.l, profondeur: q.profondeur }));
  // L'atelier pose le revêtement intérieur sur la face −z locale : on lui donne le mur tracé de b vers a (u inversés).
  const bande = (y1, y2) =>
    os.filter((o) => o.bas < y2 - 0.01 && o.haut > y1 + 0.01).map((o) => ({ u: L - o.u, l: o.l, bas: Math.max(0, o.bas - y1), haut: Math.min(o.haut, y2 + 1) - y1, type: "vide" }));
  const brInv = br.map((q) => ({ ...q, u: L - q.u }));
  mur(Z.b, b, a, { h: Math.min(H, Y), ep, couleur, mat: matMur, ouvertures: bande(0, Y), batiment: K.ob, interieur });
  if (H > Y) mur(Z.h, b, a, { h: Math.min(H, Y2) - Y, y0: Y, ep, couleur, mat: matMur, ouvertures: bande(Y, Y2), interieur: interieurHaut });
  if (H > Y2) mur(Z.h, b, a, { h: H - Y2, y0: Y2, ep, couleur, mat: matMur, ouvertures: bande(Y2, H), breches: brInv, interieur: interieurHaut, arase: s.arase ?? 0 });
  // La crête du mur (brèches de l'étage) : les garnitures s'arrêtent dessous.
  const crete = (u) => {
    let h = H;
    for (const q of br) {
      const t = 1 - Math.abs(u - q.u) / (q.l / 2);
      if (t > 0) h = Math.min(h, H - q.profondeur * Math.pow(t, 0.7) - 0.15);
    }
    return Math.max(Y2, h);
  };
  const pleine = (u) => crete(u) >= H - 0.01;
  // Modénature extérieure : soubassement, bandeau d'étage, corniche à modillons
  if (exterieur) {
    rep(Z, { x: a[0], z: a[1], ry }, () => {
      const e = -ep / 2;
      // soubassement, interrompu aux portes
      const portes = os.filter((o) => o.bas < 0.3).map((o) => [o.u - o.l / 2 - 0.2, o.u + o.l / 2 + 0.2]).sort((p, q) => p[0] - q[0]);
      let u0 = -0.1;
      for (const [p1, p2] of [...portes, [L + 0.1, L + 0.1]]) {
        if (p1 > u0 + 0.05) pv(Z, u0, 0, e - 0.09, Math.min(p1, L + 0.1), 0.8, e + 0.02, C.socle, M.tuffeau);
        u0 = Math.max(u0, p2);
      }
      // bandeau et corniche, par tronçons (coupés par les brèches)
      const pasM = br.length ? 1 : L + 0.8; // un seul tronçon si le mur est entier
      for (let u = -0.4; u < L + 0.4 - 0.01; u += pasM) {
        const u2 = Math.min(u + pasM, L + 0.4);
        const um = (u + u2) / 2;
        if (bandeau && crete(Math.min(L, Math.max(0, um))) > 4.7) pv(Z, u, 4.35, e - 0.13, u2, 4.62, e + 0.02, C.encadrement, M.tuffeau);
        if (pleine(Math.min(L, Math.max(0, um)))) {
          if (H > 5) pv(Z, u, H - 0.75, e - 0.12, u2, H - 0.55, e + 0.02, C.encadrement, M.tuffeau);
          pv(Z, u, H - 0.3, e - 0.4, u2, H, e + 0.02, C.encadrement, M.tuffeau);
          if (modillons) for (let uu = u + 0.25; uu < u2; uu += 0.6) if (uu > 0 && uu < L && (!br.length || uu < u + 1)) pv(Z, uu - 0.07, H - 0.55, e - 0.3, uu + 0.07, H - 0.3, e, C.encadrement, M.tuffeau);
        }
      }
    });
  }
  // Les ouvertures garnies
  for (const o of os) {
    const px = a[0] + (dx * o.u) / L;
    const pz = a[1] + (dz * o.u) / L;
    K.plafond = br.length ? crete(o.u) : undefined;
    rep(Z, { x: px, z: pz, ry }, () => {
      if (o.type === "fenetre") croisee(Z, { ...o, ep });
      else if (o.type === "porte") porteG(Z, { ...o, ep });
      else if (o.type === "breche") brecheG(Z, { ...o, ep });
      else if (o.type === "baie") baieG(Z, { ...o, ep, matMur, couleurMur: couleur });
    });
    K.plafond = undefined;
    // Une fenêtre n'est pas un passage (le jeu ne franchit pas les appuis)
    if ((o.type === "fenetre" || o.type === "baie") && o.bas > 0.2 && o.bas < 1.6) {
      const t1 = (o.u - o.l / 2) / L;
      const t2 = (o.u + o.l / 2) / L;
      obs(a[0] + dx * t1, a[1] + dz * t1, a[0] + dx * t2, a[1] + dz * t2, "fenetre");
    }
  }
}

/** Une croisée de pierre (repère du mur, extérieur côté -z) : chambranles, agrafe, larmier, appui, meneau, traverse, vitres. */
function croisee(Z, o) {
  const M = K.M;
  const { l, bas, haut, ep } = o;
  const e = -ep / 2;
  const cc = o.encadrement ?? C.encadrement;
  const f = 0.2;
  const mt = M.tuffeau;
  pv(Z, -l / 2 - f, bas, e - 0.07, -l / 2, haut, e + 0.04, cc, mt);
  pv(Z, l / 2, bas, e - 0.07, l / 2 + f, haut, e + 0.04, cc, mt);
  pv(Z, -l / 2 - f, haut, e - 0.07, l / 2 + f, haut + 0.26, e + 0.04, cc, mt);
  pv(Z, -0.12, haut - 0.06, e - 0.12, 0.12, haut + 0.3, e, cc, mt);
  if (o.larmier !== false) pv(Z, -l / 2 - f - 0.12, haut + 0.26, e - 0.2, l / 2 + f + 0.12, haut + 0.38, e + 0.04, cc, mt);
  if (bas > 0.25) pv(Z, -l / 2 - f - 0.06, bas - 0.13, e - 0.15, l / 2 + f + 0.06, bas, e + 0.06, cc, mt);
  // Plan des meneaux et des vitres : dans l'épaisseur du mur, ou plaqué sur une tour pleine
  const zm = o.plaque ? e - 0.035 : e + 0.14;
  const meneau = o.meneau ?? l >= 1.05;
  const yt = o.yt ?? bas + (haut - bas) * 0.67;
  if (meneau) pv(Z, -0.06, bas, zm - 0.06, 0.06, haut, zm + 0.06, cc, mt);
  if (o.traverse !== false) pv(Z, -l / 2, yt - 0.06, zm - 0.06, l / 2, yt + 0.06, zm + 0.06, cc, mt);
  if (o.plaque) pv(Z, -l / 2, bas, e - 0.02, l / 2, haut, e - 0.005, 0x1a1816, M.mat, { crasse: false, nuance: 0 });
  const cols = meneau ? [[-l / 2, -0.06], [0.06, l / 2]] : [[-l / 2, l / 2]];
  const rows = o.traverse === false ? [[bas, haut]] : [[bas, yt - 0.06], [yt + 0.06, haut]];
  const bris = o.bris ?? K.bris;
  for (const [x1, x2] of cols) for (const [y1, y2] of rows) carreau(Z, x1, y1, x2, y2, zm, bris);
  if (o.rideau) rideau(Z, o);
  if (o.balcon) balcon(Z, o);
}

/** Un carreau : entier, en éclats plantés dans les coins, ou disparu. */
function carreau(Z, x1, y1, x2, y2, z, bris) {
  if (K.plafond !== undefined && y1 > K.plafond - 0.1) return;
  const r = Z.b.hasard();
  if (r > bris) {
    pv(Z, x1 + 0.015, y1 + 0.015, z - 0.005, x2 - 0.015, y2 - 0.015, z + 0.005, 0xffffff, K.M.verre, { crasse: false, nuance: 0 });
  } else if (r > bris * 0.4) {
    const lc = x2 - x1;
    const hc = y2 - y1;
    const coins = [[x1, y1, 1, 1], [x2, y2, -1, -1], [x2, y1, -1, 1], [x1, y2, 1, -1]];
    for (let k = 0; k < 2; k++) {
      const [cx, cy, sx, sy] = coins[Math.floor(Z.b.hasard() * 4)];
      const p = [cx, cy, z, cx + sx * lc * Z.b.entre(0.3, 0.8), cy, z, cx, cy + sy * hc * Z.b.entre(0.3, 0.8), z];
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
      g.computeVertexNormals();
      ch(Z, cy).poser(g, K.M.verre, 0xffffff, {}, { crasse: false, nuance: 0 });
    }
  }
}

/** Des rideaux de velours en lambeaux, côté intérieur ; l'un pend parfois dehors par le carreau crevé. */
function rideau(Z, o) {
  const { l, bas, haut, ep } = o;
  const z = ep / 2 + 0.07;
  const top = haut + 0.25;
  const coul = o.rideau;
  pv(Z, -l / 2 - 0.45, top - 0.35, z, l / 2 + 0.45, top, z + 0.12, coul, K.M.mat, { nuance: 0.06, crasse: false });
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      if (Z.b.hasard() < 0.18) continue;
      const x = s * (l / 2 + 0.3 - i * 0.24);
      const lg = Z.b.entre(1.2, top - 0.05);
      pv(Z, x - 0.11, top - lg, z + 0.02 + i * 0.015, x + 0.11, top - 0.3, z + 0.05 + i * 0.015, coul, K.M.mat, { nuance: 0.1, crasse: false });
    }
  }
  if (o.dehors) {
    // un pan arraché, pendu à l'appui, qui tombe le long de la façade
    pv(Z, -0.35, Math.max(0.3, bas - 1.8), -ep / 2 - 0.17, 0.05, bas + 0.4, -ep / 2 - 0.12, coul, K.M.mat, { nuance: 0.08, crasse: false });
  }
}

/** Un balcon de pierre sur consoles, à balustres, sous une fenêtre d'étage. */
function balcon(Z, o) {
  const { l, bas, ep } = o;
  const e = -ep / 2;
  const lb = l + 1.4;
  pv(Z, -lb / 2, bas - 0.25, e - 0.85, lb / 2, bas - 0.05, e, C.encadrement, K.M.tuffeau);
  for (const s of [-1, 1]) pv(Z, s * (lb / 2 - 0.3) - 0.14, bas - 1.0, e - 0.7, s * (lb / 2 - 0.3) + 0.14, bas - 0.25, e, C.encadrement, K.M.tuffeau);
  balustrade(Z, [-lb / 2 + 0.1, bas - 0.05, e - 0.75], [lb / 2 - 0.1, bas - 0.05, e - 0.75], { h: 0.85, couleur: C.encadrement, mat: K.M.tuffeau, manque: 0.2 });
}

/** Une porte : chambranles, entablement, pilastres (porte d'honneur), vantaux ouverts, tombés ou arrachés. */
function porteG(Z, o) {
  const M = K.M;
  const { l, bas, haut, ep } = o;
  const e = -ep / 2;
  const cc = C.encadrement;
  const f = 0.25;
  pv(Z, -l / 2 - f, bas, e - 0.08, -l / 2, haut, e + 0.04, cc, M.tuffeau);
  pv(Z, l / 2, bas, e - 0.08, l / 2 + f, haut, e + 0.04, cc, M.tuffeau);
  pv(Z, -l / 2 - f, haut, e - 0.08, l / 2 + f, haut + 0.32, e + 0.04, cc, M.tuffeau);
  pv(Z, -0.14, haut - 0.08, e - 0.13, 0.14, haut + 0.36, e, cc, M.tuffeau);
  if (o.honneur) {
    // pilastres et entablement de la porte d'honneur, imposte vitrée
    for (const s of [-1, 1]) {
      pv(Z, s * (l / 2 + f + 0.05), bas, e - 0.22, s * (l / 2 + f + 0.45), haut + 0.4, e + 0.02, cc, M.tuffeau);
      pv(Z, s * (l / 2 + f), haut + 0.25, e - 0.27, s * (l / 2 + f + 0.5), haut + 0.45, e + 0.02, cc, M.tuffeau);
    }
    pv(Z, -l / 2 - f - 0.6, haut + 0.45, e - 0.32, l / 2 + f + 0.6, haut + 0.62, e + 0.02, cc, M.tuffeau);
  }
  const lv = l / 2 - 0.02;
  const v = o.vantail ?? "arrache";
  const angles = v === "ouvert" ? [1.35, 1.5] : v === "entrouvert" ? [0.45, 0.02] : v === "tombe" ? [1.45, null] : [null, null];
  [-1, 1].forEach((s, i) => {
    const ang = angles[i];
    if (ang === null) return;
    rep(Z, { x: s * (l / 2 - 0.03), z: ep / 2 - 0.1, ry: s * ang }, () => {
      const x1 = 0;
      const x2 = -s * lv;
      pv(Z, Math.min(x1, x2), bas + 0.02, -0.03, Math.max(x1, x2), haut - 0.02, 0.03, C.boisPorte, M.mat, { nuance: 0.05 });
      for (const [y1, y2] of [[bas + 0.25, bas + (haut - bas) * 0.45], [bas + (haut - bas) * 0.52, haut - 0.25]]) {
        pv(Z, Math.min(x1, x2) + 0.12, y1, 0.03, Math.max(x1, x2) - 0.12, y2, 0.05, 0x5a4532, M.mat, { nuance: 0.06 });
      }
    });
  });
  if (v === "tombe") {
    Z.b.boite(lv - 0.05, 0.07, haut - bas - 0.1, C.boisPorte, { x: lv / 2, y: bas + 0.04, z: ep / 2 + (haut - bas) / 2 + 0.15, ry: 0.18 }, M.mat, { nuance: 0.06 });
  }
}

/** Une brèche dans le mur : bords déchirés, pierres en porte-à-faux, éboulis des deux côtés. */
function brecheG(Z, o) {
  const c = Z.b;
  const { l, haut, ep } = o;
  for (let i = 0; i < 16; i++) {
    const s = c.hasard() < 0.5 ? -1 : 1;
    const y = c.entre(0.2, haut + 0.4);
    const t = c.entre(0.25, 0.5);
    const piece = { x: s * (l / 2 + c.entre(-0.15, 0.1)), y, z: c.entre(-ep / 2, ep / 2), rx: c.entre(-0.2, 0.2), ry: c.entre(-0.3, 0.3), rz: c.entre(-0.3, 0.3) };
    ch(Z, y).boite(t * 1.3, t * 0.7, t, C.tuffeau, piece, K.M.tuffeau, { nuance: 0.08 });
  }
  gravats(c, c.entre(-0.4, 0.4), -ep / 2 - 1.1, 1.5, Math.round(0.6 * (10 + 10 * K.u)), [C.tuffeau, PALETTE.pierreSombre, C.encadrement]);
  gravats(c, c.entre(-0.4, 0.4), ep / 2 + 1.0, 1.3, Math.round(0.6 * (8 + 8 * K.u)), [C.tuffeau, PALETTE.enduitCreme, C.papierVert]);
}

/** Une balustrade de balustres tournés, de p1 à p2 (pieds de la balustrade, rampante si les hauteurs diffèrent). */
function balustrade(Z, p1, p2, o = {}) {
  const h = o.h ?? 0.95;
  const pas = o.pas ?? 0.3;
  const manque = o.manque ?? 0.12;
  const coul = o.couleur ?? C.marbre;
  const mat = o.mat ?? K.M.mat;
  const d = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
  const n = Math.max(1, Math.round(Math.hypot(d[0], d[2]) / pas));
  const cm = ch(Z, (p1[1] + p2[1]) / 2 + h / 2);
  cm.poutre([p1[0], p1[1] + 0.07, p1[2]], [p2[0], p2[1] + 0.07, p2[2]], 0.17, coul, mat);
  if (!o.sansMainCourante) {
    const casse = o.casse ?? (Z.b.hasard() < 0.25 * K.u ? Z.b.entre(0.3, 0.8) : 1);
    cm.poutre([p1[0], p1[1] + h, p1[2]], [p1[0] + d[0] * casse, p1[1] + h + d[1] * casse, p1[2] + d[2] * casse], 0.19, coul, mat);
  }
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    if (Z.b.hasard() < manque) continue;
    const y = p1[1] + d[1] * t + 0.14;
    ch(Z, y + h / 2).poser(BALUSTRE, mat, coul, { x: p1[0] + d[0] * t, y, z: p1[2] + d[2] * t, e: [1, (h - 0.24) / 0.62, 1] }, { nuance: 0.04 });
  }
}

// ---------- Toits ----------

/**
 * Un comble à croupes ou à pignons : rectangle u1..u2 × v1..v2 (débords compris) à y0, faîtage à y0 + hf le long de
 * l'axe (« x » ou « z »), de f1 à f2. Faîtage de plomb, arêtiers, chéneaux, épis ; crête ornée en option.
 */
function comble(c, s) {
  const { u1, u2, v1, v2, y0, hf, f1, f2, axe = "x", crete = false, epis = true } = s;
  const vc = (v1 + v2) / 2;
  const yf = y0 + hf;
  const P = (u, y, v) => (axe === "x" ? [u, y, v] : [v, y, u]);
  const D = (du, dy, dv) => (axe === "x" ? [du, dy, dv] : [dv, dy, du]);
  const L = [
    { pts: [P(u1, y0, v2), P(u2, y0, v2), P(f2, yf, vc), P(f1, yf, vc)], dehors: D(0, 1, 1) },
    { pts: [P(u2, y0, v1), P(u1, y0, v1), P(f1, yf, vc), P(f2, yf, vc)], dehors: D(0, 1, -1) },
  ];
  if (f1 > u1 + 0.01) L.push({ pts: [P(u1, y0, v1), P(u1, y0, v2), P(f1, yf, vc)], dehors: D(-1, 1, 0) });
  if (f2 < u2 - 0.01) L.push({ pts: [P(u2, y0, v2), P(u2, y0, v1), P(f2, yf, vc)], dehors: D(1, 1, 0) });
  c.poser(facettes(L), K.M.ardoise, C.ardoise, {}, { crasse: false, nuance: 0.02 });
  const M = K.M.mat;
  c.poutre(P(f1, yf + 0.04, vc), P(f2, yf + 0.04, vc), 0.2, C.plomb, M, { crasse: false });
  if (f1 > u1 + 0.01) for (const v of [v1, v2]) c.poutre(P(u1, y0 + 0.03, v), P(f1, yf + 0.03, vc), 0.12, C.plomb, M, { crasse: false });
  if (f2 < u2 - 0.01) for (const v of [v1, v2]) c.poutre(P(u2, y0 + 0.03, v), P(f2, yf + 0.03, vc), 0.12, C.plomb, M, { crasse: false });
  for (const v of [v1, v2]) c.poutre(P(u1, y0 - 0.05, v), P(u2, y0 - 0.05, v), 0.17, C.plomb, M, { crasse: false });
  if (epis) for (const f of [f1, f2]) epi(c, ...P(f, yf, vc), 1.6);
  if (crete) {
    for (let u = f1 + 0.3; u < f2 - 0.1; u += 0.45) {
      const p = P(u, yf + 0.14, vc);
      c.boite(0.05, 0.42, 0.05, C.plomb, { x: p[0], y: p[1] + 0.21, z: p[2] }, M, { crasse: false });
      c.poser(ICO, M, C.plomb, { x: p[0], y: p[1] + 0.45, z: p[2], e: 0.07 }, { crasse: false });
    }
  }
}

/** Un épi de faîtage en plomb : hampe, boules, pointe. */
function epi(c, x, y, z, h, girouette = false) {
  const M = K.M.mat;
  c.tube([x, y, z], [x, y + h, z], 0.05, C.plomb, M, 5, { crasse: false });
  c.poser(ICO, M, C.plomb, { x, y: y + h * 0.25, z, e: 0.16 }, { crasse: false });
  c.poser(ICO, M, C.plomb, { x, y: y + h * 0.55, z, e: 0.1 }, { crasse: false });
  c.poser(POINTE, M, C.plomb, { x, y: y + h + 0.15, z, e: [0.06, 0.35, 0.06] }, { crasse: false });
  if (girouette) {
    c.boite(0.7, 0.32, 0.03, PALETTE.rouilleSombre, { x: x + 0.35, y: y + h * 0.8, z, ry: 0.6, rz: -0.12 }, K.M.tole, { crasse: false });
  }
}

/** Un cône d'ardoise (tour), légèrement retroussé à l'égout ; `creve(i, k)` : facettes arrachées (secteur i, rang k). */
function cone(c, x, y0, z, r, h, creve = null) {
  const n = 14;
  const anneaux = [[r + 0.45, -0.35], [r + 0.08, 0.55], [r * 0.7, h * 0.33], [r * 0.38, h * 0.64], [0.1, h * 0.97]];
  const liste = [];
  for (let i = 0; i < n; i++) {
    const a1 = (i / n) * Math.PI * 2;
    const a2 = ((i + 1) / n) * Math.PI * 2;
    const am = (a1 + a2) / 2;
    for (let k = 0; k < anneaux.length - 1; k++) {
      if (creve && creve(i, k)) continue;
      const [r1, y1] = anneaux[k];
      const [r2, y2] = anneaux[k + 1];
      liste.push({
        pts: [[Math.cos(a1) * r1, y1, Math.sin(a1) * r1], [Math.cos(a2) * r1, y1, Math.sin(a2) * r1], [Math.cos(a2) * r2, y2, Math.sin(a2) * r2], [Math.cos(a1) * r2, y2, Math.sin(a1) * r2]],
        dehors: [Math.cos(am), 0.6, Math.sin(am)],
        double: !!creve,
      });
    }
  }
  c.poser(facettes(liste), K.M.ardoise, C.ardoise, { x, y: y0, z }, { crasse: false, nuance: 0.02 });
  return anneaux;
}

/** Une lucarne de pierre (repère du mur, extérieur côté -z) : allège, croisée, pilastres, fronton à pinacles, petit comble. */
function lucarne(Z, y0, o = {}) {
  const M = K.M;
  const l = o.l ?? 1.1;
  const h = o.h ?? 1.9;
  const ep = 0.4;
  const e = -ep / 2;
  const lb = l + 0.9;
  const ruine = !!o.ruine;
  const c = Z.h;
  // pilastres et allège
  for (const s of [-1, 1]) pv(Z, s * (l / 2 + 0.05), y0, e - 0.1, s * (lb / 2), y0 + h + 0.3, -e, C.encadrement, M.tuffeau);
  pv(Z, -l / 2, y0, e, l / 2, y0 + 0.35, -e, C.tuffeau, M.tuffeau);
  pv(Z, -lb / 2 - 0.08, y0 + h + 0.3, e - 0.2, lb / 2 + 0.08, y0 + h + 0.48, -e, C.encadrement, M.tuffeau);
  croisee(Z, { l, bas: y0 + 0.35, haut: y0 + h, ep, larmier: false, meneau: false, yt: y0 + 0.35 + (h - 0.35) * 0.62 });
  // fronton triangulaire (à moitié tombé si ruine)
  const yb = y0 + h + 0.48;
  const ht = lb * 0.55;
  const tympan = ruine
    ? [{ pts: [[-lb / 2, yb, e], [0, yb, e], [-lb / 4, yb + ht / 2, e]], dehors: [0, 0, -1] }]
    : [{ pts: [[-lb / 2, yb, e], [lb / 2, yb, e], [0, yb + ht, e]], dehors: [0, 0, -1] }];
  c.poser(facettes(tympan.map((f) => ({ ...f, double: true }))), M.tuffeau, C.encadrement, {}, { nuance: 0.03 });
  const pente = Math.atan2(ht, lb / 2);
  const rampant = Math.hypot(ht, lb / 2);
  c.boite(rampant + 0.2, 0.16, 0.3, C.encadrement, { x: -lb / 4, y: yb + ht / 2 + 0.05, z: e - 0.05, rz: pente }, M.tuffeau);
  if (!ruine) {
    c.boite(rampant + 0.2, 0.16, 0.3, C.encadrement, { x: lb / 4, y: yb + ht / 2 + 0.05, z: e - 0.05, rz: -pente }, M.tuffeau);
    epi(c, 0, yb + ht + 0.05, e, 1.1);
    // le petit comble derrière le fronton
    comble(c, { u1: e, u2: 2.6, v1: -lb / 2 - 0.1, v2: lb / 2 + 0.1, y0: yb - 0.05, hf: ht, f1: e, f2: 2.6, axe: "z", epis: false });
    for (const s of [-1, 1]) c.pave(s * (lb / 2 - 0.05), y0, -e, s * (lb / 2 - 0.25), yb, 2.4, C.tuffeau, M.tuffeau);
  } else {
    // pierres du fronton tombées sur la corniche
    for (let i = 0; i < 4; i++) c.boite(0.35, 0.22, 0.28, C.encadrement, { x: c.entre(0, lb / 2), y: y0 - 0.15, z: e - 0.3, ry: c.hasard() * 3 }, M.tuffeau);
  }
  // pinacles aux angles
  for (const s of [-1, 1]) {
    if (ruine && s > 0) continue;
    c.boite(0.22, 0.5, 0.22, C.encadrement, { x: s * (lb / 2 - 0.05), y: yb + 0.25, z: e - 0.05 }, M.tuffeau);
    c.poser(POINTE, M.tuffeau, C.encadrement, { x: s * (lb / 2 - 0.05), y: yb + 0.75, z: e - 0.05, e: [0.14, 0.55, 0.14], ry: Math.PI / 4 });
  }
}

/** Une haute cheminée de pierre : fût à tables, bandeau, couronnement, mitrons ; `casse` : tête écroulée, un arbuste dessus. */
function cheminee(c, x, z, y0, y1, o = {}) {
  const M = K.M;
  const l = o.l ?? 1.7;
  const p = o.p ?? 0.85;
  c.pave(x - l / 2, y0, z - p / 2, x + l / 2, y1, z + p / 2, C.tuffeau, M.tuffeau, { nuance: 0.03 });
  for (const s of [-1, 1]) c.pave(x - l / 2 + 0.2, y1 - 3.2, z + s * (p / 2 + 0.005), x + l / 2 - 0.2, y1 - 1.1, z + s * (p / 2 - 0.04), 0xb7aa8c, M.tuffeau);
  if (o.casse) {
    for (let i = 0; i < 4; i++) c.boite(0.4, 0.3, 0.35, C.tuffeau, { x: x + c.entre(-l / 2, l / 2), y: y1 + 0.15, z: z + c.entre(-p / 3, p / 3), ry: c.hasard() }, M.tuffeau);
    arbuste(c, x, z, 0.7, y1 + 0.1);
    return;
  }
  c.pave(x - l / 2 - 0.1, y1 - 0.8, z - p / 2 - 0.1, x + l / 2 + 0.1, y1 - 0.6, z + p / 2 + 0.1, C.encadrement, M.tuffeau);
  c.pave(x - l / 2 - 0.16, y1, z - p / 2 - 0.16, x + l / 2 + 0.16, y1 + 0.28, z + p / 2 + 0.16, C.encadrement, M.tuffeau);
  for (const dx of [-l / 4, l / 4]) {
    if (c.hasard() < 0.25) continue;
    c.tube([x + dx, y1 + 0.28, z], [x + dx, y1 + 0.85, z], 0.14, C.terreCuite, M.mat, 6);
  }
}

// ---------- Les tours ----------

/** Une tour ronde : fût de tuffeau, bandeaux, mâchicoulis, croisées plaquées, cône d'ardoise (crevé ou non). */
function tour(Z, x, z, r, hMur, hCone, o = {}) {
  const M = K.M;
  const n = 14;
  Z.b.poser(new THREE.CylinderGeometry(r, r * 1.03, Y, n), M.tuffeau, C.tuffeau, { x, y: Y / 2, z }, { nuance: 0.02 });
  Z.b.poser(new THREE.CylinderGeometry(r + 0.09, r + 0.12, 0.8, n), M.tuffeau, C.socle, { x, y: 0.4, z }, { nuance: 0.02 });
  Z.h.poser(new THREE.CylinderGeometry(r, r, hMur - Y, n, 1, true), M.tuffeau, C.tuffeau, { x, y: Y + (hMur - Y) / 2, z }, { nuance: 0.02 });
  for (const yb of [4.5, 8.5]) if (yb < hMur - 1.5) Z.h.poser(new THREE.CylinderGeometry(r + 0.11, r + 0.11, 0.24, n), M.tuffeau, C.encadrement, { x, y: yb, z });
  // mâchicoulis : consoles et parapet
  const ap = r * Math.cos(Math.PI / n);
  for (let i = 0; i < n; i++) {
    const t = ((i + 0.5) / n) * Math.PI * 2;
    Z.h.boite(0.26, 0.6, 0.42, C.encadrement, { x: x + Math.sin(t) * (ap + 0.15), y: hMur - 0.75, z: z + Math.cos(t) * (ap + 0.15), ry: t }, M.tuffeau);
  }
  Z.h.poser(new THREE.CylinderGeometry(r + 0.36, r + 0.36, 0.8, n), M.tuffeau, C.encadrement, { x, y: hMur - 0.05, z }, { nuance: 0.03 });
  // croisées sur les facettes qui regardent dehors
  for (const f of o.fenetres ?? []) {
    const t = ((f.i + 0.5) / n) * Math.PI * 2;
    const dx = Math.sin(t);
    const dz = Math.cos(t);
    for (const [bas, haut] of f.niveaux) {
      rep(Z, { x: x + dx * (ap - 0.2), z: z + dz * (ap - 0.2), ry: Math.atan2(-dx, -dz) }, () =>
        croisee(Z, { l: f.l ?? 0.85, bas, haut, ep: 0.4, plaque: true, meneau: false, larmier: true }),
      );
    }
  }
  // le cône
  const y0 = hMur + 0.35;
  if (o.creve) {
    const u = K.u;
    const trou = (i, k) => k >= 1 && k <= 3 && ((i >= 1 && i <= 3 + Math.round(u * 2)) || (k === 2 && i === 0) || (k >= 2 && i === 4 + Math.round(u * 2)));
    const anneaux = cone(Z.h, x, y0, z, r + 0.3, hCone, trou);
    // la charpente du cône : chevrons, enrayures, ardoises pendues
    const apex = [x, y0 + hCone * 0.97, z];
    for (let i = 0; i < 14; i += 1) {
      const a = (i / 14) * Math.PI * 2;
      const [r1, yy] = anneaux[1];
      if (!(i >= 1 && i <= 5 + Math.round(u * 2))) continue;
      if (i === 3 && u > 0.6) {
        Z.h.poutre([x + Math.cos(a) * r1, y0 + yy, z + Math.sin(a) * r1], [x + Math.cos(a) * r1 * 0.55, y0 + hCone * 0.45, z + Math.sin(a) * r1 * 0.55], 0.13, C.charpente, M.mat);
        continue;
      }
      Z.h.poutre([x + Math.cos(a) * r1, y0 + yy, z + Math.sin(a) * r1], apex, 0.13, C.charpente, M.mat);
    }
    for (const k of [2, 3]) {
      const [rr, yy] = anneaux[k];
      for (let i = 1; i < 6; i++) {
        const a1 = (i / 14) * Math.PI * 2;
        const a2 = ((i + 1) / 14) * Math.PI * 2;
        if (Z.b.hasard() < 0.35) continue;
        Z.h.poutre([x + Math.cos(a1) * rr, y0 + yy, z + Math.sin(a1) * rr], [x + Math.cos(a2) * rr, y0 + yy, z + Math.sin(a2) * rr], 0.08, C.charpenteGrise, M.mat);
      }
    }
    // l'intérieur du fût, vu par le trou ; le plancher des combles, effondré
    Z.h.poser(new THREE.CylinderGeometry(r - 0.25, r - 0.25, 3.5, n, 1, true), M.tuffeau, 0x8f8670, { x, y: hMur - 1.6, z, e: [-1, 1, 1] }, { nuance: 0 });
    Z.h.poser(new THREE.CylinderGeometry(r - 0.2, r - 0.2, 0.15, n), M.mat, 0x4a3d30, { x, y: hMur - 2.6, z });
    gravats(Z.h, x + 0.5, z + 0.6, 1.6, 10, [C.ardoise, C.charpente, C.tuffeau], hMur - 2.5);
    epi(Z.h, x - 0.6, y0 + hCone * 0.9, z + 0.3, 1.3);
  } else {
    cone(Z.h, x, y0, z, r + 0.3, hCone);
    epi(Z.h, x, y0 + hCone * 0.97, z, 1.8, !!o.girouette);
  }
  obsCercle(x, z, r + 0.12, 10);
}

// ---------- La coque : murs, tours, toits (les deux cartes) ----------

function coque() {
  const { zO, zC, zE, u, M } = K;
  const rdc = (at, l = 1.5, extra = {}) => ({ at, l, bas: 0.75, haut: 3.6, type: "fenetre", yt: 2.95, ...extra });
  const etg = (at, l = 1.3, extra = {}) => ({ at, l, bas: 5.2, haut: 7.6, type: "fenetre", ...extra });
  const pV = { couleur: C.papierVert, mat: M.papier };
  const pR = { couleur: C.papierRose, mat: M.papier };
  const hautInt = { couleur: C.plafond, mat: M.mat, crasse: false };
  const ruine = 1 + 3.2 * u; // profondeur des brèches de l'aile ouest
  const vel = { rideau: C.velours };

  // --- Murs nord (tracés d'ouest en est) ---
  murZ(zO, [-17, -7.5], [-5.5, -7.5], { H: H_AILE, exterieur: true, interieur: pV, interieurHaut: hautInt,
    ouv: [rdc(-14, 1.4, vel), rdc(-9, 1.5, vel), etg(-14), etg(-9)], breches: [{ at: -11.5, l: 5.5, profondeur: ruine * 0.8 }] });
  murZ(zC, [-5.5, -7.5], [5.5, -7.5], { H: H_PAV, exterieur: true, interieurHaut: hautInt,
    ouv: [{ at: 0, l: 1.8, bas: 2.4, haut: 4.2, type: "fenetre", yt: 3.5 }, etg(-3.3, 1.1), etg(3.3, 1.1), { at: 0, l: 1.3, bas: 5.6, haut: 8.0, type: "fenetre" }] });
  murZ(zE, [5.5, -7.5], [17, -7.5], { H: H_AILE, exterieur: true, interieur: pR, interieurHaut: hautInt,
    ouv: [{ at: 7.3, l: 1.4, bas: 0, haut: 2.9, type: "porte", vantail: "entrouvert" }, rdc(13.6, 1.3, vel), etg(7.3, 1.2), etg(13.6, 1.2)] });
  // --- Mur est (salon / serre) ---
  murZ(zE, [17, -7.5], [17, 7.5], { H: H_AILE, exterieur: true, interieur: pR, interieurHaut: hautInt,
    ouv: [{ at: -2.4, l: 2.2, bas: 0, haut: 3.3, type: "porte", vantail: "tombe" }, rdc(2.9, 1.2, vel), etg(-4.6, 1.2), etg(1.6, 1.2)] });
  // --- Murs sud (tracés d'est en ouest) ---
  murZ(zE, [17, 7.5], [5.5, 7.5], { H: H_AILE, exterieur: true, interieur: pR, interieurHaut: hautInt, modillons: true,
    ouv: [rdc(12, 1.5, vel), rdc(8.3, 1.5, vel), etg(12), etg(8.3, 1.3, { rideau: C.velours, dehors: true })] });
  murZ(zC, [5.5, 7.5], [5.5, 9.5], { H: H_PAV, exterieur: true });
  murZ(zC, [5.5, 9.5], [-5.5, 9.5], { H: H_PAV, exterieur: true, modillons: true,
    ouv: [{ at: 0, l: 2.2, bas: 0.9, haut: 3.7, type: "porte", vantail: "ouvert", honneur: true }, { at: 3.4, l: 1.2, bas: 1.3, haut: 3.7, type: "fenetre" }, { at: -3.4, l: 1.2, bas: 1.3, haut: 3.7, type: "fenetre" },
      { at: 0, l: 1.6, bas: 5.3, haut: 7.9, type: "fenetre", balcon: true }, etg(3.4, 1.1), etg(-3.4, 1.1)] });
  murZ(zC, [-5.5, 9.5], [-5.5, 7.5], { H: H_PAV, exterieur: true });
  murZ(zO, [-5.5, 7.5], [-17, 7.5], { H: H_AILE, exterieur: true, interieur: pV, interieurHaut: hautInt, modillons: true,
    ouv: [rdc(-8.3, 1.5, vel), rdc(-12, 1.5, vel), etg(-8.3), etg(-12)], breches: [{ at: -12.6, l: 4.6, profondeur: ruine }] });
  // --- Mur ouest (la brèche de la salle de bal) ---
  murZ(zO, [-17, 7.5], [-17, -7.5], { H: H_AILE, exterieur: true, interieur: pV, interieurHaut: hautInt,
    ouv: [{ at: 0.3, l: 2.4, bas: 0, haut: 3.9, type: "breche" }, rdc(-4.5, 1.4, vel), etg(-4.5), etg(2.6)], breches: [{ at: 0.6, l: 5, profondeur: ruine * 0.9 }, { at: -5.5, l: 3, profondeur: ruine * 0.5 }] });
  // --- Refends : hall / salle de bal, hall / salon ---
  murZ(zC, [-5.5, -7.5], [-5.5, 7.5], { H: H_PAV, ep: 0.45, interieur: pV, interieurHaut: hautInt, ouv: [{ at: 3.8, l: 2.6, bas: 0, haut: 3.6, type: "porte", vantail: "ouvert" }] });
  murZ(zC, [5.5, 7.5], [5.5, -7.5], { H: H_PAV, ep: 0.45, interieur: pR, interieurHaut: hautInt, ouv: [{ at: 3.8, l: 2.4, bas: 0, haut: 3.4, type: "porte", vantail: "entrouvert" }] });

  // --- Les marches intérieures sous la porte d'honneur (le seuil est au niveau du perron) ---
  for (let k = 0; k < 6; k++) zC.b.pave(-1.9, 0, 9.2 - k * 0.3, 1.9, 0.9 - k * 0.15, 8.9 - k * 0.3, C.marbre, M.mat);
  for (const s of [-1, 1]) zC.b.pave(s * 1.9, 0, 7.4, s * 2.15, 1.05, 9.2, C.marbreGris, M.mat);

  // --- Planchers de l'étage (plafonds du rez-de-chaussée), dans les couches ---
  zC.h.pave(-5.5, 4.5, 0.3, 5.5, 4.8, 9.5, C.plafond, M.mat, { crasse: false });
  zC.h.pave(-5.5, 8.8, -7.5, 5.5, 9.0, 9.5, 0x8a7d68, M.mat, { crasse: false });
  balustrade(zC, [-3.6, 4.8, 0.4], [3.6, 4.8, 0.4], { h: 0.9 });
  zE.h.pave(5.5, 4.5, -7.5, 17, 4.8, 7.5, C.plafond, M.mat, { crasse: false });
  zE.h.pave(5.5, 8.3, -7.5, 17, 8.5, 7.5, 0x8a7d68, M.mat, { crasse: false });
  for (const [x1, z1, x2, z2] of [[5.7, -7.2, 16.7, -6.95], [5.7, 6.95, 16.7, 7.2], [5.72, -7.2, 5.97, 7.2], [16.45, -7.2, 16.7, 7.2]]) zE.h.pave(x1, 4.2, z1, x2, 4.5, z2, C.stuc, M.mat, { crasse: false });
  plafondCreve();

  // --- Les tours ---
  tour(zE, 17, 7.5, 3.3, 12.6, 9.4, { girouette: true, fenetres: [{ i: 1, niveaux: [[1.0, 2.6], [5.4, 7.3], [9.0, 10.6]] }, { i: 3, niveaux: [[5.4, 7.3], [9.0, 10.6]] }, { i: 13, niveaux: [[9.0, 10.6]] }] });
  tour(zO, -17, 7.5, 3.3, 12.6, 9.4, { creve: true, fenetres: [{ i: 12, niveaux: [[1.0, 2.6], [5.4, 7.3], [9.0, 10.6]] }, { i: 1, niveaux: [[5.4, 7.3]] }, { i: 10, niveaux: [[9.0, 10.6]] }] });
  tour(zE, 17, -7.5, 2.1, 13.8, 8.6, { fenetres: [{ i: 3, l: 0.6, niveaux: [[6.0, 7.4], [10.0, 11.4]] }, { i: 6, l: 0.6, niveaux: [[10.0, 11.4]] }] });

  // --- Les toits ---
  comble(zE.h, { u1: 5.5, u2: 17.4, v1: -7.9, v2: 7.9, y0: 8.45, hf: 6.6, f1: 5.5, f2: 13.8, axe: "x", epis: false });
  epi(zE.h, 13.8, 15.05, 0, 1.6);
  comble(zC.h, { u1: -7.9, u2: 9.9, v1: -5.9, v2: 5.9, y0: 9.55, hf: 7.6, f1: -2.9, f2: 4.9, axe: "z", crete: true });
  charpenteOuest();
  // lucarnes
  for (const x of [8.3, 12]) rep(zE, { x, z: 7.5, ry: Math.PI }, () => lucarne(zE, 8.5, { l: 1.0, h: 1.8 }));
  rep(zC, { x: 0, z: 9.5, ry: Math.PI }, () => lucarne(zC, 9.6, { l: 1.2, h: 2.1 }));
  rep(zO, { x: -8.3, z: 7.5, ry: Math.PI }, () => lucarne(zO, 8.5, { l: 1.0, h: 1.8, ruine: true }));
  // cheminées
  cheminee(zE.h, 10.5, -6.9, 8.4, 18.4, { l: 2.0, p: 0.9 });
  cheminee(zE.h, 14.6, 3.2, 11.4, 17.6);
  cheminee(zC.h, -4.1, -2.4, 11.0, 19.6, { l: 1.4, p: 0.9 });
  cheminee(zC.h, 4.1, -2.4, 11.0, 19.6, { l: 1.4, p: 0.9 });
  cheminee(zO.h, -11.5, -6.9, 8.4, 16.4 - u * 1.2, { casse: true, l: 1.8, p: 0.9 });
  // végétation des toits : herbes dans les chéneaux, un arbuste sur la corniche du pavillon
  const pts = [];
  for (let i = 0; i < 16; i++) pts.push([zE.h.entre(6, 16.8), 7.95, 8.55]);
  for (let i = 0; i < 6; i++) pts.push([zE.h.entre(6, 16), -7.95, 8.55]);
  touffes(zE.h, pts, PALETTE.herbeSeche);
  arbuste(zC.h, -4.6, 9.85, 0.6, 9.6);

  // --- La serre ---
  serre();
}

/** Le plafond crevé de la salle de bal : lambeaux de plancher le long des murs, solives cassées. */
function plafondCreve() {
  const k = K.zO.h;
  const M = K.M;
  const c = K.zO.b;
  const x1 = -16.7;
  const x2 = -5.75;
  for (let x = x1; x < x2; x += 1.1) {
    const w1 = c.entre(0.2, 1.6) * (1.2 - K.u * 0.5);
    const w2 = c.entre(0.2, 1.4) * (1.2 - K.u * 0.5);
    k.pave(x, 4.5, -7.2, x + 1.1, 4.78, -7.2 + w1, C.plafond, M.mat, { crasse: false });
    k.pave(x, 4.5, 7.2 - w2, x + 1.1, 4.78, 7.2, C.plafond, M.mat, { crasse: false });
  }
  for (let z = -7.2; z < 7.2; z += 1.2) k.pave(x2 - c.entre(0.3, 2.2), 4.5, z, x2, 4.78, z + 1.2, C.plafond, M.mat, { crasse: false });
  // solives en porte-à-faux, dont certaines pendent
  for (let x = -16.2; x < -6; x += 1.4) {
    const pend = c.hasard() < 0.35;
    const lg = c.entre(1.2, 3.2);
    k.poutre([x, 4.62, -7.2], [x + c.entre(-0.2, 0.2), pend ? 4.62 - lg * 0.8 : 4.6, -7.2 + lg * (pend ? 0.6 : 1)], 0.18, C.charpente, M.mat);
  }
  // corniche intérieure (moulure de plafond) le long des murs
  for (const [a1, b1, a2, b2] of [[x1, -7.2, x2, -6.95], [x1, 6.95, x2, 7.2], [x1, -7.2, x1 + 0.25, 7.2], [x2 - 0.25, -7.2, x2, 7.2]]) k.pave(a1, 4.2, b1, a2, 4.5, b2, C.stuc, M.mat, { crasse: false });
}

/** L'aile ouest : le toit s'est effondré ; restent des fermes contre le ciel, des pannes, un lambeau d'ardoises. */
function charpenteOuest() {
  const k = K.zO.h;
  const M = K.M;
  const u = K.u;
  const cc = C.charpenteGrise;
  const y0 = 8.45;
  const yf = 15.05;
  // lambeaux de couverture contre le pavillon (plus l'usure est faible, plus il en reste)
  const limite = Math.max(-9.4, -5.5 - (1 - u) * 7);
  const les = [];
  for (let x = -5.5; x > limite + 0.05; x -= 0.9) {
    const xa = Math.max(limite, x - 0.9);
    const bord = x - 0.9 < limite + 0.5;
    const tn = bord ? k.entre(0.35, 0.8) : 1;
    const ts = x > -7.2 ? (bord ? k.entre(0.2, 0.5) : k.entre(0.5, 1)) : 0;
    const pt = (xx, t, s) => [xx, y0 + (yf - y0) * t, s * (7.9 - 7.9 * t)];
    const t0n = bord ? k.entre(0, 0.3) : 0;
    les.push({ pts: [pt(xa, t0n, -1), pt(x, t0n, -1), pt(x, tn, -1), pt(xa, tn, -1)], dehors: [0, 1, -1], double: true });
    if (ts > 0) les.push({ pts: [pt(xa, 1 - ts, 1), pt(x, 1 - ts, 1), pt(x, 1, 1), pt(xa, 1, 1)], dehors: [0, 1, 1], double: true });
  }
  if (les.length) k.poser(facettes(les), M.ardoise, C.ardoise, {}, { crasse: false, nuance: 0.03 });
  // les fermes
  const ferme = (x, etat) => {
    if (etat !== "sansEntrait") k.poutre([x, y0, -7.3], [x, y0, 7.3], 0.26, cc, M.mat);
    k.poutre([x, y0, -7.4], [x, yf - 0.1, 0], 0.24, cc, M.mat);
    if (etat === "casse") {
      k.poutre([x, y0, 7.4], [x, y0 + 3.1, 3.7], 0.24, cc, M.mat);
      k.poutre([x, y0 + 3.0, 3.7], [x + 0.5, y0 - 3.4, 2.2], 0.2, cc, M.mat);
    } else k.poutre([x, y0, 7.4], [x, yf - 0.1, 0], 0.24, cc, M.mat);
    k.poutre([x, y0, 0], [x, yf - 0.05, 0], 0.22, cc, M.mat);
    for (const s of [-1, 1]) k.poutre([x, y0 + 2.2, 0], [x, y0 + 3.9, s * 3.3], 0.14, cc, M.mat);
  };
  if (limite > -8.0) ferme(-8.2, "ok");
  ferme(-13.4, u > 0.5 ? "casse" : "ok");
  ferme(-15.9, u > 0.8 ? "sansEntrait" : "ok");
  // pannes et faîtière, en morceaux
  k.poutre([-5.5, yf - 0.05, 0], [-9.6, yf - 0.05, 0], 0.22, cc, M.mat);
  k.poutre([-9.6, yf - 0.05, 0], [-11.4, yf - 2.6, 0.6], 0.2, cc, M.mat);
  for (const s of [-1, 1]) {
    const t = 0.5;
    const yy = y0 + (yf - y0) * t;
    const zz = s * 7.9 * (1 - t);
    k.poutre([-5.5, yy, zz], [-13.4, yy, zz], 0.18, cc, M.mat);
    if (s < 0) k.poutre([-13.4, yy, zz], [-16.2, yy - 1.2, zz + 0.4], 0.18, cc, M.mat);
  }
  // une ferme tombée en travers de la salle, appuyée contre le mur nord
  K.zO.b.poutre([-15.1, 0.25, 5.2], [-14.6, 8.2, -7.0], 0.26, C.charpente, M.mat);
  K.zO.b.poutre([-15.0, 0.2, 5.0], [-15.4, 0.25, -1.5], 0.24, C.charpente, M.mat);
}

// ---------- La serre ----------

function serre() {
  const c = K.b.c;
  const M = K.M;
  const u = K.u;
  const x1 = 17.3;
  const x2 = 25.5;
  const zc = -2.4;
  const hw = 4.4;
  const yM = 3.0; // haut des parois vitrées
  const fl = 1.9; // flèche de la voûte
  const nb = 6;
  const pas = (x2 - x1) / nb;
  const fer = C.ferPeint;
  const verre = M.verre;
  // sol de tomettes, muret de pierre
  c.pave(x1, -0.02, zc - hw, x2, 0.03, zc + hw, 0xc07a52, M.damier, { crasse: false });
  for (const [a, b] of [[[x1, zc - hw], [x2, zc - hw]], [[x2, zc + hw], [x1, zc + hw]]]) mur(c, a, b, { h: 0.55, ep: 0.35, couleur: C.tuffeau, mat: M.tuffeau, batiment: K.ob });
  mur(c, [x2, zc - hw], [x2, zc + hw], { h: 0.55, ep: 0.35, couleur: C.tuffeau, mat: M.tuffeau, batiment: K.ob, ouvertures: [{ u: hw, l: 1.6, bas: 0, haut: 2.4, type: "vide" }] });
  // l'arc de la voûte
  const arc = [];
  for (let i = 0; i <= 6; i++) {
    const p = (i / 6) * Math.PI;
    arc.push([zc + hw * Math.cos(p), yM + fl * Math.sin(p)]);
  }
  for (let i = 0; i <= nb; i++) {
    const x = x1 + i * pas;
    for (const s of [-1, 1]) c.boite(0.1, yM - 0.55, 0.1, fer, { x, y: 0.55 + (yM - 0.55) / 2, z: zc + s * hw }, M.tole);
    for (let j = 0; j < 6; j++) c.poutre([x, arc[j][1], arc[j][0]], [x, arc[j + 1][1], arc[j + 1][0]], 0.08, fer, M.tole);
  }
  for (const s of [-1, 1]) {
    c.poutre([x1, yM, zc + s * hw], [x2, yM, zc + s * hw], 0.1, fer, M.tole);
    c.poutre([x1, 1.8, zc + s * hw], [x2, 1.8, zc + s * hw], 0.06, fer, M.tole);
  }
  c.poutre([x1, yM + fl, zc], [x2, yM + fl, zc], 0.1, fer, M.tole);
  // verrière : la plupart des carreaux manquent
  const garde = 0.15 + (1 - u) * 0.5;
  const trouArbre = (x, z) => Math.hypot(x - 23.4, z - (zc - 1.6)) < 2.0;
  for (let i = 0; i < nb; i++) {
    const xm = x1 + (i + 0.5) * pas;
    for (const s of [-1, 1]) {
      for (const [y1, y2] of [[0.6, 1.78], [1.82, yM - 0.05]]) {
        if (c.hasard() > garde + 0.15) continue;
        c.pave(xm - pas / 2 + 0.05, y1, zc + s * hw - 0.005, xm + pas / 2 - 0.05, y2, zc + s * hw + 0.005, 0xffffff, verre, { crasse: false, nuance: 0 });
      }
    }
    for (let j = 0; j < 6; j++) {
      const [za, ya] = arc[j];
      const [zb, yb] = arc[j + 1];
      if (c.hasard() > garde || trouArbre(xm, (za + zb) / 2)) continue;
      const ang = Math.atan2(yb - ya, zb - za);
      c.boite(pas - 0.1, 0.01, Math.hypot(zb - za, yb - ya) - 0.06, 0xffffff, { x: xm, y: (ya + yb) / 2, z: (za + zb) / 2, rx: -ang }, verre, { crasse: false, nuance: 0 });
    }
  }
  // pignon est vitré (sauf la porte)
  for (let j = 0; j < 6; j++) {
    const za = zc - hw + (j * 2 * hw) / 6;
    const zb = za + (2 * hw) / 6;
    const zm = (za + zb) / 2;
    const hm = yM + fl * Math.sqrt(Math.max(0, 1 - ((zm - zc) / hw) ** 2)) - 0.1;
    c.boite(0.06, hm - 0.55, 0.06, fer, { x: x2, y: 0.55 + (hm - 0.55) / 2, z: za }, M.tole);
    if (Math.abs(zm - zc) < 0.9 || c.hasard() > garde + 0.2) continue;
    c.pave(x2 - 0.005, 0.6, za + 0.04, x2 + 0.005, hm - 0.1, zb - 0.04, 0xffffff, verre, { crasse: false, nuance: 0 });
  }
  // éclats de verre au sol
  for (let i = 0; i < 26; i++) c.boite(c.entre(0.1, 0.35), 0.01, c.entre(0.08, 0.25), 0xffffff, { x: c.entre(x1 + 0.3, x2 + 1.2), y: 0.04, z: c.entre(zc - hw - 0.8, zc + hw + 0.8), ry: c.hasard() * 3 }, verre, { crasse: false, nuance: 0 });
  // bacs, pots, palmier, bouleau qui crève la voûte
  for (const s of [-1, 1]) c.pave(x1 + 0.4, 0, zc + s * (hw - 0.35), x2 - 0.4, 0.55, zc + s * (hw - 1.15), C.tuffeau, M.tuffeau);
  for (const s of [-1, 1]) for (let i = 0; i < 5; i += 2) arbuste(c, x1 + 1 + i * 1.5 + c.entre(-0.3, 0.3), zc + s * (hw - 0.75), c.entre(0.5, 0.9), 0.5);
  for (let i = 0; i < 9; i++) {
    const x = c.entre(x1 + 0.8, x2 - 0.6);
    const z = zc + c.entre(-1.6, 1.6);
    const couche = c.hasard() < 0.4;
    c.poser(new THREE.CylinderGeometry(0.2, 0.14, 0.35, 7), M.mat, C.terreCuite, { x, y: couche ? 0.18 : 0.18, z, rz: couche ? 1.5 : 0, ry: c.hasard() * 3 }, { nuance: 0.08 });
  }
  palmier(c, 19.6, zc + 1.2, 3.6);
  arbre(c, 23.4, zc - 1.6, 8, "bouleau");
  semerTouffes(c, x1 + 0.5, zc - 1.8, x2 - 0.3, zc + 1.8, 14, PALETTE.herbe, 0.03);
  for (let i = 0; i <= nb; i += 3) lierre(c, x1 + i * pas, 0.5, zc + hw + 0.08, 0, 0.6, 2.4, Math.round(8 + 12 * u));
}

/** Un palmier en pot (l'orangerie) : stipe, palmes retombantes. */
function palmier(c, x, z, h) {
  const M = K.M;
  c.poser(new THREE.CylinderGeometry(0.45, 0.35, 0.6, 8), M.mat, C.terreCuite, { x, y: 0.3, z });
  c.tube([x, 0.5, z], [x + 0.2, h, z - 0.1], 0.12, 0x6b5a45, M.mat, 6);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const morte = i % 3 === 0;
    c.repere({ x: x + 0.2, y: h, z: z - 0.1, ry: a }, () => {
      c.boite(1.6, 0.03, 0.42, morte ? 0x9c8a5a : PALETTE.feuillageClair, { x: 0.75, y: -0.35, rz: morte ? -0.9 : -0.45 }, M.mat, { crasse: false, nuance: 0.08 });
    });
  }
}

// ---------- Le perron, la borne, les abords (les deux cartes) ----------

function perron() {
  const Z = K.zC;
  const c = Z.b;
  const M = K.M;
  const ps = 0xc6bca4;
  c.pave(-4.2, 0, 9.8, 4.2, 0.78, 12.2, ps, M.tuffeau);
  c.pave(-4.3, 0.78, 9.8, 4.3, 0.9, 12.3, 0xd6cdb7, M.tuffeau);
  // niche sous la terrasse : un mascaron de fontaine sec, une porte de remise noire
  c.pave(-0.8, 0.0, 12.18, 0.8, 0.7, 12.24, 0x1d1a17, M.mat, { crasse: false });
  c.pave(-1.05, 0.0, 12.2, -0.8, 0.78, 12.32, C.encadrement, M.tuffeau);
  c.pave(0.8, 0.0, 12.2, 1.05, 0.78, 12.32, C.encadrement, M.tuffeau);
  // les deux volées, qui descendent vers les côtés
  for (const s of [-1, 1]) {
    for (let k = 0; k < 5; k++) {
      const xa = s * (4.2 + k * 0.52);
      const xb = s * (4.2 + (k + 1) * 0.52);
      c.pave(xa, 0, 9.85, xb, 0.9 - (k + 1) * 0.15, 12.2, ps, M.tuffeau);
      c.pave(xa, 0.9 - (k + 1) * 0.15 - 0.04, 9.85, xb + s * 0.04, 0.9 - (k + 1) * 0.15, 12.25, 0xd6cdb7, M.tuffeau);
    }
    balustrade(Z, [s * 4.25, 0.9, 12.1], [s * 6.8, 0.0, 12.1], { h: 0.9, couleur: C.encadrement, mat: M.tuffeau, manque: 0.18 });
    // piédestal et vase Médicis au bas de chaque volée
    c.pave(s * 6.7, 0, 11.75, s * 7.3, 1.1, 12.45, C.encadrement, M.tuffeau);
    c.pave(s * 6.62, 1.1, 11.67, s * 7.38, 1.22, 12.53, C.encadrement, M.tuffeau);
    if (s < 0 || K.u < 0.6) {
      c.poser(VASE, M.tuffeau, C.encadrement, { x: s * 7.0, y: 1.22, z: 12.1, e: 1.15 });
      arbuste(c, s * 7.0, 12.1, 0.45, 1.75, [PALETTE.herbeSeche, PALETTE.feuillage, 0x8a7a50]);
    } else {
      c.poser(VASE, M.tuffeau, C.encadrement, { x: s * 7.9, y: 0.3, z: 13.0, rz: 1.45, ry: 0.6, e: 1.15 });
    }
    obs(s * 4.2, 12.25, s * 7.3, 12.25, "balustrade");
  }
  balustrade(Z, [-4.2, 0.9, 12.15], [4.2, 0.9, 12.15], { h: 0.9, couleur: C.encadrement, mat: M.tuffeau, manque: 0.15 });
  obs(-4.2, 12.25, 4.2, 12.25, "balustrade");
  // la lanterne des survivants, posée sur la terrasse
  c.boite(0.22, 0.32, 0.22, 0x2d2a25, { x: 3.5, y: 1.06, z: 11.5 }, M.tole);
  c.boite(0.16, 0.2, 0.16, 0xffc56a, { x: 3.5, y: 1.06, z: 11.5 }, M.mat, { crasse: false, nuance: 0 });
  lum(3.5, 1.3, 11.4, 0xffc86a, 4, 9, "lanterne");
  lierre(c, -4.25, 0, 11.0, -Math.PI / 2, 1.6, 0.8, Math.round(10 + 16 * K.u));
}

/** La borne « Château connecté » : totem crème à bandeau rouge, écran figé, un peu penchée. */
function borne(c, x, z, ry) {
  const M = K.M;
  c.repere({ x, z, ry, rz: 0.1 }, () => {
    c.pave(-0.45, 0, -0.3, 0.45, 0.12, 0.3, 0x8f8a80, M.mat);
    c.poser(new THREE.CylinderGeometry(0.3, 0.36, 1.75, 10), M.satine, PALETTE.abondanceCreme, { y: 0.98, e: [1, 1, 0.55] });
    c.poser(new THREE.CylinderGeometry(0.31, 0.31, 0.14, 10), M.satine, PALETTE.abondanceRouge, { y: 1.8, e: [1, 1, 0.56] });
    ecran(c, 0.42, 0.42, 0, 1 / 3, { y: 1.28, z: 0.205 });
  });
}

function exterieurProche() {
  const c = K.b.c;
  const M = K.M;
  const u = K.u;
  // cour d'honneur en gravier
  for (let x = -22; x < 22; x += 5.5) for (let z = 7.8; z < 16; z += 4.1) c.pave(x, -0.01, z, x + 5.5, 0.03, Math.min(16, z + 4.1), C.gravier, M.mat, { crasse: false, nuance: 0.05 });
  semerTouffes(c, -21, 8.2, 21, 15.8, Math.round(0.45 * (25 + 40 * u)), PALETTE.herbeSeche, 0.03);
  perron();
  borne(c, 7.6, 13.6, -0.5);
  // herbes au pied des murs, arbustes
  const pied = [];
  for (let x = -16; x < 16.5; x += 0.9) if (c.hasard() < 0.35 && Math.abs(x) > 7.5) pied.push([x, 8.0 + c.hasard() * 0.3, 0]);
  for (let x = -16; x < 16.5; x += 1.1) if (c.hasard() < 0.3) pied.push([x, -8.0 - c.hasard() * 0.3, 0]);
  for (let z = -7; z < 7; z += 0.9) if (c.hasard() < 0.35) pied.push([-17.5 - c.hasard() * 0.3, z, 0]);
  touffes(c, pied, PALETTE.herbeSeche);
  for (const [x, z, t] of [[-10.2, 8.6, 1.1], [10.1, 8.6, 0.9], [-15.2, -8.7, 1.3], [3.5, -8.8, 1.0], [-18.2, -3.0, 1.2]]) arbuste(c, x, z, t);
  // le lierre : il dévore la tour sud-ouest et l'aile en ruine
  const lv = (n) => Math.round(n * (0.15 + 0.28 * u));
  // sur la tour sud-ouest : des langues sur les facettes qui regardent l'ouest et le sud
  for (const a of [-2.2, -1.75, -1.3, 2.9]) {
    // a : angle (sin, cos) de la direction de la facette, comme les cylindres de three
    const dx = Math.sin(a);
    const dz = Math.cos(a);
    const px = -17 + dx * 3.3;
    const pz = 7.5 + dz * 3.3;
    lierre(c, px, 0, pz, a, 1.4, 2.9, lv(22));
    lierre(K.zO.h, px, Y, pz, a, 1.2, 6.5, lv(22));
  }
  lierre(c, -14.6, 0, 10.85, 0.5, 1.6, 2.9, lv(20));
  lierre(K.zO.h, -14.6, Y, 10.85, 0.5, 1.4, 5.5, lv(18));
  lierre(c, -16.0, 0, 7.82, 0, 2.0, 2.9, lv(18));
  lierre(c, -17.32, 0, -4.0, -Math.PI / 2, 3.5, 2.9, lv(30));
  lierre(K.zO.h, -17.32, Y, -4.5, -Math.PI / 2, 3.0, 4.0, lv(22));
  lierre(c, -9.5, 0, 7.82, 0, 1.5, 2.9, lv(14));
  lierre(c, 15.5, 0, -7.82, Math.PI, 2.0, 2.9, lv(16));
  // ardoises et pierres tombées au pied de l'aile ouest
  for (let i = 0; i < Math.round(10 + 20 * u); i++) c.boite(c.entre(0.2, 0.35), 0.02, c.entre(0.15, 0.25), C.ardoise, { x: c.entre(-19.5, -6), y: 0.04, z: c.hasard() < 0.5 ? c.entre(8, 10.5) : c.entre(-10, -8), ry: c.hasard() * 3, rx: c.entre(-0.2, 0.2) }, M.mat, { crasse: false });
  gravats(c, -12.8, 9.0, 1.2, Math.round(0.6 * (6 + 10 * u)), [C.tuffeau, C.encadrement, PALETTE.pierreSombre]);
  gravats(c, -11.5, -9.0, 1.0, Math.round(0.6 * (5 + 8 * u)), [C.tuffeau, C.encadrement, PALETTE.pierreSombre]);
}

// ---------- Mobilier et objets ----------

function chaise(c, x, z, ry, renversee = false) {
  const M = K.M;
  c.repere({ x, y: renversee ? 0.23 : 0, z, ry, rz: renversee ? Math.PI / 2 : 0 }, () => {
    c.boite(0.46, 0.07, 0.44, C.velours, { y: 0.46 }, M.mat, { crasse: false });
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.boite(0.05, 0.44, 0.05, C.dore, { x: a * 0.19, y: 0.22, z: b * 0.18 }, M.satine, { crasse: false });
    c.boite(0.44, 0.55, 0.05, C.dore, { y: 0.78, z: -0.2 }, M.satine, { crasse: false });
    c.boite(0.34, 0.4, 0.03, C.velours, { y: 0.78, z: -0.17 }, M.mat, { crasse: false });
  });
}

/** Le robot-majordome connecté, couché au pied de l'escalier : nœud papillon rouge, plateau d'argent renversé. */
function robot(c, x, z, ry) {
  const M = K.M;
  const creme = PALETTE.abondanceCreme;
  c.repere({ x, z, ry }, () => {
    c.boite(0.56, 0.3, 0.74, creme, { y: 0.2 }, M.satine, { crasse: false });
    c.boite(0.5, 0.26, 0.3, 0xbfb8a6, { y: 0.17, z: 0.5 }, M.satine, { crasse: false });
    c.boite(0.24, 0.06, 0.1, PALETTE.abondanceRouge, { y: 0.37, z: -0.3 }, M.satine, { crasse: false });
    c.poser(BOULE, M.satine, creme, { y: 0.2, z: -0.62, e: [0.2, 0.19, 0.21] }, { crasse: false });
    ecran(c, 0.26, 0.18, 1 / 3, 2 / 3, { y: 0.395, z: -0.64, rx: -Math.PI / 2 });
    c.tube([0.33, 0.24, -0.28], [0.62, 0.08, 0.15], 0.06, creme, M.satine, 6, { crasse: false });
    c.tube([-0.33, 0.24, -0.28], [-0.5, 0.42, -0.65], 0.06, creme, M.satine, 6, { crasse: false });
    c.tube([0.95, 0.06, 0.55], [1.25, 0.06, 0.95], 0.06, creme, M.satine, 6, { crasse: false });
    for (const s of [-1, 1]) {
      c.tube([s * 0.15, 0.16, 0.6], [s * 0.22, 0.1, 1.3], 0.08, creme, M.satine, 6, { crasse: false });
      c.boite(0.16, 0.12, 0.26, 0x55524c, { x: s * 0.22, y: 0.08, z: 1.42 }, M.satine, { crasse: false });
    }
    // le plateau d'argent, la bouteille, le verre brisé
    c.poser(new THREE.CylinderGeometry(0.3, 0.3, 0.02, 12), M.metal, 0xc9c6bd, { x: -0.85, y: 0.02, z: -0.2, rz: 0.06 }, { crasse: false });
    c.tube([-1.1, 0.07, 0.3], [-0.75, 0.07, 0.62], 0.07, 0x2e4a33, M.satine, 7, { crasse: false });
    c.boite(0.5, 0.05, 0.8, PALETTE.abondanceCreme, { x: 0.3, y: 0.02, z: 2.2, ry: 0.4 }, M.satine, { crasse: false });
  });
}

/** Le piano à queue renversé sur le flanc, couvercle tombé, pied cassé. */
function piano(c, x, z, ry) {
  const M = K.M;
  const forme = new THREE.Shape([[0, 0], [1.5, 0], [1.5, 0.45], [1.35, 0.8], [1.0, 1.05], [0.8, 1.4], [0.7, 1.8], [0.5, 2.0], [0, 2.0]].map(([a, b]) => new THREE.Vector2(a, b)));
  const corps = new THREE.ExtrudeGeometry(forme, { depth: 0.34, bevelEnabled: false, curveSegments: 1 });
  const couvercle = new THREE.ExtrudeGeometry(forme, { depth: 0.03, bevelEnabled: false, curveSegments: 1 });
  c.repere({ x, z, ry }, () => {
    c.poser(corps, M.satine, C.laque, { y: 0, rz: Math.PI / 2, x: 1.0 }, { crasse: false });
    // clavier : touches blanches et quelques noires, éparpillées
    c.boite(0.2, 1.38, 0.18, 0xe9e4d6, { x: 1.12, y: 0.75, z: 0.2 }, M.satine, { crasse: false });
    for (let i = 0; i < 8; i++) c.boite(0.04, 0.03, 0.14, i % 2 ? 0xe9e4d6 : 0x1a1a1a, { x: 1.4 + c.entre(0, 1.2), y: 0.02, z: c.entre(-0.6, 0.9), ry: c.hasard() * 3 }, M.satine, { crasse: false });
    // pieds : un dressé vers le ciel, un cassé au sol
    c.tube([0.2, 1.1, 0.17], [-0.6, 1.1, 0.17], 0.08, C.laque, M.satine, 6, { crasse: false });
    c.tube([-0.4, 0.06, 1.3], [0.3, 0.06, 1.6], 0.08, C.laque, M.satine, 6, { crasse: false });
    c.poser(couvercle, M.satine, C.laque, { x: -1.3, y: 0.04, z: 0.6, rx: -Math.PI / 2, ry: 0.5 }, { crasse: false });
  });
}

/** Le lustre tombé : couronnes de laiton tordues, bras, pampilles éparpillées, chaîne. */
function lustre(c, x, z) {
  const M = K.M;
  c.repere({ x, z, ry: 0.4 }, () => {
    c.poser(new THREE.TorusGeometry(0.8, 0.045, 4, 14), M.metal, C.dore, { y: 0.12, rx: Math.PI / 2 + 0.12 }, { crasse: false });
    c.poser(new THREE.TorusGeometry(0.45, 0.04, 4, 10), M.metal, C.dore, { y: 0.45, x: 0.1, rx: Math.PI / 2 - 0.3 }, { crasse: false });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      if (c.hasard() < 0.2) continue;
      c.poutre([0.05, 0.6, 0], [Math.cos(a) * 0.8, 0.15, Math.sin(a) * 0.8], 0.04, C.dore, M.metal, { crasse: false });
    }
    c.tube([0, 0.05, 0], [0, 0.85, 0.05], 0.07, C.dore, M.metal, 6, { crasse: false });
    for (let i = 0; i < 26; i++) {
      const a = c.hasard() * Math.PI * 2;
      const r = i < 14 ? 0.8 : c.entre(0.9, 2.4);
      c.poser(ICO, M.satine, 0xe6edef, { x: Math.cos(a) * r, y: i < 14 ? c.entre(0.05, 0.3) : 0.04, z: Math.sin(a) * r, e: [0.05, 0.09, 0.05], rx: c.hasard() * 3 }, { crasse: false, nuance: 0.03 });
    }
    for (let i = 0; i < 9; i++) c.boite(0.12, 0.03, 0.06, 0x8a7444, { x: 1.0 + i * 0.13, y: 0.03, z: -0.3 - i * 0.08, ry: i * 1.3 }, M.metal, { crasse: false });
  });
}

/** Un lambeau de papier peint qui se décolle du mur et pend (`n` : normale du mur, vers la pièce). */
function lambeau(c, x, z, n, top, lg) {
  const M = K.M;
  const ry = Math.atan2(n[0], n[1]);
  c.repere({ x, y: top, z, ry }, () => {
    c.boite(0.52, lg, 0.012, 0xd9cfba, { y: -lg / 2, z: 0.016 }, M.mat, { crasse: false });
    c.repere({ rx: -0.45 - c.hasard() * 0.3 }, () => c.boite(0.5, lg, 0.01, C.papierRose, { y: -lg / 2, z: 0.03 }, M.papier, { crasse: false }));
  });
}

/** Une bosse de parquet gondolé : des lames soulevées en dos d'âne. */
function gondole(c, x, z, ry, n = 8, teinte = C.parquet) {
  c.repere({ x, z, ry }, () => {
    for (let i = 0; i < n; i++) {
      const zz = (i - n / 2) * 0.15;
      const hb = 0.1 + Math.sin((i / (n - 1)) * Math.PI) * 0.1;
      for (const s of [-1, 1]) c.boite(0.95, 0.03, 0.14, teinte, { x: s * 0.44, y: 0.04 + hb / 2, z: zz, rz: -s * Math.atan2(hb, 0.9) }, K.M.parquet, { crasse: false });
    }
  });
}

function chemineeSalon() {
  const Z = K.zE;
  const c = Z.b;
  const M = K.M;
  const zb = -7.21;
  const mg = 0xb9b1a2;
  pv(Z, 8.9, 0, zb, 9.45, 1.55, -6.35, mg, M.mat);
  pv(Z, 11.55, 0, zb, 12.1, 1.55, -6.35, mg, M.mat);
  pv(Z, 8.7, 1.55, zb, 12.3, 2.0, -6.25, mg, M.mat);
  pv(Z, 8.5, 2.0, zb, 12.5, 2.15, -6.15, C.marbre, M.mat);
  pv(Z, 8.95, 2.15, zb, 12.05, 4.45, -6.6, C.stuc, M.mat);
  // blason (armes de la famille) et sa couronne
  pv(Z, 10.15, 2.6, -6.6, 10.85, 3.4, -6.52, C.dore, M.satine);
  pv(Z, 10.3, 2.75, -6.52, 10.7, 3.25, -6.48, 0x3a4f63, M.satine);
  pv(Z, 10.05, 3.45, -6.6, 10.95, 3.62, -6.5, C.dore, M.satine);
  // foyer noirci, âtre
  c.pave(9.45, 0, zb, 11.55, 1.55, -7.08, C.suie, M.mat, { crasse: false });
  c.pave(8.6, 0, -6.35, 12.4, 0.06, -5.4, C.marbreGris, M.mat);
  // le feu des survivants
  for (let i = 0; i < 3; i++) c.tube([9.8 + i * 0.15, 0.12, -6.8 + i * 0.12], [11.0 + i * 0.1, 0.16 + i * 0.05, -6.6 - i * 0.05], 0.09, 0x2e241c, M.mat, 6, { crasse: false });
  for (let i = 0; i < 10; i++) c.boite(0.1, 0.06, 0.1, C.braise, { x: c.entre(9.8, 11.2), y: 0.07, z: c.entre(-6.95, -6.45), ry: c.hasard() * 3 }, M.mat, { crasse: false, nuance: 0.1 });
  for (let i = 0; i < 4; i++) c.poser(POINTE, M.lueur, 0xff9a40, { x: 10.0 + i * 0.32, y: 0.5, z: -6.7, e: [0.2, 0.65 + (i % 2) * 0.25, 0.2], ry: i }, { crasse: false, nuance: 0 });
  c.tube([10.4, 0.55, -6.2], [10.4, 0.9, -6.2], 0.2, 0x2a2826, M.tole, 8);
  lum(10.5, 0.9, -6.1, 0xff8a3d, 9, 12, "feu");
}

// ---------- L'intérieur (carte « intérieur ») ----------

function interieur() {
  salleDeBal();
  hall();
  salon();
}

function salleDeBal() {
  const Z = K.zO;
  const c = Z.b;
  const M = K.M;
  const u = K.u;
  c.pave(-16.72, -0.02, -7.22, -5.73, 0.025, 7.22, C.parquet, M.parquet, { crasse: false });
  // le chêne qui a crevé le parquet
  const xa = -11.2;
  const za = -0.8;
  arbre(c, xa, za, 13.5, "feuillu");
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    c.tube([xa, 0.35, za], [xa + Math.cos(a) * c.entre(1.0, 1.8), 0.02, za + Math.sin(a) * c.entre(1.0, 1.8)], 0.13, 0x5e4a36, M.mat, 5);
  }
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    c.boite(0.9, 0.03, 0.14, C.parquet, { x: xa + Math.cos(a) * 1.3, y: 0.18, z: za + Math.sin(a) * 1.3, ry: -a, rz: 0.35 }, M.parquet, { crasse: false });
  }
  mousse(c, xa, 0.02, za, 1.8, 10, PALETTE.mousse);
  semerTouffes(c, xa - 2.2, za - 2.2, xa + 2.2, za + 2.2, 10, PALETTE.herbe, 0.02);
  // rais de lumière par le toit effondré
  rai(c, [-11.8, 13, 1.2], [-12.8, 0.05, 2.6], 2.6);
  rai(c, [-14.6, 13, -3.4], [-15.2, 0.05, -2.4], 1.7);
  rai(c, [-8.0, 13, 3.4], [-8.6, 0.05, 4.6], 1.4);
  // gravats, ardoises tombées, flaques
  gravats(c, -14.4, 3.6, 1.8, Math.round(0.6 * (12 + 14 * u)), [C.tuffeau, C.plafond, C.charpente, PALETTE.pierreSombre]);
  gravats(c, -8.0, -4.8, 1.3, Math.round(0.6 * (8 + 10 * u)), [C.plafond, C.stuc, C.tuffeau]);
  gravats(c, -16.0, -5.6, 0.9, Math.round(0.6 * (5 + 6 * u)), [C.tuffeau, C.plafond]);
  debris(c, -16.5, -7, -6, 7, Math.round(0.6 * (20 + 30 * u)), [C.plafond, C.stuc, 0xd9d2c0, C.tuffeau]);
  for (let i = 0; i < Math.round(12 + 18 * u); i++) c.boite(c.entre(0.2, 0.34), 0.02, c.entre(0.15, 0.24), C.ardoise, { x: c.entre(-16.4, -6.2), y: 0.04, z: c.entre(-6.8, 6.8), ry: c.hasard() * 3, rx: c.entre(-0.2, 0.2) }, M.mat, { crasse: false });
  jonchee(c, -16.5, -7, -6, 7, Math.round(30 + 40 * u));
  flaqueC(c, -12.6, 2.4, 1.1);
  flaqueC(c, -9.6, -3.5, 0.7);
  gondole(c, -7.7, 3.2, 0.3);
  gondole(c, -14.4, -1.6, 1.2, 7);
  // le lustre écrasé, les chaises dorées
  lustre(c, -8.6, 2.6);
  chaise(c, -7.2, -5.6, 0.3);
  chaise(c, -15.5, -2.6, 1.2, true);
  chaise(c, -6.6, 0.8, -1.4);
  chaise(c, -9.8, 5.6, 2.2, true);
  chaise(c, -13.8, -6.4, 0.1);
  // pilastres de stuc doré, grand miroir fêlé sur le refend
  for (const [x, z1, z2] of [[-16.0, -7.2, -6.98], [-11.5, -7.2, -6.98], [-6.4, -7.2, -6.98], [-6.4, 6.98, 7.2], [-10.15, 6.98, 7.2]]) {
    pv(Z, x - 0.24, 0, z1, x + 0.24, 4.2, z2, C.stuc, M.mat);
    pv(Z, x - 0.32, 3.75, z1 - 0.02, x + 0.32, 4.2, z2 + 0.02, C.dore, M.satine);
    pv(Z, x - 0.3, 0, z1 - 0.02, x + 0.3, 0.35, z2 + 0.02, C.stuc, M.mat);
  }
  rep(Z, { x: -5.74, z: -3.0, ry: -Math.PI / 2 }, () => {
    pv(Z, -1.15, 0.3, 0, 1.15, 3.3, 0.06, C.dore, M.satine);
    pv(Z, -1.0, 0.45, 0.05, 1.0, 3.15, 0.08, 0xb9c4c6, M.metal, { crasse: false });
    for (const [a, b, r] of [[0.1, 1.8, 0.6], [-0.3, 1.4, -0.9], [0.5, 2.3, 1.9]]) Z.b.boite(1.3, 0.025, 0.01, 0x3a3a3a, { x: a, y: b, z: 0.09, rz: r }, M.mat, { crasse: false });
  });
  // lierre entré par la brèche, herbes
  lierre(c, -16.69, 0, 2.6, Math.PI / 2, 2.6, 2.9, Math.round(12 + 14 * u));
  semerTouffes(c, -16.4, -1.5, -14.5, 2.2, 12, PALETTE.herbeSeche, 0.02);
}

function hall() {
  const Z = K.zC;
  const c = Z.b;
  const M = K.M;
  const u = K.u;
  c.pave(-5.27, -0.02, -7.22, 5.27, 0.025, 7.42, 0xffffff, M.damier, { crasse: false });
  escalierHonneur();
  // colonnes de marbre sous l'étage, à l'entrée de l'avant-corps
  for (const s of [-1, 1]) {
    c.poser(new THREE.CylinderGeometry(0.26, 0.29, Y - 0.4, 10), M.satine, C.marbre, { x: s * 3.1, y: 0.4 + (Y - 0.4) / 2, z: 7.3 });
    Z.h.poser(new THREE.CylinderGeometry(0.25, 0.26, 4.1 - Y, 10), M.satine, C.marbre, { x: s * 3.1, y: Y + (4.1 - Y) / 2, z: 7.3 });
    c.pave(s * 3.1 - 0.4, 0, 6.9, s * 3.1 + 0.4, 0.4, 7.7, C.marbreGris, M.satine);
    Z.h.pave(s * 3.1 - 0.42, 4.1, 6.88, s * 3.1 + 0.42, 4.5, 7.72, C.marbre, M.satine);
    obsCercle(s * 3.1, 7.3, 0.4, 6, "colonne");
  }
  // le robot-majordome, au pied de l'escalier
  robot(c, 0.9, 2.3, 1.25);
  // le portrait de l'ancêtre, tombé contre le refend
  rep(Z, { x: -5.05, z: -1.6, ry: Math.PI / 2 }, () => {
    c.repere({ rx: -0.25 }, () => {
      c.pave(-0.85, 0, 0, 0.85, 2.1, 0.08, C.dore, M.satine);
      c.pave(-0.7, 0.15, 0.07, 0.7, 1.95, 0.1, 0x3a3428, M.mat, { crasse: false });
      c.pave(-0.35, 0.9, 0.1, 0.3, 1.6, 0.11, 0x8a6e58, M.mat, { crasse: false });
    });
  });
  // la lanterne et le sac des survivants au pied de la rampe
  c.boite(0.22, 0.32, 0.22, 0x2d2a25, { x: -2.15, y: 1.25, z: -0.35 }, M.tole);
  c.boite(0.16, 0.2, 0.16, 0xffc56a, { x: -2.15, y: 1.25, z: -0.35 }, M.mat, { crasse: false, nuance: 0 });
  c.boite(0.45, 0.55, 0.3, 0x55603f, { x: -2.6, y: 0.28, z: 0.4, ry: 0.4 }, M.mat);
  lum(-2.15, 1.5, -0.2, 0xffc86a, 4, 9, "lanterne");
  // feuilles mortes poussées par le vent jusqu'au pied des marches, débris
  jonchee(c, -2.5, 4.5, 2.5, 7.4, Math.round(20 + 25 * u));
  debris(c, -5, -4, 5, 7, Math.round(0.6 * (10 + 14 * u)), [C.marbre, C.plafond, C.tuffeau]);
  rai(c, [1.6, 3.6, 10.2], [-0.6, 0.05, 5.6], 1.6);
}

/** L'escalier d'honneur : volée centrale, palier, deux volées latérales (celle de gauche effondrée, celle de droite trouée). */
function escalierHonneur() {
  const Z = K.zC;
  const c = Z.b;
  const M = K.M;
  const m = C.marbre;
  c.pave(-5.25, 0, -7.2, 5.25, 2.0, -4.4, 0xcfc8b9, M.tuffeau);
  c.pave(-5.25, 1.9, -7.2, 5.25, 2.05, -4.3, m, M.mat);
  for (const x of [-3.0, 3.0]) c.pave(x - 0.6, 0.35, -4.42, x + 0.6, 1.6, -4.36, 0xbdb5a5, M.tuffeau);
  for (let k = 0; k < 12; k++) {
    const y2 = (k + 1) * (2.0 / 12);
    const z1 = -0.5 - k * 0.325;
    c.pave(-1.7, 0, z1, 1.7, y2, z1 - 0.325, m, M.mat);
    c.pave(-1.76, y2 - 0.035, z1 + 0.03, 1.76, y2, z1 - 0.325, 0xe3ded3, M.mat);
  }
  const fin = { "-1": 6, 1: 9 };
  for (const s of [-1, 1]) {
    const xi = s * 3.62;
    const xe = s * 5.25;
    for (let k = 1; k <= 15; k++) {
      const present = k <= fin[s] || (s > 0 && k >= 13);
      if (!present) continue;
      const y2 = 2.0 + k * (2.5 / 15);
      const z1 = -4.4 + (k - 1) * 0.3;
      pv(Z, xi, y2 - 0.22, z1, xe, y2, z1 + 0.3, m, M.mat);
    }
    // voûte rampante sous la volée
    const kf = fin[s];
    const a = [-4.4, 1.75];
    const b = [-4.4 + kf * 0.3, 2.0 + kf * (2.5 / 15) - 0.3];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    c.boite(Math.abs(xe - xi), 0.3, Math.hypot(b[0] - a[0], b[1] - a[1]), 0xcfc8b9, { x: (xi + xe) / 2, y: (a[1] + b[1]) / 2, z: (a[0] + b[0]) / 2, rx: -ang }, M.tuffeau);
    // l'arrachement : blocs en porte-à-faux, marches tombées en contrebas
    for (let i = 0; i < 5; i++) {
      const y = 2.0 + kf * (2.5 / 15) + c.entre(-0.4, 0.1);
      c.boite(c.entre(0.3, 0.6), 0.22, c.entre(0.2, 0.35), m, { x: c.entre(Math.min(xi, xe), Math.max(xi, xe)), y, z: -4.4 + kf * 0.3 + c.entre(0, 0.25), rx: c.entre(-0.4, 0.4), rz: c.entre(-0.3, 0.3) }, M.mat);
    }
    const nTombe = s < 0 ? 6 : 3;
    for (let i = 0; i < nTombe; i++) c.boite(1.5, 0.2, 0.3, m, { x: s * 4.4 + c.entre(-0.4, 0.4), y: 0.12 + (i % 2) * 0.18, z: -1.6 + i * 0.45 + c.entre(-0.2, 0.2), ry: c.entre(-0.6, 0.6), rz: c.entre(-0.25, 0.25) }, M.mat);
    gravats(c, s * 4.3, s < 0 ? -0.6 : 0.3, 1.2, s < 0 ? 10 : 6, [m, C.marbreGris, C.plafond]);
    // balustrade rampante de la volée latérale (côté vide)
    balustrade(Z, [xi, 2.0, -4.35], [xi, 2.0 + kf * (2.5 / 15), -4.4 + kf * 0.3], { h: 0.9, casse: s < 0 ? 0.6 : 1 });
  }
  // balustrades de la volée centrale et du palier
  for (const s of [-1, 1]) {
    balustrade(Z, [s * 1.75, 0, -0.45], [s * 1.75, 2.0, -4.4], { h: 0.9 });
    balustrade(Z, [s * 1.75, 2.0, -4.38], [s * 3.6, 2.0, -4.38], { h: 0.9 });
    // pilastre de départ et sa boule
    c.pave(s * 1.75 - 0.2, 0, -0.65, s * 1.75 + 0.2, 1.15, -0.25, m, M.mat);
    c.poser(BOULE, M.satine, m, { x: s * 1.75, y: 1.3, z: -0.45, e: 0.17 });
  }
  // obstacles : la cage d'escalier est infranchissable
  obs(-1.75, -0.4, 1.75, -0.4, "escalier");
  for (const s of [-1, 1]) {
    obs(s * 1.75, -0.4, s * 1.75, -4.4, "escalier");
    obs(s * 1.75, -4.4, s * 3.62, -4.4, "escalier");
    obs(s * 3.62, -4.4, s * 3.62, 0.1, "escalier");
    obs(s * 3.62, 0.1, s * 5.25, 0.1, "escalier");
  }
}

function salon() {
  const Z = K.zE;
  const c = Z.b;
  const M = K.M;
  const u = K.u;
  c.pave(5.72, -0.02, -7.22, 16.72, 0.025, 7.22, 0xc8a07a, M.parquet, { crasse: false });
  gondole(c, 14.2, -3.6, 0.6, 8, 0xc8a07a);
  // tapis élimé, canapé éventré, fauteuil renversé, guéridon
  c.pave(8.4, 0.025, -4.0, 12.6, 0.045, -1.0, 0x7a3f3b, M.mat, { crasse: false, nuance: 0.03 });
  c.pave(8.8, 0.045, -3.6, 12.2, 0.05, -1.4, 0x9a6a4a, M.mat, { crasse: false });
  c.repere({ x: 10.5, z: 0.6, ry: 0.08 }, () => {
    c.boite(2.3, 0.4, 0.9, C.velours, { y: 0.32 }, M.mat);
    c.boite(2.3, 0.65, 0.22, C.velours, { y: 0.7, z: 0.36 }, M.mat);
    for (const s of [-1, 1]) c.boite(0.22, 0.55, 0.9, C.velours, { x: s * 1.15, y: 0.45 }, M.mat);
    for (let i = 0; i < 6; i++) c.poser(ICO, M.mat, 0xe6dfcf, { x: c.entre(-0.9, 0.9), y: 0.56, z: c.entre(-0.3, 0.2), e: c.entre(0.1, 0.18) }, { crasse: false });
  });
  c.repere({ x: 7.3, y: 0.45, z: -2.6, ry: 0.9, rx: -Math.PI / 2 + 0.15 }, () => {
    c.boite(0.8, 0.4, 0.8, C.velours, { y: 0.0 }, M.mat);
    c.boite(0.8, 0.7, 0.2, C.velours, { y: 0.35, z: -0.4 }, M.mat);
  });
  c.poser(new THREE.CylinderGeometry(0.45, 0.45, 0.04, 10), M.satine, 0x5a4130, { x: 8.0, y: 0.4, z: 5.4, rz: 1.4 });
  piano(c, 13.2, 3.0, 0.5);
  // la commode, un tiroir au sol, le portrait
  c.pave(16.12, 0, -6.0, 16.7, 0.95, -4.6, 0x6b4e35, M.satine);
  c.boite(0.5, 0.2, 1.2, 0x6b4e35, { x: 15.4, y: 0.1, z: -4.9, ry: 0.3 }, M.satine);
  // le campement des survivants devant la cheminée
  chemineeSalon();
  c.boite(0.8, 0.14, 1.9, 0x5d6644, { x: 8.7, y: 0.07, z: -4.6, ry: 0.2 }, M.mat, { crasse: false });
  c.boite(0.55, 0.12, 0.35, 0x7a3e2c, { x: 8.75, y: 0.15, z: -5.4, ry: 0.2 }, M.mat, { crasse: false });
  c.boite(0.45, 0.6, 0.3, 0x4f5a3c, { x: 12.8, y: 0.3, z: -5.2, ry: -0.4 }, M.mat);
  for (let i = 0; i < 5; i++) c.poser(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 7), M.tole, 0x9a958a, { x: 9.3 + c.entre(0, 0.8), y: i < 3 ? 0.06 : 0.05, z: -5.3 + c.entre(0, 0.5), rz: i < 3 ? 0 : 1.5 }, { crasse: false });
  // papier peint qui se décolle
  for (const x of [6.4, 8.0, 13.4, 15.6]) lambeau(c, x, -7.19, [0, 1], c.entre(2.3, 2.9), c.entre(0.8, 1.7));
  for (const x of [6.9, 10.2, 14.4]) lambeau(c, x, 7.19, [0, -1], c.entre(2.3, 2.9), c.entre(0.8, 1.7));
  for (const z of [-5.8, 5.3]) lambeau(c, 16.69, z, [-1, 0], c.entre(2.3, 2.9), c.entre(0.8, 1.6));
  for (const z of [-5.6, 0.4, 6.4]) lambeau(c, 5.74, z, [1, 0], c.entre(2.3, 2.9), c.entre(0.8, 1.6));
  debris(c, 6, -7, 16.5, 7, Math.round(0.6 * (10 + 14 * u)), [C.plafond, C.papierRose, 0xd9d2c0]);
  jonchee(c, 14.5, -3.8, 16.6, -0.6, 18);
}

// ---------- Le parc (carte « parc », coordonnées de la carte) ----------

function parc() {
  const c = K.b.c;
  const M = K.M;
  const u = K.u;
  const ob = (x1, z1, x2, z2, n) => K.b.obstacle(x1, z1, x2, z2, n);
  // pelouses en plaques (herbe plus ou moins sèche), allée de graviers, rond-point
  const tons = [PALETTE.herbeSeche, 0x8f9d58, 0x87985a, 0x9aa465];
  for (let x = -42; x < 42; x += 12) for (let z = -42; z < 42; z += 12) c.pave(x, -0.015, z, x + 12, 0.008, z + 12, tons[Math.floor(c.hasard() * 4)], M.mat, { crasse: false, nuance: 0.04 });
  for (let z = -8; z < 40; z += 4) c.pave(-2.6, -0.01, z, 2.6, 0.03, Math.min(40.5, z + 4), C.gravier, M.mat, { crasse: false, nuance: 0.05 });
  c.poser(new THREE.CylinderGeometry(8.5, 8.5, 0.05, 20), M.mat, C.gravier, { x: 0, y: 0.012, z: 8 }, { crasse: false });
  semerTouffes(c, -2.4, -7, 2.4, 39, Math.round(0.4 * (18 + 30 * u)), PALETTE.herbeSeche, 0.03);
  fontaine(c, 0, 8);
  voiture(c, 1.2, 6.4);
  // parterres de buis envahis
  parterre(c, -21, 12.5, -10, 21);
  // statue décapitée (et sa tête dans l'herbe), socle vide d'en face
  statue(c, -15.5, 16.75);
  c.pave(14.9, 0, 16.15, 16.1, 1.6, 17.35, 0xc5bfb2, M.tuffeau);
  c.repere({ x: 17.2, y: 0.32, z: 18.3, ry: 0.7, rz: Math.PI / 2 }, () => figure(c));
  // arbres : alignement de tilleuls, cèdre, chênes, arbre mort, arbre abattu, bouleaux
  for (const z of [23, 31]) for (const s of [-1, 1]) arbre(c, s * 5.6, z + c.entre(-0.5, 0.5), c.entre(8.5, 10.5), "feuillu");
  cedre(c, -33, -26, 14);
  arbre(c, 33, -4, 13, "feuillu");
  arbre(c, 28, 16, 9, "mort");
  arbre(c, 33, -31, 9, "bouleau");
  arbreAbattu(c, -28.5, 31, 0.5);
  for (const [x, z, t] of [[24, 7, 1.4], [36, 30, 1.8], [12, 34, 1.2], [30, -16, 1.3]]) arbuste(c, x, z, t);
  semerTouffes(c, -40, -40, 40, 40, Math.round(0.5 * (20 + 30 * u)), PALETTE.herbeSeche, 0.01);
  // l'allée des communs, vers l'est
  for (let x = 22; x < 42; x += 5) c.pave(x, -0.01, -12, x + 5, 0.03, -8.6, C.gravier, M.mat, { crasse: false, nuance: 0.05 });
  // les annexes visitables
  chapelle();
  maisonGardien();
  // bancs, lampadaires (l'un tordu), grille d'honneur
  for (const s of [-1, 1]) banc(c, s * 9.4, 8, s * Math.PI / 2);
  for (const [x, z, tordu] of [[-3.4, 22, false], [3.4, 22, false], [-3.4, 32, false], [3.4, 32, true]]) lampadaire(c, x, z, tordu);
  grille(c, ob);
  // lumière : le feu du salon se voit par les fenêtres (lumières du château posées dans creer)
}

function fontaine(c, x, z) {
  const M = K.M;
  const r = 4.3;
  const n = 18;
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * Math.PI * 2;
    if (i === 4 && K.u > 0.5) {
      c.boite(1.4, 0.4, 0.45, 0xc5bfb2, { x: x + Math.cos(a) * (r + 0.9), y: 0.2, z: z + Math.sin(a) * (r + 0.9), ry: -a + 0.6, rz: 0.2 }, M.tuffeau);
      continue;
    }
    c.boite((2 * Math.PI * r) / n + 0.06, 0.55, 0.45, 0xc5bfb2, { x: x + Math.cos(a) * r, y: 0.275, z: z + Math.sin(a) * r, ry: -a + Math.PI / 2 }, M.tuffeau);
    c.boite((2 * Math.PI * r) / n + 0.1, 0.1, 0.6, 0xd2ccbf, { x: x + Math.cos(a) * r, y: 0.6, z: z + Math.sin(a) * r, ry: -a + Math.PI / 2 }, M.tuffeau);
  }
  for (let i = 0; i < 12; i++) {
    const a1 = (i / 12) * Math.PI * 2;
    const a2 = ((i + 1) / 12) * Math.PI * 2;
    K.b.obstacle(x + Math.cos(a1) * (r + 0.25), z + Math.sin(a1) * (r + 0.25), x + Math.cos(a2) * (r + 0.25), z + Math.sin(a2) * (r + 0.25), "fontaine");
  }
  // fond asséché : vase craquelée, flaque verte, feuilles, herbes
  c.poser(new THREE.CylinderGeometry(r - 0.2, r - 0.2, 0.06, 18), M.mat, 0x7c6e57, { x, y: 0.08, z }, { crasse: false });
  flaqueC(c, x - 1.6, z + 1.2, 1.2);
  jonchee(c, x - 3, z - 3, x + 3, z + 3, 40, undefined, 0.12);
  semerTouffes(c, x - 3, z - 3, x + 3, z + 3, 18, PALETTE.herbe, 0.1);
  mousse(c, x, 0.12, z, 2.8, 8, PALETTE.mousse);
  // la vasque centrale, son fût, la pomme de pin de bronze verdi
  c.poser(new THREE.CylinderGeometry(0.42, 0.55, 1.3, 10), M.tuffeau, 0xc5bfb2, { x, y: 0.7, z });
  c.poser(VASQUE, M.tuffeau, 0xc9c3b6, { x, y: 1.3, z });
  c.poser(new THREE.CylinderGeometry(0.2, 0.26, 0.9, 8), M.tuffeau, 0xc5bfb2, { x, y: 2.1, z });
  c.poser(VASQUE, M.tuffeau, 0xc9c3b6, { x, y: 2.5, z, e: 0.45 });
  c.poser(BOULE, M.metal, PALETTE.cuivreVert, { x, y: 2.95, z, e: [0.16, 0.28, 0.16] });
  arbuste(c, x + 0.5, z - 0.3, 0.5, 1.7, [PALETTE.herbeSeche, PALETTE.herbe, 0x7d8f4a]);
}

/** La voiture autonome de luxe qui a fini sa course dans la fontaine (« Destination atteinte »). */
function voiture(c, x, z) {
  const M = K.M;
  c.repere({ x, y: 0.55, z, ry: 0.35, rx: 0.2 }, () => {
    c.boite(1.9, 0.55, 4.5, 0xd3c9b2, { y: 0.15 }, M.satine);
    c.boite(1.92, 0.12, 4.52, PALETTE.abondanceCanard, { y: 0.0 }, M.satine);
    c.boite(1.65, 0.55, 2.4, 0xffffff, { y: 0.7, z: 0.3 }, M.verre, { crasse: false });
    c.boite(1.5, 0.06, 2.0, 0xd3c9b2, { y: 0.98, z: 0.35 }, M.satine);
    c.boite(1.0, 0.08, 0.35, 0x2a2a2a, { y: 1.05, z: 0.1 }, M.satine);
    for (const [a, b] of [[-1, -1.45], [1, -1.45], [-1, 1.5], [1, 1.5]]) c.poser(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 9), M.mat, 0x2a2826, { x: a * 0.92, y: -0.15, z: b, rz: Math.PI / 2 });
    for (let i = 0; i < 4; i++) c.boite(c.entre(0.2, 0.5), 0.02, c.entre(0.2, 0.6), PALETTE.rouille, { x: c.entre(-0.8, 0.8), y: 0.43, z: c.entre(-2, 2) }, M.mat, { crasse: false });
    // une portière ouverte en élytre
    c.boite(0.06, 0.5, 1.1, 0xd3c9b2, { x: 1.2, y: 0.95, z: 0.2, rz: -0.9 }, M.satine);
  });
  jonchee(c, x - 1.2, z - 2, x + 1.2, z + 2, 16, undefined, 1.2);
}

function parterre(c, x1, z1, x2, z2) {
  const M = K.M;
  const haie = (a1, b1, a2, b2) => {
    const L = Math.hypot(a2 - a1, b2 - b1);
    const n = Math.max(1, Math.round(L / 1.6));
    for (let i = 0; i < n; i++) {
      if (c.hasard() < 0.12) continue;
      const t1 = i / n;
      const t2 = (i + 1) / n;
      const h = c.entre(0.45, 0.75);
      c.pave(a1 + (a2 - a1) * t1 - 0.25, 0, b1 + (b2 - b1) * t1 - 0.25, a1 + (a2 - a1) * t2 + 0.25, h, b1 + (b2 - b1) * t2 + 0.25, PALETTE.feuillageSombre, M.mat, { nuance: 0.08 });
      if (c.hasard() < 0.12 * (0.5 + K.u)) arbuste(c, a1 + (a2 - a1) * (t1 + t2) * 0.5, b1 + (b2 - b1) * (t1 + t2) * 0.5, c.entre(0.8, 1.4), 0.2);
    }
  };
  haie(x1, z1, x2, z1);
  haie(x1, z2, x2, z2);
  haie(x1, z1, x1, z2);
  haie(x2, z1, x2, z2);
  const xm = (x1 + x2) / 2;
  const zm = (z1 + z2) / 2;
  haie(xm - 2.5, zm, xm + 2.5, zm);
  haie(xm, zm - 2.5, xm, zm + 2.5);
  semerTouffes(c, x1 + 0.4, z1 + 0.4, x2 - 0.4, z2 - 0.4, 7, PALETTE.herbeSeche, 0.01);
}

/** Une figure drapée de marbre, sans tête : robe, torse, bras levé, bras cassé. */
function figure(c) {
  const M = K.M;
  const m = 0xdcd8cf;
  c.poser(new THREE.CylinderGeometry(0.28, 0.42, 1.25, 8), M.satine, m, { y: 0.62 });
  c.boite(0.52, 0.55, 0.3, m, { y: 1.5 }, M.satine);
  c.tube([0.25, 1.7, 0], [0.42, 2.25, 0.15], 0.075, m, M.satine, 6);
  c.tube([-0.25, 1.7, 0], [-0.36, 1.45, 0.1], 0.075, m, M.satine, 6);
  c.tube([0, 1.75, 0], [0, 1.88, 0], 0.08, m, M.satine, 6);
}

function statue(c, x, z) {
  const M = K.M;
  c.pave(x - 0.75, 0, z - 0.75, x + 0.75, 0.3, z + 0.75, 0xbdb6a8, M.tuffeau);
  c.pave(x - 0.55, 0.3, z - 0.55, x + 0.55, 1.6, z + 0.55, 0xc5bfb2, M.tuffeau);
  c.pave(x - 0.68, 1.6, z - 0.68, x + 0.68, 1.8, z + 0.68, 0xcdc7ba, M.tuffeau);
  c.repere({ x, y: 1.8, z, ry: 0.5 }, () => figure(c));
  mousse(c, x, 1.81, z, 0.5, 3, PALETTE.mousse);
  lierre(c, x, 0, z + 0.57, 0, 1.0, 1.4, 9);
  c.poser(BOULE, M.satine, 0xd2cec4, { x: x + 1.6, y: 0.14, z: z + 1.4, e: [0.15, 0.17, 0.16], rx: 1.2 });
  mousse(c, x + 1.6, 0.05, z + 1.4, 0.3, 3, PALETTE.mousse);
  K.b.obstacle(x - 0.75, z - 0.75, x + 0.75, z - 0.75, "statue");
  K.b.obstacle(x + 0.75, z - 0.75, x + 0.75, z + 0.75, "statue");
  K.b.obstacle(x + 0.75, z + 0.75, x - 0.75, z + 0.75, "statue");
  K.b.obstacle(x - 0.75, z + 0.75, x - 0.75, z - 0.75, "statue");
}

function cedre(c, x, z, h) {
  const M = K.M;
  c.tube([x, 0, z], [x + 0.3, h * 0.9, z], h * 0.03, 0x4f3d2c, M.mat, 6);
  for (let k = 0; k < 4; k++) {
    const y = h * (0.25 + k * 0.18);
    const r = h * (0.36 - k * 0.07);
    for (let j = 0; j < 2; j++) {
      const a = j * 2.1 + k * 1.3;
      c.poser(ICO, M.mat, [0x34523a, 0x2d4733, 0x3d5c40][j], { x: x + Math.cos(a) * r * 0.4, y, z: z + Math.sin(a) * r * 0.4, ry: c.hasard() * 3, e: [r * 0.7, h * 0.05, r * 0.7] }, { crasse: false, nuance: 0.05 });
    }
  }
}

function arbreAbattu(c, x, z, ry) {
  const M = K.M;
  c.repere({ x, z, ry }, () => {
    c.tube([0, 0.45, 0], [9, 0.35, 0.3], 0.42, 0x5e4a36, M.mat, 7);
    c.poser(new THREE.CylinderGeometry(1.6, 1.6, 0.5, 9), M.mat, 0x6a5440, { x: -0.2, y: 1.3, z: 0, rz: Math.PI / 2 });
    for (let i = 0; i < 5; i++) c.tube([2 + i * 1.4, 0.45, 0], [2.8 + i * 1.4, 1.2 + c.hasard(), c.entre(-1.2, 1.2)], 0.1, 0x5e4a36, M.mat, 5);
    mousse(c, 4, 0.85, 0.1, 1.5, 5, PALETTE.mousse);
  });
  K.b.obstacle(x, z, x + Math.cos(ry) * 9, z - Math.sin(ry) * 9, "arbre abattu");
}

function banc(c, x, z, ry) {
  const M = K.M;
  c.repere({ x, z, ry }, () => {
    for (const s of [-1, 1]) c.boite(0.25, 0.42, 0.45, 0xbdb6a8, { x: s * 0.7, y: 0.21 }, M.tuffeau);
    c.boite(1.9, 0.1, 0.55, 0xc8c2b4, { y: 0.47 }, M.tuffeau);
  });
}

function lampadaire(c, x, z, tordu) {
  const M = K.M;
  const fer = 0x2f3a33;
  c.boite(0.36, 0.5, 0.36, fer, { x, y: 0.25, z }, M.tole);
  const haut = tordu ? [x + 1.1, 2.7, z + 0.4] : [x, 3.3, z];
  if (tordu) {
    c.tube([x, 0.5, z], [x, 1.7, z], 0.06, fer, M.tole, 6);
    c.tube([x, 1.7, z], haut, 0.06, fer, M.tole, 6);
  } else c.tube([x, 0.5, z], haut, 0.06, fer, M.tole, 6);
  c.boite(0.34, 0.45, 0.34, fer, { x: haut[0], y: haut[1] + 0.2, z: haut[2], rz: tordu ? -0.8 : 0 }, M.tole);
  if (!tordu) c.boite(0.26, 0.34, 0.26, 0xffffff, { x, y: haut[1] + 0.2, z }, M.verre, { crasse: false });
  c.poser(POINTE, M.tole, fer, { x: haut[0], y: haut[1] + 0.55, z: haut[2], e: [0.28, 0.25, 0.28], ry: Math.PI / 4, rz: tordu ? -0.8 : 0 });
}

function grille(c, ob) {
  const M = K.M;
  const zg = 40;
  const fer = 0x33302b;
  for (const s of [-1, 1]) {
    c.pave(s * 2.8, 0, zg - 0.45, s * 3.7, 2.8, zg + 0.45, 0xc5bfb2, M.tuffeau);
    c.pave(s * 2.7, 2.8, zg - 0.55, s * 3.8, 3.0, zg + 0.55, 0xd0cabd, M.tuffeau);
    if (s < 0 || K.u < 0.5) c.poser(BOULE, M.tuffeau, 0xd0cabd, { x: s * 3.25, y: 3.3, z: zg, e: 0.32 });
    else c.poser(BOULE, M.tuffeau, 0xd0cabd, { x: s * 4.4, y: 0.3, z: zg + 1.2, e: 0.32 });
    // le mur d'enceinte, écroulé par endroits
    mur(c, [s * 3.7, zg], [s * 24, zg], { h: 1.9, ep: 0.45, couleur: 0xc5bfb2, mat: M.tuffeau, breches: [{ u: 13 + (s > 0 ? 2 : 0), l: 4, profondeur: 1.6 + K.u * 0.3 }], batiment: { obstacle: ob } });
  }
  // les battants de fer forgé : l'un ouvert de travers, l'autre à plat dans le gravier
  const battant = (pose) =>
    c.repere(pose, () => {
      for (const y of [0.15, 1.2, 2.3]) c.boite(2.6, 0.06, 0.05, fer, { x: 1.3, y }, M.tole);
      for (let i = 0; i <= 16; i++) c.boite(0.03, 2.5, 0.03, fer, { x: 0.05 + i * 0.158, y: 1.25 }, M.tole);
      for (let i = 0; i <= 16; i += 2) c.poser(POINTE, M.tole, fer, { x: 0.05 + i * 0.158, y: 2.6, e: [0.05, 0.18, 0.05] });
    });
  battant({ x: -2.75, z: zg, ry: -1.1 });
  battant({ x: 2.75, y: 0.05, z: zg + 0.6, ry: Math.PI + 0.25, rx: -Math.PI / 2 });
  borne(c, 4.6, zg - 2.4, -0.3);
  c.pave(-2.75, -0.01, zg - 0.5, 2.75, 0.03, zg + 1.2, C.gravier, M.mat, { crasse: false });
}

// ---------- Les abords (carte « intérieur ») ----------

function abords() {
  const c = K.b.c;
  const u = K.u;
  // pelouse et allée vers le parc
  for (let x = -26; x < 26; x += 6.5) for (let z = -18; z < 18; z += 6) {
    if (x > -21.5 && x + 6.5 < 26 && z > -11 && z + 6 < 8) continue;
    c.pave(x, -0.015, z, x + 6.5, 0.008, z + 6, [PALETTE.herbeSeche, 0x8f9d58, 0x87985a][Math.floor(c.hasard() * 3)], K.M.mat, { crasse: false, nuance: 0.04 });
  }
  c.pave(-2.6, -0.01, 16, 2.6, 0.03, 23, C.gravier, K.M.mat, { crasse: false });
  semerTouffes(c, -25, -15, 25, 22, Math.round(0.7 * (40 + 50 * u)), PALETTE.herbeSeche, 0.01);
  cedre(c, -22.5, -12, 13);
  arbre(c, -24.5, 9, 10, "feuillu");
  arbre(c, 23.5, 15, 8, "mort");
  for (const [x, z, t] of [[-21, 4, 1.4], [22.5, 5, 1.2], [9, -12, 1.3], [-8, -11.5, 1.1]]) arbuste(c, x, z, t);
}

// ---------- Les annexes : outils ----------

const VITRAIL = [0x8a2f3a, 0x2f4f8a, 0xb8902f, 0x3f7a4a, 0x6a3f7a, 0xa85a2a];
const CLOCHE = new THREE.LatheGeometry([[0.02, 1.0], [0.3, 0.98], [0.36, 0.8], [0.38, 0.45], [0.48, 0.12], [0.58, 0.0], [0.5, 0.02]].map(([r, y]) => new THREE.Vector2(r, y)), 10);

/** Une annexe posée en (ox, oz) de la carte : ses chantiers prennent ce repère, obstacles et lumières aussi. */
function annexe(ox, oz, couches, fn) {
  const avant = [K.OX, K.OZ];
  K.OX = ox;
  K.OZ = oz;
  imbriquer([K.b.c, ...couches], { x: ox, z: oz }, fn);
  [K.OX, K.OZ] = avant;
}

/** La zone d'une annexe : le chantier permanent et une couche qui s'efface (boîte en coordonnées de l'annexe). */
function zoneAnnexe(nom, ox, oz, x1, x2, z1, z2, haut) {
  return { b: K.b.c, h: K.b.couche(nom, { x: ox + (x1 + x2) / 2, z: oz + (z1 + z2) / 2, l: x2 - x1, p: z2 - z1 }, Y, haut) };
}

/** Un pignon (triangle de mur en bout de comble, dans le plan du mur). */
function pignon(c, mat, coul, u, v1, v2, y0, hf, axe = "x", ep = 0.4) {
  const vc = (v1 + v2) / 2;
  const P = (uu, y, v) => (axe === "x" ? [uu, y, v] : [v, y, uu]);
  const L = [];
  for (const s of [-1, 1]) {
    const uu = u + (s * ep) / 2;
    L.push({ pts: [P(uu, y0, v1), P(uu, y0, v2), P(uu, y0 + hf, vc)], dehors: axe === "x" ? [s, 0, 0] : [0, 0, s] });
  }
  c.poser(facettes(L), mat, coul, {}, { nuance: 0.02 });
}

/** Un toit d'annexe sur le rectangle des murs : croupes ou pignons aux deux bouts (le long de l'axe). */
function toit(Z, o) {
  const d = o.debord ?? 0.4;
  const axe = o.axe ?? "x";
  const [w1, w2, wv1, wv2] = axe === "z" ? [o.z1, o.z2, o.x1, o.x2] : [o.x1, o.x2, o.z1, o.z2];
  const [u1, u2, v1, v2] = [w1 - d, w2 + d, wv1 - d, wv2 + d];
  const demi = (v2 - v1) / 2;
  const ins = o.inset ?? demi * 0.85;
  const croupes = o.croupes ?? [false, false];
  comble(Z.h, { u1, u2, v1, v2, y0: o.y0, hf: o.hf, f1: croupes[0] ? u1 + ins : u1, f2: croupes[1] ? u2 - ins : u2, axe, epis: o.epis ?? false, crete: o.crete });
  const hp = o.hf * ((demi - d) / demi) + (o.hf * d) / demi - 0.05;
  for (const [i, w] of [[0, w1], [1, w2]]) {
    if (croupes[i] || o.pignons === false || o.pignons?.[i] === false) continue;
    pignon(Z.h, o.matPignon ?? K.M.tuffeau, o.coulPignon ?? C.tuffeau, w, wv1, wv2, o.y0 + 0.05, hp, axe, o.ep ?? 0.45);
  }
}

/** Les points d'un arc (plein cintre ou arc brisé) au-dessus de yb, de gauche à droite. */
function arcPts(l, yb, forme, n = 6) {
  const pts = [];
  if (forme === "cintre") {
    for (let i = 0; i <= n; i++) {
      const a = Math.PI - (i / n) * Math.PI;
      pts.push([(Math.cos(a) * l) / 2, yb + (Math.sin(a) * l) / 2]);
    }
  } else {
    const m = n / 2;
    for (let i = 0; i <= m; i++) {
      const a = (i / m) * (Math.PI / 3);
      pts.push([l / 2 - Math.cos(a) * l, yb + Math.sin(a) * l]);
    }
    for (let i = m - 1; i >= 0; i--) {
      const a = (i / m) * (Math.PI / 3);
      pts.push([-(l / 2 - Math.cos(a) * l), yb + Math.sin(a) * l]);
    }
  }
  return pts;
}

/** Demi-largeur libre d'un arc à la hauteur y. */
function arcLargeur(l, yb, forme, y) {
  const h = y - yb;
  if (h <= 0) return l / 2;
  if (forme === "cintre") return Math.sqrt(Math.max(0, (l / 2) ** 2 - h * h));
  return Math.max(0, Math.sqrt(Math.max(0, l * l - h * h)) - l / 2);
}

/**
 * Une baie cintrée ou en arc brisé (repère du mur, extérieur côté -z) : écoinçons maçonnés, intrados, chambranle,
 * appui ; vitrail (morceaux de couleur) ou petits bois et carreaux, la plupart cassés.
 */
function baieG(Z, o) {
  const M = K.M;
  const { l, bas, haut, ep, forme = "cintre" } = o;
  const rise = forme === "cintre" ? l / 2 : 0.866 * l;
  const yb = haut - rise;
  const e = -ep / 2;
  const pts = arcPts(l, yb, forme);
  const mi = Math.floor(pts.length / 2);
  const faces = [];
  for (const z of [e, -e]) {
    const sz = z < 0 ? -1 : 1;
    faces.push({ pts: [[-l / 2, haut, z], ...pts.slice(0, mi + 1).map(([x, y]) => [x, y, z])], dehors: [0, 0, sz] });
    faces.push({ pts: [[l / 2, haut, z], ...pts.slice(mi).map(([x, y]) => [x, y, z])], dehors: [0, 0, sz] });
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const [xa, ya] = pts[i];
    const [xb, yb2] = pts[i + 1];
    faces.push({ pts: [[xa, ya, e], [xb, yb2, e], [xb, yb2, -e], [xa, ya, -e]], dehors: [-(xa + xb) / 2, yb - (ya + yb2) / 2, 0] });
  }
  ch(Z, yb + rise / 2).poser(facettes(faces), o.matMur ?? M.tuffeau, o.couleurMur ?? C.tuffeau, {}, { nuance: 0.02 });
  // chambranle de pierre, arc en claveaux, appui
  const cc = C.encadrement;
  pv(Z, -l / 2 - 0.17, bas, e - 0.06, -l / 2, yb, e + 0.04, cc, M.tuffeau);
  pv(Z, l / 2, bas, e - 0.06, l / 2 + 0.17, yb, e + 0.04, cc, M.tuffeau);
  for (let i = 0; i < pts.length - 1; i++) {
    const p = pts[i];
    const q = pts[i + 1];
    const pousse = (x, y) => {
      const dx = x;
      const dy = y - yb;
      const n = Math.hypot(dx, dy) || 1;
      return [x + (dx / n) * 0.09, y + (dy / n) * 0.09, e - 0.01];
    };
    ch(Z, (p[1] + q[1]) / 2).poutre(pousse(...p), pousse(...q), 0.17, cc, M.tuffeau);
  }
  if (bas > 0.25) pv(Z, -l / 2 - 0.22, bas - 0.12, e - 0.14, l / 2 + 0.22, bas, e + 0.05, cc, M.tuffeau);
  // vitrage
  const bris = o.bris ?? K.bris;
  const zv = 0;
  const nx = o.vitrail ? Math.max(2, Math.round(l / 0.45)) : Math.max(2, Math.round(l / 0.5));
  const dy = o.vitrail ? 0.55 : 0.6;
  for (let y = bas; y < haut - 0.05; y += dy) {
    const y2 = Math.min(haut, y + dy);
    const hw = arcLargeur(l, yb, forme, y2);
    if (hw < 0.08) continue;
    for (let i = 0; i < nx; i++) {
      const x1 = -l / 2 + (i * l) / nx;
      const x2 = x1 + l / nx;
      if (x1 < -hw - 0.01 || x2 > hw + 0.01) continue;
      if (Z.b.hasard() < bris) continue;
      if (o.vitrail) pv(Z, x1 + 0.02, y + 0.02, zv - 0.01, x2 - 0.02, y2 - 0.02, zv + 0.01, VITRAIL[Math.floor(Z.b.hasard() * VITRAIL.length)], M.mat, { crasse: false, nuance: 0.06 });
      else pv(Z, x1 + 0.02, y + 0.02, zv - 0.005, x2 - 0.02, y2 - 0.02, zv + 0.005, 0xffffff, M.verre, { crasse: false, nuance: 0 });
    }
    // plombs ou petits bois horizontaux
    pv(Z, -hw, y2 - 0.02, zv - 0.025, hw, y2 + 0.02, zv + 0.025, o.vitrail ? 0x2a2a2a : 0xd8d2c4, M.mat, { crasse: false });
  }
  for (let i = 1; i < nx; i++) {
    const x = -l / 2 + (i * l) / nx;
    const ht = yb + (forme === "cintre" ? Math.sqrt(Math.max(0, (l / 2) ** 2 - x * x)) : Math.sqrt(Math.max(0, l * l - (l / 2 + Math.abs(x)) ** 2)));
    pv(Z, x - 0.02, bas, zv - 0.025, x + 0.02, ht, zv + 0.025, o.vitrail ? 0x2a2a2a : 0xd8d2c4, M.mat, { crasse: false });
  }
}

/** Une roue de bois cerclée (dans le plan yz : l'essieu est selon x). */
function roue(c, x, y, z, r, pose = {}) {
  const M = K.M;
  c.repere({ x, y, z, ...pose }, () =>
    c.repere({ ry: Math.PI / 2 }, () => {
      c.poser(new THREE.TorusGeometry(r, 0.045, 4, 12), M.mat, 0x4a3b2c, {}, { crasse: false });
      for (let i = 0; i < 8; i++) {
        if (c.hasard() < 0.15) continue;
        const a = (i / 8) * Math.PI * 2;
        c.poutre([0, 0, 0], [Math.cos(a) * r, Math.sin(a) * r, 0], 0.04, C.bois, M.mat, { crasse: false });
      }
      c.poser(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 7), M.tole, 0x3a3833, { rx: Math.PI / 2 }, { crasse: false });
    }),
  );
}

function chaiseBois(c, x, z, ry, renversee = false) {
  const M = K.M;
  c.repere({ x, y: renversee ? 0.22 : 0, z, ry, rz: renversee ? Math.PI / 2 : 0 }, () => {
    c.boite(0.44, 0.05, 0.42, C.bois, { y: 0.45 }, M.mat);
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.boite(0.05, 0.45, 0.05, C.bois, { x: a * 0.18, y: 0.22, z: b * 0.17 }, M.mat);
    c.boite(0.42, 0.06, 0.04, C.bois, { y: 0.88, z: -0.19 }, M.mat);
    for (const s of [-1, 1]) c.boite(0.05, 0.45, 0.04, C.bois, { x: s * 0.18, y: 0.68, z: -0.19 }, M.mat);
  });
}

/** Une petite flamme (lueur) et sa lumière. */
function flamme(c, x, y, z, e = 0.12, teinte = 0xffa040) {
  c.poser(POINTE, K.M.lueur, teinte, { x, y: y + e * 0.8, z, e: [e * 0.5, e * 1.6, e * 0.5] }, { crasse: false, nuance: 0 });
}

// ---------- La chapelle castrale (carte « parc ») ----------

function chapelle() {
  const ox = -32;
  const oz = 2;
  const Z = zoneAnnexe("chapelle : voûte, clocheton", ox, oz, -4.7, 4.7, -10.6, 6.6, 12);
  annexe(ox, oz, [Z.h], () => {
    const M = K.M;
    const c = Z.b;
    const u = K.u;
    const H = 6.5;
    const vit = (at, extra = {}) => ({ at, l: 1.0, bas: 1.7, haut: 5.1, type: "baie", forme: "ogive", vitrail: true, ...extra });
    // l'abside, demi-polygone au nord
    const r = 4;
    const n = 5;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const p = Math.PI + (i / n) * Math.PI;
      pts.push([r * Math.cos(p), -6 + r * Math.sin(p)]);
    }
    for (let i = 0; i < n; i++) {
      const L = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      murZ(Z, pts[i], pts[i + 1], { H, exterieur: true, ouv: i === 1 || i === 3 ? [{ ...vit(0), u: L / 2, l: 0.8 }] : [] });
    }
    murZ(Z, [4, -6], [4, 6], { H, exterieur: true, ouv: [vit(-3), vit(0.5), vit(4)] });
    murZ(Z, [4, 6], [-4, 6], { H, exterieur: true, ouv: [{ at: 0, l: 1.8, bas: 0, haut: 3.4, type: "porte", vantail: "entrouvert", honneur: true }, { at: 0, l: 1.2, bas: 4.4, haut: 5.95, type: "baie", forme: "cintre", vitrail: true }] });
    murZ(Z, [-4, 6], [-4, -6], { H, exterieur: true, ouv: [vit(4), vit(0.5), vit(-3)] });
    // contreforts
    for (const s of [-1, 1]) {
      for (const zz of [-1.3, 2.3]) {
        pv(Z, s * 4.3, 0, zz - 0.3, s * 5.0, 3.6, zz + 0.3, C.tuffeau, M.tuffeau);
        pv(Z, s * 4.3, 3.6, zz - 0.3, s * 4.7, 5.6, zz + 0.3, C.tuffeau, M.tuffeau);
        obs(s * 4.3, zz - 0.3, s * 5.0, zz - 0.3);
        obs(s * 5.0, zz - 0.3, s * 5.0, zz + 0.3);
      }
    }
    // la nef, l'abside, le clocheton du pignon (sa cloche est tombée)
    toit(Z, { x1: -4, x2: 4, z1: -6, z2: 6, y0: H - 0.05, hf: 4.2, axe: "z", debord: 0.4 });
    cone(Z.h, 0, H + 0.3, -6, r - 0.1, 3.4, (i) => Math.sin(((i + 0.5) / 14) * Math.PI * 2) > 0.05);
    const yf = H - 0.05 + 4.2;
    for (const s of [-1, 1]) Z.h.pave(s * 0.45, yf - 1.6, 5.8, s * 0.75, yf + 0.9, 6.2, C.encadrement, M.tuffeau);
    Z.h.pave(-0.85, yf + 0.9, 5.75, 0.85, yf + 1.1, 6.25, C.encadrement, M.tuffeau);
    Z.h.poutre([-0.45, yf + 0.55, 6], [0.45, yf + 0.55, 6], 0.12, C.charpente, M.mat);
    Z.h.boite(0.08, 0.9, 0.08, C.plomb, { y: yf + 1.6, z: 6 }, M.mat);
    Z.h.boite(0.5, 0.08, 0.08, C.plomb, { y: yf + 1.75, z: 6 }, M.mat);
    // le sol, les bancs, l'autel
    c.pave(-3.7, -0.02, -6, 3.7, 0.025, 5.7, 0xd8d0c2, M.damier, { crasse: false });
    c.poser(new THREE.CylinderGeometry(3.7, 3.7, 0.04, 10, 1, false, Math.PI / 2, Math.PI), M.mat, 0xc9c1b2, { y: 0.0, z: -6 }, { crasse: false });
    for (let i = 0; i < 5; i++) {
      for (const s of [-1, 1]) {
        const zz = -3.4 + i * 1.5;
        const etat = c.hasard();
        if (etat < 0.12 * u) continue;
        const renv = etat > 1 - 0.45 * u;
        c.repere({ x: s * 1.95 + c.entre(-0.15, 0.15), z: zz, ry: c.entre(-0.12, 0.12) + (renv ? c.entre(-0.6, 0.6) : 0), ...(renv ? { y: 0.2, rx: -Math.PI / 2 } : {}) }, () => {
          c.boite(2.6, 0.06, 0.42, C.bois, { y: 0.45 }, M.mat);
          c.boite(2.6, 0.5, 0.05, C.bois, { y: 0.78, z: 0.23 }, M.mat);
          for (const t of [-1, 1]) c.boite(0.06, 0.9, 0.5, C.bois, { x: t * 1.28, y: 0.45, z: 0.02 }, M.mat);
        });
      }
    }
    c.pave(-1.0, 0, -7.9, 1.0, 1.0, -6.9, C.marbre, M.satine);
    c.pave(-1.06, 0.98, -7.96, 1.06, 1.03, -6.84, 0xe6e0d2, M.mat, { crasse: false });
    c.pave(-0.9, 0.5, -6.85, 0.9, 1.0, -6.82, 0xe6e0d2, M.mat, { crasse: false });
    for (const x of [-0.75, -0.3, 0.3, 0.75]) {
      c.tube([x, 1.03, -7.5], [x, 1.35, -7.5], 0.035, C.dore, M.metal, 6, { crasse: false });
      if (c.hasard() < 0.7) {
        c.tube([x, 1.35, -7.5], [x, 1.55, -7.5], 0.025, 0xeee6d2, M.mat, 5, { crasse: false });
        flamme(c, x, 1.55, -7.5, 0.06);
      }
    }
    c.boite(0.06, 0.7, 0.06, C.dore, { y: 1.4, z: -7.8 }, M.metal);
    c.boite(0.36, 0.06, 0.06, C.dore, { y: 1.55, z: -7.8 }, M.metal);
    obs(-1.0, -6.9, 1.0, -6.9, "autel");
    lum(0, 1.6, -7.2, 0xffc070, 3, 8, "cierges de l'autel");
    // la cloche de bronze, tombée du clocheton avec son joug
    c.repere({ x: 0.9, y: 0.55, z: 4.2, rz: 1.45, ry: 0.5 }, () => c.poser(CLOCHE, M.metal, C.bronze, { y: -0.5, e: 1.05 }));
    c.poutre([-0.6, 0.15, 3.5], [1.7, 0.3, 4.9], 0.2, C.charpente, M.mat);
    gravats(c, 0.4, 4.4, 1.0, Math.round(5 + 6 * u), [C.tuffeau, C.ardoise, C.encadrement]);
    // les couleurs des vitraux projetées sur le dallage (le soleil vient de l'est)
    for (const zz of [-3, 0.5, 4]) {
      for (let k = 0; k < 4; k++) c.boite(0.32, 0.005, 0.42, VITRAIL[(k + Math.round(zz)) % VITRAIL.length] | 0x202020, { x: 1.4 + (k % 2) * 0.36, y: 0.04, z: zz - 0.25 + Math.floor(k / 2) * 0.46, ry: 0.1 }, M.lueur, { crasse: false, nuance: 0 });
    }
    rai(c, [6, 5.0, 0.5], [1.6, 0.05, 0.5], 0.9);
    debris(c, -3.5, -6, 3.5, 5.5, Math.round(6 + 10 * u), [C.tuffeau, 0xd9d2c0, C.encadrement]);
    jonchee(c, -1.5, 3.5, 1.5, 5.7, Math.round(8 + 12 * u));
    semerTouffes(c, -0.8, 4.6, 0.8, 5.6, 5, PALETTE.herbeSeche, 0.02);
    // lierre et herbes dehors
    lierre(c, -4.32, 0, 1.5, -Math.PI / 2, 3.5, 2.9, Math.round(6 + 8 * u));
    lierre(Z.h, -4.32, Y, 1.0, -Math.PI / 2, 2.6, 3.2, Math.round(4 + 6 * u));
    lierre(c, 2.4, 0, 6.32, 0, 1.6, 2.9, Math.round(4 + 6 * u));
    c.pave(-1.2, -0.01, 6.3, 1.2, 0.03, 9.5, C.gravier, M.mat, { crasse: false });
  });
}

// ---------- La maison du gardien (carte « parc ») ----------

function maisonGardien() {
  const ox = -11.75;
  const oz = 33.75;
  const Z = zoneAnnexe("maison du gardien : toit", ox, oz, -3.7, 3.7, -3.2, 3.2, 7);
  annexe(ox, oz, [Z.h], () => {
    const M = K.M;
    const c = Z.b;
    const H = 2.8;
    const mb = { H, ep: 0.45, mat: M.brique, couleur: C.brique, exterieur: true };
    const fen = (at, extra = {}) => ({ at, l: 0.9, bas: 0.95, haut: 2.05, type: "fenetre", meneau: false, larmier: false, ...extra });
    murZ(Z, [-3.25, -2.75], [3.25, -2.75], { ...mb, ouv: [fen(0.9, { l: 0.7 })] });
    murZ(Z, [3.25, -2.75], [3.25, 2.75], { ...mb, ouv: [{ at: 0.6, l: 1.0, bas: 0, haut: 2.2, type: "porte", vantail: "entrouvert" }] });
    murZ(Z, [3.25, 2.75], [-3.25, 2.75], { ...mb, ouv: [fen(1.5, { rideau: 0x7a6a4a }), fen(-1.5, { rideau: 0x7a6a4a })] });
    murZ(Z, [-3.25, 2.75], [-3.25, -2.75], { ...mb, ouv: [] });
    toit(Z, { x1: -3.25, x2: 3.25, z1: -2.75, z2: 2.75, y0: H - 0.05, hf: 2.3, axe: "x", debord: 0.35, matPignon: M.brique, coulPignon: C.brique });
    cheminee(Z.h, -2.7, 0.4, 3.2, 5.9, { l: 0.7, p: 0.6 });
    // le plancher, la table, le poêle, le lit, le râtelier, le buffet
    c.pave(-3.02, -0.02, -2.52, 3.02, 0.025, 2.52, 0xb89268, M.parquet, { crasse: false });
    c.pave(-0.7, 0.025, -0.6, 1.5, 0.035, 1.3, 0x7a4a3a, M.mat, { crasse: false });
    c.boite(1.4, 0.06, 0.85, C.bois, { x: 0.4, y: 0.76, z: 0.35 }, M.mat);
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.boite(0.06, 0.74, 0.06, C.bois, { x: 0.4 + a * 0.62, y: 0.37, z: 0.35 + b * 0.36 }, M.mat);
    chaiseBois(c, -0.55, 0.35, Math.PI / 2);
    chaiseBois(c, 0.6, 1.2, Math.PI + 0.3);
    c.boite(0.14, 0.04, 0.14, 0x2f2c27, { x: 0.6, y: 0.81, z: 0.2 }, M.tole);
    c.boite(0.1, 0.16, 0.1, 0xffffff, { x: 0.6, y: 0.91, z: 0.2 }, M.verre, { crasse: false });
    flamme(c, 0.6, 0.86, 0.2, 0.04, 0xffd27a);
    lum(0.6, 1.3, 0.2, 0xffd27a, 2.5, 6, "lampe à pétrole");
    // le poêle de fonte, son tuyau, son bois
    c.boite(0.6, 0.65, 0.5, 0x2b2a28, { x: -2.45, y: 0.45, z: 0.4 }, M.tole);
    c.boite(0.25, 0.18, 0.02, C.braise, { x: -2.15, y: 0.42, z: 0.4, ry: Math.PI / 2 }, M.mat, { crasse: false, nuance: 0 });
    c.tube([-2.5, 0.78, 0.4], [-2.5, 2.75, 0.4], 0.08, 0x2b2a28, M.tole, 7);
    for (let i = 0; i < 6; i++) c.tube([-2.9, 0.08 + (i % 3) * 0.14, -1.2 - Math.floor(i / 3) * 0.16], [-2.3, 0.08 + (i % 3) * 0.14, -1.25 - Math.floor(i / 3) * 0.16], 0.07, 0x6b5440, M.mat, 6);
    lum(-2.1, 0.6, 0.4, 0xff8a3d, 3.5, 6, "poêle du gardien");
    c.pave(1.1, 0, -2.5, 3.0, 0.45, -1.4, C.bois, M.mat);
    c.pave(1.15, 0.45, -2.45, 2.95, 0.6, -1.45, 0xd8d0bc, M.mat, { crasse: false });
    c.pave(1.3, 0.6, -2.4, 2.4, 0.66, -1.5, 0x5f6e4f, M.mat, { crasse: false });
    c.pave(2.45, 0.6, -2.35, 2.9, 0.72, -1.55, 0xe6e0d2, M.mat, { crasse: false });
    c.pave(-2.2, 1.2, -2.53, -1.0, 1.32, -2.45, C.bois, M.mat);
    for (const [x, y2] of [[-2.0, 1.7], [-1.6, 1.8], [-1.25, 1.55]]) c.tube([x + 0.1, 0.02, -2.15], [x, y2, -2.47], 0.03, C.bois, M.mat, 5);
    c.pave(-0.6, 0, 2.05, 0.6, 1.6, 2.52, 0x5e4632, M.mat);
    c.pave(-0.55, 0.9, 2.0, 0.55, 0.94, 2.05, 0x4e3a2b, M.mat);
    // dehors : la pile de bois, un banc, des herbes
    for (let i = 0; i < 8; i++) c.tube([-3.55, 0.08 + (i % 4) * 0.15, -1.6 + Math.floor(i / 4) * 0.16], [-3.55, 0.08 + (i % 4) * 0.15, 0.6 + Math.floor(i / 4) * 0.16], 0.075, 0x6b5440, M.mat, 6);
    banc(c, 4.0, 2.2, Math.PI / 2);
    touffes(c, [[3.6, -2.5], [-3.6, 2.6], [1.8, 3.1], [-2, 3.05], [3.5, 1.0]], PALETTE.herbeSeche);
    lierre(c, -3.5, 0, 2.0, -Math.PI / 2, 1.6, 2.4, Math.round(8 + 10 * K.u));
  });
}

// ---------- Les communs (carte « communs ») ----------

function communs() {
  const M = K.M;
  const c = K.b.c;
  const u = K.u;
  const zN = zoneAnnexe("écuries, aile nord : logement du palefrenier", 0, 0, -17.5, 17.5, -18, -10.5, 10);
  const zW = zoneAnnexe("écuries, aile ouest : sellerie", 0, 0, -17.5, -10, -10.5, 6.5, 10);
  const zR = zoneAnnexe("remise à calèches", 0, 0, 9, 17.5, -10.5, 5.5, 10);
  const zP = zoneAnnexe("pigeonnier", 0, 0, -17.5, -10.5, 9.5, 16.5, 12);
  const zOr = zoneAnnexe("orangerie", 0, 0, 10, 28.5, 10.5, 19.5, 8.5);
  annexe(0, 0, [zN.h, zW.h, zR.h, zP.h, zOr.h], () => {
    // la prairie, la cour pavée, l'allée vers le parc
    const tons = [PALETTE.herbeSeche, 0x8f9d58, 0x87985a, 0x9aa465];
    for (let x = -35; x < 35; x += 8.75) for (let z = -27.5; z < 27.5; z += 6.875) c.pave(x, -0.015, z, x + 8.75, 0.008, z + 6.875, tons[Math.floor(c.hasard() * 4)], M.mat, { crasse: false, nuance: 0.04 });
    for (let x = -9.75; x < 8.75; x += 4.625) for (let z = -10.25; z < 10.5; z += 5.2) c.pave(x, -0.01, z, Math.min(8.75, x + 4.625), 0.03, Math.min(10.5, z + 5.2), C.pave, M.pave, { crasse: false, nuance: 0.05 });
    for (let z = 10.5; z < 27.5; z += 4.25) c.pave(-2.2, -0.01, z, 2.2, 0.03, z + 4.25, C.gravier, M.mat, { crasse: false, nuance: 0.05 });
    semerTouffes(c, -9.5, -10, 8.5, 10.3, Math.round(25 + 30 * u), PALETTE.herbe, 0.03);
    semerTouffes(c, -33, -26, 33, 26, Math.round(30 + 30 * u), PALETTE.herbeSeche, 0.01);
    mousse(c, -4, 0.03, 6, 2.5, 6, PALETTE.mousse);
    mousse(c, 5, 0.03, -7.5, 2.0, 5, PALETTE.mousse);
    ecuries(zN, zW);
    remise(zR);
    pigeonnier(zP, -14, 13);
    orangerie(zOr);
    cour();
    // autour : quelques arbres, des buissons
    arbre(c, -27, -22, 11, "feuillu");
    arbre(c, 27, -21.5, 12, "feuillu");
    arbre(c, -28, 21, 9, "bouleau");
    arbre(c, 31, 24, 8, "mort");
    for (const [x, z, t] of [[-21, -12, 1.3], [20, 7, 1.2], [-8, 14, 1.4], [8, 22, 1.1], [-22, 4, 1.5]]) arbuste(c, x, z, t);
  });
}

function ecuries(zN, zW) {
  const M = K.M;
  const c = K.b.c;
  const u = K.u;
  const H = 5.6;
  const mb = { H, ep: 0.5, mat: M.brique, couleur: C.brique };
  const fb = (at, l = 0.9) => ({ at, l, bas: 1.55, haut: 2.55, type: "fenetre", meneau: false });
  const et = (at) => ({ at, l: 0.75, bas: 3.75, haut: 4.75, type: "fenetre", meneau: false, larmier: false });
  const pt = (at, l = 1.3, v = "entrouvert") => ({ at, l, bas: 0, haut: 2.6, type: "porte", vantail: v });
  // aile nord : les stalles
  murZ(zN, [-17, -17.5], [17, -17.5], { ...mb, exterieur: true, ouv: [fb(-13), fb(-7), fb(-1), fb(5), fb(11), et(-10), et(2), et(14)] });
  murZ(zN, [17, -17.5], [17, -10.5], { ...mb, exterieur: true, ouv: [fb(-14), et(-14)] });
  murZ(zN, [17, -10.5], [9, -10.5], { ...mb, ouv: [pt(13, 1.2)] });
  murZ(zN, [9, -10.5], [-10, -10.5], { ...mb, exterieur: true, ouv: [pt(-6.5), pt(0, 1.4, "ouvert"), pt(6), fb(-3.2), fb(3)] });
  murZ(zN, [-10, -10.5], [-17, -10.5], { ...mb, ouv: [pt(-13.5, 1.2, "ouvert")] });
  murZ(zN, [-17, -10.5], [-17, -17.5], { ...mb, exterieur: true, ouv: [fb(-14)] });
  // aile ouest : stalles au nord, sellerie au sud
  murZ(zW, [-17, 6], [-17, -10.5], { ...mb, exterieur: true, ouv: [fb(-6), fb(2), et(-4), et(3)] });
  murZ(zW, [-10, -10.5], [-10, 6], { ...mb, exterieur: true, ouv: [pt(-6.2), pt(2.6, 1.2, "tombe"), fb(-3.6), fb(4.8, 0.8)] });
  murZ(zW, [-10, 6], [-17, 6], { ...mb, exterieur: true, ouv: [fb(-13.5)] });
  murZ(zW, [-17, -2], [-10, -2], { ...mb, ep: 0.35, ouv: [pt(-13.5, 1.1, "ouvert")] });
  // toits, lucarnes à fronton, cheminée du logement
  toit(zN, { x1: -17, x2: 17, z1: -17.5, z2: -10.5, y0: H - 0.05, hf: 3.6, axe: "x", croupes: [true, true], inset: 3.2, epis: true });
  toit(zW, { x1: -17, x2: -10, z1: -10.5, z2: 6, y0: H - 0.05, hf: 3.6, axe: "z", croupes: [false, true], inset: 3.2, pignons: false });
  for (const x of [-3.2, 3]) rep(zN, { x, z: -10.5, ry: Math.PI }, () => lucarne(zN, H, { l: 0.9, h: 1.3 }));
  rep(zW, { x: -10, z: -1, ry: -Math.PI / 2 }, () => lucarne(zW, H, { l: 0.9, h: 1.3 }));
  cheminee(zN.h, -12, -14.2, 7.0, 10.2, { l: 1.0, p: 0.7 });
  zN.h.pave(-17, 3.2, -17.5, 17, 3.42, -10.5, 0x7a6a55, M.mat, { crasse: false });
  zW.h.pave(-17, 3.2, -10.5, -10, 3.42, 6, 0x7a6a55, M.mat, { crasse: false });
  // sols
  c.pave(-16.75, -0.02, -17.25, 16.75, 0.025, -10.75, C.pave, M.pave, { crasse: false });
  c.pave(-16.75, -0.02, -10.75, -10.25, 0.025, -2.2, C.pave, M.pave, { crasse: false });
  c.pave(-16.75, -0.02, -1.8, -10.25, 0.025, 5.75, 0xa58560, M.parquet, { crasse: false });
  // les stalles : bat-flancs, poteaux, mangeoires, râteliers, foin pourri
  const stalle = (x0, z0, axe) => {
    const P = (a, b) => (axe === "z" ? [x0 + a, z0 + b] : [x0 + b, z0 + a]);
    const [mx, mz] = P(0.95, 0.25);
    const [rx2, rz2] = P(0.95, 0.12);
    if (axe === "z") {
      c.pave(x0 + 0.15, 0.75, z0, x0 + 1.95, 1.0, z0 + 0.45, 0x8f8a80, M.mat);
      c.boite(1.7, 0.7, 0.06, C.bois, { x: rx2, y: 1.7, z: rz2 + 0.15, rx: 0.4 }, M.mat);
    } else {
      c.pave(x0, 0.75, z0 + 0.15, x0 + 0.45, 1.0, z0 + 1.95, 0x8f8a80, M.mat);
      c.boite(0.06, 0.7, 1.7, C.bois, { x: rx2 + 0.15, y: 1.7, z: rz2, rz: -0.4 }, M.mat);
    }
    if (c.hasard() < 0.6) c.poser(ICO, M.mat, c.hasard() < 0.5 ? 0x8a7a4a : 0x6f6440, { x: mx + c.entre(-0.3, 0.3) + (axe === "z" ? 0 : 1.2), y: 0.12, z: mz + (axe === "z" ? 1.2 : c.entre(-0.3, 0.3)), ry: c.hasard() * 3, e: [0.75, 0.2, 0.6] }, { crasse: false, nuance: 0.08 });
  };
  const flanc = (x, z, axe) => {
    const casse = c.hasard() < 0.3 * u;
    if (axe === "z") {
      if (!casse) c.pave(x - 0.05, 0, z, x + 0.05, 1.5, z + 2.5, C.bois, M.mat);
      else c.boite(0.08, 1.4, 2.4, C.bois, { x: x + 0.5, y: 0.3, z: z + 1.3, rz: 1.2 }, M.mat);
      c.pave(x - 0.09, 0, z + 2.4, x + 0.09, 2.2, z + 2.58, C.bois, M.mat);
    } else {
      if (!casse) c.pave(x, 0, z - 0.05, x + 2.5, 1.5, z + 0.05, C.bois, M.mat);
      else c.boite(2.4, 1.4, 0.08, C.bois, { x: x + 1.3, y: 0.3, z: z + 0.5, rx: 1.2 }, M.mat);
      c.pave(x + 2.4, 0, z - 0.09, x + 2.58, 2.2, z + 0.09, C.bois, M.mat);
    }
  };
  for (let k = 0; k < 16; k++) {
    const x0 = -16.75 + k * 2.1;
    if (x0 + 2.1 > 16.8) break;
    stalle(x0, -17.25, "z");
    if (k > 0) flanc(x0, -17.25, "z");
  }
  for (let k = 0; k < 4; k++) {
    const z0 = -10.25 + k * 2.0;
    if (z0 + 2 > -2.2) break;
    stalle(-16.75, z0, "x");
    if (k > 0) flanc(-16.75, z0, "x");
  }
  // l'échelle du grenier, cassée (l'étage est inaccessible), brouette, seaux, fourche
  for (const s of [-1, 1]) c.poutre([8.0 + s * 0.25, 0, -11.2], [8.0 + s * 0.25, 3.15, -12.4], 0.07, C.bois, M.mat);
  for (let i = 1; i < 9; i++) if (i !== 4 && i !== 6) c.poutre([7.75, i * 0.35, -11.2 - i * 0.133], [8.25, i * 0.35, -11.2 - i * 0.133], 0.04, C.bois, M.mat);
  c.repere({ x: 2.5, z: -12.6, ry: 0.7 }, () => {
    c.boite(0.6, 0.3, 0.9, 0x5a5a55, { y: 0.45 }, M.tole);
    roue(c, 0, 0.2, 0.6, 0.2);
    c.poutre([-0.25, 0.4, -0.4], [-0.3, 0.55, -1.2], 0.05, C.bois, M.mat);
    c.poutre([0.25, 0.4, -0.4], [0.3, 0.55, -1.2], 0.05, C.bois, M.mat);
  });
  for (const [x, z] of [[-5.5, -11.4], [-5.0, -11.7]]) c.poser(new THREE.CylinderGeometry(0.17, 0.14, 0.3, 8), M.tole, 0x6a6a64, { x, y: 0.15, z });
  c.tube([-1.2, 0.02, -11.0], [-1.0, 1.6, -10.8], 0.025, C.bois, M.mat, 5);
  jonchee(c, -16, -16.5, 16, -11, Math.round(25 + 30 * u), [0x9c8a50, 0x8a7a4a, 0xb0a060, 0x6f6440]);
  // la sellerie : selles sur leurs porte-selles, brides au mur, coffres, table et lanterne
  for (const [i, zz] of [-0.9, 0.6, 2.1, 3.6].entries()) {
    c.poutre([-16.75, 1.15, zz], [-16.2, 1.15, zz], 0.08, C.bois, M.mat);
    if (i === 2 && u > 0.4) {
      c.repere({ x: -15.4, y: 0.12, z: zz + 0.3, ry: 0.8, rz: 0.4 }, () => {
        c.boite(0.5, 0.16, 0.6, C.cuir, {}, M.satine);
        c.poser(ICO, M.satine, C.cuir, { y: 0.1, e: [0.27, 0.12, 0.33] });
      });
      continue;
    }
    c.boite(0.55, 0.16, 0.5, C.cuir, { x: -16.35, y: 1.3, z: zz }, M.satine);
    c.poser(ICO, M.satine, C.cuir, { x: -16.35, y: 1.42, z: zz, e: [0.32, 0.12, 0.27] });
    c.boite(0.02, 0.5, 0.12, 0x4a2e1c, { x: -16.08, y: 1.05, z: zz + 0.2 }, M.satine);
  }
  for (let i = 0; i < 6; i++) {
    const x = -16.2 + i * 0.95;
    c.boite(0.04, 0.04, 0.12, 0x3a3833, { x, y: 2.0, z: 5.68 }, M.tole);
    for (const s of [-1, 1]) c.boite(0.03, 0.8, 0.02, 0x4a2e1c, { x: x + s * 0.1, y: 1.6, z: 5.7, rz: s * 0.08 }, M.satine);
    c.boite(0.25, 0.03, 0.02, 0x4a2e1c, { x, y: 1.22, z: 5.7 }, M.satine);
  }
  for (const [x, z, ry] of [[-15.6, -1.25, 0.05], [-13.9, -1.3, -0.08]]) {
    c.boite(1.0, 0.55, 0.55, 0x5e4632, { x, y: 0.28, z, ry }, M.mat);
    c.boite(1.02, 0.08, 0.57, 0x4e3a2b, { x, y: 0.62, z: z + 0.15, ry, rx: -0.5 }, M.mat);
  }
  c.boite(1.2, 0.05, 0.7, C.bois, { x: -12.0, y: 0.8, z: 2.0 }, M.mat);
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.boite(0.05, 0.78, 0.05, C.bois, { x: -12.0 + a * 0.55, y: 0.39, z: 2.0 + b * 0.3 }, M.mat);
  c.boite(0.2, 0.3, 0.2, 0x2d2a25, { x: -11.8, y: 0.98, z: 1.9 }, M.tole);
  c.boite(0.14, 0.18, 0.14, 0xffc56a, { x: -11.8, y: 0.98, z: 1.9 }, M.mat, { crasse: false, nuance: 0 });
  lum(-11.8, 1.3, 1.9, 0xffc86a, 3, 8, "lanterne de la sellerie");
  chaiseBois(c, -12.9, 2.6, 1.2, true);
  // lierre sur les façades de la cour
  lierre(c, -10.27, 0, -8.5, Math.PI / 2, 2.0, 2.9, Math.round(8 + 14 * u));
  lierre(c, 4.5, 0, -10.23, 0, 2.5, 2.9, Math.round(8 + 14 * u));
  lierre(zN.h, 4.5, Y, -10.23, 0, 2.0, 2.2, Math.round(4 + 8 * u));
}

function remise(Z) {
  const M = K.M;
  const c = Z.b;
  const u = K.u;
  const H = 5.6;
  const mb = { H, ep: 0.5, mat: M.brique, couleur: C.brique };
  murZ(Z, [9, 5], [9, -10.5], { ...mb, exterieur: true, ouv: [{ at: -6.5, l: 3.4, bas: 0, haut: 3.4, type: "porte", vantail: "ouvert" }, { at: 0.5, l: 3.4, bas: 0, haut: 3.4, type: "porte", vantail: "arrache" }, { at: -2.9, l: 0.75, bas: 3.85, haut: 4.75, type: "fenetre", meneau: false, larmier: false }] });
  murZ(Z, [17, -10.5], [17, 5], { ...mb, exterieur: true, ouv: [{ at: -4, l: 0.9, bas: 1.6, haut: 2.6, type: "fenetre", meneau: false }, { at: 1.5, l: 0.9, bas: 1.6, haut: 2.6, type: "fenetre", meneau: false }] });
  murZ(Z, [17, 5], [9, 5], { ...mb, exterieur: true, ouv: [{ at: 13, l: 0.9, bas: 1.6, haut: 2.6, type: "fenetre", meneau: false }] });
  toit(Z, { x1: 9, x2: 17, z1: -10.5, z2: 5, y0: H - 0.05, hf: 3.6, axe: "z", croupes: [false, true], inset: 3.2, pignons: false });
  rep(Z, { x: 9, z: -2.9, ry: Math.PI / 2 }, () => lucarne(Z, H, { l: 0.9, h: 1.3 }));
  Z.h.pave(9, 3.6, -10.5, 17, 3.82, 5, 0x7a6a55, M.mat, { crasse: false });
  c.pave(9.25, -0.02, -10.25, 16.75, 0.025, 4.75, C.pave, M.pave, { crasse: false });
  // le battant arraché, couché dans la cour
  c.boite(1.65, 0.08, 3.3, C.boisPorte, { x: 7.0, y: 0.05, z: 1.8, ry: 0.35 }, M.mat, { nuance: 0.06 });
  // la calèche aux roues effondrées
  c.repere({ x: 13.2, z: -5.6, ry: 0.15 }, () => {
    c.repere({ y: -0.12, rx: 0.16 }, () => {
      c.boite(1.3, 0.7, 2.1, 0x2c2826, { y: 1.05, z: 0.3 }, M.satine);
      c.boite(1.2, 0.1, 0.8, C.velours, { y: 1.42, z: 0.6 }, M.mat);
      c.boite(1.32, 0.9, 0.08, 0x2a2622, { y: 1.85, z: 1.25, rx: -0.45 }, M.satine);
      c.boite(1.0, 0.1, 0.5, 0x2c2826, { y: 1.75, z: -0.95 }, M.satine);
      c.boite(1.1, 0.06, 0.6, 0x2c2826, { y: 1.25, z: -1.25, rx: 0.5 }, M.satine);
      for (const s of [-1, 1]) c.boite(0.14, 0.24, 0.14, C.dore, { x: s * 0.6, y: 1.65, z: -0.75 }, M.metal);
    });
    for (const s of [-1, 1]) roue(c, s * 0.78, 0.62, 1.0, 0.62);
    roue(c, -0.7, 0.07, -1.4, 0.45, { rz: Math.PI / 2 });
    roue(c, 0.85, 0.35, -1.1, 0.45, { rz: -0.9 });
    for (const s of [-1, 1]) c.poutre([s * 0.45, 0.3, -1.4], [s * 0.6, 0.05, -3.4], 0.07, C.bois, M.mat);
  });
  // la limousine « autonome », à moitié sous sa bâche ; son écran croit encore aller au golf
  const lx = 13.0;
  const lz = 1.0;
  c.repere({ x: lx, z: lz, ry: -0.05 }, () => {
    c.boite(2.0, 0.6, 6.0, 0x23272a, { y: 0.6 }, M.satine);
    c.boite(1.8, 0.55, 3.4, 0xffffff, { y: 1.17, z: 0.3 }, M.verre, { crasse: false });
    c.boite(1.76, 0.06, 3.2, 0x23272a, { y: 1.47, z: 0.3 }, M.satine);
    c.boite(2.02, 0.06, 6.02, 0xc9c6bd, { y: 0.45 }, M.metal);
    for (const [a, b] of [[-1, -2.0], [1, -2.0], [-1, 2.1], [1, 2.1]]) c.poser(new THREE.CylinderGeometry(0.38, 0.38, 0.26, 10), M.mat, 0x24221f, { x: a * 0.95, y: 0.38, z: b, rz: Math.PI / 2 });
    c.poser(new THREE.CylinderGeometry(0.17, 0.2, 0.18, 10), M.satine, PALETTE.abondanceCanard, { y: 1.58, z: -0.8 });
    c.poser(new THREE.CylinderGeometry(0.205, 0.205, 0.05, 10), M.satine, PALETTE.abondanceRouge, { y: 1.55, z: -0.8 });
    ecran(c, 0.5, 0.25, 2 / 3, 1, { y: 1.1, z: -1.15, rx: -1.0, ry: Math.PI });
    // la bâche : sur l'arrière, et un pan tombé
    c.boite(2.3, 0.04, 3.4, 0x5d6650, { y: 1.55, z: 1.5 }, M.mat, { crasse: false });
    for (const s of [-1, 1]) c.boite(0.04, 1.2, 3.4, 0x5d6650, { x: s * 1.13, y: 0.95, z: 1.5, rz: s * 0.12 }, M.mat, { crasse: false });
    c.boite(1.9, 0.03, 1.6, 0x56604a, { x: -1.7, y: 0.03, z: -1.6, ry: 0.4 }, M.mat, { crasse: false });
  });
  lum(lx, 1.3, lz - 1.3, 0x8fd0e0, 1.2, 4, "écran du tableau de bord (« Destination : golf »)");
  // l'établi, les jerricans, les pneus
  c.pave(16.1, 0, -3.5, 16.75, 0.9, -0.5, C.bois, M.mat);
  for (const z of [-3.2, -2.6]) c.boite(0.3, 0.45, 0.18, 0x5f6e3f, { x: 15.6, y: 0.23, z }, M.tole);
  for (let i = 0; i < 3; i++) c.poser(new THREE.TorusGeometry(0.33, 0.12, 4, 10), M.mat, 0x24221f, { x: 16.2, y: 0.12 + i * 0.22, z: -8.8, rx: Math.PI / 2 });
  debris(c, 9.5, -10, 16.5, 4.5, Math.round(6 + 8 * u), [0x8f8a80, 0x6e6a63, C.bois]);
  lierre(c, 13.5, 0, 5.27, 0, 3.0, 2.9, Math.round(10 + 14 * u));
}

function pigeonnier(Z, cx, cz) {
  const M = K.M;
  const c = Z.b;
  const u = K.u;
  const r = 3.2;
  const ep = 0.45;
  const H = 6.6;
  const n = 18;
  const gap = 1.15 / r;
  c.poser(new THREE.CylinderGeometry(r, r * 1.02, Y, n, 1, true, gap / 2, Math.PI * 2 - gap), M.tuffeau, C.tuffeau, { x: cx, y: Y / 2, z: cz }, { nuance: 0.02 });
  c.poser(new THREE.CylinderGeometry(r - ep, r - ep, Y, n, 1, true, gap / 2, Math.PI * 2 - gap), M.tuffeau, 0xb9ad92, { x: cx, y: Y / 2, z: cz, e: [-1, 1, 1] }, { nuance: 0.02 });
  c.poser(new THREE.RingGeometry(r - ep, r, n, 1, -Math.PI / 2 + gap / 2, Math.PI * 2 - gap).rotateX(-Math.PI / 2), M.tuffeau, C.tuffeau, { x: cx, y: Y, z: cz });
  // la porte : piédroits et linteau
  for (const s of [-1, 1]) c.pave(cx + s * 0.55, 0, cz + r - ep - 0.05, cx + s * 0.8, 2.3, cz + r + 0.06, C.encadrement, M.tuffeau);
  c.pave(cx - 0.8, 2.3, cz + r - ep - 0.05, cx + 0.8, Y, cz + r + 0.06, C.encadrement, M.tuffeau);
  // le haut : fût, randière (le bandeau qui arrête les rats), corniche, toit conique et sa lanterne
  Z.h.poser(new THREE.CylinderGeometry(r, r, H - Y, n, 1, true), M.tuffeau, C.tuffeau, { x: cx, y: Y + (H - Y) / 2, z: cz }, { nuance: 0.02 });
  Z.h.poser(new THREE.CylinderGeometry(r + 0.1, r + 0.1, 0.22, n), M.tuffeau, C.encadrement, { x: cx, y: 4.2, z: cz });
  Z.h.poser(new THREE.CylinderGeometry(r + 0.2, r + 0.2, 0.3, n), M.tuffeau, C.encadrement, { x: cx, y: H - 0.1, z: cz });
  const anneaux = cone(Z.h, cx, H + 0.1, cz, r + 0.05, 3.4, (i, k) => k === 3);
  const yl = H + 0.1 + anneaux[3][1];
  const rl = anneaux[3][0] - 0.1;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    Z.h.boite(0.1, 0.8, 0.1, C.charpente, { x: cx + Math.cos(a) * rl, y: yl + 0.4, z: cz + Math.sin(a) * rl }, M.mat);
  }
  cone(Z.h, cx, yl + 0.85, cz, rl + 0.1, 1.1);
  epi(Z.h, cx, yl + 1.9, cz, 0.9);
  // dedans : sol de terre battue, fientes, plumes, boulins, échelle tournante
  c.poser(new THREE.CylinderGeometry(r - ep, r - ep, 0.05, n), M.mat, 0x7d6a52, { x: cx, y: 0.0, z: cz }, { crasse: false });
  debris(c, cx - 2, cz - 2, cx + 2, cz + 2, Math.round(10 + 10 * u), [0xe8e6dc, 0xd6d2c4, 0xbcb6a6]);
  jonchee(c, cx - 2, cz - 2, cx + 2, cz + 2, 24, [0xe6e2d8, 0x9a9a96, 0xc8c4bc], 0.04);
  const ri = r - ep - 0.02;
  for (const y of [0.9, 1.4, 1.9, 2.4]) {
    for (let i = 0; i < 20; i++) {
      const a = ((i + (y * 2) % 1 * 0.5) / 20) * Math.PI * 2;
      if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < gap * 0.9) continue;
      c.boite(0.2, 0.2, 0.06, 0x2a2622, { x: cx + Math.sin(a) * ri, y, z: cz + Math.cos(a) * ri, ry: a }, M.mat, { crasse: false });
    }
  }
  c.tube([cx, 0, cz], [cx, 5.8, cz], 0.09, C.charpente, M.mat, 6);
  c.poutre([cx, 5.4, cz], [cx + ri - 0.25, 5.2, cz - 0.4], 0.09, C.charpente, M.mat);
  for (const s of [-1, 1]) c.poutre([cx + ri - 0.3, 5.2, cz - 0.4 + s * 0.25], [cx + ri - 0.35, 0.3, cz - 0.6 + s * 0.25], 0.05, C.bois, M.mat);
  for (let i = 1; i < 14; i++) if (c.hasard() > 0.15) c.poutre([cx + ri - 0.32, 0.3 + i * 0.35, cz - 0.83 + 0.0144 * i], [cx + ri - 0.32, 0.3 + i * 0.35, cz - 0.33 + 0.0144 * i], 0.035, C.bois, M.mat);
  c.boite(0.18, 0.26, 0.18, 0x2d2a25, { x: cx + ri - 0.6, y: 1.5, z: cz - 0.55 }, M.tole);
  c.boite(0.12, 0.16, 0.12, 0xffc56a, { x: cx + ri - 0.6, y: 1.5, z: cz - 0.55 }, M.mat, { crasse: false, nuance: 0 });
  lum(cx + ri - 0.6, 1.7, cz - 0.55, 0xffc86a, 2.5, 6, "lampe-tempête accrochée à l'échelle");
  rai(c, [cx, H + 2.2, cz], [cx - 0.5, 0.05, cz + 0.4], 1.1);
  // obstacles : le fût, sauf la porte
  const m = 12;
  for (let i = 0; i < m; i++) {
    const a1 = gap / 2 + (i / m) * (Math.PI * 2 - gap);
    const a2 = gap / 2 + ((i + 1) / m) * (Math.PI * 2 - gap);
    obs(cx + Math.sin(a1) * (r + 0.05), cz + Math.cos(a1) * (r + 0.05), cx + Math.sin(a2) * (r + 0.05), cz + Math.cos(a2) * (r + 0.05));
  }
  lierre(c, cx + 2.3, 0, cz + 2.3, Math.PI / 4, 1.8, 2.9, Math.round(10 + 14 * u));
  lierre(Z.h, cx + 2.3, Y, cz + 2.3, Math.PI / 4, 1.4, 2.8, Math.round(5 + 8 * u));
  lierre(c, cx - 3.2, 0, cz, -Math.PI / 2, 1.8, 2.9, Math.round(8 + 10 * u));
}

function orangerie(Z) {
  const M = K.M;
  const c = Z.b;
  const u = K.u;
  const H = 5.4;
  const baie = (at, extra = {}) => ({ at, l: 2.0, bas: 0.5, haut: 4.7, type: "baie", forme: "cintre", ...extra });
  murZ(Z, [28, 19], [10, 19], { H, exterieur: true, ouv: [baie(12.2), baie(15.6), baie(19, { bas: 0 }), baie(22.4), baie(25.8)] });
  murZ(Z, [10, 11], [28, 11], { H, exterieur: true, ouv: [{ at: 14, l: 1.3, bas: 0, haut: 2.6, type: "porte", vantail: "entrouvert" }, { at: 20, l: 1.0, bas: 1.5, haut: 2.6, type: "fenetre", meneau: false }, { at: 25, l: 1.0, bas: 1.5, haut: 2.6, type: "fenetre", meneau: false }] });
  murZ(Z, [28, 11], [28, 19], { H, exterieur: true, ouv: [baie(15, { l: 1.8 })] });
  murZ(Z, [10, 19], [10, 11], { H, exterieur: true });
  toit(Z, { x1: 10, x2: 28, z1: 11, z2: 19, y0: H - 0.05, hf: 2.4, axe: "x", croupes: [true, true], inset: 3.0, epis: true });
  c.pave(10.3, -0.02, 11.3, 27.7, 0.025, 18.7, 0xc07a52, M.damier, { crasse: false });
  // les caisses d'orangers, mortes ; le citronnier qui tient encore
  const caisse = (x, z) => {
    c.pave(x - 0.45, 0, z - 0.45, x + 0.45, 0.85, z + 0.45, C.caisse, M.mat);
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.pave(x + a * 0.45 - 0.06, 0, z + b * 0.45 - 0.06, x + a * 0.45 + 0.06, 0.95, z + b * 0.45 + 0.06, 0x5d7563, M.mat);
    c.pave(x - 0.4, 0.85, z - 0.4, x + 0.4, 0.88, z + 0.4, 0x5a4a38, M.mat, { crasse: false });
  };
  for (const x of [12.5, 16, 22, 25.5]) {
    caisse(x, 13.0);
    arbre(c, x, 13.0, 2.6, "mort", 0.88);
  }
  caisse(19, 16.0);
  arbre(c, 19, 16.0, 3.0, "feuillu", 0.88);
  for (let i = 0; i < 9; i++) c.poser(ICO, M.satine, 0xd8c23a, { x: 19 + c.entre(-0.7, 0.7), y: c.entre(2.4, 3.2), z: 16 + c.entre(-0.7, 0.7), e: 0.07 }, { crasse: false });
  for (let i = 0; i < 3; i++) c.poser(ICO, M.satine, 0xc9b030, { x: 19 + c.entre(-0.8, 0.8), y: 0.07, z: 16 + c.entre(-0.9, 0.9), e: 0.07 }, { crasse: false });
  // les outils du jardinier : établi de rempotage, pots, râteau, bêche, arrosoir, brouette
  c.pave(10.35, 0, 14.0, 11.0, 0.85, 17.5, C.bois, M.mat);
  for (let i = 0; i < 6; i++) c.poser(new THREE.CylinderGeometry(0.13, 0.09, 0.2, 7), M.mat, C.terreCuite, { x: 10.65, y: 0.95, z: 14.3 + i * 0.5 }, { nuance: 0.08 });
  for (const [x, z, h] of [[11.2, 12.0, 1.6], [11.6, 11.85, 1.4]]) c.tube([x + 0.3, 0.02, z + 0.25], [x, h, z - 0.15], 0.025, C.bois, M.mat, 5);
  c.poser(new THREE.CylinderGeometry(0.16, 0.18, 0.32, 8), M.tole, 0x6f7a74, { x: 12.0, y: 0.16, z: 17.8 });
  c.poutre([12.15, 0.2, 17.8], [12.55, 0.45, 17.8], 0.04, 0x6f7a74, M.tole);
  c.repere({ x: 17.0, z: 17.3, ry: -0.9 }, () => {
    c.boite(0.6, 0.3, 0.9, 0x5a5a55, { y: 0.45 }, M.tole);
    roue(c, 0, 0.2, 0.6, 0.2);
    for (const s of [-1, 1]) c.poutre([s * 0.25, 0.4, -0.4], [s * 0.3, 0.55, -1.2], 0.05, C.bois, M.mat);
  });
  c.boite(0.2, 0.3, 0.2, 0x2d2a25, { x: 10.7, y: 1.0, z: 15.2 }, M.tole);
  c.boite(0.14, 0.18, 0.14, 0xffc56a, { x: 10.7, y: 1.0, z: 15.2 }, M.mat, { crasse: false, nuance: 0 });
  lum(10.9, 1.3, 15.2, 0xffc86a, 3, 8, "lanterne de l'orangerie");
  for (let i = 0; i < 18; i++) c.boite(c.entre(0.1, 0.3), 0.01, c.entre(0.08, 0.22), 0xffffff, { x: c.entre(11, 27), y: 0.04, z: c.entre(17.5, 20.5), ry: c.hasard() * 3 }, M.verre, { crasse: false, nuance: 0 });
  jonchee(c, 11, 11.5, 27, 18.5, Math.round(12 + 16 * u));
  lierre(c, 9.73, 0, 15, -Math.PI / 2, 4, 2.9, Math.round(10 + 14 * u));
  lierre(Z.h, 9.73, Y, 15, -Math.PI / 2, 3, 2.2, Math.round(5 + 8 * u));
  semerTouffes(c, 10.5, 19.4, 27.5, 21, 14, PALETTE.herbeSeche, 0.01);
}

function cour() {
  const M = K.M;
  const c = K.b.c;
  const u = K.u;
  // l'abreuvoir de pierre et la pompe à bras
  c.pave(0, 0, -4.6, 3.2, 0.75, -4.45, 0xa8a196, M.tuffeau);
  c.pave(0, 0, -3.75, 3.2, 0.75, -3.6, 0xa8a196, M.tuffeau);
  for (const x of [0, 3.05]) c.pave(x, 0, -4.6, x + 0.15, 0.75, -3.6, 0xa8a196, M.tuffeau);
  c.pave(0.15, 0, -4.45, 3.05, 0.2, -3.75, 0x8f8a80, M.tuffeau);
  c.pave(0.15, 0.55, -4.45, 3.05, 0.58, -3.75, 0xffffff, M.eau, { crasse: false, nuance: 0 });
  for (const [x1, z1, x2, z2] of [[0, -4.6, 3.2, -4.6], [3.2, -4.6, 3.2, -3.6], [3.2, -3.6, 0, -3.6], [0, -3.6, 0, -4.6]]) obs(x1, z1, x2, z2, "abreuvoir");
  c.tube([3.7, 0, -4.6], [3.7, 1.4, -4.6], 0.1, 0x3a4a3f, M.tole, 7);
  c.boite(0.26, 0.3, 0.26, 0x3a4a3f, { x: 3.7, y: 1.45, z: -4.6 }, M.tole);
  c.poutre([3.7, 1.2, -4.6], [3.3, 1.05, -4.3], 0.07, 0x3a4a3f, M.tole);
  c.poutre([3.7, 1.55, -4.6], [4.4, 1.95, -4.9], 0.05, 0x3a4a3f, M.tole);
  // la carriole renversée
  c.repere({ x: -5.2, z: 3.2, ry: 0.5 }, () => {
    c.boite(1.4, 0.45, 2.2, C.bois, { y: 0.3, rz: Math.PI - 0.08 }, M.mat);
    roue(c, 0.85, 0.55, 0.0, 0.55, { rz: 0.15 });
    roue(c, -1.4, 0.06, 0.9, 0.55, { rz: Math.PI / 2 });
    for (const s of [-1, 1]) c.poutre([s * 0.45, 0.5, -1.1], [s * 0.5, 1.6, -2.8], 0.07, C.bois, M.mat);
  });
  // le tas de fumier devenu prairie
  c.poser(ICO, M.mat, 0x6f7a3e, { x: -5.6, y: 0.2, z: -6.6, e: [2.6, 0.7, 2.0], ry: 0.4 }, { crasse: false });
  semerTouffes(c, -7.6, -8.0, -3.6, -5.2, 12, PALETTE.herbe, 0.55);
  for (let i = 0; i < 14; i++) c.poser(ICO, M.mat, [0xe8e0a0, 0xc070a0, 0xffffff, 0xd8a040][i % 4], { x: -5.6 + c.entre(-1.8, 1.8), y: 0.75 + c.entre(-0.1, 0.1), z: -6.6 + c.entre(-1.3, 1.3), e: 0.07 }, { crasse: false });
  // le vieux tracteur
  c.repere({ x: 5.0, z: 4.8, ry: -0.6 }, () => {
    c.boite(0.8, 0.8, 1.9, 0xa8643a, { y: 1.0, z: -0.5 }, M.satine);
    c.boite(1.0, 0.5, 1.0, 0x8a5434, { y: 0.9, z: 0.8 }, M.satine);
    c.boite(0.5, 0.1, 0.45, 0x2e2c28, { y: 1.55, z: 0.95 }, M.tole);
    c.poutre([0, 1.35, 0.3], [0, 1.75, 0.05], 0.05, 0x2e2c28, M.tole);
    c.poser(new THREE.TorusGeometry(0.2, 0.03, 4, 10), M.tole, 0x2e2c28, { y: 1.78, z: 0.05, rx: Math.PI / 2 - 0.5 });
    c.tube([0.25, 1.4, -1.0], [0.25, 2.3, -1.0], 0.05, 0x3a3833, M.tole, 6);
    for (const s of [-1, 1]) {
      c.poser(new THREE.CylinderGeometry(0.75, 0.75, 0.38, 12), M.mat, 0x26241f, { x: s * 0.85, y: s > 0 ? 0.7 : 0.62, z: 0.8, rz: Math.PI / 2 + (s > 0 ? 0 : 0.12) });
      c.poser(new THREE.CylinderGeometry(0.4, 0.4, 0.22, 10), M.mat, 0x26241f, { x: s * 0.6, y: 0.4, z: -1.2, rz: Math.PI / 2 });
    }
    for (let i = 0; i < 4; i++) c.boite(c.entre(0.15, 0.4), 0.02, c.entre(0.2, 0.5), PALETTE.rouille, { x: c.entre(-0.3, 0.3), y: 1.41, z: c.entre(-1.3, 0.3) }, M.mat, { crasse: false });
  });
  obsCercle(5.0, 4.8, 1.4, 8, "tracteur");
  // le brasero des survivants
  c.poser(new THREE.CylinderGeometry(0.3, 0.3, 0.75, 9, 1, true), M.tole, PALETTE.rouilleSombre, { x: -1.8, y: 0.38, z: 0.2 });
  for (let i = 0; i < 3; i++) flamme(c, -1.8 + c.entre(-0.12, 0.12), 0.7, 0.2 + c.entre(-0.12, 0.12), 0.16, 0xff9a40);
  lum(-1.8, 1.2, 0.2, 0xff8a3d, 6, 11, "brasero des survivants");
  // un bouleau a soulevé les pavés
  arbre(c, -7.2, 8.0, 7.5, "bouleau");
  debris(c, -8.2, 7.0, -6.2, 9.0, 8, [C.pave, 0x7d786e]);
}

// ---------- Construction ----------

function imbriquer(liste, pose, fn) {
  if (!liste.length) return fn();
  liste[0].repere(pose, () => imbriquer(liste.slice(1), pose, fn));
}

export function creer({ usure = 0.7, carte = "parc" } = {}) {
  const u = Math.min(1, Math.max(0.1, usure));
  const id = carte === "interieur" || carte === "communs" ? carte : "parc";
  const M = materiaux();
  if (id === "communs") {
    const b = new Batiment(1873, u);
    K = { b, M, OX: 0, OZ: 0, u, carte: id, bris: 0.25 + 0.6 * u, plafond: undefined };
    K.ob = { obstacle: (x1, z1, x2, z2, n) => obs(x1, z1, x2, z2, n) };
    communs();
    return b.construire();
  }
  const b = new Batiment(id === "parc" ? 1871 : 1872, u);
  const OX = id === "parc" ? 0 : -2;
  const OZ = id === "parc" ? -24 : -4;
  K = { b, M, OX, OZ, u, carte: id, bris: 0.25 + 0.6 * u, plafond: undefined };
  K.ob = { obstacle: (x1, z1, x2, z2, n) => obs(x1, z1, x2, z2, n) };
  const boite = (x1, x2, z1, z2) => ({ x: (x1 + x2) / 2 + OX, z: (z1 + z2) / 2 + OZ, l: x2 - x1, p: z2 - z1 });
  K.zO = { b: b.c, h: b.couche("aile ouest : salle de bal, tour crevée", boite(-21, -5.5, -8, 11), Y, 23) };
  K.zC = { b: b.c, h: b.couche("pavillon central : hall, étage", boite(-5.5, 5.5, -8, 10), Y, 20) };
  K.zE = { b: b.c, h: b.couche("aile est : salon, tours", boite(5.5, 21, -9.8, 11), Y, 24) };
  imbriquer([b.c, K.zO.h, K.zC.h, K.zE.h], { x: OX, z: OZ }, () => {
    coque();
    exterieurProche();
    if (id === "interieur") {
      interieur();
      abords();
    } else {
      // la carte du parc montre le château fermé : le feu du salon se devine par les fenêtres
      chemineeSalon();
      K.zO.b.pave(-16.72, -0.02, -7.22, -5.73, 0.025, 7.22, C.parquet, M.parquet, { crasse: false });
      arbre(K.zO.b, -11.2, -0.8, 13.5, "feuillu");
      gravats(K.zO.b, -14.4, 3.6, 1.8, 14, [C.tuffeau, C.plafond, C.charpente]);
      K.zC.b.pave(-5.27, -0.02, -7.22, 5.27, 0.025, 7.42, 0xffffff, M.damier, { crasse: false });
      K.zE.b.pave(5.72, -0.02, -7.22, 16.72, 0.025, 7.22, 0xc8a07a, M.parquet, { crasse: false });
      // la nuit, la lueur du feu passe par les fenêtres du salon ; la lanterne du hall par la porte d'honneur
      lum(10.2, 2.2, 5.4, 0xff9a50, 6, 11, "lueur du feu par les fenêtres");
      lum(-1.0, 1.6, 4.5, 0xffc86a, 3, 8, "lanterne du hall");
      // les passages vers la carte « intérieur »
      obs(-1.1, 9.5, 1.1, 9.5, "passage vers l'intérieur");
      obs(-17, -0.9, -17, 1.5, "passage vers l'intérieur");
      obs(6.6, -7.5, 8.0, -7.5, "passage vers l'intérieur");
      obs(17, -3.5, 17, -1.3, "passage vers l'intérieur");
    }
  });
  if (id === "parc") parc();
  const g = b.construire();
  if (id === "interieur") {
    // le voyant du majordome clignote encore (une batterie de secours, quelque part)
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff3a22 }));
    const a = 1.25;
    const lx = 0.0;
    const lz = -0.15;
    led.position.set(0.9 + OX + lx * Math.cos(a) + lz * Math.sin(a), 0.37, 2.3 + OZ - lx * Math.sin(a) + lz * Math.cos(a));
    led.userData.animer = (t) => led.material.color.setHex(t % 2.4 < 0.25 ? 0xff3a22 : 0x3a0d0a);
    g.add(led);
    g.userData.lumieres.push({ x: led.position.x, y: 0.5, z: led.position.z, couleur: 0xff3020, intensite: 1.2, portee: 3, nature: "voyant" });
  }
  return g;
}
