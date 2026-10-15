// L'idée de l'escabeau (0.10.1, A1) : le constat « arbre_haut » du client (A devant un fruitier mûr sans escabeau) est
// accepté, noté comme fait, et dévoile la recette de l'escabeau, même juste après un autre constat de l'interface.

import { test } from "node:test";
import assert from "node:assert/strict";
import { Base } from "./base.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { messageValide } from "./controle.ts";

test("le constat « arbre_haut » passe le contrôle ; un « quoi » inconnu, non", () => {
  assert.ok(messageValide({ t: "constat", quoi: "arbre_haut" }));
  assert.ok(!messageValide({ t: "constat", quoi: "arbre_bas" }));
});

test("viser un fruitier mûr sans escabeau : la recette de l'escabeau se dévoile", () => {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "charbonniers", false);
  let instant = 1_000_000;
  const joueur = new Joueur(compte, base, () => {}, () => instant, new Halte(base), () => 1);
  const devoilees = () => joueur.bienvenue(0).progression!.devoilees;
  assert.ok(!devoilees().includes("escabeau"));
  // Une fiche bloquée ouverte juste avant ne doit pas avaler le constat du fruitier (chacun son délai).
  joueur.recevoir({ t: "constat", quoi: "fiche_bloquee", construction: "abri" });
  joueur.recevoir({ t: "constat", quoi: "arbre_haut" });
  for (let s = 0; s < 2; s += 0.25) {
    instant += 250;
    joueur.tick(0.25);
  }
  assert.ok(devoilees().includes("escabeau"));
  // Répété aussitôt, il n'est compté qu'une fois (un par 10 s).
  joueur.recevoir({ t: "constat", quoi: "arbre_haut" });
  const faits = (joueur as unknown as { quetes: { etat: { faits: Record<string, number> } } }).quetes.etat.faits;
  assert.equal(faits.arbre_haut, 1);
});
