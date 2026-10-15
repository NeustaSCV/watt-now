// Les bras pris (plan 0.10, S-08 ; V2-12) : l'escabeau (le terrain, le phare), la batterie et la tête du robot (l'hôtel)
// se portent dans les bras. On marche, on ne court pas, **on ne frappe pas** : le bouton A propose ce que les bras
// peuvent faire (poser ce qu'on porte, le brancher ou le présenter devant la borne), **y compris en mode Combat**, où il
// disait « Frapper ». Saisi, A et B servent toujours à se dégager.
//
// Ce module est pur (pour les tests) : main.ts lui donne ce que le lieu propose pour les bras, et l'état du combat.

import type { ActionProposee, Propositions } from "./interaction.ts";

/** Les verbes d'un geste des bras : poser ce qu'on porte, le brancher ou le présenter (la borne de l'hôtel). */
const VERBES_DES_BRAS: ReadonlySet<string> = new Set(["poser", "brancher", "presenter"]);

/** Cette action est-elle un geste des bras chargés (poser, brancher, présenter) ? */
export function gesteDesBras(a: ActionProposee | null | undefined): a is Extract<ActionProposee, { message: unknown }> {
  if (!a || !("message" in a)) return false;
  const m = a.message;
  return m.t === "poser" || (m.t === "interagir" && VERBES_DES_BRAS.has(m.verbe));
}

/** Ce que A fait les bras pris quand le lieu n'a rien proposé de mieux : poser ce qu'on porte. */
export const POSER: ActionProposee = { libelle: "Poser", message: { t: "poser" } };

/**
 * Les boutons en mode Combat (ou saisi). Saisi : se dégager. Les bras pris (`bras` : le geste que le lieu propose, ou
 * null si les bras sont libres) : A pose (jamais « Frapper »), B esquive ou repousse comme d'habitude. Sinon : frapper.
 */
export function propositionsCombat(etat: { saisi: boolean; brasPris: boolean; bras: ActionProposee | null; repousser: boolean }): Propositions {
  if (etat.saisi) return { A: { libelle: "Se dégager", examiner: "" }, B: { libelle: "Se dégager", examiner: "" }, cible: null };
  const B: ActionProposee = { libelle: etat.repousser ? "Repousser" : "Esquiver", examiner: "" };
  if (etat.brasPris) return { A: gesteDesBras(etat.bras) ? etat.bras : POSER, B, cible: null };
  return { A: { libelle: "Frapper (maintenir : à la tête)", examiner: "" }, B, cible: null };
}
