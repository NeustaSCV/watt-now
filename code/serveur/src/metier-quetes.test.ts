// 0.6, chantier 8 (Book 25 §9.4 et §10.3) : les quêtes « Le métier » 5 à 8 de chaque famille, les deux étapes de l'arc
// dans « S'installer », et ce qui les rend possibles seul : le Comptoir et l'échange acceptent enfin les exemplaires
// étoilés, l'étape 8 se valide au Comptoir, les faits « détruit à la décharge » et « tir à la tête » sont comptés.

import { test } from "node:test";
import assert from "node:assert/strict";
import { facteurPrix, prixAchat, prixAchatCle, prixAchatExemplaire, prixVenteCle, prixVente } from "../../commun/src/economie.ts";
import { nouvelEteint, type Eteint } from "../../commun/src/eteints.ts";
import { COMPTOIR, DUREE_VOYAGE_S, SORTIES_STATION, SORTIE_TERRAIN, type Zone } from "../../commun/src/lieux.ts";
import type { MessageServeur, OperationEchange, ProjectileVu } from "../../commun/src/messages.ts";
import { estObjet, type Inventaire } from "../../commun/src/objets.ts";
import { QUETES } from "../../commun/src/quetes.ts";
import { NOMS_INSTALLATIONS } from "../../commun/src/recettes.ts";
import type { Famille } from "../../commun/src/regles.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { messageValide } from "./controle.ts";
import { Echanges } from "./echange.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { SuiviQuetes } from "./quetes.ts";
import { Tir, type ContexteTir } from "./tir.ts";

/** Les quatre étapes d'avant la 0.6, déjà faites (on commence à l'étape 5). */
const ETAPES_0_5: Record<Famille, string[]> = {
  charbonniers: ["charbonniere", "charbon", "lame", "vendre_lame"],
  voltaiques: ["panneau_trouve", "panneau_pose", "charge", "depot_volt"],
  mecanistes: ["meule", "affuter", "dynamo", "depot_meca"],
};

/** Un joueur sur son terrain, ses quatre premières étapes faites ; il peut aller au guichet ou à la station. */
function monter(famille: Famille, inventaire: Inventaire, avant?: (base: Base, compteId: number) => void) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", famille);
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
  avant?.(base, compte.id);
  let instant = 1_000_000;
  const halte = new Halte(base, () => 0.5);
  halte.eteints = [];
  const comptoir = new Comptoir(base, instant);
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 0.5, comptoir);
  joueur["quetes"].etat.finies.push(...ETAPES_0_5[famille]);
  const attendre = (secondes: number, pas = 0.25) => {
    for (let s = 0; s < secondes - 1e-9; s += pas) {
      instant += pas * 1000;
      halte.tick(instant, pas);
      joueur.tick(pas);
    }
  };
  const carnet = () => recus.findLast((m) => m.t === "quetes") as Extract<MessageServeur, { t: "quetes" }> | undefined;
  const metier = () => carnet()?.quetes?.quetes.find((q) => q.ligne === "metier");
  const reussies = () => recus.flatMap((m) => (m.t === "quetes" ? (m.quetes?.reussies ?? []).map((r) => r.titre) : []));
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const voyager = (vers: "station" | "comptoir", depuis: { x: number; z: number }) => {
    joueur.position = { x: depuis.x, z: depuis.z, o: 0 };
    joueur.recevoir({ t: "voyager", vers });
    attendre(DUREE_VOYAGE_S + 0.5, 0.5);
  };
  const allerAuGuichet = () => {
    voyager("comptoir", SORTIE_TERRAIN.boite);
    voyager("comptoir", SORTIES_STATION[1]!.boite);
    joueur.position = { x: COMPTOIR.guichet.x, z: COMPTOIR.guichet.z + 0.8, o: Math.PI };
  };
  return { base, compte, joueur, halte, comptoir, attendre, carnet, metier, reussies, dernier, voyager, allerAuGuichet, recus };
}

// ---------- Le carnet ----------

