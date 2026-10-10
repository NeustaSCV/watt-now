// Le Moulin du Gué à l'écran (plan 0.8, chantier 12) : le modèle de la session « bâtiments » (batiments/moulin/,
// copié par `npm run batiments:importer`, jamais modifié ici), posé dans le repère du jeu, et ce que le jeu y change.
//
// - Le modèle fournit son sol (`solPropre` : la rivière et le bief sont creusés) sur ses 64 × 54 m ; autour, on étend
//   la prairie, la rivière et la route, pour que le bord du lot ne se voie pas.
// - Ses couches (le haut des murs, les étages, les toits) s'effacent quand le personnage passe dessous ou derrière,
//   comme les toits de la halte (estomperToits) ; leurs boîtes sont ramenées dans le repère du jeu.
// - La grande porte est dessinée fermée dans le modèle : ouverte (une fois la grosse clé dans la serrure), ses deux
//   battants fermés s'effacent et deux battants ouverts, rabattus contre l'embrasure, prennent leur place.
// - Ce qu'on emporte et qui est dessiné dans le modèle (la grosse clé au tableau, la fourche contre le mur de l'étable,
//   l'étau sur l'établi du rhabilleur) s'efface quand on l'a pris, et revient avec lui.
// - Un Éteint au fond de la fosse du rouet est dessiné au fond (0,85 m sous le sol).
//
// L'effacement d'un morceau du modèle : les triangles du modèle fusionné dont le centre tombe dans une boîte sont
// aplatis en un point (et rendus tels quels quand le morceau revient). Rien n'est reconstruit, pas d'appel de dessin
// de plus.

import * as THREE from "three";
// @ts-ignore — le modèle est en JavaScript (session « bâtiments »), sans déclaration de types.
import { creer as creerModele } from "../batiments/moulin/modele.js";
import type { Boite } from "../../../commun/src/lieux.ts";
import { ORIGINE_MODELE_MOULIN, PROFONDEUR_FOSSE, dansLaFosse } from "../../../commun/src/moulin.ts";
import type { TypeRessource } from "../../../commun/src/terrain.ts";
import { estomperToits } from "./halte.ts";
import { materiau, nommer } from "./materiaux.ts";

const OX = ORIGINE_MODELE_MOULIN.x;
const OZ = ORIGINE_MODELE_MOULIN.z;

/** L'usure du modèle (0 à 1) : celle par défaut, abandonné depuis quelques hivers. */
const USURE = 0.7;

/** Une boîte en trois dimensions, dans le repère du modèle. */
interface Boite3 {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
}

/** Les deux battants fermés de la grande porte (sans le seuil, le linteau ni les jambages). */
const BATTANTS_FERMES: Boite3 = { x0: 0.12, x1: 1.88, y0: 0.1, y1: 2.59, z0: 0.9, z1: 1.2 };

/** Ce qui s'efface du modèle quand on l'a pris : la ressource, et la boîte du dessin. */
const PRIS: Partial<Record<TypeRessource, Boite3>> = {
  // La grosse clé et son étiquette, au quatrième clou du tableau.
  moulin_cle: { x0: -16.92, x1: -16.66, y0: 1.33, y1: 1.6, z0: 9.28, z1: 9.34 },
  // La fourche appuyée contre le mur de l'étable : le manche et les dents.
  moulin_fourche: { x0: -6.62, x1: -6.38, y0: 0.08, y1: 1.9, z0: 10.08, z1: 10.66 },
  // L'étau sur l'établi du rhabilleur : la semelle, les mors, la vis.
  moulin_etau: { x0: 2.44, x1: 2.86, y0: 0.96, y1: 1.32, z0: -10.36, z1: -9.7 },
};

/** Un morceau du modèle qu'on peut effacer : les triangles concernés, et leurs sommets d'origine. */
interface Morceau {
  triangles: { attr: THREE.BufferAttribute; debut: number; avant: Float32Array }[];
  efface: boolean;
}

