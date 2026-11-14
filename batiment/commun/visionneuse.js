// La visionneuse de la banque de bâtiments : chaque bâtiment sur un terrain neutre, en vue de jeu (orthographique,
// isométrique, par quarts de tour, toits qui s'effacent autour du personnage) ou en vue libre ; jour, soir ou nuit ;
// usure réglable ; vue en coupe (toits et étages retirés).
// Adresse : index.html?b=<id>&carte=<id>&vue=jeu|libre&heure=jour|soir|nuit&toits=auto|visibles|masques&usure=0.7&px=0&pz=0&fiche=non&cam=45,24,60,0,0

import * as THREE from "three";
import { CATALOGUE } from "../catalogue.js";
import { estomperToits } from "./toits.js";

const params = new URLSearchParams(location.search);
const etat = {
  id: params.get("b") ?? CATALOGUE[0].id,
  carte: params.get("carte") ?? "",
  vue: params.get("vue") ?? "libre",
  heure: params.get("heure") ?? "jour",
  toits: params.get("toits") ?? "auto",
  usure: Number(params.get("usure") ?? 0.7),
  grille: false,
  lacet: Math.PI / 4,
  zoom: 1,
};

// ---------- Rendu ----------

const canvas = document.getElementById("vue");
const rendu = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
rendu.setPixelRatio(Math.min(window.devicePixelRatio, 2));
rendu.outputColorSpace = THREE.SRGBColorSpace;
rendu.toneMapping = THREE.ACESFilmicToneMapping;
rendu.toneMappingExposure = 1.05;
rendu.shadowMap.enabled = true;
rendu.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const hemi = new THREE.HemisphereLight(0xdfe8f0, 0x5a5e4c, 1.1);
const soleil = new THREE.DirectionalLight(0xffdcae, 2.6);
soleil.castShadow = true;
soleil.shadow.mapSize.set(4096, 4096);
soleil.shadow.bias = -0.0005;
soleil.shadow.normalBias = 0.04;
scene.add(hemi, soleil, soleil.target);

// Une réserve fixe de lumières de nuit (Book 21 §5.3.3 : on allume, on n'en crée pas).
const reserve = [];
for (let i = 0; i < 8; i++) {
  const l = new THREE.PointLight(0xffd27a, 0, 10, 1.6);
  l.visible = false;
  reserve.push(l);
  scene.add(l);
}

// ---------- Terrain neutre ----------

function texSol() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#a3a690";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5000; i++) {
    const v = Math.random();
    g.fillStyle = v < 0.5 ? "rgba(70,80,50,0.08)" : "rgba(255,250,230,0.07)";
    g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(60, 60);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const sol = new THREE.Mesh(new THREE.PlaneGeometry(600, 600).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: texSol(), roughness: 1 }));
sol.position.y = -0.02;
sol.receiveShadow = true;
scene.add(sol);
const grille = new THREE.GridHelper(200, 200, 0x55594a, 0x7b7f6a);
grille.position.y = 0.02;
grille.material.transparent = true;
grille.material.opacity = 0.35;
grille.visible = false;
scene.add(grille);
const cadreLot = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)), new THREE.LineBasicMaterial({ color: 0x3d4152, transparent: true, opacity: 0.45 }));
cadreLot.position.y = 0.03;
scene.add(cadreLot);

// ---------- Le personnage (repère d'échelle : 1,75 m) ----------

function creerMannequin() {
  const g = new THREE.Group();
  const m = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, flatShading: true });
  const bleu = m(0x3b5a8c);
  const peau = m(0xc68e64);
  const jambes = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.85, 6), m(0x2f3a4c));
  jambes.position.y = 0.43;
  const corps = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.62, 7), bleu);
  corps.position.y = 1.15;
  const bande = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.07, 7), m(0xd8c43a));
  bande.position.y = 1.1;
  const tete = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 1), peau);
  tete.position.y = 1.6;
  const lampe = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.05), m(0xe6f0ff));
  lampe.position.set(0, 1.66, 0.14);
  for (const o of [jambes, corps, bande, tete, lampe]) {
    o.castShadow = true;
    g.add(o);
  }
  // Sa lampe frontale (Voltaïque) éclaire la nuit
  const frontale = new THREE.SpotLight(0xe6f0ff, 0, 14, 0.55, 0.5, 1.2);
  frontale.position.set(0, 1.66, 0.15);
  frontale.target.position.set(0, 0.3, 4);
  g.add(frontale, frontale.target);
  g.userData.frontale = frontale;
  return g;
}
const mannequin = creerMannequin();
scene.add(mannequin);

