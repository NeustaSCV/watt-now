// La planche de la faune (développement) : chaque bête vue de près, dans chacun de ses états, sous l'angle choisi ;
// et une « vue de jeu » (caméra isométrique haute, à l'échelle du jeu) pour juger de la lisibilité.
// Ouvrir /faune.html avec le serveur de développement.

import * as THREE from "three";
import type { AnimalVu } from "../../commun/src/faune.ts";
import {
  Volaille,
  creerCanard,
  creerHeron,
  creerLapin,
  creerRenard,
  poserLapin,
  poserOiseau,
  poserRenard,
  trianglesDe,
  type EtatRenard,
  type ModeleOiseau,
} from "./rendu/faune.ts";

const canvas = document.getElementById("vue") as HTMLCanvasElement;
const rendu = new THREE.WebGLRenderer({ canvas, antialias: true });
rendu.setPixelRatio(Math.min(window.devicePixelRatio, 2));
rendu.outputColorSpace = THREE.SRGBColorSpace;
rendu.toneMapping = THREE.ACESFilmicToneMapping;
rendu.toneMappingExposure = 1.05;
rendu.shadowMap.enabled = true;
rendu.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc9d8e4);
scene.add(new THREE.HemisphereLight(0xdfe8f0, 0x4d5a3a, 1.15));
const soleil = new THREE.DirectionalLight(0xffdcae, 2.6);
soleil.castShadow = true;
soleil.shadow.mapSize.set(4096, 4096);
Object.assign(soleil.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 120 });
soleil.shadow.bias = -0.0006;
soleil.shadow.normalBias = 0.03;
scene.add(soleil, soleil.target);

const sol = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x7fa35a, roughness: 1 }));
sol.receiveShadow = true;
scene.add(sol);
const eau = new THREE.MeshStandardMaterial({ color: 0x4f7486, roughness: 0.3 });
function mare(x: number, z: number, r: number): void {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 24).rotateX(-Math.PI / 2), eau);
  m.position.set(x, 0.01, z);
  m.receiveShadow = true;
  scene.add(m);
}

// ---------- Les cases ----------

interface Case {
  nom: string;
  cible: THREE.Vector3;
  distance: number;
  animer: (dt: number, t: number) => void;
}
const cases: Case[] = [];
const COLONNES = 5;
const ECART = 12;
const placeCase = (i: number) => new THREE.Vector3((i % COLONNES) * ECART, 0, Math.floor(i / COLONNES) * ECART);

const volaille = new Volaille();
scene.add(volaille.groupe);
const poules: AnimalVu[] = [];
const NOMS_ROBES = ["rousse", "blanche", "noire"];
for (const etat of ["picore", "inquiete", "fuit"] as const)
  for (let robe = 0; robe < 3; robe++) {
    const p = placeCase(cases.length);
    poules.push({ id: cases.length, espece: "poule", x: p.x, z: p.z, o: 0, etat, robe });
    cases.push({ nom: `poule ${NOMS_ROBES[robe]} · ${etat}`, cible: p.clone().setY(0.38), distance: 2.2, animer: () => {} });
  }
volaille.maj(poules);

const triangles: Record<string, number> = {};

for (const [etat, bouge] of [
  ["broute", false],
  ["broute", true],
  ["fuit", true],
] as const) {
  const p = placeCase(cases.length);
  const m = creerLapin();
  m.objet.position.copy(p);
  scene.add(m.objet);
  triangles["lapin"] = trianglesDe(m.objet);
  let bond = 0;
  cases.push({
    nom: `lapin · ${etat}${bouge ? " (bondit)" : ""}`,
    cible: p.clone().setY(0.25),
    distance: 2,
    animer: (dt, t) => {
      bond += dt * (etat === "fuit" ? 16 : 9);
      poserLapin(m, etat, bond, bouge, t);
    },
  });
}

for (const etat of ["rode", "traque", "charge", "emporte"] as const satisfies readonly EtatRenard[]) {
  const p = placeCase(cases.length);
  const m = creerRenard();
  m.objet.position.copy(p);
  scene.add(m.objet);
  triangles["renard"] = trianglesDe(m.objet) - trianglesDe(m.proie.objet);
  let pas = 0;
  const vitesse = etat === "charge" ? 13 : etat === "traque" ? 1.1 : etat === "emporte" ? 3.5 : 2.4;
  cases.push({
    nom: `renard · ${etat}`,
    cible: p.clone().setY(0.4),
    distance: 3,
    animer: (dt) => {
      pas += dt * vitesse * 3;
      poserRenard(m, etat, pas, dt);
    },
  });
}

