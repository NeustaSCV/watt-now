// Le panneau d'échange sur iPhone (plan 0.10.1, chantier C, A3 ; maquette V2 « toucher = choisir »). Sans DOM dans les
// tests : on lit le HTML que le module dessine, et un faux panneau lit ses boutons.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ajusterOffre, ajusterWotts, brancherEchange, htmlEchange, lirePlaces, remettrePlaces, type GestesEchange, type VueEchange } from "./panneau-echange.ts";
import type { CleObjet } from "../../commun/src/etoiles.ts";
import type { Inventaire } from "../../commun/src/objets.ts";

const INVENTAIRE: Inventaire = { gourde: 1, branche: 6, pierre: 4, pomme: 5, "lame_forgee#4": 1 } as Inventaire;

function vue(autres: Partial<VueEchange> = {}): VueEchange {
  return {
    echange: {
      avec: { id: 2, pseudo: "Marion", famille: "voltaiques" },
      moi: { objets: {}, wotts: 0 },
      lui: { objets: { "serpe#4": 1, carreau: 5 } as Inventaire, wotts: 30 },
      accordMoi: false,
      accordLui: false,
    },
    offre: { objets: { pomme: 3 } as Inventaire, wotts: 20 },
    sac: Object.keys(INVENTAIRE) as CleObjet[],
    inventaire: INVENTAIRE,
    poche: 247.3,
    choisi: null,
    couleur: "#2f5fa4",
    ...autres,
  };
}

/** Le bouton porteur d'un attribut `data-*` donné, dans un morceau de HTML. */
function bouton(html: string, attribut: string): string | undefined {
  return [...html.matchAll(/<button[^>]*>/g)].map((m) => m[0]).find((b) => b.includes(attribut));
}

