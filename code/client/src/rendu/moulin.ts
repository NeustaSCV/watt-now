// Le Moulin du Gué à l'écran (plan 0.8, chantier 12) : le modèle de la session « bâtiments » (batiments/moulin/,
// copié par `npm run batiments:importer`, jamais modifié ici), posé dans le repère du jeu, et ce que le jeu y change.
//
// - Le modèle fournit son sol (`solPropre` : la rivière et le bief sont creusés) sur ses 64 × 54 m ; autour, on étend
//   la prairie, la rivière et la route, pour que le bord du lot ne se voie pas.
// - Ses couches (le haut des murs, les étages, les toits) s'effacent quand le personnage passe dessous ou derrière,
//   comme les toits de la halte (estomperToits) ; leurs boîtes sont ramenées dans le repère du jeu.
// - Le modèle range à part ses objets nommés (`userData.objets`, FICHE.objets) : la grande porte fermée et la grande
//   porte ouverte (cachée au départ) ; ouverte (une fois la grosse clé dans la serrure), on cache l'une et l'on montre
//   l'autre. Ce qu'on emporte et qui est dessiné dans le modèle (la grosse clé au tableau, la fourche contre le mur de
//   l'étable, l'étau sur l'établi du rhabilleur) se cache quand on l'a pris, et revient avec lui.
// - Un Éteint au fond de la fosse du rouet est dessiné au fond (0,85 m sous le sol).

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
// @ts-ignore — le modèle est en JavaScript (session « bâtiments »), sans déclaration de types.
import { creer as creerModele } from "../batiments/moulin/modele.js";
import type { Boite } from "../../../commun/src/lieux.ts";
import { ORIGINE_MODELE_MOULIN, PROFONDEUR_FOSSE, dansLaFosse } from "../../../commun/src/moulin.ts";
import type { TypeRessource } from "../../../commun/src/terrain.ts";
import { estomperToits } from "./halte.ts";
import { nommer } from "./materiaux.ts";

const OX = ORIGINE_MODELE_MOULIN.x;
const OZ = ORIGINE_MODELE_MOULIN.z;

/** L'usure du modèle (0 à 1) : celle par défaut, abandonné depuis quelques hivers. */
const USURE = 0.7;

/** Les objets nommés du modèle (FICHE.objets) que le jeu cache ou montre. */
type ObjetNomme = "porteFermee" | "porteOuverte" | "cle" | "fourche" | "etau";

/** Ce qui se cache quand on l'a pris : la ressource, et l'objet nommé du modèle qui la dessine. */
const PRIS: Partial<Record<TypeRessource, ObjetNomme>> = {
  // La grosse clé et son étiquette, au quatrième clou du tableau.
  moulin_cle: "cle",
  // La fourche appuyée contre le mur de l'étable.
  moulin_fourche: "fourche",
  // L'étau sur l'établi du rhabilleur.
  moulin_etau: "etau",
};

/** Ce que le décor du Moulin garde pour s'animer : les objets nommés du modèle. */
type EtatDecor = Partial<Record<ObjetNomme, THREE.Object3D | null>>;

const etats = new WeakMap<THREE.Object3D, EtatDecor>();

/** Une boîte du modèle, ramenée dans le repère du jeu. */
const auJeu = (b: Boite): Boite => ({ x: b.x + OX, z: b.z + OZ, l: b.l, p: b.p });

