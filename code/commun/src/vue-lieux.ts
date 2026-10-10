// Les plans de vue des lieux à murs (0.7.2) : la Coopérative et la boutique de la halte ; le Moulin (0.8). Tirés des plans en données
// (cooperative.ts, lieux.ts) : rien ne change dans le jeu, on dit seulement ce qui arrête la vue (commun/src/vue.ts).

import { FENETRES_COOP, PIECES, PORTES, mursCoop, pieceDe as pieceCoop } from "./cooperative.ts";
import { BOUTIQUE, STATION, dansBoite, type LieuId } from "./lieux.ts";
import { CLAIRE_VOIE, FENETRES_MOULIN, PIECES_MOULIN, PORTES_MOULIN, mursVueMoulin, pieceMoulin } from "./moulin.ts";
import { percer, type FenetreVue, type PlanVue, type PorteVue } from "./vue.ts";

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

// ---------- L1B, le Moulin du Gué (plan 0.8, chantier 12 ; étude h1b-l1b-conception §2.11, M34) ----------

/**
 * Le Moulin : ses onze pièces, la grande porte (fermée à clé au départ), les portes toujours ouvertes (leur battant pend
 * ou est tombé), les fenêtres, la claire-voie du beffroi (la vue et le son passent d'une moitié des meules à l'autre ;
 * pour les Éteints, ce n'est pas un passage : milieu-moulin.ts), le mur du jardin (il arrête la vue, le son passe
 * par-dessus, étouffé). Un Éteint derrière la grande porte fermée ne se voit pas : il s'entend.
 */
export const PLAN_VUE_MOULIN: PlanVue = (() => {
  const fenetres: FenetreVue[] = FENETRES_MOULIN.map((f) => ({ ...f }));
  const portes: PorteVue[] = [
    ...PORTES_MOULIN.map((p) => ({ id: p.id, x: p.x, z: p.z, largeur: p.largeur, sens: p.sens, entre: p.entre, ...(p.fermable ? {} : { toujoursOuverte: true }) })),
    { ...CLAIRE_VOIE, toujoursOuverte: true },
  ];
  return {
    murs: percer(mursVueMoulin(), fenetres.filter((f) => !f.opaque)),
    portes,
    fenetres,
    pieceDe: pieceMoulin,
    pieces: Object.keys(PIECES_MOULIN),
  };
})();

/** Le plan de vue d'un lieu, s'il a des murs. */
export function planVue(lieu: LieuId): PlanVue | null {
  return lieu === "cooperative" ? PLAN_VUE_COOP : lieu === "station" ? PLAN_VUE_HALTE : lieu === "moulin" ? PLAN_VUE_MOULIN : null;
}
