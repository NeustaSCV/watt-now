// La faune du terrain (2026-10-08, Book 11 §10).
// - La volaille : le serveur la fait vivre (on la chasse) ; ici, on l'affiche et on l'anime.
// - Lapins, renards, canards et héron de la mare : de la vie, animée ici seulement (rien ne se joue avec eux en 0a).
//   Les lapins fuient le joueur ; le renard rôde, traque un lapin, charge, et parfois l'attrape ; les oiseaux de la
//   mare s'envolent quand on approche, et reviennent un peu plus tard.
//
// Les modèles (refonte du 2026-10-08) : de la géométrie procédurale à facettes, comme le reste du jeu. Chaque bête est
// faite de « fuseaux » (des sections elliptiques enfilées le long d'un chemin) et de bulles, peintes facette par facette
// (couleurs de sommet : crête, miroir de l'aile, bout de la queue, pattes noires…), puis fusionnées en quelques
// maillages seulement : un par partie qui bouge (tête, ailes, pattes, queue). Les géométries sont construites une fois
// et partagées par toutes les bêtes de la même robe ; un seul matériau pour toute la faune.

import * as THREE from "three";
import type { AnimalVu } from "../../../commun/src/faune.ts";
import { MARE, rayonMare } from "../../../commun/src/terrain.ts";
import { TERRAIN_TAILLE, type Allure } from "../../../commun/src/regles.ts";
import { aleatoire } from "./materiaux.ts";

const T = TERRAIN_TAILLE;
/** Les bêtes sont un peu plus grandes que nature (≈ ×1,4), pour qu'on les voie de la caméra. */
const LISIBLE = 1.4;

export interface Approche {
  x: number;
  z: number;
  allure: Allure;
  bouge: boolean;
}

/** Ce que la faune fait entendre (le client choisit le son et sa place). */
export type CriFaune = "envol" | "caquet" | "cancan";

/** Distance à laquelle un animal réagit, selon l'allure de celui qui approche. */
function seuil(qui: Approche | null, s: Record<Allure | "immobile", number>): number {
  if (!qui) return 0;
  return s[qui.bouge ? qui.allure : "immobile"];
}

/** Rapproche `de` de `vers` en douceur (k : vitesse, en 1/s). */
function vers(de: number, but: number, k: number, dt: number): number {
  return de + (but - de) * Math.min(1, k * dt);
}

// =====================================================================================
// L'atelier : fuseaux, bulles, peinture des facettes, fusion
// =====================================================================================

/** Le matériau de toute la faune : à facettes, la couleur portée par les sommets. */
const MATIERE = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.88, metalness: 0 });
/** Le grain des plumes et du pelage : des facettes un peu plus claires ou sombres (le même à chaque chargement). */
const grain = aleatoire(1789);

type Point = readonly [number, number, number];
interface Section {
  p: Point;
  /** Demi-largeur (et demi-hauteur si `ry` manque) ; 0 = une pointe. */
  rx: number;
  ry?: number;
}

/**
 * Un fuseau : des sections elliptiques enfilées le long d'un chemin, fermées aux deux bouts (pointe ou couvercle).
 * `rx` suit le côté du chemin, `ry` son « dessus » (le haut du monde, ou l'avant pour un chemin vertical).
 */
