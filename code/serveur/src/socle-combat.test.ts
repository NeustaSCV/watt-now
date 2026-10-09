// 0.6, chantier 2 (Book 25 §10.3) : le socle du combat. Les étoiles par exemplaire en jeu (usure, arme en main,
// sauvegardes), le type « électrique » et sa règle, le bruit d'un coup selon son type, la réparation des lames à la
// meule ou à la forge, le découpage des armes par famille, le moteur des déclencheurs.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ARMES,
  ATELIER_REPARATION,
  BRUIT_COUP,
  CAPACITE_PACK_WH,
  armeDeCle,
  armeEnMain,
  armeSansCharge,
  chargeArme,
  etatArme,
  meilleureArme,
  porteeBruitCoup,
  type Arme,
} from "../../commun/src/combat.ts";
import { encaisser, encaisserCoup, nouvelEteint, penser } from "../../commun/src/eteints.ts";
import { OBJETS_DE_METIER } from "../../commun/src/etoiles.ts";
import { DUREE_VOYAGE_S, SORTIE_TERRAIN, ZONE_STATION, zoneDe } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { estCleObjet, nommer, poidsInventaire } from "../../commun/src/objets.ts";
import { stimuliJoueur } from "../../commun/src/signature.ts";
import { ARMES_CHARBONNIERS } from "../../commun/src/armes/charbonniers.ts";
import { ARMES_COMMUNES } from "../../commun/src/armes/communes.ts";
import { ARMES_MECANISTES } from "../../commun/src/armes/mecanistes.ts";
import { ARMES_VOLTAIQUES } from "../../commun/src/armes/voltaiques.ts";
import { Base } from "./base.ts";
import { messageValide } from "./controle.ts";
import { declencher, declencheurNeuf, enregistrerDeclencheur, rearmer, type DeclencheurPose } from "./declencheurs.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

const de = { x: 0, z: -1 };
const arme = (objet: string) => ARMES.find((a) => a.objet === objet)!;

/** Une matraque électrique d'essai, à ★★★ (la vraie viendra avec le chantier 6). */
const MATRAQUE: Arme = {
  objet: null,
  nom: "la matraque d'essai",
  type: "electrique",
  solidite: 60,
  degatsTorse: 0,
  tueALaTete: true,
  allonge: 1.3,
  coup: 450,
  coupAppuye: 1000,
  electrique: { raidi: 2.5, whCourte: 0.25, whLongue: 1, saute: true },
};
const errant = (id = 1, x = 0, z = 0) => nouvelEteint(id, x, z, "poursuivant");
const equipe = (id = 1, x = 0, z = 0) => Object.assign(errant(id, x, z), { variante: "equipe" as const });

// ---------- Les armes, par famille ----------

test("0.6 socle : ARMES rassemble les fichiers par famille, triés par rang, sans rien changer à l'ordre d'avant", () => {
  const ordre = ["masse", "hache", "pied_de_biche", "machette", "marteau", "barre_metal", "lance", "lame_forgee", "gourdin", "epieu", "couteau_aiguise", "couteau"];
  assert.deepEqual(
    ARMES.map((a) => a.objet),
    ordre,
  );
  assert.equal(ARMES.length, ARMES_COMMUNES.length + ARMES_CHARBONNIERS.length + ARMES_VOLTAIQUES.length + ARMES_MECANISTES.length);
  // Chaque arme de métier est déclarée dans OBJETS_DE_METIER (ses étoiles de base), et réciproquement.
  for (const a of ARMES) assert.equal(a.metier === true, a.objet !== null && a.objet in OBJETS_DE_METIER, String(a.objet));
  // Les valeurs d'avant n'ont pas bougé.
  assert.equal(arme("machette").degatsTorse, 1.2);
  assert.equal(arme("lame_forgee").solidite, 60);
});

// ---------- Les étoiles en main ----------

