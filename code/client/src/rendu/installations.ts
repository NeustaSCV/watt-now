// Les installations posées sur le terrain (É2) : établi, abri, et les installations de famille.
// Passe de finition (2026-10-08, Book 21 §5.2.5) : chaque installation est montée pièce par pièce (planches, perches
// ligaturées, pierres bosselées, toile tendue) dans un assemblage à couleurs par sommet (assemblage.ts) : bois et
// pierre nuancés facette par facette, bas des objets assombri près du sol (occlusion cuite). Le tout tient en 1 à 4
// appels de dessin par installation, ≈ 600 à 2 000 triangles (budget §5.3.4 : 1 000 à 3 000).

import { fusionnerStatique } from "./fusion.ts";
import { Panache } from "./panache.ts";
import { batterieVoiture, modulePanneau, roueVelo } from "./pieces.ts";
import { decharge, majTrouvailles } from "./decharge.ts";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { InstallationVue } from "../../../commun/src/messages.ts";
import { PALETTE, aleatoire } from "./materiaux.ts";
import { ACIER, Assemblage, BOIS, type Finition, CORDE, NOIR, ROUILLE_SOMBRE, V, V3, X, Y, Z, bosseler, placer, surface, tache, touffe } from "./assemblage.ts";

const BACHE = 0x2f6fa4;
const BACHE_PASSEE = 0x4a7fa8;
const CRASSE = 0x5a4e40;
const TERRE_REMUEE = 0x6b5440;
const CHARBON = 0x262422;

/** Une planche (ou un tasseau) nuancée. */
function planche(c: Assemblage, couleur: number, l: number, h: number, p: number, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0): void {
  c.ajouter(placer(new THREE.BoxGeometry(l, h, p), x, y, z, rx, ry, rz), couleur, "mat", 0.05);
}

/** Un rondin d'un point à un autre : l'écorce, et le bois clair des deux coupes. */
function rondin(c: Assemblage, a: THREE.Vector3, b: THREE.Vector3, r: number, ecorce: number = BOIS.ecorce, cotes = 7): void {
  c.perche(a, b, r, ecorce, "mat", cotes, r * 0.94, 0.07);
  const d = b.clone().sub(a).normalize();
  for (const [p, sens] of [[a, -1], [b, 1]] as const) {
    const disque = new THREE.CircleGeometry(r * (sens === 1 ? 0.88 : 0.93), cotes);
    disque.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Z, d.clone().multiplyScalar(sens)));
    disque.translate(p.x + d.x * sens * 0.003, p.y + d.y * sens * 0.003, p.z + d.z * sens * 0.003);
    c.ajouter(disque, BOIS.coupe, "mat", 0.03);
  }
}

/** Une pierre bosselée, posée. */
function caillou(c: Assemblage, x: number, y: number, z: number, r: number, aleat: () => number, couleur: number = PALETTE.pierre, aplati = 0.6): void {
  const g = bosseler(new THREE.IcosahedronGeometry(r, 0), r * 0.18, aleat).scale(1 + aleat() * 0.3, aplati, 1);
  c.ajouter(placer(g, x, y, z, 0, aleat() * 6, 0), couleur, "mat", 0.06);
}

/** Une corde ou un câble souple, le long d'une courbe. */
function corde(c: Assemblage, points: THREE.Vector3[], rayon: number, couleur: number = CORDE, segments = 8, finition: Finition = "mat"): void {
  const courbe = new THREE.CatmullRomCurve3(points);
  c.ajouter(new THREE.TubeGeometry(courbe, segments, rayon, 3, false), couleur, finition, 0.03);
}

/** Une corde tendue entre deux points, qui pend un peu (chaînette approchée). */
function cordePendante(c: Assemblage, a: THREE.Vector3, b: THREE.Vector3, fleche: number, rayon = 0.006, couleur: number = CORDE): void {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    pts.push(a.clone().lerp(b, t).add(new V3(0, -fleche * 4 * t * (1 - t), 0)));
  }
  corde(c, pts, rayon, couleur, 8);
}

/** Un piquet fourchu planté (la fourche en haut retient une perche ou une corde). */
function piquetFourchu(c: Assemblage, x: number, z: number, h: number, r: number, aleat: () => number, inclinaison = 0): void {
  const pied = new V3(x, -0.05, z);
  const tete = new V3(x + inclinaison, h, z);
  c.perche(pied, tete, r * 1.1, BOIS.ecorce, "mat", 6, r, 0.07);
  // La fourche : deux petites branches qui s'écartent.
  const depart = pied.clone().lerp(tete, 0.86);
  for (const s of [-1, 1]) c.perche(depart, tete.clone().add(new V3(s * 0.07, 0.1 + aleat() * 0.04, (aleat() - 0.5) * 0.03)), r * 0.7, BOIS.ecorce, "mat", 5, r * 0.45);
}

/** Une toile en grille (u, v) → point : facettes nuancées, couleur choisie par case. */
function toile(c: Assemblage, nu: number, nv: number, point: (u: number, v: number) => THREE.Vector3, couleur: (i: number, j: number) => number, trou?: (i: number, j: number) => boolean): void {
  const grille: THREE.Vector3[][] = [];
  for (let i = 0; i <= nu; i++) {
    grille.push([]);
    for (let j = 0; j <= nv; j++) grille[i]!.push(point(i / nu, j / nv));
  }
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      if (trou?.(i, j)) continue;
      const q = [grille[i]![j]!, grille[i + 1]![j]!, grille[i + 1]![j + 1]!, grille[i]![j + 1]!];
      const positions: number[] = [];
      for (const k of [0, 1, 2, 0, 2, 3]) positions.push(q[k]!.x, q[k]!.y, q[k]!.z);
      c.triangles(positions, couleur(i, j), "toile", 0.025);
    }
  }
}

/** Les maillages d'un assemblage, rangés dans un groupe (fondus ensuite avec le reste de l'installation). */
function enGroupe(...assemblages: Assemblage[]): THREE.Group {
  const g = new THREE.Group();
  for (const a of assemblages) for (const m of a.maillages()) g.add(m);
  return g;
}

// ---------- Le coffre ----------

/** Le coffre de rangement : des planches de récupération, un couvercle bombé, des feuillards, un moraillon cadenassé. */
function coffre(): THREE.Group {
  const c = new Assemblage(14);
  c.occlusion = 0.3;
  const aleat = aleatoire(14);
  const tons = [BOIS.clair, BOIS.moyen, BOIS.gris];
  // Les flancs : trois planches par face, un jour entre elles.
  for (let k = 0; k < 3; k++) {
    const y = 0.1 + k * 0.135;
    for (const s of [-1, 1]) {
      planche(c, tons[(k + (s > 0 ? 1 : 0)) % 3]!, 0.86, 0.125, 0.025, 0, y, s * 0.262);
      planche(c, tons[(k + 2) % 3]!, 0.025, 0.125, 0.5, s * 0.432, y, 0);
    }
  }
  planche(c, BOIS.sombre, 0.84, 0.02, 0.5, 0, 0.04, 0);
  // Les montants d'angle, les patins.
  for (const [x, z] of [[-0.43, -0.26], [0.43, -0.26], [-0.43, 0.26], [0.43, 0.26]] as const) planche(c, BOIS.sombre, 0.05, 0.42, 0.05, x, 0.24, z);
  for (const x of [-0.32, 0.32]) planche(c, BOIS.sombre, 0.07, 0.05, 0.58, x, 0.025, 0);
  // Le couvercle bombé : cinq planches sur un arc de cercle, fermé par deux joues.
  const R = 0.34;
  const yc = 0.43 - R * Math.cos(0.9);
  for (let k = 0; k < 5; k++) {
    const a = (k - 2) * 0.36;
    planche(c, tons[k % 3]!, 0.9, 0.025, 0.125, 0, yc + Math.cos(a) * R, Math.sin(a) * R, a, 0, 0);
  }
  for (const s of [-1, 1]) {
    const joue = new THREE.CylinderGeometry(R, R, 0.025, 10, 1, false, Math.PI / 2 - 0.9, 1.8).rotateZ(Math.PI / 2);
    c.ajouter(placer(joue, s * 0.44, yc, 0), BOIS.sombre, "mat", 0.04);
  }
  // Deux feuillards de fer qui ceinturent le coffre et le couvercle.
  for (const x of [-0.28, 0.28]) {
    for (const s of [-1, 1]) c.boite(ACIER, "metal", 0.04, 0.4, 0.006, x, 0.23, s * 0.278);
    for (let k = 0; k < 5; k++) {
      const a = (k - 2) * 0.36;
      c.boite(k === 2 ? ROUILLE_SOMBRE : ACIER, "metal", 0.04, 0.006, 0.128, x, yc + Math.cos(a) * (R + 0.014), Math.sin(a) * (R + 0.014), a, 0, 0);
    }
  }
  // Le moraillon et son vieux cadenas, les poignées de corde.
  c.boite(NOIR, "metal", 0.06, 0.12, 0.012, 0, 0.42, 0.285);
  c.ajouter(placer(new THREE.TorusGeometry(0.022, 0.005, 3, 8, Math.PI), 0, 0.36, 0.3), ACIER, "metal");
  c.boite(0x8a7a52, "metal", 0.05, 0.045, 0.02, 0, 0.33, 0.3);
  for (const s of [-1, 1]) {
    const anse = new THREE.TorusGeometry(0.06, 0.012, 3, 8, Math.PI).rotateY(Math.PI / 2).rotateX(Math.PI);
    c.ajouter(placer(anse, s * 0.455, 0.3, 0), CORDE, "mat", 0.04);
  }
  for (let i = 0; i < 2; i++) c.plaque(tache((aleat() - 0.5) * 0.6, 0.15, 0.06, 0.04, aleat), surface(new V3(0, 0, 0.276), X, Y, Z), ROUILLE_SOMBRE, "mat", 0.004);
  return enGroupe(c);
}

