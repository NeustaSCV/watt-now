// Les conteneurs et les points du monde de la couche de déchets (0.7, chantier 7 ; chiffrage graphique §2.2).
//
// - Les CONTENEURS des amas (sac-poubelle crevé, poubelle renversée) sont nombreux : ils entrent dans le même lot que les
//   pièces (couche.ts), en deux états, plein (des ordures répandues par l'accroc) et vidé (affaissé, rien autour).
// - Les POINTS (tas de gravats, coffre d'épave, vélo du fossé, mobylette, trampoline, machine à laver, frigo connecté,
//   carcasse de mouton) sont peu nombreux et gros : chacun est un assemblage à couleurs par sommet (assemblage.ts),
//   1 à 3 appels de dessin, avec son ombre comme les épaves, et un sous-groupe « contenu » qui disparaît une fois vidé.
//
// La carcasse reste sobre (décision Q-G7) : des os blanchis et de la laine grise, ni chair ni sang.

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { TypePointDechets } from "../../../../commun/src/dechets.ts";
import { Assemblage, materiauSommets, NOIR, ROUILLE_SOMBRE, SOL_PLAT, V3, bosseler, placer, tache, touffe } from "../assemblage.ts";
import { PALETTE, aleatoire } from "../materiaux.ts";
import { DESSINS, Patron, nuancer } from "./silhouettes.ts";

const SAC_NOIR = 0x1f2124;
const SAC_VERT = 0x2a5a36;
const ORDURES = [0xd8d2b8, 0xc8362b, 0x7a8fa8, 0xa88a5c, 0x9cc8d8];

// ---------- Les conteneurs (dans le lot) ----------

/** Quelques ordures répandues autour d'un conteneur plein : papiers, emballages, une canette. */
function ordures(p: Patron, cx: number, rayon: number, n: number, ouverture = Math.PI * 2, depart = 0): void {
  for (let i = 0; i < n; i++) {
    const a = depart + (i / n) * ouverture + (p.al() - 0.5) * 0.5;
    const r = rayon * (0.9 + p.al() * 0.6);
    const g = i % 3 === 2 ? new THREE.CylinderGeometry(0.03, 0.03, 0.1, 6).rotateZ(Math.PI / 2) : new THREE.BoxGeometry(0.09 + p.al() * 0.08, 0.015, 0.06 + p.al() * 0.05);
    p.ajouter(placer(g, cx + Math.cos(a) * r, 0.02, Math.sin(a) * r, 0, p.al() * 3, (p.al() - 0.5) * 0.3), ORDURES[i % ORDURES.length]!, 0.04);
  }
}

/** Le sac-poubelle crevé : une panse bosselée, le nœud ; plein, des ordures sortent par l'accroc. */
function sacPoubelle(couleur: number, plein: boolean): THREE.BufferGeometry {
  const p = new Patron(plein ? 31 : 37);
  if (plein) {
    p.ajouter(bosseler(new THREE.IcosahedronGeometry(0.27, 1), 0.04, p.al).scale(1.1, 0.72, 1).translate(0, 0.17, 0), couleur, 0.05);
    p.ajouter(new THREE.ConeGeometry(0.07, 0.12, 5).translate(0.05, 0.38, 0), couleur, 0.04);
    ordures(p, 0.05, 0.36, 4, Math.PI * 0.9, -0.3);
  } else {
    // Vidé : la panse retombée, le plastique à plat.
    p.ajouter(bosseler(new THREE.IcosahedronGeometry(0.27, 1), 0.06, p.al).scale(1.25, 0.16, 1.1).translate(0, 0.035, 0), couleur, 0.06);
  }
  return p.geometrie([1, 1, 1], 0.12, 0.35);
}

