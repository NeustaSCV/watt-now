// La médiathèque à coupole (Book 20 §3.3, « Médiathèque », Ville, anneau moyen, danger ●● ; ressource phare : les
// livres de savoir, Book 03 §5.4).
//
// Une bibliothèque municipale néoclassique, du temps où l'on bâtissait des temples pour les livres : un portique à six
// colonnes sous son fronton, un vestibule dallé, et au cœur une grande salle de lecture circulaire sous une coupole de
// verre et de fer. Les rayonnages courent en arc de cercle sur deux niveaux ; la galerie du haut est inaccessible (une
// travée s'est effondrée). Des vitres manquent à la coupole : le rai de lumière tombe sur la grande table, la pluie
// sur le parquet, et un arbre a poussé à travers. Pendant l'Abondance, on a accolé une aile de verre, la
// « Médiathèque 2.0 », où l'on avait remplacé les livres par des résumés audio de trente secondes. Elle est bien plus
// ravagée que l'ancienne.
//
// Deux cartes (≤ 60 000 triangles et ≤ 40 appels de dessin chacune) :
// - « rotonde » : le parvis, le portique, le vestibule, la salle de lecture, la salle des cartes, le bureau du
//   conservateur et la salle des enfants ;
// - « magasins » : les magasins de livres (le labyrinthe des rayonnages), l'aile « Médiathèque 2.0 » et son passage
//   vitré, avec la salle de lecture d'où l'on vient.
// Tout est bâti dans un repère du site (S), puis recentré sur le lot de chaque carte.
//
// Repère S : +x à l'est, +z au sud. Rotonde centrée en (0, -2), 10 m de rayon intérieur. Vestibule de x = -6 à 6,
// z = 7 à 16 ; portique jusqu'à z = 19,2. Ailes basses de part et d'autre (x = ±6 à ±22, z = 7,5 à 16). Magasins au
// nord (x = -13 à 13, z = -26 à -12,5). Aile 2.0 à l'est (x = 14 à 32, z = -14 à 4).
// Les murs qui regardent la caméra (sud et est) sont coupés à hauteur d'allège : le haut va dans des couches qui
// s'effacent ; les murs du nord et de l'ouest restent entiers.

import * as THREE from "three";
import {
  Batiment, PALETTE, MAT, matiere, matiereMonde, matiereTexture, matiereVerre, mur, lierre as lierreA, touffes, semerTouffes as semerA, gravats as gravatsA,
  debris as debrisA, mousse, arbuste, arbre, raiDeLumiere as raiA, flaque, dessiner, taches, aleatoire,
} from "../commun/atelier.js";

// La végétation et le petit désordre coûtent cher en triangles : on les dose.
const lierre = (c, x, y0, z, ry, l, h, n) => lierreA(c, x, y0, z, ry, l, h, Math.round(n * 0.3));
const semerTouffes = (c, x1, z1, x2, z2, n, t, y) => semerA(c, x1, z1, x2, z2, Math.round(n * 0.35), t, y);
const debris = (c, x1, z1, x2, z2, n, t, y) => debrisA(c, x1, z1, x2, z2, Math.round(n * 0.6), t, y);
// Feuilles mortes et pages à plat : de simples carrés (2 triangles au lieu de 12).
const PLAT = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
function jonchee(c, x1, z1, x2, z2, n, tons = [0x9c7a45, 0x7d6143, 0xb08f55, 0x6f5a3a], y = 0.01) {
  for (let i = 0; i < n; i++) {
    const s = c.entre(0.1, 0.25);
    c.poser(PLAT, matiere(), tons[Math.floor(c.hasard() * tons.length)], { x: c.entre(x1, x2), y, z: c.entre(z1, z2), ry: c.hasard() * 3, e: [s, 1, s * 0.75] }, { crasse: false, nuance: 0.12 });
  }
}
const gravats = (c, x, z, r, n, t, y) => gravatsA(c, x, z, r, Math.round(n * 0.5), t, y);
// Une seule opacité pour tous les rais (une seule matière de lueur)
const raiDeLumiere = (c, a, b, l) => raiA(c, a, b, l, 0.1);

// ---------- Les cartes ----------

const CENTRES = { rotonde: { x: 0, z: 4 }, magasins: { x: 9, z: -11 } };
const LOTS = { rotonde: { l: 52, p: 46 }, magasins: { l: 50, p: 36 } };

function versCarte(id, points) {
  const o = CENTRES[id];
  return points.map((p) => ({ ...p, x: Math.round((p.x - o.x) * 10) / 10, z: Math.round((p.z - o.z) * 10) / 10 }));
}

export const FICHE = {
  id: "mediatheque",
  nom: "La médiathèque à coupole",
  lieu: "Médiathèque · Ville · anneau moyen",
  environnement: "ville",
  anneau: "moyen",
  danger: 2,
  recit:
    "On l'avait bâtie comme un temple, pour que la ville sache tout ce qu'on savait. L'Abondance y a ajouté une aile de verre où des bornes résumaient n'importe quel livre en trente secondes, et gardé les livres papier « pour la décoration ». Les bornes se sont tues, les livres sont restés : sous la coupole crevée, un lecteur revient chaque soir allumer sa lampe sur la grande table, et c'est ici que les survivants viennent apprendre à faire ce que plus personne ne sait faire.",
  inspiration:
    "les bibliothèques Carnegie américaines abandonnées, la bibliothèque du couvent de Mafra, les salles de lecture à coupole (salle Labrouste, salles circulaires sous verrière), les photographies d'urbex de livres gonflés par l'humidité, de rayonnages tombés en dominos et de mousse sur les pages",
  reperes: [
    "La silhouette : portique à six colonnes sous son fronton « BIBLIOTHÈQUE MUNICIPALE », tambour de pierre et coupole de verre et de fer à lanternon",
    "La salle de lecture circulaire : vitres manquantes à la coupole, rai de lumière sur la grande table, pages qui tournoient dans la lumière",
    "Les rayonnages en arc sur deux niveaux, la galerie à balustrade (inaccessible) dont une travée s'est effondrée, les échelles sur rail",
    "Les lampes de lecture en laiton à abat-jour vert, les tables rayonnantes, les livres en tas, gonflés d'eau, moussus",
    "L'arbre qui pousse à travers le parquet, les nids sur les corniches (les oiseaux sont partis)",
    "Le vestibule : banque de prêt, fichiers du catalogue, mot d'un survivant « NE BRÛLEZ PAS LES LIVRES »",
    "La salle des cartes (meubles à plans, carte murale, rouleaux), le bureau du conservateur (registres, tampons, globe, cheminée), la salle des enfants (petites chaises, coussins, tipi, fresque)",
    "Les magasins : labyrinthe de rayonnages serrés, une rangée tombée en dominos, la mezzanine de fer, le coin d'un lecteur",
    "L'aile « Médiathèque 2.0 » : bornes mortes, bar à tablettes, poufs, « ZONE SANS LIVRES », affiche « Pourquoi lire quand on peut écouter un résumé ? », étagère « pour la décoration », borne de recharge Watty",
  ],
  cartes: [
    {
      id: "rotonde",
      nom: "La salle de lecture et le portique",
      lot: LOTS.rotonde,
      depart: versCarte("rotonde", [{ x: 2, z: 24 }])[0],
      description: "le parvis, le portique, le vestibule, la salle de lecture sous la coupole, la salle des cartes, le bureau du conservateur, la salle des enfants",
      entrees: versCarte("rotonde", [
        { x: 0, z: 16, nature: "les trois portes du portique (un vantail tombé)" },
        { x: -22, z: 12, nature: "la porte latérale de la salle des cartes, à l'ouest" },
        { x: 22, z: 12, nature: "la porte vitrée de la salle des enfants, sur le jardin à l'est" },
        { x: 0, z: -12.4, nature: "la porte du nord de la salle de lecture (vers la carte « magasins »)" },
        { x: 10.8, z: -2, nature: "le passage vitré de l'est (vers l'aile 2.0, carte « magasins »)" },
      ]),
      fouille: versCarte("rotonde", [
        { x: 0.6, z: -1.4, quoi: "la grande table : les livres de savoir laissés ouverts par le lecteur (Feu I, Conservation I), bougies, lampe à huile" },
        { x: -8.2, z: -6.4, quoi: "rayonnages de la salle de lecture : manuels à trier parmi les romans gonflés (Construction, Mécanique)" },
        { x: -2.6, z: -9.6, quoi: "les livres tombés de la galerie effondrée : beaucoup gâtés par l'eau, quelques manuels intacts (Météo, Agriculture)" },
        { x: 4.4, z: -6.2, quoi: "lampe de lecture en laiton branchée sur une batterie de survivant (batterie 12 V, fil de cuivre)" },
        { x: -2.5, z: 13.6, quoi: "fichiers du catalogue : retrouver la cote d'un livre (indique le bon rayon des magasins)" },
        { x: 3.2, z: 13.6, quoi: "banque de prêt : lampe de poche, encre, papier, ciseaux, tampon dateur" },
        { x: -14, z: 11.4, quoi: "meubles à plans : cartes de la région (repérer les lieux), atlas, boussole" },
        { x: 8.6, z: 9.4, quoi: "bureau du conservateur : registres des cotes (où sont rangés les manuels), tampons, encre, loupe" },
        { x: 11.6, z: 8.4, quoi: "coffre des livres rares : un traité de médecine (Médecine II), un vieux manuel de forge (Métal II)" },
        { x: 17.5, z: 10.5, quoi: "salle des enfants : livres d'images (pour enseigner), « Les petits jardiniers » (Agriculture I), crayons, coussins (tissu, rembourrage)" },
      ]),
      eteints: versCarte("rotonde", [
        { x: 5.5, z: 3, type: "errant (entre les tables de lecture)" },
        { x: -6, z: 1.5, type: "rampant (sous une table de lecture renversée)" },
        { x: -1.5, z: 11.5, type: "ancien habitant (bibliothécaire, lunettes au bout d'une chaînette, trousseau de clés)" },
        { x: -16, z: 13, type: "errant (dans la salle des cartes)" },
        { x: 10, z: 22, type: "errant (sur le parvis)" },
        { x: 19.5, z: 14, type: "errant (assis sur une petite chaise de la salle des enfants)" },
      ]),
    },
    {
      id: "magasins",
      nom: "Les magasins et l'aile 2.0",
      lot: LOTS.magasins,
      depart: versCarte("magasins", [{ x: 22, z: 6 }])[0],
      description: "les magasins de livres (rayonnages serrés, mezzanine de fer), l'aile « Médiathèque 2.0 » et son passage vitré, la salle de lecture",
      entrees: versCarte("magasins", [
        { x: 23, z: 4, nature: "la façade de verre de l'aile 2.0 (on passe par les panneaux tombés)" },
        { x: 32, z: -6, nature: "la porte automatique de l'aile 2.0, coincée entrouverte" },
        { x: -13, z: -19.2, nature: "la porte de service des magasins, à l'ouest" },
        { x: 0, z: -12.6, nature: "la porte du nord de la salle de lecture (vers la carte « rotonde »)" },
      ]),
      fouille: versCarte("magasins", [
        { x: -8.55, z: -22.5, quoi: "rayon 600, Techniques : manuels (Électricité I et II, Mécanique I et II)" },
        { x: -4.75, z: -15.5, quoi: "rayon 610, Médecine : précis de soins, pharmacopée (Médecine I et II)" },
        { x: -0.95, z: -23.5, quoi: "rayon 630, Agriculture et élevage : semences, greffes, soins des bêtes" },
        { x: 4.75, z: -23, quoi: "rayon 540, Chimie et météo : savon, chaux, distillation, baromètre (Chimie I et II, Météo II)" },
        { x: 6.8, z: -16, quoi: "les rayonnages tombés en dominos : des livres pris dessous (Construction II), il faut dégager" },
        { x: 9.6, z: -24.4, quoi: "le coin du lecteur : son carnet de notes (recettes pressenties), bougies, lampe à huile, conserves" },
        { x: -11.1, z: -24.1, quoi: "le monte-livres : câble d'acier, poulies, manivelle" },
        { x: 19.5, z: -8.2, quoi: "les bornes de résumés : écrans, cartes électroniques, haut-parleurs" },
        { x: 24.5, z: -0.5, quoi: "le bar à tablettes : batteries au lithium, câbles de recharge" },
        { x: 29.9, z: -7.6, quoi: "la borne de recharge Watty : batterie de secours encore chargée, câbles de cuivre" },
        { x: 21, z: -13.4, quoi: "l'étagère « pour la décoration » : de vrais livres rangés par couleur (du savoir au hasard)" },
        { x: 27, z: -6, quoi: "poufs et casques audio : toile synthétique, aimants, petits haut-parleurs" },
      ]),
      eteints: versCarte("magasins", [
        { x: -7.6, z: -19.2, type: "errant (dans l'allée centrale des magasins)" },
        { x: 7.5, z: -14.4, type: "rampant (coincé sous les rayonnages tombés)" },
        { x: -12.2, z: -15.5, type: "ancien habitant (magasinier, blouse grise, crayon derrière l'oreille)" },
        { x: 24, z: -10, type: "ancien habitant (médiateur numérique, gilet orange, tablette attachée au poignet)" },
        { x: 28.5, z: -3, type: "errant (casque audio sur les oreilles)" },
        { x: 4, z: -5, type: "errant (dans la salle de lecture)" },
      ]),
    },
  ],
};

// ---------- Mesures ----------

const TAU = Math.PI * 2;
const deg = (d) => (d * Math.PI) / 180;
const RC = { x: 0, z: -2 }; // centre de la rotonde
const RI = 10; // rayon intérieur du tambour
const EPR = 0.8; // épaisseur du tambour
const RM = RI + EPR / 2; // rayon du milieu du mur
const NS = 24; // pans du tambour
const DA = TAU / NS;
const LIGNE = 1 / 3; // hauteur d'un rang de livres (la texture des rayonnages s'aligne dessus)
const GT = 14 / 3; // dessus du plancher de la galerie
const HD = 9.6; // haut du tambour
const YB = 10.4; // naissance de la coupole
const RB = 10.1; // rayon de la coupole à sa naissance
const FLECHE = 5.6; // hauteur de la coupole
const CUT = 1.05; // coupe des murs côté caméra
const HV = 8; // hauteur du vestibule
const HA = 6.5; // hauteur des ailes
const HM = 6.4; // hauteur des magasins
const H2 = 4.4; // hauteur de l'aile 2.0
const SOL = 0.08; // dessus des planchers

const pol = (r, a) => [RC.x + r * Math.cos(a), RC.z + r * Math.sin(a)];

const COUL = {
  pierre: 0xd3c8ad,
  pierreClaire: 0xe0d8c2,
  pierreGrise: 0xa8a294,
  enduit: 0xe3d9c2,
  boisLivres: 0x4a3426,
  chene: 0x7a5636,
  cheneClair: 0x9a7650,
  laiton: 0xb59048,
  vertLampe: 0x2f5e44,
  fonte: 0x3b3d3a,
  zinc: 0x8d969a,
  cuivreVert: 0x6fa58f,
  papier: 0xe8e0c8,
  blanc2: 0xe8e8e4,
  gris2: 0x9a9c9e,
  resine: 0xcfcbc2,
  herbe: 0x8e9a5c,
  dalle: 0xb8b2a6,
  asphalte: 0x8a8780,
};

const TONS_LIVRES = [0x7a2630, 0x5a3a2a, 0x2f4a3a, 0x2d3a55, 0x8a6a3a, 0x6b5a48, 0x4a2a2a, 0x9a8a6a, 0x6a4a5a, 0xa07a4a, 0x4f5f3f, 0xc9b896];
const TONS_GONFLES = [0x8a8a6a, 0x7a7a5a, 0x9a9070, 0x6f7a50, 0xb0a888];

// ---------- Matières (créées une fois, partagées) ----------

const AL = 1024;
const AH = 1024;

/** L'atlas des inscriptions, affiches, écrans et grilles : [x, y, l, h] en pixels. */
const R = {
  balustre: [0, 0, 256, 128],
  grille: [256, 0, 256, 128],
  fronton: [512, 0, 512, 64],
  silence: [512, 64, 256, 64],
  retour: [768, 64, 256, 64],
  devise: [0, 128, 1024, 64],
  banniere: [0, 192, 1024, 128],
  pourquoi: [0, 320, 256, 384],
  deco: [256, 320, 384, 192],
  sansLivres: [640, 320, 384, 192],
  ecranMort: [256, 512, 192, 128],
  ecranLuit: [448, 512, 192, 128],
  watty: [640, 512, 192, 192],
  note: [832, 512, 192, 192],
  carte: [0, 704, 320, 192],
  tiroirs: [320, 704, 192, 192],
  fresque: [512, 704, 320, 192],
  vers20: [832, 704, 192, 96],
  couvertures: [832, 800, 192, 96],
  portrait: [0, 896, 128, 128],
  cotes: [128, 896, 256, 128],
  enfants: [384, 896, 256, 128],
  tablette: [640, 896, 128, 128],
  plaque: [768, 896, 256, 128],
};

let MATS = null;

function matieres() {
  if (MATS) return MATS;
  const atlas = dessiner("mediatheque-atlas", AL, AH, dessinerAtlas, false);
  const livres = matiereTexture(dessiner("mediatheque-livres", 256, 192, dessinerLivres), { roughness: 0.9 });
  livres.userData.tuile = 2;
  const enseignes = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.85, alphaTest: 0.5, side: THREE.DoubleSide });
  const ecran = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 0.9, vertexColors: true, roughness: 0.4 });
  ecran.userData.sansOmbre = true;
  // Le caillebotis de la mezzanine : ajouré, il ne doit pas porter une ombre pleine
  const grille = enseignes.clone();
  grille.userData.sansOmbre = true;
  MATS = {
    grille,
    pierre: matiereMonde("pierreTaille"),
    enduit: matiereMonde("enduit"),
    parquet: matiereMonde("parquet"),
    livres,
    enseignes,
    ecran,
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    mat: matiere(0.95),
    satin: matiere(0.6, 0.05),
    lisse: matiere(0.3, 0.05),
    tole: matiere(0.75, 0.3),
    metal: matiere(0.4, 0.7),
    toile: MAT.toile(),
  };
  return MATS;
}

// ---------- Textures dessinées ----------

/** Les dos de livres : 6 rangs de 1/3 m sur une tuile de 2 m, planches comprises, des trous, des livres penchés. */
function dessinerLivres(g) {
  const a = aleatoire(303);
  g.fillStyle = "#3a2c22";
  g.fillRect(0, 0, 256, 192);
  const tons = ["#a03a40", "#7a5038", "#3f6a52", "#3d5078", "#b08a4a", "#8a7660", "#6a3a34", "#c0ae86", "#5a5650", "#8a6a7a", "#c49a5a", "#6a7a4a", "#d8c9a6", "#7a8f9a", "#e0d4b8"];
  for (let r = 0; r < 6; r++) {
    const base = r * 32 + 28;
    let x = 0;
    while (x < 256) {
      if (a() < 0.05) {
        x += 6 + a() * 18; // un trou : livres empruntés, jamais rendus
        continue;
      }
      const w = 3 + Math.floor(a() * 6);
      const h = 15 + Math.floor(a() * 11);
      const col = tons[Math.floor(a() * tons.length)];
      if (a() < 0.07 && x > 10 && x < 240) {
        g.save();
        g.translate(x, base);
        g.rotate(-0.4);
        g.fillStyle = col;
        g.fillRect(0, -h, w, h);
        g.restore();
        x += w + 7;
        continue;
      }
      g.fillStyle = col;
      g.fillRect(x, base - h, w - 0.6, h);
      if (a() < 0.6) {
        g.fillStyle = "rgba(214,184,112,0.55)";
        g.fillRect(x, base - h + 3, w - 0.6, 1);
        g.fillRect(x, base - 5, w - 0.6, 1);
      }
      g.fillStyle = "rgba(0,0,0,0.28)";
      g.fillRect(x + w - 1.6, base - h, 1, h);
      x += w;
    }
    g.fillStyle = "#4a3426";
    g.fillRect(0, base, 256, 4);
    g.fillStyle = "rgba(255,230,190,0.18)";
    g.fillRect(0, base, 256, 1);
  }
  taches(g, a, 14, "rgba(70,92,48,0.38)", 6, 26, 256, 192);
  taches(g, a, 10, "rgba(232,226,210,0.16)", 6, 20, 256, 192);
}

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