test("0.6 socle : un exemplaire étoilé frappe selon ses étoiles ; la clé nue est l'arme d'avant", () => {
  assert.equal(armeDeCle("lame_forgee"), arme("lame_forgee"), "aux étoiles de base : l'arme déclarée, telle quelle");
  const l4 = armeDeCle("lame_forgee#4")!;
  assert.equal(l4.solidite, 90);
  assert.ok(Math.abs(l4.degatsTorse - 1.1) < 1e-9);
  assert.equal(l4.etoiles, 4);
  assert.equal(l4.cle, "lame_forgee#4");
  // La machette de fortune (★) dérouillée à ★★ : 1,35 et 60 (Book 25 §8.4).
  const m2 = armeDeCle("machette#2")!;
  assert.ok(Math.abs(m2.degatsTorse - 1.35) < 1e-9);
  assert.equal(m2.solidite, 60);
  assert.equal(armeDeCle("pierre"), null);
  // Dans le sac : la meilleure arme, et pour elle le meilleur exemplaire.
  assert.equal(meilleureArme({ "lame_forgee#2": 1, "lame_forgee#5": 1, couteau: 1 }).cle, "lame_forgee#5");
  // L'exemplaire équipé ; s'il a cassé, un autre de la même arme ; sinon la meilleure du sac.
  assert.equal(armeEnMain({ "lame_forgee#2": 1, lame_forgee: 1 }, "lame_forgee#2").cle, "lame_forgee#2");
  assert.equal(armeEnMain({ lame_forgee: 1 }, "lame_forgee#2").objet, "lame_forgee");
  assert.equal(armeEnMain({ couteau: 1 }, "lame_forgee#2").objet, "couteau");
  // L'usure se lit par exemplaire.
  assert.equal(etatArme("lame_forgee#4", { "lame_forgee#4": 45 }), 0.5);
  assert.equal(etatArme("lame_forgee", { "lame_forgee#4": 45 }), 1);
});

test("0.6 socle : un exemplaire étoilé pèse son poids, se nomme avec ses étoiles, passe le contrôle", () => {
  assert.equal(poidsInventaire({ "lame_forgee#4": 2, lame_forgee: 1 }), poidsInventaire({ lame_forgee: 3 }));
  assert.equal(nommer("lame_forgee#4", 1), "lame forgée ★★★★");
  assert.equal(nommer("lame_forgee", 2), "2 lames forgées");
  assert.ok(estCleObjet("lame_forgee#4"));
  assert.ok(!estCleObjet("lame_forgee#3"));
  assert.ok(!estCleObjet("pierre#2"));
  assert.ok(messageValide({ t: "coffre", id: 1, sens: "deposer", objet: "lame_forgee#4", quantite: 1 }));
  assert.ok(messageValide({ t: "equiper", objet: "machette#3" }));
  assert.ok(!messageValide({ t: "jeter", objet: "pierre#2", quantite: 1 }));
  assert.ok(!messageValide({ t: "reparer", objet: "toString#2", fortune: false }));
});

/** Un joueur à la halte, des Éteints placés où l'on veut. */
function aLaHalte(inventaire: Record<string, number>, famille: "charbonniers" | "voltaiques" | "mecanistes" = "charbonniers") {
  const base = new Base(":memory:");
  const halte = new Halte(base, () => 0.5);
  const compte = base.creerCompte("Rose", "potager42", famille);
  base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inventaire });
  let instant = 1_000_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 0.5);
  const attendre = (secondes: number, pas = 0.05) => {
    for (let s = 0; s < secondes - 1e-9; s += pas) {
      instant += pas * 1000;
      halte.tick(instant, pas);
      joueur.tick(pas);
    }
  };
  joueur.position = { x: SORTIE_TERRAIN.boite.x, z: SORTIE_TERRAIN.boite.z, o: 0 };
  joueur.recevoir({ t: "voyager", vers: "station" });
  attendre(DUREE_VOYAGE_S + 0.1, 0.5);
  halte.eteints = [];
  joueur.position = { x: 40, z: 34.6, o: 0 };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const frapper = () => {
    halte.eteints = [nouvelEteint(9, 40, 35.6, "poursuivant")];
    joueur.position = { x: 40, z: 34.6, o: 0 };
    joueur.recevoir({ t: "frapper", appuye: false });
    attendre(0.9);
  };
  return { base, compte, joueur, recus, attendre, dernier, frapper, halte };
}

