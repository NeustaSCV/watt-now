// L'atelier des petits modèles (2026-10-08) : on accumule des dizaines de pièces (planches, perches, pierres, taches de
// rouille…), la couleur passant par les sommets, puis on les fond en un maillage par finition (mat, tôle, métal…).
// Un objet entier = 1 à 4 appels de dessin, quel que soit le nombre de pièces et de couleurs.
// Deux touches de « peint à la main », gratuites à l'affichage :
// - la nuance : chaque facette varie un peu de ton (le bois, la pierre, la toile ne sont jamais d'une seule couleur) ;
// - l'occlusion cuite (Book 21 §5.3.5 : pas d'occlusion en temps réel, elle est cuite dans les sommets) : le bas des
//   objets s'assombrit près du sol, ce qui les pose sur le terrain.
// Né pour les épaves (ressources.ts), partagé depuis avec les installations, le feu et les armes.

import * as THREE from "three";
import { PALETTE, aleatoire } from "./materiaux.ts";

export const V = (x: number, y: number) => new THREE.Vector2(x, y);
export const V3 = THREE.Vector3;
export const X = new V3(1, 0, 0);
export const Y = new V3(0, 1, 0);
export const Z = new V3(0, 0, 1);

/** La finition d'une pièce : rugosité et métal du matériau partagé (la couleur, elle, est dans les sommets). */
export type Finition = "mat" | "tole" | "metal" | "verre" | "toile" | "sol";
const FINITIONS: Record<Finition, [rugosite: number, metal: number]> = {
  mat: [0.9, 0],
  tole: [0.72, 0.25],
  metal: [0.5, 0.45],
  verre: [0.2, 0.15],
  toile: [0.95, 0],
  sol: [1, 0],
};
const materiauxSommets = new Map<Finition, THREE.MeshStandardMaterial>();

/** Le matériau à facettes d'une finition, couleurs par sommet ; la toile se voit des deux côtés (par les déchirures). */
export function materiauSommets(f: Finition): THREE.MeshStandardMaterial {
  let m = materiauxSommets.get(f);
  if (!m) {
    const [rugosite, metal] = FINITIONS[f];
    m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: rugosite, metalness: metal, flatShading: true, side: f === "toile" ? THREE.DoubleSide : THREE.FrontSide });
    materiauxSommets.set(f, m);
  }
  return m;
}

/** Une surface plane où poser une plaque : (u, v) → point 3D, et la direction « dehors ». */
export interface Surface {
  point: (u: number, v: number) => THREE.Vector3;
  dehors: THREE.Vector3;
}

export function surface(o: THREE.Vector3, eu: THREE.Vector3, ev: THREE.Vector3, dehors: THREE.Vector3): Surface {
  return { point: (u, v) => o.clone().addScaledVector(eu, u).addScaledVector(ev, v), dehors: dehors.clone().normalize() };
}

/** Le sol sous l'objet (u = x, v = z). */
export const SOL_PLAT = surface(new V3(0, 0, 0), X, Z, Y);

/** Accumule des pièces par finition, puis les fusionne en un maillage par finition. */
export class Assemblage {
  private readonly lots = new Map<Finition, { positions: number[]; couleurs: number[] }>();
  private readonly teinte = new THREE.Color();
  private readonly hsl = { h: 0, s: 0, l: 0 };
  private readonly aleat: () => number;
  /** Transformation appliquée à tout ce qu'on ajoute : la caisse qui penche, une portière ouverte. */
  repere: THREE.Matrix4 | null = null;
  /** Occlusion cuite : hauteur (m) sous laquelle les sommets s'assombrissent (0 : aucune). */
  occlusion = 0;
  /** Assombrissement au ras du sol (0 à 1). */
  forceOcclusion = 0.4;

  constructor(graine = 1) {
    this.aleat = aleatoire(graine);
  }

