// La clôture du phare (0.10, K2, essai sur l'iPhone du 2026-10-15) : au nord, à l'ouest et à l'est, le lot s'ouvrait sur
// la lande et l'on butait sur une limite invisible. Un muret de pierres sèches, bas et irrégulier, la dessine : posé
// exactement sur la limite (le bord de la zone du jeu, à 0,5 m du bord du lot), en dehors de ce qu'on peut fouler ; il
// n'ajoute aucun obstacle (la limite existe déjà). Ouvert au nord sur la route d'arrivée ; il s'arrête au bord de la
// falaise. Un seul maillage (un appel de dessin), dans le style du muret d'enceinte du modèle (granit, pierres sèches).
//
// En attendant que la session « bâtiments » le dessine dans le modèle (à lui demander).

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { PHARE, SORTIES_PHARE } from "../../../commun/src/phare.ts";
import { solPhare } from "./phare.ts";

/** Le muret : sa ligne (au ras de la limite, côté lande), sa largeur, la hauteur de ses pierres. */
export const CLOTURE = { retrait: 0.15, largeur: 0.5, hauteur: [0.45, 0.72], pierre: [0.7, 1.3] } as const;

/** Le passage de la route, au nord : la largeur de la sortie (SORTIES_PHARE[0]), un peu élargie. */
const ROUTE = (() => {
  const s = SORTIES_PHARE[0]!;
  return { x1: s.boite.x - s.boite.l / 2 - 0.5, x2: s.boite.x + s.boite.l / 2 + 0.5 };
})();

/** Les tronçons du muret (repère du jeu) : le nord (de part et d'autre de la route), l'ouest, l'est. */
export function tronconsCloture(): { x1: number; z1: number; x2: number; z2: number }[] {
  const r = CLOTURE.retrait;
  const L = PHARE.largeur;
  return [
    { x1: r, z1: r, x2: ROUTE.x1, z2: r },
    { x1: ROUTE.x2, z1: r, x2: L - r, z2: r },
    { x1: r, z1: r, x2: r, z2: PHARE.profondeur },
    { x1: L - r, z1: r, x2: L - r, z2: PHARE.profondeur },
  ];
}

/** Le muret, en un seul maillage. `alea` : un tirage reproductible (le même muret à chaque visite). */
export function creerCloture(alea: () => number = graine(4207)): THREE.Mesh {
  const morceaux: THREE.BufferGeometry[] = [];
  const c = new THREE.Color();
  const granit = [0x8b867b, 0x7d786d, 0x948e81, 0x6f6a60];
  for (const t of tronconsCloture()) {
    const long = Math.hypot(t.x2 - t.x1, t.z2 - t.z1);
    const angle = Math.atan2(t.z2 - t.z1, t.x2 - t.x1);
    for (let u = 0; u < long; ) {
      const l = CLOTURE.pierre[0] + alea() * (CLOTURE.pierre[1] - CLOTURE.pierre[0]);
      const m = Math.min(u + l / 2, long);
      const x = t.x1 + ((t.x2 - t.x1) * m) / long;
      const z = t.z1 + ((t.z2 - t.z1) * m) / long;
      u += l;
      const sol = solPhare(x, z, false);
      // Au bord de la falaise, il s'arrête.
      if (sol < -0.4) break;
      const h = CLOTURE.hauteur[0] + alea() * (CLOTURE.hauteur[1] - CLOTURE.hauteur[0]);
      const g = new THREE.BoxGeometry(l * 0.96, h, CLOTURE.largeur * (0.85 + alea() * 0.3));
      g.rotateZ((alea() - 0.5) * 0.06);
      g.rotateY(-angle + (alea() - 0.5) * 0.08);
      g.translate(x, sol + h / 2 - 0.05, z);
      c.setHex(granit[Math.floor(alea() * granit.length)]!).multiplyScalar(0.92 + alea() * 0.16);
      const couleurs = new Float32Array(g.getAttribute("position").count * 3);
      for (let i = 0; i < couleurs.length; i += 3) couleurs.set([c.r, c.g, c.b], i);
      g.setAttribute("color", new THREE.BufferAttribute(couleurs, 3));
      morceaux.push(g);
    }
  }
  const muret = new THREE.Mesh(mergeGeometries(morceaux) ?? new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 }));
  for (const g of morceaux) g.dispose();
  muret.name = "clôture du phare (muret de pierres sèches)";
  muret.receiveShadow = true;
  return muret;
}

function graine(n: number): () => number {
  let s = n;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}
