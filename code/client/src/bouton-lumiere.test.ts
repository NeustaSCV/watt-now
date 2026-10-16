// Le bouton « Lumière » en icône (0.10.1, chantier L, R-10) : le bon dessin pour chaque lumière, allumée ou éteinte, la
// frontale vide montrée éteinte avec sa petite pile vide, le rond en pointillé sans lumière, pas de redessin sans changement.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BoutonLumiere, dessinerLumiere, etatBouton, etiquetteLumiere } from "./bouton-lumiere.ts";
import { avecTouches } from "./touches.ts";

const plein = { petite_batterie: 5 };

/** Un faux bouton : ses classes et ses attributs. */
function fauxBouton() {
  const classes = new Set<string>();
  const attributs = new Map<string, string>();
  const bouton = {
    classList: { toggle: (c: string, oui: boolean) => (oui ? classes.add(c) : classes.delete(c), oui) },
    setAttribute: (n: string, v: string) => attributs.set(n, v),
  } as unknown as HTMLElement;
  const dessin = { innerHTML: "" } as HTMLElement;
  return { bouton, dessin, classes, attributs };
}

test("la lumière qu'on porte : torche, frontale, lanterne, lampe bricolée, ou aucune", () => {
  assert.equal(etatBouton({ torche: 1 }, {}, false).genre, "torche");
  assert.equal(etatBouton({ lampe_frontale: 1 }, plein, false).genre, "frontale");
  assert.equal(etatBouton({ lanterne: 1 }, {}, false).genre, "lanterne");
  assert.equal(etatBouton({ lampe_bricolee: 1 }, {}, false).genre, "lampe");
  assert.equal(etatBouton({}, {}, true).genre, null);
  // Même ordre que lumierePortee (commun/src/objets.ts) : la torche passe devant la lanterne.
  assert.equal(etatBouton({ lanterne: 1, torche: 1 }, {}, false).genre, "torche");
});

