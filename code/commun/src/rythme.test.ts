// Le rythme de l'arbre de progression (0.7, chantier 6 ; décision Q5) : les parcours types tiennent la cible, rien ne
// bloque, le tutoriel et le carnet ne demandent jamais une recette invisible, chaque ingrédient se trouve.
// Plan 0.8 (chantier 14) : les sorties, les portes du niveau 1 et le budget de bois et de pierre (§2.7, critères 6, 7, 11).
// Plan 0.10 (chantier M) : le niveau 2, sur la côte (les sorties, les péages, la nuit du phare, les roulements, le budget).

import { test } from "node:test";
import assert from "node:assert/strict";
import { FAMILLES, type Famille } from "./regles.ts";
import { RECETTES, estHorsFamille, recette } from "./recettes.ts";
import { QUETES } from "./quetes.ts";
import { ATELIER, aDevoiler, armeEnAttente, devoileesAuDepart, maillons, recettesDeLEtape, recettesDeLaQuete, silhouettes, type EtatPourDevoilement } from "./progression.ts";
import {
  CIBLE,
  CLES_DE_LIEU,
  HYPOTHESES_DECIDEES,
  Haltes,
  RAVITAILLEMENTS_MAX,
  SERVEURS,
  TERRAIN_VRAC,
  budgetNiveau1,
  cibleDuProfil,
  ecartsALaCible,
  ecartsAuNiveau1,
  jouerParcours,
  postesNiveau1,
  quetesDeLaFamille,
  simulerServeur,
  tousLesParcours,
  CIBLE_NIVEAU_2,
  CLES_NIVEAU_2,
  HORIZON_NIVEAU_2_MIN,
  OUTILS_NIVEAU_2,
  allumeLaNuit,
  budgetNiveau2,
  ecartsAuNiveau2,
  heureDuMonde,
  jouerParcoursN2,
  pireMalchanceN2,
  simulerServeurN2,
  tousLesParcoursN2,
  wottsDePeage,
} from "./rythme.ts";
import { SAC_LIBRE_KG, budgetEnergie, demandeNiveau2, offreDeLaCote, poidsDesCles } from "./rythme-niveau2.ts";
import { trouvables } from "./trouvables.ts";
import { lieuPossede } from "./lieu-recette.ts";
import { PLAFONDS_NIVEAU_1 } from "./armes/grille.ts";
import { armeDeCle } from "./combat.ts";
import { ETAPES_EQUILIBRE, gardeFouEtape } from "./equilibre.ts";
import { armeTirDe, armeTirExemplaire } from "./tir.ts";

const PARCOURS = tousLesParcours();

function etat(famille: Famille, p: Partial<EtatPourDevoilement> = {}): EtatPourDevoilement {
  return { famille, vus: new Set(), faits: {}, installations: new Map(), quetes: new Set(), tuto: null, minutes: 0, sansSac: false, devoilees: new Set(devoileesAuDepart()), ...p };
}

test("rythme : douze parcours types (prudent, pressé, sans tutoriel, malchanceux × trois familles), et tous tiennent la cible", () => {
  assert.equal(PARCOURS.length, 12);
  const fautes = PARCOURS.flatMap(ecartsALaCible);
  assert.deepEqual(fautes, [], fautes.join("\n"));
});

test("rythme : rapide au début — avec le tutoriel, une nouveauté toutes les 3 min en moyenne, jamais 5 min sans rien", () => {
  for (const r of PARCOURS.filter((x) => x.profil !== "sans_tuto")) {
    const c = cibleDuProfil(r.profil);
    assert.ok(r.mesures.nouveautesDebut >= c.nouveautes!, `${r.profil} ${r.famille} : ${r.mesures.nouveautesDebut} nouveautés`);
    assert.ok(r.mesures.ecartNouveautesDebut <= c.trou! + 1e-9, `${r.profil} ${r.famille} : trou de ${r.mesures.ecartNouveautesDebut} min`);
    // Une vraie ouverture : une dizaine de recettes au moins dans la première demi-heure, et pas tout d'un coup. Sans
    // paliers (plan 0.8, chantier 2), ce qui se fait au foyer de pierres attend le foyer : 16 → 10 pour le prudent,
    // comme l'étude l'annonçait (`recettes-par-construction.md` §6.4) ; le chantier 14 le remesure avec les sorties.
    assert.ok(r.mesures.recettesDebut >= 10 && r.mesures.recettesDebut <= 40, `${r.profil} ${r.famille} : ${r.mesures.recettesDebut} recettes`);
  }
});

