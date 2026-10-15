// Les bords de la route du pont (0.10, R52 ; décision du porteur du 2026-10-15, revue .claude-travail/revue-r52/) :
//
// - aux bouts ouest et est (x = 0,5 et 199,5, de part et d'autre de la route), là où l'on butait sur une limite
//   invisible : une ganivelle de châtaignier et des dunes, posées sur la limite, la route restant ouverte ; de même au
//   sud des deux terre-pleins de sable (z = 69,5), là où on la touche à pied ;
// - la ganivelle du nord (celle du modèle, z = 4,5) prolongée d'une vingtaine de mètres au-delà des deux bouts ;
// - sur les plaques de sable unies des alentours : des dunes, des oyats, quelques piquets d'anciennes ganivelles ;
// - la lanterne au-dessus des deux panneaux de sortie (rendu/lanterne-panneau.ts), qui les éclaire la nuit.
//
// Rien de tout cela n'ajoute d'obstacle : la ganivelle est posée sur la limite, en dehors de ce qu'on foule, et le reste
// est hors de la zone. Deux chantiers (l'ouest, l'est : chacun sort de l'image quand on est à l'autre bout), fusionnés
// par matière, dans les matières du modèle (ses dunes, ses oyats). En attendant que la session « bâtiments » les dessine
// dans le modèle (à lui demander).

import * as THREE from "three";
import { ZONE_ROUTE_PONT } from "../../../commun/src/route-pont.ts";
import type { LanternePanneau } from "./lanterne-panneau.ts";
import { ganivelle, lanterneSurPanneau, lesBordsTouches, type ChantierModele } from "./decor-cote.ts";
// @ts-expect-error : les outils des modèles sont en JavaScript, sans types (client/src/batiments/ ne se modifie pas).
import { Chantier } from "../batiments/commun/atelier.js";
// @ts-expect-error : idem (les matières, les dunes et les oyats du modèle de la route du pont).
import * as objetsJs from "../batiments/halte-route-pont/objets.js";

type Matieres = Record<"sol" | "mat" | "metal", THREE.Material>;
const objets = objetsJs as unknown as {
  matieres(): Matieres;
  dune(c: ChantierModele, M: Matieres, x: number, z: number, l: number, p: number, h: number, oyats?: number): void;
  semerOyats(c: ChantierModele, M: Matieres, x1: number, z1: number, x2: number, z2: number, n: number, y?: number): void;
};

/** La limite de la zone, les bouts du lot, la route (ses trottoirs compris), la ganivelle du nord du modèle. */
const BORD = { ouest: ZONE_ROUTE_PONT.xMin - 0.2, est: ZONE_ROUTE_PONT.xMax + 0.2, sud: ZONE_ROUTE_PONT.zMax + 0.2 } as const;
const ROUTE = { z0: 29.3, z1: 40.7 } as const;
const GANIVELLE_NORD = 4.5;
/** Les deux panneaux de sortie du modèle (FICHE.panneaux, repère du jeu) : 3,4 m de large, le haut à 2,13 m. */
export const PANNEAUX_SORTIE_PONT = [
  { x: 5, z: 28.4, cote: 1 as const },
  { x: 195, z: 41.6, cote: -1 as const },
];

