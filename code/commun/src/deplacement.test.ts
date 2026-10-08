import { test } from "node:test";
import assert from "node:assert/strict";
import { avancer, nettoyerIntention } from "./deplacement.ts";
import { ALLURES, MARGE_BORD, TERRAIN_TAILLE } from "./regles.ts";

const depart = { x: 25, z: 25, o: 0 };

test("avance à la vitesse de l'allure", () => {
  const arrivee = avancer(depart, { dx: 1, dz: 0, allure: "marche" }, 1);
  assert.equal(arrivee.x, 25 + ALLURES.marche);
  assert.equal(arrivee.z, 25);
  assert.equal(arrivee.o, Math.PI / 2);
});

test("la course va plus vite que la marche, la marche plus vite que l'allure discrète", () => {
  const d = avancer(depart, { dx: 0, dz: 1, allure: "discrete" }, 1).z;
  const m = avancer(depart, { dx: 0, dz: 1, allure: "marche" }, 1).z;
  const c = avancer(depart, { dx: 0, dz: 1, allure: "course" }, 1).z;
  assert.ok(d < m && m < c);
});

test("une diagonale n'est pas plus rapide qu'une ligne droite", () => {
  const arrivee = avancer(depart, { dx: 1, dz: 1, allure: "marche" }, 1);
  const distance = Math.hypot(arrivee.x - depart.x, arrivee.z - depart.z);
  assert.ok(Math.abs(distance - ALLURES.marche) < 1e-9);
});

test("on ne sort pas du terrain", () => {
  const loin = avancer(depart, { dx: 1, dz: -1, allure: "course" }, 1000);
  assert.equal(loin.x, TERRAIN_TAILLE - MARGE_BORD);
  assert.equal(loin.z, MARGE_BORD);
});

test("sans intention, la position et l'orientation ne changent pas", () => {
  const p = { x: 10, z: 12, o: 1.3 };
  assert.deepEqual(avancer(p, { dx: 0, dz: 0, allure: "course" }, 1), p);
});

test("les intentions venues du réseau sont nettoyées", () => {
  assert.equal(nettoyerIntention(null), null);
  assert.equal(nettoyerIntention({ dx: Number.NaN, dz: 0, allure: "marche" }), null);
  assert.equal(nettoyerIntention({ dx: 1, dz: 0, allure: "teleportation" }), null);
  assert.equal(nettoyerIntention({ dx: "1", dz: 0, allure: "marche" }), null);
  const trop = nettoyerIntention({ dx: 30, dz: 40, allure: "course" });
  assert.ok(trop);
  assert.ok(Math.abs(Math.hypot(trop.dx, trop.dz) - 1) < 1e-9);
});
