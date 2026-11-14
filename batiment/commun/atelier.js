// L'atelier commun de la banque de bâtiments urbex.
//
// Même technique que le jeu (code/client/src/rendu/ruine.ts, assemblage.ts) : on pose des centaines de pièces teintées
// (la couleur passe par les sommets), puis on les fond en UN maillage par matériau. Un bâtiment entier = quelques
// dizaines d'appels de dessin, quel que soit le nombre de pièces.
//
// Conventions (Book 21 §5.3.2, Book 19) :
// - 1 unité = 1 m ; le sol est à y = 0 ; murs du rez-de-chaussée de 2,5 m de haut au moins (plus haut pour les bâtisses
//   anciennes : le personnage n'y entre que par le rez-de-chaussée, les étages sont visibles mais inaccessibles) ;
// - +x vers l'est, +z vers le sud ; la caméra de jeu regarde depuis le sud-est ;
// - l'origine d'un bâtiment est le centre de son lot, au sol.
//
// Ce module ne dépend que de « three » (résolu par la carte d'import de la visionneuse, ou par le paquet du jeu).

import * as THREE from "three";
import { mergeGeometries } from "../vendor/BufferGeometryUtils.js";

// ---------- Palette ----------

/** Palette du jeu (code/client/src/rendu/materiaux.ts) complétée des tons de bâti ancien, tous un peu passés. */
export const PALETTE = {
  herbe: 0x7fa35a,
  herbeSombre: 0x5f7f45,
  herbeSeche: 0x9aa65e,
  terre: 0x9c7a55,
  terreSombre: 0x7d6143,
  rouille: 0xa4552f,
  rouilleSombre: 0x6e3a22,
  bois: 0x7a5a3c,
  boisSombre: 0x5a4130,
  boisGris: 0x8a8274,
  feuillage: 0x5d8a46,
  feuillageSombre: 0x3f6b3a,
  feuillageClair: 0x7da150,
  mousse: 0x5f7a3a,
  pierre: 0x8f8a80,
  pierreSombre: 0x6e6a63,
  pierreBlonde: 0xc9b896,
  tuffeau: 0xd8ccb0,
  ardoise: 0x4a5058,
  zinc: 0x8d969a,
  cuivreVert: 0x6fa58f,
  brique: 0x9a5640,
  briqueSombre: 0x6f3d2e,
  beton: 0xa9a59c,
  betonSombre: 0x7c7870,
  enduitCreme: 0xe1d6bd,
  enduitBlanc: 0xe6e2d8,
  marbre: 0xe4e0d6,
  marbreNoir: 0x2e2c2b,
  carrelageVert: 0x8fb5a2,
  laiton: 0xb59048,
  dore: 0xb8963e,
  velours: 0x7a2630,
  verreSombre: 0x3a5560,
  eauVerte: 0x4f6b3a,
  suie: 0x2c2926,
  ciel: 0xc9d8e4,
  brume: 0xd6dccf,
  // Couleurs de l'Abondance : réservées aux vestiges, affiches et enseignes (Book 21 §5.3.1).
  abondanceRouge: 0xc8362b,
  abondanceCreme: 0xe9dfc6,
  abondanceCanard: 0x2f6f73,
  abondanceOcre: 0xc79a3b,
};

/** Générateur pseudo-aléatoire déterministe (même algorithme que le jeu). */
export function aleatoire(graine) {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Matériaux ----------

const matieres = new Map();

/**
 * Les finitions réelles : toute demande de matière est ramenée à la plus proche, pour tenir le budget d'appels de
 * dessin (chaque matière = un maillage de plus). Les teintes, elles, restent libres (couleur par sommet).
 */
const FINITIONS = [
  [0.95, 0], // mat : pierre, enduit, terre, bois brut, végétation
  [0.6, 0.05], // satiné : bois verni, plastique, cuir, carrosserie peinte
  [0.3, 0.05], // lisse : marbre, céramique, verre opaque, écrans éteints
  [0.75, 0.3], // tôle : métal peint, rouillé
  [0.4, 0.7], // métal : inox, laiton, chrome
];

/** Le matériau des pièces : couleur par sommet, facettes (une seule matière pour cent teintes). */
export function matiere(rugosite = 0.9, metal = 0) {
  let meilleure = FINITIONS[0];
  let d0 = Infinity;
  for (const f of FINITIONS) {
    const d = (f[0] - rugosite) ** 2 + (f[1] - metal) ** 2 * 2;
    if (d < d0) {
      d0 = d;
      meilleure = f;
    }
  }
  [rugosite, metal] = meilleure;
  const cle = `${rugosite}|${metal}`;
  let m = matieres.get(cle);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: rugosite, metalness: metal, flatShading: true });
    matieres.set(cle, m);
  }
  return m;
}

/** Matières courantes. */
export const MAT = {
  mat: () => matiere(0.9, 0),
  pierre: () => matiere(0.95, 0),
  bois: () => matiere(0.85, 0),
  tole: () => matiere(0.72, 0.25),
  metal: () => matiere(0.5, 0.45),
  rouille: () => matiere(0.95, 0.15),
  lisse: () => matiere(0.35, 0.05),
  toile: () => {
    let m = matieres.get("toile");
    if (!m) {
      m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true, side: THREE.DoubleSide });
      matieres.set("toile", m);
    }
    return m;
  },
};

/** Un matériau texturé (la teinte des sommets module la texture). `repete` : la texture se répète (UV « monde »). */
export function matiereTexture(map, options = {}) {
  return new THREE.MeshStandardMaterial({ map, vertexColors: true, roughness: 0.9, flatShading: false, ...options });
}

/** Le verre : sombre, un peu de reflet, à demi transparent, sans ombre portée. */
export function matiereVerre(teinte = PALETTE.verreSombre, opacite = 0.45) {
  // Une seule matière de verre par opacité (arrondie) : la teinte passe par les sommets.
  opacite = Math.round(opacite * 5) / 5 || 0.2;
  const cle = `verre|${opacite}`;
  if (matieres.has(cle)) return matieres.get(cle);
  const m = new THREE.MeshStandardMaterial({ color: 0x4a6670, vertexColors: true, roughness: 0.1, metalness: 0.4, transparent: true, opacity: opacite, depthWrite: false, side: THREE.DoubleSide });
  m.userData.sansOmbre = true;
  m.userData.teinteVerre = teinte;
  matieres.set(cle, m);
  return m;
}

/** L'eau croupie : vert sombre, miroir trouble. */
export function matiereEau(teinte = PALETTE.eauVerte, opacite = 0.88) {
  const cle = `eau|${teinte}|${opacite}`;
  if (matieres.has(cle)) return matieres.get(cle);
  const m = new THREE.MeshStandardMaterial({ color: teinte, vertexColors: true, roughness: 0.15, metalness: 0.25, transparent: true, opacity: opacite, depthWrite: false });
  m.userData.sansOmbre = true;
  matieres.set(cle, m);
  return m;
}

