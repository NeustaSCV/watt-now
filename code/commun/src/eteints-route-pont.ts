// Les Éteints de H2A, la route du pont (plan 0.10, chantier H ; S-06) : à part de commun/src/route-pont.ts (qui ne doit
// pas charger eteints.ts, lequel charge lieux.ts), comme eteints-moulin.ts. contenu-lieux.ts les donne au serveur.

import { eteintsDePlaces, type Eteint, type PlaceEteint } from "./eteints.ts";
import { heurte } from "./lieux.ts";
import { ZONE_ROUTE_PONT, auPont, marchable, surLaCale } from "./route-pont.ts";
import { ETEINTS_PONT } from "./route-pont-modele.ts";

/**
 * Douze des vingt places de la fiche (S-06 : ≈ 12 par halte, à régler à la mesure sur l'iPhone) : les trois Noyés de la
 * vase, le patron du bar derrière son comptoir, l'errant du quai, l'équipé derrière la porte du péage et l'errant de la
 * pile, les rampants et les errants de la brèche et du tablier, l'équipé du hangar. Un « ancien habitant » somnole
 * debout (un dormeur) ; les Noyés errent, lentement (0,4 m/s).
 */
const PLACES_ETEINTS: readonly string[] = [
  "Noyé (enlisé dans la vase",
  "Noyé (couché dans la vase",
  "Noyé (au bout de la cale",
  "ancien habitant (le patron du bar",
  "errant (sur le quai",
  "équipé (casque de chantier",
  "errant (sur la pile",
  "rampant (entre les voitures",
  "rampant (remonté de la dalle",
  "errant (au bord du vide",
  "errant (contre la camionnette",
  "équipé (gilet de sauvetage orange",
];

/** Les Éteints de la halte, à leur place. */
export function eteintsRoutePont(): Eteint[] {
  const places: PlaceEteint[] = PLACES_ETEINTS.map((debut, i) => {
    const m = ETEINTS_PONT.find((e) => e.type?.startsWith(debut));
    if (!m) throw new Error(`route du pont : pas d'Éteint « ${debut} » dans la fiche du modèle`);
    const t = m.type ?? "";
    const place: PlaceEteint = { n: i + 1, x: m.x, z: m.z, o: 0.9 * i };
    if (t.startsWith("Noyé")) place.variante = "noye";
    else if (t.startsWith("rampant")) {
      place.variante = "rampant";
      place.etat = "dormant";
    } else if (t.startsWith("équipé")) place.variante = "equipe";
    else if (t.startsWith("ancien habitant")) place.etat = "dormant";
    return place;
  });
  return eteintsDePlaces(places, (x, z) => degager(auPont(x, z)));
}

/**
 * Une place du modèle contre un mur (le patron du bar, adossé à la cloison derrière son comptoir) : on la décale au plus
 * près, là où un corps tient, sinon il resterait coincé dans l'obstacle.
 */
function degager(p: { x: number; z: number }): { x: number; z: number } {
  const tient = (x: number, z: number) => !heurte(ZONE_ROUTE_PONT, x, z, 0.35) && (marchable(x, z) || surLaCale(x, z));
  if (tient(p.x, p.z)) return p;
  for (let r = 0.25; r <= 6; r += 0.25) {
    for (let a = 0; a < 16; a++) {
      const x = Math.round((p.x + Math.cos((a * Math.PI) / 8) * r) * 100) / 100;
      const z = Math.round((p.z + Math.sin((a * Math.PI) / 8) * r) * 100) / 100;
      if (tient(x, z)) return { x, z };
    }
  }
  return p;
}
