// La centrale thermique (nouveau lieu, Zone industrielle, lointain, danger ●●●●).
//
// Inspiration : la « Power Plant IM » de Charleroi, icône de l'urbex. Une tour de refroidissement hyperboloïde en béton,
// immense, posée sur sa couronne de piliers en V ; dedans, un cylindre vertigineux, le bassin asséché et la forêt de
// piliers. À côté, la salle des turbines comme une cathédrale industrielle (brique, verrières, pont roulant, groupes
// turbo-alternateurs peints en vert et en bleu), la salle de commande et ses murs de cadrans, la chaufferie en tôle,
// la cheminée à bandes, le convoyeur à charbon, les transformateurs et le pylône. Elle produisait le courant de la
// Compagnie : c'est l'emblème de la Grande Panne.
//
// Le lieu est trop grand pour une seule carte : on le découpe en trois cartes qui partagent le même plan (« repère du
// site » : origine au centre du grand lot, +x à l'est, +z au sud). Chaque carte construit ce qu'elle voit, avec plus ou
// moins de détail, puis tout est recentré sur son propre lot (voir `recentrer`).
// - « site » : l'extérieur, toutes les silhouettes, des intérieurs simplifiés ;
// - « turbines » : la salle des turbines et la salle de commande en détail (la tour et la cheminée au loin) ;
// - « tour » : l'intérieur de la tour de refroidissement (la salle des turbines au loin).

import * as THREE from "three";
import { Batiment, PALETTE, matiere, matiereMonde, matiereTexture, matiereLueur, dessiner, aleatoire, taches, mur, lierre, touffes, semerTouffes, gravats, debris, jonchee, mousse, arbuste, arbre, raiDeLumiere, flaque } from "../commun/atelier.js";

// ---------- Le plan du site (repère « site ») ----------

const TOUR = { x: -28, z: -8 };
const SALLE = { x0: -6, x1: 38, z0: -8, z1: 10, h: 16, faite: 20.5 };
const ANNEXE = { x0: -6, x1: 16, z0: 10, z1: 18, h: 3.2, toit: 4.4 };
const CHAUFFERIE = { x0: -6, x1: 22, z0: -20, z1: -8, h: 26 };
const CHEMINEE = { x: 32, z: -27, h: 62 };
const ORIGINES = { site: { x: 0, z: 0 }, turbines: { x: 16, z: 5 }, tour: { x: -28, z: -8 } };

/** Angle de la brèche de la tour (x = sin θ, z = cos θ autour du centre de la tour). */
const NP = 32; // nombre de pieds en V
const BRECHE = 5; // l'ouverture n° 5 entre deux pieds (θ ≈ 1,08 rad : vers l'est-sud-est, face à la salle des turbines)
const thetaPied = (i) => (i * Math.PI * 2) / NP;
const thetaOuv = (j) => ((j + 0.5) * Math.PI * 2) / NP;
const BRECHE_XZ = { x: TOUR.x + 15.6 * Math.sin(thetaOuv(BRECHE)), z: TOUR.z + 15.6 * Math.cos(thetaOuv(BRECHE)) };

function arr(v) {
  return Math.round(v * 10) / 10;
}
function vers(carte, liste) {
  const o = ORIGINES[carte];
  return liste.map((p) => ({ ...p, x: arr(p.x - o.x), z: arr(p.z - o.z) }));
}

// ---------- La fiche ----------

const FOUILLE = [
  { x: 33, z: 1.3, quoi: "alternateur n° 2 ouvert : bobinages de cuivre (lourd, il faut des outils)" },
  { x: 10, z: 9.2, quoi: "chemins de câbles : câbles de cuivre arrachés à moitié" },
  { x: 5, z: 1.4, quoi: "palier du groupe n° 1 : roulements, bronze, huile de turbine" },
  { x: -4.8, z: -3.2, quoi: "atelier d'entretien : établi, clés, étau, perceuse à colonne (outillage)" },
  { x: -3.4, z: 7.4, quoi: "fûts d'huile (lubrifiant, combustible)" },
  { x: 3.6, z: 10.9, quoi: "salle de commande : étagère de classeurs (manuels techniques de la Compagnie)" },
  { x: 6.6, z: 11, quoi: "armoire des batteries de secours (un voyant vert : il reste un peu de charge)" },
  { x: 1, z: 13.4, quoi: "pupitres : voyants, relais, fusibles, petite électronique" },
  { x: 42.5, z: 17, quoi: "poste de transformation : isolateurs, cuivre des barres, huile" },
  { x: 46.5, z: 3, quoi: "wagon-trémie : ferraille, ressorts de suspension" },
  { x: 44, z: -24, quoi: "parc à charbon : charbon (seau, sac)" },
  { x: -19.6, z: -2.6, quoi: "camp des Charbonniers dans la tour : braises, sac de charbon de bois" },
  { x: -28, z: -14, quoi: "fond du bassin : tuyaux de distribution tombés (ferraille)" },
  { x: -12.7, z: -0.3, quoi: "pied de l'échelle de la tour : câble de paratonnerre (cuivre)" },
];
const ETEINTS = [
  { x: 1.5, z: 14.8, type: "ancien habitant : technicien en combinaison de la Compagnie (salle de commande)" },
  { x: 12, z: 15, type: "ancien habitant : cadre en costume (salle de méditation énergétique)" },
  { x: 22, z: 5, type: "errant (entre les deux groupes)" },
  { x: 31, z: -5.6, type: "rampant (sous l'escalier métallique)" },
  { x: 8, z: 24, type: "errant (cour)" },
  { x: 40, z: 9, type: "errant (voie ferrée)" },
  { x: -31, z: -11, type: "rampant (entre les piliers de la tour)" },
  { x: -24, z: -16, type: "putréfié (dans la flaque du bassin)" },
  { x: -10, z: 3, type: "errant (entre la tour et la salle)" },
];
const ENTREES = [
  { x: 28, z: 10.3, nature: "porte principale de la salle des turbines (un battant tombé)" },
  { x: 38.3, z: 3, nature: "rideau métallique à demi levé (pignon est, voie ferrée)" },
  { x: -6.3, z: 4, nature: "brèche du mur ouest de la salle (si l'usure dépasse 0,5)" },
  { x: -2, z: 18.3, nature: "porte de la salle de commande" },
  { x: 10, z: 18.3, nature: "porte de la salle de méditation énergétique" },
  { x: arr(BRECHE_XZ.x), z: arr(BRECHE_XZ.z), nature: "brèche entre les piliers de la tour (tôles arrachées, muret cassé)" },
];
const dans = (k) => (p) => {
  const o = ORIGINES[k.id];
  return Math.abs(p.x - o.x) <= k.lot.l / 2 && Math.abs(p.z - o.z) <= k.lot.p / 2;
};

const CARTES = [
  {
    id: "site",
    nom: "Le site",
    lot: { l: 100, p: 70 },
    depart: { x: 30, z: 30 },
    description: "l'extérieur : tour de refroidissement, cheminée, salle des turbines, chaufferie, convoyeur, transformateurs ; intérieurs simplifiés",
  },
  {
    id: "turbines",
    nom: "La salle des turbines",
    lot: { l: 70, p: 45 },
    depart: { x: 10, z: 19 },
    description: "la cathédrale industrielle en détail, la salle de commande et la salle de méditation énergétique",
  },
  {
    id: "tour",
    nom: "Dans la tour",
    lot: { l: 50, p: 50 },
    depart: { x: 15.5, z: 10.5 },
    description: "l'intérieur de la tour de refroidissement : le bassin asséché, la forêt de piliers, le ciel tout en haut",
  },
];
for (const k of CARTES) {
  k.fouille = vers(k.id, FOUILLE.filter(dans(k)));
  k.eteints = vers(k.id, ETEINTS.filter(dans(k)));
  k.entrees = vers(k.id, ENTREES.filter(dans(k)));
}
// Quelques points propres à la carte de la tour (le bassin est plus riche vu de près)
CARTES[2].fouille.push({ x: -6, z: 6, quoi: "champignons au pied des piliers (bassin humide)" }, { x: 4, z: -9, quoi: "plaques de remplissage tombées : tôle, grillage" });
CARTES[2].eteints.push({ x: 5, z: 4, type: "rampant (sous une plaque tombée)" });

export const FICHE = {
  id: "centrale-thermique",
  nom: "La centrale thermique",
  lieu: "Centrale thermique · Zone industrielle · lointain",
  environnement: "zone industrielle",
  anneau: "lointain",
  danger: 4,
  recit:
    "Elle a produit le courant de toute la région pendant cinquante ans, jour et nuit, pour des frigos qui commandaient le lait et des brosses à dents qui envoyaient des rapports. Un matin, la Compagnie a coupé la chaudière « le temps d'optimiser les coûts », et personne n'a su la rallumer. Les Voltaïques y reviennent comme on revient sur une tombe ; les Charbonniers, eux, viennent pour le charbon.",
  inspiration: "la « Power Plant IM » de Charleroi (tour de refroidissement hyperboloïde, salle des turbines), les centrales au charbon désaffectées d'Europe",
  reperes: [
    "La tour de refroidissement : 41 m de haut, coque fine en béton sur sa couronne de piliers en V, coulures, un pan fissuré, l'échelle à crinoline",
    "Dedans : le bassin asséché, les flaques, la forêt de piliers, le plancher d'échange effondré, le rond de ciel tout en haut",
    "La salle des turbines : verrière à petits bois, pont roulant, deux groupes turbo-alternateurs (vert et bleu), l'alternateur n° 2 éventré sur son cuivre",
    "L'escalier métallique dont la volée du haut pend, arrachée : les passerelles restent hors d'atteinte",
    "La salle de commande : murs de cadrans, pupitres en arc, un voyant rouge qui clignote encore, le tableau « Jours sans panne »",
    "La salle de méditation énergétique des cadres : tapis, poufs, gong, et Watty en lotus (« Respirez. La Compagnie s'occupe du reste. »)",
    "Watty délavé sur le pignon est, « Toujours plein, jamais à plat ! », corrigé à la bombe (« WATTY MENT ! ») ; l'enseigne « Centrale 100 % connectée — Merci de ne pas débrancher »",
    "La cheminée de 62 m à bandes, le convoyeur à charbon rouillé, le wagon-trémie, le poste de transformation et son pylône",
    "Les feux des Charbonniers : un brasero dans la salle, un autre dans la tour",
  ],
  lot: CARTES[0].lot,
  depart: CARTES[0].depart,
  cartes: CARTES,
};

// ---------- Couleurs ----------

const C = {
  brique: 0x9c5c45,
  beton: 0xb3aea3,
  betonSombre: 0x8f8a80,
  coque: 0xc4bfb4,
  acier: 0x5f6e66, // acier peint vert-de-gris, passé
  acierGris: 0x6f736e,
  jaune: 0xb59c4e, // jaune industriel passé (pont roulant, garde-corps)
  vert: 0x5f8878, // groupe n° 1
  bleu: 0x58748e, // groupe n° 2
  cuivre: 0xb87440,
  suie: 0x2e2b28,
  tole: 0x8f9490,
  rouille: PALETTE.rouille,
  rouilleSombre: PALETTE.rouilleSombre,
  grille: 0x3d403e,
  porcelaine: 0x6b4636,
};

// ---------- Matériaux (tous partagés : un matériau = un appel de dessin) ----------

const memo = new Map();
function une(cle, f) {
  if (!memo.has(cle)) memo.set(cle, f());
  return memo.get(cle);
}
const M = {
  mat: () => matiere(0.95, 0),
  tole: () => matiere(0.75, 0.3), // acier peint, rouille
  metal: () => matiere(0.4, 0.7), // acier nu, laiton, cuivre
  beton: () => matiereMonde("beton"),
  brique: () => matiereMonde("brique"),
  carrelage: () => matiereMonde("carrelage"),
  coque: () =>
    une("coque", () => {
      // Pas d'UV « monde » ici : la coque reçoit des UV cylindriques (voir `coque`), sans couture.
      return matiereTexture(texCoque());
    }),
  bardage: () =>
    une("bardage", () => {
      const m = matiereTexture(texBardage(), { roughness: 0.8, metalness: 0.2 });
      m.userData.tuile = 4;
      return m;
    }),
  vitrage: (usure) => {
    const casse = Math.round((0.12 + 0.6 * usure) * 5) / 5;
    return une("vitrage" + casse, () => {
      const m = new THREE.MeshStandardMaterial({ map: texVitrage(casse), vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, roughness: 0.25, metalness: 0.3 });
      m.userData.sansOmbre = true;
      return m;
    });
  },
  atlas: () =>
    une("atlas", () => {
      const m = new THREE.MeshStandardMaterial({ map: texAtlas(), vertexColors: true, transparent: true, alphaTest: 0.03, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      m.userData.sansOmbre = true;
      return m;
    }),
};

// ---------- Textures ----------

function coulures(g, a, n, l, h, lgMin, lgMax, couleur) {
  for (let i = 0; i < n; i++) {
    const x = a() * l;
    const y = a() * h;
    const lg = lgMin + a() * (lgMax - lgMin);
    const w = 1 + a() * 5;
    for (const dy of [0, -h]) {
      const d = g.createLinearGradient(0, y + dy, 0, y + dy + lg);
      d.addColorStop(0, couleur);
      d.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = d;
      g.fillRect(x, y + dy, w, lg);
    }
  }
}

function grain(g, a, n, l, h, force) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = a() < 0.5 ? `rgba(0,0,0,${force})` : `rgba(255,255,255,${force})`;
    g.fillRect(a() * l, a() * h, 1 + a() * 3, 1 + a() * 3);
  }
}

/** La coque de la tour : béton de coffrage glissant (une levée par mètre), longues coulures, lichens. Tuile de 10 m. */
function texCoque() {
  return dessiner("ct-coque", 512, 512, (g) => {
    const a = aleatoire(301);
    g.fillStyle = "#e6e3dc";
    g.fillRect(0, 0, 512, 512);
    for (let x = 0; x < 512; x += 64) {
      g.fillStyle = `rgba(${a() < 0.5 ? "0,0,0" : "255,255,255"},${0.02 + a() * 0.03})`;
      g.fillRect(x, 0, 64, 512);
    }
    for (let y = 0; y < 512; y += 51.2) {
      g.fillStyle = `rgba(0,0,0,${0.03 + a() * 0.04})`;
      g.fillRect(0, y, 512, 51.2);
      g.fillStyle = "rgba(40,36,30,0.18)";
      g.fillRect(0, y, 512, 1.5);
    }
    grain(g, a, 4000, 512, 512, 0.05);
    coulures(g, a, 70, 512, 512, 120, 420, "rgba(52,48,40,0.32)");
    coulures(g, a, 40, 512, 512, 40, 160, "rgba(110,80,50,0.22)");
    taches(g, a, 14, "rgba(90,105,60,0.28)", 10, 40, 512, 512);
    taches(g, a, 8, "rgba(170,140,60,0.25)", 6, 22, 512, 512);
  });
}

/** Le bardage en tôle ondulée : ondes verticales, coulures de rouille, plaques piquées. Tuile de 4 m. */
function texBardage() {
  return dessiner("ct-bardage", 128, 128, (g) => {
    const a = aleatoire(302);
    for (let x = 0; x < 128; x += 4) {
      const d = g.createLinearGradient(x, 0, x + 4, 0);
      d.addColorStop(0, "#d8dad6");
      d.addColorStop(0.5, "#f2f2ee");
      d.addColorStop(1, "#b8bab4");
      g.fillStyle = d;
      g.fillRect(x, 0, 4, 128);
    }
    coulures(g, a, 26, 128, 128, 20, 90, "rgba(150,70,30,0.45)");
    taches(g, a, 10, "rgba(140,70,35,0.4)", 4, 16, 128, 128);
    grain(g, a, 500, 128, 128, 0.05);
  });
}

/** Le vitrage à petits bois : 8 × 7 carreaux par tuile de 4 m ; une part `casse` des carreaux manque. */
function texVitrage(casse) {
  return dessiner("ct-vitrage" + casse, 256, 256, (g) => {
    const a = aleatoire(303 + Math.round(casse * 10));
    g.clearRect(0, 0, 256, 256);
    const lc = 32;
    const hc = 256 / 7;
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 7; j++) {
        const r = a();
        const x = i * lc;
        const y = j * hc;
        if (r < casse) {
          // Carreau cassé : il reste parfois un éclat en pointe dans un coin
          if (a() < 0.5) {
            g.fillStyle = "rgba(150,170,165,0.55)";
            g.beginPath();
            const cx = a() < 0.5 ? x : x + lc;
            const cy = a() < 0.5 ? y : y + hc;
            g.moveTo(cx, cy);
            g.lineTo(cx + (cx === x ? 1 : -1) * lc * (0.3 + a() * 0.5), cy);
            g.lineTo(cx, cy + (cy === y ? 1 : -1) * hc * (0.3 + a() * 0.5));
            g.fill();
          }
        } else if (r < casse + 0.05) {
          g.fillStyle = "rgba(110,92,68,0.97)"; // planche clouée
          g.fillRect(x, y, lc, hc);
        } else {
          const v = 140 + Math.floor(a() * 40);
          const d = g.createLinearGradient(0, y, 0, y + hc);
          d.addColorStop(0, `rgba(${v},${v + 18},${v + 14},${0.4 + a() * 0.2})`);
          d.addColorStop(1, `rgba(${v - 40},${v - 30},${v - 35},${0.6 + a() * 0.25})`);
          g.fillStyle = d;
          g.fillRect(x, y, lc, hc);
        }
      }
    g.fillStyle = "rgba(46,50,48,1)";
    for (let i = 0; i <= 8; i++) g.fillRect(i * lc - 1.5, 0, 3, 256);
    for (let j = 0; j <= 7; j++) g.fillRect(0, j * hc - 1.5, 256, 3);
  });
}

// L'atlas des peintures : la fresque de Watty, les enseignes, les cadrans, les graffitis. Une seule texture, un seul
// appel de dessin pour tout ce qui est peint ou imprimé dans la centrale.
const ATLAS = {
  watty: [0, 0, 512, 512],
  connectee: [512, 0, 512, 160],
  meditation: [512, 160, 512, 160],
  cadrans: [512, 320, 512, 192],
  frise: [0, 512, 1024, 128],
  pupitre: [0, 640, 256, 128],
  danger: [256, 640, 128, 128],
  criePas: [384, 640, 320, 128],
  joursSansPanne: [704, 640, 320, 128],
  respirez: [0, 768, 256, 256],
  plaque: [256, 768, 256, 128],
};
const POLICE = '"Arial Black", "Helvetica Neue", Impact, sans-serif';
const FEUTRE = '"Marker Felt", "Chalkboard SE", "Comic Sans MS", cursive';