test("0.6 socle : l'usure par exemplaire — une lame ★★ casse au 45e coup, la ★★★ d'à côté reste neuve", () => {
  const t = aLaHalte({ "lame_forgee#2": 1, lame_forgee: 1 });
  t.joueur.recevoir({ t: "equiper", objet: "lame_forgee#2" });
  for (let i = 0; i < 44; i++) t.frapper();
  // Abîmée au 32e coup (sous 30 % de 45) : le message nomme l'exemplaire.
  assert.deepEqual(t.dernier("usure")?.evenement, { objet: "lame_forgee#2", etat: "abimee" });
  assert.equal(t.dernier("usure")?.usure["lame_forgee#2"], 13);
  assert.equal(t.base.chargerInventaire(t.compte.id)["lame_forgee#2"], 1);
  t.frapper();
  const u = t.dernier("usure")!;
  assert.equal(u.evenement?.etat, "cassee");
  assert.equal(u.evenement?.objet, "lame_forgee#2");
  const inv = t.dernier("inventaire")!.inventaire;
  assert.equal(inv["lame_forgee#2"], undefined);
  assert.equal(inv.lame_forgee, 1, "l'autre lame est toujours là");
  assert.equal(u.usure.lame_forgee, undefined, "et neuve");
  assert.equal(inv.lame_ebrechee, 1, "le débris de la lame cassée");
});

test("0.6 socle : une sauvegarde 0.5.3 se relit sans perte ; les clés étoilées se sauvent et se relisent", () => {
  const base = new Base(":memory:");
  const c = base.creerCompte("Lise", "potager42", "charbonniers");
  const ancienne = { couteau: 1, lame_forgee: 2, machette: 1, pierre: 4, sac_a_dos: 1 };
  base.sauverInventaire(c.id, ancienne);
  base.sauverUsure(c.id, { lame_forgee: 30, machette: 12 });
  base.sauverArme(c.id, "machette");
  assert.deepEqual(base.chargerInventaire(c.id), ancienne);
  assert.deepEqual(base.chargerUsure(c.id), { lame_forgee: 30, machette: 12 });
  assert.equal(base.chargerArme(c.id), "machette");
  // Les exemplaires étoilés passent par la même colonne.
  base.sauverInventaire(c.id, { "lame_forgee#4": 1, lame_forgee: 1 });
  base.sauverUsure(c.id, { "lame_forgee#4": 80 });
  base.sauverArme(c.id, "lame_forgee#4");
  assert.deepEqual(base.chargerInventaire(c.id), { "lame_forgee#4": 1, lame_forgee: 1 });
  assert.deepEqual(base.chargerUsure(c.id), { "lame_forgee#4": 80 });
  assert.equal(base.chargerArme(c.id), "lame_forgee#4");
  // Une clé écrite à l'ancienne (« #3 » pour la base) revient sous sa forme canonique.
  base.sauverInventaire(c.id, { "lame_forgee#3": 2 } as never);
  assert.deepEqual(base.chargerInventaire(c.id), { lame_forgee: 2 });
  // La charge des armes électriques : vide au départ (pleine), relue telle quelle.
  assert.deepEqual(base.chargerChargeArmes(c.id), {});
});

// ---------- L'électricité ----------

test("0.6 socle : électrique — la courte fait lâcher et raidit, rien au torse ; la longue met à terre un Éteint libre", () => {
  const e = errant();
  e.saisit = 7;
  assert.equal(encaisser(e, MATRAQUE, false, 1, de, ZONE_STATION), "raidi");
  assert.equal(e.saisit, null, "il lâche");
  assert.equal(e.etourdi, 2.5);
  assert.equal(e.raidi, 2.5);
  assert.equal(e.degats, 0, "rien au torse");
  // Raidi, il ne bouge pas et ne saisit pas, même au contact.
  const avant = { x: e.x, z: e.z };
  for (let i = 0; i < 20; i++) penser(e, 0.1, [], [{ id: 7, x: 0, z: 0.5, discret: false, eclaire: false }], [e], false, ZONE_STATION, () => 0.5);
  assert.deepEqual({ x: e.x, z: e.z }, avant);
  assert.equal(e.saisit, null);
  // La longue, sur un Éteint libre : à terre (4 s).
  const f = errant();
  assert.equal(encaisser(f, MATRAQUE, true, 1, de, ZONE_STATION), "a_terre");
  assert.equal(f.aTerre, 4);
});

