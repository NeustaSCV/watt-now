// La liste des réglages d'équilibrage, leur valeur en cours et leurs bornes (É5, lot 4).
// Usage : npm run reglages [-- --fichier chemin/vers/reglages.json]
// Pour changer un réglage pendant le test : écrire seulement la valeur voulue dans serveur/donnees/reglages.json,
// par exemple { "faim_rythme": 0.8 } ; le serveur la prend en compte en 2 s, sans redémarrer.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DEFINITIONS_REGLAGES, REGLAGES, appliquerReglages } from "../commun/src/reglages.ts";

const i = process.argv.indexOf("--fichier");
const chemin = i >= 0 ? process.argv[i + 1]! : (process.env.WATT_REGLAGES ?? join(import.meta.dirname, "..", "serveur", "donnees", "reglages.json"));
if (existsSync(chemin)) for (const r of appliquerReglages(JSON.parse(readFileSync(chemin, "utf8")))) console.log(`⚠ ${r}`);
console.log(`Fichier : ${chemin}${existsSync(chemin) ? "" : " (absent : tout par défaut)"}\n`);
console.log("| Réglage | En cours | Défaut | Bornes | Ce qu'il fait |\n|---|---|---|---|---|");
for (const [nom, d] of Object.entries(DEFINITIONS_REGLAGES)) {
  const v = REGLAGES[nom as keyof typeof REGLAGES];
  console.log(`| ${nom} | ${v === d.defaut ? v : `**${v}**`} | ${d.defaut} | ${d.min} à ${d.max} | ${d.aide} |`);
}
