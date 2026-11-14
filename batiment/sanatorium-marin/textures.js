// Le sanatorium marin des Courlis : couleurs, matières, textures (tuiles, carreaux de ciment, mosaïque, sable) et
// l'atlas (fresques naïves, enseignes, panneaux de « ThalassoLuxe Connect », lambrequins, vitrail, marelle).
// Tout ce qui porte une image passe par UN atlas : une seule matière, un seul appel de dessin par chantier.

import * as THREE from "three";
import { PALETTE, MAT, matiere, matiereMonde, matiereTexture, matiereVerre, matiereEau, dessiner, taches, aleatoire } from "../commun/atelier.js";

// ---------- Couleurs du lieu (le sel et le soleil ont tout pâli) ----------

export const COUL = {
  brique: 0xe6cba4, // brique claire de la côte, presque blonde
  enduit: 0xe8e1d0, // bandeaux, chaînages, encadrements
  enduitGris: 0xb9b3a5, // soubassement
  enduitChapelle: 0xece6d8,
  interieur: 0xd9dccb, // vert d'eau très pâle des salles
  interieurBas: 0x9fbcb3, // soubassement peint des salles (vert d'eau soutenu)
  plafond: 0xd8d3c4,
  tuile: 0xb8714f,
  tuileSombre: 0x96583f,
  menuiserie: 0x6f9298, // menuiseries peintes bleu-vert, passées
  menuiserieClaire: 0xa9c1bf,
  fer: 0xdcd8cc, // lits d'enfants en fer peint en blanc
  ferBleu: 0x8fb1c4,
  fonte: 0x56625f, // colonnes de la galerie
  zinc: PALETTE.zinc,
  bois: 0x8b7a62,
  boisGris: 0xa49b8a, // bois flotté, planches lavées par le sel
  boisSombre: 0x5c4936,
  sable: 0xdccca5,
  sableSec: 0xe4d6b2,
  sableHumide: 0xb3a07d,
  herbe: 0x9aa36a,
  oyat: 0xb9b27a,
  oyatVert: 0x8f9a5c,
  beton: 0xb5afa2,
  ciment: 0xddd3bf,
  mosaique: 0xc3dad8,
  mer: 0x7fb0aa,
  matelas: 0xc9bf9f,
  draps: 0xe0dccd,
  plaids: [0xb26b5a, 0x6f8f9f, 0xc9a85a, 0x8a9a6a, 0x9c7a8c, 0x5f7f8a],
  jouets: [0xc65a46, 0x4f86b0, 0xd9b542, 0x5f9a6a],
  cuir: 0x7a5136,
  noir: 0x26282a,
  canard: 0x2f6f73,
  creme: 0xe9dfc6,
  rouille: PALETTE.rouille,
};

// ---------- L'atlas ----------

export const AL = 1024;
export const AH = 1280;

/** Régions de l'atlas : [x, y, l, h] en pixels. */
export const R = {
  titre: [0, 0, 1024, 128],
  thalasso: [0, 128, 1024, 192],
  baleine: [0, 320, 512, 256],
  bateau: [512, 320, 512, 256],
  phare: [0, 576, 256, 256],
  poissons: [256, 576, 512, 128],
  vr: [768, 576, 256, 384],
  borne: [256, 704, 256, 160],
  dessins: [512, 704, 256, 256],
  lambrequin: [0, 832, 256, 64],
  refectoire: [0, 896, 256, 64],
  pharmacie: [256, 896, 256, 64],
  lingerie: [0, 960, 256, 64],
  bains: [256, 960, 256, 64],
  gym: [512, 960, 256, 64],
  vitrail: [768, 960, 128, 320],
  oculus: [896, 960, 128, 128],
  graffiti: [0, 1024, 512, 128],
  marelle: [512, 1024, 256, 256],
  plongee: [896, 1088, 128, 192],
  cabine: [0, 1152, 128, 128],
  coquillages: [128, 1152, 384, 128],
};

let MATS = null;

