// Le feu et l'eau jusqu'au niveau 1 (plan 0.8, chantier 5) : le foyer de cuisine et sa clé (le grillage), sans repli
// (plan 0.10) ; la soupe au seul foyer de cuisine ; la marmite norvégienne et sa cocotte (une marmite montée à la
// casserole dans une partie de la 0.9 se relit) ; le Dakota qui rend ses 5 pierres ; le bâton à fouir durci ; le four
// « plus tard » ; le récupérateur de 5 L (le bidon, les 4 sacs) et le récupérateur à seau de 10 L, qui se remplit même
// hors ligne.

import { test } from "node:test";
import assert from "node:assert/strict";
import { ACCESSOIRES_FEU, BOIS_MARMITE, COMBLER, CONTENANCES_RECUPERATEUR, CREUSER, VOIE_SURFACE, boisMarmite, lignee } from "../../commun/src/lignees.ts";
import { lieuPossede } from "../../commun/src/lieu-recette.ts";
import { meteo } from "../../commun/src/meteo.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { etapesAvecCle, nouvellesIdees, toutDevoile } from "../../commun/src/progression.ts";
import { RECETTES, recette } from "../../commun/src/recettes.ts";
import { Base } from "./base.ts";
import { Joueur } from "./joueur.ts";

function monter(inventaire: Record<string, number>, avant?: (base: Base, id: number) => void) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "mecanistes");
  // Ces tests portent sur les constructions, pas sur l'arbre de progression : tout est dévoilé.
  base.sauverProgression(compte.id, toutDevoile("mecanistes"));
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
  avant?.(base, compte.id);
  let instant = base.debutMonde() + 60_000;
  const recus: MessageServeur[] = [];
  const ouvrir = () => new Joueur(compte, base, (m) => recus.push(m), () => instant, undefined, () => 0.9);
  let joueur = ouvrir();
  joueur.position = { x: 20, z: 20, o: 0 };
  const attendre = (secondes: number, pas = 0.25) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  const inventaireActuel = () => dernier("inventaire")?.inventaire ?? base.chargerInventaire(compte.id);
  const agir = (genre: "feu" | "installation", id: number, verbe: string, secondes = 6) => {
    joueur.recevoir({ t: "interagir", cible: { genre, id }, verbe: verbe as never });
    attendre(secondes);
  };
  /** Se déconnecter, s'absenter, revenir. */
  const absence = (ms: number) => {
    joueur.sauvegarder();
    joueur.partir();
    instant += ms;
    recus.length = 0;
    joueur = ouvrir();
    joueur.position = { x: 20, z: 20, o: 0 };
  };
  return { base, compte, joueur: () => joueur, recus, attendre, dernier, infos, inventaireActuel, agir, absence, maintenant: () => instant, sauter: (ms: number) => (instant += ms) };
}

/** Un feu déjà posé en base, à côté du joueur. */
function poserFeu(base: Base, id: number, feu: { id: number; bois?: number; allume?: boolean; dakota?: boolean; niveau?: number; accessoires?: Record<string, Record<string, number>> }) {
  base.sauverFeu(id, { x: 21, z: 20, bois: 2, allume: false, majLe: base.debutMonde() + 60_000, ...feu });
}

// ---------- Le feu ----------

test("le foyer de cuisine se monte avec un grillage (Marteler 1), et sans grillage, pas du tout (plan 0.10 : pas de repli)", () => {
  const foyer = VOIE_SURFACE.find((e) => e.id === "foyer_cuisine")!;
  assert.equal(foyer.cle?.objet, "grillage_rouleau");
  assert.equal(foyer.etapeLieu, "L1");
  assert.deepEqual(foyer.couts, [{ branche: 3, corde: 1, grillage_rouleau: 1 }]);

  // Le grillage et une pierre (Marteler 1) suffisent.
  const t = monter({ branche: 3, corde: 1, grillage_rouleau: 1, couteau: 1, pierre: 1 }, (b, id) => poserFeu(b, id, { id: 1, niveau: 2 }));
  t.agir("feu", 1, "ameliorer");
  assert.equal(t.dernier("feu")!.feu.niveau, 3);
  assert.deepEqual(t.base.chargerFeux(t.compte.id)[0]!.payes?.at(-1), { branche: 3, corde: 1, grillage_rouleau: 1 });

  // Deux barres et le marteau (l'ancien repli) : il manque le grillage, et rien ne se fait.
  const v = monter({ branche: 3, corde: 1, barre_metal: 2, couteau: 1, marteau: 1 }, (b, id) => poserFeu(b, id, { id: 1, niveau: 2 }));
  v.agir("feu", 1, "ameliorer");
  assert.notEqual(v.dernier("feu")?.feu.niveau, 3);
  assert.match(v.infos().join(" "), /rouleau de grillage/);
  assert.doesNotMatch(v.infos().join(" "), /Ou deux barres/);
  assert.equal(v.inventaireActuel().barre_metal, 2);
});