// ---------- L'escabeau ----------

/**
 * L'escabeau de bois : deux montants de bûche refendue et leurs barreaux de branche à l'avant, deux pieds à l'arrière,
 * une petite marche au sommet, les assemblages ligaturés de corde. Il se porte (Book 10).
 */
export function creerEscabeau(): THREE.Group {
  const hauteur = 1.25;
  const inclinaison = 0.28;
  const aleat = aleatoire(31);
  // L'avant : l'échelle, penchée vers l'arrière.
  const avant = new Assemblage(31);
  for (const x of [-0.24, 0.24]) planche(avant, BOIS.clair, 0.06, hauteur, 0.05, x, hauteur / 2, 0, 0, 0, (aleat() - 0.5) * 0.02);
  for (let i = 1; i <= 3; i++) {
    const y = (i * hauteur) / 4;
    avant.perche(new V3(-0.28, y + (aleat() - 0.5) * 0.02, 0), new V3(0.28, y + (aleat() - 0.5) * 0.02, 0), 0.022, BOIS.ecorce, "mat", 5, 0.019);
    for (const x of [-0.24, 0.24]) avant.ligature(new V3(x, y, 0), new V3(0, 1, 0), 0.045);
  }
  const gAvant = enGroupe(avant);
  gAvant.position.z = 0.3;
  gAvant.rotation.x = -inclinaison;
  // L'arrière : deux pieds et une traverse, penchés vers l'avant.
  const arriere = new Assemblage(32);
  for (const x of [-0.22, 0.22]) planche(arriere, BOIS.moyen, 0.05, hauteur, 0.05, x, hauteur / 2, 0);
  arriere.perche(new V3(-0.25, hauteur * 0.4, 0), new V3(0.25, hauteur * 0.41, 0), 0.02, BOIS.ecorce, "mat", 5);
  for (const x of [-0.22, 0.22]) arriere.ligature(new V3(x, hauteur * 0.4, 0), new V3(0, 1, 0), 0.04);
  const gArriere = enGroupe(arriere);
  gArriere.position.z = -0.3;
  gArriere.rotation.x = inclinaison;
  // La marche du haut, où les deux moitiés se rejoignent, et la corde qui les retient d'ouvrir.
  const haut = new Assemblage(33);
  const ys = hauteur * Math.cos(inclinaison) + 0.01;
  planche(haut, BOIS.clair, 0.58, 0.05, 0.2, 0, ys, 0);
  for (const x of [-0.2, 0.2]) cordePendante(haut, new V3(x, 0.42, 0.18), new V3(x, 0.42, -0.18), 0.05, 0.005);
  const g = new THREE.Group();
  g.add(gAvant, gArriere, enGroupe(haut));
  return g;
}

// ---------- L'établi ----------

function etabli(): THREE.Group {
  const c = new Assemblage(21);
  c.occlusion = 0.4;
  const aleat = aleatoire(21);
  // Le plateau : trois grosses planches, pas tout à fait alignées.
  [BOIS.clair, BOIS.moyen, BOIS.clair].forEach((ton, i) => planche(c, ton, 1.5 + (i === 1 ? 0.05 : 0), 0.06, 0.225, i === 1 ? 0.025 : 0, 0.86, -0.236 + i * 0.236));
  // La ceinture sous le plateau, les pieds légèrement écartés, les entretoises et l'étagère basse.
  for (const s of [-1, 1]) planche(c, BOIS.sombre, 1.32, 0.09, 0.04, 0, 0.785, s * 0.3);
  for (const [x, z] of [[-0.66, -0.28], [0.66, -0.28], [-0.66, 0.28], [0.66, 0.28]] as const) {
    planche(c, BOIS.sombre, 0.09, 0.84, 0.09, x * 1.01, 0.42, z * 1.02, z * -0.03, 0, x * 0.03);
  }
  for (const x of [-0.66, 0.66]) planche(c, BOIS.moyen, 0.05, 0.07, 0.5, x, 0.2, 0);
  for (let i = 0; i < 3; i++) planche(c, [BOIS.gris, BOIS.moyen, BOIS.gris][i]!, 1.36, 0.025, 0.16, 0, 0.245, -0.17 + i * 0.17);
  // Sur l'étagère : des chutes de planche et un seau cabossé.
  planche(c, BOIS.coupe, 0.5, 0.03, 0.12, -0.3, 0.275, 0.05, 0, 0.2, 0);
  planche(c, BOIS.clair, 0.4, 0.03, 0.1, -0.25, 0.305, 0.0, 0, -0.15, 0);
  c.ajouter(placer(new THREE.CylinderGeometry(0.12, 0.1, 0.22, 9), 0.4, 0.37, 0.02), 0x77756e, "metal", 0.04);
  c.ajouter(placer(new THREE.CircleGeometry(0.11, 9).rotateX(-Math.PI / 2), 0.4, 0.475, 0.02), 0x3d3a35, "mat");
  // L'étau de bois au bout gauche : deux mâchoires et la vis.
  planche(c, BOIS.sombre, 0.06, 0.16, 0.2, -0.73, 0.82, 0.25);
  planche(c, BOIS.sombre, 0.06, 0.16, 0.2, -0.84, 0.82, 0.25);
  c.perche(new V3(-0.95, 0.83, 0.25), new V3(-0.62, 0.83, 0.25), 0.014, ACIER, "metal", 5);
  c.perche(new V3(-0.95, 0.83, 0.17), new V3(-0.95, 0.83, 0.33), 0.01, BOIS.ecorce, "mat", 4);
  // Sur le plateau : un marteau, une égoïne, une boîte de clous, un crayon de charpentier, des copeaux.
  const dessus = 0.89;
  const marteau = new THREE.Matrix4().compose(new V3(-0.3, dessus + 0.02, 0.08), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0.5, 0)), new V3(1, 1, 1));
  c.repere = marteau;
  c.perche(new V3(-0.18, 0, 0), new V3(0.16, 0, 0), 0.016, BOIS.clair, "mat", 5, 0.014);
  c.boite(0x4a4744, "metal", 0.035, 0.035, 0.13, 0.17, 0.005, 0);
  c.boite(0x4a4744, "metal", 0.03, 0.03, 0.06, 0.17, 0.005, -0.08, 0.3, 0, 0);
  c.repere = null;
  const scie = surface(new V3(0.22, dessus + 0.003, -0.12), new V3(Math.cos(-0.2), 0, Math.sin(-0.2)), new V3(-Math.sin(-0.2), 0, Math.cos(-0.2)), Y);
  c.plaque([V(0, -0.05), V(0.48, -0.03), V(0.48, 0.02), V(0, 0.06)], scie, 0xa9aba8, "metal", 0.002);
  c.plaque([V(0, -0.055), V(0.48, -0.035), V(0.48, -0.025), V(0, -0.045)], scie, 0x5c5a56, "metal", 0.003);
  c.ajouter(placer(new THREE.BoxGeometry(0.12, 0.03, 0.1), 0.17, dessus + 0.015, -0.11, 0, 0.2, 0), 0x6b3a26, "mat", 0.04);
  c.ajouter(placer(new THREE.CylinderGeometry(0.045, 0.045, 0.09, 8), 0.62, dessus + 0.045, 0.16), 0x9a9890, "metal", 0.03);
  c.ajouter(placer(new THREE.CircleGeometry(0.042, 8).rotateX(-Math.PI / 2), 0.62, dessus + 0.091, 0.16), 0x55524d, "metal");
  c.ajouter(placer(new THREE.BoxGeometry(0.16, 0.012, 0.02), 0.45, dessus + 0.006, 0.2, 0, 0.9, 0), 0xc8362b, "mat");
  for (let i = 0; i < 6; i++) {
    c.plaque(tache(0.05 + aleat() * 0.4, (aleat() - 0.5) * 0.4, 0.03, 0.015, aleat, 5), surface(new V3(0, dessus, 0), X, Z, Y), 0xd9bc8a, "mat", 0.003);
  }
  // Au sol, des copeaux et de la sciure.
  for (let i = 0; i < 5; i++) c.plaque(tache((aleat() - 0.5) * 1.2, (aleat() - 0.5) * 0.8, 0.08, 0.05, aleat, 6), surface(new V3(0, 0, 0), X, Z, Y), 0xc8a878, "mat", 0.012);
  return enGroupe(c);
}

// ---------- L'abri ----------

