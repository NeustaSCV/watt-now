// Le tableau d'équilibre des armes de métier (Book 25 §8.4, chantier 9), rejoué par le simulateur, en Markdown.
// Usage : npm run equilibre [-- --etape maison|H1|L1] [-- --reglages chemin/vers/reglages.json]
// Sans `--etape`, le tableau du §8.4 (★, ★★, ★★★) et son garde-fou à ★★★. Avec `--etape`, le garde-fou rejoué avec
// les armes que chaque famille fait seule à cette étape (la grille, plan 0.8 §2.4) : OK, ou les fautes.
// Par défaut, il lit les réglages du serveur (`serveur/donnees/reglages.json`, s'il existe) : on essaie une valeur
// dans le fichier, on relance, et l'on voit tout de suite si le garde-fou tient encore.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { appliquerReglages, reglagesChanges } from "../commun/src/reglages.ts";
import { ETAPES_EQUILIBRE, NOMS_FAMILLES_ARMES, SCENARIOS, gardeFou, gardeFouEtape, martelementTexte, tableau, tableauEtape, tableauTexte, type EtapeEquilibre, type Verdict } from "../commun/src/equilibre.ts";
import { REGLAGES } from "../commun/src/reglages.ts";

const args = process.argv.slice(2);
const i = args.indexOf("--reglages");
const chemin = i >= 0 ? args[i + 1]! : join(import.meta.dirname, "..", "serveur", "donnees", "reglages.json");
if (existsSync(chemin)) {
  for (const r of appliquerReglages(JSON.parse(readFileSync(chemin, "utf8")))) console.error(`Réglages : ${r}`);
}
const j = args.indexOf("--etape");
const etape = j >= 0 ? args[j + 1] : undefined;
if (etape !== undefined && !ETAPES_EQUILIBRE.includes(etape as EtapeEquilibre)) {
  console.error(`Étape inconnue « ${etape} » : ${ETAPES_EQUILIBRE.join(", ")}.`);
  process.exit(2);
}
const changes = Object.entries(reglagesChanges()).filter(([n]) => n.startsWith("equilibre_") || n === "equipe_vacille_un_sur");

const virgule = (x: number) => (Number.isFinite(x) ? x.toFixed(2).replace(".", ",") : "—");
const lignes = etape ? tableauEtape(etape as EtapeEquilibre) : tableau();
const verdict: Verdict = etape ? gardeFouEtape(etape as EtapeEquilibre, lignes) : gardeFou(lignes);
const { fautes, rapports } = verdict;
const sortie: string[] = [etape ? `# L'équilibre des armes à l'étape ${etape} (plan 0.8 §2.4, la grille)` : "# L'équilibre des armes de métier (Book 25 §8.4)", ""];
sortie.push(changes.length ? `Réglages d'équilibre : ${changes.map(([n, v]) => `${n} = ${v}`).join(", ")}.` : "Réglages d'équilibre : tous par défaut.");
sortie.push("", "## Chaque arme seule", "", tableauTexte(lignes), "", "## Avec sa seconde arme (le marteau pour la lame, la lance pour l'arbalète et l'arc)", "", tableauTexte(lignes, true));
sortie.push("", etape ? `## Le garde-fou, à l'étape ${etape}` : "## Le garde-fou, à ★★★", "");
sortie.push("| Terrain | Arme | Rapport à la meilleure |", "|---|---|---|");
for (const r of rapports) {
  sortie.push(`| ${SCENARIOS[r.scenario].titre} | ${NOMS_FAMILLES_ARMES[r.famille]}${r.avecSeconde ? " (avec sa seconde arme)" : ""} | ${virgule(r.rapport)} |`);
}
sortie.push("", `Pire rapport hors terrain : ${virgule(verdict.pireRapport)} (au plus 2) ; écart de coût par Errant : ${virgule(verdict.ecartCout)} fois (au plus 3).`);
// Le martèlement (plan 0.9 §3.3) : A sans arrêt, sans esquiver ni repousser, face à un Errant puis à un Équipé.
sortie.push("", `## Le martèlement (plan 0.9 §3.3) : l'Équipé vacille un coup sur ${REGLAGES.equipe_vacille_un_sur}`, "", martelementTexte());
sortie.push("", fautes.length ? `**Faute : le garde-fou ne tient pas.**\n${fautes.map((f) => `- ${f}`).join("\n")}` : "**OK : le garde-fou tient.**");
console.log(sortie.join("\n"));
process.exitCode = fautes.length ? 1 : 0;
