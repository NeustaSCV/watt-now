// Les textures de la halte du passage à niveau : bitume, herbe, tuiles mécaniques, tôle ondulée, grillage, et l'atlas
// de tout ce qui est peint ou imprimé (une seule texture, un seul appel de dessin par couche).
// Toutes les textures « monde » sont claires et neutres : la teinte des sommets les colore.

import * as THREE from "three";
import { dessiner, aleatoire, taches, matiereTexture } from "../commun/atelier.js";

const TAU = Math.PI * 2;
const PI = Math.PI;

function grain(g, a, n, l, h, force) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = a() < 0.5 ? `rgba(0,0,0,${force})` : `rgba(255,255,255,${force})`;
    g.fillRect(a() * l, a() * h, 1 + a() * 3, 1 + a() * 3);
  }
}

function fissure(g, a, x, y, pas, n, couleur, largeur = 1.2) {
  g.strokeStyle = couleur;
  g.lineWidth = largeur;
  g.beginPath();
  g.moveTo(x, y);
  for (let k = 0; k < n; k++) {
    x += (a() - 0.5) * pas * 1.6;
    y += (a() - 0.3) * pas;
    g.lineTo(x, y);
  }
  g.stroke();
}

// ---------- Textures « monde » ----------

/** Le bitume de la rue : granulat, rapiéçages plus sombres, faïençage, fissures. Tuile de 8 m. */
export function texBitume() {
  return dessiner("pn-bitume", 256, 256, (g) => {
    const a = aleatoire(7101);
    g.fillStyle = "#c9c7c2";
    g.fillRect(0, 0, 256, 256);
    grain(g, a, 5000, 256, 256, 0.07);
    // rapiéçages (rectangles de bitume plus neuf)
    for (let i = 0; i < 4; i++) {
      g.fillStyle = `rgba(40,40,40,${0.08 + a() * 0.08})`;
      g.fillRect(a() * 220, a() * 220, 20 + a() * 50, 14 + a() * 40);
    }
    taches(g, a, 10, "rgba(60,55,45,0.18)", 10, 40, 256, 256);
    taches(g, a, 6, "rgba(110,120,70,0.16)", 6, 18, 256, 256);
    for (let i = 0; i < 9; i++) fissure(g, a, a() * 256, a() * 256, 12, 7, "rgba(35,32,28,0.55)");
    // faïençage
    g.strokeStyle = "rgba(40,36,30,0.25)";
    g.lineWidth = 0.8;
    for (let i = 0; i < 40; i++) {
      const x = a() * 256;
      const y = a() * 256;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (a() - 0.5) * 16, y + (a() - 0.5) * 16);
      g.stroke();
    }
  });
}

/** L'herbe et la terre des jardins et des friches : marbrures, trouées de terre, mousse. Tuile de 8 m. */
export function texHerbe() {
  return dessiner("pn-herbe", 256, 256, (g) => {
    const a = aleatoire(7102);
    g.fillStyle = "#dcdcd0";
    g.fillRect(0, 0, 256, 256);
    taches(g, a, 40, "rgba(120,140,80,0.25)", 8, 30, 256, 256);
    taches(g, a, 18, "rgba(150,120,80,0.28)", 6, 22, 256, 256);
    taches(g, a, 20, "rgba(255,255,230,0.22)", 6, 26, 256, 256);
    for (let i = 0; i < 2600; i++) {
      const x = a() * 256;
      const y = a() * 256;
      g.strokeStyle = a() < 0.5 ? "rgba(70,90,40,0.22)" : "rgba(255,255,220,0.2)";
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (a() - 0.5) * 3, y - 2 - a() * 3);
      g.stroke();
    }
  });
}

