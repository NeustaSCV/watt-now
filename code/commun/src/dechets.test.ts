// Les déchets de l'Abondance (0.7) : le catalogue du lot 2, les tables de tirage par type de lieu, les points du
// monde, et le débit des matières qui manquaient (proposition « objets et déchets », §2.2 et §4.2).

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CONTENEURS,
  EXISTANTS_DANS_LES_DECHETS,
  PARTS_PALIERS,
  POINTS_DECHETS,
  POIDS_MAX_CONTENEUR,
  PROFILS_DECHETS,
  aleaDe,
  contenuConteneur,
  contenuPoint,
  delaiRenouvellement,
  esperanceTirage,
  graineCarreau,
  palierDe,
  partsDe,
  piecesAmas,
  tasAEffacer,
  DUREE_ORDURE_JETEE_MS,
  tableDechets,
  tirerDechet,
  RENOUVELLEMENT_MS,
  type Palier,
  type TypeConteneur,
  type TypeLieuDechets,
} from "./dechets.ts";
import { tableDecharge } from "./decharge.ts";
import { prixAchat } from "./economie.ts";
import { OBJETS, estObjet, type TypeObjet } from "./objets.ts";
import { energieGrise } from "./recettes.ts";
import { DEMONTAGE, EN_PLUS_PAR_LIEU, NOMS_FAMILLES_VESTIGES, VESTIGES, estOrdure, tableDeFouille, type LieuFouille } from "./vestiges.ts";
import { DEMONTAGE_LOT2, VESTIGES_LOT2, estVestigeLot2, type TypeVestigeLot2 } from "./vestiges-lot2.ts";

const LOT2 = Object.keys(VESTIGES_LOT2) as TypeVestigeLot2[];
const LIEUX = Object.keys(PROFILS_DECHETS) as TypeLieuDechets[];

test("le catalogue du lot 2 : 91 objets du sac (et le trampoline, point fixe), pesés, nommés, valorisés", () => {
  assert.equal(LOT2.length, 91);
  assert.ok(POINTS_DECHETS.trampoline, "le 92e : le trampoline, démonté sur place");
  for (const t of LOT2) {
    const d = VESTIGES_LOT2[t];
    assert.ok(estObjet(t), t);
    assert.ok(d.nom && d.pluriel && d.description, `${t} : nom, pluriel, description`);
    assert.ok(d.poids > 0 && d.poids <= 40, `${t} : poids réaliste`);
    assert.ok(d.valeur >= 0 && d.valeur <= 120, `${t} : valeur`);
    assert.ok(["C", "P", "R"].includes(d.rarete), `${t} : rareté du lot 2 (pas de légendaire)`);
    assert.ok(d.lieux === "partout" || d.lieux.length > 0, `${t} : il traîne quelque part`);
    // Fiche lisible sur l'iPhone : une description de deux phrases au plus, jamais tronquée.
    assert.ok(d.description.length <= 130, `${t} : description trop longue (${d.description.length})`);
    assert.ok(!d.description.includes("…"), t);
  }
  // Les trois familles nouvelles, avec leurs noms.
  assert.equal(NOMS_FAMILLES_VESTIGES.dechet, "déchet");
  assert.equal(NOMS_FAMILLES_VESTIGES.textile, "textile");
  assert.equal(NOMS_FAMILLES_VESTIGES.loisir, "loisir");
  for (const f of ["dechet", "textile", "loisir"]) assert.ok(LOT2.some((t) => VESTIGES_LOT2[t].famille === f), f);
  // La grande majorité sans valeur ou presque, quelques bonnes trouvailles.
  const presqueRien = LOT2.filter((t) => VESTIGES_LOT2[t].valeur <= 2).length;
  const bonnes = LOT2.filter((t) => VESTIGES_LOT2[t].valeur >= 15).length;
  assert.ok(presqueRien >= 50, `${presqueRien} déchets sans valeur ou presque`);
  assert.ok(bonnes >= 8 && bonnes <= 15, `${bonnes} bonnes trouvailles`);
  // Ils sont bien dans le catalogue des objets et des vestiges.
  for (const t of LOT2) assert.equal(OBJETS[t].nom, VESTIGES[t].nom);
});