/** Une lumière qui « émet » (rai de soleil, lueur) : additive, sans ombre, ne cache rien. */
export function matiereLueur(couleur = 0xfff1c8, opacite = 0.22) {
  const cle = `lueur|${couleur}|${opacite}`;
  if (matieres.has(cle)) return matieres.get(cle);
  const m = new THREE.MeshBasicMaterial({ color: couleur, transparent: true, opacity: opacite, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, vertexColors: true });
  m.userData.sansOmbre = true;
  m.userData.lueur = true;
  matieres.set(cle, m);
  return m;
}

// ---------- Textures dessinées au canvas ----------

const texturesEnCache = new Map();

/** Dessine une texture (mise en cache par clé : un même motif ne se dessine qu'une fois). */
export function dessiner(cle, largeur, hauteur, trace, repete = true) {
  if (cle && texturesEnCache.has(cle)) return texturesEnCache.get(cle);
  const c = document.createElement("canvas");
  c.width = largeur;
  c.height = hauteur;
  trace(c.getContext("2d"));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repete) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (cle) texturesEnCache.set(cle, t);
  return t;
}

/** Des salissures : taches rondes et floues. */
export function taches(g, aleat, n, couleur, rMin, rMax, l, h) {
  for (let i = 0; i < n; i++) {
    const x = aleat() * l;
    const y = aleat() * h;
    const r = rMin + aleat() * (rMax - rMin);
    const d = g.createRadialGradient(x, y, 0, x, y, r);
    d.addColorStop(0, couleur);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

function grain(g, aleat, n, l, h, force = 0.06) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = aleat() < 0.5 ? `rgba(0,0,0,${force})` : `rgba(255,255,255,${force})`;
    g.fillRect(aleat() * l, aleat() * h, 1 + aleat() * 3, 1 + aleat() * 3);
  }
}

function coulures(g, aleat, n, l, longueur, couleur = "rgba(55, 50, 40, 0.3)") {
  for (let i = 0; i < n; i++) {
    const x = aleat() * l;
    const lg = longueur * (0.3 + aleat());
    const d = g.createLinearGradient(0, 0, 0, lg);
    d.addColorStop(0, couleur);
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(x, 0, 1 + aleat() * 5, lg);
  }
}

function fissures(g, aleat, n, l, h, couleur = "rgba(45, 38, 30, 0.55)") {
  g.strokeStyle = couleur;
  g.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    let x = aleat() * l;
    let y = aleat() * h;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 6; k++) {
      x += (aleat() - 0.5) * 18;
      y += 5 + aleat() * 9;
      g.lineTo(x, y);
    }
    g.stroke();
  }
}

/**
 * Les textures « monde » : une tuile couvre `TAILLE_TUILE` mètres (voir Chantier.poser, option uv).
 * Toutes sont en niveaux clairs et neutres : la teinte de la pièce les colore.
 */
