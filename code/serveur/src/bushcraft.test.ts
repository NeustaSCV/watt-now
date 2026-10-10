// La gamme bushcraft, lot 1 (P-002, Book 02 §14 bis) : foyer Dakota, récupérateur de pluie, lit, alarme, protège-bras,
// boîte vide, travois, épieu.

import { test } from "node:test";
import assert from "node:assert/strict";
import { toutDevoile } from "../../commun/src/progression.ts";
import { armeEnMain } from "../../commun/src/combat.ts";
import { nouvelEteint } from "../../commun/src/eteints.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { meteo, pluieRecueillie } from "../../commun/src/meteo.ts";
import { capaciteDe, traineTravois } from "../../commun/src/objets.ts";
import { BONUS_LIT, DAKOTA, dormir } from "../../commun/src/survie.ts";
import { Base } from "./base.ts";
import { Joueur } from "./joueur.ts";

function monter(inventaire: Record<string, number>, avant?: (base: Base, id: number) => void, alea = () => 0.9) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "mecanistes");
  // Ces tests portent sur autre chose que l'arbre de progression : tout est dévoilé (plan 0.8 : le vétéran n'a plus
  // d'emblée que les recettes à la main).
  base.sauverProgression(compte.id, toutDevoile("mecanistes"));
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
  avant?.(base, compte.id);
  let instant = base.debutMonde() + 60_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, undefined, alea);
  joueur.position = { x: 20, z: 20, o: 0 };
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  const sauter = (ms: number) => (instant += ms);
  return { base, compte, joueur, attendre, dernier, infos, recus, sauter, maintenant: () => instant };
}

test("le foyer Dakota se creuse au bâton à fouir, sans pierres ; il brûle moins et se voit moins", () => {
  const t = monter({ branche: 3 });
  t.joueur.recevoir({ t: "construire_feu", x: 21.5, z: 20, dakota: true });
  assert.match(t.infos().at(-1)!, /bâton à fouir/);
  const u = monter({ branche: 3, baton_fouir: 1 });
  u.joueur.recevoir({ t: "construire_feu", x: 21.5, z: 20, dakota: true });
  u.attendre(8);
  const feu = u.dernier("feu")!.feu;
  assert.equal(feu.dakota, true);
  assert.equal(u.dernier("inventaire")!.inventaire.branche ?? 0, 0);
  assert.ok(DAKOTA.bois < 1 && DAKOTA.lumiere < 1 && DAKOTA.odeur < 1);
  // Gardé en base.
  assert.equal(u.base.chargerFeux(u.compte.id)[0]!.dakota, true);
});

test("le récupérateur se remplit quand il pleut, et sa pluie se boit sans bouillir", () => {
  // Une heure où il pleut, depuis le début du monde.
  const base = new Base(":memory:");
  const debut = base.debutMonde();
  let pluie = debut;
  while (meteo(pluie, debut).pluie < 1) pluie += 60_000;
  assert.ok(pluieRecueillie(pluie, pluie + 120_000, debut) > 0.5);
  assert.equal(pluieRecueillie(pluie, pluie + 3_600_000, debut), 5, "la bassine déborde à 5 L");

  const t = monter({ gourde: 1 }, (b, id) => b.ajouterInstallation(id, "recuperateur_pluie", 21, 20, 0));
  t.sauter(pluie - t.maintenant() + 600_000);
  t.attendre(6);
  const r = t.dernier("installation")!.installation;
  assert.equal(r.type, "recuperateur_pluie");
  assert.ok((r.etat.litres ?? 0) > 0.5, `de l'eau recueillie (${r.etat.litres} L)`);
  t.joueur.recevoir({ t: "interagir", cible: { genre: "installation", id: r.id }, verbe: "remplir_pluie" });
  t.attendre(4);
  const g = t.dernier("besoins")!.gourde;
  assert.equal(g.contenu, "potable");
  assert.ok(g.litres > 0.4);
});

test("le lit de branchages fait récupérer un tiers plus vite", () => {
  const b = { kcal: 2000, eau: 2, repos: 0.2 };
  const abri = dormir(b, 1, true).repos - 0.2;
  const abriEtLit = dormir(b, 1, true, true).repos - 0.2;
  assert.ok(Math.abs(abriEtLit / abri - BONUS_LIT) < 1e-9);
});

test("l'alarme tinte quand un Éteint passe tout près", () => {
  const t = monter({}, (b, id) => b.ajouterInstallation(id, "alarme_boites", 30, 30, 0));
  t.joueur["eteints"] = [nouvelEteint(1, 30.5, 30.5, "errant")];
  t.attendre(1);
  assert.ok(t.recus.some((m) => m.t === "alarme"));
  assert.ok(t.infos().some((i) => /boîtes de conserve tintent/.test(i)));
});

test("le protège-bras arrête une morsure sur deux", () => {
  const t = monter({ protege_bras: 1 }, undefined, () => 0.3);
  const e = nouvelEteint(1, 20, 20.6, "poursuivant");
  t.joueur["eteints"] = [e];
  t.attendre(5, 0.1);
  assert.ok(t.infos().some((i) => /glissé sur le protège-bras/.test(i)));
  assert.ok(!t.recus.some((m) => m.t === "morsure"), "aucune morsure n'est passée");
});

test("manger une conserve laisse sa boîte vide", () => {
  const t = monter({ conserve: 1 });
  t.joueur["besoins"] = { kcal: 500, eau: 2, repos: 1 };
  t.joueur.recevoir({ t: "manger", objet: "conserve" });
  t.attendre(3);
  assert.equal(t.dernier("inventaire")!.inventaire.boite_vide, 1);
});

test("le travois : 50 kg de plus, mais on ne court plus quand il est chargé ; l'épieu a la plus longue allonge", () => {
  assert.equal(capaciteDe({ sac_a_dos: 1, travois: 1 }), 105);
  assert.equal(traineTravois({ sac_a_dos: 1, travois: 1, pierre: 5 }), false);
  assert.equal(traineTravois({ sac_a_dos: 1, travois: 1, buche: 30 }), true);
  assert.equal(armeEnMain({ epieu: 1, gourdin: 1 }, "epieu").allonge, 2.3);
});
