// Les fichiers du jeu partent compressés et se gardent en cache (2026-10-08) : la plus petite empreinte réseau.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { demarrerServeur } from "./serveur.ts";

test("code compressé et gardé un an ; musique revérifiée par étiquette (304) ; page toujours revérifiée", async () => {
  // Dans le dossier du projet (jamais dans un dossier temporaire du système).
  const dossier = join(import.meta.dirname, "..", "donnees", "essais-client");
  rmSync(dossier, { recursive: true, force: true });
  mkdirSync(join(dossier, "assets", "musique"), { recursive: true });
  const code = "const jeu = 1;\n".repeat(2000);
  writeFileSync(join(dossier, "index.html"), "<!doctype html><title>Watt Now?</title>");
  writeFileSync(join(dossier, "assets", "index-AbCd1234.js"), code);
  writeFileSync(join(dossier, "assets", "musique", "theme.ogg"), Buffer.alloc(5000, 7));
  const serveur = await demarrerServeur({ port: 0, hote: "127.0.0.1", cheminBase: ":memory:", dossierClient: dossier });
  try {
    const base = `http://127.0.0.1:${serveur.port}`;
    const js = await fetch(`${base}/assets/index-AbCd1234.js`, { headers: { "Accept-Encoding": "br" } });
    assert.equal(js.headers.get("cache-control"), "public, max-age=31536000, immutable");
    // fetch décompresse tout seul : on vérifie le contenu, et la taille compressée via l'en-tête.
    assert.equal(js.headers.get("content-encoding"), "br");
    assert.equal(await js.text(), code);

    const ogg = await fetch(`${base}/assets/musique/theme.ogg`);
    assert.equal(ogg.headers.get("cache-control"), "public, max-age=86400");
    const etiquette = ogg.headers.get("etag")!;
    await ogg.arrayBuffer();
    const encore = await fetch(`${base}/assets/musique/theme.ogg`, { headers: { "If-None-Match": etiquette } });
    assert.equal(encore.status, 304, "pas changé : rien à retélécharger");

    const page = await fetch(`${base}/`);
    assert.equal(page.headers.get("cache-control"), "no-cache");
  } finally {
    await serveur.fermer();
    rmSync(dossier, { recursive: true, force: true });
  }
});

test("écrans d'accueil (/intro/) : modules revérifiés à chaque fois, fichier absent en 404 (pas la page du jeu)", async () => {
  const dossier = join(import.meta.dirname, "..", "donnees", "essais-client-intro");
  rmSync(dossier, { recursive: true, force: true });
  mkdirSync(join(dossier, "intro", "src"), { recursive: true });
  mkdirSync(join(dossier, "intro", "assets", "kenney"), { recursive: true });
  writeFileSync(join(dossier, "index.html"), "<!doctype html><title>Watt Now?</title>");
  writeFileSync(join(dossier, "intro", "src", "intro.js"), "export async function jouerAccueil() {}\n");
  writeFileSync(join(dossier, "intro", "assets", "kenney", "box.glb"), Buffer.alloc(300, 1));
  const serveur = await demarrerServeur({ port: 0, hote: "127.0.0.1", cheminBase: ":memory:", dossierClient: dossier });
  try {
    const base = `http://127.0.0.1:${serveur.port}`;
    const module = await fetch(`${base}/intro/src/intro.js`);
    assert.equal(module.status, 200);
    assert.match(module.headers.get("content-type") ?? "", /javascript/);
    assert.equal(module.headers.get("cache-control"), "no-cache", "une nouvelle livraison ne mélange pas deux versions");
    assert.match(await module.text(), /jouerAccueil/);

    const objet = await fetch(`${base}/intro/assets/kenney/box.glb`);
    assert.equal(objet.headers.get("cache-control"), "public, max-age=86400");
    await objet.arrayBuffer();

    const absent = await fetch(`${base}/intro/assets/personnages/animations_intro_1.glb`);
    assert.equal(absent.status, 404);
    await absent.arrayBuffer();
    // Ailleurs, une adresse inconnue donne toujours la page du jeu.
    assert.equal((await fetch(`${base}/une/page`)).status, 200);
  } finally {
    await serveur.fermer();
    rmSync(dossier, { recursive: true, force: true });
  }
});