  /** Ajoute une pièce ; `nuance` : écart de clarté d'une facette à l'autre (0,04 : discret, 0,1 : marqué). */
  ajouter(g: THREE.BufferGeometry, couleur: number, finition: Finition = "mat", nuance = 0): void {
    if (this.repere) g.applyMatrix4(this.repere);
    const p = g.getAttribute("position");
    const index = g.getIndex();
    const n = index ? index.count : p.count;
    const lot = this.lot(finition);
    this.teinte.setHex(couleur);
    const base = this.teinte.clone();
    for (let i = 0; i < n; i++) {
      if (nuance > 0 && i % 3 === 0) {
        base.getHSL(this.hsl);
        this.teinte.setHSL(this.hsl.h, this.hsl.s, Math.min(1, Math.max(0, this.hsl.l + (this.aleat() - 0.5) * 2 * nuance)));
      }
      const k = index ? index.getX(i) : i;
      lot.positions.push(p.getX(k), p.getY(k), p.getZ(k));
      lot.couleurs.push(this.teinte.r, this.teinte.g, this.teinte.b);
    }
    g.dispose();
  }

  /** Une pièce dont la couleur dépend de la place de chaque sommet (bout calciné, cœur de bûche, suie…). */
  ajouterDegrade(g: THREE.BufferGeometry, couleur: (p: THREE.Vector3) => number, finition: Finition = "mat"): void {
    if (this.repere) g.applyMatrix4(this.repere);
    const p = g.getAttribute("position");
    const index = g.getIndex();
    const n = index ? index.count : p.count;
    const lot = this.lot(finition);
    const q = new V3();
    const centre = new V3();
    for (let i = 0; i < n; i += 3) {
      // Une couleur par facette (au centre du triangle) : on garde l'aspect à facettes.
      centre.set(0, 0, 0);
      for (let j = 0; j < 3; j++) centre.add(q.fromBufferAttribute(p, index ? index.getX(i + j) : i + j));
      this.teinte.setHex(couleur(centre.divideScalar(3)));
      for (let j = 0; j < 3; j++) {
        const k = index ? index.getX(i + j) : i + j;
        lot.positions.push(p.getX(k), p.getY(k), p.getZ(k));
        lot.couleurs.push(this.teinte.r, this.teinte.g, this.teinte.b);
      }
    }
    g.dispose();
  }

  /** Des triangles bruts (x, y, z à la suite). */
  triangles(positions: number[], couleur: number, finition: Finition, nuance = 0): void {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    this.ajouter(g, couleur, finition, nuance);
  }

  boite(couleur: number, finition: Finition, l: number, h: number, p: number, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0): void {
    this.ajouter(placer(new THREE.BoxGeometry(l, h, p), x, y, z, rx, ry, rz), couleur, finition);
  }

