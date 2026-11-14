// Les textures dessinées de la halte de la digue : l'atlas des panneaux (une seule texture 1024 × 1024 pour toutes les
// enseignes, plaques, écrans et pancartes, donc un seul appel de dessin), l'eau, la brume et les planches.
// Chaque région de l'atlas est [x, y, largeur, hauteur] en pixels.

import { aleatoire, taches } from "../commun/atelier.js";

export const AL = 1024;
export const AH = 1024;

export const R = {
  dirA1: [0, 0, 512, 128],
  dirA2: [512, 0, 512, 128],
  dirB1: [0, 128, 512, 128],
  dirB2: [512, 128, 512, 128],
  reserve: [0, 256, 512, 256],
  ecranOiseau: [512, 256, 256, 128],
  ecranMort: [768, 256, 256, 128],
  ecluse: [512, 384, 512, 96],
  pompage: [0, 512, 512, 96],
  wattypompe: [512, 480, 256, 160],
  borne: [768, 480, 256, 160],
  passerelle: [0, 608, 256, 96],
  tourbe: [256, 608, 256, 128],
  digue: [0, 704, 256, 96],
  hutte: [256, 736, 256, 64],
  calendrier: [512, 640, 128, 192],
  tableau: [640, 640, 256, 128],
  carrelet: [896, 640, 128, 64],
  watty: [896, 704, 128, 128],
  danger: [0, 800, 256, 128],
  fourgon: [256, 800, 512, 128],
  unALaFois: [640, 768, 256, 64],
  barriere: [768, 832, 256, 96],
  oiseaux: [0, 928, 512, 96],
  carte: [512, 928, 256, 96],
  appli: [768, 928, 256, 96],
};

const POLICE = "'Avenir Next Condensed', 'Futura', 'Arial Narrow', sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";
const PEINT = "'Marker Felt', 'Chalkboard SE', 'Comic Sans MS', cursive";

function texte(g, t, x, y, taille, couleur, { poids = "bold", police = POLICE, align = "center", max } = {}) {
  g.font = `${poids} ${taille}px ${police}`;
  g.fillStyle = couleur;
  g.textAlign = align;
  g.textBaseline = "middle";
  g.fillText(t, x, y, max);
}

function salir(g, a, l, h, n = 8, force = 0.2) {
  taches(g, a, n, `rgba(60, 50, 38, ${force})`, 6, 30, l, h);
}

