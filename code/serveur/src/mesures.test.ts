// Les mesures du test familial (Book 17 §6).

import { test } from "node:test";
import assert from "node:assert/strict";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { categorieAction } from "./mesures.ts";

test("les activités sont rangées en grandes catégories", () => {
  assert.equal(categorieAction("Ramasser la branche"), "collecte");
  assert.equal(categorieAction("Démonter le vieux vélo"), "collecte");
  assert.equal(categorieAction("Faire un pansement"), "soins");
  assert.equal(categorieAction("Coffre de rangement"), "fabrication");
  assert.equal(categorieAction("Pédaler pour charger la batterie"), "énergie");
  assert.equal(categorieAction("Manger : pomme"), "nourriture et eau");
});

test("une fabrication laisse son temps et sa recette ; un effondrement, sa cause ; le client, ses images par seconde", () => {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "mecanistes");
  let instant = 10_000_000;
  const recus: MessageServeur[] = [];
  const j = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), () => 1, new Comptoir(base, instant));
  (j as unknown as { inventaire: Record<string, number> }).inventaire = { fibres: 4 };
  j.recevoir({ t: "fabriquer", recette: "corde" });
  for (let i = 0; i < 30; i++) {
    instant += 100;
    j.tick(0.1);
  }
  const activite = base.lireMesures("activite");
  assert.equal(activite[0]!.quoi, "fabrication");
  assert.ok(Math.abs(activite[0]!.valeur - 2) < 0.2, `${activite[0]!.valeur} s`);
  assert.deepEqual(base.lireMesures("progression").map((m) => m.quoi), ["recette:corde"]);

  (j as unknown as { effondrer: (r: string) => void }).effondrer("Ils sont trop nombreux.");
  assert.deepEqual(base.lireMesures("effondrement").map((m) => [m.famille, m.quoi]), [["mecanistes", "Ils sont trop nombreux."]]);

  j.recevoir({ t: "mesures", ips: 58.2, ipsBas: 41, appareil: "iPhone (tactile) 1170×2532", qualite: "moyen" });
  assert.deepEqual(base.lireMesures("client").map((m) => [m.quoi, m.valeur]), [["iPhone (tactile) 1170×2532", 58.2]]);
});
