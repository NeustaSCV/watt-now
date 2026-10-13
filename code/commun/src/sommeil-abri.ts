// Dormir dans l'abri (0.8.2, chantier I : R12 ; Q-0.8.2-7) : le personnage se rend accroupi jusqu'à sa couche, par
// l'ouverture, et dort dedans, à une place fixe de l'abri (plus au hasard autour, là où il se tenait).
// Partagé par le serveur (qui fait foi) et par le client (qui prédit le trajet, comme le déplacement ordinaire).
//
// Le repère de l'abri est celui de son modèle (client/src/rendu/installations.ts) : la perche faîtière court le long de
// x, à z = −0,5 et 1,45 m de haut (le côté ouvert, haut, regarde −z) ; la bâche descend jusqu'au sol vers z = +0,95. Les
// deux bouts (x = ±1,36) sont ouverts ; l'abri fermé (niveau 3) tend sa toile côté −x et garde son entrée côté +x. La
// litière est sous la bâche, la couverture roulée (l'oreiller) côté −x.

import type { Position } from "./deplacement.ts";
import { ALLURES } from "./regles.ts";

/** Un point au sol. */
export interface Point {
  x: number;
  z: number;
}

/** L'abri, tel qu'on le connaît des deux côtés : sa place et son orientation. */
export interface AbriPose {
  x: number;
  z: number;
  o: number;
}

/** La couche, dans le repère de l'abri : le milieu de la litière, sous la bâche. */
const COUCHE = { x: 0.15, z: 0.12 } as const;
/**
 * L'orientation du corps couché, dans le repère de l'abri : la pose couchée (« LayToIdle ») allonge le corps le long de
 * l'axe avant-arrière du personnage, la tête en arrière ; on le couche le long de la perche, la tête vers l'oreiller (−x).
 */
const O_COUCHE = Math.PI / 2;
/** On se rend à la couche à l'allure discrète : le déplacement accroupi existant (Q-0.8.2-7). */
export const ALLURE_VERS_COUCHE = ALLURES.discrete;
/** Arrivé à moins de ce pas d'un point du trajet, on passe au suivant (m). */
const PAS_ARRIVE = 0.02;

/** Un point du repère de l'abri, dans le monde. */
function versMonde(abri: AbriPose, lx: number, lz: number): Point {
  const c = Math.cos(abri.o);
  const s = Math.sin(abri.o);
  return { x: abri.x + lx * c + lz * s, z: abri.z - lx * s + lz * c };
}

/** Un point du monde, dans le repère de l'abri. */
function versAbri(abri: AbriPose, x: number, z: number): Point {
  const dx = x - abri.x;
  const dz = z - abri.z;
  const c = Math.cos(abri.o);
  const s = Math.sin(abri.o);
  return { x: dx * c - dz * s, z: dx * s + dz * c };
}

/** La place de la couche dans le monde, et l'orientation du dormeur. */
export function placeDeLaCouche(abri: AbriPose): Position {
  const p = versMonde(abri, COUCHE.x, COUCHE.z);
  return { x: p.x, z: p.z, o: abri.o + O_COUCHE };
}

/**
 * Le trajet jusqu'à la couche, d'où l'on se tient : par le côté ouvert (derrière, sous la faîtière) ou par l'entrée de
 * l'abri fermé (côté +x) ; jamais à travers la bâche. Le dernier point est la couche elle-même.
 */
export function cheminVersLaCouche(abri: AbriPose, depart: Point): Point[] {
  const l = versAbri(abri, depart.x, depart.z);
  const couche = versMonde(abri, COUCHE.x, COUCHE.z);
  // Déjà dessous : droit à la couche.
  if (Math.abs(l.x) < 1.3 && l.z > -0.6 && l.z < 0.95) return [couche];
  const ouvert = (lx: number) => versMonde(abri, lx, -1.05);
  const entree = versMonde(abri, 1.85, COUCHE.z);
  // Derrière, du côté ouvert : on se baisse sous la faîtière.
  if (l.z <= -0.6) return [ouvert(Math.max(-1, Math.min(1, l.x))), couche];
  // Sur le côté de l'entrée : on entre par le bout.
  if (l.x >= 1.3) return [entree, couche];
  // Devant la bâche, ou du côté de la toile : on contourne par le bout de l'entrée.
  return [versMonde(abri, 1.85, Math.max(l.z, 1.3)), entree, couche];
}

/**
 * Un pas de `dt` secondes le long du trajet, à l'allure accroupie. Rend la nouvelle position et ce qui reste du trajet
 * (vide : on est couché à sa place, tourné comme il faut).
 */
export function avancerVersLaCouche(position: Position, chemin: readonly Point[], dt: number, oCouche: number): { position: Position; chemin: Point[] } {
  let reste = ALLURE_VERS_COUCHE * dt;
  let p = position;
  const suite = [...chemin];
  while (suite.length > 0 && reste > 0) {
    const but = suite[0]!;
    const d = Math.hypot(but.x - p.x, but.z - p.z);
    if (d <= Math.max(reste, PAS_ARRIVE)) {
      reste -= d;
      p = { x: but.x, z: but.z, o: d > 1e-6 ? Math.atan2(but.x - p.x, but.z - p.z) : p.o };
      suite.shift();
      continue;
    }
    const k = reste / d;
    p = { x: p.x + (but.x - p.x) * k, z: p.z + (but.z - p.z) * k, o: Math.atan2(but.x - p.x, but.z - p.z) };
    reste = 0;
  }
  if (suite.length === 0) p = { ...p, o: oCouche };
  return { position: p, chemin: suite };
}
