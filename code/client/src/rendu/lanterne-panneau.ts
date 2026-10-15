// La lanterne des panneaux de sortie (0.10, décision du porteur du 2026-10-15 : « tous les panneaux de sortie sont
// éclairés par une lanterne au-dessus d'eux ») : une lanterne de fer accrochée au bout d'une potence, au-dessus du
// panneau, qui luit la nuit et l'éclaire. Le phare (le sentier côtier de la grève) s'en sert ; la route du pont, la
// corniche et l'hôtel s'en serviront pour leurs panneaux de sortie.
//
// - `poserLanterne(pose)` rend le maillage (la potence et la lanterne : un maillage, une matière, un appel de dessin),
//   la source de lumière à donner à la réserve de lumières la nuit (rendu/lumieres.ts : on n'en crée pas, elle ne
//   s'allume que si elle est parmi les plus proches du joueur), et `allumer(nuit)` qui fait luire son verre.
// - La pose : le haut du poteau du panneau (là où la potence s'accroche), le sens où le panneau regarde, dans le repère
//   du parent ; `monde` : où est l'origine du parent dans le repère du jeu (pour la source de lumière).
// - Une seule matière, partagée par toutes les lanternes (le verre luit sur la carte d'émission, pas le fer) : de nuit,
//   toutes les lanternes luisent ensemble.

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { SourceLumiere } from "./lumieres.ts";

export interface PoseLanterne {
  /** Le haut du poteau, où la potence s'accroche (repère du parent). */
  x: number;
  y: number;
  z: number;
  /** Le sens où regarde le panneau (rotation autour de y : 0 regarde vers +z). La lanterne pend devant lui. */
  angle: number;
  /** De combien la lanterne pend devant le poteau (m) ; 0,45 par défaut. */
  avance?: number;
  /** L'origine du parent dans le repère du jeu (la source de lumière y est comptée) ; 0 par défaut. */
  monde?: { x: number; y?: number; z: number };
}

export interface LanternePanneau {
  maillage: THREE.Mesh;
  /** La lumière de la lanterne, dans le repère du jeu (à donner à la réserve de lumières, la nuit seulement). */
  source: SourceLumiere;
  /** La nuit, le verre luit ; le jour, il reste éteint. */
  allumer(nuit: boolean): void;
}

/** La lumière d'une lanterne : chaude, un peu vacillante (une flamme), de quoi éclairer le panneau et ses abords. */
export const LUMIERE_LANTERNE = { couleur: 0xffcf8a, intensite: 5, portee: 7, decroissance: 1.5, vacillement: 0.12 } as const;
/** L'éclat du verre, la nuit (sur la carte d'émission) ; le jour, éteint. */
const ECLAT = { nuit: 2.4, jour: 0 } as const;

/** La carte (deux texels) : le fer noirci, le verre jauni ; la carte d'émission : seul le verre luit. */
let matiereLanterne: THREE.MeshStandardMaterial | null = null;
function matiere(): THREE.MeshStandardMaterial {
  if (matiereLanterne) return matiereLanterne;
  const texels = (a: number[], b: number[]) => {
    const t = new THREE.DataTexture(new Uint8Array([...a, 255, ...b, 255]), 2, 1);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.needsUpdate = true;
    return t;
  };
  const carte = texels([42, 40, 38], [255, 236, 190]);
  carte.colorSpace = THREE.SRGBColorSpace;
  matiereLanterne = new THREE.MeshStandardMaterial({ map: carte, emissiveMap: texels([0, 0, 0], [255, 255, 255]), emissive: LUMIERE_LANTERNE.couleur, emissiveIntensity: ECLAT.jour, roughness: 0.6, metalness: 0.3 });
  matiereLanterne.name = "lanterne des panneaux";
  return matiereLanterne;
}

/** Une pièce : ses UV sur un texel (0 : le fer, 1 : le verre). */
function piece(g: THREE.BufferGeometry, texel: 0 | 1): THREE.BufferGeometry {
  const n = g.index ? g.toNonIndexed() : g;
  if (n !== g) g.dispose();
  const uv = n.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, texel ? 0.75 : 0.25, 0.5);
  return n;
}

/** La lanterne au-dessus d'un panneau : la potence, la lanterne pendue au bout, sa lumière. */
export function poserLanterne(pose: PoseLanterne): LanternePanneau {
  const a = pose.avance ?? 0.45;
  const fer = (l: number, h: number, p: number, x: number, y: number, z: number) => piece(new THREE.BoxGeometry(l, h, p).translate(x, y, z), 0);
  // Dans le repère du poteau (y : depuis son haut ; +z : devant le panneau).
  const yL = -0.24; // le milieu du verre, sous la potence
  const pieces = [
    // La potence : un bras de fer, et sa jambe de force.
    fer(0.04, 0.04, a + 0.06, 0, 0, a / 2 - 0.01),
    piece(new THREE.BoxGeometry(0.025, 0.025, Math.hypot(a * 0.6, 0.22)).rotateX(-Math.atan2(0.22, a * 0.6)).translate(0, -0.11, a * 0.3), 0),
    // Le crochet, le chapeau (une pyramide à quatre pans), le cadre et le socle.
    fer(0.015, 0.06, 0.015, 0, -0.04, a),
    piece(new THREE.ConeGeometry(0.11, 0.09, 4).rotateY(Math.PI / 4).translate(0, yL + 0.135, a), 0),
    fer(0.15, 0.025, 0.15, 0, yL + 0.09, a),
    fer(0.14, 0.03, 0.14, 0, yL - 0.09, a),
    ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => fer(0.018, 0.17, 0.018, sx * 0.06, yL, a + sz * 0.06))),
    // Le verre (il luit la nuit).
    piece(new THREE.BoxGeometry(0.11, 0.15, 0.11).translate(0, yL, a), 1),
  ];
  const geo = mergeGeometries(pieces) ?? new THREE.BufferGeometry();
  for (const g of pieces) g.dispose();
  geo.rotateY(pose.angle);
  geo.translate(pose.x, pose.y, pose.z);
  const maillage = new THREE.Mesh(geo, matiere());
  maillage.name = "lanterne de panneau";
  maillage.castShadow = false;
  const m = pose.monde ?? { x: 0, z: 0 };
  const source: SourceLumiere = {
    x: m.x + pose.x + Math.sin(pose.angle) * a,
    y: (m.y ?? 0) + pose.y + yL,
    z: m.z + pose.z + Math.cos(pose.angle) * a,
    couleur: LUMIERE_LANTERNE.couleur,
    intensite: LUMIERE_LANTERNE.intensite,
    portee: LUMIERE_LANTERNE.portee,
    decroissance: LUMIERE_LANTERNE.decroissance,
    vacillement: LUMIERE_LANTERNE.vacillement,
  };
  return {
    maillage,
    source,
    allumer: (nuit) => {
      (maillage.material as THREE.MeshStandardMaterial).emissiveIntensity = nuit ? ECLAT.nuit : ECLAT.jour;
    },
  };
}
