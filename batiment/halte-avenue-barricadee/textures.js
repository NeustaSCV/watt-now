// Les textures dessinées de l'avenue barricadée : l'atlas des enseignes et affiches, l'atlas des façades
// haussmanniennes (une cellule = une travée d'un étage, 3 × 3 m), l'asphalte et le stabilisé du terre-plein.
// Tout est dessiné au canvas, une seule fois (cache de l'atelier).

import { aleatoire, taches } from "../commun/atelier.js";

// ---------- Outils de dessin ----------

export function texte(g, t, x, y, taille, couleur, police = "900", align = "center", largeurMax = 0, famille = '"Arial Black", "Helvetica Neue", Arial, sans-serif') {
  g.save();
  g.font = `${police} ${taille}px ${famille}`;
  if (largeurMax) {
    const l = g.measureText(t).width;
    if (l > largeurMax) {
      taille = Math.floor((taille * largeurMax) / l);
      g.font = `${police} ${taille}px ${famille}`;
    }
  }
  g.fillStyle = couleur;
  g.textAlign = align;
  g.textBaseline = "middle";
  g.fillText(t, x, y);
  g.restore();
}

/** Écriture à la craie : trait un peu tremblé, blanc cassé. */
function craie(g, a, t, x, y, taille, angle = 0, couleur = "rgba(236,232,220,0.92)") {
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  g.font = `700 ${taille}px "Marker Felt", "Comic Sans MS", "Chalkboard", cursive`;
  g.fillStyle = couleur;
  g.textAlign = "left";
  g.textBaseline = "middle";
  for (let k = 0; k < 2; k++) g.fillText(t, (a() - 0.5) * 1.5, (a() - 0.5) * 1.5);
  g.restore();
}

function salir(g, a, x, y, l, h, force = 1) {
  g.save();
  g.beginPath();
  g.rect(x, y, l, h);
  g.clip();
  for (let i = 0; i < (l * h) / 220; i++) {
    g.fillStyle = a() < 0.5 ? `rgba(0,0,0,${0.06 * force})` : `rgba(255,255,255,${0.05 * force})`;
    g.fillRect(x + a() * l, y + a() * h, 1 + a() * 3, 1 + a() * 3);
  }
  for (let i = 0; i < 7 * force; i++) {
    const cx = x + a() * l;
    const lg = h * (0.3 + a() * 0.8);
    const d = g.createLinearGradient(0, y, 0, y + lg);
    d.addColorStop(0, `rgba(60,52,40,${0.22 * force})`);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(cx, y, 2 + a() * 6, lg);
  }
  g.save();
  g.translate(x, y);
  taches(g, a, Math.round(4 * force), `rgba(70,60,45,${0.16 * force})`, 6, Math.min(l, h) * 0.3, l, h);
  g.restore();
  g.restore();
}

/** Une affiche délavée : le papier pâlit, des lambeaux manquent. */
function delaver(g, a, x, y, l, h, force = 1) {
  g.save();
  g.fillStyle = `rgba(235,228,212,${0.22 * force})`;
  g.fillRect(x, y, l, h);
  // lambeaux arrachés (transparents : on voit le mur)
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 3 * force; i++) {
    const cx = x + (a() < 0.5 ? a() * l * 0.25 : l - a() * l * 0.25);
    const cy = y + (a() < 0.5 ? a() * h * 0.2 : h - a() * h * 0.2);
    g.beginPath();
    g.moveTo(cx, cy);
    for (let k = 0; k < 6; k++) g.lineTo(cx + (a() - 0.5) * l * 0.35, cy + (a() - 0.5) * h * 0.2);
    g.fill();
  }
  g.restore();
  salir(g, a, x, y, l, h, force);
}

function rond(g, x, y, r, couleur) {
  g.fillStyle = couleur;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}

/** Watty, la pile souriante de la Compagnie. */
export function watty(g, x, y, s, clin = false) {
  g.save();
  g.fillStyle = "#e8c24a";
  g.fillRect(x - s * 0.28, y - s * 0.45, s * 0.56, s * 0.9);
  g.fillStyle = "#c8362b";
  g.fillRect(x - s * 0.28, y - s * 0.45, s * 0.56, s * 0.18);
  g.fillStyle = "#9a9a96";
  g.fillRect(x - s * 0.1, y - s * 0.55, s * 0.2, s * 0.1);
  rond(g, x - s * 0.1, y - s * 0.08, s * 0.05, "#1d2433");
  if (clin) {
    g.fillStyle = "#1d2433";
    g.fillRect(x + s * 0.04, y - s * 0.09, s * 0.12, s * 0.025);
  } else rond(g, x + s * 0.1, y - s * 0.08, s * 0.05, "#1d2433");
  g.strokeStyle = "#1d2433";
  g.lineWidth = s * 0.04;
  g.beginPath();
  g.arc(x, y + s * 0.05, s * 0.14, 0.2, Math.PI - 0.2);
  g.stroke();
  // bras levé
  g.lineWidth = s * 0.05;
  g.strokeStyle = "#e8c24a";
  g.beginPath();
  g.moveTo(x + s * 0.28, y + s * 0.05);
  g.lineTo(x + s * 0.48, y - s * 0.25);
  g.stroke();
  g.restore();
}

/** Un petit scooter de livreur, silhouette (affiches). */
function scooter(g, x, y, s, couleur) {
  g.save();
  g.fillStyle = couleur;
  g.beginPath();
  g.moveTo(x - s * 0.5, y);
  g.lineTo(x + s * 0.3, y);
  g.lineTo(x + s * 0.45, y - s * 0.45);
  g.lineTo(x + s * 0.32, y - s * 0.48);
  g.lineTo(x + s * 0.18, y - s * 0.1);
  g.lineTo(x - s * 0.35, y - s * 0.12);
  g.fill();
  g.fillRect(x - s * 0.55, y - s * 0.62, s * 0.4, s * 0.4); // le coffre isotherme
  rond(g, x - s * 0.38, y + s * 0.06, s * 0.12, "#1d2433");
  rond(g, x + s * 0.32, y + s * 0.06, s * 0.12, "#1d2433");
  g.restore();
}

// ---------- L'atlas des enseignes et affiches ----------

export const AL = 1024;
export const AH = 2304;

