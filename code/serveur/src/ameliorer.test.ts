// Améliorer sa base (Book 24) : démonter, creuser un feu en Dakota, monter de niveau sur place, le plafond de foyers,
// les coûts (et le surcoût des niveaux de famille), la migration des bases existantes.

import { test } from "node:test";
import assert from "node:assert/strict";
import { toutDevoile } from "../../commun/src/progression.ts";
import { mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { MAX_FOYERS, VOIE_SURFACE, capaciteCoffre, choisirCout, contenanceRecuperateur, coutPour, effetsFeu, rendDuDemontage } from "../../commun/src/lignees.ts";
import { QUETES } from "../../commun/src/quetes.ts";
import { SuiviQuetes } from "./quetes.ts";
import { BOIS_PAR_HEURE, bruler } from "../../commun/src/survie.ts";
import type { EtatQuetes } from "../../commun/src/quetes.ts";
import { Base } from "./base.ts";
import { Joueur } from "./joueur.ts";

const dossierTests = join(dirname(fileURLToPath(import.meta.url)), "..", "donnees", "tests-ameliorer");

function monter(inventaire: Record<string, number>, avant?: (base: Base, id: number) => void, famille: "mecanistes" | "charbonniers" | "voltaiques" = "mecanistes") {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", famille);
  // Ces tests portent sur autre chose que l'arbre de progression : tout est dévoilé (plan 0.8 : le vétéran
  // n'a plus d'emblée que les recettes à la main).
  base.sauverProgression(compte.id, toutDevoile(famille));
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
  avant?.(base, compte.id);
  let instant = base.debutMonde() + 60_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, undefined, () => 0.9);
  joueur.position = { x: 20, z: 20, o: 0 };
  const attendre = (secondes: number, pas = 0.25) => {
    for (let s = 0; s < secondes; s += pas) {
      instant += pas * 1000;
      joueur.tick(pas);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  const inventaireActuel = () => dernier("inventaire")?.inventaire ?? base.chargerInventaire(compte.id);
  const faits = () => (joueur as unknown as { quetes: { etat: EtatQuetes } }).quetes.etat.faits;
  const agir = (genre: "feu" | "installation", id: number, verbe: string, secondes = 6) => {
    joueur.recevoir({ t: "interagir", cible: { genre, id }, verbe: verbe as never });
    attendre(secondes);
  };
  return { base, compte, joueur, recus, attendre, dernier, infos, inventaireActuel, faits, agir };
}

/** Un feu déjà posé en base, éteint, à côté du joueur. */
function poserFeu(base: Base, id: number, feu: { id: number; x?: number; z?: number; bois?: number; allume?: boolean; dakota?: boolean; niveau?: number }) {
  base.sauverFeu(id, { x: 21, z: 20, bois: 2, allume: false, majLe: base.debutMonde() + 60_000, ...feu });
}

test("le bug du Book 24 : à 3 feux de camp, on ne pose pas de Dakota, mais on en creuse un sur place (objectif du carnet compris)", () => {
  const t = monter({ branche: 3, baton_fouir: 1 }, (b, id) => {
    poserFeu(b, id, { id: 1, x: 21, z: 20 });
    poserFeu(b, id, { id: 2, x: 30, z: 30 });
    poserFeu(b, id, { id: 3, x: 35, z: 35 });
  });
  assert.equal(MAX_FOYERS, 3);
  // Un quatrième foyer : refusé, et le message dit quoi faire à la place.
  t.joueur.recevoir({ t: "construire_feu", x: 18, z: 18, dakota: true });
  assert.match(t.infos().at(-1)!, /Pas plus de 3 foyers.*creuse-le en Dakota/);
  // Creuser le feu existant : même identifiant, même place, 3 pierres rendues.
  t.agir("feu", 1, "creuser_dakota");
  const feu = t.dernier("feu")!.feu;
  assert.equal(feu.id, 1);
  assert.equal(feu.dakota, true);
  assert.deepEqual([feu.x, feu.z], [21, 20]);
  assert.equal(t.inventaireActuel().pierre, 3);
  assert.equal(t.base.chargerFeux(t.compte.id).length, 3, "toujours trois foyers");
  assert.equal(t.base.chargerFeux(t.compte.id)[0]!.dakota, true);
  assert.equal(t.faits().foyer_dakota, 1, "l'objectif « Un feu qui ne se voit pas » est rempli");
});

test("creuser demande de quoi creuser ; combler rend le feu de camp contre 5 pierres", () => {
  const t = monter({}, (b, id) => poserFeu(b, id, { id: 1 }));
  t.agir("feu", 1, "creuser_dakota");
  assert.match(t.infos().at(-1)!, /Creuser 1|bâton à fouir|bêche/i);
  assert.notEqual(t.dernier("feu")?.feu.dakota, true);

  const u = monter({ pierre: 5, baton_fouir: 1 }, (b, id) => poserFeu(b, id, { id: 1, dakota: true }));
  u.agir("feu", 1, "combler");
  const feu = u.dernier("feu")!.feu;
  assert.equal(feu.dakota, undefined);
  assert.equal(u.inventaireActuel().pierre ?? 0, 0);
});

test("démonter un feu : il doit être éteint ; on récupère la moitié des pierres et des branches, et son bois", () => {
  const t = monter({}, (b, id) => poserFeu(b, id, { id: 1, bois: 3, allume: true }));
  t.agir("feu", 1, "demonter_installation");
  assert.match(t.infos().at(-1)!, /Éteins-le d'abord/);
  assert.equal(t.base.chargerFeux(t.compte.id).length, 1);

  const u = monter({}, (b, id) => poserFeu(b, id, { id: 1, bois: 2.5 }));
  u.agir("feu", 1, "demonter_installation");
  assert.deepEqual(u.dernier("feu_retire"), { t: "feu_retire", id: 1 });
  assert.equal(u.base.chargerFeux(u.compte.id).length, 0);
  const inv = u.inventaireActuel();
  // 5 pierres, 3 branches → 2 pierres, 1 branche ; 2,5 kg de bois → une bûche et une branche.
  assert.equal(inv.pierre, 2);
  assert.equal(inv.buche, 1);
  assert.equal(inv.branche, 2);
});

test("améliorer le feu en foyer de pierres : sur place, même identifiant, le bois gardé ; jamais dans les flammes", () => {
  const t = monter({ pierre: 6, buche: 2 }, (b, id) => poserFeu(b, id, { id: 1, bois: 6, allume: true }));
  t.agir("feu", 1, "ameliorer");
  assert.match(t.infos().at(-1)!, /flammes/);
  assert.equal(t.base.chargerFeux(t.compte.id)[0]!.niveau, undefined);

  const u = monter({ pierre: 6, buche: 2 }, (b, id) => poserFeu(b, id, { id: 1, bois: 6, allume: false }));
  u.agir("feu", 1, "ameliorer");
  const feu = u.dernier("feu")!.feu;
  assert.equal(feu.id, 1);
  assert.equal(feu.niveau, 2);
  assert.equal(feu.bois, 6, "le bois est gardé");
  assert.deepEqual([feu.x, feu.z], [21, 20]);
  assert.equal(typeof feu.o, "number", "le muret a son orientation");
  const inv = u.inventaireActuel();
  assert.equal(inv.pierre ?? 0, 0);
  assert.equal(inv.buche ?? 0, 0);
  const enBase = u.base.chargerFeux(u.compte.id)[0]!;
  assert.equal(enBase.niveau, 2);
  assert.deepEqual(enBase.payes, [{ pierre: 5, branche: 3 }, { pierre: 6, buche: 2 }]);
  assert.equal(u.faits()["foyer:foyer_pierres"], 1);
});

test("un feu en braises s'améliore ; il manque des matériaux : on dit lesquels, et l'autre façon de faire", () => {
  const t = monter({ pierre: 6, buche: 2 }, (b, id) => poserFeu(b, id, { id: 1, bois: 0.2, allume: true }));
  t.agir("feu", 1, "ameliorer");
  assert.equal(t.dernier("feu")!.feu.niveau, 2);

  const u = monter({ branche: 3, corde: 1, couteau: 1, pierre: 1 }, (b, id) => poserFeu(b, id, { id: 1, niveau: 2 }));
  u.agir("feu", 1, "ameliorer");
  const dit = u.infos().at(-1)!;
  assert.match(dit, /rouleau de grillage/);
  assert.match(dit, /2 barres de métal/);
});

test("le foyer de cuisine se monte avec deux barres de métal au lieu du grillage ; il rôtit deux fois plus vite", () => {
  const t = monter({ branche: 3, corde: 1, barre_metal: 2, couteau: 1, pierre: 1, volaille_crue: 2 }, (b, id) => poserFeu(b, id, { id: 1, niveau: 2, bois: 5 }));
  t.agir("feu", 1, "ameliorer");
  assert.equal(t.dernier("feu")!.feu.niveau, 3);
  assert.equal(t.inventaireActuel().barre_metal ?? 0, 0);
  const etat = t.base.chargerFeux(t.compte.id)[0]!;
  assert.deepEqual(etat.payes?.at(-1), { branche: 3, corde: 1, barre_metal: 2 });
  // Rôtir 2 portions : 6 s sur un feu de camp, 3 s ici.
  t.base.sauverFeu(t.compte.id, { ...etat, allume: true });
  const u = monter({ volaille_crue: 2, briquet: 1 }, (b, id) => poserFeu(b, id, { id: 1, niveau: 3, bois: 5, allume: true }));
  u.joueur.recevoir({ t: "interagir", cible: { genre: "feu", id: 1 }, verbe: "rotir" });
  const debut = u.dernier("action")!;
  assert.equal(debut.t === "action" && debut.etat === "debut" ? debut.duree : 0, 3);
});

test("redescendre rend la moitié des matériaux naturels du niveau, et tout le reste (la grille, la corde)", () => {
  const t = monter({}, (b, id) =>
    b.sauverFeu(id, { id: 1, x: 21, z: 20, bois: 2, allume: false, majLe: 0, niveau: 3, payes: [{ pierre: 5, branche: 3 }, { pierre: 6, buche: 2 }, { branche: 3, corde: 1, grillage_rouleau: 1 }] }),
  );
  t.agir("feu", 1, "redescendre");
  assert.equal(t.dernier("feu")!.feu.niveau, 2);
  assert.deepEqual(t.inventaireActuel(), { sac_a_dos: 1, branche: 1, corde: 1, grillage_rouleau: 1 });
  assert.deepEqual(rendDuDemontage({ pierre: 6, buche: 2, barre_metal: 2, casserole: 1 }), { pierre: 3, buche: 1, barre_metal: 2, casserole: 1 });
});

test("chaque niveau brûle son bois : foyer de pierres ×0,8, Dakota ×0,6, poêle-fusée ×0,4 ; couvert, quatre fois moins", () => {
  const brule = (f: Parameters<typeof bruler>[0]) => 10 - bruler(f, 1).bois;
  assert.equal(brule({ bois: 10, allume: true }), BOIS_PAR_HEURE);
  assert.ok(Math.abs(brule({ bois: 10, allume: true, niveau: 2 }) - BOIS_PAR_HEURE * 0.8) < 1e-9);
  assert.ok(Math.abs(brule({ bois: 10, allume: true, dakota: true }) - BOIS_PAR_HEURE * 0.6) < 1e-9);
  assert.ok(Math.abs(brule({ bois: 10, allume: true, dakota: true, niveau: 2 }) - BOIS_PAR_HEURE * 0.4) < 1e-9);
  assert.ok(Math.abs(brule({ bois: 10, allume: true, niveau: 2, couvert: true }) - BOIS_PAR_HEURE * 0.8 * 0.25) < 1e-9);
  assert.equal(effetsFeu({ niveau: 2 }).boisMax, 16);
  assert.equal(effetsFeu({ dakota: true, niveau: 2 }).boisMax, 4);
});

test("couvrir le foyer de pierres pour la nuit, puis le ranimer sans briquet", () => {
  const t = monter({}, (b, id) => poserFeu(b, id, { id: 1, niveau: 2, bois: 5, allume: true }));
  t.agir("feu", 1, "couvrir", 1);
  assert.equal(t.dernier("feu")!.feu.couvert, true);
  assert.equal(t.dernier("feu")!.feu.aspect, "braises");
  t.agir("feu", 1, "allumer", 1);
  assert.equal(t.dernier("feu")!.feu.couvert, undefined);
  assert.equal(t.dernier("feu")!.feu.aspect, "flammes");
  // Un feu de camp ne se couvre pas.
  const u = monter({}, (b, id) => poserFeu(b, id, { id: 1, bois: 5, allume: true }));
  u.agir("feu", 1, "couvrir", 1);
  assert.match(u.infos().at(-1)!, /foyer de pierres/);
});

test("le poêle-fusée : quatre boîtes vides et des pierres sur un Dakota ; le bois en trop revient dans le sac", () => {
  const t = monter({ boite_vide: 4, pierre: 4 }, (b, id) => poserFeu(b, id, { id: 1, dakota: true, bois: 6 }));
  t.agir("feu", 1, "ameliorer");
  const feu = t.dernier("feu")!.feu;
  assert.equal(feu.niveau, 2);
  assert.equal(feu.dakota, true);
  assert.equal(feu.bois, 4);
  assert.equal(t.inventaireActuel().buche, 1, "2 kg de bois en trop : une bûche");
});

test("le foyer de cuisine cuit les soupes, deux à la fois, avec l'eau de la gourde et le bois du feu", () => {
  const sansCremaillere = monter({ cepe: 2 }, (b, id) => poserFeu(b, id, { id: 1, bois: 5, allume: true }));
  sansCremaillere.joueur.recevoir({ t: "fabriquer", recette: "soupe_cepes" });
  assert.match(sansCremaillere.infos().at(-1)!, /foyer de cuisine/);

  const t = monter({ cepe: 4, gourde: 1 }, (b, id) => poserFeu(b, id, { id: 1, niveau: 3, bois: 5, allume: true }));
  t.joueur.recevoir({ t: "fabriquer", recette: "soupe_cepes" });
  t.attendre(6);
  assert.equal(t.inventaireActuel().soupe_cepes, 2, "deux plats à la fois");
  assert.equal(t.inventaireActuel().cepe ?? 0, 0);
  // 1 kg pris pour la cuisson (2 × 0,5), et un peu de bois brûlé pendant ces quelques secondes.
  const bois = t.dernier("feu")!.feu.bois;
  assert.ok(bois > 3.8 && bois < 4, `1 kg de bois pris au feu (reste ${bois})`);
  assert.equal(t.dernier("besoins")!.gourde.litres, 0);
});

test("accessoires : la broche se monte sur un feu de camp ; la marmite norvégienne veut un foyer de cuisine", () => {
  const t = monter({ branche: 2, couteau: 1, chiffons: 4, casserole: 1 }, (b, id) => poserFeu(b, id, { id: 1 }));
  t.agir("feu", 1, "monter_broche");
  assert.deepEqual(t.dernier("feu")!.feu.accessoires, ["broche"]);
  t.base.sauverInventaire(t.compte.id, { sac_a_dos: 1, branche: 4, chiffons: 4, casserole: 1 });
  t.agir("feu", 1, "monter_marmite");
  assert.match(t.infos().at(-1)!, /foyer de cuisine/);
});

test("le muret du foyer de pierres réchauffe l'abri voisin : sommeil ×1,15", () => {
  const t = monter({}, (b, id) => {
    b.ajouterInstallation(id, "abri", 21, 22, 0);
    poserFeu(b, id, { id: 1, niveau: 2, bois: 5, allume: true });
  });
  const confort = (t.joueur as unknown as { confortDuSommeil(i: { id: number; type: string; x: number; z: number }): number }).confortDuSommeil({ id: 1, type: "abri", x: 21, z: 22 });
  assert.ok(Math.abs(confort - 1.15) < 1e-9);
});

test("démonter une installation : le coffre doit être vide ; le récupérateur rend la moitié des branches et toute la bâche", () => {
  const t = monter({}, (b, id) => {
    const c = b.ajouterInstallation(id, "coffre", 21, 20, 0);
    b.sauverEtatInstallation(id, c.id, { contenu: { pierre: 1 } });
  });
  t.agir("installation", 1, "demonter_installation");
  assert.match(t.infos().at(-1)!, /Vide d'abord/);

  const u = monter({}, (b, id) => b.ajouterInstallation(id, "recuperateur_pluie", 21, 20, 0));
  u.agir("installation", 1, "demonter_installation");
  assert.deepEqual(u.dernier("installation_retiree"), { t: "installation_retiree", id: 1 });
  assert.deepEqual(u.inventaireActuel(), { sac_a_dos: 1, bache: 1, branche: 2, corde: 1 });
  // La décharge, jamais.
  const v = monter({});
  const d = v.joueur.bienvenue(0).installations.find((i) => i.type === "decharge")!;
  v.joueur.position = { x: d.x, z: d.z - 1, o: 0 };
  v.agir("installation", d.id, "demonter_installation");
  assert.match(v.infos().at(-1)!, /décharge/);
});

test("l'abri garni absorbe le lit voisin sans rien payer ; il dort comme un lit, et vaut l'objectif « Un vrai lit »", () => {
  const t = monter({}, (b, id) => {
    b.ajouterInstallation(id, "abri", 21, 20, 0);
    b.ajouterInstallation(id, "lit_branchages", 22, 21, 0);
  });
  t.agir("installation", 1, "ameliorer");
  assert.deepEqual(t.dernier("installation_retiree"), { t: "installation_retiree", id: 2 });
  const abri = t.dernier("installation")!.installation;
  assert.equal(abri.niveau, 2);
  assert.deepEqual(abri.etat.payes, [{ branche: 6 }], "le lit absorbé sera rendu au démontage");
  assert.equal(t.base.chargerInstallations(t.compte.id).find((i) => i.type === "abri")!.niveau, 2);
  const confort = (t.joueur as unknown as { confortDuSommeil(i: unknown): number }).confortDuSommeil(abri);
  assert.ok(Math.abs(confort - 1.3) < 1e-9);
  // L'objectif du carnet accepte l'abri garni.
  const suivi = new SuiviQuetes({ faits: {}, finies: [], primes: 0 });
  const lit = QUETES.find((q) => q.id === "lit")!;
  const etat = { famille: "mecanistes" as const, inventaire: {}, charges: {}, installations: [abri] };
  assert.equal(suivi.avancement(lit.objectifs[0]!.condition, etat).fait, 1);
  assert.equal(suivi.avancement(lit.objectifs[0]!.condition, { ...etat, installations: [{ ...abri, niveau: undefined }] }).fait, 0);
});

test("sans lit voisin, garnir l'abri coûte 6 branches ; le coffre cerclé garde 250 kg, la citerne 60 L", () => {
  const t = monter({ branche: 6, couteau: 1 }, (b, id) => b.ajouterInstallation(id, "abri", 21, 20, 0));
  t.agir("installation", 1, "ameliorer");
  assert.equal(t.dernier("installation")!.installation.niveau, 2);
  assert.equal(t.inventaireActuel().branche ?? 0, 0);

  const u = monter({ barre_metal: 1, buche: 2, pierre: 80 }, (b, id) => b.ajouterInstallation(id, "coffre", 21, 20, 0));
  u.agir("installation", 1, "ameliorer");
  assert.equal(u.dernier("installation")!.installation.niveau, 2);
  // 80 pierres, 160 kg : plus que les 150 kg d'un coffre simple.
  u.joueur.recevoir({ t: "coffre", id: 1, sens: "deposer", objet: "pierre", quantite: 80 });
  assert.equal(u.dernier("installation")!.installation.etat.contenu?.pierre, 80);
  assert.equal(capaciteCoffre({ type: "coffre", niveau: 2 }), 250);
  assert.equal(contenanceRecuperateur({ type: "recuperateur_pluie", niveau: 2 }), 60);
  // Redescendre un coffre trop plein pour sa taille d'avant : refusé.
  u.base.sauverEtatInstallation(u.compte.id, 1, {});
  const v = monter({}, (b, id) => {
    b.ajouterInstallation(id, "coffre", 21, 20, 0);
    b.sauverNiveauInstallation(id, 1, 2);
    b.sauverEtatInstallation(id, 1, { contenu: { pierre: 90 }, payes: [{ barre_metal: 1, buche: 2 }] });
  });
  v.agir("installation", 1, "redescendre");
  assert.match(v.infos().at(-1)!, /150 kg/);
});

test("les niveaux de famille coûtent ×1,5 aux autres familles (arrondi au-dessus)", () => {
  const poele = VOIE_SURFACE.find((e) => e.id === "poele")!;
  assert.equal(poele.famille, "charbonniers");
  assert.deepEqual(coutPour({ pierre: 6, buche: 3 }, poele, "charbonniers"), { pierre: 6, buche: 3 });
  assert.deepEqual(coutPour({ pierre: 6, buche: 3 }, poele, "voltaiques"), { pierre: 9, buche: 5 });
  assert.deepEqual(choisirCout({ grillage_rouleau: 0, barre_metal: 2 }, [{ grillage_rouleau: 1 }, { barre_metal: 2 }], {}, "voltaiques"), { cout: { barre_metal: 2 }, payable: true });
});

test("migration : les feux et installations d'avant le Book 24 passent au niveau 1, sans rien perdre", () => {
  mkdirSync(dossierTests, { recursive: true });
  const chemin = join(dossierTests, `migration-${process.pid}.sqlite`);
  try {
    const base = new Base(chemin);
    const compte = base.creerCompte("Nadia", "enclume42", "charbonniers");
    base.sauverFeu(compte.id, { id: 1, x: 10, z: 12, bois: 3.5, allume: true, majLe: 5, dakota: true });
    base.ajouterInstallation(compte.id, "coffre", 20, 20, 1.5);
    base.fermer();
    // La base telle qu'elle était en 0.5 : sans les colonnes du Book 24.
    const brute = new DatabaseSync(chemin);
    brute.exec("ALTER TABLE feux DROP COLUMN niveau; ALTER TABLE feux DROP COLUMN accessoires; ALTER TABLE feux DROP COLUMN etat; ALTER TABLE installations DROP COLUMN niveau;");
    brute.close();

    const rouverte = new Base(chemin);
    const [feu] = rouverte.chargerFeux(compte.id);
    assert.deepEqual(feu, { id: 1, x: 10, z: 12, bois: 3.5, allume: true, majLe: 5, dakota: true });
    const coffre = rouverte.chargerInstallations(compte.id).find((i) => i.type === "coffre")!;
    assert.equal(coffre.niveau, undefined, "niveau 1");
    assert.equal(coffre.o, 1.5);
    rouverte.sauverNiveauInstallation(compte.id, coffre.id, 2);
    assert.equal(rouverte.chargerInstallations(compte.id).find((i) => i.type === "coffre")!.niveau, 2);
    rouverte.fermer();
  } finally {
    rmSync(dossierTests, { recursive: true, force: true });
  }
});
