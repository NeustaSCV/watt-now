// Tests du lot 3 de l'É4 : l'échange entre joueurs, une fenêtre et deux accords (Book 07 §5, Book 21 §3.2).

import { test } from "node:test";
import assert from "node:assert/strict";
import type { MessageServeur, OperationEchange } from "../../commun/src/messages.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Echanges } from "./echange.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

function monter(invA: Record<string, number>, invB: Record<string, number>, wottsB = 0) {
  const base = new Base(":memory:");
  const instant = 1_000_000;
  const halte = new Halte(base);
  const comptoir = new Comptoir(base, instant);
  const creer = (pseudo: string, inv: Record<string, number>, wotts: number, x: number) => {
    const compte = base.creerCompte(pseudo, "potager42", "mecanistes");
    base.sauverInventaire(compte.id, { sac_a_dos: 1, ...inv });
    base.sauverPosition(compte.id, { x, z: 20, o: 0 }, "comptoir", instant);
    base.sauverWotts(compte.id, { valeur: wotts, majLe: instant }, { valeur: 0, majLe: instant });
    const recus: MessageServeur[] = [];
    const j = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 1, comptoir);
    j.position = { x, z: 20, o: 0 };
    const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
    return { j, recus, dernier };
  };
  const a = creer("Rose", invA, 0, 20);
  const b = creer("Malo", invB, wottsB, 21.5);
  const joueurs = new Map([[a.j.compte.id, a.j], [b.j.compte.id, b.j]]);
  const echanges = new Echanges((id) => joueurs.get(id));
  const op = (qui: Joueur, o: OperationEchange) => echanges.traiter(qui, o);
  return { a, b, echanges, op, base };
}

test("proposer, accepter, poser ses offres, être d'accord : l'échange se fait d'un seul coup", () => {
  const t = monter({ buche: 4 }, { conserve: 1 }, 50);
  t.op(t.a.j, { genre: "proposer", a: t.b.j.compte.id });
  assert.equal(t.b.dernier("demande_echange")!.de.pseudo, "Rose");
  t.op(t.b.j, { genre: "repondre", accepte: true });
  assert.equal(t.a.dernier("echange")!.echange!.avec.pseudo, "Malo");

  t.op(t.a.j, { genre: "offrir", offre: { objets: { buche: 4 }, wotts: 0 } });
  t.op(t.b.j, { genre: "offrir", offre: { objets: { conserve: 1 }, wotts: 20 } });
  assert.deepEqual(t.a.dernier("echange")!.echange!.lui, { objets: { conserve: 1 }, wotts: 20 });

  // Rose est d'accord ; Malo change son offre : l'accord de Rose tombe.
  t.op(t.a.j, { genre: "accord", oui: true });
  assert.equal(t.b.dernier("echange")!.echange!.accordLui, true);
  t.op(t.b.j, { genre: "offrir", offre: { objets: { conserve: 1 }, wotts: 15 } });
  assert.equal(t.b.dernier("echange")!.echange!.accordLui, false);

  t.op(t.a.j, { genre: "accord", oui: true });
  t.op(t.b.j, { genre: "accord", oui: true });
  assert.equal(t.a.dernier("echange")!.echange, null);
  assert.deepEqual(t.a.dernier("inventaire")!.inventaire, { sac_a_dos: 1, conserve: 1 });
  assert.deepEqual(t.b.dernier("inventaire")!.inventaire, { sac_a_dos: 1, buche: 4 });
  assert.equal(t.a.dernier("wotts")!.wotts.poche, 15);
  assert.equal(t.b.dernier("wotts")!.wotts.poche, 35);
});

