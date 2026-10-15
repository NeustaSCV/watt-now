// Le compte admin « god » (outil du porteur, 0.7) : un seul admin, le pseudo réservé, l'écrasement d'un « god »
// existant, le terrain monté, les coffres remplis depuis les catalogues, l'invincibilité, les recettes de toutes les
// familles, et les gestes admin refusés à tout autre compte.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { pseudoReserve } from "../../commun/src/admin.ts";
import { apparenceValide } from "../../commun/src/apparence.ts";
import type { Sante } from "../../commun/src/combat.ts";
import { ARMES } from "../../commun/src/combat.ts";
import { raisonEmplacement } from "../../commun/src/emplacement.ts";
import { cleExemplaire, compter, estObjetDeMetier } from "../../commun/src/etoiles.ts";
import { capaciteCoffre } from "../../commun/src/lignees.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { OBJETS, poidsInventaire, type Inventaire, type TypeObjet } from "../../commun/src/objets.ts";
import { RECETTES } from "../../commun/src/recettes.ts";
import { POINT_ARRIVEE } from "../../commun/src/regles.ts";
import { MUNITIONS } from "../../commun/src/tir.ts";
import { Base, PseudoReserve } from "./base.ts";
import { installationsConstructibles, preparerGod, remplirCoffres } from "./admin.ts";
import { Comptoir } from "./comptoir.ts";
import { messageValide } from "./controle.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { rendreSilencieux } from "./journal.ts";
import { demarrerServeur } from "./serveur.ts";

rendreSilencieux(true);