function fuseau(sections: readonly Section[], cotes: number, phase = 0): THREE.BufferGeometry {
  const pos: number[] = [];
  const idx: number[] = [];
  const P = sections.map((s) => new THREE.Vector3(...s.p));
  const anneaux: number[][] = [];
  const ajouter = (v: THREE.Vector3): number => {
    pos.push(v.x, v.y, v.z);
    return pos.length / 3 - 1;
  };
  const t = new THREE.Vector3();
  const cote = new THREE.Vector3();
  const haut = new THREE.Vector3();
  const v = new THREE.Vector3();
  const dernier = sections.length - 1;
  sections.forEach((s, i) => {
    t.subVectors(P[Math.min(i + 1, dernier)]!, P[Math.max(i - 1, 0)]!).normalize();
    // Repère transporté d'une section à l'autre : pas de vrille dans les cous en S.
    if (i === 0) haut.set(0, Math.abs(t.y) > 0.9 ? 0 : 1, Math.abs(t.y) > 0.9 ? 1 : 0);
    cote.crossVectors(haut, t).normalize();
    haut.crossVectors(t, cote).normalize();
    const p = P[i]!;
    if (s.rx < 1e-4) {
      anneaux.push([ajouter(p)]);
      return;
    }
    if (i === 0) anneaux.push([ajouter(p)]);
    const ry = s.ry ?? s.rx;
    const anneau: number[] = [];
    for (let k = 0; k < cotes; k++) {
      const a = phase + (k / cotes) * Math.PI * 2;
      v.copy(p).addScaledVector(cote, Math.cos(a) * s.rx).addScaledVector(haut, Math.sin(a) * ry);
      anneau.push(ajouter(v));
    }
    anneaux.push(anneau);
    if (i === dernier) anneaux.push([ajouter(p)]);
  });
  for (let j = 0; j + 1 < anneaux.length; j++) {
    const A = anneaux[j]!;
    const B = anneaux[j + 1]!;
    if (A.length === 1 && B.length === 1) continue;
    for (let k = 0; k < cotes; k++) {
      const k1 = (k + 1) % cotes;
      if (A.length === 1) idx.push(A[0]!, B[k1]!, B[k]!);
      else if (B.length === 1) idx.push(A[k]!, A[k1]!, B[0]!);
      else idx.push(A[k]!, A[k1]!, B[k1]!, A[k]!, B[k1]!, B[k]!);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

/** Une bulle (ellipsoïde à facettes), centrée en `c`. */
function bulle(c: Point, rx: number, ry: number, rz: number, finesse = 1): THREE.BufferGeometry {
  return new THREE.IcosahedronGeometry(1, finesse).scale(rx, ry, rz).translate(...c);
}

/** Une pointe (crête, oreille, bec) : un cône de `cotes` faces, posé à sa base en `c` et dressé selon les angles. */
function pointe(c: Point, r: number, h: number, cotes: number, rx = 0, rz = 0, ry = 0): THREE.BufferGeometry {
  return new THREE.ConeGeometry(r, h, cotes).translate(0, h / 2, 0).rotateY(ry).rotateZ(rz).rotateX(rx).translate(...c);
}

/** La peinture d'une pièce : une couleur, ou une couleur par facette (selon son centre et sa normale). */
type Peinture = number | ((c: THREE.Vector3, n: THREE.Vector3) => number);

/** Peint chaque facette ; `nuance` (≈ 0,05) éclaircit ou fonce un peu chacune, pour le grain du plumage. */
function peindre(geo: THREE.BufferGeometry, peinture: Peinture, nuance = 0): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo;
  for (const nom of Object.keys(g.attributes)) if (nom !== "position") g.deleteAttribute(nom);
  const p = g.attributes.position!;
  const couleurs = new Float32Array(p.count * 3);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const centre = new THREE.Vector3();
  const normale = new THREE.Vector3();
  const teinte = new THREE.Color();
  for (let i = 0; i + 2 < p.count; i += 3) {
    a.fromBufferAttribute(p, i);
    b.fromBufferAttribute(p, i + 1);
    c.fromBufferAttribute(p, i + 2);
    centre.copy(a).add(b).add(c).divideScalar(3);
    normale.crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize();
    teinte.setHex(typeof peinture === "number" ? peinture : peinture(centre, normale));
    if (nuance > 0) teinte.multiplyScalar(1 + (grain() - 0.5) * 2 * nuance);
    for (let j = 0; j < 3; j++) teinte.toArray(couleurs, (i + j) * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(couleurs, 3));
  return g;
}

/** Fusionne des pièces peintes en une seule géométrie (un seul appel de dessin). */
function assembler(pieces: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const total = pieces.reduce((n, g) => n + g.attributes.position!.count, 0);
  const positions = new Float32Array(total * 3);
  const couleurs = new Float32Array(total * 3);
  let d = 0;
  for (const g of pieces) {
    positions.set(g.attributes.position!.array as Float32Array, d);
    couleurs.set(g.attributes.color!.array as Float32Array, d);
    d += g.attributes.position!.count * 3;
  }
  const r = new THREE.BufferGeometry();
  r.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  r.setAttribute("color", new THREE.BufferAttribute(couleurs, 3));
  r.computeVertexNormals();
  r.computeBoundingSphere();
  return r;
}

function maille(geo: THREE.BufferGeometry): THREE.Mesh {
  const m = new THREE.Mesh(geo, MATIERE);
  m.castShadow = true;
  return m;
}

/** Un pivot (articulation) placé en `p`, qui porte ses pièces. */
function pivot(p: Point, ...enfants: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group();
  g.position.set(...p);
  if (enfants.length) g.add(...enfants);
  return g;
}

/** Une aile déployée (pour le vol) : des panneaux plats (couvertures, miroir, rémiges…), chacun de sa couleur, extrudés
 * finement et posés à plat dans le plan horizontal, l'envergure vers +x et la corde vers +z. */
function aileDeployee(panneaux: readonly { profil: readonly (readonly [number, number])[]; peinture: Peinture }[], epaisseur: number, nuance: number): THREE.BufferGeometry {
  return assembler(
    panneaux.map(({ profil, peinture }) => {
      const forme = new THREE.Shape(profil.map(([u, v]) => new THREE.Vector2(u, v)));
      const geo = new THREE.ExtrudeGeometry(forme, { depth: epaisseur, bevelEnabled: false, curveSegments: 1 });
      // (u, v) → (x = u, z = v).
      geo.rotateX(Math.PI / 2);
      return peindre(geo, peinture, nuance);
    }),
  );
}

/** Retourne une aile de droite en aile de gauche (une rotation : les facettes restent dans le bon sens). */
function aGauche(g: THREE.BufferGeometry): THREE.BufferGeometry {
  return g.clone().rotateZ(Math.PI);
}

/** Compte les triangles d'un modèle (pour la planche et le budget). */
export function trianglesDe(o: THREE.Object3D): number {
  let n = 0;
  o.traverse((e) => {
    if (e instanceof THREE.Mesh) {
      const g = e.geometry as THREE.BufferGeometry;
      n += (g.index ? g.index.count : g.attributes.position!.count) / 3;
    }
  });
  return n;
}

// =====================================================================================
// La poule (Gallus gallus domesticus)
// =====================================================================================

interface RobePoule {
  corps: number;
  dos: number;
  ventre: number;
  camail: number;
  queue: number;
  faucille: number;
  aile: number;
  remiges: number;
  bec: number;
  patte: number;
}

/** Les trois robes : rousse (type Rhode Island), blanche (type Sussex), noire (type Australorp, reflets verts). */
const ROBES: RobePoule[] = [
  { corps: 0xa64f26, dos: 0x8e3d1b, ventre: 0xb8683a, camail: 0xd08a38, queue: 0x3a2a20, faucille: 0x1f2a26, aile: 0x8a3a1a, remiges: 0x3b2618, bec: 0xe2b23a, patte: 0xe2b232 },
  { corps: 0xeeeadf, dos: 0xe4dfd0, ventre: 0xf6f3ea, camail: 0xfaf7ee, queue: 0xe6e0d0, faucille: 0xdcd5c2, aile: 0xe2dccb, remiges: 0xcfc7b2, bec: 0xe8c24a, patte: 0xe8be3a },
  { corps: 0x34343c, dos: 0x2c3434, ventre: 0x3c3c44, camail: 0x36463e, queue: 0x22403a, faucille: 0x1e4a40, aile: 0x2e3238, remiges: 0x202026, bec: 0xd0a43c, patte: 0xd4a83a },
];
const ROUGE_CRETE = 0xc42e26;
const ROUGE_FACE = 0xc8463a;

interface GeometriesPoule {
  corps: THREE.BufferGeometry;
  tete: THREE.BufferGeometry;
  aileD: THREE.BufferGeometry;
  aileG: THREE.BufferGeometry;
  patte: THREE.BufferGeometry;
}

const geometriesPoules = new Map<number, GeometriesPoule>();

/** Les pièces d'une poule, regardant vers +z, en mètres (avant LISIBLE) ; construites une fois par robe. */
function geometriesPoule(numero: number): GeometriesPoule {
  const deja = geometriesPoules.get(numero);
  if (deja) return deja;
  const r = ROBES[numero]!;
  // Le corps : rond, la poitrine pleine en avant, le dos qui remonte vers la queue.
  const corps = peindre(
    fuseau(
      [
        { p: [0, 0.37, -0.19], rx: 0 },
        { p: [0, 0.335, -0.155], rx: 0.055, ry: 0.06 },
        { p: [0, 0.285, -0.085], rx: 0.11, ry: 0.115 },
        { p: [0, 0.255, 0.0], rx: 0.128, ry: 0.125 },
        { p: [0, 0.262, 0.08], rx: 0.112, ry: 0.118 },
        { p: [0, 0.295, 0.13], rx: 0.072, ry: 0.082 },
        { p: [0, 0.325, 0.155], rx: 0 },
      ],
      8,
    ),
    (c) => (c.y > 0.335 ? r.dos : c.y < 0.19 ? r.ventre : r.corps),
    0.05,
  );
  // La « culotte » : les cuisses emplumées sous le ventre.
  const cuisses = [-1, 1].map((s) => peindre(bulle([s * 0.055, 0.15, -0.005], 0.05, 0.055, 0.065, 0), r.ventre, 0.05));
  // La queue : une gerbe relevée (les rectrices) et trois faucilles qui retombent en arc.
  const gerbe = peindre(
    fuseau(
      [
        { p: [0, 0.3, -0.12], rx: 0.05, ry: 0.06 },
        { p: [0, 0.39, -0.19], rx: 0.04, ry: 0.07 },
        { p: [0, 0.445, -0.23], rx: 0.02, ry: 0.038 },
        { p: [0, 0.46, -0.25], rx: 0 },
      ],
      6,
    ),
    r.queue,
    0.06,
  );
  const faucille = (sections: Section[]) => peindre(fuseau(sections, 4, Math.PI / 4), r.faucille, 0.08);
  const faucilles = [
    faucille([
      { p: [0, 0.35, -0.15], rx: 0.018, ry: 0.04 },
      { p: [0, 0.445, -0.2], rx: 0.02, ry: 0.044 },
      { p: [0, 0.47, -0.265], rx: 0.016, ry: 0.036 },
      { p: [0, 0.425, -0.325], rx: 0.01, ry: 0.024 },
      { p: [0, 0.375, -0.345], rx: 0 },
    ]),
    ...[-0.03, 0.03].map((x) =>
      faucille([
        { p: [x, 0.34, -0.14], rx: 0.01, ry: 0.028 },
        { p: [x * 1.6, 0.425, -0.19], rx: 0.01, ry: 0.03 },
        { p: [x * 2.2, 0.44, -0.245], rx: 0.008, ry: 0.024 },
        { p: [x * 2.4, 0.395, -0.28], rx: 0 },
      ]),
    ),
  ];
  // La tête (sur son cou) : le cou emplumé du camail, la face rouge, la crête dentelée, les barbillons, le bec.
  const cou = peindre(
    fuseau(
      [
        { p: [0, -0.03, -0.03], rx: 0.08, ry: 0.075 },
        { p: [0, 0.06, 0.005], rx: 0.062, ry: 0.06 },
        { p: [0, 0.115, 0.035], rx: 0.044 },
        { p: [0, 0.15, 0.055], rx: 0 },
      ],
      7,
    ),
    r.camail,
    0.06,
  );
  const crane = peindre(bulle([0, 0.148, 0.058], 0.04, 0.046, 0.054), (c, n) => (c.z > 0.06 && Math.abs(n.x) > 0.55 && c.y < 0.165 ? ROUGE_FACE : r.camail), 0.04);
  const crete = [
    peindre(new THREE.BoxGeometry(0.014, 0.026, 0.07).translate(0, 0.19, 0.062), ROUGE_CRETE),
    ...(
      [
        [0.032, 0.03, -0.35],
        [0.05, 0.04, -0.15],
        [0.068, 0.044, 0],
        [0.086, 0.036, 0.15],
        [0.1, 0.026, 0.35],
      ] as const
    ).map(([z, h, a]) => peindre(pointe([0, 0.2, z], 0.012, h, 4, a), ROUGE_CRETE, 0.06)),
  ];
  const barbillons = [-1, 1].map((s) => peindre(bulle([s * 0.011, 0.104, 0.092], 0.011, 0.02, 0.014, 0), ROUGE_CRETE, 0.06));
  const bec = peindre(new THREE.ConeGeometry(0.017, 0.048, 4).rotateY(Math.PI / 4).scale(0.8, 1, 1).translate(0, 0.024, 0).rotateX(Math.PI / 2 + 0.3).translate(0, 0.14, 0.098), r.bec);
  const yeux = [-1, 1].map((s) => peindre(bulle([s * 0.036, 0.157, 0.078], 0.008, 0.009, 0.009, 0), 0x2a1a0c));
  const tete = assembler([cou, crane, ...crete, ...barbillons, bec, ...yeux]);
  // L'aile repliée, plaquée au flanc, les rémiges plus sombres au bout ; articulée à l'épaule.
  const aile = (s: number) =>
    peindre(
      fuseau(
        [
          { p: [0, 0, 0.01], rx: 0.016, ry: 0.045 },
          { p: [s * 0.016, -0.025, -0.07], rx: 0.026, ry: 0.07 },
          { p: [s * 0.014, -0.015, -0.15], rx: 0.02, ry: 0.052 },
          { p: [s * 0.006, 0.01, -0.215], rx: 0 },
        ],
        6,
      ),
      (c) => (c.z < -0.12 ? r.remiges : c.y > 0.02 ? r.dos : r.aile),
      0.06,
    );
  // La patte : le tarse jaune et quatre doigts (trois devant, un derrière).
  const doigts = [-0.5, 0, 0.5].map((a) =>
    fuseau(
      [
        { p: [0, -0.118, 0.004], rx: 0.008 },
        { p: [Math.sin(a) * 0.055, -0.124, 0.004 + Math.cos(a) * 0.055], rx: 0 },
      ],
      3,
    ),
  );
  doigts.push(
    fuseau(
      [
        { p: [0, -0.118, 0.0], rx: 0.007 },
        { p: [0, -0.124, -0.03], rx: 0 },
      ],
      3,
    ),
  );
  const patte = assembler([
    peindre(
      fuseau(
        [
          { p: [0, 0.01, 0], rx: 0.016 },
          { p: [0, -0.118, 0.004], rx: 0.012 },
        ],
        5,
      ),
      r.patte,
    ),
    ...doigts.map((d) => peindre(d, r.patte)),
  ]);
  const aileD = assembler([aile(1)]);
  const geos: GeometriesPoule = {
    corps: assembler([corps, ...cuisses, gerbe, ...faucilles]),
    tete,
    aileD,
    aileG: assembler([aile(-1)]),
    patte,
  };
  geometriesPoules.set(numero, geos);
  return geos;
}

class VuePoule {
  readonly objet = new THREE.Group();
  donnees: AnimalVu;
  /** Le buste bascule autour des hanches (picorer, courir) ; les pattes restent au sol. */
  private readonly buste = new THREE.Group();
  private readonly tete: THREE.Group;
  private readonly ailes: THREE.Group[] = [];
  private readonly pattes: THREE.Group[] = [];
  private temps = Math.random() * 10;
  private prochainCri = 4 + Math.random() * 10;
  /** Les coups de tête de l'inquiète : elle regarde ici, puis là. */
  private regard = 0;
  private prochainRegard = 0;
  private vitesse = 0;

  constructor(a: AnimalVu) {
    this.donnees = a;
    const g = geometriesPoule(a.robe % ROBES.length);
    this.tete = pivot([0, 0.155, 0.1], maille(g.tete));
    const corps = maille(g.corps);
    corps.position.y = -0.14;
    this.buste.position.y = 0.14;
    this.buste.add(corps, this.tete);
    for (const s of [-1, 1]) {
      const aile = pivot([s * 0.104, 0.165, 0.065], maille(s > 0 ? g.aileD : g.aileG));
      this.ailes.push(aile);
      this.buste.add(aile);
      const patte = pivot([s * 0.045, 0.13, 0.0], maille(g.patte));
      this.pattes.push(patte);
      this.objet.add(patte);
    }
    this.objet.add(this.buste);
    this.objet.rotation.order = "YXZ";
    this.objet.scale.setScalar(LISIBLE);
    this.objet.position.set(a.x, 0, a.z);
    this.objet.rotation.y = a.o;
  }

  animer(dt: number, crier: (cri: CriFaune, x: number, z: number) => void): void {
    this.temps += dt;
    const t = this.temps;
    const a = this.donnees;
    // Le serveur parle 5 fois par seconde : on rejoint sa position en douceur.
    const k = Math.min(1, dt * (a.etat === "fuit" ? 10 : 6));
    const dx = (a.x - this.objet.position.x) * k;
    const dz = (a.z - this.objet.position.z) * k;
    this.objet.position.x += dx;
    this.objet.position.z += dz;
    this.vitesse = vers(this.vitesse, dt > 0 ? Math.hypot(dx, dz) / dt : 0, 8, dt);
    const ecart = Math.atan2(Math.sin(a.o - this.objet.rotation.y), Math.cos(a.o - this.objet.rotation.y));
    this.objet.rotation.y += ecart * Math.min(1, dt * 8);
    const fuit = a.etat === "fuit";
    const marche = !fuit && this.vitesse > 0.08;
    // Picorer : le buste bascule et la tête plonge au sol, par à-coups ; inquiète : dressée, la tête qui pivote
    // par saccades ; en fuite : couchée en avant, le cou tendu, les ailes qui battent, les pattes folles.
    const picore = a.etat === "picore" && !marche && Math.sin(t * 2.3) > 0.55;
    let busteX = 0;
    let teteX = 0;
    let teteY = 0;
    if (picore) {
      busteX = 0.42;
      teteX = 1.15 + Math.sin(t * 22) * 0.12;
    } else if (a.etat === "inquiete") {
      busteX = -0.12;
      teteX = -0.3;
      this.prochainRegard -= dt;
      if (this.prochainRegard <= 0) {
        this.regard = (Math.random() - 0.5) * 1.6;
        this.prochainRegard = 0.4 + Math.random() * 0.9;
      }
      teteY = this.regard;
    } else if (fuit) {
      busteX = 0.3;
      teteX = 0.55;
    } else {
      // Au pas, la tête va et vient (le « hochement » des gallinacés).
      busteX = marche ? 0.08 : 0;
      teteX = marche ? Math.sin(t * 12) * 0.18 : Math.sin(t * 0.7) * 0.06;
      teteY = marche ? 0 : Math.sin(t * 0.45) * 0.35;
    }
    const vif = picore || fuit ? 22 : 10;
    this.buste.rotation.x = vers(this.buste.rotation.x, busteX, 10, dt);
    this.tete.rotation.x = vers(this.tete.rotation.x, teteX, vif, dt);
    this.tete.rotation.y = vers(this.tete.rotation.y, teteY, a.etat === "inquiete" ? 25 : 6, dt);
    this.buste.position.y = 0.14 + (fuit ? Math.abs(Math.sin(t * 13)) * 0.03 : marche ? Math.abs(Math.sin(t * 6)) * 0.008 : 0);
    this.ailes.forEach((aile, i) => {
      const s = i ? 1 : -1;
      aile.rotation.z = fuit ? s * (0.5 + Math.sin(t * 30) * 0.7) : a.etat === "inquiete" ? s * 0.06 : 0;
      aile.rotation.y = fuit ? s * 0.25 : 0;
    });
    this.pattes.forEach((p, i) => {
      p.rotation.x = fuit ? Math.sin(t * 26 + i * Math.PI) * 0.8 : marche ? Math.sin(t * 12 + i * Math.PI) * 0.5 : 0;
    });
    this.prochainCri -= dt;
    if (fuit && this.prochainCri > 1.5) this.prochainCri = 0;
    if (this.prochainCri <= 0) {
      crier("caquet", this.objet.position.x, this.objet.position.z);
      this.prochainCri = fuit ? 2.5 : 8 + Math.random() * 14;
    }
  }
}

/** Les poules du terrain, comme le serveur les envoie. */
export class Volaille {
  readonly groupe = new THREE.Group();
  private readonly vues = new Map<number, VuePoule>();

  maj(animaux: readonly AnimalVu[]): void {
    const vus = new Set<number>();
    for (const a of animaux) {
      vus.add(a.id);
      const v = this.vues.get(a.id);
      if (v) v.donnees = a;
      else {
        const nv = new VuePoule(a);
        this.vues.set(a.id, nv);
        this.groupe.add(nv.objet);
      }
    }
    for (const [id, v] of this.vues) {
      if (vus.has(id)) continue;
      this.groupe.remove(v.objet);
      this.vues.delete(id);
    }
  }

  animer(dt: number, crier: (cri: CriFaune, x: number, z: number) => void): void {
    for (const v of this.vues.values()) v.animer(dt, crier);
  }

  /** Où elles sont à l'écran (pour viser). */
  places(): { id: number; x: number; z: number; robe: number; etat: AnimalVu["etat"] }[] {
    return [...this.vues.values()].map((v) => ({ id: v.donnees.id, x: v.objet.position.x, z: v.objet.position.z, robe: v.donnees.robe, etat: v.donnees.etat }));
  }
}

// =====================================================================================
// Le lapin de garenne (Oryctolagus cuniculus)
// =====================================================================================

const AGOUTI = 0x9c876c;
const AGOUTI_SOMBRE = 0x8c775d;
const NUQUE_ROUSSE = 0xa8703f;
const VENTRE_LAPIN = 0xddd0b8;

/** Un lapin : le corps, la tête (qui broute), les oreilles (qui se couchent dans la fuite) et la queue (qui se relève). */
export interface ModeleLapin {
  objet: THREE.Group;
  tete: THREE.Group;
  oreilles: THREE.Group;
  queue: THREE.Group;
}

let geometriesLapin: { corps: THREE.BufferGeometry; tete: THREE.BufferGeometry; oreilles: THREE.BufferGeometry; queue: THREE.BufferGeometry } | null = null;

function construireLapin(): NonNullable<typeof geometriesLapin> {
  if (geometriesLapin) return geometriesLapin;
  const pelage = (c: THREE.Vector3) => (c.y < 0.07 ? VENTRE_LAPIN : grain() < 0.3 ? AGOUTI_SOMBRE : AGOUTI);
  // Le corps ramassé : les reins hauts, l'arrière-train plein.
  const corps = peindre(
    fuseau(
      [
        { p: [0, 0.12, -0.155], rx: 0 },
        { p: [0, 0.125, -0.13], rx: 0.06, ry: 0.06 },
        { p: [0, 0.135, -0.07], rx: 0.095, ry: 0.1 },
        { p: [0, 0.135, 0.0], rx: 0.085, ry: 0.095 },
        { p: [0, 0.135, 0.06], rx: 0.064, ry: 0.075 },
        { p: [0, 0.15, 0.1], rx: 0.045, ry: 0.052 },
        { p: [0, 0.165, 0.12], rx: 0 },
      ],
      8,
    ),
    pelage,
    0.05,
  );
  const cuisses = [-1, 1].map((s) => peindre(bulle([s * 0.068, 0.095, -0.065], 0.04, 0.065, 0.075), pelage, 0.05));
  const piedsArriere = [-1, 1].map((s) =>
    peindre(
      fuseau(
        [
          { p: [s * 0.062, 0.025, -0.11], rx: 0.02, ry: 0.016 },
          { p: [s * 0.066, 0.014, 0.0], rx: 0.019, ry: 0.012 },
          { p: [s * 0.066, 0.012, 0.035], rx: 0 },
        ],
        5,
      ),
      0x9a8670,
      0.04,
    ),
  );
  const pattesAvant = [-1, 1].map((s) =>
    peindre(
      fuseau(
        [
          { p: [s * 0.034, 0.11, 0.075], rx: 0.016 },
          { p: [s * 0.036, 0.02, 0.095], rx: 0.012 },
          { p: [s * 0.036, 0.008, 0.12], rx: 0 },
        ],
        5,
      ),
      0x8a7660,
    ),
  );
  // La tête (pivot à la nuque) : le museau, l'œil noir, la nuque rousse.
  const tete = assembler([
    peindre(
      bulle([0, 0.035, 0.05], 0.048, 0.05, 0.066).rotateX(0.25),
      (c, n) => (c.z < 0.02 && n.y > 0.2 ? NUQUE_ROUSSE : c.y < 0.01 ? VENTRE_LAPIN : grain() < 0.3 ? AGOUTI_SOMBRE : AGOUTI),
      0.05,
    ),
    peindre(bulle([0, 0.02, 0.108], 0.011, 0.009, 0.008, 0), 0x9a7466),
    ...[-1, 1].map((s) => peindre(bulle([s * 0.041, 0.055, 0.058], 0.009, 0.011, 0.012, 0), 0x18120e)),
  ]);
  // Les oreilles (pivot à leur base) : longues, le bout liseré de noir.
  const oreilles = assembler(
    [-1, 1].map((s) =>
      peindre(
        fuseau(
          [
            { p: [s * 0.016, 0, 0], rx: 0.011, ry: 0.018 },
            { p: [s * 0.026, 0.06, -0.018], rx: 0.012, ry: 0.026 },
            { p: [s * 0.032, 0.11, -0.036], rx: 0.009, ry: 0.019 },
            { p: [s * 0.034, 0.135, -0.044], rx: 0 },
          ],
          5,
        ),
        (c) => (c.y > 0.105 ? 0x2a221c : AGOUTI),
        0.04,
      ),
    ),
  );
  // La queue : brune dessus, blanche dessous — le « signal » qu'elle montre en se relevant dans la fuite.
  const queue = assembler([peindre(bulle([0, 0, -0.022], 0.034, 0.032, 0.03), (_c, n) => (n.y > 0.45 ? AGOUTI_SOMBRE : 0xf4f1ea))]);
  geometriesLapin = { corps: assembler([corps, ...cuisses, ...piedsArriere, ...pattesAvant]), tete, oreilles, queue };
  return geometriesLapin;
}

export function creerLapin(): ModeleLapin {
  const g = construireLapin();
  const objet = new THREE.Group();
  const oreilles = pivot([0, 0.075, 0.025], maille(g.oreilles));
  const tete = pivot([0, 0.165, 0.085], maille(g.tete), oreilles);
  const queue = pivot([0, 0.145, -0.135], maille(g.queue));
  objet.add(maille(g.corps), tete, queue);
  objet.rotation.order = "YXZ";
  objet.scale.setScalar(LISIBLE);
  return { objet, tete, oreilles, queue };
}

/** La pose du lapin : broute (la tête au sol), bondit (au pas ou en fuite, le dos qui se cambre), ou se fige. */
export function poserLapin(m: ModeleLapin, etat: "broute" | "fuit", bond: number, bouge: boolean, temps: number): void {
  const fuit = etat === "fuit";
  const haut = bouge ? Math.abs(Math.sin(bond)) * (fuit ? 0.22 : 0.08) : 0;
  m.objet.position.y = haut;
  // En l'air, le nez monte puis replonge à la réception.
  m.objet.rotation.x = bouge ? -Math.cos(bond) * Math.sign(Math.sin(bond)) * (fuit ? 0.32 : 0.18) : 0;
  // À l'arrêt, il broute ; de temps en temps il se redresse, les oreilles droites, et écoute.
  const ecoute = !bouge && Math.sin(temps * 0.5) > 0.75;
  m.tete.rotation.x = bouge ? (fuit ? -0.15 : 0) : ecoute ? -0.35 : 0.55 + Math.sin(temps * 14) * 0.04;
  m.oreilles.rotation.x = fuit ? -1.05 : ecoute ? 0.1 : -0.35;
  m.oreilles.rotation.z = fuit ? 0 : Math.sin(temps * 0.8) * 0.06;
  m.queue.rotation.x = fuit ? -1.2 : 0;
  m.queue.scale.setScalar(fuit ? 1.25 : 1);
}

// =====================================================================================
// Le renard roux (Vulpes vulpes)
// =====================================================================================

const ROUX = 0xc45e26;
const ROUX_SOMBRE = 0xa84a1c;
const BLANC_RENARD = 0xf0e8da;
const BAS_NOIRS = 0x25201c;

/** Un renard : le buste (qui se couche dans la traque) porte la tête, la queue et les quatre pattes. */
export interface ModeleRenard {
  objet: THREE.Group;
  buste: THREE.Group;
  tete: THREE.Group;
  queue: THREE.Group;
  pattes: THREE.Group[];
  /** Le lapin pris, dans la gueule. */
  proie: ModeleLapin;
}

let geometriesRenard: { corps: THREE.BufferGeometry; tete: THREE.BufferGeometry; queue: THREE.BufferGeometry; avant: THREE.BufferGeometry; arriere: THREE.BufferGeometry } | null = null;

/** Hauteur des épaules et des hanches au-dessus du sol (les pattes y sont articulées). */
const HANCHE_RENARD = 0.3;

function construireRenard(): NonNullable<typeof geometriesRenard> {
  if (geometriesRenard) return geometriesRenard;
  // Le corps svelte, le poitrail blanc.
  const corps = peindre(
    fuseau(
      [
        { p: [0, 0.33, -0.27], rx: 0 },
        { p: [0, 0.33, -0.24], rx: 0.052, ry: 0.058 },
        { p: [0, 0.322, -0.15], rx: 0.072, ry: 0.082 },
        { p: [0, 0.31, -0.02], rx: 0.066, ry: 0.08 },
        { p: [0, 0.318, 0.1], rx: 0.076, ry: 0.098 },
        { p: [0, 0.34, 0.18], rx: 0.062, ry: 0.082 },
        { p: [0, 0.37, 0.225], rx: 0 },
      ],
      8,
    ),
    (c, n) => (c.z > 0.09 && c.y < 0.33 && n.y < 0.3 ? BLANC_RENARD : c.y < 0.25 ? 0xd8b48c : n.y > 0.6 ? ROUX_SOMBRE : ROUX),
    0.04,
  );
  // La tête (pivot au garrot) : le cou, le crâne, le museau fin aux babines blanches, la truffe, les grandes oreilles
  // au dos noir.
  const cou = fuseau(
    [
      { p: [0, -0.035, -0.04], rx: 0.062, ry: 0.072 },
      { p: [0, 0.035, 0.04], rx: 0.05, ry: 0.056 },
      { p: [0, 0.07, 0.09], rx: 0 },
    ],
    7,
  );
  const blancDessous = (c: THREE.Vector3, n: THREE.Vector3) => (n.y < -0.15 || (c.y < 0.06 && Math.abs(n.x) > 0.5) ? BLANC_RENARD : ROUX);
  const tete = assembler([
    peindre(cou, (c, n) => (n.z > 0.3 && n.y < 0.2 ? BLANC_RENARD : ROUX), 0.04),
    peindre(bulle([0, 0.075, 0.095], 0.058, 0.052, 0.062), blancDessous, 0.04),
    peindre(
      fuseau(
        [
          { p: [0, 0.066, 0.13], rx: 0.034, ry: 0.03 },
          { p: [0, 0.056, 0.185], rx: 0.018, ry: 0.017 },
          { p: [0, 0.05, 0.215], rx: 0 },
        ],
        6,
      ),
      blancDessous,
      0.03,
    ),
    peindre(bulle([0, 0.053, 0.212], 0.011, 0.01, 0.01, 0), 0x141210),
    ...[-1, 1].map((s) => peindre(bulle([s * 0.034, 0.09, 0.14], 0.009, 0.008, 0.009, 0), 0x2a1806)),
    ...[-1, 1].map((s) => peindre(pointe([s * 0.034, 0.105, 0.08], 0.03, 0.085, 4, -0.15, -s * 0.28, Math.PI / 4).scale(1, 1, 0.7), (_c, n) => (n.z < -0.1 ? BAS_NOIRS : 0xe0c8a8))),
  ]);
  // La queue en panache, au bout blanc.
  const queue = assembler([
    peindre(
      fuseau(
        [
          { p: [0, 0, 0], rx: 0.032 },
          { p: [0, -0.03, -0.1], rx: 0.062, ry: 0.066 },
          { p: [0, -0.07, -0.22], rx: 0.072, ry: 0.075 },
          { p: [0, -0.1, -0.33], rx: 0.055 },
          { p: [0, -0.112, -0.4], rx: 0.03 },
          { p: [0, -0.115, -0.435], rx: 0 },
        ],
        7,
      ),
      (c, n) => (c.z < -0.335 ? BLANC_RENARD : n.y > 0.5 ? ROUX_SOMBRE : ROUX),
      0.05,
    ),
  ]);
  // Les pattes fines, gantées de noir.
  const avant = assembler([
    peindre(
      fuseau(
        [
          { p: [0, 0.03, -0.01], rx: 0.034, ry: 0.042 },
          { p: [0, -0.11, 0.005], rx: 0.02 },
          { p: [0, -0.27, 0.0], rx: 0.015 },
          { p: [0, -0.293, 0.03], rx: 0.016, ry: 0.01 },
          { p: [0, -0.296, 0.05], rx: 0 },
        ],
        5,
      ),
      (c) => (c.y < -0.13 ? BAS_NOIRS : c.z > 0.0 && c.y > -0.05 ? BLANC_RENARD : ROUX),
    ),
  ]);
  const arriere = assembler([
    peindre(
      fuseau(
        [
          { p: [0, 0.03, 0.01], rx: 0.04, ry: 0.06 },
          { p: [0, -0.09, -0.035], rx: 0.026 },
          { p: [0, -0.17, -0.06], rx: 0.016 },
          { p: [0, -0.285, -0.025], rx: 0.014 },
          { p: [0, -0.295, 0.015], rx: 0.016, ry: 0.01 },
          { p: [0, -0.297, 0.035], rx: 0 },
        ],
        5,
      ),
      (c) => (c.y < -0.15 ? BAS_NOIRS : ROUX),
      0.04,
    ),
  ]);
  geometriesRenard = { corps, tete, queue, avant, arriere };
  return geometriesRenard;
}

export function creerRenard(): ModeleRenard {
  const g = construireRenard();
  const objet = new THREE.Group();
  const buste = new THREE.Group();
  // Le lapin pris, en travers de la gueule.
  const proie = creerLapin();
  // Le dos vers l'avant, la longueur en travers de la gueule, la tête et les oreilles pendantes.
  proie.objet.scale.setScalar(0.85);
  proie.objet.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0)));
  proie.objet.position.set(0, 0.035, 0.1);
  proie.tete.rotation.x = 0.7;
  proie.oreilles.rotation.x = -1.1;
  proie.objet.visible = false;
  const tete = pivot([0, 0.37, 0.175], maille(g.tete), proie.objet);
  const queue = pivot([0, 0.335, -0.245], maille(g.queue));
  const pattes = (
    [
      [-0.044, 0.14, g.avant],
      [0.044, 0.14, g.avant],
      [-0.05, -0.17, g.arriere],
      [0.05, -0.17, g.arriere],
    ] as const
  ).map(([x, z, geo]) => pivot([x, HANCHE_RENARD, z], maille(geo)));
  buste.add(maille(g.corps), tete, queue, ...pattes);
  objet.add(buste);
  objet.rotation.order = "YXZ";
  objet.scale.setScalar(LISIBLE * 0.95);
  return { objet, buste, tete, queue, pattes, proie };
}

