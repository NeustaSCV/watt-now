// La halte de la route du pont : matières, textures, atlas des enseignes et petits objets (voitures, barques, mobilier).
//
// Toutes les fonctions posent dans un Chantier de l'atelier commun, dans le repère courant. Les matières sont créées
// une seule fois (module) : les quatre tronçons les partagent, ce qui tient le compte des appels de dessin.

import * as THREE from "three";
import { PALETTE, aleatoire, matiere, matiereMonde, matiereTexture, matiereVerre, matiereLueur, MAT, dessiner, taches } from "../commun/atelier.js";

// ---------- Couleurs du lieu : sel, rouille, vase ----------

export const C = {
  asphalte: 0x8e8d88,
  asphalteSombre: 0x6f6e6a,
  ligne: 0xd9d6cc,
  trottoir: 0xb3ada2,
  sable: 0xcdbf9c,
  sableClair: 0xddd1b2,
  sol: 0xb9b19c,
  paves: 0xa49c8c,
  vase: 0x766a58,
  vaseClaire: 0x857a66,
  fond: 0x4f4a3e,
  algues: 0x3f4a32,
  alguesBrunes: 0x5a5236,
  quai: 0xa8a090,
  quaiSombre: 0x857e70,
  beton: 0xbdb7aa,
  betonSombre: 0x9a9488,
  peintureTreillis: 0x5f6e66, // le vert-de-gris des ponts d'avant-guerre, délavé
  rouille: 0x76493a,
  rouilleClaire: 0x8a6650,
  cable: 0x4a4c4c,
  fiente: 0xeceae2,
  oyat: 0xa9ad7c,
  oyatSec: 0xc6b98a,
  bois: 0x7a5a3c,
  boisGris: 0x8f8778,
  boisClair: 0x9f8460,
  enduit: 0xded3bc,
  enduitBleu: 0xc9d2cf,
  volet: 0x5d8a96, // le bleu des volets de bord de mer, passé
  voletVert: 0x6f8b76,
  tuile: 0xa86b52,
  tole: 0x7f8789,
  coque: 0x3f5a54,
  antifouling: 0x8a3e30,
  blanc: 0xe4e2da,
  eauEstuaire: 0x7f9890,
};

// ---------- Textures dessinées ----------

function grain(g, a, n, l, h, force = 0.06) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = a() < 0.5 ? `rgba(0,0,0,${force})` : `rgba(255,255,255,${force})`;
    g.fillRect(a() * l, a() * h, 1 + a() * 2.5, 1 + a() * 2.5);
  }
}

function fissures(g, a, n, l, h, couleur) {
  g.strokeStyle = couleur;
  g.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    let x = a() * l;
    let y = a() * h;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 7; k++) {
      x += (a() - 0.5) * 26;
      y += (a() - 0.3) * 20;
      g.lineTo(x, y);
    }
    g.stroke();
  }
}

/** Le sol de bord de mer : sable gris, gravillons, coquilles brisées. Tuile de 6 m. */
function dessinerSol(g) {
  const a = aleatoire(301);
  g.fillStyle = "#dcd6c8";
  g.fillRect(0, 0, 256, 256);
  taches(g, a, 18, "rgba(120, 110, 90, 0.18)", 14, 50, 256, 256);
  taches(g, a, 10, "rgba(255, 255, 250, 0.2)", 10, 40, 256, 256);
  grain(g, a, 2600, 256, 256, 0.07);
  for (let i = 0; i < 160; i++) {
    const v = 150 + Math.floor(a() * 80);
    g.fillStyle = `rgba(${v},${v - 6},${v - 16},0.7)`;
    g.beginPath();
    g.ellipse(a() * 256, a() * 256, 1 + a() * 2.2, 0.8 + a() * 1.6, a() * 3, 0, 7);
    g.fill();
  }
}

/** Les pavés du quai : granit, joints de sable. Tuile de 2,5 m. */
function dessinerPaves(g) {
  const a = aleatoire(302);
  g.fillStyle = "#a39d90";
  g.fillRect(0, 0, 256, 256);
  const h = 21;
  for (let r = 0; r * h < 256; r++) {
    let x = -a() * 20;
    while (x < 256) {
      const l = 18 + a() * 12;
      const v = 196 + Math.floor((a() - 0.5) * 44);
      g.fillStyle = `rgb(${v},${v - 4},${v - 12})`;
      g.beginPath();
      if (g.roundRect) g.roundRect(x + 1.5, r * h + 1.5, l - 3, h - 3, 4);
      else g.rect(x + 1.5, r * h + 1.5, l - 3, h - 3);
      g.fill();
      x += l;
    }
  }
  taches(g, a, 12, "rgba(60, 54, 44, 0.22)", 10, 40, 256, 256);
  taches(g, a, 6, "rgba(90, 110, 60, 0.22)", 6, 18, 256, 256);
  grain(g, a, 900, 256, 256, 0.05);
}

/** L'enrobé fatigué : grain, fissures, reprises. Tuile de 5 m. */
function dessinerAsphalte(g) {
  const a = aleatoire(303);
  g.fillStyle = "#c4c3be";
  g.fillRect(0, 0, 256, 256);
  grain(g, a, 4200, 256, 256, 0.08);
  taches(g, a, 12, "rgba(40, 40, 40, 0.16)", 16, 56, 256, 256);
  taches(g, a, 6, "rgba(255, 255, 255, 0.12)", 10, 36, 256, 256);
  fissures(g, a, 7, 256, 256, "rgba(40, 38, 36, 0.5)");
  g.fillStyle = "rgba(30,30,30,0.12)";
  g.fillRect(150, 0, 60, 256);
}

/** Le béton lisse des années trente, sans planches de coffrage : nuages, coulures légères, salpêtre. Tuile de 4 m. */
function dessinerBeton(g) {
  const a = aleatoire(304);
  g.fillStyle = "#e7e4dd";
  g.fillRect(0, 0, 256, 256);
  taches(g, a, 22, "rgba(110, 104, 92, 0.12)", 20, 70, 256, 256);
  taches(g, a, 10, "rgba(255, 255, 255, 0.18)", 10, 40, 256, 256);
  grain(g, a, 1800, 256, 256, 0.04);
  for (let i = 0; i < 26; i++) {
    const x = a() * 256;
    const lg = 40 + a() * 140;
    const d = g.createLinearGradient(0, 0, 0, lg);
    d.addColorStop(0, "rgba(70, 60, 48, 0.16)");
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(x, a() * 120, 1 + a() * 4, lg);
  }
}

/** L'eau de l'estuaire : filets de courant étirés dans le sens de la descente (v), raccordés. */
function dessinerEau(g) {
  const a = aleatoire(305);
  g.fillStyle = "#c7cfc6";
  g.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 170; i++) {
    const x = a() * 128;
    const y = a() * 256;
    const lg = 14 + a() * 60;
    g.fillStyle = a() < 0.5 ? `rgba(255,255,255,${0.14 + a() * 0.2})` : `rgba(30,40,30,${0.1 + a() * 0.14})`;
    const l = 1 + a() * 2.5;
    g.fillRect(x, y, l, lg);
    if (y + lg > 256) g.fillRect(x, y - 256, l, lg);
  }
  taches(g, a, 8, "rgba(255,255,255,0.1)", 10, 30, 128, 256);
}

// ---------- L'atlas des enseignes ----------