test("0.6 carnet : quatre étapes de plus par famille, et deux pour l'arc dans « S'installer » ; récompenses 20, 25, 30, 40", () => {
  for (const famille of ["charbonniers", "voltaiques", "mecanistes"] as const) {
    const metier = QUETES.filter((q) => q.ligne === "metier" && q.famille === famille);
    assert.equal(metier.length, 8, famille);
    assert.deepEqual(metier.slice(4).map((q) => q.recompense?.wotts), [20, 25, 30, 40], famille);
    // Les touches s'écrivent {action} ; les textes restent courts (le carnet tient sur un téléphone).
    for (const q of metier) assert.ok(q.texte.length <= 130, `${q.id} : ${q.texte.length} caractères`);
    for (const q of metier) assert.ok(q.lecon.length <= 90, `${q.id} (leçon) : ${q.lecon.length} caractères`);
  }
  const installer = QUETES.filter((q) => q.ligne === "installer").map((q) => q.id);
  assert.ok(installer.indexOf("premier_arc") === installer.indexOf("defense") + 1, "l'arc après « De quoi se défendre »");
  assert.ok(installer.indexOf("tir_plein") === installer.indexOf("premier_arc") + 1);
  assert.deepEqual(QUETES.find((q) => q.id === "premier_arc")!.recompense?.objets, { fleche_os: 3 });
  assert.equal(new Set(QUETES.map((q) => q.id)).size, QUETES.length, "des identifiants uniques");
  // Chaque étape du métier a son icône : un objet du sac, ou une installation.
  for (const q of QUETES.filter((x) => x.ligne === "metier" || x.id === "premier_arc" || x.id === "tir_plein")) {
    assert.ok(q.icone && (estObjet(q.icone) || Object.hasOwn(NOMS_INSTALLATIONS, q.icone)), `${q.id} : icône ${q.icone}`);
  }
});

test("0.6 carnet : un objet de métier compte toutes étoiles confondues, au-dessus du seuil s'il y en a un", () => {
  const suivi = new SuiviQuetes({ faits: {}, finies: [], primes: 0 });
  const j = (inventaire: Inventaire) => ({ famille: "charbonniers" as const, inventaire, charges: {}, installations: [] });
  const c = { a: "objet" as const, types: ["machette_forgee" as const], n: 1, etoiles: 2 };
  assert.equal(suivi.avancement(c, j({ "machette_forgee#1": 1 })).fait, 0, "★ : pas assez");
  assert.equal(suivi.avancement(c, j({ "machette_forgee#2": 1 })).fait, 1);
  assert.equal(suivi.avancement(c, j({ machette_forgee: 1 })).fait, 1, "la clé nue est ★★★");
  assert.equal(suivi.avancement({ a: "objet", types: ["lame_forgee"], n: 2 }, j({ lame_forgee: 1, "lame_forgee#2": 1 })).fait, 2);
  suivi.noter("vente:carreau", 3);
  suivi.noter("don_autre_famille:carreau_acier", 4);
  assert.deepEqual(suivi.avancement({ a: "faits", faits: ["vente:carreau", "don_autre_famille:carreau_acier"], but: 8 }, j({})), { fait: 7, but: 8 });
});

// ---------- 🔥 Charbonniers ----------

test("0.6 🔥 : pinces, trempe ★★, mise d'acier ; une machette ★ ne suffit pas pour « La trempe »", () => {
  const t = monter("charbonniers", { pinces_forge: 1, "machette_forgee#1": 1 });
  t.attendre(1);
  assert.ok(t.reussies().includes("Les pinces"));
  assert.equal(t.metier()?.titre, "La trempe");
  const u = monter("charbonniers", { pinces_forge: 1, "machette_forgee#2": 1, hachette: 2 });
  u.attendre(1);
  assert.deepEqual(u.reussies().filter((r) => ["Les pinces", "La trempe", "La mise d'acier"].includes(r)), ["Les pinces", "La trempe", "La mise d'acier"]);
  assert.equal(u.metier()?.titre, "Le fournisseur");
});

