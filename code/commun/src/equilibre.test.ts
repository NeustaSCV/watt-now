// Tests du simulateur d'équilibre et du garde-fou du Book 25 §8.4 (chantier 9 · 0.6).
// Si une valeur d'arme change (armes/*.ts, tir.ts) et casse l'équilibre, c'est ici que ça se voit.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ARMES_DE_METIER,
  ECART_COUT_MAX,
  ENDURANCE_DECHARGE_SIM,
  NIVEAUX,
  SCENARIOS,
  TERRAINS,
  armeComparee,
  armeDeContact,
  gardeFou,
  simuler,
  tableau,
  tableauTexte,
  type Ligne,
  type NomScenario,
} from "./equilibre.ts";
import { ARMES, armeDeCle } from "./combat.ts";
import { appliquerReglages } from "./reglages.ts";
import { ENDURANCE_DECHARGE } from "../../serveur/src/electricite.ts";

const LIGNES = tableau();
const ligne = (famille: Ligne["famille"], niveau: Ligne["niveau"]) => LIGNES.find((l) => l.famille === famille && l.niveau === niveau)!;

test("équilibre : le garde-fou du §8.4 tient avec les valeurs du jeu", () => {
  const { fautes } = gardeFou(LIGNES);
  assert.deepEqual(fautes, [], `le garde-fou ne tient plus :\n${fautes.join("\n")}\n\n${tableauTexte(LIGNES)}`);
});

test("équilibre : chaque arme de métier est la meilleure des trois sur son terrain, à ★★★", () => {
  for (const famille of ARMES_DE_METIER) {
    for (const s of TERRAINS[famille]) {
      const sienne = ligne(famille, 3).seule[s].temps;
      for (const autre of ARMES_DE_METIER) assert.ok(sienne <= ligne(autre, 3).seule[s].temps, `${famille} sur « ${SCENARIOS[s].titre} »`);
    }
  }
});

test("équilibre : la lame seule n'achève pas un Équipé ; avec le marteau du kit, si", () => {
  const lame = armeComparee("lame", 3);
  const seule = simuler(lame, SCENARIOS.equipe);
  assert.equal(seule.impossible, true);
  assert.equal(seule.temps, Infinity);
  const avec = simuler(lame, SCENARIOS.equipe, { seconde: armeDeContact("marteau") });
  assert.ok(avec.reussi && avec.temps < 3);
});

test("équilibre : l'électrique détruit un Équipé aussi vite qu'un Errant, sans jamais être saisie", () => {
  for (const niveau of [2, 3] as const) {
    const l = ligne("electrique", niveau);
    assert.equal(l.seule.equipe.temps, l.seule.errant.temps);
    assert.equal(l.seule.equipe.saisies, 0);
  }
  // À ★★★, le groupe serré se tient sans une saisie (la courte raidit et saute au voisin).
  assert.equal(ligne("electrique", 3).seule.serre.saisies, 0);
  assert.equal(ligne("electrique", 3).seule.groupe5.saisies, 0);
});

test("équilibre : l'arbalète armée détruit tout de suite ; à 15 m, elle en détruit au moins deux avant le contact", () => {
  const a = ligne("arbalete", 3);
  assert.ok(a.seule.errant.temps <= 0.35, "armée d'avance : 0,3 s");
  assert.ok(a.seule.groupe15.avantContact >= 2);
  // Seule, rattrapée par un groupe, elle se fait prendre : il lui faut une seconde arme (§8.4).
  assert.ok(a.seule.groupe5.saisies >= 2);
  assert.ok(a.avecSeconde.groupe5.temps < a.seule.groupe5.temps);
});

test("équilibre : l'arc commun reste en dessous de l'arbalète à niveau égal, à distance", () => {
  for (const niveau of NIVEAUX) {
    assert.ok(ligne("arc", niveau).seule.groupe15.temps >= ligne("arbalete", niveau).seule.groupe15.temps, `★ ${niveau}`);
    assert.ok(ligne("arc", niveau).seule.errant.temps > ligne("arbalete", niveau).seule.errant.temps);
  }
});

test("équilibre : plus d'étoiles ne rend jamais une arme moins bonne", () => {
  for (const l of LIGNES.filter((x) => x.niveau === 3)) {
    const un = ligne(l.famille, 1);
    for (const s of Object.keys(SCENARIOS) as NomScenario[]) assert.ok(l.seule[s].temps <= un.seule[s].temps + 1e-9, `${l.famille}, « ${SCENARIOS[s].titre} »`);
    assert.ok(l.cout.autonomie >= un.cout.autonomie || l.famille === "electrique", `${l.famille} : autonomie`);
  }
});

test("équilibre : au coût, personne ne paie plus de 3 fois la voie la moins chère (★★★)", () => {
  const couts = ARMES_DE_METIER.map((f) => ligne(f, 3).cout.wotts);
  assert.ok(Math.min(...couts) > 0);
  assert.ok(Math.max(...couts) <= ECART_COUT_MAX * Math.min(...couts), couts.join(" / "));
});

test("équilibre : le simulateur est reproductible", () => {
  const a = armeComparee("electrique", 3);
  assert.deepEqual(simuler(a, SCENARIOS.cascade), simuler(a, SCENARIOS.cascade));
});

test("équilibre : le garde-fou voit une arme qui faiblit", () => {
  // L'électrique cinq fois plus lente partout : elle perd son terrain, et sort des 2 fois ailleurs.
  const affaiblie = LIGNES.map((l) =>
    l.famille !== "electrique"
      ? l
      : { ...l, seule: Object.fromEntries(Object.entries(l.seule).map(([k, r]) => [k, { ...r, temps: r.temps * 5 }])) as Ligne["seule"] },
  );
  const { fautes } = gardeFou(affaiblie);
  assert.ok(fautes.some((f) => f.includes("n'y est pas la meilleure")));
  assert.ok(fautes.some((f) => f.includes("fois moins bonne")));
});

test("équilibre : les réglages d'équilibre changent les armes, et le simulateur le voit", () => {
  const avant = simuler(armeComparee("electrique", 3), SCENARIOS.errant).temps;
  const lameAvant = armeDeCle("machette_forgee")!.degatsTorse;
  const rearmerAvant = simuler(armeComparee("arbalete", 3), SCENARIOS.groupe15).temps;
  try {
    appliquerReglages({ equilibre_electrique_longue: 1.5, equilibre_lames_degats: 1.2, equilibre_arbalete_rearmer: 2, equilibre_tir_portee_tete: 0.5 });
    assert.ok(simuler(armeComparee("electrique", 3), SCENARIOS.errant).temps > avant + 0.4);
    assert.ok(Math.abs(armeDeCle("machette_forgee")!.degatsTorse - lameAvant * 1.2) < 1e-9);
    assert.equal(armeComparee("arbalete", 3).tir!.porteeTete, 6);
    assert.ok(simuler(armeComparee("arbalete", 3), SCENARIOS.groupe15).temps > rearmerAvant);
  } finally {
    appliquerReglages({});
  }
  // Aux réglages par défaut, l'arme déclarée reste la même (les tests des autres chantiers n'en voient rien).
  for (const a of ARMES) if (a.objet) assert.equal(armeDeCle(a.objet), a, a.objet);
});

test("équilibre : l'endurance d'une décharge est celle du serveur", () => {
  assert.deepEqual(ENDURANCE_DECHARGE_SIM, ENDURANCE_DECHARGE);
});