function texte(g, t, x, y, taille, couleur, police = "900", align = "center", famille = '"Arial Black", "Helvetica Neue", Arial, sans-serif', rotation = 0) {
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

const SERIF = 'Georgia, "Times New Roman", serif';
const MAIN = '"Marker Felt", "Comic Sans MS", "Segoe Print", cursive';

function rectArrondi(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** Watty, la pile souriante : corps canard, tête crème, clin d'œil, éclair rouge, chaussures rouges. */
function dessinerWatty(g, cx, cy, s) {
  const w = s * 0.56;
  const h = s;
  const x = cx - w / 2;
  const y = cy - h / 2;
  g.save();
  g.lineCap = "round";
  g.strokeStyle = "#1f2526";
  g.lineWidth = s * 0.06;
  for (const sx of [-1, 1]) {
    g.beginPath();
    g.moveTo(cx + sx * w * 0.22, y + h - 2);
    g.lineTo(cx + sx * w * 0.3, y + h + s * 0.16);
    g.stroke();
    g.fillStyle = "#c8362b";
    g.beginPath();
    g.ellipse(cx + sx * w * 0.38, y + h + s * 0.18, s * 0.1, s * 0.05, 0, 0, TAU);
    g.fill();
  }
  g.beginPath();
  g.moveTo(x + 2, y + h * 0.5);
  g.quadraticCurveTo(x - s * 0.2, y + h * 0.45, x - s * 0.2, y + h * 0.2);
  g.stroke();
  g.beginPath();
  g.moveTo(x + w - 2, y + h * 0.5);
  g.quadraticCurveTo(x + w + s * 0.2, y + h * 0.55, x + w + s * 0.22, y + h * 0.35);
  g.stroke();
  rectArrondi(g, x, y, w, h, s * 0.1);
  g.fillStyle = "#2f6f73";
  g.fill();
  g.fillStyle = "#e9dfc6";
  g.fillRect(x + 2, y + 2, w - 4, h * 0.2);
  g.fillStyle = "#1f2526";
  g.fillRect(cx - w * 0.15, y - s * 0.06, w * 0.3, s * 0.07);
  // Le visage : un œil ouvert, un clin d'œil, le sourire
  g.beginPath();
  g.arc(cx - w * 0.18, y + h * 0.36, s * 0.035, 0, TAU);
  g.fill();
  g.lineWidth = s * 0.025;
  g.beginPath();
  g.moveTo(cx + w * 0.1, y + h * 0.36);
  g.lineTo(cx + w * 0.26, y + h * 0.36);
  g.stroke();
  g.beginPath();
  g.arc(cx, y + h * 0.44, w * 0.2, 0.2, Math.PI - 0.2);
  g.stroke();
  // L'éclair rouge sur le ventre
  g.fillStyle = "#c8362b";
  g.beginPath();
  g.moveTo(cx + w * 0.08, y + h * 0.58);
  g.lineTo(cx - w * 0.16, y + h * 0.78);
  g.lineTo(cx - w * 0.01, y + h * 0.78);
  g.lineTo(cx - w * 0.1, y + h * 0.96);
  g.lineTo(cx + w * 0.18, y + h * 0.72);
  g.lineTo(cx + w * 0.02, y + h * 0.72);
  g.closePath();
  g.fill();
  g.restore();
}

function dessinerAtlas(g) {
  const a = aleatoire(1883);
  g.clearRect(0, 0, AL, AH);

  // Balustrade de pierre : balustres en poire entre main courante et socle (le reste est transparent)
  {
    const [x, y, l, h] = R.balustre;
    g.fillStyle = "#d8cfb8";
    g.fillRect(x, y, l, 16);
    g.fillRect(x, y + h - 18, l, 18);
    for (let i = 0; i < 8; i++) {
      const cx = x + 16 + i * 32;
      g.beginPath();
      g.moveTo(cx - 6, y + 16);
      g.quadraticCurveTo(cx - 3, y + 40, cx - 11, y + 74);
      g.quadraticCurveTo(cx - 12, y + 96, cx - 6, y + h - 18);
      g.lineTo(cx + 6, y + h - 18);
      g.quadraticCurveTo(cx + 12, y + 96, cx + 11, y + 74);
      g.quadraticCurveTo(cx + 3, y + 40, cx + 6, y + 16);
      g.closePath();
      g.fill();
    }
    g.fillStyle = "rgba(0,0,0,0.12)";
    g.fillRect(x, y + 12, l, 4);
    salir(g, a, x, y, l, h, 0.8);
  }
  // Caillebotis de fonte (mezzanine des magasins) : barreaux croisés, transparent entre
  {
    const [x, y, l, h] = R.grille;
    g.fillStyle = "#4a4c48";
    for (let i = 0; i <= l; i += 10) g.fillRect(x + i, y, 3, h);
    for (let j = 0; j <= h; j += 22) g.fillRect(x, y + j, l, 3);
    g.fillRect(x, y, l, 5);
    g.fillRect(x, y + h - 5, l, 5);
  }
  // Le fronton : lettres gravées dans la pierre
  {
    const [x, y, l, h] = R.fronton;
    g.fillStyle = "#d6cbb0";
    g.fillRect(x, y, l, h);
    salir(g, a, x, y, l, h, 1.2);
    texte(g, "BIBLIOTHÈQUE  MUNICIPALE", x + l / 2 + 1, y + h / 2 + 1, 34, "rgba(255,250,235,0.6)", "700", "center", SERIF);
    texte(g, "BIBLIOTHÈQUE  MUNICIPALE", x + l / 2, y + h / 2, 34, "#5d5444", "700", "center", SERIF);
    // Une lettre est tombée : il en reste la trace plus claire
    g.fillStyle = "#e3dac2";
    g.fillRect(x + 300, y + 16, 18, 32);
  }
  // SILENCE, plaque émaillée
  {
    const [x, y, l, h] = R.silence;
    g.fillStyle = "#1f3a5a";
    rectArrondi(g, x + 2, y + 2, l - 4, h - 4, 10);
    g.fill();
    g.strokeStyle = "#e9e4d6";
    g.lineWidth = 3;
    rectArrondi(g, x + 8, y + 8, l - 16, h - 16, 6);
    g.stroke();
    texte(g, "SILENCE", x + l / 2, y + h / 2 + 2, 30, "#e9e4d6", "700", "center", SERIF);
    g.fillStyle = "rgba(60,40,30,0.7)";
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      g.arc(x + a() * l, y + a() * h, 2 + a() * 6, 0, TAU);
      g.fill();
    }
  }
  // RETOUR DES LIVRES
  {
    const [x, y, l, h] = R.retour;
    g.fillStyle = "#2c3e34";
    g.fillRect(x, y, l, h);
    texte(g, "RETOUR DES LIVRES", x + l / 2, y + h / 2, 24, "#d9c98f", "700", "center", SERIF);
    salir(g, a, x, y, l, h, 1.3);
  }
  // La devise de la salle de lecture, lettres d'or sur bandeau sombre
  {
    const [x, y, l, h] = R.devise;
    g.fillStyle = "#3b2f26";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#8a6a3a";
    g.fillRect(x, y + 4, l, 2);
    g.fillRect(x, y + h - 6, l, 2);
    texte(g, "LE SAVOIR EST LA SEULE LUMIÈRE QUI NE S'ÉTEINT PAS", x + l / 2, y + h / 2 + 1, 36, "#c9a75a", "700", "center", SERIF);
    salir(g, a, x, y, l, h, 1.2);
  }
  // La banderole de l'Abondance, déchirée
  {
    const [x, y, l, h] = R.banniere;
    g.fillStyle = "#e9dfc6";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#c8362b";
    g.fillRect(x, y, l, 22);
    g.fillRect(x, y + h - 14, l, 14);
    texte(g, "MÉDIATHÈQUE 2.0", x + 250, y + 70, 56, "#2f6f73");
    texte(g, "LE SAVOIR EN 30 SECONDES !", x + 700, y + 62, 38, "#c8362b");
    texte(g, "résumés audio · zéro page · 100 % connecté", x + 700, y + 98, 22, "#3b2a1e", "700", "center", "Arial, sans-serif");
    dessinerWatty(g, x + 470, y + 70, 70);
    // Déchirures : des morceaux manquent (transparents)
    g.save();
    g.globalCompositeOperation = "destination-out";
    g.beginPath();
    g.moveTo(x + 860, y);
    g.lineTo(x + 1024, y);
    g.lineTo(x + 1024, y + h);
    g.lineTo(x + 960, y + h);
    g.lineTo(x + 930, y + 80);
    g.lineTo(x + 900, y + 60);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(x, y + 90);
    g.lineTo(x + 60, y + h);
    g.lineTo(x, y + h);
    g.fill();
    g.restore();
    salir(g, a, x, y, 860, h, 1.4);
  }
  // L'affiche « Pourquoi lire ? », corrigée au feutre
  {
    const [x, y, l, h] = R.pourquoi;
    g.fillStyle = "#e9dfc6";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#c8362b";
    g.fillRect(x, y, l, 26);
    texte(g, "POURQUOI LIRE", x + l / 2, y + 62, 28, "#2f6f73");
    texte(g, "QUAND ON PEUT", x + l / 2, y + 96, 28, "#2f6f73");
    texte(g, "ÉCOUTER UN", x + l / 2, y + 130, 28, "#2f6f73");
    texte(g, "RÉSUMÉ ?", x + l / 2, y + 164, 34, "#c8362b");
    // Le casque audio
    g.strokeStyle = "#1f2526";
    g.lineWidth = 10;
    g.beginPath();
    g.arc(x + l / 2, y + 250, 50, Math.PI, 0);
    g.stroke();
    g.fillStyle = "#c79a3b";
    g.fillRect(x + l / 2 - 62, y + 240, 26, 44);
    g.fillRect(x + l / 2 + 36, y + 240, 26, 44);
    texte(g, "Résumés audio 30 s", x + l / 2, y + 318, 20, "#3b2a1e", "700", "center", "Arial, sans-serif");
    texte(g, "Médiathèque 2.0", x + l / 2, y + 344, 16, "#3b2a1e", "italic 400", "center", "Arial, sans-serif");
    // Au feutre, par-dessus : « PARCE QUE. »
    texte(g, "PARCE QUE.", x + l / 2 + 10, y + 206, 34, "#1b1b1b", "700", "center", MAIN, -0.12);
    salir(g, a, x, y, l, h, 1.5);
  }
  // « Les livres papier sont conservés pour la décoration »
  {
    const [x, y, l, h] = R.deco;
    g.fillStyle = "#f2efe6";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, 14, h);
    texte(g, "Les livres papier", x + l / 2 + 7, y + 52, 32, "#2b2b2b", "700", "center", "Arial, sans-serif");
    texte(g, "sont conservés", x + l / 2 + 7, y + 92, 32, "#2b2b2b", "700", "center", "Arial, sans-serif");
    texte(g, "pour la décoration.", x + l / 2 + 7, y + 132, 32, "#2b2b2b", "700", "center", "Arial, sans-serif");
    texte(g, "Merci de ne pas les manipuler.", x + l / 2 + 7, y + 170, 18, "#6b6b6b", "italic 400", "center", "Arial, sans-serif");
    salir(g, a, x, y, l, h, 1.1);
  }
  // Marquage au sol « ZONE SANS LIVRES »
  {
    const [x, y, l, h] = R.sansLivres;
    g.fillStyle = "#e9dfc6";
    rectArrondi(g, x + 4, y + 4, l - 8, h - 8, 24);
    g.fill();
    g.strokeStyle = "#c8362b";
    g.lineWidth = 10;
    g.beginPath();
    g.arc(x + 92, y + h / 2, 62, 0, TAU);
    g.stroke();
    g.fillStyle = "#2f6f73";
    g.fillRect(x + 62, y + h / 2 - 30, 60, 60);
    g.fillStyle = "#e9dfc6";
    g.fillRect(x + 90, y + h / 2 - 30, 4, 60);
    g.strokeStyle = "#c8362b";
    g.beginPath();
    g.moveTo(x + 48, y + h / 2 - 44);
    g.lineTo(x + 136, y + h / 2 + 44);
    g.stroke();
    texte(g, "ZONE", x + 260, y + 58, 40, "#c8362b");
    texte(g, "SANS LIVRES", x + 260, y + 104, 34, "#2f6f73");
    texte(g, "détendez-vous", x + 260, y + 146, 20, "#3b2a1e", "italic 700", "center", "Arial, sans-serif");
    salir(g, a, x, y, l, h, 2);
    // Traces de pas et de boue
    g.fillStyle = "rgba(70,60,45,0.4)";
    for (let i = 0; i < 9; i++) {
      g.beginPath();
      g.ellipse(x + 30 + i * 40, y + 160 - (i % 2) * 22, 9, 16, 0.3, 0, TAU);
      g.fill();
    }
  }
  // Écran mort : noir, fêlé, un reflet
  {
    const [x, y, l, h] = R.ecranMort;
    g.fillStyle = "#14181b";
    g.fillRect(x, y, l, h);
    const d = g.createLinearGradient(x, y, x + l, y + h);
    d.addColorStop(0, "rgba(255,255,255,0.12)");
    d.addColorStop(0.4, "rgba(255,255,255,0)");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
    g.strokeStyle = "rgba(220,230,235,0.55)";
    g.lineWidth = 1.5;
    const cx = x + l * 0.62;
    const cy = y + h * 0.4;
    for (let i = 0; i < 9; i++) {
      const an = a() * TAU;
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(an) * (30 + a() * 70), cy + Math.sin(an) * (20 + a() * 50));
      g.stroke();
    }
  }
  // Écran qui luit encore : « Résumé en cours… »
  {
    const [x, y, l, h] = R.ecranLuit;
    g.fillStyle = "#0d1a22";
    g.fillRect(x, y, l, h);
    texte(g, "RÉSUMÉ EN COURS…", x + l / 2, y + 34, 17, "#9fd8ff", "700", "center", "Arial, sans-serif");
    texte(g, "« Guerre et Paix »", x + l / 2, y + 60, 15, "#9fd8ff", "italic 400", "center", "Arial, sans-serif");
    g.fillStyle = "rgba(159,216,255,0.3)";
    g.fillRect(x + 20, y + 84, l - 40, 6);
    g.fillStyle = "#9fd8ff";
    g.fillRect(x + 20, y + 84, (l - 40) * 0.97, 6);
    texte(g, "0:29 / 0:30", x + l / 2, y + 108, 14, "#9fd8ff", "700", "center", "Arial, sans-serif");
  }
  // L'affiche de Watty
  {
    const [x, y, l, h] = R.watty;
    g.fillStyle = "#e9dfc6";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#c8362b";
    g.fillRect(x, y, l, 18);
    dessinerWatty(g, x + l / 2, y + 86, 80);
    texte(g, "Watty te résume tout !", x + l / 2, y + 160, 15, "#2f6f73", "900");
    texte(g, "Toujours plein, jamais à plat !", x + l / 2, y + 180, 12, "#3b2a1e", "italic 700", "center", "Arial, sans-serif");
    texte(g, "MENTEUR", x + l / 2, y + 120, 26, "#1b1b1b", "700", "center", MAIN, 0.25);
    salir(g, a, x, y, l, h, 1.3);
  }
  // Le mot du lecteur, au feutre sur un carton
  {
    const [x, y, l, h] = R.note;
    g.fillStyle = "#b89a6a";
    g.fillRect(x, y, l, h);
    g.fillStyle = "rgba(90,70,40,0.35)";
    g.fillRect(x, y + h / 2 - 2, l, 4);
    texte(g, "NE BRÛLEZ PAS", x + l / 2, y + 44, 24, "#1b1b1b", "700", "center", MAIN, -0.04);
    texte(g, "LES LIVRES.", x + l / 2, y + 76, 24, "#1b1b1b", "700", "center", MAIN, -0.04);
    texte(g, "Brûlez les chaises.", x + l / 2, y + 116, 18, "#1b1b1b", "700", "center", MAIN, -0.03);
    texte(g, "Lisez. Recopiez.", x + l / 2, y + 146, 18, "#1b1b1b", "700", "center", MAIN, -0.03);
    texte(g, "Rendez. — M.", x + l / 2 + 30, y + 174, 16, "#1b1b1b", "700", "center", MAIN, -0.03);
    salir(g, a, x, y, l, h, 1.2);
  }
  // La carte murale de la région : terres, rivière, routes, rose des vents
  {
    const [x, y, l, h] = R.carte;
    g.fillStyle = "#d8c9a0";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#c2b386";
    for (let i = 0; i < 7; i++) {
      g.beginPath();
      g.ellipse(x + a() * l, y + a() * h, 20 + a() * 50, 14 + a() * 30, a() * 3, 0, TAU);
      g.fill();
    }
    g.strokeStyle = "#5d7f8f";
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(x, y + 40);
    g.bezierCurveTo(x + 90, y + 70, x + 140, y + 30, x + 200, y + 110);
    g.bezierCurveTo(x + 240, y + 160, x + 280, y + 150, x + l, y + 180);
    g.stroke();
    g.strokeStyle = "#8a3a2a";
    g.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.moveTo(x + a() * l, y + a() * h);
      g.lineTo(x + a() * l, y + a() * h);
      g.stroke();
    }
    g.fillStyle = "#3b2a1e";
    for (let i = 0; i < 10; i++) g.fillRect(x + a() * l, y + a() * h, 5, 5);
    // Rose des vents
    g.save();
    g.translate(x + 270, y + 46);
    g.fillStyle = "#3b2a1e";
    for (let i = 0; i < 4; i++) {
      g.rotate(Math.PI / 2);
      g.beginPath();
      g.moveTo(0, -26);
      g.lineTo(5, 0);
      g.lineTo(-5, 0);
      g.fill();
    }
    g.restore();
    g.strokeStyle = "#3b2a1e";
    g.lineWidth = 6;
    g.strokeRect(x + 3, y + 3, l - 6, h - 6);
    taches(g, a, 8, "rgba(110,90,50,0.35)", 10, 40, l, h);
    salir(g, a, x, y, l, h, 1.4);
  }
  // Les tiroirs du fichier : étiquettes, poignées de laiton
  {
    const [x, y, l, h] = R.tiroirs;
    g.fillStyle = "#5a3e2a";
    g.fillRect(x, y, l, h);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) {
      const tx = x + 6 + i * 46;
      const ty = y + 6 + j * 31;
      g.fillStyle = a() < 0.12 ? "#1a120c" : "#7a5636"; // tiroir arraché
      g.fillRect(tx, ty, 40, 26);
      g.fillStyle = "#e8e0c8";
      g.fillRect(tx + 10, ty + 4, 20, 8);
      g.fillStyle = "#c9a75a";
      g.fillRect(tx + 15, ty + 16, 10, 4);
    }
    salir(g, a, x, y, l, h, 1);
  }
  // La fresque de la salle des enfants
  {
    const [x, y, l, h] = R.fresque;
    g.fillStyle = "#b9d0c4";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#9fb87a";
    g.beginPath();
    g.ellipse(x + l / 2, y + h + 40, l * 0.7, 110, 0, 0, TAU);
    g.fill();
    g.fillStyle = "#e0b84a";
    g.beginPath();
    g.arc(x + 260, y + 50, 26, 0, TAU);
    g.fill();
    g.fillStyle = "#7a5636";
    g.fillRect(x + 66, y + 80, 14, 70);
    g.fillStyle = "#6f9a52";
    g.beginPath();
    g.arc(x + 73, y + 76, 36, 0, TAU);
    g.fill();
    // Un livre ouvert géant et des lettres qui s'envolent
    g.fillStyle = "#f2ead6";
    g.beginPath();
    g.moveTo(x + 120, y + 150);
    g.lineTo(x + 170, y + 130);
    g.lineTo(x + 220, y + 150);
    g.lineTo(x + 220, y + 110);
    g.lineTo(x + 170, y + 92);
    g.lineTo(x + 120, y + 110);
    g.closePath();
    g.fill();
    for (const [lt, px, py, c] of [["A", 150, 70, "#c8362b"], ["B", 185, 52, "#2f6f73"], ["C", 222, 72, "#c79a3b"], ["?", 120, 40, "#6a4a7a"]]) texte(g, lt, x + px, y + py, 24, c);
    texte(g, "Il était une fois…", x + l / 2, y + 20, 22, "#3b2a1e", "italic 700", "center", SERIF);
    taches(g, a, 10, "rgba(80,70,50,0.3)", 10, 30, l, h);
    salir(g, a, x, y, l, h, 1.6);
    // Une main de survivant a ajouté une flèche et « école ici »
    texte(g, "école ici →", x + 250, y + 170, 18, "#1b1b1b", "700", "center", MAIN);
  }
  // Le panneau « MÉDIATHÈQUE 2.0 → »
  {
    const [x, y, l, h] = R.vers20;
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, l, h);
    texte(g, "MÉDIATHÈQUE 2.0", x + l / 2, y + 32, 20, "#e9dfc6");
    texte(g, "→", x + l / 2, y + 66, 34, "#e0b84a");
    salir(g, a, x, y, l, h, 1.2);
  }
  // Des couvertures de livres d'images (pour les livres posés à plat)
  {
    const [x, y, l, h] = R.couvertures;
    const fonds = ["#c8362b", "#2f6f73", "#e0b84a", "#6a4a7a", "#7da150", "#d97a4a"];
    for (let i = 0; i < 6; i++) {
      const cx = x + (i % 3) * 64;
      const cy = y + Math.floor(i / 3) * 48;
      g.fillStyle = fonds[i];
      g.fillRect(cx, cy, 64, 48);
      g.fillStyle = "#f2ead6";
      g.beginPath();
      g.arc(cx + 32, cy + 22, 12, 0, TAU);
      g.fill();
      g.fillRect(cx + 8, cy + 38, 48, 5);
    }
    salir(g, a, x, y, l, h, 1);
  }
  // Le portrait du fondateur, très passé
  {
    const [x, y, l, h] = R.portrait;
    g.fillStyle = "#8a6a3a";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#3a3026";
    g.fillRect(x + 12, y + 12, l - 24, h - 24);
    g.fillStyle = "#b8a080";
    g.beginPath();
    g.ellipse(x + l / 2, y + 52, 20, 26, 0, 0, TAU);
    g.fill();
    g.fillStyle = "#2a2420";
    g.fillRect(x + 30, y + 80, l - 60, 36);
    taches(g, a, 5, "rgba(120,140,80,0.4)", 6, 20, l, h);
  }
  // Le panneau des cotes des magasins
  {
    const [x, y, l, h] = R.cotes;
    g.fillStyle = "#e8e0c8";
    g.fillRect(x, y, l, h);
    texte(g, "MAGASINS", x + l / 2, y + 24, 22, "#3b2a1e", "700", "center", SERIF);
    const lignes = ["500  Sciences", "600  Techniques", "610  Médecine", "630  Agriculture"];
    lignes.forEach((t, i) => texte(g, t, x + 30, y + 52 + i * 20, 15, "#3b2a1e", "400", "left", SERIF));
    salir(g, a, x, y, l, h, 1.3);
  }
  // L'enseigne peinte du coin des enfants
  {
    const [x, y, l, h] = R.enfants;
    g.fillStyle = "#e0b84a";
    rectArrondi(g, x + 4, y + 10, l - 8, h - 20, 30);
    g.fill();
    const lettres = "LES PETITS LECTEURS";
    const cs = ["#c8362b", "#2f6f73", "#6a4a7a", "#3f6b3a"];
    for (let i = 0; i < lettres.length; i++) texte(g, lettres[i], x + 18 + i * 12.2, y + h / 2 + (i % 2 ? 4 : -4), 20, cs[i % 4]);
    salir(g, a, x, y, l, h, 1.4);
  }
  // L'écran d'une tablette (fêlé, éteint)
  {
    const [x, y, l, h] = R.tablette;
    g.fillStyle = "#e8e8e4";
    rectArrondi(g, x + 4, y + 4, l - 8, h - 8, 12);
    g.fill();
    g.fillStyle = "#16191b";
    g.fillRect(x + 14, y + 14, l - 28, h - 28);
    g.strokeStyle = "rgba(220,230,235,0.5)";
    g.beginPath();
    g.moveTo(x + 20, y + 30);
    g.lineTo(x + 100, y + 90);
    g.stroke();
  }
  // La plaque de bronze de la fondation
  {
    const [x, y, l, h] = R.plaque;
    g.fillStyle = "#5f5a3a";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#4a6f5a";
    g.fillRect(x + 6, y + 6, l - 12, h - 12);
    texte(g, "OFFERTE À LA VILLE", x + l / 2, y + 36, 20, "#c9b98a", "700", "center", SERIF);
    texte(g, "POUR QUE CHACUN", x + l / 2, y + 62, 20, "#c9b98a", "700", "center", SERIF);
    texte(g, "SACHE CE QUE TOUS SAVENT", x + l / 2, y + 88, 17, "#c9b98a", "700", "center", SERIF);
    taches(g, a, 6, "rgba(120,170,140,0.5)", 6, 22, l, h);
  }
}

