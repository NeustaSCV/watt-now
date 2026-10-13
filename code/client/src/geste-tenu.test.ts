// Un appui bref suffit à mener un geste court jusqu'au bout, au toucher comme au clavier (plan 0.8.2 §7.6).

import { test } from "node:test";
import assert from "node:assert/strict";
import { inviteArreter, seFaitEnTenantA } from "./geste-tenu.ts";
import { GESTE_TENU_MAX_S } from "../../commun/src/regles.ts";

test("0.8.2 §7.6 : au toucher, un geste court ne se tient pas (un appui bref le mène au bout)", () => {
  assert.equal(seFaitEnTenantA({ tactile: true, sansCible: false, fabrication: false, duree: 2 }), false);
  assert.equal(seFaitEnTenantA({ tactile: true, sansCible: false, fabrication: false, duree: 0.5 }), false);
});

test("0.8.2 §7.6 (décision du porteur) : au clavier et à la souris non plus ; les gestes longs et sans cible inchangés", () => {
  assert.equal(seFaitEnTenantA({ tactile: false, sansCible: false, fabrication: false, duree: 2 }), false);
  assert.equal(seFaitEnTenantA({ tactile: false, sansCible: false, fabrication: false, duree: GESTE_TENU_MAX_S }), false);
  assert.equal(seFaitEnTenantA({ tactile: false, sansCible: false, fabrication: false, duree: GESTE_TENU_MAX_S + 1 }), false, "un geste long continue seul");
  assert.equal(seFaitEnTenantA({ tactile: false, sansCible: true, fabrication: false, duree: 2 }), false);
  assert.equal(seFaitEnTenantA({ tactile: false, sansCible: false, fabrication: true, duree: 2 }), false);
});

test("0.8.2 §7.6 : pendant le geste, l'invite du clavier dit « Arrêter » avec la touche d'action", () => {
  assert.equal(inviteArreter("E"), "<kbd>E</kbd> Arrêter");
});