test("0.6 socle : électrique — la longue détruit un raidi ; au sol, toute décharge achève ; l'Équipé tombe pareil", () => {
  for (const cible of [errant(), equipe()]) {
    assert.equal(encaisser(cible, MATRAQUE, false, 1, de, ZONE_STATION), "raidi");
    assert.equal(encaisser(cible, MATRAQUE, true, 1, de, ZONE_STATION), "detruit", cible.variante ?? "errant");
    assert.ok(cible.eteintParLeCourant);
  }
  // Étourdi par un coup ordinaire, c'est pareil : la longue le détruit.
  const e = errant();
  encaisser(e, arme("gourdin"), false, 1, de, ZONE_STATION);
  assert.equal(encaisser(e, MATRAQUE, true, 1, de, ZONE_STATION), "detruit");
  // Au sol, même une courte achève, casque ou pas ; le Rampant aussi.
  const auSol = Object.assign(equipe(), { etat: "a_terre" as const, aTerre: 3 });
  assert.equal(encaisser(auSol, MATRAQUE, false, 1, de, ZONE_STATION), "detruit");
  const rampant = Object.assign(errant(), { variante: "rampant" as const });
  assert.equal(encaisser(rampant, MATRAQUE, false, 1, de, ZONE_STATION), "detruit");
});

test("0.6 socle : la règle du casque ne change pas — le tranchant n'achève toujours pas un Équipé", () => {
  const auSol = Object.assign(equipe(), { etat: "a_terre" as const, aTerre: 3 });
  assert.notEqual(encaisser(auSol, arme("lame_forgee"), true, 1, de, ZONE_STATION), "detruit");
  assert.notEqual(encaisser(equipe(), armeDeCle("lame_forgee#5")!, true, 1, de, ZONE_STATION), "detruit", "même ★★★★★");
});

test("0.6 socle : électrique — à ★★★ la courte saute au voisin à moins d'un mètre, pas plus loin, pas à ★★", () => {
  const cible = errant(1, 0, 0);
  const voisin = errant(2, 0.8, 0);
  const loin = errant(3, 3, 0);
  const effet = encaisserCoup(cible, MATRAQUE, false, 1, de, ZONE_STATION, [cible, voisin, loin]);
  assert.equal(effet.resultat, "raidi");
  assert.equal(effet.voisinRaidi, voisin);
  assert.equal(voisin.raidi, 2.5);
  assert.equal(loin.raidi ?? 0, 0);
  const sansSaut = { ...MATRAQUE, electrique: { ...MATRAQUE.electrique!, saute: false } };
  const autre = errant(5, 0.5, 0);
  assert.equal(encaisserCoup(errant(4), sansSaut, false, 1, de, ZONE_STATION, [autre]).voisinRaidi, undefined);
});

test("0.6 socle : électrique — les étoiles règlent le raidissement et la longue ; le pack vide fait un gourdin court", () => {
  // Une matraque de métier d'essai, déclarée le temps du test (le chantier 6 déclarera la vraie).
  const essai: Arme = { ...MATRAQUE, objet: "gourdin", metier: true };
  const i = ARMES.findIndex((a) => a.objet === "gourdin");
  const avant = ARMES[i]!;
  ARMES[i] = essai;
  OBJETS_DE_METIER.gourdin = 3;
  try {
    const une = armeDeCle("gourdin#1")!;
    assert.equal(une.electrique?.raidi, 1.5);
    assert.equal(une.coupAppuye, 1400);
    assert.equal(une.electrique?.saute, false, "★ : pas de saut");
    const cinq = armeDeCle("gourdin#5")!;
    assert.equal(cinq.electrique?.raidi, 3.5);
    assert.equal(cinq.coupAppuye, 800);
    assert.equal(cinq.solidite, 120);
    assert.equal(chargeArme("gourdin#5", {}), CAPACITE_PACK_WH, "absente : pleine");
    assert.equal(chargeArme("gourdin#5", { "gourdin#5": 3.5 }), 3.5);
  } finally {
    ARMES[i] = avant;
    delete OBJETS_DE_METIER.gourdin;
  }
  const vide = armeSansCharge(MATRAQUE);
  assert.equal(vide.type, "contondant");
  assert.equal(vide.degatsTorse, 0.6);
  assert.equal(vide.tueALaTete, false);
  assert.equal(vide.electrique, undefined);
});