test("les démontages du lot 2 ne donnent que des matières qui existaient déjà (Q5)", () => {
  for (const [t, d] of Object.entries(DEMONTAGE_LOT2)) {
    assert.ok(estVestigeLot2(t), `${t} est un objet du lot 2`);
    assert.equal(DEMONTAGE[t as TypeObjet], d, `${t} : démontage branché`);
    assert.ok(d!.duree > 0, t);
    for (const [c, n] of Object.entries(d!.donne)) {
      assert.ok(estObjet(c), `${t} → ${c}`);
      assert.ok(!estVestigeLot2(c), `${t} → ${c} : aucune matière nouvelle`);
      assert.ok((n ?? 0) > 0, `${t} → ${c}`);
    }
  }
  // Ce qu'il faut pour les recettes qui manquaient (§2.2).
  const donne = (t: TypeObjet) => DEMONTAGE_LOT2[t]?.donne ?? {};
  assert.equal(donne("ressort_suspension").ressort_lames, 2);
  assert.equal(donne("lame_tondeuse").lame_ebrechee, 2);
  assert.equal(donne("onduleur").petite_batterie, 1);
  assert.equal(donne("trottinette_electrique").petite_batterie, 1);
  assert.equal(donne("velo_libre_service").cadre_velo, 1);
  assert.equal(donne("appareils_mariage").appareil_photo_jetable, 5);
  assert.equal(donne("stylo_ressort").petit_ressort, 1);
  assert.ok((donne("oreiller_plumes").plumes ?? 0) >= 2);
  assert.equal(donne("piquet_cloture").barre_metal, 1);
  assert.equal(donne("sac_charbon_bbq").charbon_bois, 2);
});

test("les ordures valent 0 : le Comptoir n'en veut pas ; les lots valent un peu", () => {
  for (const t of ["canette", "sac_plastique", "stylo_ressort", "conserve_bombee", "cone_chantier"] as TypeObjet[]) {
    assert.ok(estOrdure(t), t);
    assert.equal(energieGrise(t), 0, t);
    assert.equal(prixAchat(t, false), null, t);
  }
  assert.ok(!estOrdure("sac_canettes"));
  assert.ok((prixAchat("sac_canettes", false) ?? 0) > 0);
  // Un objet du lot 1 qui vaut peu n'est pas une ordure.
  assert.ok(!estOrdure("coussin_peteur") && !estOrdure("branche"));
});

test("la conserve bombée se mange, et elle rend malade (Book 05 §4)", () => {
  const d = OBJETS.conserve_bombee;
  assert.ok((d.kcal ?? 0) > 0, "elle a l'air d'une conserve : on peut la manger");
  assert.equal(d.toxique, "conserve_bombee");
  assert.equal(DEMONTAGE.conserve_bombee?.donne.boite_vide, 1);
});

test("les fouilles existantes donnent aussi le couteau, l'onduleur, la trottinette, le charbon et la conserve bombée", () => {
  const ou = (t: TypeObjet) => (Object.keys(EN_PLUS_PAR_LIEU) as LieuFouille[]).filter((l) => tableDeFouille(l).some(([x]) => x === t));
  for (const t of ["couteau", "onduleur", "trottinette_electrique", "sac_charbon_bbq", "conserve_bombee"] as TypeObjet[]) assert.ok(ou(t).length > 0, `${t} ne sort nulle part`);
  // Le couteau est rare, l'onduleur peu commun, la conserve bombée commune.
  const boutique = new Map(tableDeFouille("boutique"));
  assert.ok(boutique.get("couteau")! < boutique.get("onduleur")!);
  assert.ok(boutique.get("onduleur")! < boutique.get("conserve_bombee")!);
  // Les ordures du lot 2 n'encombrent pas les caisses et les rayonnages.
  for (const l of Object.keys(EN_PLUS_PAR_LIEU) as LieuFouille[]) assert.ok(!tableDeFouille(l).some(([t]) => t === "canette"), l);
  // La décharge du terrain, elle, remonte de tout, surtout des ordures.
  const decharge = new Map(tableDecharge());
  assert.ok(decharge.has("canette") && decharge.has("stylo_ressort"));
});

