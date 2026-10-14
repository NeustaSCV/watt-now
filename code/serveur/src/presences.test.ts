// Les présences allégées : l'identité une fois, puis seulement les positions des joueurs proches.

import { test } from "node:test";
import assert from "node:assert/strict";
import { APPARENCES_DE_REFERENCE } from "../../commun/src/apparence.ts";
import { ARMES_DANS_LE_DOS } from "../../commun/src/combat.ts";
import { nouvelEteint } from "../../commun/src/eteints.ts";
import { DUREE_VOYAGE_S, SORTIE_TERRAIN } from "../../commun/src/lieux.ts";
import type { AutreVu, GesteVu, MessageServeur } from "../../commun/src/messages.ts";
import { ARMES_COMMUNES } from "../../commun/src/armes/communes.ts";
import { Base } from "./base.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";
import { RAYON_INTERET, TOURS_PRESENCES, diffuserPresences, tourDePresences, type MemoirePresences, type Observateur } from "./presences.ts";

function joueur(id: number, x: number, lieu: string | null = "station") {
  const recus: MessageServeur[] = [];
  const vu: AutreVu = { id, pseudo: `J${id}`, famille: "voltaiques", x, z: 35, o: 0, lumiere: false, apparence: APPARENCES_DE_REFERENCE.voltaiques };
  const o: Observateur & { recus: MessageServeur[] } = { id, lieu, vu, envoyer: (m) => recus.push(m), recus };
  return o;
}
const de = <T extends MessageServeur["t"]>(o: { recus: MessageServeur[] }, t: T) => o.recus.filter((m) => m.t === t) as Extract<MessageServeur, { t: T }>[];

test("l'identité d'un voisin part une fois ; ensuite seulement sa position quand elle change, en quelques nombres", () => {
  const a = joueur(1, 10);
  const b = joueur(2, 20);
  const c = joueur(3, 25);
  const memoire: MemoirePresences = new Map();
  for (let i = 0; i < 5; i++) diffuserPresences([a, b, c], memoire);
  assert.equal(de(a, "autres").length, 1);
  assert.equal(de(a, "autres")[0]!.joueurs[0]!.pseudo, "J2");
  assert.equal(de(a, "positions").length, 0, "des voisins immobiles ne coûtent rien");
  b.vu = { ...b.vu, x: 21 };
  diffuserPresences([a, b, c], memoire);
  assert.deepEqual(de(a, "positions")[0]!.p, [2, 2100, 3500, 0, 0], "seul celui qui a bougé part (id, x, z en cm, o en centièmes de radian, allure)");
  assert.ok(JSON.stringify(de(a, "positions")[0]).length < 60, "une position pèse quelques dizaines d'octets");
});

test("on ne voit que les joueurs proches ; une marge évite les va-et-vient à la limite", () => {
  const a = joueur(1, 0);
  const loin = joueur(2, RAYON_INTERET + 1);
  const memoire: MemoirePresences = new Map();
  diffuserPresences([a, loin], memoire);
  assert.equal(de(a, "autres").length, 0, "trop loin : rien");
  loin.vu = { ...loin.vu, x: RAYON_INTERET - 1 };
  diffuserPresences([a, loin], memoire);
  assert.equal(de(a, "autres").length, 1, "il entre dans le champ");
  loin.vu = { ...loin.vu, x: RAYON_INTERET + 2 };
  diffuserPresences([a, loin], memoire);
  assert.equal(de(a, "autres").length, 1, "un peu au-delà : on le garde (marge)");
});

test("allumer sa lampe renvoie l'identité ; partir sur son terrain vide la liste une fois", () => {
  const a = joueur(1, 0);
  const b = joueur(2, 5);
  const memoire: MemoirePresences = new Map();
  diffuserPresences([a, b], memoire);
  b.vu = { ...b.vu, lumiere: true };
  diffuserPresences([a, b], memoire);
  assert.equal(de(a, "autres").length, 2);
  assert.equal(de(a, "autres")[1]!.joueurs[0]!.lumiere, true);
  b.lieu = null;
  diffuserPresences([a, b], memoire);
  diffuserPresences([a, b], memoire);
  assert.equal(de(a, "autres").length, 3);
  assert.deepEqual(de(a, "autres")[2]!.joueurs, []);
});

// ---------- 0.9, chantier A : la cadence fixe, l'heure, l'allure, les gestes, l'arme dans le dos ----------

const geste = (id: number, h: number, g: Partial<GesteVu> = {}): GesteVu => ({ id, h, geste: "frappe", ...g });

