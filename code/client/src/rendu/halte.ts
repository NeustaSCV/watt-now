// La halte de la station-service (Book 21 §3.2, Book 01 §2 bis) : une route de campagne craquelée entre deux
// murs de forêt, la station « Abondance » pillée, une grange effondrée à l'écart, un éboulis qui fait goulet.
// Les vestiges qu'on peut fouiller (épaves, rayonnages, panneau) viennent du serveur (ressources.ts).
//
// Les bâtiments sont posés au « chantier » (ruine.ts) : des pièces teintées, fusionnées par matériau. Ce qui peut
// cacher le personnage (toits, façades, murs hauts) est construit à part, avec ses propres matériaux, pour
// s'effacer complètement quand on passe dessous ou derrière (voir estomperToits).

import * as THREE from "three";
import { BOUTIQUE, FERME_HALTE, GOULET, HALTE, ROUTE, STATION, dansBoite, type Boite } from "../../../commun/src/lieux.ts";
import { PALETTE, aleatoire, materiau, nommer } from "./materiaux.ts";
import { trierParInstance } from "./lots.ts";
import {
  Chantier,
  dessiner,
  geoToleOndulee,
  lierre,
  matiere,
  matiereTexture,
  matiereVerre,
  taches,
  textureAffiche,
  textureEnduit,
  textureToitPlat,
  touffes,
  type Pose,
} from "./ruine.ts";
import { bruit, creerArbres, creerPanneauRoute, fusionner, type PlaceArbre } from "./terrain.ts";
import { fusionnerStatique } from "./fusion.ts";

const L = HALTE.longueur;
const ASPHALTE = 0x56575b;
const ROUGE = 0xc8362b;
const CREME = 0xe9dfc6;
const ACIER = 0x8a8f94;

function ombre<T extends THREE.Mesh>(m: T): T {
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function boite(l: number, h: number, p: number, couleur: number | THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const m = ombre(new THREE.Mesh(new THREE.BoxGeometry(l, h, p), typeof couleur === "number" ? materiau(couleur) : couleur));
  m.position.set(x, y, z);
  return m;
}

const texture = dessiner;

/** Une affiche, une enseigne : un plan texturé posé au chantier (normale +z dans la pose). */
function plaque(c: Chantier, l: number, h: number, mat: THREE.Material, pose: Pose): void {
  c.poser(new THREE.PlaneGeometry(l, h), mat, 0xffffff, pose, { nuance: 0, crasse: false });
}

// ---------- Les toits qui s'effacent ----------

/** Ce qui s'efface quand il cache le personnage : un toit, une façade, des murs hauts. */
export interface Toit {
  /** L'emprise au sol de ce qui s'efface. */
  boite: Boite;
  materiaux: THREE.Material[];
  /** Hauteur du bas et du haut de ce qui s'efface (m) : sert à savoir si le personnage est caché derrière. */
  bas?: number;
  haut?: number;
  /** Rien ne s'efface tant que le personnage est dans cette boîte (les murs du fond, vus de l'intérieur). */
  horsDe?: Boite;
  /**
   * Ce qui reste visible quand il s'efface (0 à 1 ; 0 par défaut : il disparaît). Une porte ne disparaît jamais tout à
   * fait : on la voit (fermée ou ouverte) en s'en approchant, et l'on se voit à travers.
   */
  fantome?: number;
  /** État courant (géré par estomperToits). */
  efface?: boolean;
}

/** Recul au sol d'un point vu par la caméra isométrique, par mètre de hauteur : 1 / tan(35,26°) = √2. */
const RECUL = Math.SQRT2;

/**
 * Le toit cache-t-il le personnage ? Il est dessous, ou derrière (vu de la caméra) : on suit le regard depuis ses pieds,
 * sa taille et sa tête jusqu'à la hauteur du toit. Une marge plus large pour réapparaître évite le clignotement.
 */
function cacheLePersonnage(t: Toit, x: number, z: number, lacet: number): boolean {
  if (t.horsDe && dansBoite(x, z, t.horsDe, 0.25)) return false;
  const b = t.boite;
  const marge = t.efface ? 0.9 : 0.45;
  const dans = (px: number, pz: number, m: number) => Math.abs(px - b.x) <= b.l / 2 + m && Math.abs(pz - b.z) <= b.p / 2 + m;
  if (dans(x, z, marge * 0.5)) return true;
  const dx = Math.cos(lacet);
  const dz = Math.sin(lacet);
  const bas = t.bas ?? 2.4;
  const haut = t.haut ?? 5;
  for (const y of [0.15, 0.9, 1.75]) {
    const s0 = Math.max(0, (bas - y) * RECUL);
    const s1 = Math.max(0, (haut - y) * RECUL);
    for (let i = 0; i <= 5; i++) {
      const s = s0 + ((s1 - s0) * i) / 5;
      if (dans(x + dx * s, z + dz * s, marge)) return true;
    }
  }
  return false;
}

/**
 * Les toits (et façades) qui cachent le personnage disparaissent : fondu rapide jusqu'à rien, puis invisibles ;
 * ils reviennent en fondu quand on en sort. Leur ombre reste au sol (un maillage d'ombre seule, voir Chantier).
 * `lacet` : l'angle horizontal de la caméra (par défaut, la vue du sud-est).
 */
export function estomperToits(halte: THREE.Object3D, x: number, z: number, dt: number, lacet = Math.PI / 4): void {
  // Pour chaque matériau, ce qu'il doit garder : 1 (rien ne s'efface), sinon le plus bas des fantômes voulus.
  const voulu = new Map<THREE.Material, number>();
  halte.traverse((o) => {
    const toits = o.userData.toits as Toit[] | undefined;
    if (!toits) return;
    for (const t of toits) {
      const efface = cacheLePersonnage(t, x, z, lacet);
      t.efface = efface;
      const garde = efface ? (t.fantome ?? 0) : 1;
      for (const m of t.materiaux) voulu.set(m, Math.min(voulu.get(m) ?? 1, garde));
    }
  });
  const k = 1 - Math.exp(-dt * 14);
  for (const [m, cible] of voulu) {
    const avant = (m.userData.fondu as number | undefined) ?? 1;
    let f = avant + (cible - avant) * k;
    if (Math.abs(f - cible) < 0.03) f = cible;
    if (f === avant && m.userData.fondu !== undefined) continue;
    m.userData.fondu = f;
    const opacite = (m.userData.opacite as number | undefined) ?? 1;
    m.opacity = opacite * f;
    m.visible = f > 0;
    m.depthWrite = f >= 1 && opacite >= 1;
  }
}

export function creerHalte(): THREE.Group {
  const groupe = new THREE.Group();
  const aleat = aleatoire(311);
  const n = bruit(aleat, 96);
  groupe.add(creerSol(n), creerRoute(aleat, n), creerForet(aleat), creerStation(aleat), creerFerme(), creerGoulet(aleat));
  groupe.add(creerPoteaux(aleat), creerHerbes(aleat), creerDebris(aleat));
  // P-006 : le Carrefour à l'ouest (à gauche), le terrain à l'est (à droite), comme sur la carte.
  groupe.add(creerPanneauRoute("Le Carrefour", "← Comptoir · 2 km", 7, ROUTE.z + ROUTE.demiLargeur + 1.6, 0));
  groupe.add(creerPanneauRoute("Ton terrain", "3 km, par le pont →", L - 9, ROUTE.z + ROUTE.demiLargeur + 1.6, 0));
  groupe.add(creerBarrage());
  nommer(groupe, ["sol", "route", "foret", "station", "ferme", "goulet", "poteaux", "herbes", "debris", "panneau", "panneau", "barrage"]);
  return groupe;
}

// ---------- Le sol : herbes sèches, accotements de gravier, sous-bois sombre ----------

function creerSol(n: (x: number, z: number) => number): THREE.Mesh {
  const largeur = L + 60;
  const profondeur = HALTE.largeur + 50;
  const sol = new THREE.PlaneGeometry(largeur, profondeur, largeur / 2, profondeur / 2).rotateX(-Math.PI / 2).translate(L / 2, 0, HALTE.largeur / 2);
  const pos = sol.attributes.position!;
  const couleurs = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const herbe = new THREE.Color(PALETTE.herbe);
  const seche = new THREE.Color(PALETTE.herbeSeche);
  const sombre = new THREE.Color(0x3f5432);
  const gravier = new THREE.Color(0xa59a85);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const g = n(x / 11, z / 11);
    const p = n(x / 3 + 50, z / 3 + 50);
    c.copy(herbe).lerp(seche, Math.min(1, Math.max(0, g - 0.35) * 1.6));
    // Sous les arbres, la terre est sombre.
    const foret = Math.max(0, Math.min(1, (9 - z) / 4), Math.min(1, (z - 61) / 4));
    c.lerp(sombre, foret * 0.85);
    // Accotements de gravier le long de la route.
    const d = Math.abs(z - ROUTE.z) - ROUTE.demiLargeur;
    if (d < 1.6) c.lerp(gravier, Math.max(0, 1 - d / 1.6) * (0.55 + p * 0.3));
    // Le parking de la station : terre battue autour de la dalle.
    const parking = Math.hypot((x - 104) / 24, (z - 23) / 9);
    if (parking < 1) c.lerp(new THREE.Color(PALETTE.terre), (1 - parking) * 0.5);
    c.offsetHSL(0, 0, (p - 0.5) * 0.07);
    c.toArray(couleurs, i * 3);
  }
  sol.setAttribute("color", new THREE.BufferAttribute(couleurs, 3));
  const m = new THREE.Mesh(sol, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  m.receiveShadow = true;
  return m;
}

// ---------- La route : asphalte fatigué, fissures, nids-de-poule, ligne effacée ----------

function creerRoute(aleat: () => number, n: (x: number, z: number) => number): THREE.Group {
  const g = new THREE.Group();
  const largeur = ROUTE.demiLargeur * 2;
  const geo = new THREE.PlaneGeometry(L + 40, largeur, (L + 40) / 1, 7).rotateX(-Math.PI / 2).translate(L / 2, 0.02, ROUTE.z);
  const pos = geo.attributes.position!;
  const couleurs = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const v = n(x / 6 + 9, z / 2 + 9);
    c.setHex(ASPHALTE).offsetHSL(0, 0, (v - 0.5) * 0.08 + (n(x / 1.3, z / 1.3) - 0.5) * 0.05);
    // Rapiéçages un peu plus sombres, bords délavés par les pluies
    if (n(x / 14 + 3, z / 4) > 0.74) c.offsetHSL(0, 0, -0.025);
    if (Math.abs(z - ROUTE.z) > ROUTE.demiLargeur - 0.6) c.offsetHSL(0, 0, 0.04);
    c.toArray(couleurs, i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(couleurs, 3));
  const asphalte = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
  asphalte.receiveShadow = true;
  g.add(asphalte);

  // Ligne médiane en tirets, effacée par endroits
  const tirets = new THREE.InstancedMesh(new THREE.PlaneGeometry(3, 0.14).rotateX(-Math.PI / 2), materiau(0xd9d2b8), 40);
  const m = new THREE.Matrix4();
  let k = 0;
  for (let x = -10; x < L + 10 && k < 40; x += 7) {
    if (aleat() < 0.3) continue;
    m.makeTranslation(x, 0.035, ROUTE.z);
    tirets.setMatrixAt(k++, m);
  }
  tirets.count = k;
  tirets.receiveShadow = true;
  g.add(tirets);

  // Fissures : de fins traits sombres, en réseau
  const fissure = new THREE.PlaneGeometry(1, 0.035).rotateX(-Math.PI / 2);
  const fissures = new THREE.InstancedMesh(fissure, materiau(0x3c3d40), 220);
  const q = new THREE.Quaternion();
  const axe = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < fissures.count; i++) {
    q.setFromAxisAngle(axe, aleat() * Math.PI);
    const x = -5 + aleat() * (L + 10);
    const z = ROUTE.z + (aleat() - 0.5) * largeur * 0.95;
    m.compose(new THREE.Vector3(x, 0.03, z), q, new THREE.Vector3(0.25 + aleat() * 0.7, 1, 1));
    fissures.setMatrixAt(i, m);
  }
  g.add(fissures);

  // Nids-de-poule, certains avec une flaque
  for (let i = 0; i < 14; i++) {
    const x = 10 + aleat() * (L - 20);
    const z = ROUTE.z + (aleat() - 0.5) * (largeur - 1.5);
    const r = 0.3 + aleat() * 0.5;
    const trou = new THREE.Mesh(new THREE.CircleGeometry(r, 9).rotateX(-Math.PI / 2), materiau(0x3a3a3c));
    trou.position.set(x, 0.032, z);
    trou.scale.set(1.4, 1, 1);
    trou.receiveShadow = true;
    g.add(trou);
    if (aleat() < 0.5) {
      const flaque = new THREE.Mesh(
        new THREE.CircleGeometry(r * 0.75, 9).rotateX(-Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0x5b7380, roughness: 0.08, metalness: 0.3 }),
      );
      flaque.position.set(x, 0.036, z);
      flaque.scale.set(1.4, 1, 1);
      g.add(flaque);
    }
  }
  return g;
}

// ---------- La forêt dense de part et d'autre : on comprend que la route est le seul passage ----------

function creerForet(aleat: () => number): THREE.Group {
  const places: PlaceArbre[] = [];
  const ajouter = (x: number, z: number, e: number) => {
    if (places.some((p) => Math.abs(p.x - x) < 1.2 && Math.abs(p.z - z) < 1.2)) return;
    places.push({ x, z, e });
  };
  for (let i = 0; i < 1500; i++) {
    const nord = aleat() < 0.5;
    const profondeur = Math.pow(aleat(), 1.3) * 26;
    // Au sud (côté caméra), la lisière est faite de jeunes arbres bas : ils ne cachent pas le personnage.
    const z = nord ? 8.6 - profondeur : 61.5 + profondeur;
    const x = -25 + aleat() * (L + 50);
    const jeune = !nord && profondeur < 7;
    ajouter(x, z, jeune ? 0.45 + aleat() * 0.2 : 0.85 + aleat() * 0.75);
  }
  // Au-delà des deux bouts de la halte, la forêt se referme sur la route.
  for (let i = 0; i < 220; i++) {
    const x = aleat() < 0.5 ? -4 - aleat() * 22 : L + 4 + aleat() * 22;
    const z = 6 + aleat() * 58;
    if (Math.abs(z - ROUTE.z) < ROUTE.demiLargeur + 1.2) continue;
    ajouter(x, z, 0.9 + aleat() * 0.6);
  }
  const groupe = creerArbres(places, aleat);

  // Sous-bois en lisière : des buissons sombres qui ferment le passage.
  const buisson = new THREE.IcosahedronGeometry(0.9, 0);
  const buissons = new THREE.InstancedMesh(buisson, materiau(0xffffff), 340);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const teinte = new THREE.Color();
  for (let i = 0; i < buissons.count; i++) {
    const nord = i % 2 === 0;
    const x = -10 + aleat() * (L + 20);
    const z = nord ? 7.6 + aleat() * 1.6 : 59.8 + aleat() * 1.6;
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), aleat() * 6.28);
    const s = 0.7 + aleat() * 0.8;
    m.compose(new THREE.Vector3(x, 0.35 * s, z), q, new THREE.Vector3(s * 1.3, s * 0.85, s));
    buissons.setMatrixAt(i, m);
    buissons.setColorAt(i, teinte.setHex(aleat() < 0.5 ? PALETTE.feuillageSombre : 0x4b6b3a).offsetHSL(0, 0, (aleat() - 0.5) * 0.06));
  }
  buissons.castShadow = true;
  buissons.receiveShadow = true;
  groupe.add(trierParInstance(buissons));
  groupe.add(creerFourresDesBouts());
  return groupe;
}

