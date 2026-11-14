// L'atlas de la halte du carrefour : toutes les enseignes, affiches, panneaux, écrans et tampons dans UNE texture
// (une seule matière « enseignes », plus sa variante lumineuse « néon » pour ce qui luit encore la nuit).
// Les régions sont données en pixels : [x, y, largeur, hauteur].

import { aleatoire } from "../commun/atelier.js";

export const AL = 1024;
export const AH = 2048;

export const R = {
  neonRoutiers: [0, 0, 512, 256],
  menu: [512, 0, 256, 256],
  nappe: [768, 0, 128, 128],
  nappeBleue: [896, 0, 128, 128],
  carreaux: [768, 128, 256, 128],
  facadeRoutiers: [0, 256, 1024, 128],
  plaqueWatty: [0, 384, 512, 128],
  wattyVisage: [512, 384, 256, 256],
  prixRoutier: [768, 384, 256, 256],
  rondPoint: [0, 512, 512, 256],
  comptoir: [512, 640, 512, 256],
  panneauOuest: [0, 768, 512, 128],
  panneauEst: [0, 896, 512, 128],
  covoit: [512, 896, 256, 256],
  kitEcran: [768, 896, 256, 128],
  aquarium: [768, 1024, 256, 128],
  jardinerie: [0, 1024, 768, 128],
  kitPotager: [0, 1152, 512, 256],
  tracteurs: [512, 1152, 512, 256],
  barree: [0, 1408, 512, 128],
  deviation: [512, 1408, 256, 128],
  pasParLa: [768, 1408, 256, 128],
  coop: [0, 1536, 512, 128],
  wattyAffiche: [512, 1536, 256, 256],
  horaires: [768, 1536, 256, 256],
  gabarit: [0, 1664, 256, 128],
  feuAmis: [256, 1664, 256, 128],
  inventorie: [0, 1792, 256, 128],
  oeufs: [256, 1792, 256, 128],
  exVoto: [512, 1792, 256, 128],
  graines: [768, 1792, 256, 128],
  voieRapide: [0, 1920, 512, 128],
  covoitPanneau: [512, 1920, 512, 128],
};

// ---------- Outils de dessin ----------

function grainZone(g, a, x, y, l, h, n, force = 0.06) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = a() < 0.5 ? `rgba(0,0,0,${force})` : `rgba(255,255,255,${force})`;
    g.fillRect(x + a() * l, y + a() * h, 1 + a() * 2.5, 1 + a() * 2.5);
  }
}

/** Salit une région : grain, taches, coulures (le temps qui passe sur les panneaux). */
function salir(g, a, r, force = 1) {
  const [x, y, l, h] = r;
  g.save();
  g.beginPath();
  g.rect(x, y, l, h);
  g.clip();
  grainZone(g, a, x, y, l, h, (l * h) / 180, 0.05 * force);
  for (let i = 0; i < 4 + (l * h) / 9000; i++) {
    const cx = x + a() * l;
    const cy = y + a() * h;
    const rr = 6 + a() * Math.min(l, h) * 0.3;
    const d = g.createRadialGradient(cx, cy, 0, cx, cy, rr);
    d.addColorStop(0, `rgba(70,60,45,${0.18 * force})`);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
  }
  for (let i = 0; i < l / 30; i++) {
    const cx = x + a() * l;
    const lg = h * (0.2 + a() * 0.6);
    const d = g.createLinearGradient(0, y, 0, y + lg);
    d.addColorStop(0, `rgba(60,50,40,${0.22 * force})`);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(cx, y, 1 + a() * 4, lg);
  }
  g.restore();
}

function fond(g, r, couleur) {
  g.fillStyle = couleur;
  g.fillRect(r[0], r[1], r[2], r[3]);
}

function ecrire(g, s, cx, cy, maxL, taille, couleur, style = "bold", famille = "'Arial Narrow', Arial, Helvetica, sans-serif") {
  g.fillStyle = couleur;
  g.textAlign = "center";
  g.textBaseline = "middle";
  let t = taille;
  do {
    g.font = `${style} ${t}px ${famille}`;
    t -= 2;
  } while (g.measureText(s).width > maxL && t > 8);
  g.fillText(s, cx, cy);
}

/** Lettres peintes à la main, un peu de travers, avec des coulures. */
function peindre(g, a, s, cx, cy, maxL, taille, couleur) {
  g.save();
  g.translate(cx, cy);
  g.rotate((a() - 0.5) * 0.07);
  ecrire(g, s, 0, 0, maxL, taille, couleur, "bold", "'Marker Felt', 'Comic Sans MS', 'Chalkboard', cursive");
  g.font = `bold ${taille}px sans-serif`;
  const w = Math.min(maxL, g.measureText(s).width);
  g.fillStyle = couleur;
  for (let i = 0; i < s.length / 2; i++) g.fillRect(-w / 2 + a() * w, taille * 0.3, 2, 6 + a() * taille * 0.5);
  g.restore();
}

