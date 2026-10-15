// Tests du simulateur d'équilibre et du garde-fou du Book 25 §8.4 (chantier 9 · 0.6).
// Si une valeur d'arme change (armes/*.ts, tir.ts) et casse l'équilibre, c'est ici que ça se voit.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ARMES_DE_METIER,
  ARMES_DES_ETAPES,
  ECART_COUT_MAX,
  ECART_MAX,
  ETAPES_EQUILIBRE,
  ENDURANCE_DECHARGE_SIM,
  NIVEAUX,
  SCENARIOS,
  TERRAINS,
  armeComparee,
  armeDeContact,
  gardeFou,
  gardeFouEtape,
  ARMES_MARTELEMENT,
  marteler,
  martelementTexte,
  simuler,
  tableau,
  tableauEtape,
  tableauTexte,
  type Ligne,
  type NomScenario,
} from "./equilibre.ts";
import { ARMES, MATIERE_ARME, armeDeCle, armeSansCharge } from "./combat.ts";
import { encaisser, encaisserCoup, nouvelEteint } from "./eteints.ts";
import { OBJETS_LANCES, armeTirDe, armeTirExemplaire, degatsLances } from "./tir.ts";
import { cleExemplaire, etoilesDe, maillonFaible, typeDe } from "./etoiles.ts";
import { QUALITES_OBJETS, etoilesDuProduit, recette } from "./recettes.ts";
import { PLAFONDS_NIVEAU_1, PLAFOND_ARC_IF_NIVEAU_1 } from "./armes/grille.ts";
import type { Zone } from "./lieux.ts";
import { appliquerReglages } from "./reglages.ts";
import { ENDURANCE_DECHARGE } from "../../serveur/src/electricite.ts";

