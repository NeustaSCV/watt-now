// La planche des objets (développement, Book 21 §5.4.1) : toutes les installations avec leurs états, le feu de camp et
// le foyer Dakota, leurs fantômes de pose, les armes en main et les ressources du terrain et de la halte, de jour et de
// nuit. Chaque objet affiche ses triangles et ses appels de dessin (comme en jeu : fondus, ou en lots).
// Ouvrir /objets.html avec le serveur de développement. Raccourcis : objets.html#vue=feux&nuit (vue : installations,
// feux, armes, ressources, station ; « jeu » : la caméra du jeu, orthographique, 20 m de large).

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { FeuVu, InstallationVue } from "../../commun/src/messages.ts";
import type { TypeObjet } from "../../commun/src/objets.ts";
import type { RessourceSol, TypeRessource } from "../../commun/src/terrain.ts";
import { fantomeFeu } from "./pose.ts";
import { Ciel } from "./rendu/ciel.ts";
import { FeuDeCamp } from "./rendu/feu.ts";
import { fusionnerStatique } from "./rendu/fusion.ts";
import { chargerHumanoides } from "./rendu/humanoides.ts";
import { VueInstallation } from "./rendu/installations.ts";
import { ReserveLumieres, type SourceLumiere } from "./rendu/lumieres.ts";
import { PALETTE } from "./rendu/materiaux.ts";
import { Personnage, creerArme } from "./rendu/personnage.ts";
import { VueRessource } from "./rendu/ressources.ts";

const parametres = new URLSearchParams(location.hash.slice(1));
const canvas = document.getElementById("vue") as HTMLCanvasElement;
const rendu = new THREE.WebGLRenderer({ canvas, antialias: true });
rendu.setPixelRatio(Math.min(window.devicePixelRatio, 2));
rendu.outputColorSpace = THREE.SRGBColorSpace;
rendu.toneMapping = THREE.ACESFilmicToneMapping;
rendu.shadowMap.enabled = true;
rendu.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color(PALETTE.ciel);
const hemi = new THREE.HemisphereLight(0xdfe8f0, 0x4d5a3a, 1.15);
const astre = new THREE.DirectionalLight(0xffdcae, 2.6);
astre.castShadow = true;
astre.shadow.mapSize.set(2048, 2048);
Object.assign(astre.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 120 });
astre.shadow.bias = -0.0006;
astre.shadow.normalBias = 0.03;
scene.add(hemi, astre, astre.target);
const ciel = new Ciel(scene, rendu, hemi, astre);
// Pour inspecter depuis la console du navigateur.
Object.assign(window, { scene, rendu, THREE });
// La réserve de lumières du jeu sur ordinateur (Book 21 §5.3.3) : 8 lumières, attribuées aux sources les plus proches.
const reserve = new ReserveLumieres(scene, 8);

const herbe = new THREE.Mesh(new THREE.PlaneGeometry(160, 120).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: PALETTE.herbe, roughness: 1 }));
herbe.position.set(20, 0, 15);
herbe.receiveShadow = true;
scene.add(herbe);

type Section = "installations" | "feux" | "armes" | "ressources" | "station";
interface Article {
  nom: string;
  section: Section;
  objet: THREE.Object3D;
  /** Hauteur de l'étiquette. */
  haut: number;
  /** Dessiné en lot en jeu (InstancedMesh) : un appel pour toutes les ressources de ce type. */
  enLot?: boolean;
  /** Ce qu'on mesure (par défaut, l'objet) : pour une arme, l'arme seule, pas le personnage. */
  mesure?: THREE.Object3D;
  /** Pas dans le tableau des mesures (le porteur d'une arme). */
  sansMesure?: boolean;
}
const articles: Article[] = [];
const animations: ((dt: number, nuit: number) => void)[] = [];
const sources: (() => SourceLumiere | null)[] = [];

// ---------- Les installations ----------

