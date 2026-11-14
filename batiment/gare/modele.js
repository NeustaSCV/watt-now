// La gare à verrière (Book 20 §3.3, « Gare », Ville, anneau moyen, danger ●●●).
//
// Inspiration : la gare internationale de Canfranc (façade Beaux-Arts interminable, abandonnée au milieu des
// montagnes), les halles à voyageurs en fer et en verre du XIXe siècle (la gare d'Orsay avant le musée, les gares belges
// abandonnées), la Petite Ceinture parisienne. Une gare de passage : le long bâtiment voyageurs en pierre blonde sur le
// parvis (pavillon central à l'horloge arrêtée et au dôme à l'impériale, deux ailes, deux pavillons d'extrémité),
// derrière lui la grande halle métallique (fermes en arc, verrière à petits bois qui a perdu la moitié de ses vitres,
// lanterneau, pignons en éventail), quatre voies qui filent vers l'est, vers le port.
//
// Deux cartes, qui partagent le même plan (« repère du site » : origine au centre du bâtiment voyageurs, +x à l'est,
// +z au sud). Chaque carte construit ce qu'elle voit, puis tout est recentré sur son propre lot (voir `recentrer`).
// - « voyageurs » : le parvis, le bâtiment voyageurs (salle des pas perdus, buffet, consigne, bureau des billets, salle
//   d'attente, bureau du chef de gare, lampisterie) et le quai n° 1 ; la halle au fond ;
// - « halle » : la halle et ses quais, les wagons visitables (voiture à compartiments, voiture-couchettes, wagon
//   couvert), la locomotive sous le lierre, le poste d'aiguillage ; le bâtiment voyageurs devient une couche qui
//   s'efface.
//
// Les façades sud et est du bâtiment voyageurs sont coupées à hauteur d'allège (CUT) : le haut, l'étage et les toits
// forment une couche qui s'efface quand le personnage entre ; le mur côté quais a sa propre couche, qui ne s'efface que
// lorsque le personnage est sur le quai.

import * as THREE from "three";
import {
  Batiment, PALETTE, matiere, matiereMonde, matiereTexture, matiereVerre, dessiner, aleatoire, taches,
  lierre as lierreA, touffes, semerTouffes as semerA, gravats, debris as debrisA, jonchee as joncheeA, mousse, arbuste, arbre,
  raiDeLumiere as raiA, flaque,
} from "../commun/atelier.js";

// La végétation et le petit désordre coûtent cher en triangles : on les dose.
const lierre = (c, x, y0, z, ry, l, h, n) => lierreA(c, x, y0, z, ry, l, h, Math.round(n * 0.4));
const semerTouffes = (c, x1, z1, x2, z2, n, t, y) => semerA(c, x1, z1, x2, z2, Math.max(1, Math.round(n * 0.5)), t, y);
const debris = (c, x1, z1, x2, z2, n, t, y) => debrisA(c, x1, z1, x2, z2, Math.max(1, Math.round(n * 0.6)), t, y);
const jonchee = (c, x1, z1, x2, z2, n, t, y) => joncheeA(c, x1, z1, x2, z2, Math.max(1, Math.round(n * 0.6)), t, y);
// Une seule opacité pour tous les rais : une seule matière de lueur.
const raiDeLumiere = (c, a, b, l) => raiA(c, a, b, l, 0.07);

const PI = Math.PI;
const TAU = PI * 2;

// ---------- Le plan du site ----------

/** Le bâtiment voyageurs : ailes de x = -30 à -10 et de 10 à 30 ; pavillon central (CP) ; pavillons d'extrémité. */
const BV = { x0: -38, x1: 38, z0: -6, z1: 6, h: 6.5, etage: 11, corniche: 11.8 };
const CP = { x0: -10, x1: 10, z1: 7.5, corniche: 13.4, attique: 14.2, dome: 17.6 };
const PAV_Z = 6.6; // les pavillons d'extrémité avancent un peu
const CUT = 0.9; // coupe des façades côté caméra (hauteur d'allège)
const CUTI = 2.6; // hauteur des cloisons intérieures toujours visibles
/** Les cloisons du rez-de-chaussée (x) et les pièces qu'elles séparent. */
const CLOISONS = [-30, -10, 10, 14, 22, 30];

/** La halle : fermes en arc sur colonnes de fonte (zs : rive sud, zn : rive nord), une ferme tous les 8 m. */
const HALLE = { x0: -32, x1: 32, zs: -11.5, zn: -41.5, yn: 8, fleche: 10, pas: 8 };
HALLE.zc = (HALLE.zs + HALLE.zn) / 2;
HALLE.demi = (HALLE.zs - HALLE.zn) / 2;
HALLE.R = (HALLE.demi ** 2 + HALLE.fleche ** 2) / (2 * HALLE.fleche);
HALLE.yc = HALLE.yn + HALLE.fleche - HALLE.R;
HALLE.t0 = Math.asin(HALLE.demi / HALLE.R);

/** Les voies (axe z) et les quais (z0 → z1), hauts de 0,3 m. */
const VOIES = [-14, -23, -26.5, -34.5];
const QUAIS = [
  { z0: -12.5, z1: -6, x0: -40, x1: 40, n: "1" },
  { z0: -21.5, z1: -15.5, x0: -30, x1: 30, n: "2" },
  { z0: -33, z1: -28, x0: -30, x1: 30, n: "3" },
];
const HQ = 0.3;

const ORIGINES = { voyageurs: { x: 0, z: 6 }, halle: { x: 10, z: -24 } };

function arr(v) {
  return Math.round(v * 10) / 10;
}
function vers(carte, liste) {
  const o = ORIGINES[carte];
  return liste.map((p) => ({ ...p, x: arr(p.x - o.x), z: arr(p.z - o.z) }));
}

// ---------- La fiche ----------

const FOUILLE = [
  // Le bâtiment voyageurs
  { x: -35.5, z: 2.5, quoi: "consigne automatique : casiers forcés, valises (vêtements, tissu, une montre à remonter)" },
  { x: -34, z: -3.5, quoi: "étagères de la bagagerie : malles cerclées, sangles de cuir, cadenas" },
  { x: -28.6, z: -1.5, quoi: "comptoir du buffet : vaisselle, couverts, bouteilles (alcool pour désinfecter)" },
  { x: -12.5, z: -5, quoi: "vaisselier du buffet : conserves cabossées, sucre en morceaux, nappes (tissu)" },
  { x: -5.5, z: 3.6, quoi: "kiosque à journaux : papier, magazines (allume-feu), cartes postales, briquets" },
  { x: 7.4, z: -5, quoi: "distributeur de Snacks énergétiques : barres périmées depuis la Panne (comestibles ? peut-être)" },
  { x: 5.6, z: 4.6, quoi: "borne de billet instantané : écran, batterie, fils de cuivre" },
  { x: 12.8, z: -4.6, quoi: "bureau des billets : coffre-fort entrouvert, rouleaux de billets (papier), poinçonneuse" },
  { x: 18, z: 0.5, quoi: "salle d'attente : poêle en fonte (fonte), banquettes (bois, crin)" },
  { x: 25, z: -3, quoi: "bureau du chef de gare : lanterne, sifflet, trousseau de clés, carte du réseau" },
  { x: 32, z: -4, quoi: "lampisterie : lanternes, bidons de pétrole, mèches" },
  { x: 37, z: 1, quoi: "établi de la lampisterie : outils, batteries de lanternes électriques, câbles" },
  { x: -14, z: -9, quoi: "chariot à bagages du quai n° 1 : roues, ferraille, une malle cerclée" },
  { x: 22, z: 15.5, quoi: "navette autonome encastrée dans un lampadaire : batterie, câbles, capteurs" },
  // La halle
  { x: -12, z: -13.4, quoi: "voiture à compartiments : filets à bagages, valises, couvertures" },
  { x: 0, z: -23.6, quoi: "voiture-couchettes : camp de survivants (couvertures, conserves, réchaud)" },
  { x: 23, z: -21, quoi: "locomotive : câbles de cuivre du moteur, batteries, bielles (acier)" },
  { x: -15, z: -34.5, quoi: "wagon couvert : caisses, sacs, tôle des parois" },
  { x: 6, z: -33.2, quoi: "wagon plat chargé de rails : rails (de quoi faire des enclumes)" },
  { x: -4, z: -30.5, quoi: "établi de survivants : rail tronçonné, scie à métaux, une enclume taillée dans un rail" },
  { x: 43.5, z: -39.5, quoi: "poste d'aiguillage : leviers (acier), câbles de signalisation (cuivre), lampe à pétrole" },
  { x: 20, z: -38.6, quoi: "touret de câble abandonné le long du mur (cuivre)" },
  { x: -22.5, z: -18.5, quoi: "chariot de la poste : sacs de courrier (papier, toile)" },
  { x: 50, z: -18.5, quoi: "aiguillage démonté à moitié : rails, coussinets, tire-fonds" },
  { x: 26, z: -26.5, quoi: "bogie déposé sur la voie 3 : ressorts, roues (acier)" },
];
const ETEINTS = [
  { x: -20, z: 1, type: "ancien habitant : serveuse du buffet (tablier, tire-bouchon)" },
  { x: 2, z: -1, type: "errant (salle des pas perdus)" },
  { x: -35, z: 4.5, type: "putréfié (au fond de la consigne)" },
  { x: 27, z: 1, type: "ancien habitant : chef de gare (casquette, sifflet)" },
  { x: 12, z: 18, type: "errant (parvis, près de la navette)" },
  { x: -14, z: -10, type: "rampant (sous le chariot à bagages, quai n° 1)" },
  { x: -6, z: -14.6, type: "ancien habitant : contrôleur (poinçonneuse, uniforme)" },
  { x: 10, z: -18, type: "errant (quai n° 2)" },
  { x: 22, z: -26.5, type: "rampant (dans les herbes de la voie 3)" },
  { x: -26, z: -38.5, type: "errant (le long du mur de la messagerie)" },
  { x: -12, z: -34.5, type: "équipé : agent de sûreté au casque, dans le wagon couvert" },
  { x: 42, z: -14, type: "errant (sur les voies, côté port)" },
  { x: -29, z: -24.5, type: "putréfié (entre les voies, sous la verrière)" },
];
const ENTREES = [
  { x: 0, z: 7.6, nature: "portail central (un vantail tamponné « Compteurs · vérifié »)" },
  { x: -20, z: 6.1, nature: "porte du buffet sur le parvis (un vantail tombé)" },
  { x: 34, z: 6.7, nature: "porte de la lampisterie sur le parvis" },
  { x: -38.1, z: 2.6, nature: "brèche du mur de la consigne (si l'usure dépasse 0,5)" },
  { x: 0, z: -6.1, nature: "portes de la salle des pas perdus côté quais" },
  { x: 40, z: -9, nature: "bout du quai n° 1, côté est" },
  { x: 32.5, z: -26.5, nature: "pignon est de la halle : les voies sous la verrière en éventail" },
  { x: -32.5, z: -24, nature: "pignon ouest de la halle" },
  { x: -12, z: -41.9, nature: "porte de la messagerie (mur nord de la halle)" },
  { x: 20, z: -41.9, nature: "seconde porte de la messagerie" },
];
const dans = (k) => (p) => {
  const o = ORIGINES[k.id];
  return Math.abs(p.x - o.x) <= k.lot.l / 2 && Math.abs(p.z - o.z) <= k.lot.p / 2;
};

const CARTES = [
  {
    id: "voyageurs",
    nom: "Le bâtiment voyageurs",
    lot: { l: 84, p: 36 },
    depart: { x: 8, z: 14 },
    description:
      "le parvis pavé, le bâtiment voyageurs (salle des pas perdus, buffet, consigne, bureau des billets, salle d'attente, bureau du chef de gare, lampisterie) et le quai n° 1 ; la halle au fond",
  },
  {
    id: "halle",
    nom: "La halle et les quais",
    lot: { l: 96, p: 40 },
    depart: { x: 32, z: 15 },
    description:
      "la grande halle à verrière, trois quais, quatre voies, les wagons visitables (compartiments, couchettes, wagon couvert), la locomotive sous le lierre, le poste d'aiguillage",
  },
];
for (const k of CARTES) {
  k.fouille = vers(k.id, FOUILLE.filter(dans(k)));
  k.eteints = vers(k.id, ETEINTS.filter(dans(k)));
  k.entrees = vers(k.id, ENTREES.filter(dans(k)));
}

export const FICHE = {
  id: "gare",
  nom: "La gare à verrière",
  lieu: "Gare · Ville · anneau moyen",
  environnement: "ville",
  anneau: "moyen",
  danger: 3,
  recit:
    "Cent vingt ans de trains à l'heure, puis l'Abondance a promis mieux : des trains autonomes sans conducteur, « 0 min de retard garanti ». Ils ont tenu parole : depuis la Grande Panne, aucun train n'est en retard, puisqu'aucun ne part. L'horloge s'est arrêtée à 11 h 04, les bouleaux poussent sur les quais, et les Compteurs, qui tiennent leur comptoir au coin de la rue, ont tamponné la porte : on fouille, mais on ne casse pas.",
  inspiration:
    "la gare internationale de Canfranc (façade Beaux-Arts interminable, abandonnée), les halles à voyageurs en fer et en verre du XIXe siècle (la gare d'Orsay avant le musée, les gares belges abandonnées), la Petite Ceinture parisienne",
  reperes: [
    "La façade de pierre blonde, longue de 76 m : arcades du rez-de-chaussée, étage à pilastres, combles à la Mansart et lucarnes, pavillons d'extrémité",
    "Le pavillon central : la grande baie thermale, l'horloge arrêtée à 11 h 04, le dôme à l'impériale et son lanterneau, l'enseigne GARE CENTRALE",
    "La halle : neuf fermes en arc sur colonnes de fonte, la verrière à petits bois qui a perdu la moitié de ses vitres, le lanterneau, les rais de lumière",
    "Les pignons en éventail, à l'est (côté port) et à l'ouest, avec leurs lambrequins ; la marquise du quai n° 1",
    "La salle des pas perdus : le panneau à palettes figé, les guichets, le kiosque à journaux, les bancs, le lustre tombé, un bouleau dans le dallage",
    "L'Abondance : la borne « Billet instantané — reconnaissance faciale », le panneau « Train autonome sans conducteur : 0 min de retard garanti », le distributeur de Snacks énergétiques, la navette autonome dans le lampadaire",
    "Les quais envahis d'herbes et de bouleaux, la voie 3 rendue à la friche, les voies qui partent vers l'horizon",
    "Les wagons sans bogies, posés sur des traverses : on y entre de plain-pied ; la voiture-couchettes où brûle le feu des survivants",
    "La locomotive mangée par le lierre, le poste d'aiguillage et sa rangée de leviers, les tringles qui courent vers les aiguilles",
    "Le tampon « Compteurs · vérifié » sur le portail, et la flèche à la craie vers le Comptoir de la Gare",
  ],
  lot: CARTES[0].lot,
  depart: CARTES[0].depart,
  cartes: CARTES,
};

// ---------- Couleurs (passées) ----------

const C = {
  pierre: 0xd9cdb2,
  pierreClaire: 0xe2d8c0,
  pierreSombre: 0xb2a68e,
  soubassement: 0x9e968a,
  ardoise: 0x58606a,
  zinc: 0x8d969a,
  fonte: 0x56655f, // fonte peinte vert wagon, passée
  fonteSombre: 0x3d4744,
  bois: 0x6e5238,
  boisSombre: 0x4e3a2a,
  boisClair: 0x9a7a55,
  creme: 0xd8ceb4,
  rail: 0x6a5446,
  traverse: 0x7a7266,
  ballast: 0x7b766d,
  quai: 0xaaa59b,
  bordure: 0xcfc8b6,
  chassis: 0x2f2c2a,
  wagonVert: 0x52695a,
  wagonBleu: 0x45556c,
  wagonRouge: 0x7a4634,
  loco: 0x8c6040,
  velours: 0x7a3c36,
  cuir: 0x5c3b2a,
  brique: 0x9c5c45,
  suie: 0x2c2926,
  blanc: 0xe6e1d4,
  laiton: 0xb59048,
};

// ---------- Matériaux (tous partagés : un matériau = un appel de dessin) ----------

const memo = new Map();
function une(cle, f) {
  if (!memo.has(cle)) memo.set(cle, f());
  return memo.get(cle);
}
const M = {
  mat: () => matiere(0.95, 0),
  satin: () => matiere(0.6, 0.05),
  lisse: () => matiere(0.3, 0.05),
  tole: () => matiere(0.75, 0.3),
  metal: () => matiere(0.4, 0.7),
  pierre: () => matiereMonde("pierreTaille"),
  brique: () => matiereMonde("brique"),
  beton: () => matiereMonde("beton"),
  damier: () => matiereMonde("damier"),
  parquet: () => matiereMonde("parquet"),
  ardoise: () => matiereMonde("ardoise"),
  verre: () => matiereVerre(PALETTE.verreSombre, 0.4),
  paves: () =>
    une("paves", () => {
      const m = matiereTexture(texPaves(), { roughness: 0.95 });
      m.userData.tuile = 4;
      return m;
    }),
  /** Le vitrage à petits bois (UV « monde », tuile de 4 m) : une part des carreaux manque selon l'usure. */
  vitrage: (usure) => {
    const casse = Math.round((0.15 + 0.5 * usure) * 5) / 5;
    return une("vitrage" + casse, () => {
      const m = new THREE.MeshStandardMaterial({ map: texVitrage(casse), vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, roughness: 0.25, metalness: 0.3 });
      m.userData.sansOmbre = true;
      m.userData.tuile = 4;
      return m;
    });
  },
  atlas: () =>
    une("atlas", () => {
      const m = new THREE.MeshStandardMaterial({ map: texAtlas(), vertexColors: true, transparent: true, alphaTest: 0.05, roughness: 0.85, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      m.userData.sansOmbre = true;
      return m;
    }),
};

// ---------- Textures ----------

function grain(g, a, n, l, h, force) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = a() < 0.5 ? `rgba(0,0,0,${force})` : `rgba(255,255,255,${force})`;
    g.fillRect(a() * l, a() * h, 1 + a() * 3, 1 + a() * 3);
  }
}

function rectArrondi(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** Les pavés du parvis : 0,2 m, joints verdis, mousse. Tuile de 4 m. */
function texPaves() {
  return dessiner("gare-paves", 256, 256, (g) => {
    const a = aleatoire(501);
    g.fillStyle = "#6c6858";
    g.fillRect(0, 0, 256, 256);
    const n = 20;
    const s = 256 / n;
    for (let r = 0; r < n; r++)
      for (let i = -1; i <= n; i++) {
        const dec = r % 2 ? s / 2 : 0;
        const v = 178 + Math.floor((a() - 0.5) * 50);
        g.fillStyle = `rgb(${v},${v - 5},${v - 14})`;
        rectArrondi(g, i * s + dec + 1, r * s + 1, s - 2, s - 2, 3);
        g.fill();
      }
    grain(g, a, 900, 256, 256, 0.05);
    taches(g, a, 22, "rgba(80,110,50,0.35)", 6, 30, 256, 256);
    taches(g, a, 10, "rgba(40,36,30,0.25)", 10, 40, 256, 256);
  });
}

/** Le vitrage à petits bois : 8 × 7 carreaux par tuile de 4 m ; une part `casse` des carreaux manque. */
function texVitrage(casse) {
  return dessiner("gare-vitrage" + casse, 256, 256, (g) => {
    const a = aleatoire(603 + Math.round(casse * 10));
    g.clearRect(0, 0, 256, 256);
    const lc = 32;
    const hc = 256 / 7;
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 7; j++) {
        const r = a();
        const x = i * lc;
        const y = j * hc;
        if (r < casse) {
          if (a() < 0.5) {
            g.fillStyle = "rgba(160,180,172,0.55)";
            g.beginPath();
            const cx = a() < 0.5 ? x : x + lc;
            const cy = a() < 0.5 ? y : y + hc;
            g.moveTo(cx, cy);
            g.lineTo(cx + (cx === x ? 1 : -1) * lc * (0.3 + a() * 0.5), cy);
            g.lineTo(cx, cy + (cy === y ? 1 : -1) * hc * (0.3 + a() * 0.5));
            g.fill();
          }
        } else if (r < casse + 0.04) {
          g.fillStyle = "rgba(110,92,68,0.97)"; // planche clouée
          g.fillRect(x, y, lc, hc);
        } else {
          const v = 150 + Math.floor(a() * 40);
          const d = g.createLinearGradient(0, y, 0, y + hc);
          d.addColorStop(0, `rgba(${v},${v + 18},${v + 12},${0.35 + a() * 0.2})`);
          d.addColorStop(1, `rgba(${v - 40},${v - 28},${v - 34},${0.55 + a() * 0.25})`);
          g.fillStyle = d;
          g.fillRect(x, y, lc, hc);
          if (a() < 0.25) {
            // salissures, mousse dans les coins
            g.fillStyle = "rgba(90,100,60,0.45)";
            g.fillRect(x, y + hc * 0.75, lc, hc * 0.25);
          }
        }
      }
    g.fillStyle = "rgba(48,54,50,1)";
    for (let i = 0; i <= 8; i++) g.fillRect(i * lc - 1.5, 0, 3, 256);
    for (let j = 0; j <= 7; j++) g.fillRect(0, j * hc - 1.5, 256, 3);
  });
}

// L'atlas : horloge, enseignes, panneau à palettes, Abondance, plaques émaillées, tampon des Compteurs, affiches.
// Une seule texture, un seul appel de dessin (par couche) pour tout ce qui est peint ou imprimé.
const ATLAS = {
  horloge: [0, 0, 256, 256],
  enseigne: [256, 0, 768, 96],
  palettes: [256, 96, 512, 224],
  borne: [768, 96, 128, 224],
  snacks: [896, 96, 128, 224],
  autonome: [0, 320, 512, 128],
  plaque0: [512, 320, 256, 48], // BUFFET
  plaque1: [512, 368, 256, 48], // CONSIGNE
  plaque2: [512, 416, 256, 48], // SALLE D'ATTENTE
  plaque3: [512, 464, 256, 48], // CHEF DE GARE
  plaque4: [512, 512, 256, 48], // LAMPISTERIE
  plaque5: [512, 560, 256, 48], // BILLETS
  plaque6: [512, 608, 256, 48], // ACCÈS AUX QUAIS
  tampon: [768, 320, 128, 128],
  watty: [896, 320, 128, 192],
  quai1: [768, 448, 64, 64],
  quai2: [832, 448, 64, 64],
  quai3: [768, 512, 64, 64],
  classe1: [832, 512, 64, 64],
  presse: [0, 448, 512, 96],
  graffiti: [0, 544, 512, 96],
  diagramme: [0, 640, 512, 128],
  couchettes: [768, 576, 256, 64],
  sortie: [768, 640, 128, 48],
  loco: [896, 640, 128, 48],
  navette: [768, 700, 256, 56],
  ardoise: [512, 656, 256, 128],
  craie: [512, 784, 256, 96],
  horaires: [0, 768, 256, 192],
  carte: [256, 768, 256, 192],
  casiers: [768, 768, 256, 192],
};
const POLICE = '"Arial Black", "Helvetica Neue", Impact, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const FEUTRE = '"Marker Felt", "Chalkboard SE", "Comic Sans MS", cursive';

