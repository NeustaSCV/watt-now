/* Watt Now? — intro 3D : les briques de décor. Même style que le jeu (Book 18 §2 : lisse, facettes, couleurs
   franches), construites en code : boîtes, cylindres, écrans, ciels, sols, particules (vapeur, pluie, étincelles,
   jets d'eau, fumée), herbe. */

import { THREE, aleatoire, RoundedBoxGeometry } from '../vendor/rendu-jeu.js';

export { aleatoire };

/** Le vent : un temps partagé par l'herbe et les feuillages (le moteur l'avance à chaque image). */
export const VENT = { value: 0 };

const CACHE = new Map();
/** Un matériau mat, lisse (sans facettes) : pour la cinématique, on n'économise rien. */
export function materiau(couleur, o = {}) {
  const cle = `${couleur}|${o.rugosite ?? 0.9}|${o.metal ?? 0}`;
  if (!CACHE.has(cle)) CACHE.set(cle, new THREE.MeshStandardMaterial({ color: couleur, roughness: o.rugosite ?? 0.9, metalness: o.metal ?? 0 }));
  return CACHE.get(cle);
}

/** Un matériau lisse (non facetté), pour les objets manufacturés de l'Abondance (plastique, laque, chrome). */
export function lisse(couleur, o = {}) {
  return new THREE.MeshStandardMaterial({ color: couleur, roughness: o.rugosite ?? 0.45, metalness: o.metal ?? 0, emissive: o.emission ?? 0, emissiveIntensity: o.intensite ?? 1, transparent: !!o.transparent, opacity: o.opacite ?? 1, side: o.double ? THREE.DoubleSide : THREE.FrontSide });
}

/** Ajoute une maille à un parent, avec ombres. */
export function maille(parent, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

/** Une boîte aux arêtes arrondies (elles accrochent la lumière : rien n'a l'air découpé au couteau). */
export function geoBoite(l, h, pr) {
  const m = Math.min(l, h, pr);
  const r = Math.min(0.03, m * 0.18);
  if (r < 0.002 || Math.max(l, h, pr) > 40) return new THREE.BoxGeometry(l, h, pr);
  return new RoundedBoxGeometry(l, h, pr, 3, r);
}
export const boite = (p, l, h, pr, mat, x, y, z, rx, ry, rz) => maille(p, geoBoite(l, h, pr), mat, x, y, z, rx, ry, rz);
export const cyl = (p, r1, r2, h, mat, x, y, z, rx, ry, rz, n = 16) => maille(p, new THREE.CylinderGeometry(r1, r2, h, Math.max(32, n * 2)), mat, x, y, z, rx, ry, rz);
export const boule = (p, r, mat, x, y, z, n = 16) => maille(p, new THREE.SphereGeometry(r, Math.max(32, n * 2), Math.max(16, n)), mat, x, y, z);

/** Un écran : un plan émissif qui montre une texture (télé, montre, frigo, téléphone). */
export function ecran(parent, texture, l, h, x, y, z, ry = 0, intensite = 1.4) {
  const mat = new THREE.MeshBasicMaterial({ map: texture, toneMapped: true });
  mat.color.setScalar(intensite);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(l, h), mat);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  parent.add(m);
  return m;
}