test("0.9 : les présences partent un tour sur deux ; deux envois de suite sont espacés de 100 ms exactement", () => {
  assert.equal(TOURS_PRESENCES, 2);
  const a = joueur(1, 10);
  const b = joueur(2, 20);
  const memoire: MemoirePresences = new Map();
  // Le monde tourne à 20 tours par seconde ; b marche sans arrêt.
  let heure = 1_000_000;
  for (let tour = 0; tour < 40; tour++, heure += 50) {
    b.vu = { ...b.vu, x: b.vu.x + 0.12 };
    b.allure = 2;
    if (tourDePresences(tour)) diffuserPresences([a, b], memoire, undefined, heure);
  }
  const heures = de(a, "positions").map((m) => m.h);
  assert.ok(heures.length >= 18);
  for (let i = 1; i < heures.length; i++) assert.equal(heures[i]! - heures[i - 1]!, 100);
});

test("0.9 : l'allure part avec la position ; l'arrêt part une fois, avec l'allure 0", () => {
  const a = joueur(1, 10);
  const b = joueur(2, 20);
  const memoire: MemoirePresences = new Map();
  diffuserPresences([a, b], memoire, undefined, 1000);
  b.vu = { ...b.vu, x: 21 };
  b.allure = 3;
  diffuserPresences([a, b], memoire, undefined, 1100);
  assert.deepEqual(de(a, "positions").at(-1), { t: "positions", h: 1100, p: [2, 2100, 3500, 0, 3] });
  // Il s'arrête sur place : seule l'allure change, elle part une fois.
  b.allure = 0;
  diffuserPresences([a, b], memoire, undefined, 1200);
  diffuserPresences([a, b], memoire, undefined, 1300);
  diffuserPresences([a, b], memoire, undefined, 1400);
  assert.equal(de(a, "positions").length, 2);
  assert.deepEqual(de(a, "positions").at(-1)!.p, [2, 2100, 3500, 0, 0]);
  // Il s'accroupit sans bouger (allure 1 immobile n'existe pas : un immobile vaut 0), puis repart accroupi.
  b.vu = { ...b.vu, x: 21.5 };
  b.allure = 1;
  diffuserPresences([a, b], memoire, undefined, 1500);
  assert.deepEqual(de(a, "positions").at(-1)!.p, [2, 2150, 3500, 0, 1]);
});

test("0.9 : à l'entrée dans le champ, l'allure vaut 0 dans « autres » ; elle part au tour suivant si elle diffère", () => {
  const a = joueur(1, 0);
  const b = joueur(2, RAYON_INTERET + 5);
  const memoire: MemoirePresences = new Map();
  diffuserPresences([a, b], memoire);
  b.vu = { ...b.vu, x: RAYON_INTERET - 1 };
  b.allure = 2;
  diffuserPresences([a, b], memoire, undefined, 5000);
  assert.deepEqual(a.recus.map((m) => m.t), ["autres"]);
  // Il marche : au tour suivant, sa position et son allure.
  b.vu = { ...b.vu, x: RAYON_INTERET - 1.24 };
  diffuserPresences([a, b], memoire, undefined, 5100);
  assert.deepEqual(a.recus.map((m) => m.t), ["autres", "positions"], "l'identité, puis l'allure qu'il a vraiment");
  assert.deepEqual(de(a, "positions")[0]!.p, [2, Math.round((RAYON_INTERET - 1.24) * 100), 3500, 0, 2]);
  // Immobile à l'entrée : rien de plus que l'identité (b s'est arrêté entre-temps).
  b.allure = 0;
  diffuserPresences([a, b], memoire);
  const c = joueur(3, 5);
  diffuserPresences([a, b, c], memoire);
  assert.equal(a.recus.at(-1)!.t, "autres");
});

test("0.9 : un geste n'est reçu que par ceux qui voient le joueur, et une seule fois", () => {
  const a = joueur(1, 10);
  const b = joueur(2, 20);
  const loin = joueur(3, 20 + RAYON_INTERET + 5);
  const derriere = joueur(4, 25);
  const memoire: MemoirePresences = new Map();
  // Un mur entre « derriere » et les autres.
  const vue = (_l: string, p: { x: number }, q: { x: number }) => (p.x === 25) === (q.x === 25);
  diffuserPresences([a, b, loin, derriere], memoire, vue);
  b.gestes = [geste(2, 1234, { appuye: true, objet: "marteau", duree: 0.95 })];
  diffuserPresences([a, b, loin, derriere], memoire, vue);
  diffuserPresences([a, b, loin, derriere], memoire, vue);
  assert.deepEqual(de(a, "gestes"), [{ t: "gestes", g: [{ id: 2, h: 1234, geste: "frappe", appuye: true, objet: "marteau", duree: 0.95 }] }]);
  assert.equal(de(loin, "gestes").length, 0, "trop loin");
  assert.equal(de(derriere, "gestes").length, 0, "derrière un mur");
  assert.equal(de(b, "gestes").length, 0, "on ne se renvoie pas ses propres gestes");
  assert.equal(b.gestes.length, 0, "la file est vidée après l'envoi");
  // Personne ne le voit : la file se vide quand même (rien ne s'accumule).
  const seul = joueur(5, 0, null);
  seul.gestes = [geste(5, 1)];
  diffuserPresences([seul], new Map());
  assert.equal(seul.gestes.length, 0);
});