function texte(g, t, x, y, largeurMax, taille, police, couleur, poids = "900") {
  g.font = `${poids} ${taille}px ${police}`;
  const w = g.measureText(t).width;
  if (w > largeurMax) g.font = `${poids} ${(taille * largeurMax) / w}px ${police}`;
  g.fillStyle = couleur;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(t, x, y);
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

/** La peinture s'en va : trous dans la couche (on voit le support derrière). */
function eroder(g, a, [x, y, w, h], n, rMin, rMax, force = 1, basPlus = 0) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < n; i++) {
    const px = x + a() * w;
    const py = y + Math.pow(a(), 1 - basPlus * 0.6) * h;
    const r = rMin + a() * (rMax - rMin);
    const d = g.createRadialGradient(px, py, 0, px, py, r);
    d.addColorStop(0, `rgba(0,0,0,${force})`);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(px - r, py - r, r * 2, r * 2);
  }
  g.restore();
}

/** La couleur passe au soleil : voile clair, taches. */
function delaver(g, a, [x, y, w, h], force = 0.3) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.fillStyle = `rgba(236,230,214,${force})`;
  g.fillRect(x, y, w, h);
  taches(g, a, 10, `rgba(236,230,214,${force})`, 10, 50, w, h);
  g.restore();
  g.save();
  g.translate(x, y);
  g.beginPath();
  g.rect(0, 0, w, h);
  g.clip();
  coulures(g, a, 12, w, h, h * 0.2, h * 0.8, "rgba(110,70,40,0.25)");
  g.restore();
}

