// Mode mesure (?mesure=1) : une couche de déchets SIMULÉE, pour mesurer son coût réel sur l'iPhone avant de l'écrire
// pour de bon (0.7). Reprend la maquette `.claude-travail/maquettes/dechets/` : les 12 silhouettes partagées, en
// finesse « ramassable » (couleurs par sommet, teinte par objet), posées en amas sur des carreaux de 20 m, comme le
// veut la décision du 2026-10-09 (« tout ce qu'on voit au sol se ramasse »).
// Quatre façons de les dessiner, pour comparer sur l'appareil :
// - « instancié » : un InstancedMesh par silhouette pour tout le lieu (12 appels, aucun tri par carreau) ;
// - « lot unique » : un seul BatchedMesh (1 appel si le navigateur sait dessiner en multiple, tri par objet) ;
// - « fusion » : une géométrie fondue par carreau (1 appel par carreau visible) ;
// - « aucun ».
// Rien de tout cela n'est chargé hors du mode mesure.

import * as THREE from "three";
import { aleatoire } from "../rendu/materiaux.ts";

export type ModeDechets = "aucun" | "instancie" | "lot" | "fusion";

/** Taille d'un carreau (décision du 2026-10-09). */
const CARREAU = 20;
/** Carreaux posés de part et d'autre du centre : 7 × 7 carreaux, 140 m de côté (plus que l'écran au zoom le plus large). */
const RAYON_CARREAUX = 3;

// ---------- Un petit « assemblage » : pièces → triangles à couleurs par sommet (comme assemblage.ts) ----------
class Pieces {
  readonly pos: number[] = [];
  readonly col: number[] = [];
  private readonly al: () => number;
  private readonly c = new THREE.Color();
  private readonly hsl = { h: 0, s: 0, l: 0 };
  constructor(graine: number) {
    this.al = aleatoire(graine);
  }
  ajouter(g: THREE.BufferGeometry, couleur: number, nuance = 0.04): void {
    const p = g.getAttribute("position")!;
    const idx = g.getIndex();
    const n = idx ? idx.count : p.count;
    const base = new THREE.Color(couleur);
    for (let i = 0; i < n; i++) {
      // Une nuance par facette : l'aspect « fait main » du jeu.
      if (i % 3 === 0) {
        base.getHSL(this.hsl);
        this.c.setHSL(this.hsl.h, this.hsl.s, Math.min(1, Math.max(0, this.hsl.l + (this.al() - 0.5) * 2 * nuance)));
      }
      const k = idx ? idx.getX(i) : i;
      this.pos.push(p.getX(k), p.getY(k), p.getZ(k));
      this.col.push(this.c.r, this.c.g, this.c.b);
    }
    g.dispose();
  }
  get triangles(): number {
    return this.pos.length / 9;
  }
  /** Géométrie non indexée, occlusion cuite au ras du sol. */
  geometrie(occlusion = 0.05, force = 0.25): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    const col = Float32Array.from(this.col);
    for (let i = 0; i < col.length; i += 3) {
      const t = Math.min(1, Math.max(0, this.pos[i + 1]! / occlusion));
      const k = 1 - force * (1 - t * t * (3 - 2 * t));
      col[i]! *= k;
      col[i + 1]! *= k;
      col[i + 2]! *= k;
    }
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }
}

function bosseler(g: THREE.BufferGeometry, ampleur: number, a: () => number): THREE.BufferGeometry {
  const p = g.getAttribute("position")!;
  const d = new Map<string, THREE.Vector3>();
  for (let i = 0; i < p.count; i++) {
    const cle = `${p.getX(i).toFixed(4)}|${p.getY(i).toFixed(4)}|${p.getZ(i).toFixed(4)}`;
    let v = d.get(cle);
    if (!v) d.set(cle, (v = new THREE.Vector3((a() - 0.5) * 2, (a() - 0.5) * 2, (a() - 0.5) * 2).multiplyScalar(ampleur)));
    p.setXYZ(i, p.getX(i) + v.x, p.getY(i) + v.y, p.getZ(i) + v.z);
  }
  return g;
}

