// La carte de vue au sol (0.7.2, proposition « visibilité par pièce » §3.2, technique F) : ce que voit le personnage,
// dessiné vu du dessus dans une petite texture, que lit le nuanceur de chaque matériau du lieu.
//
// - Le polygone de vue est calculé sur le processeur, contre les murs et les portes fermées du plan (commun/src/vue.ts :
//   les mêmes boîtes que le serveur). On le recalcule seulement si l'on a bougé de plus de 5 cm ou si une porte s'anime :
//   une porte en mouvement ne bouche qu'une part de son ouverture, le cône s'ouvre avec le battant.
// - On le dessine dans une cible de rendu de 1024 × 1024 (un canal), une fenêtre de 96 m centrée sur le personnage :
//   un seul appel de dessin, et seulement quand la vue change. Rien de plus par image.
// - Le greffon « brouillard » (brouiller) : ce que le personnage voit est dessiné normalement ; le reste « en souvenir »,
//   sa forme et sa teinte propre, désaturées et froides, sans la lumière du moment (la lampe ne traverse plus les murs).
//   Les faces des murs lisent la carte un peu devant elles (position + normale × 0,2 m) : la face d'une cloison côté A
//   suit A, sa face côté B suit B. Une seconde petite texture, fixe, dit la clarté du souvenir de chaque pièce (le
//   dehors reste plus clair qu'un intérieur, une pièce noire plus sombre).
// - Ce qui bouge (Éteints, autres joueurs) n'est pas assombri : il est montré ou caché (main.ts, `voit`).
// - L'estompage des toits et des murs (estomperToits) est à part : il règle ce qui cache le personnage à la caméra ; la
//   carte de vue règle ce que le personnage sait. Les toits et les hauts de murs qui s'effacent n'ont pas le greffon.

import * as THREE from "three";
import { COOP, PIECES, pieceDe } from "../../../commun/src/cooperative.ts";
import { HALTE, MOULIN } from "../../../commun/src/lieux.ts";
import { PIECES_MOULIN, pieceMoulin } from "../../../commun/src/moulin.ts";
import { PLAN_VUE_HALTE } from "../../../commun/src/vue-lieux.ts";
import { facteurSon, obstaclesVue, polygoneVue, voit, type EtatsPortes, type ObstaclesVue, type PlanVue } from "../../../commun/src/vue.ts";

/** La fenêtre de la carte (m) et sa résolution : ≈ 9 cm par pixel. */
const TAILLE = 96;
const RESOLUTION = 1024;

/** Les réglages partagés par tous les matériaux brouillés (un seul objet : on change `.value`, rien ne recompile). */
const UNIFORMES = {
  uVueCarte: { value: null as THREE.Texture | null },
  uVueOrigine: { value: new THREE.Vector2() },
  uVueTaille: { value: TAILLE },
  uVueActif: { value: 0 },
  uPiecesCarte: { value: null as THREE.Texture | null },
  uPiecesOrigine: { value: new THREE.Vector2() },
  uPiecesTaille: { value: new THREE.Vector2(1, 1) },
  uSouvenirForce: { value: 0.5 },
  uSouvenirTeinte: { value: new THREE.Color(0x8796b0) },
};

const SOMMETS = /* glsl */ `
#include <project_vertex>
{
  vec4 vuMonde = vec4( transformed, 1.0 );
  #ifdef USE_BATCHING
    vuMonde = batchingMatrix * vuMonde;
  #endif
  #ifdef USE_INSTANCING
    vuMonde = instanceMatrix * vuMonde;
  #endif
  vMondeVue = ( modelMatrix * vuMonde ).xyz;
  #ifdef VUE_NORMALE
  {
    vec3 n = objectNormal;
    #ifdef USE_BATCHING
      n = mat3( batchingMatrix ) * n;
    #endif
    #ifdef USE_INSTANCING
      n = mat3( instanceMatrix ) * n;
    #endif
    n = mat3( modelMatrix ) * n;
    // Seule la part horizontale compte : un sol lit la carte sur place, une face de mur un peu devant elle.
    vMondeVue.xz += normalize( n + vec3( 0.0, 1e-4, 0.0 ) ).xz * 0.2;
  }
  #endif
}
`;

