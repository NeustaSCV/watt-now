// La planche des véhicules (développement) : les épaves de voiture et de camion, sous plusieurs angles, et dans
// la vue du jeu (caméra isométrique orthographique, ≈ 20 m de large). Ouvrir /vehicules.html avec le serveur de développement.

import * as THREE from "three";
import type { RessourceSol } from "../../commun/src/terrain.ts";
import { PALETTE } from "./rendu/materiaux.ts";
import { VueRessource } from "./rendu/ressources.ts";

const canvas = document.getElementById("vue") as HTMLCanvasElement;
const rendu = new THREE.WebGLRenderer({ canvas, antialias: true });
rendu.setPixelRatio(Math.min(window.devicePixelRatio, 2));
rendu.outputColorSpace = THREE.SRGBColorSpace;
rendu.toneMapping = THREE.ACESFilmicToneMapping;
rendu.toneMappingExposure = 1.05;
rendu.shadowMap.enabled = true;
rendu.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color(PALETTE.ciel);
scene.add(new THREE.HemisphereLight(0xdfe8f0, 0x4d5a3a, 1.15));
const soleil = new THREE.DirectionalLight(0xffdcae, 2.6);
soleil.position.set(30, 40, 20);
soleil.target.position.set(20, 0, 0);
soleil.castShadow = true;
soleil.shadow.mapSize.set(2048, 2048);
Object.assign(soleil.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 120 });
soleil.shadow.bias = -0.0006;
soleil.shadow.normalBias = 0.03;
scene.add(soleil, soleil.target);

// Le sol : de l'herbe, et une bande d'asphalte comme la route de la halte.
const herbe = new THREE.Mesh(new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: PALETTE.herbe, roughness: 1 }));
herbe.receiveShadow = true;
const route = new THREE.Mesh(new THREE.PlaneGeometry(200, 7).rotateX(-Math.PI / 2).translate(0, 0.02, 0), new THREE.MeshStandardMaterial({ color: 0x5e5c58, roughness: 1 }));
route.receiveShadow = true;
scene.add(herbe, route);

/** Les épaves de la planche : deux voitures (teintes différentes) et le camion, posés comme sur la route. */
// Par défaut, les identifiants des épaves de la halte (commun/src/halte.ts) : ce que voit le joueur.
const etat = { ids: [1, 2, 3], fouille: false, jeu: false, quart: 0, seul: null as number | null, angle: 0 };
// Une seule case en plein écran pour regarder de près : vehicules.html#seul=2&angle=1
const parametres = new URLSearchParams(location.hash.slice(1));
if (parametres.has("seul")) etat.seul = Number(parametres.get("seul"));
etat.angle = Number(parametres.get("angle") ?? 0);
etat.jeu = parametres.has("jeu");
etat.quart = Number(parametres.get("quart") ?? 0);
etat.fouille = parametres.has("fouille");
let vues: VueRessource[] = [];
function peupler(): void {
  for (const v of vues) scene.remove(v.objet);
  const donnees: RessourceSol[] = [
    { id: etat.ids[0]!, type: "epave_voiture", x: 0, z: 0, disponible: !etat.fouille },
    { id: etat.ids[1]!, type: "epave_voiture", x: 8, z: 0.5, disponible: !etat.fouille },
    { id: etat.ids[2]!, type: "epave_camion", x: 18, z: -0.3, disponible: !etat.fouille },
  ];
  vues = donnees.map((d) => new VueRessource(d));
  for (const v of vues) scene.add(v.objet);
  let triangles = "";
  for (const v of vues) {
    let n = 0;
    let appels = 0;
    v.objet.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        const g = o.geometry as THREE.BufferGeometry;
        n += (g.index ? g.index.count : g.getAttribute("position").count) / 3;
        appels++;
      }
    });
    triangles += `${v.donnees.type} n°${v.donnees.id} : ${Math.round(n)} triangles, ${appels} maillages · `;
  }
  infos.textContent = triangles;
}