export const TEX = {
  /** Enduit à la chaux sali : grain, coulures, fissures. Tuile de 4 m. */
  enduit: () =>
    dessiner("enduit", 256, 256, (g) => {
      const a = aleatoire(11);
      g.fillStyle = "#f2f0ea";
      g.fillRect(0, 0, 256, 256);
      grain(g, a, 1600, 256, 256, 0.05);
      taches(g, a, 10, "rgba(90, 84, 70, 0.16)", 14, 50, 256, 256);
      coulures(g, a, 30, 256, 120, "rgba(70, 62, 50, 0.22)");
      fissures(g, a, 5, 256, 256);
    }),
  /** Béton brut de décoffrage : planches de coffrage, trous de banche, coulures. Tuile de 4 m. */
  beton: () =>
    dessiner("beton", 256, 256, (g) => {
      const a = aleatoire(12);
      g.fillStyle = "#e8e6e0";
      g.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 256; y += 16) {
        g.fillStyle = `rgba(0,0,0,${0.02 + a() * 0.05})`;
        g.fillRect(0, y, 256, 16);
        g.fillStyle = "rgba(0,0,0,0.12)";
        g.fillRect(0, y, 256, 1);
      }
      g.fillStyle = "rgba(40,40,40,0.35)";
      for (let x = 32; x < 256; x += 64) for (let y = 24; y < 256; y += 64) {
        g.beginPath();
        g.arc(x, y, 2, 0, 7);
        g.fill();
      }
      grain(g, a, 1800, 256, 256, 0.05);
      coulures(g, a, 40, 256, 160, "rgba(50, 46, 40, 0.28)");
      taches(g, a, 8, "rgba(70, 90, 50, 0.25)", 10, 40, 256, 256);
    }),
  /** Brique : rangs à joints décalés, quelques briques plus sombres ou brûlées. Tuile de 2 m. */
  brique: () =>
    dessiner("brique", 256, 256, (g) => {
      const a = aleatoire(13);
      g.fillStyle = "#d9d2c8";
      g.fillRect(0, 0, 256, 256);
      const hb = 8;
      const lb = 28;
      for (let r = 0; r < 256 / hb; r++) {
        const dec = r % 2 ? lb / 2 : 0;
        for (let x = -lb; x < 256 + lb; x += lb) {
          const v = 200 + Math.floor((a() - 0.5) * 60);
          g.fillStyle = `rgb(${v},${v - 8},${v - 14})`;
          g.fillRect(x + dec + 1, r * hb + 1, lb - 2, hb - 2);
        }
      }
      taches(g, a, 12, "rgba(40, 36, 30, 0.22)", 10, 40, 256, 256);
      coulures(g, a, 20, 256, 140, "rgba(255,255,255,0.18)");
    }),
  /** Pierre de taille : assises régulières, joints, mousse au pied. Tuile de 4 m. */
  pierreTaille: () =>
    dessiner("pierreTaille", 256, 256, (g) => {
      const a = aleatoire(14);
      g.fillStyle = "#cfcac0";
      g.fillRect(0, 0, 256, 256);
      const h = 32;
      for (let r = 0; r < 8; r++) {
        let x = -a() * 40;
        while (x < 256) {
          const l = 40 + a() * 50;
          const v = 228 + Math.floor((a() - 0.5) * 30);
          g.fillStyle = `rgb(${v},${v - 4},${v - 10})`;
          g.fillRect(x + 1.5, r * h + 1.5, l - 3, h - 3);
          x += l;
        }
      }
      grain(g, a, 1500, 256, 256, 0.05);
      coulures(g, a, 26, 256, 150, "rgba(50, 46, 40, 0.25)");
      taches(g, a, 8, "rgba(80, 100, 55, 0.25)", 10, 40, 256, 256);
    }),
  /** Ardoises en écailles. Tuile de 2 m. */
  ardoise: () =>
    dessiner("ardoise", 128, 128, (g) => {
      const a = aleatoire(15);
      g.fillStyle = "#c8ccd2";
      g.fillRect(0, 0, 128, 128);
      for (let r = 0; r < 16; r++) {
        const dec = r % 2 ? 4 : 0;
        for (let x = -8; x < 136; x += 8) {
          const v = 190 + Math.floor((a() - 0.5) * 50);
          g.fillStyle = `rgb(${v},${v + 2},${v + 6})`;
          g.fillRect(x + dec, r * 8, 7, 7);
        }
      }
      taches(g, a, 6, "rgba(110, 140, 70, 0.35)", 6, 18, 128, 128);
    }),
  /** Carrelage carré (hôpital, cuisine) : joints, carreaux fêlés, salissures. Tuile de 2 m. */
  carrelage: () =>
    dessiner("carrelage", 128, 128, (g) => {
      const a = aleatoire(16);
      g.fillStyle = "#9a9a96";
      g.fillRect(0, 0, 128, 128);
      for (let x = 0; x < 128; x += 16) for (let y = 0; y < 128; y += 16) {
        const v = 236 + Math.floor((a() - 0.5) * 18);
        g.fillStyle = a() < 0.05 ? "#7c7c78" : `rgb(${v},${v},${v - 4})`;
        g.fillRect(x + 1, y + 1, 14, 14);
      }
      taches(g, a, 10, "rgba(80, 70, 50, 0.22)", 6, 28, 128, 128);
      fissures(g, a, 3, 128, 128, "rgba(60,60,60,0.4)");
    }),
  /** Damier noir et blanc (hall de château, salle de bal). Tuile de 2 m. */
  damier: () =>
    dessiner("damier", 128, 128, (g) => {
      const a = aleatoire(17);
      for (let x = 0; x < 4; x++) for (let y = 0; y < 4; y++) {
        g.fillStyle = (x + y) % 2 ? "#3b3936" : "#ece8de";
        g.fillRect(x * 32, y * 32, 32, 32);
      }
      grain(g, a, 600, 128, 128, 0.06);
      taches(g, a, 10, "rgba(90, 80, 60, 0.3)", 8, 30, 128, 128);
    }),
  /** Parquet en point de Hongrie usé. Tuile de 2 m. */
  parquet: () =>
    dessiner("parquet", 128, 128, (g) => {
      const a = aleatoire(18);
      g.fillStyle = "#b8a080";
      g.fillRect(0, 0, 128, 128);
      for (let y = 0; y < 128; y += 8) {
        let x = -a() * 30;
        while (x < 128) {
          const l = 20 + a() * 30;
          const v = 200 + Math.floor((a() - 0.5) * 50);
          g.fillStyle = `rgb(${v},${v - 20},${v - 50})`;
          g.fillRect(x + 0.5, y + 0.5, l - 1, 7);
          x += l;
        }
      }
      taches(g, a, 8, "rgba(60, 45, 30, 0.3)", 8, 30, 128, 128);
    }),
  /** Papier peint à motifs, décollé par endroits. Tuile de 2 m. */
  papierPeint: () =>
    dessiner("papierPeint", 128, 128, (g) => {
      const a = aleatoire(19);
      g.fillStyle = "#e6dcc4";
      g.fillRect(0, 0, 128, 128);
      g.fillStyle = "rgba(120, 100, 70, 0.35)";
      for (let x = 8; x < 128; x += 32) for (let y = 8; y < 128; y += 32) {
        const dx = (y / 32) % 2 ? 16 : 0;
        g.beginPath();
        g.ellipse(x + dx, y, 4, 7, 0, 0, 7);
        g.fill();
      }
      g.fillStyle = "rgba(200, 190, 170, 0.9)";
      for (let i = 0; i < 4; i++) g.fillRect(a() * 110, a() * 110, 10 + a() * 20, 8 + a() * 30);
      coulures(g, a, 18, 128, 90, "rgba(80, 66, 40, 0.3)");
    }),
};

/** Taille réelle (m) couverte par une tuile de chaque texture. */
export const TAILLE_TUILE = { enduit: 4, beton: 4, brique: 2, pierreTaille: 4, ardoise: 2, carrelage: 2, damier: 2, parquet: 2, papierPeint: 2 };

/** Le matériau d'une texture « monde » (UV calculées depuis la position, voir Chantier.poser). */
const matieresTex = new Map();
export function matiereMonde(nom, options = {}) {
  const cle = nom + JSON.stringify(options);
  let m = matieresTex.get(cle);
  if (!m) {
    m = matiereTexture(TEX[nom](), options);
    m.userData.tuile = TAILLE_TUILE[nom];
    matieresTex.set(cle, m);
  }
  return m;
}

// ---------- Le chantier : poser des pièces, puis les fusionner par matériau ----------

const OMBRE_SEULE = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
const BOITE = new THREE.BoxGeometry(1, 1, 1);
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3();

function matricePose(p, cible) {
  _e.set(p.rx ?? 0, p.ry ?? 0, p.rz ?? 0);
  _q.setFromEuler(_e);
  const e = p.e ?? 1;
  if (typeof e === "number") _s.set(e, e, e);
  else _s.set(e[0], e[1], e[2]);
  return cible.compose(_v.set(p.x ?? 0, p.y ?? 0, p.z ?? 0), _q, _s);
}

/**
 * Le chantier (même interface que celui du jeu) : `poser`, `boite`, `pave`, `poutre`, `repere`, `hasard`, `construire`,
 * `construireFondu`. Ajouts : UV « monde » automatiques pour les matériaux texturés (la texture garde sa taille réelle
 * quelle que soit la pièce), compteur de triangles.
 */
export class Chantier {
  constructor(graine = 1) {
    this.lots = new Map();
    this.pile = [new THREE.Matrix4()];
    this.aleat = aleatoire(graine);
    this.couleur = new THREE.Color();
  }

