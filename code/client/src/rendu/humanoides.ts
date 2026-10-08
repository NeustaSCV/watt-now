// Les humains et les Éteints en 3D (Book 18 §4.2, Book 21 §5.2.1 et §5.7) : un squelette commun, des corps libres
// de droits (Quaternius, CC0) retravaillés, et une bibliothèque d'animations partagée.
// Les fichiers sont préparés par scripts/preparer-personnages.mjs (corps simplifiés, animations triées).
//
// Ce que ce module ajoute aux corps d'origine :
// - les proportions du jeu (≈ 4,8 têtes, Book 18 §4) : la tête est agrandie, le tout ramené à ≈ 1,75 m ;
// - la tenue peinte par zones (chaque point du corps sait à quels os il tient : torse, bras, jambes, pieds),
//   le tissu légèrement gonflé ; le visage et les mains gardent la peau, teintée selon la carnation ;
// - le sang sur les vêtements (aucune plaie visible, Book 21 §3.5) et, pour les Éteints, les déchirures.

import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { clone as clonerSquelette } from "three/examples/jsm/utils/SkeletonUtils.js";
import { colorer, tailler, zonesDesSommets, type Piece, type Zone } from "./vetements.ts";

const BASE = "/assets/personnages/";

export type Genre = "femme" | "homme";
export type Coiffure = "buns" | "long" | "simpleparted" | "buzzed" | "buzzedfemale" | "beard";

/** La tenue : une couleur par pièce (null : la peau reste visible). */
export interface Tenue {
  haut: number;
  manche: number | null;
  bas: number;
  pieds: number;
  mains: number | null;
  /** Des déchirures où la peau apparaît (Éteints), de 0 à 1. */
  dechirures?: number;
  /** Une bande réfléchissante sur la veste (⚡) : couleur, et hauteur en fraction de la taille (de, à). */
  bande?: { couleur: number; de: number; a: number };
}

interface Bibliotheque {
  corps: Record<Genre, GLTF>;
  cheveux: Partial<Record<Coiffure, THREE.Object3D>>;
  clips: Map<string, THREE.AnimationClip>;
  /** Position de repos du bassin du mannequin des animations (pour adapter les pistes à nos corps). */
  bassinMannequin: THREE.Vector3;
}

/**
 * La tête pour laquelle chaque coupe du pack a été modelée. Posée telle quelle sur l'autre tête, elle tombe à côté :
 * la tête d'homme est plus haute et plus large, et une coupe de femme y laissait le haut du crâne nu (2026-10-08).
 */
const TETE_DE_LA_COUPE: Record<Coiffure, Genre> = {
  buns: "femme",
  long: "femme",
  simpleparted: "femme",
  buzzedfemale: "femme",
  buzzed: "homme",
  beard: "homme",
};

/** La boîte de la tête au repos (les sommets que l'os de la tête emporte), dans le repère du modèle chargé. */
const TETES = new Map<Genre, THREE.Box3>();
function boiteTete(genre: Genre): THREE.Box3 {
  const deja = TETES.get(genre);
  if (deja) return deja;
  const scene = bibliotheque!.corps[genre].scene;
  scene.updateMatrixWorld(true);
  const boite = new THREE.Box3();
  const v = new THREE.Vector3();
  scene.traverse((n) => {
    const m = n as THREE.SkinnedMesh;
    if (!m.isSkinnedMesh) return;
    const mat = m.material as THREE.Material;
    if (/eye|hair/i.test(mat.name)) return;
    const iTete = m.skeleton.bones.findIndex((b) => b.name === "Head");
    if (iTete < 0) return;
    const indices = m.geometry.getAttribute("skinIndex");
    const poids = m.geometry.getAttribute("skinWeight");
    for (let i = 0; i < indices.count; i++) {
      let p = 0;
      for (let k = 0; k < 4; k++) if (indices.getComponent(i, k) === iTete) p += poids.getComponent(i, k);
      if (p < 0.6) continue;
      m.getVertexPosition(i, v);
      boite.expandByPoint(v.applyMatrix4(m.matrixWorld));
    }
  });
  TETES.set(genre, boite);
  return boite;
}

