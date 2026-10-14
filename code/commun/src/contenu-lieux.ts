// Le contenu vivant des lieux construits par le registre (plan 0.10, chantier A) : leurs Éteints, leurs ressources, leur
// butin, leur semis, leur milieu. Le serveur s'en sert pour les construire (serveur/src/lieux-vivants.ts) ; le client n'a
// pas à le charger (ce qu'il sait d'un lieu est dans registre-lieux.ts).
//
// Les lieux du niveau 1 ont leur contenu dans leur module serveur, qui le construit lui-même : la station
// (serveur/src/halte.ts), le gué (gue.ts), la Coopérative (cooperative.ts), le Moulin (moulin.ts). Les lieux nouveaux
// ajoutent ici leur entrée ; le contenu se lit à chaque construction du lieu (une fonction, pas une valeur : un réglage
// ou un semis changé à chaud est pris en compte au prochain chargement, comme pour le Moulin).
//
// 0.10 : les quatre lieux du niveau 2 sont branchés vides (ni Éteints ni butin) ; les chantiers H à K les remplissent.

import { MILIEU_CORNICHE } from "./corniche.ts";
import { BUTIN_CORNICHE, SEMIS_VIVANT_CORNICHE, VERSION_CORNICHE, eteintsCorniche, ressourcesCorniche } from "./corniche-contenu.ts";
import type { Eteint, Milieu } from "./eteints.ts";
import { eteintsHotel } from "./eteints-hotel.ts";
import { VERSION_HOTEL, butinHotel } from "./hotel.ts";
import { milieuHotel } from "./milieu-hotel.ts";
import type { LieuId } from "./lieux.ts";
import type { SemisVivant } from "./semis.ts";
import type { ButinLieu, RessourceSol } from "./terrain.ts";
import { eteintsRoutePont } from "./eteints-route-pont.ts";
import { BUTIN_ROUTE_PONT, SEMIS_VIVANT_ROUTE_PONT, VERSION_ROUTE_PONT, ressourcesRoutePont } from "./route-pont.ts";

/** Une ressource d'un lieu, telle qu'on la génère (sa disponibilité vient de la base). */
export type RessourceDuLieu = Omit<RessourceSol, "disponible">;

export interface ContenuLieu {
  /** Les Éteints du lieu, au calme (au début, et quand le lieu se rendort ou revient à 24 h). */
  eteints: () => Eteint[];
  /** Ses ressources à la première visite, et la version de ce contenu (la changer régénère). */
  ressources: () => RessourceDuLieu[];
  version: number;
  /** La repousse du lieu, son butin personnel, son vrac (serveur/src/lieu-vivant.ts, en tête du fichier). */
  butin?: ButinLieu;
  /** Le semis au hasard (commun/src/semis.ts). */
  semis?: SemisVivant;
  /** Ce que l'endroit fait à la perception des Éteints (murs, portes, obscurité). */
  milieu?: (portes: Readonly<Record<string, boolean>>) => Milieu;
  /** Le calcul économe des Éteints (sans : économe pour un lieu à soi, à chaque tic pour une halte). */
  econome?: boolean;
}

/** Un lieu branché vide : ni Éteints ni ressources. */
export const CONTENU_VIDE: ContenuLieu = { eteints: () => [], ressources: () => [], version: 1 };

/** Le contenu des lieux construits par le registre. Une entrée par lieu ; un nouveau lieu ajoute la sienne à la fin. */
export const CONTENU_LIEUX: Partial<Record<LieuId, () => ContenuLieu>> = {
  // ---------- 0.10 : le niveau 2, vide (chantier A) ; à remplir par les chantiers H (le pont), I (la corniche), J
  // (l'hôtel), K (le phare) ----------
  // H2A (chantier H) : commun/src/route-pont.ts et eteints-route-pont.ts.
  route_pont: () => ({ eteints: eteintsRoutePont, ressources: ressourcesRoutePont, version: VERSION_ROUTE_PONT, butin: BUTIN_ROUTE_PONT, semis: SEMIS_VIVANT_ROUTE_PONT }),
  // 0.10, chantier J : le Grand Hôtel des Flots (hotel.ts, eteints-hotel.ts, milieu-hotel.ts ; « le check-in » :
  // serveur/src/hotel.ts).
  grand_hotel: () => ({ eteints: eteintsHotel, ressources: butinHotel, version: VERSION_HOTEL, milieu: milieuHotel }),
  // 0.10, chantier I : la corniche du Cap Rouge (corniche-contenu.ts ; sa géographie et son milieu : corniche.ts).
  corniche: () => ({
    eteints: eteintsCorniche,
    ressources: ressourcesCorniche,
    version: VERSION_CORNICHE,
    butin: BUTIN_CORNICHE,
    semis: SEMIS_VIVANT_CORNICHE,
    milieu: () => MILIEU_CORNICHE,
  }),
  phare: () => CONTENU_VIDE,
};

/** Le contenu d'un lieu (vide s'il n'en déclare pas). */
export function contenuDe(lieu: LieuId): ContenuLieu {
  return CONTENU_LIEUX[lieu]?.() ?? CONTENU_VIDE;
}
