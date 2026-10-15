// Le Grand Hôtel des Flots à l'écran (plan 0.10, chantier J) : le modèle de la session « bâtiments »
// (batiments/grand-hotel/, copié par `npm run batiments:importer`, jamais modifié ici), posé dans le repère du jeu, et ce
// que le jeu y change.
//
// - Un seul repère (S-01) : l'étage est posé au sol, au nord de l'hôtel. Le modèle range ses deux niveaux dans deux
//   groupes nommés, `rez_de_chaussee` et `etage` : on cache celui où le personnage n'est pas (L-2), sinon l'étage se
//   voit du rez-de-chaussée (et le rez-de-chaussée de l'étage).
// - Ses couches (le haut des murs, les étages, le toit, l'enseigne) s'effacent quand le personnage passe dessous ou
//   derrière, comme les toits de la halte (estomperToits) ; leurs boîtes sont ramenées dans le repère du jeu.
// - « Le check-in » : le monticule de sable du robot s'efface quand on l'a dégagé ; la batterie du panneau et la tête du
//   robot vont où le serveur les dit (à leur place, à la borne, posées par terre, ou dans les bras du personnage) ;
//   l'écran de la borne s'allume avec la batterie, et sa lumière avec lui.
// - Ce qu'on emporte et qui est dessiné dans le modèle (les objets-clés de l'étage, le pied de guéridon) se cache quand
//   on l'a pris, et revient avec lui.
// - Ce qui borde le lieu est dans le modèle depuis la 0.10 (R52) : la promenade prolongée, les ganivelles, les dunes, la
//   mer claire puis profonde, la rue au nord (son groupe `alentours`), le panneau de sortie et sa lanterne. À l'étage, on
//   cache les alentours (on est en haut : un sol sombre autour des murs).

import * as THREE from "three";
// @ts-ignore — le modèle est en JavaScript (session « bâtiments »), sans déclaration de types.
import { creer as creerModele } from "../batiments/grand-hotel/modele.js";
import { BORNE, HOTEL, borneAlimentee, niveauHotel, type EtatHotel, type NiveauHotel } from "../../../commun/src/hotel.ts";
import type { Boite } from "../../../commun/src/lieux.ts";
import type { TypeRessource } from "../../../commun/src/terrain.ts";
import { estomperToits } from "./halte.ts";
import { estLanternePanneau, lumiereLanterneModele } from "./lanterne-panneau.ts";
import type { SourceLumiere } from "./lumieres.ts";
import { nommer } from "./materiaux.ts";

const OX = HOTEL.origineModele.x;
const OZ = HOTEL.origineModele.z;

/** L'usure du modèle (0 à 1) : celle par défaut, abandonné depuis quelques hivers. */
const USURE = 0.7;

/** Ce qui se cache quand on l'a pris : la ressource, et l'objet nommé du modèle qui la dessine. */
const PRIS: Partial<Record<TypeRessource, string>> = {
  hotel_couvertures: "couvertures_laine",
  hotel_lanterne: "lanterne_tempete",
  hotel_roulements: "roulements",
  hotel_fer: "fer_a_souder",
  hotel_toles: "toles",
  hotel_gueridon: "pied_gueridon",
};

/** Une lumière du modèle (`userData.lumieres`), dans le repère du jeu. */
interface LumiereModele {
  x: number;
  y: number;
  z: number;
  couleur: number;
  intensite: number;
  portee: number;
  nature: string;
  niveau: NiveauHotel;
}

/** Ce que le décor de l'hôtel garde pour s'animer. */
interface EtatDecor {
  niveaux: Record<NiveauHotel, THREE.Object3D | null>;
  /** Autour du lot (les alentours du modèle : le sable, la mer, la rue), vus du rez-de-chaussée ; le vide autour de l'étage. */
  alentours: THREE.Object3D | null;
  vide: THREE.Object3D;
  objets: Record<string, THREE.Object3D>;
  /** La boîte d'origine de chaque objet qui se déplace (repère du jeu). */
  boites: Record<string, THREE.Box3>;
  lumieres: LumiereModele[];
}

const etats = new WeakMap<THREE.Object3D, EtatDecor>();

/** Une boîte du lot, ramenée dans le repère du jeu. */
const auJeu = (b: Boite): Boite => ({ x: b.x + OX, z: b.z + OZ, l: b.l, p: b.p });

