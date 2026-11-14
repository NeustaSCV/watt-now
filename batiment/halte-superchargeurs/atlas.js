// Halte des Superchargeurs Watty : l'atlas des enseignes, écrans, affiches et motifs (une seule texture, une seule
// matière pour tous les panneaux), l'asphalte, le terrain, et la liste STRICTE des matières de la halte.
//
// Règle d'or du budget : aucune matière n'est créée ailleurs que dans `matieres()`. Une matière = un appel de dessin
// (et une de plus par couche qui s'efface où elle sert).

import * as THREE from "three";
import { PALETTE, matiere, matiereTexture, matiereVerre, matiereLueur, matiereEau, dessiner, aleatoire } from "../commun/atelier.js";

export const AL = 1024;
export const AH = 1664;

/** Les régions de l'atlas : [x, y, l, h] en pixels. */
export const R = {
  panOuest: [0, 0, 512, 224],
  panEst: [512, 0, 512, 224],
  panHub: [0, 224, 512, 256],
  ia: [512, 224, 512, 256],
  fronton: [0, 480, 512, 128],
  slogan: [512, 480, 512, 128],
  lounge: [0, 608, 512, 128],
  rescue: [512, 608, 512, 128],
  attente: [0, 736, 320, 160],
  borneEcran: [320, 736, 160, 128],
  borneOk: [480, 736, 160, 128],
  borneLogo: [640, 736, 192, 96],
  ht: [832, 736, 192, 160],
  totem: [0, 896, 192, 448],
  smoothie: [192, 896, 256, 192],
  ecranGeant: [448, 896, 384, 192],
  wc: [832, 896, 192, 192],
  boutique: [192, 1088, 256, 128],
  kids: [448, 1088, 320, 128],
  glisse: [768, 1088, 256, 128],
  graffiti: [192, 1216, 512, 128],
  tarifs: [704, 1216, 320, 128],
  solaire: [0, 1344, 256, 192],
  grillage: [256, 1344, 192, 192],
  wattyFace: [448, 1344, 192, 192],
  file: [640, 1344, 384, 96],
  armoire: [640, 1440, 192, 96],
  solaireCasse: [832, 1440, 192, 96],
  merci: [640, 832, 192, 64],
  pancarte: [0, 1536, 256, 128],
  pancarte2: [256, 1536, 256, 128],
};

// Les couleurs de la marque « Watty Supercharge » (réservées aux enseignes, Book 21 §5.3.1)
const NUIT = "#15284a";
const CYAN = "#3fc4e2";
const JAUNE = "#e8c24a";
const ROUGE = "#c8362b";
const BLANC = "#f0ede4";

// ---------- Petits outils de dessin ----------

function texte(g, t, x, y, taille, couleur, police = "900", align = "center", largeurMax = 0) {
  g.save();
  g.font = `${police} ${taille}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  if (largeurMax) {
    const l = g.measureText(t).width;
    if (l > largeurMax) {
      taille = Math.floor((taille * largeurMax) / l);
      g.font = `${police} ${taille}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
    }
  }
  g.fillStyle = couleur;
  g.textAlign = align;
  g.textBaseline = "middle";
  g.fillText(t, x, y);
  g.restore();
}

function rond(g, x, y, r, couleur) {
  g.fillStyle = couleur;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}