function rouille(g, a, l, h, n = 10) {
  for (let i = 0; i < n; i++) {
    const x = a() * l;
    const lg = 10 + a() * h * 0.6;
    const d = g.createLinearGradient(0, a() * h * 0.3, 0, lg);
    d.addColorStop(0, "rgba(140, 70, 35, 0.45)");
    d.addColorStop(1, "rgba(140, 70, 35, 0)");
    g.fillStyle = d;
    g.fillRect(x, 0, 2 + a() * 5, lg + h * 0.3);
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

/** Watty, la pile souriante de la Compagnie. */
function watty(g, x, y, s) {
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
  g.lineWidth = s * 0.05;
  g.beginPath();
  g.arc(x, y, s * 0.15, 0.2, Math.PI - 0.2);
  g.stroke();
}

/** Un héron stylisé (silhouette). */
function heron(g, x, y, s, couleur) {
  g.strokeStyle = couleur;
  g.fillStyle = couleur;
  g.lineWidth = s * 0.06;
  g.lineCap = "round";
  g.beginPath();
  g.ellipse(x, y, s * 0.32, s * 0.16, -0.3, 0, 7);
  g.fill();
  g.beginPath();
  g.moveTo(x + s * 0.22, y - s * 0.1);
  g.quadraticCurveTo(x + s * 0.45, y - s * 0.25, x + s * 0.3, y - s * 0.5);
  g.lineTo(x + s * 0.62, y - s * 0.52);
  g.stroke();
  g.beginPath();
  g.moveTo(x - s * 0.02, y + s * 0.12);
  g.lineTo(x - s * 0.04, y + s * 0.62);
  g.moveTo(x + s * 0.08, y + s * 0.12);
  g.lineTo(x + s * 0.12, y + s * 0.62);
  g.stroke();
}

function fleche(g, x, y, s, sens, couleur) {
  g.fillStyle = couleur;
  g.beginPath();
  g.moveTo(x + sens * s, y);
  g.lineTo(x, y - s * 0.6);
  g.lineTo(x, y - s * 0.25);
  g.lineTo(x - sens * s * 0.8, y - s * 0.25);
  g.lineTo(x - sens * s * 0.8, y + s * 0.25);
  g.lineTo(x, y + s * 0.25);
  g.lineTo(x, y + s * 0.6);
  g.closePath();
  g.fill();
}

/** Un panneau de direction blanc à listel, façon route départementale. */
function direction(g, a, l, h, lignes, sens) {
  g.fillStyle = "#e7e3d6";
  g.fillRect(0, 0, l, h);
  g.strokeStyle = "#2b2d2e";
  g.lineWidth = 6;
  g.strokeRect(8, 8, l - 16, h - 16);
  const xf = sens > 0 ? l - 52 : 52;
  fleche(g, xf, h / 2, 34, sens, "#2b2d2e");
  const xt = sens > 0 ? 24 : 104;
  lignes.forEach(([t, taille], i) => texte(g, t, xt, h / 2 + (i - (lignes.length - 1) / 2) * (taille + 8), taille, "#2b2d2e", { align: "left", max: l - 140 }));
  salir(g, a, l, h, 10, 0.22);
  rouille(g, a, l, h, 6);
}

export function dessinerAtlas(g) {
  const a = aleatoire(1931);
  g.fillStyle = "#777";
  g.fillRect(0, 0, AL, AH);

  // Les directions, aux deux bouts de la digue (chaque panneau a deux faces)
  region(g, R.dirA1, (l, h) => direction(g, a, l, h, [["Le Gué · Moulin à eau", 38], ["par la digue — 6 km", 28]], 1));
  region(g, R.dirA2, (l, h) => direction(g, a, l, h, [["Étang des Saules", 38], ["Ton terrain — 9 km", 28]], -1));
  region(g, R.dirB1, (l, h) => direction(g, a, l, h, [["Le Gué · Écluse et péniche", 36], ["Station d'épuration — 4 km", 28]], 1));
  region(g, R.dirB2, (l, h) => direction(g, a, l, h, [["Digue des Roselières", 38], ["Étang des Saules", 28]], -1));

  // Le grand panneau de la réserve connectée
  region(g, R.reserve, (l, h) => {
    const d = g.createLinearGradient(0, 0, 0, h);
    d.addColorStop(0, "#2f6f73");
    d.addColorStop(1, "#1f4f55");
    g.fillStyle = d;
    g.fillRect(0, 0, l, h);
    // Le marais rêvé : soleil couchant, roseaux, héron en réalité augmentée
    g.fillStyle = "#e9a24a";
    g.beginPath();
    g.arc(400, 120, 46, 0, 7);
    g.fill();
    g.fillStyle = "#16393d";
    for (let i = 0; i < 40; i++) g.fillRect(300 + a() * 210, 150 + a() * 40, 3, 60);
    heron(g, 420, 150, 80, "#e9dfc6");
    g.strokeStyle = "#7fe0e8";
    g.lineWidth = 3;
    g.setLineDash([8, 6]);
    g.strokeRect(360, 70, 130, 140);
    g.setLineDash([]);
    texte(g, "Héron cendré · 98 % · ★ Plume+", 425, 226, 15, "#7fe0e8", { max: 190 });
    texte(g, "RÉSERVE NATURELLE", 150, 44, 34, "#e9dfc6", { max: 280 });
    texte(g, "CONNECTÉE", 150, 84, 40, "#c79a3b", { max: 280 });
    texte(g, "Observez les oiseaux", 150, 128, 24, "#e9dfc6", { poids: "", max: 280 });
    texte(g, "en réalité augmentée", 150, 156, 24, "#e9dfc6", { poids: "", max: 280 });
    texte(g, "Appli Plume+ · 4,99 Wh / jour", 150, 196, 18, "#c79a3b", { max: 280 });
    texte(g, "Oiseaux garantis ou remboursés*", 150, 226, 14, "#e9dfc6", { poids: "italic", max: 280 });
    watty(g, 40, 205, 50);
    salir(g, a, l, h, 14, 0.3);
    // Arraché en bas à droite
    g.fillStyle = "#6c6a62";
    g.beginPath();
    g.moveTo(l, h - 70);
    g.lineTo(l - 60, h);
    g.lineTo(l, h);
    g.fill();
  });

  // L'écran de l'observatoire qui luit encore
  region(g, R.ecranOiseau, (l, h) => {
    g.fillStyle = "#0d1f2a";
    g.fillRect(0, 0, l, h);
    g.strokeStyle = "#7fe0e8";
    g.lineWidth = 2;
    g.strokeRect(10, 10, l - 20, h - 20);
    texte(g, "AUCUN OISEAU DÉTECTÉ", l / 2, 44, 22, "#9fe8f0", { max: l - 30 });
    texte(g, "Passez à Plume Premium", l / 2, 76, 16, "#c79a3b", { max: l - 30 });
    texte(g, "pour des oiseaux garantis", l / 2, 98, 14, "#9fe8f0", { poids: "", max: l - 30 });
    g.fillStyle = "rgba(160, 230, 240, 0.08)";
    for (let y = 0; y < h; y += 4) g.fillRect(0, y, l, 1);
  });
  region(g, R.ecranMort, (l, h) => {
    g.fillStyle = "#131515";
    g.fillRect(0, 0, l, h);
    g.strokeStyle = "rgba(200, 210, 210, 0.5)";
    g.lineWidth = 1.5;
    for (let k = 0; k < 9; k++) {
      g.beginPath();
      g.moveTo(150, 60);
      g.lineTo(150 + (a() - 0.5) * 300, 60 + (a() - 0.5) * 160);
      g.stroke();
    }
    g.fillStyle = "rgba(255,255,255,0.06)";
    g.fillRect(0, 0, l, h / 3);
  });

  // La plaque émaillée de l'écluse
  region(g, R.ecluse, (l, h) => {
    g.fillStyle = "#24497a";
    g.fillRect(0, 0, l, h);
    g.strokeStyle = "#e7e3d6";
    g.lineWidth = 5;
    g.strokeRect(8, 8, l - 16, h - 16);
    texte(g, "ÉCLUSE N° 7 · DES ROSELIÈRES", l / 2, 40, 38, "#e7e3d6", { max: l - 40 });
    texte(g, "Navigation de plaisance · Passage sur réservation (appli)", l / 2, 72, 17, "#e7e3d6", { poids: "", max: l - 40 });
    salir(g, a, l, h, 10, 0.3);
    g.fillStyle = "#1a1a1a";
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.arc(a() * l, a() * h, 3 + a() * 8, 0, 7);
      g.fill();
    }
  });

  // La station de pompage : le cartouche de pierre
  region(g, R.pompage, (l, h) => {
    g.fillStyle = "#c9bea6";
    g.fillRect(0, 0, l, h);
    g.strokeStyle = "#8a7f68";
    g.lineWidth = 4;
    g.strokeRect(6, 6, l - 12, h - 12);
    texte(g, "STATION DE POMPAGE DES BAS-PRÉS", l / 2, 38, 34, "#5a5040", { police: SERIF, max: l - 30 });
    texte(g, "SYNDICAT DES MARAIS · 1931", l / 2, 72, 22, "#5a5040", { police: SERIF, max: l - 30 });
    salir(g, a, l, h, 12, 0.3);
  });
  region(g, R.wattypompe, (l, h) => {
    g.fillStyle = "#e9dfc6";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#2f6f73";
    g.fillRect(0, 0, l, 44);
    texte(g, "WattyPompe", l / 2 + 20, 23, 30, "#e9dfc6");
    watty(g, 28, 26, 34);
    texte(g, "Votre marais piloté", l / 2, 70, 20, "#2f6f73", { max: l - 20 });
    texte(g, "depuis votre canapé !", l / 2, 94, 20, "#2f6f73", { max: l - 20 });
    texte(g, "Niveau d'eau : PARFAIT ✓", l / 2, 128, 17, "#c8362b", { max: l - 20 });
    salir(g, a, l, h, 8, 0.25);
  });
  region(g, R.borne, (l, h) => {
    g.fillStyle = "#18262a";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#c79a3b";
    g.fillRect(0, 0, l, 40);
    texte(g, "WattyVélo", l / 2, 21, 28, "#18262a");
    texte(g, "Recharge express", l / 2, 64, 22, "#e9dfc6", { max: l - 20 });
    texte(g, "100 % en 3 minutes", l / 2, 92, 22, "#e9dfc6", { max: l - 20 });
    texte(g, "Abonnés Plume+ uniquement", l / 2, 126, 16, "#7fe0e8", { poids: "", max: l - 20 });
    rouille(g, a, l, h, 8);
  });

  // Les pancartes des survivants, peintes à la main
  region(g, R.passerelle, (l, h) => {
    g.fillStyle = "#8a6f50";
    g.fillRect(0, 0, l, h);
    for (let y = 0; y < h; y += 24) {
      g.fillStyle = "rgba(0,0,0,0.25)";
      g.fillRect(0, y, l, 2);
    }
    texte(g, "PASSERELLE", l / 2, 34, 34, "#efe8d8", { police: PEINT, max: l - 16 });
    texte(g, "1 À LA FOIS !", l / 2, 70, 30, "#e8c840", { police: PEINT, max: l - 16 });
  });
  region(g, R.tourbe, (l, h) => {
    g.fillStyle = "#6f5a42";
    g.fillRect(0, 0, l, h);
    for (let y = 0; y < h; y += 26) {
      g.fillStyle = "rgba(0,0,0,0.2)";
      g.fillRect(0, y, l, 2);
    }
    texte(g, "TOURBE SÈCHE", l / 2, 30, 30, "#efe8d8", { police: PEINT, max: l - 16 });
    texte(g, "1 pile = 3 clous", l / 2, 64, 24, "#efe8d8", { police: PEINT, max: l - 16 });
    texte(g, "— les Charbonniers", l / 2, 98, 20, "#e0b860", { police: PEINT, max: l - 16 });
  });
  region(g, R.digue, (l, h) => {
    g.fillStyle = "#e7e3d6";
    g.fillRect(0, 0, l, h);
    g.strokeStyle = "#c8362b";
    g.lineWidth = 6;
    g.strokeRect(6, 6, l - 12, h - 12);
    texte(g, "DIGUE DES ROSELIÈRES", l / 2, 34, 24, "#2b2d2e", { max: l - 24 });
    texte(g, "Charge limitée 3,5 t", l / 2, 66, 20, "#2b2d2e", { poids: "", max: l - 24 });
    salir(g, a, l, h, 8, 0.25);
    rouille(g, a, l, h, 5);
  });
  region(g, R.hutte, (l, h) => {
    g.fillStyle = "#5e4c38";
    g.fillRect(0, 0, l, h);
    texte(g, "HUTTE CONNECTÉE · résa sur l'appli", l / 2, h / 2, 20, "#e0d4b8", { police: SERIF, max: l - 16 });
    salir(g, a, l, h, 6, 0.3);
  });
  region(g, R.calendrier, (l, h) => {
    g.fillStyle = "#efe8d8";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#c79a3b";
    g.fillRect(0, 0, l, 70);
    watty(g, l / 2, 38, 52);
    texte(g, "Toujours plein,", l / 2, 86, 13, "#2f6f73", { max: l - 8 });
    texte(g, "jamais à plat !", l / 2, 102, 13, "#2f6f73", { max: l - 8 });
    g.strokeStyle = "#999";
    g.lineWidth = 1;
    for (let i = 0; i < 6; i++) for (let j = 0; j < 5; j++) g.strokeRect(8 + i * 19, 116 + j * 14, 19, 14);
    g.strokeStyle = "#c8362b";
    g.lineWidth = 2;
    for (let k = 0; k < 17; k++) {
      const x = 8 + (k % 6) * 19;
      const y = 116 + Math.floor(k / 6) * 14;
      g.beginPath();
      g.moveTo(x + 3, y + 3);
      g.lineTo(x + 16, y + 11);
      g.stroke();
    }
    salir(g, a, l, h, 6, 0.2);
  });
  region(g, R.tableau, (l, h) => {
    g.fillStyle = "#56605a";
    g.fillRect(0, 0, l, h);
    for (let i = 0; i < 4; i++) {
      const x = 34 + i * 62;
      g.fillStyle = "#e9e4d4";
      g.beginPath();
      g.arc(x, 44, 24, 0, 7);
      g.fill();
      g.strokeStyle = "#222";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x, 44);
      const an = -2.6 + a() * 2;
      g.lineTo(x + Math.cos(an) * 20, 44 + Math.sin(an) * 20);
      g.stroke();
      g.fillStyle = i === 2 ? "#a83a2e" : "#3a3a36";
      g.fillRect(x - 10, 86, 20, 26);
    }
    salir(g, a, l, h, 8, 0.3);
  });
  region(g, R.carrelet, (l, h) => {
    g.fillStyle = "#e0d8c4";
    g.fillRect(0, 0, l, h);
    texte(g, "NE PAS TOUCHER", l / 2, 22, 16, "#a83a2e", { police: PEINT, max: l - 6 });
    texte(g, "AU FILET", l / 2, 44, 16, "#a83a2e", { police: PEINT, max: l - 6 });
  });
  region(g, R.watty, (l, h) => {
    g.fillStyle = "#2f6f73";
    g.fillRect(0, 0, l, h);
    watty(g, l / 2, h / 2 + 4, 84);
  });
  region(g, R.danger, (l, h) => {
    g.fillStyle = "#e7e3d6";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#c8362b";
    g.beginPath();
    g.moveTo(60, 14);
    g.lineTo(108, 100);
    g.lineTo(12, 100);
    g.closePath();
    g.fill();
    g.fillStyle = "#e7e3d6";
    g.beginPath();
    g.moveTo(60, 34);
    g.lineTo(92, 90);
    g.lineTo(28, 90);
    g.closePath();
    g.fill();
    texte(g, "!", 60, 70, 40, "#2b2d2e");
    texte(g, "DIGUE", 182, 40, 30, "#2b2d2e", { max: 130 });
    texte(g, "FRAGILE", 182, 76, 28, "#c8362b", { max: 130 });
    texte(g, "pas de baignade", 128, 114, 14, "#2b2d2e", { poids: "", max: 230 });
    salir(g, a, l, h, 10, 0.3);
    rouille(g, a, l, h, 6);
  });
  region(g, R.fourgon, (l, h) => {
    g.fillStyle = "#d9d4c4";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#2f6f73";
    g.fillRect(0, h - 34, l, 34);
    watty(g, 60, 56, 76);
    texte(g, "WATTY SERVICES", 290, 40, 46, "#2f6f73", { max: 380 });
    texte(g, "Toujours plein, jamais à plat !", 290, 80, 24, "#c79a3b", { poids: "italic bold", max: 380 });
    texte(g, "Intervention garantie en 30 min", 290, h - 17, 18, "#e9dfc6", { max: 400 });
    salir(g, a, l, h, 14, 0.3);
    rouille(g, a, l, h, 12);
  });
  region(g, R.unALaFois, (l, h) => {
    g.fillStyle = "#4a4a44";
    g.fillRect(0, 0, l, h);
    texte(g, "MAINS VIDES · UN PAR UN", l / 2, h / 2, 24, "#efe8d8", { police: PEINT, max: l - 12 });
  });
  region(g, R.barriere, (l, h) => {
    g.fillStyle = "#e7e3d6";
    g.fillRect(0, 0, l, h);
    texte(g, "ACCÈS RÉSERVÉ", l / 2, 30, 28, "#c8362b", { max: l - 20 });
    texte(g, "riverains · abonnés Plume+", l / 2, 64, 20, "#2b2d2e", { poids: "", max: l - 20 });
    salir(g, a, l, h, 8, 0.25);
  });
  region(g, R.oiseaux, (l, h) => {
    // La frise des oiseaux du marais, au mur de l'observatoire (tous absents)
    g.fillStyle = "#d9cfb6";
    g.fillRect(0, 0, l, h);
    const noms = ["Héron cendré", "Butor étoilé", "Sarcelle", "Busard", "Râle d'eau"];
    noms.forEach((n, i) => {
      const x = 52 + i * 102;
      heron(g, x, 40, 46, "#4f5a52");
      texte(g, n, x, 80, 13, "#3a3a34", { poids: "", max: 96 });
    });
    salir(g, a, l, h, 10, 0.25);
  });
  region(g, R.carte, (l, h) => {
    g.fillStyle = "#d8d0b4";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#7da0a8";
    g.fillRect(0, 0, l, 40);
    g.fillRect(0, 62, l, h - 62);
    g.fillStyle = "#8a7a5a";
    g.fillRect(0, 40, l, 22);
    g.fillStyle = "#c8362b";
    g.beginPath();
    g.arc(150, 50, 7, 0, 7);
    g.fill();
    texte(g, "vous êtes ici", 150, 82, 14, "#2b2d2e", { poids: "" });
  });
  region(g, R.appli, (l, h) => {
    g.fillStyle = "#e9dfc6";
    g.fillRect(0, 0, l, h);
    texte(g, "Votre hutte vous attend !", l / 2, 30, 20, "#2f6f73", { max: l - 16 });
    texte(g, "Canard+ · 12 Wh la nuit", l / 2, 62, 18, "#c8362b", { max: l - 16 });
    salir(g, a, l, h, 8, 0.3);
  });
}