test("chaque table : ≈ 70 % de déchets, ≈ 25 % de petites trouvailles, ≈ 5 % de bonnes", () => {
  for (const lieu of LIEUX) {
    // La berge du gué tire par groupes, pas par paliers (dechets-berge.test.ts).
    if (PROFILS_DECHETS[lieu].groupes) continue;
    const table = tableDechets(lieu);
    assert.ok(table.dechet.length >= 5, `${lieu} : des déchets`);
    const compte: Record<Palier, number> = { dechet: 0, petite: 0, bonne: 0 };
    const alea = aleaDe(7);
    const N = 6000;
    for (let i = 0; i < N; i++) compte[palierDe(tirerDechet(table, alea))]++;
    if (lieu === "comptoir") {
      // Les Compteurs ne laissent rien traîner de valeur.
      assert.equal(compte.dechet, N);
      continue;
    }
    for (const p of ["dechet", "petite", "bonne"] as Palier[]) {
      if (table[p].length === 0) continue;
      assert.ok(Math.abs(compte[p] / N - partsDe(table)[p]) < 0.035, `${lieu} : ${p} ${(compte[p] / N).toFixed(3)}`);
      if (table.dechet.length && table.petite.length && table.bonne.length) assert.equal(partsDe(table)[p], PARTS_PALIERS[p]);
    }
  }
});

test("au sol, rien de moins de 10 cm ; dans un conteneur, rien de trop lourd", () => {
  for (const lieu of LIEUX) {
    const sol = tableDechets(lieu, "sol");
    for (const p of ["dechet", "petite", "bonne"] as Palier[]) {
      for (const [t] of sol[p]) assert.ok(!("petit" in (VESTIGES_LOT2[t as TypeVestigeLot2] ?? {})), `${t} au sol (${lieu})`);
    }
    for (const c of Object.keys(CONTENEURS) as TypeConteneur[]) {
      const table = tableDechets(lieu, c);
      for (const p of ["dechet", "petite", "bonne"] as Palier[]) for (const [t] of table[p]) assert.ok(OBJETS[t].poids <= POIDS_MAX_CONTENEUR, `${t} dans ${c}`);
    }
  }
  // Les petits objets existent bien, dans les conteneurs.
  assert.ok(tableDechets("village", "sac_poubelle").dechet.some(([t]) => t === "carte_platine"));
  assert.ok(!tableDechets("village", "sol").dechet.some(([t]) => t === "carte_platine"));
});

test("une graine, un contenu : les amas et les conteneurs se recalculent à l'identique", () => {
  const g = graineCarreau("halte", 3, -2, 0);
  assert.equal(g, graineCarreau("halte", 3, -2, 0));
  assert.notEqual(g, graineCarreau("halte", 3, -2, 1), "un nouveau remplissage, un nouveau tirage");
  assert.deepEqual(piecesAmas(g, "route", 6), piecesAmas(g, "route", 6));
  assert.equal(piecesAmas(g, "route", 6).length, 6);
  const c = contenuConteneur(g, "parking", "poubelle_renversee");
  assert.deepEqual(c, contenuConteneur(g, "parking", "poubelle_renversee"));
  const n = Object.values(c).reduce((s, k) => s + (k ?? 0), 0);
  assert.ok(n >= 1 && n <= 3);
  // Le coffre : 1 ou 2 objets, plutôt de la voiture et du textile.
  for (let i = 0; i < 50; i++) {
    const coffre = contenuConteneur(graineCarreau("halte", i, 0, 0), "route", "coffre_voiture");
    const k = Object.values(coffre).reduce((s, x) => s + (x ?? 0), 0);
    assert.ok(k >= 1 && k <= 2);
  }
  // Le renouvellement : 8 à 24 h, toujours le même pour un carreau.
  for (let i = 0; i < 100; i++) {
    const d = delaiRenouvellement(graineCarreau("coop", i, i, 0));
    assert.ok(d >= RENOUVELLEMENT_MS.min && d <= RENOUVELLEMENT_MS.max);
  }
  assert.equal(delaiRenouvellement(g), delaiRenouvellement(g));
});

