// La version du jeu (0.7, chantier 9) : le numéro affiché, celui de package.json et la section de code/VERSIONS.md
// doivent dire la même chose. Une livraison qui oublie l'un des trois se voit ici.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { VERSION } from "./version.ts";

const racine = join(import.meta.dirname, "..", "..");

test("version : package.json porte le même numéro que commun/src/version.ts", () => {
  const paquet = JSON.parse(readFileSync(join(racine, "package.json"), "utf8")) as { version: string };
  // « 0.7 » s'écrit « 0.7.0 » dans package.json ; « 0.5.3 » s'écrit tel quel.
  const attendu = VERSION.split(".").length === 2 ? `${VERSION}.0` : VERSION;
  assert.equal(paquet.version, attendu);
});

test("version : VERSIONS.md a une section pour la version courante, en tête", () => {
  const notes = readFileSync(join(racine, "VERSIONS.md"), "utf8");
  // Une section « en préparation » (la prochaine version, pas encore livrée) peut la précéder.
  const sections = [...notes.matchAll(/^## (\S+) · (.*)$/gm)].filter((m) => !m[2]!.startsWith("en préparation")).map((m) => m[1]);
  assert.ok(sections.length > 0, "aucune section « ## x.y · … »");
  assert.equal(sections[0], VERSION, "la première section de VERSIONS.md doit être celle de la version courante");
});

test("version : les notes de la version courante, une ligne courte par nouveauté", () => {
  const notes = readFileSync(join(racine, "VERSIONS.md"), "utf8");
  const debut = notes.indexOf(`## ${VERSION} · `);
  const fin = notes.indexOf("\n## ", debut + 1);
  const section = notes.slice(debut, fin === -1 ? undefined : fin);
  const lignes = section.split("\n").filter((l) => l.startsWith("- "));
  // Une version corrective (x.y.z) peut être courte ; une version (x.y) apporte au moins dix nouveautés.
  const minimum = VERSION.split(".").length === 3 ? 3 : 10;
  assert.ok(lignes.length >= minimum, "la section de la version courante est presque vide");
  // Une ligne par nouveauté, lisible d'un regard : pas de pavé.
  for (const l of lignes) assert.ok(l.length <= 420, `ligne trop longue (${l.length}) : ${l.slice(0, 60)}`);
});
