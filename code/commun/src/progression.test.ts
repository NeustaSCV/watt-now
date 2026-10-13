// L'arbre de progression des recettes (0.7, réécrit pour la 0.8, chantier 2) : la table, les déclencheurs, la chaîne,
// le lieu de chaque recette (la construction seule), le filet par recette à la main, les silhouettes du niveau
// suivant, l'idée au ramassage d'une clé et l'indice en deux temps.

import { test } from "node:test";
import assert from "node:assert/strict";
import { RECETTES, recette } from "./recettes.ts";
import { lieuPossede } from "./lieu-recette.ts";
import { estObjet } from "./objets.ts";
import { QUETE } from "./quetes.ts";
import { FAMILLES, type Famille } from "./regles.ts";
import {
  CARTES_SPECIALES,
  ECHEANCES_TEMPS,
  FILET_SEUIL_MIN,
  PROGRESSION,
  TEXTE_VETERAN,
  aDevoiler,
  aLaConstruction,
  devoileesAuDepart,
  devoileesDEmblee,
  entrevues,
  autresAtteints,
  declencheurVrai,
  etapeAvecCle,
  etapesAvecCle,
  indicesOuverts,
  nouvellesIdees,
  progressionValide,
  silhouettes,
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

/** Les constructions : un feu de cette forme (et son niveau), plus d'autres installations. */
function terrain(forme: "feu_camp" | "foyer_pierres" | "foyer_cuisine" | "dakota" | null, autres: Record<string, number> = {}): Map<string, number> {
  const niveaux = { feu_camp: 1, foyer_pierres: 2, foyer_cuisine: 3, dakota: 1 } as const;
  const m = new Map<string, number>(Object.entries(autres));
  if (forme) {
    m.set("feu", niveaux[forme]);
    m.set(`feu:${forme}`, 1);
  }
  return m;
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
      if (d.a === "cle") assert.ok(etapeAvecCle(d.etape), `${id} : étape à clé ${d.etape}`);
    }
  }
});

test("plus de paliers : le filet ne porte que sur des recettes à la main (20 ou 60 min), et rythme les échéances", () => {
  const filets = Object.entries(PROGRESSION).filter(([, l]) => l.filet !== undefined);
  assert.ok(filets.length >= 10);
  for (const [id, l] of filets) {
    assert.equal(recette(id)!.lieu.genre, "main", id);
    assert.ok(l.filet === 20 || l.filet === 60, id);
  }
  assert.deepEqual(ECHEANCES_TEMPS, [20, 60, FILET_SEUIL_MIN]);
});

test("le lieu de chaque recette (chantier 1) : à la main, posée, ou à sa construction", () => {
  assert.deepEqual(recette("ficelle")!.lieu, { genre: "main" });
  assert.deepEqual(recette("abri")!.lieu, { genre: "posee" });
  assert.deepEqual(recette("lame_forgee_fer")!.lieu, { genre: "construction", construction: "forge" });
  assert.deepEqual(recette("glaive")!.lieu, { genre: "construction", construction: "forge", niveau: 2, accessoire: "bac" });
  const poelee = recette("cepes_poeles")!.lieu;
  assert.ok(poelee.genre === "construction" && poelee.construction === "feu" && poelee.formes?.includes("dakota") && !poelee.formes.includes("feu_camp"));
  // Le lieu, une construction et son accessoire.
  assert.ok(lieuPossede({ genre: "construction", construction: "feu", formes: ["foyer_cuisine"], accessoire: "marmite" }, new Map([["feu:foyer_cuisine", 1], ["feu+marmite", 1]])));
  assert.ok(!lieuPossede({ genre: "construction", construction: "feu", formes: ["foyer_cuisine"], accessoire: "marmite" }, new Map([["feu:foyer_cuisine", 1]])));
  assert.equal(aLaConstruction("Foyer de cuisine"), "Au foyer de cuisine");
  assert.equal(aLaConstruction("Forge ventilée"), "À la forge ventilée");
  assert.equal(aLaConstruction("Établi à étau"), "À l'établi à étau");
});

test("premier écran : le feu et l'abri, rien d'autre (Q3) ; sans construction, pas de silhouette", () => {
  assert.deepEqual(devoileesAuDepart().sort(), ["abri", "feu_de_camp"]);
  assert.deepEqual(aDevoiler(etat()), []);
  assert.deepEqual(silhouettes(etat()), []);
});