/** Relève les triangles du modèle dont le centre est dans la boîte (repère du modèle). */
function morceau(modele: THREE.Object3D, b: Boite3): Morceau {
  const triangles: Morceau["triangles"] = [];
  modele.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (m as unknown as THREE.InstancedMesh).isInstancedMesh) return;
    const g = m.geometry;
    if (g.index) return;
    const attr = g.getAttribute("position") as THREE.BufferAttribute;
    const a = attr.array as Float32Array;
    for (let i = 0; i + 8 < a.length; i += 9) {
      const cx = (a[i]! + a[i + 3]! + a[i + 6]!) / 3;
      const cy = (a[i + 1]! + a[i + 4]! + a[i + 7]!) / 3;
      const cz = (a[i + 2]! + a[i + 5]! + a[i + 8]!) / 3;
      if (cx < b.x0 || cx > b.x1 || cy < b.y0 || cy > b.y1 || cz < b.z0 || cz > b.z1) continue;
      triangles.push({ attr, debut: i, avant: a.slice(i, i + 9) });
    }
  });
  return { triangles, efface: false };
}

/** Efface (aplatit en un point) ou rend un morceau du modèle. */
function effacer(m: Morceau, oui: boolean): void {
  if (m.efface === oui) return;
  m.efface = oui;
  const touchees = new Set<THREE.BufferAttribute>();
  for (const t of m.triangles) {
    const a = t.attr.array as Float32Array;
    if (oui) for (let k = 3; k < 9; k++) a[t.debut + k] = t.avant[k % 3]!;
    else a.set(t.avant, t.debut);
    touchees.add(t.attr);
  }
  for (const attr of touchees) attr.needsUpdate = true;
}

/** Ce que le décor du Moulin garde pour s'animer. */
interface EtatDecor {
  battantsFermes: Morceau;
  battantsOuverts: THREE.Object3D;
  pris: Map<TypeRessource, Morceau>;
}

const etats = new WeakMap<THREE.Object3D, EtatDecor>();

/** Une boîte du modèle, ramenée dans le repère du jeu. */
const auJeu = (b: Boite): Boite => ({ x: b.x + OX, z: b.z + OZ, l: b.l, p: b.p });

export function creerMoulin(): THREE.Group {
  const groupe = new THREE.Group();
  const modele = creerModele({ usure: USURE }) as THREE.Group;
  modele.position.set(OX, 0, OZ);
  // Les couches qui s'effacent, dans le repère du jeu ; le modèle ne garde pas les siennes (on les lirait deux fois).
  const toits = (modele.userData.toits as { boite: Boite; horsDe?: Boite }[]).map((t) => ({ ...t, boite: auJeu(t.boite), ...(t.horsDe ? { horsDe: auJeu(t.horsDe) } : {}) }));
  delete modele.userData.toits;
  groupe.userData.toits = toits;
  const battantsOuverts = creerBattantsOuverts();
  battantsOuverts.visible = false;
  groupe.add(modele, creerAlentours(), battantsOuverts);
  nommer(groupe, ["moulin", "alentours", "grande-porte"]);
  const pris = new Map<TypeRessource, Morceau>();
  for (const [type, b] of Object.entries(PRIS) as [TypeRessource, Boite3][]) pris.set(type, morceau(modele, b));
  etats.set(groupe, { battantsFermes: morceau(modele, BATTANTS_FERMES), battantsOuverts, pris });
  return groupe;
}

/** Les deux battants de la grande porte, ouverts vers l'intérieur et rabattus contre l'embrasure. */
function creerBattantsOuverts(): THREE.Mesh {
  const geos: THREE.BufferGeometry[] = [];
  for (const [x, sens] of [[0.1, 1], [1.9, -1]] as const) {
    // Le battant (0,88 m de large) pivote sur ses gonds, au bord de l'embrasure, vers l'intérieur du moulin (−z).
    const g = new THREE.BoxGeometry(0.1, 2.5, 0.88).translate(OX + x + sens * 0.06, 1.28, OZ + 0.95 - 0.44);
    geos.push(g);
    for (const y of [0.5, 2.1]) geos.push(new THREE.BoxGeometry(0.04, 0.08, 0.55).translate(OX + x + sens * 0.12, y, OZ + 0.95 - 0.3));
  }
  const g = mergeGeometries(geos);
  const m = new THREE.Mesh(g, materiau(0x8f8676));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Fusionne des géométries indexées simples (des boîtes) en une seule. */
function mergeGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const normales: number[] = [];
  for (const g of geos) {
    const n = g.toNonIndexed();
    positions.push(...(n.getAttribute("position").array as Float32Array));
    normales.push(...(n.getAttribute("normal").array as Float32Array));
  }
  const res = new THREE.BufferGeometry();
  res.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  res.setAttribute("normal", new THREE.Float32BufferAttribute(normales, 3));
  return res;
}

