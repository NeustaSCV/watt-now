// H1B, le Gué-aux-Saules (plan 0.8, chantier 11) : la glaise, les pierres, le banc de galets, les joncs, la rivière
// qu'on ne traverse qu'au radier ou en bac, la crue, la cloche, les ricochets, l'Éteint qui dérive.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  BAC,
  BRANCHES_EPARSES,
  BUTIN_GUE,
  GLAISE,
  GLAISE_DU_DESSIN,
  LIGNE_RADIER_NOYE,
  PIERRES_DU_BANC,
  VERSION_GUE,
  surLeBanc,
  CLOCHE,
  DUREE_TRAVERSEE_S,
  ID_DERIVE,
  LIGNE_DERIVE,
  RADIER,
  auGue,
  crue,
  dansLaRiviere,
  genererGue,
  placeRadeau,
  ricochet,
  surLeRadier,
  zoneGue,
} from "../../commun/src/gue.ts";
import { ETEINTS_MODELE, FOUILLE_MODELE, SEGMENTS_MODELE } from "../../commun/src/gue-modele.ts";
import { cleCouche, dispositionLieu } from "../../commun/src/couche-dechets.ts";
import { DUREE_VOYAGE_S, SORTIES_GUE, SORTIE_TERRAIN, ZONE_GUE, bordsLibres, heurte } from "../../commun/src/lieux.ts";
import type { MessageServeur, ProjectileVu } from "../../commun/src/messages.ts";
import { DUREE_TRANCHE_MS, tempsDeLaTranche } from "../../commun/src/meteo.ts";
import { ALLURES, type Famille } from "../../commun/src/regles.ts";
import { USAGES, vracEnJeu } from "../../commun/src/terrain.ts";
import { estNuit, heureDeJeu } from "../../commun/src/temps.ts";
import { PLAN_VUE_GUE, planVue } from "../../commun/src/vue-lieux.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Cooperatives } from "./cooperative.ts";
import { Gue, LIBELLE_HALER, fouilleDuGue } from "./gue.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { messageValide } from "./controle.ts";
import { rendreSilencieux } from "./journal.ts";
import { Moulins } from "./moulin.ts";

rendreSilencieux(true);

const MIN = 60_000;
const HEURE = 3_600_000;

/** Un petit monde : le gué, et des joueurs qu'on y fait arriver. `decalage` : où l'on commence, après le début du monde. */
function monde(decalage = 1_000_000, sansEteints = true) {
  const base = new Base(":memory:");
  let instant = base.debutMonde() + decalage;
  const halte = new Halte(base, () => 0.5);
  const gue = new Gue(base, () => 0.5);
  if (sansEteints) gue.eteints = [];
  const comptoir = new Comptoir(base, instant);
  const cooperatives = new Cooperatives(base, () => 0.5, () => instant);
  const moulins = new Moulins(base);
  const joueurs: Joueur[] = [];
  const attendre = (secondes: number, pas = 0.25) => {
    for (let s = 0; s < secondes - 1e-9; s += pas) {
      instant += pas * 1000;
      gue.tick(instant, pas);
      for (const j of joueurs) j.tick(pas);
    }
  };
  const nouveau = (pseudo: string, inventaire: Record<string, number> = {}, famille: Famille = "charbonniers") => {
    const compte = base.creerCompte(pseudo, "potager42", famille);
    base.sauverInventaire(compte.id, { sac_a_dos: 1, couteau: 1, ...inventaire });
    base.sauverQuetes(compte.id, { faits: {}, finies: ["comptoir"], primes: 0 });
    const recus: MessageServeur[] = [];
    // Un aléa haut : aucune clé rare ne sort des fouilles.
    const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 0.99, comptoir, cooperatives, gue, moulins);
    joueurs.push(joueur);
    joueur.position = { x: SORTIE_TERRAIN.boite.x, z: SORTIE_TERRAIN.boite.z, o: 0 };
    joueur.recevoir({ t: "voyager", vers: "gue" });
    attendre(DUREE_VOYAGE_S + 0.5);
    assert.equal(joueur.lieu, "gue");
    const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
    const inv = () => dernier("inventaire")?.inventaire ?? {};
    const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
    const vues = () => gue.vuePour(compte.id, famille, instant);
    return { compte, joueur, recus, dernier, inv, infos, vues };
  };
  /** Prendre une ressource : on s'y place, on agit, on attend le geste. */
  const prendre = (j: Joueur, id: number, secondes = 7) => {
    const r = gue.ressources.get(id)!;
    j.position = { x: r.x, z: r.z, o: 0 };
    j.recevoir({ t: "interagir", cible: { genre: "ressource", id }, verbe: USAGES[r.type].verbe });
    attendre(secondes);
  };
  return { base, gue, nouveau, attendre, prendre, maintenant: () => instant, sauter: (ms: number) => (instant += ms) };
}

const parType = (g: Gue, type: string) => [...g.ressources.values()].filter((r) => r.type === type);