/** Les matières du lieu, créées une seule fois et partagées par les deux cartes. */
export function matieres() {
  if (MATS) return MATS;
  const atlas = dessiner("sanamarin-atlas", AL, AH, dessinerAtlas, false);
  const tex = (cle, l, h, f, tuile, options) => {
    const m = matiereTexture(dessiner(cle, l, h, f), options);
    m.userData.tuile = tuile;
    return m;
  };
  const enseignes = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.85, alphaTest: 0.5, side: THREE.DoubleSide });
  const ecran = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 0.9, vertexColors: true, roughness: 0.4, alphaTest: 0.5 });
  ecran.userData.sansOmbre = true;
  const ecume = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, transparent: true, opacity: 0.7, depthWrite: false });
  ecume.userData.sansOmbre = true;
  // Le sable ne projette pas d'ombre : ses grandes facettes s'ombraient elles-mêmes (acné en dents de scie)
  const sable = tex("sanamarin-sable", 256, 256, dessinerSable, 4, { roughness: 1 });
  sable.userData.sansOmbre = true;
  MATS = {
    brique: matiereMonde("brique"),
    enduit: matiereMonde("enduit"),
    tuiles: tex("sanamarin-tuiles", 256, 256, dessinerTuiles, 2, { roughness: 0.9 }),
    ciment: tex("sanamarin-ciment", 256, 256, dessinerCiment, 1.6, { roughness: 0.7 }),
    mosaique: tex("sanamarin-mosaique", 256, 256, dessinerMosaique, 1, { roughness: 0.5 }),
    sable,
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    mer: matiereEau(COUL.mer, 0.72),
    ecume,
    enseignes,
    ecran,
    mat: matiere(0.95),
    satin: matiere(0.6, 0.05),
    lisse: matiere(0.3, 0.05),
    tole: MAT.tole(),
    toile: MAT.toile(),
  };
  return MATS;
}

/** Un panneau plat dont l'image vient de l'atlas (région `r`), face vers +z local. `flou` : pas d'image, un aplat. */
export function panneau(c, mat, r, pose, l, h) {
  const g = new THREE.PlaneGeometry(l, h);
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
  c.poser(g, mat, 0xffffff, pose, { crasse: false, nuance: 0 });
  g.dispose();
}

// ---------- Outils de dessin ----------

function texte(g, t, x, y, taille, couleur, police = "900", align = "center", famille = '"Arial Black", "Helvetica Neue", Arial, sans-serif') {
  g.font = `${police} ${taille}px ${famille}`;
  g.fillStyle = couleur;
  g.textAlign = align;
  g.textBaseline = "middle";
  g.fillText(t, x, y);
}

/** La peinture s'écaille : des plaques d'enduit nu, bordées d'une ombre, et de petites lacunes. */
function ecailler(g, a, x, y, l, h, n, fond = "#e6dfcf") {
  g.save();
  g.beginPath();
  g.rect(x, y, l, h);
  g.clip();
  for (let i = 0; i < n; i++) {
    const cx = x + a() * l;
    const cy = y + a() * h;
    const r = 4 + a() * Math.min(l, h) * 0.14;
    g.beginPath();
    for (let k = 0; k < 9; k++) {
      const an = (k / 9) * Math.PI * 2;
      const rr = r * (0.5 + a() * 0.7);
      g.lineTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr * 0.8);
    }
    g.closePath();
    g.fillStyle = "rgba(90,80,60,0.35)";
    g.save();
    g.translate(1.5, 1.5);
    g.fill();
    g.restore();
    g.fillStyle = fond;
    g.fill();
  }
  // Coulures de sel et d'humidité
  for (let i = 0; i < l / 14; i++) {
    const cx = x + a() * l;
    const lg = h * (0.2 + a() * 0.7);
    const d = g.createLinearGradient(0, y, 0, y + lg);
    d.addColorStop(0, "rgba(80,70,50,0.25)");
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(cx, y, 2 + a() * 5, lg);
  }
  g.restore();
}

function vagues(g, x, y, l, amp, pas, couleur, ep = 4) {
  g.strokeStyle = couleur;
  g.lineWidth = ep;
  g.lineCap = "round";
  g.beginPath();
  for (let u = 0; u <= l; u += 4) g.lineTo(x + u, y + Math.sin((u / pas) * Math.PI * 2) * amp);
  g.stroke();
}

function soleil(g, x, y, r) {
  g.fillStyle = "#e8b84a";
  g.beginPath();
  g.arc(x, y, r, 0, 7);
  g.fill();
  g.strokeStyle = "#e8b84a";
  g.lineWidth = 4;
  for (let i = 0; i < 10; i++) {
    const an = (i / 10) * Math.PI * 2;
    g.beginPath();
    g.moveTo(x + Math.cos(an) * r * 1.3, y + Math.sin(an) * r * 1.3);
    g.lineTo(x + Math.cos(an) * r * 1.8, y + Math.sin(an) * r * 1.8);
    g.stroke();
  }
  // Un sourire de soleil, comme les dessinaient les enfants
  g.strokeStyle = "#8a5a2a";
  g.lineWidth = 3;
  g.beginPath();
  g.arc(x, y + 2, r * 0.5, 0.2, Math.PI - 0.2);
  g.stroke();
  g.fillStyle = "#8a5a2a";
  g.fillRect(x - r * 0.35, y - r * 0.3, 4, 4);
  g.fillRect(x + r * 0.25, y - r * 0.3, 4, 4);
}

function poisson(g, x, y, s, couleur, sens = 1) {
  g.fillStyle = couleur;
  g.beginPath();
  g.ellipse(x, y, s, s * 0.5, 0, 0, 7);
  g.fill();
  g.beginPath();
  g.moveTo(x - sens * s * 0.8, y);
  g.lineTo(x - sens * s * 1.5, y - s * 0.5);
  g.lineTo(x - sens * s * 1.5, y + s * 0.5);
  g.fill();
  g.fillStyle = "#2b2b2b";
  g.beginPath();
  g.arc(x + sens * s * 0.5, y - s * 0.1, s * 0.1, 0, 7);
  g.fill();
}