function oiseau(nom: string, m: ModeleOiseau, echelle: number, vol: boolean, tempsFixe: number | null, hauteur: number, distance: number): void {
  const p = placeCase(cases.length);
  m.objet.scale.setScalar(echelle);
  m.objet.position.copy(p).setY(vol ? hauteur : 0.02);
  if (!vol && !m.cou) mare(p.x, p.z, 1.2);
  scene.add(m.objet);
  triangles[nom.split(" ·")[0]!] = trianglesDe(m.objet);
  cases.push({
    nom,
    cible: p.clone().setY(vol ? hauteur + (m.cou ? 0.75 : 0.15) : hauteur),
    distance,
    animer: (dt, t) => poserOiseau(m, vol, tempsFixe ?? t, dt),
  });
}
oiseau("colvert mâle · posé", creerCanard(true), 1.4, false, 1, 0.22, 2);
oiseau("colvert femelle · posée", creerCanard(false), 1.4, false, 1, 0.22, 2);
// Barbote : l'instant où la bascule a lieu (voir poserOiseau).
oiseau("colvert mâle · barbote", creerCanard(true), 1.4, false, 13.68, 0.22, 2);
oiseau("colvert mâle · vol", creerCanard(true), 1.4, true, null, 1.2, 2.4);
oiseau("héron · posé", creerHeron(), 1.2, false, null, 0.65, 3.6);
oiseau("héron · vol", creerHeron(), 1.2, true, null, 1.6, 4);

// ---------- La vue de jeu : à l'échelle, sous la caméra du jeu ----------

const JEU = new THREE.Vector3(150, 0, 0);
const volailleJeu = new Volaille();
scene.add(volailleJeu.groupe);
volailleJeu.maj([
  { id: 100, espece: "poule", x: JEU.x - 2, z: JEU.z - 1, o: 0.5, etat: "picore", robe: 0 },
  { id: 101, espece: "poule", x: JEU.x - 1, z: JEU.z + 0.3, o: 2.4, etat: "inquiete", robe: 1 },
  { id: 102, espece: "poule", x: JEU.x - 2.8, z: JEU.z + 0.8, o: -1, etat: "picore", robe: 2 },
]);
const jeuAnimes: ((dt: number, t: number) => void)[] = [];
{
  const l1 = creerLapin();
  l1.objet.position.set(JEU.x + 2, 0, JEU.z - 3);
  l1.objet.rotation.y = 1;
  const l2 = creerLapin();
  l2.objet.position.set(JEU.x + 3.5, 0, JEU.z - 1.5);
  l2.objet.rotation.y = -2;
  const r = creerRenard();
  r.objet.position.set(JEU.x + 4, 0, JEU.z + 2);
  r.objet.rotation.y = -2.2;
  scene.add(l1.objet, l2.objet, r.objet);
  let bond = 0;
  let pas = 0;
  jeuAnimes.push((dt, t) => {
    bond += dt * 16;
    pas += dt * 3.3;
    poserLapin(l1, "broute", 0, false, t);
    poserLapin(l2, "fuit", bond, true, t);
    poserRenard(r, "traque", pas, dt);
  });
  mare(JEU.x - 3, JEU.z + 5, 3);
  const canards = [creerCanard(true), creerCanard(false), creerCanard(true)];
  canards.forEach((c, i) => {
    c.objet.scale.setScalar(1.4);
    c.objet.position.set(JEU.x - 4 + i * 1.3, 0.02, JEU.z + 4.5 + (i % 2) * 1.2);
    c.objet.rotation.y = i * 2;
    scene.add(c.objet);
  });
  const h = creerHeron();
  h.objet.scale.setScalar(1.2);
  h.objet.position.set(JEU.x - 0.2, 0, JEU.z + 6.5);
  h.objet.rotation.y = 2.5;
  scene.add(h.objet);
  jeuAnimes.push((dt, t) => {
    canards.forEach((c, i) => poserOiseau(c, false, t + i * 5, dt));
    poserOiseau(h, false, t, dt);
  });
  // Un repère humain (1,75 m) pour l'échelle.
  const humain = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.3, 4, 8).translate(0, 0.875, 0), new THREE.MeshStandardMaterial({ color: 0x3b5a8c, flatShading: true }));
  humain.castShadow = true;
  humain.position.set(JEU.x + 0.5, 0, JEU.z - 0.5);
  scene.add(humain);
}

// ---------- Dessin ----------

const etat = { vue: 0.65, elevation: 0.25, mode: "planche" as "planche" | "jeu", zoom: 0.6 };
// ?cases=0,3,5 : n'afficher que ces cases (en grand) ; ?vue=1.57&elev=0.1 : l'angle ; ?jeu=0.6 : la vue de jeu.
const parametres = new URLSearchParams(location.search);
const choix = parametres.get("cases")?.split(",").map(Number) ?? null;
if (parametres.has("vue")) etat.vue = Number(parametres.get("vue"));
if (parametres.has("elev")) etat.elevation = Number(parametres.get("elev"));
if (parametres.has("jeu")) {
  etat.mode = "jeu";
  etat.zoom = Number(parametres.get("jeu"));
}
const camera = new THREE.PerspectiveCamera(28, 1, 0.05, 300);
const cameraJeu = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
const ELEVATION_JEU = Math.atan(1 / Math.SQRT2);