/** Les régions de l'atlas : [x, y, l, h] en pixels. */
export const R = {
  panOuest: [0, 0, 512, 160],
  panEst: [512, 0, 512, 160],
  plaque: [0, 160, 256, 128],
  pharmacie: [256, 160, 512, 96],
  croix: [768, 160, 128, 128],
  tabac: [896, 160, 128, 128],
  boulangerie: [0, 288, 512, 96],
  cafe: [512, 288, 512, 96],
  superette: [0, 384, 512, 96],
  banque: [512, 384, 512, 96],
  rideau: [0, 480, 256, 256],
  rideau2: [256, 480, 256, 256],
  cochere: [512, 480, 256, 256],
  parpaings: [768, 480, 256, 256],
  affLivre: [0, 736, 256, 352],
  aff10min: [256, 736, 256, 352],
  prefecture: [512, 736, 256, 352],
  velo: [768, 736, 256, 352],
  banFaim: [0, 1088, 512, 128],
  banVivants: [512, 1088, 512, 128],
  banRestez: [0, 1216, 512, 128],
  controle: [512, 1216, 512, 128],
  quarantaine: [0, 1344, 512, 128],
  camion: [512, 1344, 512, 128],
  craie: [0, 1472, 512, 192],
  craie2: [512, 1472, 512, 192],
  garde: [0, 1664, 256, 128],
  metro: [256, 1664, 256, 128],
  kiosque: [512, 1664, 256, 128],
  dab: [768, 1664, 256, 128],
  borneVelo: [0, 1792, 128, 256],
  thermique: [128, 1792, 128, 256],
  drone: [256, 1792, 256, 64],
  boites: [256, 1856, 256, 192],
  fenetreLumiere: [512, 1792, 128, 192],
  watty: [640, 1792, 192, 256],
  grattage: [832, 1792, 192, 128],
  presse: [832, 1920, 192, 128],
  depot: [512, 1984, 320, 64],
  grillage: [0, 2048, 256, 256],
  sas: [256, 2048, 256, 128],
  casiers: [256, 2176, 256, 128],
  pharmabot: [512, 2048, 256, 128],
  caisse: [512, 2176, 256, 128],
  conseiller: [768, 2048, 256, 256],
};