export const AL = 1024;
export const AH = 1536; // 1024 × 1536 : le bas de l'atlas porte les deux panneaux de sortie (R52) et une case blanche
export const R = {
  pontConnecte: [0, 0, 512, 128],
  pontExpress: [512, 0, 256, 256],
  tarifs: [768, 0, 256, 256],
  peage: [0, 128, 512, 96],
  bar: [0, 224, 512, 128],
  ardoise: [512, 256, 256, 160],
  plaque1934: [768, 256, 256, 128],
  exvoto1: [768, 384, 256, 128],
  exvoto2: [512, 416, 256, 128],
  chapelle: [0, 352, 512, 64],
  dirOuest: [0, 416, 512, 128],
  dirEst: [0, 544, 512, 128],
  finConnecte: [512, 544, 512, 128],
  peniche: [0, 672, 256, 64],
  hangar: [256, 672, 512, 64],
  watty: [768, 672, 256, 320],
  barricade: [0, 736, 256, 128],
  unALaFois: [256, 736, 256, 64],
  drone: [256, 800, 128, 128],
  limite: [384, 800, 128, 128],
  echelle: [512, 800, 64, 224], // les chiffres de l'échelle de marée : voir chiffre(d)
  marees: [576, 800, 192, 128],
  registre: [0, 864, 256, 128],
  pontier: [256, 928, 256, 64],
  bouee: [576, 928, 192, 96],
  // Les panneaux de sortie (R52, R0-1) : grosses lettres sombres sur fond clair, la vraie destination
  sortieOuest: [0, 1024, 1024, 240],
  sortieEst: [0, 1264, 1024, 240],
  // Une case blanche : les pièces d'un objet à une seule matière (atlas) prennent leur teinte des sommets
  blanc: [0, 1504, 32, 32],
};

/** Les textes des panneaux de sortie, validés par le porteur (demande du 2026-10-15, §0) : à recopier exactement. */
export const TEXTES_SORTIE = {
  ouest: "← Ton terrain · 3 km · Grand Hôtel des Flots, par le pont →",
  est: "Grand Hôtel des Flots · 2 km → · ← Le pont, ton terrain",
};

/** La case du chiffre `d` (0 à 9) de l'échelle de marée, dans l'atlas. */
export function chiffre(d) {
  return [512 + (d % 2) * 32, 800 + Math.floor(d / 2) * 44, 32, 44];
}

function texte(g, t, x, y, taille, couleur, { police = "bold", fonte = "'Avenir Next Condensed', 'Futura', sans-serif", align = "center", max } = {}) {
  g.font = `${police} ${taille}px ${fonte}`;
  g.fillStyle = couleur;
  g.textAlign = align;
  g.textBaseline = "middle";
  g.fillText(t, x, y, max);
}