  /** Une perche (cylindre) d'un point à un autre ; `r1` : rayon au bout `b`. */
  perche(a: THREE.Vector3, b: THREE.Vector3, r0: number, couleur: number, finition: Finition = "mat", cotes = 5, r1 = r0, nuance = 0.05): void {
    const d = b.clone().sub(a);
    const g = new THREE.CylinderGeometry(r1, r0, d.length(), cotes);
    g.translate(0, d.length() / 2, 0);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y, d.normalize()));
    g.translate(a.x, a.y, a.z);
    this.ajouter(g, couleur, finition, nuance);
  }

  /** Une ligature de corde autour d'un point (axe `axe`), quelques tours. */
  ligature(centre: THREE.Vector3, axe: THREE.Vector3, rayon: number, couleur = 0xb59a6a): void {
    for (const dy of [-0.012, 0.012]) {
      const g = new THREE.TorusGeometry(rayon, 0.007, 3, 7);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Z, axe.clone().normalize()));
      g.translate(centre.x + axe.x * dy, centre.y + axe.y * dy, centre.z + axe.z * dy);
      this.ajouter(g, couleur, "mat", 0.04);
    }
  }

  /** Un polygone plat posé sur une surface, un peu décollé : vitre, phare, tache de rouille, plaque de mousse. */
  plaque(points: THREE.Vector2[], s: Surface, couleur: number, finition: Finition = "mat", decalage = 0.008): void {
    const p3 = points.map((q) => s.point(q.x, q.y).addScaledVector(s.dehors, decalage));
    const ab = new V3();
    const ac = new V3();
    const positions: number[] = [];
    for (const t of THREE.ShapeUtils.triangulateShape(points, [])) {
      const [a, b, c] = [p3[t[0]!]!, p3[t[1]!]!, p3[t[2]!]!];
      // Toujours tournée vers le dehors, quel que soit le sens du polygone.
      const ordre = ab.subVectors(b, a).cross(ac.subVectors(c, a)).dot(s.dehors) >= 0 ? [a, b, c] : [a, c, b];
      for (const q of ordre) positions.push(q.x, q.y, q.z);
    }
    this.triangles(positions, couleur, finition);
  }

  /** Les maillages (un par finition) ; `ombre` règle les ombres de chacun (le sol ne fait que les recevoir). */
  maillages(ombre: (m: THREE.Mesh) => THREE.Mesh = ombrePortee): THREE.Mesh[] {
    return [...this.lots].map(([f, lot]) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(lot.positions, 3));
      const couleurs = Float32Array.from(lot.couleurs);
      if (this.occlusion > 0) {
        for (let i = 0; i < couleurs.length; i += 3) {
          const t = Math.min(1, Math.max(0, lot.positions[i + 1]! / this.occlusion));
          const k = 1 - this.forceOcclusion * (1 - t * t * (3 - 2 * t));
          couleurs[i]! *= k;
          couleurs[i + 1]! *= k;
          couleurs[i + 2]! *= k;
        }
      }
      g.setAttribute("color", new THREE.BufferAttribute(couleurs, 3));
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, materiauSommets(f));
      if (f !== "sol") return ombre(m);
      m.receiveShadow = true;
      return m;
    });
  }

  /** Les maillages, rangés dans un groupe. */
  groupe(ombre: (m: THREE.Mesh) => THREE.Mesh = ombrePortee): THREE.Group {
    const g = new THREE.Group();
    for (const m of this.maillages(ombre)) g.add(m);
    return g;
  }

  get vide(): boolean {
    return this.lots.size === 0;
  }

  private lot(f: Finition): { positions: number[]; couleurs: number[] } {
    let lot = this.lots.get(f);
    if (!lot) {
      lot = { positions: [], couleurs: [] };
      this.lots.set(f, lot);
    }
    return lot;
  }
}

export function ombrePortee(m: THREE.Mesh): THREE.Mesh {
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function placer<G extends THREE.BufferGeometry>(g: G, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0): G {
  if (rx || ry || rz) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz)));
  return g.translate(x, y, z);
}

/** Bosselle une géométrie (pierre, motte, lobe de feuillage) : chaque sommet bouge un peu, de façon reproductible. */
export function bosseler<G extends THREE.BufferGeometry>(g: G, ampleur: number, aleat: () => number): G {
  const p = g.getAttribute("position");
  // Les sommets confondus (même position) bougent ensemble : pas de trou entre les facettes.
  const deplacements = new Map<string, THREE.Vector3>();
  for (let i = 0; i < p.count; i++) {
    const cle = `${p.getX(i).toFixed(4)}|${p.getY(i).toFixed(4)}|${p.getZ(i).toFixed(4)}`;
    let d = deplacements.get(cle);
    if (!d) deplacements.set(cle, (d = new V3((aleat() - 0.5) * 2, (aleat() - 0.5) * 2, (aleat() - 0.5) * 2).multiplyScalar(ampleur)));
    p.setXYZ(i, p.getX(i) + d.x, p.getY(i) + d.y, p.getZ(i) + d.z);
  }
  return g;
}

