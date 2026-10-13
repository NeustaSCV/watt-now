// 0.6, chantier 6 (Book 25 §5 et §10.3) : les Voltaïques. Un Voltaïque seul monte sa matraque de fortune ; la courte
// puis la longue éteignent un Errant comme un Équipé ; une courte libère une prise ; chaque décharge prend ses Wh et le
// pack vide fait un gourdin court ; la manivelle remplit la batterie du banc de 1 Wh par minute, le banc charge bien plus vite ; la clôture tient un
// Éteint, trois qui poussent la couchent, elle ne détruit jamais ; la plaque se réarme pour 0,5 Wh.

import { test } from "node:test";
import { toutDevoile } from "../../commun/src/progression.ts";
import assert from "node:assert/strict";
import { ARMES, armeDeCle, chargeArme, type Arme } from "../../commun/src/combat.ts";
import { MS_JOUR_CALENDRIER } from "../../commun/src/energie.ts";
import { nouvelEteint, type Eteint } from "../../commun/src/eteints.ts";
import { DUREE_VOYAGE_S, SORTIE_TERRAIN, zoneDe } from "../../commun/src/lieux.ts";
import type { InstallationVue, MessageServeur } from "../../commun/src/messages.ts";
import { kitDeDepart, type Inventaire } from "../../commun/src/objets.ts";
import { etoilesDuProduit, recette, recetteHorsFamille, recettesConnues, energieGrise } from "../../commun/src/recettes.ts";
import { Base } from "./base.ts";
import { messageValide } from "./controle.ts";
import { declencher, declencheurNeuf, definitionDeclencheur, type DeclencheurPose } from "./declencheurs.ts";
import { WATTS_CLOTURE, alimenterClotures, armeAlimentee, coutEnduranceCoup } from "./electricite.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

type Recu<T extends MessageServeur["t"]> = Extract<MessageServeur, { t: T }>;

/** Un Voltaïque sur son terrain (aucun Éteint ne vient de la lisière), avec ce qu'on veut dans le sac et autour. */
function surLeTerrain(inventaire: Inventaire, installations: { type: InstallationVue["type"]; x: number; z: number; etat?: InstallationVue["etat"] }[] = [], charges?: Record<string, number>) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Ampère", "volts1234", "voltaiques");
  // Ces tests portent sur le métier, pas sur l'arbre de progression : tout est dévoilé.
  base.sauverProgression(compte.id, toutDevoile("voltaiques"));
  base.sauverInventaire(compte.id, inventaire);
  if (charges) base.sauverChargeArmes(compte.id, charges);
  for (const i of installations) {
    const v = base.ajouterInstallation(compte.id, i.type, i.x, i.z, 0);
    if (i.etat) base.sauverEtatInstallation(compte.id, v.id, i.etat);
  }
  let instant = base.debutMonde() + 60_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), () => 1);
  joueur.position = { x: 20, z: 20, o: 0 };
  const attendre = (secondes: number, pas = 0.25) => {
    for (let s = 0; s < secondes - 1e-9; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Recu<T> | undefined;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as Recu<"info">).texte);
  return { base, compte, joueur, attendre, dernier, infos, recus };
}

/** Un Voltaïque à la halte, une arme en main, des Éteints posés devant lui. */
function aLaHalte(inventaire: Inventaire, charges?: Record<string, number>) {
  const base = new Base(":memory:");
  const halte = new Halte(base, () => 0.5);
  const compte = base.creerCompte("Ampère", "volts1234", "voltaiques");
  // Ces tests portent sur le métier, pas sur l'arbre de progression : tout est dévoilé.
  base.sauverProgression(compte.id, toutDevoile("voltaiques"));
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
  if (charges) base.sauverChargeArmes(compte.id, charges);
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
  const placer = (...eteints: Eteint[]) => {
    halte.eteints = eteints;
    joueur.position = { x: 40, z: 34.6, o: 0 };
  };
  /** Un coup, puis la fin du geste (la longue de la matraque dure 1 s). */
  const frapper = (appuye: boolean) => {
    joueur.position = { x: 40, z: 34.6, o: 0 };
    joueur.recevoir({ t: "frapper", appuye });
    attendre(appuye ? 1.5 : 0.6);
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Recu<T> | undefined;
  const coups = () => recus.filter((m) => m.t === "coup") as Recu<"coup">[];
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as Recu<"info">).texte);
  return { base, compte, joueur, halte, attendre, placer, frapper, dernier, coups, infos };
}