function cadre(g, r, couleur, ep = 6, marge = 8) {
  g.strokeStyle = couleur;
  g.lineWidth = ep;
  g.strokeRect(r[0] + marge, r[1] + marge, r[2] - marge * 2, r[3] - marge * 2);
}

function sourire(g, cx, cy, rr, couleur, ep = 6) {
  g.strokeStyle = couleur;
  g.fillStyle = couleur;
  g.lineWidth = ep;
  g.beginPath();
  g.arc(cx - rr * 0.38, cy - rr * 0.25, rr * 0.13, 0, Math.PI * 2);
  g.arc(cx + rr * 0.38, cy - rr * 0.25, rr * 0.13, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.arc(cx, cy + rr * 0.05, rr * 0.6, 0.12 * Math.PI, 0.88 * Math.PI);
  g.stroke();
}

/** Watty en petit : la pile souriante de la Compagnie. */
function watty(g, cx, cy, s) {
  g.fillStyle = "#e9c64a";
  g.fillRect(cx - s * 0.5, cy - s, s, s * 1.3);
  g.fillStyle = "#5a8f4e";
  g.fillRect(cx - s * 0.5, cy + s * 0.3, s, s * 0.7);
  g.fillStyle = "#c9c4b6";
  g.fillRect(cx - s * 0.18, cy - s * 1.2, s * 0.36, s * 0.2);
  sourire(g, cx, cy - s * 0.45, s * 0.32, "#3a2f20", Math.max(2, s * 0.06));
  ecrire(g, "+", cx, cy + s * 0.65, s, s * 0.6, "#f4f0e0");
}

/** Un tampon des Compteurs : un rectangle à bords doubles, de travers, à l'encre délavée. */
function tampon(g, a, cx, cy, l, h, lignes, couleur = "rgba(40,70,140,0.75)", angle = null) {
  g.save();
  g.translate(cx, cy);
  g.rotate(angle ?? (a() - 0.5) * 0.5);
  g.strokeStyle = couleur;
  g.lineWidth = 3;
  g.strokeRect(-l / 2, -h / 2, l, h);
  g.lineWidth = 1.5;
  g.strokeRect(-l / 2 + 5, -h / 2 + 5, l - 10, h - 10);
  const n = lignes.length;
  lignes.forEach((s, i) => ecrire(g, s, 0, -h / 2 + ((i + 0.5) * h) / n, l - 16, Math.min(26, (h / n) * 0.62), couleur, "bold", "'Courier New', monospace"));
  // l'encre manque par endroits
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 30; i++) {
    g.fillStyle = `rgba(0,0,0,${0.3 + a() * 0.5})`;
    g.fillRect(-l / 2 + a() * l, -h / 2 + a() * h, 2 + a() * 6, 1 + a() * 3);
  }
  g.restore();
}

/** Flèche de panneau directionnel (pointe à gauche ou à droite). */
function flecheDirection(g, r, sens, fondCouleur, bord) {
  const [x, y, l, h] = r;
  g.fillStyle = fondCouleur;
  g.beginPath();
  if (sens > 0) {
    g.moveTo(x + 6, y + 10);
    g.lineTo(x + l - 70, y + 10);
    g.lineTo(x + l - 6, y + h / 2);
    g.lineTo(x + l - 70, y + h - 10);
    g.lineTo(x + 6, y + h - 10);
  } else {
    g.moveTo(x + l - 6, y + 10);
    g.lineTo(x + 70, y + 10);
    g.lineTo(x + 6, y + h / 2);
    g.lineTo(x + 70, y + h - 10);
    g.lineTo(x + l - 6, y + h - 10);
  }
  g.closePath();
  g.fill();
  g.strokeStyle = bord;
  g.lineWidth = 5;
  g.stroke();
}

function planches(g, a, r, base = 125) {
  const [x, y, l, h] = r;
  const n = Math.max(2, Math.round(h / 32));
  for (let i = 0; i < n; i++) {
    const v = base + Math.floor(a() * 30);
    g.fillStyle = `rgb(${v},${v - 26},${v - 52})`;
    g.fillRect(x, y + (i * h) / n, l, h / n - 2);
  }
}

// ---------- L'atlas ----------