/** Cintre une lame : y monte de `fleche` aux extrémités (x = ±demi). */
export function courber<G extends THREE.BufferGeometry>(g: G, fleche: number, demi: number): G {
  const p = g.getAttribute("position");
  for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + fleche * (p.getX(i) / demi) ** 2);
  return g;
}

/** Un rectangle centré (demi-largeurs du, dv). */
export function rect(u: number, v: number, du: number, dv: number): THREE.Vector2[] {
  return [V(u - du, v - dv), V(u + du, v - dv), V(u + du, v + dv), V(u - du, v + dv)];
}

/** Un disque à `n` facettes. */
export function disque(u: number, v: number, r: number, n: number): THREE.Vector2[] {
  return Array.from({ length: n }, (_, i) => V(u + Math.cos((i / n) * Math.PI * 2) * r, v + Math.sin((i / n) * Math.PI * 2) * r));
}

/** Une tache irrégulière (rouille, mousse, feuille morte, auréole). */
export function tache(u: number, v: number, ru: number, rv: number, aleat: () => number, n = 7): THREE.Vector2[] {
  const depart = aleat() * Math.PI * 2;
  return Array.from({ length: n }, (_, i) => {
    const a = depart + (i / n) * Math.PI * 2;
    const r = 0.45 + 0.55 * aleat();
    return V(u + Math.cos(a) * ru * r, v + Math.sin(a) * rv * r);
  });
}

export const HERBES = [PALETTE.herbe, PALETTE.herbeSeche, PALETTE.herbeSombre];

/** Une touffe d'herbe folle : quelques brins à facettes, verts et secs mêlés. */
export function touffe(c: Assemblage, x: number, z: number, aleat: () => number, n: number, haut: number, y = 0): void {
  for (let i = 0; i < n * 2; i++) {
    const h = haut * (0.5 + 0.6 * aleat());
    const brin = new THREE.ConeGeometry(0.04 + aleat() * 0.03, h, 3, 1, true).scale(1, 1, 0.4).translate(0, h / 2, 0);
    c.ajouter(placer(brin, x + (aleat() - 0.5) * 0.3, y, z + (aleat() - 0.5) * 0.3, (aleat() - 0.5) * 0.7, aleat() * 6, (aleat() - 0.5) * 0.7), HERBES[Math.floor(aleat() * 3)]!);
  }
}

/** Une tache de rouille : une auréole orangée, un cœur brun où la tôle est rongée. */
export function rouille(c: Assemblage, s: Surface, u: number, v: number, ru: number, rv: number, aleat: () => number): void {
  c.plaque(tache(u, v, ru, rv, aleat, 10), s, PALETTE.rouille, "mat", 0.008);
  c.plaque(tache(u + (aleat() - 0.5) * ru * 0.6, v + (aleat() - 0.5) * rv * 0.6, ru * 0.5, rv * 0.5, aleat, 7), s, ROUILLE_SOMBRE, "mat", 0.01);
  // Quelques piqûres autour.
  for (let i = 0; i < 2; i++) {
    const a = aleat() * Math.PI * 2;
    c.plaque(tache(u + Math.cos(a) * ru * 1.3, v + Math.sin(a) * rv * 1.3, ru * 0.18, rv * 0.18, aleat, 5), s, PALETTE.rouille, "mat", 0.008);
  }
}

export const ROUILLE_SOMBRE = 0x6e3a22;
export const ACIER = 0x6b6862;
export const NOIR = 0x2a2826;
export const CORDE = 0xb59a6a;
/** Le bois de récupération : planches claires, grisées, plus sombres. */
export const BOIS = { clair: 0xa07c48, moyen: 0x8a6a3e, gris: 0x8c8172, sombre: PALETTE.bois, ecorce: PALETTE.boisSombre, coupe: 0xc9a77a } as const;
