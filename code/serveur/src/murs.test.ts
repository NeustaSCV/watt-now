// On ne frappe pas, on ne tire pas, on ne lance pas et l'on ne mord pas à travers un mur (0.7.1) : la règle commune
// (commun/src/murs.ts) et ce que le serveur en fait. Le décor : le mur est de la boutique de la halte (x 109,7 → 110),
// avec le joueur dedans, plaqué contre lui, et un Éteint dehors, à un mètre, de l'autre côté.

import { test } from "node:test";
import assert from "node:assert/strict";
import { DELAI_MORSURE } from "../../commun/src/combat.ts";
import { nouvelEteint } from "../../commun/src/eteints.ts";
import { DUREE_VOYAGE_S, SORTIE_TERRAIN, ZONE_COOP, ZONE_STATION, zoneCoop } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { murEntre, voieLibre } from "../../commun/src/murs.ts";
import { Base } from "./base.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

/** Dedans, plaqué contre le mur est de la boutique (le personnage a 0,35 m de rayon). */
const DEDANS = { x: 109.35, z: 14.5 };
/** Dehors, juste de l'autre côté (l'Éteint a 0,3 m de rayon) : à un mètre. */
const DEHORS = { x: 110.35, z: 14.5 };

/** Un joueur à la halte, seul avec un Éteint placé où l'on veut. */
function monter(inventaire: Record<string, number>, joueurEn: { x: number; z: number; o: number }, eteintEn: { x: number; z: number }, etat: "poursuivant" | "errant" = "errant") {
  const base = new Base(":memory:");
  const halte = new Halte(base, () => 0.5);
  const compte = base.creerCompte("Rose", "potager42", "charbonniers");
  base.sauverInventaire(compte.id, inventaire);
  let instant = 1_000_000;
  const recus: MessageServeur[] = [];
  const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, halte, () => 0.5);
  const attendre = (secondes: number, pas = 0.05) => {
    for (let s = 0; s < secondes - 1e-9; s += pas) {
      instant += pas * 1000;
      halte.tick(instant, pas);
      joueur.tick(pas);
    }
  };
  joueur.position = { x: SORTIE_TERRAIN.boite.x, z: SORTIE_TERRAIN.boite.z, o: 0 };
  joueur.recevoir({ t: "voyager", vers: "station" });
  attendre(DUREE_VOYAGE_S + 0.1, 0.5);
  halte.eteints = [nouvelEteint(99, eteintEn.x, eteintEn.z, etat)];
  joueur.position = { ...joueurEn };
  recus.length = 0;
  return { halte, joueur, attendre, recus, compte, z: () => halte.eteints[0]! };
}

// ---------- La règle commune ----------

test("murs : un mur entre deux points se voit ; le long du mur, ou par la porte, la voie est libre", () => {
  assert.ok(murEntre(ZONE_STATION, DEDANS.x, DEDANS.z, DEHORS.x, DEHORS.z), "le mur est de la boutique arrête");
  const h = murEntre(ZONE_STATION, DEDANS.x, DEDANS.z, DEHORS.x, DEHORS.z)!;
  assert.ok(Math.abs(h.x - 109.65) < 0.02, `heurté en x = ${h.x}`);
  assert.equal(voieLibre(ZONE_STATION, DEDANS, DEHORS), false);
  // Les deux du même côté : rien entre eux.
  assert.equal(voieLibre(ZONE_STATION, { x: 110.4, z: 13.4 }, { x: 110.4, z: 14.5 }), true);
  // Par la porte de la boutique (x = 104,1, façade z = 17,35).
  assert.equal(voieLibre(ZONE_STATION, { x: 104.1, z: 16.6 }, { x: 104.1, z: 18.1 }), true);
  // À côté de la porte, la façade arrête.
  assert.equal(voieLibre(ZONE_STATION, { x: 101, z: 16.6 }, { x: 101, z: 18.1 }), false);
});

test("murs : à la Coopérative, la cloison et la porte fermée des bureaux arrêtent ; ouverte, on passe ; la caisse basse, non", () => {
  // La porte des bureaux (x = 61, z = 32) est fermée au départ.
  assert.equal(voieLibre(ZONE_COOP, { x: 61, z: 31.3 }, { x: 61, z: 32.7 }), false);
  assert.equal(voieLibre(zoneCoop({ bureaux: true }), { x: 61, z: 31.3 }, { x: 61, z: 32.7 }), true);
  // La cloison, à côté de la porte.
  assert.equal(voieLibre(zoneCoop({ bureaux: true }), { x: 64, z: 31.3 }, { x: 64, z: 32.7 }), false);
  // Un rayonnage de 4 m arrête ; la caisse du libre-service, basse, non.
  assert.equal(voieLibre(ZONE_COOP, { x: 44, z: 21.3 }, { x: 44, z: 18.8 }), false);
  assert.equal(voieLibre(ZONE_COOP, { x: 38, z: 37.4 }, { x: 38, z: 39 }), true);
});

// ---------- Le corps à corps ----------

test("murs : un coup à travers un mur ne touche rien", () => {
  const t = monter({ marteau: 1 }, { ...DEDANS, o: Math.PI / 2 }, DEHORS);
  t.joueur.recevoir({ t: "frapper", appuye: false });
  assert.ok(!t.recus.some((m) => m.t === "coup"), "aucun coup n'a porté");
  assert.equal(t.z().degats, 0);
  assert.equal(t.z().etourdi, 0);
  // Appuyé, pas davantage.
  t.attendre(1);
  t.joueur.position = { ...DEDANS, o: Math.PI / 2 };
  t.joueur.recevoir({ t: "frapper", appuye: true });
  assert.ok(!t.recus.some((m) => m.t === "coup"));
  assert.notEqual(t.z().etat, "detruit");
});

test("murs : à la même distance, sans mur, le coup porte", () => {
  const t = monter({ marteau: 1 }, { x: 110.4, z: 13.4, o: 0 }, { x: 110.4, z: 14.4 });
  t.joueur.recevoir({ t: "frapper", appuye: false });
  const coup = t.recus.find((m) => m.t === "coup");
  assert.ok(coup, "le coup porte");
  assert.equal(coup.t === "coup" && coup.resultat, "vacille");
});

test("murs : on ne repousse pas à travers un mur", () => {
  const t = monter({}, { ...DEDANS, o: Math.PI / 2 }, DEHORS);
  t.joueur.recevoir({ t: "repousser" });
  assert.equal(t.z().etourdi, 0);
  assert.equal(t.z().x, DEHORS.x);
});

// ---------- L'Éteint : ni saisie, ni morsure à travers un mur ----------

test("murs : collé au mur, de l'autre côté, l'Éteint ne saisit pas", () => {
  const t = monter({}, { ...DEDANS, o: Math.PI / 2 }, DEHORS, "poursuivant");
  t.attendre(2);
  assert.equal(t.z().saisit, null);
  assert.ok(!t.recus.some((m) => m.t === "sante" && m.saisi > 0), "jamais saisi");
  assert.ok(!t.recus.some((m) => m.t === "morsure"));
});

test("murs : un Éteint qui tiendrait à travers un mur ne mord pas, il lâche", () => {
  const t = monter({}, { ...DEDANS, o: Math.PI / 2 }, DEHORS, "poursuivant");
  const e = t.z();
  e.saisit = t.compte.id;
  e.tenue = DELAI_MORSURE + 0.1;
  t.attendre(0.2);
  assert.ok(!t.recus.some((m) => m.t === "morsure"), "pas de morsure");
  assert.equal(e.saisit, null);
});