const LIGNES = tableau();
const ZONE_VIDE: Zone = { xMin: -60, xMax: 60, zMin: -60, zMax: 60, obstacles: [] };
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
  // Le marteau ne tue plus à la tête (Q-A3) : il finit l'Équipé à terre. À ★★★ (2,5), la lame le met à terre d'un
  // appuyé, et le marteau finit plus tard (8,4 s, `armes-par-niveau.md` §11.5) ; à ★★, la lame du niveau 1, en 4,5 s.
  assert.ok(avec.reussi && avec.temps < 9);
  const niveau1 = simuler(armeComparee("lame", 2), SCENARIOS.equipe, { seconde: armeDeContact("marteau") });
  assert.ok(niveau1.reussi && niveau1.temps < 5);
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
  // Seule, rattrapée par un groupe, elle se fait prendre : il lui faut une seconde arme (§8.4). À ★★★, le cranequin
  // léger (2 s au lieu de 3, plan 0.10, N2-33) la tire encore d'affaire à 5 m ; serrée à 2,5 m, non.
  assert.ok(ligne("arbalete", 2).seule.groupe5.saisies >= 2);
  assert.ok(a.seule.serre.saisies >= 2);
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
  // L'électrique six fois plus lente partout : elle perd son terrain, et sort des 2 fois ailleurs.
  const affaiblie = LIGNES.map((l) =>
    l.famille !== "electrique"
      ? l
      : { ...l, seule: Object.fromEntries(Object.entries(l.seule).map(([k, r]) => [k, { ...r, temps: r.temps * 6 }])) as Ligne["seule"] },
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

// ---------- Plan 0.8 §2.4 (chantier 8) : les chiffres décidés, les plafonds, le garde-fou par étape ----------

test("0.8 : le garde-fou rejoué par étape tient à la maison, à H1, à L1 et à L2 (pire rapport ≤ 2, coût ≤ 3 fois)", () => {
  for (const etape of ETAPES_EQUILIBRE) {
    const v = gardeFouEtape(etape);
    assert.deepEqual(v.fautes, [], `${etape} :\n${v.fautes.join("\n")}`);
    assert.ok(v.pireRapport <= ECART_MAX, `${etape} : pire rapport ${v.pireRapport}`);
    assert.ok(v.ecartCout <= ECART_COUT_MAX, `${etape} : coût ${v.ecartCout}`);
  }
  // À H1 et L1, chaque arme de métier tient son terrain (à la maison, personne n'a de terrain : armes communes).
  const h1 = tableauEtape("H1");
  for (const famille of ARMES_DE_METIER) {
    const sienne = h1.find((l) => l.famille === famille)!;
    for (const s of TERRAINS[famille]) for (const autre of ARMES_DE_METIER) assert.ok(sienne.seule[s].temps <= h1.find((l) => l.famille === autre)!.seule[s].temps, `${famille}, « ${SCENARIOS[s].titre} »`);
  }
  // Les armes de l'étape sont celles de la grille : ★★ à H1 et L1.
  assert.deepEqual(ARMES_DES_ETAPES.H1, { lame: "machette_forgee#2", electrique: "matraque_electrique#2", arbalete: "arbalete#2", arc: "arc_simple" });
});

test("0.10 : le garde-fou tient à L2 (R30) ; l'électrique sous 2 fois contre trois Errants à 15 m ; l'arbalète ★★★ en 6,5 s", () => {
  assert.ok(ETAPES_EQUILIBRE.includes("L2"));
  assert.deepEqual(ARMES_DES_ETAPES.L2, { lame: "machette_forgee", electrique: "matraque_electrique", arbalete: "arbalete", arc: "arc_if#3" });
  const lignes = tableauEtape("L2");
  const v = gardeFouEtape("L2", lignes);
  assert.deepEqual(v.fautes, []);
  assert.ok(v.pireRapport <= ECART_MAX && v.ecartCout <= ECART_COUT_MAX, `${v.pireRapport} ; ${v.ecartCout}`);
  // Sur son terrain, chaque arme de métier est la meilleure.
  for (const famille of ARMES_DE_METIER) {
    const sienne = lignes.find((l) => l.famille === famille)!;
    for (const s of TERRAINS[famille]) for (const autre of ARMES_DE_METIER) assert.ok(sienne.seule[s].temps <= lignes.find((l) => l.famille === autre)!.seule[s].temps, `${famille}, « ${SCENARIOS[s].titre} »`);
  }
  const electrique = v.rapports.find((r) => r.famille === "electrique" && r.scenario === "groupe15")!;
  assert.ok(electrique.rapport < 2, `électrique à 15 m : ${electrique.rapport}`);
  // N2-34 : le cranequin léger réarme en 2 s ; trois Errants à 15 m, de 8,5 à 6,5 s.
  const arbalete = lignes.find((l) => l.famille === "arbalete")!;
  assert.ok(Math.abs(arbalete.seule.groupe15.temps - 6.5) < 0.15, `${arbalete.seule.groupe15.temps}`);
  // Les chiffres ★★★ décidés (K1 à K56).
  const contact: [string, number][] = [["machette_forgee", 2.5], ["hache_forgee", 3], ["glaive", 2.6], ["hachette", 2.25], ["serpe", 2.1], ["lame_forgee", 2], ["matraque_electrique", 2.25], ["aiguillon", 2.1]];
  for (const [cle, d] of contact) assert.ok(Math.abs(armeDeCle(cle)!.degatsTorse - d) < 1e-9, cle);
  const arb = armeTirExemplaire("arbalete", armeTirDe("arbalete")!);
  assert.deepEqual([arb.degatsPlein, arb.solidite], [2.5, 100]);
});

test("0.10 : les armes trouvées du niveau 2 — pied de guéridon et harpon, 3,2, tuent à la tête, solidité 50, sans étoiles", () => {
  const pied = armeDeCle("pied_gueridon")!;
  const harpon = armeDeCle("harpon")!;
  assert.deepEqual([pied.type, pied.degatsTorse, pied.tueALaTete, pied.solidite, pied.coup, pied.metier], ["contondant", 3.2, true, 50, 1000, undefined]);
  assert.deepEqual([harpon.type, harpon.degatsTorse, harpon.tueALaTete, harpon.solidite, harpon.allonge, harpon.metier], ["percant", 3.2, true, 50, 2.4, undefined]);
  for (const a of [pied, harpon]) {
    assert.equal(etoilesDe(a.objet!), null);
    assert.equal(QUALITES_OBJETS[a.objet!], undefined, "pas un outil");
    // Elles passent le casque.
    const casque = Object.assign(nouvelEteint(1, 0, 1, "poursuivant"), { variante: "equipe" as const });
    assert.equal(encaisser(casque, a, true, 1, { x: 0, z: 0 }, ZONE_VIDE), "detruit", a.objet!);
    // Au-dessus de la masse (2,5) : sans arme équipée, c'est elles qu'on prend.
    assert.ok(a.degatsTorse > armeDeCle("masse")!.degatsTorse);
    assert.ok(ARMES.indexOf(a) < ARMES.findIndex((x) => x.objet === "masse"), a.objet!);
  }
  // La fonte fendue ne se reprend pas ; la hampe du harpon, si (à l'établi, comme la fourche).
  assert.equal(MATIERE_ARME.pied_gueridon, undefined);
  assert.equal(MATIERE_ARME.harpon, "bois");
});

test("0.8 : le garde-fou d'une étape voit une faute", () => {
  const lignes = tableauEtape("H1").map((l) =>
    l.famille !== "electrique" ? l : { ...l, seule: Object.fromEntries(Object.entries(l.seule).map(([k, r]) => [k, { ...r, temps: r.temps * 3 }])) as Ligne["seule"] },
  );
  const v = gardeFouEtape("H1", lignes);
  assert.ok(v.fautes.length > 0 && v.pireRapport > ECART_MAX);
});

test("0.8 : une courte de matraque ★★ ajoute 1,1 au torse ; vide, elle frappe à 0,55", () => {
  const m2 = armeDeCle("matraque_electrique#2")!;
  assert.equal(m2.degatsTorse, 1.1);
  const e = nouvelEteint(1, 0, 1, "poursuivant");
  assert.equal(encaisserCoup(e, m2, false, 1, { x: 0, z: 0 }, ZONE_VIDE).resultat, "raidi");
  assert.ok(Math.abs(e.degats - 1.1) < 1e-9);
  // Trois courtes : 3,3 points, il tombe (l'Équipé tient jusqu'à 4).
  encaisserCoup(e, m2, false, 1, { x: 0, z: 0 }, ZONE_VIDE);
  assert.equal(encaisserCoup(e, m2, false, 1, { x: 0, z: 0 }, ZONE_VIDE).resultat, "a_terre");
  // La longue ne fait pas de dégâts : elle met à terre, ou elle détruit.
  const f = nouvelEteint(2, 0, 1, "poursuivant");
  assert.equal(encaisserCoup(f, m2, true, 1, { x: 0, z: 0 }, ZONE_VIDE).resultat, "a_terre");
  // Pack vide : un gourdin court, à la moitié de ses dégâts (C11).
  const vide = armeSansCharge(m2);
  assert.ok(Math.abs(vide.degatsTorse - 0.55) < 1e-9);
  assert.equal(vide.type, "contondant");
  assert.equal(vide.tueALaTete, false);
  // Les trois armes électriques ont des dégâts au torse.
  for (const o of ["matraque_electrique", "aiguillon", "matraque_fortune"]) assert.ok(armeDeCle(o)!.degatsTorse > 0, o);
});

test("0.8 : le réglage equilibre_electrique_degats règle la courte (1 par défaut ; 0 : rien au torse)", () => {
  try {
    appliquerReglages({ equilibre_electrique_degats: 0 });
    const e = nouvelEteint(1, 0, 1, "poursuivant");
    encaisserCoup(e, armeDeCle("matraque_electrique#2")!, false, 1, { x: 0, z: 0 }, ZONE_VIDE);
    assert.equal(e.degats, 0);
    appliquerReglages({ equilibre_electrique_degats: 2 });
    assert.ok(Math.abs(armeDeCle("matraque_electrique#2")!.degatsTorse - 2.2) < 1e-9);
  } finally {
    appliquerReglages({});
  }
  assert.equal(armeDeCle("matraque_electrique#2")!.degatsTorse, 1.1);
});

test("0.8 : la maîtrise sans plafond (K-Q1) — une machette ★★ maîtrisée fait 2,5 ; un arc simple maîtrisé, 1,35", () => {
  const n = maillonFaible([2], { maitrise: true });
  assert.equal(n, 3);
  assert.equal(armeDeCle(cleExemplaire("machette_forgee", n))!.degatsTorse, 2.5);
  assert.equal(armeDeCle("machette_forgee#2")!.degatsTorse, 1.2);
  // L'arc simple ★★★★ ne vient que de la maîtrise (Q-0.8-4) : la meilleure corde fait ★★★.
  const frene = recette("arc_simple")!;
  assert.equal(etoilesDuProduit(frene, { ebauche_arc_seche: 1, corde_arc: 1 }), 3);
  assert.equal(etoilesDuProduit(recette("corde_arc_dentaire")!, { fil_dentaire: 1 }), 3);
  const maitrise = etoilesDuProduit(frene, { ebauche_arc_seche: 1, corde_arc: 1 }, { maitrise: true })!;
  assert.equal(maitrise, 4);
  assert.equal(armeTirExemplaire(cleExemplaire("arc_simple", maitrise), armeTirDe("arc_simple")!).degatsPlein, 1.35);
});

test("0.8 : la fourche à foin tue à la tête et passe le casque ; 2,3 (0.10, N2-66), allonge 2 m, 80 coups, ni étoiles ni outil", () => {
  const f = armeDeCle("fourche_foin")!;
  assert.deepEqual([f.type, f.degatsTorse, f.allonge, f.coup, f.coupAppuye, f.solidite, f.tueALaTete], ["percant", 2.3, 2, 650, 900, 80, true]);
  // Elle approche la masse de la route A (2,5), sans la dépasser.
  assert.ok(f.degatsTorse < armeDeCle("masse")!.degatsTorse);
  assert.equal(f.metier, undefined);
  assert.equal(etoilesDe("fourche_foin"), null);
  assert.equal(QUALITES_OBJETS.fourche_foin, undefined, "pas un outil");
  const casque = Object.assign(nouvelEteint(1, 0, 1, "poursuivant"), { variante: "equipe" as const });
  assert.equal(encaisser(casque, f, true, 1, { x: 0, z: 0 }, ZONE_VIDE), "detruit");
  assert.equal(MATIERE_ARME.fourche_foin, "bois");
});

test("0.8 : les valeurs décidées (§2.4) — marteau 40 qui ne tue plus à la tête, matraques 60, arbalète 60 et 80", () => {
  const m = armeDeCle("marteau")!;
  assert.deepEqual([m.degatsTorse, m.solidite, m.tueALaTete], [0.8, 40, false]);
  const contact: [string, number, number?][] = [
    ["lance", 0.7], ["gourdin", 0.7], ["epieu", 0.6], ["hache", 1], ["lance_forgee", 1.15], ["couteau_aiguise", 0.85],
    ["hachette#2", 1.1], ["lame_forgee#2", 0.9], ["serpe#2", 1],
    ["matraque_fortune", 0.9, 60], ["matraque_fortune#2", 1, 60], ["matraque_electrique#1", 1, 60], ["matraque_electrique#2", 1.1, 60],
  ];
  for (const [cle, d, s] of contact) {
    const a = armeDeCle(cle)!;
    assert.ok(Math.abs(a.degatsTorse - d) < 1e-9, `${cle} : ${a.degatsTorse}`);
    if (s !== undefined) assert.equal(a.solidite, s, cle);
  }
  const tir: [string, number, number?][] = [["arc_fortune", 0.7], ["arc_fortune#2", 0.75], ["arc_simple#2", 0.8], ["arc_simple", 1.1], ["arc_if#2", 1.35], ["arbalete#1", 1.1, 60], ["arbalete#2", 1.2, 80]];
  for (const [cle, d, s] of tir) {
    const w = armeTirExemplaire(cle, armeTirDe(typeDe(cle))!);
    assert.ok(Math.abs(w.degatsPlein - d) < 1e-9, `${cle} : ${w.degatsPlein}`);
    if (s !== undefined) assert.equal(w.solidite, s, cle);
  }
  // La hachette lancée fait les dégâts de l'exemplaire (K45).
  const hachette = OBJETS_LANCES.find((o) => o.objet === "hachette")!;
  assert.equal(degatsLances(hachette, "hachette#2"), 1.1);
  assert.equal(degatsLances(hachette, "hachette"), 2.25);
});

test("0.8 : les plafonds de la grille par les recettes (I13, Q-A5, Q-0.8-3) ; les dégâts montent avec les étoiles", () => {
  // La corde de joncs ★★, le fil dentaire et le boyau ★★★ ; l'arc d'if se monte ★★.
  assert.equal(etoilesDuProduit(recette("corde_arc_ficelle")!, { corde: 1 }), 2);
  assert.equal(etoilesDuProduit(recette("corde_arc_boyau")!, { boyaux: 1 }), 3);
  assert.equal(etoilesDuProduit(recette("arc_if")!, { ebauche_if_seche: 1, "corde_arc#4": 1 }), PLAFOND_ARC_IF_NIVEAU_1);
  // La petite batterie, source de la matraque ★★ : même au module à bobine, ★★ ; au flash, ★. Depuis la 0.8.2 (R16), c'est
  // la matraque électrique elle-même, faite avec la petite batterie au lieu d'un pack.
  const batterie = recette("matraque_electrique")!;
  assert.equal(etoilesDuProduit(batterie, { gourdin: 1, "module_decharge#2": 1, petite_batterie: 1, caoutchouc: 1 }), 2);
  assert.equal(etoilesDuProduit(batterie, { gourdin: 1, module_decharge: 1, petite_batterie: 1, caoutchouc: 1 }), 2);
  assert.equal(etoilesDuProduit(batterie, { gourdin: 1, "module_decharge#1": 1, petite_batterie: 1, caoutchouc: 1 }), 1);
  // Le même texte sur les deux fiches qui prennent la petite batterie (Q-B6).
  assert.ok(batterie.note && batterie.note.endsWith(recette("matraque_fortune")!.note!));
  // Chaque plafond : la maîtrise donne une étoile de plus ; et les dégâts ne baissent jamais quand les étoiles montent.
  for (const [objet, p] of Object.entries(PLAFONDS_NIVEAU_1)) {
    if (p!.recette !== null) assert.equal(p!.maitrise, p!.recette + 1, objet);
    const degats = ([1, 2, 3, 4, 5] as const).map((n) => {
      const w = armeTirDe(objet);
      return w ? armeTirExemplaire(`${objet}#${n}`, w).degatsPlein : armeDeCle(`${objet}#${n}`)!.degatsTorse;
    });
    for (let i = 1; i < degats.length; i++) assert.ok(degats[i]! >= degats[i - 1]! - 1e-9, `${objet} : ${degats.join(" / ")}`);
  }
});

// ---------- Le martèlement face à un Équipé (plan 0.9 §3.3, chantier D) ----------

test("martèlement : face à un Errant, aucune saisie, avec chaque arme commune (comme avant la 0.9)", () => {
  for (const o of ARMES_MARTELEMENT) {
    const m = marteler(armeDeContact(o), false);
    assert.equal(m.saisies, 0, o);
    assert.equal(m.encaisses, 0, o);
  }
});

test("martèlement : face à un Équipé, il encaisse des coups et finit par saisir (au gourdin, au marteau)", () => {
  for (const o of ["gourdin", "marteau", "couteau"] as const) assert.ok(marteler(armeDeContact(o), true).encaisses > 0, o);
  for (const o of ["gourdin", "marteau"] as const) assert.ok(marteler(armeDeContact(o), true).saisies >= 1, o);
  // Avant la 0.9 (un coup sur 1), le martèlement le bloquait : aucune saisie.
  try {
    appliquerReglages({ equipe_vacille_un_sur: 1 });
    assert.equal(marteler(armeDeContact("gourdin"), true).saisies, 0);
  } finally {
    appliquerReglages({});
  }
  assert.match(martelementTexte(), /le gourdin/);
});