test("rythme : puis un bon rythme — un but nouveau au moins toutes les 20 min (au pas du joueur), les trois premières heures", () => {
  for (const r of PARCOURS) {
    assert.ok(r.mesures.ecartButsEnsuite <= cibleDuProfil(r.profil).buts + 1e-9, `${r.profil} ${r.famille} : ${r.mesures.ecartButsEnsuite} min`);
    // Le pressé et le vétéran finissent tout le carnet dans la soirée (main_tendue attend un autre joueur) ; le prudent,
    // qui passe d'abord les portes du niveau 1, en finit une partie, et tout le niveau 1.
    const seul = quetesDeLaFamille(r.famille).filter((q) => q.id !== "main_tendue").length;
    if (r.profil === "presse" || r.profil === "sans_tuto") assert.equal(r.mesures.quetesFinies, seul, `${r.profil} ${r.famille}`);
    else assert.ok(r.mesures.quetesFinies >= 8, `${r.profil} ${r.famille} : ${r.mesures.quetesFinies} quêtes`);
  }
  assert.equal(CIBLE.ecartButsMax, 20);
});

test("rythme : aucun parcours ne bloque, et aucune quête n'attend un dévoilement (une porte du niveau 1, si : on fait autre chose)", () => {
  for (const r of PARCOURS) {
    assert.deepEqual(r.blocages, [], `${r.profil} ${r.famille} : ${r.blocages.join(" ; ")}`);
    assert.deepEqual(Object.keys(r.attentes).filter((q) => !q.startsWith("porte:")), [], `${r.profil} ${r.famille}`);
  }
});

test("rythme : le simulateur est déterministe (même graine, même rapport)", () => {
  assert.deepEqual(jouerParcours("prudent", "voltaiques").evenements, PARCOURS.find((r) => r.profil === "prudent" && r.famille === "voltaiques")!.evenements);
});

test("rythme : l'élève du tutoriel pense à son métier exactement à l'étape « La famille » (§2.6), pas avant", () => {
  for (const r of PARCOURS.filter((x) => x.profil !== "sans_tuto")) {
    const famille = r.evenements.find((e) => e.genre === "but" && e.quoi[0] === "Tutoriel : La famille")!;
    const atelier = r.evenements.find((e) => e.genre === "recette" && e.quoi.includes(ATELIER[r.famille]))!;
    assert.ok(atelier, `${r.profil} ${r.famille} : l'atelier jamais dévoilé`);
    // Le Mécaniste peut y penser plus tôt : démonter le vélo lui donne le cadre (§3.1, son identité).
    if (r.famille !== "mecanistes") assert.equal(atelier.minute, famille.minute, `${r.profil} ${r.famille}`);
    else assert.ok(atelier.minute <= famille.minute);
  }
});

test("le tutoriel ne demande que ce qui est dévoilé : chaque étape dévoile ce qu'elle fait fabriquer (règle 5)", () => {
  for (const famille of FAMILLES) {
    for (let etape = 0; etape < 12; etape++) {
      const e = etat(famille, { tuto: etape });
      const d = new Set([...e.devoilees, ...aDevoiler(e)]);
      for (const id of recettesDeLEtape(etape, famille)) assert.ok(d.has(id), `${famille}, étape ${etape + 1} : ${id}`);
    }
    assert.deepEqual(recettesDeLEtape(10, famille), [ATELIER[famille]]);
  }
});

