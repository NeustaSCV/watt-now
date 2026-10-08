// La planche de la Coopérative du Plateau (développement) : le lieu vu comme en jeu (caméra orthographique de haut,
// depuis le sud-est), en vue large, de tout en haut, ou de près, avec un personnage qu'on pose au portail, entre les
// rayonnages, dans la chambre froide… pour vérifier que les toits s'effacent. Jour ou nuit ; triangles et appels de
// dessin affichés. Ouvrir /cooperative.html avec le serveur de développement.
// Pilotable depuis la console (et par le script de captures) : planche.placer("atelier"), planche.etat.vue = "dessus"…

import * as THREE from "three";
import { PORTES, sombreIci } from "../../commun/src/cooperative.ts";
import { eteintsCoop } from "../../commun/src/eteints-coop.ts";
import { vue } from "../../commun/src/eteints.ts";
import { Ciel, OBSCURITE } from "./rendu/ciel.ts";
import { VueEteint } from "./rendu/eteint.ts";
import { ReserveLumieres } from "./rendu/lumieres.ts";
import { animerCooperative, creerCooperative, estomperCooperative, majPortes } from "./rendu/cooperative.ts";
import { chargerHumanoides } from "./rendu/humanoides.ts";
import { PALETTE } from "./rendu/materiaux.ts";
import { Personnage } from "./rendu/personnage.ts";

const canvas = document.getElementById("vue") as HTMLCanvasElement;
const rendu = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
rendu.setPixelRatio(Math.min(window.devicePixelRatio, 2));
rendu.outputColorSpace = THREE.SRGBColorSpace;
rendu.toneMapping = THREE.ACESFilmicToneMapping;
rendu.toneMappingExposure = 1.05;
rendu.shadowMap.enabled = true;
rendu.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
const hemi = new THREE.HemisphereLight(0xdfe8f0, 0x4d5a3a, 1.15);
const soleil = new THREE.DirectionalLight(0xffdcae, 2.6);
soleil.castShadow = true;
soleil.shadow.mapSize.set(2048, 2048);
soleil.shadow.bias = -0.0006;
soleil.shadow.normalBias = 0.03;
scene.add(hemi, soleil, soleil.target);
// Comme en jeu (Scene) : le cycle du ciel, l'obscurité locale des pièces noires, la réserve de lumières (8 en qualité
// haute, avec l'ombre de la lampe ; 4 en moyenne, sans : cooperative.html#qualite=moyen).
const QUALITE_HAUTE = !location.hash.includes("qualite=moyen");
const ciel = new Ciel(scene, rendu, hemi, soleil);
const reserve = new ReserveLumieres(scene, QUALITE_HAUTE ? 8 : 4, QUALITE_HAUTE ? 512 : 0);
/** La lanterne de Rose (main.ts, LUMIERES_PORTEES) ; dans une pièce noire, comme en jeu (lampeDansLeNoir). */
const LANTERNE = { couleur: 0xffd27a, intensite: 3.5, portee: 7, vacillement: 0.15 };

const coop = creerCooperative();
scene.add(coop);

// Ce que coûte le lieu, compté une fois (hors personnage) : maillages et triangles, en tout et par partie.
let maillages = 0;
let triangles = 0;
const parPartie: Record<string, { maillages: number; triangles: number }> = {};
for (const partie of coop.children) {
  const nom = partie.name.replace(/^porte-.*/, "portes") || "?";
  const p = (parPartie[nom] ??= { maillages: 0, triangles: 0 });
  partie.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const g = m.geometry;
    const n = (g.index ? g.index.count : g.attributes.position!.count) / 3;
    const inst = (m as unknown as THREE.InstancedMesh).isInstancedMesh ? (m as unknown as THREE.InstancedMesh).count : 1;
    p.maillages++;
    p.triangles += Math.round(n * inst);
    maillages++;
    triangles += n * inst;
  });
}

/** Les points à regarder : là où l'on pose le personnage. */
const POINTS: Record<string, { x: number; z: number; o?: number }> = {
  portail: { x: 43, z: 56.5, o: Math.PI },
  "cour, bascule": { x: 47.5, z: 48 },
  "libre-service": { x: 41.5, z: 36.6 },
  bureaux: { x: 67, z: 35 },
  "hangar, rayonnages": { x: 44.5, z: 22.25, o: -Math.PI / 2 },
  "chambre froide": { x: 62, z: 12.2 },
  atelier: { x: 17, z: 23.5 },
  quai: { x: 31.6, z: 25.2 },
  silos: { x: 18.5, z: 9.5 },
  "brèche": { x: 2.5, z: 31 },
};