/**
 * Aux deux bouts de la halte, hors de la route, un fourré serré ferme le lieu (0.7.1) : avant, la forêt ne commençait
 * qu'à 4 m au-delà de la borne, et l'on butait sur rien. Son propre tirage, pour ne rien déplacer du reste de la forêt.
 */
function creerFourresDesBouts(): THREE.Object3D {
  const aleat = aleatoire(313);
  const places: THREE.Matrix4[] = [];
  const q = new THREE.Quaternion();
  for (const x of [-0.7, L + 0.7]) {
    for (let z = 7.8; z <= 61; z += 1.05) {
      if (Math.abs(z - ROUTE.z) < ROUTE.demiLargeur + 1.4) continue;
      for (const recul of [0, 1.6]) {
        const s = 0.75 + aleat() * 0.5;
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), aleat() * 6.28);
        const xx = x + Math.sign(x - L / 2) * (recul + (aleat() - 0.5) * 0.3);
        places.push(new THREE.Matrix4().compose(new THREE.Vector3(xx, 0.35 * s, z + (aleat() - 0.5) * 0.4), q, new THREE.Vector3(s * 1.2, s * 0.9, s)));
      }
    }
  }
  const fourres = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.9, 0), materiau(0xffffff), places.length);
  const teinte = new THREE.Color();
  places.forEach((m, i) => {
    fourres.setMatrixAt(i, m);
    fourres.setColorAt(i, teinte.setHex(aleat() < 0.5 ? PALETTE.feuillageSombre : 0x4b6b3a).offsetHSL(0, 0, (aleat() - 0.5) * 0.06));
  });
  fourres.castShadow = true;
  fourres.receiveShadow = true;
  return trierParInstance(fourres);
}

// ---------- La station « Abondance » ----------

/** L'aire bétonnée de la station : de la façade de la boutique jusqu'au bord de la route. */
const AIRE = { x0: 84, z0: 17.5, x1: 126, z1: 31.3 } as const;
/** Pixels par mètre de la texture de l'aire. */
const PX = 24;

function textureAire(): THREE.CanvasTexture {
  const aleat = aleatoire(77);
  const l = (AIRE.x1 - AIRE.x0) * PX;
  const h = (AIRE.z1 - AIRE.z0) * PX;
  const X = (x: number) => (x - AIRE.x0) * PX;
  const Z = (z: number) => (z - AIRE.z0) * PX;
  return texture(l, h, (g) => {
    g.fillStyle = "#9a968d";
    g.fillRect(0, 0, l, h);
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = aleat() < 0.5 ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)";
      g.fillRect(aleat() * l, aleat() * h, 2 + aleat() * 3, 2 + aleat() * 3);
    }
    taches(g, aleat, 22, "rgba(70, 66, 60, 0.22)", 20, 70, l, h);
    // Les dalles coulées, leurs joints où l'herbe pousse
    g.strokeStyle = "rgba(52, 50, 46, 0.55)";
    g.lineWidth = 2;
    for (let x = AIRE.x0 + 4.2; x < AIRE.x1; x += 4.2) {
      g.beginPath();
      g.moveTo(X(x), 0);
      g.lineTo(X(x), h);
      g.stroke();
    }
    for (let z = AIRE.z0 + 3.5; z < AIRE.z1; z += 3.5) {
      g.beginPath();
      g.moveTo(0, Z(z));
      g.lineTo(l, Z(z));
      g.stroke();
    }
    g.strokeStyle = "rgba(92, 116, 60, 0.6)";
    g.lineWidth = 3;
    for (let i = 0; i < 26; i++) {
      const vertical = aleat() < 0.5;
      const x = vertical ? X(AIRE.x0 + 4.2 * (1 + Math.floor(aleat() * 9))) : aleat() * l;
      const y = vertical ? aleat() * h : Z(AIRE.z0 + 3.5 * (1 + Math.floor(aleat() * 3)));
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (vertical ? 0 : 20 + aleat() * 40), y + (vertical ? 20 + aleat() * 40 : 0));
      g.stroke();
    }
    // Fissures
    g.strokeStyle = "rgba(40, 38, 34, 0.6)";
    g.lineWidth = 1.5;
    for (let i = 0; i < 30; i++) {
      let x = aleat() * l;
      let y = aleat() * h;
      g.beginPath();
      g.moveTo(x, y);
      for (let k = 0; k < 6; k++) {
        x += (aleat() - 0.5) * 30;
        y += (aleat() - 0.5) * 30;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    // L'huile sous les pompes et devant l'atelier
    for (const [x, z, r] of [
      [100, 23.4, 1.2],
      [100, 25.7, 1],
      [106, 23.3, 1.1],
      [106, 25.6, 1.3],
      [114, 19, 1.4],
      [117, 19.6, 1.2],
    ] as const) {
      const d = g.createRadialGradient(X(x), Z(z), 0, X(x), Z(z), r * PX);
      d.addColorStop(0, "rgba(28, 28, 32, 0.45)");
      d.addColorStop(1, "rgba(28, 28, 32, 0)");
      g.fillStyle = d;
      g.fillRect(X(x) - r * PX, Z(z) - r * PX, r * PX * 2, r * PX * 2);
    }
    // Les places de parking à l'ouest, peintes en blanc, et le passage piéton devant la boutique
    g.fillStyle = "rgba(226, 220, 200, 0.75)";
    for (let k = 0; k < 4; k++) {
      g.save();
      g.translate(X(85.5 + k * 2.6), Z(18.2));
      g.rotate(0.35);
      g.fillRect(0, 0, 3, 4.6 * PX);
      g.restore();
    }
    for (let k = 0; k < 6; k++) g.fillRect(X(102.6 + k * 0.55), Z(18), 0.3 * PX, 2.2 * PX);
    // Les flèches de circulation sous l'auvent, à moitié effacées
    g.fillStyle = "rgba(226, 220, 200, 0.55)";
    for (const x of [97, 103, 109]) {
      g.beginPath();
      g.moveTo(X(x - 1), Z(27.4));
      g.lineTo(X(x + 0.6), Z(27.4));
      g.lineTo(X(x + 0.6), Z(27.1));
      g.lineTo(X(x + 1.3), Z(27.6));
      g.lineTo(X(x + 0.6), Z(28.1));
      g.lineTo(X(x + 0.6), Z(27.8));
      g.lineTo(X(x - 1), Z(27.8));
      g.fill();
    }
    // Les bouchons des cuves enterrées : ronds de couleur (super, gazole, sans-plomb)
    for (const [i, couleur] of ["#2f7a3a", "#d8c43a", "#c8362b", "#2f6fa4"].entries()) {
      const x = X(88 + i * 1.1);
      const y = Z(29.6);
      g.fillStyle = "#55524d";
      g.beginPath();
      g.arc(x, y, 0.42 * PX, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = couleur;
      g.lineWidth = 4;
      g.beginPath();
      g.arc(x, y, 0.32 * PX, 0, Math.PI * 2);
      g.stroke();
    }
    // Le sable et les feuilles mortes poussés contre les murs
    const bord = g.createLinearGradient(0, 0, 0, 0.8 * PX);
    bord.addColorStop(0, "rgba(124, 104, 70, 0.5)");
    bord.addColorStop(1, "rgba(124, 104, 70, 0)");
    g.fillStyle = bord;
    g.fillRect(0, 0, l, 0.8 * PX);
  });
}

function textureFronton(): THREE.CanvasTexture {
  const aleat = aleatoire(31);
  return texture(1024, 48, (g) => {
    g.fillStyle = "#e9dfc6";
    g.fillRect(0, 0, 1024, 48);
    g.fillStyle = "#c8362b";
    g.fillRect(0, 34, 1024, 14);
    g.fillRect(0, 0, 1024, 4);
    g.font = "900 30px 'Futura', 'Avenir Next Condensed', 'Arial Black', sans-serif";
    g.textAlign = "center";
    // Une lettre est tombée (le « D »), une autre pend de travers.
    const lettres = "ABONDANCE".split("");
    lettres.forEach((lettre, i) => {
      if (i === 4) return;
      g.save();
      g.translate(250 + i * 40, 30);
      if (i === 7) g.rotate(0.35);
      g.fillText(lettre, 0, 0);
      g.restore();
    });
    g.fillStyle = "#3b2a1e";
    g.font = "italic 20px Georgia, serif";
    g.fillText("le plein de bonheur", 760, 27);
    // Coulures de rouille sous les vis, crasse
    for (let i = 0; i < 40; i++) {
      const x = aleat() * 1024;
      const d = g.createLinearGradient(0, 4, 0, 40);
      d.addColorStop(0, "rgba(140, 70, 36, 0.5)");
      d.addColorStop(1, "rgba(140, 70, 36, 0)");
      g.fillStyle = d;
      g.fillRect(x, 4, 2 + aleat() * 3, 18 + aleat() * 20);
    }
    taches(g, aleat, 14, "rgba(60, 54, 44, 0.25)", 8, 30, 1024, 48);
  });
}

function textureTotem(): THREE.CanvasTexture {
  return texture(128, 256, (g) => {
    g.fillStyle = "#c8362b";
    g.fillRect(0, 0, 128, 256);
    g.fillStyle = "#e9dfc6";
    g.fillRect(8, 8, 112, 64);
    g.fillStyle = "#c8362b";
    g.font = "900 20px 'Futura', 'Arial Black', sans-serif";
    g.textAlign = "center";
    g.fillText("ABONDANCE", 64, 48);
    g.fillStyle = "#1c2333";
    g.fillRect(8, 84, 112, 160);
    g.font = "bold 16px 'Courier New', monospace";
    g.textAlign = "left";
    const lignes: [string, string][] = [
      ["SUPER", "1,89"],
      ["GAZOLE", "1,74"],
      ["ÉLEC.", "0,29"],
    ];
    lignes.forEach(([nom, prix], i) => {
      g.fillStyle = "#e8c547";
      g.fillText(nom, 14, 112 + i * 40);
      g.fillText(prix, 74, 112 + i * 40);
    });
    // Barré au feutre par les survivants
    g.strokeStyle = "#e9dfc6";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(12, 92);
    g.lineTo(116, 196);
    g.stroke();
    g.fillStyle = "#e9dfc6";
    g.font = "italic bold 14px Georgia, serif";
    g.textAlign = "center";
    g.fillText("plus rien.", 64, 232);
  });
}

function textureEcranPompe(): THREE.CanvasTexture {
  return texture(64, 64, (g) => {
    g.fillStyle = "#e9dfc6";
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = "#151a22";
    g.fillRect(6, 6, 52, 30);
    g.fillStyle = "#3a4250";
    g.font = "bold 12px 'Courier New', monospace";
    g.fillText("--,--", 12, 20);
    g.fillText("0000", 16, 32);
    // Le clavier, la fente à carte
    g.fillStyle = "#8a8f94";
    for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) g.fillRect(12 + i * 9, 41 + k * 7, 7, 5);
    g.fillStyle = "#1c2333";
    g.fillRect(44, 44, 12, 3);
    // Écran fendu
    g.strokeStyle = "rgba(220, 230, 240, 0.7)";
    g.beginPath();
    g.moveTo(30, 6);
    g.lineTo(36, 18);
    g.lineTo(28, 36);
    g.stroke();
  });
}

function texturePanneauSolaire(casse: boolean): THREE.CanvasTexture {
  return texture(96, 64, (g) => {
    g.fillStyle = "#c9ccd0";
    g.fillRect(0, 0, 96, 64);
    g.fillStyle = "#1f3550";
    g.fillRect(3, 3, 90, 58);
    g.strokeStyle = "#4d6a8a";
    g.lineWidth = 1;
    for (let x = 3; x <= 93; x += 15) {
      g.beginPath();
      g.moveTo(x, 3);
      g.lineTo(x, 61);
      g.stroke();
    }
    for (let y = 3; y <= 61; y += 14.5) {
      g.beginPath();
      g.moveTo(3, y);
      g.lineTo(93, y);
      g.stroke();
    }
    // Reflet du ciel
    const d = g.createLinearGradient(0, 0, 96, 64);
    d.addColorStop(0, "rgba(200, 220, 240, 0.25)");
    d.addColorStop(0.5, "rgba(200, 220, 240, 0)");
    g.fillStyle = d;
    g.fillRect(0, 0, 96, 64);
    if (casse) {
      g.strokeStyle = "rgba(230, 236, 244, 0.85)";
      g.lineWidth = 1.2;
      for (let i = 0; i < 7; i++) {
        g.beginPath();
        g.moveTo(40, 30);
        g.lineTo(40 + Math.cos(i * 0.9) * 50, 30 + Math.sin(i * 0.9) * 40);
        g.stroke();
      }
    }
  });
}