/** Une tranche de météo où il pleut depuis au moins `n` tranches (n = 3 : le radier est noyé). */
function tranchePluvieuse(n: number, apres = 0): number {
  for (let k = Math.max(n, apres); k < 20_000; k++) {
    let ok = true;
    for (let i = 0; i < n; i++) if (tempsDeLaTranche(k - i) !== "pluie") ok = false;
    if (ok) return k;
  }
  throw new Error("aucune pluie aussi longue");
}

// ---------- Le lieu ----------

test("le gué est retourné pour suivre la carte : on arrive du terrain par l'est, le Moulin est à l'ouest", () => {
  const terrain = SORTIES_GUE.find((s) => s.vers === "terrain")!;
  const moulin = SORTIES_GUE.find((s) => s.vers === "moulin")!;
  assert.ok(terrain.arrivee.x > 190 && moulin.arrivee.x < 10);
  // L'entrée A du modèle (« ← Ton terrain », à x = −100) est au bout est du jeu.
  assert.deepEqual(auGue(-100, 7), { x: 200, z: 42 });
  for (const s of SORTIES_GUE) assert.ok(!heurte(ZONE_GUE, s.arrivee.x, s.arrivee.z, 0.35), `on arrive libre (${s.vers})`);
  // Aucun bord de la zone ne se touche sans rien voir : les talus, les berges et les bouts de la route ferment tout.
  assert.deepEqual(bordsLibres(ZONE_GUE, SORTIES_GUE), []);
  assert.equal(planVue("gue"), PLAN_VUE_GUE);
  assert.ok(PLAN_VUE_GUE.pieces.includes("cabane") && PLAN_VUE_GUE.pieces.includes("buvette"));
});

test("les données tirées du modèle sont à jour (scripts/extraire-gue.mjs)", async () => {
  // @ts-expect-error : le script est en JavaScript, sans types.
  const { extraire, ecrire } = (await import("../../scripts/extraire-gue.mjs")) as { extraire(): Promise<unknown>; ecrire(d: unknown): string };
  const attendu = ecrire(await extraire());
  assert.equal(readFileSync(new URL("../../commun/src/gue-modele.ts", import.meta.url), "utf8"), attendu, "relancer node scripts/extraire-gue.mjs");
  assert.equal(ETEINTS_MODELE.length, 11);
  assert.ok(SEGMENTS_MODELE.some((s) => s.nature === "berge (eau profonde)"));
  // L'écran dessine le gué retourné par le modèle (FICHE_MIROIR, x du jeu = 100 + x) : le serveur place tout au même endroit.
  // @ts-expect-error : le modèle est en JavaScript, sans types.
  const { FICHE_MIROIR } = (await import("../../client/src/batiments/halte-gue/modele.js")) as { FICHE_MIROIR: Record<string, any> };
  const auJeu = (p: { x: number; z: number }) => ({ x: Math.round((100 + p.x) * 100) / 100, z: Math.round((p.z + 35) * 100) / 100 });
  assert.deepEqual(auJeu(FICHE_MIROIR.interactions[0]), { x: CLOCHE.x, z: CLOCHE.z }, "la cloche");
  const points = FICHE_MIROIR.cartes.flatMap((c: any) => c.fouille.map((f: any) => ({ ...f, x: f.x + c.decalage.x })));
  // Plan 0.8.2 (R2) : le jeu a déplacé la glaise au milieu de la berge, en attendant le modèle (demande-batiment-gue-4) ;
  // le point du modèle est celui où l'écran prend sa motte pour la porter là. Quand le modèle aura suivi, ils se rejoindront.
  const glaise = points.find((f: any) => f.quoi.startsWith("gisement de glaise"));
  assert.deepEqual(auJeu(glaise), GLAISE_DU_DESSIN, "la motte du modèle");
  assert.deepEqual(parType(new Gue(new Base(":memory:")), "gisement_glaise").map((r) => ({ x: r.x, z: r.z }))[0], GLAISE, "la glaise du jeu");
  const eteints = FICHE_MIROIR.cartes.flatMap((c: any) => c.eteints.map((e: any) => auJeu({ x: e.x + c.decalage.x, z: e.z })));
  assert.deepEqual(eteints.map((e: any) => e.x).sort(), ETEINTS_MODELE.map((e) => auGue(e.x, e.z).x).sort(), "les Éteints");
  assert.equal(auJeu({ x: FICHE_MIROIR.bac.accostages[0].x, z: 0 }).x, BAC.cale.x, "le radeau à la cale");
  assert.equal(auJeu({ x: FICHE_MIROIR.nappeRadier.x1, z: 0 }).x, RADIER.x0, "le radier");
  assert.ok(!SEGMENTS_MODELE.some((s) => s.nature === "bout du ponton" && s.x1 === 9.4), "le ponton du bac est ouvert au bout");
});

