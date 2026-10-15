// Le péage des survivants (plan 0.10 §3.4, S-19, chantier H) : 12 wotts d'objets au prix du Comptoir, les ordures ne
// comptent pas ; refusé à 11, accepté à 12 ; payé, on passe une heure sans rien redemander ; la règle est la même au pont
// et au tunnel ; qui a payé est gardé en base.

import { test } from "node:test";
import assert from "node:assert/strict";
import { DUREE_PASSAGE_MS, PRIX_PASSAGE, TEXTES_PEAGE, resteAPayer, valeurObjets, valeurPeage, verifierPaiement } from "../../commun/src/peage.ts";
import type { MessageServeur } from "../../commun/src/messages.ts";
import type { Inventaire } from "../../commun/src/objets.ts";
import { Base } from "./base.ts";
import { messageValide } from "./controle.ts";
import { Peage, type ContextePeage } from "./peage.ts";

/** Un joueur de papier : son sac, ce qu'on lui dit, ce qu'on lui envoie. */
function joueur(id: number, sac: Inventaire, horloge: { t: number }) {
  const infos: string[] = [];
  const envois: MessageServeur[] = [];
  const ctx: ContextePeage & { sac: Inventaire } = {
    id,
    sac: { ...sac },
    maintenant: () => horloge.t,
    inventaire() {
      return this.sac;
    },
    donner(objets) {
      for (const [cle, n] of Object.entries(objets)) {
        const k = cle as keyof Inventaire;
        this.sac[k] = (this.sac[k] ?? 0) - (n ?? 0);
        if ((this.sac[k] ?? 0) <= 0) delete this.sac[k];
      }
    },
    info: (t) => infos.push(t),
    envoyer: (m) => envois.push(m),
  };
  return { ctx, infos, envois };
}

test("la valeur : au prix du Comptoir ; les ordures, le sac et les batteries ne comptent pas", () => {
  // Une bûche : 12,8 wotts au Comptoir (ce qu'il en donne).
  assert.ok(valeurPeage("buche") >= PRIX_PASSAGE);
  assert.equal(valeurPeage("canette"), 0, "une ordure vaut 0");
  assert.equal(valeurPeage("bouteille_plastique"), 0);
  assert.equal(valeurPeage("sac_a_dos"), 0);
  assert.equal(valeurPeage("batterie_voiture"), 0);
  assert.equal(valeurObjets({ canette: 40 }), 0);
  assert.equal(resteAPayer({ canette: 40 }), PRIX_PASSAGE);
});

test("refusé à 11 wotts, accepté à 12 ; pas de monnaie rendue", () => {
  // Les branches : 3,2 wotts chacune au Comptoir ; trois font 9,6, quatre 12,8.
  const branche = valeurPeage("branche");
  assert.equal(branche, 3.2);
  // Moins de 12 : deux branches et des chiffons (6,4 + 4 = 10,4).
  const onze: Inventaire = { branche: 2, chiffons: 1 };
  assert.ok(valeurObjets(onze) < PRIX_PASSAGE);
  const r1 = verifierPaiement(onze, { branche: 5, chiffons: 3 }, 0, 1000);
  assert.equal(r1.accepte, false);
  assert.equal(!r1.accepte && r1.raison, "trop_peu");
  assert.equal(!r1.accepte && r1.du, Math.round((PRIX_PASSAGE - valeurObjets(onze)) * 10) / 10);
  const r2 = verifierPaiement({ branche: 4 }, { branche: 5 }, 0, 1000);
  assert.equal(r2.accepte, true);
  assert.equal(r2.accepte && r2.valeur, 12.8, "on donne 12,8 : rien n'est rendu");
  // Des objets qu'on n'a pas : refusé, rien n'est pris.
  const r3 = verifierPaiement({ buche: 1 }, { branche: 5 }, 0, 1000);
  assert.equal(!r3.accepte && r3.raison, "absent");
  // Les ordures ne font pas le compte, même par dizaines.
  const r4 = verifierPaiement({ canette: 30, branche: 3 }, { canette: 30, branche: 3 }, 0, 1000);
  assert.equal(!r4.accepte && r4.raison, "trop_peu");
});

