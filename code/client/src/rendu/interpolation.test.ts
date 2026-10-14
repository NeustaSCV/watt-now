// 0.9, chantier B (plan-0.9 §3.1) : les autres joueurs montrés 150 ms en arrière, sans à-coups.

import { test } from "node:test";
import assert from "node:assert/strict";
import { FileGestes, HorlogeServeur, Interpolateur, RETARD_AFFICHAGE, clipDAllure } from "./interpolation.ts";

/** Un petit hasard reproductible (les mêmes paquets à chaque passage). */
function hasard(graine: number): () => number {
  let s = graine;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

test("à 2,4 m/s, la vitesse affichée reste entre 2,2 et 2,6 m/s, même avec des paquets irréguliers", () => {
  const h = hasard(7);
  // Les paquets du serveur : 100 ou 150 ms d'écart, mélangés ; l'heure du serveur a 5 s d'avance sur l'horloge locale,
  // et chaque paquet met 40 à 90 ms à arriver.
  const paquets: { h: number; x: number; arrivee: number }[] = [];
  for (let s = 0; s <= 2600; s += h() < 0.5 ? 100 : 150) paquets.push({ h: 5000 + s, x: 2.4 * (s / 1000), arrivee: s + 40 + 50 * h() });
  const horloge = new HorlogeServeur();
  const autre = new Interpolateur(0, 0, 0);
  let suivant = 0;
  let avant: number | null = null;
  const vitesses: number[] = [];
  for (let local = 0; local <= 2600; local += 1000 / 60) {
    while (suivant < paquets.length && paquets[suivant]!.arrivee <= local) {
      const p = paquets[suivant++]!;
      horloge.recaler(p.h, p.arrivee);
      autre.recevoir(p.h, p.x, 0, 0, 2);
    }
    const instant = horloge.heure(local);
    if (instant === null) continue;
    const e = autre.echantillon(instant);
    // On mesure sur 2 s, une fois le premier paquet passé à l'écran.
    if (avant !== null && local > 400) vitesses.push(((e.x - avant) / (1000 / 60)) * 1000);
    avant = e.x;
    if (local > 400) assert.equal(e.allure, 2);
  }
  assert.ok(vitesses.length > 100);
  for (const v of vitesses) assert.ok(v >= 2.2 && v <= 2.6, `vitesse affichée ${v.toFixed(2)} m/s`);
});

test("au-delà de 3 m d'écart, le personnage est posé directement", () => {
  const autre = new Interpolateur(0, 0, 0);
  autre.recevoir(1000, 0, 0, 0, 0);
  autre.recevoir(1100, 0.2, 0, 0, 2);
  autre.recevoir(1200, 5.2, 0, 0, 2);
  // Tout de suite, même avant que son heure soit affichée : aucun point entre les deux.
  for (let instant = 1200; instant <= 1600; instant += 10) assert.equal(autre.echantillon(instant).x, 5.2);
});

test("sans paquet, il continue 100 ms dans la même direction, puis s'arrête sur place, au repos", () => {
  const autre = new Interpolateur(0, 0, 0);
  for (let s = 0; s <= 1000; s += 100) autre.recevoir(s, 2.4 * (s / 1000), 0, 0, 2);
  const a = autre.echantillon(1000 + RETARD_AFFICHAGE + 50);
  assert.ok(Math.abs(a.x - 2.52) < 1e-9, `${a.x}`);
  assert.equal(a.allure, 2);
  for (const retard of [100, 200, 500, 3000]) {
    const e = autre.echantillon(1000 + RETARD_AFFICHAGE + retard);
    assert.ok(Math.abs(e.x - 2.64) < 1e-9, `${e.x}`);
    assert.equal(e.allure, 0);
    assert.equal(e.vitesse, 0);
  }
});

test("l'arrêt reçu (allure 0) : il finit son dernier pas en marchant, puis se tient au repos, sans prolonger", () => {
  const autre = new Interpolateur(0, 0, 0);
  autre.recevoir(0, 0, 0, 0, 2);
  autre.recevoir(100, 0.24, 0, 0, 2);
  autre.recevoir(200, 0.36, 0, 0, 0);
  assert.equal(autre.echantillon(150 + RETARD_AFFICHAGE).allure, 2);
  const fin = autre.echantillon(400 + RETARD_AFFICHAGE);
  assert.equal(fin.x, 0.36);
  assert.equal(fin.allure, 0);
});

test("immobile un moment puis repart : il ne glisse pas lentement depuis son ancien paquet", () => {
  const autre = new Interpolateur(0, 0, 0);
  autre.recevoir(0, 0, 0, 0, 0);
  autre.recevoir(5000, 0.24, 0, 0, 2);
  // Toujours à sa place une seconde avant de repartir.
  assert.equal(autre.echantillon(4000 + RETARD_AFFICHAGE).x, 0);
  assert.equal(autre.echantillon(4900 + RETARD_AFFICHAGE).x, 0);
  const e = autre.echantillon(4950 + RETARD_AFFICHAGE);
  assert.ok(Math.abs(e.vitesse - 2.4) < 1e-9);
});

test("l'allure reçue choisit le clip, sans dépendre de la vitesse", () => {
  assert.equal(clipDAllure(0, 2.4), null);
  // Freiné au gué ou chargé : il reste en marche, il marche lentement (il ne s'accroupit pas).
  assert.equal(clipDAllure(2, 0.8)?.nom, "Walk_Loop");
  assert.equal(clipDAllure(2, 4)?.nom, "Walk_Loop");
  assert.equal(clipDAllure(1, 3)?.nom, "Crouch_Fwd_Loop");
  assert.equal(clipDAllure(3, 1.5)?.nom, "Jog_Fwd_Loop");
  // La vitesse ne règle que la cadence.
  assert.ok(clipDAllure(2, 1.2)!.cadence < clipDAllure(2, 2.4)!.cadence);
});

test("un geste est joué à son heure, retard compris, et une seule fois", () => {
  const file = new FileGestes<{ h: number; geste: string }>();
  file.mettre({ h: 1100, geste: "esquive" });
  file.mettre({ h: 1000, geste: "frappe" });
  assert.deepEqual(file.sortir(1000 + RETARD_AFFICHAGE - 1), []);
  assert.deepEqual(file.sortir(1000 + RETARD_AFFICHAGE).map((g) => g.geste), ["frappe"]);
  assert.deepEqual(file.sortir(2000).map((g) => g.geste), ["esquive"]);
  assert.deepEqual(file.sortir(3000), []);
});

test("l'horloge se recale doucement, sans saut ; après une longue veille, d'un coup", () => {
  const horloge = new HorlogeServeur();
  assert.equal(horloge.heure(0), null);
  horloge.recaler(10_000, 0);
  assert.equal(horloge.heure(0), 10_000);
  // Les paquets arrivent désormais 200 ms plus tard : l'heure ne recule jamais, et n'avance pas d'un bond.
  let avant = horloge.heure(0)!;
  for (let local = 100; local <= 3000; local += 100) {
    horloge.recaler(10_000 + local - 200, local);
    const heure = horloge.heure(local)!;
    assert.ok(heure - avant >= 98 && heure - avant <= 102, `pas de ${heure - avant} ms`);
    avant = heure;
  }
  horloge.recaler(60_000, 3100);
  assert.equal(horloge.heure(3100), 60_000);
});