/** Ce que fait le renard, pour sa pose. */
export type EtatRenard = "absent" | "rode" | "traque" | "charge" | "emporte" | "fuit";

/** La pose du renard : trot le nez bas, traque ventre à terre, charge au galop, retour la proie dans la gueule. */
export function poserRenard(m: ModeleRenard, etat: EtatRenard, pas: number, dt: number): void {
  const traque = etat === "traque";
  const galop = etat === "charge" || etat === "fuit";
  // Ventre à terre : le buste descend, les pattes se plient (raccourcies).
  const bas = traque ? 0.1 : 0;
  m.buste.position.y = vers(m.buste.position.y, -bas + (galop ? Math.abs(Math.sin(pas * 0.5)) * 0.03 : 0), 8, dt);
  const replie = (HANCHE_RENARD + m.buste.position.y) / HANCHE_RENARD;
  m.buste.rotation.x = galop ? Math.sin(pas * 0.5) * 0.12 : 0;
  const amplitude = etat === "absent" ? 0 : galop ? 0.85 : traque ? 0.35 : 0.5;
  m.pattes.forEach((p, i) => {
    // Au trot, les diagonales ensemble ; au galop, l'avant puis l'arrière.
    const phase = galop ? (i < 2 ? 0 : Math.PI * 0.8) + (i % 2) * 0.3 : i === 0 || i === 3 ? 0 : Math.PI;
    p.rotation.x = Math.sin((galop ? pas * 0.5 : pas) + phase) * amplitude;
    p.scale.y = replie;
  });
  // La tête : basse et tendue dans la traque, haute quand il emporte sa proie, le nez au sol quand il rôde.
  const teteX = traque ? 0.35 : etat === "emporte" ? -0.25 : etat === "rode" ? 0.25 : galop ? 0.15 : 0;
  m.tete.rotation.x = vers(m.tete.rotation.x, teteX, 6, dt);
  m.tete.position.y = 0.37 - (traque ? 0.03 : 0);
  // La queue : traînante, à l'horizontale dans la traque et la course.
  m.queue.rotation.x = vers(m.queue.rotation.x, traque || galop ? 0.25 : 0, 5, dt);
  m.queue.rotation.y = Math.sin(pas * 0.25) * (traque ? 0.05 : 0.15);
  m.proie.objet.visible = etat === "emporte";
}

