// La planche des personnages (développement, Book 21 §5.4.1) : Nadia, Malik, Rose et des Éteints côte à côte,
// sous une lumière franche, avec leurs animations, les vues face, profil, dos, et le test de silhouette en aplat noir.

import * as THREE from "three";
import type { EteintVu } from "../../commun/src/eteints.ts";
import type { Famille } from "../../commun/src/regles.ts";
import { chargerHumanoides } from "./rendu/humanoides.ts";
import { VueEteint } from "./rendu/eteint.ts";
import { Personnage, type GesteAction } from "./rendu/personnage.ts";
import { Compteur } from "./rendu/compteur.ts";

const canvas = document.getElementById("vue") as HTMLCanvasElement;
const rendu = new THREE.WebGLRenderer({ canvas, antialias: true });
rendu.setPixelRatio(Math.min(window.devicePixelRatio, 2));
rendu.outputColorSpace = THREE.SRGBColorSpace;
rendu.toneMapping = THREE.ACESFilmicToneMapping;
rendu.shadowMap.enabled = true;
const scene = new THREE.Scene();
const FOND = new THREE.Color(0x9fb2c2);
scene.background = FOND;
scene.add(new THREE.HemisphereLight(0xdfe8f0, 0x4d5a3a, 1.2));
const soleil = new THREE.DirectionalLight(0xffdcae, 2.6);
soleil.position.set(4, 8, 6);
soleil.castShadow = true;
soleil.shadow.mapSize.set(2048, 2048);
Object.assign(soleil.shadow.camera, { left: -8, right: 8, top: 6, bottom: -2 });
scene.add(soleil);
const sol = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), new THREE.MeshStandardMaterial({ color: 0x7fa35a, roughness: 1 }));
sol.rotation.x = -Math.PI / 2;
sol.receiveShadow = true;
scene.add(sol);
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

// ---------- Les personnages ----------

const FAMILLES: [Famille, string][] = [
  ["charbonniers", "🔥 Nadia, Charbonnière"],
  ["voltaiques", "⚡ Malik, Voltaïque"],
  ["mecanistes", "⚙️ Rose, Mécaniste"],
];
const ECART = 1.6;
const survivants = FAMILLES.map(([f], i) => {
  const p = new Personnage(f);
  p.objet.position.x = (i - 2) * ECART;
  scene.add(p.objet);
  return p;
});
// personnages.html#variantes : les variantes d'Éteints de la Coopérative (Book 23 §3), à côté d'un Errant.
const VARIANTES = location.hash.includes("variantes");
const LISTE_VARIANTES: [EteintVu["variante"], string][] = [
  [undefined, "Errant"],
  ["equipe", "Équipé (casque)"],
  ["rampant", "Rampant"],
  ["magasinier", "Magasinier"],
  ["mecanicien", "Mécanicien"],
  // 0.10 (chantier G) : ceux de la côte.
  ["noye", "Noyé"],
  ["ensable", "Ensablé"],
];
const eteints = VARIANTES
  ? LISTE_VARIANTES.map(([variante], i) => {
      const e: EteintVu = { id: 3 + i * 5, x: (i - (LISTE_VARIANTES.length - 1) / 2) * ECART, z: 0, o: 0, etat: "errant", ...(variante ? { variante } : {}) };
      const v = new VueEteint(e);
      scene.add(v.objet);
      return { v, e };
    })
  : [3, 8].map((id, i) => {
      const e: EteintVu = { id, x: (i + 1) * ECART, z: 0, o: 0, etat: "errant" };
      const v = new VueEteint(e);
      scene.add(v.objet);
      return { v, e };
    });
const compteurs = [new Compteur(-3 * ECART, 0, 0, true, "femme"), new Compteur(-4 * ECART, 0, 0, false, "homme")];
for (const c of compteurs) scene.add(c.objet);
if (VARIANTES) for (const o of [...survivants, ...compteurs]) o.objet.visible = false;
document.getElementById("legende")!.innerHTML = (VARIANTES ? LISTE_VARIANTES.map(([, n]) => n) : [...FAMILLES.map(([, n]) => n), "Éteint", "Éteinte"]).map((n) => `<span>${n}</span>`).join("");

// ---------- Les réglages ----------

type Pose = "repos" | "accroupi" | "marche" | "course" | "frappe" | "frappe appuyée" | "roulade" | "combat" | "dormir" | "effondrement" | GesteAction;
const POSES: Pose[] = ["repos", "accroupi", "marche", "course", "combat", "frappe", "frappe appuyée", "roulade", "ramasser", "fouiller", "bricoler", "marteler", "manger", "pedaler", "dormir", "effondrement"];
type PoseEteint = "dormant" | "réveil" | "errant" | "poursuivant" | "saisie" | "touché" | "à terre";
const POSES_ETEINTS: PoseEteint[] = ["dormant", "réveil", "errant", "poursuivant", "saisie", "touché", "à terre"];
type Vue = "trois-quarts" | "face" | "profil" | "dos" | "jeu";
const VUES: Vue[] = ["trois-quarts", "face", "profil", "dos", "jeu"];

const etat = { pose: "repos" as Pose, poseEteint: "errant" as PoseEteint, vue: "trois-quarts" as Vue, silhouette: false };

function vitesseDe(p: Pose): number {
  return p === "accroupi" ? 1.2 : p === "marche" ? 2.4 : p === "course" ? 4.6 : 0;
}

