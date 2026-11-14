// Le sanatorium des Hauts-Soleils : couleurs, matières, enduit écaillé et atlas (enseignes, affiches, châssis).
// Tout ce qui porte une image passe par UN atlas : une seule matière, un seul appel de dessin par chantier.

import * as THREE from "three";
import { PALETTE, MAT, matiere, matiereMonde, matiereTexture, matiereVerre, matiereLueur, dessiner, taches, aleatoire } from "../commun/atelier.js";

// ---------- Couleurs du lieu (le blanc a viré au crème, le soleil a tout pâli) ----------

export const COUL = {
  blanc: 0xebe7dc, // l'enduit blanc des façades
  blancGris: 0xd6d2c6, // appuis, nez de dalle à l'ombre
  dessous: 0xc9c5b8, // sous-face des dalles
  interieur: 0xc4d2bf, // vert d'eau pâle des chambres et des couloirs
  interieurCreme: 0xe0d6bc, // crème du réfectoire et du hall
  sombre: 0x98a296, // intérieur des étages vu par les fenêtres
  granito: 0xd5cdbb,
  parquet: 0xb3936c,
  cadre: 0x55625d, // châssis d'acier peints gris-vert
  garde: 0xd3cfc4, // garde-corps tubulaires peints en blanc, écaillés
  chaise: 0xa48259, // les chaises longues de cure, bois clair grisé
  chaiseGris: 0x8f8574,
  toile: 0xcdbf9c,
  plaids: [0x8a6a52, 0x6b7a5f, 0x9c8a66, 0x7c6070, 0x5f6f78, 0x8f7a5a],
  fer: 0x35383a, // lits de fer
  email: 0xe7e5dc, // émail blanc
  emailBleu: 0x48698f,
  bois: 0x7a5a3c,
  boisSombre: 0x4a3426,
  boisClair: 0xa88d68,
  rotin: 0xb39b6c,
  brique: 0xa05a43,
  zinc: PALETTE.zinc,
  fonte: 0x3b3f3d,
  cabine: 0x5d8783, // la cabine du téléphérique, bleu-vert passé
  neige: 0xeef2f4,
  pierre: 0x9d978a,
  pierreSombre: 0x7c776d,
  terre: 0x8f7556,
  gravier: 0xa89c86,
  charbon: 0x2b2a29,
  noir: 0x1e1f21,
  canard: 0x2f6f73,
  calorifuge: 0xb8b09b,
  sapins: [0x34513a, 0x3b5a3e, 0x2f4a35, 0x44663f],
  melezes: [0xbf9b40, 0xae8c3c, 0x8f9a4e, 0xc9a94f],
};

// ---------- L'atlas ----------

export const AL = 1024;
export const AH = 1280;

/** Régions de l'atlas : [x, y, l, h] en pixels. */
export const R = {
  titre: [0, 0, 1024, 128],
  detox: [0, 128, 128, 512],
  reseau: [128, 128, 384, 192],
  casiers: [512, 128, 256, 256],
  deposez: [768, 128, 256, 128],
  silence: [768, 256, 256, 128],
  affiche: [128, 320, 256, 384],
  livres: [384, 384, 256, 256],
  teleph: [640, 384, 384, 128],
  coupefile: [640, 512, 384, 128],
  menu: [384, 640, 256, 256],
  radio: [640, 640, 256, 256],
  soleil: [896, 640, 128, 128],
  temperature: [896, 768, 128, 128],
  vr: [0, 704, 384, 192],
  graffiti: [0, 896, 512, 128],
  panorama: [512, 896, 512, 128],
  chassisF: [0, 1024, 128, 128],
  chassisP: [128, 1024, 128, 256],
  chassisCasse: [256, 1024, 128, 128],
  accueil: [384, 1024, 384, 128],
  verriere: [768, 1024, 128, 256],
};

let MATS = null;

/** Les matières du lieu, créées une fois et partagées par les deux cartes. */
export function matieres() {
  if (MATS) return MATS;
  const atlas = dessiner("sana-atlas", AL, AH, dessinerAtlas, false);
  const enduit = matiereTexture(dessiner("sana-enduit", 512, 512, dessinerEnduit), { roughness: 0.92 });
  enduit.userData.tuile = 6;
  const enseignes = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.85, alphaTest: 0.5, side: THREE.DoubleSide });
  MATS = {
    enduit,
    brique: matiereMonde("brique"),
    carrelage: matiereMonde("carrelage"),
    parquet: matiereMonde("parquet"),
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    enseignes,
    mat: matiere(0.95),
    satin: matiere(0.6, 0.05),
    lisse: matiere(0.3, 0.05),
    tole: MAT.tole(),
    metal: matiere(0.4, 0.7),
    toile: MAT.toile(),
    lueur: matiereLueur(0xfff0c8, 0.09),
  };
  return MATS;
}

