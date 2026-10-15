// Tests du chantier 1 de la 0.8, côté serveur : le joueur fabrique selon le lieu de la recette (la forme du feu, la
// construction à son niveau), le refus nomme ce qui manque ; « plus tard » est refusé, pour une étape comme pour une
// recette ; Marteler 1 ne suffit plus pour Marteler 2.

import { test } from "node:test";
import assert from "node:assert/strict";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { toutDevoile } from "../../commun/src/progression.ts";
import { recette } from "../../commun/src/recettes.ts";
import type { Inventaire } from "../../commun/src/objets.ts";
import type { Famille } from "../../commun/src/regles.ts";
import { Base } from "./base.ts";
import { Joueur } from "./joueur.ts";

/** Un joueur sur son terrain, tout dévoilé, un feu posé à côté de lui (éteint, ou allumé, à ce niveau). */
function monter(inventaire: Inventaire, feu: { niveau?: number; dakota?: boolean; allume?: boolean } | null = null, famille: Famille = "mecanistes", forge = false) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", famille);
  base.sauverProgression(compte.id, toutDevoile(famille));
  if (forge) base.ajouterInstallation(compte.id, "forge", 21, 20, 0);
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
  if (feu) base.sauverFeu(compte.id, { id: 1, x: 21, z: 20, bois: 4, allume: feu.allume ?? true, majLe: base.debutMonde() + 60_000, ...(feu.niveau ? { niveau: feu.niveau } : {}), ...(feu.dakota ? { dakota: true } : {}) });
  let instant = base.debutMonde() + 60_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, undefined, () => 0.9);
  joueur.position = { x: 20, z: 20, o: 0 };
  const attendre = (secondes: number, pas = 0.25) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  const sac = () => base.chargerInventaire(compte.id);
  const fabriquer = (id: string, secondes = 10) => {
    joueur.recevoir({ t: "fabriquer", recette: id });
    attendre(secondes);
  };
  return { base, compte, joueur, attendre, infos, sac, fabriquer };
}

test("l'épieu se durcit au foyer de pierres : refusé près d'un feu de camp, en nommant ce qui manque", () => {
  const camp = monter({ branche: 2, couteau: 1 }, { niveau: 1 });
  camp.fabriquer("epieu");
  assert.equal(camp.infos().at(-1), "Il te faut un foyer de pierres.");
  assert.equal(camp.sac().epieu, undefined);
  assert.equal(camp.sac().branche, 2, "rien n'est pris");

  const pierres = monter({ branche: 2, couteau: 1 }, { niveau: 2 });
  pierres.fabriquer("epieu", 20);
  assert.equal(pierres.sac().epieu, 1, pierres.infos().join(" | "));
});

test("la poêlée se fait au Dakota, pas sur un feu de camp ; ni sur un feu éteint", () => {
  const camp = monter({ cepe: 3 }, { niveau: 1 });
  camp.fabriquer("cepes_poeles");
  assert.equal(camp.infos().at(-1), "Il te faut un foyer de pierres ou un foyer Dakota.");
  const dakota = monter({ cepe: 3 }, { dakota: true });
  dakota.fabriquer("cepes_poeles", 20);
  assert.equal(dakota.sac().cepes_poeles, 1, dakota.infos().join(" | "));
  // Un feu éteint ne cuit pas : on le dit.
  const eteint = monter({ cepe: 3 }, { niveau: 2, allume: false });
  eteint.fabriquer("cepes_poeles");
  assert.match(eteint.infos().at(-1)!, /allume ton foyer de pierres/);
});

test("une étape « plus tard » est refusée : le four de terre ne monte pas en poêle (0b)", () => {
  const t = monter({ pierre: 6, branche: 4 }, { niveau: 4, allume: false });
  t.joueur.recevoir({ t: "interagir", cible: { genre: "feu", id: 1 }, verbe: "ameliorer" });
  t.attendre(30);
  assert.equal(t.infos().at(-1), "Poêle : pas encore. Il faudra de l'argile, et du temps.");
  assert.equal(t.base.chargerFeux(t.compte.id)[0]!.niveau, 4);
  assert.equal(t.sac().pierre, 6);
});

test("une recette « plus tard » est refusée par le serveur", () => {
  const r = recette("corde")!;
  const avant = r.aVenir;
  r.aVenir = "niveau 2";
  try {
    const t = monter({ fibres: 6 });
    t.fabriquer("corde");
    assert.equal(t.infos().at(-1), `${r.nom} : plus tard. Ce qui lui manque est à trouver plus loin.`);
    assert.equal(t.sac().corde, undefined);
  } finally {
    if (avant === undefined) delete r.aVenir;
    else r.aVenir = avant;
  }
});

test("Marteler 1 ne suffit plus pour Marteler 2 : à la forge, la pierre ne remplace plus le marteau", () => {
  const pierre = monter({ barre_metal: 1, charbon_bois: 1, pierre: 1 }, null, "charbonniers", true);
  pierre.fabriquer("pinces_forge");
  assert.match(pierre.infos().at(-1)!, /marteler \(niveau 2\), il te faut marteau/);
  assert.equal(pierre.sac().pinces_forge, undefined);
  const marteau = monter({ barre_metal: 1, charbon_bois: 1, marteau: 1 }, null, "charbonniers", true);
  marteau.fabriquer("pinces_forge", 30);
  assert.equal(marteau.sac().pinces_forge, 1, marteau.infos().join(" | "));
});
