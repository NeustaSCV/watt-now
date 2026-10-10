// Les installations posées sur le terrain (É2) : établi, abri, et les installations de famille.
// Passe de finition (2026-10-08, Book 21 §5.2.5) : chaque installation est montée pièce par pièce (planches, perches
// ligaturées, pierres bosselées, toile tendue) dans un assemblage à couleurs par sommet (assemblage.ts) : bois et
// pierre nuancés facette par facette, bas des objets assombri près du sol (occlusion cuite). Le tout tient en 1 à 4
// appels de dessin par installation, ≈ 600 à 2 000 triangles (budget §5.3.4 : 1 000 à 3 000).

import { fusionnerStatique } from "./fusion.ts";
import { Panache } from "./panache.ts";
import { batterieVoiture, modulePanneau, roueVelo } from "./pieces.ts";
import { decharge, majTrouvailles } from "./decharge.ts";
import { modeleMetier } from "./metier/index.ts";
import { accessoiresForge, animerAccessoiresForge, majAccessoiresForge, piecesForgeVentilee, type AccessoiresForge } from "./metier/forge.ts";
import { creerArme } from "./personnage.ts";
import type { SourceLumiere } from "./lumieres.ts";
import { PORTEE_TORCHE, torcheAllumee, torcheConsumee } from "../../../commun/src/torche.ts";
import type { TypeObjet } from "../../../commun/src/objets.ts";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { InstallationVue } from "../../../commun/src/messages.ts";
import { PALETTE, aleatoire } from "./materiaux.ts";
import { ACIER, Assemblage, BOIS, type Finition, CORDE, NOIR, ROUILLE_SOMBRE, V, V3, X, Y, Z, bosseler, placer, rect, surface, tache, touffe } from "./assemblage.ts";

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
  // L'enclume du foyer (la pierre plate, ou l'enclume de dépanneur) et le bac de trempe sont des accessoires posés à
  // part (metier/forge.ts, plan 0.8) : ici, le tas de charbon de bois.
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

// ---------- L'eau (plan 0.8 §2.3, chantier 5) : le récupérateur de 5 L, le récupérateur à seau ----------

/** Le plastique blanc du bidon de 5 L, son bouchon bleu (comme son icône, icones-niveau1.ts). */
const BIDON_BLANC = 0xece8dc;
const BOUCHON_BLEU = 0x2f5fa4;
/** Le bidon d'huile moteur de la station (le repli du seau), rouge, sa bande jaune. */
const BIDON_HUILE = 0xc8362b;
const GALVA = 0xc9cdd1;
/** Les quatre sacs plastique de l'entonnoir : un blanc, un bleu pâle, un jaune de supermarché, un vert passé. */
const SACS = [0xe9e6dc, 0x9cc2d6, 0xe6d46a, 0xb9c8a8] as const;
const MOUILLE = new THREE.Color(0x6f8c9a);
/** L'eau recueillie : devinée à travers le plastique d'un bidon, ou sa surface au fond du seau. */
const MATERIAU_EAU_BIDON = new THREE.MeshStandardMaterial({ color: 0x4f7f98, roughness: 0.35, transparent: true, opacity: 0.45, depthWrite: false });

/** Une eau qui monte avec les litres. */
interface EauRecueillie {
  maillage: THREE.Mesh;
  genre: "bidon" | "seau";
  /** Ce qu'elle tient (L) : 5 pour un bidon, 10 pour le seau. */
  litres: number;
  /** Seau : le fond et le haut de l'eau possible (m), et le rayon à ces hauteurs. */
  bas: number;
  haut: number;
  rBas: number;
  rHaut: number;
}

/** Les dimensions d'un bidon de 5 L (m) : large, haut, épais ; le goulot au coin. */
const BIDON = { l: 0.22, h: 0.26, p: 0.14 } as const;

/**
 * Un bidon de 5 L en plastique, posé à (x, z), tourné de `ry` : le corps aux angles arrondis, la poignée moulée, le
 * goulot dans un coin (côté −x), une étiquette passée. `bouchon` : vissé, ou posé dans l'herbe à côté (il boit la pluie).
 * Rend la place de son goulot et son eau (un voile bleuté qui monte derrière le plastique).
 */
function bidon(c: Assemblage, x: number, z: number, ry: number, couleur: number, bouchon: "visse" | "pose", aleat: () => number): { goulot: THREE.Vector3; eau: EauRecueillie } {
  const { l, h, p } = BIDON;
  c.repere = new THREE.Matrix4().makeRotationY(ry).setPosition(x, 0, z);
  // Le corps : une boîte aux arêtes rabattues (on aplatit les coins), un peu gonflée, le fond en retrait.
  const corps = new THREE.BoxGeometry(l, h, p, 4, 4, 3);
  const pos = corps.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const py = pos.getY(i);
    const pz = pos.getZ(i);
    const bx = Math.abs(px) / (l / 2);
    const bz = Math.abs(pz) / (p / 2);
    const by = Math.abs(py) / (h / 2);
    const coin = Math.max(0, bx + bz - 1.55) * 0.5 + Math.max(0, bx + by - 1.6) * 0.35;
    // Les grandes faces bombent un peu, plus au milieu qu'en haut et en bas.
    const gonfle = 1 + 0.04 * (1 - by * by) * (1 - bx * bx * 0.5);
    pos.setXYZ(i, px * (1 - coin * 0.18), py, pz * (1 - coin * 0.25) * gonfle);
  }
  c.ajouter(bosseler(corps.translate(0, h / 2 + 0.004, 0), 0.002, aleat), couleur, "mat", 0.025);
  // L'épaule et la poignée moulée (côté +x) ; le jour de la poignée est un creux sombre.
  c.boite(couleur, "mat", 0.11, 0.022, 0.03, 0.045, h + 0.034, 0);
  for (const dx of [-0.005, 0.095]) c.boite(couleur, "mat", 0.018, 0.04, 0.03, dx, h + 0.014, 0);
  c.boite(0x9a968c, "mat", 0.08, 0.016, 0.031, 0.045, h + 0.012, 0);
  // Le goulot, côté −x, et son filet.
  const goulot = new V3(-l / 2 + 0.045, h + 0.004, 0);
  c.ajouter(placer(new THREE.CylinderGeometry(0.021, 0.025, 0.04, 9), goulot.x, goulot.y + 0.02, goulot.z), couleur, "mat", 0.02);
  c.ajouter(placer(new THREE.TorusGeometry(0.022, 0.003, 3, 9).rotateX(Math.PI / 2), goulot.x, goulot.y + 0.03, goulot.z), 0xd6d2c6, "mat");
  if (bouchon === "visse") c.ajouter(placer(new THREE.CylinderGeometry(0.026, 0.026, 0.024, 9), goulot.x, goulot.y + 0.048, goulot.z), couleur === BIDON_HUILE ? 0x1c1a18 : BOUCHON_BLEU, "mat", 0.03);
  else c.ajouter(placer(new THREE.CylinderGeometry(0.026, 0.026, 0.024, 9), -l / 2 - 0.06, 0.013, p / 2 + 0.07, 0.3, 0, Math.PI / 2 - 0.2), BOUCHON_BLEU, "mat", 0.03);
  // L'étiquette passée, sur la grande face : un papier délavé et sa bande (bleue pour l'eau de javel, jaune pour l'huile).
  const face = surface(new V3(0, 0, p / 2 + 0.001), X, Y, Z);
  c.plaque(rect(0.02, 0.12, 0.07, 0.06), face, couleur === BIDON_HUILE ? 0x2a2624 : 0xd6cfb8, "mat", 0.004);
  c.plaque(rect(0.02, 0.15, 0.07, 0.013), face, couleur === BIDON_HUILE ? 0xe8c440 : 0x6f9ab8, "mat", 0.005);
  c.repere = null;
  // L'eau : un voile qui monte du fond, un peu plus large que le corps (on la devine à travers le plastique).
  const voile = new THREE.Mesh(new THREE.BoxGeometry(l + 0.006, 1, p + 0.006).translate(0, 0.5, 0), MATERIAU_EAU_BIDON);
  voile.position.set(x, 0.008, z);
  voile.rotation.y = ry;
  voile.renderOrder = 2;
  const monde = goulot.clone().applyMatrix4(new THREE.Matrix4().makeRotationY(ry)).add(new V3(x, 0, z));
  return { goulot: monde, eau: { maillage: voile, genre: "bidon", litres: 5, bas: 0, haut: h * 0.94, rBas: 0, rHaut: 0 } };
}

