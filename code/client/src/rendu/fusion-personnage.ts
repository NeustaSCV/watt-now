// Un personnage en un seul maillage (0.7, chantier 8) : même image, un appel de dessin au lieu de 10 à 17 (et autant
// dans l'ombre). À la halte, chaque joueur visible coûtait ≈ 28 appels ; la Coopérative a ses Éteints.
//
// Tout ce qui compose le personnage est versé dans le maillage du corps, sur le même squelette :
// - le corps et ses vêtements (déjà animés par ce squelette) ;
// - les yeux, les sourcils (animés par le même squelette, liés autrement : on les ramène dans le repère du corps) ;
// - les cheveux et les accessoires (bandana, lunettes, tablier, lampe, batterie, chapeau, hotte…), accrochés à un os :
//   ils deviennent des morceaux animés par cet os seul, à poids plein. La position à l'écran est la même :
//   os × (os au repos)⁻¹ × liaison × q = os × (repère de l'accessoire sous l'os) × p.
// Ce qui distinguait leurs matériaux (couleur, texture, rugosité, métal, émission, facettes, face avant seule, coupe
// des cheveux sous le chapeau) passe dans des attributs par sommet, lus par le matériau du personnage
// (humanoides.ts, `materiauPersonnage`), qui refait exactement les calculs de chaque matériau d'origine.
//
// Ce qui reste à part : l'arme en main (elle change), la lueur des yeux (transparente), et tout morceau qu'on ne sait
// pas reproduire à l'identique (autre type de matériau, transparence, autre texture que la couleur…).

import * as THREE from "three";

/** Le genre d'un morceau, pour le matériau du personnage. */
export const GENRE = { peau: 0, tissu: 1, yeux: 2, autre: 3 } as const;
/** Les drapeaux d'un morceau (somme) : facettes, face avant seule, couleurs par sommet. */
export const DRAPEAU = { facettes: 1, faceAvant: 2, couleursSommets: 4 } as const;
/** Le nombre de textures de couleur qu'un personnage peut mêler (peau, yeux, sourcils, cheveux). */
export const CARTES_MAX = 4;

export interface MorceauAFondre {
  maillage: THREE.Mesh;
  genre: (typeof GENRE)[keyof typeof GENRE];
}

export interface Fusion {
  geometrie: THREE.BufferGeometry;
  cartes: THREE.Texture[];
  /** Les maillages versés dans le corps (à retirer de la scène). */
  fondus: THREE.Mesh[];
}

const PROPRIETES_COMMUNES = ["fog", "toneMapped", "depthTest", "depthWrite", "depthFunc", "blending", "colorWrite", "polygonOffset", "dithering", "premultipliedAlpha", "alphaToCoverage", "alphaHash"] as const;
const AUTRES_TEXTURES = ["normalMap", "roughnessMap", "metalnessMap", "emissiveMap", "aoMap", "alphaMap", "bumpMap", "lightMap", "envMap", "displacementMap"] as const;

/** Une texture lue telle quelle (sans décalage ni répétition) : on peut la lire avec les coordonnées brutes. */
function carteSimple(t: THREE.Texture): boolean {
  return t.offset.x === 0 && t.offset.y === 0 && t.repeat.x === 1 && t.repeat.y === 1 && t.rotation === 0 && t.channel === 0;
}

/** Le matériau d'un morceau se refait-il à l'identique dans le matériau du personnage ? */
function reproductible(m: THREE.Material, reference: THREE.Material, genre: number, coupe: boolean): boolean {
  if (m.type !== "MeshStandardMaterial") return false;
  const s = m as THREE.MeshStandardMaterial;
  if (s.transparent || s.opacity !== 1 || s.alphaTest !== 0 || !s.visible || s.wireframe || s.side === THREE.BackSide || s.clippingPlanes) return false;
  if (AUTRES_TEXTURES.some((t) => s[t])) return false;
  if (s.map && !carteSimple(s.map)) return false;
  const retouche = s.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile;
  // Le corps et ses vêtements ont le shader du corps ; les cheveux sous le chapeau, leur coupe : tout le reste est intact.
  if (retouche && genre !== GENRE.peau && genre !== GENRE.tissu && !coupe) return false;
  for (const p of PROPRIETES_COMMUNES) if (s[p] !== (reference as THREE.MeshStandardMaterial)[p]) return false;
  return true;
}

/** L'os du squelette qui porte un maillage rigide (le premier parent qui en est un), ou -1. */
function osPorteur(m: THREE.Object3D, os: THREE.Bone[]): number {
  for (let o = m.parent; o; o = o.parent) {
    const i = os.indexOf(o as THREE.Bone);
    if (i >= 0) return i;
  }
  return -1;
}

const pareilles = (a: THREE.Matrix4, b: THREE.Matrix4) => a.elements.every((x, i) => Math.abs(x - b.elements[i]!) <= 1e-5 * (1 + Math.abs(x)));

