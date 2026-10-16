// Les sauvegardes quotidiennes et hebdomadaires de la base (Book 17 §5.4).

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Base } from "./base.ts";
import { Sauvegardes, aSupprimer, nomsDuJour } from "./sauvegardes.ts";

test("noms du jour et de la semaine ; on garde 7 quotidiennes et 4 hebdomadaires", () => {
  assert.deepEqual(nomsDuJour(new Date("2026-10-08T12:00:00Z")), { quotidienne: "quotidienne-2026-10-08.sqlite", hebdomadaire: "hebdomadaire-2026-S41.sqlite" });
  const fichiers = [
    ...Array.from({ length: 10 }, (_, i) => `quotidienne-2026-10-${String(i + 1).padStart(2, "0")}.sqlite`),
    ...Array.from({ length: 6 }, (_, i) => `hebdomadaire-2026-S${30 + i}.sqlite`),
    "autre.txt",
  ];
  assert.deepEqual(aSupprimer(fichiers).sort(), [
    "hebdomadaire-2026-S30.sqlite",
    "hebdomadaire-2026-S31.sqlite",
    "quotidienne-2026-10-01.sqlite",
    "quotidienne-2026-10-02.sqlite",
    "quotidienne-2026-10-03.sqlite",
  ]);
});

test("en production (VPS) : les 5 dernières quotidiennes seulement, et plus d'hebdomadaire", () => {
  const dossier = join(import.meta.dirname, "..", "donnees", "essais-sauvegardes-prod");
  rmSync(dossier, { recursive: true, force: true });
  mkdirSync(dossier, { recursive: true });
  try {
    const base = new Base(join(dossier, "jeu.sqlite"));
    const s = new Sauvegardes(base, join(dossier, "sauvegardes"), undefined, { quotidiennes: 5, hebdomadaires: 0 });
    for (let j = 1; j <= 8; j++) s.verifier(new Date(`2026-10-${String(j).padStart(2, "0")}T03:00:00Z`));
    assert.deepEqual(readdirSync(join(dossier, "sauvegardes")).sort(), [4, 5, 6, 7, 8].map((j) => `quotidienne-2026-10-0${j}.sqlite`));
    base.fermer();
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
});

test("la sauvegarde est une vraie base, lisible, avec les comptes ; une seule par jour", () => {
  // Dans le dossier du projet (jamais dans un dossier temporaire du système).
  const dossier = join(import.meta.dirname, "..", "donnees", "essais-sauvegardes");
  rmSync(dossier, { recursive: true, force: true });
  mkdirSync(dossier, { recursive: true });
  try {
    const base = new Base(join(dossier, "jeu.sqlite"));
    base.creerCompte("Rose", "potager42", "mecanistes");
    const s = new Sauvegardes(base, join(dossier, "sauvegardes"));
    const jour = new Date("2026-10-08T03:00:00Z");
    s.verifier(jour);
    s.verifier(jour);
    const faites = readdirSync(join(dossier, "sauvegardes")).sort();
    assert.deepEqual(faites, ["hebdomadaire-2026-S41.sqlite", "quotidienne-2026-10-08.sqlite"]);
    const copie = new DatabaseSync(join(dossier, "sauvegardes", faites[1]!), { readOnly: true });
    assert.equal((copie.prepare("SELECT pseudo FROM comptes").get() as { pseudo: string }).pseudo, "Rose");
    copie.close();
    base.fermer();
  } finally {
    rmSync(dossier, { recursive: true, force: true });
  }
  assert.ok(!existsSync(dossier));
});