const etat = { point: "portail", vue: "jeu" as "jeu" | "large" | "dessus" | "pres", quart: 0, orbite: Math.PI / 4, hauteur: 0.55, nuit: false, x: 43, z: 56.5, toutesFermees: false, lampe: false, eteints: false };

let personnage: Personnage | null = null;
const camOrtho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 300);
const camPersp = new THREE.PerspectiveCamera(35, 1, 0.1, 400);
const ELEVATION = Math.atan(1 / Math.SQRT2);

/** Le jour (10 h) ou la nuit (23 h), par le cycle du jeu (Ciel) : les couleurs sont appliquées à chaque image. */
function ambiance(): void {
  if (!(scene.background instanceof THREE.Color)) scene.background = new THREE.Color(PALETTE.ciel);
  if (!scene.fog) scene.fog = new THREE.Fog(PALETTE.brume, 80, 140);
}

/** Les 24 Éteints du plan (eteintsCoop), dessinés comme en jeu, immobiles. */
const eteints: VueEteint[] = [];
function montrerEteints(oui: boolean): void {
  etat.eteints = oui;
  if (oui && eteints.length === 0) for (const e of eteintsCoop()) eteints.push(new VueEteint(vue(e)));
  for (const v of eteints) {
    if (oui && !v.objet.parent) scene.add(v.objet);
    if (!oui) scene.remove(v.objet);
  }
}

function placer(nom: string): void {
  etat.point = nom;
  const p = POINTS[nom]!;
  etat.x = p.x;
  etat.z = p.z;
  if (personnage) {
    personnage.objet.position.set(p.x, 0.06, p.z);
    personnage.objet.rotation.y = p.o ?? 0.6;
  }
  majBarre();
}

function redimensionner(): void {
  rendu.setSize(window.innerWidth, window.innerHeight, false);
}
window.addEventListener("resize", redimensionner);

function cadrer(): THREE.Camera {
  const aspect = window.innerWidth / window.innerHeight;
  const dessus = etat.vue === "dessus";
  const cible = dessus ? new THREE.Vector3(40, 0, 32) : new THREE.Vector3(etat.x, 0, etat.z);
  const ombre = dessus ? 52 : etat.vue === "large" ? 30 : 24;
  Object.assign(soleil.shadow.camera, { left: -ombre, right: ombre, top: ombre, bottom: -ombre, near: 1, far: 160 });
  soleil.shadow.camera.updateProjectionMatrix();
  soleil.position.set(cible.x + 18, 45, cible.z - 27);
  soleil.target.position.copy(cible);
  if (etat.vue === "pres") {
    camPersp.aspect = aspect;
    camPersp.updateProjectionMatrix();
    const d = 18;
    camPersp.position.set(cible.x + Math.cos(etat.orbite) * d * Math.cos(etat.hauteur), Math.sin(etat.hauteur) * d + 1, cible.z + Math.sin(etat.orbite) * d * Math.cos(etat.hauteur));
    camPersp.lookAt(cible.x, 1.2, cible.z);
    return camPersp;
  }
  const lacet = Math.PI / 4 + (etat.quart * Math.PI) / 2;
  const demiLargeur = (dessus ? 52 : etat.vue === "large" ? 18 : 10) * (aspect < 1 ? 0.75 : 1);
  camOrtho.left = -demiLargeur;
  camOrtho.right = demiLargeur;
  camOrtho.top = demiLargeur / aspect;
  camOrtho.bottom = -demiLargeur / aspect;
  camOrtho.updateProjectionMatrix();
  // Comme en jeu, la caméra est à 60 m ; de tout en haut, plus loin, et sans brume.
  const d = dessus ? 130 : 60;
  if (scene.fog instanceof THREE.Fog) {
    scene.fog.near = dessus ? 300 : 80;
    scene.fog.far = dessus ? 500 : 140;
  }
  const h = Math.cos(ELEVATION) * d;
  camOrtho.position.set(cible.x + Math.cos(lacet) * h, Math.sin(ELEVATION) * d, cible.z + Math.sin(lacet) * h);
  camOrtho.lookAt(cible);
  return camOrtho;
}

