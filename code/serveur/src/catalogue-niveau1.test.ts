// Le catalogue du niveau 1 (plan 0.8, chantier 3) : tous les objets nouveaux sont déclarés d'un coup ; les sources que
// la grille interdit au niveau 1 sont retirées (bobine, roulements, alternateur de tracteur) ; les clés de L1 sortent
// des tables de fouille courantes ; vider un bocal de clous donne 5 poignées.

import { test } from "node:test";
import assert from "node:assert/strict";
import { tableDecharge } from "../../commun/src/decharge.ts";
import { CONTENEURS, POINTS_DECHETS, PROFILS_DECHETS, tableDechets, type GenreEmplacement, type TypeLieuDechets } from "../../commun/src/dechets.ts";
import { ACCESSOIRES_PEDALIER } from "../../commun/src/mecanique.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { OBJETS, nommer, type TypeObjet } from "../../commun/src/objets.ts";
import { NOUVEAUX_OBJETS_0_8, OBJETS_NIVEAU1 } from "../../commun/src/objets-niveau1.ts";
import { QUALITES_OBJETS, energieGrise, niveauQualite } from "../../commun/src/recettes.ts";
import { REPOUSSE_MS, USAGES, type TypeRessourceNiveau1 } from "../../commun/src/terrain.ts";
import { DEMONTAGE, FAMILLES_PAR_LIEU, definitionVestige, tableDeFouille, type LieuFouille } from "../../commun/src/vestiges.ts";
import { DEMONTAGE_LOT2, VESTIGES_LOT2 } from "../../commun/src/vestiges-lot2.ts";
import { Base } from "./base.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

// ---------- Les objets nouveaux ----------

test("chaque objet nouveau de la 0.8 est déclaré : nom, pluriel, poids, description, valeur", () => {
  assert.equal(new Set(NOUVEAUX_OBJETS_0_8).size, NOUVEAUX_OBJETS_0_8.length, "un identifiant en double");
  for (const t of NOUVEAUX_OBJETS_0_8) {
    const d = OBJETS[t];
    assert.ok(d, `${t} absent du catalogue`);
    assert.ok(d.nom.length > 0 && d.pluriel.length > 0 && d.description.length > 20, t);
    assert.ok(d.poids > 0, `${t} : poids`);
    assert.ok(energieGrise(t) > 0, `${t} : sans valeur`);
  }
  // Tout ce qui est fabriqué ou extrait est dans la liste ; tout ce qu'on trouve est un vestige à place fixe, avec sa famille.
  for (const t of Object.keys(OBJETS_NIVEAU1)) assert.ok(NOUVEAUX_OBJETS_0_8.includes(t as TypeObjet), t);
  for (const t of NOUVEAUX_OBJETS_0_8) {
    if (t in OBJETS_NIVEAU1) continue;
    const v = definitionVestige(t);
    assert.ok(v, `${t} : un objet trouvé est un vestige`);
    assert.equal(v.horsTirage, true, `${t} : il a sa place fixe, hors des tirages`);
  }
  // Les identifiants du plan, fixés une fois pour toutes.
  for (const t of ["bidon_5l", "tete_marteau", "enclume_depanneur", "petit_alternateur", "glaise", "seau_10l", "toile_jute", "feuillards", "fourche_foin", "poignee_clous"]) {
    assert.ok(t in OBJETS, t);
  }
  // Une poignée de clous pèse le cinquième du bocal ; la glaise, 2 kg (B6).
  assert.equal(OBJETS.poignee_clous.poids * 5, OBJETS.bocal_clous.poids);
  assert.equal(OBJETS.glaise.poids, 2);
});

test("les qualités des objets nouveaux : la fortune donne le niveau 1, l'étau ne serre que sur l'établi, le marteau de fortune martèle à 2", () => {
  // Décision du porteur (2026-10-10) : l'étau porté ne serre pas ; l'établi à étau donne Serrer 3 (outils-a-portee.ts).
  assert.equal(QUALITES_OBJETS.etau, undefined);
  assert.deepEqual(QUALITES_OBJETS.serre_joint_fortune, { serrer: 1 });
  assert.deepEqual(QUALITES_OBJETS.scie_fortune, { scier_bois: 1 });
  assert.deepEqual(QUALITES_OBJETS.marteau_fortune, { marteler: 2 });
  assert.deepEqual(QUALITES_OBJETS.coin_bois, { fendre: 1 });
  assert.deepEqual(QUALITES_OBJETS.baton_fouir_durci, { creuser: 1 });
  // La tête de marteau remmanchée est le marteau (Marteler 2) ; la tête seule et la fourche ne sont pas des outils (I30).
  assert.equal(niveauQualite({ marteau: 1 }, "marteler"), 2);
  assert.equal(QUALITES_OBJETS.tete_marteau, undefined);
  assert.equal(QUALITES_OBJETS.fourche_foin, undefined);
});

test("le jerrican vide devient un jerrican percé : même identifiant, un déchet de plastique", () => {
  const j = VESTIGES_LOT2.jerrican;
  assert.equal(j.nom, "jerrican percé");
  assert.equal(nommer("jerrican", 2), "2 jerricans percés");
  assert.equal(j.famille, "dechet");
  assert.deepEqual(DEMONTAGE_LOT2.jerrican?.donne, { plastique: 2 });
});