/**
 * Autour du lot : la prairie, la rivière qui continue au nord et au sud, le bief qui descend du nord, la route de l'est.
 * Un seul maillage (couleurs aux sommets), un appel de dessin.
 */
function creerAlentours(): THREE.Mesh {
  const L = 64;
  const P = 54;
  const M = 60;
  const positions: number[] = [];
  const couleurs: number[] = [];
  const c = new THREE.Color();
  const rect = (x0: number, z0: number, x1: number, z1: number, couleur: number, y = -0.01) => {
    c.setHex(couleur);
    for (const [x, z] of [[x0, z0], [x0, z1], [x1, z1], [x0, z0], [x1, z1], [x1, z0]] as const) {
      positions.push(x, y, z);
      couleurs.push(c.r, c.g, c.b);
    }
  };
  const herbe = 0x8a9a5c;
  const eau = 0x6f8a80;
  const route = 0xa48b6a;
  // Repère du modèle : la rivière (x 17 → 25), le bief et la levée (x 9,5 → 17) au nord, la route de l'est (z 15 → 19).
  const riv = [17 + OX, 25 + OX] as const;
  const bief = [9.5 + OX, 13 + OX] as const;
  // Au nord : prairie, bief, levée, rivière, prairie.
  rect(-M, -M, bief[0], 0, herbe);
  rect(bief[0], -M, bief[1], 0, eau, -0.6);
  rect(bief[1], -M, riv[0], 0, herbe);
  rect(riv[0], -M, riv[1], 0, eau, -1.5);
  rect(riv[1], -M, L + M, 0, herbe);
  // Au sud : prairie, rivière, prairie.
  rect(-M, P, riv[0], P + M, herbe);
  rect(riv[0], P, riv[1], P + M, eau, -1.5);
  rect(riv[1], P, L + M, P + M, herbe);
  // À l'ouest et à l'est, la prairie ; la route qui file vers l'est (vers le gué).
  rect(-M, 0, 0, P, herbe);
  rect(L, 0, L + M, 15 + OZ, herbe);
  rect(L, 15 + OZ, L + M, 19 + OZ, route);
  rect(L, 19 + OZ, L + M, P, herbe);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(couleurs, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
  m.receiveShadow = true;
  return m;
}

/**
 * À chaque image : les couches qui cachent le personnage s'effacent ; la grande porte suit son état ; ce qu'on a pris
 * s'efface ; les Éteints de la fosse sont au fond.
 */
export function animerMoulin(
  decor: THREE.Object3D,
  x: number,
  z: number,
  dt: number,
  lacet: number,
  portes: Readonly<Record<string, boolean>>,
  ressources: Iterable<{ donnees: { type: TypeRessource; disponible: boolean } }>,
  eteints: Iterable<{ objet: THREE.Object3D }>,
): void {
  estomperToits(decor, x, z, dt, lacet);
  const e = etats.get(decor);
  if (!e) return;
  const ouverte = portes.grande_porte === true;
  effacer(e.battantsFermes, ouverte);
  e.battantsOuverts.visible = ouverte;
  for (const r of ressources) {
    const m = e.pris.get(r.donnees.type);
    if (m) effacer(m, !r.donnees.disponible);
  }
  for (const v of eteints) v.objet.position.y = dansLaFosse(v.objet.position.x, v.objet.position.z) ? -PROFONDEUR_FOSSE : 0;
}