function texte(g, t, x, y, largeurMax, taille, police, couleur, poids = "900", align = "center") {
  g.font = `${poids} ${taille}px ${police}`;
  const w = g.measureText(t).width;
  if (w > largeurMax) g.font = `${poids} ${(taille * largeurMax) / w}px ${police}`;
  g.fillStyle = couleur;
  g.textAlign = align;
  g.textBaseline = "middle";
  g.fillText(t, x, y);
}

/** Le temps passe : la couleur part par plaques, un voile clair, des coulures. */
function user(g, a, [x, y, w, h], n = 40, force = 0.25) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.fillStyle = `rgba(236,230,214,${force})`;
  g.fillRect(x, y, w, h);
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < n; i++) {
    const px = x + a() * w;
    const py = y + a() * h;
    const r = 1 + a() * Math.min(w, h) * 0.06;
    g.fillStyle = "rgba(0,0,0,0.85)";
    g.beginPath();
    g.arc(px, py, r, 0, TAU);
    g.fill();
  }
  g.restore();
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  for (let i = 0; i < 6; i++) {
    const px = x + a() * w;
    const lg = h * (0.3 + a() * 0.6);
    const d = g.createLinearGradient(0, y, 0, y + lg);
    d.addColorStop(0, "rgba(90,70,45,0.3)");
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(px, y, 2 + a() * 4, lg);
  }
  g.restore();
}

/** Watty, la pile souriante (version affiche) : corps canard, tête crème, clin d'œil, éclair rouge. */
function dessinerWatty(g, cx, cy, s) {
  const w = s * 0.56;
  const h = s;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const encre = "#1f2526";
  g.save();
  g.lineCap = "round";
  g.strokeStyle = encre;
  for (const sx of [-1, 1]) {
    g.lineWidth = s * 0.06;
    g.beginPath();
    g.moveTo(cx + sx * w * 0.22, y + h - 2);
    g.lineTo(cx + sx * w * 0.3, y + h + s * 0.18);
    g.stroke();
    g.fillStyle = "#c8362b";
    g.beginPath();
    g.ellipse(cx + sx * w * 0.38, y + h + s * 0.2, s * 0.1, s * 0.05, 0, 0, TAU);
    g.fill();
  }
  g.lineWidth = s * 0.06;
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
  g.save();
  rectArrondi(g, x, y, w, h, s * 0.1);
  g.clip();
  g.fillStyle = "#e9dfc6";
  g.fillRect(x, y, w, h * 0.2);
  g.restore();
  rectArrondi(g, x, y, w, h, s * 0.1);
  g.lineWidth = s * 0.035;
  g.stroke();
  g.fillStyle = "#c79a3b";
  g.fillRect(cx - w * 0.17, y - s * 0.08, w * 0.34, s * 0.09);
  const ey = y + h * 0.34;
  g.fillStyle = "#f6f0e0";
  g.beginPath();
  g.ellipse(cx - w * 0.2, ey, s * 0.06, s * 0.075, 0, 0, TAU);
  g.fill();
  g.fillStyle = encre;
  g.beginPath();
  g.arc(cx - w * 0.18, ey + s * 0.012, s * 0.03, 0, TAU);
  g.fill();
  g.lineWidth = s * 0.03;
  g.beginPath();
  g.arc(cx + w * 0.2, ey + s * 0.03, s * 0.055, PI * 1.1, PI * 1.9);
  g.stroke();
  g.lineWidth = s * 0.035;
  g.beginPath();
  g.arc(cx, y + h * 0.42, w * 0.27, PI * 0.15, PI * 0.85);
  g.stroke();
  const bx = cx;
  const by = y + h * 0.72;
  const e = s * 0.17;
  g.fillStyle = "#c8362b";
  g.beginPath();
  g.moveTo(bx + e * 0.2, by - e);
  g.lineTo(bx - e * 0.45, by + e * 0.12);
  g.lineTo(bx - e * 0.02, by + e * 0.12);
  g.lineTo(bx - e * 0.22, by + e);
  g.lineTo(bx + e * 0.45, by - e * 0.15);
  g.lineTo(bx + e * 0.03, by - e * 0.15);
  g.closePath();
  g.fill();
  g.restore();
}

function texAtlas() {
  return dessiner(
    "gare-atlas",
    1024,
    1024,
    (g) => {
      const a = aleatoire(707);
      g.clearRect(0, 0, 1024, 1024);

      // --- L'horloge : cadran émaillé, chiffres romains, aiguilles arrêtées à 11 h 04 ---
      {
        const cx = 128;
        const cy = 128;
        g.fillStyle = "#2d2a26";
        g.beginPath();
        g.arc(cx, cy, 126, 0, TAU);
        g.fill();
        g.fillStyle = "#e8e0c8";
        g.beginPath();
        g.arc(cx, cy, 112, 0, TAU);
        g.fill();
        g.strokeStyle = "#2d2a26";
        g.lineWidth = 2;
        g.beginPath();
        g.arc(cx, cy, 104, 0, TAU);
        g.stroke();
        const romains = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
        for (let i = 0; i < 12; i++) {
          const an = (i / 12) * TAU - PI / 2;
          g.save();
          g.translate(cx + Math.cos(an) * 86, cy + Math.sin(an) * 86);
          g.rotate(an + PI / 2);
          texte(g, romains[i], 0, 0, 30, 20, SERIF, "#2d2a26", "700");
          g.restore();
        }
        for (let i = 0; i < 60; i++) {
          const an = (i / 60) * TAU;
          g.fillStyle = "#2d2a26";
          g.beginPath();
          g.arc(cx + Math.cos(an) * 102, cy + Math.sin(an) * 102, i % 5 ? 1 : 2, 0, TAU);
          g.fill();
        }
        const aiguille = (an, lg, ep) => {
          g.save();
          g.translate(cx, cy);
          g.rotate(an);
          g.fillStyle = "#1e1c1a";
          g.beginPath();
          g.moveTo(-ep, 10);
          g.lineTo(0, -lg);
          g.lineTo(ep, 10);
          g.closePath();
          g.fill();
          g.restore();
        };
        aiguille(((11 + 4 / 60) / 12) * TAU, 52, 6);
        aiguille((4 / 60) * TAU, 82, 4);
        g.fillStyle = "#1e1c1a";
        g.beginPath();
        g.arc(cx, cy, 7, 0, TAU);
        g.fill();
        // fêlure du verre, rouille
        g.strokeStyle = "rgba(40,36,30,0.6)";
        g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(cx + 30, cy - 100);
        g.lineTo(cx + 10, cy - 40);
        g.lineTo(cx + 40, cy + 20);
        g.lineTo(cx + 20, cy + 90);
        g.stroke();
        taches(g, a, 8, "rgba(130,80,40,0.25)", 6, 26, 256, 256);
      }

      // --- L'enseigne : GARE CENTRALE, lettres dorées en relief (fond transparent) ---
      {
        const [x0, y0, w, h] = ATLAS.enseigne;
        texte(g, "GARE CENTRALE", x0 + w / 2 + 3, y0 + h / 2 + 4, w - 40, 72, SERIF, "rgba(30,26,20,0.7)", "700");
        texte(g, "GARE CENTRALE", x0 + w / 2, y0 + h / 2, w - 40, 72, SERIF, "#b8963e", "700");
        user(g, a, [x0, y0, w, h], 30, 0.15);
      }

      // --- Le panneau à palettes, figé ---
      {
        const [x0, y0, w, h] = ATLAS.palettes;
        g.fillStyle = "#191a1c";
        g.fillRect(x0, y0, w, h);
        g.fillStyle = "#2a2c30";
        g.fillRect(x0, y0, w, 30);
        texte(g, "DÉPARTS", x0 + 70, y0 + 16, 120, 20, POLICE, "#e8c35a", "900");
        texte(g, "HEURE   DESTINATION            VOIE   OBSERVATIONS", x0 + 300, y0 + 16, 360, 12, "monospace", "#c8c2b0", "700");
        const lignes = [
          ["07:58", "LE PORT", "1", "RETARDÉ"],
          ["08:12", "BARRAGE", "2", "SUPPRIMÉ"],
          ["08:30", "ZONE INDUSTRIELLE", "3", "-------"],
          ["08:47", "LA CÔTE", "1", "À L'HEURE"],
          ["09:05", "MONTAGNE", "4", "SUPPRIMÉ"],
          ["09:20", "AUTONOME 0 RETARD", "2", "ANNULÉ"],
        ];
        const cw = 13;
        const ch = 26;
        for (let r = 0; r < lignes.length; r++) {
          const y = y0 + 38 + r * 30;
          const champs = [[lignes[r][0], 8, 5], [lignes[r][1], 80, 18], [lignes[r][2], 330, 2], [lignes[r][3], 370, 10]];
          for (const [t, dx, n] of champs) {
            for (let i = 0; i < n; i++) {
              const xx = x0 + dx + i * cw;
              g.fillStyle = "#0e0f10";
              g.fillRect(xx, y, cw - 2, ch);
              const coince = r === 2 && i === 3 && dx === 80;
              const lettre = t[i] ?? " ";
              if (coince) {
                // une palette coincée à mi-course
                g.fillStyle = "#3a3c40";
                g.fillRect(xx, y + ch * 0.3, cw - 2, ch * 0.25);
                continue;
              }
              texte(g, lettre, xx + (cw - 2) / 2, y + ch / 2, cw - 2, 20, "monospace", r === 1 || r === 4 ? "#e07a5a" : "#e9e4d4", "700");
              g.fillStyle = "rgba(0,0,0,0.7)";
              g.fillRect(xx, y + ch / 2 - 0.5, cw - 2, 1);
            }
          }
        }
        user(g, a, [x0, y0, w, h], 18, 0.08);
      }

      // --- La borne « Billet instantané » : écran, reconnaissance faciale ---
      {
        const [x0, y0, w, h] = ATLAS.borne;
        g.fillStyle = "#e9dfc6";
        g.fillRect(x0, y0, w, h);
        g.fillStyle = "#2f6f73";
        g.fillRect(x0, y0, w, 40);
        texte(g, "BILLET", x0 + w / 2, y0 + 14, w - 10, 16, POLICE, "#e9dfc6");
        texte(g, "INSTANTANÉ", x0 + w / 2, y0 + 30, w - 10, 14, POLICE, "#e9dfc6");
        g.fillStyle = "#1b2a2e";
        g.fillRect(x0 + 10, y0 + 50, w - 20, 92);
        g.strokeStyle = "#7fd0e0";
        g.lineWidth = 2;
        g.beginPath();
        g.ellipse(x0 + w / 2, y0 + 92, 22, 28, 0, 0, TAU);
        g.stroke();
        g.setLineDash([4, 4]);
        g.strokeRect(x0 + 24, y0 + 58, w - 48, 72);
        g.setLineDash([]);
        texte(g, "VISAGE NON RECONNU", x0 + w / 2, y0 + 134, w - 24, 9, POLICE, "#e0786a");
        texte(g, "Reconnaissance faciale", x0 + w / 2, y0 + 156, w - 12, 11, POLICE, "#2f6f73", "700");
        texte(g, "Souriez, c'est payé !", x0 + w / 2, y0 + 174, w - 12, 12, POLICE, "#c8362b", "700");
        g.fillStyle = "#c79a3b";
        g.fillRect(x0 + 20, y0 + 192, w - 40, 8);
        texte(g, "Âge de l'Abondance", x0 + w / 2, y0 + 212, w - 10, 9, POLICE, "#6b6250", "700");
        user(g, a, [x0, y0, w, h], 20, 0.18);
      }

      // --- Le distributeur de Snacks énergétiques ---
      {
        const [x0, y0, w, h] = ATLAS.snacks;
        g.fillStyle = "#c8362b";
        g.fillRect(x0, y0, w, h);
        texte(g, "SNACKS", x0 + w / 2, y0 + 16, w - 12, 20, POLICE, "#e9dfc6");
        texte(g, "ÉNERGÉTIQUES", x0 + w / 2, y0 + 34, w - 12, 13, POLICE, "#e9dfc6");
        g.fillStyle = "#1c2226";
        g.fillRect(x0 + 8, y0 + 46, w - 34, 150);
        const tons = ["#c79a3b", "#2f6f73", "#e9dfc6", "#7a2630", "#5d8a46"];
        for (let r = 0; r < 5; r++)
          for (let i = 0; i < 4; i++) {
            if (a() < 0.35) continue; // spirale vide
            g.fillStyle = tons[Math.floor(a() * tons.length)];
            g.fillRect(x0 + 12 + i * 21, y0 + 52 + r * 29, 16, 20);
          }
        g.fillStyle = "rgba(200,220,230,0.18)";
        g.fillRect(x0 + 8, y0 + 46, w - 34, 150);
        g.fillStyle = "#3a3c40";
        g.fillRect(x0 + w - 22, y0 + 60, 14, 60);
        texte(g, "+300 Wh de bonne humeur", x0 + w / 2, y0 + 210, w - 10, 10, POLICE, "#e9dfc6", "700");
        user(g, a, [x0, y0, w, h], 26, 0.2);
      }

      // --- Le panneau « Train autonome sans conducteur » ---
      {
        const [x0, y0, w, h] = ATLAS.autonome;
        g.fillStyle = "#2f6f73";
        g.fillRect(x0, y0, w, h);
        g.fillStyle = "#e9dfc6";
        g.fillRect(x0, y0 + h - 34, w, 34);
        g.fillStyle = "#c8362b";
        g.fillRect(x0, y0, 14, h);
        // le pictogramme du train sans cabine
        g.fillStyle = "#e9dfc6";
        rectArrondi(g, x0 + 30, y0 + 22, 90, 40, 18);
        g.fill();
        g.fillStyle = "#2f6f73";
        g.fillRect(x0 + 44, y0 + 30, 18, 12);
        g.fillRect(x0 + 68, y0 + 30, 18, 12);
        texte(g, "TRAIN AUTONOME SANS CONDUCTEUR", x0 + 315, y0 + 34, 360, 26, POLICE, "#e9dfc6");
        texte(g, "0 min de retard garanti*", x0 + 315, y0 + 66, 360, 24, POLICE, "#c79a3b");
        texte(g, "*hors cas de force majeure, panne, fin du monde", x0 + w / 2, y0 + h - 17, w - 30, 14, POLICE, "#2f6f73", "700");
        user(g, a, [x0, y0, w, h], 40, 0.2);
        // la réponse d'un survivant, à la bombe
        g.save();
        g.translate(x0 + 330, y0 + 98);
        g.rotate(-0.06);
        texte(g, "0 TRAIN NON PLUS", 0, 0, 260, 26, FEUTRE, "rgba(240,236,226,0.9)", "700");
        g.restore();
      }

      // --- Les plaques émaillées (blanc sur bleu) ---
      const plaques = ["BUFFET", "CONSIGNE", "SALLE D'ATTENTE", "CHEF DE GARE", "LAMPISTERIE", "BILLETS", "ACCÈS AUX QUAIS"];
      plaques.forEach((t, i) => {
        const [x0, y0, w, h] = ATLAS["plaque" + i];
        g.fillStyle = "#1f3a6b";
        rectArrondi(g, x0 + 2, y0 + 2, w - 4, h - 4, 8);
        g.fill();
        g.strokeStyle = "#e9e4d8";
        g.lineWidth = 3;
        rectArrondi(g, x0 + 7, y0 + 7, w - 14, h - 14, 5);
        g.stroke();
        texte(g, t, x0 + w / 2, y0 + h / 2 + 1, w - 30, 24, POLICE, "#e9e4d8");
        // éclats d'émail
        for (let k = 0; k < 6; k++) {
          g.fillStyle = "#2a2622";
          g.beginPath();
          g.arc(x0 + 4 + a() * (w - 8), y0 + 4 + a() * (h - 8), 1 + a() * 3, 0, TAU);
          g.fill();
        }
      });

      // --- Le tampon des Compteurs ---
      {
        const [x0, y0, w, h] = ATLAS.tampon;
        const cx = x0 + w / 2;
        const cy = y0 + h / 2;
        g.save();
        g.translate(cx, cy);
        g.rotate(-0.18);
        g.strokeStyle = "rgba(70,60,140,0.85)";
        g.lineWidth = 5;
        g.beginPath();
        g.arc(0, 0, 58, 0, TAU);
        g.stroke();
        g.lineWidth = 2;
        g.beginPath();
        g.arc(0, 0, 44, 0, TAU);
        g.stroke();
        const mot = "· COMPTEURS · COMPTEURS ";
        g.font = `900 13px ${POLICE}`;
        g.fillStyle = "rgba(70,60,140,0.85)";
        g.textAlign = "center";
        g.textBaseline = "middle";
        for (let i = 0; i < mot.length; i++) {
          const an = (i / mot.length) * TAU - PI / 2;
          g.save();
          g.rotate(an + PI / 2);
          g.fillText(mot[i], 0, -51);
          g.restore();
        }
        texte(g, "VÉRIFIÉ", 0, -4, 80, 20, POLICE, "rgba(70,60,140,0.9)");
        texte(g, "J + 412", 0, 16, 60, 12, POLICE, "rgba(70,60,140,0.8)");
        g.restore();
        // l'encre a mal pris par endroits
        g.save();
        g.globalCompositeOperation = "destination-out";
        for (let i = 0; i < 60; i++) {
          g.fillStyle = "rgba(0,0,0,0.8)";
          g.fillRect(x0 + a() * w, y0 + a() * h, 2 + a() * 5, 1 + a() * 3);
        }
        g.restore();
      }

      // --- L'affiche de Watty : « Voyagez plein, jamais à plat ! » ---
      {
        const [x0, y0, w, h] = ATLAS.watty;
        g.fillStyle = "#e9dfc6";
        g.fillRect(x0, y0, w, h);
        g.fillStyle = "#c8362b";
        g.fillRect(x0, y0, w, 30);
        texte(g, "VOYAGEZ PLEIN,", x0 + w / 2, y0 + 15, w - 10, 14, POLICE, "#e9dfc6");
        dessinerWatty(g, x0 + w / 2, y0 + 92, 90);
        g.fillStyle = "#2f6f73";
        g.fillRect(x0, y0 + h - 34, w, 34);
        texte(g, "JAMAIS À PLAT !", x0 + w / 2, y0 + h - 17, w - 10, 14, POLICE, "#e9dfc6");
        user(g, a, [x0, y0, w, h], 40, 0.25);
        // l'affiche est déchirée en bas à gauche
        g.save();
        g.globalCompositeOperation = "destination-out";
        g.beginPath();
        g.moveTo(x0, y0 + h);
        g.lineTo(x0, y0 + h - 60);
        g.lineTo(x0 + 22, y0 + h - 40);
        g.lineTo(x0 + 12, y0 + h - 20);
        g.lineTo(x0 + 40, y0 + h);
        g.closePath();
        g.fill();
        g.restore();
      }

      // --- Les numéros de quai, la classe ---
      for (const [cle, t] of [["quai1", "1"], ["quai2", "2"], ["quai3", "3"]]) {
        const [x0, y0, w, h] = ATLAS[cle];
        g.fillStyle = "#1f3a6b";
        rectArrondi(g, x0 + 2, y0 + 2, w - 4, h - 4, 6);
        g.fill();
        texte(g, t, x0 + w / 2, y0 + h / 2 + 2, w - 10, 46, POLICE, "#e9e4d8");
      }
      {
        const [x0, y0, w, h] = ATLAS.classe1;
        texte(g, "1", x0 + w / 2, y0 + h / 2 + 2, w - 10, 50, POLICE, "#d9b85a");
      }

      // --- Le kiosque : PRESSE, couvertures de magazines ---
      {
        const [x0, y0, w, h] = ATLAS.presse;
        g.fillStyle = "#2f4a3a";
        g.fillRect(x0, y0, w, 30);
        texte(g, "PRESSE · JOURNAUX · TABAC", x0 + w / 2, y0 + 15, w - 20, 20, POLICE, "#e9dfc6");
        const titres = ["L'ABONDANCE", "WATT'S UP", "LA PANNE ?", "MAISON+", "BOURSE", "TÉLÉ 24/24", "VOYAGES"];
        for (let i = 0; i < titres.length; i++) {
          const xx = x0 + 6 + i * 72;
          g.fillStyle = ["#c8362b", "#2f6f73", "#e9dfc6", "#c79a3b", "#4a5a7a", "#7a2630", "#5d8a46"][i];
          g.fillRect(xx, y0 + 34, 64, 60);
          texte(g, titres[i], xx + 32, y0 + 44, 58, 10, POLICE, i === 2 ? "#2d2a26" : "#f2ead6");
          g.fillStyle = "rgba(255,255,255,0.35)";
          g.fillRect(xx + 8, y0 + 54, 48, 26);
        }
        texte(g, "« Une rumeur », dit la Compagnie", x0 + 186, y0 + 86, 66, 7, POLICE, "#2d2a26", "700");
        user(g, a, [x0, y0, w, h], 50, 0.25);
      }

      // --- Graffiti des survivants ---
      {
        const [x0, y0, w, h] = ATLAS.graffiti;
        g.save();
        g.translate(x0 + w / 2, y0 + h / 2);
        g.rotate(-0.04);
        texte(g, "PROCHAIN TRAIN : ∞", 0, 0, w - 30, 54, FEUTRE, "rgba(190,50,40,0.85)", "700");
        g.restore();
      }

      // --- Le tableau de contrôle optique du poste d'aiguillage ---
      {
        const [x0, y0, w, h] = ATLAS.diagramme;
        g.fillStyle = "#2a2f2c";
        g.fillRect(x0, y0, w, h);
        g.strokeStyle = "#d8d2c0";
        g.lineWidth = 4;
        for (const y of [30, 55, 78, 102]) {
          g.beginPath();
          g.moveTo(x0 + 10, y0 + y);
          g.lineTo(x0 + w - 10, y0 + y);
          g.stroke();
        }
        g.strokeStyle = "#e0b84a";
        for (const [xa, ya, xb, yb] of [[300, 30, 360, 55], [380, 55, 440, 78], [200, 78, 260, 102]]) {
          g.beginPath();
          g.moveTo(x0 + xa, y0 + ya);
          g.lineTo(x0 + xb, y0 + yb);
          g.stroke();
        }
        for (let i = 0; i < 12; i++) {
          g.fillStyle = i % 4 === 1 ? "#c8362b" : "#4a5048";
          g.beginPath();
          g.arc(x0 + 40 + i * 38, y0 + 16, 5, 0, TAU);
          g.fill();
        }
        texte(g, "VERS LE PORT →", x0 + w - 80, y0 + 118, 140, 11, POLICE, "#d8d2c0");
        texte(g, "← VILLE", x0 + 50, y0 + 118, 100, 11, POLICE, "#d8d2c0");
        user(g, a, [x0, y0, w, h], 20, 0.08);
      }

      // --- COUCHETTES ---
      {
        const [x0, y0, w, h] = ATLAS.couchettes;
        texte(g, "COUCHETTES", x0 + w / 2, y0 + h / 2, w - 20, 36, POLICE, "#d9cfb4");
      }

      // --- SORTIE (néon de secours) ---
      {
        const [x0, y0, w, h] = ATLAS.sortie;
        g.fillStyle = "#1e9a52";
        g.fillRect(x0, y0, w, h);
        g.fillStyle = "#e8f6ea";
        g.fillRect(x0 + 8, y0 + 12, 18, 24);
        texte(g, "SORTIE", x0 + 74, y0 + h / 2 + 1, 80, 22, POLICE, "#e8f6ea");
      }

      // --- La plaque de la locomotive ---
      {
        const [x0, y0, w, h] = ATLAS.loco;
        g.fillStyle = "#c8b98a";
        rectArrondi(g, x0 + 2, y0 + 4, w - 4, h - 8, 6);
        g.fill();
        texte(g, "BB 4017", x0 + w / 2, y0 + h / 2 + 1, w - 16, 26, POLICE, "#2d2a26");
      }

      // --- La navette autonome ---
      {
        const [x0, y0, w, h] = ATLAS.navette;
        g.fillStyle = "#2f6f73";
        g.fillRect(x0, y0, w, h);
        g.fillStyle = "#c79a3b";
        g.fillRect(x0, y0 + h - 8, w, 8);
        texte(g, "NAVETTE AUTONOME", x0 + w / 2, y0 + 17, w - 16, 20, POLICE, "#e9dfc6");
        texte(g, "0 % conducteur · 100 % confiance", x0 + w / 2, y0 + 37, w - 16, 12, POLICE, "#e9dfc6", "700");
        user(g, a, [x0, y0, w, h], 30, 0.18);
      }

      // --- L'ardoise du buffet ---
      {
        const [x0, y0, w, h] = ATLAS.ardoise;
        g.fillStyle = "#4a3a2a";
        g.fillRect(x0, y0, w, h);
        g.fillStyle = "#26302c";
        g.fillRect(x0 + 8, y0 + 8, w - 16, h - 16);
        texte(g, "Buffet de la Gare", x0 + w / 2, y0 + 24, w - 30, 18, FEUTRE, "#e8e4d8", "700");
        texte(g, "Menu Abondance : 3 Wh", x0 + w / 2, y0 + 50, w - 30, 14, FEUTRE, "#e8e4d8", "400");
        texte(g, "Café connecté — offert", x0 + w / 2, y0 + 70, w - 30, 14, FEUTRE, "#e8e4d8", "400");
        // les bâtons des survivants, à la craie, par-dessus
        g.strokeStyle = "rgba(240,236,226,0.85)";
        g.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const xx = x0 + 40 + i * 44;
          for (let k = 0; k < 4; k++) {
            g.beginPath();
            g.moveTo(xx + k * 7, y0 + 90);
            g.lineTo(xx + k * 7, y0 + 112);
            g.stroke();
          }
          g.beginPath();
          g.moveTo(xx - 4, y0 + 108);
          g.lineTo(xx + 26, y0 + 94);
          g.stroke();
        }
      }

      // --- La flèche à la craie vers le Comptoir de la Gare ---
      {
        const [x0, y0, w, h] = ATLAS.craie;
        texte(g, "COMPTOIR DE LA GARE", x0 + w / 2, y0 + 22, w - 20, 22, FEUTRE, "rgba(240,236,226,0.92)", "700");
        texte(g, "→ rue des Docks, 200 m", x0 + w / 2, y0 + 48, w - 20, 18, FEUTRE, "rgba(240,236,226,0.9)", "400");
        texte(g, "les Compteurs ouvrent à l'aube", x0 + w / 2, y0 + 74, w - 20, 15, FEUTRE, "rgba(240,236,226,0.85)", "400");
      }

      // --- L'affiche des horaires (jaune, DÉPARTS) ---
      {
        const [x0, y0, w, h] = ATLAS.horaires;
        g.fillStyle = "#e3c45a";
        g.fillRect(x0, y0, w, h);
        texte(g, "DÉPARTS", x0 + w / 2, y0 + 18, w - 20, 22, POLICE, "#1f2a3a");
        g.fillStyle = "#1f2a3a";
        for (let r = 0; r < 14; r++) for (let i = 0; i < 6; i++) g.fillRect(x0 + 12 + i * 40, y0 + 38 + r * 10, 28 * (0.4 + a() * 0.6), 3);
        user(g, a, [x0, y0, w, h], 40, 0.25);
      }

      // --- La carte du réseau ---
      {
        const [x0, y0, w, h] = ATLAS.carte;
        g.fillStyle = "#e6dcc4";
        g.fillRect(x0, y0, w, h);
        texte(g, "RÉSEAU RÉGIONAL", x0 + w / 2, y0 + 16, w - 20, 16, SERIF, "#3a3026", "700");
        const pts = { Ville: [120, 80], Port: [220, 150], Barrage: [40, 40], Côte: [200, 60], Industrie: [60, 150], Montagne: [30, 110] };
        g.strokeStyle = "#7a2630";
        g.lineWidth = 3;
        for (const [p, q] of [["Ville", "Port"], ["Ville", "Barrage"], ["Ville", "Côte"], ["Ville", "Industrie"], ["Barrage", "Montagne"]]) {
          g.beginPath();
          g.moveTo(x0 + pts[p][0], y0 + pts[p][1]);
          g.lineTo(x0 + pts[q][0], y0 + pts[q][1]);
          g.stroke();
        }
        for (const [n, [px, py]] of Object.entries(pts)) {
          g.fillStyle = "#2d2a26";
          g.beginPath();
          g.arc(x0 + px, y0 + py, 5, 0, TAU);
          g.fill();
          texte(g, n, x0 + px, y0 + py + 13, 70, 11, SERIF, "#2d2a26", "700");
        }
        // une note des survivants au crayon
        g.strokeStyle = "rgba(40,40,40,0.7)";
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(x0 + 40, y0 + 150);
        g.lineTo(x0 + 80, y0 + 170);
        g.moveTo(x0 + 80, y0 + 150);
        g.lineTo(x0 + 40, y0 + 170);
        g.stroke();
        user(g, a, [x0, y0, w, h], 30, 0.2);
      }

      // --- La consigne automatique : la grille des casiers, des portes ouvertes ---
      {
        const [x0, y0, w, h] = ATLAS.casiers;
        g.fillStyle = "#7d8a86";
        g.fillRect(x0, y0, w, h);
        for (let r = 0; r < 4; r++)
          for (let i = 0; i < 6; i++) {
            const xx = x0 + 6 + i * 41;
            const yy = y0 + 6 + r * 46;
            const ouvert = a() < 0.4;
            g.fillStyle = ouvert ? "#1e2220" : "#98a49f";
            g.fillRect(xx, yy, 37, 42);
            if (!ouvert) {
              g.fillStyle = "#c79a3b";
              g.fillRect(xx + 28, yy + 18, 5, 8);
              texte(g, String(r * 6 + i + 1), xx + 10, yy + 9, 16, 9, POLICE, "#2d2a26");
            }
          }
        user(g, a, [x0, y0, w, h], 30, 0.15);
      }
    },
    false,
  );
}

