// La halte de la station-service, côté serveur : un lieu vivant partagé par tous les voyageurs présents
// (Book 01 §2 bis). Chacun reçoit les changements faits par les autres, et les Éteints réagissent à la signature de tous.

import { VERSION_HALTE, eteintsHalte, genererHalte } from "../../commun/src/halte.ts";
import { ZONE_STATION } from "../../commun/src/lieux.ts";
import { milieuHalte } from "../../commun/src/milieu-coop.ts";
import { PLAN_VUE_HALTE } from "../../commun/src/vue-lieux.ts";
import type { Base } from "./base.ts";
import { LieuVivant } from "./lieu-vivant.ts";

export type { Voyageur } from "./lieu-vivant.ts";

export class Halte extends LieuVivant {
  constructor(base: Base, alea: () => number = Math.random) {
    super(
      base,
      {
        cle: "station",
        sacs: { lieu: "station", terrainDe: 0 },
        zone: ZONE_STATION,
        // 0.7.2 : les murs de la boutique et de l'atelier arrêtent la vue (on voit par la porte et les vitrines).
        plan: PLAN_VUE_HALTE,
        milieu: milieuHalte,
        eteints: eteintsHalte,
        ressources: genererHalte,
        version: VERSION_HALTE,
      },
      alea,
    );
  }
}