/** Les tuiles mécaniques des pavillons : rangs ondulés, tuiles changées, lichens. Tuile de 2 m. */
export function texTuiles() {
  return dessiner("pn-tuiles", 128, 128, (g) => {
    const a = aleatoire(7103);
    g.fillStyle = "#cfc3b8";
    g.fillRect(0, 0, 128, 128);
    for (let r = 0; r < 8; r++) {
      for (let x = 0; x < 128; x += 16) {
        const v = 215 + Math.floor((a() - 0.5) * 40);
        const neuve = a() < 0.05;
        g.fillStyle = neuve ? "rgb(240,200,180)" : `rgb(${v},${v - 6},${v - 12})`;
        g.fillRect(x + 1, r * 16 + 1, 14, 14);
        g.fillStyle = "rgba(0,0,0,0.18)";
        g.fillRect(x + 6, r * 16 + 2, 3, 12); // le creux de la tuile
        g.fillStyle = "rgba(0,0,0,0.28)";
        g.fillRect(x, r * 16 + 13, 16, 3); // le recouvrement
      }
    }
    taches(g, a, 10, "rgba(110,130,70,0.35)", 4, 12, 128, 128);
    taches(g, a, 6, "rgba(220,210,150,0.35)", 2, 6, 128, 128);
  });
}

/** La tôle ondulée (conteneurs, bardage, cabanes) : ondes verticales, rouille qui coule. Tuile de 2 m. */
export function texOndule() {
  return dessiner("pn-ondule", 128, 128, (g) => {
    const a = aleatoire(7104);
    for (let x = 0; x < 128; x += 8) {
      const d = g.createLinearGradient(x, 0, x + 8, 0);
      d.addColorStop(0, "#c8c8c4");
      d.addColorStop(0.5, "#f0f0ec");
      d.addColorStop(1, "#b4b4b0");
      g.fillStyle = d;
      g.fillRect(x, 0, 8, 128);
    }
    for (let i = 0; i < 14; i++) {
      const x = a() * 128;
      const y = a() * 128;
      const lg = 20 + a() * 70;
      const d = g.createLinearGradient(0, y, 0, y + lg);
      d.addColorStop(0, "rgba(140,70,30,0.45)");
      d.addColorStop(1, "rgba(140,70,30,0)");
      g.fillStyle = d;
      g.fillRect(x, y, 2 + a() * 4, lg);
    }
    taches(g, a, 8, "rgba(120,60,30,0.3)", 3, 10, 128, 128);
    grain(g, a, 500, 128, 128, 0.05);
  });
}

/** Le grillage à mailles losanges (clôtures de pavillons, de la voie, des jardins) : transparent entre les fils. Tuile de 2 m. */
export function texGrillage() {
  return dessiner("pn-grillage", 256, 256, (g) => {
    g.clearRect(0, 0, 256, 256);
    g.strokeStyle = "rgba(235,235,230,1)";
    g.lineWidth = 2.2;
    const pas = 16;
    for (let k = -256; k < 512; k += pas) {
      g.beginPath();
      g.moveTo(k, 0);
      g.lineTo(k + 256, 256);
      g.stroke();
      g.beginPath();
      g.moveTo(k, 256);
      g.lineTo(k + 256, 0);
      g.stroke();
    }
    // le fil de tension en haut et en bas
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(0, 2);
    g.lineTo(256, 2);
    g.stroke();
  });
}

export function matiereGrillage() {
  const m = new THREE.MeshStandardMaterial({ map: texGrillage(), vertexColors: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.35 });
  m.userData.tuile = 2;
  m.userData.sansOmbre = true;
  return m;
}

// ---------- L'atlas ----------

