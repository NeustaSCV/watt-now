// Les mesures du test familial (Book 17 §6).

import { test } from "node:test";
import assert from "node:assert/strict";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { ETAPES_ATTEINTES, PREFIXE_ATTEINT, bilanMetier, categorieAction, etapeDuLieu, ligneeDeLEtape, mesuresDuFait, mesuresFabrication, mesuresNaissance, objetsDeMetierDonnes, type GenreMesure } from "./mesures.ts";
import { MS_JOUR_CALENDRIER } from "../../commun/src/energie.ts";
import { nouvelEteint } from "../../commun/src/eteints.ts";
import { DUREE_VOYAGE_S, SORTIES_STATION, SORTIE_TERRAIN } from "../../commun/src/lieux.ts";

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
  // La naissance du personnage (plan 0.8, chantier 14) : `atteint:maison`, une fois ; puis la recette.
  assert.deepEqual(base.lireMesures("progression").map((m) => m.quoi), ["visite:terrain", "atteint:maison", "recette:corde"]);

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

// ---------- Les faits du niveau 1 (plan 0.8, chantier 14) ----------

test("niveau 1 : chaque lieu a son étape (maison, H1A, H1B, L1A, L1B) ; chaque étape de lignée, sa lignée", () => {
  assert.deepEqual(ETAPES_ATTEINTES, ["maison", "H1A", "H1B", "L1A", "L1B"]);
  assert.deepEqual(["terrain", "station", "gue", "cooperative", "moulin", "comptoir"].map(etapeDuLieu), ["maison", "H1A", "H1B", "L1A", "L1B", null]);
  assert.deepEqual(ligneeDeLEtape("foyer_cuisine"), { lignee: "feu", niveau: 3 });
  assert.deepEqual(ligneeDeLEtape("coffre_cercle"), { lignee: "coffre", niveau: 2 });
  assert.deepEqual(ligneeDeLEtape("etabli_etau"), { lignee: "etabli", niveau: 2 });
  assert.equal(ligneeDeLEtape("inconnue"), null);
});

test("niveau 1 : la première arrivée dans un lieu écrit `atteint:<étape>` (minutes de jeu), une fois ; chaque arrivée, `visite:<lieu>`", () => {
  const premiere = mesuresDuFait("visite:station", {}, 41.26);
  assert.deepEqual(premiere, { mesures: [{ quoi: "visite:station", valeur: 41.3 }, { quoi: `${PREFIXE_ATTEINT}H1A`, valeur: 41.3 }], faits: ["atteint:H1A"] });
  // Le fait `atteint:H1A` noté, la seconde arrivée n'écrit que la visite.
  assert.deepEqual(mesuresDuFait("visite:station", { "visite:station": 1, "atteint:H1A": 1 }, 90), { mesures: [{ quoi: "visite:station", valeur: 90 }], faits: [] });
  // Le Comptoir n'est pas une étape du niveau 1.
  assert.deepEqual(mesuresDuFait("visite:comptoir", {}, 50).faits, []);
  // La naissance : `atteint:maison`, une fois.
  assert.deepEqual(mesuresNaissance({}, 0).faits, ["atteint:maison"]);
  assert.deepEqual(mesuresNaissance({ "atteint:maison": 1 }, 12), { mesures: [], faits: [] });
});

test("niveau 1 : `vu:<clé>` à l'idée du premier ramassage, `niveau:<lignée>` à chaque montée, la fiche bloquée et l'aide « Je suis coincé »", () => {
  assert.deepEqual(mesuresDuFait("idee:foyer_cuisine", {}, 95).mesures, [{ quoi: "vu:grillage_rouleau", valeur: 95, details: { etape: "foyer_cuisine" } }]);
  assert.deepEqual(mesuresDuFait("idee:marmite", {}, 96).mesures, [{ quoi: "vu:cocotte_fonte", valeur: 96, details: { etape: "marmite" } }]);
  assert.deepEqual(mesuresDuFait("idee:forge", {}, 30).mesures[0]!.quoi, "vu:enclume_depanneur");
  assert.deepEqual(mesuresDuFait("niveau:abri_ferme", {}, 150).mesures, [{ quoi: "niveau:abri", valeur: 3, details: { etape: "abri_ferme", minutes: 150 } }]);
  assert.deepEqual(mesuresDuFait("foyer:foyer_pierres", {}, 20).mesures, [{ quoi: "niveau:feu", valeur: 2, details: { etape: "foyer_pierres", minutes: 20 } }]);
  assert.deepEqual(mesuresDuFait("fiche_bloquee:coffre", {}, 70).mesures, [{ quoi: "fiche_bloquee:coffre", valeur: 70 }]);
  // Rien de personnel : un type inconnu devient « ? ».
  assert.deepEqual(mesuresDuFait("fiche_bloquee:Jean Dupont", {}, 70).mesures, [{ quoi: "fiche_bloquee:?", valeur: 70 }]);
  assert.deepEqual(mesuresDuFait("aide_coince", {}, 71).mesures, [{ quoi: "aide_coince", valeur: 71 }]);
  // Les autres faits ne se mesurent pas ici.
  assert.deepEqual(mesuresDuFait("wotts_gagnes", {}, 10), { mesures: [], faits: [] });
});

