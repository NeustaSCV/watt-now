// La fin du tutoriel côté serveur (plan 0.8, chantier 13 ; Q-0.8-18) : la saisie, la carte, la famille, la nuit.
// - « La carte » : on est allé à la station-service, et on est rentré chez soi avec **sa** pièce de famille (ou on l'a
//   déjà posée sur son meuble : un joueur qui a pris de l'avance n'est pas bloqué) ;
// - « La famille » : le meuble de famille est bâti, et sa pièce posée dessus (plan 0.8 §9.2 : le meuble ne compte comme
//   monté qu'avec elle). C'est le seuil du métier.
//
// Ce module ne connaît pas le joueur : joueur.ts lui passe ce qu'il faut regarder (une ligne par étape).

import { PIECES_DE_FAMILLE } from "../../commun/src/lignees.ts";
import { OBJETS, type Inventaire } from "../../commun/src/objets.ts";
import { ATELIER } from "../../commun/src/progression.ts";
import { NOMS_INSTALLATIONS, type TypeInstallation } from "../../commun/src/recettes.ts";
import type { Famille } from "../../commun/src/regles.ts";
import { PIECE_DE_FAMILLE } from "../../commun/src/tutoriel.ts";

/** Ce que les deux étapes regardent chez le joueur. */
export interface PourFinDuTutoriel {
  famille: Famille;
  lieu: string;
  inventaire: Inventaire;
  installations: Iterable<{ type: string; etat: object }>;
  visiteStation: boolean;
}

/** Le meuble de famille, s'il est bâti ; et sa pièce, si elle est posée dessus. */
function meuble(j: PourFinDuTutoriel): { bati: boolean; piecePosee: boolean } {
  const type = ATELIER[j.famille] as TypeInstallation;
  const champ = PIECES_DE_FAMILLE[type];
  let bati = false;
  let piecePosee = false;
  for (const i of j.installations) {
    if (i.type !== type) continue;
    bati = true;
    if (champ && (i.etat as Record<string, unknown>)[champ]) piecePosee = true;
  }
  return { bati, piecePosee };
}

/** La pièce de sa famille est-elle dans le sac ? */
function pieceEnPoche(j: PourFinDuTutoriel): boolean {
  return (j.inventaire[PIECE_DE_FAMILLE[j.famille]] ?? 0) > 0;
}

/** Les deux étapes de la fin du tutoriel : réussies ou non. */
export function etapesReussies(j: PourFinDuTutoriel): { carte: boolean; famille: boolean } {
  const m = meuble(j);
  return {
    carte: j.visiteStation && j.lieu === "terrain" && (pieceEnPoche(j) || m.piecePosee),
    famille: m.bati && m.piecePosee,
  };
}

/** Les compteurs de « La carte » : la station, la pièce, le retour. */
export function progresCarte(j: PourFinDuTutoriel): { libelle: string; fait: number; but: number }[] {
  const piece = OBJETS[PIECE_DE_FAMILLE[j.famille]].nom;
  const enMain = pieceEnPoche(j) || meuble(j).piecePosee;
  return [
    { libelle: "Station-service", fait: j.visiteStation ? 1 : 0, but: 1 },
    { libelle: piece.charAt(0).toUpperCase() + piece.slice(1), fait: enMain ? 1 : 0, but: 1 },
    { libelle: "Retour chez toi", fait: j.visiteStation && enMain && j.lieu === "terrain" ? 1 : 0, but: 1 },
  ];
}

/** Les compteurs de « La famille » : le meuble, puis la pièce posée dessus. */
export function progresFamille(j: PourFinDuTutoriel): { libelle: string; fait: number; but: number }[] {
  const type = ATELIER[j.famille] as TypeInstallation;
  const m = meuble(j);
  const nom = NOMS_INSTALLATIONS[type];
  const piece = OBJETS[PIECE_DE_FAMILLE[j.famille]].nom;
  return [
    { libelle: nom.charAt(0).toUpperCase() + nom.slice(1), fait: m.bati ? 1 : 0, but: 1 },
    { libelle: `${piece.charAt(0).toUpperCase() + piece.slice(1)} posé${j.famille === "voltaiques" || j.famille === "mecanistes" ? "" : "e"}`, fait: m.piecePosee ? 1 : 0, but: 1 },
  ];
}
