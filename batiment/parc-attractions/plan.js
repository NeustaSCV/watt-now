// Wattyland : le plan du parc, dans le « repère du site » (origine au centre du parc, +x à l'est, +z au sud).
// Les deux cartes partagent ce plan ; chacune est ensuite recentrée sur son lot (voir modele.js, `recentrer`).
//
//            z = -30  ┌──────────────── nord ─────────────────────────────────────────┐
//                     │  GRANDE ROUE          │   MONTAGNES RUSSES (le Court-Circuit)  ATELIER
//                     │        CARROUSEL      │  TRAIN FANTÔME   AUTOS TAMPONNEUSES   BÛCHES
//                     │  BOUTIQUE · SECOURS   │
//                     │  STANDS ═══════════ allée des stands ═══════════════════════════
//            z = 22   └── clôture ── TÊTE DE WATTY ── clôture ─────────────────────────┘
//                         billetterie · files d'attente (parvis)
//                    x = -66                 x = 0                                   x = 66

export const PLAN = {
  // La tête géante de Watty : le porche d'entrée est sa bouche
  tete: { x: -30, z0: 20.5, z1: 23.5, l: 8.4, h: 10, bouche: 3.6, hBouche: 3.2 },
  cloture: 22,
  guichet: { x1: -46, z1: 23.8, x2: -40, z2: 28.4 },
  allee: { x1: -34, x2: -26, z1: -12 },
  alleeStands: { z1: 12, z2: 17 },
  animatronique: { x: -23.2, z: 19 },
  carrousel: { x: -44, z: 5, r: 7.2 },
  roue: { x: -51, z: -20, y: 15.8, r: 13.6 },
  tir: { x1: -24, z1: 5, x2: -17.5, z2: 10.5 },
  peche: { x1: -15.5, z1: 5, x2: -9, z2: 10.5 },
  barbe: { x1: -6.5, z1: 6, x2: -2.5, z2: 10 },
  boutique: { x1: -24, z1: -9, x2: -12, z2: -1 },
  secours: { x1: -9, z1: -9, x2: -2, z2: -3 },
  // Carte « manèges »
  fantome: { x1: 6, z1: -7, x2: 24, z2: 6 },
  tamponneuses: { x1: 30, z1: -3, x2: 46, z2: 9 },
  atelier: { x1: 53, z1: -29, x2: 65, z2: -19 },
  buches: { x1: 51.5, z1: -14, x2: 64.5, z2: 9 },
};

/** Les cartes : centre du lot dans le repère du site. */
export const ORIGINES = { entree: { x: -33, z: 0 }, maneges: { x: 33, z: -2 } };