test("niveau 1, en jeu : deux voyages à la station n'écrivent `atteint:H1A` qu'une fois ; reconnecté, la naissance n'est pas réécrite ; le compte supprimé garde sa vitesse, anonyme", () => {
  const base = new Base(":memory:");
  const halte = new Halte(base, () => 0.5);
  const compte = base.creerCompte("Rose", "potager42", "voltaiques");
  let instant = 1_000_000;
  const j = new Joueur(compte, base, () => {}, () => instant, halte, () => 0.5);
  const aller = (vers: "station" | "terrain") => {
    j.recevoir({ t: "voyager", vers });
    for (let s = 0; s < DUREE_VOYAGE_S + 0.5; s += 0.5) {
      instant += 500;
      halte.tick(instant, 0.5);
      j.tick(0.5);
    }
  };
  j.position = { x: SORTIE_TERRAIN.boite.x, z: SORTIE_TERRAIN.boite.z, o: 0 };
  aller("station");
  const atteint = () => base.lireMesures("progression").filter((m) => m.quoi.startsWith(PREFIXE_ATTEINT)).map((m) => m.quoi);
  assert.deepEqual(atteint(), ["atteint:maison", "atteint:H1A"]);
  // La valeur : les minutes de jeu depuis la création (le temps joué), ici le temps du voyage.
  const h1a = base.lireMesures("progression").find((m) => m.quoi === "atteint:H1A")!;
  assert.ok(h1a.valeur > 0 && h1a.valeur < 1, `${h1a.valeur}`);
  // Retour, puis un second voyage : une seconde visite, pas de second `atteint`.
  const versTerrain = SORTIES_STATION.find((x) => x.vers === "terrain")!.boite;
  j.position = { x: versTerrain.x, z: versTerrain.z, o: 0 };
  aller("terrain");
  j.position = { x: SORTIE_TERRAIN.boite.x, z: SORTIE_TERRAIN.boite.z, o: 0 };
  aller("station");
  assert.deepEqual(base.lireMesures("progression").filter((m) => m.quoi === "visite:station").length, 2);
  assert.deepEqual(atteint(), ["atteint:maison", "atteint:H1A"]);
  j.sauvegarder();
  const j2 = new Joueur(compte, base, () => {}, () => instant, halte, () => 0.5);
  void j2;
  assert.deepEqual(atteint(), ["atteint:maison", "atteint:H1A"], "reconnecté : la naissance n'est pas réécrite");
  // La suppression du compte garde la vitesse de progression (compte 0), et rien d'autre.
  base.supprimerCompte(compte.id);
  assert.deepEqual(atteint(), ["atteint:maison", "atteint:H1A"]);
  assert.deepEqual(base.lireMesures("progression").map((m) => m.quoi).sort(), ["atteint:H1A", "atteint:maison"]);
});

test("niveau 1, en jeu : le client signale la fiche bloquée et l'aide « Je suis coincé » (au plus une fois par 10 s)", () => {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "mecanistes");
  const j = new Joueur(compte, base, () => {}, () => 1_000_000, new Halte(base), () => 0.5);
  j.recevoir({ t: "constat", quoi: "fiche_bloquee", construction: "abri" });
  j.recevoir({ t: "constat", quoi: "aide_coince" });
  const constats = base.lireMesures("progression").filter((m) => m.quoi.startsWith("fiche") || m.quoi.startsWith("aide")).map((m) => m.quoi);
  assert.deepEqual(constats, ["fiche_bloquee:abri"]);
});
