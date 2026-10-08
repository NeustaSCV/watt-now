// Quand on s'y prend mal, le jeu dit quoi faire (2026-10-08) : chaque refus porte son indice.

import { test } from "node:test";
import assert from "node:assert/strict";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

function monter(inventaire: Record<string, number>) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "mecanistes");
  let instant = 10_000_000;
  const recus: MessageServeur[] = [];
  const j = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), () => 0, new Comptoir(base, instant));
  (j as unknown as { inventaire: Record<string, number> }).inventaire = inventaire;
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  const attendre = (s: number) => {
    for (let i = 0; i < s * 10; i++) {
      instant += 100;
      j.tick(0.1);
    }
  };
  return { j, infos, attendre };
}

test("assommer une poule à mains nues : on dit qu'il faut un gourdin, et comment le tailler", () => {
  const t = monter({});
  const p = t.j.bienvenue(0).animaux![0]!;
  t.j.position = { x: p.x, z: p.z - 1, o: 0 };
  t.j.recevoir({ t: "interagir", cible: { genre: "animal", id: p.id }, verbe: "assommer" });
  assert.match(t.infos().at(-1)!, /gourdin.*Tailler un gourdin/);
});

test("sac trop lourd : on dit de combien, et comment s'en sortir", () => {
  const t = monter({ sac_a_dos: 1, batterie_voiture: 3, pierre: 1 });
  const branche = t.j.bienvenue(0).ressources.find((r) => r.type === "branche")!;
  t.j.position = { x: branche.x, z: branche.z, o: 0 };
  t.j.recevoir({ t: "interagir", cible: { genre: "ressource", id: branche.id }, verbe: "ramasser" });
  assert.match(t.infos().at(-1)!, /trop lourd \(58 kg sur 55\).*Jeter.*coffre/);
});

test("un outil manque : on dit lequel, et où le trouver", () => {
  const t = monter({});
  const velo = t.j.bienvenue(0).ressources.find((r) => r.type === "velo")!;
  t.j.position = { x: velo.x + 1, z: velo.z, o: 0 };
  t.j.recevoir({ t: "interagir", cible: { genre: "ressource", id: velo.id }, verbe: "demonter" });
  assert.match(t.infos().at(-1)!, /clé plate.*caisse à outils/);
});

test("rassasié, on ne gaspille pas sa nourriture ; un indice ne se répète pas aussitôt", () => {
  // Des noix : sèches, elles ne désaltèrent pas (une pomme, juteuse, reste permise quand on a soif).
  const t = monter({ noix: 2 });
  t.j.recevoir({ t: "manger", objet: "noix" });
  assert.match(t.infos().at(-1)!, /plus faim/);
  // L'indice des poules, déclenché deux fois de suite : une seule fois à l'écran.
  const indice = (t.j as unknown as { indice: (s: string, x: string) => void }).indice.bind(t.j);
  indice("essai", "Un conseil.");
  indice("essai", "Un conseil.");
  assert.equal(t.infos().filter((x) => x === "Un conseil.").length, 1);
});

test("manger désaltère aussi : une pomme apporte ≈ 0,13 L d'eau", () => {
  const t = monter({ pomme: 1 });
  const j = t.j as unknown as { besoins: { kcal: number; eau: number; repos: number } };
  j.besoins = { kcal: 1000, eau: 1, repos: 1 };
  t.j.recevoir({ t: "manger", objet: "pomme" });
  t.attendre(2);
  assert.ok(Math.abs(j.besoins.eau - 1.13) < 0.01, `${j.besoins.eau} L`);
});