// ---------- Le bruit d'un coup ----------

test("0.6 socle : le bruit d'un coup suit son type — 14 m le choc, 10 m le tranchant, 6 et 8 m la décharge", () => {
  assert.deepEqual(BRUIT_COUP, { contondant: 14, tranchant: 10, percant: 10, electrique: 6 });
  assert.equal(porteeBruitCoup(arme("masse"), false), 14);
  assert.equal(porteeBruitCoup(arme("machette"), true), 10);
  assert.equal(porteeBruitCoup(MATRAQUE, false), 6);
  assert.equal(porteeBruitCoup(MATRAQUE, true), 8);
  const son = (porteeCoup?: number) => stimuliJoueur({ x: 0, z: 0, allure: "marche", bouge: false, action: "coup", lumiere: null, nuit: false, porteeCoup })[0]!.portee;
  assert.equal(son(), 14, "sans précision : comme avant");
  assert.equal(son(10), 10);
});

// ---------- La réparation : la meule ou la forge ----------

test("0.6 socle : les lames se réparent à la meule ou à la forge (décision 8) ; un Charbonnier seul répare sa lame", () => {
  assert.deepEqual(
    ATELIER_REPARATION.lame.map((a) => a.installation),
    ["pedalier", "forge"],
  );
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "charbonniers");
  base.sauverInventaire(compte.id, { sac_a_dos: 1, lame_forgee: 1, charbon_bois: 1 });
  base.sauverUsure(compte.id, { lame_forgee: 10 });
  base.ajouterInstallation(compte.id, "forge", 21, 20, 0);
  let instant = base.debutMonde() + 60_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, undefined, () => 0.9);
  joueur.position = { x: 20, z: 20, o: 0 };
  const attendre = (s: number) => {
    for (let k = 0; k < s; k += 0.25) {
      instant += 250;
      joueur.tick(0.25);
    }
  };
  joueur.recevoir({ t: "reparer", objet: "lame_forgee", fortune: false });
  attendre(20);
  const u = recus.findLast((m) => m.t === "usure") as Extract<MessageServeur, { t: "usure" }>;
  assert.equal(u.evenement?.etat, "reparee");
  assert.equal(u.usure.lame_forgee, undefined, "comme neuve");
  assert.equal(base.chargerInventaire(compte.id).charbon_bois, undefined, "un kilo de charbon brûlé");
  // Sans charbon, la forge ne reprend pas la lame, et le message le dit.
  base.sauverUsure(compte.id, { lame_forgee: 10 });
  const j2 = new Joueur(compte, base, (m) => recus.push(m), () => instant, undefined, () => 0.9);
  j2.position = { x: 20, z: 20, o: 0 };
  j2.recevoir({ t: "reparer", objet: "lame_forgee", fortune: false });
  const info = recus.findLast((m) => m.t === "info") as Extract<MessageServeur, { t: "info" }>;
  assert.match(info.texte, /charbon/);
  // Loin de tout atelier : la meule ou la forge.
  j2.position = { x: 60, z: 60, o: 0 };
  j2.recevoir({ t: "reparer", objet: "lame_forgee", fortune: false });
  assert.match((recus.findLast((m) => m.t === "info") as Extract<MessageServeur, { t: "info" }>).texte, /meule du pédalier ou la forge/);
});

// ---------- Le moteur des déclencheurs ----------

enregistrerDeclencheur({ type: "essai_plaque", nom: "la plaque d'essai", forme: { genre: "cercle", rayon: 0.6 }, effets: [{ genre: "mettre_a_terre", secondes: 4 }], prisesParArmement: 1, intervalle: 0 });
enregistrerDeclencheur({ type: "essai_cloture", nom: "la clôture d'essai", forme: { genre: "ligne", longueur: 4, epaisseur: 0.4 }, effets: [{ genre: "raidir", secondes: 1 }, { genre: "repousser", metres: 0.8 }], prisesParArmement: Infinity, intervalle: 1.5, cede: 3 });
enregistrerDeclencheur({ type: "essai_machoires", nom: "les mâchoires d'essai", forme: { genre: "cercle", rayon: 0.5 }, effets: [{ genre: "briser_jambe" }, { genre: "tenir", secondes: 10 }], prisesParArmement: 1, intervalle: 0, usure: 5 });

