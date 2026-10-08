// Copie la livraison de la session musique (musique/LIVRAISON.md §2) dans le client.
// À relancer à chaque nouvelle livraison : `node scripts/copier-musique.mjs` (depuis code/).
// Les masters et les WAV ne sont pas copiés ; seuls l'Opus et l'AAC vont au client.

import { cpSync, mkdirSync, rmSync, statSync, readdirSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const code = join(dirname(fileURLToPath(import.meta.url)), "..");
const musique = join(code, "..", "musique");
const assets = join(code, "client", "public", "assets", "musique");
const audio = join(code, "client", "src", "audio");

const AUDIO = new Set([".opus", ".m4a"]);

rmSync(assets, { recursive: true, force: true });
mkdirSync(assets, { recursive: true });
mkdirSync(audio, { recursive: true });

for (const f of ["manifeste.json", "manifeste-mobile.json"]) cpSync(join(musique, "production", f), join(assets, f));
for (const d of ["jeu", "mobile"]) {
  cpSync(join(musique, "production", d), join(assets, d), {
    recursive: true,
    filter: (src) => statSync(src).isDirectory() || AUDIO.has(extname(src)),
  });
}
for (const f of ["moteur-couches.js", "directeur.js"]) cpSync(join(musique, "moteur", f), join(audio, f));

const compter = (d) => readdirSync(d, { recursive: true }).filter((f) => AUDIO.has(extname(String(f)))).length;
console.log(`Musique copiée : ${compter(join(assets, "jeu"))} fichiers (ordinateur), ${compter(join(assets, "mobile"))} (mobile) ; moteur dans client/src/audio/.`);
