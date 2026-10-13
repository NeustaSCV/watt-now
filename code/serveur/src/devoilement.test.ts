// L'arbre de progression côté serveur (0.7, réécrit pour la 0.8, chantier 2) : l'état par personnage, les déclencheurs
// aux bons moments, le refus, le message « Tu y penses », l'idée au ramassage d'une clé (gardée, jamais redite),
// l'indice en deux temps, le vétéran, les rencontres et le « voir faire ». Plus de migration : la 0.8 démarre sur une
// base neuve (plan 0.8 §9.1).

import { test } from "node:test";
import assert from "node:assert/strict";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { INDICE_SECOND_TEMPS_MIN, PROGRESSION_VIDE, TEXTE_VETERAN, devoileesAuDepart, devoileesDEmblee, progressionValide, type EtatProgression } from "../../commun/src/progression.ts";
import type { Inventaire } from "../../commun/src/objets.ts";
import { SuiviDevoilement, type ConstructionVue, type SourceDevoilement } from "./devoilement.ts";
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

/** La carte d'un terrain qui n'a qu'un feu, de cette forme (comme `carteInstallations`). */
function feu(forme: string, niveau: number): ConstructionVue[] {
  return [{ type: "feu", niveau }, { type: `feu:${forme}`, niveau: 1 }];
}

/** Un suivi seul, sur une source qu'on règle à la main (le sac, les constructions, le lieu) : les clés et les indices. */
function suivi(options: { installations?: ConstructionVue[]; lieu?: string | null; etat?: EtatProgression } = {}) {
  let instant = 1_000_000;
  const recus: MessageServeur[] = [];
  const faits: Record<string, number> = {};
  const etat = {
    inventaire: {} as Inventaire,
    installations: options.installations ?? feu("feu_camp", 1),
    lieu: options.lieu === undefined ? "terrain" : options.lieu,
  };
  const source: SourceDevoilement = {
    famille: "charbonniers",
    maintenant: () => instant,
    savoir: () => ({}),
    inventaire: () => etat.inventaire,
    faits: () => faits,
    installations: () => etat.installations,
    quetes: () => [],
    tuto: () => null,
    sansSac: () => false,
    lieu: () => etat.lieu,
    constats: () => [],
    noter: (f) => (faits[f] = (faits[f] ?? 0) + 1),
    envoyer: (m) => recus.push(m),
  };
  const s = new SuiviDevoilement(options.etat ?? { ...PROGRESSION_VIDE, devoilees: devoileesAuDepart() }, source);
  const attendre = (secondes: number, pas = 0.5) => {
    for (let t = 0; t < secondes; t += pas) {
      instant += pas * 1000;
      s.tick(pas);
    }
  };
  const idees = () => recus.filter((m) => m.t === "idee") as Extract<MessageServeur, { t: "idee" }>[];
  return { s, etat, faits, attendre, idees, recus };
}