const devant = (id = 9, variante?: "equipe") => Object.assign(nouvelEteint(id, 40, 35.6, "poursuivant"), variante ? { variante } : {});
const arme = (objet: string): Arme => ARMES.find((a) => a.objet === objet)!;

// ---------- Les armes ----------

test("0.6 Voltaïques : la matraque, l'aiguillon et la matraque de fortune sont des armes électriques de métier", () => {
  const m = arme("matraque_electrique");
  assert.equal(m.type, "electrique");
  assert.equal(m.metier, true);
  // ★★★ (plan 0.8 §2.4, K30) : 2,25 au torse, solidité 80.
  assert.deepEqual([m.coup, m.coupAppuye, m.allonge, m.solidite, m.degatsTorse], [450, 1000, 1.3, 80, 2.25]);
  assert.equal(m.electrique?.saute, true);
  assert.equal(arme("aiguillon").allonge, 2.3);
  // C7 : à ★★★, la courte de l'aiguillon saute au voisin, comme la matraque.
  assert.equal(arme("aiguillon").electrique?.saute, true);
  // La matraque de fortune est une arme ★ : 1,5 s de raidissement, 1,4 s pour la longue, 60 coups (P5), 50 Wh.
  const f = arme("matraque_fortune");
  assert.deepEqual([f.electrique?.raidi, f.coupAppuye, f.solidite], [1.5, 1400, 60]);
  assert.equal(chargeArme("matraque_fortune", {}), 50);
  // À ★★ (raquette) : 2,5 s, 1,0 s (P6), 60 coups ; elle ne saute pas ; la petite batterie, 50 Wh (Q-A5).
  const deux = armeDeCle("matraque_electrique#2")!;
  assert.deepEqual([deux.electrique?.raidi, deux.coupAppuye, deux.solidite, deux.electrique?.saute], [2.5, 1000, 60, false]);
  assert.equal(chargeArme("matraque_electrique#2", {}), 50);
  // Rangées entre la lance et le gourdin : sans arme équipée, la matraque passe avant le gourdin, après la masse.
  const rangs = ARMES.map((a) => a.objet);
  assert.ok(rangs.indexOf("matraque_electrique") < rangs.indexOf("gourdin"));
  assert.ok(rangs.indexOf("matraque_fortune") < rangs.indexOf("gourdin"));
  assert.ok(rangs.indexOf("masse") < rangs.indexOf("matraque_electrique"));
});

test("0.6 Voltaïques : l'endurance d'une décharge (5 la courte, 8 la longue) et le pack trop faible", () => {
  const m = arme("matraque_electrique");
  assert.equal(coutEnduranceCoup(m, false), 5);
  assert.equal(coutEnduranceCoup(m, true), 8);
  assert.equal(coutEnduranceCoup(arme("gourdin"), true), 16);
  const vide = armeAlimentee(m, true, { matraque_electrique: 0.1 });
  assert.equal(vide.vide, true);
  assert.equal(vide.arme.type, "contondant");
  // Pack vide : la moitié de ses dégâts (C11), 1,125 pour la ★★★.
  assert.equal(vide.arme.degatsTorse, 1.125);
  assert.equal(vide.arme.tueALaTete, false);
  const faible = armeAlimentee(m, true, { matraque_electrique: 0.5 });
  assert.equal(faible.appuye, false, "maintenue sans assez de courant : elle part en courte");
  assert.equal(faible.arme.type, "electrique");
  assert.equal(armeAlimentee(m, true, {}).appuye, true, "absente : pleine");
});