/**
 * Le seau galvanisé de 10 L de la laiterie : tôle zinguée à reflets, deux nervures, le rebord roulé, l'anse de fil
 * couchée sur le côté. Posé à (x, y, z). Rend son eau (une surface qui monte et s'élargit).
 */
function seauGalvanise(c: Assemblage, x: number, y: number, z: number, aleat: () => number): EauRecueillie {
  const rB = 0.105;
  const rH = 0.138;
  const h = 0.25;
  const profil = [V(0, 0), V(rB, 0), V(rB + 0.004, 0.01), V(rH, h), V(rH + 0.008, h + 0.004), V(rH + 0.004, h + 0.012), V(rH - 0.006, h + 0.004), V(rB - 0.006, 0.012), V(0, 0.012)];
  c.ajouterDegrade(placer(bosseler(new THREE.LatheGeometry(profil, 16), 0.0025, aleat), x, y, z), (q) => {
    const dedans = Math.hypot(q.x - x, q.z - z) < rB + ((q.y - y) / h) * (rH - rB) - 0.003;
    if (dedans) return 0x8d949a;
    // Les fleurs de zinc : des facettes un peu plus claires ou plus sombres, au hasard.
    const f = Math.sin(q.x * 91 + q.y * 57) * Math.cos(q.z * 83 - q.y * 31);
    return f > 0.55 ? 0xdde1e4 : f < -0.6 ? 0xaab0b5 : GALVA;
  }, "tole");
  for (const t of [0.3, 0.68]) {
    const r = rB + t * (rH - rB) + 0.004;
    c.ajouter(placer(new THREE.TorusGeometry(r, 0.0045, 3, 16).rotateX(Math.PI / 2), x, y + t * h, z), 0xb0b6bb, "tole");
  }
  // Les oreilles et l'anse de fil, couchée vers l'arrière.
  for (const s of [-1, 1]) c.boite(0xaab0b5, "tole", 0.012, 0.03, 0.022, x + s * (rH + 0.004), y + h - 0.02, z);
  const anse = new THREE.TorusGeometry(rH + 0.008, 0.0035, 3, 14, Math.PI);
  anse.rotateX(-1.15);
  c.ajouter(placer(anse, x, y + h - 0.012, z), 0x6b6862, "metal");
  c.ajouter(placer(new THREE.CylinderGeometry(0.012, 0.012, 0.06, 6).rotateZ(Math.PI / 2), x, y + h - 0.012 + Math.cos(1.15) * (rH + 0.008), z - Math.sin(1.15) * (rH + 0.008)), BOIS.moyen, "mat");
  const disque = new THREE.Mesh(new THREE.CircleGeometry(1, 16).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x5f8fa8, roughness: 0.08, metalness: 0.1 }));
  disque.position.set(x, y + 0.02, z);
  return { maillage: disque, genre: "seau", litres: 10, bas: y + 0.014, haut: y + h * 0.93, rBas: rB - 0.004, rHaut: rH - 0.008 };
}

/**
 * L'entonnoir de sacs plastique : quatre sacs fendus, cousus bord à bord et tendus sur quatre piquets fourchus (une
 * corde fait le tour), leurs anses nouées aux piquets ; le creux mouillé, plus sombre ; au centre, un sac roulé en
 * goulotte, ficelé, qui descend vers ce qui recueille (`vers` : un ou deux goulots).
 */