/** Watty, la pile souriante : clin d'œil, éclair rouge sur le ventre, une prise à la main, chaussures rouges. */
function dessinerWatty(g, cx, cy, s, yeuxFermes = false) {
  const w = s * 0.56;
  const h = s;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const encre = "#1f2526";
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = encre;
  // Jambes et chaussures rouges
  for (const sx of [-1, 1]) {
    g.lineWidth = s * 0.06;
    g.beginPath();
    g.moveTo(cx + sx * w * 0.22, y + h - 2);
    g.lineTo(cx + sx * w * 0.3, y + h + s * 0.2);
    g.stroke();
    g.fillStyle = "#c8362b";
    g.beginPath();
    g.ellipse(cx + sx * w * 0.38, y + h + s * 0.23, s * 0.11, s * 0.055, 0, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = s * 0.02;
    g.stroke();
  }
  // Bras gauche : le salut
  g.lineWidth = s * 0.06;
  g.beginPath();
  g.moveTo(x + 2, y + h * 0.5);
  g.quadraticCurveTo(x - s * 0.2, y + h * 0.45, x - s * 0.22, y + h * 0.2);
  g.stroke();
  g.fillStyle = "#f2ead6";
  g.beginPath();
  g.arc(x - s * 0.22, y + h * 0.17, s * 0.065, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = s * 0.02;
  g.stroke();
  // Bras droit : la prise
  g.lineWidth = s * 0.06;
  g.beginPath();
  g.moveTo(x + w - 2, y + h * 0.55);
  g.quadraticCurveTo(x + w + s * 0.15, y + h * 0.62, x + w + s * 0.2, y + h * 0.5);
  g.stroke();
  const px = x + w + s * 0.2;
  const py = y + h * 0.47;
  g.fillStyle = "#c79a3b";
  g.fillRect(px - s * 0.045, py - s * 0.21, s * 0.025, s * 0.09);
  g.fillRect(px + s * 0.02, py - s * 0.21, s * 0.025, s * 0.09);
  g.fillStyle = "#e9dfc6";
  g.fillRect(px - s * 0.07, py - s * 0.13, s * 0.14, s * 0.15);
  g.lineWidth = s * 0.02;
  g.strokeRect(px - s * 0.07, py - s * 0.13, s * 0.14, s * 0.15);
  g.lineWidth = s * 0.025;
  g.beginPath();
  g.moveTo(px, py + s * 0.02);
  g.bezierCurveTo(px + s * 0.15, py + s * 0.3, px - s * 0.05, py + s * 0.5, px + s * 0.2, py + s * 0.62);
  g.stroke();
  // Le corps
  rectArrondi(g, x, y, w, h, s * 0.1);
  g.fillStyle = "#2f6f73";
  g.fill();
  g.save();
  rectArrondi(g, x, y, w, h, s * 0.1);
  g.clip();
  g.fillStyle = "#e9dfc6";
  g.fillRect(x, y, w, h * 0.2);
  g.fillStyle = encre;
  g.fillRect(x, y + h * 0.2 - s * 0.012, w, s * 0.024);
  g.fillStyle = "rgba(255,255,255,0.16)";
  g.fillRect(x + w * 0.1, y + h * 0.26, w * 0.1, h * 0.64);
  g.restore();
  rectArrondi(g, x, y, w, h, s * 0.1);
  g.lineWidth = s * 0.035;
  g.stroke();
  // La borne « + »
  g.fillStyle = "#c79a3b";
  g.fillRect(cx - w * 0.17, y - s * 0.08, w * 0.34, s * 0.09);
  g.lineWidth = s * 0.022;
  g.strokeRect(cx - w * 0.17, y - s * 0.08, w * 0.34, s * 0.09);
  texte(g, "+", cx, y + h * 0.1, w, s * 0.15, POLICE, "#c8362b");
  // Les yeux : un clin d'œil (ou les deux fermés, en méditation)
  const ey = y + h * 0.34;
  g.lineWidth = s * 0.03;
  if (yeuxFermes) {
    for (const sx of [-1, 1]) {
      g.beginPath();
      g.arc(cx + sx * w * 0.2, ey - s * 0.01, s * 0.05, Math.PI * 0.15, Math.PI * 0.85);
      g.stroke();
    }
  } else {
    g.fillStyle = "#f6f0e0";
    g.beginPath();
    g.ellipse(cx - w * 0.2, ey, s * 0.06, s * 0.075, 0, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = s * 0.018;
    g.stroke();
    g.fillStyle = encre;
    g.beginPath();
    g.arc(cx - w * 0.18, ey + s * 0.012, s * 0.03, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = s * 0.03;
    g.beginPath();
    g.arc(cx + w * 0.2, ey + s * 0.03, s * 0.055, Math.PI * 1.1, Math.PI * 1.9);
    g.stroke();
  }
  // Le sourire
  g.lineWidth = s * 0.035;
  g.beginPath();
  g.arc(cx, y + h * 0.42, w * 0.27, Math.PI * 0.15, Math.PI * 0.85);
  g.stroke();
  // L'éclair rouge sur le ventre
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
  g.lineWidth = s * 0.018;
  g.stroke();
  g.restore();
}

function texAtlas() {
  return dessiner(
    "ct-atlas",
    1024,
    1024,
    (g) => {
      const a = aleatoire(404);
      g.clearRect(0, 0, 1024, 1024);

      // --- La fresque de Watty (peinte sur la brique du pignon : le fond reste transparent) ---
      {
        const [x0, y0] = ATLAS.watty;
        g.fillStyle = "#e9dfc6";
        g.fillRect(x0 + 14, y0 + 14, 484, 484);
        // Rayons « soleil levant » derrière Watty
        g.save();
        g.beginPath();
        g.rect(x0 + 14, y0 + 100, 484, 312);
        g.clip();
        g.fillStyle = "rgba(199,154,59,0.55)";
        for (let k = 0; k < 18; k++) {
          const t0 = (k / 18) * Math.PI * 2;
          g.beginPath();
          g.moveTo(x0 + 256, y0 + 270);
          g.arc(x0 + 256, y0 + 270, 420, t0, t0 + Math.PI / 18);
          g.closePath();
          g.fill();
        }
        g.restore();
        g.fillStyle = "#c8362b";
        g.fillRect(x0 + 14, y0 + 14, 484, 88);
        g.fillRect(x0 + 14, y0 + 412, 484, 86);
        texte(g, "COMPAGNIE D'ÉLECTRICITÉ", x0 + 256, y0 + 60, 450, 50, POLICE, "#e9dfc6");
        texte(g, "TOUJOURS PLEIN,", x0 + 256, y0 + 436, 440, 34, POLICE, "#e9dfc6");
        texte(g, "JAMAIS À PLAT !", x0 + 256, y0 + 474, 440, 34, POLICE, "#e9dfc6");
        dessinerWatty(g, x0 + 236, y0 + 245, 210);
        // Le temps, la pluie : la peinture part par plaques, surtout en bas
        eroder(g, a, [x0, y0, 512, 512], 170, 6, 34, 1, 0.8);
        eroder(g, a, [x0, y0, 512, 512], 400, 2, 9, 1);
        g.save();
        g.translate(x0, y0);
        coulures(g, a, 30, 512, 512, 60, 220, "rgba(80,60,45,0.25)");
        g.restore();
        // La correction des survivants, à la bombe
        g.save();
        g.translate(x0 + 330, y0 + 330);
        g.rotate(-0.16);
        g.shadowColor = "rgba(0,0,0,0.6)";
        g.shadowBlur = 4;
        texte(g, "WATTY MENT !", 0, 0, 330, 58, FEUTRE, "rgba(22,22,22,0.92)", "700");
        g.restore();
      }

      // --- L'enseigne « Centrale 100 % connectée » ---
      {
        const r = ATLAS.connectee;
        const [x0, y0, w, h] = r;
        g.fillStyle = "#e9dfc6";
        g.fillRect(x0, y0, w, h);
        g.fillStyle = "#c8362b";
        g.fillRect(x0, y0, 140, h);
        g.fillRect(x0, y0 + h - 12, w, 12);
        g.strokeStyle = "#e9dfc6";
        g.lineWidth = 7;
        g.beginPath();
        g.arc(x0 + 70, y0 + 74, 44, 0, Math.PI * 2);
        g.stroke();
        g.fillStyle = "#e9dfc6";
        g.beginPath();
        g.moveTo(x0 + 78, y0 + 36);
        g.lineTo(x0 + 52, y0 + 80);
        g.lineTo(x0 + 70, y0 + 80);
        g.lineTo(x0 + 60, y0 + 114);
        g.lineTo(x0 + 90, y0 + 66);
        g.lineTo(x0 + 72, y0 + 66);
        g.closePath();
        g.fill();
        texte(g, "CENTRALE 100 % CONNECTÉE", x0 + 326, y0 + 54, 350, 40, POLICE, "#3b2a20");
        texte(g, "Merci de ne pas débrancher.", x0 + 326, y0 + 106, 340, 30, '"Georgia", serif', "#3b2a20", "italic 700");
        delaver(g, a, r, 0.32);
        eroder(g, a, r, 40, 3, 12, 0.6);
      }

      // --- « Salle de méditation énergétique » ---
      {
        const r = ATLAS.meditation;
        const [x0, y0, w, h] = r;
        g.fillStyle = "#2f6f73";
        g.fillRect(x0, y0, w, h);
        g.strokeStyle = "#e9dfc6";
        g.lineWidth = 4;
        g.strokeRect(x0 + 10, y0 + 10, w - 20, h - 20);
        texte(g, "SALLE DE MÉDITATION", x0 + w / 2, y0 + 46, 460, 40, POLICE, "#e9dfc6");
        texte(g, "ÉNERGÉTIQUE", x0 + w / 2, y0 + 88, 460, 40, POLICE, "#c79a3b");
        texte(g, "Réservée aux cadres · Le silence, c'est déjà des économies", x0 + w / 2, y0 + 128, 460, 20, '"Georgia", serif', "#e9dfc6", "italic 400");
        delaver(g, a, r, 0.22);
      }

      // --- Le mur de cadrans ---
      {
        const r = ATLAS.cadrans;
        const [x0, y0, w, h] = r;
        g.fillStyle = "#56645b";
        g.fillRect(x0, y0, w, h);
        for (let i = 0; i < 4; i++) {
          g.strokeStyle = "rgba(20,25,22,0.6)";
          g.lineWidth = 2;
          g.strokeRect(x0 + i * 128 + 2, y0 + 2, 124, h - 4);
        }
        // Le synoptique : le réseau, en lignes colorées
        g.lineWidth = 3;
        g.strokeStyle = "#c9a54a";
        g.beginPath();
        g.moveTo(x0 + 10, y0 + 172);
        g.lineTo(x0 + 500, y0 + 172);
        g.stroke();
        for (let i = 0; i < 8; i++) {
          g.beginPath();
          g.moveTo(x0 + 30 + i * 62, y0 + 172);
          g.lineTo(x0 + 30 + i * 62, y0 + 150);
          g.stroke();
          g.fillStyle = a() < 0.2 ? "#a8463a" : "#7aa07a";
          g.fillRect(x0 + 24 + i * 62, y0 + 142, 12, 10);
        }
        for (let i = 0; i < 8; i++)
          for (let j = 0; j < 2; j++) {
            const cx = x0 + 32 + i * 64;
            const cy = y0 + 36 + j * 64;
            const t = a();
            if (t < 0.65) {
              g.fillStyle = "#e8e2d0";
              g.beginPath();
              g.arc(cx, cy, 24, 0, Math.PI * 2);
              g.fill();
              g.strokeStyle = "#222";
              g.lineWidth = 2;
              g.stroke();
              g.strokeStyle = "#a8463a";
              g.lineWidth = 4;
              g.beginPath();
              g.arc(cx, cy, 19, -0.5, 0.2);
              g.stroke();
              g.strokeStyle = "#333";
              g.lineWidth = 1;
              for (let k = 0; k < 9; k++) {
                const an = Math.PI * 0.8 + (k / 8) * Math.PI * 1.4;
                g.beginPath();
                g.moveTo(cx + Math.cos(an) * 16, cy + Math.sin(an) * 16);
                g.lineTo(cx + Math.cos(an) * 21, cy + Math.sin(an) * 21);
                g.stroke();
              }
              const an = Math.PI * 0.8 + a() * Math.PI * 0.4; // les aiguilles sont retombées à zéro
              g.strokeStyle = "#111";
              g.lineWidth = 2;
              g.beginPath();
              g.moveTo(cx, cy);
              g.lineTo(cx + Math.cos(an) * 18, cy + Math.sin(an) * 18);
              g.stroke();
              if (a() < 0.3) {
                g.strokeStyle = "rgba(255,255,255,0.8)";
                g.lineWidth = 1;
                g.beginPath();
                g.moveTo(cx - 14, cy - 16);
                g.lineTo(cx + 3, cy + 2);
                g.lineTo(cx + 15, cy - 6);
                g.stroke();
              }
            } else if (t < 0.85) {
              g.fillStyle = "#e8e2d0";
              g.fillRect(cx - 24, cy - 16, 48, 32);
              g.strokeStyle = "#222";
              g.strokeRect(cx - 24, cy - 16, 48, 32);
              g.beginPath();
              g.moveTo(cx - 18, cy + 10);
              g.lineTo(cx - 10 + a() * 20, cy - 10);
              g.stroke();
            } else {
              for (let k = 0; k < 4; k++) {
                g.fillStyle = "#2a2e2b";
                g.fillRect(cx - 22 + k * 12, cy - 12, 8, 24);
                g.fillStyle = "#cfc8b4";
                g.fillRect(cx - 21 + k * 12, cy - (a() < 0.5 ? 10 : 0), 6, 10);
              }
            }
            g.fillStyle = "#d8d0bb";
            g.fillRect(cx - 14, cy + 26, 28, 6);
          }
        delaver(g, a, r, 0.12);
      }

      // --- La frise du fronton (lettres peintes sur la brique) ---
      {
        const r = ATLAS.frise;
        const [x0, y0, w, h] = r;
        g.save();
        g.beginPath();
        g.rect(x0, y0, w, h);
        g.clip();
        texte(g, "COMPAGNIE D'ÉLECTRICITÉ", x0 + w / 2, y0 + h / 2 + 4, 1000, 110, POLICE, "#ece4cf");
        g.restore();
        eroder(g, a, r, 60, 4, 18, 0.9);
        // Deux lettres tombées
        g.save();
        g.globalCompositeOperation = "destination-out";
        g.fillRect(x0 + 300, y0, 40, h);
        g.fillRect(x0 + 770, y0, 34, h);
        g.restore();
      }

      // --- Le dessus d'un pupitre ---
      {
        const r = ATLAS.pupitre;
        const [x0, y0, w, h] = r;
        g.fillStyle = "#3f4943";
        g.fillRect(x0, y0, w, h);
        const couleurs = ["#6f9a64", "#c9a03b", "#d9d2c0", "#6f9a64", "#c9a03b", "#a8463a"];
        for (let j = 0; j < 3; j++)
          for (let i = 0; i < 10; i++) {
            g.fillStyle = couleurs[Math.floor(a() * couleurs.length)];
            g.beginPath();
            g.arc(x0 + 16 + i * 14, y0 + 20 + j * 18, 4.5, 0, Math.PI * 2);
            g.fill();
          }
        for (let i = 0; i < 2; i++) {
          g.fillStyle = "#e8e2d0";
          g.beginPath();
          g.arc(x0 + 180 + i * 44, y0 + 38, 18, 0, Math.PI * 2);
          g.fill();
          g.strokeStyle = "#111";
          g.lineWidth = 2;
          g.beginPath();
          g.moveTo(x0 + 180 + i * 44, y0 + 38);
          g.lineTo(x0 + 168 + i * 44, y0 + 50);
          g.stroke();
        }
        for (let i = 0; i < 12; i++) {
          g.fillStyle = "#1e2220";
          g.fillRect(x0 + 12 + i * 19, y0 + 82, 10, 26);
          g.fillStyle = "#bdb6a2";
          g.fillRect(x0 + 13 + i * 19, y0 + (a() < 0.5 ? 84 : 95), 8, 11);
        }
        delaver(g, a, r, 0.1);
      }

      // --- Panneau « Danger de mort » ---
      {
        const [x0, y0, w, h] = ATLAS.danger;
        g.fillStyle = "#e6e1d3";
        g.fillRect(x0, y0, w, h);
        g.fillStyle = "#d4b13c";
        g.strokeStyle = "#1b1b1b";
        g.lineWidth = 5;
        g.beginPath();
        g.moveTo(x0 + 64, y0 + 10);
        g.lineTo(x0 + 116, y0 + 96);
        g.lineTo(x0 + 12, y0 + 96);
        g.closePath();
        g.fill();
        g.stroke();
        g.fillStyle = "#1b1b1b";
        g.beginPath();
        g.moveTo(x0 + 70, y0 + 34);
        g.lineTo(x0 + 54, y0 + 66);
        g.lineTo(x0 + 66, y0 + 66);
        g.lineTo(x0 + 58, y0 + 90);
        g.lineTo(x0 + 78, y0 + 58);
        g.lineTo(x0 + 66, y0 + 58);
        g.closePath();
        g.fill();
        texte(g, "DANGER DE MORT", x0 + 64, y0 + 113, 118, 15, POLICE, "#a8362b");
        delaver(g, a, ATLAS.danger, 0.15);
      }

      // --- Graffiti dans la tour : « Crie pas. » ---
      {
        const [x0, y0, w, h] = ATLAS.criePas;
        g.save();
        g.translate(x0 + w / 2, y0 + h / 2);
        g.rotate(-0.05);
        g.shadowColor = "rgba(0,0,0,0.5)";
        g.shadowBlur = 3;
        texte(g, "Crie pas.", 0, -14, w - 20, 64, FEUTRE, "rgba(24,24,24,0.9)", "700");
        texte(g, "ça résonne", 30, 38, w - 80, 30, FEUTRE, "rgba(24,24,24,0.85)", "700");
        g.restore();
      }

      // --- Le tableau « Jours sans panne », arrêté pour toujours ---
      {
        const r = ATLAS.joursSansPanne;
        const [x0, y0, w, h] = r;
        g.fillStyle = "#e9dfc6";
        g.fillRect(x0, y0, w, h);
        g.fillStyle = "#c8362b";
        g.fillRect(x0, y0, w, 32);
        texte(g, "JOURS SANS PANNE", x0 + w / 2, y0 + 17, w - 20, 24, POLICE, "#e9dfc6");
        const chiffres = "1427";
        for (let i = 0; i < 4; i++) {
          g.fillStyle = "#f6f2e6";
          g.fillRect(x0 + 52 + i * 56, y0 + 40, 46, 56);
          g.strokeStyle = "#3b2a20";
          g.lineWidth = 2;
          g.strokeRect(x0 + 52 + i * 56, y0 + 40, 46, 56);
          texte(g, chiffres[i], x0 + 75 + i * 56, y0 + 70, 40, 46, POLICE, "#2a2420");
        }
        texte(g, "Merci à tous ! — La Direction", x0 + w / 2, y0 + 112, w - 30, 16, '"Georgia", serif', "#3b2a20", "italic 400");
        delaver(g, a, r, 0.25);
      }

      // --- L'affiche de méditation : Watty en lotus ---
      {
        const r = ATLAS.respirez;
        const [x0, y0, w, h] = r;
        g.fillStyle = "#3d7f80";
        g.fillRect(x0, y0, w, h);
        g.fillStyle = "rgba(233,223,198,0.35)";
        g.beginPath();
        g.arc(x0 + 128, y0 + 132, 86, 0, Math.PI * 2);
        g.fill();
        dessinerWatty(g, x0 + 122, y0 + 122, 100, true);
        texte(g, "RESPIREZ.", x0 + 128, y0 + 28, 220, 32, POLICE, "#e9dfc6");
        texte(g, "La Compagnie s'occupe du reste.", x0 + 128, y0 + 232, 230, 17, '"Georgia", serif', "#e9dfc6", "italic 700");
        delaver(g, a, r, 0.25);
        eroder(g, a, r, 14, 4, 14, 0.8);
      }

      // --- La plaque d'un groupe turbo-alternateur ---
      {
        const r = ATLAS.plaque;
        const [x0, y0, w, h] = r;
        g.fillStyle = "#b8a774";
        g.fillRect(x0, y0, w, h);
        g.strokeStyle = "#3b2f1c";
        g.lineWidth = 4;
        g.strokeRect(x0 + 6, y0 + 6, w - 12, h - 12);
        texte(g, "GROUPE TURBO-ALTERNATEUR", x0 + w / 2, y0 + 34, w - 30, 18, POLICE, "#3b2f1c");
        texte(g, "125 MW · 3 000 tr/min", x0 + w / 2, y0 + 66, w - 30, 22, '"Georgia", serif', "#3b2f1c", "700");
        texte(g, "Compagnie d'électricité", x0 + w / 2, y0 + 98, w - 30, 16, '"Georgia", serif', "#3b2f1c", "italic 400");
      }
    },
    false,
  );
}

// ---------- Petits outils de géométrie ----------

const TAU = Math.PI * 2;
const PI = Math.PI;

/** Un quadrilatère (4 points [x, y, z], dans l'ordre inverse des aiguilles d'une montre vu de face). */
function quad(c, mat, couleur, p, uv = [[0, 0], [1, 0], [1, 1], [0, 1]], recto = true, verso = false) {
  const pos = [];
  const u = [];
  if (recto) {
    for (const k of [0, 1, 2, 0, 2, 3]) {
      pos.push(...p[k]);
      u.push(...uv[k]);
    }
  }
  if (verso) {
    for (const k of [0, 2, 1, 0, 3, 2]) {
      pos.push(...p[k]);
      u.push(...uv[k]);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(u, 2));
  g.computeVertexNormals();
  c.poser(g, mat, couleur, {}, { crasse: false, nuance: 0.03 });
  g.dispose();
}

/** Un triangle visible des deux côtés. */
function triangle2(c, mat, couleur, p) {
  const pos = [...p[0], ...p[1], ...p[2], ...p[0], ...p[2], ...p[1]];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  c.poser(g, mat, couleur, {}, { crasse: false, nuance: 0.05 });
  g.dispose();
}

/** Un panneau peint de l'atlas, posé à plat contre une face (le plan regarde +z, tourné de `ry`). */
function panneau(c, region, x, y, z, l, h, ry = 0, rx = 0) {
  const [px, py, pw, ph] = ATLAS[region];
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / 1024, 1 - (py + (1 - uv.getY(i)) * ph) / 1024);
  c.poser(g, M.atlas(), 0xffffff, { x, y, z, ry, rx }, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Un vitrage à petits bois (une seule face, visible des deux côtés), qui regarde +z tourné de `ry`. */
function vitre(c, usure, x, y, z, l, h, ry = 0, rx = 0) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  const du = Math.floor(c.hasard() * 8) / 8;
  const dv = Math.floor(c.hasard() * 7) / 7;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, du + (uv.getX(i) * l) / 4, dv + (uv.getY(i) * h) / 4);
  c.poser(g, M.vitrage(usure), 0xffffff, { x, y, z, ry, rx }, { crasse: false, nuance: 0.05 });
  g.dispose();
}

/** Un cylindre couché le long de x (de x1 à x2), de rayon r, centré en (y, z). `demi` : seulement la moitié du haut. */
function cylX(c, x1, x2, y, z, r, couleur, mat, cotes = 12, demi = false) {
  const g = new THREE.CylinderGeometry(r, r, Math.abs(x2 - x1), cotes, 1, false, 0, demi ? PI : TAU);
  c.poser(g, mat, couleur, { x: (x1 + x2) / 2, y, z, rz: PI / 2 });
  g.dispose();
}

/** Un cylindre debout. */
function cylY(c, x, z, y1, y2, r1, r2, couleur, mat, cotes = 8, ouvert = false) {
  const g = new THREE.CylinderGeometry(r2, r1, y2 - y1, cotes, 1, ouvert);
  c.poser(g, mat, couleur, { x, y: (y1 + y2) / 2, z });
  g.dispose();
}

/** Un tuyau qui suit une ligne brisée, avec des coudes et des brides. */
function tuyau(c, pts, r, couleur, mat = M.tole(), cotes = 8) {
  for (let i = 0; i < pts.length - 1; i++) {
    c.tube(pts[i], pts[i + 1], r, couleur, mat, cotes);
    const a = new THREE.Vector3(...pts[i]);
    const b = new THREE.Vector3(...pts[i + 1]);
    const d = b.clone().sub(a).normalize();
    if (b.distanceTo(a) > 1.2) {
      const p = a.clone().addScaledVector(d, 0.35);
      c.tube(p.toArray(), p.clone().addScaledVector(d, 0.1).toArray(), r * 1.3, couleur, mat, cotes);
    }
    if (i > 0) {
      const g = new THREE.IcosahedronGeometry(r * 1.05, 0);
      c.poser(g, mat, couleur, { x: pts[i][0], y: pts[i][1], z: pts[i][2] });
      g.dispose();
    }
  }
}

/** Les quatre côtés d'un rectangle comme obstacles. */
function obstacleRect(b, x1, z1, x2, z2, nature) {
  b.obstacle(x1, z1, x2, z1, nature);
  b.obstacle(x2, z1, x2, z2, nature);
  b.obstacle(x2, z2, x1, z2, nature);
  b.obstacle(x1, z2, x1, z1, nature);
}

/** Un poteau en I (âme et deux ailes), de y0 à y1 ; `ry` oriente les ailes. */
function poteauI(c, x, z, y0, y1, s, couleur, ry = 0, mat = M.tole()) {
  c.repere({ x, z, ry }, () => {
    const h = y1 - y0;
    const ym = (y0 + y1) / 2;
    c.boite(s * 0.14, h, s, couleur, { y: ym }, mat);
    c.boite(s * 0.75, h, s * 0.1, couleur, { y: ym, z: s / 2 }, mat);
    c.boite(s * 0.75, h, s * 0.1, couleur, { y: ym, z: -s / 2 }, mat);
  });
}

/** Un garde-corps le long d'une ligne brisée [[x, z], …] posé à y0 : montants, lisse, sous-lisse. */
function gardeCorps(c, pts, y0, couleur = C.jaune, h = 1.1, pas = 1.6) {
  const mat = M.tole();
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, z1] = pts[i];
    const [x2, z2] = pts[i + 1];
    const L = Math.hypot(x2 - x1, z2 - z1);
    const n = Math.max(1, Math.ceil(L / pas));
    for (let k = i === 0 ? 0 : 1; k <= n; k++) {
      const t = k / n;
      c.poutre([x1 + (x2 - x1) * t, y0, z1 + (z2 - z1) * t], [x1 + (x2 - x1) * t, y0 + h, z1 + (z2 - z1) * t], 0.05, couleur, mat);
    }
    c.poutre([x1, y0 + h, z1], [x2, y0 + h, z2], 0.055, couleur, mat);
    c.poutre([x1, y0 + h * 0.5, z1], [x2, y0 + h * 0.5, z2], 0.04, couleur, mat);
  }
}

/** Un escalier métallique droit qui monte selon +x local (repère x, z, ry), de y0 à y1, de largeur l. */
function escalier(c, x, z, ry, y0, y1, l, couleur = C.acier) {
  const n = Math.round((y1 - y0) / 0.2);
  const g = 0.26;
  const L = n * g;
  const mat = M.tole();
  c.repere({ x, z, ry }, () => {
    for (const s of [-1, 1]) {
      c.poutre([0, y0, (s * l) / 2], [L, y1, (s * l) / 2], 0.12, couleur, mat);
      c.poutre([0, y0 + 0.95, (s * l) / 2], [L, y1 + 0.95, (s * l) / 2], 0.05, C.jaune, mat);
      for (let k = 0; k <= n; k += 4) c.poutre([k * g, y0 + k * 0.2, (s * l) / 2], [k * g, y0 + k * 0.2 + 0.95, (s * l) / 2], 0.045, C.jaune, mat);
    }
    for (let k = 1; k <= n; k++) c.boite(0.24, 0.035, l - 0.1, C.grille, { x: k * g - 0.12, y: y0 + k * 0.2 - 0.02 }, mat, { nuance: 0.03 });
  });
}

/** Une échelle à crinoline le long d'un chemin de points [x, y, z] ; `d` = [dx, dz] : la direction qui s'écarte du mur. */
function echelle(c, chemin, d, couleur, mat, crinolineDepuis = 2.6, pas = 0.45, pasArceau = 1.5) {
  const t = [-d[1], d[0]];
  const ecart = 0.2;
  const P = (p, s, e = 0) => [p[0] + t[0] * 0.22 * s + d[0] * (ecart + e), p[1], p[2] + t[1] * 0.22 * s + d[1] * (ecart + e)];
  for (let i = 0; i < chemin.length - 1; i++) {
    const a = chemin[i];
    const b = chemin[i + 1];
    for (const s of [-1, 1]) c.poutre(P(a, s), P(b, s), 0.06, couleur, mat);
    const n = Math.max(1, Math.round((b[1] - a[1]) / pas));
    for (let k = 0; k < n; k++) {
      const f = k / n;
      const p = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
      c.poutre(P(p, -1), P(p, 1), 0.035, couleur, mat);
    }
    // La crinoline : des arceaux tous les 1,5 m, reliés par trois barres
    const m = Math.max(1, Math.round((b[1] - a[1]) / pasArceau));
    for (let k = 0; k < m; k++) {
      const f = k / m;
      const p = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
      if (p[1] < crinolineDepuis) continue;
      const centre = [p[0] + d[0] * (ecart + 0.36), p[1], p[2] + d[1] * (ecart + 0.36)];
      let prec = null;
      for (let q = 0; q <= 4; q++) {
        const an = -PI / 2 + (q / 4) * PI;
        const v = [Math.cos(an), Math.sin(an)]; // dans le repère (d, t)
        const pt = [centre[0] + (d[0] * v[0] + t[0] * v[1]) * 0.38, p[1], centre[2] + (d[1] * v[0] + t[1] * v[1]) * 0.38];
        if (prec) c.poutre(prec, pt, 0.04, couleur, mat);
        prec = pt;
      }
    }
    if (b[1] > crinolineDepuis)
      for (const s of [-1, 0, 1]) {
        const off = (p) => [p[0] + d[0] * (ecart + 0.36 + (s === 0 ? 0.38 : 0)) + t[0] * (s * 0.38), p[1], p[2] + d[1] * (ecart + 0.36 + (s === 0 ? 0.38 : 0)) + t[1] * (s * 0.38)];
        const a2 = a[1] < crinolineDepuis ? [a[0] + (b[0] - a[0]) * ((crinolineDepuis - a[1]) / (b[1] - a[1])), crinolineDepuis, a[2] + (b[2] - a[2]) * ((crinolineDepuis - a[1]) / (b[1] - a[1]))] : a;
        c.poutre(off(a2), off(b), 0.035, couleur, mat);
      }
  }
}

/** Un brasero de Charbonniers : demi-fût percé, braises, bûches, un peu de suie au sol. */
function brasero(ctx, x, z) {
  const c = ctx.c;
  cylY(c, x, z, 0, 0.7, 0.32, 0.34, C.rouilleSombre, M.tole(), 8, true);
  cylY(c, x, z, 0.12, 0.16, 0.3, 0.3, C.suie, M.mat(), 8);
  for (let i = 0; i < 7; i++) c.boite(0.12, 0.08, 0.1, i % 2 ? 0xff7a2a : 0xd2451c, { x: x + c.entre(-0.18, 0.18), y: 0.62, z: z + c.entre(-0.18, 0.18), ry: c.hasard() * 3 }, M.mat(), { crasse: false });
  for (let i = 0; i < 3; i++) c.boite(0.7, 0.12, 0.12, PALETTE.boisSombre, { x: x + 0.7 + i * 0.05, y: 0.06 + i * 0.12, z: z + 0.3 - i * 0.2, ry: c.hasard() }, M.mat());
  c.boite(1.8, 0.01, 1.8, C.suie, { x, y: 0.1, z, ry: 0.4 }, M.mat(), { crasse: false });
  c.boite(0.7, 0.15, 1.9, 0x5a4a38, { x: x - 1.3, y: 0.18, z: z + 0.4, ry: 0.3 }, M.mat()); // couchage
  c.boite(0.5, 0.4, 0.4, PALETTE.bois, { x: x + 0.4, y: 0.3, z: z - 1.0, ry: 0.5 }, M.mat()); // caisse
  ctx.b.lumiere(x, 1.1, z, 0xff8a3d, 9, 13, "feu de Charbonniers (brasero)");
}

/** Un baril de 200 L, debout ou couché. */
function baril(c, x, z, couleur, couche = false, ry = 0) {
  const g = new THREE.CylinderGeometry(0.29, 0.29, 0.88, 8);
  if (couche) c.poser(g, M.tole(), couleur, { x, y: 0.38, z, rz: PI / 2, ry });
  else c.poser(g, M.tole(), couleur, { x, y: 0.53, z });
  g.dispose();
}

// ---------- Le sol du site ----------

function sol(ctx, x1, z1, x2, z2) {
  const { c, u } = ctx;
  const beton = M.beton();
  const pas = 6;
  const evite = [
    [SALLE.x0, SALLE.z0, SALLE.x1, SALLE.z1],
    [ANNEXE.x0, ANNEXE.z0, ANNEXE.x1, ANNEXE.z1],
    [CHAUFFERIE.x0, CHAUFFERIE.z0, CHAUFFERIE.x1, CHAUFFERIE.z1],
  ];
  const pts = [];
  for (let x = x1; x < x2 - 0.1; x += pas)
    for (let z = z1; z < z2 - 0.1; z += pas) {
      const xa = x;
      const xb = Math.min(x2, x + pas);
      const za = z;
      const zb = Math.min(z2, z + pas);
      if (evite.some(([a1, b1, a2, b2]) => xa >= a1 && xb <= a2 && za >= b1 && zb <= b2)) continue;
      const cx = (xa + xb) / 2;
      const cz = (za + zb) / 2;
      if (Math.hypot(cx - TOUR.x, cz - TOUR.z) < 13.5) continue;
      if (c.hasard() < 0.1 + 0.18 * u) {
        pts.push([cx + c.entre(-2, 2), cz + c.entre(-2, 2)]);
        continue; // dalle disparue : l'herbe a repris
      }
      c.pave(xa + 0.04, -0.02, za + 0.04, xb - 0.04, 0.04, zb - 0.04, c.hasard() < 0.2 ? 0x8e8b82 : 0xa29e94, beton, { nuance: 0.06, crasse: false });
      if (c.hasard() < 0.15 + 0.3 * u) pts.push(c.hasard() < 0.5 ? [xa + 0.05, za + c.entre(0, pas)] : [xa + c.entre(0, pas), za + 0.05]);
    }
  touffes(c, pts.filter((p) => !evite.some(([a1, b1, a2, b2]) => p[0] > a1 && p[0] < a2 && p[1] > b1 && p[1] < b2) && Math.hypot(p[0] - TOUR.x, p[1] - TOUR.z) > 15.8));
}

// ---------- La tour de refroidissement ----------

/** Le rayon extérieur de la coque à la hauteur y : un hyperboloïde, gorge de 9,5 m à 30 m. */
function rayonTour(y) {
  return 9.5 * Math.sqrt(1 + ((y - 30) / 21.3) ** 2);
}
const HAUT_TOUR = 41;
const EP_COQUE = 0.32;

function profilCoque() {
  const ys = [4.6, 7, 10, 14, 18, 22, 26, 30, 34, 37.5, 40.4];
  const ext = [new THREE.Vector2(15.45, 3.3), new THREE.Vector2(15.45, 4.3), ...ys.map((y) => new THREE.Vector2(rayonTour(y), y)), new THREE.Vector2(rayonTour(40.4) + 0.25, 40.5), new THREE.Vector2(rayonTour(40.4) + 0.25, HAUT_TOUR)];
  const rh = rayonTour(40.4) + 0.25;
  const haut = [new THREE.Vector2(rh, HAUT_TOUR), new THREE.Vector2(rayonTour(40.4) - EP_COQUE - 0.1, HAUT_TOUR)];
  const int = [new THREE.Vector2(rayonTour(40.4) - EP_COQUE - 0.1, HAUT_TOUR), ...ys.slice().reverse().map((y) => new THREE.Vector2(rayonTour(y) - EP_COQUE, y)), new THREE.Vector2(14.8, 4.3), new THREE.Vector2(14.8, 3.3)];
  const bas = [new THREE.Vector2(14.8, 3.3), new THREE.Vector2(15.45, 3.3)];
  return [ext, haut, int, bas];
}

/** La coque entre les angles phi0 et phi0 + dphi (repère de la tour), en `seg` segments, dans le chantier k. */
function coque(k, phi0, dphi, seg) {
  for (const profil of profilCoque()) {
    const g = new THREE.LatheGeometry(profil, seg, phi0, dphi);
    const uv = g.attributes.uv;
    const pos = g.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, ((phi0 + uv.getX(i) * dphi) * 13) / 10, pos.getY(i) / 10);
    k.poser(g, M.coque(), C.coque, { x: TOUR.x, z: TOUR.z }, { nuance: 0.03 });
    g.dispose();
  }
}

/** Un point sur la coque (extérieur, + `ecart`) à l'angle θ et à la hauteur y. */
function surCoque(theta, y, ecart = 0) {
  const r = (y < 4.4 ? 15.45 : rayonTour(y)) + ecart;
  return [TOUR.x + r * Math.sin(theta), y, TOUR.z + r * Math.cos(theta)];
}

function tour(ctx, niveau) {
  const { b, c, u } = ctx;
  const fin = niveau === "fin";
  const fond = niveau === "fond";
  const beton = M.beton();
  const P = (r, th, y) => [TOUR.x + r * Math.sin(th), y, TOUR.z + r * Math.cos(th)];

  // --- La coque : en secteurs qui s'effacent chacun (on voit la paroi du fond quand on est dedans) ---
  const S = fond ? 1 : fin ? 8 : 6;
  const segParSecteur = fond ? 24 : fin ? 4 : 5;
  const dphi = TAU / S;
  const secteurs = [];
  for (let s = 0; s < S; s++) {
    const phi0 = s * dphi;
    let k = c;
    if (!fond) {
      let x1 = Infinity, x2 = -Infinity, z1 = Infinity, z2 = -Infinity;
      for (let q = 0; q <= 6; q++)
        for (const r of [15.6, 9.2]) {
          const th = phi0 + (q / 6) * dphi;
          const x = TOUR.x + r * Math.sin(th);
          const z = TOUR.z + r * Math.cos(th);
          x1 = Math.min(x1, x);
          x2 = Math.max(x2, x);
          z1 = Math.min(z1, z);
          z2 = Math.max(z2, z);
        }
      k = b.couche(`tour de refroidissement : coque (${s + 1}/${S})`, { x: (x1 + x2) / 2, z: (z1 + z2) / 2, l: x2 - x1 + 0.6, p: z2 - z1 + 0.6 }, 3.3, HAUT_TOUR);
    }
    secteurs.push({ k, phi0 });
    coque(k, phi0, dphi, segParSecteur);
  }
  const secteurDe = (th) => secteurs[Math.floor((((th % TAU) + TAU) % TAU) / dphi) % S].k;

  // --- Le pan fissuré, côté sud-est : une longue lézarde qui se ramifie, des éclats de béton ---
  {
    const th0 = 0.62;
    const k = secteurDe(th0);
    let th = th0;
    let prec = surCoque(th, 6, 0.04);
    for (let y = 7.4; y < 29; y += 1.4) {
      th += (c.hasard() - 0.5) * 0.025;
      const p = surCoque(th, y, 0.04);
      k.poutre(prec, p, 0.09, 0x4a463f, M.coque());
      if (y > 14 && y < 16) {
        let th2 = th;
        let p2 = p;
        for (let y2 = y + 1.2; y2 < y + 8; y2 += 1.3) {
          th2 += 0.012 + c.hasard() * 0.01;
          const q = surCoque(th2, y2, 0.04);
          k.poutre(p2, q, 0.06, 0x56514a, M.coque());
          p2 = q;
        }
      }
      prec = p;
    }
    // Éclats : le béton est tombé, on voit les fers
    for (let i = 0; i < 5; i++) {
      const y = 9 + i * 4 + c.entre(-1, 1);
      const t = th0 + c.entre(-0.03, 0.03);
      const p = surCoque(t, y, 0.06);
      k.boite(c.entre(0.7, 1.6), c.entre(0.5, 1.2), 0.05, 0xa29b8e, { x: p[0], y, z: p[2], ry: t }, M.coque());
      k.boite(1.1, 0.04, 0.04, C.rouilleSombre, { x: p[0], y: y + 0.15, z: p[2], ry: t }, M.coque());
    }
  }

  // --- L'échelle à crinoline, côté est (paratonnerre le long) ---
  if (!fond) {
    const th = 1.42;
    const k = secteurDe(th);
    const d = [Math.sin(th), Math.cos(th)];
    const chemin = [surCoque(th, 0, 0.35), surCoque(th, 4.2, 0.35)];
    for (const y of [7, 11, 15, 19, 23, 27, 31, 35, 38.5, 41.2]) chemin.push(surCoque(th, y, 0.1));
    echelle(k, chemin, d, 0x5e4a3a, M.coque(), 2.6, 0.9, 3);
    const pr = chemin.map((p) => [p[0] + Math.cos(th) * 0.9, p[1], p[2] - Math.sin(th) * 0.9]);
    for (let i = 0; i < pr.length - 1; i++) k.poutre(pr[i], pr[i + 1], 0.04, 0x6f5236, M.coque());
  }

  // --- La couronne de piliers en V ---
  for (let i = 0; i < NP; i++) {
    const thf = thetaPied(i);
    const pied = P(15.75, thf, 0);
    for (const s of [-1, 1]) {
      const tht = thf + (s * PI) / NP;
      const haut = P(15.15, tht, 3.5);
      // Un bras du pied voisin de la brèche est cassé : un moignon et son morceau tombé
      if (!fond && i === BRECHE + 1 && s === -1) {
        const mi = [pied[0] + (haut[0] - pied[0]) * 0.35, 1.25, pied[2] + (haut[2] - pied[2]) * 0.35];
        c.poutre(pied, mi, 0.42, C.beton, beton);
        const hautB = [haut[0], 3.5, haut[2]];
        c.poutre([hautB[0] + (pied[0] - hautB[0]) * 0.2, 2.8, hautB[2] + (pied[2] - hautB[2]) * 0.2], hautB, 0.42, C.beton, beton);
        const ext = P(17.2, thf - 0.03, 0.25);
        c.poutre([ext[0] - 1.1, 0.25, ext[2] + 0.4], [ext[0] + 0.9, 0.3, ext[2] - 0.6], 0.42, C.betonSombre, beton);
        c.poutre(mi, [mi[0] + 0.1, 1.5, mi[2] + 0.05], 0.04, C.rouilleSombre, M.tole());
        continue;
      }
      c.poutre(pied, haut, 0.42, C.beton, beton);
    }
    c.boite(0.9, 0.3, 0.9, C.betonSombre, { x: pied[0], y: 0.12, z: pied[2], ry: thf }, beton);
  }

  // --- Le muret du bassin et les tôles qui ferment les arches (posées à la fermeture du site) ---
  for (let j = 0; j < NP; j++) {
    const th = thetaOuv(j);
    const corde = 2 * 15.0 * Math.sin(PI / NP);
    const centre = P(15.0, th, 0);
    const casse = j === BRECHE || (u > 0.85 && j === 20);
    if (casse) {
      for (const s of [-1, 1]) {
        const p = P(15.0, th + s * (PI / NP) * 0.75, 0);
        c.boite(corde * 0.25, c.entre(0.3, 0.6), 0.3, C.betonSombre, { x: p[0], y: 0.25, z: p[2], ry: th }, beton);
      }
      gravats(c, centre[0], centre[2], 1.4, 18, [C.beton, C.betonSombre, PALETTE.pierre]);
      // La tôle arrachée, couchée dans l'herbe
      const ext = P(17.3, th + 0.04, 0.05);
      c.boite(2.4, 0.04, 1.6, C.rouille, { x: ext[0], y: 0.1, z: ext[2], ry: th + 0.5, rz: 0.1 }, M.bardage());
    } else {
      c.boite(corde, 1.2, 0.3, C.beton, { x: centre[0], y: 0.6, z: centre[2], ry: th }, beton);
      b.obstacle(...P(15.0, th - PI / NP, 0).filter((_, q) => q !== 1), ...P(15.0, th + PI / NP, 0).filter((_, q) => q !== 1), "muret du bassin");
    }
    // La tôle en triangle au-dessus du muret
    const manque = casse || j === BRECHE - 1 || j === BRECHE + 1 || c.hasard() < 0.15 + 0.35 * u;
    if (!manque && !fond) {
      const a1 = thetaPied(j) + PI / (3 * NP);
      const a2 = thetaPied(j + 1) - PI / (3 * NP);
      triangle2(c, M.bardage(), c.hasard() < 0.5 ? C.rouille : C.tole, [P(15.35, a1, 1.2), P(15.35, a2, 1.2), P(15.05, th, 3.3)]);
    }
  }

  // --- Le bassin ---
  if (fond) return;
  {
    const g = new THREE.CylinderGeometry(14.75, 14.75, 0.1, 32);
    c.poser(g, beton, 0xa3a093, { x: TOUR.x, y: 0.03, z: TOUR.z }, { crasse: false, nuance: 0.02 });
    g.dispose();
  }
  // La forêt de piliers qui portait le plancher d'échange
  const piliers = [];
  for (let i = -4; i <= 4; i++)
    for (let j = -4; j <= 4; j++) {
      const x = i * 3.2;
      const z = j * 3.2;
      const r = Math.hypot(x, z);
      if (r < 2.4 || r > 13.4) continue;
      piliers.push([TOUR.x + x, TOUR.z + z]);
      const casse = c.hasard() < 0.06 + 0.12 * u;
      const h = casse ? c.entre(2, 4.5) : 7.2;
      c.boite(0.4, h, 0.4, C.beton, { x: TOUR.x + x, y: h / 2, z: TOUR.z + z }, beton, { nuance: 0.05 });
      if (casse) c.poutre([TOUR.x + x + 0.1, h, TOUR.z + z], [TOUR.x + x + 0.25, h + 0.6, TOUR.z + z + 0.1], 0.04, C.rouilleSombre, M.tole());
      if (c.hasard() < 0.4) mousse(c, TOUR.x + x, 0.08, TOUR.z + z, 0.7, 3);
    }
  // Le puits central de distribution d'eau, et son graffiti
  {
    const g = new THREE.CylinderGeometry(1.5, 1.6, 9.5, 12);
    c.poser(g, beton, C.beton, { x: TOUR.x, y: 4.75, z: TOUR.z });
    g.dispose();
    const th = thetaOuv(BRECHE);
    const p = P(1.62, th, 2.3);
    panneau(c, "criePas", p[0], 2.3, p[2], 2.3, 0.92, th);
  }
  // Les flaques, les mousses, les plaques tombées, les bouleaux qui ont trouvé la lumière
  const flaques = fin ? [[-4, -6, 2.4], [5, 3, 1.6], [-7, 5, 1.3], [2, -10, 1.8], [8, -4, 1.1], [-10, -2, 1.2]] : [[-4, -6, 2.4], [5, 3, 1.6], [-7, 5, 1.3]];
  for (const [x, z, r] of flaques) {
    flaque(c, TOUR.x + x, TOUR.z + z, r, 0.095);
    touffes(c, [[TOUR.x + x + r, TOUR.z + z, 0.08], [TOUR.x + x - r * 0.8, TOUR.z + z + 0.4, 0.08]], PALETTE.herbe);
  }
  for (let i = 0; i < (fin ? 14 : 6); i++) {
    const a = c.hasard() * TAU;
    const r = c.entre(3, 13);
    mousse(c, TOUR.x + Math.sin(a) * r, 0.08, TOUR.z + Math.cos(a) * r, c.entre(0.8, 1.8), 4);
  }
  for (let i = 0; i < (fin ? 18 : 7); i++) {
    const a = c.hasard() * TAU;
    const r = c.entre(3, 13);
    c.boite(c.entre(1.5, 3), 0.08, c.entre(1.5, 3), c.hasard() < 0.4 ? 0x7f7c6c : 0x989487, { x: TOUR.x + Math.sin(a) * r, y: 0.12 + c.hasard() * 0.3, z: TOUR.z + Math.cos(a) * r, ry: c.hasard() * 3, rx: c.entre(-0.25, 0.25), rz: c.entre(-0.2, 0.2) }, M.mat(), { nuance: 0.06 });
  }
  gravats(c, TOUR.x + 4, TOUR.z - 7, 2.2, fin ? 30 : 14, [C.beton, C.betonSombre, 0xb7b3a8]);
  gravats(c, TOUR.x - 8, TOUR.z + 2, 1.6, fin ? 20 : 10, [C.beton, C.betonSombre, 0xb7b3a8]);
  if (u > 0.3) {
    arbre(c, TOUR.x - 6.4, TOUR.z - 1.6, 7.5, "bouleau");
    arbre(c, TOUR.x + 6.4, TOUR.z + 7.6, 5.5, "bouleau");
  }
  if (fin) {
    for (const [x, z] of [[-6, -9], [9.6, 1.6], [-1.6, 9.6], [3, -3], [-11, 4]]) arbuste(c, TOUR.x + x, TOUR.z + z, 0.7, 0.05, [PALETTE.feuillageSombre, 0x4f7a3c, PALETTE.feuillage]);
    semerTouffes(c, TOUR.x - 12, TOUR.z - 12, TOUR.x + 12, TOUR.z + 12, 50, PALETTE.herbeSeche, 0.08);
    lierre(c, TOUR.x, 0, TOUR.z + 1.62, 0, 2.6, 4, 70);
  }
  // Le rond de ciel, tout en haut : un rai de lumière descend dans le bassin
  raiDeLumiere(c, [TOUR.x + 2.5, 40, TOUR.z + 1.5], [TOUR.x - 2.5, 0.1, TOUR.z - 1.2], 6.5, 0.1);
  b.lumiere(TOUR.x - 2.5, 7, TOUR.z - 1.2, 0x9db4e0, 4, 16, "clair de lune tombé du haut de la tour");
  // La tache de soleil au pied du rai (même matière que le rai : pas d'appel de plus)
  for (const [r, dy] of [[4.2, 0.1], [3.0, 0.11]]) {
    const g = new THREE.CircleGeometry(r, 12).rotateX(-PI / 2);
    c.poser(g, matiereLueur(0xfff0c8, 0.1), 0xffffff, { x: TOUR.x - 2.5, y: dy, z: TOUR.z - 1.2 }, { crasse: false, nuance: 0 });
    g.dispose();
  }
  // Le camp des Charbonniers, à l'abri de la paroi
  brasero(ctx, TOUR.x + 10 * Math.sin(thetaOuv(BRECHE) + 0.25), TOUR.z + 10 * Math.cos(thetaOuv(BRECHE) + 0.25));

  // --- Le plancher d'échange effondré et la distribution d'eau (inaccessibles, au-dessus de la tête) ---
  if (fin) {
    const k = b.couche("tour : plancher d'échange effondré", { x: TOUR.x, z: TOUR.z, l: 28, p: 28 }, 6.8, 9.5);
    for (let i = -4; i <= 4; i++) {
      const v = i * 3.2;
      const demi = Math.sqrt(Math.max(0, 13.4 ** 2 - v * v));
      if (demi < 2) continue;
      for (const sens of [0, 1]) {
        // Une poutre par ligne de piliers, coupée en tronçons dont certains sont tombés
        for (let w = -demi; w < demi - 0.1; w += 3.2) {
          const w2 = Math.min(demi, w + 3.2);
          if (c.hasard() < 0.18 + 0.2 * u) continue;
          const a = sens ? [TOUR.x + v, 7.4, TOUR.z + w] : [TOUR.x + w, 7.4, TOUR.z + v];
          const bb = sens ? [TOUR.x + v, 7.4, TOUR.z + w2] : [TOUR.x + w2, 7.4, TOUR.z + v];
          if (Math.hypot(a[0] - TOUR.x, a[2] - TOUR.z) < 1.6 && Math.hypot(bb[0] - TOUR.x, bb[2] - TOUR.z) < 1.6) continue;
          k.poutre(a, bb, 0.38, C.beton, beton);
        }
      }
    }
    // Les plaques du remplissage : quelques-unes encore en place, d'autres qui pendent
    for (let i = -4; i < 4; i++)
      for (let j = -4; j < 4; j++) {
        const x = TOUR.x + (i + 0.5) * 3.2;
        const z = TOUR.z + (j + 0.5) * 3.2;
        if (Math.hypot(x - TOUR.x, z - TOUR.z) > 12.5) continue;
        const r = c.hasard();
        if (r < 0.32 - 0.2 * u) k.boite(3.0, 0.12, 3.0, 0xb9b6ab, { x, y: 7.7, z }, M.mat(), { nuance: 0.05 });
        else if (r < 0.45 - 0.15 * u) k.boite(3.0, 0.12, 3.0, 0xaaa69b, { x: x + 0.6, y: 6.6, z, rz: 0.75, ry: c.entre(-0.2, 0.2) }, M.mat(), { nuance: 0.05 });
      }
    // Les rampes de distribution, en étoile depuis le puits
    for (let q = 0; q < 6; q++) {
      const th = (q / 6) * TAU + 0.3;
      const tombe = q === 2;
      const a = P(1.6, th, 8.6);
      const bb = tombe ? P(10, th, 3.0) : P(13.2, th, 8.6);
      tuyau(k, [a, bb], 0.28, C.rouille, M.tole(), 6);
    }
  }
}

// ---------- La salle des turbines ----------

/** Un groupe turbo-alternateur le long de x, de x0 à x0 + 17, axe en z. */
function groupe(ctx, x0, z, couleur, { ouvert = false, simple = false } = {}) {
  const { b, c } = ctx;
  const t = M.tole();
  const fonce = new THREE.Color(couleur).multiplyScalar(0.72).getHex();
  // Le massif de béton
  c.pave(x0, 0, z - 2.6, x0 + 17, 1.0, z + 2.6, C.betonSombre, M.beton(), { nuance: 0.02 });
  obstacleRect(b, x0, z - 2.6, x0 + 17, z + 2.6, "groupe turbo-alternateur");
  // Turbine haute pression
  c.pave(x0 + 0.8, 1.0, z - 1.3, x0 + 4.2, 2.3, z + 1.3, fonce, t);
  cylX(c, x0 + 0.8, x0 + 4.2, 2.3, z, 1.3, couleur, t, 12, true);
  // Turbine basse pression
  c.pave(x0 + 4.7, 1.0, z - 2.0, x0 + 10.4, 2.6, z + 2.0, fonce, t);
  cylX(c, x0 + 4.7, x0 + 10.4, 2.6, z, 2.0, couleur, t, 14, true);
  // Alternateur et excitatrice
  c.pave(x0 + 11, 1.0, z - 1.5, x0 + 15.6, 1.9, z + 1.5, fonce, t);
  if (!ouvert) {
    cylX(c, x0 + 11, x0 + 15.6, 2.75, z, 1.7, couleur, t, 12);
    if (!simple) for (let k = 0; k < 4; k++) cylX(c, x0 + 11.3 + k * 1.3, x0 + 11.5 + k * 1.3, 2.75, z, 1.78, fonce, t, 12);
  } else {
    // Le capot a été déposé : le bobinage de cuivre est à nu
    cylX(c, x0 + 11, x0 + 15.6, 2.75, z, 1.7, fonce, t, 12, false);
    cylX(c, x0 + 10.9, x0 + 15.7, 2.75, z, 1.5, C.cuivre, M.metal(), 12);
    for (let k = 0; k < 6; k++) cylX(c, x0 + 11 + k * 0.8, x0 + 11.25 + k * 0.8, 2.75, z, 1.58, 0x9c5e33, M.metal(), 12);
    // Le demi-capot, retourné au sol à côté
    const g = new THREE.CylinderGeometry(1.75, 1.75, 4.4, 12, 1, true, 0, PI);
    c.poser(g, t, couleur, { x: x0 + 13.3, y: 0.15, z: z + 4.2, rz: -PI / 2, ry: 0.12 });
    g.dispose();
    for (let k = 0; k < 5; k++) c.boite(c.entre(0.6, 1.4), 0.05, 0.08, C.cuivre, { x: x0 + 12 + c.entre(0, 3), y: 1.05, z: z + c.entre(1.6, 2.4), ry: c.hasard() * 3 }, M.metal());
  }
  cylX(c, x0 + 15.9, x0 + 17, 2.3, z, 0.85, couleur, t, 10);
  // L'arbre et les paliers
  cylX(c, x0 + 0.3, x0 + 16.8, 2.4, z, 0.22, 0x8b8f8c, M.metal(), 6);
  for (const xp of [0.5, 4.45, 10.7, 15.75]) c.pave(x0 + xp - 0.25, 1.0, z - 0.7, x0 + xp + 0.25, 2.3, z + 0.7, fonce, t);
  if (simple) return;
  // Les arrivées de vapeur, coudées
  for (const s of [-1, 1]) tuyau(c, [[x0 + 2, 0, z + s * 3.3], [x0 + 2, 3.0, z + s * 3.3], [x0 + 2.4, 3.4, z + s * 1.6], [x0 + 2.4, 3.0, z + s * 1.05]], 0.32, 0x7b7466, t, 8);
  // Les vannes à volant
  for (const s of [-1, 1]) {
    const g = new THREE.TorusGeometry(0.35, 0.04, 4, 10);
    c.poser(g, t, C.jaune, { x: x0 + 2, y: 1.6, z: z + s * 3.75, ry: PI / 2 });
    g.dispose();
  }
  // Les cadrans du tableau local, et la plaque du constructeur
  c.poutre([x0 + 0.2, 0.08, z + 3.4], [x0 + 0.2, 1.2, z + 3.4], 0.1, fonce, t);
  c.boite(1.1, 0.6, 0.08, fonce, { x: x0 + 0.2, y: 1.45, z: z + 3.4, rx: -0.4 }, t);
  panneau(c, "pupitre", x0 + 0.2, 1.47, z + 3.45, 1.0, 0.5, 0, -0.4);
  panneau(c, "plaque", x0 + 7.5, 1.6, z + 2.05, 1.2, 0.6);
}

function salle(ctx, niveau) {
  const { b, u } = ctx;
  const S = SALLE;
  const fin = niveau === "fin";
  const fond = niveau === "fond";
  // Au loin (carte de la tour), toute la salle s'efface : elle cacherait la brèche de la tour.
  const c = fond ? b.couche("salle des turbines (au loin)", { x: (S.x0 + S.x1) / 2, z: (S.z0 + S.z1) / 2, l: S.x1 - S.x0 + 1.2, p: S.z1 - S.z0 + 1.2 }, 0, S.faite + 0.6) : ctx.c;
  const brique = M.brique();
  const beton = M.beton();
  const xb = (i) => S.x0 + 5.5 * i;
  const zc = (S.z0 + S.z1) / 2;

  // --- Le sol ---
  if (!fond) {
    const solMat = fin ? M.carrelage() : beton;
    const solC = fin ? 0xc4bba8 : 0x9d998f;
    const f = fin ? { x1: 3, z1: 2.2, x2: 7, z2: 4.6 } : null;
    const [a1, b1, a2, b2] = [S.x0 + 0.2, S.z0 + 0.2, S.x1 - 0.2, S.z1 - 0.2];
    if (!f) c.pave(a1, -0.02, b1, a2, 0.08, b2, solC, solMat, { nuance: 0.02, crasse: false });
    else {
      c.pave(a1, -0.02, b1, a2, 0.08, f.z1, solC, solMat, { nuance: 0.02, crasse: false });
      c.pave(a1, -0.02, f.z2, a2, 0.08, b2, solC, solMat, { nuance: 0.02, crasse: false });
      c.pave(a1, -0.02, f.z1, f.x1, 0.08, f.z2, solC, solMat, { nuance: 0.02, crasse: false });
      c.pave(f.x2, -0.02, f.z1, a2, 0.08, f.z2, solC, solMat, { nuance: 0.02, crasse: false });
      // La fosse du condenseur : des murs qui plongent dans le noir, de l'eau au fond
      c.pave(f.x1, -3, f.z1, f.x2, -2.9, f.z2, 0x1e1d1b, M.mat(), { crasse: false });
      for (const [p, q, r, s] of [[f.x1, f.z1, f.x2, f.z1 + 0.1], [f.x1, f.z2 - 0.1, f.x2, f.z2], [f.x1, f.z1, f.x1 + 0.1, f.z2], [f.x2 - 0.1, f.z1, f.x2, f.z2]]) c.pave(p, -3, q, r, 0.0, s, 0x55524b, beton, { crasse: false });
      flaque(c, (f.x1 + f.x2) / 2, (f.z1 + f.z2) / 2, 1.5, -2.85);
      gardeCorps(c, [[f.x1 - 0.15, f.z1 - 0.15], [f.x2 + 0.15, f.z1 - 0.15], [f.x2 + 0.15, f.z2 + 0.15], [f.x1 - 0.15, f.z2 + 0.15], [f.x1 - 0.15, f.z1 - 0.15]], 0.08);
      obstacleRect(b, f.x1 - 0.15, f.z1 - 0.15, f.x2 + 0.15, f.z2 + 0.15, "garde-corps de la fosse");
    }
  }

  // --- Les murs du rez-de-chaussée (toujours visibles) ---
  const murBas = { h: 4, ep: 0.5, couleur: C.brique, mat: brique, batiment: fond ? null : b };
  mur(c, [S.x0, S.z1], [S.x1, S.z1], { ...murBas, ouvertures: [{ u: 8, l: 1.2, bas: 0, haut: 2.3, type: "vide" }, { u: 18.5, l: 1.2, bas: 0, haut: 2.3, type: "vide" }, { u: 34, l: 3.4, bas: 0, haut: 3.7, type: "vide" }] });
  mur(c, [S.x0, S.z0], [S.x0, S.z1], { ...murBas, breches: u > 0.5 ? [{ u: 12, l: 3.8, profondeur: 1.2 + 3.2 * u }] : [] });
  mur(c, [S.x1, S.z0], [S.x1, S.z1], { ...murBas, ouvertures: [{ u: 11, l: 5, bas: 0, haut: 9, type: "vide" }] });
  mur(c, [S.x0, S.z0], [S.x1, S.z0], { ...murBas });
  // Socle de béton, pilastres
  for (const [p, q, r, s] of [[S.x0 - 0.33, S.z1 + 0.2, S.x1 + 0.33, S.z1 + 0.33], [S.x0 - 0.33, S.z0 - 0.2, S.x0 - 0.2, S.z1 + 0.33], [S.x1 + 0.2, S.z0 - 0.2, S.x1 + 0.33, S.z1 + 0.33]]) {
    if (s > S.z1 && q > S.z1) {
      // le socle sud est interrompu par les portes
      for (const [d1, d2] of [[S.x0 - 0.33, 1.4], [2.6, 11.9], [13.1, 26.3], [29.7, S.x1 + 0.33]]) c.pave(d1, 0, q, d2, 0.6, s, C.betonSombre, beton);
    } else if (p > S.x1) {
      c.pave(p, 0, q, r, 0.6, 0.5, C.betonSombre, beton);
      c.pave(p, 0, 5.5, r, 0.6, s, C.betonSombre, beton);
    } else c.pave(p, 0, q, r, 0.6, s, C.betonSombre, beton);
  }

  // --- Ce qui s'efface : hauts murs, fronton, verrière, charpente, pont roulant, passerelles ---
  const k = fond ? c : b.couche("salle des turbines : hauts murs, verrière, pont roulant", { x: (S.x0 + S.x1) / 2, z: zc, l: S.x1 - S.x0 + 1.2, p: S.z1 - S.z0 + 1.2 }, 4, S.faite + 0.6);
  const murHaut = { h: 12, y0: 4, ep: 0.5, couleur: C.brique, mat: brique };
  const brecheSud = u > 0.6;
  const fenS = [];
  for (let i = 0; i < 8; i++) if (!(brecheSud && i === 7)) fenS.push({ u: 5.5 * (i + 0.5), l: 3.4, bas: 0.6, haut: 9.8, type: "vide" });
  mur(k, [S.x0, S.z1], [S.x1, S.z1], { ...murHaut, ouvertures: fenS, breches: brecheSud ? [{ u: 41.2, l: 5.2, profondeur: 3 + 6 * (u - 0.6) }] : [] });
  for (const f of fenS) {
    const x = S.x0 + f.u;
    vitre(k, u, x, 9.2, S.z1, 3.4, 9.2);
    k.pave(x - 1.85, 13.8, S.z1 - 0.3, x + 1.85, 14.2, S.z1 + 0.32, C.beton, beton); // linteau
    k.pave(x - 1.8, 4.5, S.z1 - 0.3, x + 1.8, 4.62, S.z1 + 0.4, C.beton, beton); // appui
  }
  const fenO = [{ u: 4.5, l: 3, bas: 0.6, haut: 9.8, type: "vide" }, { u: 13.5, l: 3, bas: 0.6, haut: 9.8, type: "vide" }];
  mur(k, [S.x0, S.z0], [S.x0, S.z1], { ...murHaut, ouvertures: fenO });
  for (const f of fenO) {
    vitre(k, u, S.x0, 9.2, S.z0 + f.u, 3, 9.2, PI / 2);
    k.pave(S.x0 - 0.32, 13.8, S.z0 + f.u - 1.7, S.x0 + 0.3, 14.2, S.z0 + f.u + 1.7, C.beton, beton);
  }
  mur(k, [S.x1, S.z0], [S.x1, S.z1], { ...murHaut, ouvertures: [{ u: 11, l: 5, bas: 0, haut: 0.6, type: "vide" }] });
  mur(k, [S.x0, S.z0], [S.x1, S.z0], { ...murHaut });
  // Les frontons des pignons
  for (const x of [S.x0, S.x1]) {
    const forme = new THREE.Shape([new THREE.Vector2(-(S.z1 - S.z0) / 2 - 0.25, 0), new THREE.Vector2((S.z1 - S.z0) / 2 + 0.25, 0), new THREE.Vector2(0, S.faite - S.h)]);
    const g = new THREE.ExtrudeGeometry(forme, { depth: 0.5, bevelEnabled: false });
    k.poser(g, brique, C.brique, { x: x - 0.25, y: S.h, z: zc, ry: PI / 2 });
    g.dispose();
    // Le rampant en béton
    for (const s of [-1, 1]) k.poutre([x, S.h + 0.1, zc + s * ((S.z1 - S.z0) / 2 + 0.35)], [x, S.faite + 0.25, zc], 0.6, C.beton, beton);
    // Un oculus muré
    const g2 = new THREE.CylinderGeometry(1.1, 1.1, 0.62, 12);
    k.poser(g2, beton, C.beton, { x, y: S.h + 1.7, z: zc, rz: PI / 2 });
    g2.dispose();
  }
  // Pilastres et corniche
  for (let i = 0; i <= 8; i++) {
    const x = xb(i);
    c.pave(x - 0.45, 0.6, S.z1 + 0.2, x + 0.45, 4, S.z1 + 0.55, C.brique, brique);
    k.pave(x - 0.45, 4, S.z1 + 0.2, x + 0.45, i === 8 && brecheSud ? 12.5 : 16.3, S.z1 + 0.55, C.brique, brique);
  }
  for (const z of [S.z0 + 6, S.z0 + 12]) {
    for (const [x, d] of [[S.x0, -1], [S.x1, 1]]) {
      c.pave(x + d * 0.2, 0.6, z - 0.45, x + d * 0.55, 4, z + 0.45, C.brique, brique);
      k.pave(x + d * 0.2, 4, z - 0.45, x + d * 0.55, 16.3, z + 0.45, C.brique, brique);
    }
  }
  k.pave(S.x0 - 0.5, 16, S.z1 - 0.3, brecheSud ? 32.4 : S.x1 + 0.5, 16.5, S.z1 + 0.6, C.beton, beton);
  k.pave(S.x0 - 0.5, 16, S.z0 - 0.6, S.x1 + 0.5, 16.5, S.z0 + 0.3, C.beton, beton);
  // La frise peinte, et la fresque de Watty sur le pignon est
  panneau(k, "frise", 16, 15.05, S.z1 + 0.27, 14.4, 1.8);
  panneau(k, "watty", S.x1 + 0.27, 9.6, zc + 0.5, 10.5, 10.5, PI / 2);

  // --- La charpente et la verrière ---
  const yE = S.h + 0.3;
  const demiP = (S.z1 - S.z0) / 2;
  const yTop = (z) => yE + (S.faite - yE) * (1 - Math.abs(z - zc) / demiP);
  for (let i = 1; i <= 7; i++) {
    const x = xb(i);
    k.poutre([x, yE, S.z0 + 0.3], [x, yE, S.z1 - 0.3], 0.26, C.acier, M.tole());
    for (const s of [-1, 1]) {
      const ze = zc + s * (demiP - 0.3);
      k.poutre([x, yE, ze], [x, S.faite, zc], 0.3, C.acier, M.tole());
      let prec = [x, yE, ze];
      for (let m = 1; m <= 3; m++) {
        const z = zc + s * demiP * (1 - m / 4);
        k.poutre([x, yE, z], [x, yTop(z), z], 0.12, C.acier, M.tole());
        k.poutre(prec, [x, yTop(z), z], 0.1, C.acier, M.tole());
        prec = [x, yE, z];
      }
    }
    k.poutre([x, yE, zc], [x, S.faite, zc], 0.14, C.acier, M.tole());
  }
  // Pannes
  for (const s of [-1, 1])
    for (const f of [0.12, 0.38, 0.64, 0.9]) {
      const z = zc + s * demiP * (1 - f);
      k.pave(S.x0, yTop(z) + 0.05, z - 0.09, S.x1, yTop(z) + 0.28, z + 0.09, C.acier, M.tole());
    }
  k.pave(S.x0, S.faite, zc - 0.12, S.x1, S.faite + 0.3, zc + 0.12, C.acier, M.tole());
  // Couverture : tôle en bas de pente, vitrage en haut ; des panneaux manquent
  const trous = [];
  for (let i = 0; i < 8; i++)
    for (const s of [-1, 1]) {
      const xa = xb(i) + 0.05;
      const xz = xb(i + 1) - 0.05;
      const ze = zc + s * (demiP + 0.3);
      const zm = zc + s * demiP * 0.6;
      const P = (x, z) => [x, yTop(Math.max(Math.min(z, S.z1), S.z0)) + 0.32 + (Math.abs(z - zc) > demiP ? -0.15 : 0), z];
      const ordre = (p) => (s > 0 ? p : [p[1], p[0], p[3], p[2]]);
      if (c.hasard() > 0.12 + 0.25 * u) quad(k, M.bardage(), C.tole, ordre([P(xa, ze), P(xz, ze), P(xz, zm), P(xa, zm)]), undefined, true, true);
      if (c.hasard() > 0.15 + 0.35 * u) {
        const lv = Math.hypot(demiP * 0.6, S.faite - yTop(zm));
        quad(k, M.vitrage(u), 0xffffff, ordre([P(xa, zm), P(xz, zm), P(xz, zc), P(xa, zc)]), [[0, 0], [5.4 / 4, 0], [5.4 / 4, lv / 4], [0, lv / 4]]);
      } else trous.push([(xa + xz) / 2, zc + s * demiP * 0.3]);
    }

  // --- Le pont roulant ---
  {
    const kr = k;
    for (const z of [S.z0 + 0.65, S.z1 - 0.65]) {
      kr.pave(S.x0 + 0.3, 11.6, z - 0.22, S.x1 - 0.3, 12.1, z + 0.22, C.acier, M.tole());
      for (let i = 0; i <= 8; i++) kr.pave(xb(i) - 0.2, 10.9, z - 0.3, xb(i) + 0.2, 11.6, z + 0.3, C.acier, M.tole());
    }
    const xp = 9;
    for (const dx of [-0.6, 0.6]) kr.pave(xp + dx - 0.25, 12.2, S.z0 + 0.5, xp + dx + 0.25, 13.2, S.z1 - 0.5, C.jaune, M.tole());
    for (const z of [S.z0 + 0.65, S.z1 - 0.65]) kr.pave(xp - 1.4, 12.1, z - 0.4, xp + 1.4, 12.9, z + 0.4, C.jaune, M.tole());
    const zt = -1.5;
    kr.pave(xp - 1.2, 13.2, zt - 1.1, xp + 1.2, 14.1, zt + 1.1, C.jaune, M.tole());
    kr.pave(xp - 0.9, 10.6, S.z1 - 2.2, xp + 0.1, 12.2, S.z1 - 1.2, C.acierGris, M.tole()); // la cabine
    for (const dz of [-0.25, 0.25]) kr.poutre([xp, 13.2, zt + dz], [xp, 6.2, zt + dz], 0.04, 0x3a3a38, M.tole());
    kr.pave(xp - 0.35, 5.4, zt - 0.3, xp + 0.35, 6.3, zt + 0.3, C.jaune, M.tole());
    kr.poutre([xp, 5.4, zt], [xp, 4.9, zt + 0.15], 0.12, 0x3a3a38, M.tole());
    kr.poutre([xp, 4.9, zt + 0.15], [xp, 4.95, zt + 0.5], 0.12, 0x3a3a38, M.tole());
  }

  // --- Les passerelles le long du mur nord, et la volée d'escalier arrachée ---
  {
    const y = 6.4;
    const z1 = S.z0 + 0.25;
    const z2 = z1 + 1.3;
    k.pave(S.x0 + 0.3, y - 0.06, z1, 29.2, y, z2, C.grille, M.tole());
    for (let i = 0; i <= 6; i++) k.poutre([xb(i), y - 1.3, z1], [xb(i), y - 0.05, z2], 0.1, C.acier, M.tole());
    gardeCorps(k, [[S.x0 + 0.3, z2], [29.2, z2]], y);
    // La volée du haut pend, arrachée de son palier
    k.repere({ x: 29.0, z: z1 + 0.65, ry: PI }, () => {
      k.repere({ x: 0, y: 3.2, rz: -0.75, ry: 0.15 }, () => escalier(k, 0, 0, 0, 0, 3.2, 1.0));
    });
  }
  if (!fond) {
    // La volée du bas, son palier sur poteaux
    const z = S.z0 + 0.9;
    escalier(c, 33.3, z, PI, 0.08, 3.2, 1.0);
    c.pave(27.7, 3.15, z - 0.6, 29.0, 3.25, z + 0.6, C.grille, M.tole());
    for (const [x, zz] of [[27.8, z - 0.55], [28.9, z - 0.55], [27.8, z + 0.55], [28.9, z + 0.55]]) c.poutre([x, 0, zz], [x, 3.15, zz], 0.1, C.acier, M.tole());
    gardeCorps(c, [[27.7, z + 0.6], [27.7, z - 0.6]], 3.25);
    obstacleRect(b, 27.7, z - 0.6, 33.3, z + 0.6, "escalier métallique");
  }

  // --- Les poteaux intérieurs (en I), le long des murs ---
  if (!fond)
    for (let i = 1; i <= 7; i++)
      for (const z of [S.z0 + 0.45, S.z1 - 0.45]) {
        poteauI(c, xb(i), z, 0, 4, 0.45, C.acier);
        poteauI(k, xb(i), z, 4, 16.2, 0.45, C.acier);
      }

  if (fond) return;

  // --- Le cœur : deux groupes turbo-alternateurs ---
  groupe(ctx, -1, -1.5, C.vert, { simple: !fin });
  groupe(ctx, 19, -1.5, C.bleu, { ouvert: true, simple: !fin });

  // Le feu des Charbonniers, près de la porte principale
  brasero(ctx, 25.4, 6.6);
  // Les rails de la voie de déchargement, qui entrent par le pignon est
  for (const dz of [-0.72, 0.72]) c.pave(30, 0.08, 3 + dz - 0.04, S.x1, 0.16, 3 + dz + 0.04, 0x6d5a4a, M.metal());

  // Gravats et éclats de verre sous les trous de la verrière, flaques
  for (const [x, z] of trous.slice(0, fin ? 6 : 3)) {
    jonchee(c, x - 2, z - 1.5, x + 2, z + 1.5, fin ? 30 : 12, [0x9fb0ae, 0xc0ccc8, 0x7b8a88], 0.09);
    if (c.hasard() < 0.6) flaque(c, x + c.entre(-1, 1), z + c.entre(-0.6, 0.6), c.entre(0.8, 1.6), 0.095);
  }
  gravats(c, 36, 8.6, 1.5, fin ? 22 : 10, [C.brique, PALETTE.briqueSombre, C.beton]);
  if (u > 0.5) {
    gravats(c, -5.2, 4, 1.6, fin ? 24 : 12, [C.brique, PALETTE.briqueSombre, C.beton]);
    arbre(c, -3.6, 5.6, 4.2, "bouleau");
  }
  lierre(c, S.x0 + 0.3, 0, -3, PI / 2, 3, 3.5, fin ? 50 : 25);

  if (!fin) return;

  // --- La salle en détail ---
  // Rais de lumière par les trous de la verrière
  for (const [x, z] of trous.slice(0, 3)) raiDeLumiere(c, [x + 2, 19, z + 1], [x - 1.5, 0.1, z - 1.2], 2.6, 0.1);
  // L'atelier d'entretien (mur ouest)
  {
    const x = S.x0 + 0.25;
    c.pave(x, 0.85, -5.2, x + 0.85, 0.95, -1.4, PALETTE.boisSombre, M.mat());
    for (const z of [-5.1, -1.5]) for (const dx of [0.05, 0.75]) c.pave(x + dx, 0, z - 0.05, x + dx + 0.06, 0.85, z + 0.05, C.acierGris, M.tole());
    c.pave(x, 0.25, -5.1, x + 0.85, 0.3, -1.5, PALETTE.boisSombre, M.mat());
    c.boite(0.3, 0.2, 0.18, 0x3b4a44, { x: x + 0.5, y: 1.05, z: -4.6 }, M.tole()); // l'étau
    c.pave(x, 1.25, -5.0, x + 0.05, 2.45, -1.6, 0x6f6a5c, M.mat()); // le panneau à outils
    for (let i = 0; i < 9; i++) c.boite(0.04, c.entre(0.2, 0.45), 0.06, 0x2c2e2c, { x: x + 0.08, y: c.entre(1.5, 2.2), z: -4.8 + i * 0.38, rx: c.entre(-0.3, 0.3) }, M.metal());
    c.pave(x, 0, -0.6, x + 0.7, 1.1, 0.6, 0x55665e, M.tole()); // la servante à tiroirs
    for (let i = 0; i < 4; i++) c.pave(x + 0.7, 0.15 + i * 0.25, -0.5, x + 0.72, 0.3 + i * 0.25, 0.5, 0x7a8a82, M.tole());
    // la perceuse à colonne
    c.pave(-4.9, 0, 1.6, -4.3, 0.15, 2.2, 0x55665e, M.tole());
    c.tube([-4.6, 0.15, 2.0], [-4.6, 1.9, 2.0], 0.06, 0x8b8f8c, M.metal(), 6);
    c.pave(-4.85, 1.45, 1.6, -4.35, 1.85, 2.15, 0x55665e, M.tole());
    obstacleRect(b, x, -5.2, x + 0.85, 0.6, "établi");
  }
  // Les fûts d'huile, dont un renversé
  for (const [x, z, couche] of [[-4.6, 7.6, false], [-3.9, 8.2, false], [-4.7, 8.5, false], [-3.2, 7.2, true]]) baril(c, x, z, couche ? C.rouille : 0x4f6a5c, couche, 0.4);
  flaque(c, -2.4, 6.8, 0.9, 0.095);
  // Le chemin de câbles du mur sud, à moitié pillé
  {
    const z = S.z1 - 0.55;
    c.pave(S.x0 + 0.5, 3.3, z - 0.25, S.x1 - 0.5, 3.34, z + 0.25, C.acierGris, M.tole());
    c.pave(S.x0 + 0.5, 3.34, z + 0.21, S.x1 - 0.5, 3.45, z + 0.25, C.acierGris, M.tole());
    for (let i = 0; i < 3; i++) c.tube([S.x0 + 0.5, 3.4, z - 0.15 + i * 0.12], [i === 0 ? 7 : S.x1 - 0.5, 3.4, z - 0.15 + i * 0.12], 0.05, 0x2b2b2b, M.mat(), 5);
    tuyau(c, [[7, 3.4, z - 0.15], [8.5, 1.6, z - 0.6], [9.6, 0.15, z - 1.0], [12, 0.15, z - 1.4]], 0.05, 0x2b2b2b, M.mat(), 5);
    for (let i = 0; i < 4; i++) {
      const g = new THREE.TorusGeometry(0.45 - i * 0.04, 0.05, 4, 10);
      c.poser(g, M.mat(), 0x2b2b2b, { x: 12.6, y: 0.12 + i * 0.07, z: z - 1.5, rx: PI / 2 });
      g.dispose();
    }
  }
  // Panneaux : salle de méditation (au-dessus de sa porte, côté salle)
  panneau(c, "meditation", 12.5, 2.85, S.z1 - 0.27, 2.4, 0.75, PI);
  // Des papiers, des feuilles mortes entrées par les brèches
  jonchee(c, -4, 2, 6, 8, 40, [0xd9d2c0, 0xc9c0aa, 0x9c7a45], 0.09);
  jonchee(c, 20, 3, 36, 8, 30, [0xd9d2c0, 0x9c7a45, 0x7d6143], 0.09);
  semerTouffes(c, S.x0 + 1, 7, S.x0 + 6, 9.5, 12, PALETTE.herbeSeche, 0.08);
}

// ---------- L'annexe : salle de commande et salle de méditation énergétique ----------

function annexe(ctx, niveau) {
  const { b, c, u } = ctx;
  const A = ANNEXE;
  const fin = niveau === "fin";
  const brique = M.brique();
  const beton = M.beton();

  // Sols
  c.pave(A.x0 + 0.2, -0.02, A.z0 + 0.25, 7.9, 0.08, A.z1 - 0.2, 0xa9b2a6, fin ? M.carrelage() : beton, { crasse: false, nuance: 0.02 });
  c.pave(8.1, -0.02, A.z0 + 0.25, A.x1 - 0.2, 0.08, A.z1 - 0.2, 0x8a8170, M.mat(), { crasse: false, nuance: 0.02 });
  if (fin) c.pave(8.6, 0.08, A.z0 + 0.8, A.x1 - 0.7, 0.1, A.z1 - 0.7, 0x7c8f86, M.mat(), { crasse: false, nuance: 0.03 }); // la moquette « zen »

  // Murs bas
  const m = { h: A.h, ep: 0.4, couleur: C.brique, mat: brique, batiment: b };
  const fen = (uu, l = 2.2) => ({ u: uu, l, bas: 1.0, haut: 2.8, type: "vide" });
  mur(c, [A.x0, A.z1], [A.x1, A.z1], { ...m, ouvertures: [{ u: 4, l: 1.1, bas: 0, haut: 2.25, type: "vide" }, fen(7.6), fen(11), { u: 16, l: 1.1, bas: 0, haut: 2.25, type: "vide" }, fen(19.5)] });
  mur(c, [A.x0, A.z0 + 0.25], [A.x0, A.z1], { ...m, ouvertures: [fen(3.75, 2.4)] });
  mur(c, [A.x1, A.z0 + 0.25], [A.x1, A.z1], { ...m, ouvertures: [fen(3.75, 2.4)] });
  mur(c, [8, A.z0 + 0.25], [8, A.z1 - 0.2], { ...m, ep: 0.2, couleur: 0xcfc8b6, mat: M.mat(), ouvertures: [{ u: 2.2, l: 0.95, bas: 0, haut: 2.2, type: "vide" }] });
  for (const x of [1.6, 5]) vitre(c, u, x, 1.9, A.z1, 2.2, 1.8);
  vitre(c, u, 13.5, 1.9, A.z1, 2.2, 1.8);
  vitre(c, u, A.x0, 1.9, A.z0 + 4, 2.4, 1.8, PI / 2);
  vitre(c, u, A.x1, 1.9, A.z0 + 4, 2.4, 1.8, PI / 2);
  // Les portes : battants de tôle, l'un ouvert, l'autre tombé
  c.repere({ x: -2.55, z: A.z1 + 0.2, ry: -1.3 }, () => c.boite(1.05, 2.2, 0.05, 0x55665e, { x: 0.52, y: 1.12 }, M.tole()));
  c.boite(1.05, 0.05, 2.2, 0x55665e, { x: 10.1, y: 0.1, z: A.z1 + 1.4, ry: 0.2 }, M.tole());
  panneau(c, "meditation", 10, 2.72, A.z1 + 0.22, 2.0, 0.62);

  // Ce qui s'efface : l'acrotère, la dalle du toit, l'enseigne et les antennes
  const k = b.couche("annexe : toit, enseigne « 100 % connectée »", { x: (A.x0 + A.x1) / 2, z: (A.z0 + A.z1) / 2, l: A.x1 - A.x0 + 0.8, p: A.z1 - A.z0 + 0.8 }, A.h, 9);
  const mh = { h: 1.2, y0: A.h, ep: 0.4, couleur: C.brique, mat: brique };
  mur(k, [A.x0, A.z1], [A.x1, A.z1], mh);
  mur(k, [A.x0, A.z0 + 0.25], [A.x0, A.z1], mh);
  mur(k, [A.x1, A.z0 + 0.25], [A.x1, A.z1], mh);
  k.pave(A.x0 - 0.25, A.toit, A.z0 + 0.25, A.x1 + 0.25, A.toit + 0.22, A.z1 + 0.25, C.beton, beton);
  k.pave(A.x0 - 0.3, A.toit + 0.22, A.z1 - 0.2, A.x1 + 0.3, A.toit + 0.75, A.z1 + 0.3, C.beton, beton);
  k.pave(A.x0 - 0.3, A.toit + 0.22, A.z0 + 0.25, A.x0 + 0.2, A.toit + 0.75, A.z1, C.beton, beton);
  k.pave(A.x1 - 0.2, A.toit + 0.22, A.z0 + 0.25, A.x1 + 0.3, A.toit + 0.75, A.z1, C.beton, beton);
  // L'enseigne sur son cadre d'acier
  const ye = A.toit + 0.8;
  for (const x of [-0.5, 3.5, 7.5]) k.poutre([x, A.toit + 0.2, A.z1 - 0.6], [x, ye + 3.0, A.z1 - 0.6], 0.14, C.acier, M.tole());
  k.poutre([-0.8, ye + 0.6, A.z1 - 0.6], [7.8, ye + 0.6, A.z1 - 0.6], 0.1, C.acier, M.tole());
  k.pave(-1.6, ye + 0.15, A.z1 - 0.56, 8.6, ye + 3.25, A.z1 - 0.5, 0x6f6a60, M.tole());
  panneau(k, "connectee", 3.5, ye + 1.7, A.z1 - 0.48, 9.8, 3.06, 0, 0);
  // Les antennes « connectées »
  k.tube([12, A.toit + 0.2, 13], [12, A.toit + 4.2, 13], 0.05, 0x8b8f8c, M.tole(), 5);
  for (const [x, z, ry] of [[13.8, 15.2, 0.8], [10.5, 12.6, -0.6]]) {
    const g = new THREE.CylinderGeometry(0.7, 0.08, 0.35, 10, 1, true);
    k.poser(g, M.tole(), 0xd2cdc0, { x, y: A.toit + 1.3, z, rx: 0.9, ry });
    g.dispose();
    k.tube([x, A.toit + 0.2, z], [x, A.toit + 1.1, z], 0.04, 0x8b8f8c, M.tole(), 5);
  }
  k.pave(1, A.toit + 0.22, A.z0 + 1.5, 3, A.toit + 1.3, A.z0 + 3, 0xb7b3a8, M.tole()); // le groupe de clim
  for (const [x, z, r] of [[6, 14, 2.2], [-3, 12, 1.5]]) k.pave(x - r, A.toit + 0.22, z - r * 0.6, x + r, A.toit + 0.25, z + r * 0.6, PALETTE.mousse, beton, { crasse: false }); // la mousse

  // --- La salle de commande ---
  const vert = 0x56645b;
  c.pave(A.x0 + 0.2, 0, 10.9, A.x0 + 0.8, 2.6, 17.4, vert, M.tole());
  panneau(c, "cadrans", A.x0 + 0.82, 1.45, 14.15, 6.2, 2.32, PI / 2);
  c.pave(A.x0 + 0.8, 0, A.z0 + 0.25, 1.0, 2.6, 10.85, vert, M.tole());
  panneau(c, "cadrans", -2.1, 1.45, 10.87, 6.0, 2.25);
  obstacleRect(b, A.x0 + 0.2, A.z0 + 0.25, 1.0, 10.85, "armoires de cadrans");
  b.obstacle(A.x0 + 0.8, 10.9, A.x0 + 0.8, 17.4, "armoires de cadrans");
  // Les pupitres en arc
  const O = [0.8, 15.2];
  const segs = [180, 202.5, 225, 247.5, 270];
  const pts = [];
  for (const deg of segs) {
    const ph = (deg * PI) / 180;
    const x = O[0] + 2.6 * Math.cos(ph);
    const z = O[1] + 2.6 * Math.sin(ph);
    pts.push([x, z]);
    const ry = Math.atan2(-Math.cos(ph), -Math.sin(ph));
    c.repere({ x, z, ry }, () => {
      c.boite(1.02, 0.75, 0.8, 0x4c5852, { y: 0.375 }, M.tole());
      c.boite(1.02, 0.05, 0.62, 0x3f4943, { y: 0.84, z: 0.02, rx: 0.35 }, M.tole());
      if (fin) {
        c.boite(1.02, 0.42, 0.14, 0x4c5852, { y: 1.08, z: -0.36 }, M.tole());
        panneau(c, "pupitre", 0, 0.885, 0.035, 0.95, 0.47, 0, -(PI / 2 - 0.35));
      }
    });
  }
  for (let i = 0; i < pts.length - 1; i++) b.obstacle(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], "pupitre");
  // Le voyant rouge qui clignote encore (la seule chose qui marche)
  {
    const ph = (225 * PI) / 180;
    const x = O[0] + 2.45 * Math.cos(ph);
    const z = O[1] + 2.45 * Math.sin(ph);
    const g = new THREE.IcosahedronGeometry(0.05, 0);
    g.translate(x, 1.0, z);
    const voyant = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xff2a1a }));
    voyant.userData.animer = (t) => voyant.material.color.setRGB(Math.sin(t * 3.4) > 0.2 ? 1 : 0.12, 0.08, 0.05);
    b.ajouter(voyant);
    b.lumiere(x, 1.25, z, 0xff3a2a, 3, 6, "voyant rouge du pupitre (clignote)");
  }
  if (fin) {
    // Les fauteuils, dont un renversé
    for (const [deg, tombe] of [[200, false], [238, false], [262, true]]) {
      const ph = (deg * PI) / 180;
      const x = O[0] + 1.5 * Math.cos(ph);
      const z = O[1] + 1.5 * Math.sin(ph);
      if (tombe) {
        c.repere({ x, z, ry: 0.7 }, () => {
          c.boite(0.5, 0.5, 0.08, 0x6a5a48, { y: 0.27, rx: 0 }, M.mat());
          c.boite(0.5, 0.08, 0.5, 0x6a5a48, { y: 0.27, z: 0.3, rx: 0 }, M.mat());
          c.poutre([0, 0.3, 0.3], [0, 0.3, 0.9], 0.06, 0x3d4a52, M.metal());
        });
        continue;
      }
      c.repere({ x, z, ry: c.entre(-1, 1) }, () => {
        c.boite(0.6, 0.04, 0.08, 0x3d4a52, { y: 0.06 }, M.metal());
        c.boite(0.08, 0.04, 0.6, 0x3d4a52, { y: 0.06 }, M.metal());
        c.poutre([0, 0.06, 0], [0, 0.45, 0], 0.05, 0x3d4a52, M.metal());
        c.boite(0.5, 0.08, 0.5, 0x6a5a48, { y: 0.48 }, M.mat());
        c.boite(0.46, 0.55, 0.07, 0x6a5a48, { y: 0.8, z: 0.24, rx: 0.12 }, M.mat());
      });
    }
    // L'étagère de manuels techniques
    {
      const z0 = A.z0 + 0.28;
      for (const x of [2.0, 5.2]) c.pave(x, 0, z0, x + 0.04, 2.3, z0 + 0.4, C.acierGris, M.tole());
      const tons = [0xb08a45, 0x3f6f70, 0xd9cfb6, 0x6d716c, 0x8a4a3a];
      for (const y of [0.1, 0.65, 1.2, 1.75]) {
        c.pave(2.0, y, z0, 5.24, y + 0.03, z0 + 0.4, C.acierGris, M.tole());
        for (let x = 2.1; x < 5.1; x += c.entre(0.07, 0.12)) {
          if (c.hasard() < 0.18) continue;
          c.boite(0.07, 0.31, 0.27, tons[Math.floor(c.hasard() * tons.length)], { x, y: y + 0.18, z: z0 + 0.2, rz: c.hasard() < 0.1 ? 0.3 : 0 }, M.mat(), { nuance: 0.08, crasse: false });
        }
      }
      for (let i = 0; i < 8; i++) c.boite(0.27, 0.07, 0.31, tons[i % tons.length], { x: c.entre(2.2, 5), y: 0.12, z: c.entre(11.2, 12.4), ry: c.hasard() * 3 }, M.mat(), { crasse: false });
      obstacleRect(b, 2.0, z0, 5.24, z0 + 0.4, "étagère");
    }
    // L'armoire des batteries de secours, porte ouverte, une petite diode verte
    {
      const z0 = A.z0 + 0.28;
      c.pave(5.6, 0, z0, 7.6, 2.0, z0 + 0.6, 0x7a7f7a, M.tole());
      c.repere({ x: 7.6, z: z0 + 0.62, ry: -1.9 }, () => c.boite(0.98, 1.9, 0.03, 0x7a7f7a, { x: 0.5, y: 1.0 }, M.tole()));
      for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) c.boite(0.4, 0.3, 0.3, 0x2f3436, { x: 5.85 + i * 0.47, y: 0.3 + j * 0.6, z: z0 + 0.4 }, M.mat());
      c.boite(0.04, 0.04, 0.02, 0x8cff7a, { x: 7.4, y: 1.8, z: z0 + 0.61 }, M.mat(), { crasse: false });
      b.lumiere(7.3, 1.8, z0 + 0.9, 0x6aff6a, 0.8, 3, "diode verte des batteries de secours");
      obstacleRect(b, 5.6, z0, 7.6, z0 + 0.6, "armoire des batteries");
    }
    panneau(c, "joursSansPanne", 7.88, 1.85, 13.4, 1.8, 0.72, -PI / 2);
    jonchee(c, -4.5, 12, 4, 17, 50, [0xe8e2d2, 0xd9d2c0, 0xc9c0aa], 0.09);

    // --- La salle de méditation énergétique ---
    panneau(c, "respirez", 12, 1.95, A.z0 + 0.27, 1.7, 1.7);
    const tapis = [0x3f7f7d, 0xb0904a, 0xcfc3a6, 0x6f8f7a];
    for (let i = 0; i < 4; i++) c.boite(0.62, 0.025, 1.8, tapis[i], { x: 9.5 + i * 1.5, y: 0.115, z: 14.6, ry: c.entre(-0.12, 0.12) }, M.mat(), { crasse: false });
    for (const [x, z, t] of [[9.4, 16.9, 0xb0904a], [14.9, 12.2, 0x3f7f7d], [13.4, 17.0, 0xa8463a]]) {
      const g = new THREE.IcosahedronGeometry(1, 1);
      c.poser(g, M.mat(), t, { x, y: 0.3, z, e: [0.5, 0.32, 0.5] }, { nuance: 0.06 });
      g.dispose();
    }
    // Le gong
    for (const z of [11.2, 12.8]) c.poutre([15.4, 0.08, z], [15.4, 1.85, z], 0.07, PALETTE.boisSombre, M.mat());
    c.poutre([15.4, 1.82, 11.1], [15.4, 1.82, 12.9], 0.08, PALETTE.boisSombre, M.mat());
    {
      const g = new THREE.CylinderGeometry(0.5, 0.5, 0.04, 14);
      c.poser(g, M.metal(), PALETTE.laiton, { x: 15.4, y: 1.1, z: 12, rz: PI / 2 });
      g.dispose();
    }
    // La plante en plastique, morte quand même ; la fontaine zen, à sec
    cylY(c, 9, A.z0 + 0.8, 0.08, 0.5, 0.18, 0.24, 0xd2cdc0, M.mat(), 8);
    arbuste(c, 9, A.z0 + 0.8, 0.5, 0.5, [0x7d6143, 0x6a5a48, 0x8a7450]);
    cylY(c, 14.8, 16.8, 0.08, 0.35, 0.45, 0.4, 0x6f6a60, M.mat(), 10);
    gravats(c, 14.8, 16.8, 0.3, 6, [0xd8d2c4, 0x5a5650], 0.3);
  }
}

