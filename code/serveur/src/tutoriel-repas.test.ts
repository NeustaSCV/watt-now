// Le repas du tutoriel (0.8.2, décision du porteur) : toutes les deux étapes, un repas de plus en plus bon, une seule
// fois, même après une reconnexion ; une ligne du carnet le dit ; le vétéran qui saute le tutoriel ne reçoit rien.

import { test } from "node:test";
import assert from "node:assert/strict";
import type { MessageServeur } from "../../commun/src/messages.ts";
import { OBJETS, type Inventaire } from "../../commun/src/objets.ts";
import { NOMBRE_ETAPES, REPAS_DU_TUTORIEL, TUTORIEL_NEUF, etapesTutoriel, type EtatTutoriel } from "../../commun/src/tutoriel.ts";
import { Base } from "./base.ts";
import { Comptoir } from "./comptoir.ts";
import { Halte } from "./halte.ts";
import { Joueur } from "./joueur.ts";

function monter(tuto: Partial<EtatTutoriel>, inventaire: Inventaire = { sac_a_dos: 1 }) {
  const base = new Base(":memory:");
  const compte = base.creerCompte("Rose", "potager42", "charbonniers", true);
  base.sauverTutoriel(compte.id, { ...TUTORIEL_NEUF, ...tuto });
  base.sauverInventaire(compte.id, inventaire);
  let instant = 1_000_000;
  const connecter = () => {
    const recus: MessageServeur[] = [];
    const joueur = new Joueur(compte, base, (m) => recus.push(m), () => instant, new Halte(base), () => 1, new Comptoir(base, instant));
    joueur.bienvenue(0);
    const attendre = (secondes: number, pas = 0.25) => {
      for (let s = 0; s < secondes; s += pas) {
        instant += pas * 1000;
        joueur.tick(pas);
      }
    };
    // Le sac du joueur (privé dans la classe) : on le lit tel quel.
    const sac = () => (joueur as unknown as { inventaire: Inventaire }).inventaire;
    return { joueur, recus, attendre, sac };
  };
  return { base, compte, connecter };
}

test("repas du tutoriel : six paliers, un toutes les deux étapes, de plus en plus nourrissants", () => {
  const titres = etapesTutoriel("charbonniers").map((e) => e.titre);
  const paliers = Object.keys(REPAS_DU_TUTORIEL).map(Number);
  assert.deepEqual(paliers.map((i) => titres[i]), ["Ramasser", "L'eau", "L'outil", "Le premier Éteint", "La carte", "La nuit"]);
  assert.equal(paliers.at(-1), NOMBRE_ETAPES - 1, "le dernier repas vient avec la fin");
  const kcal = paliers.map((i) => Object.entries(REPAS_DU_TUTORIEL[i]!.objets).reduce((s, [t, n]) => s + (OBJETS[t as keyof typeof OBJETS].kcal ?? 0) * (n ?? 0), 0));
  for (let i = 1; i < kcal.length; i++) assert.ok(kcal[i]! >= kcal[i - 1]!, `le repas ${i + 1} cale au moins autant que le précédent (${kcal.join(", ")})`);
  for (const i of paliers) {
    const r = REPAS_DU_TUTORIEL[i]!;
    assert.ok(r.texte.length <= 60, `une ligne courte : ${r.texte}`);
    assert.doesNotMatch(r.texte, /cl[ée]/i);
  }
});

test("repas du tutoriel : « Ramasser » réussi donne deux pommes, une fois, et le carnet le dit ; pas de nouveau à la reconnexion", () => {
  const t = monter({ etape: 1, branches: 3, pierres: 5 });
  const a = t.connecter();
  a.attendre(1);
  assert.equal(a.sac().pomme, 2);
  const vue = a.recus.findLast((m) => m.t === "tutoriel") as Extract<MessageServeur, { t: "tutoriel" }>;
  assert.deepEqual(vue.tutoriel!.repas, ["Pour la route : deux pommes."]);
  a.attendre(2);
  assert.equal(a.sac().pomme, 2, "une seule fois");
  // La reconnexion relit l'étape gardée : rien de plus.
  const b = t.connecter();
  b.attendre(2);
  assert.equal(b.sac().pomme, 2);
  assert.ok(!b.recus.some((m) => m.t === "tutoriel" && m.tutoriel?.repas), "aucune ligne de repas à la reconnexion");
});

test("repas du tutoriel : « L'eau » donne la poignée de noix ; « La nuit » finit le tutoriel avec deux pots-au-feu", () => {
  const eau = monter({ etape: 3, bouilli: true }).connecter();
  eau.attendre(1);
  assert.equal(eau.sac().noix, 1);
  const nuit = monter({ etape: 11, dormiAbri: true }).connecter();
  nuit.attendre(1);
  assert.equal(nuit.sac().pot_au_feu, 2);
  const fin = nuit.recus.findLast((m) => m.t === "tutoriel" && m.tutoriel?.termine) as Extract<MessageServeur, { t: "tutoriel" }>;
  assert.deepEqual(fin.tutoriel!.repas, ["Le repas de ta première vraie nuit : deux pots-au-feu."]);
});

test("repas du tutoriel : le sac plein, ce qui n'y tient pas tombe à ses pieds", () => {
  // 55 kg de pierres dans le sac : plus de place pour les pommes.
  const t = monter({ etape: 1, branches: 3, pierres: 5 }, { sac_a_dos: 1, pierre: 1000 });
  const a = t.connecter();
  const avant = a.sac().pomme ?? 0;
  a.attendre(1);
  assert.equal(a.sac().pomme ?? 0, avant, "rien n'entre au sac");
  assert.ok(a.recus.some((m) => m.t === "info" && /plein.*pommes.*par terre/.test(m.texte)), "le message le dit");
});

test("repas du tutoriel : le vétéran qui saute le tutoriel ne reçoit rien", () => {
  const a = monter({ etape: 1, branches: 3, pierres: 5 }).connecter();
  a.joueur.recevoir({ t: "tutoriel_passer" });
  a.attendre(2);
  assert.equal(a.sac().pomme ?? 0, 0);
});
