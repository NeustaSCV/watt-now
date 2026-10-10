// Les textures dessinées au canvas de la halte du gué : l'atlas des enseignes et affiches (une seule texture pour tout
// le lieu), l'eau qui court, l'écume, les planches, le sol de la vallée et les galets.

import { aleatoire, taches } from "../commun/atelier.js";

export const AL = 1024;
export const AH = 1024;

/** Les régions de l'atlas : [x, y, largeur, hauteur] en pixels. */
export const R = {
  pont: [0, 0, 512, 256],
  bac: [512, 0, 256, 256],
  kayak: [768, 0, 256, 128],
  crue: [768, 128, 256, 128],
  lulu: [0, 256, 512, 128],
  ardoise: [512, 256, 256, 128],
  echelle: [768, 256, 64, 256],
  stationMorte: [832, 256, 192, 128],
  baignade: [832, 384, 192, 128],
  dirOuest: [0, 384, 512, 96],
  dirEst: [0, 480, 512, 96],
  gue: [512, 384, 320, 96],
  relais: [512, 480, 256, 160],
  lavoir: [768, 512, 256, 64],
  huilerie: [768, 576, 256, 64],
  liberte: [0, 576, 512, 64],
  registre: [512, 640, 256, 128],
  watty: [0, 640, 256, 256],
  bal: [256, 640, 256, 256],
  colis: [768, 640, 256, 128],
  garde: [512, 768, 256, 96],
  deviation: [768, 768, 256, 128],
  menu: [512, 864, 256, 160],
  tarifs: [768, 896, 256, 128],
  plaqueBac: [0, 896, 256, 128],
  qr: [256, 896, 128, 128],
  carte: [384, 896, 128, 128],
};

const FONTE = "'Avenir Next Condensed', 'Futura', 'Helvetica Neue', sans-serif";
const PEINTE = "'Georgia', 'Times New Roman', serif";

// Pour le gué retourné (miroir), les flèches changent de sens : ce qui était à droite est à gauche.
let INVERSER = false;
const inverserFleches = (t) => (INVERSER ? t.replace(/[←→]/g, (f) => (f === "←" ? "→" : "←")) : t);

