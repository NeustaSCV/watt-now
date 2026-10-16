// Version 0.5.1 (Book 23 §4.3 et §4.7) : les trois morceaux qui manquaient à la 0.5. La batterie du tracteur à
// emporter (sa charge suit les coups de klaxon), la radio qu'on prend et qu'on pose ailleurs, le débris d'une arme
// cassée.

import { test } from "node:test";
import assert from "node:assert/strict";
import { ARMES, DEBRIS_ARME } from "../../commun/src/combat.ts";
import { BATTERIE_TRACTEUR, KLAXONS_PAR_BATTERIE, LEURRES, RADIO_ETABLI, chargeBatterieTracteur } from "../../commun/src/cooperative.ts";
import { nouvelEteint } from "../../commun/src/eteints.ts";
import { DUREE_VOYAGE_S, SORTIES_COMPTOIR, SORTIE_TERRAIN, arriveeDans, sortieIci } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { REGLAGES } from "../../commun/src/reglages.ts";
import { REPOUSSE_MS } from "../../commun/src/terrain.ts";
import { DEMONTAGE } from "../../commun/src/vestiges.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Cooperatives } from "./cooperative.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

/** Un joueur arrivé dans sa Coopérative, sans Éteints autour (on les place soi-même). */
function enCooperative(inventaire: Record<string, number>, famille: "mecanistes" | "voltaiques" = "mecanistes") {
  const base = new Base(":memory:");
  const temps = { instant: 1_000_000 };
  const cooperatives = new Cooperatives(base, () => 0.5, () => temps.instant);
  const compte = base.creerCompte("Rose", "potager42", famille);
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
  base.sauverPosition(compte.id, arriveeDans("comptoir", "station"), "comptoir", temps.instant);
  const recus: MessageServeur[] = [];
  const j = new Joueur(compte, base, (m) => recus.push(m), () => temps.instant, new Halte(base), () => 0.5, new Comptoir(base), cooperatives);
  const attendre = (secondes: number, pas = 0.1) => {
    for (let s = 0; s < secondes - 1e-9; s += pas) {
      temps.instant += pas * 1000;
      cooperatives.tick(temps.instant, pas);
      j.tick(pas);
    }
  };
  const sortie = SORTIES_COMPTOIR.find((s) => s.vers === "cooperative")!;
  j.position = { x: sortie.boite.x, z: sortie.boite.z, o: 0 };
  j.recevoir({ t: "voyager", vers: "cooperative" });
  attendre(DUREE_VOYAGE_S + 1, 0.5);
  const coop = cooperatives.de(compte.id);
  coop.eteints = [];
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  return { base, temps, cooperatives, compte, j, recus, attendre, coop, dernier, infos };
}

test("0.5.1 : la charge de la batterie du tracteur suit les coups de klaxon (un quart par coup)", () => {
  assert.equal(chargeBatterieTracteur(KLAXONS_PAR_BATTERIE), 360);
  assert.equal(chargeBatterieTracteur(2), 180);
  assert.equal(chargeBatterieTracteur(0), 0);
});

test("0.5.1 : démonter la batterie du tracteur — elle part avec ce que le klaxon lui a laissé, et le klaxon se tait 4 jours", () => {
  const t = enCooperative({ cle_plate: 1 });
  const klaxon = LEURRES.find((l) => l.id === "klaxon")!;
  const klaxonner = () => {
    t.j.position = { x: klaxon.x + 0.8, z: klaxon.z, o: 0 };
    t.j.recevoir({ t: "interagir", cible: { genre: "leurre", id: "klaxon" }, verbe: "actionner" });
    t.attendre(4);
  };
  klaxonner();
  klaxonner();
  assert.equal(t.dernier("etat_coop")?.etat.klaxons, 2, "le client sait ce qui reste");
  // Démonter la batterie : il faut une clé plate (Serrer 1).
  const point = [...t.coop.ressources.values()].find((r) => r.type === "coop_batterie")!;
  assert.deepEqual({ x: point.x, z: point.z }, { x: BATTERIE_TRACTEUR.x, z: BATTERIE_TRACTEUR.z });
  t.j.position = { x: BATTERIE_TRACTEUR.x + 1, z: BATTERIE_TRACTEUR.z - 0.4, o: 0 };
  t.j.recevoir({ t: "interagir", cible: { genre: "ressource", id: point.id }, verbe: "demonter" });
  t.attendre(12);
  assert.equal(t.dernier("inventaire")?.inventaire.batterie_voiture, 1);
  assert.equal(t.dernier("charges")?.charges.batterie_voiture, 180, "deux coups sur quatre : la moitié");
  assert.ok(t.infos().some((x) => /batterie du tracteur est à toi, 180 Wh/.test(x)));
  assert.ok(t.recus.some((m) => m.t === "ressource" && m.id === point.id && !m.disponible));
  // Plus de batterie : le klaxon reste muet, et ne fait aucun bruit.
  klaxonner();
  assert.ok(t.infos().some((x) => /plus de batterie sous le capot/.test(x)));
  assert.ok(!t.coop.bruitEnCours("klaxon", t.temps.instant - 3500));
  // Quatre jours plus tard, une autre batterie est là, pleine : le klaxon revit.
  t.temps.instant += REPOUSSE_MS.coop_batterie! / REGLAGES.repousse_rythme + 10_000;
  t.attendre(6);
  assert.equal(point.disponibleLe, 0);
  t.j.position = { x: klaxon.x + 0.8, z: klaxon.z, o: 0 };
  t.j.recevoir({ t: "interagir", cible: { genre: "leurre", id: "klaxon" }, verbe: "actionner" });
  assert.ok(t.coop.bruitEnCours("klaxon", t.temps.instant));
  assert.equal(t.cooperatives.vue(t.compte.id).klaxons, KLAXONS_PAR_BATTERIE - 1);
});