export function dessinerAtlas(g) {
  const a = aleatoire(4404);
  g.clearRect(0, 0, AL, AH);

  // Panneaux de direction (ville) : fond blanc, liseré, texte sombre
  for (const [r, lignes, fleche] of [
    [R.panOuest, ["Comptoir de la Gare", "3 km"], "←"],
    [R.panEst, ["Centre-ville · Hôpital", "Toutes directions"], "→"],
  ]) {
    const [x, y, l, h] = r;
    g.fillStyle = "#f0ede4";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "#2b2f33";
    g.lineWidth = 6;
    g.strokeRect(x + 8, y + 8, l - 16, h - 16);
    const gauche = fleche === "←";
    texte(g, fleche, gauche ? x + 60 : x + l - 60, y + h / 2, 92, "#2b2f33");
    texte(g, lignes[0], x + l / 2 + (gauche ? 40 : -40), y + h * 0.38, 46, "#2b2f33", "900", "center", l - 150);
    texte(g, lignes[1], x + l / 2 + (gauche ? 40 : -40), y + h * 0.72, 34, "#4a5056", "700", "center", l - 150);
    salir(g, a, x, y, l, h, 1.2);
  }

  // Plaque de rue émaillée
  {
    const [x, y, l, h] = R.plaque;
    g.fillStyle = "#1f3f73";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "#e9e4d6";
    g.lineWidth = 6;
    g.strokeRect(x + 7, y + 7, l - 14, h - 14);
    g.strokeStyle = "#2f6f4a";
    g.lineWidth = 3;
    g.strokeRect(x + 2, y + 2, l - 4, h - 4);
    texte(g, "8e Arrt", x + l / 2, y + 26, 18, "#e9e4d6", "700");
    texte(g, "BOULEVARD", x + l / 2, y + 56, 30, "#e9e4d6", "900", "center", l - 30);
    texte(g, "DE LA PROSPÉRITÉ", x + l / 2, y + 92, 28, "#e9e4d6", "900", "center", l - 30);
    salir(g, a, x, y, l, h, 1);
    // éclats d'émail
    for (let i = 0; i < 5; i++) rond(g, x + a() * l, y + a() * h, 2 + a() * 5, "#2a2826");
  }

  // Enseignes en bandeau
  const enseigne = (r, fond, encre, titre, sous, police = "900") => {
    const [x, y, l, h] = r;
    g.fillStyle = fond;
    g.fillRect(x, y, l, h);
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.fillRect(x, y + h - 6, l, 6);
    texte(g, titre, x + l / 2, y + (sous ? h * 0.4 : h / 2), sous ? 48 : 56, encre, police, "center", l - 40);
    if (sous) texte(g, sous, x + l / 2, y + h * 0.78, 20, encre, "700", "center", l - 40);
    salir(g, a, x, y, l, h, 1.4);
  };
  enseigne(R.pharmacie, "#e8e2d2", "#2f7d4a", "PHARMACIE", "PharmaBot 24/7 · votre ordonnance en 30 secondes");
  enseigne(R.boulangerie, "#5a2e26", "#d9b765", "BOULANGERIE · PÂTISSERIE", "Pain chaud livré par drone avant votre réveil", "900");
  enseigne(R.cafe, "#1f3a33", "#e2cf8f", "CAFÉ · TABAC · LE NARVAL", "Grattez, gagnez des Wh !");
  enseigne(R.superette, "#c8362b", "#f3eadb", "PROXI-TOUT", "ouvert 24 h / 24 · 7 j / 7 · caisses autonomes");
  enseigne(R.banque, "#24344d", "#d6c38a", "CRÉDIT ABONDANT", "Votre argent travaille pour vous (même la nuit)");

  // La croix verte de la pharmacie (néon) et le losange du tabac
  {
    const [x, y, l, h] = R.croix;
    g.fillStyle = "#123018";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#58e07a";
    const b = l * 0.28;
    g.fillRect(x + (l - b) / 2, y + 10, b, h - 20);
    g.fillRect(x + 10, y + (h - b) / 2, l - 20, b);
    g.fillStyle = "#c9ffd6";
    g.fillRect(x + (l - b) / 2 + 8, y + 18, b - 16, h - 36);
    g.fillRect(x + 18, y + (h - b) / 2 + 8, l - 36, b - 16);
  }
  {
    const [x, y, l, h] = R.tabac;
    g.save();
    g.translate(x + l / 2, y + h / 2);
    g.fillStyle = "#b8352b";
    g.beginPath();
    g.moveTo(0, -h / 2 + 4);
    g.lineTo(l / 2 - 4, 0);
    g.lineTo(0, h / 2 - 4);
    g.lineTo(-l / 2 + 4, 0);
    g.fill();
    g.restore();
    texte(g, "TABAC", x + l / 2, y + h / 2, 26, "#f0e6d0");
    salir(g, a, x, y, l, h, 1);
  }

  // Rideaux métalliques baissés : tôle ondulée, tags, rouille
  for (const [r, mot] of [[R.rideau, ""], [R.rideau2, "PILLÉ — RIEN ICI"]]) {
    const [x, y, l, h] = r;
    g.fillStyle = "#9aa0a2";
    g.fillRect(x, y, l, h);
    for (let yy = 0; yy < h; yy += 8) {
      g.fillStyle = "rgba(255,255,255,0.18)";
      g.fillRect(x, y + yy, l, 2);
      g.fillStyle = "rgba(0,0,0,0.16)";
      g.fillRect(x, y + yy + 5, l, 2);
    }
    g.fillStyle = "#6e7476";
    g.fillRect(x, y + h - 14, l, 14);
    // tags
    g.save();
    g.lineWidth = 7;
    g.lineCap = "round";
    for (let i = 0; i < 3; i++) {
      g.strokeStyle = ["#2f6f73", "#c8362b", "#2a2826", "#c79a3b"][Math.floor(a() * 4)];
      g.beginPath();
      let px = x + 20 + a() * 60;
      let py = y + 60 + a() * 120;
      g.moveTo(px, py);
      for (let k = 0; k < 7; k++) {
        px += 15 + a() * 20;
        py += (a() - 0.5) * 50;
        g.quadraticCurveTo(px - 10, py - 30 * (a() - 0.5), px, py);
      }
      g.stroke();
    }
    g.restore();
    if (mot) craie(g, a, mot, x + 18, y + 60, 26, -0.05);
    // rouille au pied
    const d = g.createLinearGradient(0, y + h - 70, 0, y + h);
    d.addColorStop(0, "rgba(140,70,35,0)");
    d.addColorStop(1, "rgba(140,70,35,0.55)");
    g.fillStyle = d;
    g.fillRect(x, y + h - 70, l, 70);
    salir(g, a, x, y, l, h, 1.3);
  }

  // Porte cochère en bois peint, barricadée de planches
  {
    const [x, y, l, h] = R.cochere;
    g.fillStyle = "#33503f";
    g.fillRect(x, y, l, h);
    for (const dx of [0, l / 2]) {
      for (let k = 0; k < 3; k++) {
        g.strokeStyle = "rgba(0,0,0,0.35)";
        g.lineWidth = 4;
        g.strokeRect(x + dx + 16, y + 20 + k * 74, l / 2 - 32, 60);
        g.strokeStyle = "rgba(255,255,255,0.12)";
        g.lineWidth = 2;
        g.strokeRect(x + dx + 20, y + 24 + k * 74, l / 2 - 40, 52);
      }
    }
    g.fillStyle = "#1c2a22";
    g.fillRect(x + l / 2 - 2, y, 4, h);
    rond(g, x + l / 2 - 14, y + h * 0.55, 6, "#b59048");
    rond(g, x + l / 2 + 14, y + h * 0.55, 6, "#b59048");
    // planches clouées en travers
    for (let i = 0; i < 4; i++) {
      g.save();
      g.translate(x + l / 2, y + 50 + i * 55);
      g.rotate((a() - 0.5) * 0.35);
      g.fillStyle = ["#8a6f50", "#7a5f44", "#9a7f5c"][i % 3];
      g.fillRect(-l / 2 - 10, -12, l + 20, 24);
      g.fillStyle = "#2a2826";
      rond(g, -l / 2 + 12, 0, 3, "#2a2826");
      rond(g, l / 2 - 12, 0, 3, "#2a2826");
      g.restore();
    }
    salir(g, a, x, y, l, h, 1.5);
  }

  // Porte cochère murée de parpaings, et messages à la craie
  {
    const [x, y, l, h] = R.parpaings;
    g.fillStyle = "#8f8d86";
    g.fillRect(x, y, l, h);
    for (let r = 0; r < h / 32; r++) {
      const dec = r % 2 ? 32 : 0;
      for (let c = -1; c < l / 64 + 1; c++) {
        const v = 160 + Math.floor((a() - 0.5) * 30);
        g.fillStyle = `rgb(${v},${v - 2},${v - 6})`;
        g.fillRect(x + c * 64 + dec + 2, y + r * 32 + 2, 60, 28);
      }
    }
    g.fillStyle = "rgba(220,215,200,0.4)";
    for (let i = 0; i < 6; i++) g.fillRect(x + a() * l, y + a() * h, 30 + a() * 40, 8);
    craie(g, a, "4 VIVANTS AU 3e", x + 22, y + 70, 30, -0.04);
    craie(g, a, "FRAPPEZ 3 COUPS", x + 30, y + 120, 26, 0.03);
    craie(g, a, "||||  ||||  ||", x + 40, y + 190, 30, 0);
    salir(g, a, x, y, l, h, 1.2);
  }

  // Affiche : « Restez chez vous, on vous livre ! »
  {
    const [x, y, l, h] = R.affLivre;
    g.fillStyle = "#f2b33d";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#c8362b";
    g.fillRect(x, y, l, 90);
    texte(g, "RESTEZ", x + l / 2, y + 30, 36, "#fff6e0");
    texte(g, "CHEZ VOUS", x + l / 2, y + 68, 32, "#fff6e0");
    scooter(g, x + l / 2 + 10, y + 210, 150, "#2f6f73");
    watty(g, x + 55, y + 190, 70, true);
    texte(g, "on vous livre !", x + l / 2, y + 280, 30, "#3a1e18", "900", "center", l - 20);
    texte(g, "Miam Express · l'appli qui vous aime", x + l / 2, y + 320, 14, "#3a1e18", "700", "center", l - 20);
    delaver(g, a, x, y, l, h, 1.4);
  }
  // Affiche : « Livraison en 10 minutes garantie »
  {
    const [x, y, l, h] = R.aff10min;
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, l, h);
    rond(g, x + l / 2, y + 120, 82, "#f3eadb");
    texte(g, "10", x + l / 2, y + 110, 84, "#c8362b");
    texte(g, "MIN", x + l / 2, y + 168, 26, "#c8362b");
    texte(g, "LIVRAISON", x + l / 2, y + 236, 34, "#f3eadb");
    texte(g, "GARANTIE", x + l / 2, y + 272, 30, "#f2b33d");
    texte(g, "ou c'est offert*", x + l / 2, y + 306, 20, "#f3eadb", "700");
    texte(g, "*hors fin du monde", x + l / 2, y + 334, 12, "#cfe0dc", "400");
    delaver(g, a, x, y, l, h, 1.2);
  }
  // Avis de la préfecture (délavé)
  {
    const [x, y, l, h] = R.prefecture;
    g.fillStyle = "#ece6d6";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#1f3f73";
    g.fillRect(x, y, 10, h);
    g.fillStyle = "#c8362b";
    g.fillRect(x + l - 10, y, 10, h);
    texte(g, "PRÉFECTURE", x + l / 2, y + 30, 26, "#1d2433");
    texte(g, "AVIS À LA POPULATION", x + l / 2, y + 62, 20, "#1d2433", "900", "center", l - 30);
    const lignes = ["Couvre-feu de 18 h à 8 h.", "Restez chez vous.", "Contrôle de température", "obligatoire aux barrages.", "Les livraisons sont", "maintenues.", "Fièvre grise : signalez", "tout voisin fiévreux.", "La situation est", "sous contrôle."];
    lignes.forEach((t, i) => texte(g, t, x + 22, y + 100 + i * 22, 15, "#2a2826", "700", "left", l - 40, "Georgia, serif"));
    texte(g, "Le Préfet", x + l - 30, y + h - 26, 15, "#2a2826", "400", "right", 0, "Georgia, serif");
    delaver(g, a, x, y, l, h, 2);
  }
  // Vélo+ Premium
  {
    const [x, y, l, h] = R.velo;
    g.fillStyle = "#e9efe6";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#3f8f5a";
    g.fillRect(x, y, l, 70);
    texte(g, "Vélo+", x + l / 2 - 20, y + 36, 46, "#ffffff");
    texte(g, "PREMIUM", x + l / 2 + 80, y + 40, 16, "#f2d26a", "900");
    // un vélo
    g.strokeStyle = "#2b2f33";
    g.lineWidth = 6;
    for (const dx of [-55, 55]) {
      g.beginPath();
      g.arc(x + l / 2 + dx, y + 170, 38, 0, Math.PI * 2);
      g.stroke();
    }
    g.strokeStyle = "#3f8f5a";
    g.beginPath();
    g.moveTo(x + l / 2 - 55, y + 170);
    g.lineTo(x + l / 2 - 5, y + 120);
    g.lineTo(x + l / 2 + 55, y + 170);
    g.lineTo(x + l / 2 + 25, y + 115);
    g.lineTo(x + l / 2 - 15, y + 120);
    g.stroke();
    texte(g, "Déverrouillage", x + l / 2, y + 236, 24, "#2b2f33", "900", "center", l - 20);
    texte(g, "par abonnement", x + l / 2, y + 264, 24, "#2b2f33", "900", "center", l - 20);
    texte(g, "4,99 €/mois + 0,49 €/min", x + l / 2, y + 300, 17, "#c8362b", "900", "center", l - 20);
    texte(g, "Pédalez libre !", x + l / 2, y + 330, 16, "#3f8f5a", "700");
    delaver(g, a, x, y, l, h, 1);
  }

  // Banderoles peintes sur des draps
  const drap = (r, mot, couleur) => {
    const [x, y, l, h] = r;
    g.fillStyle = "#e9e3d4";
    g.beginPath();
    g.moveTo(x, y + 6);
    for (let i = 0; i <= 8; i++) g.lineTo(x + (l * i) / 8, y + 4 + a() * 10);
    for (let i = 8; i >= 0; i--) g.lineTo(x + (l * i) / 8, y + h - 4 - a() * 14);
    g.fill();
    for (let i = 0; i < 6; i++) {
      g.fillStyle = "rgba(120,110,90,0.18)";
      g.fillRect(x + a() * l, y, 3 + a() * 6, h);
    }
    texte(g, mot, x + l / 2, y + h / 2 + 2, 72, couleur, "900", "center", l - 40, '"Marker Felt", "Arial Black", sans-serif');
    salir(g, a, x, y, l, h, 1.2);
  };
  drap(R.banFaim, "ON A FAIM", "#2a2826");
  drap(R.banVivants, "ICI 4 VIVANTS", "#9a2a22");
  drap(R.banRestez, "RESTEZ CHEZ VOUS", "#2a2826");

  // Contrôle de température : jaune et noir
  {
    const [x, y, l, h] = R.controle;
    g.fillStyle = "#e8c24a";
    g.fillRect(x, y, l, h);
    for (let i = -2; i < 20; i++) {
      g.fillStyle = "#1d1d1b";
      g.beginPath();
      g.moveTo(x + i * 30, y);
      g.lineTo(x + i * 30 + 15, y);
      g.lineTo(x + i * 30 - 5, y + 18);
      g.lineTo(x + i * 30 - 20, y + 18);
      g.fill();
      g.beginPath();
      g.moveTo(x + i * 30, y + h - 18);
      g.lineTo(x + i * 30 + 15, y + h - 18);
      g.lineTo(x + i * 30 - 5, y + h);
      g.lineTo(x + i * 30 - 20, y + h);
      g.fill();
    }
    texte(g, "CONTRÔLE DE TEMPÉRATURE", x + l / 2, y + 52, 38, "#1d1d1b", "900", "center", l - 40);
    texte(g, "Fièvre grise · présentez votre front · gardez 2 m", x + l / 2, y + 88, 18, "#1d1d1b", "700", "center", l - 40);
    salir(g, a, x, y, l, h, 1.2);
  }
  // Zone de quarantaine
  {
    const [x, y, l, h] = R.quarantaine;
    g.fillStyle = "#f0ede4";
    g.fillRect(x, y, l, h);
    for (let i = 0; i < l / 40; i++) {
      g.fillStyle = "#c8362b";
      g.fillRect(x + i * 40, y, 20, 14);
      g.fillRect(x + i * 40 + 20, y + h - 14, 20, 14);
    }
    texte(g, "ZONE DE QUARANTAINE", x + l / 2, y + 50, 42, "#c8362b", "900", "center", l - 40);
    texte(g, "ACCÈS INTERDIT · DÉCONTAMINATION OBLIGATOIRE", x + l / 2, y + 90, 18, "#1d2433", "900", "center", l - 40);
    salir(g, a, x, y, l, h, 1.3);
  }
  // Flanc du camion de livraison de repas
  {
    const [x, y, l, h] = R.camion;
    g.fillStyle = "#f2efe6";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#c8362b";
    g.fillRect(x, y + h - 30, l, 30);
    texte(g, "MIAM EXPRESS", x + 190, y + 42, 50, "#c8362b");
    texte(g, "Livré chaud en 10 min ou remboursé", x + 190, y + 82, 18, "#2a2826", "700", "center", 340);
    scooter(g, x + 430, y + 72, 90, "#2f6f73");
    texte(g, "on vous aime, restez chez vous", x + l / 2, y + h - 15, 15, "#fff6e0", "700");
    salir(g, a, x, y, l, h, 1.6);
  }

  // Messages à la craie (fond transparent : posés sur les murs, rideaux, tôles)
  {
    const [x, y, l, h] = R.craie;
    craie(g, a, "PASSAGE PAR LE BUS →", x + 10, y + 34, 34, -0.03);
    craie(g, a, "NE DESCENDEZ PAS (MÉTRO)", x + 14, y + 82, 28, 0.02);
    craie(g, a, "Les Moreau → la Gare, 12 mars", x + 20, y + 124, 24, -0.02);
    craie(g, a, "TOUT EST PRIS", x + 60, y + 166, 30, 0.04);
  }
  {
    const [x, y, l, h] = R.craie2;
    craie(g, a, "ON ÉCHANGE EAU CONTRE PILES", x + 8, y + 34, 26, -0.02);
    craie(g, a, "Maman, on est au café. Léo", x + 16, y + 82, 26, 0.03);
    craie(g, a, "PAS DE FIÉVREUX ICI", x + 30, y + 128, 30, -0.04);
    craie(g, a, "J+41", x + 400, y + 166, 30, 0);
  }

  // Garde-corps en fer forgé (fond transparent)
  {
    const [x, y, l, h] = R.garde;
    g.strokeStyle = "#232220";
    g.fillStyle = "#232220";
    g.fillRect(x, y + 4, l, 8);
    g.fillRect(x, y + h - 14, l, 8);
    g.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const cx = x + 16 + i * 32;
      g.beginPath();
      g.moveTo(cx, y + 12);
      g.lineTo(cx, y + h - 14);
      g.stroke();
      g.beginPath();
      g.arc(cx + 16, y + h / 2, 12, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.arc(cx + 16, y + 26, 8, Math.PI, 0);
      g.stroke();
      g.beginPath();
      g.arc(cx + 16, y + h - 28, 8, 0, Math.PI);
      g.stroke();
    }
  }
  // Enseigne du métro
  {
    const [x, y, l, h] = R.metro;
    g.fillStyle = "#2b3a3a";
    g.fillRect(x, y, l, h);
    rond(g, x + 50, y + h / 2, 38, "#e8c24a");
    texte(g, "M", x + 50, y + h / 2 + 2, 46, "#2b3a3a");
    texte(g, "MÉTRO", x + 160, y + 44, 36, "#e9e4d6");
    texte(g, "STATION FERMÉE", x + 160, y + 88, 18, "#e8c24a", "900", "center", 170);
    salir(g, a, x, y, l, h, 1.2);
  }
  // Kiosque
  {
    const [x, y, l, h] = R.kiosque;
    g.fillStyle = "#2f4a3c";
    g.fillRect(x, y, l, h);
    texte(g, "JOURNAUX", x + l / 2, y + 44, 40, "#e2cf8f");
    texte(g, "PRESSE · LOTO · RECHARGES", x + l / 2, y + 92, 18, "#e2cf8f", "900", "center", l - 20);
    salir(g, a, x, y, l, h, 1.2);
  }
  // Écran de distributeur
  {
    const [x, y, l, h] = R.dab;
    g.fillStyle = "#3a3d40";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#1a2a3a";
    g.fillRect(x + 20, y + 14, l - 40, 70);
    texte(g, "SERVICE MOMENTANÉMENT", x + l / 2, y + 38, 15, "#8fb5d0", "700", "center", l - 50);
    texte(g, "INDISPONIBLE", x + l / 2, y + 62, 18, "#8fb5d0", "900");
    g.fillStyle = "#222";
    g.fillRect(x + 60, y + 96, l - 120, 12);
    salir(g, a, x, y, l, h, 1);
  }
  // Borne Vélo+ (écran qui luit)
  {
    const [x, y, l, h] = R.borneVelo;
    g.fillStyle = "#0e2a1a";
    g.fillRect(x, y, l, h);
    texte(g, "Vélo+", x + l / 2, y + 40, 30, "#7dffb0");
    texte(g, "ABONNEZ-", x + l / 2, y + 100, 18, "#c8ffe0", "900");
    texte(g, "VOUS POUR", x + l / 2, y + 124, 18, "#c8ffe0", "900");
    texte(g, "DÉVERROUILLER", x + l / 2, y + 148, 15, "#c8ffe0", "900", "center", l - 10);
    texte(g, "0 vélo dispo.", x + l / 2, y + 200, 15, "#ff9a7a", "700");
    texte(g, "batterie 3 %", x + l / 2, y + 228, 13, "#7dffb0", "700");
  }
  // Borne thermique (écran qui luit)
  {
    const [x, y, l, h] = R.thermique;
    g.fillStyle = "#200d0b";
    g.fillRect(x, y, l, h);
    rond(g, x + l / 2, y + 70, 40, "#5a1a14");
    texte(g, "37,9 °C", x + l / 2, y + 150, 28, "#ff6a4a");
    texte(g, "ACCÈS", x + l / 2, y + 190, 22, "#ffb0a0", "900");
    texte(g, "REFUSÉ", x + l / 2, y + 216, 22, "#ffb0a0", "900");
  }
  // Logo des drones de livraison
  {
    const [x, y, l, h] = R.drone;
    g.fillStyle = "#e8c24a";
    g.fillRect(x, y, l, h);
    texte(g, "VitAir · 10 min", x + l / 2, y + h / 2, 30, "#1d2433", "900", "center", l - 20);
  }
  // Boîtes aux lettres en laiton
  {
    const [x, y, l, h] = R.boites;
    g.fillStyle = "#4a3a28";
    g.fillRect(x, y, l, h);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const bx = x + 8 + c * 61;
      const by = y + 8 + r * 45;
      g.fillStyle = a() < 0.25 ? "#2a2018" : "#b59048";
      g.fillRect(bx, by, 55, 39);
      g.fillStyle = "#1d1d1b";
      g.fillRect(bx + 10, by + 8, 35, 5);
      g.fillStyle = "#e9e4d6";
      g.fillRect(bx + 14, by + 22, 26, 9);
      if (a() < 0.4) {
        g.fillStyle = "#f2efe6";
        g.fillRect(bx + 12, by + 2, 28, 10); // du courrier qui dépasse
      }
    }
    salir(g, a, x, y, l, h, 1.2);
  }
  // Fenêtre éclairée (néon) : rideau, lampe, une silhouette
  {
    const [x, y, l, h] = R.fenetreLumiere;
    const d = g.createRadialGradient(x + l / 2, y + h * 0.45, 4, x + l / 2, y + h * 0.45, h * 0.6);
    d.addColorStop(0, "#ffe2a0");
    d.addColorStop(1, "#b0702a");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
    g.fillStyle = "rgba(255,240,210,0.6)";
    g.fillRect(x + 6, y, 30, h);
    g.fillRect(x + l - 36, y, 30, h);
    g.fillStyle = "rgba(40,24,12,0.55)";
    rond(g, x + l / 2 + 10, y + 70, 14, "rgba(40,24,12,0.55)");
    g.fillRect(x + l / 2 - 6, y + 84, 32, 60);
    g.fillStyle = "#3a2a1a";
    g.fillRect(x + l / 2 - 3, y, 6, h);
    g.fillRect(x, y + h * 0.4, l, 5);
  }
  // Vieille réclame peinte de Watty sur un mur pignon
  {
    const [x, y, l, h] = R.watty;
    g.fillStyle = "#d9cbb0";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#2f6f73";
    g.fillRect(x + 10, y + 10, l - 20, 50);
    texte(g, "WATTY", x + l / 2, y + 36, 36, "#f2e6c8");
    watty(g, x + l / 2, y + 130, 110);
    texte(g, "Toujours plein,", x + l / 2, y + 210, 18, "#7a2a22", "900", "center", l - 20);
    texte(g, "jamais à plat !", x + l / 2, y + 234, 18, "#7a2a22", "900", "center", l - 20);
    g.fillStyle = "rgba(217,203,176,0.45)";
    g.fillRect(x, y, l, h);
    salir(g, a, x, y, l, h, 2);
  }
  // Jeux de grattage
  {
    const [x, y, l, h] = R.grattage;
    g.fillStyle = "#6a2a8a";
    g.fillRect(x, y, l, h);
    texte(g, "GRATTEZ", x + l / 2, y + 30, 30, "#f2d26a");
    texte(g, "& GAGNEZ", x + l / 2, y + 62, 24, "#ffffff");
    texte(g, "1 000 000 Wh !", x + l / 2, y + 98, 22, "#f2d26a", "900", "center", l - 16);
    salir(g, a, x, y, l, h, 1);
  }
  // La une du journal, au kiosque
  {
    const [x, y, l, h] = R.presse;
    g.fillStyle = "#e9e4d6";
    g.fillRect(x, y, l, h);
    texte(g, "LE QUOTIDIEN", x + l / 2, y + 18, 18, "#1d2433", "900", "center", l - 10, "Georgia, serif");
    g.fillStyle = "#1d2433";
    g.fillRect(x + 6, y + 30, l - 12, 2);
    texte(g, "LA PANNE DURERA", x + l / 2, y + 52, 18, "#1d2433", "900", "center", l - 14);
    texte(g, "48 H, ASSURE", x + l / 2, y + 74, 18, "#1d2433", "900", "center", l - 14);
    texte(g, "LA COMPAGNIE", x + l / 2, y + 96, 18, "#c8362b", "900", "center", l - 14);
    salir(g, a, x, y, l, h, 1.5);
  }
  // Grillage de chantier (fond transparent, fils épais pour survivre aux mipmaps)
  {
    const [x, y, l, h] = R.grillage;
    g.strokeStyle = "#b8bcbc";
    g.lineWidth = 3;
    for (let i = 0; i <= l; i += 16) {
      g.beginPath();
      g.moveTo(x + i, y);
      g.lineTo(x + i, y + h);
      g.stroke();
    }
    for (let j = 0; j <= h; j += 32) {
      g.beginPath();
      g.moveTo(x, y + j);
      g.lineTo(x + l, y + j);
      g.stroke();
    }
  }
  // Sas de décontamination
  {
    const [x, y, l, h] = R.sas;
    g.fillStyle = "#f0ede4";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#2d5a8a";
    g.fillRect(x, y, l, 26);
    texte(g, "SÉCURITÉ SANITAIRE", x + l / 2, y + 14, 16, "#f0ede4", "900", "center", l - 20);
    texte(g, "SAS DE", x + l / 2, y + 56, 26, "#2d5a8a");
    texte(g, "DÉCONTAMINATION", x + l / 2, y + 88, 24, "#2d5a8a", "900", "center", l - 16);
    texte(g, "ENTRÉE →", x + l / 2, y + 114, 15, "#c8362b", "900");
    salir(g, a, x, y, l, h, 1.2);
  }
  // Casiers connectés
  {
    const [x, y, l, h] = R.casiers;
    g.fillStyle = "#d9dcd8";
    g.fillRect(x, y, l, h);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
      g.fillStyle = a() < 0.3 ? "#3a3d40" : "#eef0ec";
      g.fillRect(x + 6 + c * 50, y + 30 + r * 32, 44, 28);
      rond(g, x + 42 + c * 50, y + 44 + r * 32, 3, a() < 0.2 ? "#6fc8ff" : "#8a8e8c");
    }
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, l, 24);
    texte(g, "Vos courses vous attendent ♥", x + l / 2, y + 13, 15, "#f3eadb", "900", "center", l - 10);
    salir(g, a, x, y, l, h, 1);
  }
  // PharmaBot
  {
    const [x, y, l, h] = R.pharmabot;
    g.fillStyle = "#e8ece8";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#2f7d4a";
    g.fillRect(x, y, l, 30);
    texte(g, "PharmaBot 24/7", x + l / 2, y + 16, 20, "#ffffff");
    g.fillStyle = "#14201a";
    g.fillRect(x + 30, y + 40, l - 60, 60);
    texte(g, "Erreur 503 : santé", x + l / 2, y + 60, 15, "#58e07a", "700", "center", l - 70);
    texte(g, "momentanément indisponible", x + l / 2, y + 82, 12, "#58e07a", "700", "center", l - 70);
    salir(g, a, x, y, l, h, 1.2);
  }
  // Caisse autonome
  {
    const [x, y, l, h] = R.caisse;
    g.fillStyle = "#1d2433";
    g.fillRect(x, y, l, h);
    texte(g, "CAISSE AUTONOME", x + l / 2, y + 26, 22, "#f2b33d", "900", "center", l - 20);
    texte(g, "Scannez votre sourire", x + l / 2, y + 62, 20, "#ffffff", "700", "center", l - 20);
    texte(g, ":)", x + l / 2, y + 100, 30, "#f2b33d");
    salir(g, a, x, y, l, h, 0.8);
  }
  // Conseiller virtuel de la banque
  {
    const [x, y, l, h] = R.conseiller;
    g.fillStyle = "#24344d";
    g.fillRect(x, y, l, h);
    rond(g, x + l / 2, y + 90, 50, "#d6c38a");
    rond(g, x + l / 2 - 18, y + 82, 7, "#24344d");
    rond(g, x + l / 2 + 18, y + 82, 7, "#24344d");
    g.strokeStyle = "#24344d";
    g.lineWidth = 5;
    g.beginPath();
    g.arc(x + l / 2, y + 98, 20, 0.2, Math.PI - 0.2);
    g.stroke();
    texte(g, "Votre conseiller", x + l / 2, y + 170, 22, "#d6c38a", "900", "center", l - 20);
    texte(g, "virtuel vous écoute", x + l / 2, y + 198, 20, "#d6c38a", "700", "center", l - 20);
    texte(g, "(il ne répond plus)", x + l / 2, y + 230, 15, "#9aa6b8", "400");
    salir(g, a, x, y, l, h, 1.2);
  }
  // Le dépôt de livraison
  {
    const [x, y, l, h] = R.depot;
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, l, h);
    texte(g, "MIAM EXPRESS · DÉPÔT 10 MIN", x + l / 2, y + h / 2, 26, "#f3eadb", "900", "center", l - 20);
    salir(g, a, x, y, l, h, 1.3);
  }
}