test("0.6 🔥 « Le fournisseur » : seul sur le serveur, une machette ★★ vendue au Comptoir, à son prix d'étoiles", () => {
  const t = monter("charbonniers", { "machette_forgee#2": 1, pinces_forge: 1, hachette: 1 });
  t.attendre(1);
  assert.equal(t.metier()?.titre, "Le fournisseur");
  t.allerAuGuichet();
  t.attendre(0.5);
  const avant = t.dernier("wotts")!.wotts.poche;
  const op = { t: "comptoir" as const, op: { genre: "vendre" as const, objet: "machette_forgee#2" as const, quantite: 1 } };
  assert.ok(messageValide(op), "le contrôle laisse passer un exemplaire étoilé");
  t.joueur.recevoir(op);
  t.attendre(1);
  assert.ok(t.reussies().includes("Le fournisseur"));
  // ★★ : trois quarts du prix d'une ★★★ (elle ne dure que les trois quarts du temps).
  const prix = prixAchatCle("machette_forgee#2", false)!;
  assert.ok(Math.abs(prix - Math.round(prixAchat("machette_forgee", false)! * 0.75 * 10) / 10) < 1e-9);
  assert.ok(Math.abs(t.dernier("wotts")!.wotts.poche - (avant + prix)) < 0.05);
  // Elle entre en stock telle quelle, et se rachète au prix d'une ★★.
  assert.equal(t.comptoir.stock["machette_forgee#2"], 1);
  assert.equal(t.comptoir.stock.machette_forgee, undefined, "pas de ★★ changée en ★★★");
});

test("0.6 le Comptoir : prix des étoiles, exemplaires rachetés, clés mal formées refusées", () => {
  assert.equal(facteurPrix("pierre"), 1);
  assert.equal(facteurPrix("machette_forgee"), 1);
  assert.equal(facteurPrix("machette_forgee#5"), 2);
  assert.equal(facteurPrix("machette_forgee#1"), 0.5);
  // La machette de fortune est ★ de base : sa clé nue garde son prix.
  assert.equal(facteurPrix("machette"), 1);
  assert.equal(prixVenteCle("machette_forgee"), prixVente("machette_forgee"));
  assert.equal(prixAchatExemplaire(null, "machette_forgee#4"), null);
  assert.equal(messageValide({ t: "comptoir", op: { genre: "vendre", objet: "machette_forgee#3", quantite: 1 } } as never), false, "★★★ s'écrit sans suffixe");
  assert.equal(messageValide({ t: "comptoir", op: { genre: "vendre", objet: "pierre#2", quantite: 1 } } as never), false, "une pierre n'a pas d'étoiles");

  const t = monter("mecanistes", {});
  t.comptoir.entrerEnStock("arbalete#2", 1);
  t.allerAuGuichet();
  t.joueur["poche"] = { valeur: 500, majLe: t.joueur["maintenant"]() };
  t.joueur.recevoir({ t: "comptoir", op: { genre: "acheter", objet: "arbalete#2", quantite: 1 } });
  t.attendre(0.5);
  assert.equal(t.dernier("inventaire")!.inventaire["arbalete#2"], 1);
  assert.equal(t.comptoir.stock["arbalete#2"], undefined);
});

// ---------- ⚡ Voltaïques ----------

test("0.6 ⚡ : pack, puis « La Raquette » demande la matraque et un Éteint éteint à la décharge ; l'alarme électrique ensuite", () => {
  const t = monter("voltaiques", { pack_cellules: 1, matraque_electrique: 1 });
  t.attendre(1);
  assert.ok(t.reussies().includes("Du courant en poche"));
  const q = t.metier()!;
  assert.equal(q.titre, "La Raquette");
  assert.deepEqual(q.objectifs.map((o) => [o.fait, o.but]), [[1, 1], [0, 1]]);
  // Une vraie décharge, à la station : une courte le raidit, une longue l'éteint.
  t.voyager("station", SORTIE_TERRAIN.boite);
  const e: Eteint = nouvelEteint(9, 40, 35.6, "poursuivant");
  t.halte.eteints = [e];
  for (const appuye of [false, true]) {
    t.joueur.position = { x: 40, z: 34.6, o: 0 };
    t.joueur.recevoir({ t: "frapper", appuye });
    t.attendre(appuye ? 1.5 : 0.6, 0.05);
  }
  assert.equal(e.etat, "detruit");
  assert.equal(t.joueur["quetes"].etat.faits["detruit:electrique"], 1);
  t.attendre(1);
  assert.ok(t.reussies().includes("La Raquette"));
  assert.equal(t.metier()?.titre, "Prévenu sans bruit");
});

