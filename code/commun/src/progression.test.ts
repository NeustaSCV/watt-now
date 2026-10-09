// L'arbre de progression des recettes (0.7) : la table, les déclencheurs, la chaîne, le filet du temps.

import { test } from "node:test";
import assert from "node:assert/strict";
import { RECETTES, recette } from "./recettes.ts";
import { estObjet } from "./objets.ts";
import { QUETE } from "./quetes.ts";
import { FAMILLES, type Famille } from "./regles.ts";
import {
  CARTES_SPECIALES,
  FILET_MINUTES,
  FILET_SEUIL_MIN,
  PROGRESSION,
  aDevoiler,
  devoileesAuDepart,
  devoileesDEmblee,
  entrevues,
  autresAtteints,
  prochainPalier,
  progressionValide,
  recettesDuPalier,
  texteDevoilement,
  toutDevoile,
  type Declencheur,
  type EtatPourDevoilement,
} from "./progression.ts";

function etat(p: Partial<EtatPourDevoilement> = {}): EtatPourDevoilement {
  return {
    famille: "charbonniers",
    vus: new Set(),
    faits: {},
    installations: new Map(),
    quetes: new Set(),
    tuto: null,
    minutes: 0,
    sansSac: false,
    devoilees: new Set(devoileesAuDepart()),
    ...p,
  };
}

/** Ce qui est dévoilé après une évaluation. */
function apres(e: EtatPourDevoilement): Set<string> {
  return new Set([...e.devoilees, ...aDevoiler(e)]);
}

function* declencheurs(d: Declencheur): Generator<Declencheur> {
  yield d;
  if (d.a === "et") for (const x of d.tous) yield* declencheurs(x);
  if (d.a === "ou") for (const x of d.un) yield* declencheurs(x);
}

test("chaque recette a sa ligne dans l'arbre, et chaque ligne est une recette ou une carte", () => {
  for (const r of RECETTES) assert.ok(PROGRESSION[r.id], `recette sans ligne : ${r.id}`);
  for (const id of Object.keys(PROGRESSION)) assert.ok(recette(id) || (CARTES_SPECIALES as readonly string[]).includes(id), `ligne inconnue : ${id}`);
});

test("les déclencheurs ne citent que des objets, recettes et quêtes qui existent ; les indices sont courts", () => {
  for (const [id, ligne] of Object.entries(PROGRESSION)) {
    assert.ok(ligne.quand.length > 0, id);
    assert.ok(ligne.indice.length > 10 && ligne.indice.length <= 64, `indice de ${id} : ${ligne.indice.length} caractères`);
    for (const d of ligne.quand.flatMap((x) => [...declencheurs(x)])) {
      if (d.a === "vu") for (const o of d.objets) assert.ok(estObjet(o), `${id} : objet ${o}`);
      if (d.a === "fabrique") for (const r of d.recettes) assert.ok(recette(r), `${id} : recette ${r}`);
      if (d.a === "devoilee") assert.ok(PROGRESSION[d.recette], `${id} : ${d.recette}`);
      if (d.a === "quete") assert.ok(QUETE.has(d.quete), `${id} : quête ${d.quete}`);
    }
  }
});

test("premier écran : le feu et l'abri, rien d'autre (Q3) ; les silhouettes sont celles du palier 1 (Q2)", () => {
  assert.deepEqual(devoileesAuDepart().sort(), ["abri", "feu_de_camp"]);
  assert.deepEqual(aDevoiler(etat()), []);
  const p = prochainPalier("charbonniers", new Set(devoileesAuDepart()));
  assert.equal(p?.palier, 1);
  assert.ok(p!.recettes.includes("lit_branchages"));
  assert.ok(!p!.recettes.includes("forge"));
});

test("on y pense en tenant l'ingrédient : les joncs font penser à la ficelle et à la corde", () => {
  const d = apres(etat({ vus: new Set(["fibres"]) }));
  assert.ok(d.has("ficelle") && d.has("corde"));
  assert.ok(!d.has("recuperateur_pluie"));
});

