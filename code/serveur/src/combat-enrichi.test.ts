// Étape 0.5e (Book 23 §4) : le combat, enrichi. Le type de dégât contre le casque, l'usure et la réparation, B selon
// la situation (repousser), les nouvelles armes, les leurres du décor.

import { test } from "node:test";
import assert from "node:assert/strict";
import { ARMES, REPOUSSER, SEUIL_ABIMEE, armeEnMain, etatArme } from "../../commun/src/combat.ts";
import { KLAXONS_PAR_BATTERIE, LEURRES } from "../../commun/src/cooperative.ts";
import { encaisser, nouvelEteint, type Eteint } from "../../commun/src/eteints.ts";
import { DUREE_VOYAGE_S, SORTIE_TERRAIN, ZONE_STATION, arriveeDans, SORTIES_COMPTOIR } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { RECETTES } from "../../commun/src/recettes.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Cooperatives } from "./cooperative.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

const arme = (objet: string) => ARMES.find((a) => a.objet === objet)!;
const equipe = (x = 0, z = 0): Eteint => {
  const e = nouvelEteint(1, x, z, "poursuivant");
  e.variante = "equipe";
  return e;
};

test("0.5e : le casque — le tranchant glisse à la tête, le contondant passe ; au sol, seuls le contondant et le perçant achèvent", () => {
  // Coup appuyé à la tête.
  assert.notEqual(encaisser(equipe(), arme("hache"), true, 1, { x: 0, z: -1 }, ZONE_STATION), "detruit");
  assert.notEqual(encaisser(equipe(), arme("machette"), true, 1, { x: 0, z: -1 }, ZONE_STATION), "detruit");
  assert.equal(encaisser(equipe(), arme("masse"), true, 1, { x: 0, z: -1 }, ZONE_STATION), "detruit");
  assert.equal(encaisser(equipe(), arme("pied_de_biche"), true, 1, { x: 0, z: -1 }, ZONE_STATION), "detruit");
  // Au sol.
  const auSol = () => Object.assign(equipe(), { etat: "a_terre" as const, aTerre: 5 });
  assert.notEqual(encaisser(auSol(), arme("hache"), false, 1, { x: 0, z: -1 }, ZONE_STATION), "detruit");
  assert.equal(encaisser(auSol(), arme("marteau"), false, 1, { x: 0, z: -1 }, ZONE_STATION), "detruit");
  assert.equal(encaisser(auSol(), arme("lance"), false, 1, { x: 0, z: -1 }, ZONE_STATION), "detruit");
  // Un Errant ordinaire : la hache appuyée à la tête suffit, comme avant.
  assert.equal(encaisser(nouvelEteint(2, 0, 0, "poursuivant"), arme("hache"), true, 1, { x: 0, z: -1 }, ZONE_STATION), "detruit");
  // Le contondant étourdit plus longtemps.
  const a = nouvelEteint(3, 0, 0, "poursuivant");
  const b = nouvelEteint(4, 0, 0, "poursuivant");
  encaisser(a, arme("gourdin"), false, 1, { x: 0, z: -1 }, ZONE_STATION);
  encaisser(b, arme("couteau"), false, 1, { x: 0, z: -1 }, ZONE_STATION);
  assert.ok(a.etourdi > b.etourdi);
});

test("0.5e : les nouvelles armes — solidités du Book 23, la lance se fabrique", () => {
  const solidites: Record<string, number> = { pied_de_biche: 120, marteau: 40, masse: 70, hache: 60, machette: 40, couteau: 40, epieu: 30, gourdin: 25 };
  for (const [o, s] of Object.entries(solidites)) assert.equal(arme(o).solidite, s, o);
  assert.equal(arme("lance").type, "percant");
  assert.ok(arme("lance").allonge > arme("epieu").allonge);
  const lance = RECETTES.find((r) => r.id === "lance")!;
  assert.deepEqual(lance.ingredients, { epieu: 1, couteau: 1, ficelle: 1 });
  // Le pied-de-biche, en main, passe avant le marteau.
  assert.equal(armeEnMain({ pied_de_biche: 1, marteau: 1 }, null).objet, "pied_de_biche");
});

/** Un joueur à la halte avec des Éteints placés où l'on veut. */
function monter(inventaire: Record<string, number>) {
  const base = new Base(":memory:");
  const halte = new Halte(base, () => 0.5);
  const compte = base.creerCompte("Rose", "potager42", "charbonniers");
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
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
  joueur.position = { x: SORTIE_TERRAIN.boite.x, z: SORTIE_TERRAIN.boite.z, o: 0 };
  joueur.recevoir({ t: "voyager", vers: "station" });
  attendre(DUREE_VOYAGE_S + 0.1, 0.5);
  halte.eteints = [];
  joueur.position = { x: 40, z: 34.6, o: 0 };
  const usure = () => (recus.findLast((m) => m.t === "usure") as Extract<MessageServeur, { t: "usure" }> | undefined);
  const inv = () => (recus.findLast((m) => m.t === "inventaire") as Extract<MessageServeur, { t: "inventaire" }> | undefined)?.inventaire;
  return { base, halte, joueur, attendre, recus, usure, inv, compte };
}