// ---------- Outils géométriques ----------

const GEO = {};

function geoCylindre(r, h, cotes, ouvert = false) {
  const cle = `cyl|${r}|${h}|${cotes}|${ouvert}`;
  if (!GEO[cle]) GEO[cle] = new THREE.CylinderGeometry(r, r, h, cotes, 1, ouvert);
  return GEO[cle];
}

function geoCone(r1, r2, h, cotes, ouvert = false) {
  const cle = `cone|${r1}|${r2}|${h}|${cotes}|${ouvert}`;
  if (!GEO[cle]) GEO[cle] = new THREE.CylinderGeometry(r1, r2, h, cotes, 1, ouvert);
  return GEO[cle];
}

function geoIco(r, detail = 0) {
  const cle = `ico|${r}|${detail}`;
  if (!GEO[cle]) GEO[cle] = new THREE.IcosahedronGeometry(r, detail);
  return GEO[cle];
}

/** Un quadrilatère (4 sommets [x, y, z]) : deux triangles. */
function geoQuad(p) {
  const g = new THREE.BufferGeometry();
  const v = [...p[0], ...p[1], ...p[2], ...p[0], ...p[2], ...p[3]];
  g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}

/** Un secteur d'anneau horizontal (plancher de galerie) : rayons r1 → r2, angles a1 → a2, épaisseur ep, dessus à y = 0. */
function geoSecteur(r1, r2, a1, a2, ep, n = 2) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r2, a1, a2, false);
  s.absarc(0, 0, r1, a2, a1, true);
  const g = new THREE.ExtrudeGeometry(s, { depth: ep, bevelEnabled: false, curveSegments: n });
  g.rotateX(Math.PI / 2);
  return g;
}

/** Un prisme triangulaire (fronton) : base `l` centrée en x, sommet à `h`, épaisseur `ep` en z. */
function geoTriangle(l, h, ep) {
  const cle = `tri|${l}|${h}|${ep}`;
  if (!GEO[cle]) {
    const s = new THREE.Shape([new THREE.Vector2(-l / 2, 0), new THREE.Vector2(l / 2, 0), new THREE.Vector2(0, h)]);
    GEO[cle] = new THREE.ExtrudeGeometry(s, { depth: ep, bevelEnabled: false }).translate(0, 0, -ep / 2);
  }
  return GEO[cle];
}

