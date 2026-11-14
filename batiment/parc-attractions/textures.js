// Wattyland : l'atlas des enseignes, affiches, décors peints et écaillures (une seule texture, une seule matière).

import { dessiner, aleatoire, taches } from "../commun/atelier.js";

export const AL = 1024;
export const AH = 2048;

/** Les régions de l'atlas : [x, y, l, h] en pixels. */
export const ATLAS = {
  wattyland: [0, 0, 1024, 128],
  sourires: [0, 128, 512, 256],
  affiche: [512, 128, 256, 384],
  ecran: [768, 128, 256, 256],
  coupeFile: [0, 384, 512, 128],
  secours: [768, 384, 256, 128],
  tir: [0, 512, 512, 128],
  peche: [512, 512, 512, 128],
  cibles: [0, 640, 512, 192],
  fantome: [512, 640, 512, 384],
  valance: [0, 832, 512, 64],
  tamponneuses: [0, 896, 512, 128],
  boutique: [0, 1024, 512, 128],
  billetterie: [512, 1024, 512, 128],
  courtCircuit: [0, 1152, 512, 128],
  riviere: [512, 1152, 512, 128],
  barbe: [0, 1280, 256, 128],
  atelier: [256, 1280, 256, 128],
  graffiti: [512, 1280, 512, 128],
  ecaille: [0, 1408, 256, 256],
  grille: [256, 1408, 256, 256],
  frise: [512, 1408, 512, 128],
  plan: [512, 1536, 256, 256],
  wattyX: [768, 1536, 256, 256],
  coulures: [0, 1664, 256, 256],
  decor: [256, 1664, 512, 256],
  sortie: [768, 1792, 256, 128],
  souriez: [768, 1920, 256, 128],
  cremeRaye: [0, 1920, 256, 128],
};

const POLICE = '"Arial Black", "Helvetica Neue", Impact, sans-serif';
const RONDE = '"Trebuchet MS", "Helvetica Neue", Arial, sans-serif';
const FEUTRE = '"Marker Felt", "Chalkboard SE", "Comic Sans MS", cursive';

function texte(g, t, x, y, largeurMax, taille, couleur, police = POLICE, poids = "900", rotation = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(rotation);
  g.font = `${poids} ${taille}px ${police}`;
  const w = g.measureText(t).width;
  if (w > largeurMax) g.font = `${poids} ${(taille * largeurMax) / w}px ${police}`;
  g.fillStyle = couleur;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(t, 0, 0);
  g.restore();
}

