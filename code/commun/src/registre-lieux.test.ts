// Plan 0.10, chantier A : le registre des lieux. Il connaît les dix lieux ; chaque fiche dit vrai sur son étape et sa
// nature ; les deux routes du niveau 2 ont les mêmes distances (B16).

import { test } from "node:test";
import assert from "node:assert/strict";
import { CONTENU_LIEUX, contenuDe } from "./contenu-lieux.ts";
import {
  ETAPES_LIEUX,
  LIEUX,
  LIEUX_NIVEAU_2,
  TOUS_LES_LIEUX,
  SORTIE_TERRAIN,
  TRONCONS,
  arriveeDans,
  destinations,
  distanceKm,
  entreesDe,
  etapeVers,
  heurte,
  lieuDeLEtape,
  sortiesDe,
  zoneDe,
  type LieuId,
} from "./lieux.ts";
import {
  REGISTRE_LIEUX,
  REINITIALISATION_LIEU_MS,
  estHalte,
  estPartage,
  estPersonnel,
  ficheLieu,
  lieuxDuNiveau,
  pausePossibleIci,
  planDe,
  zoneSelonPortes,
} from "./registre-lieux.ts";
import { LIEUX_A_SOI } from "./arrivee.ts";
import { planVue } from "./vue-lieux.ts";

test("le registre connaît les dix lieux, chacun avec sa fiche, sa zone et ses sorties", () => {
  assert.equal(TOUS_LES_LIEUX.length, 10);
  assert.deepEqual(Object.keys(REGISTRE_LIEUX).sort(), [...TOUS_LES_LIEUX].sort());
  assert.deepEqual(LIEUX_NIVEAU_2, ["route_pont", "grand_hotel", "corniche", "phare"]);
  assert.deepEqual(lieuxDuNiveau(2), [...LIEUX_NIVEAU_2]);
  for (const lieu of TOUS_LES_LIEUX) {
    const f = ficheLieu(lieu);
    assert.equal(f.id, lieu);
    assert.ok(LIEUX[lieu].ouvert, `${lieu} est ouvert sur la carte`);
    assert.ok(sortiesDe(lieu).length > 0 && entreesDe(lieu).length > 0, `${lieu} a une sortie et une entrée`);
    // On arrive dans la zone, à l'écart des obstacles.
    const z = zoneDe(lieu);
    for (const s of entreesDe(lieu)) {
      assert.ok(s.arrivee.x > z.xMin && s.arrivee.x < z.xMax && s.arrivee.z > z.zMin && s.arrivee.z < z.zMax, `${lieu} : arrivée dans la zone`);
      assert.ok(!heurte(z, s.arrivee.x, s.arrivee.z, 0.35), `${lieu} : arrivée libre`);
    }
  }
});

test("chaque fiche dit vrai : son étape du monde, sa nature, son plan de vue", () => {
  for (const lieu of TOUS_LES_LIEUX) {
    const f = ficheLieu(lieu);
    if (f.etape) assert.equal(lieuDeLEtape(f.etape), lieu, `${lieu} : l'étape ${f.etape}`);
    // Le plan de vue des lieux du niveau 1 est celui de vue-lieux.ts.
    if (f.niveau < 2) assert.equal(planDe(lieu), planVue(lieu), `${lieu} : le même plan de vue`);
  }
  assert.deepEqual(ETAPES_LIEUX, { maison: "terrain", H1A: "station", H1B: "gue", L1A: "cooperative", L1B: "moulin", H2A: "route_pont", H2B: "corniche", L2A: "grand_hotel", L2B: "phare" });
  const ou = (p: (l: LieuId) => boolean) => TOUS_LES_LIEUX.filter(p);
  assert.deepEqual(ou(estHalte), ["station", "gue", "route_pont", "corniche"]);
  assert.deepEqual(ou(estPersonnel), ["cooperative", "moulin", "grand_hotel", "phare"]);
  assert.deepEqual(ou(estPartage), ["station", "comptoir", "gue", "route_pont", "corniche"]);
  assert.deepEqual(ou(pausePossibleIci), ["terrain", "cooperative", "moulin", "grand_hotel", "phare"]);
  assert.deepEqual(LIEUX_A_SOI, ["terrain", "cooperative", "moulin", "grand_hotel", "phare"]);
  // Un lieu à soi revient au bout de 24 h, même vide.
  for (const lieu of ou(estPersonnel)) assert.equal(ficheLieu(lieu).reinitialisationMs, REINITIALISATION_LIEU_MS, lieu);
  assert.equal(REINITIALISATION_LIEU_MS, 24 * 3_600_000);
});

test("la zone d'un lieu à portes suit ses portes ; sans portes, c'est sa zone", () => {
  const coop = ficheLieu("cooperative").portes!;
  assert.equal(zoneSelonPortes("cooperative", coop.initiales()), zoneDe("cooperative"));
  assert.equal(zoneSelonPortes("moulin", ficheLieu("moulin").portes!.initiales()), zoneDe("moulin"));
  for (const lieu of LIEUX_NIVEAU_2) assert.equal(zoneSelonPortes(lieu, {}), zoneDe(lieu));
});

