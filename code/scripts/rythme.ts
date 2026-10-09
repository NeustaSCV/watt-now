// Le rythme de l'arbre de progression (décision Q5), rejoué par le simulateur, en Markdown.
// Usage : npm run rythme [-- --detail]   (--detail : la chronologie complète de chaque parcours)
// Il joue les parcours types (prudent, pressé, sans tutoriel ; chacune des trois familles), chiffre le temps entre deux
// recettes dévoilées et entre deux buts, et dit ce qui bloque. Il rend 1 si la cible n'est pas tenue.

import { CIBLE, HORIZON_MIN, PROFILS, ecartsALaCible, tousLesParcours, type ResultatParcours } from "../commun/src/rythme.ts";
import { nomDevoile } from "../commun/src/progression.ts";

const detail = process.argv.includes("--detail");
const parcours = tousLesParcours();
const nombre = (x: number) => (Math.round(x * 10) / 10).toString().replace(".", ",");
const NOMS_FAMILLES = { charbonniers: "🔥 Charbonniers", voltaiques: "⚡ Voltaïques", mecanistes: "⚙️ Mécanistes" } as const;

const sortie: string[] = ["# Le rythme de l'arbre de progression (décision Q5)", ""];
sortie.push(
  `Cible : dans les ${CIBLE.debutMin} premières minutes, **${CIBLE.nouveautesDebutMin} nouveautés** au moins (recette dévoilée ou but nouveau : une toutes les 3 min en moyenne) et jamais **${CIBLE.trouDebutMax} min** sans rien ; puis un but nouveau au moins toutes les **${CIBLE.ecartButsMax} min** jusqu'au dernier objectif du carnet. Au pas du joueur : le prudent (×${String(PROFILS.prudent.facteur).replace(".", ",")}) a d'autant plus de marge ; le vétéran qui saute le tutoriel n'a que la cible des buts. Durée simulée : ${HORIZON_MIN} min de jeu connecté.`,
  "",
  "| Parcours | Famille | Nouveautés (30 min) | Écart max (30 min) | Recettes (30 min) | Écart max entre recettes (30 min) | Écart max entre buts ensuite | Dernier but | Quêtes finies | Recettes en tout |",
  "|---|---|---|---|---|---|---|---|---|---|",
);
for (const r of parcours) {
  const m = r.mesures;
  sortie.push(
    `| ${PROFILS[r.profil].nom} | ${NOMS_FAMILLES[r.famille]} | ${m.nouveautesDebut} | ${nombre(m.ecartNouveautesDebut)} min | ${m.recettesDebut} | ${nombre(m.ecartRecettesDebut)} min | ${nombre(m.ecartButsEnsuite)} min | ${nombre(m.dernierBut)} min | ${m.quetesFinies} | ${m.recettes} |`,
  );
}

const fautes = parcours.flatMap(ecartsALaCible);
const blocages = [...new Set(parcours.flatMap((r) => r.blocages))];
sortie.push("", "## Ce qui bloque", "", blocages.length ? blocages.map((b) => `- ${b}`).join("\n") : "Aucun parcours ne bloque : chaque recette demandée est dévoilée à temps, chaque ingrédient se trouve.");
const attentes = parcours.flatMap((r) => Object.entries(r.attentes).map(([q, m]) => `- ${PROFILS[r.profil].nom}, ${r.famille} : « ${q} » a attendu ${nombre(m)} min une recette`));
if (attentes.length) sortie.push("", "Attentes d'un dévoilement :", ...attentes);
sortie.push("", "## La cible", "", fautes.length ? `**Le rythme ne tient pas :**\n${fautes.map((f) => `- ${f}`).join("\n")}` : "**Le rythme tient.**");

function chronologie(r: ResultatParcours): string[] {
  const lignes = [`### ${PROFILS[r.profil].nom}, ${NOMS_FAMILLES[r.famille]}`, ""];
  for (const e of r.evenements) {
    if (!detail && e.minute > CIBLE.debutMin && e.genre === "recette") continue;
    const quoi = e.genre === "recette" ? `💡 ${e.quoi.map(nomDevoile).join(", ")}` : `📓 ${e.quoi.join(", ")}`;
    lignes.push(`- **${nombre(e.minute)}** · ${quoi}`);
  }
  return [...lignes, ""];
}
sortie.push("", "## Les chronologies", "", detail ? "Chaque nouveauté, minute par minute." : "Les recettes de la première demi-heure, puis les buts seulement (`-- --detail` : tout).", "");
for (const r of parcours) sortie.push(...chronologie(r));

console.log(sortie.join("\n"));
process.exitCode = fautes.length || blocages.length ? 1 : 0;