test("un nouveau joueur (tutoriel) ne pense qu'au feu et à l'abri ; le serveur refuse le reste (Q1)", () => {
  const { joueur, infos } = monter({ tutoriel: true, inventaire: { buche: 2, branche: 3 } });
  const v = joueur.bienvenue(0).progression!;
  assert.deepEqual([...v.devoilees].sort(), ["abri", "feu_de_camp"]);
  assert.deepEqual(v.silhouettes, []);
  assert.deepEqual(v.idees, []);
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

test("le compte créé sans tutoriel est un vétéran (Q8) : les recettes communes à la main, mais pas l'atelier", () => {
  const { joueur, infos } = monter({ inventaire: { buche: 2, pierre: 8, barre_metal: 1, branche: 2, couteau: 1 } });
  const d = joueur.bienvenue(0).progression!.devoilees;
  for (const id of devoileesDEmblee("charbonniers")) assert.ok(d.includes(id), id);
  assert.ok(!d.includes("cepes_poeles") && !d.includes("lit_branchages"));
  assert.deepEqual(joueur.bienvenue(0).progression!.nonVues, []);
  joueur.recevoir({ t: "fabriquer", recette: "forge", x: 20, z: 20 });
  assert.equal(infos().at(-1), "Tu n'y as pas encore pensé.");
});

test("passer le tutoriel dévoile d'un coup les gestes à la main, et le carnet dit : « Ta famille t'attend à la station »", () => {
  const { joueur, tous } = monter({ tutoriel: true });
  joueur.recevoir({ t: "tutoriel_passer" });
  const m = tous("devoilement").at(-1)!;
  assert.ok(m.progression.devoilees.includes("gourdin"));
  assert.ok(!m.progression.devoilees.includes("epieu"), "l'épieu attend le foyer de pierres");
  assert.equal(m.texte, TEXTE_VETERAN);
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

test("le filet du temps, par recette à la main : après 20 min de jeu, la ficelle, la corde, plumer la poule", () => {
  const { joueur, attendre } = monter({ tutoriel: true });
  attendre(20 * 60 + 1, 1);
  const d = joueur.bienvenue(0).progression!.devoilees;
  assert.ok(d.includes("ficelle") && d.includes("corde") && d.includes("volaille"));
  assert.ok(!d.includes("gourdin") && !d.includes("escabeau"), "le gourdin attend son heure, et ce qui se pose, son besoin");
});

test("voir faire et la rencontre : le déclencheur A, et la recette vue", () => {
  const { joueur, attendre } = monter({ tutoriel: true });
  joueur.vuFaire("gourdin");
  joueur.noterRencontre("voltaiques");
  attendre(1);
  const v = joueur.bienvenue(0).progression!;
  assert.ok(v.devoilees.includes("gourdin"));
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

// ---------- Les clés (plan 0.8 §2.2) ----------

test("ramasser un grillage sans foyer de pierres : « un jour », l'idée gardée ; la fiche du foyer de cuisine la montre déjà en poche", () => {
  const { s, etat, attendre, idees, recus } = suivi();
  etat.inventaire = { grillage_rouleau: 1 };
  attendre(1);
  assert.deepEqual(idees().map((m) => [m.etape, m.plusTard, m.texte]), [["foyer_cuisine", true, "Ce grillage pourra servir à ton feu, un jour."]]);
  assert.deepEqual(s.vue().idees, ["foyer_cuisine"]);
  assert.deepEqual(s.etat.idees, ["foyer_cuisine"]);
  // Plus tard, le foyer de pierres maçonné : la fiche du foyer de cuisine montre la clé en poche, pas d'indice à chercher.
  etat.inventaire = {};
  etat.installations = feu("foyer_pierres", 2);
  s.aRevoir();
  attendre(2);
  const v = s.vue();
  assert.ok(v.idees.includes("foyer_cuisine"));
  assert.equal(v.indices.foyer_cuisine, undefined);
  assert.ok(v.silhouettes.some((x) => x.id === "soupe_cepes" && x.ou === "Au foyer de cuisine"));
  // La vue est repartie au client avec l'idée.
  assert.ok(recus.some((m) => m.t === "devoilement" && m.progression.idees.includes("foyer_cuisine")));
});

test("le message ne revient pas au second ramassage (ni après l'avoir posé, ni d'une session à l'autre)", () => {
  const { s, etat, attendre, idees } = suivi({ installations: feu("foyer_pierres", 2) });
  etat.inventaire = { grillage_rouleau: 1 };
  attendre(1);
  assert.equal(idees().length, 1);
  assert.equal(idees()[0]!.plusTard, false);
  assert.match(idees()[0]!.texte, /Tu y penses\.$/);
  etat.inventaire = {};
  attendre(1);
  etat.inventaire = { grillage_rouleau: 1 };
  attendre(1);
  assert.equal(idees().length, 1, "jamais au deuxième ramassage");
  // L'état gardé en base le sait : un suivi neuf sur cet état ne redit rien.
  const autre = suivi({ installations: feu("foyer_pierres", 2), etat: JSON.parse(JSON.stringify(s.etat)) as EtatProgression });
  autre.etat.inventaire = { grillage_rouleau: 1 };
  autre.attendre(1);
  assert.equal(autre.idees().length, 0);
});

test("l'indice passe au second temps après une visite de L1A sans le grillage", () => {
  const { s, etat, attendre, faits } = suivi({ installations: feu("foyer_pierres", 2) });
  attendre(2);
  assert.equal(s.vue().indices.foyer_cuisine, 1, "le foyer de pierres posé : l'indice du foyer de cuisine s'ouvre, au premier temps");
  assert.equal(faits["indice:foyer_cuisine"], 1);
  // Une visite à la station ne change rien.
  etat.lieu = null;
  attendre(2);
  etat.lieu = "station";
  attendre(2);
  etat.lieu = null;
  attendre(2);
  assert.equal(s.vue().indices.foyer_cuisine, 1);
  // La Coopérative (L1A), quittée sans le grillage : le second temps, le coin.
  etat.lieu = "cooperative";
  attendre(2);
  assert.equal(s.vue().indices.foyer_cuisine, 1, "on y est encore");
  etat.lieu = null;
  attendre(2);
  assert.equal(s.vue().indices.foyer_cuisine, 2);
  assert.equal(faits["indice:foyer_cuisine"], 2);
});

test("l'indice passe au second temps après 45 min de jeu ; une visite avec le grillage ne compte pas", () => {
  const a = suivi({ installations: feu("foyer_pierres", 2) });
  a.attendre(2);
  a.attendre(INDICE_SECOND_TEMPS_MIN * 60 - 10, 5);
  assert.equal(a.s.vue().indices.foyer_cuisine, 1);
  a.attendre(15, 1);
  assert.equal(a.s.vue().indices.foyer_cuisine, 2);
  // Le grillage trouvé à la Coopérative : l'idée vient, l'indice se ferme (la clé est en poche).
  const b = suivi({ installations: feu("foyer_pierres", 2), lieu: "cooperative" });
  b.attendre(2);
  b.etat.inventaire = { grillage_rouleau: 1 };
  b.attendre(1);
  b.etat.lieu = null;
  b.attendre(2);
  assert.equal(b.s.vue().indices.foyer_cuisine, undefined);
  assert.equal(b.idees().length, 1);
});

test("la poêlée reste grisée pour qui n'a qu'un feu de camp ; le foyer de pierres la dévoile seul", () => {
  const { s, etat, attendre } = suivi();
  etat.inventaire = { cepe: 3 };
  attendre(2);
  assert.ok(!s.estDevoilee("cepes_poeles"));
  assert.ok(s.vue().silhouettes.some((x) => x.id === "cepes_poeles" && x.ou === "Au foyer de pierres"));
  etat.installations = feu("foyer_pierres", 2);
  s.aRevoir();
  attendre(1);
  assert.ok(s.estDevoilee("cepes_poeles"));
});

test("un joueur qui ramasse un grillage reçoit « Tu y penses » (message idee), une seule fois", () => {
  const { tous, attendre, sac } = monter({ tutoriel: true });
  sac({ sac_a_dos: 1, grillage_rouleau: 1 });
  attendre(1);
  assert.equal(tous("idee").length, 1);
  assert.equal(tous("idee")[0]!.etape, "foyer_cuisine");
  sac({ sac_a_dos: 1 });
  attendre(1);
  sac({ sac_a_dos: 1, grillage_rouleau: 1 });
  attendre(1);
  assert.equal(tous("idee").length, 1);
});

// ---------- Les meubles de famille : montés au niveau de leur clé une fois leur pièce posée (plan 0.8 §9.2) ----------

test("le banc posé sans son panneau : ramasser le panneau dit « Tu y penses » ; le panneau posé, plus rien à dire", () => {
  const sans = suivi({ installations: [...feu("foyer_pierres", 2), { type: "banc_recharge", niveau: 1 }] });
  sans.etat.inventaire = { panneau_solaire: 1 };
  sans.attendre(1);
  assert.deepEqual(sans.idees().map((m) => [m.etape, m.plusTard]), [["banc_recharge", false]]);
  assert.match(sans.idees()[0]!.texte, /Ce panneau, posé sur un banc/);
  // Un banc qui a déjà son panneau (un second panneau trouvé) : l'idée est gardée en silence.
  const avec = suivi({ installations: [...feu("foyer_pierres", 2), { type: "banc_recharge", niveau: 1 }, { type: "banc_recharge+panneau", niveau: 1 }] });
  avec.etat.inventaire = { panneau_solaire: 1 };
  avec.attendre(1);
  assert.equal(avec.idees().length, 0);
  assert.deepEqual(avec.s.vue().idees, ["banc_recharge"]);
});

test("la forge et le pédalier : l'enclume et l'alternateur parlent tant qu'ils ne sont pas posés", () => {
  const forge = suivi({ installations: [...feu("foyer_pierres", 2), { type: "forge", niveau: 1 }] });
  forge.attendre(2);
  assert.equal(forge.s.vue().indices.forge, 1, "le foyer posé sans enclume : l'indice reste ouvert");
  forge.etat.inventaire = { enclume_depanneur: 1 };
  forge.attendre(1);
  assert.deepEqual(forge.idees().map((m) => m.etape), ["forge"]);
  const pedalier = suivi({ installations: [...feu("foyer_pierres", 2), { type: "pedalier", niveau: 1 }] });
  pedalier.etat.inventaire = { petit_alternateur: 1 };
  pedalier.attendre(1);
  assert.deepEqual(pedalier.idees().map((m) => m.etape), ["pedalier"]);
});

test("un Voltaïque pose son banc, puis ramasse le panneau : le message vient", () => {
  const { tous, attendre, sac, joueur } = monter({
    famille: "voltaiques",
    inventaire: { sac_a_dos: 1 },
    avant: (b, id) => b.ajouterInstallation(id, "banc_recharge", 21, 20, 0),
  });
  joueur.position = { x: 20, z: 20, o: 0 };
  attendre(1);
  assert.equal(tous("idee").length, 0);
  sac({ sac_a_dos: 1, panneau_solaire: 1 });
  attendre(1);
  assert.deepEqual(tous("idee").map((m) => m.etape), ["banc_recharge"]);
  assert.match(tous("idee")[0]!.texte, /panneau, posé sur un banc/);
});

// ---------- R26 (0.8.2, chantier J) : les armes de métier attendent le meuble de famille complet ----------

test("R26 : le foyer de forge sans enclume ne fait penser à aucune lame ; l'enclume posée, elles viennent avec « Tu y penses »", () => {
  const t = suivi({ installations: [...feu("foyer_pierres", 2), { type: "forge", niveau: 1 }], etat: { ...PROGRESSION_VIDE, devoilees: [...devoileesAuDepart(), "forge"] } });
  t.attendre(2);
  const avant = t.s.vue();
  for (const id of ["lame_forgee_fer", "machette_forgee_fer", "hachette", "lame_forgee"]) {
    assert.ok(!avant.devoilees.includes(id), id);
    assert.ok(!avant.silhouettes.some((x) => x.id === id), `${id} en silhouette`);
  }
  assert.ok(avant.devoilees.includes("pinces_forge"), "les pinces n'attendent pas l'enclume");
  assert.ok(!t.recus.some((m) => m.t === "devoilement" && m.texte && /lame|couteau|machette|hachette/i.test(m.texte)), "rien ne les nomme");
  // L'enclume posée (aucun fait noté : le suivi regarde le meuble chaque seconde).
  t.etat.installations = [...t.etat.installations, { type: "forge+enclume", niveau: 1 }];
  t.attendre(2);
  const apres = t.s.vue();
  for (const id of ["lame_forgee_fer", "machette_forgee_fer"]) assert.ok(apres.devoilees.includes(id) && t.s.estDevoilee(id), id);
  const dernier = t.recus.filter((m) => m.t === "devoilement").at(-1) as Extract<MessageServeur, { t: "devoilement" }>;
  assert.ok(dernier.nouvelles.includes("lame_forgee_fer"));
});

test("R26 : une partie 0.8.1 où l'on a forgé sur la pierre plate se relit : la lame reste au sac, sa carte attend l'enclume", () => {
  // L'état gardé d'une partie 0.8.1 : les lames dévoilées (et une encore « Nouveau »), un couteau ★ forgé, pas d'enclume.
  const ancienne: EtatProgression = { ...PROGRESSION_VIDE, devoilees: [...devoileesAuDepart(), "forge", "pinces_forge", "lame_forgee_fer", "machette_forgee_fer"], nonVues: ["machette_forgee_fer"] };
  const t = suivi({ installations: [...feu("foyer_pierres", 2), { type: "forge", niveau: 1 }], etat: progressionValide(JSON.parse(JSON.stringify(ancienne))) });
  t.etat.inventaire = { "lame_forgee#1": 1 };
  t.attendre(2);
  const v = t.s.vue();
  assert.ok(!v.devoilees.includes("lame_forgee_fer") && !v.devoilees.includes("machette_forgee_fer"));
  assert.ok(!v.nonVues.includes("machette_forgee_fer"), "pas de pastille pour une carte qui attend");
  assert.ok(v.devoilees.includes("pinces_forge"));
  assert.ok(!t.s.estDevoilee("lame_forgee_fer"), "le serveur refuse de la forger");
  // Rien n'est perdu : l'état gardé les a toujours ; l'enclume posée, elles reviennent (sans redire « Tu y penses »).
  assert.ok(t.s.etat.devoilees.includes("lame_forgee_fer"));
  t.etat.installations = [...t.etat.installations, { type: "forge+enclume", niveau: 1 }];
  t.attendre(2);
  const dernier = t.recus.filter((m) => m.t === "devoilement").at(-1) as Extract<MessageServeur, { t: "devoilement" }>;
  assert.ok(dernier.progression.devoilees.includes("lame_forgee_fer") && dernier.progression.devoilees.includes("machette_forgee_fer"));
  assert.ok(dernier.progression.nonVues.includes("machette_forgee_fer"), "la pastille « Nouveau » revient avec elle");
  assert.ok(t.s.estDevoilee("machette_forgee_fer"));
});

test("R26 : un Voltaïque 0.8.1 au banc sans panneau garde sa matraque, mais n'en fabrique pas d'autre avant le panneau", () => {
  const ancienne: EtatProgression = { ...PROGRESSION_VIDE, devoilees: [...devoileesAuDepart(), "banc_recharge", "matraque_fortune", "pack_cellules"] };
  const { joueur, infos, attendre, base, compte } = monter({
    famille: "voltaiques",
    inventaire: { sac_a_dos: 1, matraque_fortune: 1, appareil_photo_jetable: 1, gourdin: 1, ficelle: 1, petite_batterie: 1, couteau: 1, tournevis: 1 },
    avant: (b, id) => {
      b.sauverProgression(id, ancienne);
      b.ajouterInstallation(id, "banc_recharge", 21, 20, 0);
    },
  });
  joueur.position = { x: 20, z: 20, o: 0 };
  const v = joueur.bienvenue(0).progression!;
  assert.ok(!v.devoilees.includes("matraque_fortune") && v.devoilees.includes("pack_cellules") && v.devoilees.includes("banc_recharge"));
  assert.ok(!v.silhouettes.some((x) => x.id === "matraque_fortune" || x.id === "module_decharge" || x.id === "matraque_electrique"));
  joueur.recevoir({ t: "fabriquer", recette: "matraque_fortune" });
  assert.equal(infos().at(-1), "Tu n'y as pas encore pensé.");
  attendre(1);
  assert.equal((joueur as unknown as { inventaire: Record<string, number> }).inventaire.matraque_fortune, 1, "la matraque reste au sac");
  // Le panneau posé sur le banc : la carte revient.
  const banc = base.chargerInstallations(compte.id).find((i) => i.type === "banc_recharge")!;
  (joueur as unknown as { installations: Map<number, { etat: object }> }).installations.get(banc.id)!.etat = { ...banc.etat, panneau: true };
  attendre(2);
  assert.ok(joueur.bienvenue(0).progression!.devoilees.includes("matraque_fortune"));
});