/** Salissures, coulures et taches, dans le rectangle donné. */
function salir(g, a, x, y, l, h, force = 1) {
  g.save();
  g.beginPath();
  g.rect(x, y, l, h);
  g.clip();
  for (let i = 0; i < (l * h) / 180; i++) {
    g.fillStyle = a() < 0.5 ? `rgba(0,0,0,${0.07 * force})` : `rgba(255,255,255,${0.05 * force})`;
    g.fillRect(x + a() * l, y + a() * h, 1 + a() * 3, 1 + a() * 3);
  }
  for (let i = 0; i < 8 * force; i++) {
    const cx = x + a() * l;
    const lg = h * (0.3 + a() * 0.8);
    const d = g.createLinearGradient(0, y, 0, y + lg);
    d.addColorStop(0, `rgba(60,52,40,${0.28 * force})`);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(cx, y, 2 + a() * 6, lg);
  }
  for (let i = 0; i < 5 * force; i++) {
    const cx = x + a() * l;
    const cy = y + a() * h;
    const r = 6 + a() * Math.min(l, h) * 0.3;
    const d = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    d.addColorStop(0, `rgba(70,60,45,${0.2 * force})`);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  g.restore();
}

/** Une fêlure en étoile (écran ou vitre cassés). */
function felure(g, a, x, y, r, couleur = "rgba(235,240,245,0.85)") {
  g.save();
  g.strokeStyle = couleur;
  g.lineWidth = 1.5;
  for (let i = 0; i < 9; i++) {
    let px = x;
    let py = y;
    const ang = (i / 9) * Math.PI * 2 + a() * 0.5;
    g.beginPath();
    g.moveTo(px, py);
    const n = 3 + Math.floor(a() * 3);
    for (let k = 0; k < n; k++) {
      px += Math.cos(ang + (a() - 0.5) * 0.6) * (r / n);
      py += Math.sin(ang + (a() - 0.5) * 0.6) * (r / n);
      g.lineTo(px, py);
    }
    g.stroke();
  }
  g.beginPath();
  g.arc(x, y, r * 0.18, 0, Math.PI * 2);
  g.stroke();
  g.restore();
}

/** L'éclair de la marque. */
function eclair(g, x, y, s, couleur = JAUNE) {
  g.save();
  g.fillStyle = couleur;
  g.beginPath();
  g.moveTo(x + s * 0.1, y - s * 0.5);
  g.lineTo(x - s * 0.28, y + s * 0.06);
  g.lineTo(x - s * 0.02, y + s * 0.06);
  g.lineTo(x - s * 0.12, y + s * 0.5);
  g.lineTo(x + s * 0.28, y - s * 0.08);
  g.lineTo(x + s * 0.02, y - s * 0.08);
  g.closePath();
  g.fill();
  g.restore();
}

/** Watty, la pile souriante de la Compagnie (« Toujours plein, jamais à plat ! »). */
function watty(g, x, y, s) {
  g.save();
  g.fillStyle = JAUNE;
  g.fillRect(x - s * 0.28, y - s * 0.45, s * 0.56, s * 0.9);
  g.fillStyle = ROUGE;
  g.fillRect(x - s * 0.28, y - s * 0.45, s * 0.56, s * 0.18);
  g.fillStyle = "#9a9a96";
  g.fillRect(x - s * 0.1, y - s * 0.55, s * 0.2, s * 0.1);
  rond(g, x - s * 0.1, y - s * 0.06, s * 0.05, "#1d2433");
  rond(g, x + s * 0.1, y - s * 0.06, s * 0.05, "#1d2433");
  g.strokeStyle = "#1d2433";
  g.lineWidth = s * 0.04;
  g.beginPath();
  g.arc(x, y + s * 0.06, s * 0.14, 0.2, Math.PI - 0.2);
  g.stroke();
  g.restore();
}

/** Le logo « Watty ⚡ Supercharge » sur une ligne. */
function logo(g, x, y, l, h, fond = NUIT) {
  g.fillStyle = fond;
  g.fillRect(x, y, l, h);
  g.fillStyle = CYAN;
  g.fillRect(x, y + h - h * 0.08, l, h * 0.08);
  eclair(g, x + h * 0.55, y + h * 0.46, h * 0.8);
  texte(g, "WATTY", x + h * 1.05, y + h * 0.36, h * 0.36, BLANC, "900", "left", l * 0.5);
  texte(g, "SUPERCHARGE", x + h * 1.05, y + h * 0.7, h * 0.24, CYAN, "800", "left", l - h * 1.2);
}

/** Un panneau de lettres lumineuses (diodes) sur fond noir. */
function fondDiodes(g, x, y, l, h, pas = 6) {
  g.fillStyle = "#0e0f10";
  g.fillRect(x, y, l, h);
  g.fillStyle = "#1f2224";
  for (let i = 2; i < l; i += pas) for (let j = 2; j < h; j += pas) g.fillRect(x + i, y + j, pas / 2, pas / 2);
}

// ---------- L'atlas ----------

function dessinerAtlas(g) {
  const a = aleatoire(3427);
  g.clearRect(0, 0, AL, AH);
  const bleuRoute = "#2d5a8a";

  // Panneaux routiers (bleu « voie rapide »)
  const panRoute = ([x, y, l, h], l1, l2, l3) => {
    g.fillStyle = BLANC;
    g.fillRect(x, y, l, h);
    g.fillStyle = bleuRoute;
    g.fillRect(x + 8, y + 8, l - 16, h - 16);
    g.strokeStyle = BLANC;
    g.lineWidth = 4;
    g.strokeRect(x + 16, y + 16, l - 32, h - 32);
    texte(g, l1, x + l / 2, y + 58, 38, BLANC, "700", "center", l - 60);
    texte(g, l2, x + l / 2, y + 122, 48, BLANC, "900", "center", l - 60);
    if (l3) texte(g, l3, x + l / 2, y + 178, 26, "#d8e2ec", "700", "center", l - 60);
    salir(g, a, x, y, l, h, 1.2);
  };
  panRoute(R.panOuest, "Voie rapide · RN 2000", "← Ville · Comptoir · 6 km", "Bonne route avec la Compagnie");
  panRoute(R.panEst, "Voie rapide · RN 2000", "Zone industrielle →", "Centrale · Aciérie · 9 km");
  // impacts de plomb sur le panneau est
  for (let i = 0; i < 7; i++) rond(g, R.panEst[0] + 400 + a() * 70, R.panEst[1] + 40 + a() * 60, 4, "#2a2a2a");

  // Le panneau d'annonce du hub (sur la bretelle)
  {
    const [x, y, l, h] = R.panHub;
    g.fillStyle = BLANC;
    g.fillRect(x, y, l, h);
    logo(g, x + 10, y + 10, l - 20, 96);
    g.fillStyle = bleuRoute;
    g.fillRect(x + 10, y + 112, l - 20, h - 122);
    texte(g, "Hub de recharge · 500 m", x + l / 2, y + 140, 32, BLANC, "800", "center", l - 40);
    texte(g, "24 bornes ultra-rapides 350 kW", x + l / 2, y + 180, 26, BLANC, "700", "center", l - 40);
    g.fillStyle = JAUNE;
    g.fillRect(x + 10, y + h - 50, l - 20, 40);
    texte(g, "0 % d'attente grâce à l'IA", x + l / 2, y + h - 30, 26, NUIT, "900", "center", l - 40);
    salir(g, a, x, y, l, h, 1.1);
  }
  // Le grand panneau publicitaire « 0 % d'attente grâce à l'IA »
  {
    const [x, y, l, h] = R.ia;
    const d = g.createLinearGradient(x, y, x + l, y + h);
    d.addColorStop(0, "#1b3a6a");
    d.addColorStop(1, "#2a7aa0");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
    watty(g, x + 90, y + 140, 170);
    texte(g, "0 %", x + 320, y + 80, 96, JAUNE, "900", "center");
    texte(g, "d'attente", x + 320, y + 150, 44, BLANC, "900", "center");
    texte(g, "grâce à l'IA", x + 320, y + 196, 38, CYAN, "800", "center");
    texte(g, "Watty Supercharge · l'intelligence qui ne dort jamais", x + l / 2, y + h - 18, 18, BLANC, "700", "center", l - 30);
    // affiche à demi arrachée (lambeaux blancs du papier)
    g.fillStyle = "#d8d2c2";
    g.beginPath();
    g.moveTo(x + l - 120, y);
    g.lineTo(x + l, y);
    g.lineTo(x + l, y + 150);
    g.lineTo(x + l - 40, y + 110);
    g.lineTo(x + l - 80, y + 60);
    g.closePath();
    g.fill();
    salir(g, a, x, y, l, h, 1.3);
  }
  // Le fronton de l'ombrière
  {
    const [x, y, l, h] = R.fronton;
    logo(g, x, y, l, h);
    salir(g, a, x, y, l, h, 0.9);
  }
  // Le slogan
  {
    const [x, y, l, h] = R.slogan;
    g.fillStyle = BLANC;
    g.fillRect(x, y, l, h);
    g.fillStyle = CYAN;
    g.fillRect(x, y, 14, h);
    texte(g, "Rechargez votre voiture,", x + 270, y + 44, 40, NUIT, "900", "center", l - 50);
    texte(g, "rechargez votre vie.", x + 270, y + 92, 40, ROUGE, "900", "center", l - 50);
    salir(g, a, x, y, l, h, 1.2);
  }
  // L'enseigne du lounge
  {
    const [x, y, l, h] = R.lounge;
    g.fillStyle = "#f4f1ea";
    g.fillRect(x, y, l, h);
    eclair(g, x + 64, y + h / 2, 90, CYAN);
    texte(g, "WATTY LOUNGE", x + 290, y + 52, 58, NUIT, "900", "center", l - 140);
    texte(g, "détendez-vous, on s'occupe de tout", x + 290, y + 100, 22, "#5a6a7a", "700", "center", l - 140);
    salir(g, a, x, y, l, h, 0.8);
  }
  // La livrée du camion de dépannage « Watty Rescue »
  {
    const [x, y, l, h] = R.rescue;
    g.fillStyle = "#eeeae0";
    g.fillRect(x, y, l, h);
    g.fillStyle = ROUGE;
    for (let i = -2; i < 14; i++) {
      g.beginPath();
      g.moveTo(x + i * 40, y + h);
      g.lineTo(x + i * 40 + 20, y + h);
      g.lineTo(x + i * 40 + 60, y + h - 26);
      g.lineTo(x + i * 40 + 40, y + h - 26);
      g.fill();
    }
    watty(g, x + 60, y + 52, 84);
    texte(g, "WATTY RESCUE", x + 300, y + 40, 50, NUIT, "900", "center", 360);
    texte(g, "Votre batterie de secours chez vous en 20 min", x + 300, y + 80, 18, "#3a4a5a", "700", "center", 380);
    salir(g, a, x, y, l, h, 1.4);
    // suie de l'incendie
    for (let i = 0; i < 4; i++) {
      const cx = x + l - 120 + a() * 100;
      const cy = y + a() * h;
      const d = g.createRadialGradient(cx, cy, 0, cx, cy, 70);
      d.addColorStop(0, "rgba(25,22,20,0.8)");
      d.addColorStop(1, "rgba(25,22,20,0)");
      g.fillStyle = d;
      g.fillRect(cx - 70, cy - 70, 140, 140);
    }
  }
  // L'écran du totem : temps d'attente estimé (diodes ambrées)
  {
    const [x, y, l, h] = R.attente;
    fondDiodes(g, x, y, l, h);
    texte(g, "TEMPS D'ATTENTE ESTIMÉ", x + l / 2, y + 30, 22, "#ffb33a", "700", "center", l - 20);
    texte(g, "3 427 JOURS", x + l / 2, y + 86, 52, "#ffb33a", "900", "center", l - 24);
    texte(g, "MERCI DE VOTRE PATIENCE", x + l / 2, y + 136, 18, "#ff9a2a", "700", "center", l - 20);
  }
  // L'écran d'une borne, fendu
  {
    const [x, y, l, h] = R.borneEcran;
    g.fillStyle = "#1a2a3a";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#24405a";
    g.fillRect(x + 6, y + 6, l - 12, 26);
    texte(g, "⚠ ACCÈS REFUSÉ", x + l / 2, y + 19, 15, "#ffcf6a", "800", "center", l - 16);
    texte(g, "Votre abonnement", x + l / 2, y + 50, 15, "#d8e6f0", "700", "center", l - 14);
    texte(g, "ne permet pas la", x + l / 2, y + 70, 15, "#d8e6f0", "700", "center", l - 14);
    texte(g, "recharge à cette heure", x + l / 2, y + 90, 15, "#d8e6f0", "700", "center", l - 14);
    texte(g, "Passez à Infini+ →", x + l / 2, y + 113, 13, CYAN, "800", "center", l - 14);
    felure(g, a, x + 50, y + 46, 70);
    // coin noirci : l'écran est mort
    const d = g.createRadialGradient(x + l, y + h, 0, x + l, y + h, 110);
    d.addColorStop(0, "rgba(5,8,10,0.9)");
    d.addColorStop(1, "rgba(5,8,10,0)");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
  }
  // L'écran de la seule borne qui marche (bleu, lumineux)
  {
    const [x, y, l, h] = R.borneOk;
    const d = g.createLinearGradient(x, y, x, y + h);
    d.addColorStop(0, "#1d6fb8");
    d.addColorStop(1, "#0d3d74");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
    eclair(g, x + l / 2, y + 30, 40, "#bfefff");
    texte(g, "Recharge en cours", x + l / 2, y + 64, 16, "#e8f8ff", "800", "center", l - 14);
    g.fillStyle = "#0a2a50";
    g.fillRect(x + 14, y + 80, l - 28, 14);
    g.fillStyle = "#7fe8ff";
    g.fillRect(x + 14, y + 80, 4, 14);
    texte(g, "1 % · fin : 3 427 j", x + l / 2, y + 110, 14, "#bfefff", "700", "center", l - 14);
  }
  // Le logo des bornes
  {
    const [x, y, l, h] = R.borneLogo;
    logo(g, x, y, l, h);
  }
  // Les pancartes en carton de ceux qui ont attendu (feutre noir)
  const carton = ([x, y, l, h], l1, l2) => {
    g.fillStyle = "#b8925e";
    g.fillRect(x + 4, y + 4, l - 8, h - 8);
    g.fillStyle = "rgba(90,60,30,0.3)";
    g.fillRect(x + 4, y + h / 2 - 2, l - 8, 4);
    texte(g, l1, x + l / 2, y + 44, 34, "#1a1612", "900", "center", l - 24);
    texte(g, l2, x + l / 2, y + 90, 24, "#1a1612", "800", "center", l - 24);
    salir(g, a, x, y, l, h, 1.4);
  };
  carton(R.pancarte, "JOUR 12", "toujours rien.");
  carton(R.pancarte2, "RÉSERVÉ !", "on revient demain");
  // Le panneau d'au revoir, à la sortie
  {
    const [x, y, l, h] = R.merci;
    g.fillStyle = NUIT;
    g.fillRect(x, y, l, h);
    eclair(g, x + 26, y + h / 2, 44);
    texte(g, "Merci d'avoir rechargé !", x + 112, y + 22, 17, BLANC, "900", "center", 150);
    texte(g, "à très vite chez Watty", x + 112, y + 46, 13, CYAN, "700", "center", 150);
    salir(g, a, x, y, l, h, 1.3);
  }
  // Danger haute tension
  {
    const [x, y, l, h] = R.ht;
    g.fillStyle = "#f0e9d6";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#e8c22a";
    g.strokeStyle = "#111";
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(x + l / 2, y + 10);
    g.lineTo(x + l / 2 + 62, y + 112);
    g.lineTo(x + l / 2 - 62, y + 112);
    g.closePath();
    g.fill();
    g.stroke();
    eclair(g, x + l / 2, y + 74, 54, "#111");
    texte(g, "DANGER DE MORT", x + l / 2, y + 128, 20, "#111", "900", "center", l - 14);
    texte(g, "HAUTE TENSION · 20 000 V", x + l / 2, y + 148, 14, "#a01e18", "800", "center", l - 14);
    salir(g, a, x, y, l, h, 1.3);
  }
  // Le totem (vertical)
  {
    const [x, y, l, h] = R.totem;
    g.fillStyle = NUIT;
    g.fillRect(x, y, l, h);
    eclair(g, x + l / 2, y + 70, 100);
    texte(g, "WATTY", x + l / 2, y + 150, 46, BLANC, "900", "center", l - 20);
    texte(g, "SUPERCHARGE", x + l / 2, y + 186, 22, CYAN, "800", "center", l - 20);
    g.fillStyle = CYAN;
    g.fillRect(x + 20, y + 210, l - 40, 4);
    texte(g, "24", x + l / 2, y + 262, 72, BLANC, "900", "center");
    texte(g, "bornes", x + l / 2, y + 306, 26, BLANC, "700", "center");
    texte(g, "350 kW", x + l / 2, y + 354, 40, JAUNE, "900", "center");
    texte(g, "Lounge · Boutique", x + l / 2, y + 398, 18, "#bcd0e4", "700", "center", l - 16);
    texte(g, "Smoothies · Kids", x + l / 2, y + 422, 18, "#bcd0e4", "700", "center", l - 16);
    salir(g, a, x, y, l, h, 1.1);
  }
  // Le menu du bar à smoothies
  {
    const [x, y, l, h] = R.smoothie;
    g.fillStyle = "#f4efe0";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#7ac25a";
    g.fillRect(x, y, l, 34);
    texte(g, "SMOOTHIE BAR", x + l / 2, y + 18, 22, "#fff", "900", "center");
    const lignes = [["Banane-Volt", "12 Wh"], ["Détox Lithium", "15 Wh"], ["Kiwi Kilowatt", "14 Wh"], ["Recharge Mentale", "19 Wh"], ["Spiruline Premium", "29 Wh"]];
    lignes.forEach(([n, p], i) => {
      texte(g, n, x + 14, y + 56 + i * 26, 16, "#2a3a2a", "800", "left");
      texte(g, p, x + l - 14, y + 56 + i * 26, 16, ROUGE, "900", "right");
    });
    salir(g, a, x, y, l, h, 1);
  }
  // L'écran géant du lounge : mort, mais l'image est restée marquée dans la dalle
  {
    const [x, y, l, h] = R.ecranGeant;
    g.fillStyle = "#101418";
    g.fillRect(x, y, l, h);
    texte(g, "Votre recharge commence bientôt", x + l / 2, y + 70, 30, "rgba(90,140,170,0.45)", "900", "center", l - 30);
    texte(g, "☺ Profitez du Watty Lounge", x + l / 2, y + 118, 24, "rgba(90,140,170,0.35)", "800", "center", l - 30);
    felure(g, a, x + 270, y + 70, 120, "rgba(200,210,220,0.5)");
    g.fillStyle = "rgba(255,255,255,0.05)";
    g.fillRect(x, y, l, h * 0.4);
  }
  // Toilettes autonettoyantes
  {
    const [x, y, l, h] = R.wc;
    g.fillStyle = "#e8eef0";
    g.fillRect(x, y, l, h);
    g.fillStyle = CYAN;
    g.fillRect(x, y, l, 40);
    texte(g, "TOILETTES", x + l / 2, y + 21, 24, "#fff", "900", "center");
    texte(g, "autonettoyantes", x + l / 2, y + 60, 20, NUIT, "800", "center", l - 14);
    texte(g, "cycle de nettoyage", x + l / 2, y + 100, 16, "#5a6a7a", "700", "center", l - 14);
    texte(g, "en cours…", x + l / 2, y + 120, 16, "#5a6a7a", "700", "center", l - 14);
    texte(g, "patientez 4 min", x + l / 2, y + 150, 18, ROUGE, "900", "center", l - 14);
    salir(g, a, x, y, l, h, 1);
  }
  // Boutique
  {
    const [x, y, l, h] = R.boutique;
    g.fillStyle = JAUNE;
    g.fillRect(x, y, l, h);
    watty(g, x + 42, y + 64, 90);
    texte(g, "BOUTIQUE", x + 160, y + 46, 30, NUIT, "900", "center", 170);
    texte(g, "WATTY", x + 160, y + 84, 34, ROUGE, "900", "center", 170);
    salir(g, a, x, y, l, h, 0.9);
  }
  // Aire de jeux
  {
    const [x, y, l, h] = R.kids;
    g.fillStyle = "#f2efe6";
    g.fillRect(x, y, l, h);
    const tons = [ROUGE, JAUNE, CYAN, "#7ac25a", "#e88a3a"];
    "WATTY KIDS".split("").forEach((ch, i) => texte(g, ch, x + 36 + i * 28, y + 48, 40, tons[i % 5], "900", "center"));
    texte(g, "Ici, on recharge aussi les petits !", x + l / 2, y + 98, 18, NUIT, "800", "center", l - 20);
    salir(g, a, x, y, l, h, 1.2);
  }
  // Trottinettes en libre-service
  {
    const [x, y, l, h] = R.glisse;
    g.fillStyle = "#2a9a7a";
    g.fillRect(x, y, l, h);
    texte(g, "WATTY GLISSE", x + l / 2, y + 36, 30, "#fff", "900", "center", l - 20);
    texte(g, "libre-service · 0,49 Wh/min", x + l / 2, y + 72, 17, "#e8fff4", "700", "center", l - 20);
    texte(g, "scannez pour déverrouiller", x + l / 2, y + 100, 16, "#e8fff4", "700", "center", l - 20);
    salir(g, a, x, y, l, h, 1.2);
  }
  // Le graffiti des Voltaïques (bombe blanche et jaune sur fond transparent)
  {
    const [x, y, l, h] = R.graffiti;
    g.save();
    g.translate(x + l / 2, y + h / 2);
    g.rotate(-0.03);
    eclair(g, -210, 0, 100, "#f2d64a");
    texte(g, "VOLTAÏQUES", 20, -26, 52, "#f4f1e8", "900", "center", 380);
    texte(g, "Le cuivre est à nous. Passez, ne touchez à rien.", 30, 32, 22, "#f2d64a", "800", "center", 400);
    g.restore();
  }
  // Le tableau des tarifs
  {
    const [x, y, l, h] = R.tarifs;
    g.fillStyle = NUIT;
    g.fillRect(x, y, l, h);
    texte(g, "TARIFS", x + l / 2, y + 18, 18, CYAN, "900", "center");
    texte(g, "Express Premium+ · 0,99 Wh/min", x + 12, y + 46, 15, BLANC, "700", "left", l - 20);
    texte(g, "Infini · recharge illimitée*", x + 12, y + 70, 15, BLANC, "700", "left", l - 20);
    texte(g, "Lounge Pass · 49 Wh/jour", x + 12, y + 94, 15, BLANC, "700", "left", l - 20);
    texte(g, "*hors heures de pointe (0 h – 24 h)", x + 12, y + 116, 12, "#9ab0c8", "600", "left", l - 20);
    salir(g, a, x, y, l, h, 0.9);
  }
  // Panneau solaire : cellules bleu nuit, fins filets d'argent, reflet
  const cellules = ([x, y, l, h], casse) => {
    g.fillStyle = "#c8ccd0";
    g.fillRect(x, y, l, h);
    const nx = 8;
    const ny = 5;
    const cl = (l - 8) / nx;
    const ch = (h - 8) / ny;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const v = 34 + Math.floor(a() * 14);
      g.fillStyle = `rgb(${v},${v + 22},${v + 62})`;
      g.fillRect(x + 4 + i * cl + 1, y + 4 + j * ch + 1, cl - 2, ch - 2);
    }
    g.fillStyle = "rgba(200,220,240,0.12)";
    g.beginPath();
    g.moveTo(x, y + h);
    g.lineTo(x + l * 0.45, y);
    g.lineTo(x + l * 0.7, y);
    g.lineTo(x + l * 0.25, y + h);
    g.fill();
    if (casse) {
      felure(g, a, x + l * 0.4, y + h * 0.5, Math.min(l, h) * 0.9, "rgba(225,235,245,0.9)");
      felure(g, a, x + l * 0.78, y + h * 0.3, Math.min(l, h) * 0.5, "rgba(225,235,245,0.8)");
    }
    salir(g, a, x, y, l, h, 0.6);
  };
  cellules(R.solaire, false);
  cellules(R.solaireCasse, true);
  // Grillage (mailles en losange, fond transparent)
  {
    const [x, y, l, h] = R.grillage;
    g.save();
    g.beginPath();
    g.rect(x, y, l, h);
    g.clip();
    g.strokeStyle = "#c9ccc8";
    g.lineWidth = 2.2;
    for (let k = -h; k < l + h; k += 12) {
      g.beginPath();
      g.moveTo(x + k, y);
      g.lineTo(x + k + h, y + h);
      g.stroke();
      g.beginPath();
      g.moveTo(x + k, y + h);
      g.lineTo(x + k + h, y);
      g.stroke();
    }
    g.lineWidth = 5;
    g.strokeRect(x + 2, y + 2, l - 4, h - 4);
    g.restore();
  }
  // Le visage de Watty (la mascotte gonflable)
  {
    const [x, y, l, h] = R.wattyFace;
    g.fillStyle = JAUNE;
    g.fillRect(x, y, l, h);
    rond(g, x + l * 0.32, y + h * 0.4, 18, "#1d2433");
    rond(g, x + l * 0.68, y + h * 0.4, 18, "#1d2433");
    rond(g, x + l * 0.32 + 6, y + h * 0.4 - 6, 5, "#fff");
    rond(g, x + l * 0.68 + 6, y + h * 0.4 - 6, 5, "#fff");
    g.strokeStyle = "#1d2433";
    g.lineWidth = 9;
    g.beginPath();
    g.arc(x + l / 2, y + h * 0.56, 42, 0.25, Math.PI - 0.25);
    g.stroke();
    rond(g, x + l * 0.2, y + h * 0.62, 14, "rgba(220,110,90,0.5)");
    rond(g, x + l * 0.8, y + h * 0.62, 14, "rgba(220,110,90,0.5)");
    salir(g, a, x, y, l, h, 1.2);
  }
  // La file d'attente « optimisée »
  {
    const [x, y, l, h] = R.file;
    g.fillStyle = BLANC;
    g.fillRect(x, y, l, h);
    g.fillStyle = CYAN;
    g.fillRect(x, y, 10, h);
    texte(g, "File optimisée par IA", x + l / 2 + 5, y + 32, 28, NUIT, "900", "center", l - 30);
    texte(g, "Restez dans votre couloir · votre tour arrive", x + l / 2 + 5, y + 68, 17, "#4a5a6a", "700", "center", l - 30);
    salir(g, a, x, y, l, h, 1.1);
  }
  // Façade d'une armoire de batteries : étiquette, voyants, grilles
  {
    const [x, y, l, h] = R.armoire;
    g.fillStyle = "#d4d6d4";
    g.fillRect(x, y, l, h);
    g.fillStyle = NUIT;
    g.fillRect(x + 8, y + 8, l - 16, 22);
    texte(g, "WATTY STOCK · 1 MWh", x + l / 2, y + 19, 13, BLANC, "800", "center", l - 20);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = "#9a9e9c";
      g.fillRect(x + 14 + i * 28, y + 40, 20, 40);
      g.fillStyle = "#7a7e7c";
      for (let j = 0; j < 5; j++) g.fillRect(x + 16 + i * 28, y + 44 + j * 7, 16, 2);
    }
    rond(g, x + l - 18, y + 19, 5, "#5ad86a");
    salir(g, a, x, y, l, h, 1);
  }
}