// ---------- Caméras ----------

const camOrtho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 600);
const camPersp = new THREE.PerspectiveCamera(38, 1, 0.1, 900);
const ELEVATION = Math.atan(1 / Math.SQRT2);
const libre = { cible: new THREE.Vector3(), azimut: Math.PI / 4, hauteur: 0.42, distance: 60 };

function cameraActive() {
  return etat.vue === "jeu" ? camOrtho : camPersp;
}

function placerCameras() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (etat.vue === "jeu") {
    const largeur = 22 * etat.zoom;
    const hauteur = (largeur * h) / w;
    Object.assign(camOrtho, { left: -largeur / 2, right: largeur / 2, top: hauteur / 2, bottom: -hauteur / 2 });
    camOrtho.updateProjectionMatrix();
    const d = 120;
    const p = mannequin.position;
    camOrtho.position.set(p.x + Math.cos(etat.lacet) * Math.cos(ELEVATION) * d, p.y + Math.sin(ELEVATION) * d, p.z + Math.sin(etat.lacet) * Math.cos(ELEVATION) * d);
    camOrtho.lookAt(p.x, p.y + 0.9, p.z);
  } else {
    camPersp.aspect = w / h;
    camPersp.updateProjectionMatrix();
    const { cible, azimut, hauteur, distance } = libre;
    camPersp.position.set(cible.x + Math.cos(azimut) * Math.cos(hauteur) * distance, cible.y + Math.sin(hauteur) * distance, cible.z + Math.sin(azimut) * Math.cos(hauteur) * distance);
    camPersp.lookAt(cible);
  }
}

function redimensionner() {
  rendu.setSize(canvas.clientWidth, canvas.clientHeight, false);
  placerCameras();
}
window.addEventListener("resize", redimensionner);

// ---------- Heure du jour ----------

const HEURES = {
  jour: { ciel: 0xc9d8e4, brume: 0xd6dccf, hemi: [0xdfe8f0, 0x5a5e4c, 1.1], soleil: [0xffdcae, 2.6], dir: [0.55, 0.75, 0.38], expo: 1.05, nuit: false },
  soir: { ciel: 0xe2b48c, brume: 0xd9b49a, hemi: [0xf0c9a4, 0x4a3f3c, 0.75], soleil: [0xff9a55, 2.1], dir: [-0.75, 0.28, 0.35], expo: 1.0, nuit: false },
  nuit: { ciel: 0x1d2840, brume: 0x26324c, hemi: [0x5d75a8, 0x1c2030, 0.55], soleil: [0x9db4d9, 0.55], dir: [-0.4, 0.8, -0.45], expo: 1.15, nuit: true },
};

function appliquerHeure() {
  const h = HEURES[etat.heure];
  scene.background = new THREE.Color(h.ciel);
  scene.fog = new THREE.Fog(h.brume, 160, 420);
  hemi.color.setHex(h.hemi[0]);
  hemi.groundColor.setHex(h.hemi[1]);
  hemi.intensity = h.hemi[2];
  soleil.color.setHex(h.soleil[0]);
  soleil.intensity = h.soleil[1];
  rendu.toneMappingExposure = h.expo;
  mannequin.userData.frontale.intensity = h.nuit ? 30 : 0;
  allumerLumieres();
}

function allumerLumieres() {
  const nuit = HEURES[etat.heure].nuit;
  const sources = (courant?.objet.userData.lumieres ?? []).slice(0, reserve.length);
  reserve.forEach((l, i) => {
    const s = sources[i];
    l.visible = !!(s && (nuit || etat.heure === "soir"));
    if (!s) return;
    l.position.set(s.x, s.y, s.z);
    l.color.setHex(s.couleur);
    l.intensity = s.intensite * (nuit ? 1 : 0.4);
    l.distance = s.portee;
  });
}

// ---------- Chargement d'un bâtiment ----------