export function creerHotel(): THREE.Group {
  const groupe = new THREE.Group();
  const modele = creerModele({ usure: USURE }) as THREE.Group;
  modele.position.set(OX, 0, OZ);
  // Les couches qui s'effacent, dans le repère du jeu ; le modèle ne garde pas les siennes (on les lirait deux fois).
  const toits = (modele.userData.toits as { boite: Boite; horsDe?: Boite }[]).map((t) => ({ ...t, boite: auJeu(t.boite), ...(t.horsDe ? { horsDe: auJeu(t.horsDe) } : {}) }));
  delete modele.userData.toits;
  groupe.userData.toits = toits;
  const alentours = modele.getObjectByName("alentours") ?? null;
  const vide = creerVide();
  groupe.add(modele, vide);
  nommer(groupe, ["hotel", "vide"]);
  modele.updateMatrixWorld(true);
  const objets = (modele.userData.objets ?? {}) as Record<string, THREE.Object3D>;
  const boites: Record<string, THREE.Box3> = {};
  for (const id of ["batterie_panneau", "tete_robot"]) if (objets[id]) boites[id] = new THREE.Box3().setFromObject(objets[id]);
  const lumieres = (modele.userData.lumieres as LumiereModele[]).map((l) => ({ ...l, x: l.x + OX, z: l.z + OZ }));
  const niveau = (nom: string) => modele.children.find((o) => o.name === nom) ?? null;
  etats.set(groupe, { niveaux: { rez_de_chaussee: niveau("rez_de_chaussee"), etage: niveau("etage") }, alentours, vide, objets, boites, lumieres });
  return groupe;
}

/**
 * À l'étage, le rez-de-chaussée et ses alentours sont cachés : autour des murs de l'étage, un sol sombre (on est
 * en haut, on ne voit pas la rue). Un seul appel de dessin, seulement à l'étage.
 */
function creerVide(): THREE.Mesh {
  const vide = new THREE.Mesh(
    new THREE.PlaneGeometry(HOTEL.largeur + 120, HOTEL.profondeur + 120).rotateX(-Math.PI / 2).translate(HOTEL.largeur / 2, -0.03, HOTEL.profondeur / 2),
    new THREE.MeshStandardMaterial({ color: 0x23262b, roughness: 1 }),
  );
  vide.receiveShadow = true;
  vide.visible = false;
  return vide;
}

/** L'état du décor de l'hôtel, cherché dans le groupe donné (le jeu le pose dans un groupe à lui : main.ts). */
function etatDe(decor: THREE.Object3D): EtatDecor | undefined {
  let e = etats.get(decor);
  if (!e) decor.traverse((o) => (e ??= etats.get(o)));
  return e;
}

/** Déplace un objet du modèle pour que le bas de sa boîte d'origine soit au point (x, y, z) du jeu. */
function placer(objet: THREE.Object3D, boite: THREE.Box3, x: number, y: number, z: number): void {
  const centre = boite.getCenter(new THREE.Vector3());
  objet.position.set(x - centre.x, y - boite.min.y, z - centre.z);
}

/** Où va un objet du check-in : sa place d'origine (null), au sol, sur la borne, ou dans les bras (« bras »). */
function placerObjet(e: EtatDecor, id: "batterie_panneau" | "tete_robot", place: EtatHotel["batterie"] | EtatHotel["tete"], porteur: { x: number; z: number; o: number }): void {
  const objet = e.objets[id];
  const boite = e.boites[id];
  if (!objet || !boite) return;
  if (place === "bras") return porterDevant(objet, boite, porteur.x, porteur.z, porteur.o);
  objet.rotation.set(0, 0, 0);
  if (place === "panneau" || place === "robot") objet.position.set(0, 0, 0);
  // Branchée, la batterie est au pied de la borne ; présentée, la tête trône sur la borne, face au hall.
  else if (place === "borne") id === "batterie_panneau" ? placer(objet, boite, BORNE.x - 0.7, 0.06, BORNE.z + 0.2) : placer(objet, boite, BORNE.x, 1.84, BORNE.z);
  else placer(objet, boite, place.x, 0.06, place.z);
}

/**
 * Ce qu'on a dans les bras (S-08) : l'objet même du modèle, porté devant la poitrine du personnage (à `o`, son
 * orientation), tourné avec lui. Aucun appel de dessin de plus.
 */
