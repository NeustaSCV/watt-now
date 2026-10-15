// Le Grand Hôtel des Flots : couleurs, matières et atlas (enseignes, ferronneries, persiennes, affiches).
// Tout ce qui porte une image passe par UN atlas (une seule matière, un seul appel de dessin par chantier).

import * as THREE from "three";
import { PALETTE, matiere, matiereMonde, matiereTexture, matiereVerre, matiereEau, dessiner, taches, aleatoire } from "../commun/atelier.js";

// ---------- Couleurs du lieu (un peu passées, le sel a tout mangé) ----------

export const COUL = {
  creme: 0xe6d7b4, // l'enduit crème de la façade
  cremeOmbre: 0xcdbd98,
  modenature: 0xeee3c8, // corniches, bandeaux, pilastres : un ton plus clair
  soubassement: 0xb5a88d,
  papier: 0xd8c7a4, // papier peint des salons
  papierRose: 0xd7b5a5,
  papierVert: 0xb8c4a2,
  faience: 0xdfe6df,
  ardoise: 0x5c656d,
  zinc: 0x8f989b,
  zincVert: 0x7dab96, // la coupole, vert-de-gris
  zincVertSombre: 0x5f8a78,
  fer: 0x2e3b36, // ferronnerie vert bronze presque noire
  ferRouille: 0x7a4a2e,
  laiton: 0xb59048,
  marbre: 0xe8e3d8,
  marbreRose: 0xcfb2a6,
  marbreNoir: 0x34302e,
  bois: 0x7a5a3c,
  boisSombre: 0x4e3626,
  boisClair: 0xa58a66,
  velours: 0x7d3a40,
  veloursVert: 0x3f5a48,
  nappe: 0xe9e3d3,
  linge: 0xeee9dc,
  sable: 0xdcc69a,
  sableClair: 0xe6d5ac,
  sableMouille: 0xa7926b,
  dalle: 0xd2c6ad,
  dalleGrise: 0xb3ab9c,
  inox: 0xb9bdbd,
  fonte: 0x3a3a38,
  sombre: 0x2b2622, // l'intérieur des étages, vu par les fenêtres
  mer: 0x3f7680,
  eauPiscine: 0x3d5a2c,
  carreauPiscine: 0x7fb6c6,
  abondanceRouge: PALETTE.abondanceRouge,
  abondanceCreme: PALETTE.abondanceCreme,
};

// ---------- L'atlas ----------

export const AL = 1024;
export const AH = 2048; // 0.10 (R52) : une bande de plus, en bas, pour le panneau de sortie, les ganivelles, la mer, le damier du hall

/** Les régions de l'atlas : [x, y, l, h] en pixels. */
export const R = {
  lettres: [0, 0, 1024, 96],
  frise: [0, 96, 1024, 96],
  balcon: [0, 192, 512, 128],
  balconTordu: [512, 192, 512, 128],
  persienne: [0, 320, 128, 256],
  persienneB: [128, 320, 128, 256],
  grille: [256, 320, 256, 256],
  rayuresR: [512, 320, 128, 256],
  rayuresB: [640, 320, 128, 256],
  cles: [768, 320, 256, 256],
  zeroEffort: [0, 576, 256, 384],
  sourire: [256, 576, 256, 256],
  robot: [256, 832, 128, 128],
  watty: [384, 832, 128, 128],
  bainsDeMer: [512, 576, 256, 384],
  menu: [768, 576, 256, 192],
  lettreS: [768, 768, 128, 128],
  froid: [896, 768, 128, 128],
  buvette: [0, 960, 512, 128],
  piscine: [512, 960, 512, 128],
  graffiti: [0, 1088, 512, 160],
  tableau: [512, 1088, 256, 192],
  reception: [768, 1088, 256, 96],
  bar: [768, 1184, 256, 96],
  lingerie: [512, 1280, 256, 64],
  cuisine: [768, 1280, 256, 64],
  miroir: [0, 1248, 256, 192],
  // Les fenêtres des étages, peintes (vitres poussiéreuses, cassées, battant ouvert, vitres parties)
  balustrade: [256, 1248, 256, 96],
  fenA: [512, 1344, 128, 192],
  fenB: [640, 1344, 128, 192],
  fenC: [768, 1344, 128, 192],
  fenD: [896, 1344, 128, 192],
  // 0.10 (R52, retouches) : le panneau de sortie, la ganivelle, les oyats, le damier du hall, la mer, des aplats
  panneauSortie: [0, 1536, 512, 256],
  ganivelle: [512, 1536, 256, 128],
  oyats: [768, 1536, 128, 128],
  damier: [896, 1536, 128, 128],
  mer: [520, 1676, 240, 104], // lue en retrait : peinte sur [512, 1664, 256, 128]
  vitrines: [0, 1792, 512, 128],
  // des aplats (peints plus grands que la région lue : pas de bavure de couleur voisine au loin)
  blanc: [544, 1824, 192, 192], // blanc, teinté par la couleur des sommets (la mer, les toits, les façades de la rue)
  bois: [784, 1808, 96, 96], // le bois des poteaux du panneau
  fer: [912, 1808, 96, 96], // le fer noirci de la lanterne
};
const APLATS = [[[512, 1792, 256, 256], "#ffffff"], [[768, 1792, 128, 256], "#5b4632"], [[896, 1792, 128, 256], "#2b2926"]];

let MATS = null;

/** Les matières du lieu, créées une fois et partagées par les deux cartes. */
export function matieres() {
  if (MATS) return MATS;
  const atlas = dessiner("hotel-atlas", AL, AH, dessinerAtlas, false);
  const pele = matiereTexture(dessiner("hotel-enduit-pele", 512, 512, dessinerEnduitPele), { roughness: 0.92 });
  pele.userData.tuile = 5;
  const sable = matiereTexture(dessiner("hotel-sable", 256, 256, dessinerSable), { roughness: 1 });
  sable.userData.tuile = 4;
  const enseignes = new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.85, alphaTest: 0.5, side: THREE.DoubleSide });
  const neon = new THREE.MeshStandardMaterial({ map: atlas, emissiveMap: atlas, emissive: 0xffffff, emissiveIntensity: 0.9, vertexColors: true, roughness: 0.5, alphaTest: 0.5, side: THREE.DoubleSide });
  neon.userData.sansOmbre = true;
  MATS = {
    atlas,
    pele,
    sable,
    dalle: matiereMonde("pierreTaille"),
    papier: matiereMonde("papierPeint"),
    parquet: matiereMonde("parquet"),
    damier: matiereMonde("damier"),
    carrelage: matiereMonde("carrelage"),
    ardoise: matiereMonde("ardoise"),
    verre: matiereVerre(PALETTE.verreSombre, 0.4),
    eau: matiereEau(0xffffff, 0.86),
    enseignes,
    neon,
    mat: matiere(0.95, 0),
    satin: matiere(0.6, 0.05),
    lisse: matiere(0.3, 0.05),
    lisseVrai: matiere(0.3, 0.05),
    tole: matiere(0.75, 0.3),
    metal: matiere(0.4, 0.7),
  };
  return MATS;
}