const INSTALLATIONS: [string, InstallationVue["type"], InstallationVue["etat"]][] = [
  ["établi", "etabli", {}],
  ["abri", "abri", {}],
  ["coffre", "coffre", {}],
  ["charbonnière (cuit)", "charbonniere", { pretLe: Date.now() + 1e9 }],
  ["forge", "forge", {}],
  ["pédalier nu", "pedalier", {}],
  ["pédalier + meule + dynamo", "pedalier", { meule: true, dynamo: true }],
  ["banc vide", "banc_recharge", {}],
  ["banc + batteries", "banc_recharge", { batteries: { batterie_voiture: 0.6, petite_batterie: 0.3 } }],
  ["panneau solaire", "panneau_solaire", {}],
  ["escabeau", "escabeau", {}],
  ["récupérateur vide", "recuperateur_pluie", { litres: 0 }],
  ["récupérateur ½", "recuperateur_pluie", { litres: 2.5 }],
  ["récupérateur plein", "recuperateur_pluie", { litres: 5 }],
  ["alarme à boîtes", "alarme_boites", {}],
  ["lit de branchages", "lit_branchages", {}],
  ["décharge : 5 trouvailles", "decharge", { contenu: { conserve: 5 } }],
  ["décharge : 12 trouvailles", "decharge", { contenu: { conserve: 12 } }],
];
INSTALLATIONS.forEach(([nom, type, etat], i) => {
  const x = i >= 16 ? 2 + (i - 16) * 6 : (i % 8) * 4;
  const z = i >= 16 ? -6 : Math.floor(i / 8) * 4.5;
  const v = new VueInstallation({ id: i + 1, type, x, z, o: 0, etat });
  scene.add(v.objet);
  const enMarche = type === "pedalier" && etat.meule === true;
  animations.push((dt, nuit) => v.animer(dt, Date.now(), nuit, enMarche));
  articles.push({ nom, section: "installations", objet: v.objet, haut: type === "charbonniere" ? 1.4 : 1.7 });
});

// ---------- Les feux et leurs fantômes ----------

const FEUX: [string, Partial<FeuVu>][] = [
  ["feu : flammes", { aspect: "flammes", bois: 4 }],
  ["feu : peu de bois", { aspect: "flammes", bois: 1 }],
  ["feu : braises", { aspect: "braises", bois: 2 }],
  ["feu : cendres", { aspect: "cendres", bois: 0 }],
  ["feu : éteint (bois empilé)", { aspect: "eteint", bois: 3 }],
  ["Dakota : flammes", { aspect: "flammes", bois: 3, dakota: true }],
  ["Dakota : braises", { aspect: "braises", bois: 1, dakota: true }],
  ["Dakota : éteint", { aspect: "eteint", bois: 2, dakota: true }],
];
FEUX.forEach(([nom, f], i) => {
  const feu = new FeuDeCamp({ id: 100 + i, x: i * 3, z: 11, bois: 0, aspect: "eteint", ...f });
  scene.add(feu.objet);
  animations.push((dt, nuit) => feu.animer(dt, nuit));
  sources.push(() => feu.source());
  articles.push({ nom, section: "feux", objet: feu.objet, haut: 1.2 });
});
/** Le fantôme de pose, traité comme dans ModePose.demarrer (transparent, sans ombre). */
function enFantome(o: THREE.Object3D): THREE.Object3D {
  o.traverse((n) => {
    const m = n as THREE.Mesh;
    if (!m.isMesh) return;
    const mat = (m.material as THREE.Material).clone();
    mat.transparent = true;
    mat.opacity = 0.55;
    mat.depthWrite = false;
    m.material = mat;
    m.castShadow = false;
  });
  return o;
}
for (const [i, dakota] of [false, true].entries()) {
  const g = enFantome(fantomeFeu(dakota));
  g.position.set((8 + i) * 3, 0, 11);
  scene.add(g);
  articles.push({ nom: dakota ? "fantôme Dakota" : "fantôme feu", section: "feux", objet: g, haut: 0.8 });
}

// ---------- Les niveaux (Book 24) : chaque niveau a son modèle ----------

