// 0.8.2, chantier B : les recettes et les objets. Une recette à deux façons se fait avec l'une ou l'autre et consomme la
// bonne (la corde d'arc, R15 ; la matraque électrique, R16) ; les deux condensateurs (R14) viennent du flash et de la
// raquette, et l'un ou l'autre fait le module de décharge, à son étoile ; la canette écrasée se démonte en aluminium, la
// boîte de conserve vide reste une boîte (R25) ; on remmanche près d'un établi (R13) ; une partie 0.8.1 se relit.

import { test } from "node:test";
import assert from "node:assert/strict";
import { ceQuiManque, ceQuiManqueBref } from "../../commun/src/aide-fabrication.ts";
import type { InstallationVue, MessageServeur } from "../../commun/src/messages.ts";
import type { Inventaire, TypeObjet } from "../../commun/src/objets.ts";
import { aDevoiler, devoileesAuDepart, progressionValide, toutDevoile, type EtatProgression } from "../../commun/src/progression.ts";
import { RECETTES, etoilesDuProduit, faconDisponible, faconsRecette, ingredientsPresents, recette, recetteAvecFacon, recetteHorsFamille } from "../../commun/src/recettes.ts";
import { DEMONTAGE } from "../../commun/src/vestiges.ts";
import { Base } from "./base.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

type Recu<T extends MessageServeur["t"]> = Extract<MessageServeur, { t: T }>;

/** Un Voltaïque sur son terrain, ce qu'on veut dans le sac et autour ; la progression : tout, sauf si on la donne. */
function surLeTerrain(inventaire: Inventaire, installations: { type: InstallationVue["type"]; x: number; z: number; etat?: InstallationVue["etat"] }[] = [], progression?: EtatProgression) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Ampère", "volts1234", "voltaiques");
  base.sauverProgression(compte.id, progression ?? toutDevoile("voltaiques"));
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
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
  const inventaireFinal = () => (recus.findLast((m) => m.t === "inventaire") as Recu<"inventaire"> | undefined)?.inventaire ?? {};
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as Recu<"info">).texte);
  const fabriquer = (id: string) => {
    joueur.recevoir({ t: "fabriquer", recette: id });
    attendre(10);
  };
  const demonter = (objet: TypeObjet) => {
    joueur.recevoir({ t: "demonter", objet });
    attendre(10);
  };
  return { base, compte, joueur, attendre, inventaireFinal, infos, fabriquer, demonter };
}

// Le banc solaire et son panneau : les armes de métier attendent le meuble complet (R26, 0.8.2).
const BANC = [{ type: "banc_recharge" as const, x: 21, z: 20, etat: { panneau: true } }];

// ---------- Le moteur : des ingrédients au choix ----------

test("0.8.2 : une recette à choix a ses façons complètes, et prend la première qu'on a dans le sac", () => {
  const corde = recette("corde_arc_ficelle")!;
  assert.deepEqual(faconsRecette(corde), [{ ficelle: 3 }, { corde: 1 }]);
  assert.deepEqual(faconDisponible({ corde: 1 }, corde), { corde: 1 });
  assert.deepEqual(faconDisponible({ ficelle: 3, corde: 1 }, corde), { ficelle: 3 }, "les ficelles d'abord");
  assert.equal(faconDisponible({ ficelle: 2 }, corde), null);
  assert.ok(ingredientsPresents({ corde: 1 }, corde) && !ingredientsPresents({ ficelle: 2 }, corde));
  // La recette faite avec ce sac : plus de choix, les ingrédients de la façon prise.
  const faite = recetteAvecFacon(corde, { ficelle: 1, corde: 1 });
  assert.deepEqual(faite.ingredients, { corde: 1 });
  assert.equal(faite.auChoix, undefined);
  // La matraque : le tronc commun, plus un pack ou la petite batterie.
  const matraque = recette("matraque_electrique")!;
  assert.deepEqual(faconsRecette(matraque), [
    { gourdin: 1, module_decharge: 1, caoutchouc: 1, pack_cellules: 1 },
    { gourdin: 1, module_decharge: 1, caoutchouc: 1, petite_batterie: 1 },
  ]);
  // Un objet de métier compte toutes étoiles confondues.
  assert.ok(ingredientsPresents({ gourdin: 1, "module_decharge#2": 1, caoutchouc: 1, petite_batterie: 1 }, matraque));
  // Hors de sa famille : ×1,5 sur chaque façon aussi.
  assert.deepEqual(recetteHorsFamille(matraque).auChoix, [{ pack_cellules: 2 }, { petite_batterie: 2 }]);
  assert.deepEqual(recetteHorsFamille(corde).auChoix, [{ ficelle: 5 }, { corde: 2 }]);
});