/** L'abri (moment-vitrine n° 1) : un appentis de bâche sur une perche faîtière, tenu par des branches et des pierres. */
function abri(): THREE.Group {
  const c = new Assemblage(91);
  c.occlusion = 0.45;
  const aleat = aleatoire(91);
  const zFaite = -0.5;
  const yFaite = 1.45;
  // Deux poteaux fourchus et la perche faîtière posée dans les fourches, ligaturée.
  for (const x of [-1.15, 1.15]) {
    piquetFourchu(c, x, zFaite, yFaite + 0.05, 0.05, aleat, x * -0.02);
    c.ligature(new V3(x * 1.02, yFaite, zFaite), X, 0.06);
  }
  rondin(c, new V3(-1.42, yFaite + 0.02, zFaite), new V3(1.42, yFaite - 0.01, zFaite), 0.045);
  // La bâche : elle passe sur la faîtière (un pan pend derrière), descend en pente jusqu'au sol, creuse entre les
  // poteaux, ondule ; le bord du bas est boueux, le dessus délavé par le soleil.
  const pente = new V3(0, -yFaite + 0.06, 1.45);
  const dehors = new V3(0, 1.45, yFaite - 0.06).normalize();
  const point = (u: number, v: number) => {
    const x = (u - 0.5) * 2.7;
    const s = v * 1.15 - 0.15;
    if (s < 0) return new V3(x, yFaite + 0.04 + s * 1.5, zFaite + 0.02 + s * 0.5);
    const creux = 0.11 * Math.sin(Math.PI * u) * Math.sin(Math.PI * Math.min(1, s / 0.97)) + 0.018 * Math.sin(u * 17 + s * 4);
    return new V3(x, yFaite + 0.045, zFaite + 0.02).addScaledVector(pente, s).addScaledVector(dehors, -creux);
  };
  toile(c, 12, 8, point, (i, j) => (j >= 7 ? (i % 4 === 1 ? CRASSE : 0x3d5a72) : j === 6 && i % 3 === 0 ? 0x41627e : j <= 3 ? BACHE_PASSEE : BACHE));
  // Les œillets et les tendeurs : du bas de la bâche à des piquets.
  for (const u of [0, 1 / 3, 2 / 3, 1]) {
    const p = point(u, 1);
    c.ajouter(placer(new THREE.TorusGeometry(0.018, 0.006, 3, 6), p.x, p.y + 0.01, p.z, Math.PI / 2), ACIER, "metal");
    const piquet = new V3(p.x + (u - 0.5) * 0.4, 0, p.z + 0.35);
    c.perche(piquet.clone().add(new V3(0, -0.05, 0)), piquet.clone().add(new V3(0, 0.2, -0.03)), 0.018, BOIS.ecorce, "mat", 4);
    cordePendante(c, p.clone().add(new V3(0, 0.01, 0)), piquet.clone().add(new V3(0, 0.15, 0)), 0.01, 0.006);
  }
  // Les branches posées sur la bâche pour la tenir au vent, et des pierres sur le bord.
  for (let i = 0; i < 6; i++) {
    const u = 0.08 + i * 0.165 + (aleat() - 0.5) * 0.04;
    const a = point(u, 0.18 + aleat() * 0.08).addScaledVector(dehors, 0.04);
    const b = point(u + (aleat() - 0.5) * 0.06, 0.92).addScaledVector(dehors, 0.04);
    c.perche(a, b, 0.024, BOIS.ecorce, "mat", 5, 0.016);
    const milieu = a.clone().lerp(b, 0.5 + aleat() * 0.2);
    c.perche(milieu, milieu.clone().add(new V3((aleat() - 0.5) * 0.4, 0.06, 0.15)), 0.011, BOIS.ecorce, "mat", 4, 0.006);
  }
  for (let i = 0; i < 5; i++) {
    const p = point(0.1 + i * 0.2 + aleat() * 0.05, 0.99);
    caillou(c, p.x, 0.07, p.z + 0.06, 0.1 + aleat() * 0.04, aleat, aleat() < 0.5 ? PALETTE.pierre : PALETTE.pierreSombre);
  }
  // Dessous : un lit de feuilles mortes et de fougères, une couverture roulée, le sol tassé.
  const sol = surface(new V3(0, 0, 0), X, Z, Y);
  c.plaque(tache(0, 0.15, 1.3, 0.75, aleat, 12), sol, 0x6b5a3e, "mat", 0.008);
  c.ajouter(placer(bosseler(new THREE.IcosahedronGeometry(0.5, 1), 0.06, aleat).scale(1.8, 0.14, 0.8), 0, 0.02, 0.05), 0x8a6a3a, "mat", 0.08);
  for (let i = 0; i < 9; i++) {
    const x = (aleat() - 0.5) * 1.6;
    const z = -0.25 + aleat() * 0.6;
    c.plaque(fronde(0.32 + aleat() * 0.1), surface(new V3(x, 0.075, z), new V3(Math.cos(i * 2.3), 0.1, Math.sin(i * 2.3)), new V3(-Math.sin(i * 2.3), 0, Math.cos(i * 2.3)), Y), i % 3 === 0 ? 0x6b7f45 : 0x8a7a3a, "mat", 0.004);
  }
  const couverture = new THREE.CylinderGeometry(0.1, 0.1, 0.62, 8).rotateZ(Math.PI / 2);
  c.ajouterDegrade(placer(couverture, -0.55, 0.15, -0.28, 0, 0.15, 0), (p) => (Math.abs(p.x + 0.55) > 0.22 ? 0x8f3a22 : PALETTE.vertLaine));
  return enGroupe(c);
}

/** Une fronde de fougère ou de sapin : une nervure et des folioles en dents de scie (polygone plat, u le long). */
function fronde(longueur: number, largeur = 0.06): THREE.Vector2[] {
  const n = 5;
  const haut: THREE.Vector2[] = [];
  const bas: THREE.Vector2[] = [];
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * longueur;
    const l = largeur * Math.sin((Math.PI * (i + 0.3)) / (n + 0.6)) + 0.008;
    haut.push(V(u, i % 2 === 0 ? l : l * 0.45));
    bas.unshift(V(u, -(i % 2 === 0 ? l : l * 0.45)));
  }
  return [V(0, 0), ...haut, V(longueur + 0.03, 0), ...bas];
}

// ---------- La charbonnière ----------