/**
 * Ajuste une coupe faite pour la tête `de` à la tête `vers` : même sommet, même centre, et les proportions de la
 * nouvelle tête (largeur, hauteur, profondeur).
 */
function ajusterCoupe(de: Genre, vers: Genre): THREE.Matrix4 {
  const a = boiteTete(de);
  const b = boiteTete(vers);
  const ta = a.getSize(new THREE.Vector3());
  const tb = b.getSize(new THREE.Vector3());
  const sommetA = new THREE.Vector3((a.min.x + a.max.x) / 2, a.max.y, (a.min.z + a.max.z) / 2);
  const sommetB = new THREE.Vector3((b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2);
  return new THREE.Matrix4()
    .makeTranslation(sommetB.x, sommetB.y, sommetB.z)
    .multiply(new THREE.Matrix4().makeScale(tb.x / ta.x, tb.y / ta.y, tb.z / ta.z))
    .multiply(new THREE.Matrix4().makeTranslation(-sommetA.x, -sommetA.y, -sommetA.z));
}

let chargement: Promise<Bibliotheque> | null = null;
let bibliotheque: Bibliotheque | null = null;

/** Lance le chargement (une seule fois) ; à appeler tôt, pendant l'écran de chargement. */
export function chargerHumanoides(): Promise<Bibliotheque> {
  if (chargement) return chargement;
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const lire = (f: string) => loader.loadAsync(BASE + f);
  const coiffures: Coiffure[] = ["buns", "long", "simpleparted", "buzzed", "buzzedfemale", "beard"];
  chargement = (async () => {
    const [femme, homme, a1, a2, ...cheveux] = await Promise.all([
      lire("corps_femme.glb"),
      lire("corps_homme.glb"),
      lire("animations_1.glb"),
      lire("animations_2.glb"),
      ...coiffures.map((c) => lire(`cheveux_${c}.glb`)),
    ]);
    const clips = new Map<string, THREE.AnimationClip>();
    for (const c of [...a1.animations, ...a2.animations]) clips.set(c.name, c);
    const bassin = a1.scene.getObjectByName("pelvis");
    const b: Bibliotheque = {
      corps: { femme, homme },
      cheveux: Object.fromEntries(coiffures.map((c, i) => [c, cheveux[i]!.scene])),
      clips,
      bassinMannequin: bassin ? bassin.position.clone() : new THREE.Vector3(),
    };
    bibliotheque = b;
    return b;
  })();
  return chargement;
}

export function humanoidesPrets(): boolean {
  return bibliotheque !== null;
}

// ---------- Le matériau : peau, tissu, sang, déchirures ----------

/** Ce qui varie d'un personnage à l'autre, passé au shader. */
interface Reglages {
  peau: THREE.Color;
  taches: { value: number };
  dechirures: { value: number };
  graine: { value: number };
  /** Mètres par unité du maillage (le bruit du tissu et des taches est réglé en mètres). */
  echelle: { value: number };
  /** La verticale dans le repère du maillage, et la bande réfléchissante (de, à, en unités le long de la verticale). */
  haut: { value: THREE.Vector3 };
  bande: { value: THREE.Vector2 };
  couleurBande: { value: THREE.Color };
}

/** La teinte moyenne de la texture de peau d'origine : la carnation la remplace par un rapport. */
const PEAU_TEXTURE = new THREE.Color(0xc79a78);

/** `coquille` : un vêtement (tissu partout, troué pour les Éteints) ; sinon le corps (peau partout). */
function materiauCorps(origine: THREE.MeshStandardMaterial, r: Reglages, coquille: boolean): THREE.MeshStandardMaterial {
  const m = origine.clone();
  m.roughness = coquille ? 0.92 : 0.8;
  m.metalness = 0;
  m.vertexColors = false;
  if (coquille) m.map = null;
  const rapport = new THREE.Color(r.peau.r / PEAU_TEXTURE.r, r.peau.g / PEAU_TEXTURE.g, r.peau.b / PEAU_TEXTURE.b);
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      uPeau: { value: rapport },
      uTaches: r.taches,
      uDechirures: r.dechirures,
      uGraine: r.graine,
      uEchelle: r.echelle,
      uHaut: r.haut,
      uBande: r.bande,
      uCouleurBande: r.couleurBande,
      uCoquille: { value: coquille ? 1 : 0 },
    });
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        attribute vec4 tenue;
        varying vec4 vTenue;
        varying vec3 vRepos;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vTenue = tenue;
        vRepos = position;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform vec3 uPeau;
        uniform float uTaches;
        uniform float uDechirures;
        uniform float uGraine;
        uniform float uEchelle;
        uniform vec3 uHaut;
        uniform vec2 uBande;
        uniform vec3 uCouleurBande;
        uniform float uCoquille;
        varying vec4 vTenue;
        varying vec3 vRepos;
        float hachage(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719)) + uGraine) * 43758.5453); }
        float bruit(vec3 p) {
          vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(hachage(i), hachage(i + vec3(1,0,0)), f.x), mix(hachage(i + vec3(0,1,0)), hachage(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(hachage(i + vec3(0,0,1)), hachage(i + vec3(1,0,1)), f.x), mix(hachage(i + vec3(0,1,1)), hachage(i + vec3(1,1,1)), f.x), f.y), f.z);
        }`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        vec3 m = vRepos * uEchelle;
        if (uCoquille > 0.5) {
          // Déchirures (Éteints) : des trous où l'on voit la peau du dessous.
          if (uDechirures > 0.0 && bruit(m * 9.0 + 3.1) < uDechirures * 0.42) discard;
          // Le tissu : sa couleur, un grain léger, et une usure plus claire par endroits.
          float grain = bruit(m * 60.0) * 0.08 + bruit(m * 7.0) * 0.12;
          diffuseColor.rgb = vTenue.rgb * (0.88 + grain);
          // La bande réfléchissante, à hauteur de poitrine.
          float h = dot(vRepos, uHaut);
          if (uBande.y > uBande.x && h > uBande.x && h < uBande.y) diffuseColor.rgb = uCouleurBande;
        } else {
          diffuseColor.rgb *= uPeau;
        }
        // Le sang : des taches sombres, une de plus par blessure (aucune plaie visible).
        if (uTaches > 0.0 && bruit(m * 7.0 + 7.0) > 1.0 - uTaches * 0.035) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.04, 0.04), 0.85);`,
      );
  };
  m.customProgramCacheKey = () => "corps-watt-2";
  return m;
}