// ---------- Les recettes : seul, on fait sa base ----------

test("0.6 Voltaïques : un Voltaïque seul monte une matraque de fortune avec son kit et un appareil photo, à son banc", () => {
  // Plan 0.8 : le métier se fait à l'atelier ; la matraque se monte au banc de recharge (son lieu), son panneau posé
  // (R26, 0.8.2 : les armes de métier attendent le meuble complet).
  const t = surLeTerrain({ ...kitDeDepart("voltaiques"), appareil_photo_jetable: 1, buche: 1, fibres: 2 }, [{ type: "banc_recharge", x: 21, z: 20, etat: { panneau: true } }]);
  // 0.8.2 : l'appareil se démonte d'abord ; c'est son petit condensateur qui va dans le manche.
  t.joueur.recevoir({ t: "demonter", objet: "appareil_photo_jetable" });
  t.attendre(8);
  for (const r of ["gourdin", "ficelle", "matraque_fortune"]) {
    t.joueur.recevoir({ t: "fabriquer", recette: r });
    t.attendre(8);
  }
  const inv = t.dernier("inventaire")!.inventaire;
  assert.equal(inv.matraque_fortune, 1, t.infos().join(" | "));
  assert.equal(inv.petite_batterie, undefined, "la petite batterie du kit est dans le manche");
  assert.equal(inv.appareil_photo_jetable, undefined);
  assert.equal(inv.petit_condensateur, undefined, "le petit condensateur est dans le manche");
  // Rien d'une autre famille dans la recette.
  for (const id of ["matraque_fortune", "matraque_electrique", "aiguillon", "pack_cellules", "module_decharge", "cloture_fortune"]) {
    assert.ok(recettesConnues("voltaiques").some((r) => r.id === id), id);
    for (const t2 of Object.keys(recette(id)!.ingredients)) assert.ok(!["electrodes_forgees", "manche_tourne", "ressort_retrempe"].includes(t2), `${id} : ${t2}`);
  }
});

test("0.6 Voltaïques : seul, une matraque ★★ (raquette, pack) dès le premier jour, au banc", () => {
  const t = surLeTerrain(
    { couteau: 1, sac_a_dos: 1, raquette_moustiques: 1, fil_cuivre: 2, cellule_lithium: 3, ficelle: 1, gourdin: 1, caoutchouc: 1 },
    [{ type: "banc_recharge", x: 21, z: 20, etat: { panneau: true } }],
  );
  // 0.8.2 (R14) : la raquette se démonte en condensateur moyen, qui fait le module ★★.
  t.joueur.recevoir({ t: "demonter", objet: "raquette_moustiques" });
  t.attendre(8);
  for (const r of ["module_decharge", "pack_cellules", "matraque_electrique"]) {
    t.joueur.recevoir({ t: "fabriquer", recette: r });
    t.attendre(8);
  }
  const inv = t.dernier("inventaire")!.inventaire;
  assert.equal(inv["matraque_electrique#2"], 1, t.infos().join(" | "));
});