function creerStation(aleat: () => number): THREE.Group {
  const g = new THREE.Group();
  const toits: Toit[] = [];

  // L'aire bétonnée, peinte et fissurée, avec sa bordure le long de la route
  const aire = new THREE.Mesh(
    new THREE.PlaneGeometry(AIRE.x1 - AIRE.x0, AIRE.z1 - AIRE.z0).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: textureAire(), roughness: 0.95 }),
  );
  aire.position.set((AIRE.x0 + AIRE.x1) / 2, 0.05, (AIRE.z0 + AIRE.z1) / 2);
  aire.receiveShadow = true;
  g.add(aire);

  const c = new Chantier(901);
  c.pave(AIRE.x0, 0, AIRE.z1 - 0.05, AIRE.x1, 0.12, AIRE.z1 + 0.2, 0xa9a59b);
  c.pave(AIRE.x0 - 0.25, 0, AIRE.z0, AIRE.x0, 0.12, AIRE.z1 + 0.2, 0xa9a59b);
  c.pave(AIRE.x1, 0, AIRE.z0, AIRE.x1 + 0.25, 0.12, AIRE.z1 + 0.2, 0xa9a59b);

  const auvent = creerAuvent(c, toits);
  g.add(auvent);
  creerPompes(c);
  creerTotem(c, g);

  // La boutique : on y entre (moment-vitrine n° 4). Vitrines brisées, porte défoncée, intérieur pillé.
  g.add(creerBoutique(toits));
  // L'atelier : rideaux de fer coincés à mi-hauteur sur le noir, une voiture sur le pont.
  g.add(creerAtelier(toits));

  // Un caddie renversé, des pneus, des bidons, des poubelles
  c.repere({ x: STATION.boutique.x - 8, y: 0.45, z: 19.8, ry: 0.6, rz: 1.4 }, () => {
    c.boite(0.9, 0.55, 0.55, 0x9aa0a6, {}, matiere(0.5, 0.5));
    c.boite(0.05, 0.05, 0.6, 0x2b2b2b, { x: 0.5, y: 0.3 });
  });
  const atelier = STATION.atelier;
  const pneu = new THREE.TorusGeometry(0.32, 0.13, 5, 10).rotateX(Math.PI / 2);
  for (let i = 0; i < 5; i++) c.poser(pneu, matiere(), 0x1f1f1f, { x: atelier.x + 5.3 + (i % 2) * 0.25, y: 0.13 + Math.floor(i / 2) * 0.26, z: 18.9 + (i % 2) * 0.15, rz: (aleat() - 0.5) * 0.2 });
  c.poser(pneu, matiere(), 0x1f1f1f, { x: atelier.x + 6.1, y: 0.45, z: 17.9, rx: Math.PI / 2 - 0.3 });
  const bidon = new THREE.CylinderGeometry(0.29, 0.29, 0.88, 10);
  for (const [dx, couleur, couche] of [
    [-3, PALETTE.rouille, false],
    [-2.35, 0x2f6fa4, false],
    [-1.6, 0xa4552f, true],
  ] as const) {
    c.poser(bidon, matiere(0.6, 0.3), couleur, couche ? { x: atelier.x + dx, y: 0.29, z: 18.6, rz: Math.PI / 2, ry: 0.4 } : { x: atelier.x + dx, y: 0.44, z: 18.3 });
  }
  // Les poubelles au pied des piliers, une renversée
  const poubelle = new THREE.CylinderGeometry(0.28, 0.24, 0.85, 8);
  c.poser(poubelle, matiere(0.7, 0.2), 0x3e6b4a, { x: 95.5, y: 0.47, z: 25.3 });
  c.poser(poubelle, matiere(0.7, 0.2), 0x3e6b4a, { x: 112.9, y: 0.32, z: 23.5, rz: Math.PI / 2, ry: 0.8 });
  // La borne à air et à eau, bleue, contre la façade de l'atelier
  c.repere({ x: 111.9, z: 18.2 }, () => {
    c.boite(0.5, 1.3, 0.35, 0x2f6fa4, { y: 0.7 }, matiere(0.6, 0.2));
    c.boite(0.36, 0.3, 0.05, 0xe9dfc6, { y: 1.05, z: 0.18 });
    c.poser(new THREE.TorusGeometry(0.22, 0.025, 4, 10), matiere(), 0x1f1f1f, { x: 0.3, y: 0.6, ry: Math.PI / 2 });
  });

  // Herbes dans les joints de l'aire, au pied des murs et des îlots
  const points: [number, number][] = [];
  for (let i = 0; i < 70; i++) points.push([AIRE.x0 + 4.2 * (1 + Math.floor(aleat() * 9)) + (aleat() - 0.5) * 0.1, AIRE.z0 + aleat() * (AIRE.z1 - AIRE.z0)]);
  for (let i = 0; i < 40; i++) points.push([AIRE.x0 + aleat() * (AIRE.x1 - AIRE.x0), AIRE.z0 + 3.5 * (1 + Math.floor(aleat() * 3)) + (aleat() - 0.5) * 0.1]);
  for (let i = 0; i < 50; i++) points.push([95.6 + aleat() * 25, 17.7 + aleat() * 0.3]);
  for (let i = 0; i < 30; i++) points.push([AIRE.x0 + aleat() * (AIRE.x1 - AIRE.x0), AIRE.z1 - 0.1 - aleat() * 0.3]);
  touffes(
    c,
    points.filter(([x, z]) => !(Math.abs(x - 104.1) < 1.2 && z < 20)),
  );
  g.add(c.construire());
  g.userData.toits = toits;
  return g;
}

/** L'auvent : un toit plat sur deux piliers, son fronton rouge et crème, ses panneaux solaires. */
function creerAuvent(c: Chantier, toits: Toit[]): THREE.Group {
  const a = STATION.auvent;
  const x0 = a.x - a.l / 2;
  const x1 = a.x + a.l / 2;
  const z0 = a.z - a.p / 2;
  const z1 = a.z + a.p / 2;
  const bas = 4.2;
  const haut = 5.1;

  // Les piliers (ils restent) : habillés de crème, une bande rouge, un socle de béton
  for (const x of [x0 + 1.5, x1 - 1.5]) {
    c.boite(0.75, 0.35, 0.75, 0xa9a59b, { x, y: 0.17, z: a.z });
    c.boite(0.5, bas + 0.4, 0.5, 0xd9d4c8, { x, y: (bas + 0.4) / 2, z: a.z });
    c.boite(0.54, 0.5, 0.54, ROUGE, { x, y: 1.3, z: a.z });
    c.boite(0.54, 0.3, 0.54, ROUGE, { x, y: bas - 0.2, z: a.z });
  }
  // Du lierre grimpe au pilier ouest.
  lierre(c, x0 + 1.5, 0.1, a.z + 0.27, 0, 0.6, 2.6, 26);

  // Ce qui s'efface : la ceinture du fronton, les plaques du toit, les poutres, les panneaux solaires.
  const t = new Chantier(902);
  const matFronton = matiereTexture(textureFronton(), { roughness: 0.8 });
  // Bandeau : quatre côtés (crème, liseré rouge), le texte au sud et au nord
  t.pave(x0 - 0.1, bas, z1 - 0.1, x1 + 0.1, haut, z1 + 0.1, CREME);
  t.pave(x0 - 0.1, bas, z0 - 0.1, x1 + 0.1, haut, z0 + 0.1, CREME);
  t.pave(x0 - 0.1, bas, z0 + 0.1, x0 + 0.1, haut, z1 - 0.1, ROUGE);
  t.pave(x1 - 0.1, bas, z0 + 0.1, x1 + 0.1, haut, z1 - 0.1, ROUGE);
  plaque(t, a.l + 0.2, haut - bas, matFronton, { x: a.x, y: (bas + haut) / 2, z: z1 + 0.105 });
  plaque(t, a.l + 0.2, haut - bas, matFronton, { x: a.x, y: (bas + haut) / 2, z: z0 - 0.105, ry: Math.PI });
  // Les poutres sous les plaques (on les voit là où les plaques manquent)
  for (const z of [z0 + 2, a.z, z1 - 2]) t.pave(x0 + 0.1, 4.62, z - 0.1, x1 - 0.1, 4.85, z + 0.1, 0x6e6a63, matiere(0.6, 0.4));
  for (let x = x0 + 2.5; x < x1 - 1; x += 2.5) t.pave(x - 0.08, 4.65, z0 + 0.1, x + 0.08, 4.83, z1 - 0.1, 0x6e6a63, matiere(0.6, 0.4));
  // Les plaques du toit : crème, tachées, certaines manquent, une pend.
  const nx = 8;
  const nz = 4;
  const pl = (a.l - 0.2) / nx;
  const pp = (a.p - 0.2) / nz;
  for (let i = 0; i < nx; i++) {
    for (let k = 0; k < nz; k++) {
      const px = x0 + 0.1 + (i + 0.5) * pl;
      const pz = z0 + 0.1 + (k + 0.5) * pp;
      if ((i === 0 && k === 3) || (i === 5 && k === 1)) continue; // arrachées
      if (i === 1 && k === 3) {
        // Celle-ci pend encore par son bord nord.
        t.repere({ x: px, y: 4.9, z: pz - pp / 2, rx: 1.05 }, () => t.boite(pl - 0.04, 0.06, pp - 0.04, 0xcfc9bb, { z: pp / 2 }));
        continue;
      }
      const sale = t.hasard();
      const teinte = sale < 0.15 ? 0xa9a294 : sale < 0.4 ? 0xcbc5b7 : 0xdcd7cb;
      t.boite(pl - 0.03, 0.08, pp - 0.03, teinte, { x: px, y: 4.92, z: pz }, matiere(), { nuance: 0.03 });
    }
  }
  // Mousse et feuilles mortes accumulées le long du bandeau nord et dans les coins
  const touffe = new THREE.IcosahedronGeometry(0.3, 0);
  for (let i = 0; i < 34; i++) {
    const nord = t.hasard() < 0.6;
    const px = nord ? x0 + 0.4 + t.hasard() * (a.l - 0.8) : t.hasard() < 0.5 ? x0 + 0.4 + t.hasard() * 1.2 : x1 - 0.4 - t.hasard() * 1.2;
    const pz = nord ? z0 + 0.3 + t.hasard() * 0.5 : z0 + 0.3 + t.hasard() * (a.p - 0.6);
    const s = 0.5 + t.hasard() * 0.9;
    t.poser(touffe, matiere(), t.hasard() < 0.6 ? 0x6d7f3e : 0x8a6a40, { x: px, y: 4.97, z: pz, ry: t.hasard() * 3, e: [s * 1.3, s * 0.14, s * 0.8] }, { nuance: 0.08, crasse: false });
  }
  // Les panneaux solaires de l'Abondance : deux tiennent encore, un est brisé, un manque (tombé au pied du pilier est).
  const matPanneau = matiereTexture(texturePanneauSolaire(false), { roughness: 0.35, metalness: 0.3 });
  const matPanneauCasse = matiereTexture(texturePanneauSolaire(true), { roughness: 0.35, metalness: 0.3 });
  [x0 + 4.5, x0 + 8, x0 + 11.5, x0 + 15].forEach((px, i) => {
    t.repere({ x: px, y: 4.96, z: z0 + 1.6 }, () => {
      for (const dx of [-0.75, 0.75]) {
        t.boite(0.06, 0.06, 1.2, 0x9aa0a6, { x: dx, y: 0.05 }, matiere(0.5, 0.5));
        t.boite(0.05, 0.42, 0.05, 0x9aa0a6, { x: dx, y: 0.24, z: -0.5 }, matiere(0.5, 0.5));
      }
      if (i === 3) return; // celui qui est tombé
      t.repere({ y: i === 2 ? 0.2 : 0.3, rx: -0.35 - (i === 2 ? 0.0 : 0), rz: i === 2 ? 0.28 : 0 }, () => {
        t.boite(1.7, 0.05, 1.1, 0xc9ccd0, {}, matiere(0.4, 0.5));
        t.poser(new THREE.PlaneGeometry(1.64, 1.04).rotateX(-Math.PI / 2), i === 2 ? matPanneauCasse : matPanneau, 0xffffff, { y: 0.03 }, { nuance: 0, crasse: false });
      });
    });
  });
  // La gaine du câble, qui descend le long du pilier est
  t.pave(x0 + 4.5, 4.98, z0 + 0.85, x1 - 1.5, 5.04, z0 + 0.92, 0x2b2b2b);

  const { objet, materiaux } = t.construireFondu();
  toits.push({ boite: { x: a.x, z: a.z, l: a.l + 0.2, p: a.p + 0.2 }, materiaux, bas, haut: 5.6 });
  return objet;
}

/** Deux îlots de pompes ; sur le second, une borne de recharge Watty. */
function creerPompes(c: Chantier): void {
  const a = STATION.auvent;
  const matEcran = matiereTexture(textureEcranPompe(), { roughness: 0.5 });
  const tuyau = new THREE.TorusGeometry(0.3, 0.028, 4, 10, Math.PI * 1.25);
  const pompe = (x: number, z: number, renversee: boolean) => {
    c.repere(renversee ? { x: x + 0.2, y: 0.33, z: z + 0.9, rx: Math.PI / 2 - 0.08, ry: 0.25 } : { x, y: 0.25, z }, () => {
      c.boite(0.7, 0.14, 0.55, 0x55524d, { y: 0.07 });
      c.boite(0.62, 1.45, 0.46, ROUGE, { y: 0.86 });
      c.boite(0.66, 0.5, 0.5, CREME, { y: 1.3 });
      c.boite(0.72, 0.3, 0.54, CREME, { y: 1.75 });
      c.boite(0.74, 0.07, 0.56, ROUGE, { y: 1.62 });
      for (const s of [1, -1]) {
        plaque(c, 0.5, 0.45, matEcran, { y: 1.3, z: s * 0.252, ry: s > 0 ? 0 : Math.PI });
        // Le pistolet dans son étui, le tuyau qui pend
        c.boite(0.08, 0.3, 0.12, 0x1f1f1f, { x: s * 0.36, y: 0.95 });
        c.poser(tuyau, matiere(0.6), 0x1f1f1f, { x: s * 0.36, y: 0.72, ry: Math.PI / 2, rz: s > 0 ? 0 : Math.PI });
      }
    });
  };
  [a.x - 4, a.x + 2].forEach((x, ilot) => {
    // L'îlot : bordure de béton, bouts peints en jaune et noir, un poteau de protection à chaque bout
    c.boite(3.6, 0.25, 1.3, 0xb8b2a6, { x, y: 0.125, z: a.z });
    for (const s of [-1, 1]) {
      c.boite(0.3, 0.27, 1.32, 0xd8c43a, { x: x + s * 1.66, y: 0.135, z: a.z });
      c.poser(new THREE.CylinderGeometry(0.09, 0.09, 0.9, 8), matiere(0.6, 0.2), 0xd8c43a, { x: x + s * 1.95, y: 0.45, z: a.z });
      c.boite(0.19, 0.14, 0.19, 0x1f1f1f, { x: x + s * 1.95, y: 0.6, z: a.z });
    }
    if (ilot === 0) {
      pompe(x - 0.95, a.z, false);
      // Une pompe arrachée de son socle, couchée vers la route ; la plaque d'ancrage reste
      c.boite(0.7, 0.04, 0.55, 0x55524d, { x: x + 0.95, y: 0.27, z: a.z });
      pompe(x + 0.95, a.z, true);
    } else {
      pompe(x - 0.95, a.z, false);
      // La borne de recharge Watty : blanche, liseré jaune, câble lové au sol
      c.repere({ x: x + 0.95, y: 0.25, z: a.z }, () => {
        c.boite(0.42, 1.75, 0.32, 0xeceae3, { y: 0.875 });
        c.boite(0.44, 0.18, 0.34, 0xd8c43a, { y: 1.65 });
        c.boite(0.3, 0.32, 0.02, 0x151a22, { y: 1.25, z: 0.17 });
        c.boite(0.3, 0.32, 0.02, 0x151a22, { y: 1.25, z: -0.17 });
        // L'éclair de Watty
        c.boite(0.06, 0.22, 0.02, ROUGE, { y: 0.8, z: 0.17, rz: 0.4 });
        c.boite(0.06, 0.22, 0.02, ROUGE, { x: 0.04, y: 0.62, z: 0.17, rz: 0.4 });
      });
      c.poser(new THREE.TorusGeometry(0.28, 0.045, 5, 12).rotateX(Math.PI / 2), matiere(0.6), 0x1f1f1f, { x: x + 1.2, y: 0.3, z: a.z + 0.95 });
      c.poser(new THREE.TorusGeometry(0.22, 0.045, 5, 12).rotateX(Math.PI / 2), matiere(0.6), 0x1f1f1f, { x: x + 1.3, y: 0.38, z: a.z + 0.9, rx: 0.2 });
    }
  });
}