test("0.6 ⚡ : un pack donné à un Mécaniste compte pour « Le courant chez les autres », pas à un autre Voltaïque", () => {
  const base = new Base(":memory:");
  const instant = 1_000_000;
  const halte = new Halte(base);
  const comptoir = new Comptoir(base, instant);
  const creer = (pseudo: string, famille: Famille, inv: Inventaire, x: number) => {
    const compte = base.creerCompte(pseudo, "potager42", famille);
    base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inv });
    base.sauverPosition(compte.id, { x, z: 20, o: 0 }, "comptoir", instant);
    const recus: MessageServeur[] = [];
    const j = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 1, comptoir);
    j.position = { x, z: 20, o: 0 };
    return { j, recus };
  };
  const volt = creer("Ampère", "voltaiques", { pack_cellules: 2 }, 20);
  const meca = creer("Malo", "mecanistes", {}, 21.5);
  const autreVolt = creer("Lou", "voltaiques", {}, 22);
  const joueurs = new Map([volt, meca, autreVolt].map((x) => [x.j.compte.id, x.j]));
  const echanges = new Echanges((id) => joueurs.get(id));
  const echanger = (a: Joueur, b: Joueur, objets: Inventaire) => {
    const op = (qui: Joueur, o: OperationEchange) => echanges.traiter(qui, o);
    op(a, { genre: "proposer", a: b.compte.id });
    op(b, { genre: "repondre", accepte: true });
    op(a, { genre: "offrir", offre: { objets, wotts: 0 } });
    op(a, { genre: "accord", oui: true });
    op(b, { genre: "accord", oui: true });
  };
  // À un autre Voltaïque : ça ne compte pas pour l'étape.
  autreVolt.j.position = { x: 21.5, z: 20, o: 0 };
  meca.j.position = { x: 40, z: 20, o: 0 };
  echanger(volt.j, autreVolt.j, { pack_cellules: 1 });
  assert.equal(volt.j["quetes"].etat.faits["echange"], 1);
  assert.equal(volt.j["quetes"].etat.faits["don_autre_famille:pack_cellules"], undefined);
  // À un Mécaniste : oui.
  autreVolt.j.position = { x: 40, z: 25, o: 0 };
  meca.j.position = { x: 21.5, z: 20, o: 0 };
  echanger(volt.j, meca.j, { pack_cellules: 1 });
  assert.equal(volt.j["quetes"].etat.faits["don_autre_famille:pack_cellules"], 1);
  assert.equal(meca.j["quetes"].etat.faits["don_autre_famille:pack_cellules"], undefined, "celui qui reçoit n'a rien donné");
  const suivi = volt.j["quetes"] as SuiviQuetes;
  suivi.etat.finies.push(...ETAPES_0_5.voltaiques, "pack", "raquette", "alarme_electrique");
  const reussies = suivi.verifier({ famille: "voltaiques", inventaire: {}, charges: {}, installations: [] });
  assert.deepEqual(reussies.map((q) => q.id), ["courant_autres"]);
});

test("0.6 ⚡ : une alarme électrique posée sur le terrain valide « Prévenu sans bruit »", () => {
  const t = monter("voltaiques", {}, (base, id) => base.ajouterInstallation(id, "alarme_electrique", 20, 24, 0));
  t.joueur["quetes"].etat.finies.push("pack", "raquette");
  t.attendre(1);
  assert.ok(t.reussies().includes("Prévenu sans bruit"));
  assert.equal(t.metier()?.titre, "Le courant chez les autres");
});

// ---------- ⚙️ Mécanistes, et l'arc pour tous ----------

/** Un tireur en mémoire (comme dans tir.test.ts), qui note ses faits. */
function tireur(inventaire: Inventaire, eteints: Eteint[]) {
  const OUVERT: Zone = { xMin: 0, xMax: 100, zMin: 0, zMax: 100, obstacles: [] };
  let instant = 1_000_000;
  const faits: string[] = [];
  const recus: MessageServeur[] = [];
  const inv = { ...inventaire } as Inventaire;
  const ctx: ContexteTir = {
    id: 3,
    maintenant: () => instant,
    alea: () => 0.9,
    position: () => ({ x: 50, z: 30, o: 0 }),
    orienter: () => {},
    lieu: () => "station",
    zone: () => OUVERT,
    eteints: () => eteints,
    inventaire: () => inv,
    retirer: (cle, n) => {
      inv[cle] = (inv[cle] ?? 0) - n;
      if (!inv[cle]) delete inv[cle];
    },
    poserAuSol: () => {},
    saisi: () => false,
    empeche: () => null,
    endurance: () => 100,
    depenser: () => {},
    info: () => {},
    indice: () => {},
    envoyer: (m) => recus.push(m),
    diffuser: (m) => recus.push(m),
    user: () => {},
    apresDestruction: () => {},
    commencer: () => {},
    noter: (f) => faits.push(f),
  };
  const tir = new Tir(ctx);
  const projectiles = () => recus.filter((m) => m.t === "projectile").map((m) => (m as { projectile: ProjectileVu }).projectile);
  return { tir, faits, projectiles, attendre: (ms: number) => (instant += ms) };
}

