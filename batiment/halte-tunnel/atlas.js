// L'atlas des panneaux de la halte du tunnel : une seule texture (1024 × 1024) pour toutes les enseignes, plaques,
// affiches et graffitis, donc un seul appel de dessin. Chaque région est [x, y, largeur, hauteur] en pixels.

import { dessiner, aleatoire } from "../commun/atelier.js";

export const ATLAS = {
  nom: [0, 0, 512, 96],
  intelligent: [512, 0, 512, 192],
  sourire: [0, 96, 256, 256],
  sortie: [256, 96, 256, 96],
  sos: [256, 192, 128, 160],
  extincteur: [384, 192, 128, 160],
  abri: [512, 192, 256, 128],
  distance: [768, 192, 256, 64],
  allumez: [768, 256, 256, 96],
  peage: [0, 352, 768, 80],
  hauteur: [768, 352, 128, 128],
  chaines: [896, 352, 128, 128],
  aire: [0, 432, 384, 96],
  grafLumiere: [384, 480, 640, 96],
  grafAbri: [0, 528, 384, 96],
  grafPorte: [384, 576, 640, 64],
  pillards: [0, 624, 384, 128],
  dirOuest: [384, 640, 384, 112],
  dirEst: [0, 752, 384, 112],
  chalet: [384, 752, 384, 96],
  ecrans: [768, 640, 256, 160],
  watty: [0, 880, 256, 144],
  traits: [256, 880, 256, 144],
  feuVert: [512, 880, 128, 72],
  feuRouge: [640, 880, 128, 72],
  pc: [512, 952, 256, 72],
  menu: [768, 800, 256, 224],
};

const POLICE = '"Avenir Next Condensed", "Arial Narrow", "Helvetica Neue", Arial, sans-serif';
const BOMBE = '"Marker Felt", "Comic Sans MS", "Chalkboard SE", cursive';