// =====================================================================================
// Les oiseaux de la mare : canard colvert (Anas platyrhynchos) et héron cendré (Ardea cinerea)
// =====================================================================================

/** Un oiseau : le corps (qui bascule pour barboter ou voler), les ailes de vol, et, pour le héron, le cou et les pattes. */
export interface ModeleOiseau {
  objet: THREE.Group;
  corps: THREE.Group;
  ailes: THREE.Group[];
  cou: THREE.Group | null;
  pattes: THREE.Group | null;
}

const MIROIR = 0x2f46b0;
const geometriesCanards = new Map<boolean, { corps: THREE.BufferGeometry; aileD: THREE.BufferGeometry; aileG: THREE.BufferGeometry }>();

function construireCanard(male: boolean): { corps: THREE.BufferGeometry; aileD: THREE.BufferGeometry; aileG: THREE.BufferGeometry } {
  const deja = geometriesCanards.get(male);
  if (deja) return deja;
  // La femelle : brun moucheté, chaque plume (facette) d'un brun différent.
  const BRUNS = [0x8c6a46, 0x6c4e32, 0xa88660, 0x5c4430, 0x9a7a54];
  const mouchete = () => BRUNS[Math.floor(grain() * BRUNS.length)]!;
  const robeCorps = (c: THREE.Vector3, n: THREE.Vector3): number => {
    if (!male) return c.z < -0.17 ? 0x5c4430 : mouchete();
    if (c.z < -0.185) return 0xe2ded6; // les rectrices blanches
    if (c.z < -0.12) return 0x18181c; // le croupion noir
    if (c.z > 0.07 && c.y > 0.05) return 0x5c3832; // la poitrine brun-violet
    if (n.y > 0.75) return 0x7a6e60; // le dos
    return 0xbdb8ac; // les flancs gris perle
  };
  const corps = peindre(
    fuseau(
      [
        { p: [0, 0.105, -0.225], rx: 0 },
        { p: [0, 0.095, -0.19], rx: 0.035, ry: 0.025 },
        { p: [0, 0.082, -0.12], rx: 0.082, ry: 0.058 },
        { p: [0, 0.075, -0.01], rx: 0.1, ry: 0.07 },
        { p: [0, 0.084, 0.09], rx: 0.085, ry: 0.07 },
        { p: [0, 0.1, 0.14], rx: 0.052, ry: 0.052 },
        { p: [0, 0.118, 0.165], rx: 0 },
      ],
      8,
    ),
    robeCorps,
    male ? 0.03 : 0.06,
  );
  // La boucle noire du mâle, au-dessus de la queue.
  const boucle = male ? [peindre(new THREE.TorusGeometry(0.018, 0.005, 3, 6, Math.PI * 1.4).rotateY(Math.PI / 2).translate(0, 0.13, -0.18), 0x18181c)] : [];
  // Le cou et la tête : vert bouteille et collier blanc pour le mâle ; brune, calotte et trait de l'œil sombres pour la
  // femelle.
  const robeTete = (c: THREE.Vector3, n: THREE.Vector3): number => {
    if (male) return c.y < 0.14 ? 0x5c3832 : c.y < 0.158 ? 0xf2efe6 : 0x1d5a38;
    if (c.y > 0.228 && n.y > 0.4) return 0x4a3624;
    if (Math.abs(n.x) > 0.6 && Math.abs(c.y - 0.214) < 0.008) return 0x3e2e20;
    return c.y < 0.16 ? mouchete() : 0xa08460;
  };
  const cou = peindre(
    fuseau(
      [
        { p: [0, 0.1, 0.11], rx: 0.044, ry: 0.04 },
        { p: [0, 0.15, 0.145], rx: 0.03, ry: 0.032 },
        { p: [0, 0.2, 0.16], rx: 0.032 },
        { p: [0, 0.22, 0.165], rx: 0 },
      ],
      7,
    ),
    robeTete,
    0.04,
  );
  const tete = peindre(bulle([0, 0.215, 0.172], 0.034, 0.036, 0.05), robeTete, male ? 0.08 : 0.04);
  const bec = peindre(
    fuseau(
      [
        { p: [0, 0.21, 0.21], rx: 0.018, ry: 0.011 },
        { p: [0, 0.2, 0.25], rx: 0.02, ry: 0.007 },
        { p: [0, 0.197, 0.265], rx: 0 },
      ],
      6,
    ),
    (c) => (male ? 0xd6c23c : c.y > 0.205 ? 0x5a4430 : 0xd0843a),
  );
  const yeux = [-1, 1].map((s) => peindre(bulle([s * 0.031, 0.222, 0.19], 0.007, 0.007, 0.007, 0), 0x141010));
  // Les ailes repliées sur le dos, le miroir bleu bordé de blanc près du bout.
  const ailesRepliees = [-1, 1].map((s) =>
    peindre(
      fuseau(
        [
          { p: [s * 0.062, 0.122, 0.07], rx: 0.03, ry: 0.012 },
          { p: [s * 0.072, 0.135, -0.03], rx: 0.042, ry: 0.016 },
          { p: [s * 0.05, 0.13, -0.13], rx: 0.03, ry: 0.012 },
          { p: [s * 0.03, 0.125, -0.18], rx: 0 },
        ],
        6,
      ),
      (c) => (c.z < -0.03 && c.z > -0.1 && Math.abs(c.x) > 0.075 ? MIROIR : Math.abs(c.z + 0.105) < 0.01 && Math.abs(c.x) > 0.06 ? 0xf2efe6 : male ? (c.z < -0.12 ? 0x5a5248 : 0x8a8070) : mouchete()),
      0.04,
    ),
  );
  // L'aile de vol (envergure ≈ 0,3 m par aile) : les rémiges sombres, le miroir bleu sur le bord de fuite.
  const aileD = aileDeployee(
    [
      { profil: [[0, 0.05], [0.1, 0.06], [0.17, 0.046], [0.17, -0.027], [0.04, -0.032], [0, -0.03]], peinture: male ? 0x8e8676 : () => mouchete() },
      { profil: [[0.04, -0.032], [0.17, -0.027], [0.17, -0.037], [0.04, -0.042]], peinture: 0xf2efe6 },
      { profil: [[0.04, -0.042], [0.17, -0.037], [0.17, -0.06], [0.04, -0.066]], peinture: MIROIR },
      { profil: [[0.04, -0.066], [0.17, -0.06], [0.17, -0.068], [0.1, -0.078], [0.04, -0.075]], peinture: 0xf2efe6 },
      { profil: [[0, -0.03], [0.04, -0.032], [0.04, -0.075], [0, -0.06]], peinture: male ? 0x6a6256 : 0x5c4430 },
      { profil: [[0.17, 0.046], [0.2, 0.04], [0.3, -0.01], [0.27, -0.05], [0.18, -0.07], [0.17, -0.068]], peinture: male ? 0x5e574d : 0x4e3e2e },
    ],
    0.012,
    0.04,
  );
  const geos = { corps: assembler([corps, ...boucle, cou, tete, bec, ...yeux, ...ailesRepliees]), aileD, aileG: aGauche(aileD) };
  geometriesCanards.set(male, geos);
  return geos;
}

