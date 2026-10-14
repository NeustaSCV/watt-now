// Chantier V3 de la 0.10 (décisions du porteur, « soyons généreux ») : le phare a une fouille dans chacun de ses bâtiments
// et dans chaque conteneur ouvert de l'épave (ceux-là, l'épave échouée seulement) ; à la route du pont, les Éteints de
// derrière la porte du péage somnolent (l'équipé, V2-05, et l'errant de la pile).

import { test } from "node:test";
import assert from "node:assert/strict";
import { eteintsRoutePont } from "../../commun/src/eteints-route-pont.ts";
import { PIECES_MODELE } from "../../commun/src/phare-modele.ts";
import { butinPhare } from "../../commun/src/phare-vivant.ts";
import { auModele, piecePhare } from "../../commun/src/phare.ts";
import { FOUILLES_DE_L_EPAVE, OBJETS_DE_L_EPAVE } from "../../commun/src/ressources-phare.ts";
import { PORTE_PEAGE } from "../../commun/src/route-pont.ts";
import { USAGES } from "../../commun/src/terrain.ts";
import { CLES_L2A, CLES_L2B, LIEU_DE_FOUILLE } from "../../commun/src/vestiges.ts";
import { Base } from "./base.ts";
import { rendreSilencieux } from "./journal.ts";
import { Phares } from "./phare.ts";

rendreSilencieux(true);

const dans = (b: { x: number; z: number; l: number; p: number }, x: number, z: number) => Math.abs(x - b.x) <= b.l / 2 && Math.abs(z - b.z) <= b.p / 2;

test("le phare : une fouille (une table de vestiges) dans chacun de ses bâtiments, et dans chaque conteneur de l'épave", () => {
  const fouilles = butinPhare().filter((r) => USAGES[r.type].verbe === "fouiller" && LIEU_DE_FOUILLE[r.type]);
  for (const [id, piece] of Object.entries(PIECES_MODELE)) {
    const n = fouilles.filter((r) => {
      const m = auModele(r.x, r.z);
      return piece.boites.some((b) => dans(b, m.x, m.z));
    }).length;
    assert.ok(n >= 1, `${piece.nom} (${id}) : aucune fouille`);
  }
  // Les bâtiments d'avant l'épave : la pièce du jeu le confirme (la tour, la corne, l'abri du douanier, ajoutés).
  for (const [type, piece] of [["phare_tour", "tour"], ["phare_corne", "corne"], ["phare_abri", "abri"]] as const) {
    const r = fouilles.find((x) => x.type === type)!;
    assert.equal(piecePhare(r.x, r.z), piece, type);
  }
  // Aucun objet-clé du phare ni de l'hôtel en place dans ces fouilles : seulement par chance (R-BUTIN), par leur table.
  const cles = new Set<string>([...CLES_L2A, ...CLES_L2B]);
  for (const r of fouilles) for (const t of Object.keys(USAGES[r.type].donne)) assert.ok(!cles.has(t), `${r.type} donne ${t}`);
});

test("le phare : les fouilles des conteneurs ne se font que l'épave échouée, comme ses objets-clés", () => {
  const base = new Base(":memory:");
  const instant = base.debutMonde() + 1000;
  const lieu = new Phares(base, () => 0.5, () => instant).de(7);
  const ressources = [...lieu.ressources.values()];
  for (const t of FOUILLES_DE_L_EPAVE) {
    const r = ressources.find((x) => x.type === t)!;
    assert.ok(r, t);
    assert.ok(!OBJETS_DE_L_EPAVE.includes(t));
    assert.equal(lieu.disponiblePour(r, 7, instant), false, `${t} avant l'épave`);
  }
  // Les fouilles des bâtiments, elles, se font tout de suite.
  for (const t of ["phare_tour", "phare_corne", "phare_abri"] as const) assert.equal(lieu.disponiblePour(ressources.find((x) => x.type === t)!, 7, instant), true, t);
});

test("la route du pont : les Éteints de derrière la porte du péage somnolent (l'équipé, l'errant de la pile)", () => {
  const derriere = eteintsRoutePont().filter((e) => e.x > PORTE_PEAGE.x && Math.hypot(e.x - PORTE_PEAGE.x, e.z - PORTE_PEAGE.z) < 15);
  assert.equal(derriere.length, 2);
  for (const e of derriere) assert.equal(e.etat, "dormant", `Éteint ${e.id} (${e.x} ; ${e.z})`);
  assert.ok(derriere.some((e) => e.variante === "equipe") && derriere.some((e) => e.variante === undefined));
});