export function dessinerAtlas(g) {
  const a = aleatoire(2026);
  g.clearRect(0, 0, AL, AH);

  // Le néon « Les Routiers » : tubes rouges et bleus sur caisson sombre (éteint le jour, allumé la nuit sur batterie)
  {
    const [x, y, l, h] = R.neonRoutiers;
    fond(g, R.neonRoutiers, "#15181c");
    g.lineCap = "round";
    // un camion stylisé en tube bleu
    g.strokeStyle = "#5fb4ff";
    g.shadowColor = "#5fb4ff";
    g.shadowBlur = 14;
    g.lineWidth = 7;
    g.strokeRect(x + 40, y + 40, 120, 60);
    g.beginPath();
    g.moveTo(x + 160, y + 100);
    g.lineTo(x + 160, y + 58);
    g.lineTo(x + 196, y + 58);
    g.lineTo(x + 214, y + 80);
    g.lineTo(x + 214, y + 100);
    g.stroke();
    for (const rx of [70, 135, 195]) {
      g.beginPath();
      g.arc(x + rx, y + 108, 11, 0, Math.PI * 2);
      g.stroke();
    }
    // les lettres en tube rouge
    g.shadowColor = "#ff4a3a";
    g.strokeStyle = "#ff5a48";
    g.fillStyle = "#ff8a70";
    g.lineWidth = 3;
    g.font = "bold 92px 'Arial Narrow', Arial, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("LES", x + 380, y + 72);
    g.font = "bold 96px 'Arial Narrow', Arial, sans-serif";
    g.fillText("ROUTIERS", x + 256, y + 178);
    g.shadowBlur = 0;
    // le filet bleu tout autour
    g.strokeStyle = "#5fb4ff";
    g.shadowColor = "#5fb4ff";
    g.shadowBlur = 12;
    g.lineWidth = 6;
    g.strokeRect(x + 14, y + 14, l - 28, h - 28);
    g.shadowBlur = 0;
    // deux lettres mortes (tube cassé)
    g.fillStyle = "rgba(21,24,28,0.82)";
    g.fillRect(x + 300, y + 136, 46, 84);
  }

  // Le menu à la craie
  {
    const [x, y, l, h] = R.menu;
    fond(g, R.menu, "#2d3430");
    g.strokeStyle = "#8a6a44";
    g.lineWidth = 12;
    g.strokeRect(x + 6, y + 6, l - 12, h - 12);
    const craie = "rgba(235,232,220,0.9)";
    peindre(g, a, "MENU OUVRIER", x + 128, y + 40, 220, 28, craie);
    peindre(g, a, "Entrée · Plat · Fromage", x + 128, y + 82, 220, 18, craie);
    peindre(g, a, "Dessert · ¼ de vin", x + 128, y + 106, 220, 18, craie);
    peindre(g, a, "14,90", x + 128, y + 142, 200, 30, "rgba(240,200,120,0.95)");
    peindre(g, a, "Formule PREMIUM ROUTIER", x + 128, y + 184, 230, 15, craie);
    peindre(g, a, "steak réservé par appli", x + 128, y + 206, 230, 14, craie);
    peindre(g, a, "(abonnement)", x + 128, y + 226, 200, 13, craie);
    salir(g, a, R.menu, 0.8);
  }

  // Les nappes à carreaux (rouge et bleue) et un carrelage de cuisine
  for (const [r, c1] of [[R.nappe, "#b8433a"], [R.nappeBleue, "#3f5f8f"]]) {
    const [x, y, l, h] = r;
    fond(g, r, "#efe9dc");
    g.fillStyle = c1;
    g.globalAlpha = 0.55;
    for (let i = 0; i < 8; i++) {
      g.fillRect(x + i * 16, y, 8, h);
      g.fillRect(x, y + i * 16, l, 8);
    }
    g.globalAlpha = 1;
    salir(g, a, r, 0.9);
    taches(g, a, x, y, l, h);
  }
  {
    const [x, y, l, h] = R.carreaux;
    fond(g, R.carreaux, "#9a9a96");
    for (let i = 0; i < l / 16; i++)
      for (let j = 0; j < h / 16; j++) {
        const v = 226 + Math.floor((a() - 0.5) * 18);
        g.fillStyle = `rgb(${v},${v},${v - 6})`;
        g.fillRect(x + i * 16 + 1, y + j * 16 + 1, 14, 14);
      }
    salir(g, a, R.carreaux, 1.4);
  }

  // Le bandeau de façade du relais
  {
    const [x, y, l, h] = R.facadeRoutiers;
    fond(g, R.facadeRoutiers, "#e8e0cc");
    g.fillStyle = "#b8433a";
    g.fillRect(x, y, l, 14);
    g.fillRect(x, y + h - 14, l, 14);
    ecrire(g, "LES ROUTIERS DU CARREFOUR", x + 400, y + 58, 700, 64, "#2c3e66");
    ecrire(g, "Restaurant · Bar · Chambres · Douches · Parking poids lourds", x + 400, y + 100, 720, 22, "#5a4a3a", "normal");
    ecrire(g, "Ouvert 24 h / 24", x + 900, y + 64, 200, 30, "#b8433a");
    salir(g, a, R.facadeRoutiers, 1.5);
    // une lettre tombée
    g.fillStyle = "#e8e0cc";
    g.fillRect(x + 470, y + 26, 42, 64);
  }

  // La plaque de la sculpture
  {
    const [x, y, l, h] = R.plaqueWatty;
    fond(g, R.plaqueWatty, "#8a7040");
    const d = g.createLinearGradient(x, y, x, y + h);
    d.addColorStop(0, "#c9a85a");
    d.addColorStop(1, "#8f7038");
    g.fillStyle = d;
    g.fillRect(x + 8, y + 8, l - 16, h - 16);
    ecrire(g, "Offert par la Compagnie", x + 256, y + 44, 460, 38, "#3a2a14", "bold", "Georgia, 'Times New Roman', serif");
    ecrire(g, "« L'énergie de nos territoires »", x + 256, y + 86, 460, 28, "#3a2a14", "italic", "Georgia, 'Times New Roman', serif");
    // vert-de-gris
    taches(g, a, x, y, l, h, "rgba(80,140,110,0.35)", 10);
    salir(g, a, R.plaqueWatty, 1);
  }

  // Le visage de Watty (appliqué sur la face avant de la pile géante)
  {
    const [x, y, l, h] = R.wattyVisage;
    fond(g, R.wattyVisage, "#e3be48");
    sourire(g, x + l / 2, y + h * 0.45, 90, "#3a2f20", 12);
    // joues
    g.fillStyle = "rgba(220,110,80,0.45)";
    g.beginPath();
    g.arc(x + 50, y + 140, 20, 0, 7);
    g.arc(x + l - 50, y + 140, 20, 0, 7);
    g.fill();
    // la peinture s'écaille : la résine grise apparaît
    for (let i = 0; i < 26; i++) {
      g.fillStyle = a() < 0.6 ? "#b9b4a6" : "#9e998c";
      const cx = x + a() * l;
      const cy = y + a() * h;
      g.beginPath();
      g.moveTo(cx, cy);
      for (let k = 0; k < 6; k++) g.lineTo(cx + (a() - 0.5) * 34, cy + (a() - 0.5) * 26);
      g.fill();
    }
    salir(g, a, R.wattyVisage, 1);
  }

  // Les prix du relais (ardoise du bar)
  {
    const [x, y, l, h] = R.prixRoutier;
    fond(g, R.prixRoutier, "#2d3430");
    const craie = "rgba(235,232,220,0.9)";
    peindre(g, a, "AU BAR", x + 128, y + 34, 200, 30, craie);
    const lignes = ["Café ........ 1,20", "Demi ........ 2,50", "Douche ...... 3,00", "Chambre ..... 39,00", "Wi-Fi Premium  9,99/h"];
    lignes.forEach((s, i) => peindre(g, a, s, x + 128, y + 82 + i * 34, 230, 19, i === 4 ? "rgba(240,190,120,0.95)" : craie));
    salir(g, a, R.prixRoutier, 0.8);
  }

  // Le panneau du rond-point intelligent : bleu municipal, pictogramme de cerveau à engrenages
  {
    const [x, y, l, h] = R.rondPoint;
    fond(g, R.rondPoint, "#1f4f8a");
    cadre(g, R.rondPoint, "#e8eef4", 6, 10);
    // pictogramme : un rond-point (trois flèches en cercle) avec une puce au centre
    g.strokeStyle = "#e8eef4";
    g.lineWidth = 10;
    g.beginPath();
    g.arc(x + 100, y + 128, 58, 0.3, Math.PI * 2 - 0.3);
    g.stroke();
    g.fillStyle = "#e8eef4";
    g.fillRect(x + 82, y + 110, 36, 36);
    g.fillStyle = "#1f4f8a";
    g.fillRect(x + 90, y + 118, 20, 20);
    for (let i = 0; i < 4; i++) {
      g.fillStyle = "#e8eef4";
      g.fillRect(x + 86 + i * 9, y + 102, 4, 8);
      g.fillRect(x + 86 + i * 9, y + 146, 4, 8);
    }
    ecrire(g, "ROND-POINT", x + 330, y + 62, 300, 50, "#ffffff");
    ecrire(g, "INTELLIGENT", x + 330, y + 112, 300, 50, "#ffffff");
    ecrire(g, "Fluidité garantie par IA", x + 330, y + 162, 300, 26, "#cfe0f0", "italic bold");
    ecrire(g, "Votre Département innove · avec la Compagnie", x + 300, y + 218, 400, 15, "#a8c0dc", "normal");
    salir(g, a, R.rondPoint, 1.2);
    peindre(g, a, "BOUCHÉ", x + 380, y + 136, 200, 46, "rgba(215,60,45,0.85)");
  }

  // Le panneau des Compteurs : « Comptoir du Carrefour · 2 km », couvert de tampons
  {
    const [x, y, l, h] = R.comptoir;
    fond(g, R.comptoir, "#e9e3d2");
    g.fillStyle = "#2f4f7a";
    g.fillRect(x, y, l, 64);
    ecrire(g, "LES COMPTEURS", x + 256, y + 33, 460, 38, "#f2ecdc", "bold", "'Courier New', monospace");
    flecheDirection(g, [x + 20, y + 76, 472, 96], -1, "#ffffff", "#2f4f7a");
    ecrire(g, "Comptoir du Carrefour · 2 km", x + 276, y + 124, 380, 36, "#1a1a1a");
    ecrire(g, "Change · Dépôt · Pesée · Wotts", x + 256, y + 196, 460, 26, "#2f4f7a");
    ecrire(g, "Énergie comptée, prix affiché. Armes au vestiaire.", x + 256, y + 230, 470, 17, "#4a4a44", "italic");
    tampon(g, a, x + 418, y + 200, 150, 64, ["VU", "CELLULE 7"], "rgba(40,70,140,0.7)", -0.2);
    tampon(g, a, x + 90, y + 196, 140, 60, ["ROUTE SÛRE ?", "NON GARANTI"], "rgba(170,40,30,0.7)", 0.15);
    salir(g, a, R.comptoir, 1);
  }

  // Les panneaux directionnels des deux bouts : blancs à lettres noires, routes départementales
  {
    const r = R.panneauOuest;
    flecheDirection(g, r, 1, "#f2f0ea", "#2a2a2a");
    ecrire(g, "Village · Coopérative", r[0] + 220, r[1] + 46, 380, 36, "#1a1a1a");
    ecrire(g, "Moulin des Mécanistes", r[0] + 220, r[1] + 88, 380, 30, "#1a1a1a");
    g.fillStyle = "#d8a63a";
    g.fillRect(r[0] + 18, r[1] + 22, 40, 30);
    ecrire(g, "D 12", r[0] + 38, r[1] + 37, 36, 18, "#1a1a1a");
    salir(g, a, r, 1);
  }
  {
    const r = R.panneauEst;
    flecheDirection(g, r, -1, "#f2f0ea", "#2a2a2a");
    ecrire(g, "Comptoir du Carrefour  2", r[0] + 290, r[1] + 46, 380, 36, "#1a1a1a");
    ecrire(g, "Ton terrain", r[0] + 290, r[1] + 88, 380, 30, "#1a1a1a");
    tampon(g, a, r[0] + 440, r[1] + 86, 110, 40, ["COMPTEURS"], "rgba(40,70,140,0.7)", 0.1);
    salir(g, a, r, 1);
  }

  // L'écran de la borne de covoiturage autonome (luit encore)
  {
    const [x, y, l, h] = R.covoit;
    fond(g, R.covoit, "#0c1a22");
    g.fillStyle = "#38c6a0";
    g.fillRect(x + 10, y + 10, l - 20, 40);
    ecrire(g, "COVOIT'IA", x + 128, y + 31, 220, 28, "#0c1a22");
    ecrire(g, "Votre conducteur", x + 128, y + 80, 230, 22, "#9ff0d8");
    ecrire(g, "autonome arrive dans", x + 128, y + 106, 230, 22, "#9ff0d8");
    ecrire(g, "1 284 jours", x + 128, y + 150, 230, 40, "#ffffff");
    ecrire(g, "Merci de patienter.", x + 128, y + 196, 230, 18, "#6fc0a8", "italic");
    ecrire(g, "Trajet partagé · 0 émission", x + 128, y + 228, 230, 14, "#4f9a88", "normal");
  }

  // L'écran du kit potager connecté (luit encore)
  {
    const [x, y, l, h] = R.kitEcran;
    fond(g, R.kitEcran, "#0f1c12");
    ecrire(g, "🌱 Mon Potager+", x + 128, y + 22, 230, 20, "#9fe07a");
    ecrire(g, "Humidité : ERREUR", x + 128, y + 54, 230, 20, "#e0f0c0");
    ecrire(g, "Abonnement expiré", x + 128, y + 84, 230, 22, "#ffb070");
    ecrire(g, "Arrosage suspendu", x + 128, y + 110, 230, 16, "#80a070", "italic");
  }

  // L'étiquette des aquariums
  {
    const [x, y, l, h] = R.aquarium;
    fond(g, R.aquarium, "#f0e8d0");
    ecrire(g, "Poisson rouge PREMIUM", x + 128, y + 34, 230, 24, "#c0502a");
    ecrire(g, "connecté · nourri par appli", x + 128, y + 70, 230, 18, "#3a3a3a", "normal");
    ecrire(g, "29,99 + 4,99/mois", x + 128, y + 102, 230, 22, "#2f6f73");
    salir(g, a, R.aquarium, 1);
  }

  // L'enseigne de la jardinerie
  {
    const [x, y, l, h] = R.jardinerie;
    const d = g.createLinearGradient(x, y, x, y + h);
    d.addColorStop(0, "#4f8a4a");
    d.addColorStop(1, "#356a38");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
    // une feuille stylisée
    g.fillStyle = "#c8e08a";
    g.beginPath();
    g.ellipse(x + 70, y + 64, 26, 48, 0.6, 0, Math.PI * 2);
    g.fill();
    ecrire(g, "JARDI-ABONDANCE", x + 400, y + 52, 560, 62, "#f4f0dc");
    ecrire(g, "Jardinerie · Animalerie · Potager connecté", x + 400, y + 100, 560, 24, "#d8ecc0", "normal");
    salir(g, a, R.jardinerie, 1.3);
  }

  // L'affiche du kit potager connecté
  {
    const [x, y, l, h] = R.kitPotager;
    fond(g, R.kitPotager, "#f4efe0");
    g.fillStyle = "#6aa84a";
    g.fillRect(x, y, l, 60);
    ecrire(g, "KIT POTAGER CONNECTÉ", x + 256, y + 32, 480, 36, "#ffffff");
    // une tomate et un smartphone
    g.fillStyle = "#d8402a";
    g.beginPath();
    g.arc(x + 110, y + 150, 52, 0, 7);
    g.fill();
    g.fillStyle = "#4a8a3a";
    g.fillRect(x + 100, y + 92, 20, 14);
    g.fillStyle = "#2a2a2a";
    g.fillRect(x + 190, y + 96, 60, 110);
    g.fillStyle = "#9fd8f0";
    g.fillRect(x + 196, y + 104, 48, 86);
    ecrire(g, "Vos tomates", x + 380, y + 104, 230, 28, "#2a2a2a");
    ecrire(g, "gérées par appli", x + 380, y + 138, 230, 28, "#2a2a2a");
    ecrire(g, "9,99 / mois", x + 380, y + 186, 230, 36, "#c0502a");
    ecrire(g, "Graines sous licence · non replantables", x + 256, y + 236, 480, 15, "#6a6a60", "italic");
    salir(g, a, R.kitPotager, 1.2);
    g.clearRect(x + l - 90, y + h - 70, 90, 70);
    g.clearRect(x + l - 40, y + h - 120, 40, 50);
  }

  // Le panneau de la concession de tracteurs
  {
    const [x, y, l, h] = R.tracteurs;
    fond(g, R.tracteurs, "#e9e4d6");
    g.fillStyle = "#c79a3b";
    g.fillRect(x, y, l, 70);
    ecrire(g, "AGRI-CONNECT", x + 256, y + 36, 470, 50, "#2a2a22");
    // silhouette de tracteur
    g.fillStyle = "#4a7a3a";
    g.fillRect(x + 40, y + 120, 110, 50);
    g.fillRect(x + 110, y + 90, 50, 40);
    g.fillStyle = "#2a2a22";
    g.beginPath();
    g.arc(x + 70, y + 178, 30, 0, 7);
    g.arc(x + 150, y + 186, 20, 0, 7);
    g.fill();
    ecrire(g, "Le tracteur autonome", x + 350, y + 104, 300, 28, "#2a2a22");
    ecrire(g, "laboure pendant que", x + 350, y + 140, 300, 26, "#2a2a22", "normal");
    ecrire(g, "vous dormez.", x + 350, y + 170, 300, 26, "#2a2a22", "normal");
    ecrire(g, "Livraison garantie J+1", x + 256, y + 224, 470, 28, "#b8433a");
    salir(g, a, R.tracteurs, 1.3);
    tampon(g, a, x + 420, y + 222, 150, 50, ["JAMAIS LIVRÉ"], "rgba(40,70,140,0.75)", -0.12);
  }

  // Les panneaux de la barricade
  {
    const r = R.barree;
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? "#f0ece0" : "#c8362b";
      g.beginPath();
      g.moveTo(r[0] + i * 64, r[1]);
      g.lineTo(r[0] + i * 64 + 64, r[1]);
      g.lineTo(r[0] + i * 64 + 32, r[1] + 40);
      g.lineTo(r[0] + i * 64 - 32, r[1] + 40);
      g.fill();
    }
    fond(g, [r[0], r[1] + 40, r[2], 88], "#f0ece0");
    ecrire(g, "ROUTE BARRÉE", r[0] + 256, r[1] + 86, 460, 56, "#c8362b");
    salir(g, a, r, 1.3);
  }
  {
    const r = R.deviation;
    fond(g, r, "#e3b830");
    cadre(g, r, "#1a1a1a", 6, 8);
    ecrire(g, "DÉVIATION", r[0] + 128, r[1] + 50, 220, 40, "#1a1a1a");
    ecrire(g, "→  →  →", r[0] + 128, r[1] + 92, 200, 30, "#1a1a1a");
    salir(g, a, r, 1.2);
  }
  {
    const r = R.pasParLa;
    planches(g, a, r, 130);
    peindre(g, a, "PAS PAR LÀ", r[0] + 128, r[1] + 52, 230, 40, "#efe6d2");
    peindre(g, a, "→ prenez l'est", r[0] + 128, r[1] + 96, 220, 22, "#e0c060");
    salir(g, a, r, 1.2);
  }

  // Le nom peint sur les silos
  {
    const r = R.coop;
    fond(g, r, "#c9c6bc");
    ecrire(g, "COOPÉRATIVE DU CARREFOUR", r[0] + 256, r[1] + 46, 480, 44, "#2f5f8a");
    ecrire(g, "Grains · Engrais · Semences", r[0] + 256, r[1] + 94, 440, 26, "#4a4a44", "normal");
    salir(g, a, r, 1.6);
  }

  // L'affiche de Watty de l'abribus
  {
    const r = R.wattyAffiche;
    const [x, y, l, h] = r;
    const d = g.createLinearGradient(x, y, x, y + h);
    d.addColorStop(0, "#f2e6b8");
    d.addColorStop(1, "#d9c27a");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
    watty(g, x + 128, y + 120, 70);
    ecrire(g, "Toujours plein,", x + 128, y + 208, 230, 24, "#2a2a22");
    ecrire(g, "jamais à plat !", x + 128, y + 236, 230, 24, "#b8433a");
    salir(g, a, r, 1.2);
    g.clearRect(x, y, 40, 60);
  }

  // Les horaires de car
  {
    const r = R.horaires;
    const [x, y, l, h] = r;
    fond(g, r, "#eceae2");
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, l, 44);
    ecrire(g, "LIGNE 12 · CAR DE CAMPAGNE", x + 128, y + 22, 236, 20, "#ffffff");
    ecrire(g, "Arrêt : Le Carrefour", x + 128, y + 66, 230, 18, "#2a2a22");
    for (let i = 0; i < 6; i++) {
      g.fillStyle = "#6a6a64";
      g.fillRect(x + 20, y + 92 + i * 22, 200 * (0.5 + a() * 0.5), 6);
    }
    ecrire(g, "Prochain passage :", x + 128, y + 228, 230, 18, "#2a2a22");
    peindre(g, a, "JAMAIS", x + 190, y + 202, 120, 26, "rgba(200,50,40,0.85)");
    salir(g, a, r, 1.2);
  }

  // Le gabarit du pont-cadre
  {
    const r = R.gabarit;
    fond(g, r, "#f0ece0");
    g.strokeStyle = "#c8362b";
    g.lineWidth = 12;
    g.beginPath();
    g.arc(r[0] + 64, r[1] + 64, 50, 0, 7);
    g.stroke();
    ecrire(g, "3,5 m", r[0] + 64, r[1] + 64, 70, 30, "#1a1a1a");
    ecrire(g, "HAUTEUR", r[0] + 190, r[1] + 46, 120, 24, "#1a1a1a");
    ecrire(g, "LIMITÉE", r[0] + 190, r[1] + 80, 120, 24, "#1a1a1a");
    salir(g, a, r, 1.2);
  }

  // Le graffiti des survivants sous le pont
  {
    const r = R.feuAmis;
    peindre(g, a, "FEU = AMIS", r[0] + 128, r[1] + 44, 236, 44, "rgba(235,200,80,0.92)");
    peindre(g, a, "on partage, on ne prend pas", r[0] + 128, r[1] + 96, 236, 20, "rgba(235,235,225,0.85)");
  }

  // Le tampon des Compteurs sur la maison murée
  {
    const r = R.inventorie;
    tampon(g, a, r[0] + 128, r[1] + 64, 230, 104, ["INVENTORIÉ", "— VIDE —", "Les Compteurs"], "rgba(40,70,140,0.82)", -0.08);
  }

  // « Œufs frais · lait cru »
  {
    const r = R.oeufs;
    planches(g, a, r, 150);
    peindre(g, a, "ŒUFS FRAIS", r[0] + 128, r[1] + 42, 230, 34, "#f4f0e4");
    peindre(g, a, "lait cru · miel", r[0] + 128, r[1] + 90, 220, 24, "#f4f0e4");
    salir(g, a, r, 1);
  }

  // Les ex-voto de la chapelle
  {
    const r = R.exVoto;
    fond(g, r, "#d8d0bc");
    for (let i = 0; i < 6; i++) {
      const px = r[0] + 10 + (i % 3) * 82;
      const py = r[1] + 8 + Math.floor(i / 3) * 60;
      g.fillStyle = "#ece6d4";
      g.fillRect(px, py, 72, 52);
      g.strokeStyle = "#8a7a5a";
      g.lineWidth = 2;
      g.strokeRect(px, py, 72, 52);
      ecrire(g, ["MERCI", "Reconnaissance", "Protégez-nous", "1952", "Merci à N.-D.", "Grâce obtenue"][i], px + 36, py + 26, 64, 13, "#3a3226", "italic", "Georgia, serif");
    }
    salir(g, a, r, 1);
  }

  // Les présentoirs de sachets de graines
  {
    const r = R.graines;
    fond(g, r, "#e8e0c8");
    const tons = ["#d8402a", "#e0a020", "#6aa84a", "#8a4aa0", "#3a7ac0", "#c06a2a"];
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 3; j++) {
        g.fillStyle = tons[(i + j * 3) % tons.length];
        g.fillRect(r[0] + 6 + i * 31, r[1] + 6 + j * 40, 26, 34);
        g.fillStyle = "rgba(255,255,255,0.7)";
        g.fillRect(r[0] + 8 + i * 31, r[1] + 30 + j * 40, 22, 6);
      }
    salir(g, a, r, 1);
  }

  // Le panneau de la voie rapide (vert, sur le parapet du pont-cadre)
  {
    const r = R.voieRapide;
    fond(g, r, "#2f6a46");
    cadre(g, r, "#eef2ea", 5, 8);
    ecrire(g, "N 412  ·  VOIE RAPIDE", r[0] + 256, r[1] + 44, 460, 40, "#ffffff");
    ecrire(g, "Fermée · circulation interrompue", r[0] + 256, r[1] + 92, 460, 24, "#d8e8d8", "normal");
    salir(g, a, r, 1.3);
  }

  // Le panneau de l'aire de covoiturage
  {
    const r = R.covoitPanneau;
    fond(g, r, "#2f6f73");
    cadre(g, r, "#eef2ea", 5, 8);
    ecrire(g, "AIRE DE COVOITURAGE AUTONOME", r[0] + 256, r[1] + 46, 470, 34, "#ffffff");
    ecrire(g, "Partagez votre trajet avec une IA", r[0] + 256, r[1] + 90, 460, 24, "#cfe8e8", "italic");
    salir(g, a, r, 1.3);
  }
}

