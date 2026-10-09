// Le contrôle des obstacles (0.7.1) : « soit il y a un obstacle physique, soit on peut passer ». Pour un lieu, on
// confronte ce qui bloque le déplacement (les boîtes de la zone, ses bornes) à ce qu'on voit (le décor 3D) :
// - chaque obstacle doit avoir quelque chose de visible sur toute son emprise (un mur, une haie, une épave…) ;
// - chaque bord de zone qu'on peut toucher à pied (hors sorties) doit être matérialisé (une lisière, un grillage…).
// Sert au test automatique (obstacles-visibles.test.ts) et au mode de débogage `?obstacles=1` (dessin en surimpression).
// Aucune dépendance au navigateur : seulement three.js et les données du lieu.

import * as THREE from "three";
import { bordsLibres, type Boite, type MorceauBord, type Sortie, type Zone } from "../../../commun/src/lieux.ts";

/** Ce qui compte comme « visible et matériel » : entre ces hauteurs (le sol, les routes, leurs marquages et les toits n'y sont pas). */
const Y_BAS = 0.05;
const Y_HAUT = 3;
/** Distance où l'on cherche quelque chose de visible autour d'un point d'obstacle, d'un point de bord (m). */
export const PROCHE_OBSTACLE = 0.5;
export const PROCHE_BORD = 1.5;

/** Les emprises au sol (x, z) de tout ce qu'on voit entre Y_BAS et Y_HAUT, rangées par cases d'un mètre. */
export class CarteVisible {
  private readonly emprises: number[] = [];
  private readonly cases = new Map<number, number[]>();

  constructor(objets: THREE.Object3D | readonly THREE.Object3D[]) {
    for (const o of Array.isArray(objets) ? objets : [objets]) this.parcourir(o);
  }

  private parcourir(decor: THREE.Object3D): void {
    decor.updateMatrixWorld(true);
    const m = new THREE.Matrix4();
    const mi = new THREE.Matrix4();
    const boite = new THREE.Box3();
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    decor.traverseVisible((o) => {
      if (!(o instanceof THREE.Mesh) || !visible(o.material)) return;
      if (o instanceof THREE.InstancedMesh) {
        const g = o.geometry;
        if (!g.boundingBox) g.computeBoundingBox();
        for (let i = 0; i < o.count; i++) {
          o.getMatrixAt(i, mi);
          this.ajouterBoite(boite.copy(g.boundingBox!).applyMatrix4(m.multiplyMatrices(o.matrixWorld, mi)));
        }
        return;
      }
      if (o instanceof THREE.BatchedMesh) {
        for (let i = 0; i < o.instanceCount; i++) {
          if (!o.getVisibleAt(i)) continue;
          const id = o.getGeometryIdAt(i);
          if (id < 0 || !o.getBoundingBoxAt(id, boite)) continue;
          o.getMatrixAt(i, mi);
          this.ajouterBoite(boite.applyMatrix4(m.multiplyMatrices(o.matrixWorld, mi)));
        }
        return;
      }
      const pos = o.geometry.getAttribute("position");
      if (!pos) return;
      const index = o.geometry.getIndex();
      const n = index ? index.count : pos.count;
      const sommet = (k: number, v: THREE.Vector3) => v.fromBufferAttribute(pos, index ? index.getX(k) : k).applyMatrix4(o.matrixWorld);
      for (let k = 0; k + 2 < n; k += 3) {
        sommet(k, a);
        sommet(k + 1, b);
        sommet(k + 2, c);
        this.ajouter(Math.min(a.x, b.x, c.x), Math.max(a.x, b.x, c.x), Math.min(a.y, b.y, c.y), Math.max(a.y, b.y, c.y), Math.min(a.z, b.z, c.z), Math.max(a.z, b.z, c.z));
      }
    });
  }

  private ajouterBoite(b: THREE.Box3): void {
    this.ajouter(b.min.x, b.max.x, b.min.y, b.max.y, b.min.z, b.max.z);
  }