/** Le totem des prix, à l'entrée du parking. */
function creerTotem(c: Chantier, g: THREE.Group): void {
  const a = STATION.auvent;
  c.repere({ x: a.x - 15, z: a.z + 4.5, rz: -0.05 }, () => {
    c.boite(1.1, 0.4, 0.8, 0xa9a59b, { y: 0.2 });
    c.boite(0.3, 5.5, 0.3, ACIER, { x: -0.45, y: 2.75 }, matiere(0.6, 0.4));
    c.boite(0.3, 5.5, 0.3, ACIER, { x: 0.45, y: 2.75 }, matiere(0.6, 0.4));
    c.boite(1.6, 3, 0.3, ROUGE, { y: 5.6 });
  });
  const panneau = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.8), new THREE.MeshStandardMaterial({ map: textureTotem(), roughness: 0.7 }));
  panneau.position.set(a.x - 15 + 0.28, 5.6, a.z + 4.5 + 0.16);
  panneau.rotation.z = -0.05;
  g.add(panneau);
}

// ---------- La grange effondrée, à l'écart de la route ----------

function creerFerme(): THREE.Group {
  const g = new THREE.Group();
  g.position.set(FERME_HALTE.x, 0, FERME_HALTE.z);
  const c = new Chantier(512);
  const h = () => c.hasard();
  const Lf = FERME_HALTE.largeur;
  const P = FERME_HALTE.profondeur;
  const tons = [PALETTE.pierre, PALETTE.pierreSombre, 0x9a9488, 0xa39b8a];
  // Murs de pierre sèche, à moitié tombés : bas au sud (côté route et caméra), plus hauts au nord.
  const mur = (x1: number, z1: number, x2: number, z2: number, hMin: number, hMax: number) => {
    const longueur = Math.hypot(x2 - x1, z2 - z1);
    const angle = Math.atan2(z2 - z1, x2 - x1);
    const n = Math.floor(longueur / 0.55);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const rangs = Math.max(1, Math.round((hMin + (hMax - hMin) * (0.5 + Math.sin(t * 9 + x1) * 0.5) - h() * 0.5) / 0.32));
      for (let r = 0; r < rangs; r++) {
        c.boite(0.56, 0.32, 0.5, tons[Math.floor(h() * tons.length)]!, {
          x: x1 + (x2 - x1) * t + (h() - 0.5) * 0.06,
          y: 0.16 + r * 0.32,
          z: z1 + (z2 - z1) * t + (h() - 0.5) * 0.06,
          ry: -angle + (h() - 0.5) * 0.1,
        });
      }
    }
  };
  mur(-Lf / 2, -P / 2, Lf / 2, -P / 2, 1.4, 2.6);
  mur(-Lf / 2, -P / 2, -Lf / 2, P / 2, 0.7, 2);
  mur(Lf / 2, -P / 2, Lf / 2, P / 2 - 2, 0.9, 1.9);
  mur(-Lf / 2, P / 2, -1.5, P / 2, 0.4, 1.1);
  // Pierres tombées
  for (let i = 0; i < 30; i++) {
    const cote = h() < 0.5;
    c.boite(0.45, 0.28, 0.4, tons[1]!, { x: cote ? (h() - 0.5) * Lf : (h() < 0.5 ? -1 : 1) * (Lf / 2 + (h() - 0.5) * 1.6), y: 0.12, z: cote ? (h() < 0.5 ? -1 : 1) * (P / 2 + (h() - 0.5) * 1.6) : (h() - 0.5) * P, rx: h(), ry: h() * 3 });
  }

  // La charpente : la moitié est tient encore, sous sa tôle rouillée ; la moitié ouest s'est effondrée.
  // Les poteaux restent ; tout ce qui est en l'air (sablières, fermes, tôles) s'efface quand on passe dessous.
  const t = new Chantier(513);
  const poteau = 0.24;
  const faitage = 5;
  const egout = 3.3;
  for (const x of [0, 2.75, 5.5]) {
    for (const z of [-P / 2, P / 2]) c.boite(poteau, egout, poteau, PALETTE.boisSombre, { x, y: egout / 2, z });
    // Les fermes : entrait et arbalétriers
    t.pave(x - 0.1, egout - 0.2, -P / 2 - 0.1, x + 0.1, egout, P / 2 + 0.1, PALETTE.bois);
    t.poutre(new THREE.Vector3(x, egout, -P / 2 - 0.3), new THREE.Vector3(x, faitage, 0), 0.2, PALETTE.boisSombre);
    t.poutre(new THREE.Vector3(x, egout, P / 2 + 0.3), new THREE.Vector3(x, faitage, 0), 0.2, PALETTE.boisSombre);
  }
  // Les sablières le long des murs
  for (const z of [-P / 2, P / 2]) t.pave(-0.1, egout - 0.1, z - 0.1, 5.6, egout + 0.1, z + 0.1, PALETTE.bois);
  // Côté ouest : poteaux cassés, chevrons tombés en travers
  c.boite(poteau, 1.6, poteau, PALETTE.boisSombre, { x: -2.75, y: 0.8, z: -P / 2, rz: 0.1 });
  c.boite(poteau, 0.9, poteau, PALETTE.boisSombre, { x: -2.75, y: 0.45, z: P / 2 });
  c.boite(poteau, 2.3, poteau, PALETTE.boisSombre, { x: -5.4, y: 1.15, z: -P / 2 + 0.2, rx: 0.15 });
  c.poutre(new THREE.Vector3(0, faitage, 0), new THREE.Vector3(-3.4, 0.1, 0.6), 0.22, PALETTE.boisSombre);
  c.poutre(new THREE.Vector3(0, egout, -P / 2), new THREE.Vector3(-2.6, 0.1, -2.2), 0.2, PALETTE.bois);
  c.poutre(new THREE.Vector3(-1.2, 0.1, 1.8), new THREE.Vector3(-4.6, 1.5, 3.6), 0.2, PALETTE.bois);
  c.poutre(new THREE.Vector3(-0.4, 0.2, -3.2), new THREE.Vector3(-4.8, 0.15, -1.2), 0.18, PALETTE.boisSombre);
  // Les tôles tombées de ce côté, en tas
  const tole = geoToleOndulee(0.9, 3, 0.2, 0.04);
  for (let i = 0; i < 7; i++) {
    c.poser(tole, matiere(0.7, 0.3), h() < 0.6 ? PALETTE.rouille : 0x8a5a3c, { x: -3.6 + h() * 3, y: 0.1 + i * 0.04, z: -1 + h() * 3, ry: h() * 3, rx: (h() - 0.5) * 0.4, rz: (h() - 0.5) * 0.4 }, { nuance: 0.12 });
  }

  // La tôle du toit (ce qui reste)
  const pente = Math.atan2(faitage - egout, P / 2 + 0.3);
  const longueur = Math.hypot(faitage - egout, P / 2 + 0.3);
  for (const s of [-1, 1]) {
    for (let x = -0.3; x < 5.8; x += 0.88) {
      if ((s > 0 && Math.abs(x - 2.34) < 0.1) || (s < 0 && Math.abs(x - 4.1) < 0.1)) continue; // tôles envolées
      const teinte = t.hasard() < 0.7 ? PALETTE.rouille : t.hasard() < 0.5 ? 0x8a5a3c : 0x8d9396;
      // La dernière rangée à l'ouest s'affaisse.
      const affaisse = x < 0 ? 0.25 : 0;
      t.poser(tole.clone().scale(1, 1, (longueur + 0.2) / 3), matiere(0.7, 0.3), teinte, {
        x: x + 0.44,
        y: (faitage + egout) / 2 + 0.05 - affaisse,
        z: (s * (P / 2 + 0.3)) / 2,
        rx: s * pente,
        rz: affaisse,
      }, { nuance: 0.12, crasse: false });
    }
  }
  // Le faîtage
  t.pave(-0.3, faitage - 0.02, -0.2, 5.8, faitage + 0.12, 0.2, 0x7d4a2e);
  const { objet, materiaux } = t.construireFondu();
  g.add(objet);
  g.userData.toits = [
    { boite: { x: FERME_HALTE.x + 2.75, z: FERME_HALTE.z, l: 6.6, p: P + 0.8 }, materiaux, bas: egout, haut: faitage + 0.2 },
  ] satisfies Toit[];

  // Bottes de foin rassises, grises de vieillesse, sous ce qui reste du toit
  for (let i = 0; i < 9; i++) {
    const r = Math.floor(i / 4);
    c.boite(1.05, 0.48, 0.55, i % 3 ? 0xb8a66a : 0xa49660, { x: 3.4 + (i % 4) * 0.5 - r * 0.2, y: 0.26 + r * 0.48, z: -2.8 + (i % 2) * 0.6, ry: (h() - 0.5) * 0.3 }, matiere(), { nuance: 0.08 });
  }
  const foin = new THREE.DodecahedronGeometry(1.2, 0);
  c.poser(foin, matiere(), 0x9c8f5e, { x: -2.4, y: 0.4, z: 0.4, e: [1.5, 0.45, 1.1] });
  // Une roue de charrette appuyée au mur, des orties, un sureau qui pousse dans l'angle
  c.poser(new THREE.TorusGeometry(0.55, 0.06, 4, 12), matiere(), PALETTE.boisSombre, { x: -Lf / 2 + 0.5, y: 0.6, z: 2.4, ry: Math.PI / 2, rz: 0.2 });
  for (let i = 0; i < 12; i++) {
    const s = 0.35 + h() * 0.45;
    c.poser(new THREE.IcosahedronGeometry(1, 0), matiere(), h() < 0.5 ? 0x4b6b3a : PALETTE.herbeSombre, { x: -Lf / 2 + 0.8 + h() * 4, y: s * 0.4, z: (h() < 0.5 ? -1 : 1) * (P / 2 - 0.7), e: [s * 1.2, s * 0.8, s] }, { nuance: 0.06 });
  }
  c.poser(new THREE.CylinderGeometry(0.08, 0.12, 2.2, 5).translate(0, 1.1, 0), matiere(), PALETTE.bois, { x: -Lf / 2 + 0.9, z: -P / 2 + 0.9, rz: 0.15 });
  for (let i = 0; i < 5; i++) {
    const s = 0.6 + h() * 0.4;
    c.poser(new THREE.IcosahedronGeometry(1, 0), matiere(), h() < 0.5 ? PALETTE.feuillage : PALETTE.feuillageClair, { x: -Lf / 2 + 0.6 + (h() - 0.5) * 1.4, y: 2 + h() * 0.8, z: -P / 2 + 1 + (h() - 0.5) * 1.4, e: [s, s * 0.8, s] }, { nuance: 0.05, crasse: false });
  }
  const pointsHerbe: [number, number][] = [];
  for (let i = 0; i < 70; i++) pointsHerbe.push([(h() - 0.5) * (Lf + 2), (h() < 0.5 ? -1 : 1) * (P / 2 + (h() - 0.3) * 0.9)]);
  for (let i = 0; i < 30; i++) pointsHerbe.push([(h() - 0.5) * Lf * 0.9, (h() - 0.5) * P * 0.9]);
  touffes(c, pointsHerbe);

  // Le vieux tracteur, rouillé sur place près de la grange
  c.repere({ x: Lf / 2 + 3.4, z: 3.4, ry: -0.5 }, () => creerTracteur(c));
  // L'abreuvoir de pierre, plein d'eau croupie
  c.repere({ x: -Lf / 2 - 2.2, z: 2.5, ry: 0.2 }, () => {
    c.boite(2, 0.6, 0.8, PALETTE.pierre, { y: 0.3 });
    c.boite(1.7, 0.05, 0.5, 0x4f5f4a, { y: 0.52 }, matiere(0.2, 0.2));
  });
  g.add(c.construire());
  return g;
}

/** Un tracteur des années d'Abondance : capot, gros pneus arrière, la rouille a pris la peinture. */
function creerTracteur(c: Chantier): void {
  const peinture = 0x9a3a28;
  const rouille = PALETTE.rouille;
  c.boite(1.9, 0.6, 0.75, peinture, { x: 0.6, y: 0.95 });
  c.boite(1.5, 0.08, 0.8, rouille, { x: 0.75, y: 1.28 });
  c.boite(0.25, 0.55, 0.7, 0x55524d, { x: 1.62, y: 0.95 });
  c.boite(0.8, 0.5, 0.6, 0x55524d, { x: 0.5, y: 0.5 }, matiere(0.6, 0.4));
  // Le poste de conduite, les ailes au-dessus des grandes roues
  c.boite(0.9, 0.35, 1.05, peinture, { x: -0.65, y: 0.85 });
  c.boite(0.45, 0.08, 0.45, 0x2b2b2b, { x: -0.85, y: 1.3 });
  c.boite(0.08, 0.5, 0.45, 0x2b2b2b, { x: -1.07, y: 1.55 });
  c.poser(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 4), matiere(), 0x2b2b2b, { x: -0.35, y: 1.4, rz: 0.6 });
  c.poser(new THREE.TorusGeometry(0.17, 0.025, 4, 10), matiere(), 0x2b2b2b, { x: -0.2, y: 1.6, rz: 0.6, ry: Math.PI / 2 });
  c.poser(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6), matiere(0.5, 0.4), 0x3a3633, { x: 1.2, y: 1.6, z: -0.2 });
  for (const s of [-1, 1]) {
    c.boite(0.9, 0.06, 0.4, rouille, { x: -0.7, y: 1.47, z: s * 0.68, rx: s * 0.1 });
    c.poser(new THREE.CylinderGeometry(0.75, 0.75, 0.4, 12).rotateX(Math.PI / 2), matiere(), 0x24221f, { x: -0.7, y: 0.75, z: s * 0.68 });
    c.poser(new THREE.CylinderGeometry(0.4, 0.4, 0.42, 8).rotateX(Math.PI / 2), matiere(0.6, 0.3), 0xb59048, { x: -0.7, y: 0.75, z: s * 0.68 });
  }
  // Une roue avant à plat, l'autre manque : l'essieu repose sur un parpaing.
  c.poser(new THREE.CylinderGeometry(0.4, 0.4, 0.22, 10).rotateX(Math.PI / 2), matiere(), 0x24221f, { x: 1.35, y: 0.33, z: 0.45, rz: 0.15, e: [1, 0.85, 1] });
  c.boite(0.4, 0.3, 0.3, 0x8e8b84, { x: 1.35, y: 0.15, z: -0.4 });
  // L'herbe a poussé au travers
  touffes(c, [[0, 0], [0.4, 0.3], [-0.4, -0.2], [1, 0], [-1.3, 0.2], [0.8, -0.4], [-0.6, 0.45]], PALETTE.herbe);
}