test("la soupe n'apparaît qu'au foyer de cuisine : refusée au foyer de pierres ; le foyer de cuisine l'ouvre", () => {
  const soupe = recette("soupe_cepes")!;
  const carte = (formes: string[]) => new Map(formes.map((f) => [`feu:${f}`, 1]));
  assert.equal(lieuPossede(soupe.lieu, carte(["feu_camp", "foyer_pierres", "dakota", "poele_fusee"])), false);
  assert.equal(lieuPossede(soupe.lieu, carte(["foyer_cuisine"])), true);
  // En jeu : au foyer de pierres allumé, le refus nomme le foyer de cuisine.
  const t = monter({ cepe: 2, gourde: 1 }, (b, id) => poserFeu(b, id, { id: 1, niveau: 2, bois: 5, allume: true }));
  t.joueur().recevoir({ t: "fabriquer", recette: "soupe_cepes" });
  assert.match(t.infos().at(-1)!, /foyer de cuisine/);
  // Les recettes du feu, chacune à sa place (plan 0.8 §2.3).
  const formes = (id: string) => {
    const l = recette(id)!.lieu;
    return l.genre === "construction" ? l.formes : undefined;
  };
  assert.ok(formes("pommes_cuites")!.includes("feu_camp"));
  assert.ok(!formes("cepes_poeles")!.includes("feu_camp") && formes("cepes_poeles")!.includes("foyer_pierres") && formes("cepes_poeles")!.includes("dakota"));
  for (const id of ["epieu", "fleches_durcies", "baton_fouir_durci"]) assert.deepEqual(formes(id), ["foyer_pierres", "foyer_cuisine", "four_terre"], id);
});

test("le bâton à fouir se durcit au foyer de pierres, pas au feu de camp", () => {
  const r = recette("baton_fouir_durci")!;
  assert.deepEqual(r.ingredients, { baton_fouir: 1 });
  assert.deepEqual(r.produit, { objet: "baton_fouir_durci", quantite: 1 });
  const t = monter({ baton_fouir: 1 }, (b, id) => poserFeu(b, id, { id: 1, bois: 5, allume: true }));
  t.joueur().recevoir({ t: "fabriquer", recette: "baton_fouir_durci" });
  assert.match(t.infos().at(-1)!, /foyer de pierres/);
  const u = monter({ baton_fouir: 1 }, (b, id) => poserFeu(b, id, { id: 1, niveau: 2, bois: 5, allume: true }));
  u.joueur().recevoir({ t: "fabriquer", recette: "baton_fouir_durci" });
  u.attendre(20);
  assert.equal(u.inventaireActuel().baton_fouir_durci, 1);
  assert.equal(u.inventaireActuel().baton_fouir ?? 0, 0);
});

test("le four de terre attend « plus tard », avec sa clé nommée ; ses deux plats aussi, grisés", () => {
  const four = VOIE_SURFACE.find((e) => e.id === "four_terre")!;
  assert.equal(four.aVenir, "niveau 2");
  assert.equal(four.cle?.nom, "porte de four en fonte");
  for (const id of ["pot_au_feu", "volaille_cepes"]) assert.equal(recette(id)!.aVenir, "niveau 2", id);
  const t = monter({ pierre: 6, branche: 4, glaise: 4 }, (b, id) => poserFeu(b, id, { id: 1, niveau: 3 }));
  t.agir("feu", 1, "ameliorer");
  assert.match(t.infos().at(-1)!, /plus tard/);
  assert.equal(t.dernier("feu")?.feu.niveau ?? 3, 3);
});

