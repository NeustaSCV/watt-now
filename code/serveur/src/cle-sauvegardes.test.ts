// La copie des sauvegardes sur la clé USB du Pi (Book 17 §5.4, 0.7).

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Base } from "./base.ts";
import { Sauvegardes } from "./sauvegardes.ts";
import { FICHIER_ETAT_CLE, REPERE_CLE, aSupprimerSurCle, nomMensuelle, resumeEtatCle } from "./cle-sauvegardes.ts";
import { rendreSilencieux } from "./journal.ts";

// Des dossiers jetables dans .claude-travail/ (jamais dans un dossier temporaire du système).
const TRAVAIL = join(import.meta.dirname, "..", "..", "..", ".claude-travail", "essais-cle");

/** Un Pi miniature : une base avec un compte, des réglages, un certificat, et une « clé ». */
function installer(nom: string, repere: boolean) {
  const racine = join(TRAVAIL, nom);
  rmSync(racine, { recursive: true, force: true });
  const donnees = join(racine, "donnees");
  const cle = join(racine, "cle");
  mkdirSync(join(donnees, "certificat"), { recursive: true });
  mkdirSync(cle, { recursive: true });
  if (repere) writeFileSync(join(cle, REPERE_CLE), "");
  writeFileSync(join(donnees, "reglages.json"), '{ "faim_rythme": 0.8 }');
  writeFileSync(join(donnees, "certificat", "fullchain.pem"), "CERTIFICAT");
  writeFileSync(join(donnees, "certificat", "privkey.pem"), "CLE PRIVEE");
  const base = new Base(join(donnees, "watt.sqlite"));
  base.creerCompte("Rose", "potager42", "mecanistes");
  const sauvegardes = new Sauvegardes(base, join(donnees, "sauvegardes"), {
    dossier: cle,
    reglages: join(donnees, "reglages.json"),
    certificat: join(donnees, "certificat"),
  });
  return { racine, donnees, cle, base, sauvegardes };
}

test("nom de la mensuelle ; sur la clé on garde 30 quotidiennes, 26 hebdomadaires, 24 mensuelles", () => {
  assert.equal(nomMensuelle("quotidienne-2026-10-08.sqlite"), "mensuelle-2026-10.sqlite");
  assert.equal(nomMensuelle("hebdomadaire-2026-S41.sqlite"), null);
  const fichiers = [
    ...Array.from({ length: 33 }, (_, i) => `quotidienne-2026-${String(Math.floor(i / 28) + 8).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}.sqlite`),
    ...Array.from({ length: 28 }, (_, i) => `hebdomadaire-2026-S${String(i + 10).padStart(2, "0")}.sqlite`),
    ...Array.from({ length: 25 }, (_, i) => `mensuelle-${2024 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}.sqlite`),
    "reglages.json",
  ];
  assert.deepEqual(aSupprimerSurCle(fichiers).sort(), [
    "hebdomadaire-2026-S10.sqlite",
    "hebdomadaire-2026-S11.sqlite",
    "mensuelle-2024-01.sqlite",
    "quotidienne-2026-08-01.sqlite",
    "quotidienne-2026-08-02.sqlite",
    "quotidienne-2026-08-03.sqlite",
  ]);
});

test("repère absent (clé débranchée) : rien n'est écrit, l'état le dit", async () => {
  rendreSilencieux(true);
  const { racine, donnees, cle, base, sauvegardes } = installer("sans-repere", false);
  try {
    const etat = await sauvegardes.verifier(new Date("2026-10-08T03:00:00Z"));
    assert.equal(etat?.etat, "absente");
    assert.deepEqual(readdirSync(cle), [], "rien sur la « clé »");
    // La sauvegarde du Pi, elle, est bien faite.
    assert.ok(existsSync(join(donnees, "sauvegardes", "quotidienne-2026-10-08.sqlite")));
    const lu = JSON.parse(readFileSync(join(donnees, "sauvegardes", FICHIER_ETAT_CLE), "utf8"));
    assert.equal(lu.etat, "absente");
    assert.match(resumeEtatCle(lu), /jamais copiée.*absente/);
  } finally {
    base.fermer();
    rmSync(racine, { recursive: true, force: true });
    rendreSilencieux(false);
  }
});

