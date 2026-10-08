// Le milieu de la Coopérative, tel que le perçoivent les Éteints (Book 23 §7) : les murs arrêtent le son et la vue,
// l'obscurité est propre à chaque pièce, et l'on passe d'une pièce à l'autre par les portes (un petit graphe).
// Sans cela, un Éteint leurré resterait collé au mur : c'est le risque n° 1 du Book 23.

import { PORTES, boitePorte, pieceDe, sombreIci, type PieceCoop, type PorteCoop } from "./cooperative.ts";
import type { Milieu } from "./eteints.ts";

/** Ce qu'un son garde en passant une porte : ouverte, la moitié de sa portée ; fermée, presque rien. */
const SON_PORTE_OUVERTE = 0.5;
const SON_PORTE_FERMEE = 0.15;
/** À travers un mur sans porte (deux pièces non voisines) : un bruit très fort s'entend encore un peu. */
const SON_MUR = 0.05;
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
  // Ce qu'un son garde d'une pièce à l'autre : le meilleur chemin, porte après porte (6 pièces : on calcule tout).
  const pieces = [...new Set(PORTES.flatMap((p) => p.entre))] as PieceCoop[];
  const passe = new Map<string, number>();
  for (const a of pieces) {
    const meilleur = new Map<PieceCoop, number>([[a, 1]]);
    const file: PieceCoop[] = [a];
    while (file.length) {
      const ici = file.shift()!;
      for (const p of PORTES) {
        if (!p.entre.includes(ici)) continue;
        const la = p.entre[0] === ici ? p.entre[1] : p.entre[0];
        const v = meilleur.get(ici)! * (ouverte(p) ? SON_PORTE_OUVERTE : SON_PORTE_FERMEE);
        if (v > (meilleur.get(la) ?? 0)) {
          meilleur.set(la, v);
          file.push(la);
        }
      }
    }
    for (const [b, v] of meilleur) passe.set(`${a}>${b}`, v);
  }

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

  /** Le segment a → b passe-t-il par l'embrasure d'une porte ouverte entre ces deux pièces ? */
  const parLaPorte = (ax: number, az: number, bx: number, bz: number, pa: PieceCoop, pb: PieceCoop) =>
    PORTES.some((p) => ouverte(p) && p.entre.includes(pa) && p.entre.includes(pb) && coupe(ax, az, bx, bz, boitePorte(p)));

  return {
    son(ax, az, bx, bz) {
      const pa = pieceDe(ax, az);
      const pb = pieceDe(bx, bz);
      if (pa === pb) return 1;
      return Math.max(SON_MUR, passe.get(`${pa}>${pb}`) ?? 0);
    },
    vue(ax, az, bx, bz) {
      const pa = pieceDe(ax, az);
      const pb = pieceDe(bx, bz);
      return pa === pb || parLaPorte(ax, az, bx, bz, pa, pb);
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

/** Le segment a → b traverse-t-il la boîte ? (méthode des dalles) */
function coupe(ax: number, az: number, bx: number, bz: number, b: { x: number; z: number; l: number; p: number }): boolean {
  let t0 = 0;
  let t1 = 1;
  const dx = bx - ax;
  const dz = bz - az;
  for (const [o, d, min, max] of [
    [ax, dx, b.x - b.l / 2 - 0.3, b.x + b.l / 2 + 0.3],
    [az, dz, b.z - b.p / 2 - 0.3, b.z + b.p / 2 + 0.3],
  ] as const) {
    if (Math.abs(d) < 1e-9) {
      if (o < min || o > max) return false;
      continue;
    }
    let ta = (min - o) / d;
    let tb = (max - o) / d;
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta);
    t1 = Math.min(t1, tb);
    if (t0 > t1) return false;
  }
  return true;
}