test("la quête active dévoile sa recette et ses maillons, même avant l'atelier (règle 5) ; liée à une construction, elle est en silhouette", () => {
  for (const famille of FAMILLES) {
    for (const q of quetesDeLaFamille(famille)) {
      const e = etat(famille, { quetes: new Set([q.id]) });
      const d = new Set([...e.devoilees, ...aDevoiler(e)]);
      const enSilhouette = new Set(silhouettes({ ...e, devoilees: d }).filter((s) => s.quete).map((s) => s.id));
      for (const id of recettesDeLaQuete(q)) {
        // Plan 0.8 : une recette liée à une construction qu'on n'a pas attend sa construction (en silhouette, en tête).
        const r0 = recette(id);
        // R26 (0.8.2) : une arme de métier attend le meuble complet, pas même en silhouette (le carnet la nomme).
        if (armeEnAttente(id, e.installations)) assert.ok(!enSilhouette.has(id) && !d.has(id), `${famille}, quête ${q.id} : ${id} attend le meuble`);
        else if (r0 && !lieuPossede(r0.lieu, e.installations)) assert.ok(enSilhouette.has(id), `${famille}, quête ${q.id} : ${id} en silhouette`);
        else assert.ok(d.has(id), `${famille}, quête ${q.id} : ${id}`);
        const r = recette(id);
        // Un maillon lié à une construction qu'on n'a pas l'attend, comme toute recette de ce genre (plan 0.8).
        if (r) for (const m of maillons(r)) if (!estHorsFamille(m, famille) && lieuPossede(m.lieu, e.installations) && !armeEnAttente(m.id, e.installations)) assert.ok(d.has(m.id), `${famille}, quête ${q.id} : maillon ${m.id}`);
      }
    }
  }
});

test("les quêtes qui font fabriquer quelque chose le disent : l'arbre sait quoi dévoiler pour chacune", () => {
  const sansRecette = QUETES.filter((q) => recettesDeLaQuete(q).length === 0).map((q) => q.id).sort();
  // Voyager, vendre, échanger, tirer, attendre la charge, monter un équipement, améliorer un foyer.
  assert.deepEqual(sansRecette, ["affuter", "carquois", "charge", "comptoir", "courant_autres", "depot_meca", "depot_volt", "fournisseur", "foyer_cuisine", "foyer_pierres", "main_tendue", "marmite", "premiers_wotts", "vendre_lame"]);
  // « Forger une lame » demande la lame de ressort (son texte le dit), et l'arc de la quête est l'arc de fortune.
  assert.deepEqual(recettesDeLaQuete(QUETES.find((q) => q.id === "lame")!), ["lame_forgee"]);
  assert.deepEqual(recettesDeLaQuete(QUETES.find((q) => q.id === "premier_arc")!), ["arc_fortune"]);
});

test("aucun ingrédient introuvable : tout ce que l'arbre peut dévoiler se fabrique (sauf le boyau, qui attend le collet)", () => {
  for (const famille of FAMILLES) {
    const t = trouvables(famille, false);
    // Les recettes « plus tard » ne se dévoilent pas. Plan 0.10 (chantier M) : plus aucune exclusion pour le niveau 2 —
    // ses matières (les roulements de la boîte, la bobine, le tube d'aluminium, le pack soudé) et ses outils (le rabot, le
    // fer à souder) se trouvent dans ses quatre lieux, que ce calcul connaît : tout ce qui est jouable se fait.
    const infaisables = RECETTES.filter((r) => !r.aVenir && !t.recettes.has(r.id)).map((r) => r.id);
    // Le boyau séché vient du lapin, et le collet n'attrape encore rien : sa corde d'arc ne se dévoile jamais
    // (déclencheur « vu : boyaux »), elle ne trompe donc personne. Le pack soudé (plan 0.10, chantier C) demande le
    // fer à souder, un objet-clé du niveau 2 : depuis le chantier J, il est à sa place au Grand Hôtel.
    assert.deepEqual(infaisables, ["corde_arc_boyau"], famille);
  }
});

