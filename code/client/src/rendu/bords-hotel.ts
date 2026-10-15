// Les bords du Grand Hôtel des Flots (0.10, R52 ; décision du porteur du 2026-10-15, revue .claude-travail/revue-r52/) :
//
// - la promenade prolongée de 35 m vers l'est, à la sortie vers la route du pont : ses dalles, la bordure et le bas de
//   la balustrade (sa lisse tombée par endroits), puis le sable qui la recouvre ;
// - les ganivelles du modèle prolongées de 16 m (le budget de l'iPhone : 60 000 triangles) le long de la promenade, à l'est et à l'ouest, et
//   jusque dans l'eau peu profonde, aux deux bords du lot (là où l'on y marche) ;
// - des dunes et des oyats sur les plaques de sable unies des alentours ;
// - au sud, la bande d'eau peu profonde où l'on marche ralenti (commun/src/hotel.ts : `dansLEauHotel`), plus claire que
//   la mer, qui s'arrête là où l'on perd pied ;
// - le panneau de sortie (PANNEAU_SORTIE_HOTEL, « Lire » : E-16) et sa lanterne au-dessus (rendu/lanterne-panneau.ts).
//
// Rien de tout cela n'ajoute d'obstacle (tout est hors de la zone, sauf l'eau, qui n'est qu'un frein). Un chantier
// fusionné par matière, dans les matières du modèle ; le panneau (deux appels), sa lanterne (un), la bande d'eau (un).
// En attendant que la session « bâtiments » les dessine dans le modèle (à lui demander).

import * as THREE from "three";
import { BORD_EAU_HOTEL, HOTEL, LARGE_HOTEL, PANNEAU_SORTIE_HOTEL } from "../../../commun/src/hotel.ts";
import { poserLanterne, type LanternePanneau } from "./lanterne-panneau.ts";
import { ganivelle, type ChantierModele } from "./decor-cote.ts";
import { creerPanneauRoute } from "./terrain.ts";
// @ts-expect-error : les outils des modèles sont en JavaScript, sans types (client/src/batiments/ ne se modifie pas).
import { Chantier } from "../batiments/commun/atelier.js";
// @ts-expect-error : idem (les matières et les couleurs du modèle de l'hôtel).
import { COUL, matieres as matieresHotel } from "../batiments/grand-hotel/textures.js";
// @ts-expect-error : idem (les dunes du modèle de l'hôtel).
import { dune } from "../batiments/grand-hotel/mobilier.js";
// @ts-expect-error : idem (les oyats, ceux de la route du pont : la même côte).
import * as objetsPont from "../batiments/halte-route-pont/objets.js";

type M = Record<"sable" | "dalle" | "mat" | "tole" | "metal", THREE.Material>;
const oyats = (objetsPont as { semerOyats(c: ChantierModele, M: unknown, x1: number, z1: number, x2: number, z2: number, n: number): void }).semerOyats;
const dunes = dune as (c: ChantierModele, x: number, z: number, l: number, p: number, h: number, mat: unknown, teinte?: number, ry?: number) => void;

/** Le repère du modèle (H : centré sur l'hôtel) dans celui du jeu : x + 33, z + 28. */
const HX = 33;
const HZ = 28;
/** La promenade (H : z 18 à 22 ; la balustrade en z 21,8), et jusqu'où on la prolonge. */
const PROMENADE = { z0: 18 + HZ, z1: 22 + HZ, balustrade: 21.8 + HZ, fin: HOTEL.largeur + 35 } as const;
/** Les ganivelles du modèle : en H x − 32,6 et 30,6 ; ouvertes sur la promenade (H z 17,8 à 22,2). */
const GANIVELLES = { ouest: -32.6 + HX, est: 30.6 + HX, nord: 17.8 + HZ, sud: 22.2 + HZ } as const;

