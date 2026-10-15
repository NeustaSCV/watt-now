// 0.10, R52 (N-1) : le décor autour de la station est celui de la session « bâtiments » ; il suit la halte du jeu (le lot,
// la route, le chemin de la Coopérative qu'il a recopiés), ne recouvre pas le lot, et reste léger (deux appels).

import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";

const { creerAlentoursStation } = await import("./alentours-station.ts");
const { CHEMIN_COOP_HALTE, HALTE, ROUTE } = await import("../../../commun/src/lieux.ts");
// @ts-ignore — le module est en JavaScript (session « bâtiments »), sans déclaration de types.
const { FICHE } = (await import("../batiments/alentours-station/modele.js")) as { FICHE: { station: { lot: { l: number; p: number }; route: { z: number; demiLargeur: number }; sorties: { vers: string; x: number }[] } } };

test("les alentours de la station suivent la halte du jeu : le lot, la route, le chemin de la Coopérative", () => {
  assert.deepEqual(FICHE.station.lot, { l: HALTE.longueur, p: HALTE.largeur });
  assert.equal(FICHE.station.route.z, ROUTE.z);
  assert.equal(FICHE.station.route.demiLargeur, ROUTE.demiLargeur);
  assert.equal(FICHE.station.sorties.find((s) => s.vers === "cooperative")!.x, CHEMIN_COOP_HALTE.x);
});

test("le décor entoure le lot sans le recouvrir (au-dessus du sol de la halte), sur 60 m au moins ; deux appels de dessin", () => {
  const g = creerAlentoursStation();
  g.updateMatrixWorld(true);
  let appels = 0;
  const b = new THREE.Box3();
  const v = new THREE.Vector3();
  let dansLeLot = 0;
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    appels++;
    const pos = m.geometry.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
      b.expandByPoint(v);
      // Dans le lot, rien ne dépasse le sol de la halte (y = 0).
      if (v.x > 0.5 && v.x < HALTE.longueur - 0.5 && v.z > 0.5 && v.z < HALTE.largeur - 0.5 && v.y > 0.01) dansLeLot++;
    }
  });
  assert.equal(appels, 2);
  assert.equal(dansLeLot, 0, `${dansLeLot} sommets au-dessus du lot`);
  assert.ok(b.min.x <= -60 && b.max.x >= HALTE.longueur + 60 && b.min.z <= -60 && b.max.z >= HALTE.largeur + 60, "60 m autour du lot");
});