/** Budget d'une carte de bâtiment (la scène entière : ≤ 150 000 triangles et ≤ 120 appels sur mobile, Book 21 §5.3.4). */
export const BUDGET = { triangles: 60000, appels: 40 };

let courant = null;
const ficheEl = document.getElementById("fiche");
const statsEl = document.getElementById("stats");
const chargementEl = document.getElementById("chargement");

async function charger() {
  chargementEl.style.display = "block";
  await new Promise((r) => setTimeout(r, 20));
  if (courant) {
    scene.remove(courant.objet);
    courant.objet.traverse((o) => o.geometry?.dispose());
  }
  courant = null;
  try {
    const mod0 = await import(`../${etat.id}/modele.js`);
    // Adresse : &miroir=1 montre le lieu retourné, s'il le propose (FICHE_MIROIR et creer({ miroir: true }))
    const mod = params.get("miroir") === "1" && mod0.FICHE_MIROIR ? { ...mod0, FICHE: mod0.FICHE_MIROIR, creer: (o) => mod0.creer({ ...o, miroir: true }) } : mod0;
    const cartes = mod.FICHE.cartes ?? [];
    const toute = !!mod.FICHE.halte && etat.carte === "*";
    if (!toute && cartes.length && !cartes.some((k) => k.id === etat.carte)) etat.carte = cartes[0].id;
    if (!cartes.length) etat.carte = "";
    const carte = cartes.find((k) => k.id === etat.carte);
    const t0 = performance.now();
    const objet = toute ? halteEntiere(mod) : mod.creer({ usure: etat.usure, carte: etat.carte || undefined });
    const duree = performance.now() - t0;
    // Adresse : &montrer=a,b&cacher=c montre ou cache des objets nommés (l'autre état d'une porte, l'épave, la marée…)
    for (const [cle, vis] of [["montrer", true], ["cacher", false]]) {
      for (const nom of (params.get(cle) ?? "").split(",").filter(Boolean)) objet.traverse((o) => { if (o.name === nom) o.visible = vis; });
    }
    scene.add(objet);
    courant = { objet, fiche: mod.FICHE, carte, duree };
    // Un bâtiment qui creuse (bassin, falaise, fosse) fournit son propre sol : le terrain neutre ne doit pas le couvrir.
    sol.visible = !(carte?.solPropre ?? mod.FICHE.solPropre);
    const lot = carte?.lot ?? mod.FICHE.lot ?? { l: 50, p: 50 };
    cadreLot.scale.set(lot.l, 1, lot.p);
    const depart = carte?.depart ?? mod.FICHE.depart ?? { x: 0, z: lot.p / 2 - 3 };
    mannequin.position.set(depart.x, 0, depart.z);
    // Adresse : &px=…&pz=… place le personnage (premier chargement seulement)
    if (params.has("px")) {
      mannequin.position.set(Number(params.get("px")), 0, Number(params.get("pz") ?? 0));
      params.delete("px");
    }
    libre.cible.set(0, 4, 0);
    libre.distance = Math.max(lot.l, lot.p) * 1.05;
    // Adresse : &cam=azimut(°),hauteur(°),distance,cx,cz — la caméra libre (premier chargement seulement)
    if (params.has("cam")) {
      const [az, ht, di, cx, cz] = params.get("cam").split(",").map(Number);
      if (Number.isFinite(az)) libre.azimut = (az * Math.PI) / 180;
      if (Number.isFinite(ht)) libre.hauteur = (ht * Math.PI) / 180;
      if (Number.isFinite(di)) libre.distance = di;
      if (Number.isFinite(cx)) libre.cible.x = cx;
      if (Number.isFinite(cz)) libre.cible.z = cz;
      params.delete("cam");
    }
    // Ombres : la carte couvre tout le lot
    const r = Math.max(lot.l, lot.p) * 0.75;
    Object.assign(soleil.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 1, far: 400 });
    soleil.shadow.camera.updateProjectionMatrix();
    afficherFiche();
  } catch (e) {
    console.error(e);
    ficheEl.innerHTML = `<h2>${CATALOGUE.find((b) => b.id === etat.id)?.nom ?? etat.id}</h2><p>En préparation.</p><p style="opacity:.6">${String(e.message ?? e)}</p>`;
  }
  appliquerHeure();
  placerCameras();
  chargementEl.style.display = "none";
}

