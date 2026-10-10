// Tests du tutoriel (É5, Book 14 §4.2) : la progression suit ce que fait le joueur ; la saisie est sans danger.

import { test } from "node:test";
import assert from "node:assert/strict";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { DUREE_VOYAGE_S, SORTIES_STATION, SORTIE_TERRAIN, type LieuId } from "../../commun/src/lieux.ts";
import { kitDeDepart } from "../../commun/src/objets.ts";
import { ATELIER, toutDevoile } from "../../commun/src/progression.ts";
import { recette } from "../../commun/src/recettes.ts";
import { FAMILLES, type Famille } from "../../commun/src/regles.ts";
import { ETAPE_CARTE, ETAPE_FAMILLE, ETAPE_SAISIE, NOMBRE_ETAPES, PIECE_DE_FAMILLE, TUTORIEL_NEUF, etapesTutoriel } from "../../commun/src/tutoriel.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

function monter(etape = 0, inventaire?: Record<string, number>) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "charbonniers", true);
  if (etape > 0) base.sauverTutoriel(compte.id, { ...TUTORIEL_NEUF, etape });
  if (inventaire) base.sauverInventaire(compte.id, inventaire);
  let instant = 1_000_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), () => 1, new Comptoir(base, instant));
  const attendre = (secondes: number, pas = 0.25) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  return { base, compte, joueur, attendre, dernier, recus };
}

test("un nouveau joueur commence le tutoriel ; essayer les trois allures valide l'arrivée", () => {
  const t = monter();
  assert.equal(t.joueur.bienvenue(0).tutoriel!.titre, "L'arrivée");
  for (const allure of ["discrete", "marche", "course"] as const) {
    t.joueur.recevoir({ t: "intention", dx: 1, dz: 0, allure, seq: 1 });
    t.attendre(2.5);
  }
  t.joueur.recevoir({ t: "intention", dx: 0, dz: 0, allure: "marche", seq: 2 });
  t.attendre(1);
  const v = t.dernier("tutoriel")!.tutoriel!;
  assert.equal(v.etape, 1);
  assert.equal(v.titre, "Ramasser");
  assert.match(v.lecon!, /cercle/);
});

test("un compte de test (créé sans tutoriel) n'a pas de carnet", () => {
  const base = new Base(":memory:");
  const c = base.creerCompte("Malo", "potager42", "mecanistes");
  const j = new Joueur(c, base, () => {}, () => 0, new Halte(base), () => 1, new Comptoir(base, 0));
  assert.equal(j.bienvenue(0).tutoriel, null);
});

test("étape 8 : un Éteint sort de la lisière ; le détruire à la tête valide l'étape", () => {
  const t = monter(7, { hache: 1 });
  t.attendre(1);
  const e = t.dernier("eteints")!.eteints[0]!;
  assert.ok(e, "l'Éteint du tutoriel arrive");
  t.joueur.position = { x: e.x, z: e.z + 1, o: Math.PI };
  t.joueur.recevoir({ t: "frapper", appuye: true });
  t.attendre(1);
  assert.equal(t.dernier("tutoriel")!.tutoriel!.titre, "La saisie");
});

test("étape 9 : la saisie scénarisée ne mord jamais, et lâche toute seule ; « La carte » vient ensuite (Q-0.8-18)", () => {
  const t = monter(8);
  t.attendre(1);
  assert.equal(t.dernier("sante")?.saisi ?? 1, 1);
  t.attendre(8);
  assert.ok(!t.recus.some((m) => m.t === "morsure"), "aucune morsure");
  assert.equal(t.dernier("tutoriel")!.tutoriel!.titre, "La carte");
});

test("on peut passer le tutoriel", () => {
  const t = monter();
  t.joueur.recevoir({ t: "tutoriel_passer" });
  assert.equal(t.dernier("tutoriel")!.tutoriel, null);
  assert.equal(t.base.chargerTutoriel(t.compte.id), null);
});