const FRAGMENTS = /* glsl */ `
#include <opaque_fragment>
if ( uVueActif > 0.5 ) {
  // La carte est vue du dessus, le nord (z décroissant) en haut de l'image.
  vec2 uvVue = ( vMondeVue.xz - uVueOrigine ) / uVueTaille;
  float vu = texture2D( uVueCarte, vec2( 0.5 + uvVue.x, 0.5 - uvVue.y ) ).r;
  float clarte = texture2D( uPiecesCarte, ( vMondeVue.xz - uPiecesOrigine ) / uPiecesTaille ).r;
  // Le souvenir : l'albédo désaturé et tiré vers le bleu-gris, sans la lumière du moment.
  float l = dot( diffuseColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) );
  vec3 souvenir = mix( vec3( l ), uSouvenirTeinte * ( 0.35 + l ), 0.35 ) * uSouvenirForce * clarte;
  gl_FragColor.rgb = mix( souvenir, gl_FragColor.rgb, vu );
}
`;

const DECLARATIONS_SOMMETS = "#include <common>\nvarying vec3 vMondeVue;";
const DECLARATIONS_FRAGMENTS = `#include <common>
varying vec3 vMondeVue;
uniform sampler2D uVueCarte; uniform vec2 uVueOrigine; uniform float uVueTaille; uniform float uVueActif;
uniform sampler2D uPiecesCarte; uniform vec2 uPiecesOrigine; uniform vec2 uPiecesTaille;
uniform float uSouvenirForce; uniform vec3 uSouvenirTeinte;`;

/** Les matériaux éclairés ont une normale dans le nuanceur de sommets (pas le matériau de base). */
function aUneNormale(m: THREE.Material): boolean {
  const t = m as THREE.Material & { isMeshStandardMaterial?: boolean; isMeshLambertMaterial?: boolean; isMeshPhongMaterial?: boolean; isMeshToonMaterial?: boolean };
  return Boolean(t.isMeshStandardMaterial || t.isMeshLambertMaterial || t.isMeshPhongMaterial || t.isMeshToonMaterial);
}

/** Le greffon : une seule fonction, partagée (les lots la reconnaissent, rendu/lots.ts). */
function greffon(this: THREE.Material, s: THREE.WebGLProgramParametersWithUniforms): void {
  Object.assign(s.uniforms, UNIFORMES);
  const normale = aUneNormale(this) ? "#define VUE_NORMALE\n" : "";
  s.vertexShader = normale + s.vertexShader.replace("#include <common>", DECLARATIONS_SOMMETS).replace("#include <project_vertex>", SOMMETS);
  s.fragmentShader = s.fragmentShader.replace("#include <common>", DECLARATIONS_FRAGMENTS).replace("#include <opaque_fragment>", FRAGMENTS);
}
function cleGreffon(this: THREE.Material): string {
  return `brouillard${aUneNormale(this) ? "+n" : ""}`;
}

/** Ce matériau porte-t-il le greffon « brouillard » ? */
export function estBrouille(m: THREE.Material): boolean {
  return m.onBeforeCompile === greffon;
}

/** Le matériau a-t-il un autre greffon (qu'on ne sait pas combiner) ? */
function autreGreffon(m: THREE.Material): boolean {
  return m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile && m.onBeforeCompile !== greffon;
}

/**
 * Pose le greffon « brouillard » sur un matériau (une fois ; il recompile à sa prochaine image). Sans effet hors des
 * lieux à murs (uVueActif = 0). Les matériaux à nuanceur maison (ShaderMaterial) ou déjà retouchés sont laissés.
 */
