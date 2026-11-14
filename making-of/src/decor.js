/* Watt Now? — making-of : le décor, époque par époque.
   Sol : 0. une pelouse vert uni, plate, sans lumière, avec la grille de l'éditeur ; 1. des collines en facettes ;
   2. un sol nuancé, les ombres ; 3 à 6. le sol et l'herbe du jeu ; 7 et 8. le sable et la mer.
   Arbres : 1. des bâtons (un cylindre et un cône) ; 2. des cubes sur un bâton ; 3 à 6. ceux du jeu.
   Les cailloux et les herbes du Survival Kit de Kenney (CC0) à partir de 2. L'hôtel des Flots à l'époque 8.
   Le ciel, la lumière et l'étalonnage ne sont pas coupés par la vague : ils changent quand elle passe sous lui.
   Pas d'occlusion ambiante : sa passe ignore les plans de coupe et dessinerait les fantômes des autres époques. */

import { THREE, GLTFLoader, creerArbres, aleatoire } from '../vendor/rendu-jeu.js';
import { creer as creerGrandHotel } from '../vendor/hotel.js';
import { ciel, herbe, VENT } from '../intro-copie/decors.js';
import { DERNIERE, T, distance } from './temps.js';

/* ---------------------------------------------------------------- Les objets de Kenney */
const KENNEY = ['rock-a', 'rock-b', 'rock-c', 'rock-flat-grass', 'grass', 'grass-large', 'patch-grass', 'patch-grass-large', 'resource-wood', 'rock-sand-a', 'rock-sand-b', 'rock-sand-c'];
const modeles = new Map();
export async function chargerDecor() {
  const l = new GLTFLoader();
  await Promise.all(KENNEY.map(async (n) => {
    const g = await l.loadAsync(`assets/kenney/${n}.glb`).catch(() => null);
    if (!g) return;
    g.scene.traverse((m) => {
      if (!m.isMesh) return;
      m.castShadow = m.receiveShadow = true;
      if (m.material.map) m.material.map.colorSpace = THREE.SRGBColorSpace;
      m.material.roughness = 0.85; m.material.metalness = 0;
    });
    modeles.set(n, g.scene);
  }));
}
function kenney(nom, taille) {
  const m = modeles.get(nom);
  const g = new THREE.Group();
  if (!m) return g;
  const c = m.clone(true);
  const b = new THREE.Box3().setFromObject(c), s = b.getSize(new THREE.Vector3());
  const e = taille / Math.max(s.x, s.y, s.z);
  c.scale.setScalar(e);
  c.position.set(-(b.min.x + b.max.x) / 2 * e, -b.min.y * e, -(b.min.z + b.max.z) / 2 * e);
  g.add(c);
  return g;
}

/* ---------------------------------------------------------------- Les sols */
/** Le relief : nul sur le chemin, des collines douces au-delà (et de face, une pente qui monte vers le fond). */
function relief(ZP, ampleur, finesse = 1) {
  return (x, z) => {
    const ecart = Math.abs(z - ZP);
    // côté caméra, presque plat : rien ne doit monter entre elle et lui
    const plat = Math.min(1, Math.max(0, (ecart - 3.5) / 12)) * (z > ZP ? 0.12 : 1);
    // au fond, la pente monte, puis une crête cache le bord du monde
    const fond = z < ZP ? Math.min(1, (ZP - z) / 60) * 3.5 + Math.min(1, Math.max(0, (ZP - 70 - z) / 35)) ** 2 * 9 : 0;
    const h = Math.sin(x * 0.11 + 1.3) * Math.cos(z * 0.09) * 1.6 + Math.sin(x * 0.23 + z * 0.17) * 0.6 * finesse + Math.sin(x * 0.05 - z * 0.03) * 1.2;
    return (h * ampleur + fond * ampleur) * plat;
  };
}
function plaque(xa, xb, za, zb, pas, hauteur, couleur) {
  const nx = Math.ceil((xb - xa) / pas), nz = Math.ceil((zb - za) / pas);
  const g = new THREE.PlaneGeometry(xb - xa, zb - za, nx, nz).rotateX(-Math.PI / 2).translate((xa + xb) / 2, 0, (za + zb) / 2);
  const p = g.getAttribute('position');
  const couleurs = couleur ? new Float32Array(p.count * 3) : null;
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, hauteur(x, z));
    if (couleurs) { couleur(x, z, c); couleurs.set([c.r, c.g, c.b], i * 3); }
  }
  if (couleurs) g.setAttribute('color', new THREE.BufferAttribute(couleurs, 3));
  g.computeVertexNormals();
  return g;
}
function bruitCouleur(base, ecart, graine) {
  const b = new THREE.Color(base);
  return (x, z, c) => {
    const n = Math.sin(x * 0.37 + graine) * Math.cos(z * 0.41 - graine) * 0.5 + Math.sin(x * 1.3 + z * 0.9) * 0.25;
    c.copy(b).offsetHSL(n * 0.015, n * 0.05, n * ecart);
  };
}