test("seul, chaque famille fait tout ce que son carnet et son tutoriel demandent (Book 22 : chaque étape se fait seul)", () => {
  for (const famille of FAMILLES) {
    const t = trouvables(famille, true);
    const demandees = new Set<string>([...Array.from({ length: 12 }, (_, i) => recettesDeLEtape(i, famille)).flat(), ...quetesDeLaFamille(famille).flatMap(recettesDeLaQuete)]);
    for (const id of demandees) {
      const r = recette(id);
      if (r) assert.ok(t.recettes.has(id), `${famille} : ${id}`);
    }
    // Ce qu'on apprend des Mécanistes demande parfois de scier (l'arbrier, la brouette) : les Compteurs vendent une scie.
    assert.ok(trouvables(famille, false).recettes.has("arbrier"), `${famille} : arbrier`);
  }
});

// ---------- Plan 0.8, chantier 14 : les sorties, les portes, le budget ----------

test("niveau 1 : chaque parcours a tout le niveau 1 à l'horizon, avec la première sortie avant 60 min et au plus une sortie de butin sur quatre sans porte dans les trois premières heures (critère 11)", () => {
  for (const r of PARCOURS) {
    assert.deepEqual(ecartsAuNiveau1(r), [], `${r.profil} ${r.famille}`);
    assert.ok(r.mesures.premiereSortie !== null && r.mesures.premiereSortie < CIBLE.premiereSortieMax, `${r.profil} ${r.famille} : ${r.mesures.premiereSortie}`);
    // Toutes les choses du niveau 1, bâties une à une.
    assert.equal(r.postesFaits.length, postesNiveau1(r.famille, r.profil === "presse" ? "B" : "A", r.profil === "prudent" || r.profil === "malchanceux" ? "parcours" : "besoin").length);
  }
});

test("niveau 1 : la première arrivée à chaque étape est notée (atteint) ; le prudent suit le parcours, station, gué, Coopérative, Moulin", () => {
  for (const r of PARCOURS) {
    for (const e of ["maison", "H1A", "H1B", "L1A", "L1B"] as const) assert.ok(r.atteint[e] !== undefined, `${r.profil} ${r.famille} : ${e}`);
  }
  for (const r of PARCOURS.filter((x) => x.profil === "prudent")) {
    const a = r.atteint;
    assert.ok(a.maison! < a.H1A! && a.H1A! < a.H1B! && a.H1B! < a.L1A! && a.L1A! < a.L1B!, `${r.famille} : ${JSON.stringify(a)}`);
  }
});

test("niveau 1 : une clé de lieu ne se trouve qu'en y allant ; chaque porte à clé passe après la sortie qui a rapporté sa clé", () => {
  // Les clés de lieu : les trois pièces de famille (station), le grillage, la cocotte, le seau (Coopérative), la toile,
  // les feuillards, l'étau (Moulin), la glaise (gué).
  assert.deepEqual([...CLES_DE_LIEU.entries()].sort(), [
    ["cocotte_fonte", "cooperative"],
    ["enclume_depanneur", "station"],
    ["etau", "moulin"],
    ["feuillards", "moulin"],
    ["glaise", "gue"],
    ["grillage_rouleau", "cooperative"],
    ["panneau_solaire", "station"],
    ["petit_alternateur", "station"],
    ["seau_10l", "cooperative"],
    ["toile_jute", "moulin"],
  ]);
  for (const r of PARCOURS) {
    for (const p of r.portes) {
      const s = r.sorties.find((x) => x.cles.includes(p.cle));
      assert.ok(s, `${r.profil} ${r.famille} : ${p.id} sans sortie pour ${p.cle}`);
      assert.ok(s.minute <= p.minute && s.porte, `${r.profil} ${r.famille} : ${p.id}`);
    }
    // Les six clés de L1 ouvrent leurs six portes, et le meuble de famille sa pièce.
    for (const id of ["foyer_cuisine", "marmite", "recuperateur_seau", "abri_ferme", "coffre_cercle", "etabli_etau"]) assert.ok(r.portes.some((p) => p.id === id), `${r.profil} ${r.famille} : ${id}`);
  }
});