/**
 * Une halte (FICHE.halte) est faite de tronçons (ses cartes) mis bout à bout le long de la route : chaque carte
 * porte son `decalage` {x, z} dans le repère de la halte entière. On les pose tous, couches et lumières recalées.
 */
function halteEntiere(mod) {
  const g = new THREE.Group();
  const toits = [];
  const lumieres = [];
  const obstacles = [];
  for (const k of mod.FICHE.cartes) {
    const o = mod.creer({ usure: etat.usure, carte: k.id });
    const dx = k.decalage?.x ?? 0;
    const dz = k.decalage?.z ?? 0;
    o.position.set(dx, 0, dz);
    for (const t of o.userData.toits ?? []) {
      toits.push({ ...t, boite: { ...t.boite, x: t.boite.x + dx, z: t.boite.z + dz }, horsDe: t.horsDe && { ...t.horsDe, x: t.horsDe.x + dx, z: t.horsDe.z + dz } });
    }
    for (const l of o.userData.lumieres ?? []) lumieres.push({ ...l, x: l.x + dx, z: l.z + dz });
    for (const b of o.userData.obstacles ?? []) obstacles.push({ ...b, x1: b.x1 + dx, z1: b.z1 + dz, x2: b.x2 + dx, z2: b.z2 + dz });
    o.userData.toits = undefined;
    g.add(o);
  }
  g.userData.toits = toits;
  g.userData.lumieres = lumieres;
  g.userData.obstacles = obstacles;
  return g;
}

let ficheRepliee = params.get("fiche") === "non";
function afficherFiche() {
  const f = courant.fiche;
  const k = courant.carte;
  const cartes = f.cartes ?? [];
  const lignes = (l) => (l?.length ? `<ul>${l.map((x) => `<li>${x}</li>`).join("")}</ul>` : "");
  ficheEl.innerHTML = `
    <h2 id="titreFiche" style="cursor:pointer" title="Replier / déplier">${f.nom} <span style="font-size:12px;opacity:.5">▾</span></h2>
    <div id="corpsFiche" style="display:${ficheRepliee ? "none" : "block"}">
    <div class="lieu">${f.lieu ?? ""} · danger ${"●".repeat(f.danger ?? 1)}</div>
    ${cartes.length ? `<div class="groupe">${f.halte ? `<button data-carte="*" class="${etat.carte === "*" ? "actif" : ""}">Toute la halte</button> ` : ""}${cartes.map((c) => `<button data-carte="${c.id}" class="${c.id === etat.carte ? "actif" : ""}">${c.nom}</button>`).join(" ")}</div>` : ""}
    <div class="lieu">${etat.carte === "*" ? "Halte entière (le budget s'entend par tronçon)" : ""} Carte de ${(k?.lot ?? f.lot).l} × ${(k?.lot ?? f.lot).p} m${k?.description ? " · " + k.description : ""}</div>
    <p>${f.recit ?? ""}</p>
    ${f.inspiration ? `<p><i>Inspiration : ${f.inspiration}</i></p>` : ""}
    ${f.reperes ? `<b>À voir</b>${lignes(f.reperes)}` : ""}
    <button id="copierFiche">Copier la fiche (JSON)</button></div>`;
  document.getElementById("titreFiche").onclick = () => {
    ficheRepliee = !ficheRepliee;
    document.getElementById("corpsFiche").style.display = ficheRepliee ? "none" : "block";
  };
  for (const b of ficheEl.querySelectorAll("[data-carte]")) b.onclick = () => {
    etat.carte = b.dataset.carte;
    majAdresse();
    charger();
  };
  document.getElementById("copierFiche").onclick = () => {
    const o = courant.objet.userData;
    const donnees = { ...f, carte: etat.carte || undefined, obstacles: o.obstacles, lumieres: o.lumieres, couches: o.toits.map((t) => ({ nom: t.nom, boite: t.boite, bas: t.bas, haut: t.haut })) };
    navigator.clipboard?.writeText(JSON.stringify(donnees, null, 2));
  };
}

