// La planche des coiffures (développement) : chaque famille, en silhouette féminine et masculine, avec les six
// coupes, vues de près. Pour vérifier que les cheveux tiennent sur le crâne et sous les chapeaux de famille.
// Ouvrir /coiffures.html avec le serveur de développement.

import * as THREE from "three";
import { APPARENCES_DE_REFERENCE, COIFFURES, NOMS_COIFFURES, type Apparence } from "../../commun/src/apparence.ts";
import type { Famille } from "../../commun/src/regles.ts";
import { chargerHumanoides } from "./rendu/humanoides.ts";
import { Personnage } from "./rendu/personnage.ts";

const canvas = document.getElementById("vue") as HTMLCanvasElement;
const rendu = new THREE.WebGLRenderer({ canvas, antialias: true });
rendu.setPixelRatio(Math.min(window.devicePixelRatio, 2));
rendu.outputColorSpace = THREE.SRGBColorSpace;
rendu.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fb2c2);
scene.add(new THREE.HemisphereLight(0xdfe8f0, 0x4d5a3a, 1.3));
const soleil = new THREE.DirectionalLight(0xffdcae, 2.4);
soleil.position.set(3, 6, 8);
scene.add(soleil);

const FAMILLES: Famille[] = ["charbonniers", "voltaiques", "mecanistes"];
const lignes: { famille: Famille; silhouette: Apparence["silhouette"] }[] = [];
for (const famille of FAMILLES) for (const silhouette of ["feminine", "masculine"] as const) lignes.push({ famille, silhouette });

const personnages: Personnage[] = [];
const etat = { vue: 0.5, couleur: 1 };

function peupler(): void {
  for (const p of personnages) scene.remove(p.objet);
  personnages.length = 0;
  lignes.forEach((l, i) => {
    COIFFURES.forEach((coiffure, j) => {
      const a: Apparence = { ...APPARENCES_DE_REFERENCE[l.famille], silhouette: l.silhouette, coiffure, cheveux: etat.couleur, taille: 0.5, barbe: false };
      const p = new Personnage(l.famille, a);
      // Chacun loin des autres : chaque case a sa caméra, cadrée sur sa tête.
      p.objet.position.set((i * COIFFURES.length + j) * 4, 0, 0);
      p.objet.rotation.y = 0;
      scene.add(p.objet);
      personnages.push(p);
    });
  });
}

const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 50);
function redimensionner(): void {
  rendu.setSize(window.innerWidth, window.innerHeight, false);
}
window.addEventListener("resize", redimensionner);

/** Une case par personnage : la vue resserrée sur sa tête et ses épaules. */
function dessiner(): void {
  const l = window.innerWidth;
  const h = window.innerHeight - 70;
  const cl = l / COIFFURES.length;
  const ch = h / lignes.length;
  rendu.setScissorTest(true);
  personnages.forEach((p, k) => {
    const i = Math.floor(k / COIFFURES.length);
    const j = k % COIFFURES.length;
    const x = j * cl;
    const y = h - (i + 1) * ch;
    rendu.setViewport(x, y, cl, ch);
    rendu.setScissor(x, y, cl, ch);
    camera.aspect = cl / ch;
    camera.updateProjectionMatrix();
    const tete = new THREE.Vector3(p.objet.position.x, 1.66, 0);
    camera.position.set(tete.x + Math.sin(etat.vue) * 1.15, tete.y + 0.12, Math.cos(etat.vue) * 1.15);
    camera.lookAt(tete);
    rendu.render(scene, camera);
  });
  rendu.setScissorTest(false);
}

const barre = document.getElementById("barre")!;
barre.innerHTML = `<b>Coiffures</b> · colonnes : ${COIFFURES.map((c) => NOMS_COIFFURES[c]).join(", ")} · lignes : ${lignes.map((l) => `${l.famille} ${l.silhouette === "feminine" ? "F" : "M"}`).join(", ")}<br/>`;
for (const [nom, angle] of [["face", 0], ["trois-quarts", 0.5], ["profil", Math.PI / 2], ["dos", Math.PI]] as const) {
  const b = document.createElement("button");
  b.textContent = nom;
  b.onclick = () => {
    etat.vue = angle;
    void angle;
  };
  barre.append(b);
}
for (const [nom, c] of [["noirs", 0], ["bruns", 1], ["roux", 3], ["blonds", 4], ["gris", 5]] as const) {
  const b = document.createElement("button");
  b.textContent = nom;
  b.onclick = () => {
    etat.couleur = c;
    peupler();
  };
  barre.append(b);
}

void chargerHumanoides().then(() => {
  peupler();
  redimensionner();
  let dernier = performance.now();
  const boucle = (t: number) => {
    requestAnimationFrame(boucle);
    const dt = Math.min(0.05, (t - dernier) / 1000);
    dernier = t;
    for (const p of personnages) p.animer(dt, 0);
    dessiner();
  };
  requestAnimationFrame(boucle);
});