function charbonniere(): { groupe: THREE.Group; braise: THREE.Mesh } {
  const c = new Assemblage(23);
  c.occlusion = 0.3;
  const aleat = aleatoire(23);
  // La meule : bois empilé couvert de terre, bosselée ; des plaques de gazon en bas, la suie autour de la cheminée.
  const dome = bosseler(new THREE.SphereGeometry(1, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0.022, aleat).scale(1.12, 0.78, 1.12);
  c.ajouterDegrade(dome, (p) => {
    const bruit = Math.sin(p.x * 7.1 + p.z * 3.3) + Math.sin(p.z * 8.7 - p.x * 2.1);
    if (p.y > 0.66) return 0x3d332b;
    if (p.y < 0.28 && bruit > 0.6) return 0x6f7a45;
    return bruit > 1.1 ? 0x75604a : bruit < -1 ? 0x6a5642 : 0x806a52;
  });
  // Des touffes d'herbe au pied et sur le bas de la meule (le gazon de recouvrement a repris).
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + aleat() * 0.3;
    const h = aleat() < 0.5 ? 0.02 : 0.18;
    const r = Math.sqrt(1 - (h / 0.78) ** 2) * 1.12 + 0.02;
    touffe(c, Math.cos(a) * r, Math.sin(a) * r, aleat, 2, 0.22, h);
  }
  const events: THREE.Vector3[] = [];
  // Les évents : des trous sombres tout autour, à mi-hauteur, par où la meule respire (et rougeoie la nuit).
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.25;
    const h = 0.45;
    const r = Math.sqrt(1 - (h / 0.78) ** 2) * 1.12;
    const p = new V3(Math.cos(a) * r, h, Math.sin(a) * r);
    events.push(p);
    const n = new V3(Math.cos(a) * 0.78 * 0.78, h * 1.12 * 1.12, Math.sin(a) * 0.78 * 0.78).normalize();
    const trou = new THREE.CircleGeometry(0.055, 6);
    trou.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Z, n));
    c.ajouter(trou.translate(p.x + n.x * 0.012, p.y + n.y * 0.012, p.z + n.z * 0.012), 0x1d1712);
  }
  // La cheminée au sommet : une couronne de bouts de bois charbonneux autour d'un trou noir.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    rondin(c, new V3(Math.cos(a) * 0.14, 0.72, Math.sin(a) * 0.14), new V3(Math.cos(a) * 0.15, 0.86, Math.sin(a) * 0.15), 0.035, 0x2e2722, 5);
  }
  c.ajouter(placer(new THREE.CircleGeometry(0.12, 7).rotateX(-Math.PI / 2), 0, 0.79, 0), 0x141110);
  // Les bouts de bûches qui dépassent à la base, et une pelle plantée dans la terre de recouvrement.
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    const r = 1.08;
    rondin(c, new V3(Math.cos(a) * (r - 0.15), 0.07 + (i % 2) * 0.05, Math.sin(a) * (r - 0.15)), new V3(Math.cos(a) * (r + 0.12), 0.07 + (i % 2) * 0.05, Math.sin(a) * (r + 0.12)), 0.065, BOIS.ecorce);
  }
  c.ajouter(placer(bosseler(new THREE.IcosahedronGeometry(0.35, 1), 0.05, aleat).scale(1.3, 0.4, 1), 1.45, 0.05, 0.6), TERRE_REMUEE, "mat", 0.06);
  c.perche(new V3(1.42, 0.12, 0.55), new V3(1.55, 1.05, 0.38), 0.018, BOIS.clair, "mat", 5);
  c.ajouter(placer(new THREE.BoxGeometry(0.2, 0.26, 0.012), 1.41, 0.06, 0.57, 0.15, 0.9, 0.1), 0x5c5a56, "metal");
  c.ajouter(placer(new THREE.BoxGeometry(0.12, 0.025, 0.025), 1.56, 1.06, 0.37, 0, 0.9, 0), BOIS.sombre);
  const groupe = enGroupe(c);
  // La lueur rouge qui filtre au pied et par les évents, quand elle cuit : une seule pièce, qui palpite.
  const geos: THREE.BufferGeometry[] = [new THREE.RingGeometry(1.06, 1.17, 24).rotateX(-Math.PI / 2).translate(0, 0.03, 0)];
  for (const p of events) {
    const n = p.clone().setY(p.y * 1.6).normalize();
    const g = new THREE.CircleGeometry(0.05, 6);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Z, n));
    geos.push(g.translate(p.x + n.x * 0.02, p.y + n.y * 0.02, p.z + n.z * 0.02));
  }
  const braise = new THREE.Mesh(
    mergeGeometries(geos.map((g) => g.toNonIndexed())) ?? geos[0]!,
    new THREE.MeshBasicMaterial({ color: 0xff4a1c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  groupe.add(braise);
  return { groupe, braise };
}

// ---------- La forge ----------

function forge(): THREE.Group {
  const c = new Assemblage(57);
  c.occlusion = 0.35;
  const aleat = aleatoire(57);
  // Le foyer : un massif de pierres sèches liées à l'argile, en fer à cheval ouvert vers le soufflet.
  const argile = 0x9a7a5a;
  c.ajouter(placer(new THREE.BoxGeometry(1.3, 0.5, 0.75), 0, 0.25, 0), argile, "mat", 0.04);
  for (let rang = 0; rang < 3; rang++) {
    const y = 0.09 + rang * 0.16;
    for (let i = 0; i < 6; i++) {
      for (const s of [-1, 1]) {
        const g = bosseler(new THREE.BoxGeometry(0.22, 0.14, 0.12, 1, 1, 1), 0.02, aleat);
        c.ajouter(placer(g, -0.55 + i * 0.22 + (rang % 2) * 0.1, y, s * 0.36, 0, (aleat() - 0.5) * 0.2, 0), aleat() < 0.5 ? PALETTE.pierre : PALETTE.pierreSombre, "mat", 0.06);
      }
      if (i < 3) {
        for (const s of [-1, 1]) {
          const g = bosseler(new THREE.BoxGeometry(0.12, 0.14, 0.22, 1, 1, 1), 0.02, aleat);
          c.ajouter(placer(g, s * 0.63, y, -0.22 + i * 0.22 + (rang % 2) * 0.06), aleat() < 0.5 ? PALETTE.pierre : PALETTE.pierreSombre, "mat", 0.06);
        }
      }
    }
  }
  // Le rebord du dessus, et la cuvette de charbon au milieu (l'argile y est noircie).
  for (const s of [-1, 1]) c.ajouter(placer(bosseler(new THREE.BoxGeometry(1.36, 0.08, 0.2), 0.015, aleat), 0, 0.53, s * 0.3), 0x8a6d50, "mat", 0.05);
  c.ajouter(placer(new THREE.BoxGeometry(0.95, 0.04, 0.42), 0, 0.51, 0), 0x2f2a26, "mat");
  for (let i = 0; i < 26; i++) {
    const r = 0.03 + aleat() * 0.03;
    c.ajouter(placer(bosseler(new THREE.OctahedronGeometry(r * 0.9, 0), r * 0.25, aleat), (aleat() - 0.5) * 0.8, 0.54 + aleat() * 0.03, (aleat() - 0.5) * 0.3, aleat() * 3, aleat() * 3, 0), i % 5 === 0 ? 0x4a4440 : CHARBON, "mat", 0.05);
  }
  // La tuyère : un tuyau de fer qui entre dans le foyer côté soufflet.
  c.perche(new V3(-0.78, 0.29, 0), new V3(-0.5, 0.4, 0), 0.03, 0x4a4440, "metal", 6);
  // Le soufflet de cuir : deux planches en goutte d'eau, le cuir plissé entre elles, la buse, la poignée.
  const goutte = new THREE.Shape();
  goutte.moveTo(0, -0.04);
  goutte.lineTo(0.32, -0.2);
  goutte.absarc(0.42, 0, 0.2, -Math.PI / 2, Math.PI / 2, false);
  goutte.lineTo(0, 0.04);
  goutte.lineTo(0, -0.04);
  const soufflet = new THREE.Matrix4()
    .makeTranslation(-0.9, 0.27, 0)
    .multiply(new THREE.Matrix4().makeRotationZ(0.08))
    .multiply(new THREE.Matrix4().makeRotationY(Math.PI))
    .multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
  c.repere = soufflet;
  for (const z of [-0.075, 0.075]) c.ajouter(new THREE.ExtrudeGeometry(goutte, { depth: 0.02, bevelEnabled: false, curveSegments: 4 }).translate(0, 0, z - 0.01), BOIS.moyen, "mat", 0.05);
  for (let k = 0; k < 3; k++) {
    const pli = new THREE.ExtrudeGeometry(goutte, { depth: 0.04, bevelEnabled: false, curveSegments: 4 });
    const e = 0.93 - k * 0.04;
    c.ajouter(pli.scale(e, e, 1).translate(0.02, 0, -0.06 + k * 0.04), PALETTE.cuir, "mat", 0.04);
  }
  c.repere = null;
  c.ajouter(placer(new THREE.ConeGeometry(0.035, 0.18, 6).rotateZ(-Math.PI / 2), -0.84, 0.28, 0), 0x4a4440, "metal");
  c.perche(new V3(-1.55, 0.28, 0), new V3(-1.72, 0.32, 0), 0.016, BOIS.clair, "mat", 4);
  rondin(c, new V3(-1.3, 0, 0), new V3(-1.3, 0.2, 0), 0.14);
  // L'enclume sur son billot : table, bigorne, talon ; un marteau posé dessus, des pinces contre le billot.
  rondin(c, new V3(1.3, -0.02, 0.1), new V3(1.3, 0.5, 0.1), 0.23, BOIS.ecorce, 9);
  const fer = 0x45423f;
  c.boite(fer, "metal", 0.36, 0.08, 0.13, 1.3, 0.62, 0.1);
  c.boite(fer, "metal", 0.18, 0.1, 0.1, 1.3, 0.54, 0.1);
  c.boite(fer, "metal", 0.26, 0.04, 0.17, 1.3, 0.51, 0.1);
  c.ajouter(placer(new THREE.ConeGeometry(0.055, 0.18, 6).rotateZ(Math.PI / 2), 1.57, 0.625, 0.1), fer, "metal");
  c.boite(0x8a8780, "metal", 0.34, 0.006, 0.11, 1.3, 0.663, 0.1);
  c.perche(new V3(1.2, 0.68, 0.2), new V3(1.42, 0.68, 0.3), 0.012, BOIS.clair, "mat", 5);
  c.boite(fer, "metal", 0.03, 0.03, 0.09, 1.2, 0.68, 0.2, 0, 0.42, 0);
  for (const s of [-1, 1]) c.perche(new V3(1.07, 0.02, 0.32 + s * 0.02), new V3(1.15, 0.5, 0.2 + s * 0.01), 0.008, fer, "metal", 4);
  // Le seau de trempe (douves de bois, cercles de fer, eau sombre) et un tas de charbon de bois.
  c.ajouter(placer(new THREE.CylinderGeometry(0.17, 0.14, 0.32, 10), 0.9, 0.16, -0.62), BOIS.moyen, "mat", 0.08);
  for (const y of [0.06, 0.26]) c.ajouter(placer(new THREE.TorusGeometry(0.15 + y * 0.09, 0.008, 3, 10).rotateX(Math.PI / 2), 0.9, y, -0.62), ACIER, "metal");
  c.ajouter(placer(new THREE.CircleGeometry(0.155, 10).rotateX(-Math.PI / 2), 0.9, 0.29, -0.62), 0x2c3a40, "verre");
  for (let i = 0; i < 18; i++) {
    const r = 0.04 + aleat() * 0.03;
    c.ajouter(placer(bosseler(new THREE.OctahedronGeometry(r * 0.9, 0), r * 0.25, aleat), -0.7 + (aleat() - 0.5) * 0.35, 0.02 + aleat() * 0.08, -0.62 + (aleat() - 0.5) * 0.3, aleat() * 3, aleat() * 3, 0), CHARBON, "mat", 0.05);
  }
  return enGroupe(c);
}

// ---------- Le pédalier ----------

function pedalier(): { groupe: THREE.Group; meule: THREE.Object3D; dynamo: THREE.Object3D; roue: THREE.Object3D; manivelle: THREE.Object3D } {
  const c = new Assemblage(18);
  c.occlusion = 0.35;
  const aleat = aleatoire(18);
  // Le bâti : deux patins en rondin, des traverses, les montants qui tiennent l'axe de la roue et la fourche.
  for (const z of [-0.26, 0.26]) rondin(c, new V3(-0.85, 0.06, z), new V3(0.85, 0.06, z), 0.06);
  for (const x of [-0.6, 0.0, 0.6]) planche(c, BOIS.clair, 0.1, 0.04, 0.66, x, 0.13, 0);
  const moyeu = new V3(0.45, 0.95, 0);
  for (const s of [-1, 1]) {
    c.perche(new V3(0.2, 0.12, s * 0.2), moyeu.clone().add(new V3(0, -0.02, s * 0.07)), 0.03, BOIS.ecorce, "mat", 5);
    c.perche(new V3(0.7, 0.12, s * 0.2), moyeu.clone().add(new V3(0, -0.02, s * 0.07)), 0.03, BOIS.ecorce, "mat", 5);
    c.ligature(moyeu.clone().add(new V3(0, -0.03, s * 0.07)), Y, 0.035);
  }
  planche(c, BOIS.moyen, 0.12, 0.66, 0.12, -0.6, 0.47, 0);
  // Le cadre du vieux vélo (lien avec le vestige de la ferme) : losange de tubes rouillés, la fourche serrée sur
  // le poteau, la selle, le guidon.
  const tube = PALETTE.rouille;
  const pedale = new V3(0.02, 0.8, 0);
  const selle = new V3(-0.14, 1.28, 0);
  const douille = new V3(-0.5, 1.2, 0);
  const douilleBas = new V3(-0.53, 1.06, 0);
  c.perche(pedale, selle, 0.02, tube, "tole", 6);
  c.perche(selle.clone().add(new V3(0.01, -0.04, 0)), douille, 0.018, tube, "tole", 6);
  c.perche(pedale, douilleBas, 0.022, tube, "tole", 6);
  c.perche(douilleBas.clone().add(new V3(0, -0.02, 0)), douille.clone().add(new V3(0.02, 0.06, 0)), 0.024, tube, "tole", 6);
  for (const s of [-1, 1]) {
    c.perche(pedale.clone().setZ(s * 0.03), moyeu.clone().setZ(s * 0.05), 0.012, tube, "tole", 5);
    c.perche(selle.clone().add(new V3(0, -0.06, s * 0.02)), moyeu.clone().setZ(s * 0.05), 0.011, tube, "tole", 5);
    c.perche(douilleBas.clone().setZ(s * 0.04), new V3(-0.6, 0.78, s * 0.06), 0.013, 0x7a4a2a, "tole", 5);
  }
  c.ligature(new V3(-0.6, 0.8, 0), Y, 0.08);
  // Les taches de peinture d'origine qui restent sous la rouille.
  c.perche(pedale.clone().lerp(douilleBas, 0.3), pedale.clone().lerp(douilleBas, 0.6), 0.0235, 0x4d6a7a, "tole", 6);
  c.perche(selle, selle.clone().add(new V3(0.01, 0.1, 0)), 0.013, ACIER, "tole", 5);
  c.ajouter(placer(bosseler(new THREE.BoxGeometry(0.26, 0.05, 0.13, 2, 1, 1), 0.008, aleat).scale(1, 1, 1), selle.x - 0.02, selle.y + 0.12, 0), 0x2b2622, "mat", 0.04);
  c.perche(douille.clone().add(new V3(0.02, 0.06, 0)), douille.clone().add(new V3(-0.06, 0.14, 0)), 0.014, ACIER, "tole", 5);
  c.perche(new V3(-0.06, 0, -0.24).add(douille).add(new V3(0, 0.14, 0)), new V3(-0.06, 0, 0.24).add(douille).add(new V3(0, 0.14, 0)), 0.012, ACIER, "tole", 5);
  for (const s of [-1, 1]) c.perche(douille.clone().add(new V3(-0.06, 0.14, s * 0.18)), douille.clone().add(new V3(-0.06, 0.14, s * 0.27)), 0.02, NOIR, "mat", 6);
  // La chaîne, du plateau au pignon de la roue (en haut et en bas).
  for (const [dy0, dy1] of [[0.1, 0.05], [-0.1, -0.05]] as const) c.perche(pedale.clone().add(new V3(0, dy0, 0.05)), moyeu.clone().add(new V3(0, dy1, 0.05)), 0.006, 0x3a3836, "tole", 3);
  const groupe = enGroupe(c);

  // La manivelle (plateau, bielles, pédales) : elle tourne avec la roue.
  const m = new Assemblage(19);
  m.ajouter(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 14).rotateX(Math.PI / 2).translate(0, 0, 0.05), 0x55524d, "metal");
  for (const s of [-1, 1]) {
    m.boite(0x77746c, "metal", 0.03, 0.17, 0.015, 0, (s * 0.17) / 2, s * 0.075);
    m.boite(0x2b2b2b, "metal", 0.1, 0.022, 0.07, 0, s * 0.17, s * 0.12);
  }
  const manivelle = enGroupe(m);
  manivelle.position.copy(pedale);

  // La roue-volant (roue arrière du vélo), qui tourne quand on pédale.
  const r = new Assemblage(20);
  roueVelo(r, 0.34);
  r.ajouter(new THREE.CylinderGeometry(0.05, 0.05, 0.01, 10).rotateX(Math.PI / 2).translate(0, 0, 0.05), 0x55524d, "metal");
  const roue = enGroupe(r);
  roue.position.copy(moyeu);
  // La meule de grès (montée plus tard), sur l'axe prolongé : elle tourne avec la roue.
  const mm = new Assemblage(24);
  mm.ajouter(bosseler(new THREE.CylinderGeometry(0.21, 0.21, 0.07, 16, 1).rotateX(Math.PI / 2), 0.006, aleat), 0xa49a86, "mat", 0.05);
  mm.ajouter(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 6).rotateX(Math.PI / 2), 0x55524d, "mat");
  mm.ajouter(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 5).rotateX(Math.PI / 2).translate(0, 0, -0.13), ACIER, "mat");
  const meule = enGroupe(mm);
  meule.position.set(moyeu.x, moyeu.y, 0.3);
  // La dynamo (montée plus tard), en appui sur le pneu, et son fil qui file vers le banc.
  const d = new Assemblage(25);
  const a = 0.35;
  const contre = new V3(moyeu.x + Math.cos(a) * 0.4, moyeu.y + Math.sin(a) * 0.4, -0.03);
  d.perche(contre, contre.clone().add(new V3(0.04, 0.14, 0)), 0.026, 0xc9ccd0, "metal", 8);
  d.ajouter(placer(new THREE.CylinderGeometry(0.015, 0.012, 0.03, 6), contre.x - 0.004, contre.y - 0.015, contre.z), NOIR, "metal");
  d.perche(contre.clone().add(new V3(0.02, 0.05, -0.02)), moyeu.clone().add(new V3(0.15, 0.06, -0.06)), 0.007, ACIER, "metal", 4);
  corde(d, [contre.clone().add(new V3(0.04, 0.14, -0.02)), contre.clone().add(new V3(0.12, 0.05, -0.1)), new V3(0.85, 0.2, -0.25), new V3(0.75, 0.02, -0.45), new V3(0.4, 0.015, -0.7)], 0.007, 0xd2691e, 12, "metal");
  const dynamo = enGroupe(d);
  groupe.add(manivelle, roue, meule, dynamo);
  return { groupe, meule, dynamo, roue, manivelle };
}

