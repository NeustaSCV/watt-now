// Les icônes (0.7, chantier 3) : aucun objet ni aucune installation ne garde l'icône générique, les 91 déchets de
// l'Abondance ont chacun leur dessin, et chaque dessin est un fragment SVG sain (pas de « undefined », balises fermées).

import { test } from "node:test";
import assert from "node:assert/strict";
import { OBJETS, type TypeObjet } from "../../commun/src/objets.ts";
import { NOMS_INSTALLATIONS, type TypeInstallation } from "../../commun/src/recettes.ts";
import { NOMS_FAMILLES_VESTIGES, type FamilleVestige } from "../../commun/src/vestiges.ts";
import { VESTIGES_LOT2 } from "../../commun/src/vestiges-lot2.ts";
import { DESSINS_DECHETS } from "./icones-dechets.ts";
import { DESSINS_NIVEAU1 } from "./icones-niveau1.ts";
import { NOUVEAUX_OBJETS_0_8, NOUVEAUX_OBJETS_0_8_2 } from "../../commun/src/objets-niveau1.ts";
import { estDessinee, icone, iconeFamille, type Pictogramme } from "./icones.ts";

const TOUS: Pictogramme[] = [
  "feu_de_camp",
  "poches",
  ...(Object.keys(OBJETS) as TypeObjet[]),
  ...(Object.keys(NOMS_INSTALLATIONS) as TypeInstallation[]),
];

/** Les balises d'un fragment SVG : chaque élément est auto-fermé ou refermé, et aucun gabarit n'a laissé de trou. */
function verifierSvg(nom: string, svg: string): void {
  assert.ok(!svg.includes("undefined"), `${nom} : « undefined » dans le dessin`);
  assert.ok(!svg.includes("NaN"), `${nom} : « NaN » dans le dessin`);
  assert.ok(!svg.includes("COULEUR"), `${nom} : une couleur à remplacer est restée`);
  assert.ok(!svg.includes("${"), `${nom} : un gabarit non résolu`);
  const ouvrantes = svg.match(/<(?!\/)[a-z]+\b(?:[^>]*[^/>])?>/g) ?? [];
  const fermantes = svg.match(/<\/[a-z]+>/g) ?? [];
  assert.equal(ouvrantes.length, fermantes.length, `${nom} : balises ouvertes ${ouvrantes.length}, fermées ${fermantes.length}`);
  for (const balise of svg.match(/<[^>]*>/g) ?? []) {
    const guillemets = (balise.match(/"/g) ?? []).length;
    assert.equal(guillemets % 2, 0, `${nom} : guillemets déséquilibrés dans ${balise.slice(0, 60)}`);
  }
}

test("aucun objet ni aucune installation ne garde l'icône générique", () => {
  const generiques = TOUS.filter((t) => !estDessinee(t));
  assert.deepEqual(generiques, []);
});

test("chacun des déchets de l'Abondance (lot 2) a son propre dessin", () => {
  const lot2 = Object.keys(VESTIGES_LOT2);
  assert.ok(lot2.length >= 90, `le catalogue compte ${lot2.length} objets`);
  for (const type of lot2) assert.ok(Object.hasOwn(DESSINS_DECHETS, type), `${type} sans dessin`);
});

test("les dessins des déchets ne désignent que des objets ou des installations qui existent", () => {
  const connus = new Set<string>(TOUS);
  for (const type of Object.keys(DESSINS_DECHETS)) assert.ok(connus.has(type), `${type} : dessin d'un objet inconnu`);
});

test("chaque icône est un SVG 48 × 48 bien formé", () => {
  for (const type of TOUS) {
    const svg = icone(type, 40);
    assert.match(svg, /^<svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">/);
    assert.ok(svg.endsWith("</svg>"));
    verifierSvg(type, svg);
  }
});

test("les pictogrammes des onze familles, dont déchet, textile et loisir, sont bien formés", () => {
  const familles = Object.keys(NOMS_FAMILLES_VESTIGES) as FamilleVestige[];
  assert.ok(familles.includes("dechet") && familles.includes("textile") && familles.includes("loisir"));
  const vus = new Set<string>();
  for (const f of familles) {
    const svg = iconeFamille(f, 48);
    verifierSvg(f, svg);
    vus.add(svg);
  }
  assert.equal(vus.size, familles.length, "deux familles partagent le même pictogramme");
});

test("deux objets du lot 2 n'ont jamais le même dessin", () => {
  const vus = new Map<string, string>();
  for (const [type, dessin] of Object.entries(DESSINS_DECHETS)) {
    const deja = vus.get(dessin);
    assert.equal(deja, undefined, `${type} et ${deja} ont le même dessin`);
    vus.set(dessin, type);
  }
});

test("chaque objet nouveau de la 0.8 a son propre dessin, et deux d'entre eux n'ont jamais le même (plan 0.8, chantier 3)", () => {
  assert.ok(NOUVEAUX_OBJETS_0_8.length >= 18);
  const vus = new Map<string, string>();
  for (const type of NOUVEAUX_OBJETS_0_8) {
    assert.ok(Object.hasOwn(DESSINS_NIVEAU1, type), `${type} sans dessin`);
    assert.ok(estDessinee(type), type);
    const dessin = DESSINS_NIVEAU1[type]!;
    assert.equal(vus.get(dessin), undefined, `${type} et ${vus.get(dessin)} ont le même dessin`);
    vus.set(dessin, type);
  }
  // Les deux installations nouvelles aussi ; et rien d'inconnu dans la table.
  for (const type of ["ratelier_outils", "torche_plantee"] as Pictogramme[]) assert.ok(Object.hasOwn(DESSINS_NIVEAU1, type), type);
  const connus = new Set<string>(TOUS);
  for (const type of Object.keys(DESSINS_NIVEAU1)) assert.ok(connus.has(type), `${type} : dessin d'un objet inconnu`);
});

test("les deux condensateurs de la 0.8.2 ont chacun leur dessin, distinct de tous les autres (R14)", () => {
  const tous = new Set(Object.values(DESSINS_NIVEAU1));
  assert.equal(tous.size, Object.keys(DESSINS_NIVEAU1).length, "deux dessins du niveau 1 identiques");
  for (const type of NOUVEAUX_OBJETS_0_8_2) {
    assert.ok(Object.hasOwn(DESSINS_NIVEAU1, type), `${type} sans dessin`);
    assert.ok(estDessinee(type), type);
    verifierSvg(type, icone(type, 48));
  }
});