// ---------- Poser une image de l'atlas ----------

/** Recadre les UV [0, 1] d'une géométrie sur une région de l'atlas. */
export function uvAtlas(g, r) {
  const uv = g.attributes.uv;
  const [px, py, pw, ph] = r;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (px + uv.getX(i) * pw) / AL, 1 - (py + (1 - uv.getY(i)) * ph) / AH);
  return g;
}

/** Un panneau plat dont l'image vient de l'atlas (région `r`), face vers +z local. */
export function panneau(c, mat, r, pose, l, h, teinte = 0xffffff) {
  const g = uvAtlas(new THREE.PlaneGeometry(l, h), r);
  c.poser(g, mat, teinte, pose, { crasse: false, nuance: 0 });
  g.dispose();
}

// ---------- Textures dessinées ----------

const SERIF = '"Didot", "Bodoni 72", "Playfair Display", Georgia, "Times New Roman", serif';
const SANS = '"Arial Black", "Helvetica Neue", Arial, sans-serif';

function grain(g, a, n, x, y, l, h, force = 0.06) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = a() < 0.5 ? `rgba(0,0,0,${force})` : `rgba(255,255,255,${force})`;
    g.fillRect(x + a() * l, y + a() * h, 1 + a() * 2.5, 1 + a() * 2.5);
  }
}

function salir(g, a, x, y, l, h, force = 1) {
  g.save();
  g.beginPath();
  g.rect(x, y, l, h);
  g.clip();
  grain(g, a, (l * h) / 200, x, y, l, h, 0.05 * force);
  for (let i = 0; i < 6 * force; i++) {
    const cx = x + a() * l;
    const lg = h * (0.3 + a() * 0.8);
    const d = g.createLinearGradient(0, y, 0, y + lg);
    d.addColorStop(0, `rgba(70,58,42,${0.2 * force})`);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(cx, y, 2 + a() * 6, lg);
  }
  g.restore();
}

function texte(g, t, x, y, taille, couleur, police = "900", famille = SANS, align = "center", rotation = 0, largeurMax = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(rotation);
  g.font = `${police} ${taille}px ${famille}`;
  if (largeurMax) {
    const w = g.measureText(t).width;
    if (w > largeurMax) g.scale(largeurMax / w, 1);
  }
  g.fillStyle = couleur;
  g.textAlign = align;
  g.textBaseline = "middle";
  g.fillText(t, 0, 0);
  g.restore();
}

/** Un polygone irrégulier (plaque d'enduit tombée, tache de rouille). */
function plaque(g, a, cx, cy, r, n = 11) {
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const rr = r * (0.55 + a() * 0.65);
    const x = cx + Math.cos(t) * rr;
    const y = cy + Math.sin(t) * rr * (0.6 + a() * 0.5);
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
}

/** L'enduit crème qui pèle : plaques tombées sur la pierre et la brique, écailles, coulures sous les corniches. */
function dessinerEnduitPele(g) {
  const a = aleatoire(1903);
  const S = 512;
  g.fillStyle = "#f4efe3";
  g.fillRect(0, 0, S, S);
  grain(g, a, 5000, 0, 0, S, S, 0.045);
  taches(g, a, 16, "rgba(120, 104, 80, 0.13)", 20, 80, S, S);
  // Les plaques d'enduit tombées : on voit le moellon et la brique du dessous
  for (let i = 0; i < 7; i++) {
    const cx = a() * S;
    const cy = a() * S;
    const r = 12 + a() * 34;
    g.save();
    plaque(g, a, cx, cy, r);
    g.fillStyle = "#b9ad96";
    g.fill();
    g.clip();
    // assises de brique et de moellon
    for (let y = cy - r; y < cy + r; y += 9) {
      const dec = Math.floor(y / 9) % 2 ? 9 : 0;
      for (let x = cx - r - 20; x < cx + r; x += 20) {
        const v = a();
        g.fillStyle = v < 0.35 ? `rgb(${175 + v * 40},${130 + v * 30},${108 + v * 20})` : `rgb(${178 + v * 30},${168 + v * 30},${150 + v * 25})`;
        g.fillRect(x + dec, y, 18, 7);
      }
    }
    g.restore();
    // le bord de l'enduit : une lèvre claire et une ombre
    g.save();
    g.translate(-1.5, -1.5);
    plaque(g, aleatoire(i * 31 + 7), cx, cy, r);
    g.restore();
    g.lineWidth = 2.5;
    g.strokeStyle = "rgba(70, 58, 42, 0.45)";
    g.stroke();
  }
  // Écailles de peinture
  for (let i = 0; i < 140; i++) {
    const x = a() * S;
    const y = a() * S;
    g.fillStyle = a() < 0.5 ? "rgba(170,156,130,0.5)" : "rgba(255,255,255,0.35)";
    g.fillRect(x, y, 2 + a() * 6, 1 + a() * 4);
  }
  // Coulures de rouille et de suie depuis le haut (sous les appuis, les corniches)
  for (let i = 0; i < 34; i++) {
    const x = a() * S;
    const y0 = a() * S;
    const lg = 40 + a() * 200;
    const d = g.createLinearGradient(0, y0, 0, y0 + lg);
    const rouille = a() < 0.3;
    d.addColorStop(0, rouille ? "rgba(140, 80, 40, 0.18)" : "rgba(60, 54, 44, 0.15)");
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(x, y0, 2 + a() * 7, lg);
  }
  // Lichen vert-noir de l'air salé
  taches(g, a, 10, "rgba(60, 80, 50, 0.2)", 10, 40, S, S);
  // Fissures
  g.strokeStyle = "rgba(55, 46, 36, 0.5)";
  g.lineWidth = 1.2;
  for (let i = 0; i < 9; i++) {
    let x = a() * S;
    let y = a() * S;
    g.beginPath();
    g.moveTo(x, y);
    for (let j = 0; j < 8; j++) {
      x += (a() - 0.5) * 26;
      y += 6 + a() * 14;
      g.lineTo(x, y);
    }
    g.stroke();
  }
}