function salir(g, a, l, h, n = 8, force = 0.18) {
  for (let i = 0; i < n; i++) {
    const x = a() * l;
    const y = a() * h;
    const r = 6 + a() * 26;
    const d = g.createRadialGradient(x, y, 0, x, y, r);
    d.addColorStop(0, `rgba(60, 50, 40, ${force})`);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

/** Des fientes de mouettes : coulures blanches qui partent du haut. */
function fientesPeintes(g, a, l, h, n = 6) {
  for (let i = 0; i < n; i++) {
    const x = a() * l;
    const lg = 8 + a() * h * 0.5;
    g.fillStyle = "rgba(245, 243, 235, 0.85)";
    g.beginPath();
    g.ellipse(x, 4 + a() * 6, 3 + a() * 4, 3, 0, 0, 7);
    g.fill();
    g.fillRect(x - 1, 4, 2 + a() * 2, lg);
  }
}

function region(g, r, trace) {
  const [x, y, l, h] = r;
  g.save();
  g.translate(x, y);
  g.beginPath();
  g.rect(0, 0, l, h);
  g.clip();
  trace(l, h);
  g.restore();
}

function eclair(g, x, y, s, couleur) {
  g.fillStyle = couleur;
  g.beginPath();
  g.moveTo(x + 0.1 * s, y - 0.5 * s);
  g.lineTo(x - 0.3 * s, y + 0.08 * s);
  g.lineTo(x, y + 0.08 * s);
  g.lineTo(x - 0.12 * s, y + 0.5 * s);
  g.lineTo(x + 0.3 * s, y - 0.1 * s);
  g.lineTo(x, y - 0.1 * s);
  g.closePath();
  g.fill();
}

function bateau(g, x, y, s, coque = "#2f4f6a", voile = "#efe6d2") {
  g.fillStyle = coque;
  g.beginPath();
  g.moveTo(x - s, y);
  g.lineTo(x + s, y);
  g.lineTo(x + s * 0.7, y + s * 0.35);
  g.lineTo(x - s * 0.75, y + s * 0.35);
  g.closePath();
  g.fill();
  g.fillStyle = voile;
  g.beginPath();
  g.moveTo(x, y - s * 1.2);
  g.lineTo(x, y - 2);
  g.lineTo(x + s * 0.8, y - 2);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(x - 3, y - s * 1.0);
  g.lineTo(x - 3, y - 2);
  g.lineTo(x - s * 0.6, y - 2);
  g.closePath();
  g.fill();
}

function dessinerAtlas(g) {
  const a = aleatoire(1934);
  g.fillStyle = "#777";
  g.fillRect(0, 0, AL, AH);

  // Le panneau lumineux à l'entrée du pont (écran : il luit encore la nuit, par à-coups)
  region(g, R.pontConnecte, (l, h) => {
    g.fillStyle = "#0b1218";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "rgba(80, 200, 255, 0.06)";
    for (let y = 0; y < h; y += 4) g.fillRect(0, y, l, 2);
    eclair(g, 46, 54, 60, "#c79a3b");
    texte(g, "PONT CONNECTÉ", 290, 38, 46, "#7fd6ff");
    texte(g, "votre passage est optimisé en temps réel", 290, 82, 23, "#d8eef6", { police: "" });
    texte(g, "trafic : 0 véhicule · attente : 0 min", 290, 112, 17, "#f0b860", { police: "" });
    // Des pixels morts en colonnes
    g.fillStyle = "#0b1218";
    for (let i = 0; i < 9; i++) g.fillRect(90 + a() * 400, 0, 3 + a() * 10, h);
  });
  // La borne de télépéage moderne
  region(g, R.pontExpress, (l, h) => {
    g.fillStyle = "#12324a";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#e9dfc6";
    g.fillRect(0, 0, l, 56);
    texte(g, "PONT EXPRESS", l / 2, 22, 30, "#12324a");
    texte(g, "sans arrêt", l / 2, 46, 20, "#c8362b", { police: "italic bold" });
    g.fillStyle = "#081620";
    g.fillRect(24, 72, l - 48, 96);
    texte(g, "BADGE NON RECONNU", l / 2, 104, 20, "#ff6a5a");
    texte(g, "abonnez-vous : 9 Wh / mois", l / 2, 138, 17, "#9fd0ff", { police: "" });
    eclair(g, 54, 206, 44, "#c79a3b");
    texte(g, "Watty vous", 160, 196, 18, "#e9dfc6", { police: "" });
    texte(g, "fait gagner du temps", 160, 220, 18, "#e9dfc6", { police: "" });
    salir(g, a, l, h, 6, 0.2);
  });
  // Les tarifs du péage de 1934, peints sur tôle émaillée
  region(g, R.tarifs, (l, h) => {
    g.fillStyle = "#1f3a5c";
    g.fillRect(0, 0, l, h);
    g.strokeStyle = "#e8e2d0";
    g.lineWidth = 4;
    g.strokeRect(8, 8, l - 16, h - 16);
    texte(g, "TARIF DU PÉAGE", l / 2, 34, 24, "#e8e2d0");
    const lignes = [["Piéton", "0 f 10"], ["Bicyclette", "0 f 25"], ["Charrette", "1 f"], ["Automobile", "2 f"], ["Autocar", "5 f"], ["Troupeau, par tête", "0 f 05"]];
    lignes.forEach(([n, p], i) => {
      texte(g, n, 26, 72 + i * 28, 17, "#e8e2d0", { police: "", align: "left" });
      texte(g, p, l - 26, 72 + i * 28, 17, "#e8e2d0", { align: "right" });
    });
    g.fillStyle = "rgba(160, 80, 40, 0.5)";
    for (let i = 0; i < 9; i++) g.fillRect(a() * l, a() * h, 4 + a() * 16, 3 + a() * 10);
  });
  // La plaque peinte du péage, au-dessus du guichet
  region(g, R.peage, (l, h) => {
    g.fillStyle = "#e4dcc6";
    g.fillRect(0, 0, l, h);
    g.strokeStyle = "#2b3e52";
    g.lineWidth = 5;
    g.strokeRect(6, 6, l - 12, h - 12);
    texte(g, "PÉAGE", l / 2, 36, 40, "#2b3e52", { fonte: "Georgia, serif" });
    texte(g, "PONT DE L'ESTUAIRE", l / 2, 72, 22, "#2b3e52", { fonte: "Georgia, serif" });
    salir(g, a, l, h, 8, 0.22);
  });
  // L'enseigne du bar
  region(g, R.bar, (l, h) => {
    g.fillStyle = "#2c4c5c";
    g.fillRect(0, 0, l, h);
    g.strokeStyle = "#e6d9b8";
    g.lineWidth = 4;
    g.strokeRect(8, 8, l - 16, h - 16);
    texte(g, "Au Rendez-vous", l / 2, 38, 36, "#e6d9b8", { police: "italic bold", fonte: "Georgia, serif" });
    texte(g, "DES PÊCHEURS", l / 2, 82, 34, "#e6d9b8", { fonte: "Georgia, serif" });
    texte(g, "BAR · TABAC · ÉPICERIE · APPÂTS", l / 2, 112, 15, "#c79a3b");
    bateau(g, 50, 62, 22, "#e6d9b8", "#e6d9b8");
    bateau(g, l - 50, 62, 22, "#e6d9b8", "#e6d9b8");
    salir(g, a, l, h, 10, 0.25);
  });
  // L'ardoise du bar
  region(g, R.ardoise, (l, h) => {
    g.fillStyle = "#2a2d2b";
    g.fillRect(0, 0, l, h);
    g.strokeStyle = "#8a6a44";
    g.lineWidth = 8;
    g.strokeRect(0, 0, l, h);
    const craie = "#e9e6dc";
    texte(g, "Aujourd'hui", l / 2, 24, 20, craie, { police: "italic", fonte: "'Bradley Hand', 'Chalkboard', cursive" });
    texte(g, "Moules-frites ....... 12 Wh", 18, 56, 16, craie, { police: "", align: "left", fonte: "'Chalkboard', cursive" });
    texte(g, "Bolée de cidre ....... 3 Wh", 18, 80, 16, craie, { police: "", align: "left", fonte: "'Chalkboard', cursive" });
    texte(g, "Wi-Fi des marées : offert", 18, 104, 16, craie, { police: "", align: "left", fonte: "'Chalkboard', cursive" });
    texte(g, "(aux abonnés Premium)", 18, 128, 14, "#d9a0a0", { police: "", align: "left", fonte: "'Chalkboard', cursive" });
  });
  // La plaque du pylône, en relief dans le béton
  region(g, R.plaque1934, (l, h) => {
    g.fillStyle = "#b8b2a4";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#a39d90";
    g.fillRect(10, 10, l - 20, h - 20);
    texte(g, "PONT DE L'ESTUAIRE", l / 2, 44, 25, "#5c574e", { fonte: "Futura, 'Avenir Next', sans-serif" });
    texte(g, "M·CM·XXXIV", l / 2, 86, 26, "#5c574e", { fonte: "Futura, 'Avenir Next', sans-serif" });
    fientesPeintes(g, a, l, h, 5);
  });
  // Les ex-voto peints : un chalutier dans la tempête, un sauvetage
  region(g, R.exvoto1, (l, h) => {
    g.fillStyle = "#c9c0a4";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#3d5866";
    g.fillRect(8, 8, l - 16, h - 40);
    g.fillStyle = "#6a8a96";
    for (let i = 0; i < 7; i++) {
      g.beginPath();
      g.ellipse(20 + i * 36, 70, 26, 10, 0, Math.PI, 0);
      g.fill();
    }
    bateau(g, 128, 54, 30, "#3a2a1e", "#e0d6bc");
    texte(g, "Le « Marie-Jeanne », 3 février 1951", l / 2, h - 18, 14, "#3a2a1e", { police: "italic", fonte: "Georgia, serif" });
  });
  region(g, R.exvoto2, (l, h) => {
    g.fillStyle = "#d8cfb4";
    g.fillRect(0, 0, l, h);
    g.strokeStyle = "#7a6440";
    g.lineWidth = 4;
    g.strokeRect(6, 6, l - 12, h - 12);
    texte(g, "RECONNAISSANCE", l / 2, 38, 24, "#4a3a26", { fonte: "Georgia, serif" });
    texte(g, "à N.-D. des Flots", l / 2, 68, 20, "#4a3a26", { police: "italic", fonte: "Georgia, serif" });
    texte(g, "équipage sauvé · 1962", l / 2, 98, 16, "#4a3a26", { police: "", fonte: "Georgia, serif" });
  });
  region(g, R.chapelle, (l, h) => {
    g.fillStyle = "#d6cdb6";
    g.fillRect(0, 0, l, h);
    texte(g, "CHAPELLE DES MARINS · N.-D. DES FLOTS", l / 2, h / 2, 26, "#4a4036", { fonte: "Georgia, serif" });
    salir(g, a, l, h, 6, 0.2);
  });
  // Les panneaux de direction des deux bouts
  for (const [r, lignes] of [
    [R.dirOuest, ["Côte des Flots · Comptoir du Port →", "par le pont de l'estuaire (passage à pied)", "← Ton terrain · 9 km"]],
    [R.dirEst, ["Comptoir du Port · 4 km →", "Phare du cap · Station balnéaire", "← Pont de l'estuaire · Ton terrain"]],
  ]) {
    region(g, r, (l, h) => {
      g.fillStyle = "#f0ede4";
      g.fillRect(0, 0, l, h);
      g.strokeStyle = "#2b2b29";
      g.lineWidth = 6;
      g.strokeRect(6, 6, l - 12, h - 12);
      texte(g, lignes[0], l / 2, 36, 32, "#2b2b29", { max: l - 30 });
      texte(g, lignes[1], l / 2, 70, 20, "#2b2b29", { police: "", max: l - 30 });
      texte(g, lignes[2], l / 2, 102, 26, "#2b2b29", { max: l - 30 });
      salir(g, a, l, h, 6, 0.18);
    });
  }
  region(g, R.finConnecte, (l, h) => {
    g.fillStyle = "#0b1218";
    g.fillRect(0, 0, l, h);
    texte(g, "FIN DU PONT CONNECTÉ", l / 2, 40, 38, "#7fd6ff");
    texte(g, "merci d'avoir été optimisé", l / 2, 84, 26, "#d8eef6", { police: "" });
    g.fillStyle = "#0b1218";
    for (let i = 0; i < 6; i++) g.fillRect(a() * l, 0, 4 + a() * 12, h);
  });
  region(g, R.peniche, (l, h) => {
    g.fillStyle = "#3f5a54";
    g.fillRect(0, 0, l, h);
    texte(g, "MA LIBERTÉ", l / 2, 26, 30, "#e8e2d2", { fonte: "Georgia, serif" });
    texte(g, "Nantes", l / 2, 52, 14, "#e8e2d2", { police: "italic" });
  });
  region(g, R.hangar, (l, h) => {
    g.fillStyle = "#e2dccb";
    g.fillRect(0, 0, l, h);
    texte(g, "SOCIÉTÉ DES CANOTIERS DE L'ESTUAIRE", l / 2, h / 2, 26, "#2d4a5a", { max: l - 20 });
    salir(g, a, l, h, 8, 0.25);
  });
  // Watty, sur l'affiche du bar
  region(g, R.watty, (l, h) => {
    g.fillStyle = "#2f6f73";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#e9dfc6";
    g.fillRect(14, 14, l - 28, h - 28);
    const x = l / 2;
    const y = 120;
    const s = 120;
    g.fillStyle = "#c79a3b";
    g.fillRect(x - s * 0.3, y - s * 0.5, s * 0.6, s);
    g.fillStyle = "#8a8f90";
    g.fillRect(x - s * 0.12, y - s * 0.62, s * 0.24, s * 0.12);
    g.fillStyle = "#2b2b29";
    g.beginPath();
    g.arc(x - s * 0.1, y - s * 0.15, s * 0.05, 0, 7);
    g.arc(x + s * 0.1, y - s * 0.15, s * 0.05, 0, 7);
    g.fill();
    g.strokeStyle = "#2b2b29";
    g.lineWidth = 4;
    g.beginPath();
    g.arc(x, y + s * 0.02, s * 0.15, 0.2, Math.PI - 0.2);
    g.stroke();
    texte(g, "Toujours plein,", l / 2, 222, 24, "#2f6f73", { police: "italic bold" });
    texte(g, "jamais à plat !", l / 2, 250, 24, "#2f6f73", { police: "italic bold" });
    texte(g, "la marée connectée, c'est Watty", l / 2, 284, 14, "#c8362b");
    salir(g, a, l, h, 10, 0.28);
  });
  // Le panneau des survivants sur la chicane
  region(g, R.barricade, (l, h) => {
    g.fillStyle = "#6d6a62";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "rgba(0,0,0,0.2)";
    for (let y = 0; y < h; y += 16) g.fillRect(0, y, l, 3);
    texte(g, "PÉAGE", l / 2, 28, 30, "#e9e6dc", { fonte: "'Marker Felt', 'Chalkboard', cursive" });
    texte(g, "12 WOTTS / TÊTE", l / 2, 64, 26, "#e0b040", { fonte: "'Marker Felt', 'Chalkboard', cursive" });
    texte(g, "DANS LA CAISSE ↓", l / 2, 100, 22, "#d4503c", { fonte: "'Marker Felt', 'Chalkboard', cursive" });
  });
  region(g, R.unALaFois, (l, h) => {
    g.fillStyle = "#8a7656";
    g.fillRect(0, 0, l, h);
    texte(g, "UN À LA FOIS !", l / 2, h / 2, 34, "#f0ece0", { fonte: "'Marker Felt', 'Chalkboard', cursive" });
  });
  // Le colis du drone livreur
  region(g, R.drone, (l, h) => {
    g.fillStyle = "#c9a878";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#c8362b";
    g.fillRect(0, 40, l, 44);
    texte(g, "LIVRÉ", l / 2, 54, 22, "#f2ead6");
    texte(g, "en 7 min", l / 2, 74, 16, "#f2ead6", { police: "" });
    texte(g, "garanti", l / 2, 104, 16, "#5a4a30", { police: "italic" });
  });
  region(g, R.limite, (l, h) => {
    g.fillStyle = "#e9e6dc";
    g.fillRect(0, 0, l, h);
    g.strokeStyle = "#b8352a";
    g.lineWidth = 14;
    g.beginPath();
    g.arc(l / 2, h / 2, 54, 0, 7);
    g.stroke();
    texte(g, "3,5 t", l / 2, h / 2, 34, "#1e1e1e");
  });
  // L'échelle de marée, peinte sur le mur de quai
  // Les chiffres de l'échelle de marée (émail blanc, chiffres noirs et rouges) : deux colonnes de cinq cases
  for (let d = 0; d < 10; d++) {
    region(g, chiffre(d), (l, h) => {
      g.fillStyle = "#ece8dc";
      g.fillRect(0, 0, l, h);
      texte(g, String(d), l / 2, h / 2 + 2, 40, d % 2 ? "#b8352a" : "#1e1e1e");
    });
  }
  region(g, R.marees, (l, h) => {
    g.fillStyle = "#e9dfc6";
    g.fillRect(0, 0, l, h);
    texte(g, "MARÉES", l / 2, 22, 22, "#2f6f73");
    texte(g, "en direct sur l'appli", l / 2, 52, 14, "#2b2b29", { police: "" });
    texte(g, "Marée+ (abonnement)", l / 2, 74, 15, "#c8362b");
    texte(g, "pleine mer : —:—", l / 2, 104, 16, "#2b2b29", { police: "" });
  });
  // Le registre des passages, ouvert sur le bureau
  region(g, R.registre, (l, h) => {
    g.fillStyle = "#e8dfc8";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#c9bc9c";
    g.fillRect(l / 2 - 2, 0, 4, h);
    g.strokeStyle = "rgba(60, 50, 80, 0.6)";
    g.lineWidth = 1;
    for (let p = 0; p < 2; p++) {
      for (let i = 0; i < 12; i++) {
        const y = 12 + i * 9.5;
        g.beginPath();
        g.moveTo(p * 128 + 10, y);
        for (let x = p * 128 + 10; x < p * 128 + 118; x += 6) g.lineTo(x, y + (a() - 0.5) * 3);
        g.stroke();
      }
    }
    texte(g, "1934", 64, 8, 9, "#5a4a30");
  });
  region(g, R.pontier, (l, h) => {
    g.fillStyle = "#2b3e52";
    g.fillRect(0, 0, l, h);
    texte(g, "LOGEMENT DU PONTIER", l / 2, h / 2, 20, "#e4dcc6", { max: l - 16 });
  });
  region(g, R.bouee, (l, h) => {
    g.fillStyle = "#e4e0d4";
    g.fillRect(0, 0, l, h);
    texte(g, "BOUÉE CONNECTÉE", l / 2, 24, 18, "#2f6f73");
    texte(g, "géolocalisation : non disponible", l / 2, 52, 12, "#2b2b29", { police: "" });
    texte(g, "s'abonner pour être secouru", l / 2, 74, 13, "#c8362b", { police: "" });
  });
  // Les panneaux de sortie : tôle émaillée blanc cassé, liseré sombre, deux lignes en grosses lettres (le « · » qui
  // sépare les deux destinations devient le retour à la ligne), un peu de rouille et de sel
  for (const [r, lignes] of [
    [R.sortieOuest, ["← Ton terrain · 3 km", "Grand Hôtel des Flots, par le pont →"]],
    [R.sortieEst, ["Grand Hôtel des Flots · 2 km →", "← Le pont, ton terrain"]],
  ]) {
    region(g, r, (l, h) => {
      g.fillStyle = "#f2efe6";
      g.fillRect(0, 0, l, h);
      g.strokeStyle = "#23262a";
      g.lineWidth = 12;
      g.strokeRect(10, 10, l - 20, h - 20);
      g.fillStyle = "rgba(35, 38, 42, 0.35)";
      g.fillRect(60, h / 2 - 2, l - 120, 4);
      texte(g, lignes[0], l / 2, h * 0.29, 84, "#1c1f22", { max: l - 70 });
      texte(g, lignes[1], l / 2, h * 0.71, 84, "#1c1f22", { max: l - 70 });
      salir(g, a, l, h, 7, 0.14);
      g.fillStyle = "rgba(150, 80, 40, 0.35)";
      for (let i = 0; i < 6; i++) g.fillRect(12 + a() * (l - 30), h - 16 - a() * 6, 3 + a() * 5, 6 + a() * 14);
    });
  }
  region(g, R.blanc, (l, h) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, l, h);
  });
}