const pose = (id: number, type: string, x = 10, z = 10, o = 0): DeclencheurPose => ({ id, type, x, z, o, etat: declencheurNeuf() });
const terrain = zoneDe("terrain");

test("0.6 socle : déclencheurs — la plaque met à terre le premier qui passe, puis il faut la réarmer ; elle ne détruit jamais", () => {
  const p = pose(1, "essai_plaque");
  const a = errant(1, 10.2, 10);
  const b = errant(2, 10, 10.1);
  const faits = declencher([p], [a, b], 1000, terrain);
  assert.equal(faits.length, 1);
  assert.equal(a.etat, "a_terre");
  assert.equal(b.etat, "poursuivant", "un seul : elle est désarmée");
  assert.equal(p.etat.arme, false);
  assert.equal(declencher([p], [b], 2000, terrain).length, 0);
  assert.ok(rearmer(p.etat));
  declencher([p], [b], 3000, terrain);
  assert.equal(b.etat, "a_terre");
  assert.ok([a, b].every((e) => e.etat !== "detruit"));
  // Les dormants et ceux qui sont à terre ne la déclenchent pas.
  const q = pose(2, "essai_plaque");
  assert.equal(declencher([q], [nouvelEteint(3, 10, 10, "dormant"), Object.assign(errant(4, 10, 10), { etat: "a_terre" as const })], 0, terrain).length, 0);
});

test("0.6 socle : déclencheurs — la clôture raidit et repousse, encore et encore ; trois qui poussent ensemble la couchent", () => {
  const c = pose(1, "essai_cloture", 10, 10, Math.PI / 2);
  const e = errant(1, 11.5, 10.1);
  const derniers = new Map<string, number>();
  assert.equal(declencher([c], [e], 0, terrain, derniers).length, 1);
  assert.ok((e.raidi ?? 0) > 0);
  assert.equal(c.etat.arme, true, "toujours armée");
  // Le même, de retour trop tôt : pas repris ; après l'intervalle, si.
  e.x = 11.5;
  e.z = 10.1;
  assert.equal(declencher([c], [e], 1000, terrain, derniers).length, 0);
  assert.equal(declencher([c], [e], 2000, terrain, derniers).length, 1);
  // Hors de la ligne (au-delà de ses 2 m de demi-longueur), rien.
  assert.equal(declencher([c], [errant(5, 13, 10)], 5000, terrain, derniers).length, 0);
  // Trois à la fois : couchée.
  const trois = [errant(2, 9, 10), errant(3, 10, 10.2), errant(4, 11, 9.9)];
  const faits = declencher([c], trois, 9000, terrain, derniers);
  assert.equal(faits[0]?.couche, true);
  assert.equal(c.etat.couche, true);
  assert.ok(trois.every((x) => (x.raidi ?? 0) === 0), "couchée, elle ne prend personne");
  assert.ok(rearmer(c.etat), "on la relève");
});

test("0.6 socle : déclencheurs — les mâchoires brisent la jambe et tiennent sur place ; de fortune, elles se faussent en 5 prises", () => {
  const m = pose(1, "essai_machoires");
  const e = errant(1, 10, 10);
  declencher([m], [e], 0, terrain);
  assert.equal(e.variante, "rampant");
  assert.equal(e.retenu, 10);
  // Tenu, il n'avance pas, même vers quelqu'un qu'il voit.
  for (let i = 0; i < 30; i++) penser(e, 0.1, [], [{ id: 7, x: 10, z: 13, discret: false, eclaire: false }], [e], false, terrain, () => 0.5);
  assert.ok(Math.hypot(e.x - 10, e.z - 10) < 1e-9);
  for (let k = 2; k <= 5; k++) {
    assert.ok(rearmer(m.etat));
    declencher([m], [errant(k, 10, 10)], k * 1000, terrain);
  }
  assert.equal(m.etat.prises, 5);
  assert.equal(m.etat.fausse, true);
  assert.equal(rearmer(m.etat), false, "faussées : il faut les refaire");
});