// ---------- Le banc de recharge ----------

function banc(): { groupe: THREE.Group; posees: THREE.Group; voyant: THREE.Mesh } {
  const c = new Assemblage(37);
  c.occlusion = 0.35;
  // Le plateau de trois planches sur deux tréteaux, une étagère dessous.
  [BOIS.moyen, BOIS.clair, BOIS.gris].forEach((ton, i) => planche(c, ton, 1.3, 0.05, 0.18, (i - 1) * 0.015, 0.6, -0.185 + i * 0.185));
  for (const x of [-0.55, 0.55]) {
    for (const s of [-1, 1]) planche(c, BOIS.sombre, 0.06, 0.6, 0.06, x, 0.29, s * 0.2, s * 0.12, 0, 0);
    planche(c, BOIS.sombre, 0.06, 0.06, 0.5, x, 0.54, 0);
    planche(c, BOIS.moyen, 0.06, 0.05, 0.52, x, 0.16, 0);
  }
  planche(c, BOIS.gris, 1.2, 0.025, 0.3, 0, 0.19, 0);
  // Sur l'étagère : un rouleau de câble et une vieille boîte à outils.
  c.ajouter(placer(new THREE.TorusGeometry(0.1, 0.03, 5, 10).rotateX(Math.PI / 2), -0.3, 0.225, 0), 0xd2691e, "mat", 0.05);
  c.boite(0x7a2f22, "tole", 0.3, 0.12, 0.16, 0.25, 0.265, 0);
  // Le régulateur jaune : un boîtier, un cadran, l'aiguille ; les câbles rouge et noir qui en partent.
  const regulateur = new V3(-0.32, 0.625, 0.02);
  c.boite(PALETTE.jauneReflechissant, "tole", 0.24, 0.14, 0.14, regulateur.x, regulateur.y + 0.07, regulateur.z);
  const face = surface(new V3(regulateur.x, regulateur.y + 0.08, regulateur.z + 0.071), X, Y, Z);
  c.plaque([V(-0.085, -0.045), V(0.03, -0.045), V(0.03, 0.045), V(-0.085, 0.045)], face, 0xe8e0c8, "mat", 0.002);
  c.plaque([V(-0.03, -0.03), V(-0.025, -0.033), V(0.0, 0.03)], face, 0xc8362b, "mat", 0.004);
  for (const [dz, couleur] of [[-0.03, 0xc8362b], [0.03, 0x2b2b2b]] as const) {
    corde(c, [regulateur.clone().add(new V3(0.12, 0.05, dz)), new V3(0.0, 0.68, dz * 2), new V3(0.18, 0.66, -0.04 + dz), new V3(0.3, 0.64, -0.07 + dz)], 0.008, couleur, 8);
  }
  // Une lampe de chantier posée (éteinte), son fil en boucle.
  c.ajouter(placer(new THREE.CylinderGeometry(0.06, 0.07, 0.03, 8), -0.56, 0.64, -0.15), 0x2b2b2b, "mat");
  c.perche(new V3(-0.56, 0.65, -0.15), new V3(-0.53, 0.84, -0.12), 0.01, 0x2b2b2b, "metal", 4);
  c.ajouter(placer(new THREE.CylinderGeometry(0.06, 0.035, 0.08, 8), -0.52, 0.85, -0.08, Math.PI / 2 - 0.5, 0, 0), PALETTE.jauneReflechissant, "tole");
  c.ajouter(placer(new THREE.CircleGeometry(0.055, 8), -0.52, 0.83, -0.04, -0.5, 0, 0), 0xd8dde4, "verre");
  const groupe = enGroupe(c);
  // Le voyant de charge : vert quand une batterie est posée (voir majEtat).
  const voyant = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 4), new THREE.MeshBasicMaterial({ color: 0x5aff7a }));
  voyant.position.set(regulateur.x + 0.08, regulateur.y + 0.1, regulateur.z + 0.072);
  groupe.add(voyant);
  // Les batteries posées : une batterie de voiture au bout du banc, une petite batterie à côté (chacune avec sa pince).
  const posees = new THREE.Group();
  const v = new Assemblage(38);
  batterieVoiture(v);
  for (const [x, couleur] of [[-0.12, 0xc8362b], [0.12, 0x2b2b2b]] as const) v.boite(couleur, "mat", 0.05, 0.025, 0.03, x, 0.255, -0.05, 0, 0, 0.3);
  const voiture = enGroupe(v);
  voiture.position.set(0.37, 0.625, -0.07);
  voiture.name = "batterie_voiture";
  const p = new Assemblage(39);
  p.boite(PALETTE.bleuTravail, "tole", 0.16, 0.1, 0.1, 0, 0.05, 0);
  p.boite(0x2f4a74, "tole", 0.165, 0.02, 0.105, 0, 0.105, 0);
  p.plaque([V(-0.06, 0.03), V(0.06, 0.03), V(0.06, 0.07), V(-0.06, 0.07)], surface(new V3(0, 0, 0.05), X, Y, Z), PALETTE.jauneReflechissant, "mat", 0.003);
  for (const [x, couleur] of [[-0.05, 0xc8362b], [0.05, 0x3a3836]] as const) p.ajouter(placer(new THREE.CylinderGeometry(0.012, 0.012, 0.025, 6), x, 0.125, 0), couleur, "mat");
  const petite = enGroupe(p);
  petite.position.set(0.47, 0.625, 0.16);
  petite.rotation.y = -0.3;
  petite.name = "petite_batterie";
  posees.add(voiture, petite);
  groupe.add(posees);
  return { groupe, posees, voyant };
}