// Une seule texture 1024 × 1024 pour tout ce qui est peint ou imprimé. Régions : [x, y, largeur, hauteur] en pixels.
export const ATLAS = {
  croix: [0, 0, 256, 256], // croix de Saint-André (fond transparent)
  triangle: [256, 0, 192, 176], // panneau « passage à niveau avec barrières »
  autonome: [448, 0, 576, 160], // l'affiche du train autonome
  appli: [448, 160, 576, 96], // la sonnerie remplacée par une appli
  entree: [0, 256, 448, 128], // panneau d'entrée d'agglomération
  epicerie: [448, 256, 576, 128], // l'enseigne de l'épicerie
  dirEst: [0, 384, 448, 96], // direction : centre-ville
  drone12: [448, 384, 288, 96], // vitrophanie « livraison par drone »
  ouvert: [736, 384, 288, 96], // « ouvert 7 j / 7 »
  dirOuest: [0, 480, 448, 96], // direction : le Carrefour
  depot: [448, 480, 576, 96], // l'enseigne du dépôt de bus
  horaires: [0, 576, 256, 192], // le tableau des horaires de la maisonnette
  ecran: [256, 576, 256, 144], // l'écran géant du salon
  frigo: [256, 720, 128, 48], // l'écran du frigo connecté
  bouteille: [384, 720, 128, 48], // étiquette générique (bocaux, conserves)
  navette: [512, 576, 512, 80], // le flanc de la navette autonome
  jardins: [512, 656, 384, 112], // le panneau des jardins ouvriers
  danger: [896, 656, 128, 112], // plaque orange de matière dangereuse
  pub: [0, 768, 384, 256], // l'affiche WattyDrop (panneau 4 × 3)
  graffiti1: [384, 768, 384, 64], // « PAR LE WAGON → »
  graffiti2: [384, 832, 384, 64], // « CITERNE : À PLAT VENTRE »
  fret: [384, 896, 384, 64], // « ABONDANCE FRET » (conteneurs)
  boost: [384, 960, 384, 64], // le flanc des citernes « Watty Boost »
  residence: [768, 768, 256, 128], // la palissade du chantier
  wattydrop: [768, 896, 256, 64], // l'étiquette des drones et colis
  capteur: [768, 960, 256, 64], // le piquet du potager connecté
};

const POLICE = '"Arial Black", "Helvetica Neue", Impact, sans-serif';
const SANS = '"Helvetica Neue", Arial, sans-serif';
const FEUTRE = '"Marker Felt", "Chalkboard SE", "Comic Sans MS", cursive';
const CRAIE = '"Chalkboard SE", "Marker Felt", "Comic Sans MS", cursive';

function texte(g, t, x, y, largeurMax, taille, police, couleur, poids = "900", align = "center") {
  g.font = `${poids} ${taille}px ${police}`;
  const w = g.measureText(t).width;
  if (w > largeurMax) g.font = `${poids} ${(taille * largeurMax) / w}px ${police}`;
  g.fillStyle = couleur;
  g.textAlign = align;
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
    g.fillStyle = "rgba(0,0,0,0.8)";
    g.beginPath();
    g.arc(x + a() * w, y + a() * h, 1 + a() * Math.min(w, h) * 0.05, 0, TAU);
    g.fill();
  }
  g.globalCompositeOperation = "source-over";
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

/** Watty, la pile souriante (corps canard, tête crème, clin d'œil, éclair rouge). */
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
    g.lineTo(cx + sx * w * 0.3, y + h + s * 0.16);
    g.stroke();
    g.fillStyle = "#c8362b";
    g.beginPath();
    g.ellipse(cx + sx * w * 0.38, y + h + s * 0.18, s * 0.1, s * 0.05, 0, 0, TAU);
    g.fill();
  }
  g.lineWidth = s * 0.06;
  g.beginPath();
  g.moveTo(x + 2, y + h * 0.5);
  g.quadraticCurveTo(x - s * 0.2, y + h * 0.45, x - s * 0.2, y + h * 0.2);
  g.stroke();
  g.beginPath();
  g.moveTo(x + w - 2, y + h * 0.5);
  g.quadraticCurveTo(x + w + s * 0.25, y + h * 0.4, x + w + s * 0.3, y + h * 0.1);
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

/** Un petit drone de livraison stylisé (pour les affiches). */
function dessinerDrone(g, cx, cy, s, couleur = "#2f6f73") {
  g.save();
  g.strokeStyle = "#1f2526";
  g.lineWidth = s * 0.05;
  for (const sx of [-1, 1]) {
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(cx + sx * s * 0.6, cy - s * 0.2);
    g.stroke();
    g.fillStyle = "rgba(31,37,38,0.6)";
    g.beginPath();
    g.ellipse(cx + sx * s * 0.6, cy - s * 0.25, s * 0.3, s * 0.06, 0, 0, TAU);
    g.fill();
  }
  rectArrondi(g, cx - s * 0.25, cy - s * 0.12, s * 0.5, s * 0.24, s * 0.08);
  g.fillStyle = couleur;
  g.fill();
  g.fillStyle = "#c79a3b";
  g.fillRect(cx - s * 0.18, cy + s * 0.2, s * 0.36, s * 0.3);
  g.strokeRect(cx - s * 0.18, cy + s * 0.2, s * 0.36, s * 0.3);
  g.beginPath();
  g.moveTo(cx, cy + s * 0.12);
  g.lineTo(cx, cy + s * 0.2);
  g.stroke();
  g.restore();
}