test("0.5e : l'usure — chaque coup qui touche use l'arme ; abîmée sous 30 %, elle casse à 0 et la suivante est neuve", () => {
  const t = monter({ gourdin: 2 });
  const frapper = () => {
    t.halte.eteints = [nouvelEteint(9, 40, 35.6, "poursuivant")];
    t.joueur.position = { x: 40, z: 34.6, o: 0 };
    t.joueur.recevoir({ t: "frapper", appuye: false });
    t.attendre(0.9);
  };
  // Le gourdin tient 25 coups : au 18e, il est abîmé (sous 30 %).
  for (let i = 0; i < 18; i++) frapper();
  assert.equal(t.usure()?.evenement?.etat, "abimee");
  assert.ok(etatArme("gourdin", t.usure()!.usure) < SEUIL_ABIMEE);
  for (let i = 0; i < 7; i++) frapper();
  assert.equal(t.usure()?.evenement?.etat, "cassee");
  assert.equal(t.inv()?.gourdin, 1);
  assert.equal(t.usure()?.usure.gourdin, undefined, "la suivante est neuve");
});

test("0.5e : réparer — de fortune partout (ficelle, chiffons), sans dépasser « abîmée » ; pour de bon, à l'atelier", () => {
  const t = monter({ hache: 1, ficelle: 1, chiffons: 1 });
  t.base.sauverUsure(t.compte.id, { hache: 5 });
  let instant = 2_000_000;
  const j = new Joueur(t.compte, t.base, (m) => t.recus.push(m), () => instant, t.halte, () => 0.5);
  j.recevoir({ t: "reparer", objet: "hache", fortune: false });
  assert.ok(t.recus.some((m) => m.t === "info" && /meule du pédalier/.test(m.texte)));
  j.recevoir({ t: "reparer", objet: "hache", fortune: true });
  for (let i = 0; i < 40; i++) {
    instant += 250;
    j.tick(0.25);
  }
  const u = (t.recus.findLast((m) => m.t === "usure") as Extract<MessageServeur, { t: "usure" }>).usure;
  assert.equal(u.hache, Math.floor(60 * 0.29));
  assert.ok(etatArme("hache", u) < SEUIL_ABIMEE, "toujours abîmée");
});

test("0.5e : repousser — deux Éteints au contact devant soi reculent d'1,5 m, étourdis ; pas celui de derrière", () => {
  const t = monter({ gourdin: 1 });
  const devant1 = nouvelEteint(1, 40.4, 35.6, "poursuivant");
  const devant2 = nouvelEteint(2, 39.6, 35.5, "poursuivant");
  const devant3 = nouvelEteint(3, 40, 35.7, "poursuivant");
  const derriere = nouvelEteint(4, 40, 33.7, "poursuivant");
  t.halte.eteints = [devant1, devant2, devant3, derriere];
  t.joueur.position = { x: 40, z: 34.6, o: 0 };
  const endurance = t.joueur.bienvenue(0).endurance;
  t.joueur.recevoir({ t: "repousser" });
  const recules = [devant1, devant2, devant3].filter((e) => e.z > 36.5);
  assert.equal(recules.length, REPOUSSER.max);
  assert.ok(recules.every((e) => e.etourdi >= REPOUSSER.etourdi));
  assert.equal(derriere.z, 33.7);
  assert.equal(t.joueur.bienvenue(0).endurance, endurance - REPOUSSER.cout);
});