// ---------- Le goulet : un éboulis et des troncs tombés de part et d'autre de la route ----------

function creerGoulet(aleat: () => number): THREE.Group {
  // Tout est fusionné au chantier : quelques maillages au lieu de cent cinquante.
  const c = new Chantier(155);
  const roche = new THREE.DodecahedronGeometry(1, 0);
  const tronc = new THREE.CylinderGeometry(0.28, 0.36, 9, 7);
  const tas = (zMin: number, zMax: number) => {
    for (let i = 0; i < 70; i++) {
      const s = 0.6 + Math.pow(aleat(), 2) * 2.4;
      const teinte = aleat() < 0.5 ? PALETTE.pierre : PALETTE.pierreSombre;
      const x = GOULET.x + (aleat() - 0.5) * GOULET.largeur;
      const z = zMin + aleat() * (zMax - zMin);
      const e: [number, number, number] = [s, s * (0.55 + aleat() * 0.4), s * (0.8 + aleat() * 0.4)];
      c.poser(roche, matiere(), teinte, { x, y: s * 0.35, z, e, rx: aleat() * 3, ry: aleat() * 3, rz: aleat() * 3 }, { nuance: 0.05 });
    }
    for (let i = 0; i < 4; i++) {
      const x = GOULET.x + (aleat() - 0.5) * 4;
      const y = 0.9 + aleat() * 0.6;
      const z = zMin + aleat() * (zMax - zMin);
      c.poser(tronc, matiere(), PALETTE.bois, { x, y, z, rx: Math.PI / 2, rz: (aleat() - 0.5) * 1.2 });
    }
  };
  tas(9, ROUTE.z - ROUTE.demiLargeur - 0.6);
  tas(ROUTE.z + ROUTE.demiLargeur + 0.6, 61);
  return c.construire();
}

// ---------- Poteaux électriques penchés, fils qui pendent : l'Abondance s'est arrêtée ici ----------

function creerPoteaux(aleat: () => number): THREE.Group {
  const g = new THREE.Group();
  const z = ROUTE.z - ROUTE.demiLargeur - 2.4;
  const tetes: THREE.Vector3[] = [];
  for (let x = 4; x < L; x += 24) {
    const p = new THREE.Group();
    p.position.set(x, 0, z);
    p.rotation.set((aleat() - 0.5) * 0.12, 0, (aleat() - 0.5) * 0.15);
    p.add(boite(0.24, 7, 0.24, PALETTE.boisSombre, 0, 3.5, 0));
    p.add(boite(0.14, 0.14, 1.6, PALETTE.boisSombre, 0, 6.6, 0));
    g.add(p);
    p.updateMatrixWorld();
    tetes.push(new THREE.Vector3(0, 6.7, 0.7).applyMatrix4(p.matrixWorld));
  }
  // Les fils : une chaînette qui pend, parfois cassée et traînant au sol
  const matFil = new THREE.LineBasicMaterial({ color: 0x1f1f1f });
  for (let i = 0; i < tetes.length - 1; i++) {
    const a = tetes[i]!;
    const b = tetes[i + 1]!;
    const casse = aleat() < 0.25;
    const points: THREE.Vector3[] = [];
    for (let k = 0; k <= 16; k++) {
      const t = k / 16;
      const fleche = casse ? 0 : Math.sin(t * Math.PI) * 1.4;
      const p = a.clone().lerp(b, t);
      p.y -= fleche;
      if (casse && t > 0.35) p.y = Math.max(0.05, a.y - (t - 0.35) * 30);
      points.push(p);
    }
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), matFil));
  }
  return g;
}

// ---------- Herbes folles, y compris dans les fissures ----------

function creerHerbes(aleat: () => number): THREE.Object3D {
  const brin = (angle: number) =>
    new THREE.ConeGeometry(0.05, 0.42, 3).translate(0, 0.21, 0).rotateZ(0.3).rotateY(angle).translate(Math.cos(angle) * 0.05, 0, Math.sin(angle) * 0.05);
  const touffes = new THREE.InstancedMesh(fusionner([brin(0), brin(2.1), brin(4.2)]), materiau(0xffffff), 1400);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const teinte = new THREE.Color();
  for (let i = 0; i < touffes.count; i++) {
    const x = aleat() * L;
    const z = 9 + aleat() * 52;
    const surRoute = Math.abs(z - ROUTE.z) < ROUTE.demiLargeur;
    // Sur la route, seulement quelques touffes dans les fissures.
    if (surRoute && aleat() < 0.85) continue;
    if (Math.abs(x - 105) < 21 && z > 11 && z < 32) continue;
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), aleat() * Math.PI * 2);
    const s = (surRoute ? 0.6 : 0.8) + aleat() * 0.9;
    m.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(s, s, s));
    touffes.setMatrixAt(i, m);
    touffes.setColorAt(i, teinte.setHex(aleat() < 0.55 ? PALETTE.herbeSeche : PALETTE.herbe).offsetHSL(0, 0, (aleat() - 0.5) * 0.08));
  }
  touffes.receiveShadow = true;
  // Triées touffe par touffe (lots.ts) : à la halte, 1 400 touffes, dont la plupart hors champ.
  return trierParInstance(touffes);
}

// ---------- Petits débris le long de la route ----------

function creerDebris(aleat: () => number): THREE.Group {
  const c = new Chantier(156);
  const canette = new THREE.CylinderGeometry(0.035, 0.035, 0.12, 6);
  const pneu = new THREE.TorusGeometry(0.3, 0.11, 5, 10);
  for (let i = 0; i < 30; i++) {
    const x = 5 + aleat() * (L - 10);
    const z = ROUTE.z + (aleat() < 0.5 ? -1 : 1) * (ROUTE.demiLargeur + 0.4 + aleat() * 2);
    const genre = aleat();
    if (genre < 0.4) {
      const teinte = aleat() < 0.5 ? 0xc8362b : 0x2f6fa4;
      c.poser(canette, matiere(0.5, 0.5), teinte, { x, y: 0.035, z, rx: Math.PI / 2, ry: aleat() * 3 }, { crasse: false });
    } else if (genre < 0.7) {
      c.poser(pneu, matiere(), 0x1f1f1f, { x, y: 0.1, z, rx: Math.PI / 2 });
    } else {
      c.boite(1.2, 0.04, 0.2, PALETTE.boisSombre, { x, y: 0.03, z, ry: aleat() * 3 });
    }
  }
  return c.construire();
}

// ---------- À l'est : la route est barrée par les Compteurs (le comptoir ouvre à l'É4) ----------

function creerBarrage(): THREE.Group {
  const g = new THREE.Group();
  g.position.set(L - 0.6, 0, ROUTE.z);
  for (const dz of [-2.6, 2.6]) {
    const chevalet = new THREE.Group();
    chevalet.position.z = dz;
    chevalet.add(boite(0.1, 1.1, 0.1, PALETTE.boisSombre, 0, 0.55, -0.4));
    chevalet.add(boite(0.1, 1.1, 0.1, PALETTE.boisSombre, 0, 0.55, 0.4));
    g.add(chevalet);
  }
  const planche = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.5, 6.4),
    new THREE.MeshStandardMaterial({
      map: texture(512, 40, (c) => {
        for (let i = 0; i < 16; i++) {
          c.fillStyle = i % 2 ? "#c8362b" : "#e9dfc6";
          c.beginPath();
          c.moveTo(i * 32, 40);
          c.lineTo(i * 32 + 20, 0);
          c.lineTo(i * 32 + 52, 0);
          c.lineTo(i * 32 + 32, 40);
          c.fill();
        }
      }),
      roughness: 0.8,
    }),
  );
  planche.position.y = 1.0;
  planche.castShadow = true;
  g.add(planche);
  const avis = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 1.1),
    new THREE.MeshStandardMaterial({
      map: texture(180, 220, (c) => {
        c.fillStyle = "#f2ead6";
        c.fillRect(0, 0, 180, 220);
        c.fillStyle = "#1c2333";
        c.font = "bold 20px 'Courier New', monospace";
        c.textAlign = "center";
        c.fillText("AVIS", 90, 34);
        c.font = "15px 'Courier New', monospace";
        ["Comptoir du", "Carrefour :", "ouverture", "prochaine.", "", "Les Compteurs"].forEach((l, i) => c.fillText(l, 90, 70 + i * 22));
        c.strokeStyle = "#1f7a6d";
        c.lineWidth = 3;
        c.strokeRect(36, 178, 108, 30);
        c.fillStyle = "#1f7a6d";
        c.font = "bold 12px 'Courier New', monospace";
        c.fillText("VÉRIFIÉ", 90, 198);
      }),
      roughness: 0.9,
    }),
  );
  avis.position.set(-0.06, 1.35, 1.2);
  avis.rotation.y = -Math.PI / 2;
  g.add(avis);
  // Les quatre pieds des chevalets fondus en un seul maillage (2026-10-09) : 3 appels au lieu de 6. Même image.
  fusionnerStatique(g);
  return g;
}

// ---------- La boutique de la station (moment-vitrine n° 4) ----------

function textureCarrelage(): THREE.CanvasTexture {
  const aleat = aleatoire(620);
  return texture(256, 256, (c) => {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        c.fillStyle = (x + y) % 2 ? "#a9a291" : "#ddd5c2";
        c.fillRect(x * 32, y * 32, 32, 32);
      }
    }
    // Les joints
    c.strokeStyle = "rgba(90, 82, 70, 0.6)";
    c.lineWidth = 1.5;
    for (let i = 0; i <= 8; i++) {
      c.beginPath();
      c.moveTo(i * 32, 0);
      c.lineTo(i * 32, 256);
      c.moveTo(0, i * 32);
      c.lineTo(256, i * 32);
      c.stroke();
    }
    // Saleté, traces de pas, carreaux cassés
    taches(c, aleat, 10, "rgba(80, 66, 50, 0.22)", 10, 34, 256, 256);
    c.fillStyle = "rgba(60, 50, 40, 0.16)";
    for (let i = 0; i < 70; i++) c.fillRect(aleat() * 256, aleat() * 256, 3 + aleat() * 12, 1 + aleat() * 3);
    c.strokeStyle = "rgba(40, 32, 26, 0.65)";
    for (const [x, y] of [
      [70, 34],
      [166, 150],
      [40, 200],
    ] as const) {
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 14, y + 16);
      c.lineTo(x + 8, y + 28);
      c.moveTo(x + 14, y + 16);
      c.lineTo(x + 26, y + 12);
      c.stroke();
    }
  });
}