// ---------- Les 12 silhouettes de la maquette, dessinées en blanc là où la teinte de l'objet s'applique ----------
const SOMBRE = 0x2e2c2a;
const ALU = 0xc9ccd0;
const B = 0xffffff;
type Dessin = (b: Pieces, a: () => number) => void;
const SILHOUETTES: Record<string, Dessin> = {
  cylindre: (b) => {
    b.ajouter(new THREE.CylinderGeometry(0.035, 0.035, 0.12, 7, 1).scale(1, 1, 0.7).rotateZ(Math.PI / 2).translate(0, 0.025, 0), B);
    b.ajouter(new THREE.CylinderGeometry(0.03, 0.03, 0.005, 7).rotateZ(Math.PI / 2).translate(0.063, 0.025, 0), ALU);
  },
  boite: (b, a) => {
    b.ajouter(bosseler(new THREE.BoxGeometry(0.4, 0.2, 0.3, 2, 1, 2), 0.015, a).translate(0, 0.1, 0), B);
    b.ajouter(new THREE.BoxGeometry(0.41, 0.012, 0.06).translate(0, 0.2, 0), 0xc9b48a);
  },
  plaque: (b) => {
    b.ajouter(new THREE.BoxGeometry(0.3, 0.008, 0.21).translate(0, 0.006, 0), B, 0.06);
    b.ajouter(new THREE.BoxGeometry(0.2, 0.004, 0.06).translate(-0.02, 0.012, -0.05), 0xc8362b);
  },
  chiffon: (b, a) => {
    b.ajouter(bosseler(new THREE.IcosahedronGeometry(0.2, 1), 0.05, a).scale(1.3, 0.22, 1).translate(0, 0.03, 0), B, 0.08);
  },
  coussin: (b, a) => {
    b.ajouter(bosseler(new THREE.BoxGeometry(0.55, 0.14, 0.36, 3, 1, 2), 0.02, a).translate(0, 0.07, 0), B, 0.05);
  },
  barre: (b) => {
    b.ajouter(new THREE.CylinderGeometry(0.018, 0.018, 1.1, 5).rotateZ(Math.PI / 2).translate(0, 0.018, 0), B);
    b.ajouter(new THREE.BoxGeometry(0.05, 0.035, 0.05).translate(0.53, 0.02, 0), SOMBRE);
  },
  roue: (b) => {
    b.ajouter(new THREE.TorusGeometry(0.28, 0.1, 5, 12).rotateX(Math.PI / 2).translate(0, 0.08, 0), B, 0.03);
  },
  ressort: (b) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      pts.push(new THREE.Vector3(Math.cos(t * Math.PI * 11) * 0.07, Math.sin(t * Math.PI * 11) * 0.07 + 0.08, (t - 0.5) * 0.36));
    }
    b.ajouter(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.012, 3), B, 0.05);
  },
  appareil: (b) => {
    b.ajouter(new THREE.BoxGeometry(0.22, 0.07, 0.15).translate(0, 0.035, 0), B);
    b.ajouter(new THREE.BoxGeometry(0.15, 0.004, 0.09).translate(0, 0.072, 0), 0x2b3440);
  },
  lame: (b) => {
    b.ajouter(new THREE.CylinderGeometry(0.15, 0.15, 0.01, 10).translate(0, 0.01, 0), B, 0.03);
    b.ajouter(new THREE.CylinderGeometry(0.025, 0.025, 0.014, 6).translate(0, 0.012, 0), SOMBRE);
  },
  velo: (b) => {
    for (const x of [-0.5, 0.5]) b.ajouter(new THREE.TorusGeometry(0.32, 0.022, 3, 14).rotateX(Math.PI / 2).translate(x, 0.025, 0), SOMBRE, 0.02);
    const tube = (x1: number, z1: number, x2: number, z2: number) => {
      const d = Math.hypot(x2 - x1, z2 - z1);
      b.ajouter(new THREE.CylinderGeometry(0.02, 0.02, d, 4).rotateZ(Math.PI / 2).rotateY(-Math.atan2(z2 - z1, x2 - x1)).translate((x1 + x2) / 2, 0.05, (z1 + z2) / 2), B);
    };
    tube(-0.5, 0, -0.05, 0.02);
    tube(-0.05, 0.02, 0.4, -0.02);
    tube(0.4, -0.02, 0.5, 0);
    tube(-0.05, 0.02, -0.15, -0.02);
    tube(-0.15, -0.02, 0.4, -0.02);
    b.ajouter(new THREE.BoxGeometry(0.16, 0.03, 0.05).translate(-0.18, 0.08, 0), SOMBRE);
  },
  sac: (b, a) => {
    b.ajouter(bosseler(new THREE.IcosahedronGeometry(0.13, 1), 0.04, a).scale(1, 0.45, 0.8).translate(0, 0.04, 0), B, 0.07);
  },
};
const NOMS = Object.keys(SILHOUETTES);
/** Les teintes de l'Abondance (Book 21 §5.3.1), franches puisque tout se ramasse. */
const TEINTES: Record<string, number[]> = {
  cylindre: [0xc8362b, 0x2f6fa4, 0xd8c43a, 0x9cc8d8, 0x3a7a4a],
  boite: [0xa88a5c, 0x9a7d52, 0xc9b48a],
  plaque: [0xe8e0c8, 0xf4ecd8, 0xd8ccb0, 0xc8d8e0],
  chiffon: [0x3b5a8c, 0x8a3b2a, 0x6b7b8c, 0xd8ccb0],
  coussin: [0xf4ecd8, 0xe8a8b8],
  barre: [0x6b6862, 0x5c5953],
  roue: [0x2b2b2b],
  ressort: [0xa4552f],
  appareil: [0xd6d2ca, 0x2b2b2b, 0x55606a],
  lame: [0xb8bcc0],
  velo: [0x4a8ac2, 0xc8362b, 0x5f7f45],
  sac: [0xe8e4dc, 0x2a2c30, 0x2f6fa4, 0xe8743a],
};
/** Beaucoup de petit (papiers, canettes, sacs), un peu de gros (pneus, cartons, vélos). */
const POIDS: Record<string, number> = { cylindre: 8, plaque: 9, sac: 8, boite: 3, chiffon: 3, roue: 1.2, barre: 1, appareil: 1, coussin: 0.6, lame: 0.4, ressort: 0.2, velo: 0.15 };
function tirer(a: () => number): string {
  const total = Object.values(POIDS).reduce((s, x) => s + x, 0);
  let r = a() * total;
  for (const [k, w] of Object.entries(POIDS)) {
    r -= w;
    if (r <= 0) return k;
  }
  return "plaque";
}