// ---------- L'atlas ----------

function dessinerAtlas(g) {
  const a = aleatoire(1896);
  g.clearRect(0, 0, AL, AH);

  // Le nom du sanatorium, en lettres de ciment moulé sur le bandeau d'enduit (un R tombé, sa trace reste)
  {
    const [x, y, l, h] = R.titre;
    g.fillStyle = "#e6dfcd";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "rgba(120,110,90,0.5)";
    g.lineWidth = 3;
    g.strokeRect(x + 6, y + 6, l - 12, h - 12);
    // le R est tombé : il ne reste que sa trace, plus claire, sur l'enduit
    g.font = '900 60px "Arial Black", "Helvetica Neue", Arial, sans-serif';
    const morceaux = [["SANATORIUM MARIN DES COU", "#7d8f8c"], ["R", "rgba(120,108,88,0.28)"], ["LIS", "#7d8f8c"]];
    const total = morceaux.reduce((s, [t]) => s + g.measureText(t).width, 0);
    let px = x + (l - total) / 2;
    for (const [t, coul] of morceaux) {
      texte(g, t, px, y + 58, 60, coul, "900", "left");
      px += g.measureText(t).width;
    }
    texte(g, "· HÔPITAL DES ENFANTS · 1896 ·", x + l / 2, y + 104, 22, "#8a8676", "700");
    ecailler(g, a, x, y, l, h, 30, "#ddd5c2");
  }

  // ThalassoLuxe Connect : le panneau neuf collé par-dessus les fresques (bâche imprimée, coins décollés)
  {
    const [x, y, l, h] = R.thalasso;
    const d = g.createLinearGradient(x, y, x + l, y + h);
    d.addColorStop(0, "#2f6f73");
    d.addColorStop(1, "#1f4d58");
    g.fillStyle = d;
    g.fillRect(x, y, l, h);
    // le logo : une vague stylisée dans un cercle, et un signal de réseau
    g.strokeStyle = "#e9dfc6";
    g.lineWidth = 6;
    g.beginPath();
    g.arc(x + 100, y + 96, 62, 0, 7);
    g.stroke();
    vagues(g, x + 52, y + 104, 96, 12, 48, "#c79a3b", 8);
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.arc(x + 100, y + 70, 12 + i * 12, -2.3, -0.85);
      g.stroke();
    }
    texte(g, "ThalassoLuxe", x + 190, y + 72, 64, "#e9dfc6", "900", "left");
    texte(g, "CONNECT", x + 640, y + 72, 46, "#c79a3b", "900", "left");
    texte(g, "La mer, en mieux. Soins pilotés par application.", x + 192, y + 132, 26, "#e9dfc6", "italic 600", "left", "Georgia, serif");
    texte(g, "Téléchargez l'appli pour accéder à l'océan", x + 192, y + 166, 20, "rgba(233,223,198,0.75)", "600", "left", "Arial, sans-serif");
    // décollée et délavée : un coin replié, des traînées de sel
    g.fillStyle = "rgba(233,223,198,0.18)";
    for (let i = 0; i < 12; i++) g.fillRect(x + a() * l, y, 3 + a() * 8, h);
    g.fillStyle = "#e6dfcf";
    g.beginPath();
    g.moveTo(x + l, y);
    g.lineTo(x + l - 90, y);
    g.lineTo(x + l, y + 70);
    g.fill();
    g.fillStyle = "#c8c0ad";
    g.beginPath();
    g.moveTo(x + l - 90, y);
    g.lineTo(x + l, y + 70);
    g.lineTo(x + l - 70, y + 60);
    g.fill();
  }

  // Fresque : la baleine qui souffle, des enfants dans des barques, des vagues
  {
    const [x, y, l, h] = R.baleine;
    g.fillStyle = "#cfe1dd";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#8fc0c8";
    g.fillRect(x, y + 150, l, h - 150);
    for (let k = 0; k < 4; k++) vagues(g, x, y + 150 + k * 24, l, 6, 40, "#5f9fb0", 4);
    soleil(g, x + 430, y + 56, 26);
    // la baleine
    g.fillStyle = "#4f7ea8";
    g.beginPath();
    g.ellipse(x + 200, y + 158, 130, 52, 0, Math.PI, 0);
    g.lineTo(x + 330, y + 170);
    g.lineTo(x + 70, y + 170);
    g.fill();
    g.beginPath();
    g.moveTo(x + 70, y + 150);
    g.lineTo(x + 18, y + 104);
    g.lineTo(x + 40, y + 150);
    g.lineTo(x + 14, y + 180);
    g.fill();
    g.fillStyle = "#f2efe6";
    g.beginPath();
    g.arc(x + 290, y + 140, 9, 0, 7);
    g.fill();
    g.fillStyle = "#222";
    g.beginPath();
    g.arc(x + 292, y + 141, 4, 0, 7);
    g.fill();
    g.strokeStyle = "#2a3f55";
    g.lineWidth = 3;
    g.beginPath();
    g.arc(x + 300, y + 150, 20, 0.3, 1.4);
    g.stroke();
    // le jet
    g.strokeStyle = "#e8f4f6";
    g.lineWidth = 5;
    for (const dx of [-14, 0, 14]) {
      g.beginPath();
      g.moveTo(x + 230, y + 108);
      g.quadraticCurveTo(x + 230 + dx, y + 60, x + 230 + dx * 2.4, y + 52);
      g.stroke();
    }
    // une barque et deux têtes d'enfants
    g.fillStyle = "#b5573f";
    g.beginPath();
    g.moveTo(x + 380, y + 170);
    g.lineTo(x + 480, y + 170);
    g.lineTo(x + 465, y + 192);
    g.lineTo(x + 395, y + 192);
    g.fill();
    for (const dx of [405, 440]) {
      g.fillStyle = "#e3b48c";
      g.beginPath();
      g.arc(x + dx, y + 158, 10, 0, 7);
      g.fill();
    }
    poisson(g, x + 120, y + 222, 16, "#d9b542");
    poisson(g, x + 420, y + 230, 13, "#c65a46", -1);
    ecailler(g, a, x, y, l, h, 70);
  }

  // Fresque : le voilier, les mouettes, l'île
  {
    const [x, y, l, h] = R.bateau;
    g.fillStyle = "#d8e6e2";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#7fb4bd";
    g.fillRect(x, y + 160, l, h - 160);
    for (let k = 0; k < 3; k++) vagues(g, x, y + 168 + k * 28, l, 5, 52, "#4f8fa0", 4);
    g.fillStyle = "#8aa56a";
    g.beginPath();
    g.ellipse(x + 420, y + 162, 70, 26, 0, Math.PI, 0);
    g.fill();
    g.fillStyle = "#6f8f4f";
    g.fillRect(x + 412, y + 110, 8, 30);
    g.beginPath();
    g.arc(x + 416, y + 106, 18, 0, 7);
    g.fill();
    // le voilier
    g.fillStyle = "#6a4f3a";
    g.beginPath();
    g.moveTo(x + 120, y + 168);
    g.lineTo(x + 280, y + 168);
    g.lineTo(x + 255, y + 196);
    g.lineTo(x + 140, y + 196);
    g.fill();
    g.fillRect(x + 196, y + 40, 6, 130);
    g.fillStyle = "#f2ece0";
    g.beginPath();
    g.moveTo(x + 204, y + 46);
    g.lineTo(x + 272, y + 156);
    g.lineTo(x + 204, y + 156);
    g.fill();
    g.fillStyle = "#c65a46";
    g.beginPath();
    g.moveTo(x + 194, y + 60);
    g.lineTo(x + 130, y + 156);
    g.lineTo(x + 194, y + 156);
    g.fill();
    g.fillStyle = "#c65a46";
    g.fillRect(x + 202, y + 36, 22, 10);
    // mouettes
    g.strokeStyle = "#3f4a50";
    g.lineWidth = 3;
    for (const [mx, my] of [[60, 50], [96, 74], [320, 40], [360, 70]]) {
      g.beginPath();
      g.moveTo(x + mx - 12, y + my);
      g.quadraticCurveTo(x + mx - 6, y + my - 8, x + mx, y + my);
      g.quadraticCurveTo(x + mx + 6, y + my - 8, x + mx + 12, y + my);
      g.stroke();
    }
    poisson(g, x + 70, y + 226, 14, "#d9b542");
    poisson(g, x + 300, y + 236, 12, "#5f9a6a", -1);
    ecailler(g, a, x, y, l, h, 70);
  }

  // Fresque : le phare rayé et sa lumière
  {
    const [x, y, l, h] = R.phare;
    g.fillStyle = "#d4e3e0";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#86b6bd";
    g.fillRect(x, y + 190, l, h - 190);
    vagues(g, x, y + 200, l, 5, 40, "#4f8fa0", 4);
    g.fillStyle = "#9a958a";
    g.beginPath();
    g.ellipse(x + 128, y + 196, 70, 18, 0, Math.PI, 0);
    g.fill();
    for (let i = 0; i < 5; i++) {
      g.fillStyle = i % 2 ? "#c65a46" : "#f2ece0";
      const w0 = 26 - i * 2;
      g.fillRect(x + 128 - w0, y + 170 - (i + 1) * 24, w0 * 2, 24);
    }
    g.fillStyle = "#3f4a50";
    g.fillRect(x + 112, y + 34, 32, 18);
    g.fillStyle = "rgba(240,210,110,0.7)";
    g.beginPath();
    g.moveTo(x + 144, y + 42);
    g.lineTo(x + 250, y + 10);
    g.lineTo(x + 250, y + 70);
    g.fill();
    ecailler(g, a, x, y, l, h, 40);
  }

  // Frise de poissons (réfectoire)
  {
    const [x, y, l, h] = R.poissons;
    g.fillStyle = "#cfe1dd";
    g.fillRect(x, y, l, h);
    vagues(g, x, y + 108, l, 6, 36, "#5f9fb0", 5);
    const tons = ["#d9b542", "#c65a46", "#4f86b0", "#5f9a6a"];
    for (let i = 0; i < 9; i++) poisson(g, x + 30 + i * 56, y + 50 + (i % 2) * 22, 16, tons[i % 4], i % 3 ? 1 : -1);
    // une étoile de mer, un crabe
    g.fillStyle = "#d98a5a";
    g.beginPath();
    for (let k = 0; k < 10; k++) {
      const an = (k / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = k % 2 ? 7 : 18;
      g.lineTo(x + 480 + Math.cos(an) * rr, y + 40 + Math.sin(an) * rr);
    }
    g.fill();
    ecailler(g, a, x, y, l, h, 30);
  }

  // « Respirez l'iode en réalité virtuelle » (ThalassoLuxe)
  {
    const [x, y, l, h] = R.vr;
    g.fillStyle = "#e9dfc6";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, l, 150);
    vagues(g, x, y + 120, l, 8, 46, "#c79a3b", 5);
    // le casque
    g.fillStyle = "#1e2326";
    g.beginPath();
    g.roundRect(x + 58, y + 40, 140, 60, 18);
    g.fill();
    g.fillStyle = "#4fb0c0";
    g.fillRect(x + 72, y + 54, 50, 30);
    g.fillRect(x + 134, y + 54, 50, 30);
    texte(g, "RESPIREZ", x + l / 2, y + 186, 34, "#2f6f73", "900");
    texte(g, "L'IODE", x + l / 2, y + 222, 34, "#2f6f73", "900");
    texte(g, "en réalité virtuelle", x + l / 2, y + 258, 22, "#c8362b", "italic 700", "center", "Georgia, serif");
    texte(g, "Séance Océan Premium", x + l / 2, y + 304, 18, "#3b2a1e", "700", "center", "Arial, sans-serif");
    texte(g, "29,90 Wh / 15 min", x + l / 2, y + 330, 18, "#3b2a1e", "700", "center", "Arial, sans-serif");
    g.fillStyle = "rgba(233,223,198,0.3)";
    for (let i = 0; i < 8; i++) g.fillRect(x + a() * l, y, 3 + a() * 6, h);
    taches(g, a, 6, "rgba(110,90,60,0.22)", 10, 30, l, h);
  }

  // L'écran de la borne d'enregistrement (luit la nuit)
  {
    const [x, y, l, h] = R.borne;
    g.fillStyle = "#0d1c22";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "#4fb0c0";
    g.lineWidth = 3;
    g.beginPath();
    g.arc(x + 128, y + 44, 22, 0, 7);
    g.stroke();
    vagues(g, x + 110, y + 48, 36, 5, 18, "#c79a3b", 3);
    texte(g, "Bienvenue, curiste !", x + 128, y + 90, 20, "#bfe6ee", "700", "center", "Arial, sans-serif");
    texte(g, "Scannez votre bracelet", x + 128, y + 116, 17, "#bfe6ee", "600", "center", "Arial, sans-serif");
    g.fillStyle = "#4fb0c0";
    g.fillRect(x + 60, y + 136, 136 * 0.35, 6);
    g.strokeRect(x + 60, y + 136, 136, 6);
  }

  // Dessins d'enfants punaisés (soleils, maisons, bateaux), papiers gondolés
  {
    const [x, y, l, h] = R.dessins;
    g.clearRect(x, y, l, h);
    const feuilles = [[8, 10, 112, 80], [134, 4, 110, 84], [16, 100, 104, 74], [136, 96, 108, 80], [60, 180, 120, 70]];
    feuilles.forEach(([fx, fy, fl, fh], n) => {
      g.save();
      g.translate(x + fx + fl / 2, y + fy + fh / 2);
      g.rotate((a() - 0.5) * 0.2);
      g.fillStyle = n % 2 ? "#ece6d4" : "#e2dcc6";
      g.fillRect(-fl / 2, -fh / 2, fl, fh);
      g.lineWidth = 3;
      if (n % 3 === 0) {
        soleil(g, -fl / 4, -fh / 6, 10);
        g.fillStyle = "#4f86b0";
        g.fillRect(-fl / 2 + 4, fh / 4, fl - 8, fh / 4 - 4);
      } else if (n % 3 === 1) {
        g.fillStyle = "#c65a46";
        g.beginPath();
        g.moveTo(-20, 0);
        g.lineTo(0, -22);
        g.lineTo(20, 0);
        g.fill();
        g.fillStyle = "#d9b542";
        g.fillRect(-16, 0, 32, 22);
        g.fillStyle = "#5f9a6a";
        g.fillRect(-fl / 2 + 4, 22, fl - 8, 6);
      } else {
        g.strokeStyle = "#4f86b0";
        g.beginPath();
        for (let u = -fl / 2 + 4; u < fl / 2 - 4; u += 4) g.lineTo(u, 18 + Math.sin(u / 6) * 4);
        g.stroke();
        g.fillStyle = "#6a4f3a";
        g.fillRect(-18, 6, 36, 8);
        g.fillStyle = "#f2ece0";
        g.beginPath();
        g.moveTo(0, -24);
        g.lineTo(16, 4);
        g.lineTo(0, 4);
        g.fill();
      }
      g.fillStyle = "#b5573f";
      g.beginPath();
      g.arc(0, -fh / 2 + 5, 3, 0, 7);
      g.fill();
      g.fillStyle = "rgba(150,120,70,0.25)";
      g.fillRect(-fl / 2, fh / 4, fl, fh / 4);
      g.restore();
    });
  }

  // Lambrequin : la dentelle de bois découpée au bord de l'auvent (fond transparent)
  {
    const [x, y, l, h] = R.lambrequin;
    g.clearRect(x, y, l, h);
    g.fillStyle = "#e3ddd0";
    g.fillRect(x, y, l, 18);
    const n = 8;
    for (let i = 0; i < n; i++) {
      const cx = x + (i + 0.5) * (l / n);
      if (a() < 0.12) continue; // une dent cassée
      g.beginPath();
      g.moveTo(cx - l / n / 2, y + 17);
      g.lineTo(cx + l / n / 2, y + 17);
      g.lineTo(cx + 6, y + 46);
      g.arc(cx, y + 50, 7, 0, Math.PI);
      g.lineTo(cx - 6, y + 46);
      g.fill();
    }
    g.fillStyle = "rgba(0,0,0,0)";
    for (let i = 0; i < n; i++) {
      g.save();
      g.globalCompositeOperation = "destination-out";
      g.beginPath();
      g.arc(x + (i + 0.5) * (l / n), y + 26, 4, 0, 7);
      g.fill();
      g.restore();
    }
  }

  // Les plaques émaillées des salles
  const plaque = (r, t) => {
    const [x, y, l, h] = r;
    g.fillStyle = "#e9e4d6";
    g.fillRect(x, y, l, h);
    g.strokeStyle = "#2f4f6f";
    g.lineWidth = 5;
    g.strokeRect(x + 5, y + 5, l - 10, h - 10);
    texte(g, t, x + l / 2, y + h / 2 + 2, t.length > 12 ? 20 : 26, "#2f4f6f", "900");
    g.fillStyle = "rgba(40,30,20,0.55)";
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.arc(x + a() * l, y + a() * h, 2 + a() * 6, 0, 7);
      g.fill();
    }
  };
  plaque(R.refectoire, "RÉFECTOIRE");
  plaque(R.pharmacie, "INFIRMERIE");
  plaque(R.lingerie, "LINGERIE");
  plaque(R.bains, "BAINS DE MER");
  plaque(R.gym, "GYMNASTIQUE MÉDICALE");

  // Vitrail : une barque, une étoile, des vagues (verre coloré, plombs)
  {
    const [x, y, l, h] = R.vitrail;
    g.fillStyle = "#3a4a52";
    g.fillRect(x, y, l, h);
    const cols = ["#4f86b0", "#7fb4bd", "#d9b542", "#c65a46", "#8fc0a0", "#2f5f8f"];
    for (let j = 0; j < 10; j++) for (let i = 0; i < 4; i++) {
      g.fillStyle = cols[Math.floor(a() * cols.length)];
      g.fillRect(x + 4 + i * 31, y + 4 + j * 31, 27, 27);
    }
    g.fillStyle = "#f0d070";
    g.beginPath();
    for (let k = 0; k < 10; k++) {
      const an = (k / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = k % 2 ? 10 : 24;
      g.lineTo(x + 64 + Math.cos(an) * rr, y + 70 + Math.sin(an) * rr);
    }
    g.fill();
    g.fillStyle = "#8a5a3a";
    g.fillRect(x + 30, y + 220, 70, 16);
    g.fillStyle = "#f2ece0";
    g.beginPath();
    g.moveTo(x + 66, y + 150);
    g.lineTo(x + 92, y + 214);
    g.lineTo(x + 66, y + 214);
    g.fill();
    // l'arc en plein cintre : tout ce qui dépasse est transparent
    g.save();
    g.globalCompositeOperation = "destination-out";
    g.beginPath();
    g.rect(x, y, l, 64);
    g.fill();
    g.restore();
    g.fillStyle = "#3a4a52";
    g.beginPath();
    g.arc(x + 64, y + 64, 64, Math.PI, 0);
    g.fill();
    g.fillStyle = "#7fb4bd";
    g.beginPath();
    g.arc(x + 64, y + 64, 56, Math.PI, 0);
    g.fill();
    g.fillStyle = "#d9b542";
    g.beginPath();
    g.arc(x + 64, y + 64, 22, Math.PI, 0);
    g.fill();
    // carreaux manquants
    g.save();
    g.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 6; i++) g.fillRect(x + 4 + Math.floor(a() * 4) * 31, y + 66 + Math.floor(a() * 8) * 31, 27, 27);
    g.restore();
  }

  // L'oculus de la chapelle (une rose à huit pétales)
  {
    const [x, y, l, h] = R.oculus;
    g.clearRect(x, y, l, h);
    g.fillStyle = "#3a4a52";
    g.beginPath();
    g.arc(x + 64, y + 64, 62, 0, 7);
    g.fill();
    for (let k = 0; k < 8; k++) {
      const an = (k / 8) * Math.PI * 2;
      g.fillStyle = k % 2 ? "#4f86b0" : "#d9b542";
      g.beginPath();
      g.ellipse(x + 64 + Math.cos(an) * 34, y + 64 + Math.sin(an) * 34, 18, 10, an, 0, 7);
      g.fill();
    }
    g.fillStyle = "#c65a46";
    g.beginPath();
    g.arc(x + 64, y + 64, 14, 0, 7);
    g.fill();
  }

  // Graffiti des survivants, à la craie et au charbon
  {
    const [x, y, l, h] = R.graffiti;
    g.clearRect(x, y, l, h);
    texte(g, "ICI ON SOIGNAIT", x + l / 2, y + 36, 40, "rgba(40,36,32,0.85)", "700", "center", '"Comic Sans MS", "Marker Felt", cursive');
    texte(g, "LES ENFANTS AU GRAND AIR", x + l / 2, y + 84, 34, "rgba(40,36,32,0.85)", "700", "center", '"Comic Sans MS", "Marker Felt", cursive');
    g.strokeStyle = "rgba(40,36,32,0.7)";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(x + 60, y + 112);
    g.lineTo(x + l - 60, y + 112);
    g.stroke();
  }

  // Marelle à la craie, sur le carrelage de la galerie (fond transparent)
  {
    const [x, y, l, h] = R.marelle;
    g.clearRect(x, y, l, h);
    g.strokeStyle = "rgba(245,242,235,0.85)";
    g.lineWidth = 4;
    const cases = [[96, 200], [96, 152], [72, 104], [120, 104], [96, 56]];
    for (const [cx, cy] of cases) g.strokeRect(x + cx, y + cy, 48, 48);
    g.beginPath();
    g.arc(x + 120, y + 56, 30, Math.PI, 0);
    g.stroke();
    ["1", "2", "3", "4", "5"].forEach((t, i) => texte(g, t, x + cases[i][0] + 24, y + cases[i][1] + 26, 22, "rgba(245,242,235,0.8)", "700", "center", "Arial"));
    texte(g, "CIEL", x + 120, y + 40, 16, "rgba(245,242,235,0.8)", "700", "center", "Arial");
  }

  // Panneau de plongée ThalassoLuxe : « Bassin de flottaison connectée »
  {
    const [x, y, l, h] = R.plongee;
    g.fillStyle = "#e9dfc6";
    g.fillRect(x, y, l, h);
    g.fillStyle = "#2f6f73";
    g.fillRect(x, y, l, 40);
    texte(g, "BASSIN", x + l / 2, y + 22, 20, "#e9dfc6", "900");
    texte(g, "Flottaison", x + l / 2, y + 66, 18, "#2f6f73", "800", "center", "Arial");
    texte(g, "connectée", x + l / 2, y + 88, 18, "#2f6f73", "800", "center", "Arial");
    texte(g, "Bracelet", x + l / 2, y + 126, 15, "#c8362b", "700", "center", "Arial");
    texte(g, "obligatoire", x + l / 2, y + 146, 15, "#c8362b", "700", "center", "Arial");
    g.fillStyle = "rgba(110,90,60,0.3)";
    g.fillRect(x, y + h - 30, l, 30);
  }

  // Numéro de cabine
  {
    const [x, y, l, h] = R.cabine;
    g.fillStyle = "#e9e4d6";
    g.beginPath();
    g.ellipse(x + 64, y + 64, 58, 44, 0, 0, 7);
    g.fill();
    g.strokeStyle = "#2f4f6f";
    g.lineWidth = 6;
    g.stroke();
    texte(g, "7", x + 64, y + 68, 60, "#2f4f6f", "900");
  }

  // Coquillages et étoiles de mer collés par les enfants (bordure de fresque)
  {
    const [x, y, l, h] = R.coquillages;
    g.clearRect(x, y, l, h);
    for (let i = 0; i < 14; i++) {
      const cx = x + 14 + i * 26 + a() * 6;
      const cy = y + 40 + a() * 50;
      g.fillStyle = ["#efe2cf", "#e6c7b0", "#d9b542", "#c9a07a"][i % 4];
      g.beginPath();
      if (i % 3 === 0) {
        for (let k = 0; k < 10; k++) {
          const an = (k / 10) * Math.PI * 2;
          const rr = k % 2 ? 5 : 12;
          g.lineTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr);
        }
      } else {
        g.moveTo(cx, cy + 10);
        g.arc(cx, cy, 11, Math.PI * 0.9, Math.PI * 2.1);
      }
      g.fill();
    }
  }
}