test("la chaîne tire ses maillons : le récupérateur de pluie dévoile la corde (règle 4)", () => {
  const d = apres(etat({ faits: { pluie: 1 } }));
  assert.ok(d.has("recuperateur_pluie"));
  assert.ok(d.has("corde"), "la corde du récupérateur");
});

test("la quête active dévoile ce qu'elle demande (règle 5)", () => {
  const d = apres(etat({ quetes: new Set(["coffre"]) }));
  assert.ok(d.has("coffre") && d.has("corde"));
});

test("le premier feu allumé fait penser au gourdin ; un Éteint vu, à l'épieu", () => {
  assert.ok(apres(etat({ faits: { feu_allume: 1 } })).has("gourdin"));
  assert.ok(apres(etat({ faits: { eteint_vu: 1 } })).has("epieu"));
});

test("le seuil S ouvre l'atelier et l'arme de base de sa famille, avec leurs maillons (Q9)", () => {
  // Un toit seul ne suffit pas : il faut aussi avoir surmonté un premier danger.
  assert.ok(!apres(etat({ installations: new Map([["abri", 1]]) })).has("forge"));
  const charbonnier = apres(etat({ installations: new Map([["abri", 1]]), faits: { "detruit:gourdin": 1 } }));
  for (const id of ["forge", "machette_forgee_fer", "charbonniere", "ficelle"]) assert.ok(charbonnier.has(id), id);
  assert.ok(!charbonnier.has("hachette"));

  const mecaniste = apres(etat({ famille: "mecanistes", installations: new Map([["abri", 1]]), faits: { nuit: 1 } }));
  for (const id of ["pedalier", "arbalete", "arbrier", "noix_bois", "arc_arbalete_frene", "corde_arbalete", "corde_arc_ficelle", "etabli"]) assert.ok(mecaniste.has(id), id);
  // Les variantes à matière rare attendent la trouvaille.
  assert.ok(!mecaniste.has("arc_arbalete_ressort"));
  assert.ok(apres(etat({ famille: "mecanistes", devoilees: mecaniste, vus: new Set(["ressort_lames"]) })).has("arc_arbalete_ressort"));

  const voltaique = apres(etat({ famille: "voltaiques", tuto: 9 }));
  assert.ok(voltaique.has("banc_recharge") && voltaique.has("matraque_fortune"));
});

test("le métier commence à l'atelier : une matière rare trouvée avant ne dévoile rien de sa famille", () => {
  const avant = apres(etat({ vus: new Set(["lame_ebrechee"]) }));
  assert.ok(!avant.has("reforger_lame") && !avant.has("forge"));
  const ensuite = apres(etat({ vus: new Set(["lame_ebrechee"]), devoilees: new Set([...devoileesAuDepart(), "forge"]) }));
  assert.ok(ensuite.has("reforger_lame"));
});

test("le Mécaniste pense au pédalier dès qu'il tient le cadre du vélo (§3.1)", () => {
  assert.ok(apres(etat({ famille: "mecanistes", vus: new Set(["cadre_velo"]) })).has("pedalier"));
});

test("le filet du temps : palier 1, puis palier 2, puis le métier ; rien de plus", () => {
  const p1 = apres(etat({ minutes: FILET_MINUTES[1]! }));
  for (const id of recettesDuPalier(1, "charbonniers")) assert.ok(p1.has(id), id);
  assert.ok(!p1.has("gourdin"));
  const p2 = apres(etat({ minutes: FILET_MINUTES[2]! }));
  for (const id of recettesDuPalier(2, "charbonniers")) assert.ok(p2.has(id), id);
  assert.ok(!p2.has("forge"));
  const seuil = apres(etat({ minutes: FILET_SEUIL_MIN }));
  assert.ok(seuil.has("forge"));
  assert.ok(!seuil.has("glaive") && !seuil.has("pinces_forge"));
});