/** L'eau : des rides claires et sombres, étirées dans le sens du courant (u). */
export function dessinerEau(g) {
  const a = aleatoire(61);
  g.fillStyle = "#c2ccc4";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 220; i++) {
    const x = a() * 256;
    const y = a() * 256;
    const lg = 16 + a() * 60;
    g.fillStyle = a() < 0.5 ? `rgba(255,255,255,${0.12 + a() * 0.2})` : `rgba(20,40,30,${0.1 + a() * 0.12})`;
    const e = 1 + a() * 2;
    for (const dx of [0, -256, 256]) for (const dy of [0, -256, 256]) g.fillRect(x + dx, y + dy, lg, e);
  }
  taches(g, a, 14, "rgba(255,255,255,0.1)", 14, 40, 256, 256);
  taches(g, a, 10, "rgba(30,50,30,0.12)", 14, 40, 256, 256);
}

/** L'écume au pied des chutes. */
export function dessinerEcume(g) {
  const a = aleatoire(67);
  g.clearRect(0, 0, 128, 128);
  for (let i = 0; i < 160; i++) {
    const x = a() * 128;
    const y = a() * 128;
    const r = 1 + a() * 4.5;
    g.fillStyle = `rgba(255,255,255,${0.35 + a() * 0.5})`;
    for (const [dx, dy] of [[0, 0], [128, 0], [-128, 0], [0, 128], [0, -128]]) {
      g.beginPath();
      g.ellipse(x + dx, y + dy, r * (1.2 + a()), r, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
}

/** La brume : des voiles doux, raccordés en u (elle dérive), éteints sur les bords en v. */
export function dessinerBrume(g) {
  const a = aleatoire(71);
  g.fillStyle = "#000";
  g.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 70; i++) {
    const x = a() * 512;
    const y = 30 + a() * 68;
    const rx = 30 + a() * 90;
    const ry = 8 + a() * 18;
    for (const dx of [0, -512, 512]) {
      const d = g.createRadialGradient(x + dx, y, 0, x + dx, y, rx);
      d.addColorStop(0, `rgba(255,255,255,${0.12 + a() * 0.14})`);
      d.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = d;
      g.save();
      g.translate(x + dx, y);
      g.scale(1, ry / rx);
      g.translate(-(x + dx), -y);
      g.fillRect(x + dx - rx, y - rx, rx * 2, rx * 2);
      g.restore();
    }
  }
}

/** Des planches grises de bois flotté, clouées (tuile de 2,4 m). */
export function dessinerPlanches(g) {
  const a = aleatoire(47);
  g.fillStyle = "#c9c0ae";
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 21.333) {
    let x = -a() * 80;
    while (x < 256) {
      const l = 90 + a() * 120;
      const v = 200 + Math.floor((a() - 0.5) * 44);
      g.fillStyle = `rgb(${v},${v - 6},${v - 16})`;
      g.fillRect(x + 1, y + 1, l - 2, 19.3);
      g.strokeStyle = "rgba(60,50,40,0.16)";
      for (let k = 0; k < 3; k++) {
        g.beginPath();
        g.moveTo(x, y + 4 + k * 6 + a() * 3);
        g.lineTo(x + l, y + 4 + k * 6 + a() * 3);
        g.stroke();
      }
      g.fillStyle = "rgba(40,30,20,0.6)";
      g.fillRect(x + 4, y + 9, 2, 2);
      g.fillRect(x + l - 6, y + 9, 2, 2);
      x += l;
    }
    g.fillStyle = "rgba(30,24,18,0.55)";
    g.fillRect(0, y, 256, 1.5);
  }
  taches(g, a, 8, "rgba(60, 80, 50, 0.22)", 10, 34, 256, 256);
}
