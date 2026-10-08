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
