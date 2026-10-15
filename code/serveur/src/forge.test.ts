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
  // Au niveau 1 (la forge fait ★★), aucune lame ne dépasse la masse en dégâts par coup (Book 25 §8.1) ; au-delà, les
  // dégâts suivent la bande de l'étape de l'étoile (plan 0.8 §2.4 : 2 à 3 à L2).
  const masse = armeDeCle("masse")!.degatsTorse;
  for (const o of ["hachette#2", "serpe#2", "machette_forgee#2", "lame_forgee#2", "lance_forgee"]) assert.ok(armeDeCle(o)!.degatsTorse < masse, o);
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

test("🔥 la lignée de la forge : le foyer (clé : l'enclume de dépanneur), puis la forge ventilée (0.10)", () => {
  const l = LIGNEES_INSTALLATIONS.forge!;
  assert.equal(l.length, 2);
  assert.deepEqual(l[0]!.couts[0], recette("forge")!.ingredients, "le niveau 1 coûte ce que coûte sa recette");
  assert.equal(l[0]!.cle?.objet, "enclume_depanneur");
  assert.equal(l[0]!.cle?.ou, "H1A");
  // Sans enclume, la grosse pierre plate : le foyer forge quand même, à ★ (ce n'est pas un repli de sa clé, plan 0.10).
  assert.match(l[0]!.apporte, /pierre plate/);
  // Le mot « soufflet » est réservé à la clé de la forge ventilée (Q-0.8-13).
  for (const t of [l[0]!.nom, l[0]!.apporte, l[0]!.examen]) assert.ok(!/soufflet/i.test(t), t);
  assert.equal(l[1]!.id, "forge_ventilee");
  assert.equal(l[1]!.famille, "charbonniers");
  // Plan 0.10 (chantier C) : jouable, avec le soufflet de forge (la récupération, N2-17), sans repli.
  assert.equal(l[1]!.aVenir, undefined);
  assert.ok(/soufflet de forge/.test(l[1]!.apporte));
  assert.deepEqual(l[1]!.couts, [{ pierre: 3, glaise: 2, barre_metal: 1, soufflet_forge: 1 }]);
  assert.equal(l[1]!.cle?.objet, "soufflet_forge");
});

// ---------- La qualité : le maillon faible ----------

test("🔥 les maillons (plan 0.8) : la pierre plate ★, le foyer sur une enclume ★★, ventilée ★★★, le rail ★★★★★", () => {
  assert.equal(etoilesForge({}, null), 1, "sans forge, un feu et une pierre");
  assert.equal(etoilesForge({}, forgeProche(contexte())), 1, "la grosse pierre plate du foyer (Q-0.8-1)");
  assert.equal(etoilesForge({ pinces_forge: 1 }, forgeProche(contexte())), 1, "les pinces n'y changent rien");
  for (const enclume of ["depanneur", "etau", "masse"] as const) {
    assert.equal(etoilesForge({}, forgeProche(contexte(1, { enclume }))), 2, enclume);
    assert.equal(etoilesForge({ pinces_forge: 1 }, forgeProche(contexte(1, { enclume }))), 2, `${enclume} et les pinces : plus ★★★ (P1, Q-A6)`);
  }
  assert.equal(etoilesForge({}, forgeProche(contexte(2))), 2, "ventilée sans pinces");
  assert.equal(etoilesForge({ pinces_forge: 1 }, forgeProche(contexte(2))), 3, "ventilée et pinces (Q-A2d)");
  assert.equal(etoilesForge({ pinces_forge: 1 }, forgeProche(contexte(2, { enclume: "rail" }))), 5);
  assert.equal(trempeDisponible({}, null).genre, "eau");
  assert.equal(trempeDisponible({ graisse: 1 }, null).genre, "huile");
  assert.equal(trempeDisponible({}, forgeProche(contexte(1, { bac: true, huile: 3 }))).genre, "huile");
  // Le fer doux ne se juge pas à la trempe.
  assert.deepEqual(facteursLame(2, {}, contexte(1, { enclume: "depanneur" })), [2, 2]);
  // La trempe à l'eau (★★★) ne dépasse pas le maillon de la forge : un ressort au foyer reste à ★★.
  assert.equal(Math.min(...facteursLame(4, {}, contexte(1, { enclume: "depanneur", bac: true }))), 2);
});