  private ajouter(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
    if (y1 < Y_BAS || y0 > Y_HAUT || !Number.isFinite(x0 + x1 + z0 + z1)) return;
    const k = this.emprises.length / 4;
    this.emprises.push(x0, x1, z0, z1);
    for (let i = Math.floor(x0); i <= Math.floor(x1); i++) {
      for (let j = Math.floor(z0); j <= Math.floor(z1); j++) {
        const cle = i * 8192 + j;
        const liste = this.cases.get(cle);
        if (liste) liste.push(k);
        else this.cases.set(cle, [k]);
      }
    }
  }

  /** Y a-t-il quelque chose de visible à moins de `d` mètres de ce point (à plat) ? */
  proche(x: number, z: number, d: number): boolean {
    for (let i = Math.floor(x - d); i <= Math.floor(x + d); i++) {
      for (let j = Math.floor(z - d); j <= Math.floor(z + d); j++) {
        for (const k of this.cases.get(i * 8192 + j) ?? []) {
          const e = this.emprises;
          const dx = Math.max(0, e[4 * k]! - x, x - e[4 * k + 1]!);
          const dz = Math.max(0, e[4 * k + 2]! - z, z - e[4 * k + 3]!);
          if (dx * dx + dz * dz <= d * d) return true;
        }
      }
    }
    return false;
  }
}

function visible(mat: THREE.Material | THREE.Material[]): boolean {
  const m = Array.isArray(mat) ? mat[0] : mat;
  return !!m && m.visible && m.colorWrite !== false && !(m.transparent && m.opacity <= 0.05);
}

/**
 * Des points répartis sur le pourtour d'une boîte, tous les `pas` mètres au plus : c'est là qu'on bute. L'intérieur
 * ne compte pas (on n'y entre pas : l'atelier fermé de la halte est creux, et c'est très bien).
 */
export function pointsDe(b: Boite, pas = 0.5): { x: number; z: number }[] {
  const ni = Math.max(1, Math.ceil(b.l / pas));
  const nj = Math.max(1, Math.ceil(b.p / pas));
  const points: { x: number; z: number }[] = [];
  for (let i = 0; i <= ni; i++) {
    for (let j = 0; j <= nj; j++) {
      if (i === 0 || j === 0 || i === ni || j === nj) points.push({ x: b.x - b.l / 2 + (b.l * i) / ni, z: b.z - b.p / 2 + (b.p * j) / nj });
    }
  }
  return points;
}

export interface ControleObstacle {
  boite: Boite;
  /** Part de l'emprise où l'on voit quelque chose (0 à 1). */
  couverture: number;
  /** Les points de l'emprise où l'on ne voit rien. */
  trous: { x: number; z: number }[];
}

export interface ControleBord {
  morceau: MorceauBord;
  /** Les points du bord où l'on ne voit rien : une barrière invisible. */
  trous: { x: number; z: number }[];
}

export interface ControleLieu {
  obstacles: ControleObstacle[];
  /** Les bords qu'on touche à pied hors des sorties (matérialisés ou non). */
  bords: ControleBord[];
}

/** Contrôle un lieu : ses obstacles et ses bords, face au décor qu'on voit. */
export function controlerLieu(zone: Zone, sorties: readonly Sortie[], decor: THREE.Object3D | readonly THREE.Object3D[] | CarteVisible): ControleLieu {
  const carte = decor instanceof CarteVisible ? decor : new CarteVisible(decor);
  const obstacles = zone.obstacles.map((boite) => {
    const points = pointsDe(boite);
    const trous = points.filter((p) => !carte.proche(p.x, p.z, PROCHE_OBSTACLE));
    return { boite, couverture: 1 - trous.length / points.length, trous };
  });
  const bords = bordsLibres(zone, sorties).map((morceau) => {
    const l = Math.hypot(morceau.x2 - morceau.x1, morceau.z2 - morceau.z1);
    const n = Math.max(1, Math.ceil(l / 0.5));
    const trous: { x: number; z: number }[] = [];
    for (let i = 0; i <= n; i++) {
      const x = morceau.x1 + ((morceau.x2 - morceau.x1) * i) / n;
      const z = morceau.z1 + ((morceau.z2 - morceau.z1) * i) / n;
      if (!carte.proche(x, z, PROCHE_BORD)) trous.push({ x, z });
    }
    return { morceau, trous };
  });
  return { obstacles, bords };
}