/**
 * Les coupes déjà taillées : un corps et une coupe de tenue (quelles pièces, quelle épaisseur) donnent toujours
 * les mêmes pièces ; seule la couleur change d'un personnage à l'autre. On ne taille donc qu'une fois.
 */
const COUPES = new Map<string, { corps: THREE.BufferAttribute | null; tenueCorps: THREE.BufferAttribute; pieces: THREE.BufferGeometry[] }>();

function cleDeCoupe(genre: Genre, pieces: Piece[], retirer: boolean): string {
  return `${genre}|${retirer}|` + pieces.map((p) => `${Object.keys(p.zones).join("+")}:${p.epaisseur}:${p.lissage}`).join("/");
}

/** Une géométrie qui partage les données d'une autre (sans les copier). */
function partager(source: THREE.BufferGeometry): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  for (const [nom, a] of Object.entries(source.attributes)) g.setAttribute(nom, a);
  g.setIndex(source.getIndex());
  g.userData = source.userData;
  return g;
}

/** Les pièces d'une tenue (l'ordre compte : une zone va à la première pièce qui la couvre). */
function piecesDe(t: Tenue): Piece[] {
  const veste: Partial<Record<Zone, number>> = { haut: t.haut };
  if (t.manche !== null) veste.manche = t.manche;
  const pieces: Piece[] = [
    { zones: veste, epaisseur: 0.024, lissage: 8 },
    { zones: { bas: t.bas }, epaisseur: 0.018, lissage: 6 },
    { zones: { pieds: t.pieds }, epaisseur: 0.02, lissage: 10 },
  ];
  if (t.mains !== null) pieces.push({ zones: { mains: t.mains }, epaisseur: 0.008, lissage: 2 });
  return pieces;
}