function entonnoirDeSacs(c: Assemblage, vers: readonly THREE.Vector3[], aleat: () => number): void {
  const coins: [number, number, number][] = [[-0.5, -0.5, 0.98], [0.5, -0.5, 0.98], [-0.5, 0.5, 0.86], [0.5, 0.5, 0.86]];
  for (const [x, z, h] of coins) {
    piquetFourchu(c, x * 1.07, z * 1.07, h + 0.05, 0.03, aleat);
    touffe(c, x * 1.07, z * 1.07, aleat, 2, 0.22);
  }
  const hauteur = (u: number, v: number) => {
    const bord = 0.98 * (1 - v) + 0.86 * v;
    const r = Math.hypot(u - 0.5, v - 0.5) / 0.5;
    const creux = 0.34 * Math.max(0, 1 - r) ** 1.2;
    const affaisse = 0.05 * (Math.sin(Math.PI * u) + Math.sin(Math.PI * v));
    // Les plis du plastique, froissé puis tendu.
    const plis = 0.009 * Math.sin(u * 37 + v * 11) + 0.006 * Math.sin(v * 29 - u * 5);
    return bord - creux - affaisse + plis;
  };
  const n = 12;
  const point = (u: number, v: number) => new V3((u - 0.5) * 1.0, hauteur(u, v), (v - 0.5) * 1.0);
  const couleur = new THREE.Color();
  toile(
    c,
    n,
    n,
    point,
    (i, j) => {
      const sac = SACS[(i < n / 2 ? 0 : 1) + (j < n / 2 ? 0 : 2)]!;
      couleur.setHex(sac);
      // La couture, où deux sacs se chevauchent : un pli plus sombre.
      if (i === n / 2 - 1 || i === n / 2 || j === n / 2 - 1 || j === n / 2) couleur.multiplyScalar(0.9);
      // Le creux mouillé, où l'eau ruisselle.
      const r = Math.hypot(i + 0.5 - n / 2, j + 0.5 - n / 2) / (n / 2);
      couleur.lerp(MOUILLE, Math.max(0, 0.55 - r) * 0.9);
      // Quelques facettes qui brillent (le film plastique accroche la lumière).
      if ((i * 7 + j * 3) % 11 === 0) couleur.offsetHSL(0, -0.05, 0.08);
      return couleur.getHex();
    },
    (i, j) => (i === n / 2 - 1 || i === n / 2) && (j === n / 2 - 1 || j === n / 2),
  );
  // Les anses des sacs, nouées aux piquets, et la corde qui fait le tour.
  for (const [k, [x, z, h]] of coins.entries()) {
    const coin = new V3(x, h - 0.02, z);
    for (const s of [-1, 1]) c.ajouter(placer(new THREE.TorusGeometry(0.03, 0.007, 3, 6), x * 1.02 + s * 0.02, h - 0.01, z * 1.02, 0.5, s * 0.7, 0.3), SACS[k]!, "toile", 0.04);
    c.ajouter(placer(bosseler(new THREE.IcosahedronGeometry(0.022, 0), 0.006, aleat), x * 1.04, h - 0.015, z * 1.04), SACS[k]!, "toile", 0.05);
    cordePendante(c, coin, new V3(x * 1.07, h + 0.02, z * 1.07), 0.004, 0.005);
    const suivant = coins[[1, 3, 0, 2][k]!]!;
    cordePendante(c, new V3(x * 1.07, h + 0.015, z * 1.07), new V3(suivant[0] * 1.07, suivant[2] + 0.015, suivant[1] * 1.07), 0.03, 0.005);
  }
  // La goulotte : un sac roulé et ficelé, du creux jusqu'au goulot (fendue en deux pour deux bidons).
  const fond = point(0.5, 0.5);
  const col = new V3(0, fond.y - 0.04, 0);
  c.perche(new V3(0, fond.y + 0.02, 0), col, 0.06, SACS[0], "toile", 7, 0.035, 0.04);
  c.ligature(col.clone().add(new V3(0, 0.012, 0)), Y, 0.034, CORDE);
  for (const v of vers) {
    const bout = v.clone().add(new V3(0, 0.035, 0));
    const milieu = col.clone().lerp(bout, 0.5).add(new V3((aleat() - 0.5) * 0.02, 0, (aleat() - 0.5) * 0.02));
    c.perche(col, milieu, 0.033, SACS[0], "toile", 6, 0.026, 0.05);
    c.perche(milieu, bout, 0.026, 0xdcd8cc, "toile", 6, 0.018, 0.05);
    // Les gouttes qui tombent dans le goulot.
    for (let i = 0; i < 2; i++) c.ajouter(placer(new THREE.OctahedronGeometry(0.008, 0).scale(1, 1.8, 1), bout.x, bout.y - 0.02 - i * 0.03, bout.z), 0x9ec4d8, "verre");
  }
}

/**
 * Le récupérateur de pluie (plan 0.8 §2.3, Book 21) : l'entonnoir de sacs plastique sur ses piquets, et dessous, ce qui
 * recueille. Niveau 1 : le bidon de 5 L de la ruine, débouché. Niveau 2 : le seau galvanisé de 10 L, calé sur deux
 * branches, le bidon bouché à côté ; ou, par le repli, le bidon et le bidon d'huile rincé, côte à côte.
 */