// ---------- Les matières (une seule fois pour toute la halte) ----------

let MATS = null;

export function matieres() {
  if (MATS) return MATS;
  const avecTuile = (cle, l, h, trace, tuile, options = {}) => {
    const m = matiereTexture(dessiner(cle, l, h, trace), options);
    m.userData.tuile = tuile;
    return m;
  };
  const atlas = dessiner("pont-atlas", AL, AH, dessinerAtlas, false);
  const eau = new THREE.MeshStandardMaterial({ map: dessiner("pont-eau", 128, 256, dessinerEau), vertexColors: true, roughness: 0.15, metalness: 0.3, transparent: true, opacity: 0.84, depthWrite: false, side: THREE.DoubleSide });
  eau.userData.sansOmbre = true;
  const lumineux = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 0.9, vertexColors: true, roughness: 0.4, side: THREE.DoubleSide });
  lumineux.userData.sansOmbre = true;
  MATS = {
    mat: matiere(0.95, 0),
    satine: matiere(0.6, 0.05),
    lisse: null, // fondue dans « satine » (R52 : un appel de dessin de moins par tronçon), voir plus bas
    tole: matiere(0.75, 0.3),
    metal: matiere(0.4, 0.7),
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    lueur: matiereLueur(0xffd9a0, 0.2),
    toile: MAT.toile(),
    pierre: matiereMonde("pierreTaille"),
    enduit: matiereMonde("enduit"),
    tuiles: matiereMonde("ardoise"),
    carrelage: matiereMonde("carrelage"),
    sol: avecTuile("pont-sol", 256, 256, dessinerSol, 6, { roughness: 1 }),
    paves: avecTuile("pont-paves", 256, 256, dessinerPaves, 2.5, { roughness: 0.95 }),
    asphalte: avecTuile("pont-asphalte", 256, 256, dessinerAsphalte, 5, { roughness: 0.95 }),
    beton: avecTuile("pont-beton", 256, 256, dessinerBeton, 4, { roughness: 0.92 }),
    eau,
    atlas: new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.8, side: THREE.DoubleSide }),
    lumineux,
  };
  MATS.lisse = MATS.satine;
  return MATS;
}