// ---------- L'humanoïde : un corps, ses animations ----------

export interface OptionsHumanoide {
  genre: Genre;
  peau: number;
  tenue: Tenue;
  coiffure?: Coiffure | null;
  couleurCheveux?: number;
  /** Agrandissement de la tête (proportions du jeu). */
  tete?: number;
  /** Hauteur finale en mètres. */
  hauteur?: number;
  /** Corpulence : facteur de largeur (1 : le corps d'origine). */
  largeur?: number;
  barbe?: boolean;
  /** Yeux d'Éteint : blancs, sans pupille. */
  yeuxBlancs?: boolean;
  graine?: number;
}

export class Humanoide {
  readonly objet = new THREE.Group();
  readonly mixer: THREE.AnimationMixer;
  private readonly modele: THREE.Object3D;
  private readonly os = new Map<string, THREE.Bone>();
  private readonly actions = new Map<string, THREE.AnimationAction>();
  private actuelle: THREE.AnimationAction | null = null;
  private readonly reglages: Reglages;
  private readonly materiauxYeux: THREE.MeshStandardMaterial[] = [];
  /** Le bassin au repos, dans le corps (les pistes du mannequin sont ramenées à ce repos). */
  private readonly bassinRepos = new THREE.Vector3();

  constructor(o: OptionsHumanoide) {
    const b = bibliotheque!;
    this.modele = clonerSquelette(b.corps[o.genre].scene);
    this.reglages = {
      peau: new THREE.Color(o.peau),
      taches: { value: 0 },
      dechirures: { value: o.tenue.dechirures ?? 0 },
      graine: { value: (o.graine ?? 0) % 97 },
      echelle: { value: 1 },
      haut: { value: new THREE.Vector3(0, 1, 0) },
      bande: { value: new THREE.Vector2(0, 0) },
      couleurBande: { value: new THREE.Color(o.tenue.bande?.couleur ?? 0xffffff) },
    };
    this.modele.traverse((n) => {
      if ((n as THREE.Bone).isBone) this.os.set(n.name, n as THREE.Bone);
    });
    this.modele.updateMatrixWorld(true);
    const vetements: [THREE.SkinnedMesh, THREE.SkinnedMesh][] = [];
    this.modele.traverse((n) => {
      const m = n as THREE.SkinnedMesh;
      if (!m.isSkinnedMesh && !(m as THREE.Mesh).isMesh) return;
      m.castShadow = true;
      m.frustumCulled = false;
      // Le pack range des masques dans les couleurs de sommet : ce ne sont pas des couleurs à afficher.
      m.geometry.deleteAttribute("color");
      const mat = m.material as THREE.MeshStandardMaterial;
      mat.vertexColors = false;
      if (/eye/i.test(mat.name) || /^eyes/i.test(m.name)) {
        // Les yeux : ceux des Éteints sont blancs et accrochent la lumière, même la nuit.
        const yeux = mat.clone();
        if (o.yeuxBlancs) {
          yeux.map = null;
          yeux.color.setHex(0xe9efe0);
          yeux.emissive.setHex(0x9aa58f);
          yeux.emissiveIntensity = 0.35;
        }
        m.material = yeux;
        this.materiauxYeux.push(yeux);
      } else if (/hair/i.test(mat.name)) {
        const poils = mat.clone();
        if (o.couleurCheveux !== undefined) poils.color.setHex(o.couleurCheveux);
        m.material = poils;
      } else if (m.isSkinnedMesh) {
        // Le corps : la peau, et les vêtements taillés dedans (une seule fois par coupe, voir COUPES).
        const geo = partager(m.geometry);
        m.geometry = geo;
        const unite = m.getWorldScale(new THREE.Vector3()).x;
        this.reglages.echelle.value = unite;
        // La verticale du monde, vue dans le repère du maillage, et la bande à sa hauteur.
        const haut = new THREE.Vector3(0, 1, 0).applyQuaternion(m.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize();
        this.reglages.haut.value.copy(haut);
        if (o.tenue.bande) {
          geo.computeBoundingBox();
          const p = geo.getAttribute("position");
          let min = Infinity;
          let max = -Infinity;
          for (let i = 0; i < p.count; i++) {
            const h = p.getX(i) * haut.x + p.getY(i) * haut.y + p.getZ(i) * haut.z;
            min = Math.min(min, h);
            max = Math.max(max, h);
          }
          this.reglages.bande.value.set(min + (max - min) * o.tenue.bande.de, min + (max - min) * o.tenue.bande.a);
        }
        const coupe = piecesDe(o.tenue);
        const retirer = !o.tenue.dechirures;
        const cle = cleDeCoupe(o.genre, coupe, retirer);
        let taillee = COUPES.get(cle);
        if (!taillee) {
          const zones = zonesDesSommets(geo, m.skeleton.bones);
          const pieces = tailler(geo, zones, coupe, unite, retirer);
          taillee = { corps: geo.getIndex(), tenueCorps: new THREE.BufferAttribute(new Float32Array(geo.getAttribute("position").count * 4), 4), pieces };
          COUPES.set(cle, taillee);
        }
        geo.setIndex(taillee.corps);
        geo.setAttribute("tenue", taillee.tenueCorps);
        m.material = materiauCorps(mat, this.reglages, false);
        for (const source of taillee.pieces) {
          const g = partager(source);
          colorer(g, coupe[source.userData.piece as number]!.zones);
          const v = new THREE.SkinnedMesh(g, materiauCorps(mat, this.reglages, true));
          v.castShadow = true;
          v.frustumCulled = false;
          vetements.push([m, v]);
        }
      }
    });
    for (const [corps, v] of vetements) {
      corps.parent!.add(v);
      v.position.copy(corps.position);
      v.quaternion.copy(corps.quaternion);
      v.scale.copy(corps.scale);
      v.bind(corps.skeleton, corps.bindMatrix);
    }

    // Les proportions du jeu : une tête plus grosse, puis le tout ramené à la bonne hauteur.
    const tete = this.os.get("Head");
    const boite = new THREE.Box3().setFromObject(this.modele, true);
    this.modele.updateMatrixWorld(true);
    const yTete = tete ? tete.getWorldPosition(new THREE.Vector3()).y : boite.max.y * 0.9;
    const s = o.tete ?? 1.3;
    const hauteurAvecTete = yTete - boite.min.y + (boite.max.y - yTete) * s;

    // Les cheveux (et la barbe) : posés sur la tête au repos, ils suivent ensuite l'os de la tête.
    const poils: Coiffure[] = [];
    if (o.coiffure) poils.push(o.coiffure);
    if (o.barbe) poils.push("beard");
    for (const coiffure of tete ? poils : []) {
      const cheveux = clonerSquelette(b.cheveux[coiffure]!);
      cheveux.updateMatrixWorld(true);
      // La coupe, ajustée à cette tête, puis rattachée à l'os de la tête.
      const inverse = tete!.matrixWorld.clone().invert().multiply(ajusterCoupe(TETE_DE_LA_COUPE[coiffure], o.genre));
      cheveux.traverse((n) => {
        const m = n as THREE.Mesh;
        if (!m.isMesh) return;
        const morceau = new THREE.Mesh(m.geometry, (m.material as THREE.MeshStandardMaterial).clone());
        if (o.couleurCheveux !== undefined) (morceau.material as THREE.MeshStandardMaterial).color.setHex(o.couleurCheveux);
        morceau.matrixAutoUpdate = false;
        morceau.matrix.copy(inverse).multiply(m.matrixWorld);
        morceau.castShadow = true;
        morceau.userData.cheveux = true;
        tete!.add(morceau);
      });
    }
    if (tete) tete.scale.setScalar(s);
    // La corpulence : un peu plus large et plus épais (la hauteur ne change pas).
    const k = (o.hauteur ?? 1.75) / hauteurAvecTete;
    const largeur = o.largeur ?? 1;
    this.modele.scale.set(k * largeur, k, k * (1 + (largeur - 1) * 0.8));
    this.objet.add(this.modele);

    const bassin = this.os.get("pelvis");
    if (bassin) this.bassinRepos.copy(bassin.position);
    this.mixer = new THREE.AnimationMixer(this.modele);
  }

  /**
   * La surface du corps habillé au repos (tête agrandie comprise), en points du repère du personnage :
   * pour mouler les accessoires (tablier, bandana, bandoulière) sur le corps plutôt que de les deviner.
   */
  points(): THREE.Vector3[] {
    if (this.surface) return this.surface;
    const liste: THREE.Vector3[] = [];
    this.objet.updateMatrixWorld(true);
    const versObjet = this.objet.matrixWorld.clone().invert();
    this.modele.traverse((n) => {
      const m = n as THREE.SkinnedMesh;
      if (!m.isSkinnedMesh || this.materiauxYeux.includes(m.material as THREE.MeshStandardMaterial) || /hair/i.test((m.material as THREE.Material).name)) return;
      const p = m.geometry.getAttribute("position");
      const v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) {
        m.getVertexPosition(i, v);
        liste.push(v.clone().applyMatrix4(m.matrixWorld).applyMatrix4(versObjet));
      }
    });
    this.surface = liste;
    return liste;
  }
  private surface: THREE.Vector3[] | null = null;

