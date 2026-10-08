// La volaille du terrain (2026-10-08) : méfiance selon l'allure, chasse au gourdin, plumer, rôtir.

import { test } from "node:test";
import assert from "node:assert/strict";
import { MEFIANCE, nouvellePoule, penserPoule } from "../../commun/src/faune.ts";
import { distanceMare, rayonMare, MARE } from "../../commun/src/terrain.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

const toujours = () => 0;

test("une poule picore ; à la marche elle détale de loin, en allure discrète on l'approche à un mètre", () => {
  const p = nouvellePoule(1, toujours);
  p.x = 20;
  p.z = 20;
  penserPoule(p, 0.1, { x: 20, z: 20 + MEFIANCE.marche.fuite - 0.5, allure: "marche", bouge: true }, toujours);
  assert.equal(p.etat, "fuit");

  const q = nouvellePoule(2, toujours);
  q.x = 20;
  q.z = 20;
  penserPoule(q, 0.1, { x: 20, z: 21.3, allure: "discrete", bouge: true }, toujours);
  assert.equal(q.etat, "inquiete", "elle guette, mais reste");
});

test("assommer : au gourdin, une poule calme se prend ; on la plume, on la rôtit au feu", () => {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "mecanistes");
  let instant = 10_000_000;
  const recus: MessageServeur[] = [];
  const j = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), () => 0, new Comptoir(base, instant));
  const inv = { gourdin: 1, couteau: 1, briquet: 1, buche: 2, branche: 3, pierre: 5 };
  (j as unknown as { inventaire: Record<string, number> }).inventaire = { sac_a_dos: 1, ...inv };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const attendre = (s: number) => {
    for (let i = 0; i < s * 10; i++) {
      instant += 100;
      j.tick(0.1);
    }
  };
  const poules = j.bienvenue(0).animaux!;
  assert.equal(poules.length, 3);
  const p = poules[0]!;
  j.position = { x: p.x, z: p.z - 1, o: 0 };
  j.recevoir({ t: "interagir", cible: { genre: "animal", id: p.id }, verbe: "assommer" });
  assert.equal(dernier("inventaire")!.inventaire.poule, 1, "une poule calme, au gourdin : prise");
  assert.equal(dernier("animaux")!.animaux.length, 2, "les autres restent (elles reviendront à trois dans 2 h)");

  j.recevoir({ t: "fabriquer", recette: "volaille" });
  attendre(3);
  assert.equal(dernier("inventaire")!.inventaire.volaille_crue, 4);

  j.position = { x: 20, z: 20, o: 0 };
  j.recevoir({ t: "construire_feu", x: 21, z: 20 });
  attendre(5);
  j.recevoir({ t: "interagir", cible: { genre: "feu", id: 1 }, verbe: "allumer" });
  attendre(3);
  j.recevoir({ t: "interagir", cible: { genre: "feu", id: 1 }, verbe: "rotir" });
  attendre(13);
  assert.equal(dernier("inventaire")!.inventaire.volaille_cuite, 4);
  assert.equal(dernier("inventaire")!.inventaire.volaille_crue, undefined);
});

test("la mare a un bord irrégulier : ni cercle, ni trou", () => {
  const rayons = Array.from({ length: 36 }, (_, i) => rayonMare((i / 36) * Math.PI * 2));
  assert.ok(Math.max(...rayons) - Math.min(...rayons) > 1, "une anse et une avancée");
  assert.ok(Math.min(...rayons) > 1.5);
  assert.ok(distanceMare(MARE.x, MARE.z) < 0, "le centre est dans l'eau");
});
