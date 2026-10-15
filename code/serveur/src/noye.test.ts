// Le Noyé crève dans un lieu vivant (0.10, chantier G ; S-32) : la nausée à moins de 1,5 m, l'odeur d'une minute qui
// attire un Errant à 15 m ; côté joueur, l'endurance qui revient deux fois moins vite pendant 30 s.

import { test } from "node:test";
import assert from "node:assert/strict";
import { ARMES, ENDURANCE_RECUPERATION, SANTE_DEPART } from "../../commun/src/combat.ts";
import { eteintsDePlaces, encaisser } from "../../commun/src/eteints.ts";
import { ZONE_STATION } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { Base } from "./base.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { LieuVivant, type DefinitionLieuVivant, type Voyageur } from "./lieu-vivant.ts";

const hache = ARMES.find((a) => a.objet === "hache")!;

/** Un lieu d'essai : un Noyé en (20, 20), un Errant à 15 m de lui. */
function lieu() {
  const definition: DefinitionLieuVivant = {
    cle: "essai-noye",
    sacs: { lieu: "essai-noye", terrainDe: 0 },
    zone: ZONE_STATION,
    eteints: () =>
      eteintsDePlaces([
        { n: 1, x: 20, z: 20, variante: "noye" },
        { n: 2, x: 35, z: 20 },
      ]),
    ressources: () => [],
    version: 1,
  };
  return new LieuVivant(new Base(":memory:"), definition, () => 0.5);
}

/** Un voyageur immobile et discret (on ne l'entend ni ne le voit de loin), qui note ses éclaboussures. */
function voyageur(id: number, x: number, z: number) {
  const eclabousse: number[] = [];
  const v: Voyageur & { eclabousse: number[] } = {
    eclabousse,
    envoyer: (_m: MessageServeur) => {},
    stimuli: () => [],
    humain: () => ({ id, x, z, discret: true, eclaire: false }),
    eclabousser: (instant) => eclabousse.push(instant),
  };
  return v;
}

test("le Noyé crève : à 1 m, la nausée ; à 2 m, rien ; une seule fois", () => {
  const l = lieu();
  const pres = voyageur(1, 21, 20);
  const loin = voyageur(2, 20, 22);
  l.entrer(pres);
  l.entrer(loin);
  const t0 = 1_000_000;
  l.tick(t0, 0.1);
  const noye = l.eteints.find((e) => e.id === 1)!;
  assert.equal(encaisser(noye, hache, true, 1, { x: 21, z: 20 }, l.definition.zone), "detruit");
  l.tick(t0 + 100, 0.1);
  l.tick(t0 + 200, 0.1);
  assert.deepEqual(pres.eclabousse, [t0 + 100]);
  assert.deepEqual(loin.eclabousse, []);
  // L'odeur reste une minute au point de sa mort.
  assert.equal(l.bruitEnCours("noye:1", t0 + 59_000), true);
  assert.equal(l.bruitEnCours("noye:1", t0 + 61_000), false);
});

test("l'odeur du Noyé crevé attire l'Errant à 15 m", () => {
  const l = lieu();
  // Le joueur s'est éloigné (à 30 m, discret, immobile) : seule l'odeur compte.
  l.entrer(voyageur(1, 20, 50));
  const t0 = 1_000_000;
  l.tick(t0, 0.1);
  const noye = l.eteints.find((e) => e.id === 1)!;
  encaisser(noye, hache, true, 1, { x: 21, z: 20 }, l.definition.zone);
  let instant = t0;
  for (let i = 0; i < 400; i++) l.tick((instant += 100), 0.1);
  const errant = l.eteints.find((e) => e.id === 2)!;
  assert.ok(Math.hypot(errant.x - 20, errant.z - 20) < 3, `il est venu (${Math.hypot(errant.x - 20, errant.z - 20).toFixed(1)} m)`);
  // Sans le Noyé crevé, il serait resté là.
  const temoin = lieu();
  temoin.entrer(voyageur(1, 20, 50));
  instant = t0;
  for (let i = 0; i < 400; i++) temoin.tick((instant += 100), 0.1);
  const seul = temoin.eteints.find((e) => e.id === 2)!;
  assert.ok(Math.hypot(seul.x - 20, seul.z - 20) > 8);
});

test("éclaboussé, le joueur a la nausée 30 s : la pastille, et l'endurance revient deux fois moins vite", () => {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "charbonniers");
  base.sauverSante(compte.id, { ...SANTE_DEPART }, 20);
  let instant = 1_000_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base, () => 0), () => 0);
  const attendre = (secondes: number) => {
    for (let s = 0; s < secondes - 1e-9; s += 0.25) {
      instant += 250;
      joueur.tick(0.25);
    }
  };
  const sante = () => recus.findLast((m) => m.t === "sante") as Extract<MessageServeur, { t: "sante" }>;
  attendre(1);
  const avant = sante().endurance;
  joueur.eclabousser(instant);
  assert.equal(sante().sante.nauseeux, true);
  assert.ok(recus.some((m) => m.t === "info" && /nausée/.test(m.texte)));
  attendre(2);
  const pendant = sante().endurance - avant;
  assert.ok(Math.abs(pendant - ENDURANCE_RECUPERATION) <= 1, `+${pendant} en 2 s (au lieu de ${2 * ENDURANCE_RECUPERATION})`);
  attendre(29);
  assert.notEqual(sante().sante.nauseeux, true, "passée au bout de 30 s");
});