// ---------- La chaufferie (murée, inaccessible) ----------

function chaufferie(ctx, efface) {
  const { b, c, u } = ctx;
  const H = CHAUFFERIE;
  const brique = M.brique();
  // Le soubassement de brique
  const m = { h: 4, ep: 0.5, couleur: C.brique, mat: brique, batiment: b };
  mur(c, [H.x0, H.z1], [H.x0, H.z0], m);
  mur(c, [H.x0, H.z0], [H.x1, H.z0], m);
  mur(c, [H.x1, H.z0], [H.x1, H.z1], m);
  const k = efface ? b.couche("chaufferie : bardage, charpente", { x: (H.x0 + H.x1) / 2, z: (H.z0 + H.z1) / 2, l: H.x1 - H.x0 + 1.2, p: H.z1 - H.z0 + 1.2 }, 4, H.h + 1) : c;
  // Le noyau sombre (on le voit par les tôles manquantes)
  k.pave(H.x0 + 0.6, 4, H.z0 + 0.6, H.x1 - 0.6, H.h - 0.3, H.z1 + 0.2, C.suie, M.tole(), { crasse: false });
  // La charpente et le bardage, face par face
  const faces = [
    { a: [H.x0, H.z1], b: [H.x0, H.z0], n: [-1, 0] },
    { a: [H.x0, H.z0], b: [H.x1, H.z0], n: [0, -1] },
    { a: [H.x1, H.z0], b: [H.x1, H.z1], n: [1, 0] },
    { a: [H.x1, H.z1], b: [H.x0, H.z1], n: [0, 1], depuis: SALLE.h },
  ];
  const niveaux = [4, 11.3, 18.6, H.h];
  for (const f of faces) {
    const L = Math.hypot(f.b[0] - f.a[0], f.b[1] - f.a[1]);
    const nb = Math.round(L / 4);
    const t = [(f.b[0] - f.a[0]) / L, (f.b[1] - f.a[1]) / L];
    const ry = -Math.atan2(t[1], t[0]);
    const y0 = f.depuis ?? 4;
    for (let i = 0; i <= nb; i++) {
      const x = f.a[0] + t[0] * (i * L) / nb + f.n[0] * 0.1;
      const z = f.a[1] + t[1] * (i * L) / nb + f.n[1] * 0.1;
      k.boite(0.35, H.h - y0, 0.35, C.acier, { x, y: (H.h + y0) / 2, z, ry }, M.tole());
    }
    for (const y of niveaux) if (y >= y0) k.boite(L, 0.3, 0.3, C.acier, { x: (f.a[0] + f.b[0]) / 2 + f.n[0] * 0.1, y, z: (f.a[1] + f.b[1]) / 2 + f.n[1] * 0.1, ry }, M.tole());
    for (let i = 0; i < nb; i++)
      for (let j = 0; j < 3; j++) {
        const ya = Math.max(niveaux[j], y0);
        const yb = niveaux[j + 1];
        if (yb <= ya) continue;
        const cx = f.a[0] + t[0] * ((i + 0.5) * L) / nb + f.n[0] * 0.2;
        const cz = f.a[1] + t[1] * ((i + 0.5) * L) / nb + f.n[1] * 0.2;
        if (j === 2 && f.n[1] === 0) {
          vitre(k, u, cx, (ya + yb) / 2, cz, L / nb - 0.3, yb - ya - 0.4, ry);
          continue;
        }
        const r = c.hasard();
        if (r < 0.1 + 0.3 * u) continue; // tôle partie
        const penche = r < 0.18 + 0.32 * u;
        k.boite(L / nb - 0.1, yb - ya - 0.1, 0.06, c.hasard() < 0.5 ? C.tole : 0x9a7c62, { x: cx + f.n[0] * (penche ? 0.4 : 0), y: (ya + yb) / 2 - (penche ? 0.6 : 0), z: cz + f.n[1] * (penche ? 0.4 : 0), ry, rx: penche ? 0.25 : 0, rz: penche ? c.entre(-0.2, 0.2) : 0 }, M.bardage(), { nuance: 0.06 });
      }
  }
  // Le toit : dalle, acrotère, lanterneaux de ventilation
  k.pave(H.x0 - 0.2, H.h, H.z0 - 0.2, H.x1 + 0.2, H.h + 0.3, H.z1 + 0.2, C.betonSombre, M.tole());
  for (const [x, z] of [[0, -14], [8, -14], [16, -14]]) k.pave(x - 1.5, H.h + 0.3, z - 2, x + 1.5, H.h + 2.2, z + 2, C.tole, M.bardage());
  // Le caisson de fumées, vers la cheminée
  {
    const a = [H.x1, 10.5, -17.5];
    const d = [CHEMINEE.x - 2.4, 10.5, CHEMINEE.z + 1.8];
    const L = Math.hypot(d[0] - a[0], d[2] - a[2]);
    const ry = -Math.atan2(d[2] - a[2], d[0] - a[0]);
    k.boite(L, 3, 2.6, C.rouille, { x: (a[0] + d[0]) / 2, y: 10.5, z: (a[2] + d[2]) / 2, ry }, M.bardage());
    for (const f of [0.3, 0.7]) {
      const x = a[0] + (d[0] - a[0]) * f;
      const z = a[2] + (d[2] - a[2]) * f;
      for (const s of [-1, 1]) k.poutre([x + s * 1.1 * Math.sin(-ry), 0, z + s * 1.1 * Math.cos(ry)], [x + s * 1.1 * Math.sin(-ry), 9, z + s * 1.1 * Math.cos(ry)], 0.3, C.acier, M.tole());
    }
  }
  lierre(c, H.x0 - 0.3, 0, -12, -PI / 2, 4, 3.6, 40);
}

