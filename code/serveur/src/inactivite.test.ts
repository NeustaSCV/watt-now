// Déconnexion d'office après quelques minutes sans rien faire (2026-10-08) : hors ligne, les besoins sont gelés.

import { test } from "node:test";
import assert from "node:assert/strict";
import { FERMETURE_INACTIF } from "../../commun/src/messages.ts";
import { Base } from "./base.ts";
import { Monde, estUnGeste } from "./monde.ts";

test("ce qui compte comme un geste : bouger, agir ; pas un ping, ni « je ne bouge pas »", () => {
  assert.equal(estUnGeste({ t: "ping", envoye: 1 }), false);
  assert.equal(estUnGeste({ t: "mesures", ips: 60, ipsBas: 50, appareil: "x", qualite: "haute" }), false);
  assert.equal(estUnGeste({ t: "intention", dx: 0, dz: 0, allure: "marche", seq: 1 }), false);
  assert.equal(estUnGeste({ t: "intention", dx: 1, dz: 0, allure: "marche", seq: 2 }), true);
  assert.equal(estUnGeste({ t: "boire" }), true);
});

test("un joueur qui ne fait rien depuis 5 minutes est déconnecté ; un joueur qui bouge, non", () => {
  const base = new Base(":memory:");
  const monde = new Monde(base);
  const fermetures: number[] = [];
  const brancher = (pseudo: string) => {
    const compte = base.creerCompte(pseudo, "motdepasse1", "mecanistes");
    const ecouteurs: Record<string, (d: Buffer) => void> = {};
    const socket = {
      readyState: 1,
      OPEN: 1,
      send() {},
      on(ev: string, f: (d: Buffer) => void) {
        ecouteurs[ev] = f;
      },
      close(code: number) {
        fermetures.push(code);
      },
    };
    monde.rejoindre(compte, socket as never);
    return { compte, envoyer: (m: unknown) => ecouteurs.message?.(Buffer.from(JSON.stringify(m))) };
  };
  const immobile = brancher("Immobile");
  const actif = brancher("Actif");
  // Six minutes passent : l'un a bougé il y a peu, l'autre n'a envoyé que des pings.
  const connexions = monde["connexions"] as Map<number, { activite: number }>;
  for (const c of connexions.values()) c.activite -= 6 * 60_000;
  immobile.envoyer({ t: "ping", envoye: 1 });
  actif.envoyer({ t: "intention", dx: 1, dz: 0, allure: "marche", seq: 1 });
  monde["deconnecterInactifs"]();
  assert.deepEqual(fermetures, [FERMETURE_INACTIF]);
  monde.arreter();
});
