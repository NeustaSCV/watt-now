// La première nuit (plan 0.8 §2.6, B14) : une bûche du terrain mise au feu quand il en reste moins de 6 fait avertir,
// une fois par nuit ; jamais au feu d'une halte ; une branche, jamais. L'avertissement est un message ordinaire, qui
// passe (le porteur, 2026-10-15 : plus de bandeau à bouton en jeu).

import { test } from "node:test";
import assert from "node:assert/strict";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { HEURE_FIN_NUIT, MS_PAR_HEURE_JEU, MS_PAR_JOUR_JEU } from "../../commun/src/temps.ts";
import { SEUIL_BUCHES, TEXTE_AVERTISSEMENT_BUCHE, avertirBuche, nuitDuJeu } from "../../commun/src/tutoriel.ts";
import { Base } from "./base.ts";
import { Joueur } from "./joueur.ts";
import { AvertissementBuche, buchesRestantes, type BucheAuFeu } from "./tutoriel-fin.ts";

/** Une bûche mise au feu, avec `restantes` bûches encore au terrain (au sol, le sac et les coffres vides). */
function auFeu(restantes: number, p: Partial<BucheAuFeu> = {}): BucheAuFeu {
  const ressources = Array.from({ length: restantes }, () => ({ type: "buche", disponibleLe: 0 }));
  return { lieu: "terrain", bois: "buche", inventaire: {}, ressources, installations: [], instant: 10 * MS_PAR_HEURE_JEU, debutMonde: 0, ...p };
}

test("une bûche au feu du terrain avec 5 bûches restantes déclenche l'avertissement, avec 6 non", () => {
  assert.equal(SEUIL_BUCHES, 6);
  const recus: MessageServeur[] = [];
  assert.equal(new AvertissementBuche().verifier(auFeu(5), (m) => recus.push(m)), true);
  assert.deepEqual(recus, [{ t: "info", texte: TEXTE_AVERTISSEMENT_BUCHE }], "un message qui passe, sans bouton");
  assert.equal(new AvertissementBuche().verifier(auFeu(6), (m) => recus.push(m)), false);
  assert.equal(recus.length, 1);
});

test("au feu d'une halte, jamais ; une branche, jamais", () => {
  for (const lieu of ["station", "gue", "cooperative", "moulin", "comptoir"]) {
    assert.equal(new AvertissementBuche().verifier(auFeu(0, { lieu }), () => assert.fail("pas d'avertissement")), false, lieu);
  }
  assert.equal(new AvertissementBuche().verifier(auFeu(0, { bois: "branche" }), () => assert.fail("pas pour une branche")), false);
});

test("une fois par nuit : la bûche suivante, la même nuit, se tait ; la nuit d'après, il revient", () => {
  const a = new AvertissementBuche();
  let n = 0;
  const compter = () => n++;
  const soir = 23 * MS_PAR_HEURE_JEU - 6 * MS_PAR_HEURE_JEU; // 23 h de jeu le premier jour (le monde part à 6 h)
  assert.ok(a.verifier(auFeu(3, { instant: soir }), compter));
  assert.ok(!a.verifier(auFeu(2, { instant: soir + MS_PAR_HEURE_JEU }), compter), "à minuit, même nuit");
  assert.ok(!a.verifier(auFeu(2, { instant: soir + 6 * MS_PAR_HEURE_JEU }), compter), "à 5 h, même nuit");
  assert.ok(a.verifier(auFeu(1, { instant: soir + MS_PAR_JOUR_JEU }), compter), "le lendemain soir");
  assert.equal(n, 2);
  // La nuit change à 5 h 30, le matin (le monde part à 6 h : le lendemain 5 h 30 tombe 23 h 30 de jeu plus tard).
  const matin = (24 - 6 + HEURE_FIN_NUIT) * MS_PAR_HEURE_JEU;
  assert.equal(nuitDuJeu(matin - 1, 0), nuitDuJeu(soir, 0));
  assert.equal(nuitDuJeu(matin, 0), nuitDuJeu(soir, 0) + 1);
  assert.equal(avertirBuche({ lieu: "terrain", bois: "buche", restantes: 5, nuit: 3, dejaAverti: 3 }), false);
  assert.equal(avertirBuche({ lieu: "terrain", bois: "buche", restantes: 5, nuit: 4, dejaAverti: 3 }), true);
});

test("les bûches restantes : au sol (encore là), dans le sac, dans les coffres", () => {
  const n = buchesRestantes({
    inventaire: { buche: 2 },
    ressources: [
      { type: "buche", disponibleLe: 0 },
      { type: "buche", disponibleLe: Number.MAX_SAFE_INTEGER },
      { type: "branche", disponibleLe: 0 },
    ],
    installations: [{ type: "coffre", etat: { contenu: { buche: 3 } } }, { type: "abri", etat: {} }],
    instant: 1000,
  });
  assert.equal(n, 2 + 1 + 3);
});

test("sur le terrain, mettre une bûche au feu quand il en reste peu envoie le message du carnet, une fois", () => {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "charbonniers");
  base.sauverInventaire(compte.id, { sac_a_dos: 1, buche: 3 });
  base.sauverFeu(compte.id, { id: 1, x: 21, z: 20, bois: 0, allume: false, majLe: base.debutMonde() });
  let instant = base.debutMonde() + 60_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, undefined, () => 0.99);
  joueur.position = { x: 20, z: 20, o: 0 };
  // Le terrain n'a plus que 2 bûches au sol : 2 + les 3 du sac.
  const ressources = (joueur as unknown as { ressources: Map<number, { type: string; disponibleLe: number }> }).ressources;
  let laissees = 0;
  for (const r of ressources.values()) if (r.type === "buche" && laissees++ >= 2) r.disponibleLe = Number.MAX_SAFE_INTEGER;
  const mettre = () => {
    joueur.recevoir({ t: "interagir", cible: { genre: "feu", id: 1 }, verbe: "ajouter_bois" });
    instant += 500;
    joueur.tick(0.5);
  };
  mettre();
  const avertis = () => recus.filter((m) => m.t === "info" && m.texte === TEXTE_AVERTISSEMENT_BUCHE);
  assert.equal(avertis().length, 1, "4 restantes : l'avertissement part");
  mettre();
  assert.equal(avertis().length, 1, "pas deux fois la même nuit");
});