function taches(g, a, x, y, l, h, couleur = "rgba(120,80,50,0.25)", n = 4) {
  for (let i = 0; i < n; i++) {
    const cx = x + a() * l;
    const cy = y + a() * h;
    const rr = 4 + a() * 14;
    const d = g.createRadialGradient(cx, cy, 0, cx, cy, rr);
    d.addColorStop(0, couleur);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
  }
}

/** La texture de l'enrobé (tuile de 9 m) : grain, faïençage, rapiéçages. */
export function dessinerAsphalte(g) {
  const a = aleatoire(77);
  g.fillStyle = "#c4c1ba";
  g.fillRect(0, 0, 256, 256);
  grainZone(g, a, 0, 0, 256, 256, 9000, 0.09);
  for (let i = 0; i < 3; i++) {
    g.fillStyle = "rgba(40,38,34,0.12)";
    g.fillRect(a() * 220, a() * 220, 20 + a() * 40, 14 + a() * 30);
  }
  g.strokeStyle = "rgba(30,28,24,0.45)";
  g.lineWidth = 1.2;
  for (let i = 0; i < 9; i++) {
    let x = a() * 256;
    let y = a() * 256;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 7; k++) {
      x += (a() - 0.5) * 30;
      y += (a() - 0.5) * 30;
      g.lineTo(x, y);
    }
    g.stroke();
  }
}