/** Un ciel : une grande sphère dégradée (haut, horizon, bas), éventuellement avec des étoiles. */
export function ciel(scene, haut, horizon, bas = horizon, o = {}) {
  const geo = new THREE.SphereGeometry(o.rayon || 400, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { haut: { value: new THREE.Color(haut) }, horizon: { value: new THREE.Color(horizon) }, bas: { value: new THREE.Color(bas) }, etoiles: { value: o.etoiles || 0 }, nuages: { value: o.nuages ?? 0 }, couleurNuages: { value: new THREE.Color(o.couleurNuages ?? 0xffffff) }, temps: VENT, soleil: { value: new THREE.Vector3(...(o.soleil || [0, -1, 0])).normalize() }, couleurSoleil: { value: new THREE.Color(o.couleurSoleil || 0xffe2a0) }, tailleSoleil: { value: o.tailleSoleil || 0 } },
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 haut, horizon, bas, couleurSoleil, soleil, couleurNuages; uniform float etoiles, tailleSoleil, nuages, temps; varying vec3 vD;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
      float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float bruit(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(h2(i), h2(i+vec2(1,0)), f.x), mix(h2(i+vec2(0,1)), h2(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * bruit(p); p *= 2.03; a *= 0.5; } return v; }
      void main(){
        float y = vD.y;
        vec3 c = y > 0.0 ? mix(horizon, haut, pow(clamp(y,0.0,1.0), 0.6)) : mix(horizon, bas, pow(clamp(-y,0.0,1.0), 0.4));
        if (etoiles > 0.0 && y > 0.05) { vec3 q = floor(vD * 420.0); float s = step(0.9975, h(q)); c += vec3(s) * etoiles * smoothstep(0.05, 0.3, y) * (0.5 + 0.5 * h(q + 1.0)); }
        if (nuages > 0.0 && y > 0.0) {
          vec2 p = vD.xz / (y + 0.12) * 1.6 + vec2(temps * 0.01, 0.0);
          float n = fbm(p) * 0.75 + fbm(p * 2.7 + 3.0) * 0.35;
          float couv = smoothstep(1.0 - nuages * 0.75, 1.05, n) * smoothstep(0.0, 0.18, y);
          vec3 cn = couleurNuages * (0.75 + 0.35 * fbm(p * 1.3 + 7.0));
          c = mix(c, cn, couv * 0.9);
        }
        if (tailleSoleil > 0.0) { float d = dot(vD, soleil); c += couleurSoleil * (smoothstep(1.0 - tailleSoleil, 1.0 - tailleSoleil * 0.6, d) * 2.0 + pow(max(d, 0.0), 24.0) * 0.6); }
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const m = new THREE.Mesh(geo, mat);
  m.renderOrder = -10;
  m.frustumCulled = false;
  // le ciel suit la caméra et reste toujours en deçà de sa portée (sinon une facette passe derrière et laisse un trou noir)
  m.onBeforeRender = (r, s, cam) => { m.position.copy(cam.position); m.scale.setScalar((cam.far * 0.85) / (o.rayon || 400)); m.updateMatrixWorld(); };
  scene.add(m);
  return m;
}

/** Un sol : un disque, éventuellement ondulé (collines douces). */
export function sol(scene, couleur, rayon = 80, o = {}) {
  const geo = new THREE.PlaneGeometry(rayon * 2, rayon * 2, o.segments || 64, o.segments || 64).rotateX(-Math.PI / 2);
  if (o.relief) {
    const p = geo.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), d = Math.hypot(x, z);
      const plat = Math.min(1, Math.max(0, (d - (o.plat || 8)) / 20));
      p.setY(i, (Math.sin(x * 0.07 + 1.3) * Math.cos(z * 0.05) * o.relief + Math.sin(x * 0.19 + z * 0.13) * o.relief * 0.3) * plat);
    }
    geo.computeVertexNormals();
  }
  const m = new THREE.Mesh(geo, materiau(couleur, { rugosite: 1 }));
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

/** Un brin d'herbe : une lame effilée, courbée, en quatre étages (instanciée). */
function geoBrin() {
  const etages = 4, pos = [], idx = [];
  for (let i = 0; i <= etages; i++) {
    const v = i / etages, l = 0.014 * (1 - v * 0.9), cour = v * v * 0.22;
    pos.push(-l, v, cour, l, v, cour);
  }
  for (let i = 0; i < etages; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Un matériau d'herbe qui ondule au vent (le haut du brin bouge, le pied reste). */
function materiauHerbe() {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uVent = VENT;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uVent;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec4 pied = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float souffle = sin(uVent * 1.6 + pied.x * 0.7 + pied.z * 0.45) * 0.6 + sin(uVent * 3.1 + pied.x * 2.3) * 0.25;
        transformed.z += souffle * 0.18 * position.y * position.y;
        transformed.x += souffle * 0.06 * position.y * position.y;`);
  };
  return m;
}

/** De l'herbe : des milliers de brins, couleurs et tailles variées, qui ondulent. */
export function herbe(scene, n, rayon, couleurs = [0x7fa35a, 0x9aa65e, 0x5f7f45], graine = 3, centre = [0, 0], hauteur = 0.35, exclure = 0) {
  const a = aleatoire(graine);
  const total = Math.round(n * 9);
  const im = new THREE.InstancedMesh(geoBrin(), materiauHerbe(), total);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
  for (let i = 0; i < total; i++) {
    let x, z;
    do { x = centre[0] + (a() * 2 - 1) * rayon; z = centre[1] + (a() * 2 - 1) * rayon; } while (Math.hypot(x - centre[0], z - centre[1]) < exclure);
    e.set((a() - 0.5) * 0.35, a() * Math.PI * 2, (a() - 0.5) * 0.35); q.setFromEuler(e);
    const h = hauteur * (0.45 + a() * 0.9);
    m.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(0.7 + a() * 0.8, h, 1));
    im.setMatrixAt(i, m);
    c.set(couleurs[Math.floor(a() * couleurs.length)]).offsetHSL((a() - 0.5) * 0.03, (a() - 0.5) * 0.1, (a() - 0.5) * 0.08);
    im.setColorAt(i, c);
  }
  im.receiveShadow = true;
  im.castShadow = false;
  scene.add(im);
  return im;
}

/* ------------------------------------------------------------------ Particules */

/**
 * Un système de particules simple et déterministe : chaque particule a une graine, un âge cyclique, une trajectoire.
 * trajet(i, age, alea) → [x, y, z, taille, opacite]. Rendu en points texturés (disque doux), additif ou non.
 */
export function particules(parent, n, trajet, o = {}) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3), tailles = new Float32Array(n), alphas = new Float32Array(n);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('taille', new THREE.BufferAttribute(tailles, 1));
  geo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: o.additif ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: { couleur: { value: new THREE.Color(o.couleur ?? 0xffffff) }, echelle: { value: o.echelle ?? 300 }, dur: { value: o.dur ?? 0 } },
    vertexShader: `attribute float taille; attribute float alpha; varying float vA; uniform float echelle;
      void main(){ vA = alpha; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = taille * echelle / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 couleur; uniform float dur; varying float vA;
      void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = mix(1.0 - smoothstep(0.0, 1.0, d), 1.0 - smoothstep(0.8, 1.0, d), dur); if (a <= 0.0) discard; gl_FragColor = vec4(couleur, a * vA); }`,
  });
  if (o.toneMapped === false) mat.toneMapped = false;
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.renderOrder = o.ordre ?? 2;
  parent.add(pts);
  const alea = Array.from({ length: n }, (_, i) => aleatoire(i * 7919 + (o.graine || 1)));
  const graines = alea.map((r) => [r(), r(), r(), r()]);
  return {
    objet: pts, materiau: mat,
    maj(t) {
      for (let i = 0; i < n; i++) {
        const r = trajet(i, t, graines[i]);
        pos[i * 3] = r[0]; pos[i * 3 + 1] = r[1]; pos[i * 3 + 2] = r[2];
        tailles[i] = r[3]; alphas[i] = r[4];
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.taille.needsUpdate = true;
      geo.attributes.alpha.needsUpdate = true;
    },
  };
}

/** Vapeur qui monte (d'un bol, d'une bouilloire), poussée par un vent latéral `vent(t)` (m/s). */
export function vapeur(parent, x, y, z, vent = () => 0, n = 40) {
  return particules(parent, n, (i, t, [a, b, c]) => {
    const vie = 2.2, age = ((t + a * vie) % vie) / vie;
    const v = vent(t);
    return [x + (b - 0.5) * 0.06 - v * age * 0.6 + Math.sin(age * 6 + c * 6) * 0.02, y + age * 0.35 * (1 - Math.min(1, Math.abs(v)) * 0.5), z + (c - 0.5) * 0.06, 0.05 + age * 0.12, Math.sin(age * Math.PI) * 0.45];
  }, { couleur: 0xffffff, echelle: 600 });
}

/** Étincelles d'un coup (forge, court-circuit) : jaillissent à `quand(t)` (secondes depuis le dernier coup). */
export function etincelles(parent, x, y, z, depuisCoup, n = 60, o = {}) {
  return particules(parent, n, (i, t, [a, b, c, d]) => {
    const u = depuisCoup(t) * (0.8 + d * 0.5);
    if (u < 0 || u > 0.9) return [0, -100, 0, 0, 0];
    const ang = a * Math.PI * 2, vit = 1.5 + b * 3;
    const vy = 1.5 + c * 3;
    return [x + Math.cos(ang) * vit * u, y + vy * u - 4.9 * u * u, z + Math.sin(ang) * vit * u, 0.025, 1 - u / 0.9];
  }, { couleur: o.couleur ?? 0xffc46a, additif: true, echelle: 900, toneMapped: false });
}

/** Pluie : traits qui tombent dans une boîte autour de la caméra. */
export function pluie(scene, centre, rayon = 12, n = 1600, vitesse = 9) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 6);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({ color: 0xb9c8da, transparent: true, opacity: 0.35 });
  const lignes = new THREE.LineSegments(geo, mat);
  lignes.frustumCulled = false;
  scene.add(lignes);
  const a = aleatoire(77);
  const base = Array.from({ length: n }, () => [a() * 2 - 1, a(), a() * 2 - 1, 0.6 + a() * 0.6]);
  return {
    objet: lignes,
    maj(t) {
      for (let i = 0; i < n; i++) {
        const [bx, by, bz, v] = base[i];
        const y = 12 - (((by * 12) + t * vitesse * v) % 12);
        const x = centre[0] + bx * rayon, z = centre[2] + bz * rayon;
        pos.set([x, y, z, x - 0.04, y - 0.35, z], i * 6);
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}

/** Fumée : de grosses boules douces qui montent et s'élargissent. */
export function fumee(parent, x, y, z, o = {}) {
  return particules(parent, o.n || 30, (i, t, [a, b, c]) => {
    const vie = o.vie || 7, age = ((t + a * vie) % vie) / vie;
    return [x + (b - 0.5) * 0.3 + age * (o.derive || 1.2), y + age * (o.hauteur || 6), z + (c - 0.5) * 0.3, 0.4 + age * (o.taille || 2.4), Math.sin(age * Math.PI) * (o.opacite || 0.35)];
  }, { couleur: o.couleur ?? 0x8a8590, echelle: 260 });
}

/** Un jet d'eau en arc (arroseur) qui balaie. */
export function jet(parent, x, y, z, balayage = (t) => 0, n = 70) {
  return particules(parent, n, (i, t, [a, b, c]) => {
    const vie = 0.9, age = ((t + a * vie) % vie) / vie;
    const ang = balayage(t - age * vie);
    const v = 3.2 + b * 0.6;
    const d = v * age * vie;
    return [x + Math.cos(ang) * d, y + 2.6 * age * vie - 4.9 * (age * vie) * (age * vie) * 1.0, z + Math.sin(ang) * d, 0.05 + age * 0.05, 0.9 * (1 - age * 0.5)];
  }, { couleur: 0xeef8ff, echelle: 900 });
}

/** Une lumière ponctuelle qui vacille (feu, braise). */
export function lumiereFeu(parent, x, y, z, intensite = 20, portee = 10, ombre = true) {
  const l = new THREE.PointLight(0xff8a3a, intensite, portee, 2);
  l.position.set(x, y, z);
  if (ombre) { l.castShadow = true; l.shadow.mapSize.set(1024, 1024); l.shadow.bias = -0.002; l.shadow.radius = 4; }
  parent.add(l);
  return {
    lumiere: l,
    maj(t, force = 1) { l.intensity = intensite * force * (1 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3 + 1) * 0.1 + Math.sin(t * 23.1) * 0.04); },
  };
}

/** Lumière de remplissage + contre-jour : trois points, réglables. */
export function eclairage(scene, o = {}) {
  const hemi = new THREE.HemisphereLight(o.ciel ?? 0xcfe0f0, o.sol ?? 0x4d5a3a, o.ambiance ?? 0.8);
  scene.add(hemi);
  const cle = new THREE.DirectionalLight(o.couleur ?? 0xfff0dc, o.force ?? 2.4);
  cle.position.set(...(o.position || [6, 9, 5]));
  cle.castShadow = true;
  cle.shadow.mapSize.set(2048, 2048);
  const c = cle.shadow.camera; const d = o.ombre || 8;
  c.left = -d; c.right = d; c.top = d; c.bottom = -d; c.near = 0.5; c.far = 60;
  cle.shadow.bias = -0.0004; cle.shadow.normalBias = 0.02;
  if (o.cible) cle.target.position.set(...o.cible);
  scene.add(cle, cle.target);
  let contre = null;
  if (o.contre !== false) {
    contre = new THREE.DirectionalLight(o.couleurContre ?? 0xbfd8ff, o.forceContre ?? 1.0);
    contre.position.set(...(o.positionContre || [-5, 4, -7]));
    scene.add(contre);
  }
  return { hemi, cle, contre };
}

/* ------------------------------------------------------------------ Le pommier de cinéma */

/** Une feuille : un ovale pointu, légèrement creusé. */
function geoFeuille() {
  const f = new THREE.Shape();
  f.moveTo(0, 0); f.quadraticCurveTo(0.05, 0.05, 0, 0.13); f.quadraticCurveTo(-0.05, 0.05, 0, 0);
  const g = new THREE.ShapeGeometry(f, 6);
  const p = g.getAttribute('position');
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.abs(p.getX(i)) * 0.4);
  g.computeVertexNormals();
  return g;
}

/**
 * Un pommier : tronc et branches en tubes courbes, des milliers de feuilles instanciées qui frémissent au vent,
 * des pommes lisses (queue et petite feuille). Renvoie { objet, pommes: [Vector3 monde local] }.
 */
export function pommierCinema(graine = 5, o = {}) {
  const a = aleatoire(graine);
  const g = new THREE.Group();
  const ecorce = new THREE.MeshStandardMaterial({ color: 0x6b4a32, roughness: 0.95 });
  const branches = [];
  const tronc = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.05, 0.8, 0.02), new THREE.Vector3(-0.04, 1.5, 0.05), new THREE.Vector3(0.02, 2.0, 0)]);
  maille(g, new THREE.TubeGeometry(tronc, 24, 0.13, 16).translate(0, 0, 0), ecorce);
  maille(g, new THREE.CylinderGeometry(0.13, 0.22, 0.3, 16), ecorce, 0.02, 0.12, 0);
  for (let i = 0; i < 7; i++) {
    const ang = (i / 7) * Math.PI * 2 + a() * 0.6, dep = 1.3 + a() * 0.7, lon = 0.9 + a() * 0.8;
    const p0 = tronc.getPoint(dep / 2.0 * 0.9 + 0.05);
    const dir = new THREE.Vector3(Math.cos(ang), 0.6 + a() * 0.5, Math.sin(ang)).normalize();
    const c = new THREE.CatmullRomCurve3([p0, p0.clone().addScaledVector(dir, lon * 0.5).add(new THREE.Vector3(0, 0.15, 0)), p0.clone().addScaledVector(dir, lon)]);
    maille(g, new THREE.TubeGeometry(c, 12, 0.055 - i * 0.003, 10), ecorce);
    branches.push(c);
  }
  // le feuillage : des milliers de feuilles autour de masses (houppier en grappes)
  const centres = [];
  for (const c of branches) for (let k = 0; k < 4; k++) centres.push(c.getPoint(0.55 + k * 0.15));
  centres.push(new THREE.Vector3(0, 2.4, 0), new THREE.Vector3(0.3, 2.6, 0.2), new THREE.Vector3(-0.3, 2.5, -0.2));
  const n = o.feuilles || 9000;
  const feuilles = new THREE.InstancedMesh(geoFeuille(), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, side: THREE.DoubleSide }), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color();
  const tons = [0x4f7a32, 0x5f8a3a, 0x3f6a2a, 0x6f9a42, 0x58803a];
  for (let i = 0; i < n; i++) {
    const ce = centres[Math.floor(a() * centres.length)];
    const r = 0.55 * Math.cbrt(a());
    const th = a() * Math.PI * 2, ph = Math.acos(2 * a() - 1);
    const pos = new THREE.Vector3(ce.x + r * Math.sin(ph) * Math.cos(th), ce.y + r * Math.cos(ph) * 0.8, ce.z + r * Math.sin(ph) * Math.sin(th));
    e.set(a() * Math.PI * 2, a() * Math.PI * 2, a() * Math.PI * 2); q.setFromEuler(e);
    const t = 0.8 + a() * 0.6;
    m.compose(pos, q, new THREE.Vector3(t, t, t));
    feuilles.setMatrixAt(i, m);
    feuilles.setColorAt(i, col.set(tons[Math.floor(a() * tons.length)]).offsetHSL(0, 0, (a() - 0.5) * 0.08));
  }
  feuilles.castShadow = true; feuilles.receiveShadow = true;
  g.add(feuilles);
  // les pommes
  const pommes = [];
  const rouge = new THREE.MeshStandardMaterial({ color: 0xb8261c, roughness: 0.35 });
  const queue = new THREE.MeshStandardMaterial({ color: 0x4a3420, roughness: 0.9 });
  for (let i = 0; i < (o.pommes || 26); i++) {
    const ce = centres[Math.floor(a() * centres.length)];
    const th = a() * Math.PI * 2;
    const p = new THREE.Vector3(ce.x + Math.cos(th) * 0.5, ce.y - 0.15 - a() * 0.25, ce.z + Math.sin(th) * 0.5);
    const pomme = new THREE.Group(); pomme.position.copy(p); g.add(pomme);
    const s = new THREE.SphereGeometry(0.055, 32, 24);
    const sp = s.getAttribute('position');
    for (let k = 0; k < sp.count; k++) { const y = sp.getY(k); sp.setY(k, y * 0.9 - Math.max(0, 0.04 - Math.hypot(sp.getX(k), sp.getZ(k))) * 0.5 * Math.sign(y)); }
    s.computeVertexNormals();
    maille(pomme, s, rouge);
    maille(pomme, new THREE.CylinderGeometry(0.003, 0.004, 0.04, 6), queue, 0, 0.065, 0, 0, 0, 0.3);
    pommes.push(pomme);
  }
  return { objet: g, pommes };
}