/** Un panneau plat dont l'image vient de l'atlas (région `r`, ou une part [u0, u1] de sa largeur), face vers +z local. */
function panneau(c, mat, r, pose, l, h, u0 = 0, u1 = 1) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) {
    const u = u0 + uv.getX(i) * (u1 - u0);
    uv.setXY(i, (px + u * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
  }
  c.poser(g, mat, pose.teinte ?? 0xffffff, pose, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Un plan de livres (dos alignés), face vers +z local : la texture « monde » aligne les rangs sur les tiers de mètre. */
function planLivres(c, pose, l, h, teinte = 0xffffff) {
  const g = new THREE.PlaneGeometry(l, h);
  c.poser(g, matieres().livres, teinte, pose, { crasse: false, nuance: 0.05 });
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
      return { ...o, type: o.type === "fenetre" && entiere ? "fenetre" : o.type === "porte" && entiere ? "porte" : "vide", bas: Math.max(0, o.bas - p0), haut: Math.min(p1 - p0 + 0.5, o.haut - p0) };
    });
}

/**
 * Un mur coupé : le bas (0 → `cut`) reste toujours visible, le haut va dans la couche `haut`. `cut` ≥ h : mur entier
 * visible. Les obstacles suivent les ouvertures qui descendent au sol.
 */
function murCoupe(k, a, b, spec) {
  const { h, cut = CUT, couche, ouvertures = [], breches = [], obstacles = true, ...reste } = spec;
  const bas = Math.min(cut, h);
  mur(k.c, a, b, { ...reste, h: bas, ouvertures: tranche(ouvertures, 0, bas), breches: cut >= h ? breches : [] });
  if (h > cut) mur(couche, a, b, { ...reste, y0: cut, h: h - cut, ouvertures: tranche(ouvertures, cut, h), breches });
  if (obstacles) {
    const { L, dx, dz } = repereMur(a, b);
    const trous = ouvertures.filter((o) => o.bas < 0.5 && o.haut > 0.5).map((o) => [o.u - o.l / 2, o.u + o.l / 2]);
    for (const [u1, u2] of soustraire(0, L, trous)) k.b.obstacle(a[0] + (dx * u1) / L, a[1] + (dz * u1) / L, a[0] + (dx * u2) / L, a[1] + (dz * u2) / L);
  }
}

/** Des bandes en saillie sur la face extérieure (+z local) d'un mur : [{ y1, y2, s, couleur, mat, ch, trous }]. */
function bandes(a, b, ep, liste) {
  const { L, ry } = repereMur(a, b);
  for (const bd of liste) {
    const d = bd.deborde ?? bd.s;
    bd.ch.repere({ x: a[0], z: a[1], ry }, () => {
      for (const [u1, u2] of soustraire(-d, L + d, bd.trous ?? [])) bd.ch.pave(u1, bd.y1, ep / 2 - 0.02, u2, bd.y2, ep / 2 + bd.s, bd.couleur, bd.mat, { nuance: 0.03, crasse: bd.y1 < 1 });
    });
  }
}

/** Une balustrade de pierre (atlas) de a à b, posée à y0, haute de h, face vers les deux côtés. */
function balustrade(c, a, b, y0, h = 0.9) {
  const m = matieres();
  const { L, ry } = repereMur(a, b);
  const n = Math.max(1, Math.round(L / 2));
  const l = L / n;
  c.repere({ x: a[0], y: y0, z: a[1], ry }, () => {
    for (let i = 0; i < n; i++) panneau(c, m.enseignes, R.balustre, { x: (i + 0.5) * l, y: h / 2 }, l, h);
    c.pave(-0.1, h - 0.02, -0.14, L + 0.1, h + 0.1, 0.14, COUL.pierreClaire, m.pierre, { crasse: false });
    for (let i = 0; i <= n; i++) c.pave(i * l - 0.14, 0, -0.14, i * l + 0.14, h, 0.14, COUL.pierreClaire, m.pierre, { crasse: false });
  });
}

/** Le contrat de chaque zone : construite en détail sur la carte qui la visite, en simple coque ailleurs. */
function dansLot(k, x, z, marge = 0) {
  const o = CENTRES[k.id];
  const lot = LOTS[k.id];
  return Math.abs(x - o.x) <= lot.l / 2 + marge && Math.abs(z - o.z) <= lot.p / 2 + marge;
}

// ---------- Le bâtiment ----------

export function creer({ usure = 0.7, carte } = {}) {
  const id = carte === "magasins" ? "magasins" : "rotonde";
  const b = new Batiment(1883, usure);
  const m = matieres();
  // Les couches qui s'effacent : le haut du tambour, la galerie et la coupole ; le portique et le haut des ailes ;
  // le haut des magasins et leur mezzanine ; le toit de l'aile 2.0.
  const Rk = b.couche("rotonde et coupole", { x: RC.x, z: RC.z, l: 22.6, p: 22.6 }, CUT, YB + FLECHE + 2.5);
  const A = b.couche("portique et ailes", { x: 0, z: 13.6, l: 44.8, p: 13.4 }, CUT, 11);
  const M = b.couche("magasins", { x: 0, z: -19.25, l: 26.8, p: 14.2 }, 1.33, HM + 1);
  const D = b.couche("aile 2.0", { x: 21.3, z: -5, l: 21.8, p: 18.6 }, H2 - 1.5, H2 + 1.5);
  const k = { b, c: b.c, Ro: Rk, A, M, D, m, usure, id, rot: id === "rotonde", mag: id === "magasins", bris: 0.2 + 0.6 * usure };

  sols(k);
  rotonde(k);
  coupole(k);
  salleDeLecture(k);
  if (k.rot) {
    vestibule(k);
    portique(k);
    ailes(k);
    salleDesCartes(k);
    bureau(k);
    salleDesEnfants(k);
    parvis(k);
  }
  magasins(k);
  aile20(k);
  pagesQuiVolent(k);

  // Les lumières de la nuit
  b.lumiere(RC.x + 0.5, 1.2, RC.z + 0.3, 0xffb85a, 7, 9, "lampe à huile du lecteur, sur la grande table");
  if (k.rot) {
    const [lx, lz] = pol(5.6, deg(112.5));
    b.lumiere(lx, 1.35, lz, 0xffe7a8, 4, 6, "lampe de lecture en laiton, sur batterie");
    b.lumiere(9.2, 0.8, 7.9, 0xff8a3d, 12, 10, "feu dans la cheminée du conservateur");
    b.lumiere(3.95, 1.25, 12.6, 0xffc070, 3, 5, "bougies sur la banque de prêt");
  } else {
    b.lumiere(9.6, 0.9, -24.6, 0xffc070, 5, 7, "lampe à huile du coin du lecteur");
    b.lumiere(19.2, 1.3, -9.4, 0x8fd0ff, 3, 5, "borne de résumés qui luit encore");
    b.lumiere(30.3, 1.4, -7.6, 0x6dffa8, 3, 5, "voyant de la borne de recharge Watty");
  }

  // Recentrer sur le lot de la carte : la géométrie et les données de jeu.
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

// ---------- Les sols ----------

function sols(k) {
  const { c, m, usure } = k;
  const o = CENTRES[k.id];
  const lot = LOTS[k.id];
  // Le terrain : herbe jaunie, la ville a reculé
  c.pave(o.x - lot.l / 2, -0.03, o.z - lot.p / 2, o.x + lot.l / 2, 0, o.z + lot.p / 2, COUL.herbe, m.mat, { crasse: false, nuance: 0 });
  // La salle de lecture : un parquet rond
  c.poser(geoCylindre(RI + 0.1, SOL, 24), m.parquet, 0xc9b08a, { x: RC.x, y: SOL / 2, z: RC.z }, { crasse: false, nuance: 0 });
  // Le socle de pierre du bâtiment (il dépasse un peu)
  c.poser(geoCylindre(RM + 0.75, 0.05, 24), m.pierre, COUL.pierreGrise, { x: RC.x, y: 0.025, z: RC.z }, { crasse: false, nuance: 0 });
  if (k.rot) {
    // Vestibule dallé, portique, ailes parquetées
    // (le dallage s'arrête au bord du parquet de la rotonde)
    c.pave(-3, 0, 8.05, 3, SOL, 16, 0xcfc6b0, m.pierre, { crasse: false, nuance: 0 });
    for (const sx of [-1, 1]) c.pave(sx > 0 ? 3 : -6, 0, 7.6, sx > 0 ? 6 : -3, SOL, 16, 0xcfc6b0, m.pierre, { crasse: false, nuance: 0 });
    c.pave(-9.6, 0, 16, 9.6, SOL, 19.4, 0xc4bca8, m.pierre, { crasse: false, nuance: 0 });
    c.pave(-22.3, 0, 7.2, -6, SOL, 16.3, 0xb89a74, m.parquet, { crasse: false, nuance: 0 });
    c.pave(6, 0, 7.2, 12.5, SOL, 16.3, 0xa88a64, m.parquet, { crasse: false, nuance: 0 });
    c.pave(12.5, 0, 7.2, 22.3, SOL, 16.3, 0xc8b898, m.parquet, { crasse: false, nuance: 0 });
  }
  // Le sol des magasins (ciment) et de l'aile 2.0 (résine blanche, salie)
  if (dansLot(k, 0, -14)) c.pave(-13.3, 0, -26.3, 13.3, SOL, -12.3, 0xb6b0a4, m.enduit, { crasse: false, nuance: 0 });
  if (dansLot(k, 15, -5)) {
    c.pave(14, 0, -14, 32, SOL, 4, COUL.resine, m.lisse, { crasse: false, nuance: 0 });
    c.pave(10.4, 0, -3.5, 14, SOL, -0.5, COUL.resine, m.lisse, { crasse: false, nuance: 0 });
  }
  if (k.mag) {
    // La cour de service derrière les magasins et l'allée qui longe l'aile 2.0
    c.pave(-16, 0, -29, 34, 0.03, -26.6, COUL.asphalte, m.mat, { crasse: false, nuance: 0 });
    c.pave(13.6, 0, 4, 34, 0.03, 7, COUL.dalle, m.pierre, { crasse: false, nuance: 0 });
    semerTouffes(c, -16, -29, 34, -26.6, Math.round(50 * usure), PALETTE.herbeSeche, 0.03);
    semerTouffes(c, 13.5, 4.2, 34, 7, Math.round(30 * usure), PALETTE.herbeSeche, 0.03);
  }
}

// ---------- Le tambour de la rotonde ----------

/** Le type de chaque pan du tambour (repéré par l'angle de son milieu, en degrés). */
function pan(i) {
  const dg = Math.round((i * 360) / NS) % 360;
  const porte = dg === 0 || dg === 90 || dg === 270;
  const fond = dg >= 150 && dg <= 300; // côté nord-ouest, loin de la caméra : murs entiers
  return { dg, th: i * DA, porte, fond };
}

/** Une boîte tangente au cercle de rayon r, centrée sur l'angle th, de longueur l (le long), épaisseur ep (radiale). */
function tangente(ch, r, th, l, y1, y2, ep, couleur, mat, options = {}) {
  const [x, z] = pol(r, th);
  ch.boite(l, y2 - y1, ep, couleur, { x, y: (y1 + y2) / 2, z, ry: Math.atan2(-Math.cos(th), -Math.sin(th)) }, mat, { crasse: false, ...options });
}

/** Pose pour un plan (PlaneGeometry) au rayon r, angle th, tourné vers le centre. */
function versCentre(r, th, y) {
  const [x, z] = pol(r, th);
  return { x, y, z, ry: Math.atan2(-Math.cos(th), -Math.sin(th)) };
}

function rotonde(k) {
  const { c, m, usure } = k;
  const T = k.Ro;
  const L = 2 * RM * Math.sin(DA / 2);
  for (let i = 0; i < NS; i++) {
    const { dg, th, porte, fond } = pan(i);
    const a = pol(RM, th + DA / 2 + 0.004);
    const b = pol(RM, th - DA / 2 - 0.004);
    const ouv = [];
    if (porte) ouv.push({ u: L / 2, l: 2.2, bas: 0, haut: 3.6, type: "vide" });
    if (dg < 60 || dg > 120) ouv.push({ u: L / 2, l: 1.25, bas: 7.0, haut: 9.0, type: "fenetre", croisillons: 1, traverses: 2, bris: k.bris, cadre: COUL.fonte, matCadre: m.tole });
    const breches = dg === 240 ? [{ u: L / 2, l: 3, profondeur: 0.6 + 1.6 * usure }] : [];
    murCoupe(k, a, b, { h: HD, ep: EPR, cut: fond ? 4.4 : CUT, couche: T, couleur: COUL.pierre, mat: m.pierre, interieur: { couleur: COUL.enduit, mat: m.enduit }, ouvertures: ouv, breches });
    // Linteau et clef au-dessus des portes
    if (porte) {
      const ch = fond ? c : T;
      tangente(ch, RM + 0.42, th, 2.9, 3.6, 4.2, 0.12, COUL.pierreClaire, m.pierre);
      tangente(ch, RM + 0.48, th, 0.5, 3.55, 4.3, 0.16, COUL.pierreClaire, m.pierre);
    }
    // Dehors : socle, pilastres aux angles, bandeau, corniche, attique de cuivre
    tangente(c, RM + 0.45, th, L + 0.1, 0, 0.7, 0.14, COUL.pierreGrise, m.pierre);
    const thj = th + DA / 2;
    const [px, pz] = pol(RM + 0.5, thj);
    const ryj = Math.atan2(-Math.cos(thj), -Math.sin(thj));
    c.boite(0.6, CUT, 0.22, COUL.pierreClaire, { x: px, y: CUT / 2, z: pz, ry: ryj }, m.pierre);
    T.boite(0.6, HD - 0.4 - CUT, 0.22, COUL.pierreClaire, { x: px, y: (HD - 0.4 + CUT) / 2, z: pz, ry: ryj }, m.pierre, { crasse: false });
    tangente(T, RM + 0.48, th, L + 0.2, 4.3, 4.6, 0.18, COUL.pierreClaire, m.pierre);
    tangente(T, RM + 0.55, th, L + 0.35, HD - 0.4, HD - 0.1, 0.32, COUL.pierreClaire, m.pierre);
    tangente(T, RM + 0.68, th, L + 0.45, HD - 0.1, HD + 0.15, 0.6, COUL.pierreClaire, m.pierre);
    tangente(T, RB + 0.1, th, 2 * (RB + 0.1) * Math.sin(DA / 2) + 0.06, HD + 0.15, YB, 0.35, COUL.cuivreVert, m.tole);
    // Dedans : la frise de la devise sous la corniche (lisible côté nord-ouest)
    const [u0, u1] = dg >= 135 && dg <= 300 ? [((300 - dg) / 180) * 0.94 + 0.03, ((300 - dg + 15) / 180) * 0.94 + 0.03] : [0, 0.02];
    panneau(T, m.enseignes, R.devise, versCentre(RI - 0.03, th, HD - 0.62), L * 0.96, 0.42, u0, u1);
    tangente(T, RI - 0.12, th, L * 0.96, HD - 0.4, HD - 0.25, 0.25, COUL.chene, m.satin);
  }
  // La brèche du haut du tambour : quelques pierres tombées sur la galerie et dehors
  if (usure > 0.3) {
    const [gx, gz] = pol(RM + 2, deg(240));
    gravats(c, gx, gz, 1.6, Math.round(14 * usure), [COUL.pierre, COUL.pierreGrise, COUL.pierreClaire], 0);
  }
  // Le lierre monte le long du tambour, côté nord
  for (const dg of [200, 225, 315]) {
    const [x, z] = pol(RM + 0.45, deg(dg));
    lierre(c, x, 0, z, Math.atan2(Math.cos(deg(dg)), Math.sin(deg(dg))), 2.6, 5 + 3 * usure, Math.round(70 * usure));
  }
  // Mousse sur l'attique
  for (const dg of [210, 250, 330]) {
    const [x, z] = pol(RB, deg(dg));
    mousse(T, x, YB, z, 1, Math.round(4 * usure));
  }
}


// ---------- La coupole de verre et de fer ----------

function pointCoupole(u, th) {
  const r = RB * Math.cos(u);
  return [RC.x + r * Math.cos(th), YB + FLECHE * Math.sin(u), RC.z + r * Math.sin(th)];
}

function coupole(k) {
  const { m, usure } = k;
  const T = k.Ro;
  const N = 16;
  const RANGS = 5;
  const RL = 1.6; // rayon du lanternon
  const umax = Math.acos(RL / RB);
  const us = Array.from({ length: RANGS + 1 }, (_, i) => (i / RANGS) * umax);
  const ths = Array.from({ length: N + 1 }, (_, j) => (j / N) * TAU);
  const fer = COUL.fonte;
  // Les vitres : entières, salies, moussues en bas ; il en manque, surtout au-dessus de l'arbre (côté ouest-sud-ouest)
  const pManque = 0.1 + 0.4 * usure;
  for (let r = 0; r < RANGS; r++) for (let j = 0; j < N; j++) {
    const thm = ((j + 0.5) / N) * TAU;
    const d = Math.abs(((thm - deg(205) + Math.PI * 3) % TAU) - Math.PI);
    const prochesArbre = d < 0.5 && r >= 0 && r <= 3;
    const manque = prochesArbre ? r !== 3 || usure > 0.5 : k.c.hasard() < pManque * (r === 4 ? 1.4 : 1);
    const e = 0.006;
    const p = [pointCoupole(us[r] + e, ths[j] + e), pointCoupole(us[r] + e, ths[j + 1] - e), pointCoupole(us[r + 1] - e, ths[j + 1] - e), pointCoupole(us[r + 1] - e, ths[j] + e)];
    if (manque) {
      if (T.hasard() < 0.5) {
        // Un éclat resté pris dans le fer
        const g = geoQuad([p[0], p[1], [(p[1][0] + p[2][0]) / 2, (p[1][1] + p[2][1]) / 2, (p[1][2] + p[2][2]) / 2], p[1]]);
        T.poser(g, m.verre, 0xe8eef0, {}, { crasse: false, nuance: 0 });
        g.dispose();
      }
      continue;
    }
    const teinte = r === 0 ? (T.hasard() < 0.5 ? 0x9fb08a : 0xc8d0c0) : T.hasard() < 0.25 ? 0xdfe6e0 : 0xffffff;
    const g = geoQuad(p);
    T.poser(g, m.verre, teinte, {}, { crasse: false, nuance: 0 });
    g.dispose();
  }
  // Les côtes de fer (méridiens) et les cercles
  for (let j = 0; j < N; j++) for (let r = 0; r < RANGS; r++) T.poutre(pointCoupole(us[r], ths[j]), pointCoupole(us[r + 1], ths[j]), 0.13, fer, m.tole);
  for (let r = 1; r <= RANGS; r++) for (let j = 0; j < N; j++) T.poutre(pointCoupole(us[r], ths[j]), pointCoupole(us[r], ths[j + 1]), r === RANGS ? 0.16 : 0.09, fer, m.tole);
  // Une côte tordue, qui pend vers l'intérieur au-dessus de l'arbre
  if (usure > 0.4) {
    const p0 = pointCoupole(us[2], deg(202));
    T.poutre(p0, [p0[0] + 1.2, p0[1] - 2.2 * usure, p0[2] + 0.4], 0.1, PALETTE.rouille, m.tole);
  }
  // Le lanternon : poteaux, vitres (cassées), chapeau de zinc, épi
  const yl = YB + FLECHE * Math.sin(umax);
  for (let j = 0; j < 8; j++) {
    const th = (j / 8) * TAU;
    const [x, z] = pol(RL, th);
    T.boite(0.12, 1.3, 0.12, fer, { x, y: yl + 0.65, z }, m.tole);
    if (j % 3 !== 0) {
      const [x2, z2] = pol(RL, th + TAU / 8);
      const g = geoQuad([[x, yl + 0.1, z], [x2, yl + 0.1, z2], [x2, yl + 1.25, z2], [x, yl + 1.25, z]]);
      T.poser(g, m.verre, 0xffffff, {}, { crasse: false, nuance: 0 });
      g.dispose();
    }
  }
  T.poser(geoCone(0.25, RL + 0.35, 0.9, 8), m.tole, COUL.cuivreVert, { x: RC.x, y: yl + 1.75, z: RC.z }, { crasse: false });
  T.poser(geoIco(0.22, 0), m.tole, PALETTE.dore, { x: RC.x, y: yl + 2.35, z: RC.z }, { crasse: false });
  T.tube([RC.x, yl + 2.3, RC.z], [RC.x, yl + 3.1, RC.z], 0.035, fer, m.tole, 4);
  // Des nids sur les cercles de fer, les oiseaux sont partis
  for (const [u, th] of [[us[1], deg(40)], [us[2], deg(300)], [us[4], deg(140)]]) {
    const p = pointCoupole(u, th);
    nid(T, p[0] * 0.97 + RC.x * 0.03, p[1] + 0.05, p[2] * 0.97 + RC.z * 0.03, 0.8);
  }
}

/** Un nid de brindilles, abandonné. */
function nid(c, x, y, z, s = 1) {
  c.poser(geoIco(0.22, 0), matiere(0.95), 0x6a5638, { x, y: y + 0.06 * s, z, e: [1.3 * s, 0.5 * s, 1.3 * s], ry: c.hasard() * 3 }, { crasse: false, nuance: 0.08 });
  c.poser(geoIco(0.13, 0), matiere(0.95), 0x3a2e20, { x, y: y + 0.1 * s, z, e: [1.2 * s, 0.4 * s, 1.2 * s] }, { crasse: false });
  for (let i = 0; i < 4; i++) {
    const a = c.hasard() * TAU;
    c.boite(0.45 * s, 0.015, 0.015, 0x8a7a5a, { x: x + Math.cos(a) * 0.15 * s, y: y + 0.1 * s, z: z + Math.sin(a) * 0.15 * s, ry: c.hasard() * 3, rz: c.entre(-0.3, 0.3) }, matiere(0.95), { crasse: false });
  }
}

/** Fientes blanches au sol, sous un nid. */
function fientes(c, x, z, r, n, y = SOL) {
  for (let i = 0; i < n; i++) {
    const a = c.hasard() * TAU;
    const d = Math.sqrt(c.hasard()) * r;
    const s = c.entre(0.04, 0.12);
    c.poser(PLAT, matiere(0.95), 0xeeeae0, { x: x + Math.cos(a) * d, y: y + 0.004, z: z + Math.sin(a) * d, ry: c.hasard() * 3, e: [s, 1, s * c.entre(0.6, 1.2)] }, { crasse: false, nuance: 0.05 });
  }
}

// ---------- Le mobilier des livres ----------

const corde = (r) => 2 * r * Math.sin(DA / 2);

/** Une chaise de bois courbé ; elle regarde vers +z local. `etat` : « debout », « renversee », « couchee ». */
function chaise(c, x, z, ry, etat = "debout", s = 1, couleur = COUL.chene) {
  const pose = etat === "renversee" ? { x, y: 0.42 * s + SOL - 0.2 * s, z, ry, rx: -Math.PI / 2 + 0.25 } : etat === "couchee" ? { x, y: SOL + 0.22 * s, z, ry, rz: Math.PI / 2 } : { x, y: SOL, z, ry };
  c.repere(pose, () => {
    c.boite(0.42 * s, 0.04 * s, 0.42 * s, couleur, { y: 0.45 * s }, matiere(0.6), { nuance: 0.06 });
    c.boite(0.4 * s, 0.32 * s, 0.03 * s, couleur, { y: 0.78 * s, z: -0.2 * s, rx: -0.1 }, matiere(0.6), { nuance: 0.06 });
    for (const a of [-0.18, 0.18]) c.boite(0.035 * s, 0.45 * s, 0.38 * s, couleur, { x: a * s, y: 0.225 * s }, matiere(0.6));
  });
}

/** Une lampe de lecture en laiton à abat-jour vert. `tombee` : couchée sur la table. */
function lampeVerte(c, x, y, z, ry, tombee = false) {
  const m = matieres();
  if (!GEO.abat) GEO.abat = new THREE.CylinderGeometry(0.11, 0.13, 0.42, 6, 1, false, 0, Math.PI).rotateZ(Math.PI / 2);
  c.repere(tombee ? { x, y: y + 0.12, z, ry, rx: Math.PI / 2 - 0.2 } : { x, y, z, ry }, () => {
    c.poser(geoCylindre(0.1, 0.03, 8), m.metal, COUL.laiton, { y: 0.015 }, { crasse: false });
    c.tube([0, 0.02, 0], [0, 0.36, 0], 0.014, COUL.laiton, m.metal, 4);
    c.poser(GEO.abat, m.satin, COUL.vertLampe, { y: 0.38 }, { crasse: false, nuance: 0.03 });
  });
}

/** Une pile de livres posés à plat. */
function pileLivres(c, x, y, z, n, ry = 0, tons = TONS_LIVRES) {
  let h = y;
  for (let i = 0; i < n; i++) {
    const t = c.entre(0.03, 0.07);
    c.boite(c.entre(0.17, 0.26), t, c.entre(0.23, 0.33), tons[Math.floor(c.hasard() * tons.length)], { x: x + c.entre(-0.02, 0.02), y: h + t / 2, z: z + c.entre(-0.02, 0.02), ry: ry + c.entre(-0.3, 0.3) }, matiere(0.9), { crasse: false, nuance: 0.06 });
    h += t;
  }
}

/** Un tas de livres tombés, en vrac (les gonflés ont pris l'eau, la mousse y pousse). */
function tasLivres(c, x, z, rayon, n, y = SOL, gonfles = false) {
  const tons = gonfles ? TONS_GONFLES : TONS_LIVRES;
  for (let i = 0; i < n; i++) {
    const a = c.hasard() * TAU;
    const r = Math.sqrt(c.hasard()) * rayon;
    const haut = (1 - r / rayon) * rayon * 0.35;
    const t = gonfles ? c.entre(0.06, 0.12) : c.entre(0.03, 0.07);
    c.boite(c.entre(0.16, 0.28), t, c.entre(0.22, 0.34), tons[Math.floor(c.hasard() * tons.length)], { x: x + Math.cos(a) * r, y: y + t / 2 + haut * c.hasard(), z: z + Math.sin(a) * r, ry: c.hasard() * 3, rx: c.entre(-0.5, 0.5), rz: c.entre(-0.5, 0.5) }, matiere(0.9), { crasse: false, nuance: 0.08 });
  }
}

/** Un livre ouvert, pages en V. */
function livreOuvert(c, x, y, z, ry, s = 1, teinte = 0x5a3a2a) {
  c.repere({ x, y, z, ry }, () => {
    c.boite(0.46 * s, 0.015, 0.32 * s, teinte, { y: 0.008 }, matiere(0.9), { crasse: false });
    c.boite(0.21 * s, 0.025, 0.29 * s, COUL.papier, { x: -0.11 * s, y: 0.03, rz: 0.1 }, matiere(0.95), { crasse: false, nuance: 0.04 });
    c.boite(0.21 * s, 0.025, 0.29 * s, COUL.papier, { x: 0.11 * s, y: 0.03, rz: -0.1 }, matiere(0.95), { crasse: false, nuance: 0.04 });
  });
}

/** Une échelle de bibliothèque, du sol au rail : `t` = direction le long des rayonnages. */
function echelle(c, base, haut, t) {
  const m = matieres();
  const [tx, tz] = t;
  const l = 0.22;
  for (const s of [-1, 1]) c.poutre([base[0] + tx * l * s, SOL, base[1] + tz * l * s], [haut[0] + tx * l * s, haut[1], haut[2] + tz * l * s], 0.05, COUL.chene, m.satin);
  const n = Math.floor(haut[1] / 0.32);
  for (let i = 1; i < n; i++) {
    const f = i / n;
    const px = base[0] + (haut[0] - base[0]) * f;
    const py = SOL + (haut[1] - SOL) * f;
    const pz = base[1] + (haut[2] - base[1]) * f;
    c.poutre([px - tx * l, py, pz - tz * l], [px + tx * l, py, pz + tz * l], 0.03, COUL.cheneClair, m.satin);
  }
  // Les crochets de laiton sur le rail, les roulettes au pied
  for (const s of [-1, 1]) c.boite(0.04, 0.12, 0.08, COUL.laiton, { x: haut[0] + tx * l * s, y: haut[1] + 0.04, z: haut[2] + tz * l * s }, m.metal, { crasse: false });
}

/** Une lampe à huile (le lecteur) : socle de laiton, réservoir, verre. */
function lampeHuile(c, x, y, z) {
  const m = matieres();
  c.poser(geoCylindre(0.07, 0.03, 8), m.metal, COUL.laiton, { x, y: y + 0.015, z }, { crasse: false });
  c.poser(geoIco(0.07, 0), m.metal, COUL.laiton, { x, y: y + 0.09, z, e: [1, 0.8, 1] }, { crasse: false });
  c.poser(geoCylindre(0.04, 0.16, 6, true), m.verre, 0xfff4d8, { x, y: y + 0.22, z }, { crasse: false });
}

/** Des bougies fondues, en grappe. */
function bougies(c, x, y, z, n) {
  for (let i = 0; i < n; i++) {
    const h = c.entre(0.04, 0.16);
    c.poser(geoCylindre(0.022, h, 5), matiere(0.6), 0xeee6d0, { x: x + c.entre(-0.08, 0.08), y: y + h / 2, z: z + c.entre(-0.08, 0.08) }, { crasse: false, nuance: 0.03 });
  }
  c.boite(0.2, 0.01, 0.16, 0xeee6d0, { x, y: y + 0.005, z, ry: c.hasard() * 3 }, matiere(0.6), { crasse: false });
}

/** Une table de lecture : plateau, pieds, entretoise, lampes ; `renversee` : sur le flanc. */
function tableLecture(k, x, z, ry, L, l, opts = {}) {
  const { c, m } = k;
  const { lampes = 2, renversee = false, chaises = 3, livres = true } = opts;
  c.repere(renversee ? { x, y: SOL + l / 2, z, ry, rx: Math.PI / 2 - 0.1 } : { x, y: SOL, z, ry }, () => {
    c.boite(L, 0.06, l, COUL.chene, { y: 0.75 }, m.satin, { nuance: 0.03 });
    c.boite(L - 0.2, 0.012, l - 0.3, 0x3f5a46, { y: 0.785 }, m.mat, { crasse: false }); // le cuir vert du plateau
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.boite(0.09, 0.72, 0.09, COUL.chene, { x: sx * (L / 2 - 0.15), y: 0.36, z: sz * (l / 2 - 0.12) }, m.satin);
    c.boite(L - 0.3, 0.08, 0.06, COUL.chene, { y: 0.22 }, m.satin);
    if (!renversee) {
      for (let i = 0; i < lampes; i++) lampeVerte(c, (i - (lampes - 1) / 2) * (L / lampes), 0.79, 0, c.hasard() < 0.2 ? 0.5 : 0, c.hasard() < 0.15);
      if (livres) {
        for (let i = 0; i < 2; i++) if (c.hasard() < 0.7) pileLivres(c, c.entre(-L / 2 + 0.4, L / 2 - 0.4), 0.79, (c.hasard() < 0.5 ? -1 : 1) * l * 0.25, 2 + Math.floor(c.hasard() * 4));
        if (c.hasard() < 0.5) livreOuvert(c, c.entre(-L / 3, L / 3), 0.79, l * 0.28, c.entre(-0.3, 0.3));
      }
    }
  });
  if (!renversee && chaises) {
    // Les chaises de part et d'autre (dans le repère monde)
    const cx = Math.cos(-ry);
    const sx = Math.sin(-ry);
    for (const cote of [-1, 1]) for (let i = 0; i < chaises; i++) {
      const r = c.hasard();
      if (r < 0.22) continue;
      const u = (i - (chaises - 1) / 2) * (L / chaises) + c.entre(-0.15, 0.15);
      const v = cote * (l / 2 + 0.3 + c.entre(0, 0.35));
      const px = x + cx * u - sx * v;
      const pz = z + sx * u + cx * v;
      const etat = r < 0.4 ? "renversee" : r < 0.48 ? "couchee" : "debout";
      chaise(c, px, pz, ry + (cote > 0 ? Math.PI : 0) + c.entre(-0.4, 0.4), etat);
    }
  }
  // L'obstacle : l'axe de la table
  const cx = Math.cos(-ry);
  const sx = Math.sin(-ry);
  k.b.obstacle(x - cx * (L / 2), z - sx * (L / 2), x + cx * (L / 2), z + sx * (L / 2), "table");
}

// ---------- La salle de lecture ----------

function salleDeLecture(k) {
  const { c, m, usure } = k;
  const T = k.Ro;
  const effondre = (dg) => dg === 240 || dg === 255;
  for (let i = 0; i < NS; i++) {
    const { dg, th, porte, fond } = pan(i);
    const a1 = th - DA / 2;
    const a2 = th + DA / 2;
    const thj = a2;
    // --- La galerie (inaccessible) : plancher, garde-corps de fonte, rayonnages du haut, consoles ---
    if (!effondre(dg)) {
      const g = geoSecteur(8.45, RI + 0.02, a1, a2, 0.3);
      T.poser(g, m.satin, 0x8a6a4a, { x: RC.x, y: GT, z: RC.z }, { crasse: false, nuance: 0.02 });
      g.dispose();
      tangente(T, 8.47, th, corde(8.47) + 0.02, GT - 0.5, GT - 0.05, 0.1, COUL.chene, m.satin);
      panneau(T, m.enseignes, R.balustre, { ...versCentre(8.5, th, GT + 0.47), teinte: 0x4e504a }, corde(8.5) - 0.04, 0.94);
      tangente(T, 8.5, th, corde(8.5) + 0.04, GT + 0.94, GT + 1.0, 0.09, COUL.laiton, m.tole);
    }
    planLivres(T, versCentre(9.6, th, GT + 1), corde(9.6) - 0.02, 2, effondre(dg) ? 0xb8b8a0 : T.hasard() < 0.3 ? 0xe8e0d0 : 0xffffff);
    tangente(T, 9.78, th, corde(9.78), GT + 2, GT + 2.14, 0.56, COUL.chene, m.satin);
    tangente(T, 9.8, thj, 0.09, GT, GT + 2.1, 0.42, COUL.boisLivres, m.satin);
    if (!effondre(dg) && !effondre(dg + 15)) tangente(T, 9.25, thj, 0.12, GT - 0.75, GT - 0.3, 1.5, COUL.fonte, m.tole);
    // --- Les colonnettes de fonte qui portent la galerie (visibles en bas) ---
    if (!effondre(dg) && !effondre(dg + 15)) {
      const [x, z] = pol(8.6, thj);
      c.tube([x, SOL, z], [x, GT - 0.3, z], 0.07, COUL.fonte, m.tole, 6);
      c.boite(0.24, 0.16, 0.24, COUL.fonte, { x, y: GT - 0.38, z }, m.tole);
      c.boite(0.22, 0.12, 0.22, COUL.fonte, { x, y: SOL + 0.06, z }, m.tole);
    }
    // --- Les rayonnages du bas ---
    if (porte) continue;
    const ch = corde(9.6) - 0.02;
    if (fond) {
      const teinte = effondre(dg) || dg === 225 ? 0xc0c8a8 : c.hasard() < 0.3 ? 0xece4d4 : 0xffffff;
      planLivres(c, versCentre(9.6, th, 11 / 6), ch, 11 / 3, teinte);
      tangente(c, 9.78, th, corde(9.78), 11 / 3, 11 / 3 + 0.18, 0.52, COUL.chene, m.satin);
      tangente(c, 9.57, th, ch, 0, 0.14, 0.04, COUL.boisLivres, m.satin);
      tangente(c, 9.8, thj, 0.09, 0, 11 / 3 + 0.05, 0.44, COUL.boisLivres, m.satin);
      tangente(c, 9.8, a1, 0.09, 0, 11 / 3 + 0.05, 0.44, COUL.boisLivres, m.satin);
      // Le rail de laiton des échelles
      const p1 = pol(9.42, a1 + 0.01);
      const p2 = pol(9.42, a2 - 0.01);
      c.poutre([p1[0], 3.45, p1[1]], [p2[0], 3.45, p2[1]], 0.035, COUL.laiton, m.metal);
      // Quelques livres tombés au pied
      if (c.hasard() < 0.6) {
        const [x, z] = pol(9.05, th + c.entre(-0.08, 0.08));
        tasLivres(c, x, z, 0.5, 3 + Math.floor(c.hasard() * 4));
      }
    } else {
      planLivres(c, versCentre(9.6, th, 0.5), ch, 1, c.hasard() < 0.3 ? 0xece4d4 : 0xffffff);
      tangente(c, 9.76, th, corde(9.76), 1.0, 1.07, 0.52, COUL.chene, m.satin);
      tangente(c, 9.8, thj, 0.09, 0, 1.07, 0.44, COUL.boisLivres, m.satin);
      tangente(c, 9.8, a1, 0.09, 0, 1.07, 0.44, COUL.boisLivres, m.satin);
      if (c.hasard() < 0.4) {
        const [x, z] = pol(9.7, th + c.entre(-0.06, 0.06));
        pileLivres(c, x, 1.07, z, 2 + Math.floor(c.hasard() * 3), th);
      }
    }
  }

  // --- La travée effondrée de la galerie : un pan de plancher couché contre les rayonnages, le garde-corps au sol ---
  {
    const th = deg(248);
    const [x, z] = pol(8.1, th);
    c.repere({ x, y: 0, z, ry: Math.atan2(-Math.cos(th), -Math.sin(th)) }, () => {
      c.boite(2.8, 0.28, 1.7, 0x9a7a58, { y: 0.75, z: 0.1, rx: 0.75, rz: 0.08 }, m.parquet, { nuance: 0.03 });
      c.boite(2.4, 0.4, 0.1, COUL.chene, { y: 0.32, z: 0.95, rx: 0.75 }, m.satin);
      panneau(c, m.enseignes, R.balustre, { y: SOL + 0.05, z: 1.9, x: -0.3, rx: -Math.PI / 2, ry: 0.3, teinte: 0x4e504a }, 2.2, 0.94);
    });
    // Ce qui reste accroché en haut : un bout de plancher qui pend
    const [hx, hz] = pol(9.2, deg(233));
    T.repere({ x: hx, y: GT, z: hz, ry: Math.atan2(-Math.cos(deg(233)), -Math.sin(deg(233))) }, () => {
      T.boite(1.3, 0.28, 1.4, 0x8a6a4a, { x: 0.75, y: -0.45, rz: -0.7 }, m.satin);
    });
    // Une colonnette tombée
    const [cx1, cz1] = pol(8.6, deg(247.5));
    c.tube([cx1, SOL + 0.07, cz1], [cx1 - 1.8, SOL + 0.07, cz1 + 3.5], 0.07, COUL.fonte, m.tole, 6);
    tasLivres(c, ...pol(7.6, deg(250)), 1.9, Math.round(26 + 30 * usure), SOL, false);
    tasLivres(c, ...pol(6.6, deg(244)), 1.1, Math.round(10 + 14 * usure), SOL, true);
    gravats(c, ...pol(8.4, deg(255)), 1.1, Math.round(6 + 10 * usure), [COUL.enduit, COUL.pierre, 0x9a7a58], SOL);
    mousse(c, ...(() => { const [a, b] = pol(7.2, deg(256)); return [a, SOL, b]; })(), 1.2, Math.round(6 * usure));
  }

  // --- Les échelles sur rail ---
  for (const dg of [195, 228, 288]) {
    const th = deg(dg);
    const base = pol(8.75, th);
    const [hx, hz] = pol(9.36, th);
    echelle(c, base, [hx, 3.45, hz], [-Math.sin(th), Math.cos(th)]);
  }
  // Une échelle décrochée, couchée au sol
  {
    const th = deg(168);
    const [x, z] = pol(7.6, th);
    c.repere({ x, y: SOL + 0.04, z, ry: -th + 0.4 }, () => {
      for (const s of [-1, 1]) c.boite(3.4, 0.05, 0.05, COUL.chene, { z: s * 0.22 }, m.satin);
      for (let i = 0; i < 10; i++) c.boite(0.03, 0.03, 0.44, COUL.cheneClair, { x: -1.5 + i * 0.33 }, m.satin);
    });
  }

  // --- L'escalier en colimaçon vers la galerie : les marches du haut sont tombées ---
  {
    const [sx, sz] = pol(8.0, deg(318));
    c.tube([sx, SOL, sz], [sx, GT + 1, sz], 0.08, COUL.fonte, m.tole, 6);
    for (let i = 0; i < 14; i++) {
      if (i > 7 && c.hasard() < 0.35 + usure * 0.5) continue;
      const a = i * 0.48;
      c.repere({ x: sx, y: SOL + 0.3 + i * 0.32, z: sz, ry: a }, () => c.boite(0.85, 0.05, 0.36, COUL.fonte, { x: 0.45 }, m.tole));
    }
    tasLivres(c, sx + 0.8, sz + 0.6, 0.5, 4);
  }

  // --- La grande table ronde, sous le lanternon : le coin du lecteur ---
  {
    const x = RC.x;
    const z = RC.z;
    c.poser(geoCylindre(2.1, 0.08, 16), m.satin, COUL.chene, { x, y: 0.78, z }, { crasse: false, nuance: 0 });
    c.poser(geoCylindre(1.9, 0.014, 16), m.mat, 0x3f5a46, { x, y: 0.826, z }, { crasse: false });
    c.poser(geoCylindre(0.38, 0.72, 8), m.satin, COUL.boisLivres, { x, y: 0.4, z }, { crasse: false });
    for (let j = 0; j < 4; j++) c.boite(1.6, 0.1, 0.16, COUL.boisLivres, { x, y: SOL + 0.05, z, ry: (j * Math.PI) / 4 }, m.satin);
    for (let j = 0; j < 4; j++) {
      const a = Math.PI / 4 + (j * Math.PI) / 2;
      lampeVerte(c, x + Math.cos(a) * 1.45, 0.83, z + Math.sin(a) * 1.45, -a + Math.PI / 2, j === 2);
    }
    // Ce que le lecteur a laissé : lampe à huile, bougies, livres ouverts, son carnet, une couverture
    lampeHuile(c, x + 0.5, 0.83, z + 0.3);
    bougies(c, x - 0.6, 0.83, z + 0.9, 5);
    livreOuvert(c, x + 0.3, 0.83, z + 1.0, 0.2, 1.3, 0x2f4a3a);
    livreOuvert(c, x - 0.9, 0.83, z - 0.2, 1.4, 1.1, 0x7a2630);
    livreOuvert(c, x + 1.1, 0.83, z - 0.6, -0.8, 1, 0x2d3a55);
    pileLivres(c, x - 0.2, 0.83, z - 1.2, 7, 0.3);
    pileLivres(c, x + 0.2, 0.83, z - 0.9, 4, -0.6);
    pileLivres(c, x - 1.2, 0.83, z + 0.6, 5, 1.1);
    c.boite(0.15, 0.02, 0.21, 0x3b2a1e, { x: x + 0.75, y: 0.84, z: z + 0.75, ry: 0.5 }, m.mat, { crasse: false });
    c.boite(0.09, 0.012, 0.012, 0x1f2526, { x: x + 0.8, y: 0.856, z: z + 0.6, ry: 1.1 }, m.mat, { crasse: false });
    c.poser(geoCylindre(0.045, 0.1, 6), m.lisse, 0xd8d0c0, { x: x + 0.95, y: 0.88, z: z + 0.25 }, { crasse: false });
    for (let j = 0; j < 7; j++) {
      const a = (j / 7) * TAU + 0.3;
      if (j === 3) continue;
      chaise(c, x + Math.cos(a) * 2.6, z + Math.sin(a) * 2.6, Math.atan2(-Math.cos(a), -Math.sin(a)), j === 5 ? "renversee" : "debout");
    }
    // Une couverture sur le dossier d'une chaise, le sac du lecteur
    const ac = (1 / 7) * TAU + 0.3;
    c.boite(0.5, 0.5, 0.06, 0x6b4a3a, { x: x + Math.cos(ac) * 2.85, y: 0.65, z: z + Math.sin(ac) * 2.85, ry: -ac + Math.PI / 2 }, m.toile, { nuance: 0.05 });
    c.boite(0.4, 0.35, 0.25, 0x5a5a3f, { x: x + 2.0, y: SOL + 0.18, z: z + 2.3, ry: 0.6 }, m.toile);
    for (const [a1, a2] of [[0, 1], [1, 2], [2, 3], [3, 0]]) {
      const p = (a) => [x + Math.cos((a * Math.PI) / 2) * 2, z + Math.sin((a * Math.PI) / 2) * 2];
      k.b.obstacle(...p(a1), ...p(a2), "table");
    }
    // Le rai de lumière qui tombe du lanternon sur la table
    raiDeLumiere(c, [x, YB + FLECHE, z], [x + 0.4, 0.85, z + 0.5], 2.6);
    fientes(c, x + 0.4, z - 0.3, 1.2, Math.round(10 * usure), 0.835);
  }

  // --- Les tables rayonnantes ---
  for (const dg of [22.5, 67.5, 112.5, 157.5, 247.5, 292.5, 337.5]) {
    const th = deg(dg);
    const [x, z] = pol(5.3, th);
    tableLecture(k, x, z, -th, 3.6, 1.15, { renversee: dg === 247.5, lampes: 2 });
    if (dg === 112.5) {
      // La lampe de lecture du lecteur, branchée sur une batterie de survivant posée sous la table
      c.boite(0.32, 0.22, 0.18, 0x2b2d30, { x: x + 0.2, y: SOL + 0.11, z: z + 0.1, ry: th }, m.satin);
      c.boite(0.05, 0.03, 0.05, PALETTE.abondanceRouge, { x: x + 0.28, y: SOL + 0.235, z: z + 0.1 }, m.satin, { crasse: false });
      c.tube([x + 0.25, SOL + 0.22, z + 0.1], [x, 0.8, z + 0.05], 0.012, 0x1e1e1e, m.mat, 4);
    }
  }
  // Une table rayonnante cassée en deux contre l'arbre
  {
    const th = deg(202.5);
    const [x, z] = pol(6.7, th);
    c.boite(1.8, 0.06, 1.15, COUL.chene, { x, y: 0.45, z, ry: -th, rz: 0.5 }, m.satin);
    for (let i = 0; i < 3; i++) chaise(c, ...pol(c.entre(3.5, 7.5), th + c.entre(-0.35, 0.35)), c.hasard() * 6, i ? "couchee" : "renversee");
  }

  // --- L'arbre qui a percé le parquet ---
  {
    const [x, z] = pol(4.9, deg(205));
    // Le parquet soulevé et fendu autour du tronc, la terre, les racines
    c.poser(geoIco(1.1, 0), m.mat, PALETTE.terreSombre, { x, y: SOL - 0.25, z, e: [1.3, 0.35, 1.2] }, { crasse: false });
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + c.hasard() * 0.3;
      const r = c.entre(0.9, 1.5);
      c.boite(c.entre(0.6, 1.1), 0.03, 0.13, 0xb8986e, { x: x + Math.cos(a) * r, y: SOL + 0.12, z: z + Math.sin(a) * r, ry: -a + Math.PI / 2 + c.entre(-0.3, 0.3), rx: c.entre(-0.4, 0.4), rz: c.entre(-0.3, 0.3) }, m.mat, { nuance: 0.06 });
    }
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + 0.4;
      c.tube([x, SOL + 0.3, z], [x + Math.cos(a) * c.entre(1.2, 2.2), SOL + 0.02, z + Math.sin(a) * c.entre(1.2, 2.2)], 0.09, 0x5e4a36, m.mat, 4);
    }
    arbre(c, x, z, 8.5 + 1.5 * usure, "feuillu", SOL);
    semerTouffes(c, x - 2, z - 2, x + 2, z + 2, Math.round(30 * usure), PALETTE.herbe, SOL);
    tasLivres(c, x + 1.2, z + 1.1, 0.8, 9, SOL, true);
    // Le second rai, par les vitres manquantes au-dessus de l'arbre
    const p = pointCoupole(0.45, deg(205));
    raiDeLumiere(c, p, [x + 1.6, SOL + 0.02, z + 1.4], 2.4);
    // La flaque sous les vitres manquantes, la mousse, les livres gonflés
    const [fx, fz] = pol(3.4, deg(222));
    flaque(c, fx, fz, 1.2, SOL + 0.012);
    mousse(c, fx - 0.8, SOL, fz - 0.6, 1.3, Math.round(8 * usure));
    tasLivres(c, fx + 0.9, fz + 0.3, 0.6, 7, SOL, true);
  }

  // --- Les nids sur les corniches des rayonnages, les fientes en dessous ---
  for (const dg of [180, 285]) {
    const th = deg(dg);
    const [x, z] = pol(9.7, th);
    nid(c, x, 11 / 3 + 0.18, z, 1);
    const [fx, fz] = pol(8.9, th);
    fientes(c, fx, fz, 0.6, Math.round(8 * usure));
  }
  // Des pages et des feuilles mortes partout sur le parquet
  jonchee(c, RC.x - 7, RC.z - 7, RC.x + 7, RC.z + 7, Math.round(60 + 60 * usure), [COUL.papier, 0xd8d0b8, 0xc8c0a0, 0x9c7a45, 0xb08f55], SOL + 0.005);
  // La plaque SILENCE, à côté de la porte sud ; le panneau des cotes à côté de la porte nord
  panneau(c, m.enseignes, R.silence, versCentre(RI - 0.06, deg(76), 2.4), 0.8, 0.2);
  panneau(c, m.enseignes, R.cotes, versCentre(RI - 0.08, deg(258), 2.2), 1.0, 0.5);
}

