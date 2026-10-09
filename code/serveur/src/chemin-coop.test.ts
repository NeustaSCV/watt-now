// 0.7.3 : la Coopérative est derrière la station-service, comme le Comptoir (le porteur du projet : « ça ne sert à
// rien de passer au Comptoir pour aller à la Coopérative »). Un chemin de terre part de la halte ; le portail de la
// Coopérative y ramène ; le chemin agricole du Carrefour et la brèche restent.

import { test } from "node:test";
import assert from "node:assert/strict";
import { ARRIVEE_COOP, BRECHE } from "../../commun/src/cooperative.ts";
import {
  CHEMIN_COOP_HALTE,
  DUREE_VOYAGE_S,
  KCAL_PAR_KM,
  SORTIES_COMPTOIR,
  SORTIES_COOP,
  SORTIES_STATION,
  ZONE_STATION,
  arriveeDans,
  distanceKm,
  heurte,
  sortieIci,
} from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Cooperatives } from "./cooperative.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

function monter(lieu: "station" | "cooperative" = "station", ou = arriveeDans(lieu, "terrain")) {
  const base = new Base(":memory:");
  const halte = new Halte(base);
  const comptoir = new Comptoir(base);
  let instant = 1_000_000;
  const cooperatives = new Cooperatives(base, () => 0.5, () => instant);
  const compte = base.creerCompte("Rose", "potager42", "mecanistes");
  base.sauverInventaire(compte.id, { sac_a_dos: 1 });
  base.sauverPosition(compte.id, ou, lieu, instant);
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 0.5, comptoir, cooperatives);
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
      cooperatives.tick(instant, pas);
    }
  };
  const bienvenue = () => recus.findLast((m) => m.t === "bienvenue") as Extract<MessageServeur, { t: "bienvenue" }>;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  const kcal = () => joueur.bienvenue(0).besoins.kcal;
  return { base, joueur, recus, attendre, bienvenue, infos, kcal };
}

const sortieStationCoop = SORTIES_STATION.find((s) => s.vers === "cooperative")!;

test("la station a une sortie vers la Coopérative : 2 km, comme le Comptoir", () => {
  assert.ok(sortieStationCoop, "une sortie de la halte mène à la Coopérative");
  assert.equal(distanceKm("station", "cooperative"), 2);
  assert.equal(distanceKm("station", "comptoir"), 2);
  assert.equal(distanceKm("terrain", "cooperative"), 5);
  // Le chemin part de la route vers le nord, dans la halte, et l'on y arrive sans rien heurter.
  const { arrivee, boite } = sortieStationCoop;
  assert.equal(boite.x, CHEMIN_COOP_HALTE.x);
  assert.ok(!heurte(ZONE_STATION, arrivee.x, arrivee.z, 0.35));
  assert.equal(sortieIci("station", arrivee.x, arrivee.z), null, "l'arrivée n'est pas déjà sur la sortie");
  assert.equal(sortieIci("station", boite.x, boite.z)?.vers, "cooperative");
});

test("station → Coopérative : tout droit, 120 kcal, arrivée au portail", () => {
  const t = monter("station");
  t.joueur.position = { x: sortieStationCoop.boite.x, z: sortieStationCoop.boite.z, o: 0 };
  const avant = t.kcal();
  t.joueur.recevoir({ t: "voyager", vers: "cooperative" });
  assert.deepEqual(t.recus.findLast((m) => m.t === "voyage"), { t: "voyage", de: "station", vers: "cooperative", duree: DUREE_VOYAGE_S });
  assert.ok(Math.abs(avant - t.kcal() - 2 * KCAL_PAR_KM) < 1, `${avant - t.kcal()} kcal`);
  t.attendre(DUREE_VOYAGE_S + 1);
  const b = t.bienvenue();
  assert.equal(b.lieu, "cooperative");
  assert.deepEqual({ x: b.position.x, z: b.position.z }, { x: ARRIVEE_COOP.x, z: ARRIVEE_COOP.z });
});