/** Un panneau plat dont l'image vient de l'atlas (région `r`), face vers +z local. */
export function panneau(c, mat, r, pose, l, h) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
  c.poser(g, mat, 0xffffff, pose, { crasse: false, nuance: 0 });
  g.dispose();
}

// ---------- Outils de dessin ----------

const DECO = '"Futura", "Century Gothic", "Avenir Next", "Gill Sans", "Trebuchet MS", sans-serif';
const SERIF = 'Didot, "Bodoni 72", Georgia, "Times New Roman", serif';
const GRAS = '"Arial Black", "Helvetica Neue", Arial, sans-serif';
const CRAIE = '"Chalkboard SE", "Marker Felt", "Comic Sans MS", cursive';

function texte(g, t, x, y, taille, couleur, { police = "700", famille = DECO, align = "center", espace = 0, rotation = 0 } = {}) {
  g.save();
  g.translate(x, y);
  g.rotate(rotation);
  g.font = `${police} ${taille}px ${famille}`;
  if (espace) g.letterSpacing = `${espace}px`;
  g.fillStyle = couleur;
  g.textAlign = align;
  g.textBaseline = "middle";
  g.fillText(t, 0, 0);
  g.restore();
}

function salir(g, a, x, y, l, h, force = 1) {
  g.save();
  g.beginPath();
  g.rect(x, y, l, h);
  g.clip();
  for (let i = 0; i < (l * h) / 200; i++) {
    g.fillStyle = a() < 0.5 ? `rgba(0,0,0,${0.05 * force})` : `rgba(255,255,255,${0.05 * force})`;
    g.fillRect(x + a() * l, y + a() * h, 1 + a() * 3, 1 + a() * 3);
  }
  for (let i = 0; i < 6 * force; i++) {
    const cx = x + a() * l;
    const lg = h * (0.3 + a() * 0.8);
    const d = g.createLinearGradient(0, y, 0, y + lg);
    d.addColorStop(0, `rgba(70,60,45,${0.2 * force})`);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(cx, y, 2 + a() * 6, lg);
  }
  g.restore();
}

function rectArrondi(g, x, y, l, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + l, y, x + l, y + h, r);
  g.arcTo(x + l, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + l, y, r);
  g.closePath();
}

/** Le pictogramme du wifi, barré. */
function wifiBarre(g, cx, cy, s, couleur) {
  g.save();
  g.strokeStyle = couleur;
  g.fillStyle = couleur;
  g.lineCap = "round";
  g.lineWidth = s * 0.11;
  for (const r of [0.28, 0.55, 0.82]) {
    g.beginPath();
    g.arc(cx, cy + s * 0.35, r * s, -Math.PI * 0.78, -Math.PI * 0.22);
    g.stroke();
  }
  g.beginPath();
  g.arc(cx, cy + s * 0.35, s * 0.09, 0, 7);
  g.fill();
  g.lineWidth = s * 0.12;
  g.beginPath();
  g.moveTo(cx - s * 0.6, cy - s * 0.45);
  g.lineTo(cx + s * 0.6, cy + s * 0.5);
  g.stroke();
  g.restore();
}

/** Watty, la pile souriante de la Compagnie. */
function watty(g, x, y, s) {
  g.save();
  g.fillStyle = "#c79a3b";
  rectArrondi(g, x - s * 0.3, y - s * 0.5, s * 0.6, s, s * 0.12);
  g.fill();
  g.fillRect(x - s * 0.12, y - s * 0.62, s * 0.24, s * 0.14);
  g.fillStyle = "#2b2a28";
  g.beginPath();
  g.arc(x - s * 0.1, y - s * 0.12, s * 0.05, 0, 7);
  g.arc(x + s * 0.1, y - s * 0.12, s * 0.05, 0, 7);
  g.fill();
  g.lineWidth = s * 0.05;
  g.strokeStyle = "#2b2a28";
  g.beginPath();
  g.arc(x, y + s * 0.02, s * 0.14, 0.2, Math.PI - 0.2);
  g.stroke();
  g.restore();
}

// ---------- L'enduit blanc qui s'écaille ----------

