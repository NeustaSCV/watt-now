// La ruine de ferme du terrain (Book 21 §3.2) : murs de pierre effondrés, pignon encore debout, cheminée,
// charpente tombée, un pan de toit glissé, un jeune bouleau qui pousse dedans. Elle raconte l'Abondance sans un
// mot (Book 20 §5) : une boîte aux lettres, une affiche délavée.
//
// Ce fichier porte aussi les outils de construction des bâtiments (halte, Comptoir) : le « chantier », qui pose
// des pièces teintées puis les fusionne par matériau (quelques maillages par bâtiment au lieu de centaines), et
// les textures dessinées au canvas.

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RUINE } from "../../../commun/src/terrain.ts";
import { PALETTE, aleatoire, materiau } from "./materiaux.ts";

// ---------- Les textures dessinées ----------

export function dessiner(largeur: number, hauteur: number, trace: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = largeur;
  c.height = hauteur;
  trace(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function textureAffiche(): THREE.Texture {
  return dessiner(96, 128, (g) => {
    g.fillStyle = "#e9dfc6";
    g.fillRect(0, 0, 96, 128);
    g.fillStyle = "#c8362b";
    g.fillRect(0, 0, 96, 26);
    g.fillStyle = "#f4ecd8";
    g.font = "bold 15px sans-serif";
    g.fillText("WATTY", 22, 19);
    // Watty, la pile souriante (Book 18 §6.1), en très simple
    g.fillStyle = "#3b2a1e";
    g.fillRect(36, 40, 24, 46);
    g.fillStyle = "#d8c43a";
    g.fillRect(39, 43, 18, 40);
    g.fillStyle = "#c8362b";
    g.beginPath();
    g.moveTo(50, 50);
    g.lineTo(44, 64);
    g.lineTo(50, 64);
    g.lineTo(46, 78);
    g.lineTo(54, 60);
    g.lineTo(48, 60);
    g.fill();
    g.fillStyle = "#3b2a1e";
    g.font = "bold 10px sans-serif";
    g.fillText("Toujours plein,", 12, 100);
    g.fillText("jamais à plat !", 13, 112);
    // corrigé au feutre par les survivants
    g.strokeStyle = "#1f2a44";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(8, 104);
    g.lineTo(88, 96);
    g.stroke();
    g.fillStyle = "#1f2a44";
    g.font = "italic bold 12px sans-serif";
    g.fillText("Watty ment !", 18, 124);
    // Délavée : un voile, des taches d'humidité
    g.fillStyle = "rgba(233, 223, 198, 0.18)";
    g.fillRect(0, 0, 96, 128);
    g.fillStyle = "rgba(120, 96, 60, 0.18)";
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.arc(Math.random() * 96, Math.random() * 128, 4 + Math.random() * 10, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** Des salissures : taches rondes et floues, au hasard (graine fixe). */
export function taches(g: CanvasRenderingContext2D, aleat: () => number, n: number, couleur: string, rMin: number, rMax: number, l: number, h: number): void {
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

/** Un toit plat en membrane bitumée gravillonnée : taches d'eau, mousse, plaques rapiécées. */
export function textureToitPlat(graine: number, base = "#77736b"): THREE.CanvasTexture {
  const aleat = aleatoire(graine);
  return dessiner(256, 256, (g) => {
    g.fillStyle = base;
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++) {
      const v = 80 + Math.floor(aleat() * 70);
      g.fillStyle = `rgba(${v},${v - 3},${v - 8},0.55)`;
      g.fillRect(aleat() * 256, aleat() * 256, 2, 2);
    }
    // Lés de membrane, recouvrements
    g.strokeStyle = "rgba(40, 38, 34, 0.35)";
    g.lineWidth = 2;
    for (let y = 30; y < 256; y += 64) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(256, y + 3);
      g.stroke();
    }
    taches(g, aleat, 7, "rgba(50, 46, 40, 0.35)", 14, 40, 256, 256);
    taches(g, aleat, 9, "rgba(86, 112, 58, 0.55)", 6, 22, 256, 256);
    // Rapiéçages plus sombres
    g.fillStyle = "rgba(45, 44, 42, 0.5)";
    for (let i = 0; i < 3; i++) g.fillRect(aleat() * 220, aleat() * 220, 20 + aleat() * 30, 14 + aleat() * 20);
  });
}

/** Un mur enduit, sali : coulures sous l'acrotère, pied verdi, fissures. Conçue pour être étirée sur une face. */
export function textureEnduit(graine: number, fond: string, pied = "rgba(70, 82, 50, 0.45)"): THREE.CanvasTexture {
  const aleat = aleatoire(graine);
  return dessiner(256, 128, (g) => {
    g.fillStyle = fond;
    g.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = aleat() < 0.5 ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)";
      g.fillRect(aleat() * 256, aleat() * 128, 2 + aleat() * 3, 2 + aleat() * 3);
    }
    // Coulures depuis le haut
    for (let i = 0; i < 26; i++) {
      const x = aleat() * 256;
      const l = 20 + aleat() * 70;
      const d = g.createLinearGradient(0, 0, 0, l);
      d.addColorStop(0, "rgba(60, 54, 44, 0.32)");
      d.addColorStop(1, "rgba(60, 54, 44, 0)");
      g.fillStyle = d;
      g.fillRect(x, 0, 2 + aleat() * 6, l);
    }
    // Le pied du mur, verdi et éclaboussé
    const p = g.createLinearGradient(0, 96, 0, 128);
    p.addColorStop(0, "rgba(0,0,0,0)");
    p.addColorStop(1, pied);
    g.fillStyle = p;
    g.fillRect(0, 96, 256, 32);
    // Fissures
    g.strokeStyle = "rgba(50, 42, 34, 0.5)";
    g.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      let x = aleat() * 256;
      let y = aleat() * 60;
      g.beginPath();
      g.moveTo(x, y);
      for (let k = 0; k < 5; k++) {
        x += (aleat() - 0.5) * 16;
        y += 6 + aleat() * 8;
        g.lineTo(x, y);
      }
      g.stroke();
    }
  });
}

// ---------- Le chantier : poser des pièces, puis les fusionner par matériau ----------

const matieres = new Map<string, THREE.MeshStandardMaterial>();

/** Le matériau des pièces posées au chantier : la couleur vient des sommets (une seule matière pour cent teintes). */
export function matiere(rugosite = 0.9, metal = 0): THREE.MeshStandardMaterial {
  const cle = `${rugosite}|${metal}`;
  let m = matieres.get(cle);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: rugosite, metalness: metal, flatShading: true });
    matieres.set(cle, m);
  }
  return m;
}