const devant = (id: number, d: number) => nouvelEteint(id, 50, 30 + d, "poursuivant", Math.PI);

test("0.6 ⚙️ et l'arc : un carreau ou une flèche qui détruit à la tête est noté ; au torse, rien", () => {
  const a = tireur({ arbalete: 1, carreau: 2 }, [devant(1, 10)]);
  a.tir.preparer("arbalete");
  a.tir.bander();
  a.tir.lancer(0, 1, 1);
  assert.equal(a.projectiles()[0]!.coup?.resultat, "detruit");
  assert.deepEqual(a.faits, ["tete:carreau"]);

  const b = tireur({ arc_simple: 1, fleche_os: 2 }, [devant(1, 5)]);
  b.tir.preparer("arc_simple");
  b.tir.bander();
  b.attendre(1600);
  b.tir.lancer(0, 1, 1);
  assert.equal(b.projectiles()[0]!.coup?.resultat, "detruit");
  assert.deepEqual(b.faits, ["tete:fleche"]);

  // Trop loin pour la tête (à 9 m, l'arc ★★★ s'arrête à 6) : le torse, et aucun fait.
  const c = tireur({ arc_simple: 1, fleche_os: 2 }, [devant(1, 9)]);
  c.tir.preparer("arc_simple");
  c.tir.bander();
  c.attendre(1600);
  c.tir.lancer(0, 1, 1);
  assert.notEqual(c.projectiles()[0]!.coup?.resultat, "detruit");
  assert.deepEqual(c.faits, []);
});

test("0.6 ⚙️ : arbalète, carreau à la tête, piège posé, puis 8 carreaux vendus au Comptoir", () => {
  const t = monter("mecanistes", { arbalete: 1, carreau: 8 }, (base, id) => base.ajouterInstallation(id, "assommoir", 20, 24, 0));
  t.attendre(1);
  assert.ok(t.reussies().includes("Le bois qui plie"));
  assert.equal(t.metier()?.titre, "Le carreau");
  t.joueur["quetes"].noter("tete:carreau");
  t.attendre(1);
  assert.ok(t.reussies().includes("Le carreau"));
  assert.ok(t.reussies().includes("Les mâchoires"), "l'assommoir posé compte");
  assert.equal(t.metier()?.titre, "Le carquois des autres");
  t.allerAuGuichet();
  t.joueur.recevoir({ t: "comptoir", op: { genre: "vendre", objet: "carreau", quantite: 5 } });
  t.attendre(1);
  assert.deepEqual(t.metier()?.objectifs.map((o) => [o.fait, o.but]), [[5, 8]]);
  t.joueur.recevoir({ t: "comptoir", op: { genre: "vendre", objet: "carreau", quantite: 3 } });
  t.attendre(1);
  assert.ok(t.reussies().includes("Le carquois des autres"));
  // Le métier est fini : plus rien dans la ligne.
  assert.equal(t.metier(), undefined);
});

test("0.6 S'installer : « Le premier arc » donne 3 flèches d'os, « Tir plein » se valide d'une flèche à la tête", () => {
  const suivi = new SuiviQuetes({ faits: {}, finies: [], primes: 0 });
  const installer = QUETES.filter((q) => q.ligne === "installer").map((q) => q.id);
  suivi.etat.finies.push(...installer.slice(0, installer.indexOf("premier_arc")));
  const j = { famille: "charbonniers" as const, inventaire: { "arc_fortune": 1 } as Inventaire, charges: {}, installations: [] };
  assert.deepEqual(suivi.verifier(j).map((q) => q.id), ["premier_arc"]);
  suivi.noter("tete:fleche");
  assert.deepEqual(suivi.verifier(j).map((q) => q.id), ["tir_plein"]);
});
