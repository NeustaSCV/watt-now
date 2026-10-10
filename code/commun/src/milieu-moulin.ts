// Le milieu du Moulin du Gué, tel que le perçoivent les Éteints (plan 0.8, chantier 12), sur le modèle de celui de la
// Coopérative (milieu-coop.ts) : la vue et le son suivent le plan de vue (PLAN_VUE_MOULIN), l'obscurité est celle des
// pièces sombres, et l'on passe d'une pièce à l'autre par les portes. La claire-voie du beffroi laisse passer la vue et
// le son, jamais un Éteint : ce qui vous voit des meules nord vient par le couloir du rouet (M9, M13).

import type { Milieu } from "./eteints.ts";
import { PORTES_MOULIN, pieceMoulin, sombreMoulin, type PieceMoulin, type PorteMoulin } from "./moulin.ts";
import { PLAN_VUE_MOULIN } from "./vue-lieux.ts";
import { facteurSon, obstaclesVue, voit } from "./vue.ts";

/** Au milieu d'une porte, l'Éteint vise un point un peu plus loin, de l'autre côté. */
const AU_DELA = 1.3;

const milieux = new Map<string, Milieu>();

/** Le milieu du Moulin pour un état de ses portes (la grande porte : ouverte ou fermée), gardé. */
export function milieuMoulin(portes: Readonly<Record<string, boolean>>): Milieu {
  const ouverte = (p: PorteMoulin) => (p.fermable ? (portes[p.id] ?? p.ouverte) : true);
  const cle = PORTES_MOULIN.map((p) => (ouverte(p) ? "1" : "0")).join("");
  let m = milieux.get(cle);
  if (!m) {
    m = construire(ouverte);
    milieux.set(cle, m);
  }
  return m;
}

function construire(ouverte: (p: PorteMoulin) => boolean): Milieu {
  const etats = Object.fromEntries(PORTES_MOULIN.filter((p) => p.fermable).map((p) => [p.id, ouverte(p)]));
  const ov = obstaclesVue(PLAN_VUE_MOULIN, etats);
  const pieces = [...new Set(PORTES_MOULIN.flatMap((p) => p.entre)), "jardin"] as PieceMoulin[];

  // Le chemin le plus court (en nombre de portes ouvertes) d'une pièce à une autre : la première porte à prendre.
  const premiere = new Map<string, PorteMoulin | null>();
  for (const a of pieces) {
    const venu = new Map<PieceMoulin, PorteMoulin | null>([[a, null]]);
    const file: PieceMoulin[] = [a];
    while (file.length) {
      const ici = file.shift()!;
      for (const p of PORTES_MOULIN) {
        if (!ouverte(p) || !p.entre.includes(ici)) continue;
        const la = p.entre[0] === ici ? p.entre[1] : p.entre[0];
        if (venu.has(la)) continue;
        venu.set(la, venu.get(ici) ?? p);
        file.push(la);
      }
    }
    for (const [b, p] of venu) premiere.set(`${a}>${b}`, p);
  }

  return {
    son(ax, az, bx, bz) {
      return facteurSon(PLAN_VUE_MOULIN, etats, pieceMoulin(ax, az), pieceMoulin(bx, bz));
    },
    vue(ax, az, bx, bz) {
      return voit(ov, ax, az, bx, bz);
    },
    obscur: sombreMoulin,
    passage(ax, az, bx, bz) {
      const pa = pieceMoulin(ax, az);
      const pb = pieceMoulin(bx, bz);
      if (pa === pb) return { x: bx, z: bz };
      const p = premiere.get(`${pa}>${pb}`);
      // Aucune porte ouverte n'y mène : il pousse tout droit, contre le mur ou la porte (Book 23 §2.2).
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
