// L'épave du phare à l'écran, ce que le jeu retouche dans le modèle de la session « bâtiments » (0.10, essai sur l'iPhone
// du 2026-10-15), sans toucher au fichier du modèle (client/src/batiments/phare/modele.js, copié tel quel) : on reprend
// ses maillages fondus une fois construits.
//
// - Les trois conteneurs (la Livraison du Jour et les provisions du bord, sur la grève ; l'outillage, sur le pont) : le
//   modèle les fond avec le reste (le bas de l'épave, ou la couche de la coque). Quand on y entre, le jeu cache leur toit
//   et leurs parois (la caméra est en hauteur, de biais : le toit seul ôté, la paroi de devant cachait encore tout
//   l'intérieur, essai en vrai du 2026-10-15) : avec la lampe, on voit dedans ce qu'on peut prendre.
// - L'ouverture du pavois à l'échelle de coupée : le modèle dessine le pavois (la tôle d'un mètre au-dessus du pont, et sa
//   lisse blanche) d'un seul tenant, alors que la coque laisse passer à pied vers l'échelle : du pont, on croyait ne pas
//   pouvoir redescendre. Le jeu abaisse la tôle et ôte la lisse sur la largeur de l'échelle (la coupée).
//
// Les conteneurs sont retrouvés par leurs parois (`obstaclesEpave` du modèle : commun/src/phare-modele.ts) ; la coque par
// son repère (EPAVE et ponCoque du modèle, recopiés ici : à garder d'accord avec lui).

import * as THREE from "three";
import { SEGMENTS_EPAVE, type SegmentModele } from "../../../commun/src/phare-modele.ts";

/**
 * Un conteneur qui s'ouvre (le format des couches de `userData.toits`, repère du modèle, sans matière à fondre : on le
 * cache d'un coup, `montrerConteneurs`), avec le sol d'où compter ses hauteurs.
 */
export interface ToitConteneur {
  nom: string;
  boite: { x: number; z: number; l: number; p: number };
  bas: number;
  haut: number;
  materiaux: THREE.Material[];
  solCouche: number;
  /** Rempli par estomperToits (rendu/halte.ts) : il cache le personnage (on est dedans, ou derrière). */
  efface?: boolean;
}

/** Le repère d'un conteneur, vu d'en haut (repère du modèle) : son milieu, son grand axe, ses demi-longueur et demi-largeur. */
interface RepereConteneur {
  nom: string;
  x: number;
  z: number;
  ux: number;
  uz: number;
  demiLong: number;
  demiLarge: number;
}

/** Les conteneurs de l'épave, d'après leurs parois : les deux grands flancs donnent le milieu, l'axe et la largeur. */
export function conteneursEpave(segments: readonly SegmentModele[] = SEGMENTS_EPAVE): RepereConteneur[] {
  const parNom = new Map<string, SegmentModele[]>();
  for (const s of segments) {
    if (!s.nature.startsWith("conteneur")) continue;
    const liste = parNom.get(s.nature) ?? [];
    liste.push(s);
    parNom.set(s.nature, liste);
  }
  const res: RepereConteneur[] = [];
  for (const [nature, liste] of parNom) {
    const flancs = liste.filter((s) => Math.hypot(s.x2 - s.x1, s.z2 - s.z1) > 2.5);
    if (flancs.length !== 2) continue;
    const [a, b] = flancs as [SegmentModele, SegmentModele];
    const long = Math.hypot(a.x2 - a.x1, a.z2 - a.z1);
    const ux = (a.x2 - a.x1) / long;
    const uz = (a.z2 - a.z1) / long;
    const x = (a.x1 + a.x2 + b.x1 + b.x2) / 4;
    const z = (a.z1 + a.z2 + b.z1 + b.z2) / 4;
    // Les flancs du modèle sont 12 cm au-dehors de la tôle.
    const ecart = Math.abs((b.x1 - a.x1) * -uz + (b.z1 - a.z1) * ux);
    res.push({ nom: nature.replace(/ \(paroi\)$/, ""), x, z, ux, uz, demiLong: long / 2, demiLarge: ecart / 2 - 0.12 });
  }
  return res;
}