/** Enduit à la chaux blanc, sali, fissuré, qui tombe par plaques et laisse voir la brique. Tuile de 6 m. */
function dessinerEnduit(g) {
  const a = aleatoire(1450);
  g.fillStyle = "#f4f1ea";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 6000; i++) {
    g.fillStyle = a() < 0.5 ? "rgba(0,0,0,0.045)" : "rgba(255,255,255,0.05)";
    g.fillRect(a() * 512, a() * 512, 1 + a() * 2, 1 + a() * 2);
  }
  taches(g, a, 16, "rgba(120, 110, 90, 0.12)", 30, 110, 512, 512);
  taches(g, a, 7, "rgba(95, 112, 70, 0.12)", 20, 70, 512, 512);
  // Les plaques tombées : la brique apparaît, bordée d'un liseré d'enduit plus clair et d'une ombre
  for (let i = 0; i < 5; i++) {
    const cx = a() * 512;
    const cy = a() * 512;
    const r = 6 + a() * 16;
    const pts = [];
    for (let k = 0; k < 11; k++) {
      const ang = (k / 11) * Math.PI * 2;
      const rr = r * (0.55 + a() * 0.6) * (k % 2 ? 1 : 1.25);
      pts.push([cx + Math.cos(ang) * rr * 1.5, cy + Math.sin(ang) * rr]);
    }
    const chemin = () => {
      g.beginPath();
      pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.closePath();
    };
    g.save();
    chemin();
    g.clip();
    g.fillStyle = "#b9a690";
    g.fillRect(cx - r * 2, cy - r * 2, r * 4, r * 4);
    for (let y = Math.floor((cy - r * 2) / 8) * 8; y < cy + r * 2; y += 8) {
      const dec = (y / 8) % 2 ? 11 : 0;
      for (let x = Math.floor((cx - r * 2) / 22) * 22 - 22; x < cx + r * 2; x += 22) {
        const v = Math.floor((a() - 0.5) * 40);
        g.fillStyle = `rgb(${178 + v},${128 + v * 0.6},${108 + v * 0.5})`;
        g.fillRect(x + dec + 1, y + 1, 20, 6);
      }
    }
    g.restore();
    chemin();
    g.lineWidth = 2.5;
    g.strokeStyle = "rgba(255,255,255,0.75)";
    g.stroke();
    g.lineWidth = 1.2;
    g.strokeStyle = "rgba(60,48,36,0.55)";
    g.stroke();
  }
  // Coulures depuis le haut (chéneaux bouchés), traînées sous les appuis
  for (let i = 0; i < 46; i++) {
    const x = a() * 512;
    const lg = 60 + a() * 260;
    const y0 = a() < 0.5 ? 0 : a() * 400;
    const d = g.createLinearGradient(0, y0, 0, y0 + lg);
    d.addColorStop(0, `rgba(80, 70, 52, ${0.12 + a() * 0.16})`);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(x, y0, 1 + a() * 6, lg);
  }
  // Fissures
  g.strokeStyle = "rgba(55, 46, 36, 0.5)";
  g.lineWidth = 1;
  for (let i = 0; i < 9; i++) {
    let x = a() * 512;
    let y = a() * 512;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 8; k++) {
      x += (a() - 0.5) * 26;
      y += 6 + a() * 12;
      g.lineTo(x, y);
    }
    g.stroke();
  }
}

// ---------- L'atlas ----------