test("0.5e : les leurres du décor — le klaxon vide la batterie du tracteur, la radio s'allume et s'éteint", () => {
  const base = new Base(":memory:");
  let instant = 1_000_000;
  const cooperatives = new Cooperatives(base, () => 0.5, () => instant);
  const compte = base.creerCompte("Rose", "potager42", "mecanistes");
  base.sauverInventaire(compte.id, { sac_a_dos: 1 });
  base.sauverPosition(compte.id, arriveeDans("comptoir", "station"), "comptoir", instant);
  const recus: MessageServeur[] = [];
  const j = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), () => 0.5, new Comptoir(base), cooperatives);
  const sortie = SORTIES_COMPTOIR.find((s) => s.vers === "cooperative")!;
  j.position = { x: sortie.boite.x, z: sortie.boite.z, o: 0 };
  j.recevoir({ t: "voyager", vers: "cooperative" });
  for (let s = 0; s < DUREE_VOYAGE_S + 1; s += 0.5) {
    instant += 500;
    j.tick(0.5);
  }
  const coop = cooperatives.de(compte.id);
  const actionner = (id: string) => {
    const l = LEURRES.find((x) => x.id === id)!;
    j.position = { x: l.x + 0.8, z: l.z, o: 0 };
    j.recevoir({ t: "interagir", cible: { genre: "leurre", id }, verbe: "actionner" });
  };
  for (let i = 0; i < KLAXONS_PAR_BATTERIE; i++) {
    actionner("klaxon");
    assert.ok(coop.bruitEnCours("klaxon", instant));
    instant += 5000;
    cooperatives.tick(instant, 0.05);
  }
  actionner("klaxon");
  assert.ok(!coop.bruitEnCours("klaxon", instant));
  assert.ok(recus.some((m) => m.t === "info" && /batterie du tracteur est morte/.test(m.texte)));
  // La radio joue tant qu'on ne l'éteint pas ; on l'entend arriver chez soi (message « leurre »).
  actionner("radio");
  assert.ok(coop.bruitEnCours("radio", instant + 60_000));
  assert.ok(recus.some((m) => m.t === "leurre" && m.id === "radio" && m.actif));
  actionner("radio");
  assert.ok(!coop.bruitEnCours("radio", instant));
});

test("la pause : sur son terrain, la faim s'arrête et l'on ne bouge plus ; pas de pause à la station", () => {
  const base = new Base(":memory:");
  let instant = 1_000_000;
  const compte = base.creerCompte("Rose", "potager42", "voltaiques");
  const recus: MessageServeur[] = [];
  const j = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), () => 0.5);
  const kcal = () => j.bienvenue(0).besoins.kcal;
  j.recevoir({ t: "pause", oui: true });
  assert.deepEqual(recus.findLast((m) => m.t === "pause"), { t: "pause", oui: true });
  const avant = kcal();
  const pos = { ...j.position };
  j.recevoir({ t: "intention", dx: 1, dz: 0, allure: "course", seq: 1 });
  for (let i = 0; i < 200; i++) {
    instant += 100;
    j.tick(0.1);
  }
  assert.equal(kcal(), avant);
  assert.deepEqual({ x: j.position.x, z: j.position.z }, { x: pos.x, z: pos.z });
  j.recevoir({ t: "pause", oui: false });
  for (let i = 0; i < 200; i++) {
    instant += 100;
    j.tick(0.1);
  }
  assert.ok(kcal() < avant, "la faim reprend");
  // À la station (lieu partagé) : refusée.
  j.position = { x: SORTIE_TERRAIN.boite.x, z: SORTIE_TERRAIN.boite.z, o: 0 };
  j.recevoir({ t: "voyager", vers: "station" });
  for (let i = 0; i < 120; i++) {
    instant += 100;
    j.tick(0.1);
  }
  j.recevoir({ t: "pause", oui: true });
  assert.deepEqual(recus.findLast((m) => m.t === "pause"), { t: "pause", oui: false });
});

test("la gourde pleine pèse son litre d'eau en plus", async () => {
  const { poidsInventaire } = await import("../../commun/src/objets.ts");
  assert.equal(poidsInventaire({ gourde: 1 }, 0), 0.3);
  assert.equal(poidsInventaire({ gourde: 1 }, 1), 1.3);
  assert.equal(poidsInventaire({ couteau: 1 }, 1), poidsInventaire({ couteau: 1 }), "sans gourde, pas d'eau");
});

test("0.9 : l'Équipé martelé — le serveur dit « vacille » puis « encaisse » ; la poussée le fait toujours vaciller", () => {
  const t = monter({ gourdin: 1 });
  const e = equipe(40, 35.5);
  t.halte.eteints = [e];
  const coups = () => t.recus.filter((m) => m.t === "coup").map((m) => (m as Extract<MessageServeur, { t: "coup" }>).resultat);
  const frapper = () => {
    t.joueur.position = { x: e.x, z: e.z - 0.9, o: 0 };
    t.joueur.recevoir({ t: "frapper", appuye: false });
    t.attendre(0.6);
  };
  frapper();
  frapper();
  assert.deepEqual(coups(), ["vacille", "encaisse"]);
  // De retour au contact, sa saisie en route : la poussée le fait vaciller quand même.
  e.etourdi = 0;
  e.contact = 0.3;
  t.joueur.position = { x: e.x, z: e.z - 0.9, o: 0 };
  t.joueur.recevoir({ t: "repousser" });
  assert.ok(e.etourdi > 0);
  assert.equal(e.contact, 0);
});
