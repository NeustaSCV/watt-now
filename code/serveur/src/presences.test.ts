// Les présences allégées : l'identité une fois, puis seulement les positions des joueurs proches.

import { test } from "node:test";
import assert from "node:assert/strict";
import { APPARENCES_DE_REFERENCE } from "../../commun/src/apparence.ts";
import type { AutreVu, MessageServeur } from "../../commun/src/messages.ts";
import { RAYON_INTERET, diffuserPresences, type MemoirePresences, type Observateur } from "./presences.ts";

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
  assert.deepEqual(de(a, "positions")[0]!.p, [2, 21, 35, 0], "seul celui qui a bougé part");
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