test("on ne marche pas dans la rivière ; on la passe au radier", () => {
  const m = monde();
  const rose = m.nouveau("Rose");
  // De la berge côté terrain, droit vers l'eau, au nord du radier : on bute sur la berge.
  rose.joueur.position = { x: 115, z: 30, o: 0 };
  rose.joueur.recevoir({ t: "intention", dx: -1, dz: 0, allure: "marche", seq: 1 });
  m.attendre(8);
  assert.ok(!dansLaRiviere(rose.joueur.position.x, rose.joueur.position.z), `toujours sur la rive (${rose.joueur.position.x})`);
  // Sur le radier, on traverse jusqu'à l'autre rive.
  rose.joueur.position = { x: RADIER.x1 + 0.3, z: (RADIER.z0 + RADIER.z1) / 2, o: 0 };
  rose.joueur.recevoir({ t: "intention", dx: -1, dz: 0, allure: "marche", seq: 2 });
  m.attendre(14);
  assert.ok(rose.joueur.position.x < RADIER.x0 + 1, `de l'autre côté (${rose.joueur.position.x})`);
  // Toutes les ressources se ramassent à pied (aucune dans l'eau).
  for (const r of genererGue()) assert.ok(!dansLaRiviere(r.x, r.z) || surLeRadier(r.x, r.z) || r.type === "pierre" || r.type === "banc_galets", `${r.type} ${r.x} ${r.z}`);
});

// ---------- Le contenu (B5 à B7) ----------

test("creuser la berge avec le bâton à fouir donne une glaise de 2 kg par geste de 6 s, sans fin ; sans Creuser 1, refusé", () => {
  const m = monde();
  const rose = m.nouveau("Rose", { baton_fouir: 1 });
  const glaise = parType(m.gue, "gisement_glaise")[0]!;
  assert.equal(USAGES.gisement_glaise.duree, 6);
  for (let i = 1; i <= 5; i++) {
    m.prendre(rose.joueur, glaise.id, 5.5);
    assert.equal(rose.inv().glaise ?? 0, i - 1, "pas avant les 6 s");
    m.attendre(0.75);
    assert.equal(rose.inv().glaise, i);
    assert.ok(m.gue.disponiblePour(glaise, rose.compte.id, m.maintenant()), "le gisement est toujours là");
  }
  const sans = m.nouveau("Malo");
  m.prendre(sans.joueur, glaise.id);
  assert.equal(sans.inv().glaise ?? 0, 0);
  assert.ok(sans.infos().some((t) => /Creuser/i.test(t)), sans.infos().join(" | "));
});

test("les 21 pierres en vrac (15 sur le banc, 6 sur les pistes) reviennent en 30 min ; deux joueurs voient les mêmes", () => {
  const m = monde();
  const rose = m.nouveau("Rose");
  const vrac = parType(m.gue, "pierre");
  assert.equal(vrac.length, 63);
  assert.equal(rose.vues().filter((r) => r.type === "pierre" && r.disponible).length, 21);
  const malo = m.nouveau("Malo");
  // À deux, +50 % (B8) : les deux voient les mêmes.
  const vuesRose = rose.vues().filter((r) => r.type === "pierre" && r.disponible).map((r) => r.id);
  assert.deepEqual(malo.vues().filter((r) => r.type === "pierre" && r.disponible).map((r) => r.id), vuesRose);
  assert.equal(vuesRose.length, vracEnJeu(BUTIN_GUE.vrac!.pierre!, 2));
  const p = m.gue.ressources.get(vuesRose[0]!)!;
  m.prendre(rose.joueur, p.id, 3);
  assert.equal(rose.inv().pierre, 1);
  assert.ok(!malo.vues().find((r) => r.id === p.id)!.disponible, "Malo la voit prise");
  m.sauter(29 * MIN);
  m.attendre(5);
  assert.ok(!malo.vues().find((r) => r.id === p.id)!.disponible);
  m.sauter(MIN);
  m.attendre(6);
  assert.ok(malo.vues().find((r) => r.id === p.id)!.disponible, "revenue en 30 min");
});

test("le banc de galets donne 8 pierres à chacun, puis revient en 6 h ; celui de l'autre ne bouge pas", () => {
  const m = monde();
  const rose = m.nouveau("Rose");
  const malo = m.nouveau("Malo");
  const banc = parType(m.gue, "banc_galets")[0]!;
  for (let i = 0; i < 9; i++) m.prendre(rose.joueur, banc.id, 2.5);
  assert.equal(rose.inv().pierre, 8, "huit, pas une de plus");
  assert.ok(!m.gue.disponiblePour(banc, rose.compte.id, m.maintenant()));
  assert.ok(m.gue.disponiblePour(banc, malo.compte.id, m.maintenant()), "celui de Malo est plein");
  m.prendre(malo.joueur, banc.id, 2.5);
  assert.equal(malo.inv().pierre, 1);
  m.sauter(6 * HEURE);
  m.attendre(6);
  assert.ok(m.gue.disponiblePour(banc, rose.compte.id, m.maintenant()), "revenu en 6 h");
});