  /**
   * Sous un chapeau : les cheveux au-dessus de cette hauteur (repère du personnage, au repos) ne se dessinent plus.
   * Ils seraient cachés par la calotte ; sans ça, une coupe haute (chignons, raie) la traversait. Ce qui tombe
   * sous le bord (cheveux longs, chignon bas) reste visible.
   */
  masquerCheveuxAuDessus(y: number): void {
    this.objet.updateMatrixWorld(true);
    const versMonde = this.objet.matrixWorld;
    const plan = new THREE.Plane(new THREE.Vector3(0, 1, 0), -y).applyMatrix4(versMonde);
    this.modele.traverse((n) => {
      if (n.userData.cheveux !== true) return;
      const m = n as THREE.Mesh;
      // Le plan dans le repère de la mèche : il la suit dans toutes les animations, puisqu'elle suit l'os de la tête.
      const local = plan.clone().applyMatrix4(m.matrixWorld.clone().invert());
      const mat = (m.material as THREE.MeshStandardMaterial).clone();
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.planCoupe = { value: new THREE.Vector4(local.normal.x, local.normal.y, local.normal.z, local.constant) };
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vLocalCoupe;")
          .replace("#include <begin_vertex>", "#include <begin_vertex>\nvLocalCoupe = position;");
        shader.fragmentShader = shader.fragmentShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vLocalCoupe;\nuniform vec4 planCoupe;")
          .replace("void main() {", "void main() {\n  if (dot(planCoupe.xyz, vLocalCoupe) + planCoupe.w > 0.0) discard;");
      };
      mat.customProgramCacheKey = () => "cheveux-sous-chapeau";
      m.material = mat;
    });
  }

  /**
   * Accroche un objet à un os. Sa position, sa rotation et sa géométrie sont données dans le repère du
   * personnage au repos (mètres) ; l'objet suit ensuite l'os dans toutes les animations.
   * À appeler avant la première animation (le squelette doit être au repos).
   */
  accrocher(objet: THREE.Object3D, nomOs: string): void {
    const os = this.os.get(nomOs);
    if (!os) return;
    this.objet.updateMatrixWorld(true);
    const repere = this.objet.matrixWorld.clone().invert().multiply(os.matrixWorld);
    objet.updateMatrix();
    objet.matrixAutoUpdate = false;
    objet.matrix.premultiply(repere.invert());
    os.add(objet);
  }

  /** La position d'un os au repos, dans le repère du personnage. */
  repere(nomOs: string): THREE.Vector3 {
    this.objet.updateMatrixWorld(true);
    const os = this.os.get(nomOs);
    const p = os ? os.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3();
    return this.objet.worldToLocal(p);
  }

  /** Un os du squelette (pour accrocher un objet : main, dos, tête…). */
  osNomme(nom: string): THREE.Bone | undefined {
    return this.os.get(nom);
  }

  /** L'action d'une animation de la bibliothèque, préparée pour ce corps (bassin ramené à son repos). */
  action(nom: string): THREE.AnimationAction | null {
    const deja = this.actions.get(nom);
    if (deja) return deja;
    const source = bibliotheque!.clips.get(nom);
    if (!source) return null;
    const clip = source.clone();
    const decalage = this.bassinRepos.clone().sub(bibliotheque!.bassinMannequin);
    for (const piste of clip.tracks) {
      if (piste.name !== "pelvis.position") continue;
      const v = piste.values;
      for (let i = 0; i < v.length; i += 3) {
        v[i]! += decalage.x;
        v[i + 1]! += decalage.y;
        v[i + 2]! += decalage.z;
      }
    }
    const a = this.mixer.clipAction(clip);
    this.actions.set(nom, a);
    return a;
  }

  /**
   * Passe à une animation en fondu. `boucle` : sinon elle se joue une fois et reste sur sa dernière image.
   * Renvoie l'action, pour régler sa vitesse.
   */
  jouer(nom: string, o: { boucle?: boolean; fondu?: number; vitesse?: number; depuis?: number } = {}): THREE.AnimationAction | null {
    const a = this.action(nom);
    if (!a) return null;
    a.timeScale = o.vitesse ?? 1;
    if (a === this.actuelle) return a;
    a.reset();
    a.setLoop(o.boucle === false ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    a.clampWhenFinished = o.boucle === false;
    if (o.depuis !== undefined) a.time = o.depuis;
    a.enabled = true;
    a.setEffectiveWeight(1);
    a.play();
    if (this.actuelle) this.actuelle.crossFadeTo(a, o.fondu ?? 0.25, false);
    this.actuelle = a;
    return a;
  }

  /** Une pose figée : une image d'une animation (couché, à terre…). */
  poser(nom: string, instant: number, fondu = 0.4): void {
    const a = this.jouer(nom, { boucle: false, fondu });
    if (!a) return;
    a.time = Math.min(instant, a.getClip().duration);
    a.timeScale = 0;
  }

  get animation(): string {
    return this.actuelle?.getClip().name ?? "";
  }

  get finie(): boolean {
    const a = this.actuelle;
    return !a || (a.loop === THREE.LoopOnce && a.time >= a.getClip().duration - 1e-3);
  }

  /** Le nombre de taches de sang sur les vêtements. */
  tacher(n: number): void {
    this.reglages.taches.value = n;
  }

  /** Les yeux qui se ferment (Éteint qui dort) : on les teinte comme la peau. */
  fermerLesYeux(ouverture: number): void {
    const fermes = this.reglages.peau.clone().multiplyScalar(0.7);
    const ouverts = new THREE.Color(0xe9efe0);
    for (const m of this.materiauxYeux) m.color.lerpColors(fermes, ouverts, ouverture);
  }

  mettreAJour(dt: number): void {
    this.mixer.update(dt);
  }
}