test("0.6 Voltaïques : les étoiles de l'arme suivent le module ; électrodes 🔥 et manche tourné ⚙️ ajoutent chacun une étoile", () => {
  const base = { gourdin: 1, pack_cellules: 2, caoutchouc: 1, electrodes_forgees: 1, manche_tourne: 1 };
  const matraque = recette("matraque_electrique")!;
  assert.equal(etoilesDuProduit(matraque, { ...base, "module_decharge#1": 1 }), 1);
  assert.equal(etoilesDuProduit(matraque, { ...base, "module_decharge#2": 1 }), 2);
  assert.equal(etoilesDuProduit(matraque, { ...base, module_decharge: 1 }), 3, "la bobine : ★★★");
  // La recette prend le module le moins bon : c'est lui qui compte.
  assert.equal(etoilesDuProduit(matraque, { ...base, module_decharge: 1, "module_decharge#2": 1 }), 2);
  assert.equal(etoilesDuProduit(recette("matraque_electrodes")!, { ...base, module_decharge: 1 }), 4);
  assert.equal(etoilesDuProduit(recette("matraque_manche_tourne")!, { ...base, module_decharge: 1 }), 5);
  // La maîtrise : une de plus ; hors famille : ★★ au plus, et ×1,5.
  assert.equal(etoilesDuProduit(matraque, { ...base, module_decharge: 1 }, { maitrise: true }), 4);
  assert.equal(etoilesDuProduit(matraque, { ...base, module_decharge: 1 }, { horsFamille: true }), 2);
  assert.equal(recetteHorsFamille(matraque).auChoix?.[0]?.pack_cellules, 2);
  // Les modules (0.8.2, R14) : ★ au petit condensateur (le flash), ★★ au moyen (la raquette), ★★★ à la bobine.
  assert.equal(etoilesDuProduit(recette("module_decharge")!, { petit_condensateur: 1 }), 1);
  assert.equal(etoilesDuProduit(recette("module_decharge")!, { condensateur_moyen: 1 }), 2);
  assert.equal(etoilesDuProduit(recette("module_bobine")!, {}), 3);
  // Le bain dérouille une machette de fortune : ★ → ★★, pas au-delà.
  assert.equal(etoilesDuProduit(recette("derouiller_machette")!, { machette: 1 }), 2);
  assert.equal(etoilesDuProduit(recette("derouiller_machette")!, { "machette#2": 1 }), 2);
  // Toutes les recettes ont une catégorie, et leurs produits une énergie grise.
  for (const id of ["pack_cellules", "module_decharge", "matraque_fortune", "matraque_electrique", "aiguillon", "lampe_bricolee", "electrificateur", "ventilateur_forge"]) {
    const r = recette(id)!;
    assert.ok(r.categorie, id);
    if ("objet" in r.produit) assert.ok(energieGrise(r.produit.objet) > 0, id);
  }
});

// ---------- Les décharges en jeu ----------

test("0.6 Voltaïques : la courte puis la longue éteignent un Errant, puis un Équipé ; 1,25 Wh chacun", () => {
  for (const variante of [undefined, "equipe" as const]) {
    const t = aLaHalte({ matraque_electrique: 1 });
    const e = devant(9, variante);
    t.placer(e);
    t.frapper(false);
    assert.equal(t.coups().at(-1)?.resultat, "raidi");
    assert.equal(t.coups().at(-1)?.electrique, true);
    t.frapper(true);
    assert.equal(t.coups().at(-1)?.resultat, "detruit", variante ?? "errant");
    assert.equal(e.etat, "detruit");
    assert.ok(t.infos().includes("Il s'éteint."));
    const charge = t.dernier("usure")?.charge?.matraque_electrique;
    assert.equal(charge, 12 - 1.25);
    assert.equal(t.base.chargerChargeArmes(t.compte.id).matraque_electrique, 10.75, "la charge est sauvée");
  }
});

test("0.8.4 · Voltaïques : tenu, la courte ne part pas, elle compte pour se dégager (pas d'exception électrique)", () => {
  const t = aLaHalte({ matraque_electrique: 1 });
  const e = devant();
  e.saisit = t.compte.id;
  t.placer(e);
  t.joueur.recevoir({ t: "frapper", appuye: false });
  assert.equal(e.saisit, t.compte.id, "un appui ne libère pas");
  assert.equal(e.raidi ?? 0, 0, "aucune décharge");
  assert.equal(t.coups().length, 0);
  t.joueur.recevoir({ t: "frapper", appuye: false });
  assert.equal(e.saisit, null, "le second appui libère");
});

