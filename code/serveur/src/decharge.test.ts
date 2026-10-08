// La décharge du terrain (P-001) : elle fait remonter des objets (surtout nuls), même hors ligne ; on y prend, on n'y
// dépose pas.

import { test } from "node:test";
import assert from "node:assert/strict";
import { INTERVALLE_DECHARGE_MS, MAX_DECHARGE, remonter, tableDecharge } from "../../commun/src/decharge.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { VESTIGES } from "../../commun/src/vestiges.ts";
import { Base } from "./base.ts";
import { Joueur } from "./joueur.ts";

test("un objet toutes les deux heures, jusqu'à 12 ; les nuls plus souvent que les précieux", () => {
  let i = 0;
  const alea = () => ((i = (i * 9301 + 49297) % 233280), i / 233280);
  const r = remonter({ contenu: {}, majLe: 1 }, 1 + 5 * INTERVALLE_DECHARGE_MS + 1000, alea);
  assert.equal(Object.values(r.arrives).reduce((s, n) => s + (n ?? 0), 0), 5);
  const plein = remonter({ contenu: {}, majLe: 1 }, 1 + 40 * INTERVALLE_DECHARGE_MS, alea);
  assert.equal(Object.values(plein.etat.contenu).reduce((s, n) => s + (n ?? 0), 0), MAX_DECHARGE);
  // Rien de trop lourd, et un objet à 1 wott pèse plus dans le tirage qu'un objet à 100 de même rareté.
  const table = new Map(tableDecharge());
  for (const t of table.keys()) assert.ok(VESTIGES[t].poids <= 25);
  const nul = [...table].find(([t]) => VESTIGES[t].valeur <= 5 && VESTIGES[t].rarete === "C");
  const cher = [...table].find(([t]) => VESTIGES[t].valeur > 20 && VESTIGES[t].rarete === "C");
  if (nul && cher) assert.ok(nul[1] > cher[1]);
});

test("chaque terrain a sa décharge ; au retour, on y prend ce qui a remonté, mais on n'y dépose rien", () => {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "mecanistes");
  base.sauverInventaire(compte.id, { sac_a_dos: 1, pierre: 1 });
  let instant = 1_000_000;
  const recus: MessageServeur[] = [];
  const premier = new Joueur(compte, base, (m) => recus.push(m), () => instant);
  premier.sauvegarder();
  const d0 = base.chargerInstallations(compte.id).find((i) => i.type === "decharge");
  assert.ok(d0, "la décharge est posée au premier passage");
  // Le joueur revient cinq heures plus tard : deux objets ont remonté.
  instant += 5 * INTERVALLE_DECHARGE_MS / 2;
  const j = new Joueur(compte, base, (m) => recus.push(m), () => instant);
  const d = base.chargerInstallations(compte.id).find((i) => i.type === "decharge")!;
  const contenu = d.etat.contenu ?? {};
  const types = Object.keys(contenu);
  assert.equal(Object.values(contenu).reduce((s, n) => s + (n ?? 0), 0), 2);
  assert.equal(j.rapport?.decharge_remonte, 2);
  // On prend un objet ; on ne peut pas y jeter sa pierre.
  j.position = { x: d.x + 1, z: d.z + 1, o: 0 };
  const objet = types[0] as never;
  j.recevoir({ t: "coffre", id: d.id, sens: "prendre", objet, quantite: 1 });
  assert.equal(recus.findLast((m) => m.t === "inventaire")?.t === "inventaire" && (recus.findLast((m) => m.t === "inventaire") as Extract<MessageServeur, { t: "inventaire" }>).inventaire[objet], 1);
  j.recevoir({ t: "coffre", id: d.id, sens: "deposer", objet: "pierre", quantite: 1 });
  assert.ok(recus.some((m) => m.t === "info" && /rend, elle ne reprend pas/.test(m.texte)));
});