test("Coopérative → station par le portail : on arrive au bout du chemin, au nord de la route", () => {
  const t = monter("cooperative");
  const portail = SORTIES_COOP[0]!;
  t.joueur.position = { x: portail.boite.x, z: portail.boite.z, o: 0 };
  const avant = t.kcal();
  t.joueur.recevoir({ t: "voyager", vers: "terrain" });
  // Vers le terrain, l'étape est la station (et non plus le Carrefour).
  assert.deepEqual(t.recus.findLast((m) => m.t === "voyage"), { t: "voyage", de: "cooperative", vers: "station", duree: DUREE_VOYAGE_S });
  assert.ok(Math.abs(avant - t.kcal() - 2 * KCAL_PAR_KM) < 1);
  assert.match(t.infos().at(-1)!, /passe par la station-service/);
  t.attendre(DUREE_VOYAGE_S + 1);
  const b = t.bienvenue();
  assert.equal(b.lieu, "station");
  assert.deepEqual({ x: b.position.x, z: b.position.z }, { x: sortieStationCoop.arrivee.x, z: sortieStationCoop.arrivee.z });
});

test("le Carrefour reste accessible : par le portail, par la brèche, et depuis la station", () => {
  // Par le portail (le chemin agricole n'a pas disparu), 3 km
  const a = monter("cooperative");
  a.joueur.position = { x: SORTIES_COOP[0]!.boite.x, z: SORTIES_COOP[0]!.boite.z, o: 0 };
  const avant = a.kcal();
  a.joueur.recevoir({ t: "voyager", vers: "comptoir" });
  assert.equal((a.recus.findLast((m) => m.t === "voyage") as { vers: string }).vers, "comptoir");
  assert.ok(Math.abs(avant - a.kcal() - 3 * KCAL_PAR_KM) < 1);
  a.attendre(DUREE_VOYAGE_S + 1);
  assert.equal(a.bienvenue().lieu, "comptoir");
  // On arrive au Carrefour par le nord (le chemin agricole), et il y mène toujours.
  const cheminComptoir = SORTIES_COMPTOIR.find((s) => s.vers === "cooperative")!;
  assert.deepEqual(a.bienvenue().position, { ...cheminComptoir.arrivee });

  // Par la brèche, vers le Carrefour ; vers le terrain, il faut repasser le portail.
  const b = monter("cooperative");
  b.joueur.position = { x: BRECHE.x + 1.2, z: BRECHE.z, o: 0 };
  b.joueur.recevoir({ t: "voyager", vers: "terrain" });
  assert.ok(!b.recus.some((m) => m.t === "voyage"));
  assert.match(b.infos().at(-1)!, /sortie/);
  b.joueur.recevoir({ t: "voyager", vers: "comptoir" });
  assert.equal((b.recus.findLast((m) => m.t === "voyage") as { vers: string }).vers, "comptoir");

  // Depuis la station, le bout ouest de la route mène toujours au Carrefour ; le chemin de la Coopérative, non.
  const c = monter("station");
  c.joueur.position = { x: sortieStationCoop.boite.x, z: sortieStationCoop.boite.z, o: 0 };
  c.joueur.recevoir({ t: "voyager", vers: "comptoir" });
  assert.ok(!c.recus.some((m) => m.t === "voyage"));
  const ouest = SORTIES_STATION.find((s) => s.vers === "comptoir")!;
  c.joueur.position = { x: ouest.boite.x, z: ouest.boite.z, o: 0 };
  c.joueur.recevoir({ t: "voyager", vers: "comptoir" });
  c.attendre(DUREE_VOYAGE_S + 1);
  assert.equal(c.bienvenue().lieu, "comptoir");
});

test("rien de perdu : un joueur enregistré dans la Coopérative (ou en route vers elle) y revient au portail", () => {
  // Un voyage enregistre tout de suite la destination (voyager) : en route, on est déjà « dans » la Coopérative.
  const t = monter("cooperative");
  assert.equal(t.joueur.lieu, "cooperative");
  assert.deepEqual({ x: t.joueur.position.x, z: t.joueur.position.z }, { x: ARRIVEE_COOP.x, z: ARRIVEE_COOP.z });
});

test("se reconnecter à la halte près du chemin de la Coopérative ramène au pied du chemin (et non au bout ouest)", () => {
  const t = monter("station", { x: CHEMIN_COOP_HALTE.x + 1, z: 16, o: 0 });
  assert.deepEqual(t.joueur.position, { ...sortieStationCoop.arrivee });
  // Près du bout ouest, toujours le bout ouest.
  const ouest = SORTIES_STATION.find((s) => s.vers === "comptoir")!;
  assert.deepEqual(monter("station", { x: 10, z: 36, o: 0 }).joueur.position, { ...ouest.arrivee });
});