test("les points du monde (§3.8) : ce qu'ils donnent existe ; on fouille, on démonte, on ramasse", () => {
  for (const [p, d] of Object.entries(POINTS_DECHETS)) {
    for (const t of Object.keys(d.donne)) assert.ok(estObjet(t), `${p} → ${t}`);
    assert.ok(d.duree > 0 && d.libelle && d.examen, p);
    assert.ok(d.verbe !== "fouiller" || d.conteneur || d.chanceDechet, `${p} : on y trouve quelque chose`);
  }
  assert.deepEqual(POINTS_DECHETS.trampoline.donne, { petit_ressort: 12, barre_metal: 3, bache: 1 });
  // Plan 0.8 (I9) : la machine à laver ne donne plus de roulement.
  assert.equal(POINTS_DECHETS.machine_laver.donne.roulements, undefined);
  assert.equal(POINTS_DECHETS.carcasse_mouton.donne.os, 6);
  // Le tas de gravats : toujours deux pierres, parfois un déchet en plus.
  let avecDechet = 0;
  for (let i = 0; i < 300; i++) {
    const c = contenuPoint("tas_gravats", i, "village");
    assert.ok((c.pierre ?? 0) >= 2);
    if (Object.keys(c).length > 1) avecDechet++;
  }
  assert.ok(avecDechet > 60 && avecDechet < 140, `${avecDechet} sur 300`);
  // Le sac-poubelle : 1 à 3 objets tirés dans la table du lieu.
  const sac = contenuPoint("sac_poubelle", 42, "route");
  const n = Object.values(sac).reduce((s, k) => s + (k ?? 0), 0);
  assert.ok(n >= 1 && n <= 3);
});

test("une ordure jetée disparaît au bout de 24 h, sauf sur le terrain personnel (Q10)", () => {
  const avant = 1_000_000;
  const apres = avant + DUREE_ORDURE_JETEE_MS;
  assert.equal(tasAEffacer({ canette: 2, sac_plastique: 1 }, avant, apres, false), true);
  assert.equal(tasAEffacer({ canette: 2 }, avant, apres - 1, false), false, "pas avant 24 h");
  assert.equal(tasAEffacer({ canette: 2 }, avant, apres, true), false, "le terrain personnel garde ses ordures");
  assert.equal(tasAEffacer({ canette: 2, sac_canettes: 1 }, avant, apres, false), false, "un objet de valeur garde le tas");
  assert.equal(tasAEffacer({}, avant, apres, false), false);
});

// ---------- Le débit des matières qui manquaient (§2.2, §4.2) ----------

/**
 * La tournée d'un joueur seul, une heure de jeu par jour entre la halte et la Coopérative (§4.2) : ≈ 44 emplacements
 * visités. La halte : la route (200 m), la station, la cour de ferme, la lisière. La Coopérative : le parking et ses
 * épaves, la cour, le hangar, les bureaux. Chaque emplacement est une pièce au sol, ou un conteneur selon la part du
 * lieu. Le vélo du fossé revient tous les 7 jours, un par lieu (halte et Coopérative) ; la carcasse de mouton tous les
 * 3 jours, un par lieu. La décharge du terrain n'est pas comptée : c'est un bonus.
 */
const TOURNEE: [TypeLieuDechets, number, TypeConteneur][] = [
  ["route", 10, "sac_poubelle"],
  ["parking", 10, "poubelle_renversee"],
  ["ferme", 4, "sac_poubelle"],
  ["bois", 2, "sac_poubelle"],
  ["parking", 6, "coffre_voiture"],
  ["ferme", 4, "sac_poubelle"],
  ["atelier", 4, "sac_poubelle"],
  ["interieur", 4, "sac_poubelle"],
];