/** Les pages qui tournoient dans le rai de lumière (un seul maillage, animé). */
function pagesQuiVolent(k) {
  const N = 14;
  const a = aleatoire(77);
  const pages = Array.from({ length: N }, () => ({ r: 0.4 + a() * 2.4, phi: a() * TAU, y: 1.4 + a() * 6, v: 0.15 + a() * 0.25, tour: a() * TAU, s: 0.16 + a() * 0.08 }));
  const pos = new Float32Array(N * 6 * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.MeshLambertMaterial({ color: 0xefe8d4, side: THREE.DoubleSide });
  const maillage = new THREE.Mesh(geo, mat);
  maillage.frustumCulled = false;
  const placer = (t) => {
    let o = 0;
    for (const p of pages) {
      const phi = p.phi + t * p.v * 0.6;
      const cx = RC.x + Math.cos(phi) * p.r;
      const cz = RC.z + Math.sin(phi) * p.r;
      const cy = p.y + Math.sin(t * 0.5 + p.tour) * 0.6;
      const ang = p.tour + t * 1.3;
      const inc = Math.sin(t * 0.9 + p.tour) * 0.8;
      const ux = Math.cos(ang) * p.s;
      const uz = Math.sin(ang) * p.s;
      const vx = -Math.sin(ang) * p.s * 1.3 * Math.cos(inc);
      const vz = Math.cos(ang) * p.s * 1.3 * Math.cos(inc);
      const vy = Math.sin(inc) * p.s * 1.3;
      const c0 = [cx - ux - vx, cy - vy, cz - uz - vz];
      const c1 = [cx + ux - vx, cy - vy, cz + uz - vz];
      const c2 = [cx + ux + vx, cy + vy, cz + uz + vz];
      const c3 = [cx - ux + vx, cy + vy, cz - uz + vz];
      for (const q of [c0, c1, c2, c0, c2, c3]) {
        pos[o++] = q[0];
        pos[o++] = q[1];
        pos[o++] = q[2];
      }
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
  };
  placer(0);
  maillage.userData.animer = (t) => placer(t);
  k.b.ajouter(maillage);
}

// ---------- Le vestibule ----------

/** Le bord du tambour, côté sud, à l'abscisse x (pour arrêter les toits du vestibule contre la rotonde). */
const bordTambour = (x) => RC.z + Math.sqrt(Math.max(0, (RM + 0.45) ** 2 - x * x));

function vestibule(k) {
  const { c, A, m, usure } = k;
  const pierre = { couleur: COUL.pierre, mat: m.pierre, interieur: { couleur: COUL.enduit, mat: m.enduit } };
  const cloison = { couleur: COUL.enduit, mat: m.enduit, interieur: { couleur: COUL.enduit, mat: m.enduit } };
  // La façade sur le portique : trois portes hautes à imposte
  const portes = [2.6, 6, 9.4].map((u) => ({ u, l: 1.9, bas: 0, haut: 4.6, type: "vide" }));
  murCoupe(k, [-6, 16], [6, 16], { h: HV, ep: 0.6, couche: A, ...pierre, ouvertures: portes });
  for (const u of [2.6, 6, 9.4]) {
    // Imposte vitrée et traverse, dans la couche
    A.repere({ x: -6 + u, y: 0, z: 16 }, () => {
      A.pave(-0.95, 3.5, -0.08, 0.95, 3.62, 0.08, COUL.fonte, m.tole);
      for (let i = -2; i <= 2; i++) A.pave(i * 0.38 - 0.02, 3.62, -0.02, i * 0.38 + 0.02, 4.6, 0.02, COUL.fonte, m.tole);
      if (u !== 6 || usure < 0.5) A.pave(-0.92, 3.62, -0.01, 0.92, 4.58, 0.01, 0xffffff, m.verre, { crasse: false });
      A.pave(-1.2, 4.6, 0.25, 1.2, 4.95, 0.42, COUL.pierreClaire, m.pierre);
    });
  }
  // Les vantaux : un ouvert, un tombé, un barricadé de planches
  c.repere({ x: -3.4 - 0.95, y: SOL, z: 15.9, ry: 1.2 }, () => {
    c.boite(0.92, 3.45, 0.08, 0x4a3628, { x: 0.46, y: 1.73 }, m.satin);
    c.boite(0.6, 1.2, 0.02, 0xffffff, { x: 0.46, y: 2.4, z: 0.05 }, m.verre, { crasse: false });
  });
  c.boite(0.95, 0.08, 3.4, 0x4a3628, { x: 0.3, y: SOL + 0.05, z: 14.1, ry: 0.15 }, m.satin);
  for (let i = 0; i < 3; i++) c.boite(2.1, 0.18, 0.04, PALETTE.boisGris, { x: 3.4, y: 0.8 + i * 0.9, z: 16.35, rz: [0.12, -0.08, 0.2][i] }, m.mat, { nuance: 0.06 });
  // Les murs latéraux (vers la salle des cartes et vers le bureau)
  murCoupe(k, [-6, 16], [-6, 7], { h: HV, ep: 0.5, couche: A, ...cloison, ouvertures: [{ u: 4, l: 1.5, bas: 0, haut: 3.2, type: "vide" }] });
  murCoupe(k, [6, 7], [6, 16], { h: HV, ep: 0.5, couche: A, ...cloison, ouvertures: [{ u: 3.5, l: 1.5, bas: 0, haut: 3.2, type: "vide" }] });
  for (const [x, z] of [[-6, 12], [6, 10.5]]) A.pave(x - 0.3, 3.2, z - 0.95, x + 0.3, 3.45, z + 0.95, COUL.pierreClaire, m.pierre);
  // Le plafond-toit du vestibule et l'entablement qui fait le tour (couche)
  for (let x = -6.3; x < 6.29; x += 1.05) {
    const z0 = bordTambour(Math.min(Math.abs(x), Math.abs(x + 1.05)));
    A.pave(x, HV - 0.25, z0 - 0.4, x + 1.05, HV, 16.3, COUL.enduit, m.enduit, { crasse: false, nuance: 0 });
  }
  for (const s of [-1, 1]) {
    A.pave(s * 6.25 - 0.25, HV, bordTambour(6.3) - 0.3, s * 6.25 + 0.25, 9.25, 16.3, COUL.pierreClaire, m.pierre, { crasse: false });
    A.pave(s * 6.25 - 0.45, 8.5, bordTambour(6.3) - 0.3, s * 6.25 + 0.45, 8.8, 16.3, COUL.pierreClaire, m.pierre, { crasse: false });
  }
  // --- Dedans ---
  // La banque de prêt, le long du mur est (côté sud), rail de laiton, et ce qu'on y a laissé
  c.pave(3.6, SOL, 12.2, 4.3, 1.05, 15.0, COUL.chene, m.satin, { nuance: 0.02 });
  c.pave(3.5, 1.05, 12.1, 4.4, 1.1, 15.1, 0x3b2a1e, m.satin, { crasse: false });
  c.poutre([3.48, 1.25, 12.1], [3.48, 1.25, 15.1], 0.03, COUL.laiton, m.metal);
  livreOuvert(c, 3.95, 1.1, 13.6, Math.PI / 2, 1.4, 0x3b2a1e);
  pileLivres(c, 3.95, 1.1, 14.6, 6, 0.4);
  bougies(c, 3.95, 1.1, 12.6, 4);
  c.boite(0.08, 0.1, 0.08, 0x2b2d30, { x: 4.1, y: 1.15, z: 13.0 }, m.satin, { crasse: false });
  c.boite(0.16, 0.03, 0.1, 0x6b2a2a, { x: 4.15, y: 1.12, z: 13.2 }, m.mat, { crasse: false });
  // Le chariot de retour, renversé
  c.repere({ x: 2.4, y: SOL + 0.35, z: 12.4, ry: 0.5, rz: 1.4 }, () => {
    c.boite(1.0, 0.04, 0.45, 0x6b6e70, { y: 0.1 }, m.tole);
    c.boite(1.0, 0.04, 0.45, 0x6b6e70, { y: 0.5 }, m.tole);
    for (const s of [-1, 1]) c.boite(0.04, 0.7, 0.45, 0x6b6e70, { x: s * 0.48, y: 0.3 }, m.tole);
  });
  tasLivres(c, 2.0, 13.4, 0.9, 12);
  // Les fichiers du catalogue, dos à dos ; des tiroirs arrachés, des fiches partout
  for (const s of [-1, 1]) {
    c.pave(-4.1, SOL, 12.6, -2.9, 1.2, 14.6, COUL.chene, m.satin, { nuance: 0.02 });
    panneau(c, m.enseignes, R.tiroirs, { x: -3.5 + s * 0.61, y: 0.68, z: 13.6, ry: (s * Math.PI) / 2 }, 1.9, 1.05);
  }
  c.pave(-4.15, 1.2, 12.55, -2.85, 1.26, 14.65, 0x3b2a1e, m.satin, { crasse: false });
  for (let i = 0; i < 5; i++) c.boite(0.4, 0.14, 0.18, COUL.cheneClair, { x: c.entre(-5, -2), y: SOL + 0.07, z: c.entre(11.8, 15), ry: c.hasard() * 3 }, m.satin, { nuance: 0.06 });
  for (let i = 0; i < Math.round(30 + 40 * usure); i++) c.poser(PLAT, m.mat, COUL.papier, { x: c.entre(-5.5, -1), y: SOL + 0.004, z: c.entre(11.5, 15.6), ry: c.hasard() * 3, e: [0.12, 1, 0.075] }, { crasse: false, nuance: 0.06 });
  k.b.obstacle(-3.5, 12.6, -3.5, 14.6, "meuble");
  k.b.obstacle(3.95, 12.2, 3.95, 15, "meuble");
  k.b.obstacle(2.45, 16.3, 4.35, 16.3, "porte barricadée");
  // Les bustes de part et d'autre de la porte de la rotonde (l'un est tombé)
  for (const s of [-1, 1]) {
    c.pave(s * 2.6 - 0.3, SOL, 8.6, s * 2.6 + 0.3, 1.3, 9.2, COUL.marbreClair ?? 0xe4e0d6, m.lisse);
    if (s < 0) {
      c.poser(geoIco(0.22, 1), m.lisse, 0xe4e0d6, { x: s * 2.6, y: 1.55, z: 8.9, e: [0.9, 1.2, 1] }, { crasse: false });
      c.boite(0.5, 0.25, 0.3, 0xe4e0d6, { x: s * 2.6, y: 1.42, z: 8.9 }, m.lisse, { crasse: false });
    } else {
      c.poser(geoIco(0.22, 1), m.lisse, 0xe4e0d6, { x: 3.4, y: SOL + 0.2, z: 9.8, e: [0.9, 1.2, 1], rz: 1.4 }, { crasse: false });
    }
  }
  // Le portique antivol « Détection IA » de l'Abondance, mort
  for (const s of [-1, 1]) {
    c.pave(s * 0.85 - 0.08, SOL, 14.9, s * 0.85 + 0.08, 1.6, 15.3, COUL.blanc2, m.lisse);
    c.pave(s * 0.85 - 0.085, 1.2, 14.95, s * 0.85 + 0.085, 1.28, 15.25, PALETTE.abondanceRouge, m.satin, { crasse: false });
  }
  panneau(c, m.enseignes, R.ecranMort, { x: -0.85, y: 1.4, z: 15.31 }, 0.14, 0.1);
  // Le panneau « MÉDIATHÈQUE 2.0 → » sur pied, le mot du lecteur contre le chambranle
  c.tube([4.6, SOL, 8.6], [4.6, 1.6, 8.6], 0.03, 0x8d969a, m.metal, 4);
  panneau(c, m.enseignes, R.vers20, { x: 4.6, y: 1.9, z: 8.64, ry: -0.3 }, 0.8, 0.4);
  panneau(c, m.enseignes, R.note, { x: -1.6, y: SOL + 0.38, z: 9.0, rx: -0.25 }, 0.7, 0.7);
  // La plaque de la fondation, au mur ouest
  panneau(c, m.enseignes, R.plaque, { x: -5.73, y: 2.2, z: 9.4, ry: Math.PI / 2 }, 1.2, 0.6);
  // Des feuilles entrées par les portes, des gravats du plafond
  jonchee(c, -5.5, 11.5, 5.5, 15.8, Math.round(70 * usure));
  if (usure > 0.4) {
    gravats(c, -1.2, 10.6, 1, Math.round(8 * usure), [COUL.enduit, COUL.pierreClaire], SOL);
    debris(c, -3, 9, 1, 12, Math.round(30 * usure), [COUL.enduit, 0xd9d2c0], SOL);
  }
}

// ---------- Le portique et le fronton ----------

function portique(k) {
  const { c, A, m, usure } = k;
  const xs = [-6.5, -3.9, -1.3, 1.3, 3.9, 6.5];
  const zc = 18.6;
  if (!GEO.fut) GEO.fut = new THREE.CylinderGeometry(0.33, 0.39, 6.3, 12);
  for (const x of xs) {
    c.pave(x - 0.47, SOL, zc - 0.47, x + 0.47, SOL + 0.3, zc + 0.47, COUL.pierreClaire, m.pierre);
    c.poser(geoCylindre(0.44, 0.14, 12), m.pierre, COUL.pierreClaire, { x, y: SOL + 0.37, z: zc });
    c.poser(GEO.fut, m.pierre, COUL.pierre, { x, y: SOL + 0.44 + 3.15, z: zc }, { nuance: 0.03 });
    c.poser(geoCone(0.5, 0.36, 0.3, 12), m.pierre, COUL.pierreClaire, { x, y: 6.95, z: zc }, { crasse: false });
    c.pave(x - 0.5, 7.1, zc - 0.5, x + 0.5, 7.25, zc + 0.5, COUL.pierreClaire, m.pierre, { crasse: false });
  }
  // Le lierre grimpe sur deux colonnes
  lierre(c, -6.5, 0, zc + 0.4, 0, 0.9, 3 + 3 * usure, Math.round(50 * usure));
  lierre(c, 6.5, 0, zc + 0.4, 0, 0.9, 2 + 2 * usure, Math.round(30 * usure));
  // L'entablement, l'inscription, le fronton (couche)
  A.pave(-7.1, 7.25, 16, 7.1, 7.85, zc + 0.55, COUL.pierreClaire, m.pierre, { crasse: false });
  A.pave(-7.1, 7.85, 16, 7.1, 8.5, zc + 0.5, COUL.pierre, m.pierre, { crasse: false });
  A.pave(-7.35, 8.5, 15.8, 7.35, 8.8, zc + 0.8, COUL.pierreClaire, m.pierre, { crasse: false });
  panneau(A, m.enseignes, R.fronton, { x: 0, y: 8.17, z: zc + 0.515 }, 5.6, 0.62);
  A.poser(geoTriangle(14.2, 2.0, 0.6), m.pierre, COUL.pierre, { x: 0, y: 8.8, z: zc + 0.2 }, { crasse: false });
  const pente = Math.atan2(2.1, 7.35);
  for (const s of [-1, 1]) A.boite(7.7, 0.24, 1.2, COUL.pierreClaire, { x: s * 3.6, y: 9.86, z: zc + 0.15, rz: -s * pente }, m.pierre, { crasse: false });
  // Dans le tympan : un livre ouvert sculpté sous un soleil, à demi effacé
  A.repere({ x: 0, y: 9.15, z: zc + 0.52 }, () => {
    A.boite(0.7, 0.42, 0.08, COUL.pierreClaire, { x: -0.36, rz: 0.15 }, m.pierre, { crasse: false });
    A.boite(0.7, 0.42, 0.08, COUL.pierreClaire, { x: 0.36, rz: -0.15 }, m.pierre, { crasse: false });
    A.poser(geoCylindre(0.24, 0.08, 10), m.pierre, COUL.pierreClaire, { y: 0.55, rx: Math.PI / 2 }, { crasse: false });
  });
  nid(A, -5.4, 8.82, zc + 0.35, 0.8);
  // Le toit à deux pans, de zinc, du fronton jusqu'au tambour
  const zr0 = bordTambour(1.5) - 0.5;
  const lr = zc + 0.8 - zr0;
  for (const s of [-1, 1]) {
    A.boite(7.7, 0.12, lr, COUL.zinc, { x: s * 3.6, y: 9.84, z: zr0 + lr / 2, rz: -s * pente }, m.tole, { crasse: false, nuance: 0.03 });
  }
  A.pave(-0.12, 10.85, zr0, 0.12, 11, zc + 0.8, COUL.zinc, m.tole, { crasse: false });
  // Les tasseaux du zinc, de l'égout au faîtage
  for (let z = zr0 + 0.5; z < zc + 0.6; z += 0.85) for (const s of [-1, 1]) A.boite(7.7, 0.06, 0.06, 0x767e82, { x: s * 3.6, y: 9.93, z, rz: -s * pente }, m.tole, { crasse: false });
  // Un pan de zinc arraché laisse voir la charpente
  if (usure > 0.45) for (let i = 0; i < 4; i++) A.poutre([-0.2, 10.8, zr0 + 1.5 + i * 0.6], [-6.8, 8.85, zr0 + 1.5 + i * 0.6], 0.12, PALETTE.boisSombre, m.mat);
  // Le plafond du portique (couche)
  A.pave(-7.1, 7.25, 16, 7.1, 7.4, zc + 0.5, COUL.enduit, m.enduit, { crasse: false });
  // Le perron : deux marches douces, les échiffres et les candélabres
  c.pave(-7.6, 0, 19.2, 7.6, 0.06, 20.1, COUL.pierreClaire, m.pierre, { crasse: false, nuance: 0 });
  c.pave(-7.6, 0, 20.1, 7.6, 0.03, 21.0, COUL.pierreGrise, m.pierre, { crasse: false, nuance: 0 });
  for (const s of [-1, 1]) {
    c.pave(s * 7.95 - 0.45, 0, 16.2, s * 7.95 + 0.45, 1.0, 21.2, COUL.pierre, m.pierre);
    c.pave(s * 7.95 - 0.52, 1.0, 16.1, s * 7.95 + 0.52, 1.1, 21.3, COUL.pierreClaire, m.pierre, { crasse: false });
    k.b.obstacle(s * 7.95, 16.2, s * 7.95, 21.2, "échiffre");
    // Le candélabre de fonte : fût, trois lanternes (une pend)
    const x = s * 7.95;
    c.tube([x, 1.1, 20.7], [x, 3.6, 20.7], 0.07, COUL.fonte, m.tole, 6);
    c.poser(geoCylindre(0.16, 0.4, 8), m.tole, COUL.fonte, { x, y: 1.3, z: 20.7 });
    for (const a of [0, 2.1, 4.2]) {
      const lx = x + Math.cos(a) * 0.4;
      const lz = 20.7 + Math.sin(a) * 0.4;
      c.poutre([x, 3.5, 20.7], [lx, 3.55, lz], 0.04, COUL.fonte, m.tole);
      const pend = s > 0 && a === 2.1;
      c.poser(geoIco(0.14, 0), m.verre, 0xf1ead8, { x: lx, y: pend ? 3.1 : 3.72, z: lz }, { crasse: false });
    }
  }
  // La banderole de l'Abondance, tendue entre deux colonnes au-dessus des portes, déchirée
  panneau(c, m.enseignes, R.banniere, { x: 0, y: 5.7, z: zc - 0.42, rz: 0.015 }, 7.6, 0.95);
  for (const s of [-1, 1]) c.poutre([s * 3.8, 6.15, zc - 0.42], [s * 3.9, 6.3, zc - 0.3], 0.02, 0x8a7a5a, m.mat);
  // Des feuilles et des herbes au portique
  jonchee(c, -7, 16.3, 7, 21, Math.round(50 * usure));
  semerTouffes(c, -7.5, 19.2, 7.5, 21, Math.round(30 * usure), PALETTE.herbeSeche, 0.06);
}

// ---------- Les ailes basses ----------

function ailes(k) {
  const { c, A, m, usure } = k;
  const pierre = { couleur: COUL.pierre, mat: m.pierre, interieur: { couleur: COUL.enduit, mat: m.enduit } };
  const fen = (u, extra = {}) => ({ u, l: 1.7, bas: 1.2, haut: 4.8, type: "fenetre", croisillons: 1, traverses: 3, bris: k.bris, cadre: 0x5a4a3a, ...extra });
  // Aile ouest : la salle des cartes
  murCoupe(k, [-22, 16], [-6, 16], { h: HA, ep: 0.6, couche: A, ...pierre, ouvertures: [fen(2.4), fen(6), fen(10), fen(13.6)] });
  murCoupe(k, [-22, 7.5], [-22, 16], { h: HA, ep: 0.6, cut: HA, ...pierre, ouvertures: [fen(2), { u: 4.5, l: 1.4, bas: 0, haut: 2.8, type: "vide" }, fen(7)] });
  murCoupe(k, [-6, 7.5], [-22, 7.5], { h: HA, ep: 0.6, couche: A, ...pierre, ouvertures: [fen(3, { bas: 2.2 }), fen(13, { bas: 2.2 })] });
  // Aile est : le bureau du conservateur et la salle des enfants
  murCoupe(k, [6, 16], [22, 16], { h: HA, ep: 0.6, couche: A, ...pierre, ouvertures: [fen(1.9), fen(4.6), fen(8.6), fen(11.8), fen(14.6)] });
  murCoupe(k, [22, 16], [22, 7.5], { h: HA, ep: 0.6, couche: A, ...pierre, ouvertures: [fen(1.7), { u: 4, l: 1.6, bas: 0, haut: 2.8, type: "vide" }, fen(6.6)] });
  murCoupe(k, [22, 7.5], [6, 7.5], { h: HA, ep: 0.6, couche: A, ...pierre });
  murCoupe(k, [12.5, 7.5], [12.5, 16], { h: HA, ep: 0.25, couche: A, couleur: COUL.enduit, mat: m.enduit, interieur: { couleur: 0xd8cfb4, mat: m.enduit }, ouvertures: [{ u: 6, l: 1.2, bas: 0, haut: 2.5, type: "vide" }] });
  // La porte vitrée sur le jardin, couchée dans l'herbe ; la porte latérale de la salle des cartes, entrouverte
  c.boite(1.5, 0.05, 2.6, 0x6b5a48, { x: 23.6, y: 0.05, z: 12.2, ry: 0.2 }, m.satin);
  c.repere({ x: -22, y: SOL, z: 11.3, ry: -0.9 }, () => c.boite(0.06, 2.7, 1.35, 0x4a3628, { z: 0.68, y: 1.35 }, m.satin));
  for (const s of [-1, 1]) {
    const x0 = s > 0 ? 6 : -22;
    const x1 = s > 0 ? 22 : -6;
    // Socle, bandeau, corniche, attique à balustres (dehors, côté sud et côté pignon)
    bandes([x0, 16], [x1, 16], 0.6, [
      { y1: 0, y2: 0.6, s: 0.08, couleur: COUL.pierreGrise, mat: m.pierre, ch: c },
      { y1: 5.25, y2: 5.45, s: 0.08, couleur: COUL.pierreClaire, mat: m.pierre, ch: A },
      { y1: 6.15, y2: 6.5, s: 0.3, couleur: COUL.pierreClaire, mat: m.pierre, ch: A },
    ]);
    const pa = s > 0 ? [22, 16] : [-22, 7.5];
    const pb = s > 0 ? [22, 7.5] : [-22, 16];
    bandes(pa, pb, 0.6, [
      { y1: 0, y2: 0.6, s: 0.08, couleur: COUL.pierreGrise, mat: m.pierre, ch: c },
      { y1: 6.15, y2: 6.5, s: 0.3, couleur: COUL.pierreClaire, mat: m.pierre, ch: s > 0 ? A : c },
    ]);
    // Le toit plat, et son trou au-dessus de la salle des cartes
    const trou = s < 0 && usure > 0.35 ? { x1: -17.5, x2: -14.5, z1: 11, z2: 13.5 } : null;
    const morceaux = trou ? [[x0 - 0.3, trou.x1, 7.2, 16.3], [trou.x2, x1, 7.2, 16.3], [trou.x1, trou.x2, 7.2, trou.z1], [trou.x1, trou.x2, trou.z2, 16.3]] : [[x0 - 0.3, x1 + 0.3, 7.2, 16.3]];
    for (const [a1, a2, b1, b2] of morceaux) A.pave(Math.min(a1, a2), HA, b1, Math.max(a1, a2), HA + 0.3, b2, COUL.enduit, m.enduit, { crasse: false, nuance: 0 });
    balustrade(A, [x0, 16.15], [x1, 16.15], HA + 0.3, 0.8);
    balustrade(A, s > 0 ? [22.15, 16.15] : [-22.15, 16.15], s > 0 ? [22.15, 7.35] : [-22.15, 7.35], HA + 0.3, 0.8);
    mousse(A, (x0 + x1) / 2 + s * 3, HA + 0.3, 10.5, 1.3, Math.round(7 * usure), 0x6f7f48);
    semerTouffes(A, Math.min(x0, x1), 7.5, Math.max(x0, x1), 16, Math.round(30 * usure), PALETTE.herbeSeche, HA + 0.3);
    if (trou) {
      gravats(c, -16, 12.2, 1.4, Math.round(10 + 10 * usure), [COUL.enduit, COUL.pierreClaire, PALETTE.boisGris], SOL);
      flaque(c, -15.2, 13.3, 0.9, SOL + 0.012);
      raiDeLumiere(c, [-16, HA + 0.3, 12.2], [-15.2, SOL, 13.4], 2.6);
      for (let i = 0; i < 4; i++) A.poutre([trou.x1 + 0.5 + i * 0.7, HA + 0.05, trou.z1], [trou.x1 + 0.3 + i * 0.75, HA - 0.6 - c.hasard() * 0.8, trou.z1 + 1], 0.08, PALETTE.boisSombre, m.mat);
    }
    // Le lierre sur la façade sud, des arbustes au pied
    lierre(c, s * 15, 0, 16.32, 0, 4, 4 + 2 * usure, Math.round(80 * usure));
    for (let i = 0; i < 4; i++) arbuste(c, s * (8.5 + i * 3.6), 17.1, 0.9 + c.hasard() * 0.5);
  }
  // La souche de cheminée du bureau, sur le toit
  A.pave(8.6, HA, 7.3, 9.8, HA + 1.4, 8.1, COUL.pierre, m.pierre);
  A.pave(8.5, HA + 1.4, 7.2, 9.9, HA + 1.55, 8.2, COUL.pierreClaire, m.pierre, { crasse: false });
}

// ---------- La salle des cartes et atlas ----------

function meubleAPlans(k, x, z, ry) {
  const { c, m } = k;
  c.repere({ x, y: SOL, z, ry }, () => {
    c.boite(2.2, 0.92, 1.3, COUL.chene, { y: 0.46 }, m.satin, { nuance: 0.03 });
    for (let i = 0; i < 6; i++) for (const s of [-1, 1]) {
      c.boite(2.08, 0.012, 0.02, 0x3b2a1e, { y: 0.12 + i * 0.14, z: s * 0.655 }, m.satin, { crasse: false });
      c.boite(0.22, 0.03, 0.03, COUL.laiton, { y: 0.17 + i * 0.14, z: s * 0.67 }, m.metal, { crasse: false });
    }
    // Un tiroir à demi sorti, une carte qui pend
    c.boite(2.0, 0.1, 0.7, COUL.cheneClair, { y: 0.6, z: 0.95 }, m.satin);
    panneau(c, m.enseignes, R.carte, { y: 0.4, z: 1.32, rx: 0.15, teinte: 0xe8e0d0 }, 1.2, 0.7);
    // Sur le plateau : des cartes dépliées, un atlas ouvert
    panneau(c, m.enseignes, R.carte, { y: 0.93, x: -0.35, rx: -Math.PI / 2, rz: 0.2 }, 1.2, 0.72);
    livreOuvert(c, 0.5, 0.93, 0.1, -0.4, 1.8, 0x2d3a55);
  });
  k.b.obstacle(x - Math.cos(ry) * 1.1, z + Math.sin(ry) * 1.1, x + Math.cos(ry) * 1.1, z - Math.sin(ry) * 1.1, "meuble");
}

function salleDesCartes(k) {
  const { c, m, usure } = k;
  meubleAPlans(k, -18, 10.4, 0);
  meubleAPlans(k, -13.6, 10.4, 0.05);
  meubleAPlans(k, -9.4, 10.6, -0.1);
  // La grande carte murale de la région, au mur nord
  // (sur la part haute du mur : elle s'efface avec lui)
  panneau(k.A, m.enseignes, R.carte, { x: -14, y: 3.0, z: 7.82 }, 3.6, 2.16);
  k.A.pave(-15.9, 1.85, 7.8, -12.1, 1.92, 7.9, 0x5a4130, m.satin);
  // Une seconde carte, décrochée, roulée à moitié au sol
  panneau(c, m.enseignes, R.carte, { x: -10.6, y: SOL + 0.02, z: 13.4, rx: -Math.PI / 2, rz: 0.6 }, 1.6, 0.96);
  c.tube([-11.3, SOL + 0.08, 12.8], [-10.2, SOL + 0.08, 12.0], 0.08, COUL.papier, m.mat, 6);
  // Le casier à rouleaux, près du mur ouest
  c.pave(-21.65, SOL, 12.9, -20.9, 1.5, 15.2, COUL.chene, m.satin);
  for (let i = 0; i < 9; i++) {
    const z = 13.1 + (i % 5) * 0.42;
    const y = 0.4 + Math.floor(i / 5) * 0.6;
    c.tube([-21.6, y, z], [-20.3 + c.entre(-0.2, 0.3), y + c.entre(-0.05, 0.15), z + c.entre(-0.1, 0.1)], 0.07, [COUL.papier, 0xd8c9a0, 0xc2b386][i % 3], m.mat, 6);
  }
  for (let i = 0; i < 4; i++) c.tube([-19.8 + i * 0.4, SOL + 0.07, 14.4 + i * 0.2], [-18.8 + i * 0.5, SOL + 0.07, 15.2 - i * 0.1], 0.07, COUL.papier, m.mat, 6);
  // L'armoire à atlas, contre la cloison du vestibule
  planLivres(c, { x: -6.27, y: 7 / 6, z: 14.2, ry: -Math.PI / 2 }, 2.6, 7 / 3, 0xf0e8d8);
  c.pave(-6.7, 7 / 3, 12.85, -6.25, 7 / 3 + 0.12, 15.55, COUL.chene, m.satin);
  for (const z of [12.85, 15.55]) c.pave(-6.7, 0, z - 0.05, -6.25, 7 / 3, z + 0.05, COUL.chene, m.satin);
  // Le pupitre et l'atlas géant ; des atlas en pile ; le globe céleste renversé
  c.pave(-11.7, SOL, 14.2, -11.1, 1.0, 14.8, COUL.chene, m.satin);
  livreOuvert(c, -11.4, 1.1, 14.5, 0.2, 2.2, 0x5a3a2a);
  c.boite(1.0, 0.04, 0.8, COUL.chene, { x: -11.4, y: 1.05, z: 14.5, rx: -0.25 }, m.satin);
  pileLivres(c, -16.5, SOL, 14.6, 8, 0.2);
  pileLivres(c, -16.0, SOL, 15.2, 5, -0.3);
  tasLivres(c, -8.2, 13.9, 0.8, 8);
  c.poser(geoIco(0.38, 1), m.satin, 0x3a4f6a, { x: -19.6, y: SOL + 0.38, z: 13.2 }, { crasse: false });
  // Des chaises, une table à cartes, les feuilles
  tableLecture(k, -14.2, 14.4, 0, 2.6, 1.2, { lampes: 1, chaises: 2 });
  jonchee(c, -21.5, 8, -6.5, 15.8, Math.round(70 * usure), [COUL.papier, 0xd8c9a0, 0x9c7a45, 0xb08f55], SOL + 0.005);
  // Le lierre qui entre par une fenêtre brisée
  lierre(c, -21.68, 0, 9.5, Math.PI / 2, 1.8, 3.5 * usure, Math.round(50 * usure));
}

// ---------- Le bureau du conservateur ----------

function bureau(k) {
  const { c, m, usure } = k;
  // Le bureau plat, les registres, les tampons, l'encrier, la loupe
  c.pave(7.7, 0.74, 9.7, 9.7, 0.8, 10.7, COUL.chene, m.satin);
  for (const [x, z] of [[7.8, 9.8], [9.6, 9.8], [7.8, 10.6], [9.6, 10.6]]) c.pave(x - 0.05, SOL, z - 0.05, x + 0.05, 0.74, z + 0.05, COUL.chene, m.satin);
  c.pave(7.75, 0.3, 9.75, 8.3, 0.74, 10.65, COUL.chene, m.satin);
  livreOuvert(c, 8.6, 0.8, 10.2, 0.1, 1.6, 0x3b2a1e);
  pileLivres(c, 9.4, 0.8, 9.95, 4, 0.1, [0x3b2a1e, 0x5a3a2a, 0x4a2a2a]);
  for (let i = 0; i < 3; i++) {
    c.poser(geoCylindre(0.03, 0.08, 6), m.satin, COUL.chene, { x: 8.0 + i * 0.12, y: 0.86, z: 9.9 }, { crasse: false });
    c.boite(0.06, 0.03, 0.06, 0x2b2b2b, { x: 8.0 + i * 0.12, y: 0.815, z: 9.9 }, m.mat, { crasse: false });
  }
  c.boite(0.14, 0.02, 0.09, 0x6b2a2a, { x: 8.1, y: 0.81, z: 10.5 }, m.mat, { crasse: false });
  c.poser(geoCylindre(0.04, 0.06, 6), m.lisse, 0x1f2526, { x: 9.2, y: 0.83, z: 10.5 }, { crasse: false });
  lampeVerte(c, 7.95, 0.8, 10.45, 0.6);
  k.b.obstacle(7.7, 10.2, 9.7, 10.2, "meuble");
  // Le fauteuil de cuir, derrière
  c.repere({ x: 8.7, y: SOL, z: 9.1, ry: 0.15 }, () => {
    c.boite(0.75, 0.42, 0.7, 0x5a3426, { y: 0.21 }, m.satin);
    c.boite(0.75, 0.7, 0.18, 0x5a3426, { y: 0.75, z: -0.3 }, m.satin);
    for (const s of [-1, 1]) c.boite(0.14, 0.25, 0.7, 0x5a3426, { x: s * 0.36, y: 0.55 }, m.satin);
  });
  // Le globe terrestre sur son pied
  c.tube([11.2, SOL, 12.8], [11.2, 0.8, 12.8], 0.04, COUL.chene, m.satin, 5);
  for (const a of [0, 2.1, 4.2]) c.poutre([11.2, 0.25, 12.8], [11.2 + Math.cos(a) * 0.35, SOL, 12.8 + Math.sin(a) * 0.35], 0.04, COUL.chene, m.satin);
  c.poser(geoIco(0.36, 1), m.satin, 0xc8b07a, { x: 11.2, y: 1.18, z: 12.8, rz: 0.4 }, { crasse: false });
  c.poser(new THREE.TorusGeometry(0.4, 0.02, 3, 16), m.metal, COUL.laiton, { x: 11.2, y: 1.18, z: 12.8, rx: Math.PI / 2 + 0.4 }, { crasse: false });
  // La cheminée de marbre, le miroir piqué, le feu du lecteur
  c.pave(8.4, SOL, 7.8, 10.0, 1.25, 8.25, 0xd8d2c4, m.lisse);
  c.pave(8.3, 1.25, 7.8, 10.1, 1.33, 8.35, 0xd8d2c4, m.lisse, { crasse: false });
  c.pave(8.75, SOL, 8.2, 9.65, 0.85, 8.27, 0x1d1a18, m.mat, { crasse: false });
  k.A.pave(8.6, 1.5, 7.8, 9.8, 2.7, 7.86, 0x9aa4a6, m.metal, { crasse: false });
  for (let i = 0; i < 3; i++) c.tube([8.85 + i * 0.12, SOL + 0.08, 8.0], [9.55 - i * 0.1, SOL + 0.12, 8.15], 0.06, 0x5e4a36, m.mat, 5);
  for (let i = 0; i < 6; i++) c.boite(0.12, 0.05, 0.1, i % 2 ? 0xff8a3d : 0xffb14a, { x: 8.9 + c.entre(0, 0.6), y: SOL + 0.03, z: 8.05 + c.entre(0, 0.15), ry: c.hasard() * 3 }, m.mat, { crasse: false, nuance: 0 });
  c.boite(0.5, 0.04, 0.5, 0x3a3836, { x: 9.2, y: SOL + 0.02, z: 8.55 }, m.mat, { crasse: false });
  // Le bois de chauffage : des chaises cassées (« Brûlez les chaises »), le couchage du lecteur
  for (let i = 0; i < 7; i++) c.boite(c.entre(0.4, 0.8), 0.05, 0.05, COUL.chene, { x: 10.6 + c.entre(-0.3, 0.3), y: SOL + 0.03 + i * 0.05, z: 8.4 + c.entre(-0.2, 0.2), ry: c.hasard() * 3 }, m.satin);
  c.boite(0.8, 0.1, 1.9, 0x5a5a3f, { x: 7.0, y: SOL + 0.05, z: 9.0, ry: 0.1 }, m.toile);
  c.boite(0.7, 0.06, 0.9, 0x6b4a3a, { x: 7.05, y: SOL + 0.12, z: 9.4, ry: 0.2, rz: 0.05 }, m.toile);
  pileLivres(c, 6.8, SOL, 8.2, 6, 0.4);
  // Le coffre des livres rares, porte entrouverte
  c.pave(11.2, SOL, 7.95, 12.1, 1.05, 8.65, 0x3f4446, m.tole);
  c.repere({ x: 12.1, y: SOL, z: 8.65, ry: -1.0 }, () => c.boite(0.06, 0.95, 0.85, 0x3f4446, { y: 0.52, z: -0.43 }, m.tole));
  c.poser(geoCylindre(0.06, 0.03, 8), m.metal, COUL.laiton, { x: 12.4, y: 0.6, z: 9.0, rz: Math.PI / 2 }, { crasse: false });
  // La bibliothèque vitrée du conservateur, contre le mur nord ; le portrait du fondateur, décroché
  planLivres(c, { x: 7.2, y: 7 / 6, z: 7.82 }, 1.5, 7 / 3, 0xe8e0d0);
  c.pave(6.4, 7 / 3, 7.75, 8.0, 7 / 3 + 0.1, 8.25, COUL.chene, m.satin);
  for (const x of [6.4, 8.0]) c.pave(x - 0.05, 0, 7.75, x + 0.05, 7 / 3, 8.25, COUL.chene, m.satin);
  panneau(c, m.enseignes, R.portrait, { x: 10.2, y: 0.5, z: 10.9, rx: -0.3, ry: -0.4 }, 0.8, 0.8);
  // Le tapis
  c.pave(7.2, SOL, 9.2, 11, SOL + 0.01, 12.2, 0x6a3a30, m.mat, { crasse: false });
  jonchee(c, 6.5, 8.5, 12.2, 15.8, Math.round(40 * usure), [COUL.papier, 0x9c7a45, 0xb08f55], SOL + 0.015);
}

// ---------- La salle des enfants ----------

function salleDesEnfants(k) {
  const { c, m, usure } = k;
  // Les rayonnages bas contre le mur nord, les albums présentés de face
  planLivres(c, { x: 17.2, y: 0.5, z: 7.82 }, 8, 1, 0xfff4e0);
  c.pave(13.1, 1.0, 7.8, 21.4, 1.06, 8.3, 0xb8986e, m.satin);
  for (let i = 0; i < 6; i++) panneau(c, m.enseignes, R.couvertures, { x: 13.7 + i * 1.4, y: 1.3, z: 8.0, rx: -0.15 }, 0.42, 0.32, (i % 3) / 3, (i % 3) / 3 + 0.33);
  // La fresque et l'enseigne peinte
  panneau(k.A, m.enseignes, R.fresque, { x: 17.2, y: 2.9, z: 7.81 }, 5, 3);
  panneau(k.A, m.enseignes, R.enfants, { x: 17.2, y: 4.85, z: 7.81 }, 2.8, 0.7);
  // Le tapis rond, les coussins, les petites tables et les petites chaises
  c.poser(geoCylindre(2.2, 0.02, 12), m.mat, 0x8a6a7a, { x: 15.6, y: SOL + 0.01, z: 11.4 }, { crasse: false });
  const tons = [0xb06a5a, 0x6f9a8a, 0xc8a050, 0x7a6a9a, 0x8aa06a];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU;
    c.poser(geoIco(0.3, 0), m.toile, tons[i % 5], { x: 15.6 + Math.cos(a) * 1.5, y: SOL + 0.1, z: 11.4 + Math.sin(a) * 1.5, e: [1.2, 0.45, 1.1], ry: c.hasard() * 3 }, { crasse: false, nuance: 0.06 });
  }
  for (const [x, z] of [[19.2, 13.8], [16.2, 14.6], [19.8, 10.6]]) {
    c.poser(geoCylindre(0.5, 0.04, 10), m.satin, 0xe0d8c8, { x, y: 0.5, z }, { crasse: false });
    c.poser(geoCylindre(0.06, 0.45, 6), m.satin, 0xe0d8c8, { x, y: 0.27, z }, { crasse: false });
    for (let j = 0; j < 3; j++) {
      const a = (j / 3) * TAU + c.hasard();
      chaise(c, x + Math.cos(a) * 0.75, z + Math.sin(a) * 0.75, Math.atan2(-Math.cos(a), -Math.sin(a)), c.hasard() < 0.3 ? "couchee" : "debout", 0.62, tons[(j + Math.floor(x)) % 5]);
    }
  }
  // Le tipi de toile, à demi affaissé
  c.poser(geoCone(0.05, 1.1, 2.0, 6, true), m.toile, 0xd8c9a0, { x: 20.3, y: 1.0, z: 9.3, rz: 0.08 }, { nuance: 0.04 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + 0.4;
    c.poutre([20.3 + Math.cos(a) * 1.05, SOL, 9.3 + Math.sin(a) * 1.05], [20.3 - Math.cos(a) * 0.15, 2.3, 9.3 - Math.sin(a) * 0.15], 0.04, PALETTE.boisGris, m.mat);
  }
  // Des albums partout au sol, un ballon, le tableau noir de l'école des survivants
  for (let i = 0; i < 16; i++) c.boite(c.entre(0.25, 0.4), 0.02, c.entre(0.25, 0.35), tons[i % 5], { x: c.entre(13.4, 21.5), y: SOL + 0.012, z: c.entre(9, 15.6), ry: c.hasard() * 3 }, m.satin, { crasse: false, nuance: 0.08 });
  c.poser(geoIco(0.16, 1), m.satin, 0xc8362b, { x: 21.2, y: SOL + 0.16, z: 15.3 }, { crasse: false });
  c.repere({ x: 14.0, y: SOL, z: 14.8, ry: 0.7 }, () => {
    for (const s of [-1, 1]) c.poutre([s * 0.55, 0, 0.25], [s * 0.45, 1.6, 0], 0.04, PALETTE.boisGris, m.mat);
    c.boite(1.1, 0.8, 0.04, 0x2f3d33, { y: 1.1, rx: -0.15 }, m.mat);
    for (let i = 0; i < 4; i++) c.boite(0.25 + i * 0.12, 0.025, 0.01, 0xe8e4d8, { x: -0.3 + i * 0.05, y: 1.3 - i * 0.12, z: 0.03, rx: -0.15 }, m.mat, { crasse: false });
  });
  jonchee(c, 13, 8.5, 21.6, 15.8, Math.round(50 * usure));
  // Le jardin à l'est : herbes hautes, un arbre
  semerTouffes(c, 22.5, 6, 26, 18, Math.round(40 * usure), PALETTE.herbeSeche, 0);
  arbre(c, 24.5, 9, 6.5, "bouleau");
}

// ---------- Le parvis ----------

function parvis(k) {
  const { c, m, usure } = k;
  c.pave(-24, 0, 16.3, 24, 0.03, 25, COUL.dalle, m.pierre, { crasse: false, nuance: 0 });
  c.pave(-26, 0, 25, 26, 0.02, 27, COUL.asphalte, m.mat, { crasse: false, nuance: 0 });
  c.pave(-26, 0, 24.7, 26, 0.12, 25.1, COUL.pierreGrise, m.pierre, { crasse: false });
  semerTouffes(c, -24, 16.4, 24, 25, Math.round(110 * usure), PALETTE.herbeSeche, 0.03);
  jonchee(c, -24, 17, 24, 25, Math.round(70 * usure), undefined, 0.035);
  // Deux arbres en carré de pierre (l'un est mort), un banc renversé
  for (const [x, ess] of [[-15, "feuillu"], [15, "mort"]]) {
    c.pave(x - 1, 0, 20.6, x + 1, 0.2, 22.6, COUL.pierreGrise, m.pierre);
    c.pave(x - 0.85, 0.2, 20.75, x + 0.85, 0.22, 22.45, PALETTE.terreSombre, m.mat, { crasse: false });
    arbre(c, x, 21.6, ess === "mort" ? 6 : 7.5, ess, 0.2);
  }
  c.repere({ x: -10, y: 0.25, z: 22.6, ry: 0.3, rx: Math.PI / 2 - 0.1 }, () => {
    c.boite(1.8, 0.05, 0.45, COUL.chene, {}, m.satin);
    for (const s of [-1, 1]) c.boite(0.06, 0.45, 0.45, COUL.fonte, { x: s * 0.8, y: -0.23 }, m.tole);
  });
  // La boîte de retour « connectée », son écran mort
  c.pave(4.6, 0, 21.6, 5.4, 1.15, 22.2, 0x5f6b62, m.tole);
  c.pave(4.55, 1.15, 21.55, 5.45, 1.3, 22.25, 0x5f6b62, m.tole, { crasse: false });
  panneau(c, m.enseignes, R.retour, { x: 5, y: 0.95, z: 22.21 }, 0.78, 0.2);
  panneau(c, m.enseignes, R.ecranMort, { x: 5, y: 0.62, z: 22.21 }, 0.3, 0.2);
  tasLivres(c, 5.6, 22.8, 0.6, 7, 0.03, true);
  k.b.obstacle(4.6, 21.9, 5.4, 21.9, "meuble");
  // Une voiture de l'Abondance, abandonnée dans la rue
  c.repere({ x: -6, y: 0, z: 26, ry: 0.06 }, () => {
    c.boite(4.2, 0.7, 1.8, 0x6f8a92, { y: 0.55 }, m.tole, { nuance: 0.03 });
    c.boite(2.2, 0.55, 1.6, 0x6f8a92, { y: 1.15, x: -0.2 }, m.tole);
    c.boite(2.0, 0.45, 1.62, 0x24303a, { y: 1.17, x: -0.2 }, m.lisse, { crasse: false });
    for (const [x, z] of [[-1.4, -0.9], [-1.4, 0.9], [1.4, -0.9], [1.4, 0.9]]) c.boite(0.6, 0.35, 0.22, 0x1e1e1e, { x, y: 0.15, z }, m.mat);
  });
  k.b.obstacle(-8.1, 26, -3.9, 26, "voiture");
}

// ---------- Les magasins de livres ----------

const H_BAS = 4 / 3; // les rayonnages des magasins sont coupés là (le haut s'efface quand on entre)
const H_RAY = 8 / 3;
const Y_MEZZ = 3; // la mezzanine de fonte (inaccessible)

/** Un rayonnage double face orienté nord-sud, de z1 à z2, en x. Le bas reste visible, le haut va dans la couche. */
function rayonnage(k, x, z1, z2) {
  const { c, m } = k;
  const M = k.M;
  const L = z2 - z1;
  const zm = (z1 + z2) / 2;
  const teinte = () => (c.hasard() < 0.25 ? 0xe0d8c4 : c.hasard() < 0.15 ? 0xc0c8a8 : 0xffffff);
  for (const s of [-1, 1]) {
    planLivres(c, { x: x + s * 0.26, y: H_BAS / 2, z: zm, ry: (s * Math.PI) / 2 }, L - 0.06, H_BAS, teinte());
    planLivres(M, { x: x + s * 0.26, y: (H_BAS + H_RAY) / 2, z: zm, ry: (s * Math.PI) / 2 }, L - 0.06, H_RAY - H_BAS, teinte());
    // L'étage de la mezzanine
    planLivres(M, { x: x + s * 0.26, y: Y_MEZZ + 1, z: zm, ry: (s * Math.PI) / 2 }, L - 0.06, 2, teinte());
  }
  const n = Math.max(1, Math.round(L / 1.8));
  for (let i = 0; i <= n; i++) {
    const z = z1 + (i * L) / n;
    const ep = i === 0 || i === n ? 0.06 : 0.04;
    c.pave(x - 0.27, 0, z - ep, x + 0.27, H_BAS, z + ep, COUL.fonte, m.tole);
    M.pave(x - 0.27, H_BAS, z - ep, x + 0.27, H_RAY, z + ep, COUL.fonte, m.tole);
    M.pave(x - 0.27, Y_MEZZ, z - ep, x + 0.27, Y_MEZZ + 2.1, z + ep, COUL.fonte, m.tole);
    M.pave(x - 0.03, H_RAY, z - 0.03, x + 0.03, Y_MEZZ, z + 0.03, COUL.fonte, m.tole);
  }
  M.pave(x - 0.3, H_RAY, z1, x + 0.3, H_RAY + 0.06, z2, COUL.fonte, m.tole);
  M.pave(x - 0.3, Y_MEZZ + 2.05, z1, x + 0.3, Y_MEZZ + 2.12, z2, COUL.fonte, m.tole);
  // L'étiquette de cote, au bout du rayonnage
  for (const z of [z1 - 0.07, z2 + 0.07]) c.boite(0.3, 0.16, 0.01, COUL.papier, { x, y: 1.15, z }, m.mat, { crasse: false });
  k.b.obstacle(x, z1, x, z2, "rayonnage");
}

/** Un rayonnage tombé (dominos) : pivote autour de son arête basse, côté est ; ses livres ont glissé. */
function rayonnageTombe(k, x, z1, z2, angle) {
  const { c, m } = k;
  const L = z2 - z1;
  c.repere({ x: x + 0.27, y: 0, z: (z1 + z2) / 2, rz: angle }, () => {
    c.pave(-0.54, 0, -L / 2, 0, 0.08, L / 2, COUL.fonte, m.tole);
    for (let j = 1; j <= 8; j++) c.pave(-0.54, j * LIGNE - 0.03, -L / 2, 0, j * LIGNE, L / 2, COUL.fonte, m.tole);
    for (const z of [-L / 2, 0, L / 2]) c.pave(-0.54, 0, z - 0.05, 0, H_RAY, z + 0.05, COUL.fonte, m.tole);
    // Quelques livres encore en place, couchés
    for (let j = 0; j < 8; j++) for (let q = 0; q < 3; q++) {
      if (c.hasard() < 0.45) continue;
      c.boite(0.04, c.entre(0.2, 0.3), c.entre(0.16, 0.24), TONS_LIVRES[Math.floor(c.hasard() * TONS_LIVRES.length)], { x: c.entre(-0.45, -0.1), y: j * LIGNE + 0.14, z: c.entre(-L / 2 + 0.2, L / 2 - 0.2), rz: c.entre(0.3, 0.9) }, m.mat, { crasse: false, nuance: 0.06 });
    }
  });
  const dx = Math.sin(-angle) * H_RAY;
  k.b.obstacle(x, z1, x, z2, "rayonnage tombé");
  k.b.obstacle(x + dx, z1, x + dx, z2, "rayonnage tombé");
}

function magasins(k) {
  const { c, m, usure } = k;
  const visite = k.mag;
  // Sur la carte « rotonde », les magasins ne sont qu'une coque : tout reste visible (pas de couche).
  const M = visite ? k.M : c;
  const kk = visite ? k : { ...k, M: c };
  const pierre = { couleur: COUL.pierre, mat: m.pierre, interieur: { couleur: 0xd8cfb8, mat: m.enduit } };
  const fenM = (u) => ({ u, l: 1.0, bas: 3.4, haut: 5.7, type: "fenetre", croisillons: visite ? 1 : 0, traverses: visite ? 3 : 1, bris: visite ? k.bris : 0.15, cadre: COUL.fonte, matCadre: m.tole });
  const cut = visite ? CUT : HM;
  murCoupe(kk, [-13, -12.5], [-2.6, -12.5], { h: HM, ep: 0.6, cut, couche: M, ...pierre, ouvertures: [fenM(2.5), fenM(6.8)] });
  murCoupe(kk, [2.6, -12.5], [13, -12.5], { h: HM, ep: 0.6, cut, couche: M, ...pierre, ouvertures: [fenM(3.6), fenM(7.9)] });
  murCoupe(kk, [13, -12.5], [13, -26], { h: HM, ep: 0.6, cut, couche: M, ...pierre, ouvertures: [fenM(2.2), fenM(5.6), fenM(9), fenM(12.2)] });
  murCoupe(kk, [13, -26], [-13, -26], { h: HM, ep: 0.6, cut: HM, ...pierre, ouvertures: [fenM(3), fenM(8), fenM(13), fenM(18), fenM(23)] });
  murCoupe(kk, [-13, -26], [-13, -12.5], { h: HM, ep: 0.6, cut: HM, ...pierre, ouvertures: [fenM(2.5), { u: 6.8, l: 1.3, bas: 0, haut: 2.6, type: "vide" }, fenM(11)] });
  // Dehors : socle, corniche
  for (const [a, b] of [[[-13, -12.5], [-2.6, -12.5]], [[2.6, -12.5], [13, -12.5]], [[13, -12.5], [13, -26]], [[13, -26], [-13, -26]], [[-13, -26], [-13, -12.5]]]) {
    const avant = a[1] === -12.5 && b[1] === -12.5 || a[0] === 13 && b[0] === 13;
    bandes(a, b, 0.6, [
      { y1: 0, y2: 0.5, s: 0.08, couleur: COUL.pierreGrise, mat: m.pierre, ch: c },
      { y1: HM - 0.35, y2: HM, s: 0.25, couleur: COUL.pierreClaire, mat: m.pierre, ch: avant ? M : c },
    ]);
  }
  // Le toit plat, ses trois verrières en bâtière (des vitres manquent), son acrotère
  const verrieres = [-7, 0, 7];
  const zv1 = -24.5;
  const zv2 = -14;
  let x0 = -13.3;
  for (const xv of verrieres) {
    M.pave(x0, HM, -26.3, xv - 1.2, HM + 0.3, -12.5, COUL.enduit, m.enduit, { crasse: false, nuance: 0 });
    M.pave(xv - 1.2, HM, -26.3, xv + 1.2, HM + 0.3, zv1, COUL.enduit, m.enduit, { crasse: false, nuance: 0 });
    M.pave(xv - 1.2, HM, zv2, xv + 1.2, HM + 0.3, -12.5, COUL.enduit, m.enduit, { crasse: false, nuance: 0 });
    for (const s of [-1, 1]) {
      for (let z = zv1; z < zv2 - 0.01; z += 1.05) {
        M.poutre([xv + s * 1.2, HM + 0.3, z], [xv, HM + 1.15, z], 0.07, COUL.fonte, m.tole);
        if (c.hasard() < 0.15 + 0.45 * usure) continue;
        const g = geoQuad([[xv + s * 1.18, HM + 0.32, z + 0.03], [xv + s * 1.18, HM + 0.32, z + 1.02], [xv + s * 0.03, HM + 1.13, z + 1.02], [xv + s * 0.03, HM + 1.13, z + 0.03]]);
        M.poser(g, m.verre, 0xdfe6e0, {}, { crasse: false, nuance: 0 });
        g.dispose();
      }
    }
    M.pave(xv - 0.06, HM + 1.1, zv1, xv + 0.06, HM + 1.2, zv2, COUL.fonte, m.tole);
    x0 = xv + 1.2;
  }
  M.pave(x0, HM, -26.3, 13.3, HM + 0.3, -12.5, COUL.enduit, m.enduit, { crasse: false, nuance: 0 });
  for (const [a1, b1, a2, b2] of [[-13.3, -26.3, 13.3, -26], [-13.3, -12.8, 13.3, -12.5], [-13.3, -26.3, -13, -12.5], [13, -26.3, 13.3, -12.5]]) M.pave(a1, HM + 0.3, b1, a2, HM + 0.75, b2, COUL.pierreClaire, m.pierre, { crasse: false });
  mousse(M, -9, HM + 0.3, -22, 1.3, Math.round(8 * usure), 0x6f7f48);
  semerTouffes(M, -13, -26, 13, -12.5, Math.round(30 * usure), PALETTE.herbeSeche, HM + 0.3);
  lierre(c, -13.32, 0, -22, -Math.PI / 2, 4, 3 + 3 * usure, Math.round(60 * usure));
  lierre(c, 6, 0, -26.32, Math.PI, 5, 4 + 2 * usure, Math.round(60 * usure));
  if (!visite) return;

  // --- Dedans : le labyrinthe des rayonnages ---
  const xs = Array.from({ length: 13 }, (_, i) => -11.4 + i * 1.9).filter((x) => Math.abs(x) > 0.5);
  const tombes = { 3.8: -0.62, 5.7: -0.66, 7.6: -0.7 };
  for (const x of xs) {
    const xr = Math.round(x * 10) / 10;
    // Le nord ; le coin du lecteur prend la place des deux derniers rayonnages
    if (xr < 9) rayonnage(k, x, -25.3, -20.1);
    // Le sud ; les trois rayonnages tombés en dominos
    if (tombes[xr] !== undefined) rayonnageTombe(k, x, -18.3, -13.6, tombes[xr]);
    else rayonnage(k, x, -18.3, -13.6);
  }
  // Les livres glissés des rayonnages tombés, et ceux tombés du haut un peu partout
  tasLivres(c, 5.8, -16, 1.8, Math.round(24 + 20 * usure));
  tasLivres(c, 9.2, -15.2, 1.1, 14);
  for (let i = 0; i < 7; i++) {
    const x = xs[Math.floor(c.hasard() * xs.length)] + 0.95;
    tasLivres(c, x, c.hasard() < 0.5 ? c.entre(-25, -20.5) : c.entre(-18, -14), 0.5, 4 + Math.floor(c.hasard() * 5));
  }
  // La mezzanine de fonte (caillebotis), son puits au-dessus de l'allée centrale, son garde-corps
  for (const [xa, xb] of [[-13, -1], [1, 13]]) {
    const nx = Math.round((xb - xa) / 2.4);
    const nz = Math.round(13.5 / 1.2);
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const lx = (xb - xa) / nx;
      const lz = 13.5 / nz;
      panneau(M, m.grille, R.grille, { x: xa + (i + 0.5) * lx, y: Y_MEZZ, z: -26 + (j + 0.5) * lz, rx: -Math.PI / 2 }, lx, lz);
    }
    const xe = xa < 0 ? xb : xa;
    M.poutre([xe, Y_MEZZ + 1, -26], [xe, Y_MEZZ + 1, -12.5], 0.04, COUL.fonte, m.tole);
    M.pave(xe - 0.05, Y_MEZZ - 0.2, -26, xe + 0.05, Y_MEZZ, -12.5, COUL.fonte, m.tole);
    for (let z = -25.5; z < -12.5; z += 1.5) M.poutre([xe, Y_MEZZ, z], [xe, Y_MEZZ + 1, z], 0.03, COUL.fonte, m.tole);
  }
  // Le monte-livres, dans l'angle nord-ouest : cage, câble, cabine coincée, manivelle
  {
    const x = -11.9;
    const z = -25.1;
    for (const [dx, dz] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]]) c.tube([x + dx, 0, z + dz], [x + dx, HM, z + dz], 0.03, COUL.fonte, m.tole, 4);
    c.pave(x - 0.42, 1.1, z - 0.42, x + 0.42, 1.8, z + 0.42, 0x6b5a48, m.satin);
    pileLivres(c, x, 1.8, z, 4);
    c.tube([x, 1.8, z], [x, HM, z], 0.012, 0x8d969a, m.metal, 3);
    c.poser(geoCylindre(0.28, 0.05, 10), m.tole, COUL.fonte, { x: x + 0.52, y: 1.2, z, rz: Math.PI / 2 }, { crasse: false });
  }
  // La table de tri et les chariots dans les allées
  tableLecture(k, 0, -22.5, Math.PI / 2, 3, 1, { lampes: 1, chaises: 1 });
  for (const [x, z, ry] of [[-4.8, -19.3, 0.3], [4.9, -19, -0.2]]) {
    c.repere({ x, y: SOL + 0.1, z, ry }, () => {
      for (const y of [0.15, 0.55, 0.9]) c.boite(0.9, 0.03, 0.42, 0x6b6e70, { y }, m.tole);
      for (const [a, b] of [[-0.43, -0.19], [0.43, -0.19], [-0.43, 0.19], [0.43, 0.19]]) c.boite(0.03, 0.95, 0.03, 0x6b6e70, { x: a, y: 0.5, z: b }, m.tole);
    });
    pileLivres(c, x - 0.2, SOL + 0.68, z, 4, ry);
    pileLivres(c, x + 0.2, SOL + 0.28, z, 3, ry);
  }
  // Le coin du lecteur, au nord-est : un mur de livres, un matelas, une caisse, la lampe à huile, son carnet
  {
    for (let i = 0; i < 8; i++) pileLivres(c, 8.9 + i * 0.5, SOL, -20.4 + c.entre(-0.1, 0.1), 6 + Math.floor(c.hasard() * 6), c.entre(-0.2, 0.2));
    c.boite(0.9, 0.14, 1.9, 0x8a8470, { x: 11.8, y: SOL + 0.07, z: -24.4, ry: 0.05 }, m.toile);
    c.boite(0.85, 0.06, 1.0, 0x6b4a3a, { x: 11.8, y: SOL + 0.17, z: -24.0, ry: 0.15 }, m.toile);
    c.pave(9.4, SOL, -24.6, 10.2, 0.5, -23.8, 0x8a6a48, m.mat);
    lampeHuile(c, 9.8, 0.5, -24.2);
    bougies(c, 9.6, 0.5, -24.45, 3);
    livreOuvert(c, 10.0, 0.5, -23.95, 0.4, 0.9, 0x2f4a3a);
    c.boite(0.15, 0.02, 0.21, 0x3b2a1e, { x: 9.55, y: 0.51, z: -23.95, ry: -0.3 }, m.mat, { crasse: false });
    for (let i = 0; i < 3; i++) c.poser(geoCylindre(0.05, 0.11, 6), m.metal, 0x9aa0a2, { x: 10.6 + i * 0.13, y: SOL + 0.055, z: -25.3 }, { crasse: false });
    chaise(c, 9.8, -22.9, Math.PI, "debout");
    pileLivres(c, 12.4, SOL, -22.6, 9, 0.2);
    pileLivres(c, 12.4, SOL, -22.0, 7, -0.3);
  }
  // Les rais de lumière des verrières, la flaque sous les vitres manquantes, la mousse
  raiDeLumiere(c, [0, HM + 1, -19.6], [0.5, SOL, -19.0], 1.8);
  raiDeLumiere(c, [-7, HM + 1, -16.5], [-6.7, SOL, -16.2], 1.6);
  flaque(c, 6.65, -22.4, 0.8, SOL + 0.012);
  mousse(c, 6.65, SOL, -23.4, 0.7, Math.round(5 * usure));
  mousse(c, -12.2, SOL, -14.5, 0.8, Math.round(5 * usure));
  jonchee(c, -12.5, -25.5, 12.5, -13, Math.round(50 * usure), [COUL.papier, 0xd8d0b8, 0xc8c0a0], SOL + 0.005);
  // La porte de service ouest, arrachée
  c.boite(1.25, 0.06, 2.5, 0x4a3628, { x: -14.2, y: 0.05, z: -19.5, ry: 0.4 }, m.satin);
}