test("les silhouettes : le niveau suivant des constructions qu'on a (« Au foyer de cuisine : soupe de cèpes »)", () => {
  const camp = silhouettes(etat({ installations: terrain("feu_camp") }));
  const auFoyer = camp.filter((s) => s.ou === "Au foyer de pierres").map((s) => s.id);
  for (const id of ["cepes_poeles", "epieu", "fleches_durcies", "arc_simple"]) assert.ok(auFoyer.includes(id), id);
  assert.ok(!camp.some((s) => s.id === "soupe_cepes"), "deux niveaux plus haut : pas encore");
  const pierres = silhouettes(etat({ installations: terrain("foyer_pierres") }));
  assert.deepEqual(pierres.find((s) => s.id === "soupe_cepes"), { id: "soupe_cepes", ou: "Au foyer de cuisine" });
  // La forge posée : le bac de trempe ouvrira les lames d'acier. La forge ventilée (le glaive, la hache) est « plus
  // tard » depuis la 0.8 (chantier 7) : ses recettes ne sont pas des silhouettes.
  const forge = silhouettes(etat({ installations: terrain(null, { forge: 1 }), devoilees: new Set([...devoileesAuDepart(), "forge"]) }));
  assert.ok(forge.some((s) => s.id === "lame_forgee" && s.ou === "Au foyer de forge, avec un bac de trempe"), JSON.stringify(forge));
  assert.ok(!forge.some((s) => s.id === "glaive"), JSON.stringify(forge));
  // Le poste de montage (niveau 2) n'existe pas encore : ses recettes ne sont pas des silhouettes.
  const banc = silhouettes(etat({ famille: "voltaiques", installations: terrain(null, { banc_recharge: 1 }) }));
  assert.ok(!banc.some((s) => s.id === "electrificateur"));
  // Une recette dévoilée n'est plus une silhouette ; une autre famille n'en a pas.
  const voltaique = silhouettes(etat({ famille: "voltaiques", installations: terrain(null, { forge: 1 }) }));
  assert.ok(!voltaique.some((s) => s.id === "glaive"));
});

test("la silhouette de ce qu'une quête demande passe en tête, et sa construction se dévoile", () => {
  // « Forger une lame » demande la lame de ressort : elle attend la forge, qui se dévoile pour qu'on la pose.
  const e = etat({ quetes: new Set(["lame"]) });
  const d = apres(e);
  assert.ok(d.has("forge"));
  assert.ok(!d.has("lame_forgee"));
  const s = silhouettes({ ...e, devoilees: d });
  assert.equal(s[0]!.id, "lame_forgee");
  assert.equal(s[0]!.quete, true);
});