/** Un matériau texturé pour le chantier (la teinte des sommets reste blanche). */
export function matiereTexture(map: THREE.Texture, options: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ map, vertexColors: true, roughness: 0.85, ...options });
}

/** Le verre des vitrines : sombre, un peu de reflet, à demi transparent. */
export function matiereVerre(teinte = 0x3a5560, opacite = 0.5): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ color: teinte, vertexColors: true, roughness: 0.12, metalness: 0.35, transparent: true, opacity: opacite, depthWrite: false });
  m.userData.sansOmbre = true;
  return m;
}

/** Une matière qui n'écrit rien à l'écran : elle ne sert qu'à porter l'ombre d'un toit effacé. */
const OMBRE_SEULE = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });

export interface Pose {
  x?: number;
  y?: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  /** Échelle : un nombre, ou [x, y, z]. */
  e?: number | readonly [number, number, number];
}

export interface OptionsPiece {
  /** Variation de clarté d'une pièce à l'autre (0 : aucune). */
  nuance?: number;
  /** Le pied des pièces est assombri (crasse, ombre de contact) : vrai par défaut. */
  crasse?: boolean;
}

const BOITE = new THREE.BoxGeometry(1, 1, 1);
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3();

function matricePose(p: Pose, cible: THREE.Matrix4): THREE.Matrix4 {
  _e.set(p.rx ?? 0, p.ry ?? 0, p.rz ?? 0);
  _q.setFromEuler(_e);
  const e = p.e ?? 1;
  if (typeof e === "number") _s.set(e, e, e);
  else _s.set(e[0], e[1], e[2]);
  return cible.compose(_v.set(p.x ?? 0, p.y ?? 0, p.z ?? 0), _q, _s);
}