test("budget (§2.7) : en plus de la visite du tutoriel, ⚡ 0, ⚙️ 0 à 1, 🔥 au plus 1 aller-retour de ravitaillement — seul, malchanceux, à trois, à cinq", () => {
  assert.deepEqual(RAVITAILLEMENTS_MAX, { voltaiques: 0, mecanistes: 1, charbonniers: 1 });
  for (const scenario of ["seul", "malchanceux", "trois", "cinq_en_file", "cinq_ensemble"] as const) {
    for (const l of budgetNiveau1(scenario)) {
      assert.ok(l.ravitaillements <= RAVITAILLEMENTS_MAX[l.famille], `${scenario}, ${l.famille} : ${l.ravitaillements} allers-retours`);
      assert.ok(l.niveau1 !== null, `${scenario}, ${l.famille} : pas tout le niveau 1`);
    }
  }
  // Seul, aucune famille n'a besoin de retourner à la station : le terrain, le tas de bois et le vrac suffisent.
  for (const l of budgetNiveau1("seul")) assert.equal(l.ravitaillements + l.achats, 0, l.famille);
});

test("budget : ce que coûte tout le niveau 1 (le terrain, B1 : 16 bûches et 26 pierres ; le reste vient des sorties)", () => {
  assert.deepEqual(TERRAIN_VRAC, { buche: 16, pierre: 26, branche: 34 });
  const seul = new Map(budgetNiveau1("seul").map((l) => [l.famille, l]));
  // Les pierres : le terrain suffit à chaque famille (§2.7 : « confortable pour toutes les familles »).
  for (const [f, l] of seul) assert.ok((l.depense.pierre ?? 0) <= TERRAIN_VRAC.pierre, `${f} : ${l.depense.pierre} pierres`);
  // Les bûches : plus que le terrain pour ⚙️ et 🔥 (le tas de bois et le vrac de la station font le reste).
  assert.ok((seul.get("charbonniers")!.depense.buche ?? 0) > TERRAIN_VRAC.buche);
  assert.ok((seul.get("mecanistes")!.depense.buche ?? 0) > TERRAIN_VRAC.buche);
  // 🔥 : la glaise du bac de trempe vient du gué, et une meule de charbonnière (le sac de la station en donne 4).
  assert.equal(seul.get("charbonniers")!.depense.glaise, 2);
  assert.equal(seul.get("charbonniers")!.venu.sac_charbon?.charbon_bois, 4);
});

test("haltes partagées : le vrac grandit avec les présents (B8), chaque point revient en 30 min ; le tas de bois est à chacun (B3)", () => {
  const seul = new Haltes(0, { passages: [], prises: [] }, HYPOTHESES_DECIDEES, false);
  assert.equal(seul.vrac("station", "buche", 10), 12);
  assert.equal(seul.prendreVrac("station", "buche", 10, 20), 12);
  assert.equal(seul.vrac("station", "buche", 39), 0);
  assert.equal(seul.vrac("station", "buche", 40.5), 12);
  // Le tas de bois : 10 bûches, qui reviennent 6 h après la première prise.
  assert.equal(seul.prendreTas("tas_bois", 10, 4), 4);
  assert.equal(seul.prendreTas("tas_bois", 20, 20), 6);
  assert.equal(seul.prendreTas("tas_bois", 300, 20), 0);
  assert.equal(seul.prendreTas("tas_bois", 371, 20), 10);
  // À cinq présents : ×3 (B8) ; un autre a pris 30 bûches juste avant : il en reste 6.
  const autres = { passages: [1, 2, 3, 4].map((j) => ({ joueur: j, lieu: "station" as const, debut: 0, fin: 20 })), prises: [{ joueur: 1, lieu: "station" as const, type: "buche" as const, minute: 5, n: 30 }] };
  const cinq = new Haltes(0, autres, HYPOTHESES_DECIDEES, false);
  assert.equal(cinq.presents("station", 10), 5);
  assert.equal(cinq.vrac("station", "buche", 10), 6);
  // Le malchanceux : le vrac a toujours été vidé avant lui ; son tas, non.
  const malchanceux = new Haltes(0, { passages: [], prises: [] }, HYPOTHESES_DECIDEES, true);
  assert.equal(malchanceux.vrac("gue", "pierre", 10), 0);
  assert.equal(malchanceux.prendreTas("banc_galets", 10, 20), 8);
});

