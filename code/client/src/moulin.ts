// Ce qu'on fait au Moulin du Gué (plan 0.8, chantier 12) : ouvrir la grande porte, ou la refermer derrière soi ;
// actionner les trois leurres du décor (M31). Le serveur décide (serveur/src/moulin.ts) : fermée à clé, la grande porte
// répond par une ligne de message ; le monte-sacs n'a qu'un sac par visite ; la borne, trois jingles.

import { LEURRES_MOULIN, PORTES_MOULIN, distancePorteMoulin } from "../../commun/src/moulin.ts";
import type { Inventaire } from "../../commun/src/objets.ts";
import type { Propositions } from "./interaction.ts";

/** Ce qu'on dit des leurres, à l'examen. */
const EXAMENS_LEURRES: Record<(typeof LEURRES_MOULIN)[number]["id"], string> = {
  monte_sacs:
    "La corde du monte-sacs pend de la poulie, sous l'auvent du pignon : un sac est resté accroché au troisième. Lâchée, la corde le laisse tomber dans la cour : de quoi faire venir tout le voisinage. Un seul sac.",
  babillard:
    "Le babillard de la trémie, au pied du beffroi : une clochette que la meule faisait tinter tant qu'il restait du grain. On l'entend jusque dans les meules nord.",
  borne: "La borne « Pétrissez virtuellement ! » : son écran luit encore, sur batterie. Son jingle s'entend de toute la boutique… le temps que la batterie tienne.",
};

const LIBELLES_LEURRES: Record<(typeof LEURRES_MOULIN)[number]["id"], string> = {
  monte_sacs: "Lâcher la corde du monte-sacs (attire les Éteints)",
  babillard: "Faire tinter le babillard (attire les Éteints)",
  borne: "Lancer le jingle de la borne (attire les Éteints)",
};

/**
 * Les propositions du Moulin, à portée de main : la grande porte et les leurres. `garder` retient la plus proche
 * (interaction.ts, proposer).
 */
export function proposerMoulin(
  position: { x: number; z: number },
  portes: Readonly<Record<string, boolean>>,
  inventaire: Inventaire,
  garder: (distance: number, propositions: Propositions) => void,
): void {
  for (const p of PORTES_MOULIN) {
    if (!p.fermable) continue;
    const ouverte = portes[p.id] ?? p.ouverte;
    const cle = (inventaire.cle_moulin ?? 0) > 0;
    garder(distancePorteMoulin(p, position.x, position.z) + 0.3, {
      A: ouverte
        ? { libelle: "Refermer la grande porte", message: { t: "interagir", cible: { genre: "porte", id: p.id }, verbe: "fermer_porte" } }
        : { libelle: cle ? "Ouvrir avec la grosse clé" : "Ouvrir la grande porte", message: { t: "interagir", cible: { genre: "porte", id: p.id }, verbe: "ouvrir_porte" } },
      B: {
        libelle: "Examiner",
        examiner: ouverte
          ? "La grande porte de la salle des meules, la grosse clé dans la serrure. Refermée derrière toi, elle arrête un Éteint ; elle grince, on l'entend de loin."
          : "La grande porte de la salle des meules, à deux battants, une grosse serrure de fer. Derrière, on entend traîner des pas.",
      },
      cible: { x: p.x, z: p.z },
    });
  }
  for (const l of LEURRES_MOULIN) {
    garder(Math.hypot(l.x - position.x, l.z - position.z) - 0.4, {
      A: { libelle: LIBELLES_LEURRES[l.id], message: { t: "interagir", cible: { genre: "leurre", id: l.id }, verbe: "actionner" } },
      B: { libelle: "Examiner", examiner: EXAMENS_LEURRES[l.id] },
      cible: { x: l.x, z: l.z },
    });
  }
}
