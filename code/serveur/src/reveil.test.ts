// Endormi dans l'abri, le bouton A dit « Se réveiller » et réveille (0.8.2, chantier K) : il envoie « annuler », que le
// serveur prend pour un réveil, comme bouger.

import { test } from "node:test";
import assert from "node:assert/strict";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { appliquerReglages } from "../../commun/src/reglages.ts";
import { LIBELLE_REVEIL, propositionsEndormi } from "../../client/src/interaction.ts";

appliquerReglages({ sommeil_rythme: 1 });

test("endormi dans l'abri, A « Se réveiller » (« annuler ») réveille sans bouger", () => {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "charbonniers");
  base.sauverInventaire(compte.id, { branche: 8, bache: 1, couteau: 1 });
  let instant = 1_000_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), () => 1, new Comptoir(base, instant));
  const attendre = (secondes: number, pas = 0.25) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  joueur.position = { x: 20, z: 20, o: 0 };
  joueur.recevoir({ t: "fabriquer", recette: "abri", x: 20, z: 21.8, o: 0 });
  attendre(61, 1);
  const abri = dernier("installation")!.installation;
  attendre(6 * 60, 5);
  joueur.recevoir({ t: "interagir", cible: { genre: "installation", id: abri.id }, verbe: "dormir" });
  attendre(3);
  assert.equal(dernier("sommeil")!.dort, true);
  attendre(10, 1);
  const position = { ...joueur.position };
  joueur.recevoir({ t: "annuler" });
  attendre(0.5);
  assert.equal(dernier("sommeil")!.dort, false, "réveillé");
  assert.ok(Math.hypot(joueur.position.x - position.x, joueur.position.z - position.z) < 0.01, "sans avoir bougé");
});

test("les propositions du dormeur : A « Se réveiller » envoie « annuler » ; B ne change pas", () => {
  const avant = { A: { libelle: "Dormir dans l'abri", message: { t: "interagir", cible: { genre: "installation", id: 1 }, verbe: "dormir" } }, B: { libelle: "Examiner", examiner: "Un abri." }, cible: { x: 0, z: 0 } } as const;
  const p = propositionsEndormi(avant);
  assert.equal(p.A!.libelle, LIBELLE_REVEIL);
  assert.equal(LIBELLE_REVEIL, "Se réveiller");
  assert.deepEqual("message" in p.A! ? p.A.message : null, { t: "annuler" });
  assert.equal(p.B, avant.B);
});
