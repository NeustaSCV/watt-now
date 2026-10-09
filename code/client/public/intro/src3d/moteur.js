/* Watt Now? — intro 3D : le moteur de rendu de la cinématique.
   - Un rendu three.js (celui du jeu : ACES, sRGB, ombres douces), puis une chaîne d'image de cinéma :
     halo (bloom) → sortie (tone mapping) → étalonnage maison (teinte, vignette, grain, aberration, tube cathodique,
     bandes cinéma, fondu au noir).
   - Les plans : chacun a sa scène, sa caméra, sa lumière ; on les construit un peu avant leur début (pas de saccade),
     on les jette après leur fin. Une image ne dépend que du temps T (et, pour le feu et la fumée, du pas dt). */

import { VENT } from './decors.js';
import { THREE, EffectComposer, RenderPass, UnrealBloomPass, ShaderPass, OutputPass, GTAOPass, BokehPass, AfterimagePass } from '../vendor/rendu-jeu.js';

const ETALONNAGE = {
  uniforms: {
    tDiffuse: { value: null },
    temps: { value: 0 },
    resolution: { value: new THREE.Vector2(1920, 1080) },
    vignette: { value: 0.35 },
    grain: { value: 0.045 },
    aberration: { value: 0.0015 },
    tube: { value: 0 },            // 0 : image normale, 1 : écran de télé cathodique
    neige: { value: 0 },           // neige du zapping
    bandes: { value: 0 },          // bandes cinéma (0 → 1 : 2,39:1)
    noir: { value: 0 },            // fondu au noir
    blanc: { value: 0 },           // éclair blanc
    teinte: { value: new THREE.Vector3(1, 1, 1) },     // gain par canal
    ombres: { value: new THREE.Vector3(0, 0, 0) },     // relevé des noirs, par canal
    saturation: { value: 1 },
    contraste: { value: 1 },
    effondrement: { value: 0 },    // la télé qui s'éteint : l'image s'écrase en un trait, puis en un point
    tTele: { value: null },        // l'habillage de la chaîne (logo, rubrique, bandeaux) : dans l'image de la télé
    aTele: { value: 0 },
    tCalque: { value: null },      // les cartons et le titre : par-dessus tout
    aCalque: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse, tTele, tCalque;
    uniform float aTele, aCalque;
    uniform float temps, vignette, grain, aberration, tube, neige, bandes, noir, blanc, saturation, contraste, effondrement;
    uniform vec2 resolution;
    uniform vec3 teinte, ombres;
    varying vec2 vUv;
    float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    vec3 lire(vec2 uv) {
      vec2 d = (uv - 0.5) * aberration * (1.0 + tube * 3.0);
      return vec3(texture2D(tDiffuse, uv + d).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - d).b);
    }
    void main() {
      vec2 uv = vUv;
      // le tube : l'écran bombé
      if (tube > 0.0) {
        vec2 c = uv - 0.5;
        float r2 = dot(c, c);
        uv = 0.5 + c * (1.0 + tube * 0.12 * r2);
      }
      // la télé s'éteint : l'image s'écrase verticalement, puis horizontalement
      float ecraseY = clamp(effondrement * 2.0, 0.0, 1.0), ecraseX = clamp(effondrement * 2.0 - 1.0, 0.0, 1.0);
      vec2 e = vec2(mix(1.0, 0.002, ecraseX * ecraseX), mix(1.0, 0.004, ecraseY * ecraseY));
      vec2 uvE = 0.5 + (uv - 0.5) / e;
      vec3 col = lire(uvE);
      if (effondrement > 0.0) {
        float dedans = step(abs(uv.x - 0.5), e.x * 0.5) * step(abs(uv.y - 0.5), e.y * 0.5);
        col = mix(vec3(0.0), col + vec3(ecraseY * 2.0), dedans);
        float point = smoothstep(0.02, 0.0, length((uv - 0.5) * vec2(resolution.x / resolution.y, 1.0))) * ecraseX;
        col += vec3(point) * (1.0 - smoothstep(0.85, 1.0, effondrement)) * 2.0;
      }
      if (aTele > 0.0) { vec4 hab = texture2D(tTele, uvE); col = mix(col, hab.rgb, hab.a * aTele); }
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) col = vec3(0.0);
      // étalonnage : relevé des noirs, gain, contraste, saturation
      col = ombres + col * (1.0 - ombres);
      col *= teinte;
      col = (col - 0.5) * contraste + 0.5;
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(l), col, saturation);
      // le tube : lignes de balayage, masque de phosphore, lueur
      if (tube > 0.0) {
        float ligne = 0.9 + 0.1 * sin(uv.y * resolution.y * 1.5708);
        float masque = 0.95 + 0.05 * sin(uv.x * resolution.x * 2.0944);
        col *= mix(1.0, ligne * masque, tube);
        col *= mix(1.0, 1.0 - 0.35 * pow(length(uv - 0.5) * 1.4, 3.0), tube);
      }
      // la neige du zapping
      if (neige > 0.0) {
        float n = h(floor(uv * resolution / 3.0) + fract(temps * 61.0) * 100.0);
        float bande = step(0.5, fract(uv.y * 7.0 + temps * 13.0)) * 0.15;
        col = mix(col, vec3(n * 0.9 + bande), neige);
      }
      // vignette et grain
      vec2 v = uv - 0.5;
      col *= 1.0 - vignette * smoothstep(0.25, 0.9, length(v * vec2(1.0, 0.85)) * 1.25);
      col += (h(uv * resolution + fract(temps * 24.0) * 97.0) - 0.5) * grain;
      col = mix(col, vec3(1.0), blanc);
      col *= 1.0 - noir;
      // bandes cinéma
      float b = bandes * 0.12;
      if (vUv.y < b || vUv.y > 1.0 - b) col = vec3(0.0);
      if (aCalque > 0.0) { vec4 c2 = texture2D(tCalque, vUv); col = mix(col, c2.rgb, c2.a); }
      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }`,
};

/** Un calque 2D (canvas) utilisé comme texture. */
function calque(l, h) {
  const canvas = document.createElement('canvas');
  canvas.width = l; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  // l'étalonnage travaille déjà en sRGB (après la sortie) : on lit le calque tel quel
  texture.colorSpace = THREE.NoColorSpace;
  return { canvas, ctx, texture, l, h, utilise: false };
}

/** Pour un plan de télé : renvoie le contexte 2D de l'habillage (effacé), à dessiner en 1280 × 720. */
export function habillageTele(moteur) {
  const c = moteur.tele;
  c.ctx.clearRect(0, 0, c.l, c.h);
  c.utilise = true;
  return c.ctx;
}

export const GRADE_DEFAUT = {
  vignette: 0.35, grain: 0.045, aberration: 0.0015, tube: 0, neige: 0, bandes: 0, noir: 0, blanc: 0,
  teinte: [1, 1, 1], ombres: [0, 0, 0], saturation: 1, contraste: 1, effondrement: 0,
  bloom: 0.55, bloomRayon: 0.6, bloomSeuil: 0.82, exposition: 1.0,
};

export class Moteur {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ plans: object[], largeur?: number, hauteur?: number, pixels?: number, qualite?: 'haute'|'basse' }} o
   */
  constructor(canvas, o) {
    this.canvas = canvas;
    this.plans = o.plans;
    this.qualite = o.qualite || 'haute';
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!o.capture });
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.setPixelRatio(o.pixels || Math.min(window.devicePixelRatio || 1, this.qualite === 'haute' ? 2 : 1.25));
    this.rendu = r;
    // l'image en flottants, avec anticrénelage multi-échantillons (les arêtes restent nettes après les passes)
    const cible = new THREE.WebGLRenderTarget(16, 16, { type: THREE.HalfFloatType, samples: this.qualite === 'haute' ? 4 : 0 });
    this.compo = new EffectComposer(r, cible);
    const sceneVide = new THREE.Scene(), cameraVide = new THREE.PerspectiveCamera();
    this.passeRendu = new RenderPass(sceneVide, cameraVide);
    // l'occlusion ambiante : les recoins, les plis, le contact des objets avec le sol
    this.ao = new GTAOPass(sceneVide, cameraVide, 16, 16);
    this.ao.blendIntensity = 0.85;
    this.ao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.5, thickness: 1, scale: 1, samples: 16 });
    this.ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
    this.ao.enabled = this.qualite === 'haute';
    // la profondeur de champ, plan par plan (grade.nette : distance de mise au point)
    this.pdc = new BokehPass(sceneVide, cameraVide, { focus: 3, aperture: 0.004, maxblur: 0.008 });
    this.pdc.enabled = false;
    this.bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.55, 0.6, 0.82);
    this.sortie = new OutputPass();
    this.grade = new ShaderPass(ETALONNAGE);
    this.compo.addPass(this.passeRendu);
    this.compo.addPass(this.ao);
    this.compo.addPass(this.pdc);
    this.compo.addPass(this.bloom);
    this.compo.addPass(this.sortie);
    this.compo.addPass(this.grade);
    // une rémanence légère, en direct : elle lisse les mouvements (l'export vidéo fait, lui, un vrai flou d'obturateur)
    this.remanence = new AfterimagePass(0.32);
    this.remanence.enabled = !o.capture;
    this.compo.addPass(this.remanence);
    this.planPrecedent = null;
    this.montes = new Map();   // plan → instance { scene, camera, maj, grade, detruire }
    // deux calques 2D : l'habillage télé (dans l'image du tube) et les cartons (par-dessus tout)
    this.tele = calque(1280, 720);
    this.calque = calque(1920, 1080);
    this.grade.uniforms.tTele.value = this.tele.texture;
    this.grade.uniforms.tCalque.value = this.calque.texture;
    this.cartons = o.cartons || [];
    this.dessinerCarton = o.dessinerCarton || null;
    this.surCalque = o.surCalque || null;
    this.taille(o.largeur || canvas.clientWidth || 1600, o.hauteur || canvas.clientHeight || 900);
  }

  taille(l, h) {
    this.l = l; this.h = h;
    this.rendu.setSize(l, h, false);
    this.compo.setSize(l, h);
    const pr = this.rendu.getPixelRatio();
    this.grade.uniforms.resolution.value.set(l * pr, h * pr);
    for (const inst of this.montes.values()) this.cadrer(inst.camera);
  }

  cadrer(camera) {
    if (camera && camera.isPerspectiveCamera) { camera.aspect = this.l / this.h; camera.updateProjectionMatrix(); }
  }

  /** Construit un plan (si besoin) et compile ses matériaux. */
  monter(p) {
    if (this.montes.has(p)) return this.montes.get(p);
    const inst = p.creer(this);
    inst.age = 0;
    this.cadrer(inst.camera);
    this.montes.set(p, inst);
    try { this.rendu.compile(inst.scene, inst.camera); } catch (e) { /* compilation paresseuse */ }
    return inst;
  }

  demonter(p) {
    const inst = this.montes.get(p);
    if (!inst) return;
    inst.detruire && inst.detruire();
    inst.scene.traverse((n) => {
      if (n.geometry && !n.geometry.userData.partagee) n.geometry.dispose();
    });
    this.montes.delete(p);
  }

  /**
   * Construit et compile tous les plans d'avance (pendant l'écran de chargement), pour qu'aucun à-coup ne vienne
   * casser une image en cours de lecture. On rend la main au navigateur entre deux plans.
   */
  async toutMonter(surAvance) {
    this.garder = true;
    for (let i = 0; i < this.plans.length; i++) {
      const inst = this.monter(this.plans[i]);
      // une image hors champ : les ombres, les textures, les shaders sont prêts
      try { inst.maj(0, 1 / 30, this.plans[i].debut, this); this.passeRendu.scene = inst.scene; this.passeRendu.camera = inst.camera; this.compo.render(0); } catch (e) { console.warn(e); }
      if (surAvance) surAvance((i + 1) / this.plans.length);
      await new Promise((ok) => setTimeout(ok, 0));
    }
  }

  /** Rend l'image de l'instant T (dt : pas depuis l'image précédente, pour le feu, la fumée). */
  image(T, dt) {
    // on prépare le plan suivant à l'avance, on jette ceux qui sont passés
    for (const p of this.plans) {
      const avant = p.debut - (p.preparer ?? 1.5);
      if (T >= avant && T < p.fin) this.monter(p);
      else if (!this.garder && this.montes.has(p) && (T >= p.fin + 0.2 || T < avant - 1)) this.demonter(p);
    }
    const p = this.plans.find((x) => T >= x.debut && T < x.fin);
    if (!p) { this.rendu.setClearColor(0x000000); this.rendu.clear(); return; }
    const inst = this.monter(p);
    const t = T - p.debut;
    VENT.value = T;
    this.tele.utilise = false;
    const g = { ...GRADE_DEFAUT, ...(inst.maj(t, Math.max(0, Math.min(dt, 0.1)), T, this) || {}) };
    this.appliquer(g, T);
    this.grade.uniforms.aTele.value = this.tele.utilise ? 1 : 0;
    if (this.tele.utilise) this.tele.texture.needsUpdate = true;
    // le calque : cartons, titre
    const c = this.calque;
    c.ctx.clearRect(0, 0, c.l, c.h);
    let dessine = false;
    if (this.dessinerCarton) {
      const carton = this.cartons.find(([a, b]) => T >= a && T < b);
      if (carton) { const [a, b] = carton; this.dessinerCarton(c.ctx, carton, Math.min(1, (T - a) / 0.35, (b - T) / 0.35), c.l, c.h); dessine = true; }
    }
    if (this.surCalque) dessine = this.surCalque(c.ctx, T, c.l, c.h) || dessine;
    this.grade.uniforms.aCalque.value = dessine ? 1 : 0;
    if (dessine) c.texture.needsUpdate = true;
    if (typeof window !== 'undefined' && window.__cam) {   // mise au point : une caméra libre
      const [pos, vise, f] = window.__cam;
      inst.camera.position.set(...pos); inst.camera.up.set(0, 1, 0); inst.camera.lookAt(...vise);
      inst.camera.fov = 2 * Math.atan(12 / (f || 30)) * 180 / Math.PI; inst.camera.updateProjectionMatrix();
    }
    this.passeRendu.scene = inst.scene;
    this.passeRendu.camera = inst.camera;
    this.ao.scene = inst.scene; this.ao.camera = inst.camera;
    this.ao.enabled = this.qualite === 'haute' && g.ao !== 0;
    if (this.ao.enabled) this.ao.blendIntensity = g.ao ?? 0.85;
    this.pdc.scene = inst.scene; this.pdc.camera = inst.camera;
    this.pdc.enabled = this.qualite === 'haute' && g.nette !== undefined;
    if (this.pdc.enabled) {
      this.pdc.uniforms.focus.value = g.nette;
      this.pdc.uniforms.aperture.value = g.ouverture ?? 0.0025;
      this.pdc.uniforms.maxblur.value = g.flouMax ?? 0.006;
    }
    // pas de traînée d'un plan à l'autre : on coupe la rémanence à chaque changement de plan
    if (this.remanence.enabled) this.remanence.uniforms.damp.value = p === this.planPrecedent ? (g.remanence ?? 0.32) : 0;
    this.planPrecedent = p;
    this.compo.render(dt);
  }

  appliquer(g, T) {
    const u = this.grade.uniforms;
    u.temps.value = T;
    for (const k of ['vignette', 'grain', 'aberration', 'tube', 'neige', 'bandes', 'noir', 'blanc', 'saturation', 'contraste', 'effondrement']) u[k].value = g[k];
    u.teinte.value.set(...g.teinte);
    u.ombres.value.set(...g.ombres);
    this.bloom.strength = g.bloom;
    this.bloom.radius = g.bloomRayon;
    this.bloom.threshold = g.bloomSeuil;
    this.rendu.toneMappingExposure = g.exposition;
  }

  detruire() {
    for (const p of [...this.montes.keys()]) this.demonter(p);
    this.compo.dispose && this.compo.dispose();
    this.rendu.dispose();
  }
}

export { THREE };
