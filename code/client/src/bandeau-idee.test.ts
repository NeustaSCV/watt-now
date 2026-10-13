// « Tu y penses » (plan 0.8, chantier 2 ; plan 0.8.2, chantier H, R22) : un message d'information, sans bouton ni croix,
// qui part tout seul ; plusieurs idées passent l'une après l'autre.

import { test } from "node:test";
import assert from "node:assert/strict";
import { BandeauIdee, DUREE_BANDEAU_MIN_MS, DUREE_BANDEAU_MS, FONDU_BANDEAU_MS, dureeIdee, htmlBandeau, type Horloge } from "./bandeau-idee.ts";

test("le message : l'icône de la trouvaille, « Tu y penses », l'idée ; ni bouton ni croix", () => {
  const html = htmlBandeau({ texte: "Ce grillage, posé sur ton foyer, ferait une grille. Tu y penses.", plusTard: false, objet: "grillage_rouleau" });
  assert.match(html, /<strong>Tu y penses<\/strong>/);
  assert.ok(!/<button/.test(html), "aucun bouton : il n'appelle aucune action");
  assert.ok(!/[✕×✖]/.test(html), "jamais de croix");
  assert.ok(!html.includes("gardé pour plus tard"));
});

test("le message d'une idée gardée pour plus tard le dit, et le texte est échappé", () => {
  const html = htmlBandeau({ texte: "Ce grillage pourra servir à ton feu, un jour. <b>", plusTard: true });
  assert.match(html, /gardé pour plus tard/);
  assert.ok(!/<button/.test(html));
  assert.ok(html.includes("&lt;b&gt;") && !html.includes("<b>"));
});

test("il reste le temps de le lire : plus long pour une idée longue, entre 5 et 9 s", () => {
  const court = dureeIdee({ texte: "Une idée.", plusTard: false });
  const long = dureeIdee({ texte: "x".repeat(400), plusTard: false });
  const moyen = dureeIdee({ texte: "Ce grillage, posé sur ton foyer, ferait une grille. Tu y penses.", plusTard: false });
  assert.equal(court, DUREE_BANDEAU_MIN_MS);
  assert.equal(long, DUREE_BANDEAU_MS);
  assert.ok(moyen > court && moyen < long);
});

/** Une fausse horloge : on avance le temps à la main. */
function fausseHorloge() {
  let maintenant = 0;
  let prochain = 1;
  const attentes = new Map<number, { quand: number; f: () => void }>();
  const horloge: Horloge = {
    setTimeout: (f, ms) => {
      attentes.set(prochain, { quand: maintenant + ms, f });
      return prochain++;
    },
    clearTimeout: (id) => {
      if (id !== undefined) attentes.delete(id);
    },
  };
  const avancer = (ms: number) => {
    const fin = maintenant + ms;
    for (;;) {
      const [id, a] = [...attentes].filter(([, a]) => a.quand <= fin).sort((x, y) => x[1].quand - y[1].quand)[0] ?? [];
      if (!a || id === undefined) break;
      attentes.delete(id);
      maintenant = a.quand;
      a.f();
    }
    maintenant = fin;
  };
  return { horloge, avancer };
}

/** Un faux élément, juste ce que le message touche. */
function fauxParent() {
  const enfants: { hidden: boolean; innerHTML: string; classes: Set<string> }[] = [];
  const document = {
    createElement: () => {
      const classes = new Set<string>();
      const e = {
        hidden: false,
        innerHTML: "",
        classes,
        className: "",
        classList: { add: (c: string) => classes.add(c), remove: (c: string) => classes.delete(c) },
        setAttribute: () => {},
      };
      return e;
    },
  };
  const parent = { ownerDocument: document, append: (e: (typeof enfants)[number]) => enfants.push(e) };
  return { parent: parent as unknown as HTMLElement, element: () => enfants[0]! };
}

test("il se retire tout seul, et les idées d'une même fouille passent l'une après l'autre", () => {
  const { horloge, avancer } = fausseHorloge();
  const { parent, element } = fauxParent();
  const bandeau = new BandeauIdee(parent, horloge);
  const a = { texte: "Première idée, assez courte.", plusTard: false };
  const b = { texte: "Seconde idée, de la même fouille.", plusTard: true };
  assert.equal(bandeau.montrer(a), true, "la première part tout de suite");
  assert.equal(bandeau.montrer(b), false, "la seconde attend son tour");
  assert.equal(element().hidden, false);
  assert.match(element().innerHTML, /Première idée/);
  assert.ok(!element().innerHTML.includes("<button"));
  // Sans rien toucher : la première part en fondu, la seconde vient.
  avancer(dureeIdee(a) - 1);
  assert.match(element().innerHTML, /Première idée/);
  avancer(1);
  assert.ok(element().classes.has("sortie"), "elle part en fondu");
  avancer(FONDU_BANDEAU_MS);
  assert.match(element().innerHTML, /Seconde idée/);
  assert.ok(!element().classes.has("sortie"));
  // Puis le message se cache de lui-même.
  avancer(dureeIdee(b) + FONDU_BANDEAU_MS);
  assert.equal(element().hidden, true, "parti tout seul");
  // Une idée plus tard repart tout de suite.
  assert.equal(bandeau.montrer(a), true);
  assert.equal(element().hidden, false);
});