/** Le sable : grain chaud, rides du vent, coquillages, brins d'algues. */
function dessinerSable(g) {
  const a = aleatoire(77);
  g.fillStyle = "#f2eadb";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 6000; i++) {
    const v = a();
    g.fillStyle = v < 0.5 ? `rgba(150,120,80,${0.08 + v * 0.1})` : `rgba(255,255,255,${0.1 + v * 0.1})`;
    g.fillRect(a() * 256, a() * 256, 1 + a() * 1.5, 1 + a() * 1.5);
  }
  // Les rides du vent
  g.strokeStyle = "rgba(140, 110, 70, 0.2)";
  g.lineWidth = 2;
  for (let y = 6; y < 256; y += 14 + a() * 6) {
    g.beginPath();
    for (let x = 0; x <= 256; x += 8) {
      const yy = y + Math.sin(x * 0.05 + y) * 4;
      if (x === 0) g.moveTo(x, yy);
      else g.lineTo(x, yy);
    }
    g.stroke();
  }
  // Coquillages et débris
  for (let i = 0; i < 14; i++) {
    g.fillStyle = a() < 0.5 ? "rgba(250,245,235,0.9)" : "rgba(120,100,80,0.6)";
    g.beginPath();
    g.ellipse(a() * 256, a() * 256, 2 + a() * 2, 1.5 + a(), a() * 3, 0, 7);
    g.fill();
  }
  taches(g, a, 6, "rgba(110, 95, 60, 0.12)", 14, 40, 256, 256);
}

// ---------- L'atlas ----------

function dessinerAtlas(g) {
  const a = aleatoire(1903);
  g.clearRect(0, 0, AL, AH);
  lettresDuToit(g, a);
  frise(g, a);
  ferronnerie(g, a, R.balcon, false);
  ferronnerie(g, a, R.balconTordu, true);
  persienne(g, a, R.persienne, "#9fb4a5", false);
  persienne(g, a, R.persienneB, "#b9b3a0", true);
  grilleAscenseur(g, a);
  rayures(g, a, R.rayuresR, "#c97a62");
  rayures(g, a, R.rayuresB, "#6f9fb3");
  tableauDesCles(g, a);
  zeroEffort(g, a);
  checkInSourire(g, a);
  robot(g, a);
  watty(g, R.watty);
  bainsDeMer(g, a);
  ardoiseMenu(g, a);
  lettreTombee(g);
  plaqueFroid(g, a);
  bandeau(g, a, R.buvette, "BUVETTE · GLACES · LIMONADE", "#2f6f73", "#efe6cf", true);
  panneauPiscine(g, a);
  graffiti(g, a);
  tableauMarine(g, a);
  plaqueEmail(g, a, R.reception, "RÉCEPTION", "#24453a", "#d9b964");
  plaqueEmail(g, a, R.bar, "BAR DE LA ROTONDE", "#5a2026", "#d9b964");
  plaqueEmail(g, a, R.lingerie, "LINGERIE", "#e6e1d2", "#2f4f5d");
  plaqueEmail(g, a, R.cuisine, "CUISINES · PERSONNEL", "#e6e1d2", "#5a2026");
  miroirPique(g, a);
  balustres(g, a);
  fenetrePeinte(g, a, R.fenA, 0);
  fenetrePeinte(g, a, R.fenB, 1);
  fenetrePeinte(g, a, R.fenC, 2);
  fenetrePeinte(g, a, R.fenD, 3);
  panneauSortie(g, a);
  ganivellePeinte(g, a);
  oyatsPeints(g, a);
  damierHall(g, a);
  merPeinte(g, a);
  vitrines(g, a);
  for (const [r, c] of APLATS) {
    g.fillStyle = c;
    g.fillRect(r[0], r[1], r[2], r[3]);
  }
}

/**
 * Le panneau de sortie de l'est (R0-1, texte validé par le porteur) : « Route du pont → · Ton terrain, par le pont ·
 * 5 km ». Grosses lettres sombres sur fond clair, cadre de bois, un peu de sel et de rouille.
 */
function panneauSortie(g, a) {
  const [x, y, l, h] = R.panneauSortie;
  g.fillStyle = "#5b4632";
  g.fillRect(x, y, l, h);
  g.fillStyle = "#efe7d2";
  g.fillRect(x + 12, y + 12, l - 24, h - 24);
  g.strokeStyle = "#2c2620";
  g.lineWidth = 4;
  g.strokeRect(x + 22, y + 22, l - 44, h - 44);
  texte(g, "Route du pont →", x + l / 2, y + 78, 84, "#1d1915", "900", SANS, "center", 0, l - 64);
  g.fillStyle = "#2c2620";
  g.fillRect(x + 50, y + 128, l - 100, 5);
  texte(g, "Ton terrain, par le pont", x + l / 2, y + 166, 54, "#1d1915", "900", SANS, "center", 0, l - 64);
  texte(g, "5 km", x + l / 2, y + 214, 50, "#1d1915", "900", SANS, "center", 0, l - 64);
  salir(g, a, x + 12, y + 12, l - 24, h - 24, 0.8);
}

/** Une ganivelle : lattes de châtaignier grisé, de travers, tenues par deux fils de fer (fond transparent). */
function ganivellePeinte(g, a) {
  const [x, y, l, h] = R.ganivelle;
  g.clearRect(x, y, l, h);
  for (let u = 2; u < l - 4; u += 13) {
    if (a() < 0.06) continue; // une latte arrachée
    const haut = y + 4 + a() * 14;
    const tons = ["#9a907f", "#8a7f6c", "#a69c88", "#7d7262"];
    g.fillStyle = tons[Math.floor(a() * tons.length)];
    g.save();
    g.translate(x + u + 3.5, y + h);
    g.rotate((a() - 0.5) * 0.08);
    g.beginPath();
    g.moveTo(-3.5, 0);
    g.lineTo(-3.5, haut - (y + h) + 4);
    g.lineTo(0, haut - (y + h));
    g.lineTo(3.5, haut - (y + h) + 4);
    g.lineTo(3.5, 0);
    g.closePath();
    g.fill();
    g.fillStyle = "rgba(40,32,24,0.25)";
    g.fillRect(1.5, haut - (y + h) + 6, 2, y + h - haut - 6);
    g.restore();
  }
  // Les deux fils de fer, et le sable qui mange le pied
  g.fillStyle = "#4a423b";
  for (const yy of [y + 36, y + 96]) g.fillRect(x, yy, l, 3);
  g.fillStyle = "#d6c08f";
  for (let u = 0; u < l; u += 4) g.fillRect(x + u, y + h - 6 - Math.abs(Math.sin(u * 0.05)) * 10, 4, 16);
}

/** Des touffes d'oyats (fond transparent) : des brins fins, vert-de-gris, qui plient au vent. */
function oyatsPeints(g, a) {
  const [x, y, l, h] = R.oyats;
  g.clearRect(x, y, l, h);
  g.lineCap = "round";
  for (let i = 0; i < 46; i++) {
    const bx = x + l / 2 + (a() - 0.5) * l * 0.55;
    const lg = h * (0.45 + a() * 0.5);
    const pli = (a() - 0.3) * 30;
    g.strokeStyle = ["#9aa36b", "#8c9660", "#b3b081", "#7d8a58"][i % 4];
    g.lineWidth = 2 + a() * 1.5;
    g.beginPath();
    g.moveTo(bx, y + h);
    g.quadraticCurveTo(bx + pli * 0.3, y + h - lg * 0.6, bx + pli, y + h - lg);
    g.stroke();
  }
}