test("0.5.1 : sans clé plate, la batterie ne se démonte pas", () => {
  const t = enCooperative({});
  const point = [...t.coop.ressources.values()].find((r) => r.type === "coop_batterie")!;
  t.j.position = { x: BATTERIE_TRACTEUR.x + 1, z: BATTERIE_TRACTEUR.z, o: 0 };
  t.j.recevoir({ t: "interagir", cible: { genre: "ressource", id: point.id }, verbe: "demonter" });
  t.attendre(12);
  assert.equal(t.dernier("inventaire")?.inventaire.batterie_voiture, undefined);
  assert.equal(point.disponibleLe, 0);
});

test("0.5.1 : la radio se prend, se pose ailleurs, et attire les Éteints à sa nouvelle place", () => {
  const t = enCooperative({});
  // La prendre sur l'établi : elle va dans le sac.
  t.j.position = { x: RADIO_ETABLI.x + 0.8, z: RADIO_ETABLI.z, o: 0 };
  t.j.recevoir({ t: "interagir", cible: { genre: "leurre", id: "radio" }, verbe: "prendre_radio" });
  assert.equal(t.dernier("inventaire")?.inventaire.radio_piles, 1);
  assert.equal(t.dernier("etat_coop")?.etat.radio, null);
  // Dans le sac, on ne l'allume pas.
  t.j.recevoir({ t: "interagir", cible: { genre: "leurre", id: "radio" }, verbe: "actionner" });
  assert.ok(!t.coop.bruitEnCours("radio", t.temps.instant));
  // La poser dans la cour, devant la bascule.
  const ici = { x: 46, z: 50 };
  t.j.position = { ...ici, o: 0 };
  t.j.recevoir({ t: "poser_radio" });
  assert.equal(t.dernier("inventaire")?.inventaire.radio_piles, undefined);
  assert.deepEqual(t.dernier("etat_coop")?.etat.radio, ici);
  assert.deepEqual(t.j.bienvenue(0).etatCoop?.radio, ici, "à la reconnexion aussi");
  // L'allumer : elle joue là où elle est.
  t.j.recevoir({ t: "interagir", cible: { genre: "leurre", id: "radio" }, verbe: "actionner" });
  const allumee = t.dernier("leurre");
  assert.ok(allumee?.actif);
  assert.deepEqual({ x: allumee!.x, z: allumee!.z }, ici);
  // Un Éteint qui erre dans la cour, à 15 m, va voir ; le joueur, lui, s'est éloigné sans bruit.
  const e = nouvelEteint(99, ici.x - 15, ici.z + 2, "errant");
  t.coop.eteints = [e];
  t.j.position = { x: 76, z: 56, o: 0 };
  t.attendre(30);
  const d = Math.hypot(e.x - ici.x, e.z - ici.z);
  assert.ok(d < 6, `l'Éteint est à ${d.toFixed(1)} m de la radio, en (${e.x.toFixed(1)}, ${e.z.toFixed(1)})`);
  assert.ok(Math.hypot(e.x - RADIO_ETABLI.x, e.z - RADIO_ETABLI.z) > 20, "pas vers l'établi");
  // La reprendre l'éteint.
  t.j.position = { x: ici.x + 0.5, z: ici.z, o: 0 };
  t.j.recevoir({ t: "interagir", cible: { genre: "leurre", id: "radio" }, verbe: "prendre_radio" });
  assert.ok(!t.coop.bruitEnCours("radio", t.temps.instant));
  assert.equal(t.dernier("leurre")?.actif, false);
});