export function creerCanard(male: boolean): ModeleOiseau {
  const g = construireCanard(male);
  const objet = new THREE.Group();
  const corps = new THREE.Group();
  corps.add(maille(g.corps));
  const ailes = [-1, 1].map((s) => pivot([s * 0.05, 0.12, 0.0], maille(s > 0 ? g.aileD : g.aileG)));
  for (const a of ailes) a.visible = false;
  corps.add(...ailes);
  objet.add(corps);
  return { objet, corps, ailes, cou: null, pattes: null };
}

let geometriesHeron: { corps: THREE.BufferGeometry; cou: THREE.BufferGeometry; pattes: THREE.BufferGeometry; aileD: THREE.BufferGeometry; aileG: THREE.BufferGeometry } | null = null;

const GRIS_HERON = 0x969ca4;
const GRIS_CLAIR = 0xc4c8cc;
const NOIR_HERON = 0x26282e;

function construireHeron(): NonNullable<typeof geometriesHeron> {
  if (geometriesHeron) return geometriesHeron;
  // Le corps (pivot aux hanches), incliné, le poitrail haut ; les ailes repliées au manteau gris, l'épaule noire.
  const corps = peindre(
    fuseau(
      [
        { p: [0, -0.06, -0.3], rx: 0 },
        { p: [0, -0.03, -0.24], rx: 0.048, ry: 0.036 },
        { p: [0, 0.0, -0.14], rx: 0.085, ry: 0.085 },
        { p: [0, 0.04, -0.02], rx: 0.095, ry: 0.105 },
        { p: [0, 0.1, 0.07], rx: 0.078, ry: 0.095 },
        { p: [0, 0.16, 0.11], rx: 0.048, ry: 0.058 },
        { p: [0, 0.2, 0.12], rx: 0 },
      ],
      8,
    ),
    (c, n) => (n.y < -0.3 || c.z > 0.06 ? GRIS_CLAIR : GRIS_HERON),
    0.04,
  );
  const ailesRepliees = [-1, 1].map((s) =>
    peindre(
      fuseau(
        [
          { p: [s * 0.07, 0.1, 0.06], rx: 0.024, ry: 0.06 },
          { p: [s * 0.082, 0.04, -0.08], rx: 0.03, ry: 0.085 },
          { p: [s * 0.055, -0.03, -0.22], rx: 0.022, ry: 0.05 },
          { p: [s * 0.03, -0.07, -0.32], rx: 0 },
        ],
        6,
      ),
      (c) => (c.z > 0.03 && c.y > 0.07 ? NOIR_HERON : c.z < -0.17 ? 0x50565e : 0x8a9098),
      0.04,
    ),
  );
  // Les plumes pendantes du jabot.
  const jabot = peindre(
    fuseau(
      [
        { p: [0, 0.13, 0.11], rx: 0.03, ry: 0.02 },
        { p: [0, 0.03, 0.135], rx: 0.026, ry: 0.016 },
        { p: [0, -0.05, 0.12], rx: 0 },
      ],
      5,
    ),
    0xe2e2de,
    0.05,
  );
  // Le cou en S (pivot à la base) : blanc, une ligne de stries noires devant ; la tête blanche au sourcil noir prolongé
  // d'une huppe ; le bec jaune en poignard.
  const cou = peindre(
    fuseau(
      [
        { p: [0, -0.01, -0.01], rx: 0.044, ry: 0.048 },
        { p: [0, 0.08, 0.06], rx: 0.03 },
        { p: [0, 0.17, 0.04], rx: 0.026 },
        { p: [0, 0.25, 0.065], rx: 0.024 },
        { p: [0, 0.3, 0.1], rx: 0.026 },
        { p: [0, 0.31, 0.12], rx: 0 },
      ],
      6,
    ),
    (c, n) => (n.z > 0.55 && c.y > 0.04 && c.y < 0.27 && Math.floor(c.y * 45) % 2 === 0 ? 0x34363c : 0xeeece8),
    0.03,
  );
  const tete = peindre(bulle([0, 0.31, 0.125], 0.03, 0.034, 0.05), (c, n) => (c.y > 0.318 && Math.abs(n.x) > 0.35 ? NOIR_HERON : 0xf4f3ef));
  const huppe = peindre(
    fuseau(
      [
        { p: [0, 0.33, 0.1], rx: 0.008, ry: 0.006 },
        { p: [0, 0.325, 0.02], rx: 0.006, ry: 0.004 },
        { p: [0, 0.305, -0.06], rx: 0 },
      ],
      4,
    ),
    NOIR_HERON,
  );
  const bec = peindre(
    fuseau(
      [
        { p: [0, 0.305, 0.16], rx: 0.011, ry: 0.016 },
        { p: [0, 0.3, 0.24], rx: 0.007, ry: 0.009 },
        { p: [0, 0.296, 0.305], rx: 0 },
      ],
      4,
      Math.PI / 4,
    ),
    0xdcae3a,
  );
  const yeux = [-1, 1].map((s) => peindre(bulle([s * 0.027, 0.315, 0.14], 0.006, 0.006, 0.006, 0), 0xe8cc3a));
  // Les longues pattes (pivot aux hanches) : la cuisse emplumée, le tarse nu, quatre longs doigts.
  const pieces: THREE.BufferGeometry[] = [];
  for (const s of [-1, 1]) {
    const x = s * 0.04;
    pieces.push(
      peindre(
        fuseau(
          [
            { p: [x, 0.02, 0], rx: 0.03 },
            { p: [x, -0.1, 0.0], rx: 0.013 },
          ],
          5,
        ),
        GRIS_HERON,
      ),
      peindre(
        fuseau(
          [
            { p: [x, -0.1, 0.0], rx: 0.011 },
            { p: [x, -0.31, -0.012], rx: 0.011 },
            { p: [x, -0.585, 0.01], rx: 0.009 },
          ],
          4,
        ),
        0x8a7a4a,
      ),
    );
    for (const a of [-0.45, 0, 0.45, Math.PI])
      pieces.push(
        peindre(
          fuseau(
            [
              { p: [x, -0.588, 0.01], rx: 0.006 },
              { p: [x + Math.sin(a) * (a === Math.PI ? 0.04 : 0.08), -0.597, 0.01 + Math.cos(a) * (a === Math.PI ? 0.04 : 0.08)], rx: 0 },
            ],
            3,
          ),
          0x7a6a3e,
        ),
      );
  }
  // L'aile de vol, large et arrondie : le manteau gris, les grandes rémiges noires.
  const aileD = aileDeployee(
    [
      { profil: [[0, 0.13], [0.25, 0.15], [0.5, 0.12], [0.5, -0.04], [0.25, -0.05], [0, -0.04]], peinture: 0x9ca2aa },
      { profil: [[0, -0.04], [0.25, -0.05], [0.5, -0.04], [0.5, -0.16], [0.25, -0.17], [0, -0.14]], peinture: 0x585e66 },
      { profil: [[0.5, 0.12], [0.68, 0.06], [0.75, -0.04], [0.7, -0.13], [0.5, -0.16]], peinture: 0x2c3036 },
    ],
    0.016,
    0.04,
  );
  geometriesHeron = {
    corps: assembler([corps, ...ailesRepliees, jabot]),
    cou: assembler([cou, tete, huppe, bec, ...yeux]),
    pattes: assembler(pieces),
    aileD,
    aileG: aGauche(aileD),
  };
  return geometriesHeron;
}