function compter() {
  let tri = 0;
  let appels = 0;
  courant?.objet.traverse((o) => {
    if (!o.isMesh || !o.visible || !o.material.colorWrite) return;
    const g = o.geometry;
    tri += (g.index ? g.index.count : g.attributes.position.count) / 3;
    appels++;
  });
  return { tri: Math.round(tri), appels };
}

// ---------- Barre de commandes ----------

const barre = document.getElementById("barre");
function groupe(titre, options, cle, apres) {
  const d = document.createElement("div");
  d.className = "groupe";
  d.innerHTML = `<span class="titre">${titre}</span>`;
  for (const [valeur, libelle] of options) {
    const b = document.createElement("button");
    b.textContent = libelle;
    b.dataset.valeur = valeur;
    b.onclick = () => {
      etat[cle] = valeur;
      for (const x of d.querySelectorAll("button")) x.classList.toggle("actif", x.dataset.valeur === etat[cle]);
      majAdresse();
      apres();
    };
    if (valeur === etat[cle]) b.classList.add("actif");
    d.appendChild(b);
  }
  barre.appendChild(d);
}
{
  // Le choix du bâtiment : une liste (le catalogue grandit)
  const d = document.createElement("div");
  d.className = "groupe";
  d.innerHTML = `<span class="titre">Bâtiment</span>`;
  const choix = document.createElement("select");
  choix.style.cssText = "min-height:28px;font:inherit;border-radius:6px;border:1px solid #b9b2a2;background:#fffdf8;max-width:260px";
  const groupes = new Map();
  for (const b of CATALOGUE) {
    const nomGroupe = b.type === "halte" ? "Haltes" : "Lieux";
    if (!groupes.has(nomGroupe)) {
      const og = document.createElement("optgroup");
      og.label = nomGroupe;
      groupes.set(nomGroupe, og);
      choix.appendChild(og);
    }
    const o = document.createElement("option");
    o.value = b.id;
    o.textContent = `${b.nom}${b.statut === "à valider" ? "" : " · " + b.statut}`;
    if (b.id === etat.id) o.selected = true;
    groupes.get(b.type === "halte" ? "Haltes" : "Lieux").appendChild(o);
  }
  choix.onchange = () => {
    etat.id = choix.value;
    etat.carte = "";
    majAdresse();
    charger();
  };
  d.appendChild(choix);
  barre.appendChild(d);
}
groupe("Vue", [["libre", "Libre"], ["jeu", "Jeu"]], "vue", placerCameras);
groupe("Heure", [["jour", "Jour"], ["soir", "Soir"], ["nuit", "Nuit"]], "heure", appliquerHeure);
groupe("Toits", [["auto", "Auto"], ["visibles", "Visibles"], ["masques", "Coupe"]], "toits", () => {});
{
  const d = document.createElement("div");
  d.className = "groupe";
  d.innerHTML = `<span class="titre">Usure</span><input type="range" min="0.1" max="1" step="0.05" value="${etat.usure}"><button>Grille 1 m</button>`;
  const r = d.querySelector("input");
  r.onchange = () => {
    etat.usure = Number(r.value);
    majAdresse();
    charger();
  };
  const bg = d.querySelector("button");
  bg.onclick = () => {
    etat.grille = !etat.grille;
    grille.visible = etat.grille;
    bg.classList.toggle("actif", etat.grille);
  };
  barre.appendChild(d);
}

function majAdresse() {
  const p = new URLSearchParams({ ...(params.get("miroir") === "1" ? { miroir: "1" } : {}), b: etat.id, carte: etat.carte, vue: etat.vue, heure: etat.heure, toits: etat.toits, usure: String(etat.usure) });
  history.replaceState(null, "", "?" + p);
}

// ---------- Entrées ----------

const touches = new Set();
window.addEventListener("keydown", (e) => {
  if (e.target instanceof HTMLInputElement) return;
  touches.add(e.key.toLowerCase());
  if (e.key === "a" || e.key === "A") etat.lacet -= Math.PI / 2;
  if (e.key === "e" || e.key === "E") etat.lacet += Math.PI / 2;
});
window.addEventListener("keyup", (e) => touches.delete(e.key.toLowerCase()));