// ---------- Petits outils de géométrie ----------

/** Un quadrilatère (4 points [x, y, z]), recto (et verso). */
function quad(c, mat, couleur, p, verso = false) {
  const pos = [];
  for (const k of [0, 1, 2, 0, 2, 3]) pos.push(...p[k]);
  if (verso) for (const k of [0, 2, 1, 0, 3, 2]) pos.push(...p[k]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  c.poser(g, mat, couleur, {}, { crasse: false, nuance: 0.03 });
  g.dispose();
}

/** Un polygone convexe (points [x, y, z]) en éventail. */
function poly(c, mat, couleur, p) {
  const pos = [];
  for (let i = 1; i < p.length - 1; i++) pos.push(...p[0], ...p[i], ...p[i + 1]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  c.poser(g, mat, couleur, {}, { crasse: false, nuance: 0.03 });
  g.dispose();
}

/** Un panneau peint de l'atlas (le plan regarde +z, tourné de `ry`). */
function panneau(c, region, x, y, z, l, h, ry = 0, rx = 0, rz = 0) {
  const [px, py, pw, ph] = ATLAS[region];
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / 1024, 1 - (py + (1 - uv.getY(i)) * ph) / 1024);
  c.poser(g, M.atlas(), 0xffffff, { x, y, z, ry, rx, rz }, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Un cylindre debout. */
function cylY(c, x, z, y1, y2, r1, r2, couleur, mat, cotes = 8, ouvert = false) {
  const g = new THREE.CylinderGeometry(r2, r1, y2 - y1, cotes, 1, ouvert);
  c.poser(g, mat, couleur, { x, y: (y1 + y2) / 2, z });
  g.dispose();
}

/** Un cylindre couché le long de z (roue, tambour). */
function cylZ(c, x, y, z, r, l, couleur, mat, cotes = 10) {
  const g = new THREE.CylinderGeometry(r, r, l, cotes);
  c.poser(g, mat, couleur, { x, y, z, rx: PI / 2 });
  g.dispose();
}

/** Les quatre côtés d'un rectangle comme obstacles. */
function obstacleRect(b, x1, z1, x2, z2, nature) {
  b.obstacle(x1, z1, x2, z1, nature);
  b.obstacle(x2, z1, x2, z2, nature);
  b.obstacle(x2, z2, x1, z2, nature);
  b.obstacle(x1, z2, x1, z1, nature);
}

/** Le contour d'une ouverture (dans le plan du mur : x le long du mur, y vers le haut), arc en plein cintre ou surbaissé. */
function contourOuverture(o, bas = o.bas) {
  const { u, l, haut } = o;
  const x1 = u - l / 2;
  const x2 = u + l / 2;
  const pts = [[x1, bas], [x2, bas]];
  const f = o.arc === true ? l / 2 : o.arc || 0;
  if (f > 0) {
    const R = (l * l) / 4 / (2 * f) + f / 2;
    const yc = haut - R;
    const a0 = Math.asin(Math.min(1, l / 2 / R));
    const n = o.n ?? (f > 2 ? 12 : 7);
    pts.push([x2, haut - f]);
    for (let i = 1; i < n; i++) {
      const an = a0 - (2 * a0 * i) / n;
      pts.push([u + R * Math.sin(an), yc + R * Math.cos(an)]);
    }
    pts.push([x1, haut - f]);
  } else pts.push([x2, haut], [x1, haut]);
  return pts;
}

function repereMur(a, b) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  return { L: Math.hypot(dx, dz), ry: -Math.atan2(dz, dx), dx, dz };
}

/**
 * Un pan de mur de `a` à `b` (= [x, z]), de y0 à y1, épaisseur `ep`, percé d'ouvertures [{ u, l, bas, haut, arc }] :
 * les fenêtres sont des trous, les portes (qui descendent jusqu'à y0) des encoches, et une ouverture qui traverse tout
 * le pan le coupe en morceaux. Une seule géométrie extrudée par morceau (quelques dizaines de triangles par baie).
 */
function murTroue(c, a, b, y0, y1, ep, ouvertures, couleur, mat) {
  const { L, ry } = repereMur(a, b);
  const utiles = ouvertures.filter((o) => o.haut > y0 + 0.02 && o.bas < y1 - 0.02);
  const coupes = utiles.filter((o) => o.bas <= y0 + 0.02 && o.haut >= y1 - 0.02).map((o) => [o.u - o.l / 2, o.u + o.l / 2]);
  // Les morceaux entre les coupures
  let morceaux = [[0, L]];
  for (const [t1, t2] of coupes) {
    morceaux = morceaux.flatMap(([p, q]) => {
      if (t2 <= p || t1 >= q) return [[p, q]];
      const r = [];
      if (t1 > p) r.push([p, t1]);
      if (t2 < q) r.push([t2, q]);
      return r;
    });
  }
  c.repere({ x: a[0], z: a[1], ry }, () => {
    for (const [s0, s1] of morceaux) {
      if (s1 - s0 < 0.03) continue;
      const ici = utiles.filter((o) => o.u - o.l / 2 > s0 - 0.01 && o.u + o.l / 2 < s1 + 0.01 && !(o.bas <= y0 + 0.02 && o.haut >= y1 - 0.02));
      const encoches = ici.filter((o) => o.bas <= y0 + 0.02).sort((p, q) => p.u - q.u);
      const trous = ici.filter((o) => o.bas > y0 + 0.02);
      const pts = [[s0, y0]];
      for (const o of encoches) {
        const ct = contourOuverture(o, y0);
        pts.push(ct[0], ...ct.slice(2).reverse(), ct[1]);
      }
      pts.push([s1, y0], [s1, y1], [s0, y1]);
      const forme = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
      for (const o of trous) forme.holes.push(new THREE.Path(contourOuverture(o).map(([x, y]) => new THREE.Vector2(x, y))));
      const g = new THREE.ExtrudeGeometry(forme, { depth: ep, bevelEnabled: false, curveSegments: 4 });
      g.translate(0, 0, -ep / 2);
      c.poser(g, mat, couleur, {}, { nuance: 0.02, crasse: y0 < 0.5 });
      g.dispose();
    }
  });
}

/** Le vitrage d'une ouverture (contour exact, petits bois), dans le plan du mur décalé de `dz` vers l'extérieur. */
function verrine(c, a, b, o, mat, dz = 0, bas = o.bas) {
  const { ry } = repereMur(a, b);
  const forme = new THREE.Shape(contourOuverture(o, bas).map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ShapeGeometry(forme);
  c.repere({ x: a[0], z: a[1], ry }, () => c.poser(g, mat, 0xffffff, { z: dz }, { crasse: false, nuance: 0.05 }));
  g.dispose();
}

/** Les segments infranchissables d'un mur (ce qui reste plein à hauteur d'homme). */
function obstaclesMur(b, a, bp, ouvertures, nature = "mur") {
  const { L, dx, dz } = repereMur(a, bp);
  const trous = ouvertures.filter((o) => o.bas < 0.8).map((o) => [o.u - o.l / 2, o.u + o.l / 2]).sort((p, q) => p[0] - q[0]);
  let u = 0;
  for (const [t1, t2] of trous) {
    if (t1 > u + 0.05) b.obstacle(a[0] + (dx * u) / L, a[1] + (dz * u) / L, a[0] + (dx * t1) / L, a[1] + (dz * t1) / L, nature);
    u = Math.max(u, t2);
  }
  if (L > u + 0.05) b.obstacle(a[0] + (dx * u) / L, a[1] + (dz * u) / L, bp[0], bp[1], nature);
}

/** Un lambrequin : la frise de bois découpée en dents qui borde les marquises, de `p1` à `p2` (= [x, z]), à la hauteur y. */
function lambrequin(c, p1, p2, y, couleur) {
  const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
  const n = Math.max(2, Math.round(L / 0.42));
  const pos = [];
  const P = (t, yy) => [p1[0] + (p2[0] - p1[0]) * t, yy, p1[1] + (p2[1] - p1[1]) * t];
  const tri2 = (a, b, d) => pos.push(...a, ...b, ...d, ...a, ...d, ...b);
  for (let i = 0; i < n; i++) tri2(P(i / n, y), P((i + 1) / n, y), P((i + 0.5) / n, y - 0.38));
  tri2(P(0, y), P(1, y), P(1, y + 0.22));
  tri2(P(0, y), P(1, y + 0.22), P(0, y + 0.22));
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  c.poser(g, M.mat(), couleur, {}, { crasse: false, nuance: 0.02 });
  g.dispose();
}

// ---------- Le mobilier ----------

/** Un banc de gare : lattes de bois, piétement de fonte. */
function banc(c, x, z, ry = 0, l = 2, dossier = true, y0 = 0) {
  c.repere({ x, y: y0, z, ry }, () => {
    for (let i = 0; i < 3; i++) c.boite(l, 0.04, 0.12, C.boisClair, { y: 0.44, z: -0.18 + i * 0.15 }, M.mat(), { nuance: 0.06 });
    if (dossier) for (let i = 0; i < 2; i++) c.boite(l, 0.12, 0.04, C.boisClair, { y: 0.62 + i * 0.18, z: -0.3, rx: -0.12 }, M.mat(), { nuance: 0.06 });
    for (const s of [-1, 1]) {
      c.boite(0.06, 0.44, 0.5, C.fonteSombre, { x: (s * l) / 2.4, y: 0.22 }, M.tole());
      if (dossier) c.boite(0.06, 0.5, 0.06, C.fonteSombre, { x: (s * l) / 2.4, y: 0.7, z: -0.3 }, M.tole());
    }
  });
}

/** Une valise ou une malle. */
function valise(c, x, z, ry, y = 0, couleur = C.cuir, l = 0.7, h = 0.45, p = 0.22, couche = false) {
  if (couche) c.boite(l, p, h, couleur, { x, y: y + p / 2, z, ry }, M.satin(), { nuance: 0.1 });
  else c.boite(l, h, p, couleur, { x, y: y + h / 2, z, ry }, M.satin(), { nuance: 0.1 });
}

/** Une chaise de bistrot (debout ou renversée). */
function chaise(c, x, z, ry, renversee = false) {
  c.repere({ x, z, ry, rz: renversee ? PI / 2 : 0, y: renversee ? 0.22 : 0 }, () => {
    c.boite(0.42, 0.04, 0.42, C.bois, { y: 0.46 }, M.satin());
    for (const [dx, dz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) c.boite(0.03, 0.46, 0.03, C.boisSombre, { x: dx, y: 0.23, z: dz }, M.satin());
    c.boite(0.42, 0.42, 0.03, C.bois, { y: 0.72, z: -0.2 }, M.satin());
  });
}

/** Une table ronde de bistrot (plateau de marbre, pied de fonte). */
function tableRonde(c, x, z, renversee = false) {
  if (renversee) {
    const g = new THREE.CylinderGeometry(0.4, 0.4, 0.04, 10);
    c.poser(g, M.lisse(), PALETTE.marbre, { x, y: 0.4, z, rx: 1.3, ry: 0.6 });
    g.dispose();
    c.tube([x - 0.3, 0.05, z + 0.1], [x + 0.35, 0.3, z - 0.2], 0.035, C.fonteSombre, M.tole(), 5);
    return;
  }
  cylY(c, x, z, 0.72, 0.76, 0.4, 0.4, PALETTE.marbre, M.lisse(), 10);
  cylY(c, x, z, 0.02, 0.72, 0.035, 0.035, C.fonteSombre, M.tole(), 5);
  cylY(c, x, z, 0, 0.05, 0.25, 0.22, C.fonteSombre, M.tole(), 6);
}

/** Des bouteilles et de la vaisselle sur une étagère (le long de x local). */
function bouteilles(c, x1, x2, y, z, n) {
  const tons = [0x3f5a3a, 0x6a4a2a, 0x2f3a3a, 0x8a7a5a];
  for (let i = 0; i < n; i++) {
    if (c.hasard() < 0.3) continue;
    const x = x1 + ((x2 - x1) * (i + 0.5)) / n;
    cylY(c, x, z, y, y + 0.3, 0.04, 0.035, tons[i % 4], M.lisse(), 5);
  }
}

/** Une étagère (montants, tablettes). Dans le repère courant, le long de x, de profondeur p. */
function etagere(c, x, z, ry, l, h, p, couleur = C.bois, mat = M.mat(), tablettes = 4) {
  c.repere({ x, z, ry }, () => {
    for (const s of [-1, 1]) c.boite(0.05, h, p, couleur, { x: (s * l) / 2, y: h / 2 }, mat);
    for (let i = 0; i < tablettes; i++) c.boite(l, 0.03, p, couleur, { y: 0.1 + (i * (h - 0.15)) / (tablettes - 1) }, mat, { nuance: 0.05 });
  });
}

/** Une lanterne de chef de gare / de lampiste : corps cylindrique, verres, anse. */
function lanterne(c, x, y, z, couleur = 0x4a4a44, verre = 0xd8a040) {
  cylY(c, x, z, y, y + 0.22, 0.08, 0.08, couleur, M.tole(), 6);
  cylY(c, x, z, y + 0.06, y + 0.17, 0.085, 0.085, verre, M.lisse(), 6);
  cylY(c, x, z, y + 0.22, y + 0.28, 0.09, 0.04, couleur, M.tole(), 6);
  c.boite(0.16, 0.02, 0.02, couleur, { x, y: y + 0.33, z }, M.tole());
}

/** Un bidon (jerrican). */
function bidon(c, x, z, ry, couleur = 0x7a4a2a) {
  c.boite(0.34, 0.46, 0.17, couleur, { x, y: 0.23, z, ry }, M.tole(), { nuance: 0.08 });
  c.boite(0.06, 0.06, 0.06, couleur, { x: x + 0.1 * Math.cos(ry), y: 0.49, z: z - 0.1 * Math.sin(ry), ry }, M.tole());
}

/** Un touret ou une bobine de câble. */
function bobine(c, x, z, r = 0.3, couleur = 0xb87440) {
  const g = new THREE.TorusGeometry(r, r * 0.35, 4, 9);
  c.poser(g, M.metal(), couleur, { x, y: r * 0.35, z, rx: PI / 2 });
  g.dispose();
}

/** Un chariot à bagages : plateau de bois, ridelles, grandes roues. */
function chariot(c, x, z, ry, y0 = 0, charge = true) {
  c.repere({ x, y: y0, z, ry }, () => {
    c.boite(2.4, 0.08, 1.1, C.boisClair, { y: 0.55 }, M.mat(), { nuance: 0.06 });
    c.boite(2.4, 0.3, 0.05, C.fonteSombre, { y: 0.75, z: 0.55 }, M.tole());
    c.boite(2.4, 0.3, 0.05, C.fonteSombre, { y: 0.75, z: -0.55 }, M.tole());
    for (const sx of [-0.8, 0.8]) for (const sz of [-0.6, 0.6]) cylZ(c, sx, 0.3, sz, 0.3, 0.06, C.fonteSombre, M.tole(), 8);
    c.poutre([1.2, 0.55, 0], [2.1, 0.95, 0], 0.05, C.fonteSombre, M.tole());
    if (charge) {
      valise(c, -0.6, 0, 0.1, 0.6, 0x5a4a3a, 0.9, 0.5, 0.6);
      valise(c, 0.4, 0.1, -0.2, 0.6, C.cuir);
      valise(c, 0.3, -0.2, 0.3, 1.05, 0x7a5a3a, 0.5, 0.3, 0.3);
    }
  });
}

/** Un lampadaire de parvis : fût de fonte cannelé, crosse, deux lanternes. `penche` : il a pris un choc. */
function lampadaire(c, x, z, penche = 0) {
  c.repere({ x, z, rz: penche, rx: penche * 0.4 }, () => {
    cylY(c, 0, 0, 0, 0.5, 0.26, 0.2, C.fonteSombre, M.tole(), 8);
    cylY(c, 0, 0, 0.5, 4.2, 0.1, 0.07, C.fonte, M.tole(), 6);
    c.boite(1.4, 0.06, 0.06, C.fonte, { y: 4.1 }, M.tole());
    for (const s of [-1, 1]) {
      c.tube([s * 0.7, 4.1, 0], [s * 0.7, 3.85, 0], 0.03, C.fonte, M.tole(), 4);
      cylY(c, s * 0.7, 0, 3.5, 3.85, 0.1, 0.17, 0xc8c8b0, M.lisse(), 6);
      cylY(c, s * 0.7, 0, 3.85, 3.98, 0.2, 0.05, C.fonteSombre, M.tole(), 6);
    }
  });
}

/** La navette autonome de l'Abondance, encastrée dans un lampadaire (le nez contre le fût plié). */
function navette(ctx, x, z, ry) {
  const { b, c } = ctx;
  c.repere({ x, z, ry, rz: 0.03 }, () => {
    c.boite(3.8, 0.5, 1.9, 0xd8d4c8, { y: 0.55 }, M.satin());
    c.boite(3.4, 1.0, 1.8, 0xe2dccb, { y: 1.3 }, M.satin());
    c.boite(2.8, 0.25, 1.6, 0xe2dccb, { y: 1.9 }, M.satin());
    c.boite(3.0, 0.55, 1.82, 0x1e2a2e, { y: 1.45 }, M.lisse()); // le bandeau vitré
    c.boite(0.08, 0.6, 1.5, 0x1e2a2e, { x: 1.9, y: 1.25, rz: -0.3 }, M.lisse()); // la face avant, fendue
    c.boite(3.82, 0.12, 1.92, 0x2f6f73, { y: 0.85 }, M.satin());
    for (const dx of [-1.25, 1.25]) for (const dz of [-0.9, 0.9]) cylZ(c, dx, 0.35, dz, 0.35, 0.22, 0x2a2826, M.tole(), 8);
    c.boite(0.5, 0.15, 0.5, 0x2a2826, { x: 0.3, y: 2.08 }, M.lisse()); // le capteur sur le toit
    panneau(c, "navette", -0.2, 1.05, 0.97, 2.6, 0.55);
    panneau(c, "navette", -0.2, 1.05, -0.97, 2.6, 0.55, PI);
  });
  b.obstacle(x - 1.9 * Math.cos(ry), z + 1.9 * Math.sin(ry), x + 1.9 * Math.cos(ry), z - 1.9 * Math.sin(ry), "navette autonome");
  debris(c, x + 1.5, z - 1, x + 3.5, z + 1, 8, [0xe8eef0, 0xd0dade, 0xe2dccb]);
}

/** Les lampadaires du parvis, et celui que la navette a plié. */
function lampadaires(ctx) {
  const { b, c } = ctx;
  for (const x of [-26, -10, 10]) {
    lampadaire(c, x, 12.5);
    b.obstacle(x - 0.25, 12.5, x + 0.25, 12.5, "lampadaire");
  }
  lampadaire(c, 24.2, 15.2, -0.35);
  b.obstacle(23.95, 15.2, 24.45, 15.2, "lampadaire plié");
  navette(ctx, 22.1, 15.5, 0.08);
}

// ---------- Les sols ----------

/** Le parvis pavé, le trottoir, la rue. */
function parvis(ctx) {
  const { c, u } = ctx;
  const paves = M.paves();
  // Les pavés, en grandes dalles (quelques-unes manquent : la terre et l'herbe ont repris)
  for (let x = -44; x < 44; x += 8)
    for (let z = 9; z < 21; z += 6) {
      if (c.hasard() < 0.06 + 0.12 * u) {
        c.pave(x, -0.03, z, x + 8, 0.0, z + 6, 0x6b6a4c, M.mat(), { crasse: false, nuance: 0.05 });
        mousse(c, x + 4, -0.01, z + 3, 2.6, 4, PALETTE.herbeSombre);
        semerTouffes(c, x, z, x + 8, z + 6, 14);
        continue;
      }
      c.pave(x, -0.02, z, x + 8, 0.02, z + 6, 0xbab2a2, paves, { crasse: false, nuance: 0.04 });
    }
  // Le trottoir de pierre devant la façade, le perron du pavillon central
  c.pave(-40, 0, 6, 40, 0.1, 9, C.pierreSombre, M.pierre(), { crasse: false });
  c.pave(-11.5, 0.1, 7.5, 11.5, 0.2, 8.6, C.pierreSombre, M.pierre(), { crasse: false });
  // La rue : asphalte craquelé, bordure
  c.pave(-44, -0.02, 21, 44, 0.01, 24.2, 0x55524c, M.beton(), { crasse: false, nuance: 0.03 });
  c.pave(-44, 0, 20.8, 44, 0.14, 21.1, C.bordure, M.pierre(), { crasse: false });
  for (let x = -40; x < 40; x += 6) c.boite(2.5, 0.012, 0.15, 0xd8d2c0, { x: x + c.entre(-1, 1), y: 0.015, z: 22.6 }, M.mat(), { crasse: false });
  // Les herbes entre les pavés, au pied de la façade
  const pts = [];
  for (let i = 0; i < 25 + 35 * u; i++) pts.push([c.entre(-42, 42), c.entre(9, 21)]);
  for (let i = 0; i < 20 + 20 * u; i++) pts.push([c.entre(-38, 38), c.entre(6.1, 6.8)]);
  touffes(c, pts);
}

/** Les sols du bâtiment voyageurs (damier, parquet, béton). */
function solsBV(ctx) {
  const { c } = ctx;
  const piece = (x1, x2, z2, mat, couleur) => c.pave(x1, -0.02, BV.z0, x2, 0.04, z2, couleur, mat, { crasse: false, nuance: 0.02 });
  piece(-38, -30, PAV_Z, M.parquet(), 0xb59a78);
  piece(-30, -10, BV.z1, M.damier(), 0xd8d0c0);
  piece(-10, 10, CP.z1, M.damier(), 0xe0d8c8);
  piece(10, 14, BV.z1, M.parquet(), 0xa88a68);
  piece(14, 22, BV.z1, M.parquet(), 0xb59a78);
  piece(22, 30, BV.z1, M.parquet(), 0xa88a68);
  piece(30, 38, PAV_Z, M.beton(), 0x9a958a);
}

/** Les quais : dalles basses de béton, bordure de pierre, ligne de sécurité, rampes aux deux bouts. */
function quais(ctx, x1, x2, herbes = [1, 2, 3]) {
  const { c, u } = ctx;
  for (const q of QUAIS) {
    const a = Math.max(q.x0, x1);
    const b = Math.min(q.x1, x2);
    if (b <= a) continue;
    c.pave(a, 0, q.z0, b, HQ, q.z1, C.quai, M.beton(), { crasse: false, nuance: 0.03 });
    for (const z of [q.z0, q.z1]) {
      if (q.n === "1" && z === q.z1) continue; // le quai 1 longe le bâtiment
      const s = z === q.z0 ? 1 : -1;
      c.pave(a, HQ - 0.02, Math.min(z, z + s * 0.45), b, HQ + 0.02, Math.max(z, z + s * 0.45), C.bordure, M.pierre(), { crasse: false });
      c.pave(a, HQ + 0.02, Math.min(z + s * 0.6, z + s * 0.68), b, HQ + 0.025, Math.max(z + s * 0.6, z + s * 0.68), 0xd8d0b0, M.mat(), { crasse: false });
    }
    // Les rampes
    for (const [xe, s] of [[q.x0, -1], [q.x1, 1]]) {
      if (xe < x1 - 4 || xe > x2 + 4) continue;
      const ang = Math.atan2(HQ, 3);
      c.boite(3.05, 0.1, q.z1 - q.z0, C.quai, { x: xe + s * 1.5, y: HQ / 2 - 0.04, z: (q.z0 + q.z1) / 2, rz: s * -ang }, M.beton(), { crasse: false });
    }
    // Les herbes dans les joints, les fissures
    if (!herbes.includes(Number(q.n))) continue;
    const pts = [];
    for (let i = 0; i < (b - a) * (0.12 + 0.3 * u); i++) pts.push([c.entre(a, b), c.hasard() < 0.6 ? q.z0 + c.entre(0.1, 0.6) : c.entre(q.z0, q.z1), HQ]);
    touffes(c, pts);
    for (let i = 0; i < 2 + 3 * u; i++) mousse(c, c.entre(a, b), HQ, c.entre(q.z0 + 0.5, q.z1 - 0.5), c.entre(0.4, 1), 3);
  }
}

/** Les voies : ballast, traverses (quelques-unes manquent), rails rouillés ; au-delà du lot, seulement rails et ballast. */
function voies(ctx, x1, x2, xf1, xf2) {
  const { c, u } = ctx;
  for (const z of VOIES) {
    c.pave(xf1, -0.02, z - 1.5, xf2, 0.1, z + 1.5, C.ballast, M.mat(), { crasse: false, nuance: 0.02 });
    for (let x = x1 + 0.3; x < x2; x += 1.1) {
      if (c.hasard() < 0.08 + 0.15 * u) continue;
      c.boite(0.24, 0.1, 2.5, C.traverse, { x, y: 0.14, z, ry: c.entre(-0.04, 0.04) }, M.mat(), { nuance: 0.08 });
    }
    for (const dz of [-0.72, 0.72]) {
      c.pave(xf1, 0.19, z + dz - 0.035, xf2, 0.33, z + dz + 0.035, C.rail, M.metal(), { crasse: false });
      c.pave(xf1, 0.19, z + dz - 0.07, xf2, 0.21, z + dz + 0.07, C.rail, M.metal(), { crasse: false });
    }
  }
  // Les herbes du ballast
  const pts = [];
  for (const z of VOIES) for (let i = 0; i < (x2 - x1) * (0.08 + 0.2 * u); i++) pts.push([c.entre(x1, x2), z + c.entre(-1.4, 1.4), 0.1]);
  touffes(c, pts, PALETTE.herbeSeche);
}

// ---------- Le bâtiment voyageurs ----------

const fen = (x, l = 2, bas = 1.15, haut = 5.2) => ({ x, l, bas, haut, arc: true, type: "fenetre" });
const porte = (x, l = 2.2, haut = 5.2) => ({ x, l, bas: 0, haut, arc: true, type: "porte" });
const rel = (a, liste) => liste.map((o) => ({ ...o, u: Math.abs((o.x ?? o.z) - (o.x !== undefined ? a[0] : a[1])) }));

/** Les murs extérieurs du rez-de-chaussée (sud, nord, ouest, est) et leurs ouvertures, dans le repère du site. */
function mursBV(u) {
  const sud = [
    { a: [-38, PAV_Z], b: [-30, PAV_Z], o: [fen(-36.2, 1.6), porte(-34, 2.2, 4.6), fen(-31.8, 1.6)] },
    { a: [-30, BV.z1], b: [-10, BV.z1], o: [fen(-28), fen(-24), porte(-20), fen(-16), fen(-12)] },
    { a: [-10, CP.z1], b: [10, CP.z1], o: [fen(-8), porte(-4.4, 3.2, 5.8), porte(0, 3.2, 5.8), porte(4.4, 3.2, 5.8), fen(8)] },
    { a: [10, BV.z1], b: [30, BV.z1], o: [fen(12), porte(16), fen(20), fen(24), fen(28)] },
    { a: [30, PAV_Z], b: [38, PAV_Z], o: [fen(31.8, 1.6), porte(34, 2.2, 4.6), fen(36.2, 1.6)] },
  ];
  const nord = [
    {
      a: [-38, BV.z0],
      b: [38, BV.z0],
      o: [
        porte(-34, 2.2, 4.6), fen(-28), porte(-24), fen(-20), fen(-16), fen(-12), fen(-8), porte(-4.4, 3.2, 5.8), porte(0, 3.2, 5.8), porte(4.4, 3.2, 5.8),
        fen(8), fen(12), porte(18), fen(24), porte(28), fen(31.8, 1.6), porte(34, 2.4, 4.6), fen(36.2, 1.6),
      ],
    },
  ];
  const ouest = { a: [-38, BV.z0], b: [-38, PAV_Z], o: [{ z: -2, l: 1.6, bas: 1.15, haut: 5.2, arc: true }, { z: 3.4, l: 1.6, bas: 1.15, haut: 5.2, arc: true }] };
  if (u > 0.5) ouest.o[1] = { z: 2.6, l: 2.4, bas: 0, haut: 1.6 + 3 * u, arc: false, breche: true };
  const est = { a: [38, BV.z0], b: [38, PAV_Z], o: [{ z: -2, l: 1.6, bas: 1.15, haut: 5.2, arc: true }, { z: 3.4, l: 1.6, bas: 1.15, haut: 5.2, arc: true }] };
  for (const m of [...sud, ...nord, ouest, est]) m.o = rel(m.a, m.o);
  return { sud, nord, ouest, est };
}

/** Les cloisons intérieures (x constant, de z0 à z1) et leurs portes. */
function cloisonsBV() {
  const p = (z, l = 1.2, haut = 2.4) => ({ z, l, bas: 0, haut, arc: false, type: "porte" });
  const liste = [
    { x: -30, o: [p(-3), p(3.5)] },
    { x: -10, o: [p(-2.5, 2.6, 3.2), p(3, 1.6, 3.2)] },
    { x: 10, o: [{ z: -3, l: 1.1, bas: 1.0, haut: 2.0 }, { z: -0.5, l: 1.1, bas: 1.0, haut: 2.0 }, { z: 2, l: 1.1, bas: 1.0, haut: 2.0 }, p(5, 1.0, 2.3)] },
    { x: 14, o: [p(4.5, 1.0, 2.3)] },
    { x: 22, o: [p(3.5)] },
    { x: 30, o: [p(2.5)] },
  ];
  return liste.map((k) => {
    const a = [k.x, BV.z0];
    const zb = k.x === -10 || k.x === 10 ? CP.z1 : k.x === -30 || k.x === 30 ? PAV_Z : BV.z1;
    return { ...k, a, b: [k.x, zb], o: rel(a, k.o) };
  });
}

function batimentVoyageurs(ctx, fin) {
  const { b, c, u } = ctx;
  const vit = M.vitrage(u);
  // Les couches : façades côté caméra + étage + toits ; le mur côté quais à part.
  const k2 = b.couche(fin ? "bâtiment voyageurs : façades, étage, combles" : "bâtiment voyageurs (au loin)", { x: 0, z: 0.75, l: 77.4, p: 14.6 }, CUT, 26);
  const k3 = fin ? b.couche("bâtiment voyageurs : mur côté quais", { x: 0, z: BV.z0, l: 77, p: 0.9 }, CUT, BV.h + 0.2) : k2;
  const { sud, nord, ouest, est } = mursBV(u);
  const EP = 0.6;

  // --- Le soubassement et le bas des murs (toujours visibles) ---
  for (const m of [...sud, ...nord, est]) {
    if (!fin && m !== nord[0]) {
      murTroue(k2, m.a, m.b, 0, CUT, EP, m.o, C.soubassement, M.pierre());
      continue;
    }
    murTroue(c, m.a, m.b, 0, CUT, EP + 0.08, m.o, C.soubassement, M.pierre());
    obstaclesMur(b, m.a, m.b, m.o);
  }
  // Le mur ouest : plein, toujours visible (il est derrière)
  murTroue(fin ? c : k2, ouest.a, ouest.b, 0, BV.h, EP, ouest.o, C.pierre, M.pierre());
  if (fin) obstaclesMur(b, ouest.a, ouest.b, ouest.o);
  // Les ressauts des avant-corps
  for (const [x, z1, z2] of [[-30, BV.z1, PAV_Z], [30, BV.z1, PAV_Z], [-10, BV.z1, CP.z1], [10, BV.z1, CP.z1]]) {
    (fin ? c : k2).pave(x - EP / 2, 0, z1, x + EP / 2, CUT, z2 + 0.04, C.soubassement, M.pierre());
    k2.pave(x - EP / 2, CUT, z1, x + EP / 2, x === -10 || x === 10 ? CP.corniche : BV.etage + 0.8, z2, C.pierre, M.pierre());
  }

  // --- Le haut du rez-de-chaussée (couches) ---
  for (const m of [...sud, est]) murTroue(k2, m.a, m.b, CUT, BV.h, EP, m.o, C.pierre, M.pierre());
  murTroue(k3, nord[0].a, nord[0].b, CUT, BV.h, EP, nord[0].o, C.pierre, M.pierre());
  // Les vitrages, les clés d'arc, les appuis, les fenêtres murées ou barricadées
  for (const m of [...sud, est, ouest, ...nord]) {
    const k = m === nord[0] ? k3 : m === ouest && fin ? c : k2;
    const { ry } = repereMur(m.a, m.b);
    const sortie = m === nord[0] || m === ouest ? -1 : 1; // la face extérieure (z local)
    for (const o of m.o) {
      if (o.breche) continue;
      const x = m.a[0] + Math.cos(ry) * o.u;
      const z = m.a[1] - Math.sin(ry) * o.u;
      // la clé d'arc
      k.boite(0.42, 0.6, EP + 0.16, C.pierreClaire, { x, y: o.haut - 0.05, z, ry }, M.pierre());
      if (o.type === "porte") {
        // l'imposte vitrée en demi-cercle au-dessus des vantaux
        verrine(k, m.a, m.b, { ...o }, vit, 0, o.haut - o.l / 2 - 0.12);
        k.repere({ x, y: o.haut - o.l / 2, z, ry }, () => k.boite(o.l, 0.12, 0.2, C.boisSombre, {}, M.mat()));
        continue;
      }
      k.repere({ x, z, ry }, () => k.boite(o.l + 0.3, 0.14, EP + 0.24, C.pierreClaire, { y: o.bas - 0.07, z: 0.04 * sortie }, M.pierre()));
      const planche = c.hasard() < 0.15 + 0.2 * u;
      if (planche) {
        // des planches clouées par des survivants
        k.repere({ x, z, ry }, () => {
          for (let i = 0; i < 4; i++) k.boite(o.l + 0.2, 0.22, 0.04, PALETTE.boisGris, { y: o.bas + 0.5 + i * 0.75, z: sortie * (EP / 2 + 0.04), rz: c.entre(-0.12, 0.12) }, M.mat(), { nuance: 0.1 });
        });
      }
      if (c.hasard() < 0.85 - 0.3 * u) verrine(k, m.a, m.b, o, vit, 0);
    }
  }
  // La brèche de la consigne
  const br = ouest.o.find((o) => o.breche);
  if (br && fin) {
    gravats(c, -37.2, 2.6, 1.6, 14, [C.pierre, C.pierreSombre, PALETTE.enduitCreme]);
    gravats(c, -39.4, 2.8, 1.4, 10, [C.pierre, C.pierreSombre]);
  }

  // --- Les cloisons ---
  if (fin) {
    for (const k of cloisonsBV()) {
      murTroue(c, k.a, k.b, 0, CUTI, 0.22, k.o, C.pierreClaire, M.pierre());
      obstaclesMur(b, k.a, k.b, k.o, "cloison");
      const hh = k.x === -10 || k.x === 10 ? CP.corniche : BV.h;
      murTroue(k2, k.a, k.b, CUTI, hh, 0.22, k.o, C.pierreClaire, M.pierre());
    }
  } else {
    k2.pave(-37.7, 0, BV.z0 + 0.3, 37.7, 0.04, BV.z1, 0x4a4640, M.mat());
    for (const x of [-10, 10]) k2.pave(x - 0.3, CUT, BV.z0, x + 0.3, CP.corniche, CP.z1, C.pierre, M.pierre());
  }

  // --- Les vantaux des portes (bois, toujours visibles) ---
  if (fin) portesBV(ctx, sud, nord);

  facadeHaute(ctx, k2, fin);
}

/** Les vantaux : ouverts, entrouverts, tombés ; le tampon des Compteurs sur le portail central. */
function portesBV(ctx, sud, nord) {
  const { c, u } = ctx;
  const toutes = [...sud.map((m) => [m, 1]), [nord[0], -1]];
  for (const [m, s] of toutes) {
    const { ry } = repereMur(m.a, m.b);
    for (const o of m.o) {
      if (o.type !== "porte") continue;
      const x = m.a[0] + Math.cos(ry) * o.u;
      const z = m.a[1] - Math.sin(ry) * o.u;
      const hv = o.haut - o.l / 2;
      const lv = o.l / 2 - 0.04;
      const central = s === 1 && Math.abs(x) < 0.1;
      const etat = central ? "tampon" : c.hasard() < 0.25 + 0.3 * u ? "tombe" : "ouvert";
      c.repere({ x, z, ry: ry + (s < 0 ? PI : 0) }, () => {
        const vantail = (cote, angle, tampon) => {
          c.repere({ x: (cote * o.l) / 2, z: 0.15, ry: cote * angle }, () => {
            const xc = (-cote * lv) / 2;
            c.boite(lv, hv - 0.04, 0.07, C.boisSombre, { x: xc, y: hv / 2 }, M.satin(), { nuance: 0.05 });
            for (const yy of [0.3, 0.72]) c.boite(lv - 0.24, hv * 0.3, 0.03, C.bois, { x: xc, y: hv * yy, z: 0.045 }, M.satin(), { nuance: 0.07 });
            if (tampon) {
              panneau(c, "tampon", xc, 1.55, 0.07, 0.75, 0.75);
              panneau(c, "craie", xc, 2.55, 0.07, 1.2, 0.45);
            }
          });
        };
        if (etat === "tampon") {
          vantail(-1, -1.2, false);
          vantail(1, 0.05, true);
        } else if (etat === "tombe") {
          vantail(-1, -1.5 + c.hasard() * 0.3, false);
          c.boite(lv, 0.07, hv - 0.04, C.boisSombre, { x: o.l * 0.2, y: 0.05, z: -hv / 2 - 0.3, ry: c.entre(-0.3, 0.3) }, M.satin(), { nuance: 0.05 });
        } else {
          vantail(-1, -1.3 - c.hasard() * 0.3, false);
          vantail(1, -1.2 - c.hasard() * 0.3, false);
        }
      });
    }
  }
}

/** L'étage, les corniches, les combles, le pavillon central (baie thermale, attique, horloge, dôme). */
function facadeHaute(ctx, k, fin) {
  const { c, u } = ctx;
  const detail = fin;
  const vit = M.vitrage(u);
  const pierre = M.pierre();
  const EP = 0.6;
  // --- Bandeau, pilastres, chaînes d'angle ---
  for (const [z, sd] of [[BV.z1, 1], [BV.z0, -1]]) {
    for (const [x1, x2] of [[-30, -10], [10, 30]]) {
      k.pave(x1, BV.h - 0.15, sd > 0 ? z - 0.2 : z - 0.42, x2, BV.h + 0.25, sd > 0 ? z + 0.42 : z + 0.2, C.pierreClaire, pierre);
      if (sd > 0 && detail) for (let x = x1; x <= x2 + 0.01; x += 4) k.pave(x - 0.28, CUT, z, x + 0.28, BV.etage, z + 0.42, C.pierreClaire, pierre);
    }
  }
  for (const xp of [-38, -30, 30, 38])
    for (const zp of [PAV_Z, BV.z0]) {
      if ((xp === -30 || xp === 30) && zp === BV.z0) continue;
      if (!detail) continue;
      let i = 0;
      for (let y = CUT; y < BV.corniche - 0.5; y += 0.9, i++) {
        const l = i % 2 ? 0.8 : 1.1;
        k.boite(l, 0.82, l, C.pierreClaire, { x: xp, y: y + 0.41, z: zp }, pierre);
      }
    }
  // --- L'étage des ailes et des pavillons ---
  const etage = (a, b, xs, y1, y2, sortie) => {
    const o = rel(a, xs.map((x) => ({ x, l: 1.4, bas: BV.h + 0.9, haut: BV.h + 3.6, arc: 0.25 })));
    murTroue(k, a, b, BV.h, y2, EP, o, C.pierre, pierre);
    const { ry } = repereMur(a, b);
    for (const q of o) {
      const x = a[0] + Math.cos(ry) * q.u;
      const z = a[1] - Math.sin(ry) * q.u;
      k.repere({ x, z, ry }, () => {
        k.boite(1.8, 0.14, EP + 0.24, C.pierreClaire, { y: q.bas - 0.07, z: 0.04 * sortie }, pierre);
        k.boite(1.9, 0.3, EP + 0.2, C.pierreClaire, { y: q.haut + 0.3, z: 0.04 * sortie }, pierre);
        // petit balcon de fonte
        if (sortie > 0 && detail) {
          k.boite(1.7, 0.06, 0.5, C.fonteSombre, { y: q.bas, z: EP / 2 + 0.25 }, M.tole());
          for (let i = 0; i < 5; i++) k.boite(0.03, 0.8, 0.03, C.fonteSombre, { x: -0.7 + i * 0.35, y: q.bas + 0.4, z: EP / 2 + 0.48 }, M.tole());
          k.boite(1.7, 0.05, 0.05, C.fonteSombre, { y: q.bas + 0.82, z: EP / 2 + 0.48 }, M.tole());
        }
      });
      if (c.hasard() < 0.8 - 0.3 * u) verrine(k, a, b, q, vit, 0);
    }
  };
  etage([-30, BV.z1], [-10, BV.z1], [-28, -24, -20, -16, -12], BV.h, BV.etage, 1);
  etage([10, BV.z1], [30, BV.z1], [12, 16, 20, 24, 28], BV.h, BV.etage, 1);
  etage([-30, BV.z0], [-10, BV.z0], [-28, -24, -20, -16, -12], BV.h, BV.etage, -1);
  etage([10, BV.z0], [30, BV.z0], [12, 16, 20, 24, 28], BV.h, BV.etage, -1);
  for (const [x1, x2] of [[-38, -30], [30, 38]]) {
    etage([x1, PAV_Z], [x2, PAV_Z], [x1 + 2, x1 + 6], BV.h, BV.corniche, 1);
    etage([x1, BV.z0], [x2, BV.z0], [x1 + 2, x1 + 6], BV.h, BV.corniche, -1);
  }
  etage([-38, BV.z0], [-38, PAV_Z], [], BV.h, BV.corniche, -1);
  etage([38, BV.z0], [38, PAV_Z], [], BV.h, BV.corniche, 1);
  // Les planchers de l'étage (on les voit par les fenêtres)
  for (const [x1, x2] of [[-38, -10], [10, 38]]) k.pave(x1 + 0.3, BV.h - 0.05, BV.z0 + 0.3, x2 - 0.3, BV.h + 0.1, BV.z1 - 0.3, 0x5a5048, M.mat());
  // --- Les corniches ---
  const corniche = (x1, z1, x2, z2, y) => {
    k.pave(x1 - 0.15, y, z1 - 0.15, x2 + 0.15, y + 0.3, z2 + 0.15, C.pierreClaire, pierre);
    k.pave(x1 - 0.45, y + 0.3, z1 - 0.45, x2 + 0.45, y + 0.55, z2 + 0.45, C.pierreClaire, pierre);
    k.pave(x1 - 0.65, y + 0.55, z1 - 0.65, x2 + 0.65, y + 0.8, z2 + 0.65, C.pierre, pierre);
  };
  corniche(-30, BV.z0, -10, BV.z1, BV.etage);
  corniche(10, BV.z0, 30, BV.z1, BV.etage);
  corniche(-38, BV.z0, -30, PAV_Z, BV.corniche);
  corniche(30, BV.z0, 38, PAV_Z, BV.corniche);
  // --- Les combles à la Mansart des ailes, les lucarnes ---
  for (const [x1, x2] of [[-30, -10], [10, 30]]) {
    const p = (BV.z1 - BV.z0) / 2;
    const prof = [[-p - 0.3, 0], [p + 0.3, 0], [p - 1.0, 2.9], [p - 2.4, 3.5], [-p + 2.4, 3.5], [-p + 1.0, 2.9]];
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(prof.map(([x, y]) => new THREE.Vector2(x, y))), { depth: x2 - x1, bevelEnabled: false });
    k.poser(g, M.ardoise(), C.ardoise, { x: x1, y: BV.corniche, z: 0, ry: PI / 2 }, { crasse: false });
    g.dispose();
    k.pave(x1, BV.corniche + 3.5, -p + 2.4, x2, BV.corniche + 3.62, p - 2.4, C.zinc, M.tole());
    // Les lucarnes (une par travée, des deux côtés), à fronton cintré
    for (let x = x1 + 2; x < x2; x += 4) {
      for (const s of [1, -1]) {
        if (c.hasard() < 0.12 * u || (!detail && s < 0)) continue; // effondrée (et, de loin, le versant nord ne se voit pas)
        k.repere({ x, y: BV.corniche + 0.5, z: s * (p - 0.35), ry: s > 0 ? 0 : PI }, () => {
          k.boite(1.3, 1.7, 1.2, C.pierreClaire, { y: 0.85, z: -0.5 }, pierre);
          k.boite(0.8, 1.15, 0.05, 0x2a2826, { y: 0.8, z: 0.11 }, M.mat());
          k.boite(1.55, 0.25, 1.35, C.pierreClaire, { y: 1.8, z: -0.45 }, pierre);
          for (const sx of [-1, 1]) k.boite(0.95, 0.07, 1.5, C.zinc, { x: sx * 0.4, y: 2.12, z: -0.55, rz: -sx * 0.55 }, M.tole(), { crasse: false });
        });
      }
    }
    // Les souches de cheminée
    for (const x of [x1 + 4, x2 - 4]) k.pave(x - 0.5, BV.corniche + 2.5, -0.6, x + 0.5, BV.corniche + 5.2, 0.6, C.brique, M.brique());
  }
  // --- Les toits des pavillons d'extrémité : pyramide à la Mansart, crête de zinc ---
  for (const xc of [-34, 34]) {
    const pts = [[1, 0], [0.86, 3.2], [0.5, 5.4], [0.02, 5.6]].map(([r, y]) => new THREE.Vector2(r, y));
    const g = new THREE.LatheGeometry(pts, 4).rotateY(PI / 4);
    const hx = 4.4;
    const hz = (PAV_Z - BV.z0 + 0.8) / 2;
    k.poser(g, M.ardoise(), C.ardoise, { x: xc, y: BV.corniche + 0.8, z: (PAV_Z + BV.z0) / 2, e: [hx / Math.SQRT1_2, 1, hz / Math.SQRT1_2] }, { crasse: false });
    g.dispose();
    k.pave(xc - 1.4, BV.corniche + 6.2, 0.3 - 0.06, xc + 1.4, BV.corniche + 6.4, 0.3 + 0.06, C.zinc, M.tole());
    for (const s of [-1, 1]) {
      // l'œil-de-bœuf
      const g2 = new THREE.CylinderGeometry(0.55, 0.55, 0.5, 10);
      k.poser(g2, pierre, C.pierreClaire, { x: xc, y: BV.corniche + 2.2, z: 0.3 + s * 5.4, rx: PI / 2 });
      g2.dispose();
    }
  }
  // --- Le pavillon central ---
  const xcp = [CP.x0, CP.x1];
  const baie = (a, b) => rel(a, [{ x: 0, l: 12, bas: BV.h + 0.5, haut: BV.h + 6.5, arc: true, n: 14 }]);
  for (const [z, s] of [[CP.z1, 1], [BV.z0 - 0.0, -1]]) {
    const a = [xcp[0], z];
    const b2 = [xcp[1], z];
    const o = baie(a, b2);
    murTroue(k, a, b2, BV.h, CP.corniche, EP, o, C.pierre, pierre);
    if (c.hasard() < 0.95) verrine(k, a, b2, o[0], vit, 0);
    // les meneaux rayonnants de la baie thermale
    const yc = BV.h + 0.5;
    for (let i = 1; i < 6; i++) {
      const an = PI - (i * PI) / 6;
      k.poutre([Math.cos(an) * 0.4, yc, z], [Math.cos(an) * 6, yc + Math.sin(an) * 6, z], 0.12, C.fonteSombre, M.tole());
    }
    k.pave(-6, yc - 0.06, z - 0.1, 6, yc + 0.06, z + 0.1, C.fonteSombre, M.tole());
    const anneau = new THREE.TorusGeometry(2.8, 0.07, 3, 12, PI);
    k.poser(anneau, M.tole(), C.fonteSombre, { y: yc, z });
    anneau.dispose();
    // l'archivolte et la clé
    const arcg = new THREE.TorusGeometry(6.2, 0.3, 4, 16, PI);
    k.poser(arcg, pierre, C.pierreClaire, { y: yc, z: z + s * 0.32 });
    arcg.dispose();
    k.boite(0.9, 1.1, 0.5, C.pierreClaire, { y: yc + 6.3, z: z + s * 0.35 }, pierre);
    // l'enseigne, entre les portes et la baie
    if (s > 0) {
      k.pave(-7, BV.h - 0.3, z, 7, BV.h + 0.45, z + 0.36, C.pierreClaire, pierre);
      panneau(k, "enseigne", 0, BV.h + 0.08, z + 0.38, 9.6, 1.2);
      
    }
  }
  // Les colonnes engagées du pavillon central (rez-de-chaussée et étage)
  for (const x of [-9.6, -6.5, 6.5, 9.6]) {
    cylY(k, x, CP.z1 + 0.4, CUT, CP.corniche - 0.4, 0.35, 0.3, C.pierreClaire, pierre, 8);
    k.pave(x - 0.5, CP.corniche - 0.6, CP.z1 + 0.0, x + 0.5, CP.corniche - 0.2, CP.z1 + 0.85, C.pierreClaire, pierre);
    c.pave(x - 0.5, 0.1, CP.z1 + 0.0, x + 0.5, CUT, CP.z1 + 0.85, C.soubassement, M.pierre());
  }
  corniche(-10, BV.z0 - 0.2, 10, CP.z1, CP.corniche);
  // L'attique, l'horloge, le fronton cintré
  const zA = CP.z1 - 0.6;
  k.pave(-7, CP.attique, BV.z0 + 0.6, 7, CP.dome, zA, C.pierre, pierre);
  for (const x of [-6.6, -3, 3, 6.6]) k.pave(x - 0.35, CP.attique, zA, x + 0.35, CP.dome, zA + 0.25, C.pierreClaire, pierre);
  k.pave(-7.3, CP.dome - 0.1, BV.z0 + 0.3, 7.3, CP.dome + 0.35, zA + 0.4, C.pierreClaire, pierre);
  panneau(k, "horloge", 0, CP.attique + 1.75, zA + 0.08, 2.7, 2.7);
  {
    const g = new THREE.TorusGeometry(1.42, 0.14, 4, 16);
    k.poser(g, pierre, C.pierreClaire, { y: CP.attique + 1.75, z: zA + 0.08 });
    g.dispose();
    const f = new THREE.CylinderGeometry(2.4, 2.4, 0.5, 12, 1, false, -PI / 2, PI);
    k.poser(f, pierre, C.pierreClaire, { y: CP.dome + 0.3, z: zA + 0.05, rx: PI / 2, rz: PI / 2, e: [1, 1, 0.5] });
    f.dispose();
  }
  // Le dôme à l'impériale (plan carré : tour à 4 faces), son lanterneau, l'épi
  {
    const prof = [[1, 0], [1.04, 0.12], [0.86, 0.38], [0.52, 0.62], [0.36, 0.8], [0.18, 0.95], [0.0, 1.0]].map(([r, y]) => new THREE.Vector2(r, y * 6.5));
    const g = new THREE.LatheGeometry(prof, 4).rotateY(PI / 4);
    const zd = (BV.z0 + 0.6 + zA) / 2;
    k.poser(g, M.ardoise(), C.ardoise, { x: 0, y: CP.dome + 0.35, z: zd, e: [6.9 / Math.SQRT1_2, 1, 6.0 / Math.SQRT1_2] }, { crasse: false });
    g.dispose();
    const yl = CP.dome + 0.35 + 6.0;
    for (const [dx, dz] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) k.boite(0.18, 1.4, 0.18, C.zinc, { x: dx, y: yl + 0.7, z: zd + dz }, M.tole());
    k.boite(1.9, 0.2, 1.9, C.zinc, { y: yl + 1.5, z: zd }, M.tole());
    cylY(k, 0, zd, yl + 1.6, yl + 2.4, 0.9, 0.05, C.zinc, M.tole(), 4);
    k.tube([0, yl + 2.4, zd], [0, yl + 3.6, zd], 0.04, C.fonteSombre, M.tole(), 4);
    // le drapeau n'est plus qu'un lambeau
    k.boite(0.5, 0.3, 0.02, 0x8a7a6a, { x: 0.27, y: yl + 3.4, z: zd, rz: -0.2 }, M.mat());
  }
  // Le dallage de l'étage du pavillon central (plafond de la salle des pas perdus)
  k.pave(-9.7, CP.corniche - 0.1, BV.z0 + 0.3, 9.7, CP.corniche + 0.1, CP.z1 - 0.3, 0x6a625a, M.mat());
  panneau(k, "graffiti", -26, 2.6, BV.z1 + 0.44, 1.9, 0.36, 0, 0, 0.05);
  // Les plaques émaillées au-dessus des portes (côté parvis)
  panneau(k, "plaque0", -20, 5.75, BV.z1 + 0.32, 1.9, 0.36);
  panneau(k, "plaque1", -34, 5.0, PAV_Z + 0.32, 1.9, 0.36);
  panneau(k, "plaque2", 16, 5.75, BV.z1 + 0.32, 2.2, 0.4);
  panneau(k, "plaque4", 34, 5.0, PAV_Z + 0.32, 2.2, 0.4);
  // Les descentes d'eau
  for (const x of [-30.4, -10.4, 10.4, 29.6]) {
    k.tube([x, CUT, BV.z1 + 0.42], [x, BV.etage, BV.z1 + 0.42], 0.06, C.zinc, M.tole(), 5);
    c.tube([x, 0.15, BV.z1 + 0.42], [x, CUT, BV.z1 + 0.42], 0.06, C.zinc, M.tole(), 5);
  }
  // Le lierre qui monte sur la façade
  if (fin) {
    for (const [x, z, h] of [[-37.6, PAV_Z + 0.36, 7], [-22, BV.z1 + 0.4, 5], [23, BV.z1 + 0.42, 4.5], [37.7, PAV_Z + 0.36, 6]]) lierre(k, x, CUT, z, 0, 2.4, h * (0.5 + 0.6 * u), 20);
    for (const [x, z] of [[-37.6, PAV_Z + 0.36], [-22, BV.z1 + 0.4], [23, BV.z1 + 0.42], [37.7, PAV_Z + 0.36]]) lierre(c, x, 0, z, 0, 2.4, CUT, 10);
  }
  // La mousse sur les corniches
  if (detail) for (let i = 0; i < 6 + 10 * u; i++) mousse(k, c.entre(-37, 37), BV.etage + 0.82, c.entre(BV.z1 + 0.1, BV.z1 + 0.6), 0.5, 2);
}

// ---------- L'intérieur du bâtiment voyageurs ----------

function interieurBV(ctx) {
  const { b, c, u } = ctx;
  // === La consigne et la bagagerie (x -38 → -30) ===
  // Le comptoir, d'ouest en est, qui sépare le public des étagères
  c.pave(-37.7, 0, -1.7, -32.4, 1.05, -1.1, C.bois, M.satin());
  c.pave(-37.7, 1.05, -1.8, -32.3, 1.1, -1.0, C.boisSombre, M.satin());
  b.obstacle(-37.7, -1.4, -32.4, -1.4, "comptoir de la consigne");
  etagere(c, -37.4, -4.2, PI / 2, 3.4, 2.2, 0.55, C.bois);
  etagere(c, -31.3, -4.2, PI / 2, 3, 2.2, 0.55, C.bois);
  for (let i = 0; i < 9; i++) {
    const s = i % 3;
    valise(c, i < 5 ? -37.35 : -31.3, -5.4 + (i % 5) * 0.7 + (i < 5 ? 0 : 0.3), PI / 2 + c.entre(-0.2, 0.2), 0.12 + s * 0.68, [C.cuir, 0x4a3a30, 0x6a5a3a, 0x3a4a5a][i % 4], 0.6, 0.4, 0.22);
  }
  // les malles cerclées
  for (const [x, z, r] of [[-34.6, -4.6, 0.2], [-33.4, -3.2, 1.3]]) {
    c.boite(1, 0.6, 0.6, 0x5a4030, { x, y: 0.3, z, ry: r }, M.satin());
    for (const d of [-0.3, 0.3]) c.boite(0.05, 0.62, 0.62, C.laiton, { x: x + Math.cos(r) * d, y: 0.31, z: z - Math.sin(r) * d, ry: r }, M.metal());
  }
  // La consigne automatique (casiers forcés)
  c.pave(-37.95, 0, -0.6, -37.4, 2.2, 1.9, 0x7d8a86, M.tole());
  panneau(c, "casiers", -37.38, 1.1, 0.65, 2.4, 2.0, PI / 2);
  b.obstacle(-37.4, -0.6, -37.4, 1.9, "consigne automatique");
  // les valises éventrées, des vêtements
  valise(c, -35.6, 1.2, 0.4, 0, 0x6a3a2a, 0.75, 0.5, 0.24, true);
  valise(c, -34.2, 3.6, 2.2, 0, 0x3a4a5a, 0.7, 0.45, 0.22, true);
  for (let i = 0; i < 5; i++) c.boite(c.entre(0.3, 0.6), 0.02, c.entre(0.3, 0.6), [0x6a7a8a, 0x8a5a4a, 0xb0a890][i % 3], { x: -35 + c.entre(-1, 1.5), y: 0.05, z: 2 + c.entre(-1, 1), ry: c.hasard() * 3 }, M.mat(), { crasse: false });
  panneau(c, "plaque1", -33.2, 2.25, -1.08, 1.6, 0.3);
  debris(c, -37.5, -1, -30.5, 6, 18 * u);

  // === Le buffet (x -30 → -10) ===
  // Le bar en L, dessus de zinc, et le percolateur
  c.pave(-28.1, 0, -5.2, -27.4, 1.1, 2.2, C.boisSombre, M.satin());
  c.pave(-28.1, 1.1, -5.3, -27.3, 1.15, 2.3, C.zinc, M.metal());
  c.pave(-28.1, 0, 2.2, -25.4, 1.1, 2.9, C.boisSombre, M.satin());
  c.pave(-28.2, 1.1, 2.1, -25.3, 1.15, 3.0, C.zinc, M.metal());
  b.obstacle(-27.75, -5.2, -27.75, 2.55, "bar du buffet");
  b.obstacle(-27.75, 2.55, -25.4, 2.55, "bar du buffet");
  cylY(c, -27.75, -1.5, 1.15, 1.75, 0.2, 0.2, 0xb87440, M.metal(), 8);
  c.poser(new THREE.SphereGeometry(0.2, 6, 4), M.metal(), 0xb87440, { x: -27.75, y: 1.8, z: -1.5 });
  // Les étagères et les bouteilles contre la cloison, la glace piquée
  for (const y of [1.3, 1.75, 2.2]) {
    c.pave(-29.85, y, -5, -29.55, y + 0.03, 1.6, C.bois, M.mat());
    c.repere({ x: -29.7, z: 0, ry: PI / 2 }, () => bouteilles(c, -5, 1.6, y + 0.03, 0, 14));
  }
  c.pave(-29.9, 1.1, -4, -29.86, 2.5, 0.5, 0x8a9a98, M.lisse());
  // Les tables rondes et les chaises
  const tables = [[-24, -3.2], [-20, -3.6], [-16, -3.2], [-23, 1.4], [-18.6, 1.8], [-14, 1]];
  tables.forEach(([x, z], i) => {
    const r = i === 4 && u > 0.4;
    tableRonde(c, x, z, r);
    if (!r) b.obstacle(x - 0.4, z, x + 0.4, z, "table");
    for (let k = 0; k < 3; k++) {
      const an = (k / 3) * TAU + c.hasard();
      chaise(c, x + Math.cos(an) * 0.75, z + Math.sin(an) * 0.75, -an + PI / 2, c.hasard() < 0.2 + 0.3 * u);
    }
  });
  // Le vaisselier, les assiettes
  c.pave(-13.6, 0, -5.7, -10.4, 2.3, -5.2, C.bois, M.satin());
  for (let i = 0; i < 3; i++) for (let k = 0; k < 6; k++) {
    if (c.hasard() < 0.3 * u) continue;
    cylY(c, -13.2 + k * 0.5, -5.25, 1.0 + i * 0.45, 1.25 + i * 0.45, 0.13, 0.13, PALETTE.marbre, M.lisse(), 7);
  }
  b.obstacle(-13.6, -5.2, -10.4, -5.2, "vaisselier");
  debris(c, -14, -5, -11, -3, 14, [0xe8e4da, 0xdcd6c8, 0xc8c2b4]);
  // L'ardoise sur son chevalet, près de la porte
  c.tube([-21.6, 0, 4.4], [-21.4, 1.5, 4.2], 0.03, C.bois, M.mat(), 4);
  c.tube([-20.6, 0, 4.4], [-20.8, 1.5, 4.2], 0.03, C.bois, M.mat(), 4);
  panneau(c, "ardoise", -21.1, 1.25, 4.3, 1.1, 0.55, 0, -0.15);
  jonchee(c, -29, -5, -11, 5, 30 * u);
  flaque(c, -15, 3.8, 1.1);

  // === La salle des pas perdus (x -10 → 10) ===
  // Le panneau à palettes, suspendu
  c.boite(6.4, 2.5, 0.35, 0x1d1e20, { x: 0, y: 4.5, z: -3.8 }, M.lisse());
  panneau(c, "palettes", 0, 4.5, -3.61, 6.1, 2.25);
  for (const x of [-2.8, 2.8]) c.tube([x, 5.75, -3.8], [x, CP.corniche, -3.8], 0.025, C.fonteSombre, M.tole(), 4);
  // L'horloge à double face sous le panneau
  cylZ(c, 0, 2.95, -3.8, 0.45, 0.25, C.fonteSombre, M.tole(), 10);
  panneau(c, "horloge", 0, 2.95, -3.66, 0.8, 0.8);
  // Les bancs, dos à dos
  for (const [x, z] of [[-4, -0.6], [4, -0.6], [3.4, 3.4]]) {
    banc(c, x, z, 0, 2.6);
    banc(c, x, z - 0.7, PI, 2.6);
    b.obstacle(x - 1.3, z - 0.35, x + 1.3, z - 0.35, "bancs");
  }
  // Le kiosque à journaux (rideau à demi baissé)
  {
    const x = -5.5;
    const z = 3.2;
    c.pave(x - 1.3, 0, z - 1, x + 1.3, 1.0, z + 1, 0x2f4a3a, M.satin());
    c.pave(x - 1.3, 1.0, z - 1, x + 1.3, 2.4, z - 0.9, 0x2f4a3a, M.satin());
    for (const s of [-1, 1]) c.pave(x + s * 1.3 - 0.06, 1.0, z - 1, x + s * 1.3 + 0.06, 2.4, z + 1, 0x2f4a3a, M.satin());
    c.pave(x - 1.5, 2.4, z - 1.2, x + 1.5, 2.55, z + 1.4, 0x2a3a30, M.satin());
    panneau(c, "presse", x, 2.0, z + 1.42, 2.8, 0.53);
    c.pave(x - 1.25, 1.55, z + 0.93, x + 1.25, 2.38, z + 0.98, C.zinc, M.tole()); // rideau à demi baissé
    for (let i = 0; i < 6; i++) c.boite(0.35, 0.02, 0.45, [0xc8362b, 0xe9dfc6, 0x2f6f73, 0xc79a3b][i % 4], { x: x - 1 + i * 0.4, y: 1.02, z: z + 0.6, ry: c.entre(-0.2, 0.2) }, M.mat(), { crasse: false });
    obstacleRect(b, x - 1.3, z - 1, x + 1.3, z + 1, "kiosque");
    jonchee(c, x - 2, z + 0.8, x + 2, z + 3, 16, [0xe9dfc6, 0xd9cfb4, 0xc8362b, 0x2f6f73]);
  }
  // La borne « Billet instantané » (qui luit encore la nuit)
  c.pave(5.3, 0, 4.9, 5.9, 1.85, 5.3, 0xe2dccb, M.lisse());
  panneau(c, "borne", 5.6, 1.0, 5.31, 0.56, 1.7);
  b.obstacle(5.3, 5.1, 5.9, 5.1, "borne");
  b.lumiere(5.6, 1.4, 5.6, 0x6fb8ff, 1.6, 4, "écran de la borne de billet instantané, qui luit encore");
  // Le distributeur de Snacks énergétiques
  c.pave(6.9, 0, -5.7, 8.0, 1.95, -4.9, 0xa8342b, M.satin());
  panneau(c, "snacks", 7.45, 1.0, -4.88, 1.0, 1.85);
  b.obstacle(6.9, -4.9, 8.0, -4.9, "distributeur");
  // Le comptoir des guichets (contre la cloison est), l'affiche des horaires
  c.pave(9.25, 0, -4, 9.9, 1.0, 3, C.boisSombre, M.satin());
  c.pave(9.2, 1.0, -4.05, 9.95, 1.05, 3.05, C.bois, M.satin());
  for (const z of [-3, -0.5, 2]) c.boite(0.02, 0.9, 1.0, 0xffffff, { x: 10, y: 1.5, z }, M.verre(), { crasse: false });
  b.obstacle(9.25, -4, 9.25, 3, "guichets");
  panneau(c, "plaque5", 9.86, 2.3, -0.5, 1.6, 0.3, -PI / 2);
  panneau(c, "horaires", -9.86, 1.5, -4.5, 0.9, 0.68, PI / 2);
  panneau(c, "watty", -9.86, 1.55, 0.2, 0.8, 1.2, PI / 2);
  // Le néon de secours « SORTIE » au-dessus de la porte des quais
  panneau(c, "sortie", 0, 6.0, BV.z0 + 0.32, 0.9, 0.34);
  b.lumiere(0, 5.8, BV.z0 + 0.8, 0x5dff8a, 2.4, 9, "néon de secours « SORTIE », sur batterie");
  // Les valises abandonnées près des portes des quais
  for (let i = 0; i < 5; i++) valise(c, -2 + c.entre(-1.5, 1.5), -5 + c.entre(-0.5, 0.6), c.hasard() * 3, 0, [C.cuir, 0x3a4a5a, 0x6a3a2a][i % 3], 0.6, 0.42, 0.22, c.hasard() < 0.5);
  // Le lustre tombé
  {
    const g = new THREE.TorusGeometry(1.1, 0.06, 4, 12);
    c.poser(g, M.metal(), C.laiton, { x: -1, y: 0.15, z: 2.2, rx: PI / 2 + 0.15 });
    g.dispose();
    for (let i = 0; i < 6; i++) {
      const an = (i / 6) * TAU;
      c.tube([-1, 0.15, 2.2], [-1 + Math.cos(an) * 1.1, 0.15, 2.2 + Math.sin(an) * 1.1], 0.03, C.laiton, M.metal(), 4);
    }
    debris(c, -2.5, 1, 0.5, 3.4, 12, [0xe8eef0, 0xd0dade, 0xb59048]);
  }
  // Le bouleau qui pousse dans le dallage, sous la baie
  if (u > 0.35) {
    arbre(c, -7.6, 5.4, 4 + 3 * u, "bouleau");
    gravats(c, -7.6, 5.4, 1.0, 8, [C.pierreClaire, 0xd8d0c0, 0x5a4a3a]);
  }
  jonchee(c, -9.5, -5.5, 9.5, 7, 40 * u, [0x9c7a45, 0xe9dfc6, 0x7d6143, 0xd9cfb4]);
  debris(c, -9.5, 4, 9.5, 7.2, 20 * u, [0xe8eef0, C.pierreClaire, 0xc0c8c8]);
  // Les rais de lumière par la baie thermale
  raiDeLumiere(c, [-2, 11.5, CP.z1], [-5, 0.05, 0.5], 3);
  raiDeLumiere(c, [2.5, 10.5, CP.z1], [-0.5, 0.05, 1.5], 2.4);

  // === Le bureau des billets (x 10 → 14) ===
  c.pave(10.15, 0.9, -4, 10.7, 0.95, 3, C.bois, M.satin());
  c.pave(13.35, 0, -2.6, 13.85, 2.2, 1.6, C.bois, M.satin()); // casier à billets
  for (let i = 0; i < 6; i++) for (let k = 0; k < 8; k++) c.boite(0.02, 0.2, 0.42, k % 3 ? 0xc8b890 : 0x9a8a6a, { x: 13.33, y: 0.4 + i * 0.3, z: -2.35 + k * 0.5 }, M.mat(), { crasse: false });
  b.obstacle(13.35, -2.6, 13.35, 1.6, "casier à billets");
  c.pave(12.3, 0, -5.8, 13.6, 1.2, -4.9, 0x3e5248, M.tole()); // le coffre
  c.boite(0.06, 0.9, 0.7, 0x3e5248, { x: 12.0, y: 0.6, z: -5.1, ry: 0.9 }, M.tole());
  chaise(c, 11.2, -0.5, -PI / 2);
  for (let i = 0; i < 8; i++) cylY(c, 11 + c.entre(0, 2), c.entre(-4, 3), 0, 0.05, 0.06, 0.06, 0xd8c8a0, M.mat(), 6);

  // === La salle d'attente (x 14 → 22) ===
  for (const [x, ry] of [[14.45, PI / 2], [21.55, -PI / 2]]) {
    c.repere({ x, z: -0.8, ry }, () => {
      c.boite(5.6, 0.45, 0.55, C.boisSombre, { y: 0.22 }, M.satin());
      c.boite(5.6, 0.1, 0.55, C.velours, { y: 0.5 }, M.mat());
      c.boite(5.6, 0.7, 0.12, C.velours, { y: 0.9, z: -0.24 }, M.mat());
    });
    b.obstacle(x + (x < 18 ? 0.3 : -0.3), -3.6, x + (x < 18 ? 0.3 : -0.3), 2, "banquette");
  }
  // Le poêle de fonte et son tuyau
  cylY(c, 18, 0.5, 0, 1.0, 0.32, 0.3, C.suie, M.tole(), 8);
  cylY(c, 18, 0.5, 1.0, 1.1, 0.36, 0.36, C.suie, M.tole(), 8);
  c.tube([18, 1.1, 0.5], [18, 4.6, 0.5], 0.07, C.suie, M.tole(), 6);
  c.tube([18, 4.6, 0.5], [18, 4.9, -5.6], 0.07, C.suie, M.tole(), 6);
  obstacleRect(b, 17.6, 0.1, 18.4, 0.9, "poêle");
  panneau(c, "carte", 21.87, 1.55, -1.2, 1.3, 0.97, -PI / 2);
  panneau(c, "watty", 14.13, 1.7, 2.7, 0.7, 1.05, PI / 2);
  jonchee(c, 14.5, -5.5, 21.5, 5.5, 18 * u);
  debris(c, 15, 4.5, 21, 5.8, 10 * u, [0xe8eef0, 0xd0dade]);

  // === Le bureau du chef de gare (x 22 → 30) ===
  c.pave(24.2, 0, -3.8, 26.2, 0.78, -2.6, C.boisSombre, M.satin());
  c.pave(24.1, 0.78, -3.9, 26.3, 0.82, -2.5, C.bois, M.satin());
  b.obstacle(24.2, -2.6, 26.2, -2.6, "bureau");
  lanterne(c, 25.7, 0.82, -3.2, 0x8a2a24, 0xe8b860);
  b.lumiere(25.7, 1.2, -3.2, 0xffbe6a, 4, 9, "lanterne du chef de gare, posée sur le bureau");
  c.boite(0.25, 0.12, 0.2, 0x2a2826, { x: 24.6, y: 0.88, z: -3.4 }, M.lisse()); // téléphone
  c.boite(0.4, 0.04, 0.3, 0xd8d0b8, { x: 25.1, y: 0.85, z: -3.0, ry: 0.3 }, M.mat()); // registre
  chaise(c, 25.2, -1.9, PI);
  c.pave(29.2, 0, -5.8, 29.8, 2.1, -3.8, C.bois, M.satin()); // armoire
  b.obstacle(29.2, -5.8, 29.2, -3.8, "armoire");
  c.pave(22.12, 1.2, -4.2, 22.16, 1.9, -3.2, C.bois, M.mat()); // tableau des clés
  for (let i = 0; i < 8; i++) c.boite(0.02, 0.08, 0.04, C.laiton, { x: 22.2, y: 1.35 + (i % 2) * 0.3, z: -4.05 + Math.floor(i / 2) * 0.25 }, M.metal());
  c.tube([23, 0, 4.8], [23, 1.8, 4.8], 0.03, C.boisSombre, M.mat(), 5); // portemanteau
  c.boite(0.28, 0.1, 0.28, 0x2a3040, { x: 23, y: 1.82, z: 4.8 }, M.mat()); // la casquette
  panneau(c, "plaque3", 28, 2.3, BV.z0 + 0.32, 1.7, 0.32);
  panneau(c, "carte", 29.88, 1.5, -1.5, 1.2, 0.9, -PI / 2);
  jonchee(c, 22.5, -5.5, 29.5, 5.5, 14 * u, [0xe9dfc6, 0xd8d0b8, 0x9c7a45]);

  // === La lampisterie (x 30 → 38) ===
  c.pave(37.0, 0, -3.5, 37.7, 0.92, 3, C.boisSombre, M.mat()); // établi
  c.pave(36.9, 0.92, -3.6, 37.75, 0.98, 3.1, C.bois, M.mat());
  b.obstacle(37, -3.5, 37, 3, "établi");
  for (let i = 0; i < 4; i++) lanterne(c, 37.3, 0.98, -3 + i * 0.6, [0x4a4a44, 0x8a2a24, 0x4a4a44, 0x2f4a3a][i]);
  bobine(c, 37.3, 2.2, 0.25);
  bobine(c, 36.2, 4.6, 0.35);
  etagere(c, 30.6, -3, PI / 2, 4, 2.2, 0.5, C.bois);
  for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) if (c.hasard() > 0.25) lanterne(c, 30.6, 0.13 + k * 0.68, -4.6 + i * 1.0, [0x4a4a44, 0x8a2a24, 0x4a4a44][k]);
  b.obstacle(30.85, -5, 30.85, -1, "étagère");
  for (const [x, z, r] of [[33, 4.8, 0.3], [33.5, 5, 1.2], [34.1, 4.7, 0.1], [36, -5.2, 0.6]]) bidon(c, x, z, r);
  // La rangée de lanternes accrochées au plafond (crochets)
  c.pave(31, 2.95, 0.2, 36, 3.0, 0.3, C.fonteSombre, M.tole());
  for (let i = 0; i < 6; i++) if (c.hasard() > 0.3) lanterne(c, 31.5 + i * 0.85, 2.45, 0.25);
  debris(c, 30.5, -5.5, 37.5, 6, 14 * u);
}

// ---------- Les abords côté quai n° 1 (carte voyageurs) ----------

function quaiUn(ctx) {
  const { b, c } = ctx;
  chariot(c, -14, -9.2, 0.2, HQ);
  obstacleRect(b, -15.3, -9.8, -12.7, -8.6, "chariot à bagages");
  banc(c, -26, -6.75, 0, 2.2, true, HQ);
  banc(c, 14, -6.75, 0, 2.2, true, HQ);
  banc(c, 26, -6.75, 0, 2.2, true, HQ);
  // Le panneau du quai n° 1 sur ses deux poteaux
  for (const x of [-9, -7]) c.tube([x, HQ, -11.6], [x, 3.1, -11.6], 0.05, C.fonte, M.tole(), 6);
  c.boite(2.4, 0.7, 0.08, 0x1f3a6b, { x: -8, y: 3.0, z: -11.6 }, M.satin());
  panneau(c, "quai1", -8, 3.0, -11.55, 0.6, 0.6);
  panneau(c, "plaque6", -18, 4.6, BV.z0 - 0.33, 1.9, 0.36, PI);
  panneau(c, "plaque0", -24, 5.75, BV.z0 - 0.33, 1.6, 0.3, PI);
  panneau(c, "plaque4", 34, 5.0, BV.z0 - 0.33, 1.8, 0.33, PI);
  // Le lierre et les herbes au pied du bâtiment côté quais
  lierre(c, -31, HQ, BV.z0 - 0.33, PI, 3, 3.5, 20);
  lierre(c, 21, HQ, BV.z0 - 0.33, PI, 2.4, 2.8, 16);
}

// ---------- La halle ----------

/** Un point de l'arc (θ de -t0 au nord à +t0 au sud), à la distance `d` au-dessus de l'intrados. */
function pointArc(theta, d = 0) {
  const H = HALLE;
  return [H.zc + (H.R + d) * Math.sin(theta), H.yc + (H.R + d) * Math.cos(theta)];
}

function halle(ctx, fin) {
  const { b, c, u } = ctx;
  const H = HALLE;
  const k = b.couche("la halle : fermes, verrière, marquise", { x: 0, z: (BV.z0 + H.zn) / 2 - 0.5, l: 66, p: BV.z0 - H.zn + 1.5 }, 5.8, 22);
  const vit = M.vitrage(u);
  const N = 16;
  const thetas = [];
  for (let j = 0; j <= N; j++) thetas.push(-H.t0 + (2 * H.t0 * j) / N);
  const fermes = [];
  for (let x = H.x0; x <= H.x1 + 0.01; x += H.pas) fermes.push(x);

  // --- Les colonnes de fonte (toujours visibles) ---
  for (const x of fermes) {
    for (const [z, y0] of [[H.zs, HQ], [H.zn, 0]]) {
      c.pave(x - 0.32, y0, z - 0.32, x + 0.32, y0 + 0.5, z + 0.32, C.fonteSombre, M.tole());
      cylY(c, x, z, y0 + 0.5, H.yn - 0.5, 0.17, 0.15, C.fonte, M.tole(), 8);
      for (const yy of [y0 + 1.6, H.yn - 1.4]) cylY(c, x, z, yy, yy + 0.1, 0.22, 0.22, C.fonteSombre, M.tole(), 8);
      c.pave(x - 0.36, H.yn - 0.5, z - 0.36, x + 0.36, H.yn, z + 0.36, C.fonteSombre, M.tole());
      b.obstacle(x - 0.25, z, x + 0.25, z, "colonne");
    }
  }
  // Le néon de secours vert, sur une colonne du quai n° 1
  if (fin) {
    panneau(c, "sortie", 0, 3.6, H.zs - 0.2, 0.8, 0.3, PI);
    b.lumiere(0, 3.4, H.zs - 0.9, 0x5dff8a, 2, 8, "néon de secours de la halle, sur batterie");
  }

  // --- Les fermes en arc (treillis) ---
  for (const x of fermes) {
    const extreme = x === H.x0 || x === H.x1;
    const s = extreme ? 0.3 : 0.2;
    for (let j = 0; j < N; j++) {
      const [z1, y1] = pointArc(thetas[j]);
      const [z2, y2] = pointArc(thetas[j + 1]);
      const [z3, y3] = pointArc(thetas[j], 0.85);
      const [z4, y4] = pointArc(thetas[j + 1], 0.85);
      k.poutre([x, y1, z1], [x, y2, z2], s, C.fonte, M.tole());
      k.poutre([x, y3, z3], [x, y4, z4], s, C.fonte, M.tole());
      k.poutre(j % 2 ? [x, y1, z1] : [x, y3, z3], j % 2 ? [x, y4, z4] : [x, y2, z2], 0.1, C.fonte, M.tole());
    }
    // les goussets des naissances : un éventail de fer entre la colonne et l'arc
    for (const sens of [-1, 1]) {
      const zcol = sens > 0 ? H.zs : H.zn;
      const [za, ya] = pointArc(sens * (H.t0 - 0.25));
      k.poutre([x, H.yn - 1.6, zcol], [x, ya, za], 0.14, C.fonte, M.tole());
      const g = new THREE.TorusGeometry(0.55, 0.05, 3, 8);
      k.poser(g, M.tole(), C.fonte, { x, y: H.yn - 0.2, z: zcol - sens * 0.9, ry: PI / 2 });
      g.dispose();
    }
  }
  // --- Les pannes (le long de x), le chéneau ---
  for (let j = 0; j <= N; j++) {
    const [z, y] = pointArc(thetas[j], 0.9);
    k.pave(H.x0 - 0.6, y - 0.06, z - 0.06, H.x1 + 0.6, y + 0.06, z + 0.06, C.fonteSombre, M.tole());
  }
  for (const sens of [-1, 1]) {
    const [z, y] = pointArc(sens * H.t0, 0.95);
    k.pave(H.x0 - 0.6, y - 0.35, z - 0.3, H.x1 + 0.6, y, z + 0.3, C.zinc, M.tole());
  }

  // --- La couverture : zinc en bas, verrière au milieu, lanterneau au faîte ---
  const trous = [];
  const p = 0.3 + 0.4 * u;
  for (let i = 0; i < fermes.length - 1; i++) {
    const xa = fermes[i];
    const xb = fermes[i + 1];
    for (let j = 0; j < N; j++) {
      if (j === 7 || j === 8) continue; // le lanterneau
      const [z1, y1] = pointArc(thetas[j], 0.98);
      const [z2, y2] = pointArc(thetas[j + 1], 0.98);
      const pts = [[xa, y1, z1], [xa, y2, z2], [xb, y2, z2], [xb, y1, z1]];
      if (j < 3 || j > 12) {
        if (c.hasard() < 0.08 * u) continue; // une tôle envolée
        quad(k, M.tole(), C.zinc, pts, true);
        continue;
      }
      const bruit = 0.55 * c.hasard() + 0.45 * (0.5 + 0.5 * Math.sin(i * 1.9 + j * 0.8 + 1.3));
      if (bruit < p) {
        trous.push([(xa + xb) / 2, (y1 + y2) / 2, (z1 + z2) / 2]);
        // parfois, une vitre pend encore, de travers
        if (c.hasard() < 0.15) quad(k, vit, 0xffffff, [[xa + 0.5, y1 - 0.1, z1], [xa + 0.5, y2 - 1.6, z2 + 0.4], [xa + 3, y2 - 1.6, z2 + 0.4], [xa + 3, y1 - 0.1, z1]]);
        continue;
      }
      quad(k, vit, 0xffffff, pts);
    }
  }
  // Le lanterneau : joues vitrées, petit toit de zinc
  {
    const [zA, yA] = pointArc(thetas[7], 0.98);
    const [zB, yB] = pointArc(thetas[9], 0.98);
    const yT = Math.max(yA, yB) + 1.9;
    for (const [z, y] of [[zA, yA], [zB, yB]]) {
      quad(k, vit, 0xffffff, [[H.x0, y, z], [H.x1, y, z], [H.x1, yT, z], [H.x0, yT, z]]);
      for (let x = H.x0; x <= H.x1; x += 2) k.pave(x - 0.04, y, z - 0.04, x + 0.04, yT, z + 0.04, C.fonteSombre, M.tole());
    }
    const zm = (zA + zB) / 2;
    const ytop = yT + 0.8;
    quad(k, M.tole(), C.zinc, [[H.x0 - 0.4, yT, zA - 0.4], [H.x0 - 0.4, ytop, zm], [H.x1 + 0.4, ytop, zm], [H.x1 + 0.4, yT, zA - 0.4]], true);
    quad(k, M.tole(), C.zinc, [[H.x0 - 0.4, yT, zB + 0.4], [H.x1 + 0.4, yT, zB + 0.4], [H.x1 + 0.4, ytop, zm], [H.x0 - 0.4, ytop, zm]], true);
    for (const x of [H.x0 - 0.4, H.x1 + 0.4]) poly(k, M.tole(), C.zinc, [[x, yT, zA - 0.4], [x, yT, zB + 0.4], [x, ytop, zm]]);
  }

  // --- Les pignons en éventail ---
  for (const [x, s] of [[H.x1, 1], [H.x0, -1]]) pignon(ctx, k, x, s, vit);

  // --- La marquise du quai n° 1 (entre la façade et la rive sud de la halle) ---
  {
    const y1 = 6.2;
    const y2 = 7.3;
    const z1 = BV.z0 - 0.3;
    const z2 = H.zs;
    for (const x of fermes) {
      k.poutre([x, y1 - 0.2, z1], [x, y2 - 0.2, z2], 0.16, C.fonte, M.tole());
      k.poutre([x, y1 - 1.6, z1], [x, y1 - 0.2, z1 - 1.6], 0.1, C.fonte, M.tole());
    }
    for (let i = 0; i < fermes.length - 1; i++) {
      const xa = fermes[i];
      const xb = fermes[i + 1];
      if (c.hasard() < 0.25 * u) continue;
      quad(k, vit, 0xffffff, [[xa, y1, z1], [xb, y1, z1], [xb, y2, z2], [xa, y2, z2]]);
    }
    k.pave(H.x0, y2 - 0.25, z2 - 0.15, H.x1, y2 + 0.05, z2 + 0.15, C.zinc, M.tole());
  }

  // --- Le mur nord (brique, hautes fenêtres cintrées, portes de la messagerie) — toujours visible ---
  {
    const a = [H.x0, H.zn - 0.3];
    const bp = [H.x1, H.zn - 0.3];
    const o = [];
    for (let i = 0; i < fermes.length - 1; i++) {
      const xm = (fermes[i] + fermes[i + 1]) / 2;
      // les portes de la messagerie remplacent les fenêtres de deux travées
      if (xm === -12 || xm === 20) o.push({ x: xm, l: 3, bas: 0, haut: 4.4, arc: 0.6, type: "porte" });
      else o.push({ x: xm, l: 4.2, bas: 3, haut: 7.3, arc: 1.2, type: "fenetre", n: 8 });
    }
    const ouv = rel(a, o);
    murTroue(c, a, bp, 0, H.yn, 0.6, ouv, C.brique, M.brique());
    obstaclesMur(b, a, bp, ouv);
    for (const q of ouv) if (q.type === "fenetre" && c.hasard() < 0.8) verrine(c, a, bp, q, vit, 0.1);
    c.pave(H.x0 - 0.4, H.yn - 0.1, H.zn - 0.7, H.x1 + 0.4, H.yn + 0.3, H.zn + 0.1, C.pierreClaire, M.pierre());
    for (const x of fermes) c.pave(x - 0.45, 0, H.zn - 0.75, x + 0.45, H.yn, H.zn - 0.55, C.brique, M.brique());
  }

  // --- Les rais de lumière par les trous de la verrière ---
  if (fin) {
    const choix = trous.filter((t, i) => i % 4 === 1).slice(0, 5);
    for (const [x, y, z] of choix) {
      raiDeLumiere(c, [x, y - 0.5, z], [x - 3.5, 0.15, z + 4.5], 1.5);
      debris(c, x - 4.5, z + 3.5, x - 2.5, z + 5.5, 8, [0xd8e4e8, 0xc0d0d4, 0xe8eef0], 0.32);
    }
  }
}

/** Un pignon : poutre de rive en treillis, tympan vitré en éventail, lambrequin. `s` : +1 à l'est, -1 à l'ouest. */
function pignon(ctx, k, x, s, vit) {
  const { c, u } = ctx;
  const H = HALLE;
  const xs = x + s * 0.25;
  // La poutre de rive à la naissance des arcs
  k.pave(xs - 0.15, H.yn - 0.9, H.zn, xs + 0.15, H.yn - 0.75, H.zs, C.fonte, M.tole());
  k.pave(xs - 0.15, H.yn - 0.1, H.zn, xs + 0.15, H.yn + 0.05, H.zs, C.fonte, M.tole());
  for (let z = H.zn; z < H.zs - 0.5; z += 1.5) {
    k.poutre([xs, H.yn - 0.8, z], [xs, H.yn, z + 0.75], 0.07, C.fonte, M.tole());
    k.poutre([xs, H.yn, z + 0.75], [xs, H.yn - 0.8, z + 1.5], 0.07, C.fonte, M.tole());
  }
  lambrequin(k, [xs + s * 0.05, H.zn], [xs + s * 0.05, H.zs], H.yn - 0.9, C.creme);
  // Le tympan : 12 secteurs rayonnants depuis le milieu de la poutre de rive
  const centre = [xs, H.yn, H.zc];
  const n = 12;
  for (let i = 0; i < n; i++) {
    const t1 = -H.t0 + (2 * H.t0 * i) / n;
    const t2 = -H.t0 + (2 * H.t0 * (i + 1)) / n;
    const tm = (t1 + t2) / 2;
    const P = (t) => {
      const [z, y] = pointArc(t, -0.05);
      return [xs, y, z];
    };
    const r = c.hasard();
    const casse = r < 0.2 + 0.45 * u;
    if (!casse) poly(k, vit, 0xffffff, [centre, P(t1), P(tm), P(t2)]);
    else if (r > 0.1 + 0.2 * u) {
      // il reste la moitié basse du secteur
      const m = (q) => [xs, centre[1] + (q[1] - centre[1]) * 0.45, centre[2] + (q[2] - centre[2]) * 0.45];
      poly(k, vit, 0xffffff, [centre, m(P(t1)), m(P(tm)), m(P(t2))]);
    }
    k.poutre(centre, P(t1), 0.09, C.fonte, M.tole());
  }
  // Deux cerces concentriques
  for (const f of [0.4, 0.72]) {
    let prec = null;
    for (let i = 0; i <= n; i++) {
      const t = -H.t0 + (2 * H.t0 * i) / n;
      const [z, y] = pointArc(t, -0.05);
      const q = [xs, centre[1] + (y - centre[1]) * f, centre[2] + (z - centre[2]) * f];
      if (prec) k.poutre(prec, q, 0.08, C.fonte, M.tole());
      prec = q;
    }
  }
  // L'oculus au milieu, avec l'horloge de la halle (côté est seulement)
  if (s > 0) {
    panneau(k, "horloge", xs + 0.12, H.yn + 2.2, H.zc, 2, 2, PI / 2);
    const g = new THREE.TorusGeometry(1.05, 0.1, 4, 14);
    k.poser(g, M.tole(), C.fonte, { x: xs + 0.1, y: H.yn + 2.2, z: H.zc, ry: PI / 2 });
    g.dispose();
  }
}

// ---------- Les wagons ----------

const F = 0.38; // le plancher des wagons (posés sans bogies sur des traverses)

/**
 * Une voiture (ou un wagon) posée sur des traverses, de x0 à x1, axe z. `type` : « compartiments », « couchettes »,
 * « marchandises ». `detail` : intérieur et couche qui s'efface ; sinon, une simple caisse.
 */
function voiture(ctx, { x0, x1, z, type, couleur, detail, nom }) {
  const { b, c, u } = ctx;
  const zs = z + 1.45;
  const zn = z - 1.45;
  const xm = (x0 + x1) / 2;
  const k = detail ? b.couche(nom, { x: xm, z, l: x1 - x0 + 0.6, p: 3.4 }, 1.25, 4.3) : c;
  const caisse = M.tole();
  // Le calage (traverses empilées), le châssis, le plancher
  for (let x = x0 + 1.8; x < x1 - 1; x += 4.5) c.pave(x - 0.6, 0.1, z - 1.2, x + 0.6, F - 0.08, z + 1.2, C.traverse, M.mat());
  c.pave(x0 + 0.2, F - 0.14, z - 1.3, x1 - 0.2, F, z + 1.3, C.chassis, M.tole());
  c.pave(x0 + 0.1, F, zn + 0.05, x1 - 0.1, F + 0.04, zs - 0.05, 0x9a8468, M.parquet(), { crasse: false });
  // Les portes : vestibules aux deux bouts (des deux côtés), ou la porte coulissante du wagon couvert
  const portes = type === "marchandises" ? [{ x: xm, l: 2, cotes: [1] }] : [{ x: x0 + 0.9, l: 0.8, cotes: [1, -1] }, { x: x1 - 0.9, l: 0.8, cotes: [1, -1] }];
  const ouv = (cote) => portes.filter((q) => q.cotes.includes(cote)).map((q) => ({ u: q.x - x0, l: q.l, bas: 0, haut: 5, arc: false }));
  // Les parois : le bas toujours visible, le haut (fenêtres, toit) dans la couche
  const fenetres = [];
  if (type !== "marchandises") for (let x = x0 + 2.2; x < x1 - 1.9; x += 1.5) fenetres.push(x);
  for (const [zz, cote] of [[zs, 1], [zn, -1]]) {
    const a = [x0, zz];
    const bp = [x1, zz];
    murTroue(c, a, bp, F, 1.25, 0.06, ouv(cote), couleur, caisse);
    const o = [...ouv(cote), ...fenetres.map((x) => ({ u: x - x0, l: 1.1, bas: 1.4, haut: 2.3, arc: false }))];
    murTroue(k, a, bp, 1.25, 3.3, 0.06, o, couleur, caisse);
    obstaclesMur(b, a, bp, ouv(cote), "wagon");
    if (type !== "marchandises") {
      // le bandeau sous les fenêtres, le liseré
      k.pave(x0, 1.3, zz - 0.05, x1, 1.36, zz + 0.05, type === "compartiments" ? 0xb59c4e : C.creme, M.tole());
      for (const x of fenetres) if (detail && type === "compartiments" && c.hasard() < 0.6 - 0.3 * u) k.boite(1.05, 0.88, 0.01, 0xffffff, { x, y: 1.85, z: zz }, M.verre(), { crasse: false });
    } else {
      for (let x = x0 + 0.6; x < x1; x += 1.2) k.pave(x - 0.05, 1.25, zz - 0.06, x + 0.05, 3.2, zz + 0.06, C.chassis, caisse);
    }
  }
  for (const xx of [x0, x1]) {
    murTroue(c, [xx, zn], [xx, zs], F, 1.25, 0.06, [], couleur, caisse);
    murTroue(k, [xx, zn], [xx, zs], 1.25, 3.3, 0.06, type === "marchandises" ? [] : [{ u: 1.45, l: 0.7, bas: 1.25, haut: 2.6, arc: false }], couleur, caisse);
    b.obstacle(xx, zn, xx, zs, "wagon");
    // les tampons et le soufflet
    for (const dz of [-0.9, 0.9]) c.tube([xx, 0.85, z + dz], [xx + (xx === x0 ? -0.45 : 0.45), 0.85, z + dz], 0.13, C.chassis, M.tole(), 6);
    if (type !== "marchandises") k.pave(xx - 0.25, 1.25, z - 0.6, xx + 0.25, 3.0, z + 0.6, 0x2a2826, caisse);
  }
  // Le toit bombé (trois pans)
  for (const [dz, rx, l] of [[0, 0, 1.4], [-1.0, -0.32, 0.9], [1.0, 0.32, 0.9]]) {
    if (type === "couchettes" && dz === 1.0 && u > 0.3) continue; // la tôle a été prise
    k.boite(x1 - x0 + 0.1, 0.06, l, type === "marchandises" ? 0x5a5650 : 0x6a6e6a, { x: xm, y: 3.62 - Math.abs(dz) * 0.18, z: z + dz, rx }, caisse);
  }
  if (detail && type === "couchettes" && u > 0.3) for (let x = x0 + 1; x < x1; x += 1.4) k.poutre([x, 3.3, z + 0.7], [x, 3.4, zs], 0.05, C.chassis, caisse);
  // Le marchepied des portes
  for (const q of portes) for (const cote of q.cotes) c.pave(q.x - q.l / 2, 0.12, (cote > 0 ? zs : zn) - 0.15, q.x + q.l / 2, 0.2, (cote > 0 ? zs : zn) + 0.15, C.chassis, M.tole());
  // Le lierre et la rouille
  lierre(c, x1 - 3, F, zs + 0.03, 0, 3, 2.4 * u + 0.6, 22);
  if (type === "marchandises") lierre(c, x0 + 2, F, zs + 0.03, 0, 2.5, 2.2, 16);
  if (!detail) return k;

  // --- L'intérieur ---
  if (type === "compartiments") {
    // Le couloir côté nord, six compartiments côté sud
    const n = 6;
    const lc = (x1 - x0 - 3.6) / n;
    const zc = z - 0.45; // la cloison du couloir
    for (let i = 0; i <= n; i++) {
      const x = x0 + 1.8 + i * lc;
      c.pave(x - 0.03, F, zc, x + 0.03, 1.25, zs - 0.05, 0x8a6a48, M.satin());
      k.pave(x - 0.03, 1.25, zc, x + 0.03, 3.3, zs - 0.05, 0x8a6a48, caisse);
      if (i < n) {
        const xm2 = x + lc / 2;
        // les banquettes face à face
        for (const sx of [-1, 1]) {
          const xb = xm2 + sx * (lc / 2 - 0.35);
          c.pave(xb - 0.3, F, zc + 0.1, xb + 0.3, F + 0.45, zs - 0.1, C.velours, M.mat());
          c.pave(xb + sx * 0.22 - 0.08, F + 0.45, zc + 0.1, xb + sx * 0.22 + 0.08, 1.2, zs - 0.1, C.velours, M.mat());
          k.pave(xb + sx * 0.3 - 0.1, 2.05, zc + 0.15, xb + sx * 0.3 + 0.1, 2.08, zs - 0.15, C.laiton, caisse); // filet
        }
        // la cloison du couloir, avec la porte du compartiment
        c.pave(x + 0.03, F, zc - 0.03, x + lc - 0.75, 1.25, zc + 0.03, 0x8a6a48, M.satin());
        k.pave(x + 0.03, 1.25, zc - 0.03, x + lc - 0.75, 3.3, zc + 0.03, 0x8a6a48, caisse);
        b.obstacle(x, zc, x + lc - 0.75, zc, "cloison du compartiment");
        b.obstacle(x, zc, x, zs, "cloison du compartiment");
        if (c.hasard() < 0.5) valise(c, xm2, z + 0.5, c.hasard() * 3, F, [C.cuir, 0x3a4a5a][i % 2], 0.6, 0.4, 0.22, true);
      }
    }
    // une couverture, des journaux
    jonchee(c, x0 + 1, zn + 0.1, x1 - 1, zc - 0.05, 10, [0xe9dfc6, 0xd9cfb4], F + 0.05);
    panneau(c, "classe1", xm, 0.95, zs + 0.04, 0.5, 0.5);
    panneau(c, "classe1", xm, 0.95, zn - 0.04, 0.5, 0.5, PI);
  } else if (type === "couchettes") {
    // Le couloir côté sud (quai n° 2), les compartiments côté nord, les couchettes sur trois niveaux
    const n = 6;
    const lc = (x1 - x0 - 3.6) / n;
    const zc = z + 0.45;
    for (let i = 0; i <= n; i++) {
      const x = x0 + 1.8 + i * lc;
      c.pave(x - 0.03, F, zn + 0.05, x + 0.03, 1.25, zc, 0x6a6e78, M.satin());
      k.pave(x - 0.03, 1.25, zn + 0.05, x + 0.03, 3.3, zc, 0x6a6e78, caisse);
      b.obstacle(x, zn, x, zc, "cloison");
      if (i === n) continue;
      const camp = i === 3;
      for (const sx of [-1, 1]) {
        const xb = x + lc / 2 + sx * (lc / 2 - 0.4);
        c.pave(xb - 0.35, F + 0.4, zn + 0.1, xb + 0.35, F + 0.5, zc - 0.05, camp ? 0x6a5a48 : 0x4a5a6a, M.mat());
        for (const y of [1.25, 1.95]) if (!camp || y < 1.5) k.pave(xb - 0.35, y, zn + 0.1, xb + 0.35, y + 0.1, zc - 0.05, 0x4a5a6a, caisse);
      }
      c.pave(x + 0.03, F, zc - 0.03, x + lc - 0.8, 1.25, zc + 0.03, 0x6a6e78, M.satin());
      k.pave(x + 0.03, 1.25, zc - 0.03, x + lc - 0.8, 3.3, zc + 0.03, 0x6a6e78, caisse);
      b.obstacle(x, zc, x + lc - 0.8, zc, "cloison");
      if (camp) {
        // Le camp des survivants : brasero dans un seau, couvertures, conserves, corde à linge
        const xf = x + lc / 2;
        cylY(c, xf, z - 0.4, F, F + 0.45, 0.22, 0.25, C.rouille ?? PALETTE.rouille, M.tole(), 8, true);
        for (let q = 0; q < 6; q++) c.boite(0.1, 0.07, 0.09, q % 2 ? 0xff7a2a : 0xd2451c, { x: xf + c.entre(-0.12, 0.12), y: F + 0.42, z: z - 0.4 + c.entre(-0.12, 0.12) }, M.mat(), { crasse: false });
        b.lumiere(xf, 1.1, z - 0.4, 0xff8a3d, 7, 12, "feu de survivants dans la voiture-couchettes");
        for (let q = 0; q < 5; q++) cylY(c, xf + 0.5 + q * 0.12, z - 1.1, F, F + 0.12, 0.04, 0.04, [0xc8362b, 0xb0b0a0, 0xc79a3b][q % 3], M.metal(), 6);
        c.boite(0.9, 0.08, 1.4, 0x7a5a3a, { x: xf - 0.3, y: F + 0.55, z: z - 0.6, ry: 0.2 }, M.mat(), { nuance: 0.1 });
        k.tube([x + 0.1, 2.5, z - 0.2], [x + lc - 0.1, 2.5, z - 0.4], 0.01, 0xd8d0b8, caisse, 3);
        for (let q = 0; q < 3; q++) k.boite(0.4, 0.5, 0.02, [0x8a5a4a, 0x6a7a8a, 0xb0a890][q], { x: x + 0.6 + q * 0.6, y: 2.25, z: z - 0.25 - q * 0.05 }, caisse);
        // la fumée sort par une vitre cassée : un tuyau de poêle
        c.tube([xf, F + 0.45, z - 0.4], [xf, 1.25, z - 0.4], 0.06, C.suie, M.tole(), 5);
        k.tube([xf, 1.25, z - 0.4], [xf, 2.0, zn + 0.2], 0.06, C.suie, M.tole(), 5);
      }
    }
    panneau(c, "couchettes", xm, 0.85, zs + 0.04, 2.0, 0.5);
  } else {
    // Le wagon couvert : caisses, sacs, la porte coulissante repoussée
    k.pave(xm + 1.0, F, zs + 0.06, xm + 3.1, 3.0, zs + 0.12, couleur, caisse);
    for (const [x, zz, r] of [[x0 + 1.5, z - 0.6, 0], [x0 + 1.6, z + 0.5, 0.2], [x0 + 2.8, z - 0.7, 0.1], [x1 - 1.5, z - 0.5, -0.1], [x1 - 2.6, z - 0.8, 0.3]]) {
      c.boite(0.9, 0.7, 0.8, PALETTE.bois, { x, y: F + 0.35, z: zz, ry: r }, M.mat(), { nuance: 0.08 });
    }
    c.boite(0.8, 0.6, 0.8, PALETTE.boisGris, { x: x0 + 1.6, y: F + 1.0, z: z - 0.5, ry: 0.4 }, M.mat());
    for (let i = 0; i < 4; i++) c.boite(0.8, 0.3, 0.5, 0xb0a07a, { x: x1 - 1.8 + c.entre(-0.4, 0.4), y: F + 0.15, z: z + 0.6 + c.entre(-0.3, 0.3), ry: c.hasard() }, M.mat(), { nuance: 0.1 });
    jonchee(c, x0 + 0.5, zn + 0.2, x1 - 0.5, zs - 0.2, 12, [0xb59a68, 0x9c7a45], F + 0.05);
  }
  return k;
}

/** La locomotive diesel (BB) sous le lierre, sur ses bogies, face au pignon est. */
function locomotive(ctx, x0, x1, z, detail) {
  const { b, c, u } = ctx;
  const k = detail ? b.couche("locomotive", { x: (x0 + x1) / 2, z, l: x1 - x0 + 0.6, p: 3.4 }, 1.3, 4.6) : c;
  const xm = (x0 + x1) / 2;
  // Les bogies et les roues
  for (const xb of [x0 + 3.2, x1 - 3.2]) {
    c.pave(xb - 1.6, 0.45, z - 1.2, xb + 1.6, 0.95, z + 1.2, C.chassis, M.tole());
    for (const dx of [-1, 1]) for (const dz of [-0.72, 0.72]) cylZ(c, xb + dx * 1.05, 0.55, z + dz, 0.5, 0.12, 0x2a2826, M.tole(), 10);
  }
  c.pave(x0 + 0.3, 0.95, z - 1.4, x1 - 0.3, 1.35, z + 1.4, C.chassis, M.tole());
  // La caisse : deux cabines aux bouts, le capot au milieu
  c.pave(x0 + 0.4, 1.35, z - 1.45, x1 - 0.4, 1.6, z + 1.45, C.loco, M.satin());
  k.pave(x0 + 0.4, 1.6, z - 1.45, x1 - 0.4, 3.9, z + 1.45, C.loco, M.tole());
  k.pave(x0 + 0.4, 2.3, z - 1.47, x1 - 0.4, 2.55, z + 1.47, C.creme, M.tole());
  for (const [xc, s] of [[x0 + 0.4, -1], [x1 - 0.4, 1]]) {
    // le nez incliné, les vitres de cabine, les phares
    k.boite(0.05, 1.0, 2.2, 0x1e2422, { x: xc + s * 0.02, y: 3.2, z }, M.tole());
    k.boite(1.6, 0.9, 0.05, 0x1e2422, { x: xc - s * 0.9, y: 3.2, z: z + 1.47 }, M.tole());
    k.boite(1.6, 0.9, 0.05, 0x1e2422, { x: xc - s * 0.9, y: 3.2, z: z - 1.47 }, M.tole());
    for (const dz of [-0.8, 0.8]) cylY(c, xc + s * 0.05, z + dz, 1.4, 1.6, 0.13, 0.13, 0xd8d0b0, M.lisse(), 6);
    for (const dz of [-0.9, 0.9]) c.tube([xc, 1.15, z + dz], [xc + s * 0.5, 1.15, z + dz], 0.14, C.chassis, M.tole(), 6);
  }
  k.pave(x0 + 0.6, 3.9, z - 1.3, x1 - 0.6, 4.15, z + 1.3, 0x6a6460, M.tole());
  for (let x = xm - 2.5; x <= xm + 2.5; x += 1.25) k.pave(x - 0.4, 4.15, z - 0.6, x + 0.4, 4.3, z + 0.6, 0x3a3634, M.tole()); // grilles
  for (let x = x0 + 3; x < x1 - 3; x += 0.6) k.pave(x - 0.03, 1.8, z + 1.46, x + 0.03, 2.2, z + 1.5, 0x5a3a28, M.tole()); // ouïes
  panneau(c, "loco", xm, 1.48, z + 1.47, 1.0, 0.38);
  obstacleRect(b, x0 + 0.2, z - 1.45, x1 - 0.2, z + 1.45, "locomotive");
  // Le lierre l'a prise
  lierre(c, xm, 1.6, z + 1.5, 0, x1 - x0 - 2, 2.4, 50 + 40 * u);
  lierre(c, xm - 2, 0.3, z + 1.5, 0, 6, 1.2, 25);
  lierre(c, xm + 1, 1.6, z - 1.5, PI, x1 - x0 - 4, 2.2, 24);
  for (let i = 0; i < 6; i++) mousse(c, c.entre(x0 + 1, x1 - 1), 4.15, z + c.entre(-1, 1), 0.6, 3, 0x4f7a3c);
}

/** Le wagon plat chargé de rails. */
function wagonPlat(ctx, x0, x1, z) {
  const { b, c } = ctx;
  for (const xb of [x0 + 2, x1 - 2]) {
    c.pave(xb - 1, 0.35, z - 1, xb + 1, 0.8, z + 1, C.chassis, M.tole());
    for (const dz of [-0.72, 0.72]) cylZ(c, xb, 0.5, z + dz, 0.45, 0.1, 0x2a2826, M.tole(), 10);
  }
  c.pave(x0, 0.8, z - 1.35, x1, 1.05, z + 1.35, 0x5a4a3a, M.mat());
  for (let x = x0; x <= x1; x += 2) c.pave(x - 0.06, 1.05, z - 1.4, x + 0.06, 1.7, z - 1.3, C.chassis, M.tole());
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6 - r; i++) c.pave(x0 + 0.3, 1.05 + r * 0.15, z - 0.9 + i * 0.32 + r * 0.16, x1 - 0.3, 1.2 + r * 0.15, z - 0.82 + i * 0.32 + r * 0.16, C.rail, M.metal());
  obstacleRect(b, x0, z - 1.35, x1, z + 1.35, "wagon plat");
}

// ---------- La halle : quais et décor ----------

function deco(ctx) {
  const { b, c, u } = ctx;
  // Quai n° 2 : bancs, panneau de l'Abondance, horloge de quai, chariot de la poste, lanterne oubliée
  for (const x of [-27, 8, 15]) {
    banc(c, x, -18.5, 0, 2, true, HQ);
    banc(c, x, -19.2, PI, 2, true, HQ);
  }
  b.lumiere(-18, 0.9, -18.6, 0xffbe6a, 3, 7, "lanterne de chef de gare oubliée sur un banc du quai");
  banc(c, -18, -18.5, 0, 2, false, HQ);
  lanterne(c, -18.4, HQ + 0.46, -18.5, 0x8a2a24, 0xe8b860);
  // « Train autonome sans conducteur : 0 min de retard garanti »
  for (const x of [20.6, 23.4]) c.tube([x, HQ, -18.5], [x, 3.5, -18.5], 0.07, 0xe2dccb, M.lisse(), 6);
  c.boite(3.6, 1.0, 0.16, 0xe2dccb, { x: 22, y: 3.0, z: -18.5 }, M.lisse());
  panneau(c, "autonome", 22, 3.0, -18.41, 3.4, 0.85);
  panneau(c, "autonome", 22, 3.0, -18.59, 3.4, 0.85, PI);
  b.obstacle(20.6, -18.5, 23.4, -18.5, "panneau");
  // l'horloge de quai à double face
  c.tube([4, HQ, -18.5], [4, 3.3, -18.5], 0.06, C.fonte, M.tole(), 6);
  cylZ(c, 4, 3.6, -18.5, 0.4, 0.2, C.fonteSombre, M.tole(), 10);
  panneau(c, "horloge", 4, 3.6, -18.39, 0.72, 0.72);
  panneau(c, "horloge", 4, 3.6, -18.61, 0.72, 0.72, PI);
  // les panneaux de quai
  for (const [x, z, n] of [[-8, -18.5, "quai2"], [-8, -30.5, "quai3"], [-24, -11.6, "quai1"]]) {
    for (const dx of [-1, 1]) c.tube([x + dx, HQ, z], [x + dx, 3.1, z], 0.05, C.fonte, M.tole(), 6);
    c.boite(2.4, 0.7, 0.08, 0x1f3a6b, { x, y: 3.0, z }, M.satin());
    panneau(c, n, x, 3.0, z + 0.05, 0.6, 0.6);
  }
  // le chariot de la poste
  chariot(c, -22.5, -18.2, -0.3, HQ);
  for (let i = 0; i < 3; i++) c.boite(0.6, 0.5, 0.45, 0xb0a07a, { x: -22.9 + i * 0.5, y: HQ + 0.85, z: -18.2, ry: c.hasard() }, M.mat(), { nuance: 0.1 });
  obstacleRect(b, -23.8, -18.8, -21.2, -17.6, "chariot de la poste");
  // L'abri de quai, vitré
  {
    const x = -2;
    const z = -18.5;
    c.pave(x - 2, HQ, z - 0.05, x + 2, HQ + 2.4, z + 0.05, 0xffffff, M.verre(), { crasse: false });
    for (const dx of [-2, 0, 2]) c.pave(x + dx - 0.05, HQ, z - 0.05, x + dx + 0.05, HQ + 2.6, z + 0.05, C.fonte, M.tole());
    c.pave(x - 2.2, HQ + 2.6, z - 1.2, x + 2.2, HQ + 2.7, z + 1.2, C.fonte, M.tole());
    lambrequin(c, [x - 2.2, z + 1.2], [x + 2.2, z + 1.2], HQ + 2.6, C.creme);
    banc(c, x, z + 0.4, 0, 3, false, HQ);
    b.obstacle(x - 2, z, x + 2, z, "abri de quai");
  }
  // Quai n° 3 : l'atelier des survivants (on taille des enclumes dans les rails)
  {
    const x = -4;
    const z = -30.6;
    for (const dx of [-0.9, 0.9]) {
      c.pave(x + dx - 0.1, HQ, z - 0.4, x + dx + 0.1, HQ + 0.8, z + 0.4, PALETTE.bois, M.mat());
    }
    c.pave(x - 2, HQ + 0.8, z - 0.05, x + 2, HQ + 0.95, z + 0.05, C.rail, M.metal());
    c.boite(0.8, 0.04, 0.12, 0x6a6a68, { x: x + 0.6, y: HQ + 1.1, z: z + 0.1, rz: 0.4 }, M.metal()); // la scie
    cylY(c, x + 2.4, z + 0.3, HQ, HQ + 0.6, 0.3, 0.28, PALETTE.boisSombre, M.mat(), 7); // la souche
    c.pave(x + 2.1, HQ + 0.6, z + 0.2, x + 2.7, HQ + 0.8, z + 0.4, C.rail, M.metal()); // l'enclume
    c.pave(x + 2.25, HQ + 0.8, z + 0.22, x + 2.55, HQ + 0.95, z + 0.38, C.rail, M.metal());
    debris(c, x - 2, z - 1, x + 2, z + 1, 10, [0x6a5446, 0x8a7a6a], HQ);
    obstacleRect(b, x - 2, z - 0.4, x + 2, z + 0.4, "établi");
  }
  // la pile de rails sur le quai n° 3
  for (let r = 0; r < 2; r++) for (let i = 0; i < 5 - r; i++) c.pave(10, HQ + r * 0.15, -31.6 + i * 0.3 + r * 0.15, 24, HQ + 0.15 + r * 0.15, -31.52 + i * 0.3 + r * 0.15, C.rail, M.metal());
  b.obstacle(10, -31.2, 24, -31.2, "pile de rails");
  banc(c, -20, -30.5, 0, 2, true, HQ);
  // Le bogie déposé sur la voie 3
  c.pave(24.4, 0.3, -27.6, 27.6, 0.75, -25.4, C.chassis, M.tole());
  for (const dx of [-1.05, 1.05]) for (const dz of [-0.72, 0.72]) cylZ(c, 26 + dx, 0.5, -26.5 + dz, 0.48, 0.12, 0x3a3634, M.tole(), 10);
  obstacleRect(b, 24.4, -27.6, 27.6, -25.4, "bogie");
  // Le long du mur nord : touret de câble, gravats, tôles tombées
  {
    const g = new THREE.CylinderGeometry(0.9, 0.9, 0.9, 10);
    c.poser(g, M.mat(), PALETTE.bois, { x: 20, y: 0.9, z: -38.6, rx: PI / 2 });
    g.dispose();
    cylZ(c, 20, 0.9, -38.6, 0.6, 0.92, 0xb87440, M.metal(), 10);
    obstacleRect(b, 19.1, -39.1, 20.9, -38.1, "touret");
  }
  for (const [x, z] of [[-24, -39], [6, -38.5], [28, -39.4]]) gravats(c, x, z, 1.2, 10, [C.brique, 0x7a4a38, C.pierreClaire]);
  for (let i = 0; i < 6; i++) c.boite(2.4, 0.04, 1.1, C.zinc, { x: c.entre(-28, 28), y: 0.18, z: c.entre(-40, -37), ry: c.hasard() * 3, rz: c.entre(-0.2, 0.2) }, M.tole(), { nuance: 0.1 });
  flaque(c, -12, -27, 1.6);
  flaque(c, 10, -38.5, 1.3);
  flaque(c, -28, -36.5, 1.1);
}

/** Les voies au-delà du pignon est : poste d'aiguillage, tringles, aiguilles, signal carré, voies vers l'horizon. */
function abordsEst(ctx) {
  const { b, c, u } = ctx;
  // --- Le poste d'aiguillage ---
  const P = { x0: 40, x1: 47, z0: -41.4, z1: -37 };
  const k = b.couche("poste d'aiguillage : cabine vitrée, toit", { x: (P.x0 + P.x1) / 2, z: (P.z0 + P.z1) / 2, l: 8, p: 5.4 }, 1.1, 5.4);
  const vit = M.vitrage(u);
  c.pave(P.x0 - 0.2, -0.02, P.z0 - 0.2, P.x1 + 0.2, 0.05, P.z1 + 0.2, 0x8a857c, M.beton(), { crasse: false });
  const murs = [
    { a: [P.x0, P.z1], b: [P.x1, P.z1], o: [{ u: 1.5, l: 1.0, bas: 0, haut: 2.3, arc: false }] },
    { a: [P.x0, P.z0], b: [P.x1, P.z0], o: [] },
    { a: [P.x0, P.z0], b: [P.x0, P.z1], o: [] },
    { a: [P.x1, P.z0], b: [P.x1, P.z1], o: [] },
  ];
  for (const m of murs) {
    murTroue(c, m.a, m.b, 0, 1.1, 0.35, m.o, C.brique, M.brique());
    obstaclesMur(b, m.a, m.b, m.o);
    const { L } = repereMur(m.a, m.b);
    // la cabine vitrée : montants, vitrages
    const o2 = m.o.map((q) => ({ ...q }));
    const n = Math.round(L / 1.2);
    const { ry } = repereMur(m.a, m.b);
    k.repere({ x: m.a[0], z: m.a[1], ry }, () => {
      for (let i = 0; i <= n; i++) k.pave((i * L) / n - 0.05, 1.1, -0.06, (i * L) / n + 0.05, 3.2, 0.06, C.creme, M.tole());
      k.pave(0, 1.1, -0.2, L, 1.2, 0.2, C.creme, M.tole());
      k.pave(0, 3.1, -0.1, L, 3.3, 0.1, C.creme, M.tole());
    });
    for (let i = 0; i < n; i++) {
      const uu = ((i + 0.5) * L) / n;
      if (o2.some((q) => Math.abs(q.u - uu) < q.l)) continue;
      if (c.hasard() < 0.35 * u) continue;
      verrine(k, m.a, m.b, { u: uu, l: L / n - 0.1, bas: 1.2, haut: 3.1, arc: false }, vit, 0);
    }
    if (m.o.length) k.pave(P.x0 + 1, 2.3, P.z1 - 0.1, P.x0 + 2, 3.1, P.z1 + 0.1, C.creme, M.tole());
  }
  // le toit en croupe, la cheminée
  {
    const pts = [[1, 0], [0.05, 1.4]].map(([r, y]) => new THREE.Vector2(r, y));
    const g = new THREE.LatheGeometry(pts, 4).rotateY(PI / 4);
    k.poser(g, M.tole(), 0x6a5a52, { x: (P.x0 + P.x1) / 2, y: 3.3, z: (P.z0 + P.z1) / 2, e: [4 / Math.SQRT1_2, 1, 2.8 / Math.SQRT1_2] }, { crasse: false });
    g.dispose();
    k.pave(45, 3.6, -40.6, 45.6, 5.2, -40, C.brique, M.tole());
  }
  // la rangée de leviers contre le mur nord, le tableau de contrôle optique
  c.pave(P.x0 + 0.6, 0, P.z0 + 0.5, P.x1 - 0.6, 0.35, P.z0 + 1.0, C.fonteSombre, M.tole());
  const tons = [0xc8362b, 0xc8362b, 0x2f5a8a, 0xd8b84a, 0x2a2826, 0xc8362b, 0x7a5a3a, 0x2f5a8a, 0xc8362b, 0xd8b84a, 0x2a2826, 0xc8362b, 0x2f5a8a, 0xc8362b];
  for (let i = 0; i < 14; i++) {
    const x = P.x0 + 0.9 + i * 0.38;
    const tire = c.hasard() < 0.4;
    c.repere({ x, y: 0.35, z: P.z0 + 0.75, rx: tire ? 0.45 : -0.15 }, () => {
      c.boite(0.05, 1.3, 0.07, 0x8a8e88, { y: 0.65 }, M.metal());
      c.boite(0.07, 0.25, 0.09, tons[i], { y: 1.2 }, M.satin());
    });
  }
  b.obstacle(P.x0 + 0.6, P.z0 + 1.0, P.x1 - 0.6, P.z0 + 1.0, "leviers");
  for (const x of [P.x0 + 1, P.x1 - 1]) c.tube([x, 2.0, P.z0 + 0.6], [x, 3.2, P.z0 + 0.6], 0.02, C.fonteSombre, M.tole(), 4);
  c.boite(5, 0.9, 0.06, 0x2a2f2c, { x: (P.x0 + P.x1) / 2, y: 2.1, z: P.z0 + 0.6 }, M.mat());
  panneau(c, "diagramme", (P.x0 + P.x1) / 2, 2.1, P.z0 + 0.64, 4.8, 0.85);
  // le pupitre, le registre, le poêle, la lampe
  c.pave(P.x1 - 1.6, 0, P.z1 - 1.1, P.x1 - 0.3, 0.9, P.z1 - 0.4, C.bois, M.satin());
  c.boite(0.4, 0.05, 0.3, 0xd8d0b8, { x: P.x1 - 1.0, y: 0.93, z: P.z1 - 0.75, ry: 0.2 }, M.mat());
  lanterne(c, P.x1 - 0.6, 0.9, P.z1 - 0.7);
  b.lumiere(P.x1 - 0.6, 1.5, P.z1 - 0.9, 0xffd27a, 2.5, 6, "lampe à pétrole du poste d'aiguillage");
  cylY(c, P.x0 + 0.8, P.z1 - 0.8, 0, 0.8, 0.25, 0.25, C.suie, M.tole(), 8);
  chaise(c, P.x1 - 1.3, P.z1 - 1.6, PI);
  // --- Les tringles qui courent vers les aiguilles ---
  for (let i = 0; i < 4; i++) {
    const x = 41 + i * 0.25;
    c.pave(x - 0.03, 0.12, -36.8, x + 0.03, 0.18, -14 + i * 0.2, 0x6a5a4e, M.metal(), { crasse: false });
  }
  for (let z = -36; z < -14; z += 2.2) c.pave(40.7, 0, z - 0.1, 42.1, 0.12, z + 0.1, C.fonteSombre, M.tole());
  // --- Les aiguilles (deux communications entre voies) ---
  for (const [za, zb, xa] of [[-14, -23, 46], [-26.5, -34.5, 50]]) {
    for (const dz of [-0.72, 0.72]) c.poutre([xa, 0.26, za + dz], [xa + 9, 0.26, zb + dz], 0.08, C.rail, M.metal());
    for (let t = 0.1; t < 1; t += 0.12) {
      const x = xa + 9 * t;
      const z = za + (zb - za) * t;
      c.boite(0.24, 0.1, 2.4, C.traverse, { x, y: 0.14, z, ry: Math.atan2(zb - za, 9) * -1 }, M.mat());
    }
  }
  // --- Le signal carré (damier rouge et blanc) ---
  {
    const x = 54;
    const z = -10.4;
    c.tube([x, 0, z], [x, 5.2, z], 0.1, 0x3a3e3c, M.tole(), 6);
    c.boite(1.1, 1.1, 0.06, 0xe6e0d0, { x, y: 4.4, z, ry: -0.1 }, M.satin());
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) c.boite(0.27, 0.27, 0.02, 0xb8402e, { x: x - 0.41 + i * 0.275, y: 4.0 + j * 0.275, z: z + 0.04, ry: -0.1 }, M.satin());
    for (let y = 0.6; y < 4; y += 0.35) c.boite(0.4, 0.03, 0.04, 0x3a3e3c, { x: x + 0.1, y, z }, M.tole());
    b.obstacle(x - 0.2, z, x + 0.2, z, "signal");
  }
  // Les poteaux télégraphiques le long des voies
  for (let x = 36; x < 120; x += 14) {
    c.tube([x, 0, -8.2], [x, 7, -8.2], 0.12, PALETTE.boisGris, M.mat(), 5);
    c.boite(1.6, 0.1, 0.1, PALETTE.boisGris, { x, y: 6.6, z: -8.2 }, M.mat());
    for (const dx of [-0.6, 0, 0.6]) c.boite(0.08, 0.14, 0.08, 0xd8d0c0, { x: x + dx, y: 6.75, z: -8.2 }, M.lisse());
  }
  for (const dx of [-0.6, 0, 0.6]) c.pave(36 + dx - 0.01, 6.55, -8.21, 120, 6.57, -8.19, 0x2a2826, M.mat(), { crasse: false });
  // Un câble tombé (il pend jusqu'au ballast)
  c.poutre([50 - 0.6, 6.5, -8.2], [55, 0.15, -11.5], 0.02, 0x2a2826, M.mat());
}