// ---------- La cheminée ----------

function cheminee(ctx, efface) {
  const { b, c } = ctx;
  const { x, z, h } = CHEMINEE;
  const brique = M.brique();
  const r = (y) => 3.0 - ((y - 2.2) / (h - 2.2)) * 1.25;
  cylY(c, x, z, 0, 2.2, 4.0, 3.8, C.betonSombre, M.beton(), 8);
  cylY(c, x, z, 2.2, 6, r(2.2), r(6), C.brique, brique, 16, true);
  obstacleRect(b, x - 3.6, z - 3.6, x + 3.6, z + 3.6, "cheminée");
  const k = efface ? b.couche("cheminée", { x, z, l: 8, p: 8 }, 6, h + 1) : c;
  cylY(k, x, z, 6, h, r(6), r(h), C.brique, brique, 16, true);
  for (const y of [16, 30, 44]) cylY(k, x, z, y, y + 0.8, r(y) + 0.12, r(y + 0.8) + 0.12, 0xcfc8b8, brique, 16, true);
  // Le haut, à bandes rouges et blanches passées (balisage aérien)
  for (let i = 0; i < 4; i++) {
    const y = h - 8 + i * 2;
    cylY(k, x, z, y, y + 2, r(y) + 0.06, r(y + 2) + 0.06, i % 2 ? 0xd8cfb8 : 0xa8463a, brique, 16, true);
  }
  cylY(k, x, z, h, h + 0.6, r(h) + 0.3, r(h) + 0.3, C.betonSombre, brique, 16);
  // L'échelle, côté sud-est
  const th = 0.7;
  const d = [Math.sin(th), Math.cos(th)];
  const chemin = [];
  for (const y of [0.5, 12, 24, 36, 48, h + 0.6]) chemin.push([x + d[0] * r(Math.max(2.2, y)), y, z + d[1] * r(Math.max(2.2, y))]);
  echelle(k, chemin, d, 0x4a3a30, brique, 2.6, 0.9, 3.5);
}