const barre = document.getElementById("barre")!;
const stats = document.getElementById("stats")!;
/** Les compteurs de la dernière image rendue. */
function afficher(): void {
  const i = rendu.info.render;
  stats.textContent = `Image : ${i.calls} appels de dessin · ${Math.round(i.triangles / 1000)} k triangles (ombres comprises) — Lieu : ${maillages} maillages · ${Math.round(triangles / 1000)} k triangles`;
}
function bouton(texte: string, actif: boolean, action: () => void): HTMLButtonElement {
  const b = document.createElement("button");
  b.textContent = texte;
  if (actif) b.className = "actif";
  b.onclick = () => {
    action();
    majBarre();
  };
  return b;
}
function basculerPortes(): void {
  etat.toutesFermees = !etat.toutesFermees;
  const etats: Record<string, boolean> = {};
  for (const p of PORTES) etats[p.id] = etat.toutesFermees ? false : p.ouverte;
  etats.portail = !etat.toutesFermees;
  majPortes(coop, etats, true);
}
function majBarre(): void {
  barre.innerHTML = "<b>Coopérative</b> · ";
  for (const nom of Object.keys(POINTS)) barre.append(bouton(nom, nom === etat.point, () => placer(nom)));
  barre.append(document.createElement("br"));
  for (const [v, t] of [["jeu", "vue de jeu"], ["large", "vue large"], ["dessus", "tout le lieu"], ["pres", "de près"]] as const) barre.append(bouton(t, etat.vue === v, () => (etat.vue = v)));
  barre.append(bouton("↺ quart de tour", false, () => (etat.quart = (etat.quart + 1) % 4)));
  barre.append(bouton("orbite ←", false, () => (etat.orbite -= 0.4)));
  barre.append(bouton("orbite →", false, () => (etat.orbite += 0.4)));
  barre.append(bouton("plus haut", false, () => (etat.hauteur = Math.min(1.5, etat.hauteur + 0.2))));
  barre.append(bouton("plus bas", false, () => (etat.hauteur = Math.max(0.05, etat.hauteur - 0.2))));
  barre.append(bouton(etat.nuit ? "☾ nuit" : "☀ jour", etat.nuit, () => {
    etat.nuit = !etat.nuit;
    ambiance();
  }));
  barre.append(bouton(etat.toutesFermees ? "portes fermées" : "portes du plan", etat.toutesFermees, basculerPortes));
  barre.append(bouton(etat.lampe ? "lampe allumée" : "lampe éteinte", etat.lampe, () => (etat.lampe = !etat.lampe)));
  barre.append(bouton("Éteints", etat.eteints, () => montrerEteints(!etat.eteints)));
}

// Pour piloter la planche depuis la console ou le script de captures.
(window as unknown as { planche: unknown }).planche = {
  placer,
  etat,
  POINTS,
  scene,
  rendu,
  coop,
  parPartie,
  ambiance,
  ciel,
  OBSCURITE,
  montrerEteints,
  barre: (visible: boolean) => barre.classList.toggle("cache", !visible),
  aller: (x: number, z: number) => {
    etat.x = x;
    etat.z = z;
    personnage?.objet.position.set(x, 0.06, z);
  },
  pret: false,
  /** Une image rendue tout de suite, et ce qu'elle a coûté (passe d'ombre comprise). */
  mesurer: () => {
    rendu.render(scene, cadrer());
    const i = rendu.info.render;
    afficher();
    return { appels: i.calls, triangles: i.triangles };
  },
};

ambiance();
void chargerHumanoides().then(() => {
  personnage = new Personnage("mecanistes");
  scene.add(personnage.objet);
  placer(etat.point);
  redimensionner();
  let dernier = performance.now();
  let compte = 0;
  const boucle = (t: number) => {
    requestAnimationFrame(boucle);
    const dt = Math.min(0.05, (t - dernier) / 1000);
    dernier = t;
    personnage!.animer(dt, 0);
    const p = personnage!.objet.position;
    // L'obscurité locale (Book 23 §4.5), en fondu de 0,6 s, et la lampe : comme Scene.eclairer en jeu.
    const noir = sombreIci(p.x, p.z);
    ciel.obscurite = Math.min(1, Math.max(0, ciel.obscurite + (noir ? 1 : -1) * (dt / 0.6)));
    ciel.appliquer(etat.nuit ? 23 : 10, p);
    personnage!.porterLumiere(etat.lampe && (noir || etat.nuit));
    const o = personnage!.objet.rotation.y;
    const source = noir ? { ...LANTERNE, x: p.x + Math.sin(o) * 0.45, y: 2.7, z: p.z + Math.cos(o) * 0.45, intensite: LANTERNE.intensite * 2, portee: 9, decroissance: 1 } : { ...LANTERNE, x: p.x, y: 1.7, z: p.z };
    reserve.mettreAJour(etat.lampe ? [source] : [], p, dt, ciel.obscurite > 0.5 || ciel.nuit > 0.5);
    for (const e of eteints) e.animer(dt);
    animerCooperative(coop, dt);
    estomperCooperative(coop, p.x, p.z, dt, Math.PI / 4 + (etat.quart * Math.PI) / 2);
    rendu.render(scene, cadrer());
    if (++compte % 5 === 0) afficher();
  };
  requestAnimationFrame(boucle);
  (window as unknown as { planche: { pret: boolean } }).planche.pret = true;
});
