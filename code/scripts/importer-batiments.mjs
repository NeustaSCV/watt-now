// Copie dans le client les modèles des lieux faits par la session « bâtiments » (le gué, le Moulin).
// À relancer à chaque nouvelle livraison d'un modèle : `npm run batiments:importer` (depuis code/), ou
// `npm run batiments:importer -- <dossier batiment>` depuis une copie de travail où batiment/ n'est pas à côté.
// Le dossier batiment/ n'est que LU (il appartient à la session « bâtiments », hors de Git) ; la copie, elle, est
// versionnée avec le jeu, pour que la construction (et l'image Docker) ne dépende pas d'un dossier hors de l'historique.

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const code = join(dirname(fileURLToPath(import.meta.url)), "..");
const batiment = process.argv[2] ? resolve(process.argv[2]) : join(code, "..", "batiment");
const cible = join(code, "client", "src", "batiments");

/** Ce qu'on copie : les modèles du jeu et l'atelier commun dont ils dépendent (pas la visionneuse, ni les vendeurs). */
const A_COPIER = [
  "commun/atelier.js", "halte-gue/modele.js", "halte-gue/atlas.js", "halte-gue/outils.js", "moulin/modele.js",
  // 0.10, chantier J : le Grand Hôtel des Flots (L2A).
  "grand-hotel/modele.js", "grand-hotel/mobilier.js", "grand-hotel/textures.js",
];

for (const chemin of A_COPIER) {
  if (!existsSync(join(batiment, chemin))) {
    console.error(`Introuvable : batiment/${chemin}. La livraison des bâtiments est-elle complète ?`);
    process.exit(1);
  }
}

rmSync(cible, { recursive: true, force: true });
for (const chemin of A_COPIER) {
  mkdirSync(dirname(join(cible, chemin)), { recursive: true });
  cpSync(join(batiment, chemin), join(cible, chemin));
}
// L'atelier prend BufferGeometryUtils dans le dossier vendor/ des bâtiments : dans le jeu, c'est celui de three.
const atelier = join(cible, "commun", "atelier.js");
writeFileSync(atelier, readFileSync(atelier, "utf8").replace('"../vendor/BufferGeometryUtils.js"', '"three/examples/jsm/utils/BufferGeometryUtils.js"'));
writeFileSync(
  join(cible, "LISEZMOI.md"),
  "# Les modèles des bâtiments (copie)\n\nCopiés de `batiment/` par `npm run batiments:importer`. **Ne pas modifier ici** : " +
    "les changements se demandent à la session « bâtiments », puis on relance l'import.\n",
);
console.log(`Copié dans ${cible} : ${A_COPIER.join(", ")}`);
