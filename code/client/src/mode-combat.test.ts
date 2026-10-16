// Le mode du joueur (duel 0.11, D-10, D-17, D-20) : le Combat tient, la bascule automatique part au serveur.

import { test } from "node:test";
import assert from "node:assert/strict";
import { DISTANCE_BASCULE, DISTANCE_CALME, ModeCombat, type OrigineMode } from "./mode-combat.ts";

function mode() {
  const envois: { combat: boolean; origine: OrigineMode }[] = [];
  const m = new ModeCombat((combat, origine) => envois.push({ combat, origine }));
  return { m, envois };
}

test("à l'entrée dans un lieu : Exploration, et le serveur le sait", () => {
  const { m, envois } = mode();
  m.combat = true;
  m.entrer();
  assert.equal(m.combat, false);
  assert.deepEqual(envois, [{ combat: false, origine: "joueur" }]);
});

test("un Éteint qui approche met en Combat, et la bascule part au serveur", () => {
  const { m, envois } = mode();
  assert.equal(m.surveiller(DISTANCE_BASCULE + 2), false);
  assert.equal(m.surveiller(DISTANCE_BASCULE - 1), true);
  assert.equal(m.combat, true);
  assert.deepEqual(envois, [{ combat: true, origine: "eteint" }]);
});

test("le Combat tient après le départ du dernier Éteint (D-17)", () => {
  const { m, envois } = mode();
  m.surveiller(3);
  // Le dernier Éteint est abattu ou s'en va : de longues secondes sans menace.
  for (let i = 0; i < 600; i++) m.surveiller(Infinity);
  assert.equal(m.combat, true);
  assert.equal(envois.length, 1, "rien ne repasse tout seul en Exploration");
});

test("seul le joueur repasse en Exploration ; il y reste tant que le même Éteint est là", () => {
  const { m, envois } = mode();
  m.surveiller(3);
  m.basculer();
  assert.equal(m.combat, false);
  assert.deepEqual(envois.at(-1), { combat: false, origine: "joueur" });
  // Le même Éteint, toujours tout près : c'est le choix du joueur.
  for (let i = 0; i < 50; i++) m.surveiller(2.5);
  assert.equal(m.combat, false);
  // Il s'éloigne au-delà de 10 m, puis revient : la bascule se refait.
  m.surveiller(DISTANCE_CALME + 1);
  assert.equal(m.surveiller(4), true);
  assert.equal(m.combat, true);
});

test("le bouton et la touche basculent le mode choisi, chaque fois envoyé", () => {
  const { m, envois } = mode();
  m.basculer();
  m.basculer();
  m.basculer();
  assert.deepEqual(envois.map((e) => e.combat), [true, false, true]);
});

test("déjà en Combat, un Éteint qui approche ne renvoie rien", () => {
  const { m, envois } = mode();
  m.basculer();
  assert.equal(m.surveiller(2), false);
  assert.equal(envois.length, 1);
});

test("le serveur met en Combat (un vert frappé par un rouge, D-20) : une seule fois", () => {
  const { m, envois } = mode();
  assert.equal(m.imposerCombat(), true);
  assert.equal(m.imposerCombat(), false);
  assert.deepEqual(envois, [{ combat: true, origine: "serveur" }]);
});