/** Un tirage reproductible. */
function graine(n: number): () => number {
  let s = n;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

/**
 * Un bout du pont : `x(u)` ramène une abscisse de l'ouest (u : 0 au bord du lot, négatif au-delà) au bout voulu (l'est
 * est le miroir de l'ouest). Rend son groupe et la lanterne de son panneau.
 */
function creerBout(cote: "ouest" | "est"): { groupe: THREE.Group; lanterne: LanternePanneau } {
  const M = objets.matieres();
  const c = new Chantier(cote === "ouest" ? 811 : 812) as ChantierModele;
  const est = cote === "est";
  const X = (u: number) => (est ? 200 - u : u);
  const limite = est ? BORD.est : BORD.ouest;
  const versDedans = { x: est ? -1 : 1, z: 0 };
  const zone = ZONE_ROUTE_PONT;
  const A = graine(est ? 3307 : 3301);

  // La ganivelle sur la limite, de part et d'autre de la route, là où on la touche.
  for (const [z1, z2] of [[GANIVELLE_NORD, ROUTE.z0], [ROUTE.z1, BORD.sud]] as const) {
    const s = { x1: limite, z1, x2: limite, z2 };
    ganivelle(c, M.mat, M.metal, s, 0.35, lesBordsTouches(zone, s, versDedans), est ? 21 : 11);
  }
  // Au sud du terre-plein, de même (jusqu'au quai).
  const sud = { x1: X(0.3), z1: BORD.sud, x2: X(49), z2: BORD.sud };
  const toucheSud = lesBordsTouches(zone, sud, { x: 0, z: -1 });
  ganivelle(c, M.mat, M.metal, sud, 0.35, toucheSud, est ? 23 : 13);
  // La ganivelle du nord, prolongée au-delà du bout.
  ganivelle(c, M.mat, M.metal, { x1: X(-21), z1: GANIVELLE_NORD, x2: X(0.2), z2: GANIVELLE_NORD }, 0.4, () => true, est ? 25 : 15);

  // Les dunes posées sur la limite (côté dehors : elles débordent d'un mètre au plus sur ce qu'on foule).
  for (let z = GANIVELLE_NORD + 3; z < BORD.sud + 4; z += 5.5 + A() * 2.5) {
    if (z > ROUTE.z0 - 3 && z < ROUTE.z1 + 3) continue;
    const l = 5 + A() * 4;
    const p = 4 + A() * 3;
    objets.dune(c, M, X(-Math.max(l, p) / 2 + 0.9), z, l, p, 0.7 + A() * 0.6, 5);
  }
  for (let u = 3; u < 47; u += 6 + A() * 3) {
    if (!toucheSud(u)) continue;
    const l = 5 + A() * 3;
    const p = 4 + A() * 2;
    objets.dune(c, M, X(u), BORD.sud + Math.max(l, p) / 2 - 0.9, l, p, 0.6 + A() * 0.6, 5);
  }

  // Les plaques de sable des alentours : au-delà du bout (hors de la route), au nord et au sud du terre-plein.
  const plaques: [number, number, number, number][] = [
    [-80, -6, -70, ROUTE.z0 - 2],
    [-80, -6, ROUTE.z1 + 2, 140],
    [2, 40, -70, -3],
    [2, 40, 74, 140],
  ];
  for (const [u0, u1, z0, z1] of plaques) {
    const surface = (u1 - u0) * (z1 - z0);
    for (let i = 0; i < surface / 380; i++) objets.dune(c, M, X(u0 + A() * (u1 - u0)), z0 + A() * (z1 - z0), 6 + A() * 9, 4 + A() * 6, 0.6 + A() * 1.1, 3);
    const x1 = X(u0);
    const x2 = X(u1);
    objets.semerOyats(c, M, Math.min(x1, x2), z0, Math.max(x1, x2), z1, Math.round(surface / 150));
    // Quelques piquets d'une ganivelle disparue, en file, penchés.
    for (let i = 0; i < surface / 1800; i++) {
      const x = X(u0 + A() * (u1 - u0));
      const z = z0 + A() * (z1 - z0);
      const sens = A() * Math.PI;
      for (let k = 0; k < 4 + A() * 5; k++) {
        const h = 0.5 + A() * 0.6;
        c.boite(0.07, h, 0.07, 0x7a6e5e, { x: x + Math.cos(sens) * k * 1.6, y: h / 2 - 0.1, z: z + Math.sin(sens) * k * 1.6, rx: (A() - 0.5) * 0.4, rz: (A() - 0.5) * 0.4 }, M.mat, { nuance: 0.1 });
      }
    }
  }
  // Des oyats le long de la ganivelle, des deux côtés.
  objets.semerOyats(c, M, Math.min(X(-4), X(0.4)), GANIVELLE_NORD, Math.max(X(-4), X(0.4)), BORD.sud, 40);

  // La lanterne du panneau de sortie : en haut du poteau du côté de la route qui part.
  const panneau = PANNEAUX_SORTIE_PONT[est ? 1 : 0]!;
  const lanterne = lanterneSurPanneau(c, M.metal, 0x8d969a, panneau, 0, 1.4, 2.13, panneau.cote);
  const groupe = c.construire();
  groupe.name = `bords du pont (${cote})`;
  groupe.add(lanterne.maillage);
  return { groupe, lanterne };
}

/** Les bords des deux bouts du pont, et les lanternes de leurs panneaux de sortie. */
export function creerBordsPont(): { groupe: THREE.Group; lanternes: LanternePanneau[] } {
  const groupe = new THREE.Group();
  groupe.name = "bords du pont";
  const lanternes: LanternePanneau[] = [];
  for (const cote of ["ouest", "est"] as const) {
    const b = creerBout(cote);
    groupe.add(b.groupe);
    lanternes.push(b.lanterne);
  }
  return { groupe, lanternes };
}