test("étape « Ramasser » : le carnet compte les branches et les pierres au fil du ramassage", () => {
  const t = monter(1);
  const carnet = () => t.dernier("tutoriel")!.tutoriel!;
  const ressources = t.joueur.bienvenue(0).ressources;
  t.attendre(1);
  assert.deepEqual(carnet().progres, [
    { libelle: "Branches", fait: 0, but: 3 },
    { libelle: "Pierres", fait: 0, but: 5 },
  ]);
  for (const b of ressources.filter((r) => r.type === "branche").slice(0, 2)) {
    t.joueur.position = { x: b.x, z: b.z, o: 0 };
    t.joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: b.id }, verbe: "ramasser" });
    t.attendre(2);
  }
  assert.deepEqual(carnet().progres?.[0], { libelle: "Branches", fait: 2, but: 3 });
});

// ---------- Plan 0.8, chantier 13 : la saisie, la carte, la famille, la nuit (V5-2, Q-0.8-18) ----------

// La batterie de la ruine (18 kg) reste au coffre : le sac ne porte que 55 kg.
const RUINE = { bache: 1, barre_metal: 1, ressort_lames: 2, cadre_velo: 1, chaine_velo: 1, roue_velo: 2, dynamo_velo: 1, tete_hache: 1, cle_plate: 1, tournevis: 1 };

/** Un élève à l'étape « La carte », son abri posé, avec la ruine et le terrain dans le sac (et rien d'autre en tête). */
function aLaCarte(famille: Famille) {
  const base = new Base(":memory:");
  let instant = 1_000_000;
  const halte = new Halte(base, () => 0.5);
  halte.eteints = [];
  const comptoir = new Comptoir(base, instant);
  const compte = base.creerCompte("Rose", "potager42", famille, true);
  base.sauverTutoriel(compte.id, { ...TUTORIEL_NEUF, etape: ETAPE_CARTE, premierEteintDetruit: true, degage: true });
  base.sauverProgression(compte.id, toutDevoile(famille));
  base.sauverInventaire(compte.id, { ...kitDeDepart(famille), ...RUINE, branche: 12, hache: 1 });
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 0.99, comptoir);
  const attendre = (secondes: number, pas = 0.5) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      halte.tick(instant, pas);
      joueur.tick(pas);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const carnet = () => dernier("tutoriel")?.tutoriel ?? null;
  const inventaire = () => dernier("inventaire")?.inventaire ?? {};
  const voyager = (depuis: { boite: { x: number; z: number } }, vers: LieuId) => {
    joueur.position = { x: depuis.boite.x, z: depuis.boite.z, o: 0 };
    joueur.recevoir({ t: "voyager", vers });
    attendre(DUREE_VOYAGE_S + 1);
  };
  const construire = (recetteId: string, x: number, z: number) => {
    joueur.position = { x, z: z - 1.2, o: 0 };
    joueur.recevoir({ t: "fabriquer", recette: recetteId, x, z, o: 0 });
    attendre(recette(recetteId)!.duree / 2 + 5);
    return base.chargerInstallations(compte.id).find((i) => i.type === (recette(recetteId)!.produit as { installation: string }).installation)!;
  };
  return { base, compte, joueur, attendre, carnet, inventaire, voyager, construire, recus };
}

/** Le geste de la pièce, sur son meuble (chantier 7). */
const GESTE_PIECE = { charbonniers: ["poser_enclume", 9], voltaiques: ["poser_panneau", 21], mecanistes: ["monter_alternateur", 21] } as const;
/** La pièce de la station : la ressource à prendre, son verbe. */
const RESSOURCE_PIECE = { charbonniers: ["piece_enclume", "ramasser"], voltaiques: ["panneau_auvent", "demonter"], mecanistes: ["piece_alternateur", "ramasser"] } as const;