/** Le marbre noir et blanc du hall, en damier (8 × 8), un peu terni. */
function damierHall(g, a) {
  const [x, y, l, h] = R.damier;
  const c = l / 8;
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    g.fillStyle = (i + j) % 2 ? "#2f2c2a" : "#e2ddd2";
    g.fillRect(x + i * c, y + j * c, c, c);
  }
  grain(g, a, 500, x, y, l, h, 0.07);
  g.strokeStyle = "rgba(120,110,95,0.35)";
  g.lineWidth = 1;
  for (let k = 0; k < 6; k++) {
    g.beginPath();
    g.moveTo(x + a() * l, y + a() * h);
    g.lineTo(x + a() * l, y + a() * h);
    g.stroke();
  }
}

/** La surface de la mer : un blanc légèrement strié de rides (la couleur vient des sommets). */
function merPeinte(g, a) {
  const [x, y, l, h] = [512, 1664, 256, 128];
  g.fillStyle = "#f4f6f4";
  g.fillRect(x, y, l, h);
  for (let i = 0; i < 70; i++) {
    g.fillStyle = a() < 0.5 ? "rgba(255,255,255,0.7)" : "rgba(150,170,175,0.35)";
    g.fillRect(x + a() * l, y + a() * h, 14 + a() * 46, 2);
  }
}

/** Les rez-de-chaussée de la rue de derrière : vitrines fermées, rideaux de fer, enseignes passées (4 travées). */
function vitrines(g, a) {
  const [x, y, l, h] = R.vitrines;
  const noms = [["PHARMACIE DES BAINS", "#3f6b55"], ["GLACIER", "#b0675a"], ["LOCATION DE TRANSATS", "#3d5f78"], ["RECHARGE ZÉRO-EFFORT", "#a8352c"]];
  const lt = l / 4;
  noms.forEach(([t, c], i) => {
    const x0 = x + i * lt;
    g.fillStyle = "#d9cdb2";
    g.fillRect(x0, y, lt, h);
    g.fillStyle = c;
    g.fillRect(x0 + 6, y + 6, lt - 12, 24);
    texte(g, t, x0 + lt / 2, y + 18, 16, "#efe6cf", "900", SANS, "center", 0, lt - 20);
    // le rideau de fer, à moitié levé, ou la vitrine sombre
    g.fillStyle = "#2b2a28";
    g.fillRect(x0 + 10, y + 38, lt - 20, h - 38);
    if (i % 2 === 0) {
      g.fillStyle = "#8b8d88";
      const bas = y + 38 + (h - 38) * (0.4 + a() * 0.5);
      g.fillRect(x0 + 10, y + 38, lt - 20, bas - y - 38);
      g.fillStyle = "rgba(40,40,40,0.5)";
      for (let k = y + 42; k < bas; k += 6) g.fillRect(x0 + 10, k, lt - 20, 1);
    }
    salir(g, a, x0, y, lt, h, 1.2);
  });
}

/** Une rangée de balustres de béton blanc (fond transparent), pour la balustrade de la promenade. */
function balustres(g, a) {
  const [x, y, l, h] = R.balustrade;
  g.save();
  g.beginPath();
  g.rect(x, y, l, h);
  g.clip();
  for (let k = 0; k < 8; k++) {
    const cx = x + 16 + k * 32;
    const d = g.createLinearGradient(cx - 9, 0, cx + 9, 0);
    d.addColorStop(0, "#c9c1b0");
    d.addColorStop(0.4, "#f2ece0");
    d.addColorStop(1, "#b5ad9c");
    g.fillStyle = d;
    g.beginPath();
    g.moveTo(cx - 7, y);
    g.lineTo(cx + 7, y);
    g.lineTo(cx + 4, y + 14);
    g.quadraticCurveTo(cx + 12, y + 40, cx + 10, y + 62);
    g.quadraticCurveTo(cx + 9, y + 78, cx + 5, y + 84);
    g.lineTo(cx + 8, y + h);
    g.lineTo(cx - 8, y + h);
    g.lineTo(cx - 5, y + 84);
    g.quadraticCurveTo(cx - 9, y + 78, cx - 10, y + 62);
    g.quadraticCurveTo(cx - 12, y + 40, cx - 4, y + 14);
    g.closePath();
    g.fill();
    if (a() < 0.3) {
      g.fillStyle = "rgba(90,110,60,0.45)";
      g.fillRect(cx - 9, y + h - 20, 18, 20);
    }
  }
  g.restore();
}

/**
 * Une haute fenêtre à la française, peinte : dormant crème, meneau, petits bois, vitres sombres et poussiéreuses.
 * `etat` 0 : vitres entières ; 1 : carreaux cassés (trous) ; 2 : un battant ouvert sur le noir ; 3 : vitres parties.
 */
function fenetrePeinte(g, a, r, etat) {
  const [x, y, l, h] = r;
  const cadre = "#e6dcc4";
  const cols = 2;
  const rangs = 4;
  const b = 7;
  const lc = (l - 2 * b - 5) / cols;
  const hc = (h - 2 * b - 3 * (rangs - 1)) / rangs;
  g.fillStyle = cadre;
  g.fillRect(x, y, l, h);
  for (let i = 0; i < cols; i++) for (let j = 0; j < rangs; j++) {
    const px = x + b + i * (lc + 5);
    const py = y + b + j * (hc + 3);
    if (etat === 3 && (i + j) % 3 !== 0) {
      g.clearRect(px, py, lc, hc);
      continue;
    }
    if (etat === 2 && i === 1) {
      g.fillStyle = "#15120f";
      g.fillRect(px, py, lc, hc);
      continue;
    }
    const d = g.createLinearGradient(px, py, px + lc, py + hc);
    d.addColorStop(0, "#5d7279");
    d.addColorStop(0.45, "#33454c");
    d.addColorStop(1, "#22302f");
    g.fillStyle = d;
    g.fillRect(px, py, lc, hc);
    // reflet du ciel et poussière
    g.fillStyle = "rgba(220,230,230,0.22)";
    g.beginPath();
    g.moveTo(px, py + hc * 0.7);
    g.lineTo(px + lc * 0.6, py);
    g.lineTo(px + lc * 0.85, py);
    g.lineTo(px, py + hc);
    g.fill();
    g.fillStyle = "rgba(190,170,130,0.18)";
    g.fillRect(px, py + hc * 0.75, lc, hc * 0.25);
    if (etat === 1 && a() < 0.55) {
      // un carreau crevé : trou en étoile
      g.beginPath();
      const cx = px + lc * (0.3 + a() * 0.4);
      const cy = py + hc * (0.3 + a() * 0.4);
      for (let k = 0; k < 9; k++) {
        const t = (k / 9) * Math.PI * 2;
        const rr = (k % 2 ? 0.25 : 0.55) * Math.min(lc, hc) * (0.8 + a() * 0.6);
        g.lineTo(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr);
      }
      g.closePath();
      g.save();
      g.globalCompositeOperation = "destination-out";
      g.fill();
      g.restore();
    }
  }
  if (etat === 2) {
    // le battant ouvert, vu de biais
    g.fillStyle = "#d9cfb6";
    g.fillRect(x + l - b - 4, y + b, 4, h - 2 * b);
  }
  salir(g, a, x, y, l, h, 0.8);
}

