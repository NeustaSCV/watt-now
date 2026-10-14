// La secousse de la caméra (0.10, chantier K : le cargo qui s'échoue au phare) : elle s'amortit et revient exactement à
// zéro ; elle ne joue pas quand le système demande de réduire les mouvements.

import { test } from "node:test";
import assert from "node:assert/strict";
import { SECOUSSE, Secousse, amplitudeSecousse } from "./secousse.ts";

test("la secousse s'amortit et revient exactement à zéro", () => {
  // L'amplitude décroît du début à la fin, et vaut zéro à la fin et après.
  let avant = Infinity;
  for (let t = 0; t < SECOUSSE.duree; t += 0.05) {
    const a = amplitudeSecousse(t);
    assert.ok(a <= avant && a >= 0);
    avant = a;
  }
  assert.equal(amplitudeSecousse(SECOUSSE.duree), 0);
  assert.equal(amplitudeSecousse(5), 0);
  const s = new Secousse(() => false);
  assert.deepEqual(s.avancer(0.016), { x: 0, y: 0, z: 0 }, "rien avant qu'on la lance");
  s.lancer();
  let max = 0;
  let total = 0;
  while (s.enCours && total < 5) {
    const d = s.avancer(1 / 60);
    total += 1 / 60;
    max = Math.max(max, Math.abs(d.x), Math.abs(d.z));
    // Jamais plus que sa force.
    assert.ok(Math.hypot(d.x, d.z) <= SECOUSSE.force * Math.SQRT2 + 1e-9);
  }
  assert.ok(max > SECOUSSE.force * 0.5, `elle se sent (${max.toFixed(2)} m)`);
  assert.ok(Math.abs(total - SECOUSSE.duree) < 0.05, `elle dure ${total.toFixed(2)} s`);
  // Revenue exactement à zéro, et elle y reste.
  assert.deepEqual(s.decalage, { x: 0, y: 0, z: 0 });
  assert.deepEqual(s.avancer(0.5), { x: 0, y: 0, z: 0 });
  // Arrêtée en cours de route : zéro tout de suite.
  s.lancer();
  s.avancer(0.1);
  s.arreter();
  assert.deepEqual(s.decalage, { x: 0, y: 0, z: 0 });
});

test("la secousse ne joue pas si le système demande de réduire les mouvements", () => {
  const s = new Secousse(() => true);
  s.lancer();
  assert.ok(!s.enCours);
  for (let i = 0; i < 30; i++) assert.deepEqual(s.avancer(1 / 60), { x: 0, y: 0, z: 0 });
});