export function brouiller(m: THREE.Material): void {
  if (estBrouille(m) || autreGreffon(m) || (m as THREE.ShaderMaterial).isShaderMaterial) return;
  const t = m as THREE.Material & { isMeshBasicMaterial?: boolean; isMeshStandardMaterial?: boolean; isMeshLambertMaterial?: boolean; isMeshPhongMaterial?: boolean };
  if (!(t.isMeshBasicMaterial || t.isMeshStandardMaterial || t.isMeshLambertMaterial || t.isMeshPhongMaterial)) return;
  m.onBeforeCompile = greffon;
  m.customProgramCacheKey = cleGreffon;
  m.needsUpdate = true;
}

/**
 * Brouille tous les matériaux de ces objets, sauf ceux qui s'effacent tout à fait (toits, hauts de murs : ils cachent
 * le personnage, pas ce qu'il sait ; une porte, qui ne s'efface qu'à moitié, est brouillée).
 */
export function brouillerTout(objets: Iterable<THREE.Object3D>): void {
  const epargnes = new Set<THREE.Material>();
  for (const o of objets) {
    o.traverse((n) => {
      const toits = n.userData.toits as { materiaux: THREE.Material[]; fantome?: number }[] | undefined;
      for (const t of toits ?? []) if (!t.fantome) for (const m of t.materiaux) epargnes.add(m);
    });
  }
  for (const o of objets) {
    o.traverse((n) => {
      const m = n as THREE.Mesh;
      if (!m.isMesh || n.userData.sansBrouillard) return;
      for (const mat of Array.isArray(m.material) ? m.material : [m.material]) if (!epargnes.has(mat)) brouiller(mat);
    });
  }
}

/** La clarté du souvenir de chaque pièce d'un lieu, dans une petite texture fixe (2 pixels par mètre). */
export interface ClartesLieu {
  x0: number;
  z0: number;
  largeur: number;
  profondeur: number;
  /** La clarté (0 à 1) en ce point. */
  clarte(x: number, z: number): number;
}