  /** Pose une géométrie (copiée), teintée, dans le repère courant. Options : nuance, crasse (pied assombri). */
  poser(geo, mat, couleur, pose = {}, options = {}) {
    const m = matricePose(pose, new THREE.Matrix4()).premultiply(this.pile[this.pile.length - 1]);
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const nom of Object.keys(g.attributes)) if (nom !== "position" && nom !== "normal" && nom !== "uv") g.deleteAttribute(nom);
    if (!g.attributes.normal) g.computeVertexNormals();
    const pos = g.attributes.position;
    if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(pos.count * 2), 2));
    g.applyMatrix4(m);
    // Texture « monde » : projection sur le plan le plus face à chaque triangle.
    const tuile = mat.userData?.tuile;
    if (tuile) {
      const uv = g.attributes.uv;
      const nor = g.attributes.normal;
      for (let i = 0; i < pos.count; i += 3) {
        let nx = 0, ny = 0, nz = 0;
        for (let j = 0; j < 3; j++) {
          nx += Math.abs(nor.getX(i + j));
          ny += Math.abs(nor.getY(i + j));
          nz += Math.abs(nor.getZ(i + j));
        }
        for (let j = 0; j < 3; j++) {
          const k = i + j;
          const x = pos.getX(k), y = pos.getY(k), z = pos.getZ(k);
          if (ny >= nx && ny >= nz) uv.setXY(k, x / tuile, z / tuile);
          else if (nx >= nz) uv.setXY(k, z / tuile, y / tuile);
          else uv.setXY(k, x / tuile, y / tuile);
        }
      }
    }
    const nuance = options.nuance ?? 0.04;
    this.couleur.setHex(couleur);
    if (nuance) this.couleur.offsetHSL(0, 0, (this.aleat() - 0.5) * nuance);
    const crasse = options.crasse ?? true;
    const c = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      // Le pied des choses est plus sombre : terre, éclaboussures, ombre de contact.
      const f = crasse ? 0.72 + 0.28 * Math.min(1, Math.max(0, pos.getY(i) / 1.1)) : 1;
      c[i * 3] = this.couleur.r * f;
      c[i * 3 + 1] = this.couleur.g * f;
      c[i * 3 + 2] = this.couleur.b * f;
    }
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
    let lot = this.lots.get(mat);
    if (!lot) this.lots.set(mat, (lot = []));
    lot.push(g);
    return this;
  }

  /** Une boîte de l × h × p, centrée sur la pose. */
  boite(l, h, p, couleur, pose = {}, mat = matiere(), options = {}) {
    const e = pose.e ?? 1;
    const s = typeof e === "number" ? [e, e, e] : e;
    return this.poser(BOITE, mat, couleur, { ...pose, e: [l * s[0], h * s[1], p * s[2]] }, options);
  }

  /** Une boîte posée par ses deux coins (alignée sur les axes du repère courant). */
  pave(x1, y1, z1, x2, y2, z2, couleur, mat = matiere(), options = {}) {
    return this.boite(Math.abs(x2 - x1), Math.abs(y2 - y1), Math.abs(z2 - z1), couleur, { x: (x1 + x2) / 2, y: (y1 + y2) / 2, z: (z1 + z2) / 2 }, mat, options);
  }

  /** Une poutre d'un point à un autre (tableaux [x, y, z] ou Vector3), de section s × s. */
  poutre(a, b, s, couleur, mat = matiere(), options = {}) {
    a = vec(a);
    b = vec(b);
    const d = new THREE.Vector3().subVectors(b, a);
    const l = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    const e = new THREE.Euler().setFromQuaternion(q);
    return this.boite(s, l, s, couleur, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2, rx: e.x, ry: e.y, rz: e.z }, mat, options);
  }

  /** Un tube (cylindre) d'un point à un autre, de rayon r. */
  tube(a, b, r, couleur, mat = matiere(), cotes = 8, options = {}) {
    a = vec(a);
    b = vec(b);
    const d = new THREE.Vector3().subVectors(b, a);
    const l = d.length();
    const g = new THREE.CylinderGeometry(r, r, l, cotes, 1, false);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    const e = new THREE.Euler().setFromQuaternion(q);
    this.poser(g, mat, couleur, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2, rx: e.x, ry: e.y, rz: e.z }, options);
    g.dispose();
    return this;
  }

  /** Tout ce qui est posé dans `poser` l'est dans le repère donné (imbriquable). */
  repere(pose, poser) {
    this.pile.push(matricePose(pose, new THREE.Matrix4()).premultiply(this.pile[this.pile.length - 1]));
    poser();
    this.pile.pop();
    return this;
  }

  /** Un nombre au hasard dans [0, 1[ (graine du chantier). */
  hasard() {
    return this.aleat();
  }

  /** Un nombre au hasard dans [a, b[. */
  entre(a, b) {
    return a + (b - a) * this.aleat();
  }

  get vide() {
    return this.lots.size === 0;
  }

  /** Fusionne tout : un maillage par matériau. */
  construire() {
    const groupe = new THREE.Group();
    for (const [mat, geos] of this.lots) {
      const geo = mergeGeometries(geos, false);
      if (!geo) continue;
      const m = new THREE.Mesh(geo, mat);
      const sansOmbre = !!mat.userData.sansOmbre;
      m.castShadow = !sansOmbre;
      m.receiveShadow = !mat.userData.lueur;
      if (mat.transparent) m.renderOrder = 2;
      groupe.add(m);
    }
    return groupe;
  }

  /**
   * Fusionne avec des matériaux propres à cette couche, qu'on pourra effacer en fondu (voir toits.js) ; un maillage
   * invisible garde l'ombre portée, pour que le dessous reste à l'ombre quand la couche s'efface.
   */
  construireFondu(ombrePortee = true) {
    const groupe = new THREE.Group();
    const materiaux = [];
    const toutes = [];
    for (const [mat, geos] of this.lots) {
      const geo = mergeGeometries(geos, false);
      if (!geo) continue;
      const fondu = mat.clone();
      fondu.transparent = true;
      fondu.userData = { ...mat.userData, opacite: mat.opacity };
      materiaux.push(fondu);
      const m = new THREE.Mesh(geo, fondu);
      m.castShadow = !ombrePortee && !mat.userData.sansOmbre;
      m.receiveShadow = !mat.userData.lueur;
      groupe.add(m);
      if (!mat.userData.sansOmbre) toutes.push(geo);
    }
    if (ombrePortee && toutes.length) {
      const ombre = new THREE.Mesh(mergeGeometries(toutes, false), OMBRE_SEULE);
      ombre.castShadow = true;
      ombre.receiveShadow = false;
      groupe.add(ombre);
    }
    return { objet: groupe, materiaux };
  }
}

function vec(p) {
  return p instanceof THREE.Vector3 ? p.clone() : new THREE.Vector3(p[0], p[1], p[2]);
}

// ---------- Le bâtiment : une structure, des couches qui s'effacent, des données de jeu ----------

/**
 * Un bâtiment en construction.
 * - `c` : le chantier de tout ce qui reste toujours visible (sol, murs du rez-de-chaussée, mobilier, végétation) ;
 * - `couche(...)` : un chantier à part pour ce qui doit s'effacer quand le personnage passe dessous ou derrière (toits,
 *   étages inaccessibles, façades hautes). Même format que les toits de la halte du jeu (`userData.toits`) ;
 * - `obstacles` : les segments infranchissables (murs pleins, sur 1 m de haut) que le jeu peut reprendre ;
 * - `lumieres` : les sources de lumière du lieu (nuit).
 */
