// Tests du chantier 5 de la 0.6 : les Charbonniers (Book 25 §4) — la gamme des lames, la qualité par le maillon
// faible, la trempe, la forge ventilée et ses accessoires, la réparation et le reforgeage.

import { test } from "node:test";
import { toutDevoile } from "../../commun/src/progression.ts";
import assert from "node:assert/strict";
import { ARMES, DEBRIS_ARME, MATIERE_ARME, armeDeCle } from "../../commun/src/combat.ts";
import { OBJETS_DE_METIER } from "../../commun/src/etoiles.ts";
import { etoilesForge, facteursLame, forgeProche, trempeDisponible } from "../../commun/src/forge.ts";
import { LIGNEES_INSTALLATIONS } from "../../commun/src/lignees.ts";
import type { InstallationVue, MessageServeur, Verbe } from "../../commun/src/messages.ts";
import type { Famille } from "../../commun/src/regles.ts";
import { etoilesDuProduit, recette, recetteHorsFamille, recettesConnues } from "../../commun/src/recettes.ts";
import { LAMES_TREMPEES, RECETTES_CHARBONNIERS, RECETTE_REFORGER } from "../../commun/src/recettes/charbonniers.ts";
import { messageValide } from "./controle.ts";
import { Base } from "./base.ts";
import { Forge, type ContexteForge } from "./forge.ts";
import { Halte } from "./halte.ts";
import { nouvelEteint } from "../../commun/src/eteints.ts";
import { DUREE_VOYAGE_S, SORTIE_TERRAIN } from "../../commun/src/lieux.ts";
import { Joueur } from "./joueur.ts";
import type { Inventaire } from "../../commun/src/objets.ts";

/** Un joueur sur son terrain, à côté d'une forge posée devant lui (alea à 1 : aucune lame ne se fend, aucun Éteint). */
function monter(famille: Famille, inventaire: Inventaire, forge: { niveau?: number; etat?: InstallationVue["etat"] } | null = {}, alea: () => number = () => 1, avant?: (base: Base, compteId: number) => void) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Nadia", "enclume42", famille);
  // Ces tests portent sur le métier, pas sur l'arbre de progression : tout est dévoilé.
  base.sauverProgression(compte.id, toutDevoile(famille));
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
  avant?.(base, compte.id);
  let id = 0;
  if (forge) {
    id = base.ajouterInstallation(compte.id, "forge", 20, 21.5, 0).id;
    if (forge.niveau) base.sauverNiveauInstallation(compte.id, id, forge.niveau);
    if (forge.etat) base.sauverEtatInstallation(compte.id, id, forge.etat);
  }
  let instant = base.debutMonde() + 60_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), alea);
  joueur.position = { x: 20, z: 20, o: 0 };
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const sac = () => base.chargerInventaire(compte.id);
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  const fabriquer = (r: string, secondes = 20) => {
    joueur.recevoir({ t: "fabriquer", recette: r });
    attendre(secondes);
  };
  const utiliser = (verbe: Verbe, secondes = 12) => {
    joueur.recevoir({ t: "interagir", cible: { genre: "installation", id }, verbe });
    attendre(secondes);
  };
  const laForge = () => base.chargerInstallations(compte.id).find((i) => i.id === id)!;
  return { base, compte, joueur, attendre, sac, infos, fabriquer, utiliser, laForge, recus };
}

/** Une forge vue d'à côté, pour les règles pures. */
const contexte = (niveau = 1, etat: InstallationVue["etat"] = {}) => ({ installations: [{ type: "forge" as const, niveau, etat }] });

// ---------- Les armes et les recettes ----------

test("🔥 la gamme : six lames de métier, la machette forgée solide, toutes réparables et reforgeables", () => {
  for (const o of ["lame_forgee", "hachette", "serpe", "machette_forgee", "hache_forgee", "glaive"] as const) {
    const a = ARMES.find((x) => x.objet === o);
    assert.ok(a, o);
    assert.equal(a.metier, true, o);
    assert.equal(OBJETS_DE_METIER[o], 3, `${o} : ★★★ de base`);
    assert.equal(MATIERE_ARME[o], "lame", o);
    assert.equal(DEBRIS_ARME[o], "lame_ebrechee", o);
  }
  assert.equal(armeDeCle("machette_forgee")!.solidite, 80);
  assert.equal(armeDeCle("machette")!.solidite, 40, "la machette de fortune, deux fois moins solide");
  assert.equal(armeDeCle("lame_forgee")!.nom, "le couteau de forge");
  // Aucune lame nouvelle ne dépasse la masse en dégâts par coup (Book 25 §8.1).
  const masse = armeDeCle("masse")!.degatsTorse;
  for (const o of ["hachette", "serpe", "machette_forgee", "hache_forgee", "glaive", "lance_forgee"]) assert.ok(armeDeCle(o)!.degatsTorse < masse, o);
  // Un glaive ★★ casse bien plus tôt qu'un glaive ★★★★★.
  assert.ok(armeDeCle("glaive#2")!.solidite * 2 < armeDeCle("glaive#5")!.solidite);
});

