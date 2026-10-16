// Déconnexion d'office après quelques minutes sans rien faire (2026-10-08) : hors ligne, les besoins sont gelés.

import { test } from "node:test";
import assert from "node:assert/strict";
import { FERMETURE_INACTIF } from "../../commun/src/messages.ts";
import { Base } from "./base.ts";
import { Monde, estUnGeste } from "./monde.ts";
import { REGLAGES } from "../../commun/src/reglages.ts";

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

test("en pause (0.10.1, C2) : jamais déconnecté pour inactivité ; hors pause, au bout de « inactivite_min »", () => {
  const base = new Base(":memory:");
  const monde = new Monde(base);
  const fermetures: number[] = [];
  const compte = base.creerCompte("Pause", "motdepasse1", "mecanistes");
  const socket = { readyState: 1, OPEN: 1, send() {}, on() {}, close: (code: number) => fermetures.push(code) };
  monde.rejoindre(compte, socket as never);
  const connexions = monde["connexions"] as Map<number, { activite: number; joueur: { enPause(): boolean } }>;
  const c = [...connexions.values()][0]!;
  let pause = true;
  c.joueur.enPause = () => pause;
  // Dix minutes de pause, sans un geste : toujours là.
  c.activite -= 10 * 60_000;
  monde["deconnecterInactifs"]();
  assert.deepEqual(fermetures, []);
  // La pause finie, le compte repart de zéro : une minute plus tard, toujours là…
  pause = false;
  c.activite -= 60_000;
  monde["deconnecterInactifs"]();
  assert.deepEqual(fermetures, []);
  // … et au bout de « inactivite_min » sans geste, déconnecté.
  c.activite -= REGLAGES.inactivite_min * 60_000;
  monde["deconnecterInactifs"]();
  assert.deepEqual(fermetures, [FERMETURE_INACTIF]);
  monde.arreter();
});