test("0.8.2 : ce qui manque à une recette à choix se dit sur une ligne, « 3 ficelles ou 1 corde »", () => {
  const corde = recette("corde_arc_ficelle")!;
  assert.deepEqual(ceQuiManque(corde, {}), ["Il te manque 3 ficelles ou 1 rouleau de corde."]);
  assert.match(ceQuiManqueBref(corde, { ficelle: 1 }), /^Il te manque 2 ficelles ou 1 rouleau de corde\./);
  assert.deepEqual(ceQuiManque(corde, { corde: 1 }), []);
});

test("0.8.2 : Fabriquer n'a plus qu'une ligne de corde d'arc (ficelles ou corde) et une de matraque électrique", () => {
  const cordes = RECETTES.filter((r) => faconsRecette(r).some((f) => f.ficelle === 3 || f.corde === 1) && "objet" in r.produit && r.produit.objet === "corde_arc");
  assert.deepEqual(cordes.map((r) => r.id), ["corde_arc_ficelle"]);
  assert.equal(recette("corde_arc_corde"), undefined);
  // Une seule matraque électrique au banc solaire ; les autres (niveau 2, plan 0.10) se montent au poste de montage.
  const matraques = RECETTES.filter((r) => !r.aVenir && "objet" in r.produit && r.produit.objet === "matraque_electrique");
  assert.deepEqual(matraques.filter((r) => r.lieu.genre === "construction" && !r.lieu.accessoire).map((r) => r.id), ["matraque_electrique"]);
  assert.deepEqual(matraques.filter((r) => r.lieu.genre === "construction" && r.lieu.accessoire === "poste_montage").map((r) => r.id), ["matraque_electrodes", "matraque_manche_tourne", "matraque_contacts_soudes"]);
  assert.equal(recette("matraque_petite_batterie"), undefined);
  // Un seul module de décharge au banc solaire (la bobine se monte au poste de montage, niveau 2).
  const modules = RECETTES.filter((r) => !r.aVenir && "objet" in r.produit && r.produit.objet === "module_decharge");
  assert.deepEqual(modules.map((r) => r.id), ["module_decharge", "module_bobine"]);
  assert.deepEqual(recette("module_bobine")!.lieu, { genre: "construction", construction: "banc_recharge", accessoire: "poste_montage" });
  assert.equal(recette("module_flash"), undefined);
  assert.equal(recette("module_raquette"), undefined);
});

// ---------- La corde d'arc (R15) ----------

test("0.8.2 R15 : la corde d'arc se fait de 3 ficelles ou d'une corde, et consomme la bonne", () => {
  const avecFicelles = surLeTerrain({ ficelle: 3, corde: 1 });
  avecFicelles.fabriquer("corde_arc_ficelle");
  let inv = avecFicelles.inventaireFinal();
  assert.equal(inv["corde_arc#2"], 1, avecFicelles.infos().join(" | "));
  assert.equal(inv.ficelle, undefined, "les ficelles sont prises");
  assert.equal(inv.corde, 1, "la corde reste");

  const avecCorde = surLeTerrain({ ficelle: 2, corde: 1 });
  avecCorde.fabriquer("corde_arc_ficelle");
  inv = avecCorde.inventaireFinal();
  assert.equal(inv["corde_arc#2"], 1, avecCorde.infos().join(" | "));
  assert.equal(inv.corde, undefined, "la corde est prise");
  assert.equal(inv.ficelle, 2, "les ficelles restent");

  const sansRien = surLeTerrain({ ficelle: 1 });
  sansRien.fabriquer("corde_arc_ficelle");
  assert.ok(sansRien.infos().some((t) => t.includes("2 ficelles ou 1 rouleau de corde")), sansRien.infos().join(" | "));
});

// ---------- La matraque électrique (R16) ----------

test("0.8.2 R16 : la matraque électrique se fait d'un pack de cellules ou de la petite batterie, et consomme la bonne", () => {
  const commun = { gourdin: 1, caoutchouc: 1, couteau: 1, tournevis: 1 };
  const avecPack = surLeTerrain({ ...commun, "module_decharge#2": 1, pack_cellules: 1, petite_batterie: 1 }, BANC);
  avecPack.fabriquer("matraque_electrique");
  let inv = avecPack.inventaireFinal();
  assert.equal(inv["matraque_electrique#2"], 1, avecPack.infos().join(" | "));
  assert.equal(inv.pack_cellules, undefined, "le pack passe d'abord");
  assert.equal(inv.petite_batterie, 1, "la petite batterie reste");

  const avecBatterie = surLeTerrain({ ...commun, "module_decharge#2": 1, petite_batterie: 1 }, BANC);
  avecBatterie.fabriquer("matraque_electrique");
  inv = avecBatterie.inventaireFinal();
  assert.equal(inv["matraque_electrique#2"], 1, avecBatterie.infos().join(" | "));
  assert.equal(inv.petite_batterie, undefined, "la petite batterie est dans le manche");
});