const NIVEAUX_FEU: [string, Partial<FeuVu>][] = [
  ["foyer de pierres : flammes", { niveau: 2, aspect: "flammes", bois: 5 }],
  ["foyer de pierres : couvert", { niveau: 2, aspect: "braises", bois: 5, couvert: true }],
  ["foyer de cuisine : flammes", { niveau: 3, aspect: "flammes", bois: 5 }],
  ["foyer de cuisine + broche + marmite", { niveau: 3, aspect: "eteint", bois: 3, accessoires: ["broche", "marmite"] }],
  ["feu de camp + broche", { aspect: "flammes", bois: 4, accessoires: ["broche"] }],
  ["poêle-fusée : flammes", { dakota: true, niveau: 2, aspect: "flammes", bois: 3 }],
  ["poêle-fusée : éteint", { dakota: true, niveau: 2, aspect: "eteint", bois: 2 }],
];
NIVEAUX_FEU.forEach(([nom, f], i) => {
  const feu = new FeuDeCamp({ id: 200 + i, x: i * 3.5, z: 16, bois: 0, aspect: "eteint", ...f });
  scene.add(feu.objet);
  animations.push((dt, nuit) => feu.animer(dt, nuit));
  sources.push(() => feu.source());
  articles.push({ nom, section: "feux", objet: feu.objet, haut: f.niveau === 3 ? 1.8 : 1.2 });
});
const NIVEAUX_INSTALLATIONS: [string, InstallationVue["type"], number, InstallationVue["etat"]][] = [
  ["abri garni", "abri", 2, {}],
  ["abri fermé", "abri", 3, {}],
  ["citerne de bâche", "recuperateur_pluie", 2, { litres: 30 }],
  ["coffre cerclé", "coffre", 2, {}],
  ["réserve couverte", "coffre", 3, {}],
];
NIVEAUX_INSTALLATIONS.forEach(([nom, type, niveau, etat], i) => {
  const v = new VueInstallation({ id: 300 + i, type, x: i * 4, z: 21, o: 0, etat, niveau });
  scene.add(v.objet);
  animations.push((dt, nuit) => v.animer(dt, Date.now(), nuit, false));
  articles.push({ nom, section: "installations", objet: v.objet, haut: 1.7 });
});

// ---------- Les armes en main ----------

const ARMES: TypeObjet[] = ["hache", "marteau", "barre_metal", "couteau", "lame_forgee", "gourdin", "epieu"];
const etatArmes = { pose: "repos" as "repos" | "garde" | "frappe", attente: 0 };
const porteurs: Personnage[] = [];
void chargerHumanoides().then(() => {
  ARMES.forEach((arme, i) => {
    const p = new Personnage((["charbonniers", "voltaiques", "mecanistes"] as const)[i % 3]);
    p.objet.position.set(i * 1.6, 0, 17);
    p.tenir(arme);
    scene.add(p.objet);
    porteurs.push(p);
    articles.push({ nom: `porteur ${arme}`, section: "armes", objet: p.objet, haut: 1.9, sansMesure: true });
    // L'arme seule, posée à plat devant le porteur : pour la regarder de près et la mesurer.
    const seule = creerArme(arme);
    if (seule) {
      seule.rotation.set(0, -Math.PI / 2, 0);
      seule.position.set(i * 1.6, 0.05, 18.4);
      scene.add(seule);
      articles.push({ nom: `arme ${arme}`, section: "armes", objet: seule, haut: 0.2, mesure: seule });
    }
  });
  const pose = parametres.get("pose");
  if (pose === "garde" || pose === "frappe") etatArmes.pose = pose;
  for (const p of porteurs) p.preparer(etatArmes.pose === "garde" ? 1 : 0);
  mesurer();
});

// ---------- Les ressources ----------

const TERRAIN: TypeRessource[] = ["branche", "buche", "pierre", "pierre", "buisson", "joncs", "cepe", "amanite_tue_mouches", "amanite_phalloide", "velo", "caisse_outils", "batterie_voiture", "ressort", "bache", "barre_metal"];
const EN_LOTS = new Set<TypeRessource>(["branche", "buche", "pierre"]);
TERRAIN.forEach((type, i) => {
  const r: RessourceSol = { id: 200 + i, type, x: (i % 8) * 2.5, z: 23 + Math.floor(i / 8) * 3, disponible: true } as RessourceSol;
  const v = new VueRessource(r);
  // Comme en jeu : en lot pour les plus nombreuses, fondues pour les autres.
  if (!EN_LOTS.has(type)) fusionnerStatique(v.objet);
  scene.add(v.objet);
  articles.push({ nom: type, section: "ressources", objet: v.objet, haut: type === "buisson" || type === "joncs" ? 1.4 : 0.7, enLot: EN_LOTS.has(type) });
});
const STATION: [TypeRessource, number, number][] = [
  ["rayonnage", 0, 33],
  ["panneau_auvent", 3.5, 33],
  ["caisse_atelier", 7, 33],
  ["grenier", 11, 33],
  ["epave_voiture", 3, 39],
  ["epave_camion", 14, 39],
];
STATION.forEach(([type, x, z], i) => {
  const v = new VueRessource({ id: 1 + i, type, x, z, disponible: true } as RessourceSol);
  fusionnerStatique(v.objet);
  scene.add(v.objet);
  articles.push({ nom: type, section: "station", objet: v.objet, haut: type === "grenier" ? 3.4 : type === "epave_camion" ? 3.2 : 2 });
});