export class Batiment {
  constructor(graine = 1, usure = 0.7) {
    this.graine = graine;
    this.usure = usure;
    this.c = new Chantier(graine);
    this.couches = [];
    this.obstacles = [];
    this.lumieres = [];
    this.extras = [];
  }

  /**
   * Une couche qui s'efface : `boite` {x, z, l, p} au sol, hauteurs `bas`/`haut` (m) ; `horsDe` : rien ne s'efface tant
   * que le personnage est dans cette boîte. Renvoie son chantier.
   */
  couche(nom, boite, bas, haut, horsDe) {
    const c = new Chantier(this.graine + this.couches.length * 97 + 7);
    this.couches.push({ nom, boite, bas, haut, horsDe, c });
    return c;
  }

  /** Un segment infranchissable (pour le jeu) de (x1, z1) à (x2, z2). */
  obstacle(x1, z1, x2, z2, nature = "mur") {
    this.obstacles.push({ x1: arrondi(x1), z1: arrondi(z1), x2: arrondi(x2), z2: arrondi(z2), nature });
  }

  /** Une source de lumière : position, couleur, intensité, portée ; `nuit` : seulement la nuit. */
  lumiere(x, y, z, couleur = 0xffd27a, intensite = 6, portee = 12, nature = "lampe") {
    this.lumieres.push({ x, y, z, couleur, intensite, portee, nature });
  }

  /** Ajoute un objet déjà construit (animé, par exemple). */
  ajouter(objet) {
    this.extras.push(objet);
  }

  /** Fusionne le tout. Renvoie le groupe, prêt à poser dans une scène. */
  construire() {
    const groupe = new THREE.Group();
    groupe.add(this.c.construire());
    const toits = [];
    for (const k of this.couches) {
      if (k.c.vide) continue;
      const { objet, materiaux } = k.c.construireFondu(true);
      objet.name = k.nom;
      groupe.add(objet);
      toits.push({ nom: k.nom, boite: k.boite, bas: k.bas, haut: k.haut, horsDe: k.horsDe, materiaux });
    }
    for (const o of this.extras) groupe.add(o);
    groupe.userData.toits = toits;
    groupe.userData.lumieres = this.lumieres;
    groupe.userData.obstacles = this.obstacles;
    return groupe;
  }
}

function arrondi(v) {
  return Math.round(v * 100) / 100;
}

// ---------- Murs à ouvertures et à brèches ----------

/**
 * Un mur droit de `a` = [x, z] à `b` = [x, z], posé de y = `y0` à y0 + `h`, épaisseur `ep`.
 * - `ouvertures` : [{ u, l, bas, haut, type: "porte" | "fenetre" | "vide", ...options de fenêtre }] — `u` est la distance
 *   depuis `a` au centre de l'ouverture ;
 * - `breches` : [{ u, l, profondeur }] — le haut du mur s'est effondré là (profil en V, bord déchiqueté) ;
 * - `arase` : la crête du mur est un peu irrégulière (0 : nette) ;
 * - `batiment` : un Batiment, pour noter les segments pleins (pour le jeu) ;
 * - `interieur` : { couleur, mat } revêtement de la face intérieure (−z local ; +z est l'extérieur, comme pour fenetre()).
 * Les morceaux de même hauteur sont fusionnés : un mur de 20 m avec trois fenêtres fait une quinzaine de boîtes.
 */
export function mur(c, a, b, spec) {
  const { h, ep = 0.3, couleur, mat = matiere(), y0 = 0, ouvertures = [], breches = [], arase = 0, batiment = null, interieur = null } = spec;
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const L = Math.hypot(dx, dz);
  const ry = -Math.atan2(dz, dx);
  const pas = 0.4;
  const n = Math.max(1, Math.round(L / pas));
  const du = L / n;
  // La hauteur de la crête pour chaque colonne
  const haut = [];
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) * du;
    let hh = h;
    for (const br of breches) {
      const t = 1 - Math.abs(u - br.u) / (br.l / 2);
      if (t > 0) hh = Math.min(hh, h - br.profondeur * Math.pow(t, 0.7) - c.hasard() * 0.35 * br.profondeur * t);
    }
    if (arase > 0) hh -= c.hasard() * arase;
    haut.push(Math.max(0.15, hh));
  }
  // Pour chaque colonne : les tranches pleines [y1, y2]
  const tranches = [];
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) * du;
    const o = ouvertures.find((q) => Math.abs(u - q.u) < q.l / 2);
    const top = haut[i];
    if (!o) tranches.push([[0, top]]);
    else {
      const t = [];
      if (o.bas > 0.01) t.push([0, Math.min(o.bas, top)]);
      if (o.haut < top - 0.01) t.push([o.haut, top]);
      tranches.push(t);
    }
  }
  c.repere({ x: a[0], y: y0, z: a[1], ry }, () => {
    // Fusionner les colonnes voisines qui ont les mêmes tranches
    let debut = 0;
    const cle = (t) => t.map((q) => q[0].toFixed(2) + ":" + q[1].toFixed(2)).join("|");
    for (let i = 1; i <= n; i++) {
      if (i < n && cle(tranches[i]) === cle(tranches[debut])) continue;
      const u1 = debut * du;
      const u2 = i * du;
      for (const [y1, y2] of tranches[debut]) {
        if (y2 - y1 < 0.02) continue;
        c.pave(u1, y1, -ep / 2, u2, y2, ep / 2, couleur, mat, { nuance: 0.02 });
        if (interieur) c.pave(u1, y1, -ep / 2 - 0.01, u2, y2, -ep / 2, interieur.couleur, interieur.mat, { nuance: 0.02, crasse: interieur.crasse ?? true });
      }
      debut = i;
    }
    // Les ouvertures garnies
    for (const o of ouvertures) {
      if (o.type === "fenetre") fenetre(c, o.u, o.bas, o.haut, o.l, ep, o);
      if (o.type === "porte" && o.vantail) porte(c, o.u, o.bas, o.haut, o.l, ep, o);
    }
  });
  // Les segments pleins pour le jeu (ce qui bloque à hauteur d'homme)
  if (batiment && y0 < 0.5) {
    let debut = null;
    for (let i = 0; i <= n; i++) {
      // Bloque le passage : par défaut, une tranche pleine qui franchit 1 m. Avec `seuilObstacle` (option, ex. 0,8),
      // une tranche qui part du sol et monte jusqu'au seuil suffit : un appui de fenêtre à 1 m bloque alors aussi.
      const plein = i < n && tranches[i].some(([y1, y2]) => (spec.seuilObstacle ? y1 < 0.5 && y2 >= spec.seuilObstacle : y1 < 1 && y2 > 1));
      if (plein && debut === null) debut = i;
      if (!plein && debut !== null) {
        const t1 = (debut * du) / L;
        const t2 = (i * du) / L;
        batiment.obstacle(a[0] + dx * t1, a[1] + dz * t1, a[0] + dx * t2, a[1] + dz * t2);
        debut = null;
      }
    }
  }
}