/** La poubelle renversée : la cuve couchée, ouverte, le couvercle à côté ; pleine, les ordures en éventail. */
function poubelleRenversee(plein: boolean): THREE.BufferGeometry {
  const p = new Patron(plein ? 41 : 43);
  const cuve = 0x4f6a52;
  // La cuve, sa face intérieure (sombre), le fond.
  p.ajouter(new THREE.CylinderGeometry(0.25, 0.22, 0.75, 10, 1, true).rotateZ(Math.PI / 2).translate(0, 0.24, 0), cuve, 0.04);
  const dedans = new THREE.CylinderGeometry(0.24, 0.21, 0.74, 10, 1, true).rotateZ(Math.PI / 2).translate(0, 0.24, 0);
  // Retourner les facettes : on voit l'intérieur par l'ouverture.
  const idx = dedans.getIndex()!;
  for (let i = 0; i < idx.count; i += 3) {
    const t = idx.getX(i);
    idx.setX(i, idx.getX(i + 1));
    idx.setX(i + 1, t);
  }
  p.ajouter(dedans, 0x23261f, 0.02);
  p.ajouter(new THREE.CircleGeometry(0.22, 10).rotateY(-Math.PI / 2).translate(-0.375, 0.24, 0), cuve, 0.02);
  // Les roues, sous la cuve couchée, et le couvercle tombé.
  for (const z of [-0.14, 0.14]) p.ajouter(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 7).translate(-0.33, 0.5, z), NOIR, 0);
  p.ajouter(placer(new THREE.BoxGeometry(0.55, 0.03, 0.52), 0.1, 0.03, -0.5, 0.06, 0.4, 0), nuancer(cuve, 0.85), 0.03);
  if (plein) ordures(p, 0.45, 0.35, 6, Math.PI * 0.8, -0.4 * Math.PI);
  return p.geometrie([1, 1, 1], 0.1, 0.3);
}

/** Les géométries des conteneurs, par clé (« sac_poubelle:plein:0 »…). Le sac est noir, ou vert une fois sur trois. */
export function geometriesConteneurs(): Map<string, THREE.BufferGeometry> {
  const m = new Map<string, THREE.BufferGeometry>();
  for (const [k, couleur] of [SAC_NOIR, SAC_VERT].entries()) {
    m.set(`sac_poubelle:plein:${k}`, sacPoubelle(couleur, true));
    m.set(`sac_poubelle:vide:${k}`, sacPoubelle(couleur, false));
  }
  m.set("poubelle_renversee:plein:0", poubelleRenversee(true));
  m.set("poubelle_renversee:vide:0", poubelleRenversee(false));
  return m;
}

/** La hauteur d'un conteneur plein (pour l'éclat). */
export const HAUTEUR_CONTENEUR = 0.45;

// ---------- Les points du monde (assemblages) ----------

/** Un point dessiné : le tout, et ce qui disparaît une fois vidé (null : tout disparaît, on l'emporte ou on le démonte). */
export interface ModelePoint {
  objet: THREE.Group;
  contenu: THREE.Object3D | null;
  /** Le haut du modèle (pour l'éclat). */
  hauteur: number;
}

/**
 * Un assemblage fondu en UN maillage (toutes finitions confondues, la couleur est dans les sommets) : un point du
 * monde coûte un appel de dessin, et un dans la passe d'ombre.
 */
function groupe(c: Assemblage, ombre: boolean): THREE.Group {
  const maillages = c.maillages();
  const g = mergeGeometries(maillages.map((m) => m.geometry)) ?? maillages[0]!.geometry;
  for (const m of maillages) if (m.geometry !== g) m.geometry.dispose();
  g.computeBoundingSphere();
  const m = new THREE.Mesh(g, materiauSommets("mat"));
  m.castShadow = ombre;
  m.receiveShadow = true;
  const groupe = new THREE.Group();
  groupe.add(m);
  return groupe;
}

