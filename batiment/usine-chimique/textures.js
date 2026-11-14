// Les textures de l'usine chimique : un seul atlas (1024 × 1024) pour tout ce qui est peint, imprimé ou affiché
// (losanges de danger inventés, panneaux, réclames de l'Abondance, synoptique, étiquettes, grillage), et le bardage
// en tôle ondulée des ateliers et des colonnes. Un atlas = un seul appel de dessin pour toutes les enseignes.

import { dessiner, aleatoire, taches } from "../commun/atelier.js";

/** Régions de l'atlas : [x, y, largeur, hauteur] en pixels (origine en haut à gauche). */
export const ATLAS = {
  tete: [0, 0, 128, 128],
  flamme: [128, 0, 128, 128],
  corrosif: [256, 0, 128, 128],
  nature: [384, 0, 128, 128],
  atex: [512, 0, 256, 128],
  baignade: [768, 0, 256, 128],
  chimieVerte: [0, 128, 512, 128],
  logo: [512, 128, 512, 128],
  nettoyant: [0, 256, 512, 256],
  lessive: [512, 256, 512, 256],
  synoptique: [0, 512, 512, 192],
  pupitre: [512, 512, 256, 128],
  badge: [768, 512, 256, 128],
  etSoude: [512, 640, 128, 64],
  etAcide: [640, 640, 128, 64],
  etSolvant: [768, 640, 128, 64],
  etGrandAir: [896, 640, 128, 64],
  t101: [0, 704, 340, 64],
  t102: [340, 704, 340, 64],
  t103: [680, 704, 344, 64],
  grillage: [0, 768, 256, 256],
  ph: [256, 768, 256, 128],
  vestiaire: [256, 896, 256, 128],
  graffiti: [512, 768, 256, 128],
  carton: [512, 896, 256, 128],
  masque: [768, 768, 256, 256],
};

const POLICE = '"Arial Black", "Helvetica Neue", Impact, sans-serif';
const SOBRE = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const FEUTRE = '"Marker Felt", "Chalkboard SE", "Comic Sans MS", cursive';
const POCHOIR = '"Courier New", Courier, monospace';
const NOIR = "#1f2120";
const ROUGE = "#c8362b";
const CREME = "#ece4cf";
const TAU = Math.PI * 2;

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

function grain(g, a, [x, y, w, h], n, force) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = a() < 0.5 ? `rgba(0,0,0,${force})` : `rgba(255,255,255,${force})`;
    g.fillRect(x + a() * w, y + a() * h, 1 + a() * 2.5, 1 + a() * 2.5);
  }
}

/** Le temps passe sur une région : voile délavé, taches, coulures de rouille, grain. */
function vieillir(g, a, r, force = 0.25, rouille = 0.22) {
  const [x, y, w, h] = r;
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.fillStyle = `rgba(232,226,208,${force * 0.6})`;
  g.fillRect(x, y, w, h);
  g.translate(x, y);
  taches(g, a, 6 + Math.round(w / 60), `rgba(110,90,60,${force * 0.7})`, 6, Math.max(12, h * 0.35), w, h);
  for (let i = 0; i < Math.round(w / 25); i++) {
    const px = a() * w;
    const py = a() * h * 0.6;
    const lg = h * (0.2 + a() * 0.6);
    const d = g.createLinearGradient(0, py, 0, py + lg);
    d.addColorStop(0, `rgba(130,70,35,${rouille})`);
    d.addColorStop(1, "rgba(130,70,35,0)");
    g.fillStyle = d;
    g.fillRect(px, py, 1 + a() * 3, lg);
  }
  g.restore();
  grain(g, a, r, Math.round((w * h) / 90), 0.05);
}

/** La peinture s'écaille : trous dans la couche (transparence). */
function ecailler(g, a, [x, y, w, h], n, rMin, rMax) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < n; i++) {
    const px = x + a() * w;
    const py = y + a() * h;
    const r = rMin + a() * (rMax - rMin);
    g.fillStyle = "rgba(0,0,0,0.9)";
    g.beginPath();
    for (let k = 0; k < 7; k++) {
      const an = (k / 7) * TAU;
      const rr = r * (0.5 + a() * 0.6);
      if (k) g.lineTo(px + Math.cos(an) * rr, py + Math.sin(an) * rr);
      else g.moveTo(px + Math.cos(an) * rr, py + Math.sin(an) * rr);
    }
    g.fill();
  }
  g.restore();
}

// ---------- Les pictogrammes de danger (inventés) ----------