function recuperateur(niveau: number, etat: InstallationVue["etat"]): { groupe: THREE.Group; eaux: EauRecueillie[] } {
  const c = new Assemblage(61 + niveau);
  c.occlusion = 0.3;
  const aleat = aleatoire(61 + niveau);
  const eaux: EauRecueillie[] = [];
  // La terre piétinée et mouillée sous l'entonnoir.
  c.plaque(tache(0, 0, 0.42, 0.38, aleat, 10), surface(new V3(0, 0, 0), X, Z, Y), 0x4e5a3a, "mat", 0.01);
  const repli = niveau >= 2 && (etat.payes ?? []).some((p) => (p.bidon_huile ?? 0) > 0);
  if (niveau <= 1) {
    const b = bidon(c, BIDON.l / 2 - 0.045, 0, 0, BIDON_BLANC, "pose", aleat);
    eaux.push(b.eau);
    entonnoirDeSacs(c, [b.goulot], aleat);
  } else if (repli) {
    const blanc = bidon(c, -0.135, 0.02, Math.PI, BIDON_BLANC, "pose", aleat);
    const rouge = bidon(c, 0.135, -0.02, 0, BIDON_HUILE, "pose", aleat);
    eaux.push(blanc.eau, rouge.eau);
    entonnoirDeSacs(c, [blanc.goulot, rouge.goulot], aleat);
  } else {
    // Deux branches couchées, le seau calé dessus (de niveau, sur la terre en pente).
    for (const s of [-1, 1]) rondin(c, new V3(-0.26, 0.022, s * 0.07), new V3(0.26, 0.026, s * 0.075), 0.022);
    eaux.push(seauGalvanise(c, 0, 0.044, 0, aleat));
    entonnoirDeSacs(c, [new V3(0, 0.27, 0)], aleat);
    // Le bidon de 5 L, bouché, à côté : on y transvase.
    bidon(c, 0.3, -0.3, 0.7, BIDON_BLANC, "visse", aleat);
  }
  const groupe = enGroupe(c);
  for (const e of eaux) groupe.add(e.maillage);
  return { groupe, eaux };
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
/** Un modèle du registre des métiers, rangé dans un groupe (null : pas de modèle). */
function enGroupeMetier(o: THREE.Object3D | null): THREE.Group | null {
  if (!o) return null;
  if ((o as THREE.Group).isGroup) return o as THREE.Group;
  const g = new THREE.Group();
  g.add(o);
  return g;
}

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

// ---------- Le niveau 1 (plan 0.8, chantier 6) : abri fermé, établi à étau, râtelier, torche plantée ----------

const JUTE = 0xb8a47c;
const JUTE_SOMBRE = 0x9c8862;
const JUTE_CLAIR = 0xcdbb94;
const TAMPON = 0x3f5c94;
const TAMPON_ROUGE = 0xa8402e;

/**
 * L'abri fermé : une toile de jute (des sacs à farine décousus, recousus en grand) tendue côté vent, clouée à une perche
 * et lestée de pierres ; de l'autre côté, un rideau de jute relevé et noué (l'entrée). Le repli : un patchwork de
 * chiffons et de sacs plastique cousus, plus mince. Sous l'abri, la couverture de chiffons.
 */
function abriFerme(c: Assemblage, aleat: () => number, repli: boolean): void {
  // Le toit de l'appentis : de la faîtière (z = -0,5 ; y = 1,45) au sol (z = 0,95).
  const toit = (z: number) => Math.max(0, 1.47 * (1 - (z + 0.5) / 1.45));
  // Le repli : des sacs plastique blancs et bleus, des chiffons passés, cousus en carrés.
  const tonRepli = [0xdedbd2, 0x4d74a8, 0x9a5a48, PALETTE.toileEcrue, 0xc9c6bd, 0x6a7f96];
  // La jute : une trame claire, des lés plus sombres d'un sac à l'autre, quelques fils tirés.
  const ton = (i: number, j: number) => (repli ? tonRepli[(Math.floor(i / 3) * 3 + Math.floor(j / 2)) % 6]! : Math.floor(i / 4) % 2 === 1 && Math.floor(j / 3) % 2 === 0 ? JUTE_SOMBRE : (i * 7 + j * 3) % 11 === 0 ? JUTE_CLAIR : JUTE);
  // Côté vent : la toile ferme tout le pignon, un peu creusée par le vent, le bas replié au sol.
  const x = -1.36;
  toile(c, 16, 9, (u, v) => {
    const z = -0.52 + u * 1.5;
    const h = toit(z) * 0.985 + 0.02;
    return new V3(x + 0.05 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v) + 0.01 * Math.sin(u * 13 + v * 7), v * h - 0.01, z);
  }, ton);
  // Les coutures des sacs (des lignes plus sombres) et deux tampons de meunier délavés.
  if (!repli) {
    // Les coutures entre les sacs : un gros fil sombre, en long et en travers.
    for (const z of [-0.15, 0.22]) c.perche(new V3(x - 0.004, 0.01, z), new V3(x - 0.004, toit(z) - 0.03, z), 0.007, 0x5a4630, "mat", 3);
    for (const y of [0.33, 0.7]) c.perche(new V3(x - 0.004, y, -0.5), new V3(x - 0.004, y, 0.95 - (y / 1.47) * 1.45), 0.007, 0x5a4630, "mat", 3);
    // Les tampons du meunier, des deux faces : un ovale bleu barré d'une bande rouge.
    for (const [z, y] of [[-0.32, 0.82], [0.02, 0.45]] as const) {
      // La toile se creuse : le tampon suit le creux, à quelques millimètres de chaque face.
      const creux = 0.05 * Math.sin(Math.PI * ((z + 0.52) / 1.5)) * Math.sin(Math.PI * (y / (toit(z) * 0.985 + 0.02)));
      for (const sens of [1, -1]) {
        const pignon = surface(new V3(x + creux, 0, 0), new V3(0, 0, sens), Y, new V3(sens, 0, 0));
        c.plaque(tache(z * sens, y, 0.13, 0.08, aleat, 10), pignon, TAMPON, "toile", 0.008);
        c.plaque(rect(z * sens, y, 0.1, 0.015), pignon, TAMPON_ROUGE, "toile", 0.011);
      }
    }
  }
  // La perche de bord, clouée, et les pierres qui lestent le bas.
  c.perche(new V3(x - 0.03, toit(-0.5) + 0.02, -0.5), new V3(x - 0.03, 0.02, 0.97), 0.022, BOIS.ecorce, "mat", 5);
  for (let k = 0; k < 6; k++) {
    const z = -0.45 + k * 0.26;
    c.ajouter(placer(new THREE.CylinderGeometry(0.008, 0.008, 0.012, 6).rotateZ(Math.PI / 2), x - 0.055, toit(z) * 0.5 + 0.05, z), 0x3a3836, "metal");
    caillou(c, x + 0.08, 0.05, z, 0.08 + aleat() * 0.03, aleat, aleat() < 0.5 ? PALETTE.pierre : PALETTE.pierreSombre, 0.5);
  }
  // L'entrée : un rideau relevé, roulé et noué à la perche, qui pend sur un tiers.
  const xe = 1.36;
  toile(c, 3, 5, (u, v) => {
    const z = -0.5 + u * 0.55;
    return new V3(xe + 0.03 * Math.sin(v * 9), toit(z) - 0.02 - v * toit(z) * 0.8, z + 0.04 * Math.sin(Math.PI * v));
  }, ton);
  c.perche(new V3(xe + 0.02, 0.5, 0.06), new V3(xe + 0.02, 0.62, 0.06), 0.06, repli ? 0x3e6db0 : JUTE_SOMBRE, "toile", 6);
  c.ligature(new V3(xe + 0.02, 0.56, 0.06), Y, 0.065);
  // La couverture de chiffons cousus sur le lit.
  const tons = [0x8f3a22, PALETTE.toileEcrue, 0x5a6f8a, PALETTE.vertLaine];
  for (let k = 0; k < 6; k++) c.boite(tons[k % 4]!, "toile", 0.3, 0.03, 0.3, -0.45 + (k % 3) * 0.3, 0.2, -0.02 + Math.floor(k / 3) * 0.3);
}

