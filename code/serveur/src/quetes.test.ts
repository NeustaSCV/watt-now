// Les quêtes après le tutoriel (Book 22) : « S'installer » et « Le métier », constatées par le serveur.

import { test } from "node:test";
import assert from "node:assert/strict";
import { COMPTOIR, DUREE_VOYAGE_S, SORTIES_STATION, SORTIE_TERRAIN } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import type { Famille } from "../../commun/src/regles.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

function monter(famille: Famille, inventaire: Record<string, number>, base = new Base(":memory:"), avant?: (base: Base, compteId: number) => void) {
  const compte = base.creerCompte("Rose", "potager42", famille);
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
  avant?.(base, compte.id);
  let instant = 1_000_000;
  const halte = new Halte(base, () => 0.5);
  halte.eteints = [];
  const comptoir = new Comptoir(base, instant);
  const recus: MessageServeur[] = [];
  const creer = () => new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 1, comptoir);
  const joueur = creer();
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      halte.tick(instant, pas);
      joueur.tick(pas);
    }
  };
  const carnet = () => recus.findLast((m) => m.t === "quetes") as Extract<MessageServeur, { t: "quetes" }> | undefined;
  const titres = () => carnet()?.quetes?.quetes.map((q) => q.titre) ?? [];
  const reussies = () => recus.flatMap((m) => (m.t === "quetes" ? (m.quetes?.reussies ?? []).map((r) => r.titre) : []));
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
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
  return { base, compte, joueur, comptoir, attendre, carnet, titres, reussies, dernier, allerAuGuichet, creer };
}

test("après le tutoriel, le carnet propose le métier et un objectif pour s'installer", () => {
  const t = monter("charbonniers", {});
  t.attendre(1);
  assert.deepEqual(t.titres(), ["La charbonnière", "Un vrai repas", "Le Comptoir du Carrefour"]);
  const q = t.carnet()!.quetes!.quetes[0]!;
  assert.equal(q.ligne, "metier");
  assert.match(q.recompense!, /10 wotts/);
});

test("pendant le tutoriel, pas de carnet de quêtes (le tutoriel a le sien)", () => {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Lou", "potager42", "voltaiques", true);
  const recus: MessageServeur[] = [];
  let instant = 1_000_000;
  const j = new Joueur(compte, base, (m) => recus.push(m), () => instant);
  instant += 1000;
  j.tick(1);
  assert.equal(recus.some((m) => m.t === "quetes"), false);
  assert.equal(j["vueQuetes"](), null);
});

test("manger un plat cuisiné réussit « Un vrai repas » et donne une conserve", () => {
  const t = monter("mecanistes", { pommes_cuites: 1 });
  t.attendre(1);
  t.joueur.recevoir({ t: "manger", objet: "pommes_cuites" });
  t.attendre(3);
  assert.ok(t.reussies().includes("Un vrai repas"));
  assert.equal(t.dernier("inventaire")!.inventaire.conserve, 1);
  assert.equal(t.titres()[1], "Un vrai lit");
});

test("ce qui est déjà fait compte : un ancien bien équipé enchaîne plusieurs objectifs d'un coup", () => {
  const t = monter("voltaiques", { gourdin: 1, pansement: 2, panneau_solaire: 1 });
  t.attendre(1);
  // Le panneau est dans le sac : « Le panneau de la station » est réussi, on passe à son installation.
  assert.ok(t.reussies().includes("Le panneau de la station"));
  assert.equal(t.titres()[0], "Installer le panneau");
});

test("la prime en wotts est versée sur le compte, prise sur la trésorerie des Compteurs", () => {
  const t = monter("charbonniers", {});
  t.attendre(1);
  const avant = t.comptoir.tresorerie;
  // Aller au Comptoir réussit « Le Comptoir du Carrefour » (ligne « Les autres »).
  t.allerAuGuichet();
  t.attendre(1);
  assert.ok(t.reussies().includes("Le Comptoir du Carrefour"));
  assert.equal(t.dernier("wotts")!.wotts.compte, 10);
  assert.equal(t.comptoir.tresorerie, avant - 10);
});

test("vendre une lame au Comptoir finit le métier des Charbonniers ; tout est gardé en base", () => {
  const t = monter("charbonniers", { lame_forgee: 1 });
  t.joueur["quetes"].etat.finies.push("charbonniere", "charbon");
  t.attendre(1);
  // La lame est déjà dans le sac : « Forger une lame » est réussi.
  assert.equal(t.titres()[0], "Le premier client");
  t.allerAuGuichet();
  t.joueur.recevoir({ t: "comptoir", op: { genre: "vendre", objet: "lame_forgee", quantite: 1 } });
  t.attendre(1);
  assert.ok(t.reussies().includes("Le premier client"));
  // Rechargé depuis la base : le métier est fini.
  t.joueur.sauvegarder();
  const etat = t.base.chargerQuetes(t.compte.id);
  assert.ok(etat.finies.includes("vendre_lame"));
  assert.equal(etat.faits["vente:lame_forgee"], 1);
});

test("la trésorerie vide fait attendre la prime, versée dès qu'elle se remplit", () => {
  const t = monter("mecanistes", {});
  t.attendre(1);
  const tresor = t.comptoir.tresorerie;
  assert.ok(t.comptoir.payer(tresor));
  t.allerAuGuichet();
  t.attendre(1);
  assert.ok(t.reussies().includes("Le Comptoir du Carrefour"));
  assert.equal(t.joueur["quetes"].etat.primes, 10);
  t.comptoir.encaisser(50);
  t.attendre(1);
  assert.equal(t.joueur["quetes"].etat.primes, 0);
  assert.equal(t.dernier("wotts")!.wotts.compte, 10);
});

test("le panneau déjà installé compte comme rapporté : on n'est pas bloqué", () => {
  const t = monter("voltaiques", {}, new Base(":memory:"), (base, id) => base.ajouterInstallation(id, "panneau_solaire", 20, 20, 0));
  t.attendre(1);
  assert.ok(t.reussies().includes("Le panneau de la station"));
  assert.ok(t.reussies().includes("Installer le panneau"));
  assert.equal(t.titres()[0], "Faire le plein");
});