// ---------- La végétation ----------

function vegetation(ctx, quoi) {
  const { c, u } = ctx;
  if (quoi === "voyageurs") {
    // Les platanes du parvis, les bouleaux dans les pavés
    for (const [x, z, h] of [[-32, 15, 10], [-18, 16, 9], [18, 16, 10], [32, 15, 9]]) {
      c.pave(x - 1, 0.01, z - 1, x + 1, 0.05, z + 1, C.fonteSombre, M.tole());
      arbre(c, x, z, h * (0.85 + 0.25 * u), "feuillu");
    }
    for (const [x, z] of [[-40, 10], [40, 11], [-8, 19.5]]) if (c.hasard() < 0.3 + 0.7 * u) arbre(c, x, z, 4 + 3 * u, "bouleau");
    for (const [x, z] of [[-39.5, 7.5], [39.5, 7.5], [-30.8, 7.2], [30.8, 7.2], [11.8, 8.4]]) arbuste(c, x, z, 0.8 + 0.6 * u);
    // les herbes au pied du bâtiment côté quais
    semerTouffes(c, -38, -7, 38, -6.4, 30 + 30 * u, PALETTE.herbeSeche, HQ);
    // la halle au fond : quelques bouleaux sur les quais
    for (const [x, z] of [[-24.5, -16.6], [12, -16.5], [27, -20], [-12, -32]]) arbre(c, x, z, 5 + 4 * u, "bouleau", HQ);
  } else {
    // Bouleaux et buissons sur les quais, la voie 3 rendue à la friche
    for (const [x, z, h] of [[-24.5, -16.6], [12, -16.5], [27, -20], [-12, -32], [16, -29], [-25, -29.5]].map(([x, z]) => [x, z, 5 + 4 * u])) arbre(c, x, z, h, "bouleau", HQ);
    for (const [x, z] of [[-18, -26.5], [-5, -26.4], [6, -26.6], [18, -26.3], [36, -26.5], [44, -24], [56, -30]]) {
      if (c.hasard() < 0.2 + 0.8 * u) arbre(c, x, z, 4 + 5 * u * c.hasard() + 2, "bouleau");
      arbuste(c, x + c.entre(-2, 2), z + c.entre(-0.8, 0.8), 0.8 + 0.6 * u);
    }
    semerTouffes(c, -34, -27.8, 58, -25.2, 80 + 60 * u, PALETTE.herbe);
    for (const [x, z] of [[-30, -38], [-16, -39], [8, -40], [30, -38]]) arbuste(c, x, z, 1 + 0.5 * u);
    // Hors de la halle : les herbes hautes entre les voies, vers l'horizon
    semerTouffes(c, 33, -40, 58, -7, 40 + 50 * u, PALETTE.herbeSeche);
    for (const [x, z] of [[38, -10], [48, -27], [52, -38], [57, -15]]) arbuste(c, x, z, 1 + 0.6 * u);
    // Le lierre sur le mur nord de la halle
    for (const x of [-27, -4, 18]) lierre(c, x, 0, HALLE.zn + 0.02, 0, 3, 3.5 + 2 * u, 26);
  }
}