/** L'étau d'établi : un corps de fonte peint (vert d'atelier écaillé), deux mors d'acier striés, la vis et sa barre. */
function etau(c: Assemblage): void {
  const y = 0.89;
  const x = 0.55;
  const z = 0.27;
  const FONTE = 0x3d5a4e;
  const ECAILLE = 0x5c5953;
  // La semelle boulonnée au plateau, et ses quatre boulons.
  c.boite(FONTE, "metal", 0.2, 0.025, 0.16, x, y + 0.012, z - 0.04);
  for (const [dx, dz] of [[-0.08, -0.1], [0.08, -0.1], [-0.08, 0.02], [0.08, 0.02]] as const) c.ajouter(placer(new THREE.CylinderGeometry(0.011, 0.011, 0.02, 6), x + dx, y + 0.033, z + dz), 0x2a2826, "metal");
  // Le mors fixe (le corps), haut, et le mors mobile qui avance sur sa glissière.
  c.boite(FONTE, "metal", 0.17, 0.11, 0.07, x, y + 0.08, z - 0.06);
  c.boite(ECAILLE, "metal", 0.06, 0.04, 0.05, x - 0.05, y + 0.1, z - 0.05);
  c.boite(0x2e3a35, "metal", 0.07, 0.05, 0.18, x, y + 0.055, z + 0.04);
  c.boite(FONTE, "metal", 0.17, 0.11, 0.06, x, y + 0.08, z + 0.07);
  // Les mors d'acier, rapportés, striés.
  for (const dz of [-0.022, 0.037]) {
    c.boite(0x8a8780, "metal", 0.17, 0.035, 0.012, x, y + 0.122, z + dz);
    for (let k = 0; k < 6; k++) c.boite(0x5a5853, "metal", 0.004, 0.034, 0.013, x - 0.07 + k * 0.028, y + 0.122, z + dz);
  }
  // Une chute de bois serrée entre les mors : on voit à quoi il sert.
  planche(c, BOIS.coupe, 0.28, 0.08, 0.045, x + 0.04, y + 0.15, z + 0.008, 0, 0.05, 0);
  // La vis, son écrou, la barre de serrage qui pend en biais.
  c.perche(new V3(x, y + 0.07, z + 0.1), new V3(x, y + 0.07, z + 0.2), 0.012, 0x8a8780, "metal", 6);
  c.ajouter(placer(new THREE.SphereGeometry(0.022, 6, 4), x, y + 0.07, z + 0.2), 0x55524d, "metal");
  c.perche(new V3(x - 0.02, y + 0.15, z + 0.2), new V3(x + 0.02, y - 0.03, z + 0.2), 0.008, 0xa9aba8, "metal", 5);
  for (const t of [0, 1]) c.ajouter(placer(new THREE.SphereGeometry(0.014, 5, 3), x - 0.02 + t * 0.04, y + 0.15 - t * 0.18, z + 0.2), 0x55524d, "metal");
}

/** Le serre-joint de fortune (le repli) : deux branches serrées d'une corde qu'un bâton tord, à l'angle du plateau. */
function serreJoint(c: Assemblage, aleat: () => number): void {
  const y = 0.89;
  const x = 0.55;
  const z = 0.27;
  for (const dy of [0.07, -0.09]) c.perche(new V3(x - 0.18, y + dy, z), new V3(x + 0.2, y + dy + (aleat() - 0.5) * 0.02, z), 0.02, BOIS.ecorce, "mat", 5);
  for (const dx of [-0.12, 0.14]) {
    corde(c, [new V3(x + dx, y + 0.09, z - 0.015), new V3(x + dx + 0.01, y, z - 0.03), new V3(x + dx, y - 0.11, z - 0.015), new V3(x + dx, y - 0.11, z + 0.02), new V3(x + dx, y + 0.09, z + 0.02)], 0.009, CORDE, 10);
    c.perche(new V3(x + dx - 0.07, y - 0.01, z + 0.03), new V3(x + dx + 0.08, y + 0.01, z + 0.03), 0.008, BOIS.moyen, "mat", 4);
  }
}

/** Les silhouettes de rechange au râtelier (un outil qui ne se tient pas comme une arme : la scie, la clé…). */
function outilRange(objet: TypeObjet): THREE.Group {
  const c = new Assemblage(objet.length * 7);
  const tete = 0x6b6862;
  if (/scie/.test(objet)) {
    // Une égoïne : la lame et sa poignée de bois.
    c.boite(0xa9aba8, "metal", 0.002, 0.11, 0.42, 0, 0.03, 0.3);
    c.boite(BOIS.clair, "mat", 0.025, 0.09, 0.11, 0, 0.0, 0.04);
  } else if (/cle|tournevis|lime/.test(objet)) {
    c.boite(tete, "metal", 0.008, 0.025, 0.24, 0, 0, 0.1);
    c.boite(tete, "metal", 0.01, 0.05, 0.04, 0, 0, 0.23);
  } else if (/serre_joint/.test(objet)) {
    for (const y of [-0.04, 0.04]) c.perche(new V3(0, y, 0), new V3(0, y, 0.4), 0.014, BOIS.ecorce, "mat", 5);
    c.ligature(new V3(0, 0, 0.3), Z, 0.05);
  } else {
    // Un manche et une tête : un outil quelconque.
    c.perche(new V3(0, 0, -0.05), new V3(0, 0, 0.42), 0.014, BOIS.clair, "mat", 5);
    c.boite(tete, "metal", 0.03, 0.09, 0.05, 0, 0.02, 0.42);
  }
  return c.groupe();
}

/** Le râtelier à outils : deux piquets fourchus, deux traverses, des chevilles, un petit auvent de planches. */
function ratelier(): { groupe: THREE.Group; outils: THREE.Group } {
  const c = new Assemblage(61);
  c.occlusion = 0.3;
  const aleat = aleatoire(61);
  for (const x of [-0.62, 0.62]) piquetFourchu(c, x, 0, 1.45, 0.045, aleat, x * -0.015);
  for (const [y, r] of [[1.32, 0.035], [0.42, 0.03]] as const) {
    rondin(c, new V3(-0.78, y, 0), new V3(0.78, y + (aleat() - 0.5) * 0.02, 0), r);
    for (const x of [-0.62, 0.62]) c.ligature(new V3(x, y, 0), X, r + 0.012);
  }
  // Les chevilles où pendent les outils, plantées dans la traverse haute.
  for (let k = 0; k < 5; k++) c.perche(new V3(-0.48 + k * 0.24, 1.3, 0.02), new V3(-0.48 + k * 0.24, 1.33, 0.13), 0.011, BOIS.coupe, "mat", 4);
  // Un fond de planches de récupération, clouées aux traverses : les outils s'y détachent, chacun à sa place.
  // Du bois gris de pluie, clair : les outils sombres s'y lisent de loin.
  const tons = [0xb0a48e, 0xa2927a, 0xbcae96, 0x9f9584, 0xb4a38a];
  for (let k = 0; k < 5; k++) planche(c, tons[k]!, 0.22, 0.86 + (k % 2) * 0.05, 0.02, -0.48 + k * 0.24, 0.9, -0.05, 0, 0, (aleat() - 0.5) * 0.03);
  // Le nom de chaque outil, à la craie, sous sa cheville : des traits pâles.
  for (let k = 0; k < 5; k++) c.boite(0xf0ece2, "mat", 0.07, 0.01, 0.004, -0.48 + k * 0.24, 1.22, -0.038);
  touffe(c, -0.62, 0.1, aleat, 3, 0.25);
  touffe(c, 0.7, -0.05, aleat, 2, 0.2);
  const groupe = enGroupe(c);
  const outils = new THREE.Group();
  outils.userData.intact = true;
  groupe.add(outils);
  return { groupe, outils };
}