/** « GRAND HÔTEL DES FLOTS » : grandes lettres de tôle rouillées, une penchée, le dernier S tombé. */
function lettresDuToit(g, a) {
  const [x, y, l, h] = R.lettres;
  const t = "GRAND HÔTEL DES FLOTS";
  g.font = `900 82px ${SERIF}`;
  const total = g.measureText(t).width;
  const sx = Math.min(1, (l - 20) / total);
  let cx = x + (l - total * sx) / 2;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    g.font = `900 82px ${SERIF}`;
    const w = g.measureText(ch).width * sx;
    if (ch !== " " && i !== t.length - 1) {
      g.save();
      const penche = i === 17 ? 0.32 : i === 4 ? -0.08 : 0;
      g.translate(cx + w / 2, y + h / 2 + 4 + (i === 17 ? 8 : 0));
      g.rotate(penche);
      g.scale(sx, 1);
      const d = g.createLinearGradient(0, -40, 0, 40);
      d.addColorStop(0, "#b4693d");
      d.addColorStop(0.5, "#8c4a2a");
      d.addColorStop(1, "#5e3420");
      g.fillStyle = d;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(ch, 0, 0);
      g.lineWidth = 2;
      g.strokeStyle = "rgba(40,24,14,0.8)";
      g.strokeText(ch, 0, 0);
      g.restore();
    }
    cx += w;
  }
  // Coulures et piqûres de rouille sur les lettres seulement
  g.save();
  g.globalCompositeOperation = "source-atop";
  for (let i = 0; i < 400; i++) {
    g.fillStyle = a() < 0.5 ? "rgba(60,30,15,0.5)" : "rgba(200,120,70,0.45)";
    g.fillRect(x + a() * l, y + a() * h, 2 + a() * 4, 2 + a() * 4);
  }
  g.restore();
}

/** La frise gravée au-dessus de l'entrée. */
function frise(g, a) {
  const [x, y, l, h] = R.frise;
  g.fillStyle = "#e9dcbd";
  g.fillRect(x, y, l, h);
  grain(g, a, 1500, x, y, l, h, 0.05);
  g.fillStyle = "rgba(90,74,50,0.35)";
  g.fillRect(x, y + 6, l, 3);
  g.fillRect(x, y + h - 9, l, 3);
  texte(g, "GRAND HÔTEL DES FLOTS", x + l / 2 - 60, y + h / 2 + 2, 58, "rgba(84,66,44,0.92)", "700", SERIF, "center", 0, l - 220);
  texte(g, "MCMIII", x + l - 90, y + h / 2 + 2, 30, "rgba(84,66,44,0.8)", "700", SERIF);
  salir(g, a, x, y, l, h, 1.4);
}

/** Garde-corps en fer forgé : lisses, barreaux, volutes en S et médaillon (fond transparent). */
function ferronnerie(g, a, r, tordu) {
  const [x, y, l, h] = r;
  g.save();
  g.beginPath();
  g.rect(x, y, l, h);
  g.clip();
  g.strokeStyle = "#20241f";
  g.lineCap = "round";
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(x, y + 8);
  if (tordu) g.quadraticCurveTo(x + l * 0.5, y + 40, x + l, y + 4);
  else g.lineTo(x + l, y + 8);
  g.moveTo(x, y + h - 8);
  g.lineTo(x + l, y + h - 8);
  g.stroke();
  g.lineWidth = 4;
  for (let k = 0; k < l / 64; k++) {
    const cx = x + 32 + k * 64;
    if (tordu && k >= 3 && k <= 4) continue; // le morceau arraché
    const flex = tordu ? (k - 3.5) * 6 : 0;
    // barreaux
    for (const dx of [-26, 26]) {
      g.beginPath();
      g.moveTo(cx + dx, y + 8 + (tordu ? 20 - Math.abs(k - 3.5) * 5 : 0));
      g.quadraticCurveTo(cx + dx + flex, y + h / 2, cx + dx, y + h - 8);
      g.stroke();
    }
    // volutes en S
    g.beginPath();
    g.arc(cx - 10, y + h / 2 - 18, 12, Math.PI * 0.5, Math.PI * 2.2);
    g.stroke();
    g.beginPath();
    g.arc(cx + 10, y + h / 2 + 18, 12, Math.PI * 1.5, Math.PI * 3.2);
    g.stroke();
    // médaillon
    g.beginPath();
    g.ellipse(cx, y + h / 2, 9, 16, 0, 0, 7);
    g.stroke();
  }
  g.restore();
  // rouille sur le fer
  g.save();
  g.globalCompositeOperation = "source-atop";
  for (let i = 0; i < 140; i++) {
    g.fillStyle = "rgba(150,80,40,0.55)";
    g.fillRect(x + a() * l, y + a() * h, 3 + a() * 5, 3 + a() * 5);
  }
  g.restore();
}

/** Une persienne à lames, peinture qui s'écaille ; la seconde a perdu des lames (trous). */
function persienne(g, a, r, teinte, abimee) {
  const [x, y, l, h] = r;
  g.fillStyle = teinte;
  g.fillRect(x, y, l, h);
  g.fillStyle = "rgba(0,0,0,0.25)";
  g.fillRect(x, y, 8, h);
  g.fillRect(x + l - 8, y, 8, h);
  g.fillRect(x, y, l, 8);
  g.fillRect(x, y + h - 8, l, 8);
  g.fillRect(x, y + h / 2 - 4, l, 8);
  for (let yy = y + 12; yy < y + h - 10; yy += 11) {
    if (Math.abs(yy - (y + h / 2)) < 7) continue;
    const d = g.createLinearGradient(0, yy, 0, yy + 10);
    d.addColorStop(0, "rgba(255,255,255,0.25)");
    d.addColorStop(1, "rgba(0,0,0,0.35)");
    g.fillStyle = d;
    g.fillRect(x + 10, yy, l - 20, 10);
    if (abimee && a() < 0.22) g.clearRect(x + 10, yy, l - 20, 10);
  }
  // le bois nu sous la peinture
  for (let i = 0; i < 40; i++) {
    g.fillStyle = "rgba(120,96,66,0.7)";
    g.fillRect(x + a() * l, y + a() * h, 3 + a() * 12, 2 + a() * 5);
  }
  salir(g, a, x, y, l, h, 1.2);
}

