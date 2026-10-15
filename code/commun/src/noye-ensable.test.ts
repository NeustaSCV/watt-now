// Le Noyé et l'Ensablé (0.10, chantier G ; plan 0.10 §3.5, S-31 à S-33) : leurs règles, sans serveur.

import { test } from "node:test";
import assert from "node:assert/strict";
import { ARMES, NAUSEE, SANTE_DEPART, ENDURANCE_RECUPERATION, nauseeux, prendreLaNausee, recuperationEndurance } from "./combat.ts";
import {
  REVEIL_ENSABLE,
  VITESSE_NOYE,
  briserJambe,
  encaisser,
  eteintsDePlaces,
  noyesQuiCrevent,
  nouvelEteint,
  odeurDeCrevaison,
  penser,
  vue,
  type Eteint,
  type Humain,
} from "./eteints.ts";
import { ZONE_STATION } from "./lieux.ts";
import { stimuliJoueur } from "./signature.ts";

const marteau = ARMES.find((a) => a.objet === "marteau")!;
const hache = ARMES.find((a) => a.objet === "hache")!;
const de = { x: 9, z: 10 };
const noye = (etat: Eteint["etat"] = "poursuivant"): Eteint => Object.assign(nouvelEteint(1, 10, 10, etat), { variante: "noye" as const });

test("un coup au torse ne fait pas tomber le Noyé, alors qu'il fait tomber un Errant", () => {
  const errant = nouvelEteint(2, 10, 10, "poursuivant");
  const n = noye();
  // Le marteau fait 0,8 au torse : l'Errant tombe au quatrième coup (3 points).
  const surErrant = Array.from({ length: 4 }, () => encaisser(errant, marteau, false, 1, de, ZONE_STATION));
  assert.equal(surErrant.at(-1), "a_terre");
  for (let i = 0; i < 12; i++) assert.notEqual(encaisser(n, marteau, false, 1, de, ZONE_STATION), "a_terre", `coup ${i + 1}`);
  assert.equal(n.etat, "poursuivant");
  // Même appuyé au torse, avec une arme qui ne tue pas à la tête.
  const couteau = ARMES.find((a) => a.objet === "couteau")!;
  for (let i = 0; i < 6; i++) assert.notEqual(encaisser(n, couteau, true, 1, de, ZONE_STATION), "a_terre");
});

test("un coup appuyé à la tête détruit le Noyé comme un Errant", () => {
  assert.equal(encaisser(nouvelEteint(2, 10, 10, "poursuivant"), hache, true, 1, de, ZONE_STATION), "detruit");
  const n = noye();
  assert.equal(encaisser(n, hache, true, 1, de, ZONE_STATION), "detruit");
  assert.equal(n.etat, "detruit");
});

test("la jambe brisée : le Noyé rampe, reste un Noyé, et un coup l'achève", () => {
  const n = noye();
  briserJambe(n);
  assert.equal(n.variante, "noye");
  assert.equal(vue(n).rampe, true);
  assert.equal(encaisser(n, marteau, false, 1, de, ZONE_STATION), "detruit");
  // Les autres deviennent des Rampants, comme avant.
  const e = nouvelEteint(2, 10, 10, "poursuivant");
  briserJambe(e);
  assert.equal(e.variante, "rampant");
});

test("le Noyé ne dépasse jamais 0,4 m/s, même en poursuite", () => {
  const n = noye("errant");
  const h: Humain = { id: 1, x: 18, z: 10, discret: false, eclaire: false };
  for (let t = 0; t < 1; t += 0.05) penser(n, 0.05, [], [h], [n], false, ZONE_STATION, () => 0.5);
  assert.equal(n.etat, "poursuivant");
  const x0 = n.x;
  for (let i = 0; i < 100; i++) penser(n, 0.05, [], [h], [n], false, ZONE_STATION, () => 0.5);
  assert.ok(n.x - x0 <= VITESSE_NOYE * 5 + 1e-6, `${(n.x - x0).toFixed(2)} m en 5 s`);
  assert.ok(n.x - x0 > VITESSE_NOYE * 5 * 0.9);
});