test("les six touffes de joncs repoussent en 30 min ; le tas de branches ; les fouilles par chance", () => {
  const m = monde();
  const rose = m.nouveau("Rose");
  const joncs = parType(m.gue, "joncs");
  assert.equal(joncs.length, 6);
  m.prendre(rose.joueur, joncs[0]!.id, 4);
  assert.equal(rose.inv().fibres, 2);
  assert.ok(!m.gue.disponiblePour(joncs[0]!, rose.compte.id, m.maintenant()));
  m.sauter(30 * MIN);
  m.attendre(6);
  assert.ok(m.gue.disponiblePour(joncs[0]!, rose.compte.id, m.maintenant()), "repoussées en 30 min");
  assert.ok(parType(m.gue, "branche").length >= 4, "le bois flotté devient un tas de branches");
  // Par chance : une bâche, des chiffons, une casserole, une corde ; rarement une clé de L1.
  const trouve = new Set<string>();
  let cles = 0;
  let k = 1;
  const alea = () => ((k = (k * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 3000; i++) {
    for (const [t, n] of Object.entries(fouilleDuGue("gue_cabane", alea))) {
      if (["toile_jute", "feuillards", "etau", "grillage_rouleau", "cocotte_fonte", "seau_10l"].includes(t)) cles += n ?? 0;
      else trouve.add(t);
    }
  }
  assert.deepEqual([...trouve].sort(), ["bache", "casserole", "chiffons", "corde"]);
  assert.ok(cles > 20 && cles < 110, `≈ 2 % de clés rares (${cles} sur 3000)`);
  assert.deepEqual(fouilleDuGue("pierre", alea), {});
});

// ---------- Le radier qui gronde (G1, G2, G3) ----------

test("sur le radier, on ne court pas, et l'eau couvre les pas", () => {
  const m = monde();
  const rose = m.nouveau("Rose");
  rose.joueur.position = { x: RADIER.x1 - 2, z: (RADIER.z0 + RADIER.z1) / 2, o: 0 };
  rose.joueur.recevoir({ t: "intention", dx: -1, dz: 0, allure: "course", seq: 1 });
  const x0 = rose.joueur.position.x;
  m.attendre(2);
  const vitesse = (x0 - rose.joueur.position.x) / 2;
  assert.ok(Math.abs(vitesse - ALLURES.marche) < 0.15, `au pas (${vitesse} m/s)`);
  const pas = rose.joueur.stimuli(false).find((s) => s.genre === "son")!;
  // Hors du radier, la même marche s'entend plus loin.
  rose.joueur.position = { x: 150, z: 42, o: 0 };
  rose.joueur.recevoir({ t: "intention", dx: -1, dz: 0, allure: "marche", seq: 2 });
  m.attendre(0.5);
  const dehors = rose.joueur.stimuli(false).find((s) => s.genre === "son")!;
  assert.ok(Math.abs(pas.portee - dehors.portee * 0.3) < 0.01, `×0,3 (${pas.portee} contre ${dehors.portee})`);
});

test("l'Éteint qui dérive suit le bord amont et agrippe qui marche trop près du bord", () => {
  const m = monde(1_000_000, false);
  m.gue.eteints = m.gue.eteints.filter((e) => e.id === ID_DERIVE);
  const e = m.gue.eteints[0]!;
  assert.equal(e.variante, "rampant", "il est au sol");
  const rose = m.nouveau("Rose");
  // Au milieu du radier : il approche, mais n'agrippe pas.
  rose.joueur.position = { x: 100, z: RADIER.z1 - 1.2, o: 0 };
  m.attendre(40);
  assert.ok(Math.abs(e.x - 100) < 0.2, `il a remonté le bord (${e.x})`);
  assert.equal(e.z, LIGNE_DERIVE.z);
  assert.equal(e.saisit, null);
  // Trop près du bord amont : une main sort de l'eau.
  rose.joueur.position = { x: 100, z: RADIER.z0 + 0.5, o: 0 };
  m.attendre(1);
  assert.equal(e.saisit, rose.compte.id);
  assert.ok(rose.infos().some((t) => /cheville/.test(t)));
});

// ---------- La crue (G4) ----------

test("la crue : après deux tranches de pluie de suite, le radier est noyé pendant la pluie et 6 min après", () => {
  const k = tranchePluvieuse(3);
  const debut = 0;
  const a = (tranche: number, part = 0.5) => debut + (tranche + part) * DUREE_TRANCHE_MS;
  // La tranche k est la 3e de pluie (au moins) : noyé. Trouver le début de la pluie.
  let s = k;
  while (tempsDeLaTranche(s - 1) === "pluie") s--;
  assert.equal(crue(a(s), debut).niveau, "bas", "une tranche de pluie : rien");
  assert.equal(crue(a(s + 1), debut).niveau, "monte", "la deuxième : l'eau monte à la bande blanche");
  assert.equal(crue(a(s + 2, 0.01), debut).niveau, "noye", "au bout de deux tranches : noyé");
  let e = s;
  while (tempsDeLaTranche(e + 1) === "pluie") e++;
  assert.equal(crue(a(e + 1, 0.5), debut).niveau, "noye", "3 min après la pluie : encore noyé");
  assert.equal(crue(a(e + 2, 0.9), debut).niveau, "noye", "jusqu'à 6 min");
  if (tempsDeLaTranche(e + 3) !== "pluie") assert.equal(crue(a(e + 3, 0.1), debut).niveau, "bas", "puis la décrue");

  // Au gué : le carnet le dit d'une ligne ; le radier noyé ne se traverse plus ; le bac, si.
  const m = monde(a(s + 1, 0.4));
  const rose = m.nouveau("Rose");
  rose.joueur.position = { x: RADIER.x1 - 3, z: (RADIER.z0 + RADIER.z1) / 2, o: 0 };
  m.attendre((DUREE_TRANCHE_MS / 1000) * 0.6, 0.5);
  assert.equal(m.gue.niveauEau, "noye");
  assert.ok(rose.infos().some((t) => /radier est noyé/.test(t)), rose.infos().join(" | "));
  assert.ok(!surLeRadier(rose.joueur.position.x, rose.joueur.position.z), "l'eau qui monte l'a renvoyé sur la rive");
  assert.ok(heurte(zoneGue({ radeau: BAC.cale.x, noye: true }), 100, (RADIER.z0 + RADIER.z1) / 2, 0.35), "le radier ne se passe plus");
});

// ---------- Le bac (G5, G6) ----------

test("le bac : on hale ≈ 15 s, le radeau emporte ses passagers, de nuit comme pendant la crue ; on le rappelle à vide", () => {
  // Un instant de nuit, pendant une crue : rien n'arrête le bac (G15).
  const k = tranchePluvieuse(3, 40);
  let decalage = (k + 0.5) * DUREE_TRANCHE_MS;
  const essai = new Base(":memory:");
  const debut = essai.debutMonde();
  for (let t = decalage; t < decalage + 200 * DUREE_TRANCHE_MS; t += DUREE_TRANCHE_MS) {
    if (estNuit(heureDeJeu(debut + t, debut)) && crue(debut + t, debut).niveau === "noye") {
      decalage = t;
      break;
    }
  }
  const m = monde(decalage);
  const rose = m.nouveau("Rose");
  const malo = m.nouveau("Malo");
  // Rose et Malo montent à bord, à la cale (côté terrain).
  rose.joueur.position = { x: BAC.cale.x + 1, z: BAC.z, o: 0 };
  malo.joueur.position = { x: BAC.cale.x - 1, z: BAC.z + 0.3, o: 0 };
  assert.ok(messageValide({ t: "gue", op: "haler" }) && messageValide({ t: "gue", op: "cloche" }) && !messageValide({ t: "gue", op: "couler" }));
  rose.joueur.recevoir({ t: "gue", op: "haler" });
  assert.equal(rose.dernier("action")?.etat, "debut");
  assert.ok(Math.abs((rose.dernier("action") as { duree: number }).duree - DUREE_TRAVERSEE_S) < 0.01);
  malo.joueur.recevoir({ t: "gue", op: "haler" });
  assert.ok(malo.infos().some((t) => /un seul tire la corde/.test(t)));
  const x0 = malo.joueur.position.x;
  m.attendre(3);
  // En traversée, les chaînes des deux bouts sont fermées : on ne descend pas dans l'eau.
  const xr = placeRadeau(m.gue.radeau, m.maintenant());
  const zt = zoneGue({ radeau: xr, noye: false });
  assert.ok(heurte(zt, xr + BAC.demiLongueur, BAC.z, 0.35) && heurte(zt, xr - BAC.demiLongueur, BAC.z, 0.35));
  const za = zoneGue({ radeau: BAC.cale.x, noye: false });
  assert.ok(!heurte(za, BAC.cale.x + BAC.demiLongueur, BAC.z, 0.35), "à quai, on descend sur la cale");
  m.attendre(DUREE_TRAVERSEE_S - 2.5);
  assert.ok(Math.abs(placeRadeau(m.gue.radeau, m.maintenant()) - BAC.ponton.x) < 1e-6, "au ponton");
  assert.ok(Math.abs(malo.joueur.position.x - (x0 + BAC.ponton.x - BAC.cale.x)) < 0.05, `Malo a traversé avec le radeau (${malo.joueur.position.x})`);
  // Ils descendent sur le ponton (côté Moulin).
  malo.joueur.recevoir({ t: "intention", dx: -1, dz: 0, allure: "marche", seq: 1 });
  m.attendre(3);
  assert.ok(malo.joueur.position.x < BAC.ponton.x - BAC.demiLongueur, "sur le ponton");
  malo.joueur.recevoir({ t: "intention", dx: 0, dz: 0, allure: "marche", seq: 2 });

  // Un autre, resté à la cale, rappelle le radeau à vide (G6).
  const lou = m.nouveau("Lou");
  lou.joueur.position = { x: BAC.cale.embarquement.x, z: BAC.cale.embarquement.z, o: 0 };
  rose.joueur.position = { x: 60, z: 30, o: 0 };
  m.attendre(0.5);
  lou.joueur.recevoir({ t: "gue", op: "haler" });
  assert.equal((lou.dernier("action") as { libelle?: string } | undefined)?.libelle, LIBELLE_HALER);
  // Il lâche la corde à mi-chemin : le radeau s'arrête au milieu de l'eau.
  m.attendre(7);
  lou.joueur.recevoir({ t: "annuler" });
  m.attendre(1);
  const milieu = placeRadeau(m.gue.radeau, m.maintenant());
  assert.ok(milieu > BAC.ponton.x + 3 && milieu < BAC.cale.x - 3, `au milieu (${milieu})`);
  m.attendre(3);
  assert.equal(placeRadeau(m.gue.radeau, m.maintenant()), milieu);
  lou.joueur.recevoir({ t: "gue", op: "haler" });
  m.attendre(DUREE_TRAVERSEE_S);
  assert.equal(placeRadeau(m.gue.radeau, m.maintenant()), BAC.cale.x, "revenu à la cale");
});

// ---------- La cloche (G7) et les ricochets (G8) ----------

test("la cloche du passeur attire les Éteints de la rive (≈ 40 m)", () => {
  const m = monde(1_000_000, false);
  const rose = m.nouveau("Rose");
  // L'errant entre la cabane et le bac (le 5e du modèle), à une dizaine de mètres de la cloche.
  const e = m.gue.eteints.find((x) => x.id === 5)!;
  m.gue.eteints = [e];
  e.x = CLOCHE.x - 12;
  e.z = CLOCHE.z + 6;
  rose.joueur.position = { x: CLOCHE.x + 0.8, z: CLOCHE.z, o: 0 };
  rose.joueur.recevoir({ t: "gue", op: "cloche" });
  assert.ok(rose.recus.some((r) => r.t === "gue" && r.cloche === true));
  m.attendre(3);
  assert.ok(e.etat === "attire" || e.etat === "poursuivant", e.etat);
  assert.ok(Math.hypot(e.but!.x - CLOCHE.x, e.but!.z - CLOCHE.z) < 1.5, "vers la cloche");
});

test("un galet lancé sur l'eau fait « plouf » ; bien lancé, il ricoche jusqu'à l'autre rive", () => {
  // La règle : un galet qui tombe au milieu de l'eau.
  const de = { x: 115, z: 33 };
  const vers = { x: 107, z: 33 };
  assert.ok(dansLaRiviere(vers.x, vers.z));
  const court = ricochet(de, vers, false)!;
  assert.ok(court.perdu);
  const long = ricochet(de, vers, true)!;
  assert.ok(!long.perdu && long.rebonds.length >= 3, JSON.stringify(long));
  assert.ok(long.fin.x < 92 && !dansLaRiviere(long.fin.x, long.fin.z), "sur l'autre rive");

  // En jeu : Rose lance une pierre, d'abord vite (elle coule), puis en tenant le geste (elle ricoche).
  const m = monde();
  const rose = m.nouveau("Rose", { pierre: 3 });
  rose.joueur.position = { x: de.x, z: de.z, o: -Math.PI / 2 };
  rose.joueur.recevoir({ t: "bander" });
  rose.joueur.recevoir({ t: "lancer", dx: -1, dz: 0, distance: 8 });
  let p = rose.dernier("projectile")!.projectile as ProjectileVu;
  assert.equal(p.impact, "eau");
  assert.equal(p.ricochets, undefined);
  m.attendre(1.5);
  rose.joueur.recevoir({ t: "bander" });
  m.attendre(1);
  rose.joueur.recevoir({ t: "lancer", dx: -1, dz: 0, distance: 8 });
  p = rose.dernier("projectile")!.projectile as ProjectileVu;
  assert.ok(p.ricochets && p.ricochets.length >= 3, JSON.stringify(p));
  assert.ok(p.x1 < 92, "le galet arrive sur l'autre rive");
  // Le galet se ramasse là-bas ; le bruit attire de l'autre côté.
  assert.ok(rose.joueur.stimuli(false).some((s) => s.genre === "son" && s.x < 92));
});

// ---------- Plan 0.8.2, chantier F ----------

test("0.8.2 (recette) : l'Éteint de la chicane de l'entrée atteint le joueur de l'autre côté des troncs", () => {
  for (const [ex, ez, px, pz] of [[14, 28.5, 8, 28.5], [14, 27, 7, 27.5], [9.5, 28, 14, 28.5], [12.5, 29.5, 8, 27]] as const) {
    const m = monde(1_000_000, false);
    const e = m.gue.eteints.find((x) => x.id === 1)!;
    m.gue.eteints = [e];
    e.x = ex;
    e.z = ez;
    e.maison = { x: ex, z: ez };
    const rose = m.nouveau("Rose");
    rose.joueur.position = { x: px, z: pz, o: 0 };
    // Il l'a vu : il la poursuit (on regarde son chemin, pas sa vue).
    e.etat = "poursuivant";
    e.but = { x: px, z: pz };
    e.attention = 1;
    let atteint = false;
    for (let t = 0; t < 60 && !atteint; t += 0.5) {
      m.attendre(0.5);
      rose.joueur.position = { x: px, z: pz, o: 0 };
      atteint = Math.hypot(e.x - px, e.z - pz) < 1.2;
    }
    assert.ok(atteint, `de (${ex}, ${ez}) vers (${px}, ${pz}) : resté en (${e.x.toFixed(2)}, ${e.z.toFixed(2)}), ${e.etat}`);
  }
});

/** La longueur du plus court chemin à pied (grille de 0,25 m, le rayon du joueur) entre deux points du gué. */
function cheminAPied(a: { x: number; z: number }, b: { x: number; z: number }): number {
  const P = 0.25;
  const W = Math.ceil(200 / P);
  const H = Math.ceil(70 / P);
  const d = new Float64Array(W * H).fill(Infinity);
  const i0 = Math.round(a.x / P);
  const j0 = Math.round(a.z / P);
  d[j0 * W + i0] = 0;
  const file: [number, number][] = [[i0, j0]];
  const pas = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]] as const;
  for (let k = 0; k < file.length; k++) {
    const [i, j] = file[k]!;
    for (const [di, dj, c] of pas) {
      const x = i + di;
      const z = j + dj;
      if (x < 0 || z < 0 || x >= W || z >= H) continue;
      const nd = d[j * W + i]! + c * P;
      if (nd < d[z * W + x]! && !heurte(ZONE_GUE, x * P, z * P, 0.35)) {
        d[z * W + x] = nd;
        file.push([x, z]);
      }
    }
  }
  return d[Math.round(b.z / P) * W + Math.round(b.x / P)]!;
}

