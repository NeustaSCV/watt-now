// Copie la livraison de la session « son » (son/LIVRAISON.md §4) dans le client.
// À relancer à chaque nouvelle livraison : `node scripts/copier-effets.mjs` (depuis code/).
// Les masters FLAC ne sont pas copiés ; seuls l'Opus, l'AAC et le manifeste vont au client.

import { cpSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const code = join(dirname(fileURLToPath(import.meta.url)), "..");
const effets = join(code, "..", "son", "effets");
const assets = join(code, "client", "public", "assets", "effets");

const AUDIO = new Set([".opus", ".m4a"]);

rmSync(assets, { recursive: true, force: true });
mkdirSync(assets, { recursive: true });
cpSync(effets, assets, {
  recursive: true,
  filter: (src) => statSync(src).isDirectory() || AUDIO.has(extname(src)) || src.endsWith("manifeste.json"),
});

const fichiers = readdirSync(assets, { recursive: true }).filter((f) => AUDIO.has(extname(String(f))));
console.log(`Effets copiés : ${fichiers.length} fichiers, et le manifeste.`);