// ---------- Le contrat : creer({ usure, carte }) ----------

/** Recentre tout ce qui a été construit dans le repère du site sur l'origine du lot de la carte. */
function recentrer(groupe, o, lot) {
  const vues = new Set();
  groupe.traverse((obj) => {
    if (obj.geometry && !vues.has(obj.geometry)) {
      vues.add(obj.geometry);
      obj.geometry.translate(-o.x, 0, -o.z);
    }
  });
  const ud = groupe.userData;
  for (const t of ud.toits) {
    t.boite = { ...t.boite, x: arr(t.boite.x - o.x), z: arr(t.boite.z - o.z) };
    if (t.horsDe) t.horsDe = { ...t.horsDe, x: t.horsDe.x - o.x, z: t.horsDe.z - o.z };
  }
  const dedans = (x, z) => Math.abs(x) <= lot.l / 2 + 1 && Math.abs(z) <= lot.p / 2 + 1;
  ud.obstacles = ud.obstacles
    .map((s) => ({ ...s, x1: arr(s.x1 - o.x), z1: arr(s.z1 - o.z), x2: arr(s.x2 - o.x), z2: arr(s.z2 - o.z) }))
    .filter((s) => dedans(s.x1, s.z1) || dedans(s.x2, s.z2));
  ud.lumieres = ud.lumieres.map((l) => ({ ...l, x: arr(l.x - o.x), z: arr(l.z - o.z) })).filter((l) => dedans(l.x, l.z));
  return groupe;
}