test("0.9 : celui qui s'effondre et quitte le lieu : ceux qui le voyaient reçoivent sa chute avant la liste qui le retire", () => {
  const a = joueur(1, 10);
  const b = joueur(2, 20);
  const memoire: MemoirePresences = new Map();
  diffuserPresences([a, b], memoire);
  b.gestes = [geste(2, 50, { geste: "effondre" })];
  b.lieu = null;
  diffuserPresences([a, b], memoire);
  assert.deepEqual(a.recus.slice(1).map((m) => m.t), ["gestes", "autres"]);
  assert.equal(de(a, "gestes")[0]!.g[0]!.geste, "effondre");
  assert.equal(de(b, "gestes").length, 0);
});

test("0.9 : un joueur immobile ne coûte toujours rien", () => {
  const a = joueur(1, 10);
  const b = joueur(2, 20);
  const c = joueur(3, 25);
  const memoire: MemoirePresences = new Map();
  diffuserPresences([a, b, c], memoire);
  const avant = a.recus.length + b.recus.length + c.recus.length;
  for (let i = 0; i < 20; i++) diffuserPresences([a, b, c], memoire);
  assert.equal(a.recus.length + b.recus.length + c.recus.length, avant);
});

test("0.9 : l'arme dans le dos fait partie de l'identité : elle renvoie « autres » quand elle change", () => {
  const a = joueur(1, 0);
  const b = joueur(2, 5);
  const memoire: MemoirePresences = new Map();
  diffuserPresences([a, b], memoire);
  b.vu = { ...b.vu, dos: "fourche_foin" };
  diffuserPresences([a, b], memoire);
  diffuserPresences([a, b], memoire);
  assert.equal(de(a, "autres").length, 2);
  assert.equal(de(a, "autres")[1]!.joueurs[0]!.dos, "fourche_foin");
});

// ---------- Au joueur : les gestes notés, l'allure, l'arme dans le dos ----------

/** Un joueur à la halte (comme combat.test.ts), avec un Éteint placé où l'on veut. */
function aLaHalte(inventaire: Record<string, number>, eteint: { x: number; z: number } | null = null) {
  const base = new Base(":memory:");
  const halte = new Halte(base, () => 0.5);
  const compte = base.creerCompte("Rose", "potager42", "charbonniers");
  base.sauverInventaire(compte.id, inventaire);
  let instant = 1_000_000;
  const joueur = new Joueur(compte, base, () => {}, () => instant, halte, () => 0.5);
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
  joueur.recevoir({ t: "arrivee" });
  halte.eteints = eteint ? [nouvelEteint(99, eteint.x, eteint.z, "poursuivant")] : [];
  joueur.position = { x: 40, z: 34.6, o: 0 };
  joueur.gestesRecents.length = 0;
  return { joueur, halte, attendre, maintenant: () => instant };
}

test("0.9 : la frappe est notée avec l'arme, le coup appuyé et la durée du geste (s), à l'heure du serveur", () => {
  const t = aLaHalte({ marteau: 1 }, { x: 40, z: 35.5 });
  t.joueur.recevoir({ t: "equiper", objet: "marteau" });
  t.joueur.recevoir({ t: "frapper", appuye: true });
  const marteau = ARMES_COMMUNES.find((a) => a.objet === "marteau")!;
  assert.deepEqual(t.joueur.gestesRecents, [{ id: t.joueur.compte.id, h: t.maintenant(), geste: "frappe", appuye: true, objet: "marteau", duree: marteau.coupAppuye / 1000 }]);
});

test("0.9 : tenu, A est un geste de dégagement, pas une frappe ; esquive, poussée et morsure sont notées", () => {
  const t = aLaHalte({ marteau: 1 }, { x: 40, z: 35.2 });
  t.attendre(0.8);
  t.joueur.gestesRecents.length = 0;
  t.joueur.recevoir({ t: "frapper", appuye: false });
  t.joueur.recevoir({ t: "degager" });
  assert.deepEqual(t.joueur.gestesRecents.map((g) => g.geste), ["degagement", "degagement"]);
  // La morsure : le coup reçu.
  const m = aLaHalte({}, { x: 40, z: 35.2 });
  m.attendre(0.8 + 3.2);
  assert.ok(m.joueur.gestesRecents.some((g) => g.geste === "touche"), "mordu : le geste du coup reçu");
  const u = aLaHalte({}, null);
  u.joueur.recevoir({ t: "repousser" });
  u.joueur.recevoir({ t: "esquiver", dx: 1, dz: 0 });
  assert.deepEqual(u.joueur.gestesRecents.map((g) => g.geste), ["poussee", "esquive"]);
});

