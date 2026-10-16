// Le message « trop lourd » (plan 0.8.2, chantier H ; recette 0.8) : il dit le poids de ce qu'on voulait prendre.

import { test } from "node:test";
import assert from "node:assert/strict";
import { texteTropLourd } from "./trop-lourd.ts";
import { OBJETS, poidsInventaire, type Inventaire } from "../../commun/src/objets.ts";

test("l'objet visé : son nom, son poids, puis le sac et sa capacité, et comment s'en sortir", () => {
  // Un sac à 50 kg (le sac à dos porte 55) : on vise un étau.
  const sac: Inventaire = { sac_a_dos: 1, batterie_voiture: 2 };
  const reste = 50 - poidsInventaire(sac);
  sac.pierre = Math.round(reste / OBJETS.pierre.poids);
  const porte = String(Math.round(poidsInventaire(sac) * 10) / 10).replace(".", ",");
  const [ligne, ...autres] = texteTropLourd(sac, 0, { etau: 1 });
  assert.equal(autres.length, 0);
  // « Étau d'établi, 9 kg : trop lourd, ton sac est à 50 kg sur 55. »
  assert.equal(ligne, `É${OBJETS.etau.nom.slice(1)}, ${String(OBJETS.etau.poids).replace(".", ",")} kg : trop lourd, ton sac est à ${porte} kg sur 55. Jette (Sac → Jeter) ou range dans un coffre.`);
  assert.match(porte, /^(49,5|50|50,5)$/);
});

test("plusieurs objets visés : leur liste et leur poids total", () => {
  const [ligne] = texteTropLourd({ sac_a_dos: 1, batterie_voiture: 3 }, 0, { buche: 2, pierre: 1 });
  const poids = String(Math.round((OBJETS.buche.poids * 2 + OBJETS.pierre.poids) * 10) / 10).replace(".", ",");
  assert.match(ligne!, new RegExp(`^2 ${OBJETS.buche.pluriel} et 1 ${OBJETS.pierre.nom}, ${poids} kg : trop lourd, ton sac est à [\\d,]+ kg sur 55\\.`));
});

test("sans sac : les poches, et le rappel du sac de fortune ; sans objet visé, la ligne d'avant", () => {
  const lignes = texteTropLourd({ pierre: 9 }, 0, { pierre: 1 });
  assert.match(lignes[0]!, /trop lourd, tes poches sont à [\d,]+ kg sur 10\./);
  assert.match(lignes[1]!, /sac de fortune/);
  assert.match(texteTropLourd({ sac_a_dos: 1, batterie_voiture: 3, pierre: 1 }, 0)[0]!, /^Ton sac est trop lourd \(\d+ kg sur 55\)/);
});