// ---------- Asphalte et terrain ----------

function dessinerAsphalte(g) {
  const a = aleatoire(91);
  g.fillStyle = "#c2c3c0";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5200; i++) {
    const v = 140 + Math.floor(a() * 100);
    g.fillStyle = `rgba(${v},${v},${v - 4},0.5)`;
    g.fillRect(a() * 256, a() * 256, 1 + a() * 2, 1 + a() * 2);
  }
  for (let i = 0; i < 9; i++) {
    const x = a() * 256;
    const y = a() * 256;
    const r = 10 + a() * 40;
    const d = g.createRadialGradient(x, y, 0, x, y, r);
    d.addColorStop(0, "rgba(40,40,40,0.18)");
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.strokeStyle = "rgba(35,35,35,0.55)";
  g.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    let x = a() * 256;
    let y = a() * 256;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 8; k++) {
      x += (a() - 0.5) * 30;
      y += (a() - 0.5) * 30;
      g.lineTo(x, y);
    }
    g.stroke();
  }
}

function dessinerTerrain(g) {
  const a = aleatoire(92);
  g.fillStyle = "#d8d8cc";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4200; i++) {
    g.fillStyle = a() < 0.5 ? "rgba(60,70,40,0.13)" : "rgba(255,255,230,0.12)";
    g.fillRect(a() * 256, a() * 256, 1 + a() * 3, 1 + a() * 3);
  }
  for (let i = 0; i < 22; i++) {
    const x = a() * 256;
    const y = a() * 256;
    const r = 12 + a() * 40;
    const d = g.createRadialGradient(x, y, 0, x, y, r);
    d.addColorStop(0, a() < 0.6 ? "rgba(90,80,40,0.16)" : "rgba(255,255,220,0.14)");
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

// ---------- LA liste des matières (stricte) ----------

let MATS = null;
/**
 * Les 13 matières de la halte, pas une de plus :
 * mat, satin, lisse, tole, metal (les 5 finitions de l'atelier) ; asphalte, terrain (texturées) ; verre ; enseignes
 * (l'atlas, découpé) ; ecran (l'atlas, émissif) ; lueur (additive, teinte par sommet) ; eau ; toile (double face).
 */
export function matieres() {
  if (MATS) return MATS;
  const atlas = dessiner("watty-hub-atlas", AL, AH, dessinerAtlas, false);
  const asphalte = matiereTexture(dessiner("watty-hub-asphalte", 256, 256, dessinerAsphalte), { roughness: 0.95 });
  asphalte.userData.tuile = 6;
  const terrain = matiereTexture(dessiner("watty-hub-terrain", 256, 256, dessinerTerrain), { roughness: 1 });
  terrain.userData.tuile = 9;
  const enseignes = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.75, alphaTest: 0.5, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  const ecran = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 1.25, vertexColors: true, roughness: 0.4, alphaTest: 0.5, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  ecran.userData.sansOmbre = true;
  const toile = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, flatShading: true, side: THREE.DoubleSide });
  MATS = {
    mat: matiere(0.95, 0),
    satin: matiere(0.6, 0.05),
    lisse: matiere(0.3, 0.05),
    tole: matiere(0.75, 0.3),
    metal: matiere(0.4, 0.7),
    asphalte,
    terrain,
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    enseignes,
    ecran,
    lueur: matiereLueur(0xffffff, 0.5),
    eau: matiereEau(0x7d8f78, 0.8),
    toile,
  };
  return MATS;
}