export function creer({ usure = 0.7, carte = "voyageurs" } = {}) {
  const def = CARTES.find((k) => k.id === carte) ?? CARTES[0];
  const o = ORIGINES[def.id];
  const b = new Batiment(1864, usure);
  const ctx = { b, c: b.c, u: usure };
  const fin = def.id === "voyageurs";

  if (fin) {
    parvis(ctx);
    solsBV(ctx);
    batimentVoyageurs(ctx, true);
    interieurBV(ctx);
    quais(ctx, -44, 44, [1]);
    quaiUn(ctx);
    lampadaires(ctx);
    halle(ctx, false);
    voies(ctx, -34, 34, -70, 110);
    // les wagons, de loin
    voiture(ctx, { x0: -24, x1: 0, z: VOIES[0], type: "compartiments", couleur: C.wagonVert, detail: false });
    voiture(ctx, { x0: -12, x1: 12, z: VOIES[1], type: "couchettes", couleur: C.wagonBleu, detail: false });
    vegetation(ctx, "voyageurs");
  } else {
    batimentVoyageurs(ctx, false);
    quais(ctx, -40, 58);
    halle(ctx, true);
    voies(ctx, -40, 58, -80, 130);
    voiture(ctx, { x0: -24, x1: 0, z: VOIES[0], type: "compartiments", couleur: C.wagonVert, detail: true, nom: "voiture à compartiments : haut de caisse, toit" });
    voiture(ctx, { x0: -12, x1: 12, z: VOIES[1], type: "couchettes", couleur: C.wagonBleu, detail: true, nom: "voiture-couchettes : haut de caisse, toit" });
    voiture(ctx, { x0: -22, x1: -8, z: VOIES[3], type: "marchandises", couleur: C.wagonRouge, detail: true, nom: "wagon couvert : haut des parois, toit" });
    locomotive(ctx, 13, 29, VOIES[1], true);
    wagonPlat(ctx, 0, 12, VOIES[3]);
    deco(ctx);
    abordsEst(ctx);
    vegetation(ctx, "halle");
  }
  return recentrer(b.construire(), o, def.lot);
}