function pictoTete(g, cx, cy, s) {
  g.strokeStyle = NOIR;
  g.fillStyle = NOIR;
  g.lineCap = "round";
  g.lineWidth = s * 0.08;
  for (const sx of [-1, 1]) {
    g.beginPath();
    g.moveTo(cx - sx * s * 0.3, cy + s * 0.06);
    g.lineTo(cx + sx * s * 0.3, cy + s * 0.34);
    g.stroke();
  }
  g.beginPath();
  g.arc(cx, cy - s * 0.1, s * 0.22, 0, TAU);
  g.fill();
  g.fillRect(cx - s * 0.13, cy + s * 0.04, s * 0.26, s * 0.13);
  g.fillStyle = "#f4efe2";
  for (const sx of [-1, 1]) {
    g.beginPath();
    g.arc(cx + sx * s * 0.085, cy - s * 0.1, s * 0.06, 0, TAU);
    g.fill();
  }
  for (let i = -1; i <= 1; i++) g.fillRect(cx + i * s * 0.07 - s * 0.012, cy + s * 0.09, s * 0.024, s * 0.08);
}

function pictoFlamme(g, cx, cy, s) {
  g.fillStyle = NOIR;
  g.beginPath();
  g.moveTo(cx, cy - s * 0.36);
  g.bezierCurveTo(cx + s * 0.32, cy - s * 0.08, cx + s * 0.26, cy + s * 0.26, cx, cy + s * 0.28);
  g.bezierCurveTo(cx - s * 0.28, cy + s * 0.26, cx - s * 0.26, cy - s * 0.02, cx - s * 0.1, cy - s * 0.14);
  g.bezierCurveTo(cx - s * 0.06, cy - s * 0.02, cx + s * 0.04, cy - s * 0.18, cx, cy - s * 0.36);
  g.fill();
  g.fillRect(cx - s * 0.3, cy + s * 0.31, s * 0.6, s * 0.05);
}

function pictoCorrosif(g, cx, cy, s) {
  g.fillStyle = NOIR;
  for (const sx of [-1, 1]) {
    g.save();
    g.translate(cx + sx * s * 0.17, cy - s * 0.24);
    g.rotate(-sx * 0.6);
    g.fillRect(-s * 0.045, -s * 0.12, s * 0.09, s * 0.24);
    g.restore();
    for (const dy of [0.0, 0.08]) {
      g.beginPath();
      g.arc(cx + sx * s * 0.1, cy - s * 0.06 + dy * s, s * 0.025, 0, TAU);
      g.fill();
    }
  }
  g.fillRect(cx - s * 0.34, cy + s * 0.1, s * 0.3, s * 0.1);
  g.fillRect(cx + s * 0.04, cy + s * 0.12, s * 0.3, s * 0.1);
  g.fillStyle = "#f4efe2";
  for (const x of [-0.25, -0.15, 0.12, 0.22]) {
    g.beginPath();
    g.arc(cx + x * s, cy + s * 0.11, s * 0.035, 0, TAU);
    g.fill();
  }
  g.fillStyle = NOIR;
  g.fillRect(cx - s * 0.36, cy + s * 0.27, s * 0.72, s * 0.05);
}

function pictoNature(g, cx, cy, s) {
  g.strokeStyle = NOIR;
  g.fillStyle = NOIR;
  g.lineWidth = s * 0.04;
  g.lineCap = "round";
  // L'arbre mort
  g.beginPath();
  g.moveTo(cx - s * 0.15, cy + s * 0.3);
  g.lineTo(cx - s * 0.15, cy - s * 0.2);
  g.moveTo(cx - s * 0.15, cy - s * 0.05);
  g.lineTo(cx - s * 0.32, cy - s * 0.22);
  g.moveTo(cx - s * 0.15, cy - s * 0.12);
  g.lineTo(cx + s * 0.02, cy - s * 0.3);
  g.stroke();
  // Le poisson, l'œil en croix
  g.beginPath();
  g.ellipse(cx + s * 0.12, cy + s * 0.18, s * 0.17, s * 0.07, 0, 0, TAU);
  g.fill();
  g.beginPath();
  g.moveTo(cx + s * 0.27, cy + s * 0.18);
  g.lineTo(cx + s * 0.37, cy + s * 0.1);
  g.lineTo(cx + s * 0.37, cy + s * 0.26);
  g.fill();
  g.strokeStyle = "#f4efe2";
  g.lineWidth = s * 0.02;
  g.beginPath();
  g.moveTo(cx + s * 0.0, cy + s * 0.15);
  g.lineTo(cx + s * 0.05, cy + s * 0.2);
  g.moveTo(cx + s * 0.05, cy + s * 0.15);
  g.lineTo(cx + s * 0.0, cy + s * 0.2);
  g.stroke();
  g.fillStyle = NOIR;
  g.fillRect(cx - s * 0.36, cy + s * 0.3, s * 0.72, s * 0.04);
}