/** Tuiles mécaniques (tuile de 2 m) : rangs ondulés, tuiles plus sombres ou moussues. */
export function dessinerTuiles(g) {
  const a = aleatoire(31);
  g.fillStyle = "#cfc4b8";
  g.fillRect(0, 0, 128, 128);
  for (let r = 0; r < 8; r++) {
    for (let i = 0; i < 8; i++) {
      const v = 205 + Math.floor((a() - 0.5) * 40);
      g.fillStyle = `rgb(${v},${v - 8},${v - 14})`;
      g.fillRect(i * 16 + 1, r * 16 + 1, 14, 13);
      g.fillStyle = "rgba(0,0,0,0.18)";
      g.fillRect(i * 16 + 1, r * 16 + 12, 14, 3);
      g.fillStyle = "rgba(255,255,255,0.12)";
      g.fillRect(i * 16 + 6, r * 16 + 1, 3, 11);
    }
  }
  for (let i = 0; i < 6; i++) {
    const cx = a() * 128;
    const cy = a() * 128;
    const rr = 6 + a() * 12;
    const d = g.createRadialGradient(cx, cy, 0, cx, cy, rr);
    d.addColorStop(0, "rgba(90,110,60,0.4)");
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
  }
}

/** Béton lisse (tuile de 4 m), sans planches de coffrage : coulures, taches, joints de reprise. */
export function dessinerBeton(g) {
  const a = aleatoire(57);
  g.fillStyle = "#e4e2dc";
  g.fillRect(0, 0, 256, 256);
  grainZone(g, a, 0, 0, 256, 256, 5000, 0.05);
  for (let i = 0; i < 10; i++) {
    const cx = a() * 256;
    const cy = a() * 256;
    const rr = 10 + a() * 40;
    const d = g.createRadialGradient(cx, cy, 0, cx, cy, rr);
    d.addColorStop(0, "rgba(70,66,58,0.14)");
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
  }
  for (let i = 0; i < 26; i++) {
    const x = a() * 256;
    const lg = 40 + a() * 140;
    const d = g.createLinearGradient(0, 0, 0, lg);
    d.addColorStop(0, "rgba(50,46,40,0.22)");
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(x, 0, 1 + a() * 4, lg);
  }
  g.fillStyle = "rgba(0,0,0,0.12)";
  g.fillRect(0, 127, 256, 2);
}