// ---------- Les mesures ----------

/** Triangles et appels de dessin de ce qui est visible (sprites et points comptent un appel chacun). */
function compter(o: THREE.Object3D): { triangles: number; appels: number } {
  let triangles = 0;
  let appels = 0;
  const visiter = (n: THREE.Object3D) => {
    if (!n.visible) return;
    if ((n as THREE.Mesh).isMesh) {
      const g = (n as THREE.Mesh).geometry;
      triangles += (g.index ? g.index.count : g.getAttribute("position").count) / 3;
      appels++;
    } else if ((n as THREE.Sprite).isSprite || (n as THREE.Points).isPoints) appels++;
    for (const c of n.children) visiter(c);
  };
  visiter(o);
  return { triangles: Math.round(triangles), appels };
}

const mesures = document.getElementById("mesures")!;
function mesurer(): void {
  const lignes: string[] = [];
  const parSection = new Map<Section, { t: number; a: number }>();
  for (const a of articles.filter((x) => !x.sansMesure)) {
    const { triangles, appels } = compter(a.mesure ?? a.objet);
    const s = parSection.get(a.section) ?? { t: 0, a: 0 };
    s.t += triangles;
    s.a += a.enLot ? 0 : appels;
    parSection.set(a.section, s);
    lignes.push(`<tr><td>${a.nom}</td><td>${triangles}</td><td>${a.enLot ? "lot" : appels}</td></tr>`);
  }
  const totaux = [...parSection].map(([s, v]) => `<tr><td><b>${s}</b></td><td><b>${v.t}</b></td><td><b>${v.a}</b></td></tr>`);
  mesures.innerHTML = `<table><tr><th>objet</th><th>tri.</th><th>appels</th></tr>${lignes.join("")}${totaux.join("")}</table>`;
  (window as unknown as { mesures: unknown }).mesures = articles.filter((x) => !x.sansMesure).map((a) => ({ nom: a.nom, section: a.section, ...compter(a.mesure ?? a.objet), lot: !!a.enLot }));
}
mesurer();

// ---------- Les étiquettes ----------

const calque = document.getElementById("etiquettes")!;
const etiquettes = articles.map((a) => {
  const d = document.createElement("div");
  d.className = "etiquette";
  d.textContent = a.nom;
  calque.append(d);
  return d;
});
function placerEtiquettes(camera: THREE.Camera): void {
  // Les armes arrivent après le chargement des personnages.
  while (etiquettes.length < articles.length) {
    const d = document.createElement("div");
    d.className = "etiquette";
    d.textContent = articles[etiquettes.length]!.nom;
    calque.append(d);
    etiquettes.push(d);
  }
  const p = new THREE.Vector3();
  articles.forEach((a, i) => {
    const d = etiquettes[i]!;
    a.objet.getWorldPosition(p);
    p.y += a.haut;
    p.project(camera);
    const dedans = etat.etiquettes && p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1;
    d.style.display = dedans ? "" : "none";
    if (dedans) {
      d.style.left = `${((p.x + 1) / 2) * window.innerWidth}px`;
      d.style.top = `${((1 - p.y) / 2) * window.innerHeight}px`;
    }
  });
}

// ---------- Les vues ----------

const VUES: Record<Section, { cible: [number, number, number]; distance: number }> = {
  installations: { cible: [14, 0.6, 2.2], distance: 26 },
  feux: { cible: [13.5, 0.3, 11], distance: 20 },
  armes: { cible: [4.8, 1, 17.5], distance: 9 },
  ressources: { cible: [8.75, 0.3, 24.5], distance: 15 },
  station: { cible: [8, 1, 36], distance: 26 },
};
const etat = {
  section: (parametres.get("vue") as Section | null) ?? "installations",
  jeu: parametres.has("jeu"),
  heure: parametres.has("nuit") ? 23 : Number(parametres.get("heure") ?? 10),
  etiquettes: !parametres.has("nues"),
};