/** Un losange de danger : bord rouge, fond blanc cassé, pictogramme noir. */
function losange(g, a, [x, y, w], picto) {
  const cx = x + w / 2;
  const cy = y + w / 2;
  const s = w * 0.46;
  g.save();
  g.translate(cx, cy);
  g.rotate(Math.PI / 4);
  g.fillStyle = ROUGE;
  g.fillRect(-s * 0.7, -s * 0.7, s * 1.4, s * 1.4);
  g.fillStyle = "#f2ede0";
  g.fillRect(-s * 0.6, -s * 0.6, s * 1.2, s * 1.2);
  g.restore();
  picto(g, cx, cy, w * 0.62);
  vieillir(g, a, [x + 8, y + 8, w - 16, w - 16], 0.25, 0.2);
  // Les coins hors du losange restent transparents
  g.save();
  g.globalCompositeOperation = "destination-in";
  g.translate(cx, cy);
  g.rotate(Math.PI / 4);
  g.fillRect(-s * 0.7, -s * 0.7, s * 1.4, s * 1.4);
  g.restore();
}

// ---------- L'atlas ----------

function dessinerAtlas(g) {
  const a = aleatoire(5101);
  g.clearRect(0, 0, 1024, 1024);
  const R = ATLAS;

  // Les losanges : chacun dans son carré, le reste du canvas ne doit pas déborder
  for (const [nom, picto] of [["tete", pictoTete], ["flamme", pictoFlamme], ["corrosif", pictoCorrosif], ["nature", pictoNature]]) {
    g.save();
    g.beginPath();
    g.rect(...R[nom]);
    g.clip();
    losange(g, a, R[nom], picto);
    g.restore();
  }

  // ZONE ATEX : triangle jaune « EX », bandeau
  {
    const [x, y, w, h] = R.atex;
    g.fillStyle = "#d9b63a";
    g.fillRect(x, y, w, h);
    g.fillStyle = NOIR;
    g.beginPath();
    g.moveTo(x + 64, y + 14);
    g.lineTo(x + 118, y + 112);
    g.lineTo(x + 10, y + 112);
    g.closePath();
    g.fill();
    g.fillStyle = "#d9b63a";
    g.beginPath();
    g.moveTo(x + 64, y + 30);
    g.lineTo(x + 104, y + 104);
    g.lineTo(x + 24, y + 104);
    g.closePath();
    g.fill();
    texte(g, "EX", x + 64, y + 80, 60, 34, POLICE, NOIR);
    texte(g, "ZONE", x + 188, y + 40, 120, 36, POLICE, NOIR);
    texte(g, "ATEX", x + 188, y + 82, 120, 40, POLICE, NOIR);
    texte(g, "atmosphère explosive", x + 188, y + 112, 124, 12, SOBRE, NOIR, "700");
    vieillir(g, a, R.atex, 0.3, 0.3);
    ecailler(g, a, R.atex, 5, 3, 9);
  }

  // Bassin : baignade interdite
  {
    const [x, y, w, h] = R.baignade;
    g.fillStyle = "#efeadc";
    g.fillRect(x, y, w, h);
    g.strokeStyle = ROUGE;
    g.lineWidth = 8;
    g.strokeRect(x + 6, y + 6, w - 12, h - 12);
    texte(g, "BASSIN DE DÉCANTATION N° 2", x + w / 2, y + 30, w - 30, 17, SOBRE, NOIR, "800");
    texte(g, "BAIGNADE INTERDITE", x + w / 2, y + 66, w - 30, 30, POLICE, ROUGE);
    texte(g, "(même par forte chaleur)", x + w / 2, y + 100, w - 40, 15, SOBRE, NOIR, "italic 600");
    vieillir(g, a, R.baignade, 0.3, 0.3);
  }

  // « Chimie verte, avenir propre » : la banderole de la cuve qui fuit
  {
    const [x, y, w, h] = R.chimieVerte;
    const d = g.createLinearGradient(x, 0, x + w, 0);
    d.addColorStop(0, "#d9e6c2");
    d.addColorStop(1, "#b9d39a");
    g.fillStyle = d;
    g.fillRect(x, y, w, h);
    // La feuille souriante
    g.fillStyle = "#4f8a3a";
    g.beginPath();
    g.ellipse(x + 66, y + 64, 42, 26, -0.7, 0, TAU);
    g.fill();
    g.strokeStyle = "#e9f2d8";
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(x + 38, y + 92);
    g.lineTo(x + 92, y + 38);
    g.stroke();
    texte(g, "Chimie verte,", x + 300, y + 44, 360, 46, POLICE, "#2f5f2a");
    texte(g, "avenir propre", x + 300, y + 94, 360, 46, POLICE, "#2f5f2a");
    texte(g, "CLARTEX — engagé pour la planète depuis 1964", x + 300, y + 120, 380, 13, SOBRE, "#2f5f2a", "700");
    vieillir(g, a, R.chimieVerte, 0.35, 0.45);
    ecailler(g, a, R.chimieVerte, 10, 4, 14);
  }

  // L'enseigne de l'usine
  {
    const [x, y, w, h] = R.logo;
    g.fillStyle = "#e9e2cf";
    g.fillRect(x, y, w, h);
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y + h - 26, w, 26);
    // Le logo : une goutte dans un hexagone
    g.strokeStyle = "#2f6f73";
    g.lineWidth = 7;
    g.beginPath();
    for (let k = 0; k <= 6; k++) {
      const an = (k / 6) * TAU + Math.PI / 6;
      const px = x + 64 + Math.cos(an) * 40;
      const py = y + 52 + Math.sin(an) * 40;
      if (k) g.lineTo(px, py);
      else g.moveTo(px, py);
    }
    g.stroke();
    g.fillStyle = "#c79a3b";
    g.beginPath();
    g.moveTo(x + 64, y + 26);
    g.bezierCurveTo(x + 84, y + 54, x + 82, y + 74, x + 64, y + 74);
    g.bezierCurveTo(x + 46, y + 74, x + 44, y + 54, x + 64, y + 26);
    g.fill();
    texte(g, "CLARTEX", x + 300, y + 54, 360, 84, POLICE, "#2f6f73");
    texte(g, "LA CHIMIE QUI SIMPLIFIE LA VIE", x + w / 2, y + h - 13, w - 40, 16, SOBRE, "#e9e2cf", "800");
    vieillir(g, a, R.logo, 0.35, 0.35);
    ecailler(g, a, R.logo, 8, 4, 12);
  }

  // Réclame : le Nettoyant Universel Tout-en-Un Parfum Grand Air
  {
    const [x, y, w, h] = R.nettoyant;
    const d = g.createLinearGradient(0, y, 0, y + h);
    d.addColorStop(0, "#9fc7d8");
    d.addColorStop(0.6, "#d8ead8");
    d.addColorStop(0.61, "#8fbf5a");
    d.addColorStop(1, "#6f9f42");
    g.fillStyle = d;
    g.fillRect(x, y, w, h);
    g.fillStyle = "#f2d36a";
    g.beginPath();
    g.arc(x + 420, y + 60, 34, 0, TAU);
    g.fill();
    // La bouteille géante, souriante
    g.fillStyle = "#4f9a5a";
    rectArrondi(g, x + 40, y + 70, 120, 170, 22);
    g.fill();
    g.fillRect(x + 80, y + 36, 40, 40);
    g.fillStyle = "#e9dfc6";
    g.fillRect(x + 76, y + 26, 48, 16);
    g.fillStyle = "#f2efe2";
    rectArrondi(g, x + 52, y + 120, 96, 80, 8);
    g.fill();
    texte(g, "GRAND", x + 100, y + 144, 84, 20, POLICE, "#2f6f73");
    texte(g, "AIR", x + 100, y + 172, 84, 26, POLICE, "#2f6f73");
    g.fillStyle = NOIR;
    for (const sx of [-1, 1]) {
      g.beginPath();
      g.arc(x + 100 + sx * 18, y + 96, 5, 0, TAU);
      g.fill();
    }
    g.strokeStyle = NOIR;
    g.lineWidth = 3;
    g.beginPath();
    g.arc(x + 100, y + 100, 14, 0.2, Math.PI - 0.2);
    g.stroke();
    texte(g, "NETTOYANT UNIVERSEL", x + 340, y + 112, 320, 30, POLICE, "#1f4f52");
    texte(g, "Tout-en-Un", x + 340, y + 148, 320, 30, POLICE, ROUGE);
    texte(g, "Parfum Grand Air", x + 340, y + 182, 300, 26, SOBRE, "#1f4f52", "italic 800");
    texte(g, "Nettoie tout. Même l'air.", x + 340, y + 222, 300, 20, SOBRE, "#1f3a20", "700");
    vieillir(g, a, R.nettoyant, 0.35, 0.3);
    ecailler(g, a, R.nettoyant, 14, 5, 18);
  }

  // Réclame : les capsules de lessive connectées
  {
    const [x, y, w, h] = R.lessive;
    g.fillStyle = "#e8eef2";
    g.fillRect(x, y, w, h);
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, w, 56);
    texte(g, "LessiConnect", x + w / 2, y + 30, w - 40, 40, POLICE, "#e9dfc6");
    // La capsule et ses ondes
    g.fillStyle = "#3f7fbf";
    g.beginPath();
    g.ellipse(x + 120, y + 160, 70, 56, 0, 0, TAU);
    g.fill();
    g.fillStyle = "#d9a03a";
    g.beginPath();
    g.ellipse(x + 120, y + 160, 70, 56, 0, Math.PI * 0.5, Math.PI * 1.5);
    g.fill();
    g.fillStyle = "rgba(255,255,255,0.35)";
    g.beginPath();
    g.ellipse(x + 98, y + 136, 22, 10, -0.5, 0, TAU);
    g.fill();
    g.strokeStyle = "#2f6f73";
    g.lineWidth = 6;
    for (const r of [24, 40, 56]) {
      g.beginPath();
      g.arc(x + 120, y + 96, r, -2.4, -0.74);
      g.stroke();
    }
    texte(g, "« Votre lessive", x + 340, y + 112, 300, 30, SOBRE, "#1f3a40", "italic 800");
    texte(g, "commande votre lessive »", x + 340, y + 148, 300, 30, SOBRE, "#1f3a40", "italic 800");
    texte(g, "Abonnement Premium : la capsule sait avant vous.", x + 340, y + 196, 300, 15, SOBRE, "#1f3a40", "700");
    texte(g, "Wi-Fi requis. Lessive incluse selon disponibilité du réseau.", x + 340, y + 226, 300, 11, SOBRE, "#4a5a5a", "600");
    vieillir(g, a, R.lessive, 0.3, 0.25);
    ecailler(g, a, R.lessive, 10, 4, 14);
  }

  // Le synoptique du procédé : cuves, colonnes, bassins, en lignes blanches sur fond vert
  {
    const [x, y, w, h] = R.synoptique;
    g.fillStyle = "#3d5a4f";
    g.fillRect(x, y, w, h);
    g.strokeStyle = "#e8e4d6";
    g.lineWidth = 3;
    texte(g, "UNITÉ 2 — SYNOPTIQUE DU PROCÉDÉ", x + w / 2, y + 16, w - 40, 15, SOBRE, "#e8e4d6", "800");
    const cuves = [[40, 70], [90, 70], [40, 140], [90, 140]];
    for (const [cx, cy] of cuves) g.strokeRect(x + cx - 16, y + cy - 22, 32, 44);
    for (const [cx, hh] of [[180, 120], [230, 100], [280, 80]]) g.strokeRect(x + cx - 10, y + 175 - hh, 20, hh);
    for (const [cx, cy] of [[360, 70], [420, 70]]) {
      g.beginPath();
      g.arc(x + cx, y + cy, 22, 0, TAU);
      g.stroke();
    }
    for (const cx of [350, 400, 450]) g.strokeRect(x + cx - 20, y + 140, 40, 24);
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x + 56, y + 105);
    g.lineTo(x + 480, y + 105);
    for (const cx of [40, 90, 180, 230, 280, 360, 420, 350, 400, 450]) {
      g.moveTo(x + cx, y + 105);
      g.lineTo(x + cx, y + (cx > 330 && cx % 50 === 0 ? 140 : cx > 330 ? 92 : cx > 150 ? 175 - 60 : 92));
    }
    g.stroke();
    // Les voyants : quelques-uns rouges, figés
    for (let i = 0; i < 26; i++) {
      const px = x + 30 + a() * (w - 60);
      const py = y + 40 + a() * (h - 60);
      const r = a();
      g.fillStyle = r < 0.2 ? "#e0402e" : r < 0.4 ? "#e8c04a" : r < 0.55 ? "#6fcf6a" : "#26302c";
      g.beginPath();
      g.arc(px, py, 4, 0, TAU);
      g.fill();
    }
    texte(g, "ALARME GÉNÉRALE", x + 420, y + 182, 160, 12, SOBRE, "#e0402e", "800");
    vieillir(g, a, R.synoptique, 0.2, 0.15);
  }

  // Le pupitre : boutons, cadrans, le gros champignon rouge
  {
    const [x, y, w, h] = R.pupitre;
    g.fillStyle = "#7c847c";
    g.fillRect(x, y, w, h);
    for (let i = 0; i < 4; i++) {
      g.fillStyle = "#e8e4d6";
      g.beginPath();
      g.arc(x + 30 + i * 42, y + 34, 15, 0, TAU);
      g.fill();
      g.strokeStyle = NOIR;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x + 30 + i * 42, y + 34);
      g.lineTo(x + 30 + i * 42 + Math.cos(-2 + a() * 2) * 12, y + 34 + Math.sin(-2 + a() * 2) * 12);
      g.stroke();
    }
    for (let i = 0; i < 12; i++) {
      g.fillStyle = ["#e8c04a", "#6fcf6a", "#26302c", "#d9d4c4"][i % 4];
      g.fillRect(x + 16 + (i % 6) * 28, y + 70 + Math.floor(i / 6) * 26, 16, 14);
    }
    g.fillStyle = "#e8c04a";
    g.beginPath();
    g.arc(x + 214, y + 86, 30, 0, TAU);
    g.fill();
    g.fillStyle = ROUGE;
    g.beginPath();
    g.arc(x + 214, y + 86, 21, 0, TAU);
    g.fill();
    texte(g, "ARRÊT D'URGENCE", x + 214, y + 30, 76, 10, SOBRE, NOIR, "800");
    vieillir(g, a, R.pupitre, 0.2, 0.15);
  }

  // Le contrôle d'accès : badge connecté
  {
    const [x, y, w, h] = R.badge;
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, w, h);
    g.fillStyle = "#e9dfc6";
    g.fillRect(x + 6, y + 6, w - 12, 40);
    texte(g, "ACCÈS RÉSERVÉ", x + w / 2, y + 27, w - 30, 24, POLICE, "#2f6f73");
    texte(g, "Présentez votre badge connecté", x + w / 2, y + 66, w - 24, 17, SOBRE, "#e9dfc6", "800");
    texte(g, "Votre badge vous reconnaît. Souriez.", x + w / 2, y + 96, w - 24, 14, SOBRE, "#e9dfc6", "italic 600");
    vieillir(g, a, R.badge, 0.3, 0.3);
  }

  // Les étiquettes des fûts et des bidons
  for (const [nom, fond, t1, t2] of [
    ["etSoude", "#e0a24a", "SOUDE", "CAUSTIQUE"],
    ["etAcide", "#e8e2cf", "ACIDE", "SULFURIQUE"],
    ["etSolvant", "#c9d6d8", "SOLVANT", "INFLAMMABLE"],
    ["etGrandAir", "#8fbf5a", "GRAND AIR", "Tout-en-Un"],
  ]) {
    const [x, y, w, h] = R[nom];
    g.fillStyle = fond;
    g.fillRect(x + 2, y + 2, w - 4, h - 4);
    texte(g, t1, x + w / 2, y + 22, w - 14, 20, POLICE, NOIR);
    texte(g, t2, x + w / 2, y + 46, w - 14, 14, SOBRE, NOIR, "800");
    vieillir(g, a, R[nom], 0.3, 0.2);
  }

  // Les pochoirs des cuves
  for (const [nom, t] of [["t101", "T-101  ACIDE SULFURIQUE 98 %"], ["t102", "T-102  SOUDE 50 %"], ["t103", "T-103  SOLVANTS"]]) {
    const [x, y, w, h] = R[nom];
    texte(g, t, x + w / 2, y + h / 2, w - 16, 34, POCHOIR, "rgba(30,32,30,0.9)", "900");
    ecailler(g, a, R[nom], 12, 3, 8);
  }

  // Le grillage (losanges de fil, transparent entre les fils)
  {
    const [x, y, w, h] = R.grillage;
    g.save();
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();
    g.strokeStyle = "#b9bdb6";
    g.lineWidth = 2;
    for (let k = -h; k < w + h; k += 16) {
      g.beginPath();
      g.moveTo(x + k, y);
      g.lineTo(x + k + h, y + h);
      g.moveTo(x + k, y + h);
      g.lineTo(x + k + h, y);
      g.stroke();
    }
    g.fillStyle = "#8a8f88";
    g.fillRect(x, y, w, 4);
    g.fillRect(x, y + h - 4, w, 4);
    // Des trous déchirés
    g.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.ellipse(x + 30 + a() * 200, y + 40 + a() * 180, 10 + a() * 20, 8 + a() * 14, a() * 3, 0, TAU);
      g.fill();
    }
    g.restore();
    g.save();
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();
    g.globalCompositeOperation = "source-atop";
    g.translate(x, y);
    taches(g, a, 10, "rgba(140,70,30,0.6)", 6, 20, w, h);
    g.restore();
  }

  // L'échelle de pH du laboratoire
  {
    const [x, y, w, h] = R.ph;
    g.fillStyle = "#efeadc";
    g.fillRect(x, y, w, h);
    texte(g, "ÉCHELLE DE pH", x + w / 2, y + 20, w - 30, 20, POLICE, NOIR);
    const tons = ["#c8362b", "#d9542e", "#e07a35", "#e8a03a", "#e8c84a", "#cbd64a", "#8fc24a", "#5fae4a", "#3f9a6a", "#3f8a9a", "#3f6fb0", "#4a52a8", "#5a3f9a", "#6a3088", "#5a2a6a"];
    const lc = (w - 20) / 15;
    for (let i = 0; i < 15; i++) {
      g.fillStyle = tons[i];
      g.fillRect(x + 10 + i * lc, y + 40, lc - 1, 46);
      texte(g, String(i), x + 10 + i * lc + lc / 2, y + 98, lc, 12, SOBRE, NOIR, "800");
    }
    texte(g, "acide  ←  neutre  →  base", x + w / 2, y + 116, w - 30, 12, SOBRE, NOIR, "700");
    vieillir(g, a, R.ph, 0.3, 0.25);
  }

  // Le parcours de décontamination
  {
    const [x, y, w, h] = R.vestiaire;
    g.fillStyle = "#e9e4d4";
    g.fillRect(x, y, w, h);
    g.fillStyle = "#c79a3b";
    g.fillRect(x, y, w, 34);
    texte(g, "DÉCONTAMINATION", x + w / 2, y + 18, w - 20, 20, POLICE, NOIR);
    texte(g, "CÔTÉ SALE  →  DOUCHE  →  CÔTÉ PROPRE", x + w / 2, y + 58, w - 16, 15, SOBRE, NOIR, "800");
    texte(g, "Combinaison, gants, masque : dans cet ordre.", x + w / 2, y + 86, w - 20, 12, SOBRE, NOIR, "600");
    texte(g, "Douche obligatoire, même pressé.", x + w / 2, y + 108, w - 20, 12, SOBRE, ROUGE, "800");
    vieillir(g, a, R.vestiaire, 0.3, 0.25);
  }

  // Les survivants ont écrit sur le muret du bassin
  {
    const [x, y, w, h] = R.graffiti;
    g.save();
    g.translate(x + w / 2, y + h / 2);
    g.rotate(-0.06);
    texte(g, "NE PAS BOIRE", 0, -26, w - 20, 34, FEUTRE, "rgba(200,54,43,0.92)", "700");
    texte(g, "ÇA BRÛLE !!", 6, 22, w - 40, 38, FEUTRE, "rgba(232,228,214,0.92)", "700");
    g.restore();
    ecailler(g, a, R.graffiti, 10, 2, 6);
  }

  // Le carton des survivants
  {
    const [x, y, w, h] = R.carton;
    g.fillStyle = "#b89a6a";
    g.fillRect(x + 4, y + 4, w - 8, h - 8);
    g.strokeStyle = "rgba(90,70,40,0.4)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x + 4, y + 64);
    g.lineTo(x + w - 4, y + 64);
    g.stroke();
    texte(g, "L'AIR PIQUE AU FOND.", x + w / 2, y + 36, w - 24, 24, FEUTRE, "#1f2120", "700");
    texte(g, "MASQUE OU DEMI-TOUR", x + w / 2, y + 90, w - 24, 24, FEUTRE, "#8a241c", "700");
    vieillir(g, a, R.carton, 0.15, 0.1);
  }

  // Port du masque obligatoire
  {
    const [x, y, w, h] = R.masque;
    g.fillStyle = "#e9e4d4";
    g.fillRect(x, y, w, h);
    g.fillStyle = "#2f5f9a";
    g.beginPath();
    g.arc(x + w / 2, y + 100, 76, 0, TAU);
    g.fill();
    // Le masque à gaz
    g.fillStyle = "#e9e4d4";
    g.beginPath();
    g.ellipse(x + w / 2, y + 96, 40, 48, 0, 0, TAU);
    g.fill();
    g.fillStyle = "#2f5f9a";
    for (const sx of [-1, 1]) {
      g.beginPath();
      g.arc(x + w / 2 + sx * 17, y + 82, 12, 0, TAU);
      g.fill();
    }
    g.fillRect(x + w / 2 - 14, y + 108, 28, 26);
    g.fillStyle = "#e9e4d4";
    for (let i = 0; i < 3; i++) g.fillRect(x + w / 2 - 10, y + 113 + i * 7, 20, 3);
    texte(g, "PORT DU MASQUE", x + w / 2, y + 200, w - 20, 24, POLICE, "#2f5f9a");
    texte(g, "OBLIGATOIRE", x + w / 2, y + 230, w - 20, 24, POLICE, "#2f5f9a");
    vieillir(g, a, R.masque, 0.3, 0.3);
  }
}