test("creuser un feu de camp en Dakota rend ses 5 pierres ; le combler en coûte 5 : plus de perte", () => {
  assert.equal(CREUSER.rend.pierre, 5);
  assert.equal(COMBLER.cout.pierre, 5);
  const t = monter({ baton_fouir: 1 }, (b, id) => poserFeu(b, id, { id: 1 }));
  t.agir("feu", 1, "creuser_dakota");
  assert.equal(t.dernier("feu")!.feu.dakota, true);
  assert.equal(t.inventaireActuel().pierre, 5);
  assert.match(t.infos().at(-1)!, /5 pierres/);
  t.agir("feu", 1, "combler");
  assert.equal(t.dernier("feu")!.feu.dakota, undefined);
  assert.equal(t.inventaireActuel().pierre ?? 0, 0);
});

test("la marmite norvégienne : la cocotte en fonte (bois ×0,5) ; plus de casserole (plan 0.10), une marmite 0.9 à la casserole se relit (×0,75)", () => {
  const marmite = ACCESSOIRES_FEU.marmite;
  assert.equal(marmite.cle?.objet, "cocotte_fonte");
  assert.deepEqual(marmite.couts, [{ branche: 4, chiffons: 4, cocotte_fonte: 1 }]);
  assert.equal(boisMarmite(undefined), 1);
  assert.equal(boisMarmite({ branche: 4, chiffons: 4, cocotte_fonte: 1 }), BOIS_MARMITE.cocotte);
  assert.equal(boisMarmite({ branche: 4, chiffons: 4, casserole: 1 }), BOIS_MARMITE.casserole);
  assert.ok(BOIS_MARMITE.cocotte < BOIS_MARMITE.casserole && BOIS_MARMITE.casserole < 1);

  // La casserole (l'ancien repli) ne monte plus la marmite.
  const t = monter({ branche: 4, chiffons: 4, casserole: 1 }, (b, id) => poserFeu(b, id, { id: 1, niveau: 3, bois: 5 }));
  t.agir("feu", 1, "monter_marmite", 25);
  assert.equal(t.base.chargerFeux(t.compte.id)[0]!.accessoires?.marmite, undefined);
  assert.equal(t.inventaireActuel().casserole, 1);

  const soupe = (marmitePayee: Record<string, number>) => {
    const u = monter({ cepe: 2, gourde: 1 }, (b, id) => poserFeu(b, id, { id: 1, niveau: 3, bois: 5, allume: true, accessoires: { marmite: marmitePayee } }));
    u.joueur().recevoir({ t: "fabriquer", recette: "soupe_cepes" });
    u.attendre(6);
    assert.equal(u.inventaireActuel().soupe_cepes, 1);
    return 5 - u.dernier("feu")!.feu.bois;
  };
  // Le même temps de feu de part et d'autre : l'écart est celui de la cuisson, 0,5 × (0,75 − 0,5) = 0,125 kg.
  const cocotte = soupe({ cocotte_fonte: 1 });
  const casserole = soupe({ casserole: 1 });
  assert.ok(Math.abs(casserole - cocotte - 0.125) < 0.005, `cocotte : ${cocotte} kg, casserole : ${casserole} kg`);
});

test("la cocotte ramassée fait penser à la marmite : « un jour » sans foyer de cuisine, « tu y penses » avec", () => {
  assert.ok(etapesAvecCle().some((x) => x.etape.id === "marmite" && x.construction === "feu+marmite"));
  const vus = new Set(["cocotte_fonte"]);
  const tot = nouvellesIdees({ vus, installations: new Map([["feu:foyer_pierres", 1]]), idees: new Set(), inventaire: {} });
  assert.deepEqual(tot, [{ etape: "marmite", plusTard: true, texte: "Cette cocotte servira à ta cuisine, un jour.", objet: "cocotte_fonte" }]);
  const aPoint = nouvellesIdees({ vus, installations: new Map([["feu:foyer_cuisine", 1]]), idees: new Set(), inventaire: {} });
  assert.equal(aPoint[0]!.plusTard, false);
  assert.match(aPoint[0]!.texte!, /caisse de chiffons/);
  // Déjà montée : gardée sans message.
  assert.equal(nouvellesIdees({ vus, installations: new Map([["feu:foyer_cuisine", 1], ["feu+marmite", 1]]), idees: new Set(), inventaire: {} })[0]!.texte, null);
});