/** Un joueur en mémoire, avec les messages qu'il reçoit et une horloge qu'on avance. */
function ouvrir(base: Base, compteId: number, pseudo: string, famille: "charbonniers" | "voltaiques" | "mecanistes") {
  let instant = 10_000_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur({ id: compteId, pseudo, famille }, base, (m) => recus.push(m), () => instant, new Halte(base), () => 0.99, new Comptoir(base, instant));
  const attendre = (secondes: number) => {
    for (let s = 0; s < secondes * 10; s++) {
      instant += 100;
      joueur.tick(0.1);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  return { joueur, recus, attendre, dernier };
}

const contenuDesCoffres = (base: Base, id: number): Inventaire => {
  const total: Inventaire = {};
  for (const c of base.chargerInstallations(id).filter((i) => i.type === "coffre")) for (const [k, n] of Object.entries(c.etat.contenu ?? {})) total[k as TypeObjet] = (total[k as TypeObjet] ?? 0) + (n ?? 0);
  return total;
};

test("le pseudo « god » est réservé, avec ses variantes évidentes", () => {
  for (const p of ["god", "God", "GOD", "g0d", "G0D", "g o d", " god ", "G-o-d", "g_o_d", "gοd", "gód", "6od", "g.o.d"]) assert.ok(pseudoReserve(p), p);
  for (const p of ["Godefroy", "good", "dog", "Gaston", "go", "godin"]) assert.ok(!pseudoReserve(p), p);
  const base = new Base(":memory:");
  assert.throws(() => base.creerCompte("God", "olympe42", "mecanistes"), PseudoReserve);
  assert.throws(() => base.creerCompte("g0d", "olympe42", "mecanistes"), PseudoReserve);
  // Seule la commande admin le crée.
  assert.equal(base.creerCompte("god", "olympe42", "mecanistes", false, null, true).pseudo, "god");
});

test("l'inscription refuse « god » et ses variantes ; l'étape du pseudo aussi", async () => {
  const dossier = join(import.meta.dirname, "..", "donnees", "essais-admin");
  mkdirSync(dossier, { recursive: true });
  const cheminBase = join(dossier, `inscription-${process.pid}.sqlite`);
  const serveur = await demarrerServeur({ port: 0, hote: "127.0.0.1", cheminBase });
  try {
    const poster = async (chemin: string, corps: unknown) => {
      const r = await fetch(`http://127.0.0.1:${serveur.port}${chemin}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
      return { statut: r.status, corps: (await r.json()) as Record<string, unknown> };
    };
    for (const pseudo of ["god", "God", "g0d", "G o d"]) {
      const r = await poster("/api/inscription", { pseudo, motDePasse: "olympe42", famille: "charbonniers" });
      assert.equal(r.statut, 409, pseudo);
      assert.equal(r.corps.erreur, "Ce pseudo est réservé.");
      const l = await poster("/api/pseudo", { pseudo });
      assert.equal(l.corps.libre, false, pseudo);
    }
    assert.equal((await poster("/api/inscription", { pseudo: "Godefroy", motDePasse: "olympe42", famille: "charbonniers" })).statut, 201);
  } finally {
    await serveur.fermer();
    rmSync(dossier, { recursive: true, force: true });
  }
});

test("un seul admin, garanti par la base : en désigner un autre retire l'ancien", () => {
  const dossier = join(import.meta.dirname, "..", "donnees", "essais-admin-unique");
  mkdirSync(dossier, { recursive: true });
  const chemin = join(dossier, `admin-${process.pid}.sqlite`);
  try {
    const base = new Base(chemin);
    const a = base.creerCompte("Nadia", "enclume42", "charbonniers");
    const b = base.creerCompte("Malik", "cable4242", "voltaiques");
    assert.equal(base.admin(), null);
    base.designerAdmin(a.id);
    assert.ok(base.estAdmin(a.id));
    base.designerAdmin(b.id);
    assert.ok(base.estAdmin(b.id));
    assert.ok(!base.estAdmin(a.id), "l'ancien admin ne l'est plus");
    assert.equal(base.admin(), b.id);
    // Même en écrivant directement dans la base, une deuxième ligne est refusée.
    const brut = new DatabaseSync(chemin);
    assert.throws(() => brut.prepare("INSERT INTO admin (seul, compte_id) VALUES (2, ?)").run(a.id));
    assert.throws(() => brut.prepare("INSERT INTO admin (seul, compte_id) VALUES (1, ?)").run(a.id));
    assert.equal((brut.prepare("SELECT COUNT(*) AS n FROM admin").get() as { n: number }).n, 1);
    brut.close();
    base.fermer();
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
});

test("la commande crée god : admin, terrain monté sans chevauchement, coffres remplis depuis les catalogues", () => {
  const base = new Base(":memory:");
  const r = preparerGod(base, "olympe42", undefined, 1000);
  assert.ok(r.cree && !r.ecrase);
  assert.ok(base.estAdmin(r.compte.id));
  assert.equal(base.verifierIdentifiants("god", "olympe42")?.id, r.compte.id);
  const id = r.compte.id;
  const installations = base.chargerInstallations(id);
  for (const type of installationsConstructibles()) assert.ok(installations.some((i) => i.type === type), `une construction ${type}`);
  assert.deepEqual(r.terrain.sansPlace, []);
  // Les foyers : les six formes jouables (feu de camp, pierres, cuisine, Dakota, poêle-fusée ; le four de terre, 0.10).
  const feux = base.chargerFeux(id);
  assert.equal(feux.length, 6);
  // Aucune construction ne gêne les autres selon les règles de pose du jeu (l'escabeau, qu'on déplace, compris).
  for (const i of installations) {
    const autres = installations.filter((x) => x.id !== i.id);
    if (i.type !== "decharge") assert.equal(raisonEmplacement("installation", i.x, i.z, i, feux, autres, i.type), null, `${i.type} en ${i.x},${i.z}`);
    for (const x of autres) assert.ok(Math.hypot(x.x - i.x, x.z - i.z) >= 1.2, `${i.type} et ${x.type} se touchent`);
  }
  for (const f of feux) assert.equal(raisonEmplacement("feu", f.x, f.z, f, feux.filter((x) => x.id !== f.id), installations), null);
  // Rien sur son point d'arrivée.
  for (const p of [...installations, ...feux]) assert.ok(Math.hypot(p.x - POINT_ARRIVEE.x, p.z - POINT_ARRIVEE.z) >= 2.5);
  // Les coffres : la capacité respectée ; toutes les armes en ★, ★★, ★★★ ; les flèches et carreaux ; tout le catalogue.
  const coffres = installations.filter((i) => i.type === "coffre");
  assert.ok(coffres.length >= 2);
  for (const c of coffres) assert.ok(poidsInventaire(c.etat.contenu ?? {}) <= capaciteCoffre(c) + 1e-6, "coffre trop plein");
  const total = contenuDesCoffres(base, id);
  for (const a of ARMES) {
    if (!a.objet) continue;
    if (estObjetDeMetier(a.objet)) for (const e of [1, 2, 3]) assert.ok((total[cleExemplaire(a.objet, e)] ?? 0) >= 1, `${a.objet} ${e}★`);
    else assert.ok((total[a.objet] ?? 0) >= 1, a.objet);
  }
  for (const m of MUNITIONS) assert.ok((total[m.objet] ?? 0) >= 50, m.objet);
  for (const t of Object.keys(OBJETS) as TypeObjet[]) assert.ok(compter(total, t) >= 3, `${t} dans les coffres`);
  for (const rec of RECETTES) for (const [t, n] of Object.entries(rec.ingredients)) assert.ok(compter(total, t as TypeObjet) >= (n ?? 0), `${rec.id} : ${t}`);
  // Re-remplir est idempotent : même nombre de coffres, même contenu.
  remplirCoffres(base, id);
  assert.deepEqual(contenuDesCoffres(base, id), total);
  assert.equal(base.chargerInstallations(id).filter((i) => i.type === "coffre").length, coffres.length);
});

test("un « god » déjà inscrit est écrasé : nouveau mot de passe, jetons effacés, personnage neuf, admin", () => {
  const base = new Base(":memory:");
  // Comme sur le serveur en ligne : « god » créé avant la règle, par l'inscription.
  const ancien = base.creerCompte("god", "ancien42", "mecanistes", true, null, true);
  const jeton = base.creerJeton(ancien.id);
  base.sauverInventaire(ancien.id, { pierre: 7 });
  base.ajouterInstallation(ancien.id, "abri", 20, 20, 0);
  // Des déchets déjà pris, sur son terrain et dans sa Coopérative.
  base.sauverDechets(`terrain:${ancien.id}`, "1,1", 0, [0], 0);
  base.sauverDechets(`cooperative:${ancien.id}`, "2,2", 0, [0, 1], 5000);
  const autre = base.creerCompte("Rose", "potager42", "mecanistes");
  base.designerAdmin(autre.id);
  const r = preparerGod(base, "olympe42", undefined, 1000);
  assert.ok(r.ecrase && !r.cree);
  assert.equal(r.compte.id, ancien.id, "le même compte");
  assert.equal(r.compte.famille, "mecanistes", "sa famille est gardée");
  assert.equal(base.verifierIdentifiants("god", "ancien42"), null, "l'ancien mot de passe ne marche plus");
  assert.equal(base.verifierIdentifiants("GOD", "olympe42")?.id, ancien.id);
  assert.equal(base.compteParJeton(jeton), null, "il faut se reconnecter");
  assert.equal(base.chargerTutoriel(ancien.id), null, "pas de tutoriel");
  assert.equal(base.chargerInventaire(ancien.id).pierre, undefined, "l'ancien sac est parti");
  assert.ok(!base.chargerInstallations(ancien.id).some((i) => i.type === "abri" && i.x === 20 && i.z === 20), "l'ancien terrain est parti");
  assert.ok(base.estAdmin(ancien.id) && !base.estAdmin(autre.id), "god est le seul admin");
  assert.deepEqual(base.chargerDechets(`terrain:${ancien.id}`), [], "les déchets de son terrain sont à neuf");
  assert.deepEqual(base.chargerDechets(`cooperative:${ancien.id}`), [], "ceux de sa Coopérative aussi");
  // Une deuxième fois : toujours un seul compte god, toujours admin.
  preparerGod(base, "olympe43", undefined, 1000);
  assert.equal(base.verifierIdentifiants("god", "olympe43")?.id, ancien.id);
  assert.equal(base.nombreComptes(), 2);
});

test("god porte la toge (les autres la voient) ; jamais un autre, jamais venue du client", () => {
  const base = new Base(":memory:");
  const god = preparerGod(base, "olympe42", undefined, 1000).compte;
  const rose = base.creerCompte("Rose", "potager42", "mecanistes");
  const g = ouvrir(base, god.id, "god", god.famille);
  const r = ouvrir(base, rose.id, "Rose", "mecanistes");
  assert.equal(g.joueur.vu.apparence.toge, true);
  assert.equal(g.joueur.bienvenue(0).moi.apparence.toge, true);
  assert.deepEqual(g.joueur.bienvenue(0).moi.admin, { invincible: true });
  assert.equal(r.joueur.vu.apparence.toge, undefined);
  assert.equal(r.joueur.bienvenue(0).moi.admin, undefined);
  assert.equal(apparenceValide({ toge: true }, "mecanistes").toge, undefined, "un client ne se met pas la toge");
});

test("invincible : ni dégâts, ni faim, ni soif, ni fatigue ; désactivé, il peut mourir", () => {
  const base = new Base(":memory:");
  const god = preparerGod(base, "olympe42", undefined, 1000).compte;
  const t = ouvrir(base, god.id, "god", god.famille);
  const prive = t.joueur as unknown as { sante: Sante; besoins: { kcal: number; eau: number; repos: number } };
  prive.sante = { ...prive.sante, points: 2, saignement: "fort" };
  prive.besoins = { kcal: 10, eau: 0.01, repos: 0.05 };
  t.attendre(30);
  assert.equal(prive.sante.points, 100);
  assert.equal(prive.sante.saignement, "aucun");
  assert.ok(prive.besoins.kcal > 2000 && prive.besoins.eau > 1.4 && prive.besoins.repos === 1);
  assert.equal(t.dernier("effondrement"), undefined);
  // Désactivé dans ⚙ : il redevient mortel.
  t.joueur.recevoir({ t: "admin", op: { genre: "invincible", oui: false } });
  assert.deepEqual(t.dernier("admin")?.admin, { invincible: false });
  assert.equal(base.adminInvincible(god.id), false, "gardé en base");
  prive.sante = { ...prive.sante, points: 1, saignement: "fort" };
  t.attendre(10);
  assert.ok(t.dernier("effondrement"), "il s'effondre");
});

test("god voit et fabrique les recettes des quatre familles, sans dévoilement ni surcoût", () => {
  const base = new Base(":memory:");
  const god = preparerGod(base, "olympe42", "charbonniers", 1000).compte;
  base.sauverInventaire(god.id, { sac_a_dos: 1, couteau: 1, cellule_lithium: 3, fil_cuivre: 1, ficelle: 1 });
  // Le pack de cellules se monte au banc de recharge (son lieu, plan 0.8).
  base.ajouterInstallation(god.id, "banc_recharge", 6, 45, 0);
  const t = ouvrir(base, god.id, "god", "charbonniers");
  const b = t.joueur.bienvenue(0);
  for (const r of RECETTES) assert.ok(b.progression!.devoilees.includes(r.id), `${r.id} dévoilée`);
  assert.deepEqual(new Set(b.savoir!.manuels), new Set(["charbonniers", "voltaiques", "mecanistes"]));
  // Le pack de cellules est une recette voltaïque : au prix normal (3 cellules, pas 5).
  t.joueur.position = { x: 5, z: 45, o: 0 };
  t.joueur.recevoir({ t: "fabriquer", recette: "pack_cellules" });
  t.attendre(60);
  assert.equal(t.dernier("inventaire")?.inventaire.pack_cellules, 1);
});

test("les gestes admin sont refusés à tout autre compte (et un joueur ne voit pas les recettes cachées)", () => {
  const base = new Base(":memory:");
  preparerGod(base, "olympe42", undefined, 1000);
  const rose = base.creerCompte("Rose", "potager42", "mecanistes");
  base.sauverInventaire(rose.id, { sac_a_dos: 1, couteau: 1, cellule_lithium: 5, fil_cuivre: 2, ficelle: 2 });
  const t = ouvrir(base, rose.id, "Rose", "mecanistes");
  const avant = base.chargerInstallations(rose.id).length;
  t.joueur.recevoir({ t: "admin", op: { genre: "invincible", oui: true } });
  t.joueur.recevoir({ t: "admin", op: { genre: "remplir" } });
  t.joueur.recevoir({ t: "admin", op: { genre: "aller", vers: "cooperative" } });
  t.attendre(1);
  assert.equal(t.dernier("admin"), undefined);
  assert.equal(base.adminInvincible(rose.id), false);
  assert.equal(base.chargerInstallations(rose.id).length, avant, "pas de coffres posés");
  assert.equal(t.joueur.lieu, "terrain", "pas de voyage instantané");
  assert.ok(!base.estAdmin(rose.id));
  // Elle n'a pas le manuel voltaïque : la recette lui reste fermée.
  t.joueur.recevoir({ t: "fabriquer", recette: "pack_cellules" });
  t.attendre(30);
  assert.equal(t.dernier("inventaire")?.inventaire.pack_cellules, undefined);
  // Un message admin mal formé n'arrive même pas jusqu'au joueur.
  assert.ok(messageValide({ t: "admin", op: { genre: "aller", vers: "station" } }));
  assert.ok(!messageValide({ t: "admin", op: { genre: "aller", vers: "olympe" } }));
  assert.ok(!messageValide({ t: "admin", op: { genre: "devenir_admin" } }));
  assert.ok(!messageValide({ t: "admin", op: { genre: "invincible", oui: "oui" } }));
});

test("« Aller à… » : god arrive tout de suite, chez lui au camp ; « Remplir mes coffres » les remplit", () => {
  const base = new Base(":memory:");
  const god = preparerGod(base, "olympe42", undefined, 1000).compte;
  const t = ouvrir(base, god.id, "god", god.famille);
  t.joueur.recevoir({ t: "admin", op: { genre: "aller", vers: "cooperative" } });
  assert.equal(t.joueur.lieu, "cooperative");
  assert.equal(t.dernier("bienvenue")?.lieu, "cooperative");
  t.joueur.recevoir({ t: "admin", op: { genre: "aller", vers: "comptoir" } });
  assert.equal(t.joueur.lieu, "comptoir");
  t.joueur.recevoir({ t: "admin", op: { genre: "aller", vers: "terrain" } });
  assert.equal(t.joueur.lieu, "terrain");
  assert.deepEqual({ x: t.joueur.position.x, z: t.joueur.position.z }, { x: POINT_ARRIVEE.x, z: POINT_ARRIVEE.z });
  // On vide un coffre, puis ⚙ → Remplir mes coffres.
  const coffre = base.chargerInstallations(god.id).find((i) => i.type === "coffre")!;
  base.sauverEtatInstallation(god.id, coffre.id, { contenu: {} });
  t.joueur.recevoir({ t: "admin", op: { genre: "remplir" } });
  const apres = base.chargerInstallations(god.id).find((i) => i.id === coffre.id)!;
  assert.ok(Object.keys(apres.etat.contenu ?? {}).length > 0);
  assert.ok(t.recus.some((m) => m.t === "installation" && m.installation.id === coffre.id));
});