/** Les attributs d'une géométrie sans index, triangle par triangle : ceux qu'on garde, ceux qu'on prend. */
function separer(geo: THREE.BufferGeometry, prendre: (t: number) => boolean): { reste: THREE.BufferGeometry; pris: THREE.BufferGeometry | null } {
  const pos = geo.getAttribute("position");
  const n = pos.count / 3;
  const choisis: boolean[] = [];
  let nPris = 0;
  for (let t = 0; t < n; t++) {
    const p = prendre(t);
    choisis.push(p);
    if (p) nPris++;
  }
  if (nPris === 0) return { reste: geo, pris: null };
  const reste = new THREE.BufferGeometry();
  const pris = new THREE.BufferGeometry();
  for (const nom of Object.keys(geo.attributes)) {
    const a = geo.getAttribute(nom) as THREE.BufferAttribute;
    const k = a.itemSize * 3;
    const r = new Float32Array((n - nPris) * k);
    const q = new Float32Array(nPris * k);
    let ir = 0;
    let iq = 0;
    for (let t = 0; t < n; t++) {
      for (let j = 0; j < k; j++) {
        const v = a.array[t * k + j]!;
        if (choisis[t]) q[iq++] = v;
        else r[ir++] = v;
      }
    }
    reste.setAttribute(nom, new THREE.BufferAttribute(r, a.itemSize));
    pris.setAttribute(nom, new THREE.BufferAttribute(q, a.itemSize));
  }
  return { reste, pris };
}

/**
 * Range les triangles d'une géométrie sans index : ceux du premier groupe au début, ceux du second à la fin, le reste entre
 * les deux (on cache l'un ou l'autre en ne dessinant qu'une tranche : `drawRange`, un seul appel de dessin).
 */
function ranger(geo: THREE.BufferGeometry, groupe: (t: number) => 0 | 1 | -1): { geo: THREE.BufferGeometry; debut: number; fin: number } {
  const n = geo.getAttribute("position").count / 3;
  const ordre: number[][] = [[], [], []];
  for (let t = 0; t < n; t++) {
    const g = groupe(t);
    ordre[g === 0 ? 0 : g === 1 ? 2 : 1]!.push(t);
  }
  const suite = [...ordre[0]!, ...ordre[1]!, ...ordre[2]!];
  const res = new THREE.BufferGeometry();
  for (const nom of Object.keys(geo.attributes)) {
    const a = geo.getAttribute(nom) as THREE.BufferAttribute;
    const k = a.itemSize * 3;
    const r = new Float32Array(n * k);
    suite.forEach((t, i) => r.set((a.array as Float32Array).subarray(t * k, t * k + k), i * k));
    res.setAttribute(nom, new THREE.BufferAttribute(r, a.itemSize));
  }
  return { geo: res, debut: ordre[0]!.length * 3, fin: ordre[2]!.length * 3 };
}

/** Le milieu d'un triangle. */
function milieu(pos: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, t: number): [number, number, number] {
  let x = 0;
  let y = 0;
  let z = 0;
  for (let j = 0; j < 3; j++) {
    x += pos.getX(t * 3 + j);
    y += pos.getY(t * 3 + j);
    z += pos.getZ(t * 3 + j);
  }
  return [x / 3, y / 3, z / 3];
}

/** Les maillages de l'épave (le bas, toujours visible ; la couche de la coque, et son maillage d'ombre seule). */
function maillages(epave: THREE.Object3D): THREE.Mesh[] {
  const res: THREE.Mesh[] = [];
  epave.traverse((o) => {
    const m = o as THREE.Mesh;
    // Les objets nommés (la cloche, le rabot…) ont leur propre groupe : on ne touche qu'aux maillages fondus.
    if (m.isMesh && !(o as unknown as THREE.InstancedMesh).isInstancedMesh && !m.geometry.index && !Array.isArray(m.material) && !o.userData.nom && !o.parent?.userData.nom) res.push(m);
  });
  return res;
}

