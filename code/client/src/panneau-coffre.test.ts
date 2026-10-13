// Le panneau du coffre et de la décharge (plan 0.8.2, chantier A, R5) : la croix, les cases et « Ranger » / « Prendre »
// reçoivent le geste. Sans DOM dans les tests : un faux panneau lit les boutons du HTML que le HUD dessine.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { brancherCoffre, enteteCoffre, type GestesCoffre } from "./panneau-coffre.ts";

/** Un bouton du faux panneau : ses classes, ses `data-*`, et ce qu'on y a branché. */
interface FauxBouton {
  classes: string[];
  dataset: Record<string, string>;
  dansEntete: boolean;
  clic: (() => void)[];
  addEventListener(type: string, f: () => void): void;
}

/** Les boutons d'un morceau de HTML, avec un `querySelectorAll` réduit aux sélecteurs du panneau. */
function fauxPanneau(html: string) {
  const boutons: FauxBouton[] = [];
  const finEntete = html.indexOf("</header>");
  for (const m of html.matchAll(/<button([^>]*)>/g)) {
    const attributs = m[1];
    const dataset: Record<string, string> = {};
    for (const d of attributs.matchAll(/data-([a-z-]+)="([^"]*)"/g)) dataset[d[1]] = d[2];
    const b: FauxBouton = {
      classes: (/class="([^"]*)"/.exec(attributs)?.[1] ?? "").split(/\s+/).filter(Boolean),
      dataset,
      dansEntete: m.index < finEntete,
      clic: [],
      addEventListener: (type, f) => type === "click" && b.clic.push(f),
    };
    boutons.push(b);
  }
  const choisir = (sel: string): FauxBouton[] => {
    if (sel === "header .fermer") return boutons.filter((b) => b.dansEntete && b.classes.includes("fermer"));
    if (sel === ".case[data-sens]") return boutons.filter((b) => b.classes.includes("case") && "sens" in b.dataset);
    if (sel === "[data-deplacer]") return boutons.filter((b) => "deplacer" in b.dataset);
    throw new Error(`sélecteur inattendu : ${sel}`);
  };
  return { boutons, racine: { querySelectorAll: choisir } as unknown as ParentNode };
}

/** Un panneau comme le dessine le HUD : l'en-tête, une case de chaque côté, la bande et ses deux boutons. */
const HTML = `
  ${enteteCoffre("Coffre")}
  <div class="colonnes">
    <section><div class="grille"><button type="button" class="case" data-sens="deposer" data-objet="ficelle" aria-pressed="false">x</button></div></section>
    <section><div class="grille"><button type="button" class="case choisie" data-sens="prendre" data-objet="pierre" aria-pressed="true">x</button></div></section>
  </div>
  <div class="bande-objet"><span class="boutons"><button type="button" class="principal" data-deplacer="1">Prendre 1</button><button type="button" data-deplacer="tout">Tout (2)</button></span></div>`;

function journal(): { gestes: GestesCoffre; faits: string[] } {
  const faits: string[] = [];
  return {
    faits,
    gestes: {
      fermer: () => faits.push("fermer"),
      toucherCase: (sens, objet) => faits.push(`case ${sens} ${objet}`),
      deplacer: (tout) => faits.push(tout ? "tout" : "un"),
    },
  };
}

test("le panneau du coffre : la croix, chaque case et les deux boutons reçoivent le geste", () => {
  const { boutons, racine } = fauxPanneau(HTML);
  const { gestes, faits } = journal();
  brancherCoffre(racine, gestes);
  // Chaque bouton du panneau a son geste, un seul.
  for (const b of boutons) assert.equal(b.clic.length, 1, `bouton ${b.classes.join(" ")} ${JSON.stringify(b.dataset)}`);
  for (const b of boutons) b.clic[0]();
  assert.deepEqual(faits, ["fermer", "case deposer ficelle", "case prendre pierre", "un", "tout"]);
});

test("le panneau du coffre garde sa croix (ouvert au toucher ou à la souris, règle du porteur)", () => {
  assert.equal(enteteCoffre("Décharge"), `<header><h2>Décharge</h2><button type="button" class="fermer" aria-label="Fermer">✕</button></header>`);
  const { boutons } = fauxPanneau(enteteCoffre("Râtelier à outils"));
  assert.equal(boutons.filter((b) => b.dansEntete && b.classes.includes("fermer")).length, 1);
});

test("un bouton absent ne rend pas le reste du panneau sourd", () => {
  // Une décharge où l'on a choisi un objet du sac : pas de « Ranger » (elle ne reprend rien), le reste répond.
  const { racine } = fauxPanneau(HTML.replace(/<span class="boutons">.*<\/span>/, `<span class="boutons"></span>`));
  const { gestes, faits } = journal();
  assert.doesNotThrow(() => brancherCoffre(racine, gestes));
  const { boutons, racine: r2 } = fauxPanneau(`<header><h2>Coffre</h2></header>${HTML.slice(HTML.indexOf("</header>") + 9)}`);
  assert.doesNotThrow(() => brancherCoffre(r2, gestes));
  boutons.find((b) => b.dataset.objet === "ficelle")!.clic[0]();
  assert.deepEqual(faits, ["case deposer ficelle"]);
});

test("non-régression R5 : le HUD dessine le coffre avec son en-tête et le branche par brancherCoffre", () => {
  // La cause du défaut de la 0.8 : dessinerCoffre branchait `.fermer-fiche` (le bouton de la fiche Examiner), absent du
  // coffre ; l'erreur levée laissait la croix, les cases et les boutons sans geste, au toucher comme à la souris.
  const hud = readFileSync(new URL("./hud.ts", import.meta.url), "utf8");
  const debut = hud.indexOf("  private dessinerCoffre(");
  assert.ok(debut > 0);
  const corps = hud.slice(debut, hud.indexOf("\n  }\n", debut));
  assert.ok(!corps.includes("fermer-fiche"), "le coffre n'a pas le bouton de la fiche");
  assert.ok(!/querySelector\([^)]*\)!/.test(corps), "pas de querySelector(…)! qui lèverait une erreur sur un bouton absent");
  assert.match(corps, /\$\{enteteCoffre\(/, "l'en-tête (et sa croix) vient de panneau-coffre.ts");
  assert.match(corps, /brancherCoffre\(p, \{/, "les gestes se branchent par panneau-coffre.ts");
  // Et le coffre s'ouvre par ce dessin, pour le coffre, le coffre cerclé, le râtelier et la décharge.
  assert.match(hud, /ouvrirCoffre\(i: InstallationVue\): void \{[\s\S]*?this\.dessinerCoffre\(\);/);
  const interaction = readFileSync(new URL("./interaction.ts", import.meta.url), "utf8");
  for (const libelle of ["Ouvrir le coffre", "Ranger tes outils", "Fouiller la décharge"]) assert.ok(interaction.includes(`libelle: ${libelle.startsWith("Fouiller") ? "`" : '"'}${libelle}`), libelle);
});
