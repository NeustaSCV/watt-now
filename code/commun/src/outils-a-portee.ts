// Les outils à portée de main (plan 0.8 §2.3, chantier 6) : ce qui compte pour les qualités d'outil, en plus du sac.
// - Le râtelier à outils : les outils qu'on y range comptent quand on est à 3 m (le sac respire, la maison travaille).
// - L'établi à étau : l'étau boulonné serre fort (Serrer 3) quand on est à 3 m. Dans le sac, l'étau ne serre pas
//   (décision du porteur, 2026-10-10) ; monté au serre-joint de fortune (le repli), l'établi ne serre pas fort.
//
// Le serveur juge les qualités sur `outilsAPortee` (une ligne d'appel dans joueur.ts) ; le client peut faire de même
// pour griser juste. Les postes (l'établi à étau) entrent sous la clé `poste:<id>` (QUALITES_POSTES, recettes.ts).

import type { CleObjet } from "./etoiles.ts";
import { typeDe } from "./etoiles.ts";
import type { EtatInstallation } from "./messages.ts";
import { OBJETS, type Inventaire } from "./objets.ts";
import { niveauInstallation } from "./lignees.ts";
import { QUALITES_OBJETS } from "./recettes.ts";

/** Jusqu'où le râtelier et l'établi à étau servent (m) : comme une construction (lieu-recette.ts). */
export const PORTEE_OUTILS = 3;

/** La clé du poste « établi à étau » dans les outils à portée (QUALITES_POSTES). */
export const POSTE_ETABLI_ETAU = "poste:etabli_etau";

/** Une installation telle que les outils la regardent. */
export interface InstallationOutils {
  type: string;
  x: number;
  z: number;
  niveau?: number;
  etat: EtatInstallation;
}

/** Un outil : un objet qui donne une qualité (une hache, un couteau, une clé plate, une masse…). */
export function estOutil(objet: CleObjet): boolean {
  return QUALITES_OBJETS[typeDe(objet)] !== undefined;
}

/** Ce qu'on dit quand on veut ranger au râtelier autre chose qu'un outil, ou null si c'est un outil. */
export function refusRatelier(objet: CleObjet): string | null {
  if (estOutil(objet)) return null;
  return `Le râtelier ne prend que les outils : ${OBJETS[typeDe(objet)].nom} va dans le coffre.`;
}

/**
 * L'étau est-il boulonné sur cet établi ? Il faut l'établi à étau (niveau 2), monté avec l'étau : ce qu'on a payé
 * pour ce niveau le dit (`etat.payes[0]`). Monté au serre-joint de fortune, il tient la pièce sans serrer fort.
 */
export function etauMonte(i: { type: string; niveau?: number; etat: EtatInstallation }): boolean {
  if (i.type !== "etabli" || niveauInstallation(i) < 2) return false;
  return (i.etat.payes?.[0]?.etau ?? 0) > 0;
}

/**
 * Les outils à portée : le sac, plus les outils rangés aux râteliers à 3 m, plus l'établi à étau à 3 m (Serrer 3).
 * Ne sert qu'à juger les qualités (`niveauQualite`, `multiplicateurQualites`) : les ingrédients se prennent dans le sac.
 */
export function outilsAPortee(a: { x: number; z: number; installations: Iterable<InstallationOutils>; inventaire: Inventaire }): Inventaire {
  const r: Record<string, number> = { ...(a.inventaire as Record<string, number>) };
  for (const i of a.installations) {
    if (Math.hypot(i.x - a.x, i.z - a.z) > PORTEE_OUTILS) continue;
    if (i.type === "ratelier_outils") {
      for (const [t, n] of Object.entries(i.etat.contenu ?? {})) if (n) r[t] = (r[t] ?? 0) + n;
    } else if (etauMonte(i)) r[POSTE_ETABLI_ETAU] = 1;
  }
  return r as Inventaire;
}