test("on ne peut pas offrir ce qu'on n'a pas", () => {
  const t = monter({ buche: 1 }, {});
  t.op(t.a.j, { genre: "proposer", a: t.b.j.compte.id });
  t.op(t.b.j, { genre: "repondre", accepte: true });
  t.op(t.a.j, { genre: "offrir", offre: { objets: { buche: 3 }, wotts: 0 } });
  assert.match(t.a.dernier("info")!.texte, /n'a plus/);
  t.op(t.b.j, { genre: "offrir", offre: { objets: {}, wotts: 10 } });
  assert.match(t.b.dernier("info")!.texte, /wotts/);
});

test("la charge des batteries part avec elles", () => {
  const t = monter({ batterie_voiture: 1 }, {});
  t.op(t.a.j, { genre: "proposer", a: t.b.j.compte.id });
  t.op(t.b.j, { genre: "repondre", accepte: true });
  t.op(t.a.j, { genre: "offrir", offre: { objets: { batterie_voiture: 1 }, wotts: 0 } });
  t.op(t.a.j, { genre: "accord", oui: true });
  t.op(t.b.j, { genre: "accord", oui: true });
  assert.equal(t.b.dernier("charges")!.charges.batterie_voiture, 180);
  assert.equal(t.a.dernier("charges")!.charges.batterie_voiture, undefined);
});

test("un sac trop lourd empêche l'échange ; s'éloigner l'annule", () => {
  const t = monter({ batterie_voiture: 3 }, { pierre: 20 });
  t.op(t.a.j, { genre: "proposer", a: t.b.j.compte.id });
  t.op(t.b.j, { genre: "repondre", accepte: true });
  t.op(t.a.j, { genre: "offrir", offre: { objets: { batterie_voiture: 3 }, wotts: 0 } });
  t.op(t.a.j, { genre: "accord", oui: true });
  t.op(t.b.j, { genre: "accord", oui: true });
  assert.match(t.b.dernier("info")!.texte, /trop lourd/);
  assert.notEqual(t.a.dernier("echange")!.echange, null, "la fenêtre reste ouverte");

  t.b.j.position = { x: 40, z: 20, o: 0 };
  t.echanges.verifier();
  assert.equal(t.a.dernier("echange")!.echange, null);
  assert.match(t.a.dernier("info")!.texte, /éloignés/);
});

test("trop loin, on ne peut pas proposer ; un refus prévient le demandeur", () => {
  const t = monter({}, {});
  t.b.j.position = { x: 30, z: 20, o: 0 };
  t.op(t.a.j, { genre: "proposer", a: t.b.j.compte.id });
  assert.match(t.a.dernier("info")!.texte, /Approche-toi/);
  t.b.j.position = { x: 21.5, z: 20, o: 0 };
  t.op(t.a.j, { genre: "proposer", a: t.b.j.compte.id });
  t.op(t.b.j, { genre: "repondre", accepte: false });
  assert.match(t.a.dernier("info")!.texte, /ne veut pas/);
});

test("un échange est enregistré d'un seul bloc : une panne au milieu n'enregistre rien (0.1.1)", () => {
  const t = monter({ buche: 4 }, { conserve: 1 });
  t.op(t.a.j, { genre: "proposer", a: t.b.j.compte.id });
  t.op(t.b.j, { genre: "repondre", accepte: true });
  t.op(t.a.j, { genre: "offrir", offre: { objets: { buche: 4 }, wotts: 0 } });
  t.op(t.b.j, { genre: "offrir", offre: { objets: { conserve: 1 }, wotts: 0 } });
  // La base tombe en panne pendant le second côté de l'échange.
  const sauverWotts = t.base.sauverWotts.bind(t.base);
  let appels = 0;
  t.base.sauverWotts = (...args: Parameters<typeof sauverWotts>) => {
    if (++appels === 2) throw new Error("disque plein");
    sauverWotts(...args);
  };
  t.op(t.a.j, { genre: "accord", oui: true });
  assert.throws(() => t.op(t.b.j, { genre: "accord", oui: true }), /disque plein/);
  // Rien n'a été enregistré : ni duplication, ni perte.
  assert.deepEqual(t.base.chargerInventaire(t.a.j.compte.id), { sac_a_dos: 1, buche: 4 });
  assert.deepEqual(t.base.chargerInventaire(t.b.j.compte.id), { sac_a_dos: 1, conserve: 1 });
});