function textureEnseigneBoutique(): THREE.CanvasTexture {
  const aleat = aleatoire(207);
  return texture(1024, 66, (c) => {
    c.fillStyle = "#e9dfc6";
    c.fillRect(0, 0, 1024, 66);
    c.fillStyle = "#c8362b";
    c.fillRect(0, 0, 1024, 8);
    c.fillRect(0, 58, 1024, 8);
    // « BOUTIQUE » au-dessus de la porte (porte au 8,1 m des 14 m de façade)
    c.font = "900 40px 'Futura', 'Avenir Next Condensed', 'Arial Black', sans-serif";
    c.textAlign = "center";
    c.fillText("BOUTIQUE", 592, 48);
    c.fillStyle = "#1c2333";
    c.font = "bold 20px 'Futura', 'Arial Black', sans-serif";
    c.fillText("ABONDANCE", 210, 30);
    c.fillStyle = "#3b2a1e";
    c.font = "italic 17px Georgia, serif";
    c.fillText("ouvert 24 h / 24 · 7 j / 7", 210, 52);
    // Le logo : un rond rouge, l'éclair de Watty
    c.fillStyle = "#c8362b";
    c.beginPath();
    c.arc(880, 33, 22, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#e8c547";
    c.beginPath();
    c.moveTo(884, 16);
    c.lineTo(872, 36);
    c.lineTo(882, 36);
    c.lineTo(876, 52);
    c.lineTo(890, 30);
    c.lineTo(880, 30);
    c.fill();
    // « Ouvert » corrigé au feutre
    c.strokeStyle = "#1f2a44";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(130, 46);
    c.lineTo(290, 44);
    c.stroke();
    c.fillStyle = "#1f2a44";
    c.font = "italic bold 18px 'Marker Felt', 'Comic Sans MS', sans-serif";
    c.fillText("pillé.", 330, 54);
    // Rouille, coulures
    for (let i = 0; i < 40; i++) {
      const x = aleat() * 1024;
      const d = c.createLinearGradient(0, 8, 0, 58);
      d.addColorStop(0, "rgba(130, 70, 40, 0.4)");
      d.addColorStop(1, "rgba(130, 70, 40, 0)");
      c.fillStyle = d;
      c.fillRect(x, 8, 2 + aleat() * 3, 20 + aleat() * 30);
    }
  });
}

function textureEnseigneToit(): THREE.CanvasTexture {
  const aleat = aleatoire(208);
  return texture(512, 120, (c) => {
    c.fillStyle = "#c8362b";
    c.fillRect(0, 0, 512, 120);
    c.fillStyle = "#e9dfc6";
    c.fillRect(8, 8, 496, 104);
    c.fillStyle = "#c8362b";
    c.font = "900 64px 'Futura', 'Avenir Next Condensed', 'Arial Black', sans-serif";
    c.textAlign = "center";
    c.fillText("BOUTIQUE", 226, 84);
    // Le rond de Watty, l'éclair
    c.beginPath();
    c.arc(452, 60, 40, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#e8c547";
    c.beginPath();
    c.moveTo(460, 26);
    c.lineTo(436, 66);
    c.lineTo(454, 66);
    c.lineTo(442, 96);
    c.lineTo(472, 52);
    c.lineTo(454, 52);
    c.fill();
    // Délavée, rouillée par les coins
    taches(c, aleat, 10, "rgba(120, 70, 40, 0.35)", 8, 30, 512, 120);
    c.fillStyle = "rgba(233, 223, 198, 0.15)";
    c.fillRect(0, 0, 512, 120);
  });
}

function textureVitrine(): THREE.CanvasTexture {
  return texture(128, 160, (c) => {
    c.clearRect(0, 0, 128, 160);
    // Une affichette de promotion, jaune et rouge, décolorée
    c.fillStyle = "#e8d06a";
    c.fillRect(6, 6, 116, 70);
    c.fillStyle = "#c8362b";
    c.font = "900 30px 'Arial Black', sans-serif";
    c.textAlign = "center";
    c.fillText("PROMO", 64, 40);
    c.font = "bold 18px sans-serif";
    c.fillText("-50 % !", 64, 66);
    // Watty : « Faites le plein de bonheur »
    c.fillStyle = "#e9dfc6";
    c.fillRect(20, 86, 88, 70);
    c.fillStyle = "#d8c43a";
    c.fillRect(54, 92, 20, 38);
    c.fillStyle = "#c8362b";
    c.fillRect(54, 92, 20, 6);
    c.fillStyle = "#3b2a1e";
    c.font = "bold 11px sans-serif";
    c.fillText("le plein", 64, 144);
    c.fillText("de bonheur", 64, 154);
  });
}

function textureFissures(): THREE.CanvasTexture {
  return texture(128, 128, (c) => {
    c.clearRect(0, 0, 128, 128);
    c.strokeStyle = "rgba(235, 242, 248, 0.9)";
    c.lineWidth = 1.2;
    for (let i = 0; i < 11; i++) {
      c.beginPath();
      c.moveTo(48, 58);
      let x = 48;
      let y = 58;
      const a = i * 0.57;
      for (let k = 0; k < 4; k++) {
        x += Math.cos(a + k * 0.2) * 20;
        y += Math.sin(a + k * 0.2) * 20;
        c.lineTo(x, y);
      }
      c.stroke();
    }
    c.beginPath();
    c.arc(48, 58, 10, 0, Math.PI * 2);
    c.arc(48, 58, 22, 0, Math.PI * 2);
    c.stroke();
  });
}

function textureTabac(): THREE.CanvasTexture {
  const aleat = aleatoire(19);
  return texture(256, 128, (c) => {
    c.fillStyle = "#3b2a1e";
    c.fillRect(0, 0, 256, 128);
    const couleurs = ["#c8362b", "#e9dfc6", "#2f6fa4", "#d8c43a", "#1c2333", "#2f7a3a"];
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 14; x++) {
        if (aleat() < 0.62) continue; // pillé
        c.fillStyle = couleurs[Math.floor(aleat() * couleurs.length)]!;
        c.fillRect(6 + x * 18, 6 + y * 20, 14, 16);
      }
      c.fillStyle = "#6b4a32";
      c.fillRect(0, 24 + y * 20, 256, 3);
    }
    c.fillStyle = "#c8362b";
    c.fillRect(0, 0, 256, 4);
  });
}

function texturePaillasson(): THREE.CanvasTexture {
  return texture(128, 80, (c) => {
    c.fillStyle = "#7a2a22";
    c.fillRect(0, 0, 128, 80);
    c.strokeStyle = "#e9dfc6";
    c.lineWidth = 3;
    c.strokeRect(8, 8, 112, 64);
    c.fillStyle = "#e9dfc6";
    c.font = "bold 15px 'Futura', 'Arial Black', sans-serif";
    c.textAlign = "center";
    c.fillText("BIENVENUE", 64, 46);
    c.fillStyle = "rgba(60, 40, 20, 0.4)";
    c.fillRect(20, 50, 60, 22);
  });
}

function textureCaisse(): THREE.CanvasTexture {
  return texture(128, 32, (c) => {
    c.fillStyle = "#1c2333";
    c.fillRect(0, 0, 128, 32);
    c.fillStyle = "#e8c547";
    c.font = "bold 20px 'Futura', 'Arial Black', sans-serif";
    c.textAlign = "center";
    c.fillText("CAISSE", 64, 24);
  });
}

/** Un éclat de verre : un triangle posé dans le plan de la vitre. */
function eclat(c: Chantier, mat: THREE.Material, x: number, y: number, z: number, l: number, h: number, ry = 0): void {
  const forme = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(l, 0), new THREE.Vector2(l * 0.3, h)]);
  c.poser(new THREE.ShapeGeometry(forme), mat, 0xffffff, { x, y, z, ry }, { nuance: 0, crasse: false });
}

/** Des produits sur une étagère : boîtes et bouteilles de couleur, rares (c'est pillé). */
function produits(c: Chantier, x0: number, x1: number, y: number, z: number, profondeur: number, part: number): void {
  const couleurs = [ROUGE, 0xd8c43a, 0x2f6fa4, CREME, 0x2f7a3a, 0xc87a2b];
  for (let x = x0 + 0.1; x < x1 - 0.1; x += 0.16) {
    if (c.hasard() > part) continue;
    const haut = 0.14 + c.hasard() * 0.16;
    const couche = c.hasard() < 0.2;
    c.boite(0.12, haut, 0.12, couleurs[Math.floor(c.hasard() * couleurs.length)]!, {
      x,
      y: y + (couche ? 0.06 : haut / 2),
      z: z + (c.hasard() - 0.5) * profondeur,
      rz: couche ? Math.PI / 2 : 0,
      ry: c.hasard(),
    }, matiere(0.6), { nuance: 0.1, crasse: false });
  }
}

/** Une gondole (étagère double face) de longueur l, posée dans le repère courant (long axe x). */
function gondole(c: Chantier, l: number, h: number, part: number): void {
  const metal = matiere(0.5, 0.4);
  c.boite(l, 0.12, 0.8, 0x6e6a63, { y: 0.06 });
  c.boite(l, h, 0.06, 0xb9bdc0, { y: h / 2 }, metal);
  for (const dx of [-l / 2, l / 2]) c.boite(0.05, h, 0.8, 0x9aa0a6, { x: dx, y: h / 2 }, metal);
  for (let k = 0; k < 4; k++) {
    const y = 0.15 + k * (h - 0.25) / 3;
    for (const s of [-1, 1]) {
      c.boite(l - 0.06, 0.03, 0.36, 0xc9ccd0, { y, z: s * 0.21 }, metal);
      produits(c, -l / 2, l / 2, y + 0.015, s * 0.21, 0.2, part);
    }
  }
}