test("0.8.2 (R1) : seul au gué, 8 branches sur les berges, 4 bûches, 6 pierres hors du banc, toutes à pied sec ; 30 min pour revenir", () => {
  const m = monde();
  const rose = m.nouveau("Rose");
  const vues = rose.vues().filter((r) => r.disponible);
  const tas = FOUILLE_MODELE_TAS();
  const branches = vues.filter((r) => r.type === "branche" && Math.hypot(r.x - tas.x, r.z - tas.z) > 3);
  assert.equal(branches.length, BRANCHES_EPARSES);
  assert.equal(BRANCHES_EPARSES, 8);
  assert.equal(vues.filter((r) => r.type === "buche").length, 4);
  const pierres = vues.filter((r) => r.type === "pierre");
  assert.equal(pierres.filter((r) => !surLeBanc(r.x, r.z, 0.3)).length, 6, "6 pierres sur les pistes");
  assert.equal(pierres.filter((r) => surLeBanc(r.x, r.z, 0.3)).length, PIERRES_DU_BANC);
  // À trois voyageurs, les bûches en vrac grandissent comme à la station (×2).
  m.nouveau("Malo");
  const lou = m.nouveau("Lou");
  assert.equal(lou.vues().filter((r) => r.type === "buche" && r.disponible).length, vracEnJeu(4, 3));
  // Tout se ramasse à pied, depuis l'arrivée.
  const arrivee = SORTIES_GUE.find((s) => s.vers === "terrain")!.arrivee;
  for (const r of [...branches, ...vues.filter((v) => v.type === "buche"), ...pierres.filter((p) => !surLeBanc(p.x, p.z, 0.3))]) {
    const proche = [[0, 0], [0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]].some(([dx, dz]) => cheminAPied(arrivee, { x: r.x + dx!, z: r.z + dz! }) < Infinity);
    assert.ok(proche, `${r.type} en (${r.x}, ${r.z}) se ramasse à pied`);
  }
  // Une branche et une bûche reviennent en 30 min.
  m.prendre(rose.joueur, branches[0]!.id, 4);
  const buche = vues.find((r) => r.type === "buche")!;
  m.prendre(rose.joueur, buche.id, 6);
  assert.ok((rose.inv().branche ?? 0) >= 1 && (rose.inv().buche ?? 0) >= 1, JSON.stringify(rose.inv()));
  m.sauter(30 * MIN);
  m.attendre(6);
  assert.ok(m.gue.disponiblePour(m.gue.ressources.get(branches[0]!.id)!, rose.compte.id, m.maintenant()));
  assert.ok(m.gue.disponiblePour(m.gue.ressources.get(buche.id)!, rose.compte.id, m.maintenant()));
});

