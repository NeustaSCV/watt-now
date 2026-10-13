// Copie la livraison de la session « son » (son/LIVRAISON.md §4) dans le client.
// À relancer à chaque nouvelle livraison : `node scripts/copier-effets.mjs` (depuis code/).
// Les masters FLAC ne sont pas copiés ; seuls l'Opus, l'AAC et le manifeste vont au client.

import { cpSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
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

// Les identifiants renommés côté jeu (0.8.2) : « soufflet » est réservé au soufflet de forge, la clé de la forge
// ventilée ; le son du foyer de forge s'appelle « forge_attisee ». Tant que la livraison garde l'ancien nom, on le
// renomme ici (dossier, fichiers, clé du manifeste).
const RENOMMES = { soufflet: "forge_attisee" };
const cheminManifeste = join(assets, "manifeste.json");
const manifeste = JSON.parse(readFileSync(cheminManifeste, "utf8"));
for (const [ancien, nouveau] of Object.entries(RENOMMES)) {
  const son = manifeste.sons?.[ancien];
  if (!son) continue;
  renameSync(join(assets, ancien), join(assets, nouveau));
  for (const f of readdirSync(join(assets, nouveau))) renameSync(join(assets, nouveau, f), join(assets, nouveau, f.replace(ancien, nouveau)));
  son.variantes = son.variantes.map((v) => v.replaceAll(ancien, nouveau));
  delete manifeste.sons[ancien];
  manifeste.sons[nouveau] = son;
}
writeFileSync(cheminManifeste, `${JSON.stringify(manifeste, null, 1)}\n`);

const fichiers = readdirSync(assets, { recursive: true }).filter((f) => AUDIO.has(extname(String(f))));
console.log(`Effets copiés : ${fichiers.length} fichiers, et le manifeste.`);
