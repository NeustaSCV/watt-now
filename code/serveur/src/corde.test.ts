// Les joncs au bord de la mare : des fibres, puis une corde tressée (le geste de base du bushcraft).

import { test } from "node:test";
import assert from "node:assert/strict";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { MARE } from "../../commun/src/terrain.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

test("un terrain a ses joncs au bord de la mare ; un ancien terrain les reçoit aussi", () => {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "mecanistes");
  const joncs = base.chargerRessources(compte.id).filter((r) => r.type === "joncs");
  assert.ok(joncs.length >= 5);
  for (const j of joncs) assert.ok(Math.hypot(j.x - MARE.x, j.z - MARE.z) < MARE.rayon + 1.5, "au bord de l'eau");
  // Un terrain d'avant les joncs : ils apparaissent au chargement, une seule fois.
  (base as unknown as { db: { prepare(s: string): { run(...a: unknown[]): void } } }).db.prepare("DELETE FROM ressources WHERE type = 'joncs'").run();
  const apres = base.chargerRessources(compte.id).filter((r) => r.type === "joncs").length;
  assert.equal(apres, joncs.length);
  assert.equal(base.chargerRessources(compte.id).filter((r) => r.type === "joncs").length, apres, "pas de doublon");
  base.fermer();
});

test("couper des joncs donne des fibres ; quatre fibres font une corde", () => {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Nadia", "enclume42", "charbonniers");
  base.sauverInventaire(compte.id, { couteau: 1 });
  let instant = 10_000_000;
  const halte = new Halte(base);
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 1, new Comptoir(base, instant));
  const attendre = (s: number) => {
    for (let i = 0; i < s; i++) {
      instant += 1000;
      joueur.tick(1);
    }
  };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const joncs = joueur.bienvenue(0).ressources.filter((r) => r.type === "joncs");
  for (const j of joncs.slice(0, 2)) {
    joueur.position = { x: j.x, z: j.z - 0.5, o: 0 };
    joueur.recevoir({ t: "interagir", cible: { genre: "ressource", id: j.id }, verbe: "ramasser" });
    attendre(5);
  }
  assert.equal(dernier("inventaire")!.inventaire.fibres, 4);
  joueur.recevoir({ t: "fabriquer", recette: "corde" });
  attendre(25);
  const inv = dernier("inventaire")!.inventaire;
  assert.equal(inv.corde, 1);
  assert.equal(inv.fibres, undefined);
  base.fermer();
});