test("🔥 le maillon faible au foyer : une machette sur l'enclume de dépanneur ★★, ★★★ maîtrisée ; sur la pierre plate ★", () => {
  const depanneur = contexte(1, { enclume: "depanneur", bac: true });
  const pierre = contexte(1, { bac: true });
  for (const id of ["machette_forgee", "machette_forgee_fer", "hachette", "lame_forgee_fer", "serpe"]) {
    const r = recette(id)!;
    assert.equal(etoilesDuProduit(r, { pinces_forge: 1 }, { contexte: depanneur }), 2, id);
    assert.equal(etoilesDuProduit(r, { pinces_forge: 1 }, { contexte: depanneur, maitrise: true }), 3, `${id} maîtrisée`);
    assert.equal(etoilesDuProduit(r, {}, { contexte: pierre }), 1, `${id} sur la pierre plate`);
  }
  // Un étau posé sur la forge ne donne plus ★★★ (Q-A6).
  assert.equal(etoilesDuProduit(recette("machette_forgee")!, { pinces_forge: 1, graisse: 1 }, { contexte: contexte(1, { enclume: "etau", bac: true }) }), 2);
});

test("🔥 hors famille, jamais plus de ★★, même avec la meilleure forge du monde", () => {
  const r = recetteHorsFamille(recette("lame_forgee_lime")!);
  const meilleure = contexte(2, { enclume: "rail", bac: true, huile: 5 });
  assert.equal(etoilesDuProduit(recette("lame_forgee_lime")!, { pinces_forge: 1 }, { contexte: meilleure }), 4, "lime, rail, huile : ★★★★ (★★★★★ maîtrisée)");
  assert.equal(etoilesDuProduit(recette("lame_forgee_lime")!, { pinces_forge: 1 }, { contexte: meilleure, maitrise: true }), 5);
  assert.equal(etoilesDuProduit(r, { pinces_forge: 1 }, { contexte: meilleure, horsFamille: true, maitrise: true }), 2);
});