// ---------- Le panneau solaire ----------

function panneauSolaire(): THREE.Group {
  const c = new Assemblage(41);
  c.occlusion = 0.3;
  const aleat = aleatoire(41);
  // Le chevalet de branches : deux pieds courts à l'avant, deux longs à l'arrière, ligaturés ; une pierre au pied.
  for (const x of [-0.45, 0.45]) {
    c.perche(new V3(x, -0.03, 0.32), new V3(x, 0.66, 0.12), 0.032, BOIS.ecorce, "mat", 5, 0.026);
    c.perche(new V3(x, -0.03, -0.5), new V3(x, 0.95, -0.27), 0.032, BOIS.ecorce, "mat", 5, 0.026);
    c.perche(new V3(x, 0.3, 0.24), new V3(x, 0.32, -0.38), 0.02, BOIS.ecorce, "mat", 4);
    for (const z of [0.32, -0.5]) caillou(c, x, 0.04, z, 0.08, aleat, PALETTE.pierreSombre);
    c.ligature(new V3(x, 0.31, 0.23), Z, 0.035);
  }
  c.perche(new V3(-0.5, 0.62, 0.14), new V3(0.5, 0.62, 0.14), 0.022, BOIS.ecorce, "mat", 5);
  c.perche(new V3(-0.5, 0.92, -0.255), new V3(0.5, 0.92, -0.255), 0.022, BOIS.ecorce, "mat", 5);
  // Le câble : de la boîte de jonction jusqu'au sol, en boucle (il part vers le banc, voir main.ts).
  corde(c, [new V3(0, 0.72, -0.05), new V3(0.05, 0.5, -0.15), new V3(0.1, 0.08, -0.2), new V3(0.25, 0.015, -0.1), new V3(0.15, 0.015, 0.05), new V3(0, 0.015, -0.2)], 0.008, 0x1f1f1f, 12);
  const g = enGroupe(c);
  // Le panneau, incliné vers le sud : le haut au nord.
  const p = new Assemblage(42);
  modulePanneau(p);
  const panneau = enGroupe(p);
  panneau.position.set(0, 0.82, 0);
  panneau.rotation.x = 0.6;
  g.add(panneau);
  return g;
}

// ---------- La fumée ----------

const FUMEE_JOUR = new THREE.Color(0xa49e95);
const FUMEE_NUIT = new THREE.Color(0x2e333c);
const COULEUR_FUMEE = new THREE.Color();
/** Les bouffées de la colonne de fumée de la charbonnière. */
const NB_FUMEE = 22;

// ---------- La gamme bushcraft, lot 1 (P-002, 2026-10-08) ----------

/** Le récupérateur de pluie : une bâche tendue en entonnoir sur quatre piquets fourchus, qui goutte dans une bassine. */
function recuperateur(): { groupe: THREE.Group; eau: THREE.Mesh } {
  const c = new Assemblage(61);
  c.occlusion = 0.3;
  const aleat = aleatoire(61);
  const coins: [number, number, number][] = [[-0.72, -0.72, 1.28], [0.72, -0.72, 1.28], [-0.72, 0.72, 1.06], [0.72, 0.72, 1.06]];
  for (const [x, z, h] of coins) {
    piquetFourchu(c, x * 1.08, z * 1.08, h + 0.04, 0.035, aleat);
    touffe(c, x * 1.08, z * 1.08, aleat, 2, 0.25);
  }
  // La bâche : chaque coin noué à son piquet, les bords qui pendent entre eux, le creux vers le centre (assombri : mouillé).
  const hauteur = (u: number, v: number) => {
    const bord = 1.28 * (1 - v) + 1.06 * v;
    const r = Math.hypot(u - 0.5, v - 0.5) / 0.5;
    const pente = 0.42 * Math.max(0, 1 - r) ** 1.4;
    const flottant = 0.05 * (Math.sin(Math.PI * u) + Math.sin(Math.PI * v));
    return bord - pente - flottant;
  };
  toile(
    c,
    10,
    10,
    (u, v) => new V3((u - 0.5) * 1.44, hauteur(u, v), (v - 0.5) * 1.44),
    (i, j) => {
      const r = Math.hypot(i - 4.5, j - 4.5);
      return r < 1.6 ? 0x234f75 : r < 3 ? 0x2a6292 : (i + j) % 5 === 0 ? BACHE_PASSEE : BACHE;
    },
  );
  for (const [x, z, h] of coins) cordePendante(c, new V3(x, h - 0.01, z), new V3(x * 1.08, h + 0.02, z * 1.08), 0.005, 0.006);
  // Les gouttes qui tombent du creux de la bâche dans la bassine.
  for (let i = 0; i < 3; i++) c.ajouter(placer(new THREE.OctahedronGeometry(0.012, 0).scale(1, 1.8, 1), (aleat() - 0.5) * 0.03, 0.4 + i * 0.13, (aleat() - 0.5) * 0.03), 0x9ec4d8, "verre");
  // La bassine galvanisée : paroi épaisse (dehors, rebord roulé, dedans), un peu cabossée.
  const profil = [V(0, 0), V(0.2, 0), V(0.27, 0.28), V(0.285, 0.292), V(0.27, 0.3), V(0.258, 0.29), V(0.19, 0.016), V(0, 0.016)];
  c.ajouter(bosseler(new THREE.LatheGeometry(profil, 14), 0.004, aleat), 0x8f969b, "metal", 0.04);
  c.plaque(tache(0, 0, 0.36, 0.36, aleat, 10), surface(new V3(0, 0, 0), X, Z, Y), 0x4e5a3a, "mat", 0.01);
  const groupe = enGroupe(c);
  // L'eau dans la bassine : son niveau (et donc sa largeur) suit l'état.
  const eau = new THREE.Mesh(new THREE.CircleGeometry(1, 14).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x5f8fa8, roughness: 0.08, metalness: 0.1 }));
  eau.position.y = 0.02;
  groupe.add(eau);
  return { groupe, eau };
}

/** L'alarme : deux piquets, une ficelle tendue à hauteur de genou, des boîtes de conserve qui pendent et s'entrechoquent. */
function alarme(): THREE.Group {
  const c = new Assemblage(63);
  c.occlusion = 0.25;
  const aleat = aleatoire(63);
  for (const x of [-0.65, 0.65]) {
    c.perche(new V3(x, -0.05, 0), new V3(x + x * -0.03, 0.58, 0), 0.026, BOIS.ecorce, "mat", 5, 0.02);
    c.ajouter(placer(new THREE.ConeGeometry(0.03, 0.06, 5), x, 0.6, 0), BOIS.coupe, "mat");
    c.ligature(new V3(x * 0.97, 0.48, 0), Y, 0.03);
    touffe(c, x, 0, aleat, 3, 0.3);
  }
  const a = new V3(-0.63, 0.48, 0);
  const b = new V3(0.63, 0.47, 0);
  cordePendante(c, a, b, 0.05, 0.004, 0xd8cfb8);
  // Les boîtes : vides, ouvertes, étiquettes délavées (vestiges de l'Abondance), suspendues à des longueurs différentes.
  const etiquettes = [0xd8ccb0, 0xa8645a, null, 0xc9b56a, null];
  for (let i = 0; i < 5; i++) {
    const t = 0.18 + i * 0.16;
    const accroche = a.clone().lerp(b, t).add(new V3(0, -0.05 * 4 * t * (1 - t), 0));
    const longueur = 0.06 + aleat() * 0.1;
    const centre = accroche.clone().add(new V3(0, -longueur - 0.06, 0));
    c.perche(accroche, centre.clone().add(new V3(0, 0.06, 0)), 0.002, 0xd8cfb8, "mat", 3);
    const penche = new THREE.Euler((aleat() - 0.5) * 0.4, aleat() * 3, (aleat() - 0.5) * 0.4);
    const boite = bosseler(new THREE.CylinderGeometry(0.042, 0.042, 0.11, 9, 2, true), i === 2 ? 0.006 : 0.002, aleat);
    c.ajouter(placer(boite, centre.x, centre.y, centre.z, penche.x, penche.y, penche.z), 0xb8b4ac, "metal", 0.04);
    c.ajouter(placer(new THREE.CircleGeometry(0.042, 9).rotateX(Math.PI / 2).translate(0, -0.055, 0), centre.x, centre.y, centre.z, penche.x, penche.y, penche.z), 0x8a8780, "metal");
    c.ajouter(placer(new THREE.CircleGeometry(0.04, 9).rotateX(-Math.PI / 2).translate(0, 0.045, 0), centre.x, centre.y, centre.z, penche.x, penche.y, penche.z), 0x3a3836, "metal");
    for (const y of [-0.045, 0.045]) c.ajouter(placer(new THREE.TorusGeometry(0.043, 0.004, 3, 9).rotateX(Math.PI / 2).translate(0, y, 0), centre.x, centre.y, centre.z, penche.x, penche.y, penche.z), 0x9a968c, "metal");
    const e = etiquettes[i];
    if (e) c.ajouter(placer(new THREE.CylinderGeometry(0.0435, 0.0435, 0.06, 9, 1, true), centre.x, centre.y, centre.z, penche.x, penche.y, penche.z), e, "mat", 0.04);
  }
  return enGroupe(c);
}