export class CarteVue {
  private readonly cible = new THREE.WebGLRenderTarget(RESOLUTION, RESOLUTION, {
    format: THREE.RedFormat,
    type: THREE.UnsignedByteType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
    generateMipmaps: false,
  });
  private readonly sceneCarte = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-TAILLE / 2, TAILLE / 2, TAILLE / 2, -TAILLE / 2, -10, 10);
  private readonly eventail: THREE.Mesh;
  private readonly sommets: THREE.BufferAttribute;
  private plan: PlanVue | null = null;
  private obstacles: ObstaclesVue | null = null;
  private derniere = { x: Number.NaN, z: Number.NaN, cle: "" };
  private piecesCarte: THREE.DataTexture | null = null;
  /** Le nombre de fois où la carte a été redessinée (mode mesure). */
  redessins = 0;
  /** Pour les essais (console de développement) : une clarté du souvenir imposée, ou null. */
  souvenirImpose: number | null = null;

  constructor() {
    this.cible.texture.wrapS = this.cible.texture.wrapT = THREE.ClampToEdgeWrapping;
    // Vu du dessus : x vers la droite, z vers le bas de l'image (comme les coordonnées de texture lues par le nuanceur).
    this.camera.position.set(0, 5, 0);
    this.camera.up.set(0, 0, -1);
    this.camera.lookAt(0, 0, 0);
    // Un éventail de triangles : le centre, puis chaque point du polygone (≈ 1 500 rayons au plus).
    const max = 4096;
    this.sommets = new THREE.BufferAttribute(new Float32Array(max * 9), 3);
    this.sommets.setUsage(THREE.DynamicDrawUsage);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", this.sommets);
    this.eventail = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    this.eventail.frustumCulled = false;
    this.sceneCarte.add(this.eventail);
    UNIFORMES.uVueCarte.value = this.cible.texture;
  }

  /** On entre dans un lieu : son plan de vue (null : à ciel ouvert, la carte s'éteint) et la clarté de ses pièces. */
  activer(plan: PlanVue | null, clartes: ClartesLieu | null): void {
    this.plan = plan;
    this.obstacles = null;
    this.derniere = { x: Number.NaN, z: Number.NaN, cle: "" };
    UNIFORMES.uVueActif.value = plan ? 1 : 0;
    this.piecesCarte?.dispose();
    this.piecesCarte = null;
    if (!plan || !clartes) return;
    const l = Math.ceil(clartes.largeur * 2);
    const p = Math.ceil(clartes.profondeur * 2);
    const donnees = new Uint8Array(l * p);
    for (let j = 0; j < p; j++) for (let i = 0; i < l; i++) donnees[j * l + i] = Math.round(255 * clartes.clarte(clartes.x0 + (i + 0.5) / 2, clartes.z0 + (j + 0.5) / 2));
    const t = new THREE.DataTexture(donnees, l, p, THREE.RedFormat, THREE.UnsignedByteType);
    t.minFilter = t.magFilter = THREE.LinearFilter;
    t.needsUpdate = true;
    this.piecesCarte = t;
    UNIFORMES.uPiecesCarte.value = t;
    UNIFORMES.uPiecesOrigine.value.set(clartes.x0, clartes.z0);
    UNIFORMES.uPiecesTaille.value.set(l / 2, p / 2);
  }

  get actif(): boolean {
    return this.plan !== null;
  }

  /**
   * La vue d'ensemble à l'arrivée (0.8.2, chantier G) : vu de loin, le lieu se montre en entier, sans « souvenir » (la
   * carte ne couvre que 96 m autour du personnage : le reste du lieu serait gris). Ce qui bouge reste réglé par `voit`.
   * Un réglage de nuanceur : rien ne recompile.
   */
  toutMontrer(oui: boolean): void {
    UNIFORMES.uVueActif.value = this.plan && !oui ? 1 : 0;
  }

  /**
   * La clarté du souvenir : de jour, 0,42 ; la nuit, 0,16. Dans une pièce noire (`obscurite`), bien moins : le souvenir
   * ne doit jamais être plus clair que ce qu'on voit (sinon la pièce d'à côté semblerait éclairée).
   */
  souvenir(nuit: number, obscurite: number): void {
    const n = Math.min(1, Math.max(0, nuit));
    const o = Math.min(1, Math.max(0, obscurite));
    UNIFORMES.uSouvenirForce.value = this.souvenirImpose ?? (0.42 + (0.16 - 0.42) * n) * (1 - 0.6 * o);
  }

  /**
   * La vue depuis (x, z), pour cet état des portes (ouvertes : 1, fermées : 0, en mouvement : entre les deux).
   * Redessine la carte seulement si l'on a bougé de plus de 5 cm ou si les portes ont changé.
   */
  maj(rendu: THREE.WebGLRenderer, x: number, z: number, portes: EtatsPortes): void {
    if (!this.plan) return;
    const cle = Object.values(portes)
      .map((v) => (typeof v === "number" ? v.toFixed(2) : v ? "1" : "0"))
      .join(",");
    if (cle === this.derniere.cle && Math.hypot(x - this.derniere.x, z - this.derniere.z) < 0.05) return;
    this.derniere = { x, z, cle };
    this.obstacles = obstaclesVue(this.plan, portes);
    const poly = polygoneVue(this.obstacles, x, z, TAILLE / 2);
    const n = poly.length / 2;
    const a = this.sommets.array as Float32Array;
    let k = 0;
    // Dans le repère de la carte (centrée sur le personnage) : un triangle (centre, point i, point i + 1) par rayon.
    for (let i = 0; i < n && k + 9 <= a.length; i++) {
      const j = (i + 1) % n;
      a[k++] = 0;
      a[k++] = 0;
      a[k++] = 0;
      a[k++] = poly[2 * i]! - x;
      a[k++] = 0;
      a[k++] = poly[2 * i + 1]! - z;
      a[k++] = poly[2 * j]! - x;
      a[k++] = 0;
      a[k++] = poly[2 * j + 1]! - z;
    }
    this.sommets.needsUpdate = true;
    this.sommets.clearUpdateRanges();
    this.sommets.addUpdateRange(0, k);
    this.eventail.geometry.setDrawRange(0, k / 3);
    const avant = rendu.getRenderTarget();
    const couleur = rendu.getClearColor(new THREE.Color());
    const alpha = rendu.getClearAlpha();
    rendu.setRenderTarget(this.cible);
    rendu.setClearColor(0x000000, 1);
    rendu.render(this.sceneCarte, this.camera);
    rendu.setRenderTarget(avant);
    rendu.setClearColor(couleur, alpha);
    UNIFORMES.uVueOrigine.value.set(x, z);
    this.redessins++;
  }

  /** Le personnage voit-il ce point ? (la même règle que le serveur ; vrai hors des lieux à murs) */
  voit(depuis: { x: number; z: number }, x: number, z: number): boolean {
    return !this.obstacles || voit(this.obstacles, depuis.x, depuis.z, x, z);
  }
}