test("à plusieurs (critère 7) : la station et le gué ne restent jamais vides de bois et de pierres plus de 30 min", () => {
  for (const nom of Object.keys(SERVEURS) as (keyof typeof SERVEURS)[]) {
    const s = simulerServeur(SERVEURS[nom]);
    assert.ok(s.videStation <= 30 && s.videGue <= 30, `${nom} : station ${s.videStation}, gué ${s.videGue}`);
    for (const r of s.joueurs) assert.deepEqual(r.blocages, [], `${nom}, ${r.famille}`);
  }
});

test("tests de jeu : à trois (une famille chacun), chacun a tout le niveau 1 et sa pièce de famille à lui", () => {
  const s = simulerServeur(SERVEURS.trois);
  for (const r of s.joueurs) {
    assert.ok(r.mesures.niveau1 !== null, r.famille);
    assert.ok(r.sorties[0]!.cles.some((c) => CLES_DE_LIEU.get(c) === "station"), `${r.famille} : sa pièce à la station`);
  }
});

test("critère 12 : au niveau 1, aucune arme de métier fabriquée au-dessus de ★★ sans la maîtrise ; la maîtrise donne l'étoile du dessus avec ses vrais dégâts", () => {
  const metier = ["machette_forgee", "hachette", "serpe", "lame_forgee", "matraque_fortune", "matraque_electrique", "arbalete", "arc_fortune", "arc_if"] as const;
  for (const objet of metier) {
    const p = PLAFONDS_NIVEAU_1[objet]!;
    assert.ok(p.recette !== null && p.recette <= 2, `${objet} : ★${p.recette} par une recette`);
    assert.equal(p.maitrise, p.recette! + 1, objet);
  }
  // L'exception décidée (§2.4, I13) : l'arc simple, pour tous, monte ★★★ par sa corde de fil dentaire (la boutique de la
  // station) ; ★★★★ par la maîtrise seulement (Q-0.8-4).
  assert.deepEqual([PLAFONDS_NIVEAU_1.arc_simple!.recette, PLAFONDS_NIVEAU_1.arc_simple!.maitrise], [3, 4]);
  // Les vrais dégâts de l'étoile maîtrisée (§2.4) : la machette ★★★ à 2,5, l'arbalète ★★★ à 2,5, l'arc d'if ★★★ à 2,25.
  assert.equal(armeDeCle("machette_forgee#3")!.degatsTorse, 2.5);
  assert.equal(armeTirExemplaire("arbalete#3", armeTirDe("arbalete")!).degatsPlein, 2.5);
  assert.equal(armeTirExemplaire("arc_if#3", armeTirDe("arc_if")!).degatsPlein, 2.25);
  assert.equal(armeDeCle("matraque_fortune#2")!.degatsTorse, 1);
});

test("critère 13 : le garde-fou des armes, rejoué à chaque étape (maison, H1, L1) avec les valeurs du jeu", () => {
  for (const etape of ETAPES_EQUILIBRE) {
    const v = gardeFouEtape(etape);
    assert.deepEqual(v.fautes, [], etape);
    assert.ok(v.pireRapport <= 2 && v.ecartCout <= 3, `${etape} : ${v.pireRapport}, ${v.ecartCout}`);
  }
});

// ---------- Plan 0.10, chantier M : le rythme et le budget du niveau 2 ----------

const N2 = tousLesParcoursN2();