// ---------- L'atlas des façades : 4 × 4 cellules de 256 px (une travée d'un étage, 3 × 3 m) ----------

export const FL = 1024;
const CEL = 256;
const PX = CEL / 3; // pixels par mètre

/**
 * Les cellules : [colonne, ligne].
 * Ligne 0 : étage noble (fronton) ; lignes 1 et 2 : étages courants ; ligne 3 : lucarne, fenêtre de cour, mur nu, pignon.
 */
export const CELLULES = {
  noble: [[0, 0], [1, 0], [2, 0], [3, 0]],
  courant: [[0, 1], [1, 1], [2, 1], [3, 1], [0, 2], [1, 2], [2, 2], [3, 2]],
  lucarne: [0, 3],
  cour: [1, 3],
  nu: [2, 3],
  courFermee: [3, 3],
};
/** Les états des fenêtres courantes, dans l'ordre de CELLULES.courant (pour doser l'usure). */
export const ETATS_COURANTS = ["fermes", "ouverts", "casse", "planches", "rideau", "pendu", "suie", "intact"];

function fondPierre(g, a, x, y) {
  g.fillStyle = "#efe9dc";
  g.fillRect(x, y, CEL, CEL);
  // assises de pierre (50 cm) et joints verticaux décalés
  for (let r = 0; r < 6; r++) {
    const yy = y + r * (CEL / 6);
    g.fillStyle = "rgba(90,80,60,0.13)";
    g.fillRect(x, yy, CEL, 1.5);
    const dec = (r % 2) * 50;
    for (let xx = dec; xx < CEL; xx += 100) {
      g.fillRect(x + xx, yy, 1.5, CEL / 6);
    }
  }
  for (let i = 0; i < 900; i++) {
    g.fillStyle = a() < 0.5 ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)";
    g.fillRect(x + a() * CEL, y + a() * CEL, 1 + a() * 2, 1 + a() * 2);
  }
}