export function creerMoulin(): THREE.Group {
  const groupe = new THREE.Group();
  const modele = creerModele({ usure: USURE }) as THREE.Group;
  modele.position.set(OX, 0, OZ);
  // Les couches qui s'effacent, dans le repère du jeu ; le modèle ne garde pas les siennes (on les lirait deux fois).
  // La grande porte ouverte ne s'efface jamais (décision du porteur, 2026-10-13) : ses battants s'ouvrent vers la cour et
  // disparaissaient dès qu'on s'en approchait. Fermée, elle s'efface avec la façade, comme le mur autour.
  const toits = (modele.userData.toits as { nom?: string; boite: Boite; horsDe?: Boite }[]).filter((t) => t.nom !== "grande porte ouverte").map((t) => ({ ...t, boite: auJeu(t.boite), ...(t.horsDe ? { horsDe: auJeu(t.horsDe) } : {}) }));
  delete modele.userData.toits;
  groupe.userData.toits = toits;
  groupe.add(modele, creerAlentours(modele));
  nommer(groupe, ["moulin", "alentours"]);
  etats.set(groupe, (modele.userData.objets ?? {}) as EtatDecor);
  return groupe;
}

/** Les maillages du modèle dont on reprend la matière autour du lot : son sol texturé (tuile de 7 m) et son eau. */
function maillagesDuModele(modele: THREE.Object3D): { sol: THREE.Mesh | null; eau: THREE.Mesh | null } {
  let sol: THREE.Mesh | null = null;
  let eau: THREE.Mesh | null = null;
  modele.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
    if (!m || !(o as THREE.Mesh).isMesh || (o as unknown as THREE.InstancedMesh).isInstancedMesh) return;
    if (!sol && m.map && m.userData.tuile === 7) sol = o as THREE.Mesh;
    if (!eau && m.map && m.transparent && m.metalness === 0.3 && m.roughness === 0.12) eau = o as THREE.Mesh;
  });
  return { sol, eau };
}

/**
 * Autour du lot : la prairie, la rivière qui continue au nord et au sud (et ses berges), le bief qui descend du nord, la
 * route de l'est. Dans les matières du modèle, aux mêmes coordonnées de texture : le bord du lot ne se voit pas. Le sol
 * et l'eau sont ajoutés aux maillages du modèle qui ont leur matière : aucun appel de dessin de plus (0.8.3 : le modèle
 * range à part ses objets nommés, le budget de 40 appels n'a plus de marge). Sans ces maillages, deux maillages à part.
 */