export class Chantier {
  private readonly lots = new Map<THREE.Material, THREE.BufferGeometry[]>();
  private readonly pile: THREE.Matrix4[] = [new THREE.Matrix4()];
  private readonly aleat: () => number;
  private readonly couleur = new THREE.Color();

  constructor(graine = 1) {
    this.aleat = aleatoire(graine);
  }

  /** Pose une géométrie (copiée), teintée d'une couleur, dans le repère courant. */
  poser(geo: THREE.BufferGeometry, mat: THREE.Material, couleur: number, pose: Pose = {}, options: OptionsPiece = {}): this {
    const m = matricePose(pose, new THREE.Matrix4()).premultiply(this.pile[this.pile.length - 1]!);
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const nom of Object.keys(g.attributes)) if (nom !== "position" && nom !== "normal" && nom !== "uv") g.deleteAttribute(nom);
    if (!g.attributes.normal) g.computeVertexNormals();
    const pos = g.attributes.position!;
    if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(pos.count * 2), 2));
    g.applyMatrix4(m);
    const nuance = options.nuance ?? 0.04;
    this.couleur.setHex(couleur);
    if (nuance) this.couleur.offsetHSL(0, 0, (this.aleat() - 0.5) * nuance);
    const crasse = options.crasse ?? true;
    const c = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      // Le pied des choses est plus sombre : terre, éclaboussures, ombre de contact.
      const f = crasse ? 0.74 + 0.26 * Math.min(1, Math.max(0, pos.getY(i) / 0.9)) : 1;
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
  boite(l: number, h: number, p: number, couleur: number, pose: Pose = {}, mat: THREE.Material = matiere(), options: OptionsPiece = {}): this {
    const e = pose.e ?? 1;
    const s = typeof e === "number" ? [e, e, e] : e;
    return this.poser(BOITE, mat, couleur, { ...pose, e: [l * s[0]!, h * s[1]!, p * s[2]!] }, options);
  }

  /** Une boîte posée par ses deux coins (alignée sur les axes du repère courant). */
  pave(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, couleur: number, mat: THREE.Material = matiere(), options: OptionsPiece = {}): this {
    return this.boite(Math.abs(x2 - x1), Math.abs(y2 - y1), Math.abs(z2 - z1), couleur, { x: (x1 + x2) / 2, y: (y1 + y2) / 2, z: (z1 + z2) / 2 }, mat, options);
  }

  /** Une poutre d'un point à un autre, de section s × s. */
  poutre(a: THREE.Vector3, b: THREE.Vector3, s: number, couleur: number, mat: THREE.Material = matiere()): this {
    const d = new THREE.Vector3().subVectors(b, a);
    const l = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    const e = new THREE.Euler().setFromQuaternion(q);
    return this.boite(s, l, s, couleur, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2, rx: e.x, ry: e.y, rz: e.z }, mat);
  }

  /** Tout ce qui est posé dans `poser` l'est dans le repère donné (imbriquable). */
  repere(pose: Pose, poser: () => void): this {
    this.pile.push(matricePose(pose, new THREE.Matrix4()).premultiply(this.pile[this.pile.length - 1]!));
    poser();
    this.pile.pop();
    return this;
  }

  /** Un nombre au hasard (graine du chantier). */
  hasard(): number {
    return this.aleat();
  }

  /** Fusionne tout : un maillage par matériau. */
  construire(): THREE.Group {
    const groupe = new THREE.Group();
    for (const [mat, geos] of this.lots) {
      const geo = mergeGeometries(geos, false);
      if (!geo) continue;
      const m = new THREE.Mesh(geo, mat);
      const sansOmbre = !!mat.userData.sansOmbre;
      m.castShadow = !sansOmbre;
      m.receiveShadow = true;
      groupe.add(m);
    }
    return groupe;
  }

  /**
   * Fusionne avec des matériaux propres à ce toit, qu'on pourra effacer (voir estomperToits) ; un maillage invisible
   * garde l'ombre portée du toit, pour que le dessous reste à l'ombre quand le toit s'efface.
   */
  construireFondu(ombrePortee = true): { objet: THREE.Group; materiaux: THREE.Material[] } {
    const groupe = new THREE.Group();
    const materiaux: THREE.Material[] = [];
    const toutes: THREE.BufferGeometry[] = [];
    for (const [mat, geos] of this.lots) {
      const geo = mergeGeometries(geos, false);
      if (!geo) continue;
      const fondu = mat.clone();
      fondu.transparent = true;
      fondu.userData = { ...mat.userData, opacite: mat.opacity };
      materiaux.push(fondu);
      const m = new THREE.Mesh(geo, fondu);
      m.castShadow = !ombrePortee && !mat.userData.sansOmbre;
      m.receiveShadow = true;
      groupe.add(m);
      if (!mat.userData.sansOmbre) toutes.push(geo);
    }
    if (ombrePortee && toutes.length) {
      const ombre = new THREE.Mesh(mergeGeometries(toutes, false)!, OMBRE_SEULE);
      ombre.castShadow = true;
      ombre.receiveShadow = false;
      groupe.add(ombre);
    }
    return { objet: groupe, materiaux };
  }
}