test("une recette liée à une construction est dévoilée par la construction seule ; la poêlée reste grisée au feu de camp", () => {
  // Les cèpes en main, la quête du repas : au feu de camp, la poêlée ne se dévoile pas (et les pommes, si).
  const camp = apres(etat({ installations: terrain("feu_camp"), vus: new Set(["cepe", "pomme"]), quetes: new Set(["repas"]) }));
  assert.ok(!camp.has("cepes_poeles"));
  assert.ok(camp.has("pommes_cuites"));
  // Le foyer de pierres : elle vient seule, sans cèpe ni quête, avec l'épieu et les flèches durcies.
  const pierres = apres(etat({ installations: terrain("foyer_pierres") }));
  for (const id of ["cepes_poeles", "epieu", "fleches_durcies", "arc_simple", "pommes_cuites"]) assert.ok(pierres.has(id), id);
  assert.ok(!pierres.has("soupe_cepes"));
  // Le Dakota fait la poêlée, pas l'épieu.
  const dakota = apres(etat({ installations: terrain("dakota") }));
  assert.ok(dakota.has("cepes_poeles") && !dakota.has("epieu"));
  // La forge posée dévoile tout ce qui s'y forge à son niveau, et seulement au Charbonnier.
  const forge = apres(etat({ installations: terrain(null, { forge: 1 }) }));
  for (const id of ["lame_forgee_fer", "machette_forgee_fer", "pinces_forge"]) assert.ok(forge.has(id), id);
  assert.ok(!forge.has("reforger_lame"), "la trempe attend le bac");
  assert.ok(apres(etat({ installations: terrain(null, { forge: 1, "forge+bac": 1 }) })).has("reforger_lame"));
  assert.ok(!forge.has("glaive"), "le glaive attend la forge ventilée");
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

test("le premier feu allumé fait penser au gourdin ; un Éteint vu, à l'épieu, qui attend le foyer de pierres", () => {
  assert.ok(apres(etat({ faits: { feu_allume: 1 } })).has("gourdin"));
  assert.ok(!apres(etat({ faits: { eteint_vu: 1 } })).has("epieu"));
  assert.ok(apres(etat({ faits: { eteint_vu: 1 }, installations: terrain("foyer_pierres") })).has("epieu"));
});

test("le seuil S ouvre l'atelier de sa famille ; ses recettes viennent avec l'atelier posé (Q9)", () => {
  // Un toit seul ne suffit pas : il faut aussi avoir surmonté un premier danger.
  assert.ok(!apres(etat({ installations: new Map([["abri", 1]]) })).has("forge"));
  const charbonnier = apres(etat({ installations: new Map([["abri", 1]]), faits: { "detruit:gourdin": 1 } }));
  assert.ok(charbonnier.has("forge"));
  assert.ok(!charbonnier.has("machette_forgee_fer"), "l'arme de métier attend la forge posée");

  const mecaniste = apres(etat({ famille: "mecanistes", installations: new Map([["abri", 1]]), faits: { nuit: 1 } }));
  assert.ok(mecaniste.has("pedalier") && !mecaniste.has("arbalete"));
  // L'établi posé : l'arbalète et ses pièces ; les variantes à matière rare attendent la trouvaille.
  const etabli = apres(etat({ famille: "mecanistes", devoilees: mecaniste, installations: new Map([["abri", 1], ["etabli", 1]]), faits: { nuit: 1 } }));
  for (const id of ["arbalete", "arbrier", "noix_bois", "arc_arbalete_frene", "arc_arbalete_ressort", "corde_arbalete"]) assert.ok(etabli.has(id), id);
  // La corde à la ceinture de sécurité (à la main) attend toujours sa trouvaille ; l'établi à étau, ses pièces.
  assert.ok(!etabli.has("corde_arbalete_ceinture") && !etabli.has("arbalete_lourde"));

  // Plan 0.8 (chantier 13) : « La famille » est l'étape 11 (index 10), après « La carte ».
  const voltaique = apres(etat({ famille: "voltaiques", tuto: 10 }));
  assert.ok(voltaique.has("banc_recharge") && !voltaique.has("matraque_fortune"), "la matraque se monte au banc");
  assert.ok(apres(etat({ famille: "voltaiques", tuto: 10, installations: new Map([["banc_recharge", 1]]) })).has("matraque_fortune"));
});

test("pendant le tutoriel, le seuil S attend l'étape « La famille » (l'Éteint du script ne compte pas)", () => {
  const abriEtEteint = { installations: new Map([["abri", 1]]), faits: { "detruit:hache": 1 } };
  assert.ok(!apres(etat({ ...abriEtEteint, tuto: 7 })).has("forge"));
  // « La carte » (index 9) passe avant « La famille » (index 10) : le seuil attend le retour de la station.
  assert.ok(!apres(etat({ ...abriEtEteint, tuto: 9 })).has("forge"));
  assert.ok(apres(etat({ ...abriEtEteint, tuto: 10 })).has("forge"));
  assert.ok(apres(etat({ installations: new Map([["abri", 1]]), faits: { nuit: 1 }, tuto: 3 })).has("forge"));
  assert.ok(apres(etat(abriEtEteint)).has("forge"));
});

test("le métier commence à l'atelier : une matière rare trouvée avant ne dévoile rien de sa famille", () => {
  const avant = apres(etat({ vus: new Set(["lame_ebrechee"]) }));
  assert.ok(!avant.has("reforger_lame") && !avant.has("forge"));
  assert.ok(apres(etat({ vus: new Set(["lame_ebrechee"]), installations: terrain(null, { forge: 1, "forge+bac": 1 }) })).has("reforger_lame"));
});

test("le Mécaniste pense au pédalier dès qu'il tient le cadre du vélo (§3.1)", () => {
  assert.ok(apres(etat({ famille: "mecanistes", vus: new Set(["cadre_velo"]) })).has("pedalier"));
});

test("le filet du temps, par recette à la main : 20 min, puis 60 min, puis le métier ; jamais ce qui se pose ni ce qui se fait à une construction", () => {
  const vingt = apres(etat({ minutes: 20 }));
  for (const id of ["ficelle", "corde", "volaille"]) assert.ok(vingt.has(id), id);
  assert.ok(!vingt.has("gourdin") && !vingt.has("lit_branchages") && !vingt.has("cepes_poeles"));
  const soixante = apres(etat({ minutes: 60 }));
  for (const id of ["gourdin", "lance", "arc_fortune", "pansement", "travois"]) assert.ok(soixante.has(id), id);
  // R13 (0.8.2) : la hache se remmanche à l'établi ; c'est lui qui la dévoile.
  assert.ok(!soixante.has("forge") && !soixante.has("epieu") && !soixante.has("coffre") && !soixante.has("hache"));
  const seuil = apres(etat({ minutes: FILET_SEUIL_MIN }));
  assert.ok(seuil.has("forge"));
  assert.ok(!seuil.has("glaive") && !seuil.has("pinces_forge"));
});

test("le rythme : un quart d'heure de premiers gestes dévoile déjà six cartes ou plus", () => {
  // Ramassé, feu allumé, la caisse à outils fouillée (tête de hache), des joncs, la hache remmanchée.
  const d = apres(etat({ vus: new Set(["branche", "pierre", "fibres", "tete_hache", "chiffons", "hache"]), faits: { feu_allume: 1, "fabrique:hache": 1 }, tuto: 5, installations: terrain("feu_camp") }));
  assert.ok(d.size >= 6, `${d.size} cartes : ${[...d].join(", ")}`);
});

test("les autres familles : jamais dévoilées sans leçon ni manuel ; vues grisées après le Comptoir", () => {
  const sans = apres(etat({ minutes: 10_000, vus: new Set(["ressort_retrempe", "rivet", "pointe_acier"]), faits: { "visite:comptoir": 1 } }));
  for (const id of sans) assert.ok(recette(id)?.famille !== "mecanistes" && recette(id)?.famille !== "voltaiques", id);
  assert.ok(!autresAtteints({ famille: "charbonniers", faits: {} }));
  assert.ok(autresAtteints({ famille: "charbonniers", faits: { "visite:comptoir": 1 } }));
  assert.ok(autresAtteints({ famille: "charbonniers", faits: { "rencontre:voltaiques": 1 } }));
  assert.ok(!autresAtteints({ famille: "charbonniers", faits: { "rencontre:charbonniers": 1 } }));
  // Une leçon dévoile ce qu'elle apprend ; tenir le produit d'une autre famille déplie sa recette.
  assert.ok(apres(etat({ savoir: { apprises: ["arbalete"] } })).has("arbalete"));
  assert.ok(entrevues(etat({ vus: new Set(["module_decharge"]) })).includes("module_decharge"));
});

test("voir faire (Q7) dévoile une recette de sa famille ou commune", () => {
  assert.ok(apres(etat({ faits: { "vu_faire:gourdin": 1, vu_faire: 1 } })).has("gourdin"));
});

test("le vétéran (Q8, plan 0.8) : les recettes communes à la main, ni ce qui se pose, ni ce qui se fait à une construction", () => {
  for (const f of FAMILLES) {
    const d = new Set(devoileesDEmblee(f as Famille));
    assert.ok(d.has("gourdin") && d.has("ficelle") && d.has("lance"), f);
    // R13 (0.8.2) : la hache se remmanche à l'établi, elle vient avec lui.
    assert.ok(!d.has("hache") && !d.has("marteau"), f);
    assert.ok(!d.has("lit_branchages") && !d.has("foyer_dakota") && !d.has("cepes_poeles") && !d.has("epieu"), f);
    assert.ok(!d.has("forge") && !d.has("banc_recharge") && !d.has("pedalier") && !d.has("matraque_fortune") && !d.has("corde_arbalete"), f);
  }
  assert.match(TEXTE_VETERAN, /Ta famille t'attend à la station\.$/);
  assert.ok(TEXTE_VETERAN.length <= 110);
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
  // Les noms de la 0.8 (recette finale) : jamais « banc de recharge » ni « le pédalier » tout court.
  assert.equal(texteDevoilement(["banc_recharge"], "voltaiques"), "Ton métier commence : le banc solaire t'attend dans Fabriquer.");
  assert.equal(texteDevoilement(["pedalier"], "mecanistes"), "Ton métier commence : le pédalier générateur t'attend dans Fabriquer.");
});

test("un état illisible ou trafiqué est nettoyé (rien d'inconnu, rien de négatif), idées et indices compris", () => {
  const e = progressionValide({
    devoilees: ["abri", "abri", "inconnue", 3],
    nonVues: ["abri", "gourdin"],
    vus: ["fibres"],
    secondes: -5,
    idees: ["foyer_cuisine", "foyer_cuisine", 4],
    indices: { foyer_cuisine: { depuis: 30, temps: 2 }, faux: { depuis: "x", temps: 1 }, autre: { depuis: 1, temps: 3 } },
  });
  assert.deepEqual(e.devoilees, ["abri"]);
  assert.deepEqual(e.nonVues, ["abri"]);
  assert.equal(e.secondes, 0);
  assert.deepEqual(e.idees, ["foyer_cuisine"]);
  assert.deepEqual(e.indices, { foyer_cuisine: { depuis: 30, temps: 2 } });
  assert.deepEqual(progressionValide(null).devoilees, []);
  assert.deepEqual(progressionValide({ devoilees: [] }).idees, []);
});

// ---------- Les clés : l'idée au ramassage, l'indice en deux temps ----------

test("chaque clé posée a ses textes : l'idée, « un jour », et deux temps d'indice courts", () => {
  const cles = etapesAvecCle();
  assert.ok(cles.some((x) => x.etape.id === "foyer_cuisine"), "la clé du foyer de cuisine (posée pour les tests)");
  for (const { etape } of cles) {
    const c = etape.cle;
    // Une clé d'un niveau « plus tard » peut n'être qu'un nom (son objet n'existe pas encore : la porte de four).
    const genres = [c.objet, c.qualite, etape.aVenir ? c.nom : undefined].filter((x) => x !== undefined);
    assert.equal(genres.length, 1, `${etape.id} : un ingrédient ou un outil, jamais les deux`);
    if (c.objet) assert.ok(estObjet(c.objet), `${etape.id} : ${c.objet}`);
    assert.ok(c.idee.length > 10 && c.idee.length <= 110, etape.id);
    assert.ok(c.indice.every((t) => t.length > 5 && t.length <= 70), etape.id);
  }
});

test("le grillage ramassé sans foyer de pierres : l'idée gardée « un jour » ; avec le foyer, « tu y penses » ; jamais deux fois", () => {
  const vus = new Set(["grillage_rouleau"]);
  const tot = nouvellesIdees({ vus, installations: terrain("feu_camp"), idees: new Set(), inventaire: { grillage_rouleau: 1 } });
  assert.deepEqual(tot, [{ etape: "foyer_cuisine", plusTard: true, texte: "Ce grillage pourra servir à ton feu, un jour.", objet: "grillage_rouleau" }]);
  const aPoint = nouvellesIdees({ vus, installations: terrain("foyer_pierres"), idees: new Set(), inventaire: {} });
  assert.equal(aPoint[0]!.plusTard, false);
  assert.equal(aPoint[0]!.texte, "Ce grillage, posé sur ton foyer, ferait une grille. Tu y penses.");
  // L'idée est gardée : au second ramassage, rien.
  assert.deepEqual(nouvellesIdees({ vus, installations: terrain("foyer_pierres"), idees: new Set(["foyer_cuisine"]), inventaire: { grillage_rouleau: 1 } }), []);
  // Sans le grillage, aucune idée.
  assert.deepEqual(nouvellesIdees({ vus: new Set(["pierre"]), installations: terrain("foyer_pierres"), idees: new Set(), inventaire: {} }), []);
  // Le déclencheur « cle » suit l'idée gardée.
  assert.ok(declencheurVrai({ a: "cle", etape: "foyer_cuisine" }, etat({ idees: new Set(["foyer_cuisine"]) })));
  assert.ok(!declencheurVrai({ a: "cle", etape: "foyer_cuisine" }, etat()));
});

test("l'indice s'ouvre quand l'étape devient le niveau suivant d'une construction qu'on a, et se ferme avec l'idée", () => {
  const ouverts = (installations: Map<string, number>, idees: string[] = []) =>
    indicesOuverts({ installations, devoilees: new Set(devoileesAuDepart()), idees: new Set(idees) }).map((x) => x.etape.id);
  assert.ok(!ouverts(terrain("feu_camp")).includes("foyer_cuisine"), "deux niveaux plus haut : pas encore");
  assert.ok(ouverts(terrain("foyer_pierres")).includes("foyer_cuisine"));
  assert.ok(!ouverts(terrain("foyer_pierres"), ["foyer_cuisine"]).includes("foyer_cuisine"), "la clé déjà en poche");
  assert.ok(!ouverts(terrain("foyer_cuisine")).includes("foyer_cuisine"), "déjà bâti");
});