/** Les outils rangés au râtelier, pendus tête en haut aux chevilles (au plus cinq se voient). */
function rangerOutils(outils: THREE.Group, contenu: Partial<Record<string, number>>): void {
  outils.clear();
  const types = Object.keys(contenu).filter((t) => (contenu[t] ?? 0) > 0).slice(0, 5);
  types.forEach((t, k) => {
    const type = t.split("#")[0] as TypeObjet;
    const o = creerArme(type) ?? outilRange(type);
    // Le manche vers le bas, la tête accrochée à la cheville (repère de la main : manche selon +z, tête selon +y).
    o.rotation.set(-Math.PI / 2, 0, 0);
    const pivot = new THREE.Group();
    pivot.add(o);
    // On suspend chaque outil par sa tête : le haut de l'objet à la cheville.
    const boite = new THREE.Box3().setFromObject(pivot);
    pivot.position.set(-0.48 + k * 0.24, 1.36 - boite.max.y, 0.09);
    pivot.rotation.z = (k % 2 ? 1 : -1) * 0.04;
    outils.add(pivot);
  });
}

/** Une flamme de torche : un fuseau vrillé (repère : base à l'origine). */
function flammeTorche(hauteur: number, largeur: number, vrille: number): THREE.BufferGeometry {
  const profil = [V(0, 0), V(largeur * 0.85, hauteur * 0.08), V(largeur, hauteur * 0.25), V(largeur * 0.7, hauteur * 0.5), V(largeur * 0.3, hauteur * 0.8), V(0, hauteur)];
  const g = new THREE.LatheGeometry(profil, 6);
  const p = g.getAttribute("position");
  for (let i = 0; i < p.count; i++) {
    const h = p.getY(i) / hauteur;
    const a = vrille * h;
    const x = p.getX(i);
    const z = p.getZ(i);
    p.setXYZ(i, x * Math.cos(a) - z * Math.sin(a) + 0.04 * h * h * hauteur, p.getY(i), x * Math.sin(a) + z * Math.cos(a));
  }
  g.computeVertexNormals();
  return g;
}

/** La hauteur de la tête de la torche (la flamme en part). */
const TETE_TORCHE = 1.42;

/**
 * La torche plantée : une branche droite plantée un peu de biais, un collier de pierres au pied, la tête entourée d'un
 * chiffon gras ligaturé de fil de fer. Deux têtes, montrées selon l'état : le chiffon jauni de graisse (neuve, puis
 * allumée sous sa flamme), ou le moignon calciné (consumée). La flamme : trois langues en mélange additif.
 */