test("le bon dessin pour chaque lumière, allumée et éteinte", () => {
  // La torche : la flamme allumée, la fumée et les braises éteinte.
  assert.match(dessinerLumiere("torche", true), /class="flamme"/);
  assert.doesNotMatch(dessinerLumiere("torche", true), /class="fumee"/);
  assert.match(dessinerLumiere("torche", false), /class="fumee"/);
  assert.match(dessinerLumiere("torche", false), /fill="#c8562b"/);
  // La frontale : le boîtier jaune, la lentille blanche et le faisceau allumée, grise éteinte.
  assert.match(dessinerLumiere("frontale", true), /fill="#d8c43a"[\s\S]*r="5.4" fill="#ffffff"/);
  assert.match(dessinerLumiere("frontale", true), /class="faisceau"/);
  assert.match(dessinerLumiere("frontale", false), /r="5.4" fill="#5d5a55"/);
  assert.doesNotMatch(dessinerLumiere("frontale", false), /faisceau/);
  // La lanterne : la vitre jaune et sa petite flamme allumée, la vitre sombre éteinte.
  assert.match(dessinerLumiere("lanterne", true), /fill="#ffd27a"[\s\S]*class="flamme petite"/);
  assert.match(dessinerLumiere("lanterne", false), /h14 v19 h-14 Z" fill="#59626a"/);
  // La lampe bricolée : le corps bleu et ses tours de ruban, le faisceau vers la droite allumée.
  assert.match(dessinerLumiere("lampe", true), /class="faisceau"[\s\S]*fill="#7a8fa8"/);
  assert.doesNotMatch(dessinerLumiere("lampe", false), /faisceau/);
  // Les dessins sont différents les uns des autres.
  const dessins = (["torche", "frontale", "lanterne", "lampe"] as const).map((g) => dessinerLumiere(g, false).replace(/bl-\w\d+/g, ""));
  assert.equal(new Set(dessins).size, 4);
});

test("aucune lumière : une torche grise, sans flamme ni fumée", () => {
  const svg = dessinerLumiere(null, false);
  assert.match(svg, /fill="#77706a"/);
  assert.doesNotMatch(svg, /flamme|fumee/);
  assert.deepEqual(etatBouton({}, {}, true), { genre: null, allumee: false, vide: false });
});

test("la frontale vide se montre éteinte, avec la petite pile vide ; chargée, pas de pile ; une autre lumière, jamais", () => {
  assert.deepEqual(etatBouton({ lampe_frontale: 1 }, { petite_batterie: 0 }, true), { genre: "frontale", allumee: false, vide: true });
  assert.deepEqual(etatBouton({ lampe_frontale: 1 }, { petite_batterie: 0.1 }, false), { genre: "frontale", allumee: false, vide: true });
  assert.deepEqual(etatBouton({ lampe_frontale: 1 }, {}, true), { genre: "frontale", allumee: false, vide: true });
  assert.deepEqual(etatBouton({ lampe_frontale: 1 }, { petite_batterie: 0.11 }, true), { genre: "frontale", allumee: true, vide: false });
  assert.deepEqual(etatBouton({ lampe_frontale: 1 }, plein, false), { genre: "frontale", allumee: false, vide: false });
  // Une autre lumière, petite batterie vide ou pas : jamais de pile.
  for (const inv of [{ torche: 1 }, { lanterne: 1 }, { lampe_bricolee: 1 }, {}]) assert.equal(etatBouton(inv, {}, true).vide, false);
  // Le dessin : la pile vide dans un coin, la frontale éteinte (lentille grise, pas de faisceau).
  const vide = dessinerLumiere("frontale", true, true);
  assert.match(vide, /class="pile-vide"/);
  assert.match(vide, /r="5.4" fill="#5d5a55"/);
  assert.doesNotMatch(vide, /faisceau/);
  assert.doesNotMatch(dessinerLumiere("frontale", false), /pile-vide/);
  assert.doesNotMatch(dessinerLumiere("frontale", true), /pile-vide/);
  for (const g of ["torche", "lanterne", "lampe", null] as const) assert.doesNotMatch(dessinerLumiere(g, false), /pile-vide/);
  // Le bouton suit les charges : la petite batterie se vide, la pile paraît ; rechargée, elle s'en va.
  const f = fauxBouton();
  const b = new BoutonLumiere(f.bouton, f.dessin);
  b.maj({ lampe_frontale: 1 }, plein, true);
  assert.doesNotMatch(f.dessin.innerHTML, /pile-vide/);
  assert.ok(f.classes.has("allumee"));
  b.maj({ lampe_frontale: 1 }, { petite_batterie: 0.05 }, true);
  assert.match(f.dessin.innerHTML, /pile-vide/);
  assert.ok(!f.classes.has("allumee"));
  assert.equal(f.attributs.get("aria-pressed"), "false");
  b.maj({ lampe_frontale: 1 }, plein, false);
  assert.doesNotMatch(f.dessin.innerHTML, /pile-vide/);
});

test("l'étiquette du bouton : allumer ou éteindre, avec le nom de la lumière", () => {
  const e = (genre: Parameters<typeof dessinerLumiere>[0], allumee: boolean, vide = false) => etiquetteLumiere({ genre, allumee, vide });
  assert.equal(e("torche", false), "Allumer ta torche");
  assert.equal(e("lanterne", true), "Éteindre ta lanterne");
  assert.equal(e("frontale", true), "Éteindre ta lampe frontale");
  assert.equal(e("frontale", false, true), "Allumer ta lampe frontale (sa petite batterie est vide)");
  assert.equal(e("lampe", false), "Allumer ta lampe bricolée");
  assert.equal(e(null, false), "Lumière (tu n'en as pas)");
});

test("BoutonLumiere : classes, aria-pressed, aria-label ; pas de redessin sans changement", () => {
  const f = fauxBouton();
  const b = new BoutonLumiere(f.bouton, f.dessin);
  b.maj({ torche: 1 }, {}, false);
  assert.ok(f.classes.has("g-torche") && !f.classes.has("allumee") && !f.classes.has("sans"));
  assert.equal(f.attributs.get("aria-pressed"), "false");
  assert.equal(f.attributs.get("aria-label"), "Allumer ta torche");
  // Rien ne change (un autre objet ramassé, les charges qui bougent) : le dessin reste tel quel, la flamme ne repart pas.
  f.dessin.innerHTML = "témoin";
  b.maj({ torche: 1, pierre: 3 }, plein, false);
  assert.equal(f.dessin.innerHTML, "témoin");
  // Allumée : redessinée.
  b.maj({ torche: 1 }, {}, true);
  assert.notEqual(f.dessin.innerHTML, "témoin");
  assert.ok(f.classes.has("allumee"));
  assert.equal(f.attributs.get("aria-pressed"), "true");
  assert.equal(f.attributs.get("aria-label"), "Éteindre ta torche");
  // L'inventaire change (la torche échangée contre une lanterne) : le dessin suit.
  b.maj({ lanterne: 1 }, {}, true);
  assert.ok(f.classes.has("g-lanterne") && !f.classes.has("g-torche"));
  assert.match(f.dessin.innerHTML, /flamme petite/);
  // Plus rien : le rond en pointillé.
  b.maj({}, {}, true);
  assert.ok(f.classes.has("sans") && !f.classes.has("allumee") && !f.classes.has("g-lanterne"));
  assert.equal(f.attributs.get("aria-pressed"), "false");
});

test("le HUD : un rond avec son dessin, la même commande ; l'aide nomme le bouton de ta lumière au téléphone", () => {
  const hud = readFileSync(new URL("./hud.ts", import.meta.url), "utf8");
  assert.match(hud, /class="b-lumiere"[^>]*><span class="dessin"><\/span><\/button>/);
  assert.match(hud, /lier\("\.b-lumiere", "lumiere"\)/);
  assert.equal(avecTouches("Pour allumer ou éteindre ta lumière : {lumiere}.", true), "Pour allumer ou éteindre ta lumière : le bouton de ta lumière.");
  const css = readFileSync(new URL("./style.css", import.meta.url), "utf8");
  assert.match(css, /prefers-reduced-motion: reduce\) \{\s*#hud \.tactile \.b-lumiere,/);
});