export function creerHeron(): ModeleOiseau {
  const g = construireHeron();
  const objet = new THREE.Group();
  const cou = pivot([0, 0.15, 0.1], maille(g.cou));
  const corps = pivot([0, 0.6, 0], maille(g.corps), cou);
  const ailes = [-1, 1].map((s) => pivot([s * 0.07, 0.06, 0.02], maille(s > 0 ? g.aileD : g.aileG)));
  for (const a of ailes) a.visible = false;
  corps.add(...ailes);
  const pattes = pivot([0, 0.6, -0.01], maille(g.pattes));
  objet.add(corps, pattes);
  return { objet, corps, ailes, cou, pattes };
}

/**
 * La pose d'un oiseau : posé (le canard barbote de temps en temps, la tête sous l'eau, la queue en l'air ; le héron
 * guette, le cou qui s'allonge à peine), ou en vol (les ailes battent ; le héron rentre le cou et laisse traîner ses
 * pattes).
 */
export function poserOiseau(m: ModeleOiseau, vol: boolean, temps: number, dt: number): void {
  const heron = m.cou !== null;
  for (const a of m.ailes) a.visible = vol;
  if (vol) {
    const battement = Math.sin(temps * (heron ? 7 : 16));
    m.ailes.forEach((a, i) => {
      a.rotation.z = (i ? 1 : -1) * battement * (heron ? 0.7 : 0.9);
    });
  }
  if (heron) {
    m.corps.rotation.x = vers(m.corps.rotation.x, vol ? 0.55 : 0, 4, dt);
    // En vol, le cou se replie en S : la tête rentrée contre le poitrail.
    m.cou!.rotation.x = vers(m.cou!.rotation.x, vol ? 0.1 : Math.sin(temps * 0.3) * 0.08, 4, dt);
    m.cou!.scale.setScalar(vers(m.cou!.scale.x, vol ? 0.7 : 1, 4, dt));
    m.pattes!.rotation.x = vers(m.pattes!.rotation.x, vol ? 1.5 : 0, 4, dt);
    m.corps.position.y = vol ? 0.55 : 0.6;
    return;
  }
  // Le canard barbote : bascule en avant, le croupion au ciel, quelques secondes.
  const barbote = !vol && Math.sin(temps * 0.45 + 1.7) > 0.9;
  m.corps.rotation.x = vers(m.corps.rotation.x, vol ? -0.25 : barbote ? 1.15 : 0, barbote ? 5 : 3, dt);
  m.corps.position.y = barbote ? 0.03 : 0;
}