/** Le tas de bois flotté du modèle (le point de sa fiche, dans le repère du jeu). */
function FOUILLE_MODELE_TAS(): { x: number; z: number } {
  const t = FOUILLE_MODELE.find((f) => f.quoi?.startsWith("tas de branches"))!;
  return auGue(t.x, t.z);
}

test("0.8.2 (R1) : quelques déchets au bord de la route du gué, partagés, à pied sec", () => {
  const emplacements = [...dispositionLieu(cleCouche("gue", 1)).values()].flat();
  assert.ok(emplacements.length >= 6 && emplacements.length <= 20, `${emplacements.length} emplacements`);
  assert.equal(cleCouche("gue", 1), cleCouche("gue", 2), "la même couche pour tous");
  const arrivee = SORTIES_GUE.find((s) => s.vers === "terrain")!.arrivee;
  for (const e of emplacements) {
    assert.ok(!dansLaRiviere(e.x, e.z), `(${e.x}, ${e.z}) hors de l'eau`);
    assert.ok([[0, 0], [0.6, 0], [-0.6, 0], [0, 0.6], [0, -0.6]].some(([dx, dz]) => cheminAPied(arrivee, { x: e.x + dx!, z: e.z + dz! }) < Infinity), `(${e.x}, ${e.z}) à pied`);
  }
});

