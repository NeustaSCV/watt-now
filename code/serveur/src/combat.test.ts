// Tests du lot 3 de l'É3 : coups, saisie et morsure, dégagement, esquive, saignement, pansement, effondrement.

import { test } from "node:test";
import assert from "node:assert/strict";
import { DEGATS_MORSURE } from "../../commun/src/combat.ts";
import { nouvelEteint } from "../../commun/src/eteints.ts";
import { DUREE_VOYAGE_S, SORTIE_TERRAIN } from "../../commun/src/lieux.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { POINT_ARRIVEE } from "../../commun/src/regles.ts";
import { Base } from "./base.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

/** Un joueur à la halte, seul avec un Éteint placé où l'on veut. */
function monter(inventaire: Record<string, number>, eteint: { x: number; z: number; etat?: "poursuivant" | "errant" } | null = { x: 40, z: 35.5 }) {
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
  // Le premier geste après l'arrivée (0.8.2, chantier G) : sans lui, on resterait à l'abri des coups.
  joueur.recevoir({ t: "arrivee" });
  halte.eteints = eteint ? [nouvelEteint(99, eteint.x, eteint.z, eteint.etat ?? "poursuivant")] : [];
  joueur.position = { x: 40, z: 34.6, o: 0 };
  const dernier = <T extends MessageServeur["t"]>(t: T) => recus.findLast((m) => m.t === t) as Extract<MessageServeur, { t: T }> | undefined;
  const z = () => halte.eteints[0]!;
  return { base, halte, joueur, attendre, dernier, recus, z, compte };
}

test("au marteau : un coup rapide le fait vaciller ; l'appuyé ne le tue plus à la tête (Q-A3), il le met à terre", () => {
  const t = monter({ marteau: 1 });
  t.joueur.recevoir({ t: "frapper", appuye: false });
  assert.equal(t.dernier("coup")!.resultat, "vacille");
  t.attendre(1);
  t.joueur.position = { x: t.z().x, z: t.z().z - 1, o: 0 };
  // 0,8 puis 1,6 : 2,4 points, il vacille encore ; l'appuyé suivant le met à terre ; à terre, un coup l'achève.
  t.joueur.recevoir({ t: "frapper", appuye: true });
  assert.equal(t.dernier("coup")!.resultat, "vacille");
  t.attendre(1);
  t.joueur.position = { x: t.z().x, z: t.z().z - 1, o: 0 };
  t.joueur.recevoir({ t: "frapper", appuye: true });
  assert.equal(t.dernier("coup")!.resultat, "a_terre");
  t.attendre(1);
  t.joueur.position = { x: t.z().x, z: t.z().z - 1, o: 0 };
  t.joueur.recevoir({ t: "frapper", appuye: false });
  assert.equal(t.dernier("coup")!.resultat, "detruit");
  assert.equal(t.z().etat, "detruit");
});

test("à mains nues, debout, il ne meurt pas : il tombe au bout de plusieurs coups ; au sol, le coup suivant l'achève", () => {
  const t = monter({});
  let i = 0;
  while (!t.recus.some((m) => m.t === "coup" && m.resultat === "a_terre") && i++ < 12) {
    t.joueur.position = { x: t.z().x, z: t.z().z - 1, o: 0 };
    t.joueur.recevoir({ t: "frapper", appuye: true });
    t.attendre(0.75);
  }
  assert.ok(t.recus.some((m) => m.t === "coup" && m.resultat === "a_terre"));
  assert.ok(!t.recus.some((m) => m.t === "coup" && m.resultat === "detruit"), "debout, les poings ne le tuent pas");
  // Au sol, on l'achève (Book 06 §2.2, décision du 2026-10-08).
  t.joueur.position = { x: t.z().x, z: t.z().z - 1, o: 0 };
  t.joueur.recevoir({ t: "frapper", appuye: false });
  assert.ok(t.recus.some((m) => m.t === "coup" && m.resultat === "detruit"));
});

test("au contact, il saisit puis mord ; la morsure fait saigner", () => {
  const t = monter({});
  t.attendre(0.8);
  assert.equal(t.dernier("sante")!.saisi, 1);
  t.attendre(3.1);
  assert.ok(t.recus.some((m) => m.t === "morsure"));
  const s = t.dernier("sante")!.sante;
  assert.ok(s.points <= 100 - DEGATS_MORSURE + 1);
  assert.equal(s.saignement, "leger");
  assert.deepEqual(s.blessures, ["morsure"]);
});

test("taper vite pour se dégager ; l'esquive libère aussi", () => {
  const t = monter({});
  t.attendre(0.8);
  assert.equal(t.z().saisit, t.compte.id);
  for (let i = 0; i < 6; i++) t.joueur.recevoir({ t: "degager" });
  assert.equal(t.z().saisit, null);
  t.attendre(2.5);
  assert.equal(t.z().saisit, t.compte.id, "il est revenu à la charge");
  t.joueur.recevoir({ t: "esquiver", dx: 0, dz: -1 });
  assert.equal(t.z().saisit, null);
  t.attendre(0.3);
  assert.ok(t.joueur.position.z < 34.6 - 1, "l'esquive fait faire un bond");
});