// ---------- Textures « monde » ----------

/** Tuiles mécaniques orangées, lichens jaunes et blancs du bord de mer. Tuile de 2 m. */
function dessinerTuiles(g) {
  const a = aleatoire(31);
  g.fillStyle = "#cdbfb0";
  g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 8; r++) {
    const dec = r % 2 ? 16 : 0;
    for (let x = -32; x < 288; x += 32) {
      const v = 225 + Math.floor((a() - 0.5) * 40);
      g.fillStyle = `rgb(${v},${v - 12},${v - 22})`;
      g.fillRect(x + dec + 1, r * 32 + 1, 30, 30);
      g.fillStyle = "rgba(0,0,0,0.12)";
      g.fillRect(x + dec + 9, r * 32 + 2, 3, 28);
      g.fillRect(x + dec + 20, r * 32 + 2, 3, 28);
      g.fillStyle = "rgba(0,0,0,0.22)";
      g.fillRect(x + dec + 1, r * 32 + 27, 30, 4);
    }
  }
  taches(g, a, 26, "rgba(220,200,90,0.45)", 3, 9, 256, 256);
  taches(g, a, 18, "rgba(245,245,235,0.45)", 3, 8, 256, 256);
  taches(g, a, 10, "rgba(60,60,40,0.2)", 10, 30, 256, 256);
}