test("0.8.2 R16 : avec la petite batterie, la matraque électrique ne passe pas ★★, même au module ★★★ ; la note le dit", () => {
  const matraque = recette("matraque_electrique")!;
  const base = { gourdin: 1, caoutchouc: 1, module_decharge: 1 };
  assert.equal(etoilesDuProduit(matraque, { ...base, pack_cellules: 1 }), 3);
  assert.equal(etoilesDuProduit(matraque, { ...base, petite_batterie: 1 }), 2);
  assert.equal(etoilesDuProduit(matraque, { ...base, "module_decharge#1": 1, module_decharge: 0, petite_batterie: 1 }), 1, "le maillon faible reste le module");
  assert.match(matraque.note ?? "", /petite batterie, ★★ au plus/);
  assert.match(matraque.note ?? "", /unique/);
});

// ---------- Les condensateurs et le module de décharge (R14, Q-0.8.2-4) ----------

test("0.8.2 R14 : démonter un flash jetable donne un petit condensateur, une raquette un condensateur moyen", () => {
  assert.deepEqual(DEMONTAGE.appareil_photo_jetable?.donne, { petit_condensateur: 1 });
  assert.deepEqual(DEMONTAGE.raquette_moustiques?.donne, { condensateur_moyen: 1 });
  const t = surLeTerrain({ couteau: 1, appareil_photo_jetable: 1, raquette_moustiques: 1 });
  t.demonter("appareil_photo_jetable");
  t.demonter("raquette_moustiques");
  const inv = t.inventaireFinal();
  assert.equal(inv.petit_condensateur, 1, t.infos().join(" | "));
  assert.equal(inv.condensateur_moyen, 1, t.infos().join(" | "));
  assert.equal(inv.appareil_photo_jetable, undefined);
  assert.equal(inv.raquette_moustiques, undefined);
});

test("0.8.2 R14 : le module de décharge se fait de l'un ou l'autre condensateur, et prend son étoile", () => {
  const module = recette("module_decharge")!;
  assert.equal(etoilesDuProduit(module, { fil_cuivre: 1, petit_condensateur: 1 }), 1);
  assert.equal(etoilesDuProduit(module, { fil_cuivre: 1, condensateur_moyen: 1 }), 2);
  // La maîtrise : une de plus, comme avant (inchangée).
  assert.equal(etoilesDuProduit(module, { fil_cuivre: 1, condensateur_moyen: 1 }, { maitrise: true }), 3);

  const petit = surLeTerrain({ couteau: 1, fil_cuivre: 1, petit_condensateur: 1 }, BANC);
  petit.fabriquer("module_decharge");
  assert.equal(petit.inventaireFinal()["module_decharge#1"], 1, petit.infos().join(" | "));
  assert.equal(petit.inventaireFinal().petit_condensateur, undefined);

  const moyen = surLeTerrain({ couteau: 1, fil_cuivre: 2, petit_condensateur: 1, condensateur_moyen: 1 }, BANC);
  moyen.fabriquer("module_decharge");
  const inv = moyen.inventaireFinal();
  assert.equal(inv["module_decharge#2"], 1, moyen.infos().join(" | "));
  assert.equal(inv.condensateur_moyen, undefined, "le moyen passe d'abord");
  assert.equal(inv.petit_condensateur, 1);
});

// ---------- La canette et la boîte de conserve (R25) ----------

test("0.8.2 R25 : trois canettes écrasées se démontent en une chute d'aluminium ; une boîte de conserve vide ne se démonte pas", () => {
  assert.deepEqual(DEMONTAGE.canette?.donne, { aluminium: 1 });
  assert.equal(DEMONTAGE.canette?.par, 3, "trois canettes pour une chute (décision du porteur)");
  assert.equal(DEMONTAGE.boite_vide, undefined);
  // Deux canettes : pas assez, rien ne bouge, et on dit combien il en faut.
  const deux = surLeTerrain({ pierre: 1, canette: 2 });
  deux.demonter("canette");
  assert.equal(deux.inventaireFinal().aluminium, undefined);
  assert.ok(deux.infos().some((x) => x.includes("Il en faut 3")), deux.infos().join(" | "));
  // Quatre : trois partent, une chute vient, une canette reste.
  const t = surLeTerrain({ pierre: 1, canette: 4 });
  t.demonter("canette");
  const inv = t.inventaireFinal();
  assert.equal(inv.aluminium, 1, t.infos().join(" | "));
  assert.equal(inv.canette, 1);
});

