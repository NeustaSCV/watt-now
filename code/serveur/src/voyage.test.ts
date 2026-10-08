// Tests du lot 1 de l'É3 : sorties, voyage sur la carte, halte partagée de la station-service.

import { test } from "node:test";
import assert from "node:assert/strict";
import { avancer, type Position } from "../../commun/src/deplacement.ts";
import { DUREE_VOYAGE_S, SORTIES_STATION, SORTIE_TERRAIN, STATION, ZONE_STATION } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { Base } from "./base.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

function monter(base = new Base(":memory:"), halte = new Halte(base), pseudo = "Rose", inventaire?: Record<string, number>) {
  const compte = base.creerCompte(pseudo, "potager42", "voltaiques");
  if (inventaire) base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
  let instant = 1_000_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte);
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  const allerA = (x: number, z: number) => (joueur.position = { x, z, o: 0 });
  const partirVersStation = () => {
    allerA(SORTIE_TERRAIN.boite.x, SORTIE_TERRAIN.boite.z);
    joueur.recevoir({ t: "voyager", vers: "station" });
    attendre(DUREE_VOYAGE_S + 0.5);
  };
  return { base, halte, compte, joueur, attendre, dernier, infos, allerA, partirVersStation, recus };
}

test("on ne prend la route que depuis la sortie, et le trajet coûte des calories", () => {
  const t = monter();
  t.joueur.recevoir({ t: "voyager", vers: "station" });
  assert.match(t.infos().at(-1)!, /sortie/);

  const avant = t.joueur.bienvenue(0).besoins.kcal;
  t.allerA(SORTIE_TERRAIN.boite.x, SORTIE_TERRAIN.boite.z);
  t.joueur.recevoir({ t: "voyager", vers: "station" });
  assert.deepEqual(t.dernier("voyage"), { t: "voyage", de: "terrain", vers: "station", duree: DUREE_VOYAGE_S });
  // 3 km à pied ≈ 180 kcal
  assert.ok(avant - t.joueur.bienvenue(0).besoins.kcal >= 180);
  t.attendre(DUREE_VOYAGE_S + 0.5);
  const b = t.dernier("bienvenue")!;
  assert.equal(b.lieu, "station");
  assert.deepEqual({ x: b.position.x, z: b.position.z }, { x: SORTIES_STATION[0]!.arrivee.x, z: SORTIES_STATION[0]!.arrivee.z });
  assert.ok(b.ressources.some((r) => r.type === "panneau_auvent"));
  assert.equal(b.feux.length, 0);
});

test("à la halte : on démonte le panneau solaire, mais on ne construit rien", () => {
  const t = monter(undefined, undefined, "Rose", { couteau: 1, buche: 4, branche: 6, pierre: 5, briquet: 1 });
  t.partirVersStation();
  const panneau = t.dernier("bienvenue")!.ressources.find((r) => r.type === "panneau_auvent")!;
  t.allerA(panneau.x, panneau.z + 1);
  t.joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: panneau.id }, verbe: "demonter" });
  t.attendre(26);
  assert.equal(t.dernier("inventaire")!.inventaire.panneau_solaire, 1);

  t.joueur.recevoir({ t: "fabriquer", recette: "etabli", x: panneau.x, z: panneau.z + 3, o: 0 });
  assert.match(t.infos().at(-1)!, /sur ton terrain/);
  t.joueur.recevoir({ t: "construire_feu", x: 30, z: 30 });
  assert.match(t.infos().at(-1)!, /Pas de feu ici/);
});

test("la halte est partagée : ce qu'un voyageur prend disparaît pour l'autre", () => {
  const base = new Base(":memory:");
  const halte = new Halte(base);
  const a = monter(base, halte, "Rose");
  const b = monter(base, halte, "Malo");
  a.partirVersStation();
  b.partirVersStation();
  const rayon = a.dernier("bienvenue")!.ressources.find((r) => r.type === "rayonnage")!;
  a.allerA(rayon.x, rayon.z - 1);
  a.joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: rayon.id }, verbe: "fouiller" });
  a.attendre(7);
  assert.equal(a.dernier("inventaire")!.inventaire.conserve, 3);
  assert.deepEqual(b.dernier("ressource"), { t: "ressource", id: rayon.id, disponible: false });
  // Après la déconnexion, on ne reçoit plus rien de la halte.
  b.joueur.partir();
  assert.equal(halte.nombrePresents, 1);
});

test("par la sortie est, on rejoint le Carrefour ; par la sortie ouest, on rentre chez soi", () => {
  const t = monter();
  t.partirVersStation();
  const est = SORTIES_STATION[1]!;
  t.allerA(est.boite.x, est.boite.z);
  t.joueur.recevoir({ t: "voyager", vers: "comptoir" });
  t.attendre(DUREE_VOYAGE_S + 0.5);
  assert.equal(t.dernier("bienvenue")!.lieu, "comptoir");
  t.joueur.position = { x: 2, z: 26, o: 0 };
  t.joueur.recevoir({ t: "voyager", vers: "station" });
  t.attendre(DUREE_VOYAGE_S + 0.5);
  assert.equal(t.dernier("bienvenue")!.lieu, "station");

  const ouest = SORTIES_STATION[0]!;
  t.allerA(ouest.boite.x, ouest.boite.z);
  t.joueur.recevoir({ t: "voyager", vers: "terrain" });
  t.attendre(DUREE_VOYAGE_S + 0.5);
  const b = t.dernier("bienvenue")!;
  assert.equal(b.lieu, "terrain");
  assert.equal(b.position.z, SORTIE_TERRAIN.arrivee.z);
});

test("une déconnexion en route fait arriver à destination ; on revient à l'entrée de la halte", () => {
  const t = monter();
  t.allerA(SORTIE_TERRAIN.boite.x, SORTIE_TERRAIN.boite.z);
  t.joueur.recevoir({ t: "voyager", vers: "station" });
  t.attendre(2);
  t.joueur.sauvegarder();
  t.joueur.partir();
  const retour = new Joueur(t.compte, t.base, () => {}, () => 0, t.halte);
  assert.equal(retour.lieu, "station");
  assert.equal(retour.position.x, SORTIES_STATION[0]!.arrivee.x);
});

test("on ne traverse pas la boutique de la station", () => {
  const devant: Position = { x: STATION.boutique.x, z: STATION.boutique.z - STATION.boutique.p / 2 - 1, o: 0 };
  let p = devant;
  for (let i = 0; i < 40; i++) p = avancer(p, { dx: 0, dz: 1, allure: "marche" }, 0.05, ZONE_STATION);
  assert.ok(p.z < STATION.boutique.z - STATION.boutique.p / 2);
  // Et on glisse le long du mur quand on y va de biais.
  const glisse = avancer({ ...p }, { dx: 0.7, dz: 0.7, allure: "marche" }, 0.5, ZONE_STATION);
  assert.ok(glisse.x > p.x);
});