function debitParJour(): Partial<Record<TypeObjet, number>> {
  const objets: Partial<Record<TypeObjet, number>> = {};
  const ajouter = (t: TypeObjet, k: number) => (objets[t] = (objets[t] ?? 0) + k);
  for (const [lieu, n, conteneur] of TOURNEE) {
    const part = PROFILS_DECHETS[lieu].partConteneurs;
    const { min, max } = CONTENEURS[conteneur];
    for (const [t, e] of Object.entries(esperanceTirage(tableDechets(lieu, "sol")))) ajouter(t as TypeObjet, n * (1 - part) * (e ?? 0));
    for (const [t, e] of Object.entries(esperanceTirage(tableDechets(lieu, conteneur)))) ajouter(t as TypeObjet, ((n * part * (min + max)) / 2) * (e ?? 0));
  }
  // Les points qui reviennent : on les démonte ou on les ramasse sur place.
  const points: [keyof typeof POINTS_DECHETS, number][] = [
    ["velo_fosse", 2 / 7],
    ["carcasse_mouton", 2 / 3],
  ];
  const matieres: Partial<Record<TypeObjet, number>> = {};
  const ajouterMatiere = (t: TypeObjet, k: number) => (matieres[t] = (matieres[t] ?? 0) + k);
  for (const [p, k] of points) for (const [t, q] of Object.entries(POINTS_DECHETS[p].donne)) ajouterMatiere(t as TypeObjet, k * (q ?? 0));
  // Ce qu'on trouve tel quel, plus ce qu'on en tire au démontage.
  for (const [t, k] of Object.entries(objets) as [TypeObjet, number][]) {
    ajouterMatiere(t, k);
    for (const [m, q] of Object.entries(DEMONTAGE[t]?.donne ?? {})) ajouterMatiere(m as TypeObjet, k * (q ?? 0));
  }
  return matieres;
}

test("chaque matière qui manquait (§2.2) se trouve désormais, au débit visé (§4.2)", () => {
  const d = debitParJour();
  const v = (t: TypeObjet) => d[t] ?? 0;
  // 1. Barre de métal : au moins 2 par jour.
  assert.ok(v("barre_metal") >= 2, `barres : ${v("barre_metal").toFixed(2)}`);
  // 2. Lame de ressort (ou 2 lames ébréchées) : environ 1 par jour.
  const lames = v("ressort_lames") + v("lame_ebrechee") / 2;
  assert.ok(lames >= 0.8 && lames <= 2, `lames : ${lames.toFixed(2)}`);
  // 3. Pièces de vélo : un vélo complet tous les 3 jours.
  assert.ok(v("cadre_velo") >= 1 / 3, `cadres : ${v("cadre_velo").toFixed(2)}`);
  // 4. Appareil photo jetable : environ 1 par jour.
  assert.ok(v("appareil_photo_jetable") >= 0.8 && v("appareil_photo_jetable") <= 2, `appareils : ${v("appareil_photo_jetable").toFixed(2)}`);
  // 5. Petite batterie : une tous les 3 jours.
  assert.ok(v("petite_batterie") >= 1 / 3 - 0.01, `petites batteries : ${v("petite_batterie").toFixed(2)}`);
  // 6. Petit ressort : au moins 3 par jour.
  assert.ok(v("petit_ressort") >= 3, `petits ressorts : ${v("petit_ressort").toFixed(2)}`);
  // 7. Plumes : au moins 2 poignées par jour ; des os aussi.
  assert.ok(v("plumes") >= 2, `plumes : ${v("plumes").toFixed(2)}`);
  assert.ok(v("os") > 0);
  // 8 à 10. Chiffons, bâche, ficelle, couteau : trouvables. Les roulements, non : plan 0.8 (I9, §9.2), la boîte de
  // roulements est une clé de L2A ; la planche à roulettes et la trottinette n'en donnent plus.
  for (const t of ["chiffons", "bache", "ficelle", "couteau"] as TypeObjet[]) assert.ok(v(t) > 0, `${t} introuvable`);
  assert.equal(v("roulements"), 0);
  // 10. La pierre : le tas de gravats en donne, partout où il y a des ruines.
  assert.ok((POINTS_DECHETS.tas_gravats.donne.pierre ?? 0) > 0);
  // Le couteau et la conserve restent rares ; les matières de base, communes.
  assert.equal(EXISTANTS_DANS_LES_DECHETS.couteau?.rarete, "R");
});
