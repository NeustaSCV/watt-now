// La boussole (0.10.1, chantier D) : la direction du haut de l'écran, le N au repos, le chemin du terrain au sud.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Boussoles, directionCourte, directionVue, dessinerBoussole, rotationNord } from "./boussole.ts";

/** Le lacet de la caméra au repos, après `q` quarts de tour (rendu/scene.ts). */
const lacet = (q: number) => Math.PI / 4 + (q * Math.PI) / 2;

test("au repos et après chaque quart de tour : la direction du haut de l'écran", () => {
  assert.equal(directionVue(lacet(0)), "N-O");
  assert.equal(directionVue(lacet(1)), "N-E");
  assert.equal(directionVue(lacet(2)), "S-E");
  assert.equal(directionVue(lacet(3)), "S-O");
  assert.equal(directionVue(lacet(4)), "N-O");
  assert.equal(directionVue(lacet(-1)), "S-O");
});

test("au repos, le N est en haut à droite (la vue est tournée de 45°)", () => {
  assert.ok(Math.abs(rotationNord(lacet(0)) - 45) < 1e-9);
  // Dans le SVG : le N est à droite du centre et au-dessus.
  const n = dessinerBoussole(rotationNord(lacet(0))).match(/<text x="([\d.]+)" y="([\d.]+)"[^>]*>N</);
  assert.ok(n);
  assert.ok(Number(n[1]) > 24 && Number(n[2]) < 24);
});

test("face au chemin du terrain (au sud, +z) : « S-O », et le haut de l'écran pointe bien vers le sud", () => {
  const l = lacet(-1);
  assert.equal(directionVue(l), "S-O");
  // Le haut de l'écran pointe vers (−cos lacet, −sin lacet) : vers +z (le sud) et −x (l'ouest).
  assert.ok(-Math.sin(l) > 0.7 && -Math.cos(l) < -0.7);
});

test("directionCourte : les huit directions, et les caps négatifs ou au-delà d'un tour", () => {
  assert.deepEqual([0, 45, 90, 135, 180, 225, 270, 315].map(directionCourte), ["N", "N-E", "E", "S-E", "S", "S-O", "O", "N-O"]);
  assert.equal(directionCourte(-45), "N-O");
  assert.equal(directionCourte(720 + 100), "E");
});

test("le cadran : N rouge plus gros que E, S, O, et le cran fixe en haut", () => {
  const svg = dessinerBoussole(0);
  assert.match(svg, /font-size="11.5"[^>]*fill="#c8362b"[^>]*>N</);
  for (const l of ["E", "S", "O"]) assert.match(svg, new RegExp(`font-size="8.5"[^>]*>${l}<`));
  assert.match(svg, /M20\.6 -1\.6 L27\.4 -1\.6 L24 3\.2 Z/);
});

test("Boussoles : ne redessine que si l'angle a bougé, et écrit la direction dans la légende", () => {
  const cadran = { innerHTML: "" } as HTMLElement;
  const legende = { textContent: "Vue" } as HTMLElement;
  const b = new Boussoles([cadran], legende);
  b.maj(lacet(0));
  assert.equal(legende.textContent, "N-O");
  cadran.innerHTML = "témoin";
  b.maj(lacet(0) + 1e-5);
  assert.equal(cadran.innerHTML, "témoin");
  b.maj(lacet(1));
  assert.notEqual(cadran.innerHTML, "témoin");
  assert.equal(legende.textContent, "N-E");
});

test("le nom tactile de l'action « tourner » est la boussole, plus le ⟳", () => {
  const touches = readFileSync(new URL("./touches.ts", import.meta.url), "utf8");
  assert.match(touches, /tourner: "la boussole"/);
  assert.doesNotMatch(readFileSync(new URL("./hud.ts", import.meta.url), "utf8"), /⟳/);
});