test("le serveur : 11 refusé, 12 accepté (les objets quittent le sac), puis une heure sans rien redemander", () => {
  const base = new Base(":memory:");
  const horloge = { t: 5_000_000 };
  const peage = new Peage(base, "pont");
  const a = joueur(1, { branche: 10, chiffons: 2 }, horloge);
  assert.equal(peage.ouvertPour(1, horloge.t), false);
  assert.equal(peage.payer(a.ctx, { branche: 2, chiffons: 1 }), false, "10,4 wotts : refusé");
  assert.deepEqual(a.ctx.sac, { branche: 10, chiffons: 2 }, "rien n'est pris");
  assert.ok(a.infos.at(-1)!.includes("Il en manque"));
  assert.deepEqual(a.envois.at(-1), { t: "passage", passage: "pont", ouvert: false, du: 1.6 });
  assert.equal(peage.payer(a.ctx, { branche: 4 }), true, "12,8 wotts : accepté");
  assert.deepEqual(a.ctx.sac, { branche: 6, chiffons: 2 });
  assert.equal(a.infos.at(-1), TEXTES_PEAGE.pont.paye);
  assert.ok(a.infos.at(-1)!.includes("« Douze, et tu passes. »"));
  assert.deepEqual(a.envois.at(-1), { t: "passage", passage: "pont", ouvert: true, du: 0 });
  // Pendant l'heure : la porte est ouverte, et on ne redemande rien (un second paiement est refusé, rien n'est pris).
  horloge.t += DUREE_PASSAGE_MS - 60_000;
  assert.equal(peage.ouvertPour(1, horloge.t), true);
  assert.equal(peage.payer(a.ctx, { branche: 4 }), false);
  assert.equal(a.infos.at(-1), TEXTES_PEAGE.pont.dejaPaye);
  assert.deepEqual(a.ctx.sac, { branche: 6, chiffons: 2 });
  peage.suivre(a.ctx);
  assert.equal(a.infos.at(-1), TEXTES_PEAGE.pont.dejaPaye, "encore ouvert : rien à dire");
  // L'heure passée : la porte se referme pour lui, on le lui dit une fois ; il faut repayer.
  horloge.t += 120_000;
  assert.equal(peage.ouvertPour(1, horloge.t), false);
  peage.suivre(a.ctx);
  assert.equal(a.infos.at(-1), TEXTES_PEAGE.pont.referme);
  const n = a.infos.length;
  peage.suivre(a.ctx);
  assert.equal(a.infos.length, n, "une fois");
  assert.equal(peage.payer(a.ctx, { branche: 4 }), true);
});

test("la porte s'ouvre pour qui a payé, seulement pour lui ; c'est gardé en base", () => {
  const base = new Base(":memory:");
  const horloge = { t: 9_000_000 };
  const peage = new Peage(base, "pont");
  const a = joueur(1, { buche: 1 }, horloge);
  const b = joueur(2, { buche: 1 }, horloge);
  peage.payer(a.ctx, { buche: 1 });
  assert.equal(peage.ouvertPour(1, horloge.t), true);
  assert.equal(peage.ouvertPour(2, horloge.t), false, "l'autre doit payer pour lui");
  peage.entrer(b.ctx);
  assert.deepEqual(b.envois.at(-1), { t: "passage", passage: "pont", ouvert: false, du: PRIX_PASSAGE });
  // Un serveur qui redémarre ne fait pas repayer.
  const relu = new Peage(base, "pont");
  assert.equal(relu.ouvertPour(1, horloge.t), true);
  // Le tunnel suit la même règle, à part : avoir payé au pont n'ouvre pas le tunnel.
  const tunnel = new Peage(base, "tunnel");
  assert.equal(tunnel.ouvertPour(1, horloge.t), false);
  const c = joueur(1, { branche: 3 }, horloge);
  assert.equal(tunnel.payer(c.ctx, { branche: 3 }), false);
  assert.ok(c.infos.at(-1)!.includes("Il en manque"));
});

test("le message payer_passage passe la liste blanche, et rien d'autre", () => {
  assert.ok(messageValide({ t: "payer_passage", passage: "pont", objets: { branche: 4 } }));
  assert.ok(messageValide({ t: "payer_passage", passage: "tunnel", objets: { chiffons: 3 } }));
  assert.ok(!messageValide({ t: "payer_passage", passage: "gue", objets: { branche: 4 } }));
  assert.ok(!messageValide({ t: "payer_passage", passage: "pont", objets: { toString: 4 } }));
  assert.ok(!messageValide({ t: "payer_passage", passage: "pont", objets: { branche: 1.5 } }));
  assert.ok(!messageValide({ t: "payer_passage", passage: "pont", objets: [] }));
});