test("0.8.2 (R2) : la glaise au milieu de la berge, à pied sec, au nord du camping-car ; le passage depuis la route est direct", () => {
  assert.ok(!dansLaRiviere(GLAISE.x, GLAISE.z) && !heurte(ZONE_GUE, GLAISE.x + 0.6, GLAISE.z, 0.35));
  // Depuis la route (au nord), on y va presque en ligne droite : le camping-car n'est plus entre deux.
  for (const route of [{ x: 80, z: 34 }, { x: 76, z: 34 }]) {
    const d = cheminAPied(route, GLAISE);
    assert.ok(d < Math.hypot(GLAISE.x - route.x, GLAISE.z - route.z) * 1.25, `de (${route.x}, ${route.z}) : ${d.toFixed(1)} m`);
  }
  // Et la berge au sud du camping-car reste accessible par l'est, sans faire le tour par (72 ; 56).
  const sud = { x: 84, z: 53 };
  const d = cheminAPied({ x: 80, z: 34 }, sud);
  assert.ok(d < Math.hypot(sud.x - 80, sud.z - 34) * 1.2, `vers la berge sud : ${d.toFixed(1)} m`);
});

test("0.8.2 (R19) : au bord du radier noyé, une ligne le dit, une fois par tentative", () => {
  const k = tranchePluvieuse(3, 40);
  const m = monde((k + 0.5) * DUREE_TRANCHE_MS);
  const rose = m.nouveau("Rose");
  m.attendre(1);
  assert.equal(m.gue.niveauEau, "noye");
  const dites = () => rose.infos().filter((t) => t === LIGNE_RADIER_NOYE).length;
  const zc = (RADIER.z0 + RADIER.z1) / 2;
  // Elle marche vers l'ouest, droit sur le radier, et bute au bord de l'eau.
  rose.joueur.position = { x: RADIER.x1 + 3, z: zc, o: -Math.PI / 2 };
  rose.joueur.recevoir({ t: "intention", dx: -1, dz: 0, allure: "marche", seq: 1 });
  m.attendre(5);
  assert.ok(heurte(zoneGue({ radeau: BAC.cale.x, noye: true }), rose.joueur.position.x - 0.1, zc, 0.35), `elle bute sur l'eau (${rose.joueur.position.x.toFixed(2)})`);
  assert.equal(dites(), 1, rose.infos().join(" | "));
  // Elle insiste : rien de plus.
  m.attendre(5);
  assert.equal(dites(), 1);
  // Elle s'éloigne, puis revient essayer : la ligne revient, une fois.
  rose.joueur.recevoir({ t: "intention", dx: 1, dz: 0, allure: "marche", seq: 2 });
  m.attendre(4);
  rose.joueur.recevoir({ t: "intention", dx: -1, dz: 0, allure: "marche", seq: 3 });
  m.attendre(5);
  assert.equal(dites(), 2);
  // Jamais une fenêtre : c'est une ligne d'information.
  assert.ok(rose.recus.some((r) => r.t === "info" && (r as { texte: string }).texte === LIGNE_RADIER_NOYE));
  // L'eau basse : rien.
  const sec = monde();
  const malo = sec.nouveau("Malo");
  malo.joueur.position = { x: RADIER.x1 + 3, z: zc, o: -Math.PI / 2 };
  malo.joueur.recevoir({ t: "intention", dx: -1, dz: 0, allure: "marche", seq: 1 });
  sec.attendre(3);
  assert.ok(!malo.infos().includes(LIGNE_RADIER_NOYE));
});