/** Le tas de gravats : un dôme de pierres et de morceaux de mur, un bout de ferraille, des herbes. */
function tasGravats(ombre: boolean): ModelePoint {
  const al = aleatoire(71);
  const c = new Assemblage(71);
  c.occlusion = 0.25;
  c.plaque(tache(0, 0, 1.3, 1.1, al, 11), SOL_PLAT, 0x6e6458, "sol", 0.008);
  for (let i = 0; i < 14; i++) {
    const a = al() * Math.PI * 2;
    const r = al() * 0.9;
    const h = Math.max(0, 0.42 - r * 0.4);
    const g = bosseler(new THREE.IcosahedronGeometry(0.13 + al() * 0.1, 0), 0.03, al).scale(1, 0.7, 1);
    c.ajouter(placer(g, Math.cos(a) * r, h * 0.6 + 0.05, Math.sin(a) * r, al(), al() * 3, al()), [PALETTE.pierre, PALETTE.pierreSombre, 0xb8ab94, 0xa45a40][i % 4]!, "mat", 0.06);
  }
  // Un morceau de mur, briques et enduit.
  c.boite(0xb8ab94, "mat", 0.45, 0.12, 0.3, -0.35, 0.12, 0.3, 0.2, 0.5, 0.1);
  c.boite(0xa45a40, "mat", 0.3, 0.06, 0.12, -0.3, 0.2, 0.25, 0.2, 0.5, 0.1);
  for (let i = 0; i < 4; i++) touffe(c, Math.cos(i * 1.7) * 1.05, Math.sin(i * 1.7) * 0.95, al, 2, 0.35);
  const objet = groupe(c, ombre);
  // Le contenu : les pierres du dessus et la ferraille, qui partent à la fouille.
  const k = new Assemblage(72);
  for (let i = 0; i < 4; i++) {
    const a = i * 1.6;
    k.ajouter(placer(bosseler(new THREE.IcosahedronGeometry(0.12, 0), 0.03, al).scale(1, 0.75, 1), Math.cos(a) * 0.25, 0.45, Math.sin(a) * 0.25, al(), al(), 0), PALETTE.pierre, "mat", 0.06);
  }
  k.perche(new V3(0.1, 0.35, -0.3), new V3(0.75, 0.08, -0.55), 0.02, PALETTE.rouille, "metal", 5);
  const contenu = groupe(k, ombre);
  objet.add(contenu);
  return { objet, contenu, hauteur: 0.7 };
}

/** Le contenu d'un coffre d'épave : ce qui en déborde, au sol derrière la voiture (un carton, un sac, une couverture). */
function coffreVoiture(ombre: boolean): ModelePoint {
  const al = aleatoire(81);
  const c = new Assemblage(81);
  c.occlusion = 0.15;
  c.ajouter(placer(bosseler(new THREE.BoxGeometry(0.42, 0.26, 0.32, 2, 1, 2), 0.02, al), 0, 0.13, 0, 0, 0.4, 0), 0xa88a5c, "mat", 0.05);
  c.ajouter(placer(bosseler(new THREE.IcosahedronGeometry(0.2, 1), 0.03, al).scale(1.1, 0.7, 0.9), 0.32, 0.13, 0.25, 0, 1, 0), 0x3b5a8c, "toile", 0.06);
  c.ajouter(placer(bosseler(new THREE.IcosahedronGeometry(0.25, 1), 0.05, al).scale(1.3, 0.2, 1), -0.25, 0.04, 0.3, 0, 0.3, 0), 0x8a3b2a, "toile", 0.07);
  c.ajouter(placer(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 6).rotateZ(Math.PI / 2), 0.1, 0.035, -0.28, 0, 0.8, 0), 0x3f8fb0, "verre", 0.03);
  const contenu = groupe(c, ombre);
  const objet = new THREE.Group();
  objet.add(contenu);
  return { objet, contenu, hauteur: 0.4 };
}

