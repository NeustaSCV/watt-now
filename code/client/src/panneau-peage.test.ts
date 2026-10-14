// La caisse du péage à l'écran (plan 0.10, S-19, chantier H) : l'écran du coffre en mode « donner ». Le compteur monte
// au prix du Comptoir, ce qu'il ne reprend pas (les ordures à 0) ne compte pas (V2-02, chantier L) ; « Payer » ne s'allume qu'à 12 wotts ; ce qu'on a mis dans la caisse
// suit ce qu'on porte encore.

import { test } from "node:test";
import assert from "node:assert/strict";
import { borner, htmlCaisse } from "./panneau-peage.ts";

const bouton = (html: string) => /<button[^>]*data-payer[^>]*>/.exec(html)![0];

test("« Payer » reste éteint sous 12 wotts, s'allume à 12 ; le compte se lit en wotts", () => {
  const sac = { branche: 6, canette: 3, sac_a_dos: 1 };
  const vide = htmlCaisse("pont", sac, {}, false);
  assert.match(bouton(vide), /disabled/);
  assert.match(vide, /0 \/ 12 wotts/);
  assert.ok(!vide.includes('data-objet="sac_a_dos"'), "le sac qu'on porte ne se donne pas");
  // Trois canettes et trois branches : les canettes ne comptent pas (9,6).
  const peu = htmlCaisse("pont", sac, { canette: 3, branche: 3 }, false);
  assert.match(bouton(peu), /disabled/);
  assert.match(peu, /9,6 \/ 12 wotts/);
  assert.match(peu, /ce qu'il ne reprend pas ne compte pas/);
  assert.match(peu, /title="canette[^"]*: ne compte pas"/);
  // Quatre branches : 12,8, le compte y est, rien n'est rendu.
  const assez = htmlCaisse("pont", sac, { branche: 4 }, false);
  assert.doesNotMatch(bouton(assez), /disabled/);
  assert.match(assez, /Rien ne sera rendu/);
  // En attente de la réponse du serveur : grisé.
  assert.match(bouton(htmlCaisse("pont", sac, { branche: 4 }, true)), /disabled/);
  // Ce qui est dans la caisse ne paraît plus dans le sac (deux branches de reste).
  assert.match(assez, /data-sens="deposer" data-objet="branche"[^>]*>.*?×2/s);
});

test("ce qu'on a mis dans la caisse suit le sac (un objet mangé ou jeté entre-temps en sort)", () => {
  assert.deepEqual(borner({ branche: 4, chiffons: 2 }, { branche: 3 }), { branche: 3 });
});