test("0.9 : l'allure montrée suit le pas : immobile, marche, course", () => {
  const t = aLaHalte({}, null);
  assert.equal(t.joueur.allureVue, 0);
  t.joueur.recevoir({ t: "intention", dx: 1, dz: 0, allure: "marche", seq: 1 });
  t.attendre(0.2);
  assert.equal(t.joueur.allureVue, 2);
  t.joueur.recevoir({ t: "intention", dx: 1, dz: 0, allure: "course", seq: 2 });
  t.attendre(0.2);
  assert.equal(t.joueur.allureVue, 3);
  t.joueur.recevoir({ t: "intention", dx: 1, dz: 0, allure: "discrete", seq: 3 });
  t.attendre(0.2);
  assert.equal(t.joueur.allureVue, 1);
  t.joueur.recevoir({ t: "intention", dx: 0, dz: 0, allure: "marche", seq: 4 });
  t.attendre(0.2);
  assert.equal(t.joueur.allureVue, 0);
});

test("0.9 : équiper la fourche la met dans le dos (vu.dos) ; une arme non encombrante ne l'y met pas", () => {
  assert.deepEqual(ARMES_DANS_LE_DOS, ["fourche_foin"]);
  const t = aLaHalte({ fourche_foin: 1, marteau: 1 }, null);
  t.joueur.recevoir({ t: "equiper", objet: "marteau" });
  assert.equal(t.joueur.vu.dos, undefined);
  t.joueur.recevoir({ t: "equiper", objet: "fourche_foin" });
  assert.equal(t.joueur.vu.dos, "fourche_foin");
  const sansFourche = aLaHalte({ marteau: 1 }, null);
  assert.equal(sansFourche.joueur.vu.dos, undefined);
});

test("0.9 : le début et la fin d'une action sont notés, avec son libellé ; l'action interrompue aussi", () => {
  // Mordu, il saigne ; l'Éteint parti, il se panse.
  const t = aLaHalte({ pansement: 2 }, { x: 40, z: 35.2 });
  t.attendre(0.8 + 3.2);
  t.halte.eteints = [];
  t.attendre(0.1);
  t.joueur.gestesRecents.length = 0;
  t.joueur.recevoir({ t: "panser" });
  assert.deepEqual(t.joueur.gestesRecents.map((g) => [g.geste, g.action]), [["action", "Faire un pansement"]]);
  // Un pas l'interrompt.
  t.joueur.recevoir({ t: "intention", dx: 1, dz: 0, allure: "marche", seq: 1 });
  t.attendre(0.1);
  t.joueur.recevoir({ t: "intention", dx: 0, dz: 0, allure: "marche", seq: 2 });
  t.attendre(0.1);
  assert.deepEqual(t.joueur.gestesRecents.map((g) => g.geste), ["action", "fin_action"]);
  // Repris et mené au bout.
  t.joueur.gestesRecents.length = 0;
  t.joueur.recevoir({ t: "panser" });
  t.attendre(6.1);
  assert.deepEqual(t.joueur.gestesRecents.map((g) => g.geste), ["action", "fin_action"]);
});

// ---------- 0.9, chantier B : un joueur endormi se voit endormi, même pour qui arrive après ----------

test("0.9 : se coucher renvoie l'identité avec « couche » ; un observateur qui arrive après le reçoit couché", () => {
  const a = joueur(1, 0);
  const b = joueur(2, 5);
  const memoire: MemoirePresences = new Map();
  diffuserPresences([a, b], memoire);
  assert.equal(de(a, "autres")[0]!.joueurs[0]!.couche, undefined, "debout : rien");
  b.vu = { ...b.vu, couche: true };
  diffuserPresences([a, b], memoire);
  assert.equal(de(a, "autres").length, 2, "le coucher change l'identité");
  assert.equal(de(a, "autres")[1]!.joueurs[0]!.couche, true);
  // c arrive après le coucher : il le reçoit couché dès l'entrée dans le champ.
  const c = joueur(3, 8);
  diffuserPresences([a, b, c], memoire);
  assert.equal(de(c, "autres")[0]!.joueurs.find((j) => j.id === 2)!.couche, true);
  // Il se réveille : l'identité repart, sans « couche ».
  const { couche: _, ...debout } = b.vu;
  b.vu = debout;
  diffuserPresences([a, b, c], memoire);
  assert.equal(de(c, "autres").at(-1)!.joueurs.find((j) => j.id === 2)!.couche, undefined);
});
