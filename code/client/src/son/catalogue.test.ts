import { test } from "node:test";
import assert from "node:assert/strict";
import { SONS, fabriquer, type IdSon } from "./catalogue.ts";
import { FE } from "./dsp.ts";

const IDS = Object.keys(SONS) as IdSon[];

test("le catalogue couvre les familles de sons du Book 21 §6.3 (hors ambiances et Comptoir, faits par la musique)", () => {
  assert.ok(IDS.length >= 75, `${IDS.length} sons`);
  for (const prefixe of ["pas_herbe_", "pas_terre_", "pas_beton_", "pas_gravats_", "eteint_", "ui_charbonniers_", "ui_voltaiques_", "ui_mecanistes_"]) {
    assert.ok(IDS.some((id) => id.startsWith(prefixe)), prefixe);
  }
});

test("chaque variante est propre : ni muette, ni saturée, sans valeur invalide, de durée raisonnable", () => {
  for (const id of IDS) {
    for (let v = 0; v < SONS[id].variantes; v++) {
      const s = fabriquer(id, v);
      let max = 0;
      for (const x of s) {
        assert.ok(Number.isFinite(x), `${id}#${v} : valeur invalide`);
        max = Math.max(max, Math.abs(x));
      }
      assert.ok(max > 0.05, `${id}#${v} muet (crête ${max})`);
      assert.ok(max <= 0.96, `${id}#${v} sature (crête ${max})`);
      assert.ok(s.length / FE < 12, `${id}#${v} trop long`);
    }
  }
});

test("une variante est reproductible, et deux variantes diffèrent", () => {
  assert.deepEqual(fabriquer("eteint_rale", 2), fabriquer("eteint_rale", 2));
  assert.notDeepEqual(fabriquer("eteint_rale", 1), fabriquer("eteint_rale", 2));
});

test("les sons en boucle se referment sans saut", () => {
  for (const id of IDS.filter((i) => "boucle" in SONS[i] && SONS[i].boucle)) {
    const s = fabriquer(id, 0);
    const saut = Math.abs(s[0]! - s[s.length - 1]!);
    assert.ok(saut < 0.2, `${id} : saut de ${saut.toFixed(3)} à la jointure`);
  }
});

test("les Éteints s'entendent à la portée de leur état (Book 21 §6.3)", () => {
  assert.equal(SONS.eteint_souffle.portee, 3);
  assert.equal(SONS.eteint_rale.portee, 25);
  assert.equal(SONS.eteint_rale_rapide.portee, 30);
  assert.equal(SONS.eteint_rale.priorite, 1);
});