function creerBoutique(toits: Toit[]): THREE.Group {
  const g = new THREE.Group();
  const b = STATION.boutique;
  const xa = b.x - b.l / 2;
  const xb = b.x + b.l / 2;
  const za = b.z - b.p / 2;
  const zb = b.z + b.p / 2;
  const H = 3.6;
  const SOCLE = 0.6;
  const p = BOUTIQUE.porte;
  const px0 = p.x - p.largeur / 2;
  const px1 = p.x + p.largeur / 2;
  const fz = p.z; // le plan de la façade

  // Trois chantiers : ce qui reste (sol, socles, intérieur), ce qui s'efface devant (toit, façade, mur est),
  // ce qui s'efface au fond (murs nord et ouest, seulement quand on est derrière).
  const c = new Chantier(640);
  const devant = new Chantier(641);
  const fond = new Chantier(642);
  const enduit = matiereTexture(textureEnduit(643, "#d6ccb4"));
  const enduitFond = matiereTexture(textureEnduit(644, "#d6ccb4"));
  const verre = matiereVerre(0x3a5560, 0.42);
  const alu = matiere(0.45, 0.6);
  const cadre = 0x3a3d42;

  // Le sol : dalle et carrelage, un seuil d'aluminium à la porte
  c.pave(xa, 0, za, xb, 0.1, zb, 0x8e8b84);
  const tex = textureCarrelage();
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set((b.l - 0.6) / 2.4, (b.p - 0.6) / 2.4);
  const carrelage = new THREE.Mesh(new THREE.PlaneGeometry(b.l - 0.6, b.p - 0.6).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
  carrelage.position.set(b.x, 0.105, b.z);
  carrelage.receiveShadow = true;
  g.add(carrelage);
  c.pave(px0, 0, fz - 0.15, px1, 0.13, fz + 0.2, 0xb9bdc0, alu);

  // Les murs, d'après les boîtes de collision (BOUTIQUE.murs) : un socle qui reste, le haut qui s'efface.
  for (const m of BOUTIQUE.murs) {
    const facade = Math.abs(m.z - fz) < 0.01;
    const nord = Math.abs(m.z - (za + 0.15)) < 0.01;
    const ouest = Math.abs(m.x - (xa + 0.15)) < 0.01;
    const x1 = m.x - m.l / 2;
    const x2 = m.x + m.l / 2;
    const z1 = m.z - m.p / 2;
    const z2 = m.z + m.p / 2;
    // Le socle : carrelage brun sous les vitrines, enduit ailleurs
    c.pave(x1, 0, z1, x2, SOCLE, z2, facade ? 0x6e4a3c : 0xc4b99f);
    if (facade) continue;
    (nord || ouest ? fond : devant).pave(x1, SOCLE, z1, x2, H, z2, 0xffffff, nord || ouest ? enduitFond : enduit, { nuance: 0 });
  }
  // La façade vitrée : montants et traverses d'aluminium sombre, vitres, bandeau de l'enseigne.
  const vitres: [number, number, "entiere" | "brisee" | "planches" | "fendue"][] = [
    [xa + 0.2, 98.4, "entiere"],
    [98.5, 100.85, "brisee"],
    [100.95, px0 - 0.1, "planches"],
    [px1 + 0.1, 107.4, "fendue"],
    [107.5, xb - 0.2, "brisee"],
  ];
  const haut = 2.75;
  for (const x of [xa + 0.1, 98.45, 100.9, 107.45, xb - 0.1]) devant.pave(x - 0.07, SOCLE, fz - 0.1, x + 0.07, haut, fz + 0.1, cadre, alu);
  for (const [x1, x2] of [
    [xa, px0],
    [px1, xb],
  ] as const) {
    devant.pave(x1, SOCLE - 0.02, fz - 0.14, x2, SOCLE + 0.06, fz + 0.14, 0xb9bdc0, alu);
    devant.pave(x1, haut - 0.06, fz - 0.12, x2, haut, fz + 0.12, cadre, alu);
  }
  const verreFendu = matiereTexture(textureFissures(), { transparent: true, roughness: 0.2, metalness: 0.2, depthWrite: false });
  verreFendu.userData.sansOmbre = true;
  const affichettes = matiereTexture(textureVitrine(), { transparent: true, alphaTest: 0.1 });
  affichettes.userData.sansOmbre = true;
  const hv = haut - SOCLE - 0.06;
  const yv = SOCLE + 0.03 + hv / 2;
  for (const [x1, x2, etat] of vitres) {
    const lv = x2 - x1;
    const xm = (x1 + x2) / 2;
    if (etat === "brisee") {
      // Ne restent que des éclats pris dans le cadre ; le reste est par terre.
      eclat(devant, verre, x1, SOCLE + 0.06, fz, lv * 0.45, hv * 0.4);
      eclat(devant, verre, x2, SOCLE + 0.06, fz, -lv * 0.3, hv * 0.55);
      devant.repere({ x: x1, y: haut - 0.06, z: fz, rz: Math.PI }, () => eclat(devant, verre, 0, 0, 0, -lv * 0.6, hv * 0.35));
      continue;
    }
    devant.poser(new THREE.PlaneGeometry(lv, hv), verre, 0xffffff, { x: xm, y: yv, z: fz }, { nuance: 0, crasse: false });
    if (etat === "fendue") plaque(devant, Math.min(lv, hv), Math.min(lv, hv), verreFendu, { x: xm - 0.2, y: yv + 0.1, z: fz + 0.01 });
    if (etat === "entiere") plaque(devant, 0.8, 1, affichettes, { x: xm + 0.3, y: yv + 0.15, z: fz + 0.012 });
    if (etat === "planches") {
      // Les survivants ont cloué des planches devant celle-ci.
      for (let k = 0; k < 4; k++) {
        devant.boite(lv + 0.3, 0.24, 0.04, k % 2 ? PALETTE.bois : 0x8a6a48, { x: xm, y: SOCLE + 0.35 + k * 0.5, z: fz + 0.14, rz: (devant.hasard() - 0.5) * 0.18 });
      }
      devant.boite(0.22, hv + 0.2, 0.04, PALETTE.boisSombre, { x: xm + 0.4, y: yv, z: fz + 0.17, rz: 0.55 });
    }
  }
  // Le bandeau de l'enseigne, au-dessus des vitrines et de la porte
  devant.pave(xa, haut, fz - 0.15, xb, H, fz + 0.15, CREME);
  plaque(devant, b.l, H - haut, matiereTexture(textureEnseigneBoutique(), { roughness: 0.75 }), { x: b.x, y: (haut + H) / 2, z: fz + 0.155 });

  // La porte : un cadre rouge qu'on voit de loin, un vantail ouvert en grand, l'autre arraché et couché dehors.
  const rougePorte = 0xa82e25;
  c.pave(px0 - 0.12, 0.1, fz - 0.16, px0, 2.35, fz + 0.16, rougePorte, matiere(0.5, 0.3));
  c.pave(px1, 0.1, fz - 0.16, px1 + 0.12, 2.35, fz + 0.16, rougePorte, matiere(0.5, 0.3));
  c.pave(px0 - 0.12, 2.25, fz - 0.16, px1 + 0.12, 2.42, fz + 0.16, rougePorte, matiere(0.5, 0.3));
  devant.poser(new THREE.PlaneGeometry(p.largeur, haut - 2.42), verre, 0xffffff, { x: p.x, y: (2.42 + haut) / 2, z: fz }, { nuance: 0, crasse: false });
  const vantail = (ch: Chantier, brise: boolean) => {
    // Un vantail de 0,75 m, gond à l'origine, qui s'étend vers -x quand il est fermé.
    ch.pave(-0.75, 0.05, -0.03, -0.69, 2.2, 0.03, rougePorte, matiere(0.5, 0.3));
    ch.pave(-0.06, 0.05, -0.03, 0, 2.2, 0.03, rougePorte, matiere(0.5, 0.3));
    ch.pave(-0.75, 0.05, -0.03, 0, 0.25, 0.03, rougePorte, matiere(0.5, 0.3));
    ch.pave(-0.75, 2.12, -0.03, 0, 2.2, 0.03, rougePorte, matiere(0.5, 0.3));
    ch.pave(-0.7, 1.0, -0.035, -0.05, 1.06, 0.035, 0xb9bdc0, alu);
    if (brise) eclat(ch, verre, -0.69, 0.25, 0, 0.5, 0.9);
    else ch.poser(new THREE.PlaneGeometry(0.63, 1.87), verre, 0xffffff, { x: -0.375, y: 1.185 }, { nuance: 0, crasse: false });
  };
  c.repere({ x: px1 - 0.02, y: 0.1, z: fz + 0.18, ry: 1.3 }, () => vantail(c, true));
  c.repere({ x: px0 - 0.3, y: 0.16, z: fz + 1.5, ry: 0.5, rx: -Math.PI / 2 }, () => vantail(c, false));
  // Le paillasson, et la marquise rouge au-dessus de l'entrée
  const paillasson = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.85).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: texturePaillasson(), roughness: 1 }));
  paillasson.position.set(p.x, 0.065, fz + 0.75);
  paillasson.rotation.y = 0.06;
  paillasson.receiveShadow = true;
  g.add(paillasson);
  // (sous le bandeau : on lit l'enseigne au-dessus)
  devant.repere({ x: p.x, y: 2.62, z: fz + 0.15 }, () => {
    devant.boite(2.2, 0.07, 0.8, ROUGE, { z: 0.4, rx: 0.2 });
    devant.boite(2.2, 0.16, 0.05, CREME, { y: -0.12, z: 0.8 });
  });

  // L'enseigne sur le toit, au-dessus de la porte : on la lit par-dessus l'auvent, de loin
  devant.repere({ x: p.x, y: H + 0.15, z: zb - 0.4 }, () => {
    for (const s of [-1, 1]) {
      devant.boite(0.1, 1.9, 0.1, 0x55524d, { x: s * 2, y: 0.95 }, alu);
      devant.poutre(new THREE.Vector3(s * 2, 1.5, -0.05), new THREE.Vector3(s * 2, 0, -1), 0.06, 0x55524d, alu);
    }
    devant.boite(4.7, 1.25, 0.14, ROUGE, { y: 1.35, rz: 0.02 });
  });
  plaque(devant, 4.5, 1.05, matiereTexture(textureEnseigneToit(), { roughness: 0.7 }), { x: p.x, y: H + 0.15 + 1.35, z: zb - 0.4 + 0.075, rz: 0.02 });

  // Le toit plat : membrane, acrotère, climatiseur rouillé, aérations, une branche tombée, un néon qui pend.
  devant.pave(xa - 0.1, H, za - 0.1, xb + 0.1, H + 0.15, zb + 0.1, 0x6e6a63);
  const membrane = textureToitPlat(645);
  membrane.wrapS = membrane.wrapT = THREE.RepeatWrapping;
  membrane.repeat.set(2, 1);
  devant.poser(new THREE.PlaneGeometry(b.l, b.p).rotateX(-Math.PI / 2), matiereTexture(membrane, { roughness: 0.95 }), 0xffffff, { x: b.x, y: H + 0.155, z: b.z }, { nuance: 0, crasse: false });
  for (const [x1, z1, x2, z2] of [
    [xa - 0.12, za - 0.12, xb + 0.12, za + 0.12],
    [xa - 0.12, zb - 0.12, xb + 0.12, zb + 0.12],
    [xa - 0.12, za, xa + 0.12, zb],
    [xb - 0.12, za, xb + 0.12, zb],
  ] as const) {
    devant.pave(x1, H, z1, x2, H + 0.42, z2, 0xc4b99f);
    devant.pave(x1 - 0.02, H + 0.42, z1 - 0.02, x2 + 0.02, H + 0.47, z2 + 0.02, 0x8a8f94, alu);
  }
  devant.repere({ x: 99.2, y: H + 0.15, z: 13.3, ry: 0.05 }, () => {
    devant.boite(1.3, 0.85, 1, 0x9aa0a6, { y: 0.43 }, matiere(0.5, 0.4));
    devant.poser(new THREE.CylinderGeometry(0.36, 0.36, 0.04, 12), matiere(0.6, 0.3), 0x2b2b2b, { y: 0.87 });
    devant.boite(0.25, 0.4, 0.25, PALETTE.rouille, { x: 0.5, y: 0.2, z: 0.4 });
  });
  for (const [x, z] of [
    [105.5, 13],
    [107.8, 15.8],
  ] as const) {
    devant.poser(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 8), matiere(0.5, 0.4), 0x8a8f94, { x, y: H + 0.45, z });
    devant.poser(new THREE.ConeGeometry(0.22, 0.18, 8), matiere(0.5, 0.4), 0x8a8f94, { x, y: H + 0.8, z });
  }
  devant.repere({ x: 108.6, y: H + 0.5, z: 12.5, ry: -0.6, rx: 0.5 }, () => {
    devant.poser(new THREE.SphereGeometry(0.42, 8, 3, 0, Math.PI * 2, 0, 0.9), matiere(0.6, 0.2), 0xd9d4c8, {});
    devant.boite(0.05, 0.45, 0.05, 0x55524d, { y: 0.15 });
  });
  devant.poutre(new THREE.Vector3(101.2, H + 0.25, 16.6), new THREE.Vector3(104.4, H + 0.45, 14.2), 0.14, PALETTE.boisSombre);
  for (let i = 0; i < 4; i++) {
    devant.poser(new THREE.IcosahedronGeometry(0.4, 0), matiere(), i % 2 ? PALETTE.feuillageSombre : 0x8a6a40, { x: 102 + i * 0.7, y: H + 0.35, z: 15.9 - i * 0.55, e: [1, 0.5, 1] }, { nuance: 0.06, crasse: false });
  }
  // Le néon décroché, qui pend sous le toit (on le voit quand le toit s'efface… il s'efface avec lui)
  devant.poutre(new THREE.Vector3(105.6, H - 0.05, 14.5), new THREE.Vector3(106.7, 2.1, 14.9), 0.08, 0xeceae3);
  // La descente d'eau, à l'angle sud-est
  devant.pave(xb - 0.05, 0.6, zb + 0.02, xb + 0.08, H + 0.3, zb + 0.15, 0x8a8f94, alu);
  // Une grande affiche de Watty sur le mur est, côté route
  plaque(devant, 1.5, 2, new THREE.MeshStandardMaterial({ map: textureAffiche(), roughness: 0.9, vertexColors: true }), { x: xb + 0.012, y: 1.9, z: 15.4, ry: Math.PI / 2, rz: 0.03 });

  // ---------- L'intérieur (reste toujours) ----------
  // Les frigos à boissons, contre le mur ouest : portes vitrées sombres, quelques bouteilles oubliées
  for (let k = 0; k < 3; k++) {
    const z1 = 12 + k * 1.55;
    c.pave(xa + 0.3, 0.1, z1, xa + 1.05, 2.2, z1 + 1.5, 0x3a3d42, matiere(0.6, 0.3));
    c.pave(xa + 0.3, 2.0, z1, xa + 1.08, 2.25, z1 + 1.5, ROUGE);
    for (let e = 0; e < 4; e++) {
      c.pave(xa + 0.35, 0.35 + e * 0.42, z1 + 0.05, xa + 1.0, 0.38 + e * 0.42, z1 + 1.45, 0x9aa0a6, matiere(0.5, 0.4));
      for (let i = 0; i < 9; i++) {
        if (c.hasard() < 0.7) continue;
        c.poser(new THREE.CylinderGeometry(0.04, 0.04, 0.24, 6), matiere(0.3), [0x2f7a3a, ROUGE, 0xc87a2b, 0x2f6fa4][i % 4]!, { x: xa + 0.75, y: 0.5 + e * 0.42, z: z1 + 0.15 + i * 0.15 }, { crasse: false });
      }
    }
    // Une porte arrachée de ses gonds, ouverte en grand
    const ouverte = k === 1;
    c.repere({ x: xa + 1.07, y: 0.15, z: z1 + 0.02, ry: ouverte ? -1.2 : 0 }, () => {
      c.pave(-0.02, 0, 0, 0.03, 1.85, 1.46, cadre, alu);
      c.poser(new THREE.PlaneGeometry(1.36, 1.75), verre, 0xffffff, { x: 0.04, y: 0.92, z: 0.73, ry: Math.PI / 2 }, { nuance: 0, crasse: false });
    });
  }
  // Le comptoir de caisse (boîte de collision BOUTIQUE.caisse) : façade rouge brique, plateau crème
  const cs = BOUTIQUE.caisse;
  c.pave(cs.x - cs.l / 2, 0.1, cs.z - cs.p / 2, cs.x + cs.l / 2, 1, cs.z + cs.p / 2, 0x8a3b2a);
  c.pave(cs.x - cs.l / 2 - 0.05, 1, cs.z - cs.p / 2 - 0.05, cs.x + cs.l / 2 + 0.05, 1.06, cs.z + cs.p / 2 + 0.08, 0xd9d4c8);
  plaque(c, 0.9, 0.22, matiereTexture(textureCaisse()), { x: cs.x + 0.6, y: 0.78, z: cs.z + cs.p / 2 + 0.01 });
  // La caisse enregistreuse, tiroir ouvert et vide ; le terminal de carte ; le présentoir à bonbons renversé
  c.boite(0.5, 0.26, 0.42, 0x2b2b2b, { x: cs.x - 0.3, y: 1.19, z: cs.z - 0.05 });
  c.boite(0.38, 0.12, 0.2, 0x151a22, { x: cs.x - 0.3, y: 1.4, z: cs.z - 0.15, rx: -0.5 });
  c.boite(0.44, 0.09, 0.38, 0x3a3d42, { x: cs.x - 0.3, y: 1.1, z: cs.z + 0.32 });
  c.boite(0.12, 0.05, 0.2, 0x1c2333, { x: cs.x + 0.6, y: 1.09, z: cs.z, ry: 0.4 });
  c.repere({ x: cs.x + 1.1, y: 1.12, z: cs.z, rz: 1.2 }, () => {
    c.boite(0.4, 0.12, 0.3, 0xd9d4c8);
    produits(c, -0.2, 0.2, 0.06, 0, 0.2, 0.9);
  });
  // Derrière la caisse : le meuble à tabac, à moitié vidé
  c.pave(cs.x - 1.8, 0.1, za + 0.3, cs.x + 1.8, 1.0, za + 0.8, 0x6b4a32);
  c.pave(cs.x - 1.8, 1.0, za + 0.3, cs.x + 1.8, 2.4, za + 0.62, 0x5a4130);
  plaque(c, 3.5, 1.3, matiereTexture(textureTabac()), { x: cs.x, y: 1.7, z: za + 0.63 });
  // Les gondoles : une debout contre le mur est, une renversée au milieu, une étagère murale au fond
  c.repere({ x: xb - 0.75, y: 0.1, z: 15.1, ry: Math.PI / 2 }, () => gondole(c, 3.2, 1.6, 0.3));
  c.repere({ x: 106.4, y: 0.52, z: 15.4, ry: 0.25, rx: Math.PI / 2 - 0.12 }, () => gondole(c, 2.6, 1.6, 0.15));
  c.repere({ x: 104.4, y: 0.1, z: za + 0.55 }, () => {
    c.pave(-1.5, 0, -0.25, 1.5, 1.8, -0.2, 0xb9bdc0, matiere(0.5, 0.4));
    for (let k = 0; k < 4; k++) {
      c.pave(-1.5, 0.15 + k * 0.5, -0.25, 1.5, 0.18 + k * 0.5, 0.2, 0xc9ccd0, matiere(0.5, 0.4));
      produits(c, -1.5, 1.5, 0.18 + k * 0.5, 0, 0.2, 0.25);
    }
  });
  // Par terre : boîtes de conserve, papiers, un panier, du verre brisé sous les vitrines, dedans et dehors
  const conserve = new THREE.CylinderGeometry(0.06, 0.06, 0.13, 7);
  for (let i = 0; i < 26; i++) {
    const dehors = i > 18;
    c.poser(conserve, matiere(0.5, 0.3), [ROUGE, 0xd8c43a, 0x2f6fa4][i % 3]!, {
      x: dehors ? p.x + (c.hasard() - 0.3) * 2.6 : xa + 1.5 + c.hasard() * 11,
      y: 0.165,
      z: dehors ? fz + 0.6 + c.hasard() * 2.2 : za + 1.2 + c.hasard() * 4,
      rx: Math.PI / 2,
      ry: c.hasard() * 3,
    }, { crasse: false });
  }
  for (let i = 0; i < 18; i++) {
    const dehors = i > 12;
    c.poser(new THREE.PlaneGeometry(0.24, 0.32).rotateX(-Math.PI / 2), matiere(), i % 4 ? CREME : 0xd9c9a0, {
      x: dehors ? p.x + (c.hasard() - 0.5) * 3 : xa + 1.2 + c.hasard() * 12,
      y: dehors ? 0.065 : 0.115,
      z: dehors ? fz + 0.4 + c.hasard() * 2.6 : za + 0.9 + c.hasard() * 4.6,
      ry: c.hasard() * 3,
    }, { crasse: false });
  }
  c.repere({ x: 103.3, y: 0.11, z: 16.2, ry: 0.7, rz: 1.5 }, () => {
    c.boite(0.5, 0.28, 0.35, ROUGE, { y: 0.14 }, matiere(0.6));
  });
  const verreSol = matiere(0.2, 0.3);
  for (const [x1, x2] of [
    [98.5, 100.85],
    [107.5, xb - 0.2],
  ] as const) {
    for (let i = 0; i < 18; i++) {
      const s = 0.1 + c.hasard() * 0.15;
      c.poser(new THREE.CircleGeometry(s, 3).rotateX(-Math.PI / 2), verreSol, 0xb9d3dc, { x: x1 + c.hasard() * (x2 - x1), y: c.hasard() < 0.5 ? 0.115 : 0.065, z: fz + (c.hasard() - 0.45) * 2.4, ry: c.hasard() * 3 }, { nuance: 0.1, crasse: false });
    }
  }
  // Les affiches de Watty, déchirées, au mur du fond (vues depuis l'intérieur ; elles s'effacent avec le mur)
  const matAffiche = new THREE.MeshStandardMaterial({ map: textureAffiche(), roughness: 0.9, vertexColors: true });
  for (const [x, rz, echelleY] of [
    [107, 0.06, 1],
    [108.4, -0.1, 0.62],
  ] as const) {
    plaque(fond, 0.85, 1.15 * echelleY, matAffiche, { x, y: 2.5 - (1 - echelleY) * 0.4, z: za + 0.31, rz });
  }

  g.add(c.construire());
  const avant = devant.construireFondu();
  const arriere = fond.construireFondu();
  g.add(avant.objet, arriere.objet);
  toits.push({ boite: { x: b.x, z: b.z, l: b.l + 0.2, p: b.p + 0.2 }, materiaux: avant.materiaux, bas: SOCLE, haut: H + 0.5 });
  for (const m of BOUTIQUE.murs.slice(0, 2)) toits.push({ boite: m, materiaux: arriere.materiaux, bas: SOCLE, haut: H + 0.5, horsDe: b });
  return g;
}

