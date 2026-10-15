// L'accès au niveau 2 (plan 0.10, V4-19, décision du porteur du 2026-10-15) : la côte (la route du pont, le Grand Hôtel,
// la corniche, le phare) s'ouvre dès que le joueur a pris au moins un objet-clé à la Coopérative et au moins un au
// Moulin, **pris dans le lieu même** : ramassé à sa place fixe, au fond du lieu (la preuve qu'on a résolu son énigme).
// Ne comptent pas : un objet-clé acheté au Comptoir, trouvé par chance dans une fouille ailleurs, reçu par échange.
//
// - La preuve est un fait du compte (les faits des quêtes : `preuve:cooperative`, `preuve:moulin`), noté par le serveur
//   quand une ressource du lieu donne l'un de ses propres objets-clés (serveur/src/joueur.ts, `utiliserRessource`).
// - La même règle pour tous : une partie 0.9 se relit sans rien perdre, mais ces faits sont nouveaux ; la côte y reste
//   fermée tant que le joueur n'a pas pris, depuis la mise à jour, un objet-clé dans chacun des deux lieux.
// - Fermée, la côte reste sur la carte, grisée ; le serveur refuse la route (`voyager`). Qui s'y trouve déjà n'en est pas
//   chassé : de la côte, on circule et on rentre. Le menu « Aller à… » de l'administrateur va partout.

import { LIEUX_NIVEAU_2, type LieuId } from "./lieux.ts";
import type { Inventaire, TypeObjet } from "./objets.ts";
import type { EtatQuetes } from "./quetes.ts";
import { CLES_L1A, CLES_L1B } from "./vestiges.ts";

/** Les deux lieux qui ouvrent la côte, et leurs objets-clés (pris à leur place, au fond du lieu). */
export const LIEUX_PREUVES: Partial<Record<LieuId, readonly TypeObjet[]>> = { cooperative: CLES_L1A, moulin: CLES_L1B };

/** Le fait noté pour un objet-clé pris dans son lieu. */
export const faitPreuve = (lieu: LieuId): string => `preuve:${lieu}`;

/** Le message qui passe quand on touche la côte fermée, ou qu'on essaie d'en prendre la route. */
export const TEXTE_COTE_FERMEE = "La côte est loin et dangereuse. Fais d'abord tes preuves à la Coopérative et au Moulin.";
/** Le message qui passe, une fois, quand elle s'ouvre. */
export const TEXTE_COTE_OUVERTE = "La route de la côte t'est ouverte : le pont de l'estuaire et la corniche t'attendent, au sud.";

/**
 * Le fait à noter quand une ressource de `lieu` donne `donne` : la preuve du lieu si c'est l'un de ses propres
 * objets-clés (le tirage « par chance » de la fouille n'y passe pas : il ne donne que ceux de l'autre lieu, CLES_RARES).
 */
export function preuveDuLieu(lieu: LieuId, donne: Inventaire): string | null {
  const cles = LIEUX_PREUVES[lieu];
  return cles?.some((t) => (donne[t] ?? 0) > 0) ? faitPreuve(lieu) : null;
}

/** La côte est-elle ouverte ? Un objet-clé pris dans la Coopérative et un dans le Moulin. */
export function coteOuverte(faits: Readonly<Record<string, number>>): boolean {
  return (Object.keys(LIEUX_PREUVES) as LieuId[]).every((l) => (faits[faitPreuve(l)] ?? 0) > 0);
}

/** Un lieu du niveau 2, sur la côte. */
export function surLaCote(lieu: LieuId): boolean {
  return LIEUX_NIVEAU_2.includes(lieu);
}

/** La route de `de` vers l'étape `etape` est-elle fermée ? Vers la côte, depuis l'intérieur, tant qu'elle est fermée. */
export function routeFermee(de: LieuId, etape: LieuId, ouverte: boolean): boolean {
  return !ouverte && surLaCote(etape) && !surLaCote(de);
}

/** Un état des quêtes où la côte est ouverte (les deux preuves notées) : pour les essais. */
export function avecCoteOuverte(etat: EtatQuetes): EtatQuetes {
  const faits = { ...etat.faits };
  for (const l of Object.keys(LIEUX_PREUVES) as LieuId[]) faits[faitPreuve(l)] = Math.max(1, faits[faitPreuve(l)] ?? 0);
  return { ...etat, faits };
}
