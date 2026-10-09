// Le terrain du joueur (Book 19) : 50 × 50 m de prairie, entouré d'une lisière boisée
// et d'une clôture effondrée qui en marque le bord. Décor provisoire de l'É0, sans collisions.

import * as THREE from "three";
import { TERRAIN_TAILLE } from "../../../commun/src/regles.ts";
import { distanceMare } from "../../../commun/src/terrain.ts";
import { PALETTE, aleatoire, materiau, nommer } from "./materiaux.ts";

const T = TERRAIN_TAILLE;

/** Bruit de valeur lissé, pour varier la couleur du sol sans texture. */
export function bruit(aleat: () => number, taille: number): (x: number, z: number) => number {
  const grille = Array.from({ length: (taille + 1) * (taille + 1) }, () => aleat());
  const lisser = (t: number) => t * t * (3 - 2 * t);
  return (x, z) => {
    const xi = Math.floor(x);
    const zi = Math.floor(z);
    const fx = lisser(x - xi);
    const fz = lisser(z - zi);
    const v = (i: number, j: number) => grille[Math.min(taille, Math.max(0, j)) * (taille + 1) + Math.min(taille, Math.max(0, i))]!;
    const a = v(xi, zi) + (v(xi + 1, zi) - v(xi, zi)) * fx;
    const b = v(xi, zi + 1) + (v(xi + 1, zi + 1) - v(xi, zi + 1)) * fx;
    return a + (b - a) * fz;
  };
}

function couleurSol(x: number, z: number, n: (x: number, z: number) => number, cible: THREE.Color): THREE.Color {
  const grand = n(x / 9, z / 9);
  const petit = n(x / 2.5 + 40, z / 2.5 + 40);
  cible.setHex(PALETTE.herbe);
  cible.lerp(new THREE.Color(PALETTE.herbeSombre), Math.max(0, 0.6 - grand) * 0.9);
  cible.lerp(new THREE.Color(PALETTE.herbeSeche), Math.max(0, grand - 0.55) * 1.2);
  cible.offsetHSL(0, 0, (petit - 0.5) * 0.06);

  // Un chemin de terre battue du point d'arrivée vers le sud (la route de la Campagne).
  const cheminX = 25 + Math.sin(z * 0.18) * 1.6;
  const distChemin = Math.abs(x - cheminX);
  if (z > 26 && distChemin < 1.4) {
    const force = (1 - distChemin / 1.4) * (0.75 + petit * 0.25);
    cible.lerp(new THREE.Color(PALETTE.terre), Math.min(1, force * 1.3));
  }
  // Une aire de terre autour du point d'arrivée, là où l'on fera son premier feu.
  const distCentre = Math.hypot(x - 25, z - 25);
  if (distCentre < 3.2) cible.lerp(new THREE.Color(PALETTE.terreSombre), (1 - distCentre / 3.2) * 0.55);
  return cible;
}

export function creerTerrain(): THREE.Group {
  const groupe = new THREE.Group();
  const aleat = aleatoire(19);
  const n = bruit(aleat, 64);
  const couleur = new THREE.Color();

  // Le sol du terrain, une case = un carré (la grille ne s'affiche qu'en mode Construction).
  const sol = new THREE.PlaneGeometry(T, T, T, T);
  sol.rotateX(-Math.PI / 2);
  sol.translate(T / 2, 0, T / 2);
  const positions = sol.attributes.position!;
  const couleurs = new Float32Array(positions.count * 3);
  for (let i = 0; i < positions.count; i++) {
    couleurSol(positions.getX(i), positions.getZ(i), n, couleur).toArray(couleurs, i * 3);
  }
  sol.setAttribute("color", new THREE.BufferAttribute(couleurs, 3));
  const matSol = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: false });
  const maillageSol = new THREE.Mesh(sol, matSol);
  maillageSol.receiveShadow = true;
  groupe.add(maillageSol);

  // Le monde autour : une prairie plus sombre jusqu'à l'horizon.
  const exterieur = new THREE.Mesh(
    new THREE.PlaneGeometry(220, 220).rotateX(-Math.PI / 2).translate(T / 2, -0.02, T / 2),
    new THREE.MeshStandardMaterial({ color: PALETTE.herbeSombre, roughness: 1 }),
  );
  exterieur.receiveShadow = true;
  groupe.add(exterieur);

  groupe.add(creerLisiere(aleat));
  groupe.add(creerCloture(aleat));
  groupe.add(creerDetails(aleat));
  groupe.add(creerPanneauRoute("Route de la Campagne", "Station-service 3 km", 27.8, T - 1.2, 0));
  nommer(groupe, ["sol", "exterieur", "lisiere", "cloture", "details", "panneau"]);
  return groupe;
}

