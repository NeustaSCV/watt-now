// Le milieu du Grand Hôtel des Flots, tel que le perçoivent les Éteints (plan 0.10, chantier J), sur le modèle de celui
// du Moulin (milieu-moulin.ts) : la vue et le son suivent le plan de vue (PLAN_VUE_HOTEL), l'obscurité est celle des
// pièces sombres, et l'on passe d'une pièce à l'autre par les portes (toutes ouvertes).
//
// Un seul repère (S-01) : l'étage est posé à côté du rez-de-chaussée, au sol. Un Éteint de l'étage ne voit ni n'entend
// ce qui se passe en bas, et inversement : d'un niveau à l'autre, ni vue ni son, et aucun chemin (il n'y a pas d'escalier).

import type { Milieu } from "./eteints.ts";
import { PLAN_VUE_HOTEL, PORTES_HOTEL, niveauHotel, pieceHotel, sombreHotel, type OuvertureHotel, type PieceHotel } from "./hotel.ts";
import { facteurSon, obstaclesVue, voit } from "./vue.ts";

/** Au milieu d'une porte, l'Éteint vise un point un peu plus loin, de l'autre côté. */
const AU_DELA = 1.3;

let milieu: Milieu | null = null;

/** Le milieu de l'hôtel (ses portes sont toujours ouvertes : un seul milieu, gardé). */
export function milieuHotel(): Milieu {
  return (milieu ??= construire());
}

function construire(): Milieu {
  const ov = obstaclesVue(PLAN_VUE_HOTEL, {});
  const pieces = PLAN_VUE_HOTEL.pieces as readonly PieceHotel[];

  // Le chemin le plus court (en nombre de portes) d'une pièce à une autre : la première porte à prendre.
  const premiere = new Map<string, OuvertureHotel | null>();
  for (const a of pieces) {
    const venu = new Map<PieceHotel, OuvertureHotel | null>([[a, null]]);
    const file: PieceHotel[] = [a];
    while (file.length) {
      const ici = file.shift()!;
      for (const p of PORTES_HOTEL) {
        if (!p.entre.includes(ici)) continue;
        const la = p.entre[0] === ici ? p.entre[1] : p.entre[0];
        if (venu.has(la)) continue;
        venu.set(la, venu.get(ici) ?? p);
        file.push(la);
      }
    }
    for (const [b, p] of venu) premiere.set(`${a}>${b}`, p);
  }

  const memeNiveau = (ax: number, az: number, bx: number, bz: number) => niveauHotel(ax, az) === niveauHotel(bx, bz);

  return {
    son(ax, az, bx, bz) {
      if (!memeNiveau(ax, az, bx, bz)) return 0;
      return facteurSon(PLAN_VUE_HOTEL, {}, pieceHotel(ax, az), pieceHotel(bx, bz));
    },
    vue(ax, az, bx, bz) {
      return memeNiveau(ax, az, bx, bz) && voit(ov, ax, az, bx, bz);
    },
    obscur: sombreHotel,
    passage(ax, az, bx, bz) {
      // D'un niveau à l'autre, aucun chemin : il reste où il est.
      if (!memeNiveau(ax, az, bx, bz)) return { x: ax, z: az };
      const pa = pieceHotel(ax, az);
      const pb = pieceHotel(bx, bz);
      if (pa === pb) return { x: bx, z: bz };
      const p = premiere.get(`${pa}>${pb}`);
      // Aucune porte n'y mène : il pousse tout droit, contre le mur.
      if (!p) return { x: bx, z: bz };
      const versLa = p.sens === "x" ? { x: 0, z: Math.sign(p.z - az) || 1 } : { x: Math.sign(p.x - ax) || 1, z: 0 };
      const d = Math.hypot(p.x - ax, p.z - az);
      if (d < 0.9) return { x: p.x + versLa.x * AU_DELA, z: p.z + versLa.z * AU_DELA };
      // On s'aligne d'abord sur l'axe de la porte (pour ne pas frotter le chambranle), puis on entre.
      const recul = p.sens === "x" ? { x: p.x, z: p.z - versLa.z * 0.8 } : { x: p.x - versLa.x * 0.8, z: p.z };
      const aligne = p.sens === "x" ? Math.abs(ax - p.x) < p.largeur / 2 - 0.35 : Math.abs(az - p.z) < p.largeur / 2 - 0.35;
      return aligne ? { x: p.x + versLa.x * AU_DELA, z: p.z + versLa.z * AU_DELA } : recul;
    },
  };
}