test("le panneau : ce que tu reçois, ce que tu donnes, les wotts, ton sac en grille, la barre du choix, le pied ; plus de croix", () => {
  const html = htmlEchange(vue());
  for (const morceau of ['class="z recoit"', 'class="z donnes"', 'class="wotts-offre"', 'class="z mon-sac"', 'class="grille"', 'class="choix', 'class="pied"', "data-annuler", "data-accord"]) {
    assert.ok(html.includes(morceau), morceau);
  }
  // L'ordre de la maquette : reçois, donnes, wotts, sac, pied.
  const ordre = ["z recoit", "z donnes", "wotts-offre", "z mon-sac", "pied"].map((c) => html.indexOf(c));
  assert.deepEqual([...ordre].sort((a, b) => a - b), ordre);
  // « Annuler » suffit : ni croix ni bouton « fermer ».
  assert.ok(!html.includes("✕") && !html.includes("fermer"));
  assert.match(html, /Échange avec <span class="pastille" style="background:#2f5fa4"><\/span>Marion/);
  // En paysage, « Tu reçois de ● Marion » remplace l'en-tête (le CSS montre .de-qui).
  assert.match(html, /<span class="de-qui">de <span class="pastille"[^>]*><\/span>Marion<\/span>/);
  // Ce que tu reçois : les icônes avec étoiles et quantités, les wotts, puis la ligne des noms.
  assert.match(html, /<span class="etoiles-case"[^>]*>4★<\/span>/);
  assert.ok(html.includes('<span class="badge">×5</span>'));
  assert.ok(html.includes('<span class="pion-wotts">⚡ 30 wotts</span>'));
  assert.match(html, /<p class="resume">serpe <span class="etoiles-nom">★★★★<\/span>, 5 carreaux, 30 wotts<\/p>/);
  // Ce que tu donnes : la ligne des noms, et l'objet posé se touche pour le choisir.
  assert.match(html, /<p class="resume">3 pommes<\/p>/);
  assert.ok(bouton(html.slice(html.indexOf("z donnes"), html.indexOf("wotts-offre")), 'data-choisir="pomme"'));
  // Le sac : une case par objet, avec ×n et la pastille du nombre posé.
  const cases = [...html.matchAll(/<button type="button" class="case[^"]*" data-choisir="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(cases, ["gourde", "branche", "pierre", "pomme", "lame_forgee#4"]);
  assert.ok(html.includes('<span class="nombre-pose">3</span>'));
  assert.equal(html.match(/nombre-pose/g)!.length, 1);
  // Les wotts : en poche, et l'offre.
  assert.ok(html.includes("<b>20 wotts</b>") && html.includes("en poche<br>247 wotts"));
});

test("la barre du choix : vide tant que rien n'est choisi, puis le nom, les étoiles, ce que le sac contient, − et +", () => {
  assert.match(htmlEchange(vue()), /<div class="choix vide"><p>Touche un objet pour le donner.<\/p><\/div>/);
  const html = htmlEchange(vue({ choisi: "lame_forgee#4" }));
  const barre = html.slice(html.indexOf('<div class="choix">'));
  assert.match(barre, /<span class="nom">couteau de forge <span class="etoiles-nom">★★★★<\/span><small>1 dans ton sac<\/small><\/span>/);
  assert.ok(bouton(barre, 'data-moins="lame_forgee#4"')!.includes("disabled"), "rien de posé : − grisé");
  assert.ok(!bouton(barre, 'data-plus="lame_forgee#4"')!.includes("disabled"));
  assert.match(html, /class="case choisie" data-choisir="lame_forgee#4" aria-pressed="true"/);
  // Un objet choisi qui n'est plus dans le sac ne laisse pas une barre fantôme.
  assert.match(htmlEchange(vue({ choisi: "corde" })), /class="choix vide"/);
});

test("+ s'arrête au contenu du sac, − descend jusqu'à 0 (et l'objet quitte l'offre)", () => {
  let o = { objets: {} as Inventaire, wotts: 0 };
  for (let i = 0; i < 8; i++) o = ajusterOffre(o, INVENTAIRE, "pomme", 1);
  assert.equal(o.objets.pomme, 5, "plafonné aux 5 pommes du sac");
  let html = htmlEchange(vue({ offre: o, choisi: "pomme" }));
  assert.ok(bouton(html, 'data-plus="pomme"')!.includes("disabled"), "+ grisé quand tout est posé");
  assert.match(html, /class="case posee epuisee choisie" data-choisir="pomme"/);
  for (let i = 0; i < 8; i++) o = ajusterOffre(o, INVENTAIRE, "pomme", -1);
  assert.ok(!("pomme" in o.objets), "à 0, l'objet n'est plus dans l'offre");
  html = htmlEchange(vue({ offre: o, choisi: "pomme" }));
  assert.ok(bouton(html, 'data-moins="pomme"')!.includes("disabled"), "− grisé à 0");
  assert.match(html, /<div class="choix">[\s\S]*<b>0<\/b>/);
  // Un objet absent du sac ne se pose pas.
  assert.deepEqual(ajusterOffre(o, INVENTAIRE, "corde" as CleObjet, 1).objets, {});
  // Les wotts : jamais sous 0, jamais plus qu'en poche (au dixième).
  assert.equal(ajusterWotts({ objets: {}, wotts: 0 }, 247.3, -10).wotts, 0);
  assert.equal(ajusterWotts({ objets: {}, wotts: 240 }, 247.36, 10).wotts, 247.3);
  assert.ok(bouton(htmlEchange(vue({ offre: { objets: {}, wotts: 0 } })), 'data-wotts="-10"')!.includes("disabled"));
});

test("l'objet choisi reste choisi quand le serveur redessine (l'autre change son offre, les accords bougent)", () => {
  const avant = htmlEchange(vue({ choisi: "pierre" }));
  const v = vue({ choisi: "pierre" });
  v.echange = { ...v.echange, lui: { objets: { cellule_lithium: 2 } as Inventaire, wotts: 0 }, accordLui: true };
  const apres = htmlEchange(v);
  assert.notEqual(apres, avant);
  for (const html of [avant, apres]) {
    assert.match(html, /class="case choisie" data-choisir="pierre"/);
    assert.match(html, /<div class="choix">[\s\S]*pierre<small>4 dans ton sac<\/small>/);
  }
  // Le HUD tient le choix hors du dessin : il ne l'oublie qu'à l'ouverture d'un nouvel échange, et remet la grille et les
  // rangées à leur place autour du redessin.
  const hud = readFileSync(new URL("./hud.ts", import.meta.url), "utf8");
  const maj = hud.slice(hud.indexOf("  majEchange("), hud.indexOf("  get echangeEnCours"));
  assert.equal(maj.match(/this\.choixEchange = null/g)?.length, 1);
  assert.match(maj, /if \(nouveau\) \{\s*this\.monOffre = \{ objets: \{\}, wotts: 0 \};\s*this\.choixEchange = null;/);
  const dessin = hud.slice(hud.indexOf("  private dessinerEchange("), hud.indexOf("  // ---------- Le rapport de la base"));
  assert.match(dessin, /choisi: this\.choixEchange/);
  assert.match(dessin, /const places = lirePlaces\(el\);\s*el\.innerHTML = html;\s*remettrePlaces\(el, places\);/);
});

test("la place de la grille et des rangées est remise après un redessin", () => {
  const grille = { dataset: { defile: "grille" }, scrollTop: 180, scrollLeft: 0 };
  const rang = { dataset: { defile: "recoit" }, scrollTop: 0, scrollLeft: 64 };
  const places = lirePlaces({ querySelectorAll: () => [grille, rang] } as unknown as ParentNode);
  const neufs = [
    { dataset: { defile: "grille" }, scrollTop: 0, scrollLeft: 0 },
    { dataset: { defile: "recoit" }, scrollTop: 0, scrollLeft: 0 },
    { dataset: { defile: "donnes" }, scrollTop: 0, scrollLeft: 0 },
  ];
  remettrePlaces({ querySelectorAll: () => neufs } as unknown as ParentNode, places);
  assert.deepEqual(neufs.map((e) => [e.scrollTop, e.scrollLeft]), [[180, 0], [0, 64], [0, 0]]);
});

test("chaque bouton du panneau reçoit son geste, un seul", () => {
  const html = htmlEchange(vue({ choisi: "pomme" }));
  type Faux = { dataset: Record<string, string>; clic: (() => void)[]; addEventListener(t: string, f: () => void): void };
  const boutons: Faux[] = [...html.matchAll(/<button([^>]*)>/g)].map((m) => {
    const dataset: Record<string, string> = {};
    for (const d of m[1].matchAll(/data-([a-z-]+)(?:="([^"]*)")?/g)) dataset[d[1]] = d[2] ?? "";
    const b: Faux = { dataset, clic: [], addEventListener: (t, f) => t === "click" && b.clic.push(f) };
    return b;
  });
  const racine = {
    querySelectorAll: (sel: string) => {
      const nom = /^\[data-([a-z-]+)\]$/.exec(sel)?.[1];
      if (!nom) throw new Error(`sélecteur inattendu : ${sel}`);
      return boutons.filter((b) => nom in b.dataset);
    },
  } as unknown as ParentNode;
  const faits: string[] = [];
  const gestes: GestesEchange = {
    choisir: (c) => faits.push(`choisir ${c}`),
    ajuster: (c, d) => faits.push(`${d > 0 ? "+" : "−"} ${c}`),
    wotts: (d) => faits.push(`wotts ${d}`),
    annuler: () => faits.push("annuler"),
    accord: () => faits.push("accord"),
  };
  brancherEchange(racine, gestes);
  for (const b of boutons) assert.equal(b.clic.length, 1, JSON.stringify(b.dataset));
  for (const b of boutons) b.clic[0]();
  assert.deepEqual(faits, [
    "choisir pomme", // l'objet posé, dans « Tu donnes »
    "wotts -10",
    "wotts 10",
    "choisir gourde",
    "choisir branche",
    "choisir pierre",
    "choisir pomme",
    "choisir lame_forgee#4",
    "− pomme",
    "+ pomme",
    "annuler",
    "accord",
  ]);
});