test("0.8.2 : la matraque de fortune prend le petit condensateur, plus l'appareil photo ; ses étoiles et sa note ne changent pas", () => {
  const r = recette("matraque_fortune")!;
  assert.deepEqual(r.ingredients, { gourdin: 1, petit_condensateur: 1, petite_batterie: 1, ficelle: 1 });
  assert.equal(etoilesDuProduit(r, r.ingredients), 1);
  assert.match(r.note ?? "", /petite batterie de la frontale est unique/);
  const t = surLeTerrain({ couteau: 1, tournevis: 1, gourdin: 1, petite_batterie: 1, ficelle: 1, appareil_photo_jetable: 1 }, BANC);
  t.fabriquer("matraque_fortune");
  assert.equal(t.inventaireFinal().matraque_fortune, undefined, "l'appareil entier ne suffit plus");
  t.demonter("appareil_photo_jetable");
  t.fabriquer("matraque_fortune");
  const inv = t.inventaireFinal();
  assert.equal(inv.matraque_fortune, 1, t.infos().join(" | "));
  assert.equal(inv.petit_condensateur, undefined);
  // Une matraque de fortune d'une partie 0.8.1 reste une matraque de fortune.
  const ancienne = surLeTerrain({ matraque_fortune: 1, "matraque_fortune#2": 1 });
  ancienne.attendre(1);
  assert.equal(ancienne.joueur.bienvenue(0).inventaire.matraque_fortune, 1);
  assert.equal(ancienne.joueur.bienvenue(0).inventaire["matraque_fortune#2"], 1);
});

// ---------- Remmancher près d'un établi (R13) ----------

test("0.8.2 R13 : remmancher une hache ou un marteau est refusé loin d'un établi, et se fait à côté", () => {
  for (const id of ["hache", "marteau"]) assert.deepEqual(recette(id)!.lieu, { genre: "construction", construction: "etabli" }, id);
  const sac = { couteau: 1, pierre: 1, tete_hache: 1, tete_marteau: 1, branche: 2 };
  const loin = surLeTerrain(sac, [{ type: "etabli", x: 40, z: 40 }]);
  loin.fabriquer("hache");
  loin.fabriquer("marteau");
  assert.equal(loin.inventaireFinal().hache, undefined);
  assert.ok(loin.infos().some((t) => /établi/i.test(t)), loin.infos().join(" | "));

  const pres = surLeTerrain(sac, [{ type: "etabli", x: 21, z: 20 }]);
  pres.fabriquer("hache");
  pres.fabriquer("marteau");
  const inv = pres.inventaireFinal();
  assert.equal(inv.hache, 1, pres.infos().join(" | "));
  assert.equal(inv.marteau, 1, pres.infos().join(" | "));
});

test("0.8.2 R13 : au tutoriel, l'étape « L'outil » dévoile l'établi, où l'on remmanche la hache", () => {
  const nouvelles = aDevoiler({
    famille: "voltaiques",
    vus: new Set(["tete_hache", "branche", "pierre"]),
    faits: {},
    installations: new Map(),
    quetes: new Set(),
    tuto: 5,
    minutes: 0,
    sansSac: false,
    devoilees: new Set(devoileesAuDepart()),
  });
  assert.ok(nouvelles.includes("etabli"), nouvelles.join(", "));
});

// ---------- Une partie 0.8.1 se relit ----------

test("0.8.2 : une partie 0.8.1 (un module au flash, les anciennes recettes dévoilées) se relit, et le module sert", () => {
  const tout = toutDevoile("voltaiques");
  // L'état d'une partie 0.8.1 : les modules au flash et à la raquette, la matraque à la petite batterie, la corde
  // retordue, dévoilés ; un module ★ fait au flash dans le sac.
  const ancienne = { ...tout, devoilees: [...tout.devoilees.filter((id) => id !== "module_decharge"), "module_flash", "module_raquette", "matraque_petite_batterie", "corde_arc_corde"] };
  const relue = progressionValide(JSON.parse(JSON.stringify(ancienne)));
  for (const id of ["module_flash", "module_raquette", "matraque_petite_batterie", "corde_arc_corde"]) assert.ok(!relue.devoilees.includes(id), id);
  const t = surLeTerrain({ couteau: 1, tournevis: 1, gourdin: 1, caoutchouc: 1, "module_decharge#1": 1, petite_batterie: 1 }, BANC, ancienne);
  t.fabriquer("matraque_electrique");
  const inv = t.inventaireFinal();
  assert.equal(inv["matraque_electrique#1"], 1, t.infos().join(" | "));
  assert.equal(inv["module_decharge#1"], undefined);
});
