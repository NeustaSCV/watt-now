// La scène de l'échouage du cargo au phare (0.10, K4) : la variante 1 « Large » de la maquette validée par le porteur sur
// son iPhone (.claude-travail/maquettes/cargo/, scene.js), reprise telle quelle et rendue à part, dans sa propre scène et
// avec sa propre caméra, pendant les ≈ 6,6 s de la scène : plongée haute depuis le large, la tour entière à gauche avec sa
// lanterne et ses faisceaux, la crique au centre, le cargo qui monte depuis le bas à droite et s'écrase au centre.
//
// Ce qui change par rapport à la maquette : pas de vue de jeu simulée (le jeu se montre lui-même avant et après le plan,
// client/src/phare.ts), pas de commandes ; le minutage `T` vient de client/src/phare-scene.ts (SCENE_CARGO) ; la secousse
// de l'image se coupe si le système demande de réduire les mouvements ; l'exposition de la maquette (1,3) n'est posée
// que le temps du rendu du plan. Le modèle du phare est une seconde copie, à part de celle du jeu : ses matières en
// cache (atelier.js) sont partagées, et le jeu les retouche (le greffon de la vue par pièce, rendu/carte-vue.ts, qui
// noircissait la crique hors de la vue du personnage) : la copie de la scène prend ses propres matières, sans greffon.
//
// Tout se calcule à partir du temps de la scène (s) : `rendre(rendu, t)` dessine le plan à l'instant t.

import * as THREE from "three";
import * as PHARE from "../../batiments/phare/modele.js";
import { creerCargo, EPAVE } from "./cargo.js";
import { creerMer, creerCiel, materiauFaisceau, geoCone, halo, creerGerbe, creerAnneau, creerSillage, NB_FEUX } from "./effets.js";
import { prolongerTerrain } from "./terrain.js";

const V_CARGO = 8.0; // m/s à l'approche
const U_CHOC = -2.5; // l'avancée de la coque au moment du choc (repère de l'épave)
const EXPOSITION = 1.3; // celle de la maquette (le jeu est à 1,05)

const COUL = {
  brume: 0x182030,
  horizon: 0x27324a,
  zenith: 0x070b14,
  nuage: 0x323b52,
  fond: 0x07121b,
};

/** Une matière d'eau du modèle (matiereEau de l'atelier : transparente, lisse, un peu métallique), quelle que soit sa teinte. */
const estEau = (m) => !!m && m.transparent && m.roughness === 0.15 && m.metalness === 0.25;

/** La variante 1 de la maquette : « Plongée sur la crique depuis le large, la tour à gauche ». */
const PLAN = { phase: 2.3, pos: [-20, 45, 85], cible: [-6, -4, 16], fovP: 55, fovL: 34 };

/**
 * Les matières du modèle et du cap sont celles du cache de l'atelier, partagées avec le phare du jeu, qui les retouche
 * (le greffon de la vue par pièce) : chaque maillage prend une copie à elle (une copie par matière), sans aucun greffon.
 */
function matieresPropres(objets) {
  const copies = new Map();
  const copie = (m) => {
    let c = copies.get(m);
    if (!c) {
      c = m.clone();
      c.onBeforeCompile = THREE.Material.prototype.onBeforeCompile;
      c.customProgramCacheKey = THREE.Material.prototype.customProgramCacheKey;
      copies.set(m, c);
    }
    return c;
  };
  for (const o of objets) {
    o.traverse((q) => {
      if (q.material) q.material = Array.isArray(q.material) ? q.material.map(copie) : copie(q.material);
    });
  }
}

/**
 * Construit la scène. `T` : le minutage (secondes de la scène : choc, cassure, repos…) ; `options.secousse()` : la
 * secousse de l'image est-elle permise (non si le système demande de réduire les mouvements) ?
 */