/** Le vélo couché dans le fossé, rouillé, dans l'herbe haute. */
function veloFosse(ombre: boolean): ModelePoint {
  const al = aleatoire(91);
  const c = new Assemblage(91);
  c.occlusion = 0.2;
  // Le vélo des silhouettes, mais à la taille d'un vrai et dans sa rouille.
  const p = new Patron(91);
  DESSINS.velo(p, 0x4a6a8a, -1);
  const g = p.geometrie([1.1, 1.1, 1.1], 0.06, 0.3);
  const pos = g.getAttribute("position");
  const col = g.getAttribute("color");
  for (let i = 0; i < pos.count; i += 3) {
    const tri: number[] = [];
    for (let j = 0; j < 3; j++) tri.push(pos.getX(i + j), pos.getY(i + j), pos.getZ(i + j));
    const g2 = new THREE.BufferGeometry();
    g2.setAttribute("position", new THREE.Float32BufferAttribute(tri, 3));
    c.ajouter(g2, new THREE.Color(col.getX(i), col.getY(i), col.getZ(i)).getHex(), "tole");
  }
  g.dispose();
  for (let i = 0; i < 3; i++) c.plaque(tache(-0.4 + i * 0.4, -0.15, 0.08, 0.05, al, 5), { point: (u, w) => new V3(u, 0.09, w), dehors: new V3(0, 1, 0) }, PALETTE.rouille, "mat", 0.002);
  for (let i = 0; i < 7; i++) touffe(c, -0.9 + i * 0.3 + (al() - 0.5) * 0.2, (al() - 0.5) * 0.9, al, 2, 0.5);
  const objet = groupe(c, ombre);
  return { objet, contenu: null, hauteur: 0.4 };
}

/** L'épave de mobylette, couchée : cadre en tube, réservoir, selle éventrée, guidon, deux roues. */
function mobylette(ombre: boolean): ModelePoint {
  const al = aleatoire(101);
  const c = new Assemblage(101);
  c.occlusion = 0.2;
  const y = 0.11;
  for (const x of [-0.55, 0.6]) {
    c.ajouter(new THREE.TorusGeometry(0.28, 0.05, 4, 14).rotateX(Math.PI / 2).translate(x, 0.05, 0), 0x262626, "mat", 0.03);
    c.ajouter(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 7).translate(x, 0.05, 0), 0x6b6862, "metal", 0.02);
  }
  const rouge = 0x8a3b2a;
  c.perche(new V3(-0.55, y, 0), new V3(0.05, y, -0.05), 0.03, rouge, "tole");
  c.perche(new V3(0.05, y, -0.05), new V3(0.45, y, -0.02), 0.035, rouge, "tole");
  c.perche(new V3(0.45, y, -0.02), new V3(0.6, y, 0), 0.025, 0x6b6862, "metal");
  c.perche(new V3(0.45, y, -0.02), new V3(0.5, y, -0.45), 0.025, 0x6b6862, "metal");
  c.perche(new V3(0.42, y + 0.02, -0.5), new V3(0.62, y + 0.02, -0.42), 0.02, NOIR, "mat");
  // Le réservoir, la peinture passée, et une coulure de rouille.
  c.ajouter(placer(bosseler(new THREE.IcosahedronGeometry(0.16, 1), 0.015, al).scale(1.5, 0.8, 0.8), 0.15, 0.17, -0.06), 0xb04a32, "tole", 0.05);
  c.plaque(tache(0.15, -0.02, 0.08, 0.06, al), { point: (u, w) => new V3(u, 0.3, w), dehors: new V3(0, 1, 0) }, ROUILLE_SOMBRE, "mat", 0.002);
  // La selle éventrée : la mousse jaunie sort.
  c.boite(0x2a2826, "mat", 0.36, 0.08, 0.16, -0.25, 0.16, -0.05);
  c.ajouter(placer(bosseler(new THREE.IcosahedronGeometry(0.06, 0), 0.01, al).scale(1.4, 0.6, 1), -0.2, 0.21, -0.02), 0xd8c48a, "mat", 0.04);
  // Le moteur et le pot d'échappement.
  c.boite(0x4a4a4c, "metal", 0.22, 0.16, 0.18, -0.05, 0.1, 0.08);
  c.perche(new V3(-0.05, 0.08, 0.15), new V3(-0.6, 0.06, 0.22), 0.035, PALETTE.rouille, "metal", 6);
  for (let i = 0; i < 4; i++) touffe(c, -0.8 + i * 0.5, (al() - 0.5) * 0.8, al, 2, 0.4);
  const objet = groupe(c, ombre);
  return { objet, contenu: null, hauteur: 0.45 };
}