// ---------- Outils de pose ----------

/** Un panneau plat dont l'image vient de l'atlas (région `r`), face vers +z local. */
export function panneau(c, mat, r, pose, l, h, couleur = 0xffffff) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
  c.poser(g, mat, couleur, pose, { crasse: false, nuance: 0 });
  g.dispose();
}

/**
 * Une boîte dont toutes les faces lisent la case blanche de l'atlas : sa teinte vient des sommets. Sert aux objets
 * nommés à une seule matière (le panneau de sortie : poteaux, cadre, lanterne dans la matière de l'atlas).
 */
export function boiteAtlas(c, mat, l, h, p, couleur, pose = {}, options = {}) {
  const g = new THREE.BoxGeometry(l, h, p);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = R.blanc;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + pw / 2) / AL, 1 - (py + ph / 2) / AH);
  c.poser(g, mat, couleur, pose, { crasse: false, nuance: 0.03, ...options });
  g.dispose();
}

/** Une boîte posée entre deux points au sol (x1, z1) → (x2, z2), du niveau y sur une hauteur h. */
export function boiteEntre(c, x1, z1, x2, z2, y, h, ep, couleur, mat, options = {}, rallonge = 0.04) {
  const L = Math.hypot(x2 - x1, z2 - z1) + rallonge;
  c.boite(L, h, ep, couleur, { x: (x1 + x2) / 2, y: y + h / 2, z: (z1 + z2) / 2, ry: -Math.atan2(z2 - z1, x2 - x1) }, mat, options);
}

/** Une planche de a à b (points 3D), de largeur `larg` dans le plan qui contient `haut`, d'épaisseur `ep`. */
export function planche(c, a, bb, larg, ep, couleur, mat, haut = [0, 1, 0], options = {}) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...bb);
  const d = B.clone().sub(A);
  const L = d.length();
  d.normalize();
  const z = new THREE.Vector3().crossVectors(d, new THREE.Vector3(...haut));
  if (z.lengthSq() < 1e-6) z.set(0, 0, 1);
  z.normalize();
  const y = new THREE.Vector3().crossVectors(z, d).normalize();
  const e = new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().makeBasis(d, y, z));
  c.boite(L, larg, ep, couleur, { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2, z: (A.z + B.z) / 2, rx: e.x, ry: e.y, rz: e.z }, mat, options);
}

export function cylindre(c, mat, couleur, x, y, z, rh, rb, h, cotes = 8, pose = {}, options = {}) {
  const g = new THREE.CylinderGeometry(rh, rb, h, cotes);
  c.poser(g, mat, couleur, { x, y: y + h / 2, z, ...pose }, options);
  g.dispose();
}

/** Un pilier carré (tronc de pyramide) : côté `lb` en bas, `lh` en haut. */
export function pilier(c, mat, couleur, x, y, z, lb, lh, h, options = {}) {
  const g = new THREE.CylinderGeometry(lh / Math.SQRT2, lb / Math.SQRT2, h, 4).rotateY(Math.PI / 4);
  c.poser(g, mat, couleur, { x, y: y + h / 2, z }, options);
  g.dispose();
}

/** Un polygone horizontal (points [x, z]) à la hauteur y, face vers le haut. */
export function dalle(c, mat, couleur, points, y = 0, options = {}) {
  const s = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, -z)));
  const g = new THREE.ShapeGeometry(s).rotateX(-Math.PI / 2);
  c.poser(g, mat, couleur, { y }, { crasse: false, nuance: 0, ...options });
  g.dispose();
}

/** Les quatre côtés d'un rectangle tourné, comme obstacles. */
export function obstacleBoite(b, x, z, l, p, ry = 0, nature = "obstacle") {
  const co = Math.cos(ry);
  const si = Math.sin(ry);
  const pt = (u, v) => [x + u * co + v * si, z - u * si + v * co];
  const P = [pt(-l / 2, -p / 2), pt(l / 2, -p / 2), pt(l / 2, p / 2), pt(-l / 2, p / 2)];
  for (let i = 0; i < 4; i++) b.obstacle(P[i][0], P[i][1], P[(i + 1) % 4][0], P[(i + 1) % 4][1], nature);
}

// ---------- Géométries partagées ----------

export const BOULE = new THREE.IcosahedronGeometry(1, 0);
export const CAILLOU = new THREE.DodecahedronGeometry(1, 0);
const BRIN = new THREE.ConeGeometry(0.035, 0.75, 3).translate(0, 0.37, 0);
const ROUE = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 8);
const ANNEAU = new THREE.TorusGeometry(0.3, 0.07, 4, 10);
const BARBELE = new THREE.TorusGeometry(0.32, 0.015, 3, 9);