/**
 * Prépare le maillage unique : `corps` (le maillage du corps, la cible) et ses morceaux (le corps en premier). Les
 * morceaux qu'on ne sait pas reproduire sont laissés de côté (ils restent dessinés à part). Null : rien à fondre.
 */
export function fondrePersonnage(corps: THREE.SkinnedMesh, morceaux: MorceauAFondre[], couleurYeux: THREE.Color | null): Fusion | null {
  const T = corps.skeleton;
  const reference = corps.material as THREE.Material;
  const liaisonInverse = corps.bindMatrix.clone().invert();
  const signeCorps = Math.sign(corps.matrixWorld.determinant());
  const cartes: THREE.Texture[] = [];

  interface Prepare {
    m: MorceauAFondre;
    D: THREE.Matrix4;
    /** Indices d'os dans le squelette du corps, par os du morceau (morceau animé), ou l'os porteur (rigide). */
    osDe: number[] | number;
    plan: THREE.Plane | null;
  }
  const prets: Prepare[] = [];
  for (const m of morceaux) {
    const g = m.maillage.geometry;
    const mat = m.maillage.material;
    if (Array.isArray(mat) || !g.getAttribute("position") || Object.keys(g.morphAttributes).length > 0) continue;
    if (m.maillage.castShadow !== corps.castShadow || m.maillage.receiveShadow !== corps.receiveShadow) continue;
    const planLocal = m.maillage.userData.planCoupe as THREE.Plane | undefined;
    if (!reproductible(mat, reference, m.genre, planLocal !== undefined)) continue;
    // Visible, lui et tous ses parents jusqu'au corps.
    let visible = true;
    for (let o: THREE.Object3D | null = m.maillage; o; o = o.parent) if (!o.visible) visible = false;
    if (!visible) continue;
    const s = m.maillage as THREE.SkinnedMesh;
    let D: THREE.Matrix4;
    let osDe: number[] | number;
    if (s.isSkinnedMesh) {
      if (s.bindMode !== THREE.AttachedBindMode) continue;
      if (s.skeleton === T && pareilles(s.bindMatrix, corps.bindMatrix)) {
        D = new THREE.Matrix4();
        osDe = T.bones.map((_, i) => i);
      } else {
        // Un autre squelette sur les mêmes os : le passage au repère du corps doit être le même pour chaque os.
        osDe = s.skeleton.bones.map((b) => T.bones.indexOf(b));
        if (osDe.some((j) => j < 0)) continue;
        let commun: THREE.Matrix4 | null = null;
        let ok = true;
        for (let k = 0; k < s.skeleton.bones.length && ok; k++) {
          const j = osDe[k]!;
          const Dk = liaisonInverse.clone().multiply(T.boneInverses[j]!.clone().invert()).multiply(s.skeleton.boneInverses[k]!).multiply(s.bindMatrix);
          if (!commun) commun = Dk;
          else if (!pareilles(commun, Dk)) ok = false;
        }
        if (!ok || !commun) continue;
        D = commun;
      }
    } else {
      const j = osPorteur(m.maillage, T.bones);
      if (j < 0) continue;
      const os = T.bones[j]!;
      D = liaisonInverse.clone().multiply(T.boneInverses[j]!.clone().invert()).multiply(os.matrixWorld.clone().invert()).multiply(m.maillage.matrixWorld);
      osDe = j;
    }
    const carte = (mat as THREE.MeshStandardMaterial).map;
    if (carte && m.genre !== GENRE.tissu && !cartes.includes(carte)) {
      if (cartes.length >= CARTES_MAX) continue;
      cartes.push(carte);
    }
    prets.push({ m, D, osDe, plan: planLocal ? planLocal.clone().applyMatrix4(D) : null });
  }
  if (prets.length < 2) return null;

  // Les tailles, puis les attributs morceau par morceau.
  let sommets = 0;
  let indices = 0;
  for (const p of prets) {
    const g = p.m.maillage.geometry;
    sommets += g.getAttribute("position").count;
    indices += g.index ? g.index.count : g.getAttribute("position").count;
  }
  const position = new Float32Array(sommets * 3);
  const normale = new Float32Array(sommets * 3);
  const uv = new Float32Array(sommets * 2);
  const osIndices = new Uint16Array(sommets * 4);
  const osPoids = new Float32Array(sommets * 4);
  const tenue = new Float32Array(sommets * 4);
  const piece = new Float32Array(sommets * 4);
  const teinte = new Float32Array(sommets * 4);
  const emission = new Float32Array(sommets * 3);
  const coupe = new Float32Array(sommets * 4);
  const sommet = new Float32Array(sommets * 3).fill(1);
  const index = new Uint32Array(indices);

  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  const matNormale = new THREE.Matrix3();
  let base = 0;
  let ib = 0;
  for (const p of prets) {
    const maillage = p.m.maillage;
    let g = maillage.geometry;
    if (!g.getAttribute("normal")) {
      g = g.clone();
      g.computeVertexNormals();
    }
    const mat = maillage.material as THREE.MeshStandardMaterial;
    const pos = g.getAttribute("position");
    const nor = g.getAttribute("normal");
    const tex = g.getAttribute("uv");
    const ten = g.getAttribute("tenue");
    const col = mat.vertexColors ? g.getAttribute("color") : undefined;
    const si = g.getAttribute("skinIndex");
    const sw = g.getAttribute("skinWeight");
    const nb = pos.count;
    matNormale.getNormalMatrix(p.D);
    const carte = mat.map && p.m.genre !== GENRE.tissu ? cartes.indexOf(mat.map) + 1 : 0;
    const drapeaux = (mat.flatShading ? DRAPEAU.facettes : 0) + (mat.side === THREE.FrontSide ? DRAPEAU.faceAvant : 0) + (col ? DRAPEAU.couleursSommets : 0);
    // Les yeux prennent leur couleur du matériau des yeux (elle change quand ils se ferment) : ici, blanc.
    const c = p.m.genre === GENRE.yeux && couleurYeux ? new THREE.Color(1, 1, 1) : mat.color;
    const e = mat.emissive.clone().multiplyScalar(mat.emissiveIntensity);
    for (let i = 0; i < nb; i++) {
      const k = base + i;
      v.fromBufferAttribute(pos, i).applyMatrix4(p.D);
      v.toArray(position, k * 3);
      n.fromBufferAttribute(nor, i).applyMatrix3(matNormale).normalize();
      n.toArray(normale, k * 3);
      if (tex) {
        uv[k * 2] = tex.getX(i);
        uv[k * 2 + 1] = tex.getY(i);
      }
      if (typeof p.osDe === "number") {
        osIndices[k * 4] = p.osDe;
        osPoids[k * 4] = 1;
      } else if (si && sw) {
        for (let q = 0; q < 4; q++) {
          osIndices[k * 4 + q] = p.osDe[si.getComponent(i, q)] ?? 0;
          osPoids[k * 4 + q] = sw.getComponent(i, q);
        }
      }
      if (ten) for (let q = 0; q < 4; q++) tenue[k * 4 + q] = ten.getComponent(i, q);
      piece[k * 4] = p.m.genre;
      piece[k * 4 + 1] = carte;
      piece[k * 4 + 2] = drapeaux;
      piece[k * 4 + 3] = mat.roughness;
      teinte[k * 4] = c.r;
      teinte[k * 4 + 1] = c.g;
      teinte[k * 4 + 2] = c.b;
      teinte[k * 4 + 3] = mat.metalness;
      emission[k * 3] = e.r;
      emission[k * 3 + 1] = e.g;
      emission[k * 3 + 2] = e.b;
      if (p.plan) {
        coupe[k * 4] = p.plan.normal.x;
        coupe[k * 4 + 1] = p.plan.normal.y;
        coupe[k * 4 + 2] = p.plan.normal.z;
        coupe[k * 4 + 3] = p.plan.constant;
      } else coupe[k * 4 + 3] = -1;
      if (col) {
        sommet[k * 3] = col.getX(i);
        sommet[k * 3 + 1] = col.getY(i);
        sommet[k * 3 + 2] = col.getZ(i);
      }
    }
    // Un morceau en miroir par rapport au corps : on retourne ses triangles pour garder la même face avant.
    const retourner = Math.sign(maillage.matrixWorld.determinant()) !== signeCorps;
    const idx = g.index;
    const total = idx ? idx.count : nb;
    for (let t = 0; t < total; t += 3) {
      const a = idx ? idx.getX(t) : t;
      const b = idx ? idx.getX(t + 1) : t + 1;
      const d = idx ? idx.getX(t + 2) : t + 2;
      index[ib++] = base + a;
      index[ib++] = base + (retourner ? d : b);
      index[ib++] = base + (retourner ? b : d);
    }
    base += nb;
  }

  const geometrie = new THREE.BufferGeometry();
  geometrie.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geometrie.setAttribute("normal", new THREE.BufferAttribute(normale, 3));
  geometrie.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geometrie.setAttribute("skinIndex", new THREE.BufferAttribute(osIndices, 4));
  geometrie.setAttribute("skinWeight", new THREE.BufferAttribute(osPoids, 4));
  geometrie.setAttribute("tenue", new THREE.BufferAttribute(tenue, 4));
  geometrie.setAttribute("aPiece", new THREE.BufferAttribute(piece, 4));
  geometrie.setAttribute("aTeinte", new THREE.BufferAttribute(teinte, 4));
  geometrie.setAttribute("aEmission", new THREE.BufferAttribute(emission, 3));
  geometrie.setAttribute("aCoupe", new THREE.BufferAttribute(coupe, 4));
  geometrie.setAttribute("aSommet", new THREE.BufferAttribute(sommet, 3));
  geometrie.setIndex(new THREE.BufferAttribute(index, 1));
  return { geometrie, cartes, fondus: prets.map((p) => p.m.maillage) };
}