test("les quatre lieux du niveau 2 sont branchés vides : ni Éteints ni butin ; leur zone est le lot du modèle", () => {
  // 0.10, chantier J : l'hôtel a son contenu (ses Éteints, son butin : serveur/src/hotel.test.ts).
  for (const lieu of LIEUX_NIVEAU_2.filter((l) => l !== "grand_hotel")) {
    assert.ok(CONTENU_LIEUX[lieu], `${lieu} a son contenu`);
    // 0.10, chantier I : la corniche est remplie (commun/src/corniche.test.ts).
    if (lieu === "corniche") continue;
    assert.deepEqual(contenuDe(lieu).eteints(), []);
    assert.deepEqual(contenuDe(lieu).ressources(), []);
  }
  const lot = (lieu: LieuId) => {
    const z = zoneDe(lieu);
    return [Math.round(z.xMax + z.xMin), Math.round(z.zMax + z.zMin)];
  };
  assert.deepEqual(lot("grand_hotel"), [64, 66], "l'hôtel : 64 × 66 m");
  assert.deepEqual(lot("phare"), [60, 50], "le phare : 60 × 50 m");
  for (const halte of ["route_pont", "corniche"] as const) assert.equal(zoneDe(halte).xMax + zoneDe(halte).xMin, 200, `${halte} : 200 m de long`);
});

test("B16 : les deux routes du niveau 2 partent du terrain, aux mêmes distances (3 km puis 2 km)", () => {
  assert.equal(distanceKm("terrain", "route_pont"), 3);
  assert.equal(distanceKm("route_pont", "grand_hotel"), 2);
  assert.equal(distanceKm("terrain", "corniche"), 3);
  assert.equal(distanceKm("corniche", "phare"), 2);
  assert.equal(distanceKm("terrain", "grand_hotel"), distanceKm("terrain", "phare"));
  assert.equal(distanceKm("terrain", "phare"), 5);
  // Aucune route de la Coopérative ni du Moulin vers la côte : on y passe par chez soi.
  for (const t of TRONCONS.filter((t) => LIEUX_NIVEAU_2.includes(t.a) || LIEUX_NIVEAU_2.includes(t.b))) {
    assert.ok([t.a, t.b].every((l) => l === "terrain" || LIEUX_NIVEAU_2.includes(l)), `${t.a} – ${t.b}`);
  }
  assert.equal(etapeVers("cooperative", "route_pont"), "station");
  assert.equal(etapeVers("moulin", "corniche"), "gue");
  // Les fiches de la carte disent la distance depuis le terrain.
  for (const lieu of LIEUX_NIVEAU_2) assert.equal(LIEUX[lieu].km, distanceKm("terrain", lieu), lieu);
  // On s'arrête à chaque lieu de la route, à l'aller comme au retour.
  const chemin = (de: LieuId, vers: LieuId) => {
    const etapes: LieuId[] = [];
    for (let ici = de; ici !== vers; ) etapes.push((ici = etapeVers(ici, vers)));
    return etapes;
  };
  assert.deepEqual(chemin("terrain", "grand_hotel"), ["route_pont", "grand_hotel"]);
  assert.deepEqual(chemin("terrain", "phare"), ["corniche", "phare"]);
  assert.deepEqual(chemin("phare", "terrain"), ["corniche", "terrain"]);
  assert.deepEqual(chemin("grand_hotel", "terrain"), ["route_pont", "terrain"]);
  assert.deepEqual(chemin("grand_hotel", "phare"), ["route_pont", "terrain", "corniche", "phare"]);
  // Les deux routes, étape par étape : la même longueur.
  const a = chemin("terrain", "grand_hotel");
  const b = chemin("terrain", "phare");
  a.forEach((l, i) => assert.equal(distanceKm("terrain", l), distanceKm("terrain", b[i]!), `${l} et ${b[i]}`));
});

test("le terrain a ses deux départs vers la côte, comme vers la station et le gué ; la Coopérative et le Moulin, aucun", () => {
  assert.deepEqual(destinations(SORTIE_TERRAIN), ["station", "gue", "route_pont", "corniche"]);
  for (const lieu of ["cooperative", "moulin"] as const) for (const s of sortiesDe(lieu)) for (const d of destinations(s)) assert.ok(!LIEUX_NIVEAU_2.includes(d), `${lieu} → ${d}`);
  // On arrive dans les lieux du niveau 2 du côté d'où l'on vient.
  assert.deepEqual(sortiesDe("route_pont").find((s) => s.vers === "terrain")!.arrivee, arriveeDans("route_pont", "terrain"));
  assert.notDeepEqual(arriveeDans("route_pont", "grand_hotel"), arriveeDans("route_pont", "terrain"));
  assert.deepEqual(arriveeDans("corniche", "phare"), sortiesDe("corniche").find((s) => s.vers === "phare")!.arrivee);
});

test("R18 : la fiche de carte des lieux du niveau 2 ne dit pas ce qu'on y trouve", () => {
  for (const lieu of LIEUX_NIVEAU_2) {
    const d = LIEUX[lieu].description;
    assert.ok(d.length > 20 && d.length < 200, `${lieu} : une description courte`);
    assert.doesNotMatch(d, /clé|péage|wotts|carte de|cargo|objet|butin|on y trouve/i, `${lieu} : rien du contenu`);
    assert.doesNotMatch(d, /Éteint/, `${lieu} : ni ses Éteints`);
  }
  assert.equal(LIEUX.route_pont.nom, "La route du pont");
  assert.equal(LIEUX.grand_hotel.nom, "Le Grand Hôtel des Flots");
  assert.equal(LIEUX.corniche.nom, "La corniche du Cap Rouge");
  assert.equal(LIEUX.phare.nom, "Le phare du cap");
});
