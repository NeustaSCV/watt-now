// Les lots : beaucoup d'objets fixes dessinés en un seul appel, chacun trié hors champ (0.7, chantier 8). Même image.
//
// - `LotTrie` : un `BatchedMesh` de three.js (dessin multiple, `WEBGL_multi_draw`, présent dans Safari sur l'iPhone
//   13 mini, relevé du 2026-10-09). Chaque objet du lot est écarté s'il est hors du champ de la caméra ; dans la passe
//   d'ombre, s'il ne peut pas jeter d'ombre à l'écran (même règle que rendu/ombres.ts, objet par objet).
// - `LotsDeRessources` : toutes les ressources du lieu (joncs, buissons, fruitiers, champignons, épaves, branches…)
//   regroupées par matériau. Avant, chacune coûtait de 1 à 5 appels (un par finition : mat, toile, sol, métal…), et
//   autant dans l'ombre. Les morceaux qu'on montre ou cache (fruits, fleurs, contenu fouillé, tiges qui repoussent)
//   sont des objets du lot qu'on allume ou éteint.
// - `trierParInstance` : un `InstancedMesh` (forêt, herbes) remplacé par un lot trié : un arbre hors champ n'est plus
//   dessiné (à la halte, la forêt entière l'était : 60 000 triangles, plus son ombre).
//
// Pourquoi l'image ne change pas : un matériau à couleur unie devient le même matériau en blanc, avec sa couleur
// portée par l'objet du lot (dans le shader, couleur × 1 = couleur) ; un matériau à couleurs par sommet garde les
// siennes. Rugosité, métal, émission, faces, ombres : on ne regroupe que des matériaux identiques sur tout le reste.
//
// Le greffon « brouillard » de la vue par pièce (0.7.2, carte-vue.ts) est le seul retouche de nuanceur qu'on accepte :
// il est le même pour tous (une seule fonction, une seule clé de cache), et il lit la position dans le monde à travers
// la matrice de l'objet du lot. Un matériau brouillé se regroupe avec les matériaux brouillés identiques ; son lot est
// brouillé à son tour. Sans cela, revenir dans un lieu à murs défaisait tous les lots (un appel par morceau).

import * as THREE from "three";
import { brouiller, estBrouille } from "./carte-vue.ts";
import { FrustumOmbre } from "./ombres.ts";

const sphere = new THREE.Sphere();
const matrice = new THREE.Matrix4();

/**
 * Le mode mesure (`?mesure=1`) compare l'image avec et sans regroupement : on garde alors de quoi revenir au dessin
 * d'avant (`basculerRegroupements`). Sinon, rien n'est gardé.
 */
const MESURE = typeof location !== "undefined" ? new URLSearchParams(location.search).get("mesure") : null;
const COMPARER = MESURE !== null && MESURE !== "0";
const bascules = new Set<(fondu: boolean) => void>();

/** Mode mesure : revenir au dessin d'avant (false) ou au dessin regroupé (true), pour comparer les deux images. */
export function basculerRegroupements(fondu: boolean): void {
  for (const b of bascules) b(fondu);
}
/** Pour les autres regroupements (personnages) : une bascule de plus, si le mode mesure compare. */
export function enregistrerBascule(b: (fondu: boolean) => void): (() => void) | null {
  if (!COMPARER) return null;
  bascules.add(b);
  return () => bascules.delete(b);
}

/** Un lot à tri objet par objet, dans l'image (champ de la caméra) comme dans l'ombre (ombre visible à l'écran). */
export class LotTrie extends THREE.BatchedMesh {
  /** Les sphères englobantes de chaque objet, dans le repère du lot (les objets ne bougent pas). */
  private spheres: THREE.Sphere[] = [];
  private readonly ecartes: number[] = [];

  constructor(objets: number, sommets: number, indices: number, materiau: THREE.Material) {
    super(objets, sommets, indices, materiau);
    // L'ordre de dessin ne change rien à des objets opaques : on s'épargne le tri à chaque image.
    this.sortObjects = false;
  }