/** La grille en losanges de l'ascenseur (fond transparent). */
function grilleAscenseur(g, a) {
  const [x, y, l, h] = R.grille;
  g.save();
  g.beginPath();
  g.rect(x, y, l, h);
  g.clip();
  g.strokeStyle = "#1e211e";
  g.lineWidth = 4;
  for (let k = -h; k < l + h; k += 32) {
    g.beginPath();
    g.moveTo(x + k, y);
    g.lineTo(x + k + h, y + h);
    g.moveTo(x + k, y + h);
    g.lineTo(x + k + h, y);
    g.stroke();
  }
  g.lineWidth = 8;
  for (let k = 0; k <= l; k += 64) {
    g.beginPath();
    g.moveTo(x + k, y);
    g.lineTo(x + k, y + h);
    g.stroke();
  }
  g.fillStyle = "#b08c45";
  g.fillRect(x, y, l, 14);
  g.fillRect(x, y + h - 14, l, 14);
  g.restore();
}

/** Toile rayée délavée (transats, parasols, cabines). */
function rayures(g, a, r, couleur) {
  const [x, y, l, h] = r;
  for (let k = 0; k < 8; k++) {
    g.fillStyle = k % 2 ? "#ece2c8" : couleur;
    g.fillRect(x + (k * l) / 8, y, l / 8 + 1, h);
  }
  const d = g.createLinearGradient(0, y, 0, y + h);
  d.addColorStop(0, "rgba(255,250,235,0.35)");
  d.addColorStop(1, "rgba(255,250,235,0)");
  g.fillStyle = d;
  g.fillRect(x, y, l, h);
  salir(g, a, x, y, l, h, 1.3);
}

/** Le tableau des clés derrière le comptoir : casiers numérotés, clés à pompon, des clés manquantes. */
function tableauDesCles(g, a) {
  const [x, y, l, h] = R.cles;
  g.fillStyle = "#5e3f2a";
  g.fillRect(x, y, l, h);
  const nc = 6;
  const nr = 5;
  const lc = (l - 16) / nc;
  const hc = (h - 16) / nr;
  for (let i = 0; i < nc; i++) for (let j = 0; j < nr; j++) {
    const cx = x + 8 + i * lc;
    const cy = y + 8 + j * hc;
    g.fillStyle = "#24170f";
    g.fillRect(cx + 3, cy + 3, lc - 6, hc - 6);
    g.fillStyle = "#c9a85a";
    g.fillRect(cx + lc / 2 - 9, cy + 5, 18, 8);
    texte(g, String(100 + j * 10 + i + 1), cx + lc / 2, cy + 9, 7, "#2a1d10", "900");
    if (a() < 0.55) {
      // une clé à pompon
      g.strokeStyle = "#d4b060";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(cx + lc / 2, cy + 15);
      g.lineTo(cx + lc / 2, cy + hc - 14);
      g.stroke();
      g.fillStyle = ["#8a2a2a", "#2a4a6a", "#c9a85a"][Math.floor(a() * 3)];
      g.beginPath();
      g.ellipse(cx + lc / 2, cy + hc - 10, 6, 5, 0, 0, 7);
      g.fill();
    }
  }
  salir(g, a, x, y, l, h, 1.2);
}

/** La brochure et l'affiche de l'Abondance : « Séjour Zéro-Effort — On respire pour vous ». */
function zeroEffort(g, a) {
  const [x, y, l, h] = R.zeroEffort;
  g.fillStyle = "#e9dfc6";
  g.fillRect(x, y, l, h);
  g.fillStyle = "#c8362b";
  g.fillRect(x, y, l, 96);
  texte(g, "SÉJOUR", x + l / 2, y + 30, 34, "#e9dfc6", "900");
  texte(g, "ZÉRO-EFFORT", x + l / 2, y + 68, 34, "#e9dfc6", "900", SANS, "center", 0, l - 20);
  // un client allongé, souriant, relié à un bras robotisé qui lui tend un verre
  g.fillStyle = "#2f6f73";
  g.fillRect(x + 30, y + 196, 190, 16);
  g.fillRect(x + 40, y + 212, 8, 30);
  g.fillRect(x + 200, y + 212, 8, 30);
  g.fillStyle = "#e0b070";
  g.beginPath();
  g.ellipse(x + 70, y + 182, 18, 18, 0, 0, 7);
  g.fill();
  g.fillRect(x + 84, y + 180, 110, 18);
  g.strokeStyle = "#3a2f28";
  g.lineWidth = 3;
  g.beginPath();
  g.arc(x + 70, y + 184, 9, 0.2, Math.PI - 0.2);
  g.stroke();
  g.strokeStyle = "#8d969a";
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(x + 230, y + 110);
  g.lineTo(x + 190, y + 140);
  g.lineTo(x + 110, y + 150);
  g.stroke();
  g.fillStyle = "#c79a3b";
  g.fillRect(x + 98, y + 140, 12, 22);
  // un tuyau « d'air premium » jusqu'au nez
  g.strokeStyle = "#6fb3a8";
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(x + 58, y + 178);
  g.quadraticCurveTo(x + 20, y + 120, x + 60, y + 104);
  g.stroke();
  texte(g, "On respire pour vous.", x + l / 2, y + 270, 21, "#3a2f28", "900", SANS, "center", 0, l - 20);
  texte(g, "Grand Hôtel des Flots · Formule Abondance", x + l / 2, y + 300, 11, "#2f6f73", "800", SANS, "center", 0, l - 16);
  texte(g, "Repas mâchés · Bronzage par abonnement", x + l / 2, y + 322, 11, "#6e6152", "700", SANS, "center", 0, l - 16);
  texte(g, "*Respiration assistée incluse dès la formule Premium+", x + l / 2, y + 354, 8, "#6e6152", "600", SANS, "center", 0, l - 16);
  salir(g, a, x, y, l, h, 1.3);
}