test("0.6 Voltaïques : pack vide, un gourdin court qui ne tue pas ; « Plus de courant » une seule fois", () => {
  const t = aLaHalte({ matraque_electrique: 1 }, { matraque_electrique: 0 });
  const e = devant();
  t.placer(e);
  t.frapper(true);
  assert.notEqual(t.coups().at(-1)?.resultat, "detruit");
  assert.equal(t.coups().at(-1)?.electrique, undefined, "plus de décharge");
  t.frapper(true);
  assert.equal(t.infos().filter((x) => x.startsWith("Plus de courant")).length, 1);
  // La dernière décharge vide le pack : on le dit aussi, une fois.
  const u = aLaHalte({ matraque_electrique: 1 }, { matraque_electrique: 0.3 });
  u.placer(devant());
  u.frapper(false);
  assert.equal(u.dernier("usure")?.charge?.matraque_electrique, 0.05);
  assert.ok(u.infos().some((x) => x.startsWith("Plus de courant")));
});

// ---------- La recharge ----------

test("0.8.2 Voltaïques (R17) : au banc, la manivelle de la lampe à dynamo remplit lentement la batterie du banc", () => {
  const banc = { type: "banc_recharge" as const, x: 20.5, z: 20, etat: { batteries: { batterie_voiture: 1 }, charges: { batterie_voiture: 40 } } };
  const t = surLeTerrain({ lampe_dynamo: 1, matraque_electrique: 1, sac_a_dos: 1 }, [banc], { matraque_electrique: 5 });
  const id = t.base.chargerInstallations(t.compte.id).find((i) => i.type === "banc_recharge")!.id;
  t.joueur.recevoir({ t: "banc", id, op: "manivelle" });
  t.attendre(60);
  assert.ok((t.base.chargerInstallations(t.compte.id).find((i) => i.id === id)!.etat.charges?.batterie_voiture ?? 0) < 40.5, "pas avant la fin du geste");
  t.attendre(121);
  const wh = t.base.chargerInstallations(t.compte.id).find((i) => i.id === id)!.etat.charges?.batterie_voiture ?? 0;
  assert.ok(Math.abs(wh - 43) < 0.2, `trois minutes, trois Wh dans la batterie du banc (${wh})`);
  assert.match(t.infos().at(-1)!, /dans la batterie de voiture de la ruine, à la force du bras/);
  // L'arme, elle, ne bouge pas : elle se charge ensuite depuis la fiche du banc.
  assert.equal(t.dernier("usure")?.charge?.matraque_electrique, undefined);
  // Sans la lampe à dynamo, pas de manivelle ; sans batterie dans le banc, rien à remplir.
  const u = surLeTerrain({ matraque_electrique: 1 }, [banc]);
  u.joueur.recevoir({ t: "banc", id: u.base.chargerInstallations(u.compte.id)[0]!.id, op: "manivelle" });
  assert.match(u.infos().at(-1)!, /lampe à dynamo/);
  const v = surLeTerrain({ lampe_dynamo: 1 }, [{ type: "banc_recharge", x: 20.5, z: 20 }]);
  v.joueur.recevoir({ t: "banc", id: v.base.chargerInstallations(v.compte.id)[0]!.id, op: "manivelle" });
  assert.match(v.infos().at(-1)!, /pas de batterie/);
});

test("0.6 Voltaïques : au banc, un pack vide se recharge en ≈ 25 s, pris à la batterie du banc (85 %)", () => {
  const t = surLeTerrain(
    { matraque_electrique: 1, sac_a_dos: 1 },
    [{ type: "banc_recharge", x: 20.5, z: 20, etat: { batteries: { batterie_voiture: 1 }, charges: { batterie_voiture: 40 } } }],
    { matraque_electrique: 0 },
  );
  const banc = t.joueur.bienvenue(0).installations.find((i) => i.type === "banc_recharge")!;
  // 0.8.2 (R17) : depuis la fiche du banc, la ligne de la matraque et son bouton « Charger ».
  t.joueur.recevoir({ t: "banc", id: banc.id, op: "charger", cible: "matraque_electrique" });
  t.attendre(20);
  assert.equal(t.dernier("usure")?.charge?.matraque_electrique ?? 0, 0, "pas encore");
  t.attendre(6);
  assert.equal(t.dernier("usure")?.charge?.matraque_electrique, undefined, "pleine (absente : pleine)");
  assert.ok(t.infos().some((x) => x.startsWith("+12 Wh")), t.infos().join(" | "));
  const apres = t.base.chargerInstallations(t.compte.id).find((i) => i.type === "banc_recharge")!;
  assert.ok(Math.abs((apres.etat.charges?.batterie_voiture ?? 0) - (40 - 12 / 0.85)) < 0.5);
  // Sans batterie dans le banc : on le dit.
  const u = surLeTerrain({ matraque_electrique: 1 }, [{ type: "banc_recharge", x: 20.5, z: 20 }], { matraque_electrique: 0 });
  const b2 = u.joueur.bienvenue(0).installations.find((i) => i.type === "banc_recharge")!;
  u.joueur.recevoir({ t: "banc", id: b2.id, op: "charger", cible: "matraque_electrique" });
  assert.match(u.infos().at(-1)!, /pas de batterie/);
});

