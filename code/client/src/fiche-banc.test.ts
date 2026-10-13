// 0.8.2, chantier C (R17) : la fiche du banc. La batterie du banc par son nom (jamais « grosse batterie »), son niveau,
// le bouton « Échanger » ; une ligne par chose qu'on porte et qui se charge, nommée, avec son niveau et « Charger » ;
// tout grisé quand la batterie du banc est vide ; jamais le mot « clé ».

import { test } from "node:test";
import assert from "node:assert/strict";
import type { InstallationVue } from "../../commun/src/messages.ts";
import { htmlFicheBanc } from "./fiche-banc.ts";

const banc = (wh: number | null, etat: InstallationVue["etat"] = {}): InstallationVue => ({
  id: 7,
  type: "banc_recharge",
  x: 0,
  z: 0,
  o: 0,
  etat: wh === null ? etat : { batteries: { batterie_voiture: 1 }, charges: { batterie_voiture: wh }, panneau: true, ...etat },
});

/** Les boutons « Charger » d'une fiche : leur cible, et s'ils sont actifs. */
function boutons(html: string): { cible: string; actif: boolean }[] {
  return [...html.matchAll(/<button type="button" data-charger="([^"]+)" ?(disabled)?>/g)].map((m) => ({ cible: m[1]!, actif: !m[2] }));
}

test("0.8.2 fiche du banc : la batterie nommée, une ligne par chose qui se charge, un bouton « Charger »", () => {
  const html = htmlFicheBanc(banc(180), { petite_batterie: 1, lampe_frontale: 1, "matraque_electrique#2": 1, couteau: 1 }, { petite_batterie: 20 }, { "matraque_electrique#2": 3 });
  assert.match(html, /La batterie de voiture de la ruine/);
  assert.match(html, /180 \/ 360 Wh/);
  assert.match(html, /La petite batterie de la frontale/);
  assert.match(html, /Matraque électrique ★★/);
  assert.match(html, /sa petite batterie/);
  assert.deepEqual(boutons(html), [
    { cible: "petite_batterie", actif: true },
    { cible: "matraque_electrique#2", actif: true },
  ]);
  // Sans autre batterie de voiture dans le sac, « Échanger » est grisé et la fiche dit pourquoi.
  assert.match(html, /data-banc="echanger" disabled/);
  assert.doesNotMatch(html, /grosse batterie|clé/i);
});

test("0.8.2 fiche du banc : batterie du banc vide, tout est grisé ; une chose pleine dit « Pleine »", () => {
  const vide = htmlFicheBanc(banc(0), { petite_batterie: 1 }, { petite_batterie: 10 }, {});
  assert.deepEqual(boutons(vide), [{ cible: "petite_batterie", actif: false }]);
  assert.match(vide, /Batterie du banc vide/);
  const pleine = htmlFicheBanc(banc(100), { petite_batterie: 1, batterie_voiture: 1 }, { petite_batterie: 50, batterie_voiture: 90 }, {});
  assert.match(pleine, /data-charger="petite_batterie" disabled>Pleine/);
  assert.match(pleine, /data-banc="echanger" >Échanger|data-banc="echanger" >/);
});

test("0.8.2 fiche du banc : sans batterie, on propose de brancher celle de la ruine", () => {
  const html = htmlFicheBanc(banc(null), { batterie_voiture: 1 }, { batterie_voiture: 180 }, {});
  assert.match(html, /Pas de batterie dans le banc/);
  assert.match(html, /data-verbe="poser_batteries" >Brancher/);
});