function creerAlentours(modele: THREE.Object3D): THREE.Group {
  const L = 64;
  const P = 54;
  const M = 60;
  const sol = { positions: [] as number[], couleurs: [] as number[], uv: [] as number[] };
  const eau = { positions: [] as number[], couleurs: [] as number[], uv: [] as number[] };
  const c = new THREE.Color();
  /** Un quadrilatère (quatre coins, dans l'ordre), teinté ; la texture se projette d'en haut (ou de face pour les berges). */
  const quad = (cible: typeof sol, coins: [number, number, number][], couleur: number) => {
    c.setHex(couleur);
    for (const k of [0, 1, 2, 0, 2, 3]) {
      const [x, y, z] = coins[k]!;
      cible.positions.push(x, y, z);
      cible.couleurs.push(c.r, c.g, c.b);
      const vertical = Math.abs(coins[0]![1] - coins[2]![1]) > 0.01;
      cible.uv.push((vertical ? z - OZ + x - OX : x - OX) / 7, (vertical ? y : z - OZ) / 7);
    }
  };
  const rect = (cible: typeof sol, x0: number, z0: number, x1: number, z1: number, couleur: number, y = 0) =>
    quad(cible, [[x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0]], couleur);
  /** Une berge : la paroi de terre, du pré (y 0) à l'eau, le long de x, de z0 à z1 ; ses deux faces (on la voit des deux rives). */
  const berge = (x: number, z0: number, z1: number, fond: number) => {
    quad(sol, [[x, 0, z0], [x, fond, z0], [x, fond, z1], [x, 0, z1]], 0x6b5640);
    quad(sol, [[x, 0, z1], [x, fond, z1], [x, fond, z0], [x, 0, z0]], 0x6b5640);
  };
  const herbe = 0x8a9a5c;
  const route = 0xb3aa94;
  const teinteEau = 0x8aa69a;
  // Repère du modèle : la rivière (x 17 → 25), le bief (x 9,5 → 13) et la levée au nord, la route de l'est (z 15 → 19).
  const riv = [17 + OX, 25 + OX] as const;
  const bief = [9.5 + OX, 13 + OX] as const;
  // Au nord : prairie, bief, levée, rivière, prairie.
  rect(sol, -M, -M, bief[0], 0, herbe);
  rect(eau, bief[0], -M, bief[1], 0, teinteEau, -0.6);
  rect(sol, bief[1], -M, riv[0], 0, herbe);
  rect(eau, riv[0], -M, riv[1], 0, teinteEau, -1.5);
  rect(sol, riv[1], -M, L + M, 0, herbe);
  for (const x of bief) berge(x, -M, 0, -0.6);
  for (const x of riv) berge(x, -M, 0, -1.5);
  // Au sud : prairie, rivière, prairie.
  rect(sol, -M, P, riv[0], P + M, herbe);
  rect(eau, riv[0], P, riv[1], P + M, teinteEau, -1.5);
  rect(sol, riv[1], P, L + M, P + M, herbe);
  for (const x of riv) berge(x, P, P + M, -1.5);
  // À l'ouest et à l'est, la prairie ; la route qui file vers l'est (vers le gué).
  rect(sol, -M, 0, 0, P, herbe);
  rect(sol, L, 0, L + M, 15.4 + OZ, herbe);
  rect(sol, L, 15.4 + OZ, L + M, 18.6 + OZ, route, 0.005);
  rect(sol, L, 18.6 + OZ, L + M, P, herbe);
  const { sol: auSol, eau: aLEau } = maillagesDuModele(modele);
  modele.updateMatrixWorld(true);
  const groupe = new THREE.Group();
  for (const [g, cible, mat] of [
    [sol, auSol, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })],
    [eau, aLEau, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.2, transparent: true, opacity: 0.8 })],
  ] as const) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(g.positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(g.couleurs, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(g.uv, 2));
    geo.computeVertexNormals();
    // Dans le maillage du modèle de même matière (ramené dans son repère), s'il a les mêmes attributs.
    const memes = cible && !cible.geometry.index && ["position", "normal", "uv", "color"].every((n) => cible.geometry.getAttribute(n)?.itemSize === geo.getAttribute(n).itemSize);
    const fondu = memes && mergeGeometries([cible.geometry, geo.applyMatrix4(cible.matrixWorld.clone().invert())]);
    if (cible && fondu) {
      cible.geometry.dispose();
      cible.geometry = fondu;
      continue;
    }
    const m = new THREE.Mesh(geo, cible ? cible.material : mat);
    m.receiveShadow = true;
    if ((m.material as THREE.Material).transparent) m.renderOrder = 2;
    groupe.add(m);
  }
  return groupe;
}

/**
 * À chaque image : les couches qui cachent le personnage s'effacent ; la grande porte suit son état ; ce qu'on a pris
 * se cache ; les Éteints de la fosse sont au fond.
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
  // Le jeu pose le Moulin dans un groupe à lui (main.ts, montrerDecor) : on cherche le décor du Moulin dedans. Avant la
  // 0.8.3, seul le groupe donné était lu : en jeu, la grande porte et ce qu'on prenait ne changeaient pas à l'écran.
  let e = etats.get(decor);
  if (!e) decor.traverse((o) => (e ??= etats.get(o)));
  if (!e) return;
  const ouverte = portes.grande_porte === true;
  if (e.porteFermee) e.porteFermee.visible = !ouverte;
  if (e.porteOuverte) e.porteOuverte.visible = ouverte;
  for (const r of ressources) {
    const nom = PRIS[r.donnees.type];
    const objet = nom ? e[nom] : null;
    if (objet) objet.visible = r.donnees.disponible;
  }
  for (const v of eteints) v.objet.position.y = dansLaFosse(v.objet.position.x, v.objet.position.z) ? -PROFONDEUR_FOSSE : 0;
}
