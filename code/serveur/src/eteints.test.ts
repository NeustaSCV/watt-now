// Tests du lot 2 de l'É3 côté serveur : Éteints de la halte partagés, Éteints du terrain attirés par la signature.

import { test } from "node:test";
import assert from "node:assert/strict";
import { DUREE_VOYAGE_S, SORTIE_TERRAIN } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { Base } from "./base.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

function monter(alea = () => 0, inventaire: Record<string, number> = {}) {
  const base = new Base(":memory:");
  const halte = new Halte(base, alea);
  const compte = base.creerCompte("Rose", "potager42", "charbonniers");
  base.sauverInventaire(compte.id, inventaire);
  let instant = 1_000_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, alea);
  const attendre = (secondes: number, pas = 0.25) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      halte.tick(instant, pas);
      joueur.tick(pas);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  return { base, halte, joueur, attendre, dernier, recus };
}

test("sur son terrain, se promener n'attire personne", () => {
  const t = monter(() => 0);
  t.attendre(300, 1);
  assert.equal(t.joueur.bienvenue(0).eteints.length, 0);
});

test("un feu allumé finit par attirer un Éteint de la lisière ; il repart quand on prend la route", () => {
  const t = monter(() => 0, { pierre: 5, branche: 3, briquet: 1, buche: 4 });
  t.joueur.recevoir({ t: "construire_feu", x: 25, z: 28.5 });
  t.attendre(6);
  const feu = t.dernier("feu")!.feu;
  t.joueur.recevoir({ t: "interagir", cible: { genre: "feu", id: feu.id }, verbe: "allumer" });
  t.attendre(25, 0.5);
  const eteints = t.dernier("eteints")!.eteints;
  assert.equal(eteints.length, 1);
  // Il sort de la lisière et marche vers le feu.
  t.attendre(10, 0.5);
  const apres = t.dernier("eteints")!.eteints[0]!;
  assert.ok(Math.hypot(apres.x - 25, apres.z - 28.5) < Math.hypot(eteints[0]!.x - 25, eteints[0]!.z - 28.5));

  t.joueur.position = { x: SORTIE_TERRAIN.boite.x, z: SORTIE_TERRAIN.boite.z, o: 0 };
  t.joueur.recevoir({ t: "voyager", vers: "station" });
  t.attendre(DUREE_VOYAGE_S + 0.5);
  const b = t.dernier("bienvenue")!;
  assert.equal(b.lieu, "station");
  assert.ok(b.eteints.some((e) => e.etat === "dormant"), "la halte a ses dormants");
});

test("à la halte, les Éteints sont envoyés aux voyageurs, et un marcheur se fait repérer", () => {
  const t = monter(() => 0.5);
  t.joueur.position = { x: SORTIE_TERRAIN.boite.x, z: SORTIE_TERRAIN.boite.z, o: 0 };
  t.joueur.recevoir({ t: "voyager", vers: "station" });
  t.attendre(DUREE_VOYAGE_S + 0.5);
  // On marche jusqu'à un errant : (30, 41) au départ.
  t.joueur.position = { x: 24, z: 38, o: 0 };
  t.joueur.recevoir({ t: "intention", dx: 1, dz: 0, allure: "marche", seq: 1 });
  t.attendre(1);
  assert.ok(t.dernier("eteints")!.eteints.some((e) => e.etat === "poursuivant"));
});