  override setMatrixAt(instanceId: number, m: THREE.Matrix4): this {
    super.setMatrixAt(instanceId, m);
    this.spheres = [];
    return this;
  }

  override onBeforeShadow(...args: Parameters<THREE.BatchedMesh["onBeforeShadow"]>): void {
    const f = FrustumOmbre.courant;
    // Seulement l'ombre du soleil (args[3] : la caméra de la passe d'ombre) ; celle d'une lampe garde le tri de three.js.
    if (f?.actif && args[3] === f.cameraOmbre) {
      if (this.spheres.length !== this.instanceCount) {
        this.spheres = [];
        for (let i = 0; i < this.instanceCount; i++) {
          this.getMatrixAt(i, matrice);
          this.spheres.push((this.getBoundingSphereAt(this.getGeometryIdAt(i), new THREE.Sphere()) ?? new THREE.Sphere(new THREE.Vector3(), Infinity)).applyMatrix4(matrice));
        }
      }
      for (let i = 0; i < this.spheres.length; i++) {
        if (!this.getVisibleAt(i)) continue;
        if (f.ombreDansLeChamp(sphere.copy(this.spheres[i]!).applyMatrix4(this.matrixWorld))) continue;
        this.setVisibleAt(i, false);
        this.ecartes.push(i);
      }
    }
    super.onBeforeShadow(...args);
    for (const i of this.ecartes) this.setVisibleAt(i, true);
    this.ecartes.length = 0;
  }
}

/** Les attributs gardés dans un lot : position, normale, couleur (le reste ne sert pas sans texture). */
function preparerGeometrie(source: THREE.BufferGeometry, couleursParSommet: boolean): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", source.getAttribute("position"));
  if (source.getAttribute("normal")) g.setAttribute("normal", source.getAttribute("normal"));
  else {
    g.setIndex(source.getIndex());
    g.computeVertexNormals();
  }
  const n = source.getAttribute("position").count;
  const couleur = couleursParSommet ? source.getAttribute("color") : null;
  if (couleur && couleur.itemSize === 3) g.setAttribute("color", couleur);
  else if (couleur) {
    const c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) c.set([couleur.getX(i), couleur.getY(i), couleur.getZ(i)], i * 3);
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  } else g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
  const index = source.getIndex();
  if (index) g.setIndex(index);
  else g.setIndex(Array.from({ length: n }, (_, i) => i));
  return g;
}

const TEXTURES = ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap", "aoMap", "alphaMap", "bumpMap", "lightMap", "envMap", "displacementMap"] as const;
const SIGNATURES = new WeakMap<THREE.Material, string | null>();

/**
 * Ce qui doit être identique pour partager un lot : tout le matériau sauf sa couleur (portée par l'objet du lot).
 * Null : matériau qu'on ne regroupe pas (texture, transparence, shader retouché, autre type). Le greffon « brouillard »
 * n'empêche pas de regrouper : il entre dans la signature (0.7.2).
 */
function signature(m: THREE.Material): string | null {
  // Pas de cache pour un matériau qu'on brouillera peut-être plus tard : sa signature changera.
  const brouille = estBrouille(m);
  const cle = SIGNATURES.get(m);
  if (cle !== undefined && (cle === null || cle.endsWith("|brouillard") === brouille)) return cle;
  let s: string | null = null;
  const std = m as THREE.MeshStandardMaterial;
  const retouche = !brouille && (m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile || m.customProgramCacheKey !== THREE.Material.prototype.customProgramCacheKey);
  if (m.type === "MeshStandardMaterial" && !m.transparent && m.opacity === 1 && m.alphaTest === 0 && m.visible && !retouche && !std.wireframe && TEXTURES.every((t) => !std[t])) {
    const json = m.toJSON() as unknown as Record<string, unknown>;
    for (const cle of ["uuid", "name", "color", "vertexColors", "metadata"]) delete json[cle];
    s = JSON.stringify(json) + (brouille ? "|brouillard" : "");
  }
  SIGNATURES.set(m, s);
  return s;
}