test("0.5.1 : la radio ne quitte pas la Coopérative — on la pose au portail en partant ; perdue, elle revient sur l'établi", () => {
  const t = enCooperative({});
  t.j.position = { x: RADIO_ETABLI.x + 0.8, z: RADIO_ETABLI.z, o: 0 };
  t.j.recevoir({ t: "interagir", cible: { genre: "leurre", id: "radio" }, verbe: "prendre_radio" });
  // Au portail, on prend la route du Carrefour : la radio reste au pied du portail.
  const sortie = arriveeDans("cooperative", "comptoir");
  let p = { x: sortie.x, z: sortie.z };
  for (let dz = 0; dz < 6 && !sortieIci("cooperative", p.x, p.z); dz += 0.25) p = { x: sortie.x, z: sortie.z + dz };
  assert.ok(sortieIci("cooperative", p.x, p.z), "on trouve la sortie");
  t.j.position = { ...p, o: 0 };
  t.j.recevoir({ t: "voyager", vers: "comptoir" });
  assert.equal(t.dernier("voyage")?.vers, "comptoir");
  assert.equal(t.dernier("inventaire")?.inventaire.radio_piles, undefined);
  assert.deepEqual(t.cooperatives.radio(t.compte.id), { x: Math.round(p.x * 100) / 100, z: Math.round(p.z * 100) / 100 });
  assert.ok(t.infos().some((x) => /pied du portail/.test(x)));

  // Une radio perdue (dans aucun sac, nulle part) se retrouve sur l'établi à l'entrée suivante.
  const u = enCooperative({});
  u.j.position = { x: RADIO_ETABLI.x + 0.8, z: RADIO_ETABLI.z, o: 0 };
  u.j.recevoir({ t: "interagir", cible: { genre: "leurre", id: "radio" }, verbe: "prendre_radio" });
  u.base.sauverInventaire(u.compte.id, { sac_a_dos: 1 });
  const revenu = new Joueur(u.compte, u.base, () => {}, () => u.temps.instant, new Halte(u.base), () => 0.5, new Comptoir(u.base), u.cooperatives);
  assert.deepEqual(revenu.bienvenue(0).etatCoop?.radio, RADIO_ETABLI);
});

/** Un joueur à la halte, avec son arme presque cassée. */
function aLaHalte(inventaire: Record<string, number>, usure: Record<string, number>) {
  const base = new Base(":memory:");
  const halte = new Halte(base, () => 0.5);
  const compte = base.creerCompte("Rose", "potager42", "charbonniers");
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
  base.sauverUsure(compte.id, usure);
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
  const frapper = () => {
    halte.eteints = [nouvelEteint(9, 40, 35.6, "poursuivant")];
    joueur.position = { x: 40, z: 34.6, o: 0 };
    joueur.recevoir({ t: "frapper", appuye: false });
    attendre(1.2);
  };
  const inv = () => (recus.findLast((m) => m.t === "inventaire") as Extract<MessageServeur, { t: "inventaire" }> | undefined)?.inventaire;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  return { halte, joueur, frapper, inv, infos, attendre };
}

test("0.5.1 : une arme cassée laisse un débris démontable, dans le sac", () => {
  const t = aLaHalte({ gourdin: 1 }, { gourdin: 1 });
  t.frapper();
  assert.equal(t.inv()?.gourdin, undefined, "le gourdin a cassé");
  assert.equal(t.inv()?.manche_fendu, 1);
  assert.ok(t.infos().some((x) => /vient de casser\. Il n'en reste qu'un débris \(manche fendu\)/.test(x)));
  // Le débris se démonte et rend un peu de matière.
  assert.deepEqual(DEMONTAGE.manche_fendu?.donne, { branche: 1 });
  t.joueur.recevoir({ t: "demonter", objet: "manche_fendu" });
  t.attendre(4);
  assert.equal(t.inv()?.manche_fendu, undefined);
  assert.equal(t.inv()?.branche, 1);
});

test("0.5.1 : chaque arme qui s'use laisse son débris, qui se démonte ; sac plein, il tombe par terre", () => {
  for (const a of ARMES) {
    if (!a.objet || a.objet === "barre_metal") continue;
    const debris = DEBRIS_ARME[a.objet];
    // La lame ébréchée ne se démonte pas : elle se reforge (Book 25, chez les Charbonniers).
    assert.ok(debris && (DEMONTAGE[debris] || debris === "lame_ebrechee"), a.objet);
  }
  assert.equal(DEBRIS_ARME.barre_metal, undefined, "une barre tordue redeviendrait une barre : rien");
  // La masse casse dans un sac plein à ras bord : sa ferraille tombe par terre, à la halte.
  const t = aLaHalte({ masse: 1, pierre: 26 }, { masse: 1 });
  t.frapper();
  assert.equal(t.inv()?.masse, undefined);
  assert.equal(t.inv()?.ferraille_tordue, undefined);
  assert.ok(t.halte.sacs.some((s) => (s.contenu.inventaire.ferraille_tordue ?? 0) === 1 && s.contenu.jete));
  assert.ok(t.infos().some((x) => /débris \(ferraille tordue\) est tombé par terre/.test(x)));
});