const rayon = new THREE.Raycaster();
const plan = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let glisse = null;
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("pointerdown", (e) => {
  glisse = { x: e.clientX, y: e.clientY, bouton: e.button, maj: e.shiftKey, bouge: 0 };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (!glisse) return;
  const dx = e.clientX - glisse.x;
  const dy = e.clientY - glisse.y;
  glisse.x = e.clientX;
  glisse.y = e.clientY;
  glisse.bouge += Math.abs(dx) + Math.abs(dy);
  if (etat.vue !== "libre") return;
  if (glisse.bouton === 2 || glisse.maj) {
    const k = libre.distance * 0.0016;
    const av = new THREE.Vector3(-Math.cos(libre.azimut), 0, -Math.sin(libre.azimut));
    const dr = new THREE.Vector3(-av.z, 0, av.x);
    libre.cible.addScaledVector(dr, -dx * k).addScaledVector(av, dy * k);
  } else {
    libre.azimut += dx * 0.006;
    libre.hauteur = Math.min(1.45, Math.max(0.04, libre.hauteur + dy * 0.005));
  }
  placerCameras();
});
canvas.addEventListener("pointerup", (e) => {
  if (glisse && glisse.bouge < 5 && glisse.bouton === 0) {
    // Un clic au sol : le personnage y va
    const r = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    rayon.setFromCamera(ndc, cameraActive());
    const p = new THREE.Vector3();
    if (rayon.ray.intersectPlane(plan, p)) mannequin.position.set(p.x, 0, p.z);
    placerCameras();
  }
  glisse = null;
});
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();
  const k = Math.exp(e.deltaY * 0.0012);
  if (etat.vue === "jeu") etat.zoom = Math.min(6, Math.max(0.4, etat.zoom * k));
  else libre.distance = Math.min(400, Math.max(4, libre.distance * k));
  placerCameras();
}, { passive: false });

// ---------- Boucle ----------

const horloge = new THREE.Clock();
function boucle() {
  const dt = Math.min(0.05, horloge.getDelta());
  const t = horloge.elapsedTime;
  // Déplacement au clavier (relatif à la caméra de jeu)
  let ax = 0, az = 0;
  if (touches.has("z") || touches.has("w") || touches.has("arrowup")) az -= 1;
  if (touches.has("s") || touches.has("arrowdown")) az += 1;
  if (touches.has("q") || touches.has("arrowleft")) ax -= 1;
  if (touches.has("d") || touches.has("arrowright")) ax += 1;
  if (ax || az) {
    const l = etat.lacet;
    const av = new THREE.Vector3(Math.cos(l), 0, Math.sin(l)).multiplyScalar(az);
    const dr = new THREE.Vector3(-Math.sin(l), 0, Math.cos(l)).multiplyScalar(-ax);
    const d = av.add(dr).normalize();
    mannequin.position.addScaledVector(d, dt * 4.2);
    mannequin.rotation.y = Math.atan2(d.x, d.z);
    placerCameras();
  }
  // Soleil centré sur ce qu'on regarde
  const h = HEURES[etat.heure];
  const centre = etat.vue === "jeu" ? mannequin.position : libre.cible;
  soleil.position.set(centre.x + h.dir[0] * 120, h.dir[1] * 120, centre.z + h.dir[2] * 120);
  soleil.target.position.set(centre.x, 0, centre.z);
  if (courant) {
    const lacet = etat.vue === "jeu" ? etat.lacet : libre.azimut;
    estomperToits(courant.objet, mannequin.position.x, mannequin.position.z, dt, lacet, etat.toits === "auto" && etat.vue === "libre" ? "visibles" : etat.toits);
    courant.objet.traverse((o) => o.userData.animer?.(t, dt));
    const { tri, appels } = compter();
    const trop = tri > BUDGET.triangles || appels > BUDGET.appels;
    statsEl.style.color = trop ? "#b3261e" : "";
    statsEl.textContent = `${tri.toLocaleString("fr-FR")} / ${BUDGET.triangles.toLocaleString("fr-FR")} triangles · ${appels} / ${BUDGET.appels} appels · ${Math.round(courant.duree)} ms`;
  }
  rendu.render(scene, cameraActive());
  requestAnimationFrame(boucle);
}

redimensionner();
charger();
boucle();
