// Un geste long arrêté en cours de route garde sa progression (2026-10-08).

import { test } from "node:test";
import assert from "node:assert/strict";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

test("démonter le vélo : arrêté à mi-chemin, on reprend là où l'on s'était arrêté", () => {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "mecanistes");
  let instant = 10_000_000;
  const recus: MessageServeur[] = [];
  const j = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), () => 1, new Comptoir(base, instant));
  (j as unknown as { inventaire: Record<string, number> }).inventaire = { cle_plate: 1, tournevis: 1 };
  const attendre = (s: number) => {
    for (let i = 0; i < s * 10; i++) {
      instant += 100;
      j.tick(0.1);
    }
  };
  const actions = () => recus.filter((m) => m.t === "action") as Extract<MessageServeur, { t: "action" }>[];
  const velo = j.bienvenue(0).ressources.find((r) => r.type === "velo")!;
  j.position = { x: velo.x + 1, z: velo.z, o: 0 };

  j.recevoir({ t: "interagir", cible: { genre: "ressource", id: velo.id }, verbe: "demonter" });
  attendre(20);
  j.recevoir({ t: "annuler" });
  assert.equal(actions().at(-1)!.etat, "annulee");

  j.recevoir({ t: "interagir", cible: { genre: "ressource", id: velo.id }, verbe: "demonter" });
  const reprise = actions().at(-1)!;
  assert.ok(reprise.etat === "debut" && reprise.deja !== undefined && Math.abs(reprise.deja - 20 / 45) < 0.02, `reprise à ${reprise.etat === "debut" ? reprise.deja : "?"}`);
  attendre(24);
  assert.equal(actions().at(-1)!.etat, "debut", "pas encore fini");
  attendre(2);
  assert.equal(actions().at(-1)!.etat, "fin");
  assert.equal((recus.findLast((m) => m.t === "inventaire") as { inventaire: Record<string, number> }).inventaire.roue_velo, 2);
});