function torche(): { groupe: THREE.Group; neuve: THREE.Group; consumee: THREE.Group; flammes: THREE.Group; matFlamme: THREE.MeshBasicMaterial } {
  const c = new Assemblage(81);
  c.occlusion = 0.25;
  const aleat = aleatoire(81);
  const tete = new V3(0.05, TETE_TORCHE - 0.12, 0.02);
  c.perche(new V3(0, -0.08, 0), tete, 0.028, BOIS.ecorce, "mat", 6, 0.024, 0.07);
  // Un nœud et un rameau coupé, pour que la branche reste une branche.
  c.perche(new V3(0.02, 0.62, 0.008), new V3(0.09, 0.7, 0.03), 0.01, BOIS.ecorce, "mat", 4, 0.006);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + aleat() * 0.4;
    caillou(c, Math.cos(a) * 0.13, 0.03, Math.sin(a) * 0.13, 0.055 + aleat() * 0.02, aleat, i % 2 ? PALETTE.pierre : PALETTE.pierreSombre, 0.55);
  }
  c.plaque(tache(0, 0, 0.16, 0.14, aleat, 7), surface(new V3(0, 0, 0), X, Z, Y), TERRE_REMUEE, "mat", 0.006);
  const groupe = enGroupe(c);

  // Le chiffon gras : un manchon renflé, enroulé en spirale, ligaturé de fil de fer, une coulure de graisse figée.
  const n = new Assemblage(82);
  const manchon = new THREE.CylinderGeometry(0.052, 0.042, 0.2, 8, 4).translate(0, 0.1, 0);
  n.ajouterDegrade(placer(bosseler(manchon, 0.006, aleat), tete.x, tete.y - 0.02, tete.z, 0, 0, -0.035), (p) => (Math.sin(p.y * 70 + Math.atan2(p.z - tete.z, p.x - tete.x) * 2) > 0.3 ? 0x9a8150 : 0xc9b483), "toile");
  for (const dy of [0.02, 0.15]) n.ligature(new V3(tete.x + dy * 0.035, tete.y + dy, tete.z), Y, 0.05, 0x6b6862);
  n.perche(new V3(tete.x + 0.03, tete.y - 0.02, tete.z + 0.035), new V3(tete.x + 0.025, tete.y - 0.1, tete.z + 0.04), 0.006, 0xd8c890, "mat", 4, 0.002);
  const neuve = enGroupe(n);

  // Le moignon calciné : le bout charbonneux, des cendres au pied.
  const k = new Assemblage(83);
  k.ajouterDegrade(placer(bosseler(new THREE.CylinderGeometry(0.036, 0.03, 0.14, 7, 3).translate(0, 0.07, 0), 0.008, aleat), tete.x, tete.y - 0.02, tete.z, 0, 0, -0.035), (p) => (p.y > tete.y + 0.04 ? 0x1c1916 : 0x2c2622));
  for (let i = 0; i < 4; i++) k.plaque(tache((aleat() - 0.5) * 0.3, (aleat() - 0.5) * 0.3, 0.035, 0.02, aleat, 5), surface(new V3(0, 0.004, 0), X, Z, Y), 0x8a8580, "mat", 0.01);
  const consumee = enGroupe(k);

  // La flamme : un cœur jaune pâle, deux langues orangées, une lueur rouge autour.
  const matFlamme = new THREE.MeshBasicMaterial({ color: 0xff9a3c, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const coeur = new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
  const rouge = new THREE.MeshBasicMaterial({ color: 0xc8401a, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
  const flammes = new THREE.Group();
  for (const [h, l, v, mat, a] of [[0.32, 0.045, 1.3, coeur, 0], [0.42, 0.06, -1.5, matFlamme, 0.5], [0.36, 0.055, 1.7, matFlamme, 3.1], [0.5, 0.09, 0.8, rouge, 0]] as const) {
    const m = new THREE.Mesh(flammeTorche(h, l, v), mat);
    m.position.set(Math.cos(a) * 0.012, 0, Math.sin(a) * 0.012);
    m.renderOrder = 3;
    flammes.add(m);
  }
  flammes.position.set(tete.x + 0.006, tete.y + 0.16, tete.z);
  for (const o of [neuve, consumee, flammes]) {
    o.userData.intact = true;
    groupe.add(o);
  }
  return { groupe, neuve, consumee, flammes, matFlamme };
}

/** Ce qu'un niveau ajoute au modèle de base. Null : rien à ajouter. */
function piecesNiveau(type: InstallationVue["type"], niveau: number, etat: InstallationVue["etat"] = {}): THREE.Group | null {
  if (niveau <= 1) return null;
  // La forge ventilée (Book 25 §9.3) : ses pièces sont dessinées avec les autres modèles des Charbonniers.
  if (type === "forge") return piecesForgeVentilee();
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
    if (niveau >= 3) abriFerme(c, aleat, (etat.payes?.[1]?.toile_jute ?? 0) === 0 && (etat.payes?.[1]?.chiffons ?? 0) > 0);
  } else if (type === "etabli") {
    // Établi à étau : l'étau du rhabilleur boulonné à l'angle ; ou le serre-joint de fortune (le repli).
    if ((etat.payes?.[0]?.etau ?? 0) > 0) etau(c);
    else serreJoint(c, aleat);
  } else if (type === "coffre") {
    // Coffre cerclé : les feuillards des barils du Moulin (ou la barre martelée en bandes), cloués tout autour du
    // coffre aux deux bouts et au milieu, des coins de fer, le fond doublé. Les têtes de clous accrochent la lumière.
    const barre = (etat.payes?.[0]?.barre_metal ?? 0) > 0;
    const fer = barre ? 0x4a4744 : 0x5f5b55;
    for (const x of [-0.4, 0, 0.4]) {
      const large = x === 0 ? 0.045 : 0.06;
      for (const s of [-1, 1]) {
        c.boite(fer, "metal", large, 0.42, 0.008, x, 0.23, s * 0.281);
        c.boite(fer, "metal", 0.008, 0.42, large, s * 0.436, 0.23, x * 0.6);
        for (const y of [0.08, 0.23, 0.38]) c.ajouter(placer(new THREE.SphereGeometry(0.013, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2).rotateX((s * Math.PI) / 2), x, y, s * 0.285), 0x2a2826, "metal");
      }
      // Sur le couvercle bombé, le feuillard suit l'arrondi (comme ceux du coffre simple).
      const R = 0.34;
      const yc = 0.43 - R * Math.cos(0.9);
      for (let k = 0; k < 5; k++) {
        const a = (k - 2) * 0.36;
        c.boite(k === 2 && x !== 0 ? ROUILLE_SOMBRE : fer, "metal", large, 0.007, 0.13, x, yc + Math.cos(a) * (R + 0.016), Math.sin(a) * (R + 0.016), a, 0, 0);
      }
      // Un peu de rouille où le feuillard a été plié.
      if (!barre) for (const s of [-1, 1]) c.boite(ROUILLE_SOMBRE, "metal", large * 1.02, 0.03, 0.009, x, 0.44, s * 0.282);
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

/** Les pièces de métier (rendu/metier/) qu'on monte sur un meuble, par type : chacune se montre selon l'état. */
const PIECES_MONTEES: Partial<Record<InstallationVue["type"], readonly string[]>> = {
  pedalier: ["pedalier_meule_fine", "pedalier_soufflet", "pedalier_alternateur", "pedalier_batterie"],
  banc_recharge: ["banc_panneau"],
};

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
  /** L'eau du récupérateur de pluie : dans le bidon, les deux bidons, ou le seau (plan 0.8, chantier 5). */
  private eaux: EauRecueillie[] = [];
  /** Les objets remontés, posés sur la décharge (P-001). */
  private trouvailles: THREE.Group | null = null;
  /** Le redresseur de fûts monté sur l'établi (Book 25 §9.3). */
  private redresseur: THREE.Object3D | null = null;
  /** La forge : l'enclume posée, le bac de trempe, le ventilateur (Book 25 §9.3). */
  private forge: AccessoiresForge | null = null;
  /** Les pièces de métier qui suivent l'état (`userData.majEtat`) ou qui bougent (`userData.animer`). */
  private readonly suivis: THREE.Object3D[] = [];
  private readonly animes: THREE.Object3D[] = [];
  /** Plan 0.8, chantier 6 : les outils pendus au râtelier, et ce qu'ils étaient (pour ne refaire qu'au changement). */
  private outils: THREE.Group | null = null;
  private outilsVus = "";
  /** La torche plantée : ses deux têtes, sa flamme. */
  private torche: ReturnType<typeof torche> | null = null;
  private temps = 0;

  constructor(donnees: InstallationVue) {
    this.donnees = donnees;
    switch (donnees.type) {
      case "etabli": {
        this.objet = etabli();
        // Le redresseur de fûts, au bout de l'établi : il ne se montre qu'une fois monté.
        this.redresseur = modeleMetier("redresseur_futs", "sol");
        if (this.redresseur) {
          this.redresseur.position.set(1.05, 0, 0.05);
          this.objet.add(this.redresseur);
        }
        break;
      }
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
        this.forge = accessoiresForge();
        this.objet.add(this.forge.groupe);
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
        // Chaque niveau a son modèle entier (le bidon, puis le seau ou les deux bidons du repli).
        const r = recuperateur(donnees.niveau ?? 1, donnees.etat);
        this.objet = r.groupe;
        this.eaux = r.eaux;
        break;
      }
      case "alarme_boites":
        this.objet = alarme();
        break;
      case "lit_branchages":
        this.objet = lit();
        break;
      case "ratelier_outils": {
        const r = ratelier();
        this.objet = r.groupe;
        this.outils = r.outils;
        break;
      }
      case "torche_plantee":
        this.torche = torche();
        this.objet = this.torche.groupe;
        break;
      case "decharge": {
        // La décharge (P-001) : son modèle est à part (rendu/decharge.ts).
        const d = decharge();
        this.objet = d.groupe;
        this.trouvailles = d.trouvailles;
        break;
      }
      default:
        // Les installations du métier (Book 25) : leur modèle vient du registre des métiers, sinon un piquet provisoire.
        this.objet = enGroupeMetier(modeleMetier(donnees.type, "sol")) ?? piquetProvisoire();
    }
    // Les pièces de métier montées sur un meuble (ventilateur à manivelle, meule fine, alternateur et batterie du
    // pédalier, panneau et jauge du banc solaire), montrées selon son état (rendu/metier/).
    for (const a of PIECES_MONTEES[donnees.type] ?? []) {
      const m = modeleMetier(a, "sol");
      if (m) this.objet.add(m);
    }
    // Celles qui suivent l'état de près (une jauge) ou qui bougent (une poulie) : `userData.majEtat`, `userData.animer`.
    this.objet.traverse((o) => {
      if (typeof o.userData.majEtat === "function") this.suivis.push(o);
      if (typeof o.userData.animer === "function") this.animes.push(o);
    });
    // Le niveau (Book 24) : des pièces en plus.
    const pieces = piecesNiveau(donnees.type, donnees.niveau ?? 1, donnees.etat);
    if (pieces) this.objet.add(pieces);
    this.objet.position.set(donnees.x, 0, donnees.z);
    // Le panneau regarde toujours le sud, quelle que soit la façon dont on l'a posé.
    this.objet.rotation.y = donnees.type === "panneau_solaire" ? 0 : donnees.o;
    // Même image, moins d'appels de dessin : on fond les morceaux de même matériau, sauf les pièces qui bougent,
    // s'allument ou se montrent une à une (2026-10-08).
    for (const o of [this.braise, this.redresseur, this.meule, this.dynamo, this.roue, this.manivelle, this.posees, this.voyant, ...this.eaux.map((e) => e.maillage), this.trouvailles, this.fumee?.objet]) if (o) o.userData.intact = true;
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
    if (this.redresseur) this.redresseur.visible = donnees.etat.redresseur === true;
    if (this.dynamo) this.dynamo.visible = donnees.etat.dynamo === true;
    // Les modèles de métier (rendu/metier/) : un piège armé ou qui a pris ; un accessoire monté ou non.
    const arme = donnees.etat.declencheur?.arme !== false;
    this.objet.traverse((o) => {
      if (typeof o.userData.siArme === "boolean") o.visible = o.userData.siArme === arme;
      if (typeof o.userData.siEtat === "string") o.visible = donnees.etat[o.userData.siEtat as keyof typeof donnees.etat] === true;
    });
    for (const o of this.suivis) (o.userData.majEtat as (etat: InstallationVue["etat"]) => void)(donnees.etat);
    let chargees = 0;
    if (this.posees) {
      for (const b of this.posees.children) {
        b.visible = (donnees.etat.batteries?.[b.name as "petite_batterie"] ?? 0) > 0;
        if (b.visible) chargees++;
      }
    }
    if (this.voyant) (this.voyant.material as THREE.MeshBasicMaterial).color.setHex(chargees > 0 ? 0x5aff7a : 0x1f3324);
    if (this.forge) majAccessoiresForge(this.forge, donnees.etat);
    if (this.trouvailles) majTrouvailles(this.trouvailles, Object.values(donnees.etat.contenu ?? {}).reduce((s, n) => s + (n ?? 0), 0));
    if (this.outils) {
      const vus = JSON.stringify(donnees.etat.contenu ?? {});
      if (vus !== this.outilsVus) rangerOutils(this.outils, donnees.etat.contenu ?? {});
      this.outilsVus = vus;
    }
    // Le récupérateur se remplit avec la pluie : l'eau monte dans le bidon (derrière le plastique), ou dans le seau (sa
    // surface s'élargit en montant). Deux bidons (le repli) se remplissent ensemble.
    if (this.eaux.length) {
      const l = (donnees.etat.litres ?? 0) / this.eaux.length;
      for (const e of this.eaux) {
        const f = Math.min(1, l / e.litres);
        e.maillage.visible = l > 0.05;
        if (e.genre === "bidon") e.maillage.scale.y = Math.max(0.001, f * e.haut);
        else {
          e.maillage.position.y = e.bas + f * (e.haut - e.bas);
          e.maillage.scale.setScalar(e.rBas + f * (e.rHaut - e.rBas));
        }
      }
    }
  }

  /** La lumière de la torche plantée qui brûle (plan 0.8) : dans la réserve fixe de lumières de nuit (Book 21 §5.3.3). */
  source(maintenantServeur: number): SourceLumiere | null {
    if (!this.torche || !torcheAllumee(this.donnees, maintenantServeur)) return null;
    return { x: this.donnees.x, y: TETE_TORCHE + 0.15, z: this.donnees.z, couleur: 0xff8a3d, intensite: 4, portee: PORTEE_TORCHE + 2, vacillement: 0.9 };
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
    if (this.forge) animerAccessoiresForge(this.forge, dt, nuit);
    for (const o of this.animes) (o.userData.animer as (dt: number, enMarche: boolean) => void)(dt, enMarche);
    if (this.torche) {
      // La torche (plan 0.8) : la flamme tant qu'elle brûle, qui vacille ; consumée, le moignon noir.
      const brule = torcheAllumee(this.donnees, maintenantServeur);
      const finie = torcheConsumee(this.donnees, maintenantServeur);
      this.torche.flammes.visible = brule;
      this.torche.neuve.visible = !finie;
      this.torche.consumee.visible = finie;
      if (brule) {
        this.torche.flammes.children.forEach((f, i) => {
          f.scale.set(1, 0.85 + Math.sin(this.temps * (11 + i * 3) + i) * 0.12 + Math.sin(this.temps * 23 + i * 2) * 0.05, 1);
          f.rotation.y += dt * (i % 2 ? 2.4 : -1.9);
        });
        this.torche.matFlamme.opacity = 0.75 + Math.sin(this.temps * 19) * 0.12;
      }
    }
    if (enMarche) {
      if (this.roue) this.roue.rotation.z -= dt * 9;
      // La meule est sur l'axe de la roue ; le plateau tourne moins vite (rapport de la chaîne).
      if (this.meule) this.meule.rotation.z -= dt * 9;
      if (this.manivelle) this.manivelle.rotation.z -= dt * 3.6;
    }
  }
}