/**
 * Un panneau de bois au bord d'un chemin : on comprend que c'est par là qu'on part.
 * `o` : orientation de la face lisible.
 */
export function creerPanneauRoute(titre: string, sousTitre: string, x: number, z: number, o: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = o;
  const poteau = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2, 0.12).translate(0, 1, 0), materiau(PALETTE.boisSombre));
  poteau.castShadow = true;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 96;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#8a6a46";
  ctx.fillRect(0, 0, 256, 96);
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  for (let i = 0; i < 9; i++) ctx.fillRect(0, i * 11 + 3, 256, 1.5);
  ctx.fillStyle = "#f2e8d0";
  ctx.font = "bold 30px 'Futura', 'Avenir Next Condensed', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(titre.toUpperCase(), 128, 44, 236);
  ctx.font = "italic 22px Georgia, serif";
  ctx.fillText(sousTitre, 128, 78, 236);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  // Les cinq faces de bois en un seul morceau, la face peinte (+z) à part : 2 appels de dessin au lieu de 6, autant
  // dans l'ombre (2026-10-09). Même image : on ne fait que réordonner les triangles de la boîte.
  const boite = new THREE.BoxGeometry(1.7, 0.64, 0.06);
  const ordre = Array.from(boite.index!.array);
  boite.setIndex([...ordre.slice(0, 24), ...ordre.slice(30, 36), ...ordre.slice(24, 30)]);
  boite.clearGroups();
  boite.addGroup(0, 30, 0);
  boite.addGroup(30, 6, 1);
  const planche = new THREE.Mesh(boite, [materiau(0x7a5a3c), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 })]);
  planche.position.set(0, 1.65, 0.08);
  planche.rotation.z = 0.04;
  planche.castShadow = true;
  g.add(poteau, planche);
  return g;
}

/** Arbres instanciés : un tronc et un feuillage à facettes par arbre (Book 21 §5.2.2). */
function creerLisiere(aleat: () => number): THREE.Group {
  const groupe = new THREE.Group();
  const places: { x: number; z: number; e: number }[] = [];

  // Une bande boisée de 3 à 22 m autour du terrain, plus dense près du bord.
  for (let i = 0; i < 520; i++) {
    const angle = aleat() * Math.PI * 2;
    const bord = 3 + Math.pow(aleat(), 1.6) * 19;
    const cx = T / 2 + Math.cos(angle) * (T / 2 + bord) * 1.02;
    const cz = T / 2 + Math.sin(angle) * (T / 2 + bord) * 1.02;
    const x = Math.min(T + 22, Math.max(-22, cx));
    const z = Math.min(T + 22, Math.max(-22, cz));
    if (x > -1.5 && x < T + 1.5 && z > -1.5 && z < T + 1.5) continue;
    // Laisser l'ouverture du chemin au sud.
    if (z > T && Math.abs(x - 25) < 4) continue;
    places.push({ x, z, e: 0.75 + aleat() * 0.7 });
  }
  // Quelques arbres isolés sur le terrain, loin du centre.
  for (const [x, z] of [[6, 8], [47.5, 3], [7, 43], [41, 40], [12, 30]] as const) places.push({ x, z, e: 1.1 });
  groupe.add(creerArbres(places, aleat));
  return groupe;
}

export interface PlaceArbre {
  x: number;
  z: number;
  /** Échelle */
  e: number;
}