export function creerDecor(scene, eres, x0, XF, ZP) {
  const XA = x0 - 140, XB = XF + 160, ZA = ZP - 110, ZB = ZP + 80;
  const X = (d) => x0 + d;
  const tranche = (e, marge = 70) => [X(e > 0 ? distance(T(e)) : -10) - marge, X(distance(T(e + 1))) + marge];
  const r = aleatoire(11);
  const ajouter = (o, a, b = a, opt) => { scene.add(o); eres.ranger(o, a, b, opt); return o; };

  // --- 0. la pelouse de l'éditeur : un vert uni, sans lumière, et la grille
  const sol0 = new THREE.Mesh(new THREE.PlaneGeometry(XB - XA, ZB - ZA).rotateX(-Math.PI / 2).translate((XA + XB) / 2, 0, (ZA + ZB) / 2), new THREE.MeshBasicMaterial({ color: 0x79b35a }));
  ajouter(sol0, 0);
  const grille = new THREE.GridHelper(400, 400, 0x5c9444, 0x6aa24f);
  grille.position.set(x0 + 40, 0.01, ZP);
  grille.material.transparent = true; grille.material.opacity = 0.7;
  ajouter(grille, 0);

  // --- 1. des collines en facettes, un seul vert
  const sol1 = new THREE.Mesh(plaque(XA, XB, ZA, ZB, 2.2, relief(ZP, 0.8, 0.5)), new THREE.MeshLambertMaterial({ color: 0x6fa84c, flatShading: true }));
  sol1.receiveShadow = true;
  ajouter(sol1, 1);
  // ses arbres : des bâtons
  {
    const [a, b] = tranche(1);
    const n = 110, tronc = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.12, 2.2, 5).translate(0, 1.1, 0), new THREE.MeshLambertMaterial({ color: 0x8a5a36, flatShading: true }), n);
    const cone = new THREE.InstancedMesh(new THREE.ConeGeometry(0.9, 2.4, 5).translate(0, 3.0, 0), new THREE.MeshLambertMaterial({ color: 0x3f8a3a, flatShading: true }), n);
    const m = new THREE.Matrix4(), h = relief(ZP, 0.8, 0.5);
    for (let i = 0; i < n; i++) {
      const x = a + r() * (b - a), z = ZP - 7 - r() * 70, e = 0.8 + r() * 0.6;
      m.compose(new THREE.Vector3(x, h(x, z) - 0.1, z), new THREE.Quaternion(), new THREE.Vector3(e, e, e));
      tronc.setMatrixAt(i, m); cone.setMatrixAt(i, m);
    }
    const g = new THREE.Group(); g.add(tronc, cone);
    for (const im of [tronc, cone]) { im.castShadow = true; im.frustumCulled = false; }
    ajouter(g, 1);
  }

  // --- 2. un sol nuancé ; des cubes sur des bâtons ; les premiers cailloux
  const h2 = relief(ZP, 1, 1);
  const sol2 = new THREE.Mesh(plaque(XA, XB, ZA, ZB, 1.2, h2, bruitCouleur(0x6a9a46, 0.05, 1)), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
  sol2.receiveShadow = true;
  ajouter(sol2, 2);
  {
    const [a, b] = tranche(2);
    const n = 150, tronc = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.13, 0.2, 1.8, 6).translate(0, 0.9, 0), new THREE.MeshStandardMaterial({ color: 0x7a5234, flatShading: true, roughness: 0.9 }), n);
    const boule = new THREE.InstancedMesh(new THREE.BoxGeometry(1.9, 1.9, 1.9).translate(0, 2.6, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.9 }), n);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const x = a + r() * (b - a), z = ZP - 9 - r() * 72, e = 0.8 + r() * 0.7;
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6.28);
      m.compose(new THREE.Vector3(x, h2(x, z) - 0.1, z), q, new THREE.Vector3(e, e * (0.9 + r() * 0.3), e));
      tronc.setMatrixAt(i, m); boule.setMatrixAt(i, m);
      boule.setColorAt(i, c.set([0x4a8a3a, 0x3c7a34, 0x5c9a40][i % 3]));
    }
    const g = new THREE.Group(); g.add(tronc, boule);
    for (const im of [tronc, boule]) { im.castShadow = im.receiveShadow = true; im.frustumCulled = false; }
    ajouter(g, 2);
    for (let i = 0; i < 26; i++) {
      const x = a + r() * (b - a), cote = r() < 0.6 ? -1 : 1, z = cote < 0 ? ZP - 2.2 - r() * 9 : ZP + 1.5 + r() * 2.5;
      const o = kenney(['rock-a', 'rock-b', 'rock-c'][i % 3], 0.4 + r() * 0.7);
      o.position.set(x, h2(x, z) - 0.05, z); o.rotation.y = r() * 6.28;
      ajouter(o, 2);
    }
  }

  // --- 3 à 6. le monde du jeu : le sol, l'herbe qui ondule, les arbres, les cailloux et le bois
  const h3 = relief(ZP, 1.1, 1);
  const sol3 = new THREE.Mesh(plaque(XA, XB, ZA, ZB, 0.9, h3, bruitCouleur(0x5d7a3e, 0.06, 4)), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  sol3.receiveShadow = true;
  ajouter(sol3, 3, 6);
  {
    const [a] = tranche(3), [, b] = tranche(6);
    const places = [];
    for (let i = 0; i < 360; i++) {
      const x = a + r() * (b - a), z = ZP - 9.5 - r() * 82;
      places.push({ x, z, e: 1.0 + r() * 1.3 });
    }
    const arbres = creerArbres(places, aleatoire(7));
    // les arbres du jeu sont posés à y = 0 : on les assied sur le relief
    arbres.traverse((n) => {
      if (!n.isInstancedMesh) return;
      const m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
      for (let i = 0; i < n.count; i++) { n.getMatrixAt(i, m); m.decompose(p, q, s); p.y = h3(p.x, p.z) - 0.1; m.compose(p, q, s); n.setMatrixAt(i, m); }
      n.instanceMatrix.needsUpdate = true;
      n.frustumCulled = false;
    });
    ajouter(arbres, 3, 6);
    // l'herbe, en plaques de 24 m le long du chemin
    for (let x = a + 12; x < b; x += 24) {
      const im = herbe(scene, 1100, 12, [0x4f6a36, 0x5d7040, 0x44592e, 0x6a7a44], Math.round(x), [x, ZP], 0.2);
      // assise sur le relief
      const m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
      for (let i = 0; i < im.count; i++) {
        im.getMatrixAt(i, m); m.decompose(p, q, s);
        if (Math.abs(p.z - ZP) < 0.6) s.y *= 0.35;   // le chemin, foulé
        p.y = h3(p.x, p.z); m.compose(p, q, s); im.setMatrixAt(i, m);
      }
      im.instanceMatrix.needsUpdate = true;
      eres.ranger(im, 3, 6, { surPlace: true });
    }
    for (let i = 0; i < 70; i++) {
      const x = a + r() * (b - a), cote = r() < 0.6 ? -1 : 1, z = cote < 0 ? ZP - 2 - r() * 12 : ZP + 1.4 + r() * 2.6;
      const nom = ['rock-a', 'rock-b', 'rock-c', 'rock-flat-grass', 'grass-large', 'patch-grass', 'resource-wood', 'grass'][i % 8];
      const o = kenney(nom, nom.startsWith('rock') ? 0.4 + r() * 0.9 : nom === 'resource-wood' ? 1.1 : 0.6 + r() * 0.5);
      o.position.set(x, h3(x, z) - 0.03, z); o.rotation.y = r() * 6.28;
      ajouter(o, 3, 6);
    }
  }

  // --- 7 et 8. la plage, calée sur le modèle de l'hôtel (batiment/grand-hotel, un seul lot centré en H(-1 ; 5) : la
  // façade sud en H z = 2, le bord de l'eau en H z = 28,2). Le lot est décalé de DZ pour que le chemin (z = ZP) passe
  // sur la dernière bande de sable sec, juste devant le parasol couché (H z = 27,4).
  const DZ = ZP - (28 - 5);
  const ZMER = ZP + 0.2;
  // 7 : le sable et ses dunes (jusqu'à la vague de l'hôtel) ; 8 : un sable plat autour du lot de l'hôtel
  const dunes = (x, z) => {
    const fond = z < ZP - 4 ? Math.min(1, (ZP - 4 - z) / 30) : 0;
    return fond * (Math.sin(x * 0.08) * 0.8 + 1.2) - 0.05 - Math.max(0, (z - ZMER + 3) / 4) * 0.2;
  };
  const sable = new THREE.Mesh(plaque(XA, XB + 200, ZA - 120, ZMER + 1, 1.5, dunes, bruitCouleur(0xdcc69a, 0.04, 7)), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  sable.receiveShadow = true;
  ajouter(sable, 7);
  const sablePlat = new THREE.Mesh(plaque(XA, XB + 200, ZA - 120, ZMER + 1, 3, (x, z) => -0.05 - Math.max(0, (z - ZMER + 3) / 4) * 0.2, bruitCouleur(0xdcc69a, 0.03, 9)), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  sablePlat.receiveShadow = true;
  ajouter(sablePlat, 8);
  // la mer du modèle de l'hôtel (batiment/commun/atelier.js, matiereEau)
  const mer = new THREE.Mesh(new THREE.PlaneGeometry(1400, 700).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x3f7680, roughness: 0.15, metalness: 0.25 }));
  mer.position.set(XF, -0.12, ZMER + 350);
  ajouter(mer, 7, 8);
  // l'écume : deux bandes aux bords fondus, qui vont et viennent
  const fondu = document.createElement('canvas'); fondu.width = 4; fondu.height = 64;
  const cf = fondu.getContext('2d'), gr = cf.createLinearGradient(0, 0, 0, 64);
  gr.addColorStop(0, '#000'); gr.addColorStop(0.35, '#fff'); gr.addColorStop(0.5, '#fff'); gr.addColorStop(1, '#000');
  cf.fillStyle = gr; cf.fillRect(0, 0, 4, 64);
  const alpha = new THREE.CanvasTexture(fondu);
  const ecumes = [[ZMER + 0.3, 0.55, 1.1], [ZMER + 1.8, 0.22, 1.6]].map(([z, o, l]) => {
    const e = new THREE.Mesh(new THREE.PlaneGeometry(1400, l).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xfffaf0, transparent: true, opacity: o, alphaMap: alpha, depthWrite: false }));
    e.position.set(XF, 0.06, z);
    e.userData.z = z; e.userData.o = o;
    e.renderOrder = 1;
    return ajouter(e, 7);
  });
  {
    const [a] = tranche(7);
    for (let i = 0; i < 24; i++) {
      const x = a + r() * (XB + 60 - a), z = ZP - 6 - r() * 30;
      const o = kenney(['rock-sand-a', 'rock-sand-b', 'rock-sand-c'][i % 3], 0.5 + r() * 1.2);
      o.position.set(x, dunes(x, z), z); o.rotation.y = r() * 6.28;
      ajouter(o, 7);
    }
  }
  const hotel = creerGrandHotel({ usure: 0.7 });
  hotel.position.z = DZ;
  // l'étage, posé au sol derrière l'hôtel pour le jeu, n'a rien à faire dans le film
  const etage = hotel.getObjectByName('etage');
  if (etage) etage.visible = false;
  hotel.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  ajouter(hotel, 8);

  // --- les vagues : un rideau de lumière électrique qui balaie le monde
  const vagues = [];
  for (let j = 1; j <= DERNIERE; j++) {
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
      uniforms: { temps: VENT, force: { value: 1 }, couleur: { value: new THREE.Color(0x7fd4ff) } },
      vertexShader: `varying vec2 vUv; varying vec3 vP; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform float temps, force; uniform vec3 couleur; varying vec2 vUv; varying vec3 vP;
        float h(float x){ return fract(sin(x * 91.17) * 43758.5); }
        void main(){
          float y = vP.y;
          float rideau = exp(-max(y, 0.0) * 1.8) * 0.12;
          float ligne = exp(-max(y, 0.0) * 10.0) * 1.8;
          // des étincelles qui grésillent le long du rideau
          float g = step(0.985, h(floor(vP.z * 3.0) + floor(temps * 30.0) * 7.0)) * exp(-max(y, 0.0) * 1.5) * 1.5;
          float bords = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
          gl_FragColor = vec4(couleur * (rideau + ligne + g) * force * bords, 1.0);
        }`,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(70, 7).rotateY(Math.PI / 2).translate(0, 3.2, ZP - 32), mat);
    m.frustumCulled = false;
    m.renderOrder = 5;
    scene.add(m);
    vagues.push({ j, m, mat });
  }

  // --- le ciel, la lumière, la brume
  const leCiel = ciel(scene, 0xb8d4e8, 0xb8d4e8, 0xb8d4e8, { soleil: [-0.6, 0.35, 0.5], tailleSoleil: 0, nuages: 0 });
  leCiel.material.uniforms.couleurSoleil.value.set(0xffe2a0);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  const soleil = new THREE.DirectionalLight(0xffffff, 1);
  soleil.shadow.mapSize.set(4096, 4096);
  soleil.shadow.bias = -0.0004; soleil.shadow.normalBias = 0.03;
  scene.add(hemi, soleil, soleil.target);
  scene.fog = new THREE.FogExp2(0xffffff, 0);

  return {
    hotel,
    /** La lumière et le ciel d'une époque (e réel : on fond entre deux époques). */
    eclairer(e, sx, ombreLarge = 0) {
      const a = AMBIANCES[Math.floor(e)], b = AMBIANCES[Math.min(AMBIANCES.length - 1, Math.floor(e) + 1)], k = e - Math.floor(e);
      const m = (x, y) => x + (y - x) * k;
      const c = (x, y) => new THREE.Color(x).lerp(new THREE.Color(y), k);
      const u = leCiel.material.uniforms;
      u.haut.value.copy(c(a.ciel[0], b.ciel[0])); u.horizon.value.copy(c(a.ciel[1], b.ciel[1])); u.bas.value.copy(c(a.ciel[2], b.ciel[2]));
      u.nuages.value = m(a.nuages, b.nuages); u.couleurNuages.value.copy(c(a.couleurNuages, b.couleurNuages));
      u.tailleSoleil.value = m(a.tailleSoleil, b.tailleSoleil);
      u.soleil.value.set(...a.dir.map((v, i) => m(v, b.dir[i]))).normalize();
      u.couleurSoleil.value.copy(c(a.couleur, b.couleur));
      hemi.color.copy(c(a.hemi[0], b.hemi[0])); hemi.groundColor.copy(c(a.hemi[1], b.hemi[1])); hemi.intensity = m(a.hemi[2], b.hemi[2]);
      soleil.color.copy(c(a.couleur, b.couleur)); soleil.intensity = m(a.force, b.force);
      soleil.castShadow = (k < 0.5 ? a : b).ombres;
      const dir = u.soleil.value;
      const cible = new THREE.Vector3(sx + 2, 0, ZP - 2 * ombreLarge);
      soleil.position.copy(cible).addScaledVector(dir, 80);
      soleil.target.position.copy(cible);
      const d = 22 + ombreLarge * 60;
      Object.assign(soleil.shadow.camera, { left: -d, right: d, top: d, bottom: -d, near: 1, far: 200 });
      soleil.shadow.camera.updateProjectionMatrix();
      scene.fog.color.copy(c(a.brume[0], b.brume[0])); scene.fog.density = m(a.brume[1], b.brume[1]);
      const g = {};
      for (const cle of Object.keys(a.grade)) g[cle] = Array.isArray(a.grade[cle]) ? a.grade[cle].map((v, i) => m(v, b.grade[cle][i])) : m(a.grade[cle], b.grade[cle]);
      return g;
    },
    /** Les vagues : visibles près de la caméra, éclatantes au moment où elles passent sous lui. */
    animer(t, dt, sx) {
      hotel.traverse((o) => o.userData.animer?.(t, dt));
      for (const v of vagues) {
        const x = eres.vague(v.j, t);
        v.m.position.x = x;
        const pres = Math.abs(x - sx);
        v.m.visible = pres < 90;
        v.mat.uniforms.force.value = 0.55 + 1.2 * Math.exp(-pres * pres / 6);
      }
      for (const e of ecumes) {
        const ph = t * 0.9 + e.userData.z;
        e.position.z = e.userData.z + Math.sin(ph) * 0.35;
        e.material.opacity = e.userData.o * (0.8 + Math.sin(ph + 0.6) * 0.2);
      }
    },
  };
}