interface Morceau {
  maillage: THREE.Mesh;
  parent: THREE.Object3D;
  /** Le maillage et ses parents, jusqu'à l'objet de la ressource : visible si tous le sont. */
  chaine: THREE.Object3D[];
  matrice: THREE.Matrix4;
  cle: string;
  lot?: LotTrie;
  id?: number;
}

/** Ce qui se dessine en lot : un maillage simple, fixe, d'un matériau qu'on sait regrouper. */
function regroupable(m: THREE.Mesh): boolean {
  const o = m as THREE.Mesh & { isInstancedMesh?: boolean; isSkinnedMesh?: boolean; isBatchedMesh?: boolean };
  if (!m.isMesh || o.isInstancedMesh || o.isSkinnedMesh || o.isBatchedMesh || Array.isArray(m.material) || m.userData.intact) return false;
  const g = m.geometry;
  // (Les groupes d'une géométrie ne comptent pas : avec un seul matériau, three.js la dessine en entier.)
  if (!g.getAttribute("position") || Object.keys(g.morphAttributes).length > 0) return false;
  if (g.drawRange.start !== 0 || g.drawRange.count !== Infinity) return false;
  return signature(m.material) !== null;
}

/** Toutes les ressources du lieu, regroupées par matériau (voir l'en-tête). */
export class LotsDeRessources {
  readonly groupe = new THREE.Group();
  private morceaux = new Map<object, Morceau[]>();
  private lots: LotTrie[] = [];
  private fondu = true;
  private readonly bascule: (fondu: boolean) => void;

  constructor() {
    this.groupe.name = "lots de ressources";
    this.bascule = (fondu) => this.basculer(fondu);
  }

  /**
   * Prend les maillages regroupables d'une ressource (à appeler une fois ses morceaux fondus, fusion.ts). Ils
   * quittent l'objet de la ressource, qui garde le reste, sa place et ses données. `surVisibilite` : la ressource
   * prévient quand elle (ou un de ses morceaux) apparaît ou disparaît.
   */
  prendre(vue: { objet: THREE.Object3D; surVisibilite: ((visible: boolean) => void) | null }): void {
    const racine = vue.objet;
    racine.updateMatrixWorld(true);
    const liste: Morceau[] = [];
    racine.traverse((n) => {
      const m = n as THREE.Mesh;
      if (n === racine || !regroupable(m) || m.children.length > 0) return;
      // Sous un objet intact (pièce animée), rien ne se regroupe.
      const chaine: THREE.Object3D[] = [];
      for (let o: THREE.Object3D | null = m; o; o = o === racine ? null : o.parent) {
        if (o.userData.intact) return;
        chaine.push(o);
      }
      const mat = m.material as THREE.MeshStandardMaterial;
      liste.push({ maillage: m, parent: m.parent!, chaine, matrice: m.matrixWorld.clone(), cle: `${signature(mat)}|${m.castShadow}|${m.receiveShadow}` });
    });
    for (const x of liste) x.parent.remove(x.maillage);
    this.morceaux.set(vue, liste);
    vue.surVisibilite = () => this.majVisibilite(vue);
  }