/** La clarté du souvenir de chaque lieu à murs : le dehors reste clair, un intérieur moins, une pièce noire encore moins. */
export function clartesDe(lieu: string): ClartesLieu | null {
  if (lieu === "cooperative") {
    return {
      x0: 0,
      z0: 0,
      largeur: COOP.largeur,
      profondeur: COOP.profondeur,
      clarte: (x, z) => {
        const p = pieceDe(x, z);
        return p === "dehors" ? 1 : PIECES[p].sombre ? 0.6 : 0.8;
      },
    };
  }
  if (lieu === "station") return { x0: 0, z0: 0, largeur: HALTE.longueur, profondeur: HALTE.largeur, clarte: (x, z) => (PLAN_VUE_HALTE.pieceDe(x, z) === "boutique" ? 0.8 : 1) };
  // Le Moulin du Gué (0.8, chantier 12) : la cour et le jardin restent clairs ; les pièces sombres, assombries.
  if (lieu === "moulin") {
    return {
      x0: 0,
      z0: 0,
      largeur: MOULIN.largeur,
      profondeur: MOULIN.profondeur,
      clarte: (x, z) => {
        const p = pieceMoulin(x, z);
        return p === "dehors" || p === "jardin" ? 1 : PIECES_MOULIN[p].sombre ? 0.6 : 0.8;
      },
    };
  }
  return null;
}

/**
 * Le cercle de signature « honnête » (décision 6 du porteur du projet) : dans chaque pièce, il est dessiné à la portée
 * que le serveur lui donne vraiment (× 0,5 par une porte ouverte, × 0,15 par une porte fermée, × 0,3 par une vitrine,
 * × 0,05 à travers un mur). Des segments à la suite (x, y, z), écrits dans `sortie` ; renvoie le nombre de points. La
 * distance le long du trait (pour les tirets) va dans `distances`, rapportée au rayon : les tirets gardent leur pas.
 */
export function arcsParPiece(plan: PlanVue, portes: EtatsPortes, x: number, z: number, rayon: number, sortie: Float32Array, distances: Float32Array): number {
  const pa = plan.pieceDe(x, z);
  const N = 96;
  let n = 0;
  let cumul = 0;
  for (const piece of plan.pieces) {
    const r = rayon * facteurSon(plan, portes, pa, piece);
    if (r < 0.25) continue;
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * Math.PI * 2;
      const a1 = ((i + 1) / N) * Math.PI * 2;
      const x0 = x + Math.cos(a0) * r;
      const z0 = z + Math.sin(a0) * r;
      const x1 = x + Math.cos(a1) * r;
      const z1 = z + Math.sin(a1) * r;
      if (plan.pieceDe((x0 + x1) / 2, (z0 + z1) / 2) !== piece) continue;
      if ((n + 2) * 3 > sortie.length) return n;
      sortie.set([x0, 0, z0, x1, 0, z1], n * 3);
      const l = Math.hypot(x1 - x0, z1 - z0) / Math.max(rayon, 0.01);
      distances[n] = cumul;
      distances[n + 1] = cumul + l;
      cumul += l;
      n += 2;
    }
  }
  return n;
}