function dessinerAtlas(g) {
  const a = aleatoire(1936);
  g.clearRect(0, 0, AL, AH);

  // Le nom du sanatorium, lettres de bronze patiné scellées sur la tour ; un O pend, le dernier S est tombé.
  {
    const [x, y, l, h] = R.titre;
    const mot = "LES HAUTS-SOLEILS";
    g.save();
    g.font = `700 86px ${DECO}`;
    g.letterSpacing = "10px";
    const larg = g.measureText(mot).width;
    let cx = x + (l - larg) / 2;
    for (let i = 0; i < mot.length; i++) {
      const ch = mot[i];
      const w = g.measureText(ch).width + 10;
      if (i === mot.length - 1) {
        // le S tombé : il ne reste que deux trous de scellement et une coulure
        g.fillStyle = "rgba(70, 58, 44, 0.7)";
        g.fillRect(cx + w * 0.3, y + 40, 6, 6);
        g.fillRect(cx + w * 0.55, y + 88, 6, 6);
      } else {
        const pend = i === 11;
        g.save();
        g.translate(cx + w / 2, y + h / 2 + (pend ? 10 : 0));
        if (pend) g.rotate(0.5);
        g.fillStyle = "#56645a";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(ch, 0, 0);
        g.restore();
        if (ch !== " " && a() < 0.6) {
          const d = g.createLinearGradient(0, y + 100, 0, y + 128);
          d.addColorStop(0, "rgba(70, 92, 78, 0.75)");
          d.addColorStop(1, "rgba(70, 92, 78, 0)");
          g.fillStyle = d;
          g.fillRect(cx + w * (0.3 + a() * 0.4), y + 100, 3, 28);
        }
      }
      cx += w;
    }
    g.restore();
  }

  // Le kakemono de la Cure Détox : toile canard délavée, déchirée en bas, trouée
  {
    const [x, y, l, h] = R.detox;
    const d = g.createLinearGradient(x, y, x, y + h);
    d.addColorStop(0, "#4f8784");
    d.addColorStop(1, "#6d9894");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
    g.fillStyle = "#e9dfc6";
    g.fillRect(x, y, l, 10);
    // le logo : une feuille dans un cercle, le wifi barré
    g.strokeStyle = "#e9dfc6";
    g.lineWidth = 4;
    g.beginPath();
    g.arc(x + 64, y + 66, 38, 0, 7);
    g.stroke();
    wifiBarre(g, x + 64, y + 62, 44, "#e9dfc6");
    texte(g, "CURE DÉTOX DIGITALE", x + 52, y + 300, 30, "#f1ead7", { rotation: -Math.PI / 2, espace: 3 });
    texte(g, "PREMIUM", x + 90, y + 300, 26, "#e2c27a", { rotation: -Math.PI / 2, espace: 8 });
    salir(g, a, x, y, l, h, 1.6);
    // délavé
    g.fillStyle = "rgba(255,255,255,0.12)";
    g.fillRect(x, y, l, h);
    // déchirures et trous
    g.save();
    g.globalCompositeOperation = "destination-out";
    g.beginPath();
    g.moveTo(x, y + h);
    for (let i = 0; i <= 10; i++) g.lineTo(x + (i / 10) * l, y + h - 10 - a() * 70);
    g.lineTo(x + l, y + h);
    g.closePath();
    g.fill();
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.ellipse(x + 20 + a() * 88, y + 140 + a() * 280, 4 + a() * 9, 6 + a() * 14, a(), 0, 7);
      g.fill();
    }
    g.restore();
  }

  // « Ici, pas de réseau. Enfin. »
  {
    const [x, y, l, h] = R.reseau;
    g.fillStyle = "#ece4cf";
    rectArrondi(g, x + 4, y + 4, l - 8, h - 8, 18);
    g.fill();
    g.strokeStyle = "#2f6f73";
    g.lineWidth = 4;
    rectArrondi(g, x + 12, y + 12, l - 24, h - 24, 12);
    g.stroke();
    wifiBarre(g, x + 72, y + 92, 70, "#2f6f73");
    texte(g, "Ici, pas de réseau.", x + 240, y + 72, 34, "#2c3b3a", { police: "italic 400", famille: SERIF });
    texte(g, "Enfin.", x + 240, y + 118, 46, "#2f6f73", { police: "italic 700", famille: SERIF });
    texte(g, "CURE DÉTOX DIGITALE PREMIUM", x + 240, y + 160, 13, "#6f6a5c", { espace: 2 });
    salir(g, a, x, y, l, h, 1.4);
  }

  // Le casier à téléphones : vingt petites portes, cinq ouvertes sur des téléphones morts
  {
    const [x, y, l, h] = R.casiers;
    g.fillStyle = "#b9b5a6";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, l, 34);
    texte(g, "DÉPOSEZ · RESPIREZ", x + l / 2, y + 18, 17, "#ece4cf", { espace: 2 });
    const cw = (l - 16) / 4;
    const chh = (h - 50) / 5;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) {
      const px = x + 8 + i * cw;
      const py = y + 42 + j * chh;
      const ouvert = a() < 0.28;
      g.fillStyle = ouvert ? "#26282a" : `rgb(${196 + Math.floor(a() * 20)},${192 + Math.floor(a() * 18)},${178})`;
      g.fillRect(px + 2, py + 2, cw - 4, chh - 4);
      if (ouvert) {
        g.fillStyle = "#121314";
        rectArrondi(g, px + cw * 0.32, py + 8, cw * 0.36, chh - 16, 4);
        g.fill();
      } else {
        g.fillStyle = "#4b4d4a";
        g.fillRect(px + cw - 14, py + chh / 2 - 3, 4, 6);
        texte(g, String(i * 5 + j + 1), px + 14, py + 12, 11, "#5d5b55", { famille: GRAS, police: "400" });
      }
    }
    salir(g, a, x, y, l, h, 1.5);
  }

  // « Déposez votre téléphone. Respirez. »
  {
    const [x, y, l, h] = R.deposez;
    g.fillStyle = "#ece4cf";
    g.fillRect(x + 4, y + 4, l - 8, h - 8);
    texte(g, "Déposez votre téléphone.", x + l / 2, y + 48, 21, "#2c3b3a", { police: "italic 400", famille: SERIF });
    texte(g, "Respirez.", x + l / 2, y + 86, 30, "#2f6f73", { police: "italic 700", famille: SERIF });
    salir(g, a, x, y, l, h, 1.3);
  }

  // Plaque émaillée : SILENCE, cure de 13 h à 16 h
  {
    const [x, y, l, h] = R.silence;
    g.fillStyle = "#1f3c62";
    rectArrondi(g, x + 4, y + 4, l - 8, h - 8, 14);
    g.fill();
    g.fillStyle = "#efeee8";
    rectArrondi(g, x + 12, y + 12, l - 24, h - 24, 8);
    g.fill();
    texte(g, "SILENCE", x + l / 2, y + 52, 44, "#1f3c62", { famille: GRAS, police: "900", espace: 4 });
    texte(g, "Cure de 13 h à 16 h", x + l / 2, y + 92, 20, "#1f3c62", { famille: SERIF, police: "italic 400" });
    // éclats d'émail
    for (let i = 0; i < 7; i++) {
      g.fillStyle = "#3a3632";
      g.beginPath();
      g.arc(x + (a() < 0.5 ? 10 + a() * 30 : l - 10 - a() * 30), y + 10 + a() * (h - 20), 3 + a() * 6, 0, 7);
      g.fill();
    }
  }

  // L'affiche ancienne : « Le soleil guérit »
  {
    const [x, y, l, h] = R.affiche;
    const d = g.createLinearGradient(x, y, x, y + h);
    d.addColorStop(0, "#e9c98c");
    d.addColorStop(0.55, "#a9c7d0");
    d.addColorStop(1, "#7d97a6");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
    // le soleil et ses rayons
    g.fillStyle = "rgba(255, 236, 170, 0.9)";
    for (let i = 0; i < 16; i++) {
      const an = (i / 16) * Math.PI * 2;
      g.beginPath();
      g.moveTo(x + 128, y + 140);
      g.lineTo(x + 128 + Math.cos(an - 0.07) * 160, y + 140 + Math.sin(an - 0.07) * 160);
      g.lineTo(x + 128 + Math.cos(an + 0.07) * 160, y + 140 + Math.sin(an + 0.07) * 160);
      g.fill();
    }
    g.fillStyle = "#f6d66e";
    g.beginPath();
    g.arc(x + 128, y + 140, 42, 0, 7);
    g.fill();
    // les montagnes
    g.fillStyle = "#5f7488";
    g.beginPath();
    g.moveTo(x, y + 260);
    g.lineTo(x + 60, y + 190);
    g.lineTo(x + 110, y + 235);
    g.lineTo(x + 170, y + 170);
    g.lineTo(x + l, y + 240);
    g.lineTo(x + l, y + h);
    g.lineTo(x, y + h);
    g.fill();
    g.fillStyle = "#eef2f4";
    g.beginPath();
    g.moveTo(x + 150, y + 192);
    g.lineTo(x + 170, y + 170);
    g.lineTo(x + 192, y + 186);
    g.lineTo(x + 175, y + 182);
    g.fill();
    // le sanatorium blanc en gradins
    g.fillStyle = "#f3efe4";
    for (let k = 0; k < 4; k++) g.fillRect(x + 40 + k * 8, y + 300 - k * 14, 176 - k * 16, 14);
    g.fillStyle = "#6c7a80";
    for (let k = 0; k < 4; k++) for (let i = 0; i < 10; i++) g.fillRect(x + 48 + k * 8 + i * (16 - k * 1.5), y + 304 - k * 14, 6, 5);
    texte(g, "LE SOLEIL", x + l / 2, y + 34, 34, "#7a3b2a", { espace: 4 });
    texte(g, "GUÉRIT", x + l / 2, y + 70, 34, "#7a3b2a", { espace: 6 });
    texte(g, "Les Hauts-Soleils · 1 450 m", x + l / 2, y + 352, 15, "#f1ead7", { famille: SERIF, police: "italic 400" });
    g.fillStyle = "rgba(255,250,235,0.22)";
    g.fillRect(x, y, l, h);
    salir(g, a, x, y, l, h, 1.8);
    // coin arraché
    g.save();
    g.globalCompositeOperation = "destination-out";
    g.beginPath();
    g.moveTo(x + l, y + h);
    g.lineTo(x + l - 70, y + h);
    g.lineTo(x + l - 40, y + h - 30);
    g.lineTo(x + l, y + h - 90);
    g.fill();
    g.restore();
  }

  // Les dos des livres de la bibliothèque des malades (deux rayonnages)
  {
    const [x, y, l, h] = R.livres;
    g.fillStyle = "#3b2a1e";
    g.fillRect(x, y, l, h);
    const tons = ["#7a2f2c", "#3f5a3c", "#8d6a32", "#2f3f5a", "#6b4a33", "#b8a986", "#5a2f45", "#4d6a6a", "#9a8a5c"];
    for (let r = 0; r < 2; r++) {
      const y0 = y + r * 128;
      g.fillStyle = "#5a4130";
      g.fillRect(x, y0 + 118, l, 10);
      let px = x + 2;
      while (px < x + l - 6) {
        if (a() < 0.08) {
          px += 10 + a() * 20; // un trou dans le rayon
          continue;
        }
        const w = 6 + a() * 10;
        const hh = 70 + a() * 44;
        const penche = a() < 0.07;
        g.save();
        g.translate(px, y0 + 118);
        if (penche) g.rotate(0.25);
        g.fillStyle = tons[Math.floor(a() * tons.length)];
        g.fillRect(0, -hh, w, hh);
        g.fillStyle = "rgba(210, 180, 100, 0.6)";
        g.fillRect(0, -hh + 10, w, 2);
        g.fillRect(0, -18, w, 2);
        g.restore();
        px += w + 0.5;
      }
    }
    salir(g, a, x, y, l, h, 1.2);
  }

  // Le panneau du téléphérique, émail vert sombre
  {
    const [x, y, l, h] = R.teleph;
    g.fillStyle = "#2f4f45";
    rectArrondi(g, x + 4, y + 4, l - 8, h - 8, 10);
    g.fill();
    g.strokeStyle = "#e6dcc0";
    g.lineWidth = 3;
    rectArrondi(g, x + 12, y + 12, l - 24, h - 24, 6);
    g.stroke();
    texte(g, "TÉLÉPHÉRIQUE", x + l / 2, y + 50, 40, "#ece2c6", { espace: 6 });
    texte(g, "Vallée · 1 250 m  ↓", x + l / 2, y + 92, 22, "#ece2c6", { famille: SERIF, police: "italic 400" });
    for (let i = 0; i < 9; i++) {
      g.fillStyle = `rgba(130, 70, 40, ${0.4 + a() * 0.4})`;
      g.beginPath();
      g.arc(x + a() * l, y + a() * h, 2 + a() * 6, 0, 7);
      g.fill();
    }
  }

  // Le panneau de l'Abondance au guichet : la descente premium
  {
    const [x, y, l, h] = R.coupefile;
    g.fillStyle = "#f1ece0";
    g.fillRect(x + 2, y + 2, l - 4, h - 4);
    g.fillStyle = "#c79a3b";
    g.fillRect(x + 2, y + 2, 16, h - 4);
    texte(g, "DESCENTE PREMIUM", x + 200, y + 42, 32, "#2f6f73", { espace: 2 });
    texte(g, "coupe-file inclus · remontée offerte*", x + 200, y + 80, 17, "#5d5a52", { famille: SERIF, police: "italic 400" });
    texte(g, "*selon disponibilité du réseau", x + 200, y + 106, 11, "#8a857a", { police: "400" });
    salir(g, a, x, y, l, h, 1.4);
  }

  // L'ardoise du réfectoire
  {
    const [x, y, l, h] = R.menu;
    g.fillStyle = "#6b4c33";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#26302b";
    g.fillRect(x + 12, y + 12, l - 24, h - 24);
    taches(g, a, 8, "rgba(220,220,210,0.08)", 14, 50, l, h);
    texte(g, "MENU DÉTOX", x + l / 2, y + 46, 26, "#e8e6dc", { famille: CRAIE, police: "400" });
    texte(g, "Bouillon de clairière", x + l / 2, y + 100, 17, "#dcdad0", { famille: CRAIE, police: "400" });
    texte(g, "Smoothie pomme de pin", x + l / 2, y + 136, 17, "#dcdad0", { famille: CRAIE, police: "400" });
    texte(g, "Silence (à volonté)", x + l / 2, y + 172, 17, "#e2c27a", { famille: CRAIE, police: "400" });
    texte(g, "soupe · ortie · bois sec", x + l / 2, y + 212, 15, "#f0efe6", { famille: CRAIE, police: "400", rotation: -0.08 });
    g.fillStyle = "rgba(200,200,190,0.18)";
    g.fillRect(x + 30, y + 120, 180, 30);
  }

  // Le négatoscope et sa radiographie pulmonaire
  {
    const [x, y, l, h] = R.radio;
    g.fillStyle = "#6f7471";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#e3edf2";
    g.fillRect(x + 12, y + 12, l - 24, h - 24);
    g.fillStyle = "#28323a";
    g.fillRect(x + 40, y + 24, l - 80, h - 48);
    g.save();
    g.beginPath();
    g.rect(x + 40, y + 24, l - 80, h - 48);
    g.clip();
    g.fillStyle = "rgba(170, 190, 200, 0.35)";
    g.beginPath();
    g.ellipse(x + 98, y + 128, 34, 72, 0.08, 0, 7);
    g.ellipse(x + 158, y + 128, 34, 72, -0.08, 0, 7);
    g.fill();
    g.strokeStyle = "rgba(225, 235, 240, 0.55)";
    g.lineWidth = 4;
    for (let i = 0; i < 7; i++) {
      g.beginPath();
      g.ellipse(x + 128, y + 70 + i * 20, 66, 16, 0, 0.15 * Math.PI, 0.85 * Math.PI);
      g.stroke();
    }
    g.fillStyle = "rgba(230, 238, 242, 0.7)";
    g.fillRect(x + 122, y + 30, 12, h - 60);
    g.restore();
    texte(g, "D", x + 58, y + 44, 18, "#dfe6ea", { famille: GRAS });
  }

  // Le soleil Art déco du couronnement
  {
    const [x, y, l, h] = R.soleil;
    g.fillStyle = "#c2a45e";
    for (let i = 0; i < 9; i++) {
      const an = Math.PI + (i / 8) * Math.PI;
      g.beginPath();
      g.moveTo(x + 64, y + 112);
      g.lineTo(x + 64 + Math.cos(an - 0.09) * 62, y + 112 + Math.sin(an - 0.09) * 62);
      g.lineTo(x + 64 + Math.cos(an + 0.09) * 62, y + 112 + Math.sin(an + 0.09) * 62);
      g.fill();
    }
    g.beginPath();
    g.arc(x + 64, y + 112, 30, Math.PI, 0);
    g.fill();
    g.fillRect(x + 8, y + 112, 112, 10);
  }

  // La feuille de température
  {
    const [x, y, l, h] = R.temperature;
    g.fillStyle = "#e6dfcb";
    g.fillRect(x + 6, y + 4, l - 12, h - 8);
    g.strokeStyle = "rgba(90, 120, 150, 0.45)";
    g.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      g.beginPath();
      g.moveTo(x + 10, y + 24 + i * 8);
      g.lineTo(x + l - 10, y + 24 + i * 8);
      g.stroke();
      g.beginPath();
      g.moveTo(x + 12 + i * 9, y + 22);
      g.lineTo(x + 12 + i * 9, y + h - 8);
      g.stroke();
    }
    g.strokeStyle = "#9a3d33";
    g.lineWidth = 2;
    g.beginPath();
    for (let i = 0; i < 12; i++) g.lineTo(x + 12 + i * 9, y + 70 + Math.sin(i * 1.7) * 18 - i * 2);
    g.stroke();
    texte(g, "TEMPÉRATURE", x + l / 2, y + 14, 11, "#3b3a36", { famille: GRAS, police: "400" });
    salir(g, a, x, y, l, h, 1.5);
  }

  // La station de recharge « Montagne Apaisante » (et Watty, qui n'a jamais été à plat)
  {
    const [x, y, l, h] = R.vr;
    g.fillStyle = "#eeeae0";
    rectArrondi(g, x + 4, y + 4, l - 8, h - 8, 14);
    g.fill();
    g.fillStyle = "#2f6f73";
    g.fillRect(x + 4, y + 4, l - 8, 44);
    texte(g, "MONTAGNE APAISANTE™", x + l / 2, y + 27, 24, "#f1ead7", { espace: 2 });
    texte(g, "station de recharge des casques", x + l / 2, y + 66, 16, "#4e5a58", { famille: SERIF, police: "italic 400" });
    // le pictogramme montagne
    g.fillStyle = "#7da1a0";
    g.beginPath();
    g.moveTo(x + 30, y + 150);
    g.lineTo(x + 70, y + 96);
    g.lineTo(x + 92, y + 124);
    g.lineTo(x + 112, y + 104);
    g.lineTo(x + 140, y + 150);
    g.fill();
    // six batteries à 0 %
    for (let i = 0; i < 6; i++) {
      const bx = x + 160 + (i % 3) * 52;
      const by = y + 92 + Math.floor(i / 3) * 44;
      g.strokeStyle = "#4e5a58";
      g.lineWidth = 2;
      g.strokeRect(bx, by, 38, 18);
      g.fillStyle = "#4e5a58";
      g.fillRect(bx + 38, by + 5, 4, 8);
      texte(g, "0 %", bx + 19, by + 30, 11, "#9a3d33", { famille: GRAS, police: "400" });
    }
    watty(g, x + 352, y + 150, 46);
    texte(g, "Toujours plein, jamais à plat !", x + 200, y + 176, 11, "#7a6a45", { police: "italic 400", famille: SERIF });
    salir(g, a, x, y, l, h, 1.5);
  }

  // Le graffiti des survivants : les gelés se réveillent près du feu (Book 06 §5)
  {
    const [x, y, l, h] = R.graffiti;
    g.save();
    g.globalAlpha = 0.92;
    texte(g, "GELÉS SUR LES CHAISES", x + l / 2, y + 40, 40, "#7a2b23", { famille: GRAS, police: "900", rotation: -0.03 });
    texte(g, "PAS DE FEU ICI !", x + l / 2 + 20, y + 92, 34, "#7a2b23", { famille: GRAS, police: "900", rotation: 0.02 });
    g.restore();
    g.fillStyle = "rgba(122, 43, 35, 0.75)";
    for (let i = 0; i < 12; i++) g.fillRect(x + 40 + a() * (l - 80), y + 60 + a() * 10, 3, 10 + a() * 22);
    g.strokeStyle = "rgba(122, 43, 35, 0.9)";
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(x + 30, y + 100);
    g.lineTo(x + 80, y + 100);
    g.moveTo(x + 64, y + 86);
    g.lineTo(x + 82, y + 100);
    g.lineTo(x + 64, y + 114);
    g.stroke();
  }

  // La longue-vue de l'Abondance : PANORAMA+
  {
    const [x, y, l, h] = R.panorama;
    g.fillStyle = "#f1ece0";
    rectArrondi(g, x + 4, y + 4, l - 8, h - 8, 16);
    g.fill();
    g.fillStyle = "#c8362b";
    g.beginPath();
    g.arc(x + 64, y + 64, 40, 0, 7);
    g.fill();
    texte(g, "+", x + 64, y + 66, 56, "#f1ece0", { famille: GRAS, police: "900" });
    texte(g, "PANORAMA+", x + 290, y + 50, 46, "#2f6f73", { espace: 3 });
    texte(g, "2 Wh la minute · approchez votre bracelet", x + 290, y + 92, 18, "#5d5a52", { famille: SERIF, police: "italic 400" });
    salir(g, a, x, y, l, h, 1.5);
  }

  // Les châssis d'acier des fenêtres et des portes-fenêtres (transparents entre les fers)
  const chassis = (r, imposte, meneau, allege, casse = false) => {
    const [x, y, l, h] = r;
    g.fillStyle = "#4d5955";
    g.fillRect(x, y, l, 6);
    g.fillRect(x, y + h - 6, l, 6);
    g.fillRect(x, y, 6, h);
    g.fillRect(x + l - 6, y, 6, h);
    g.fillRect(x, y + h * imposte - 3, l, 5);
    if (meneau) g.fillRect(x + l / 2 - 2, y + h * imposte, 4, h * (1 - imposte));
    if (allege) g.fillRect(x, y + h * (1 - allege), l, h * allege);
    if (casse) {
      g.save();
      g.globalCompositeOperation = "destination-out";
      g.fillRect(x + l / 2 - 4, y + h * imposte + 10, 8, h * 0.4);
      g.restore();
      g.save();
      g.translate(x + l / 2, y + h * imposte + 10);
      g.rotate(0.6);
      g.fillStyle = "#4d5955";
      g.fillRect(-2, 0, 4, h * 0.45);
      g.restore();
    }
  };
  chassis(R.chassisF, 0.3, true, 0);
  chassis(R.chassisP, 0.2, false, 0.24);
  chassis(R.chassisCasse, 0.3, true, 0, true);

  // ACCUEIL · CURE DÉTOX
  {
    const [x, y, l, h] = R.accueil;
    g.fillStyle = "#ece4cf";
    g.fillRect(x + 2, y + 2, l - 4, h - 4);
    g.fillStyle = "#2f6f73";
    g.fillRect(x + 2, y + h - 22, l - 4, 20);
    texte(g, "ACCUEIL", x + l / 2, y + 48, 44, "#2c3b3a", { espace: 10 });
    texte(g, "Cure Détox Digitale Premium", x + l / 2, y + 92, 16, "#6f6a5c", { famille: SERIF, police: "italic 400" });
    salir(g, a, x, y, l, h, 1.3);
  }

  // La verrière de la cage d'escalier : pavés de verre dans un quadrillage
  {
    const [x, y, l, h] = R.verriere;
    for (let i = 0; i < 6; i++) for (let j = 0; j < 12; j++) {
      const v = 150 + Math.floor(a() * 50);
      const casse = a() < 0.1;
      g.fillStyle = casse ? "#1f2526" : `rgb(${v - 10},${v + 10},${v + 14})`;
      g.fillRect(x + i * 21 + 2, y + j * 21 + 2, 18, 18);
    }
  }
}