/** Le lit de branchages : un cadre de rondins, une épaisse couche de rameaux de sapin, une couverture roulée. */
/**
 * Les installations du métier (Book 25 : pièges, clôtures, tour à perche) arrivent avec leur modèle, aux chantiers 6
 * et 7 ; en attendant, un piquet de bois ligaturé, planté là où on l'a posée.
 */
function piquetProvisoire(): THREE.Group {
  const c = new Assemblage(71);
  c.occlusion = 0.2;
  const aleat = aleatoire(71);
  c.perche(new V3(0, -0.05, 0), new V3(0.02, 0.7, 0), 0.03, BOIS.ecorce, "mat", 5, 0.024);
  c.ajouter(placer(new THREE.ConeGeometry(0.034, 0.07, 5), 0.02, 0.73, 0), BOIS.coupe, "mat");
  c.ligature(new V3(0.015, 0.5, 0), Y, 0.034);
  touffe(c, 0, 0, aleat, 3, 0.3);
  return enGroupe(c);
}

function lit(): THREE.Group {
  const c = new Assemblage(57);
  c.occlusion = 0.2;
  const aleat = aleatoire(57);
  for (const x of [-0.44, 0.44]) rondin(c, new V3(x, 0.07, -1.0), new V3(x + (aleat() - 0.5) * 0.04, 0.07, 1.0), 0.07);
  for (const z of [-0.98, 0.98]) rondin(c, new V3(-0.52, 0.14, z), new V3(0.52, 0.14, z), 0.055);
  for (const [x, z] of [[-0.44, -0.98], [0.44, -0.98], [-0.44, 0.98], [0.44, 0.98]] as const) c.ligature(new V3(x, 0.14, z), Y, 0.08);
  // Le fond : une couche de rameaux secs, puis les rameaux verts, posés en écailles de la tête vers les pieds.
  c.ajouter(placer(bosseler(new THREE.BoxGeometry(0.8, 0.1, 1.85, 3, 1, 6), 0.02, aleat), 0, 0.07, 0), 0x4a5232, "mat", 0.08);
  const verts = [0x4f6b3a, 0x5d7a40, 0x46613a, 0x6b7f45];
  for (let i = 0; i < 40; i++) {
    const rangee = Math.floor(i / 4);
    const z = 0.82 - rangee * 0.17 + (aleat() - 0.5) * 0.05;
    const x = -0.28 + (i % 4) * 0.19 + (aleat() - 0.5) * 0.08;
    // Chaque rameau part vers les pieds, le bout relevé, un peu vrillé : la lumière accroche les facettes.
    const a = Math.PI / 2 + (aleat() - 0.5) * 0.7;
    const y = 0.13 + aleat() * 0.025;
    const vrille = (aleat() - 0.5) * 0.7;
    const long = 0.3 + aleat() * 0.1;
    const s = surface(new V3(x, y, z), new V3(Math.cos(a), 0.28, Math.sin(a)).normalize(), new V3(-Math.sin(a), vrille, Math.cos(a)).normalize(), Y);
    c.plaque(fronde(long, 0.095), s, aleat() < 0.1 ? 0x8a7a4a : verts[i % 4]!, "mat", 0);
    c.perche(s.point(-0.02, 0).add(new V3(0, 0.004, 0)), s.point(long * 0.8, 0).add(new V3(0, 0.004, 0)), 0.006, 0x4a3a2a, "mat", 3, 0.003, 0);
  }
  // La couverture roulée à la tête, quelques aiguilles tombées autour.
  const couverture = new THREE.CylinderGeometry(0.11, 0.11, 0.7, 8).rotateZ(Math.PI / 2);
  c.ajouterDegrade(placer(couverture, 0, 0.26, -0.8), (p) => (Math.abs(p.x) > 0.26 ? 0x8f3a22 : Math.abs(p.x) > 0.22 ? PALETTE.toileEcrue : 0x6f6a52));
  for (let i = 0; i < 4; i++) c.plaque(tache((aleat() - 0.5) * 1.4, (aleat() - 0.5) * 2.3, 0.12, 0.06, aleat, 6), surface(new V3(0, 0, 0), X, Z, Y), 0x6b5a3a, "mat", 0.01);
  return enGroupe(c);
}

// ---------- Les niveaux (Book 24 §2.5) : des pièces en plus sur le modèle de base, lisibles de loin ----------

/** Un panneau de branches tressées (clayonnage) entre deux points au sol, d'une hauteur donnée. */
function clayonnage(c: Assemblage, a: THREE.Vector3, b: THREE.Vector3, h: number, aleat: () => number): void {
  const d = b.clone().sub(a);
  const n = Math.max(3, Math.round(d.length() / 0.32));
  for (let k = 0; k <= n; k++) {
    const p = a.clone().addScaledVector(d, k / n);
    c.perche(p.clone().add(new V3(0, -0.04, 0)), p.clone().add(new V3((aleat() - 0.5) * 0.03, h + aleat() * 0.08, 0)), 0.02, BOIS.ecorce, "mat", 5, 0.015);
  }
  // Les brins souples passés devant, derrière, devant…
  const cote = new V3(-d.z, 0, d.x).normalize().multiplyScalar(0.018);
  for (let r = 0; r < Math.floor(h / 0.09); r++) {
    const y = 0.08 + r * 0.09;
    const sens = r % 2 ? 1 : -1;
    c.perche(a.clone().add(new V3(0, y, 0)).addScaledVector(cote, sens), b.clone().add(new V3(0, y + 0.01, 0)).addScaledVector(cote, -sens), 0.014, r % 3 === 0 ? 0x6b5a3a : BOIS.moyen, "mat", 4);
  }
}

/** Ce qu'un niveau ajoute au modèle de base. Null : rien à ajouter. */
function piecesNiveau(type: InstallationVue["type"], niveau: number): THREE.Group | null {
  if (niveau <= 1) return null;
  const c = new Assemblage(300 + niveau);
  c.occlusion = 0.3;
  const aleat = aleatoire(300 + niveau);
  if (type === "abri") {
    // Abri garni : un vrai lit de rameaux de sapin sous la bâche, une couverture dépliée.
    for (const x of [-0.95, 0.95]) rondin(c, new V3(x, 0.06, -0.35), new V3(x, 0.06, 0.55), 0.06);
    const verts = [0x4f6b3a, 0x5d7a40, 0x46613a, 0x6b7f45];
    for (let i = 0; i < 24; i++) {
      const x = -0.8 + (i % 6) * 0.32 + (aleat() - 0.5) * 0.06;
      const z = -0.28 + Math.floor(i / 6) * 0.22;
      const a = Math.PI / 2 + (aleat() - 0.5) * 0.6;
      const s = surface(new V3(x, 0.12 + aleat() * 0.02, z), new V3(Math.cos(a), 0.2, Math.sin(a)).normalize(), new V3(-Math.sin(a), 0, Math.cos(a)), Y);
      c.plaque(fronde(0.3, 0.09), s, verts[i % 4]!, "mat", 0);
    }
    c.ajouter(placer(bosseler(new THREE.BoxGeometry(0.9, 0.04, 0.6, 3, 1, 2), 0.015, aleat), 0.35, 0.17, 0.12, 0, 0.1, 0), 0x8f3a22, "toile", 0.06);
    if (niveau >= 3) {
      // Abri fermé : un coupe-vent tressé sur le côté au vent, et une couverture de chiffons cousus.
      clayonnage(c, new V3(-1.3, 0, -0.5), new V3(-1.3, 0, 0.9), 1.15, aleat);
      clayonnage(c, new V3(1.3, 0, -0.5), new V3(1.3, 0, 0.6), 0.9, aleat);
      const tons = [0x8f3a22, PALETTE.toileEcrue, 0x5a6f8a, PALETTE.vertLaine];
      for (let k = 0; k < 6; k++) c.boite(tons[k % 4]!, "toile", 0.3, 0.03, 0.3, -0.45 + (k % 3) * 0.3, 0.2, -0.02 + Math.floor(k / 3) * 0.3);
    }
  } else if (type === "recuperateur_pluie") {
    // Citerne de bâche : un bac de perches doublé de bâche sous l'entonnoir, et son couvercle.
    for (const [x, z] of [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]] as const) {
      c.perche(new V3(x, -0.03, z), new V3(x, 0.6, z), 0.035, BOIS.ecorce, "mat", 5);
    }
    for (const y of [0.12, 0.5]) {
      for (const s of [-1, 1]) {
        rondin(c, new V3(-0.44, y, s * 0.44), new V3(0.44, y, s * 0.44), 0.025);
        rondin(c, new V3(s * 0.44, y + 0.03, -0.44), new V3(s * 0.44, y + 0.03, 0.44), 0.025);
      }
    }
    // La bâche du bac, tendue entre les perches, et son couvercle de planches (un pan ouvert sous l'entonnoir).
    for (const s of [-1, 1]) {
      c.boite(BACHE, "toile", 0.84, 0.52, 0.01, 0, 0.3, s * 0.41);
      c.boite(BACHE_PASSEE, "toile", 0.01, 0.52, 0.84, s * 0.41, 0.3, 0);
    }
    for (let k = 0; k < 4; k++) c.boite([BOIS.clair, BOIS.moyen, BOIS.gris][k % 3]!, "mat", 0.9, 0.025, 0.2, 0, 0.6, -0.36 + k * 0.24 + (k >= 2 ? 0.1 : 0));
  } else if (type === "coffre") {
    // Coffre cerclé : de larges feuillards martelés aux deux bouts, des coins de fer, le fond doublé.
    for (const x of [-0.4, 0.4]) {
      for (const s of [-1, 1]) c.boite(ACIER, "metal", 0.06, 0.42, 0.008, x, 0.23, s * 0.28);
      c.boite(ROUILLE_SOMBRE, "metal", 0.06, 0.008, 0.57, x, 0.445, 0);
    }
    for (const [x, z] of [[-0.43, -0.26], [0.43, -0.26], [-0.43, 0.26], [0.43, 0.26]] as const) c.boite(NOIR, "metal", 0.07, 0.07, 0.07, x, 0.05, z);
    c.boite(BOIS.sombre, "mat", 0.9, 0.03, 0.58, 0, 0.015, 0);
    if (niveau >= 3) {
      // Réserve couverte : des pierres plates dessous, quatre poteaux et un auvent de bâche.
      for (let i = 0; i < 6; i++) caillou(c, -0.4 + (i % 3) * 0.4, 0.03, i < 3 ? -0.34 : 0.34, 0.09, aleat, i % 2 ? PALETTE.pierre : PALETTE.pierreSombre, 0.4);
      for (const [x, z, h] of [[-0.7, -0.55, 1.45], [0.7, -0.55, 1.45], [-0.7, 0.55, 1.2], [0.7, 0.55, 1.2]] as const) {
        c.perche(new V3(x, -0.04, z), new V3(x, h, z), 0.035, BOIS.ecorce, "mat", 5);
      }
      toile(c, 6, 6, (u, v) => new V3((u - 0.5) * 1.6, 1.47 - v * 0.29 - 0.04 * Math.sin(Math.PI * u), (v - 0.5) * 1.3), (i, j) => ((i + j) % 4 === 0 ? BACHE_PASSEE : BACHE));
    }
  } else return null;
  return enGroupe(c);
}