function texte(g, t, x, y, largeurMax, taille, couleur, poids = "800", police = POLICE, align = "center") {
  g.font = `${poids} ${taille}px ${police}`;
  g.textAlign = align;
  g.textBaseline = "middle";
  g.fillStyle = couleur;
  const l = g.measureText(t).width;
  if (l > largeurMax) {
    g.save();
    g.translate(x, y);
    g.scale(largeurMax / l, 1);
    g.fillText(t, 0, 0);
    g.restore();
  } else g.fillText(t, x, y);
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

/** Le temps qui passe sur une région : grain, taches, écaillures (on gratte la peinture). */
function user(g, a, [x, y, w, h], force = 1) {
  for (let i = 0; i < 260 * force * (w * h) / 40000; i++) {
    g.fillStyle = a() < 0.5 ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.06)";
    g.fillRect(x + a() * w, y + a() * h, 1 + a() * 3, 1 + a() * 3);
  }
  for (let i = 0; i < 6 * force; i++) {
    const cx = x + a() * w;
    const cy = y + a() * h;
    const r = 6 + a() * 22;
    const d = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    d.addColorStop(0, "rgba(60,50,35,0.28)");
    d.addColorStop(1, "rgba(60,50,35,0)");
    g.fillStyle = d;
    g.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  // Coulures depuis le haut
  for (let i = 0; i < 8 * force; i++) {
    const cx = x + a() * w;
    const lg = h * (0.2 + a() * 0.6);
    const d = g.createLinearGradient(0, y, 0, y + lg);
    d.addColorStop(0, "rgba(50,42,30,0.25)");
    d.addColorStop(1, "rgba(50,42,30,0)");
    g.fillStyle = d;
    g.fillRect(cx, y, 1 + a() * 3, lg);
  }
}

/** Un bonhomme qui court (pictogramme de sortie de secours). */
function coureur(g, x, y, s, couleur) {
  g.save();
  g.strokeStyle = couleur;
  g.fillStyle = couleur;
  g.lineWidth = s * 0.13;
  g.lineCap = "round";
  g.beginPath();
  g.arc(x + s * 0.12, y - s * 0.42, s * 0.11, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(x + s * 0.05, y - s * 0.26);
  g.lineTo(x - s * 0.08, y + s * 0.05);
  g.moveTo(x - s * 0.08, y + s * 0.05);
  g.lineTo(x + s * 0.18, y + s * 0.22);
  g.lineTo(x + s * 0.12, y + s * 0.45);
  g.moveTo(x - s * 0.08, y + s * 0.05);
  g.lineTo(x - s * 0.22, y + s * 0.3);
  g.lineTo(x - s * 0.38, y + s * 0.32);
  g.moveTo(x + s * 0.03, y - s * 0.2);
  g.lineTo(x + s * 0.28, y - s * 0.08);
  g.moveTo(x + s * 0.03, y - s * 0.2);
  g.lineTo(x - s * 0.22, y - s * 0.12);
  g.stroke();
  g.restore();
}

function fleche(g, x, y, l, e, couleur, sens = 1) {
  g.save();
  g.fillStyle = couleur;
  g.translate(x, y);
  g.scale(sens, 1);
  g.beginPath();
  g.moveTo(-l / 2, -e * 0.3);
  g.lineTo(l / 2 - e, -e * 0.3);
  g.lineTo(l / 2 - e, -e);
  g.lineTo(l / 2, 0);
  g.lineTo(l / 2 - e, e);
  g.lineTo(l / 2 - e, e * 0.3);
  g.lineTo(-l / 2, e * 0.3);
  g.closePath();
  g.fill();
  g.restore();
}

/** Un visage (le smiley du péage, la jauge d'humeur). `humeur` : 1 content, 0 neutre, −1 triste. */
function visage(g, x, y, r, fond, encre, humeur = 1) {
  g.save();
  g.fillStyle = fond;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = encre;
  g.fillStyle = encre;
  g.lineWidth = r * 0.12;
  g.lineCap = "round";
  for (const s of [-1, 1]) {
    g.beginPath();
    g.arc(x + s * r * 0.35, y - r * 0.25, r * 0.11, 0, Math.PI * 2);
    g.fill();
  }
  g.beginPath();
  if (humeur > 0) g.arc(x, y + r * 0.05, r * 0.5, Math.PI * 0.18, Math.PI * 0.82);
  else if (humeur < 0) g.arc(x, y + r * 0.65, r * 0.45, Math.PI * 1.2, Math.PI * 1.8);
  else {
    g.moveTo(x - r * 0.4, y + r * 0.35);
    g.lineTo(x + r * 0.4, y + r * 0.35);
  }
  g.stroke();
  g.restore();
}

/** Watty, la pile souriante de la Compagnie (version simple, pour une affiche). */
function watty(g, cx, cy, s) {
  const w = s * 0.55;
  const h = s;
  g.save();
  g.lineWidth = s * 0.04;
  g.strokeStyle = "#1f2526";
  rectArrondi(g, cx - w / 2, cy - h / 2, w, h, s * 0.1);
  g.fillStyle = "#2f6f73";
  g.fill();
  g.stroke();
  g.fillStyle = "#e9dfc6";
  g.fillRect(cx - w / 2 + 3, cy - h / 2 + 3, w - 6, h * 0.18);
  g.fillStyle = "#c79a3b";
  g.fillRect(cx - w * 0.16, cy - h / 2 - s * 0.08, w * 0.32, s * 0.08);
  visage(g, cx, cy - h * 0.02, w * 0.36, "#e9dfc6", "#1f2526", 1);
  g.fillStyle = "#c8362b";
  g.beginPath();
  const bx = cx;
  const by = cy + h * 0.3;
  const e = s * 0.13;
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

/** Un trait de bombe de peinture : lettres un peu tremblées, avec des coulures. */
function bombe(g, a, t, x, y, largeurMax, taille, couleur) {
  g.save();
  g.shadowColor = couleur;
  g.shadowBlur = 3;
  texte(g, t, x, y, largeurMax, taille, couleur, "700", BOMBE);
  g.restore();
  g.fillStyle = couleur;
  for (let i = 0; i < 10; i++) {
    const px = x - largeurMax / 2 + a() * largeurMax;
    g.fillRect(px, y + taille * 0.3, 1.5, 6 + a() * taille * 0.7);
  }
}

export function texAtlas() {
  return dessiner("halte-tunnel-atlas", 1024, 1024, (g) => {
    const a = aleatoire(4417);
    g.clearRect(0, 0, 1024, 1024);
    let R;

    // Le nom du tunnel : lettres en relief crème sur une plaque de béton sombre
    R = ATLAS.nom;
    g.fillStyle = "#4b4f50";
    g.fillRect(R[0], R[1], R[2], R[3]);
    g.strokeStyle = "#2d3031";
    g.lineWidth = 4;
    g.strokeRect(R[0] + 4, R[1] + 4, R[2] - 8, R[3] - 8);
    texte(g, "TUNNEL DU MONT-CENDRE", R[0] + 256, R[1] + 40, 470, 44, "#e4dcc6", "800");
    texte(g, "longueur 104 m · hauteur 4,30 m", R[0] + 256, R[1] + 76, 400, 20, "#c9c1ab", "600");
    user(g, a, R, 1.2);

    // « Tunnel intelligent : éclairage adaptatif selon votre humeur » (l'Abondance)
    R = ATLAS.intelligent;
    g.fillStyle = "#2f6f73";
    g.fillRect(R[0], R[1], R[2], R[3]);
    g.fillStyle = "#e9dfc6";
    g.fillRect(R[0], R[1] + R[3] - 36, R[2], 36);
    texte(g, "TUNNEL INTELLIGENT", R[0] + 196, R[1] + 46, 340, 46, "#e9dfc6", "900");
    texte(g, "Éclairage adaptatif selon votre humeur", R[0] + 196, R[1] + 90, 350, 22, "#e9dfc6", "600");
    for (let i = 0; i < 3; i++) visage(g, R[0] + 100 + i * 96, R[1] + 128, 18, ["#c8362b", "#c79a3b", "#7fb56a"][i], "#1f2526", i - 1);
    texte(g, "Souriez : la lumière vous suit !  — La Compagnie", R[0] + 256, R[1] + R[3] - 18, 480, 18, "#2f6f73", "700");
    watty(g, R[0] + 440, R[1] + 82, 92);
    user(g, a, R, 1.6);
    // Un pan de l'affiche arraché
    g.fillStyle = "rgba(160,150,130,0.95)";
    g.beginPath();
    g.moveTo(R[0] + R[2] - 70, R[1]);
    g.lineTo(R[0] + R[2], R[1]);
    g.lineTo(R[0] + R[2], R[1] + 58);
    g.lineTo(R[0] + R[2] - 30, R[1] + 30);
    g.closePath();
    g.fill();

    // La borne « paiement par sourire » : un écran sombre, un smiley jaune
    R = ATLAS.sourire;
    g.fillStyle = "#1c2226";
    g.fillRect(R[0], R[1], R[2], R[3]);
    g.fillStyle = "#c79a3b";
    g.fillRect(R[0], R[1], R[2], 40);
    texte(g, "PÉAGE DU TUNNEL", R[0] + 128, R[1] + 21, 230, 24, "#1f2526", "900");
    visage(g, R[0] + 128, R[1] + 118, 56, "#e8c547", "#1f2526", 1);
    texte(g, "PAIEMENT PAR SOURIRE", R[0] + 128, R[1] + 198, 236, 22, "#e9dfc6", "800");
    texte(g, "Souriez, c'est débité !", R[0] + 128, R[1] + 228, 236, 18, "#9fc6c4", "600");
    // l'objectif de la caméra
    g.fillStyle = "#0c0f10";
    g.beginPath();
    g.arc(R[0] + 222, R[1] + 60, 9, 0, 7);
    g.fill();
    user(g, a, R, 1);

    // SORTIE DE SECOURS : vert, bonhomme qui court
    R = ATLAS.sortie;
    g.fillStyle = "#1f8a4c";
    g.fillRect(R[0], R[1], R[2], R[3]);
    g.fillStyle = "#e9f2ea";
    g.fillRect(R[0] + 8, R[1] + 10, 70, 76);
    coureur(g, R[0] + 45, R[1] + 52, 62, "#1f8a4c");
    texte(g, "SORTIE", R[0] + 168, R[1] + 33, 160, 30, "#ffffff", "900");
    texte(g, "DE SECOURS", R[0] + 168, R[1] + 66, 160, 26, "#ffffff", "800");

    // SOS : la borne d'appel d'urgence, version premium
    R = ATLAS.sos;
    g.fillStyle = "#d8782a";
    g.fillRect(R[0], R[1], R[2], R[3]);
    g.fillStyle = "#f4eee0";
    g.fillRect(R[0] + 8, R[1] + 8, R[2] - 16, 50);
    texte(g, "SOS", R[0] + 64, R[1] + 34, 110, 40, "#c8362b", "900");
    g.fillStyle = "#1f2526";
    rectArrondi(g, R[0] + 34, R[1] + 70, 60, 26, 10);
    g.fill();
    texte(g, "Appel d'urgence", R[0] + 64, R[1] + 112, 118, 15, "#1f2526", "700");
    texte(g, "PREMIUM", R[0] + 64, R[1] + 130, 118, 17, "#1f2526", "900");
    texte(g, "2,99 Wh / min", R[0] + 64, R[1] + 148, 118, 14, "#1f2526", "700");
    user(g, a, R, 1);

    // Extincteur
    R = ATLAS.extincteur;
    g.fillStyle = "#b33a2c";
    g.fillRect(R[0], R[1], R[2], R[3]);
    g.fillStyle = "#f4eee0";
    rectArrondi(g, R[0] + 46, R[1] + 40, 36, 80, 12);
    g.fill();
    g.fillRect(R[0] + 56, R[1] + 26, 16, 16);
    g.fillRect(R[0] + 70, R[1] + 28, 26, 7);
    texte(g, "EXTINCTEUR", R[0] + 64, R[1] + 140, 116, 17, "#f4eee0", "800");
    user(g, a, R, 0.8);

    // ABRI PRESSURISÉ
    R = ATLAS.abri;
    g.fillStyle = "#1f8a4c";
    g.fillRect(R[0], R[1], R[2], R[3]);
    g.fillStyle = "#f2f6f0";
    g.fillRect(R[0] + 6, R[1] + 6, R[2] - 12, 54);
    texte(g, "ABRI PRESSURISÉ", R[0] + 128, R[1] + 34, 236, 34, "#1f8a4c", "900");
    texte(g, "60 places · eau · ventilation", R[0] + 128, R[1] + 80, 236, 18, "#ffffff", "700");
    texte(g, "FERMEZ LES DEUX PORTES", R[0] + 128, R[1] + 106, 236, 18, "#ffffff", "900");
    user(g, a, R, 0.8);

    // Distance aux sorties
    R = ATLAS.distance;
    g.fillStyle = "#1f8a4c";
    g.fillRect(R[0], R[1], R[2], R[3]);
    fleche(g, R[0] + 28, R[1] + 32, 40, 13, "#fff", -1);
    texte(g, "SORTIE 25 m", R[0] + 92, R[1] + 32, 80, 18, "#fff", "800");
    g.fillStyle = "#fff";
    g.fillRect(R[0] + 136, R[1] + 8, 2, 48);
    texte(g, "SORTIE 75 m", R[0] + 186, R[1] + 32, 80, 18, "#fff", "800");
    fleche(g, R[0] + 238, R[1] + 32, 30, 11, "#fff", 1);

    // ALLUMEZ VOS FEUX (et la réponse à la bombe)
    R = ATLAS.allumez;
    g.fillStyle = "#2a5ea0";
    g.fillRect(R[0], R[1], R[2], R[3]);
    g.strokeStyle = "#f4f4f0";
    g.lineWidth = 4;
    g.strokeRect(R[0] + 6, R[1] + 6, R[2] - 12, R[3] - 12);
    texte(g, "ALLUMEZ", R[0] + 128, R[1] + 32, 220, 30, "#f4f4f0", "900");
    texte(g, "VOS FEUX", R[0] + 128, R[1] + 64, 220, 30, "#f4f4f0", "900");
    user(g, a, R, 1);
    g.save();
    g.translate(R[0] + 128, R[1] + 52);
    g.rotate(-0.16);
    bombe(g, a, "ÉTEIGNEZ TOUT !", 0, 0, 240, 34, "#d8342a");
    g.restore();

    // Le fronton du péage
    R = ATLAS.peage;
    g.fillStyle = "#e9dfc6";
    g.fillRect(R[0], R[1], R[2], R[3]);
    g.fillStyle = "#2f6f73";
    g.fillRect(R[0], R[1] + R[3] - 14, R[2], 14);
    texte(g, "PÉAGE DU TUNNEL", R[0] + 230, R[1] + 36, 400, 46, "#2f6f73", "900");
    texte(g, "paiement par sourire", R[0] + 560, R[1] + 30, 300, 30, "#c8362b", "800");
    visage(g, R[0] + 735, R[1] + 33, 22, "#e8c547", "#1f2526", 1);
    user(g, a, R, 1.4);

    // Hauteur limitée 4,3 m
    R = ATLAS.hauteur;
    g.fillStyle = "#f4f2ea";
    g.beginPath();
    g.arc(R[0] + 64, R[1] + 64, 60, 0, 7);
    g.fill();
    g.strokeStyle = "#c8362b";
    g.lineWidth = 14;
    g.beginPath();
    g.arc(R[0] + 64, R[1] + 64, 52, 0, 7);
    g.stroke();
    texte(g, "4,3 m", R[0] + 64, R[1] + 66, 70, 30, "#1f2526", "900");
    g.fillStyle = "#1f2526";
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(R[0] + 64 - 8, R[1] + 64 + s * 40);
      g.lineTo(R[0] + 64 + 8, R[1] + 64 + s * 40);
      g.lineTo(R[0] + 64, R[1] + 64 + s * 28);
      g.fill();
    }
    user(g, a, R, 0.6);

    // Chaînes obligatoires : rond bleu, pneu enchaîné
    R = ATLAS.chaines;
    g.fillStyle = "#2a5ea0";
    g.beginPath();
    g.arc(R[0] + 64, R[1] + 64, 60, 0, 7);
    g.fill();
    g.strokeStyle = "#f4f4f0";
    g.lineWidth = 12;
    g.beginPath();
    g.arc(R[0] + 64, R[1] + 64, 30, 0, 7);
    g.stroke();
    g.lineWidth = 4;
    for (let i = 0; i < 8; i++) {
      const an = (i / 8) * Math.PI * 2;
      g.beginPath();
      g.moveTo(R[0] + 64 + Math.cos(an) * 22, R[1] + 64 + Math.sin(an) * 22);
      g.lineTo(R[0] + 64 + Math.cos(an) * 40, R[1] + 64 + Math.sin(an) * 40);
      g.stroke();
    }
    user(g, a, R, 0.6);

    // Aire de chaînage
    R = ATLAS.aire;
    g.fillStyle = "#2a5ea0";
    g.fillRect(R[0], R[1], R[2], R[3]);
    g.strokeStyle = "#f4f4f0";
    g.lineWidth = 4;
    g.strokeRect(R[0] + 6, R[1] + 6, R[2] - 12, R[3] - 12);
    texte(g, "AIRE DE CHAÎNAGE", R[0] + 192, R[1] + 38, 340, 34, "#f4f4f0", "900");
    texte(g, "Location de chaînes connectées : appli Watty Neige", R[0] + 192, R[1] + 72, 340, 16, "#d8e2f0", "600");
    user(g, a, R, 1.2);

    // Graffitis des survivants (fond transparent)
    R = ATLAS.grafLumiere;
    bombe(g, a, "ILS VIENNENT À LA LUMIÈRE", R[0] + 320, R[1] + 46, 600, 52, "#e8e2d0");
    R = ATLAS.grafAbri;
    bombe(g, a, "ABRI  EAU", R[0] + 150, R[1] + 46, 250, 50, "#e8e2d0");
    fleche(g, R[0] + 330, R[1] + 46, 90, 22, "#e8e2d0", 1);
    R = ATLAS.grafPorte;
    bombe(g, a, "FERMEZ LA PORTE : LA LUMIÈRE LES ATTIRE", R[0] + 320, R[1] + 30, 610, 34, "#d8342a");

    // Le péage des pillards, peint à la main sur une planche
    R = ATLAS.pillards;
    g.fillStyle = "#7a5a3c";
    g.fillRect(R[0], R[1], R[2], R[3]);
    g.fillStyle = "rgba(0,0,0,0.25)";
    for (let y = 0; y < R[3]; y += 32) g.fillRect(R[0], R[1] + y, R[2], 2);
    bombe(g, a, "PÉAGE", R[0] + 192, R[1] + 36, 300, 44, "#c8362b");
    bombe(g, a, "1 SAC OU DEMI-TOUR", R[0] + 192, R[1] + 92, 360, 34, "#e8e2d0");
    user(g, a, R, 1);

    // Panneaux de direction (blanc, lettres noires, en flèche)
    const direction = (R, lignes, sens) => {
      g.fillStyle = "#f2f0e8";
      g.beginPath();
      if (sens < 0) {
        g.moveTo(R[0] + 4, R[1] + R[3] / 2);
        g.lineTo(R[0] + 50, R[1] + 4);
        g.lineTo(R[0] + R[2] - 4, R[1] + 4);
        g.lineTo(R[0] + R[2] - 4, R[1] + R[3] - 4);
        g.lineTo(R[0] + 50, R[1] + R[3] - 4);
      } else {
        g.moveTo(R[0] + R[2] - 4, R[1] + R[3] / 2);
        g.lineTo(R[0] + R[2] - 50, R[1] + 4);
        g.lineTo(R[0] + 4, R[1] + 4);
        g.lineTo(R[0] + 4, R[1] + R[3] - 4);
        g.lineTo(R[0] + R[2] - 50, R[1] + R[3] - 4);
      }
      g.closePath();
      g.fill();
      g.strokeStyle = "#1f2526";
      g.lineWidth = 3;
      g.stroke();
      lignes.forEach(([t, taille], i) => texte(g, t, R[0] + R[2] / 2 + (sens < 0 ? 18 : -18), R[1] + 34 + i * 42, R[2] - 90, taille, "#1f2526", "800"));
      user(g, a, R, 0.9);
    };
    direction(ATLAS.dirOuest, [["Le Col", 34], ["Hameau des Charbonniers", 24]], -1);
    direction(ATLAS.dirEst, [["Grand Comptoir", 32], ["du Barrage · 4 km", 28]], 1);

    // Le relais des Marmottes (chalet de l'est)
    R = ATLAS.chalet;
    g.fillStyle = "#6a4a30";
    g.fillRect(R[0], R[1], R[2], R[3]);
    g.fillStyle = "rgba(0,0,0,0.2)";
    for (let y = 0; y < R[3]; y += 24) g.fillRect(R[0], R[1] + y, R[2], 2);
    texte(g, "RELAIS DES MARMOTTES", R[0] + 192, R[1] + 36, 350, 32, "#efe2c0", "900", 'Georgia, "Times New Roman", serif');
    texte(g, "Raclette connectée · Wi-Fi d'altitude", R[0] + 192, R[1] + 72, 340, 18, "#e0c890", "600", 'Georgia, "Times New Roman", serif');
    user(g, a, R, 1);

    // Les écrans du PC de sécurité : cinq morts, un qui affiche encore l'humeur du tunnel
    R = ATLAS.ecrans;
    g.fillStyle = "#24282a";
    g.fillRect(R[0], R[1], R[2], R[3]);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
      const x = R[0] + 6 + i * 83;
      const y = R[1] + 6 + j * 77;
      g.fillStyle = "#0e1214";
      g.fillRect(x, y, 78, 71);
      if (i === 1 && j === 0) {
        g.fillStyle = "#13303a";
        g.fillRect(x, y, 78, 71);
        texte(g, "HUMEUR", x + 39, y + 12, 70, 12, "#9fd6e0", "800");
        visage(g, x + 39, y + 38, 15, "#9fd6e0", "#13303a", -1);
        texte(g, "ÉCLAIRAGE COUPÉ", x + 39, y + 62, 72, 9, "#e07a6a", "800");
      } else if (a() < 0.5) {
        g.strokeStyle = "rgba(200,210,215,0.25)";
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(x + a() * 78, y);
        g.lineTo(x + a() * 78, y + 71);
        g.stroke();
      }
    }

    // L'affiche de Watty
    R = ATLAS.watty;
    g.fillStyle = "#e9dfc6";
    g.fillRect(R[0], R[1], R[2], R[3]);
    watty(g, R[0] + 52, R[1] + 74, 96);
    texte(g, "Bonne traversée !", R[0] + 170, R[1] + 46, 150, 22, "#2f6f73", "900");
    texte(g, "Toujours plein,", R[0] + 170, R[1] + 80, 150, 17, "#c8362b", "800");
    texte(g, "jamais à plat !", R[0] + 170, R[1] + 102, 150, 17, "#c8362b", "800");
    user(g, a, R, 1.5);

    // Les jours comptés au mur de l'abri
    R = ATLAS.traits;
    g.strokeStyle = "#e8e2d0";
    g.lineWidth = 4;
    g.lineCap = "round";
    for (let k = 0; k < 9; k++) {
      const x0 = R[0] + 14 + (k % 5) * 48;
      const y0 = R[1] + 14 + Math.floor(k / 5) * 64;
      if (k === 8) continue;
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.moveTo(x0 + i * 9, y0);
        g.lineTo(x0 + i * 9 + a() * 3, y0 + 46);
        g.stroke();
      }
      g.beginPath();
      g.moveTo(x0 - 4, y0 + 36);
      g.lineTo(x0 + 34, y0 + 8);
      g.stroke();
    }
    texte(g, "J 41", R[0] + 220, R[1] + 112, 60, 22, "#e8e2d0", "700", BOMBE);

    // Feux d'affectation de voie
    R = ATLAS.feuVert;
    g.fillStyle = "#101314";
    g.fillRect(R[0], R[1], R[2], R[3]);
    g.save();
    g.translate(R[0] + 64, R[1] + 36);
    g.rotate(Math.PI / 2);
    fleche(g, 0, 0, 52, 20, "#3fbf6a", 1);
    g.restore();
    R = ATLAS.feuRouge;
    g.fillStyle = "#101314";
    g.fillRect(R[0], R[1], R[2], R[3]);
    g.strokeStyle = "#d8342a";
    g.lineWidth = 9;
    g.beginPath();
    g.moveTo(R[0] + 44, R[1] + 14);
    g.lineTo(R[0] + 84, R[1] + 58);
    g.moveTo(R[0] + 84, R[1] + 14);
    g.lineTo(R[0] + 44, R[1] + 58);
    g.stroke();

    // Plaque du PC
    R = ATLAS.pc;
    g.fillStyle = "#e9e6dc";
    g.fillRect(R[0], R[1], R[2], R[3]);
    g.fillStyle = "#c8362b";
    g.fillRect(R[0], R[1], 18, R[3]);
    texte(g, "PC SÉCURITÉ TUNNEL", R[0] + 136, R[1] + 26, 220, 24, "#1f2526", "900");
    texte(g, "accès réservé · badge connecté", R[0] + 136, R[1] + 52, 220, 14, "#555", "600");
    user(g, a, R, 1);

    // L'ardoise du chalet
    R = ATLAS.menu;
    g.fillStyle = "#5a4130";
    g.fillRect(R[0], R[1], R[2], R[3]);
    g.fillStyle = "#23292a";
    g.fillRect(R[0] + 10, R[1] + 10, R[2] - 20, R[3] - 20);
    const craie = "#e8e6dc";
    texte(g, "AUJOURD'HUI", R[0] + 128, R[1] + 34, 220, 22, craie, "700", BOMBE);
    texte(g, "Fondue par abonnement", R[0] + 128, R[1] + 74, 220, 17, craie, "600", BOMBE);
    texte(g, "9,99 Wh / mois", R[0] + 128, R[1] + 98, 220, 16, "#e0c890", "600", BOMBE);
    texte(g, "Génépi premium", R[0] + 128, R[1] + 134, 220, 17, craie, "600", BOMBE);
    texte(g, "(fromage en option)", R[0] + 128, R[1] + 158, 220, 14, "#c9c6bb", "600", BOMBE);
    texte(g, "FERMÉ", R[0] + 128, R[1] + 192, 200, 24, "#d8342a", "800", BOMBE);
  }, false);
}