function contour(g, t, x, y, largeurMax, taille, couleur, trait, ep, police = POLICE) {
  g.save();
  g.font = `900 ${taille}px ${police}`;
  const w = g.measureText(t).width;
  if (w > largeurMax) g.font = `900 ${(taille * largeurMax) / w}px ${police}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineJoin = "round";
  g.lineWidth = ep;
  g.strokeStyle = trait;
  g.strokeText(t, x, y);
  g.fillStyle = couleur;
  g.fillText(t, x, y);
  g.restore();
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

/** Grain, taches et coulures de rouille dans une région. */
function salir(g, a, [x, y, l, h], force = 1) {
  g.save();
  g.beginPath();
  g.rect(x, y, l, h);
  g.clip();
  for (let i = 0; i < (l * h) / 200; i++) {
    g.fillStyle = a() < 0.5 ? `rgba(0,0,0,${0.05 * force})` : `rgba(255,250,235,${0.06 * force})`;
    g.fillRect(x + a() * l, y + a() * h, 1 + a() * 3, 1 + a() * 3);
  }
  for (let i = 0; i < 7 * force; i++) {
    const cx = x + a() * l;
    const cy = y + a() * h * 0.4;
    const lg = h * (0.3 + a() * 0.7);
    const d = g.createLinearGradient(0, cy, 0, cy + lg);
    d.addColorStop(0, `rgba(120,70,40,${0.3 * force})`);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(cx, cy, 2 + a() * 5, lg);
  }
  g.translate(x, y);
  taches(g, a, Math.round(4 * force), `rgba(240,234,220,${0.25 * force})`, 10, 40, l, h);
  g.restore();
}

/** La peinture s'en va par plaques : on voit le support (transparent) derrière. */
function eroder(g, a, [x, y, w, h], n, rMin, rMax) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < n; i++) {
    const px = x + a() * w;
    const py = y + a() * h;
    g.beginPath();
    const r = rMin + a() * (rMax - rMin);
    for (let k = 0; k < 7; k++) {
      const an = (k / 7) * Math.PI * 2;
      const rr = r * (0.5 + a() * 0.7);
      if (k === 0) g.moveTo(px + Math.cos(an) * rr, py + Math.sin(an) * rr);
      else g.lineTo(px + Math.cos(an) * rr, py + Math.sin(an) * rr);
    }
    g.closePath();
    g.fill();
  }
  g.restore();
}

/** Watty, la pile souriante. `yeux` : « clin » (le salut), « x » (version train fantôme), « ronds ». */
export function dessinerWatty(g, cx, cy, s, yeux = "clin") {
  const w = s * 0.56;
  const h = s;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const encre = "#1f2526";
  g.save();
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = encre;
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
  // Les bras levés : « Tout est inclus ! »
  for (const sx of [-1, 1]) {
    g.lineWidth = s * 0.06;
    g.beginPath();
    const bx = sx < 0 ? x + 2 : x + w - 2;
    g.moveTo(bx, y + h * 0.5);
    g.quadraticCurveTo(bx + sx * s * 0.2, y + h * 0.45, bx + sx * s * 0.22, y + h * 0.2);
    g.stroke();
    g.fillStyle = "#f2ead6";
    g.beginPath();
    g.arc(bx + sx * s * 0.22, y + h * 0.17, s * 0.065, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = s * 0.02;
    g.stroke();
  }
  rectArrondi(g, x, y, w, h, s * 0.1);
  g.fillStyle = yeux === "x" ? "#4f6a68" : "#2f6f73";
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
  g.fillStyle = "#c79a3b";
  g.fillRect(cx - w * 0.17, y - s * 0.08, w * 0.34, s * 0.09);
  g.lineWidth = s * 0.022;
  g.strokeRect(cx - w * 0.17, y - s * 0.08, w * 0.34, s * 0.09);
  texte(g, "+", cx, y + h * 0.1, w, s * 0.15, "#c8362b");
  const ey = y + h * 0.34;
  if (yeux === "x") {
    g.lineWidth = s * 0.03;
    for (const sx of [-1, 1]) {
      const ex = cx + sx * w * 0.2;
      const r = s * 0.05;
      g.beginPath();
      g.moveTo(ex - r, ey - r);
      g.lineTo(ex + r, ey + r);
      g.moveTo(ex + r, ey - r);
      g.lineTo(ex - r, ey + r);
      g.stroke();
    }
    g.lineWidth = s * 0.03;
    g.beginPath();
    g.moveTo(cx - w * 0.25, y + h * 0.5);
    for (let k = 1; k <= 6; k++) g.lineTo(cx - w * 0.25 + (k * w * 0.5) / 6, y + h * 0.5 + (k % 2 ? -s * 0.025 : s * 0.025));
    g.stroke();
  } else {
    for (const sx of yeux === "clin" ? [-1] : [-1, 1]) {
      g.fillStyle = "#f6f0e0";
      g.beginPath();
      g.ellipse(cx + sx * w * 0.2, ey, s * 0.06, s * 0.075, 0, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = s * 0.018;
      g.stroke();
      g.fillStyle = encre;
      g.beginPath();
      g.arc(cx + sx * w * 0.18, ey + s * 0.012, s * 0.03, 0, Math.PI * 2);
      g.fill();
    }
    if (yeux === "clin") {
      g.lineWidth = s * 0.03;
      g.beginPath();
      g.arc(cx + w * 0.2, ey + s * 0.03, s * 0.055, Math.PI * 1.1, Math.PI * 1.9);
      g.stroke();
    }
    g.lineWidth = s * 0.035;
    g.beginPath();
    g.arc(cx, y + h * 0.42, w * 0.27, Math.PI * 0.15, Math.PI * 0.85);
    g.stroke();
  }
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

/** Un bandeau d'enseigne : fond, filet, lettres à ombre portée, salissures. */
function enseigne(g, a, r, fond, titre, couleur, sous = null, couleurSous = "#2a2622", force = 1.2) {
  const [x, y, l, h] = r;
  g.fillStyle = fond;
  g.fillRect(x, y, l, h);
  g.strokeStyle = "rgba(40,30,20,0.55)";
  g.lineWidth = 5;
  g.strokeRect(x + 6, y + 6, l - 12, h - 12);
  const yt = sous ? y + h * 0.4 : y + h / 2;
  texte(g, titre, x + l / 2 + 3, yt + 4, l - 40, sous ? h * 0.46 : h * 0.6, "rgba(30,22,16,0.45)");
  texte(g, titre, x + l / 2, yt, l - 40, sous ? h * 0.46 : h * 0.6, couleur);
  if (sous) texte(g, sous, x + l / 2, y + h * 0.8, l - 50, h * 0.18, couleurSous, RONDE, "700");
  salir(g, a, r, force);
}

function dessinerAtlas(g) {
  const a = aleatoire(2031);
  g.clearRect(0, 0, AL, AH);

  // WATTYLAND : grandes lettres de fête foraine, ampoules dans les lettres, deux sont tombées (W·TTYLAND)
  {
    const r = ATLAS.wattyland;
    const [x, y, l, h] = r;
    g.fillStyle = "#e3d6b4";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, l, 14);
    g.fillRect(x, y + h - 14, l, 14);
    const lettres = "WATTYLAND";
    const pas = (l - 80) / lettres.length;
    for (let i = 0; i < lettres.length; i++) {
      const cx = x + 40 + pas * (i + 0.5);
      if (i === 1) {
        texte(g, "A", cx, y + h / 2, pas, 96, "rgba(80,60,40,0.12)");
        continue;
      }
      const coul = i % 2 ? "#c8362b" : "#c79a3b";
      contour(g, lettres[i], cx, y + h / 2 + 3, pas, 96, coul, "#3a2a20", 7);
      g.fillStyle = "rgba(255,240,200,0.8)";
      for (let k = 0; k < 4; k++) {
        g.beginPath();
        g.arc(cx + (a() - 0.5) * 34, y + 30 + a() * 66, 3.5, 0, 7);
        g.fill();
      }
    }
    texte(g, "100 % ÉLECTRIQUE", x + l - 120, y + h - 26, 200, 18, "#2f6f73", RONDE, "700");
    salir(g, a, r, 1.5);
  }
  // « Ici, même les sourires sont rechargeables ! »
  {
    const r = ATLAS.sourires;
    const [x, y, l, h] = r;
    const d = g.createLinearGradient(x, y, x, y + h);
    d.addColorStop(0, "#f1e2b8");
    d.addColorStop(1, "#e2b979");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, l, 20);
    dessinerWatty(g, x + 100, y + 128, 120, "clin");
    texte(g, "Ici, même les sourires", x + 330, y + 80, 330, 34, "#2f6f73");
    texte(g, "sont rechargeables !", x + 330, y + 124, 330, 40, "#c8362b");
    texte(g, "Recharge du sourire incluse dans le Pass Watty Illimité", x + 330, y + 176, 330, 14, "#3a3430", RONDE, "700");
    texte(g, "La Compagnie d'électricité — Toujours plein, jamais à plat !", x + 330, y + 210, 330, 12, "#3a3430", RONDE, "400");
    salir(g, a, r, 1.6);
    eroder(g, a, r, 8, 6, 22);
  }
  // L'affiche du Pass Watty Illimité (portrait)
  {
    const r = ATLAS.affiche;
    const [x, y, l, h] = r;
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#e9dfc6";
    g.fillRect(x + 10, y + 10, l - 20, h - 20);
    g.fillStyle = "#c79a3b";
    g.beginPath();
    g.arc(x + l / 2, y + 150, 92, 0, 7);
    g.fill();
    dessinerWatty(g, x + l / 2, y + 150, 120, "ronds");
    texte(g, "PASS WATTY", x + l / 2, y + 268, l - 30, 34, "#c8362b");
    texte(g, "ILLIMITÉ", x + l / 2, y + 302, l - 30, 30, "#2f6f73");
    texte(g, "Votre visage est votre billet", x + l / 2, y + 334, l - 30, 14, "#3a3430", RONDE, "700");
    texte(g, "prélèvement automatique à chaque sourire", x + l / 2, y + 356, l - 30, 10, "#3a3430", RONDE, "400");
    salir(g, a, r, 1.8);
    eroder(g, a, r, 10, 6, 24);
  }
  // L'écran de reconnaissance faciale (éteint, fêlé)
  {
    const r = ATLAS.ecran;
    const [x, y, l, h] = r;
    g.fillStyle = "#2b3133";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#18303a";
    g.fillRect(x + 16, y + 16, l - 32, h - 70);
    g.strokeStyle = "rgba(140,220,230,0.5)";
    g.lineWidth = 3;
    g.beginPath();
    g.ellipse(x + l / 2, y + 100, 50, 64, 0, 0, 7);
    g.stroke();
    for (const [u, v] of [[-36, -56], [36, -56], [-36, 76], [36, 76]]) {
      g.beginPath();
      g.moveTo(x + l / 2 + u, y + 100 + v * 0.9);
      g.lineTo(x + l / 2 + u + (u < 0 ? -12 : 12) * 0, y + 100 + v);
      g.stroke();
    }
    texte(g, "SOURIEZ", x + l / 2, y + 190, l - 40, 26, "rgba(160,230,235,0.7)");
    texte(g, "vous êtes débité", x + l / 2, y + 222, l - 40, 16, "#c9c3b2", RONDE, "700");
    g.strokeStyle = "rgba(230,230,230,0.6)";
    g.lineWidth = 1.5;
    for (let k = 0; k < 9; k++) {
      g.beginPath();
      g.moveTo(x + 170, y + 60);
      g.lineTo(x + 170 + (a() - 0.5) * 180, y + 60 + (a() - 0.3) * 160);
      g.stroke();
    }
    salir(g, a, r, 0.8);
  }
  // COUPE-FILE PREMIUM
  {
    const r = ATLAS.coupeFile;
    enseigne(g, a, r, "#2a2724", "COUPE-FILE PREMIUM", "#c79a3b", "Réservé aux titulaires du Pass Watty Illimité Or · attente estimée : 0 min", "#d9cfb6", 1);
  }
  // POSTE DE SECOURS
  {
    const r = ATLAS.secours;
    const [x, y, l, h] = r;
    g.fillStyle = "#e3dfd2";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#b8362c";
    g.fillRect(x + 22, y + 50, 64, 26);
    g.fillRect(x + 41, y + 31, 26, 64);
    texte(g, "POSTE DE", x + 168, y + 48, 140, 30, "#a8433a");
    texte(g, "SECOURS", x + 168, y + 84, 140, 30, "#a8433a");
    salir(g, a, r, 1.2);
  }
  enseigne(g, a, ATLAS.tir, "#c8362b", "TIR À LA CARABINE", "#f0e3be", "Gagnez un Watty géant ! · 3 plombs = 1 sourire", "#f0e3be");
  enseigne(g, a, ATLAS.peche, "#3d7fa0", "PÊCHE AUX CANARDS", "#f6d75a", "Chaque canard est gagnant !* · *abonnés Pass Watty", "#f0e3be");
  // Les cibles du stand de tir : canards, étoiles, petits Watty, bandes
  {
    const r = ATLAS.cibles;
    const [x, y, l, h] = r;
    g.fillStyle = "#2c3a40";
    g.fillRect(x, y, l, h);
    for (let row = 0; row < 3; row++) {
      g.fillStyle = row % 2 ? "#5b7f97" : "#a94a3c";
      g.fillRect(x, y + row * 64 + 54, l, 8);
      for (let k = 0; k < 7; k++) {
        const cx = x + 36 + k * 72 + (row % 2) * 30;
        const cy = y + row * 64 + 32;
        if (a() < 0.25) continue;
        if (row === 0) {
          g.fillStyle = "#e0c04a";
          g.beginPath();
          g.ellipse(cx, cy + 6, 22, 14, 0, 0, 7);
          g.arc(cx + 14, cy - 10, 10, 0, 7);
          g.fill();
          g.fillStyle = "#d07a2a";
          g.fillRect(cx + 22, cy - 12, 10, 5);
        } else if (row === 1) {
          g.fillStyle = "#e9dfc6";
          g.beginPath();
          for (let p = 0; p < 10; p++) {
            const an = -Math.PI / 2 + (p * Math.PI) / 5;
            const rr = p % 2 ? 9 : 22;
            g.lineTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr);
          }
          g.fill();
        } else {
          dessinerWatty(g, cx, cy, 40, "ronds");
        }
        g.fillStyle = "rgba(20,20,20,0.6)";
        for (let t = 0; t < 2; t++) {
          g.beginPath();
          g.arc(cx + (a() - 0.5) * 30, cy + (a() - 0.5) * 30, 2.5, 0, 7);
          g.fill();
        }
      }
    }
    salir(g, a, r, 1.4);
  }
  // Le train fantôme : façade peinte (château hanté, Watty fantôme, lettres qui dégoulinent de peinture verte)
  {
    const r = ATLAS.fantome;
    const [x, y, l, h] = r;
    const d = g.createLinearGradient(x, y, x, y + h);
    d.addColorStop(0, "#1f2338");
    d.addColorStop(1, "#4a3a5a");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
    g.fillStyle = "#e8e0c0";
    g.beginPath();
    g.arc(x + 420, y + 70, 42, 0, 7);
    g.fill();
    g.fillStyle = "#16141c";
    // Le château
    g.fillRect(x + 60, y + 170, 140, 214);
    g.fillRect(x + 40, y + 120, 50, 264);
    g.fillRect(x + 170, y + 100, 50, 284);
    for (const [tx, ty] of [[40, 120], [170, 100]]) {
      g.beginPath();
      g.moveTo(x + tx - 6, y + ty);
      g.lineTo(x + tx + 25, y + ty - 60);
      g.lineTo(x + tx + 56, y + ty);
      g.fill();
    }
    g.fillStyle = "#d8b84a";
    for (let k = 0; k < 7; k++) g.fillRect(x + 70 + (k % 3) * 40, y + 200 + Math.floor(k / 3) * 50, 14, 22);
    // Watty fantôme : drap blanc, borne + qui dépasse, yeux en croix
    g.fillStyle = "#ece6d6";
    g.beginPath();
    g.moveTo(x + 300, y + 330);
    g.quadraticCurveTo(x + 290, y + 150, x + 360, y + 140);
    g.quadraticCurveTo(x + 430, y + 150, x + 420, y + 330);
    for (let k = 0; k < 5; k++) g.lineTo(x + 420 - k * 24 - 12, y + (k % 2 ? 330 : 350));
    g.closePath();
    g.fill();
    g.fillStyle = "#c79a3b";
    g.fillRect(x + 345, y + 124, 30, 18);
    g.strokeStyle = "#1f2526";
    g.lineWidth = 6;
    for (const ex of [335, 385]) {
      g.beginPath();
      g.moveTo(x + ex - 10, y + 200);
      g.lineTo(x + ex + 10, y + 220);
      g.moveTo(x + ex + 10, y + 200);
      g.lineTo(x + ex - 10, y + 220);
      g.stroke();
    }
    g.beginPath();
    g.ellipse(x + 360, y + 262, 18, 24, 0, 0, 7);
    g.fillStyle = "#1f2526";
    g.fill();
    // Le titre, qui coule
    contour(g, "TRAIN FANTÔME", x + l / 2, y + 40, l - 40, 58, "#8fd14f", "#1a1a1a", 8);
    g.fillStyle = "#8fd14f";
    for (let k = 0; k < 16; k++) g.fillRect(x + 40 + a() * (l - 80), y + 58, 4, 10 + a() * 40);
    texte(g, "Frissons 100 % électriques — déconseillé aux non-abonnés", x + l / 2, y + 372, l - 40, 15, "#e9dfc6", RONDE, "700");
    salir(g, a, r, 1.6);
    eroder(g, a, r, 12, 8, 30);
  }
  // La frange festonnée du carrousel : festons crème et rouges, perles d'ampoules
  {
    const [x, y, l, h] = ATLAS.valance;
    for (let k = 0; k < 8; k++) {
      const cx = x + k * 64 + 32;
      g.fillStyle = k % 2 ? "#b4473a" : "#e5d7b3";
      g.beginPath();
      g.moveTo(cx - 32, y);
      g.lineTo(cx + 32, y);
      g.lineTo(cx + 32, y + 26);
      g.quadraticCurveTo(cx, y + 76, cx - 32, y + 26);
      g.closePath();
      g.fill();
      g.strokeStyle = "#c79a3b";
      g.lineWidth = 4;
      g.stroke();
      g.fillStyle = "#f3e7c4";
      g.beginPath();
      g.arc(cx, y + 18, 6, 0, 7);
      g.fill();
    }
    salir(g, a, ATLAS.valance, 1.2);
  }
  enseigne(g, a, ATLAS.tamponneuses, "#d2b450", "AUTOS TAMPONNEUSES", "#b4362b", "100 % électriques · recharge par sourire", "#2a2622");
  enseigne(g, a, ATLAS.boutique, "#2f6f73", "BOUTIQUE WATTY", "#e9dfc6", "Souvenirs rechargeables · peluches officielles", "#e9c27a");
  enseigne(g, a, ATLAS.billetterie, "#e9dfc6", "BILLETTERIE", "#2f6f73", "Pass Watty Illimité · reconnaissance faciale · pas d'espèces", "#a94a3c");
  enseigne(g, a, ATLAS.courtCircuit, "#1e2a3a", "LE COURT-CIRCUIT", "#f2c94c", "Les montagnes russes les plus chargées du pays !", "#e9dfc6");
  enseigne(g, a, ATLAS.riviere, "#4f7a48", "LES BÛCHES DE WATTY", "#f0e3be", "Vous serez rechargé… et mouillé !", "#f0e3be");
  {
    const r = ATLAS.barbe;
    const [x, y, l, h] = r;
    g.fillStyle = "#e7b3c0";
    g.fillRect(x, y, l, h);
    texte(g, "BARBE", x + l / 2, y + 36, l - 20, 36, "#8a2d4a");
    texte(g, "À PAPA", x + l / 2, y + 74, l - 20, 36, "#8a2d4a");
    texte(g, "saveur Watt-Fraise", x + l / 2, y + 108, l - 20, 15, "#4a2a30", RONDE, "700");
    salir(g, a, r, 1.4);
  }
  {
    const r = ATLAS.atelier;
    const [x, y, l, h] = r;
    g.fillStyle = "#d8b84a";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#24221f";
    for (let k = -h; k < l; k += 36) {
      g.beginPath();
      g.moveTo(x + k, y + h);
      g.lineTo(x + k + 18, y + h);
      g.lineTo(x + k + 18 + 20, y + h - 20);
      g.lineTo(x + k + 20, y + h - 20);
      g.fill();
    }
    texte(g, "ATELIER", x + l / 2, y + 38, l - 20, 40, "#24221f");
    texte(g, "ACCÈS RÉSERVÉ", x + l / 2, y + 78, l - 20, 20, "#24221f");
    salir(g, a, r, 1.3);
  }
  // Les graffitis des survivants
  {
    const r = ATLAS.graffiti;
    const [x, y, l, h] = r;
    texte(g, "LE MANÈGE EST À NOUS", x + 170, y + 40, 320, 34, "rgba(232,232,226,0.9)", FEUTRE, "700", -0.04);
    texte(g, "PAS LE TRAIN →", x + 380, y + 96, 240, 34, "rgba(200,60,50,0.85)", FEUTRE, "700", 0.05);
    g.strokeStyle = "rgba(232,232,226,0.8)";
    g.lineWidth = 4;
    for (let k = 0; k < 5; k++) {
      g.beginPath();
      g.moveTo(x + 30 + k * 16, y + 80);
      g.lineTo(x + 30 + k * 16, y + 118);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(x + 24, y + 112);
    g.lineTo(x + 104, y + 86);
    g.stroke();
  }
  // Écaillures : plaques d'apprêt gris et de rouille, pour délaver les mascottes
  {
    const r = ATLAS.ecaille;
    const [x, y, l, h] = r;
    for (let i = 0; i < 26; i++) {
      const px = x + 20 + a() * (l - 40);
      const py = y + 20 + a() * (h - 40);
      const rr = 6 + a() * 22;
      g.fillStyle = a() < 0.65 ? `rgba(196,192,180,${0.75 + a() * 0.25})` : `rgba(150,82,46,${0.6 + a() * 0.3})`;
      g.beginPath();
      for (let k = 0; k < 9; k++) {
        const an = (k / 9) * Math.PI * 2;
        const q = rr * (0.4 + a() * 0.8);
        g.lineTo(px + Math.cos(an) * q * 1.4, py + Math.sin(an) * q);
      }
      g.closePath();
      g.fill();
    }
  }
  // La grille de clôture : barreaux à pointes, deux traverses (transparente entre les barreaux)
  {
    const [x, y, l, h] = ATLAS.grille;
    g.fillStyle = "#3e4644";
    for (let k = 0; k < 10; k++) {
      const bx = x + 8 + k * 25.6;
      g.fillRect(bx, y + 18, 6, h - 18);
      g.beginPath();
      g.moveTo(bx - 4, y + 22);
      g.lineTo(bx + 3, y + 2);
      g.lineTo(bx + 10, y + 22);
      g.fill();
    }
    g.fillRect(x, y + 40, l, 9);
    g.fillRect(x, y + h - 30, l, 9);
    g.fillStyle = "#c79a3b";
    for (let k = 0; k < 9; k++) {
      g.beginPath();
      g.arc(x + 24 + k * 25.6, y + 44, 6, 0, 7);
      g.fill();
    }
    g.fillStyle = "rgba(150,82,46,0.6)";
    for (let i = 0; i < 40; i++) g.fillRect(x + a() * l, y + 40 + a() * (h - 40), 3, 6 + a() * 14);
  }
  // La frise peinte du carrousel : médaillons, miroirs ovales, paysages
  {
    const r = ATLAS.frise;
    const [x, y, l, h] = r;
    g.fillStyle = "#e3d2a8";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#b8963e";
    g.fillRect(x, y, l, 12);
    g.fillRect(x, y + h - 12, l, 12);
    for (let k = 0; k < 4; k++) {
      const cx = x + 64 + k * 128;
      if (k % 2) {
        g.fillStyle = "#8a9aa0";
        g.beginPath();
        g.ellipse(cx, y + h / 2, 30, 40, 0, 0, 7);
        g.fill();
        g.fillStyle = "rgba(255,255,255,0.35)";
        g.fillRect(cx - 14, y + 40, 6, 40);
        g.strokeStyle = "#b8963e";
        g.lineWidth = 6;
        g.stroke();
      } else {
        g.fillStyle = "#6f9cb0";
        g.fillRect(cx - 52, y + 22, 104, 84);
        g.fillStyle = "#7d9a55";
        g.beginPath();
        g.moveTo(cx - 52, y + 106);
        g.quadraticCurveTo(cx - 10, y + 60, cx + 52, y + 90);
        g.lineTo(cx + 52, y + 106);
        g.fill();
        dessinerWatty(g, cx + 14, y + 62, 40, "clin");
        g.strokeStyle = "#b8963e";
        g.lineWidth = 6;
        g.strokeRect(cx - 52, y + 22, 104, 84);
      }
    }
    salir(g, a, r, 1.6);
    eroder(g, a, r, 9, 5, 16);
  }
  // Le plan du parc
  {
    const r = ATLAS.plan;
    const [x, y, l, h] = r;
    g.fillStyle = "#e3d6b4";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#86a660";
    g.fillRect(x + 12, y + 40, l - 24, h - 52);
    texte(g, "PLAN DU PARC", x + l / 2, y + 22, l - 20, 22, "#2f6f73");
    g.strokeStyle = "#e9dfc6";
    g.lineWidth = 9;
    g.beginPath();
    g.moveTo(x + 80, y + 240);
    g.lineTo(x + 80, y + 140);
    g.lineTo(x + 240, y + 140);
    g.stroke();
    g.strokeStyle = "#a94a3c";
    g.lineWidth = 3;
    g.beginPath();
    g.arc(x + 50, y + 80, 28, 0, 7);
    g.stroke();
    g.beginPath();
    g.moveTo(x + 120, y + 120);
    g.bezierCurveTo(x + 150, y + 50, x + 200, y + 50, x + 236, y + 100);
    g.stroke();
    g.fillStyle = "#c8362b";
    g.beginPath();
    g.arc(x + 80, y + 230, 7, 0, 7);
    g.fill();
    texte(g, "VOUS ÊTES ICI", x + 150, y + 232, 110, 12, "#2a2622", RONDE, "700");
    salir(g, a, r, 1.5);
  }
  // Le visage des wagonnets du train fantôme
  {
    const [x, y, l, h] = ATLAS.wattyX;
    dessinerWatty(g, x + l / 2, y + h / 2 - 10, 170, "x");
  }
  // Coulures de rouille (transparentes)
  {
    const [x, y, l, h] = ATLAS.coulures;
    for (let i = 0; i < 24; i++) {
      const cx = x + a() * l;
      const lg = h * (0.3 + a() * 0.7);
      const d = g.createLinearGradient(0, y, 0, y + lg);
      d.addColorStop(0, "rgba(130,64,32,0.75)");
      d.addColorStop(1, "rgba(130,64,32,0)");
      g.fillStyle = d;
      g.fillRect(cx, y, 2 + a() * 8, lg);
    }
  }
  // Les décors peints de l'intérieur du train fantôme : fantômes, chauves-souris, toiles
  {
    const r = ATLAS.decor;
    const [x, y, l, h] = r;
    g.fillStyle = "#2a2433";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "rgba(220,220,210,0.6)";
    g.lineWidth = 2;
    for (let k = 0; k < 8; k++) {
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos((k / 16) * Math.PI) * 140, y + Math.sin((k / 16) * Math.PI) * 140);
      g.stroke();
    }
    for (let ring = 1; ring < 5; ring++) {
      g.beginPath();
      g.arc(x, y, ring * 30, 0, Math.PI / 2);
      g.stroke();
    }
    for (let k = 0; k < 3; k++) {
      const cx = x + 170 + k * 120;
      const cy = y + 120 + (k % 2) * 30;
      g.fillStyle = "rgba(230,226,212,0.9)";
      g.beginPath();
      g.arc(cx, cy, 34, Math.PI, 0);
      g.lineTo(cx + 34, cy + 70);
      for (let q = 0; q < 4; q++) g.lineTo(cx + 34 - (q + 1) * 17, cy + (q % 2 ? 70 : 56));
      g.closePath();
      g.fill();
      g.fillStyle = "#1f1c24";
      g.beginPath();
      g.ellipse(cx - 12, cy - 4, 6, 9, 0, 0, 7);
      g.ellipse(cx + 12, cy - 4, 6, 9, 0, 0, 7);
      g.ellipse(cx, cy + 22, 9, 12, 0, 0, 7);
      g.fill();
    }
    g.fillStyle = "#121016";
    for (let k = 0; k < 5; k++) {
      const bx = x + 60 + a() * (l - 120);
      const by = y + 30 + a() * 60;
      g.beginPath();
      g.moveTo(bx, by);
      g.quadraticCurveTo(bx - 14, by - 14, bx - 26, by - 2);
      g.quadraticCurveTo(bx - 16, by + 2, bx, by + 8);
      g.quadraticCurveTo(bx + 16, by + 2, bx + 26, by - 2);
      g.quadraticCurveTo(bx + 14, by - 14, bx, by);
      g.fill();
    }
    salir(g, a, r, 1.2);
  }
  // SORTIE (rouge, train fantôme)
  {
    const r = ATLAS.sortie;
    const [x, y, l, h] = r;
    g.fillStyle = "#7a1f1a";
    g.fillRect(x, y, l, h);
    texte(g, "SORTIE", x + l / 2, y + h / 2, l - 30, 60, "#ffd9cc");
  }
  // Le petit écran du Watty animatronique / des bornes : « Souriez ! »
  {
    const r = ATLAS.souriez;
    const [x, y, l, h] = r;
    g.fillStyle = "#1b2a2c";
    g.fillRect(x, y, l, h);
    texte(g, "BONJOUR ! BON-BON-BONJOUR !", x + l / 2, y + 40, l - 20, 18, "#9fe0d0", RONDE, "700");
    texte(g, "Pass expiré depuis 3 412 jours", x + l / 2, y + 80, l - 20, 15, "#e9c27a", RONDE, "700");
    salir(g, a, r, 0.6);
  }
  // Toile rayée crème et rouge (auvents)
  {
    const r = ATLAS.cremeRaye;
    const [x, y, l, h] = r;
    for (let k = 0; k < 8; k++) {
      g.fillStyle = k % 2 ? "#b4473a" : "#e5d7b3";
      g.fillRect(x + k * 32, y, 32, h);
    }
    salir(g, a, r, 1.6);
  }
}

export function texAtlas() {
  return dessiner("wattyland-atlas", AL, AH, dessinerAtlas, false);
}