// ---------- Les clôtures, la plaque, l'alarme ----------

const terrain = zoneDe("terrain");
const errant = (id: number, x: number, z: number) => nouvelEteint(id, x, z, "poursuivant");
const install = (id: number, type: InstallationVue["type"], x: number, z: number, etat: InstallationVue["etat"] = {}): InstallationVue => ({ id, type, x, z, o: Math.PI / 2, etat });
const pose = (i: InstallationVue): DeclencheurPose => ({ id: i.id, type: i.type, x: i.x, z: i.z, o: i.o, etat: (i.etat.declencheur ??= declencheurNeuf()) });

test("0.6 Voltaïques : la clôture tient un Éteint tant que le courant passe ; trois qui poussent la couchent ; elle ne détruit jamais", () => {
  const banc = install(1, "banc_recharge", 10, 14, { batteries: { petite_batterie: 1 }, charges: { petite_batterie: 50 } });
  const cloture = install(2, "cloture_electrique", 10, 10);
  alimenterClotures([banc, cloture], 0);
  assert.equal(cloture.etat.declencheur?.arme, true, "branchée à un banc chargé");
  // Un Éteint qui vient la toucher : raidi 2 s, repoussé d'un pas, encore et encore. Jamais détruit.
  const e = errant(1, 11, 10.2);
  const derniers = new Map<string, number>();
  for (let k = 0; k < 10; k++) {
    declencher([pose(cloture)], [e], k * 2500, terrain, derniers);
    assert.notEqual(e.etat, "detruit");
    e.x = 11;
    e.z = 10.2;
    e.raidi = 0;
    e.etourdi = 0;
  }
  assert.equal(cloture.etat.declencheur?.prises, 10);
  // Trois à la fois : elle se couche ; couchée, le courant n'y change rien, il faut la relever.
  declencher([pose(cloture)], [errant(2, 9, 10), errant(3, 10, 10.2), errant(4, 11, 9.9)], 40_000, terrain, derniers);
  assert.equal(cloture.etat.declencheur?.couche, true);
  alimenterClotures([banc, cloture], 50_000);
  assert.equal(cloture.etat.declencheur?.arme, false);
});

test("0.6 Voltaïques : la clôture tire ≈ 3 W du banc (72 Wh par jour de calendrier) ; sans banc ou batterie vide, plus de courant", () => {
  const banc = install(1, "banc_recharge", 10, 14, { batteries: { batterie_voiture: 1 }, charges: { batterie_voiture: 100 } });
  const cloture = install(2, "cloture_electrique", 10, 10, { majLe: 0 });
  const bascules: InstallationVue[] = [];
  alimenterClotures([banc, cloture], MS_JOUR_CALENDRIER, (c) => bascules.push(c));
  assert.ok(Math.abs((banc.etat.charges?.batterie_voiture ?? 0) - (100 - WATTS_CLOTURE.cloture_electrique * 24)) < 1e-6);
  assert.equal(cloture.etat.declencheur?.arme, true);
  // Un jour et demi plus tard, la batterie n'a plus rien : la clôture ne prend plus personne.
  alimenterClotures([banc, cloture], MS_JOUR_CALENDRIER * 2.5, (c) => bascules.push(c));
  assert.equal(cloture.etat.declencheur?.arme, false);
  assert.deepEqual(bascules, [cloture], "on prévient quand le courant s'en va");
  assert.equal(declencher([pose(cloture)], [errant(1, 11, 10.2)], 0, terrain).length, 0);
  // Trop loin d'un banc (plus de 6 m) : pas de courant.
  const seule = install(3, "cloture_fortune", 30, 30);
  alimenterClotures([install(4, "banc_recharge", 30, 37, { charges: { petite_batterie: 50 } }), seule], 0);
  assert.equal(seule.etat.declencheur?.arme, false);
});

