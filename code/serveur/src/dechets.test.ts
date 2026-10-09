// Les déchets de l'Abondance (0.7), côté serveur : le Comptoir refuse les ordures, la conserve bombée rend malade, les
// déchets se démontent comme les autres vestiges.

import { test } from "node:test";
import assert from "node:assert/strict";
import { COMPTOIR, DUREE_VOYAGE_S, SORTIES_STATION, SORTIE_TERRAIN } from "../../commun/src/lieux.ts";
import type { MessageServeur, OperationComptoir } from "../../commun/src/messages.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

function monter(inventaire: Record<string, number>) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "mecanistes");
  base.sauverInventaire(compte.id, inventaire);
  base.sauverQuetes(compte.id, { faits: {}, finies: ["comptoir"], primes: 0 });
  let instant = 1_000_000;
  const halte = new Halte(base, () => 0.5);
  halte.eteints = [];
  const comptoir = new Comptoir(base, instant);
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 0.9, comptoir);
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      halte.tick(instant, pas);
      joueur.tick(pas);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  const allerAuGuichet = () => {
    joueur.position = { x: SORTIE_TERRAIN.boite.x, z: SORTIE_TERRAIN.boite.z, o: 0 };
    joueur.recevoir({ t: "voyager", vers: "comptoir" });
    attendre(DUREE_VOYAGE_S + 0.5);
    const est = SORTIES_STATION[1]!;
    joueur.position = { x: est.boite.x, z: est.boite.z, o: 0 };
    joueur.recevoir({ t: "voyager", vers: "comptoir" });
    attendre(DUREE_VOYAGE_S + 0.5);
    joueur.position = { x: COMPTOIR.guichet.x, z: COMPTOIR.guichet.z + 0.8, o: Math.PI };
  };
  const operer = (op: OperationComptoir) => joueur.recevoir({ t: "comptoir", op });
  return { joueur, attendre, dernier, infos, allerAuGuichet, operer };
}

test("le Comptoir ne reprend pas les ordures ; un sac de canettes, si", () => {
  const t = monter({ canette: 3, sac_canettes: 1, sac_a_dos: 1 });
  t.allerAuGuichet();
  // Le guichet affiche les ordures comme non rachetées.
  assert.equal(t.dernier("bienvenue")!.comptoir!.achats.canette, null);
  t.operer({ genre: "vendre", objet: "canette", quantite: 3 });
  assert.equal(t.infos().at(-1), "Les Compteurs ne reprennent pas les ordures.");
  t.operer({ genre: "vendre", objet: "sac_canettes", quantite: 1 });
  assert.match(t.infos().at(-1)!, /^Vendu : sac de canettes/);
  const inv = t.dernier("inventaire")!.inventaire;
  assert.equal(inv.canette, 3, "les canettes restent dans le sac");
  assert.equal(inv.sac_canettes, undefined);
});

test("la conserve bombée se mange, laisse sa boîte, et rend malade quelques minutes plus tard", () => {
  const t = monter({ conserve_bombee: 1, sac_a_dos: 1 });
  t.joueur["besoins"] = { kcal: 500, eau: 2, repos: 1 };
  t.joueur.recevoir({ t: "manger", objet: "conserve_bombee" });
  t.attendre(3);
  assert.equal(t.dernier("inventaire")!.inventaire.boite_vide, 1);
  assert.equal(t.joueur["sante"].intoxication?.champignon, "conserve_bombee");
  // Les symptômes arrivent deux minutes réelles plus tard.
  t.attendre(125, 1);
  assert.ok(t.infos().some((i) => /conserve bombée était avariée/.test(i)));
});

test("un déchet se démonte depuis le sac : un oreiller donne des plumes", () => {
  const t = monter({ oreiller_plumes: 1, sac_a_dos: 1, couteau: 1 });
  t.joueur.recevoir({ t: "demonter", objet: "oreiller_plumes" });
  t.attendre(6);
  const inv = t.dernier("inventaire")!.inventaire;
  assert.equal(inv.oreiller_plumes, undefined);
  assert.ok((inv.plumes ?? 0) >= 2);
  assert.equal(inv.chiffons, 1);
});