/** Carreaux de ciment à motif de quatre-feuilles, usés au passage des lits. Tuile de 1,6 m. */
function dessinerCiment(g) {
  const a = aleatoire(32);
  g.fillStyle = "#9c968a";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    const x = i * 32;
    const y = j * 32;
    const v = 232 + Math.floor((a() - 0.5) * 16);
    g.fillStyle = `rgb(${v},${v - 6},${v - 16})`;
    g.fillRect(x + 1, y + 1, 30, 30);
    // le motif : un quart de rosace à chaque coin, qui forme des fleurs avec les voisins
    g.fillStyle = "rgba(170,120,80,0.55)";
    for (const [cx, cy] of [[x, y], [x + 32, y], [x, y + 32], [x + 32, y + 32]]) {
      g.beginPath();
      g.arc(cx, cy, 10, 0, 7);
      g.fill();
    }
    g.fillStyle = "rgba(80,110,120,0.5)";
    g.beginPath();
    g.moveTo(x + 16, y + 6);
    g.lineTo(x + 26, y + 16);
    g.lineTo(x + 16, y + 26);
    g.lineTo(x + 6, y + 16);
    g.fill();
  }
  taches(g, a, 14, "rgba(90,80,60,0.22)", 8, 34, 256, 256);
  taches(g, a, 8, "rgba(230,220,190,0.4)", 10, 30, 256, 256);
}

