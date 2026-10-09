// L'arbre de progression côté serveur (0.7) : l'état par personnage, les déclencheurs aux bons moments, le refus,
// la migration des personnages d'avant, le message « Tu y penses », les rencontres et le « voir faire ».

import { test } from "node:test";
import assert from "node:assert/strict";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { devoileesDEmblee } from "../../commun/src/progression.ts";
import { Base } from "./base.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { messageValide } from "./controle.ts";
import { DUREE_RENCONTRE_S, Rencontres, temoins } from "./rencontres.ts";
import type { Famille } from "../../commun/src/regles.ts";

/** Ces tests ne portent pas sur les Éteints : aucun ne vient de la lisière. */
const JAMAIS_D_ETEINT = () => 1;

function monter(options: { famille?: Famille; tutoriel?: boolean; inventaire?: Record<string, number>; avant?: (base: Base, id: number) => void } = {}) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", options.famille ?? "charbonniers", options.tutoriel ?? false);
  if (options.inventaire) base.sauverInventaire(compte.id, options.inventaire);
  options.avant?.(base, compte.id);
  let instant = 1_000_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), JAMAIS_D_ETEINT);
  const attendre = (secondes: number, pas = 0.25) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const tous = <T extends MessageServeur["t"]>(t: T) => recus.filter((m) => m.t === t) as Extract<MessageServeur, { t: T }>[];
  const infos = () => tous("info").map((m) => m.texte);
  const sac = (inventaire: Record<string, number>) => ((joueur as unknown as { inventaire: Record<string, number> }).inventaire = inventaire);
  return { base, compte, joueur, attendre, tous, infos, sac, recus };
}

/** Un personnage d'avant la 0.7 : sa colonne « progression » est vide. */
function avantLa07(base: Base, id: number): void {
  (base as unknown as { db: { prepare(s: string): { run(...a: unknown[]): void } } }).db.prepare("UPDATE personnages SET progression = '' WHERE compte_id = ?").run(id);
}

test("un nouveau joueur (tutoriel) ne pense qu'au feu et à l'abri ; le serveur refuse le reste (Q1)", () => {
  const { joueur, infos } = monter({ tutoriel: true, inventaire: { buche: 2, branche: 3 } });
  const v = joueur.bienvenue(0).progression!;
  assert.deepEqual([...v.devoilees].sort(), ["abri", "feu_de_camp"]);
  assert.equal(v.prochain?.palier, 1);
  joueur.recevoir({ t: "fabriquer", recette: "gourdin" });
  assert.equal(infos().at(-1), "Tu n'y as pas encore pensé.");
});

test("tenir des joncs fait penser à la ficelle : message « Tu y penses », pastille, puis regroupement en 10 s", () => {
  const { joueur, attendre, tous, sac } = monter({ tutoriel: true });
  sac({ sac_a_dos: 1, fibres: 2 });
  attendre(1);
  const premier = tous("devoilement").at(-1)!;
  assert.deepEqual([...premier.nouvelles].sort(), ["corde", "ficelle"]);
  assert.equal(premier.texte, "Tu y penses : 2 idées nouvelles dans Fabriquer.");
  assert.ok(premier.progression.nonVues.includes("ficelle"));
  // Une autre idée dans les 10 s : la liste part tout de suite, le texte attend.
  sac({ sac_a_dos: 1, fibres: 2, poule: 1 });
  attendre(1);
  const second = tous("devoilement").at(-1)!;
  assert.deepEqual(second.nouvelles, ["volaille"]);
  assert.equal(second.texte, undefined);
  attendre(10);
  assert.equal(tous("devoilement").at(-1)!.texte, "Tu y penses : plumer et vider la poule.");
  // Le client a montré les cartes : plus de pastille.
  joueur.recevoir({ t: "recettes_vues", recettes: ["ficelle", "corde", "volaille"] });
  assert.deepEqual(joueur.bienvenue(0).progression!.nonVues, []);
});

test("une fois dévoilée, la recette se fabrique ; l'état est gardé en base", () => {
  const { base, compte, joueur, attendre, sac, infos } = monter({ tutoriel: true });
  sac({ sac_a_dos: 1, fibres: 2 });
  attendre(1);
  joueur.recevoir({ t: "fabriquer", recette: "ficelle" });
  assert.notEqual(infos().at(-1), "Tu n'y as pas encore pensé.");
  joueur.sauvegarder();
  const garde = base.chargerProgression(compte.id)!;
  assert.ok(garde.devoilees.includes("ficelle"));
  assert.ok(garde.vus.includes("fibres"));
});

test("allumer son premier feu fait penser au gourdin (« la fumée se sent de loin »)", () => {
  const { joueur, attendre } = monter({ tutoriel: true });
  (joueur as unknown as { noterFait(f: string): void }).noterFait("feu_allume");
  attendre(1);
  assert.ok(joueur.bienvenue(0).progression!.devoilees.includes("gourdin"));
});

test("le compte créé sans tutoriel est un vétéran (Q8) : paliers 1 et 2, mais pas l'atelier", () => {
  const { joueur, infos } = monter({ inventaire: { buche: 2, pierre: 8, barre_metal: 1, branche: 2, couteau: 1 } });
  const d = joueur.bienvenue(0).progression!.devoilees;
  for (const id of devoileesDEmblee("charbonniers")) assert.ok(d.includes(id), id);
  assert.deepEqual(joueur.bienvenue(0).progression!.nonVues, []);
  joueur.recevoir({ t: "fabriquer", recette: "forge", x: 20, z: 20 });
  assert.equal(infos().at(-1), "Tu n'y as pas encore pensé.");
});