/** Une fenêtre haussmannienne : encadrement mouluré, porte-fenêtre, garde-corps, état variable. */
function fenetreH(g, a, x, y, etat, noble) {
  const lw = 1.18 * PX;
  const x0 = x + (CEL - lw) / 2;
  const y0 = y + CEL - 2.48 * PX; // haut de la baie
  const y1 = y + CEL - 0.08 * PX; // bas
  const hh = y1 - y0;
  // encadrement de pierre
  g.fillStyle = "#f7f2e6";
  g.fillRect(x0 - 10, y0 - 10, lw + 20, hh + 10);
  g.strokeStyle = "rgba(110,95,70,0.35)";
  g.lineWidth = 2;
  g.strokeRect(x0 - 6, y0 - 6, lw + 12, hh + 6);
  // clé de linteau
  g.fillStyle = "#f3ecdc";
  g.fillRect(x + CEL / 2 - 9, y0 - 18, 18, 18);
  g.strokeRect(x + CEL / 2 - 9, y0 - 18, 18, 18);
  if (noble) {
    // fronton cintré sur consoles
    g.fillStyle = "#f5efe2";
    g.beginPath();
    g.moveTo(x0 - 18, y0 - 20);
    g.quadraticCurveTo(x + CEL / 2, y0 - 62, x0 + lw + 18, y0 - 20);
    g.lineTo(x0 + lw + 18, y0 - 14);
    g.lineTo(x0 - 18, y0 - 14);
    g.fill();
    g.strokeStyle = "rgba(110,95,70,0.45)";
    g.stroke();
    g.fillStyle = "rgba(80,70,50,0.25)";
    g.fillRect(x0 - 18, y0 - 15, lw + 36, 4);
    for (const s of [-1, 1]) {
      g.fillStyle = "#ece4d2";
      g.fillRect(x + CEL / 2 + s * (lw / 2 + 10) - 6, y0 - 14, 12, 34);
    }
  }
  // le vide de la baie
  g.fillStyle = "#24282a";
  g.fillRect(x0, y0, lw, hh);
  const vitres = (reflet = 0.25) => {
    for (const s of [0, 1]) {
      const vx = x0 + 4 + s * (lw / 2);
      const vw = lw / 2 - 8;
      for (let k = 0; k < 3; k++) {
        const vy = y0 + 4 + (k * hh) / 3;
        const d = g.createLinearGradient(vx, vy, vx + vw, vy + hh / 3);
        d.addColorStop(0, `rgba(160,185,195,${reflet})`);
        d.addColorStop(0.5, "rgba(60,80,90,0.25)");
        d.addColorStop(1, `rgba(170,190,200,${reflet * 0.7})`);
        g.fillStyle = d;
        g.fillRect(vx, vy, vw, hh / 3 - 8);
      }
    }
    g.fillStyle = "#e6e0d2";
    g.fillRect(x0 + lw / 2 - 2, y0, 4, hh);
    for (let k = 1; k < 3; k++) g.fillRect(x0, y0 + (k * hh) / 3 - 3, lw, 3);
  };
  const persienne = (px, py, pw, ph, couleur) => {
    g.fillStyle = couleur;
    g.fillRect(px, py, pw, ph);
    for (let yy = py + 4; yy < py + ph; yy += 7) {
      g.fillStyle = "rgba(0,0,0,0.22)";
      g.fillRect(px + 2, yy, pw - 4, 2);
      g.fillStyle = "rgba(255,255,255,0.12)";
      g.fillRect(px + 2, yy + 2, pw - 4, 1);
    }
    g.strokeStyle = "rgba(0,0,0,0.3)";
    g.lineWidth = 2;
    g.strokeRect(px, py, pw, ph);
  };
  const vert = ["#8fa39a", "#9aa59e", "#a8a99c", "#7f978f"][Math.floor(a() * 4)];
  if (etat === "fermes") {
    persienne(x0, y0, lw / 2, hh, vert);
    persienne(x0 + lw / 2, y0, lw / 2, hh, vert);
  } else if (etat === "ouverts") {
    vitres(0.35);
    persienne(x0 - 10 - lw / 2 + 6, y0, lw / 2 - 6, hh, vert);
    persienne(x0 + lw + 10, y0, lw / 2 - 6, hh, vert);
  } else if (etat === "casse") {
    vitres(0.12);
    g.fillStyle = "#1a1d1e";
    for (let i = 0; i < 4; i++) {
      const cx = x0 + 6 + a() * (lw - 12);
      const cy = y0 + 6 + a() * (hh - 12);
      g.beginPath();
      g.moveTo(cx, cy);
      for (let k = 0; k < 6; k++) g.lineTo(cx + (a() - 0.5) * 50, cy + (a() - 0.5) * 60);
      g.fill();
    }
  } else if (etat === "planches") {
    g.fillStyle = "#1a1d1e";
    g.fillRect(x0, y0, lw, hh);
    for (let i = 0; i < 6; i++) {
      g.save();
      g.translate(x0 + lw / 2, y0 + 16 + i * (hh / 6));
      g.rotate((a() - 0.5) * 0.3);
      g.fillStyle = ["#8a6f50", "#7a5f44", "#9a7f5c", "#6f5a40"][i % 4];
      g.fillRect(-lw / 2 - 8, -9, lw + 16, 18);
      g.restore();
    }
  } else if (etat === "rideau") {
    g.fillStyle = "#151819";
    g.fillRect(x0, y0, lw, hh);
    g.fillStyle = "#dcd2bf";
    g.beginPath();
    g.moveTo(x0 + 6, y0);
    g.quadraticCurveTo(x0 + lw * 0.7, y0 + hh * 0.4, x0 + lw * 0.95, y0 + hh * 0.95);
    g.lineTo(x0 + lw * 0.65, y0 + hh * 0.95);
    g.quadraticCurveTo(x0 + lw * 0.3, y0 + hh * 0.5, x0 + 6, y0 + 20);
    g.fill();
  } else if (etat === "pendu") {
    vitres(0.2);
    persienne(x0, y0, lw / 2, hh, vert);
    g.save();
    g.translate(x0 + lw + 8, y0 + 8);
    g.rotate(0.35);
    persienne(0, 0, lw / 2 - 6, hh * 0.92, vert);
    g.restore();
  } else if (etat === "suie") {
    g.fillStyle = "#0d0d0d";
    g.fillRect(x0, y0, lw, hh);
    const d = g.createLinearGradient(0, y0 + 20, 0, y);
    d.addColorStop(0, "rgba(20,18,16,0.85)");
    d.addColorStop(1, "rgba(20,18,16,0)");
    g.fillStyle = d;
    g.beginPath();
    g.moveTo(x0 - 6, y0 + 10);
    g.lineTo(x0 + lw + 6, y0 + 10);
    g.lineTo(x0 + lw + 30, y);
    g.lineTo(x0 - 30, y);
    g.fill();
  } else {
    vitres(0.4);
    g.fillStyle = "rgba(225,215,195,0.55)";
    g.fillRect(x0 + 6, y0 + 4, lw * 0.3, hh - 8);
    g.fillStyle = "rgba(200,200,190,0.25)";
    g.fillRect(x0, y0, lw, hh);
  }
  // garde-corps de la porte-fenêtre (fer forgé)
  const gy = y1 - 1.0 * PX;
  g.strokeStyle = "#1f1e1c";
  g.fillStyle = "#1f1e1c";
  g.fillRect(x0 - 4, gy, lw + 8, 4);
  g.lineWidth = 2;
  for (let k = 0; k < 7; k++) {
    const cx = x0 + 6 + (k * (lw - 12)) / 6;
    g.beginPath();
    g.moveTo(cx, gy);
    g.lineTo(cx, y1);
    g.stroke();
  }
  for (let k = 0; k < 3; k++) {
    g.beginPath();
    g.arc(x0 + lw * (0.2 + k * 0.3), gy + (y1 - gy) / 2, 9, 0, Math.PI * 2);
    g.stroke();
  }
  // coulure sous l'appui
  const d = g.createLinearGradient(0, y1, 0, y + CEL);
  d.addColorStop(0, "rgba(60,52,40,0.3)");
  d.addColorStop(1, "rgba(60,52,40,0)");
  g.fillStyle = d;
  g.fillRect(x0 + 10, y1, lw - 20, y + CEL - y1);
}