export function texAtlas() {
  return dessiner("uc-atlas", 1024, 1024, dessinerAtlas, false);
}

/** Le bardage en tôle ondulée : ondes verticales, coulures de rouille, plaques piquées. Tuile de 4 m. */
export function texBardage() {
  return dessiner("uc-bardage", 128, 128, (g) => {
    const a = aleatoire(5102);
    for (let x = 0; x < 128; x += 4) {
      const d = g.createLinearGradient(x, 0, x + 4, 0);
      d.addColorStop(0, "#d6d8d2");
      d.addColorStop(0.5, "#f2f2ec");
      d.addColorStop(1, "#b6b8b0");
      g.fillStyle = d;
      g.fillRect(x, 0, 4, 128);
    }
    // Les joints des plaques
    g.fillStyle = "rgba(60,60,55,0.35)";
    g.fillRect(0, 63, 128, 2);
    for (let i = 0; i < 14; i++) {
      const x = a() * 128;
      const y = a() * 128;
      const lg = 20 + a() * 70;
      for (const dy of [0, -128]) {
        const d = g.createLinearGradient(0, y + dy, 0, y + dy + lg);
        d.addColorStop(0, "rgba(150,70,30,0.32)");
        d.addColorStop(1, "rgba(150,70,30,0)");
        g.fillStyle = d;
        g.fillRect(x, y + dy, 1 + a() * 4, lg);
      }
    }
    taches(g, a, 5, "rgba(140,70,35,0.28)", 4, 14, 128, 128);
    taches(g, a, 4, "rgba(90,110,60,0.22)", 6, 16, 128, 128);
  });
}