/** Un maillage dont on cache, d'un coup, les conteneurs rangés au début et à la fin (`ranger`). */
interface MaillageOuvert {
  maillage: THREE.Mesh;
  total: number;
  debut: { n: number; conteneur: ToitConteneur } | null;
  fin: { n: number; conteneur: ToitConteneur } | null;
}

const ouverts = new WeakMap<THREE.Object3D, MaillageOuvert[]>();

/**
 * Prépare l'ouverture des conteneurs : dans chaque maillage de l'épave (la tôle, les panneaux peints, la couche de la
 * coque), les triangles du toit et des parois de chaque conteneur (au-dessus de 25 cm de son plancher, dans son emprise)
 * sont rangés au début ou à la fin ; `montrerConteneurs` ne dessine plus que le reste quand on est dedans (ou derrière,
 * vu de la caméra). Restent le plancher et ce qu'il y a dedans : comme une maison dont les murs s'effacent au-dessus de
 * l'allège. Aucun maillage ni matière de plus (le budget du phare est à 40 appels). Renvoie les
 * couches (une par conteneur), à joindre à `userData.toits` : elles disent quand le conteneur cache le personnage.
 */
export function ouvrirConteneurs(epave: THREE.Object3D, plancher: (x: number, z: number) => number): ToitConteneur[] {
  const liste = maillages(epave).filter((m) => (m.material as THREE.MeshBasicMaterial).colorWrite !== false);
  const conteneurs = conteneursEpave().map((c) => {
    const sol = plancher(c.x, c.z);
    // L'emprise (alignée sur les axes) : le conteneur, tourné ou non, ses portes rabattues comprises.
    const ex = Math.abs(c.ux) * c.demiLong + Math.abs(c.uz) * (c.demiLarge + 0.15);
    const ez = Math.abs(c.uz) * c.demiLong + Math.abs(c.ux) * (c.demiLarge + 0.15);
    const couche: ToitConteneur = { nom: `${c.nom} (toit et parois)`, boite: { x: c.x, z: c.z, l: ex * 2, p: ez * 2 }, bas: 0.3, haut: 2.7, materiaux: [], solCouche: sol };
    /**
     * Ce triangle est-il du toit ou d'une paroi (tôle, longerons, montants, fond fermé, portes rabattues, panneaux peints) ?
     * Ce qu'il y a dedans (à 12 cm au moins des parois, sous 2,2 m) reste.
     */
    const prend = (x: number, y: number, z: number) => {
      const dx = x - c.x;
      const dz = z - c.z;
      const a = Math.abs(dx * c.ux + dz * c.uz);
      const b = Math.abs(-dx * c.uz + dz * c.ux);
      if (a > c.demiLong + 0.05 || b > c.demiLarge + 0.15 || y < sol + 0.25 || y > sol + 3) return false;
      return b >= c.demiLarge - 0.12 || a >= c.demiLong - 0.12 || y > sol + 2.2;
    };
    return { couche, prend };
  });
  const res: MaillageOuvert[] = [];
  for (const m of liste) {
    const pos = m.geometry.getAttribute("position");
    // Les conteneurs que ce maillage dessine (deux au plus : l'un au début, l'autre à la fin).
    const presents = conteneurs.filter((c) => {
      for (let t = 0; t < pos.count / 3; t++) if (c.prend(...milieu(pos, t))) return true;
      return false;
    });
    if (!presents.length || presents.length > 2) continue;
    const [premier, second] = presents;
    const { geo, debut, fin } = ranger(m.geometry, (t) => {
      const p = milieu(pos, t);
      return premier!.prend(...p) ? 0 : second?.prend(...p) ? 1 : -1;
    });
    m.geometry.dispose();
    m.geometry = geo;
    geo.computeBoundingSphere();
    res.push({
      maillage: m,
      total: geo.getAttribute("position").count,
      debut: { n: debut, conteneur: premier!.couche },
      fin: second ? { n: fin, conteneur: second.couche } : null,
    });
  }
  ouverts.set(epave, res);
  return conteneurs.map((c) => c.couche);
}

/**
 * À chaque image, après estomperToits : un conteneur qui cache le personnage (on y est, ou derrière) ne dessine plus son
 * toit ni ses parois ; les autres, tout.
 */