function texte(g, t, x, y, taille, couleur, { police = "bold", fonte = FONTE, align = "center", max } = {}) {
  t = inverserFleches(t);
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

function rouille(g, a, l, h, n = 6) {
  for (let i = 0; i < n; i++) {
    const x = a() * l;
    const lg = 10 + a() * h * 0.6;
    const d = g.createLinearGradient(0, 0, 0, lg);
    d.addColorStop(0, "rgba(140, 70, 30, 0.45)");
    d.addColorStop(1, "rgba(140, 70, 30, 0)");
    g.fillStyle = d;
    g.fillRect(x, a() * h * 0.3, 2 + a() * 4, lg);
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

function cadre(g, l, h, couleur, ep = 6, m = 6) {
  g.strokeStyle = couleur;
  g.lineWidth = ep;
  g.strokeRect(m, m, l - 2 * m, h - 2 * m);
}

/** Un drone de livraison vu de face, qui porte une poutre de pont sous son ventre. */
function drone(g, x, y, s, couleur = "#2f6f73") {
  g.fillStyle = couleur;
  g.fillRect(x - s * 0.35, y - s * 0.1, s * 0.7, s * 0.2);
  g.fillStyle = "#e9dfc6";
  for (const dx of [-0.55, 0.55]) {
    g.fillRect(x + dx * s - s * 0.22, y - s * 0.2, s * 0.44, s * 0.05);
    g.fillRect(x + dx * s - s * 0.02, y - s * 0.17, s * 0.04, s * 0.17);
  }
  g.fillStyle = couleur;
  g.fillRect(x - s * 0.6, y - s * 0.03, s * 1.2, s * 0.06);
  g.strokeStyle = "#e9dfc6";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(x - s * 0.2, y + s * 0.1);
  g.lineTo(x - s * 0.35, y + s * 0.38);
  g.moveTo(x + s * 0.2, y + s * 0.1);
  g.lineTo(x + s * 0.35, y + s * 0.38);
  g.stroke();
  g.fillStyle = "#c79a3b";
  g.fillRect(x - s * 0.55, y + s * 0.38, s * 1.1, s * 0.12);
  g.fillStyle = "#8a5a22";
  for (let i = 0; i < 5; i++) g.fillRect(x - s * 0.5 + i * s * 0.24, y + s * 0.4, s * 0.04, s * 0.08);
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

function poisson(g, x, y, s, couleur) {
  g.fillStyle = couleur;
  g.beginPath();
  g.ellipse(x, y, s, s * 0.38, 0, 0, 7);
  g.fill();
  g.beginPath();
  g.moveTo(x + s * 0.85, y);
  g.lineTo(x + s * 1.45, y - s * 0.4);
  g.lineTo(x + s * 1.45, y + s * 0.4);
  g.closePath();
  g.fill();
  g.fillStyle = "#1d1b18";
  g.beginPath();
  g.arc(x - s * 0.6, y - s * 0.06, s * 0.08, 0, 7);
  g.fill();
}

function qr(g, a, x, y, s, n = 11, couleur = "#1d2326") {
  const p = s / n;
  g.fillStyle = couleur;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const coin = (i < 3 && j < 3) || (i > n - 4 && j < 3) || (i < 3 && j > n - 4);
    if (coin ? !(i % (n - 3) === 1 && j % (n - 3) === 1) || true : a() < 0.5) g.fillRect(x + i * p, y + j * p, p, p);
  }
  g.fillStyle = "#e8e6df";
  for (const [ci, cj] of [[0, 0], [n - 3, 0], [0, n - 3]]) g.fillRect(x + (ci + 1) * p, y + (cj + 1) * p, p, p);
}

export function dessinerAtlas(g) {
  const a = aleatoire(2203);
  g.fillStyle = "#777";
  g.fillRect(0, 0, AL, AH);

  // Le grand panneau de chantier : « Pont en reconstruction — livraison prévue par drone »
  region(g, R.pont, (l, h) => {
    g.fillStyle = "#e9e3d2";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#c8362b";
    g.fillRect(0, 0, l, 54);
    texte(g, "PONT EN RECONSTRUCTION", l / 2, 28, 38, "#f4eee0", { max: l - 30 });
    drone(g, 96, 120, 110);
    texte(g, "Livraison prévue", 330, 92, 34, "#2b2b29", { max: 330 });
    texte(g, "par drone", 330, 130, 40, "#2f6f73", { max: 330 });
    texte(g, "Délai estimé : 3 jours ouvrés", 330, 168, 20, "#2b2b29", { police: "", max: 330 });
    g.fillStyle = "#2f6f73";
    g.fillRect(0, h - 46, l, 46);
    texte(g, "Merci de votre patience ! — Mobilité du Val, l'Abondance en mouvement", l / 2, h - 23, 17, "#e9dfc6", { police: "", max: l - 20 });
    // Rayures de chantier, coulures, un « 3 jours » corrigé au marqueur
    g.strokeStyle = "rgba(30,30,30,0.75)";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(208, 166);
    g.lineTo(300, 172);
    g.stroke();
    texte(g, "ha ha", 470, 206, 22, "rgba(40,40,40,0.8)", { police: "italic bold", fonte: PEINTE });
    salir(g, a, l, h, 14, 0.25);
    rouille(g, a, l, h, 8);
  });

  // La borne « Bac connecté » : l'écran (il luit encore, faiblement)
  region(g, R.bac, (l, h) => {
    const d = g.createLinearGradient(0, 0, 0, h);
    d.addColorStop(0, "#1c4d55");
    d.addColorStop(1, "#0f2a30");
    g.fillStyle = d;
    g.fillRect(0, 0, l, h);
    texte(g, "BAC CONNECTÉ", l / 2, 30, 30, "#bff3ea", { max: l - 20 });
    texte(g, "Réservez votre traversée", l / 2, 62, 19, "#e9dfc6", { police: "", max: l - 16 });
    qr(g, a, 78, 84, 100, 13, "#bff3ea");
    texte(g, "Prochain départ : — —", l / 2, 206, 18, "#f2c14a", { max: l - 16 });
    texte(g, "Abonnés Premium : coupe-file", l / 2, 232, 15, "#9fd0c8", { police: "", max: l - 16 });
    g.fillStyle = "rgba(0,0,0,0.35)";
    for (let y = 0; y < h; y += 4) g.fillRect(0, y, l, 1);
    g.strokeStyle = "rgba(220,240,240,0.5)";
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(180, 0);
    g.lineTo(150, 70);
    g.lineTo(200, 120);
    g.lineTo(170, 256);
    g.stroke();
  });

  // Kayak+ : le logo de la station en libre-service
  region(g, R.kayak, (l, h) => {
    g.fillStyle = "#f0e9d8";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#e07a2e";
    g.beginPath();
    g.ellipse(70, 64, 56, 16, -0.25, 0, 7);
    g.fill();
    g.strokeStyle = "#2b2b29";
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(30, 96);
    g.lineTo(112, 30);
    g.stroke();
    texte(g, "KAYAK", 176, 48, 40, "#2f6f73");
    texte(g, "+", 236, 40, 52, "#e07a2e");
    texte(g, "libre-service · déverrouillez", 180, 92, 15, "#2b2b29", { police: "", max: 150 });
    texte(g, "avec l'appli", 180, 110, 15, "#2b2b29", { police: "", max: 150 });
    salir(g, a, l, h, 6, 0.2);
  });

  // Passage submersible
  region(g, R.crue, (l, h) => {
    g.fillStyle = "#e9e3d2";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#c8362b";
    g.beginPath();
    g.moveTo(64, 14);
    g.lineTo(120, 112);
    g.lineTo(8, 112);
    g.closePath();
    g.fill();
    g.fillStyle = "#f4eee0";
    g.beginPath();
    g.moveTo(64, 34);
    g.lineTo(104, 103);
    g.lineTo(24, 103);
    g.closePath();
    g.fill();
    g.strokeStyle = "#2f5f8a";
    g.lineWidth = 4;
    for (const y of [78, 90]) {
      g.beginPath();
      for (let x = 34; x <= 94; x += 2) g.lineTo(x, y + Math.sin(x * 0.35) * 3);
      g.stroke();
    }
    texte(g, "PASSAGE", 190, 40, 26, "#2b2b29");
    texte(g, "SUBMERSIBLE", 190, 70, 22, "#2b2b29", { max: 124 });
    texte(g, "ne pas s'engager", 190, 98, 15, "#2b2b29", { police: "", max: 124 });
    texte(g, "en cas de crue", 190, 114, 15, "#2b2b29", { police: "", max: 124 });
    salir(g, a, l, h, 8, 0.22);
    rouille(g, a, l, h, 5);
  });

  // L'enseigne peinte « Chez Lulu — Friture »
  region(g, R.lulu, (l, h) => {
    g.fillStyle = "#3f6a5c";
    g.fillRect(0, 0, l, h);
    for (let y = 0; y < h; y += 21) {
      g.fillStyle = `rgba(0,0,0,${0.08 + a() * 0.1})`;
      g.fillRect(0, y, l, 2);
    }
    cadre(g, l, h, "#e9d9a8", 5, 8);
    texte(g, "Chez Lulu", l / 2 - 40, 52, 62, "#f2e6c4", { police: "italic bold", fonte: PEINTE });
    texte(g, "— FRITURE · GUINGUETTE · BAL —", l / 2, 104, 22, "#e8b04a", { max: l - 40 });
    poisson(g, 430, 52, 30, "#e8b04a");
    // La peinture s'écaille
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(150, 120, 90, ${0.4 + a() * 0.4})`;
      g.fillRect(a() * l, a() * h, 3 + a() * 14, 2 + a() * 6);
    }
    salir(g, a, l, h, 10, 0.25);
  });

  // L'ardoise de la buvette
  region(g, R.ardoise, (l, h) => {
    g.fillStyle = "#26302c";
    g.fillRect(0, 0, l, h);
    cadre(g, l, h, "#8a6a44", 8, 4);
    const craie = "rgba(240, 236, 220, 0.88)";
    texte(g, "Friture de la rivière", l / 2, 26, 22, craie, { police: "italic", fonte: PEINTE, max: l - 24 });
    texte(g, "Goujons · Ablettes · Frites", l / 2, 54, 16, craie, { police: "", max: l - 24 });
    texte(g, "BAL MUSETTE LE SAMEDI", l / 2, 80, 17, "rgba(240, 200, 120, 0.9)", { max: l - 24 });
    texte(g, "Paiement sans contact uniquement", l / 2, 106, 14, craie, { police: "italic", max: l - 24 });
    salir(g, a, l, h, 6, 0.3);
  });

  // L'échelle de crue (graduée de 0 à 3 m)
  region(g, R.echelle, (l, h) => {
    g.fillStyle = "#efeadd";
    g.fillRect(0, 0, l, h);
    for (let i = 0; i < 30; i++) {
      const y = h - (i + 1) * (h / 30);
      g.fillStyle = "#1d1d1d";
      g.fillRect(0, y, i % 5 === 0 ? l * 0.7 : l * 0.35, 2);
      if (i % 10 === 0 && i > 0) texte(g, String(i / 10), l * 0.8, y + 2, 16, "#c8362b");
    }
    texte(g, "3", l * 0.8, 10, 16, "#c8362b");
    salir(g, a, l, h, 6, 0.3);
  });

  // L'écran mort de la station Kayak+
  region(g, R.stationMorte, (l, h) => {
    g.fillStyle = "#15191a";
    g.fillRect(0, 0, l, h);
    texte(g, "STATION HORS LIGNE", l / 2, 40, 18, "rgba(150,160,160,0.5)", { max: l - 20 });
    texte(g, "Mettez à jour l'appli Kayak+", l / 2, 70, 13, "rgba(150,160,160,0.4)", { police: "", max: l - 20 });
    g.strokeStyle = "rgba(200,210,210,0.45)";
    g.lineWidth = 1;
    for (let i = 0; i < 9; i++) {
      g.beginPath();
      g.moveTo(120, 90);
      g.lineTo(120 + Math.cos(i * 0.7) * 90, 90 + Math.sin(i * 0.7) * 60);
      g.stroke();
    }
  });

  // Baignade interdite
  region(g, R.baignade, (l, h) => {
    g.fillStyle = "#e9e3d2";
    g.fillRect(0, 0, l, h);
    g.strokeStyle = "#c8362b";
    g.lineWidth = 9;
    g.beginPath();
    g.arc(52, 64, 38, 0, 7);
    g.moveTo(25, 37);
    g.lineTo(79, 91);
    g.stroke();
    g.fillStyle = "#2f5f8a";
    g.fillRect(28, 70, 48, 6);
    texte(g, "BAIGNADE", 140, 46, 22, "#2b2b29");
    texte(g, "INTERDITE", 140, 72, 22, "#c8362b");
    texte(g, "courant dangereux", 140, 96, 13, "#2b2b29", { police: "" });
    salir(g, a, l, h, 6, 0.22);
    rouille(g, a, l, h, 4);
  });

  // Les panneaux de direction aux deux bouts de la halte
  const direction = (r, ligne1, ligne2) =>
    region(g, r, (l, h) => {
      g.fillStyle = "#f1ece0";
      g.fillRect(0, 0, l, h);
      cadre(g, l, h, "#2b2b29", 4, 5);
      texte(g, ligne1, l / 2, 34, 30, "#2b2b29", { max: l - 30 });
      texte(g, ligne2, l / 2, 70, 21, "#2b2b29", { police: "", max: l - 30 });
      salir(g, a, l, h, 7, 0.2);
      rouille(g, a, l, h, 4);
    });
  direction(R.dirOuest, "← Ton terrain · La Campagne", "Le Gué · bac et passage submersible · 3 km");
  direction(R.dirEst, "Le Moulin du Gué · 2 km →", "← Le Gué · Ton terrain");

  // Le panneau d'entrée du lieu-dit
  region(g, R.gue, (l, h) => {
    g.fillStyle = "#f1ece0";
    g.fillRect(0, 0, l, h);
    g.strokeStyle = "#c8362b";
    g.lineWidth = 7;
    g.strokeRect(6, 6, l - 12, h - 12);
    texte(g, "LE GUÉ-AUX-SAULES", l / 2, 38, 34, "#2b2b29", { max: l - 40 });
    texte(g, "son bac · sa guinguette · son lavoir", l / 2, 70, 17, "#2b2b29", { police: "italic", max: l - 40 });
    salir(g, a, l, h, 6, 0.2);
  });

  // L'écran du casier « Point Relais Drone » (il luit encore)
  region(g, R.relais, (l, h) => {
    g.fillStyle = "#14303a";
    g.fillRect(0, 0, l, h);
    texte(g, "POINT RELAIS DRONE", l / 2, 24, 20, "#9fe0ff", { max: l - 16 });
    drone(g, 54, 82, 60, "#9fe0ff");
    texte(g, "Votre pont", 168, 64, 22, "#f4eee0", { max: 150 });
    texte(g, "est en route !", 168, 92, 22, "#f4eee0", { max: 150 });
    texte(g, "Livraison estimée : 3 jours", l / 2, 132, 15, "#f2c14a", { police: "", max: l - 16 });
    g.fillStyle = "rgba(0,0,0,0.3)";
    for (let y = 0; y < h; y += 3) g.fillRect(0, y, l, 1);
  });

  // Les plaques : lavoir, huilerie, garde-pêche
  const plaque = (r, t, fond, encre, police = PEINTE) =>
    region(g, r, (l, h) => {
      g.fillStyle = fond;
      g.fillRect(0, 0, l, h);
      cadre(g, l, h, encre, 3, 5);
      texte(g, t, l / 2, h / 2 + 2, Math.min(30, h * 0.5), encre, { fonte: police, max: l - 24 });
      salir(g, a, l, h, 8, 0.28);
    });
  plaque(R.lavoir, "LAVOIR COMMUNAL · 1887", "#d8ccb0", "#4a4036");
  plaque(R.huilerie, "HUILERIE DU GUÉ", "#cdbb98", "#6a4a32");
  region(g, R.garde, (l, h) => {
    g.fillStyle = "#3d5a46";
    g.fillRect(0, 0, l, h);
    cadre(g, l, h, "#e9dfc6", 3, 5);
    texte(g, "GARDE-PÊCHE", l / 2, 32, 26, "#e9dfc6");
    texte(g, "permis obligatoire · appli PêchePass", l / 2, 64, 15, "#e9dfc6", { police: "", max: l - 20 });
    salir(g, a, l, h, 6, 0.25);
  });

  // La frise du camping-car
  region(g, R.liberte, (l, h) => {
    g.fillStyle = "#ece6d6";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#c79a3b";
    g.fillRect(0, 8, l, 8);
    g.fillStyle = "#2f6f73";
    g.fillRect(0, 20, l, 5);
    texte(g, "Liberté Totale", 330, 44, 30, "#2f6f73", { police: "italic bold", fonte: PEINTE });
    texte(g, "720", 80, 44, 26, "#8a8f90");
    salir(g, a, l, h, 10, 0.25);
  });

  // Le registre du passeur, ouvert : les passages comptés en wotts
  region(g, R.registre, (l, h) => {
    g.fillStyle = "#e8dfc8";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.fillRect(l / 2 - 1, 0, 2, h);
    g.strokeStyle = "rgba(60, 80, 120, 0.35)";
    g.lineWidth = 1;
    for (let y = 18; y < h; y += 11) {
      g.beginPath();
      g.moveTo(6, y);
      g.lineTo(l - 6, y);
      g.stroke();
    }
    texte(g, "PASSAGES", 64, 10, 11, "#3a3026");
    texte(g, "2 wotts / pers.", 192, 10, 11, "#3a3026", { police: "" });
    const encre = "rgba(40, 32, 26, 0.85)";
    for (let i = 0; i < 9; i++) {
      texte(g, ["3 + chèvre", "Voltaïque", "2 (troc sel)", "famille ×4", "le marchand", "seul, blessé", "1 — paie demain", "Compteur", "?"][i], 8, 24 + i * 11, 10, encre, { police: "italic", fonte: PEINTE, align: "left" });
      texte(g, ["6", "2", "sel", "8", "10", "0", "—", "2", ""][i], 110, 24 + i * 11, 10, encre, { police: "", align: "left" });
    }
    for (let i = 0; i < 6; i++) texte(g, ["crue le 12", "radier glissant", "câble à graisser", "ils dérivent", "contre le radier", "ne plus passer la nuit"][i], 136, 30 + i * 13, 10, encre, { police: "italic", fonte: PEINTE, align: "left" });
  });

  // L'affiche Watty dans la buvette
  region(g, R.watty, (l, h) => {
    g.fillStyle = "#2f6f73";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#e9dfc6";
    g.fillRect(12, 12, l - 24, h - 24);
    watty(g, l / 2, 110, 120);
    texte(g, "Toujours plein,", l / 2, 196, 24, "#2f6f73");
    texte(g, "jamais à plat !", l / 2, 222, 24, "#c8362b");
    salir(g, a, l, h, 12, 0.3);
  });

  // L'affiche du grand bal
  region(g, R.bal, (l, h) => {
    g.fillStyle = "#e7d9b4";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#c8362b";
    g.fillRect(0, 0, l, 64);
    texte(g, "GRAND BAL", l / 2, 34, 40, "#f4eee0");
    texte(g, "au bord de l'eau", l / 2, 86, 22, "#2b2b29", { police: "italic", fonte: PEINTE });
    g.fillStyle = "#2f6f73";
    for (let i = 0; i < 9; i++) {
      g.beginPath();
      g.arc(28 + i * 25, 116 + Math.sin(i) * 6, 6, 0, 7);
      g.fill();
    }
    texte(g, "Orchestre", l / 2, 150, 22, "#2b2b29");
    texte(g, "LES FLOTS BLEUS", l / 2, 178, 26, "#2f6f73");
    texte(g, "Entrée : 1 abonnement Premium", l / 2, 214, 14, "#2b2b29", { police: "", max: l - 20 });
    texte(g, "samedi 21 h — lampions", l / 2, 236, 14, "#2b2b29", { police: "", max: l - 20 });
    salir(g, a, l, h, 14, 0.3);
  });

  // L'étiquette du colis tombé du drone
  region(g, R.colis, (l, h) => {
    g.fillStyle = "#c9a874";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#f1ece0";
    g.fillRect(16, 14, l - 32, h - 28);
    texte(g, "PIÈCE DE PONT", l / 2, 38, 24, "#2b2b29");
    texte(g, "n° 1 / 4 800", l / 2, 64, 20, "#c8362b");
    texte(g, "FRAGILE · ne pas immerger", l / 2, 90, 14, "#2b2b29", { police: "" });
    salir(g, a, l, h, 8, 0.3);
  });

  // La déviation qui ne mène nulle part
  region(g, R.deviation, (l, h) => {
    g.fillStyle = "#e8b04a";
    g.fillRect(0, 0, l, h);
    cadre(g, l, h, "#2b2b29", 5, 6);
    texte(g, "DÉVIATION", l / 2, 36, 34, "#2b2b29");
    texte(g, "suivre l'appli Itinéraire+", l / 2, 74, 18, "#2b2b29", { police: "" });
    texte(g, "→", l / 2, 104, 30, "#2b2b29");
    salir(g, a, l, h, 8, 0.25);
    rouille(g, a, l, h, 5);
  });

  // Le menu de la friterie (dans la buvette)
  region(g, R.menu, (l, h) => {
    g.fillStyle = "#f0e7cf";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#c8362b";
    g.fillRect(0, 0, l, 30);
    texte(g, "LA CARTE DE LULU", l / 2, 16, 18, "#f4eee0");
    const lignes = [["Friture du jour", "9,90"], ["Barquette de frites", "4,50"], ["Moules de rivière", "12,00"], ["Limonade", "3,00"], ["Formule Premium", "Abonnés"], ["Bal + friture", "16,00"]];
    lignes.forEach(([n, p], i) => {
      texte(g, n, 14, 46 + i * 19, 14, "#2b2b29", { police: "", align: "left" });
      texte(g, p, l - 14, 46 + i * 19, 14, "#2b2b29", { align: "right" });
    });
    salir(g, a, l, h, 10, 0.25);
  });

  // Les tarifs du bac (peints sur planche par le passeur, après la Panne)
  region(g, R.tarifs, (l, h) => {
    g.fillStyle = "#8a6a48";
    g.fillRect(0, 0, l, h);
    for (let y = 0; y < h; y += 32) {
      g.fillStyle = "rgba(0,0,0,0.18)";
      g.fillRect(0, y, l, 2);
    }
    const blanc = "rgba(240, 232, 214, 0.92)";
    texte(g, "BAC — 2 WOTTS", l / 2, 30, 28, blanc, { fonte: PEINTE });
    texte(g, "sonnez la cloche", l / 2, 64, 18, blanc, { police: "italic", fonte: PEINTE });
    texte(g, "PAS DE NUIT", l / 2, 98, 24, "rgba(220, 120, 90, 0.95)", { fonte: PEINTE });
    salir(g, a, l, h, 6, 0.25);
  });

  // La plaque officielle du bac (avant la Panne)
  region(g, R.plaqueBac, (l, h) => {
    g.fillStyle = "#2f5f8a";
    g.fillRect(0, 0, l, h);
    cadre(g, l, h, "#f1ece0", 4, 6);
    texte(g, "BAC À TRAILLE", l / 2, 34, 26, "#f1ece0");
    texte(g, "charge maxi : 12 personnes", l / 2, 66, 16, "#f1ece0", { police: "" });
    texte(g, "service suspendu (mise à jour)", l / 2, 94, 14, "#f2c14a", { police: "italic" });
    salir(g, a, l, h, 8, 0.25);
  });

  // Un petit carré de QR (autocollant collé partout)
  region(g, R.qr, (l, h) => {
    g.fillStyle = "#e8e6df";
    g.fillRect(0, 0, l, h);
    qr(g, a, 14, 14, 100, 13);
    salir(g, a, l, h, 4, 0.2);
  });

  // La carte de la rivière punaisée chez le passeur
  region(g, R.carte, (l, h) => {
    g.fillStyle = "#e3d8bb";
    g.fillRect(0, 0, l, h);
    g.strokeStyle = "#5c87a6";
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(60, 0);
    g.bezierCurveTo(30, 40, 90, 80, 56, 128);
    g.stroke();
    g.strokeStyle = "#c8362b";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(30, 52);
    g.lineTo(46, 68);
    g.moveTo(46, 52);
    g.lineTo(30, 68);
    g.stroke();
    texte(g, "pont", 26, 80, 12, "#c8362b", { police: "italic", fonte: PEINTE });
    texte(g, "gué", 96, 40, 13, "#2b2b29", { police: "italic", fonte: PEINTE });
    texte(g, "bac", 96, 20, 13, "#2b2b29", { police: "italic", fonte: PEINTE });
    salir(g, a, l, h, 6, 0.25);
  });
}

/** L'eau qui court : des filets étirés dans le sens du courant (v), raccordés en haut et en bas. */
export function dessinerEau(g) {
  const a = aleatoire(61);
  g.fillStyle = "#c6d2c8";
  g.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 170; i++) {
    const x = a() * 128;
    const y = a() * 256;
    const lg = 12 + a() * 50;
    g.fillStyle = a() < 0.55 ? `rgba(255,255,255,${0.16 + a() * 0.22})` : `rgba(20,40,30,${0.12 + a() * 0.14})`;
    const l = 1 + a() * 2.5;
    g.fillRect(x, y, l, lg);
    if (y + lg > 256) g.fillRect(x, y - 256, l, lg);
  }
  taches(g, a, 10, "rgba(255,255,255,0.12)", 10, 30, 128, 256);
}

/** L'écume : des bulles et des moutons blancs (fond transparent). */
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
      g.ellipse(x + dx, y + dy, r, r * (1.2 + a()), 0, 0, Math.PI * 2);
      g.fill();
    }
  }
}

/** Des planches (tuile de 2,4 m) : lames de 15 cm, joints, nœuds, usure claire. */
export function dessinerPlanches(g) {
  const a = aleatoire(71);
  g.fillStyle = "#cdbfa6";
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 16) {
    const v = 200 + Math.floor((a() - 0.5) * 50);
    g.fillStyle = `rgb(${v},${v - 10},${v - 26})`;
    g.fillRect(0, y + 1, 256, 14);
    g.fillStyle = "rgba(40, 30, 20, 0.5)";
    g.fillRect(0, y, 256, 1.5);
    const coupe = a() * 256;
    g.fillRect(coupe, y, 1.5, 16);
    for (let k = 0; k < 3; k++) {
      g.fillStyle = `rgba(60, 40, 25, ${0.1 + a() * 0.15})`;
      g.fillRect(a() * 256, y + 3 + a() * 9, 20 + a() * 70, 1);
    }
    if (a() < 0.4) {
      g.fillStyle = "rgba(70, 45, 25, 0.4)";
      g.beginPath();
      g.ellipse(a() * 256, y + 8, 3, 2, 0, 0, 7);
      g.fill();
    }
  }
  taches(g, a, 10, "rgba(50, 60, 40, 0.18)", 10, 40, 256, 256);
}

/** Le sol de la vallée : grain fin, mottes, brins (tuile de 6 m). */
export function dessinerTerrain(g) {
  const a = aleatoire(73);
  g.fillStyle = "#e4e2da";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = a() < 0.5 ? `rgba(0,0,0,${0.04 + a() * 0.06})` : `rgba(255,255,255,${0.05 + a() * 0.06})`;
    g.fillRect(a() * 256, a() * 256, 1 + a() * 3, 1 + a() * 3);
  }
  taches(g, a, 18, "rgba(60, 55, 40, 0.14)", 10, 40, 256, 256);
  taches(g, a, 10, "rgba(255, 255, 240, 0.12)", 10, 30, 256, 256);
}

/** Les galets ronds de la rivière (tuile de 2 m). */
export function dessinerGalets(g) {
  const a = aleatoire(79);
  g.fillStyle = "#9a958a";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 420; i++) {
    const x = a() * 256;
    const y = a() * 256;
    const r = 3 + a() * 9;
    const v = 190 + Math.floor((a() - 0.5) * 70);
    for (const [dx, dy] of [[0, 0], [256, 0], [-256, 0], [0, 256], [0, -256]]) {
      g.fillStyle = `rgb(${v},${v - 4},${v - 12})`;
      g.beginPath();
      g.ellipse(x + dx, y + dy, r, r * (0.6 + a() * 0.3), a() * 3, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "rgba(255,255,255,0.18)";
      g.beginPath();
      g.ellipse(x + dx - r * 0.25, y + dy - r * 0.2, r * 0.4, r * 0.25, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  taches(g, a, 12, "rgba(60, 70, 40, 0.2)", 10, 36, 256, 256);
}

/**
 * L'atlas du gué retourné (option miroir) : les flèches changent de sens, et chaque région est retournée de gauche à
 * droite. La géométrie retournée la retourne une seconde fois : les textes se lisent à l'endroit.
 */
export function dessinerAtlasMiroir(g) {
  const tmp = document.createElement("canvas");
  tmp.width = AL;
  tmp.height = AH;
  INVERSER = true;
  try {
    dessinerAtlas(tmp.getContext("2d"));
  } finally {
    INVERSER = false;
  }
  g.clearRect(0, 0, AL, AH);
  for (const [x, y, l, h] of Object.values(R)) {
    g.save();
    g.translate(x + l, y);
    g.scale(-1, 1);
    g.drawImage(tmp, x, y, l, h, 0, 0, l, h);
    g.restore();
  }
}
