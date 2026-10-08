// Une colonne de fumée en un seul appel de dessin (2026-10-08). Avant : un sprite par bouffée (18 par feu de camp,
// 22 par charbonnière), donc autant d'appels de dessin. Ici, toutes les bouffées d'une colonne sont des carrés
// instanciés, tournés vers la caméra dans le shader ; on les trie de loin en près avant chaque image (le mélange
// des transparences reste juste). Même texture douce, mêmes couleurs, même brume que les sprites.

import * as THREE from "three";

let texture: THREE.Texture | null = null;
/** La bouffée : un disque blanc aux bords fondus (la couleur vient de chaque bouffée). */
function textureBouffee(): THREE.Texture {
  if (texture) return texture;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const d = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  d.addColorStop(0, "rgba(255,255,255,0.58)");
  d.addColorStop(0.5, "rgba(255,255,255,0.24)");
  d.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = d;
  g.fillRect(0, 0, 64, 64);
  texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const SOMMETS = /* glsl */ `
attribute vec3 centre;
attribute float taille;
attribute vec4 teinte;
varying vec2 vUv;
varying vec4 vTeinte;
#include <common>
#include <fog_pars_vertex>
void main() {
  vUv = uv;
  vTeinte = teinte;
  vec4 mvPosition = modelViewMatrix * vec4(centre, 1.0);
  mvPosition.xy += position.xy * taille;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

const FRAGMENTS = /* glsl */ `
uniform sampler2D carte;
varying vec2 vUv;
varying vec4 vTeinte;
#include <common>
#include <fog_pars_fragment>
void main() {
  float a = texture2D(carte, vUv).a * vTeinte.a;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vTeinte.rgb, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}
`;

let materiauPartage: THREE.ShaderMaterial | null = null;
function materiau(): THREE.ShaderMaterial {
  materiauPartage ??= new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { carte: { value: null } }]),
    vertexShader: SOMMETS,
    fragmentShader: FRAGMENTS,
    transparent: true,
    depthWrite: false,
    fog: true,
  });
  materiauPartage.uniforms.carte!.value = textureBouffee();
  return materiauPartage;
}

const vue = new THREE.Matrix4();
const p = new THREE.Vector3();

export class Panache {
  readonly objet: THREE.Mesh;
  private readonly n: number;
  /** L'état de chaque bouffée (x, y, z, taille, r, g, b, opacité), avant le tri. */
  private readonly etat: Float32Array;
  private readonly ordre: number[];
  private readonly profondeurs: Float32Array;
  private readonly centres: THREE.InstancedBufferAttribute;
  private readonly tailles: THREE.InstancedBufferAttribute;
  private readonly teintes: THREE.InstancedBufferAttribute;

  constructor(n: number) {
    this.n = n;
    this.etat = new Float32Array(n * 8);
    this.ordre = Array.from({ length: n }, (_, i) => i);
    this.profondeurs = new Float32Array(n);
    const geo = new THREE.InstancedBufferGeometry();
    const carre = new THREE.PlaneGeometry(1, 1);
    geo.index = carre.index;
    geo.setAttribute("position", carre.getAttribute("position"));
    geo.setAttribute("uv", carre.getAttribute("uv"));
    this.centres = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    this.tailles = new THREE.InstancedBufferAttribute(new Float32Array(n), 1);
    this.teintes = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
    for (const a of [this.centres, this.tailles, this.teintes]) a.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("centre", this.centres);
    geo.setAttribute("taille", this.tailles);
    geo.setAttribute("teinte", this.teintes);
    geo.instanceCount = n;
    this.objet = new THREE.Mesh(geo, materiau());
    // La colonne monte haut et dérive : on ne la coupe jamais (elle se voit de loin, c'est le but).
    this.objet.frustumCulled = false;
    this.objet.renderOrder = 2;
    this.objet.userData.intact = true;
    this.objet.onBeforeRender = (_r, _s, camera) => this.trier(camera);
  }

  /** Règle la bouffée `i` (repère de l'objet) : place, diamètre, couleur, opacité. */
  regler(i: number, x: number, y: number, z: number, taille: number, couleur: THREE.Color, opacite: number): void {
    const e = this.etat;
    const k = i * 8;
    e[k] = x;
    e[k + 1] = y;
    e[k + 2] = z;
    e[k + 3] = taille;
    e[k + 4] = couleur.r;
    e[k + 5] = couleur.g;
    e[k + 6] = couleur.b;
    e[k + 7] = opacite;
  }

  /** De loin en près, vu de cette caméra : les bouffées lointaines sont dessinées d'abord. */
  private trier(camera: THREE.Camera): void {
    vue.multiplyMatrices(camera.matrixWorldInverse, this.objet.matrixWorld);
    const e = this.etat;
    for (let i = 0; i < this.n; i++) this.profondeurs[i] = p.set(e[i * 8]!, e[i * 8 + 1]!, e[i * 8 + 2]!).applyMatrix4(vue).z;
    this.ordre.sort((a, b) => this.profondeurs[a]! - this.profondeurs[b]!);
    const c = this.centres.array as Float32Array;
    const t = this.tailles.array as Float32Array;
    const te = this.teintes.array as Float32Array;
    this.ordre.forEach((i, rang) => {
      const k = i * 8;
      c[rang * 3] = e[k]!;
      c[rang * 3 + 1] = e[k + 1]!;
      c[rang * 3 + 2] = e[k + 2]!;
      t[rang] = e[k + 3]!;
      te[rang * 4] = e[k + 4]!;
      te[rang * 4 + 1] = e[k + 5]!;
      te[rang * 4 + 2] = e[k + 6]!;
      te[rang * 4 + 3] = e[k + 7]!;
    });
    this.centres.needsUpdate = true;
    this.tailles.needsUpdate = true;
    this.teintes.needsUpdate = true;
  }
}
