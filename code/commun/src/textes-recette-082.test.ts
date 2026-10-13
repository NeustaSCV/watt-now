// Les textes relevés par la recette de la 0.8.2 (plan 0.8.2 §7.6).

import { test } from "node:test";
import assert from "node:assert/strict";
import { LIEUX } from "./lieux.ts";
import { OBJETS } from "./objets.ts";
import { QUETES } from "./quetes.ts";

test("0.8.2 §7.6 : la quête du banc dit que la batterie se pose dans le banc", () => {
  const q = QUETES.find((x) => x.id === "panneau_pose")!;
  assert.match(q.texte, /batterie de la ruine dedans/);
  assert.ok(!/à côté/.test(q.texte));
});

test("0.8.2 §7.6 : la fiche de la station sur la carte ne dit pas ce qu'on y trouve (R18)", () => {
  assert.ok(!/atelier|boutique|pillé/i.test(LIEUX.station.description), LIEUX.station.description);
});

test("0.8.2 §7.6 : le pack de cellules ne dit plus qu'il se recharge au banc ; ni « clé », court", () => {
  const d = OBJETS.pack_cellules.description;
  assert.ok(!/recharge|banc|clé/i.test(d), d);
  assert.ok(d.length <= 90, d);
});