/** La dalle de béton du site : grain, taches d'huile et de produits, fissures, joint de dilatation au bord. Tuile de 6 m. */
export function texDalle() {
  return dessiner("uc-dalle", 256, 256, (g) => {
    const a = aleatoire(5103);
    g.fillStyle = "#e4e2dc";
    g.fillRect(0, 0, 256, 256);
    grain(g, a, [0, 0, 256, 256], 2600, 0.05);
    taches(g, a, 7, "rgba(90,86,76,0.16)", 20, 70, 256, 256);
    taches(g, a, 5, "rgba(60,58,52,0.22)", 6, 22, 256, 256);
    taches(g, a, 3, "rgba(120,110,60,0.18)", 8, 30, 256, 256);
    g.strokeStyle = "rgba(50,46,40,0.45)";
    g.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      let x = a() * 256;
      let y = a() * 256;
      const dx = a() - 0.5;
      const dy = a() - 0.5;
      g.beginPath();
      g.moveTo(x, y);
      for (let k = 0; k < 14; k++) {
        x += dx * 22 + (a() - 0.5) * 8;
        y += dy * 22 + (a() - 0.5) * 8;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    g.fillStyle = "rgba(40,38,34,0.45)";
    g.fillRect(0, 0, 256, 2);
    g.fillRect(0, 0, 2, 256);
    g.fillStyle = "rgba(90,110,60,0.35)";
    g.fillRect(0, 2, 256, 1);
    g.fillRect(2, 0, 1, 256);
  });
}

/** Le béton des murets, socles et massifs : gris clair, grain, coulures légères, nids de cailloux. Tuile de 4 m. */
export function texBeton() {
  return dessiner("uc-beton", 256, 256, (g) => {
    const a = aleatoire(5104);
    g.fillStyle = "#e6e5e0";
    g.fillRect(0, 0, 256, 256);
    grain(g, a, [0, 0, 256, 256], 3000, 0.05);
    for (let y = 0; y < 256; y += 64) {
      g.fillStyle = "rgba(0,0,0,0.05)";
      g.fillRect(0, y, 256, 1);
    }
    taches(g, a, 8, "rgba(80,78,70,0.14)", 14, 50, 256, 256);
    for (let i = 0; i < 26; i++) {
      const x = a() * 256;
      const y = a() * 200;
      const lg = 30 + a() * 120;
      const d = g.createLinearGradient(0, y, 0, y + lg);
      d.addColorStop(0, "rgba(60,56,48,0.2)");
      d.addColorStop(1, "rgba(60,56,48,0)");
      g.fillStyle = d;
      g.fillRect(x, y, 1 + a() * 4, lg);
    }
    taches(g, a, 5, "rgba(80,100,55,0.22)", 8, 26, 256, 256);
  });
}