export function creerSceneCargo(T, options = {}) {
  const secousseActive = options.secousse ?? (() => true);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(COUL.brume, 90, 560);

  const hemi = new THREE.HemisphereLight(0x5a6e9c, 0x12151c, 0.5);
  const lune = new THREE.DirectionalLight(0xa4b8de, 0.55);
  lune.position.set(-50, 42, 75);
  scene.add(hemi, lune);

  // ---------- Le phare (le vrai modèle) ----------

  const phare = PHARE.creer({ usure: 0.7 });
  const objets = phare.userData.objets;
  objets.lanterne_eteinte.visible = false;
  objets.lanterne_allumee.visible = true;
  objets.prisme_manquant.visible = true;
  objets.epave_apres.visible = false;
  // La mer du modèle laisse la place à la grande mer de la maquette ; ses alentours (0.10, R52 : la falaise et la lande
  // prolongées) au cap de la maquette (prolongerTerrain), fait pour ce plan : le plan reste celui que le porteur a validé.
  phare.traverse((o) => {
    if (o.isMesh && estEau(o.material)) o.visible = false;
  });
  if (objets.alentours) objets.alentours.visible = false;
  const terrain = prolongerTerrain();
  matieresPropres([phare, terrain]);
  const ecume = phare.getObjectByName("écume");
  // l'écume du modèle, éclairée de nuit, ressortait en carreaux blancs : on la grise
  ecume?.traverse((o) => { if (o.isMesh) o.material.color.setHex(0x6d7a88); });
  scene.add(phare);
  scene.add(terrain);

  const TX = -10;
  const TZ = -6;
  const Y_LANTERNE = 27.9;
  const LANTERNE = new THREE.Vector3(TX, Y_LANTERNE, TZ);

  // La lanterne allumée tourne sur l'axe de la tour (ses pinceaux suivent les grands faisceaux)
  const pivotLanterne = new THREE.Group();
  pivotLanterne.position.set(TX, 0, TZ);
  phare.add(pivotLanterne);
  objets.lanterne_allumee.position.set(-TX, 0, -TZ);
  pivotLanterne.add(objets.lanterne_allumee);
  const THETA_MODELE = Math.PI / 2 - 0.6; // l'angle des pinceaux du modèle

  // La lumière de la lanterne, et la lumière qui balaie avec le faisceau
  const lumLanterne = new THREE.PointLight(0xffb45a, 40, 60, 1.4);
  lumLanterne.position.copy(LANTERNE);
  const balayage = new THREE.SpotLight(0xffd8a0, 160, 160, 0.3, 0.95, 1.2);
  balayage.position.copy(LANTERNE);
  scene.add(lumLanterne, balayage, balayage.target);

  // Les deux grands faisceaux du phare
  const faisceaux = new THREE.Group();
  faisceaux.position.copy(LANTERNE);
  {
    const g1 = geoCone(170, 11, 24);
    const g2 = geoCone(170, 11, 24).rotateY(Math.PI);
    const m = materiauFaisceau(0xffd9a6, 0.42, 170);
    faisceaux.add(new THREE.Mesh(g1, m), new THREE.Mesh(g2, m));
    for (const o of faisceaux.children) o.renderOrder = 6;
  }
  scene.add(faisceaux);
  const haloLanterne = halo(0xffd29a, 9);
  haloLanterne.position.copy(LANTERNE);
  scene.add(haloLanterne);
  const eclatLanterne = halo(0xfff0d8, 30);
  eclatLanterne.position.copy(LANTERNE);
  scene.add(eclatLanterne);

  // ---------- La mer, le ciel ----------

  const mer = creerMer(-9.0, COUL);
  scene.add(mer);
  const ciel = creerCiel(COUL);
  scene.add(ciel);

  // ---------- Le cargo ----------

  const cargo = creerCargo();
  scene.add(cargo.racine);
  const { avant, arriere, feux, projecteur } = cargo;
  for (const c of cargo.chutes) scene.add(c.objet);
  // le sillage et la moustache d'étrave, au ras de l'eau, attachés à la racine (ils avancent avec le cargo)
  const matSillage = creerSillage();
  const sillage = new THREE.Group();
  {
    // la moustache : deux bandes en V depuis l'étrave
    for (const cote of [-1, 1]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 14).rotateX(-Math.PI / 2), matSillage);
      m.position.set(cote * 4.2, 0, 2.5);
      m.rotation.y = cote * 0.32;
      m.renderOrder = 3;
      sillage.add(m);
    }
    // le sillage derrière la poupe
    const s = new THREE.Mesh(new THREE.PlaneGeometry(7, 40).rotateX(-Math.PI / 2).rotateY(Math.PI), matSillage);
    s.position.set(0, 0, -40);
    s.renderOrder = 3;
    sillage.add(s);
  }
  cargo.racine.add(sillage);

  // L'éclair du choc (étincelles, tôle arrachée)
  const eclair = new THREE.PointLight(0xffa860, 0, 45, 1.4);
  scene.add(eclair);

  // ---------- La pose du cargo selon le temps ----------

  const bosse = (x, d) => (x > 0 && x < d ? Math.sin((Math.PI * x) / d) : 0);
  function poseCargo(t) {
    const bobY = 0.12 * Math.sin(1.3 * t);
    const bobP = 0.012 * Math.sin(1.1 * t + 1);
    const bobR = 0.018 * Math.sin(0.9 * t);
    if (t < T.choc) {
      const u = U_CHOC - V_CARGO * (T.choc - t);
      const p = { u, dy: -0.85 + bobY, tangage: bobP, roulis: bobR };
      return { avant: p, arriere: p };
    }
    const tau = t - T.choc;
    const uB = U_CHOC - U_CHOC * (1 - Math.exp(-3.2 * tau));
    const b = bosse(tau, 0.9);
    const posee = 1 - Math.exp(-4 * tau);
    const amortiY = (0.12 * Math.sin(1.3 * T.choc)) * Math.exp(-3 * tau);
    const av = { u: uB, dy: -0.85 * (1 - posee) + 0.55 * b + amortiY, tangage: 0.075 * b + 0.01 * Math.sin(tau * 9) * Math.exp(-4 * tau), roulis: -0.05 * b + 0.018 * Math.sin(0.9 * T.choc) * Math.exp(-3 * tau) };
    const tc = T.cassure - T.choc;
    if (tau < tc) {
      return { avant: av, arriere: { u: uB, dy: -0.85 + 0.25 * b + amortiY, tangage: -0.02 * b, roulis: av.roulis } };
    }
    const tp = tau - tc;
    const bc = bosse(tc, 0.9);
    const u0 = U_CHOC - U_CHOC * (1 - Math.exp(-3.2 * tc));
    const ecart = 1.7 * (1 - Math.exp(-2.2 * tp));
    const dy0 = -0.85 + 0.25 * bc + (0.12 * Math.sin(1.3 * T.choc)) * Math.exp(-3 * tc);
    return {
      avant: av,
      arriere: {
        u: u0 + (uB - u0) * 0.3 - ecart,
        dy: dy0 - 1.9 * (1 - Math.exp(-0.8 * tp)) - 0.25 * bosse(tp, 0.5),
        tangage: -0.02 * bc - 0.085 * (1 - Math.exp(-1.8 * tp)),
        roulis: -0.05 * bc - 0.15 * (1 - Math.exp(-1.1 * tp)) + 0.02 * Math.sin(tp * 2.2) * Math.exp(-0.8 * tp),
      },
    };
  }
  function appliquerPose(t) {
    const p = poseCargo(t);
    for (const [g, q] of [[avant, p.avant], [arriere, p.arriere]]) {
      const b = g.userData.base;
      g.position.set(b.x, b.y + q.dy, b.z + q.u);
      g.rotation.set(-q.tangage, 0, q.roulis);
    }
    // le sillage reste à la surface
    sillage.position.set(0, -8.98, p.arriere.u);
    cargo.racine.updateMatrixWorld(true);
  }

  // ---------- Les points du choc (calculés une fois, sur la pose du choc) ----------

  const tmp = new THREE.Vector3();
  function versMonde(groupe, x, y, z) {
    return groupe.userData.dedans.localToWorld(new THREE.Vector3(x, y, z));
  }
  appliquerPose(T.choc + 0.02);
  const pointsEtrave = [];
  for (let s = 4.6; s <= 8.6; s += 0.5) for (const c of [-1, 1]) pointsEtrave.push(versMonde(avant, c * Math.max(0.1, 3.2 * (1 - Math.min(1, (s - 2.6) / 6) ** 1.7)), -9.0, s));
  const pointeEtrave = versMonde(avant, 0, -8.6, 8.6);
  appliquerPose(T.cassure + 0.02);
  const pointsCassure = [];
  for (let x = -3.2; x <= 3.2; x += 0.8) pointsCassure.push(versMonde(arriere, x, -9.0, 0));

  // ---------- Les gerbes ----------

  const alea = (() => {
    let a = 12345;
    return () => ((a = (a * 16807) % 2147483647) / 2147483647);
  })();
  const entre = (a, b) => a + (b - a) * alea();
  const dirAvant = new THREE.Vector3(Math.sin(EPAVE.ry), 0, Math.cos(EPAVE.ry)); // vers la proue
  const dirBabord = new THREE.Vector3(Math.cos(EPAVE.ry), 0, -Math.sin(EPAVE.ry)); // +x local

  const ploufs = []; // [instant, point] des conteneurs qui tombent à l'eau (rempli plus bas)
  function gerbeEcume() {
    const liste = [];
    // l'étrave qui défonce la mer et les rochers
    for (let i = 0; i < 900; i++) {
      const p = pointsEtrave[Math.floor(alea() * pointsEtrave.length)].clone();
      const lat = (alea() < 0.5 ? -1 : 1) * entre(1.5, 7);
      const v = dirBabord.clone().multiplyScalar(lat).addScaledVector(dirAvant, entre(-1, 5));
      v.y = entre(7, 19) * (alea() < 0.25 ? 1.25 : 1);
      liste.push({ p: [p.x + entre(-0.5, 0.5), p.y + entre(0, 1.5), p.z + entre(-0.5, 0.5)], v: [v.x, v.y, v.z], t0: T.choc + entre(0, 0.35) ** 1.5, vie: entre(1.4, 2.6), taille: entre(1.4, 3.6) });
    }
    // la cassure : la mer qui s'engouffre
    for (let i = 0; i < 280; i++) {
      const p = pointsCassure[Math.floor(alea() * pointsCassure.length)];
      const v = dirAvant.clone().multiplyScalar(entre(-2, 2)).addScaledVector(dirBabord, entre(-3, 3));
      v.y = entre(3, 9);
      liste.push({ p: [p.x, p.y + entre(0, 1), p.z], v: [v.x, v.y, v.z], t0: T.cassure + entre(0, 0.4), vie: entre(1.0, 2.0), taille: entre(0.8, 2.0) });
    }
    // les conteneurs qui tombent à l'eau
    for (const [t, q] of ploufs) {
      for (let i = 0; i < 130; i++) {
        const a = alea() * 6.28;
        const r = entre(1, 4);
        liste.push({ p: [q.x + Math.cos(a) * 1.5, -9, q.z + Math.sin(a) * 1.5], v: [Math.cos(a) * r, entre(3, 8), Math.sin(a) * r], t0: t + entre(0, 0.15), vie: entre(0.9, 1.6), taille: entre(0.6, 1.6) });
      }
    }
    return liste;
  }
  function gerbeEtincelles() {
    const liste = [];
    for (let i = 0; i < 180; i++) {
      const p = pointsEtrave[Math.floor(alea() * pointsEtrave.length)];
      const v = dirBabord.clone().multiplyScalar(entre(-6, 6)).addScaledVector(dirAvant, entre(-2, 6));
      v.y = entre(2, 9);
      liste.push({ p: [p.x, p.y + entre(0.4, 2.2), p.z], v: [v.x, v.y, v.z], t0: T.choc + entre(0, 0.55) ** 1.4, vie: entre(0.35, 1.0), taille: entre(0.18, 0.4) });
    }
    // la cassure : la tôle qui se déchire
    for (let i = 0; i < 70; i++) {
      const p = pointsCassure[Math.floor(alea() * pointsCassure.length)];
      const v = dirBabord.clone().multiplyScalar(entre(-4, 4));
      v.y = entre(1, 6);
      liste.push({ p: [p.x, p.y + entre(2, 5), p.z], v: [v.x, v.y, v.z], t0: T.cassure + entre(0, 0.3), vie: entre(0.3, 0.8), taille: entre(0.15, 0.32) });
    }
    return liste;
  }

  // ---------- Les conteneurs qui basculent ----------

  const sol = (x, z) => {
    const h = PHARE.hauteurSol(x, z);
    return h > -9.05 ? h : null; // null : c'est la mer
  };
  const CHUTES = [
    // 0 : le haut de la pile, côté grève : il bascule sur les galets
    { lacher: T.cassure, duree: 0.72, cible: new THREE.Vector3(-8.7, 0, 20.4), rot: new THREE.Euler(1.42, 0.85, 0.12), eau: false },
    // 1 : côté large : il tombe à la mer et flotte, à moitié coulé
    { lacher: T.cassure + 0.06, duree: 0.8, cible: new THREE.Vector3(2.4, -8.9, 27.5), rot: new THREE.Euler(0.35, -0.5, -1.25), eau: true },
    // 2 : tout en haut, côté grève : projeté au choc, il finit couché dans l'eau au pied de la cassure (comme sur l'épave)
    { lacher: T.choc + 0.05, duree: 0.85, cible: new THREE.Vector3(-9.8, -8.75, 24.1), rot: new THREE.Euler(Math.PI / 2 - 0.25, 0.55, 0.12), fin: -10.35, eau: true },
  ];
  const chutes = cargo.chutes.map((c, i) => {
    const d = CHUTES[i];
    // pose de départ : sur le pont, au moment du lâcher
    appliquerPose(d.lacher);
    const m = new THREE.Matrix4().compose(new THREE.Vector3(c.pose.x, c.pose.y, c.pose.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, c.pose.ry, 0)), new THREE.Vector3(1, 1, 1));
    const groupe = arriere;
    const mw = groupe.userData.dedans.matrixWorld.clone().multiply(m);
    const p0 = new THREE.Vector3();
    const q0 = new THREE.Quaternion();
    mw.decompose(p0, q0, new THREE.Vector3());
    const cible = d.cible.clone();
    if (!d.eau) cible.y = (sol(cible.x, cible.z) ?? -8.8) + 1.22;
    const qT = new THREE.Quaternion().setFromEuler(d.rot);
    // vitesse initiale verticale pour tomber juste à la cible
    const g = 9.8;
    const vy = (cible.y - p0.y + 0.5 * g * d.duree * d.duree) / d.duree;
    if (d.eau) ploufs.push([d.lacher + d.duree, cible]);
    return { ...c, ...d, p0, q0, cible, qT, vy, local: m };
  });
  const tChuteFin = chutes.map((c) => c.lacher + c.duree);

  function poserChutes(t) {
    for (const c of chutes) {
      const o = c.objet;
      if (t < c.lacher) {
        o.matrixAutoUpdate = false;
        o.matrix.copy(arriere.userData.dedans.matrixWorld).multiply(c.local);
        o.matrixWorldNeedsUpdate = true;
        continue;
      }
      o.matrixAutoUpdate = true;
      const tau = Math.min(t - c.lacher, c.duree);
      const k = tau / c.duree;
      o.position.set(c.p0.x + (c.cible.x - c.p0.x) * k, c.p0.y + c.vy * tau - 4.9 * tau * tau, c.p0.z + (c.cible.z - c.p0.z) * k);
      const e = k * k * (3 - 2 * k);
      o.quaternion.slerpQuaternions(c.q0, c.qT, e);
      const apres = t - c.lacher - c.duree;
      if (apres > 0) {
        if (c.eau) {
          // il s'enfonce, puis flotte en dansant
          const fond = c.fin ?? c.cible.y - 0.5;
          o.position.y = c.cible.y + (fond - c.cible.y) * (1 - Math.exp(-1.6 * apres)) + 0.12 * Math.sin(apres * 2.4) * Math.exp(-0.6 * apres);
          o.rotateX(0.05 * Math.sin(apres * 2.0) * Math.exp(-0.5 * apres));
        } else {
          // il rebondit à peine et se couche
          o.position.y += 0.35 * bosse(apres, 0.28);
          o.rotateZ(0.08 * bosse(apres, 0.35));
        }
      }
    }
  }

  // ---------- Les débris (une seule instance de boîtes) ----------

  const NB_DEBRIS = 54;
  const debris = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0.2, flatShading: true, emissive: 0x0b1220 }), NB_DEBRIS);
  debris.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const DEBRIS = [];
  {
    const coulCarton = new THREE.Color(0xb8996a);
    for (let i = 0; i < NB_DEBRIS; i++) {
      const type = i % 3; // 0 carton, 1 tôle, 2 rocher
      const depart = i < 36 ? pointsEtrave[Math.floor(alea() * pointsEtrave.length)].clone().add(new THREE.Vector3(0, entre(0.5, 4.5), 0)) : pointsCassure[Math.floor(alea() * pointsCassure.length)].clone().add(new THREE.Vector3(0, entre(2, 5), 0));
      const t0 = i < 36 ? T.choc + entre(0, 0.25) : T.cassure + entre(0, 0.2);
      const v = dirBabord.clone().multiplyScalar(entre(-4, 9)).addScaledVector(dirAvant, entre(-2, 4));
      v.y = entre(3, 10);
      const taille = type === 0 ? new THREE.Vector3(entre(0.4, 0.7), entre(0.3, 0.5), entre(0.35, 0.6)) : type === 1 ? new THREE.Vector3(entre(0.6, 1.4), 0.05, entre(0.4, 0.9)) : new THREE.Vector3().setScalar(entre(0.25, 0.6));
      const spin = new THREE.Vector3(entre(-8, 8), entre(-8, 8), entre(-8, 8));
      // l'atterrissage, calculé à l'avance (pas de 1/60 s)
      let tSol = 3;
      let pSol = null;
      let eau = false;
      for (let a = 0.02; a < 3; a += 1 / 60) {
        const x = depart.x + v.x * a;
        const z = depart.z + v.z * a;
        const y = depart.y + v.y * a - 4.9 * a * a;
        const h = sol(x, z);
        if (h !== null && y <= h + taille.y / 2 && v.y - 9.8 * a < 0) {
          tSol = a;
          pSol = new THREE.Vector3(x, h + taille.y / 2, z);
          break;
        }
        if (h === null && y <= -9.0) {
          tSol = a;
          pSol = new THREE.Vector3(x, -9.0, z);
          eau = true;
          break;
        }
      }
      DEBRIS.push({ depart, t0, v, taille, spin, tSol, pSol, eau });
      const coul = type === 0 ? coulCarton.clone().offsetHSL(0, 0, entre(-0.06, 0.04)) : type === 1 ? new THREE.Color(alea() < 0.5 ? 0x2c4560 : 0x7a3328) : new THREE.Color(0x7b776f);
      debris.setColorAt(i, coul);
    }
  }
  debris.frustumCulled = false;
  scene.add(debris);
  const mDeb = new THREE.Matrix4();
  const qDeb = new THREE.Quaternion();
  const eDeb = new THREE.Euler();
  const cache = new THREE.Vector3(0, -50, 0);
  function poserDebris(t) {
    for (let i = 0; i < NB_DEBRIS; i++) {
      const d = DEBRIS[i];
      const a = t - d.t0;
      if (a < 0) {
        mDeb.compose(cache, qDeb.identity(), d.taille);
      } else {
        const aa = Math.min(a, d.tSol);
        const p = a < d.tSol ? new THREE.Vector3(d.depart.x + d.v.x * a, d.depart.y + d.v.y * a - 4.9 * a * a, d.depart.z + d.v.z * a) : d.pSol.clone();
        if (d.eau && a > d.tSol) p.y -= Math.min(1.5, (a - d.tSol) * 0.8); // il coule
        eDeb.set(d.spin.x * aa, d.spin.y * aa, d.spin.z * aa);
        mDeb.compose(p, qDeb.setFromEuler(eDeb), d.taille);
      }
      debris.setMatrixAt(i, mDeb);
    }
    debris.instanceMatrix.needsUpdate = true;
  }

  const gEcume = creerGerbe(gerbeEcume().length, ((l) => (i) => l[i])(gerbeEcume()), "ecume");
  const gEtincelles = creerGerbe(gerbeEtincelles().length, ((l) => (i) => l[i])(gerbeEtincelles()), "etincelles");
  scene.add(gEcume, gEtincelles);
  const anneau = creerAnneau();
  anneau.position.set(pointeEtrave.x - dirAvant.x * 2, -8.97, pointeEtrave.z - dirAvant.z * 2);
  anneau.scale.setScalar(30);
  scene.add(anneau);

  const feuDetresse = new THREE.PointLight(0xff3a2a, 0, 14, 1.5);
  scene.add(feuDetresse);

  // ---------- La caméra (variante 1) ----------

  const camP = new THREE.PerspectiveCamera(50, 1, 0.3, 1500);

  function bruitSecousse(t, k) {
    return Math.sin(t * 61.7 + k) * 0.6 + Math.sin(t * 37.3 + k * 2.1) * 0.4 + Math.sin(t * 97.1 + k * 3.7) * 0.25;
  }
  function secousse(t) {
    if (!secousseActive()) return 0;
    let a = 0;
    if (t > T.choc) a += 0.55 * Math.exp(-(t - T.choc) * 5.5);
    if (t > T.cassure) a += 0.22 * Math.exp(-(t - T.cassure) * 7);
    return a;
  }

  function placerCamera(t, w, h) {
    const asp = w / h;
    const c = PLAN;
    const k = Math.min(1, Math.max(0, (asp - 0.6) / (2.5 - 0.6)));
    camP.fov = c.fovP + (c.fovL - c.fovP) * k;
    camP.aspect = asp;
    camP.near = 0.3;
    camP.updateProjectionMatrix();
    const a = secousse(t);
    const fort = 0.8;
    camP.position.set(c.pos[0] + a * fort * bruitSecousse(t, 1), c.pos[1] + a * fort * bruitSecousse(t, 2), c.pos[2] + a * fort * bruitSecousse(t, 3));
    camP.lookAt(c.cible[0] + a * fort * 0.6 * bruitSecousse(t, 4), c.cible[1] + a * fort * 0.6 * bruitSecousse(t, 5), c.cible[2]);
    camP.rotateZ(a * 0.04 * bruitSecousse(t, 6));
  }

  // ---------- L'état de la scène à l'instant t ----------

  const dirFaisceau = new THREE.Vector3();
  const tmpV = new THREE.Vector3();
  const feuxMer = mer.material.uniforms;

  function clignote(t, graine, t0, t1) {
    // coupure de courant : quelques battements, puis plus rien
    if (t < t0) return 1;
    if (t > t1) return 0;
    const x = (t - t0) / (t1 - t0);
    const f = Math.sin(t * 83 + graine) + Math.sin(t * 51 + graine * 2);
    return f > 0.2 + x * 1.2 ? 1 - x * 0.5 : 0.08;
  }

  function etat(t, hauteurPixels) {
    // Faisceau du phare : un tour en 9 s
    const theta = PLAN.phase + t * ((2 * Math.PI) / 9);
    faisceaux.rotation.set(0, theta, 0, "YXZ");
    faisceaux.rotateX(0.035);
    faisceaux.children[0].material.uniforms.uForce.value = 0.42;
    pivotLanterne.rotation.y = theta - THETA_MODELE;
    dirFaisceau.set(Math.sin(theta), 0, Math.cos(theta));
    // la lumière qui balaie : vers le bas et le long du faisceau
    balayage.target.position.set(LANTERNE.x + dirFaisceau.x * 70, -8, LANTERNE.z + dirFaisceau.z * 70);
    balayage.target.updateMatrixWorld();
    // l'éclat quand le faisceau passe sur la caméra
    tmpV.subVectors(camP.position, LANTERNE).setY(0).normalize();
    const face = Math.max(dirFaisceau.dot(tmpV), -dirFaisceau.dot(tmpV));
    eclatLanterne.scale.setScalar(6 + 46 * Math.pow(Math.max(face, 0), 60));
    eclatLanterne.material.opacity = Math.pow(Math.max(face, 0), 20);

    // Le cargo
    appliquerPose(t);
    poserChutes(t);
    poserDebris(t);
    const courant = clignote(t, 3, T.cassure - 0.02, T.cassure + 0.35);
    const projo = t < T.choc ? 1 : clignote(t, 1, T.choc, T.choc + 0.4);
    projecteur.intensity = 120 * projo;
    cargo.cone.material.uniforms.uForce.value = 0.16 * projo;
    cargo.source.material.opacity = projo;
    for (const n of ["babord", "tribord", "mat", "poupe", "misaine"]) feux[n].material.opacity = courant;
    feux.chateau.material.opacity = 0.35 * courant;
    cargo.materiaux.vitres.color.setScalar(0.1 + 0.9 * courant);
    const detresse = t > T.repos - 0.3 ? 0.75 + 0.25 * Math.sin(t * 5) : 0;
    feux.detresse.visible = detresse > 0;
    feux.detresse.material.opacity = detresse;
    feuDetresse.intensity = 0;
    // l'éclair du choc
    const fl = (t > T.choc ? 1.0 * Math.exp(-(t - T.choc) * 7) : 0) + (t > T.cassure ? 0.5 * Math.exp(-(t - T.cassure) * 9) : 0);
    eclair.position.copy(pointeEtrave).add(tmpV.set(0, 2, 0));
    eclair.intensity = 300 * fl;
    matSillage.uniforms.uForce.value = t < T.choc ? 1 : Math.max(0, 1 - (t - T.choc) * 0.8);

    // La mer : les feux et leurs reflets
    const U = feuxMer;
    let i = 0;
    const feu = (pos, coul, f) => {
      if (i >= NB_FEUX) return;
      U.uFeuxPos.value[i].copy(pos);
      U.uFeuxCoul.value[i].set(coul).multiplyScalar(f);
      i++;
    };
    feu(LANTERNE, 0xffc070, 0.8);
    for (const [n, c, f] of [["babord", 0xff3020, 0.7], ["tribord", 0x30ff70, 0.6], ["mat", 0xfff0d0, 0.6], ["poupe", 0xfff0d0, 0.5], ["misaine", 0xfff0d0, 0.5]]) feu(feux[n].getWorldPosition(tmpV), c, f * feux[n].material.opacity);
    feu(feux.chateau.getWorldPosition(tmpV), 0xffa850, 1.2 * courant);
    feu(feux.detresse.getWorldPosition(tmpV), 0xff2a1a, 0.12 * detresse);
    feu(eclair.position, 0xffa860, 2.5 * fl);
    while (i < NB_FEUX) feu(cache, 0, 0);
    U.uTemps.value = t;
    projecteur.getWorldPosition(U.uProjPos.value);
    U.uProjDir.value.copy(projecteur.target.getWorldPosition(tmpV)).sub(U.uProjPos.value).normalize();
    U.uProjCoul.value.set(0xd8e4ff).multiplyScalar(2.2 * projo);
    U.uPhare.value.copy(LANTERNE);
    U.uPhareDir.value.copy(dirFaisceau);
    U.uPhareCoul.value.set(0xffd9a6).multiplyScalar(0.55);
    ciel.material.uniforms.uTemps.value = t;
    ciel.material.uniforms.uPhareDir.value.copy(dirFaisceau);
    ciel.material.uniforms.uPhareCoul.value.set(0xffd9a6).multiplyScalar(0.3);
    ciel.material.uniforms.uEclair.value = fl;
    for (const g of [gEcume, gEtincelles]) {
      g.material.uniforms.uTemps.value = t;
      g.material.uniforms.uEclair.value = fl;
      g.material.uniforms.uEchelle.value = hauteurPixels / (2 * Math.tan(THREE.MathUtils.degToRad(camP.fov) / 2));
    }
    anneau.material.uniforms.uAge.value = t > T.choc ? t - T.choc : -1;
    ecume?.userData.animer?.(t);
    matSillage.uniforms.uTemps.value = t;
  }

  // ---------- Le rendu du plan, avec le rendu du jeu ----------

  const mesure = { appels: 0, triangles: 0, ms: 0 };

  /** Pose tout à l'instant `t` (s) : la caméra pour une image de `w` × `h` (`hauteurPixels` : sa hauteur en pixels). */
  function poser(t, w, h, hauteurPixels = h) {
    placerCamera(t, w, h);
    etat(t, hauteurPixels);
    ciel.position.copy(camP.position);
  }

  /** Dessine le plan à l'instant `t` (s) dans le rendu du jeu (sa taille, son rapport de pixels). */
  function rendre(rendu, t) {
    const t0 = performance.now();
    const w = rendu.domElement.clientWidth || rendu.domElement.width;
    const h = rendu.domElement.clientHeight || rendu.domElement.height;
    poser(t, w, h, rendu.domElement.height);
    const exposition = rendu.toneMappingExposure;
    rendu.toneMappingExposure = EXPOSITION;
    rendu.render(scene, camP);
    rendu.toneMappingExposure = exposition;
    mesure.appels = rendu.info.render.calls;
    mesure.triangles = rendu.info.render.triangles;
    mesure.ms = performance.now() - t0;
  }

  /** Prépare les nuanceurs d'avance (pendant l'approche du cargo), pour que le plan ne saccade pas à son début. */
  function compiler(rendu) {
    poser(T.choc, rendu.domElement.clientWidth || 375, rendu.domElement.clientHeight || 630, rendu.domElement.height);
    // Tout se montre le temps de la compilation (le feu de détresse, caché avant le repos, aussi).
    const caches = [];
    scene.traverse((o) => {
      if (!o.visible) {
        caches.push(o);
        o.visible = true;
      }
    });
    const fin = () => {
      for (const o of caches) o.visible = false;
    };
    const exposition = rendu.toneMappingExposure;
    rendu.toneMappingExposure = EXPOSITION;
    if (typeof rendu.compileAsync === "function") {
      // compileAsync relève les matières tout de suite (le reste n'est qu'une attente) : on recache aussitôt.
      const p = rendu.compileAsync(scene, camP).catch(() => undefined);
      rendu.toneMappingExposure = exposition;
      fin();
      return p;
    }
    rendu.compile(scene, camP);
    rendu.toneMappingExposure = exposition;
    fin();
    return Promise.resolve();
  }

  /**
   * Libère ce que la scène a créé : toutes ses géométries, ses matières (des copies à elle) et les textures du cargo et des
   * effets. Celles du modèle du phare restent : ses copies de matières les partagent avec le phare du jeu.
   */
  function liberer() {
    const matieres = new Set();
    const duModele = new Set();
    scene.traverse((o) => {
      o.geometry?.dispose();
      if (o.material) for (const m of [o.material].flat()) matieres.add(m);
    });
    for (const o of [phare, terrain]) o.traverse((q) => q.material && [q.material].flat().forEach((m) => duModele.add(m)));
    for (const m of matieres) {
      if (duModele.has(m)) {
        m.dispose();
        continue;
      }
      for (const v of Object.values(m)) if (v?.isTexture) v.dispose();
      for (const u of Object.values(m.uniforms ?? {})) if (u.value?.isTexture) u.value.dispose();
      m.dispose();
    }
  }

  /** Les instants des sons de la scène (son.js, jouer). */
  function evenements() {
    return { corne: T.corne, apparition: T.noir, choc: T.choc, cassure: T.cassure, plouf: chutes.filter((c) => c.eau).map((c) => c.lacher + c.duree), clang: chutes.filter((c) => !c.eau).map((c) => c.lacher + c.duree), grincement: 5.35, fin: T.fin };
  }

  return { scene, camera: camP, cargo, poser, rendre, compiler, liberer, evenements, mesure };
}