function porterDevant(objet: THREE.Object3D, boite: THREE.Box3, x: number, z: number, o: number): void {
  const parent = objet.parent;
  if (!parent) return;
  // Le centre de l'objet dans le repère de son niveau (posé dans le lot, posé dans le jeu : des translations).
  const origine = new THREE.Vector3().setFromMatrixPosition(parent.matrixWorld);
  const c = boite.getCenter(new THREE.Vector3()).sub(origine);
  const devant = new THREE.Vector3(x + Math.sin(o) * 0.42, 1.05, z + Math.cos(o) * 0.42);
  objet.rotation.set(0, o, 0);
  objet.position.copy(devant).sub(origine).sub(c.applyAxisAngle(new THREE.Vector3(0, 1, 0), o));
}

/**
 * À chaque image : le niveau où l'on n'est pas se cache ; les couches qui cachent le personnage s'effacent ; le
 * check-in suit l'état du serveur ; ce qu'on a pris se cache.
 */
export function animerHotel(
  decor: THREE.Object3D,
  x: number,
  z: number,
  /** L'orientation du personnage (ce qu'il porte est devant lui). */
  o: number,
  dt: number,
  lacet: number,
  etat: EtatHotel | null,
  ressources: Iterable<{ donnees: { type: TypeRessource; disponible: boolean } }>,
): void {
  const e = etatDe(decor);
  if (!e) return;
  const ici = niveauHotel(x, z);
  if (e.niveaux.rez_de_chaussee) e.niveaux.rez_de_chaussee.visible = ici === "rez_de_chaussee";
  if (e.niveaux.etage) e.niveaux.etage.visible = ici === "etage";
  if (e.alentours) e.alentours.visible = ici === "rez_de_chaussee";
  e.vide.visible = ici === "etage";
  estomperToits(decor, x, z, dt, lacet);
  for (const r of ressources) {
    const nom = PRIS[r.donnees.type];
    const objet = nom ? e.objets[nom] : null;
    if (objet) objet.visible = r.donnees.disponible;
  }
  if (!etat) return;
  const allumee = borneAlimentee(etat);
  if (e.objets.ecran_borne_eteint) e.objets.ecran_borne_eteint.visible = !allumee;
  if (e.objets.ecran_borne_allume) e.objets.ecran_borne_allume.visible = allumee;
  if (e.objets.sable_robot) e.objets.sable_robot.visible = !etat.degage;
  placerObjet(e, "batterie_panneau", etat.batterie, { x, z, o });
  placerObjet(e, "tete_robot", etat.tete, { x, z, o });
}

/**
 * Les lumières de l'hôtel, celles du niveau où l'on est : la nuit, celles du modèle (le photophore de la marquise, la
 * buvette, le feu du salon, la bougie de la suite, le clair de lune du balcon…) ; le panneau « Zéro-Effort » tant que sa
 * batterie est là ; l'écran de la borne, de jour comme de nuit, seulement quand il est allumé.
 */
export function lumieresHotel(decor: THREE.Object3D | undefined, nuit: boolean, etat: EtatHotel | null, p: { x: number; z: number } | null): SourceLumiere[] {
  const e = decor ? etatDe(decor) : undefined;
  if (!e || !p) return [];
  const ici = niveauHotel(p.x, p.z);
  const sources: SourceLumiere[] = [];
  for (const l of e.lumieres) {
    if (l.niveau !== ici) continue;
    // La lanterne du panneau de sortie (0.10, R0-1) : celle du modèle, la nuit seulement.
    if (estLanternePanneau(l.nature)) {
      if (nuit) sources.push(lumiereLanterneModele(l, { x: 0, z: 0 }));
      continue;
    }
    const borne = l.nature.startsWith("écran de la borne");
    if (borne ? !etat || !borneAlimentee(etat) : !nuit) continue;
    if (l.nature.startsWith("panneau") && etat && etat.batterie !== "panneau") continue;
    const flamme = /feu|bougie|photophore/.test(l.nature);
    sources.push({ x: l.x, y: l.y, z: l.z, couleur: l.couleur, intensite: l.intensite, portee: l.portee, vacillement: flamme ? 0.8 : 0 });
  }
  return sources;
}
