// Au toucher, un appui bref suffit à lancer un geste jusqu'au bout (plan 0.8.2 §7.6).

import { test } from "node:test";
import assert from "node:assert/strict";
import { seFaitEnTenantA } from "./geste-tenu.ts";
import { GESTE_TENU_MAX_S } from "../../commun/src/regles.ts";

test("0.8.2 §7.6 : au toucher, un geste court ne se tient pas (un appui bref le mène au bout)", () => {
  assert.equal(seFaitEnTenantA({ tactile: true, sansCible: false, fabrication: false, duree: 2 }), false);
  assert.equal(seFaitEnTenantA({ tactile: true, sansCible: false, fabrication: false, duree: 0.5 }), false);
});

test("au clavier et à la souris, rien ne change : un geste court sur une cible se tient", () => {
  assert.equal(seFaitEnTenantA({ tactile: false, sansCible: false, fabrication: false, duree: 2 }), true);
  assert.equal(seFaitEnTenantA({ tactile: false, sansCible: false, fabrication: false, duree: GESTE_TENU_MAX_S + 1 }), false, "un geste long continue seul");
  assert.equal(seFaitEnTenantA({ tactile: false, sansCible: true, fabrication: false, duree: 2 }), false, "manger, boire : sans tenir");
  assert.equal(seFaitEnTenantA({ tactile: false, sansCible: false, fabrication: true, duree: 2 }), false, "une fabrication : sans tenir");
});