export function dessinerFacades(g) {
  const a = aleatoire(1853);
  const etatsNobles = ["fermes", "ouverts", "casse", "rideau"];
  for (let i = 0; i < 4; i++) {
    fondPierre(g, a, i * CEL, 0);
    fenetreH(g, a, i * CEL, 0, etatsNobles[i], true);
  }
  ETATS_COURANTS.forEach((e, k) => {
    const x = (k % 4) * CEL;
    const y = CEL + Math.floor(k / 4) * CEL;
    fondPierre(g, a, x, y);
    fenetreH(g, a, x, y, e, false);
  });
  // Ligne 3 : la lucarne (fenêtre de comble sur enduit), la fenêtre de cour, le mur nu, la fenêtre de cour fermée
  {
    const x = 0;
    const y = 3 * CEL;
    g.fillStyle = "#e7e1d3";
    g.fillRect(x, y, CEL, CEL);
    g.fillStyle = "#f4efe3";
    g.fillRect(x + 40, y + 30, CEL - 80, CEL - 40);
    g.fillStyle = "#22262a";
    g.fillRect(x + 62, y + 52, CEL - 124, CEL - 70);
    g.fillStyle = "rgba(150,170,180,0.3)";
    g.fillRect(x + 66, y + 56, (CEL - 132) / 2, CEL - 80);
    g.fillStyle = "#e6e0d2";
    g.fillRect(x + CEL / 2 - 2, y + 52, 4, CEL - 70);
  }
  for (const [col, ferme] of [[1, false], [3, true]]) {
    const x = col * CEL;
    const y = 3 * CEL;
    g.fillStyle = "#e4ddcd";
    g.fillRect(x, y, CEL, CEL);
    for (let i = 0; i < 700; i++) {
      g.fillStyle = a() < 0.5 ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)";
      g.fillRect(x + a() * CEL, y + a() * CEL, 2, 2);
    }
    const lw = 0.95 * PX;
    const x0 = x + (CEL - lw) / 2;
    const y0 = y + CEL - 2.2 * PX;
    const hh = 1.55 * PX;
    g.fillStyle = "#f0eadc";
    g.fillRect(x0 - 7, y0 - 7, lw + 14, hh + 14);
    g.fillStyle = ferme ? "#8a7a5e" : "#262a2c";
    g.fillRect(x0, y0, lw, hh);
    if (ferme) for (let yy = y0 + 5; yy < y0 + hh; yy += 9) {
      g.fillStyle = "rgba(0,0,0,0.25)";
      g.fillRect(x0, yy, lw, 2);
    }
    else {
      g.fillStyle = "rgba(150,170,180,0.3)";
      g.fillRect(x0 + 4, y0 + 4, lw / 2 - 6, hh - 8);
    }
    const d = g.createLinearGradient(0, y0 + hh, 0, y + CEL);
    d.addColorStop(0, "rgba(60,52,40,0.3)");
    d.addColorStop(1, "rgba(60,52,40,0)");
    g.fillStyle = d;
    g.fillRect(x0, y0 + hh, lw, y + CEL - y0 - hh);
  }
  fondPierre(g, a, 2 * CEL, 3 * CEL);
  // salissures générales (coulures depuis les corniches)
  for (let i = 0; i < 120; i++) {
    const x = a() * FL;
    const y = Math.floor(a() * 4) * CEL;
    const lg = 40 + a() * 140;
    const d = g.createLinearGradient(0, y, 0, y + lg);
    d.addColorStop(0, "rgba(60,54,44,0.16)");
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(x, y, 2 + a() * 6, lg);
  }
}