/* Les ambiances, époque par époque. ciel : [haut, horizon, bas] ; hemi : [ciel, sol, force] ; brume : [couleur, densité]. */
const JOUR = { ciel: [0x4f8fd0, 0xe2ecf0, 0x9ab0c0], nuages: 0.45, couleurNuages: 0xffffff, tailleSoleil: 0.006, dir: [-0.5, 0.55, 0.6], couleur: 0xfff0dc, force: 2.8, hemi: [0xcfe0f0, 0x4d5a3a, 0.9], ombres: true, brume: [0xd8e4ec, 0.006],
  grade: { bloom: 0.4, bloomSeuil: 0.85, vignette: 0.32, grain: 0.03, exposition: 1.0, ao: 0, saturation: 1.05, teinte: [1, 1, 1] } };
const AMBIANCES = [
  // 0. le prototype : un ciel uni, une lumière plate, rien d'autre
  { ciel: [0xb8d4e8, 0xb8d4e8, 0xb8d4e8], nuages: 0, couleurNuages: 0xffffff, tailleSoleil: 0, dir: [-0.5, 0.7, 0.5], couleur: 0xffffff, force: 1.2, hemi: [0xffffff, 0x9a9a9a, 1.6], ombres: false, brume: [0xb8d4e8, 0],
    grade: { bloom: 0, bloomSeuil: 0.95, vignette: 0, grain: 0, exposition: 1.0, ao: 0, saturation: 1, teinte: [1, 1, 1] } },
  // 1. un dégradé, une vraie lumière, toujours pas d'ombres
  { ciel: [0x86b4e0, 0xd4e6f2, 0xa0b4c4], nuages: 0, couleurNuages: 0xffffff, tailleSoleil: 0, dir: [-0.5, 0.6, 0.55], couleur: 0xfff6e8, force: 2.0, hemi: [0xdfe8f0, 0x6a7a5a, 1.1], ombres: false, brume: [0xd4e6f2, 0.002],
    grade: { bloom: 0.1, bloomSeuil: 0.9, vignette: 0.1, grain: 0, exposition: 1.0, ao: 0, saturation: 1, teinte: [1, 1, 1] } },
  // 2. les ombres, le soleil, quelques nuages
  { ...JOUR, nuages: 0.2, force: 2.5, grade: { ...JOUR.grade, bloom: 0.2, ao: 0, grain: 0.015, vignette: 0.2 } },
  // 3. et 4. le jeu, en plein jour (l'occlusion ambiante, le halo)
  JOUR,
  JOUR,
  // 5. l'après-midi qui dore
  { ...JOUR, ciel: [0x5a86c4, 0xf0dcc0, 0x9a9a90], couleurNuages: 0xfff0e0, dir: [-0.6, 0.4, 0.55], couleur: 0xffe0b8, hemi: [0xf0e0d0, 0x5a5a3a, 0.95], brume: [0xe8dcc8, 0.007],
    grade: { ...JOUR.grade, teinte: [1.03, 1, 0.97] } },
  // 6. le crépuscule : les Éteints, les yeux qui luisent
  { ciel: [0x1a2140, 0xd98a5a, 0x2a2a30], nuages: 0.4, couleurNuages: 0xc07a6a, tailleSoleil: 0.008, dir: [-0.8, 0.12, 0.5], couleur: 0xffa070, force: 2.2, hemi: [0x9aa4d0, 0x3a3020, 1.25], ombres: true, brume: [0x6a6070, 0.014],
    grade: { bloom: 0.55, bloomSeuil: 0.8, vignette: 0.45, grain: 0.04, exposition: 1.45, ao: 0, saturation: 1, teinte: [1.04, 0.98, 0.98] } },
  // 7. et 8. l'heure dorée, sur la plage des Flots
  { ciel: [0x3a5a8a, 0xf6c08a, 0x5a6a7a], nuages: 0.55, couleurNuages: 0xf4c8a8, tailleSoleil: 0.01, dir: [-0.85, 0.2, 0.5], couleur: 0xffc890, force: 3.2, hemi: [0xffe2c0, 0x6a6050, 1.0], ombres: true, brume: [0xe8c8a8, 0.006],
    grade: { bloom: 0.5, bloomSeuil: 0.85, vignette: 0.42, grain: 0.035, exposition: 1.05, ao: 0, saturation: 1.05, teinte: [1.05, 1.0, 0.95] } },
];
AMBIANCES.push(AMBIANCES[7]);