function appliquerPose(): void {
  for (const p of survivants) {
    p.coucher(etat.pose === "dormir");
    p.effondrer(etat.pose === "effondrement");
    p.tenir(["combat", "frappe", "frappe appuyée"].includes(etat.pose) ? "hache" : undefined);
    const gestes: GesteAction[] = ["ramasser", "fouiller", "bricoler", "marteler", "manger", "pedaler", "cueillir", "interagir"];
    p.agir(gestes.includes(etat.pose as GesteAction) ? (etat.pose as GesteAction) : null);
  }
}

function appliquerPoseEteints(): void {
  for (const { v, e } of eteints) {
    const p = etat.poseEteint;
    e.saisit = undefined;
    if (p === "dormant") e.etat = "dormant";
    else if (p === "réveil") {
      // On le couche, puis on le réveille : il se relève.
      e.etat = "dormant";
      v.maj({ ...e });
      v.animer(0.016);
      e.etat = "attire";
    } else if (p === "errant") e.etat = "errant";
    else if (p === "poursuivant") e.etat = "poursuivant";
    else if (p === "saisie") {
      e.etat = "poursuivant";
      e.saisit = true;
    } else if (p === "touché") {
      e.etat = "poursuivant";
      v.maj({ ...e });
      v.toucher();
    } else e.etat = "a_terre";
    v.maj({ ...e });
  }
}

function placerCamera(): void {
  const cible = new THREE.Vector3(0, 0.95, 0);
  const d = 9.5;
  const angles: Record<Vue, [number, number]> = { "trois-quarts": [0.45, 0.12], face: [0, 0.05], profil: [Math.PI / 2, 0.05], dos: [Math.PI, 0.05], jeu: [Math.PI / 4, Math.atan(1 / Math.SQRT2)] };
  const [lacet, haut] = angles[etat.vue];
  camera.position.set(Math.sin(lacet) * Math.cos(haut) * d, cible.y + Math.sin(haut) * d, Math.cos(lacet) * Math.cos(haut) * d);
  camera.lookAt(cible);
}

function silhouette(oui: boolean): void {
  scene.background = oui ? new THREE.Color(0xffffff) : FOND;
  scene.overrideMaterial = oui ? new THREE.MeshBasicMaterial({ color: 0x000000 }) : null;
  sol.visible = !oui;
}

const barre = document.getElementById("barre")!;
function groupe<T extends string>(titre: string, valeurs: T[], actuelle: () => T, choisir: (v: T) => void): void {
  const g = document.createElement("div");
  g.className = "groupe";
  g.innerHTML = `<span>${titre}</span>`;
  for (const v of valeurs) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = v;
    b.addEventListener("click", () => {
      choisir(v);
      for (const x of g.querySelectorAll("button")) x.classList.toggle("actif", x.textContent === actuelle());
    });
    if (v === actuelle()) b.classList.add("actif");
    g.append(b);
  }
  barre.append(g);
}
barre.innerHTML = "<strong>Planche des personnages</strong>";
groupe("Survivants", POSES, () => etat.pose, (v) => {
  etat.pose = v;
  appliquerPose();
  if (v === "frappe" || v === "frappe appuyée") for (const p of survivants) p.frapper(v === "frappe appuyée");
  if (v === "roulade") for (const p of survivants) p.esquiver();
});
groupe("Éteints", POSES_ETEINTS, () => etat.poseEteint, (v) => {
  etat.poseEteint = v;
  appliquerPoseEteints();
});
groupe("Vue", VUES, () => etat.vue, (v) => {
  etat.vue = v;
  placerCamera();
});
groupe("Test", ["silhouette"], () => (etat.silhouette ? "silhouette" : ""), () => {
  etat.silhouette = !etat.silhouette;
  silhouette(etat.silhouette);
});

function redimensionner(): void {
  const l = window.innerWidth;
  const h = window.innerHeight;
  rendu.setSize(l, h, false);
  camera.aspect = l / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", redimensionner);
redimensionner();
placerCamera();

// ---------- La boucle ----------

let dernier = performance.now();
function boucle(t: number): void {
  requestAnimationFrame(boucle);
  const dt = Math.min(0.05, (t - dernier) / 1000);
  dernier = t;
  for (const p of survivants) p.animer(dt, vitesseDe(etat.pose));
  const marche = etat.poseEteint === "errant" ? 0.9 : etat.poseEteint === "poursuivant" || etat.poseEteint === "réveil" ? 1.55 : 0;
  for (const { v } of eteints) v.animer(dt, marche);
  for (const c of compteurs) c.animer(dt);
  rendu.render(scene, camera);
}

void chargerHumanoides().then(() => {
  appliquerPose();
  appliquerPoseEteints();
  requestAnimationFrame(boucle);
});

// Pour les captures automatiques : une image tout de suite, après avoir avancé l'animation de `secondes`.
Object.assign(window, {
  __planche: {
    image(secondes = 0) {
      const pas = 1 / 30;
      for (let s = 0; s < secondes; s += pas) {
        for (const p of survivants) p.animer(pas, vitesseDe(etat.pose));
        for (const { v } of eteints) v.animer(pas, etat.poseEteint === "errant" ? 0.9 : etat.poseEteint === "poursuivant" ? 1.55 : 0);
      }
      rendu.render(scene, camera);
    },
    etat,
    camera,
    /** Cadrer de près (captures) : la caméra en (x, y, z), qui regarde (tx, ty, tz). */
    regarder(x: number, y: number, z: number, tx: number, ty: number, tz: number) {
      camera.position.set(x, y, z);
      camera.lookAt(tx, ty, tz);
    },
    /** Masquer la barre des réglages (captures). */
    nue() {
      barre.style.display = "none";
    },
    scene,
    survivants,
    eteints,
  },
});