test("l'accessoire ⚙️ du pédalier s'appelle le ventilateur à manivelle (Q-0.8-13) ; son identifiant ne change pas", () => {
  assert.equal(ACCESSOIRES_PEDALIER.soufflet.nom, "le ventilateur à manivelle");
});

test("les ressources du niveau 1 sont déclarées d'avance, avec leur délai ; leurs usages viendront avec leur lieu", () => {
  const nouvelles: TypeRessourceNiveau1[] = [
    "piece_enclume",
    "piece_alternateur",
    "tas_bois",
    "coop_grillage",
    "coop_cocotte",
    "gisement_glaise",
    "banc_galets",
    "moulin_jute",
    "moulin_feuillards",
    "moulin_etau",
    "moulin_fourche",
    "if_bief",
    "poutres_chene",
    "moulin_cle",
  ];
  for (const r of nouvelles) assert.ok(r in REPOUSSE_MS, r);
  assert.equal(REPOUSSE_MS.tas_bois, 6 * 3_600_000);
  assert.equal(REPOUSSE_MS.banc_galets, 6 * 3_600_000);
  assert.equal(REPOUSSE_MS.moulin_fourche, null, "la fourche : une fois par personnage");
  // Un usage, s'il est là, donne des objets qui existent.
  for (const r of nouvelles) for (const t of Object.keys(USAGES[r]?.donne ?? {})) assert.ok(t in OBJETS, `${r} → ${t}`);
});

// ---------- Les sources retirées ----------

test("la machine à laver et la trottinette ne donnent plus de roulement ; la mobylette plus de bobine", () => {
  assert.equal(POINTS_DECHETS.machine_laver.donne.roulements, undefined);
  assert.equal(DEMONTAGE.trottinette_electrique?.donne.roulements, undefined);
  assert.equal(POINTS_DECHETS.epave_mobylette.donne.bobine_allumage, undefined);
  assert.doesNotMatch(POINTS_DECHETS.machine_laver.examen, /un roulement,/);
});

test("la chambre froide de la Coopérative ne donne plus ni roulements ni alternateur de tracteur", () => {
  const donne = USAGES.coop_caisse_froide.donne;
  assert.equal(donne.roulements, undefined);
  assert.equal(donne.alternateur_tracteur, undefined);
});

/** Toutes les tables de tirage du jeu : fouilles des haltes et de la Coopérative, déchets de chaque lieu, décharge. */
function toutesLesTables(): [string, TypeObjet[]][] {
  const tables: [string, TypeObjet[]][] = [];
  for (const lieu of Object.keys(FAMILLES_PAR_LIEU) as LieuFouille[]) tables.push([`fouille ${lieu}`, tableDeFouille(lieu).map(([t]) => t)]);
  const genres: GenreEmplacement[] = ["sol", ...(Object.keys(CONTENEURS) as GenreEmplacement[])];
  for (const lieu of Object.keys(PROFILS_DECHETS) as TypeLieuDechets[]) {
    for (const genre of genres) {
      const t = tableDechets(lieu, genre);
      tables.push([`déchets ${lieu} (${genre})`, [...t.dechet, ...t.petite, ...t.bonne].map(([x]) => x)]);
    }
  }
  tables.push(["décharge", tableDecharge().map(([t]) => t)]);
  return tables;
}

// La chance rare d'une clé de L1 ailleurs que chez elle (R-BUTIN, I7) est fixée à la main par le chantier 10 : s'il la
// met dans une de ces tables, il y ajoute son exception ici, avec sa chance.
test("aucune table de fouille courante ne tire l'étau, le grillage ni la cocotte (I7), ni la bobine d'allumage (I12)", () => {
  const tables = toutesLesTables();
  assert.ok(tables.length > 20);
  for (const [nom, types] of tables) {
    for (const interdit of ["etau", "grillage_rouleau", "cocotte_fonte", "bobine_allumage"] as TypeObjet[]) {
      assert.ok(!types.includes(interdit), `${nom} tire ${interdit}`);
    }
  }
  // Les tables gardent leurs autres trouvailles d'atelier.
  assert.ok(tableDeFouille("atelier").some(([t]) => t === "bocal_clous"));
});

// ---------- Vider un bocal de clous ----------

test("vider un bocal de clous donne 5 poignées de clous (I2)", () => {
  assert.deepEqual(DEMONTAGE.bocal_clous?.donne, { poignee_clous: 5 });
  assert.deepEqual(DEMONTAGE.bocal_clous?.qualites, {});

  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "mecanistes");
  base.sauverInventaire(compte.id, { bocal_clous: 1 });
  base.sauverQuetes(compte.id, { faits: {}, finies: ["comptoir"], primes: 0 });
  let instant = 1_000_000;
  const recus: MessageServeur[] = [];
  const halte = new Halte(base, () => 0.5);
  halte.eteints = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 0.99);
  joueur.recevoir({ t: "demonter", objet: "bocal_clous" });
  for (let s = 0; s < 10; s += 0.25) {
    instant += 250;
    joueur.tick(0.25);
  }
  const inv = (recus.findLast((m) => m.t === "inventaire") as Extract<MessageServeur, { t: "inventaire" }>).inventaire;
  assert.equal(inv.bocal_clous, undefined);
  assert.equal(inv.poignee_clous, 5);
});