/** Une place sur l'eau, loin du bord. */
function placeSurLEau(aleat: () => number): { x: number; z: number } {
  const a = aleat() * Math.PI * 2;
  const r = rayonMare(a) * (0.2 + aleat() * 0.5);
  return { x: MARE.x + Math.cos(a) * r, z: MARE.z + Math.sin(a) * r };
}

// =====================================================================================
// Les comportements : lapins, renard, oiseaux (animés ici)
// =====================================================================================

const FUITE_LAPIN = { immobile: 2, discrete: 3.5, marche: 7, course: 12 };
const FUITE_RENARD = { immobile: 8, discrete: 10, marche: 15, course: 20 };
/** Vitesses réalistes : lapin de garenne ≈ 40 km/h, renard roux ≈ 48 km/h (en pointe). */
const V_LAPIN = 10.5;
const V_RENARD = 13;

type EtatLapin = "broute" | "fuit" | "cache" | "pris";

interface Lapin {
  modele: ModeleLapin;
  x: number;
  z: number;
  o: number;
  etat: EtatLapin;
  minuteur: number;
  but: { x: number; z: number } | null;
  bond: number;
  /** Le zigzag de la fuite. */
  zig: number;
  temps: number;
}

interface Renard {
  modele: ModeleRenard;
  x: number;
  z: number;
  o: number;
  etat: EtatRenard;
  minuteur: number;
  cible: Lapin | null;
  sortie: { x: number; z: number };
  pas: number;
}

/** Un point de la lisière, juste derrière la clôture (là où l'on disparaît). */
function bordLePlusProche(x: number, z: number): { x: number; z: number } {
  const d = [x, T - x, z, T - z];
  const i = d.indexOf(Math.min(...d));
  return i === 0 ? { x: -3, z } : i === 1 ? { x: T + 3, z } : i === 2 ? { x, z: -3 } : { x, z: T + 3 };
}

function pointDuBord(aleat: () => number): { x: number; z: number } {
  const t = 4 + aleat() * (T - 8);
  // Pas par le sud (le chemin et la caméra).
  return [{ x: -3, z: t }, { x: T + 3, z: t }, { x: t, z: -3 }][Math.floor(aleat() * 3)]!;
}

const ENVOL_MARE = { immobile: 3, discrete: 5, marche: 9, course: 14 };

interface Oiseau {
  modele: ModeleOiseau;
  heron: boolean;
  /** Sa place sur l'eau (canard) ou au bord (héron). */
  place: { x: number; z: number };
  x: number;
  y: number;
  z: number;
  o: number;
  vol: { vx: number; vy: number; vz: number } | null;
  temps: number;
}

// =====================================================================================
// L'ensemble de la faune animée par le client
// =====================================================================================

export class FauneAmbiante {
  readonly groupe = new THREE.Group();
  private lapins: Lapin[] = [];
  private renard: Renard | null = null;
  private oiseaux: Oiseau[] = [];
  /** Les oiseaux sont partis : ils reviennent quand ce minuteur tombe à zéro. */
  private retourOiseaux = 0;
  private prochainCancan = 6;
  private aleat: () => number = Math.random;

  /** Peuple le terrain (graine : le compte, pour que chacun retrouve « ses » bêtes). */
  activer(graine: number): void {
    this.groupe.clear();
    this.aleat = aleatoire(graine * 31 + 5);
    const aleat = this.aleat;
    this.lapins = [];
    for (let i = 0; i < 4; i++) {
      const modele = creerLapin();
      const l: Lapin = { modele, x: 4 + aleat() * (T - 8), z: 3 + aleat() * 20, o: aleat() * 6.28, etat: "broute", minuteur: aleat() * 3, but: null, bond: 0, zig: 0, temps: aleat() * 10 };
      modele.objet.position.set(l.x, 0, l.z);
      this.lapins.push(l);
      this.groupe.add(modele.objet);
    }
    const r = creerRenard();
    this.renard = { modele: r, x: -5, z: 10, o: 0, etat: "absent", minuteur: 40 + aleat() * 60, cible: null, sortie: { x: -3, z: 10 }, pas: 0 };
    r.objet.visible = false;
    this.groupe.add(r.objet);
    this.oiseaux = [];
    for (let i = 0; i < 5; i++) {
      const heron = i === 4;
      const modele = heron ? creerHeron() : creerCanard(i % 2 === 0);
      let place = placeSurLEau(aleat);
      if (heron) {
        const a = aleat() * Math.PI * 2;
        const r2 = rayonMare(a) + 0.15;
        place = { x: MARE.x + Math.cos(a) * r2, z: MARE.z + Math.sin(a) * r2 };
      }
      modele.objet.scale.setScalar(heron ? 1.2 : LISIBLE);
      const o: Oiseau = { modele, heron, place, x: place.x, y: 0, z: place.z, o: aleat() * 6.28, vol: null, temps: aleat() * 10 };
      modele.objet.position.set(o.x, heron ? 0 : 0.02, o.z);
      this.oiseaux.push(o);
      this.groupe.add(modele.objet);
    }
    this.retourOiseaux = 0;
    this.groupe.visible = true;
  }

  desactiver(): void {
    this.groupe.visible = false;
    this.groupe.clear();
    this.lapins = [];
    this.renard = null;
    this.oiseaux = [];
  }

  animer(dt: number, qui: Approche | null, crier: (cri: CriFaune, x: number, z: number) => void): void {
    if (!this.groupe.visible) return;
    for (const l of this.lapins) this.animerLapin(l, dt, qui);
    if (this.renard) this.animerRenard(this.renard, dt, qui);
    this.animerOiseaux(dt, qui, crier);
  }

  // ---------- Lapins ----------