test("🔥 toutes les recettes de la forge sont des Charbonniers, ont une catégorie, et la gamme se fait seul", () => {
  for (const r of RECETTES_CHARBONNIERS) {
    assert.equal(r.famille, "charbonniers", r.id);
    assert.ok(r.categorie, r.id);
  }
  const connues = new Set(recettesConnues("charbonniers").map((r) => r.id));
  for (const id of ["pinces_forge", "lame_forgee", "hachette", "hache_forgee", "machette_forgee", "serpe", "glaive", "pointe_lance", "pointe_acier", "rivet", "ciseau_bois", "ressort_retrempe", "electrodes_forgees", RECETTE_REFORGER]) {
    assert.ok(connues.has(id), id);
  }
  // Les autres familles ne les connaissent pas sans leçon ni manuel.
  assert.ok(!recettesConnues("voltaiques").some((r) => r.id === "machette_forgee"));
  // Le fer doux ne prend pas la trempe : il ne se fend jamais.
  assert.ok(LAMES_TREMPEES.has("machette_forgee"));
  assert.ok(!LAMES_TREMPEES.has("machette_forgee_fer"));
});

test("🔥 la lignée de la forge : le foyer, puis la forge ventilée (bâtie seul, au soufflet double)", () => {
  const l = LIGNEES_INSTALLATIONS.forge!;
  assert.equal(l.length, 2);
  assert.deepEqual(l[0]!.couts[0], recette("forge")!.ingredients, "le niveau 1 coûte ce que coûte sa recette");
  assert.equal(l[1]!.id, "forge_ventilee");
  assert.equal(l[1]!.famille, "charbonniers");
  assert.ok(l[1]!.couts.some((c) => c.chiffons), "sans bâche, des chiffons");
});

// ---------- La qualité : le maillon faible ----------

test("🔥 les maillons : le foyer et le marteau ★★, les pinces et une enclume ★★★, ventilée ★★★★, le rail ★★★★★", () => {
  assert.equal(etoilesForge({}, forgeProche(contexte())), 2);
  assert.equal(etoilesForge({ pinces_forge: 1 }, forgeProche(contexte())), 2, "les pinces sans enclume");
  assert.equal(etoilesForge({}, forgeProche(contexte(1, { enclume: "etau" }))), 2, "l'enclume sans les pinces");
  assert.equal(etoilesForge({ pinces_forge: 1 }, forgeProche(contexte(1, { enclume: "etau" }))), 3);
  assert.equal(etoilesForge({ pinces_forge: 1 }, forgeProche(contexte(2))), 4);
  assert.equal(etoilesForge({ pinces_forge: 1 }, forgeProche(contexte(2, { enclume: "rail" }))), 5);
  assert.equal(trempeDisponible({}, null).genre, "eau");
  assert.equal(trempeDisponible({ graisse: 1 }, null).genre, "huile");
  assert.equal(trempeDisponible({}, forgeProche(contexte(1, { bac: true, huile: 3 }))).genre, "huile");
  // Le fer doux ne se juge pas à la trempe.
  assert.deepEqual(facteursLame(2, {}, contexte()), [2, 2]);
});

test("🔥 hors famille, jamais plus de ★★, même avec la meilleure forge du monde", () => {
  const r = recetteHorsFamille(recette("lame_forgee_lime")!);
  const meilleure = contexte(2, { enclume: "rail", bac: true, huile: 5 });
  assert.equal(etoilesDuProduit(recette("lame_forgee_lime")!, { pinces_forge: 1 }, { contexte: meilleure }), 4, "lime, rail, huile : ★★★★ (★★★★★ maîtrisée)");
  assert.equal(etoilesDuProduit(recette("lame_forgee_lime")!, { pinces_forge: 1 }, { contexte: meilleure, maitrise: true }), 5);
  assert.equal(etoilesDuProduit(r, { pinces_forge: 1 }, { contexte: meilleure, horsFamille: true, maitrise: true }), 2);
});