// ---------- Le convoyeur à charbon ----------

function convoyeur(ctx) {
  const { b, c, u } = ctx;
  const A = new THREE.Vector3(47, 3, -30);
  const B = new THREE.Vector3(CHAUFFERIE.x1 + 0.3, 19, -14.5);
  const d = B.clone().sub(A);
  const L = d.length();
  d.normalize();
  const n = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 1, 0)).normalize();
  const h = new THREE.Vector3().crossVectors(n, d).normalize();
  const k = b.couche("convoyeur à charbon", { x: (A.x + B.x) / 2, z: (A.z + B.z) / 2, l: Math.abs(B.x - A.x) + 4, p: Math.abs(B.z - A.z) + 4 }, 2.5, 23);
  const w = 2.6;
  const H = 2.4;
  const pt = (t, sn, sh) => A.clone().addScaledVector(d, t * L).addScaledVector(n, (sn * w) / 2).addScaledVector(h, sh * H).toArray();
  const mat = M.tole();
  const coul = C.rouille;
  for (const sn of [-1, 1]) for (const sh of [0, 1]) k.poutre(pt(0, sn, sh), pt(1, sn, sh), 0.18, coul, mat);
  const N = Math.ceil(L / 3);
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    for (const sn of [-1, 1]) {
      k.poutre(pt(t, sn, 0), pt(t, sn, 1), 0.1, coul, mat);
      if (i < N) k.poutre(pt(t, sn, 0), pt((i + 1) / N, sn, 1), 0.08, coul, mat);
    }
    k.poutre(pt(t, -1, 1), pt(t, 1, 1), 0.1, coul, mat);
    k.poutre(pt(t, -1, 0), pt(t, 1, 0), 0.1, coul, mat);
    if (i < N) {
      // La tôle du toit et des flancs, à moitié partie
      if (c.hasard() > 0.2 + 0.35 * u) quad(k, M.bardage(), C.rouille, [pt(t, -1, 1.02), pt(t, 1, 1.02), pt((i + 1) / N, 1, 1.02), pt((i + 1) / N, -1, 1.02)], undefined, true, true);
      for (const sn of [-1, 1]) if (c.hasard() > 0.35 + 0.35 * u) quad(k, M.bardage(), C.tole, [pt(t, sn * 1.02, 0.5), pt((i + 1) / N, sn * 1.02, 0.5), pt((i + 1) / N, sn * 1.02, 1), pt(t, sn * 1.02, 1)], undefined, true, true);
    }
  }
  // La bande et ses rouleaux
  k.poutre(pt(0, 0, 0.12), pt(1, 0, 0.12), 0.14, 0x2b2a28, M.tole());
  // Les chevalets
  for (const t of [0.3, 0.66]) {
    const base = A.clone().addScaledVector(d, t * L);
    const dh = new THREE.Vector3(d.x, 0, d.z).normalize();
    for (const sn of [-1, 1])
      for (const sd of [-1, 1]) {
        const pied = base.clone().addScaledVector(n, sn * (w / 2 + 1.4)).addScaledVector(dh, sd * 1.2);
        pied.y = 0;
        k.poutre(pied.toArray(), pt(t, sn, 0), 0.22, C.rouilleSombre, mat);
      }
    for (const yy of [0.33, 0.66]) {
      const y = base.y * yy;
      const p1 = base.clone().addScaledVector(n, -(w / 2 + 1.4 * (1 - yy)));
      const p2 = base.clone().addScaledVector(n, w / 2 + 1.4 * (1 - yy));
      k.poutre([p1.x, y, p1.z], [p2.x, y, p2.z], 0.12, C.rouilleSombre, mat);
    }
  }
  // La tête motrice contre la chaufferie
  k.boite(3.4, 3.2, 3.6, C.tole, { x: B.x + 1.4, y: B.y + 1.2, z: B.z }, M.bardage());
  // La trémie de chargement au pied, et le parc à charbon
  {
    const x = A.x + 1.2;
    const z = A.z - 0.8;
    for (const [dx, dz] of [[-1.3, -1.3], [1.3, -1.3], [1.3, 1.3], [-1.3, 1.3]]) c.poutre([x + dx, 0, z + dz], [x + dx, 3.2, z + dz], 0.22, C.rouilleSombre, M.tole());
    const g = new THREE.CylinderGeometry(2.1, 0.5, 2.2, 4, 1, true);
    c.poser(g, M.tole(), C.rouille, { x, y: 4.2, z, ry: PI / 4 });
    g.dispose();
    obstacleRect(b, x - 1.5, z - 1.5, x + 1.5, z + 1.5, "trémie");
  }
  for (let i = 0; i < 9; i++) {
    const g = new THREE.IcosahedronGeometry(1, 0);
    c.poser(g, M.mat(), C.suie, { x: 43 + c.entre(-3, 3), y: 0.2, z: -24 + c.entre(-3, 2.5), e: [c.entre(1.4, 2.6), c.entre(0.5, 1.1), c.entre(1.4, 2.4)], ry: c.hasard() * 3 }, { nuance: 0.04, crasse: false });
    g.dispose();
  }
  semerTouffes(c, 39, -28, 47, -20, 20);
}