/** Une touffe d'oyats : longues feuilles raides, gris-vert et paille, couchées par le vent d'ouest. */
export function oyats(c, M, points) {
  for (const [x, z, y = 0] of points) {
    const s = 0.7 + c.hasard() * 0.7;
    const n = 5 + Math.floor(c.hasard() * 3);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + c.hasard();
      const vent = 0.25 + c.hasard() * 0.25;
      c.poser(BRIN, M.mat, c.hasard() < 0.55 ? C.oyat : C.oyatSec, { x: x + Math.cos(a) * 0.08, y, z: z + Math.sin(a) * 0.08, rz: -vent + 0.25 * Math.cos(a), rx: 0.25 * Math.sin(a), e: s }, { nuance: 0.1, crasse: false });
    }
  }
}

export function semerOyats(c, M, x1, z1, x2, z2, n, y = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) pts.push([c.entre(x1, x2), c.entre(z1, z2), y]);
  oyats(c, M, pts);
}

/** Une dune basse : un dôme de sable aplati, dessus quelques oyats. */
export function dune(c, M, x, z, l, p, h, oyatsN = 10) {
  c.poser(BOULE, M.sol, C.sable, { x, y: -h * 0.35, z, ry: c.hasard() * 3, e: [l / 2, h * 1.35, p / 2] }, { crasse: false, nuance: 0.03 });
  const pts = [];
  for (let i = 0; i < oyatsN; i++) {
    const a = c.hasard() * Math.PI * 2;
    const r = Math.sqrt(c.hasard()) * 0.75;
    const px = Math.cos(a) * r;
    const pz = Math.sin(a) * r;
    const y = Math.max(0, h * Math.sqrt(Math.max(0, 1 - r * r)) - 0.15);
    pts.push([x + px * (l / 2), z + pz * (p / 2), y]);
  }
  oyats(c, M, pts);
}

/** Des fientes de mouettes sur une surface horizontale (rectangle à la hauteur y). */
export function fientes(c, M, x1, z1, x2, z2, y, n) {
  for (let i = 0; i < n; i++) {
    const s = c.entre(0.04, 0.14);
    c.boite(s, 0.012, s * c.entre(0.6, 1.3), C.fiente, { x: c.entre(x1, x2), y: y + 0.006, z: c.entre(z1, z2), ry: c.hasard() * 3 }, M.mat, { crasse: false, nuance: 0.04 });
  }
}

/** Une coulure de fiente sur une face verticale (plan de pose : la face regarde +z). */
export function couluresBlanches(c, M, x, y, z, ry, largeur, n, hmax = 1.4) {
  c.repere({ x, y, z, ry }, () => {
    for (let i = 0; i < n; i++) {
      const lg = c.entre(0.2, hmax);
      c.boite(c.entre(0.03, 0.08), lg, 0.012, C.fiente, { x: c.entre(-largeur / 2, largeur / 2), y: -lg / 2, z: 0.01 }, M.mat, { crasse: false, nuance: 0.05 });
    }
  });
}

/** Une bitte d'amarrage en fonte, son chapeau et parfois une aussière qui pend. */
export function bitte(c, M, x, z, y = 0, amarre = false) {
  cylindre(c, M.tole, 0x3a3c3c, x, y, z, 0.2, 0.24, 0.55, 8);
  cylindre(c, M.tole, 0x3a3c3c, x, y + 0.55, z, 0.3, 0.2, 0.12, 8);
  fientes(c, M, x - 0.2, z - 0.2, x + 0.2, z + 0.2, y + 0.67, 3);
  if (amarre) {
    c.poser(ANNEAU, M.mat, 0xb8a27a, { x, y: y + 0.35, z, rx: Math.PI / 2, e: [1.0, 1.0, 1.4] }, { crasse: false });
  }
}

/** Un rouleau de corde (glène) posé à plat. */
export function glene(c, M, x, z, y = 0, r = 0.35, couleur = 0xb8a27a) {
  for (let i = 0; i < 3; i++) c.poser(ANNEAU, M.mat, couleur, { x, y: y + 0.05 + i * 0.09, z, rx: Math.PI / 2, e: [r / 0.3 * (1 - i * 0.12), r / 0.3 * (1 - i * 0.12), 0.9] }, { crasse: false, nuance: 0.05 });
}

/** Une bouée couronne. */
export function bouee(c, M, pose, couleur = 0xd06a3a) {
  c.poser(ANNEAU, M.satine, couleur, { ...pose, e: [1.25, 1.25, 1.4] }, { crasse: false, nuance: 0.04 });
}

/** Des rouleaux de barbelés le long d'un segment. */
export function barbeles(c, M, x1, z1, x2, z2, y = 0.35) {
  const L = Math.hypot(x2 - x1, z2 - z1);
  const n = Math.max(2, Math.round(L / 0.28));
  const ry = -Math.atan2(z2 - z1, x2 - x1) + Math.PI / 2;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    c.poser(BARBELE, M.metal, 0x6a625a, { x: x1 + (x2 - x1) * t, y, z: z1 + (z2 - z1) * t, ry, rz: c.entre(-0.2, 0.2) }, { crasse: false, nuance: 0.1 });
  }
}

/** Une caisse en bois, un casier, une boîte. */
export function caisse(c, M, x, z, l, h, p, ry = 0, couleur = C.boisGris, y = 0) {
  c.repere({ x, y, z, ry }, () => {
    c.boite(l, h, p, couleur, { y: h / 2 }, M.mat, { nuance: 0.06 });
    for (const s of [-1, 1]) c.boite(l + 0.02, 0.06, 0.04, couleur, { y: h * 0.5 + s * h * 0.25, z: p / 2 + 0.01 }, M.mat, { nuance: 0.08 });
  });
}

/** Un casier à homards : cage de bois et filet, en demi-cylindre. */
export function casier(c, M, x, z, ry = 0, y = 0) {
  c.repere({ x, y, z, ry }, () => {
    c.boite(0.8, 0.05, 0.55, C.boisGris, { y: 0.03 }, M.mat);
    const g = new THREE.CylinderGeometry(0.28, 0.28, 0.8, 6, 1, true, 0, Math.PI);
    c.poser(g, M.toile, 0x8a7a5a, { y: 0.05, rz: Math.PI / 2, ry: Math.PI / 2, e: [1, 1, 0.98] }, { crasse: false, nuance: 0.06 });
    g.dispose();
    for (const s of [-0.38, 0, 0.38]) c.boite(0.04, 0.3, 0.56, C.bois, { x: s, y: 0.18 }, M.mat);
  });
}

/** Un filet de pêche jeté (des pans de toile froissés, couleur de chanvre ou de nylon bleu). */
export function filet(c, M, x, z, l, p, couleur = 0x6f7d6a, y = 0) {
  const n = 5;
  for (let i = 0; i < n; i++) {
    c.boite(l * c.entre(0.4, 0.7), 0.05, p * c.entre(0.4, 0.7), couleur, { x: x + c.entre(-l, l) * 0.25, y: y + 0.04 + i * 0.04, z: z + c.entre(-p, p) * 0.25, ry: c.hasard() * 3, rx: c.entre(-0.1, 0.1) }, M.toile, { nuance: 0.08, crasse: false });
  }
  // Les flotteurs de liège
  for (let i = 0; i < 5; i++) c.poser(BOULE, M.mat, 0xc9a050, { x: x + c.entre(-l, l) * 0.4, y: y + 0.24, z: z + c.entre(-p, p) * 0.4, e: 0.08 }, { crasse: false });
}

