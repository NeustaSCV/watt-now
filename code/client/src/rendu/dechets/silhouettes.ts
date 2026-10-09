// Les silhouettes partagées des déchets (0.7, chantier 7 ; chiffrage graphique §2.1) : des modèles low poly à couleurs
// par sommet et nuance par facette, comme assemblage.ts, posés au sol (le bas à y = 0). Chaque objet du catalogue en
// prend une, à sa teinte et à son échelle (apparence.ts) : on en tire UNE géométrie par objet, cuite (teinte, taille,
// occlusion au ras du sol), qu'on dessine ensuite autant de fois qu'il le faut dans un seul lot (couche.ts).
//
// Tailles nominales (avant l'échelle de l'objet) : la canette fait 12 cm, la boîte 40 × 20 × 30, la barre 1,1 m,
// la roue 76 cm de diamètre, le vélo 1,65 m. Entre 20 et 350 triangles par silhouette (le caddie est le plus cher).

import * as THREE from "three";
import { aleatoire } from "../materiaux.ts";
import { bosseler } from "../assemblage.ts";
import type { Silhouette } from "./apparence.ts";

/** Un petit atelier : pièces → triangles à couleurs par sommet (nuance par facette), comme assemblage.ts. */
export class Patron {
  readonly pos: number[] = [];
  readonly col: number[] = [];
  readonly al: () => number;
  private readonly c = new THREE.Color();
  private readonly hsl = { h: 0, s: 0, l: 0 };
  constructor(graine: number) {
    this.al = aleatoire(graine);
  }

  ajouter(g: THREE.BufferGeometry, couleur: number, nuance = 0.04): void {
    this.ajouterAvec(g, () => couleur, nuance);
  }

  /** Une couleur par facette, selon le centre du triangle (bande de roulement, pentagones du ballon…). */
  ajouterAvec(g: THREE.BufferGeometry, couleur: (centre: THREE.Vector3, rang: number) => number, nuance = 0.04): void {
    const p = g.getAttribute("position")!;
    const idx = g.getIndex();
    const n = idx ? idx.count : p.count;
    const centre = new THREE.Vector3();
    const q = new THREE.Vector3();
    for (let i = 0; i < n; i += 3) {
      centre.set(0, 0, 0);
      for (let j = 0; j < 3; j++) centre.add(q.fromBufferAttribute(p, idx ? idx.getX(i + j) : i + j));
      this.c.setHex(couleur(centre.divideScalar(3), i / 3));
      if (nuance > 0) {
        this.c.getHSL(this.hsl);
        this.c.setHSL(this.hsl.h, this.hsl.s, Math.min(1, Math.max(0, this.hsl.l + (this.al() - 0.5) * 2 * nuance)));
      }
      for (let j = 0; j < 3; j++) {
        const k = idx ? idx.getX(i + j) : i + j;
        this.pos.push(p.getX(k), p.getY(k), p.getZ(k));
        this.col.push(this.c.r, this.c.g, this.c.b);
      }
    }
    g.dispose();
  }

  get triangles(): number {
    return this.pos.length / 9;
  }

