// Le rythme de l'arbre de progression (0.7, chantier 6 ; décision Q5) : les parcours types tiennent la cible, rien ne
// bloque, le tutoriel et le carnet ne demandent jamais une recette invisible, chaque ingrédient se trouve.

import { test } from "node:test";
import assert from "node:assert/strict";
import { FAMILLES, type Famille } from "./regles.ts";
import { RECETTES, estHorsFamille, recette } from "./recettes.ts";
import { QUETES } from "./quetes.ts";
import { ATELIER, aDevoiler, devoileesAuDepart, maillons, recettesDeLEtape, recettesDeLaQuete, silhouettes, type EtatPourDevoilement } from "./progression.ts";
import { CIBLE, cibleDuProfil, ecartsALaCible, jouerParcours, quetesDeLaFamille, tousLesParcours } from "./rythme.ts";
import { trouvables } from "./trouvables.ts";
import { lieuPossede } from "./lieu-recette.ts";

const PARCOURS = tousLesParcours();

function etat(famille: Famille, p: Partial<EtatPourDevoilement> = {}): EtatPourDevoilement {
  return { famille, vus: new Set(), faits: {}, installations: new Map(), quetes: new Set(), tuto: null, minutes: 0, sansSac: false, devoilees: new Set(devoileesAuDepart()), ...p };
}

test("rythme : neuf parcours types (prudent, pressé, sans tutoriel × trois familles), et tous tiennent la cible", () => {
  assert.equal(PARCOURS.length, 9);
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

test("rythme : puis un bon rythme — un but nouveau au moins toutes les 20 min (au pas du joueur), jusqu'au bout du carnet", () => {
  for (const r of PARCOURS) {
    assert.ok(r.mesures.ecartButsEnsuite <= cibleDuProfil(r.profil).buts + 1e-9, `${r.profil} ${r.famille} : ${r.mesures.ecartButsEnsuite} min`);
    // Toutes les quêtes qu'on peut finir seul le sont dans la première soirée (main_tendue attend un autre joueur).
    const seul = quetesDeLaFamille(r.famille).filter((q) => q.id !== "main_tendue").length;
    assert.equal(r.mesures.quetesFinies, seul, `${r.profil} ${r.famille}`);
  }
  assert.equal(CIBLE.ecartButsMax, 20);
});

test("rythme : aucun parcours ne bloque, ni n'attend un dévoilement", () => {
  for (const r of PARCOURS) {
    assert.deepEqual(r.blocages, [], `${r.profil} ${r.famille} : ${r.blocages.join(" ; ")}`);
    assert.deepEqual(r.attentes, {}, `${r.profil} ${r.famille}`);
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
    assert.deepEqual(recettesDeLEtape(9, famille), [ATELIER[famille]]);
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
        if (r0 && !lieuPossede(r0.lieu, e.installations)) assert.ok(enSilhouette.has(id), `${famille}, quête ${q.id} : ${id} en silhouette`);
        else assert.ok(d.has(id), `${famille}, quête ${q.id} : ${id}`);
        const r = recette(id);
        // Un maillon lié à une construction qu'on n'a pas l'attend, comme toute recette de ce genre (plan 0.8).
        if (r) for (const m of maillons(r)) if (!estHorsFamille(m, famille) && lieuPossede(m.lieu, e.installations)) assert.ok(d.has(m.id), `${famille}, quête ${q.id} : maillon ${m.id}`);
      }
    }
  }
});

test("les quêtes qui font fabriquer quelque chose le disent : l'arbre sait quoi dévoiler pour chacune", () => {
  const sansRecette = QUETES.filter((q) => recettesDeLaQuete(q).length === 0).map((q) => q.id).sort();
  // Voyager, vendre, échanger, tirer, attendre la charge, monter un équipement, améliorer un foyer.
  assert.deepEqual(sansRecette, ["affuter", "carquois", "charge", "comptoir", "courant_autres", "depot_meca", "depot_volt", "fournisseur", "foyer_cuisine", "foyer_pierres", "main_tendue", "premiers_wotts", "vendre_lame"]);
  // « Forger une lame » demande la lame de ressort (son texte le dit), et l'arc de la quête est l'arc de fortune.
  assert.deepEqual(recettesDeLaQuete(QUETES.find((q) => q.id === "lame")!), ["lame_forgee"]);
  assert.deepEqual(recettesDeLaQuete(QUETES.find((q) => q.id === "premier_arc")!), ["arc_fortune"]);
});

test("aucun ingrédient introuvable : tout ce que l'arbre peut dévoiler se fabrique (sauf le boyau, qui attend le collet)", () => {
  for (const famille of FAMILLES) {
    const t = trouvables(famille, false);
    const infaisables = RECETTES.filter((r) => !t.recettes.has(r.id)).map((r) => r.id);
    // Le boyau séché vient du lapin, et le collet n'attrape encore rien : sa corde d'arc ne se dévoile jamais
    // (déclencheur « vu : boyaux »), elle ne trompe donc personne.
    // Le marteau remmanché attend sa tête de marteau dans la caisse de la ruine (chantier 10, I10).
    assert.deepEqual(infaisables.filter((id) => id !== "marteau"), ["corde_arc_boyau"], famille);
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
