// Ce qui flotte au-dessus des voyageurs (duel 0.11, D-16, D-19, D-21) : les jauges se dessinent puis s'effacent, un témoin
// qui arrive pendant un duel les voit, la fuite se compte, les étiquettes s'écartent et évitent les messages.

import { test } from "node:test";
import assert from "node:assert/strict";
import { DUREE_FUITE_MS, EtatDuels, contenuEtiquette, ecarter, htmlFin, sousLaBande } from "./etiquettes.ts";

const PAUL = { id: 7, pseudo: "Paul" };
const MOI = { id: 3, pseudo: null };
const LUCIE = { id: 9, pseudo: "Lucie" };

test("les jauges se dessinent au premier `duels`, suivent les coups, puis s'effacent (liste vide)", () => {
  const e = new EtatDuels();
  assert.equal(contenuEtiquette(PAUL, e, 0).jauge, null);
  assert.equal(contenuEtiquette(MOI, e, 0).nom, null, "pas de « Toi » hors duel");
  assert.deepEqual(e.recevoir([{ a: 3, b: 7, ja: 1, jb: 0.94 }]), []);
  assert.equal(contenuEtiquette(PAUL, e, 0).jauge, 0.94);
  assert.equal(contenuEtiquette(MOI, e, 0).nom, "Toi");
  assert.equal(contenuEtiquette(MOI, e, 0).jauge, 1);
  // Paul me touche : ma jauge baisse, je suis le touché.
  assert.deepEqual(e.recevoir([{ a: 3, b: 7, ja: 0.88, jb: 0.94 }]), [3]);
  assert.equal(contenuEtiquette(LUCIE, e, 0).jauge, null, "un témoin n'a pas de jauge");
  e.recevoir([]);
  assert.equal(contenuEtiquette(PAUL, e, 0).jauge, null);
  assert.equal(contenuEtiquette(MOI, e, 0).nom, null);
});

test("à la fin d'un duel, les deux jauges s'effacent tout de suite", () => {
  const e = new EtatDuels();
  e.recevoir([{ a: 3, b: 7, ja: 0.2, jb: 0.5 }, { a: 9, b: 11, ja: 1, jb: 1 }]);
  e.finir(3, 7);
  assert.equal(e.enDuel(3) || e.enDuel(7), false);
  assert.equal(e.enDuel(9) && e.enDuel(11), true, "l'autre duel continue");
});

test("un témoin qui arrive pendant un duel voit les jauges, même si `duels` arrive avant son identité", () => {
  const e = new EtatDuels();
  // Le serveur lui envoie la liste des duels en vue au premier tour des présences.
  e.recevoir([{ a: 7, b: 9, ja: 0.62, jb: 0.4 }]);
  // Les étiquettes de Paul et Lucie se créent ensuite : elles lisent l'état.
  assert.equal(contenuEtiquette(PAUL, e, 0).jauge, 0.62);
  assert.equal(contenuEtiquette(LUCIE, e, 0).jauge, 0.4);
  assert.equal(e.duelliste(7)?.adversaire, 9);
});

test("bas de jauge à l'ocre sous 30 % ; la fuite se compte de 10 à 1 s (« trop loin · N s »)", () => {
  const e = new EtatDuels();
  e.recevoir([{ a: 3, b: 7, ja: 0.25, jb: 0.9, loinDepuis: 50_000 }]);
  const moi = contenuEtiquette(MOI, e, 50_000);
  assert.equal(moi.bas, true);
  assert.equal(contenuEtiquette(PAUL, e, 50_000).bas, false);
  assert.equal(moi.compte, "trop loin · 10 s");
  assert.equal(contenuEtiquette(PAUL, e, 50_000 + 3_200).compte, "trop loin · 7 s");
  assert.equal(contenuEtiquette(PAUL, e, 50_000 + DUREE_FUITE_MS + 500).compte, "trop loin · 1 s", "jamais 0 ni négatif");
  e.recevoir([{ a: 3, b: 7, ja: 0.25, jb: 0.9 }]);
  assert.equal(contenuEtiquette(PAUL, e, 60_000).compte, null, "revenus assez près");
});

test("deux étiquettes qui se chevauchent s'écartent ; loin l'une de l'autre, elles ne bougent pas", () => {
  const dx = ecarter([
    { x: 200, y: 300, l: 80, h: 30 },
    { x: 220, y: 302, l: 80, h: 30 },
  ]);
  const gauche = 200 + dx[0]!;
  const droite = 220 + dx[1]!;
  assert.ok(droite - gauche >= 80 + 6 - 1e-9, "côte à côte, sans se toucher");
  assert.ok(Math.abs(dx[0]! + dx[1]!) < 1e-9, "chacune fait la moitié du chemin");
  assert.deepEqual(ecarter([{ x: 100, y: 300, l: 80, h: 30 }, { x: 400, y: 300, l: 80, h: 30 }]), [0, 0]);
  assert.deepEqual(ecarter([{ x: 200, y: 100, l: 80, h: 30 }, { x: 210, y: 300, l: 80, h: 30 }]), [0, 0], "l'une au-dessus de l'autre");
});

test("une étiquette ne tombe pas dans la bande des messages", () => {
  const bande = { gauche: 216, droite: 596, bas: 120 };
  // Sous la bande : elle passe juste dessous (son haut à 4 px du bas des messages).
  assert.equal(sousLaBande({ x: 400, y: 110, l: 80, h: 30 }, bande), 120 + 4 + 30);
  // Plus bas, ou à côté : rien ne change.
  assert.equal(sousLaBande({ x: 400, y: 260, l: 80, h: 30 }, bande), 260);
  assert.equal(sousLaBande({ x: 100, y: 110, l: 80, h: 30 }, bande), 110);
  assert.equal(sousLaBande({ x: 400, y: 110, l: 80, h: 30 }, null), 110);
});

test("la fin : « + machette », « − machette » (l'icône et le nom), « sac vide »", () => {
  assert.match(htmlFin("plus", "machette"), /<svg[^]*\+<\/span><span>machette[^<]*<\/span>/);
  assert.match(htmlFin("moins", "machette"), /−<\/span><span>machette[^<]*<\/span>/);
  assert.match(htmlFin("vide"), /<span>sac vide<\/span>/);
  assert.ok(!/clé/i.test(htmlFin("vide") + htmlFin("plus", "machette")));
});