  /** Construit les lots, une fois toutes les ressources prises. */
  construire(): void {
    const parCle = new Map<string, Morceau[]>();
    for (const liste of this.morceaux.values()) {
      for (const x of liste) {
        const l = parCle.get(x.cle) ?? [];
        l.push(x);
        parCle.set(x.cle, l);
      }
    }
    for (const liste of parCle.values()) {
      // Une géométrie partagée (branches, pierres, bûches…) n'est copiée qu'une fois dans le lot.
      const geometries = new Map<THREE.BufferGeometry, THREE.BufferGeometry>();
      for (const x of liste) {
        if (!geometries.has(x.maillage.geometry)) geometries.set(x.maillage.geometry, preparerGeometrie(x.maillage.geometry, (x.maillage.material as THREE.Material).vertexColors));
      }
      let sommets = 0;
      let indices = 0;
      for (const g of geometries.values()) {
        sommets += g.getAttribute("position").count;
        indices += g.getIndex()!.count;
      }
      const modele = liste[0]!.maillage;
      const materiau = (modele.material as THREE.MeshStandardMaterial).clone();
      materiau.color.setRGB(1, 1, 1);
      materiau.vertexColors = true;
      // Le clone ne garde pas le greffon : on le repose (même fonction, même clé de cache, même programme).
      if (estBrouille(modele.material as THREE.Material)) brouiller(materiau);
      const lot = new LotTrie(liste.length, sommets, indices, materiau);
      lot.castShadow = modele.castShadow;
      lot.receiveShadow = modele.receiveShadow;
      const ids = new Map<THREE.BufferGeometry, number>();
      for (const [source, g] of geometries) ids.set(source, lot.addGeometry(g));
      for (const x of liste) {
        const id = lot.addInstance(ids.get(x.maillage.geometry)!);
        lot.setMatrixAt(id, x.matrice);
        lot.setColorAt(id, (x.maillage.material as THREE.MeshStandardMaterial).color);
        x.lot = lot;
        x.id = id;
      }
      lot.computeBoundingSphere();
      this.lots.push(lot);
      this.groupe.add(lot);
    }
    for (const vue of this.morceaux.keys()) this.majVisibilite(vue);
    if (COMPARER) bascules.add(this.bascule);
  }

  private majVisibilite(vue: object): void {
    for (const x of this.morceaux.get(vue) ?? []) {
      if (x.lot === undefined || x.id === undefined) continue;
      x.lot.setVisibleAt(x.id, x.chaine.every((o) => o.visible));
    }
  }

  /** Mode mesure : les maillages d'origine reprennent leur place (false), ou le lot dessine (true). */
  private basculer(fondu: boolean): void {
    if (fondu === this.fondu) return;
    this.fondu = fondu;
    for (const liste of this.morceaux.values()) for (const x of liste) (fondu ? x.parent.remove(x.maillage) : x.parent.add(x.maillage));
    this.groupe.visible = fondu;
  }

  vider(): void {
    this.basculer(true);
    bascules.delete(this.bascule);
    for (const lot of this.lots) {
      lot.dispose();
      (lot.material as THREE.Material).dispose();
    }
    this.groupe.clear();
    this.lots = [];
    this.morceaux.clear();
  }
}

/**
 * Remplace un `InstancedMesh` par un lot trié objet par objet (même géométrie, même matériau, mêmes couleurs) : un
 * arbre ou une touffe hors champ n'est plus dessiné. Renvoie le lot, à mettre à la place de l'original.
 */
export function trierParInstance(im: THREE.InstancedMesh): LotTrie {
  const g = im.geometry;
  const lot = new LotTrie(Math.max(1, im.count), g.getAttribute("position").count, g.getIndex()?.count ?? 0, im.material as THREE.Material);
  const id = lot.addGeometry(g);
  const m = new THREE.Matrix4();
  const c = new THREE.Color();
  for (let i = 0; i < im.count; i++) {
    const k = lot.addInstance(id);
    im.getMatrixAt(i, m);
    lot.setMatrixAt(k, m);
    if (im.instanceColor) {
      im.getColorAt(i, c);
      lot.setColorAt(k, c);
    }
  }
  lot.castShadow = im.castShadow;
  lot.receiveShadow = im.receiveShadow;
  lot.name = im.name;
  lot.position.copy(im.position);
  lot.quaternion.copy(im.quaternion);
  lot.scale.copy(im.scale);
  lot.computeBoundingSphere();
  if (COMPARER) {
    // Pour comparer : l'original attend, caché, à côté du lot.
    let fondu = true;
    bascules.add((oui) => {
      if (oui === fondu) return;
      fondu = oui;
      const parent = (oui ? im : lot).parent;
      if (!parent) return;
      parent.add(oui ? lot : im);
      parent.remove(oui ? im : lot);
    });
  }
  return lot;
}