/** Un tirage reproductible. */
function graine(n: number): () => number {
  let s = n;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

/** Les bords de l'hôtel (repère du jeu), et la lanterne du panneau de sortie. */
export function creerBordsHotel(): { groupe: THREE.Group; lanternes: LanternePanneau[] } {
  const m = matieresHotel() as M;
  const Mp = (objetsPont as { matieres(): unknown }).matieres();
  const c = new Chantier(971) as ChantierModele;
  const A = graine(9711);
  const groupe = new THREE.Group();
  groupe.name = "bords de l'hôtel";

  // La promenade prolongée : les dalles grises, la bordure côté nord, le bas de la balustrade côté plage.
  const x0 = HOTEL.largeur;
  const x1 = PROMENADE.fin;
  c.boite(x1 - x0, 0.06, PROMENADE.z1 - PROMENADE.z0, COUL.dalleGrise, { x: (x0 + x1) / 2, y: 0.01, z: (PROMENADE.z0 + PROMENADE.z1) / 2 }, m.dalle, { crasse: false, nuance: 0 });
  c.boite(x1 - x0, 0.12, 0.25, 0xd6cfbf, { x: (x0 + x1) / 2, y: 0.06, z: PROMENADE.z0 + 0.12 }, m.dalle, { crasse: false });
  c.boite(x1 - x0, 0.14, 0.28, 0xd6cfbf, { x: (x0 + x1) / 2, y: 0.11, z: PROMENADE.balustrade }, m.dalle);
  // La lisse et ses piliers sur les douze premiers mètres, puis un pilier par-ci par-là ; des morceaux tombés.
  for (let x = x0; x < x1; x += 2.6) {
    const debout = x < x0 + 12 ? A() > 0.15 : A() > 0.75;
    if (!debout) continue;
    c.boite(0.36, 1.08, 0.4, 0xe6dfcf, { x, y: 0.58, z: PROMENADE.balustrade }, m.dalle);
    if (x < x0 + 12 && x + 2.6 < x0 + 12) c.boite(2.6, 0.14, 0.32, 0xe6dfcf, { x: x + 1.3, y: 0.97, z: PROMENADE.balustrade }, m.dalle, { crasse: false });
  }
  for (let i = 0; i < 5; i++) c.boite(2 + A() * 1.5, 0.14, 0.32, 0xe6dfcf, { x: x0 + 14 + A() * 18, y: 0.1, z: PROMENADE.balustrade + 0.6 + A() * 1.5, ry: (A() - 0.5) * 0.6, rz: 0.06 }, m.dalle);
  // Le sable qui recouvre la promenade, de plus en plus vers le bout : elle se perd.
  for (let x = x0 + 6; x < x1 + 4; x += 3 + A() * 3) {
    const k = (x - x0) / (x1 - x0);
    dunes(c, x, PROMENADE.z0 + 0.6 + A() * 2.8, 2 + k * 4, 1.4 + k * 2.4, 0.12 + k * 0.4, m.sable, COUL.sableClair, A() * 3);
  }

  // Les ganivelles prolongées le long de la promenade, à l'est et à l'ouest, et dans l'eau peu profonde (aux deux bords).
  for (const [xa, xb] of [[GANIVELLES.est, GANIVELLES.est + 16], [GANIVELLES.ouest, GANIVELLES.ouest - 16]] as const) {
    for (const z of [GANIVELLES.nord, GANIVELLES.sud]) ganivelle(c, m.mat, m.tole, { x1: xa, z1: z, x2: xb, z2: z }, 0.3, () => true, Math.round(xa + z));
  }
  for (const x of [GANIVELLES.ouest, GANIVELLES.est]) ganivelle(c, m.mat, m.tole, { x1: x, z1: 33 + HZ - 0.2, x2: x, z2: LARGE_HOTEL + 0.6 }, 0.55, () => true, Math.round(x * 3));

  // Les dunes et les oyats des alentours (à l'ouest et à l'est du lot, jusqu'à la mer ; pas sur la promenade).
  for (const [xa, xb] of [[-58, -3], [HOTEL.largeur + 3, HOTEL.largeur + 58]] as const) {
    for (let i = 0; i < 12; i++) {
      const x = xa + A() * (xb - xa);
      const z = 2 + A() * (BORD_EAU_HOTEL - 6);
      if (z > PROMENADE.z0 - 3 && z < PROMENADE.z1 + 3) continue;
      dunes(c, x, z, 5 + A() * 7, 3 + A() * 5, 0.6 + A() * 0.8, m.sable, COUL.sable, A() * 3);
    }
    oyats(c, Mp, xa, 1, xb, PROMENADE.z0 - 2, 12);
    oyats(c, Mp, xa, PROMENADE.z1 + 2, xb, BORD_EAU_HOTEL - 2, 8);
  }

  // Le panneau de sortie, tourné vers la caméra du jeu (au sud-est, comme ceux du phare : de dos, on ne lisait que du
  // bois), et sa lanterne au-dessus.
  const P = PANNEAU_SORTIE_HOTEL;
  const panneau = creerPanneauRoute("Route du pont →", "ton terrain, par le pont · 5 km", P.x, P.z, Math.PI / 4);
  panneau.name = "panneau de sortie de l'hôtel";
  c.boite(0.08, 0.7, 0.08, 0x4a3b2c, { x: P.x, y: 2.3, z: P.z }, m.mat);
  const lanterne = poserLanterne({ x: P.x, y: 2.62, z: P.z, angle: Math.PI / 4, avance: 0.45 });

  // La bande d'eau peu profonde, plus claire que la mer, du bord de l'eau à la ligne où l'on perd pied (le lot seul :
  // ailleurs, on n'y marche pas ; les ganivelles des deux bords y entrent).
  const eau = new THREE.PlaneGeometry(HOTEL.largeur, LARGE_HOTEL - BORD_EAU_HOTEL, 1, 2).rotateX(-Math.PI / 2).translate(HOTEL.largeur / 2, 0.047, (BORD_EAU_HOTEL + LARGE_HOTEL) / 2);
  const pos = eau.getAttribute("position");
  const couleurs: number[] = [];
  const claire = new THREE.Color(0x7fb3b0);
  const profonde = new THREE.Color(0x4f8890);
  const t = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const k = (pos.getZ(i) - BORD_EAU_HOTEL) / (LARGE_HOTEL - BORD_EAU_HOTEL);
    t.copy(claire).lerp(profonde, k * k);
    couleurs.push(t.r, t.g, t.b);
  }
  eau.setAttribute("color", new THREE.Float32BufferAttribute(couleurs, 3));
  const bande = new THREE.Mesh(eau, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.1 }));
  bande.name = "eau peu profonde";
  bande.receiveShadow = true;

  const bords = c.construire();
  groupe.add(bords, panneau, lanterne.maillage, bande);
  return { groupe, lanternes: [lanterne] };
}
