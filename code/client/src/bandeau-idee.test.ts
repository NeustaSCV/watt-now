// « Tu y penses » (plan 0.8, chantier 2 ; plan 0.8.2, chantier H, R22) : un message d'information, sans bouton ni croix,
// qui part tout seul ; plusieurs idées passent l'une après l'autre.

import { test } from "node:test";
import assert from "node:assert/strict";
import { BandeauIdee, DUREE_BANDEAU_MIN_MS, DUREE_BANDEAU_MS, ECART_PANNEAU, FONDU_BANDEAU_MS, VEILLE_PANNEAUX_MS, dureeIdee, htmlBandeau, placerIdee, type Boite, type Horloge } from "./bandeau-idee.ts";

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
  const enfants: { hidden: boolean; innerHTML: string; classes: Set<string>; style: { top: string; bottom: string } }[] = [];
  const document = {
    createElement: () => {
      const classes = new Set<string>();
      const e = {
        hidden: false,
        innerHTML: "",
        classes,
        className: "",
        classList: { add: (c: string) => classes.add(c), remove: (c: string) => classes.delete(c), contains: (c: string) => classes.has(c) },
        setAttribute: () => {},
        style: { top: "", bottom: "" },
        // Sous les tuiles, 56 px de haut ; un `top` posé le déplace.
        getBoundingClientRect(): Boite {
          const t = this.style.top ? Number.parseFloat(this.style.top) : 230;
          return { top: t, bottom: t + 56, left: 16, right: 359 };
        },
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

// Plan 0.8.2 §7.6 : « Tu y penses » ne recouvre jamais le carnet du tutoriel (ouvert d'office sur téléphone) ni un panneau.
const boite = (top: number, hauteur: number, left = 16, right = 359): Boite => ({ top, bottom: top + hauteur, left, right });

test("0.8.2 §7.6 : le message reste à sa place s'il ne touche aucun panneau, passe dessous sinon, attend s'il n'y tient pas", () => {
  // 375 × 630 : le message sous les tuiles (≈ 180 px), le carnet du tutoriel de 180 à 375 px.
  const idee = boite(230, 56);
  assert.equal(placerIdee(idee, [], 630), null);
  assert.equal(placerIdee(idee, [boite(400, 100)], 630), null, "un panneau plus bas ne le gêne pas");
  const carnet = boite(180, 195, 18, 357);
  assert.equal(placerIdee(idee, [carnet], 630), 375 + ECART_PANNEAU, "juste sous le carnet");
  // Le sac, presque toute la hauteur : il attend qu'on le ferme.
  assert.equal(placerIdee(idee, [boite(150, 470, 0, 375)], 630), "attendre");
  // 812 × 320 : le message en bas, le carnet qui descend jusqu'à 300 px ; pas la place dessous.
  assert.equal(placerIdee(boite(256, 50, 206, 606), [boite(112, 192, 236, 576)], 320), "attendre");
  // Deux panneaux l'un sous l'autre : sous le second.
  assert.equal(placerIdee(idee, [carnet, boite(380, 60)], 630), 440 + ECART_PANNEAU);
});

test("0.8.2 §7.6 : le placement lit aussi un DOMRect (ses côtés sont des accesseurs)", () => {
  class Rect {
    private readonly t: number;
    private readonly h: number;
    constructor(t: number, h: number) {
      this.t = t;
      this.h = h;
    }
    get top() { return this.t; }
    get bottom() { return this.t + this.h; }
    get left() { return 16; }
    get right() { return 359; }
  }
  assert.equal(placerIdee(new Rect(230, 56), [new Rect(180, 195)], 630), 375 + ECART_PANNEAU);
});

test("0.8.2 §7.6 : derrière un panneau, l'idée attend (sans se perdre) puis vient quand on le ferme", () => {
  const { horloge, avancer } = fausseHorloge();
  const { parent, element } = fauxParent();
  let obstacles: Boite[] = [boite(150, 470, 0, 375)];
  const bandeau = new BandeauIdee(parent, horloge, { obstacles: () => obstacles, hauteur: () => 630 });
  const a = { texte: "Cette toile pourra fermer ton abri, un jour.", plusTard: true };
  bandeau.montrer(a);
  assert.equal(element().hidden, true, "pas par-dessus le sac");
  avancer(VEILLE_PANNEAUX_MS * 20);
  assert.equal(element().hidden, true, "toujours en attente, le sac ouvert");
  // Le sac se ferme, le carnet du tutoriel reste : l'idée vient, sous le carnet.
  obstacles = [boite(180, 195, 18, 357)];
  avancer(VEILLE_PANNEAUX_MS);
  assert.equal(element().hidden, false);
  assert.match(element().innerHTML, /fermer ton abri/);
  assert.equal(element().style.top, `${375 + ECART_PANNEAU}px`);
  // Puis elle part seule, le temps venu.
  avancer(dureeIdee(a) + FONDU_BANDEAU_MS);
  assert.equal(element().hidden, true);
});