/** Le trampoline éventré : le cadre rond sur ses pieds, la toile déchirée qui pend, les ressorts, la mousse bleue. */
function trampoline(ombre: boolean): ModelePoint {
  const al = aleatoire(111);
  const c = new Assemblage(111);
  c.occlusion = 0.3;
  const R = 1.5;
  const h = 0.62;
  c.ajouter(new THREE.TorusGeometry(R, 0.035, 4, 24).rotateX(Math.PI / 2).translate(0, h, 0), 0x6b6862, "metal", 0.03);
  // Les pieds en W.
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.3;
    const a2 = a + 0.5;
    const p1 = new V3(Math.cos(a) * R, h, Math.sin(a) * R);
    const p2 = new V3(Math.cos(a2) * R, h, Math.sin(a2) * R);
    const bas = new V3(Math.cos(a + 0.25) * R * 1.02, 0, Math.sin(a + 0.25) * R * 1.02);
    c.perche(bas, p1, 0.025, 0x6b6862, "metal", 4);
    c.perche(bas, p2, 0.025, 0x6b6862, "metal", 4);
  }
  // La toile : un disque qui s'affaisse au centre, avec un grand accroc (un secteur manque).
  const pts: number[] = [];
  const n = 16;
  const r0 = R - 0.2;
  for (let i = 0; i < n; i++) {
    if (i >= 5 && i <= 7) continue;
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    pts.push(0, h - 0.12, 0, Math.cos(a1) * r0, h - 0.02, Math.sin(a1) * r0, Math.cos(a0) * r0, h - 0.02, Math.sin(a0) * r0);
  }
  c.triangles(pts, 0x34363a, "toile", 0.04);
  // Le lambeau qui pend par l'accroc.
  c.triangles([Math.cos(2.1) * r0, h - 0.02, Math.sin(2.1) * r0, Math.cos(2.6) * r0, h - 0.02, Math.sin(2.6) * r0, Math.cos(2.4) * 0.9, 0.08, Math.sin(2.4) * 0.9], 0x34363a, "toile");
  // Les ressorts (24, à 8 triangles) et les coussins de mousse bleue, déchirés par endroits.
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    c.ajouter(placer(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 4, 1, true).rotateZ(Math.PI / 2), Math.cos(a) * (R - 0.1), h - 0.01, Math.sin(a) * (R - 0.1), 0, -a, 0), 0x9a9fa6, "metal");
  }
  for (let i = 0; i < 8; i++) {
    if (i === 2 || i === 5) continue;
    const a = (i / 8) * Math.PI * 2 + 0.2;
    c.ajouter(placer(new THREE.BoxGeometry(0.3, 0.04, 1.0), Math.cos(a) * (R - 0.08), h + 0.035, Math.sin(a) * (R - 0.08), 0, -a, 0), 0x3f7fb0, "toile", 0.06);
  }
  for (let i = 0; i < 5; i++) touffe(c, Math.cos(i * 1.3) * 1.2, Math.sin(i * 1.3) * 1.2, al, 2, 0.45);
  const objet = groupe(c, ombre);
  return { objet, contenu: null, hauteur: 0.9 };
}

