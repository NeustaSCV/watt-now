// La planche des bâtiments (développement) : la halte de la station-service, la ruine du terrain et le Comptoir,
// vus comme en jeu (caméra orthographique de haut, depuis le sud-est) ou de près, avec un personnage qu'on place
// sous l'auvent, dans la boutique, devant l'atelier… pour vérifier que les toits s'effacent bien.
// Ouvrir /batiments.html avec le serveur de développement.

import * as THREE from "three";
import { genererHalte } from "../../commun/src/halte.ts";
import { genererVestiges } from "../../commun/src/terrain.ts";
import { COMPTOIR, STATION } from "../../commun/src/lieux.ts";
import { RUINE } from "../../commun/src/terrain.ts";
import { animerComptoir, creerComptoir } from "./rendu/comptoir.ts";
import { creerHalte, estomperToits } from "./rendu/halte.ts";
import { chargerHumanoides } from "./rendu/humanoides.ts";
import { PALETTE } from "./rendu/materiaux.ts";
import { Personnage } from "./rendu/personnage.ts";
import { VueRessource } from "./rendu/ressources.ts";
import { creerRuine } from "./rendu/ruine.ts";
import { creerTerrain } from "./rendu/terrain.ts";

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
scene.fog = new THREE.Fog(PALETTE.brume, 80, 135);
scene.add(new THREE.HemisphereLight(0xdfe8f0, 0x4d5a3a, 1.15));
const soleil = new THREE.DirectionalLight(0xffdcae, 2.6);
soleil.castShadow = true;
soleil.shadow.mapSize.set(2048, 2048);
Object.assign(soleil.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 90 });
soleil.shadow.bias = -0.0006;
soleil.shadow.normalBias = 0.03;
scene.add(soleil, soleil.target);

type Lieu = "station" | "terrain" | "comptoir";
const decors: Record<Lieu, THREE.Group> = { station: new THREE.Group(), terrain: new THREE.Group(), comptoir: new THREE.Group() };
decors.station.add(creerHalte());
for (const r of genererHalte()) decors.station.add(new VueRessource({ ...r, disponible: true } as never).objet);
decors.terrain.add(creerTerrain(), creerRuine());
for (const r of genererVestiges(1)) decors.terrain.add(new VueRessource({ ...r, disponible: true } as never).objet);
decors.comptoir.add(creerComptoir());
for (const g of Object.values(decors)) scene.add(g);

/** Les points à regarder : là où l'on pose le personnage. */
const POINTS: Record<string, { lieu: Lieu; x: number; z: number }> = {
  "route devant la station": { lieu: "station", x: 104, z: 32 },
  "sous l'auvent": { lieu: "station", x: 101, z: 24.5 },
  "devant la boutique": { lieu: "station", x: 104.1, z: 19.5 },
  "dans la boutique": { lieu: "station", x: 104, z: 14.6 },
  "derrière la caisse": { lieu: "station", x: 100.6, z: 13 },
  "devant l'atelier": { lieu: "station", x: 115.5, z: 19.5 },
  "la grange": { lieu: "station", x: 40, z: 23 },
  "la ruine": { lieu: "terrain", x: RUINE.x, z: RUINE.z + 4.5 },
  "le guichet": { lieu: "comptoir", x: COMPTOIR.guichet.x, z: COMPTOIR.guichet.z + 2 },
  "les cellules": { lieu: "comptoir", x: COMPTOIR.cellules.x, z: COMPTOIR.cellules.z + 4 },
};
void STATION;

const etat = { point: "devant la boutique", vue: "jeu" as "jeu" | "large" | "pres", quart: 0, orbite: Math.PI / 4, hauteur: 0.55, x: 0, z: 0 };

let personnage: Personnage | null = null;
const camOrtho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
const camPersp = new THREE.PerspectiveCamera(35, 1, 0.1, 300);
const ELEVATION = Math.atan(1 / Math.SQRT2);

function placer(nom: string): void {
  etat.point = nom;
  const p = POINTS[nom]!;
  etat.x = p.x;
  etat.z = p.z;
  for (const [l, g] of Object.entries(decors)) g.visible = l === p.lieu;
  if (personnage) {
    personnage.objet.position.set(p.x, 0, p.z);
    decors[p.lieu].add(personnage.objet);
  }
  majBarre();
}