test("les textes des clés du feu et de l'eau citent les lieux par leur nom, jamais par leur code", () => {
  for (const x of etapesAvecCle().filter((y) => ["feu", "feu+marmite", "recuperateur_pluie"].includes(y.construction))) {
    const c = x.etape.cle;
    for (const texte of [c.idee, c.ideePlusTard, ...c.indice]) assert.doesNotMatch(texte, /\b[HL][12][AB]\b/, `${x.etape.id} : ${texte}`);
  }
});

// ---------- L'eau ----------

test("le récupérateur de 5 L se fait à la maison : le bidon de la ruine, 4 branches, 1 corde, les 4 sacs du chemin", () => {
  const r = recette("recuperateur_pluie")!;
  assert.deepEqual(r.ingredients, { bidon_5l: 1, branche: 4, corde: 1, sac_plastique: 4 });
  assert.deepEqual(r.qualites, { couper: 1 });
  assert.deepEqual(lignee("recuperateur_pluie")![0]!.couts, [r.ingredients]);
  assert.equal(lignee("recuperateur_pluie")![0]!.etapeLieu, "maison");
  // Trois sacs : il en manque un.
  const t = monter({ bidon_5l: 1, branche: 4, corde: 1, sac_plastique: 3, couteau: 1 });
  t.joueur().recevoir({ t: "fabriquer", recette: "recuperateur_pluie", x: 21.5, z: 20, o: 0 });
  t.attendre(40);
  assert.equal(t.joueur().bienvenue(0).installations.some((i) => i.type === "recuperateur_pluie"), false);
  // Les quatre : il se pose.
  const u = monter({ bidon_5l: 1, branche: 4, corde: 1, sac_plastique: 4, couteau: 1 });
  u.joueur().recevoir({ t: "fabriquer", recette: "recuperateur_pluie", x: 21.5, z: 20, o: 0 });
  u.attendre(40);
  assert.ok(u.joueur().bienvenue(0).installations.some((i) => i.type === "recuperateur_pluie"));
  assert.equal(u.inventaireActuel().sac_plastique ?? 0, 0);
  assert.equal(u.inventaireActuel().bidon_5l ?? 0, 0);
});

test("la lignée de l'eau : 5 L, le seau de 10 L (clé : le seau, sans repli), 20 L plus tard ; plus de citerne", () => {
  assert.deepEqual([...CONTENANCES_RECUPERATEUR], [5, 10, 20]);
  const l = lignee("recuperateur_pluie")!;
  assert.deepEqual(l.map((e) => e.id), ["recuperateur_pluie", "recuperateur_seau", "recuperateur_jerrican"]);
  assert.ok(!l.some((e) => e.id === "citerne"));
  const seau = l[1]!;
  assert.equal(seau.cle?.objet, "seau_10l");
  assert.deepEqual(seau.couts, [{ seau_10l: 1, branche: 2 }]);
  assert.deepEqual(seau.qualites, { couper: 1 });
  assert.equal(l[2]!.aVenir, "niveau 2");
  assert.equal(l[2]!.cle?.nom, "jerrican de 20 L");
  // Aucune recette ne pose plus de citerne.
  assert.ok(!RECETTES.some((r) => r.id === "citerne"));
});

test("le récupérateur à seau tient 10 L, et se remplit même hors ligne", () => {
  const t = monter({ seau_10l: 1, branche: 2, couteau: 1 }, (b, id) => b.ajouterInstallation(id, "recuperateur_pluie", 21, 20, 0));
  t.agir("installation", 1, "ameliorer", 15);
  const r = t.dernier("installation")!.installation;
  assert.equal(r.niveau, 2);
  assert.equal(t.inventaireActuel().seau_10l ?? 0, 0);
  // Deux jours d'absence, dont des heures de pluie : il est plein, à 10 L (pas 5).
  const debut = t.base.debutMonde();
  let pluie = t.maintenant();
  while (meteo(pluie, debut).pluie < 1) pluie += 60_000;
  t.absence(pluie - t.maintenant() + 2 * 86_400_000);
  const apres = t.joueur().bienvenue(0).installations.find((i) => i.type === "recuperateur_pluie")!;
  assert.equal(apres.etat.litres, 10);
  // Redescendu au bidon : ce qui déborde se répand.
  t.agir("installation", 1, "redescendre", 15);
  assert.equal(t.dernier("installation")!.installation.etat.litres, 5);
});