/** La borne « Check-in par sourire ». */
function checkInSourire(g, a) {
  const [x, y, l, h] = R.sourire;
  g.fillStyle = "#0f2c3a";
  g.fillRect(x, y, l, h);
  const d = g.createRadialGradient(x + l / 2, y + h / 2, 10, x + l / 2, y + h / 2, l * 0.7);
  d.addColorStop(0, "rgba(120,220,255,0.35)");
  d.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = d;
  g.fillRect(x, y, l, h);
  texte(g, "CHECK-IN", x + l / 2, y + 30, 30, "#bfe9ff", "900");
  texte(g, "PAR SOURIRE", x + l / 2, y + 60, 20, "#ffe9a8", "900");
  g.strokeStyle = "#ffe9a8";
  g.lineWidth = 6;
  g.beginPath();
  g.arc(x + l / 2, y + 138, 44, 0, 7);
  g.stroke();
  g.fillStyle = "#ffe9a8";
  g.fillRect(x + l / 2 - 20, y + 118, 8, 13);
  g.fillRect(x + l / 2 + 12, y + 118, 8, 13);
  g.beginPath();
  g.arc(x + l / 2, y + 140, 24, 0.25, Math.PI - 0.25);
  g.stroke();
  texte(g, "Sourire non reconnu.", x + l / 2, y + 206, 17, "#ff9a8a", "800");
  texte(g, "Veuillez sourire davantage.", x + l / 2, y + 230, 14, "#e8f6ff", "700");
  g.strokeStyle = "rgba(230,240,255,0.5)";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(x + 40, y);
  g.lineTo(x + 70, y + 80);
  g.lineTo(x + 50, y + 150);
  g.moveTo(x + 70, y + 80);
  g.lineTo(x + 0, y + 120);
  g.stroke();
}

/** Le visage du robot-serveur (écran éteint, il reste un sourire gravé). */
function robot(g, a) {
  const [x, y, l, h] = R.robot;
  g.fillStyle = "#1a2226";
  g.fillRect(x, y, l, h);
  g.strokeStyle = "#7fd8e8";
  g.lineWidth = 6;
  g.lineCap = "round";
  for (const dx of [-26, 26]) {
    g.beginPath();
    g.moveTo(x + l / 2 + dx - 12, y + 52);
    g.lineTo(x + l / 2 + dx, y + 40);
    g.lineTo(x + l / 2 + dx + 12, y + 52);
    g.stroke();
  }
  g.beginPath();
  g.arc(x + l / 2, y + 70, 22, 0.3, Math.PI - 0.3);
  g.stroke();
  texte(g, "BON APPÉTIT", x + l / 2, y + 112, 12, "#7fd8e8", "900");
  taches(g, a, 3, "rgba(200,190,160,0.4)", 10, 30, l, h);
}

/** Watty, la pile souriante de la Compagnie (autocollant). */
export function watty(g, r) {
  const [x, y, l, h] = r;
  g.fillStyle = "#e9dfc6";
  g.beginPath();
  g.ellipse(x + l / 2, y + h / 2, l / 2 - 2, h / 2 - 2, 0, 0, 7);
  g.fill();
  g.fillStyle = "#c8362b";
  g.fillRect(x + l / 2 - 24, y + 30, 48, 74);
  g.fillStyle = "#c79a3b";
  g.fillRect(x + l / 2 - 9, y + 20, 18, 10);
  g.fillStyle = "#e9dfc6";
  g.fillRect(x + l / 2 - 14, y + 50, 7, 9);
  g.fillRect(x + l / 2 + 7, y + 50, 7, 9);
  g.strokeStyle = "#e9dfc6";
  g.lineWidth = 4;
  g.beginPath();
  g.arc(x + l / 2, y + 66, 12, 0.2, Math.PI - 0.2);
  g.stroke();
  texte(g, "WATTY", x + l / 2, y + 116, 13, "#2f6f73", "900");
}

/** L'affiche ancienne de la station : « Les Flots — Bains de mer · Casino · Grand Hôtel ». */
function bainsDeMer(g, a) {
  const [x, y, l, h] = R.bainsDeMer;
  const d = g.createLinearGradient(0, y, 0, y + h);
  d.addColorStop(0, "#e8c890");
  d.addColorStop(0.45, "#e6a96a");
  d.addColorStop(0.46, "#4f8fa0");
  d.addColorStop(1, "#2f5f70");
  g.fillStyle = d;
  g.fillRect(x, y, l, h);
  g.fillStyle = "#f3e2b0";
  g.beginPath();
  g.arc(x + l / 2, y + h * 0.45, 46, Math.PI, 0);
  g.fill();
  // la silhouette de l'hôtel et sa coupole
  g.fillStyle = "#3a3348";
  g.fillRect(x + 30, y + 120, 160, 52);
  g.fillRect(x + 188, y + 104, 36, 68);
  g.beginPath();
  g.arc(x + 206, y + 104, 18, Math.PI, 0);
  g.fill();
  g.fillStyle = "#f3e2b0";
  for (let i = 0; i < 8; i++) for (let j = 0; j < 3; j++) g.fillRect(x + 40 + i * 19, y + 128 + j * 14, 6, 7);
  // vagues
  g.strokeStyle = "rgba(240,240,230,0.6)";
  g.lineWidth = 3;
  for (let j = 0; j < 5; j++) {
    g.beginPath();
    for (let i = 0; i <= l; i += 8) g.lineTo(x + i, y + 200 + j * 26 + Math.sin(i * 0.08 + j) * 4);
    g.stroke();
  }
  texte(g, "LES FLOTS", x + l / 2, y + 40, 44, "#7a2a2a", "900", SERIF);
  texte(g, "BAINS DE MER · CASINO", x + l / 2, y + 74, 15, "#3a3348", "800", SANS, "center", 0, l - 30);
  texte(g, "GRAND HÔTEL", x + l / 2, y + h - 52, 26, "#f3e2b0", "900", SERIF);
  texte(g, "Saison 1903", x + l / 2, y + h - 24, 15, "#f3e2b0", "700", SERIF);
  // coin déchiré, plis, rousseurs
  g.clearRect(x + l - 50, y, 50, 36);
  g.clearRect(x + l - 26, y + 36, 26, 20);
  taches(g, a, 10, "rgba(120,80,40,0.25)", 8, 30, l, h);
  salir(g, a, x, y, l, h, 1.6);
}

/** L'ardoise du menu, sur son chevalet. */
function ardoiseMenu(g, a) {
  const [x, y, l, h] = R.menu;
  g.fillStyle = "#6b4a30";
  g.fillRect(x, y, l, h);
  g.fillStyle = "#2a2d2b";
  g.fillRect(x + 10, y + 10, l - 20, h - 20);
  texte(g, "Menu du jour", x + l / 2, y + 34, 24, "#e6e2d6", "700", SERIF);
  const plats = ["Velouté de rien", "Plateau de fruits de mer", "(livré par drone)", "Dessert : supplément sourire"];
  plats.forEach((p, i) => texte(g, p, x + l / 2, y + 74 + i * 26, i === 2 ? 13 : 16, "rgba(230,226,214,0.85)", "600", SERIF, "center", 0, l - 30));
  g.fillStyle = "rgba(230,226,214,0.15)";
  for (let i = 0; i < 30; i++) g.fillRect(x + 12 + a() * (l - 24), y + 12 + a() * (h - 24), 10 + a() * 30, 2);
}

