// Le milieu de la Coopérative, tel que le perçoivent les Éteints (Book 23 §7) : les murs arrêtent le son et la vue,
// l'obscurité est propre à chaque pièce, et l'on passe d'une pièce à l'autre par les portes (un petit graphe).
// Sans cela, un Éteint leurré resterait collé au mur : c'est le risque n° 1 du Book 23.
// 0.7.2 : la vue et le son suivent le plan de vue partagé (vue.ts) : en ligne droite contre les murs et les portes
// fermées, à travers les vitrines du libre-service et les fenêtres des bureaux. « Si je le vois, il me voit » : c'est la
// même règle que pour ce que le serveur envoie au joueur, et que pour ce que l'écran éclaire.

import { PORTES, pieceDe, sombreIci, type PieceCoop, type PorteCoop } from "./cooperative.ts";
import type { Milieu } from "./eteints.ts";
import { PLAN_VUE_COOP, PLAN_VUE_HALTE } from "./vue-lieux.ts";
import { facteurSon, obstaclesVue, voit } from "./vue.ts";

/** Au milieu d'une porte, l'Éteint vise un point un peu plus loin, de l'autre côté. */
const AU_DELA = 1.3;

const milieux = new Map<string, Milieu>();

/** Le milieu de la Coopérative pour un état des portes (gardé, un par combinaison). */
export function milieuCoop(portes: Readonly<Record<string, boolean>>): Milieu {
  const cle = PORTES.map((p) => ((portes[p.id] ?? p.ouverte) ? "1" : "0")).join("");
  let m = milieux.get(cle);
  if (!m) {
    m = construire((p) => portes[p.id] ?? p.ouverte);
    milieux.set(cle, m);
  }
  return m;
}

function construire(ouverte: (p: PorteCoop) => boolean): Milieu {
  const etats = Object.fromEntries(PORTES.map((p) => [p.id, ouverte(p)]));
  const ov = obstaclesVue(PLAN_VUE_COOP, etats);
  const pieces = [...new Set(PORTES.flatMap((p) => p.entre))] as PieceCoop[];

  // Le chemin le plus court (en nombre de portes ouvertes) d'une pièce à une autre : la première porte à prendre.
  const premiere = new Map<string, PorteCoop | null>();
  for (const a of pieces) {
    const venu = new Map<PieceCoop, PorteCoop | null>([[a, null]]);
    const file: PieceCoop[] = [a];
    while (file.length) {
      const ici = file.shift()!;
      for (const p of PORTES) {
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
      return facteurSon(PLAN_VUE_COOP, etats, pieceDe(ax, az), pieceDe(bx, bz));
    },
    vue(ax, az, bx, bz) {
      return voit(ov, ax, az, bx, bz);
    },
    obscur: sombreIci,
    passage(ax, az, bx, bz) {
      const pa = pieceDe(ax, az);
      const pb = pieceDe(bx, bz);
      if (pa === pb) return { x: bx, z: bz };
      const p = premiere.get(`${pa}>${pb}`);
      // Aucune porte ouverte n'y mène : il pousse tout droit, contre le mur ou la porte (Book 23 §2.2).
      if (!p) return { x: bx, z: bz };
      // Vers le milieu de la porte, puis un peu au-delà, dans la pièce suivante.
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

/**
 * Le milieu de la halte (0.7.2) : on y est à ciel ouvert (le son porte partout, on va tout droit), sauf la vue, que
 * les murs de la boutique et de l'atelier arrêtent. L'Éteint de la boutique ne voit pas à travers ses murs, et l'on ne
 * le voit pas non plus ; par les vitrines brisées et la porte, si. Pas de cascade de gémissements : la halte reste
 * telle qu'avant pour le reste.
 */
const MILIEU_HALTE: Milieu = (() => {
  const ov = obstaclesVue(PLAN_VUE_HALTE, {});
  return {
    son: () => 1,
    vue: (ax, az, bx, bz) => voit(ov, ax, az, bx, bz),
    obscur: () => false,
    passage: (_ax, _az, bx, bz) => ({ x: bx, z: bz }),
    cascade: false,
  };
})();

export function milieuHalte(): Milieu {
  return MILIEU_HALTE;
}
