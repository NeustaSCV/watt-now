// Les plans de vue des lieux à murs (0.7.2) : la Coopérative et la boutique de la halte. Tirés des plans en données
// (cooperative.ts, lieux.ts) : rien ne change dans le jeu, on dit seulement ce qui arrête la vue (commun/src/vue.ts).

import { FENETRES_COOP, PIECES, PORTES, mursCoop, pieceDe as pieceCoop } from "./cooperative.ts";
import { BOUTIQUE, STATION, dansBoite, type LieuId } from "./lieux.ts";
import { percer, type FenetreVue, type PlanVue, type PorteVue } from "./vue.ts";
import { PLAN_GUE } from "./gue.ts";

/** La Coopérative : ses murs et cloisons, ses 8 portes, les vitrines du libre-service et les fenêtres des bureaux. */
export const PLAN_VUE_COOP: PlanVue = (() => {
  const fenetres: FenetreVue[] = FENETRES_COOP.map((f) => ({ ...f }));
  return {
    murs: percer(mursCoop(), fenetres.filter((f) => !f.opaque)),
    portes: PORTES.map((p) => ({ id: p.id, x: p.x, z: p.z, largeur: p.largeur, sens: p.sens, entre: p.entre })),
    fenetres,
    pieceDe: pieceCoop,
    pieces: Object.keys(PIECES),
  };
})();

/**
 * La halte : la boutique de la station (porte défoncée, toujours ouverte ; vitrines brisées ou fendues, une condamnée
 * par des planches) et l'atelier fermé à côté. Le reste est à ciel ouvert : les épaves et l'éboulis n'arrêtent pas la
 * vue (on voit par-dessus, ou entre).
 */
export const PLAN_VUE_HALTE: PlanVue = (() => {
  const p = BOUTIQUE.porte;
  const fz = p.z;
  const fenetres: FenetreVue[] = [
    { id: "vitrine_ouest", x: (96.2 + 100.85) / 2, z: fz, largeur: 100.85 - 96.2, sens: "x", entre: ["dehors", "boutique"] },
    { id: "vitrine_planches", x: (100.95 + 103.2) / 2, z: fz, largeur: 103.2 - 100.95, sens: "x", entre: ["dehors", "boutique"], opaque: true },
    { id: "vitrine_est", x: (105 + 109.6) / 2, z: fz, largeur: 109.6 - 105, sens: "x", entre: ["dehors", "boutique"] },
  ];
  const portes: PorteVue[] = [{ id: "boutique", x: p.x, z: p.z, largeur: p.largeur, sens: "x", entre: ["dehors", "boutique"], toujoursOuverte: true }];
  return {
    murs: [...percer(BOUTIQUE.murs, fenetres.filter((f) => !f.opaque)), STATION.atelier],
    portes,
    fenetres,
    pieceDe: (x, z) => (dansBoite(x, z, BOUTIQUE.interieur, 0.3) ? "boutique" : "dehors"),
    pieces: ["dehors", "boutique"],
  };
})();

// ---------- Le gué (plan 0.8, chantier 11) ----------

/**
 * Le Gué-aux-Saules : à ciel ouvert, sauf la cabane du passeur et la buvette de Chez Lulu, où l'on entre (le plan est
 * tiré du modèle dans commun/src/gue.ts, `PLAN_GUE`).
 */
export const PLAN_VUE_GUE: PlanVue = PLAN_GUE;

/** Le plan de vue d'un lieu, s'il a des murs. */
export function planVue(lieu: LieuId): PlanVue | null {
  if (lieu === "gue") return PLAN_VUE_GUE;
  return lieu === "cooperative" ? PLAN_VUE_COOP : lieu === "station" ? PLAN_VUE_HALTE : null;
}