/** La machine à laver abandonnée : la caisse blanche, le hublot ouvert, le tambour, le tuyau. */
function machineLaver(ombre: boolean): ModelePoint {
  const c = new Assemblage(121);
  c.occlusion = 0.25;
  c.repere = new THREE.Matrix4().makeRotationZ(0.05);
  c.boite(0xe8e4dc, "tole", 0.6, 0.85, 0.6, 0, 0.425, 0);
  c.boite(0xd6d2ca, "tole", 0.58, 0.1, 0.02, 0, 0.78, 0.305);
  c.boite(0x2b3440, "verre", 0.16, 0.04, 0.01, -0.12, 0.78, 0.315);
  // Le tambour, au fond du hublot, et la porte ouverte de côté.
  c.ajouter(new THREE.CylinderGeometry(0.2, 0.2, 0.01, 12).rotateX(Math.PI / 2).translate(0, 0.42, 0.302), 0x3a3c40, "metal", 0.02);
  c.ajouter(new THREE.TorusGeometry(0.21, 0.035, 4, 14).translate(0, 0.42, 0.31), 0xb8bcc0, "tole", 0.02);
  c.ajouter(new THREE.TorusGeometry(0.19, 0.04, 4, 14).rotateY(1.3).translate(0.36, 0.42, 0.45), 0xb8bcc0, "tole", 0.02);
  c.ajouter(new THREE.CircleGeometry(0.16, 12).rotateY(1.3).translate(0.37, 0.42, 0.45), 0x9cb8c4, "verre");
  c.repere = null;
  c.perche(new V3(-0.25, 0.15, -0.3), new V3(-0.6, 0.03, -0.7), 0.025, 0x8a8f96, "mat", 5);
  c.perche(new V3(-0.6, 0.03, -0.7), new V3(-0.4, 0.03, -1.1), 0.025, 0x8a8f96, "mat", 5);
  const al = aleatoire(122);
  for (let i = 0; i < 3; i++) touffe(c, -0.4 + i * 0.4, 0.4 + al() * 0.2, al, 2, 0.35);
  return { objet: groupe(c, ombre), contenu: null, hauteur: 0.95 };
}

/** Le frigo connecté, couché sur le dos : la porte vers le ciel, son grand écran mort, la poignée. */
function frigoConnecte(ombre: boolean): ModelePoint {
  const c = new Assemblage(131);
  c.occlusion = 0.2;
  c.boite(0xc9ccd0, "tole", 0.72, 0.62, 1.8, 0, 0.31, 0);
  c.boite(0xb8bcc0, "tole", 0.7, 0.04, 1.76, 0, 0.64, 0);
  c.boite(0x1e2328, "verre", 0.4, 0.012, 0.6, -0.05, 0.665, -0.35);
  c.boite(0x3a4450, "verre", 0.34, 0.004, 0.08, -0.05, 0.672, -0.52);
  c.boite(0x9a9fa6, "metal", 0.04, 0.05, 0.6, 0.3, 0.68, 0.2);
  const al = aleatoire(132);
  c.plaque(tache(0.1, 0.55, 0.2, 0.25, al), { point: (u, w) => new V3(u, 0.662, w), dehors: new V3(0, 1, 0) }, PALETTE.rouille, "mat", 0.003);
  for (let i = 0; i < 4; i++) touffe(c, (i % 2 ? 0.45 : -0.45) + (al() - 0.5) * 0.1, -0.7 + i * 0.45, al, 2, 0.35);
  return { objet: groupe(c, ombre), contenu: null, hauteur: 0.75 };
}