test("passer le tutoriel dévoile d'un coup les paliers 1 et 2", () => {
  const { joueur, tous } = monter({ tutoriel: true });
  joueur.recevoir({ t: "tutoriel_passer" });
  const m = tous("devoilement").at(-1)!;
  assert.ok(m.progression.devoilees.includes("gourdin"));
  assert.equal(m.texte, "Tu y penses : les gestes de base te reviennent tous.");
});

test("le seuil S : un toit et une nuit, et le métier commence", () => {
  const { joueur, attendre, tous } = monter({ tutoriel: true });
  const j = joueur as unknown as { noterFait(f: string): void };
  j.noterFait("fabrique:abri");
  j.noterFait("nuit");
  attendre(1);
  const m = tous("devoilement").at(-1)!;
  assert.ok(m.nouvelles.includes("forge"));
  assert.equal(m.texte, "Ton métier commence : le foyer de forge t'attend dans Fabriquer.");
});

test("le filet du temps : après 20 min de jeu, tout le palier 1", () => {
  const { joueur, attendre } = monter({ tutoriel: true });
  attendre(20 * 60 + 1, 1);
  const d = joueur.bienvenue(0).progression!.devoilees;
  assert.ok(d.includes("lit_branchages") && d.includes("escabeau"));
  assert.ok(!d.includes("gourdin"));
});

test("migration (Q4) : un personnage d'avant ne voit plus ce qu'il n'a pas validé, mais ne perd rien", () => {
  const { base, compte, joueur } = monter({
    famille: "charbonniers",
    inventaire: { tete_hache: 1, fibres: 3, machette_forgee: 1 },
    avant: (b, id) => {
      b.ajouterInstallation(id, "forge", 30, 30, 0);
      b.sauverQuetes(id, { faits: { "fabrique:lame_forgee_fer": 2 }, finies: [], primes: 0 });
      avantLa07(b, id);
    },
  });
  const v = joueur.bienvenue(0).progression!;
  // Ce qu'il a validé : la tête de hache, les joncs, sa forge posée, ses couteaux forgés.
  for (const id of ["hache", "ficelle", "corde", "forge", "machette_forgee_fer", "pinces_forge"]) assert.ok(v.devoilees.includes(id), id);
  // Ce qu'il n'a pas encore vécu reste à découvrir.
  assert.ok(!v.devoilees.includes("glaive"));
  assert.ok(!v.devoilees.includes("escabeau"));
  // Pas de pastille « 40 nouveautés ».
  assert.deepEqual(v.nonVues, []);
  // Rien n'est détruit : la forge et la machette sont toujours là.
  assert.ok(base.chargerInstallations(compte.id).some((i) => i.type === "forge"));
  assert.equal(base.chargerInventaire(compte.id).machette_forgee, 1);
  // La migration est gardée : on ne la rejoue pas.
  assert.ok(base.chargerProgression(compte.id)!.devoilees.includes("forge"));
});

test("voir faire et la rencontre : le déclencheur A, et la recette vue", () => {
  const { joueur, attendre } = monter({ tutoriel: true });
  joueur.vuFaire("epieu");
  joueur.noterRencontre("voltaiques");
  attendre(1);
  const v = joueur.bienvenue(0).progression!;
  assert.ok(v.devoilees.includes("epieu"));
  assert.equal(v.autres, true);
});

test("les rencontres : une minute à 3 m d'une autre famille, dans un lieu public ; voir faire à 5 m", () => {
  const r = new Rencontres();
  const a = { id: 1, famille: "charbonniers" as const, lieu: "station", x: 0, z: 0 };
  const b = { id: 2, famille: "voltaiques" as const, lieu: "station", x: 2, z: 0 };
  const c = { id: 3, famille: "charbonniers" as const, lieu: "station", x: 1, z: 0 };
  const d = { id: 4, famille: "mecanistes" as const, lieu: null, x: 0, z: 0 };
  let paires: unknown[] = [];
  for (let s = 0; s < DUREE_RENCONTRE_S - 1; s++) paires.push(...r.verifier([a, b, c, d], 1));
  assert.equal(paires.length, 0);
  paires = r.verifier([a, b, c, d], 1);
  // a et b, c et b (familles différentes) ; a et c sont de la même famille ; d est chez lui.
  assert.deepEqual(paires.map((p) => (p as { id: number }[]).map((x) => x.id).sort()).sort(), [[1, 2], [2, 3]]);
  // Une seule fois par séance.
  assert.equal(r.verifier([a, b, c, d], 120).length, 0);
  assert.deepEqual(temoins(a, [a, b, c, d, { ...b, id: 5, x: 6 }]).map((p) => p.id).sort(), [2, 3]);
  assert.deepEqual(temoins(d, [a, b, d]), []);
});

test("le contrôle des messages : « recettes_vues » n'accepte qu'une liste courte de chaînes courtes", () => {
  assert.ok(messageValide({ t: "recettes_vues", recettes: ["ficelle", "corde"] }));
  assert.ok(!messageValide({ t: "recettes_vues", recettes: "ficelle" }));
  assert.ok(!messageValide({ t: "recettes_vues", recettes: [3] }));
  assert.ok(!messageValide({ t: "recettes_vues", recettes: Array.from({ length: 500 }, () => "x") }));
});