  private animerLapin(l: Lapin, dt: number, qui: Approche | null): void {
    const aleat = this.aleat;
    l.minuteur -= dt;
    l.temps += dt;
    let bouge = false;
    const dQui = qui ? Math.hypot(qui.x - l.x, qui.z - l.z) : Infinity;
    if (l.etat === "broute" && dQui < seuil(qui, FUITE_LAPIN)) this.fuirLapin(l, qui!.x, qui!.z);
    switch (l.etat) {
      case "broute": {
        if (!l.but) {
          if (l.minuteur > 0) break;
          const a = aleat() * Math.PI * 2;
          l.but = { x: Math.min(T - 2, Math.max(2, l.x + Math.cos(a) * 2.5)), z: Math.min(T - 2, Math.max(2, l.z + Math.sin(a) * 2.5)) };
        }
        // De petits bonds, puis on broute.
        const dx = l.but.x - l.x;
        const dz = l.but.z - l.z;
        const reste = Math.hypot(dx, dz);
        if (reste < 0.15) {
          l.but = null;
          l.minuteur = 2 + aleat() * 5;
          l.bond = 0;
          break;
        }
        const pas = Math.min(reste, 1.4 * dt);
        l.o = Math.atan2(dx, dz);
        l.x += (dx / reste) * pas;
        l.z += (dz / reste) * pas;
        l.bond += dt * 9;
        bouge = true;
        break;
      }
      case "fuit": {
        // Il file vers la lisière en zigzag, la queue blanche bien visible.
        const bord = l.but!;
        const dx = bord.x - l.x;
        const dz = bord.z - l.z;
        const reste = Math.hypot(dx, dz);
        if (reste < 0.5) {
          l.etat = "cache";
          l.minuteur = 25 + aleat() * 50;
          l.modele.objet.visible = false;
          break;
        }
        l.zig += dt * 7;
        const lateral = Math.sin(l.zig) * 0.7;
        const ux = dx / reste;
        const uz = dz / reste;
        const vx = ux + -uz * lateral;
        const vz = uz + ux * lateral;
        const n = Math.hypot(vx, vz);
        l.o = Math.atan2(vx, vz);
        l.x += (vx / n) * V_LAPIN * dt;
        l.z += (vz / n) * V_LAPIN * dt;
        l.bond += dt * 16;
        bouge = true;
        break;
      }
      case "cache":
      case "pris": {
        // Un autre sort du bois, un peu plus tard.
        if (l.minuteur > 0) break;
        const p = pointDuBord(aleat);
        l.x = p.x;
        l.z = p.z;
        l.etat = "broute";
        l.but = { x: Math.min(T - 3, Math.max(3, p.x + (T / 2 - p.x) * 0.2)), z: Math.min(T - 3, Math.max(3, p.z + (T / 2 - p.z) * 0.2)) };
        l.modele.objet.visible = true;
        break;
      }
    }
    poserLapin(l.modele, l.etat === "fuit" ? "fuit" : "broute", l.bond, bouge, l.temps);
    l.modele.objet.position.x = l.x;
    l.modele.objet.position.z = l.z;
    l.modele.objet.rotation.y = l.o;
  }

  private fuirLapin(l: Lapin, deX: number, deZ: number): void {
    l.etat = "fuit";
    // Vers la lisière la plus proche, à l'opposé de la menace si possible.
    const fx = l.x + (l.x - deX) * 3;
    const fz = l.z + (l.z - deZ) * 3;
    l.but = bordLePlusProche(Math.min(T, Math.max(0, fx)), Math.min(T, Math.max(0, fz)));
    l.zig = this.aleat() * 6;
  }

  // ---------- Le renard ----------

  private animerRenard(r: Renard, dt: number, qui: Approche | null): void {
    const aleat = this.aleat;
    const objet = r.modele.objet;
    r.minuteur -= dt;
    const dQui = qui ? Math.hypot(qui.x - r.x, qui.z - r.z) : Infinity;
    const visible = r.etat !== "absent";
    if (visible && r.etat !== "fuit" && dQui < seuil(qui, FUITE_RENARD)) {
      // Le joueur l'a dérangé : il lâche tout et file.
      if (r.cible && r.cible.etat === "fuit") r.cible = null;
      r.etat = r.etat === "emporte" ? "emporte" : "fuit";
      r.sortie = bordLePlusProche(r.x + (r.x - qui!.x) * 3, r.z + (r.z - qui!.z) * 3);
    }
    const allerVers = (x: number, z: number, vitesse: number): number => {
      const dx = x - r.x;
      const dz = z - r.z;
      const reste = Math.hypot(dx, dz);
      if (reste > 0.01) {
        const pas = Math.min(reste, vitesse * dt);
        r.o = Math.atan2(dx, dz);
        r.x += (dx / reste) * pas;
        r.z += (dz / reste) * pas;
      }
      r.pas += dt * vitesse * 3;
      return reste;
    };
    switch (r.etat) {
      case "absent": {
        if (r.minuteur > 0) break;
        const proies = this.lapins.filter((l) => l.etat === "broute");
        if (proies.length === 0) {
          r.minuteur = 30;
          break;
        }
        r.cible = proies[Math.floor(aleat() * proies.length)]!;
        const p = bordLePlusProche(r.cible.x, r.cible.z);
        r.x = p.x;
        r.z = p.z;
        r.sortie = p;
        r.etat = "rode";
        r.minuteur = 40;
        objet.visible = true;
        break;
      }
      case "rode": {
        // Il trotte vers sa proie, nez au vent ; s'il tarde trop, il renonce.
        const c = r.cible;
        if (!c || c.etat !== "broute" || r.minuteur <= 0) {
          r.etat = "fuit";
          break;
        }
        const reste = allerVers(c.x, c.z, 2.4);
        if (reste < 11) r.etat = "traque";
        break;
      }
      case "traque": {
        // Ventre à terre, très lentement… puis la charge.
        const c = r.cible;
        if (!c || c.etat !== "broute") {
          r.etat = "fuit";
          break;
        }
        const reste = allerVers(c.x, c.z, 1.1);
        if (reste < 6) {
          r.etat = "charge";
          r.minuteur = 2.6;
          this.fuirLapin(c, r.x, r.z);
        }
        break;
      }
      case "charge": {
        const c = r.cible;
        if (!c || c.etat !== "fuit" || r.minuteur <= 0) {
          // Le lapin a gagné le bois, ou le renard s'essouffle.
          r.etat = "fuit";
          break;
        }
        const reste = allerVers(c.x, c.z, V_RENARD);
        if (reste < 0.45) {
          c.etat = "pris";
          c.minuteur = 90 + aleat() * 90;
          c.modele.objet.visible = false;
          r.etat = "emporte";
          r.sortie = bordLePlusProche(r.x, r.z);
        }
        break;
      }
      case "emporte":
      case "fuit": {
        const reste = allerVers(r.sortie.x, r.sortie.z, r.etat === "emporte" ? 3.5 : V_RENARD * 0.8);
        if (reste < 0.5) {
          r.etat = "absent";
          objet.visible = false;
          r.cible = null;
          r.minuteur = 90 + aleat() * 150;
        }
        break;
      }
    }
    if (r.etat === "fuit" && !objet.visible) r.etat = "absent";
    objet.position.set(r.x, 0, r.z);
    objet.rotation.y = r.o;
    // Traquer : ventre à terre ; courir : les pattes moulinent ; emporter : la proie dans la gueule.
    poserRenard(r.modele, r.etat, r.pas, dt);
  }

  // ---------- Les oiseaux de la mare ----------

  private animerOiseaux(dt: number, qui: Approche | null, crier: (cri: CriFaune, x: number, z: number) => void): void {
    const aleat = this.aleat;
    const poses = this.oiseaux.filter((o) => !o.vol && o.modele.objet.visible);
    const dQui = qui ? Math.hypot(qui.x - MARE.x, qui.z - MARE.z) - MARE.rayon : Infinity;
    // Trop près : tout le monde s'envole, d'un coup.
    if (poses.length > 0 && dQui < seuil(qui, ENVOL_MARE)) {
      for (const o of poses) {
        const loin = Math.atan2(o.x - qui!.x, o.z - qui!.z) + (aleat() - 0.5) * 0.9;
        const v = o.heron ? 5 : 8;
        o.vol = { vx: Math.sin(loin) * v, vy: o.heron ? 1.6 : 3, vz: Math.cos(loin) * v };
      }
      crier("envol", MARE.x, MARE.z);
      crier("cancan", MARE.x, MARE.z);
      this.retourOiseaux = 60 + aleat() * 60;
    }
    if (this.oiseaux.some((o) => !o.modele.objet.visible || o.vol)) {
      this.retourOiseaux -= dt;
      if (this.retourOiseaux <= 0 && dQui > seuil(qui, ENVOL_MARE) + 6) {
        // Ils reviennent : on les remet à leur place (en 0a, sans la descente en vol plané).
        for (const o of this.oiseaux) {
          o.vol = null;
          o.place = o.heron ? o.place : placeSurLEau(aleat);
          o.x = o.place.x;
          o.z = o.place.z;
          o.y = 0;
          o.modele.objet.visible = true;
        }
        crier("cancan", MARE.x, MARE.z);
      }
    }
    for (const o of this.oiseaux) {
      o.temps += dt;
      if (o.vol) {
        o.x += o.vol.vx * dt;
        o.y += o.vol.vy * dt;
        o.z += o.vol.vz * dt;
        o.o = Math.atan2(o.vol.vx, o.vol.vz);
        if (o.y > 30 || Math.hypot(o.x - MARE.x, o.z - MARE.z) > 70) {
          o.vol = null;
          o.modele.objet.visible = false;
        }
      } else if (!o.heron && o.modele.objet.visible) {
        // Les canards dérivent doucement sur l'eau.
        const a = o.temps * 0.15 + o.place.x;
        o.x = o.place.x + Math.cos(a) * 0.5;
        o.z = o.place.z + Math.sin(a) * 0.5;
        o.o = a + Math.PI / 2;
      }
      poserOiseau(o.modele, o.vol !== null, o.temps, dt);
      o.modele.objet.position.set(o.x, o.heron ? o.y : o.y + 0.02 + Math.sin(o.temps * 1.7) * 0.01, o.z);
      o.modele.objet.rotation.y = o.o;
    }
    this.prochainCancan -= dt;
    if (this.prochainCancan <= 0) {
      if (poses.some((o) => !o.heron)) crier("cancan", MARE.x, MARE.z);
      this.prochainCancan = 10 + aleat() * 20;
    }
  }
}