function redimensionner(): void {
  rendu.setSize(window.innerWidth, window.innerHeight, false);
}
window.addEventListener("resize", redimensionner);

function cadrer(): THREE.Camera {
  const aspect = window.innerWidth / window.innerHeight;
  const cible = new THREE.Vector3(etat.x, 0, etat.z);
  soleil.position.set(cible.x + 12, 30, cible.z - 18);
  soleil.target.position.copy(cible);
  if (etat.vue === "pres") {
    camPersp.aspect = aspect;
    camPersp.updateProjectionMatrix();
    const d = 16;
    camPersp.position.set(cible.x + Math.cos(etat.orbite) * d * Math.cos(etat.hauteur), Math.sin(etat.hauteur) * d + 1, cible.z + Math.sin(etat.orbite) * d * Math.cos(etat.hauteur));
    camPersp.lookAt(cible.x, 1.2, cible.z);
    return camPersp;
  }
  const lacet = Math.PI / 4 + (etat.quart * Math.PI) / 2;
  const demiLargeur = 10 * (etat.vue === "large" ? 1.7 : 1) * (aspect < 1 ? 0.75 : 1);
  camOrtho.left = -demiLargeur;
  camOrtho.right = demiLargeur;
  camOrtho.top = demiLargeur / aspect;
  camOrtho.bottom = -demiLargeur / aspect;
  camOrtho.updateProjectionMatrix();
  const h = Math.cos(ELEVATION) * 60;
  camOrtho.position.set(cible.x + Math.cos(lacet) * h, Math.sin(ELEVATION) * 60, cible.z + Math.sin(lacet) * h);
  camOrtho.lookAt(cible);
  return camOrtho;
}

const barre = document.getElementById("barre")!;
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
function majBarre(): void {
  barre.innerHTML = "<b>Bâtiments</b> · ";
  for (const nom of Object.keys(POINTS)) barre.append(bouton(nom, nom === etat.point, () => placer(nom)));
  barre.append(document.createElement("br"));
  for (const [v, t] of [["jeu", "vue de jeu"], ["large", "vue large"], ["pres", "de près"]] as const) barre.append(bouton(t, etat.vue === v, () => (etat.vue = v)));
  barre.append(bouton("↺ quart de tour", false, () => (etat.quart = (etat.quart + 1) % 4)));
  barre.append(bouton("orbite ←", false, () => (etat.orbite -= 0.4)));
  barre.append(bouton("orbite →", false, () => (etat.orbite += 0.4)));
  barre.append(bouton("plus haut", false, () => (etat.hauteur = Math.min(1.5, etat.hauteur + 0.2))));
  barre.append(bouton("plus bas", false, () => (etat.hauteur = Math.max(0.05, etat.hauteur - 0.2))));
}

// Pour piloter la planche depuis la console : planche.placer("dans la boutique"), planche.etat.vue = "pres"…
(window as unknown as { planche: unknown }).planche = { placer, etat, POINTS, scene, rendu, perso: () => personnage, voir: (x: number, z: number) => { etat.x = x; etat.z = z; }, aller: (x: number, z: number) => { etat.x = x; etat.z = z; personnage?.objet.position.set(x, 0, z); } };

void chargerHumanoides().then(() => {
  personnage = new Personnage("mecanistes");
  personnage.objet.rotation.y = 0.6;
  placer(etat.point);
  redimensionner();
  let dernier = performance.now();
  const boucle = (t: number) => {
    requestAnimationFrame(boucle);
    const dt = Math.min(0.05, (t - dernier) / 1000);
    dernier = t;
    personnage?.animer(dt, 0);
    animerComptoir(dt);
    if (POINTS[etat.point]!.lieu === "station") estomperToits(decors.station, personnage!.objet.position.x, personnage!.objet.position.z, dt, Math.PI / 4 + (etat.quart * Math.PI) / 2);
    rendu.render(scene, cadrer());
  };
  requestAnimationFrame(boucle);
});