/** Le S tombé de l'enseigne du toit (fond transparent). */
function lettreTombee(g) {
  const [x, y, l, h] = R.lettreS;
  g.save();
  g.translate(x + l / 2, y + h / 2 + 6);
  g.font = `900 122px ${SERIF}`;
  const d = g.createLinearGradient(0, -50, 0, 50);
  d.addColorStop(0, "#b4693d");
  d.addColorStop(1, "#5e3420");
  g.fillStyle = d;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("S", 0, 0);
  g.restore();
}

/** Plaque « CHAMBRE FROIDE ». */
function plaqueFroid(g, a) {
  const [x, y, l, h] = R.froid;
  g.fillStyle = "#e6e8e6";
  g.fillRect(x, y, l, h);
  g.fillStyle = "#2f5f8a";
  g.fillRect(x, y, l, 30);
  texte(g, "CHAMBRE", x + l / 2, y + 15, 18, "#f0f0ea", "900");
  texte(g, "FROIDE", x + l / 2, y + 46, 22, "#2f5f8a", "900");
  g.strokeStyle = "#2f5f8a";
  g.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    const t = (i / 3) * Math.PI;
    g.beginPath();
    g.moveTo(x + l / 2 + Math.cos(t) * 26, y + 90 + Math.sin(t) * 26);
    g.lineTo(x + l / 2 - Math.cos(t) * 26, y + 90 - Math.sin(t) * 26);
    g.stroke();
  }
  texte(g, "−18 °C", x + l / 2, y + 120, 12, "#2f5f8a", "900");
  salir(g, a, x, y, l, h, 1.2);
}

/** Un bandeau d'enseigne : texte sur fond uni, liseré de lambrequin. */
function bandeau(g, a, r, t, fond, encre, festons) {
  const [x, y, l, h] = r;
  g.fillStyle = fond;
  g.fillRect(x, y, l, h);
  if (festons) {
    g.fillStyle = "#efe6cf";
    for (let k = 0; k < l; k += 32) {
      g.beginPath();
      g.arc(x + k + 16, y + h - 6, 16, 0, Math.PI);
      g.fill();
    }
  }
  texte(g, t, x + l / 2, y + h / 2 - 8, 44, encre, "900", SANS, "center", 0, l - 40);
  salir(g, a, x, y, l, h, 1.4);
}

/** « PISCINE D'EAU DE MER — Baignade interdite aux chiens » … « et aux Éteints » ajouté à la bombe. */
function panneauPiscine(g, a) {
  const [x, y, l, h] = R.piscine;
  g.fillStyle = "#e7e2d4";
  g.fillRect(x, y, l, h);
  g.fillStyle = "#2f6f73";
  g.fillRect(x, y, l, 50);
  texte(g, "PISCINE D'EAU DE MER", x + l / 2, y + 26, 36, "#efe9d8", "900", SANS, "center", 0, l - 30);
  texte(g, "Baignade interdite aux chiens", x + 30, y + 74, 24, "#2a2826", "700", SANS, "left");
  texte(g, "ET AUX ÉTEINTS", x + 330, y + 104, 30, "rgba(25,24,22,0.92)", "900", SANS, "center", -0.06);
  salir(g, a, x, y, l, h, 1.4);
}

/** « FERMÉ POUR LA SAISON », peint sur des planches par des survivants (fond transparent). */
function graffiti(g, a) {
  const [x, y, l, h] = R.graffiti;
  texte(g, "FERMÉ POUR", x + l / 2 - 10, y + 50, 62, "rgba(28,26,24,0.92)", "900", SANS, "center", -0.04, l - 30);
  texte(g, "LA SAISON", x + l / 2 + 10, y + 118, 70, "rgba(28,26,24,0.92)", "900", SANS, "center", -0.03, l - 40);
  g.fillStyle = "rgba(28,26,24,0.75)";
  for (let i = 0; i < 9; i++) g.fillRect(x + 60 + a() * (l - 120), y + 148, 3, 6 + a() * 10);
}

/** Une marine dans un cadre doré. */
function tableauMarine(g, a) {
  const [x, y, l, h] = R.tableau;
  g.fillStyle = "#a8873c";
  g.fillRect(x, y, l, h);
  g.fillStyle = "#6e5524";
  g.fillRect(x + 12, y + 12, l - 24, h - 24);
  const d = g.createLinearGradient(0, y + 18, 0, y + h - 18);
  d.addColorStop(0, "#c9c3a8");
  d.addColorStop(0.55, "#9fb3b0");
  d.addColorStop(0.56, "#3f6f78");
  d.addColorStop(1, "#2a4a50");
  g.fillStyle = d;
  g.fillRect(x + 18, y + 18, l - 36, h - 36);
  g.fillStyle = "#efe6cf";
  g.beginPath();
  g.moveTo(x + 110, y + 112);
  g.lineTo(x + 130, y + 52);
  g.lineTo(x + 140, y + 112);
  g.fill();
  g.fillStyle = "#4a3a2a";
  g.fillRect(x + 100, y + 112, 52, 8);
  taches(g, a, 8, "rgba(60,40,20,0.3)", 6, 26, l, h);
  // la toile est crevée
  g.strokeStyle = "rgba(30,20,10,0.8)";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(x + 170, y + 40);
  g.lineTo(x + 196, y + 90);
  g.lineTo(x + 180, y + 140);
  g.stroke();
}

/** Une plaque émaillée ou de laiton. */
function plaqueEmail(g, a, r, t, fond, encre) {
  const [x, y, l, h] = r;
  g.fillStyle = fond;
  g.fillRect(x, y, l, h);
  g.strokeStyle = encre;
  g.lineWidth = 3;
  g.strokeRect(x + 6, y + 6, l - 12, h - 12);
  texte(g, t, x + l / 2, y + h / 2 + 1, Math.min(34, h * 0.45), encre, "800", SERIF, "center", 0, l - 30);
  salir(g, a, x, y, l, h, 1.2);
}

/** Un grand miroir piqué au tain, fendu. */
function miroirPique(g, a) {
  const [x, y, l, h] = R.miroir;
  g.fillStyle = "#b08c45";
  g.fillRect(x, y, l, h);
  const d = g.createLinearGradient(x, y, x + l, y + h);
  d.addColorStop(0, "#9aa7a8");
  d.addColorStop(0.5, "#cfd6d2");
  d.addColorStop(1, "#7f8c8c");
  g.fillStyle = d;
  g.fillRect(x + 12, y + 12, l - 24, h - 24);
  taches(g, a, 22, "rgba(60,50,30,0.35)", 4, 18, l, h);
  g.strokeStyle = "rgba(255,255,255,0.7)";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(x + 60, y + 12);
  g.lineTo(x + 110, y + 90);
  g.lineTo(x + 90, y + h - 12);
  g.moveTo(x + 110, y + 90);
  g.lineTo(x + l - 12, y + 70);
  g.stroke();
}