test("niveau 2 : les objets-clés de l'hôtel et du phare, et les deux outils qu'on ne trouve qu'avec eux (le rabot, le fer à souder)", () => {
  assert.deepEqual([...CLES_NIVEAU_2.entries()].filter(([, l]) => l === "grand_hotel").map(([t]) => t).sort(), ["couvertures_laine", "fer_souder", "lanterne_tempete", "roulements", "toles_ondulees"]);
  assert.deepEqual([...CLES_NIVEAU_2.entries()].filter(([, l]) => l === "phare").map(([t]) => t).sort(), ["cloche_bronze", "jerrican_20l", "porte_four", "rabot", "soufflet_forge"]);
  assert.deepEqual(OUTILS_NIVEAU_2, { raboter: "rabot", souder: "fer_souder" });
  // Le niveau 1 ne connaît que ses clés : jouer le niveau 2 après ne change rien à la première soirée.
  assert.deepEqual(jouerParcoursN2("prudent", "voltaiques").niveau1.evenements, PARCOURS.find((r) => r.profil === "prudent" && r.famille === "voltaiques")!.evenements);
});

test("niveau 2 : douze parcours, et chacun tient les cibles (tout le niveau 2 à l'horizon, sans blocage, le ravitaillement, le péage, la nuit du phare)", () => {
  assert.equal(N2.length, 12);
  const fautes = [...N2, ...FAMILLES.map((f) => pireMalchanceN2(f))].flatMap(ecartsAuNiveau2);
  assert.deepEqual(fautes, [], fautes.join("\n"));
  for (const r of N2) {
    assert.ok(r.tout !== null && r.tout <= HORIZON_NIVEAU_2_MIN, `${r.profil} ${r.famille}`);
    assert.equal(r.postesFaits.length, r.postes.length, `${r.profil} ${r.famille}`);
    // Les quatre lieux de la côte : on traverse la halte pour aller au lieu de chaque route.
    for (const e of ["H2A", "L2A", "H2B", "L2B"] as const) assert.ok(r.atteint[e] !== undefined, `${r.profil} ${r.famille} : ${e}`);
    assert.ok(r.atteint.H2A! <= r.atteint.L2A! && r.atteint.H2B! <= r.atteint.L2B!, `${r.profil} ${r.famille}`);
  }
});

test("niveau 2 : le péage (12 wotts) à l'aller seulement, une fois par voyage ; le retour est libre (V2-01), le ravitaillement de bois en deçà aussi", () => {
  for (const r of N2) {
    const allers = r.sorties.filter((s) => s.lieu === "grand_hotel" || s.lieu === "phare");
    assert.equal(r.peages.length, allers.length, `${r.profil} ${r.famille}`);
    for (const p of r.peages) {
      const s = allers.find((x) => x.minute === p.minute);
      assert.ok(s, `${r.profil} ${r.famille} : un péage sans aller`);
      assert.equal(p.passage, s.lieu === "grand_hotel" ? "pont" : "tunnel");
    }
    assert.equal(wottsDePeage(r), 12 * r.peages.length);
  }
});

test("niveau 2 : le feu du phare s'allume la nuit seulement (S-14) ; on part pour arriver à la nuit tombée", () => {
  assert.equal(heureDuMonde(0), 6);
  assert.equal(heureDuMonde(15), 21);
  for (const r of N2) {
    const phare = r.sorties.filter((s) => s.lieu === "phare");
    assert.ok(phare.length >= 1, `${r.profil} ${r.famille}`);
    for (const s of phare) assert.ok(allumeLaNuit(r, s), `${r.profil} ${r.famille} : départ à ${s.minute}`);
  }
});

test("niveau 2 : les roulements (V1-01) — une boîte en donne trois ; le Mécaniste en use cinq ; s'il en manque, le Comptoir vend la boîte", () => {
  for (const r of N2.filter((x) => x.famille === "mecanistes")) {
    const b = r.roulements;
    assert.equal((b.hotel + b.chance + b.comptoir) * 3 - b.reste, 5, `${r.profil}`);
  }
  // La machinerie ne donnerait qu'une boîte : la seconde s'achète (500 wotts), et tout le niveau 2 se fait quand même.
  const une = jouerParcoursN2("prudent", "mecanistes", { hypotheses: { ...HYPOTHESES_DECIDEES, boitesHotel: 1 } }).niveau2;
  assert.deepEqual([une.roulements.hotel, une.roulements.comptoir, une.achats], [1, 1, 500]);
  assert.ok(une.tout !== null);
});