export function montrerConteneurs(epave: THREE.Object3D): void {
  for (const o of ouverts.get(epave) ?? []) {
    const sansDebut = o.debut?.conteneur.efface === true ? o.debut.n : 0;
    const sansFin = o.fin?.conteneur.efface === true ? o.fin.n : 0;
    o.maillage.geometry.setDrawRange(sansDebut, o.total - sansDebut - sansFin);
  }
}

// ---------- La coupée : l'ouverture du pavois au haut de l'échelle ----------

/** Le repère de la coque du modèle (EPAVE : au milieu de la cassure ; + x local vers la grève, + z local vers la proue). */
const EPAVE = { x: -3.4, z: 23.75, ry: Math.atan2(-0.26, -0.966) } as const;
/** La hauteur du pont de la coque à la station s (ponCoque du modèle). */
const pont = (s: number) => -4.2 + 0.5 * (s / 8.6) ** 2;
/** Le pavois s'ouvre entre ces stations du modèle (autour de l'échelle, s = 4,5 ± 0,65 : les stations 4,2 et 5,0). */
const COUPEE = { de: 3.4, a: 5.8, stations: [4.2, 5.0] } as const;

/** Du repère du modèle à celui de la coque : (lx, s). */
function versCoque(x: number, z: number): [number, number] {
  const c = Math.cos(EPAVE.ry);
  const sn = Math.sin(EPAVE.ry);
  const dx = x - EPAVE.x;
  const dz = z - EPAVE.z;
  return [dx * c - dz * sn, dx * sn + dz * c];
}

/**
 * Ouvre le pavois à l'échelle de coupée (côté grève, + x local) : ôte la lisse entre les stations 3,4 et 5,8, et abaisse
 * au ras du pont le haut de la tôle aux stations 4,2 et 5,0. Renvoie le nombre de sommets abaissés (pour les tests).
 */
export function ouvrirLaCoupee(epave: THREE.Object3D): number {
  let abaisses = 0;
  for (const m of maillages(epave)) {
    const pos = m.geometry.getAttribute("position");
    // La lisse du pavois (une poutre à 1,02 m au-dessus du pont).
    const { reste, pris } = separer(m.geometry, (t) => {
      const [x, y, z] = milieu(pos, t);
      const [lx, s] = versCoque(x, z);
      return lx > 1.5 && s > COUPEE.de - 0.05 && s < COUPEE.a + 0.05 && y > pont(s) + 0.9 && y < pont(s) + 1.15;
    });
    if (pris) {
      pris.dispose();
      m.geometry.dispose();
      m.geometry = reste;
    }
    // Le haut de la tôle du pavois (le profil de la coque monte à 1 m au-dessus du pont) : au ras du pont.
    const p = m.geometry.getAttribute("position") as THREE.BufferAttribute;
    const touches = new Set<number>();
    for (let i = 0; i < p.count; i++) {
      const [lx, s] = versCoque(p.getX(i), p.getZ(i));
      if (lx < 1.5 || !COUPEE.stations.some((st) => Math.abs(s - st) < 0.02)) continue;
      if (Math.abs(p.getY(i) - (pont(s) + 1.0)) > 0.02) continue;
      p.setY(i, pont(s) + 0.05);
      touches.add(Math.floor(i / 3));
      abaisses++;
    }
    if (!touches.size) continue;
    p.needsUpdate = true;
    // Les normales des triangles retouchés (des facettes : la coque est dessinée ainsi).
    const n = m.geometry.getAttribute("normal") as THREE.BufferAttribute | undefined;
    if (n) {
      const a = new THREE.Vector3();
      const b = new THREE.Vector3();
      const c = new THREE.Vector3();
      for (const t of touches) {
        a.fromBufferAttribute(p, t * 3);
        b.fromBufferAttribute(p, t * 3 + 1);
        c.fromBufferAttribute(p, t * 3 + 2);
        const normale = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
        for (let j = 0; j < 3; j++) n.setXYZ(t * 3 + j, normale.x, normale.y, normale.z);
      }
      n.needsUpdate = true;
    }
    m.geometry.computeBoundingSphere();
  }
  return abaisses;
}