test("🔥 un Charbonnier seul : ressort, eau, foyer et bac de trempe, marteau → un couteau ★★", () => {
  // Plan 0.8 : l'acier se trempe au bac de trempe (le lieu de la recette) ; sans lui, la recette est refusée.
  const sans = monter("charbonniers", { marteau: 1, ressort_lames: 1, charbon_bois: 1, branche: 1 });
  sans.fabriquer("lame_forgee");
  assert.match(sans.infos().at(-1)!, /Il te faut un bac de trempe/);
  const t = monter("charbonniers", { marteau: 1, ressort_lames: 1, charbon_bois: 1, branche: 1 }, { etat: { bac: true } });
  t.fabriquer("lame_forgee");
  assert.match(t.infos().join(" "), /Trempe à l'eau : une lame sur trois se fend/, "le risque est dit avant le geste");
  assert.equal(t.sac()["lame_forgee#2"], 1);
  assert.equal(t.sac().ressort_lames, undefined);
});

test("🔥 avec les pinces et un étau posé en enclume, la machette forgée monte à ★★★", () => {
  const t = monter("charbonniers", { marteau: 1, pinces_forge: 1, etau: 1, ressort_lames: 2, charbon_bois: 2, branche: 1, ficelle: 1 }, { etat: { bac: true } });
  t.utiliser("poser_enclume");
  assert.equal(t.laForge().etat.enclume, "etau");
  assert.equal(t.sac().etau, undefined, "l'étau est sur la forge");
  t.fabriquer("machette_forgee");
  assert.equal(t.sac().machette_forgee, 1, "★★★ : la clé nue");
});

test("🔥 un manche tourné ⚙️ donne une étoile de plus ; le fer doux plafonne à ★★", () => {
  const t = monter("charbonniers", { marteau: 1, pinces_forge: 1, barre_metal: 2, charbon_bois: 2, branche: 1, ficelle: 1, manche_tourne: 1 }, { etat: { enclume: "etau" } });
  t.fabriquer("machette_forgee_fer");
  // Fer doux ★★, forge ★★★ : ★★ ; le manche tourné : ★★★.
  assert.equal(t.sac().machette_forgee, 1);
  assert.equal(t.sac().manche_tourne, undefined);
});

// ---------- La trempe ----------

/** Une forge sans joueur, pour juger la trempe sur beaucoup de lames (graine fixe). */
function forgeSeule(sac: Inventaire, forge: Partial<InstallationVue> | null = null, graine = 7) {
  let x = graine;
  const alea = () => ((x = (x * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
  const monde = new Map<string, unknown>();
  const infos: string[] = [];
  const installations: InstallationVue[] = forge ? [{ id: 1, type: "forge", x: 0, z: 0, o: 0, etat: {}, ...forge }] : [];
  const ctx: ContexteForge = {
    id: 1,
    alea,
    inventaire: () => sac,
    retirer: (cle, n) => {
      sac[cle] = (sac[cle] ?? 0) - n;
      if (!sac[cle]) delete sac[cle];
    },
    ajouter: (o) => {
      for (const [k, n] of Object.entries(o)) sac[k as keyof Inventaire] = (sac[k as keyof Inventaire] ?? 0) + (n ?? 0);
    },
    installationsProches: () => installations,
    majInstallation: () => {},
    faits: () => 0,
    info: (t) => infos.push(t),
    commencer: (_l, _d, f) => f(),
    lire: <T,>(cle: string) => (monde.get(cle) as T) ?? null,
    ecrire: (cle, v) => monde.set(cle, JSON.parse(JSON.stringify(v))),
  };
  return { forge: new Forge(ctx), sac, infos, installations, monde };
}

test("🔥 la trempe à l'eau fend une lame sur trois (graine fixe) ; à l'huile, aucune", () => {
  const r = recette("lame_forgee")!;
  const { forge } = forgeSeule({}, { niveau: 1 });
  let fendues = 0;
  const N = 600;
  for (let k = 0; k < N; k++) if (forge.sortie(r, "lame_forgee", 2, 1, false).lame_ebrechee) fendues++;
  assert.ok(Math.abs(fendues / N - 1 / 3) < 0.05, `${fendues} sur ${N}`);
  // Chaque lame fendue est gardée en mémoire : elle se reforgera en couteau.
  assert.equal(forge.lamesEbrechees().length, Math.min(30, fendues));
  // À l'huile (le bac), aucune ne se fend, et chaque trempe prend une mesure d'huile.
  const huile = forgeSeule({}, { niveau: 1, etat: { bac: true, huile: 20 } });
  for (let k = 0; k < 20; k++) assert.deepEqual(huile.forge.sortie(r, "lame_forgee", 2, 1, false), { "lame_forgee#2": 1 });
  assert.equal(huile.installations[0]!.etat.huile, undefined, "le bac est vide après vingt trempes");
  // La graisse du sac : une trempe.
  const graisse = forgeSeule({ graisse: 1 }, { niveau: 1 });
  graisse.forge.sortie(r, "lame_forgee", 2, 1, false);
  assert.equal(graisse.sac.graisse, undefined);
});

test("🔥 une lame fendue à la trempe tombe en lame ébréchée, sur le joueur aussi (jamais de disparition totale)", () => {
  // alea à 0 : la trempe fend toujours (et les Éteints restent loin : le terrain n'en fait venir que s'ils entendent).
  const t = monter("charbonniers", { marteau: 1, ressort_lames: 1, charbon_bois: 1, branche: 1 }, { etat: { bac: true } }, () => 0);
  t.fabriquer("lame_forgee");
  const inv = t.sac();
  assert.equal(inv.lame_ebrechee, 1);
  assert.equal(inv.lame_forgee, undefined);
  assert.equal(inv["lame_forgee#2"], undefined);
  assert.match(t.infos().join(" "), /fendue à la trempe/);
});

test("🔥 le ressort retrempé ne se fait qu'à l'huile ; le bac de trempe et le bidon la donnent", () => {
  const t = monter("charbonniers", { marteau: 1, ressort_lames: 2, charbon_bois: 2, casserole: 1, bidon_huile: 1 });
  t.fabriquer("ressort_retrempe");
  assert.match(t.infos().at(-1)!, /à l'huile/);
  assert.equal(t.sac().ressort_retrempe, undefined);
  t.utiliser("verser_huile");
  assert.match(t.infos().at(-1)!, /bac de trempe/, "pas de bac, pas d'huile");
  t.utiliser("poser_bac");
  t.utiliser("verser_huile");
  assert.equal(t.laForge().etat.huile, 20);
  t.fabriquer("ressort_retrempe");
  assert.equal(t.sac().ressort_retrempe, 1);
  assert.equal(t.laForge().etat.huile, 19);
});

// ---------- La forge ventilée ----------

test("🔥 la hache forgée attend la forge ventilée ; le Charbonnier la bâtit seul, puis pompe (sauf ventilateur ⚡)", () => {
  const t = monter("charbonniers", { marteau: 1, pinces_forge: 1, barre_metal: 2, ressort_lames: 1, charbon_bois: 2, buche: 1, bache: 1, pierre: 6, graisse: 1, ventilateur_forge: 1 }, { etat: { bac: true } });
  t.fabriquer("hache_forgee");
  assert.match(t.infos().at(-1)!, /forge ventilée/);
  t.utiliser("ameliorer", 10);
  assert.equal(t.laForge().niveau, 2);
  t.utiliser("monter_ventilateur");
  assert.equal(t.laForge().etat.ventilateur, true);
  t.fabriquer("hache_forgee");
  // Ressort ★★★★, huile ★★★★, ventilée et pinces ★★★★.
  assert.equal(t.sac()["hache_forgee#4"], 1);
});

test("🔥 le glaive : la forge ventilée et la maîtrise du couteau (dix forgés)", () => {
  const t = monter("charbonniers", { marteau: 1, ressort_lames: 3, charbon_bois: 3, branche: 1, rivet: 2 }, { niveau: 2, etat: { bac: true } });
  t.fabriquer("glaive");
  assert.match(t.infos().at(-1)!, /maîtriser le couteau/);
  assert.equal(t.sac().ressort_lames, 3);
});

test("🔥 démonter la forge rend ses accessoires entiers", () => {
  assert.deepEqual(Forge.accessoiresRendus({ type: "forge", etat: { enclume: "rail", bac: true, huile: 4, ventilateur: true } }), { troncon_rail: 1, casserole: 1, ventilateur_forge: 1 });
  assert.deepEqual(Forge.accessoiresRendus({ type: "pedalier", etat: { meule: true } }), {});
});

// ---------- Réparer et reforger (décision 8 : les deux) ----------

test("🔥 un Charbonnier seul répare sa machette forgée à la forge, pour un kilo de charbon", () => {
  const t = monter("charbonniers", { "machette_forgee#4": 1, charbon_bois: 1 }, {}, () => 1, (base, id) => base.sauverUsure(id, { "machette_forgee#4": 10 }));
  t.joueur.recevoir({ t: "reparer", objet: "machette_forgee#4", fortune: false });
  t.attendre(20);
  const u = t.recus.findLast((m) => m.t === "usure") as Extract<MessageServeur, { t: "usure" }>;
  assert.equal(u.evenement?.etat, "reparee");
  assert.equal(u.usure["machette_forgee#4"], undefined, "comme neuve");
  assert.equal(t.sac().charbon_bois, undefined);
});

test("🔥 la lame ébréchée se reforge en la même arme, une étoile de moins ; d'origine inconnue, un couteau", () => {
  // La forge se souvient d'une machette ★★★★ cassée.
  const t = monter("charbonniers", { marteau: 1, lame_ebrechee: 2, charbon_bois: 2 }, { etat: { bac: true } }, () => 1, (base, id) => base.ecrireMonde(`forge:${id}`, { ebrechees: ["machette_forgee#4"] }));
  t.fabriquer(RECETTE_REFORGER);
  assert.equal(t.sac().machette_forgee, 1, "★★★★ − 1 = ★★★");
  assert.match(t.infos().join(" "), /redevient machette forgée/);
  // La mémoire est vide : la seconde donne un couteau de forge (acier ★★★, foyer ★★ : ★★).
  t.fabriquer(RECETTE_REFORGER);
  assert.equal(t.sac()["lame_forgee#2"], 1);
  assert.equal(t.sac().lame_ebrechee, undefined);
});

test("🔥 une machette forgée qui casse au combat laisse une lame ébréchée dont la forge se souvient", () => {
  const base = new Base(":memory:");
  const halte = new Halte(base, () => 0.5);
  const compte = base.creerCompte("Nadia", "enclume42", "charbonniers");
  // Ces tests portent sur le métier, pas sur l'arbre de progression : tout est dévoilé.
  base.sauverProgression(compte.id, toutDevoile("charbonniers"));
  base.sauverInventaire(compte.id, { sac_a_dos: 1, "machette_forgee#4": 1 });
  base.sauverUsure(compte.id, { "machette_forgee#4": 1 });
  let instant = 1_000_000;
  const joueur = new Joueur(compte, base, () => {}, () => instant, halte, () => 0.5);
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
  halte.eteints = [nouvelEteint(9, 40, 35.6, "poursuivant")];
  joueur.position = { x: 40, z: 34.6, o: 0 };
  joueur.recevoir({ t: "frapper", appuye: false });
  attendre(0.9);
  const sac = base.chargerInventaire(compte.id);
  assert.equal(sac["machette_forgee#4"], undefined, "elle a cassé");
  assert.equal(sac.lame_ebrechee, 1);
  assert.deepEqual(base.lireMonde<{ ebrechees: string[] }>(`forge:${compte.id}`)?.ebrechees, ["machette_forgee#4"]);
});

test("🔥 la forge se souvient des lames cassées, la dernière d'abord ; hors famille, ★★ au plus", () => {
  const { forge } = forgeSeule({});
  forge.noterDebris("glaive#5");
  forge.noterDebris("hachette#2");
  assert.deepEqual(forge.lamesEbrechees(), ["glaive#5", "hachette#2"]);
  const r = recette(RECETTE_REFORGER)!;
  assert.deepEqual(forge.sortie(r, "lame_forgee", 2, 1, false), { "hachette#1": 1 });
  assert.deepEqual(forge.sortie(r, "lame_forgee", 2, 1, true), { "glaive#2": 1 }, "★★★★★ − 1, plafonné à ★★ hors famille");
});

// ---------- Le contrôle des messages ----------

test("🔥 les gestes de la forge passent le contrôle des messages", () => {
  for (const verbe of ["poser_enclume", "poser_bac", "verser_huile", "monter_ventilateur"]) {
    assert.ok(messageValide({ t: "interagir", cible: { genre: "installation", id: 3 }, verbe }), verbe);
  }
});