function redimensionner(): void {
  rendu.setSize(window.innerWidth, window.innerHeight, false);
}
window.addEventListener("resize", redimensionner);

function eclairer(centre: THREE.Vector3): void {
  soleil.target.position.copy(centre);
  soleil.position.copy(centre).add(new THREE.Vector3(-14, 22, 12));
}

function dessiner(): void {
  const l = window.innerWidth;
  const h = window.innerHeight;
  if (etat.mode === "jeu") {
    rendu.setScissorTest(false);
    rendu.setViewport(0, 0, l, h);
    const rapport = l / h;
    const demi = 10 * etat.zoom;
    Object.assign(cameraJeu, { left: -demi, right: demi, top: demi / rapport, bottom: -demi / rapport });
    cameraJeu.updateProjectionMatrix();
    const lacet = Math.PI / 4;
    const horiz = Math.cos(ELEVATION_JEU) * 60;
    cameraJeu.position.set(JEU.x + Math.cos(lacet) * horiz, Math.sin(ELEVATION_JEU) * 60, JEU.z + Math.sin(lacet) * horiz);
    cameraJeu.lookAt(JEU);
    eclairer(JEU);
    rendu.render(scene, cameraJeu);
    return;
  }
  const hu = h - 64;
  const vues = choix ? choix.map((i) => cases[i]!) : cases;
  const colonnes = choix ? Math.min(vues.length, 3) : COLONNES;
  const lignes = Math.ceil(vues.length / colonnes);
  const cl = l / colonnes;
  const ch = hu / lignes;
  eclairer(new THREE.Vector3(24, 0, 18));
  rendu.setScissorTest(true);
  vues.forEach((c, k) => {
    const x = (k % colonnes) * cl;
    const y = hu - (Math.floor(k / colonnes) + 1) * ch;
    rendu.setViewport(x, y, cl, ch);
    rendu.setScissor(x, y, cl, ch);
    camera.aspect = cl / ch;
    camera.updateProjectionMatrix();
    const d = c.distance;
    camera.position.set(
      c.cible.x + Math.sin(etat.vue) * Math.cos(etat.elevation) * d,
      c.cible.y + Math.sin(etat.elevation) * d,
      c.cible.z + Math.cos(etat.vue) * Math.cos(etat.elevation) * d,
    );
    camera.lookAt(c.cible);
    rendu.render(scene, camera);
  });
  rendu.setScissorTest(false);
}

// ---------- La barre ----------

const barre = document.getElementById("barre")!;
const titre = document.createElement("div");
barre.append(titre);
const majTitre = () => {
  titre.innerHTML = `<b>Faune</b> · triangles : poule ${triangles["poule"] ?? "?"}, ${Object.entries(triangles)
    .filter(([k]) => k !== "poule")
    .map(([k, v]) => `${k} ${v}`)
    .join(", ")} · ${etat.mode === "planche" ? cases.map((c, i) => `${i + 1}. ${c.nom}`).join(" | ") : "vue de jeu"}`;
};
for (const [nom, angle, elev] of [
  ["face", 0, 0.2],
  ["trois-quarts", 0.65, 0.25],
  ["profil", Math.PI / 2, 0.1],
  ["dos", Math.PI, 0.25],
  ["dessus iso", Math.PI / 4 + Math.PI / 2, ELEVATION_JEU],
] as const) {
  const b = document.createElement("button");
  b.textContent = nom;
  b.onclick = () => {
    etat.vue = angle;
    etat.elevation = elev;
    etat.mode = "planche";
    majTitre();
  };
  barre.append(b);
}
for (const z of [0.6, 1] as const) {
  const b = document.createElement("button");
  b.textContent = `vue de jeu ×${z}`;
  b.onclick = () => {
    etat.mode = "jeu";
    etat.zoom = z;
    majTitre();
  };
  barre.append(b);
}

// Pour la vérification automatique.
(window as unknown as { planche: unknown }).planche = { etat, cases };

let premier = true;
redimensionner();
let dernier = performance.now();
let temps = 0;
const boucle = (t: number) => {
  requestAnimationFrame(boucle);
  const dt = Math.min(0.05, (t - dernier) / 1000);
  dernier = t;
  temps += dt;
  volaille.animer(dt, () => {});
  volailleJeu.animer(dt, () => {});
  if (premier) {
    triangles["poule"] = trianglesDe(volaille.groupe.children[0]!);
    majTitre();
    premier = false;
  }
  for (const c of cases) c.animer(dt, temps);
  for (const a of jeuAnimes) a(dt, temps);
  dessiner();
};
requestAnimationFrame(boucle);