test("repère présent : sauvegardes, mensuelle, réglages et certificat copiés ; rétention sur la clé", async () => {
  rendreSilencieux(true);
  const { racine, donnees, cle, base, sauvegardes } = installer("avec-repere", true);
  try {
    // La clé a déjà un long passé : 35 quotidiennes, 28 hebdomadaires, 25 mensuelles (et un reste de copie interrompue).
    const surCle = join(cle, "sauvegardes");
    mkdirSync(surCle);
    for (let i = 0; i < 35; i++) writeFileSync(join(surCle, `quotidienne-2026-0${7 + Math.floor(i / 28)}-${String((i % 28) + 1).padStart(2, "0")}.sqlite`), "x");
    for (let i = 0; i < 28; i++) writeFileSync(join(surCle, `hebdomadaire-2026-S${String(i + 10).padStart(2, "0")}.sqlite`), "x");
    for (let i = 0; i < 25; i++) writeFileSync(join(surCle, `mensuelle-${2024 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}.sqlite`), "x");
    writeFileSync(join(surCle, "quotidienne-2026-10-07.sqlite.partiel"), "à moitié");

    const maintenant = new Date("2026-10-08T03:00:00Z");
    const etat = await sauvegardes.verifier(maintenant);
    assert.equal(etat?.etat, "ok", etat?.message ?? "");
    assert.deepEqual(etat?.copies.slice().sort(), [
      "certificat/fullchain.pem",
      "certificat/privkey.pem",
      "hebdomadaire-2026-S41.sqlite",
      "mensuelle-2026-10.sqlite",
      "quotidienne-2026-10-08.sqlite",
      "reglages.json",
    ]);
    assert.ok(etat!.octets > 0);
    assert.equal(etat?.derniereCopie, maintenant.getTime());

    const fichiers = readdirSync(surCle);
    const compter = (p: string) => fichiers.filter((f) => f.startsWith(p)).length;
    assert.equal(compter("quotidienne-"), 30);
    assert.equal(compter("hebdomadaire-"), 26);
    assert.equal(compter("mensuelle-"), 24);
    assert.ok(!fichiers.some((f) => f.endsWith(".partiel")), "plus de reste de copie");
    assert.ok(fichiers.includes("quotidienne-2026-10-08.sqlite"));
    assert.ok(!fichiers.includes("mensuelle-2024-01.sqlite"));

    // La copie est une vraie base, lisible.
    const copie = new DatabaseSync(join(surCle, "mensuelle-2026-10.sqlite"), { readOnly: true });
    assert.equal((copie.prepare("SELECT pseudo FROM comptes").get() as { pseudo: string }).pseudo, "Rose");
    copie.close();
    assert.equal(readFileSync(join(cle, "reglages.json"), "utf8"), '{ "faim_rythme": 0.8 }');
    assert.equal(readFileSync(join(cle, "certificat", "privkey.pem"), "utf8"), "CLE PRIVEE");

    // Une heure plus tard : rien de nouveau à copier.
    const ensuite = await sauvegardes.verifier(new Date("2026-10-08T04:00:00Z"));
    assert.equal(ensuite?.etat, "ok");
    assert.deepEqual(ensuite?.copies, []);
    assert.equal(ensuite?.derniereCopie, maintenant.getTime(), "la dernière copie reste celle de 3 h");
    assert.match(resumeEtatCle(ensuite, maintenant.getTime() + 5 * 3_600_000), /^clé : dernière copie il y a 5 h/);

    // Des réglages changés sont recopiés à la vérification suivante.
    writeFileSync(join(donnees, "reglages.json"), '{ "faim_rythme": 1.2, "eteints_terrain_max": 2 }');
    const apres = await sauvegardes.verifier(new Date("2026-10-08T05:00:00Z"));
    assert.deepEqual(apres?.copies, ["reglages.json"]);
  } finally {
    base.fermer();
    rmSync(racine, { recursive: true, force: true });
    rendreSilencieux(false);
  }
});

test("erreur d'écriture sur la clé : pas de plantage, l'état le dit, la sauvegarde du Pi est faite", async () => {
  rendreSilencieux(true);
  const { racine, donnees, cle, base, sauvegardes } = installer("erreur", true);
  try {
    // « sauvegardes » est un fichier sur la clé : impossible d'y créer le dossier.
    writeFileSync(join(cle, "sauvegardes"), "pas un dossier");
    const etat = await sauvegardes.verifier(new Date("2026-10-08T03:00:00Z"));
    assert.equal(etat?.etat, "erreur");
    assert.ok(etat?.message);
    assert.equal(etat?.derniereCopie, undefined);
    assert.ok(existsSync(join(donnees, "sauvegardes", "quotidienne-2026-10-08.sqlite")));
  } finally {
    base.fermer();
    rmSync(racine, { recursive: true, force: true });
    rendreSilencieux(false);
  }
});

test("sans clé configurée : les sauvegardes marchent comme avant", async () => {
  const racine = join(TRAVAIL, "sans-cle");
  rmSync(racine, { recursive: true, force: true });
  mkdirSync(racine, { recursive: true });
  rendreSilencieux(true);
  const base = new Base(join(racine, "watt.sqlite"));
  try {
    const s = new Sauvegardes(base, join(racine, "sauvegardes"));
    assert.equal(s.cle, null);
    assert.equal(await s.verifier(new Date("2026-10-08T03:00:00Z")), null);
    assert.deepEqual(readdirSync(join(racine, "sauvegardes")).sort(), ["hebdomadaire-2026-S41.sqlite", "quotidienne-2026-10-08.sqlite"]);
  } finally {
    base.fermer();
    rmSync(racine, { recursive: true, force: true });
    rendreSilencieux(false);
  }
});
