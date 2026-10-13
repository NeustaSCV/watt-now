// Plan 0.8.2 §7.3 (chantier J) : qui a appris le meuble d'une autre famille (leçon, manuel) se voit proposer ses gestes ;
// sans rien avoir appris, il ne peut que l'examiner.

import { test } from "node:test";
import assert from "node:assert/strict";
import type { InstallationVue } from "../../commun/src/messages.ts";
import { SAVOIR_VIDE } from "../../commun/src/savoir.ts";
import { saitSeServir } from "../../commun/src/savoir-meuble.ts";
import { proposer, retenirSavoir } from "./interaction.ts";

const GOURDE = { litres: 0, contenu: "vide" } as never;
const PEDALIER = { id: 4, type: "pedalier", x: 20, z: 21, o: 0, niveau: 1, etat: { alternateur: true } } as unknown as InstallationVue;

/** Le bouton B (puis A) d'un Voltaïque debout devant le pédalier. */
function boutons() {
  const p = proposer({ x: 20, z: 20, o: 0 }, "terrain", "voltaiques", [], [], [PEDALIER], {}, GOURDE, {}, 0);
  return [p.A, p.B];
}

test("§7.3 : un Voltaïque qui a lu le manuel des Mécanistes pédale ; sans l'avoir lu, il ne fait qu'examiner", () => {
  assert.ok(!saitSeServir("pedalier", "voltaiques"));
  assert.ok(saitSeServir("pedalier", "voltaiques", { manuels: ["mecanistes"] }));
  assert.ok(saitSeServir("pedalier", "voltaiques", { apprises: ["pedalier"] }));
  assert.ok(!saitSeServir("pedalier", "voltaiques", { apprises: ["arbalete"] }), "une autre recette ne suffit pas");
  retenirSavoir(SAVOIR_VIDE);
  const sans = boutons();
  assert.ok(sans.every((b) => !b || b.libelle === "Examiner"), JSON.stringify(sans));
  retenirSavoir({ ...SAVOIR_VIDE, manuels: ["mecanistes"] });
  const avec = boutons();
  assert.ok(avec.some((b) => b && "message" in b && b.message?.t === "interagir"), JSON.stringify(avec));
  retenirSavoir(SAVOIR_VIDE);
});