/**
 * Une fenêtre dans le repère d'un mur (+x le long du mur, +z vers l'extérieur) : encadrement, appui, croisillons,
 * vitres dont une part `bris` (0 à 1) est cassée (éclats aux coins). Options : cadre (couleur), croisillons (nombre de
 * bois verticaux), traverses, volet (« ouvert », « pendu », « ferme »), rideau (couleur), verre (matériau).
 */
export function fenetre(c, u, bas, haut, l, ep, o = {}) {
  const cadre = o.cadre ?? 0xe6e2d8;
  const matCadre = o.matCadre ?? matiere(0.8);
  const h = haut - bas;
  const yc = (bas + haut) / 2;
  const fc = 0.07;
  // Encadrement
  c.pave(u - l / 2, bas, -fc / 2, u - l / 2 + fc, haut, fc / 2, cadre, matCadre);
  c.pave(u + l / 2 - fc, bas, -fc / 2, u + l / 2, haut, fc / 2, cadre, matCadre);
  c.pave(u - l / 2, haut - fc, -fc / 2, u + l / 2, haut, fc / 2, cadre, matCadre);
  c.pave(u - l / 2, bas, -fc / 2, u + l / 2, bas + fc, fc / 2, cadre, matCadre);
  if (o.appui !== false) c.pave(u - l / 2 - 0.08, bas - 0.06, -0.02, u + l / 2 + 0.08, bas, ep / 2 + 0.1, o.couleurAppui ?? 0xcfc8b8, matiere());
  const nv = o.croisillons ?? 1;
  const nt = o.traverses ?? Math.max(1, Math.round(h / 0.9));
  for (let i = 1; i <= nv; i++) c.pave(u - l / 2 + (l * i) / (nv + 1) - 0.025, bas, -0.02, u - l / 2 + (l * i) / (nv + 1) + 0.025, haut, 0.02, cadre, matCadre);
  for (let j = 1; j < nt; j++) c.pave(u - l / 2, bas + (h * j) / nt - 0.02, -0.02, u + l / 2, bas + (h * j) / nt + 0.02, 0.02, cadre, matCadre);
  // Les carreaux : entiers, fendus ou cassés (il reste des éclats en pointe dans les coins)
  const verre = o.verre ?? matiereVerre();
  const bris = o.bris ?? 0.5;
  const lc = l / (nv + 1);
  const hc = h / nt;
  for (let i = 0; i <= nv; i++) for (let j = 0; j < nt; j++) {
    const x0 = u - l / 2 + i * lc;
    const y0 = bas + j * hc;
    const r = c.hasard();
    if (r > bris) {
      c.boite(lc - 0.05, hc - 0.05, 0.01, 0xffffff, { x: x0 + lc / 2, y: y0 + hc / 2, z: 0 }, verre, { crasse: false });
    } else if (r > bris * 0.35) {
      // Éclats : deux triangles plantés dans les coins
      const coins = [[x0, y0, 1, 1], [x0 + lc, y0 + hc, -1, -1], [x0 + lc, y0, -1, 1], [x0, y0 + hc, 1, -1]];
      for (let k = 0; k < 2; k++) {
        const [cx, cy, sx, sy] = coins[Math.floor(c.hasard() * 4)];
        const p = [cx, cy, 0, cx + sx * lc * c.entre(0.3, 0.8), cy, 0, cx, cy + sy * hc * c.entre(0.3, 0.8), 0];
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
        g.computeVertexNormals();
        c.poser(g, verre, 0xffffff, {}, { crasse: false, nuance: 0 });
      }
    }
  }
  if (o.rideau) {
    // Un rideau qui pend, déchiré, un peu sorti par la fenêtre
    const nb = 3;
    for (let k = 0; k < nb; k++) {
      const lx = u - l / 2 + 0.1 + (k * (l - 0.2)) / nb;
      const lg = h * c.entre(0.5, 0.95);
      c.boite(l / nb - 0.04, lg, 0.02, o.rideau, { x: lx + (l / nb) / 2, y: haut - 0.1 - lg / 2, z: -ep / 2 + 0.03 + k * 0.01, rx: c.entre(-0.08, 0.08), rz: c.entre(-0.05, 0.05) }, MAT.toile(), { nuance: 0.08, crasse: false });
    }
  }
  if (o.volet) {
    const cv = o.couleurVolet ?? 0x6f8b76;
    const lv = l / 2 + 0.05;
    if (o.volet === "ouvert" || o.volet === "pendu") {
      for (const s of [-1, 1]) {
        const pendu = o.volet === "pendu" && s === 1;
        c.repere({ x: u + s * (l / 2 + lv / 2 + 0.02), y: yc, z: ep / 2 + 0.04, rz: pendu ? -0.35 : 0, ry: pendu ? 0.5 : 0 }, () => {
          for (let k = 0; k < 6; k++) {
            if (c.hasard() < 0.12) continue; // lame manquante
            c.boite(lv, h / 6 - 0.03, 0.03, cv, { y: -h / 2 + (k + 0.5) * (h / 6), rx: -0.25 }, matiere(0.85), { nuance: 0.07 });
          }
          c.boite(lv, 0.08, 0.04, cv, { y: h / 2 - 0.05 }, matiere(0.85));
          c.boite(lv, 0.08, 0.04, cv, { y: -h / 2 + 0.05 }, matiere(0.85));
        });
      }
    }
  }
}

/** Une porte dans le repère d'un mur : vantail entrouvert, tombé ou arraché. Options : vantail (« entrouvert » | « tombe »), couleurPorte. */
export function porte(c, u, bas, haut, l, ep, o = {}) {
  const coul = o.couleurPorte ?? PALETTE.boisSombre;
  const h = haut - bas;
  if (o.vantail === "tombe") {
    c.boite(l - 0.1, 0.06, h - 0.05, coul, { x: u + 0.2, y: 0.05, z: ep / 2 + h / 2 + 0.1, ry: 0.15 }, matiere(0.85), { nuance: 0.06 });
  } else {
    const ang = o.angle ?? 1.1;
    c.repere({ x: u - l / 2 + 0.04, y: bas, z: ep / 2 - 0.02, ry: ang }, () => {
      c.boite(l - 0.08, h - 0.04, 0.05, coul, { x: (l - 0.08) / 2, y: h / 2 }, matiere(0.85), { nuance: 0.04 });
      for (const yy of [0.25, 0.62]) c.boite(l - 0.3, h * 0.28, 0.02, coul, { x: (l - 0.08) / 2, y: h * yy + h * 0.1, z: 0.035 }, matiere(0.85), { nuance: 0.08 });
    });
  }
}

