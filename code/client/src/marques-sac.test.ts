// Les marques du sac (plan 0.8.2, chantier H, R6) : l'arme en main au combat est marquée même sans choix du joueur ;
// le sac à dos porté aussi.

import { test } from "node:test";
import assert from "node:assert/strict";
import { armeMarquee, sacPorte } from "./marques-sac.ts";
import { armeEnMain } from "../../commun/src/combat.ts";
import type { CleObjet } from "../../commun/src/etoiles.ts";

test("sans choix du joueur, la marque va à l'arme que le combat prend d'office (la meilleure du sac)", () => {
  const inv = { couteau: 1, gourdin: 1, sac_a_dos: 1, conserve: 2 };
  assert.equal(armeMarquee(inv, null), "gourdin");
  assert.equal(armeMarquee(inv, null), armeEnMain(inv, null).objet, "la même que celle du serveur");
});

test("la marque suit l'arme équipée : le choix du joueur passe avant la meilleure", () => {
  const inv = { couteau: 1, gourdin: 1 };
  assert.equal(armeMarquee(inv, "couteau"), "couteau");
  // L'arme choisie est perdue (cassée, jetée) : la marque revient à celle que le combat prendra.
  assert.equal(armeMarquee({ gourdin: 1 }, "couteau"), "gourdin");
  // Rien pour se battre : pas de marque (les poings).
  assert.equal(armeMarquee({ conserve: 1, sac_a_dos: 1 }, null), null);
});

test("un exemplaire étoilé : la marque va à la bonne case", () => {
  const inv = { "lame_forgee#4": 1, lame_forgee: 1, couteau: 1 } as Record<CleObjet, number>;
  assert.equal(armeMarquee(inv, null), "lame_forgee#4", "la meilleure, ★★★★");
  assert.equal(armeMarquee(inv, "lame_forgee" as CleObjet), "lame_forgee");
});

test("le sac sur le dos est marqué : le sac à dos, ou le sac de fortune, ou rien (les poches)", () => {
  assert.equal(sacPorte({ sac_a_dos: 1, couteau: 1 }), "sac_a_dos");
  assert.equal(sacPorte({ sac_fortune: 1 }), "sac_fortune");
  assert.equal(sacPorte({ sac_fortune: 1, sac_a_dos: 1 }), "sac_a_dos", "le plus grand compte");
  assert.equal(sacPorte({ couteau: 1 }), null);
});

test("dans le sac, la case de l'arme prise d'office et celle du sac à dos portent leur marque", async () => {
  // Le HUD donne ces classes aux cases : « equipee » (⚔) et « portee » (✓), et le style les dessine toutes les deux.
  const { readFileSync } = await import("node:fs");
  const hud = readFileSync(new URL("./hud.ts", import.meta.url), "utf8");
  assert.match(hud, /t === armeEnMainCombat \? "equipee" : t === surLeDos \? "portee"/);
  const css = readFileSync(new URL("./style.css", import.meta.url), "utf8");
  assert.match(css, /\.case\.equipee::after,\s*#hud \.sac \.case\.portee::after/);
});