test("niveau 2, critère 8 : le Mécaniste seul a son meuble de famille et tout son métier (le cranequin léger, l'arbalète) sans aller au phare", () => {
  const r = jouerParcoursN2("prudent", "mecanistes", { seulementFamille: true }).niveau2;
  assert.ok(r.tout !== null);
  assert.equal(r.atteint.L2B, undefined);
  assert.ok(r.postesFaits.some((p) => p.id === "cranequin_leger@2") && r.postesFaits.some((p) => p.id === "arbalete@2"));
  assert.deepEqual(r.blocages, []);
});

test("niveau 2, budget : les allers-retours de ravitaillement (4 au plus ; le bois des 🔥, 3 au plus : N2-29) — seul, malchanceux, à cinq ; les haltes jamais vides plus de 30 min", () => {
  for (const scenario of ["seul", "malchanceux", "cinq_en_file"] as const) {
    for (const l of budgetNiveau2(scenario)) {
      assert.ok(l.ravitaillements <= CIBLE_NIVEAU_2.ravitaillementsMax, `${scenario}, ${l.famille} : ${l.ravitaillements}`);
      if (l.famille === "charbonniers") assert.ok(l.bois <= CIBLE_NIVEAU_2.boisCharbonniersMax, `${scenario} : ${l.bois} allers-retours de bois`);
      assert.ok(l.tout !== null, `${scenario}, ${l.famille}`);
    }
  }
  const s = simulerServeurN2(SERVEURS.cinq_en_file);
  assert.ok(s.videCorniche <= 30 && s.videPont <= 30, `corniche ${s.videCorniche}, pont ${s.videPont}`);
  // Le four de terre demande de la glaise pour tous (N2-13) : chacun va au gué, une fois.
  for (const r of N2) assert.equal(r.ravitaillements.filter((x) => x.motif === "glaise").length, 1, `${r.profil} ${r.famille}`);
});

test("niveau 2, budget des matières : une charge de sac par route (les matériaux, et les objets-clés rapportés d'un coup) ; l'énergie du banc compensé", () => {
  for (const f of FAMILLES) {
    const d = demandeNiveau2(f);
    for (const kg of [d.kgA, d.kgB, d.kgClesA, d.kgClesB]) assert.ok(kg > 0 && kg <= SAC_LIBRE_KG, `${f} : ${kg} kg`);
  }
  assert.ok(poidsDesCles("phare") <= SAC_LIBRE_KG && poidsDesCles("grand_hotel") <= SAC_LIBRE_KG);
  // L'offre d'une visite : l'hôtel est le lieu le plus riche ; le tube d'aluminium vient surtout de la cale du pont.
  const o = offreDeLaCote(100);
  const parLieu = new Map(o.parLieu.map((x) => [x.lieu, x]));
  assert.ok(parLieu.get("grand_hotel")!.wotts > 12 && parLieu.get("phare")!.wotts > 12, "une visite paie le péage");
  assert.ok((parLieu.get("route_pont")!.matieres.tube_aluminium ?? 0) >= 2);
  assert.deepEqual(parLieu.get("grand_hotel")!.cles.sort(), ["couvertures_laine", "fer_souder", "lanterne_tempete", "roulements", "toles_ondulees"]);
  // Le banc qui suit le soleil, compensé (V1-19) : la rampe de LED ne prend qu'une part de ce qu'il donne.
  const e = budgetEnergie();
  assert.ok(e.rampeParNuit < e.bancParJour && e.bancParBeauJour > e.bancParJour);
  assert.ok(Math.abs(e.moulinParJour - e.bancParJour) / e.bancParJour < 0.3, `moulin ${e.moulinParJour}, banc ${e.bancParJour}`);
});