// ---------- Le poste de transformation, le pylône, la voie ferrée ----------

function transformateur(c, x, z, ry, simple) {
  c.repere({ x, z, ry }, () => {
    c.pave(-2, 0, -1.5, 2, 0.4, 1.5, C.betonSombre, M.beton());
    c.pave(-1.6, 0.4, -1.0, 1.6, 3.0, 1.0, 0x6b7a72, M.tole());
    for (const s of [-1, 1]) for (let i = 0; i < (simple ? 2 : 6); i++) c.boite(0.08, 2.2, 0.55, 0x5d6b64, { x: -1.3 + i * (simple ? 2.6 : 0.52), y: 1.65, z: s * 1.3 }, M.tole());
    cylX(c, -1.2, 1.2, 3.65, -0.5, 0.36, 0x6b7a72, M.tole(), 8);
    for (let i = 0; i < 3; i++) {
      const xx = -0.8 + i * 0.8;
      cylY(c, xx, 0.35, 3.0, 4.4, 0.16, 0.1, C.porcelaine, M.mat(), 6);
      if (!simple) for (let q = 0; q < 4; q++) cylY(c, xx, 0.35, 3.2 + q * 0.3, 3.28 + q * 0.3, 0.24, 0.24, C.porcelaine, M.mat(), 6);
      cylY(c, xx, -0.3, 3.0, 3.6, 0.09, 0.07, 0x4a4a46, M.mat(), 5);
    }
  });
}

