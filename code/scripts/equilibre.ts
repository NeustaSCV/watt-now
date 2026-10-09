// Le tableau d'équilibre des armes de métier (Book 25 §8.4, chantier 9), rejoué par le simulateur, en Markdown.
// Usage : npm run equilibre [-- --reglages chemin/vers/reglages.json]
// Par défaut, il lit les réglages du serveur (`serveur/donnees/reglages.json`, s'il existe) : on essaie une valeur
// dans le fichier, on relance, et l'on voit tout de suite si le garde-fou tient encore.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { appliquerReglages, reglagesChanges } from "../commun/src/reglages.ts";
import { NOMS_FAMILLES_ARMES, SCENARIOS, gardeFou, tableau, tableauTexte } from "../commun/src/equilibre.ts";

const args = process.argv.slice(2);
const i = args.indexOf("--reglages");
const chemin = i >= 0 ? args[i + 1]! : join(import.meta.dirname, "..", "serveur", "donnees", "reglages.json");
if (existsSync(chemin)) {
  for (const r of appliquerReglages(JSON.parse(readFileSync(chemin, "utf8")))) console.error(`Réglages : ${r}`);
}
const changes = Object.entries(reglagesChanges()).filter(([n]) => n.startsWith("equilibre_"));

const lignes = tableau();
const { fautes, rapports } = gardeFou(lignes);
const sortie: string[] = ["# L'équilibre des armes de métier (Book 25 §8.4)", ""];
sortie.push(changes.length ? `Réglages d'équilibre : ${changes.map(([n, v]) => `${n} = ${v}`).join(", ")}.` : "Réglages d'équilibre : tous par défaut.");
sortie.push("", "## Chaque arme seule", "", tableauTexte(lignes), "", "## Avec sa seconde arme (le marteau pour la lame, la lance pour l'arbalète et l'arc)", "", tableauTexte(lignes, true));
sortie.push("", "## Le garde-fou, à ★★★", "");
sortie.push("| Terrain | Arme | Rapport à la meilleure |", "|---|---|---|");
for (const r of rapports) {
  const x = Number.isFinite(r.rapport) ? r.rapport.toFixed(2).replace(".", ",") : "—";
  sortie.push(`| ${SCENARIOS[r.scenario].titre} | ${NOMS_FAMILLES_ARMES[r.famille]}${r.avecSeconde ? " (avec sa seconde arme)" : ""} | ${x} |`);
}
sortie.push("", fautes.length ? `**Le garde-fou ne tient pas :**\n${fautes.map((f) => `- ${f}`).join("\n")}` : "**Le garde-fou tient.**");
console.log(sortie.join("\n"));
process.exitCode = fautes.length ? 1 : 0;