test("0.8.2 : une partie 0.8.1 se relit (le contenu du gué se régénère, rien de ce qu'on porte ne se perd)", () => {
  const base = new Base(":memory:");
  // Le gué d'une 0.8.1 : son contenu en version 2 (ici réduit à quelques pierres, dont une prise), le banc entamé.
  const ancien = genererGue().filter((r) => r.type !== "buche" && r.id <= 60).map((r) => (r.type === "branche" && r.id > 20 ? { ...r, type: "pierre" as const } : r));
  const lignes = base.chargerRessourcesLieu("gue", () => ancien, 2);
  assert.equal(lignes.filter((r) => r.type === "buche").length, 0);
  const compte = base.creerCompte("Rose", "potager42", "charbonniers");
  base.sauverInventaire(compte.id, { pierre: 3, glaise: 2, sac_a_dos: 1 });
  base.sauverInstance(`perso:gue:${compte.id}`, { version: 2, etats: { "1": { prises: 5, depuis: base.debutMonde() } } }, base.debutMonde());
  // La 0.8.2 relit la même base : le gué a son nouveau contenu (VERSION_GUE), le sac de Rose est intact, son banc plein.
  const gue = new Gue(base, () => 0.5);
  assert.equal(VERSION_GUE, 3);
  assert.equal(parType(gue, "buche").length, 12);
  assert.equal(parType(gue, "pierre").length, 63);
  assert.deepEqual(base.chargerInventaire(compte.id), { pierre: 3, glaise: 2, sac_a_dos: 1 });
  const banc = parType(gue, "banc_galets")[0]!;
  assert.ok(gue.disponiblePour(banc, compte.id, base.debutMonde() + 1000), "le banc de galets repart plein");
});