/** Petite mosaïque de pâte de verre (bassin), lignes de nage bleues. Tuile de 1 m. */
function dessinerMosaique(g) {
  const a = aleatoire(33);
  g.fillStyle = "#b8bdb8";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) {
    const v = 238 + Math.floor((a() - 0.5) * 18);
    const bleu = a() < 0.08;
    g.fillStyle = bleu ? "#6f9fb8" : `rgb(${v - 6},${v},${v})`;
    g.fillRect(i * 16 + 1, j * 16 + 1, 14, 14);
  }
  taches(g, a, 16, "rgba(90,100,70,0.25)", 8, 36, 256, 256);
}

/** Sable : grain fin, rides laissées par le vent. Tuile de 4 m. */
function dessinerSable(g) {
  const a = aleatoire(34);
  g.fillStyle = "#f0ece4";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = a() < 0.5 ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)";
    g.fillRect(a() * 256, a() * 256, 1 + a() * 2, 1 + a() * 2);
  }
  g.strokeStyle = "rgba(120,100,70,0.12)";
  g.lineWidth = 2;
  for (let r = 0; r < 18; r++) {
    g.beginPath();
    const y0 = r * 14 + a() * 6;
    for (let x = 0; x <= 256; x += 8) g.lineTo(x, y0 + Math.sin(x / 22 + r) * 4);
    g.stroke();
  }
}