for (const famille of FAMILLES) {
  test(`${famille} : finit le tutoriel seul, en passant par la station (la carte, la famille, la nuit)`, () => {
    const t = aLaCarte(famille);
    const abri = t.construire("abri", 14, 24);
    t.attendre(1);
    assert.equal(t.carnet()!.titre, "La carte");
    assert.match(t.carnet()!.consigne, /station-service/);
    assert.deepEqual(t.carnet()!.progres!.map((p) => p.fait), [0, 0, 0]);
    // Aller à la station, y prendre sa pièce.
    t.voyager(SORTIE_TERRAIN, "station");
    assert.equal(t.carnet()!.titre, "La carte", "arriver à la station ne suffit pas : il faut rentrer avec sa pièce");
    const [type, verbe] = RESSOURCE_PIECE[famille];
    const r = t.joueur.bienvenue(0).ressources.find((x) => x.type === type)!;
    assert.ok(r, `la pièce ${type} est là`);
    t.joueur.position = { x: r.x, z: r.z + 0.9, o: Math.PI };
    t.joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: r.id }, verbe });
    t.attendre(30);
    assert.equal(t.inventaire()[PIECE_DE_FAMILLE[famille]], 1, "la pièce est dans le sac");
    assert.deepEqual(t.carnet()!.progres!.map((p) => p.fait), [1, 1, 0]);
    // Rentrer : « La famille ».
    t.voyager(SORTIES_STATION.find((s) => s.vers === "terrain")!, "terrain");
    t.attendre(1);
    assert.equal(t.carnet()!.titre, "La famille");
    // Les pierres et les bûches du terrain, ramassées en rentrant (le sac ne les a pas portées à la station).
    (t.joueur as unknown as { ajouterPlusieurs(i: Record<string, number>): void }).ajouterPlusieurs({ pierre: 8, buche: 2 });
    // Le meuble seul ne suffit pas : la pièce posée dessus, si (plan 0.8 §9.2).
    const meuble = t.construire(ATELIER[famille], 24, 24);
    t.attendre(1);
    assert.equal(t.carnet()!.titre, "La famille");
    const [geste, secondes] = GESTE_PIECE[famille];
    t.joueur.position = { x: meuble.x, z: meuble.z - 1.2, o: 0 };
    t.joueur.recevoir({ t: "interagir", cible: { genre: "installation", id: meuble.id }, verbe: geste });
    t.attendre(secondes + 1);
    assert.equal(t.carnet()!.titre, "La nuit");
    assert.match(t.carnet()!.consigne, /branches/, "la consigne de la nuit conseille les branches (B14)");
    // La nuit : dormir dans l'abri.
    t.joueur.position = { x: abri.x, z: abri.z - 1.2, o: 0 };
    (t.joueur as unknown as { besoins: { repos: number } }).besoins.repos = 0.3;
    t.joueur.recevoir({ t: "interagir", cible: { genre: "installation", id: abri.id }, verbe: "dormir" });
    t.attendre(2);
    assert.equal(t.carnet()!.termine, true, "le tutoriel est fini");
    assert.equal(t.base.chargerTutoriel(t.compte.id), null);
  });
}

test("« La carte » sans la pièce : revenir les mains vides ne valide rien", () => {
  const t = aLaCarte("voltaiques");
  t.voyager(SORTIE_TERRAIN, "station");
  t.voyager(SORTIES_STATION.find((s) => s.vers === "terrain")!, "terrain");
  t.attendre(1);
  assert.equal(t.carnet()!.titre, "La carte");
  assert.deepEqual(t.carnet()!.progres!.map((p) => p.fait), [1, 0, 0]);
});

test("l'ordre de fin du tutoriel : la saisie, la carte, la famille, la nuit (Q-0.8-18)", () => {
  for (const famille of FAMILLES) {
    const titres = etapesTutoriel(famille).map((e) => e.titre);
    assert.deepEqual(titres.slice(ETAPE_SAISIE), ["La saisie", "La carte", "La famille", "La nuit"]);
    assert.equal(titres.length, NOMBRE_ETAPES);
  }
  // Les gestes du chantier 7, dans la consigne de « La famille ».
  assert.match(etapesTutoriel("voltaiques")[ETAPE_FAMILLE]!.consigne, /Pose le panneau sur ton banc/);
  assert.match(etapesTutoriel("charbonniers")[ETAPE_FAMILLE]!.consigne, /Cale l'enclume sur le billot de ta forge/);
  assert.match(etapesTutoriel("mecanistes")[ETAPE_FAMILLE]!.consigne, /Monte l'alternateur sur le pédalier/);
});
