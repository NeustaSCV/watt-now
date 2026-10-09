// 0.6, chantier 6 (Book 25 §5.3) : côté client, l'alarme électrique franchie allume sa LED ; la clôture couchée ou
// privée de courant se dit en une ligne courte ; une clôture armée bourdonne. Les modèles des Voltaïques sont inscrits
// au registre des métiers.

import { test } from "node:test";
import assert from "node:assert/strict";
import type { InstallationVue } from "../../commun/src/messages.ts";
import { sousTension, suivreElectrique } from "./electricite.ts";
import { ledAllumee } from "./rendu/metier/electricite.ts";
import { modeleMetier } from "./rendu/metier/index.ts";

const vue = (type: InstallationVue["type"], declencheur?: NonNullable<InstallationVue["etat"]["declencheur"]>): InstallationVue => ({ id: 1, type, x: 0, z: 0, o: 0, etat: declencheur ? { declencheur } : {} });

test("0.6 Voltaïques (client) : l'alarme franchie allume la LED, sans message de plus (le serveur le dit)", () => {
  assert.equal(ledAllumee(), false);
  assert.equal(suivreElectrique(vue("alarme_electrique", { arme: true, prises: 0 }), vue("alarme_electrique", { arme: true, prises: 1 })), null);
  assert.equal(ledAllumee(), true);
  // Une installation qui arrive (pas d'état d'avant) : rien.
  assert.equal(suivreElectrique(undefined, vue("cloture_electrique", { arme: true, prises: 0, couche: true })), null);
});

test("0.6 Voltaïques (client) : la clôture couchée, sans courant, puis rebranchée, se dit en une ligne courte", () => {
  const armee = vue("cloture_electrique", { arme: true, prises: 3 });
  const couchee = suivreElectrique(armee, vue("cloture_electrique", { arme: false, prises: 3, couche: true }));
  assert.match(couchee!, /couchée.*\{agir\}/);
  const sansCourant = suivreElectrique(armee, vue("cloture_fortune", { arme: false, prises: 3 }));
  assert.match(sansCourant!, /plus de courant/);
  assert.match(suivreElectrique(vue("cloture_fortune", { arme: false, prises: 3 }), armee)!, /repasse/);
  for (const t of [couchee!, sansCourant!]) assert.ok(t.length <= 110, t);
  assert.equal(sousTension(armee), true);
  assert.equal(sousTension(vue("cloture_electrique", { arme: true, prises: 0, couche: true })), false);
  assert.equal(sousTension(vue("plaque_choc", { arme: true, prises: 0 })), false);
});

test("0.6 Voltaïques (client) : les matraques, l'aiguillon et les installations électriques ont leur modèle", () => {
  for (const objet of ["matraque_fortune", "matraque_electrique", "aiguillon"]) assert.ok(modeleMetier(objet, "main"), objet);
  for (const type of ["alarme_electrique", "cloture_fortune", "cloture_electrique", "plaque_choc", "bain_derouillage"]) {
    const m = modeleMetier(type, "sol");
    assert.ok(m, type);
    let maillages = 0;
    m.traverse((o) => {
      if ((o as { isMesh?: boolean }).isMesh) maillages++;
    });
    assert.ok(maillages >= 1 && maillages <= 6, `${type} : ${maillages} maillages`);
  }
  assert.equal(modeleMetier("pierre", "main"), null);
});
