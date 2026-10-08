// Tests du tutoriel (É5, Book 14 §4.2) : la progression suit ce que fait le joueur ; la saisie est sans danger.

import { test } from "node:test";
import assert from "node:assert/strict";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { TUTORIEL_NEUF } from "../../commun/src/tutoriel.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

function monter(etape = 0, inventaire?: Record<string, number>) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "charbonniers", true);
  if (etape > 0) base.sauverTutoriel(compte.id, { ...TUTORIEL_NEUF, etape });
  if (inventaire) base.sauverInventaire(compte.id, inventaire);
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
  return { base, compte, joueur, attendre, dernier, recus };
}

test("un nouveau joueur commence le tutoriel ; essayer les trois allures valide l'arrivée", () => {
  const t = monter();
  assert.equal(t.joueur.bienvenue(0).tutoriel!.titre, "L'arrivée");
  for (const allure of ["discrete", "marche", "course"] as const) {
    t.joueur.recevoir({ t: "intention", dx: 1, dz: 0, allure, seq: 1 });
    t.attendre(2.5);
  }
  t.joueur.recevoir({ t: "intention", dx: 0, dz: 0, allure: "marche", seq: 2 });
  t.attendre(1);
  const v = t.dernier("tutoriel")!.tutoriel!;
  assert.equal(v.etape, 1);
  assert.equal(v.titre, "Ramasser");
  assert.match(v.lecon!, /cercle/);
});

test("un compte de test (créé sans tutoriel) n'a pas de carnet", () => {
  const base = new Base(":memory:");
  const c = base.creerCompte("Malo", "potager42", "mecanistes");
  const j = new Joueur(c, base, () => {}, () => 0, new Halte(base), () => 1, new Comptoir(base, 0));
  assert.equal(j.bienvenue(0).tutoriel, null);
});

test("étape 8 : un Éteint sort de la lisière ; le détruire à la tête valide l'étape", () => {
  const t = monter(7, { hache: 1 });
  t.attendre(1);
  const e = t.dernier("eteints")!.eteints[0]!;
  assert.ok(e, "l'Éteint du tutoriel arrive");
  t.joueur.position = { x: e.x, z: e.z + 1, o: Math.PI };
  t.joueur.recevoir({ t: "frapper", appuye: true });
  t.attendre(1);
  assert.equal(t.dernier("tutoriel")!.tutoriel!.titre, "La saisie");
});

test("étape 9 : la saisie scénarisée ne mord jamais, et lâche toute seule", () => {
  const t = monter(8);
  t.attendre(1);
  assert.equal(t.dernier("sante")?.saisi ?? 1, 1);
  t.attendre(8);
  assert.ok(!t.recus.some((m) => m.t === "morsure"), "aucune morsure");
  assert.equal(t.dernier("tutoriel")!.tutoriel!.titre, "La famille");
});

test("on peut passer le tutoriel", () => {
  const t = monter();
  t.joueur.recevoir({ t: "tutoriel_passer" });
  assert.equal(t.dernier("tutoriel")!.tutoriel, null);
  assert.equal(t.base.chargerTutoriel(t.compte.id), null);
});

test("étape « Ramasser » : le carnet compte les branches et les pierres au fil du ramassage", () => {
  const t = monter(1);
  const carnet = () => t.dernier("tutoriel")!.tutoriel!;
  const ressources = t.joueur.bienvenue(0).ressources;
  t.attendre(1);
  assert.deepEqual(carnet().progres, [
    { libelle: "Branches", fait: 0, but: 3 },
    { libelle: "Pierres", fait: 0, but: 5 },
  ]);
  for (const b of ressources.filter((r) => r.type === "branche").slice(0, 2)) {
    t.joueur.position = { x: b.x, z: b.z, o: 0 };
    t.joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: b.id }, verbe: "ramasser" });
    t.attendre(2);
  }
  assert.deepEqual(carnet().progres?.[0], { libelle: "Branches", fait: 2, but: 3 });
});