// ---------- L'aile « Médiathèque 2.0 » ----------

const ALU = 0x3a3d40;

/** Une façade de verre (montants tous les `pas`), carreaux entiers, étoilés ou tombés ; `portes` : [u1, u2] laissés ouverts. */
function facadeVerre(k, a, b, h, pas, portes = []) {
  const { c, m, usure } = k;
  const { L, ry } = repereMur(a, b);
  const n = Math.round(L / pas);
  const lp = L / n;
  const ux = (b[0] - a[0]) / L;
  const uz = (b[1] - a[1]) / L;
  c.repere({ x: a[0], y: 0, z: a[1], ry }, () => {
    c.pave(0, SOL, -0.08, L, SOL + 0.1, 0.08, ALU, m.metal, { crasse: false });
    c.pave(0, h - 0.12, -0.08, L, h, 0.08, ALU, m.metal, { crasse: false });
    for (let i = 0; i <= n; i++) c.pave(i * lp - 0.04, SOL, -0.07, i * lp + 0.04, h, 0.07, ALU, m.metal, { crasse: false });
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) * lp;
      if (portes.some(([u1, u2]) => u > u1 && u < u2)) continue;
      const r = c.hasard();
      if (r < 0.15 + 0.55 * usure) {
        for (let q = 0; q < 6; q++) c.boite(c.entre(0.1, 0.35), 0.01, c.entre(0.1, 0.3), 0xbfd3d6, { x: u + c.entre(-0.7, 0.7), y: SOL + 0.01, z: c.entre(-1, 1), ry: c.hasard() * 3 }, m.verre, { crasse: false, nuance: 0 });
        continue;
      }
      c.pave(u - lp / 2 + 0.05, SOL + 0.1, -0.01, u + lp / 2 - 0.05, h - 0.12, 0.01, 0xffffff, m.verre, { crasse: false, nuance: 0 });
      if (r < 0.5) c.boite(c.entre(0.5, 0.9), c.entre(0.5, 0.9), 0.025, 0xe8eef0, { x: u + c.entre(-0.2, 0.2), y: c.entre(0.8, 2.2), rz: c.hasard() * 3 }, matiereVerre(0xdfe8ea, 0.6), { crasse: false, nuance: 0 });
      k.b.obstacle(a[0] + ux * (u - lp / 2), a[1] + uz * (u - lp / 2), a[0] + ux * (u + lp / 2), a[1] + uz * (u + lp / 2), "vitre");
    }
  });
}