test("🔥 un Charbonnier seul : ressort, eau, foyer et bac de trempe, marteau → un couteau ★★", () => {
  // Plan 0.8 : l'acier se trempe au bac de trempe (le lieu de la recette) ; sans lui, la recette est refusée. L'enclume
  // est posée : sans elle, la lame n'existe pas encore pour le joueur (R26, 0.8.2).
  const sans = monter("charbonniers", { marteau: 1, ressort_lames: 1, charbon_bois: 1, branche: 1 }, { etat: { enclume: "depanneur" } });
  sans.fabriquer("lame_forgee");
  assert.match(sans.infos().at(-1)!, /Il te faut un bac de trempe/);
  const t = monter("charbonniers", { marteau: 1, ressort_lames: 1, charbon_bois: 1, branche: 1 }, { etat: { bac: true, enclume: "depanneur" } });
  t.fabriquer("lame_forgee");
  assert.match(t.infos().join(" "), /Trempe à l'eau : une lame sur trois se fend/, "le risque est dit avant le geste");
  assert.equal(t.sac()["lame_forgee#2"], 1);
  assert.equal(t.sac().ressort_lames, undefined);
});

test("🔥 un étau posé en enclume ne donne plus ★★★ : la machette forgée reste à ★★ (plan 0.8, Q-A6)", () => {
  const t = monter("charbonniers", { marteau: 1, pinces_forge: 1, etau: 1, ressort_lames: 2, charbon_bois: 2, branche: 1, ficelle: 1 }, { etat: { bac: true } });
  t.utiliser("poser_enclume");
  assert.equal(t.laForge().etat.enclume, "etau");
  assert.equal(t.sac().etau, undefined, "l'étau est sur la forge");
  t.fabriquer("machette_forgee");
  assert.equal(t.sac()["machette_forgee#2"], 1, "★★, même avec les pinces");
  assert.equal(t.sac().machette_forgee, undefined, "plus de ★★★ au foyer");
});

test("🔥 l'enclume de dépanneur se cale sur le billot : la pierre plate (★) cède la place, les lames montent à ★★", () => {
  const t = monter("charbonniers", { marteau: 1, enclume_depanneur: 1, etau: 1, barre_metal: 2, charbon_bois: 2, branche: 1, ficelle: 1 });
  t.utiliser("poser_enclume");
  // Dans le sac, l'enclume de dépanneur passe avant l'étau (à étoiles égales, la pièce faite pour ça).
  assert.equal(t.laForge().etat.enclume, "depanneur");
  assert.equal(t.sac().enclume_depanneur, undefined);
  assert.equal(t.sac().etau, 1, "l'étau reste pour l'établi");
  assert.match(t.infos().at(-1)!, /enclume de dépanneur sert d'enclume/i);
  // L'étau n'apporte rien de plus.
  t.utiliser("poser_enclume");
  assert.match(t.infos().at(-1)!, /vaut déjà/);
  t.fabriquer("machette_forgee_fer");
  assert.equal(t.sac()["machette_forgee#2"], 1);
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
    outils: () => sac,
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
  const t = monter("charbonniers", { marteau: 1, ressort_lames: 1, charbon_bois: 1, branche: 1 }, { etat: { bac: true, enclume: "depanneur" } }, () => 0);
  t.fabriquer("lame_forgee");
  const inv = t.sac();
  assert.equal(inv.lame_ebrechee, 1);
  assert.equal(inv.lame_forgee, undefined);
  assert.equal(inv["lame_forgee#2"], undefined);
  assert.match(t.infos().join(" "), /fendue à la trempe/);
});

test("🔥 le bac de trempe : une auge de 2 bûches et 2 glaises (Creuser 1, au sac ou au râtelier), plus de casserole ; l'huile s'y verse", () => {
  // La casserole ne fait plus le bac (V4-4).
  const casserole = monter("charbonniers", { marteau: 1, casserole: 1, bidon_huile: 1 });
  casserole.utiliser("poser_bac", 25);
  assert.equal(casserole.laForge().etat.bac, undefined);
  assert.match(casserole.infos().at(-1)!, /glaise/);
  assert.equal(casserole.sac().casserole, 1);
  // Sans de quoi creuser : refusé.
  const sansOutil = monter("charbonniers", { marteau: 1, buche: 2, glaise: 2 });
  sansOutil.utiliser("poser_bac", 25);
  assert.equal(sansOutil.laForge().etat.bac, undefined);
  assert.match(sansOutil.infos().at(-1)!, /creuser/);
  // Le bâton à fouir, deux bûches, deux glaises du gué : l'auge est posée.
  const t = monter("charbonniers", { marteau: 1, buche: 2, glaise: 2, baton_fouir: 1, bidon_huile: 1, ressort_lames: 1, charbon_bois: 1 });
  t.utiliser("verser_huile");
  assert.match(t.infos().at(-1)!, /bac de trempe/, "pas de bac, pas d'huile");
  t.utiliser("poser_bac", 25);
  assert.equal(t.laForge().etat.bac, true);
  assert.equal(t.sac().buche, undefined);
  assert.equal(t.sac().glaise, undefined);
  assert.equal(t.sac().baton_fouir, 1, "l'outil reste");
  t.utiliser("verser_huile");
  assert.equal(t.laForge().etat.huile, 20);
  // Le bâton à fouir rangé au râtelier, à 3 m, compte comme les autres outils à portée (plan 0.8 §9.2).
  const ratelier = monter("charbonniers", { buche: 2, glaise: 2 }, {}, () => 1, (b, id) => {
    const r = b.ajouterInstallation(id, "ratelier_outils", 21.5, 20, 0);
    b.sauverEtatInstallation(id, r.id, { contenu: { baton_fouir: 1 } });
  });
  ratelier.utiliser("poser_bac", 25);
  assert.equal(ratelier.laForge().etat.bac, true, "le bâton du râtelier suffit");
  assert.equal(ratelier.sac().glaise, undefined);
  // Le ressort retrempé (la trempe douce de l'arbalète lourde) est du niveau 3 : « plus tard ».
  assert.equal(recette("ressort_retrempe")!.aVenir, "niveau 3");
  t.fabriquer("ressort_retrempe");
  assert.match(t.infos().at(-1)!, /plus tard/i);
  assert.equal(t.sac().ressort_retrempe, undefined);
});

// ---------- La forge ventilée ----------

test("🔥 0.10 : la hache et le glaive se forgent à la forge ventilée ; au foyer, refusés ; la hachette se forge au foyer, à ★★", () => {
  const t = monter("charbonniers", { marteau: 2, pinces_forge: 1, barre_metal: 2, ressort_lames: 4, charbon_bois: 4, caoutchouc: 4, glaise: 2, pierre: 6, graisse: 1, branche: 3, rivet: 2 }, { etat: { bac: true, enclume: "depanneur" } });
  t.fabriquer("hache_forgee");
  assert.match(t.infos().at(-1)!, /forge ventilée/i);
  assert.equal(t.sac().hache_forgee, undefined);
  // Le niveau 2 est là (plan 0.10, chantier F) : plus rien de « plus tard » pour les lames de la forge ventilée.
  for (const id of ["hache_forgee", "hache_forgee_soc", "glaive", "machette_forgee_caoutchouc"]) assert.equal(recette(id)!.aVenir, undefined, id);
  // La hachette (Q-0.8-2) : au foyer de forge et à son bac, à ★★.
  assert.equal(recette("hachette")!.aVenir, undefined);
  t.fabriquer("hachette", 160);
  assert.equal(t.sac()["hachette#2"], 2);
});

test("🔥 0.10 (N2-35) : à la forge ventilée, le manche de caoutchouc fait la machette ★★★ ; le manche ficelé reste ★★", () => {
  // Le manche n'est plus une branche et de la ficelle : il est tourné de caoutchouc (une chambre à air).
  for (const id of ["hache_forgee", "hache_forgee_soc", "glaive", "machette_forgee_caoutchouc"]) {
    const r = recette(id)!;
    assert.equal(r.ingredients.caoutchouc, 2, id);
    assert.equal(r.ingredients.branche ?? r.ingredients.ficelle ?? r.ingredients.buche, undefined, id);
  }
  const ventilee = contexte(2, { bac: true, enclume: "depanneur" });
  const sac = { ressort_lames: 2, charbon_bois: 2, caoutchouc: 2, branche: 1, ficelle: 1, pinces_forge: 1 };
  assert.equal(etoilesDuProduit(recette("machette_forgee_caoutchouc")!, sac, { contexte: ventilee }), 3);
  assert.equal(etoilesDuProduit(recette("machette_forgee")!, sac, { contexte: ventilee }), 2);
  // La maîtrise donne toujours l'étoile du dessus (K-Q1), même au manche ficelé.
  assert.equal(etoilesDuProduit(recette("machette_forgee")!, sac, { contexte: ventilee, maitrise: true }), 3);
  // En jeu : devant une forge ventilée, avec les pinces, la machette au manche de caoutchouc sort ★★★.
  const t = monter("charbonniers", { marteau: 2, ...sac }, { niveau: 2, etat: { bac: true, enclume: "depanneur" } });
  t.fabriquer("machette_forgee_caoutchouc", 160);
  assert.equal(t.sac()["machette_forgee#3"] ?? t.sac().machette_forgee, 1, JSON.stringify(t.sac()));
  assert.equal(t.sac().caoutchouc, undefined);
  assert.equal(t.sac().ficelle, 1, "le manche ficelé n'est pas pris");
});

test("🔥 démonter la forge rend ses accessoires entiers (l'auge : ses bûches et sa glaise)", () => {
  assert.deepEqual(Forge.accessoiresRendus({ type: "forge", etat: { enclume: "rail", bac: true, huile: 4, ventilateur: true } }), { troncon_rail: 1, buche: 2, glaise: 2, ventilateur_forge: 1 });
  assert.deepEqual(Forge.accessoiresRendus({ type: "forge", etat: { enclume: "depanneur" } }), { enclume_depanneur: 1 });
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
  const t = monter("charbonniers", { marteau: 1, lame_ebrechee: 2, charbon_bois: 2 }, { etat: { bac: true, enclume: "depanneur" } }, () => 1, (base, id) => base.ecrireMonde(`forge:${id}`, { ebrechees: ["machette_forgee#4"] }));
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
  for (const verbe of ["poser_enclume", "poser_bac", "verser_huile", "monter_ventilateur", "poser_panneau", "monter_alternateur"]) {
    assert.ok(messageValide({ t: "interagir", cible: { genre: "installation", id: 3 }, verbe }), verbe);
  }
});