test("0.6 Voltaïques : la plaque de choc met à terre le premier qui passe ; la réarmer coûte 0,5 Wh", () => {
  const def = definitionDeclencheur("plaque_choc")!;
  assert.deepEqual(def.effets, [{ genre: "mettre_a_terre", secondes: 4 }]);
  const plaque = install(1, "plaque_choc", 10, 10);
  const e = errant(1, 10.2, 10);
  declencher([pose(plaque)], [e, errant(2, 10, 10.3)], 0, terrain);
  assert.equal(e.etat, "a_terre");
  assert.equal(plaque.etat.declencheur?.arme, false);
  // En jeu : A sur la plaque la réarme, et prend 0,5 Wh à la matraque.
  const t = surLeTerrain({ matraque_electrique: 1 }, [{ type: "plaque_choc", x: 20.5, z: 20, etat: { declencheur: { arme: false, prises: 1 } } }], { matraque_electrique: 4 });
  const p = t.joueur.bienvenue(0).installations.find((i) => i.type === "plaque_choc")!;
  t.joueur.recevoir({ t: "interagir", cible: { genre: "installation", id: p.id }, verbe: "rearmer_piege" });
  t.attendre(4);
  assert.equal(t.dernier("installation")?.installation.etat.declencheur?.arme, true);
  assert.equal(t.dernier("usure")?.charge?.matraque_electrique, 3.5);
  // Sans courant du tout, on le dit.
  const u = surLeTerrain({}, [{ type: "plaque_choc", x: 20.5, z: 20, etat: { declencheur: { arme: false, prises: 1 } } }]);
  const p2 = u.joueur.bienvenue(0).installations.find((i) => i.type === "plaque_choc")!;
  u.joueur.recevoir({ t: "interagir", cible: { genre: "installation", id: p2.id }, verbe: "rearmer_piege" });
  assert.match(u.infos().at(-1)!, /0,5 Wh/);
});

test("0.6 Voltaïques : l'alarme électrique prévient sans rien faire à l'Éteint", () => {
  const alarme = install(1, "alarme_electrique", 10, 10);
  const e = errant(1, 10.5, 10.3);
  const faits = declencher([pose(alarme)], [e], 0, terrain);
  assert.equal(faits.length, 1);
  assert.equal(e.etat, "poursuivant");
  assert.equal(e.raidi ?? 0, 0);
  assert.match(definitionDeclencheur("alarme_electrique")!.message!, /LED/);
  assert.ok(definitionDeclencheur("alarme_electrique")!.message!.length <= 110);
});

test("0.6 Voltaïques : le contrôle accepte la manivelle au banc et la recharge au banc, pas n'importe quoi", () => {
  assert.ok(messageValide({ t: "banc", id: 3, op: "manivelle" }));
  assert.ok(!messageValide({ t: "banc", id: "3", op: "manivelle" }));
  // La manivelle ne charge plus une arme directement (0.8.2, R17) : elle remplit la batterie du banc.
  assert.ok(!messageValide({ t: "manivelle", objet: "matraque_electrique#2" }));
  assert.ok(messageValide({ t: "interagir", cible: { genre: "installation", id: 3 }, verbe: "recharger_armes" }));
});