function aile20(k) {
  const { c, m, usure } = k;
  const visite = k.mag;
  const D = visite ? k.D : c;
  // Les poteaux d'acier, les façades de verre, le mur blanc de l'ouest
  for (const x of [14, 18.5, 23, 27.5, 32]) for (const z of [-14, -9.5, -5, -0.5, 4]) {
    const bord = x === 14 || x === 32 || z === -14 || z === 4;
    const dedans = (x === 23 && (z === -9.5 || z === -0.5)) || (z === -5 && (x === 18.5 || x === 27.5));
    if (!bord && !dedans) continue;
    if (x === 14 && z > -14 && z < 4) continue;
    c.pave(x - 0.12, 0, z - 0.12, x + 0.12, H2, z + 0.12, ALU, m.metal);
  }
  facadeVerre(k, [14, 4], [32, 4], H2, 1.5, [[8.4, 10.6]]);
  facadeVerre(k, [32, 4], [32, -14], H2, 1.5, [[9.0, 11.0]]);
  facadeVerre(k, [32, -14], [14, -14], H2, 1.5);
  murCoupe(k, [14, -14], [14, 4], { h: H2, ep: 0.3, cut: H2, couleur: COUL.blanc2, mat: m.enduit, interieur: { couleur: COUL.blanc2, mat: m.enduit }, ouvertures: [{ u: 12, l: 3, bas: 0, haut: 3.1, type: "vide" }] });
  // Le passage vitré qui la relie à la rotonde
  facadeVerre(k, [10.6, -3.5], [14, -3.5], 3.2, 1.2);
  facadeVerre(k, [14, -0.5], [10.6, -0.5], 3.2, 1.2);
  D.pave(10.4, 3.2, -3.7, 14.1, 3.4, -0.3, COUL.blanc2, m.lisse, { crasse: false });
  // Le toit-terrasse, crevé au nord-est ; son bandeau ; l'enseigne
  const trou = usure > 0.3 ? { x1: 26, z2: -9 } : { x1: 28.5, z2: -11 };
  D.pave(13.9, H2, -14.1, trou.x1, H2 + 0.3, 4.1, COUL.blanc2, m.lisse, { crasse: false, nuance: 0 });
  D.pave(trou.x1, H2, trou.z2, 32.1, H2 + 0.3, 4.1, COUL.blanc2, m.lisse, { crasse: false, nuance: 0 });
  D.pave(13.9, H2 + 0.3, 3.95, 32.1, H2 + 0.6, 4.15, COUL.blanc2, m.lisse, { crasse: false });
  D.pave(13.9, H2 + 0.45, 4.1, 32.1, H2 + 0.6, 4.2, PALETTE.abondanceCanard, m.satin, { crasse: false });
  D.pave(31.95, H2 + 0.3, trou.z2, 32.15, H2 + 0.6, 4.15, COUL.blanc2, m.lisse, { crasse: false });
  // Des fers qui pendent au bord du trou
  for (let i = 0; i < 6; i++) {
    const z = trou.z2 + 0.02;
    const x = trou.x1 + 0.5 + i * ((32 - trou.x1) / 6);
    D.poutre([x, H2 + 0.15, z], [x + c.entre(-0.3, 0.3), H2 - c.entre(0.4, 1.1), z - c.entre(0.2, 0.6)], 0.03, PALETTE.rouille, m.tole);
  }
  for (const x of [17.5, 28.5]) D.pave(x - 0.05, H2 + 0.3, 3.9, x + 0.05, H2 + 1.6, 4.0, ALU, m.metal);
  panneau(D, m.enseignes, R.banniere, { x: 23, y: H2 + 1.1, z: 4.06 }, 9, 1.12, 0, 0.84);
  mousse(D, 18, H2 + 0.3, -6, 1.2, Math.round(7 * usure), 0x6f7f48);
  semerTouffes(D, 14, -14, 26, 4, Math.round(24 * usure), PALETTE.herbeSeche, H2 + 0.3);
  // La dalle effondrée, couchée en biais dans le trou ; le bouleau qui a pris
  c.repere({ x: 29.2, y: 0, z: -11.6, ry: 0.2 }, () => {
    c.boite(5.2, 0.3, 4.2, COUL.blanc2, { y: 1.6, rx: 0.62, rz: 0.12 }, m.lisse);
    for (let i = 0; i < 5; i++) c.poutre([-2 + i, 2.9, -1.6], [-2.2 + i, 3.3, -2.4], 0.03, PALETTE.rouille, m.tole);
  });
  k.b.obstacle(26.8, -13.8, 31.6, -9.6, "dalle tombée");
  gravats(c, 27.2, -9.6, 1.5, Math.round(12 + 12 * usure), [COUL.blanc2, PALETTE.beton, 0x9a9c9e], SOL);
  if (visite) arbre(c, 26.8, -12.6, 5 + 2 * usure, "bouleau", SOL);
  lierre(c, 32.1, 0, -2, Math.PI / 2, 3, 2.5 * usure, Math.round(40 * usure));
  if (!visite) return;

  // --- Dedans ---
  // Le faux plafond : ses rails, des dalles qui pendent, d'autres au sol
  for (let x = 15.2; x < trou.x1; x += 2.4) D.pave(x - 0.02, 3.6, -13.8, x + 0.02, 3.64, 3.8, 0xd8d8d4, m.tole, { crasse: false });
  for (let i = 0; i < 6; i++) D.boite(0.6, 0.02, 0.6, 0xe8e8e4, { x: c.entre(15.5, 25), y: c.entre(2.6, 3.4), z: c.entre(-13, 3), rx: c.entre(0.6, 1.4), ry: c.hasard() * 3 }, m.mat, { crasse: false });
  for (let i = 0; i < 14; i++) c.boite(0.6, 0.02, 0.6, 0xe8e8e4, { x: c.entre(14.6, 31), y: SOL + 0.02, z: c.entre(-13.5, 3.5), ry: c.hasard() * 3, rz: c.entre(-0.1, 0.1) }, m.mat, { crasse: false, nuance: 0.05 });
  // Les bornes de résumés audio : une seule luit encore
  for (let i = 0; i < 6; i++) {
    const x = 17 + i * 1.1;
    const z = -9.2 + (i % 2) * 0.35;
    const tombee = i === 4;
    c.repere(tombee ? { x, y: SOL + 0.2, z: z + 0.6, rx: Math.PI / 2 - 0.15, ry: 0.4 } : { x, y: SOL, z }, () => {
      c.boite(0.42, 1.0, 0.3, COUL.blanc2, { y: 0.5 }, m.lisse);
      c.boite(0.52, 0.38, 0.08, COUL.blanc2, { y: 1.18, z: 0.05, rx: -0.35 }, m.lisse);
      panneau(c, i === 2 ? m.ecran : m.enseignes, i === 2 ? R.ecranLuit : R.ecranMort, { y: 1.18, z: 0.1, rx: -0.35 }, 0.44, 0.3);
      c.boite(0.43, 0.06, 0.31, PALETTE.abondanceCanard, { y: 0.92 }, m.satin, { crasse: false });
    });
    if (!tombee) k.b.obstacle(x - 0.2, z, x + 0.2, z, "borne");
  }
  // Un casque audio tombé au pied des bornes
  for (const [x, z] of [[18.4, -8.4], [21.3, -8.1]]) {
    c.tube([x - 0.1, SOL + 0.03, z], [x + 0.1, SOL + 0.03, z], 0.05, 0x2b2d30, m.satin, 6);
    c.poser(new THREE.TorusGeometry(0.1, 0.012, 3, 8, Math.PI), m.satin, 0x2b2d30, { x, y: SOL + 0.03, z, rx: -Math.PI / 2 }, { crasse: false });
  }
  // Le bar à tablettes : tablettes attachées par des câbles, tabourets
  c.pave(22.5, 1.0, -1.8, 27.5, 1.06, -1.0, COUL.blanc2, m.lisse);
  for (const x of [22.8, 27.2]) c.pave(x - 0.1, SOL, -1.5, x + 0.1, 1.0, -1.3, COUL.blanc2, m.lisse);
  for (let i = 0; i < 6; i++) {
    const x = 23 + i * 0.8;
    if (i === 3) {
      panneau(c, m.enseignes, R.tablette, { x: x + 0.2, y: SOL + 0.01, z: -0.3, rx: -Math.PI / 2, rz: 0.5 }, 0.28, 0.28);
      c.tube([x, 1.0, -1.4], [x + 0.2, SOL + 0.02, -0.4], 0.008, 0x1e1e1e, m.mat, 3);
      continue;
    }
    panneau(c, m.enseignes, R.tablette, { x, y: 1.07, z: -1.4, rx: -Math.PI / 2, rz: c.entre(-0.3, 0.3) }, 0.28, 0.28);
  }
  for (let i = 0; i < 4; i++) {
    const x = 23.3 + i * 1.2;
    const tombe = i === 2;
    c.repere(tombe ? { x, y: SOL + 0.17, z: -0.2, rx: Math.PI / 2 } : { x, y: SOL, z: -0.55 }, () => {
      c.tube([0, 0, 0], [0, 0.75, 0], 0.03, 0x9aa0a2, m.metal, 5);
      c.poser(geoCylindre(0.18, 0.05, 8), m.satin, PALETTE.abondanceOcre, { y: 0.77 }, { crasse: false });
    });
  }
  k.b.obstacle(22.5, -1.4, 27.5, -1.4, "bar");
  // Les poufs de couleur ; deux ont crevé, leurs billes partout
  const tons = [PALETTE.abondanceRouge, PALETTE.abondanceCanard, PALETTE.abondanceOcre, PALETTE.abondanceCreme, 0x7a6a9a];
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * TAU;
    const x = 27.2 + Math.cos(a) * c.entre(1.4, 2.6);
    const z = -5.6 + Math.sin(a) * c.entre(1.2, 2.2);
    const creve = i === 3 || i === 8;
    c.poser(geoIco(0.42, 1), m.satin, tons[i % 5], { x, y: SOL + (creve ? 0.08 : 0.28), z, e: creve ? [1.5, 0.25, 1.4] : [1.1, 0.7, 1.1], ry: c.hasard() * 3 }, { crasse: false, nuance: 0.05 });
    if (creve) for (let q = 0; q < 24; q++) c.boite(0.03, 0.03, 0.03, 0xf2f2ee, { x: x + c.entre(-1.2, 1.2), y: SOL + 0.015, z: z + c.entre(-1.2, 1.2) }, m.mat, { crasse: false, nuance: 0 });
  }
  // Le marquage au sol « ZONE SANS LIVRES »
  panneau(c, m.enseignes, R.sansLivres, { x: 21.6, y: SOL + 0.008, z: -4.6, rx: -Math.PI / 2 }, 3.6, 1.8);
  // Les cabines de résumé audio (deux œufs)
  for (const z of [-1.2, 2.0]) {
    c.poser(geoIco(0.75, 1), m.lisse, COUL.blanc2, { x: 30.4, y: 0.95, z, e: [1, 1.25, 1] }, { crasse: false });
    c.poser(geoCylindre(0.5, 0.02, 10), m.satin, PALETTE.abondanceOcre, { x: 29.66, y: 0.95, z, rz: Math.PI / 2, e: [1, 1, 1.3] }, { crasse: false });
    k.b.obstacle(30.4, z - 0.7, 30.4, z + 0.7, "cabine");
  }
  // La borne de recharge Watty, encore chargée (son voyant vert luit la nuit)
  c.pave(30.45, SOL, -7.95, 30.85, 1.9, -7.25, PALETTE.abondanceCanard, m.satin);
  c.pave(30.4, 1.9, -8.0, 30.9, 2.0, -7.2, PALETTE.abondanceCreme, m.satin, { crasse: false });
  panneau(c, m.enseignes, R.watty, { x: 30.44, y: 1.35, z: -7.6, ry: -Math.PI / 2 }, 0.6, 0.6);
  panneau(c, m.ecran, R.ecranLuit, { x: 30.44, y: 0.85, z: -7.6, ry: -Math.PI / 2 }, 0.22, 0.12, 0.85, 0.95);
  for (let i = 0; i < 3; i++) c.tube([30.42, 0.7 - i * 0.1, -7.85 + i * 0.25], [30.1 - i * 0.2, SOL + 0.02, -7.9 + i * 0.4], 0.012, 0x1e1e1e, m.mat, 3);
  k.b.obstacle(30.45, -7.95, 30.45, -7.25, "borne");
  // Le mur de l'ouest : l'affiche « Pourquoi lire ? », l'étagère « pour la décoration » et ses livres rangés par couleur
  panneau(c, m.enseignes, R.pourquoi, { x: 14.17, y: 1.95, z: -6.6, ry: Math.PI / 2 }, 1.2, 1.8);
  panneau(c, m.enseignes, R.deco, { x: 14.17, y: 3.0, z: -12, ry: Math.PI / 2 }, 1.8, 0.9);
  const coul = new THREE.Color();
  for (const y of [0.9, 1.5, 2.1]) {
    c.pave(14.15, y - 0.03, -13.6, 14.5, y, -10.4, COUL.blanc2, m.lisse, { crasse: false });
    for (let i = 0; i < 14; i++) {
      coul.setHSL(i / 14, 0.42, 0.45);
      c.boite(0.24, c.entre(0.2, 0.28), 0.04 + c.hasard() * 0.03, coul.getHex(), { x: 14.3, y: y + 0.12, z: -13.4 + i * 0.22 }, m.satin, { crasse: false, nuance: 0.02 });
    }
  }
  panneau(c, m.enseignes, R.watty, { x: 23, y: 1.6, z: -9.37 }, 0.6, 0.6);
  // L'eau, l'herbe, les feuilles
  flaque(c, 24.8, -12, 1.2, SOL + 0.012);
  semerTouffes(c, 25, -14, 32, -8, Math.round(40 * usure), PALETTE.herbe, SOL);
  jonchee(c, 14.5, -13.5, 31.5, 3.5, Math.round(70 * usure), undefined, SOL + 0.005);
}