// ---------- Les sols ----------

export function dessinerAsphalte(g) {
  const a = aleatoire(91);
  g.fillStyle = "#c2c2be";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5000; i++) {
    const v = 150 + Math.floor(a() * 90);
    g.fillStyle = `rgba(${v},${v},${v - 4},0.5)`;
    g.fillRect(a() * 256, a() * 256, 1 + a() * 2, 1 + a() * 2);
  }
  taches(g, a, 10, "rgba(40,40,40,0.18)", 10, 50, 256, 256);
  taches(g, a, 6, "rgba(255,255,255,0.12)", 10, 40, 256, 256);
  g.strokeStyle = "rgba(35,35,35,0.5)";
  g.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
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

export function dessinerStabilise(g) {
  const a = aleatoire(92);
  g.fillStyle = "#d8d0bc";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 6000; i++) {
    const v = a();
    g.fillStyle = v < 0.4 ? "rgba(90,80,60,0.18)" : v < 0.8 ? "rgba(255,250,235,0.18)" : "rgba(70,90,50,0.15)";
    g.fillRect(a() * 256, a() * 256, 1 + a() * 3, 1 + a() * 3);
  }
  taches(g, a, 14, "rgba(90,80,50,0.16)", 12, 50, 256, 256);
  taches(g, a, 8, "rgba(80,100,50,0.18)", 10, 36, 256, 256);
}
