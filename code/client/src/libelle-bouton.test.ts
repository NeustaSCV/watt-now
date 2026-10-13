// Le bouton rond B ne déborde plus avec un texte long (plan 0.8.2 §7.6).

import { test } from "node:test";
import assert from "node:assert/strict";
import { LONGUEUR_MAX_B, MOT_MAX_B, libelleBoutonB, motLongB } from "./libelle-bouton.ts";

test("0.8.2 §7.6 : un libellé court reste tel quel sur le bouton B", () => {
  assert.equal(libelleBoutonB("Examiner"), "Examiner");
  assert.equal(libelleBoutonB("B"), "B");
});

test("0.8.2 §7.6 : un libellé long passe au verbe, sans le détail ; aucun mot trop long", () => {
  assert.equal(libelleBoutonB("Ramasser : 2 conserves"), "Ramasser");
  assert.equal(libelleBoutonB("Enseigner à Ampoulee2ff"), "Enseigner");
  assert.equal(libelleBoutonB("Prendre la radio (2 kg)"), "Prendre");
  for (const l of ["Ramasser : 2 conserves", "Enseigner à Ampoulee2ff", "Démonterlevieuxvélo", "Prendre la radio (2 kg)", "Remplir la gourde (au milieu)"]) {
    const c = libelleBoutonB(l);
    assert.ok(c.length <= LONGUEUR_MAX_B, `${l} → ${c}`);
    for (const m of c.split(/\s+/)) assert.ok(m.length <= MOT_MAX_B + 1, `${l} → ${m}`);
  }
});

test("0.8.2 §7.6 : un mot long prend un corps plus petit (plutôt que d'être coupé)", () => {
  assert.equal(motLongB("Ramasser"), true);
  assert.equal(motLongB("Enseigner"), true);
  assert.equal(motLongB("B"), false);
  assert.equal(motLongB("Pêcher"), false);
});