const perspective = new THREE.PerspectiveCamera(35, 1, 0.1, 300);
const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 300);
const commandes = new OrbitControls(perspective, canvas);
commandes.enableDamping = true;
function choisirVue(s: Section): void {
  etat.section = s;
  const v = VUES[s];
  const cible = new THREE.Vector3(...v.cible);
  commandes.target.copy(cible);
  perspective.position.copy(cible).add(new THREE.Vector3(0.45, 0.42, 1).normalize().multiplyScalar(v.distance));
  commandes.update();
}
choisirVue(etat.section);
/** Regarder un objet de près : objets.html#objet=forge (le début de son nom suffit). */
function cadrer(nom: string): void {
  const a = articles.find((x) => x.nom.startsWith(nom));
  if (!a) return;
  const cible = a.objet.getWorldPosition(new THREE.Vector3());
  cible.y += a.haut * 0.4;
  commandes.target.copy(cible);
  const d = Number(parametres.get("d") ?? 2.2 + a.haut * 1.6);
  const lacet = Number(parametres.get("lacet") ?? 0.6);
  perspective.position.copy(cible).add(new THREE.Vector3(Math.sin(lacet), 0.55, Math.cos(lacet)).normalize().multiplyScalar(d));
  commandes.update();
}
const cadrage = parametres.get("objet");
if (cadrage) {
  cadrer(cadrage);
  // Les armes n'existent qu'une fois les personnages chargés.
  setTimeout(() => cadrer(cadrage), 1500);
}

function redimensionner(): void {
  rendu.setSize(window.innerWidth, window.innerHeight, false);
  perspective.aspect = window.innerWidth / window.innerHeight;
  perspective.updateProjectionMatrix();
  const demi = 10;
  const r = window.innerHeight / window.innerWidth;
  Object.assign(ortho, { left: -demi, right: demi, top: demi * r, bottom: -demi * r });
  ortho.updateProjectionMatrix();
}
window.addEventListener("resize", redimensionner);
redimensionner();

// ---------- La barre ----------

const barre = document.getElementById("barre")!;
barre.innerHTML = "<b>Objets</b> · ";
const bouton = (nom: string, action: () => void) => {
  const b = document.createElement("button");
  b.textContent = nom;
  b.onclick = action;
  barre.append(b);
};
for (const s of Object.keys(VUES) as Section[]) bouton(s, () => choisirVue(s));
barre.append(document.createElement("br"));
bouton("vue du jeu / libre", () => (etat.jeu = !etat.jeu));
bouton("jour", () => (etat.heure = 10));
bouton("aube", () => (etat.heure = 6.4));
bouton("crépuscule", () => (etat.heure = 20.2));
bouton("nuit", () => (etat.heure = 23));
bouton("armes : repos / garde / frappe", () => {
  etatArmes.pose = etatArmes.pose === "repos" ? "garde" : etatArmes.pose === "garde" ? "frappe" : "repos";
  for (const p of porteurs) p.preparer(etatArmes.pose === "garde" ? 1 : 0);
});
bouton("étiquettes", () => (etat.etiquettes = !etat.etiquettes));
bouton("mesures", () => (mesures.style.display = mesures.style.display === "none" ? "" : "none"));
if (parametres.has("sansmesures")) mesures.style.display = "none";

// ---------- La boucle ----------

const horloge = new THREE.Clock();
const boucle = () => {
  requestAnimationFrame(boucle);
  const dt = Math.min(0.05, horloge.getDelta());
  const cible = commandes.target;
  ciel.appliquer(etat.heure, cible);
  for (const a of animations) a(dt, ciel.nuit);
  if (etatArmes.pose === "frappe") {
    etatArmes.attente -= dt;
    if (etatArmes.attente <= 0) {
      etatArmes.attente = 1.4;
      for (const p of porteurs) p.frapper(false, 0.6);
    }
  }
  for (const p of porteurs) p.animer(dt, 0);
  reserve.mettreAJour(
    sources.map((s) => s()).filter((s): s is SourceLumiere => s !== null),
    cible,
    dt,
  );
  let camera: THREE.Camera = perspective;
  if (etat.jeu) {
    const el = Math.atan(1 / Math.SQRT2);
    const lacet = Math.PI / 4;
    ortho.position.set(cible.x + Math.sin(lacet) * Math.cos(el) * 60, cible.y + Math.sin(el) * 60, cible.z + Math.cos(lacet) * Math.cos(el) * 60);
    ortho.lookAt(cible);
    camera = ortho;
  } else commandes.update();
  rendu.render(scene, camera);
  placerEtiquettes(camera);
};
requestAnimationFrame(boucle);