// ---------- Les marques du temps ----------

const FEUILLE = new THREE.IcosahedronGeometry(0.22, 0);
const CAILLOU = new THREE.DodecahedronGeometry(0.5, 0);
const BRIN = new THREE.ConeGeometry(0.05, 0.45, 3).translate(0, 0.22, 0);

/** Du lierre plaqué contre une face (dans le repère de pose, la face regarde +z) : dense au pied, en langues qui montent. */
export function lierre(c, x, y0, z, ry, largeur, hauteur, n) {
  const tons = [PALETTE.feuillageSombre, PALETTE.feuillage, 0x4f7a3c, 0x6d8f45];
  c.repere({ x, y: 0, z, ry }, () => {
    const langues = Math.max(1, Math.round(largeur / 1.5));
    for (let i = 0; i < n; i++) {
      const lg = Math.floor(c.hasard() * langues);
      const t = Math.pow(c.hasard(), 1.4);
      const centre = (lg + 0.5) / langues - 0.5;
      const px = centre * largeur + (c.hasard() - 0.5) * (largeur / langues) * (1.2 - t * 0.7);
      const py = y0 + t * hauteur * (0.6 + 0.4 * ((lg * 37) % 5) / 4);
      const s = 0.55 + c.hasard() * 0.8;
      c.poser(FEUILLE, matiere(), tons[Math.floor(c.hasard() * tons.length)], { x: px, y: py, z: 0.07, rx: c.hasard() * 3, ry: c.hasard() * 3, e: [s, s, s * 0.45] }, { nuance: 0.08, crasse: false });
    }
  });
}

/** Des touffes d'herbes folles au pied des murs, dans les fissures, entre les dalles. */
export function touffes(c, points, teinte = PALETTE.herbeSeche) {
  for (const [x, z, y = 0] of points) {
    const s = 0.7 + c.hasard() * 0.9;
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI * 2) / 4 + c.hasard();
      c.poser(BRIN, matiere(), c.hasard() < 0.5 ? teinte : PALETTE.herbe, { x: x + Math.cos(a) * 0.06, y, z: z + Math.sin(a) * 0.06, rz: 0.4 * Math.cos(a), rx: 0.4 * Math.sin(a), e: s }, { nuance: 0.1, crasse: false });
    }
  }
}

/** Des touffes semées au hasard dans un rectangle. */
export function semerTouffes(c, x1, z1, x2, z2, n, teinte, y = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) pts.push([c.entre(x1, x2), c.entre(z1, z2), y]);
  touffes(c, pts, teinte);
}

/** Un tas de gravats : blocs anguleux, morceaux de plâtre, une latte. `tons` : couleurs des débris. */
export function gravats(c, x, z, rayon, n, tons = [PALETTE.pierre, PALETTE.enduitCreme, PALETTE.pierreSombre], y = 0) {
  for (let i = 0; i < n; i++) {
    const a = c.hasard() * Math.PI * 2;
    const r = Math.sqrt(c.hasard()) * rayon;
    const s = c.entre(0.12, 0.42) * (1 - (r / rayon) * 0.5);
    const hauteur = (1 - r / rayon) * rayon * 0.35;
    c.poser(CAILLOU, matiere(0.95), tons[Math.floor(c.hasard() * tons.length)], { x: x + Math.cos(a) * r, y: y + hauteur * c.hasard() + s * 0.2, z: z + Math.sin(a) * r, rx: c.hasard() * 3, ry: c.hasard() * 3, e: [s * c.entre(0.8, 1.6), s * 0.6, s] }, { nuance: 0.08 });
  }
  if (rayon > 0.8) {
    for (let k = 0; k < 2; k++) c.boite(c.entre(1, 2.2), 0.05, 0.12, PALETTE.boisGris, { x: x + c.entre(-rayon, rayon) * 0.5, y: y + 0.15 + c.hasard() * rayon * 0.2, z: z + c.entre(-rayon, rayon) * 0.5, ry: c.hasard() * 3, rz: c.entre(-0.3, 0.3) }, matiere(0.9), { nuance: 0.08 });
  }
}

/** Des débris épars au sol : plâtre, papiers, éclats (en rectangle). */
export function debris(c, x1, z1, x2, z2, n, tons = [PALETTE.enduitCreme, PALETTE.pierre, 0xd9d2c0], y = 0) {
  for (let i = 0; i < n; i++) {
    const s = c.entre(0.05, 0.22);
    c.poser(CAILLOU, matiere(0.95), tons[Math.floor(c.hasard() * tons.length)], { x: c.entre(x1, x2), y: y + s * 0.15, z: c.entre(z1, z2), rx: c.hasard() * 3, ry: c.hasard() * 3, e: [s * 1.4, s * 0.35, s] }, { nuance: 0.1, crasse: false });
  }
}

/** Des feuilles mortes et des papiers à plat. */
export function jonchee(c, x1, z1, x2, z2, n, tons = [0x9c7a45, 0x7d6143, 0xb08f55, 0x6f5a3a], y = 0.01) {
  for (let i = 0; i < n; i++) {
    const s = c.entre(0.1, 0.25);
    c.boite(s, 0.01, s * 0.7, tons[Math.floor(c.hasard() * tons.length)], { x: c.entre(x1, x2), y, z: c.entre(z1, z2), ry: c.hasard() * 3 }, matiere(), { nuance: 0.12, crasse: false });
  }
}

/** Une plaque de mousse ou une tache sur une face horizontale (toit, dalle) : quelques disques aplatis. */
export function mousse(c, x, y, z, rayon, n, ton = PALETTE.mousse) {
  for (let i = 0; i < n; i++) {
    const a = c.hasard() * Math.PI * 2;
    const r = Math.sqrt(c.hasard()) * rayon;
    const s = c.entre(0.2, 0.5) * rayon;
    c.poser(FEUILLE, matiere(), ton, { x: x + Math.cos(a) * r, y: y + 0.02, z: z + Math.sin(a) * r, ry: c.hasard() * 3, e: [s * 3, 0.15, s * 3] }, { nuance: 0.1, crasse: false });
  }
}

