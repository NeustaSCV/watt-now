// Autour de la station-service (0.10, R52, N-1 ; décision du porteur du 2026-10-15) : vue de loin, à l'arrivée, la halte
// flottait sur le ciel (son sol s'arrête 30 m au-delà de ses bords). Le décor autour d'elle est le module de la session
// « bâtiments » (batiment/alentours-station/, copié dans client/src/batiments/ par `npm run batiments:importer`, jamais
// modifié ici) : le sous-bois sur 60 m, la route de la Campagne qui continue aux deux bouts avec ses glissières, le chemin
// de la Coopérative prolongé au nord, un talus sombre au-delà. Il est dans le repère du jeu de la station (le coin
// nord-ouest du lot), à poser tel quel à côté de creerHalte() ; rien n'y est un obstacle, rien ne recouvre le lot. Deux
// appels de dessin.
//
// Le module a recopié la route et le lot du jeu (FICHE.station) : le test rendu/alentours-station.test.ts vérifie
// qu'ils suivent toujours commun/src/lieux.ts.

import type * as THREE from "three";
// @ts-expect-error : le module est en JavaScript, sans types (client/src/batiments/ ne se modifie pas).
import { creer } from "../batiments/alentours-station/modele.js";

/** L'usure du décor (0 à 1) : celle par défaut, comme les modèles des autres lieux. */
const USURE = 0.7;

export function creerAlentoursStation(): THREE.Group {
  return (creer as (o: { usure: number }) => THREE.Group)({ usure: USURE });
}