  /**
   * La géométrie finale, à l'échelle (x, y, z), non indexée (position, normale, couleur), occlusion cuite au ras du
   * sol : les sommets sous `occlusion` mètres s'assombrissent, ce qui pose l'objet sans ombre portée.
   */
  geometrie(echelle: readonly [number, number, number] = [1, 1, 1], occlusion = 0.06, force = 0.3): THREE.BufferGeometry {
    const pos = Float32Array.from(this.pos);
    const col = Float32Array.from(this.col);
    for (let i = 0; i < pos.length; i += 3) {
      pos[i]! *= echelle[0];
      pos[i + 1]! *= echelle[1];
      pos[i + 2]! *= echelle[2];
      const t = Math.min(1, Math.max(0, pos[i + 1]! / occlusion));
      const k = 1 - force * (1 - t * t * (3 - 2 * t));
      col[i]! *= k;
      col[i + 1]! *= k;
      col[i + 2]! *= k;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    g.computeBoundingBox();
    g.computeBoundingSphere();
    return g;
  }
}

// ---------- Couleurs ----------
const ALU = 0xc9ccd0;
const SOMBRE = 0x2b2b2b;
const ECRAN = 0x2b3440;
const BLANC = 0xece8de;
const c = new THREE.Color();
const d = new THREE.Color();
/** Une teinte assombrie (k < 1) ou éclaircie vers le blanc (k > 1). */
export function nuancer(t: number, k: number): number {
  c.setHex(t);
  if (k <= 1) return c.multiplyScalar(k).getHex();
  return c.lerp(d.setHex(0xffffff), Math.min(1, k - 1)).getHex();
}

// ---------- Petites aides ----------
const Y = new THREE.Vector3(0, 1, 0);
/** Un cylindre d'un point à un autre. */
function tube(a: THREE.Vector3, b: THREE.Vector3, r: number, cotes = 4): THREE.BufferGeometry {
  const dir = b.clone().sub(a);
  const g = new THREE.CylinderGeometry(r, r, dir.length(), cotes, 1);
  g.translate(0, dir.length() / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(Y, dir.normalize()));
  return g.translate(a.x, a.y, a.z);
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Dessine une silhouette : `t` est la teinte de l'objet, `a` celle d'un détail (−1 : la silhouette choisit). */
type Dessin = (p: Patron, t: number, a: number) => void;

const detail = (a: number, defaut: number) => (a >= 0 ? a : defaut);

export const DESSINS: Record<Silhouette, Dessin> = {
  cylindre: (p, t, a) => {
    p.ajouter(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 7, 1).rotateZ(Math.PI / 2).translate(0, 0.036, 0), t);
    p.ajouter(new THREE.CylinderGeometry(0.035, 0.035, 0.006, 7, 1, true).rotateZ(Math.PI / 2).translate(0.061, 0.036, 0), detail(a, ALU));
    p.ajouter(new THREE.CircleGeometry(0.035, 7).rotateY(Math.PI / 2).translate(0.064, 0.036, 0), detail(a, ALU));
  },
  bouteille: (p, t, a) => {
    p.ajouter(new THREE.CylinderGeometry(0.045, 0.045, 0.19, 7, 1).rotateZ(Math.PI / 2).translate(-0.03, 0.043, 0), t, 0.05);
    p.ajouter(new THREE.CylinderGeometry(0.016, 0.045, 0.06, 7, 1, true).rotateZ(-Math.PI / 2).translate(0.095, 0.043, 0), t, 0.05);
    p.ajouter(new THREE.CylinderGeometry(0.017, 0.017, 0.035, 6, 1).rotateZ(Math.PI / 2).translate(0.14, 0.043, 0), detail(a, nuancer(t, 0.6)));
  },
  boite: (p, t, a) => {
    p.ajouter(bosseler(new THREE.BoxGeometry(0.4, 0.2, 0.3, 2, 1, 2), 0.01, p.al).translate(0, 0.1, 0), t, 0.05);
    p.ajouter(new THREE.BoxGeometry(0.3, 0.008, 0.06).translate(0, 0.203, 0), detail(a, nuancer(t, 0.72)), 0.02);
  },
  livre: (p, t) => {
    p.ajouter(new THREE.BoxGeometry(0.17, 0.035, 0.24).translate(0, 0.0175, 0), t, 0.03);
    p.ajouter(new THREE.BoxGeometry(0.004, 0.027, 0.228).translate(0.086, 0.0175, 0), 0xe8e0c8, 0);
  },
  plaque: (p, t, a) => {
    p.ajouter(new THREE.BoxGeometry(0.3, 0.01, 0.21).translate(0, 0.006, 0), t, 0.06);
    p.ajouter(new THREE.BoxGeometry(0.2, 0.004, 0.06).translate(-0.02, 0.0125, -0.05), detail(a, nuancer(t, 0.65)), 0.02);
  },
  chiffon: (p, t) => {
    p.ajouter(bosseler(new THREE.IcosahedronGeometry(0.2, 1), 0.05, p.al).scale(1.3, 0.22, 1).translate(0, 0.035, 0), t, 0.09);
  },
  coussin: (p, t) => {
    p.ajouter(bosseler(new THREE.BoxGeometry(0.55, 0.14, 0.36, 3, 1, 2), 0.02, p.al).translate(0, 0.07, 0), t, 0.05);
  },
  barre: (p, t, a) => {
    p.ajouter(new THREE.CylinderGeometry(0.018, 0.018, 1.1, 5, 1).rotateZ(Math.PI / 2).translate(0, 0.018, 0), t, 0.04);
    p.ajouter(new THREE.BoxGeometry(0.06, 0.036, 0.04).translate(0.53, 0.019, 0), detail(a, nuancer(t, 0.55)), 0.02);
  },
  roue: (p, t) => {
    const g = new THREE.TorusGeometry(0.28, 0.1, 5, 12).rotateX(Math.PI / 2).translate(0, 0.085, 0);
    // La bande de roulement : une facette sur deux un peu plus claire.
    p.ajouterAvec(g, (q, i) => (Math.abs(Math.hypot(q.x, q.z) - 0.28) > 0.06 && i % 2 === 0 ? nuancer(t, 1.12) : t), 0.03);
  },
  bobine: (p, t) => {
    for (let k = 0; k < 3; k++) {
      p.ajouter(new THREE.TorusGeometry(0.17 + k * 0.012, 0.02, 3, 12).rotateX(Math.PI / 2 + (k - 1) * 0.12).rotateY(k * 0.7).translate((k - 1) * 0.02, 0.025 + k * 0.012, 0), t, 0.05);
    }
  },
  ressort: (p, t) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 28; i++) {
      const u = i / 28;
      pts.push(v((u - 0.5) * 0.36, Math.sin(u * Math.PI * 11) * 0.07 + 0.078, Math.cos(u * Math.PI * 11) * 0.07));
    }
    p.ajouter(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 28, 0.013, 3), t, 0.06);
  },
  appareil: (p, t, a) => {
    p.ajouter(new THREE.BoxGeometry(0.22, 0.07, 0.15).translate(0, 0.035, 0), t, 0.03);
    p.ajouter(new THREE.BoxGeometry(0.15, 0.004, 0.09).translate(-0.01, 0.072, 0), detail(a, ECRAN), 0);
    p.ajouter(new THREE.BoxGeometry(0.025, 0.006, 0.025).translate(0.085, 0.072, 0.04), nuancer(t, 0.6), 0);
  },
  galet: (p, t) => {
    p.ajouter(new THREE.CylinderGeometry(0.17, 0.17, 0.07, 10, 1).translate(0, 0.035, 0), t, 0.03);
    p.ajouter(new THREE.CylinderGeometry(0.1, 0.11, 0.012, 8, 1).translate(0.02, 0.074, 0), SOMBRE, 0.02);
  },
  lame: (p, t, a) => {
    p.ajouter(new THREE.CylinderGeometry(0.15, 0.15, 0.01, 10, 1).translate(0, 0.006, 0), t, 0.04);
    p.ajouter(new THREE.CylinderGeometry(0.03, 0.03, 0.014, 6, 1).translate(0, 0.012, 0), detail(a, SOMBRE), 0);
  },
  velo: (p, t) => {
    // Couché sur le flanc : deux roues à plat, le cadre en losange, la selle, le guidon.
    for (const x of [-0.52, 0.52]) {
      p.ajouter(new THREE.TorusGeometry(0.31, 0.024, 3, 12).rotateX(Math.PI / 2).translate(x, 0.026, 0), SOMBRE, 0.02);
      p.ajouter(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 5).translate(x, 0.03, 0), ALU, 0);
    }
    const y = 0.06;
    const cadre: [THREE.Vector3, THREE.Vector3][] = [
      [v(-0.52, y, 0), v(-0.08, y, -0.02)],
      [v(-0.08, y, -0.02), v(0.38, y, -0.04)],
      [v(0.38, y, -0.04), v(0.52, y, 0)],
      [v(-0.52, y, 0), v(-0.16, y, -0.38)],
      [v(-0.16, y, -0.38), v(-0.08, y, -0.02)],
      [v(-0.16, y, -0.38), v(0.4, y, -0.34)],
      [v(0.4, y, -0.34), v(0.38, y, -0.04)],
    ];
    for (const [a, b] of cadre) p.ajouter(tube(a, b, 0.022), t, 0.04);
    p.ajouter(tube(v(0.4, y, -0.34), v(0.44, y, -0.55), 0.018), ALU, 0);
    p.ajouter(tube(v(0.3, y + 0.02, -0.56), v(0.6, y + 0.02, -0.54), 0.018), SOMBRE, 0);
    p.ajouter(new THREE.BoxGeometry(0.2, 0.04, 0.08).translate(-0.2, y + 0.01, -0.46), SOMBRE, 0.02);
    // Le panier du vélo de ville, aux couleurs du service.
    p.ajouter(new THREE.BoxGeometry(0.2, 0.12, 0.2).translate(0.62, 0.07, -0.42), t, 0.04);
  },
  trottinette: (p, t) => {
    p.ajouter(new THREE.BoxGeometry(0.62, 0.035, 0.13).translate(-0.05, 0.075, 0), t, 0.03);
    p.ajouter(new THREE.BoxGeometry(0.56, 0.006, 0.11).translate(-0.06, 0.095, 0), SOMBRE, 0);
    for (const x of [-0.38, 0.32]) p.ajouter(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 8).rotateX(Math.PI / 2).translate(x, 0.075, 0), SOMBRE, 0.02);
    // Le mât, couché vers l'avant, et le guidon en travers.
    p.ajouter(tube(v(0.3, 0.09, 0), v(1.0, 0.04, 0.05), 0.022, 5), t, 0.04);
    p.ajouter(tube(v(1.0, 0.035, -0.2), v(1.0, 0.035, 0.28), 0.018, 4), SOMBRE, 0);
  },
  sac: (p, t) => {
    p.ajouter(bosseler(new THREE.IcosahedronGeometry(0.13, 1), 0.04, p.al).scale(1, 0.45, 0.8).translate(0, 0.045, 0), t, 0.08);
  },
  pot: (p, t, a) => {
    p.ajouter(new THREE.CylinderGeometry(0.1, 0.095, 0.2, 9, 1).translate(0, 0.1, 0), t, 0.04);
    for (const y of [0.05, 0.15]) p.ajouter(new THREE.CylinderGeometry(0.104, 0.104, 0.014, 9, 1, true).translate(0, y, 0), detail(a, nuancer(t, 0.7)), 0.02);
    p.ajouter(new THREE.CylinderGeometry(0.08, 0.08, 0.006, 9, 1).translate(0, 0.202, 0), nuancer(t, 0.82), 0.02);
  },
  cone: (p, t) => {
    p.ajouter(new THREE.BoxGeometry(0.32, 0.03, 0.32).translate(0, 0.015, 0), SOMBRE, 0.03);
    p.ajouterAvec(new THREE.ConeGeometry(0.13, 0.46, 7, 3).translate(0, 0.26, 0), (q) => (q.y > 0.2 && q.y < 0.33 ? BLANC : t), 0.03);
  },
  grille: (p, t) => {
    // Le caddie : un panier en fil (barreaux), le châssis, quatre roulettes, la poignée.
    const L = 0.9;
    const bas = 0.42;
    const haut = 0.88;
    const za = 0.28;
    const fil = (a: THREE.Vector3, b: THREE.Vector3, r = 0.01) => p.ajouter(tube(a, b, r, 3), t, 0.03);
    for (const z of [-za, za]) {
      fil(v(-L / 2, bas, z), v(L / 2, bas, z * 0.85));
      fil(v(-L / 2, haut, z), v(L / 2 + 0.08, haut, z * 0.85));
      for (let k = 0; k <= 4; k++) {
        const x = -L / 2 + (k / 4) * L;
        fil(v(x, bas, z * (1 - 0.15 * (k / 4))), v(x + (k / 4) * 0.08, haut, z * (1 - 0.15 * (k / 4))));
      }
    }
    for (const x of [-L / 2, L / 2]) {
      fil(v(x, bas, -za * (x > 0 ? 0.85 : 1)), v(x, bas, za * (x > 0 ? 0.85 : 1)));
      fil(v(x + (x > 0 ? 0.08 : 0), haut, -za * (x > 0 ? 0.85 : 1)), v(x + (x > 0 ? 0.08 : 0), haut, za * (x > 0 ? 0.85 : 1)));
    }
    for (let k = 1; k < 4; k++) fil(v(-L / 2 + (k / 4) * L, bas, -za), v(-L / 2 + (k / 4) * L, bas, za));
    // Châssis et roulettes.
    for (const z of [-0.22, 0.22]) {
      p.ajouter(tube(v(-0.45, 0.08, z), v(0.45, 0.08, z * 0.8), 0.015, 4), 0x6b6862, 0.02);
      p.ajouter(tube(v(-0.45, 0.08, z), v(-0.45, bas, z), 0.015, 4), 0x6b6862, 0.02);
      for (const x of [-0.42, 0.42]) p.ajouter(new THREE.BoxGeometry(0.06, 0.07, 0.025).translate(x, 0.035, z * (x > 0 ? 0.8 : 1)), SOMBRE, 0);
    }
    p.ajouter(tube(v(-0.58, haut + 0.06, -0.26), v(-0.58, haut + 0.06, 0.26), 0.018, 5), 0xc8362b, 0.02);
    for (const z of [-0.26, 0.26]) fil(v(-L / 2, haut, z), v(-0.58, haut + 0.06, z));
  },
  barbecue: (p, t) => {
    p.ajouter(new THREE.SphereGeometry(0.24, 8, 3, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).translate(0, 0.62, 0), t, 0.06);
    p.ajouter(new THREE.CylinderGeometry(0.235, 0.235, 0.008, 8, 1).translate(0, 0.62, 0), SOMBRE, 0.02);
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2;
      p.ajouter(tube(v(Math.cos(a) * 0.15, 0.5, Math.sin(a) * 0.15), v(Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3), 0.014, 4), 0x3a3a3c, 0.02);
    }
  },
  boule: (p, t) => {
    const g = new THREE.IcosahedronGeometry(0.11, 1).scale(1, 0.85, 1).translate(0, 0.092, 0);
    // Les pièces sombres du ballon : une facette sur quatre, à peu près régulièrement.
    p.ajouterAvec(g, (_, i) => (i % 4 === 0 ? SOMBRE : t), 0.04);
  },
  flamant: (p, t) => {
    // Le flamant rose de pelouse, tombé sur le flanc : corps, cou en S, tête, bec noir, deux pattes de fil.
    p.ajouter(bosseler(new THREE.IcosahedronGeometry(0.12, 0), 0.01, p.al).scale(1.45, 0.7, 0.8).translate(0, 0.085, 0), t, 0.05);
    const cou = new THREE.CatmullRomCurve3([v(0.13, 0.09, 0), v(0.22, 0.07, -0.06), v(0.24, 0.06, -0.18), v(0.3, 0.05, -0.24)]);
    p.ajouter(new THREE.TubeGeometry(cou, 6, 0.022, 4), t, 0.04);
    p.ajouter(new THREE.IcosahedronGeometry(0.035, 0).translate(0.31, 0.05, -0.26), t, 0.03);
    p.ajouter(new THREE.ConeGeometry(0.014, 0.06, 4).rotateZ(-Math.PI / 2).translate(0.36, 0.045, -0.26), SOMBRE, 0);
    for (const z of [-0.03, 0.03]) p.ajouter(tube(v(-0.06, 0.04, z), v(-0.5, 0.012, z * 3), 0.006, 3), 0x3a3a3c, 0);
  },
  nain: (p, t) => {
    // Le nain de jardin renversé : bonnet rouge, visage, barbe blanche, veste à la teinte de l'objet.
    p.ajouter(new THREE.CylinderGeometry(0.07, 0.09, 0.16, 7).rotateZ(Math.PI / 2).translate(-0.04, 0.085, 0), t, 0.04);
    p.ajouter(new THREE.IcosahedronGeometry(0.055, 0).translate(0.08, 0.08, 0), 0xf0c8a0, 0.03);
    p.ajouter(new THREE.ConeGeometry(0.05, 0.08, 5).rotateZ(Math.PI / 2).translate(0.1, 0.05, 0), BLANC, 0.03);
    p.ajouter(new THREE.ConeGeometry(0.06, 0.14, 6).rotateZ(-Math.PI / 2).translate(0.18, 0.09, 0), 0xc8362b, 0.03);
  },
};

/** Une silhouette à sa teinte et à son échelle, cuite en une géométrie. */
export function construireSilhouette(s: Silhouette, t: number, a: number, echelle: readonly [number, number, number], graine = 1): THREE.BufferGeometry {
  const p = new Patron(graine);
  DESSINS[s](p, t, a);
  return p.geometrie(echelle);
}
