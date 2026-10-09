// Copie les trois écrans d'accueil de la session intro (intro/NOTICE-DEV.md §2a) dans le client.
// À relancer à chaque nouvelle livraison de l'intro : `npm run accueil:importer` (depuis code/), ou
// `npm run accueil:importer -- <dossier intro>` depuis une copie de travail où intro/ n'est pas à côté.
// Le dossier intro/ n'est que LU (il appartient à la session intro) ; la copie, elle, est versionnée avec le jeu.
// On ne prend que ce que l'accueil utilise : pas la vidéo, les maquettes, les outils, la musique de la cinématique
// ni ses personnages HD (dans le jeu, l'accueil charge ceux du jeu, depuis /assets/personnages/).

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const code = join(dirname(fileURLToPath(import.meta.url)), "..");
// Par défaut ../intro (à côté de code/) ; sinon le dossier donné : `npm run accueil:importer -- /chemin/vers/intro`.
const intro = process.argv[2] ? resolve(process.argv[2]) : join(code, "..", "intro");
const cible = join(code, "client", "public", "intro");

/** Ce qu'on copie (notice §2a). `src3d/plans/` ne sert qu'au labo de mise au point de l'intro. */
const A_COPIER = ["src", "src3d", "vendor/rendu-jeu.js", "assets/kenney"];
const ECARTES = new Set([join("src3d", "plans")]);

for (const chemin of A_COPIER) {
  if (!existsSync(join(intro, chemin))) {
    console.error(`Introuvable : intro/${chemin}. La livraison de l'intro est-elle complète ?`);
    process.exit(1);
  }
}
if (!existsSync(join(intro, "assets", "kenney", "LICENCE-Kenney.txt"))) {
  console.error("La licence de Kenney (intro/assets/kenney/LICENCE-Kenney.txt) manque : copie refusée.");
  process.exit(1);
}

rmSync(cible, { recursive: true, force: true });
mkdirSync(cible, { recursive: true });
for (const chemin of A_COPIER) {
  cpSync(join(intro, chemin), join(cible, chemin), {
    recursive: true,
    filter: (src) => basename(src) !== ".DS_Store" && !ECARTES.has(relative(intro, src)),
  });
}

// Le poids et le nombre de fichiers, pour le compte rendu et ORIGINE.md.
let octets = 0;
let fichiers = 0;
for (const f of readdirSync(cible, { recursive: true })) {
  const s = statSync(join(cible, String(f)));
  if (s.isFile()) {
    octets += s.size;
    fichiers++;
  }
}
const mo = (octets / 1024 / 1024).toFixed(2).replace(".", ",");
const date = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "long", timeStyle: "short" });

writeFileSync(
  join(cible, "ORIGINE.md"),
  `# Les écrans d'accueil : une copie

Ce dossier est une **copie** de la livraison de la session intro (\`intro/\`, à la racine du projet, non versionné).
**Ne pas le modifier à la main** : corriger dans \`intro/\` (session intro), puis recopier avec
\`npm run accueil:importer\` (depuis \`code/\`).

- Copié le ${date} (heure de Paris), depuis \`intro/\` (session intro).
- Contenu : ${A_COPIER.map((c) => `\`${c.split(sep).join("/")}\``).join(", ")} (sans \`src3d/plans/\`, le labo de mise au point).
- ${fichiers} fichiers, ${mo} Mo.
- Servi sous \`/intro/\` (Vite en développement, \`client/dist/intro/\` en production).
- Mode d'emploi : \`intro/NOTICE-DEV.md\`. Licences : personnages Quaternius (CC0, ceux du jeu), objets Kenney
  (CC0, \`assets/kenney/LICENCE-Kenney.txt\`), three.js (MIT, dans \`vendor/rendu-jeu.js\`).
`,
);

console.log(`Accueil copié dans client/public/intro/ : ${fichiers} fichiers, ${mo} Mo.`);