/** Un arbuste : une boule de feuillage à facettes, quelques bouquets. */
export function arbuste(c, x, z, taille = 1, y = 0, tons = [PALETTE.feuillage, PALETTE.feuillageSombre, PALETTE.feuillageClair]) {
  const n = 4 + Math.floor(c.hasard() * 4);
  for (let i = 0; i < n; i++) {
    const s = taille * c.entre(0.35, 0.6);
    c.poser(new THREE.IcosahedronGeometry(1, 0), matiere(), tons[i % tons.length], { x: x + c.entre(-0.5, 0.5) * taille, y: y + s * 0.8 + c.hasard() * taille * 0.4, z: z + c.entre(-0.5, 0.5) * taille, rx: c.hasard() * 3, ry: c.hasard() * 3, e: s }, { nuance: 0.08, crasse: false });
  }
}

/** Un arbre : tronc qui se divise, houppier en bouquets à facettes. `essence` : « feuillu », « bouleau », « mort ». */
export function arbre(c, x, z, hauteur = 6, essence = "feuillu", y = 0) {
  const tronc = essence === "bouleau" ? 0xd8d4c8 : essence === "mort" ? 0x6a5a48 : 0x5e4a36;
  const r = hauteur * 0.035;
  const fut = hauteur * 0.45;
  const penche = c.entre(-0.08, 0.08);
  c.tube([x, y, z], [x + penche * fut, y + fut, z], r, tronc, matiere(0.95), 6);
  const branches = essence === "mort" ? 5 : 4;
  const sommets = [];
  for (let i = 0; i < branches; i++) {
    const a = (i / branches) * Math.PI * 2 + c.hasard();
    const lg = hauteur * c.entre(0.3, 0.5);
    const b = [x + penche * fut + Math.cos(a) * lg * 0.45, y + fut + lg * 0.8, z + Math.sin(a) * lg * 0.45];
    c.tube([x + penche * fut, y + fut, z], b, r * 0.55, tronc, matiere(0.95), 5);
    sommets.push(b);
  }
  if (essence === "mort") return;
  const tons = essence === "bouleau" ? [0x86a65a, 0x9cb865, 0x6f914a] : [PALETTE.feuillage, PALETTE.feuillageSombre, PALETTE.feuillageClair];
  for (const s of sommets) {
    for (let k = 0; k < 3; k++) {
      const t = hauteur * c.entre(0.13, 0.22);
      c.poser(new THREE.IcosahedronGeometry(1, 0), matiere(), tons[(k + Math.floor(c.hasard() * 3)) % 3], { x: s[0] + c.entre(-1, 1) * t, y: s[1] + c.entre(-0.4, 0.8) * t, z: s[2] + c.entre(-1, 1) * t, rx: c.hasard() * 3, ry: c.hasard() * 3, e: t }, { nuance: 0.07, crasse: false });
    }
  }
}

/** Un rai de lumière (soleil par un trou de toit ou une fenêtre haute) : un prisme lumineux, additif. */
export function raiDeLumiere(c, depuis, vers, largeur, opacite = 0.16, couleur = 0xfff0c8) {
  const a = vec(depuis);
  const b = vec(vers);
  const d = new THREE.Vector3().subVectors(b, a);
  const l = d.length();
  const g = new THREE.CylinderGeometry(largeur * 0.5, largeur * 0.62, l, 4, 1, true);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  const e = new THREE.Euler().setFromQuaternion(q);
  c.poser(g, matiereLueur(couleur, opacite), 0xffffff, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2, rx: e.x, ry: e.y + Math.PI / 4, rz: e.z }, { crasse: false, nuance: 0 });
  g.dispose();
}

/** Une flaque (eau de pluie entrée par le toit) : un disque irrégulier, miroir sombre. */
export function flaque(c, x, z, rayon, y = 0.015) {
  const pts = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = rayon * c.entre(0.6, 1.1);
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts)).rotateX(-Math.PI / 2);
  c.poser(g, matiereEau(0x3c4a44, 0.7), 0xffffff, { x, y, z }, { crasse: false, nuance: 0 });
  g.dispose();
}

// ---------- Toits ----------

/**
 * Un toit à deux pans (faîtage selon x), de longueur `l`, de largeur `p`, posé à y = `y0`, de hauteur `hf` au faîtage.
 * `trous` : [{ u, v, l, p }] pans manquants (u le long du faîtage depuis le centre, v en travers : -1 pan nord, +1 pan sud).
 * Le toit est fait de lés (bandes) pour pouvoir y percer des trous et laisser voir les chevrons.
 */
export function toitDeuxPans(c, x, z, l, p, y0, hf, spec = {}) {
  const { couleur = PALETTE.ardoise, mat = matiereMonde("ardoise"), debord = 0.35, trous = [], charpente = PALETTE.boisSombre, ry = 0 } = spec;
  const demi = p / 2 + debord;
  const pente = Math.atan2(hf, p / 2);
  const rampant = Math.hypot(demi, hf * (demi / (p / 2)));
  const lg = l + debord * 2;
  const nb = Math.max(2, Math.round(lg / 1.2));
  c.repere({ x, y: y0, z, ry }, () => {
    for (const s of [-1, 1]) {
      for (let i = 0; i < nb; i++) {
        const u = -lg / 2 + (i + 0.5) * (lg / nb);
        const troue = trous.find((t) => Math.sign(t.v) === s && Math.abs(u - t.u) < t.l / 2);
        // Un lé = une bande du faîtage à l'égout, découpée en deux moitiés pour les trous partiels
        for (const [v1, v2] of [[0, 0.5], [0.5, 1]]) {
          // Un trou part de l'égout et remonte sur une part `p` du rampant (1 : jusqu'au faîtage).
          if (troue && v1 >= 1 - (troue.p ?? 1) - 1e-6) continue;
          const vm = (v1 + v2) / 2;
          const yy = hf - hf * (demi / (p / 2)) * vm;
          const zz = s * demi * vm;
          c.boite(lg / nb + 0.01, 0.08, rampant * (v2 - v1) + 0.02, couleur, { x: u, y: yy, z: zz, rx: s * pente }, mat, { nuance: 0.03, crasse: false });
        }
      }
      // Chevrons visibles sous les trous
      for (const t of trous.filter((q) => Math.sign(q.v) === s)) {
        for (let u = t.u - t.l / 2 + 0.3; u < t.u + t.l / 2; u += 0.6) {
          if (c.hasard() < 0.25) continue;
          c.poutre([u, hf - 0.1, 0], [u, -0.05, s * (p / 2)], 0.1, charpente, matiere(0.9));
        }
      }
    }
    // Faîtage
    c.boite(lg, 0.14, 0.22, couleur === PALETTE.ardoise ? PALETTE.zinc : couleur, { y: hf + 0.03 }, matiere(0.6, 0.3), { crasse: false });
  });
}