/** Une installation affichée, avec son état (accessoires montés, meule qui fume). */
export class VueInstallation {
  readonly objet: THREE.Group;
  private donnees: InstallationVue;
  private fumee: Panache | null = null;
  private readonly ages: number[] = [];
  private braise: THREE.Mesh | null = null;
  private meule: THREE.Object3D | null = null;
  private dynamo: THREE.Object3D | null = null;
  private roue: THREE.Object3D | null = null;
  /** Le plateau et les pédales du pédalier, qui tournent avec la roue. */
  private manivelle: THREE.Object3D | null = null;
  private posees: THREE.Group | null = null;
  /** Le voyant du banc : vert quand une batterie est posée. */
  private voyant: THREE.Mesh | null = null;
  /** L'eau dans la bassine du récupérateur de pluie. */
  private eau: THREE.Mesh | null = null;
  /** Les objets remontés, posés sur la décharge (P-001). */
  private trouvailles: THREE.Group | null = null;
  private temps = 0;

  constructor(donnees: InstallationVue) {
    this.donnees = donnees;
    switch (donnees.type) {
      case "etabli":
        this.objet = etabli();
        break;
      case "abri":
        this.objet = abri();
        break;
      case "coffre":
        this.objet = coffre();
        break;
      case "charbonniere": {
        const c = charbonniere();
        this.objet = c.groupe;
        this.braise = c.braise;
        // La fumée de la charbonnière : épaisse et haute, visible de très loin (Book 02 §8 : 150 m).
        // Une seule colonne, un seul appel de dessin (panache.ts).
        this.fumee = new Panache(NB_FUMEE);
        for (let i = 0; i < NB_FUMEE; i++) this.ages.push((i / NB_FUMEE) * 7);
        this.objet.add(this.fumee.objet);
        break;
      }
      case "forge":
        this.objet = forge();
        break;
      case "pedalier": {
        const p = pedalier();
        this.objet = p.groupe;
        this.meule = p.meule;
        this.dynamo = p.dynamo;
        this.roue = p.roue;
        this.manivelle = p.manivelle;
        break;
      }
      case "banc_recharge": {
        const b = banc();
        this.objet = b.groupe;
        this.posees = b.posees;
        this.voyant = b.voyant;
        break;
      }
      case "panneau_solaire":
        this.objet = panneauSolaire();
        break;
      case "escabeau":
        this.objet = creerEscabeau();
        break;
      case "recuperateur_pluie": {
        const r = recuperateur();
        this.objet = r.groupe;
        this.eau = r.eau;
        break;
      }
      case "alarme_boites":
        this.objet = alarme();
        break;
      case "lit_branchages":
        this.objet = lit();
        break;
      case "decharge": {
        // La décharge (P-001) : son modèle est à part (rendu/decharge.ts).
        const d = decharge();
        this.objet = d.groupe;
        this.trouvailles = d.trouvailles;
        break;
      }
      default:
        this.objet = piquetProvisoire();
    }
    // Le niveau (Book 24) : des pièces en plus. La citerne couvre la bassine : son eau ne se voit plus.
    const pieces = piecesNiveau(donnees.type, donnees.niveau ?? 1);
    if (pieces) this.objet.add(pieces);
    if (this.eau && (donnees.niveau ?? 1) > 1) {
      this.eau.removeFromParent();
      this.eau = null;
    }
    this.objet.position.set(donnees.x, 0, donnees.z);
    // Le panneau regarde toujours le sud, quelle que soit la façon dont on l'a posé.
    this.objet.rotation.y = donnees.type === "panneau_solaire" ? 0 : donnees.o;
    // Même image, moins d'appels de dessin : on fond les morceaux de même matériau, sauf les pièces qui bougent,
    // s'allument ou se montrent une à une (2026-10-08).
    for (const o of [this.braise, this.meule, this.dynamo, this.roue, this.manivelle, this.posees, this.voyant, this.eau, this.trouvailles, this.fumee?.objet]) if (o) o.userData.intact = true;
    fusionnerStatique(this.objet);
    this.majEtat(donnees);
  }

  get id(): number {
    return this.donnees.id;
  }

  get vue(): InstallationVue {
    return this.donnees;
  }

  majEtat(donnees: InstallationVue): void {
    this.donnees = donnees;
    // Un objet lourd se déplace : sa place change, et dans les bras il n'est plus au sol.
    this.objet.position.set(donnees.x, 0, donnees.z);
    if (donnees.type !== "panneau_solaire") this.objet.rotation.y = donnees.o;
    this.objet.visible = !donnees.etat.portee;
    if (this.meule) this.meule.visible = donnees.etat.meule === true;
    if (this.dynamo) this.dynamo.visible = donnees.etat.dynamo === true;
    let chargees = 0;
    if (this.posees) {
      for (const b of this.posees.children) {
        b.visible = (donnees.etat.batteries?.[b.name as "petite_batterie"] ?? 0) > 0;
        if (b.visible) chargees++;
      }
    }
    if (this.voyant) (this.voyant.material as THREE.MeshBasicMaterial).color.setHex(chargees > 0 ? 0x5aff7a : 0x1f3324);
    if (this.trouvailles) majTrouvailles(this.trouvailles, Object.values(donnees.etat.contenu ?? {}).reduce((s, n) => s + (n ?? 0), 0));
    // La bassine se remplit avec la pluie (jusqu'à 5 L : le bord) ; elle s'évase, l'eau s'élargit en montant.
    if (this.eau) {
      const l = donnees.etat.litres ?? 0;
      const f = Math.min(1, l / 5);
      this.eau.visible = l > 0.05;
      this.eau.position.y = 0.02 + f * 0.24;
      this.eau.scale.setScalar(0.193 + f * 0.063);
    }
  }

  /** `maintenantServeur` : heure du serveur, pour savoir si la meule cuit encore. */
  animer(dt: number, maintenantServeur: number, nuit: number, enMarche: boolean): void {
    this.temps += dt;
    const cuit = this.donnees.type === "charbonniere" && this.donnees.etat.pretLe !== undefined && maintenantServeur < this.donnees.etat.pretLe;
    if (this.braise) (this.braise.material as THREE.MeshBasicMaterial).opacity = cuit ? (0.14 + Math.sin(this.temps * 1.7) * 0.06) * (0.4 + nuit) : 0;
    if (this.fumee) {
      // La fumée n'est pas éclairée : elle s'assombrit d'elle-même la nuit.
      COULEUR_FUMEE.copy(FUMEE_JOUR).lerp(FUMEE_NUIT, nuit);
      this.ages.forEach((age0, i) => {
        const age = (age0 + dt) % 7;
        this.ages[i] = age;
        const vie = age / 7;
        const opacite = cuit ? 0.5 * Math.sin(vie * Math.PI) * (1 - nuit * 0.45) : 0;
        this.fumee!.regler(i, Math.sin(age * 0.9 + i * 1.3) * 0.4 + vie * 1.2, 0.9 + vie * 8, Math.cos(age * 0.7 + i * 1.3) * 0.3, 0.9 + vie * 4, COULEUR_FUMEE, opacite);
      });
      this.fumee.objet.visible = cuit;
    }
    if (enMarche) {
      if (this.roue) this.roue.rotation.z -= dt * 9;
      // La meule est sur l'axe de la roue ; le plateau tourne moins vite (rapport de la chaîne).
      if (this.meule) this.meule.rotation.z -= dt * 9;
      if (this.manivelle) this.manivelle.rotation.z -= dt * 3.6;
    }
  }
}