interface Piece {
  nom: string;
  matrice: THREE.Matrix4;
  teinte: THREE.Color;
  carreau: string;
}

export interface BilanDechets {
  mode: ModeDechets;
  pieces: number;
  amas: number;
  carreaux: number;
  /** Triangles de toutes les pièces posées (pas seulement celles à l'écran). */
  triangles: number;
  /** Le navigateur sait dessiner en multiple (WEBGL_multi_draw) : le lot unique tient en un appel. */
  multiDraw: boolean;
}

/**
 * Construit la couche simulée autour de (cx, cz). `densite` : 1 = densité réaliste (≈ 0,12 pièce/m² en moyenne :
 * 30 % des carreaux en bord de route ou parking à 0,3/m², les autres en prairie à 0,05/m²).
 */
export function creerDechets(mode: ModeDechets, cx: number, cz: number, densite: number, ombres: boolean, rendu: THREE.WebGLRenderer): { objet: THREE.Group; bilan: BilanDechets } {
  const objet = new THREE.Group();
  objet.userData.poste = "déchets";
  const multiDraw = rendu.extensions.has("WEBGL_multi_draw");
  const bilan: BilanDechets = { mode, pieces: 0, amas: 0, carreaux: 0, triangles: 0, multiDraw };
  if (mode === "aucun") return { objet, bilan };

  const al = aleatoire(2027);
  const pieces: Piece[] = [];
  const taches: THREE.Matrix4[] = [];
  const x0 = Math.floor(cx / CARREAU) - RAYON_CARREAUX;
  const z0 = Math.floor(cz / CARREAU) - RAYON_CARREAUX;
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  for (let i = 0; i <= RAYON_CARREAUX * 2; i++) {
    for (let j = 0; j <= RAYON_CARREAUX * 2; j++) {
      const carreau = `${x0 + i},${z0 + j}`;
      bilan.carreaux++;
      const bord = al() < 0.3;
      const nbPieces = Math.round(CARREAU * CARREAU * (bord ? 0.3 : 0.05) * densite);
      let posees = 0;
      while (posees < nbPieces) {
        // Un amas : une tache de crasse et 4 à 8 pièces serrées.
        const ax = (x0 + i) * CARREAU + al() * CARREAU;
        const az = (z0 + j) * CARREAU + al() * CARREAU;
        const r = 0.35 + al() * 0.4;
        taches.push(new THREE.Matrix4().compose(new THREE.Vector3(ax, 0.004, az), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), al() * 6.28), new THREE.Vector3(r, 1, r * (0.7 + al() * 0.5))));
        bilan.amas++;
        const nb = 4 + Math.floor(al() * 5);
        for (let k = 0; k < nb && posees < nbPieces; k++, posees++) {
          const nom = tirer(al);
          const teintes = TEINTES[nom]!;
          const s = 1.15 * (0.9 + al() * 0.3);
          e.set((al() - 0.5) * 0.3, al() * 6.28, (al() - 0.5) * 0.3);
          pieces.push({
            nom,
            carreau,
            matrice: new THREE.Matrix4().compose(new THREE.Vector3(ax + (al() - 0.5) * r * 1.4, -0.005, az + (al() - 0.5) * r * 1.4), q.setFromEuler(e), new THREE.Vector3(s, s, s)),
            teinte: new THREE.Color(teintes[Math.floor(al() * teintes.length)]!),
          });
        }
      }
    }
  }
  bilan.pieces = pieces.length;

  // Les modèles, une fois.
  const modeles = new Map<string, THREE.BufferGeometry>();
  NOMS.forEach((nom, i) => {
    const b = new Pieces(i + 3);
    SILHOUETTES[nom]!(b, aleatoire(i + 11));
    modeles.set(nom, b.geometrie());
  });
  const triangles = (nom: string) => modeles.get(nom)!.getAttribute("position")!.count / 3;
  for (const p of pieces) bilan.triangles += triangles(p.nom);

  const materiau = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.05, flatShading: true });

  // Les taches de crasse : un seul lot pour tout le lieu (1 appel, jamais d'ombre).
  const forme = (() => {
    const pts: THREE.Vector2[] = [];
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      const d = 0.75 + Math.sin(k * 2.3) * 0.25;
      pts.push(new THREE.Vector2(Math.cos(a) * d, Math.sin(a) * d));
    }
    return new THREE.ShapeGeometry(new THREE.Shape(pts)).rotateX(Math.PI / 2);
  })();
  const lotTaches = new THREE.InstancedMesh(forme, new THREE.MeshStandardMaterial({ color: 0x5a5444, roughness: 1, transparent: true, opacity: 0.55, depthWrite: false }), taches.length);
  taches.forEach((m, i) => lotTaches.setMatrixAt(i, m));
  lotTaches.receiveShadow = true;
  lotTaches.computeBoundingSphere();
  objet.add(lotTaches);

  if (mode === "instancie") {
    for (const nom of NOMS) {
      const liste = pieces.filter((p) => p.nom === nom);
      if (liste.length === 0) continue;
      const im = new THREE.InstancedMesh(modeles.get(nom)!, materiau, liste.length);
      liste.forEach((p, i) => {
        im.setMatrixAt(i, p.matrice);
        im.setColorAt(i, p.teinte);
      });
      im.castShadow = ombres;
      im.receiveShadow = true;
      im.computeBoundingSphere();
      objet.add(im);
    }
  } else if (mode === "lot") {
    let sommets = 0;
    for (const g of modeles.values()) sommets += g.getAttribute("position")!.count;
    const lot = new THREE.BatchedMesh(pieces.length, sommets, 0, materiau);
    const ids = new Map<string, number>();
    for (const [nom, g] of modeles) ids.set(nom, lot.addGeometry(g));
    for (const p of pieces) {
      const id = lot.addInstance(ids.get(p.nom)!);
      lot.setMatrixAt(id, p.matrice);
      lot.setColorAt(id, p.teinte);
    }
    lot.castShadow = ombres;
    lot.receiveShadow = true;
    // Le tri par profondeur ne sert à rien pour des objets opaques : on garde l'écart hors champ, objet par objet.
    lot.sortObjects = false;
    objet.add(lot);
  } else {
    // Fusion : une géométrie par carreau, la teinte cuite dans les couleurs des sommets.
    const parCarreau = new Map<string, Piece[]>();
    for (const p of pieces) {
      const l = parCarreau.get(p.carreau) ?? [];
      l.push(p);
      parCarreau.set(p.carreau, l);
    }
    const v = new THREE.Vector3();
    const n = new THREE.Vector3();
    const normale = new THREE.Matrix3();
    for (const liste of parCarreau.values()) {
      let total = 0;
      for (const p of liste) total += modeles.get(p.nom)!.getAttribute("position")!.count;
      const pos = new Float32Array(total * 3);
      const nor = new Float32Array(total * 3);
      const col = new Float32Array(total * 3);
      let o = 0;
      for (const p of liste) {
        const g = modeles.get(p.nom)!;
        const gp = g.getAttribute("position")!;
        const gn = g.getAttribute("normal")!;
        const gc = g.getAttribute("color")!;
        normale.getNormalMatrix(p.matrice);
        for (let k = 0; k < gp.count; k++, o += 3) {
          v.fromBufferAttribute(gp, k).applyMatrix4(p.matrice);
          n.fromBufferAttribute(gn, k).applyMatrix3(normale).normalize();
          pos[o] = v.x;
          pos[o + 1] = v.y;
          pos[o + 2] = v.z;
          nor[o] = n.x;
          nor[o + 1] = n.y;
          nor[o + 2] = n.z;
          col[o] = gc.getX(k) * p.teinte.r;
          col[o + 1] = gc.getY(k) * p.teinte.g;
          col[o + 2] = gc.getZ(k) * p.teinte.b;
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
      g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, materiau);
      m.castShadow = ombres;
      m.receiveShadow = true;
      objet.add(m);
    }
  }
  return { objet, bilan };
}

/** Libère les géométries et matériaux de la couche. */
export function libererDechets(objet: THREE.Object3D): void {
  objet.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    if ((o as THREE.BatchedMesh).isBatchedMesh) (o as THREE.BatchedMesh).dispose();
    if (m.material && !Array.isArray(m.material)) m.material.dispose();
  });
}