// ---------- L'atelier : deux baies, rideaux de fer coincés, une voiture restée sur le pont ----------

function textureParpaings(graine: number): THREE.CanvasTexture {
  const aleat = aleatoire(graine);
  return texture(256, 128, (c) => {
    c.fillStyle = "#bdb5a2";
    c.fillRect(0, 0, 256, 128);
    for (let r = 0; r < 8; r++) {
      for (let k = -1; k < 8; k++) {
        const x = k * 32 + (r % 2) * 16;
        const v = 175 + Math.floor(aleat() * 22);
        c.fillStyle = `rgb(${v}, ${v - 6}, ${v - 20})`;
        c.fillRect(x + 1, r * 16 + 1, 30, 14);
      }
    }
    taches(c, aleat, 8, "rgba(70, 60, 48, 0.3)", 10, 34, 256, 128);
    for (let i = 0; i < 20; i++) {
      const x = aleat() * 256;
      const d = c.createLinearGradient(0, 0, 0, 60);
      d.addColorStop(0, "rgba(120, 66, 40, 0.35)");
      d.addColorStop(1, "rgba(120, 66, 40, 0)");
      c.fillStyle = d;
      c.fillRect(x, 0, 3, 40 + aleat() * 30);
    }
    const pied = c.createLinearGradient(0, 100, 0, 128);
    pied.addColorStop(0, "rgba(0,0,0,0)");
    pied.addColorStop(1, "rgba(60, 72, 44, 0.5)");
    c.fillStyle = pied;
    c.fillRect(0, 100, 256, 28);
  });
}

function textureEnseigneAtelier(): THREE.CanvasTexture {
  return texture(512, 40, (c) => {
    c.fillStyle = "#2f4f6f";
    c.fillRect(0, 0, 512, 40);
    c.fillStyle = "#e9dfc6";
    c.font = "900 22px 'Futura', 'Arial Black', sans-serif";
    c.textAlign = "center";
    c.fillText("ATELIER · MÉCANIQUE · PNEUS", 256, 28);
    c.fillStyle = "rgba(160, 90, 50, 0.5)";
    c.fillRect(0, 34, 512, 6);
    c.fillStyle = "rgba(233, 223, 198, 0.25)";
    for (let i = 0; i < 30; i++) c.fillRect((i * 97) % 512, (i * 13) % 40, 6, 2);
  });
}

function creerAtelier(toits: Toit[]): THREE.Group {
  const g = new THREE.Group();
  const a = STATION.atelier;
  const xa = a.x - a.l / 2;
  const xb = a.x + a.l / 2;
  const za = a.z - a.p / 2;
  const zb = a.z + a.p / 2;
  const H = 4;
  const FAITE = 4.6;
  const SOCLE = 0.6;
  const e = 0.25;
  const c = new Chantier(700);
  const t = new Chantier(701);
  const blocs = matiereTexture(textureParpaings(702));
  const beige = 0xbdb5a2;
  const acier = matiere(0.55, 0.45);

  // Le sol : béton taché d'huile
  c.pave(xa, 0, za, xb, 0.08, zb, 0x6e6b66);
  for (let i = 0; i < 6; i++) c.poser(new THREE.CircleGeometry(0.4 + c.hasard() * 0.5, 8).rotateX(-Math.PI / 2), matiere(0.4), 0x34332f, { x: xa + 1 + c.hasard() * 7, y: 0.085, z: za + 1 + c.hasard() * 4, e: [1.4, 1, 1] }, { crasse: false });

  // Les murs : socle qui reste, le haut (en parpaings) qui s'efface quand on est derrière
  const baies = [
    [xa + 0.5, a.x - 0.25],
    [a.x + 0.25, xb - 0.5],
  ] as const;
  const piliers = [
    [xa, xa + 0.5],
    [a.x - 0.25, a.x + 0.25],
    [xb - 0.5, xb],
  ] as const;
  for (const [x1, x2] of piliers) {
    c.pave(x1, 0, zb - e, x2, SOCLE, zb, beige);
    t.pave(x1, SOCLE, zb - e, x2, H, zb, beige);
  }
  t.pave(xa, 3.3, zb - e, xb, H, zb, 0xffffff, blocs, { nuance: 0 });
  plaque(t, a.l - 0.4, 0.55, matiereTexture(textureEnseigneAtelier(), { roughness: 0.8 }), { x: a.x, y: 3.66, z: zb + 0.01 });
  for (const [x1, x2, z1, z2] of [
    [xa, xb, za, za + e],
    [xa, xa + e, za, zb - e],
    [xb - e, xb, za, zb - e],
  ] as const) {
    c.pave(x1, 0, z1, x2, SOCLE, z2, beige);
    t.pave(x1, SOCLE, z1, x2, H, z2, 0xffffff, blocs, { nuance: 0 });
  }
  // Les pignons, sous le faîtage
  const pignon = new THREE.Shape([new THREE.Vector2(-a.p / 2, 0), new THREE.Vector2(a.p / 2, 0), new THREE.Vector2(0, FAITE - H)]);
  const geoPignon = new THREE.ExtrudeGeometry(pignon, { depth: e, bevelEnabled: false }).rotateY(Math.PI / 2);
  for (const x of [xa, xb - e]) t.poser(geoPignon, matiere(), beige, { x, y: H, z: a.z });

  // Les rideaux de fer : coincés à mi-hauteur sur le noir, le second de travers et cabossé
  baies.forEach(([x1, x2], i) => {
    const l = x2 - x1;
    const xm = (x1 + x2) / 2;
    t.pave(x1 - 0.05, 3.05, zb - 0.1, x2 + 0.05, 3.35, zb + 0.18, 0x55524d, acier);
    const bas = i === 0 ? 1.05 : 1.45;
    t.repere({ x: xm, z: zb + 0.02, rz: i === 0 ? 0 : 0.035 }, () => {
      for (let y = bas; y < 3.05; y += 0.2) {
        const rouille = t.hasard() < 0.25;
        t.boite(l, 0.18, 0.05, rouille ? PALETTE.rouille : 0x8a8f94, { y: y + 0.09, rx: i === 1 && y < bas + 0.5 ? 0.18 : 0 }, acier, { nuance: 0.06 });
      }
      t.boite(l, 0.08, 0.1, 0x3a3d42, { y: bas }, acier);
    });
  });

  // Côté est (vu de la route) : porte de service, fenêtre à barreaux, échelle vers le toit, lierre
  t.pave(xb, 0.08, 15.2, xb + 0.06, 2.2, 16.2, 0x4d6070, acier);
  t.pave(xb, 1.1, 15.95, xb + 0.1, 1.2, 16.05, 0xb59048, acier);
  t.pave(xb, 1.5, 12.4, xb + 0.03, 2.3, 13.6, 0x151a22);
  for (let k = 0; k < 6; k++) t.pave(xb + 0.04, 1.5, 12.45 + k * 0.22, xb + 0.08, 2.3, 12.5 + k * 0.22, 0x3a3d42, acier);
  for (const z of [11.75, 12.25]) t.pave(xb + 0.15, 0.08, z - 0.03, xb + 0.21, 4.4, z + 0.03, 0x8a8f94, acier);
  for (let y = 0.4; y < 4.3; y += 0.35) t.pave(xb + 0.16, y, 11.75, xb + 0.2, y + 0.04, 12.25, 0x8a8f94, acier);
  lierre(t, xb + 0.02, 0.1, 14.2, Math.PI / 2, 2.2, 3.4, 80);
  t.pave(xb - 0.05, 0.6, zb + 0.02, xb + 0.08, H, zb + 0.15, 0x8a8f94, acier);

  // Le toit de tôle ondulée à deux pentes : rouille, deux tôles envolées, une plaque translucide
  const pente = Math.atan2(FAITE - H, a.p / 2 + 0.3);
  const longueur = Math.hypot(FAITE - H, a.p / 2 + 0.3) + 0.1;
  const tole = geoToleOndulee(0.98, longueur);
  const translucide = matiereVerre(0xd8e4d0, 0.55);
  let n = 0;
  for (const s of [-1, 1]) {
    for (let x = xa - 0.25; x < xb + 0.2; x += 0.95) {
      n++;
      if ((s > 0 && n === 5) || (s > 0 && n === 9) || (s < 0 && n === 13)) continue;
      const clair = s > 0 && n === 7;
      const teinte = t.hasard() < 0.4 ? 0x94573a : t.hasard() < 0.55 ? 0x8d9396 : 0x8a7a66;
      t.poser(tole, clair ? translucide : matiere(0.6, 0.35), clair ? 0xffffff : teinte, { x: x + 0.475, y: (H + FAITE) / 2 + 0.06, z: a.z + (s * (a.p / 2 + 0.3)) / 2, rx: s * pente }, { nuance: 0.1, crasse: false });
    }
  }
  // Pannes et faîtière (visibles par les trous)
  for (const s of [-1, 1]) for (const d of [0.9, 2.1]) t.pave(xa, H + (FAITE - H) * (1 - d / 3.3) - 0.12, a.z + s * d - 0.06, xb, H + (FAITE - H) * (1 - d / 3.3) - 0.02, a.z + s * d + 0.06, 0x55524d, acier);
  t.pave(xa - 0.25, FAITE + 0.02, a.z - 0.22, xb + 0.25, FAITE + 0.1, a.z + 0.22, 0x8d9396, acier);
  // La gouttière, le long de la façade
  t.pave(xa - 0.25, H - 0.12, zb + 0.28, xb + 0.25, H - 0.02, zb + 0.4, 0x8a8f94, acier);

  // ---------- L'intérieur (on le devine sous les rideaux, on le voit quand l'atelier s'efface) ----------
  // Le pont élévateur et la voiture restée dessus, roues démontées
  const xv = (baies[1][0] + baies[1][1]) / 2;
  for (const s of [-1, 1]) {
    c.pave(xv + s * 1.35 - 0.15, 0.08, a.z - 0.2, xv + s * 1.35 + 0.15, 2.8, a.z + 0.2, 0xc8362b, acier);
    c.pave(xv + s * 0.6, 1.3, a.z - 1.2, xv + s * 1.3, 1.38, a.z - 1.1, 0x55524d, acier);
    c.pave(xv + s * 0.6, 1.3, a.z + 1.1, xv + s * 1.3, 1.38, a.z + 1.2, 0x55524d, acier);
  }
  c.repere({ x: xv, y: 1.45, z: a.z + 0.2 }, () => {
    c.boite(1.6, 0.55, 3.7, 0x2f6fa4, { y: 0.3 }, matiere(0.45, 0.3));
    c.boite(1.45, 0.5, 1.9, 0x2f6fa4, { y: 0.8, z: -0.3 }, matiere(0.45, 0.3));
    c.boite(1.4, 0.38, 1.6, 0x1c2128, { y: 0.8, z: -0.3, e: [1.02, 1, 1.07] }, matiere(0.2, 0.3));
    c.boite(1.5, 0.04, 1.75, 0x2f6fa4, { y: 1.06, z: -0.3 }, matiere(0.45, 0.3));
    c.boite(1.62, 0.12, 0.3, 0xb9bdc0, { y: 0.15, z: 1.86 }, matiere(0.4, 0.6));
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const) c.poser(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 6).rotateZ(Math.PI / 2), matiere(0.5, 0.5), 0x55524d, { x: sx * 0.72, y: 0.05, z: sz * 1.2 });
  });
  // La chèvre et son moteur suspendu, l'établi, les pneus, le compresseur
  const xm = (baies[0][0] + baies[0][1]) / 2;
  c.poutre(new THREE.Vector3(xm - 0.8, 0.08, a.z + 1.4), new THREE.Vector3(xm, 2.6, a.z + 0.4), 0.1, 0xd8c43a, acier);
  c.poutre(new THREE.Vector3(xm + 0.8, 0.08, a.z + 1.4), new THREE.Vector3(xm, 2.6, a.z + 0.4), 0.1, 0xd8c43a, acier);
  c.poutre(new THREE.Vector3(xm, 2.6, a.z + 0.4), new THREE.Vector3(xm, 0.08, a.z - 1.2), 0.1, 0xd8c43a, acier);
  c.pave(xm - 0.02, 1.4, a.z + 0.38, xm + 0.02, 2.6, a.z + 0.42, 0x2b2b2b);
  c.boite(0.7, 0.55, 0.6, 0x3a3d42, { x: xm, y: 1.15, z: a.z + 0.4 }, acier);
  c.pave(xa + 0.4, 0.08, za + 0.3, xa + 3.4, 0.95, za + 0.95, 0x6e6a63, acier);
  c.boite(0.25, 0.2, 0.3, 0x2f6fa4, { x: xa + 0.8, y: 1.05, z: za + 0.6 }, acier);
  for (let i = 0; i < 4; i++) c.poser(new THREE.TorusGeometry(0.3, 0.12, 5, 10).rotateX(Math.PI / 2), matiere(), 0x1f1f1f, { x: xa + 0.6, y: 0.2 + i * 0.25, z: a.z + 0.6 });
  c.poser(new THREE.CylinderGeometry(0.25, 0.25, 0.9, 8).rotateZ(Math.PI / 2), matiere(0.5, 0.3), ROUGE, { x: xb - 1, y: 0.4, z: za + 0.6 });
  c.poser(new THREE.CylinderGeometry(0.28, 0.28, 0.85, 10), matiere(0.6, 0.3), 0x2f7a3a, { x: xa + 0.7, y: 0.5, z: zb - 0.7 });
  // Le panneau à outils au-dessus de l'établi (sur le mur : il s'efface avec lui)
  t.pave(xa + 0.4, 1.3, za + e, xa + 3.4, 2.4, za + e + 0.03, 0x8a6a48);
  for (let i = 0; i < 9; i++) t.boite(0.05, 0.25 + t.hasard() * 0.2, 0.03, 0x55524d, { x: xa + 0.6 + i * 0.32, y: 1.85, z: za + e + 0.05, rz: (t.hasard() - 0.5) * 0.6 }, acier);

  g.add(c.construire());
  const { objet, materiaux } = t.construireFondu();
  g.add(objet);
  toits.push({ boite: { x: a.x, z: a.z, l: a.l + 0.4, p: a.p + 0.6 }, materiaux, bas: SOCLE, haut: FAITE + 0.1 });
  return g;
}
