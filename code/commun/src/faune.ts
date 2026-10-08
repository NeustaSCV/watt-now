// La faune du terrain (2026-10-08, Book 11 §10).
// - La volaille : des poules de la ferme, retournées à l'état sauvage. Le serveur les fait vivre : on peut les chasser
//   en s'approchant prudemment, avec un outil de base (même un gourdin de bois dur).
// - Lapins, renards, oiseaux de la mare : de la vie, animée par le client seulement (pas encore chassables : il faudra
//   les armes de jet, arc et arbalète).

import type { Allure } from "./regles.ts";
import { RUINE } from "./terrain.ts";
import { TERRAIN_TAILLE } from "./regles.ts";

export type EtatPoule = "picore" | "inquiete" | "fuit";

export interface Poule {
  id: number;
  x: number;
  z: number;
  /** Orientation (0 regarde vers +z). */
  o: number;
  etat: EtatPoule;
  /** Temps restant dans l'état (fuite, inquiétude) ou avant le prochain pas de picorage. */
  minuteur: number;
  /** Là où elle va en picorant. */
  but: { x: number; z: number } | null;
  /** Le plumage : 0 rousse, 1 blanche, 2 noire. */
  robe: number;
}

export interface AnimalVu {
  id: number;
  espece: "poule";
  x: number;
  z: number;
  o: number;
  etat: EtatPoule;
  robe: number;
}

// Trois poules autour de la ferme en ruine ; une poule prise revient (une autre sort des bois) au bout de 2 h réelles.
// Réglables à chaud : REGLAGES.poules_terrain, REGLAGES.poule_retour_h.

/** Elles ne s'éloignent guère de la ferme. */
export const DOMAINE_POULES = { x: RUINE.x - 6, z: RUINE.z + 8, rayon: 9 } as const;

/**
 * La méfiance (en mètres) selon l'allure de celui qui approche : au-delà de « inquiete », elle picore ; en deçà, elle
 * s'arrête et guette ; en deçà de « fuite », elle détale. Immobile, on ne l'effraie presque plus : il faut savoir attendre.
 */
export const MEFIANCE: Record<Allure | "immobile", { inquiete: number; fuite: number }> = {
  immobile: { inquiete: 2.5, fuite: 0.6 },
  discrete: { inquiete: 4, fuite: 1 },
  marche: { inquiete: 8, fuite: 4.5 },
  course: { inquiete: 12, fuite: 8 },
};

/** Vitesses (m/s) : une poule qui court fait ≈ 14 km/h, en battant des ailes. */
export const VITESSE_POULE = { picore: 0.35, fuite: 3.9 } as const;
/** Une fuite dure un peu, puis elle se retourne pour guetter. */
const DUREE_FUITE = 1.8;
const DUREE_INQUIETUDE = 2.5;

export function nouvellePoule(id: number, alea: () => number): Poule {
  const a = alea() * Math.PI * 2;
  const r = alea() * DOMAINE_POULES.rayon * 0.7;
  return {
    id,
    x: DOMAINE_POULES.x + Math.cos(a) * r,
    z: DOMAINE_POULES.z + Math.sin(a) * r,
    o: alea() * Math.PI * 2,
    etat: "picore",
    minuteur: alea() * 2,
    but: null,
    robe: Math.floor(alea() * 3),
  };
}

export interface Approche {
  x: number;
  z: number;
  allure: Allure;
  bouge: boolean;
}

function borner(v: number): number {
  return Math.min(TERRAIN_TAILLE - 1, Math.max(1, v));
}

/** Un pas de vie d'une poule. `qui` : le joueur (ou personne). */
export function penserPoule(p: Poule, dt: number, qui: Approche | null, alea: () => number): void {
  p.minuteur -= dt;
  const d = qui ? Math.hypot(qui.x - p.x, qui.z - p.z) : Infinity;
  const seuils = qui ? MEFIANCE[qui.bouge ? qui.allure : "immobile"] : null;

  if (seuils && d < seuils.fuite && p.etat !== "fuit") {
    // Elle détale, à l'opposé, un peu de biais.
    p.etat = "fuit";
    p.minuteur = DUREE_FUITE;
    p.o = Math.atan2(p.x - qui!.x, p.z - qui!.z) + (alea() - 0.5) * 0.8;
  } else if (p.etat === "picore" && seuils && d < seuils.inquiete) {
    p.etat = "inquiete";
    p.minuteur = DUREE_INQUIETUDE;
  }

  switch (p.etat) {
    case "fuit": {
      p.x = borner(p.x + Math.sin(p.o) * VITESSE_POULE.fuite * dt);
      p.z = borner(p.z + Math.cos(p.o) * VITESSE_POULE.fuite * dt);
      if (p.minuteur <= 0) {
        p.etat = "inquiete";
        p.minuteur = DUREE_INQUIETUDE;
      }
      return;
    }
    case "inquiete": {
      // Elle se tourne vers ce qui l'inquiète, et ne bouge plus.
      if (qui) p.o = Math.atan2(qui.x - p.x, qui.z - p.z);
      if (p.minuteur <= 0 && (!seuils || d >= seuils.inquiete)) {
        p.etat = "picore";
        p.minuteur = 1 + alea() * 2;
      } else if (p.minuteur <= 0) p.minuteur = 0.5;
      return;
    }
    case "picore": {
      // Quelques pas, un arrêt pour gratter, et ainsi de suite, sans trop s'éloigner de la ferme.
      if (!p.but) {
        if (p.minuteur > 0) return;
        const a = alea() * Math.PI * 2;
        const r = alea() * DOMAINE_POULES.rayon;
        p.but = { x: borner(DOMAINE_POULES.x + Math.cos(a) * r), z: borner(DOMAINE_POULES.z + Math.sin(a) * r) };
      }
      const dx = p.but.x - p.x;
      const dz = p.but.z - p.z;
      const reste = Math.hypot(dx, dz);
      if (reste < 0.2) {
        p.but = null;
        p.minuteur = 1.5 + alea() * 3;
        return;
      }
      const pas = Math.min(reste, VITESSE_POULE.picore * dt);
      p.o = Math.atan2(dx, dz);
      p.x += (dx / reste) * pas;
      p.z += (dz / reste) * pas;
    }
  }
}

export function vuePoule(p: Poule): AnimalVu {
  return { id: p.id, espece: "poule", x: Math.round(p.x * 100) / 100, z: Math.round(p.z * 100) / 100, o: Math.round(p.o * 100) / 100, etat: p.etat, robe: p.robe };
}
