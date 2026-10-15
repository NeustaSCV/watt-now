// Les effets de la scène de nuit : la mer (reflets des feux calculés dans le nuanceur, sans rendu en miroir), le ciel
// couvert, les faisceaux (phare, projecteur), les halos des feux, les gerbes (écume, étincelles) et l'anneau d'écume.
// Tout est calculé à partir du temps de la scène : on peut rejouer, revenir en arrière, figer une image.

import * as THREE from "three";

// ---------- Morceaux de nuanceur communs ----------

const BRUIT = /* glsl */ `
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float bruit(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++) { v += a * bruit(p); p = p * 2.03 + 17.1; a *= 0.5; } return v; }
`;

const FIN = /* glsl */ `
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
`;

export const NB_FEUX = 10;

// ---------- La mer ----------

/**
 * Un seul grand plan. La houle est dans les normales (une somme de vagues), les reflets des feux sont calculés feu par
 * feu (une colonne de paillettes qui s'allonge vers la caméra, comme dans la réalité), plus la tache du projecteur et
 * la traînée du faisceau du phare sur l'eau au loin.
 */
export function creerMer(niveau, couleurs) {
  const uniforms = {
    uTemps: { value: 0 },
    uFeuxPos: { value: Array.from({ length: NB_FEUX }, () => new THREE.Vector3(0, -100, 0)) },
    uFeuxCoul: { value: Array.from({ length: NB_FEUX }, () => new THREE.Color(0)) },
    uProjPos: { value: new THREE.Vector3() },
    uProjDir: { value: new THREE.Vector3(0, -1, 0) },
    uProjCoul: { value: new THREE.Color(0) },
    uPhare: { value: new THREE.Vector3() },
    uPhareDir: { value: new THREE.Vector3(1, 0, 0) },
    uPhareCoul: { value: new THREE.Color(0) },
    uFond: { value: new THREE.Color(couleurs.fond) },
    uHorizon: { value: new THREE.Color(couleurs.horizon) },
    uZenith: { value: new THREE.Color(couleurs.zenith) },
    uBrume: { value: new THREE.Color(couleurs.brume) },
    uBrumeLoin: { value: new THREE.Vector2(60, 520) },
    uCalme: { value: 1 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vMonde;
      void main() {
        vec4 m = modelMatrix * vec4(position, 1.0);
        vMonde = m.xyz;
        gl_Position = projectionMatrix * viewMatrix * m;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTemps;
      uniform vec3 uFeuxPos[${NB_FEUX}];
      uniform vec3 uFeuxCoul[${NB_FEUX}];
      uniform vec3 uProjPos; uniform vec3 uProjDir; uniform vec3 uProjCoul;
      uniform vec3 uPhare; uniform vec3 uPhareDir; uniform vec3 uPhareCoul;
      uniform vec3 uFond; uniform vec3 uHorizon; uniform vec3 uZenith; uniform vec3 uBrume;
      uniform vec2 uBrumeLoin;
      uniform float uCalme;
      varying vec3 vMonde;
      ${BRUIT}
      vec2 vague(vec2 p, vec2 d, float lg, float pente, float vit) {
        float k = 6.2831 / lg;
        float ph = dot(d, p) * k - uTemps * vit * sqrt(9.8 * k);
        return d * pente * cos(ph);
      }
      void main() {
        vec3 versCam = cameraPosition - vMonde;
        float dist = length(versCam);
        vec3 V = versCam / dist;
        vec2 p = vMonde.xz;
        // La houle du suroît : de longues vagues qui montent vers la côte, puis le clapot, puis le frisson
        vec2 g = vague(p, normalize(vec2(0.15, -1.0)), 11.0, 0.065, 1.0);
        g += vague(p, normalize(vec2(-0.45, -1.0)), 6.3, 0.045, 1.0);
        g += vague(p, normalize(vec2(0.8, -0.6)), 3.1, 0.035, 1.0);
        g += vague(p, normalize(vec2(-0.9, -0.3)), 1.7, 0.03, 1.0);
        float fin = clamp(1.0 - dist / 90.0, 0.0, 1.0);
        g += (vec2(bruit(p * 2.3 + uTemps * 0.6), bruit(p * 2.3 - uTemps * 0.5 + 9.0)) - 0.5) * 0.04 * fin;
        g += (vec2(bruit(p * 7.0 - uTemps * 1.1), bruit(p * 7.0 + uTemps * 0.9 + 4.0)) - 0.5) * 0.05 * fin;
        float att = mix(0.35, 1.0, clamp(1.0 - dist / 420.0, 0.0, 1.0));
        vec3 N = normalize(vec3(-g.x * att, 1.0, -g.y * att));
        float nv = max(dot(N, V), 0.0);
        float fres = 0.02 + 0.98 * pow(1.0 - nv, 5.0);
        vec3 R = reflect(-V, N);
        vec3 ciel = mix(uHorizon, uZenith, clamp(R.y * 1.6, 0.0, 1.0));
        // les nuages qui passent dans le reflet
        ciel *= 0.85 + 0.3 * bruit(R.xz / max(R.y, 0.08) * 0.5 + uTemps * 0.02);
        vec3 coul = uFond * (0.6 + 0.4 * N.y) + ciel * fres;
        // Les feux : une colonne de paillettes (spéculaire serré) et un halo plus large (spéculaire lâche)
        for (int i = 0; i < ${NB_FEUX}; i++) {
          vec3 L = uFeuxPos[i] - vMonde;
          float d = length(L);
          L /= d;
          float s = max(dot(R, L), 0.0);
          float a = 1.0 / (1.0 + d * d * 0.0009) * mix(0.2, 1.0, smoothstep(10.0, 45.0, dist));
          coul += uFeuxCoul[i] * (pow(s, 420.0) * 3.4 + pow(s, 24.0) * 0.012) * a;
        }
        // La tache du projecteur du cargo sur l'eau
        {
          vec3 L = vMonde - uProjPos;
          float d = length(L);
          float c = dot(L / d, uProjDir);
          float cone = smoothstep(0.955, 0.99, c);
          coul += uProjCoul * cone * (0.025 + 0.3 * pow(max(dot(R, -L / d), 0.0), 40.0)) / (1.0 + d * d * 0.0012);
        }
        // Le faisceau du phare qui balaie l'eau au loin
        {
          vec3 L = vMonde - uPhare;
          float d = length(L.xz);
          vec2 h = L.xz / d;
          float a = max(dot(h, uPhareDir.xz), dot(h, -uPhareDir.xz));
          float bande = smoothstep(0.990, 0.9995, a) * smoothstep(90.0, 200.0, d) * (1.0 - smoothstep(300.0, 560.0, d));
          coul += uPhareCoul * bande * (0.02 + 0.25 * fres);
        }
        float b = smoothstep(uBrumeLoin.x, uBrumeLoin.y, dist);
        coul = mix(coul, uBrume, b);
        gl_FragColor = vec4(coul, 1.0);
        ${FIN}
      }`,
  });
  const g = new THREE.PlaneGeometry(1600, 1600).rotateX(-Math.PI / 2);
  const mer = new THREE.Mesh(g, mat);
  mer.position.set(0, niveau, 600);
  mer.renderOrder = -5;
  return mer;
}

// ---------- Le ciel ----------

export function creerCiel(couleurs) {
  const uniforms = {
    uTemps: { value: 0 },
    uHorizon: { value: new THREE.Color(couleurs.horizon) },
    uZenith: { value: new THREE.Color(couleurs.zenith) },
    uNuage: { value: new THREE.Color(couleurs.nuage) },
    uLune: { value: new THREE.Vector3(-0.5, 0.42, 0.75).normalize() },
    uPhareDir: { value: new THREE.Vector3(1, 0, 0) },
    uPhareCoul: { value: new THREE.Color(0) },
    uEclair: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = position;
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTemps; uniform vec3 uHorizon; uniform vec3 uZenith; uniform vec3 uNuage; uniform vec3 uLune;
      uniform vec3 uPhareDir; uniform vec3 uPhareCoul; uniform float uEclair;
      varying vec3 vDir;
      ${BRUIT}
      void main() {
        vec3 d = normalize(vDir);
        float h = clamp(d.y, 0.0, 1.0);
        vec3 coul = mix(uHorizon, uZenith, pow(h, 0.55));
        float m = max(dot(d, uLune), 0.0);
        // Le plafond nuageux : projeté sur un plan, il défile lentement vers le nord-est
        vec2 uv = d.xz / (d.y + 0.12) * 0.9 + vec2(uTemps * 0.012, -uTemps * 0.02);
        float n = fbm(uv);
        float trous = smoothstep(0.62, 0.36, n);
        float lueurLune = pow(m, 6.0) * 0.55 + pow(m, 60.0) * 0.9;
        vec3 nuage = uNuage * (0.55 + 0.9 * n) * (0.5 + lueurLune * 1.6);
        coul = mix(coul * (0.6 + 0.4 * trous), nuage, smoothstep(0.32, 0.7, n) * smoothstep(-0.02, 0.18, d.y));
        // la lune qui perce dans un trou, avec son liseré sur le bord des nuages
        coul += vec3(0.85, 0.9, 1.0) * smoothstep(0.99935, 0.99965, m) * trous * 1.2;
        coul += vec3(0.25, 0.3, 0.4) * pow(m, 18.0) * (1.0 - trous) * 0.5;
        // Le faisceau du phare qui éclaire le dessous des nuages (les deux pinceaux)
        vec3 dh = normalize(vec3(d.x, 0.0, d.z));
        float a = max(dot(dh, uPhareDir), dot(dh, -uPhareDir));
        float f = pow(max(a, 0.0), 160.0) * smoothstep(-0.05, 0.05, d.y) * (1.0 - smoothstep(0.05, 0.5, d.y));
        coul += uPhareCoul * f * (0.4 + 0.8 * n);
        coul += vec3(1.0, 0.75, 0.5) * uEclair * 0.18 * smoothstep(-0.1, 0.3, d.y);
        gl_FragColor = vec4(coul, 1.0);
        ${FIN}
      }`,
  });
  const ciel = new THREE.Mesh(new THREE.SphereGeometry(700, 32, 16), mat);
  ciel.renderOrder = -10;
  ciel.frustumCulled = false;
  return ciel;
}

// ---------- Faisceaux (cônes additifs, plus clairs près de la source et au cœur) ----------

export function materiauFaisceau(couleur, force = 1, longueur = 100) {
  return new THREE.ShaderMaterial({
    uniforms: { uCoul: { value: new THREE.Color(couleur) }, uForce: { value: force }, uLong: { value: longueur } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying float vLe; varying vec3 vN; varying vec3 vMonde;
      uniform float uLong;
      void main() {
        vLe = clamp(position.z / uLong, 0.0, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 m = modelMatrix * vec4(position, 1.0);
        vMonde = m.xyz;
        gl_Position = projectionMatrix * viewMatrix * m;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uCoul; uniform float uForce;
      varying float vLe; varying vec3 vN; varying vec3 vMonde;
      void main() {
        vec3 V = normalize(cameraPosition - vMonde);
        float coeur = pow(abs(dot(normalize(vN), V)), 2.2);
        float a = pow(1.0 - vLe, 1.8) * coeur * uForce * (0.25 + 0.75 * smoothstep(0.0, 0.04, vLe));
        gl_FragColor = vec4(uCoul * a, 1.0);
        ${FIN}
      }`,
  });
}

/** Un cône, sommet à l'origine, ouvert vers +z, de longueur `lg` et de rayon `r` au bout. */
export function geoCone(lg, r, cotes = 20) {
  return new THREE.ConeGeometry(r, lg, cotes, 6, true).translate(0, -lg / 2, 0).rotateX(-Math.PI / 2);
}

// ---------- Halos (lutins additifs) ----------

let texHalo = null;
export function textureHalo() {
  if (texHalo) return texHalo;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const d = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  d.addColorStop(0, "rgba(255,255,255,1)");
  d.addColorStop(0.08, "rgba(255,255,255,0.9)");
  d.addColorStop(0.22, "rgba(255,255,255,0.32)");
  d.addColorStop(0.5, "rgba(255,255,255,0.08)");
  d.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = d;
  g.fillRect(0, 0, 128, 128);
  texHalo = new THREE.CanvasTexture(c);
  texHalo.colorSpace = THREE.SRGBColorSpace;
  return texHalo;
}

export function halo(couleur, taille) {
  const m = new THREE.SpriteMaterial({ map: textureHalo(), color: couleur, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(taille);
  s.userData.taille = taille;
  s.renderOrder = 5;
  return s;
}

// ---------- Gerbes de particules (tout est calculé dans le nuanceur à partir du temps) ----------

/**
 * `emettre(n, f)` : f(i) renvoie { p: [x, y, z], v: [vx, vy, vz], t0, vie, taille }. `mode` : "ecume" (mélange normal,
 * gris-bleu, s'étale) ou "etincelles" (additif, orangé, rétrécit).
 */
export function creerGerbe(n, f, mode = "ecume") {
  const P = new Float32Array(n * 3);
  const Vv = new Float32Array(n * 3);
  const T = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const e = f(i);
    P.set(e.p, i * 3);
    Vv.set(e.v, i * 3);
    T.set([e.t0, e.vie, e.taille], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(P, 3));
  g.setAttribute("aV", new THREE.BufferAttribute(Vv, 3));
  g.setAttribute("aT", new THREE.BufferAttribute(T, 3));
  const ecume = mode === "ecume";
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTemps: { value: 0 },
      uEchelle: { value: 600 },
      uCoul: { value: new THREE.Color(ecume ? 0xd0dbe6 : 0xffa550) },
      uChaud: { value: new THREE.Color(0xffb070) },
      uEclair: { value: 0 },
      uMer: { value: -9 },
    },
    transparent: true,
    depthWrite: false,
    blending: ecume ? THREE.NormalBlending : THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 aV; attribute vec3 aT;
      uniform float uTemps; uniform float uEchelle; uniform float uMer;
      varying float vA; varying float vY;
      void main() {
        float age = uTemps - aT.x;
        float vie = aT.y;
        if (age < 0.0 || age > vie) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vA = 0.0; return; }
        float k = ${ecume ? "1.1" : "2.2"};
        float fr = (1.0 - exp(-k * age)) / k;
        vec3 p = position + aV * fr;
        p.y -= 9.8 * ${ecume ? "0.55" : "0.8"} * age * age * 0.5;
        vY = p.y;
        float x = age / vie;
        vA = ${ecume ? "smoothstep(0.0, 0.08, x) * (1.0 - x) * (1.0 - x)" : "(1.0 - x)"};
        if (p.y < uMer - 0.2) vA *= 0.0;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float t = aT.z * ${ecume ? "(0.6 + 1.6 * x)" : "(1.0 - 0.6 * x)"};
        gl_PointSize = clamp(t * uEchelle / -mv.z, 1.0, 140.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uCoul; uniform vec3 uChaud; uniform float uEclair;
      varying float vA; varying float vY;
      void main() {
        vec2 q = gl_PointCoord - 0.5;
        float r = length(q) * 2.0;
        float a = ${ecume ? "smoothstep(1.0, 0.15, r) * 0.55" : "smoothstep(1.0, 0.0, r)"} * vA;
        if (a < 0.003) discard;
        vec3 c = uCoul + uChaud * uEclair * 0.6;
        gl_FragColor = vec4(c * ${ecume ? "1.0" : "a * 2.0"}, ${ecume ? "a" : "1.0"});
        ${FIN}
      }`,
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  pts.renderOrder = 4;
  return pts;
}

// ---------- L'anneau d'écume, au choc ----------

export function creerAnneau() {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uAge: { value: -1 }, uCoul: { value: new THREE.Color(0xc6d3dc) } },
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uAge; uniform vec3 uCoul;
      varying vec2 vUv;
      ${BRUIT}
      void main() {
        if (uAge < 0.0) discard;
        vec2 q = (vUv - 0.5) * 2.0;
        float r = length(q);
        float R = 0.18 + 0.75 * sqrt(clamp(uAge / 3.0, 0.0, 1.0));
        float n = fbm(q * 6.0 + uAge * 0.3);
        float anneau = smoothstep(0.16, 0.0, abs(r - R) - 0.03 * n) * (0.55 + 0.6 * n);
        float plaque = smoothstep(R, R * 0.2, r) * smoothstep(0.35, 0.7, n) * 0.7;
        float a = (anneau + plaque) * (1.0 - smoothstep(0.6, 4.5, uAge)) * smoothstep(0.98, 0.9, r);
        if (a < 0.01) discard;
        gl_FragColor = vec4(uCoul, a * 0.8);
        ${FIN}
      }`,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), mat);
  m.renderOrder = 3;
  return m;
}

// ---------- Le sillage et la moustache d'étrave (attachés au cargo, au ras de l'eau) ----------

let texEcume = null;
function textureEcume() {
  if (texEcume) return texEcume;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 256;
  const g = c.getContext("2d");
  g.clearRect(0, 0, 128, 256);
  let a = 7;
  const h = () => ((a = (a * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 700; i++) {
    const x = h() * 128;
    const y = h() * 256;
    const r = 1 + h() * 5;
    g.fillStyle = `rgba(255,255,255,${0.08 + h() * 0.25})`;
    g.beginPath();
    g.ellipse(x, y, r * 0.6, r * 1.8, 0, 0, 6.3);
    g.fill();
  }
  texEcume = new THREE.CanvasTexture(c);
  texEcume.wrapS = texEcume.wrapT = THREE.RepeatWrapping;
  return texEcume;
}

export function creerSillage() {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTemps: { value: 0 }, uTex: { value: textureEcume() }, uForce: { value: 1 }, uCoul: { value: new THREE.Color(0x9fb0bf) } },
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTemps; uniform sampler2D uTex; uniform float uForce; uniform vec3 uCoul;
      varying vec2 vUv;
      void main() {
        // vUv.x : en travers (0..1), vUv.y : de l'étrave (1) vers l'arrière (0)
        float bord = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x);
        float t = texture2D(uTex, vec2(vUv.x * 1.5, vUv.y * 4.0 + uTemps * 0.9)).a;
        float t2 = texture2D(uTex, vec2(vUv.x * 0.8 + 0.3, vUv.y * 2.0 + uTemps * 0.5)).a;
        float a = (t * 0.9 + t2 * 0.6) * bord * pow(vUv.y, 0.8) * uForce;
        if (a < 0.01) discard;
        gl_FragColor = vec4(uCoul, a);
        ${FIN}
      }`,
  });
  return mat;
}
