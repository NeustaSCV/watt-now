// Les mesures du test familial (Book 17 §6).

import { test } from "node:test";
import assert from "node:assert/strict";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { bilanMetier, categorieAction, mesuresFabrication, objetsDeMetierDonnes, type GenreMesure } from "./mesures.ts";
import { MS_JOUR_CALENDRIER } from "../../commun/src/energie.ts";
import { nouvelEteint } from "../../commun/src/eteints.ts";
import { DUREE_VOYAGE_S, SORTIE_TERRAIN } from "../../commun/src/lieux.ts";

test("les activités sont rangées en grandes catégories", () => {
  assert.equal(categorieAction("Ramasser la branche"), "collecte");
  assert.equal(categorieAction("Démonter le vieux vélo"), "collecte");
  assert.equal(categorieAction("Faire un pansement"), "soins");
  assert.equal(categorieAction("Coffre de rangement"), "fabrication");
  assert.equal(categorieAction("Pédaler pour charger la batterie"), "énergie");
  assert.equal(categorieAction("Manger : pomme"), "nourriture et eau");
});

test("une fabrication laisse son temps et sa recette ; un effondrement, sa cause ; le client, ses images par seconde", () => {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "mecanistes");
  let instant = 10_000_000;
  const recus: MessageServeur[] = [];
  const j = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), () => 1, new Comptoir(base, instant));
  (j as unknown as { inventaire: Record<string, number> }).inventaire = { fibres: 4 };
  j.recevoir({ t: "fabriquer", recette: "corde" });
  for (let i = 0; i < 30; i++) {
    instant += 100;
    j.tick(0.1);
  }
  const activite = base.lireMesures("activite");
  assert.equal(activite[0]!.quoi, "fabrication");
  assert.ok(Math.abs(activite[0]!.valeur - 2) < 0.2, `${activite[0]!.valeur} s`);
  assert.deepEqual(base.lireMesures("progression").map((m) => m.quoi), ["recette:corde"]);

  (j as unknown as { effondrer: (r: string) => void }).effondrer("Ils sont trop nombreux.");
  assert.deepEqual(base.lireMesures("effondrement").map((m) => [m.famille, m.quoi]), [["mecanistes", "Ils sont trop nombreux."]]);

  j.recevoir({ t: "mesures", ips: 58.2, ipsBas: 41, appareil: "iPhone (tactile) 1170×2532", qualite: "moyen" });
  assert.deepEqual(base.lireMesures("client").map((m) => [m.quoi, m.valeur]), [["iPhone (tactile) 1170×2532", 58.2]]);
});

// ---------- Le métier des familles (Book 25 §10.1, chantier 9) ----------

test("métier : un objet de métier fabriqué se note avec ses étoiles ; un caillou, non", () => {
  assert.deepEqual(mesuresFabrication({ "machette_forgee#2": 1, pierre: 3 }), [{ quoi: "fabrique:machette_forgee", valeur: 2 }]);
  assert.deepEqual(mesuresFabrication({ arbalete: 2 }), [
    { quoi: "fabrique:arbalete", valeur: 3 },
    { quoi: "fabrique:arbalete", valeur: 3 },
  ]);
  assert.equal(objetsDeMetierDonnes({ carreau: 8, pierre: 4 }), 8, "les carreaux d'un Mécaniste");
  assert.equal(objetsDeMetierDonnes({ pack_cellules: 1, "machette_forgee#4": 1 }), 2);
  assert.equal(objetsDeMetierDonnes({ pierre: 4, branche: 2 }), 0);
});

test("métier : le bilan des critères de réussite de la 0.6", () => {
  const jour = MS_JOUR_CALENDRIER;
  const m = (instant: number, compteId: number, famille: string, genre: GenreMesure, quoi: string, valeur = 1) => ({ instant, compteId, famille, genre, quoi, valeur });
  const b = bilanMetier([
    m(0, 1, "charbonniers", "session", "connexion", 60),
    m(0, 2, "voltaiques", "session", "connexion", 60),
    m(0, 3, "mecanistes", "session", "connexion", 60),
    m(1.5 * jour, 1, "charbonniers", "metier", "fabrique:machette_forgee", 2),
    m(0.5 * jour, 1, "charbonniers", "metier", "fabrique:machette", 1),
    m(3 * jour, 2, "voltaiques", "metier", "fabrique:matraque_fortune", 1),
    m(jour, 3, "mecanistes", "metier", "tir:arbalete"),
    m(jour, 3, "mecanistes", "metier", "detruit:tir_plein"),
    m(jour, 1, "charbonniers", "metier", "tir:arc_simple"),
    m(jour, 1, "charbonniers", "metier", "detruit:tranchant"),
    m(2 * jour, 3, "mecanistes", "metier", "echange", 8),
    m(2 * jour, 3, "mecanistes", "metier", "fabrique:arbalete_lourde", 4),
    m(10, 1, "charbonniers", "activite", "combat", 10),
    m(10, 1, "charbonniers", "activite", "collecte", 90),
    m(10, 2, "voltaiques", "activite", "combat", 12),
    m(10, 2, "voltaiques", "activite", "collecte", 88),
  ]);
  assert.equal(b.joueurs, 3);
  assert.equal(b.tireurs, 2);
  assert.ok(Math.abs(b.partTireurs! - 2 / 3) < 1e-9);
  assert.equal(b.tirPlein, 1);
  assert.deepEqual(b.destructions, { tir_plein: 1, tranchant: 1 });
  assert.ok(Math.abs(b.armeDeMetier.charbonniers! - 1.5) < 1e-9, "la machette ★★ au bout d'un jour et demi");
  assert.equal(b.armeDeMetier.voltaiques, null, "la matraque ★ ne compte pas");
  assert.ok(Math.abs(b.armeDeMetier.mecanistes! - 2) < 1e-9, "l'arbalète lourde, au bout de deux jours");
  assert.equal(b.arbaletesLourdes, 1);
  assert.ok(Math.abs(b.ecartDefense! - 0.02) < 1e-9);
  assert.equal(b.defense.mecanistes, null);
  assert.ok(b.echangesParJoueurSemaine! > 0);
});

test("métier : détruire un Éteint au contact se note par type d'arme", () => {
  const base = new Base(":memory:");
  const halte = new Halte(base, () => 0.5);
  const compte = base.creerCompte("Rose", "potager42", "charbonniers");
  base.sauverInventaire(compte.id, { machette_forgee: 1 });
  let instant = 1_000_000;
  const j = new Joueur(compte, base, () => {}, () => instant, halte, () => 0.5);
  j.position = { x: SORTIE_TERRAIN.boite.x, z: SORTIE_TERRAIN.boite.z, o: 0 };
  j.recevoir({ t: "voyager", vers: "station" });
  for (let s = 0; s < DUREE_VOYAGE_S + 0.5; s += 0.5) {
    instant += 500;
    halte.tick(instant, 0.5);
    j.tick(0.5);
  }
  halte.eteints = [nouvelEteint(99, 40, 35.5, "poursuivant")];
  j.position = { x: 40, z: 34.6, o: 0 };
  j.recevoir({ t: "frapper", appuye: true });
  assert.equal(halte.eteints[0]!.etat, "detruit");
  assert.deepEqual(base.lireMesures("metier").map((m) => [m.famille, m.quoi]), [["charbonniers", "detruit:tranchant"]]);
});