const perspective = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
function redimensionner(): void {
  rendu.setSize(window.innerWidth, window.innerHeight, false);
}
window.addEventListener("resize", redimensionner);

/** Les angles de la grille : [lacet, élévation, distance] ; le dernier est la vue du jeu, resserrée. */
const ANGLES: [string, number, number, number][] = [
  ["trois-quarts avant", 0.7, 0.35, 1],
  ["trois-quarts arrière", Math.PI + 0.8, 0.4, 1],
  ["profil", 0, 0.1, 1],
  ["de haut (jeu)", Math.PI / 4, Math.atan(1 / Math.SQRT2), 1.3],
];

function dessiner(): void {
  const l = window.innerWidth;
  const h = window.innerHeight;
  rendu.setScissorTest(true);
  if (etat.jeu) {
    // La vue du jeu : orthographique, élévation isométrique, 20 m de large, centrée entre les épaves.
    rendu.setViewport(0, 0, l, h);
    rendu.setScissor(0, 0, l, h);
    const demi = 10;
    ortho.left = -demi;
    ortho.right = demi;
    ortho.top = demi * (h / l);
    ortho.bottom = -demi * (h / l);
    ortho.updateProjectionMatrix();
    const lacet = Math.PI / 4 + (etat.quart * Math.PI) / 2;
    const el = Math.atan(1 / Math.SQRT2);
    const cible = new THREE.Vector3(etat.quart % 2 === 0 ? 6 : 12, 0, 0);
    ortho.position.set(cible.x + Math.sin(lacet) * Math.cos(el) * 60, Math.sin(el) * 60, cible.z + Math.cos(lacet) * Math.cos(el) * 60);
    ortho.lookAt(cible);
    rendu.render(scene, ortho);
  } else {
    const seul = etat.seul;
    const cl = seul === null ? l / ANGLES.length : l;
    const ch = seul === null ? (h - 60) / vues.length : h;
    vues.forEach((v, i) => {
      ANGLES.forEach(([, lacet, el, recul], j) => {
        if (seul !== null && (i !== seul || j !== etat.angle)) return;
        const x = seul === null ? j * cl : 0;
        const y = seul === null ? h - 60 - (i + 1) * ch : 0;
        rendu.setViewport(x, y, cl, ch);
        rendu.setScissor(x, y, cl, ch);
        perspective.aspect = cl / ch;
        perspective.updateProjectionMatrix();
        const camion = v.donnees.type === "epave_camion";
        const d = (camion ? 17 : 10) * recul * (seul === null ? 1 : 0.75);
        const cible = new THREE.Vector3(v.objet.position.x, camion ? 1.3 : 0.6, v.objet.position.z);
        perspective.position.set(cible.x + Math.sin(lacet) * Math.cos(el) * d, cible.y + Math.sin(el) * d, cible.z + Math.cos(lacet) * Math.cos(el) * d);
        perspective.lookAt(cible);
        rendu.render(scene, perspective);
      });
    });
  }
  rendu.setScissorTest(false);
}

const barre = document.getElementById("barre")!;
barre.innerHTML = `<b>Véhicules</b> · colonnes : ${ANGLES.map((a) => a[0]).join(", ")}<br/>`;
const infos = document.createElement("div");
const bouton = (nom: string, action: () => void) => {
  const b = document.createElement("button");
  b.textContent = nom;
  b.onclick = action;
  barre.append(b);
};
bouton("grille / vue du jeu", () => (etat.jeu = !etat.jeu));
bouton("tourner (jeu)", () => (etat.quart = (etat.quart + 1) % 4));
bouton("fouillé / intact", () => {
  etat.fouille = !etat.fouille;
  peupler();
});
bouton("autres tirages", () => {
  etat.ids = etat.ids.map((id) => id + 3);
  peupler();
});
barre.append(infos);

peupler();
redimensionner();
const boucle = () => {
  requestAnimationFrame(boucle);
  dessiner();
};
requestAnimationFrame(boucle);