function posteTransformation(ctx, simple) {
  const { b, c } = ctx;
  const [x1, z1, x2, z2] = [39.5, 12.5, 49.5, 25.5];
  c.pave(x1, -0.02, z1, x2, 0.06, z2, 0x8a877e, M.beton(), { crasse: false });
  // Gravier
    transformateur(c, 42.4, 16.8, 0, simple);
  transformateur(c, 46.9, 16.8, 0, simple);
  transformateur(c, 44.6, 21.6, 0, simple);
  for (const [x, z] of [[42.4, 16.8], [46.9, 16.8], [44.6, 21.6]]) obstacleRect(b, x - 2, z - 1.5, x + 2, z + 1.5, "transformateur");
  // La clôture, son portail ouvert, les panneaux
  const poteaux = [];
  for (let x = x1; x <= x2 + 0.01; x += 2.5) poteaux.push([x, z1], [x, z2]);
  for (let z = z1 + 2.6; z < z2 - 0.5; z += 2.6) poteaux.push([x1, z], [x2, z]);
  for (const [x, z] of poteaux) c.poutre([x, 0, z], [x, 2.2, z], 0.08, 0x7d8279, M.metal());
  for (const y of [0.4, 1.2, 2.0]) {
    c.poutre([x1, y, z2], [x2, y, z2], 0.025, 0x7d8279, M.metal());
    c.poutre([x1, y, z1], [x2, y, z1], 0.025, 0x7d8279, M.metal());
    c.poutre([x2, y, z1], [x2, y, z2], 0.025, 0x7d8279, M.metal());
    c.poutre([x1, y, z1], [x1, y, 17.5], 0.025, 0x7d8279, M.metal());
    c.poutre([x1, y, 20.5], [x1, y, z2], 0.025, 0x7d8279, M.metal());
  }
  b.obstacle(x1, z2, x2, z2, "clôture");
  b.obstacle(x1, z1, x2, z1, "clôture");
  b.obstacle(x2, z1, x2, z2, "clôture");
  b.obstacle(x1, z1, x1, 17.5, "clôture");
  b.obstacle(x1, 20.5, x1, z2, "clôture");
  c.boite(2.8, 2.0, 0.05, 0x7d8279, { x: x1 - 1.0, y: 1.1, z: 18.6, ry: 1.0 }, M.metal());
  panneau(c, "danger", 44.5, 1.5, z2 + 0.05, 0.6, 0.6);
  panneau(c, "danger", 38.9, 1.5, 21.5, 0.6, 0.6, -PI / 2);
  // Le portique d'arrivée des lignes
  for (const x of [41.5, 47.5]) c.poutre([x, 0, 24.6], [x, 10, 24.6], 0.4, 0x7d8279, M.tole());
  c.poutre([41.3, 10, 24.6], [47.7, 10, 24.6], 0.35, 0x7d8279, M.tole());
  for (let i = 0; i < 3; i++) {
    const x = 42.6 + i * 2;
    c.tube([x, 10, 24.6], [x, 9.0, 24.6], 0.1, C.porcelaine, M.mat(), 5);
    c.poutre([x, 9.0, 24.6], [44.6 - 0.8 + i * 0.8, 4.4, 21.95], 0.03, 0x2b2b2b, M.metal());
  }
  semerTouffes(c, x1, z1, x2, z2, 10);
}

function pylone(ctx, x, z, ry) {
  // Le pylône est une couche : il s'efface quand il cache le personnage (il est en avant-plan, au sud-est).
  const c = ctx.b.couche("pylône", { x, z, l: 14, p: 14 }, 0, 33);
  const coul = 0x7d8279;
  const mat = M.metal();
  const lv = [0, 6, 12, 17, 21.5, 26, 30];
  const demi = (y) => (y <= 21.5 ? 3.4 - (y / 21.5) * 2.6 : 0.8 - ((y - 21.5) / 8.5) * 0.35);
  c.repere({ x, z, ry }, () => {
    for (let i = 0; i < lv.length - 1; i++) {
      const y1 = lv[i];
      const y2 = lv[i + 1];
      const a = demi(y1);
      const bb = demi(y2);
      const coins = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
      for (const [sx, sz] of coins) c.poutre([sx * a, y1, sz * a], [sx * bb, y2, sz * bb], 0.18, coul, mat);
      for (let q = 0; q < 4; q++) {
        const [sx, sz] = coins[q];
        const [tx, tz] = coins[(q + 1) % 4];
        c.poutre([sx * a, y1, sz * a], [tx * bb, y2, tz * bb], 0.08, coul, mat);
        c.poutre([tx * a, y1, tz * a], [sx * bb, y2, sz * bb], 0.08, coul, mat);
        c.poutre([sx * bb, y2, sz * bb], [tx * bb, y2, tz * bb], 0.08, coul, mat);
      }
    }
    // Les consoles et les chaînes d'isolateurs, les câbles qui partent au loin
    for (const [y, l] of [[21.5, 6.5], [26, 4.8]]) {
      for (const s of [-1, 1]) {
        c.poutre([0, y, 0.6], [s * l, y, 0.1], 0.14, coul, mat);
        c.poutre([0, y, -0.6], [s * l, y, -0.1], 0.14, coul, mat);
        c.poutre([0, y + 2.2, 0], [s * l, y, 0], 0.1, coul, mat);
        c.tube([s * l, y, 0], [s * l, y - 1.8, 0], 0.11, C.porcelaine, M.metal(), 5);
        for (const sens of [-1, 1]) {
          const p0 = [s * l, y - 1.8, 0];
          const loin = [s * l, y - 4, sens * 30];
          const mi = [s * l, y - 5, sens * 15];
          c.poutre(p0, mi, 0.035, 0x2b2b2b, M.metal());
          c.poutre(mi, loin, 0.035, 0x2b2b2b, M.metal());
        }
      }
    }
    c.poutre([0, 30, 0], [0, 32, 0], 0.08, coul, mat);
  });
}

function voieFerree(ctx, x1, x2) {
  const { c, u } = ctx;
  const z = 3;
  c.pave(x1, -0.02, z - 1.5, x2, 0.12, z + 1.5, 0x77746c, M.mat(), { crasse: false, nuance: 0.03 });
  for (let x = x1 + 0.4; x < x2; x += 0.8) c.boite(0.24, 0.12, 2.5, PALETTE.boisGris, { x, y: 0.16, z, ry: c.entre(-0.04, 0.04) }, M.mat(), { nuance: 0.08 });
  for (const dz of [-0.72, 0.72]) c.pave(x1, 0.22, z + dz - 0.04, x2, 0.32, z + dz + 0.04, 0x6d5a4a, M.metal());
  semerTouffes(c, x1, z - 1.4, x2, z + 1.4, Math.round(20 + 30 * u));
  // Le wagon-trémie, rouillé, resté devant la porte
  const xw = 46.6;
  c.repere({ x: xw, z, rz: 0.015 }, () => {
    c.pave(-3.1, 0.75, -1.3, 3.1, 1.0, 1.3, 0x3a3532, M.tole());
    c.pave(-2.9, 1.0, -1.35, 2.9, 3.3, 1.35, C.rouille, M.tole());
    c.pave(-3.0, 3.2, -1.4, 3.0, 3.35, 1.4, C.rouilleSombre, M.tole());
    for (const xx of [-2.2, -1.1, 0, 1.1, 2.2]) c.pave(xx - 0.06, 1.0, 1.35, xx + 0.06, 3.3, 1.42, C.rouilleSombre, M.tole());
    for (const xx of [-2.1, 2.1])
      for (const s of [-1, 1]) {
        const g = new THREE.CylinderGeometry(0.45, 0.45, 0.12, 10);
        c.poser(g, M.tole(), 0x3a3532, { x: xx, y: 0.6, z: s * 0.72, rx: PI / 2 });
        g.dispose();
      }
    for (const s of [-1, 1]) c.poutre([s * 3.1, 0.85, 0], [s * 3.6, 0.85, 0], 0.15, 0x3a3532, M.tole());
  });
  ctx.b.obstacle(xw - 3.1, z - 1.4, xw + 3.1, z - 1.4, "wagon");
  ctx.b.obstacle(xw - 3.1, z + 1.4, xw + 3.1, z + 1.4, "wagon");
}

// ---------- Les tuyauteries entre la salle, la chaufferie et la tour ----------

function tuyauteries(ctx) {
  const { b, c } = ctx;
  // Les deux conduites d'eau de refroidissement, sur leurs selles de béton
  for (const z of [-5.6, -2.8]) {
    tuyau(c, [[SALLE.x0 - 0.2, 1.1, z], [-12.2, 1.1, z], [-13.6, 0.5, z]], 0.7, z < -4 ? 0x6b7a72 : C.rouille, M.tole(), 10);
    for (let x = -7.5; x > -12.5; x -= 2.4) c.pave(x - 0.3, 0, z - 0.6, x + 0.3, 0.55, z + 0.6, C.betonSombre, M.beton());
  }
  b.obstacle(SALLE.x0, -6.4, -13.6, -6.4, "conduites");
  b.obstacle(SALLE.x0, -2.0, -13.6, -2.0, "conduites");
  // Le rack de tuyauteries depuis la chaufferie
  for (const x of [-7.2, -10, -12.6]) {
    for (const dz of [-1, 1]) c.poutre([x, 0, -15 + dz], [x, 4.6, -15 + dz], 0.25, C.acier, M.tole());
    c.poutre([x, 4.6, -16.1], [x, 4.6, -13.9], 0.25, C.acier, M.tole());
  }
  tuyau(c, [[CHAUFFERIE.x0, 5.0, -15.6], [-13.4, 5.0, -15.6], [-13.4, 0, -15.6]], 0.28, 0x6b7a72, M.tole(), 8);
  tuyau(c, [[CHAUFFERIE.x0, 5.0, -14.9], [-13.0, 5.0, -14.9], [-13.0, 2.0, -14.9], [-13.8, 0.6, -14.9]], 0.22, C.rouille, M.tole(), 8);
  tuyau(c, [[CHAUFFERIE.x0, 5.0, -14.3], [-12.6, 5.0, -14.3], [-12.6, 0, -14.3]], 0.16, 0xb5a46a, M.tole(), 6);
  {
    const g = new THREE.TorusGeometry(0.45, 0.05, 4, 10);
    c.poser(g, M.tole(), C.jaune, { x: -13.4, y: 1.4, z: -15.0, rx: 0 });
    g.dispose();
  }
}

// ---------- La végétation du site ----------

function vegetation(ctx, x1, z1, x2, z2) {
  const { c, u } = ctx;
  const arbres = [
    [-40, 18, 9], [-45, 25, 7], [-36, 29, 8], [-24, 26, 6], [-14, 24, 7.5], [20, 30, 8], [10, 31, 6], [-2, 28, 5],
    [48, -10, 7], [-46, -30, 9], [-8, -29, 7], [-47, 6, 8], [30, 24, 5], [-44, -18, 6], [24, -32, 8], [36, -14, 6],
  ];
  for (const [x, z, h] of arbres) {
    if (x < x1 || x > x2 || z < z1 || z > z2) continue;
    arbre(c, x, z, h * (0.75 + 0.4 * u), c.hasard() < 0.75 ? "bouleau" : "feuillu");
    if (c.hasard() < 0.6) arbuste(c, x + c.entre(-2, 2), z + c.entre(-2, 2), c.entre(0.8, 1.5));
  }
  const buissons = [[-6.8, 12], [-7, -10], [17, 19], [-12.5, 6], [38.8, -6], [23, -9], [-14, -20], [6, 20], [37, 26], [-30, 10], [-18, 12]];
  for (const [x, z] of buissons) if (x > x1 && x < x2 && z > z1 && z < z2) arbuste(c, x, z, c.entre(0.9, 1.6));
  // Le lierre sur les piliers de la tour, du côté de la brèche
  for (let i = BRECHE - 2; i <= BRECHE + 3; i++) {
    const th = thetaPied(i);
    const x = TOUR.x + 15.9 * Math.sin(th);
    const z = TOUR.z + 15.9 * Math.cos(th);
    if (x > x1 && x < x2 && z > z1 && z < z2) lierre(c, x, 0, z, th, 1.2, 2.8 + c.hasard(), 18);
  }
  semerTouffes(c, x1, z1, x2, z2, Math.round(20 + 40 * u), PALETTE.herbeSeche);
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

export function creer({ usure = 0.7, carte = "site" } = {}) {
  const def = CARTES.find((k) => k.id === carte) ?? CARTES[0];
  const o = ORIGINES[def.id];
  const b = new Batiment(1931, usure);
  const ctx = { b, c: b.c, u: usure };
  const lot = [o.x - def.lot.l / 2, o.z - def.lot.p / 2, o.x + def.lot.l / 2, o.z + def.lot.p / 2];

  sol(ctx, ...lot);
  if (def.id === "site") {
    tour(ctx, "moyen");
    salle(ctx, "moyen");
    annexe(ctx, "moyen");
    chaufferie(ctx, true);
    cheminee(ctx, true);
    convoyeur(ctx);
    posteTransformation(ctx, true);
    pylone(ctx, 45, 31.5, 0);
    voieFerree(ctx, SALLE.x1 + 0.3, 50);
    tuyauteries(ctx);
    vegetation(ctx, ...lot);
  } else if (def.id === "turbines") {
    salle(ctx, "fin");
    annexe(ctx, "fin");
    chaufferie(ctx, false);
    cheminee(ctx, false);
    tour(ctx, "fond");
    posteTransformation(ctx, true);
    pylone(ctx, 45, 31.5, 0);
    voieFerree(ctx, SALLE.x1 + 0.3, 51);
    tuyauteries(ctx);
    vegetation(ctx, ...lot);
  } else {
    tour(ctx, "fin");
    salle(ctx, "fond");
    chaufferie(ctx, false);
    cheminee(ctx, false);
    tuyauteries(ctx);
    vegetation(ctx, ...lot);
  }
  return recentrer(b.construire(), o, def.lot);
}
