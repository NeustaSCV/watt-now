// Le plan de la halte du carrefour (repère de la halte entière : 200 × 70 m, origine au centre, +x à l'est, +z au sud).

import { lisse } from "./outils.js";

export const W = 3.5; // demi-largeur de la départementale
export const RP = { x: -16, z: 0, ri: 9, ro: 16 }; // le grand rond-point : îlot central de 9 m de rayon, anneau jusqu'à 16 m
export const VR = { a: 58, b: 66, c: 80, d: 88, h: 6.2, couloir: 5.6, mur: 5.0, cadre0: 64, cadre1: 82, sous: 3.6 }; // la voie rapide et son pont-cadre
export const RELAIS = { x0: -80, x1: -60, z0: -27, z1: -12, zm: -20.5, h: 3.2, he: 2.8 };
export const GRANGE = { x0: -94, x1: -76, z0: 13, z1: 25, h: 4.2 };
export const MAISON = { x0: -70, x1: -58, z0: 23, z1: 31, h: 2.8, he: 2.6 };
export const CHAPELLE = { x0: -45.5, x1: -38.5, z0: -31, z1: -21, h: 4.4 };
export const CALVAIRE = { x: -33.5, z: -12.5 };
export const COVOIT = { x0: -48, x1: -35, z0: -18, z1: -9 };
export const SILOS = [{ x: -44.5, z: 27.5, r: 2.3 }, { x: -38.8, z: 28.5, r: 2.3 }];
export const SILO_TOMBE = { x0: -34.5, x1: -19, z: 24.2, r: 2.3 };
export const MAGASIN = { x0: 24, x1: 44, z0: -31, z1: -16, zs: -27, h: 4.2 };
export const SERRE = { x0: 5, x1: 21, z0: -31, z1: -18, h: 2.6, hf: 1.6 };
export const CONCESSION = { x0: 5, x1: 31, z0: 12, z1: 30 };
export const BUREAU = { x0: 33, x1: 40, z0: 13.5, z1: 18.5, h: 2.6 };
export const ABRIBUS = { x: -52, z: -6.8 };

/** Les fossés le long de la départementale : [z, x0, x1]. */
export const FOSSES = [
  [6, -100, -72],
  [6, -62, -36],
  [6, 30, 56],
  [6, 90, 100],
  [-6, 44, 56],
  [-6, 90, 100],
];

/** Le profil de la voie rapide en remblai (en travers de la halte, de x = 58 à 88). */
export function remblai(x) {
  if (x <= VR.a || x >= VR.d) return 0;
  if (x < VR.b) return VR.h * lisse((x - VR.a) / (VR.b - VR.a));
  if (x <= VR.c) return VR.h;
  return VR.h * lisse((VR.d - x) / (VR.d - VR.c));
}

/** Le relief. `talusSud` : la moitié sud du remblai (qui passe en couche) est rendue ou non. */
export function hauteur(x, z, talusSud = true) {
  let h = 0;
  for (const [zf, x0, x1] of FOSSES) {
    const k = lisse((x - x0) / 2) * lisse((x1 - x) / 2);
    const d = Math.abs(z - zf);
    if (d < 2 && k > 0) h -= 0.6 * (1 - d / 2) * k;
  }
  const p = remblai(x);
  if (p > 0) {
    const az = Math.abs(z);
    if (az > VR.couloir + 1e-6 && (z < 0 || talusSud)) h = p + 0.18 * Math.sin(z * 0.37 + x * 0.21) * lisse(Math.min(x - VR.a, VR.d - x) / 4) * (p < VR.h - 0.01 ? 1 : 0);
  }
  return h;
}

/** Les lignes de la grille du sol en z : pas de 2 m, et les deux parois du couloir du pont-cadre. */
export const ZS = (() => {
  const s = new Set([-35, 35, -VR.couloir, VR.couloir]);
  for (let z = -34; z <= 34; z += 2) s.add(z);
  return [...s].sort((a, b) => a - b);
})();

// ---------- Couleurs ----------

export const C = {
  enduitRelais: 0xe4d9c0,
  enduitInt: 0xe8e0cc,
  pierre: 0xc9bea6,
  pierreChapelle: 0xd2c8b0,
  tuile: 0xb8705a,
  tuileVieille: 0xa0685a,
  volet: 0x6f8b76,
  voletRouge: 0x9a4a3a,
  gravier: 0x9e978a,
  terreBattue: 0x94805e,
  betonVR: 0x8f8c86,
  betonSombre: 0x6f6c66,
};