/** La carcasse de mouton, sobre : côtes et colonne blanchies, le crâne, des os épars, de la laine grise en lambeaux. */
function carcasseMouton(ombre: boolean): ModelePoint {
  const al = aleatoire(141);
  const c = new Assemblage(141);
  c.occlusion = 0.12;
  const OS = 0xe2dccb;
  const LAINE = 0x9a968c;
  c.plaque(tache(0, 0, 0.75, 0.5, al, 9), SOL_PLAT, 0x8a8a5a, "sol", 0.006);
  // La colonne, en vertèbres.
  for (let i = 0; i < 9; i++) c.boite(OS, "mat", 0.07, 0.06, 0.07, -0.42 + i * 0.1, 0.05, 0, 0, i * 0.3, 0);
  // Les côtes : des arcs qui retombent de part et d'autre.
  for (let i = 0; i < 6; i++) {
    const x = -0.2 + i * 0.08;
    for (const s of [-1, 1]) {
      const arc = new THREE.TorusGeometry(0.15 - Math.abs(i - 2.5) * 0.012, 0.012, 3, 6, Math.PI * 0.75);
      c.ajouter(arc.rotateY(Math.PI / 2).rotateX(s > 0 ? 0.2 : Math.PI - 0.2).translate(x, 0.05, s * 0.02), OS, "mat", 0.04);
    }
  }
  // Le crâne, le museau, une corne enroulée.
  c.ajouter(placer(bosseler(new THREE.IcosahedronGeometry(0.08, 0), 0.01, al).scale(1.2, 0.8, 0.9), 0.6, 0.07, 0.05), OS, "mat", 0.04);
  c.ajouter(placer(new THREE.ConeGeometry(0.05, 0.14, 5).rotateZ(-Math.PI / 2), 0.72, 0.05, 0.08), OS, "mat", 0.04);
  c.ajouter(new THREE.TorusGeometry(0.045, 0.015, 3, 7, Math.PI * 1.4).translate(0.58, 0.12, -0.02), 0xc9b896, "mat", 0.03);
  // Les pattes : des os longs épars.
  for (const [x1, z1, x2, z2] of [
    [-0.3, 0.12, -0.55, 0.4],
    [-0.25, -0.1, -0.45, -0.38],
    [0.15, 0.15, 0.3, 0.42],
    [0.2, -0.12, 0.05, -0.42],
  ] as const) {
    c.perche(new V3(x1, 0.025, z1), new V3(x2, 0.025, z2), 0.018, OS, "mat", 4);
  }
  // La laine grise, en lambeaux autour.
  for (let i = 0; i < 7; i++) {
    const a = al() * Math.PI * 2;
    const r = 0.25 + al() * 0.45;
    c.ajouter(placer(bosseler(new THREE.IcosahedronGeometry(0.09 + al() * 0.06, 1), 0.03, al).scale(1.3, 0.35, 1), Math.cos(a) * r, 0.025, Math.sin(a) * r * 0.7, 0, al() * 3, 0), i % 2 ? LAINE : 0xb4aea0, "toile", 0.08);
  }
  return { objet: groupe(c, ombre), contenu: null, hauteur: 0.3 };
}

const FABRIQUES: Record<Exclude<TypePointDechets, "sac_poubelle" | "poubelle_renversee">, (ombre: boolean) => ModelePoint> = {
  tas_gravats: tasGravats,
  coffre_voiture: coffreVoiture,
  velo_fosse: veloFosse,
  epave_mobylette: mobylette,
  trampoline,
  machine_laver: machineLaver,
  frigo_connecte: frigoConnecte,
  carcasse_mouton: carcasseMouton,
};

/** Les modèles déjà construits (géométries partagées entre deux points du même type). */
const MODELES = new Map<string, ModelePoint>();

/** Un point du monde : un nouvel objet qui partage les géométries de son type. */
export function modelePoint(type: TypePointDechets, ombre: boolean): ModelePoint {
  const cle = `${type}:${ombre}`;
  let m = MODELES.get(cle);
  if (!m) {
    const f = type === "sac_poubelle" || type === "poubelle_renversee" ? coffreVoiture : FABRIQUES[type];
    m = f(ombre);
    MODELES.set(cle, m);
  }
  const objet = m.objet.clone(true);
  const indice = m.contenu ? m.objet.children.indexOf(m.contenu) : -1;
  return { objet, contenu: indice >= 0 ? objet.children[indice]! : null, hauteur: m.hauteur };
}

