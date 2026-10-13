// La vue d'ensemble à l'arrivée (0.8.2, chantier G ; R4, Q2) : seul, la pause jusqu'au premier geste ; dans une halte,
// pas de pause, mais à l'abri des coups jusqu'au premier geste (au plus 15 s) ; rien à une reconnexion sur place.

import { test } from "node:test";
import assert from "node:assert/strict";
import { PROTECTION_ARRIVEE_MS, modeArrivee } from "../../commun/src/arrivee.ts";
import { nouvelEteint } from "../../commun/src/eteints.ts";
import { DUREE_VOYAGE_S, SORTIES_STATION, SORTIE_TERRAIN } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { Base } from "./base.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

function monter(base = new Base(":memory:"), halte = new Halte(base, () => 0.5), pseudo = "Rose") {
  const compte = base.creerCompte(pseudo, "potager42", "charbonniers");
  let instant = 1_000_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 0.5);
  const attendre = (secondes: number, pas = 0.05) => {
    for (let s = 0; s < secondes - 1e-9; s += pas) {
      instant += pas * 1000;
      halte.tick(instant, pas);
      joueur.tick(pas);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const voyager = (vers: "station" | "terrain") => {
    const sortie = vers === "station" ? SORTIE_TERRAIN : SORTIES_STATION[0]!;
    joueur.position = { x: sortie.boite.x, z: sortie.boite.z, o: 0 };
    joueur.recevoir({ t: "voyager", vers });
    attendre(DUREE_VOYAGE_S + 0.1, 0.5);
  };
  return { base, halte, compte, joueur, attendre, dernier, voyager, recus };
}

test("les lieux à soi attendent en pause, les haltes à l'abri", () => {
  assert.equal(modeArrivee("terrain"), "pause");
  assert.equal(modeArrivee("cooperative"), "pause");
  assert.equal(modeArrivee("moulin"), "pause");
  assert.equal(modeArrivee("station"), "abri");
  assert.equal(modeArrivee("comptoir"), "abri");
  assert.equal(modeArrivee("gue"), "abri");
});

test("seul, de retour sur le terrain : vue d'ensemble et pause ; le premier geste lève la pause", () => {
  const t = monter();
  t.voyager("station");
  t.joueur.recevoir({ t: "arrivee" });
  t.voyager("terrain");
  const b = t.dernier("bienvenue")!;
  assert.equal(b.lieu, "terrain");
  assert.deepEqual(b.arrivee, { mode: "pause", protection: 0 });
  assert.equal(t.joueur.enPause(), true);
  // Le monde attend : la faim ne bouge pas.
  const kcal = t.joueur.bienvenue(0).besoins.kcal;
  t.attendre(30, 0.5);
  assert.equal(t.joueur.bienvenue(0).besoins.kcal, kcal);
  // Aucun message « pause » : le client montre la vue d'ensemble, pas le voile de la pause.
  assert.ok(!t.recus.some((m) => m.t === "pause"));
  t.joueur.recevoir({ t: "arrivee" });
  assert.equal(t.joueur.enPause(), false);
  t.attendre(30, 0.5);
  assert.ok(t.joueur.bienvenue(0).besoins.kcal < kcal);
});

test("un client qui n'envoie pas « arrivee » (d'avant la 0.8.2) sort de la pause dès qu'il bouge", () => {
  const t = monter();
  t.voyager("station");
  t.voyager("terrain");
  assert.equal(t.joueur.enPause(), true);
  // Une intention de repos, un ping, les mesures : pas un geste.
  t.joueur.recevoir({ t: "intention", dx: 0, dz: 0, allure: "marche", seq: 1 });
  t.joueur.recevoir({ t: "ping", envoye: 1 });
  assert.equal(t.joueur.enPause(), true);
  const avant = { ...t.joueur.position };
  t.joueur.recevoir({ t: "intention", dx: 0, dz: -1, allure: "marche", seq: 2 });
  assert.equal(t.joueur.enPause(), false);
  t.attendre(1);
  assert.notDeepEqual(t.joueur.position, avant, "le geste compte : il avance");
});

test("pas de vue d'ensemble à une reconnexion sur place", () => {
  const t = monter();
  t.voyager("station");
  // Il se reconnecte : un nouveau joueur, relu en base, à la station.
  const recus: MessageServeur[] = [];
  const j = new Joueur(t.compte, t.base, (m) => recus.push(m), () => 2_000_000, t.halte);
  const b = j.bienvenue(0);
  assert.equal(b.lieu, "station");
  assert.equal(b.arrivee, undefined);
  assert.equal(j.enPause(), false);
});

test("dans une halte : pas de pause ; immobile et à l'abri des coups jusqu'au premier geste", () => {
  const t = monter();
  t.voyager("station");
  const b = t.dernier("bienvenue")!;
  assert.deepEqual(b.arrivee, { mode: "abri", protection: PROTECTION_ARRIVEE_MS });
  assert.equal(t.joueur.enPause(), false, "le monde ne s'arrête pas pour les autres");
  // Un Éteint au contact : il ne peut pas le saisir.
  t.joueur.position = { x: 40, z: 34.6, o: 0 };
  t.halte.eteints = [nouvelEteint(99, 40, 35.5, "poursuivant")];
  const avant = { ...t.joueur.position };
  t.attendre(4);
  assert.equal(t.halte.eteints[0]!.saisit, null);
  assert.ok(!t.recus.some((m) => m.t === "morsure"));
  assert.deepEqual(t.joueur.position, avant, "il n'a rien demandé : il ne bouge pas");
  // Son premier geste : il redevient saisissable.
  t.joueur.recevoir({ t: "arrivee" });
  t.attendre(1);
  assert.equal(t.halte.eteints[0]!.saisit, t.compte.id);
});

test("dans une halte, la protection ne dure pas plus de 15 s (on ne s'en sert pas pour fuir)", () => {
  const t = monter();
  t.voyager("station");
  t.joueur.position = { x: 40, z: 34.6, o: 0 };
  t.halte.eteints = [nouvelEteint(99, 40, 35.5, "poursuivant")];
  t.attendre(PROTECTION_ARRIVEE_MS / 1000 - 1);
  assert.equal(t.halte.eteints[0]!.saisit, null);
  t.attendre(2);
  assert.equal(t.halte.eteints[0]!.saisit, t.compte.id);
});

test("à plusieurs dans une halte : l'arrivée de l'un n'arrête pas le monde de l'autre", () => {
  const base = new Base(":memory:");
  const halte = new Halte(base, () => 0.5);
  const a = monter(base, halte, "Rose");
  const b = monter(base, halte, "Malo");
  a.voyager("station");
  a.joueur.recevoir({ t: "arrivee" });
  b.voyager("station");
  assert.equal(b.dernier("bienvenue")!.arrivee?.mode, "abri");
  assert.equal(a.joueur.enPause(), false);
  assert.equal(b.joueur.enPause(), false);
  // L'Éteint saisit celui qui joue, pas celui qui vient d'arriver.
  a.joueur.position = { x: 40, z: 34.6, o: 0 };
  b.joueur.position = { x: 60, z: 34.6, o: 0 };
  halte.eteints = [nouvelEteint(99, 40, 35.5, "poursuivant"), nouvelEteint(98, 60, 35.5, "poursuivant")];
  a.attendre(1);
  assert.equal(halte.eteints[0]!.saisit, a.compte.id);
  assert.equal(halte.eteints[1]!.saisit, null);
});
