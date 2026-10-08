// Les réglages d'équilibrage à chaud (É5, lot 4).

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DEFINITIONS_REGLAGES, REGLAGES, appliquerReglages } from "../../commun/src/reglages.ts";
import { dureeReelle, recette } from "../../commun/src/recettes.ts";
import { FichierReglages } from "./reglages-fichier.ts";

test("un réglage change le jeu tout de suite ; hors bornes, il est ramené ; inconnu, il est signalé", () => {
  const remarques = appliquerReglages({ fabrication_acceleration: 10, faim_rythme: 99, bidule: 3, _commentaire: "ok" });
  assert.equal(dureeReelle(recette("abri")!), 6, "60 min de jeu / 10");
  assert.equal(REGLAGES.faim_rythme, DEFINITIONS_REGLAGES.faim_rythme.max);
  assert.equal(remarques.length, 2);
  appliquerReglages({});
  assert.equal(dureeReelle(recette("abri")!), 3, "retour au défaut");
});

test("le fichier est relu quand il change ; s'il est illisible, on garde les réglages en cours", () => {
  // Dans le dossier du projet (jamais dans un dossier temporaire du système).
  const dossier = join(import.meta.dirname, "..", "donnees", "essais-reglages");
  mkdirSync(dossier, { recursive: true });
  const chemin = join(dossier, "reglages.json");
  const recus: unknown[] = [];
  try {
    writeFileSync(chemin, JSON.stringify({ poules_terrain: 5 }));
    const f = new FichierReglages(chemin, (c) => recus.push(c));
    f.charger();
    assert.equal(REGLAGES.poules_terrain, 5);
    assert.deepEqual(recus.at(-1), { poules_terrain: 5 });
    writeFileSync(chemin, "{ pas du json");
    f.charger();
    assert.equal(REGLAGES.poules_terrain, 5, "gardé");
    writeFileSync(chemin, "{}");
    f.charger();
    assert.equal(REGLAGES.poules_terrain, 3);
  } finally {
    appliquerReglages({});
    rmSync(dossier, { recursive: true, force: true });
  }
});