export function texAtlas() {
  return dessiner(
    "pn-atlas",
    1024,
    1024,
    (g) => {
      const a = aleatoire(7199);
      g.clearRect(0, 0, 1024, 1024);
      const R = (k) => ATLAS[k];

      // --- La croix de Saint-André (fond transparent) : deux lames blanches bordées de rouge ---
      {
        const [x, y, w, h] = R("croix");
        g.save();
        g.translate(x + w / 2, y + h / 2);
        for (const ang of [PI / 4, -PI / 4]) {
          g.save();
          g.rotate(ang);
          g.fillStyle = "#b8332a";
          g.fillRect(-125, -21, 250, 42);
          g.fillStyle = "#ece6d8";
          g.fillRect(-119, -15, 238, 30);
          g.restore();
        }
        g.restore();
        user(g, a, [x + 20, y + 20, w - 40, h - 40], 30, 0.12);
      }

      // --- Le panneau triangulaire « passage à niveau avec barrières » ---
      {
        const [x, y, w, h] = R("triangle");
        g.fillStyle = "#b8332a";
        g.beginPath();
        g.moveTo(x + w / 2, y + 6);
        g.lineTo(x + w - 6, y + h - 6);
        g.lineTo(x + 6, y + h - 6);
        g.closePath();
        g.fill();
        g.fillStyle = "#ece6d8";
        g.beginPath();
        g.moveTo(x + w / 2, y + 30);
        g.lineTo(x + w - 26, y + h - 18);
        g.lineTo(x + 26, y + h - 18);
        g.closePath();
        g.fill();
        // la barrière dessinée : un poteau, une lisse rayée
        g.fillStyle = "#1f2526";
        g.fillRect(x + w / 2 - 44, y + h - 70, 8, 44);
        for (let i = 0; i < 5; i++) {
          g.fillStyle = i % 2 ? "#ece6d8" : "#b8332a";
          g.fillRect(x + w / 2 - 36 + i * 16, y + h - 66, 16, 10);
        }
        g.strokeStyle = "#1f2526";
        g.lineWidth = 2;
        g.strokeRect(x + w / 2 - 36, y + h - 66, 80, 10);
        user(g, a, [x, y, w, h], 25, 0.15);
      }

      // --- L'affiche du train autonome ---
      {
        const [x, y, w, h] = R("autonome");
        g.fillStyle = "#e9dfc6";
        g.fillRect(x, y, w, h);
        g.fillStyle = "#2f6f73";
        g.fillRect(x, y, w, 44);
        texte(g, "TRAIN AUTONOME SANS CONDUCTEUR", x + w / 2, y + 23, w - 30, 30, POLICE, "#e9dfc6");
        texte(g, "Prochain passage :", x + 190, y + 84, 300, 34, SANS, "#1f2526", "700");
        texte(g, "bientôt", x + 430, y + 84, 200, 46, POLICE, "#c8362b");
        texte(g, "Merci de patienter. L'algorithme veille sur vous.", x + w / 2, y + 132, w - 40, 22, SANS, "#2f6f73", "600");
        dessinerWatty(g, x + 52, y + 96, 70);
        user(g, a, [x, y, w, h], 70, 0.2);
      }

      // --- La sonnerie remplacée par une appli ---
      {
        const [x, y, w, h] = R("appli");
        g.fillStyle = "#1f2526";
        rectArrondi(g, x + 4, y + 4, w - 8, h - 8, 14);
        g.fill();
        g.fillStyle = "#c79a3b";
        g.beginPath();
        g.arc(x + 52, y + 48, 26, 0, TAU);
        g.fill();
        texte(g, "♪", x + 52, y + 50, 40, 34, SANS, "#1f2526");
        texte(g, "La sonnerie est désormais sur l'appli PassageZen+", x + 320, y + 34, w - 120, 24, SANS, "#e9dfc6", "700");
        texte(g, "Activez les notifications · option Premium : sonnerie personnalisée", x + 320, y + 68, w - 120, 18, SANS, "#c79a3b", "600");
        user(g, a, [x, y, w, h], 40, 0.12);
      }

      // --- Le panneau d'entrée d'agglomération ---
      {
        const [x, y, w, h] = R("entree");
        g.fillStyle = "#ece6d8";
        g.fillRect(x, y, w, h);
        g.strokeStyle = "#b8332a";
        g.lineWidth = 12;
        g.strokeRect(x + 10, y + 10, w - 20, h - 20);
        texte(g, "FAUBOURG DES PRISES", x + w / 2, y + 54, w - 60, 44, SANS, "#1f2526", "800");
        texte(g, "Ville connectée · 4 étoiles Wi-Fi", x + w / 2, y + 94, w - 80, 20, SANS, "#5a5a54", "600");
        user(g, a, [x, y, w, h], 50, 0.18);
      }

      // --- L'enseigne de l'épicerie ---
      {
        const [x, y, w, h] = R("epicerie");
        g.fillStyle = "#2f5a3c";
        g.fillRect(x, y, w, h);
        g.fillStyle = "#c79a3b";
        g.fillRect(x, y + h - 14, w, 6);
        texte(g, "ÉPICERIE DU PASSAGE", x + w / 2, y + 52, w - 50, 56, SERIF(), "#e9dfc6", "700");
        texte(g, "Alimentation · Primeurs · Dépôt de pain · Relais colis", x + w / 2, y + 98, w - 60, 20, SANS, "#e9dfc6", "600");
        user(g, a, [x, y, w, h], 70, 0.18);
      }

      // --- Les panneaux de direction (fond blanc, liseré noir) ---
      for (const [k, t1, t2, fleche] of [
        ["dirEst", "Centre-ville", "Comptoir de la Gare · 4 km", "→"],
        ["dirOuest", "Le Carrefour", "Comptoir · 5 km", "←"],
      ]) {
        const [x, y, w, h] = R(k);
        g.fillStyle = "#ece6d8";
        if (fleche === "→") {
          g.beginPath();
          g.moveTo(x, y + 4);
          g.lineTo(x + w - 60, y + 4);
          g.lineTo(x + w - 4, y + h / 2);
          g.lineTo(x + w - 60, y + h - 4);
          g.lineTo(x, y + h - 4);
          g.closePath();
        } else {
          g.beginPath();
          g.moveTo(x + w, y + 4);
          g.lineTo(x + 60, y + 4);
          g.lineTo(x + 4, y + h / 2);
          g.lineTo(x + 60, y + h - 4);
          g.lineTo(x + w, y + h - 4);
          g.closePath();
        }
        g.fill();
        g.strokeStyle = "#1f2526";
        g.lineWidth = 4;
        g.stroke();
        const cx = fleche === "→" ? x + (w - 60) / 2 : x + 60 + (w - 60) / 2;
        texte(g, t1, cx, y + 32, w - 100, 32, SANS, "#1f2526", "800");
        texte(g, t2, cx, y + 66, w - 100, 22, SANS, "#2f3b3c", "700");
        // le tampon des Compteurs, au crayon
        g.strokeStyle = "rgba(60,60,140,0.6)";
        g.lineWidth = 2;
        g.beginPath();
        g.arc(fleche === "→" ? x + 40 : x + w - 40, y + h - 26, 16, 0, TAU);
        g.stroke();
        user(g, a, [x, y, w, h], 40, 0.15);
      }

      // --- Vitrophanie : livraison par drone ---
      {
        const [x, y, w, h] = R("drone12");
        g.fillStyle = "#e9dfc6";
        rectArrondi(g, x + 4, y + 4, w - 8, h - 8, 12);
        g.fill();
        dessinerDrone(g, x + 50, y + 40, 60);
        texte(g, "WattyDrop", x + 180, y + 32, 170, 30, POLICE, "#2f6f73");
        texte(g, "livré en 12 minutes", x + 180, y + 64, 180, 20, SANS, "#c8362b", "700");
        user(g, a, [x, y, w, h], 30, 0.15);
      }

      // --- « Ouvert 7 j / 7 » ---
      {
        const [x, y, w, h] = R("ouvert");
        g.fillStyle = "#1f2526";
        g.fillRect(x, y, w, h);
        texte(g, "OUVERT 7 J / 7", x + w / 2, y + 34, w - 30, 34, POLICE, "#c8362b");
        texte(g, "(sauf fin du monde)", x + w / 2, y + 70, w - 40, 22, FEUTRE, "#e9dfc6", "400");
        user(g, a, [x, y, w, h], 30, 0.1);
      }

      // --- L'enseigne du dépôt de bus ---
      {
        const [x, y, w, h] = R("depot");
        g.fillStyle = "#e9dfc6";
        g.fillRect(x, y, w, h);
        g.fillStyle = "#2f6f73";
        g.fillRect(x, y, 100, h);
        texte(g, "W", x + 50, y + h / 2, 80, 64, POLICE, "#c79a3b");
        texte(g, "DÉPÔT WATTBUS", x + 330, y + 36, w - 140, 42, POLICE, "#2f6f73");
        texte(g, "Réseau 100 % autonome — Zéro chauffeur, zéro souci", x + 330, y + 74, w - 140, 18, SANS, "#5a5a54", "700");
        user(g, a, [x, y, w, h], 60, 0.2);
      }

      // --- Le tableau des horaires de la maisonnette (papier jauni, punaisé) ---
      {
        const [x, y, w, h] = R("horaires");
        g.fillStyle = "#ddd0aa";
        g.fillRect(x, y, w, h);
        texte(g, "PASSAGE N° 14 — HORAIRES", x + w / 2, y + 18, w - 20, 16, SANS, "#2a2620", "800");
        g.strokeStyle = "rgba(40,36,30,0.6)";
        g.lineWidth = 1;
        for (let r = 0; r < 9; r++) {
          const yy = y + 36 + r * 16;
          g.beginPath();
          g.moveTo(x + 10, yy);
          g.lineTo(x + w - 10, yy);
          g.stroke();
          const hh = 5 + r * 2;
          texte(g, `${String(hh).padStart(2, "0")} h ${["05", "17", "42", "08", "55", "31", "12", "48", "26"][r]}`, x + 50, yy + 8, 80, 12, SANS, "#2a2620", "600");
          texte(g, ["Fret Port", "Marchandises", "Fret ZI", "Omnibus", "Fret Port", "Citernes", "Omnibus", "Fret ZI", "Vide"][r], x + 160, yy + 8, 130, 12, SANS, "#2a2620", "500");
        }
        // biffé à la main, la dernière ligne
        texte(g, "plus rien depuis le 14", x + w / 2, y + h - 16, w - 20, 16, FEUTRE, "#8a2a20", "400");
        g.strokeStyle = "rgba(138,42,32,0.8)";
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(x + 14, y + 40);
        g.lineTo(x + w - 14, y + 170);
        g.stroke();
        user(g, a, [x, y, w, h], 30, 0.1);
      }

      // --- L'écran géant (noir brillant, un fantôme d'image) ---
      {
        const [x, y, w, h] = R("ecran");
        const d = g.createLinearGradient(x, y, x + w, y + h);
        d.addColorStop(0, "#1a1e22");
        d.addColorStop(0.5, "#2a3238");
        d.addColorStop(1, "#14181b");
        g.fillStyle = d;
        g.fillRect(x, y, w, h);
        g.fillStyle = "rgba(120,170,190,0.18)";
        g.fillRect(x + 20, y + 30, w - 40, 60);
        texte(g, "Votre abonnement a expiré", x + w / 2, y + 52, w - 50, 20, SANS, "rgba(200,225,230,0.7)", "600");
        texte(g, "Renouveler ?  ▶ Oui   ▶ Oui", x + w / 2, y + 78, w - 60, 14, SANS, "rgba(200,225,230,0.5)", "600");
        // l'impact au milieu
        g.strokeStyle = "rgba(220,230,235,0.5)";
        g.lineWidth = 1;
        const cx = x + w * 0.66;
        const cy = y + h * 0.7;
        for (let i = 0; i < 12; i++) {
          const an = (i / 12) * TAU + a() * 0.3;
          g.beginPath();
          g.moveTo(cx, cy);
          g.lineTo(cx + Math.cos(an) * (20 + a() * 50), cy + Math.sin(an) * (14 + a() * 30));
          g.stroke();
        }
      }

      // --- L'écran du frigo connecté ---
      {
        const [x, y, w, h] = R("frigo");
        g.fillStyle = "#16202a";
        g.fillRect(x, y, w, h);
        texte(g, "Lait : commandé", x + w / 2, y + 16, w - 10, 14, SANS, "#7fd0e0", "700");
        texte(g, "il y a 1 213 jours", x + w / 2, y + 34, w - 10, 12, SANS, "#7fd0e0", "500");
      }

      // --- Étiquette générique (conserves, bocaux) ---
      {
        const [x, y, w, h] = R("bouteille");
        for (let i = 0; i < 4; i++) {
          g.fillStyle = ["#c8362b", "#c79a3b", "#2f6f73", "#e9dfc6"][i];
          g.fillRect(x + i * 32, y, 32, h);
          g.fillStyle = "rgba(255,255,255,0.5)";
          g.fillRect(x + i * 32 + 4, y + 16, 24, 12);
        }
      }

      // --- Le flanc de la navette autonome ---
      {
        const [x, y, w, h] = R("navette");
        g.fillStyle = "#e9dfc6";
        g.fillRect(x, y, w, h);
        g.fillStyle = "#2f6f73";
        g.fillRect(x, y + h - 18, w, 18);
        texte(g, "NAVETTE AUTONOME", x + 190, y + 26, 340, 30, POLICE, "#2f6f73");
        texte(g, "Je conduis, vous vivez !", x + 190, y + 52, 320, 18, SANS, "#c8362b", "700");
        dessinerWatty(g, x + 440, y + 34, 50);
        user(g, a, [x, y, w, h], 50, 0.15);
      }

      // --- Le panneau des jardins ouvriers ---
      {
        const [x, y, w, h] = R("jardins");
        g.fillStyle = "#6a5a40";
        g.fillRect(x, y, w, h);
        g.fillStyle = "#e9dfc6";
        g.fillRect(x + 8, y + 8, w - 16, h - 16);
        texte(g, "JARDINS OUVRIERS DU PASSAGE", x + w / 2, y + 34, w - 40, 26, SERIF(), "#3f5a2f", "700");
        texte(g, "Parcelles 1 à 24 · Arrosage le soir", x + w / 2, y + 62, w - 40, 18, SANS, "#3f3a30", "600");
        texte(g, "Parcelle 12 : arrosage par abonnement", x + w / 2, y + 88, w - 60, 16, FEUTRE, "#8a2a20", "400");
        user(g, a, [x, y, w, h], 50, 0.2);
      }

      // --- Plaque orange de matière dangereuse ---
      {
        const [x, y, w, h] = R("danger");
        g.fillStyle = "#d07a2a";
        g.fillRect(x, y, w, h);
        g.strokeStyle = "#1f2526";
        g.lineWidth = 6;
        g.strokeRect(x + 4, y + 4, w - 8, h - 8);
        g.beginPath();
        g.moveTo(x + 4, y + h / 2);
        g.lineTo(x + w - 4, y + h / 2);
        g.stroke();
        texte(g, "90", x + w / 2, y + h * 0.27, w - 30, 34, POLICE, "#1f2526");
        texte(g, "8765", x + w / 2, y + h * 0.74, w - 24, 30, POLICE, "#1f2526");
        user(g, a, [x, y, w, h], 20, 0.15);
      }

      // --- L'affiche WattyDrop du panneau 4 × 3 ---
      {
        const [x, y, w, h] = R("pub");
        const d = g.createLinearGradient(x, y, x, y + h);
        d.addColorStop(0, "#7fb3c0");
        d.addColorStop(1, "#e9dfc6");
        g.fillStyle = d;
        g.fillRect(x, y, w, h);
        dessinerDrone(g, x + 270, y + 80, 110);
        dessinerWatty(g, x + 80, y + 140, 120);
        texte(g, "WattyDrop", x + 250, y + 170, 230, 46, POLICE, "#2f6f73");
        texte(g, "Livré avant même d'en avoir envie.", x + w / 2, y + 222, w - 30, 22, SANS, "#c8362b", "800");
        user(g, a, [x, y, w, h], 90, 0.22);
      }

      // --- Graffitis des survivants ---
      for (const [k, t, coul] of [
        ["graffiti1", "PAR LE WAGON →", "#e9dfc6"],
        ["graffiti2", "CITERNE : À PLAT VENTRE ↓", "#d9c25a"],
      ]) {
        const [x, y, w, h] = R(k);
        g.save();
        g.translate(x + w / 2, y + h / 2);
        g.rotate(-0.03);
        texte(g, t, 0, 0, w - 20, 42, FEUTRE, coul, "700");
        g.restore();
      }

      // --- « ABONDANCE FRET » (conteneurs) ---
      {
        const [x, y, w, h] = R("fret");
        texte(g, "ABONDANCE FRET", x + w / 2, y + 26, w - 20, 40, POLICE, "rgba(236,230,214,0.92)");
        texte(g, "ABFU 204 117 · 30 480 kg", x + w / 2, y + 54, w - 60, 14, SANS, "rgba(236,230,214,0.8)", "700");
      }

      // --- Le flanc des citernes « Watty Boost » ---
      {
        const [x, y, w, h] = R("boost");
        g.fillStyle = "#c79a3b";
        g.fillRect(x, y + 6, w, h - 12);
        texte(g, "WATTY BOOST", x + 140, y + 32, 250, 38, POLICE, "#c8362b");
        texte(g, "boisson énergétique · 60 000 L", x + 300, y + 32, 150, 13, SANS, "#1f2526", "800");
        user(g, a, [x, y, w, h], 40, 0.2);
      }

      // --- La palissade du chantier ---
      {
        const [x, y, w, h] = R("residence");
        g.fillStyle = "#e9dfc6";
        g.fillRect(x, y, w, h);
        g.fillStyle = "#2f6f73";
        g.fillRect(x, y, w, 30);
        texte(g, "BIENTÔT ICI", x + w / 2, y + 16, w - 20, 20, POLICE, "#e9dfc6");
        texte(g, "Résidence", x + w / 2, y + 52, w - 30, 24, SERIF(), "#2f6f73", "700");
        texte(g, "Les Jardins Connectés", x + w / 2, y + 80, w - 30, 22, SERIF(), "#2f6f73", "700");
        texte(g, "Livraison prévue : très bientôt", x + w / 2, y + 108, w - 30, 13, SANS, "#c8362b", "700");
        user(g, a, [x, y, w, h], 50, 0.25);
      }

      // --- L'étiquette des drones et colis ---
      {
        const [x, y, w, h] = R("wattydrop");
        g.fillStyle = "#2f6f73";
        g.fillRect(x, y, w, h);
        texte(g, "WattyDrop", x + w / 2, y + 24, w - 20, 30, POLICE, "#e9dfc6");
        texte(g, "colis n° 88 412 · non réclamé", x + w / 2, y + 50, w - 30, 13, SANS, "#c79a3b", "700");
      }

      // --- Le piquet du potager connecté ---
      {
        const [x, y, w, h] = R("capteur");
        g.fillStyle = "#e9dfc6";
        g.fillRect(x, y, w, h);
        texte(g, "Capteur d'humidité GreenWatt", x + w / 2, y + 20, w - 16, 16, SANS, "#2f6f73", "800");
        texte(g, "Abonnement expiré : arrosez à l'instinct", x + w / 2, y + 44, w - 16, 12, SANS, "#c8362b", "700");
      }
    },
    false,
  );
}

function SERIF() {
  return 'Georgia, "Times New Roman", serif';
}

export { matiereTexture };