/** Un filet suspendu à sécher : pans qui pendent d'une perche. */
export function filetPendu(c, M, x, z, l, h, ry = 0, couleur = 0x6f7d6a) {
  c.repere({ x, y: 0, z, ry }, () => {
    for (const s of [-1, 1]) c.boite(0.1, h + 0.3, 0.1, C.bois, { x: s * l / 2, y: (h + 0.3) / 2 }, M.mat);
    c.boite(l + 0.3, 0.08, 0.08, C.bois, { y: h + 0.2 }, M.mat);
    for (let i = 0; i < 4; i++) {
      const lg = h * c.entre(0.55, 0.95);
      c.boite(l / 4 - 0.05, lg, 0.02, couleur, { x: -l / 2 + (i + 0.5) * (l / 4), y: h + 0.15 - lg / 2, z: c.entre(-0.05, 0.05), rx: c.entre(-0.06, 0.06) }, M.toile, { nuance: 0.08, crasse: false });
    }
    for (let i = 0; i < 6; i++) c.poser(BOULE, M.mat, 0xc9a050, { x: c.entre(-l / 2, l / 2), y: h * c.entre(0.2, 0.9), z: 0.04, e: 0.07 }, { crasse: false });
  });
}

/**
 * Une coque de barque (bordé en demi-ellipse, étrave pointue en +x, tableau arrière en −x). `l` longueur, `w`
 * largeur, `h` creux. Face intérieure visible (matière double face).
 */