test("détruit, il crève une seule fois ; son odeur attire un Errant à 15 m", () => {
  const n = noye();
  encaisser(n, hache, true, 1, de, ZONE_STATION);
  const errant = nouvelEteint(2, 25, 10, "errant");
  const eteints = [n, errant];
  const creves = noyesQuiCrevent(eteints);
  assert.deepEqual(creves.map((e) => e.id), [1]);
  assert.deepEqual(noyesQuiCrevent(eteints), [], "une seule fois");
  // Un Errant détruit ne crève pas.
  const autre = nouvelEteint(3, 0, 0, "poursuivant");
  encaisser(autre, hache, true, 1, de, ZONE_STATION);
  assert.deepEqual(noyesQuiCrevent([autre]), []);
  // L'odeur seule (personne d'autre) : l'Errant à 15 m vient voir.
  const odeur = odeurDeCrevaison(n);
  for (let t = 0; t < 30; t += 0.1) penser(errant, 0.1, [odeur], [], eteints, false, ZONE_STATION, () => 0.5);
  assert.ok(Math.hypot(errant.x - n.x, errant.z - n.z) < 3, `il est venu (${Math.hypot(errant.x - n.x, errant.z - n.z).toFixed(1)} m)`);
});

test("la nausée dure 30 s, et l'endurance revient deux fois moins vite", () => {
  const t0 = 1_000_000;
  const s = prendreLaNausee(SANTE_DEPART, t0);
  assert.equal(nauseeux(SANTE_DEPART, t0), false);
  assert.equal(nauseeux(s, t0 + 29_900), true);
  assert.equal(nauseeux(s, t0 + NAUSEE.dureeMs), false);
  assert.equal(recuperationEndurance(s, t0 + 10_000), ENDURANCE_RECUPERATION / 2);
  assert.equal(recuperationEndurance(s, t0 + 31_000), ENDURANCE_RECUPERATION);
  // Une partie d'avant (sans le champ) se relit telle quelle.
  const ancienne = JSON.parse(JSON.stringify(SANTE_DEPART));
  assert.equal(recuperationEndurance(ancienne, t0), ENDURANCE_RECUPERATION);
});

test("l'Ensablé reste couché jusqu'à 2 m, même quand on fait du bruit ; à moins de 2 m, il surgit", () => {
  const [e] = eteintsDePlaces([{ n: 7, x: 10, z: 10, variante: "ensable" }]);
  assert.equal(e!.etat, "dormant");
  assert.equal(e!.dormeur, true);
  const passe = (x: number): Humain => ({ id: 1, x, z: 10, discret: false, eclaire: false });
  // On marche (et on démonte) à 2,5 m puis à 2 m : il dort, sans remuer (pas d'éveil à montrer : il est caché).
  for (const x of [12.5, 10 + REVEIL_ENSABLE]) {
    for (let t = 0; t < 10; t += 0.1) penser(e!, 0.1, stimuliJoueur({ x, z: 10, allure: "course", bouge: true, action: "outil", lumiere: null, nuit: false }), [passe(x)], [e!], false, ZONE_STATION, () => 0.5);
    assert.equal(e!.etat, "dormant", `à ${(x - 10).toFixed(1)} m`);
    assert.equal(vue(e!).eveil, undefined);
  }
  // À 1,9 m : il surgit, et poursuit (au ras du sol).
  for (let t = 0; t < 0.5; t += 0.1) penser(e!, 0.1, [], [passe(11.9)], [e!], false, ZONE_STATION, () => 0.5);
  assert.equal(e!.etat, "poursuivant");
});

test("eteintsDePlaces : chacun chez lui ; le Noyé erre ; un coup achève l'Ensablé (un Rampant)", () => {
  const liste = eteintsDePlaces(
    [
      { n: 1, x: 1, z: 2, variante: "noye" },
      { n: 2, x: 3, z: 4, o: 1, variante: "ensable" },
    ],
    (x, z) => ({ x: x + 100, z }),
  );
  assert.deepEqual(liste.map((e) => [e.id, e.x, e.z, e.etat, e.variante]), [
    [1, 101, 2, "errant", "noye"],
    [2, 103, 4, "dormant", "ensable"],
  ]);
  assert.deepEqual(liste[0]!.maison, { x: 101, z: 2 });
  assert.equal(encaisser(liste[1]!, marteau, false, 1, { x: 102, z: 4 }, ZONE_STATION), "detruit");
});