// ---------- Le dessin en surimpression (mode `?obstacles=1`) ----------

const VERT = 0x2ecc71;
const ROUGE = 0xff2d55;
const JAUNE = 0xffd60a;
const BLEU = 0x0a84ff;
const ORANGE = 0xff9f0a;

function trait(points: THREE.Vector3[], couleur: number): THREE.LineSegments {
  const l = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: couleur, depthTest: false, transparent: true }));
  l.renderOrder = 999;
  return l;
}

function caisse(b: Boite, h: number, couleur: number, opacite: number): THREE.Group {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(Math.max(0.05, b.l), h, Math.max(0.05, b.p));
  const plein = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: couleur, transparent: true, opacity: opacite, depthWrite: false, depthTest: false }));
  plein.renderOrder = 998;
  const aretes = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: couleur, depthTest: false, transparent: true }));
  aretes.renderOrder = 999;
  g.add(plein, aretes);
  g.position.set(b.x, h / 2, b.z);
  return g;
}

/**
 * Le dessin du contrôle : obstacles en vert (on voit ce qui bloque) ou rouge (rien de visible), points rouges où
 * l'on ne voit rien, sorties en bleu, bornes de la zone en jaune, bords touchables en orange (matérialisés) ou rouge
 * (barrière invisible).
 */
export function dessinControle(zone: Zone, sorties: readonly Sortie[], controle: ControleLieu): THREE.Group {
  const g = new THREE.Group();
  g.name = "controle-obstacles";
  for (const o of controle.obstacles) {
    g.add(caisse(o.boite, 1.2, o.trous.length ? ROUGE : VERT, 0.22));
    if (o.trous.length) g.add(trait(o.trous.flatMap((p) => [new THREE.Vector3(p.x, 0.05, p.z), new THREE.Vector3(p.x, 2.2, p.z)]), ROUGE));
  }
  for (const s of sorties) g.add(caisse(s.boite, 0.3, BLEU, 0.25));
  const y = 0.08;
  const { xMin, xMax, zMin, zMax } = zone;
  g.add(
    trait(
      [
        [xMin, zMin, xMax, zMin],
        [xMax, zMin, xMax, zMax],
        [xMax, zMax, xMin, zMax],
        [xMin, zMax, xMin, zMin],
      ].flatMap(([x1, z1, x2, z2]) => [new THREE.Vector3(x1, y, z1), new THREE.Vector3(x2, y, z2)]),
      JAUNE,
    ),
  );
  for (const b of controle.bords) {
    const { x1, z1, x2, z2 } = b.morceau;
    const boite = { x: (x1 + x2) / 2, z: (z1 + z2) / 2, l: Math.abs(x2 - x1) + 0.3, p: Math.abs(z2 - z1) + 0.3 };
    g.add(caisse(boite, 2, b.trous.length ? ROUGE : ORANGE, 0.3));
  }
  return g;
}

/** Le résumé du contrôle, en une ligne. */
export function resumeControle(c: ControleLieu): string {
  const sansRien = c.obstacles.filter((o) => o.trous.length).length;
  const invisibles = c.bords.filter((b) => b.trous.length).length;
  return `${c.obstacles.length} obstacles (${sansRien} sans rien de visible) · ${c.bords.length} bords touchables (${invisibles} invisibles)`;
}