test("le rythme (Q5) : un quart d'heure de premiers gestes dévoile déjà sept cartes ou plus", () => {
  // Ramassé, feu allumé, la caisse à outils fouillée (tête de hache), des joncs, la hache remmanchée.
  const d = apres(etat({ vus: new Set(["branche", "pierre", "fibres", "tete_hache", "chiffons", "hache"]), faits: { feu_allume: 1, "fabrique:hache": 1 }, tuto: 5 }));
  assert.ok(d.size >= 7, `${d.size} cartes : ${[...d].join(", ")}`);
});

test("les autres familles : jamais dévoilées sans leçon ni manuel ; vues grisées après le Comptoir", () => {
  const sans = apres(etat({ minutes: 10_000, vus: new Set(["ressort_retrempe", "rivet", "pointe_acier"]), faits: { "visite:comptoir": 1 } }));
  for (const id of sans) assert.ok(recette(id)?.famille !== "mecanistes" && recette(id)?.famille !== "voltaiques", id);
  assert.ok(!autresAtteints({ famille: "charbonniers", faits: {} }));
  assert.ok(autresAtteints({ famille: "charbonniers", faits: { "visite:comptoir": 1 } }));
  assert.ok(autresAtteints({ famille: "charbonniers", faits: { "rencontre:voltaiques": 1 } }));
  assert.ok(!autresAtteints({ famille: "charbonniers", faits: { "rencontre:charbonniers": 1 } }));
  // Une leçon dévoile ce qu'elle apprend ; tenir le produit d'une autre famille déplie sa recette.
  const appris = apres(etat({ savoir: { apprises: ["arbalete"] } }));
  assert.ok(appris.has("arbalete"));
  const vues = entrevues(etat({ vus: new Set(["module_decharge"]) }));
  assert.ok(vues.includes("module_flash"));
});

test("voir faire (Q7) dévoile une recette de sa famille ou commune", () => {
  assert.ok(apres(etat({ faits: { "vu_faire:epieu": 1, vu_faire: 1 } })).has("epieu"));
});

test("le vétéran (Q8) : les paliers 1 et 2 de sa famille, pas l'atelier", () => {
  for (const f of FAMILLES) {
    const d = new Set(devoileesDEmblee(f as Famille));
    assert.ok(d.has("gourdin") && d.has("lit_branchages") && d.has("foyer_dakota"), f);
    assert.ok(!d.has("forge") && !d.has("banc_recharge") && !d.has("pedalier"), f);
  }
});

test("les messages tiennent sur deux lignes (110 caractères), sans « … » de coupure", () => {
  for (const f of FAMILLES) {
    for (const id of toutDevoile(f as Famille).devoilees) {
      const t = texteDevoilement([id], f as Famille)!;
      assert.ok(t.length <= 110, t);
      assert.match(t, /^(Tu y penses : |Ton métier commence : )/);
    }
  }
  assert.equal(texteDevoilement(["ficelle", "corde", "coffre"], "voltaiques"), "Tu y penses : 3 idées nouvelles dans Fabriquer.");
  assert.equal(texteDevoilement(["ficelle"], "voltaiques"), "Tu y penses : rouler une ficelle.");
  assert.equal(texteDevoilement(["forge", "machette_forgee_fer"], "charbonniers"), "Ton métier commence : le foyer de forge t'attend dans Fabriquer.");
});

test("un état illisible ou trafiqué est nettoyé (rien d'inconnu, rien de négatif)", () => {
  const e = progressionValide({ devoilees: ["abri", "abri", "inconnue", 3], nonVues: ["abri", "gourdin"], vus: ["fibres"], secondes: -5 });
  assert.deepEqual(e.devoilees, ["abri"]);
  assert.deepEqual(e.nonVues, ["abri"]);
  assert.equal(e.secondes, 0);
  assert.deepEqual(progressionValide(null).devoilees, []);
});

test("le prochain palier met en tête ce que demande la quête en cours", () => {
  const p = prochainPalier("charbonniers", new Set(devoileesAuDepart()), new Set(["eau_du_ciel"]));
  assert.equal(p!.recettes[0], "recuperateur_pluie");
  assert.equal(prochainPalier("charbonniers", new Set(toutDevoile("charbonniers").devoilees)), null);
});