/** Arbres instanciés (feuillus et sapins), pour la lisière du terrain comme pour la forêt de la halte. */
export function creerArbres(places: PlaceArbre[], aleat: () => number): THREE.Group {
  const groupe = new THREE.Group();
  const tronc = new THREE.CylinderGeometry(0.16, 0.24, 1.6, 6).translate(0, 0.8, 0);
  const feuillage = new THREE.IcosahedronGeometry(1.25, 0).translate(0, 2.55, 0);
  const sapin = new THREE.ConeGeometry(1.1, 2.8, 7).translate(0, 2.5, 0);

  const troncs = new THREE.InstancedMesh(tronc, materiau(PALETTE.bois), places.length);
  const feuillus = new THREE.InstancedMesh(feuillage, materiau(0xffffff), places.length);
  const sapins = new THREE.InstancedMesh(sapin, materiau(0xffffff), places.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const teinte = new THREE.Color();
  let nFeuillus = 0;
  let nSapins = 0;
  const tons = [PALETTE.feuillage, PALETTE.feuillageSombre, PALETTE.feuillageClair];

  places.forEach((p, i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), aleat() * Math.PI * 2);
    const echelle = new THREE.Vector3(p.e, p.e * (0.9 + aleat() * 0.3), p.e);
    m.compose(new THREE.Vector3(p.x, 0, p.z), q, echelle);
    troncs.setMatrixAt(i, m);
    teinte.setHex(tons[Math.floor(aleat() * tons.length)]!).offsetHSL(0, 0, (aleat() - 0.5) * 0.06);
    if (aleat() < 0.3) {
      sapins.setMatrixAt(nSapins, m);
      sapins.setColorAt(nSapins++, teinte);
    } else {
      feuillus.setMatrixAt(nFeuillus, m);
      feuillus.setColorAt(nFeuillus++, teinte);
    }
  });
  feuillus.count = nFeuillus;
  sapins.count = nSapins;
  for (const maillage of [troncs, feuillus, sapins]) {
    maillage.castShadow = true;
    maillage.receiveShadow = true;
    groupe.add(maillage);
  }
  return groupe;
}

/** Clôture effondrée sur le bord du terrain : poteaux penchés, quelques manques. */
function creerCloture(aleat: () => number): THREE.InstancedMesh {
  const poteau = new THREE.BoxGeometry(0.12, 1.1, 0.12).translate(0, 0.55, 0);
  const places: THREE.Matrix4[] = [];
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  for (let d = 0; d <= T * 4; d += 2.5) {
    if (aleat() < 0.18) continue; // poteau tombé
    const cote = Math.floor(d / T);
    const t = d % T;
    const [x, z] = [[t, 0], [T, t], [T - t, T], [0, T - t]][Math.min(cote, 3)]!;
    if (z === T && Math.abs(x - 25) < 2.5) continue; // l'entrée du chemin
    e.set((aleat() - 0.5) * 0.35, aleat() * Math.PI, (aleat() - 0.5) * 0.35);
    q.setFromEuler(e);
    places.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(1, 0.7 + aleat() * 0.4, 1)));
  }
  const poteaux = new THREE.InstancedMesh(poteau, materiau(PALETTE.boisSombre), places.length);
  places.forEach((m, i) => poteaux.setMatrixAt(i, m));
  poteaux.castShadow = true;
  return poteaux;
}

/** Fusionne des géométries non indexées en une seule (positions et normales). */
export function fusionner(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const plates = geometries.map((g) => (g.index ? g.toNonIndexed() : g));
  const total = plates.reduce((n, g) => n + g.attributes.position!.count, 0);
  const positions = new Float32Array(total * 3);
  let decalage = 0;
  for (const g of plates) {
    positions.set(g.attributes.position!.array as Float32Array, decalage);
    decalage += g.attributes.position!.count * 3;
  }
  const resultat = new THREE.BufferGeometry();
  resultat.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  resultat.computeVertexNormals();
  return resultat;
}

/** Touffes d'herbe : le décor fin du sol (les ressources viennent du serveur). */
function creerDetails(aleat: () => number): THREE.Group {
  const groupe = new THREE.Group();
  const libre = (x: number, z: number) => Math.hypot(x - 25, z - 26) > 4 && distanceMare(x, z) > 0.8;

  // Une touffe = trois brins penchés, fusionnés en un seul maillage.
  const brin = (angle: number) =>
    new THREE.ConeGeometry(0.05, 0.38, 3).translate(0, 0.19, 0).rotateZ(0.3).rotateY(angle).translate(Math.cos(angle) * 0.05, 0, Math.sin(angle) * 0.05);
  const touffes = new THREE.InstancedMesh(fusionner([brin(0), brin(2.1), brin(4.2)]), materiau(0xffffff), 420);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const teinte = new THREE.Color();
  for (let i = 0; i < touffes.count; i++) {
    let x = 0;
    let z = 0;
    do {
      x = 1 + aleat() * (T - 2);
      z = 1 + aleat() * (T - 2);
    } while (!libre(x, z));
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), aleat() * Math.PI * 2);
    const s = 0.8 + aleat() * 0.9;
    m.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(s, s, s));
    touffes.setMatrixAt(i, m);
    touffes.setColorAt(i, teinte.setHex(aleat() < 0.6 ? PALETTE.herbe : PALETTE.herbeSeche).offsetHSL(0, 0, (aleat() - 0.5) * 0.08));
  }
  touffes.receiveShadow = true;
  groupe.add(touffes);
  return groupe;
}
