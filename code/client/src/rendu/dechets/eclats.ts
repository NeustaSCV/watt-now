// L'éclat de repère des déchets (0.7, chantier 7 ; chiffrage graphique §4.2, Book 26 §9.2) : une petite étoile blanc
// chaud (#FFF0BE) qui scintille de temps en temps au-dessus de ce qui se ramasse, en décalé, toutes les 3 à 5 s. Un seul
// appel de dessin : un lot de quadrilatères tournés vers la caméra, l'animation est dans le shader.
// Le même lot porte la lueur des balises solaires, la nuit (une auréole qui respire, sans scintiller).

import * as THREE from "three";

/** Jamais le blanc des yeux des Éteints (#F4F1E6) : l'éclat bouge et s'éteint, les yeux non. */
const COULEUR = new THREE.Color(0xfff0be);
const LUEUR = new THREE.Color(0xe8f0ff);
const MAX = 64;

const SOMMETS = /* glsl */ `
attribute vec2 aEtat;
uniform float uTemps;
varying vec2 vUv;
varying float vForce;
varying float vMode;
void main() {
  float phase = aEtat.x;
  float mode = aEtat.y;
  float periode = 3.0 + phase * 2.0;
  float t = fract(uTemps / periode + phase);
  // Un éclat bref (≈ 0,5 s) une fois par période ; la lueur, elle, respire doucement.
  float f = mode > 0.5 ? 0.8 + 0.2 * sin(uTemps * 1.7 + phase * 6.2832) : sin(clamp(t / 0.13, 0.0, 1.0) * 3.14159);
  float taille = mode > 0.5 ? 0.55 : 0.2 + 0.16 * f;
  float a = uTemps * 0.6 + phase * 6.2832;
  vec2 q = mat2(cos(a), sin(a), -sin(a), cos(a)) * position.xy;
  if (mode > 0.5) q = position.xy;
  vec4 centre = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  centre.xy += q * taille * 2.0;
  // Un peu vers la caméra : l'étoile passe devant l'objet qu'elle signale.
  centre.z += 0.6;
  gl_Position = projectionMatrix * centre;
  vUv = position.xy * 2.0;
  vForce = f;
  vMode = mode;
}`;

const FRAGMENTS = /* glsl */ `
uniform vec3 uCouleur;
uniform vec3 uLueur;
varying vec2 vUv;
varying float vForce;
varying float vMode;
void main() {
  vec2 p = vUv;
  float r = length(p);
  float a;
  vec3 couleur = uCouleur;
  if (vMode > 0.5) {
    a = pow(max(0.0, 1.0 - r), 2.0) * 0.85;
    couleur = uLueur;
  } else {
    // Quatre branches fines et un cœur.
    float rayons = max(0.0, 1.0 - abs(p.x) * 9.0) * max(0.0, 1.0 - abs(p.y)) + max(0.0, 1.0 - abs(p.y) * 9.0) * max(0.0, 1.0 - abs(p.x));
    a = rayons + smoothstep(0.32, 0.0, r);
  }
  a *= vForce;
  if (a < 0.01) discard;
  gl_FragColor = vec4(couleur * a, a);
}`;

export class Eclats {
  readonly maillage: THREE.InstancedMesh;
  private readonly etats: THREE.InstancedBufferAttribute;
  private readonly materiau: THREE.ShaderMaterial;
  private readonly m = new THREE.Matrix4();

  constructor() {
    const g = new THREE.PlaneGeometry(1, 1);
    this.etats = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 2), 2);
    g.setAttribute("aEtat", this.etats);
    this.materiau = new THREE.ShaderMaterial({
      uniforms: { uTemps: { value: 0 }, uCouleur: { value: COULEUR }, uLueur: { value: LUEUR } },
      vertexShader: SOMMETS,
      fragmentShader: FRAGMENTS,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    this.maillage = new THREE.InstancedMesh(g, this.materiau, MAX);
    this.maillage.count = 0;
    // Les étoiles sont posées partout dans le lieu : pas d'écart par sphère englobante (elle serait fausse).
    this.maillage.frustumCulled = false;
    this.maillage.renderOrder = 5;
  }

  /** Les étoiles de l'image : position, phase (0 à 1, stable par objet) et mode (0 : éclat, 1 : lueur de balise). */
  poser(liste: readonly { x: number; y: number; z: number; phase: number; lueur: boolean }[]): void {
    const n = Math.min(MAX, liste.length);
    for (let i = 0; i < n; i++) {
      const e = liste[i]!;
      this.m.makeTranslation(e.x, e.y, e.z);
      this.maillage.setMatrixAt(i, this.m);
      this.etats.setXY(i, e.phase, e.lueur ? 1 : 0);
    }
    this.maillage.count = n;
    this.maillage.instanceMatrix.needsUpdate = true;
    this.etats.needsUpdate = true;
  }

  animer(temps: number): void {
    this.materiau.uniforms.uTemps!.value = temps;
  }

  liberer(): void {
    this.maillage.geometry.dispose();
    this.materiau.dispose();
    this.maillage.dispose();
  }
}