test("un saignement fort mène à l'effondrement : le sac reste là, on se réveille chez soi, et on peut le reprendre", () => {
  const t = monter({ conserve: 2, marteau: 1, gourde: 1 });
  // Deux morsures : le saignement devient fort.
  t.attendre(0.8 + 3.1 + 3.1);
  assert.equal(t.dernier("sante")!.sante.saignement, "fort");
  t.halte.eteints = [];
  t.attendre(200, 0.25);
  assert.ok(t.recus.some((m) => m.t === "effondrement"));
  const b = t.dernier("bienvenue")!;
  assert.equal(b.lieu, "terrain");
  assert.deepEqual({ x: b.position.x, z: b.position.z }, { x: POINT_ARRIVEE.x, z: POINT_ARRIVEE.z });
  assert.deepEqual(b.inventaire, {});
  assert.ok(b.besoins.kcal <= 2500 * 0.3 + 1);
  assert.equal(b.sante.convalescence, true);
  assert.equal(b.sante.saignement, "aucun");
  assert.equal(t.halte.sacs.length, 1);

  // Retour à la halte : le sac est là.
  t.joueur.position = { x: SORTIE_TERRAIN.boite.x, z: SORTIE_TERRAIN.boite.z, o: 0 };
  t.joueur.recevoir({ t: "voyager", vers: "station" });
  t.attendre(DUREE_VOYAGE_S + 0.1, 0.5);
  const sac = t.dernier("bienvenue")!.sacs[0]!;
  assert.equal(sac.aMoi, true);
  t.joueur.position = { x: sac.x, z: sac.z + 0.5, o: 0 };
  t.joueur.recevoir({ t: "interagir", cible: { genre: "sac", id: sac.id }, verbe: "reprendre" });
  t.attendre(3.2, 0.25);
  assert.equal(t.dernier("inventaire")!.inventaire.marteau, 1);
  assert.equal(t.halte.sacs.length, 0);
});

test("un pansement arrête le saignement", () => {
  const t = monter({ pansement: 1 });
  t.attendre(3.95);
  t.halte.eteints = [];
  assert.equal(t.dernier("sante")!.sante.saignement, "leger");
  t.joueur.recevoir({ t: "panser" });
  t.attendre(6.2, 0.25);
  assert.equal(t.dernier("sante")!.sante.saignement, "aucun");
});

test("un coup va jusqu'au bout (P-004) : dix appuis en une seconde ne donnent que deux coups à la hache", () => {
  const t = monter({ hache: 1 }, { x: 40, z: 36, etat: "errant" });
  let coups = 0;
  for (let i = 0; i < 10; i++) {
    t.joueur.position = { x: t.z().x, z: t.z().z - 1, o: 0 };
    const avant = t.recus.length;
    t.joueur.recevoir({ t: "frapper", appuye: false });
    if (t.recus.slice(avant).some((m) => m.t === "coup")) coups++;
    t.attendre(0.1);
  }
  // Hache : 700 ms le geste (80 ms de tolérance réseau) → un coup à 0 s, un à 0,7 s.
  assert.equal(coups, 2);
});

test("équiper une arme (P-005) : on frappe avec elle, le choix est gardé ; perdue, on revient à la meilleure du sac", () => {
  const t = monter({ hache: 1, gourdin: 1 }, { x: 40, z: 36, etat: "errant" });
  t.joueur.recevoir({ t: "equiper", objet: "gourdin" });
  assert.equal(t.dernier("arme")!.arme, "gourdin");
  assert.equal(t.base.chargerArme(t.compte.id), "gourdin");
  // Le gourdin ne tue pas à la tête : un coup appuyé ne détruit pas (la hache l'aurait fait).
  t.joueur.position = { x: t.z().x, z: t.z().z - 1, o: 0 };
  t.joueur.recevoir({ t: "frapper", appuye: true });
  assert.notEqual(t.dernier("coup")!.resultat, "detruit");
  // On jette le gourdin : la hache reprend, avec un mot.
  t.joueur.recevoir({ t: "jeter", objet: "gourdin", quantite: 1 });
  t.attendre(1);
  t.joueur.position = { x: t.z().x, z: t.z().z - 1, o: 0 };
  t.joueur.recevoir({ t: "frapper", appuye: true });
  assert.ok(t.recus.some((m) => m.t === "info" && /Le gourdin n'est plus dans ton sac : tu te bats avec la hache/.test(m.texte)));
  assert.equal(t.dernier("coup")!.resultat, "detruit");
  // On n'équipe pas ce qu'on n'a pas, ni ce qui n'est pas une arme.
  t.joueur.recevoir({ t: "equiper", objet: "conserve" });
  t.joueur.recevoir({ t: "equiper", objet: "marteau" });
  assert.equal(t.base.chargerArme(t.compte.id), "gourdin");
});