/** Une tôle ondulée de l × p (ondes le long de x), à plat, centrée : les facettes font les ondes. */
export function geoToleOndulee(l: number, p: number, pas = 0.24, creux = 0.045): THREE.BufferGeometry {
  const n = Math.max(2, Math.round(l / (pas / 2)));
  const geo = new THREE.PlaneGeometry(l, p, n, 1).rotateX(-Math.PI / 2);
  const pos = geo.attributes.position!;
  for (let i = 0; i < pos.count; i++) {
    const k = Math.round(((pos.getX(i) + l / 2) / l) * n);
    pos.setY(i, k % 2 ? creux : 0);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Du lierre : des grappes de feuilles posées contre une face (normale +z dans le repère de pose). */
export function lierre(c: Chantier, x: number, y0: number, z: number, ry: number, largeur: number, hauteur: number, n: number): void {
  const feuille = new THREE.IcosahedronGeometry(0.22, 0);
  const tons = [PALETTE.feuillageSombre, PALETTE.feuillage, 0x4f7a3c, 0x6d8f45];
  c.repere({ x, y: 0, z, ry }, () => {
    for (let i = 0; i < n; i++) {
      // Plus dense au pied, en langues qui montent.
      const t = Math.pow(c.hasard(), 1.6);
      const px = (c.hasard() - 0.5) * largeur * (1 - t * 0.5);
      const py = y0 + t * hauteur;
      const s = 0.6 + c.hasard() * 0.8;
      c.poser(feuille, matiere(), tons[Math.floor(c.hasard() * tons.length)]!, { x: px, y: py, z: 0.06, rx: c.hasard() * 3, ry: c.hasard() * 3, e: [s, s, s * 0.45] }, { nuance: 0.08, crasse: false });
    }
  });
}

/** Des touffes d'herbes folles (trois brins) au pied des murs, dans les fissures. */
export function touffes(c: Chantier, points: readonly (readonly [number, number])[], teinte: number = PALETTE.herbeSeche): void {
  const brin = new THREE.ConeGeometry(0.05, 0.45, 3).translate(0, 0.22, 0);
  for (const [x, z] of points) {
    const s = 0.7 + c.hasard() * 0.8;
    for (let k = 0; k < 3; k++) {
      const a = (k * Math.PI * 2) / 3 + c.hasard();
      c.poser(brin, matiere(), c.hasard() < 0.5 ? teinte : PALETTE.herbe, { x: x + Math.cos(a) * 0.05, z: z + Math.sin(a) * 0.05, rz: 0.35 * Math.cos(a), rx: 0.35 * Math.sin(a), e: s }, { nuance: 0.1, crasse: false });
    }
  }
}

// ---------- La ruine de ferme du terrain ----------

export function creerRuine(): THREE.Group {
  const groupe = new THREE.Group();
  groupe.name = "ruine";
  groupe.position.set(RUINE.x, 0, RUINE.z);
  const aleat = aleatoire(404);
  const L = RUINE.largeur;
  const P = RUINE.profondeur;
  const c = new Chantier(405);

  // Sol de terre battue, et ce qui reste du carrelage de tomettes
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(L + 1.2, P + 1.2).rotateX(-Math.PI / 2), materiau(PALETTE.terreSombre));
  sol.position.y = 0.012;
  sol.receiveShadow = true;
  groupe.add(sol);
  const tomette = new THREE.BoxGeometry(0.38, 0.03, 0.38);
  for (let i = -9; i <= 9; i++) {
    for (let k = -6; k <= 6; k++) {
      const x = i * 0.4;
      const z = k * 0.4;
      // Il en reste par plaques, surtout vers le fond.
      if (Math.abs(x) > L / 2 - 0.5 || Math.abs(z) > P / 2 - 0.5) continue;
      if (Math.sin(x * 1.3 + 0.5) + Math.cos(z * 1.7) + aleat() * 1.2 < 1.35) continue;
      c.poser(tomette, matiere(), aleat() < 0.5 ? 0x8a5f48 : 0x7a5240, { x, y: 0.02, z, ry: (aleat() - 0.5) * 0.12 }, { nuance: 0.1, crasse: false });
    }
  }

  // Murs de pierre : des blocs empilés, à hauteur irrégulière, avec des trous (porte, brèches).
  const bloc = new THREE.BoxGeometry(0.5, 0.3, 0.45);
  const murs: { x1: number; z1: number; x2: number; z2: number; trous: [number, number][] }[] = [
    { x1: -L / 2, z1: -P / 2, x2: L / 2, z2: -P / 2, trous: [[0.55, 0.75]] },
    { x1: L / 2, z1: -P / 2, x2: L / 2, z2: P / 2, trous: [[0.35, 0.6]] },
    { x1: L / 2, z1: P / 2, x2: -L / 2, z2: P / 2, trous: [[0.15, 0.55]] },
    { x1: -L / 2, z1: P / 2, x2: -L / 2, z2: -P / 2, trous: [[0.4, 0.62]] },
  ];
  const tons = [PALETTE.pierre, PALETTE.pierreSombre, 0x9a9488, 0xa39b8a];
  const blocs: { m: THREE.Matrix4; c: number }[] = [];
  const empiler = (x: number, y: number, z: number, angle: number, teinte?: number, echelle = 1) => {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -angle + (aleat() - 0.5) * 0.08, 0));
    blocs.push({
      m: new THREE.Matrix4().compose(new THREE.Vector3(x + (aleat() - 0.5) * 0.05, y, z + (aleat() - 0.5) * 0.05), q, new THREE.Vector3(echelle, 1, echelle)),
      c: teinte ?? tons[Math.floor(aleat() * tons.length)]!,
    });
  };
  murs.forEach((mur, im) => {
    const longueur = Math.hypot(mur.x2 - mur.x1, mur.z2 - mur.z1);
    const angle = Math.atan2(mur.z2 - mur.z1, mur.x2 - mur.x1);
    const n = Math.floor(longueur / 0.5);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      if (mur.trous.some(([a, b]) => t > a && t < b)) continue;
      const x = mur.x1 + (mur.x2 - mur.x1) * t;
      const z = mur.z1 + (mur.z2 - mur.z1) * t;
      // Hauteur : le mur s'effondre par endroits ; le pignon nord (mur 0, à l'ouest) monte en triangle.
      let hauteur = Math.max(1, Math.round(2 + Math.sin(t * 7 + angle * 3) * 2 + aleat() * 2.2));
      // Le mur sud (côté caméra) reste bas : on voit dedans.
      if (im === 2) hauteur = Math.min(hauteur, 3);
      if (im === 0 && t < 0.5) hauteur = Math.max(hauteur, Math.round(7 + (0.5 - Math.abs(t - 0.25) * 2) * 6 - aleat() * 1.5));
      // Pierres d'angle, plus claires et plus grosses (chaînage)
      const angleMur = i === 0 || i === n - 1;
      for (let h = 0; h < hauteur; h++) empiler(x, 0.15 + h * 0.3, z, angle, angleMur && h % 2 === 0 ? 0xb3aa98 : undefined, angleMur ? 1.12 : 1);
    }
  });
  // La cheminée, dans le coin nord-ouest : elle tient encore debout, plus haute que tout.
  for (let h = 0; h < 15; h++) {
    for (const [dx, dz] of [
      [-0.25, -0.2],
      [0.25, -0.2],
      [-0.25, 0.25],
      [0.25, 0.25],
    ] as const) {
      if (h > 12 && dx > 0 && dz > 0) continue; // le haut est ébréché
      empiler(-L / 2 + 0.55 + dx, 0.15 + h * 0.3, -P / 2 + 0.5 + dz, 0, h > 12 ? 0x8a4f36 : undefined, 0.9);
    }
  }
  // Pierres tombées
  for (let i = 0; i < 34; i++) {
    const a = aleat() * Math.PI * 2;
    const r = 0.4 + aleat() * 1.2;
    const cote = Math.floor(aleat() * 4);
    const bx = cote % 2 === 0 ? (aleat() - 0.5) * L : (cote === 1 ? L / 2 : -L / 2) + Math.cos(a) * r;
    const bz = cote % 2 === 1 ? (aleat() - 0.5) * P : (cote === 0 ? -P / 2 : P / 2) + Math.sin(a) * r;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(aleat(), aleat() * 3, aleat()));
    blocs.push({ m: new THREE.Matrix4().compose(new THREE.Vector3(bx, 0.12, bz), q, new THREE.Vector3(0.8, 0.8, 0.8)), c: tons[1]! });
  }
  const maillage = new THREE.InstancedMesh(bloc, materiau(0xffffff), blocs.length);
  const couleur = new THREE.Color();
  blocs.forEach((b, i) => {
    maillage.setMatrixAt(i, b.m);
    maillage.setColorAt(i, couleur.setHex(b.c).offsetHSL(0, 0, (aleat() - 0.5) * 0.07));
  });
  maillage.castShadow = true;
  maillage.receiveShadow = true;
  groupe.add(maillage);

  // La fenêtre du mur ouest : linteau de bois, un volet qui pend à un gond
  c.boite(0.3, 0.16, 1.5, PALETTE.boisSombre, { x: -L / 2, y: 1.25, z: 0.2 });
  c.boite(0.05, 1.1, 0.5, 0x5f7f6a, { x: -L / 2 - 0.3, y: 0.75, z: -0.55, ry: 0.5, rz: 0.25 });
  // Les montants de la porte, au sud
  for (const x of [L / 2 - 8 * 0.15 + 0.1, L / 2 - 8 * 0.55 - 0.1]) c.boite(0.55, 1.1, 0.5, 0xb3aa98, { x, y: 0.55, z: P / 2 });

  // Charpente : une ferme encore accrochée au pignon, deux chevrons qui piquent vers le sol.
  const pignon = new THREE.Vector3(-1.9, 3.1, -P / 2 + 0.1);
  c.poutre(pignon, new THREE.Vector3(-0.6, 0.05, 0.6), 0.2, PALETTE.boisSombre);
  c.poutre(new THREE.Vector3(-3.4, 2.4, -P / 2 + 0.1), new THREE.Vector3(-3.1, 0.05, -0.2), 0.18, PALETTE.bois);
  c.poutre(new THREE.Vector3(-1.2, 0.1, -2.4), new THREE.Vector3(2.6, 0.5, -2.75), 0.22, PALETTE.boisSombre);
  c.poutre(new THREE.Vector3(1.6, 0.1, 2.5), new THREE.Vector3(3.6, 1.15, 2.6), 0.2, PALETTE.bois);

  // Un pan de toit a glissé dehors, à l'ouest : lattes et tuiles canal, encore en rangs
  c.repere({ x: -L / 2 - 1.3, y: 0.55, z: 0.4, rz: 0.42, ry: 0.08 }, () => {
    for (const z of [-1.1, 0, 1.1]) c.boite(2.4, 0.07, 0.08, PALETTE.bois, { z });
    for (let r = 0; r < 5; r++) {
      for (let k = 0; k < 9; k++) {
        if (aleat() < 0.18) continue; // tuiles tombées
        c.boite(0.42, 0.06, 0.24, aleat() < 0.5 ? 0xa4552f : 0x8f4a2c, { x: -0.9 + r * 0.42, y: 0.06 + (k % 2) * 0.03, z: -1.25 + k * 0.29, rx: (aleat() - 0.5) * 0.1 }, matiere(), { nuance: 0.08, crasse: false });
      }
    }
  });

  // Tuiles cassées, éparpillées
  for (let i = 0; i < 70; i++) {
    c.boite(0.28, 0.03, 0.18, aleat() < 0.6 ? 0xa4552f : 0x8f4a2c, { x: (aleat() - 0.5) * L * 1.1, y: 0.03, z: (aleat() - 0.5) * P * 1.1, ry: aleat() * 3, rx: (aleat() - 0.5) * 0.4 }, matiere(), { nuance: 0.08 });
  }

  // La végétation reprend : un jeune bouleau dans le coin nord-est, des orties, du lierre sur le pignon.
  const bx = L / 2 - 0.9;
  const bz = -P / 2 + 0.85;
  c.poser(new THREE.CylinderGeometry(0.07, 0.11, 3.2, 5).translate(0, 1.6, 0), matiere(), 0xe6e2d6, { x: bx, z: bz, rz: -0.12 });
  for (let i = 0; i < 6; i++) {
    const s = 0.5 + aleat() * 0.45;
    c.poser(new THREE.IcosahedronGeometry(1, 0), matiere(), aleat() < 0.5 ? PALETTE.feuillageClair : PALETTE.feuillage, { x: bx + 0.3 + (aleat() - 0.5) * 1, y: 2.6 + aleat() * 1.1, z: bz + (aleat() - 0.5) * 1, e: [s, s * 0.8, s] }, { nuance: 0.06, crasse: false });
  }
  lierre(c, -3.0, 0.1, -P / 2 + 0.24, 0, 1.4, 2.6, 55);
  lierre(c, L / 2 + 0.24, 0.1, 1.6, Math.PI / 2, 1.8, 1.1, 30);
  for (let i = 0; i < 9; i++) {
    const s = 0.35 + aleat() * 0.3;
    c.poser(new THREE.IcosahedronGeometry(1, 0), matiere(), aleat() < 0.5 ? 0x4b6b3a : PALETTE.herbeSombre, { x: (aleat() - 0.5) * (L - 1), y: s * 0.4, z: (aleat() < 0.5 ? -1 : 1) * (P / 2 - 0.5), e: [s * 1.2, s * 0.8, s] }, { nuance: 0.06 });
  }
  const pointsHerbe: [number, number][] = [];
  for (let i = 0; i < 40; i++) pointsHerbe.push([(aleat() - 0.5) * (L + 1.5), (aleat() < 0.5 ? -1 : 1) * (P / 2 + (aleat() - 0.3) * 0.8)]);
  for (let i = 0; i < 20; i++) pointsHerbe.push([(aleat() < 0.5 ? -1 : 1) * (L / 2 + (aleat() - 0.3) * 0.8), (aleat() - 0.5) * P]);
  touffes(c, pointsHerbe);

  // La boîte aux lettres, penchée, devant l'entrée
  c.repere({ x: L / 2 + 1.2, z: -P / 2 - 0.6, rz: 0.15 }, () => {
    c.boite(0.08, 1, 0.08, PALETTE.boisSombre, { y: 0.5 });
    c.boite(0.4, 0.25, 0.25, 0x3a5a4a, { x: 0.07, y: 1.05 }, matiere(0.6));
    c.boite(0.36, 0.16, 0.02, 0xa4552f, { x: 0.07, y: 1.08, z: 0.13 }, matiere(0.6));
  });
  groupe.add(c.construire());

  // Une affiche de Watty, délavée et corrigée au feutre, sur le mur nord (Book 18 §6.2).
  const affiche = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.8), new THREE.MeshStandardMaterial({ map: textureAffiche(), roughness: 1 }));
  affiche.position.set(-1.8, 0.85, -P / 2 + 0.24);
  affiche.rotation.z = 0.04;
  groupe.add(affiche);
  return groupe;
}
