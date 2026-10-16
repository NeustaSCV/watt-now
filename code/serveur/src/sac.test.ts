// Le sac perdu à l'effondrement (2026-10-08) : il ne reste que les poches (10 kg) ; un sac de fortune porte 30 kg.

import { test } from "node:test";
import assert from "node:assert/strict";
import { CAPACITE_POCHES, capaciteDe } from "../../commun/src/objets.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

test("la capacité vient de ce qu'on porte : poches 10 kg, sac de fortune 30 kg, sac à dos 55 kg", () => {
  assert.equal(capaciteDe({}), CAPACITE_POCHES);
  assert.equal(capaciteDe({ sac_fortune: 1 }), 30);
  assert.equal(capaciteDe({ sac_fortune: 1, sac_a_dos: 1 }), 55);
});

test("effondré, on n'a plus que ses poches ; on fabrique un sac de fortune ; un sac par terre se prend d'abord", () => {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "mecanistes");
  let instant = 10_000_000;
  const recus: MessageServeur[] = [];
  const j = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), () => 0, new Comptoir(base, instant));
  const attendre = (s: number) => {
    for (let i = 0; i < s * 10; i++) {
      instant += 100;
      j.tick(0.1);
    }
  };
  const infos = () => recus.filter((m) => m.t === "info").map((m) => (m as { texte: string }).texte);
  (j as unknown as { effondrer: (r: string) => void }).effondrer("Ils sont trop nombreux.");
  assert.match(infos().at(-1)!, /poches \(10 kg\).*sac de fortune/);

  // 8,2 kg en poche : une pierre de plus (2 kg) dépasserait les 10 kg.
  (j as unknown as { inventaire: Record<string, number> }).inventaire = { pierre: 2, branche: 4, corde: 2, couteau: 1 };
  const pierre = j.bienvenue(0).ressources.find((r) => r.type === "pierre")!;
  j.position = { x: pierre.x, z: pierre.z, o: 0 };
  j.recevoir({ t: "interagir", cible: { genre: "ressource", id: pierre.id }, verbe: "ramasser" });
  // Deux messages courts : la pierre et ses 2 kg, les poches à 8,2 kg sur 10 (0.8.2), puis comment s'en sortir sans sac.
  assert.match(infos().slice(-2).join(" "), /^Pierre, 2 kg : trop lourd, tes poches sont à 8,2 kg sur 10\..*sac de fortune/);

  j.recevoir({ t: "fabriquer", recette: "sac_fortune" });
  attendre(3);
  const inv = (j as unknown as { inventaire: Record<string, number> }).inventaire;
  assert.equal(inv.sac_fortune, 1);
  assert.equal(capaciteDe(inv), 30);

  // Le sac à dos jeté par terre avec 40 kg : on le prend d'abord, et il fait de la place pour le reste.
  const j2 = j as unknown as { inventaire: Record<string, number> };
  j2.inventaire = { sac_a_dos: 1, batterie_voiture: 2 };
  j.recevoir({ t: "jeter", objet: "batterie_voiture", quantite: 2 });
  j2.inventaire = {};
  const tas = (recus.findLast((m) => m.t === "sacs") as Extract<MessageServeur, { t: "sacs" }>).sacs.find((s) => s.jete)!;
  // On met le sac à dos dans le même tas (comme s'il avait été jeté avec).
  (j as unknown as { sacsTerrain: { id: number; contenu: { inventaire: Record<string, number> } }[] }).sacsTerrain.find((s) => s.id === tas.id)!.contenu.inventaire.sac_a_dos = 1;
  j.position = { x: tas.x, z: tas.z, o: 0 };
  j.recevoir({ t: "interagir", cible: { genre: "sac", id: tas.id }, verbe: "reprendre" });
  attendre(2);
  assert.deepEqual(j2.inventaire, { sac_a_dos: 1, batterie_voiture: 2 }, "le sac d'abord, puis 36 kg de batteries");
});