export function coqueGeo(l, w, h, n = 10, cotes = 6) {
  const pos = [];
  const anneau = (i) => {
    const t = i / n; // 0 : arrière, 1 : étrave
    const x = -l / 2 + t * l;
    const f = t > 0.55 ? Math.sqrt(Math.max(0, 1 - ((t - 0.55) / 0.45) ** 2)) : 0.78 + 0.22 * Math.sin((t / 0.55) * Math.PI * 0.5);
    const tonture = h * 0.25 * ((t - 0.5) * 2) ** 2;
    const pts = [];
    for (let k = 0; k <= cotes; k++) {
      const a = (k / cotes) * Math.PI;
      pts.push([x, -h * Math.sin(a) * (0.4 + 0.6 * f) + tonture + h, (w / 2) * f * Math.cos(a)]);
    }
    return pts;
  };
  let prec = anneau(0);
  // Le tableau arrière
  for (let k = 1; k < cotes; k++) pos.push(...prec[0], ...prec[k + 1], ...prec[k]);
  for (let i = 1; i <= n; i++) {
    const cour = anneau(i);
    for (let k = 0; k < cotes; k++) {
      const a = prec[k], b = prec[k + 1], cc = cour[k], d = cour[k + 1];
      pos.push(...a, ...cc, ...b, ...b, ...cc, ...d);
    }
    prec = cour;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/** Une barque de bois : coque peinte, plat-bord, bancs, avirons. `retournee` : quille en l'air. */
export function barque(c, M, x, y, z, ry, couleur = 0x3f6a7a, opts = {}) {
  const { l = 4.2, w = 1.5, h = 0.6, retournee = false, rx = 0, rz = 0, avirons = true } = opts;
  c.repere({ x, y, z, ry, rx: rx + (retournee ? Math.PI : 0), rz }, () => {
    const g = coqueGeo(l, w, h);
    c.poser(g, M.toile, couleur, { y: retournee ? -h * 1.25 : 0 }, { crasse: !retournee, nuance: 0.03 });
    g.dispose();
    if (!retournee) {
      for (const bx of [-0.9, 0.3]) c.boite(0.25, 0.05, w * 0.82, C.boisClair, { x: bx, y: h * 0.75 }, M.mat);
      c.boite(l * 0.7, 0.04, 0.3, C.boisGris, { y: h * 0.15 }, M.mat);
      if (avirons) for (const s of [-1, 1]) c.boite(2.6, 0.05, 0.1, C.boisClair, { x: -0.1, y: h * 0.85, z: s * 0.35, ry: s * 0.06 }, M.mat);
    }
  });
}

/** Une voiture (épave). Options : rx, rz, roues (nombre), brulee, portes (ouvertes), capot, coffre, sansVitres. */
export function voiture(c, M, x, y, z, ry, couleur, opts = {}) {
  const { rx = 0, rz = 0, roues = 4, brulee = false, portes = false, capot = false, coffre = false, rouille = 0.5 } = opts;
  const corps = brulee ? 0x4a3c34 : couleur;
  c.repere({ x, y, z, ry, rx, rz }, () => {
    c.boite(4.1, 0.55, 1.74, corps, { y: 0.62 }, brulee ? M.mat : M.satine, { nuance: 0.05 });
    c.boite(1.1, 0.1, 1.66, corps, { x: 1.48, y: 0.93, rz: -0.07 }, brulee ? M.mat : M.satine);
    c.boite(2.05, 0.58, 1.56, corps, { x: -0.3, y: 1.2 }, brulee ? M.mat : M.satine, { nuance: 0.04 });
    if (!brulee) {
      c.boite(2.07, 0.4, 1.58, 0x2c3a40, { x: -0.3, y: 1.2 }, M.verre, { crasse: false });
      c.boite(0.06, 0.12, 0.3, 0xe6e2c8, { x: 2.06, y: 0.76, z: 0.6 }, M.lisse);
      c.boite(0.06, 0.12, 0.3, 0xe6e2c8, { x: 2.06, y: 0.76, z: -0.6 }, M.lisse);
      c.boite(0.06, 0.1, 0.25, 0x8a3a30, { x: -2.06, y: 0.8, z: 0.62 }, M.lisse);
      c.boite(0.06, 0.1, 0.25, 0x8a3a30, { x: -2.06, y: 0.8, z: -0.62 }, M.lisse);
    } else {
      c.boite(2.0, 0.04, 1.5, 0x2a2420, { x: -0.3, y: 0.9 }, M.mat);
    }
    c.boite(0.12, 0.18, 1.78, 0x8f908c, { x: 2.08, y: 0.48 }, M.metal);
    c.boite(0.12, 0.18, 1.78, 0x8f908c, { x: -2.08, y: 0.48 }, M.metal);
    // La rouille et le sel
    const n = Math.round(rouille * 6 + (brulee ? 6 : 0));
    for (let i = 0; i < n; i++) c.boite(c.entre(0.2, 0.6), c.entre(0.08, 0.25), 0.02, C.rouille, { x: c.entre(-1.8, 1.8), y: c.entre(0.4, 0.8), z: (c.hasard() < 0.5 ? -1 : 1) * 0.875 }, M.mat, { crasse: false, nuance: 0.1 });
    fientes(c, M, -1.2, -0.7, 0.6, 0.7, 1.49, brulee ? 0 : 5);
    if (capot) c.boite(1.2, 0.05, 1.6, corps, { x: 1.4, y: 1.35, z: 0, rz: 1.0 }, M.satine);
    if (coffre) c.boite(0.9, 0.05, 1.6, corps, { x: -1.75, y: 1.45, rz: -1.2 }, M.satine);
    if (portes) {
      c.repere({ x: 0.55, y: 0.9, z: 0.86, ry: -0.9 }, () => c.boite(1.1, 0.75, 0.05, corps, { x: -0.55 }, M.satine));
      c.repere({ x: -0.6, y: 0.9, z: -0.86, ry: 0.7 }, () => c.boite(1.0, 0.75, 0.05, corps, { x: -0.5 }, M.satine));
    }
    const places = [[1.3, 0.8], [1.3, -0.8], [-1.3, 0.8], [-1.3, -0.8]];
    for (let i = 0; i < 4; i++) {
      const [px, pz] = places[i];
      if (i < roues) c.poser(ROUE, M.mat, brulee ? 0x2a2622 : 0x262626, { x: px, y: 0.34, z: pz, rx: Math.PI / 2 }, { crasse: false });
      else c.boite(0.5, 0.12, 0.2, 0x3a3634, { x: px, y: 0.12, z: pz }, M.metal);
    }
  });
}

/** La camionnette de livraison (« Livré en 7 min ») : portes arrière ouvertes. */
export function camionnette(c, M, x, y, z, ry, opts = {}) {
  const { rx = 0, rz = 0 } = opts;
  const blanc = 0xd9d6cc;
  c.repere({ x, y, z, ry, rx, rz }, () => {
    c.boite(3.6, 2.0, 1.95, blanc, { x: -0.7, y: 1.4 }, M.satine, { nuance: 0.04 });
    c.boite(1.4, 1.1, 1.9, blanc, { x: 1.75, y: 0.95 }, M.satine);
    c.boite(0.7, 0.75, 1.9, blanc, { x: 1.35, y: 1.85, rz: -0.35 }, M.satine);
    c.boite(0.72, 0.55, 1.86, 0x2c3a40, { x: 1.42, y: 1.83, rz: -0.35 }, M.verre, { crasse: false });
    c.boite(0.14, 0.2, 2.0, 0x8f908c, { x: 2.5, y: 0.45 }, M.metal);
    // Le bandeau rouge de l'enseigne de livraison, et le colis peint
    c.boite(3.4, 0.4, 1.97, 0xb8473a, { x: -0.7, y: 1.55 }, M.satine, { crasse: false });
    panneau(c, M.atlas, R.drone, { x: -0.5, y: 1.55, z: 0.99 }, 0.9, 0.9);
    panneau(c, M.atlas, R.drone, { x: -0.5, y: 1.55, z: -0.99, ry: Math.PI }, 0.9, 0.9);
    // Les portes arrière ouvertes en grand
    for (const s of [-1, 1]) c.repere({ x: -2.5, y: 1.35, z: s * 0.97, ry: s * 1.9 }, () => c.boite(0.95, 1.8, 0.05, blanc, { x: 0.47 }, M.satine));
    for (const [px, pz] of [[1.6, 0.85], [1.6, -0.85], [-1.6, 0.85], [-1.6, -0.85]]) c.poser(ROUE, M.mat, 0x262626, { x: px, y: 0.34, z: pz, rx: Math.PI / 2 }, { crasse: false });
    // Des colis restés dedans
    for (let i = 0; i < 5; i++) c.boite(c.entre(0.3, 0.6), c.entre(0.25, 0.45), c.entre(0.3, 0.5), 0xc9a878, { x: c.entre(-2.2, 0.6), y: 0.65 + (i % 2) * 0.4, z: c.entre(-0.6, 0.6), ry: c.hasard() }, M.mat);
  });
}

/** Une chaise de bistrot. */
export function chaise(c, M, x, z, ry, renversee = false, couleur = C.bois) {
  c.repere({ x, y: renversee ? 0.22 : 0, z, ry, rz: renversee ? 1.45 : 0 }, () => {
    c.boite(0.42, 0.04, 0.42, couleur, { y: 0.45 }, M.mat);
    c.boite(0.42, 0.45, 0.04, couleur, { y: 0.7, z: -0.2 }, M.mat);
    for (const [px, pz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) c.boite(0.035, 0.45, 0.035, couleur, { x: px, y: 0.225, z: pz }, M.mat);
  });
}

/** Une table (plateau, pieds). */
export function table(c, M, x, z, l, p, ry = 0, couleur = C.boisClair, h = 0.76) {
  c.repere({ x, y: 0, z, ry }, () => {
    c.boite(l, 0.05, p, couleur, { y: h }, M.mat);
    for (const [px, pz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.boite(0.05, h, 0.05, couleur, { x: px * (l / 2 - 0.06), y: h / 2, z: pz * (p / 2 - 0.06) }, M.mat);
  });
}

/** Une étagère murale chargée (dos contre −z local). `plein` : la part des rayons encore garnie. */
export function etagere(c, M, x, z, ry, l, h, tons, plein = 0.6) {
  c.repere({ x, y: 0, z, ry }, () => {
    const p = 0.38;
    for (const s of [-1, 1]) c.boite(0.04, h, p, C.boisGris, { x: s * (l / 2), y: h / 2 }, M.mat);
    c.boite(l, h, 0.02, C.boisGris, { y: h / 2, z: -p / 2 }, M.mat);
    const n = Math.max(2, Math.round(h / 0.45));
    for (let i = 0; i < n; i++) {
      const y = 0.1 + (i * (h - 0.15)) / (n - 1);
      c.boite(l, 0.03, p, C.boisGris, { y }, M.mat);
      if (i === n - 1) continue;
      for (let xx = -l / 2 + 0.1; xx < l / 2 - 0.08; xx += c.entre(0.1, 0.22)) {
        if (c.hasard() > plein) continue;
        const hh = c.entre(0.1, 0.28);
        c.boite(0.08, hh, 0.1, tons[Math.floor(c.hasard() * tons.length)], { x: xx, y: y + hh / 2 + 0.02, z: c.entre(-0.1, 0.08) }, M.satine, { nuance: 0.1, crasse: false });
      }
    }
  });
}

/** Un tonneau, debout ou couché. */
export function tonneau(c, M, x, z, couche = false, couleur = 0x6a4a30, y = 0) {
  cylindre(c, M.mat, couleur, x, couche ? y + 0.3 : y, z, 0.3, 0.3, 0.85, 8, couche ? { rz: Math.PI / 2, y: y + 0.3 } : {});
  if (!couche) for (const h of [0.15, 0.7]) cylindre(c, M.metal, 0x4a4440, x, y + h, z, 0.31, 0.31, 0.05, 8);
}

/** Des sacs de sable empilés le long d'un segment. */
export function sacs(c, M, x1, z1, x2, z2, rangs = 3) {
  const L = Math.hypot(x2 - x1, z2 - z1);
  const ry = -Math.atan2(z2 - z1, x2 - x1);
  const n = Math.max(1, Math.round(L / 0.62));
  for (let r = 0; r < rangs; r++) {
    for (let i = 0; i < n - (r % 2); i++) {
      const t = (i + 0.5 + (r % 2) * 0.5) / n;
      c.boite(0.6, 0.24, 0.4, c.hasard() < 0.5 ? 0xb3a27e : 0xa39276, { x: x1 + (x2 - x1) * t, y: 0.12 + r * 0.23, z: z1 + (z2 - z1) * t, ry: ry + c.entre(-0.1, 0.1), rx: c.entre(-0.05, 0.05) }, M.toile, { nuance: 0.06 });
    }
  }
}

/** Une palette de bois debout ou à plat. */
export function palette(c, M, x, z, ry = 0, debout = false, y = 0) {
  c.repere({ x, y, z, ry, rx: debout ? -Math.PI / 2 : 0 }, () => {
    for (let i = 0; i < 5; i++) c.boite(1.2, 0.025, 0.12, C.boisClair, { y: debout ? 0.13 : 0.13, z: -0.4 + i * 0.2, x: 0 }, M.mat, { nuance: 0.08 });
    for (const s of [-0.5, 0, 0.5]) c.boite(0.1, 0.1, 0.95, C.bois, { x: s, y: 0.06 }, M.mat);
  });
}
